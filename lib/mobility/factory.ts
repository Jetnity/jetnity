// lib/mobility/factory.ts
//
// Diese Foundation hat bewusst noch keinen Mobilitäts-Adapter.
// Die Naht bleibt, damit der erste Provider die Pipeline nicht umbauen muss.
// Kein Providername und kein Secret werden vorweggenommen.

import 'server-only'

import type { MobilityProvider } from '@/lib/mobility/provider'

export function mobilityProviderAus(): MobilityProvider | null {
  return null
}
