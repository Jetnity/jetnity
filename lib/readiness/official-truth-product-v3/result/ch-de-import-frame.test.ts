import assert from 'node:assert/strict'
import { test } from 'node:test'
import { fixtureLeasedJob } from '../../../../scripts/db/official-truth-v3-background-guard-1/fixtures'
import { AA_BERN_CH_DE_REVIEWED_PROGRAM as program } from '../source/aa-ch-de-reviewed-program'
import { createChDeImportFrame } from './ch-de-import-frame'
import { createHrs1ResultPorts } from './postgres'
import { createHrs1SourceConsumer } from './source-proof'
import { hrs1Clock, hrs1Hash, hrs1Ref, type Hrs1Operation, type Hrs1Verification } from './contract'

const at = '2026-11-14T01:00:00.000Z'
const sequence: Hrs1Operation[] = ['history', 'attest', 'history']
// This frame test models only the exact bytes/ACK pair. Source-semantic tests
// independently obtain the full genuine issuer verification.
const attested = Object.freeze({ reference: hrs1Ref('hrs1-verification', 'frame-ack') }) as Hrs1Verification
const initialSnapshot = () => ({
  history: { pointer: { revision: 0, state: 'missing' as const, versionRef: null }, version: null,
    decision: null, decisionPredecessor: null, decisionArchiveAppend: null, invalidatedProjectionRefs: [] },
  head: { pointer: { revision: 0, state: 'missing' as const, versionRef: null }, sourceDecisionRef: null, historyArchive: null },
  stickyDecision: null, suppressionEpoch: 0, generation: 0, suppression: null,
})
const clock = () => { const value = hrs1Clock(at, program.legalTimeZone); assert.ok(value); return value }
const request = () => ({ context: program.context, contextKey: program.contextKey, factKind: 'requirement_effect' as const,
  references: [program.source, program.counter.source].map(source => ({ sourceId: source.sourceId,
    contentItemId: source.contentItemId, representationId: source.representationId })), method: program.method,
  clock: clock(), previousDecision: null, decisionRef: hrs1Ref('source-decision', { test: 'frame', at }) })
function fixture() {
  const stop = new AbortController(), i1 = new AbortController(), receipt = Object.freeze({}), effects: string[] = []
  let snapshot: unknown = initialSnapshot()
  let current = true, release: (() => void) | null = null, hold = false, holdReproof = false
  const frame = createChDeImportFrame({ binding: program.binding, job: fixtureLeasedJob(), signal: stop.signal,
    authority: { async resolveCurrent() { effects.push('method_read'); return { status: 'approved', receipt } },
      async reproveAtCommit(candidate) {
        assert.equal(candidate, receipt); effects.push('method_reproof')
        if (holdReproof) await new Promise<void>(resolve => { release = resolve })
        return { status: current ? 'current' : 'revoked' }
      } },
    fixed: async (command, signal, candidate) => {
      assert.equal(candidate, receipt); effects.push(command.operation)
      if (hold) await new Promise<void>(resolve => { release = resolve })
      return signal.aborted || !current ? { status: 'unavailable' } : command.operation === 'attest'
        ? { status: 'recorded', value: { reference: attested.reference, digest: hrs1Hash(attested) } }
        : { status: 'snapshot', value: snapshot }
    } })
  assert.ok(frame)
  const call = (operation: Hrs1Operation, candidate?: object, signal = i1.signal) => frame.fixed({ schema: 1, operation,
    bindingHash: hrs1Hash(program.binding), body: operation === 'history' ? { contextKey: program.contextKey, factKind: program.binding.factKind }
      : operation === 'attest' ? { kind: 'verification', verification: attested } : {} }, signal, candidate)
  const start = async () => {
    const result = await frame.authority.resolveCurrent(program.method, at)
    assert.deepEqual(result, { status: 'approved', receipt })
    assert.equal(frame.admitImportSignal(i1.signal, true), true)
  }
  const take = (signal = i1.signal) => frame.takeInitialHistory(request(), signal)
  const takeAttest = () => frame.takeAttestedVerification(attested, i1.signal)
  const steps = async () => { await call('history'); assert.ok(take()); await call('attest'); assert.equal(takeAttest(), true); await call('history') }
  return { frame, stop, i1, receipt, effects, call, start, take, takeAttest, steps,
    setSnapshot(value: unknown) { snapshot = value }, changed() { current = false }, hold() { hold = true },
    holdReproof() { holdReproof = true }, release() { assert.ok(release); release() } }
}
test('one private I1 receipt and explicit snapshot/attest handoffs retain three real HRS calls and final reproof', async () => {
  const f = fixture(); await f.start(); await f.steps()
  assert.deepEqual(await f.frame.authority.reproveAtCommit(f.receipt, program.method, at), { status: 'current' })
  assert.deepEqual(f.effects, ['method_read', ...sequence, 'method_reproof'])
  assert.equal(f.effects.length + 2, 7, 'two genuine S1 effects plus five forwarded effects after the original handoff; no native timing claim')
  assert.equal((await f.call('history')).status, 'unavailable')
  assert.equal((await f.frame.authority.resolveCurrent(program.method, at)).status, 'unavailable')
})
test('early source ownership is never opened before positive MA1 and refuses an ownership-start failure', async () => {
  for (const status of ['not_approved', 'unavailable', 'approved'] as const) {
    const owner = new AbortController(), i1 = new AbortController(), receipt = Object.freeze({})
    let starts = 0, fixedCalls = 0
    const frame = createChDeImportFrame({ binding: program.binding, job: fixtureLeasedJob(), signal: owner.signal,
      authority: {
        async resolveCurrent() { return status === 'approved' ? { status, receipt } : { status } },
        async reproveAtCommit() { assert.fail('an unowned source start cannot reach final authority') },
      },
      fixed: async () => { fixedCalls++; return { status: 'unavailable' } },
      async ownSourceRead() { starts++; throw new Error('source_ownership_refused') },
    })
    assert.ok(frame)
    assert.equal(starts, 0)
    await frame.authority.resolveCurrent(program.method, at)
    assert.equal(starts, 0, 'MA1 approval alone does not choose an import signal')
    assert.equal(frame.admitImportSignal(i1.signal, true), status === 'approved')
    await Promise.resolve()
    assert.equal(starts, status === 'approved' ? 1 : 0)
    assert.equal((await frame.fixed({ schema: 1, operation: 'history', bindingHash: hrs1Hash(program.binding),
      body: { contextKey: program.contextKey, factKind: program.binding.factKind } }, i1.signal)).status, 'unavailable')
    assert.equal(fixedCalls, 0, 'a failed owner cannot leave a source branch detached from this frame')
    frame.close(); owner.abort(); i1.abort()
  }
})
test('foreign receipts, missing initial read, extra/wrong operations and a different import cannot inherit custody', async () => {
  const first = fixture(), second = fixture()
  assert.equal((await first.call('history')).status, 'unavailable'); assert.equal(first.effects.length, 0)
  await first.start()
  await second.start()
  assert.equal((await first.call('history', second.receipt)).status, 'unavailable')
  assert.equal((await first.call('transition')).status, 'unavailable')
  assert.deepEqual(first.effects, ['method_read'])
  await first.call('history'); first.frame.close()
  assert.equal((await first.call('history')).status, 'unavailable')
  assert.equal((await second.call('history')).status, 'snapshot')
  second.frame.close()
})
test('changed lower authority and aborted work refuse without detached completion or later stages', async () => {
  const f = fixture(); await f.start()
  await f.call('history'); assert.ok(f.take()); f.changed()
  assert.equal((await f.call('attest')).status, 'unavailable')
  assert.equal((await f.call('attest')).status, 'unavailable')
  const g = fixture(); await g.start(); g.hold()
  let settled = false
  const pending = g.call('history').finally(() => { settled = true })
  await Promise.resolve(); g.stop.abort(); await Promise.resolve()
  assert.equal(settled, false, 'abort never detaches the admitted native operation')
  g.release(); assert.equal((await pending).status, 'unavailable')
  assert.equal((await g.call('history')).status, 'unavailable')
  assert.deepEqual(g.effects, ['method_read', 'history'])
})
test('synthetic or changed program bindings never enable the selected I1 frame', () => {
  const no = { async resolveCurrent() { assert.fail('unexpected I/O') }, async reproveAtCommit() { assert.fail('unexpected I/O') } }
  for (const binding of [{ ...program.binding, dataMode: 'synthetic_test' as const }, { ...program.binding, revision: 2 },
    { ...program.binding, sourceMaxAgeMilliseconds: program.binding.sourceMaxAgeMilliseconds + 1 }]) {
    assert.equal(createChDeImportFrame({ binding, job: fixtureLeasedJob(), signal: new AbortController().signal, authority: no,
      fixed: async () => assert.fail('unexpected I/O') }), null)
  }
})
test('final reproof joins its actual call and refuses close, abort or a concurrent final call', async () => {
  for (const mode of ['close', 'abort', 'parallel'] as const) {
    const f = fixture(); await f.start(); await f.steps()
    f.holdReproof(); let settled = false
    const pending = f.frame.authority.reproveAtCommit(f.receipt, program.method, at).finally(() => { settled = true })
    await Promise.resolve()
    if (mode === 'close') f.frame.close()
    else if (mode === 'abort') f.stop.abort()
    else assert.equal((await f.frame.authority.reproveAtCommit(f.receipt, program.method, at)).status, 'unavailable')
    assert.equal(settled, false); f.release(); assert.equal((await pending).status, 'unavailable')
    assert.equal(f.effects.filter(name => name === 'method_reproof').length, 1)
  }
})

test('initial history is complete, detached and transferable exactly once before attest', async () => {
  const f = fixture(), snapshot = initialSnapshot()
  f.setSnapshot(snapshot); await f.start(); await f.call('history')
  snapshot.suppressionEpoch = 4; snapshot.generation = 3
  const transferred = f.take(); assert.ok(transferred)
  assert.deepEqual(transferred, initialSnapshot(), 'later mutation of a reply cannot rewrite the held snapshot')
  assert.ok(Object.isFrozen(transferred) && Object.isFrozen(transferred.history))
  assert.equal(f.take(), null)
  assert.equal((await f.call('attest')).status, 'unavailable')

  const before = fixture(); await before.start()
  assert.equal(before.take(), null); assert.deepEqual(before.effects, ['method_read'])
  const missing = fixture(); await missing.start(); await missing.call('history')
  assert.equal((await missing.call('attest')).status, 'unavailable', 'a missing transfer cannot be silently skipped')
  assert.equal((await missing.frame.authority.reproveAtCommit(missing.receipt, program.method, at)).status, 'unavailable')
})

test('only the exact completed attest ACK transfers once, before final history and while the I1 signal lives', async () => {
  for (const mode of ['missing', 'foreign', 'replay', 'abort', 'pending'] as const) {
    const f = fixture(); await f.start(); await f.call('history'); assert.ok(f.take())
    if (mode === 'pending') {
      f.hold()
      const pending = f.call('attest')
      try {
        await Promise.resolve()
        assert.equal(f.takeAttest(), false, 'no transfer before the real operation settles')
      } finally { f.release(); await pending }
    } else {
      await f.call('attest')
      if (mode === 'foreign') assert.equal(f.frame.takeAttestedVerification({ ...attested, reference: 'foreign' }, f.i1.signal), false)
      if (mode === 'replay') { assert.equal(f.takeAttest(), true); assert.equal(f.takeAttest(), false) }
      if (mode === 'abort') { f.i1.abort(); assert.equal(f.takeAttest(), false) }
    }
    assert.equal((await f.call('history')).status, 'unavailable')
    assert.equal((await f.frame.authority.reproveAtCommit(f.receipt, program.method, at)).status, 'unavailable')
    assert.equal(f.effects.filter(x => x === 'history').length, 1)
  }
})

test('only the original I1 signal binds the first history, independently of its live worker parent', async () => {
  const premature = fixture(); await premature.frame.authority.resolveCurrent(program.method, at)
  assert.equal(premature.frame.admitImportSignal(premature.i1.signal, false), false)
  const foreign = fixture(); await foreign.start(); await foreign.call('history')
  assert.equal(foreign.frame.admitImportSignal(new AbortController().signal, false), false)
  assert.equal(foreign.stop.signal.aborted, false); assert.equal(foreign.take(), null)
  assert.equal((await foreign.call('attest')).status, 'unavailable')
  const parallel = fixture(); await parallel.start()
  assert.equal(parallel.frame.admitImportSignal(parallel.i1.signal, true), false)
  assert.equal((await parallel.call('history')).status, 'unavailable')
})

test('late initial history and transfer during pending work cannot outlive the exact I1 signal', async () => {
  for (const mode of ['abort', 'parallel-transfer'] as const) {
    const f = fixture(); await f.start(); f.hold()
    let settled = false
    const pending = f.call('history').finally(() => { settled = true })
    await Promise.resolve()
    if (mode === 'abort') f.i1.abort()
    else assert.equal(f.take(), null)
    assert.equal(f.stop.signal.aborted, false); assert.equal(settled, false)
    f.release(); assert.equal((await pending).status, 'unavailable')
    assert.equal(f.take(), null); assert.equal((await f.call('attest')).status, 'unavailable')
    assert.deepEqual(f.effects, ['method_read', 'history'])
  }
})

test('foreign request context, method, start clock or predecessor cannot take the snapshot', async () => {
  for (const change of [
    { contextKey: hrs1Ref('official-truth-context', 'foreign') },
    { context: { ...program.context, route: 'unresolved' } },
    { method: { ...program.method, revision: program.method.revision + 1 } },
    { clock: { ...clock(), now: '2026-11-14T01:00:00.001Z' } },
    { previousDecision: {} },
  ]) {
    const f = fixture(); await f.start(); await f.call('history')
    assert.equal(f.frame.takeInitialHistory({ ...request(), ...change } as ReturnType<typeof request>, f.i1.signal), null)
    assert.equal((await f.call('attest')).status, 'unavailable')
  }
})

test('the final genuine history reproof still rejects full-snapshot drift and suppression ABA', async () => {
  for (const change of [
    { generation: 1 }, { suppressionEpoch: 2 }, { suppression: { suppressed: true } },
    { stickyDecision: { reference: 'changed' } },
    { head: { ...initialSnapshot().head, sourceDecisionRef: 'changed' } },
  ]) {
    const f = fixture(); await f.start()
    const source = createHrs1SourceConsumer({ binding: program.binding, registry: program.registry, fixed: f.frame.fixed, clock })
    const ports = createHrs1ResultPorts({ binding: program.binding, registry: program.registry, fixed: f.frame.fixed, clock, source,
      ids: () => ({ jobId: 'job3_' + '1'.repeat(32), operationId: 'op3_' + '2'.repeat(32) }) })
    const first = await ports.history.read(program.contextKey, program.binding.factKind, f.i1.signal)
    assert.equal(first.status, 'snapshot'); if (first.status !== 'snapshot') assert.fail('initial history')
    assert.ok(f.take()); await f.call('attest'); assert.equal(f.takeAttest(), true)
    f.setSnapshot({ ...initialSnapshot(), ...change })
    assert.deepEqual(await ports.history.reprove(first.receipt, first.history, f.i1.signal), { status: 'changed' })
    assert.deepEqual(f.effects, ['method_read', ...sequence], 'final history is a real new call, not the transferred snapshot')
  }
})
