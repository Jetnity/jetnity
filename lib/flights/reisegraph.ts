// lib/flights/reisegraph.ts
//
// Prüft Reise und Tag gegen einen vertrauenswürdigen Reisegraphen.
// Client-Daten dürfen hier nicht die Source of Truth sein.
//
// S2 leitet keine Such-Legs aus Origin-/Etappennamen ab. Route Truth bleibt
// Foundation D. Dieser Graph prüft nur Zugehörigkeit.
//
// Frei von Next und Providern.

import type { Trip, TripDay } from '@/types/trips'

export type FlugReisegraphFehlerArt = 'reise-fremd' | 'tag-fremd'

export type FlugReisegraphEingabe = {
  tripId: string
  dayId: string | null
}

export type FlugReisegraphErgebnis =
  | { ok: true; tag: TripDay | null }
  | { ok: false; art: FlugReisegraphFehlerArt; message: string }

const MELDUNG: Record<FlugReisegraphFehlerArt, string> = {
  'reise-fremd': 'Diese Reise wurde nicht gefunden.',
  'tag-fremd': 'Dieser Tag gehört nicht zur Reise.',
}

function fehler(art: FlugReisegraphFehlerArt): FlugReisegraphErgebnis {
  return { ok: false, art, message: MELDUNG[art] }
}

export function flugReisegraphPruefen(
  reise: Trip,
  eingabe: FlugReisegraphEingabe,
): FlugReisegraphErgebnis {
  if (reise.id !== eingabe.tripId) return fehler('reise-fremd')

  if (!eingabe.dayId) return { ok: true, tag: null }

  const tag = reise.days.find((eintrag) => eintrag.id === eingabe.dayId)
  if (!tag) return fehler('tag-fremd')

  return { ok: true, tag }
}
