import assert from 'node:assert/strict'
import { test } from 'node:test'
import { fixtureLeasedJob } from '../../../../scripts/db/official-truth-v3-background-guard-1/fixtures'
import { AA_BERN_CH_DE_REVIEWED_PROGRAM as program } from '../source/aa-ch-de-reviewed-program'
import { createChDeImportFrame } from './ch-de-import-frame'
import { hrs1Hash, type Hrs1Operation } from './contract'

const at = '2026-11-14T01:00:00.000Z'
const sequence: Hrs1Operation[] = ['history', 'history', 'attest', 'evidence', 'history']
function fixture() {
  const stop = new AbortController(), receipt = Object.freeze({}), effects: string[] = []
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
      return signal.aborted || !current ? { status: 'unavailable' } : { status: 'snapshot', value: {} }
    } })
  assert.ok(frame)
  const call = (operation: Hrs1Operation, candidate?: object) => frame.fixed({ schema: 1, operation, bindingHash: hrs1Hash(program.binding), body: {} }, stop.signal, candidate)
  return { frame, stop, receipt, effects, call, changed() { current = false }, hold() { hold = true },
    holdReproof() { holdReproof = true }, release() { assert.ok(release); release() } }
}
test('one private I1 receipt replaces only five method preludes, retaining the final real reproof', async () => {
  const f = fixture(); assert.deepEqual(await f.frame.authority.resolveCurrent(program.method, at), { status: 'approved', receipt: f.receipt })
  for (const operation of sequence) await f.call(operation)
  assert.deepEqual(await f.frame.authority.reproveAtCommit(f.receipt, program.method, at), { status: 'current' })
  assert.deepEqual(f.effects, ['method_read', ...sequence, 'method_reproof'])
  assert.equal(f.effects.length + 3, 10, 'three unchanged S1 effects plus seven actual forwarded effects; no claim of native timing')
  assert.equal((await f.call('history')).status, 'unavailable')
  assert.equal((await f.frame.authority.resolveCurrent(program.method, at)).status, 'unavailable')
})
test('foreign receipts, missing initial read, extra/wrong operations and a different import cannot inherit custody', async () => {
  const first = fixture(), second = fixture()
  assert.equal((await first.call('history')).status, 'unavailable'); assert.equal(first.effects.length, 0)
  await first.frame.authority.resolveCurrent(program.method, at)
  await second.frame.authority.resolveCurrent(program.method, at)
  assert.equal((await first.call('history', second.receipt)).status, 'unavailable')
  assert.equal((await first.call('transition')).status, 'unavailable')
  assert.deepEqual(first.effects, ['method_read'])
  await first.call('history'); first.frame.close()
  assert.equal((await first.call('history')).status, 'unavailable')
  assert.equal((await second.call('history')).status, 'snapshot')
  second.frame.close()
})
test('changed lower authority and aborted work refuse without detached completion or later stages', async () => {
  const f = fixture(); await f.frame.authority.resolveCurrent(program.method, at)
  await f.call('history'); f.changed()
  assert.equal((await f.call('history')).status, 'unavailable')
  assert.equal((await f.call('attest')).status, 'unavailable')
  const g = fixture(); await g.frame.authority.resolveCurrent(program.method, at); g.hold()
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
    const f = fixture(); await f.frame.authority.resolveCurrent(program.method, at)
    for (const operation of sequence) await f.call(operation)
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
