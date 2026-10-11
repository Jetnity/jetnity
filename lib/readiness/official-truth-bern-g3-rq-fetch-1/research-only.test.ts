import assert from 'node:assert/strict'
import { readFileSync, readdirSync } from 'node:fs'
import { join } from 'node:path'
import { test } from 'node:test'

import {
  decideOfficialTruthBernRealResearchForOfflineTests,
  type OfficialTruthBernRealResearchOutcome,
  type OfficialTruthServerOwnedRetrievalHttpErgebnis,
  type OfficialTruthServerOwnedRetrievalAdresse,
} from '@/lib/readiness/official-truth-server-owned-retrieval'

const BERN = 'https://bern.diplo.de/ch-de/service/visumundeinreise/2611474-2611474'

type Scenario = {
  status?: number
  declared?: number | null
  declaredRaw?: string
  body?: Uint8Array
  chunks?: readonly Uint8Array[]
  addresses?: readonly OfficialTruthServerOwnedRetrievalAdresse[]
  media?: string
  encoding?: string | null
  framingComplete?: boolean
  includeFramingProof?: boolean
  failAtChunk?: number
  delayedChunkMs?: number
  timeoutMs?: number
  location?: string
  stallHeaders?: boolean
}

async function run(scenario: Scenario = {}) {
  let httpCalls = 0
  let cancels = 0
  let yields = 0
  const addresses = scenario.addresses ?? [{ address: '93.184.216.34', family: 4 as const }]
  const urls: string[] = []
  const started = Date.now()
  const report = await decideOfficialTruthBernRealResearchForOfflineTests({
    resolve: async () => addresses,
    timeoutMs: scenario.timeoutMs ?? 1_000,
    http: async ({ url, lookup, signal }): Promise<OfficialTruthServerOwnedRetrievalHttpErgebnis> => {
      httpCalls++
      urls.push(url)
      const result = await new Promise<{ code: string | null }>((resolve) => lookup(
        new URL(url).hostname, { all: false }, (error) => resolve({ code: error?.code ?? null }),
      ))
      if (result.code) {
        return { ok: false, reason: result.code === 'JETNITY_ADDRESS_NOT_PERMITTED'
          ? 'address_not_permitted' : 'dns_failed' }
      }
      if (scenario.stallHeaders) return new Promise(() => {})
      const bytes = scenario.chunks ?? [scenario.body ?? Buffer.from('<html><script>analytics</script></html>')]
      const inferredLength = bytes.reduce<number>((total, chunk) => total + chunk.byteLength, 0)
      const contentLength = scenario.declaredRaw ??
        (scenario.declared === null ? null : String(scenario.declared ?? inferredLength))
      const headers = new Map<string, string>()
      headers.set('content-type', scenario.media ?? 'text/html; charset=utf-8')
      if (contentLength !== null) headers.set('content-length', contentLength)
      if (scenario.encoding != null) headers.set('content-encoding', scenario.encoding)
      if (scenario.location) headers.set('location', scenario.location)
      return {
        ok: true,
        status: scenario.status ?? 200,
        headers: { get: name => headers.get(name.toLowerCase()) ?? null },
        body: (async function* () {
          for (let i = 0; i < bytes.length; i++) {
            if (scenario.delayedChunkMs) await new Promise(resolve => setTimeout(resolve, scenario.delayedChunkMs))
            if (scenario.failAtChunk === i) throw Error('synthetic stream failure')
            if (signal.aborted) return
            yields++
            yield bytes[i]!
          }
        })(),
        cancel: () => { cancels++ },
        ...(scenario.includeFramingProof === false ? {}
          : { framingComplete: () => scenario.framingComplete ?? true }),
      }
    },
  })
  return { report, httpCalls, cancels, yields, urls, elapsed: Date.now() - started }
}

function blocked(report: OfficialTruthBernRealResearchOutcome, reason: string) {
  assert.equal(report.status, 'bern_research_only')
  assert.equal(report.phase, 'blocked')
  assert.equal(report.reason, reason)
  assert.equal(report.fullBodyByteCount, null)
  assert.equal(report.indicators, null)
  for (const field of ['sourceSnapshot', 'sourceContentHash', 'retrievedAt', 'identitySchema',
    'validFrom', 'validUntil', 'evidence', 'reviewPacketKey', 'trustedRuleFact']) {
    assert.equal(Object.hasOwn(report, field), false, field)
  }
}

test('fixed Bern target accepts synthetic complete 131071 and 131072 bytes, never trusted output', async () => {
  for (const size of [131_071, 131_072]) {
    const runResult = await run({ body: Buffer.from('<html>' + 'x'.repeat(size - 13) + '</html>') })
    assert.equal(runResult.report.phase, 'observed_research_only')
    assert.equal(runResult.report.fullBodyByteCount, size)
    assert.equal(runResult.httpCalls, 1)
    assert.deepEqual(runResult.urls, [BERN])
    assert.equal(runResult.report.networkAttempted, true)
    if (runResult.report.phase === 'observed_research_only') {
      assert.equal(runResult.report.indicators.html_scripts_present, false)
    }
  }
})

test('research can handle 65537 synthetic bytes without increasing global 65536 default', async () => {
  const res = await run({ body: Buffer.alloc(65_537, 65) })
  assert.equal(res.report.phase, 'observed_research_only')
  assert.equal(res.report.fullBodyByteCount, 65_537)
  const source = readFileSync('lib/readiness/official-truth-server-owned-retrieval.ts', 'utf8')
  assert.match(source, /const BODY_MAX = 65_536/)
  assert.match(source, /authorization === LIVE_PRIVILEGED_TRANSPORT && abhaengigkeiten.catalog == null/)
})

test('131073 declared bytes refuse before body reading, never a second GET', async () => {
  const res = await run({ body: Buffer.alloc(1), declared: 131_073 })
  blocked(res.report, 'response_too_large')
  assert.equal(res.httpCalls, 1)
  assert.equal(res.yields, 0)
  assert.ok(res.cancels > 0)
})

test('131073 streamed bytes with unprovided length cancel on overrun and never publish indicators', async () => {
  const res = await run({ declared: null, chunks: [Buffer.alloc(131_072), Uint8Array.of(65)] })
  blocked(res.report, 'response_too_large')
  assert.equal(res.httpCalls, 1)
  assert.ok(res.cancels > 0)
  assert.equal(res.yields, 2)
})

test('declared length shorter and longer than actual are refused fail-closed', async () => {
  const short = await run({ declared: 3, body: Buffer.from('synthetic') })
  blocked(short.report, 'response_too_large')
  assert.ok(short.cancels > 0)
  const long = await run({ declared: 15, body: Buffer.from('synthetic') })
  blocked(long.report, 'content_length_mismatch')
})

test('missing Content-Length requires complete verified native framing', async () => {
  const yes = await run({ declared: null, includeFramingProof: true })
  assert.equal(yes.report.phase, 'observed_research_only')
  const no = await run({ declared: null, includeFramingProof: false })
  blocked(no.report, 'framing_unverified')
  const incomplete = await run({ declared: null, framingComplete: false })
  blocked(incomplete.report, 'framing_unverified')
})

test('incomplete HTTP framing fails even if declared byte length matches', async () => {
  const fail = await run({ declared: 8, body: Buffer.from('complete'), framingComplete: false })
  blocked(fail.report, 'framing_unverified')
})

test('only one physical GET: 302 is stopped without following or exposing Location', async () => {
  const res = await run({ status: 302, location: 'https://evil.example/redirect' })
  blocked(res.report, 'redirect_detected')
  assert.equal(res.httpCalls, 1)
  assert.deepEqual(res.urls, [BERN])
  assert.ok(res.cancels > 0)
  assert.equal(JSON.stringify(res.report).includes('evil.example'), false)
})

test('private or mixed DNS refused by pinned lookup before any live socket', async () => {
  for (const addresses of [
    [{ address: '10.0.0.1', family: 4 as const }],
    [{ address: '::1', family: 6 as const }],
    [{ address: '93.184.216.34', family: 4 as const }, { address: '127.0.0.1', family: 4 as const }],
    [{ address: '::ffff:127.0.0.1', family: 6 as const }],
  ]) {
    const res = await run({ addresses })
    blocked(res.report, 'address_not_permitted')
    assert.equal(res.httpCalls, 1)
    assert.equal(res.yields, 0)
  }
})

test('compressed or non-html/non-UTF8 content and malformed UTF8 refuse', async () => {
  for (const [opts, reason] of [
    [{ encoding: 'gzip' }, 'http_failed'],
    [{ media: 'application/json' }, 'content_type_mismatch'],
    [{ media: 'text/html; charset=iso-8859-1' }, 'content_type_mismatch'],
    [{ body: Uint8Array.of(0xc3, 0x28) }, 'invalid_utf8'],
    [{ body: Buffer.from('\uFEFFx') }, 'invalid_utf8'],
    [{ body: new Uint8Array() }, 'empty_body'],
    [{ declaredRaw: 'NaN' }, 'http_failed'],
  ] as const) {
    const res = await run(opts)
    blocked(res.report, reason)
  }
})

test('stalled post-header body cancels promptly on deadline and publishes nothing', async () => {
  const res = await run({ chunks: [Buffer.alloc(128)], declared: 128, delayedChunkMs: 220, timeoutMs: 20 })
  blocked(res.report, 'timeout')
  assert.ok(res.cancels > 0)
  assert.equal(res.yields, 0)
  assert.ok(res.elapsed < 200)
})

test('synthetic stream error cancels without leaking body', async () => {
  const res = await run({ chunks: [Uint8Array.of(65), Uint8Array.of(66)], declared: 2, failAtChunk: 1 })
  blocked(res.report, 'http_failed')
  assert.ok(res.cancels > 0)
})

test('deadline includes stalled response headers, no reattempt', async () => {
  const res = await run({ stallHeaders: true, timeoutMs: 20 })
  blocked(res.report, 'timeout')
  assert.equal(res.httpCalls, 1)
  assert.ok(res.elapsed < 200)
})

test('only task-owned developer runner imports the live research entry (no app/API/cron imports)', () => {
  const roots = ['app', 'components', 'lib', 'scripts']
  const imported: string[] = []
  const walk = (path: string) => {
    for (const d of readdirSync(path, { withFileTypes: true })) {
      const name = join(path, d.name)
      if (d.isDirectory()) {
        if (d.name !== 'node_modules') walk(name)
      } else if (/\.(ts|tsx|js|mjs)$/.test(d.name)) {
        const text = readFileSync(name, 'utf8')
        if (name !== 'lib/readiness/official-truth-server-owned-retrieval.ts'
          && name !== 'lib/readiness/official-truth-bern-g3-rq-fetch-1/research-only.test.ts'
          && text.includes('retrieveOfficialTruthBernOneShotResearchOnly')) imported.push(name)
      }
    }
  }
  for (const root of roots) walk(root)
  assert.deepEqual(imported, ['scripts/official-truth-bern-g3-rq-fetch-1/run.ts'])
})
