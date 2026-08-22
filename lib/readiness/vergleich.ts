// lib/readiness/vergleich.ts
//
// Provider-neutrale Priorisierung mehrerer Credential-Optionen.
// Requirement-Ergebnisse (visa/transit/passport required) sind keine
// Aussage darüber, dass genau dieses Credential verwendet werden muss.
// Ohne explizite option-level Eligibility/Mandate: fail-closed.

import type { OfficialEvaluation } from '@/lib/readiness/official'

export const VERGLEICH_NICHT_VERFUEGBAR = 'Noch nicht zuverlässig vergleichbar.'

export type CredentialVergleichRang =
  | 'option_mandatory'
  | 'option_not_allowed'
  | 'eligible_lower_friction'
  | 'not_comparable'

export type CredentialVergleich = {
  comparable: boolean
  reason: string
  winnerOptionRef: string | null
  duty: 'required' | 'recommendation' | 'unknown'
  ranks: Array<{
    optionRef: string
    rank: CredentialVergleichRang
    result: OfficialEvaluation['result']
    officialClass: OfficialEvaluation['officialClass']
  }>
}

function evaluationSchluessel(evaluation: OfficialEvaluation): string {
  return [
    evaluation.travellerClientRef ?? '',
    evaluation.destinationCountryCode ?? '',
    evaluation.transitCountryCode ?? '',
    evaluation.requirementType,
  ].join('|')
}

function optionRefVon(evaluation: OfficialEvaluation): string {
  return evaluation.credentialOptionRef ?? `${evaluation.travellerClientRef ?? 'traveller'}:none`
}

function eligibilityVon(evaluation: OfficialEvaluation): 'allowed' | 'not_allowed' | 'unknown' {
  return evaluation.optionEligibility === 'allowed' || evaluation.optionEligibility === 'not_allowed'
    ? evaluation.optionEligibility
    : 'unknown'
}

function mandateVon(evaluation: OfficialEvaluation): 'mandatory' | 'not_mandatory' | 'unknown' {
  return evaluation.optionMandate === 'mandatory' || evaluation.optionMandate === 'not_mandatory'
    ? evaluation.optionMandate
    : 'unknown'
}

function entscheidbar(evaluation: OfficialEvaluation): boolean {
  return evaluation.status === 'current' && evaluation.freshness === 'current'
}

function rangFuer(evaluation: OfficialEvaluation): CredentialVergleichRang {
  if (!entscheidbar(evaluation)) return 'not_comparable'
  if (eligibilityVon(evaluation) === 'not_allowed') return 'option_not_allowed'
  if (mandateVon(evaluation) === 'mandatory') return 'option_mandatory'
  if (eligibilityVon(evaluation) === 'allowed') return 'eligible_lower_friction'
  return 'not_comparable'
}

/**
 * Vergleicht belegte Optionen derselben Traveller-/Ziel-/Requirement-Gruppe.
 * `result=required` heisst nicht, dass dieses Credential zwingend ist.
 */
export function credentialOptionenVergleichen(
  evaluations: readonly OfficialEvaluation[],
): CredentialVergleich {
  const gruppen = new Map<string, OfficialEvaluation[]>()
  for (const evaluation of evaluations) {
    const key = evaluationSchluessel(evaluation)
    const liste = gruppen.get(key) ?? []
    liste.push(evaluation)
    gruppen.set(key, liste)
  }

  const ranks: CredentialVergleich['ranks'] = []
  for (const gruppe of gruppen.values()) {
    for (const evaluation of gruppe) {
      ranks.push({
        optionRef: optionRefVon(evaluation),
        rank: rangFuer(evaluation),
        result: evaluation.result,
        officialClass: evaluation.officialClass,
      })
    }
  }

  const aktuelle = evaluations.filter(entscheidbar)
  if (aktuelle.length < 2) {
    return {
      comparable: false,
      reason: VERGLEICH_NICHT_VERFUEGBAR,
      winnerOptionRef: null,
      duty: 'unknown',
      ranks,
    }
  }

  const gruppenAktuell = new Map<string, OfficialEvaluation[]>()
  for (const evaluation of aktuelle) {
    const key = evaluationSchluessel(evaluation)
    const liste = gruppenAktuell.get(key) ?? []
    liste.push(evaluation)
    gruppenAktuell.set(key, liste)
  }

  let winnerOptionRef: string | null = null
  let duty: CredentialVergleich['duty'] = 'unknown'
  let reason = VERGLEICH_NICHT_VERFUEGBAR
  let vergleichbareGruppen = 0

  for (const gruppe of gruppenAktuell.values()) {
    if (gruppe.length < 2) continue
    const entscheid = gruppeEntscheiden(gruppe)
    if (!entscheid.comparable) {
      return {
        comparable: false,
        reason: VERGLEICH_NICHT_VERFUEGBAR,
        winnerOptionRef: null,
        duty: entscheid.duty,
        ranks,
      }
    }
    vergleichbareGruppen += 1
    winnerOptionRef = entscheid.winnerOptionRef
    duty = entscheid.duty
    reason = entscheid.reason
  }

  if (vergleichbareGruppen !== 1 || !winnerOptionRef) {
    return {
      comparable: false,
      reason: VERGLEICH_NICHT_VERFUEGBAR,
      winnerOptionRef: null,
      duty: 'unknown',
      ranks,
    }
  }

  return {
    comparable: true,
    reason,
    winnerOptionRef,
    duty,
    ranks,
  }
}

function gruppeEntscheiden(gruppe: OfficialEvaluation[]): {
  comparable: boolean
  winnerOptionRef: string | null
  duty: CredentialVergleich['duty']
  reason: string
} {
  const nichtZulaessig = gruppe.filter((evaluation) => eligibilityVon(evaluation) === 'not_allowed')
  const zulaessig = gruppe.filter((evaluation) => eligibilityVon(evaluation) !== 'not_allowed')

  if (nichtZulaessig.length > 0) {
    const explizitErlaubt = zulaessig.filter((evaluation) => eligibilityVon(evaluation) === 'allowed')
    if (explizitErlaubt.length === 1 && explizitErlaubt.length === zulaessig.length) {
      return {
        comparable: true,
        winnerOptionRef: optionRefVon(explizitErlaubt[0]),
        duty: 'required',
        reason: 'Andere belegte Optionen sind für diese Route nicht zulässig.',
      }
    }
    return {
      comparable: false,
      winnerOptionRef: null,
      duty: 'unknown',
      reason: VERGLEICH_NICHT_VERFUEGBAR,
    }
  }

  const zwingend = gruppe.filter((evaluation) => mandateVon(evaluation) === 'mandatory')
  if (zwingend.length === 1) {
    return {
      comparable: true,
      winnerOptionRef: optionRefVon(zwingend[0]),
      duty: 'required',
      reason: 'Für diese Reise gilt eine belegte option-level Pflicht.',
    }
  }
  if (zwingend.length > 1) {
    return {
      comparable: false,
      winnerOptionRef: null,
      duty: 'required',
      reason: VERGLEICH_NICHT_VERFUEGBAR,
    }
  }

  const alleExplizitErlaubt = gruppe.every((evaluation) => eligibilityVon(evaluation) === 'allowed')
  if (alleExplizitErlaubt) {
    const reibung = gruppe.filter(
      (evaluation) =>
        evaluation.officialClass === 'requirement' &&
        (evaluation.result === 'required' ||
          evaluation.result === 'not_required' ||
          evaluation.result === 'conditional'),
    )
    if (reibung.length === gruppe.length) {
      const ohneVisum = reibung.filter((evaluation) => evaluation.result === 'not_required')
      const mitReibung = reibung.filter(
        (evaluation) => evaluation.result === 'required' || evaluation.result === 'conditional',
      )
      if (ohneVisum.length === 1 && mitReibung.length === reibung.length - 1) {
        return {
          comparable: true,
          winnerOptionRef: optionRefVon(ohneVisum[0]),
          duty: 'recommendation',
          reason: 'Belegte Optionen unterscheiden sich in der regulatorischen Reibung.',
        }
      }
    }
  }

  return {
    comparable: false,
    winnerOptionRef: null,
    duty: 'unknown',
    reason: VERGLEICH_NICHT_VERFUEGBAR,
  }
}
