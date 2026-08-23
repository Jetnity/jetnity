// lib/safety/auswerten.ts
//
// API-Naht: Client darf Trip-Kontext senden, niemals Official Evidence.

import { beispielreise } from '@/lib/reiseaenderung/fixtures/reise'
import type { SafetyEvaluation } from '@/lib/safety/domain'
import { safetyAuswerten } from '@/lib/safety/engine'
import { safetyProviderAus, type SafetyProvider } from '@/lib/safety/provider'
import type { SafetyAnfrage } from '@/lib/safety/schema'
import type { Trip, TripItem } from '@/types/trips'

function leererPunkt(teil: SafetyAnfrage['items'][number], position: number): TripItem {
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

export function tripAusSafetyAnfrage(anfrage: SafetyAnfrage): Trip {
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

export async function safetyEvaluationsPruefen(
  anfrage: SafetyAnfrage,
  provider: SafetyProvider | null = safetyProviderAus(),
): Promise<SafetyEvaluation[]> {
  return safetyAuswerten(tripAusSafetyAnfrage(anfrage), provider, anfrage)
}
