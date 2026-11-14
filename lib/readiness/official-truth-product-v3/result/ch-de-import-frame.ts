import 'server-only'
import type { V3ManagedJobRecord } from '../monitor/queue'
import type { M04Authority } from '../jobs/contract'
import { AA_BERN_CH_DE_REVIEWED_PROGRAM } from '../source/aa-ch-de-reviewed-program'
import { hrs1Same, type Hrs1Binding, type Hrs1FixedOperation } from './contract'

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
  const operations = ['history', 'history', 'attest', 'evidence', 'history'] as const
  function close() { closed = true; receipt = null; input.signal.removeEventListener('abort', close) }
  input.signal.addEventListener('abort', close, { once: true })
  if (input.signal.aborted) close()
  const authority: M04Authority = Object.freeze<M04Authority>({
    async resolveCurrent(method, checkedAt) {
      if (closed || resolving || receipt || !hrs1Same(method, program.method)) return { status: 'unavailable' }
      resolving = true
      try {
        const result = await input.authority.resolveCurrent(method, checkedAt)
        if (closed || input.signal.aborted) return { status: 'unavailable' }
        if (result.status === 'approved') receipt = result.receipt
        else close()
        return result
      } catch { close(); return { status: 'unavailable' } }
    },
    async reproveAtCommit(candidate, method, checkedAt) {
      if (closed || !receipt || candidate !== receipt || busy || calls !== operations.length
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
    if (closed || input.signal.aborted || signal.aborted || !receipt || busy
      || calls >= operations.length || command.operation !== operations[calls]
      || provided !== undefined && provided !== receipt) return { status: 'unavailable' }
    const held = receipt
    calls++; busy = true
    try {
      // Passing the same private object does not refresh its monotonic/DB cap.
      // Every underlying HRS transaction still checks current method and epoch.
      const reply = await input.fixed(command, signal, held, notAfter)
      if (closed || signal.aborted || input.signal.aborted) return { status: 'unavailable' }
      if (['unavailable', 'unconfirmed', 'invalid'].includes(reply.status)) close()
      return reply
    } catch { close(); return { status: 'unavailable' } }
    finally { busy = false }
  }
  return Object.freeze({ authority, fixed, close })
}
