import 'server-only'
import { createHash } from 'node:crypto'
import { createV3WorkIdentity } from '../contract'
import { AA_BERN_CH_DE_REVIEWED_PROGRAM } from '../source/aa-ch-de-reviewed-program'
import { officialTruthV3ChDeRuntime } from './ch-de-server'
import { readChDeOwnerImportRequest, type ChDeOwnerImportRequest, type ChDeOwnerImportOutcome } from './ch-de-owner-import-contract'

/** New ordinary request identifiers, retained by the caller before dispatch.
 * These are not execution tokens, method authority or source qualifications. */
export function chDeRefreshQueueIdentity(request: ChDeOwnerImportRequest): Readonly<{ operationId: string; jobId: string }> | null {
  const parsed = readChDeOwnerImportRequest(JSON.stringify(request))
  if (!parsed) return null
  const input = parsed.operationId + '\n' + parsed.leaseId
  const digest = (kind: string) => createHash('sha256').update('jetnity.ch-de-refresh.' + kind + '.v1\n' + input).digest('hex').slice(0, 32)
  return Object.freeze({ operationId: 'op3_' + digest('enqueue'), jobId: 'job3_' + digest('job') })
}

/** Enqueue and research are separate, already bounded ordinary entrances. A
 * positive enqueue acknowledgement is persisted before a worker is dispatched.
 * Retrying this same enqueue after a lost ACK cannot create another cycle. */
export async function enqueueOfficialTruthV3ChDeRefresh(request: ChDeOwnerImportRequest, signal: AbortSignal): Promise<ChDeOwnerImportOutcome> {
  const outcome = (status: ChDeOwnerImportOutcome['status']): ChDeOwnerImportOutcome => ({ schema: 1, status, published: 0 })
  if (signal.aborted) return outcome('unavailable')
  const ids = chDeRefreshQueueIdentity(request)
  if (!ids || request.mode !== 'start') return outcome('request_refused')
  const facade = officialTruthV3ChDeRuntime()
  if (!facade) return outcome('unavailable')
  const program = AA_BERN_CH_DE_REVIEWED_PROGRAM
  // The next scheduled delivery has no newly acquired source evidence yet.
  // This is the existing work identity, never a claim about legal requirements
  // or a change to the freshness of an already published result.
  const work = { context: program.context, method: program.method,
    factKind: program.binding.factKind, researchReason: { status: 'missing' as const } }
  const expected = createV3WorkIdentity(work)
  if (!expected.ok) return outcome('unavailable')
  try {
    const result = await facade.enqueueRule({ ...work, ...ids, attemptLimit: program.binding.attemptLimit }, signal)
    if (signal.aborted) return outcome('unresolved')
    if (result.status !== 'confirmed') {
      if (result.status === 'contended') return outcome('busy')
      if (result.status === 'collision' || result.status === 'invalid' || result.status === 'superseded') return outcome('unavailable')
      return outcome('unresolved')
    }
    const job = result.record
    if (job.kind !== 'research_job_record' || job.jobKey !== expected.value.jobKey
      || job.contextKey !== program.contextKey || job.method.methodId !== program.method.methodId
      || job.method.revision !== program.method.revision || job.research.factKind !== program.binding.factKind) return outcome('unresolved')
    // A live older job is deduplicated by M04, not adopted as this new request.
    if (job.jobId !== ids.jobId) return outcome('busy')
    if (job.state === 'exhausted') return outcome('exhausted')
    if (!['queued', 'leased', 'backoff', 'succeeded'].includes(job.state)) return outcome('unresolved')
    return outcome('queued')
  } catch { return outcome('unresolved') }
}
