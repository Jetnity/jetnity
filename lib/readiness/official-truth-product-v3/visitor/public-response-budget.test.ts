import assert from 'node:assert/strict'
import { test } from 'node:test'
import { schema2DatenPruefen, type RegulierungsAusdruckV2 } from '@/lib/readiness/regulierungs-anwendbarkeit'
import { OFFICIAL_TRUTH_V3_LIMITS, OFFICIAL_TRUTH_V3_VISITOR_RESPONSE_LIMITS,
  readV3PublicProjectionRecord, readV3PublicResponseRecord, readV3ResearchProposal } from '../contract'
import { readV3RetainableProposal } from '../storage/proposal-bytes'
import { createV3VisitorQuery, type V3ProjectionBinding } from './query'
import { presentV3VisitorAnswer } from './presentation'
import { v3CustomerInformationCoverage } from './coverage-presentation'
import { publicResponseFixture, publicResponseMeasure } from './public-response-test-fixtures'

const one = publicResponseFixture()
const two = publicResponseFixture(['CH', 'GB'])
const five = publicResponseFixture(['CH', 'DE', 'FR', 'GB', 'US'])

test('complete 26-topic overviews retain all 27 facts for one, two and five citizenships', async t => {
  for (const fixture of [one, two, five]) {
    const f = await fixture, measured = publicResponseMeasure(f.answer.response)
    const parsed = readV3PublicResponseRecord(f.answer.response, f.registry, f.clock)
    assert.ok(parsed.ok)
    assert.deepEqual(parsed.value, f.answer.response)
    for (const cell of presentV3VisitorAnswer(f.answer).cells) {
      assert.equal(cell.results.length, 27)
      const topics = v3CustomerInformationCoverage(cell.results).groups.flatMap(group => group.topics)
      assert.equal(topics.length, 26)
      assert.ok(topics.every(topic => topic.results.length || topic.related.length))
    }
    if (f.answer.response.cells.length > 1) {
      assert.ok(measured.bytes > OFFICIAL_TRUTH_V3_LIMITS.payloadBytes)
      assert.equal(schema2DatenPruefen(f.answer.response), 'bound_exceeded', 'single-record preflight remains unchanged')
    }
    if (f.answer.response.cells.length === 5) assert.ok(measured.nodes > OFFICIAL_TRUTH_V3_LIMITS.payloadNodes)
    t.diagnostic(JSON.stringify({ citizenships: f.answer.response.cells.length, response: measured,
      withSources: publicResponseMeasure(f.answer), view: publicResponseMeasure(presentV3VisitorAnswer(f.answer)),
      sourcePlan: publicResponseMeasure(f.plan) }))
  }
})

test('normal visitor query completes the full multi-citizenship batch after current-pointer confirmation', async () => {
  const f = await two, all = f.answer.response.cells.flatMap(cell => cell.results.flatMap(result =>
    result.status === 'accepted' ? [result.projection] : []))
  const byRef = new Map(all.map(projection => [projection.reference, projection]))
  const method = all[0]!.rule.method, approval = Object.freeze({ synthetic: 'method-receipt' })
  const receipts = new Map<object, V3ProjectionBinding>()
  let confirmations = 0
  const query = createV3VisitorQuery({ registry: f.registry, method, clock: () => f.clock, dataMode: 'synthetic_test',
    methodAuthority: { async resolveCurrent() { return { status: 'approved', receipt: approval } },
      async reproveAtCommit(receipt) { assert.equal(receipt, approval); return { status: 'current' } } },
    coverage: { async targets(input) { return { problem: null, zeilen: all.filter(projection =>
      projection.rule.subject.context.scope.citizenship.countryCodes[0] === input.citizenshipCountryCode)
      .map(projection => ({ context: projection.rule.subject.context, factKind: projection.rule.subject.fact.fact.kind })) } } },
    cache: { async read(key) { return { problem: null, zeilen: all.filter(projection =>
      projection.rule.subject.contextKey === key.contextKey && projection.rule.subject.fact.fact.kind === key.factKind) } } },
    current: { async reprove(binding) {
      assert.ok(byRef.has(binding.projectionRef))
      const receipt = Object.freeze({ synthetic: binding.projectionRef }); receipts.set(receipt, binding)
      return { status: 'current', binding, receipt }
    }, async confirmBatch(items, methodReceipt) {
      assert.equal(methodReceipt, approval)
      assert.equal(items.length, 54)
      for (const item of items) assert.deepEqual(receipts.get(item.receipt), item.binding)
      confirmations++
      return { status: 'confirmed', currentProjectionRefs: items.map(item => item.binding.projectionRef) }
    } }, queue: null, discoveryQueue: null, ids() { assert.fail('a prepared read must not enqueue') },
  })
  const result = await query(f.answer.response.input)
  assert.ok(result.ok)
  assert.equal(confirmations, 1)
  assert.deepEqual(result.answer, f.answer)
})

test('the full declared 5 × 64 result inventory is accepted without slicing or dropping sources', async () => {
  const f = await five
  const projections = f.answer.response.input.citizenshipCountryCodes.map(country =>
    Array.from({ length: OFFICIAL_TRUTH_V3_LIMITS.resultsPerCitizenship }, (_, index) => {
      const row = f.rows[index % f.rows.length]!
      return f.projectionFor(row.context, row.fact, country, index)
    }))
  const answer = f.responseWith(projections)
  const result = readV3PublicResponseRecord(answer.response, f.registry, f.clock)
  assert.ok(result.ok)
  assert.deepEqual(result.value.cells.map(cell => cell.results.length), [64, 64, 64, 64, 64])
  assert.equal(Object.keys(answer.sources).length, 320)
  const measured = publicResponseMeasure(result.value)
  assert.ok(measured.bytes < OFFICIAL_TRUTH_V3_VISITOR_RESPONSE_LIMITS.payloadBytes)
  assert.ok(measured.nodes < OFFICIAL_TRUTH_V3_VISITOR_RESPONSE_LIMITS.payloadNodes)
  const expectedParts = 5 * 64 + 5 + 1
  assert.equal(OFFICIAL_TRUTH_V3_VISITOR_RESPONSE_LIMITS.payloadBytes, expectedParts * 65_536 + 5)
  assert.equal(OFFICIAL_TRUTH_V3_VISITOR_RESPONSE_LIMITS.payloadNodes, expectedParts * 8192)
})

test('collection wrappers do not consume the unchanged individual projection depth budget', async () => {
  const f = await one, row = f.rows[0]!, context = structuredClone(row.context)
  let expression: RegulierungsAusdruckV2 = { op: 'atomic', predicate: { kind: 'travel_purpose', purpose: 'visitor' } }
  for (let level = 0; level < 3; level++) expression = { op: level % 2 ? 'any' : 'all', operands: [expression,
    { op: 'atomic', predicate: { kind: 'age_on_travel_date', comparison: 'at_least', years: level } }] }
  context.conditions = { status: 'specified', expression }
  const projection = f.projectionFor(context, row.fact, 'CH')
  assert.ok(readV3PublicProjectionRecord(projection, f.registry, f.clock).ok)
  const answer = f.responseWith([[projection]])
  assert.ok(publicResponseMeasure(answer.response).depth > OFFICIAL_TRUTH_V3_LIMITS.payloadDepth)
  assert.ok(publicResponseMeasure(answer.response).depth <= OFFICIAL_TRUTH_V3_VISITOR_RESPONSE_LIMITS.payloadDepth)
  assert.ok(readV3PublicResponseRecord(answer.response, f.registry, f.clock).ok)
})

test('a large aggregate never expands one projection, original proposal or intake budget', async () => {
  const f = await one, original = f.answer.response.cells[0]!.results[0]!
  assert.equal(original.status, 'accepted'); if (original.status !== 'accepted') assert.fail('synthetic accepted fixture')
  for (const extra of [{ payload: 'x'.repeat(65_536) }, { payload: Array(8192).fill(null) }]) {
    const projection: unknown = { ...original.projection, ...extra }
    assert.deepEqual(readV3PublicProjectionRecord(projection, f.registry, f.clock), { ok: false, reason: 'bound_exceeded' })
    const response = { ...f.answer.response, cells: [{ citizenshipCountryCode: 'CH', results: [{ status: 'accepted', projection }] }] }
    assert.deepEqual(readV3PublicResponseRecord(response, f.registry, f.clock), { ok: false, reason: 'bound_exceeded' })
  }
  const proposal = f.plan.coverage.find(row => row.status === 'canonical_proposals')!.proposals![0]!
  const oversized = { ...proposal, payload: 'x'.repeat(65_536) }
  assert.deepEqual(readV3ResearchProposal(oversized, f.registry), { ok: false, reason: 'bound_exceeded' })
  assert.deepEqual(readV3RetainableProposal(JSON.stringify(oversized), f.registry), { ok: false, reason: 'bound_exceeded' })
  assert.equal(OFFICIAL_TRUTH_V3_LIMITS.payloadBytes, 65_536)
  assert.equal(OFFICIAL_TRUTH_V3_LIMITS.payloadNodes, 8192)
  assert.equal(OFFICIAL_TRUTH_V3_LIMITS.payloadDepth, 16)
})

test('over-count, getters, private members, exotic objects, sparse arrays and cycles still fail closed', async () => {
  const f = await one, root = f.answer.response, cell = root.cells[0]!, result = cell.results[0]!
  for (const cells of [Array(6).fill(cell), [{ ...cell, results: Array(65).fill(result) }]]) {
    assert.deepEqual(readV3PublicResponseRecord({ ...root, cells }, f.registry, f.clock), { ok: false, reason: 'bound_exceeded' })
  }
  let getterCalls = 0
  const getter = () => { getterCalls++; throw Error('must not run') }
  const getterRoot = Object.defineProperty({ ...root }, 'cells', { enumerable: true, get: getter })
  const getterCell = Object.defineProperty({ ...cell }, 'results', { enumerable: true, get: getter })
  const getterResult = Object.defineProperty({ ...result }, 'projection', { enumerable: true, get: getter })
  const sparse = [cell, cell]; delete sparse[0]
  const cycle: Record<string, unknown> = {}; cycle.self = cycle
  for (const bad of [getterRoot, { ...root, cells: [getterCell] }, { ...root, cells: [{ ...cell, results: [getterResult] }] },
    { ...root, input: { ...root.input, passportNumber: 'PRIVATE' } }, { ...root, cells: sparse },
    { ...root, extra: new Date() }, { ...root, extra: cycle }]) {
    assert.equal(readV3PublicResponseRecord(bad, f.registry, f.clock).ok, false)
  }
  assert.equal(getterCalls, 0)
})

test('larger collections keep original time, context and source-binding checks', async () => {
  const f = await two, root = structuredClone(f.answer.response), result = root.cells[0]!.results[0]!
  assert.equal(result.status, 'accepted'); if (result.status !== 'accepted') assert.fail('synthetic accepted fixture')
  result.projection.expiresAt = f.clock.now
  assert.equal(readV3PublicResponseRecord(root, f.registry, f.clock).ok, false)
  assert.equal(readV3PublicResponseRecord({ ...f.answer.response, input: { ...root.input, destinationCountryCode: 'JP' } }, f.registry, f.clock).ok, false)
  assert.equal(readV3PublicResponseRecord(f.answer.response, { ...f.registry, contentIdentity: undefined }, f.clock).ok, false)
})
