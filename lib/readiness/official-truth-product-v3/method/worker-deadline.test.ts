// Offline negative factory contracts. No real connection, accepted source or approval.
import assert from 'node:assert/strict'
import { performance } from 'node:perf_hooks'
import { test } from 'node:test'
import { createContentIdentityGraph } from '@/lib/readiness/official-truth-content-identity'
import { quellenRegistryErstellen } from '@/lib/readiness/source-registry'
import { createV3ContextIdentity, createV3WorkIdentity, readV3GlobalRuleContext } from '../contract'
import type { M04TerminalExecutor } from '../jobs/contract'
import { hrs1Clock, readHrs1Binding, type Hrs1TerminalExecutor } from '../result/contract'
import type { Hrs1SourceCustodyIssuer } from '../result/source-proof'
import { createV3PostgresResultJobs, type Ma1MethodSqlExecutor } from './authority-postgres'

type Budget = Readonly<{ deadline: number }>
const method = { methodId: 'deadline_fixture', revision: 1, methodDigest: 'a'.repeat(64), packageDigest: 'b'.repeat(64) }
const signal = () => new AbortController().signal
function deferred<T>() {
  let resolve!: (value: T) => void
  const promise = new Promise<T>(done => { resolve = done })
  return { promise, resolve }
}

/** Same finite negative fixture pattern as A3: .example profiles always refuse.
 * A real native-port call is required below, so invalid_config cannot pass. */
function fixture(options: {
  method?: Ma1MethodSqlExecutor['readCurrent']; jobs?: M04TerminalExecutor['executeFixed'];
} = {}) {
  const roles = ['primary', 'counter'] as const
  const source = (role: typeof roles[number]) => ({ sourceId: 'deadline-' + role,
    contentItemId: 'synthetic-visa', contentItemVersion: 1, representationId: 'synthetic-json',
    representationVersion: 1, identityProfileId: 'deadline-synthetic-profile', identityProfileVersion: 1 })
  const url = (role: typeof roles[number]) => 'https://deadline-' + role + '.example/visa'
  const created = quellenRegistryErstellen(roles.map(role => ({ sourceId: source(role).sourceId,
    sourceClass: 'official_authority', publisherName: 'Synthetic deadline publisher', authorityName: 'Synthetic deadline authority',
    domains: ['deadline-' + role + '.example'] })))
  assert.ok(created.ok); if (!created.ok) assert.fail('synthetic registry refused')
  const graph = createContentIdentityGraph(created.registry, roles.map(role => ({ sourceId: source(role).sourceId,
    contentItemId: 'synthetic-visa', contentItemVersion: 1, current: true, externalIdNamespace: 'synthetic',
    externalContentId: 'deadline-visa', expectedPublisherIds: ['synthetic'], expectedAuthorityIds: ['synthetic'] })),
  roles.map(role => ({ ...source(role), current: true, requestUrls: [url(role)], expectedFinalUrl: url(role),
    expectedMediaType: 'application/json', expectedLocale: null, expectedSchema: null })),
  [{ identityProfileId: 'deadline-synthetic-profile', identityProfileVersion: 1, current: true,
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
  const binding = readHrs1Binding({ ...method, schema: 1, qualificationScope: 'global_context', context: context.value,
    contextKey: identity.value.contextKey, factKind: 'requirement_effect', dataMode: 'synthetic_test', legalTimeZone: 'Europe/Berlin',
    activeFrom: '2000-01-01T00:00:00.000Z', activeUntilExclusive: '2099-12-31T00:00:00.000Z',
    sourceMaxAgeMilliseconds: 300000, projectionMaxAgeMilliseconds: 60000, monitorIntervalMilliseconds: 100,
    monitorLeaseMilliseconds: 5000, attemptLimit: 3, sources: roles.map(role => ({ source: source(role), canonicalUrl: url(role),
      contentType: 'application/json', executableDigest: 'c'.repeat(64), qualificationDigest: 'd'.repeat(64), role })) }, registry)
  assert.ok(binding)
  const calls: { channel: 'method' | 'jobs'; budget: Budget; signal: AbortSignal }[] = []
  const state = { unexpected: 0, settled: 0 }
  const closed = Object.freeze<Hrs1TerminalExecutor>({ async executeFixed() { state.unexpected++; return { status: 'unavailable' } } })
  const issuer = Object.freeze<Hrs1SourceCustodyIssuer>({
    async inspect() { state.unexpected++; return null }, async finalize() { state.unexpected++; return null },
    async reprove() { state.unexpected++; return null }, async reopen() { state.unexpected++; return null },
    async observe() { state.unexpected++; return { status: 'unavailable' } }, async reproveObservation() { state.unexpected++; return null },
  })
  const facade = createV3PostgresResultJobs({ binding: method, registry,
    clock() { const clock = hrs1Clock('2026-11-12T20:00:00.000Z', binding.legalTimeZone); assert.ok(clock); return clock },
    methodExecutor: Object.freeze<Ma1MethodSqlExecutor>({ async readCurrent(request, signal, budget) {
      assert.ok(budget); calls.push({ channel: 'method', budget, signal })
      try { return options.method ? await options.method(request, signal, budget) : { status: 'unavailable' } }
      finally { state.settled++ }
    } }),
    jobsExecutor: Object.freeze<M04TerminalExecutor>({ async executeFixed(request, signal) {
      calls.push({ channel: 'jobs', budget: request.budget, signal })
      try { return options.jobs ? await options.jobs(request, signal) : { status: 'unavailable' } }
      finally { state.settled++ }
    } }),
    intakeExecutor: { async execute() { state.unexpected++; return { status: 'unavailable' } } },
    producer: { async produce() { state.unexpected++; return { status: 'failed', reason: 'unreachable' } } },
    result: { binding, writerExecutor: closed, readerExecutor: closed, verifierExecutor: closed, fixtureIssuer: issuer,
      ids: () => ({ jobId: 'job3_' + '1'.repeat(32), operationId: 'op3_' + '2'.repeat(32) }) },
  })
  return { facade, binding, calls, state }
}

test('optional worker and monitor caps only shorten the real HRS factory', { timeout: 15000 }, async t => {
  let now = 100_000
  t.mock.method(performance, 'now', () => now)
  await t.test('valid negative configuration reaches actual native ports under the same shorter cap', async () => {
    const h = fixture(), cap = Object.freeze({ deadline: now + 2_000 })
    await h.facade.monitorOnce(signal(), cap)
    assert.equal(h.calls.length, 1); assert.equal(h.calls[0]!.channel, 'method')
    assert.equal(h.calls[0]!.budget.deadline, cap.deadline); assert.ok(Object.isFrozen(h.calls[0]!.budget))
    h.calls.length = 0
    await h.facade.workSelectedOnce('combination_discovery', signal(), cap)
    assert.ok(h.calls.length > 0); assert.equal(h.calls[0]!.channel, 'jobs')
    assert.equal(h.calls[0]!.budget.deadline, cap.deadline); assert.ok(Object.isFrozen(h.calls[0]!.budget))
    assert.equal(h.state.unexpected, 0)
  })
  await t.test('invalid, expired, extra-field and accessor caps fail before native allocation', async () => {
    const h = fixture(); let getters = 0
    const accessor = Object.defineProperty({}, 'deadline', { enumerable: true, get() { getters++; return now + 5000 } })
    for (const raw of [null, {}, [], { deadline: NaN }, { deadline: Infinity }, { deadline: -Infinity },
      { deadline: now }, { deadline: now - 1 }, { deadline: '200000' },
      { deadline: now + 5000, override: true }, Object.create({ deadline: now + 5000 }), accessor]) {
      const cap = raw as Budget
      assert.equal((await h.facade.monitorOnce(signal(), cap)).status, 'unavailable')
      assert.equal((await h.facade.workSelectedOnce('rule_research', signal(), cap)).status, 'unavailable')
    }
    assert.equal(getters, 0); assert.equal(h.calls.length, 0); assert.equal(h.state.unexpected, 0)
  })
  await t.test('larger caps and the old optional-free calls preserve original smaller limits', async () => {
    const h = fixture(), cap = Object.freeze({ deadline: now + 60_000 })
    await h.facade.monitorOnce(signal(), cap)
    await h.facade.workSelectedOnce('rule_research', signal(), cap)
    assert.ok(h.calls.some(call => call.channel === 'method')); assert.ok(h.calls.some(call => call.channel === 'jobs'))
    for (const call of h.calls) assert.ok(call.budget.deadline <= now + 5000)
    h.calls.length = 0
    await h.facade.monitorOnce(signal())
    await h.facade.workSelectedOnce('rule_research', signal())
    assert.ok(h.calls.some(call => call.channel === 'method')); assert.ok(h.calls.some(call => call.channel === 'jobs'))
    assert.equal(h.state.unexpected, 0)
  })
  await t.test('pre-aborted outer signal starts neither worker nor monitor effects', async () => {
    const h = fixture(), controller = new AbortController(); controller.abort()
    assert.equal((await h.facade.monitorOnce(controller.signal, { deadline: now + 5000 })).status, 'interrupted')
    assert.equal((await h.facade.workSelectedOnce('rule_research', controller.signal, { deadline: now + 5000 })).status, 'unavailable')
    assert.equal(h.calls.length, 0)
  })
  await t.test('captured deadline cannot be extended during a real pending native promise', async () => {
    const entered = deferred<void>(), gate = deferred<void>()
    const h = fixture({ async jobs() { entered.resolve(); await gate.promise; return { status: 'unavailable' } } })
    const cap = { deadline: now + 2000 }, original = cap.deadline
    let answered = false
    const joined = h.facade.workSelectedOnce('rule_research', signal(), cap).then(result => { answered = true; return result })
    try {
      await entered.promise; cap.deadline = now + 60_000; now = original + 1
      await Promise.resolve(); assert.equal(answered, false); assert.equal(h.state.settled, 0)
      assert.equal(h.calls[0]!.budget.deadline, original); assert.ok(Object.isFrozen(h.calls[0]!.budget))
    } finally { gate.resolve(); await joined }
    assert.equal((await joined).status, 'unconfirmed'); assert.equal(h.state.settled, 1)
    assert.equal(h.calls.length, 1); assert.equal(h.state.unexpected, 0)
  })
  await t.test('monitor abort joins its original MA1 call before returning its negative answer', async () => {
    const entered = deferred<void>(), gate = deferred<void>(), controller = new AbortController()
    const h = fixture({ async method() { entered.resolve(); await gate.promise; return { status: 'unavailable' } } })
    let answered = false
    const joined = h.facade.monitorOnce(controller.signal, { deadline: now + 2000 }).then(result => { answered = true; return result })
    try {
      await entered.promise; controller.abort(); await Promise.resolve()
      assert.equal(answered, false); assert.equal(h.state.settled, 0); assert.equal(h.calls[0]!.signal.aborted, true)
    } finally { gate.resolve(); await joined }
    assert.equal((await joined).status, 'interrupted'); assert.equal(h.state.settled, 1)
    assert.equal(h.calls.length, 1); assert.equal(h.state.unexpected, 0)
  })
  await t.test('query keeps its 750ms cap and original workOnce keeps the existing fixed-effect cap', async () => {
    const original = process.env.GITHUB_ACTIONS
    process.env.GITHUB_ACTIONS = 'false'
    try {
      const h = fixture()
      await h.facade.query({ destinationCountryCode: 'DE', citizenshipCountryCodes: ['CH'] }, signal())
      assert.equal(h.calls.length, 1); assert.equal(h.calls[0]!.channel, 'method')
      assert.equal(h.calls[0]!.budget.deadline, now + 750)
      h.calls.length = 0
      const identity = createV3WorkIdentity({ context: h.binding.context,
        method: { methodId: method.methodId, revision: method.revision }, factKind: 'requirement_effect', researchReason: { status: 'missing' } })
      if (!identity.ok) assert.fail(identity.reason)
      await h.facade.workOnce({ operationId: 'op3_' + '3'.repeat(32), jobKey: identity.value.jobKey,
        leaseId: 'lease3_' + '4'.repeat(32), leaseMilliseconds: 30000 }, signal())
      assert.ok(h.calls.length > 0); assert.equal(h.calls[0]!.channel, 'jobs'); assert.equal(h.calls[0]!.budget.deadline, now + 5000)
      assert.equal(h.state.unexpected, 0)
    } finally {
      if (original === undefined) delete process.env.GITHUB_ACTIONS
      else process.env.GITHUB_ACTIONS = original
    }
  })
  await t.test('synthetic GitHub CI query propagates the fixed 2000ms cap to the actual method operation', async () => {
    const original = process.env.GITHUB_ACTIONS
    process.env.GITHUB_ACTIONS = 'true'
    try {
      const h = fixture()
      await h.facade.query({ destinationCountryCode: 'DE', citizenshipCountryCodes: ['CH'] }, signal())
      assert.equal(h.calls.length, 1); assert.equal(h.calls[0]!.channel, 'method')
      assert.equal(h.calls[0]!.budget.deadline, now + 2000)
      assert.equal(h.state.unexpected, 0)
    } finally {
      if (original === undefined) delete process.env.GITHUB_ACTIONS
      else process.env.GITHUB_ACTIONS = original
    }
  })
})
