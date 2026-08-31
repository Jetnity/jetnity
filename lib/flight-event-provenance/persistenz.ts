// lib/flight-event-provenance/persistenz.ts
//
// E5-B3C: serverseitiger, DB-freier Mint der E5-B3A-Persistenznutzlast.
// Frei von Next, Supabase, Provider-SDKs und Prozessumgebung.
//
// Bindet genau eine ausgewählte Option aus demselben FlugProviderTreffer an
// exakte E5-B1R-Timezone- und E5-B2A-Instant-Evidence. retrieved_at und
// observed_at kommen ausschliesslich aus E5-B3B treffer.retrievedAt.
// Keine implizite Jetzt-Zeit, keine zweite Observation, keine Freshness,
// keine TypeScript-occurrence_event_ref, keine Client-Provenance.

import type { FlugSegment } from '@/lib/flights/domain'
import type {
  FlugAirportTimezoneEndpunkt,
  FlugProviderTreffer,
} from '@/lib/flights/provider'

export const FLIGHT_EVENT_PERSISTENCE_VERTRAG = 'jetnity.flight_event_persistence.v1' as const
export const FLIGHT_EVENT_PERSISTENCE_MINT = 'e5b2a_validated_snapshot' as const

const FLIGHT_EVENT_PERSISTENCE_CLIENT_DENY_KEYS = [
  'sourceKind',
  'providerId',
  'externalRef',
  'retrievedAt',
  'observedAt',
  'freshUntil',
  'sourceLabel',
  'akteur',
  'actor',
  'eventRef',
  'event_ref',
  'occurrence_event_ref',
  'timeZone',
  'localDate',
  'localTime',
  'eventInstant',
  'instant',
  'trusted',
  'providerProven',
  'convertedAmount',
  'convertedCurrency',
] as const

const FLIGHT_EVENT_PERSISTENCE_ALLOW_KEYS = [
  'vertrag',
  'mint',
  'trip_item_id',
  'provider_id',
  'source_kind',
  'persistenz',
  'source_label',
  'external_ref',
  'retrieved_at',
  'observed_at',
  'fresh_until',
  'occurrences',
  'domain',
] as const

const FLIGHT_EVENT_PERSISTENCE_OCCURRENCE_DENY_KEYS = [
  'eventRef',
  'event_ref',
  'occurrence_event_ref',
  'akteur',
  'actor',
  'trusted',
  'providerProven',
  'timeZone',
  'localDate',
  'localTime',
  'eventInstant',
  'instant',
  'sourceKind',
] as const

const FLIGHT_EVENT_PERSISTENCE_OCCURRENCE_ALLOW_KEYS = [
  'leg_index',
  'segment_index',
  'endpoint',
  'iata',
  'local_date',
  'local_time',
  'time_zone',
  'event_instant',
] as const

const VERBOTENE_PROVIDER_IDS = new Set([
  'user',
  'manual',
  'jetnity',
  'assistant',
  'llm',
  'system',
  'unknown',
])

const UUID_MUSTER =
  /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i
const RETRIEVED_AT_MUSTER = /^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}\.\d{3}Z$/
const EVENT_INSTANT_MUSTER =
  /^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}(?:\.\d{1,6})?Z$/
const LOCAL_DATE_MUSTER = /^(\d{4})-(\d{2})-(\d{2})$/
const LOCAL_TIME_MUSTER = /^(\d{2}):(\d{2})(?::(\d{2}))?$/
const IATA_MUSTER = /^[A-Z]{3}$/
const TIME_ZONE_SYNTAX =
  /^[A-Za-z0-9_+\-/]+$/
const STEUERZEICHEN = /[\u0000-\u001F\u007F]/

export type FlightEventPersistenzEndpunkt = FlugAirportTimezoneEndpunkt

export type FlightEventPersistenzOccurrence = {
  leg_index: number
  segment_index: number
  endpoint: FlightEventPersistenzEndpunkt
  iata: string
  local_date: string
  local_time: string
  time_zone: string
  event_instant: string
}

export type FlightEventPersistenzNutzlast = {
  vertrag: typeof FLIGHT_EVENT_PERSISTENCE_VERTRAG
  mint: typeof FLIGHT_EVENT_PERSISTENCE_MINT
  trip_item_id: string
  domain: 'flights'
  provider_id: string
  source_kind: 'persisted_snapshot'
  persistenz: 'snapshot'
  source_label: null
  external_ref: string
  retrieved_at: string
  observed_at: string
  fresh_until: null
  occurrences: FlightEventPersistenzOccurrence[]
}

export const FLIGHT_EVENT_PERSISTENCE_FEHLER = [
  'invalid_trip_item_id',
  'selected_option_missing',
  'selected_option_ambiguous',
  'invalid_provider_identity',
  'invalid_external_ref',
  'invalid_retrieved_at',
  'occurrence_identity_mismatch',
  'duplicate_timezone_evidence',
  'duplicate_event_instant_evidence',
  'timezone_instant_evidence_mismatch',
  'invalid_local_endpoint_wall_clock',
  'unresolved_occurrence_evidence',
] as const

export type FlightEventPersistenzFehlerCode =
  (typeof FLIGHT_EVENT_PERSISTENCE_FEHLER)[number]

export type FlightEventPersistenzFehler = {
  code: FlightEventPersistenzFehlerCode
  path: string
  optionId?: string
  legIndex?: number
  segmentIndex?: number
  endpoint?: FlightEventPersistenzEndpunkt
  iata?: string
}

export type FlightEventPersistenzMintEingabe = {
  tripItemId: string
  optionId: string
  treffer: FlugProviderTreffer
}

export type FlightEventPersistenzMintOk = {
  ok: true
  nutzlast: FlightEventPersistenzNutzlast
  unresolved: FlightEventPersistenzFehler[]
}

export type FlightEventPersistenzMintFehler = {
  ok: false
  fehler: FlightEventPersistenzFehler[]
}

export type FlightEventPersistenzMint =
  | FlightEventPersistenzMintOk
  | FlightEventPersistenzMintFehler

type OccurrenceIdentitaet = {
  optionId: string
  legIndex: number
  segmentIndex: number
  endpoint: FlightEventPersistenzEndpunkt
  iata: string
}

type EvidenceKlassifikation<T> =
  | { art: 'exact'; werte: T[] }
  | { art: 'mismatch'; werte: T[] }
  | { art: 'absent' }

function objektLesen(wert: unknown): Record<string, unknown> | null {
  return wert && typeof wert === 'object' && !Array.isArray(wert)
    ? (wert as Record<string, unknown>)
    : null
}

function hatKey(objekt: Record<string, unknown>, key: string): boolean {
  return Object.prototype.hasOwnProperty.call(objekt, key)
}

function tripItemIdLesen(wert: unknown): string | null {
  if (typeof wert !== 'string') return null
  if (wert !== wert.trim()) return null
  if (!UUID_MUSTER.test(wert)) return null
  return wert
}

function retrievedAtLesen(wert: unknown): string | null {
  if (typeof wert !== 'string') return null
  if (!RETRIEVED_AT_MUSTER.test(wert)) return null
  const ms = Date.parse(wert)
  if (!Number.isFinite(ms)) return null
  const probe = new Date(ms)
  if (probe.toISOString() !== wert) return null
  return wert
}

function eventInstantLesen(wert: unknown): string | null {
  if (typeof wert !== 'string') return null
  if (!EVENT_INSTANT_MUSTER.test(wert)) return null
  const ms = Date.parse(wert)
  if (!Number.isFinite(ms)) return null
  return wert
}

function lokaleWanduhrLesen(
  date: string,
  time: string,
): { date: string; time: string } | null {
  const datum = LOCAL_DATE_MUSTER.exec(date)
  const uhr = LOCAL_TIME_MUSTER.exec(time)
  if (!datum || !uhr) return null
  const year = Number(datum[1])
  const month = Number(datum[2])
  const day = Number(datum[3])
  const hour = Number(uhr[1])
  const minute = Number(uhr[2])
  const second = uhr[3] === undefined ? 0 : Number(uhr[3])
  if (
    !Number.isInteger(year) ||
    !Number.isInteger(month) ||
    !Number.isInteger(day) ||
    !Number.isInteger(hour) ||
    !Number.isInteger(minute) ||
    !Number.isInteger(second)
  ) {
    return null
  }
  if (hour < 0 || hour > 23 || minute < 0 || minute > 59 || second < 0 || second > 59) {
    return null
  }
  const utc = Date.UTC(year, month - 1, day)
  if (!Number.isFinite(utc)) return null
  const probe = new Date(utc)
  if (
    probe.getUTCFullYear() !== year ||
    probe.getUTCMonth() !== month - 1 ||
    probe.getUTCDate() !== day
  ) {
    return null
  }
  return { date, time }
}

function iataLesen(wert: unknown): string | null {
  return typeof wert === 'string' && IATA_MUSTER.test(wert) ? wert : null
}

function timeZoneSyntaxLesen(wert: unknown): string | null {
  if (typeof wert !== 'string') return null
  if (wert.length < 1 || wert.length > 64) return null
  if (wert !== wert.trim()) return null
  if (STEUERZEICHEN.test(wert)) return null
  if (wert.includes('..') || wert.includes('\\') || wert.includes('://')) return null
  if (wert.startsWith('/') || wert.endsWith('/')) return null
  if (/^[Zz]$/.test(wert) || /^[+-][0-9]/.test(wert)) return null
  if (!TIME_ZONE_SYNTAX.test(wert)) return null
  return wert
}

function providerIdLesen(wert: unknown): string | null {
  if (typeof wert !== 'string') return null
  if (wert !== wert.trim()) return null
  if (wert.length < 1 || wert.length > 40) return null
  if (VERBOTENE_PROVIDER_IDS.has(wert.toLowerCase())) return null
  return wert
}

function externalRefLesen(wert: unknown): string | null {
  if (typeof wert !== 'string') return null
  if (wert !== wert.trim()) return null
  if (wert.length < 1 || wert.length > 200) return null
  return wert
}

function wanduhrFuerEndpunkt(
  segment: FlugSegment,
  endpoint: FlightEventPersistenzEndpunkt,
): { iata: string; date: string; time: string } | null {
  if (endpoint === 'departure') {
    return {
      iata: segment.origin,
      date: segment.departureDate,
      time: segment.departureTime,
    }
  }
  if (endpoint === 'arrival') {
    return {
      iata: segment.destination,
      date: segment.arrivalDate,
      time: segment.arrivalTime,
    }
  }
  return null
}

function gleicheIdentitaet(
  evidence: { optionId: string; legIndex: number; segmentIndex: number; endpoint: string; iata: string },
  identitaet: OccurrenceIdentitaet,
): boolean {
  return (
    evidence.optionId === identitaet.optionId &&
    evidence.legIndex === identitaet.legIndex &&
    evidence.segmentIndex === identitaet.segmentIndex &&
    evidence.endpoint === identitaet.endpoint &&
    evidence.iata === identitaet.iata
  )
}

function gleicheIdentitaetOhneIata(
  evidence: { optionId: string; legIndex: number; segmentIndex: number; endpoint: string; iata: string },
  identitaet: OccurrenceIdentitaet,
): boolean {
  return (
    evidence.optionId === identitaet.optionId &&
    evidence.legIndex === identitaet.legIndex &&
    evidence.segmentIndex === identitaet.segmentIndex &&
    evidence.endpoint === identitaet.endpoint &&
    evidence.iata !== identitaet.iata
  )
}

function evidenceKlassifizieren<T extends {
  optionId: string
  legIndex: number
  segmentIndex: number
  endpoint: string
  iata: string
}>(liste: readonly T[], identitaet: OccurrenceIdentitaet): EvidenceKlassifikation<T> {
  const exact = liste.filter((eintrag) => gleicheIdentitaet(eintrag, identitaet))
  if (exact.length > 0) return { art: 'exact', werte: exact }
  const mismatch = liste.filter((eintrag) => gleicheIdentitaetOhneIata(eintrag, identitaet))
  if (mismatch.length > 0) return { art: 'mismatch', werte: mismatch }
  return { art: 'absent' }
}

function occurrencePfad(identitaet: OccurrenceIdentitaet): string {
  return `occurrences[${identitaet.legIndex}/${identitaet.segmentIndex}/${identitaet.endpoint}/${identitaet.iata}]`
}

function fehlerFuer(
  code: FlightEventPersistenzFehlerCode,
  path: string,
  identitaet?: OccurrenceIdentitaet,
): FlightEventPersistenzFehler {
  return identitaet
    ? {
        code,
        path,
        optionId: identitaet.optionId,
        legIndex: identitaet.legIndex,
        segmentIndex: identitaet.segmentIndex,
        endpoint: identitaet.endpoint,
        iata: identitaet.iata,
      }
    : { code, path }
}

/**
 * Rohe Client-/Browser-Felder dürfen nicht als E5-B3A-Persistenzvertrag
 * durchgehen. Allow-List und Deny-List folgen dem SQL-Writer 1:1.
 */
export function flightEventPersistenzNutzlastIstRohclient(wert: unknown): boolean {
  const roh = objektLesen(wert)
  if (!roh) return true
  if (roh.vertrag !== FLIGHT_EVENT_PERSISTENCE_VERTRAG) return true
  if (roh.mint !== FLIGHT_EVENT_PERSISTENCE_MINT) return true
  if (FLIGHT_EVENT_PERSISTENCE_CLIENT_DENY_KEYS.some((key) => hatKey(roh, key))) {
    return true
  }
  if (Object.keys(roh).some((key) => !FLIGHT_EVENT_PERSISTENCE_ALLOW_KEYS.includes(key as (typeof FLIGHT_EVENT_PERSISTENCE_ALLOW_KEYS)[number]))) {
    return true
  }
  const occurrences = roh.occurrences
  if (occurrences === undefined) return false
  if (!Array.isArray(occurrences)) return true
  for (const eintrag of occurrences) {
    const occ = objektLesen(eintrag)
    if (!occ) return true
    if (FLIGHT_EVENT_PERSISTENCE_OCCURRENCE_DENY_KEYS.some((key) => hatKey(occ, key))) {
      return true
    }
    if (
      Object.keys(occ).some(
        (key) =>
          !FLIGHT_EVENT_PERSISTENCE_OCCURRENCE_ALLOW_KEYS.includes(
            key as (typeof FLIGHT_EVENT_PERSISTENCE_OCCURRENCE_ALLOW_KEYS)[number],
          ),
      )
    ) {
      return true
    }
  }
  return false
}

/**
 * Baut die serverseitig validierte zukünftige Writer-Nutzlast.
 * Schreibt nicht. Ruft keine Funktion auf. Erfindet keine Zeit.
 */
export function flightEventPersistenzNutzlastMinten(
  eingabe: FlightEventPersistenzMintEingabe,
): FlightEventPersistenzMint {
  const tripItemId = tripItemIdLesen(eingabe.tripItemId)
  if (!tripItemId) {
    return {
      ok: false,
      fehler: [fehlerFuer('invalid_trip_item_id', 'tripItemId')],
    }
  }

  const treffer = eingabe.treffer
  const retrievedAt = retrievedAtLesen(treffer?.retrievedAt)
  if (!retrievedAt) {
    return {
      ok: false,
      fehler: [fehlerFuer('invalid_retrieved_at', 'treffer.retrievedAt')],
    }
  }

  const options = Array.isArray(treffer.options) ? treffer.options : []
  const optionId = typeof eingabe.optionId === 'string' ? eingabe.optionId : ''
  const trefferOptionen = options.filter((option) => option?.id === optionId)
  if (!optionId || trefferOptionen.length === 0) {
    return {
      ok: false,
      fehler: [fehlerFuer('selected_option_missing', 'optionId')],
    }
  }
  if (trefferOptionen.length > 1) {
    return {
      ok: false,
      fehler: [fehlerFuer('selected_option_ambiguous', 'optionId')],
    }
  }

  const option = trefferOptionen[0]!
  const providerId = providerIdLesen(option.provider)
  if (!providerId) {
    return {
      ok: false,
      fehler: [fehlerFuer('invalid_provider_identity', 'option.provider')],
    }
  }
  const externalRef = externalRefLesen(option.externalRef)
  if (!externalRef) {
    return {
      ok: false,
      fehler: [fehlerFuer('invalid_external_ref', 'option.externalRef')],
    }
  }

  const timezoneEvidence = Array.isArray(treffer.airportTimezoneEvidence)
    ? treffer.airportTimezoneEvidence
    : []
  const instantEvidence = Array.isArray(treffer.airportEventInstantEvidence)
    ? treffer.airportEventInstantEvidence
    : []

  const occurrences: FlightEventPersistenzOccurrence[] = []
  const unresolved: FlightEventPersistenzFehler[] = []
  const mintFehler: FlightEventPersistenzFehler[] = []

  const legs = Array.isArray(option.legs) ? option.legs : []
  for (let legIndex = 0; legIndex < legs.length; legIndex += 1) {
    const segments = Array.isArray(legs[legIndex]?.segments) ? legs[legIndex]!.segments : []
    for (let segmentIndex = 0; segmentIndex < segments.length; segmentIndex += 1) {
      const segment = segments[segmentIndex]
      if (!segment) continue
      for (const endpoint of ['departure', 'arrival'] as const) {
        const gebunden = wanduhrFuerEndpunkt(segment, endpoint)
        if (!gebunden) continue
        const iata = iataLesen(gebunden.iata)
        const identitaet: OccurrenceIdentitaet = {
          optionId: option.id,
          legIndex,
          segmentIndex,
          endpoint,
          iata: iata ?? String(gebunden.iata ?? ''),
        }
        const path = occurrencePfad(identitaet)

        if (!iata) {
          mintFehler.push(fehlerFuer('occurrence_identity_mismatch', path, identitaet))
          continue
        }

        const wanduhr = lokaleWanduhrLesen(gebunden.date, gebunden.time)
        if (!wanduhr) {
          mintFehler.push(fehlerFuer('invalid_local_endpoint_wall_clock', path, identitaet))
          continue
        }

        const zone = evidenceKlassifizieren(timezoneEvidence, identitaet)
        const instant = evidenceKlassifizieren(instantEvidence, identitaet)

        if (zone.art === 'mismatch') {
          mintFehler.push(fehlerFuer('occurrence_identity_mismatch', path, identitaet))
          continue
        }
        if (instant.art === 'mismatch') {
          mintFehler.push(fehlerFuer('occurrence_identity_mismatch', path, identitaet))
          continue
        }
        if (zone.art === 'exact' && zone.werte.length > 1) {
          mintFehler.push(fehlerFuer('duplicate_timezone_evidence', path, identitaet))
          continue
        }
        if (instant.art === 'exact' && instant.werte.length > 1) {
          mintFehler.push(fehlerFuer('duplicate_event_instant_evidence', path, identitaet))
          continue
        }
        if (zone.art === 'absent' || instant.art === 'absent') {
          unresolved.push(fehlerFuer('unresolved_occurrence_evidence', path, identitaet))
          continue
        }

        const timezoneEvidenceWert = zone.werte[0]!
        const instantEvidenceWert = instant.werte[0]!
        const timeZone = timeZoneSyntaxLesen(timezoneEvidenceWert.timeZone)
        const instantZone = timeZoneSyntaxLesen(instantEvidenceWert.timeZone)
        const eventInstant = eventInstantLesen(instantEvidenceWert.instant)
        if (!timeZone || !instantZone || timeZone !== instantZone) {
          mintFehler.push(fehlerFuer('timezone_instant_evidence_mismatch', path, identitaet))
          continue
        }
        if (!eventInstant) {
          mintFehler.push(fehlerFuer('timezone_instant_evidence_mismatch', path, identitaet))
          continue
        }

        occurrences.push({
          leg_index: legIndex,
          segment_index: segmentIndex,
          endpoint,
          iata,
          local_date: wanduhr.date,
          local_time: wanduhr.time,
          time_zone: timeZone,
          event_instant: eventInstant,
        })
      }
    }
  }

  if (mintFehler.length > 0) {
    return { ok: false, fehler: mintFehler }
  }

  const nutzlast: FlightEventPersistenzNutzlast = {
    vertrag: FLIGHT_EVENT_PERSISTENCE_VERTRAG,
    mint: FLIGHT_EVENT_PERSISTENCE_MINT,
    trip_item_id: tripItemId,
    domain: 'flights',
    provider_id: providerId,
    source_kind: 'persisted_snapshot',
    persistenz: 'snapshot',
    source_label: null,
    external_ref: externalRef,
    retrieved_at: retrievedAt,
    observed_at: retrievedAt,
    fresh_until: null,
    occurrences,
  }

  return { ok: true, nutzlast, unresolved }
}
