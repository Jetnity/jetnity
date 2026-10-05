// lib/suche/lage.ts
//
// Combobox-Zustände. Loading, Empty, Error, Unavailable und Invalid
// bleiben getrennte Aussagen.

const SUCHE_LAGEN = [
  'idle',
  'loading',
  'results',
  'empty',
  'error',
  'unavailable',
  'invalid',
] as const

export type SucheLage = (typeof SUCHE_LAGEN)[number]

export type SucheLageEingabe = {
  offen: boolean
  laedt: boolean
  treffer: number
  queryLen: number
  minQueryLen: number
  hatAuswahl: boolean
  fehlerArt: 'error' | 'unavailable' | null
  ungueltig: boolean
}

export function sucheLage(eingabe: SucheLageEingabe): SucheLage {
  if (eingabe.ungueltig && !eingabe.offen) return 'invalid'
  if (!eingabe.offen) return 'idle'
  if (eingabe.fehlerArt === 'unavailable') return 'unavailable'
  if (eingabe.fehlerArt === 'error') return 'error'
  if (eingabe.laedt && eingabe.treffer === 0) return 'loading'
  if (eingabe.treffer > 0) return 'results'
  if (
    !eingabe.laedt &&
    !eingabe.hatAuswahl &&
    eingabe.queryLen >= eingabe.minQueryLen
  ) {
    return 'empty'
  }
  return 'idle'
}

export function sucheListeSichtbar(lage: SucheLage): boolean {
  return lage === 'loading' || lage === 'results' || lage === 'empty' || lage === 'error' || lage === 'unavailable'
}
