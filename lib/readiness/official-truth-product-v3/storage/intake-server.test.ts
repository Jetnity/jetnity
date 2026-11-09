import assert from 'node:assert/strict'
import { describe, test } from 'node:test'
import { s1Fixture } from '../../../../scripts/db/official-truth-v3-intake-store-1/fixtures'
import { sha256Hex } from '@/lib/readiness/digest'
import { readV3ProposalUpload } from '../import/interface'
import type { V3ImportAudit, V3ImportOutcome } from '../import/service-server'
import { createV3ProposalIntakeStore, proposalIntakeProduction } from './intake-server'
import { createV3PostgresQuarantineBackend, type V3IntakeSqlExecutor } from './quarantine-postgres'
import type { V3IntakeReference } from './intake-contract'
import { readV3RetainableProposal, uniqueV3JsonMembers } from './proposal-bytes'

const signal = () => new AbortController().signal
type Fixture = ReturnType<typeof s1Fixture>
const originalRow = (f: Fixture) => ({ reference: f.reference, text: f.text, outcome: null, audit: null })
const reply = (result: unknown) => ({ status: 'acknowledged' as const, rows: [{ result: JSON.stringify(result) }] })
function scripted(...responses: Array<Awaited<ReturnType<V3IntakeSqlExecutor['execute']>> | Error>) {
  const calls: Array<{ statement: string; parameters: readonly (string | number)[] }> = []
  const executor: V3IntakeSqlExecutor = { async execute(statement, parameters) {
    calls.push({ statement, parameters })
    const response = responses.shift()
    if (!response) throw Error('unexpected_test_sql')
    if (response instanceof Error) throw response
    return response
  } }
  return { executor, calls }
}
const create = (f: Fixture, executor: V3IntakeSqlExecutor | null, leaseMilliseconds = 10_000) =>
  createV3ProposalIntakeStore({ registry: f.originals.registry, executor, leaseMilliseconds })
const acquired = (f: Fixture, overrides: Record<string, unknown> = {}) => reply({ status: 'acquired', generation: 1,
  leaseToken: '11111111-2222-3333-4444-555555555555', acquiredAt: '2026-11-09T08:00:00.000Z',
  expiresAt: '2026-11-09T08:00:10.000Z', record: originalRow(f), ...overrides })

describe('S1 intake rejects unsafe ORIGINAL bytes before any SQL dispatch', () => {
  test('duplicate members hide private earlier values from ordinary parsing but never enter storage', async () => {
    const f = s1Fixture('duplicate-original')
    const variants = [
      f.text.replace('"jobId":', '"jobId":"private-first-value","jobId":'),
      f.text.replace('"jobId":', '"\\u006aobId":"private-first-value","jobId":'),
      f.text.replace('"factKind":', '"factKind":"private-first-value","factKind":'),
      f.text.replace('"factKind":', '"\\u0066actKind":"private-first-value","factKind":'),
    ]
    for (const text of variants) {
      assert.equal(readV3ProposalUpload(text, f.originals.registry).ok, true, 'demonstrates the former raw-retention gap')
      const io = scripted(), service = create(f, io.executor)
      assert.deepEqual(await service.intake.capture(text, f.binding, signal()), { status: 'rejected', reason: 'invalid_upload' })
      const raw = createV3PostgresQuarantineBackend(f.originals.registry, io.executor, 10_000)
      assert.deepEqual(await raw.capture(text, { ...f.reference, proposalDigest: sha256Hex(text), bytes: Buffer.byteLength(text) }, signal()),
        { status: 'rejected', reason: 'invalid_upload' })
      assert.equal(io.calls.length, 0, 'both exported entry points fail before SQL')
    }
  })
  test('scanner is bounded, rejects nested and escaped duplicates, and preserves legal member spellings', () => {
    for (const text of ['{"a":1,"a":2}', '[{"a":{"b":1,"\\u0062":2}}]', '{"a":1,}', '[1,]',
      '{"a":01}', '{"a":undefined}', '{"a":"\\x00"}', '{"a":"unterminated}', 'false true',
      '['.repeat(18) + '0' + ']'.repeat(18), '[' + '0,'.repeat(8192) + '0]', ' '.repeat(65_537)]) {
      assert.equal(uniqueV3JsonMembers(text), false)
    }
    for (const text of ['{ "a":1,"A":2 }', '[{"a":1},{"a":2}]', '{"a\\"b": 1,"a\\\\b":2}',
      ' {"u":"ä","number":-1.2e+3,"nested":[true,false,null]}\n']) assert.equal(uniqueV3JsonMembers(text), true)
  })
  test('unknown nested fields, private data, invalid UTF-16, extra trust, size and malformed JSON never dispatch', async () => {
    const f = s1Fixture('unsafe-original'), io = scripted(), service = create(f, io.executor)
    const malformed = [null, new Uint8Array(), {}, ' '.repeat(65_537), '{', '\ud800',
      JSON.stringify({ ...f.proposal, passportNumber: 'private' }), JSON.stringify({ ...f.proposal, trusted: true }),
      JSON.stringify({ ...f.proposal, research: { ...f.proposal.research, sessionId: 'private' } }),
      JSON.stringify({ ...f.proposal, research: null }), JSON.stringify({ ...f.proposal, references: [{ passportNumber: 'private' }] }),
    ]
    for (const text of malformed) {
      assert.equal((await service.intake.capture(text, f.binding, signal())).status, 'rejected')
      assert.equal(readV3RetainableProposal(text, f.originals.registry).ok, false)
    }
    assert.equal(io.calls.length, 0)
  })
  test('closed binding, operation/job/context/digest/bytes and nested input checks also protect direct backend', async () => {
    const f = s1Fixture('binding'), io = scripted(), backend = createV3PostgresQuarantineBackend(f.originals.registry, io.executor, 10_000)
    const changes: V3IntakeReference[] = [
      { ...f.reference, proposalDigest: 'a'.repeat(64) }, { ...f.reference, bytes: f.reference.bytes + 1 },
      ...(['operationId', 'jobId', 'contextKey'] as const).map(key => ({ ...f.reference, binding: { ...f.binding, [key]: f.binding[key].replace(/[a-f0-9]$/, 'f') } })),
      { ...f.reference, binding: { ...f.binding, method: { methodId: 'a', revision: 1 } } },
    ]
    for (const ref of changes) assert.equal((await backend.capture(f.text, ref, signal())).status, 'rejected')
    for (const text of [JSON.stringify({ ...f.proposal, research: null }), JSON.stringify({ ...f.proposal, context: { ...f.proposal.context, email: 'private' } })]) {
      assert.equal((await backend.capture(text, { ...f.reference, proposalDigest: sha256Hex(text), bytes: Buffer.byteLength(text) }, signal())).status, 'rejected')
    }
    let getterCalls = 0
    const binding = Object.defineProperty({ ...f.binding }, 'method', { enumerable: true, get() { getterCalls++; throw Error('private') } })
    assert.equal((await create(f, io.executor).intake.capture(f.text, binding, signal())).status, 'rejected')
    const upload = { ...f.upload, proposal: Object.defineProperty({ ...f.upload.proposal }, 'research', { enumerable: true,
      get() { getterCalls++; throw Error('private') } }) }
    assert.equal((await backend.quarantine(f.binding).reserve(upload, signal())).status, 'unavailable')
    assert.equal(getterCalls, 0); assert.equal(io.calls.length, 0)
  })
})

describe('S1 fixed SQL boundary and complete replay (scripted transport unit tests only)', () => {
  test('capture passes exact whitespace bytes as a bound parameter and returns only the custody reference', async () => {
    const f = s1Fixture('exact-original'), io = scripted(reply({ status: 'recorded', record: originalRow(f) }))
    assert.deepEqual(await create(f, io.executor).intake.capture(f.text, f.binding, signal()), { status: 'recorded', reference: f.reference })
    assert.equal(io.calls.length, 1)
    assert.equal(io.calls[0]!.statement, 'SELECT official_v3_intake_api.capture_v1($1::jsonb,$2::text,$3::text) AS result')
    assert.equal(io.calls[0]!.parameters[1], f.text)
    assert.notEqual(io.calls[0]!.parameters[1], JSON.stringify(f.proposal))
    assert.equal(io.calls[0]!.statement.includes(f.text), false)
  })
  test('production/default, cancelled and invalid lease configuration have no executor dispatch', async () => {
    const f = s1Fixture('unbound'), io = scripted(), controller = new AbortController(); controller.abort()
    assert.deepEqual(proposalIntakeProduction(), { status: 'unavailable' })
    assert.deepEqual(await create(f, null).intake.capture(f.text, f.binding, signal()), { status: 'unavailable' })
    assert.deepEqual(await create(f, io.executor).intake.capture(f.text, f.binding, controller.signal), { status: 'unavailable' })
    for (const lease of [0, 900_001, NaN, 1.2]) assert.equal((await create(f, io.executor, lease).intake.capture(f.text, f.binding, signal())).status, 'unavailable')
    assert.equal(io.calls.length, 0)
  })
  test('collision/not-attempted/pending and actual full completed replay remain distinct', async () => {
    const f = s1Fixture('replay'), value = await f.withArchivedPredecessor('comparable_conflict')
    const io = scripted(reply({ status: 'collision' }), reply({ status: 'not_attempted' }), reply({ status: 'recorded', record: originalRow(f) }),
      reply({ status: 'recorded', record: { ...originalRow(f), ...value } }))
    const service = create(f, io.executor)
    assert.deepEqual(await service.intake.confirm(f.reference, signal()), { status: 'collision' })
    assert.deepEqual(await service.confirmImport(f.reference), { status: 'not_attempted' })
    assert.deepEqual(await service.confirmImport(f.reference), { status: 'pending' })
    assert.deepEqual(await service.confirmImport(f.reference), { status: 'completed', ...value })
    assert.ok(io.calls.every(call => JSON.parse(String(call.parameters[0])).operationId === f.binding.operationId))
  })
  test('missing, truncated, mutated, overbound or unacknowledged responses stay unconfirmed without content leakage', async () => {
    const f = s1Fixture('bad-response'), record = originalRow(f)
    const io = scripted(new Error('credential-and-private-original'), { status: 'unconfirmed' },
      { status: 'acknowledged', rows: [] }, { status: 'acknowledged', rows: [{ result: '{' }] },
      { status: 'acknowledged', rows: [{ result: 'x'.repeat(1_048_577) }] },
      reply({ status: 'recorded', record: { ...record, text: f.text + '\n' } }),
      reply({ status: 'recorded', record: { ...record, outcome: { status: 'unavailable', reason: null }, audit: f.auditFor({ status: 'unavailable', reason: 'aborted' }) } }),
      reply({ status: 'recorded', record: { ...record, audit: {} } }), reply({ status: 'recorded', record: { ...record, approval: true } }))
    for (let index = 0; index < 9; index++) assert.deepEqual(await create(f, io.executor).intake.confirm(f.reference, signal()), { status: 'unconfirmed' })
  })
  test('opaque owned ticket cannot be cloned or moved to another adapter; finishing is one attempt', async () => {
    const f = s1Fixture('ticket'), value = await f.completion()
    const io = scripted(reply({ status: 'recorded', record: originalRow(f) }), acquired(f), reply({ status: 'recorded' }))
    const service = create(f, io.executor), port = service.forImport(f.binding), other = service.forImport(f.binding)
    const reserve = await port.reserve(f.upload, signal())
    if (reserve.status !== 'acquired') assert.fail('reservation')
    assert.ok(Object.isFrozen(reserve.ticket)); assert.deepEqual(Object.keys(reserve.ticket), [])
    assert.deepEqual(await port.finish({ ...reserve.ticket }, value.outcome, value.audit, signal()), { status: 'unconfirmed' })
    assert.deepEqual(await other.finish(reserve.ticket, value.outcome, value.audit, signal()), { status: 'unconfirmed' })
    assert.equal(io.calls.length, 2)
    assert.deepEqual(await port.finish(reserve.ticket, value.outcome, value.audit, signal()), { status: 'recorded' })
    assert.deepEqual(await port.finish(reserve.ticket, value.outcome, value.audit, signal()), { status: 'unconfirmed' })
    assert.equal(io.calls.length, 3)
  })
  test('invalid outcome/audit never reaches finish SQL even with an acquired ticket', async () => {
    const f = s1Fixture('bad-finish'), value = await f.completion()
    for (const [outcome, audit] of [
      [{ status: 'unavailable', reason: null }, value.audit], [value.outcome, { ...value.audit, jobId: `job3_${'e'.repeat(32)}` }],
    ] as Array<[V3ImportOutcome, V3ImportAudit]>) {
      const io = scripted(reply({ status: 'recorded', record: originalRow(f) }), acquired(f)), port = create(f, io.executor).forImport(f.binding)
      const reserve = await port.reserve(f.upload, signal()); if (reserve.status !== 'acquired') assert.fail('reservation')
      assert.deepEqual(await port.finish(reserve.ticket, outcome, audit, signal()), { status: 'unconfirmed' })
      assert.equal(io.calls.length, 2)
    }
  })
  test('busy and changed reservation generations/bounds are never fabricated as owned tickets', async () => {
    const f = s1Fixture('bad-reservation')
    for (const response of [reply({ status: 'busy' }), acquired(f, { generation: 2_147_483_647 }), acquired(f, { leaseToken: 'fabricated' }),
      acquired(f, { expiresAt: '2026-11-09T08:00:11.000Z' }), { status: 'unconfirmed' as const }]) {
      const io = scripted(reply({ status: 'recorded', record: originalRow(f) }), response), port = create(f, io.executor).forImport(f.binding)
      if ('rows' in response && JSON.parse(response.rows[0]!.result!).status === 'busy') assert.equal((await port.reserve(f.upload, signal())).status, 'busy')
      else await assert.rejects(port.reserve(f.upload, signal()), /^Error: intake_reservation_unconfirmed$/)
    }
  })
  test('late cancellation after dispatch remains unknown and requires same-operation confirm', async () => {
    const f = s1Fixture('cancel-ack'), cancellation = new AbortController(), calls: string[] = []
    const executor: V3IntakeSqlExecutor = { async execute(statement) { calls.push(statement); cancellation.abort(); return reply({ status: 'recorded', record: originalRow(f) }) } }
    assert.deepEqual(await create(f, executor).intake.capture(f.text, f.binding, cancellation.signal), { status: 'unconfirmed' })
    assert.equal(calls.length, 1)
  })
  test('transport status objects cannot invoke coercion or escape as an exception', async () => {
    const f = s1Fixture('status-object'), io = scripted(reply({ status: { toString: 'blocked', valueOf: 'blocked' } }))
    assert.deepEqual(await create(f, io.executor).intake.confirm(f.reference, signal()), { status: 'unconfirmed' })
  })
})
