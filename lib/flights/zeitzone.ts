// lib/flights/zeitzone.ts
//
// Explizite tz-database-/IANA-Bezeichner. Nur Syntax und Bound.
// Keine Auflösung, kein Offset, kein DST, kein Airport-/Country-Fallback.
//
// Frei von Next, Providern und Timezone-Libraries.

const IANA_ZEITZONE_MAX = 64
const IANA_ZEITZONE =
  /^[A-Z][A-Za-z0-9_+-]*(?:\/[A-Z][A-Za-z0-9_+-]*){1,2}$/

/**
 * Liest einen expliziten IANA-/tz-database-Namen.
 *
 * Fehlend, Whitespace, Offset (`Z`, `+02:00`), einzelnes `UTC`/`CET`
 * oder ungebundene Zeichenketten bleiben `null`. Der gelesene Wert
 * wird nicht getrimmt, umgeschrieben oder in einen Instant verwandelt.
 */
export function ianaZeitzoneLesen(wert: unknown): string | null {
  if (typeof wert !== 'string') return null
  if (wert.length < 3 || wert.length > IANA_ZEITZONE_MAX) return null
  if (wert !== wert.trim()) return null
  if (!IANA_ZEITZONE.test(wert)) return null
  return wert
}
