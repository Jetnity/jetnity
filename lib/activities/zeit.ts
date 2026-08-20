// lib/activities/zeit.ts
//
// Lokale HH:MM-Semantik des Reisegraphs. Keine Zeitzone, kein Raten aus Koordinaten.
// Frei von Next und Providern.

const UHRZEIT = /^([01]\d|2[0-3]):[0-5]\d$/
const DATUM = /^\d{4}-\d{2}-\d{2}$/

function istUhrzeit(wert: string | null | undefined): wert is string {
  return typeof wert === 'string' && UHRZEIT.test(wert)
}

export function istDatum(wert: string | null | undefined): wert is string {
  return typeof wert === 'string' && DATUM.test(wert)
}

/** Minuten seit Mitternacht. Ungültige Werte bleiben unbekannt. */
export function minutenSeitMitternacht(wert: string | null | undefined): number | null {
  if (!istUhrzeit(wert)) return null
  const [stunde, minute] = wert.split(':').map(Number)
  return stunde * 60 + minute
}

export function minutenAlsUhrzeit(minuten: number): string {
  const geklemmt = Math.max(0, Math.min(23 * 60 + 59, Math.round(minuten)))
  const stunde = Math.floor(geklemmt / 60)
  const minute = geklemmt % 60
  return `${String(stunde).padStart(2, '0')}:${String(minute).padStart(2, '0')}`
}

function datumGueltig(wert: string): boolean {
  if (!istDatum(wert)) return false
  const [jahr, monat, tag] = wert.split('-').map(Number)
  const geprueft = new Date(Date.UTC(jahr, monat - 1, tag))
  return (
    geprueft.getUTCFullYear() === jahr &&
    geprueft.getUTCMonth() === monat - 1 &&
    geprueft.getUTCDate() === tag
  )
}

/** Nur Kalenderdaten, UTC-Mitternacht, ohne Ortszeit. */
export function tageUtc(wert: string): number | null {
  if (!datumGueltig(wert)) return null
  return Date.parse(`${wert}T00:00:00Z`)
}

export function tageDifferenz(von: string, bis: string): number | null {
  const start = tageUtc(von)
  const ende = tageUtc(bis)
  if (start === null || ende === null) return null
  return Math.round((ende - start) / 86_400_000)
}
