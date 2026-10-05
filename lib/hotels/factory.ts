// lib/hotels/factory.ts
//
// Phase 3.2 hat bewusst noch keinen Hoteladapter.
// Die Naht bleibt, damit der erste Provider die Pipeline nicht umbauen muss.

import 'server-only'

import type { HotelProvider } from '@/lib/hotels/provider'

export function hotelProviderAus(): HotelProvider | null {
  return null
}
