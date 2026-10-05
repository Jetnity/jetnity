// lib/rental-cars/factory.ts
//
// Diese Foundation hat bewusst noch keinen Mietwagen-Adapter.
// Die Naht bleibt, damit der erste Provider die Pipeline nicht umbauen muss.
// Kein Providername und kein Secret werden vorweggenommen.

import 'server-only'

import type { RentalCarProvider } from '@/lib/rental-cars/provider'

export function rentalCarProviderAus(): RentalCarProvider | null {
  return null
}
