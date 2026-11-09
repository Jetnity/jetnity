import 'server-only'

import { posix } from 'node:path'
import { performance } from 'node:perf_hooks'
import { ownRecord } from '@/lib/readiness/official-truth-autonomous-provenance-artifact'
import { readV3ProposalUpload } from '../import/interface'
import { readV3IntakeBinding, readV3IntakeReference,
  type V3IntakeReference, type V3IntakeResult } from '../storage/intake-contract'
import { readV3ResearchFile } from './file-server'
import type { V3IngressBudget, V3IngressRootPin, V3ResearchDelivery,
  V3ResearchFileIngress, V3ResearchIngressConfiguration, V3ResearchIngressResult } from './types'
import { V3_RESEARCH_FILE_NAME } from './types'

const DECIMAL = /^(?:0|[1-9][0-9]{0,19})$/
const unavailable = (reason: Extract<V3ResearchIngressResult, { status: 'unavailable' }>['reason']): V3ResearchIngressResult =>
  Object.freeze({ status: 'unavailable', reason })
const unconfirmed = (reference: V3IntakeReference): V3ResearchIngressResult => Object.freeze({ status: 'unconfirmed', reference })

function rootPin(value: unknown): V3IngressRootPin | null {
  const root = ownRecord(value, ['directory', 'device', 'inode'])
  if (!root || typeof root.directory !== 'string' || root.directory.length > 4096 || root.directory.includes('\0')
    || !posix.isAbsolute(root.directory) || posix.normalize(root.directory) !== root.directory || root.directory.endsWith('/')
    || typeof root.device !== 'string' || !DECIMAL.test(root.device)
    || typeof root.inode !== 'string' || !DECIMAL.test(root.inode) || root.inode === '0') return null
  return Object.freeze({ directory: root.directory, device: root.device, inode: root.inode })
}
function delivery(value: unknown): V3ResearchDelivery | null {
  try {
    const row = ownRecord(value, ['fileName', 'binding'])
    if (!row || typeof row.fileName !== 'string' || !V3_RESEARCH_FILE_NAME.test(row.fileName)) return null
    const binding = readV3IntakeBinding(row.binding)
    return binding.ok ? Object.freeze({ fileName: row.fileName, binding: binding.value }) : null
  } catch { return null }
}
function equalReference(left: V3IntakeReference, right: V3IntakeReference): boolean {
  const a = left.binding, b = right.binding
  return left.proposalDigest === right.proposalDigest && left.bytes === right.bytes
    && a.schema === b.schema && a.kind === b.kind && a.operationId === b.operationId && a.jobId === b.jobId
    && a.contextKey === b.contextKey && a.method.methodId === b.method.methodId && a.method.revision === b.method.revision
    && a.runnerId === b.runnerId && a.deliveryId === b.deliveryId && a.inputRevision === b.inputRevision
}
function intakeReply(value: unknown, expected: V3IntakeReference): V3IntakeResult | null {
  try {
    const recorded = ownRecord(value, ['status', 'reference'])
    if (recorded?.status === 'recorded') {
      const reference = readV3IntakeReference(recorded.reference)
      return reference.ok && equalReference(reference.value, expected)
        ? Object.freeze({ status: 'recorded', reference: reference.value }) : null
    }
    const rejected = ownRecord(value, ['status', 'reason'])
    if (rejected?.status === 'rejected' && (rejected.reason === 'invalid_upload' || rejected.reason === 'bound_exceeded'
      || rejected.reason === 'invalid_proposal' || rejected.reason === 'invalid_binding' || rejected.reason === 'binding_mismatch')) {
      return Object.freeze({ status: 'rejected', reason: rejected.reason })
    }
    const simple = ownRecord(value, ['status'])
    if (simple && (simple.status === 'collision' || simple.status === 'not_attempted'
      || simple.status === 'unconfirmed' || simple.status === 'unavailable')) return Object.freeze({ status: simple.status })
  } catch { /* Untrusted acknowledgements never escape the fixed outcome vocabulary. */ }
  return null
}
function scope(milliseconds: number, external?: AbortSignal): V3IngressBudget & { dispose(): void } {
  const controller = new AbortController()
  const deadline = performance.now() + milliseconds
  let aborted = external?.aborted === true
  const onAbort = () => { aborted = true; controller.abort() }
  external?.addEventListener('abort', onAbort, { once: true })
  if (aborted) controller.abort()
  const timer = setTimeout(() => { controller.abort() }, milliseconds)
  return {
    signal: controller.signal,
    stopped() {
      if (aborted) return 'aborted'
      if (performance.now() >= deadline || controller.signal.aborted) {
        controller.abort(); return 'budget_exhausted'
      }
      return null
    },
    dispose() { clearTimeout(timer); external?.removeEventListener('abort', onAbort) },
  }
}
function closed(reason: Extract<V3ResearchIngressResult, { status: 'unavailable' }>['reason']): V3ResearchFileIngress {
  return Object.freeze({ async deliver() { return unavailable(reason) }, async confirm() { return unavailable(reason) } })
}

/** Dormant entry: no configuration, IO, registry registration or approval fallback. */
export function v3ResearchFileIngressProduction(): V3ResearchFileIngress { return closed('unbound') }

/** Code-owned runner configuration; never construct it from a researcher manifest. */
export function createV3ResearchFileIngress(configuration: V3ResearchIngressConfiguration | null): V3ResearchFileIngress {
  if (!configuration?.intake) return closed('unbound')
  const intake = configuration.intake
  let root: V3IngressRootPin | null
  const milliseconds = configuration.invocationMilliseconds ?? 5000
  try { root = rootPin(configuration.root) } catch { return closed('invalid_configuration') }
  if (!root || !Number.isInteger(milliseconds) || milliseconds < 1 || milliseconds > 30_000
    || typeof intake.capture !== 'function' || typeof intake.confirm !== 'function') return closed('invalid_configuration')
  const pinnedRoot = root
  const registry = configuration.registry

  async function confirmOnce(reference: V3IntakeReference, budget: V3IngressBudget, uncertainCapture: boolean): Promise<V3ResearchIngressResult> {
    const stopped = budget.stopped()
    if (stopped) return uncertainCapture ? unconfirmed(reference) : unavailable(stopped)
    let reply: V3IntakeResult | null = null
    try { reply = intakeReply(await intake.confirm(reference, budget.signal), reference) } catch { /* settled unknown reply */ }
    if (budget.stopped()) return unconfirmed(reference)
    if (reply?.status === 'recorded') return reply
    if (reply?.status === 'collision') return Object.freeze({ status: 'collision' })
    // Only an explicit read-only confirmation may report definite absence. An
    // uncertain capture is never reclassified as safe-to-retry on a missing row.
    if (!uncertainCapture && reply?.status === 'not_attempted') return Object.freeze({ status: 'not_attempted' })
    return unconfirmed(reference)
  }

  return Object.freeze({
    async deliver(input: unknown, external?: AbortSignal): Promise<V3ResearchIngressResult> {
      const parsed = delivery(input)
      if (!parsed) return Object.freeze({ status: 'rejected', reason: 'invalid_delivery' })
      const budget = scope(milliseconds, external)
      try {
        const read = await readV3ResearchFile(pinnedRoot, parsed.fileName, budget)
        if (read.status !== 'read') return read
        const stopped = budget.stopped(); if (stopped) return unavailable(stopped)
        const upload = readV3ProposalUpload(read.text, registry)
        if (!upload.ok) return Object.freeze({ status: 'rejected', reason: upload.reason })
        const { proposal, digest, bytes } = upload.value
        if (proposal.operationId !== parsed.binding.operationId || proposal.jobId !== parsed.binding.jobId
          || proposal.contextKey !== parsed.binding.contextKey) return Object.freeze({ status: 'rejected', reason: 'binding_mismatch' })
        const reference = readV3IntakeReference({ binding: parsed.binding, proposalDigest: digest, bytes })
        if (!reference.ok) return Object.freeze({ status: 'rejected', reason: 'invalid_reference' })
        const beforeCapture = budget.stopped(); if (beforeCapture) return unavailable(beforeCapture)
        let reply: V3IntakeResult | null = null
        try { reply = intakeReply(await intake.capture(read.text, parsed.binding, budget.signal), reference.value) }
        catch { /* Awaited capture has settled; same-operation confirmation is safe. */ }
        if (budget.stopped()) return unconfirmed(reference.value)
        if (reply?.status === 'recorded' || reply?.status === 'rejected') return reply
        if (reply?.status === 'collision' || reply?.status === 'not_attempted') return Object.freeze({ status: reply.status })
        // One confirm, only after settled capture. No retry, new operation or ledger.
        return await confirmOnce(reference.value, budget, true)
      } catch { return unavailable(budget.stopped() ?? 'intake_unavailable') }
      finally { budget.dispose() }
    },
    async confirm(value: unknown, external?: AbortSignal): Promise<V3ResearchIngressResult> {
      const reference = readV3IntakeReference(value)
      if (!reference.ok) return Object.freeze({ status: 'rejected', reason: 'invalid_reference' })
      const budget = scope(milliseconds, external)
      try { return await confirmOnce(reference.value, budget, false) }
      finally { budget.dispose() }
    },
  })
}
