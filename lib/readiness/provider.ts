// lib/readiness/provider.ts
//
// Provider-neutrale Adaptergrenze. Foundation E hat keinen Adapter.
// Tests dürfen einen Port injizieren. Production/Preview: immer null.
// Ein späterer Provider bewertet Credential-Optionen getrennt.
// Kein Timatic-Fake, keine Visa-Matrix, kein Modell als Quelle.

import type { OfficialRequirementType, TravellerDocumentType } from '@/types/trips'
import type {
  MissingFact,
  OfficialActionPurpose,
  OfficialClass,
  OfficialResult,
  OfficialVisaMode,
} from '@/lib/readiness/official'

export type RequirementsCredentialInput = {
  optionRef: string
  documentClientRef: string | null
  documentType: TravellerDocumentType | null
  issuingCountryCode: string | null
  expiresOn: string | null
  relatedCitizenshipCountryCode: string | null
}

export type RequirementsDocumentInput = {
  clientRef: string
  documentType: TravellerDocumentType
  issuingCountryCode: string | null
  expiresOn: string | null
  citizenshipCountryCode: string | null
}

export type RequirementsTravellerInput = {
  clientRef: string
  residenceCountryCode: string | null
  citizenshipCountryCodes: string[]
  documents: RequirementsDocumentInput[]
  credentialOptions: RequirementsCredentialInput[]
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
  credentialOptionRef?: string | null
  destinationCountryCode: string | null
  transitCountryCode?: string | null
  requirementType: OfficialRequirementType
  result: OfficialResult | 'insufficient_context'
  officialClass?: OfficialClass
  /**
   * Rohwert. Nur bei `requirementType === 'visa'` darf die Engine ihn als
   * `visaMode` übernehmen. Ungültige Werte werden `unknown`; nicht-Visa-Zeilen
   * inklusive eTA tragen keinen Visa-Modus als Product Truth.
   */
  visaMode?: OfficialVisaMode | string | null
  optionEligibility?: 'allowed' | 'not_allowed' | 'unknown'
  optionMandate?: 'mandatory' | 'not_mandatory' | 'unknown'
  authority?: string | null
  sourceUrl?: string | null
  /**
   * Explizite Action-URL. Nicht `sourceUrl`.
   * Nur zusammen mit strukturiertem `actionPurpose` und HTTPS-Validierung
   * darf daraus application/form/appointment entstehen.
   */
  actionUrl?: string | null
  /**
   * Rohwert. Ungültige oder Marketing-Labels werden verworfen.
   * Keine Heuristik aus Requirement-Typ.
   */
  actionPurpose?: OfficialActionPurpose | string | null
  checkedAt?: string | null
  validFrom?: string | null
  validUntil?: string | null
  ruleReference?: string | null
  availability?: 'ok' | 'temporarily_unavailable'
  missingFacts?: MissingFact[]
}

export type RequirementsProvider = {
  name: string
  evaluate(anfrage: RequirementsAnfrage, signal: AbortSignal): Promise<RequirementsProviderZeile[]>
}

export function requirementsProviderAus(): RequirementsProvider | null {
  return null
}
