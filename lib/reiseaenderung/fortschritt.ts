// lib/reiseaenderung/fortschritt.ts
//
// Phasen, während eine Änderung entsteht. Keine Prozente, keine Providerdaten.

export type Aenderungsphase = {
  abMs: number
  text: string
}

export const AENDERUNGSPHASEN: readonly Aenderungsphase[] = [
  { abMs: 0, text: 'Dein Änderungswunsch wird gelesen …' },
  { abMs: 8_000, text: 'Die bestehende Reise wird gegen den Wunsch gehalten …' },
  { abMs: 20_000, text: 'Etappen und Tage werden neu gewichtet …' },
  { abMs: 40_000, text: 'Der Vorschlag wird zusammengestellt …' },
  { abMs: 65_000, text: 'Die Änderung wird geprüft …' },
]

export function aenderungsphasenindex(laufzeitMs: number): number {
  const dauer = Math.max(0, laufzeitMs)
  let index = 0
  for (let stelle = 0; stelle < AENDERUNGSPHASEN.length; stelle += 1) {
    if (dauer >= AENDERUNGSPHASEN[stelle].abMs) index = stelle
  }
  return index
}

export function aenderungsphase(laufzeitMs: number): string {
  return AENDERUNGSPHASEN[aenderungsphasenindex(laufzeitMs)].text
}
