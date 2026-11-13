// One fixed tick. Scheduling, method approval and source custody are separate.
import 'server-only'
import { performance } from 'node:perf_hooks'
import type { Hrs1Facade, Hrs1MonitorResult } from '../result/composition'
import { HRS1_LIMITS } from '../result/contract'
import { officialTruthV3ChDeRuntime } from './ch-de-server'

type WorkResult = Awaited<ReturnType<Hrs1Facade['workSelectedOnce']>>
type WorkStatus = 'skipped' | 'processed' | 'not_due' | 'backoff' | 'exhausted' | 'superseded'
  | 'unavailable' | 'unconfirmed' | 'invalid' | 'incomplete'
type Counters = { published: number; escalated: number; researchQueued: number; suppressed: number;
  deferred: number; sourceUnavailable: number; unconfirmed: number; unavailable: number; invalid: number }
export type ChDeTickReport = Readonly<{
  schema: 1; status: 'complete' | 'stopped' | 'interrupted' | 'busy' | 'unavailable';
  calls: Readonly<{ started: number; settled: number }>;
  stages: Readonly<{ discovery: WorkStatus; monitor: 'skipped' | Hrs1MonitorResult['status']; research: WorkStatus }>;
  counts: Readonly<Counters>; elapsedMilliseconds: number; budgetMilliseconds: 30000;
}>

// This is only same-instance admission. Cross-instance ownership remains the
// existing durable M04 claims/fences and HRS monitor lease, never this boolean.
let active = false

function countWork(value: WorkResult, counts: Counters): { status: WorkStatus; proceed: boolean } {
  if (value.status === 'processed') {
    if (value.results.length < 1 || value.results.length > 16) {
      counts.invalid++; return { status: 'invalid', proceed: false }
    }
    let proceed = true
    for (const result of value.results) {
      if (result.status === 'published') counts.published++
      else if (result.status === 'escalated') counts.escalated++
      else {
        proceed = false
        if (result.status === 'unconfirmed') counts.unconfirmed++
        else if (result.status === 'unavailable') counts.unavailable++
        else if (result.status === 'invalid' || result.status === 'collision') counts.invalid++
        else counts.deferred++
      }
    }
    return { status: 'processed', proceed }
  }
  if (value.status === 'worker_only') {
    const status = value.worker.status
    if (status === 'not_due') return { status, proceed: true }
    if (status === 'backoff' || status === 'exhausted' || status === 'superseded') {
      counts.deferred++; return { status, proceed: false }
    }
    if (status === 'completed') { counts.deferred++; return { status: 'incomplete', proceed: false } }
    if (status === 'unconfirmed') counts.unconfirmed++
    else if (status === 'unavailable') counts.unavailable++
    else counts.invalid++
    return { status, proceed: false }
  }
  if (value.status === 'unconfirmed') counts.unconfirmed++
  else if (value.status === 'unavailable') counts.unavailable++
  else counts.invalid++
  return { status: value.status, proceed: false }
}

function countMonitor(value: Hrs1MonitorResult, counts: Counters): boolean {
  // One primary can report expired suppression, new unclear suppression, then research queued.
  if (value.outcomes.length > HRS1_LIMITS.monitorTargets * 3) { counts.invalid++; return false }
  let proceed = value.status === 'complete'
  if (value.status === 'unavailable') counts.unavailable++
  for (const outcome of value.outcomes) {
    switch (outcome.status) {
      case 'research_queued': counts.researchQueued++; break
      case 'suppressed': counts.suppressed++; break
      case 'source_unavailable': case 'optional_unreachable': counts.sourceUnavailable++; break
      case 'unconfirmed': counts.unconfirmed++; proceed = false; break
      case 'unavailable': counts.unavailable++; proceed = false; break
      case 'invalid': counts.invalid++; proceed = false; break
      case 'unchanged': case 'already_researched': case 'not_due': break
      default: counts.invalid++; proceed = false
    }
  }
  return proceed
}

/** No caller input chooses a context, job key, source, method, executor or cap.
 * Three sequential existing entrances share one immutable 30-second deadline.
 * Completion counters describe this tick, never a new public travel decision. */
export async function runOfficialTruthV3ChDeTick(signal: AbortSignal): Promise<ChDeTickReport> {
  const start = performance.now(), deadline = start + HRS1_LIMITS.workerMilliseconds
  const calls = { started: 0, settled: 0 }
  const stages: { discovery: WorkStatus; monitor: 'skipped' | Hrs1MonitorResult['status']; research: WorkStatus } = {
    discovery: 'skipped', monitor: 'skipped', research: 'skipped',
  }
  const counts: Counters = { published: 0, escalated: 0, researchQueued: 0, suppressed: 0,
    deferred: 0, sourceUnavailable: 0, unconfirmed: 0, unavailable: 0, invalid: 0 }
  const report = (status: ChDeTickReport['status']): ChDeTickReport => Object.freeze({ schema: 1, status,
    calls: Object.freeze({ ...calls }), stages: Object.freeze({ ...stages }), counts: Object.freeze({ ...counts }),
    elapsedMilliseconds: Math.max(0, Math.ceil(performance.now() - start)), budgetMilliseconds: 30000 })
  if (signal.aborted) return report('interrupted')
  if (active) return report('busy')
  active = true
  const controller = new AbortController(), stop = () => controller.abort()
  const budget = Object.freeze({ deadline })
  signal.addEventListener('abort', stop, { once: true })
  if (signal.aborted) stop()
  const timer = setTimeout(stop, Math.max(0, deadline - performance.now()))
  function interrupted() {
    if (signal.aborted || performance.now() >= deadline) stop()
    return controller.signal.aborted
  }
  try {
    const facade = officialTruthV3ChDeRuntime()
    if (!facade) { counts.unavailable++; return report('unavailable') }
    if (interrupted()) return report('interrupted')
    calls.started++
    let discovery: WorkResult
    try { discovery = await facade.workSelectedOnce('combination_discovery', controller.signal, budget) }
    finally { calls.settled++ }
    const discovered = countWork(discovery, counts); stages.discovery = discovered.status
    if (interrupted()) return report('interrupted')
    if (!discovered.proceed) return report('stopped')

    calls.started++
    let monitored: Hrs1MonitorResult
    try { monitored = await facade.monitorOnce(controller.signal, budget) }
    finally { calls.settled++ }
    stages.monitor = monitored.status
    const proceed = countMonitor(monitored, counts)
    if (interrupted()) return report('interrupted')
    if (!proceed) return report('stopped')

    calls.started++
    let research: WorkResult
    try { research = await facade.workSelectedOnce('rule_research', controller.signal, budget) }
    finally { calls.settled++ }
    const researched = countWork(research, counts); stages.research = researched.status
    if (interrupted()) return report('interrupted')
    return report(researched.proceed ? 'complete' : 'stopped')
  } catch {
    // A thrown result does not prove rollback, non-execution or a safe replay.
    counts.unconfirmed++
    return report(interrupted() ? 'interrupted' : 'stopped')
  } finally {
    // Every actual started facade promise has settled through its owned drain.
    // Never release admission at a signal-only timeout or detached race.
    stop(); clearTimeout(timer); signal.removeEventListener('abort', stop)
    active = false
  }
}
