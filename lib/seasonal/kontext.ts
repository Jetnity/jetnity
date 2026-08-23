// lib/seasonal/kontext.ts
//
// Reisekontext für Seasonal. Route Truth nur aus Foundation D.
// Traveller-/Citizenship-Felder gehören nicht in den Foundation-Kontext.

import { routeFactsAusGraph } from '@/lib/route/ableitung'
import type { RouteFacts } from '@/lib/route/domain'
import { iataLesen, seasonalLandescode } from '@/lib/seasonal/domain'
import { planpunkteSammeln } from '@/lib/trips/arbeitsbereich'
import type { Trip, TripItem, TripStage } from '@/types/trips'

export type SeasonalStageKontext = {
  id: string
  name: string
  countryCode: string | null
  placeId: string | null
  latitude: number | null
  longitude: number | null
  arrivalDate: string | null
  departureDate: string | null
}

export type SeasonalItemKontext = {
  id: string
  kind: TripItem['kind']
  title: string
  stageId: string | null
  dayId: string | null
  startsOn: string | null
  endsOn: string | null
  originPlaceId: string | null
  destinationPlaceId: string | null
}

export type SeasonalReisekontext = {
  startDate: string | null
  endDate: string | null
  stages: SeasonalStageKontext[]
  items: SeasonalItemKontext[]
  days: Array<{ id: string; stageId: string | null; dayDate: string | null }>
  route: RouteFacts
  countryCodes: string[]
  airportCodes: string[]
  placeIds: string[]
}

function etappeVon(etappe: TripStage): SeasonalStageKontext {
  return {
    id: etappe.id,
    name: etappe.name,
    countryCode: seasonalLandescode(etappe.countryCode),
    placeId: etappe.placeId,
    latitude: etappe.latitude,
    longitude: etappe.longitude,
    arrivalDate: etappe.arrivalDate,
    departureDate: etappe.departureDate,
  }
}

export function effektiveItemStageId(
  item: Pick<SeasonalItemKontext, 'stageId' | 'dayId'>,
  days: readonly { id: string; stageId: string | null }[],
): string | null {
  const tag = item.dayId ? days.find((eintrag) => eintrag.id === item.dayId) : undefined
  const dayStageId = tag?.stageId ?? null
  if (item.stageId && dayStageId && item.stageId !== dayStageId) return null
  return item.stageId ?? dayStageId
}

export function seasonalReisekontext(reise: Trip): SeasonalReisekontext {
  const stages = reise.stages.map(etappeVon)
  const items = planpunkteSammeln(reise, reise.ohneTag).map((punkt) => ({
    id: punkt.id,
    kind: punkt.kind,
    title: punkt.title,
    stageId: punkt.stageId,
    dayId: punkt.dayId,
    startsOn: punkt.startsOn,
    endsOn: punkt.endsOn,
    originPlaceId: punkt.originPlaceId,
    destinationPlaceId: punkt.destinationPlaceId,
  }))
  const route = routeFactsAusGraph(reise)
  const countryCodes = [
    ...new Set(
      [
        ...stages.map((etappe) => etappe.countryCode),
        route.origin.countryCode,
        route.destination.countryCode,
        ...route.transitCountryCodes,
        ...route.destinationCountryCodes,
      ].filter((code): code is string => Boolean(seasonalLandescode(code))),
    ),
  ].sort()
  const airportCodes = [
    ...new Set(
      [
        route.origin.airportCode,
        route.destination.airportCode,
        ...route.segments.flatMap((segment) => [segment.origin.airportCode, segment.destination.airportCode]),
        ...route.connections.map((verbindung) => verbindung.airportCode),
      ]
        .map((code) => iataLesen(code))
        .filter((code): code is string => Boolean(code)),
    ),
  ].sort()
  const placeIds = [
    ...new Set(
      [...stages.map((etappe) => etappe.placeId), reise.originPlaceId].filter((id): id is string => Boolean(id)),
    ),
  ].sort()

  return {
    startDate: reise.startDate,
    endDate: reise.endDate,
    stages,
    items,
    days: reise.days.map((tag) => ({ id: tag.id, stageId: tag.stageId, dayDate: tag.dayDate })),
    route,
    countryCodes,
    airportCodes,
    placeIds,
  }
}

export function providerAnfrageAusKontext(
  kontext: SeasonalReisekontext,
  contextFingerprint: string,
): {
  contextFingerprint: string
  startDate: string | null
  endDate: string | null
  countryCodes: string[]
  airportCodes: string[]
  placeIds: string[]
} {
  return {
    contextFingerprint,
    startDate: kontext.startDate,
    endDate: kontext.endDate,
    countryCodes: kontext.countryCodes,
    airportCodes: kontext.airportCodes,
    placeIds: kontext.placeIds,
  }
}
