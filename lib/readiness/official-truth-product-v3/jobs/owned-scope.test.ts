import assert from 'node:assert/strict'
import { test } from 'node:test'
import { createM04LanePool, createM04InvocationScope } from './owned-scope'
function deferred<T>() { let resolve!: (value: T) => void; const promise = new Promise<T>(r => { resolve = r }); return { promise, resolve } }
const tick = () => new Promise<void>(resolve => setImmediate(resolve))

test('actual native promise owns its lane after abort until terminal drain', async () => {
  const pool = createM04LanePool(), controller = new AbortController(), scope = createM04InvocationScope(pool, 5000, controller.signal)!
  const terminal = deferred<number>(), run = scope.native('jobs', 'processing', () => terminal.promise)
  await tick(); controller.abort()
  let finished = false; const finish = scope.finish().then(() => { finished = true })
  await tick(); assert.equal(finished, false); assert.equal(pool.snapshot().jobs, 1)
  terminal.resolve(7); assert.deepEqual(await run, { ok: true, value: 7 }); await finish
  assert.equal(pool.snapshot().occupied, 0); assert.equal(pool.snapshot().jobs, 0)
})

test('pending history-style callback retires lane; terminal delivery alone is insufficient', async () => {
  const pool = createM04LanePool(), scope = createM04InvocationScope(pool, 5000)!
  const terminal = deferred<number>(), pending = scope.callback('processing', () => terminal.promise)
  await tick(); await scope.callback('processing', async () => 'delivery-ended')
  scope.sealProcessing(); assert.equal(scope.processingTerminal(), false)
  await scope.finish(); assert.equal(pool.snapshot().occupied, 1); assert.deepEqual(await pending, { ok: false })
  assert.deepEqual(await scope.native('intake', 'processing', async () => 'late'), { ok: false })
  terminal.resolve(9); await tick(); assert.equal(pool.snapshot().occupied, 0)
})

test('all four retired lanes exhaust availability without TTL and later callbacks cannot execute SQL', async () => {
  const pool = createM04LanePool(), gates = [], scopes = []
  for (let i = 0; i < 4; i++) {
    const scope = createM04InvocationScope(pool, 5000)!, gate = deferred<number>()
    scopes.push(scope); gates.push(gate)
    void scope.callback('processing', async () => { await gate.promise; assert.equal(scope.admits('outer'), false); return 1 })
  }
  await tick(); for (const scope of scopes) await scope.finish()
  assert.equal(createM04InvocationScope(pool, 5000), null)
  for (const gate of gates) gate.resolve(1)
  await tick(); assert.equal(pool.snapshot().occupied, 0)
})

test('256 cumulative native admissions preserve sixteen terminal admissions while unresolved', async () => {
  const pool = createM04LanePool(), scope = createM04InvocationScope(pool, 5000)!
  scope.markUnresolved()
  for (let i = 0; i < 240; i++) assert.equal((await scope.native('jobs', 'outer', async () => 1)).ok, true)
  assert.equal((await scope.native('jobs', 'outer', async () => 1)).ok, false)
  assert.equal((await scope.native('jobs', 'outer', async () => 1, undefined, true)).ok, false, 'boolean alone cannot consume reserve')
  scope.sealProcessing()
  assert.equal(scope.beginTerminal({ claim: { operationId: 'op3_' + 'a'.repeat(32), jobKey: 'research-job:v3:' + 'a'.repeat(64), leaseId: 'lease3_' + 'a'.repeat(32), leaseMilliseconds: 1000 }, attemptKey: 'execution-attempt:v3:' + 'b'.repeat(64), commandKey: 'queue-command:v3:' + 'c'.repeat(64) }), true)
  assert.equal((await scope.native('intake', 'outer', async () => 1, undefined, true)).ok, false)
  for (let i = 0; i < 16; i++) assert.equal((await scope.native('jobs', 'outer', async () => 1, undefined, true)).ok, true)
  assert.equal((await scope.native('jobs', 'outer', async () => 1, undefined, true)).ok, false)
  await scope.finish()
})

test('sealing original processing permits separately outer-owned later import callbacks', async () => {
  const pool = createM04LanePool(), scope = createM04InvocationScope(pool, 5000)!
  await scope.callback('processing', async () => 'producer')
  scope.sealProcessing(); assert.equal(scope.processingTerminal(), true)
  assert.equal((await scope.callback('processing', async () => 'late')).ok, false)
  assert.deepEqual(await scope.callback('outer', async () => 'later E1 reproof'), { ok: true, value: 'later E1 reproof' })
  assert.equal(scope.snapshot().callbackTotal, 2); await scope.finish()
})
