import 'server-only'
import { ownRecord, immutable } from '@/lib/readiness/official-truth-autonomous-provenance-artifact'
import { schema2Kanonisch } from '@/lib/readiness/regulierungs-anwendbarkeit'
import type { QuellenRegistry } from '@/lib/readiness/source-registry'
import { createV3WorkIdentity, readV3ResearchProposal } from '../contract'
import type { V3ProposalUpload } from '../import/interface'
import type { V3ImportQuarantinePort, V3ImportOutcome, V3ImportAudit } from '../import/service-server'
import { readV3IntakeBinding, readV3IntakeReference, type V3IntakeBinding, type V3IntakeReference, type V3IntakeResult } from './intake-contract'
import { readV3RetainableProposal } from './proposal-bytes'
import { readV3QuarantineCompletion, type V3DecodedCompletion } from './quarantine-codec'

/**
 * Connection ownership is explicit. The reviewed adapter must use a bounded
 * owned transaction, parameter binding, cancellation and complete resource drain.
 * acknowledged means the actual transaction was ACKed, not just a query result
 * from an open transaction. A lost reply/abort after dispatch is unconfirmed.
 * There is deliberately no environment connection or production implementation.
 */
export interface V3IntakeSqlExecutor {
  execute(statement: string, parameters: readonly (string | number)[], signal: AbortSignal): Promise<
    { status: 'acknowledged'; rows: readonly Readonly<Record<string, string | null>>[] }
    | { status: 'unavailable' | 'unconfirmed' }>
}
export type V3StoredProposal = Readonly<{
  reference: V3IntakeReference; text: string; upload: V3ProposalUpload; completion: V3DecodedCompletion | null;
}>
export type V3IntakeReadResult =
  | Readonly<{ status: 'recorded'; record: V3StoredProposal }>
  | Readonly<{ status: 'not_attempted' | 'collision' | 'unconfirmed' | 'unavailable' }>
const same = (a: unknown, b: unknown): boolean => schema2Kanonisch(a) === schema2Kanonisch(b)
const signalOrNew = (signal?: AbortSignal) => signal ?? new AbortController().signal

function stored(value: unknown, expected: V3IntakeReference, registry: QuellenRegistry): V3StoredProposal | null {
  const row = ownRecord(value, ['reference', 'text', 'outcome', 'audit'])
  if (!row || typeof row.text !== 'string') return null
  const reference = readV3IntakeReference(row.reference), upload = readV3RetainableProposal(row.text, registry)
  if (!reference.ok || !same(reference.value, expected) || !upload.ok
    || upload.value.digest !== expected.proposalDigest || upload.value.bytes !== expected.bytes
    || upload.value.proposal.operationId !== expected.binding.operationId || upload.value.proposal.jobId !== expected.binding.jobId
    || upload.value.proposal.contextKey !== expected.binding.contextKey) return null
  if (row.outcome === null || row.audit === null) {
    return row.outcome === null && row.audit === null ? immutable({ reference: reference.value, text: row.text, upload: upload.value, completion: null }) : null
  }
  const completion = readV3QuarantineCompletion(row.outcome, row.audit, upload.value, expected.binding, registry)
  return completion.ok ? immutable({ reference: reference.value, text: row.text, upload: upload.value, completion: completion.value }) : null
}

/** Fixed SQL + immutable operation binding. No user-defined SQL or table names. */
export function createV3PostgresQuarantineBackend(registry: QuellenRegistry, executor: V3IntakeSqlExecutor | null, leaseMilliseconds: number) {
  const configured = Number.isInteger(leaseMilliseconds) && leaseMilliseconds >= 1 && leaseMilliseconds <= 900_000
  async function call(statement: string, parameters: readonly (string | number)[], signal: AbortSignal): Promise<unknown> {
    if (!executor || !configured || signal.aborted) return { status: 'unavailable' }
    try {
      const reply = await executor.execute(statement, parameters, signal)
      if (signal.aborted) return { status: 'unconfirmed' }
      if (reply.status !== 'acknowledged') return { status: reply.status === 'unavailable' ? 'unavailable' : 'unconfirmed' }
      if (reply.rows.length !== 1) return { status: 'unconfirmed' }
      const row = ownRecord(reply.rows[0], ['result'])
      if (!row || typeof row.result !== 'string' || row.result.length > 1_048_576
        || new TextEncoder().encode(row.result).byteLength > 1_048_576) return { status: 'unconfirmed' }
      return JSON.parse(row.result) as unknown
    } catch { return { status: 'unconfirmed' } }
  }
  const parameters = (reference: V3IntakeReference) => [JSON.stringify(reference.binding), reference.proposalDigest, reference.bytes] as const
  function readReply(raw: unknown, reference: V3IntakeReference): V3IntakeReadResult {
    const state = ownRecord(raw, ['status'])
    if (state && typeof state.status === 'string') {
      const status = state.status
      if (status === 'not_attempted' || status === 'collision' || status === 'unavailable' || status === 'unconfirmed') return { status }
    }
    const success = ownRecord(raw, ['status', 'record'])
    if (!success || success.status !== 'recorded') return { status: 'unconfirmed' }
    const record = stored(success.record, reference, registry)
    return record ? { status: 'recorded', record } : { status: 'unconfirmed' }
  }
  async function read(referenceInput: V3IntakeReference, signal: AbortSignal): Promise<V3IntakeReadResult> {
    const checked = readV3IntakeReference(referenceInput)
    if (!checked.ok) return { status: 'unavailable' }
    const raw = await call('SELECT official_v3_intake_api.read_v1($1::jsonb,$2::text,$3::integer) AS result', parameters(checked.value), signal)
    return readReply(raw, checked.value)
  }
  async function capture(text: unknown, referenceInput: V3IntakeReference, signal: AbortSignal): Promise<V3IntakeResult> {
    // This exported seam is independently closed. Bypassing intake-server never
    // lets duplicate members, unknown nested fields or mismatched bytes reach SQL.
    const checked = readV3IntakeReference(referenceInput)
    if (!checked.ok) return { status: 'rejected', reason: 'invalid_binding' }
    const parsed = readV3RetainableProposal(text, registry)
    if (!parsed.ok || typeof text !== 'string') return { status: 'rejected', reason: parsed.ok ? 'invalid_upload' : parsed.reason }
    const reference = checked.value, proposal = parsed.value.proposal
    const identity = createV3WorkIdentity({ context: proposal.context, method: reference.binding.method,
      factKind: proposal.research.factKind, researchReason: proposal.research.researchReason })
    if (!identity.ok || identity.value.contextKey !== reference.binding.contextKey
      || proposal.operationId !== reference.binding.operationId || proposal.jobId !== reference.binding.jobId
      || proposal.contextKey !== reference.binding.contextKey || parsed.value.digest !== reference.proposalDigest
      || parsed.value.bytes !== reference.bytes) return { status: 'rejected', reason: 'binding_mismatch' }
    const raw = await call('SELECT official_v3_intake_api.capture_v1($1::jsonb,$2::text,$3::text) AS result',
      [JSON.stringify(reference.binding), text, reference.proposalDigest], signal)
    const readback = readReply(raw, reference)
    return readback.status === 'recorded' ? { status: 'recorded', reference: readback.record.reference } : { status: readback.status }
  }
  function quarantine(bindingInput: V3IntakeBinding): V3ImportQuarantinePort<object> {
    const parsedBinding = readV3IntakeBinding(bindingInput)
    const tickets = new WeakMap<object, { record: V3StoredProposal; generation: number; token: string }>()
    return Object.freeze({
      async reserve(upload: V3ProposalUpload, signal: AbortSignal) {
        if (!parsedBinding.ok || signal.aborted) return { status: 'unavailable' as const }
        const row = ownRecord(upload, ['proposal', 'digest', 'bytes'])
        if (!row) return { status: 'unavailable' as const }
        const proposal = readV3ResearchProposal(row.proposal, registry)
        if (!proposal.ok) return { status: 'unavailable' as const }
        const ref = readV3IntakeReference({ binding: parsedBinding.value, proposalDigest: row.digest, bytes: row.bytes })
        if (!ref.ok) return { status: 'unavailable' as const }
        const original = await read(ref.value, signal)
        if (original.status === 'collision') return { status: 'collision' as const }
        if (original.status !== 'recorded' || signal.aborted) return { status: 'unavailable' as const }
        if (!same(original.record.upload.proposal, proposal.value)) return { status: 'collision' as const }
        const raw = await call('SELECT official_v3_intake_api.reserve_v1($1::jsonb,$2::text,$3::integer,$4::integer) AS result',
          [...parameters(ref.value), leaseMilliseconds], signal)
        const state = ownRecord(raw, ['status'])
        if (state?.status === 'collision') return { status: 'collision' as const }
        if (state?.status === 'busy') return { status: 'busy' as const }
        if (state?.status === 'unavailable' || state?.status === 'not_attempted') return { status: 'unavailable' as const }
        const completed = ownRecord(raw, ['status', 'record'])
        if (completed?.status === 'completed') {
          const record = stored(completed.record, ref.value, registry)
          if (record?.completion) return { status: 'completed' as const, outcome: record.completion.outcome }
          throw Error('intake_reservation_unconfirmed')
        }
        const acquired = ownRecord(raw, ['status', 'generation', 'leaseToken', 'acquiredAt', 'expiresAt', 'record'])
        if (!acquired || acquired.status !== 'acquired' || typeof acquired.generation !== 'number'
          || !Number.isInteger(acquired.generation) || acquired.generation < 1 || acquired.generation > 2_147_483_646
          || typeof acquired.leaseToken !== 'string' || !/^[a-f0-9]{8}(?:-[a-f0-9]{4}){3}-[a-f0-9]{12}$/.test(acquired.leaseToken)
          || typeof acquired.acquiredAt !== 'string' || typeof acquired.expiresAt !== 'string') throw Error('intake_reservation_unconfirmed')
        const start = Date.parse(acquired.acquiredAt), end = Date.parse(acquired.expiresAt)
        if (!Number.isFinite(start) || !Number.isFinite(end) || end <= start || end - start !== leaseMilliseconds
          || new Date(start).toISOString() !== acquired.acquiredAt || new Date(end).toISOString() !== acquired.expiresAt) throw Error('intake_reservation_unconfirmed')
        const record = stored(acquired.record, ref.value, registry)
        if (!record || record.completion !== null || signal.aborted) throw Error('intake_reservation_unconfirmed')
        const ticket = Object.freeze({})
        tickets.set(ticket, { record, generation: acquired.generation, token: acquired.leaseToken })
        return { status: 'acquired' as const, ticket }
      },
      async finish(ticket: object, outcome: V3ImportOutcome, audit: V3ImportAudit, signal: AbortSignal) {
        const held = tickets.get(ticket)
        if (!held || signal.aborted) return { status: 'unconfirmed' as const }
        tickets.delete(ticket) // One attempt; unknown must use same-operation confirm.
        const completion = readV3QuarantineCompletion(outcome, audit, held.record.upload, held.record.reference.binding, registry)
        if (!completion.ok) return { status: 'unconfirmed' as const }
        const raw = await call('SELECT official_v3_intake_api.finish_v1($1::jsonb,$2::text,$3::integer,$4::integer,$5::uuid,$6::jsonb,$7::jsonb) AS result',
          [...parameters(held.record.reference), held.generation, held.token, JSON.stringify(completion.value.outcome), JSON.stringify(completion.value.audit)], signal)
        const result = ownRecord(raw, ['status'])
        return { status: !signal.aborted && result?.status === 'recorded' ? 'recorded' as const : 'unconfirmed' as const }
      },
    })
  }
  return Object.freeze({ capture, read, quarantine,
    async confirmImport(reference: V3IntakeReference, signal = signalOrNew()) {
      const result = await read(reference, signal)
      return result.status === 'recorded'
        ? result.record.completion ? { status: 'completed' as const, ...result.record.completion } : { status: 'pending' as const }
        : { status: result.status }
    },
  })
}
