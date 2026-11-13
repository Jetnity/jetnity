// Dormant, code-owned method observation. No database construction or runtime activation.
import 'server-only'
import { performance } from 'node:perf_hooks'
import { ownRecord } from '@/lib/readiness/official-truth-autonomous-provenance-artifact'
import { createV3WorkIdentity, createV3CombinationDiscoveryIdentity, type V3MethodAuthorityPort, type V3MethodRef } from '../contract'
import { M04_LIMITS, readM04NativeReply, type M04Config, type M04Facade, type M04FixedOperation,
  type M04FixedRequest, type M04NativeReply } from '../jobs/contract'
import { createM04LanePool, createM04InvocationScope } from '../jobs/owned-scope'
import { composeM04Invocation } from '../jobs/composition'
import { composeHrs1Invocation, type Hrs1Facade } from '../result/composition'
import { HRS1_LIMITS, hrs1PublicReadMilliseconds, hrs1Canonical, hrs1Clock, hrs1Hash, hrs1Same, hrs1Time, hrs1Channel,
  readHrs1Binding, readHrs1Command, readHrs1Reply, type Hrs1Binding, type Hrs1Config,
  type Hrs1FixedOperation, type Hrs1FixedRequest, type Hrs1TerminalExecutor } from '../result/contract'
import type { Hrs1SourceCustodyIssuer } from '../result/source-proof'
import { MA1_LIMITS, readMa1CurrentRequest, readMa1CurrentRows, readMa1FixedBinding,
  type Ma1CurrentRequest, type Ma1CurrentRow, type Ma1MethodBinding } from './contract'

export const MA1_READ_CURRENT_SQL = `SELECT status, method_id, revision, method_digest, package_digest,
       epoch, approval_mode, approval_until, observed_at, remaining_ms
FROM official_v3_method_api.read_current_v1(
  $1::text,$2::integer,$3::text,$4::text,$5::text)`

/** readCurrent must own and join acquisition, SQL, abort and all per-call cleanup.
 * Existing rows/unavailable outcomes retain terminal settlement, never merely abort requested.
 * blocked_remote_unknown is the sole explicit exception: all local children are
 * joined/closed, remote completion is unproved and the physical pair stays poisoned.
 * No arbitrary SQL, target, connection or product-selected role crosses this seam. */
export interface Ma1MethodSqlExecutor {
  readCurrent(request: Ma1CurrentRequest, signal: AbortSignal, budget?: Readonly<{ deadline: number }>): Promise<
    Readonly<{ status: 'rows'; rows: unknown }> | Readonly<{ status: 'unavailable' }>
    | Readonly<{ status: 'blocked_remote_unknown' }>>
}
declare const opaqueReceipt: unique symbol
export type Ma1MethodReceipt = Readonly<{ [opaqueReceipt]: true }>
type Held = { binding: Ma1MethodBinding; epoch: number; observedAt: string; deadline: number;
  dbCap?: number; busy?: 'observation' | 'effect' | null }
type Scope = NonNullable<ReturnType<typeof createM04InvocationScope>>
type Group = 'processing' | 'outer'
type ResultJoint = { config: Hrs1Config; binding: Hrs1Binding; shared: { active: number }; calls: number }
type Joint = { scope: Scope; config: M04Config; result?: ResultJoint; callCap?: number }
type Observation = Readonly<{ row: Ma1CurrentRow | null; aborted: boolean }>

/** One finite immutable tuple, same-instance custody and four actual in-flight reads. */
function authorityCore(bindingInput: Ma1MethodBinding, executor: Ma1MethodSqlExecutor | null, joint?: Joint) {
  const configured = readMa1FixedBinding(bindingInput)
  const receipts = new WeakMap<Ma1MethodReceipt, Held>()
  let active = 0
  let read: Ma1MethodSqlExecutor['readCurrent'] | null = null
  try {
    const candidate = executor?.readCurrent
    if (typeof candidate === 'function') read = (request, signal, budget) => Reflect.apply(candidate, executor, [request, signal, budget])
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
    deadline = Math.min(deadline, joint?.scope.deadline ?? Infinity, joint?.callCap ?? Infinity)
    const budget = Object.freeze({ deadline })
    if (!configured.ok || !read || active >= MA1_LIMITS.activeReads || performance.now() >= deadline) return { row: null, aborted: false }
    active++
    const controller = new AbortController()
    const timer = setTimeout(() => controller.abort(), Math.max(0, deadline - performance.now()))
    try {
      // Deliberately no race: a timeout cannot detach the executor or release its slot.
      const owned = joint ? await joint.scope.native('method', group, s => read!(request, s, budget), controller.signal, group === 'outer' && joint.scope.terminalObservation()) : null
      const raw: unknown = joint ? (owned?.ok ? owned.value : { status: 'unavailable' }) : await read(request, controller.signal, budget)
      const unavailable = ownRecord(raw, ['status'])
      if (unavailable?.status === 'blocked_remote_unknown') {
        joint?.scope.markAmbiguous()
        return { row: null, aborted: controller.signal.aborted }
      }
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
        const deadline = Math.min(joint.scope.deadline, joint.callCap ?? Infinity, held?.deadline ?? performance.now() + M04_LIMITS.effectMs)
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
            if (!executed.ok || executed.value.status === 'unconfirmed' || executed.value.status === 'blocked_remote_unknown') joint.scope.markAmbiguous()
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

  function resultFixedFor(group: Group): Hrs1FixedOperation {
    return async (input, signal, providedReceipt, requestedNotAfter) => {
      const selected = joint?.result
      if (!joint || !selected || !configured.ok || signal.aborted || !joint.scope.admits(group)
        || selected.calls >= HRS1_LIMITS.fixedCalls) return { status: 'unavailable' }
      selected.calls++
      const command = readHrs1Command(input, selected.binding)
      if (!command || requestedNotAfter !== undefined && !hrs1Time(requestedNotAfter)) return { status: 'unavailable' }
      let clock: ReturnType<M04Config['clock']>
      try { clock = joint.config.clock() } catch { return { status: 'unavailable' } }
      if (!hrs1Same(clock, hrs1Clock(clock.now, selected.binding.legalTimeZone))) return { status: 'unavailable' }
      let receipt = providedReceipt
      if (!receipt) {
        const current = await (group === 'processing' ? processingAuthority : port).resolveCurrent(
          { methodId: configured.value.methodId, revision: configured.value.revision }, clock.now)
        if (current.status !== 'approved') return { status: 'unavailable' }
        receipt = current.receipt
      }
      const held = receipts.get(receipt as Ma1MethodReceipt)
      if (!held || held.busy || !held.dbCap || selected.shared.active >= HRS1_LIMITS.concurrentEffects
        || signal.aborted || !joint.scope.admits(group)) return { status: 'unavailable' }
      const deadline = Math.min(joint.scope.deadline, joint.callCap ?? Infinity, held.deadline,
        performance.now() + HRS1_LIMITS.effectMilliseconds)
      if (Math.floor(deadline - performance.now()) <= 0) return { status: 'unavailable' }
      // The current civil date is selected by the binding, including DST. This
      // absolute cap also reaches the executor's actual commit-before guard.
      let currentClock: ReturnType<M04Config['clock']>
      try { currentClock = joint.config.clock() } catch { return { status: 'unavailable' } }
      const calendarEnd = selectedCalendarEnd(currentClock.now, selected.binding.legalTimeZone)
      if (!calendarEnd || !hrs1Same(currentClock, hrs1Clock(currentClock.now, selected.binding.legalTimeZone))
        || currentClock.legalDate !== clock.legalDate) return { status: 'unavailable' }
      const cap = Math.min(held.dbCap, Date.parse(selected.binding.activeUntilExclusive), calendarEnd,
        Date.parse(currentClock.now) + Math.floor(deadline - performance.now()),
        requestedNotAfter ? Date.parse(requestedNotAfter) : Infinity)
      if (!Number.isFinite(cap) || Date.parse(currentClock.now) >= cap
        || currentClock.now < selected.binding.activeFrom) return { status: 'unavailable' }
      const channel = hrs1Channel(command.operation)
      const publicRead = ['coverage','projection','projection_current','projection_batch'].includes(command.operation)
      const executor = channel === 'attest' ? selected.config.verifierExecutor
        : channel === 'read' && publicRead ? selected.config.readerExecutor : selected.config.writerExecutor
      const request = Object.freeze({ ...configured.value, channel, operationText: hrs1Canonical(command),
        bindingHash: command.bindingHash, epoch: held.epoch, budget: Object.freeze({ deadline }),
        notAfter: new Date(cap).toISOString(), legalDate: currentClock.legalDate }) as Hrs1FixedRequest
      held.busy = 'effect'; selected.shared.active++
      try {
        // Result calls consume the original shared jobs lane/call budgets;
        // they cannot spend M04's reserved terminal custody.
        const executed = await joint.scope.native('jobs', group, s => executor.executeFixed(request, s), signal, false)
        if (!executed.ok || executed.value.status !== 'acknowledged') {
          if (!executed.ok || executed.value.status === 'unconfirmed' || executed.value.status === 'blocked_remote_unknown') joint.scope.markAmbiguous()
          return { status: executed.ok && executed.value.status === 'unavailable' ? 'unavailable' : 'unconfirmed' }
        }
        const reply = readHrs1Reply(executed.value.rows)
        const end = joint.config.clock()
        if (!reply || signal.aborted || joint.scope.signal.aborted || performance.now() >= deadline
          || performance.now() >= held.deadline || !hrs1Same(end, hrs1Clock(end.now, selected.binding.legalTimeZone))
          || end.legalDate !== currentClock.legalDate || end.now < currentClock.now || Date.parse(end.now) >= cap) {
          joint.scope.markAmbiguous(); return { status: 'unconfirmed' }
        }
        return reply
      } catch { joint.scope.markAmbiguous(); return { status: 'unconfirmed' } }
      finally { held.busy = null; selected.shared.active-- }
    }
  }
  return { port, processingAuthority, fixed: fixedFor('outer'), processingFixed: fixedFor('processing'),
    resultFixed: resultFixedFor('outer'), processingResultFixed: resultFixedFor('processing') }
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


/** Exact next civil-day boundary; only code-selected time zones enter here. */
function selectedCalendarEnd(now: string, zone: string): number | null {
  const clock = hrs1Clock(now, zone), start = Date.parse(now)
  if (!clock || !Number.isFinite(start)) return null
  let low = start, high = start + 172800000
  const last = hrs1Clock(new Date(high).toISOString(), zone)
  if (!last || last.legalDate === clock.legalDate) return null
  while (high - low > 1) {
    const middle = Math.floor((low + high) / 2), at = hrs1Clock(new Date(middle).toISOString(), zone)
    if (!at) return null
    if (at.legalDate === clock.legalDate) low = middle
    else high = middle
  }
  return high
}

/** HRS uses the same private MA1 receipt WeakMap and M04 scope. The old factories
 * keep their original unbound behavior; this new one constructs no transport. */
export function createV3PostgresResultJobs(input: Omit<M04Config, 'evidence' | 'history'> & Readonly<{ result: Hrs1Config }>): Hrs1Facade {
  const pool = createM04LanePool(), shared = { active: 0 }
  const activeControllers = new Set<AbortController>()
  let transportBlocked = false
  let config: M04Config | null = null, result: Hrs1Config | null = null, selected: Hrs1Binding | null = null
  try {
    const value = ownRecord(input, ['binding','registry','clock','methodExecutor','intakeExecutor','jobsExecutor','producer','result'])
    const raw = value && (ownRecord(value.result, ['binding','writerExecutor','readerExecutor','verifierExecutor','ids'])
      ?? ownRecord(value.result, ['binding','writerExecutor','readerExecutor','verifierExecutor','ids','fixtureIssuer']))
    function capture<T>(object: unknown, name: string): T {
      if (!object || typeof object !== 'object') throw Error('invalid_config')
      const property = Object.getOwnPropertyDescriptor(object, name)
      if (!property || !('value' in property) || typeof property.value !== 'function') throw Error('invalid_config')
      const fn = property.value
      return ((...args: unknown[]) => Reflect.apply(fn, object, args)) as T
    }
    function captureNative<T>(object: unknown, name: string): T {
      const run = capture<(...args: unknown[]) => Promise<unknown>>(object, name)
      return (async (...args: unknown[]) => {
        if (transportBlocked) return { status: 'blocked_remote_unknown' as const }
        const reply = await run(...args)
        if (ownRecord(reply, ['status'])?.status === 'blocked_remote_unknown') {
          transportBlocked = true
          for (const controller of activeControllers) controller.abort()
        }
        return reply
      }) as T
    }
    if (value && raw && typeof value.clock === 'function') {
      const binding = readMa1FixedBinding(value.binding)
      const hrs = readHrs1Binding(raw.binding, value.registry as M04Config['registry'])
      if (binding.ok && hrs && hrs1Same(binding.value, { methodId: hrs.methodId, revision: hrs.revision,
        methodDigest: hrs.methodDigest, packageDigest: hrs.packageDigest })) {
        const ownExecutor = (v: unknown) => Object.freeze({ executeFixed: captureNative<Hrs1TerminalExecutor['executeFixed']>(v, 'executeFixed') })
        let fixtureIssuer: Hrs1SourceCustodyIssuer | null = null
        if (raw.fixtureIssuer != null) {
          if (hrs.dataMode !== 'synthetic_test') throw Error('invalid_config')
          const issuer = raw.fixtureIssuer
          fixtureIssuer = Object.freeze({
            inspect: capture<Hrs1SourceCustodyIssuer['inspect']>(issuer,'inspect'),
            finalize: capture<Hrs1SourceCustodyIssuer['finalize']>(issuer,'finalize'),
            reprove: capture<Hrs1SourceCustodyIssuer['reprove']>(issuer,'reprove'),
            reopen: capture<Hrs1SourceCustodyIssuer['reopen']>(issuer,'reopen'),
            observe: capture<Hrs1SourceCustodyIssuer['observe']>(issuer,'observe'),
            reproveObservation: capture<Hrs1SourceCustodyIssuer['reproveObservation']>(issuer,'reproveObservation'),
          })
        }
        result = Object.freeze({ binding: hrs, writerExecutor: ownExecutor(raw.writerExecutor),
          readerExecutor: ownExecutor(raw.readerExecutor), verifierExecutor: ownExecutor(raw.verifierExecutor),
          ids: capture<Hrs1Config['ids']>(value.result,'ids'), ...(fixtureIssuer ? { fixtureIssuer } : {}) })
        // These closed placeholders are never the HRS evidence/history ports.
        // The result-aware composition binds its own genuine invocation ports.
        config = Object.freeze({ binding: binding.value, registry: value.registry as M04Config['registry'],
          clock: value.clock as M04Config['clock'],
          methodExecutor: Object.freeze({ readCurrent: captureNative<Ma1MethodSqlExecutor['readCurrent']>(value.methodExecutor,'readCurrent') }),
          intakeExecutor: Object.freeze({ execute: captureNative<M04Config['intakeExecutor']['execute']>(value.intakeExecutor,'execute') }),
          jobsExecutor: Object.freeze({ executeFixed: captureNative<M04Config['jobsExecutor']['executeFixed']>(value.jobsExecutor,'executeFixed') }),
          producer: Object.freeze({ produce: capture<M04Config['producer']['produce']>(value.producer,'produce') }),
          evidence: Object.freeze({ async inspect() { return { status: 'unavailable' as const } }, async reprove() { return { status: 'unavailable' as const } } }),
          history: Object.freeze({ async read() { return { status: 'unavailable' as const } }, async reprove() { return { status: 'unavailable' as const } } }),
        })
        selected = hrs
      }
    }
  } catch { config = null; result = null; selected = null }
  type Kind = 'enqueueRule' | 'enqueueDiscovery' | 'workOnce' | 'query' | 'monitorOnce'
  function failure(kind: Kind, interrupted = false) {
    return kind === 'query' ? { ok: false as const, reason: interrupted ? 'aborted' as const : 'temporary_failure' as const }
      : kind === 'monitorOnce' ? { status: interrupted ? 'interrupted' as const : 'unavailable' as const, outcomes: [] }
        : { status: 'unavailable' as const }
  }
  async function invoke(kind: Kind, raw: unknown, signal?: AbortSignal) {
    if (transportBlocked || !config || !result || !selected || signal?.aborted) return failure(kind, signal?.aborted)
    const publicRead = kind === 'query', worker = kind === 'workOnce' || kind === 'monitorOnce'
    const milliseconds = publicRead ? hrs1PublicReadMilliseconds(selected.dataMode) : worker ? HRS1_LIMITS.workerMilliseconds : HRS1_LIMITS.effectMilliseconds
    const controller = new AbortController(), stop = () => controller.abort()
    signal?.addEventListener('abort', stop, { once: true })
    const start = performance.now(), timer = setTimeout(stop, milliseconds)
    const scope = createM04InvocationScope(pool, worker ? 30000 : 5000, controller.signal)
    if (!scope) { clearTimeout(timer); signal?.removeEventListener('abort', stop); return failure(kind) }
    activeControllers.add(controller)
    let assembly: ReturnType<typeof composeHrs1Invocation> | null = null
    try {
      const core = authorityCore(config.binding, config.methodExecutor, { scope, config, callCap: start + milliseconds,
        result: { config: result, binding: selected, shared, calls: 0 } })
      assembly = composeHrs1Invocation({ config, result, binding: selected, scope, callDeadline: start + milliseconds, authority: core.port,
        processingAuthority: core.processingAuthority, fixed: core.fixed, processingFixed: core.processingFixed,
        resultFixed: core.resultFixed, processingResultFixed: core.processingResultFixed })
      const value = kind === 'monitorOnce' ? await assembly.monitorOnce(scope.signal)
        : await assembly[kind](raw, scope.signal)
      await assembly.drain()
      if (scope.signal.aborted || performance.now() >= start + milliseconds || scope.snapshot().activeCallbacks > 0) {
        return kind === 'enqueueRule' || kind === 'enqueueDiscovery' || kind === 'workOnce'
          ? { status: 'unconfirmed' as const } : failure(kind, signal?.aborted)
      }
      return value
    } catch {
      return kind === 'enqueueRule' || kind === 'enqueueDiscovery' || kind === 'workOnce'
        ? { status: 'unconfirmed' as const } : failure(kind, signal?.aborted)
    } finally {
      controller.abort(); clearTimeout(timer); signal?.removeEventListener('abort', stop)
      try { await scope.finish(); await assembly?.drain() }
      finally { activeControllers.delete(controller) }
    }
  }
  return Object.freeze<Hrs1Facade>({
    enqueueRule: (raw, signal) => invoke('enqueueRule',raw,signal) as ReturnType<Hrs1Facade['enqueueRule']>,
    enqueueDiscovery: (raw, signal) => invoke('enqueueDiscovery',raw,signal) as ReturnType<Hrs1Facade['enqueueDiscovery']>,
    workOnce: (raw, signal) => invoke('workOnce',raw,signal) as ReturnType<Hrs1Facade['workOnce']>,
    async workSelectedOnce(kind, signal) {
      if (transportBlocked || !selected || !result || signal?.aborted) return { status: 'unavailable' }
      if (kind !== 'rule_research' && kind !== 'combination_discovery') return { status: 'invalid' }
      const method = { methodId: selected.methodId, revision: selected.revision }
      const identity = kind === 'rule_research'
        ? createV3WorkIdentity({ context: selected.context, method, factKind: selected.factKind, researchReason: { status: 'missing' } })
        : createV3CombinationDiscoveryIdentity({ destinationCountryCode: selected.context.scope.destinationCountryCode,
          citizenshipCountryCode: selected.context.scope.citizenship.countryCodes[0], method })
      let ids: Record<string, unknown> | null = null
      try { ids = ownRecord(result.ids(), ['jobId','operationId']) } catch { return { status: 'unavailable' } }
      if (!identity.ok || !ids || typeof ids.jobId !== 'string' || !/^job3_[a-f0-9]{32}$/.test(ids.jobId)
        || typeof ids.operationId !== 'string' || !/^op3_[a-f0-9]{32}$/.test(ids.operationId)) return { status: 'unavailable' }
      const claim = { operationId: ids.operationId, jobKey: identity.value.jobKey,
        leaseId: 'lease3_' + hrs1Hash({ kind: 'hrs1-selected-worker', jobKey: identity.value.jobKey, ...ids }).slice(0, 32),
        leaseMilliseconds: 30000 }
      return invoke('workOnce',claim,signal) as ReturnType<Hrs1Facade['workSelectedOnce']>
    },
    query: (raw, signal) => invoke('query',raw,signal) as ReturnType<Hrs1Facade['query']>,
    monitorOnce: signal => invoke('monitorOnce',undefined,signal) as ReturnType<Hrs1Facade['monitorOnce']>,
  })
}
