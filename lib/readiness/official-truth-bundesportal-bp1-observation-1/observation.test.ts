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

test('protected transport/profile/application remain byte-identical, closed and unreachable from app', () => {
  // R102-approved literal snapshot after Whole-Source Current Request 1 R1.
  // The source-probe pin stays the historical blob.
  const pins = {
    'lib/readiness/official-truth-server-owned-retrieval.ts': '382a4098ae835ff61b96cfc8186f07bb74bea1f4',
    'lib/readiness/official-truth-content-identity.ts': '511fb4a330891a24c47d057645b69495e27efaa1',
    'scripts/official-truth-ch-de-first-visa-vertical-1/source-probe.ts': '375adb52e2ef5ccb9045e17d830bf5d9111f6375',
    'lib/readiness/official-truth-ch-de-application-pilot-1/contract-server.ts': '9790798cf7f51032a28a504d3707be607a87f8e3',
    'lib/readiness/official-truth-ch-de-application-pilot-1/evaluate-server.ts': '2cf889fca45703041111430d5934674cd598ea04',
  }
  for (const [path, expected] of Object.entries(pins)) {
    const bytes = readFileSync(path)
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
