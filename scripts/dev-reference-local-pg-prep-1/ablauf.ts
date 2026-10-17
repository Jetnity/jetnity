// scripts/dev-reference-local-pg-prep-1/ablauf.ts
//
// Ein verbundener Lauf: erst public.airports vollständig, dann public.places.
// Eine eigenständige Orts-Stufe gibt es nicht.
//
// - Ein Journal pro Lauf, exklusiv angelegt. Liegt es schon vor, startet
//   nichts: kein zweiter Writer, kein stiller Neuversuch nach Teilabbruch.
// - Eine psql-Sitzung pro Lauf, sitzungsweites Advisory Lock.
// - Vor jedem Schreiben: Ziel, TLS, Schema, beide Tabellen leer, anon darf
//   public.places lesen.
// - Orte erst, wenn die zurückgelesenen Flughäfen exakt der geprüften
//   Quelle dieses Laufs entsprechen.
// - Der Owner bestätigt jede Stufe durch Eintippen.
// - Jeder Stapel committet einzeln. Bei einem Fehler: Stufe und Stapel ins
//   Journal, STOP. Kein Retry, kein Rollback bereits committeter Stapel.
// - Das Journal trägt keine lokalen Pfade und keine psql-Fehlertexte.

import { closeSync, openSync, writeFileSync } from 'node:fs'
import { basename } from 'node:path'

import type { FlughafenImportZeile } from '@/lib/airports/importieren'
import type { Ort } from '@/lib/places/domain'

import { SitzungsFehler, einzeiligesJson, type Sitzung } from './psql'
import type { Herkunft } from './quelle'
import {
  ANON_LESEPROBE_SQL,
  ANON_RECHTE_SQL,
  FLUGHAEFEN_LESEN_SQL,
  FLUGHAEFEN_PRUEFEN_SQL,
  FLUGHAFEN_BEISPIELE,
  FLUGHAFEN_SPALTEN,
  ORTE_PRUEFEN_SQL,
  ORT_SPALTEN,
  SITZUNG_SQL,
  STAPEL,
  VORPRUEFUNG_SQL,
  anonLeseprobeSchema,
  anonRechteSchema,
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
import { ZIEL } from './ziel'

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
  flughaefen: FlughafenImportZeile[]
  geonamesOrte: Ort[]
  herkunft: Herkunft[]
}

export type Journal = {
  ziel: string
  ablauf: 'flughaefen-dann-orte'
  status: 'gestartet' | 'abgeschlossen' | 'abgebrochen'
  aktuelleStufe: 'vorpruefung' | 'flughaefen' | 'orte' | 'fertig'
  geplant: { flughaefen: number; orte: number | null }
  stapelFertig: { flughaefen: number; orte: number }
  vorher: { flughaefen: number; orte: number } | null
  herkunft: Herkunft[]
  meldung: string | null
  aktualisiert: string
}

function abbruch(meldung: string): never {
  throw new Error(`Abgebrochen: ${meldung}`)
}

// Jedes Token, das wie ein absoluter Pfad aussieht, fliegt raus.
export function oeffentlicheMeldung(err: unknown): string {
  const text = err instanceof SitzungsFehler ? err.oeffentlich : err instanceof Error ? err.message : 'unbekannter Fehler'
  return text.replace(/(^|[\s(:='"])\/[^\s'")]+/g, '$1<pfad>').slice(0, 300)
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
  const zeilen = eingaben.flughaefen
  if (zeilen.length < grenzen.minFlughaefen || zeilen.length > grenzen.maxFlughaefen) {
    abbruch(`${zeilen.length} Flughäfen liegen ausserhalb ${grenzen.minFlughaefen}–${grenzen.maxFlughaefen}.`)
  }
  const codes = new Set(zeilen.map((zeile) => zeile.iata))
  if (codes.size !== zeilen.length) abbruch('doppelte IATA-Codes in der Quelle.')
  const fehlend = FLUGHAFEN_BEISPIELE.filter((code) => !codes.has(code))
  if (fehlend.length > 0) abbruch(`Pflichtcodes fehlen nach dem Filter: ${fehlend.join(', ')}`)

  const orte = eingaben.geonamesOrte
  if (orte.length < grenzen.minGeonamesOrte || orte.length > grenzen.maxOrte) {
    abbruch(`${orte.length} GeoNames-Orte liegen ausserhalb ${grenzen.minGeonamesOrte}–${grenzen.maxOrte}.`)
  }
  const japan = orte.some((ort) => ort.typ === 'country' && ort.countryCode === 'JP' && ort.name === 'Japan')
  const zuerich = orte.some(
    (ort) => ort.typ === 'city' && ort.countryCode === 'CH' && (ort.name === 'Zürich' || ort.name === 'Zurich'),
  )
  if (!japan || !zuerich) abbruch('Japan (Land) oder Zürich (Stadt) fehlt in der GeoNames-Quelle.')
}

function vorpruefungBewerten(v: Vorpruefung): void {
  if (v.datenbank !== ZIEL.datenbank || v.benutzer !== ZIEL.benutzer) abbruch('unerwartete Datenbank oder Rolle.')
  if (v.replik) abbruch('Ziel ist eine Read-Replik.')
  if (!v.ssl) abbruch('Verbindung ist nicht TLS-verschlüsselt.')
  if (v.standardStrings !== 'on') abbruch('standard_conforming_strings ist nicht on.')
  const fehlendF = FLUGHAFEN_SPALTEN.filter((spalte) => !v.flughafenSpalten.includes(spalte))
  const fehlendO = ORT_SPALTEN.filter((spalte) => !v.ortSpalten.includes(spalte))
  if (fehlendF.length > 0 || fehlendO.length > 0) {
    abbruch(`erwartete Spalten fehlen: ${[...fehlendF, ...fehlendO].join(', ')}`)
  }
  if (v.flughaefen !== 0) abbruch(`public.airports enthält bereits ${v.flughaefen} Zeilen. Erster Import erwartet 0.`)
  if (v.orte !== 0) abbruch(`public.places enthält bereits ${v.orte} Zeilen. Erster Import erwartet 0.`)
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

async function anonLesenPruefen(sitzung: Sitzung): Promise<void> {
  const rechte = await json(sitzung, ANON_RECHTE_SQL, anonRechteSchema)
  if (!rechte.anonSelect) abbruch('anon hat kein SELECT auf public.places. Nichts geschrieben.')
  if (!rechte.rls) abbruch('RLS ist auf public.places nicht aktiv. Nichts geschrieben.')
  if (!rechte.anonPolicy) abbruch('keine SELECT-Policy für anon auf public.places. Nichts geschrieben.')
  const probe = await json(sitzung, ANON_LESEPROBE_SQL, anonLeseprobeSchema)
  if (probe.rolle !== 'anon') abbruch('Leseprobe lief nicht als anon. Nichts geschrieben.')
  if (probe.orte !== 0) abbruch('anon sieht unerwartete Zeilen in public.places. Nichts geschrieben.')
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
  const quellCodes = new Set(eingaben.flughaefen.map((zeile) => zeile.iata))

  const journal: Journal = {
    ziel: `${ZIEL.host}:${ZIEL.port}/${ZIEL.datenbank}`,
    ablauf: 'flughaefen-dann-orte',
    status: 'gestartet',
    aktuelleStufe: 'vorpruefung',
    geplant: { flughaefen: eingaben.flughaefen.length, orte: null },
    stapelFertig: { flughaefen: 0, orte: 0 },
    vorher: null,
    herkunft: eingaben.herkunft.map(({ datei, sha256 }) => ({ datei: basename(datei), sha256 })),
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
    vorpruefungBewerten(vorher)
    await anonLesenPruefen(sitzung)
    ausgabe('anon darf public.places lesen (Katalog und Leseprobe).')

    const flughafenStapelListe = inStapel(eingaben.flughaefen, flughafenStapel)
    const start = await abh.bestaetigen(
      `Stufe 1: ${eingaben.flughaefen.length} Flughäfen in ${flughafenStapelListe.length} Stapeln nach ${ZIEL.host}. ` +
        `Branch, Backup-Stand und Ressourcen im Dashboard geprüft? Zum Start "${ZIEL.projektRef}" eintippen: `,
    )
    if (start.trim() !== ZIEL.projektRef) abbruch('Owner-Bestätigung fehlt. Nichts geschrieben.')

    journal.aktuelleStufe = 'flughaefen'
    journalSchreiben(journalPfad, journal)
    await stapelSenden(sitzung, flughafenStapelListe, (nummer) => {
      journal.stapelFertig.flughaefen = nummer
      journalSchreiben(journalPfad, journal)
    }, ausgabe)

    const nachher = await json(sitzung, FLUGHAEFEN_PRUEFEN_SQL, flughaefenPruefenSchema)
    ausgabe(`airports nachher: ${nachher.anzahl}; Beispiele: ${nachher.beispiele.join(', ')}`)
    if (nachher.anzahl !== eingaben.flughaefen.length) {
      abbruch(`airports enthält ${nachher.anzahl} statt ${eingaben.flughaefen.length} Zeilen.`)
    }
    const fehlend = FLUGHAFEN_BEISPIELE.filter((code) => !nachher.beispiele.includes(code))
    if (fehlend.length > 0) abbruch(`Nach dem Schreiben fehlen: ${fehlend.join(', ')}`)

    // Orte nur auf exakt dem Flughafenbestand, den dieser Lauf geschrieben und geprüft hat.
    const flughafenZeilen = await json(sitzung, FLUGHAEFEN_LESEN_SQL, flughaefenLesenSchema)
    const gelesen = new Set(flughafenZeilen.map((zeile) => zeile.iata))
    const gleich =
      flughafenZeilen.length === quellCodes.size &&
      gelesen.size === quellCodes.size &&
      [...quellCodes].every((code) => gelesen.has(code))
    if (!gleich) {
      abbruch(
        `zurückgelesene Flughäfen (${flughafenZeilen.length}) entsprechen nicht der geprüften Quelle ` +
          `(${quellCodes.size}). Keine Orte geschrieben.`,
      )
    }

    const orte = orteMitFlughaefen(eingaben.geonamesOrte, flughafenOrte(flughafenZeilen))
    if (orte.length > grenzen.maxOrte) abbruch(`${orte.length} Orte überschreiten ${grenzen.maxOrte}.`)
    if (!orte.some((ort) => ort.id === 'airport:ZRH')) abbruch('airport:ZRH fehlt nach der Flughafen-Ableitung.')
    if (new Set(orte.map((ort) => ort.id)).size !== orte.length) abbruch('doppelte Orts-IDs.')
    journal.geplant.orte = orte.length
    const ortStapelListe = inStapel(orte, ortStapel)
    const weiter = await abh.bestaetigen(
      `Stufe 2: ${orte.length} Orte (${flughafenZeilen.length} Flughäfen gelesen) in ${ortStapelListe.length} Stapeln. ` +
        'Zum Start "ORTE" eintippen: ',
    )
    if (weiter.trim() !== 'ORTE') abbruch('Owner-Bestätigung für die Orts-Stufe fehlt. Keine Orte geschrieben.')

    journal.aktuelleStufe = 'orte'
    journalSchreiben(journalPfad, journal)
    await stapelSenden(sitzung, ortStapelListe, (nummer) => {
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

    journal.aktuelleStufe = 'fertig'
    journal.status = 'abgeschlossen'
    journalSchreiben(journalPfad, journal)
    await sitzung.beenden()
  } catch (err) {
    journal.status = 'abgebrochen'
    journal.meldung = oeffentlicheMeldung(err)
    journalSchreiben(journalPfad, journal)
    await sitzung.beenden().catch(() => null)
    throw err
  }
}
