// Dormant fictional-local contract. No application adapter or stored capability.
import 'server-only'
import { immutable, ownRecord } from '../../../lib/readiness/official-truth-autonomous-provenance-artifact'
import { verifyLocalIntegratedPilotBundle, type LocalIntegratedPilotEnvelope } from '../../../lib/readiness/official-truth-integrated-pilot-bundle'
import { prepareOriginals, type Cursor, type PreparedOriginals } from '../official-truth-original-custody-1/storage'
import { persistedCanonicalReadContract } from '../official-truth-persisted-canonical-read-1/contract'

// The existing SQL/transport/commit/reader deadlines remain unchanged. 120s
// bounds the entire new operation, including at most 60s for the frozen reader.
export const ATOMIC_REFRESH_LIMITS = Object.freeze({ operationMs: 120_000, producerExitMs: 2_000, producerPollMs: 20 })
export const ATOMIC_REFRESH_ROLE = 'ot_original_refresh'
export const ATOMIC_REFRESH_LOGIN = 'ot_original_test_refresher'
export const ATOMIC_REFRESH_COMMON = immutable({ authority: 'synthetic-local-review-v1' as const,
  productionAcceptedRead: 'NOT_AUTHORIZED' as const, positiveRealVisaCells: 0 as const, reusablePositiveCache: false as const })
export type AtomicRefreshRequest = Readonly<{
  mode: 'primary' | 'composed'; expectedPredecessor: string; envelope: LocalIntegratedPilotEnvelope;
  bodies: readonly Uint8Array[]; reviewId: string; witness: Cursor;
}>
export type OwnedAtomicRefreshRequest = Readonly<{
  contract: ReturnType<typeof persistedCanonicalReadContract>; expectedPredecessor: string;
  prepared: PreparedOriginals; reviewId: string; witness: Cursor;
}>

/** Synchronous ownership barrier: no caller byte/array/record is retained. */
export function ownAtomicRefreshRequest(input: unknown): OwnedAtomicRefreshRequest {
  const row = ownRecord(input, ['mode', 'expectedPredecessor', 'envelope', 'bodies', 'reviewId', 'witness'])
  if (!row || typeof row.expectedPredecessor !== 'string' || !/^ot-provenance-v1:[a-f0-9]{64}$/.test(row.expectedPredecessor)
    || typeof row.reviewId !== 'string' || !/^[a-f0-9]{8}-[a-f0-9]{4}-[a-f0-9]{4}-[a-f0-9]{4}-[a-f0-9]{12}$/.test(row.reviewId)) throw Error('refresh_context_invalid')
  const contract = persistedCanonicalReadContract(row.mode)
  const witness = ownRecord(row.witness, ['sequence', 'eventHash'])
  if (!witness || typeof witness.sequence !== 'string' || !/^(0|[1-9][0-9]{0,4})$/.test(witness.sequence)
    || Number(witness.sequence) > 99_998 || typeof witness.eventHash !== 'string' || !/^[a-f0-9]{64}$/.test(witness.eventHash)) throw Error('refresh_context_invalid')
  const bodies = row.bodies
  if (!Array.isArray(bodies) || bodies.length !== contract.items.length
    || Reflect.ownKeys(bodies).length !== bodies.length + 1) throw Error('refresh_context_invalid')
  for (let i = 0; i < bodies.length; i++) {
    const d = Object.getOwnPropertyDescriptor(bodies, String(i))
    if (!d || !('value' in d) || !d.enumerable) throw Error('refresh_context_invalid')
  }
  // prepareOriginals verifies the full supplied closure and owns all receipt,
  // custody, artifact and original bytes. Re-verify that owned snapshot too.
  const prepared = prepareOriginals(row.envelope as LocalIntegratedPilotEnvelope, bodies)
  const checked = verifyLocalIntegratedPilotBundle(prepared.envelope)
  if (!checked.ok || prepared.envelope.bundle.recordFingerprint === row.expectedPredecessor) throw Error('refresh_context_invalid')
  return Object.freeze({ contract, expectedPredecessor: row.expectedPredecessor, prepared, reviewId: row.reviewId,
    witness: Object.freeze({ sequence: witness.sequence, eventHash: witness.eventHash }) })
}
