// lib/flights/airport-timezone.ts
//
// Bounded Prüfung eines provider-gelieferten Timezone-Identifiers.
// Keine Ortszeit→UTC-Rechnung, keine DST-Auflösung, keine IATA-/Ort-Inferenz.
//
// Frei von Next und Provider-SDKs.

const AIRPORT_TIMEZONE_MAX_LAENGE = 64

const STEUERZEICHEN = /[\u0000-\u001F\u007F]/
const NUMERISCHER_OFFSET = /^(?:[Zz]|[+-](?:\d{2}(?::?\d{2}(?::\d{2})?)?|\d{1,2}))$/

function ianaZoneErkannt(wert: string): boolean {
  try {
    new Intl.DateTimeFormat('en-US', { timeZone: wert })
    return true
  } catch {
    return false
  }
}

/**
 * Liest einen provider-beobachteten Timezone-Identifier.
 *
 * Gibt den Originalwert zurück oder `null`. Es wird nichts getrimmt,
 * kanonisiert oder aus IATA/Land/Stadt geraten.
 */
export function airportTimezoneIdentifierLesen(wert: unknown): string | null {
  if (typeof wert !== 'string') return null
  if (wert.length === 0 || wert.length > AIRPORT_TIMEZONE_MAX_LAENGE) return null
  if (wert !== wert.trim()) return null
  if (STEUERZEICHEN.test(wert)) return null
  if (wert.includes('..') || wert.includes('\\') || wert.includes('://')) return null
  if (wert.startsWith('/') || wert.endsWith('/')) return null
  if (NUMERISCHER_OFFSET.test(wert)) return null
  if (!ianaZoneErkannt(wert)) return null
  return wert
}
