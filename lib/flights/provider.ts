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

export type FlugProviderTreffer = {
  options: FlugOption[]
  /** true, wenn gültige Optionen da sind, einzelne Angebote aber verworfen wurden. */
  partial: boolean
}

export type FlugProvider = {
  readonly id: string
  suchen(anfrage: FlugSuchanfrage): Promise<FlugProviderTreffer>
}
