// lib/provider-ops/outcome.ts
//
// Technische Provider-Outcome-Grundtaxonomie.
// Fachzustände wie recheck_needed, insufficient_context oder rejected_acute
// gehören nicht hierher.

export const PROVIDER_OPS_OUTCOMES = [
  'ok',
  'partial',
  'empty',
  'checked_empty',
  'unavailable',
  'timeout',
  'invalid',
  'rate_limited',
  'error',
] as const

export type ProviderOpsOutcome = (typeof PROVIDER_OPS_OUTCOMES)[number]

export const PROVIDER_OPS_DOMAINS = [
  'flights',
  'hotels',
  'activities',
  'mobility',
  'rental_cars',
  'readiness',
  'safety',
  'seasonal',
] as const

export type ProviderOpsDomain = (typeof PROVIDER_OPS_DOMAINS)[number]

export function istProviderOpsOutcome(wert: string): wert is ProviderOpsOutcome {
  return (PROVIDER_OPS_OUTCOMES as readonly string[]).includes(wert)
}

/**
 * HTTP für orchestrierte technische Providerzustände.
 * 504 bleibt bewusst ausserhalb: bestehende Mobility-/Rental-Timeouts.
 */
export function providerOpsHttpStatusFuerOutcome(outcome: ProviderOpsOutcome): number {
  if (outcome === 'rate_limited') return 429
  if (outcome === 'invalid') return 400
  return 200
}
