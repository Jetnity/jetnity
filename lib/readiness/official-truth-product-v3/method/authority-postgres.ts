// Dormant, code-owned method observation. No database construction or runtime activation.
import 'server-only'
import { performance } from 'node:perf_hooks'
import { ownRecord } from '@/lib/readiness/official-truth-autonomous-provenance-artifact'
import type { V3MethodAuthorityPort, V3MethodRef } from '../contract'
import { MA1_LIMITS, readMa1CurrentRequest, readMa1CurrentRows, readMa1FixedBinding,
  type Ma1CurrentRequest, type Ma1CurrentRow, type Ma1MethodBinding } from './contract'

export const MA1_READ_CURRENT_SQL = `SELECT status, method_id, revision, method_digest, package_digest,
       epoch, approval_mode, approval_until, observed_at, remaining_ms
FROM official_v3_method_api.read_current_v1(
  $1::text,$2::integer,$3::text,$4::text,$5::text)`

/** readCurrent must own and join acquisition, SQL, abort and all per-call cleanup.
 * A resolved/rejected promise means terminal settlement, never merely abort requested.
 * No arbitrary SQL, target, connection or product-selected role crosses this seam. */
export interface Ma1MethodSqlExecutor {
  readCurrent(request: Ma1CurrentRequest, signal: AbortSignal): Promise<
    Readonly<{ status: 'rows'; rows: unknown }> | Readonly<{ status: 'unavailable' }>>
}
declare const opaqueReceipt: unique symbol
export type Ma1MethodReceipt = Readonly<{ [opaqueReceipt]: true }>
type Held = { binding: Ma1MethodBinding; epoch: number; observedAt: string; deadline: number }
type Observation = Readonly<{ row: Ma1CurrentRow | null; aborted: boolean }>

/** One finite immutable tuple, same-instance custody and four actual in-flight reads. */
export function createV3PostgresMethodAuthority(bindingInput: Ma1MethodBinding, executor: Ma1MethodSqlExecutor | null): V3MethodAuthorityPort<Ma1MethodReceipt> {
  const configured = readMa1FixedBinding(bindingInput)
  const receipts = new WeakMap<Ma1MethodReceipt, Held>()
  let active = 0
  let read: Ma1MethodSqlExecutor['readCurrent'] | null = null
  try {
    const candidate = executor?.readCurrent
    if (typeof candidate === 'function') read = (request, signal) => Reflect.apply(candidate, executor, [request, signal])
  } catch { /* Invalid code-owned configuration has no positive path. */ }

  function requestFor(methodInput: V3MethodRef, checkedAt: string): Ma1CurrentRequest | null {
    try {
      if (!configured.ok) return null
      const method = ownRecord(methodInput, ['methodId', 'revision'])
      if (!method || method.methodId !== configured.value.methodId || method.revision !== configured.value.revision) return null
      const result = readMa1CurrentRequest({ ...configured.value, checkedAt })
      return result.ok ? result.value : null
    } catch { return null }
  }

  async function observe(request: Ma1CurrentRequest, deadline: number): Promise<Observation> {
    if (!configured.ok || !read || active >= MA1_LIMITS.activeReads || performance.now() >= deadline) return { row: null, aborted: false }
    active++
    const controller = new AbortController()
    const timer = setTimeout(() => controller.abort(), Math.max(0, deadline - performance.now()))
    try {
      // Deliberately no race: a timeout cannot detach the executor or release its slot.
      const raw: unknown = await read(request, controller.signal)
      const unavailable = ownRecord(raw, ['status'])
      if (unavailable?.status === 'unavailable') return { row: null, aborted: controller.signal.aborted }
      const envelope = ownRecord(raw, ['status', 'rows'])
      if (!envelope || envelope.status !== 'rows') return { row: null, aborted: controller.signal.aborted }
      const decoded = readMa1CurrentRows(envelope.rows, configured.value, request.checkedAt)
      return { row: decoded.ok ? decoded.value : null, aborted: controller.signal.aborted }
    } catch { return { row: null, aborted: controller.signal.aborted } }
    finally {
      clearTimeout(timer)
      active-- // The real executor promise and its strict result decoding have settled.
    }
  }

  return Object.freeze({
    async resolveCurrent(method: V3MethodRef, checkedAt: string) {
      const start = performance.now(), request = requestFor(method, checkedAt)
      if (!request || !configured.ok) return { status: 'unavailable' as const }
      const observed = await observe(request, start + MA1_LIMITS.receiptMs)
      if (!observed.row || observed.aborted || performance.now() >= start + MA1_LIMITS.receiptMs) return { status: 'unavailable' as const }
      if (observed.row.status === 'binding_mismatch') return { status: 'unavailable' as const }
      if (observed.row.status !== 'approved') return { status: 'not_approved' as const }
      const deadline = Math.min(start + MA1_LIMITS.receiptMs, start + observed.row.remainingMs)
      if (performance.now() >= deadline) return { status: 'unavailable' as const }
      const receipt = Object.freeze({}) as Ma1MethodReceipt
      receipts.set(receipt, { binding: configured.value,
        epoch: observed.row.epoch, observedAt: observed.row.observedAt, deadline })
      return { status: 'approved' as const, receipt }
    },
    async reproveAtCommit(receipt: Ma1MethodReceipt, method: V3MethodRef, checkedAt: string) {
      const start = performance.now(), request = requestFor(method, checkedAt)
      if (!request || !receipt || typeof receipt !== 'object') return { status: 'unavailable' as const }
      const held = receipts.get(receipt)
      if (!held) return { status: 'unavailable' as const }
      if (start >= held.deadline) return { status: 'expired' as const }
      const observed = await observe(request, Math.min(start + MA1_LIMITS.receiptMs, held.deadline))
      const row = observed.row
      if (!row) return { status: performance.now() >= held.deadline ? 'expired' as const : 'unavailable' as const }
      if (row.status === 'binding_mismatch') return { status: 'unavailable' as const }
      if (row.status === 'different_revision' || row.status === 'revoked'
        || ((row.status === 'approved' || row.status === 'expired') && row.epoch !== held.epoch)) return { status: 'revoked' as const }
      if (row.status === 'absent' || row.status === 'draft') return { status: 'unavailable' as const }
      // held is the same mutable metadata object for every overlapping reproof.
      // Read its latest deadline only AFTER real drain; never overwrite with a captured older value.
      held.deadline = Math.min(held.deadline, start + MA1_LIMITS.receiptMs, start + row.remainingMs)
      if (performance.now() >= held.deadline || row.status === 'expired') return { status: 'expired' as const }
      if (observed.aborted) return { status: 'unavailable' as const }
      return { status: 'current' as const }
    },
  })
}
