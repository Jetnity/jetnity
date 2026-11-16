// Real private factory, queue, MA1 custody and strict native codecs; finite
// protocol doubles only. No hosted/source/publication success is asserted here.
import assert from 'node:assert/strict'
import { performance } from 'node:perf_hooks'
import { test } from 'node:test'
import { fixture, queueHarness, ids, METHOD } from '../monitor/test-support'
import type { V3ManagedJobRecord, V3QueueCommit } from '../monitor/queue'
import { readM04Command, type M04Claim, type M04Config } from '../jobs/contract'
import { createV3PostgresDurableJobs } from './authority-postgres'
import { readMa1CurrentRows } from './contract'

type Fault = 'revoked' | 'epoch_changed' | 'expired' | 'unknown' | 'blocked'
async function factory(options: { timed?: boolean; fault?: Fault; singleMethodLane?: boolean; methodMilliseconds?: number;
  observation?: (kind: 'method' | 'confirm', signal: AbortSignal) => Promise<void> } = {}) {
  const f = fixture(), h = queueHarness(), seeded = await h.queue.enqueue(f.enqueue)
  assert.equal(seeded.status, 'confirmed'); if (seeded.status !== 'confirmed') assert.fail('fixture')
  let record: V3ManagedJobRecord = seeded.record, epoch = 1, enabled = true, initialReads = 0, writes = 0, starts = 0, active = 0
  const operations = new Map<string, V3QueueCommit>(), origin = performance.now(), wall = Date.parse(h.clock.now())
  const now = () => new Date(wall + Math.floor(performance.now() - origin)).toISOString()
  const events: { operation: string; phase?: string; deadline: number; started: number; finished: number }[] = []
  const binding = { ...METHOD, methodDigest: 'a'.repeat(64), packageDigest: 'b'.repeat(64) }
  let firstMethod = true, firstConfirm = true, methodBusy = false, rejectedMethods = 0
  async function pause(milliseconds: number) { if (milliseconds) await new Promise<void>(done => setTimeout(done, milliseconds)) }
  const config: M04Config = {
    binding, registry: f.registry, clock: () => ({ now: now(), legalDate: '2026-11-09' }),
    methodExecutor: { async readCurrent(request, signal, budget) {
      assert.ok(budget)
      if (options.singleMethodLane && methodBusy) { rejectedMethods++; return { status: 'unavailable' } }
      methodBusy = true
      const event = { operation: 'method', deadline: budget.deadline, started: performance.now(), finished: 0 }
      events.push(event); active++
      try {
        if (firstMethod) { firstMethod = false; await options.observation?.('method', signal) }
        await pause(options.methodMilliseconds ?? (options.timed ? 600 : 0))
        const observedAt = now(), short = options.fault === 'expired'
        const rows = [{ status: enabled ? 'approved' : 'revoked', method_id: binding.methodId,
          revision: '1', method_digest: binding.methodDigest, package_digest: binding.packageDigest, epoch: String(epoch),
          approval_mode: !enabled ? null : short ? 'until' : 'until_revoked',
          approval_until: enabled && short ? new Date(Date.parse(observedAt) + 15).toISOString() : null,
          observed_at: observedAt, remaining_ms: !enabled ? '0' : short ? '15' : '5000' }]
        assert.equal(readMa1CurrentRows(rows, binding, request.checkedAt).ok, true, 'every negative fixture retains a valid MA1 row shape')
        return { status: 'rows', rows }
      } finally { event.finished = performance.now(); active--; methodBusy = false }
    } },
    jobsExecutor: { async executeFixed(request, signal) {
      const q = JSON.parse(request.operationText), body = q.body
      const event = { operation: q.operation as string, phase: q.phase as string, deadline: request.budget.deadline,
        started: performance.now(), finished: 0 }
      events.push(event); active++
      try {
        let reply: unknown
        if (q.operation === 'queue_confirm') {
          if (firstConfirm) { firstConfirm = false; await options.observation?.('confirm', signal) }
          await pause(options.timed ? 700 : 0)
          const command = readM04Command(body.command)!, prior = operations.get(command.operationId)
          reply = !prior ? { status: 'not_attempted' } : q.phase === 'probe' ? { status: 'requires_authority' }
            : { status: 'committed', operationId: command.operationId, commandKey: command.commandKey,
              commandText: command.commandText, envelopeText: JSON.stringify(prior), record: prior.next }
        } else if (q.operation === 'queue_read') {
          await pause(options.timed ? q.phase === 'probe' ? 600 : 900 : options.fault === 'expired' ? 25 : 0)
          if (q.phase === 'probe') reply = { status: 'requires_authority' }
          else {
            initialReads++
            if (initialReads === 1 && options.fault === 'unknown') return { status: 'unconfirmed' }
            reply = initialReads === 1 && options.fault === 'blocked' ? { status: 'blocked' } : { status: 'present', record }
            if (initialReads === 1 && options.fault === 'revoked') enabled = false
            if (initialReads === 1 && options.fault === 'epoch_changed') epoch++
          }
        } else if (q.operation === 'queue_cas') {
          await pause(options.timed ? 900 : 0)
          assert.equal(body.command.action, 'claim'); assert.deepEqual(body.commit.expected, record)
          record = body.commit.next; operations.set(body.commit.operationId, body.commit); writes++
          reply = { status: 'committed', record }
        } else if (q.operation === 'execution_read') {
          await pause(options.timed ? 600 : 0)
          reply = { status: 'absent' }
        } else {
          assert.equal(q.operation, 'execution_start'); starts++
          reply = { status: 'blocked' }
        }
        return { status: 'acknowledged', rows: [{ result: JSON.stringify(reply) }] }
      } finally { event.finished = performance.now(); active-- }
    } },
    intakeExecutor: { async execute() { assert.fail('no intake effect in this proof') } },
    producer: { async produce() { assert.fail('no source effect in this proof') } },
    evidence: { async inspect() { assert.fail('no evidence effect') }, async reprove() { assert.fail('no evidence effect') } },
    history: { async read() { assert.fail('no history effect') }, async reprove() { assert.fail('no history effect') } },
  }
  const claim: M04Claim = { operationId: ids('op3', 'real-factory-current-read'), leaseId: ids('lease3', 'real-factory-current-read'),
    jobKey: f.identity.jobKey, leaseMilliseconds: 30000 }
  const api = createV3PostgresDurableJobs(config)
  return { events, claim, record: () => record, writes: () => writes, starts: () => starts, active: () => active,
    rejectedMethods: () => rejectedMethods, resetObservations() { firstMethod = true; firstConfirm = true },
    run: (signal?: AbortSignal) => api.workOnce(claim, signal) }
}

test('original claim replay drains speculative MA1 before acquiring its own authority on the single physical method lane', async () => {
  const h = await factory({ singleMethodLane: true, methodMilliseconds: 25 })
  await h.run()
  const original = structuredClone(h.record()), before = h.events.length
  assert.equal(h.writes(), 1); assert.equal(h.starts(), 1)
  await h.run()
  assert.equal(h.rejectedMethods(), 0, 'the physical method pair is never requested concurrently')
  assert.equal(h.writes(), 1, 'replay reconciles the original commit without another CAS')
  assert.deepEqual(h.record(), original)
  assert.equal(h.starts(), 2, 'both invocations reach the unchanged blocked START double after claim verification')
  assert.equal(h.active(), 0)
  const replay = h.events.slice(before)
  const confirm = replay.find(e => e.operation === 'queue_confirm' && e.phase === 'probe')!
  const methods = replay.filter(e => e.operation === 'method')
  assert.ok(confirm.finished < methods[0].finished, 'the committed probe requires MA1 while speculation is in flight')
  assert.ok(methods[1].started >= methods[0].finished, 'replay performs a distinct real MA1 read after complete drain')
  const authorized = replay.find(e => e.operation === 'queue_confirm' && e.phase === 'authorized')!
  assert.ok(authorized.started >= methods[1].finished)
  assert.ok(authorized.deadline <= methods[1].deadline)
  assert.ok(authorized.finished < confirm.started + 5000, 'replay completes within the original claim budget')
})

test('aborted original replay still drains speculation and starts no replacement authority or effect', { timeout: 2000 }, async () => {
  let replay = false, entered!: () => void, release!: () => void
  const started = new Promise<void>(resolve => { entered = resolve })
  const held = new Promise<void>(resolve => { release = resolve })
  const h = await factory({ singleMethodLane: true, async observation(kind) {
    if (replay && kind === 'method') { entered(); await held }
  } })
  await h.run(); replay = true; h.resetObservations()
  const before = h.events.length, original = structuredClone(h.record()), controller = new AbortController()
  let settled = false
  const running = h.run(controller.signal).finally(() => { settled = true })
  try {
    await started
    await new Promise<void>(resolve => setImmediate(resolve))
    controller.abort()
    await new Promise<void>(resolve => setImmediate(resolve))
    assert.equal(settled, false, 'the actual speculative executor remains owned')
    assert.equal(h.active(), 1)
  } finally { release() }
  assert.notEqual((await running).status, 'complete')
  assert.equal(h.active(), 0); assert.equal(h.rejectedMethods(), 0)
  assert.equal(h.writes(), 1); assert.equal(h.starts(), 1); assert.deepEqual(h.record(), original)
  const events = h.events.slice(before)
  assert.equal(events.filter(e => e.operation === 'method').length, 1)
  assert.equal(events.some(e => e.operation === 'queue_confirm' && e.phase === 'authorized'), false)
})

test('the original five-second claim signal expires a waiting replay without a new authority window', { timeout: 10000 }, async () => {
  let replay = false, release!: () => void, expired!: () => void
  const held = new Promise<void>(resolve => { release = resolve })
  const aborted = new Promise<void>(resolve => { expired = resolve })
  const h = await factory({ singleMethodLane: true, async observation(kind, signal) {
    if (replay) {
      // The pending native confirmation is linked to the original queue signal;
      // the independent method's own effect timer is not that parent deadline.
      if (kind === 'confirm') signal.addEventListener('abort', expired, { once: true })
      await held
    }
  } })
  await h.run(); replay = true; h.resetObservations()
  const before = h.events.length, original = structuredClone(h.record())
  let settled = false
  const running = h.run().finally(() => { settled = true })
  try {
    await aborted
    assert.equal(settled, false, 'deadline cancellation still owns the pending native method')
  } finally { release() }
  await running
  assert.equal(h.active(), 0); assert.equal(h.rejectedMethods(), 0)
  assert.equal(h.writes(), 1); assert.equal(h.starts(), 1); assert.deepEqual(h.record(), original)
  const events = h.events.slice(before)
  assert.equal(events.filter(e => e.operation === 'method').length, 1, 'deadline does not create a fresh replay receipt')
  assert.equal(events.some(e => e.operation === 'queue_confirm' && e.phase === 'authorized'), false)
})

test('real M04 factory removes only the initial claim probe and duplicate resolve, retaining exact original custody', async () => {
  const h = await factory()
  await h.run()
  assert.equal(h.writes(), 1); assert.equal(h.starts(), 1); assert.equal(h.active(), 0)
  const cas = h.events.findIndex(e => e.operation === 'queue_cas'), confirm = h.events.findIndex(e => e.operation === 'queue_confirm')
  assert.deepEqual(h.events.slice(confirm, cas + 1).map(e => [e.operation, e.phase ?? null]), [
    ['queue_confirm', 'probe'], ['method', null], ['queue_read', 'authorized'], ['method', null], ['queue_cas', 'authorized'],
  ])
  assert.deepEqual(h.events.slice(cas + 1, cas + 3).map(e => [e.operation, e.phase ?? null]), [
    ['queue_read', 'authorized'], ['method', null],
  ], 'both actual final read and final real reproof still run')
  const original = h.events[confirm + 1], initial = h.events[confirm + 2], mutation = h.events[cas], final = h.events[cas + 1]
  assert.ok(initial.deadline <= original.deadline)
  assert.ok(mutation.deadline <= initial.deadline); assert.ok(final.deadline <= mutation.deadline)
  assert.ok(h.events.slice(confirm, cas + 3).every(e => e.finished < original.deadline))
  assert.equal(h.record().lease?.leaseId, h.claim.leaseId)
  assert.equal(h.record().lease && Date.parse(h.record().lease!.expiresAt) - Date.parse(h.record().lease!.acquiredAt), 30000)
})

for (const fault of ['revoked', 'epoch_changed', 'expired', 'unknown', 'blocked'] as const) {
  test(`real M04 current-read custody refuses ${fault} without a new claim or START`, async () => {
    const h = await factory({ fault })
    await h.run()
    assert.equal(h.writes(), 0); assert.equal(h.starts(), 0); assert.equal(h.active(), 0)
    assert.equal(h.record().state, 'queued')
    assert.equal(h.events.some(e => e.operation === 'queue_cas'), false)
    if (fault === 'expired' || fault === 'unknown' || fault === 'blocked') {
      assert.equal(h.events.filter(e => e.operation === 'method').length, 1, 'uncertain read never acquires replacement authority')
    }
  })
}

test('real M04 factory overlaps the two independent reads while a sequential claim would exceed its original 5s', { timeout: 15000 }, async t => {
  const h = await factory({ timed: true })
  await h.run()
  assert.equal(h.writes(), 1); assert.equal(h.starts(), 1); assert.equal(h.active(), 0)
  const begin = h.events.findIndex(e => e.operation === 'queue_confirm'), cas = h.events.findIndex(e => e.operation === 'queue_cas')
  const end = h.events[cas + 2], elapsed = end.finished - h.events[begin].started
  assert.equal(end.operation, 'method'); assert.ok(elapsed < 5000, `original 5s claim deadline: ${elapsed}ms`)
  const confirmation = h.events[begin], observation = h.events[begin + 1]
  const overlap = Math.min(confirmation.finished, observation.finished) - Math.max(confirmation.started, observation.started)
  assert.ok(overlap >= 500, `actual concurrent reads saved only ${overlap}ms`)
  const serialDuration = h.events.slice(begin, cas + 3).reduce((total, event) => total + event.finished - event.started, 0)
  assert.ok(serialDuration > 5000, `the unchanged serial operation set would take ${serialDuration}ms`)
  assert.equal(h.events.slice(begin, cas).filter(e => e.operation === 'queue_read' && e.phase === 'probe').length, 0)
  assert.equal(h.events.slice(begin, cas).filter(e => e.operation === 'method').length, 2, 'one new resolve and unchanged actual pre-CAS reproof')
  assert.ok(h.events[cas].deadline <= h.events[begin + 1].deadline)
  t.diagnostic(`Synthetic joined round trips, not a hosted acceptance: claim ${elapsed.toFixed(1)}ms; overlap ${overlap.toFixed(1)}ms; serial operation sum ${serialDuration.toFixed(1)}ms; all seven native calls and 5s/30s unchanged.`)
})

test('real factory owns both parallel native observations until their actual settlement after caller abort', { timeout: 2000 }, async () => {
  let ready!: () => void
  const entered = new Promise<void>(done => { ready = done })
  const holds = new Map<string, { release: () => void; signal: AbortSignal }>()
  const h = await factory({ async observation(kind, signal) {
    await new Promise<void>(release => {
      holds.set(kind, { release, signal })
      if (holds.size === 2) ready()
    })
  } })
  const controller = new AbortController()
  let settled = false
  const running = h.run(controller.signal).finally(() => { settled = true })
  try {
    await entered
    assert.equal(h.active(), 2)
    controller.abort()
    assert.ok([...holds.values()].every(held => held.signal.aborted))
    holds.get('confirm')!.release()
    await new Promise<void>(done => setImmediate(done))
    assert.equal(settled, false); assert.equal(h.active(), 1)
    assert.equal(h.writes(), 0); assert.equal(h.starts(), 0)
  } finally { for (const held of holds.values()) held.release() }
  assert.equal((await running).status, 'unconfirmed')
  assert.equal(h.active(), 0); assert.equal(h.writes(), 0); assert.equal(h.starts(), 0)
})
