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

export type OfficialRequirementAnfrage = {
  destinationCountryCode?: string | null
  travellers?: number
  startDate?: string | null
  endDate?: string | null
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
  return officialRequirementLeer(anfrage, 'no_provider')
}

export function officialRequirementsFuerReise(opts: {
  destinationCountryCode: string | null
  travellers: number
}): OfficialRequirementEvidence {
  return officialRequirementLeer(
    {
      destinationCountryCode: opts.destinationCountryCode,
      travellers: opts.travellers,
    },
    'no_provider',
  )
}
