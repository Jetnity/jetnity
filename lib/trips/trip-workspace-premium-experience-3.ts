// lib/trips/trip-workspace-premium-experience-3.ts
//
// Reine Darstellungshilfe für die Modusleiste.
// Keine Reisewahrheit, keine URL-Regel, kein Provider.

export type ModusScrollerEingabe = {
  scrollLeft: number
  clientWidth: number
  scrollWidth: number
  buttonOffset: number
  buttonWidth: number
  luft?: number
}

/**
 * Horizontalziel, damit der gewählte Modus in der Leiste sichtbar bleibt.
 * `null`, wenn er schon vollständig im Fenster liegt.
 * Die Seite selbst wird nicht bewegt.
 */
export function modusScrollerZiel(eingabe: ModusScrollerEingabe): number | null {
  const luft = eingabe.luft ?? 4
  const links = eingabe.buttonOffset
  const rechts = eingabe.buttonOffset + eingabe.buttonWidth
  const fensterLinks = eingabe.scrollLeft
  const fensterRechts = eingabe.scrollLeft + eingabe.clientWidth
  if (links >= fensterLinks + luft && rechts <= fensterRechts - luft) return null

  const roh = eingabe.buttonOffset - (eingabe.clientWidth - eingabe.buttonWidth) / 2
  const max = Math.max(0, eingabe.scrollWidth - eingabe.clientWidth)
  return Math.min(max, Math.max(0, Math.round(roh)))
}
