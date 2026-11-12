import assert from 'node:assert/strict'
import { execFileSync } from 'node:child_process'
import { test, type TestContext } from 'node:test'
import { readFileSync, readdirSync } from 'node:fs'
import { join, relative } from 'node:path'
import { createHash } from 'node:crypto'
import { EventEmitter } from 'node:events'
import { Readable } from 'node:stream'
import { syncBuiltinESMExports } from 'node:module'
import dns from 'node:dns'
import https from 'node:https'
import type { IncomingMessage, ClientRequest } from 'node:http'
import { bp1QuarantineCatalog, observeBp1Once } from '../../../scripts/official-truth-bundesportal-bp1-observation-1/source-probe'
import { BP1_URL, bp1Report, bp1ReportSchema, observeBp1Text, serializeBp1Report } from '../../../scripts/official-truth-bundesportal-bp1-observation-1/observations'
import { runBp1 } from '../../../scripts/official-truth-bundesportal-bp1-observation-1/run'
import { decideOfficialTruthServerOwnedRetrieval, type OfficialTruthServerOwnedRetrievalAbhaengigkeiten } from '../official-truth-server-owned-retrieval'
import { OFFICIAL_TRUTH_CONTENT_IDENTITY_PROFILE_REGISTRY } from '../official-truth-content-identity'
import { applicationContract, applicationPilotEnabled } from '../official-truth-ch-de-application-pilot-1/contract-server'

// Invented minimal material, NOT copied or reconstructed Bundesportal HTML.
const SYNTHETIC = `<!doctype html><html lang="de"><head><link rel="canonical" href="${BP1_URL}"></head><body>
<h1>Visum: synthetic test heading</h1><p data-service="99125003001000" data-publisher="LeiKa-583471">
Synthetic Schweiz visumfrei cue — not legal evidence.</p></body></html>`
const SENTINEL = 'SYNTHETIC_PRIVATE_PASSPORT_ABC123_person@example.invalid'

type Options = { bytes?: Uint8Array; status?: number; media?: string; length?: string; encoding?: string;
  location?: string; address?: string; fail?: boolean; partial?: boolean; timeout?: boolean }
async function canonical(options: Options = {}, input?: unknown) {
  const q = bp1QuarantineCatalog()
  let requests = 0, cancelled = 0
  const deps: OfficialTruthServerOwnedRetrievalAbhaengigkeiten = {
    catalog: q.catalog, now: () => new Date('2026-10-14T10:00:00Z'), timeoutMs: 5,
    resolve: async () => [{ address: options.address ?? '93.184.216.34', family: 4 }],
    http: async ({ lookup, url }) => {
      requests++
      await new Promise<void>((ok, fail) => lookup(new URL(url).hostname, {}, e => e ? fail(e) : ok()))
      if (options.fail) throw Error(SENTINEL)
      if (options.timeout) return new Promise(() => {})
      return { ok: true, status: options.status ?? 200,
        headers: { get: key => ({ 'content-type': options.media ?? 'text/html; charset=utf-8',
          'content-length': options.length, 'content-encoding': options.encoding, location: options.location })[key] ?? null },
        body: (async function* () { yield options.bytes ?? Buffer.from(SYNTHETIC); if (options.partial) throw Error(SENTINEL) })(),
        cancel() { cancelled++ }, framingComplete: () => false,
      }
    },
  }
  const result = await decideOfficialTruthServerOwnedRetrieval(input ?? q.request, deps)
  return { result, observed: q.takeObservation(), requests, cancelled }
}

/** Native mocks only: the actual adapter calls the unchanged isolated seam,
 * server DNS/HTTPS construction, stream decoder and quarantine verifier. */
function native(t: TestContext, options: Options = {}) {
  const calls: https.RequestOptions[] = []
  let lookups = 0
  t.mock.method(dns, 'lookup', (_host: string, _opts: unknown, cb: (error: Error | null, rows?: unknown[]) => void) => {
    lookups++; cb(null, [{ address: options.address ?? '93.184.216.34', family: 4 }])
  })
  syncBuiltinESMExports()
  t.after(() => { t.mock.restoreAll(); syncBuiltinESMExports() })
  t.mock.method(https, 'request', (opts: https.RequestOptions, cb: (r: IncomingMessage) => void) => {
    calls.push(opts)
    const request = new EventEmitter() as ClientRequest
    request.destroy = (() => { request.emit('close'); return request }) as typeof request.destroy
    request.end = (() => {
      queueMicrotask(() => {
        const lookup = opts.lookup as (h: string, o: object, c: (e: Error | null) => void) => void
        lookup(String(opts.hostname), {}, error => {
          if (error || options.fail) { request.emit('error', error ?? Error(SENTINEL)); return }
          if (options.timeout) return
          const response = Readable.from((async function* () {
            yield options.bytes ?? Buffer.from(SYNTHETIC)
            if (options.partial) throw Error(SENTINEL)
          })()) as IncomingMessage
          response.statusCode = options.status ?? 200
          response.headers = { 'content-type': options.media ?? 'text/html; charset=utf-8',
            'content-length': options.length, 'content-encoding': options.encoding, location: options.location,
            'set-cookie': [SENTINEL], 'x-private-test': SENTINEL }
          response.complete = false // Existing isolated seam does NOT independently check this.
          cb(response)
        })
      })
      return request
    }) as typeof request.end
    return request
  })
  return { calls, lookups: () => lookups }
}
function safe(report: Awaited<ReturnType<typeof observeBp1Once>>) {
  const text = serializeBp1Report(report)
  assert.ok(Buffer.byteLength(text, 'utf8') <= 8192)
  assert.equal(bp1ReportSchema.safeParse(JSON.parse(text)).success, true)
  assert.doesNotMatch(text, /SYNTHETIC_PRIVATE|person@example|<!doctype|<html|sourceSnapshot|sourceContentHash/)
  assert.equal(report.sourceQualified, false)
  assert.equal(report.acceptedRuleCreated, false)
  assert.equal(report.independentReviewRequired, true)
  assert.equal(report.renderedStatement, 'NOT_ASSESSED')
  assert.equal(report.privacyAndRights, 'NOT_CLEARED')
}

test('default/plan/import and malformed or extra arguments cannot reach native network', async t => {
  const n = native(t)
  await import('../../../scripts/official-truth-bundesportal-bp1-observation-1/run')
  for (const args of [[], ['--plan']]) {
    const result = await runBp1(args)
    assert.equal(result.report.outcome, 'NOT_RUN'); assert.equal(result.exitCode, 0)
    assert.equal(result.report.startedAt, null); assert.equal(result.report.completeBodyBytes, null)
    assert.ok(Object.values(result.report.indicators).every(x => x === null)); safe(result.report)
  }
  let getterCalls = 0
  const accessor = Object.defineProperty([], '0', { get() { getterCalls++; return '--observe-bp1-once' } })
  for (const args of [null, {}, '--observe-bp1-once', ['--live'], ['--observe-bp1-once', BP1_URL],
    ['--observe-bp1-once', '--observe-bp1-once'], ['--url', BP1_URL], [BP1_URL], [undefined],
    new Array(1), accessor, Object.assign(['--observe-bp1-once'], { url: BP1_URL })]) {
    const result = await runBp1(args)
    assert.equal(result.report.outcome, 'INVALID_ARGUMENTS'); assert.equal(result.exitCode, 2); safe(result.report)
  }
  assert.equal((await observeBp1Once({ url: BP1_URL })).outcome, 'INVALID_ARGUMENTS')
  assert.equal(getterCalls, 0); assert.equal(n.calls.length, 0); assert.equal(n.lookups(), 0)
})

test('explicit simulated command uses exactly one fixed native GET and always refuses matching identity', async t => {
  const n = native(t, { bytes: Buffer.from(SYNTHETIC + SENTINEL) })
  const { report, exitCode } = await runBp1(['--observe-bp1-once'])
  assert.equal(exitCode, 0); assert.equal(report.outcome, 'UNQUALIFIED_BODY_OBSERVED')
  assert.equal(report.reason, 'content_identity_mismatch')
  assert.equal(report.completeBodyBytes, Buffer.byteLength(SYNTHETIC + SENTINEL))
  assert.equal(report.indicators.germanHtmlLang, 1); assert.equal(report.indicators.exactCanonicalLinks, 1)
  assert.ok(report.startedAt && report.completedAt && report.completedAt >= report.startedAt)
  assert.equal(n.calls.length, 1); assert.equal(n.lookups(), 1)
  const request = n.calls[0]!
  assert.equal(request.method, 'GET'); assert.equal(request.hostname, 'verwaltung.bund.de')
  assert.equal(request.path, new URL(BP1_URL).pathname); assert.equal(request.rejectUnauthorized, true)
  assert.equal(request.servername, 'verwaltung.bund.de'); assert.equal(request.port, 443)
  assert.doesNotMatch(JSON.stringify(request.headers), /authorization|cookie|referer|passport|trip|person@example/i)
  safe(report)
})

for (const [name, options, reason] of [
  ['empty', { bytes: Buffer.alloc(0) }, 'empty_body'],
  ['partial stream', { partial: true }, 'http_failed'],
  ['declared oversize', { length: '65537' }, 'response_too_large'],
  ['observed oversize', { bytes: Buffer.alloc(65_537, 97) }, 'response_too_large'],
  ['invalid UTF8', { bytes: Buffer.from([0xc3, 0x28]) }, 'invalid_utf8'],
  ['BOM UTF8', { bytes: Buffer.from([0xef, 0xbb, 0xbf, 65]) }, 'invalid_utf8'],
  ['wrong media', { media: 'application/json' }, 'content_type_mismatch'],
  ['wrong charset', { media: 'text/html; charset=iso-8859-1' }, 'content_type_mismatch'],
  ['compressed', { encoding: 'gzip' }, 'http_failed'],
  ['malformed length', { length: 'unknown' }, 'http_failed'],
  ['challenge', { status: 403 }, 'http_status'],
  ['server error', { status: 500 }, 'http_status'],
  ['native error', { fail: true }, 'http_failed'],
  ['private DNS', { address: '127.0.0.1' }, 'address_not_permitted'],
  ['other URL redirect', { status: 302, location: '/moved' }, 'representation_url_mismatch'],
  ['self redirect', { status: 307, location: BP1_URL }, 'redirect_loop'],
  ['external redirect', { status: 308, location: 'https://example.invalid/' }, 'unregistered_domain'],
] as const) test(`actual adapter/native synthetic refusal: ${name}`, async t => {
  const n = native(t, options)
  const report = await observeBp1Once()
  assert.equal(report.reason, reason); assert.equal(report.outcome, 'REFUSED')
  assert.equal(report.completeBodyBytes, null); assert.ok(Object.values(report.indicators).every(x => x === null))
  assert.equal(n.calls.length, 1); safe(report)
})

test('actual fixed 10000ms timeout cancels and cannot reuse a previous observation', async t => {
  const n = native(t, { timeout: true })
  t.mock.timers.enable({ apis: ['setTimeout'] })
  const pending = observeBp1Once()
  await new Promise<void>(resolve => setImmediate(resolve))
  t.mock.timers.tick(10_001)
  const report = await pending
  assert.equal(report.reason, 'timeout'); assert.equal(report.completeBodyBytes, null)
  assert.equal(n.calls.length, 1); safe(report)
})

test('invocation state is fresh after success, failure and late verifier calls', async t => {
  const n = native(t)
  const first = await observeBp1Once()
  assert.ok(first.completeBodyBytes)
  t.mock.method(https, 'request', () => { throw Error(SENTINEL) })
  const second = await observeBp1Once()
  assert.equal(second.reason, 'http_failed'); assert.equal(second.completeBodyBytes, null)
  assert.ok(Object.values(second.indicators).every(x => x === null)); safe(second)
  assert.equal(n.calls.length, 1)
  const q = bp1QuarantineCatalog(), verify = q.catalog.identityProfiles[0]!.verify
  const input = { item: {}, representation: {}, responseText: SYNTHETIC, finalUrl: BP1_URL, mediaType: 'text/html' }
  assert.deepEqual(verify(input as never), { ok: false, reason: 'identity_mismatch' })
  assert.ok(q.takeObservation()); assert.equal(q.takeObservation(), null)
  verify(input as never); assert.equal(q.takeObservation(), null)
})

for (const status of Array.from({ length: 100 }, (_, i) => 300 + i)) test(`canonical HTTP ${status}: no second GET`, async () => {
  const result = await canonical({ status, location: BP1_URL })
  assert.equal(result.result.status, 'blocked'); assert.equal(result.requests, 1); assert.equal(result.observed, null)
})

for (const bytes of [Buffer.alloc(65_536, 97), Buffer.from('é'.repeat(32_768))]) test('exact 65536 complete UTF8 bytes stay unqualified', async () => {
  const result = await canonical({ bytes })
  assert.deepEqual(result.result, { status: 'blocked', reason: 'content_identity_mismatch' })
  assert.equal(result.observed?.bytes, 65_536)
})

test('reports actual legacy seam limits: 206, short declared body and no independent framing proof', async () => {
  const result = await canonical({ status: 206, length: '60000' })
  assert.deepEqual(result.result, { status: 'blocked', reason: 'content_identity_mismatch' })
  assert.equal(result.observed?.bytes, Buffer.byteLength(SYNTHETIC))
  const timeout = await canonical({ timeout: true })
  assert.deepEqual(timeout.result, { status: 'blocked', reason: 'timeout' }); assert.equal(timeout.observed, null)
})

test('only fixed URL routes; caller input never provides authority', async () => {
  for (const patch of [{ url: BP1_URL + '?x=1' }, { url: BP1_URL + '/other' }, { url: 'https://example.invalid/' },
    { headers: { Authorization: SENTINEL } }, { body: SYNTHETIC }, { catalog: {} }, { passportNumber: SENTINEL }]) {
    const q = bp1QuarantineCatalog()
    const result = await canonical({}, { ...q.request, ...patch })
    assert.equal(result.result.status, 'blocked'); assert.equal(result.requests, 0); assert.equal(result.observed, null)
  }
})

test('wrong, duplicate, removed, negated, inert and hidden cues never confirm any rule', async () => {
  for (const text of [SYNTHETIC, SYNTHETIC.replaceAll('99125003001000', '99100000000000'),
    SYNTHETIC.replaceAll('LeiKa-583471', 'Other-publisher'), SYNTHETIC.replace('lang="de"', 'lang="en"'),
    SYNTHETIC.replace(`href="${BP1_URL}"`, 'href="https://example.invalid/"'), SYNTHETIC + SYNTHETIC,
    '<script>' + SYNTHETIC + '</script>', '<!--' + SYNTHETIC + '-->', '<div hidden>' + SYNTHETIC + '</div>',
    SYNTHETIC.replace('visumfrei', 'nicht visumfrei'), SYNTHETIC.replace('visumfrei', ''),
    '<noscript>JavaScript aktivieren</noscript><script>hydrate()</script>']) {
    const result = await canonical({ bytes: Buffer.from(text) })
    assert.deepEqual(result.result, { status: 'blocked', reason: 'content_identity_mismatch' })
    assert.ok(result.observed)
    const report = bp1Report({ mode: 'OBSERVATION', outcome: 'UNQUALIFIED_BODY_OBSERVED', reason: 'content_identity_mismatch',
      completeBodyBytes: result.observed.bytes, indicators: result.observed.indicators })
    safe(report)
  }
  assert.equal(observeBp1Text(SYNTHETIC.replaceAll('99125003001000', 'wrong')).serviceId, 0)
  assert.equal(observeBp1Text(SYNTHETIC.replaceAll('LeiKa-583471', 'wrong')).publisherId, 0)
  assert.equal(observeBp1Text(SYNTHETIC.replace('lang="de"', 'lang="en"')).germanHtmlLang, 0)
  assert.equal(observeBp1Text(SYNTHETIC + SYNTHETIC).repeatedIdentityCues, true)
  assert.equal(observeBp1Text(SYNTHETIC + SYNTHETIC).repeatedStatementCues, true)
  assert.equal(observeBp1Text('Schweiz '.repeat(100)).swissCues, 9)
  assert.equal(observeBp1Text('<script><!-- hidden hydrate() JavaScript erforderlich').scriptOnlyShellCues, 1)
})

test('strict report rejects raw additions; all maximum finite fields remain under 8192 bytes', () => {
  const report = bp1Report({ mode: 'PLAN', outcome: 'NOT_RUN', reason: 'not_run' })
  for (const value of [{ ...report, raw: SENTINEL }, { ...report, reason: SENTINEL },
    { ...report, indicators: { ...report.indicators, email: SENTINEL } }, { ...report, completeBodyBytes: 65_537 }]) {
    assert.equal(bp1ReportSchema.safeParse(value).success, false)
  }
  const indicators = observeBp1Text((SYNTHETIC + '<script>hidden hydrate() JavaScript required</script><!-- copyright mailto:x@example.invalid -->').repeat(9))
  safe(bp1Report({ mode: 'OBSERVATION', outcome: 'UNQUALIFIED_BODY_OBSERVED', reason: 'content_identity_mismatch',
    startedAt: '2026-10-14T10:00:00.000Z', completedAt: '2026-10-14T10:00:10.000Z', completeBodyBytes: 65_536, indicators }))
})

// AA TASK V1/A8-B A1: bind all three complete sources and invert the exact
// selected move. The authoritative original pin and all original body bytes remain.
const BP1_READER_PATH = 'lib/readiness/official-truth-server-owned-retrieval.ts'
const BP1_PHYSICAL_PATH = 'lib/readiness/official-truth-retrieval-physical-internal.ts'
const BP1_AA_PROBE_PATH = 'lib/readiness/official-truth-aa-revision-probe-1-server.ts'
type Bp1ReaderSources = Readonly<{ reader: Buffer; physical: Buffer; probe: Buffer }>
type Bp1ReaderSpan = Readonly<{
  sourceStart: number; sourceEnd: number; sha256: string
  file?: 'reader' | 'physical'; start?: number; end?: number; literal?: string
}>
const BP1_READER_AA_PRESERVATION = Object.freeze({
  originalBytes: 46_071,
  originalBlob: '5998fdea54d3337fb68cd7111460b59e43a3cef7',
  originalSha256: 'b83340d46dbf8dbc3d1ba389d6b38964bf48fa05132655854ee0e49cc66db994',
  sources: Object.freeze({
    reader: Object.freeze({ bytes: 29611, blob: '933591ff7074c599dc5032f135103bd65f738314', sha256: 'ef2fd19af4bf897bcab1a2898f447a9b2a47b759f5a4dfe4b286badae5082bd2' }),
    physical: Object.freeze({ bytes: 17726, blob: 'bd995580bee6adb6b1a213b17a6001caa8f0aeff', sha256: 'aa37e8a42581f4ee67cfd52e677cb7d09a804ac77043e2d20b85dc24cd467e3f' }),
    probe: Object.freeze({ bytes: 20156, blob: 'df24e34575ef7d0ca211471b6a6a019f600871ec', sha256: 'a2f16bceb4917e3fc6f654fc1bc4fc03b405a3f02b294e9d5a2ddbfa9434190f' }),
  }),
  // Immutable A3 evidence only. It is not an alternative accepted current layout.
  priorA3Layout: Object.freeze({
    currentBytes: 65_490,
    currentBlob: '2b14953968da35ca47b272fd67a1a912613b8e6d',
    currentSha256: 'a9aad4542c70c6dbb1f59cbbce003559fc9b06a5fc6c6065a75fb7ea8e7a9143',
    importsStart: 960, importsEnd: 1_650, importsBytes: 690,
    importsSha256: 'ee791811f307ed420b4c41c5d8fa812a0655d7b960ec1d0c0996ae73463be95f',
    appendixStart: 46_761, appendixEnd: 65_490, appendixBytes: 18_729,
    appendixSha256: 'b5ebcb13fbeb6ec1bb3538233f2a26e81bea575b1fc7bfa088e3530a48b5ea32',
  }),
})
const BP1_READER_INVERSE_SPANS: readonly Bp1ReaderSpan[] = [
  { sourceStart: 0, sourceEnd: 805, file: 'reader', start: 0, end: 805, sha256: 'ccaf5071438bba48f8ff275189d28072c73593e6a8340047e8cdacdcd4d04bdd' },
  { sourceStart: 805, sourceEnd: 806, file: 'reader', start: 1699, end: 1700, sha256: '01ba4719c80b6fe911b091a7c05124b64eeece964e09c058ef8f9805daca546b' },
  { sourceStart: 806, sourceEnd: 933, file: 'physical', start: 130, end: 257, sha256: '96cc7749e20e4be4240b09d0a83b264ee1c7cbb48dd64c2043bc7e3876e859d2' },
  { sourceStart: 933, sourceEnd: 1783, file: 'reader', start: 1700, end: 2550, sha256: '2f7962905a91a8c04d567ab26daaf390da4de9b2af213bdd441771bbfbc0062c' },
  { sourceStart: 1783, sourceEnd: 1808, literal: "  type QuellenUrlFehler,\n", sha256: '286e4b726e1d7a2c10a39a0f493f579e8a8eb208d7af2e2b0a0f228d0bfc51e0' },
  { sourceStart: 1808, sourceEnd: 2104, file: 'reader', start: 2550, end: 2846, sha256: '3a87d75e3ad0846601fbfead83cd52a5fecb2593cadbc21f335a811cd11edf87' },
  { sourceStart: 2104, sourceEnd: 2157, file: 'physical', start: 461, end: 514, sha256: '68246e1f98c770d018d4c17a207a4117b3c466a558ab9e9cc750c2ccb92feabf' },
  { sourceStart: 2157, sourceEnd: 2228, file: 'reader', start: 2846, end: 2917, sha256: '1c17e05a284a06b8ece103496a734946c963b61373ef99574d9ec5a029d2698a' },
  { sourceStart: 2228, sourceEnd: 2333, file: 'physical', start: 514, end: 619, sha256: '30c5c51d11aa790a24e78cc8db8e33a4a11bb65db02c155a59b7548a935246b5' },
  { sourceStart: 2333, sourceEnd: 4165, file: 'reader', start: 2917, end: 4749, sha256: 'e50f5ef71d17b74191bc016bd188e73a46c2bb7b4cb1a948af00977e9d13edaf' },
  { sourceStart: 4165, sourceEnd: 4527, file: 'physical', start: 619, end: 981, sha256: 'ab6a6ba035cbb9901b72b6572e0ca61c699e599ee9f73cfa552ce7ab07579f24' },
  { sourceStart: 4527, sourceEnd: 5360, file: 'physical', start: 981, end: 1814, sha256: '2f8b395bf540cbf8d5958368c319d215167d76a2832c76d5457324c0a4775f19' },
  { sourceStart: 5360, sourceEnd: 6081, file: 'reader', start: 4749, end: 5470, sha256: '596bd439d31841c096f0b5b21a0209c646069f7fa088aded2be6ebddf42036f4' },
  { sourceStart: 6081, sourceEnd: 7371, file: 'physical', start: 1814, end: 3104, sha256: '150dd9535de1702de8ae4b22041da043d35f5edeb0289fc45dca2c2ff973b347' },
  { sourceStart: 7371, sourceEnd: 8552, file: 'reader', start: 5470, end: 6651, sha256: '1139da8488ff06f9b7d04647efeb7a058c4ed4ef8a8e5381deee5a224fa8c2ad' },
  { sourceStart: 8552, sourceEnd: 15199, file: 'physical', start: 3104, end: 9751, sha256: 'bb72fcbbfdc73064ae9ede2075fa04ddbfaca89c12a845360f173bf2bab11c4d' },
  { sourceStart: 15199, sourceEnd: 19855, file: 'reader', start: 6651, end: 11307, sha256: 'd62346c1c13593e38009a236096b28024eb3df5ddf695bc8de7eae8b586c45bf' },
  { sourceStart: 19855, sourceEnd: 20427, file: 'physical', start: 9758, end: 10330, sha256: '125acc52bcbad41e7430de93b9ab04940046e25ae849cfabd8a5ae2cfc529b52' },
  { sourceStart: 20427, sourceEnd: 20763, file: 'physical', start: 10337, end: 10673, sha256: '56d4b4034715f6ada102b48eef96b6766766bfd61e1d1202fc31348ad2f38acc' },
  { sourceStart: 20763, sourceEnd: 21341, file: 'physical', start: 10680, end: 11258, sha256: '6b1023afcf68de2761fc6f5aa07aa84c2aa7829b20fb1ce60ee73035903aca4b' },
  { sourceStart: 21341, sourceEnd: 21580, file: 'physical', start: 11265, end: 11504, sha256: '9cc4eec23b8ec5ed8e19560fa9c1732da84aea43d2806b8971c16a7c8c9d9259' },
  { sourceStart: 21580, sourceEnd: 21770, file: 'reader', start: 11307, end: 11497, sha256: '203de9198abb5117f65ca69699d42a7f02d93c286f6275a5cd9e324ccc4c4893' },
  { sourceStart: 21770, sourceEnd: 22239, file: 'physical', start: 11504, end: 11973, sha256: '1e71b759f92f02d6f1cb0e997a00c47a4f562854b13e1edf7d6b2e7be15cd315' },
  { sourceStart: 22239, sourceEnd: 22901, file: 'physical', start: 11980, end: 12642, sha256: '4d65c1e13dec51f9bdca510ee931e6e80d3257799b3699f070f97c2fe84bf926' },
  { sourceStart: 22901, sourceEnd: 25282, file: 'physical', start: 12649, end: 15030, sha256: '36be782615cc0c04af64db03a93ab7822500369e6dab7ac67c21ec21b95b927d' },
  { sourceStart: 25282, sourceEnd: 25546, file: 'physical', start: 15037, end: 15301, sha256: '21b66ae6c2fe8d5e5c20c5137873f86a5323cf7b7d5d053320e48b165ed99600' },
  { sourceStart: 25546, sourceEnd: 25868, file: 'physical', start: 15308, end: 15630, sha256: 'bbd8ee8fef30a8e3990820a5297711590263520327b837ffb1bce48dd36d2497' },
  { sourceStart: 25868, sourceEnd: 27957, file: 'physical', start: 15637, end: 17726, sha256: '2d31c0cdfa3894a273b3680bab9c1b972be3ef995e9e217dff998a821a8641f2' },
  { sourceStart: 27957, sourceEnd: 46071, file: 'reader', start: 11497, end: 29611, sha256: '1da779aadf7a00bc60c0a02fb76167e8182079eb344332c0dc77c97dc066b52f' },
]

/** Local inverse test helper. Every original byte is selected from actual sources,
 * except the explicitly restored original URL-error type-import wiring. */
function bp1ReaderInverse(sources: Bp1ReaderSources, spans: readonly Bp1ReaderSpan[]): Buffer | null {
  const pin = BP1_READER_AA_PRESERVATION
  const parts: Buffer[] = []
  let cursor = 0
  for (const span of spans) {
    if (span.sourceStart !== cursor || !Number.isSafeInteger(span.sourceEnd)
      || span.sourceEnd <= span.sourceStart || span.sourceEnd > pin.originalBytes) return null
    let selected: Buffer
    if (span.literal !== undefined) {
      if (span.file !== undefined || span.start !== undefined || span.end !== undefined) return null
      selected = Buffer.from(span.literal, 'utf8')
    } else {
      if ((span.file !== 'reader' && span.file !== 'physical') || typeof span.start !== 'number'
        || typeof span.end !== 'number' || !Number.isSafeInteger(span.start) || !Number.isSafeInteger(span.end)
        || span.start < 0 || span.end <= span.start || span.end > sources[span.file].length) return null
      selected = sources[span.file].subarray(span.start, span.end)
    }
    if (selected.length !== span.sourceEnd - span.sourceStart
      || createHash('sha256').update(selected).digest('hex') !== span.sha256) return null
    parts.push(selected)
    cursor = span.sourceEnd
  }
  if (cursor !== pin.originalBytes) return null
  const original = Buffer.concat(parts)
  if (original.length !== pin.originalBytes
    || createHash('sha1').update('blob ' + original.length + '\0').update(original).digest('hex') !== pin.originalBlob
    || createHash('sha256').update(original).digest('hex') !== pin.originalSha256) return null
  return original
}

/** Local test predicate only. The complete selected layout is mandatory. */
function bp1PreservedOriginalReader(sources: Bp1ReaderSources): Buffer | null {
  for (const name of ['reader', 'physical', 'probe'] as const) {
    const bytes = sources[name], pin = BP1_READER_AA_PRESERVATION.sources[name]
    if (bytes.length !== pin.bytes
      || createHash('sha1').update('blob ' + bytes.length + '\0').update(bytes).digest('hex') !== pin.blob
      || createHash('sha256').update(bytes).digest('hex') !== pin.sha256) return null
  }
  return bp1ReaderInverse(sources, BP1_READER_INVERSE_SPANS)
}

test('protected transport/profile/application remain byte-identical, closed and unreachable from app', () => {
  const pins = {
    'lib/readiness/official-truth-server-owned-retrieval.ts': '5998fdea54d3337fb68cd7111460b59e43a3cef7',
    'lib/readiness/official-truth-content-identity.ts': '4a4c3eea77b6e634fd83525849a4aaa6e6e50c18',
    'scripts/official-truth-ch-de-first-visa-vertical-1/source-probe.ts': '375adb52e2ef5ccb9045e17d830bf5d9111f6375',
    'lib/readiness/official-truth-ch-de-application-pilot-1/contract-server.ts': '90b9dd0108ed3e4d8049a3f8d35323c09b52e23f',
    // TL TASK v1 A2: reviewed R1 target/cleanup guard; PR #1149 comment 6706213098.
    'lib/readiness/official-truth-ch-de-application-pilot-1/evaluate-server.ts': '975206af1755dba3282193f456d1f92d92f8d0ad',
  }
  for (const [path, expected] of Object.entries(pins)) {
    const currentBytes = readFileSync(path)
    const bytes = path === BP1_READER_PATH ? bp1PreservedOriginalReader({
      reader: currentBytes, physical: readFileSync(BP1_PHYSICAL_PATH), probe: readFileSync(BP1_AA_PROBE_PATH),
    }) : currentBytes
    assert.ok(bytes, path)
    assert.equal(createHash('sha1').update(`blob ${bytes.length}\0`).update(bytes).digest('hex'), expected, path)
  }
  assert.equal(applicationPilotEnabled(), false); assert.equal(applicationContract('bp1', 'anything'), null)
  const q = bp1QuarantineCatalog()
  assert.ok(q.catalog.identityProfiles.every(p => !OFFICIAL_TRUTH_CONTENT_IDENTITY_PROFILE_REGISTRY.some(r => r.identityProfileId === p.identityProfileId)))
  const found: string[] = []
  function walk(dir: string) {
    for (const e of readdirSync(dir, { withFileTypes: true })) {
      const p = join(dir, e.name)
      if (e.isDirectory()) walk(p)
      else if (/\.[cm]?[jt]sx?$/.test(e.name) && !/\.test\./.test(e.name) && readFileSync(p, 'utf8').includes('official-truth-bundesportal-bp1-observation-1')) found.push(relative('.', p))
    }
  }
  for (const dir of ['app', 'components', 'lib']) walk(dir)
  assert.deepEqual(found, [])
  const probe = readFileSync('scripts/official-truth-bundesportal-bp1-observation-1/source-probe.ts', 'utf8')
  assert.doesNotMatch(probe, /node:https|node:dns|fetch\s*\(|axios|process\.env|writeFile|console\.|sourceSnapshot|sourceContentHash/)
})


test('AA A8-B exact Reader preservation refuses original, moved body, probe and boundary mutations in memory', () => {
  const sources: Bp1ReaderSources = {
    reader: readFileSync(BP1_READER_PATH), physical: readFileSync(BP1_PHYSICAL_PATH), probe: readFileSync(BP1_AA_PROBE_PATH),
  }
  const pin = BP1_READER_AA_PRESERVATION
  const original = bp1PreservedOriginalReader(sources)
  assert.ok(original, 'exact reviewed sources must reconstruct the complete pinned original')
  assert.equal(original.length, pin.originalBytes)
  assert.equal(createHash('sha1').update('blob ' + original.length + '\0').update(original).digest('hex'), pin.originalBlob)
  assert.equal(createHash('sha256').update(original).digest('hex'), pin.originalSha256)
  const readerWiringStart = 805, readerWiringEnd = 1_699
  const physicalBodyStart = 3104, physicalBodyEnd = 9751
  const probeAppendixStart = 1195
  const readerWiring = sources.reader.subarray(readerWiringStart, readerWiringEnd)
  const physicalBody = sources.physical.subarray(physicalBodyStart, physicalBodyEnd)
  const probeAppendix = sources.probe.subarray(probeAppendixStart)
  const flip = (name: keyof Bp1ReaderSources, offset: number): Bp1ReaderSources => {
    const changed = Buffer.from(sources[name])
    changed[offset] = changed[offset]! ^ 1
    return { ...sources, [name]: changed }
  }
  const mutants: [string, Bp1ReaderSources][] = [
    ['altered original prefix', flip('reader', 0)],
    ['altered original final byte', flip('reader', sources.reader.length - 1)],
    ['altered moved physical body', flip('physical', physicalBodyStart + 100)],
    ['altered import wiring', flip('reader', readerWiringStart + 17)],
    ['altered physical export wiring', flip('physical', 9_751)],
    ['altered probe import addition', flip('probe', 130)],
    ['altered probe appendix addition', flip('probe', probeAppendixStart + 100)],
    ['missing import wiring', { ...sources, reader: Buffer.concat([
      sources.reader.subarray(0, readerWiringStart), sources.reader.subarray(readerWiringEnd),
    ]) }],
    ['duplicated import wiring', { ...sources, reader: Buffer.concat([
      sources.reader.subarray(0, readerWiringEnd), readerWiring, sources.reader.subarray(readerWiringEnd),
    ]) }],
    ['misplaced import wiring', { ...sources, reader: Buffer.concat([
      sources.reader.subarray(0, readerWiringStart), sources.reader.subarray(readerWiringEnd, readerWiringEnd + 1),
      readerWiring, sources.reader.subarray(readerWiringEnd + 1),
    ]) }],
    ['missing moved span', { ...sources, physical: Buffer.concat([
      sources.physical.subarray(0, physicalBodyStart), sources.physical.subarray(physicalBodyEnd),
    ]) }],
    ['duplicated moved span', { ...sources, physical: Buffer.concat([
      sources.physical.subarray(0, physicalBodyEnd), physicalBody, sources.physical.subarray(physicalBodyEnd),
    ]) }],
    ['misplaced moved span', { ...sources, physical: Buffer.concat([
      sources.physical.subarray(0, physicalBodyStart), sources.physical.subarray(physicalBodyEnd, physicalBodyEnd + 1),
      physicalBody, sources.physical.subarray(physicalBodyEnd + 1),
    ]) }],
    ['missing probe addition', { ...sources, probe: sources.probe.subarray(0, probeAppendixStart) }],
    ['duplicated probe addition', { ...sources, probe: Buffer.concat([sources.probe, probeAppendix]) }],
    ['misplaced probe addition', { ...sources, probe: Buffer.concat([
      sources.probe.subarray(0, probeAppendixStart - 1), probeAppendix, sources.probe.subarray(probeAppendixStart - 1, probeAppendixStart),
    ]) }],
    ['extra trailing Reader byte', { ...sources, reader: Buffer.concat([sources.reader, Buffer.from('\n')]) }],
    ['extra trailing physical byte', { ...sources, physical: Buffer.concat([sources.physical, Buffer.from('\n')]) }],
    ['extra trailing probe byte', { ...sources, probe: Buffer.concat([sources.probe, Buffer.from('\n')]) }],
    ['unextended original is not the selected current Reader', { ...sources, reader: original }],
    ['wrong complete physical file', { ...sources, physical: sources.reader }],
    ['wrong complete probe file', { ...sources, probe: sources.reader }],
  ]
  for (const [name, changed] of mutants) {
    // Boolean-only assertion output; do not print the complete source buffers.
    assert.equal(bp1PreservedOriginalReader(changed) === null, true, name)
  }
  const spans = BP1_READER_INVERSE_SPANS
  const inverseMutants: [string, readonly Bp1ReaderSpan[]][] = [
    ['missing inverse span', spans.slice(1)],
    ['duplicated inverse span', [spans[0]!, ...spans]],
    ['misplaced inverse spans', [spans[1]!, spans[0]!, ...spans.slice(2)]],
    ['changed target range', spans.map((span, index) => index === 15 ? { ...span, start: span.start! + 1 } : span)],
    ['changed original type-import wiring', spans.map(span => span.literal === undefined ? span : { ...span, literal: span.literal + '\n' })],
    ['original span gap', spans.map((span, index) => index === 1 ? { ...span, sourceStart: span.sourceStart + 1 } : span)],
    ['wrong actual moved-body source', spans.map((span, index) => index === 15 ? { ...span, file: 'reader' } : span)],
  ]
  for (const [name, changed] of inverseMutants) {
    assert.equal(bp1ReaderInverse(sources, changed) === null, true, name)
  }
})
test('cold imports and real CLI default/plan/invalid process paths are network-free', () => {
  const block = `const https = require('node:https'), dns = require('node:dns');
    let calls = 0;
    https.request = dns.lookup = () => { calls++; throw Error('synthetic_network_forbidden'); };
    require('node:module').syncBuiltinESMExports();
    process.on('beforeExit', () => { if (calls) process.exitCode = 99; });`
  const loader = 'data:text/javascript,' + encodeURIComponent(`import { createRequire } from 'node:module';
    const require = createRequire(process.cwd() + '/package.json'); ${block}`)
  const base = ['--import', './scripts/server-only-test-register.mjs', '--import', 'tsx', '--import', loader]
  const cli = 'scripts/official-truth-bundesportal-bp1-observation-1/run.ts'
  for (const args of [[], ['--plan']]) {
    const output = execFileSync(process.execPath, [...base, cli, ...args], { encoding: 'utf8' })
    assert.equal(JSON.parse(output).outcome, 'NOT_RUN')
  }
  const output = execFileSync(process.execPath, [...base, '-e',
    `require('./scripts/official-truth-bundesportal-bp1-observation-1/run.ts'); process.stdout.write('imported');`], { encoding: 'utf8' })
  assert.equal(output, 'imported')
  try { execFileSync(process.execPath, [...base, cli, '--observe-bp1-once', '--extra'], { encoding: 'utf8', stdio: 'pipe' }); assert.fail('expected exit 2') }
  catch (error) {
    const failure = error as { status: number; stdout: string }
    assert.equal(failure.status, 2); assert.equal(JSON.parse(failure.stdout).outcome, 'INVALID_ARGUMENTS')
  }
})

test('unexpected trusted seam success and raw exceptions are discarded, never forwarded', () => {
  for (const payload of [`return { status: 'server_owned_official_retrieval', sourceSnapshot: '${SENTINEL}', sourceContentHash: '${SENTINEL}' }`,
    `throw Error('${SENTINEL}')`]) {
    // Unit-only process mock. Integration cases above retain the real protected seam.
    const code = `const Module = require('node:module'), original = Module._load;
      require('node:https').request = () => { throw Error('network_forbidden'); };
      Module._load = function(id, ...rest) {
        if (id.endsWith('official-truth-server-owned-retrieval')) return {
          retrieveOfficialTruthIsolatedPilotSource: async () => { ${payload} }
        };
        return original.call(this, id, ...rest);
      };
      const { observeBp1Once } = require('./scripts/official-truth-bundesportal-bp1-observation-1/source-probe.ts');
      observeBp1Once().then(report => process.stdout.write(JSON.stringify(report)));`
    const output = execFileSync(process.execPath, ['--import', './scripts/server-only-test-register.mjs', '--import', 'tsx', '-e', code], { encoding: 'utf8' })
    const report = JSON.parse(output)
    assert.equal(report.outcome, 'ERROR')
    assert.equal(report.reason, payload.startsWith('throw') ? 'observer_failed' : 'unexpected_identity_success')
    assert.equal(report.completeBodyBytes, null); assert.ok(Object.values(report.indicators).every(x => x === null))
    safe(report)
  }
})
