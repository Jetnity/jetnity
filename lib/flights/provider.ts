// lib/flights/provider.ts
//
// Das schmale Interface eines Flugdaten-Adapters.
//
// Ein zweiter Provider – etwa ein Metasuch-Anbieter – implementiert dieselbe
// Suche und liefert dieselbe FlugOption. UI, Scoring und Trip-Übernahme bleiben
// unverändert. Das ist keine Plattform für zehn Anbieter, sondern die Naht,
// ohne die der erste Adapter zur Produktarchitektur würde.
//
// Search und Booking/Affiliate sind getrennte Verantwortlichkeiten. Dieses
// Interface bucht nicht und erzeugt keine Deeplinks.
//
// Frei von Next und Provider-SDKs.

import type { FlugOption, FlugSuchanfrage } from '@/lib/flights/domain'

export type FlugProviderFehlerart = 'timeout' | 'unavailable' | 'invalid' | 'error'

export class FlugProviderFehler extends Error {
  readonly art: FlugProviderFehlerart

  constructor(art: FlugProviderFehlerart, message: string) {
    super(message)
    this.name = 'FlugProviderFehler'
    this.art = art
  }
}

export type FlugAirportTimezoneEndpunkt = 'departure' | 'arrival'

/**
 * Flüchtige, provider-beobachtete Airport-Timezone an genau einem
 * normalisierten Segment-Endpunkt. Kein Bestandteil von FlugOption.
 *
 * Die Herkunft gilt nur, weil der aktive Adapter sie serverseitig mintet.
 * Ein Payload-Label wie `trusted` oder `providerProven` darf das nicht ersetzen.
 */
export type FlugAirportTimezoneEvidence = {
  optionId: string
  legIndex: number
  segmentIndex: number
  endpoint: FlugAirportTimezoneEndpunkt
  iata: string
  timeZone: string
}

/**
 * Flüchtiger, eindeutig aufgelöster Airport-Event-Instant an genau einem
 * normalisierten Segment-Endpunkt. Kein Bestandteil von FlugOption.
 *
 * `instant` ist kanonisches UTC-ISO mit `Z`. Nur nach exakter Identity-
 * Revalidierung und eindeutiger lokaler Wanduhr + Zone.
 */
export type FlugAirportEventInstantEvidence = {
  optionId: string
  legIndex: number
  segmentIndex: number
  endpoint: FlugAirportTimezoneEndpunkt
  iata: string
  timeZone: string
  instant: string
}

export const FLUG_AIRPORT_EVENT_INSTANT_ISSUES = [
  'invalid_local_date_time',
  'nonexistent_local_time',
  'ambiguous_local_time',
  'evidence_mismatch',
  'invalid_time_zone',
] as const

export type FlugAirportEventInstantIssueArt = (typeof FLUG_AIRPORT_EVENT_INSTANT_ISSUES)[number]

export type FlugAirportEventInstantIssue = {
  optionId: string
  legIndex: number
  segmentIndex: number
  endpoint: FlugAirportTimezoneEndpunkt
  iata: string
  timeZone: string
  issue: FlugAirportEventInstantIssueArt
}

export type FlugProviderTreffer = {
  options: FlugOption[]
  /** true, wenn gültige Optionen da sind, einzelne Angebote aber verworfen wurden. */
  partial: boolean
  /**
   * Jetnity-Serverzeit, zu der die erfolgreiche Provider-Antwort als Snapshot
   * beobachtet/gelesen wurde. Kanonisches UTC-ISO-8601 mit `Z`.
   * Keine Provider-Behauptung, keine Freshness- oder Gültigkeitsgarantie.
   * Kein Feld von FlugOption oder FlugSegment.
   */
  retrievedAt: string
  /** Immer gesetzt. Leer, wenn der Provider keine akzeptable Zone geliefert hat. */
  airportTimezoneEvidence: FlugAirportTimezoneEvidence[]
  /** Immer gesetzt. Leer, wenn kein Endpunkt eindeutig auf einen Instant fällt. */
  airportEventInstantEvidence: FlugAirportEventInstantEvidence[]
  /** Immer gesetzt. Diagnostiziert unauflösbare Evidence, verwirft keine Option. */
  airportEventInstantIssues: FlugAirportEventInstantIssue[]
}

export function leereFlugAirportTimezoneEvidence(): FlugAirportTimezoneEvidence[] {
  return []
}

export function leereFlugAirportEventInstantEvidence(): FlugAirportEventInstantEvidence[] {
  return []
}

export function leereFlugAirportEventInstantIssues(): FlugAirportEventInstantIssue[] {
  return []
}

export type FlugProvider = {
  readonly id: string
  suchen(anfrage: FlugSuchanfrage): Promise<FlugProviderTreffer>
}
