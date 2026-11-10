import assert from 'node:assert/strict'
import { createHash } from 'node:crypto'
import { readFileSync } from 'node:fs'
import { performance } from 'node:perf_hooks'
import { describe, test, type TestContext } from 'node:test'
import { MA1_LIMITS, readMa1MethodBinding, readMa1FixedBinding, readMa1CurrentRequest, readMa1CurrentRows,
  type Ma1MethodBinding, type Ma1CurrentRequest, type Ma1ReadResult } from './contract'
import { createV3PostgresMethodAuthority, createV3PostgresDurableJobs, MA1_READ_CURRENT_SQL,
  type Ma1MethodReceipt, type Ma1MethodSqlExecutor } from './authority-postgres'
import type { M04Config, M04FixedRequest } from '../jobs/contract'
import { m04Fixture, M04_TEST_BINDING } from '../../../../scripts/db/official-truth-v3-durable-jobs-1/fixtures'

// Literal expectations belong to Root's preimplementation artifact, not this adapter.
const referenceBytes = readFileSync(new URL('../../../../docs/official-truth-product-v3/MA1_SYNTHETIC_BINDING_REFERENCE_V1.json', import.meta.url))
const reference = JSON.parse(referenceBytes.toString('utf8')) as {
  vectors: { draft: unknown; packageBytes: string; methodDigest: string; packageDigest: string; packageWithoutTrailingNewlineDigest: string }[];
}
const EXPECTED = [
  ['8f356f4d4ed89fe83843d523bc3e5d4b947b5e826a8a78daf79b73ec45d29453', '3478b33b5bd068eff06d70997882af7226d39eefb35aa3e78d6b54286b6c7a22'],
  ['0c0ee0f62565a3dccc8abdb81402c32670d8220495827ed5920417015b5cb117', 'f9892975f1044e4f204e53ba62d557127efb75aebc92040d43a4c0e77d9e4b2c'],
  ['911a69c43b809c7854104092f781c26b4434b39d0ad006395a15075c56d06f9b', '6322851a9a1386854a5f3acdf794e42259593547fee20739c03ad1a221c53ceb'],
] as const
const BINDING: Ma1MethodBinding = Object.freeze({ methodId: 'ma1-synthetic-root-vector', revision: 1,
  methodDigest: EXPECTED[0][0], packageDigest: EXPECTED[0][1] })
const METHOD = Object.freeze({ methodId: BINDING.methodId, revision: BINDING.revision })
const CHECKED = '2026-11-09T12:00:00.000Z'
const UNTIL = '2026-11-09T12:01:00.000Z'
type WireRow = Record<string, string | null>
type Reply = Awaited<ReturnType<Ma1MethodSqlExecutor['readCurrent']>>

function ok<T>(result: Ma1ReadResult<T>): T {
  if (!result.ok) assert.fail(result.reason)
  return result.value
}
function bytes(text: string): Uint8Array { return new TextEncoder().encode(text) }
function approved(overrides: Partial<WireRow> = {}): WireRow {
  return { status: 'approved', method_id: BINDING.methodId, revision: '1', method_digest: BINDING.methodDigest,
    package_digest: BINDING.packageDigest, epoch: '1', approval_mode: 'until_revoked', approval_until: null,
    observed_at: CHECKED, remaining_ms: '5000', ...overrides }
}
function finite(remaining = '5000', overrides: Partial<WireRow> = {}): WireRow {
  return approved({ approval_mode: 'until', approval_until: UNTIL, remaining_ms: remaining, ...overrides })
}
function rows(row = approved()): Reply { return { status: 'rows', rows: [row] } }
function portFor(reply: Reply | (() => Reply | Promise<Reply>) = rows()) {
  const calls: { request: Ma1CurrentRequest; signal: AbortSignal }[] = []
  const executor: Ma1MethodSqlExecutor = { async readCurrent(request, signal) {
    calls.push({ request, signal })
    return typeof reply === 'function' ? reply() : reply
  } }
  return { calls, executor, port: createV3PostgresMethodAuthority(BINDING, executor) }
}
function monotonic(t: TestContext, initial = 0): (now: number) => void {
  let now = initial
  t.mock.method(performance, 'now', () => now)
  return value => { assert.ok(value >= now, 'controlled clock is monotonic'); now = value }
}
function deferred<T>() {
  let resolve!: (value: T) => void
  let reject!: (reason?: unknown) => void
  const promise = new Promise<T>((yes, no) => { resolve = yes; reject = no })
  return { promise, resolve, reject }
}
async function receipt(port: ReturnType<typeof createV3PostgresMethodAuthority>): Promise<Ma1MethodReceipt> {
  const result = await port.resolveCurrent(METHOD, CHECKED)
  if (result.status !== 'approved') assert.fail(result.status)
  return result.receipt
}

describe('MA1 exact synthetic binding and closed wire readers', () => {
  test('preserves all three independently frozen Root vectors', () => {
    assert.equal(createHash('sha256').update(referenceBytes).digest('hex'), '790ecbbf909f53bf76801249bf3dbae7fd5e5a185f68b608dea0e1d96600eeb6')
    assert.equal(reference.vectors.length, 3)
    for (const [index, vector] of reference.vectors.entries()) {
      const value = ok(readMa1MethodBinding(vector.draft, bytes(vector.packageBytes), vector.packageDigest))
      assert.equal(value.methodDigest, EXPECTED[index][0])
      assert.equal(value.packageDigest, EXPECTED[index][1])
      assert.equal(value.revision, index === 2 ? 2 : 1)
      assert.deepEqual(Object.keys(value).sort(), ['methodDigest', 'methodId', 'packageDigest', 'revision'])
      assert.ok(Object.isFrozen(value))
    }
  })

  test('canonical draft identity ignores property order but preserves status and raw package newline', () => {
    const vector = reference.vectors[0], draft = structuredClone(vector.draft) as Record<string, unknown>
    const reordered = Object.fromEntries(Object.entries(draft).reverse())
    const value = ok(readMa1MethodBinding(reordered, bytes(vector.packageBytes), vector.packageDigest))
    assert.equal(value.methodDigest, BINDING.methodDigest)
    const withoutNewline = bytes(vector.packageBytes.slice(0, -1))
    assert.deepEqual(readMa1MethodBinding(draft, withoutNewline, vector.packageDigest), { ok: false, reason: 'digest_mismatch' })
    assert.equal(ok(readMa1MethodBinding(draft, withoutNewline, vector.packageWithoutTrailingNewlineDigest)).packageDigest,
      'b709919fa4ef8a75fa44b501bfe023659289774e27541b62468e63c18d796e34')
    assert.notEqual(EXPECTED[0][0], EXPECTED[1][0])
  })

  test('detaches the draft and package without freezing or retaining caller inputs', () => {
    const vector = reference.vectors[0], draft = structuredClone(vector.draft) as { status: string; method: { revision: number } }
    const packageBytes = bytes(vector.packageBytes)
    const value = ok(readMa1MethodBinding(draft, packageBytes, vector.packageDigest))
    draft.status = 'DRAFT'; draft.method.revision = 99; packageBytes.fill(0)
    assert.deepEqual(value, BINDING)
    assert.equal(Object.isFrozen(draft), false)
    assert.equal(Object.isFrozen(draft.method), false)
  })

  test('shared draft admission rejects authority fields, personal fields, malformed predecessors and getters', () => {
    const vector = reference.vectors[0], draft = structuredClone(vector.draft) as Record<string, unknown>
    for (const input of [{ ...draft, status: 'APPROVED' }, { ...draft, ownerApproved: true }, { ...draft, passportNumber: 'unwanted' },
      { ...draft, predecessor: { methodId: BINDING.methodId, revision: 1 } }, Object.create(draft), null]) {
      assert.equal(readMa1MethodBinding(input, bytes(vector.packageBytes), vector.packageDigest).ok, false)
    }
    let getters = 0
    Object.defineProperty(draft, 'status', { enumerable: true, get() { getters++; return 'NOT_APPROVED' } })
    assert.equal(readMa1MethodBinding(draft, bytes(vector.packageBytes), vector.packageDigest).ok, false)
    assert.equal(getters, 0)
  })

  test('bounds byte copying, uses actual typed bytes and never trusts an overridden iterator or byteLength', () => {
    const vector = reference.vectors[0]
    for (const input of [new Uint8Array(), new Uint8Array(65_537), null, vector.packageBytes, {}, new Uint16Array(4),
      new Proxy(bytes(vector.packageBytes), {})]) {
      assert.equal(readMa1MethodBinding(vector.draft, input as Uint8Array, vector.packageDigest).ok, false)
    }
    const input = bytes(vector.packageBytes)
    let invoked = 0
    Object.defineProperty(input, Symbol.iterator, { value: () => { invoked++; throw Error('untrusted iterator') } })
    Object.defineProperty(input, 'byteLength', { get() { invoked++; throw Error('untrusted length') } })
    assert.deepEqual(ok(readMa1MethodBinding(vector.draft, input, vector.packageDigest)), BINDING)
    assert.equal(invoked, 0)
    const oversized = new Uint8Array(65_537)
    Object.defineProperty(oversized, 'byteLength', { value: 1 })
    assert.equal(readMa1MethodBinding(vector.draft, oversized, vector.packageDigest).ok, false)
    for (const hash of ['', vector.packageDigest.toUpperCase(), `${vector.packageDigest} `, null, 1]) {
      assert.equal(readMa1MethodBinding(vector.draft, bytes(vector.packageBytes), hash).ok, false)
    }
  })

  test('package checksum and draft parsing alone never supply approval', async () => {
    const vector = reference.vectors[0]
    const binding = ok(readMa1MethodBinding(vector.draft, bytes(vector.packageBytes), vector.packageDigest))
    assert.deepEqual(await createV3PostgresMethodAuthority(binding, null).resolveCurrent(METHOD, CHECKED), { status: 'unavailable' })
  })

  test('fixed binding is closed, bounded, detached and has no role or target selectors', () => {
    const input = { ...BINDING }, decoded = ok(readMa1FixedBinding(input))
    input.methodDigest = 'f'.repeat(64)
    assert.deepEqual(decoded, BINDING)
    assert.notEqual(decoded, input)
    for (const patch of [{ role: 'postgres' }, { target: 'external' }, { methodId: 'A' }, { methodId: 'a' },
      { methodId: 'a'.repeat(65) }, { revision: '1' }, { revision: 0 }, { revision: 2_147_483_648 },
      { methodDigest: 'A'.repeat(64) }, { packageDigest: null }]) {
      assert.equal(readMa1FixedBinding({ ...BINDING, ...patch }).ok, false)
    }
    assert.equal(readMa1FixedBinding({ ...BINDING, revision: 2_147_483_647 }).ok, true)
    let touched = 0
    const getter = { ...BINDING }
    Object.defineProperty(getter, 'revision', { enumerable: true, get() { touched++; return 1 } })
    assert.equal(readMa1FixedBinding(getter).ok, false)
    assert.equal(touched, 0)
  })

  test('timestamps use exact canonical UTC milliseconds and real civil dates', () => {
    for (const checkedAt of [CHECKED, '0001-01-01T00:00:00.000Z', '9999-12-31T23:59:59.999Z', '2000-02-29T00:00:00.000Z']) {
      const request = ok(readMa1CurrentRequest({ ...BINDING, checkedAt }))
      assert.equal(request.checkedAt, checkedAt)
      assert.ok(Object.isFrozen(request))
    }
    for (const checkedAt of ['0000-01-01T00:00:00.000Z', '1900-02-29T00:00:00.000Z', '2026-02-30T00:00:00.000Z',
      '2026-11-09T24:00:00.000Z', '2026-11-09T12:00:60.000Z', '2026-11-09T12:00:00Z', '2026-11-09T12:00:00.0000Z',
      '2026-11-09T12:00:00.000+00:00', '2026-11-09T12:00:00.000z', ` ${CHECKED}`, `${CHECKED} `, 'infinity', null, 0]) {
      assert.equal(readMa1CurrentRequest({ ...BINDING, checkedAt }).ok, false, String(checkedAt))
    }
    assert.equal(readMa1CurrentRequest({ ...BINDING, checkedAt: CHECKED, sql: 'untrusted' }).ok, false)
    assert.equal(readMa1CurrentRequest({ ...BINDING, checkedAt: CHECKED, [Symbol('hidden')]: true }).ok, false)
  })

  test('decodes all finite states and actual null-prototype wire rows without creating authority', () => {
    const variants = [
      approved(), finite('1'),
      approved({ status: 'absent', revision: null, method_digest: null, package_digest: null, epoch: '0', approval_mode: null, remaining_ms: '0' }),
      approved({ status: 'draft', epoch: '0', approval_mode: null, remaining_ms: '0' }),
      approved({ status: 'binding_mismatch', method_digest: 'a'.repeat(64), epoch: '0', approval_mode: null, remaining_ms: '0' }),
      approved({ status: 'binding_mismatch', package_digest: 'b'.repeat(64), remaining_ms: '0' }),
      approved({ status: 'different_revision', revision: '2', epoch: '2', remaining_ms: '0' }),
      approved({ status: 'revoked', epoch: '2147483647', approval_mode: null, remaining_ms: '0' }),
      finite('0', { status: 'expired' }),
    ]
    for (const input of variants) {
      const result = ok(readMa1CurrentRows([input], BINDING, CHECKED))
      assert.equal(result.status, input.status)
      assert.equal(result.remainingMs, Number(input.remaining_ms))
      assert.ok(Object.isFrozen(result))
      assert.notEqual(result, input)
      assert.equal(readMa1CurrentRows([Object.assign(Object.create(null), input)], BINDING, CHECKED).ok, true)
    }
  })

  test('rejects extra, missing, exotic, accessor and non-string wire cells before using them', () => {
    const invalidRows: unknown[] = [null, {}, [], [approved(), approved()], [null], [new Date()], [Object.create(approved())],
      [{ ...approved(), authority: true }], [{ ...approved(), epoch: 1 }], [{ ...approved(), remaining_ms: 5000 }],
      [{ ...approved(), observed_at: new Date() }], [{ ...approved(), method_digest: 'a'.repeat(65) }],
      [{ ...approved(), [Symbol('hidden')]: 'extra' }], [{ ...approved(), method_id: 'other-method' }]]
    const missing = approved(); delete missing.observed_at; invalidRows.push([missing])
    const extraArray = [approved()]; Object.defineProperty(extraArray, 'extra', { value: true }); invalidRows.push(extraArray)
    let touched = 0
    const getter = approved(); Object.defineProperty(getter, 'epoch', { enumerable: true, get() { touched++; return '1' } }); invalidRows.push([getter])
    const accessorArray = [approved()]; Object.defineProperty(accessorArray, '0', { enumerable: true, get() { touched++; return approved() } }); invalidRows.push(accessorArray)
    for (const input of invalidRows) assert.equal(readMa1CurrentRows(input, BINDING, CHECKED).ok, false)
    assert.equal(touched, 0)
  })

  test('rejects noncanonical integers and impossible state/identity/mode combinations', () => {
    for (const field of ['revision', 'epoch', 'remaining_ms']) {
      for (const value of ['', '01', '+1', '-0', '1.0', '1e0', ' 1', '1 ', '-1', '2147483648']) {
        assert.equal(readMa1CurrentRows([approved({ [field]: value })], BINDING, CHECKED).ok, false, `${field}:${value}`)
      }
    }
    for (const patch of [{ epoch: '0' }, { epoch: '2147483647' }, { remaining_ms: '0' }, { remaining_ms: '4999' },
      { remaining_ms: '5001' }, { revision: '2' }, { method_digest: 'a'.repeat(64) }, { package_digest: 'b'.repeat(64) },
      { approval_mode: null }, { approval_mode: 'until' }, { approval_until: UNTIL }, { status: 'accepted' },
      { status: 'draft', remaining_ms: '0', epoch: '0' }, { status: 'binding_mismatch', remaining_ms: '0' },
      { status: 'different_revision', remaining_ms: '0' }, { status: 'revoked', remaining_ms: '0' },
      { status: 'expired', remaining_ms: '0' }, { observed_at: '2026-02-30T12:00:00.000Z' }]) {
      assert.equal(readMa1CurrentRows([approved(patch)], BINDING, CHECKED).ok, false, JSON.stringify(patch))
    }
    assert.equal(readMa1CurrentRows([finite('1', { approval_until: CHECKED })], BINDING, CHECKED).ok, false)
    assert.equal(readMa1CurrentRows([finite('0', { status: 'expired', epoch: '2147483647' })], BINDING, CHECKED).ok, false)
    assert.equal(readMa1CurrentRows([finite('1', { epoch: '2147483646' })], BINDING, CHECKED).ok, true)
  })

  test('Root R1: finite remaining_ms cannot exceed either conservative interval and never derives a TTL from it', () => {
    const short = finite('5000', { approval_until: '2026-11-09T12:00:00.001Z' })
    assert.equal(readMa1CurrentRows([short], BINDING, CHECKED).ok, false)
    const callerExpired = finite('1000', { approval_until: '2026-11-09T12:00:01.000Z' })
    assert.equal(readMa1CurrentRows([callerExpired], BINDING, '2026-11-09T12:00:02.000Z').ok, false)
    const callerShorter = finite('1000', { approval_until: '2026-11-09T12:00:02.000Z' })
    assert.equal(readMa1CurrentRows([callerShorter], BINDING, '2026-11-09T12:00:01.999Z').ok, false)
    assert.equal(readMa1CurrentRows([approved()], BINDING, 'infinity').ok, false)
    const truthfulRemainder = ok(readMa1CurrentRows([finite('999', { approval_until: '2026-11-09T12:00:01.000Z' })], BINDING, CHECKED))
    assert.equal(truthfulRemainder.remainingMs, 999, 'do not replace SQL remainder with the larger formatted1000ms interval')
  })
})

describe('MA1 opaque receipt custody and actual executor observations', () => {
  test('valid observations use the fixed frozen tuple, explicit checkedAt and a fresh read for every current result', async () => {
    const { port, calls } = portFor()
    const held = await receipt(port)
    assert.ok(Object.isFrozen(held)); assert.deepEqual(Reflect.ownKeys(held), [])
    assert.equal(JSON.stringify(held), '{}')
    assert.deepEqual(await port.reproveAtCommit(held, METHOD, CHECKED), { status: 'current' })
    assert.deepEqual(await port.reproveAtCommit(held, METHOD, '0001-01-01T00:00:00.000Z'), { status: 'current' })
    assert.equal(calls.length, 3)
    assert.deepEqual(calls[0].request, { ...BINDING, checkedAt: CHECKED })
    assert.equal(calls[2].request.checkedAt, '0001-01-01T00:00:00.000Z')
    assert.ok(calls.every(call => Object.isFrozen(call.request) && !call.signal.aborted))
    assert.equal(MA1_READ_CURRENT_SQL, 'SELECT status, method_id, revision, method_digest, package_digest,\n       epoch, approval_mode, approval_until, observed_at, remaining_ms\nFROM official_v3_method_api.read_current_v1(\n  $1::text,$2::integer,$3::text,$4::text,$5::text)')
  })

  test('factory configuration is detached, and invalid/null executors cannot resolve', async () => {
    const input = { ...BINDING }, fixture = portFor()
    const port = createV3PostgresMethodAuthority(input, fixture.executor)
    input.methodId = 'changed-after-construction'; input.packageDigest = 'f'.repeat(64)
    assert.equal((await port.resolveCurrent(METHOD, CHECKED)).status, 'approved')
    assert.deepEqual(fixture.calls[0].request, { ...BINDING, checkedAt: CHECKED })
    for (const executor of [null, {}, { readCurrent: null }]) {
      assert.deepEqual(await createV3PostgresMethodAuthority(BINDING, executor as unknown as Ma1MethodSqlExecutor).resolveCurrent(METHOD, CHECKED), { status: 'unavailable' })
    }
    const invalid = createV3PostgresMethodAuthority({ ...BINDING, role: 'postgres' } as Ma1MethodBinding, fixture.executor)
    assert.deepEqual(await invalid.resolveCurrent(METHOD, CHECKED), { status: 'unavailable' })
    assert.equal(fixture.calls.length, 1)
  })

  test('closed method/clock inputs and bad custody cause no SQL dispatch or getter invocation', async () => {
    const { port, calls } = portFor(), held = await receipt(port)
    let touched = 0
    const getter = { ...METHOD }; Object.defineProperty(getter, 'revision', { enumerable: true, get() { touched++; return 1 } })
    for (const method of [{ ...METHOD, revision: 2 }, { ...METHOD, methodId: 'another-method' }, { ...METHOD, accepted: true }, getter,
      Object.create(METHOD), null]) {
      assert.deepEqual(await port.resolveCurrent(method, CHECKED), { status: 'unavailable' })
      assert.deepEqual(await port.reproveAtCommit(held, method, CHECKED), { status: 'unavailable' })
    }
    for (const at of ['infinity', '2026-11-09', `${CHECKED} `]) {
      assert.deepEqual(await port.resolveCurrent(METHOD, at), { status: 'unavailable' })
      assert.deepEqual(await port.reproveAtCommit(held, METHOD, at), { status: 'unavailable' })
    }
    assert.equal(touched, 0); assert.equal(calls.length, 1)
  })

  test('foreign, cloned, serialized and invented receipts do not carry authority', async () => {
    const first = portFor(), second = portFor(), held = await receipt(first.port)
    for (const copy of [{}, { ...held }, structuredClone(held), JSON.parse(JSON.stringify(held)), null, 'receipt']) {
      assert.deepEqual(await first.port.reproveAtCommit(copy as Ma1MethodReceipt, METHOD, CHECKED), { status: 'unavailable' })
    }
    assert.deepEqual(await second.port.reproveAtCommit(held, METHOD, CHECKED), { status: 'unavailable' })
    assert.equal(first.calls.length, 1); assert.equal(second.calls.length, 0)
    assert.equal((await second.port.resolveCurrent(METHOD, CHECKED)).status, 'approved')
    assert.equal(second.calls.length, 1)
  })

  test('nonapproved states stay negative and binding mismatch remains unavailable', async () => {
    for (const row of [
      approved({ status: 'absent', revision: null, method_digest: null, package_digest: null, epoch: '0', approval_mode: null, remaining_ms: '0' }),
      approved({ status: 'draft', epoch: '0', approval_mode: null, remaining_ms: '0' }),
      approved({ status: 'different_revision', revision: '2', remaining_ms: '0' }),
      approved({ status: 'revoked', epoch: '2', approval_mode: null, remaining_ms: '0' }), finite('0', { status: 'expired' }),
    ]) assert.deepEqual(await portFor(rows(row)).port.resolveCurrent(METHOD, CHECKED), { status: 'not_approved' })
    assert.deepEqual(await portFor(rows(approved({ status: 'binding_mismatch', method_digest: 'f'.repeat(64), remaining_ms: '0' }))).port.resolveCurrent(METHOD, CHECKED), { status: 'unavailable' })
  })

  test('actual changed epochs, supersession and revoke refuse the retained receipt', async () => {
    for (const row of [approved({ epoch: '2' }), finite('1', { epoch: '2' }), finite('0', { status: 'expired', epoch: '2' }),
      approved({ status: 'different_revision', revision: '2', epoch: '2', remaining_ms: '0' }),
      approved({ status: 'revoked', epoch: '2', approval_mode: null, remaining_ms: '0' })]) {
      let reply = rows()
      const fixture = portFor(() => reply), held = await receipt(fixture.port)
      reply = rows(row)
      assert.deepEqual(await fixture.port.reproveAtCommit(held, METHOD, CHECKED), { status: 'revoked' })
      assert.equal(fixture.calls.length, 2)
    }
  })

  test('errors and malformed envelopes/rows remain unavailable and release only settled calls', async () => {
    for (const raw of [{ status: 'approved', rows: [approved()] }, { status: 'rows', rows: [approved()], extra: true },
      { status: 'unavailable', rows: [approved()] }, { status: 'rows', rows: [] }, { status: 'rows', rows: [{ ...approved(), epoch: 1 }] }, null]) {
      const fixture = portFor(raw as Reply)
      assert.deepEqual(await fixture.port.resolveCurrent(METHOD, CHECKED), { status: 'unavailable' })
    }
    let failing = false
    const fixture = portFor(() => { if (failing) throw Error('private SQL details'); return rows() })
    const held = await receipt(fixture.port)
    failing = true
    assert.deepEqual(await fixture.port.reproveAtCommit(held, METHOD, CHECKED), { status: 'unavailable' })
    assert.deepEqual(await fixture.port.resolveCurrent(METHOD, CHECKED), { status: 'unavailable' })
    failing = false
    assert.deepEqual(await fixture.port.reproveAtCommit(held, METHOD, CHECKED), { status: 'current' })
  })

  test('Root R1: impossible duration and request-expired rows cannot resolve or reprove', async () => {
    const cases = [
      { row: finite('5000', { approval_until: '2026-11-09T12:00:00.001Z' }), checkedAt: CHECKED },
      { row: finite('1000', { approval_until: '2026-11-09T12:00:01.000Z' }), checkedAt: '2026-11-09T12:00:02.000Z' },
      { row: finite('1000', { approval_until: '2026-11-09T12:00:02.000Z' }), checkedAt: '2026-11-09T12:00:01.999Z' },
    ]
    for (const item of cases) {
      assert.deepEqual(await portFor(rows(item.row)).port.resolveCurrent(METHOD, item.checkedAt), { status: 'unavailable' })
      let reply = rows()
      const fixture = portFor(() => reply), held = await receipt(fixture.port)
      reply = rows(item.row)
      assert.deepEqual(await fixture.port.reproveAtCommit(held, METHOD, item.checkedAt), { status: 'unavailable' })
      reply = rows()
      assert.deepEqual(await fixture.port.reproveAtCommit(held, METHOD, CHECKED), { status: 'current' }, 'malformed responses do not invent trusted custody metadata')
      assert.equal(fixture.calls.length, 3)
    }
  })
})

describe('MA1 original and monotonically shortened receipt deadlines', () => {
  test('resolve anchors finite validity to call start, including time spent in owned drain', async t => {
    const setNow = monotonic(t)
    const fixture = portFor(() => { setNow(101); return rows(finite('100')) })
    assert.deepEqual(await fixture.port.resolveCurrent(METHOD, CHECKED), { status: 'unavailable' })
    assert.equal(fixture.calls.length, 1)
  })

  test('five-second positive cutoff is checked even before the abort timer can run', async t => {
    const setNow = monotonic(t)
    const fixture = portFor(() => { setNow(5_000); return rows() })
    assert.deepEqual(await fixture.port.resolveCurrent(METHOD, CHECKED), { status: 'unavailable' })
  })

  test('reproof never renews the original finite cap or accepts an already-expired receipt', async t => {
    const setNow = monotonic(t)
    let reply = rows(finite('100'))
    const fixture = portFor(() => reply), held = await receipt(fixture.port)
    setNow(20); reply = rows(finite('5000'))
    assert.deepEqual(await fixture.port.reproveAtCommit(held, METHOD, CHECKED), { status: 'current' })
    setNow(100)
    assert.deepEqual(await fixture.port.reproveAtCommit(held, METHOD, CHECKED), { status: 'expired' })
    assert.equal(fixture.calls.length, 2)
  })

  test('fresh one-millisecond reproof horizon is retained when consumed during drain', async t => {
    const setNow = monotonic(t)
    let reproof = false
    const fixture = portFor(() => { if (reproof) { setNow(1_100); return rows(finite('1')) } return rows() })
    const held = await receipt(fixture.port)
    reproof = true; setNow(1_000)
    assert.deepEqual(await fixture.port.reproveAtCommit(held, METHOD, CHECKED), { status: 'expired' })
    reproof = false; setNow(1_200)
    assert.deepEqual(await fixture.port.reproveAtCommit(held, METHOD, CHECKED), { status: 'expired' })
    assert.equal(fixture.calls.length, 2)
    assert.equal((await fixture.port.resolveCurrent(METHOD, CHECKED)).status, 'approved', 'an explicit new observation creates a distinct receipt')
  })

  test('an overlapping earlier read with a larger remainder cannot revive shortened custody', async t => {
    const setNow = monotonic(t), earlier = deferred<Reply>(), shorter = deferred<Reply>()
    let count = 0
    const fixture = portFor(() => ++count === 1 ? rows() : count === 2 ? earlier.promise : shorter.promise)
    const held = await receipt(fixture.port)
    setNow(900); const first = fixture.port.reproveAtCommit(held, METHOD, CHECKED)
    setNow(1_000); const second = fixture.port.reproveAtCommit(held, METHOD, CHECKED)
    setNow(1_100); shorter.resolve(rows(finite('1')))
    assert.deepEqual(await second, { status: 'expired' })
    setNow(1_200); earlier.resolve(rows(finite('5000')))
    assert.deepEqual(await first, { status: 'expired' })
    assert.deepEqual(await fixture.port.reproveAtCommit(held, METHOD, CHECKED), { status: 'expired' })
    assert.equal(count, 3)
  })

  test('a shorter still-valid horizon survives later successful reproof without extension', async t => {
    const setNow = monotonic(t)
    let count = 0
    const fixture = portFor(() => {
      count++
      if (count === 2) { setNow(150); return rows(finite('300')) }
      if (count === 3) { setNow(250); return rows(finite('5000')) }
      return rows()
    })
    const held = await receipt(fixture.port)
    setNow(100); assert.deepEqual(await fixture.port.reproveAtCommit(held, METHOD, CHECKED), { status: 'current' })
    setNow(200); assert.deepEqual(await fixture.port.reproveAtCommit(held, METHOD, CHECKED), { status: 'current' })
    setNow(400); assert.deepEqual(await fixture.port.reproveAtCommit(held, METHOD, CHECKED), { status: 'expired' })
    assert.equal(count, 3)
  })

  test('same-epoch expired SQL result consumes custody even before the original cap', async t => {
    const setNow = monotonic(t)
    let reply = rows()
    const fixture = portFor(() => reply), held = await receipt(fixture.port)
    setNow(100); reply = rows(finite('0', { status: 'expired' }))
    assert.deepEqual(await fixture.port.reproveAtCommit(held, METHOD, CHECKED), { status: 'expired' })
    setNow(200); reply = rows()
    assert.deepEqual(await fixture.port.reproveAtCommit(held, METHOD, CHECKED), { status: 'expired' })
    assert.equal(fixture.calls.length, 2)
  })

  test('until_revoked still has the original five-second receipt cap', async t => {
    const setNow = monotonic(t), fixture = portFor(), held = await receipt(fixture.port)
    setNow(4_000); assert.deepEqual(await fixture.port.reproveAtCommit(held, METHOD, CHECKED), { status: 'current' })
    setNow(5_000); assert.deepEqual(await fixture.port.reproveAtCommit(held, METHOD, CHECKED), { status: 'expired' })
    assert.equal(fixture.calls.length, 2)
  })
})

describe('MA1 four slots persist through abort, acquisition and real promise settlement', () => {
  test('abort requests do not detach four calls or admit a fifth before their drain settles', async t => {
    const setNow = monotonic(t)
    t.mock.timers.enable({ apis: ['setTimeout'] })
    const pending = Array.from({ length: 4 }, () => deferred<Reply>())
    let count = 0
    const fixture = portFor(() => count < pending.length ? pending[count++].promise : (count++, rows()))
    const results = Array.from({ length: 4 }, () => fixture.port.resolveCurrent(METHOD, CHECKED))
    let settled = 0
    for (const result of results) void result.then(() => { settled++ })
    assert.equal(count, 4)
    assert.deepEqual(await fixture.port.resolveCurrent(METHOD, CHECKED), { status: 'unavailable' })
    setNow(5_000); t.mock.timers.tick(5_000)
    assert.ok(fixture.calls.every(call => call.signal.aborted))
    assert.equal(settled, 0)
    assert.deepEqual(await fixture.port.resolveCurrent(METHOD, CHECKED), { status: 'unavailable' })
    assert.equal(count, 4, 'no queued fifth read appears while cleanup remains pending')
    setNow(5_100)
    pending[0].resolve(rows())
    assert.deepEqual(await results[0], { status: 'unavailable' })
    assert.equal((await fixture.port.resolveCurrent(METHOD, CHECKED)).status, 'approved', 'only the settled slot can be reused')
    for (const item of pending.slice(1)) item.resolve(rows())
    assert.deepEqual(await Promise.all(results.slice(1)), [{ status: 'unavailable' }, { status: 'unavailable' }, { status: 'unavailable' }])
    assert.equal(count, 5)
  })

  test('a rejected fully settled call frees its slot and does not leak timer or private error', async () => {
    const pending = Array.from({ length: 4 }, () => deferred<Reply>())
    let count = 0
    const fixture = portFor(() => count < pending.length ? pending[count++].promise : (count++, rows()))
    const results = Array.from({ length: 4 }, () => fixture.port.resolveCurrent(METHOD, CHECKED))
    assert.deepEqual(await fixture.port.resolveCurrent(METHOD, CHECKED), { status: 'unavailable' })
    pending[0].reject(Error('synthetic private wire detail'))
    assert.deepEqual(await results[0], { status: 'unavailable' })
    assert.equal((await fixture.port.resolveCurrent(METHOD, CHECKED)).status, 'approved')
    for (const item of pending.slice(1)) item.resolve(rows())
    assert.ok((await Promise.all(results.slice(1))).every(result => result.status === 'approved'))
  })

  test('reproof slots likewise wait for executor settlement after their shorter receipt deadline', async t => {
    const setNow = monotonic(t)
    t.mock.timers.enable({ apis: ['setTimeout'] })
    const heldReads = Array.from({ length: 4 }, () => deferred<Reply>())
    let count = 0
    const fixture = portFor(() => ++count === 1 ? rows(finite('100')) : heldReads[count - 2].promise)
    const held = await receipt(fixture.port)
    setNow(20)
    const results = Array.from({ length: 4 }, () => fixture.port.reproveAtCommit(held, METHOD, CHECKED))
    setNow(100); t.mock.timers.tick(80)
    assert.ok(fixture.calls.slice(1).every(call => call.signal.aborted))
    assert.deepEqual(await fixture.port.resolveCurrent(METHOD, CHECKED), { status: 'unavailable' })
    assert.equal(count, 5)
    for (const item of heldReads) item.resolve(rows(finite('5000')))
    assert.deepEqual(await Promise.all(results), Array.from({ length: 4 }, () => ({ status: 'expired' })))
  })
})

test('MA1 dormant runtime has no file discovery, credentials, provider or publication side effects', () => {
  assert.deepEqual(MA1_LIMITS, { maxPackageBytes: 65_536, activeReads: 4, receiptMs: 5_000 })
  for (const file of ['contract.ts', 'authority-postgres.ts']) {
    const source = readFileSync(new URL(file, import.meta.url), 'utf8')
    assert.ok(source.includes("import 'server-only'"))
    assert.equal(/\bfetch\s*\(|process\.env|node:fs|LocalPgConnection|createClient\s*\(|\.from\s*\(|\.rpc\s*\(/.test(source), false, file)
    assert.equal(/Promise\.race\s*\(/.test(source), false, file)
  }
})

function jointFixture(overrides: Partial<M04Config> = {}) {
  const f = m04Fixture('ma1-joint-boundary', { fixedNow: CHECKED })
  const config: M04Config = { binding: M04_TEST_BINDING, registry: f.originals.registry, clock: f.clock,
    methodExecutor: { async readCurrent(request) { return rows(approved({ method_id: request.methodId, revision: String(request.revision),
      method_digest: request.methodDigest, package_digest: request.packageDigest, observed_at: request.checkedAt })) } },
    jobsExecutor: { async executeFixed() { return { status: 'unavailable' } } }, intakeExecutor: { async execute() { return { status: 'unavailable' } }, },
    producer: f.producer, evidence: f.evidence, history: f.history, ...overrides }
  return { f, config, api: createV3PostgresDurableJobs(config) }
}
describe('M04 private joint factory retains MA1 authority and original budgets', () => {
  test('outward surface is exactly three methods, with no receipt, epoch or native constructor escape', async () => {
    const { api } = jointFixture()
    assert.deepEqual(Reflect.ownKeys(api).sort(), ['enqueueDiscovery', 'enqueueRule', 'workOnce'])
    assert.equal(Object.isFrozen(api), true)
    assert.equal(Object.hasOwn(api, 'resolveCurrent'), false); assert.equal(Object.hasOwn(api, 'reproveAtCommit'), false)
    assert.equal((await api.enqueueRule({})).status, 'invalid')
  })
  test('probe clock is validated before dispatch; slow synchronous callback consumes original remainder', async t => {
    const setNow = monotonic(t)
    let jobs = 0, methods = 0
    const bad = jointFixture({ clock: () => ({ now: 'invalid', legalDate: '2026-11-09' }),
      jobsExecutor: { async executeFixed() { jobs++; return { status: 'unavailable' } } },
      methodExecutor: { async readCurrent() { methods++; return { status: 'unavailable' } } } })
    assert.notEqual((await bad.api.enqueueRule(bad.f.ruleInput)).status, 'confirmed')
    assert.equal(jobs, 0); assert.equal(methods, 0)
    for (const offset of [-60000, 60000]) {
      const beginning = performance.now(), clockValue = new Date(Date.parse(CHECKED) + offset).toISOString()
      let captured: M04FixedRequest | undefined
      const x = jointFixture({ clock: () => { setNow(beginning + 200); return { now: clockValue, legalDate: clockValue.slice(0, 10) } },
        jobsExecutor: { async executeFixed(request) { captured = request; return { status: 'acknowledged', rows: [{ result: '{"status":"blocked"}' }] } } },
        methodExecutor: { async readCurrent() { methods++; return { status: 'unavailable' } } } })
      assert.notEqual((await x.api.enqueueRule(x.f.ruleInput)).status, 'confirmed')
      assert.ok(captured); assert.equal(captured.epoch, null)
      assert.equal(captured.budget.deadline, beginning + 5000)
      assert.equal(Date.parse(captured.notAfter), Date.parse(clockValue) + 4800)
      assert.equal(methods, 0, 'fixed negative probe never observes MA1')
    }
    const beginning = performance.now()
    const expired = jointFixture({ clock: () => { setNow(beginning + 5001); return { now: CHECKED, legalDate: CHECKED.slice(0, 10) } },
      jobsExecutor: { async executeFixed() { jobs++; return { status: 'unavailable' } } } })
    assert.notEqual((await expired.api.enqueueRule(expired.f.ruleInput)).status, 'confirmed'); assert.equal(jobs, 0)
  })
  test('actual private bridge shrinks database cap at terminal observation and refuses late acknowledgement', async t => {
    const setNow = monotonic(t)
    let observation = 0, captured: M04FixedRequest | undefined
    const x = jointFixture({ methodExecutor: { async readCurrent(request) {
      observation++; setNow(3000)
      return rows(approved({ method_id: request.methodId, revision: String(request.revision), method_digest: request.methodDigest,
        package_digest: request.packageDigest, observed_at: new Date(Date.parse(CHECKED) + 2000).toISOString() }))
    } }, jobsExecutor: { async executeFixed(request) {
      const q = JSON.parse(request.operationText)
      if (q.operation === 'queue_confirm') return { status: 'acknowledged', rows: [{ result: '{"status":"not_attempted"}' }] }
      if (q.operation === 'queue_read') return { status: 'acknowledged', rows: [{ result: '{"status":"absent"}' }] }
      assert.equal(q.operation, 'queue_cas'); captured = request
      // Represents the actual executor's delayed terminal ACK/drain, not a
      // cancellation promise or a claim that the database rolled back.
      setNow(6000)
      return { status: 'acknowledged', rows: [{ result: JSON.stringify({ status: 'committed', record: q.body.commit.next }) }] }
    } } })
    assert.equal((await x.api.enqueueRule(x.f.ruleInput)).status, 'unconfirmed')
    assert.ok(observation >= 1 && captured)
    assert.equal(captured.budget.deadline, 5000)
    assert.equal(Date.parse(captured.notAfter), Date.parse(CHECKED) + 4000, 'observedAt + floor(original Held deadline - actual terminal b)')
  })
})
