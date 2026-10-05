// lib/hotels/provider.ts
//
// Schmale Naht für Hotel-Suchanbieter. UI, Quartierlogik, Ranking und
// Trip-Integration sprechen nur Jetnitys interne Hoteltypen.
//
// Suche und Affiliate-/Booking-Link sind getrennte Verantwortlichkeiten.
// Dieses Interface bucht nicht und erzeugt keine Deeplinks.

import type { HotelOption, HotelSuchanfrage } from '@/lib/hotels/domain'

export type HotelProviderFehlerart = 'timeout' | 'unavailable' | 'invalid' | 'error'

export class HotelProviderFehler extends Error {
  readonly art: HotelProviderFehlerart

  constructor(art: HotelProviderFehlerart, message: string) {
    super(message)
    this.name = 'HotelProviderFehler'
    this.art = art
  }
}

export type HotelProviderTreffer = {
  options: HotelOption[]
  /** true, wenn gültige Optionen da sind, einzelne Angebote aber verworfen wurden. */
  partial: boolean
}

export type HotelProvider = {
  readonly id: string
  suchen(anfrage: HotelSuchanfrage): Promise<HotelProviderTreffer>
}
