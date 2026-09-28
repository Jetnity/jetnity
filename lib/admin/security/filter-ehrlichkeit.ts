// Unterscheidet eine leere Security-Lesung von einem Filter ohne Treffer
// und sagt, wann die bestehende 200-Zeilen-Grenze sichtbar werden muss.
// Die Grenze spiegelt `MAX_ZEILEN` in der Listenroute. Die Route bleibt
// unverändert; der Abgleich steht im Test dieser Datei.

export const SECURITY_LISTEN_MAX_ZEILEN = 200

export function securityEreignisLeerart(payloadAnzahl: number): 'zeitraum' | 'filter' {
  if (!Number.isInteger(payloadAnzahl) || payloadAnzahl < 0) {
    throw new Error('payloadAnzahl muss eine nichtnegative ganze Zahl sein')
  }
  return payloadAnzahl === 0 ? 'zeitraum' : 'filter'
}

export function securityReadIstAnDerGrenze(
  anzahl: number,
  grenze = SECURITY_LISTEN_MAX_ZEILEN,
): boolean {
  if (!Number.isInteger(anzahl) || anzahl < 0) return false
  return anzahl >= grenze
}
