// lib/formular/sicht.ts
//
// Nach dem Absenden das erste fehlerhafte Feld in den Viewport holen
// und fokussieren. Auf dem Telefon darf die Meldung nicht unterhalb
// des sichtbaren Bereichs liegen bleiben.

export type SichtZiel = {
  scrollIntoView: (init?: ScrollIntoViewOptions) => void
  focus: (options?: FocusOptions) => void
}

export function feldInSichtNehmen(ziel: SichtZiel | null | undefined): boolean {
  if (!ziel) return false
  ziel.scrollIntoView({ block: 'center', inline: 'nearest', behavior: 'smooth' })
  ziel.focus({ preventScroll: true })
  return true
}
