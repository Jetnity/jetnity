// lib/providers/hotelbeds/hotels/contracts.ts
//
// Adapter-local fixture contracts for the HBX hotels offline foundation.
// These types are not a live HotelProvider, not commercial-relationship
// evidence, and not a trusted quote constructor.

import type { HotelOption } from '@/lib/hotels/domain'

export const HBX_HOTELS_PROVIDER_ID = 'hotelbeds' as const

export const HBX_HOTELS_FIXTURE_SCHEMA = 'jetnity.hbx.hotels.availability.normalized.v1' as const

export const HBX_HOTELS_PRICING_MODELS = ['net', 'commissionable', 'unknown'] as const

export type HbxHotelsPricingModel = (typeof HBX_HOTELS_PRICING_MODELS)[number]

/**
 * Stay and pricing context declared only for fixture tests.
 * Not UI input, not a live commercial model, and not a mode switch into live.
 */
export type HbxHotelsFixtureContext = {
  checkIn: string
  checkOut: string
  requestedCurrency: string
  pricingModel: HbxHotelsPricingModel
}

/**
 * Normalized availability fixture shape. Runtime input remains `unknown`
 * and is never spread into output.
 */
export type HbxHotelsNormalizedAvailabilityFixture = {
  schema: typeof HBX_HOTELS_FIXTURE_SCHEMA
  offers: HbxHotelsNormalizedOffer[]
}

export type HbxHotelsNormalizedOffer = {
  hotelCode: string | number
  hotelName: string
  latitude: number
  longitude: number
  currency: string
  net: number | null
  sellingRate: number | null
  hotelMandatory: boolean | null
  taxesAllIncluded: boolean | null
  rateKey: string
  rateType: string
  roomCode: string
  roomName: string | null
  boardCode: string
  packaging: boolean
  paymentType: string
  cancellationFrom: string | null
  cancellationAmount: number | null
  retrievedAt: string
}

export type HbxHotelsFixtureSearchResult = {
  providerId: typeof HBX_HOTELS_PROVIDER_ID
  evidenceMode: 'fixture'
  options: HotelOption[]
  partial: boolean
}
