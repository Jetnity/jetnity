// lib/activities/getyourguide/lebenszyklus.ts
//
// Kontexteigene Lebensdauer. Eine Antwort gilt nur für Epoche und Generation.
// Ein Kontextwechsel verwirft das alte Ziel, bevor eine neue Anfrage entsteht.

import type { GygOeffentlicherBezug } from '@/lib/activities/getyourguide/widget'

export type GygPhase = 'ruhend' | 'laeuft' | 'fehler' | 'anzeige'

export type GygLauf = {
  epoche: number
  kontext: string
  naechsteGeneration: number
  phase: GygPhase
  generation: number | null
  bezug: GygOeffentlicherBezug | null
  fehler: string | null
}

export type GygDispatch =
  | { angenommen: false; lauf: GygLauf }
  | {
      angenommen: true
      lauf: GygLauf
      epoche: number
      generation: number
      bezug: GygOeffentlicherBezug
    }

const FEHLER_STANDARD = 'GetYourGuide konnte gerade nicht geladen werden.'

export function gygLaufStart(kontext: string): GygLauf {
  return {
    epoche: 1,
    kontext,
    naechsteGeneration: 1,
    phase: 'ruhend',
    generation: null,
    bezug: null,
    fehler: null,
  }
}

export function gygKontextWechseln(lauf: GygLauf, kontext: string): GygLauf {
  if (lauf.kontext === kontext) return lauf
  return {
    epoche: lauf.epoche + 1,
    kontext,
    naechsteGeneration: lauf.naechsteGeneration,
    phase: 'ruhend',
    generation: null,
    bezug: null,
    fehler: null,
  }
}

export function gygAnfordern(lauf: GygLauf, bezug: GygOeffentlicherBezug): GygDispatch {
  if (lauf.phase === 'laeuft') return { angenommen: false, lauf }
  const generation = lauf.naechsteGeneration
  const next: GygLauf = {
    ...lauf,
    naechsteGeneration: generation + 1,
    phase: 'laeuft',
    generation,
    bezug,
    fehler: null,
  }
  return { angenommen: true, lauf: next, epoche: next.epoche, generation, bezug }
}

export function gygFehlertext(meldung: string | null | undefined): string {
  if (!meldung) return FEHLER_STANDARD
  const text = meldung.trim()
  if (!text || text.length > 180) return FEHLER_STANDARD
  if (/[<>]/.test(text) || /https?:/i.test(text)) return FEHLER_STANDARD
  return text
}

/**
 * Eine Ressource beweist nur, dass der Ladevorgang endete.
 * Daraus wird keine Angebotszahl, keine Leere und keine Buchung.
 */
export function gygAbschluss(
  lauf: GygLauf,
  erwartet: { epoche: number; generation: number },
  ergebnis: { art: 'ressource' } | { art: 'abgelehnt'; meldung: string },
): GygLauf {
  if (lauf.epoche !== erwartet.epoche) return lauf
  if (lauf.phase !== 'laeuft' || lauf.generation !== erwartet.generation) return lauf
  if (ergebnis.art === 'ressource') {
    return { ...lauf, phase: 'anzeige', fehler: null }
  }
  // Der mitgelieferte Text ist kein Fehlervertrag. Sichtbar bleibt der feste Satz.
  return { ...lauf, phase: 'fehler', fehler: gygFehlertext(null) }
}
