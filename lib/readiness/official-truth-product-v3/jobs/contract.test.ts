import assert from 'node:assert/strict'
import { test } from 'node:test'
import { createM04SubjectIdentity, readM04Command, readM04NativeReply } from './contract'
import { createV3WorkIdentity, readV3ResearchJobRecord } from '../contract'
import { fixture, ids, METHOD } from '../monitor/test-support'
import { key, same } from '../monitor/internal'
import { m04IdentityVectors, m04MaximumContext, m04WireUpperBounds } from '../../../../scripts/db/official-truth-v3-durable-jobs-1/generate-identity-vectors'
import { m04Fixture, m04Canonical } from '../../../../scripts/db/official-truth-v3-durable-jobs-1/fixtures'
import { readV3RetainableProposal } from '../storage/proposal-bytes'
import { s1Fixture } from '../../../../scripts/db/official-truth-v3-intake-store-1/fixtures'
import { createV3ImportCoordinator } from '../import/service-server'

function queued() {
  const f = fixture()
  const read = readV3ResearchJobRecord({ schema: 3, kind: 'research_job_record',
    jobId: ids('job3', 'm04-codec'), operationId: ids('op3', 'm04-codec'), jobKey: f.identity.jobKey,
    context: f.context, contextKey: f.identity.contextKey, research: f.identity.research, method: METHOD,
    revision: 1, predecessorRevision: null, state: 'queued', createdAt: '2026-11-09T08:04:00.000Z',
    updatedAt: '2026-11-09T08:04:00.000Z', attempt: 0, attemptLimit: 3, lease: null,
    nextAttemptAt: null, lastFailure: null, resultDecisionRef: null })
  assert.ok(read.ok); return read.value
}

test('M04-B1-01: actual S0 queued record survives the closed positive native decoder', () => {
  const record = queued(), decoded = readM04NativeReply([{ result: JSON.stringify({ status: 'present', record }) }], 'queue_read')
  assert.deepEqual(decoded, { status: 'present', record })
  assert.equal(Object.getPrototypeOf(decoded), Object.prototype)
  assert.ok(decoded?.status === 'present' && readV3ResearchJobRecord(decoded.record).ok)
  assert.deepEqual(readM04NativeReply([{ result: JSON.stringify({ status: 'committed', record }) }], 'queue_cas'), { status: 'committed', record })
})

test('duplicate members, accessor rows, foreign fields and metadata -0 are rejected before custody', () => {
  const record = queued(), value = JSON.stringify(record)
  assert.equal(readM04NativeReply([{ result: `{"status":"blocked","status":"present","record":${value}}` }], 'queue_read'), null)
  assert.equal(readM04NativeReply([{ get result() { throw Error('must_not_run') } }], 'queue_read'), null)
  assert.equal(readM04NativeReply([{ result: '{"status":"absent","token":"secret"}' }], 'queue_read'), null)
  assert.equal(readM04NativeReply([{ result: JSON.stringify({ status: 'present', record }).replace('"attempt":0', '"attempt":-0') }], 'queue_read'), null)
})

test('stable subject matches actual S0 and ignores support only after actual normalization', () => {
  const f = fixture(), atom = { op: 'atomic', predicate: { kind: 'age_on_travel_date', comparison: 'at_least', years: 18 }, supportVersionIds: ['ev2_' + 'a'.repeat(32)] }
  // Use actual S0 as the arbiter for the full predicate shape; unconditional fixture is also required.
  const base = { context: f.context, method: METHOD, factKind: 'requirement_effect', researchReason: { status: 'missing' } }
  const identity = createM04SubjectIdentity('rule_research', base), s0 = createV3WorkIdentity(base)
  assert.ok(identity && s0.ok); assert.equal(identity.jobKey, s0.value.jobKey); assert.equal(identity.contextKey, s0.value.contextKey)
  const raw = { ...base, context: { ...f.context, conditions: { status: 'specified', expression: atom } } }
  const actual = createV3WorkIdentity(raw)
  assert.ok(actual.ok)
  const derived = createM04SubjectIdentity('rule_research', raw)
  assert.ok(derived); assert.equal(derived.jobKey, actual.value.jobKey)
  const changedReason = createM04SubjectIdentity('rule_research', { ...base, researchReason: { status: 'recheck_needed', reason: 'max_age_exceeded' } })
  assert.ok(changedReason); assert.equal(identity.subjectText, changedReason.subjectText)
})

test('immutable command includes full claim duration and exact action-kind inventory', () => {
  const record = queued(), input = { operationId: ids('op3', 'claim'), jobKey: record.jobKey,
    leaseId: ids('lease3', 'claim'), leaseMilliseconds: 1000 }
  const c = readM04Command({ action: 'claim', input })
  assert.ok(c); assert.equal(c.commandKey, key('queue-command', { action: 'claim', input }))
  assert.equal(readM04Command({ action: 'claim', kind: 'rule_research', input }), null)
  assert.notEqual(readM04Command({ action: 'claim', input: { ...input, leaseMilliseconds: 1001 } })?.commandKey, c.commandKey)
  assert.ok(same(c.value.input, input))
  assert.equal(readM04Command({ action: 'claim', input: { ...input, password: 'hidden' } }), null)
})

test('positive START reply must cross-bind the actual original leased record', () => {
  const j = queued(), c = { operationId: ids('op3', 'claim2'), jobKey: j.jobKey, leaseId: ids('lease3', 'claim2'), leaseMilliseconds: 1000 }
  const leasedJob = { ...j, state: 'leased', revision: 2, predecessorRevision: 1, attempt: 1,
    lease: { leaseId: c.leaseId, generation: 2, acquiredAt: j.updatedAt, expiresAt: '2026-11-09T08:04:01.000Z' } }
  const value = { status: 'reserved', attemptKey: 'execution-attempt:v3:' + 'a'.repeat(64), token: 'b'.repeat(64), claim: c, leasedJob }
  assert.equal(readM04NativeReply([{ result: JSON.stringify(value) }], 'execution_start')?.status, 'reserved')
  assert.equal(readM04NativeReply([{ result: JSON.stringify({ ...value, claim: { ...c, leaseMilliseconds: 999 } }) }], 'execution_start'), null)
})


test('native JSON permits only the four JSON whitespace characters', () => {
  for (const whitespace of ['\u00a0', '\u000b', '\u000c', '\u2028', '\ufeff']) {
    assert.equal(readM04NativeReply([{ result: `${whitespace}{"status":"absent"}` }], 'queue_read'), null)
    assert.equal(readM04NativeReply([{ result: `{${whitespace}"status":"absent"}` }], 'queue_read'), null)
  }
  assert.deepEqual(readM04NativeReply([{ result: ' \t\r\n{"status":"absent"}\n' }], 'queue_read'), { status: 'absent' })
})

test('U01/U02: all seventeen predicate families and application revisions keep actual S0 identities', () => {
  const vectors = m04IdentityVectors()
  assert.equal(vectors.length, 21)
  assert.equal(new Set(vectors.slice(0, 17).map(v => v.name)).size, 17)
  for (const v of vectors) {
    assert.equal(createM04SubjectIdentity('rule_research', v.input)?.subjectText, v.subject.subjectText)
    assert.equal(createM04SubjectIdentity('rule_research', { ...v.input, researchReason: { status: 'recheck_needed', reason: 'max_age_exceeded' } })?.jobKey, v.identity.jobKey)
  }
  const f = m04Fixture('bounds', { fixedNow: '2026-11-09T08:04:00.000Z' })
  for (const predicate of [
    { kind: 'age_on_travel_date', comparison: 'at_least', years: -1 },
    { kind: 'age_on_travel_date', comparison: 'at_least', years: 121 },
    { kind: 'age_on_travel_date', comparison: 'at_least', years: -0 },
    { kind: 'group_size_at_least', count: 1 }, { kind: 'group_size_at_least', count: 51 },
    { kind: 'planned_stay_duration', comparison: 'at_most', duration: { value: 3661, unit: 'days' }, counting: 'unspecified' },
    { kind: 'issuing_country', countryCode: 'ZZ' },
  ]) assert.equal(createM04SubjectIdentity('rule_research', { ...vectors[0].input, context: { ...f.context, conditions: { status: 'specified', expression: { op: 'atomic', predicate } } } }), null)
  const atom = { op: 'atomic', predicate: { kind: 'age_on_travel_date', comparison: 'at_least', years: 18 } }
  const supported = { ...atom, supportVersionIds: ['ev2_' + 'b'.repeat(32), 'ev2_' + 'a'.repeat(32)] }
  const input = { ...vectors[0].input, context: { ...f.context, conditions: { status: 'specified', expression: { op: 'all', operands: [supported, atom] } } } }
  assert.equal(createM04SubjectIdentity('rule_research', input)?.jobKey, vectors[3].identity.jobKey, 'second pass collapses support-stripped duplicates')
  assert.equal(createM04SubjectIdentity('rule_research', { ...input, context: { ...f.context, conditions: { status: 'specified', expression: { ...supported, supportVersionIds: ['invalid'] } } } }), null)
})

test('U04/R4: retained ORIGINAL integer spellings survive without whole-original canonicalization', () => {
  const f = m04Fixture('original-numbers', { fixedNow: '2026-11-09T08:04:00.000Z' })
  const context = f.contextWith({ kind: 'age_on_travel_date', comparison: 'at_least', years: 18 })
  const delivery = f.delivery(undefined, 0, context)
  for (const spelling of ['18.0', '18e0', '1.8e1']) {
    const text = delivery.text.replace('"years": 18', '"years": ' + spelling)
    assert.notEqual(text, delivery.text)
    const read = readV3RetainableProposal(text, f.originals.registry)
    assert.ok(read.ok)
    if (read.ok) assert.equal(m04Canonical(JSON.parse(text).context), m04Canonical(read.value.proposal.context))
  }
})

test('U04: source-derived worst-valid wire bound covers maximum S0 node/support cardinalities', () => {
  const context = m04MaximumContext(), bounds = m04WireUpperBounds()
  const input = { context, method: { methodId: 'm'.repeat(64), revision: 2147483647 }, factKind: 'blank_passport_pages',
    researchReason: { status: 'recheck_needed', reason: 'valid_from_in_future' } }
  const actual = createV3WorkIdentity(input), subject = createM04SubjectIdentity('rule_research', input)
  assert.ok(actual.ok && subject)
  assert.ok(Buffer.byteLength(m04Canonical(context)) < bounds.context)
  assert.ok(Buffer.byteLength(subject.subjectText) < bounds.subject)
  const command = readM04Command({ action: 'enqueue', kind: 'rule_research', input: { ...input,
    operationId: ids('op3', 'maximum'), jobId: ids('job3', 'maximum'), attemptLimit: 16 } })
  assert.ok(command); assert.ok(Buffer.byteLength(command.commandText) < bounds.command)
  assert.equal(bounds.maximum, 160772)
  assert.ok(bounds.maximum < 262144)
})

test('U01/U02: raw S0 aliases normalize at JS entry and malformed graph/shape never reaches native metadata', () => {
  const f = m04Fixture('raw-alias'), input = { ...f.ruleInput, context: { ...f.context,
    scope: { ...f.context.scope, destinationCountryCode: '\u00a0aq\u00a0', citizenship: { mode: 'required', countryCodes: [' ch '] } } } }
  const command = readM04Command({ action: 'enqueue', kind: 'rule_research', input })
  assert.ok(command); assert.equal(command.jobKey, f.identity.jobKey)
  assert.equal((command.value.input as typeof f.ruleInput).context.scope.destinationCountryCode, 'AQ')
  const cycle: Record<string, unknown> = {}; cycle.self = cycle
  assert.equal(readM04Command({ action: 'enqueue', kind: 'rule_research', input: cycle }), null)
  assert.equal(readM04Command({ action: 'enqueue', kind: 'rule_research', input: { ...f.ruleInput, get operationId() { throw Error('not invoked') } } }), null)
  const atom = { op: 'atomic', predicate: { kind: 'travel_purpose', purpose: 'visitor' } }
  for (const expression of [
    { op: 'all', operands: Array.from({ length: 9 }, () => atom) },
    { op: 'not', operand: { op: 'not', operand: { op: 'not', operand: { op: 'not', operand: atom } } } },
    { ...atom, supportVersionIds: Array.from({ length: 9 }, (_, i) => 'ev2_' + i.toString(16).padStart(32, '0')) },
  ]) assert.equal(readM04Command({ action: 'enqueue', kind: 'rule_research', input: { ...f.ruleInput,
    context: { ...f.context, conditions: { status: 'specified', expression } } } }), null)
})

test('R4: actual predecessor fixture carries an archive without method and permits the linked next method revision', async () => {
  const sf = s1Fixture('m04-archive-offline-regression'), historical = await sf.withArchivedPredecessor('primary_unclear')
  assert.equal(historical.outcome.status, 'escalation')
  if (historical.outcome.status !== 'escalation') return
  assert.ok(historical.outcome.archiveAppend)
  assert.equal(Object.hasOwn(historical.outcome.archiveAppend, 'method'), false)
  // The unchanged synthetic clear-primary qualifier is pinned to METHOD v1.
  // Its real unclear-primary escalation has no invented v2 qualification and
  // still exercises the historical-method/archived-conflict link in S0/I1.
  sf.synthetic.control.methodRevision = 2; sf.originals.control.primaryUnclear = true; sf.originals.control.counter = 'not_found'
  const method = { ...sf.binding.method, revision: 2 }
  const identity = createV3WorkIdentity({ context: sf.proposal.context, method,
    factKind: sf.proposal.research.factKind, researchReason: sf.proposal.research.researchReason })
  assert.ok(identity.ok); if (!identity.ok) return
  const text = JSON.stringify({ ...sf.proposal, operationId: ids('op3', 'm04-method-two'), research: identity.value.research }, null, 2)
  const next = await createV3ImportCoordinator({ ...sf.synthetic.importPorts, method }).submit(text)
  assert.equal(next.status, 'completed')
  if (next.status !== 'completed') return
  assert.equal(next.outcome.status, 'escalation')
  if (next.outcome.status !== 'escalation') return
  assert.equal(next.outcome.previousDecision?.method.revision, 1)
  assert.equal(next.outcome.decision.method.revision, 2)
  assert.ok(next.outcome.archiveAppend)
  assert.equal(next.outcome.decision.predecessor, next.outcome.previousDecision?.reference)
})
