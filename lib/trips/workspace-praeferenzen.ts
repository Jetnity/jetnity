// lib/trips/workspace-praeferenzen.ts
//
// Workspace-Anzeige von Reisewunsch und Interessen.
//
// `trips.pace = balanced` ist nach TW6-A nur noch der Persistenzdefault, wenn
// der Nutzer kein Tempo gewählt hat. Ohne eigene Provenance-Spalte darf die
// Übersicht diesen Wert nicht als bewusste Auswahl zeigen. Interessen und
// Reisewunsch bleiben sichtbar, wenn sie tatsächlich persistiert sind.

import type { TripInterest } from '@/types/trips'

export type WorkspacePraeferenzSicht = {
  zeigeTempo: false
  interessen: TripInterest[]
  reisewunsch: string | null
}

export function workspacePraeferenzSicht(reise: {
  interests: readonly TripInterest[]
  travelWish?: string | null
}): WorkspacePraeferenzSicht {
  const interessen = reise.interests.filter((wert) => typeof wert === 'string' && wert.length > 0)
  const wunsch = reise.travelWish?.trim() ?? ''
  return {
    zeigeTempo: false,
    interessen,
    reisewunsch: wunsch.length > 0 ? wunsch : null,
  }
}

export function workspacePraeferenzHatInhalt(sicht: WorkspacePraeferenzSicht): boolean {
  return sicht.reisewunsch !== null || sicht.interessen.length > 0
}
