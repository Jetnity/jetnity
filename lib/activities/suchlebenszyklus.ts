// lib/activities/suchlebenszyklus.ts
//
// Lokale Lebensdauer der Aktivitätensuche und der Übernahme.
// Identität nur für die gemountete Oberfläche: Reise, Etappe, Tag,
// semantischer Anfrageinhalt und eine frische Generation je Auslösung.
// Kein Commercial-Provenance-Modell, kein Speicher, kein Provider, kein Abbruch
// eines bereits betretenen Schreibers.

import type { ActivityOptionSichtbar, ActivitySucheAntwort } from '@/lib/activities/client-sicht'

export const ACTIVITY_HINWEIS_GEMELDET =
  'Die Übernahme wurde gemeldet. Das bestätigt nicht, dass der Punkt in der Reise gespeichert ist. Bitte prüfe die Reise.'

export const ACTIVITY_HINWEIS_UNBESTAETIGT =
  'Die Übernahme ist nicht bestätigt. Bitte prüfe die Reise, bevor du es erneut versuchst. Daraus folgt nicht, dass nichts gespeichert wurde.'

export type ActivitySuchKontextTeile = {
  tripId: string
  stageId: string | null
  dayId: string | null
  /** Serialisierte Suchanfrage ohne Reise-ID. Die Reise-ID gehört nur zur lokalen Identität. */
  anfrageSchluessel: string
}

export type SuchLauf = {
  epoche: number
  kontext: string
  naechsteGeneration: number
  phase: 'idle' | 'loading' | 'fertig'
  generation: number | null
  antwort: ActivitySucheAntwort | null
}

export type SuchDispatch =
  | { angenommen: false; lauf: SuchLauf }
  | { angenommen: true; lauf: SuchLauf; epoche: number; generation: number }

export function activitySuchKontextSchluessel(teile: ActivitySuchKontextTeile): string {
  return JSON.stringify([teile.tripId, teile.stageId, teile.dayId, teile.anfrageSchluessel])
}

export function suchLaufStart(kontext: string): SuchLauf {
  return {
    epoche: 1,
    kontext,
    naechsteGeneration: 1,
    phase: 'idle',
    generation: null,
    antwort: null,
  }
}

/** Ein Kontextwechsel verwirft die sichtbare Antwort sofort und erhöht die Epoche. Die Generationsfolge läuft weiter. */
export function suchKontextWechseln(lauf: SuchLauf, kontext: string): SuchLauf {
  if (lauf.kontext === kontext) return lauf
  return {
    epoche: lauf.epoche + 1,
    kontext,
    naechsteGeneration: lauf.naechsteGeneration,
    phase: 'idle',
    generation: null,
    antwort: null,
  }
}

/** Eine zweite Auslösung derselben laufenden Generation wird synchron abgelehnt. */
export function suchDispatch(lauf: SuchLauf): SuchDispatch {
  if (lauf.phase === 'loading') return { angenommen: false, lauf }
  const generation = lauf.naechsteGeneration
  return {
    angenommen: true,
    epoche: lauf.epoche,
    generation,
    lauf: {
      ...lauf,
      naechsteGeneration: generation + 1,
      phase: 'loading',
      generation,
      antwort: null,
    },
  }
}

/**
 * Eine Antwort gilt nur für genau diese Epoche und Generation, und nur solange
 * diese Generation noch die laufende ist. Ein ignoriertes AbortSignal reicht nicht.
 */
export function suchAntwortAnwenden(
  lauf: SuchLauf,
  erwartet: { epoche: number; generation: number },
  antwort: ActivitySucheAntwort,
): SuchLauf {
  if (lauf.epoche !== erwartet.epoche) return lauf
  if (lauf.phase !== 'loading' || lauf.generation !== erwartet.generation) return lauf
  return { ...lauf, phase: 'fertig', antwort }
}

export function optionInhaltSchluessel(option: ActivityOptionSichtbar): string {
  return JSON.stringify({
    id: option.id,
    provider: option.provider,
    externalRef: option.externalRef,
    title: option.title,
    description: option.description,
    locationName: option.locationName,
    punkt: option.punkt,
    dauerMinuten: option.dauerMinuten,
    timeslot: option.timeslot,
    preis: option.preis,
    preisWaehrung: option.preisWaehrung,
    bewertung: option.bewertung,
    bewertungenAnzahl: option.bewertungenAnzahl,
    stornierbar: option.stornierbar,
    kategorien: option.kategorien,
    tags: option.tags,
    labels: option.labels,
    reasons: option.reasons,
    konflikt: option.konflikt,
  })
}

export type UebernahmeErfassung = {
  tripId: string
  stageId: string
  dayId: string
  epoche: number
  generation: number
  optionInhalt: string
}

export function uebernahmeSchluessel(erfasst: UebernahmeErfassung): string {
  return JSON.stringify(erfasst)
}

export function uebernahmeDarfSenden(
  erfasst: UebernahmeErfassung,
  sichtbar: { epoche: number; generation: number | null; inhalte: readonly string[] } | null,
): boolean {
  if (!sichtbar) return false
  if (sichtbar.epoche !== erfasst.epoche || sichtbar.generation !== erfasst.generation) return false
  return sichtbar.inhalte.includes(erfasst.optionInhalt)
}

export type UebernahmeRegister = {
  laufend: readonly string[]
  abgeschlossen: readonly string[]
}

export function leeresUebernahmeRegister(): UebernahmeRegister {
  return { laufend: [], abgeschlossen: [] }
}

export function uebernahmeBeanspruchen(
  register: UebernahmeRegister,
  schluessel: string,
): { ok: true; register: UebernahmeRegister } | { ok: false; grund: 'doppelt' | 'abgeschlossen' } {
  if (register.abgeschlossen.includes(schluessel)) return { ok: false, grund: 'abgeschlossen' }
  if (register.laufend.includes(schluessel)) return { ok: false, grund: 'doppelt' }
  return { ok: true, register: { ...register, laufend: [...register.laufend, schluessel] } }
}

/** Gibt nur den eigenen Anspruch frei und merkt ihn als abgeschlossen. Andere Ansprüche bleiben. */
export function uebernahmeAbschliessen(register: UebernahmeRegister, schluessel: string): UebernahmeRegister {
  if (!register.laufend.includes(schluessel)) return register
  return {
    laufend: register.laufend.filter((eintrag) => eintrag !== schluessel),
    abgeschlossen: register.abgeschlossen.includes(schluessel)
      ? register.abgeschlossen
      : [...register.abgeschlossen, schluessel],
  }
}

export type UebernahmeAusgang =
  | { art: 'gemeldet' }
  | { art: 'text'; text: string }
  | { art: 'unbestaetigt' }

function sichererRuecktext(wert: string): string | null {
  const text = wert.trim()
  if (text.length < 1 || text.length > 240) return null
  if (/[\u0000-\u001F<>]/.test(text)) return null
  return text
}

/** `null` ist nur die dokumentierte Erfolgsmeldung des Rückrufs. Alles andere bleibt unbestätigt. */
export function uebernahmeErgebnisLesen(wert: unknown): UebernahmeAusgang {
  if (wert === null) return { art: 'gemeldet' }
  if (typeof wert === 'string') {
    const text = sichererRuecktext(wert)
    return text ? { art: 'text', text } : { art: 'unbestaetigt' }
  }
  return { art: 'unbestaetigt' }
}

/** Eine spätere Suche auf demselben Tag macht eine ältere Übernahmemeldung ungültig. */
export function uebernahmeHinweisNochGueltig(sucheMark: number, anspruchSeq: number): boolean {
  return sucheMark <= anspruchSeq
}

export function uebernahmeHinweisText(ausgang: UebernahmeAusgang): string {
  if (ausgang.art === 'gemeldet') return ACTIVITY_HINWEIS_GEMELDET
  if (ausgang.art === 'text') return `${ausgang.text} ${ACTIVITY_HINWEIS_UNBESTAETIGT}`
  return ACTIVITY_HINWEIS_UNBESTAETIGT
}
