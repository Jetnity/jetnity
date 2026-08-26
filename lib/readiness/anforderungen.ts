// lib/readiness/anforderungen.ts
//
// Provider-neutrale Naht für offizielle Anforderungen.
// Foundation C hat keinen Provider: fail closed, unknown bleibt unknown.
// Keine Fake-Regeln, keine Modellantwort als Quelle.
//
// Kanonische neue Wahrheit: OfficialEvaluation[] aus der Engine.
// `official` / officialRequirementsPruefen ist Legacy-Compatibility:
// immer result: 'unknown', niemals evaluations[0], fail-closed bei heterogenem Scope.

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
  travellerAnfrageStriktLesen,
} from '@/lib/readiness/traveller-anfrage'
import {
  citizenshipCodesAus,
  credentialOptionsAus,
  documentCitizenshipCode,
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
  const rohParty = anfrage.party ?? []
  const gespeichert: NonNullable<ReturnType<typeof travellerAnfrageStriktLesen>>[] = []
  for (const eintrag of rohParty) {
    const gelesen = travellerAnfrageStriktLesen(eintrag)
    if (!gelesen) {
      return {
        originCountryCode: landescodeLesen(anfrage.originCountryCode ?? null),
        destinationCountryCodes: destinations,
        transitCountryCodes: (anfrage.transitCountryCodes ?? [])
          .map((code) => landescodeLesen(code))
          .filter((code): code is string => Boolean(code)),
        startDate: anfrage.startDate ?? null,
        endDate: anfrage.endDate ?? null,
        travellers: [],
      }
    }
    gespeichert.push(gelesen)
  }
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

function optionScopeSchluessel(evaluation: OfficialEvaluation): string {
  return [
    evaluation.travellerClientRef ?? '',
    evaluation.credentialOptionRef ?? '',
    evaluation.destinationCountryCode ?? '',
    evaluation.transitCountryCode ?? '',
  ].join('\0')
}

function presentationSchluessel(evaluation: OfficialEvaluation): string {
  return [
    evaluation.evidence.authority ?? '',
    evaluation.evidence.sourceUrl ?? '',
    evaluation.evidence.checkedAt ?? '',
    evaluation.evidence.validUntil ?? '',
  ].join('\0')
}

function compatibilityStatus(evaluation: OfficialEvaluation): OfficialRequirementEvidence['status'] {
  if (
    evaluation.status === 'unavailable' ||
    evaluation.status === 'insufficient_context' ||
    evaluation.status === 'unknown'
  ) {
    return evaluation.status
  }
  return 'unknown'
}

function alleGleich<T>(werte: readonly T[]): boolean {
  if (werte.length === 0) return true
  return werte.every((wert) => wert === werte[0])
}

function einziges<T>(werte: readonly T[]): T | undefined {
  return alleGleich(werte) ? werte[0] : undefined
}

/**
 * Legacy-Compatibility. Immer `result: 'unknown'`.
 * Keine first-evaluation-Wahrheit: nur Aussagen, die für den gesamten Scope belegt sind.
 * Kanonische Hard Truth bleibt `evaluations[]`.
 */
export function officialAusEvaluations(
  evaluations: readonly OfficialEvaluation[],
  anfrage: OfficialRequirementAnfrage = {},
): OfficialRequirementEvidence {
  if (evaluations.length === 0) return officialRequirementLeer(anfrage, 'no_provider')

  const scopes = evaluations.map(optionScopeSchluessel)
  const travellers = evaluations.map((eintrag) => eintrag.travellerClientRef)
  const destinations = evaluations.map((eintrag) => eintrag.destinationCountryCode)
  const statuses = evaluations.map(compatibilityStatus)
  const reasons = evaluations.map(reasonAusEvaluation)
  const scopeEinheitlich = alleGleich(scopes)
  const presentationEinheitlich = alleGleich(evaluations.map(presentationSchluessel))
  const mehrereTraveller = new Set(travellers.filter((ref): ref is string => Boolean(ref))).size > 1
  const destinationCountryCode = einziges(destinations) ?? null
  const status = einziges(statuses) ?? 'insufficient_context'
  const reason = mehrereTraveller
    ? 'multiple_travellers_no_individual_evidence'
    : scopeEinheitlich
      ? (einziges(reasons) ?? 'insufficient_context')
      : 'insufficient_context'

  const darstellungErlaubt = scopeEinheitlich && presentationEinheitlich
  const beispiel = evaluations[0]
  if (!beispiel) return officialRequirementLeer(anfrage, 'no_provider')

  return {
    destinationCountryCode,
    requiredTravellerFacts: LEERE_OFFICIAL_REQUIRED_FACTS,
    requirementType: 'entry_or_visa',
    result: 'unknown',
    status,
    authority: darstellungErlaubt ? beispiel.evidence.authority : null,
    sourceUrl: darstellungErlaubt ? beispiel.evidence.sourceUrl : null,
    checkedAt: darstellungErlaubt ? beispiel.evidence.checkedAt : null,
    validityUntil: darstellungErlaubt ? beispiel.evidence.validUntil : null,
    reason,
  }
}

function evaluationsFuerItemScope(
  evaluations: readonly OfficialEvaluation[],
  scope: { countryCode?: string | null; travellerClientRef?: string | null },
): OfficialEvaluation[] {
  const country = landescodeLesen(scope.countryCode ?? null)
  const traveller = scope.travellerClientRef ?? null
  return evaluations.filter((eintrag) => {
    if (country && eintrag.destinationCountryCode !== country) return false
    if (traveller && eintrag.travellerClientRef !== traveller) return false
    return true
  })
}

/**
 * Item-Presentation: nur exakt passender Scope.
 * Kein Fallback auf fremde Traveller, Optionen oder Destinationen.
 */
export function officialFuerItem(
  evaluations: readonly OfficialEvaluation[],
  scope: { countryCode?: string | null; travellerClientRef?: string | null },
  anfrage: OfficialRequirementAnfrage = {},
): OfficialRequirementEvidence {
  const passend = evaluationsFuerItemScope(evaluations, scope)
  if (passend.length === 0) {
    const country = landescodeLesen(scope.countryCode ?? anfrage.destinationCountryCode ?? null)
    return {
      destinationCountryCode: country,
      requiredTravellerFacts: LEERE_OFFICIAL_REQUIRED_FACTS,
      requirementType: 'entry_or_visa',
      result: 'unknown',
      status: 'insufficient_context',
      authority: null,
      sourceUrl: null,
      checkedAt: null,
      validityUntil: null,
      reason: country ? 'insufficient_context' : 'unknown_country_code',
    }
  }
  return officialAusEvaluations(passend, {
    ...anfrage,
    destinationCountryCode: scope.countryCode ?? anfrage.destinationCountryCode,
  })
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
