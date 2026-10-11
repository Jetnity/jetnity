import 'server-only'

import { chDeVisaReadRequestPruefen } from './read-request'
import type { Trip } from '@/types/trips'

const GATES = Object.freeze([
  'source_not_qualified',
  'persisted_regulatory_context_unavailable',
  'legal_applicability_unverified',
  'accepted_reader_contract_unavailable',
  'retained_custody_read_unavailable',
  'rule_review_history_unavailable',
  'current_revocation_state_unavailable',
] as const)

/** Negative half of the server-owned reader contract (SW07/SW08/SW15).
 * No transport, environment, profile, Evidence or Rule injection exists.
 * Passing representable scope checks is NOT acceptance: the current SQL store
 * cannot serve full retained custody/review/current-revocation proof. The local
 * G1 declaration is not persisted account context or legal applicability.
 * G2 permits a bounded read-only SQL
 * artifact, but cannot reconstruct absent durable body/review/revocation data.
 * That retention/acceptance contract remains gated. Keep the provider null.
 */
export function chDeVisaReadBoundary() {
  return Object.freeze({
    status: 'unavailable' as const,
    reason: 'trusted_accepted_reader_unavailable',
    blockers: GATES,
    provider: null,
    acceptedEvidence: null,
    acceptedRule: null,
  })
}

/** Scoped negative read interface. No caller-provided reader capability. */
export function chDeVisaReadForTrip(reise: Trip, request?: unknown) {
  const scope = chDeVisaReadRequestPruefen(reise, request)
  const boundary = chDeVisaReadBoundary()
  return Object.freeze({ ...boundary,
    contextStatus: scope.ok ? scope.status : 'not_verified' as const,
    officialQualification: false as const,
    reason: scope.ok ? boundary.reason : scope.reason,
    blockers: scope.ok ? boundary.blockers : Object.freeze([scope.reason, ...boundary.blockers]),
  })
}
