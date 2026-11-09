import assert from 'node:assert/strict'
import { readFileSync } from 'node:fs'
import { describe, test } from 'node:test'
import { createV3CombinationDiscoveryIdentity } from '../contract'
import { createV3VisitorQuery, prepareV3VisitorProjection, queryOfficialTruthVisitorV3,
  type V3VisitorQueryResult } from './query'
import { presentV3VisitorAnswer, v3ConditionText } from './presentation'
import { syntheticV3Fixture, SYNTHETIC_CLOCK, SYNTHETIC_INPUT } from './test-fixtures'

function answer(result: V3VisitorQueryResult) {
  if (!result.ok) assert.fail(result.reason)
  return result.answer
}
const oneInput = { destinationCountryCode: 'DE', citizenshipCountryCodes: ['CH'] }
function deferred<T>() {
  let resolve!: (value: T) => void
  const promise = new Promise<T>((done) => { resolve = done })
  return { promise, resolve }
}

describe('U1 dormant reader, prepared projections and separate citizenships', () => {
  test('production seam has honest unavailable cells and rejects private/unexpected input', async () => {
    const read = answer(await queryOfficialTruthVisitorV3(SYNTHETIC_INPUT))
    assert.deepEqual(read.response.cells.map((cell) => cell.results[0].status), ['unavailable', 'unavailable'])
    for (const extra of [{ passportNumber: 'PRIVATE' }, { mrz: 'PRIVATE' }, { photo: 'PRIVATE' }, { tripId: 'PRIVATE' }]) {
      assert.deepEqual(await queryOfficialTruthVisitorV3({ ...SYNTHETIC_INPUT, ...extra }), { ok: false, reason: 'invalid_input' })
    }
    assert.equal((await queryOfficialTruthVisitorV3({ destinationCountryCode: 'ZZ', citizenshipCountryCodes: ['CH'] })).ok, false)
  })
  test('real prepared hit and acknowledged miss remain separate; source time is original', async () => {
    const fixture = syntheticV3Fixture(), query = createV3VisitorQuery(fixture.ports)
    const result = answer(await query(SYNTHETIC_INPUT))
    assert.deepEqual(result.response.cells.map((cell) => cell.results[0].status), ['accepted', 'pending'])
    assert.equal(fixture.counts.reads, 2)
    assert.equal(fixture.jobs.size, 1)
    assert.equal(fixture.counts.confirm, 1)
    const view = presentV3VisitorAnswer(result)
    const accepted = view.cells[0].results[0]
    assert.equal(view.synthetic, true)
    assert.equal(accepted.status, 'accepted')
    if (accepted.status !== 'accepted') assert.fail('expected projection')
    assert.match(accepted.checkedAtText, /Stand vom 09\.11\.2026, 08:00 UTC/)
    assert.equal(accepted.source.href, 'https://destination.example/synthetic-test-publication')
    assert.equal(accepted.source.label, 'Fiktive Testbehörde')
    assert.match(accepted.conditions.join(' '), /höchstens 5 Tage/)
    assert.match(accepted.conditions.join(' '), /Ein- und Ausreisetag zählen mit/)
    assert.equal(view.cells[1].results[0].title, 'Wird geprüft')
  })
  test('preparation checks rule/decision, expiry and exact source pin without publishing', () => {
    const f = syntheticV3Fixture()
    const fields = { rule: f.accepted.rule, decision: f.accepted.decision, builtAt: '2026-11-09T08:03:00.000Z',
      sourceFreshUntil: '2026-11-09T09:00:00.000Z', expiresAt: '2026-11-09T08:30:00.000Z' }
    assert.equal(prepareV3VisitorProjection(fields, f.ports.registry, SYNTHETIC_CLOCK).status, 'prepared')
    assert.equal(prepareV3VisitorProjection({ ...fields, expiresAt: SYNTHETIC_CLOCK.now }, f.ports.registry, SYNTHETIC_CLOCK).status, 'invalid')
    assert.equal(prepareV3VisitorProjection({ ...fields, decision: { ...f.accepted.decision, conclusion: 'primary_unclear' } }, f.ports.registry, SYNTHETIC_CLOCK).status, 'invalid')
    assert.equal(prepareV3VisitorProjection(fields, { ...f.ports.registry, contentIdentity: undefined }, SYNTHETIC_CLOCK).status, 'invalid')
    assert.equal(f.counts.queue, 0)
  })
  test('distinct contextual rules sharing a citizenship remain distinct and complete', async () => {
    const f = syntheticV3Fixture(), business = f.make(f.context('CH', 'business')).projection
    f.cache.set(business.rule.subject.contextKey, business)
    const query = createV3VisitorQuery({ ...f.ports, coverage: { targets: async () => ({ problem: null,
      zeilen: [{ context: f.context(), factKind: 'blank_passport_pages' }, { context: f.context('CH', 'business'), factKind: 'blank_passport_pages' }] }) } })
    const result = answer(await query(oneInput))
    assert.deepEqual(result.response.cells[0].results.map((item) => item.status), ['accepted', 'accepted'])
    const view = presentV3VisitorAnswer(result)
    assert.equal(view.cells[0].results.length, 2)
    assert.match(JSON.stringify(view), /Geschäftsreise/)
    assert.match(JSON.stringify(view), /Besuch/)
    assert.equal(f.counts.confirm, 1, 'all positives use one final confirmation batch')
  })
})

describe('U1 no false empty, no fake pending and bounded queue acknowledgements', () => {
  test('a failed read is an error and never queues research; raw errors are absent', async () => {
    const f = syntheticV3Fixture()
    const query = createV3VisitorQuery({ ...f.ports, cache: { read: async () => ({ zeilen: null,
      problem: { status: 503, message: 'PRIVATE payload and secret MUST NOT LEAK' } }) } })
    const result = answer(await query(SYNTHETIC_INPUT))
    assert.deepEqual(result.response.cells.map((cell) => cell.results[0].status), ['error', 'error'])
    assert.equal(f.counts.queue, 0)
    assert.equal(JSON.stringify(presentV3VisitorAnswer(result)).includes('PRIVATE'), false)
  })
  test('unbound queue is unavailable; thrown/unknown enqueue never becomes pending', async () => {
    for (const queue of [null, { enqueue: async () => ({ status: 'unconfirmed' as const }) },
      { enqueue: async () => { throw new Error('PRIVATE') } }]) {
      const f = syntheticV3Fixture()
      const result = answer(await createV3VisitorQuery({ ...f.ports, queue })({ destinationCountryCode: 'DE', citizenshipCountryCodes: ['RS'] }))
      assert.notEqual(result.response.cells[0].results[0].status, 'pending')
    }
  })
  test('queue confirmation must bind exact job kind/context/method and active state', async () => {
    const f = syntheticV3Fixture(), good = await createV3VisitorQuery(f.ports)(SYNTHETIC_INPUT)
    assert.equal(good.ok, true)
    const job = [...f.jobs.values()][0]
    for (const changed of [{ ...job, jobKey: `research-job:v3:${'0'.repeat(64)}` },
      { ...job, method: { ...job.method, revision: 2 } },
      { ...job, state: 'succeeded', attempt: 1, resultDecisionRef: f.accepted.decision.reference }]) {
      const query = createV3VisitorQuery({ ...f.ports, queue: { enqueue: async () => ({ status: 'confirmed', record: changed }) } })
      const result = answer(await query({ destinationCountryCode: 'DE', citizenshipCountryCodes: ['RS'] }))
      assert.equal(result.response.cells[0].results[0].status, 'error')
    }
  })
  test('concurrent misses are admitted through the atomic test queue without duplicate jobs', async () => {
    const f = syntheticV3Fixture(), query = createV3VisitorQuery(f.ports)
    const results = await Promise.all(Array.from({ length: 6 }, () => query({ destinationCountryCode: 'DE', citizenshipCountryCodes: ['RS'] })))
    assert.equal(f.jobs.size, 1)
    const keys = results.map((result) => answer(result).response.cells[0].results[0]).map((result) => result.status === 'pending' ? result.jobKey : '')
    assert.equal(new Set(keys).size, 1)
    assert.ok(keys[0].startsWith('research-job:v3:'))
  })
  test('unknown combination obtains neutral discovery ACK without an invented context', async () => {
    const f = syntheticV3Fixture()
    const result = answer(await createV3VisitorQuery(f.ports)({ destinationCountryCode: 'FR', citizenshipCountryCodes: ['CH', 'RS'] }))
    for (const cell of result.response.cells) {
      const pending = cell.results[0]
      assert.equal(pending.status, 'pending')
      if (pending.status !== 'pending' || pending.jobKind !== 'combination_discovery') assert.fail('neutral discovery expected')
      assert.equal(pending.identity.destinationCountryCode, 'FR')
      assert.equal(pending.identity.citizenshipCountryCode, cell.citizenshipCountryCode)
      assert.match(pending.jobKey, /^combination-discovery-job:v3:/)
      assert.equal('context' in pending.identity, false)
    }
    assert.equal(f.discoveryJobs.size, 2)
    assert.equal(f.counts.reads, 0)
    assert.equal(f.jobs.size, 0)
  })
  test('unknown-pair concurrent requests deduplicate only the same pair and method', async () => {
    const f = syntheticV3Fixture(), query = createV3VisitorQuery(f.ports)
    const results = await Promise.all(Array.from({ length: 6 }, () => query({ destinationCountryCode: 'FR', citizenshipCountryCodes: ['CH'] })))
    const keys = results.map((result) => answer(result).response.cells[0].results[0]).map((result) => result.status === 'pending' ? result.jobKey : '')
    assert.equal(new Set(keys).size, 1)
    assert.match(keys[0], /^combination-discovery-job:v3:/)
    assert.equal(f.discoveryJobs.size, 1)
    await query({ destinationCountryCode: 'FR', citizenshipCountryCodes: ['RS'] })
    await query({ destinationCountryCode: 'AT', citizenshipCountryCodes: ['CH'] })
    assert.equal(f.discoveryJobs.size, 3)
  })
  test('coverage failure never becomes discovery, and unknown/lost ACK never becomes pending', async () => {
    const f = syntheticV3Fixture(), input = { destinationCountryCode: 'FR', citizenshipCountryCodes: ['CH'] }
    const failedRead = answer(await createV3VisitorQuery({ ...f.ports, coverage: { targets: async () => ({
      zeilen: null, problem: { status: 503, message: 'PRIVATE' } }) } })(input))
    assert.equal(failedRead.response.cells[0].results[0].status, 'error')
    assert.equal(f.discoveryJobs.size, 0)
    for (const discoveryQueue of [null, { enqueue: async () => ({ status: 'unconfirmed' as const }) },
      { enqueue: async () => { throw new Error('PRIVATE') } }]) {
      const result = answer(await createV3VisitorQuery({ ...f.ports, discoveryQueue })(input))
      assert.notEqual(result.response.cells[0].results[0].status, 'pending')
    }
    const lost = await createV3VisitorQuery({ ...f.ports, discoveryQueue: { enqueue: async (...args) => {
      await f.ports.discoveryQueue!.enqueue(...args)
      return { status: 'unconfirmed' }
    } } })(input)
    assert.equal(answer(lost).response.cells[0].results[0].status, 'error')
    assert.equal(f.discoveryJobs.size, 1, 'an actually persisted job is not falsely acknowledged')
  })
  test('discovery ACK rejects swapped rule jobs, wrong pair/method/namespace and finished work', async () => {
    const f = syntheticV3Fixture(), input = { destinationCountryCode: 'FR', citizenshipCountryCodes: ['CH'] }
    await createV3VisitorQuery(f.ports)(SYNTHETIC_INPUT)
    await createV3VisitorQuery(f.ports)(input)
    const job = [...f.discoveryJobs.values()][0]
    const otherPair = createV3CombinationDiscoveryIdentity({ destinationCountryCode: 'AT', citizenshipCountryCode: 'CH', method: f.ports.method })
    const otherMethod = createV3CombinationDiscoveryIdentity({ destinationCountryCode: 'FR', citizenshipCountryCode: 'CH', method: { ...f.ports.method, revision: 2 } })
    assert.ok(otherPair.ok && otherMethod.ok)
    if (!otherPair.ok || !otherMethod.ok) assert.fail('fixtures')
    for (const record of [[...f.jobs.values()][0], { ...job, identity: otherPair.value }, { ...job, identity: otherMethod.value },
      { ...job, identity: { ...job.identity, jobKey: [...f.jobs.keys()][0] } },
      { ...job, state: 'succeeded', attempt: 1, resultDiscoveryRef: `combination-discovery-result:v3:${'a'.repeat(64)}` }]) {
      const result = answer(await createV3VisitorQuery({ ...f.ports, discoveryQueue: { enqueue: async () => ({ status: 'confirmed', record }) } })(input))
      assert.equal(result.response.cells[0].results[0].status, 'error')
    }
    const reverse = answer(await createV3VisitorQuery({ ...f.ports, queue: { enqueue: async () => ({ status: 'confirmed', record: job }) } })(SYNTHETIC_INPUT))
    assert.equal(reverse.response.cells[1].results[0].status, 'error')
  })
  test('method revoked during discovery ACK suppresses pending and does not publish a rule', async () => {
    const f = syntheticV3Fixture()
    const result = answer(await createV3VisitorQuery({ ...f.ports, discoveryQueue: { enqueue: async (...args) => {
      const queued = await f.ports.discoveryQueue!.enqueue(...args); f.revoke(); return queued
    } } })({ destinationCountryCode: 'FR', citizenshipCountryCodes: ['CH'] }))
    assert.equal(result.response.cells[0].results[0].status, 'unavailable')
    assert.equal(Object.keys(result.sources).length, 0)
  })
  test('duplicate/oversized coverage and multiple cache versions are rejected without slicing', async () => {
    const f = syntheticV3Fixture(), target = { context: f.context(), factKind: 'blank_passport_pages' as const }
    for (const zeilen of [[target, target], Array(17).fill(target)]) {
      const result = answer(await createV3VisitorQuery({ ...f.ports, coverage: { targets: async () => ({ zeilen, problem: null }) } })(oneInput))
      assert.equal(result.response.cells[0].results[0].status, 'error')
    }
    const result = answer(await createV3VisitorQuery({ ...f.ports, cache: { read: async () => ({
      zeilen: [f.accepted.projection, f.accepted.projection], problem: null }) } })(oneInput))
    assert.equal(result.response.cells[0].results[0].status, 'error')
  })
})

describe('U1 current authority, method, expiry, source and abort boundaries', () => {
  test('a withdrawn or conflicting accepted pointer suppresses cached positive content', async () => {
    for (const state of ['withdrawn', 'conflict', 'unavailable'] as const) {
      const f = syntheticV3Fixture(); f.setState(state)
      const result = answer(await createV3VisitorQuery(f.ports)(oneInput))
      assert.notEqual(result.response.cells[0].results[0].status, 'accepted')
      assert.equal(Object.keys(result.sources).length, 0)
      assert.equal(f.counts.queue, 0)
    }
  })
  test('shape-valid altered cache bytes cannot create a current projection proof', async () => {
    const f = syntheticV3Fixture(), original = f.accepted.projection
    f.cache.set(original.rule.subject.contextKey, { ...original, rule: { ...original.rule,
      subject: { ...original.rule.subject, fact: { schema: 1, fact: { kind: 'blank_passport_pages', minimumPages: 8 } } } } })
    const result = answer(await createV3VisitorQuery(f.ports)(oneInput))
    assert.notEqual(result.response.cells[0].results[0].status, 'accepted')
  })
  test('mismatched current binding or counterfeit receipt is rejected', async () => {
    const f = syntheticV3Fixture()
    const mismatch = createV3VisitorQuery({ ...f.ports, current: { ...f.ports.current,
      reprove: async (binding) => ({ status: 'current', binding: { ...binding, revision: binding.revision + 1 }, receipt: { syntheticOnly: true } }) } })
    assert.equal(answer(await mismatch(oneInput)).response.cells[0].results[0].status, 'error')
    const fake = createV3VisitorQuery({ ...f.ports, current: { ...f.ports.current,
      reprove: async (binding) => ({ status: 'current', binding, receipt: { syntheticOnly: true } }) } })
    assert.equal(answer(await fake(oneInput)).response.cells[0].results[0].status, 'unavailable')
  })
  test('method revoked while awaiting cache never produces accepted or pending content', async () => {
    const f = syntheticV3Fixture(), block = deferred<void>()
    const readStarted = deferred<void>()
    const query = createV3VisitorQuery({ ...f.ports, cache: { read: async (key, signal) => {
      readStarted.resolve(); await block.promise; return f.ports.cache.read(key, signal)
    } } })
    const pending = query(SYNTHETIC_INPUT)
    await readStarted.promise; f.revoke(); block.resolve()
    const result = answer(await pending)
    assert.ok(result.response.cells.every((cell) => cell.results.every((item) => item.status === 'unavailable')))
    assert.equal(f.jobs.size, 0)
  })
  test('final batch rechecks a method revoked after the earlier authority reproof', async () => {
    const f = syntheticV3Fixture()
    const query = createV3VisitorQuery({ ...f.ports, current: { ...f.ports.current,
      confirmBatch: async (...args) => { f.revoke(); return f.ports.current.confirmBatch(...args) } } })
    const result = answer(await query(SYNTHETIC_INPUT))
    assert.deepEqual(result.response.cells.map((cell) => cell.results[0].status), ['unavailable', 'unavailable'])
  })
  test('expiry crossing an awaited final confirmation is rechecked with the actual end clock', async () => {
    const f = syntheticV3Fixture()
    const query = createV3VisitorQuery({ ...f.ports, current: { ...f.ports.current,
      confirmBatch: async (...args) => {
        const confirmed = await f.ports.current.confirmBatch(...args)
        f.setClock({ ...SYNTHETIC_CLOCK, now: f.accepted.projection.expiresAt })
        return confirmed
      } } })
    const result = answer(await query(oneInput))
    assert.deepEqual(result.response.cells[0].results[0], { status: 'unavailable', reason: 'expired' })
    assert.equal(Object.keys(result.sources).length, 0)
  })
  test('changed canonical source pin suppresses the corresponding display entry', async () => {
    const f = syntheticV3Fixture()
    const identity = f.ports.registry.contentIdentity
    assert.ok(identity)
    const result = answer(await createV3VisitorQuery({ ...f.ports, registry: { ...f.ports.registry,
      contentIdentity: { ...identity, representations: identity.representations.map((item) => ({ ...item, representationVersion: 2 })) } } })(oneInput))
    assert.notEqual(result.response.cells[0].results[0].status, 'accepted')
    assert.equal(Object.keys(result.sources).length, 0)
  })
  test('caller cancellation ends a stuck read without a successful answer or a research job', async () => {
    const f = syntheticV3Fixture(), started = deferred<void>(), controller = new AbortController()
    const query = createV3VisitorQuery({ ...f.ports, cache: { read: async () => { started.resolve(); return new Promise(() => {}) } } })
    const pending = query(oneInput, controller.signal)
    await started.promise; controller.abort()
    assert.deepEqual(await pending, { ok: false, reason: 'aborted' })
    assert.equal(f.jobs.size, 0)
  })
  test('invalid input triggers no port and runtime imports no test fixtures or provider', async () => {
    const f = syntheticV3Fixture()
    let reads = 0
    const query = createV3VisitorQuery({ ...f.ports, coverage: { targets: async () => { reads += 1; throw new Error('never') } } })
    assert.equal((await query({ ...oneInput, passportPhoto: 'PRIVATE' })).ok, false)
    assert.equal(reads, 0)
    const code = readFileSync(new URL('./query.ts', import.meta.url), 'utf8')
    assert.equal(/from ['"][^'"]*(?:test-fixtures|supabase|database-server)/.test(code), false)
    assert.equal(/\bfetch\s*\(/.test(code), false)
  })
  test('conditional display retains every disjunction, negation and precise counting rule', () => {
    const text = v3ConditionText({ op: 'any', operands: [
      { op: 'not', operand: { op: 'atomic', predicate: { kind: 'travel_purpose', purpose: 'work' } } },
      { op: 'atomic', predicate: { kind: 'planned_stay_duration', comparison: 'more_than', duration: { value: 2, unit: 'months' }, counting: 'calendar_dates_exit_exclusive' } },
    ] })
    assert.match(text, /NICHT/); assert.match(text, /ODER/); assert.match(text, /länger als 2 Monate/); assert.match(text, /Ausreisetag zählt nicht mit/)
  })
})
