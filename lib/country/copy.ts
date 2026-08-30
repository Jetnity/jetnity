// lib/country/copy.ts
//
// Sichtbare Country-UX-Texte. Kein ISO-2-Jargon, kein Defaultland.

export const COUNTRY_COPY = {
  suchen: 'Land suchen',
  suchenHinweis: 'Filtert die Liste. Die Auswahl bleibt leer, bis du ein Land wählst.',
  waehlen: 'Land wählen',
  nichtHinterlegt: 'Nicht hinterlegt',
  bitteWaehlen: 'Bitte ein Land wählen.',
  bestehendPraefix: 'Bestehender Code',
  bestehendHinweis:
    'Dieser gespeicherte Code ist kein bekanntes Land. Er bleibt unverändert, bis du ein Land wählst.',
} as const

export function landUnbekanntLabel(code: string): string {
  return `${COUNTRY_COPY.bestehendPraefix} ${code}`
}
