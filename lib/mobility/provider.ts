// lib/mobility/provider.ts
//
// Schmale Naht für Mobilitäts-Suchanbieter. UI, Ranking und Trip-Integration
// sprechen nur Jetnitys interne Mobilitätstypen.
//
// Suche und Affiliate-/Booking-Link sind getrennte Verantwortlichkeiten.
// Dieses Interface bucht nicht und erzeugt keine Deeplinks.
//
// Frei von Next, Supabase und Provider-SDKs.

import type { MobilityOption, MobilitySuchanfrage } from '@/lib/mobility/domain'

export type MobilityProviderFehlerart = 'timeout' | 'unavailable' | 'invalid' | 'error'

export class MobilityProviderFehler extends Error {
  readonly art: MobilityProviderFehlerart

  constructor(art: MobilityProviderFehlerart, message: string) {
    super(message)
    this.name = 'MobilityProviderFehler'
    this.art = art
  }
}

export type MobilityProviderTreffer = {
  options: MobilityOption[]
  /** true, wenn gültige Optionen da sind, einzelne Angebote aber verworfen wurden. */
  partial: boolean
}

export type MobilityProvider = {
  readonly id: string
  suchen(anfrage: MobilitySuchanfrage): Promise<MobilityProviderTreffer>
}
