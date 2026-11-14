// Private, bounded observation only. The manual Dev route opens this context
// after its existing target, request and current Owner/AAL2 checks.
import 'server-only'
import { AsyncLocalStorage } from 'node:async_hooks'
import { performance } from 'node:perf_hooks'

const STAGES = new Set([
  'method_precheck', 'tick', 'tick_discovery', 'tick_monitor', 'tick_research',
  'i1_reserve', 'i1_prepare', 'i1_method_resolve', 'i1_history_read', 'i1_evidence_inspect',
  'i1_evidence_reproof', 'i1_history_reproof', 'i1_method_reproof', 'i1_finish',
  'source_attest', 'source_evidence_read', 'job_import', 'job_import_confirm', 'job_prepare',
] as const)
type Stage = typeof STAGES extends Set<infer T> ? T : never
const STATUSES = new Set([
  'approved', 'not_approved', 'unavailable', 'acquired', 'completed', 'collision', 'busy',
  'snapshot', 'inspected', 'current', 'changed', 'prepared', 'escalation', 'quarantined',
  'recorded', 'unconfirmed', 'outcome_unknown', 'rejected', 'processed', 'worker_only',
  'complete', 'stopped', 'interrupted', 'invalid', 'not_due', 'backoff', 'exhausted', 'superseded',
])
// VERCEL_REGION is the function's actual region, never an edge-log inference.
const REGIONS = new Set([
  'arn1', 'bom1', 'cdg1', 'cle1', 'cpt1', 'dub1', 'dxb1', 'fra1', 'gru1', 'hkg1',
  'hnd1', 'iad1', 'icn1', 'kix1', 'lhr1', 'pdx1', 'sfo1', 'sin1', 'syd1',
])
const MAX_EVENTS = 128, MAX_LINE_BYTES = 1024, MAX_MILLISECONDS = 600_000
type Sink = (line: string) => void
type Budget = Readonly<{ kind: 'tick' | 'i1'; start: number; deadline: number; effectiveDeadline: number }>
type Recorder = { sink: Sink | null; region: string; start: number; events: number;
  started: number; settled: number; closed: boolean }
type Context = Readonly<{ recorder: Recorder; budget: Budget | null }>
const context = new AsyncLocalStorage<Context>()

function milliseconds(value: number): number {
  return Number.isFinite(value) ? Math.max(0, Math.min(MAX_MILLISECONDS, Math.floor(value))) : 0
}
function returnedStatus(value: unknown): string | null {
  // Never invoke a foreign getter, toJSON, iterator or stringify its contents.
  try {
    const status: unknown = typeof value === 'string' ? value : value && typeof value === 'object'
      ? Object.getOwnPropertyDescriptor(value, 'status')?.value : null
    return typeof status === 'string' && STATUSES.has(status) ? status : null
  } catch { return null }
}
function returnedDetail(stage: Stage, value: unknown): string | null {
  try {
    if (stage === 'job_prepare') return value === null ? 'no_receipt' : typeof value === 'object' ? 'receipt_returned' : null
    const status = returnedStatus(value)
    const field = (stage === 'job_import' || stage === 'job_import_confirm') && status === 'completed' ? 'outcome'
      : (stage === 'tick_discovery' || stage === 'tick_research') && status === 'worker_only' ? 'worker' : null
    return field && value && typeof value === 'object'
      ? returnedStatus(Object.getOwnPropertyDescriptor(value, field)?.value) : null
  } catch { return null }
}
function emit(current: Context, stage: Stage, phase: 'started' | 'settled' | 'threw',
  signal: AbortSignal, stageStart: number, span: number, value?: unknown) {
  const recorder = current.recorder
  if (recorder.closed || !recorder.sink || recorder.events >= MAX_EVENTS) return
  try {
    const now = performance.now(), budget = current.budget
    const outcome = signal.aborted ? 'aborted' : budget && now >= budget.effectiveDeadline ? 'budget_ended'
      : phase === 'threw' ? 'threw' : phase === 'started' ? 'pending' : 'returned'
    const line = JSON.stringify({
      schema: 1, kind: 'official_truth_dev_import_diagnostic', sequence: ++recorder.events,
      stage, phase, outcome, returnedStatus: outcome === 'returned' ? returnedStatus(value) : null,
      returnedDetail: outcome === 'returned' ? returnedDetail(stage, value) : null,
      region: recorder.region, span, callsStarted: recorder.started, callsSettled: recorder.settled,
      elapsedMilliseconds: milliseconds(now - recorder.start), stageElapsedMilliseconds: milliseconds(now - stageStart),
      budget: budget?.kind ?? null, budgetMilliseconds: budget ? milliseconds(budget.deadline - budget.start) : null,
      budgetElapsedMilliseconds: budget ? milliseconds(now - budget.start) : null,
      remainingMilliseconds: budget ? milliseconds(budget.effectiveDeadline - now) : null,
    })
    if (Buffer.byteLength(line, 'utf8') <= MAX_LINE_BYTES) recorder.sink(line)
  } catch {
    // A broken/missing logging sink must not change the observed operation.
    recorder.sink = null
  }
}

/** Only the already authorized manual Dev route calls this in application code.
 * sink is an isolated test seam, never request/ENV configuration or a transport. */
export async function withDevImportDiagnostics<T>(run: () => Promise<T>, sink: Sink | null = line => console.info(line)): Promise<T> {
  const rawRegion = process.env.VERCEL_REGION
  const recorder: Recorder = { sink, region: rawRegion === undefined || rawRegion === '' ? 'unavailable'
    : REGIONS.has(rawRegion) ? rawRegion : 'unlisted', start: performance.now(), events: 0,
    started: 0, settled: 0, closed: false }
  try { return await context.run({ recorder, budget: null }, run) }
  finally { recorder.closed = true }
}

/** Observe the existing absolute budget; never start a new timer or extend it. */
export function withDevDiagnosticBudget<T>(kind: Budget['kind'], start: number, deadline: number, run: () => T): T {
  const current = context.getStore()
  if (!current || current.recorder.closed || (kind !== 'tick' && kind !== 'i1') || !Number.isFinite(start) || !Number.isFinite(deadline)
    || deadline <= start || deadline - start > 30_000) return run()
  const budget: Budget = { kind, start, deadline,
    effectiveDeadline: Math.min(deadline, current.budget?.effectiveDeadline ?? deadline) }
  return context.run({ recorder: current.recorder, budget }, run)
}

/** Await the original promise completely. Errors retain their original identity;
 * there is no race, detached drain, retry or inference about durable effects. */
export function traceDevDiagnosticStage<T>(stage: Stage, signal: AbortSignal, run: () => Promise<T>): Promise<T> {
  const current = context.getStore()
  if (!current || current.recorder.closed || !current.recorder.sink || current.recorder.events >= MAX_EVENTS || !STAGES.has(stage)) return run()
  const stageStart = performance.now()
  const span = current.recorder.started = Math.min(MAX_EVENTS, current.recorder.started + 1)
  emit(current, stage, 'started', signal, stageStart, span)
  if (!current.recorder.sink) return run()
  return (async () => {
    try {
      const value = await run()
      current.recorder.settled = Math.min(MAX_EVENTS, current.recorder.settled + 1)
      emit(current, stage, 'settled', signal, stageStart, span, value)
      return value
    } catch (error) {
      current.recorder.settled = Math.min(MAX_EVENTS, current.recorder.settled + 1)
      emit(current, stage, 'threw', signal, stageStart, span)
      throw error
    }
  })()
}
