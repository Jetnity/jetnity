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

/**
 * Sichtbarer Satz nur für die Erstellung.
 *
 * Er zählt die eingeschlossenen Kalendertage. Der gespeicherte Lesesatz bleibt
 * „Eine Reise dauert höchstens 365 Tage“ und wird hier nicht formuliert.
 */
export const ZEITRAUM_ZU_LANG = `Eine Reise umfasst höchstens ${TAGE_MAXIMUM} Kalendertage, einschließlich Abreise und Rückreise.`

const EIN_TAG = 86_400_000

/** Liest ausschliesslich wirkliche UTC-Kalendertage; Date.parse allein
 * normalisiert z. B. den unmöglichen 30. Februar zu einem Märzdatum. */
function utcKalendertag(iso: string): number | null {
  if (!/^\d{4}-\d{2}-\d{2}$/.test(iso)) return null
  const zeit = Date.parse(`${iso}T00:00:00Z`)
  return Number.isFinite(zeit) && new Date(zeit).toISOString().slice(0, 10) === iso ? zeit : null
}

/** Verschiebt ein Kalenderdatum um ganze Tage. `null` bleibt `null`. */
export function datumVerschieben(iso: string | null, delta: number): string | null {
  if (!iso || delta === 0) return iso
  const zeit = Date.parse(`${iso}T00:00:00Z`)
  if (Number.isNaN(zeit)) return null
  return new Date(zeit + delta * EIN_TAG).toISOString().slice(0, 10)
}

/** Kalendertage zwischen Abreise und Rückreise, ohne den Abreisetag selbst. */
function zeitraumDauer(startDate: string, endDate: string): number | null {
  const start = utcKalendertag(startDate)
  const ende = utcKalendertag(endDate)
  if (start === null || ende === null) return null
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
 * Ein unmöglicher, umgekehrter oder zu langer Zeitraum ergibt eine leere
 * Liste; niemals still auf 366 Tage abschneiden. Die bestehende Formulargrenze
 * liefert die benutzerfreundliche Fehlermeldung vor dieser Hilfsfunktion.
 */
export function reisetageBauen(startDate: string, endDate: string): Reisetag[] {
  const start = utcKalendertag(startDate)
  const ende = utcKalendertag(endDate)

  if (start === null || ende === null || ende < start
    || ende - start > REISEDAUER_MAXIMUM * EIN_TAG) return []

  const tage: Reisetag[] = []

  for (let zeit = start; zeit <= ende; zeit += EIN_TAG) {
    tage.push({
      dayIndex: tage.length + 1,
      dayDate: new Date(zeit).toISOString().slice(0, 10),
    })
  }

  return tage
}
