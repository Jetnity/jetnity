// lib/rental-cars/provider.ts
//
// Schmale Naht für Mietwagen-Suchanbieter. UI, Ranking und Trip-Integration
// sprechen nur Jetnitys interne Mietwagentypen.
//
// Suche und Affiliate-/Booking-Link sind getrennte Verantwortlichkeiten.
// Dieses Interface bucht nicht und erzeugt keine Deeplinks.
//
// Frei von Next, Supabase und Provider-SDKs.

import type { RentalCarOption, RentalCarSuchanfrage } from '@/lib/rental-cars/domain'

export type RentalCarProviderFehlerart = 'timeout' | 'unavailable' | 'invalid' | 'error'

export class RentalCarProviderFehler extends Error {
  readonly art: RentalCarProviderFehlerart

  constructor(art: RentalCarProviderFehlerart, message: string) {
    super(message)
    this.name = 'RentalCarProviderFehler'
    this.art = art
  }
}

export type RentalCarProviderTreffer = {
  options: RentalCarOption[]
  /** true, wenn gültige Optionen da sind, einzelne Angebote aber verworfen wurden. */
  partial: boolean
}

export type RentalCarProvider = {
  readonly id: string
  suchen(anfrage: RentalCarSuchanfrage): Promise<RentalCarProviderTreffer>
}
