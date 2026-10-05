// lib/formular/sicht.ts
//
// Nach dem Absenden das erste fehlerhafte Feld in den Viewport holen
// und fokussieren. Auf dem Telefon darf die Meldung nicht unterhalb
// des sichtbaren Bereichs liegen bleiben.

export type SichtZiel = {
  scrollIntoView: (init?: ScrollIntoViewOptions) => void
  focus: (options?: FocusOptions) => void
}

/**
 * JS-Scrollen respektiert Reduced Motion. Die globale CSS-Regel gilt nur für
 * `scroll-behavior`, nicht für `scrollTo` / `scrollIntoView({ behavior })`.
 */
export function scrollVerhalten(
  praeferenz: { matches: boolean } | null | undefined = typeof window === 'undefined'
    ? null
    : window.matchMedia?.('(prefers-reduced-motion: reduce)'),
): ScrollBehavior {
  return praeferenz?.matches ? 'auto' : 'smooth'
}

export function feldInSichtNehmen(ziel: SichtZiel | null | undefined): boolean {
  if (!ziel) return false
  ziel.scrollIntoView({ block: 'center', inline: 'nearest', behavior: scrollVerhalten() })
  ziel.focus({ preventScroll: true })
  return true
}
