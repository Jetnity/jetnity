// lib/safety/auswerten.ts
//
// API-Naht: Konto-Reisen kommen nur aus RLS-geschütztem Server-Load.
// Gast darf transienten Routenkontext senden, niemals Official Evidence
// und niemals Reisenden-/Staatsbürgerschafts-Wahrheit.

import type { Lesung } from '@/lib/api/datenbank-lesen'
import {
  providerOpsConsoleEventSink,
  providerOpsEventSchreiben,
  type ProviderOpsEventSink,
  type ProviderOpsOutcome,
} from '@/lib/provider-ops'
import { beispielreise } from '@/lib/reiseaenderung/fixtures/reise'
import type { SafetyEvaluation } from '@/lib/safety/domain'
import { safetyAuswerten } from '@/lib/safety/engine'
import { safetyProviderAus, type SafetyProvider } from '@/lib/safety/provider'
import type { SafetyAnfrage } from '@/lib/safety/schema'
import type { Trip, TripItem } from '@/types/trips'

/**
 * Dieselbe Konto-UUID-Form wie `istKontoKennung` in `lib/trips/daten.ts`.
 * Hier dupliziert, damit die Safety-Naht kein `server-only`-Trip-Modul lädt.
 */
const KONTO_TRIP_ID =
  /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i

export function safetyIstKontoTripId(id: string): boolean {
  return KONTO_TRIP_ID.test(id)
}

export type SafetyReiseLesen = (id: string) => Promise<Lesung<Trip>>

export type SafetyAuswertungFehler = {
  ok: false
  art: 'nicht-gefunden' | 'lesen-fehlgeschlagen'
  status: 404 | 500 | 503
  message: string
}

export type SafetyAuswertungOk = {
  ok: true
  reise: Trip
  evaluations: SafetyEvaluation[]
  quelle: 'konto' | 'gast'
}

export type SafetyAuswertung = SafetyAuswertungOk | SafetyAuswertungFehler

export type SafetyReiseKontext =
  | { ok: true; reise: Trip; quelle: 'konto' | 'gast' }
  | SafetyAuswertungFehler

const LESEN_FEHLGESCHLAGEN: SafetyAuswertungFehler = {
  ok: false,
  art: 'lesen-fehlgeschlagen',
  status: 500,
  message: 'Die Sicherheitslage konnte gerade nicht geprüft werden. Das ist keine Entwarnung.',
}

const REISE_NICHT_GEFUNDEN: SafetyAuswertungFehler = {
  ok: false,
  art: 'nicht-gefunden',
  status: 404,
  message: 'Diese Reise wurde nicht gefunden.',
}

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

/**
 * Transienter Gast-Routenkontext. `party` bleibt leer: Gäste haben keine
 * server-eigene Reisendenwahrheit. Client-Citizenships gehören nicht hierher.
 */
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

export async function safetyReiseAufloesen(
  anfrage: SafetyAnfrage,
  reiseLesen?: SafetyReiseLesen,
): Promise<SafetyReiseKontext> {
  const tripId = anfrage.tripId
  if (!tripId || !safetyIstKontoTripId(tripId)) {
    return { ok: true, reise: tripAusSafetyAnfrage(anfrage), quelle: 'gast' }
  }

  if (!reiseLesen) {
    return { ...LESEN_FEHLGESCHLAGEN }
  }

  const gelesen = await reiseLesen(tripId)
  if (gelesen.problem) {
    return {
      ...LESEN_FEHLGESCHLAGEN,
      status: gelesen.problem.status,
    }
  }

  const reise = gelesen.zeilen[0]
  if (!reise) {
    return { ...REISE_NICHT_GEFUNDEN }
  }

  return { ok: true, reise, quelle: 'konto' }
}

function safetyOutcomeAus(evaluations: readonly SafetyEvaluation[]): ProviderOpsOutcome {
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

export async function safetyEvaluationsPruefen(
  anfrage: SafetyAnfrage,
  optionen: {
    provider?: SafetyProvider | null
    reiseLesen?: SafetyReiseLesen
    eventSink?: ProviderOpsEventSink
  } = {},
): Promise<SafetyAuswertung> {
  const kontext = await safetyReiseAufloesen(anfrage, optionen.reiseLesen)
  if (!kontext.ok) return kontext

  const provider = optionen.provider === undefined ? safetyProviderAus() : optionen.provider
  const sink = optionen.eventSink ?? providerOpsConsoleEventSink
  const gestartet = Date.now()
  let beobachtet = false
  const beobachten = (outcome: ProviderOpsOutcome, resultCount: number | null = 0) => {
    if (beobachtet) return
    beobachtet = true
    void providerOpsEventSchreiben(sink, {
      domain: 'safety',
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

  const beobachteterProvider: SafetyProvider | null = provider
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

  const evaluations = await safetyAuswerten(kontext.reise, beobachteterProvider, anfrage)
  const outcome = safetyOutcomeAus(evaluations)
  beobachten(outcome, outcome === 'checked_empty' ? 0 : evaluations.length)
  return {
    ok: true,
    reise: kontext.reise,
    evaluations,
    quelle: kontext.quelle,
  }
}
