// Untrusted proposal custody only. Identities and digests are not authority.
import { immutable, ownRecord } from '@/lib/readiness/official-truth-autonomous-provenance-artifact'
import { OFFICIAL_TRUTH_V3_LIMITS, type V3MethodRef, type V3ReadResult } from '../contract'

export type V3IntakeBinding = Readonly<{
  schema: 3; kind: 'proposal_intake_binding';
  operationId: string; jobId: string; contextKey: string;
  method: V3MethodRef;
  runnerId: string; deliveryId: string;
  /** Runner-selected immutable delivery identity, NOT self-authenticating Git proof. */
  inputRevision: string;
}>
export type V3IntakeReference = Readonly<{
  binding: V3IntakeBinding; proposalDigest: string; bytes: number;
}>
export type V3IntakeResult =
  | Readonly<{ status: 'recorded'; reference: V3IntakeReference }>
  | Readonly<{ status: 'rejected'; reason: 'invalid_upload' | 'bound_exceeded' | 'invalid_proposal' | 'invalid_binding' | 'binding_mismatch' }>
  | Readonly<{ status: 'collision' | 'not_attempted' | 'unconfirmed' | 'unavailable' }>

/** One shared entry for all researcher delivery transports. No approval API. */
export interface V3ProposalIntakePort {
  capture(text: unknown, binding: V3IntakeBinding, signal: AbortSignal): Promise<V3IntakeResult>
  /** Confirm the SAME operation/binding/digest after an uncertain response. */
  confirm(reference: V3IntakeReference, signal: AbortSignal): Promise<V3IntakeResult>
}

const failure = (): V3ReadResult<never> => Object.freeze({ ok: false, reason: 'invalid_contract' })
const matches = (value: unknown, pattern: RegExp): value is string => typeof value === 'string' && pattern.test(value)

/** Closed own-data reader; no getters, coercion, unknown fields or caller mutation. */
export function readV3IntakeBinding(value: unknown): V3ReadResult<V3IntakeBinding> {
  try {
    const row = ownRecord(value, ['schema', 'kind', 'operationId', 'jobId', 'contextKey', 'method', 'runnerId', 'deliveryId', 'inputRevision'])
    if (!row || row.schema !== 3 || row.kind !== 'proposal_intake_binding') return failure()
    const method = ownRecord(row.method, ['methodId', 'revision'])
    if (!method || !matches(method.methodId, /^[a-z][a-z0-9_-]{1,63}$/)
      || typeof method.revision !== 'number' || !Number.isInteger(method.revision)
      || method.revision < 1 || method.revision > 2_147_483_647) return failure()
    if (!matches(row.operationId, /^op3_[a-f0-9]{32}$/)
      || !matches(row.jobId, /^job3_[a-f0-9]{32}$/)
      || !matches(row.contextKey, /^official-truth-context:v3:[a-f0-9]{64}$/)
      || !matches(row.runnerId, /^runner3_[a-f0-9]{32}$/)
      || !matches(row.deliveryId, /^delivery3_[a-f0-9]{32}$/)
      || !matches(row.inputRevision, /^(?:git:[a-f0-9]{40}|snapshot:[a-f0-9]{64})$/)) return failure()
    return Object.freeze({ ok: true, value: immutable<V3IntakeBinding>({ schema: 3, kind: 'proposal_intake_binding',
      operationId: row.operationId, jobId: row.jobId, contextKey: row.contextKey,
      method: { methodId: method.methodId, revision: method.revision },
      runnerId: row.runnerId, deliveryId: row.deliveryId, inputRevision: row.inputRevision }) })
  } catch { return failure() }
}

export function readV3IntakeReference(value: unknown): V3ReadResult<V3IntakeReference> {
  try {
    const row = ownRecord(value, ['binding', 'proposalDigest', 'bytes'])
    if (!row) return failure()
    const binding = readV3IntakeBinding(row.binding)
    if (!binding.ok || !matches(row.proposalDigest, /^[a-f0-9]{64}$/)
      || typeof row.bytes !== 'number' || !Number.isInteger(row.bytes)
      || row.bytes < 1 || row.bytes > OFFICIAL_TRUTH_V3_LIMITS.payloadBytes) return failure()
    return Object.freeze({ ok: true, value: immutable({ binding: binding.value, proposalDigest: row.proposalDigest, bytes: row.bytes }) })
  } catch { return failure() }
}
