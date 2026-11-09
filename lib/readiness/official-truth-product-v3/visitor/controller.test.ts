import assert from 'node:assert/strict'
import { describe, test } from 'node:test'
import type { Ladung } from '@/lib/admin/ladezustand'
import type { V3VisitorInput } from '../contract'
import { createV3VisitorController, unboundV3VisitorLoad, type V3VisitorTimers, type V3VisitorUiState } from './controller'
import type { V3VisitorView, V3VisitorViewResult } from './presentation'

const FIRST: V3VisitorInput = { destinationCountryCode: 'DE', citizenshipCountryCodes: ['CH'] }
const SECOND: V3VisitorInput = { destinationCountryCode: 'DE', citizenshipCountryCodes: ['RS'] }
function deferred<T>() {
  let resolve!: (value: T) => void
  let reject!: (error: unknown) => void
  const promise = new Promise<T>((done, fail) => { resolve = done; reject = fail })
  return { promise, resolve, reject }
}
async function view(input = FIRST): Promise<Ladung<V3VisitorView>> { return unboundV3VisitorLoad(input, new AbortController().signal) }

async function flush() { for (let turn = 0; turn < 8; turn += 1) await Promise.resolve() }
class Clock implements V3VisitorTimers {
  time = 0
  private sequence = 0
  private readonly tasks = new Map<number, { at: number; callback: () => void }>()
  now = () => this.time
  after(milliseconds: number, callback: () => void) {
    const id = ++this.sequence
    this.tasks.set(id, { at: this.time + milliseconds, callback })
    return () => { this.tasks.delete(id) }
  }
  async advance(milliseconds: number) {
    const until = this.time + milliseconds
    while (true) {
      const next = [...this.tasks].sort((left, right) => left[1].at - right[1].at || left[0] - right[0])[0]
      if (!next || next[1].at > until) break
      this.time = next[1].at; this.tasks.delete(next[0]); next[1].callback(); await flush()
    }
    this.time = until; await flush()
  }
}
const BASE = Date.parse('2026-11-09T08:04:00.000Z')
const pendingResult: V3VisitorViewResult = { status: 'pending', title: 'Wird geprüft', message: 'Synthetischer bestätigter Auftrag' }
function acceptedResult(clock: Clock, ttl = 20_000): V3VisitorViewResult {
  return { status: 'accepted', title: 'Synthetischer Test', conditions: ['Synthetisch'], statements: [{ text: 'Synthetisch', when: null, href: null }],
    source: { label: 'Testbehörde', href: 'https://destination.example/' }, checkedAtText: 'Synthetischer Quellenstand', validityText: 'Synthetisch',
    ruleVersion: 1, expiresAt: new Date(BASE + clock.time + ttl).toISOString() }
}
function response(clock: Clock, results: V3VisitorViewResult[], input = FIRST): Ladung<V3VisitorView> {
  return { daten: { input, generatedAt: new Date(BASE + clock.time).toISOString(), synthetic: true,
    cells: input.citizenshipCountryCodes.map((country) => ({ country, label: country, results })) }, fehler: null }
}
function lastReady(changes: V3VisitorUiState[]) {
  const state = changes.at(-1)
  if (state?.phase !== 'ready') assert.fail('expected ready state')
  return state
}

describe('U1 UI request ordering and honest load state', () => {
  test('latest selection wins even when an older transport ignores cancellation', async () => {
    const old = deferred<Ladung<V3VisitorView>>(), next = deferred<Ladung<V3VisitorView>>()
    const changes: V3VisitorUiState[] = [], signals: AbortSignal[] = []
    const controller = createV3VisitorController((input, signal) => {
      signals.push(signal); return input.citizenshipCountryCodes[0] === 'CH' ? old.promise : next.promise
    }, (state) => changes.push(state))
    const first = controller.submit(FIRST)
    controller.invalidate()
    const second = controller.submit(SECOND)
    assert.equal(signals[0].aborted, true)
    next.resolve(await view(SECOND)); await second
    old.resolve(await view(FIRST)); await first
    const last = changes.at(-1)
    assert.equal(last?.phase, 'ready')
    if (last?.phase !== 'ready') assert.fail('expected last answer')
    assert.deepEqual(last.view.input, SECOND)
    assert.equal(changes.filter((state) => state.phase === 'ready').length, 1)
    controller.dispose()
  })
  test('editing clears the old answer immediately and blocks a later stale error', async () => {
    const pending = deferred<Ladung<V3VisitorView>>(), changes: V3VisitorUiState[] = []
    const controller = createV3VisitorController(() => pending.promise, (state) => changes.push(state))
    const running = controller.submit(FIRST)
    assert.equal(changes.at(-1)?.phase, 'loading')
    controller.invalidate()
    assert.deepEqual(changes.at(-1), { phase: 'idle', view: null, message: null })
    pending.reject(new Error('PRIVATE payload'))
    await running
    assert.equal(changes.at(-1)?.phase, 'idle')
    controller.dispose()
  })
  test('unmount cancels a pending request and produces no further state emission', async () => {
    const pending = deferred<Ladung<V3VisitorView>>(), changes: V3VisitorUiState[] = []
    let signal: AbortSignal | undefined
    const controller = createV3VisitorController((_input, current) => { signal = current; return pending.promise }, (state) => changes.push(state))
    const running = controller.submit(FIRST)
    controller.dispose()
    const length = changes.length
    assert.equal(signal?.aborted, true)
    pending.resolve(await view()); await running
    assert.equal(changes.length, length)
  })
  test('wrong-cell response and raw backend errors cannot become a visible rule', async () => {
    for (const response of [await view(SECOND), { daten: null, fehler: { meldung: 'PRIVATE sql error', wiederholbar: true } }]) {
      const changes: V3VisitorUiState[] = []
      const controller = createV3VisitorController(async () => response, (state) => changes.push(state))
      await controller.submit(FIRST)
      assert.equal(changes.at(-1)?.phase, 'error')
      assert.equal(JSON.stringify(changes).includes('PRIVATE'), false)
      controller.dispose()
    }
  })
  test('input snapshot cannot be changed by caller mutation while awaiting a response', async () => {
    const input: V3VisitorInput = { ...FIRST, citizenshipCountryCodes: ['CH'] }
    const pending = deferred<Ladung<V3VisitorView>>()
    let observed: V3VisitorInput | null = null
    const changes: V3VisitorUiState[] = []
    const controller = createV3VisitorController((snapshot) => { observed = snapshot; return pending.promise }, (state) => changes.push(state))
    const running = controller.submit(input)
    input.citizenshipCountryCodes[0] = 'RS'
    assert.deepEqual(observed, FIRST)
    assert.ok(Object.isFrozen(observed))
    pending.resolve(await view(FIRST)); await running
    assert.equal(changes.at(-1)?.phase, 'ready')
    controller.dispose()
  })
  test('closed client transport returns unavailable without any fetch or pending label', async () => {
    const loaded = await view()
    assert.equal(loaded.fehler, null)
    assert.ok(loaded.daten)
    assert.equal(loaded.daten.cells[0].results[0].status, 'unavailable')
  })
})

describe('U1 R3 bounded automatic readback', () => {
  test('confirmed pending becomes accepted automatically without new loading screen or focus request', async () => {
    const clock = new Clock(), changes: V3VisitorUiState[] = []
    let calls = 0
    const controller = createV3VisitorController(async () => response(clock, [++calls === 1 ? pendingResult : acceptedResult(clock)]),
      (state) => changes.push(state), clock)
    await controller.submit(FIRST)
    assert.equal(lastReady(changes).refresh, 'waiting')
    assert.equal(lastReady(changes).focusResult, true)
    await clock.advance(1_999); assert.equal(calls, 1)
    await clock.advance(1)
    assert.equal(calls, 2)
    assert.equal(lastReady(changes).view.cells[0].results[0].status, 'accepted')
    assert.equal(lastReady(changes).refresh, 'off')
    assert.equal(lastReady(changes).focusResult, false)
    assert.equal(changes.filter((state) => state.phase === 'loading').length, 1)
    await clock.advance(130_000); assert.equal(calls, 2)
    controller.dispose()
  })
  test('six follow-up reads use exact fixed backoff and then stop honestly', async () => {
    const clock = new Clock(), changes: V3VisitorUiState[] = [], at: number[] = []
    const controller = createV3VisitorController(async () => { at.push(clock.time); return response(clock, [pendingResult]) },
      (state) => changes.push(state), clock)
    await controller.submit(FIRST)
    await clock.advance(120_000)
    assert.deepEqual(at, [0, 2_000, 6_000, 14_000, 30_000, 60_000, 105_000])
    assert.equal(lastReady(changes).refresh, 'stopped')
    assert.match(lastReady(changes).message ?? '', /nicht abgeschlossen/)
    assert.equal(lastReady(changes).view.cells[0].results[0].status, 'pending')
    await clock.advance(120_000); assert.equal(at.length, 7)
    controller.dispose()
  })
  test('hard 120-second deadline aborts in-flight read and rejects its late positive response', async () => {
    const clock = new Clock(), changes: V3VisitorUiState[] = [], signals: AbortSignal[] = []
    const late = deferred<Ladung<V3VisitorView>>()
    let calls = 0
    const controller = createV3VisitorController((_input, signal) => {
      calls += 1; signals.push(signal)
      if (calls === 7) return late.promise
      return new Promise((resolve) => clock.after(2_000, () => resolve(response(clock, [pendingResult]))))
    }, (state) => changes.push(state), clock)
    const first = controller.submit(FIRST)
    await clock.advance(2_000); await first
    await clock.advance(115_000)
    assert.equal(calls, 7); assert.equal(signals[6].aborted, false)
    await clock.advance(3_000)
    assert.equal(signals[6].aborted, true)
    assert.equal(lastReady(changes).refresh, 'stopped')
    late.resolve(response(clock, [acceptedResult(clock)])); await flush()
    assert.equal(lastReady(changes).view.cells[0].results[0].status, 'pending')
    await clock.advance(120_000); assert.equal(calls, 7)
    controller.dispose()
  })
  test('a lost follow-up response times out, clears positives and stops the series', async () => {
    const clock = new Clock(), changes: V3VisitorUiState[] = []
    let calls = 0, pollSignal: AbortSignal | null = null
    const controller = createV3VisitorController((_input, signal) => {
      calls += 1
      if (calls === 1) return Promise.resolve(response(clock, [acceptedResult(clock), pendingResult]))
      pollSignal = signal; return new Promise(() => {})
    }, (state) => changes.push(state), clock)
    await controller.submit(FIRST)
    await clock.advance(2_000)
    assert.equal(lastReady(changes).refresh, 'checking')
    assert.equal(lastReady(changes).view.cells[0].results.some((result) => result.status === 'accepted'), false)
    await clock.advance(10_000)
    const last = changes.at(-1)
    assert.equal(last?.phase, 'error')
    if (last?.phase === 'error') assert.equal(last.focusResult, false)
    assert.equal((pollSignal as AbortSignal | null)?.aborted, true)
    await clock.advance(120_000); assert.equal(calls, 2)
    controller.dispose()
  })
  test('pending to conflict and all terminal answers stop polling, including mixed errors', async () => {
    for (const terminal of ['conflict', 'unavailable', 'error'] as const) {
      const clock = new Clock(), changes: V3VisitorUiState[] = []
      let calls = 0
      const controller = createV3VisitorController(async () => response(clock, ++calls === 1 ? [pendingResult]
        : [{ status: terminal, title: 'Synthetisch', message: 'Synthetisch' }, pendingResult]), (state) => changes.push(state), clock)
      await controller.submit(FIRST); await clock.advance(120_000)
      assert.equal(calls, 2); assert.equal(lastReady(changes).refresh, 'off')
      assert.equal(lastReady(changes).focusResult, false)
      controller.dispose()
    }
    const clock = new Clock(); let calls = 0
    const controller = createV3VisitorController(async (input) => { calls += 1; return view(input) }, () => {}, clock)
    await controller.submit(FIRST); await clock.advance(120_000)
    assert.equal(calls, 1); controller.dispose()
  })
  test('transport failure during polling stops and never exposes raw failure details', async () => {
    const clock = new Clock(), changes: V3VisitorUiState[] = []; let calls = 0
    const controller = createV3VisitorController(async () => ++calls === 1 ? response(clock, [pendingResult])
      : { daten: null, fehler: { meldung: 'PRIVATE SQL', wiederholbar: false } }, (state) => changes.push(state), clock)
    await controller.submit(FIRST); await clock.advance(120_000)
    assert.equal(calls, 2); assert.equal(changes.at(-1)?.phase, 'error')
    assert.equal(JSON.stringify(changes).includes('PRIVATE'), false)
    controller.dispose()
  })
  test('no overlapping reads and a new selection cancels the timer and stale in-flight result', async () => {
    const clock = new Clock(), changes: V3VisitorUiState[] = [], late = deferred<Ladung<V3VisitorView>>()
    let calls = 0, signal: AbortSignal | null = null
    const controller = createV3VisitorController((input, current) => {
      calls += 1
      if (calls === 1) return Promise.resolve(response(clock, [pendingResult]))
      if (calls === 2) { signal = current; return late.promise }
      return Promise.resolve(response(clock, [{ status: 'unavailable', title: 'Synthetisch', message: 'Synthetisch' }], input))
    }, (state) => changes.push(state), clock)
    await controller.submit(FIRST); await clock.advance(8_000)
    assert.equal(calls, 2)
    controller.invalidate(); await controller.submit(SECOND)
    assert.equal((signal as AbortSignal | null)?.aborted, true)
    late.resolve(response(clock, [acceptedResult(clock)], FIRST)); await flush()
    assert.deepEqual(lastReady(changes).view.input, SECOND)
    await clock.advance(120_000); assert.equal(calls, 3)
    controller.dispose()
  })
  test('unmount cancels a pending timer and a pending follow-up transport', async () => {
    for (const duringRead of [false, true]) {
      const clock = new Clock(), changes: V3VisitorUiState[] = []
      let calls = 0
      const late = deferred<Ladung<V3VisitorView>>()
      const controller = createV3VisitorController(async () => ++calls === 1 ? response(clock, [pendingResult]) : late.promise,
        (state) => changes.push(state), clock)
      await controller.submit(FIRST)
      if (duringRead) await clock.advance(2_000)
      controller.dispose(); const length = changes.length
      late.resolve(response(clock, [acceptedResult(clock)])); await flush(); await clock.advance(120_000)
      assert.equal(changes.length, length)
      assert.equal(calls, duringRead ? 2 : 1)
    }
  })
  test('accepted expiry is never extended by polling waits or request latency', async () => {
    const clock = new Clock(), changes: V3VisitorUiState[] = []
    let calls = 0
    const controller = createV3VisitorController(async () => { calls += 1; return response(clock, [acceptedResult(clock, 1_000), pendingResult]) },
      (state) => changes.push(state), clock)
    await controller.submit(FIRST)
    await clock.advance(1_000)
    assert.equal(lastReady(changes).view.cells[0].results[0].status, 'unavailable')
    assert.equal(lastReady(changes).focusResult, false)
    await clock.advance(120_000); assert.equal(calls, 1)
    controller.dispose()

    const delayed = new Clock(), delayedChanges: V3VisitorUiState[] = [], old = response(delayed, [acceptedResult(delayed, 1_000)])
    const slow = createV3VisitorController(() => new Promise((resolve) => delayed.after(1_500, () => resolve(old))),
      (state) => delayedChanges.push(state), delayed)
    const running = slow.submit(FIRST); await delayed.advance(1_500); await running
    assert.equal(lastReady(delayedChanges).view.cells[0].results[0].status, 'unavailable')
    slow.dispose()
  })
})
