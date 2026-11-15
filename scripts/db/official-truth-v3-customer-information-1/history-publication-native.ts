// Owned-local end-to-end capacity proof. PostgreSQL, MA1, S1, M04, source
// qualification, HRS and the selected tick are actual implementations. Only
// DNS/HTTPS transport supplies pinned historical public webpage bytes. This is
// neither a new live-source observation nor a TCP/TLS or hosted-capacity proof.
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
import { createV3PostgresDurableJobs, createV3PostgresResultJobs } from '../../../lib/readiness/official-truth-product-v3/method/authority-postgres'
import type { M04Config } from '../../../lib/readiness/official-truth-product-v3/jobs/contract'
import type { V3ManagedJobRecord } from '../../../lib/readiness/official-truth-product-v3/monitor/queue'
import type { Hrs1Facade } from '../../../lib/readiness/official-truth-product-v3/result/composition'
import { HRS1_LIMITS, HRS1_SQL, hrs1Canonical, hrs1Channel, hrs1Clock, readHrs1Command, readHrs1Reply,
  type Hrs1TerminalExecutor } from '../../../lib/readiness/official-truth-product-v3/result/contract'
import type { ChDeOwnerImportRequest } from '../../../lib/readiness/official-truth-product-v3/runtime/ch-de-owner-import-contract'
import { AA_CH_DE_DELIVERY_PRODUCER } from '../../../lib/readiness/official-truth-product-v3/source/aa-ch-de-delivery-producer'
import { AA_CH_DE_PUBLICATION, BERN_CH_DE_PUBLICATION } from '../../../lib/readiness/official-truth-product-v3/source/aa-ch-de-definition'
import { AA_BERN_CH_DE_REVIEWED_PROGRAM as program } from '../../../lib/readiness/official-truth-product-v3/source/aa-ch-de-reviewed-program'
import { aaBernReviewedDocumentIdentity, interpretAaBernReviewedArticle } from '../../../lib/readiness/official-truth-product-v3/source/aa-bern-ch-de-current-article'
import { OwnedPersistentProof } from '../official-truth-v3-rolling-jobs-quota-1/persistent-backend'
import { literal, readSql } from '../official-truth-v3-rolling-jobs-quota-1/local-proof'
import { baseSetup, methodSeed } from './native'
import { buildCapacityFixture626 } from './history-capacity-fixture'
import { localExecutors, type HistoryFactoryEvent } from './history-claim-native'

const owner = 'SET SESSION AUTHORIZATION ot_pilot_owner;SET search_path=pg_catalog;'
const creator = 'SET SESSION AUTHORIZATION postgres;SET search_path=pg_catalog;'
const fixtureScope = "SET LOCAL jetnity.local_quota_fixture='owned-local-pg17-only';"
const binding = { methodId: program.binding.methodId, revision: program.binding.revision,
  methodDigest: program.binding.methodDigest, packageDigest: program.binding.packageDigest }
const hash = (s: string | Uint8Array) => createHash('sha256').update(s).digest('hex')
const id = (kind: string, tag: string) => kind + '_' + hash('owned-selected-publication626:' + tag).slice(0, 32)
const fixtureRoot = new URL('./fixtures/publication-reviewed-20261112/', import.meta.url)
const fixtureManifestSha256 = '872c35ea694b5c949f953481c51366feebb389e2ee21e4ef764fbef7bd553d27'
type SourceRole = 'primary' | 'counter'
type SourceFixture = { role: SourceRole; file: string; gzipSha256: string; bytes: number; sha256: string;
  requestUrl: string; finalUrl: string; httpMethod: string; httpStatus: number; redirectCount: number; contentType: string;
  originalStartedAt: string; originalRetrievedAt: string }

function reviewedOriginals() {
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
function historicalPublicWire(t: TestContext, originals: Readonly<Record<SourceRole, string>>) {
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
function publicationExecutors(proof: OwnedPersistentProof) {
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

type Prefix = { digest: string; operations: number; starts: number; dispositions: number }
type Quota = { lifetime_starts: number; lifetime_operations: number; starts: number; operations: number; clock_ok: boolean }
type PublicationState = { job: V3ManagedJobRecord; starts: number; prepared: number; completed: number;
  versions: number; projections: number; publications: number; qualifications: number; openAttempt: boolean; terminalCredit: boolean }
function eventSummary(events: HistoryFactoryEvent[]) {
  return events.map(e => ({ operation: e.operation, phase: e.phase, action: e.action, purpose: e.purpose,
    milliseconds: e.finished - e.entered, queuedMilliseconds: (e.admitted ?? e.entered) - e.entered,
    dispatched: e.dispatched, status: e.status, error: e.error }))
}

export async function runHistoryPublicationNative(t: TestContext) {
  const originals = reviewedOriginals(), wire = historicalPublicWire(t, originals)
  const fixture = await buildCapacityFixture626(), proof = new OwnedPersistentProof(t.signal)
  const ports = publicationExecutors(proof)
  try {
    await baseSetup(proof)
    await proof.run(owner + 'BEGIN;' + fixtureScope + methodSeed(fixture.original.oldestAt) + fixture.original.seedSql + 'COMMIT;', 'unchanged original64 prefix')
    for (const file of ['provider-migration-body.sql', 'status-rpc-provider-migration-body.sql', 'recovery-provider-migration-body.sql', 'recovery-gap-provider-migration-body.sql'])
      await proof.run(creator + 'BEGIN;' + readSql('official-truth-v3-background-guard-1/' + file) + 'COMMIT;', 'unchanged complete BG1 predecessor')
    await proof.run(creator + 'BEGIN;' + readSql('official-truth-v3-rolling-jobs-quota-1/provider-migration-body.sql') + 'COMMIT;', 'unchanged rolling predecessor')
    await proof.run(creator + 'BEGIN;' + readSql('official-truth-v3-customer-information-1/provider-migration-body.sql') + 'COMMIT;', 'exact reviewed customer successor')
    assert.equal((await proof.value<{ status: string }>('official_v3_guard_private.audit_v1()', creator)).status, 'current')
    const cutoff = literal(fixture.prefixCutoff) + '::timestamptz'
    const prefixExpression = `(WITH o AS (SELECT * FROM official_v3_jobs_private.queue_operations_v1 WHERE recorded_at<=${cutoff}),
      s AS (SELECT * FROM official_v3_jobs_private.execution_starts_v1 WHERE reserved_at<=${cutoff}),
      d AS (SELECT * FROM official_v3_jobs_private.execution_dispositions_v1 WHERE settled_at<=${cutoff})
      SELECT jsonb_build_object('operations',(SELECT count(*) FROM o),'starts',(SELECT count(*) FROM s),'dispositions',(SELECT count(*) FROM d),
        'digest',encode(sha256(convert_to(jsonb_build_object('o',(SELECT jsonb_agg(to_jsonb(r) ORDER BY operation_id) FROM o r),
          's',(SELECT jsonb_agg(to_jsonb(r) ORDER BY attempt_key) FROM s r),
          'd',(SELECT jsonb_agg(to_jsonb(r) ORDER BY attempt_key) FROM d r))::text,'UTF8')),'hex')))`
    const prefix = await proof.value<Prefix>(prefixExpression, owner + 'BEGIN;' + fixtureScope + fixture.prefixSql, 'ROLLBACK;')
    assert.deepEqual([prefix.operations, prefix.starts, prefix.dispositions], [447, 86, 86])
    await proof.run(owner + 'BEGIN;' + fixtureScope + 'SELECT official_v3_guard_private.begin_jobs_v1();' + fixture.queueSql
      + 'SELECT official_v3_guard_private.seal_jobs_v1();COMMIT;', 'complete626/2066 with all187 original deduplications')
    const quota = await proof.value<Quota>('official_v3_guard_private.ch_de_quota_v2()', creator)
    assert.equal(quota.lifetime_starts, 626); assert.equal(quota.lifetime_operations, 2066)
    assert.equal(quota.clock_ok, true); assert.ok(quota.starts <= 64 && quota.operations <= 256)
    const rolesExpression = `(SELECT to_jsonb(encode(sha256(convert_to(jsonb_build_object(
      'roles',(SELECT jsonb_agg(to_jsonb(r) ORDER BY oid) FROM pg_roles r),
      'memberships',(SELECT jsonb_agg(to_jsonb(r) ORDER BY oid) FROM pg_auth_members r))::text,'UTF8')),'hex')))`
    const roles = await proof.value<string>(rolesExpression, owner)
    const invariant = async () => {
      await ports.drain(); assert.equal(wire.active(), 0)
      assert.deepEqual(await proof.value<Prefix>(prefixExpression, owner), prefix)
      assert.equal(await proof.value<string>(rolesExpression, owner), roles)
      await proof.run(creator + 'SELECT official_v3_guard_private.assert_catalog_v1();SELECT official_v3_guard_private.check_certificates_v1();'
        + 'SELECT official_v3_guard_private.require_open_v1();', 'unchanged actual catalog, state certificates and BG1 admission')
    }
    const now = () => { const c = hrs1Clock(new Date().toISOString(), program.legalTimeZone); assert.ok(c); return c }
    // The historical fixture ends with queued627 (attemptLimit1). Finish that
    // exact existing cycle through the normal real API before the normal new
    // selected request can enqueue its own deterministic identity/attemptLimit4.
    const cleanup = createV3PostgresDurableJobs({ binding, registry: program.registry, clock: now,
      methodExecutor: ports.method, jobsExecutor: ports.jobs, intakeExecutor: ports.intake,
      producer: { async produce() { return { status: 'failed', reason: 'unreachable' } } },
      evidence: { async inspect() { assert.fail('no source fiction in historical cleanup') }, async reprove() { assert.fail('no source custody fiction') } },
      history: { async read() { assert.fail('no history fiction in historical cleanup') }, async reprove() { assert.fail('no history receipt fiction') } } })
    const settled = await cleanup.workOnce({ operationId: id('op3', 'settle-old-claim'), leaseId: id('lease3', 'settle-old-claim'),
      jobKey: fixture.original.jobKey, leaseMilliseconds: 30000 }, t.signal)
    await ports.drain()
    assert.equal(settled.status, 'worker_only')
    assert.ok(settled.status === 'worker_only'); assert.equal(settled.worker.status, 'exhausted')
    assert.equal(wire.calls.length, 0)
    let produced = 0, serial = 0
    const facade = createV3PostgresResultJobs({ binding, registry: program.registry, clock: now,
      methodExecutor: ports.method, jobsExecutor: ports.jobs, intakeExecutor: ports.intake,
      producer: { async produce(input, signal) { produced++; return AA_CH_DE_DELIVERY_PRODUCER.produce(input, signal) } },
      result: { binding: program.binding, writerExecutor: ports.writer, readerExecutor: ports.reader, verifierExecutor: ports.verifier,
        ids: () => { const tag = String(++serial); return { operationId: id('op3', 'auto-' + tag), jobId: id('job3', 'auto-' + tag) } } } })
    const sameFacade: Hrs1Facade = facade
    t.mock.module(new URL('../../../lib/readiness/official-truth-product-v3/runtime/ch-de-server.ts', import.meta.url), {
      cache: true, namedExports: { officialTruthV3ChDeRuntime() { return sameFacade } },
    })
    const { enqueueOfficialTruthV3ChDeRefresh, chDeRefreshQueueIdentity } = await import('../../../lib/readiness/official-truth-product-v3/runtime/ch-de-refresh')
    const { runOfficialTruthV3ChDeTick } = await import('../../../lib/readiness/official-truth-product-v3/runtime/ch-de-tick')
    const startRequest: ChDeOwnerImportRequest = Object.freeze({ schema: 2, mode: 'start',
      operationId: id('op3', 'normal-original-request'), leaseId: id('lease3', 'normal-original-request') })
    const resumeRequest: ChDeOwnerImportRequest = Object.freeze({ ...startRequest, mode: 'resume' })
    const enqueued = await enqueueOfficialTruthV3ChDeRefresh(startRequest, t.signal)
    await ports.drain(); assert.deepEqual(enqueued, { schema: 1, status: 'queued', published: 0 })
    const selectedQuota = await proof.value<Quota>('official_v3_guard_private.ch_de_quota_v2()', creator)
    assert.equal(selectedQuota.lifetime_starts, 627); assert.equal(selectedQuota.lifetime_operations, 2069)
    const state = () => proof.value<PublicationState>(`(SELECT jsonb_build_object('job',s.current_job,
      'starts',(SELECT count(*) FROM official_v3_jobs_private.execution_starts_v1),
      'prepared',(SELECT count(*) FROM official_v3_jobs_private.execution_results_v1),
      'completed',(SELECT count(*) FROM official_v3_jobs_private.execution_dispositions_v1 WHERE kind='completed'),
      'versions',(SELECT count(*) FROM official_v3_result_private.versions_v1),
      'projections',(SELECT count(*) FROM official_v3_result_private.projections_v1),
      'publications',(SELECT count(*) FROM official_v3_result_private.operations_v1 WHERE operation_kind='publication'),
      'qualifications',(SELECT count(*) FROM official_v3_result_private.qualifications_v1),
      'openAttempt',s.open_attempt IS NOT NULL,'terminalCredit',s.terminal_credit_claim IS NOT NULL)
      FROM official_v3_jobs_private.subjects_v1 s WHERE job_key=${literal(fixture.original.jobKey)})`, owner)
    const queued = await state(), cycle = chDeRefreshQueueIdentity(startRequest)
    assert.ok(cycle); assert.equal(queued.job.state, 'queued'); assert.equal(queued.job.attempt, 0)
    assert.equal(queued.job.attemptLimit, program.binding.attemptLimit)
    assert.equal(queued.job.jobId, cycle.jobId); assert.equal(queued.job.operationId, cycle.operationId)
    await invariant()
    await proof.run(owner + "DO $off$ BEGIN IF current_setting('track_functions')<>'none' THEN RAISE EXCEPTION 'instrumented publication timing';END IF;END $off$;", 'actual uninstrumented publication')
    const eventsBefore = ports.events().length, entered = performance.now(), enteredAt = Date.now()
    const first = await runOfficialTruthV3ChDeTick(t.signal, resumeRequest)
    await ports.drain()
    const elapsed = performance.now() - entered, firstState = await state()
    const firstEvents = ports.events().slice(eventsBefore)
    t.diagnostic('actual selected publication horizon: ' + JSON.stringify({ history: selectedQuota, tick: first,
      milliseconds: elapsed, jobState: firstState.job.state, attempt: firstState.job.attempt, starts: firstState.starts,
      prepared: firstState.prepared, completed: firstState.completed, openAttempt: firstState.openAttempt,
      terminalCredit: firstState.terminalCredit, versions: firstState.versions, projections: firstState.projections,
      produced, sourceRequests: wire.calls, calls: eventSummary(firstEvents) }))
    await invariant()
    assert.ok(firstEvents.some(e => e.operation === 'execution_read' && e.purpose === 'resume'), 'the real retained-request selection ran')
    assert.deepEqual(first.calls, { started: 1, settled: 1 })
    assert.equal(first.budgetMilliseconds, 30000)
    assert.equal(first.stages.discovery, 'skipped'); assert.equal(first.stages.monitor, 'skipped')
    // Only a genuinely completed M04 result is eligible for later publication
    // recovery after the original lease. PREPARED/open START is never relabelled
    // as that state or rescued by a fresh ID, factory or timeout window.
    let last = first, finalState = firstState
    if (first.counts.published === 0 && firstState.job.state === 'succeeded' && firstState.completed === 1) {
      const acquired = firstEvents.find(e => e.operation === 'queue_claim' && e.status === 'committed')?.record
      assert.ok(acquired?.lease, 'the real first acquisition retained its original lease')
      assert.equal(firstState.prepared, 1); assert.equal(firstState.openAttempt, false); assert.equal(firstState.terminalCredit, false)
      const custodyExpression = `(SELECT to_jsonb(encode(sha256(convert_to(jsonb_build_object(
        'results',(SELECT jsonb_agg(to_jsonb(r) ORDER BY attempt_key) FROM official_v3_jobs_private.execution_results_v1 r),
        'intake',(SELECT jsonb_agg(to_jsonb(r) ORDER BY operation_id) FROM official_v3_intake_private.operations_v1 r),
        'reservations',(SELECT jsonb_agg(to_jsonb(r) ORDER BY operation_id) FROM official_v3_intake_private.reservations_v1 r),
        'completions',(SELECT jsonb_agg(to_jsonb(r) ORDER BY operation_id) FROM official_v3_intake_private.completions_v1 r))::text,'UTF8')),'hex')))`
      const completedCustody = await proof.value<string>(custodyExpression, owner)
      const producedBefore = produced, startsBefore = firstState.starts, retryEventsBefore = ports.events().length
      const wait = Math.max(0, 60001 - (Date.now() - enteredAt))
      assert.ok(wait <= 60000)
      if (wait > 0) await new Promise<void>((resolve, reject) => {
        const timer = setTimeout(() => { t.signal.removeEventListener('abort', stop); resolve() }, wait)
        const stop = () => { clearTimeout(timer); t.signal.removeEventListener('abort', stop); reject(Error('native publication proof aborted')) }
        t.signal.addEventListener('abort', stop, { once: true }); if (t.signal.aborted) stop()
      })
      assert.ok(Date.now() - enteredAt >= 60000, 'a later normal minute dispatch, after the original lease')
      assert.ok(Date.now() > Date.parse(acquired.lease.expiresAt), 'publication recovery is proved after actual lease expiry')
      last = await runOfficialTruthV3ChDeTick(t.signal, resumeRequest)
      await ports.drain(); finalState = await state()
      const retryEvents = ports.events().slice(retryEventsBefore)
      t.diagnostic('actual same-request same-facade minute resume: ' + JSON.stringify({ tick: last,
        jobState: finalState.job.state, starts: finalState.starts, prepared: finalState.prepared, completed: finalState.completed,
        versions: finalState.versions, projections: finalState.projections, produced,
        calls: eventSummary(retryEvents) }))
      assert.equal(produced, producedBefore, 'completed publication recovery never repeats the producer')
      assert.equal(finalState.starts, startsBefore, 'completed publication recovery never starts another source attempt')
      assert.deepEqual(finalState.job, firstState.job, 'same completed record, operation and job identity')
      assert.equal(await proof.value<string>(custodyExpression, owner), completedCustody, 'original S1 bytes and completed execution result remain exact')
      assert.ok(retryEvents.every(e => !['queue_claim', 'queue_mutate', 'execution_start', 'execution_prepare'].includes(e.operation)),
        'the original completed-result resume never creates or mutates queue/execution custody')
      assert.equal(last.budgetMilliseconds, 30000)
      await invariant()
    }
    assert.equal(last.counts.published, 1, 'the complete actual selected tick, or its permitted completed-result minute resume, publishes')
    assert.equal(last.status, 'complete'); assert.equal(finalState.job.state, 'succeeded')
    assert.deepEqual([finalState.prepared, finalState.completed, finalState.versions, finalState.projections, finalState.publications], [1, 1, 1, 1, 1])
    assert.equal(finalState.openAttempt, false); assert.equal(finalState.terminalCredit, false)
    assert.equal(finalState.starts, 628)
    assert.equal(produced, 1); assert.ok(wire.calls.length >= 2)
    const sourceCallsBeforeQuery = wire.calls.length
    const visitor = await facade.query({ destinationCountryCode: 'DE', citizenshipCountryCodes: ['CH'] }, t.signal)
    await ports.drain()
    t.diagnostic('actual visitor after publication: ' + JSON.stringify({ ok: visitor.ok,
      accepted: visitor.ok ? visitor.answer.response.cells.flatMap(c => c.results).filter(r => r.status === 'accepted').length : 0,
      reason: visitor.ok ? null : visitor.reason }))
    assert.equal(visitor.ok, true); assert.ok(visitor.ok)
    assert.equal(visitor.answer.response.dataMode, 'official_projection')
    assert.equal(visitor.answer.response.cells.flatMap(c => c.results).filter(r => r.status === 'accepted').length, 1)
    assert.equal(wire.calls.length, sourceCallsBeforeQuery, 'the actual visitor uses the completed publication without source rereads')
    const finalQuota = await proof.value<Quota>('official_v3_guard_private.ch_de_quota_v2()', creator)
    assert.equal(finalQuota.lifetime_starts, 628); assert.equal(finalQuota.lifetime_operations, 2071)
    assert.equal(finalQuota.clock_ok, true); assert.ok(finalQuota.starts <= 64 && finalQuota.operations <= 256)
    await invariant(); assert.equal(ports.active(), 0); assert.equal(ports.peak(), 1)
  } finally {
    wire.close()
    try { await ports.drain() } finally { await proof.close() }
  }
}
