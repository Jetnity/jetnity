import assert from 'node:assert/strict'
import { promises as fs } from 'node:fs'
import test from 'node:test'
import { readV3IntakeReference } from '../storage/intake-contract'
import { must } from '../integration/test-support/originals'
import { createV3ResearchFileIngress, v3ResearchFileIngressProduction } from './service-server'
import { fixture, malformed } from './test-support/fixture'

test('N1 unbound and dormant Production entry perform no filesystem or intake IO', async (t) => {
  const f = await fixture(t)
  let io = 0
  t.mock.method(fs, 'lstat', async () => { io++; throw new Error('unbound IO') })
  t.mock.method(fs, 'open', async () => { io++; throw new Error('unbound IO') })
  for (const ingress of [createV3ResearchFileIngress(null), f.ingress({ intake: null }), v3ResearchFileIngressProduction()]) {
    assert.deepEqual(await ingress.deliver(f.delivery), { status: 'unavailable', reason: 'unbound' })
    assert.deepEqual(await ingress.confirm(f.expected), { status: 'unavailable', reason: 'unbound' })
  }
  assert.equal(io, 0)
  assert.equal(f.intake.captures.length, 0)
  assert.equal(f.intake.confirms.length, 0)
})

test('N1 refuses invalid root selection and budgets before IO', async (t) => {
  const f = await fixture(t)
  let io = 0
  t.mock.method(fs, 'lstat', async () => { io++; throw new Error('invalid config IO') })
  for (const directory of ['relative', '/', f.directory + '/..', f.directory + '/', f.directory + '\0']) {
    assert.deepEqual(await f.ingress({ root: { ...f.root, directory } }).deliver(f.delivery),
      { status: 'unavailable', reason: 'invalid_configuration' })
  }
  for (const invocationMilliseconds of [0, -1, 0.5, 30_001, NaN, Infinity]) {
    assert.deepEqual(await f.ingress({ invocationMilliseconds }).deliver(f.delivery),
      { status: 'unavailable', reason: 'invalid_configuration' })
  }
  assert.equal(io, 0)
})

test('N1 refuses already-aborted invocations before IO and preserves caller-owned mutable input', async (t) => {
  const f = await fixture(t)
  let io = 0
  t.mock.method(fs, 'lstat', async () => { io++; throw new Error('aborted IO') })
  const abort = new AbortController(); abort.abort()
  const mutable = structuredClone(f.delivery)
  assert.deepEqual(await f.ingress().deliver(mutable, abort.signal), { status: 'unavailable', reason: 'aborted' })
  assert.equal(io, 0)
  assert.equal(Object.isFrozen(mutable), false)
  assert.equal(Object.isFrozen(mutable.binding), false)
})

for (const invalid of ['json', 'pii', 'unknown_field', 'invalid_utf8', 'bom', 'utf16', 'size', 'empty'] as const) {
  test(`N1 refuses actual ${invalid} upload bytes before intake`, async (t) => {
    const f = await fixture(t)
    const contents = invalid === 'json' ? '{'
      : invalid === 'pii' ? JSON.stringify({ ...f.proposal, passportNumber: 'SYNTHETIC_FORBIDDEN' })
      : invalid === 'unknown_field' ? JSON.stringify({ ...f.proposal, accepted: true })
      : invalid === 'invalid_utf8' ? Buffer.from([0xc3, 0x28])
      : invalid === 'bom' ? Buffer.concat([Buffer.from([0xef, 0xbb, 0xbf]), Buffer.from(f.text)])
      : invalid === 'utf16' ? Buffer.from(f.text, 'utf16le')
      : invalid === 'size' ? Buffer.alloc(65_537, 0x20) : ''
    await fs.writeFile(f.path, contents)
    const result = await f.ingress().deliver(f.delivery)
    assert.equal(result.status, 'rejected')
    if (result.status !== 'rejected') assert.fail('refused')
    if (invalid === 'invalid_utf8' || invalid === 'bom') assert.equal(result.reason, 'invalid_encoding')
    if (invalid === 'size') assert.equal(result.reason, 'bound_exceeded')
    assert.equal(f.intake.captures.length, 0)
  })
}

test('N1 exact UTF8 boundary and legal JSON whitespace are kept rather than normalised', async (t) => {
  const f = await fixture(t)
  const text = '\t\r\n' + f.text + ' '.repeat(65_536 - Buffer.byteLength(f.text) - 3)
  assert.equal(Buffer.byteLength(text), 65_536)
  await fs.writeFile(f.path, text)
  const result = await f.ingress().deliver(f.delivery)
  assert.equal(result.status, 'recorded')
  assert.equal(f.intake.captures[0].text, text)
  if (result.status === 'recorded') assert.equal(result.reference.bytes, 65_536)
})

test('N1 runner binding must match proposal operation, job and context', async (t) => {
  const f = await fixture(t)
  for (const binding of [{ ...f.binding, operationId: `op3_${'a'.repeat(32)}` },
    { ...f.binding, jobId: `job3_${'a'.repeat(32)}` }, { ...f.binding, contextKey: `official-truth-context:v3:${'a'.repeat(64)}` }]) {
    assert.deepEqual(await f.ingress().deliver({ ...f.delivery, binding }), { status: 'rejected', reason: 'binding_mismatch' })
  }
  assert.equal(f.intake.captures.length, 0)
})

test('N1 git revision is runner identity only and no researcher metadata grants approval', async (t) => {
  const f = await fixture(t)
  const binding = { ...f.binding, inputRevision: `git:${'a'.repeat(40)}` }
  const result = await f.ingress().deliver({ ...f.delivery, binding })
  assert.equal(result.status, 'recorded')
  assert.equal(f.intake.captures[0].binding.inputRevision, binding.inputRevision)
  assert.equal(f.originals.control.extracts, 0)
  assert.deepEqual(Object.keys(result).sort(), ['reference', 'status'])
})

test('N1 same-operation replay and two real concurrent deliveries retain one fake-intake row', async (t) => {
  const f = await fixture(t)
  const ingress = f.ingress()
  const values = await Promise.all([ingress.deliver(f.delivery), ingress.deliver(f.delivery)])
  for (const value of values) assert.deepEqual(value, { status: 'recorded', reference: f.expected })
  assert.equal(f.intake.rows.size, 1)
  assert.equal(f.intake.captures.length, 2)
  assert.ok(f.intake.captures.every((capture) => capture.binding.operationId === f.binding.operationId
    && capture.binding.deliveryId === f.binding.deliveryId))
})

test('N1 changed whitespace under the same operation reports collision, never retries with a new operation', async (t) => {
  const f = await fixture(t)
  assert.equal((await f.ingress().deliver(f.delivery)).status, 'recorded')
  await fs.appendFile(f.path, ' ')
  assert.deepEqual(await f.ingress().deliver(f.delivery), { status: 'collision' })
  assert.equal(f.intake.rows.size, 1)
  assert.equal(f.intake.confirms.length, 0)
})

test('N1 lost capture ACK is drained before exactly one same-reference confirm', async (t) => {
  const f = await fixture(t)
  const capture = f.intake.port.capture, confirm = f.intake.port.confirm
  const order: string[] = []
  f.intake.port.capture = async (...args) => {
    order.push('capture_started'); await capture(...args); order.push('capture_settled'); throw new Error('synthetic lost ACK')
  }
  f.intake.port.confirm = async (...args) => { order.push('confirm_started'); return confirm(...args) }
  assert.deepEqual(await f.ingress().deliver(f.delivery), { status: 'recorded', reference: f.expected })
  assert.deepEqual(order, ['capture_started', 'capture_settled', 'confirm_started'])
  assert.equal(f.intake.captures.length, 1)
  assert.deepEqual(f.intake.confirms, [f.expected])
})

test('N1 uncertain capture remains unconfirmed when confirm reports absence or a lost reply', async (t) => {
  const f = await fixture(t)
  let captures = 0, confirms = 0
  f.intake.port.capture = async () => { captures++; throw new Error('synthetic uncertain capture') }
  for (const status of ['not_attempted', 'unavailable', 'unconfirmed'] as const) {
    f.intake.port.confirm = async () => { confirms++; return { status } }
    assert.deepEqual(await f.ingress().deliver(f.delivery), { status: 'unconfirmed', reference: f.expected })
  }
  f.intake.port.confirm = async () => { confirms++; throw new Error('synthetic uncertain confirm') }
  assert.deepEqual(await f.ingress().deliver(f.delivery), { status: 'unconfirmed', reference: f.expected })
  assert.equal(captures, 4)
  assert.equal(confirms, 4)
})

test('N1 new reader instance confirms exact retained reference after original file deletion, with no file ledger', async (t) => {
  const f = await fixture(t)
  const capture = f.intake.port.capture
  f.intake.port.capture = async (...args) => { await capture(...args); return { status: 'unconfirmed' } }
  const realConfirm = f.intake.port.confirm
  f.intake.port.confirm = async () => ({ status: 'unavailable' })
  const uncertain = await f.ingress().deliver(f.delivery)
  assert.deepEqual(uncertain, { status: 'unconfirmed', reference: f.expected })
  await fs.unlink(f.path)
  assert.deepEqual(await fs.readdir(f.directory), [])
  f.intake.port.confirm = realConfirm
  let io = 0
  t.mock.method(fs, 'lstat', async () => { io++; throw new Error('confirm must not read file') })
  t.mock.method(fs, 'open', async () => { io++; throw new Error('confirm must not open file') })
  const newReader = f.ingress()
  const reconstructed = JSON.parse(JSON.stringify(f.expected))
  assert.deepEqual(await newReader.confirm(reconstructed), { status: 'recorded', reference: f.expected })
  assert.equal(io, 0)
  assert.equal(f.intake.captures.length, 1)
})

test('N1 validates every acknowledgement reference field and rejects extra fields/getters', async (t) => {
  const f = await fixture(t)
  let confirms = 0, getters = 0
  f.intake.port.confirm = async () => { confirms++; return { status: 'unavailable' } }
  const mismatches = [
    { ...f.expected, proposalDigest: 'b'.repeat(64) }, { ...f.expected, bytes: f.expected.bytes + 1 },
    ...Object.entries({ operationId: `op3_${'b'.repeat(32)}`, jobId: `job3_${'b'.repeat(32)}`,
      contextKey: `official-truth-context:v3:${'b'.repeat(64)}`, runnerId: `runner3_${'b'.repeat(32)}`,
      deliveryId: `delivery3_${'b'.repeat(32)}`, inputRevision: `git:${'b'.repeat(40)}` }).map(([key, value]) =>
      ({ ...f.expected, binding: { ...f.binding, [key]: value } })),
    { ...f.expected, binding: { ...f.binding, method: { ...f.binding.method, revision: 2 } } },
    { ...f.expected, binding: { ...f.binding, method: { ...f.binding.method, methodId: 'other-method' } } },
    { ...f.expected, binding: { ...f.binding, schema: 2 } }, { ...f.expected, binding: { ...f.binding, kind: 'accepted' } },
    { ...f.expected, authority: true },
  ]
  const replies: unknown[] = mismatches.map((reference) => ({ status: 'recorded', reference }))
  replies.push({ status: 'recorded', reference: f.expected, accepted: true }, { status: 'recorded' },
    Object.defineProperty({}, 'status', { enumerable: true, get() { getters++; return 'recorded' } }))
  for (const reply of replies) {
    f.intake.port.capture = async () => malformed(reply)
    assert.deepEqual(await f.ingress().deliver(f.delivery), { status: 'unconfirmed', reference: f.expected })
  }
  assert.equal(confirms, replies.length)
  assert.equal(getters, 0)
})

test('N1 a malformed recorded confirm never substitutes a new reference or creates positive proof', async (t) => {
  const f = await fixture(t)
  f.intake.port.confirm = async () => ({ status: 'recorded', reference:
    must(readV3IntakeReference({ ...f.expected, binding: { ...f.binding, deliveryId: `delivery3_${'c'.repeat(32)}` } })) })
  assert.deepEqual(await f.ingress().confirm(f.expected), { status: 'unconfirmed', reference: f.expected })
  assert.deepEqual(await f.ingress().confirm({ ...f.expected, extra: true }), { status: 'rejected', reason: 'invalid_reference' })
})

test('N1 forwards fixed S1 refusals including duplicate-key preflight without alternate storage', async (t) => {
  const f = await fixture(t)
  // N1 retains exact bytes; the real S1 token preflight is tested by S1 and the
  // later native combination. This fake response is only transport behaviour.
  await fs.writeFile(f.path, f.text.replace('"schema": 3', '"schema": 3, "schema": 3'))
  let captured = ''
  f.intake.port.capture = async (text) => { captured = String(text); return { status: 'rejected', reason: 'invalid_upload' } }
  assert.deepEqual(await f.ingress().deliver(f.delivery), { status: 'rejected', reason: 'invalid_upload' })
  assert.ok(captured.includes('"schema": 3, "schema": 3'))
  assert.equal(f.intake.rows.size, 0)
  assert.equal(f.intake.confirms.length, 0)
})

test('N1 explicit confirm may report no attempt; unknown capture cannot', async (t) => {
  const f = await fixture(t)
  assert.deepEqual(await f.ingress().confirm(f.expected), { status: 'not_attempted' })
})

test('N1 abort during settled capture returns exact unconfirmed reference and never starts confirm', async (t) => {
  const f = await fixture(t)
  const abort = new AbortController()
  const capture = f.intake.port.capture
  f.intake.port.capture = async (...args) => { const result = await capture(...args); abort.abort(); return result }
  assert.deepEqual(await f.ingress().deliver(f.delivery, abort.signal), { status: 'unconfirmed', reference: f.expected })
  assert.equal(f.intake.confirms.length, 0)
  assert.equal(f.intake.captures[0].signal.aborted, true)
})

test('N1 owned timeout drains capture instead of abandoning it or returning a positive late reply', async (t) => {
  const f = await fixture(t)
  let settled = false, confirms = 0
  f.intake.port.capture = async (_text, _binding, signal) => {
    if (!signal.aborted) await new Promise<void>((resolve) => signal.addEventListener('abort', () => resolve(), { once: true }))
    settled = true
    return { status: 'recorded', reference: f.expected }
  }
  f.intake.port.confirm = async () => { confirms++; return { status: 'recorded', reference: f.expected } }
  assert.deepEqual(await f.ingress({ invocationMilliseconds: 200 }).deliver(f.delivery), { status: 'unconfirmed', reference: f.expected })
  assert.equal(settled, true)
  assert.equal(confirms, 0)
})

test('N1 timeout while draining a real open closes its handle and performs no later file/capture IO', async (t) => {
  const f = await fixture(t)
  const open = fs.open.bind(fs)
  let handle: Awaited<ReturnType<typeof fs.open>> | undefined
  t.mock.method(fs, 'open', async (...args: Parameters<typeof fs.open>) => {
    handle = await open(...args)
    await new Promise<void>((resolve) => setTimeout(resolve, 250))
    return handle
  })
  assert.deepEqual(await f.ingress({ invocationMilliseconds: 200 }).deliver(f.delivery), { status: 'unavailable', reason: 'budget_exhausted' })
  assert.equal(handle?.fd, -1)
  assert.equal(f.intake.captures.length, 0)
})
