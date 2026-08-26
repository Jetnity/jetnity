// lib/trips/create-stages.ts
//
// Gemeinsamer Create-Graph für Guest und Account.
//
// Eine bestätigte, geordnete Zielliste wird auf die vorhandene trip_stages-
// Struktur abgebildet. Kein neues Stage-Modell, keine Schattenpersistenz.
// Client-Namen, Länder oder Koordinaten gehören nicht hierher – nur bereits
// serverseitig bestätigte `Ort`-Fakten.

import type { Ort } from '@/lib/places/domain'
import { GRENZEN } from '@/lib/trips/schema'

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
  stages: CreateZielFakt[]
  dayStagePosition: number | null
}

export function createZieleGraph(
  destinations: Ort[],
  zeitraum: { startDate: string; endDate: string },
): CreateZieleGraph {
  if (destinations.length === 0) {
    throw new Error('Mindestens ein bestätigtes Reiseziel ist erforderlich.')
  }
  if (destinations.length > GRENZEN.etappenJeReise) {
    throw new Error(`Eine Reise trägt höchstens ${GRENZEN.etappenJeReise} Reiseziele.`)
  }

  const einzelziel = destinations.length === 1

  return {
    title: destinations[0].name,
    einzelziel,
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
  }
}
