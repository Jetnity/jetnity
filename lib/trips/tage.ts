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

const EIN_TAG = 86_400_000

/**
 * Die Tage zwischen zwei Daten, beide eingeschlossen.
 *
 * Rechnet in UTC. Über die lokale Zeitzone gerechnet fiele in einer Nacht mit
 * Zeitumstellung ein Tag aus oder doppelt an – für eine Reise, die in der
 * Sommerzeit beginnt und in der Winterzeit endet, ist das der Normalfall.
 *
 * Ein unmöglicher oder umgekehrter Zeitraum ergibt eine leere Liste. Ein Wurf
 * wäre hier falsch: Die Prüfung der Eingabe steht in `lib/trips/schema.ts`, und
 * diese Funktion soll sie nicht ein zweites Mal formulieren.
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
