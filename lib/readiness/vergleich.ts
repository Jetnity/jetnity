// lib/readiness/vergleich.ts
//
// Provider-neutrale Priorisierung mehrerer Credential-Optionen.
// Ohne belastbare Official Evidence niemals ein „besserer Pass“.
// Gesetzliche Pflicht steht über Convenience.

import type { OfficialEvaluation } from '@/lib/readiness/official'

export const VERGLEICH_NICHT_VERFUEGBAR = 'Noch nicht zuverlässig vergleichbar.'

export type CredentialVergleichRang =
  | 'required_or_not_allowed'
  | 'route_or_transit'
  | 'provider_or_carrier'
  | 'lower_friction'
  | 'other_evidence'
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

function rangFuer(evaluation: OfficialEvaluation): CredentialVergleichRang {
  if (evaluation.status !== 'current') return 'not_comparable'
  if (evaluation.officialClass === 'requirement' && (evaluation.result === 'required' || evaluation.result === 'conditional')) {
    return 'required_or_not_allowed'
  }
  if (evaluation.requirementType === 'transit' && evaluation.result === 'required') {
    return 'route_or_transit'
  }
  if (evaluation.officialClass === 'requirement') return 'provider_or_carrier'
  if (evaluation.result === 'not_required') return 'lower_friction'
  if (evaluation.result === 'required' || evaluation.result === 'conditional') return 'other_evidence'
  return 'not_comparable'
}

const RANG_ORDNUNG: Record<CredentialVergleichRang, number> = {
  required_or_not_allowed: 1,
  route_or_transit: 2,
  provider_or_carrier: 3,
  lower_friction: 4,
  other_evidence: 5,
  not_comparable: 99,
}

/**
 * Vergleicht belegte Optionen derselben Traveller-/Ziel-/Requirement-Gruppe.
 * Convenience darf required/not-allowed nicht überstimmen.
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
        optionRef: evaluation.credentialOptionRef ?? `${evaluation.travellerClientRef ?? 'traveller'}:none`,
        rank: rangFuer(evaluation),
        result: evaluation.result,
        officialClass: evaluation.officialClass,
      })
    }
  }

  const belegbar = ranks.filter((eintrag) => eintrag.rank !== 'not_comparable')
  if (belegbar.length < 2) {
    return {
      comparable: false,
      reason: VERGLEICH_NICHT_VERFUEGBAR,
      winnerOptionRef: null,
      duty: 'unknown',
      ranks,
    }
  }

  const pflicht = belegbar.filter((eintrag) => eintrag.rank === 'required_or_not_allowed')
  if (pflicht.length === 1) {
    return {
      comparable: true,
      reason: 'Für diese Reise gilt eine belegte regulatorische Pflicht.',
      winnerOptionRef: pflicht[0].optionRef,
      duty: 'required',
      ranks,
    }
  }
  if (pflicht.length > 1) {
    return {
      comparable: false,
      reason: VERGLEICH_NICHT_VERFUEGBAR,
      winnerOptionRef: null,
      duty: 'required',
      ranks,
    }
  }

  const sortiert = [...belegbar].sort((a, b) => RANG_ORDNUNG[a.rank] - RANG_ORDNUNG[b.rank])
  const bester = sortiert[0]
  const gleich = sortiert.filter((eintrag) => eintrag.rank === bester.rank)
  if (gleich.length !== 1) {
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
    reason: 'Belegte Optionen unterscheiden sich in der regulatorischen Reibung.',
    winnerOptionRef: bester.optionRef,
    duty: 'recommendation',
    ranks,
  }
}
