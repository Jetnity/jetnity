// lib/account/besuche.ts
//
// Die Besuchshistorie eines Kontos als Domäne: Typen, Zeitangaben und die
// daraus abgeleiteten Kennzahlen.
//
// Drei Regeln tragen diese Datei, und sie stehen hier, weil sie sonst in jeder
// Ansicht neu formuliert würden:
//
//   · Ein Besuch entsteht nur durch eine ausdrückliche Bestätigung des
//     Kontoinhabers. Keine Reise, kein vergangenes Datum, kein Archivstand und
//     kein Buchungszustand erzeugt hier eine Zeile. Diese Datei kennt den
//     Reisegraphen deshalb gar nicht.
//   · Wiederholte Besuche bleiben getrennte Ereignisse. Zusammengelegt wird
//     erst beim Zählen, und dort getrennt nach Land und Ort.
//   · Kennzahlen werden gerechnet, nie gespeichert. Ein persistierter Zähler
//     wäre eine zweite Wahrheit, die irgendwann von der ersten abweicht.
//
// Frei von React, Next und Supabase: die Regeln sind ohne Laufzeit prüfbar.

import { countryCodeNormalisieren, landAnzeigeText } from '@/lib/country/darstellung'

/**
 * Ein bestätigtes Besuchsereignis.
 *
 * `placeId` ist die Referenz auf die Jetnity-Ortsreferenz, `countryCode` der
 * ISO-3166-1-alpha-2-Code, sofern die Referenz einen führt. Beides kann fehlen
 * – aber nie beides zugleich, sonst wäre der Besuch ohne Gegenstand.
 */
export type Besuch = {
  id: string
  placeId: string | null
  placeLabel: string | null
  countryCode: string | null
  latitude: number | null
  longitude: number | null
  /** Jahr, Monat, Tag einzeln: „irgendwann 2004“ bleibt „irgendwann 2004“. */
  jahr: number | null
  monat: number | null
  tag: number | null
  erstelltAm: string
}

export type BesuchZeitgenauigkeit = 'unbekannt' | 'jahr' | 'monat' | 'tag'

export type BesuchAnzeige = {
  id: string
  /** Ortsname, sonst Ländername, sonst der Hinweis auf fehlende Identität. */
  titel: string
  /** Land unter dem Titel; `null`, wenn kein Ländercode gespeichert ist. */
  landLabel: string | null
  countryCode: string | null
  placeId: string | null
  zeitGenauigkeit: BesuchZeitgenauigkeit
  zeitText: string
  /** Nur gesetzt, wenn derselbe Ort mehrfach bestätigt wurde. */
  wiederholungText: string | null
  latitude: number | null
  longitude: number | null
}

export type BesuchKennzahlen = {
  laender: number
  orte: number
  ereignisse: number
  /** Besuche ohne gespeicherten Ländercode. Sie zählen nicht als Land. */
  ohneLand: number
}

export const BESUCHE_OHNE_IDENTITAET_TEXT = 'Besuch ohne gespeicherten Ort'
export const BESUCHE_ZEIT_UNBEKANNT_TEXT = 'Zeitpunkt nicht angegeben'

const MONATSNAMEN = [
  'Januar',
  'Februar',
  'März',
  'April',
  'Mai',
  'Juni',
  'Juli',
  'August',
  'September',
  'Oktober',
  'November',
  'Dezember',
] as const

/**
 * Wie genau die gespeicherte Zeitangabe ist.
 *
 * Ein Monat ohne Jahr und ein Tag ohne Monat sind kein Zwischenzustand,
 * sondern ein Widerspruch. Die Datenbank verbietet ihn; hier wird er
 * zusätzlich nach unten aufgelöst, damit eine fehlerhafte Zeile die Anzeige
 * nicht zu einer Behauptung macht.
 */
export function besuchZeitgenauigkeit(besuch: {
  jahr: number | null
  monat: number | null
  tag: number | null
}): BesuchZeitgenauigkeit {
  if (besuch.jahr === null) return 'unbekannt'
  if (besuch.monat === null) return 'jahr'
  if (besuch.tag === null) return 'monat'
  return 'tag'
}

/** Lesbare Zeitangabe ohne erfundene Genauigkeit. */
export function besuchZeitText(besuch: {
  jahr: number | null
  monat: number | null
  tag: number | null
}): string {
  const genauigkeit = besuchZeitgenauigkeit(besuch)
  if (genauigkeit === 'unbekannt') return BESUCHE_ZEIT_UNBEKANNT_TEXT
  if (genauigkeit === 'jahr') return String(besuch.jahr)
  const monat = MONATSNAMEN[(besuch.monat ?? 1) - 1] ?? String(besuch.monat)
  if (genauigkeit === 'monat') return `${monat} ${besuch.jahr}`
  return `${besuch.tag}. ${monat} ${besuch.jahr}`
}

/**
 * Wonach ein Besuch als „derselbe Ort“ gilt.
 *
 * Nur eine Ortsreferenz oder ein Ländercode bindet. Ein Anzeigename bindet
 * nicht: zwei Orte gleichen Namens in verschiedenen Ländern wären sonst einer.
 */
function ortSchluessel(besuch: Besuch): string | null {
  const placeId = besuch.placeId?.trim()
  return placeId ? `place:${placeId}` : null
}

function landSchluessel(besuch: Besuch): string | null {
  return countryCodeNormalisieren(besuch.countryCode)
}

/**
 * Abgeleitete Kennzahlen. Nie gespeichert, immer aus den Ereignissen gerechnet.
 *
 * Länder und Orte werden getrennt entdoppelt: dreimal Lissabon sind ein Ort und
 * ein Land, aber drei Ereignisse. Ein Besuch ohne Ländercode erhöht die
 * Länderzahl nicht – unbekannt bleibt unbekannt.
 */
export function besuchKennzahlen(besuche: readonly Besuch[]): BesuchKennzahlen {
  const laender = new Set<string>()
  const orte = new Set<string>()
  let ohneLand = 0

  for (const besuch of besuche) {
    const land = landSchluessel(besuch)
    if (land) laender.add(land)
    else ohneLand += 1
    const ort = ortSchluessel(besuch)
    if (ort) orte.add(ort)
  }

  return { laender: laender.size, orte: orte.size, ereignisse: besuche.length, ohneLand }
}

/** Eindeutige besuchte Ländercodes, sortiert. Basis der Kartenfüllung. */
export function besuchteLaender(besuche: readonly Besuch[]): readonly string[] {
  return [
    ...new Set(
      besuche
        .map((besuch) => landSchluessel(besuch))
        .filter((code): code is string => code !== null),
    ),
  ].sort()
}

/**
 * Vergleichswert einer Teilangabe. Ein fehlender Monat zählt als 0, damit
 * „2004“ vor „Januar 2004“ steht, statt sich mit ihm zu verschränken.
 */
function zeitSortierschluessel(besuch: Besuch): number {
  return (besuch.jahr ?? 0) * 10000 + (besuch.monat ?? 0) * 100 + (besuch.tag ?? 0)
}

/**
 * Reihenfolge der Historie: das zuletzt Erlebte zuerst, Undatiertes zuletzt.
 *
 * Undatiert steht bewusst am Ende und nicht bei „sehr alt“: dass ein Zeitpunkt
 * fehlt, sagt nichts darüber, wann der Besuch war.
 *
 * Bei gleicher Zeitangabe entscheidet das Anlegedatum und zuletzt die Id, damit
 * zwei gleich datierte Besuche desselben Ortes eine stabile Reihenfolge haben
 * und nicht bei jedem Laden springen.
 */
export function besucheSortieren(besuche: readonly Besuch[]): readonly Besuch[] {
  return [...besuche].sort((links, rechts) => {
    const linksUnbekannt = links.jahr === null
    const rechtsUnbekannt = rechts.jahr === null
    if (linksUnbekannt !== rechtsUnbekannt) return linksUnbekannt ? 1 : -1
    if (!linksUnbekannt && !rechtsUnbekannt) {
      const zeit = zeitSortierschluessel(rechts) - zeitSortierschluessel(links)
      if (zeit !== 0) return zeit
    }
    const erstellt = rechts.erstelltAm.localeCompare(links.erstelltAm)
    if (erstellt !== 0) return erstellt
    return links.id.localeCompare(rechts.id)
  })
}

/**
 * Die Historie als Zeilen.
 *
 * Mehrfach bestätigte Orte werden nicht zusammengelegt: jedes Ereignis bleibt
 * eine Zeile und trägt zusätzlich, das wievielte es ist. Ohne diesen Zusatz
 * sähen drei Aufenthalte in Lissabon wie ein dreifach angezeigter Fehler aus.
 */
export function besuchAnzeigen(besuche: readonly Besuch[]): readonly BesuchAnzeige[] {
  const sortiert = besucheSortieren(besuche)

  const gesamt = new Map<string, number>()
  for (const besuch of sortiert) {
    const schluessel = ortSchluessel(besuch) ?? landSchluessel(besuch)
    if (!schluessel) continue
    gesamt.set(schluessel, (gesamt.get(schluessel) ?? 0) + 1)
  }

  // Rückwärts zählen: die Liste beginnt beim jüngsten Ereignis, die Zählung
  // „1 von 3“ soll aber beim ältesten beginnen.
  const laufend = new Map<string, number>()
  const nummern = new Map<string, number>()
  for (const besuch of [...sortiert].reverse()) {
    const schluessel = ortSchluessel(besuch) ?? landSchluessel(besuch)
    if (!schluessel) continue
    const nummer = (laufend.get(schluessel) ?? 0) + 1
    laufend.set(schluessel, nummer)
    nummern.set(besuch.id, nummer)
  }

  return sortiert.map((besuch) => {
    const code = landSchluessel(besuch)
    const landLabel = code ? landAnzeigeText(code) : null
    const schluessel = ortSchluessel(besuch) ?? code
    const anzahl = schluessel ? (gesamt.get(schluessel) ?? 1) : 1
    const nummer = nummern.get(besuch.id) ?? 1
    const titel =
      besuch.placeLabel?.trim() || landLabel || BESUCHE_OHNE_IDENTITAET_TEXT

    return {
      id: besuch.id,
      titel,
      landLabel: besuch.placeLabel?.trim() ? landLabel : null,
      countryCode: code,
      placeId: besuch.placeId,
      zeitGenauigkeit: besuchZeitgenauigkeit(besuch),
      zeitText: besuchZeitText(besuch),
      wiederholungText: anzahl > 1 ? `Besuch ${nummer} von ${anzahl}` : null,
      latitude: besuch.latitude,
      longitude: besuch.longitude,
    }
  })
}

/** Kompakte Kennzahl in der Form `N Länder · M Orte`. */
export function kennzahlText(laender: number, orte: number): string {
  const landWort = laender === 1 ? '1 Land' : `${laender} Länder`
  const ortWort = orte === 1 ? '1 Ort' : `${orte} Orte`
  return `${landWort} · ${ortWort}`
}
