import assert from 'node:assert/strict'
import { createHash } from 'node:crypto'
import { performance } from 'node:perf_hooks'
import { test } from 'node:test'
import { createV3QueueCoordinator, type V3QueueResult, type V3ManagedJobRecord } from '../monitor/queue'
import { fixture, queueHarness, ids, ref, METHOD } from '../monitor/test-support'
import { readM04Command, type M04Claim, type M04FixedOperation, type M04NativeReply } from './contract'
import { createM04QueueStorage } from './postgres'
import { chDeRefreshRequestIdentity, retainedChDeClaim, selectRetainedChDeClaim, guardRetainedChDeClaim } from './selected-claim'

type Selected = Extract<Awaited<ReturnType<typeof selectRetainedChDeClaim>>, { status: 'selected' }>
const signal = () => new AbortController().signal
function confirmed(value: V3QueueResult) {
  assert.equal(value.status, 'confirmed')
  if (value.status !== 'confirmed') assert.fail('not confirmed')
  return value.record
}
async function setup() {
  const f = fixture(), h = queueHarness()
  const root: M04Claim = { operationId: ids('op3', 'retained-root'), leaseId: ids('lease3', 'retained-root'),
    jobKey: f.identity.jobKey, leaseMilliseconds: 30000 }
  const cycle = chDeRefreshRequestIdentity(root)!
  confirmed(await h.queue.enqueue({ ...f.enqueue, ...cycle, attemptLimit: 4 }))
  let open = false
  const executions = new Map<string, M04NativeReply>(), calls: string[] = []
  const fixed: M04FixedOperation = async (request, child, receipt) => {
    calls.push(request.operation)
    if (request.operation === 'execution_read') return executions.get(request.body.claim.operationId)
      ?? { status: open ? 'blocked' : 'absent' }
    if (open) return { status: 'blocked' }
    if (request.operation === 'queue_read') {
      const row = await h.storage.read(request.body.jobKey)
      return row.status === 'ok' && row.record ? { status: 'present', record: row.record } : { status: 'absent' }
    }
    if (request.operation === 'queue_confirm') {
      const command = readM04Command(request.body.command)!
      const value = await h.storage.confirm(command.operationId, command.commandKey)
      return value.status === 'committed' ? { ...value, record: value.record as V3ManagedJobRecord, commandText: command.commandText } : value
    }
    if (request.operation === 'queue_cas') {
      if (!receipt) return { status: 'blocked' }
      const value = await h.storage.compareAndSwap(request.body.commit, { method: METHOD, receipt,
        reprove: async () => (await h.method.port.reproveAtCommit(receipt, METHOD, h.clock.now())).status === 'current' }, child)
      return value.status === 'committed' ? { ...value, record: value.record as V3ManagedJobRecord } : value
    }
    assert.fail('No START/producer is substituted by this queue proof')
  }
  async function select(override: Partial<Parameters<typeof selectRetainedChDeClaim>[0]> = {}) {
    return selectRetainedChDeClaim({ root, method: METHOD, attemptLimit: 4, fixed,
      now: h.clock.now, signal: signal(), deadline: performance.now() + 30000, ...override })
  }
  async function selected(override: Parameters<typeof select>[0] = {}): Promise<Selected> {
    const value = await select(override)
    if (value.status !== 'selected') assert.fail(value.status)
    return value
  }
  function claim(selection: Selected, dispatch = fixed) {
    const command = readM04Command({ action: 'claim', input: selection.claim })!
    const storage = createM04QueueStorage({ fixed: guardRetainedChDeClaim(selection, dispatch),
      commandFor: (op, key) => op === command.operationId && key === command.commandKey ? command : null,
      continuation: () => null, disposition: () => ({ kind: 'regular' }), onRecord() {}, settled() {} })
    return createV3QueueCoordinator({ ...h.options, storage, invocationMilliseconds: 5000 }).claim(selection.claim)
  }
  async function fail(job: V3ManagedJobRecord) {
    return confirmed(await h.queue.fail({ operationId: ids('op3', `retained-backoff-${job.revision}`),
      jobKey: root.jobKey, fence: { jobId: job.jobId, revision: job.revision,
        leaseId: job.lease!.leaseId, generation: job.lease!.generation }, reason: 'verification_unavailable' }))
  }
  function prepared(claim: M04Claim, completed = false) {
    const row = h.storage.records.get(root.jobKey)!
    assert.equal(row.state, 'leased')
    const value = { status: completed ? 'completed' : 'prepared', attemptKey: ref('execution-attempt', claim.operationId),
      claim, leasedJob: structuredClone(row), result: { kind: 'rule_research' as const,
        jobId: row.jobId, operationId: row.operationId, jobKey: root.jobKey, preparedAt: row.updatedAt,
        decisionRef: ref('source-decision', 'retained') }, references: [], ...(completed ? { job: row } : {}) }
    executions.set(claim.operationId, value as M04NativeReply)
    return value
  }
  return { f, h, root, cycle, fixed, select, selected, claim, fail, executions, calls, prepared,
    setOpen(value: boolean) { open = value } }
}

test('retained request identity keeps deployed enqueue bytes and bounded domain-separated claim IDs', () => {
  const root = { operationId: 'op3_' + 'a'.repeat(32), leaseId: 'lease3_' + 'b'.repeat(32),
    jobKey: fixture().identity.jobKey, leaseMilliseconds: 30000 }
  const digest = (kind: string) => createHash('sha256').update('jetnity.ch-de-refresh.' + kind + '.v1\n'
    + root.operationId + '\n' + root.leaseId).digest('hex').slice(0, 32)
  assert.deepEqual(chDeRefreshRequestIdentity(root), { operationId: 'op3_' + digest('enqueue'), jobId: 'job3_' + digest('job') })
  assert.deepEqual(retainedChDeClaim(root, 0), root)
  const claims = Array.from({ length: 5 }, (_, n) => retainedChDeClaim(root, n)!)
  assert.equal(new Set(claims.map(c => c.operationId)).size, 5)
  assert.equal(new Set(claims.map(c => c.leaseId)).size, 5)
  for (const [n, claim] of claims.entries()) {
    assert.deepEqual(retainedChDeClaim(structuredClone(root), n), claim)
    assert.equal(claim.leaseMilliseconds, 30000)
    assert.notEqual(claim.operationId.slice(4), claim.leaseId.slice(7))
  }
  for (const n of [-1, 5, 0.5, NaN, Infinity]) assert.equal(retainedChDeClaim(root, n), null)
})

test('expired UNSTARTED claim uses one ordinary CAS on the original job and preserves all original records', async () => {
  const t = await setup()
  const first = await t.selected()
  assert.deepEqual(first.claim, t.root)
  const original = confirmed(await t.claim(first)), saved = structuredClone(t.h.storage.operations.get(t.root.operationId))
  t.h.clock.advance(29999)
  assert.deepEqual((await t.selected()).claim, t.root)
  t.h.clock.advance(1)
  const next = await t.selected(), writes = t.h.storage.writes
  assert.equal(next.generation, 1)
  assert.deepEqual(next.predecessor, original)
  assert.deepEqual(next.claim, retainedChDeClaim(t.root, 1))
  const acquired = confirmed(await t.claim(next))
  assert.equal(t.h.storage.writes, writes + 1)
  assert.equal(t.h.storage.events.at(-1)?.kind, 'reclaimed')
  assert.equal(acquired.jobId, t.cycle.jobId)
  assert.equal(acquired.operationId, t.cycle.operationId)
  assert.equal(acquired.attempt, 2)
  assert.equal(acquired.predecessorRevision, original.revision)
  assert.equal(Date.parse(acquired.lease!.expiresAt) - Date.parse(acquired.lease!.acquiredAt), 30000)
  assert.deepEqual(t.h.storage.operations.get(t.root.operationId), saved)
  assert.ok(t.calls.every(call => !call.startsWith('execution_start')))
})

test('due confirmed backoff selects the next deterministic claim in the same retained cycle', async () => {
  const t = await setup(), first = confirmed(await t.claim(await t.selected()))
  const originalReceipt = structuredClone(t.h.storage.operations.get(t.root.operationId))
  t.h.clock.advance(1)
  const backoff = await t.fail(first)
  assert.equal(backoff.state, 'backoff')
  // A normal scheduler retry may arrive after the original acquired lease expired.
  t.h.clock.advance(60000)
  const writes = t.h.storage.writes, next = await t.selected()
  assert.equal(t.h.storage.writes, writes)
  assert.equal(next.generation, 1)
  assert.equal(next.acquiredRevision, backoff.revision + 1)
  assert.deepEqual(next.claim, retainedChDeClaim(t.root, 1))
  assert.deepEqual(next.predecessor, backoff)
  const acquired = confirmed(await t.claim(next))
  assert.equal(acquired.jobId, first.jobId)
  assert.equal(acquired.operationId, first.operationId)
  assert.equal(acquired.attempt, 2)
  assert.equal(acquired.predecessorRevision, backoff.revision)
  assert.equal(t.h.storage.writes, writes + 1)
  assert.deepEqual(t.h.storage.operations.get(t.root.operationId), originalReceipt)
  assert.ok(t.calls.every(call => !call.startsWith('execution_start')))
})

test('backoff remains closed before its exact due instant and exhausts at the original attempt limit', async () => {
  const t = await setup()
  for (let generation = 0; generation < 4; generation++) {
    const selection = await t.selected()
    assert.equal(selection.generation, generation)
    assert.deepEqual(selection.claim, retainedChDeClaim(t.root, generation))
    const leased = confirmed(await t.claim(selection)), failed = await t.fail(leased)
    if (generation === 3) {
      assert.equal(failed.state, 'exhausted')
      assert.deepEqual(await t.select(), { status: 'exhausted', job: failed })
      break
    }
    assert.equal(failed.state, 'backoff')
    const before = t.calls.length, writes = t.h.storage.writes
    t.h.clock.advance(Date.parse(failed.nextAttemptAt!) - Date.parse(t.h.clock.now()) - 1)
    assert.deepEqual(await t.select(), { status: 'unconfirmed' })
    assert.deepEqual(t.calls.slice(before), ['execution_read', 'queue_read'])
    assert.equal(t.h.storage.writes, writes)
    t.h.clock.advance(1)
  }
  assert.equal(t.h.storage.events.filter(event => event.kind === 'enqueued').length, 1)
  assert.equal(t.h.storage.events.filter(event => event.kind === 'leased').length, 4)
  assert.equal(t.h.storage.events.filter(event => event.kind === 'backoff').length, 3)
  assert.equal(t.h.storage.events.filter(event => event.kind === 'exhausted').length, 1)
})

test('a due backoff from another actual claim or job cycle cannot join the retained family', async t => {
  for (const boundary of ['first_claim', 'following_claim', 'later_cycle'] as const) await t.test(boundary, async () => {
    const h = await setup()
    if (boundary !== 'first_claim') {
      const original = confirmed(await h.claim(await h.selected()))
      if (boundary === 'later_cycle') {
        confirmed(await h.h.queue.complete({ operationId: ids('op3', 'previous-complete'), jobKey: h.root.jobKey,
          fence: { jobId: original.jobId, revision: original.revision, leaseId: original.lease!.leaseId,
            generation: original.lease!.generation }, decisionRef: ref('source-decision', 'previous-complete') }))
        confirmed(await h.h.queue.enqueue({ ...h.f.enqueue, operationId: ids('op3', 'backoff-later-enqueue'),
          jobId: ids('job3', 'backoff-later-cycle'), attemptLimit: 4 }))
      } else {
        await h.fail(original); h.h.clock.advance(1000)
      }
    }
    const rival = confirmed(await h.h.queue.claim({ ...h.root, operationId: ids('op3', 'foreign-backoff-claim'),
      leaseId: ids('lease3', 'foreign-backoff-claim') }))
    await h.fail(rival); h.h.clock.advance(60000)
    const writes = h.h.storage.writes
    assert.deepEqual(await h.select(), { status: 'unconfirmed' })
    assert.equal(h.h.storage.writes, writes)
  })
})

test('backoff requires exact original acquisition evidence, not an unclear confirmation or plausible row', async t => {
  for (const fault of ['blocked', 'unavailable', 'unconfirmed', 'collision', 'not_attempted',
    'wrong_operation', 'wrong_command', 'wrong_lease', 'wrong_revision', 'changed_cycle_field'] as const) {
    await t.test(fault, async () => {
      const h = await setup(), leased = confirmed(await h.claim(await h.selected()))
      await h.fail(leased); h.h.clock.advance(60000)
      const writes = h.h.storage.writes
      const fixed: M04FixedOperation = async (...args) => {
        const reply = await h.fixed(...args)
        if (args[0].operation !== 'queue_confirm' || reply.status !== 'committed') return reply
        if (fault === 'wrong_operation') return { ...reply, operationId: ids('op3', 'wrong-confirmation') }
        if (fault === 'wrong_command') return { ...reply, commandText: readM04Command({ action: 'claim',
          input: retainedChDeClaim(h.root, 1)! })!.commandText }
        if (fault === 'wrong_lease') return { ...reply, record: { ...reply.record,
          lease: { ...reply.record.lease!, leaseId: ids('lease3', 'wrong-confirmation') } } }
        if (fault === 'wrong_revision') return { ...reply, record: { ...reply.record, revision: reply.record.revision + 1 } }
        if (fault === 'changed_cycle_field') return { ...reply, record: { ...reply.record,
          createdAt: new Date(Date.parse(reply.record.createdAt) - 1).toISOString() } }
        return { status: fault }
      }
      assert.deepEqual(await h.select({ fixed }), { status: 'unconfirmed' })
      assert.equal(h.h.storage.writes, writes)
    })
  }
})

test('a real closed backoff proof cannot override an open or uncertain START', async t => {
  for (const boundary of ['open', 'unknown'] as const) await t.test(boundary, async () => {
    const h = await setup(), leased = confirmed(await h.claim(await h.selected()))
    await h.fail(leased); h.h.clock.advance(60000)
    if (boundary === 'open') h.setOpen(true)
    else h.executions.set(h.root.operationId, { status: 'unconfirmed' })
    const writes = h.h.storage.writes
    assert.deepEqual(await h.select(), { status: 'unconfirmed' })
    assert.equal(h.h.storage.writes, writes)
  })
})

test('backoff selection drains its original confirmation and obeys the same abort or deadline', async t => {
  for (const boundary of ['abort', 'deadline'] as const) await t.test(boundary, async () => {
    const h = await setup(), leased = confirmed(await h.claim(await h.selected()))
    await h.fail(leased); h.h.clock.advance(60000)
    const controller = new AbortController(), writes = h.h.storage.writes
    let entered = false, drained = false
    const fixed: M04FixedOperation = async (...args) => {
      const reply = await h.fixed(...args)
      if (args[0].operation === 'queue_confirm') {
        entered = true
        if (boundary === 'abort') controller.abort()
        await new Promise(resolve => setTimeout(resolve, boundary === 'deadline' ? 130 : 1))
        drained = true
      }
      return reply
    }
    assert.deepEqual(await h.select({ fixed, signal: controller.signal, deadline: performance.now() + 100 }),
      { status: 'unconfirmed' })
    assert.equal(entered, true)
    assert.equal(drained, true)
    assert.equal(h.h.storage.writes, writes)
  })
})

test('a selected backoff keeps its full private predecessor across atomic dispatch and CAS races', async t => {
  for (const boundary of ['atomic_expected', 'claim_race', 'start_race'] as const) await t.test(boundary, async () => {
    const h = await setup(), leased = confirmed(await h.claim(await h.selected()))
    const backoff = await h.fail(leased); h.h.clock.advance(60000)
    const selection = await h.selected(), writes = h.h.storage.writes
    if (boundary === 'atomic_expected') {
      const command = readM04Command({ action: 'claim', input: selection.claim })!
      let reached = false
      const guarded = guardRetainedChDeClaim(selection, async request => {
        assert.equal(request.operation, 'queue_claim')
        if (request.operation !== 'queue_claim') assert.fail('unexpected operation')
        assert.deepEqual(request.body.expected, backoff)
        assert.equal(request.body.replayOnly, false)
        reached = true
        return { status: 'unconfirmed' }
      })
      assert.deepEqual(await guarded({ operation: 'queue_claim', body: { command: command.value,
        continuation: null, expected: null, replayOnly: false } }, signal()), { status: 'unconfirmed' })
      assert.equal(reached, true)
    } else {
      let raced = false
      const fixed: M04FixedOperation = async (...args) => {
        if (args[0].operation === 'queue_cas' && !raced) {
          raced = true
          if (boundary === 'start_race') h.setOpen(true)
          else confirmed(await h.h.queue.claim({ ...h.root, operationId: ids('op3', 'backoff-race'),
            leaseId: ids('lease3', 'backoff-race') }))
        }
        return h.fixed(...args)
      }
      assert.notEqual((await h.claim(selection, fixed)).status, 'confirmed')
      assert.equal(raced, true)
    }
    assert.equal(h.h.storage.operations.has(selection.claim.operationId), false)
    assert.equal(h.h.storage.writes, writes + (boundary === 'claim_race' ? 1 : 0))
  })
})

test('lost follow-up claim ACK reselects its exact committed IDs and never repeats the CAS', async () => {
  const t = await setup()
  confirmed(await t.claim(await t.selected())); t.h.clock.advance(30000)
  const following = await t.selected()
  t.h.storage.loseNextResponse = true
  assert.equal((await t.claim(following)).status, 'unconfirmed')
  const writes = t.h.storage.writes, row = structuredClone(t.h.storage.records.get(t.root.jobKey))
  const resumed = await t.selected()
  assert.deepEqual(resumed.claim, following.claim)
  assert.equal(resumed.predecessor, null)
  confirmed(await t.claim(resumed))
  assert.equal(t.h.storage.writes, writes)
  assert.deepEqual(t.h.storage.records.get(t.root.jobKey), row)
})

test('retained original confirmation preserves the private authority drain through its exact claim guard', async () => {
  const t = await setup(), selected = await t.selected(), drain = async () => {}, child = signal()
  const command = readM04Command({ action: 'claim', input: selected.claim })!
  const calls: Parameters<M04FixedOperation>[] = []
  const guarded = guardRetainedChDeClaim(selected, async (...args) => {
    calls.push(args); return { status: 'not_attempted' }
  })
  const request = { operation: 'queue_confirm' as const, body: { command: command.value, continuation: null } }
  assert.deepEqual(await guarded(request, child, undefined, true, drain), { status: 'not_attempted' })
  assert.deepEqual(calls, [[request, child, undefined, true, drain]])
})

test('four acquisitions exhaust normally without a fifth START or another enqueue', async () => {
  const t = await setup()
  for (let generation = 0; generation < 4; generation++) {
    const next = await t.selected()
    assert.equal(next.generation, generation)
    assert.equal(confirmed(await t.claim(next)).attempt, generation + 1)
    t.h.clock.advance(30000)
  }
  const terminal = await t.selected()
  assert.equal(terminal.generation, 4)
  const exhausted = confirmed(await t.claim(terminal))
  assert.equal(exhausted.state, 'exhausted'); assert.equal(exhausted.attempt, 4)
  assert.deepEqual(await t.select(), { status: 'exhausted', job: exhausted })
  assert.equal(t.h.storage.events.filter(event => event.kind === 'enqueued').length, 1)
  assert.equal(t.h.storage.events.filter(event => event.kind === 'reclaimed').length, 3)
})

test('unknown START blocks every new claim even after expiry and repeated root resumes', async () => {
  const t = await setup()
  confirmed(await t.claim(await t.selected())); t.h.clock.advance(30000)
  const second = await t.selected(); confirmed(await t.claim(second))
  t.setOpen(true); t.h.clock.advance(30000)
  const writes = t.h.storage.writes
  for (let i = 0; i < 2; i++) assert.deepEqual(await t.select(), { status: 'unconfirmed' })
  assert.equal(t.h.storage.writes, writes)
  assert.equal(t.h.storage.records.get(t.root.jobKey)?.attempt, 2)
})

test('actual PREPARED following claim is found from unchanged root IDs while ordinary reads are blocked', async () => {
  const t = await setup()
  confirmed(await t.claim(await t.selected())); t.h.clock.advance(30000)
  const second = await t.selected(); confirmed(await t.claim(second))
  t.prepared(second.claim); t.setOpen(true); t.h.clock.advance(30000)
  const selected = await t.selected()
  assert.deepEqual(selected.claim, second.claim)
  assert.equal(selected.predecessor, null)
  const before = t.calls.length
  const command = readM04Command({ action: 'claim', input: retainedChDeClaim(t.root, 2)! })!
  assert.equal((await guardRetainedChDeClaim(selected, t.fixed)({ operation: 'queue_confirm',
    body: { command: command.value, continuation: null } }, signal())).status, 'blocked')
  assert.equal(t.calls.length, before)
})

test('completed following claim retains its real original result claim for publication', async () => {
  const t = await setup()
  confirmed(await t.claim(await t.selected())); t.h.clock.advance(30000)
  const second = await t.selected(), job = confirmed(await t.claim(second))
  const record = t.prepared(second.claim, true)
  const done = confirmed(await t.h.queue.complete({ operationId: ids('op3', 'complete-following'), jobKey: t.root.jobKey,
    fence: { jobId: job.jobId, revision: job.revision, leaseId: job.lease!.leaseId, generation: job.revision },
    decisionRef: ref('source-decision', 'completed-following') }))
  t.executions.set(second.claim.operationId, { ...record, status: 'completed', job: done } as M04NativeReply)
  const selected = await t.selected()
  assert.deepEqual(selected.claim, second.claim)
  assert.equal(selected.predecessor, null)
})

test('every uncertain negative read refuses expiry recovery instead of treating it as absent', async t => {
  for (const status of ['blocked', 'unavailable', 'unconfirmed', 'collision', 'not_attempted'] as const) {
    await t.test(status, async () => {
      const h = await setup()
      confirmed(await h.claim(await h.selected())); h.h.clock.advance(30000)
      h.executions.set(h.root.operationId, { status })
      const before = h.h.storage.writes
      assert.deepEqual(await h.select(), { status: 'unconfirmed' })
      assert.equal(h.h.storage.writes, before)
    })
  }
})

test('same-job/predecessor guard rejects a racing different lease and a later enqueued cycle', async t => {
  for (const replaceCycle of [false, true]) await t.test(String(replaceCycle), async () => {
    const h = await setup()
    confirmed(await h.claim(await h.selected())); h.h.clock.advance(30000)
    const selected = await h.selected()
    const rival = confirmed(await h.h.queue.claim({ ...h.root, operationId: ids('op3', 'rival'), leaseId: ids('lease3', 'rival') }))
    if (replaceCycle) {
      confirmed(await h.h.queue.complete({ operationId: ids('op3', 'rival-complete'), jobKey: h.root.jobKey,
        fence: { jobId: rival.jobId, revision: rival.revision, leaseId: rival.lease!.leaseId, generation: rival.revision },
        decisionRef: ref('source-decision', 'rival') }))
      confirmed(await h.h.queue.enqueue({ ...h.f.enqueue, operationId: ids('op3', 'later-enqueue'), jobId: ids('job3', 'later-cycle'), attemptLimit: 4 }))
    }
    const writes = h.h.storage.writes
    assert.notEqual((await h.claim(selected)).status, 'confirmed')
    assert.equal(h.h.storage.writes, writes)
    assert.deepEqual(await h.select(), { status: 'unconfirmed' })
  })
})

test('concurrent root resumes select the same following claim and commit at most once', async () => {
  const t = await setup()
  confirmed(await t.claim(await t.selected())); t.h.clock.advance(30000)
  const [left, right] = await Promise.all([t.selected(), t.selected()])
  assert.deepEqual(left.claim, right.claim)
  const writes = t.h.storage.writes
  await Promise.all([t.claim(left), t.claim(right)])
  assert.equal(t.h.storage.writes, writes + 1)
  assert.equal(t.h.storage.records.get(t.root.jobKey)?.attempt, 2)
})

test('atomic CAS races cannot replace the proven predecessor or ignore a newly opened START', async t => {
  for (const race of ['claim', 'start'] as const) await t.test(race, async () => {
    const h = await setup()
    confirmed(await h.claim(await h.selected())); h.h.clock.advance(30000)
    const selected = await h.selected(), before = h.h.storage.writes
    let raced = false
    const dispatch: M04FixedOperation = async (request, child, receipt, terminal) => {
      if (request.operation === 'queue_cas' && !raced) {
        raced = true
        if (race === 'start') h.setOpen(true)
        else confirmed(await h.h.queue.claim({ ...h.root, operationId: ids('op3', 'during-cas'), leaseId: ids('lease3', 'during-cas') }))
      }
      return h.fixed(request, child, receipt, terminal)
    }
    assert.notEqual((await h.claim(selected, dispatch)).status, 'confirmed')
    assert.equal(raced, true)
    assert.equal(h.h.storage.operations.has(selected.claim.operationId), false)
    assert.equal(h.h.storage.writes, before + (race === 'claim' ? 1 : 0))
  })
})

test('revocation, aborted scope and expired outer deadline cannot authorize a continuation', async () => {
  const t = await setup()
  confirmed(await t.claim(await t.selected())); t.h.clock.advance(30000)
  const selected = await t.selected(), before = t.h.storage.writes
  t.h.method.control.enabled = false
  assert.notEqual((await t.claim(selected)).status, 'confirmed')
  assert.equal(t.h.storage.writes, before)
  const controller = new AbortController(); controller.abort()
  assert.deepEqual(await t.select({ signal: controller.signal }), { status: 'unconfirmed' })
  assert.deepEqual(await t.select({ deadline: performance.now() - 1 }), { status: 'unconfirmed' })
})
