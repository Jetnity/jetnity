import assert from 'node:assert/strict'
import { readdirSync, readFileSync } from 'node:fs'
import { join } from 'node:path'
import https from 'node:https'
import { test } from 'node:test'

import {
  OFFICIAL_TRUTH_BERN_RESEARCH_QUARANTINE_1,
  decideOfficialTruthBernResearchQuarantineOfflineMock,
  officialTruthBernResearchQuarantineMockBody,
  officialTruthBernResearchQuarantineNotRun,
  officialTruthBernResearchQuarantineOneShotVersuch,
} from './offline'
import type {
  OfficialTruthServerOwnedRetrievalErgebnis,
  OfficialTruthServerOwnedRetrievalHttpErgebnis,
  OfficialTruthServerOwnedRetrievalLookup,
} from '@/lib/readiness/official-truth-server-owned-retrieval'
import { runOfficialTruthBernResearchQuarantine1 } from '../../../scripts/official-truth-bern-research-quarantine-1/run'

// @ts-expect-error quarantine output is never an official retrieval contract.
const _forbiddenCast: OfficialTruthServerOwnedRetrievalErgebnis = officialTruthBernResearchQuarantineNotRun()
void _forbiddenCast

type Scenario = {
  status?: number
  body?: Uint8Array
  chunks?: readonly Uint8Array[]
  throwInBodyAtChunk?: number
  location?: string
  contentType?: string | null
  contentLength?: number | null
  contentLengthRaw?: string | null
  contentEncoding?: string | null
  timeout?: boolean
  fail?: boolean
  timeoutMs?: number
  chunkDelayMs?: number
  addresses?: readonly { address: string; family: 4 | 6 }[]
}

async function lookupWarten(lookup: OfficialTruthServerOwnedRetrievalLookup, host: string) {
  return new Promise<{ code?: string; address?: unknown; family?: unknown }>((resolve) => {
    lookup(host, { all: false }, (error, address, family) => {
      resolve({ code: error?.code, address, family })
    })
  })
}

async function laufen(scenario: Scenario = {}) {
  let cancelled = 0
  let yieldedChunks = 0
  const startedAt = Date.now()
  let firstCancelAtMs: number | null = null
  const result = await decideOfficialTruthBernResearchQuarantineOfflineMock(
    { operation: 'offline_mock' },
    {
      now: () => new Date('2026-10-11T00:00:00.000Z'),
      resolve: async () => scenario.addresses ?? [{ address: '93.184.216.34', family: 4 }],
      timeoutMs: scenario.timeoutMs ?? 8,
      http: async ({ url, lookup, signal }): Promise<OfficialTruthServerOwnedRetrievalHttpErgebnis> => {
        const host = new URL(url).hostname
        const checked = await lookupWarten(lookup, host)
        if (checked.code === 'JETNITY_ADDRESS_NOT_PERMITTED') return { ok: false, reason: 'address_not_permitted' }
        if (checked.code === 'JETNITY_DNS_EMPTY') return { ok: false, reason: 'dns_empty' }
        if (checked.code) return { ok: false, reason: 'dns_failed' }
        if (scenario.fail) throw Error('synthetic http failure')
        if (scenario.timeout) return new Promise(() => {})
        const body = scenario.chunks ?? [scenario.body ?? Buffer.from('<html><script src="https://cdn.example/app.js"></script>analytics</html>')]
        return {
          ok: true,
          status: scenario.status ?? 200,
          headers: {
            get(key: string) {
              const name = key.toLowerCase()
              if (name === 'location') return scenario.location ?? null
              if (name === 'content-type') return scenario.contentType ?? 'text/html; charset=utf-8'
              if (name === 'content-length') {
                if (scenario.contentLengthRaw !== undefined) return scenario.contentLengthRaw
                return scenario.contentLength == null ? null : String(scenario.contentLength)
              }
              if (name === 'content-encoding') return scenario.contentEncoding ?? null
              return null
            },
          },
          body: (async function* () {
            for (const [index, chunk] of body.entries()) {
              if (signal.aborted) return
              if (scenario.throwInBodyAtChunk === index) throw Error('synthetic stream failure')
              if (scenario.chunkDelayMs && scenario.chunkDelayMs > 0) await new Promise((resolve) => setTimeout(resolve, scenario.chunkDelayMs))
              if (signal.aborted) return
              yieldedChunks += 1
              yield chunk
            }
          })(),
          cancel() {
            if (firstCancelAtMs == null) firstCancelAtMs = Date.now() - startedAt
            cancelled += 1
          },
        }
      },
    },
  )
  return { result, cancelled, yieldedChunks, firstCancelAtMs }
}

function assertKonservativ(result: Awaited<ReturnType<typeof laufen>>['result']) {
  assert.equal(result.bodyByteCount, null)
  assert.equal(result.html_scripts_present, true)
  assert.equal(result.analytics_or_tracking_indicators_present, true)
  assert.equal(result.possible_personal_metadata_present, true)
  assert.equal(result.embedded_external_asset_indicators_present, true)
  assert.equal(result.copyright_or_rights_indicators_present, true)
  assert.equal(result.unknown_dynamic_sections, true)
}

test('not-run contract is conservative and contains no trusted retrieval fields', () => {
  const report = officialTruthBernResearchQuarantineNotRun()
  assert.equal(report.status, 'research_only_quarantine')
  assert.equal(report.phase, 'not_run')
  assert.equal(report.reason, 'not_authorized')
  assert.equal(report.networkAttempted, false)
  assert.equal(report.sourceFamily, 'german_embassy_bern_research_candidate')
  assert.equal(report.sourceUrl, OFFICIAL_TRUTH_BERN_RESEARCH_QUARANTINE_1.sourceUrl)
  for (const field of ['sourceSnapshot', 'sourceContentHash', 'retrievedAt', 'validFrom', 'validUntil', 'reviewPacketKey']) {
    assert.equal(Object.hasOwn(report, field), false, field)
  }
})

test('one-shot reserve is refused once and cannot be replayed', () => {
  const first = officialTruthBernResearchQuarantineOneShotVersuch()
  assert.equal(first.ok, false)
  assert.equal(first.reason, 'not_authorized')
  assert.deepEqual(first.next, { consumed: true, attempts: 1 })
  const second = officialTruthBernResearchQuarantineOneShotVersuch(first.next)
  assert.equal(second.ok, false)
  assert.equal(second.reason, 'already_consumed')
  assert.deepEqual(second.next, first.next)
})

test('offline mock request rejects extra or malformed request fields', async () => {
  for (const input of [null, {}, { operation: 'offline_mock', sourceUrl: 'https://evil.example' },
    { operation: 'offline_mock', nested: { sourceSnapshot: 'x' } }, { operation: 'live' }]) {
    const result = await decideOfficialTruthBernResearchQuarantineOfflineMock(input, {
      now: () => new Date(),
      resolve: async () => [{ address: '93.184.216.34', family: 4 }],
      http: async () => ({ ok: false, reason: 'http_failed' }),
    })
    assert.deepEqual(result.phase, 'blocked')
    assert.deepEqual(result.reason, 'invalid_request')
  }
})

for (const [label, size, reason] of [
  ['65535', 65_535, 'content_identity_mismatch'],
  ['65536', 65_536, 'content_identity_mismatch'],
  ['65537', 65_537, 'response_too_large'],
] as const) {
  test(`default retrieval bound ${label}`, async () => {
    const { result, cancelled } = await laufen({ body: Buffer.alloc(size, 97), contentLength: size })
    assert.equal(result.reason, reason)
    if (size > 65_536) {
      assert.equal(result.bodyByteCount, null)
      assert.ok(cancelled > 0)
      assertKonservativ(result)
    } else {
      assert.equal(result.bodyByteCount, size)
    }
  })
}

for (const [label, size, ok] of [
  ['131071', 131_071, true],
  ['131072', 131_072, true],
  ['131073', 131_073, false],
] as const) {
  test(`mock-only 128KiB policy ${label}`, () => {
    const body = Buffer.alloc(size, 98)
    const decision = officialTruthBernResearchQuarantineMockBody({ body, declaredLength: body.byteLength })
    assert.equal(decision.ok, ok)
    if (decision.ok) {
      assert.equal(decision.bodyByteCount, size)
    } else {
      assert.equal(decision.reason, 'response_too_large')
    }
  })
}

test('mock-only body policy rejects mismatch, invalid UTF-8 and BOM', () => {
  assert.deepEqual(
    officialTruthBernResearchQuarantineMockBody({ body: Buffer.from('synthetic-body'), declaredLength: 4 }),
    { ok: false, reason: 'content_length_mismatch' },
  )
  assert.deepEqual(
    officialTruthBernResearchQuarantineMockBody({ body: new Uint8Array([0xc3, 0x28]), declaredLength: 2 }),
    { ok: false, reason: 'invalid_utf8' },
  )
  assert.deepEqual(
    officialTruthBernResearchQuarantineMockBody({ body: Buffer.from('\uFEFFx'), declaredLength: 4 }),
    { ok: false, reason: 'invalid_utf8' },
  )
  const multibyte = Buffer.from('ä'.repeat(65_536))
  const ok = officialTruthBernResearchQuarantineMockBody({ body: multibyte, declaredLength: multibyte.byteLength })
  assert.equal(ok.ok, true)
  if (ok.ok) assert.equal(ok.bodyByteCount, multibyte.byteLength)
})

test('declared length mismatch blocks with precise reason and conservative publication fields', async () => {
  const tooSmall = await laufen({ body: Buffer.from('synthetic-body'), contentLength: 5 })
  assert.equal(tooSmall.result.reason, 'response_too_large')
  assertKonservativ(tooSmall.result)
  assert.ok(tooSmall.cancelled > 0)
  const tooLarge = await laufen({ body: Buffer.from('synthetic-body'), contentLength: 100 })
  assert.equal(tooLarge.result.reason, 'content_length_mismatch')
  assertKonservativ(tooLarge.result)
  const shortStream = await laufen({ chunks: [Uint8Array.of(115, 101, 103, 109, 101, 110, 116)], contentLength: 64 })
  assert.equal(shortStream.result.reason, 'content_length_mismatch')
  assertKonservativ(shortStream.result)
})

test('missing declared length stays blocked and does not publish completed analysis', async () => {
  const withoutLength = await laufen({ body: Buffer.from('<html><script>analytics</script></html>'), contentLength: null })
  assert.equal(withoutLength.result.reason, 'content_identity_mismatch')
  assertKonservativ(withoutLength.result)
})

test('invalid declared length stays fail-closed and does not publish completed analysis', async () => {
  const invalidLength = await laufen({
    body: Buffer.from('<html><script>analytics</script></html>'),
    contentLengthRaw: 'nope',
  })
  assert.equal(invalidLength.result.reason, 'http_failed')
  assertKonservativ(invalidLength.result)
})

test('advertised length 1 aborts early on oversize stream without full consumption', async () => {
  const hugeChunks = Array.from({ length: 32 }, () => Buffer.alloc(4096, 65))
  const { result, cancelled, yieldedChunks } = await laufen({ chunks: hugeChunks, contentLength: 1 })
  assert.equal(result.reason, 'response_too_large')
  assertKonservativ(result)
  assert.ok(cancelled > 0)
  assert.ok(yieldedChunks <= 1)
})

test('oversized single chunk is rejected early and cancelled', async () => {
  const { result, cancelled, yieldedChunks } = await laufen({
    chunks: [Buffer.alloc(4096, 65)],
    contentLength: 1,
  })
  assert.equal(result.reason, 'response_too_large')
  assertKonservativ(result)
  assert.ok(cancelled > 0)
  assert.equal(yieldedChunks, 1)
})

test('faulty stream is cancelled and does not publish observations', async () => {
  const { result, cancelled } = await laufen({
    chunks: [Uint8Array.of(65, 66), Uint8Array.of(67, 68)],
    contentLength: 4,
    throwInBodyAtChunk: 1,
  })
  assert.equal(result.reason, 'http_failed')
  assertKonservativ(result)
  assert.ok(cancelled > 0)
})

test('timeout after headers cancels stalled stream promptly and publishes no incomplete analysis', async () => {
  const { result, cancelled, yieldedChunks, firstCancelAtMs } = await laufen({
    chunks: [Buffer.alloc(128, 65)],
    contentLength: 128,
    chunkDelayMs: 200,
    timeoutMs: 20,
  })
  assert.equal(result.reason, 'timeout')
  assertKonservativ(result)
  assert.ok(cancelled > 0)
  assert.equal(yieldedChunks, 0)
  assert.notEqual(firstCancelAtMs, null)
  assert.ok((firstCancelAtMs ?? Number.POSITIVE_INFINITY) < 200)
})

for (const [label, scenario, reason] of [
  ['private ipv4', { addresses: [{ address: '127.0.0.1', family: 4 as const }] }, 'address_not_permitted'],
  ['private ipv6', { addresses: [{ address: '::1', family: 6 as const }] }, 'address_not_permitted'],
  ['ipv4-mapped ipv6', { addresses: [{ address: '::ffff:127.0.0.1', family: 6 as const }] }, 'address_not_permitted'],
  ['mixed dns', { addresses: [{ address: '93.184.216.34', family: 4 as const }, { address: '10.0.0.1', family: 4 as const }] }, 'address_not_permitted'],
  ['redirect external', { status: 302, location: 'https://example.invalid/r' }, 'unregistered_domain'],
  ['redirect open query', { status: 302, location: `${OFFICIAL_TRUTH_BERN_RESEARCH_QUARANTINE_1.sourceUrl}?next=https://evil.example` }, 'representation_url_mismatch'],
  ['scheme downgrade', { status: 302, location: OFFICIAL_TRUTH_BERN_RESEARCH_QUARANTINE_1.sourceUrl.replace('https:', 'http:') }, 'insecure_scheme'],
  ['non default port', { status: 302, location: OFFICIAL_TRUTH_BERN_RESEARCH_QUARANTINE_1.sourceUrl.replace('.de/', '.de:8443/') }, 'non_default_port'],
  ['http 403', { status: 403 }, 'http_status'],
  ['http 500', { status: 500 }, 'http_status'],
  ['http failure', { fail: true }, 'http_failed'],
  ['timeout', { timeout: true }, 'timeout'],
  ['compression', { contentEncoding: 'gzip' }, 'http_failed'],
  ['wrong media', { contentType: 'application/json' }, 'content_type_mismatch'],
  ['wrong charset', { contentType: 'text/html; charset=iso-8859-1' }, 'content_type_mismatch'],
  ['invalid utf8', { body: new Uint8Array([0xc3, 0x28]), contentLength: 2 }, 'invalid_utf8'],
  ['bom', { body: new Uint8Array([0xef, 0xbb, 0xbf]), contentLength: 3 }, 'invalid_utf8'],
  ['empty body', { body: new Uint8Array(), contentLength: 0 }, 'empty_body'],
  ['truncated content-length mismatch stays blocked', { body: Buffer.from('synthetic-body'), contentLength: 100 }, 'content_length_mismatch'],
  ['streamed overrun', { chunks: [Buffer.alloc(65_536, 65), Buffer.alloc(1, 65)], contentLength: 65_536 }, 'response_too_large'],
] as const) {
  test(`offline transport refusal: ${label}`, async () => {
    const { result } = await laufen(scenario)
    assert.equal(result.phase, 'blocked')
    assert.equal(result.reason, reason)
    if (reason === 'content_length_mismatch') assertKonservativ(result)
  })
}

test('offline profile only emits conservative indicators and no raw body', async () => {
  const html = Buffer.from('<html><head><script>window.x=1</script></head><body>Impressum © <a href="https://cdn.example/file.js">x</a></body></html>')
  const { result } = await laufen({ body: html, contentLength: html.byteLength })
  assert.equal(result.reason, 'content_identity_mismatch')
  assert.equal(result.bodyByteCount, html.byteLength)
  assert.equal(result.html_scripts_present, true)
  assert.equal(result.embedded_external_asset_indicators_present, true)
  assert.equal(result.copyright_or_rights_indicators_present, true)
  assert.equal(JSON.stringify(result).includes('<html>'), false)
})

test('task script remains offline-only with no live switch and no network call', async (t) => {
  t.mock.method(https, 'request', () => {
    assert.fail('no network')
  })
  const noArgs = await runOfficialTruthBernResearchQuarantine1([])
  assert.equal(noArgs.exitCode, 0)
  assert.equal(noArgs.report.execution, 'NOT_RUN')
  const invalid = await runOfficialTruthBernResearchQuarantine1(['--live'])
  assert.equal(invalid.exitCode, 2)
  assert.equal(invalid.report.execution, 'INVALID_ARGUMENTS')
  const source = readFileSync('scripts/official-truth-bern-research-quarantine-1/run.ts', 'utf8')
  assert.doesNotMatch(source, /retrieveOfficialTruthIsolatedPilotSource|loadOfficialTruthServerOwnedRetrieval|--live-official|fetch\(/)
})

test('no app route imports the Bern quarantine module', () => {
  const files: string[] = []
  for (const root of ['app', 'components']) {
    const stack = [join(process.cwd(), root)]
    while (stack.length > 0) {
      const dir = stack.pop()
      if (!dir) continue
      let entries: { name: string; isDirectory(): boolean }[]
      try {
        entries = readdirSync(dir, { withFileTypes: true })
      } catch {
        continue
      }
      for (const entry of entries) {
        const path = join(dir, entry.name)
        if (entry.isDirectory()) stack.push(path)
        else if (/\.[cm]?[jt]sx?$/.test(entry.name) && readFileSync(path, 'utf8').includes('official-truth-bern-research-quarantine-1')) {
          files.push(path)
        }
      }
    }
  }
  assert.deepEqual(files, [])
})
