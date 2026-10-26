// lib/activities/suchlebenszyklus.ts
//
// Lokale Lebensdauer der Aktivitätensuche und der Übernahme.
// Die Suche hat Epoche und Generation. Die Übernahme hat eine eigene
// Operation: Reise, Etappe, Tag und die Fakten, die der Schreiber in den
// Planpunkt übernimmt. Labels, Gründe und Konflikt sind abgeleitete
// Rangdarstellung und öffnen dieselbe Operation nicht neu.
// Die vollständige sichtbare Karte bleibt separat und sperrt nur veraltete Handler.
// Kein Commercial-Provenance-Modell, kein Speicher, kein Provider, kein Abbruch
// eines bereits betretenen Schreibers. Ein Unmount verwirft nur dieses Register.

import type { ActivityOptionSichtbar, ActivitySucheAntwort } from '@/lib/activities/client-sicht'
import { alsActivityMomentaufnahme } from '@/lib/activities/uebernahme'

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
  /** Vollständige sichtbare Karte, einschliesslich Rangfelder. Nur für veraltete Handler. */
  optionInhalt: string
  /** Schreiber-Fakten ohne Labels, Gründe und Konflikt. Nur für das Operationsschloss. */
  schreibIdentitaet: string
}

/**
 * Identität der Übernahme ist die bestehende Schreiber-Momentaufnahme.
 * Die reine Abbildung rundet eine Bewertung auf eine Nachkommastelle und
 * lässt Bewertung samt Anzahl weg, wenn keine Bewertung vorliegt.
 * Rohwerte, die dort gleich ankommen, bleiben eine Operation.
 * Eine abgelehnte Abbildung hat keinen Planpunkt und daher keine eigene Identität.
 */
export function optionSchreibIdentitaet(option: ActivityOptionSichtbar, tagDatum: string | null): string {
  return JSON.stringify(alsActivityMomentaufnahme(option, tagDatum))
}

/**
 * Identität der Übernahme, ohne Epoche, Generation und ohne abgeleitete Rangfelder.
 * Dieselbe effektive Schreiber-Momentaufnahme bleibt dieselbe Operation.
 * Ein anderer gespeicherter Fakt oder ein anderes Ziel ist eine andere Operation.
 */
export function uebernahmeOperationSchluessel(
  erfasst: Pick<UebernahmeErfassung, 'tripId' | 'stageId' | 'dayId' | 'schreibIdentitaet'>,
): string {
  return JSON.stringify([
    erfasst.tripId,
    erfasst.stageId,
    erfasst.dayId,
    erfasst.schreibIdentitaet,
  ])
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
  angenommen: readonly string[]
  unbestaetigt: readonly string[]
}

export function leeresUebernahmeRegister(): UebernahmeRegister {
  return { laufend: [], angenommen: [], unbestaetigt: [] }
}

export function uebernahmeBeanspruchen(
  register: UebernahmeRegister,
  schluessel: string,
):
  | { ok: true; register: UebernahmeRegister }
  | { ok: false; grund: 'doppelt' | 'angenommen' | 'unbestaetigt' } {
  if (register.angenommen.includes(schluessel)) return { ok: false, grund: 'angenommen' }
  if (register.unbestaetigt.includes(schluessel)) return { ok: false, grund: 'unbestaetigt' }
  if (register.laufend.includes(schluessel)) return { ok: false, grund: 'doppelt' }
  return { ok: true, register: { ...register, laufend: [...register.laufend, schluessel] } }
}

/**
 * Beendet nur die eigene laufende Operation.
 * `angenommen` bleibt für diese gemountete Fläche geschlossen.
 * `unbestaetigt` bleibt geschlossen, bis sie ausdrücklich freigegeben wird.
 */
export function uebernahmeAbschliessen(
  register: UebernahmeRegister,
  schluessel: string,
  ergebnis: 'angenommen' | 'unbestaetigt',
): UebernahmeRegister {
  if (!register.laufend.includes(schluessel)) return register
  const laufend = register.laufend.filter((eintrag) => eintrag !== schluessel)
  if (ergebnis === 'angenommen') {
    return {
      laufend,
      angenommen: register.angenommen.includes(schluessel)
        ? register.angenommen
        : [...register.angenommen, schluessel],
      unbestaetigt: register.unbestaetigt.filter((eintrag) => eintrag !== schluessel),
    }
  }
  return {
    laufend,
    angenommen: register.angenommen,
    unbestaetigt: register.unbestaetigt.includes(schluessel)
      ? register.unbestaetigt
      : [...register.unbestaetigt, schluessel],
  }
}

/**
 * Öffnet nur eine unbestätigte Operation, und nur auf ausdrückliche Handlung.
 * Laufende und angenommene Operationen bleiben geschlossen.
 * Eine neue Suche ruft das nicht auf.
 */
export function uebernahmeUnbestaetigtFreigeben(
  register: UebernahmeRegister,
  schluessel: string,
): UebernahmeRegister {
  if (!register.unbestaetigt.includes(schluessel)) return register
  if (register.laufend.includes(schluessel) || register.angenommen.includes(schluessel)) return register
  return {
    ...register,
    unbestaetigt: register.unbestaetigt.filter((eintrag) => eintrag !== schluessel),
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

export function uebernahmeHinweisText(ausgang: UebernahmeAusgang): string {
  if (ausgang.art === 'gemeldet') return ACTIVITY_HINWEIS_GEMELDET
  if (ausgang.art === 'text') return `${ausgang.text} ${ACTIVITY_HINWEIS_UNBESTAETIGT}`
  return ACTIVITY_HINWEIS_UNBESTAETIGT
}

/** Sichtbarer Name der erfassten Aktivität, damit eine Meldung ohne Karte zuordenbar bleibt. */
export function uebernahmeHinweisBezeichnung(option: {
  title: string
  timeslot: { startsAt: string; endsAt: string | null } | null
}): string {
  const titel = option.title.replace(/[\u0000-\u001F<>]/g, '').trim().slice(0, 120)
  const zeit = option.timeslot
    ? `${option.timeslot.startsAt}${option.timeslot.endsAt ? `–${option.timeslot.endsAt}` : ''}`
    : ''
  const zeitSicher = zeit.replace(/[\u0000-\u001F<>]/g, '').trim()
  const text = [titel, zeitSicher].filter((teil) => teil.length > 0).join(' · ')
  return text.slice(0, 160) || 'Aktivität'
}

export type UebernahmeHinweisEintrag = {
  text: string
  /** Erfasste Aktivität. Steht an der Meldung, wenn keine Karte sie trägt. */
  bezeichnung: string
  seq: number
  tripId: string
  stageId: string
  dayId: string
}

/**
 * Speichert die Meldung an der Operation.
 * Eine bereits neuere Meldung derselben Operation bleibt stehen.
 * Das Schloss der Operation wird hier nicht angefasst.
 */
export function uebernahmeHinweisSetzen(
  bisher: Readonly<Record<string, UebernahmeHinweisEintrag>>,
  schluessel: string,
  eintrag: UebernahmeHinweisEintrag,
): Record<string, UebernahmeHinweisEintrag> {
  const alt = bisher[schluessel]
  if (alt && alt.seq > eintrag.seq) return { ...bisher }
  return { ...bisher, [schluessel]: eintrag }
}

/**
 * Eine Meldung gehört zur Operation, nicht zur gerade sichtbaren anderen Karte.
 * Neben der Karte bleibt der Satz allein, weil die Karte die Aktivität nennt.
 * `karten === null` ist nur die Fläche ohne aktuelle Antwort. Dort nennt jede
 * Meldung ihre erfasste Aktivität, auch wenn eine neuere Übernahme noch läuft.
 * Eine laufende oder fertige neuere Antwort zeigt eine Meldung nur neben der
 * Karte derselben Operation. Das Schloss bleibt unberührt.
 */
export function uebernahmeHinweisTexte(
  hinweise: Readonly<Record<string, UebernahmeHinweisEintrag>>,
  sicht: {
    tripId: string
    stageId: string
    dayId: string
    karten: readonly string[] | null
  },
): { allgemein: readonly string[]; jeKarte: Readonly<Record<string, string>> } {
  const tag = Object.entries(hinweise).filter(
    ([, eintrag]) =>
      eintrag.tripId === sicht.tripId && eintrag.stageId === sicht.stageId && eintrag.dayId === sicht.dayId,
  )
  if (sicht.karten) {
    const erlaubt = new Set(sicht.karten)
    const jeKarte: Record<string, string> = {}
    for (const [schluessel, eintrag] of tag) {
      if (erlaubt.has(schluessel)) jeKarte[schluessel] = eintrag.text
    }
    return { allgemein: [], jeKarte }
  }
  const allgemein: string[] = []
  const gesehen = new Set<string>()
  for (const [, eintrag] of tag) {
    const text = `${eintrag.bezeichnung}: ${eintrag.text}`
    if (gesehen.has(text)) continue
    gesehen.add(text)
    allgemein.push(text)
  }
  return { allgemein, jeKarte: {} }
}
