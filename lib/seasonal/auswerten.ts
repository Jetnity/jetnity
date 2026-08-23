// lib/seasonal/auswerten.ts
//
// API-Naht: Client darf Trip-Kontext senden, niemals Seasonal Evidence.

import { beispielreise } from '@/lib/reiseaenderung/fixtures/reise'
import type { SeasonalEvaluation } from '@/lib/seasonal/domain'
import { seasonalAuswerten } from '@/lib/seasonal/engine'
import { seasonalProviderAus, type SeasonalProvider } from '@/lib/seasonal/provider'
import type { SeasonalAnfrage } from '@/lib/seasonal/schema'
import type { Trip, TripItem } from '@/types/trips'

function leererPunkt(teil: SeasonalAnfrage['items'][number], position: number): TripItem {
  return {
    id: teil.id,
    dayId: teil.dayId,
    stageId: teil.stageId,
    kind: teil.kind,
    title: teil.title,
    note: null,
    position,
    startsOn: teil.startsOn,
    startsAt: null,
    endsOn: teil.endsOn,
    endsAt: null,
    priceAmount: null,
    priceCurrency: null,
    provider: null,
    externalRef: null,
    bookingUrl: null,
    bookingStatus: 'unconfirmed',
    bookingSource: null,
    bookingConfirmedAt: null,
    mobilityMode: null,
    originPlaceId: teil.originPlaceId,
    destinationPlaceId: teil.destinationPlaceId,
    originName: null,
    destinationName: null,
    connectionRef: null,
    mobilityChanges: null,
    mobilityEvidence: null,
    rentalSupplier: null,
    vehicleClass: null,
    transmission: null,
    rentalEvidence: null,
    routeItinerary: teil.routeItinerary ?? null,
  }
}

export function tripAusSeasonalAnfrage(anfrage: SeasonalAnfrage): Trip {
  const items = anfrage.items.map((punkt, index) => leererPunkt(punkt, index + 1))
  const stageIds = new Set(anfrage.stages.map((etappe) => etappe.id))
  return {
    ...beispielreise(),
    id: 'trip-anfrage',
    clientRef: 'trip-anfrage',
    title: 'Reise',
    originPlaceId: anfrage.originPlaceId ?? null,
    startDate: anfrage.startDate ?? null,
    endDate: anfrage.endDate ?? null,
    stages: anfrage.stages.map((etappe, index) => ({
      id: etappe.id,
      position: index + 1,
      name: etappe.name,
      countryCode: etappe.countryCode,
      placeId: etappe.placeId,
      latitude: etappe.latitude,
      longitude: etappe.longitude,
      arrivalDate: etappe.arrivalDate,
      departureDate: etappe.departureDate,
    })),
    days: anfrage.days.map((tag, index) => ({
      id: tag.id,
      stageId: tag.stageId && stageIds.has(tag.stageId) ? tag.stageId : null,
      dayIndex: index + 1,
      dayDate: tag.dayDate,
      title: null,
      items: items.filter((punkt) => punkt.dayId === tag.id),
    })),
    ohneTag: items.filter((punkt) => !punkt.dayId),
    readinessItems: [],
    party: [],
  }
}

export async function seasonalEvaluationsPruefen(
  anfrage: SeasonalAnfrage,
  provider: SeasonalProvider | null = seasonalProviderAus(),
): Promise<SeasonalEvaluation[]> {
  return seasonalAuswerten(tripAusSeasonalAnfrage(anfrage), provider, anfrage)
}
