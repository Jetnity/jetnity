import assert from 'node:assert/strict'
import { test } from 'node:test'
import { fixtureLeasedJob, fixturePrepared, fixtureVerification } from '../../../../scripts/db/official-truth-v3-background-guard-1/fixtures'
import { AA_BERN_CH_DE_REVIEWED_PROGRAM as program } from '../source/aa-ch-de-reviewed-program'
import { AA_CH_DE_DELIVERY_PRODUCER } from '../source/aa-ch-de-delivery-producer'
import { readV3RetainableProposal } from '../storage/proposal-bytes'
import { hrs1Clock, hrs1Hash } from '../result/contract'
import { createChDeSnapshotQuery } from './ch-de-snapshot'

const at = '2026-11-14T01:00:00.000Z', horizon = '2026-11-14T01:00:00.500Z'
const input = { destinationCountryCode: 'DE', citizenshipCountryCodes: ['CH'] }
async function projection() {
  const job = fixtureLeasedJob(at); assert.ok(job.lease)
  const result = await AA_CH_DE_DELIVERY_PRODUCER.produce({ job, fence: { jobId: job.jobId, revision: job.revision,
    leaseId: job.lease.leaseId, generation: job.lease.generation } }, new AbortController().signal)
  assert.equal(result.status, 'delivered'); assert.ok(result.status === 'delivered')
  const upload = readV3RetainableProposal(result.deliveries[0]!.text, program.registry); assert.ok(upload.ok)
  const fixture = fixturePrepared(upload.value, fixtureVerification(at))
  assert.equal(fixture.prepared.proposalDisposition, 'matched', 'actual producer and verified local fixture have the same fact')
  return fixture.projection
}
function fixture(value: unknown) {
  let now = at, approved = true, release: (() => void) | undefined, held = false
  const effects: string[] = [], receipt = Object.freeze({}), stop = new AbortController()
  const query = createChDeSnapshotQuery({ binding: program.binding, registry: program.registry,
    clock: () => hrs1Clock(now, program.legalTimeZone)!,
    authority: { async resolveCurrent() { effects.push('method'); return approved ? { status: 'approved', receipt } : { status: 'not_approved' } },
      async reproveAtCommit() { assert.fail('snapshot has no third native effect') } },
    fixed: async (command, signal, selected) => {
      assert.equal(selected, receipt); assert.equal(signal, stop.signal)
      assert.deepEqual(command, { schema: 1, operation: 'ch_de_snapshot', bindingHash: hrs1Hash(program.binding), body: {} })
      effects.push('snapshot'); if (held) await new Promise<void>(resolve => { release = resolve })
      return { status: 'snapshot', value }
    } })
  return { query, effects, stop, clock(value: string) { now = value }, refuse() { approved = false }, hold() { held = true },
    release() { assert.ok(release); release() } }
}
test('accepted fixed snapshot preserves source display and an unforgeable absolute post-drain horizon', async () => {
  const p = await projection(), f = fixture({ schema: 1, status: 'accepted', observedAt: at, validUntil: horizon, projection: p })
  const result = await f.query.query(input, f.stop.signal)
  assert.equal(result.ok, true); assert.ok(result.ok)
  assert.equal(result.answer.response.cells[0]!.results[0]!.status, 'accepted')
  assert.ok(result.answer.sources[p.reference]); assert.deepEqual(f.effects, ['method', 'snapshot'])
  assert.equal(f.query.current(JSON.parse(JSON.stringify(result))), false)
  assert.equal(f.query.current(result), true); f.clock(horizon); assert.equal(f.query.current(result), false)
})
test('missing, withdrawal and conflict keep truthful distinct outcomes without a pending claim', async () => {
  for (const [status, extra, expected] of [
    ['missing', {}, 'unavailable'], ['unavailable', {}, 'unavailable'],
    ['conflict', { decisionRef: 'source-decision:v3:' + 'a'.repeat(64), reason: 'comparable_conflict' }, 'conflict'],
  ] as const) {
    const f = fixture({ schema: 1, status, observedAt: at, validUntil: horizon, ...extra })
    const result = await f.query.query(input, f.stop.signal); assert.ok(result.ok)
    assert.equal(result.answer.response.cells[0]!.results[0]!.status, expected)
    assert.equal(JSON.stringify(result).includes('pending'), false); assert.deepEqual(f.effects, ['method', 'snapshot'])
  }
})
test('wrong selection and absent authority perform no snapshot I/O', async () => {
  const f = fixture({}); assert.equal((await f.query.query({ ...input, destinationCountryCode: 'FR' }, f.stop.signal)).ok, false)
  assert.deepEqual(f.effects, []); f.refuse(); assert.equal((await f.query.query(input, f.stop.signal)).ok, false)
  assert.deepEqual(f.effects, ['method'])
})
test('malformed, future, elapsed or cross-context data cannot become a visitor answer', async () => {
  const p = await projection()
  const good = { schema: 1, status: 'accepted', observedAt: at, validUntil: horizon, projection: p }
  for (const value of [{ ...good, extra: 'private' }, { ...good, observedAt: horizon }, { ...good, validUntil: at },
    { ...good, projection: { ...p, rule: { ...p.rule, method: { methodId: 'other', revision: 1 } } } },
    { ...good, status: 'pending' }, { ...good, schema: 2 }, null]) {
    const f = fixture(value); assert.equal((await f.query.query(input, f.stop.signal)).ok, false)
  }
})
test('actual awaited snapshot is joined on abort and is rejected if its horizon ends before drain', async () => {
  for (const mode of ['abort', 'expire'] as const) {
    const f = fixture({ schema: 1, status: 'missing', observedAt: at, validUntil: horizon }); f.hold()
    let settled = false; const pending = f.query.query(input, f.stop.signal).finally(() => { settled = true })
    while (f.effects.length !== 2) await new Promise<void>(resolve => setImmediate(resolve))
    if (mode === 'abort') f.stop.abort(); else f.clock(horizon)
    assert.equal(settled, false); f.release(); assert.equal((await pending).ok, false)
  }
})
