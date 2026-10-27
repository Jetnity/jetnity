// Kalendarische Tagesfolge für den Reiseplan.
//
// `timeline.etappen` bleibt die sekundäre Zielübersicht: Etappen zuerst,
// Tage ohne Ziel als eine nachgestellte Gruppe. Diese Ableitung ändert
// keine Tages-, Punkt- oder Etappenkennung und sortiert den gespeicherten
// Graphen nicht um.

import { dayStageAssignmentModeLesenDb } from '@/lib/trips/day-stage-assignment'
import { lokalePlanzeit } from '@/lib/trips/trip-timeline-core-1'
import type { Trip, TripDay, TripItem, TripStage } from '@/types/trips'

export const REISETAG_OHNE_ZIEL = 'Reisetag mit geplantem Flug/Transfer'
export const ZUORDNUNG_OFFEN = 'Noch keinem Ziel zugeordnet'
export const OHNE_ETAPPE = 'Ohne Etappe'

const ISO_TAG = /^\d{4}-\d{2}-\d{2}$/

export type ChronologieLesart = 'ziel' | 'reise-ohne-ziel' | 'zuordnung-offen'

export type ChronologischerLauf = {
  schluessel: string
  stageId: string | null
  name: string
  countryCode: string | null
  arrivalDate: string | null
  departureDate: string | null
  istNutzerziel: boolean
  lesart: ChronologieLesart
  /** Dieselben Tagesobjekte wie im Graphen, nicht Kopien. */
  tage: TripDay[]
}

export type QuerMitternachtRolle = 'spanne' | 'fortsetzung'

export type QuerMitternachtHinweis = {
  itemId: string
  kind: 'flight' | 'transfer'
  titel: string
  startsOn: string
  startsAt: string | null
  endsOn: string
  endsAt: string | null
  /** Tag, an dem der Punkt gespeichert ist. */
  tagId: string
  /** Tag, auf dem dieser Hinweis sichtbar ist. Kein zweiter Punkt. */
  sichtbarAufTagId: string
  rolle: QuerMitternachtRolle
}

export type Chronologie =
  | {
      gueltig: true
      laeufe: ChronologischerLauf[]
      hinweise: QuerMitternachtHinweis[]
    }
  | {
      gueltig: false
      grund: 'tageskennung' | 'tagesindex'
      laeufe: []
      hinweise: []
    }

function tageSortieren(links: TripDay, rechts: TripDay): number {
  const index = links.dayIndex - rechts.dayIndex
  if (index !== 0) return index
  return links.id.localeCompare(rechts.id)
}

function hatGespeicherteReise(tag: TripDay): boolean {
  return tag.items.some((punkt) => punkt.kind === 'flight' || punkt.kind === 'transfer')
}

function ersteEtappen(reise: Trip): Map<string, TripStage> {
  const etappen = new Map<string, TripStage>()
  for (const etappe of reise.stages) {
    if (!etappen.has(etappe.id)) etappen.set(etappe.id, etappe)
  }
  return etappen
}

function isoTag(wert: string | null): wert is string {
  return typeof wert === 'string' && ISO_TAG.test(wert)
}

function hinweiseSammeln(tage: readonly TripDay[]): QuerMitternachtHinweis[] {
  const nachDatum = new Map<string, TripDay[]>()
  for (const tag of tage) {
    if (!isoTag(tag.dayDate)) continue
    const liste = nachDatum.get(tag.dayDate) ?? []
    liste.push(tag)
    nachDatum.set(tag.dayDate, liste)
  }

  const hinweise: QuerMitternachtHinweis[] = []
  const gesehen = new Set<string>()
  for (const tag of tage) {
    for (const punkt of tag.items) {
      if (!istReisePunkt(punkt)) continue
      if (punkt.dayId !== tag.id) continue
      if (!isoTag(punkt.startsOn) || !isoTag(punkt.endsOn)) continue
      if (!(punkt.startsOn < punkt.endsOn)) continue
      if (gesehen.has(punkt.id)) continue
      gesehen.add(punkt.id)
      const basis = {
        itemId: punkt.id,
        kind: punkt.kind,
        titel: punkt.title,
        startsOn: punkt.startsOn,
        startsAt: lokalePlanzeit(punkt.startsAt),
        endsOn: punkt.endsOn,
        endsAt: lokalePlanzeit(punkt.endsAt),
        tagId: tag.id,
      }
      hinweise.push({ ...basis, sichtbarAufTagId: tag.id, rolle: 'spanne' })
      for (const ziel of nachDatum.get(punkt.endsOn) ?? []) {
        if (ziel.id === tag.id) continue
        hinweise.push({ ...basis, sichtbarAufTagId: ziel.id, rolle: 'fortsetzung' })
      }
    }
  }
  return hinweise
}

function istReisePunkt(punkt: TripItem): punkt is TripItem & { kind: 'flight' | 'transfer' } {
  return punkt.kind === 'flight' || punkt.kind === 'transfer'
}

function laufAnlegen(
  stage: TripStage | null,
  reiseTag: boolean,
  tag: TripDay,
  ohneZiel: string,
): ChronologischerLauf {
  if (stage) {
    return {
      schluessel: `${stage.id}:ziel:${tag.id}`,
      stageId: stage.id,
      name: stage.name,
      countryCode: stage.countryCode,
      arrivalDate: stage.arrivalDate,
      departureDate: stage.departureDate,
      istNutzerziel: true,
      lesart: 'ziel',
      tage: [tag],
    }
  }
  const lesart: ChronologieLesart = reiseTag ? 'reise-ohne-ziel' : 'zuordnung-offen'
  return {
    schluessel: `ohne:${lesart}:${tag.id}`,
    stageId: null,
    name: reiseTag ? REISETAG_OHNE_ZIEL : ohneZiel,
    countryCode: null,
    arrivalDate: null,
    departureDate: null,
    istNutzerziel: false,
    lesart,
    tage: [tag],
  }
}

export function laufUntertitel(lauf: ChronologischerLauf): string {
  if (lauf.lesart === 'reise-ohne-ziel') {
    return 'Gespeicherter Flug oder Transfer. Die Zielzuordnung ist noch offen.'
  }
  if (!lauf.istNutzerziel) return 'Tage ohne festgelegten Aufenthalt'
  return ''
}

export function reisehinweisText(hinweis: QuerMitternachtHinweis): string {
  const startZeit = hinweis.startsAt ? ` ${hinweis.startsAt}` : ''
  const endZeit = hinweis.endsAt ? ` ${hinweis.endsAt}` : ''
  const zeit = hinweis.startsAt || hinweis.endsAt ? 'Ortszeit ohne Zeitzone.' : 'Uhrzeit nicht gespeichert.'
  if (hinweis.rolle === 'spanne') {
    const art = hinweis.kind === 'flight' ? 'Flug' : 'Transfer'
    return `Gespeicherter ${art} «${hinweis.titel}»: ${hinweis.startsOn}${startZeit} bis ${hinweis.endsOn}${endZeit}. ${zeit} Keine Übernachtung abgeleitet.`
  }
  const art = hinweis.kind === 'flight' ? 'Flugs' : 'Transfers'
  return `Fortsetzung desselben gespeicherten ${art} «${hinweis.titel}» vom ${hinweis.startsOn}. Ankunft laut Plan am ${hinweis.endsOn}${endZeit}. Dieselbe Kennung ${hinweis.itemId}. Keine zweite Buchung und keine Übernachtung.`
}

/**
 * Tagesfolge nach `dayIndex`, dann Tageskennung.
 * Zusammenhängende Läufe folgen der gespeicherten Etappe.
 * Benachbarte Tage ohne Etappe trennen sich, wenn nur einer einen
 * gespeicherten Flug oder Transfer trägt.
 * Doppelte Kennungen oder Tagesnummern liefern keine Reihenfolge.
 */
export function chronologischeLaeufe(reise: Trip): Chronologie {
  const kennungen = new Set<string>()
  const indizes = new Set<number>()
  for (const tag of reise.days) {
    if (typeof tag.id !== 'string' || tag.id.length === 0 || kennungen.has(tag.id)) {
      return { gueltig: false, grund: 'tageskennung', laeufe: [], hinweise: [] }
    }
    kennungen.add(tag.id)
    if (!Number.isInteger(tag.dayIndex) || tag.dayIndex < 1 || indizes.has(tag.dayIndex)) {
      return { gueltig: false, grund: 'tagesindex', laeufe: [], hinweise: [] }
    }
    indizes.add(tag.dayIndex)
  }

  const etappen = ersteEtappen(reise)
  const ohneZiel = dayStageAssignmentModeLesenDb(reise.dayStageAssignmentMode) === 'legacy_fallback'
    ? OHNE_ETAPPE
    : ZUORDNUNG_OFFEN
  const sortiert = [...reise.days].sort(tageSortieren)
  const laeufe: ChronologischerLauf[] = []

  for (const tag of sortiert) {
    const stage = tag.stageId ? etappen.get(tag.stageId) ?? null : null
    const reiseTag = hatGespeicherteReise(tag)
    const letzter = laeufe[laeufe.length - 1]
    const stageId = stage?.id ?? null
    const lesart: ChronologieLesart = stage ? 'ziel' : reiseTag ? 'reise-ohne-ziel' : 'zuordnung-offen'
    const trennen = !letzter
      || letzter.stageId !== stageId
      || (stageId === null && letzter.lesart !== lesart)
    if (trennen || !letzter) {
      laeufe.push(laufAnlegen(stage, reiseTag, tag, ohneZiel))
      continue
    }
    letzter.tage.push(tag)
  }

  return { gueltig: true, laeufe, hinweise: hinweiseSammeln(sortiert) }
}
