import assert from 'node:assert/strict'
import { test } from 'node:test'
import { readFileSync, readdirSync } from 'node:fs'
import { join, relative } from 'node:path'
import https from 'node:https'
import { chDeCompactQuarantineCatalog } from '../../scripts/official-truth-ch-de-compact-primary-source-1/source-probe'
import { CH_DE_COMPACT_RESEARCH_SOURCES, CH_DE_COMPACT_RELEASE_BLOCKERS } from '../../scripts/official-truth-ch-de-compact-primary-source-1/manifest'
import { runChDeCompact } from '../../scripts/official-truth-ch-de-compact-primary-source-1/run'
import { decideOfficialTruthServerOwnedRetrieval, type OfficialTruthServerOwnedRetrievalAbhaengigkeiten } from './official-truth-server-owned-retrieval'
import { OFFICIAL_TRUTH_CONTENT_IDENTITY_PROFILE_REGISTRY } from './official-truth-content-identity'

const URL = CH_DE_COMPACT_RESEARCH_SOURCES[0].url
const TIME = '2026-10-09T12:00:00.000Z'
// No live or copied government body. Quarantine accepts NO representation.
async function probe(options: {
  bytes?: Uint8Array; url?: string; media?: string; length?: number; status?: number;
  location?: string; address?: string; fail?: boolean; timeout?: boolean;
} = {}) {
  let cancelled = 0, requests = 0
  const q = chDeCompactQuarantineCatalog('S4')
  const deps: OfficialTruthServerOwnedRetrievalAbhaengigkeiten = {
    catalog: q.catalog, now: () => new Date(TIME), timeoutMs: 5,
    resolve: async () => [{ address: options.address ?? '93.184.216.34', family: 4 }],
    http: async ({ url, lookup }) => {
      requests++
      await new Promise<void>((ok, fail) => lookup(new globalThis.URL(url).hostname, {}, error => error ? fail(error) : ok()))
      if (options.fail) throw Error('synthetic transport failure')
      if (options.timeout) return new Promise(() => {})
      return { ok: true, status: options.status ?? 200,
        headers: { get: key => key === 'content-type' ? options.media ?? 'text/html; charset=utf-8'
          : key === 'content-length' ? options.length === undefined ? null : String(options.length)
            : key === 'location' ? options.location ?? null : null },
        body: (async function* () { yield options.bytes ?? Buffer.from('<html>synthetic, no legal evidence</html>') })(),
        cancel() { cancelled++ },
      }
    },
  }
  const result = await decideOfficialTruthServerOwnedRetrieval({ sourceId: 'bern-research-only', url: options.url ?? URL }, deps)
  return { result, cancelled, requests, bytes: q.completeBytes() }
}

test('CLI defaults offline, rejects arbitrary arguments and cannot cause a network retry', async t => {
  t.mock.method(https, 'request', () => { assert.fail('offline network') })
  assert.equal((await runChDeCompact([])).report.execution, 'NOT_RUN')
  for (const args of [['--live'], ['--live-official', URL], ['--url', URL], ['--live-official', '--live-official']]) {
    const result = await runChDeCompact(args)
    assert.equal(result.exitCode, 2); assert.equal(result.report.execution, 'INVALID_ARGUMENTS')
    assert.deepEqual(result.report.observations, [])
    assert.equal(result.report.productionActivated, false)
  }
  assert.ok(CH_DE_COMPACT_RELEASE_BLOCKERS.includes('trusted_accepted_reader_unavailable'))
})

for (const key of ['S4', 'S5'] as const) test(`quarantine ${key} refuses all caller identity/legal material; no registry activation`, async () => {
  const q = chDeCompactQuarantineCatalog(key)
  assert.ok(q.catalog.identityProfiles.every(p => !OFFICIAL_TRUTH_CONTENT_IDENTITY_PROFILE_REGISTRY.some(real => real.identityProfileId === p.identityProfileId)))
  const catalog = await q.catalog.transport.aufrufen({ operation: 'read_registry' })
  assert.equal(catalog.ok, true)
  assert.equal((await q.catalog.transport.aufrufen({ operation: 'register_source' })).ok, false)
  assert.equal((await q.catalog.transport.aufrufen({ operation: 'read_registry', registry: {} })).ok, false)
  const verify = q.catalog.identityProfiles[0]!.verify
  for (const label of ['wrong publisher', 'changed author', 'moved page', 'missing primary URL', 'duplicate country row',
    'malformed table', 'encoded country ambiguity', 'conflicting FAQ', 'truncated paragraph', 'uncertain exception',
    'stale', 'epoch', 'edited snapshot', 'absent source', 'replay', 'invalid origin seal']) {
    // These are rejection inputs, not positive content fixtures or claimed parser coverage.
    const result = Reflect.apply(verify, undefined, [{ item: {}, representation: {}, responseText: label,
      finalUrl: CH_DE_COMPACT_RESEARCH_SOURCES.find(s => s.key === key)!.url, mediaType: 'text/html' }])
    assert.equal(result.ok, false)
    assert.deepEqual(result, { ok: false, reason: 'identity_mismatch' })
  }
})

for (const size of [65_535, 65_536, 65_537]) test(`canonical whole-body inclusive bound ${size}`, async () => {
  const result = await probe({ bytes: Buffer.alloc(size, 65) })
  assert.deepEqual(result.result, { status: 'blocked', reason: size > 65_536 ? 'response_too_large' : 'content_identity_mismatch' })
  assert.equal(result.bytes, size > 65_536 ? null : size)
  if (size > 65_536) assert.ok(result.cancelled > 0)
})

test('declared oversized length rejects before consuming body; no fabricated exact size', async () => {
  const result = await probe({ length: 100_000 })
  assert.deepEqual(result.result, { status: 'blocked', reason: 'response_too_large' })
  assert.equal(result.bytes, null); assert.ok(result.cancelled > 0)
})

for (const [name, options, reason] of [
  ['fatal UTF8', { bytes: new Uint8Array([0xc3, 0x28]) }, 'invalid_utf8'],
  ['empty body', { bytes: new Uint8Array() }, 'empty_body'],
  ['wrong media', { media: 'application/json' }, 'content_type_mismatch'],
  ['bot challenge', { status: 403 }, 'http_status'],
  ['HTTP error', { fail: true }, 'http_failed'],
  ['timeout', { timeout: true }, 'timeout'],
  ['other host', { url: 'https://example.invalid/source' }, 'unregistered_domain'],
  ['other path', { url: 'https://bern.diplo.de/unapproved' }, 'content_not_eligible'],
  ['HTTP URL', { url: URL.replace('https:', 'http:') }, 'insecure_scheme'],
  ['non-default port', { url: URL.replace('.de/', '.de:8443/') }, 'non_default_port'],
  ['tracking', { url: URL + '?utm_source=fixture' }, 'tracking_parameter'],
  ['private DNS', { address: '127.0.0.1' }, 'http_failed'],
  ['redirect external', { status: 302, location: 'https://example.invalid/source' }, 'unregistered_domain'],
  ['redirect path', { status: 302, location: '/moved' }, 'representation_url_mismatch'],
  ['redirect loop', { status: 302, location: URL }, 'redirect_loop'],
] as const) test(`canonical retrieval refusal: ${name}`, async () => {
  const result = await probe(options)
  assert.deepEqual(result.result, { status: 'blocked', reason })
  assert.equal(result.bytes, null)
})

test('owned source path is developer-only with one exact live importer, no direct network or source acceptance', () => {
  const owned = 'scripts/official-truth-ch-de-compact-primary-source-1/source-probe.ts'
  const code = readFileSync(owned, 'utf8')
  assert.match(code, /import 'server-only'/)
  assert.doesNotMatch(code, /node:https|node:dns|fetch\(|writeFile|sourceSnapshot|sourceContentHash|loadOfficialTruthServerOwnedRetrievalWithCatalogTransport/)
  assert.match(code, /ok: false as const, reason: 'identity_mismatch'/)
  const found: string[] = []
  function walk(dir: string) {
    for (const e of readdirSync(dir, { withFileTypes: true })) {
      const p = join(dir, e.name)
      if (e.isDirectory()) walk(p)
      else if (/\.[cm]?[jt]sx?$/.test(e.name) && !/\.test\./.test(e.name) && readFileSync(p, 'utf8').includes('official-truth-ch-de-compact-primary-source-1')) found.push(relative('.', p))
    }
  }
  for (const dir of ['app', 'components', 'lib']) walk(dir)
  assert.deepEqual(found, [])
})
