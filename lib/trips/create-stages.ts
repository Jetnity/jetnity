// lib/trips/create-stages.ts
//
// Gemeinsamer Create-Graph für Guest und Account.
//
// Eine bestätigte, geordnete Zielliste wird auf die vorhandene trip_stages-
// Struktur abgebildet. Kein neues Stage-Modell, keine Schattenpersistenz.
// Client-Namen, Länder oder Koordinaten gehören nicht hierher – nur bereits
// serverseitig bestätigte `Ort`-Fakten.

import type { Ort } from '@/lib/places/domain'
import {
  createDayPositions,
  type Tagesanspruch,
} from '@/lib/trips/create-day-assignment'
import { GRENZEN } from '@/lib/trips/schema'
import type { DayStageAssignmentMode } from '@/lib/trips/day-stage-assignment'
import { reisetageBauen } from '@/lib/trips/tage'

export type CreateZielFakt = {
  position: number
  name: string
  countryCode: string | null
  arrivalDate: string | null
  departureDate: string | null
  latitude: number | null
  longitude: number | null
  placeId: string
}

export type CreateZieleGraph = {
  title: string
  einzelziel: boolean
  assignmentMode: DayStageAssignmentMode
  stages: CreateZielFakt[]
  /** Gemeinsame Position, wenn jeder Tag dieselbe Etappe trägt. Sonst `null`. */
  dayStagePosition: number | null
  /** Eine Position je Kalendertag. `null` bleibt ohne Ziel. */
  dayStagePositions: Array<number | null>
}

export function createZieleGraph(
  destinations: Ort[],
  zeitraum: { startDate: string; endDate: string },
  allocation?: { claims: readonly Tagesanspruch[] } | null,
): CreateZieleGraph {
  if (destinations.length === 0) {
    throw new Error('Mindestens ein bestätigtes Reiseziel ist erforderlich.')
  }
  if (destinations.length > GRENZEN.etappenJeReise) {
    throw new Error(`Eine Reise trägt höchstens ${GRENZEN.etappenJeReise} Reiseziele.`)
  }

  const zuordnung = createDayPositions({
    stageCount: destinations.length,
    startDate: zeitraum.startDate,
    endDate: zeitraum.endDate,
    allocation: allocation ?? null,
  })
  if (!zuordnung.ok) throw new Error(zuordnung.message)

  const einzelziel = destinations.length === 1

  return {
    title: destinations[0].name,
    einzelziel,
    assignmentMode: zuordnung.mode,
    stages: destinations.map((ziel, index) => ({
      position: index + 1,
      name: ziel.name,
      countryCode: ziel.countryCode,
      arrivalDate: einzelziel ? zeitraum.startDate : null,
      departureDate: einzelziel ? zeitraum.endDate : null,
      latitude: ziel.lat,
      longitude: ziel.lon,
      placeId: ziel.id,
    })),
    dayStagePosition: einzelziel ? 1 : null,
    dayStagePositions: zuordnung.positions,
  }
}

/** Dieselben Kalendertage und Positionen, die das Konto an `reise_anlegen` gibt. */
export function createKontoTage(
  graph: CreateZieleGraph,
  zeitraum: { startDate: string; endDate: string },
) {
  const tage = reisetageBauen(zeitraum.startDate, zeitraum.endDate)
  if (tage.length !== graph.dayStagePositions.length) {
    throw new Error('Die Tageszuordnung passt nicht zum Reisezeitraum.')
  }
  return tage.map((tag, index) => ({
    day_index: tag.dayIndex,
    day_date: tag.dayDate,
    title: null as null,
    stage_position: graph.dayStagePositions[index] ?? null,
    items: [] as [],
  }))
}
