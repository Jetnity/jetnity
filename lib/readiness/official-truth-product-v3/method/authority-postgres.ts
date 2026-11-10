// Dormant, code-owned method observation. No database construction or runtime activation.
import 'server-only'
import { performance } from 'node:perf_hooks'
import { ownRecord } from '@/lib/readiness/official-truth-autonomous-provenance-artifact'
import type { V3MethodAuthorityPort, V3MethodRef } from '../contract'
import { M04_LIMITS, readM04NativeReply, type M04Config, type M04Facade, type M04FixedOperation,
  type M04FixedRequest, type M04NativeReply } from '../jobs/contract'
import { createM04LanePool, createM04InvocationScope } from '../jobs/owned-scope'
import { composeM04Invocation } from '../jobs/composition'
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
type Held = { binding: Ma1MethodBinding; epoch: number; observedAt: string; deadline: number;
  dbCap?: number; busy?: 'observation' | 'effect' | null }
type Scope = NonNullable<ReturnType<typeof createM04InvocationScope>>
type Group = 'processing' | 'outer'
type Joint = { scope: Scope; config: M04Config }
type Observation = Readonly<{ row: Ma1CurrentRow | null; aborted: boolean }>

/** One finite immutable tuple, same-instance custody and four actual in-flight reads. */
function authorityCore(bindingInput: Ma1MethodBinding, executor: Ma1MethodSqlExecutor | null, joint?: Joint) {
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

  async function observe(request: Ma1CurrentRequest, deadline: number, group: Group): Promise<Observation> {
    if (!configured.ok || !read || active >= MA1_LIMITS.activeReads || performance.now() >= deadline) return { row: null, aborted: false }
    active++
    const controller = new AbortController()
    const timer = setTimeout(() => controller.abort(), Math.max(0, deadline - performance.now()))
    try {
      // Deliberately no race: a timeout cannot detach the executor or release its slot.
      const owned = joint ? await joint.scope.native('method', group, s => read!(request, s), controller.signal, group === 'outer' && joint.scope.terminalObservation()) : null
      const raw: unknown = joint ? (owned?.ok ? owned.value : { status: 'unavailable' }) : await read(request, controller.signal)
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

  function portFor(group: Group): V3MethodAuthorityPort<Ma1MethodReceipt> { return Object.freeze({
    async resolveCurrent(method: V3MethodRef, checkedAt: string) {
      const start = performance.now(), request = requestFor(method, checkedAt)
      if (!request || !configured.ok) return { status: 'unavailable' as const }
      const observed = await observe(request, start + MA1_LIMITS.receiptMs, group)
      if (!observed.row || observed.aborted || performance.now() >= start + MA1_LIMITS.receiptMs) return { status: 'unavailable' as const }
      if (observed.row.status === 'binding_mismatch') return { status: 'unavailable' as const }
      if (observed.row.status !== 'approved') return { status: 'not_approved' as const }
      const deadline = Math.min(start + MA1_LIMITS.receiptMs, start + observed.row.remainingMs)
      if (performance.now() >= deadline) return { status: 'unavailable' as const }
      const receipt = Object.freeze({}) as Ma1MethodReceipt
      const held: Held = { binding: configured.value, epoch: observed.row.epoch, observedAt: observed.row.observedAt, deadline }
      if (joint && !shrinkCap(held, observed.row)) return { status: 'unavailable' as const }
      receipts.set(receipt, held)
      return { status: 'approved' as const, receipt }
    },
    async reproveAtCommit(receipt: Ma1MethodReceipt, method: V3MethodRef, checkedAt: string) {
      const start = performance.now(), request = requestFor(method, checkedAt)
      if (!request || !receipt || typeof receipt !== 'object') return { status: 'unavailable' as const }
      const held = receipts.get(receipt)
      if (!held) return { status: 'unavailable' as const }
      if (start >= held.deadline) return { status: 'expired' as const }
      if (joint && (held.busy || !joint.scope.admits(group))) return { status: 'unavailable' as const }
      if (joint) held.busy = 'observation'
      try {
      const observed = await observe(request, Math.min(start + MA1_LIMITS.receiptMs, held.deadline), group)
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
      if (observed.aborted || (joint && !shrinkCap(held, row))) return { status: 'unavailable' as const }
      return { status: 'current' as const }
      } finally { if (joint) held.busy = null }
    },
  }) }

  // Private terminal observation mapping: b follows actual drain and the latest Held shrink.
  function shrinkCap(held: Held, row: Ma1CurrentRow): boolean {
    const b = performance.now(), r = Math.floor(held.deadline - b)
    if (r <= 0) return false
    const candidate = Math.min(Date.parse(row.observedAt) + r, row.approvalUntil ? Date.parse(row.approvalUntil) : Infinity)
    if (!Number.isFinite(candidate)) return false
    held.dbCap = Math.min(held.dbCap ?? Infinity, candidate); held.observedAt = row.observedAt
    return true
  }

  const port = portFor('outer'), processingAuthority = portFor('processing')
  function fixedFor(group: Group): M04FixedOperation {
    return async (request, signal, providedReceipt): Promise<M04NativeReply> => {
      if (!joint || !configured.ok || signal.aborted || !joint.scope.admits(group)) return { status: 'unavailable' }
      const isRead = request.operation === 'queue_read' || request.operation === 'queue_confirm' || request.operation === 'execution_read'
      async function execute(phase: 'probe' | 'authorized', receipt?: object): Promise<M04NativeReply> {
        if (!joint || !configured.ok || !joint.scope.admits(group) || signal.aborted) return { status: 'unavailable' }
        const held = receipt ? receipts.get(receipt as Ma1MethodReceipt) : undefined
        if (phase === 'authorized' && (!held || held.busy || !held.dbCap)) return { status: 'unavailable' }
        const deadline = Math.min(joint.scope.deadline, held?.deadline ?? performance.now() + M04_LIMITS.effectMs)
        if (Math.floor(deadline - performance.now()) <= 0) return { status: 'unavailable' }
        if (held) held.busy = 'effect'
        try {
          const operationText = canonical({ ...request, phase })
          if (new TextEncoder().encode(operationText).byteLength > M04_LIMITS.wireBytes) return { status: 'unavailable' }
          const commandCap = request.operation === 'queue_cas' ? Date.parse(request.body.commit.notAfter) : Infinity
          const probeTime = phase === 'probe' ? readMa1CurrentRequest({ ...configured.value, checkedAt: joint.config.clock().now }) : null
          if (phase === 'probe' && !probeTime?.ok) return { status: 'unavailable' }
          const probeCap = probeTime?.ok ? Date.parse(probeTime.value.checkedAt) + Math.floor(deadline - performance.now()) : Infinity
          const cap = Math.min(held?.dbCap ?? probeCap, commandCap)
          if (!Number.isFinite(cap)) return { status: 'unavailable' }
          const fixed = Object.freeze({ ...configured.value, operationText, epoch: held?.epoch ?? null,
            budget: Object.freeze({ deadline }), notAfter: new Date(cap).toISOString() }) as M04FixedRequest
          const executed = await joint.scope.native('jobs', group, async s => {
            if (s.aborted || performance.now() >= deadline) return { status: 'unavailable' as const }
            return joint.config.jobsExecutor.executeFixed(fixed, s)
          }, signal, group === 'outer' && joint.scope.terminalOperation(request))
          if (!executed.ok || executed.value.status !== 'acknowledged') {
            if (!executed.ok || executed.value.status === 'unconfirmed') joint.scope.markAmbiguous()
            return { status: executed.ok && executed.value.status === 'unavailable' ? 'unavailable' : 'unconfirmed' }
          }
          const reply = readM04NativeReply(executed.value.rows, request.operation)
          if (!reply || (phase === 'probe' && !['absent', 'not_attempted', 'collision', 'blocked', 'requires_authority'].includes(reply.status)) || signal.aborted || joint.scope.signal.aborted || performance.now() >= deadline
            || (held && performance.now() >= held.deadline)) { joint.scope.markAmbiguous(); return { status: 'unconfirmed' } }
          return reply
        } catch { joint.scope.markAmbiguous(); return { status: 'unconfirmed' } }
        finally { if (held) held.busy = null }
      }
      if (isRead) { const probe = await execute('probe'); if (probe.status !== 'requires_authority') return probe }
      let receipt = providedReceipt
      if (!receipt) {
        let checkedAt: string
        try { checkedAt = joint.config.clock().now } catch { return { status: 'unavailable' } }
        const current = await (group === 'processing' ? processingAuthority : port).resolveCurrent({ methodId: configured.value.methodId, revision: configured.value.revision }, checkedAt)
        if (current.status !== 'approved') return { status: 'unavailable' }
        receipt = current.receipt
      }
      return execute('authorized', receipt)
    }
  }
  return { port, processingAuthority, fixed: fixedFor('outer'), processingFixed: fixedFor('processing') }
}

function canonical(value: unknown): string {
  if (value === null || typeof value !== 'object') return JSON.stringify(value)
  if (Array.isArray(value)) return `[${value.map(canonical).join(',')}]`
  return `{${Object.keys(value).sort().map(k => `${JSON.stringify(k)}:${canonical((value as Record<string, unknown>)[k])}`).join(',')}}`
}

/** The old two-operation API and overlapping-reproof behavior remain unchanged. */
export function createV3PostgresMethodAuthority(bindingInput: Ma1MethodBinding, executor: Ma1MethodSqlExecutor | null): V3MethodAuthorityPort<Ma1MethodReceipt> {
  return authorityCore(bindingInput, executor).port
}

/** Explicit code-owned dormant composition; no environment or provider construction. */
export function createV3PostgresDurableJobs(input: M04Config): M04Facade {
  const pool = createM04LanePool()
  let config: M04Config | null = null
  try {
    const value = ownRecord(input, ['binding', 'registry', 'clock', 'methodExecutor', 'intakeExecutor', 'jobsExecutor', 'producer', 'evidence', 'history'])
    if (value && typeof value.clock === 'function') {
      const binding = readMa1FixedBinding(value.binding)
      function capture<T>(object: unknown, name: string): T {
        if (!object || typeof object !== 'object') throw Error('invalid_config')
        const d = Object.getOwnPropertyDescriptor(object, name)
        if (!d || !('value' in d) || typeof d.value !== 'function') throw Error('invalid_config')
        const fn = d.value
        return ((...args: unknown[]) => Reflect.apply(fn, object, args)) as T
      }
      if (binding.ok) config = Object.freeze({ binding: binding.value, registry: value.registry as M04Config['registry'],
        clock: value.clock as M04Config['clock'],
        methodExecutor: Object.freeze({ readCurrent: capture<Ma1MethodSqlExecutor['readCurrent']>(value.methodExecutor, 'readCurrent') }),
        intakeExecutor: Object.freeze({ execute: capture<M04Config['intakeExecutor']['execute']>(value.intakeExecutor, 'execute') }),
        jobsExecutor: Object.freeze({ executeFixed: capture<M04Config['jobsExecutor']['executeFixed']>(value.jobsExecutor, 'executeFixed') }),
        producer: Object.freeze({ produce: capture<M04Config['producer']['produce']>(value.producer, 'produce') }),
        evidence: Object.freeze({ inspect: capture<M04Config['evidence']['inspect']>(value.evidence, 'inspect'),
          reprove: capture<M04Config['evidence']['reprove']>(value.evidence, 'reprove') }),
        history: Object.freeze({ read: capture<M04Config['history']['read']>(value.history, 'read'),
          reprove: capture<M04Config['history']['reprove']>(value.history, 'reprove') }) })
    }
  } catch { config = null }
  async function invoke(kind: 'enqueueRule' | 'enqueueDiscovery' | 'workOnce', raw: unknown, signal?: AbortSignal) {
    if (!config || signal?.aborted) return { status: 'unavailable' as const }
    const scope = createM04InvocationScope(pool, kind === 'workOnce' ? 30000 : 5000, signal)
    if (!scope) return { status: 'unavailable' as const }
    try {
      const core = authorityCore(config.binding, config.methodExecutor, { scope, config })
      const composition = composeM04Invocation({ config, scope, authority: core.port, processingAuthority: core.processingAuthority,
        fixed: core.fixed, processingFixed: core.processingFixed })
      const result = await composition[kind](raw, scope.signal)
      await scope.drainNative()
      return scope.signal.aborted || performance.now() >= scope.deadline || scope.snapshot().activeCallbacks > 0 ? { status: 'unconfirmed' as const } : result
    } catch { return { status: 'unconfirmed' as const } } finally { await scope.finish() }
  }
  return Object.freeze<M04Facade>({
    enqueueRule: (raw, signal) => invoke('enqueueRule', raw, signal) as ReturnType<M04Facade['enqueueRule']>,
    enqueueDiscovery: (raw, signal) => invoke('enqueueDiscovery', raw, signal) as ReturnType<M04Facade['enqueueDiscovery']>,
    workOnce: (raw, signal) => invoke('workOnce', raw, signal) as ReturnType<M04Facade['workOnce']>,
  })
}
