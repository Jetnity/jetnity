// lib/suche/tastatur.ts
//
// Pfeiltasten und sichtbarer Aktivindex für Orts- und Flughafen-Comboboxen.
// Keine DOM-Bindung.

export function sucheListeIndex(
  bisher: number,
  anzahl: number,
  taste: 'ArrowDown' | 'ArrowUp',
): number {
  if (anzahl <= 0) return -1
  if (taste === 'ArrowDown') return (bisher + 1) % anzahl
  return bisher <= 0 ? anzahl - 1 : bisher - 1
}

export function sucheListeSchliesst(taste: string): boolean {
  return taste === 'Escape'
}

export function sucheListeWaehlt(taste: string, aktiv: number): boolean {
  return taste === 'Enter' && aktiv >= 0
}

/** Index nur, wenn er eine aktuell gerenderte Option benennt. */
export function sucheAktiveOption(aktiv: number, anzahl: number): number {
  if (!Number.isInteger(aktiv) || !Number.isInteger(anzahl)) return -1
  if (aktiv < 0 || anzahl <= 0 || aktiv >= anzahl) return -1
  return aktiv
}
