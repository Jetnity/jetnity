// lib/seasonal/provider.ts
//
// Provider-neutrale Adaptergrenze. Diese Foundation hat keinen Adapter.
// Tests dürfen einen Port injizieren. Production/Preview: immer null.
// Kein echter Climate-/Weather-/Seasonal-Provider, kein Scraper, kein LLM.

import type {
  SeasonalAuthorityClass,
  SeasonalCategory,
  SeasonalEvidenceClass,
  SeasonalOutcome,
} from '@/lib/seasonal/domain'

export type SeasonalProviderAnfrage = {
  contextFingerprint: string
  startDate: string | null
  endDate: string | null
  countryCodes: string[]
  airportCodes: string[]
  placeIds: string[]
}

export type SeasonalProviderFact = {
  factKey: string
  category: SeasonalCategory
  evidenceClass?: SeasonalEvidenceClass | string | null // untrusted; fehlend/leer ist ungültig, kein Default
  outcome?: SeasonalOutcome | string | null
  authority?: string | null
  authorityClass?: SeasonalAuthorityClass
  sourceUrl?: string | null
  publishedAt?: string | null
  updatedAt?: string | null
  checkedAt?: string | null
  freshUntil?: string | null
  spatialScope: unknown
  travelWindow: unknown
  referencePeriod?: unknown
  headline?: string | null
  summary?: string | null
  affectedDomains?: string[] | null
  availability?: 'ok' | 'temporarily_unavailable'
}

export type SeasonalProvider = {
  name: string
  evaluate(anfrage: SeasonalProviderAnfrage, signal?: AbortSignal): Promise<SeasonalProviderFact[]>
}

export function seasonalProviderAus(): SeasonalProvider | null {
  return null
}
