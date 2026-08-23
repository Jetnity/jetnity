// lib/safety/provider.ts
//
// Provider-neutrale Adaptergrenze. Diese Foundation hat keinen Adapter.
// Tests dürfen einen Port injizieren. Production/Preview: immer null.
// Kein echter Safety-/Weather-/Government-Provider, kein Scraper, kein LLM.

import type {
  SafetyAdvisoryClass,
  SafetyAuthorityClass,
  SafetyEventCategory,
  SafetyEventStatus,
  SafetyNature,
  SafetySourceSeverity,
} from '@/lib/safety/domain'

export type SafetyProviderAnfrage = {
  contextFingerprint: string
  startDate: string | null
  endDate: string | null
  countryCodes: string[]
  airportCodes: string[]
  placeIds: string[]
}

export type SafetyProviderFact = {
  factKey: string
  category: SafetyEventCategory
  status?: SafetyEventStatus
  nature?: SafetyNature
  authority?: string | null
  authorityClass?: SafetyAuthorityClass
  sourceUrl?: string | null
  publishedAt?: string | null
  updatedAt?: string | null
  checkedAt?: string | null
  validFrom?: string | null
  validUntil?: string | null
  spatialScope: unknown
  sourceSeverity?: SafetySourceSeverity | null
  advisoryClass?: SafetyAdvisoryClass | null
  headline?: string | null
  summary?: string | null
  travellerDependent?: boolean
  travellerCitizenshipCodes?: string[]
  availability?: 'ok' | 'temporarily_unavailable'
}

export type SafetyProvider = {
  name: string
  evaluate(anfrage: SafetyProviderAnfrage): Promise<SafetyProviderFact[]>
}

export function safetyProviderAus(): SafetyProvider | null {
  return null
}
