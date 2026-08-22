// lib/readiness/provider.ts
//
// Provider-neutrale Adaptergrenze. Foundation C hat keinen Adapter.
// Tests dürfen einen Port injizieren. Production/Preview: immer null.
// Kein Timatic-Fake, keine Visa-Matrix, kein Modell als Quelle.

import type { OfficialRequirementType, TravellerDocumentType } from '@/types/trips'
import type { OfficialClass, OfficialResult } from '@/lib/readiness/official'

export type RequirementsTravellerInput = {
  clientRef: string
  nationalityCountryCode: string | null
  residenceCountryCode: string | null
  documentType: TravellerDocumentType | null
  documentIssuingCountryCode: string | null
  documentExpiresOn: string | null
}

export type RequirementsAnfrage = {
  originCountryCode: string | null
  destinationCountryCodes: string[]
  transitCountryCodes: string[]
  startDate: string | null
  endDate: string | null
  travellers: RequirementsTravellerInput[]
}

export type RequirementsProviderZeile = {
  travellerClientRef: string
  destinationCountryCode: string | null
  transitCountryCode?: string | null
  requirementType: OfficialRequirementType
  result: OfficialResult
  officialClass?: OfficialClass
  authority?: string | null
  sourceUrl?: string | null
  checkedAt?: string | null
  validFrom?: string | null
  validUntil?: string | null
  ruleReference?: string | null
}

export type RequirementsProvider = {
  name: string
  evaluate(anfrage: RequirementsAnfrage): RequirementsProviderZeile[]
}

export function requirementsProviderAus(): RequirementsProvider | null {
  return null
}
