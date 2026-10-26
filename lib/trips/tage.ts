// lib/trips/tage.ts
//
// Aus einem Zeitraum werden Reisetage.
//
// Eigene Datei, weil beide Seiten dieselbe Aufteilung brauchen: Ein Gast legt
// seine Reise im Browser an, ein Konto legt sie über `public.reise_anlegen()`
// an. Zwei Fassungen dieser Rechnung würden auseinanderlaufen, und dieselbe
// Reise hätte im Konto andere Tage als im Browser – sichtbar genau in dem
// Moment, in dem eine Gastreise übernommen wird.
//
// Frei von Browser- und Serverbezug: kein `window`, kein `crypto`, kein
// Supabase. Der Test braucht keine Laufzeit.

/** Ein Tag, wie er aus einem Zeitraum entsteht: Nummer und Datum, sonst nichts. */
export type Reisetag = {
  dayIndex: number
  dayDate: string
}

/** Obergrenze wie `trip_days_index_bereich` in der Datenbank. */
export const TAGE_MAXIMUM = 366

/**
 * Höchste erlaubte Differenz von Abreise zu Rückreise.
 *
 * 366 Kalendertage sind eingeschlossen erlaubt. Das ist dieselbe Grenze wie
 * `GRENZEN.reisedauerInTagen` im Leseschema. Ein längerer Zeitraum wird nicht
 * auf 366 Tage gekürzt.
 */
export const REISEDAUER_MAXIMUM = TAGE_MAXIMUM - 1

export const ZEITRAUM_ZU_LANG = `Eine Reise dauert höchstens ${REISEDAUER_MAXIMUM} Tage`

const EIN_TAG = 86_400_000

/** Verschiebt ein Kalenderdatum um ganze Tage. `null` bleibt `null`. */
export function datumVerschieben(iso: string | null, delta: number): string | null {
  if (!iso || delta === 0) return iso
  const zeit = Date.parse(`${iso}T00:00:00Z`)
  if (Number.isNaN(zeit)) return null
  return new Date(zeit + delta * EIN_TAG).toISOString().slice(0, 10)
}

/** Kalendertage zwischen Abreise und Rückreise, ohne den Abreisetag selbst. */
export function zeitraumDauer(startDate: string, endDate: string): number | null {
  if (!/^\d{4}-\d{2}-\d{2}$/.test(startDate) || !/^\d{4}-\d{2}-\d{2}$/.test(endDate)) return null
  const start = Date.parse(`${startDate}T00:00:00Z`)
  const ende = Date.parse(`${endDate}T00:00:00Z`)
  if (Number.isNaN(start) || Number.isNaN(ende)) return null
  return Math.round((ende - start) / EIN_TAG)
}

/** Wahr, wenn der Zeitraum mehr als 366 eingeschlossene Kalendertage hätte. */
export function zeitraumIstZuLang(startDate: string, endDate: string): boolean {
  const dauer = zeitraumDauer(startDate, endDate)
  return dauer != null && dauer > REISEDAUER_MAXIMUM
}

/**
 * Die Tage zwischen zwei Daten, beide eingeschlossen.
 *
 * Rechnet in UTC. Über die lokale Zeitzone gerechnet fiele in einer Nacht mit
 * Zeitumstellung ein Tag aus oder doppelt an – für eine Reise, die in der
 * Sommerzeit beginnt und in der Winterzeit endet, ist das der Normalfall.
 *
 * Ein unmöglicher oder umgekehrter Zeitraum ergibt eine leere Liste. Die
 * Schleife stoppt bei 366 Tagen. Ein längerer Zeitraum muss vorher abgewiesen
 * werden; diese Funktion kürzt ihn sonst still.
 */
export function reisetageBauen(startDate: string, endDate: string): Reisetag[] {
  const start = Date.parse(`${startDate}T00:00:00Z`)
  const ende = Date.parse(`${endDate}T00:00:00Z`)

  if (Number.isNaN(start) || Number.isNaN(ende) || ende < start) return []

  const tage: Reisetag[] = []

  for (let zeit = start; zeit <= ende && tage.length < TAGE_MAXIMUM; zeit += EIN_TAG) {
    tage.push({
      dayIndex: tage.length + 1,
      dayDate: new Date(zeit).toISOString().slice(0, 10),
    })
  }

  return tage
}
