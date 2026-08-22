// lib/readiness/anforderungen.ts
//
// Provider-neutrale Naht für offizielle Anforderungen.
// Foundation C hat keinen Provider: fail closed, unknown bleibt unknown.
// Keine Fake-Regeln, keine Modellantwort als Quelle.

import {
  LEERE_OFFICIAL_REQUIRED_FACTS,
  landescodeLesen,
  type OfficialRequirementEvidence,
  type OfficialRequirementReason,
} from '@/lib/readiness/domain'
import { requirementsAuswerten } from '@/lib/readiness/engine'
import { requirementsProviderAus } from '@/lib/readiness/provider'

export type OfficialRequirementAnfrage = {
  destinationCountryCode?: string | null
  destinationCountryCodes?: string[]
  transitCountryCodes?: string[]
  travellers?: number
  startDate?: string | null
  endDate?: string | null
  party?: {
    clientRef: string
    nationalityCountryCode?: string | null
    residenceCountryCode?: string | null
    documentType?: 'passport' | 'national_id' | 'unknown' | null
    documentIssuingCountryCode?: string | null
    documentExpiresOn?: string | null
  }[]
}

function officialRequirementLeer(
  anfrage: OfficialRequirementAnfrage = {},
  reason: OfficialRequirementReason = 'no_provider',
): OfficialRequirementEvidence {
  const country = landescodeLesen(anfrage.destinationCountryCode ?? null)
  const travellers = anfrage.travellers ?? 1

  let status: OfficialRequirementEvidence['status'] = 'unavailable'
  let begruendung = reason

  if (!country) {
    status = 'insufficient_context'
    begruendung = reason === 'no_provider' ? 'unknown_country_code' : reason
  } else if (travellers > 1) {
    status = 'insufficient_context'
    begruendung = 'multiple_travellers_no_individual_evidence'
  } else {
    status = reason === 'no_provider' || reason === 'production_closed' ? 'unavailable' : 'insufficient_context'
    if (begruendung === 'no_provider') begruendung = 'missing_nationality'
  }

  return {
    destinationCountryCode: country,
    requiredTravellerFacts: LEERE_OFFICIAL_REQUIRED_FACTS,
    requirementType: 'entry_or_visa',
    result: 'unknown',
    status,
    authority: null,
    sourceUrl: null,
    checkedAt: null,
    validityUntil: null,
    reason: begruendung,
  }
}

/**
 * Geschlossene Anforderungsnaht. Ohne Provider niemals required/not_required.
 * Ein Country Code allein erzeugt keine Visa-Aussage.
 */
export function officialRequirementsPruefen(
  anfrage: OfficialRequirementAnfrage = {},
): OfficialRequirementEvidence {
  const destinations = [
    ...new Set(
      [
        landescodeLesen(anfrage.destinationCountryCode ?? null),
        ...(anfrage.destinationCountryCodes ?? []).map((code) => landescodeLesen(code)),
      ].filter((code): code is string => Boolean(code)),
    ),
  ]
  const evaluations = requirementsAuswerten(
    {
      originCountryCode: null,
      destinationCountryCodes: destinations,
      transitCountryCodes: (anfrage.transitCountryCodes ?? [])
        .map((code) => landescodeLesen(code))
        .filter((code): code is string => Boolean(code)),
      startDate: anfrage.startDate ?? null,
      endDate: anfrage.endDate ?? null,
      travellers: (anfrage.party ?? []).map((eintrag, index) => ({
        clientRef: eintrag.clientRef || `traveller:${index + 1}`,
        nationalityCountryCode: landescodeLesen(eintrag.nationalityCountryCode ?? null),
        residenceCountryCode: landescodeLesen(eintrag.residenceCountryCode ?? null),
        documentType: eintrag.documentType ?? null,
        documentIssuingCountryCode: landescodeLesen(eintrag.documentIssuingCountryCode ?? null),
        documentExpiresOn: eintrag.documentExpiresOn ?? null,
      })),
    },
    requirementsProviderAus(),
    anfrage,
  )
  const erste = evaluations[0]
  if (erste) {
    return {
      destinationCountryCode: erste.destinationCountryCode,
      requiredTravellerFacts: LEERE_OFFICIAL_REQUIRED_FACTS,
      requirementType: 'entry_or_visa',
      result: 'unknown',
      status: erste.status === 'current' ? 'unknown' : erste.status,
      authority: erste.evidence.authority,
      sourceUrl: erste.evidence.sourceUrl,
      checkedAt: erste.evidence.checkedAt,
      validityUntil: erste.evidence.validUntil,
      reason:
        erste.status === 'insufficient_context'
          ? erste.missingFacts.includes('nationality')
            ? 'missing_nationality'
            : erste.missingFacts.includes('destination_country')
              ? 'unknown_country_code'
              : 'insufficient_context'
          : 'no_provider',
    }
  }
  return officialRequirementLeer(anfrage, 'no_provider')
}

export function officialRequirementsFuerReise(opts: {
  destinationCountryCode: string | null
  travellers: number
}): OfficialRequirementEvidence {
  return officialRequirementsPruefen({
    destinationCountryCode: opts.destinationCountryCode,
    travellers: opts.travellers,
  })
}
