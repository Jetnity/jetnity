/**
 * Support-ID der öffentlichen Fehlergrenze.
 *
 * Digest vom Framework hat Vorrang. Fehlt er, bleibt die ID trotzdem
 * unterscheidbar: die Instanzkennung kommt aus einem React-Identitätsprimitiv
 * (`useId`) und ist damit render-rein und je gemounteter Fehlergrenze stabil.
 * Kein Date.now()/Math.random() und keine gemeinsame Konstante wie `#unbekannt`.
 */
export function oeffentlicheFehlerId(
  digest: string | undefined,
  instanzKennung: string,
): string {
  const digestWert = digest?.trim()
  if (digestWert) return `#${digestWert}`

  const instanz = instanzKennung.replaceAll(':', '').trim()
  if (!instanz) {
    throw new Error('[oeffentlicheFehlerId] Instanzkennung fehlt ohne Digest')
  }
  return `#${instanz}`
}
