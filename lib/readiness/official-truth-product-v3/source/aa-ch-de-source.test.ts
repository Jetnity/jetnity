import assert from 'node:assert/strict'
import { EventEmitter } from 'node:events'
import { Resolver } from 'node:dns/promises'
import type { ClientRequest, IncomingMessage } from 'node:http'
import https from 'node:https'
import { performance } from 'node:perf_hooks'
import { test, mock } from 'node:test'
import { sha256Hex } from '@/lib/readiness/digest'
import { hrs1Clock, hrs1OriginalEvidence, type Hrs1Binding } from '../result/contract'
import { createHrs1SourceConsumer } from '../result/source-proof'
import { AA_CH_DE_PUBLICATION, BERN_CH_DE_PUBLICATION, selectedAaChDeQualification,
  type AaChDeSourceRole } from './aa-ch-de-definition'
import { readAaChDeOwnedSource, readBernChDeOwnedSource, readAaChDeOwnedSources,
  inspectAaChDeOwnedOriginal, inspectAaChDeOwnedAttempt, type AaChDeOwnedOriginal } from './aa-ch-de-owned-read'
import { qualifyAaChDeOriginal, selectedAaChDeProgramForBinding } from './aa-ch-de-qualification'
import { AA_CH_DE_SOURCE_CUSTODY_ISSUER as issuer } from './aa-ch-de-issuer'

type WireOptions = Readonly<{ status?: number; headers?: readonly string[]; body?: string | Buffer;
  complete?: boolean; hangBody?: boolean; holdClose?: boolean }>
type WireRequestOptions = https.RequestOptions & { autoSelectFamily?: boolean }
function syntheticWire(options: WireOptions = {}, counterOptions: WireOptions = options) {
  let active = 0
  const requests: WireRequestOptions[] = [], dns: string[] = []
  const releases = new Map<AaChDeSourceRole, () => void>()
  mock.method(Resolver.prototype, 'resolve4', (async (hostname: string) => { dns.push(hostname); return ['1.1.1.1'] }) as Resolver['resolve4'])
  mock.method(Resolver.prototype, 'resolve6', (async (hostname: string) => { dns.push(hostname); return [] }) as Resolver['resolve6'])
  mock.method(Resolver.prototype, 'cancel', () => undefined)
  const implementation = ((configuration: WireRequestOptions, callback: (response: IncomingMessage) => void) => {
    assert.ok(([AA_CH_DE_PUBLICATION.hostname, BERN_CH_DE_PUBLICATION.hostname] as readonly string[]).includes(String(configuration.hostname)))
    const role = configuration.hostname === AA_CH_DE_PUBLICATION.hostname ? 'primary' : 'counter'
    const selected = role === 'primary' ? options : counterOptions
    const body = selected.body ?? '<html><body>synthetic transport fixture</body></html>'
    active++; requests.push(configuration)
    const request = new EventEmitter() as EventEmitter & { end(): void; destroy(): void }
    const response = new EventEmitter() as EventEmitter & { statusCode: number; rawHeaders: string[]; complete: boolean; destroy(): void }
    const socket = new EventEmitter() as EventEmitter & { destroy(): void }
    let closed = false
    const close = () => {
      if (closed) return
      closed = true; active--
      response.emit('close'); request.emit('close'); socket.emit('close')
    }
    releases.set(role, close)
    const destroy = () => { if (!selected.holdClose) queueMicrotask(close) }
    request.destroy = response.destroy = socket.destroy = destroy
    response.statusCode = selected.status ?? 200
    response.rawHeaders = [...(selected.headers ?? ['Content-Type', 'text/html;charset=UTF-8', 'Content-Length', String(Buffer.byteLength(body))])]
    response.complete = selected.complete ?? true
    request.end = () => {
      request.emit('socket', socket)
      queueMicrotask(() => {
        callback(response as unknown as IncomingMessage)
        if (selected.hangBody) return
        queueMicrotask(() => {
          response.emit('data', Buffer.from(body))
          response.emit('end')
          if (!selected.holdClose) queueMicrotask(close)
        })
      })
    }
    return request as unknown as ClientRequest
  }) as typeof https.request
  mock.method(https, 'request', implementation)
  return { requests, dns, get calls() { return requests.length }, get active() { return active },
    release(role: AaChDeSourceRole) { releases.get(role)?.() }, releaseAll() { for (const release of releases.values()) release() } }
}
const tick = () => new Promise<void>(resolve => setImmediate(resolve))
const readerFor = (role: AaChDeSourceRole) => role === 'primary' ? readAaChDeOwnedSource : readBernChDeOwnedSource
const publicationFor = (role: AaChDeSourceRole) => role === 'primary' ? AA_CH_DE_PUBLICATION : BERN_CH_DE_PUBLICATION

test('AA/Bern source: malformed requests and copied issuer receipts cannot create authority or perform I/O', async () => {
  const fail = () => { assert.fail('invalid issuer input attempted DNS/HTTP') }
  mock.method(Resolver.prototype, 'resolve4', fail as Resolver['resolve4'])
  mock.method(Resolver.prototype, 'resolve6', fail as Resolver['resolve6'])
  mock.method(https, 'request', fail as typeof https.request)
  try {
    const signal = new AbortController().signal, bad = {} as never
    assert.equal(await issuer.inspect(bad, signal), null)
    assert.equal(await issuer.finalize({}, bad, bad, null, bad, signal), null)
    assert.equal(await issuer.reprove({}, bad, bad, signal), null)
    assert.equal(await issuer.reopen(bad, signal), null)
    assert.deepEqual(await issuer.observe(bad, bad, signal), { status: 'unavailable' })
    assert.equal(await issuer.reproveObservation({}, bad, bad, signal), null)
    assert.equal(inspectAaChDeOwnedOriginal({ bodyText: 'copied', rawDigest: 'forged' }), null)
    assert.equal(inspectAaChDeOwnedAttempt({ status: 'unavailable', reason: 'dns_failed' }), null)
  } finally { mock.restoreAll() }
})

test('AA/Bern source: each complete fixed read joins resources and retains exact role-bound original and attempt', async () => {
  for (const role of ['primary','counter'] as const) {
    const wire = syntheticWire()
    try {
      const read = await readerFor(role)(new AbortController().signal, performance.now() + 2000)
      assert.equal(read.status, 'read'); assert.equal(wire.calls, 1); assert.equal(wire.active, 0)
      if (read.status !== 'read') assert.fail('synthetic read')
      const original = inspectAaChDeOwnedOriginal(read.receipt), attempt = inspectAaChDeOwnedAttempt(read.receipt)
      assert.ok(original); assert.ok(attempt)
      assert.equal(original.bodyText, '<html><body>synthetic transport fixture</body></html>')
      assert.equal(original.bytes, Buffer.byteLength(original.bodyText)); assert.equal(original.role, role)
      assert.equal(original.requestUrl, publicationFor(role).url); assert.equal(original.redirectCount, 0)
      assert.equal(original.rawDigest, sha256Hex(original.bodyText)); assert.equal(Object.isFrozen(original), true)
      assert.equal(attempt.role, role); assert.equal(attempt.startedAt, original.startedAt)
      assert.equal(attempt.completedAt, original.retrievedAt); assert.equal(attempt.status, 'read'); assert.equal(attempt.reason, null)
      assert.equal(Object.isFrozen(attempt), true)
      assert.equal(inspectAaChDeOwnedOriginal({ ...read.receipt }), null)
      assert.equal(inspectAaChDeOwnedOriginal({ ...original }), null)
      assert.equal(inspectAaChDeOwnedAttempt({ ...attempt }), null)
      const sent = wire.requests[0]!
      assert.equal(sent.hostname, publicationFor(role).hostname); assert.equal(sent.servername, publicationFor(role).hostname)
      assert.equal(sent.rejectUnauthorized, true); assert.equal(sent.method, 'GET'); assert.equal(sent.path, publicationFor(role).path)
      assert.equal(sent.port, 443); assert.equal(sent.autoSelectFamily, false)
      assert.deepEqual(wire.dns, [publicationFor(role).hostname, publicationFor(role).hostname])
    } finally { wire.releaseAll(); mock.restoreAll() }
  }
})

test('AA/Bern source: one paired operation makes exactly two distinct publication attempts and preserves both receipts', async () => {
  const wire = syntheticWire({ body: '<html>primary transport bytes</html>' }, { body: '<html>counter transport bytes</html>' })
  try {
    const reads = await readAaChDeOwnedSources(new AbortController().signal, performance.now() + 2000)
    assert.equal(reads.primary.status, 'read'); assert.equal(reads.counter.status, 'read')
    assert.equal(wire.calls, 2); assert.equal(wire.dns.length, 4); assert.equal(wire.active, 0)
    if (reads.primary.status !== 'read' || reads.counter.status !== 'read') assert.fail('paired fixture')
    assert.notEqual(reads.primary.receipt, reads.counter.receipt)
    const aa = inspectAaChDeOwnedOriginal(reads.primary.receipt), bern = inspectAaChDeOwnedOriginal(reads.counter.receipt)
    assert.ok(aa); assert.ok(bern)
    assert.equal(aa.role, 'primary'); assert.equal(bern.role, 'counter')
    assert.equal(aa.requestUrl, AA_CH_DE_PUBLICATION.url); assert.equal(bern.requestUrl, BERN_CH_DE_PUBLICATION.url)
    assert.notEqual(aa.bodyText, bern.bodyText); assert.notEqual(aa.rawDigest, bern.rawDigest)
    // A real transport receipt still is not an issuer receipt or a history proof.
    const bad = {} as never, signal = new AbortController().signal
    assert.equal(await issuer.reprove(reads.primary.receipt, bad, bad, signal), null)
    assert.equal(await issuer.reprove(reads.counter.receipt, bad, bad, signal), null)
    assert.equal(await issuer.finalize(reads.counter.receipt, bad, bad, null, bad, signal), null)
    assert.equal(await issuer.reproveObservation(reads.primary.receipt, bad, bad, signal), null)
  } finally { wire.releaseAll(); mock.restoreAll() }
})

test('AA/Bern source: status, redirect, framing, duplicate-header, encoding and byte refusals never retry', async () => {
  const cases: readonly WireOptions[] = [
    { status: 302 }, { status: 403 }, { complete: false },
    { headers: ['Content-Type','text/html','Content-Length','1','Content-Length','1'] },
    { headers: ['Content-Type','text/html','Content-Length','1','Transfer-Encoding','chunked'] },
    { headers: ['Content-Type','text/html','Content-Encoding','gzip'] },
    { headers: ['Content-Type','application/json'] },
    { headers: ['Content-Type','text/html','Content-Length','1'] },
    { headers: ['Content-Type','text/html'], body: 'x'.repeat(AA_CH_DE_PUBLICATION.maximumBytes + 1) },
    { body: Buffer.from([0xc3,0x28]) }, { body: Buffer.from([0xef,0xbb,0xbf,0x61]) }, { body: '' },
  ]
  for (const role of ['primary','counter'] as const) for (const item of cases) {
    const wire = syntheticWire(item)
    try {
      const result = await readerFor(role)(new AbortController().signal, performance.now() + 2000)
      assert.equal(result.status, 'unavailable'); assert.equal(wire.calls, 1); assert.equal(wire.active, 0)
      if (result.status !== 'unavailable') assert.fail('refused frame')
      assert.ok(result.attempt)
      const attempt = inspectAaChDeOwnedAttempt(result.attempt)
      assert.ok(attempt); assert.equal(attempt.role, role); assert.equal(attempt.status, 'unavailable')
      assert.equal(attempt.reason, result.reason); assert.equal(inspectAaChDeOwnedOriginal(result.attempt), null)
    } finally { wire.releaseAll(); mock.restoreAll() }
  }
})

test('AA/Bern source: real Bern DNS failure is privately recorded while the independent primary remains exact', async () => {
  const wire = syntheticWire()
  mock.method(Resolver.prototype, 'resolve4', (async (host: string) => {
    if (host === BERN_CH_DE_PUBLICATION.hostname) throw new Error('synthetic DNS failure')
    return ['1.1.1.1']
  }) as Resolver['resolve4'])
  mock.method(Resolver.prototype, 'resolve6', (async (host: string) => {
    if (host === BERN_CH_DE_PUBLICATION.hostname) throw new Error('synthetic DNS failure')
    return []
  }) as Resolver['resolve6'])
  try {
    const result = await readAaChDeOwnedSources(new AbortController().signal, performance.now() + 2000)
    assert.equal(result.primary.status, 'read'); assert.equal(result.counter.status, 'unavailable')
    if (result.counter.status !== 'unavailable') assert.fail('counter failure')
    assert.equal(result.counter.reason, 'dns_failed'); assert.ok(result.counter.attempt)
    const attempt = inspectAaChDeOwnedAttempt(result.counter.attempt)
    assert.ok(attempt); assert.equal(attempt.requestUrl, BERN_CH_DE_PUBLICATION.url)
    assert.equal(attempt.role, 'counter'); assert.equal(attempt.status, 'unavailable'); assert.equal(attempt.reason, 'dns_failed')
    assert.ok(attempt.completedAt >= attempt.startedAt)
    assert.equal(inspectAaChDeOwnedOriginal(result.counter.attempt), null)
    assert.equal(inspectAaChDeOwnedAttempt({ ...attempt }), null)
    assert.equal(wire.calls, 1); assert.equal(wire.requests[0]!.hostname, AA_CH_DE_PUBLICATION.hostname); assert.equal(wire.active, 0)
  } finally { wire.releaseAll(); mock.restoreAll() }
})

test('AA/Bern source: shared two-operation cap never starts a third DNS or HTTP attempt', async () => {
  const wire = syntheticWire({ hangBody: true, holdClose: true }), controller = new AbortController()
  let settled = false
  const pending = readAaChDeOwnedSources(controller.signal, performance.now() + 2000).then(result => { settled = true; return result })
  try {
    await tick()
    assert.equal(wire.calls, 2); assert.equal(wire.active, 2); assert.equal(wire.dns.length, 4)
    const extra = await readBernChDeOwnedSource(new AbortController().signal, performance.now() + 1000)
    assert.deepEqual(extra, { status: 'unavailable', reason: 'busy', attempt: null })
    assert.equal(wire.calls, 2); assert.equal(wire.dns.length, 4)
    controller.abort(); await tick(); assert.equal(settled, false)
    wire.release('primary'); await tick(); assert.equal(settled, false); assert.equal(wire.active, 1)
    wire.release('counter')
    const result = await pending
    assert.equal(result.primary.status, 'unavailable'); assert.equal(result.counter.status, 'unavailable')
    assert.equal(wire.active, 0)
  } finally { controller.abort(); wire.releaseAll(); await pending; mock.restoreAll() }
})

test('AA/Bern source: a counter refusal cannot return while the other actual connection is still open', async () => {
  const wire = syntheticWire({ hangBody: true, holdClose: true }, { status: 403 }), controller = new AbortController()
  let settled = false
  const pending = readAaChDeOwnedSources(controller.signal, performance.now() + 2000).then(result => { settled = true; return result })
  try {
    await tick(); assert.equal(wire.calls, 2); assert.equal(wire.active, 1); assert.equal(settled, false)
    controller.abort(); await tick(); assert.equal(settled, false)
    wire.release('primary')
    const result = await pending
    assert.equal(result.counter.status, 'unavailable')
    if (result.counter.status !== 'unavailable') assert.fail('counter refusal')
    assert.equal(result.counter.reason, 'http_status'); assert.equal(wire.active, 0)
  } finally { controller.abort(); wire.releaseAll(); await pending; mock.restoreAll() }
})

test('AA/Bern source: cancelling DNS joins both native operations, including a synchronous peer failure', async () => {
  let release: (() => void) | null = null, cancelled = 0, calls = 0, settled = false
  mock.method(Resolver.prototype, 'resolve4', (() => new Promise<string[]>((resolve, reject) => {
    void resolve; release = () => reject(new Error('synthetic cancellation'))
  })) as unknown as Resolver['resolve4'])
  mock.method(Resolver.prototype, 'resolve6', (() => { throw new Error('synthetic synchronous failure') }) as Resolver['resolve6'])
  mock.method(Resolver.prototype, 'cancel', () => { cancelled++ })
  mock.method(https, 'request', (() => { calls++; assert.fail('DNS failure reached HTTP') }) as typeof https.request)
  const controller = new AbortController()
  const pending = readBernChDeOwnedSource(controller.signal, performance.now() + 2000).then(value => { settled = true; return value })
  try {
    await tick(); controller.abort(); await tick()
    assert.ok(cancelled >= 1); assert.equal(settled, false); assert.equal(calls, 0)
    const join = release as (() => void) | null; assert.ok(join); join()
    const result = await pending
    assert.equal(result.status, 'unavailable'); assert.equal(calls, 0)
  } finally { controller.abort(); const join = release as (() => void) | null; join?.(); await pending; mock.restoreAll() }
})

test('AA/Bern source: private DNS addresses and already-aborted calls never open HTTP or invent a completed read', async () => {
  let calls = 0
  mock.method(Resolver.prototype, 'resolve4', (async () => ['127.0.0.1']) as unknown as Resolver['resolve4'])
  mock.method(Resolver.prototype, 'resolve6', (async () => []) as Resolver['resolve6'])
  mock.method(Resolver.prototype, 'cancel', () => undefined)
  mock.method(https, 'request', (() => { calls++; assert.fail('refused address reached HTTP') }) as typeof https.request)
  try {
    for (const role of ['primary','counter'] as const) {
      const refused = await readerFor(role)(new AbortController().signal, performance.now() + 2000)
      assert.equal(refused.status, 'unavailable')
      if (refused.status !== 'unavailable') assert.fail('address refusal')
      assert.equal(refused.reason, 'address_refused'); assert.ok(refused.attempt)
      assert.equal(inspectAaChDeOwnedOriginal(refused.attempt), null)
      const controller = new AbortController(); controller.abort()
      const aborted = await readerFor(role)(controller.signal, performance.now() + 2000)
      assert.deepEqual(aborted, { status: 'unavailable', reason: 'aborted', attempt: null })
    }
    assert.equal(calls, 0)
  } finally { mock.restoreAll() }
})

test('AA/Bern source: reviewed binding cannot omit, swap, duplicate or relabel its counter', () => {
  const program = selectedAaChDeQualification()
  assert.ok(program)
  assert.equal(selectedAaChDeProgramForBinding(program.binding), program)
  assert.equal(program.binding.sources.length, 2); assert.equal(program.counterInventory.eligibleRepresentations.length, 1)
  assert.notEqual(program.source.contentItemId, program.counter.source.contentItemId)
  for (const sources of [[program.sourceBinding], [program.counter.sourceBinding, program.sourceBinding],
    [program.sourceBinding, program.sourceBinding], [program.sourceBinding, { ...program.counter.sourceBinding, role: 'primary' as const }],
    [program.sourceBinding, { ...program.counter.sourceBinding, canonicalUrl: AA_CH_DE_PUBLICATION.url }]]) {
    assert.equal(selectedAaChDeProgramForBinding({ ...program.binding, sources }), null)
  }
})

test('AA/Bern source: production consumer requires the exact reviewed binding before any source or database I/O', () => {
  const fail = () => { assert.fail('binding selection performed I/O') }
  mock.method(Resolver.prototype, 'resolve4', fail as Resolver['resolve4'])
  mock.method(Resolver.prototype, 'resolve6', fail as Resolver['resolve6'])
  mock.method(https, 'request', fail as typeof https.request)
  try {
    const program = selectedAaChDeQualification(); assert.ok(program)
    const at = hrs1Clock(program.binding.activeFrom, program.binding.legalTimeZone); assert.ok(at)
    const consumer = (binding: Hrs1Binding) => createHrs1SourceConsumer({ binding, registry: program.registry,
      fixed: async () => assert.fail('binding selection dispatched database work'), clock: () => at, fixtureIssuer: issuer })
    const selected = consumer(program.binding)
    assert.equal(selected.available, true)
    assert.equal(selected.held({}), null, 'selected configuration is not a source receipt')
    for (const binding of [
      { ...program.binding, methodDigest: '0'.repeat(64) },
      { ...program.binding, packageDigest: '0'.repeat(64) },
      { ...program.binding, contextKey: 'official-truth-context:v3:' + '0'.repeat(64) },
      { ...program.binding, sources: program.binding.sources.map((source, index) => ({ ...source,
        canonicalUrl: 'https://hrs1-synthetic-' + index + '.example/fictional-visa-rules' })) },
      { ...program.binding, dataMode: 'synthetic_test' as const },
    ]) assert.equal(consumer(binding).available, false, 'foreign binding cannot select production or use fixture fallback')
  } finally { mock.restoreAll() }
})

test('AA/Bern source: unrelated counter body remains an original ambiguity, never an agreement or manufactured fact', () => {
  const program = selectedAaChDeQualification()
  assert.ok(program)
  const at = hrs1Clock(program.binding.activeFrom, program.binding.legalTimeZone); assert.ok(at)
  const bodyText = '<html><body>unrelated publication with no entry rule</body></html>'
  const raw: AaChDeOwnedOriginal = { role: 'counter', requestUrl: BERN_CH_DE_PUBLICATION.url, finalUrl: BERN_CH_DE_PUBLICATION.url,
    method: 'GET', redirectCount: 0, httpStatus: 200, contentType: 'text/html', bodyText,
    bytes: Buffer.byteLength(bodyText), rawDigest: sha256Hex(bodyText), retrievedAt: at.now, startedAt: at.now }
  const result = qualifyAaChDeOriginal(raw, program.binding, at)
  assert.ok(result); assert.equal(result.outcome.status, 'unclear'); assert.equal(result.original.observation, null)
  assert.equal(result.original.qualification.role, 'counter')
  assert.deepEqual(hrs1OriginalEvidence(result.original).source, program.counter.source)
  assert.equal(result.original.bodyText, bodyText); assert.equal(result.original.rawDigest, raw.rawDigest)
  assert.equal(inspectAaChDeOwnedOriginal(raw), null)
  assert.equal(qualifyAaChDeOriginal({ ...raw, role: 'primary' }, program.binding, at), null)
  assert.equal(qualifyAaChDeOriginal({ ...raw, finalUrl: AA_CH_DE_PUBLICATION.url }, program.binding, at), null)
})

test('AA/Bern source: copied history, empty counter attempts and fabricated expiry are refused before any source read', async () => {
  const fail = () => { assert.fail('unproved history performed source I/O') }
  mock.method(Resolver.prototype, 'resolve4', fail as Resolver['resolve4'])
  mock.method(Resolver.prototype, 'resolve6', fail as Resolver['resolve6'])
  mock.method(https, 'request', fail as typeof https.request)
  try {
    const signal = new AbortController().signal
    for (const copied of [
      { reference: 'copied', originals: [], history: {}, validUntilExclusive: '2999-01-01T00:00:00.000Z' },
      { reference: 'copied', originals: [{ bodyText: 'copied' }], decision: { counterCheck: { attempts: [] } } },
      { reference: 'copied', decision: { counterCheck: { attempts: [{ status: 'agrees', source: null }] } } },
    ]) assert.equal(await issuer.reopen(copied as never, signal), null)
  } finally { mock.restoreAll() }
})
