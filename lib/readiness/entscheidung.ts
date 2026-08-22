// lib/readiness/entscheidung.ts
//
// Entscheidungsrelevante Semantik einer OfficialEvaluation.
// Abweichende Evidence-URLs allein sind kein semantischer Konflikt.

import type { OfficialEvaluation } from '@/lib/readiness/official'

export type EntscheidungsSignatur = {
  result: OfficialEvaluation['result']
  status: OfficialEvaluation['status']
  freshness: OfficialEvaluation['freshness']
  officialClass: OfficialEvaluation['officialClass']
  optionEligibility: OfficialEvaluation['optionEligibility']
  optionMandate: OfficialEvaluation['optionMandate']
}

export function entscheidungsSignatur(evaluation: OfficialEvaluation): EntscheidungsSignatur {
  return {
    result: evaluation.result,
    status: evaluation.status,
    freshness: evaluation.freshness,
    officialClass: evaluation.officialClass,
    optionEligibility: evaluation.optionEligibility,
    optionMandate: evaluation.optionMandate,
  }
}

export function entscheidungenGleich(links: OfficialEvaluation, rechts: OfficialEvaluation): boolean {
  const a = entscheidungsSignatur(links)
  const b = entscheidungsSignatur(rechts)
  return (
    a.result === b.result &&
    a.status === b.status &&
    a.freshness === b.freshness &&
    a.officialClass === b.officialClass &&
    a.optionEligibility === b.optionEligibility &&
    a.optionMandate === b.optionMandate
  )
}
