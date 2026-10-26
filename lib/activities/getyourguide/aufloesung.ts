// lib/activities/getyourguide/aufloesung.ts
//
// Generation für eine verspätete exakte Ortsbestätigung.
// Eine alte Antwort gilt nicht für die nächste Anfrage.

import type { Ort } from '@/lib/places/domain'

export type GygAufloesung = {
  epoche: number
  anfrage: string
  generation: number
  naechsteGeneration: number
  phase: 'ruhend' | 'laeuft' | 'fertig' | 'fehler'
  orte: Readonly<Record<string, Ort | null>>
  fehler: string | null
}

export function gygAufloesungStart(anfrage: string): GygAufloesung {
  return {
    epoche: 1,
    anfrage,
    generation: 0,
    naechsteGeneration: 1,
    phase: 'ruhend',
    orte: {},
    fehler: null,
  }
}

export function gygAufloesungWechseln(stand: GygAufloesung, anfrage: string): GygAufloesung {
  if (stand.anfrage === anfrage) return stand
  return {
    epoche: stand.epoche + 1,
    anfrage,
    generation: 0,
    naechsteGeneration: stand.naechsteGeneration,
    phase: 'ruhend',
    orte: {},
    fehler: null,
  }
}

export function gygAufloesungBeginnen(stand: GygAufloesung): GygAufloesung {
  if (stand.phase === 'laeuft') return stand
  const generation = stand.naechsteGeneration
  return {
    ...stand,
    generation,
    naechsteGeneration: generation + 1,
    phase: 'laeuft',
    orte: {},
    fehler: null,
  }
}

/**
 * Orte sind nur die bestätigte Identität. Ein Fehlertext des Aufrufers
 * wird nicht übernommen.
 */
export function gygAufloesungAbschluss(
  stand: GygAufloesung,
  erwartet: { epoche: number; generation: number; anfrage: string },
  ergebnis: { art: 'orte'; orte: Readonly<Record<string, Ort | null>> } | { art: 'abgelehnt' },
): GygAufloesung {
  if (stand.epoche !== erwartet.epoche || stand.anfrage !== erwartet.anfrage) return stand
  if (stand.phase !== 'laeuft' || stand.generation !== erwartet.generation) return stand
  if (ergebnis.art === 'abgelehnt') {
    return { ...stand, phase: 'fehler', orte: {}, fehler: 'Das Ziel konnte gerade nicht bestätigt werden.' }
  }
  const orte: Record<string, Ort | null> = {}
  for (const [id, ort] of Object.entries(ergebnis.orte)) {
    orte[id] = ort && ort.id === id ? ort : null
  }
  return { ...stand, phase: 'fertig', orte, fehler: null }
}
