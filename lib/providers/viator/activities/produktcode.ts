/**
 * Viator product codes are a bounded token. Official examples include
 * `2855KENNEDY_TKTS` and `2050_PA`. A slash, query, fragment, percent-encoding,
 * space or control character is not a product code and must not enter a path.
 */
const VIATOR_PRODUKTCODE = /^[A-Za-z0-9_]{2,40}$/

export function istViatorProduktcode(wert: string): boolean {
  return VIATOR_PRODUKTCODE.test(wert)
}
