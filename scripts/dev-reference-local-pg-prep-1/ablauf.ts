// scripts/dev-reference-local-pg-prep-1/ablauf.ts
//
// Zweistufiger Schreibablauf: erst public.airports, dann public.places.
//
// - Ein Journal pro Lauf, exklusiv angelegt. Liegt es schon vor, startet
//   nichts: kein zweiter Writer, kein stiller Neuversuch nach Teilabbruch.
// - Eine psql-Sitzung pro Lauf, sitzungsweites Advisory Lock.
// - Vorprüfung vor jedem Schreiben: Ziel, TLS, Schema, leerer Bestand.
// - Der Owner bestätigt jede Stufe durch Eintippen.
// - Jeder Stapel committet einzeln. Bei einem Fehler: Stufe und Stapel ins
//   Journal, STOP. Kein Retry, kein Rollback bereits committeter Stapel.

import { closeSync, openSync, writeFileSync } from 'node:fs'

import type { FlughafenImportZeile } from '@/lib/airports/importieren'
import type { Ort } from '@/lib/places/domain'

import { einzeiligesJson, type Sitzung } from './psql'
import type { Herkunft } from './quelle'
import {
  FLUGHAEFEN_LESEN_SQL,
  FLUGHAEFEN_PRUEFEN_SQL,
  FLUGHAFEN_BEISPIELE,
  FLUGHAFEN_SPALTEN,
  ORTE_PRUEFEN_SQL,
  ORT_SPALTEN,
  SITZUNG_SQL,
  STAPEL,
  VORPRUEFUNG_SQL,
  flughaefenLesenSchema,
  flughaefenPruefenSchema,
  flughafenOrte,
  flughafenStapel,
  inStapel,
  ortStapel,
  orteMitFlughaefen,
  ortePruefenSchema,
  sperreSchema,
  stapelAntwortSchema,
  vorpruefungSchema,
  type Stapel,
  type Vorpruefung,
} from './sql'
import { ZIEL, type Stufe } from './ziel'

export type Grenzen = {
  minFlughaefen: number
  maxFlughaefen: number
  minGeonamesOrte: number
  maxOrte: number
}

// Owner-Probeläufe vom 17. Oktober 2026: 5'332 Flughäfen, 119'833 GeoNames-Orte.
export const GRENZEN: Grenzen = {
  minFlughaefen: 3_000,
  maxFlughaefen: 10_000,
  minGeonamesOrte: 80_000,
  maxOrte: 200_000,
}

export type Abhaengigkeiten = {
  sitzungStarten: () => Sitzung
  bestaetigen: (frage: string) => Promise<string>
  ausgabe: (zeile: string) => void
  journalPfad: string
  grenzen: Grenzen
}

export type Eingaben = {
  stufe: Stufe
  flughaefen: FlughafenImportZeile[] | null
  geonamesOrte: Ort[] | null
  herkunft: Herkunft[]
}

type Journal = {
  ziel: string
  stufe: Stufe
  status: 'gestartet' | 'abgeschlossen' | 'abgebrochen'
  aktuelleStufe: 'vorpruefung' | 'flughaefen' | 'orte' | 'fertig'
  geplant: { flughaefen: number | null; orte: number | null }
  stapelFertig: { flughaefen: number; orte: number }
  vorher: { flughaefen: number; orte: number } | null
  herkunft: Herkunft[]
  meldung: string | null
  aktualisiert: string
}

function abbruch(meldung: string): never {
  throw new Error(`Abgebrochen: ${meldung}`)
}

function journalAnlegen(pfad: string, journal: Journal): void {
  let fd: number
  try {
    fd = openSync(pfad, 'wx', 0o600)
  } catch {
    abbruch(
      'Journal existiert bereits. Ein zweiter Lauf oder ein Neuversuch nach Teilabbruch ' +
        'braucht eine neue, geprüfte Entscheidung.',
    )
  }
  writeFileSync(fd, `${JSON.stringify(journal, null, 2)}\n`)
  closeSync(fd)
}

function journalSchreiben(pfad: string, journal: Journal): void {
  journal.aktualisiert = new Date().toISOString()
  writeFileSync(pfad, `${JSON.stringify(journal, null, 2)}\n`, { mode: 0o600 })
}

function planPruefen(eingaben: Eingaben, grenzen: Grenzen): void {
  if (eingaben.stufe !== 'orte') {
    const zeilen = eingaben.flughaefen ?? abbruch('Flughafen-Quelle fehlt.')
    if (zeilen.length < grenzen.minFlughaefen || zeilen.length > grenzen.maxFlughaefen) {
      abbruch(`${zeilen.length} Flughäfen liegen ausserhalb ${grenzen.minFlughaefen}–${grenzen.maxFlughaefen}.`)
    }
    const codes = new Set(zeilen.map((zeile) => zeile.iata))
    if (codes.size !== zeilen.length) abbruch('doppelte IATA-Codes in der Quelle.')
    const fehlend = FLUGHAFEN_BEISPIELE.filter((code) => !codes.has(code))
    if (fehlend.length > 0) abbruch(`Pflichtcodes fehlen nach dem Filter: ${fehlend.join(', ')}`)
  }
  if (eingaben.stufe !== 'flughaefen') {
    const orte = eingaben.geonamesOrte ?? abbruch('Orts-Quelle fehlt.')
    if (orte.length < grenzen.minGeonamesOrte || orte.length > grenzen.maxOrte) {
      abbruch(`${orte.length} GeoNames-Orte liegen ausserhalb ${grenzen.minGeonamesOrte}–${grenzen.maxOrte}.`)
    }
    const japan = orte.some((ort) => ort.typ === 'country' && ort.countryCode === 'JP' && ort.name === 'Japan')
    const zuerich = orte.some(
      (ort) => ort.typ === 'city' && ort.countryCode === 'CH' && (ort.name === 'Zürich' || ort.name === 'Zurich'),
    )
    if (!japan || !zuerich) abbruch('Japan (Land) oder Zürich (Stadt) fehlt in der GeoNames-Quelle.')
  }
}

function vorpruefungBewerten(v: Vorpruefung, stufe: Stufe, grenzen: Grenzen): void {
  if (v.datenbank !== ZIEL.datenbank || v.benutzer !== ZIEL.benutzer) abbruch('unerwartete Datenbank oder Rolle.')
  if (v.replik) abbruch('Ziel ist eine Read-Replik.')
  if (!v.ssl) abbruch('Verbindung ist nicht TLS-verschlüsselt.')
  if (v.standardStrings !== 'on') abbruch('standard_conforming_strings ist nicht on.')
  const fehlendF = FLUGHAFEN_SPALTEN.filter((spalte) => !v.flughafenSpalten.includes(spalte))
  const fehlendO = ORT_SPALTEN.filter((spalte) => !v.ortSpalten.includes(spalte))
  if (fehlendF.length > 0 || fehlendO.length > 0) {
    abbruch(`erwartete Spalten fehlen: ${[...fehlendF, ...fehlendO].join(', ')}`)
  }
  if (v.orte !== 0) abbruch(`public.places enthält bereits ${v.orte} Zeilen. Erster Import erwartet 0.`)
  if (stufe === 'orte') {
    if (v.flughaefen < grenzen.minFlughaefen) {
      abbruch(`public.airports hat ${v.flughaefen} Zeilen. Die Orts-Stufe braucht die Flughafen-Stufe zuerst.`)
    }
  } else if (v.flughaefen !== 0) {
    abbruch(`public.airports enthält bereits ${v.flughaefen} Zeilen. Erster Import erwartet 0.`)
  }
}

async function json<T>(sitzung: Sitzung, sql: string, schema: { parse: (wert: unknown) => T }): Promise<T> {
  const zeilen = await sitzung.senden(sql)
  try {
    return schema.parse(einzeiligesJson(zeilen))
  } catch (err) {
    if (err instanceof Error && err.message.startsWith('Abgebrochen:')) throw err
    abbruch('psql-Antwort hat nicht die erwartete Form.')
  }
}

async function stapelSenden(
  sitzung: Sitzung,
  stapel: Stapel[],
  fertig: (nummer: number) => void,
  ausgabe: (zeile: string) => void,
): Promise<void> {
  for (const stueck of stapel) {
    const antwort = await json(sitzung, stueck.sql, stapelAntwortSchema)
    if (antwort.n !== stueck.zeilen) {
      abbruch(`${stueck.art}-Stapel ${stueck.nummer}: ${antwort.n} statt ${stueck.zeilen} Zeilen gemeldet.`)
    }
    fertig(stueck.nummer)
    ausgabe(
      `  ${stueck.art} ${(stueck.nummer - 1) * STAPEL + stueck.zeilen} geschrieben (Stapel ${stueck.nummer}/${stapel.length})`,
    )
  }
}

export async function ablaufen(eingaben: Eingaben, abh: Abhaengigkeiten): Promise<void> {
  const { ausgabe, grenzen, journalPfad } = abh
  planPruefen(eingaben, grenzen)

  const journal: Journal = {
    ziel: `${ZIEL.host}:${ZIEL.port}/${ZIEL.datenbank}`,
    stufe: eingaben.stufe,
    status: 'gestartet',
    aktuelleStufe: 'vorpruefung',
    geplant: { flughaefen: eingaben.flughaefen?.length ?? null, orte: null },
    stapelFertig: { flughaefen: 0, orte: 0 },
    vorher: null,
    herkunft: eingaben.herkunft,
    meldung: null,
    aktualisiert: new Date().toISOString(),
  }
  journalAnlegen(journalPfad, journal)

  const sitzung = abh.sitzungStarten()
  try {
    await json(sitzung, SITZUNG_SQL, sperreSchema).catch((err: unknown) => {
      if (err instanceof Error && /erwartete Form/.test(err.message)) {
        abbruch('Advisory Lock nicht erhalten. Läuft bereits ein anderer Import?')
      }
      throw err
    })

    const vorher = await json(sitzung, VORPRUEFUNG_SQL, vorpruefungSchema)
    journal.vorher = { flughaefen: vorher.flughaefen, orte: vorher.orte }
    journalSchreiben(journalPfad, journal)
    ausgabe(`Ziel: ${journal.ziel} (TLS ${vorher.ssl ? 'ja' : 'nein'}, Server ${vorher.serverVersion})`)
    ausgabe(`Bestand vorher: airports ${vorher.flughaefen}, places ${vorher.orte}`)
    vorpruefungBewerten(vorher, eingaben.stufe, grenzen)

    if (eingaben.stufe !== 'orte') {
      const zeilen = eingaben.flughaefen ?? abbruch('Flughafen-Quelle fehlt.')
      const stapel = inStapel(zeilen, flughafenStapel)
      const antwort = await abh.bestaetigen(
        `Stufe 1: ${zeilen.length} Flughäfen in ${stapel.length} Stapeln nach ${ZIEL.host}. ` +
          `Branch, Backup-Stand und Ressourcen im Dashboard geprüft? Zum Start "${ZIEL.projektRef}" eintippen: `,
      )
      if (antwort.trim() !== ZIEL.projektRef) abbruch('Owner-Bestätigung fehlt. Nichts geschrieben.')

      journal.aktuelleStufe = 'flughaefen'
      journalSchreiben(journalPfad, journal)
      await stapelSenden(sitzung, stapel, (nummer) => {
        journal.stapelFertig.flughaefen = nummer
        journalSchreiben(journalPfad, journal)
      }, ausgabe)

      const nachher = await json(sitzung, FLUGHAEFEN_PRUEFEN_SQL, flughaefenPruefenSchema)
      ausgabe(`airports nachher: ${nachher.anzahl}; Beispiele: ${nachher.beispiele.join(', ')}`)
      if (nachher.anzahl !== zeilen.length) {
        abbruch(`airports enthält ${nachher.anzahl} statt ${zeilen.length} Zeilen.`)
      }
      const fehlend = FLUGHAFEN_BEISPIELE.filter((code) => !nachher.beispiele.includes(code))
      if (fehlend.length > 0) abbruch(`Nach dem Schreiben fehlen: ${fehlend.join(', ')}`)
    }

    if (eingaben.stufe !== 'flughaefen') {
      const geonames = eingaben.geonamesOrte ?? abbruch('Orts-Quelle fehlt.')
      const flughafenZeilen = await json(sitzung, FLUGHAEFEN_LESEN_SQL, flughaefenLesenSchema)
      const orte = orteMitFlughaefen(geonames, flughafenOrte(flughafenZeilen))
      if (orte.length > grenzen.maxOrte) abbruch(`${orte.length} Orte überschreiten ${grenzen.maxOrte}.`)
      if (!orte.some((ort) => ort.id === 'airport:ZRH')) abbruch('airport:ZRH fehlt nach der Flughafen-Ableitung.')
      if (new Set(orte.map((ort) => ort.id)).size !== orte.length) abbruch('doppelte Orts-IDs.')
      journal.geplant.orte = orte.length
      const stapel = inStapel(orte, ortStapel)
      const antwort = await abh.bestaetigen(
        `Stufe 2: ${orte.length} Orte (${flughafenZeilen.length} Flughäfen gelesen) in ${stapel.length} Stapeln. ` +
          'Zum Start "ORTE" eintippen: ',
      )
      if (antwort.trim() !== 'ORTE') abbruch('Owner-Bestätigung für die Orts-Stufe fehlt. Keine Orte geschrieben.')

      journal.aktuelleStufe = 'orte'
      journalSchreiben(journalPfad, journal)
      await stapelSenden(sitzung, stapel, (nummer) => {
        journal.stapelFertig.orte = nummer
        journalSchreiben(journalPfad, journal)
      }, ausgabe)

      const pruefung = await json(sitzung, ORTE_PRUEFEN_SQL, ortePruefenSchema)
      ausgabe(
        `places nachher (als anon): ${pruefung.anzahl}; Japan ${pruefung.japan}, Zürich ${pruefung.zuerich}, ZRH ${pruefung.zrh}`,
      )
      if (pruefung.rolle !== 'anon') abbruch('Lesepfad lief nicht als anon.')
      if (pruefung.anzahl !== orte.length) abbruch(`places enthält ${pruefung.anzahl} statt ${orte.length} Zeilen.`)
      if (!pruefung.japan || !pruefung.zuerich || !pruefung.zrh) abbruch('Japan, Zürich oder ZRH fehlt für anon.')
    }

    journal.aktuelleStufe = 'fertig'
    journal.status = 'abgeschlossen'
    journalSchreiben(journalPfad, journal)
    await sitzung.beenden()
  } catch (err) {
    journal.status = 'abgebrochen'
    journal.meldung = err instanceof Error ? err.message.slice(0, 500) : 'unbekannter Fehler'
    journalSchreiben(journalPfad, journal)
    await sitzung.beenden().catch(() => null)
    throw err
  }
}
