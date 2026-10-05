// lib/activities/provider.ts
//
// Schmale Naht für Aktivitäts-Suchanbieter. UI, Ranking und Trip-Integration
// sprechen nur Jetnitys interne Aktivitätstypen.
//
// Suche und Affiliate-/Booking-Link sind getrennte Verantwortlichkeiten.
// Dieses Interface bucht nicht und erzeugt keine Deeplinks.
//
// Frei von Next, Supabase und Provider-SDKs.

import type { ActivityOption, ActivitySuchanfrage } from '@/lib/activities/domain'

export type ActivityProviderFehlerart = 'timeout' | 'unavailable' | 'invalid' | 'error'

export class ActivityProviderFehler extends Error {
  readonly art: ActivityProviderFehlerart

  constructor(art: ActivityProviderFehlerart, message: string) {
    super(message)
    this.name = 'ActivityProviderFehler'
    this.art = art
  }
}

export type ActivityProviderTreffer = {
  options: ActivityOption[]
  /** true, wenn gültige Optionen da sind, einzelne Angebote aber verworfen wurden. */
  partial: boolean
}

export type ActivityProvider = {
  readonly id: string
  suchen(anfrage: ActivitySuchanfrage): Promise<ActivityProviderTreffer>
}
