import 'server-only'
import { immutable, ownRecord } from '@/lib/readiness/official-truth-autonomous-provenance-artifact'
import type { V3ManagedJobRecord } from '../monitor/queue'
import type { M04Authority } from '../jobs/contract'
import { AA_BERN_CH_DE_REVIEWED_PROGRAM } from '../source/aa-ch-de-reviewed-program'
import { hrs1Canonical, hrs1Clock, hrs1Data, hrs1Hash, hrs1Same, type Hrs1Binding, type Hrs1FixedOperation } from './contract'
import type { Hrs1InitialHistory, Hrs1InitialHistoryTransfer } from './source-proof'

/** One explicit I1 frame, constructed inside one selected research import.
 * Its receipt never leaves this closure. The original authority still owns its
 * expiry, current epoch and native effects; no DTO or later import can reuse it. */
export function createChDeImportFrame(input: Readonly<{
  binding: Hrs1Binding; job: V3ManagedJobRecord; signal: AbortSignal;
  authority: M04Authority; fixed: Hrs1FixedOperation;
}>) {
  const program = AA_BERN_CH_DE_REVIEWED_PROGRAM
  if (!hrs1Same(input.binding, program.binding) || input.job.kind !== 'research_job_record'
    || !hrs1Same(input.job.context, program.context) || input.job.contextKey !== program.contextKey
    || !hrs1Same(input.job.method, program.method) || input.job.state !== 'leased' || !input.job.lease) return null
  let closed = false, resolving = false, receipt: object | null = null, calls = 0, busy = false
  let importSignal: AbortSignal | null = null, initialHistory: Hrs1InitialHistory | null = null
  let historyTaken = false, resolvedAt: string | null = null
  const operations = ['history', 'attest', 'evidence', 'history'] as const
  function close() {
    closed = true; receipt = null; initialHistory = null
    input.signal.removeEventListener('abort', close)
    importSignal?.removeEventListener('abort', close)
  }
  input.signal.addEventListener('abort', close, { once: true })
  if (input.signal.aborted) close()
  // Called only by the jobs composition BEFORE scope.callback replaces the
  // actual I1 signal with a separately owned child for each port invocation.
  function admitImportSignal(signal: AbortSignal, initialRead: boolean): boolean {
    if (closed || input.signal.aborted || signal.aborted || !receipt
      || (importSignal ? signal !== importSignal || initialRead : !initialRead || calls !== 0 || busy)) {
      close(); return false
    }
    if (!importSignal) { importSignal = signal; signal.addEventListener('abort', close, { once: true }) }
    return true
  }
  const takeInitialHistory: Hrs1InitialHistoryTransfer = (request, signal) => {
    if (closed || input.signal.aborted || signal.aborted || !importSignal || importSignal.aborted
      || !receipt || busy || calls !== 1 || historyTaken || !initialHistory || !resolvedAt
      || !hrs1Data(request) || !ownRecord(request, ['context','contextKey','factKind','references','method','clock','previousDecision','decisionRef'])
      || !hrs1Same(request.context, program.context) || request.contextKey !== program.contextKey
      || request.factKind !== program.binding.factKind || !hrs1Same(request.method, program.method)
      || !hrs1Same(request.clock, hrs1Clock(resolvedAt, program.binding.legalTimeZone))
      || !hrs1Same(request.previousDecision, initialHistory.history.decision)) {
      close(); return null
    }
    const snapshot = initialHistory
    initialHistory = null; historyTaken = true
    return snapshot
  }
  const authority: M04Authority = Object.freeze<M04Authority>({
    async resolveCurrent(method, checkedAt) {
      if (closed || resolving || receipt || !hrs1Same(method, program.method)) return { status: 'unavailable' }
      resolving = true
      try {
        const result = await input.authority.resolveCurrent(method, checkedAt)
        if (closed || input.signal.aborted) return { status: 'unavailable' }
        if (result.status === 'approved') { receipt = result.receipt; resolvedAt = checkedAt }
        else close()
        return result
      } catch { close(); return { status: 'unavailable' } }
    },
    async reproveAtCommit(candidate, method, checkedAt) {
      if (closed || !receipt || candidate !== receipt || busy || calls !== operations.length || !historyTaken
        || !importSignal || importSignal.aborted
        || !hrs1Same(method, program.method)) { close(); return { status: 'unavailable' } }
      const held = receipt
      busy = true
      try {
        const result = await input.authority.reproveAtCommit(held, method, checkedAt)
        return closed || input.signal.aborted || receipt !== held ? { status: 'unavailable' } : result
      }
      finally { close() }
    },
  })
  const fixed: Hrs1FixedOperation = async (command, signal, provided, notAfter) => {
    if (closed || input.signal.aborted || signal.aborted || !importSignal || importSignal.aborted || !receipt || busy
      || calls >= operations.length || command.operation !== operations[calls]
      || calls > 0 && !historyTaken
      || provided !== undefined && provided !== receipt) return { status: 'unavailable' }
    if (calls === 0 && (command.schema !== 1 || command.bindingHash !== hrs1Hash(input.binding)
      || !hrs1Same(command.body, { contextKey: program.contextKey, factKind: program.binding.factKind }))) {
      close(); return { status: 'unavailable' }
    }
    const held = receipt
    calls++; busy = true
    try {
      // Passing the same private object does not refresh its monotonic/DB cap.
      // Every underlying HRS transaction still checks current method and epoch.
      const reply = await input.fixed(command, signal, held, notAfter)
      if (closed || signal.aborted || input.signal.aborted || importSignal.aborted) return { status: 'unavailable' }
      if (['unavailable', 'unconfirmed', 'invalid'].includes(reply.status)) close()
      if (calls === 1 && !closed) {
        const snapshot = reply.status === 'snapshot' && hrs1Data(reply.value)
          ? ownRecord(reply.value, ['history','head','stickyDecision','suppressionEpoch','generation','suppression']) : null
        if (!snapshot || !Number.isSafeInteger(snapshot.suppressionEpoch) || (snapshot.suppressionEpoch as number) < 0
          || !Number.isSafeInteger(snapshot.generation) || (snapshot.generation as number) < 0
          || !ownRecord(snapshot.history, ['pointer','version','decision','decisionPredecessor','decisionArchiveAppend','invalidatedProjectionRefs'])
          || !ownRecord(snapshot.head, ['pointer','sourceDecisionRef','historyArchive'])) {
          close(); return { status: 'unavailable' }
        }
        initialHistory = immutable(JSON.parse(hrs1Canonical(snapshot)) as Hrs1InitialHistory)
      }
      return reply
    } catch { close(); return { status: 'unavailable' } }
    finally { busy = false }
  }
  return Object.freeze({ authority, fixed, close, admitImportSignal, takeInitialHistory })
}
