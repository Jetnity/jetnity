// SOURCE_ONLY at delivery. Real pg 8.23.1/TLS/PG17; owned synthetic local SQL only.
// This tests transport completion and permissions, not HRS/method acceptance.
import assert from 'node:assert/strict'
import { test } from 'node:test'
import { performance } from 'node:perf_hooks'
import { quellenRegistryErstellen } from '../../../lib/readiness/source-registry'
import { createContentIdentityGraph } from '../../../lib/readiness/official-truth-content-identity'
import { createV3ContextIdentity, readV3GlobalRuleContext } from '../../../lib/readiness/official-truth-product-v3/contract'
import { createV3PostgresResultJobs, type Ma1MethodSqlExecutor } from '../../../lib/readiness/official-truth-product-v3/method/authority-postgres'
import type { M04FixedRequest } from '../../../lib/readiness/official-truth-product-v3/jobs/contract'
import { HRS1_LIMITS, hrs1Clock, readHrs1Binding, type Hrs1FixedRequest, type Hrs1TerminalExecutor } from '../../../lib/readiness/official-truth-product-v3/result/contract'
import { V3_PG_LOGINS, selectedV3PgTarget, type V3PgLogin, type V3PgTarget } from '../../../lib/readiness/official-truth-product-v3/transport/node-postgres-selection'
import { startOwnedTlsPgFixture } from './owned-tls-fixture'

const binding = { methodId: 'pg_transport_fixture', revision: 1, methodDigest: 'a'.repeat(64), packageDigest: 'b'.repeat(64) }
const signal = () => new AbortController().signal
const pause = (n: number) => new Promise<void>(r => setTimeout(r, n))
const budget = (milliseconds = 5000) => Object.freeze({ deadline: performance.now() + milliseconds })
const intakeStatement = 'SELECT official_v3_intake_api.capture_v1($1::jsonb,$2::text,$3::text) AS result'
function job(body: Record<string, unknown> = {}, ms = 5000, probe = false): M04FixedRequest {
  return { ...binding, operationText: JSON.stringify({ operation: 'queue_read', body, phase: probe ? 'probe' : 'authorized' }),
    epoch: probe ? null : 1, budget: { deadline: performance.now() + ms }, notAfter: new Date(Date.now() + ms).toISOString() } as M04FixedRequest
}
function hrs(operation: string, body: Record<string, unknown>, channel: 'attest' | 'execute' | 'read'): Hrs1FixedRequest {
  return { ...binding, channel, operationText: JSON.stringify({ schema: 1, operation, bindingHash: 'c'.repeat(64), body }),
    bindingHash: 'c'.repeat(64), epoch: 1, budget: { deadline: performance.now() + 5000 },
    notAfter: new Date(Date.now() + 5000).toISOString(), legalDate: '2026-11-12' } as Hrs1FixedRequest
}
const intakeBinding = { schema: 3, kind: 'proposal_intake_binding', operationId: 'op3_' + '1'.repeat(32),
  jobId: 'job3_' + '2'.repeat(32), contextKey: 'official-truth-context:v3:' + '3'.repeat(64),
  method: { methodId: binding.methodId, revision: 1 }, runnerId: 'runner3_' + '4'.repeat(32),
  deliveryId: 'delivery3_' + '5'.repeat(32), inputRevision: 'snapshot:' + '6'.repeat(64) }
function resultText(result: { status: string; rows?: unknown }): string {
  assert.equal(result.status, 'acknowledged')
  assert.ok(Array.isArray(result.rows) && result.rows.length === 1)
  const text = (result.rows[0] as { result?: unknown }).result
  assert.equal(typeof text, 'string'); return text as string
}
/** Valid configuration only; this fixture never issues a positive source receipt.
 * The real factory must reach its real MA1 executor, not fail config validation. */
function publicFailureFixture() {
  const roles = ['primary','counter'] as const
  const source = (role: typeof roles[number]) => ({ sourceId: 'pg-transport-synthetic-' + role,
    contentItemId: 'synthetic-visa', contentItemVersion: 1, representationId: 'synthetic-json',
    representationVersion: 1, identityProfileId: 'pg-transport-synthetic-profile', identityProfileVersion: 1 })
  const url = (role: typeof roles[number]) => 'https://pg-transport-synthetic-' + role + '.example/visa'
  const created = quellenRegistryErstellen(roles.map(role => ({ sourceId: source(role).sourceId,
    sourceClass: 'official_authority', publisherName: 'Synthetic transport publisher', authorityName: 'Synthetic transport authority',
    domains: ['pg-transport-synthetic-' + role + '.example'] })))
  assert.ok(created.ok); if (!created.ok) assert.fail('synthetic registry refused')
  const graph = createContentIdentityGraph(created.registry, roles.map(role => ({ sourceId: source(role).sourceId,
    contentItemId: 'synthetic-visa', contentItemVersion: 1, current: true, externalIdNamespace: 'synthetic',
    externalContentId: 'transport-visa', expectedPublisherIds: ['synthetic'], expectedAuthorityIds: ['synthetic'] })),
    roles.map(role => ({ ...source(role), current: true, requestUrls: [url(role)], expectedFinalUrl: url(role),
      expectedMediaType: 'application/json', expectedLocale: null, expectedSchema: null })),
    [{ identityProfileId: 'pg-transport-synthetic-profile', identityProfileVersion: 1, current: true,
      verify: () => ({ ok: false as const, reason: 'identity_mismatch' as const }) }])
  assert.ok(graph.ok); if (!graph.ok) assert.fail('synthetic graph refused')
  const registry = { ...created.registry, contentIdentity: graph.value }
  const context = readV3GlobalRuleContext({ scope: { destinationCountryCode: 'DE', transitCountryCode: null,
    citizenship: { mode: 'required', countryCodes: ['CH'] }, credentialOption: { mode: 'option', documentType: 'passport',
      issuingCountryCode: 'CH', relatedCitizenshipCountryCode: 'CH' }, residence: { mode: 'not_applicable' },
    requirementType: 'visa', validity: { mode: 'not_applicable' } }, route: 'direct_entry',
    conditions: { status: 'specified', expression: { op: 'atomic', predicate: { kind: 'travel_purpose', purpose: 'visitor' } } } })
  if (!context.ok) assert.fail(context.reason)
  const identity = createV3ContextIdentity(context.value)
  if (!identity.ok) assert.fail(identity.reason)
  const selectedBinding = readHrs1Binding({ ...binding, schema: 1, qualificationScope: 'global_context', context: context.value,
    contextKey: identity.value.contextKey, factKind: 'requirement_effect', dataMode: 'synthetic_test', legalTimeZone: 'Europe/Berlin',
    activeFrom: '2000-01-01T00:00:00.000Z', activeUntilExclusive: '2099-12-31T00:00:00.000Z',
    sourceMaxAgeMilliseconds: 300000, projectionMaxAgeMilliseconds: 60000, monitorIntervalMilliseconds: 100,
    monitorLeaseMilliseconds: 5000, attemptLimit: 3, sources: roles.map(role => ({ source: source(role), canonicalUrl: url(role),
      contentType: 'application/json', executableDigest: 'c'.repeat(64), qualificationDigest: 'd'.repeat(64), role })) }, registry)
  assert.ok(selectedBinding)
  return { registry, binding: selectedBinding, clock() {
    const clock = hrs1Clock(new Date().toISOString(), selectedBinding.legalTimeZone); assert.ok(clock); return clock
  } }
}

test('genuine owned Node-Postgres TLS transport', { timeout: 180000 }, async t => {
  assert.equal(selectedV3PgTarget(), null, 'production has no selected target or runtime fixture override')
  const fixture = await startOwnedTlsPgFixture(t)
  let selected: V3PgTarget | null = fixture.target
  t.mock.module(new URL('../../../lib/readiness/official-truth-product-v3/transport/node-postgres-selection.ts', import.meta.url), {
    cache: true, namedExports: { V3_PG_LOGINS,
      selectedV3PgTarget: () => selected,
      readV3PgPassword: (kind: V3PgLogin) => fixture.password(kind),
    },
  })
  const { V3_NODE_POSTGRES_EXECUTORS: port, readV3NodePostgresTerminalState: state } = await import(
    '../../../lib/readiness/official-truth-product-v3/transport/node-postgres-executors')
  const effects = async () => (await fixture.query('SELECT count(*)::text AS n FROM transport_fixture.effects')).rows[0]!.n as string
  try {
    await t.test('missing or expired MA1/S1 cap opens no backend', async () => {
      const request = { ...binding, checkedAt: new Date().toISOString() }
      const values = [JSON.stringify(intakeBinding), '{"synthetic":true}', '7'.repeat(64)]
      assert.deepEqual(await port.method.readCurrent(request, signal()), { status: 'unavailable' })
      assert.deepEqual(await port.intake.execute(intakeStatement, values, signal()), { status: 'unavailable' })
      const expired = Object.freeze({ deadline: performance.now() - 1 })
      assert.deepEqual(await port.method.readCurrent(request, signal(), expired), { status: 'unavailable' })
      assert.deepEqual(await port.intake.execute(intakeStatement, values, signal(), expired), { status: 'unavailable' })
      await fixture.absent(); assert.equal(await effects(), '0')
    })
    await t.test('TLS hostname failure cannot reach SQL or retain a reusable client', async () => {
      selected = { ...fixture.target, tlsHostname: 'wrong.invalid' }
      assert.deepEqual(await port.jobs.executeFixed(job(), signal()), { status: 'unavailable' })
      assert.equal(await effects(), '0'); assert.equal(state().jobs, 'idle')
      selected = fixture.target
    })
    await t.test('all six real LOGIN channels, original text, NULL and microsecond cells', async () => {
      // Dedicated process: hostile PG defaults are synthetic and never read back.
      Object.assign(process.env, { PGHOST: 'refused.invalid', PGPORT: '1', PGUSER: 'postgres', PGPASSWORD: 'not-a-credential',
        PGDATABASE: 'refused_database', PGSSLMODE: 'disable', PGSSLNEGOTIATION: 'direct', PGREPLICATION: 'database' })
      const method = await port.method.readCurrent({ ...binding, checkedAt: new Date().toISOString() }, signal(), budget())
      assert.equal(method.status, 'rows'); assert.ok(method.status === 'rows' && Array.isArray(method.rows))
      assert.equal(method.rows[0].approval_until, null)
      assert.equal(method.rows[0].observed_at, '2026-11-12 10:00:00.123456+00')
      assert.equal(method.rows[0].epoch, '0')
      const original = ' { "synthetic" : "  byte-exact Ω  " }\n'
      const intake = await port.intake.execute('SELECT official_v3_intake_api.capture_v1($1::jsonb,$2::text,$3::text) AS result',
        [JSON.stringify(intakeBinding), original, '7'.repeat(64)], signal(), budget())
      assert.match(resultText(intake), /9007199254740993/)
      const probe = job({}, 5000, true)
      assert.match(resultText(await port.jobs.executeFixed(probe, signal())), /9007199254740993/)
      assert.match(resultText(await port.writer.executeFixed(hrs('history', { contextKey: 'synthetic', factKind: 'requirement_effect' }, 'read'), signal())), /"null": null/)
      assert.match(resultText(await port.reader.executeFixed(hrs('coverage', { destinationCountryCode: 'DE', citizenshipCountryCode: 'CH' }, 'read'), signal())), /recorded/)
      assert.match(resultText(await port.verifier.executeFixed(hrs('attest', { kind: 'synthetic', verification: {} }, 'attest'), signal())), /recorded/)
      const originals = await fixture.query('SELECT login,original,epoch FROM transport_fixture.effects ORDER BY id')
      assert.deepEqual(originals.rows.map(r => r.login), ['ot_v3_intake_transport_login','ot_v3_jobs_transport_login',
        'ot_v3_result_writer','ot_v3_result_reader','ot_v3_result_verifier'])
      assert.equal(originals.rows[0]!.original, original)
      assert.equal(originals.rows[1]!.original, probe.operationText); assert.equal(originals.rows[1]!.epoch, null)
      await fixture.absent()
      assert.ok(Object.values(state()).every(s => s === 'idle'))
      for (const key of ['PGHOST','PGPORT','PGUSER','PGPASSWORD','PGDATABASE','PGSSLMODE','PGSSLNEGOTIATION','PGREPLICATION']) delete process.env[key]
    })
    await t.test('actual native grants deny verifier reads and reader writes', async () => {
      const args = ['{}', 'c'.repeat(64), binding.methodId, 1, binding.methodDigest, binding.packageDigest, 1, 1000,
        new Date(Date.now() + 1000).toISOString(), '2026-11-12']
      await assert.rejects(fixture.direct('verifier', 'SELECT official_v3_result_api.read_v1($1::jsonb,$2::text,$3::text,$4::integer,$5::text,$6::text,$7::integer,$8::integer,$9::text,$10::text)', args),
        (error: unknown) => (error as { code?: string }).code === '42501')
      await assert.rejects(fixture.direct('reader', 'SELECT official_v3_result_api.execute_v1($1::jsonb,$2::text,$3::text,$4::integer,$5::text,$6::text,$7::integer,$8::integer,$9::text,$10::text)', args),
        (error: unknown) => (error as { code?: string }).code === '42501')
      await assert.rejects(fixture.direct('jobs', 'SET ROLE ot_v3_method_reader'), (error: unknown) => (error as { code?: string }).code === '42501')
      await fixture.absent()
    })
    await t.test('abort terminates the exact live transaction and proves real rollback/cleanup', async () => {
      const before = await effects(), controller = new AbortController()
      const pending = port.jobs.executeFixed(job({ block: true }, 3000), controller.signal)
      await fixture.waitBlocked()
      const capacity = await fixture.query("SELECT pid::text,backend_start::text,application_name FROM pg_catalog.pg_stat_activity WHERE usename='ot_v3_jobs_transport_login' ORDER BY pid")
      assert.equal(capacity.rows.length, 2, 'exactly one working/control pair under the same narrow LOGIN')
      assert.ok(capacity.rows.some(r => r.application_name.includes(':w:')) && capacity.rows.some(r => r.application_name.includes(':c:')))
      assert.deepEqual(await port.jobs.executeFixed(job(), signal()), { status: 'unavailable' })
      controller.abort()
      assert.deepEqual(await pending, { status: 'unconfirmed' })
      await fixture.absent()
      assert.equal(await effects(), before, 'the insert preceding pg_sleep really rolled back')
      assert.equal(state().jobs, 'idle')
    })
    await t.test('the original MA1 deadline expires a real active read and joins its backend', async () => {
      const before = await effects(), cap = budget(3000)
      await pause(500) // This time belongs to the same original invocation.
      const pending = port.method.readCurrent({ ...binding, methodId: 'pg_transport_fixture_block', checkedAt: new Date().toISOString() }, signal(), cap)
      await fixture.waitBlocked('method')
      assert.deepEqual(await pending, { status: 'unavailable' })
      assert.ok(performance.now() < cap.deadline + 2000, 'terminal cleanup did not wait for a new five-second effect allowance')
      await fixture.absent(); assert.equal(await effects(), before); assert.equal(state().method, 'idle')
    })
    await t.test('the consumed S1 cap rolls back an actual dispatched effect', async () => {
      const before = await effects(), cap = budget(3000)
      await pause(500)
      const pending = port.intake.execute(intakeStatement, [JSON.stringify(intakeBinding), '{"block":true}', '7'.repeat(64)], signal(), cap)
      await fixture.waitBlocked('intake')
      assert.deepEqual(await pending, { status: 'unconfirmed' })
      assert.ok(performance.now() < cap.deadline + 2000)
      await fixture.absent(); assert.equal(await effects(), before); assert.equal(state().intake, 'idle')
    })
    await t.test('the same S1 cap bounds an actual deferred COMMIT and proves rollback', async () => {
      const before = await effects(), cap = budget(3000)
      await pause(500)
      const pending = port.intake.execute(intakeStatement, [JSON.stringify(intakeBinding), '{"commit_block":true}', '7'.repeat(64)], signal(), cap)
      await fixture.waitBlocked('intake', true)
      assert.equal(await effects(), before, 'the deferred COMMIT is still genuinely uncommitted')
      assert.deepEqual(await pending, { status: 'unconfirmed' })
      assert.ok(performance.now() < cap.deadline + 2000)
      await fixture.absent(); assert.equal(await effects(), before); assert.equal(state().intake, 'idle')
    })
    await t.test('a dropped real COMMIT frame is unconfirmed; no automatic second write', async () => {
      const before = Number(await effects())
      fixture.loseNextCommit()
      assert.deepEqual(await port.jobs.executeFixed(job({ lost: true }, 1000), signal()), { status: 'unconfirmed' })
      assert.equal(Number(await effects()), before + 1)
      assert.equal(fixture.snapshot().lost, 1)
      await fixture.absent(); assert.equal(state().jobs, 'idle')
    })
    await t.test('valid public HRS query joins real dual-channel loss under its original 750-ms cap', async () => {
      assert.equal(HRS1_LIMITS.publicMilliseconds, 750)
      const config = publicFailureFixture(), raw = { destinationCountryCode: 'DE', citizenshipCountryCodes: ['CH'] }
      const calls = { method: 0, intake: 0, jobs: 0, writer: 0, reader: 0, verifier: 0, producer: 0 }
      const caps: number[] = [], entered: number[] = []
      const methodExecutor: Ma1MethodSqlExecutor = { async readCurrent(request, activeSignal, cap) {
        calls.method++; assert.ok(cap); caps.push(cap.deadline); entered.push(performance.now())
        return port.method.readCurrent(request, activeSignal, cap)
      } }
      const resultExecutor = (kind: 'writer' | 'reader' | 'verifier'): Hrs1TerminalExecutor => ({ async executeFixed(request, activeSignal) {
        calls[kind]++; return port[kind].executeFixed(request, activeSignal)
      } })
      const publicJobs = createV3PostgresResultJobs({ binding, registry: config.registry, clock: config.clock, methodExecutor,
        intakeExecutor: { async execute(...args) { calls.intake++; return port.intake.execute(...args) } },
        jobsExecutor: { async executeFixed(...args) { calls.jobs++; return port.jobs.executeFixed(...args) } },
        producer: { async produce() { calls.producer++; return { status: 'failed', reason: 'unreachable' } } },
        result: { binding: config.binding, writerExecutor: resultExecutor('writer'), readerExecutor: resultExecutor('reader'),
          verifierExecutor: resultExecutor('verifier'), ids: () => ({ jobId: 'job3_' + '8'.repeat(32), operationId: 'op3_' + '9'.repeat(32) }) } })
      const before = Number(await effects()), previous = fixture.snapshot(), started = performance.now()
      let publishes = 0
      fixture.loseNextCommit(true)
      const answer = await publicJobs.query(raw).then(value => { publishes++; return value })
      const returned = performance.now(), settled = fixture.snapshot()
      assert.deepEqual(answer, { ok: false, reason: 'temporary_failure' })
      assert.equal(calls.method, 1, 'valid public composition reached the actual MA1 transport')
      assert.equal(caps.length, 1); assert.ok(caps[0]! > started && caps[0]! <= entered[0]! + 750)
      assert.equal(settled.local.calls.connect - previous.local.calls.connect, 2)
      assert.ok(settled.local.calls.auth > previous.local.calls.auth && settled.local.calls.query > previous.local.calls.query)
      assert.equal(settled.lost, previous.lost + 1, 'the actual MA1 COMMIT response was dropped')
      assert.equal(state().method, 'blocked_terminal')
      assert.deepEqual(settled.local.active, { connect: 0, auth: 0, query: 0, socket: 0 })
      assert.ok(settled.lastLossAt >= started && settled.lastLossAt <= returned && settled.local.lastCallbackAt <= returned)
      t.diagnostic(JSON.stringify({ case: 'HRS-public-dual-loss', businessCapMilliseconds: 750,
        remainingAtMethodMilliseconds: caps[0]! - entered[0]!, totalMilliseconds: returned - started,
        drainAfterLossMilliseconds: returned - settled.lastLossAt, overBusinessDeadlineMilliseconds: Math.max(0, returned - caps[0]!) }))
      assert.deepEqual(calls, { method: 1, intake: 0, jobs: 0, writer: 0, reader: 0, verifier: 0, producer: 0 })
      assert.deepEqual(await publicJobs.query(raw), { ok: false, reason: 'temporary_failure' })
      assert.deepEqual(await publicJobs.enqueueRule({}), { status: 'unavailable' })
      assert.deepEqual(await publicJobs.enqueueDiscovery({}), { status: 'unavailable' })
      assert.deepEqual(await publicJobs.workOnce({}), { status: 'unavailable' })
      assert.deepEqual(await publicJobs.workSelectedOnce('rule_research'), { status: 'unavailable' })
      assert.deepEqual(await publicJobs.monitorOnce(), { status: 'unavailable', outcomes: [] })
      await pause(30)
      assert.equal(publishes, 1, 'no later public completion')
      assert.deepEqual(fixture.snapshot().local, settled.local, 'all real local callbacks had already ended at return')
      assert.deepEqual(calls, { method: 1, intake: 0, jobs: 0, writer: 0, reader: 0, verifier: 0, producer: 0 })
      assert.equal(Number(await effects()), before, 'no publication or other write followed the unknown MA1 outcome')
      await fixture.absent() // Independent fixture observation, never a runtime receipt.
    })
    await t.test('simultaneous channel loss returns explicit remote unknown with no slot reuse', async () => {
      const before = Number(await effects()), started = performance.now()
      fixture.loseNextCommit(true)
      const reply = await port.jobs.executeFixed(job({ bothLost: true }, 1000), signal())
      assert.deepEqual(reply, { status: 'blocked_remote_unknown' })
      const returned = performance.now(), settled = fixture.snapshot()
      assert.equal(state().jobs, 'blocked_terminal')
      assert.deepEqual(settled.local.active, { connect: 0, auth: 0, query: 0, socket: 0 })
      assert.equal(Number(await effects()), before + 1)
      const lost = fixture.snapshot().lost
      assert.deepEqual(await port.jobs.executeFixed(job(), signal()), { status: 'blocked_remote_unknown' })
      assert.equal(Number(await effects()), before + 1)
      assert.equal(fixture.snapshot().lost, lost)
      await pause(30)
      assert.deepEqual(fixture.snapshot().local, settled.local, 'no locally owned callback outlives the negative result')
      t.diagnostic(JSON.stringify({ case: 'M04-dual-loss', totalMilliseconds: returned - started,
        drainAfterLossMilliseconds: returned - settled.lastLossAt }))
      // The fixture owner can stop its own cluster during final teardown. That
      // external test fact is deliberately not injected as a production receipt.
    })
    assert.equal(fixture.snapshot().unexpected, false)
  } finally {
    selected = null
    await fixture.dispose()
  }
})
