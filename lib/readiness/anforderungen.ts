// lib/readiness/anforderungen.ts
//
// Provider-neutrale Naht für offizielle Anforderungen.
// Foundation C hat keinen Provider: fail closed, unknown bleibt unknown.
// Keine Fake-Regeln, keine Modellantwort als Quelle.
//
// Kanonische neue Wahrheit: OfficialEvaluation[] aus der Engine.
// `official` / officialRequirementsPruefen ist Legacy-Compatibility
// und bleibt immer result: 'unknown'.

import {
  LEERE_OFFICIAL_REQUIRED_FACTS,
  landescodeLesen,
  type OfficialRequirementEvidence,
  type OfficialRequirementReason,
} from '@/lib/readiness/domain'
import { requirementsAuswerten, requirementsAusZeilen } from '@/lib/readiness/engine'
import type { OfficialEvaluation } from '@/lib/readiness/official'
import { requirementsProviderAus, type RequirementsAnfrage, type RequirementsProvider } from '@/lib/readiness/provider'
import {
  citizenshipCodesAus,
  credentialOptionsAus,
  documentCitizenshipCode,
  travellerLegacyLesen,
} from '@/lib/readiness/traveller-kontext'

export type OfficialRequirementAnfrage = {
  originCountryCode?: string | null
  destinationCountryCode?: string | null
  destinationCountryCodes?: string[]
  transitCountryCodes?: string[]
  travellers?: number
  startDate?: string | null
  endDate?: string | null
  party?: unknown[]
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

function anfrageAus(anfrage: OfficialRequirementAnfrage): RequirementsAnfrage {
  const destinations = [
    ...new Set(
      [
        landescodeLesen(anfrage.destinationCountryCode ?? null),
        ...(anfrage.destinationCountryCodes ?? []).map((code) => landescodeLesen(code)),
      ].filter((code): code is string => Boolean(code)),
    ),
  ]
  const gespeichert = (anfrage.party ?? [])
    .map((eintrag) => travellerLegacyLesen(eintrag))
    .filter((eintrag): eintrag is NonNullable<typeof eintrag> => eintrag !== null)
  const nachRef = new Map(gespeichert.map((eintrag) => [eintrag.clientRef, eintrag]))
  const anzahl = Math.min(Math.max(anfrage.travellers ?? 1, gespeichert.length, 1), 20)
  const travellers: RequirementsAnfrage['travellers'] = []
  for (let i = 1; i <= anzahl; i += 1) {
    const clientRef = `traveller:${i}`
    const eintrag = nachRef.get(clientRef)
    const options = eintrag ? credentialOptionsAus(eintrag) : []
    travellers.push({
      clientRef,
      residenceCountryCode: landescodeLesen(eintrag?.residenceCountryCode ?? null),
      citizenshipCountryCodes: eintrag ? citizenshipCodesAus(eintrag) : [],
      documents: (eintrag?.documents ?? []).map((document) => ({
        clientRef: document.clientRef,
        documentType: document.documentType,
        issuingCountryCode: document.issuingCountryCode,
        expiresOn: document.expiresOn,
        citizenshipCountryCode: eintrag ? documentCitizenshipCode(eintrag, document) : null,
      })),
      credentialOptions: options.map((option) => ({
        optionRef: option.optionRef,
        documentClientRef: option.document?.clientRef ?? null,
        documentType: option.document?.documentType ?? null,
        issuingCountryCode: option.document?.issuingCountryCode ?? null,
        expiresOn: option.document?.expiresOn ?? null,
        relatedCitizenshipCountryCode: option.document?.citizenshipCountryCode ?? null,
      })),
    })
  }
  return {
    originCountryCode: landescodeLesen(anfrage.originCountryCode ?? null),
    destinationCountryCodes: destinations,
    transitCountryCodes: (anfrage.transitCountryCodes ?? [])
      .map((code) => landescodeLesen(code))
      .filter((code): code is string => Boolean(code)),
    startDate: anfrage.startDate ?? null,
    endDate: anfrage.endDate ?? null,
    travellers,
  }
}

function reasonAusEvaluation(evaluation: OfficialEvaluation): OfficialRequirementReason {
  if (evaluation.status === 'insufficient_context') {
    if (evaluation.missingFacts.includes('nationality')) return 'missing_nationality'
    if (evaluation.missingFacts.includes('destination_country')) return 'unknown_country_code'
    return 'insufficient_context'
  }
  return 'no_provider'
}

/**
 * Legacy-Compatibility. Immer `result: 'unknown'`.
 * Neue Logik entscheidet aus `evaluations[]`, nicht aus diesem Objekt.
 */
export function officialAusEvaluations(
  evaluations: readonly OfficialEvaluation[],
  anfrage: OfficialRequirementAnfrage = {},
): OfficialRequirementEvidence {
  const erste = evaluations[0]
  if (!erste) return officialRequirementLeer(anfrage, 'no_provider')
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
    reason: reasonAusEvaluation(erste),
  }
}

/**
 * Kanonische API-Antwort: alle strukturierten Evaluations.
 * Async, damit ein späterer Netzwerkprovider ohne Kernumbau anbindbar ist.
 */
export async function requirementsEvaluationsPruefen(
  anfrage: OfficialRequirementAnfrage = {},
  provider: RequirementsProvider | null = requirementsProviderAus(),
): Promise<OfficialEvaluation[]> {
  return requirementsAuswerten(anfrageAus(anfrage), provider, anfrage)
}

/**
 * Geschlossene Legacy-Zusammenfassung. Immer fail closed, immer `result: 'unknown'`.
 * Nutzt nur lokale Normalisierung ohne Provider-Ausführung.
 * Die API-Wahrheit liegt in `requirementsEvaluationsPruefen`.
 */
export function officialRequirementsPruefen(
  anfrage: OfficialRequirementAnfrage = {},
): OfficialRequirementEvidence {
  const evaluations = requirementsAusZeilen(anfrageAus(anfrage), [], null, anfrage)
  return officialAusEvaluations(evaluations, anfrage)
}
