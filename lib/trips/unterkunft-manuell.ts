/** Nur fehlende Identität ist manuell; auch leere/unerwartete Werte sperren. */
export function istManuelleUnterkunft(punkt: {
  kind: unknown
  provider?: unknown
  externalRef?: unknown
  bookingUrl?: unknown
}): boolean {
  return punkt.kind === 'stay' &&
    punkt.provider == null && punkt.externalRef == null && punkt.bookingUrl == null
}
