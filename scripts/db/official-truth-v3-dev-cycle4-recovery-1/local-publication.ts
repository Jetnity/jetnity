// Existing pinned public bytes; only the physical HTTPS transport is local.
// No source proof, authority receipt, SQL outcome or publication is invented.
import assert from 'node:assert/strict'
import { createHash } from 'node:crypto'
import { Resolver } from 'node:dns/promises'
import { EventEmitter } from 'node:events'
import { readFileSync } from 'node:fs'
import type { ClientRequest, IncomingMessage } from 'node:http'
import https from 'node:https'
import { performance } from 'node:perf_hooks'
import type { TestContext } from 'node:test'
import { gunzipSync } from 'node:zlib'
import type { M04Config } from '../../../lib/readiness/official-truth-product-v3/jobs/contract'
import { HRS1_LIMITS, HRS1_SQL, hrs1Canonical, hrs1Channel, readHrs1Command, readHrs1Reply,
  type Hrs1TerminalExecutor } from '../../../lib/readiness/official-truth-product-v3/result/contract'
import { AA_CH_DE_PUBLICATION, BERN_CH_DE_PUBLICATION } from '../../../lib/readiness/official-truth-product-v3/source/aa-ch-de-definition'
import { AA_BERN_CH_DE_REVIEWED_PROGRAM as program } from '../../../lib/readiness/official-truth-product-v3/source/aa-ch-de-reviewed-program'
import { aaBernReviewedDocumentIdentity, interpretAaBernReviewedArticle } from '../../../lib/readiness/official-truth-product-v3/source/aa-bern-ch-de-current-article'
import type { OwnedPersistentProof } from '../official-truth-v3-rolling-jobs-quota-1/persistent-backend'
import { literal } from '../official-truth-v3-rolling-jobs-quota-1/local-proof'
import { localExecutors, type HistoryFactoryEvent } from '../official-truth-v3-customer-information-1/history-claim-native'

const hash = (s: string | Uint8Array) => createHash('sha256').update(s).digest('hex')
const fixtureRoot = new URL('../official-truth-v3-customer-information-1/fixtures/publication-reviewed-20261112/', import.meta.url)
const fixtureManifestSha256 = '872c35ea694b5c949f953481c51366feebb389e2ee21e4ef764fbef7bd553d27'
type SourceRole = 'primary' | 'counter'
type SourceFixture = { role: SourceRole; file: string; gzipSha256: string; bytes: number; sha256: string;
  requestUrl: string; finalUrl: string; httpMethod: string; httpStatus: number; redirectCount: number; contentType: string;
  originalStartedAt: string; originalRetrievedAt: string }

export function reviewedOriginals() {
  const bytes = readFileSync(new URL('manifest.json', fixtureRoot))
  assert.equal(hash(bytes), fixtureManifestSha256, 'the exact historical public-fixture manifest is pinned')
  const manifest = JSON.parse(bytes.toString('utf8')) as { schema: number; fixtures: SourceFixture[] }
  assert.equal(manifest.schema, 1)
  assert.deepEqual(manifest.fixtures.map(f => f.role), ['primary', 'counter'])
  const result = {} as Record<SourceRole, string>
  for (const fixture of manifest.fixtures) {
    assert.equal(fixture.file, fixture.role + '.html.gz')
    const compressed = readFileSync(new URL(fixture.file, fixtureRoot))
    assert.equal(hash(compressed), fixture.gzipSha256)
    const body = gunzipSync(compressed, { maxOutputLength: 131072 })
    assert.equal(body.length, fixture.bytes); assert.equal(hash(body), fixture.sha256)
    const text = new TextDecoder('utf8', { fatal: true }).decode(body)
    assert.equal(Buffer.byteLength(text), fixture.bytes)
    const publication = fixture.role === 'primary' ? AA_CH_DE_PUBLICATION : BERN_CH_DE_PUBLICATION
    assert.equal(fixture.requestUrl, publication.url); assert.equal(fixture.finalUrl, publication.url)
    assert.equal(fixture.httpMethod, 'GET'); assert.equal(fixture.httpStatus, 200)
    assert.equal(fixture.redirectCount, 0); assert.equal(fixture.contentType, 'text/html')
    assert.ok(fixture.originalStartedAt.startsWith('2026-11-12T19:41:'))
    assert.ok(fixture.originalRetrievedAt.startsWith('2026-11-12T19:41:'))
    assert.doesNotMatch(text, /authorization|bearer\s|set-cookie|csrf|password|session[_-]?(?:id|token)|api[_-]key|secret|eyJ[A-Za-z0-9_-]{20,}\./i,
      'the retained files contain public page bytes only, with no session or credential material')
    assert.equal(aaBernReviewedDocumentIdentity(fixture.role, text), true)
    assert.equal(interpretAaBernReviewedArticle(fixture.role, text).status, 'clear',
      'the complete unchanged original article is checked by the actual selected parser')
    result[fixture.role] = text
  }
  return Object.freeze(result)
}

/** Only the physical network is fictional. The actual owned reader still sees
 * all original bytes, runs its complete identity/qualification checks, and owns
 * real invocation-local custody. No source receipt or positive result is mocked. */
export function historicalPublicWire(t: TestContext, originals: Readonly<Record<SourceRole, string>>) {
  const calls: { role: SourceRole; bytes: number }[] = []
  const closing = new Set<() => void>()
  let active = 0
  t.mock.method(Resolver.prototype, 'resolve4', (async (host: string) => {
    assert.ok(([AA_CH_DE_PUBLICATION.hostname, BERN_CH_DE_PUBLICATION.hostname] as readonly string[]).includes(host))
    return ['1.1.1.1']
  }) as Resolver['resolve4'])
  t.mock.method(Resolver.prototype, 'resolve6', (async (host: string) => {
    assert.ok(([AA_CH_DE_PUBLICATION.hostname, BERN_CH_DE_PUBLICATION.hostname] as readonly string[]).includes(host))
    return []
  }) as Resolver['resolve6'])
  t.mock.method(Resolver.prototype, 'cancel', () => undefined)
  t.mock.method(https, 'request', ((config: https.RequestOptions, callback: (r: IncomingMessage) => void) => {
    const role: SourceRole = config.hostname === AA_CH_DE_PUBLICATION.hostname ? 'primary' : 'counter'
    const publication = role === 'primary' ? AA_CH_DE_PUBLICATION : BERN_CH_DE_PUBLICATION
    assert.equal(config.hostname, publication.hostname); assert.equal(config.path, publication.path)
    assert.equal(config.method, 'GET')
    const body = Buffer.from(originals[role], 'utf8')
    calls.push({ role, bytes: body.length }); active++
    const request = new EventEmitter() as EventEmitter & { end(): void; destroy(): void }
    const response = new EventEmitter() as EventEmitter & { statusCode: number; rawHeaders: string[]; complete: boolean; destroy(): void }
    const socket = new EventEmitter() as EventEmitter & { destroy(): void }
    let closed = false
    const close = () => {
      if (closed) return
      closed = true; active--; closing.delete(close)
      response.emit('close'); request.emit('close'); socket.emit('close')
    }
    closing.add(close)
    request.destroy = response.destroy = socket.destroy = () => { queueMicrotask(close) }
    response.statusCode = 200; response.complete = true
    response.rawHeaders = ['Content-Type', 'text/html;charset=UTF-8', 'Content-Length', String(body.length)]
    request.end = () => {
      request.emit('socket', socket)
      queueMicrotask(() => {
        callback(response as unknown as IncomingMessage)
        queueMicrotask(() => { response.emit('data', body); response.emit('end'); queueMicrotask(close) })
      })
    }
    return request as unknown as ClientRequest
  }) as typeof https.request)
  return { calls, active: () => active, close() { for (const close of closing) close() } }
}

/** All fixed SQL ports share one real owned PostgreSQL backend. An outer FIFO
 * makes the original bridge and HRS channels wait before recomputing their own
 * remaining absolute deadline. It never supplies positive SQL/MA1/S1 replies. */
export function publicationExecutors(proof: OwnedPersistentProof) {
  const bridge = localExecutors(proof), events: HistoryFactoryEvent[] = []
  let tail: Promise<void> = Promise.resolve(), active = 0, peak = 0
  const serialize = <T>(run: () => Promise<T>): Promise<T> => {
    const next = tail.then(async () => {
      active++; peak = Math.max(peak, active)
      try { return await run() } finally { active-- }
    })
    tail = next.then(() => undefined, () => undefined)
    return next
  }
  const method: M04Config['methodExecutor'] = {
    readCurrent: (request, signal, budget) => serialize(() => bridge.method.readCurrent(request, signal, budget)),
  }
  const jobs: M04Config['jobsExecutor'] = {
    executeFixed: (request, signal) => serialize(() => bridge.jobs.executeFixed(request, signal)),
    executeAtomicClaimFixed: (request, signal) => serialize(() => bridge.jobs.executeAtomicClaimFixed!(request, signal)),
    executeAtomicMutationFixed: (request, signal) => serialize(() => bridge.jobs.executeAtomicMutationFixed!(request, signal)),
  }
  const intake: M04Config['intakeExecutor'] = {
    execute: (statement, params, signal, budget) => serialize(() => bridge.intake.execute(statement, params, signal, budget)),
  }
  function hrs(kind: 'writer' | 'reader' | 'verifier'): Hrs1TerminalExecutor {
    return { async executeFixed(request, signal) {
      const command = readHrs1Command(JSON.parse(request.operationText), program.binding)
      assert.ok(command); assert.equal(hrs1Canonical(command), request.operationText)
      assert.equal(hrs1Channel(command.operation), request.channel)
      assert.equal(command.bindingHash, request.bindingHash)
      const publicRead = ['coverage', 'projection', 'projection_current', 'projection_batch', 'ch_de_snapshot'].includes(command.operation)
      assert.ok(kind === 'verifier' ? request.channel === 'attest'
        : kind === 'reader' ? request.channel === 'read' && publicRead : request.channel !== 'attest' && !publicRead,
      'the local bridge preserves the exact production public-reader/writer channel split')
      const event: HistoryFactoryEvent = { operation: 'hrs_' + command.operation, entered: performance.now(),
        finished: 0, deadline: request.budget.deadline, dispatched: false }
      events.push(event)
      return serialize(async () => {
        event.admitted = performance.now()
        const remaining = Math.floor(event.deadline - event.admitted)
        if (signal.aborted || remaining < 1 || remaining > HRS1_LIMITS.effectMilliseconds) {
          event.status = 'unavailable'; event.finished = performance.now(); return { status: 'unavailable' as const }
        }
        const login = 'ot_v3_result_' + kind
        const params = [request.operationText, request.bindingHash, request.methodId, request.revision,
          request.methodDigest, request.packageDigest, request.epoch, remaining, request.notAfter, request.legalDate]
        const expression = HRS1_SQL[request.channel].replace(/^SELECT /, '').replace(/ AS result$/, '')
          .replace(/\$(\d+)/g, (_match, n: string) => {
            const value = params[Number(n) - 1]
            assert.ok(typeof value === 'string' || Number.isSafeInteger(value))
            return typeof value === 'string' ? literal(value) : String(value)
          })
        try {
          event.dispatched = true
          const actual = await proof.value<unknown>(expression,
            `SET SESSION AUTHORIZATION ${login};SET search_path=pg_catalog;BEGIN;
              SET LOCAL statement_timeout='${remaining}ms';SET LOCAL lock_timeout='${remaining}ms';
              DO $identity$ BEGIN IF session_user<>${literal(login)} OR current_user<>${literal(login)} THEN
                RAISE EXCEPTION 'original HRS runtime identity required';END IF;END $identity$;`,
            `DO $commit_deadline$ BEGIN IF clock_timestamp()>=${literal(request.notAfter)}::timestamptz THEN
              RAISE EXCEPTION 'original HRS commit deadline expired';END IF;END $commit_deadline$;COMMIT;`)
          const rows = [{ result: JSON.stringify(actual) }], decoded = readHrs1Reply(rows)
          assert.ok(decoded); event.status = decoded.status
          if (signal.aborted || performance.now() >= event.deadline) {
            event.status = 'unconfirmed'; return { status: 'unconfirmed' as const }
          }
          return { status: 'acknowledged' as const, rows }
        } catch (error) {
          event.error = error instanceof Error ? error.message.split('\n').filter(line => /ERROR:|FATAL:|PANIC:/.test(line)).join('\n') || error.message : String(error)
          event.status = 'unconfirmed'; return { status: 'unconfirmed' as const }
        } finally { event.finished = performance.now() }
      })
    } }
  }
  return { method, jobs, intake, writer: hrs('writer'), reader: hrs('reader'), verifier: hrs('verifier'),
    events: () => [...bridge.events, ...events].sort((a, b) => a.entered - b.entered),
    async drain() { await tail; await bridge.drain(); assert.equal(active, 0); assert.equal(bridge.active(), 0) },
    active: () => active + bridge.active(), peak: () => Math.max(peak, bridge.peak()) }
}
