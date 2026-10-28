// Sichtbare Spalten des Reiseplans. Eingaben sind die Inhaltsbreite und
// die Root-Schrift. scrollWidth ist keine Eingabe.

export const ROUTE_MIN_REM = 20
export const DETAIL_MIN_REM = 28
export const SPALTEN_GAP_REM = 1.5
export const SCHWELLE_REM = ROUTE_MIN_REM + DETAIL_MIN_REM + SPALTEN_GAP_REM
export const EINTRITT_REM = SCHWELLE_REM + 1

export type U1bAnordnung = 'neben' | 'schmal'

export function naechsteAnordnung(
  bisher: U1bAnordnung | null,
  contentPx: number,
  rootPx: number,
): U1bAnordnung {
  if (!(rootPx > 0) || !(contentPx >= 0)) return 'schmal'
  const schwelle = SCHWELLE_REM * rootPx
  const eintritt = EINTRITT_REM * rootPx
  if (bisher === 'neben') return contentPx < schwelle ? 'schmal' : 'neben'
  if (bisher === 'schmal') return contentPx >= eintritt ? 'neben' : 'schmal'
  return contentPx >= schwelle ? 'neben' : 'schmal'
}

export function darfFokussieren(el: HTMLElement | null): el is HTMLElement {
  if (!el || !el.isConnected) return false
  if (el.closest('[hidden], [inert]')) return false
  return el.getClientRects().length > 0
}
