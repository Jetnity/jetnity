// lib/seasonal/auswerten.ts
//
// API-Naht: Client darf Trip-Kontext senden, niemals Seasonal Evidence.

import {
  providerOpsConsoleEventSink,
  providerOpsEventSchreiben,
  type ProviderOpsEventSink,
  type ProviderOpsOutcome,
} from '@/lib/provider-ops'
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
      stageId: tag.stageId,
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

function seasonalOutcomeAus(evaluations: readonly SeasonalEvaluation[]): ProviderOpsOutcome {
  if (evaluations.length === 0) return 'checked_empty'
  if (
    evaluations.length === 1 &&
    evaluations[0]?.factKey === 'checked_empty' &&
    evaluations[0].freshness === 'current'
  ) {
    return 'checked_empty'
  }
  const freshness = evaluations.map((eintrag) => eintrag.freshness)
  if (freshness.every((wert) => wert === 'provider_unavailable')) return 'unavailable'
  if (freshness.every((wert) => wert === 'source_temporarily_unavailable')) return 'error'
  if (
    freshness.some(
      (wert) =>
        wert === 'provider_unavailable' ||
        wert === 'source_temporarily_unavailable' ||
        wert === 'stale' ||
        wert === 'recheck_needed' ||
        wert === 'never_checked',
    )
  ) {
    return 'partial'
  }
  return 'ok'
}

export async function seasonalEvaluationsPruefen(
  anfrage: SeasonalAnfrage,
  provider: SeasonalProvider | null = seasonalProviderAus(),
  eventSink: ProviderOpsEventSink = providerOpsConsoleEventSink,
): Promise<SeasonalEvaluation[]> {
  const gestartet = Date.now()
  let beobachtet = false
  const beobachten = (outcome: ProviderOpsOutcome, resultCount: number | null = 0) => {
    if (beobachtet) return
    beobachtet = true
    void providerOpsEventSchreiben(eventSink, {
      domain: 'seasonal',
      providerId: provider?.name.trim() || null,
      operation: 'evaluate',
      outcome,
      durationMs: Math.max(0, Date.now() - gestartet),
      resultCount,
      droppedCount: null,
      rateLimitHit: false,
    })
  }

  if (!provider) {
    beobachten('unavailable')
  }

  const beobachteterProvider: SeasonalProvider | null = provider
    ? {
        name: provider.name,
        async evaluate(providerAnfrage, signal) {
          const onAbort = () => beobachten('timeout')
          signal?.addEventListener('abort', onAbort, { once: true })
          try {
            return await provider.evaluate(providerAnfrage, signal)
          } catch (fehler) {
            beobachten(signal?.aborted ? 'timeout' : 'error')
            throw fehler
          } finally {
            signal?.removeEventListener('abort', onAbort)
          }
        },
      }
    : null

  const evaluations = await seasonalAuswerten(
    tripAusSeasonalAnfrage(anfrage),
    beobachteterProvider,
    anfrage,
  )
  const outcome = seasonalOutcomeAus(evaluations)
  beobachten(outcome, outcome === 'checked_empty' ? 0 : evaluations.length)
  return evaluations
}
