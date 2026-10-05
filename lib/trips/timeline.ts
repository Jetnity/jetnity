// lib/trips/timeline.ts
//
// TW-3 Timeline. Reine Presentation-Ableitung über den kanonischen
// Trip-Graphen (ADR-0166). Keine Persistenz, keine URL-Wahrheit,
// kein zweiter Auswahlvertrag.
//
// Etappen kommen nur aus `reise.stages`. Flight-Transitländer sind
// keine Nutzerziele. Die einzige Tag-Auswahl bleibt `gewaehlterTagId`.

import { gewaehlterTagId, planStatus } from '@/lib/trips/arbeitsbereich'
import { dayStageAssignmentModeLesenDb } from '@/lib/trips/day-stage-assignment'
import type { Trip, TripDay, TripItem, TripStage } from '@/types/trips'

export type TimelineEtappe = {
  stageId: string | null
  name: string
  countryCode: string | null
  arrivalDate: string | null
  departureDate: string | null
  istNutzerziel: boolean
  tage: TripDay[]
}

export type TimelineAbleitung = {
  etappen: TimelineEtappe[]
  ungeplante: readonly TripItem[]
  gewaehlterTagId: string
  gewaehlterTag: TripDay | null
  gewaehlteEtappeId: string | null
  hatTage: boolean
  planText: string
}

function etappenSortieren(links: TripStage, rechts: TripStage): number {
  const position = links.position - rechts.position
  if (position !== 0) return position
  return links.id.localeCompare(rechts.id)
}

function tageSortieren(links: TripDay, rechts: TripDay): number {
  const index = links.dayIndex - rechts.dayIndex
  if (index !== 0) return index
  return links.id.localeCompare(rechts.id)
}

export function timelineAbleiten(
  reise: Trip,
  ohneTag: readonly TripItem[] = [],
  bisherTagId = '',
): TimelineAbleitung {
  const ungeplante = ohneTag.length > 0 ? ohneTag : reise.ohneTag
  const stages = [...reise.stages].sort(etappenSortieren)
  const stageIds = new Set(stages.map((stage) => stage.id))
  const nachStage = new Map<string, TripDay[]>()
  const ohneEtappe: TripDay[] = []

  for (const tag of [...reise.days].sort(tageSortieren)) {
    if (!tag.stageId || !stageIds.has(tag.stageId)) {
      ohneEtappe.push(tag)
      continue
    }
    const liste = nachStage.get(tag.stageId) ?? []
    liste.push(tag)
    nachStage.set(tag.stageId, liste)
  }

  const etappen: TimelineEtappe[] = stages.map((stage) => ({
    stageId: stage.id,
    name: stage.name,
    countryCode: stage.countryCode,
    arrivalDate: stage.arrivalDate,
    departureDate: stage.departureDate,
    istNutzerziel: true,
    tage: nachStage.get(stage.id) ?? [],
  }))

  if (ohneEtappe.length > 0) {
    const mode = dayStageAssignmentModeLesenDb(reise.dayStageAssignmentMode)
    etappen.push({
      stageId: null,
      name: mode === 'legacy_fallback' ? 'Ohne Etappe' : 'Noch keinem Ziel zugeordnet',
      countryCode: null,
      arrivalDate: null,
      departureDate: null,
      istNutzerziel: false,
      tage: ohneEtappe,
    })
  }

  const gewählt = gewaehlterTagId(reise, bisherTagId)
  const gewaehlterTag = reise.days.find((tag) => tag.id === gewählt) ?? null

  return {
    etappen,
    ungeplante,
    gewaehlterTagId: gewählt,
    gewaehlterTag,
    gewaehlteEtappeId: gewaehlterTag?.stageId ?? null,
    hatTage: reise.days.length > 0,
    planText: planStatus(reise, ungeplante).text,
  }
}

export function ersterTagDerEtappe(
  etappen: readonly TimelineEtappe[],
  stageId: string | null,
): string {
  return etappen.find((etappe) => etappe.stageId === stageId)?.tage[0]?.id ?? ''
}
