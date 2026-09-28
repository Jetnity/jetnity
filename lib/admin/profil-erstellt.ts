/**
 * Fehlende Profilerstellungszeit bleibt unbekannt.
 * `null` und `undefined` werden nicht durch die Renderuhr ersetzt.
 * Ein leerer String bleibt ein leerer String, wie `??` es bisher tat.
 */
export function profilErstellt(wert: string | null | undefined): string | null {
  return wert ?? null
}
