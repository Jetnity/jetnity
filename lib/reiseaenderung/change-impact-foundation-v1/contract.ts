import { GRENZEN } from '@/lib/trips/schema'

/** Stricter computational admission bounds; not travel policy. Per snapshot unless noted. */
export const LIMITS = Object.freeze({
  items: Math.min(100, GRENZEN.punkteJeReise), days: GRENZEN.reisetageJeReise,
  stages: GRENZEN.etappenJeReise, events: 140, pairsAcrossSnapshots: 19_460,
  nodesAcrossSnapshots: 40_000, textAcrossSnapshots: 200_000,
  string: 2048, depth: 20, objectKeys: 100, array: 1000,
  nightSpan: GRENZEN.reisedauerInTagen, nightWorkAcrossSnapshots: 40_000,
  claims: 256, refsPerClaim: 24, summaries: 64, summaryText: 512, outputCharacters: 160_000,
})
export type Snapshot = 'baseline' | 'observed'
export type Domain = 'plan' | 'temporal' | 'lodging' | 'flight' | 'mobility'
export type Ref = { snapshot: Snapshot; entity: 'trip' | 'day' | 'stage' | 'item'; id: string; field?: string }
export type Value = null | string | number | boolean | Value[] | { [key: string]: Value }
export type Claim = {
  id: string
  kind: 'direct_change' | 'canonical_evaluation_delta' | 'relation_needs_review' | 'unknown'
  domain: Domain
  source: string
  reasonCodes: string[]
  refs: Ref[]
  baseline: Value
  observed: Value
}
export type DomainState = { state: 'complete' | 'partial' | 'incomplete' | 'error'; reasonCodes: string[] }
export type Report = {
  contractVersion: 'change-impact-foundation/v1'
  claimScope: 'stored_plan_snapshots_only'
  authority: 'user_stored_plan_not_provider_confirmed'
  evaluation: 'complete' | 'partial' | 'incomplete' | 'blocked'
  snapshotRelation: 'not_evaluated' | 'same_snapshot_content' | 'same_revision_unverified' | 'forward_revision_unverified'
  identity: { tripId: string; baselineRevision: number; observedRevision: number } | null
  reasonCodes: string[]
  notChecked: string[]
  domains: { domain: Domain; source: string; baseline: DomainState; observed: DomainState }[]
  claims: Claim[]
  summary: { source: 'reiseDiff'; projection: 'redacted_stored_plan'; art: string; text: string }[]
  counts: { claims: number; returned: number; omitted: number; omittedRefs: number; omittedSummaries: number; unprocessedSnapshots: number }
}
export const compare = (a: string, b: string) => a < b ? -1 : a > b ? 1 : 0
export const unique = (values: readonly string[]) => [...new Set(values)].sort(compare)
/** Only used AFTER descriptor admission, or on our own closed projections. No general diff engine. */
export function stable(value: unknown): string {
  if (Array.isArray(value)) return `[${value.map(stable).join(',')}]`
  if (value && typeof value === 'object') return `{${Object.entries(value).sort(([a], [b]) => compare(a, b)).map(([k, v]) => `${JSON.stringify(k)}:${stable(v)}`).join(',')}}`
  return JSON.stringify(value) ?? 'undefined'
}
export function emptyReport(): Report {
  return {
    contractVersion: 'change-impact-foundation/v1', claimScope: 'stored_plan_snapshots_only',
    authority: 'user_stored_plan_not_provider_confirmed', evaluation: 'blocked',
    snapshotRelation: 'not_evaluated', identity: null, reasonCodes: [],
    notChecked: ['ownership_and_access_authorization', 'external_snapshot_freshness', 'provider_confirmation',
      'live_flight_status', 'availability_and_prices', 'booking_payment_cancellation', 'minimum_connection_and_ground_travel',
      'official_entry_visa_safety', 'traveller_document_sufficiency', 'recovery_actions', 'global_trip_safety'],
    domains: [], claims: [], summary: [],
    counts: { claims: 0, returned: 0, omitted: 0, omittedRefs: 0, omittedSummaries: 0, unprocessedSnapshots: 0 },
  }
}
