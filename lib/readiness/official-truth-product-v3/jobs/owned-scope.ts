// Internal finite ownership. Outward timeout cannot recycle live native work.
import 'server-only'
import { performance } from 'node:perf_hooks'
import { M04_LIMITS, readM04Command, type M04Claim, type M04Operation } from './contract'
import { same } from '../monitor/internal'

type NativeKind = 'method' | 'intake' | 'jobs'
type Group = 'processing' | 'outer'
type Admission<T> = Readonly<{ ok: true; value: T }> | Readonly<{ ok: false }>
type LanePool = ReturnType<typeof createM04LanePool>

export function createM04LanePool() {
  const outer = Array.from({ length: M04_LIMITS.outerLanes }, () => false)
  const native = { method: 0, intake: 0, jobs: 0 }
  let poisoned = false
  return Object.freeze({
    acquire() {
      const index = poisoned ? -1 : outer.indexOf(false)
      if (index < 0) return null
      outer[index] = true
      let held = true
      return () => { if (held) { held = false; outer[index] = false } }
    },
    native(kind: NativeKind) {
      if (poisoned || native[kind] >= M04_LIMITS.nativeLanes) return null
      native[kind]++
      let held = true
      return () => { if (held) { held = false; native[kind]-- } }
    },
    poison() { poisoned = true },
    snapshot() { return Object.freeze({ occupied: outer.filter(Boolean).length, poisoned, ...native }) },
  })
}

export function createM04InvocationScope(pool: LanePool, milliseconds: 5000 | 30000, parent?: AbortSignal) {
  const releaseLane = pool.acquire()
  if (!releaseLane) return null
  const deadline = performance.now() + milliseconds, controller = new AbortController()
  let sealed = false, processingSealed = false, finishing = false, released = false, ambiguous = false
  let nativeTotal = 0, callbackTotal = 0, processingNative = 0, processingCallbacks = 0
  let unresolved = false, transientBytes = 0
  let terminalCustody: Readonly<{ claim: M04Claim; attemptKey: string; commandKey: string }> | null = null
  const activeNative = new Set<Promise<unknown>>(), activeCallbacks = new Set<Promise<unknown>>()
  const stop = () => { controller.abort(); processingSealed = true }
  if (parent?.aborted) stop()
  else parent?.addEventListener('abort', stop, { once: true })
  const timer = setTimeout(stop, Math.max(0, deadline - performance.now()))
  function available(group: Group): boolean {
    return !sealed && !controller.signal.aborted && performance.now() < deadline
      && (group !== 'processing' || !processingSealed)
  }
  function finalRelease() {
    if (!finishing || released || activeNative.size || activeCallbacks.size) return
    released = true; releaseLane!()
  }
  function child(parentSignal?: AbortSignal) {
    const c = new AbortController(), abort = () => c.abort()
    if (controller.signal.aborted || parentSignal?.aborted) abort()
    else {
      controller.signal.addEventListener('abort', abort, { once: true })
      parentSignal?.addEventListener('abort', abort, { once: true })
    }
    return { signal: c.signal, dispose() {
      controller.signal.removeEventListener('abort', abort)
      parentSignal?.removeEventListener('abort', abort)
    } }
  }
  async function native<T>(kind: NativeKind, group: Group, run: (signal: AbortSignal) => Promise<T>,
    signal?: AbortSignal, terminal = false): Promise<Admission<T>> {
    const qualifiedTerminal = terminal && terminalCustody !== null && group === 'outer' && kind !== 'intake' && !ambiguous
    const cap = unresolved && !qualifiedTerminal ? M04_LIMITS.totalNative - M04_LIMITS.terminalReserve : M04_LIMITS.totalNative
    if (!available(group) || signal?.aborted || nativeTotal >= cap || activeNative.size >= M04_LIMITS.activeNative) return { ok: false }
    const release = pool.native(kind)
    if (!release) return { ok: false }
    nativeTotal++
    if (group === 'processing') processingNative++
    const owned = child(signal)
    // Register the entry BEFORE run can begin, including synchronous callbacks.
    const actual = Promise.resolve().then(() => {
      if (owned.signal.aborted || !available(group)) throw Error('not_admitted')
      return run(owned.signal)
    })
    activeNative.add(actual)
    try { return { ok: true, value: await actual } }
    catch { ambiguous = true; return { ok: false } }
    finally {
      activeNative.delete(actual); if (group === 'processing') processingNative--
      owned.dispose(); release(); finalRelease()
    }
  }
  async function callback<T>(group: Group, run: (signal: AbortSignal) => Promise<T>, signal?: AbortSignal): Promise<Admission<T>> {
    if (!available(group) || signal?.aborted || activeCallbacks.size >= M04_LIMITS.activeCallbacks
      || callbackTotal >= M04_LIMITS.totalCallbacks) return { ok: false }
    callbackTotal++
    if (group === 'processing') processingCallbacks++
    const owned = child(signal)
    const actual = Promise.resolve().then(() => {
      if (owned.signal.aborted || !available(group)) throw Error('not_admitted')
      return run(owned.signal)
    })
    activeCallbacks.add(actual)
    // A single terminal observer owns the callback after a raced caller ends.
    const terminal = actual.then(value => ({ ok: true as const, value }), () => ({ ok: false as const }))
      .finally(() => {
        activeCallbacks.delete(actual); if (group === 'processing') processingCallbacks--
        owned.dispose(); finalRelease()
      })
    let abort: (() => void) | undefined
    const interrupted = new Promise<Admission<T>>(resolve => {
      abort = () => resolve({ ok: false })
      owned.signal.addEventListener('abort', abort, { once: true })
      if (owned.signal.aborted) abort()
    })
    try { return await Promise.race([terminal, interrupted]) }
    finally { if (abort) owned.signal.removeEventListener('abort', abort) }
  }
  return Object.freeze({
    signal: controller.signal, deadline, native, callback,
    admits(group: Group = 'outer') { return available(group) },
    sealProcessing() { processingSealed = true },
    processingTerminal() { return processingSealed && processingNative === 0 && processingCallbacks === 0 },
    markAmbiguous() { ambiguous = true },
    isAmbiguous() { return ambiguous },
    markUnresolved() { unresolved = true },
    markSettled() { unresolved = false; terminalCustody = null },
    // Internal composition-only custody, never returned by the outward factory.
    // A native result or a caller boolean cannot mint this permission.
    beginTerminal(value: Readonly<{ claim: M04Claim; attemptKey: string; commandKey: string }>) {
      if (!unresolved || ambiguous || !processingSealed || processingNative || processingCallbacks
        || !available('outer') || terminalCustody) return false
      terminalCustody = Object.freeze({ claim: Object.freeze({ ...value.claim }), attemptKey: value.attemptKey, commandKey: value.commandKey })
      return true
    },
    terminalObservation() { return !!terminalCustody && unresolved && !ambiguous && available('outer') },
    terminalOperation(request: M04Operation) {
      const held = terminalCustody
      if (!held || !unresolved || ambiguous || !available('outer')) return false
      if (request.operation === 'queue_read') return request.body.jobKey === held.claim.jobKey
      if (request.operation === 'execution_read') return request.body.purpose === 'confirm' && same(request.body.claim, held.claim)
      if (request.operation !== 'queue_confirm' && request.operation !== 'queue_cas') return false
      const c = readM04Command(request.body.command)
      if (!c || c.commandKey !== held.commandKey || c.jobKey !== held.claim.jobKey) return false
      if (request.operation === 'queue_cas') return request.body.disposition.kind !== 'regular' && request.body.disposition.attemptKey === held.attemptKey
      return true
    },
    retain(bytes: number) {
      if (!Number.isSafeInteger(bytes) || bytes < 0 || transientBytes + bytes > M04_LIMITS.transientBytes) return false
      transientBytes += bytes; return true
    },
    snapshot() { return Object.freeze({ nativeTotal, callbackTotal, activeNative: activeNative.size,
      activeCallbacks: activeCallbacks.size, processingNative, processingCallbacks, processingSealed,
      sealed, unresolved, ambiguous, transientBytes, retired: finishing && !released }) },
    async drainNative() {
      // At most eight entries; no historical ever-growing Promise array.
      while (activeNative.size) await Promise.allSettled([...activeNative])
    },
    async finish() {
      if (finishing) return
      finishing = true; sealed = true; processingSealed = true; controller.abort()
      clearTimeout(timer); parent?.removeEventListener('abort', stop)
      while (activeNative.size) await Promise.allSettled([...activeNative])
      // Pending nonnative callbacks keep the lane occupied until actual terminal.
      finalRelease()
    },
  })
}
