// lib/trips/tage.ts
//
// Gemeinsamer, strikt kalendergeprüfter Tagesvertrag für Gast und Konto.
// UTC-Kalendertage: keine Zeitumstellung, keine stillen Korrekturen ungültiger
// Daten und keine auf 366 Tage gekürzte Reise.

export type Reisetag = {
  dayIndex: number
  dayDate: string
}

/** Datenbankgrenze `trip_days_index_bereich`: 366 inklusive Kalendertage. */
export const TAGE_MAXIMUM = 366
/** Abreise bis Rückreise: höchstens 365 Tageswechsel. */
export const REISEDAUER_MAXIMUM = TAGE_MAXIMUM - 1
export const ZEITRAUM_ZU_LANG =
  `Eine Reise umfasst höchstens ${TAGE_MAXIMUM} Kalendertage, einschliesslich Abreise und Rückreise.`

const EIN_TAG = 86_400_000

/**
 * Akzeptiert ausschliesslich einen existierenden Kalendertag in YYYY-MM-DD.
 * Date.parse würde z.B. den 30. Februar unbemerkt in den März verschieben.
 * Date.UTC plus Rückvergleich entspricht der strengen Reise-Schema-Prüfung.
 */
export function kalendertagUtc(wert: string | null | undefined): number | null {
  if (typeof wert !== 'string' || !/^\d{4}-\d{2}-\d{2}$/.test(wert)) return null
  const [jahr, monat, tag] = wert.split('-').map(Number)
  const zeit = Date.UTC(jahr, monat - 1, tag)
  if (!Number.isFinite(zeit)) return null
  return new Date(zeit).toISOString().slice(0, 10) === wert ? zeit : null
}

/** Verschiebt nur einen echten Kalendertag um eine ganze Anzahl Tage. */
export function datumVerschieben(iso: string | null, delta: number): string | null {
  if (iso === null) return null
  const start = kalendertagUtc(iso)
  if (start === null || !Number.isSafeInteger(delta)) return null
  const zeit = start + delta * EIN_TAG
  if (!Number.isFinite(zeit) || Math.abs(zeit) > 8_640_000_000_000_000) return null
  const ziel = new Date(zeit).toISOString().slice(0, 10)
  return kalendertagUtc(ziel) !== null ? ziel : null
}

function zeitraumDauer(startDate: string, endDate: string): number | null {
  const start = kalendertagUtc(startDate)
  const ende = kalendertagUtc(endDate)
  return start === null || ende === null ? null : (ende - start) / EIN_TAG
}

/** Eine Reise über 366 Tage hinaus wird an der Quelle abgewiesen. */
export function zeitraumIstZuLang(startDate: string, endDate: string): boolean {
  const dauer = zeitraumDauer(startDate, endDate)
  return dauer !== null && dauer > REISEDAUER_MAXIMUM
}

/**
 * Reisetage einschliesslich Abreise und Rückreise, ohne stilles Kürzen.
 * Ein ungültiger, umgekehrter oder überlanger Zeitraum ergibt keine Tage.
 * Die Ersteller melden den Fehler, bevor irgendeine Speicherung erfolgt.
 */
export function reisetageBauen(startDate: string, endDate: string): Reisetag[] {
  const dauer = zeitraumDauer(startDate, endDate)
  const start = kalendertagUtc(startDate)
  if (start === null || dauer === null || dauer < 0 || dauer > REISEDAUER_MAXIMUM) return []

  const tage: Reisetag[] = []
  for (let index = 0; index <= dauer; index++) {
    tage.push({
      dayIndex: index + 1,
      dayDate: new Date(start + index * EIN_TAG).toISOString().slice(0, 10),
    })
  }
  return tage
}
