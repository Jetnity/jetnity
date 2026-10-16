import type { Trip } from '@/types/trips'
import { admit, contentEqual, workAllowed } from './input'
import { directChanges, relationChanges, summaries } from './changes'
import { evaluate, evaluationChanges, sources, type Evaluation } from './evaluations'
import { compare, emptyReport, LIMITS, unique, type Report } from './contract'

/**
 * Dormant Node-only, pure internal comparison of already authorized saved snapshots.
 * Same trip identity is NOT an ownership check. No public/raw payload admission API,
 * provider/instant authority, apply path, cache, I/O or runtime consumer is installed.
 */
export function changeImpactFoundationV1(baseline: Trip, observed: Trip): Report {
  const report = emptyReport()
  const input = admit(baseline, observed)
  if (!input.ok) { report.reasonCodes = [input.reason]; report.counts.unprocessedSnapshots = 2; return report }
  const a = input.baseline, b = input.observed
  report.identity = { tripId: a.id, baselineRevision: a.revision, observedRevision: b.revision }
  report.snapshotRelation = contentEqual(a, b) ? 'same_snapshot_content' : a.revision === b.revision ? 'same_revision_unverified' : 'forward_revision_unverified'
  report.reasonCodes = [report.snapshotRelation, 'stored_revision_not_external_freshness', 'redacted_summary_not_exhaustive']
  report.notChecked.push('lodging_location_and_supplier_acceptance', 'snapshot_local_subevent_continuity')
  if (!workAllowed(a, b)) {
    report.evaluation = 'incomplete'; report.reasonCodes.push('canonical_work_limit'); report.counts.unprocessedSnapshots = 2
    return report
  }
  report.evaluation = report.snapshotRelation === 'same_revision_unverified' ? 'partial' : 'complete'
  const direct = directChanges(a, b)
  report.claims.push(...direct.claims)
  const pairs: { baseline: [string, string][]; observed: [string, string][] } = { baseline: [], observed: [] }
  for (const domain of ['temporal', 'lodging', 'flight', 'mobility'] as const) {
    const left = evaluate(domain, a), right = evaluate(domain, b)
    report.domains.push({ domain, source: sources[domain], baseline: left.state, observed: right.state })
    report.claims.push(...evaluationChanges(domain, sources[domain], left, right, a.id))
    const failed = (r: Evaluation) => r.state.state === 'error' || r.state.state === 'incomplete'
    if (failed(left) || failed(right)) {
      report.evaluation = 'incomplete'; report.reasonCodes.push('atomic_domain_comparison_unavailable')
    } else if (report.evaluation !== 'incomplete' && (left.state.state === 'partial' || right.state.state === 'partial')) report.evaluation = 'partial'
    if (domain === 'temporal' && !failed(left) && !failed(right)) {
      pairs.baseline = left.relations; pairs.observed = right.relations
    }
  }
  report.claims.push(...relationChanges(a, b, direct.changes, pairs))
  if (report.evaluation === 'complete' && report.claims.some(c => c.kind === 'unknown')) report.evaluation = 'partial'
  try { report.summary = summaries(a, b) }
  catch { report.evaluation = 'incomplete'; report.reasonCodes.push('canonical_summary_error') }
  report.claims.sort((x, y) => compare(x.domain, y.domain) || compare(x.id, y.id))
  report.counts.claims = report.claims.length
  const limited = () => { report.evaluation = 'incomplete'; report.reasonCodes.push('output_limit') }
  if (report.claims.length > LIMITS.claims) { report.claims.length = LIMITS.claims; limited() }
  for (const claim of report.claims) {
    if (claim.refs.length > LIMITS.refsPerClaim) {
      report.counts.omittedRefs += claim.refs.length - LIMITS.refsPerClaim
      claim.refs.length = LIMITS.refsPerClaim; limited()
    }
    claim.reasonCodes = unique(claim.reasonCodes)
  }
  const summariesBefore = report.summary.length
  report.summary = report.summary.filter(s => s.text.length <= LIMITS.summaryText).slice(0, LIMITS.summaries)
  report.counts.omittedSummaries = summariesBefore - report.summary.length
  if (report.counts.omittedSummaries) limited()
  // Also cap total serialized output, including canonical gap projections and long internal IDs.
  while (JSON.stringify(report).length > LIMITS.outputCharacters - 512 && (report.claims.length || report.summary.length)) {
    if (report.claims.length) report.claims.pop()
    else { report.summary.pop(); report.counts.omittedSummaries++ }
    limited()
    report.reasonCodes = unique(report.reasonCodes)
  }
  report.counts.returned = report.claims.length
  report.counts.omitted = report.counts.claims - report.counts.returned
  report.reasonCodes = unique(report.reasonCodes)
  return report
}
