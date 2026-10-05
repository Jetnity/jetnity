// lib/places/pruefen.ts
//
// Fachliche Ortsprüfung. Dieselbe Regel für Konto und Gast.
// Eine Place-ID aus dem Browser ist untrusted input.

import { istOrtId, ortPasstZurRolle, type Ort, type OrtRolle } from '@/lib/places/domain'

export const ORT_MELDUNG = {
  zielFehlt: 'Bitte wähle ein Reiseziel aus der Liste.',
  zielUnbekannt: 'Kein passendes Reiseziel gefunden. Bitte wähle einen Eintrag aus der Liste.',
  abreiseFehlt: 'Bitte wähle einen Abreiseort aus der Liste.',
  abreiseUnbekannt: 'Dieser Abreiseort ist unbekannt. Bitte wähle einen Eintrag aus der Liste.',
  idUngueltig: 'Diese Ortsangabe ist ungültig.',
} as const

export function ortAusBestand(orte: Ort[], id: string, rolle: OrtRolle): Ort | null {
  if (!istOrtId(id)) return null
  const ort = orte.find((eintrag) => eintrag.id === id)
  if (!ort) return null
  return ortPasstZurRolle(ort, rolle) ? ort : null
}

export function eingabeOhneAuswahl(text: string, placeId: string | null | undefined): boolean {
  return Boolean(text.trim()) && !placeId
}
