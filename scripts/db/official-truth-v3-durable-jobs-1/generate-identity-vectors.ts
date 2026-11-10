// Offline deterministic vectors from actual protected S0 readers, never codegen edits.
import assert from 'node:assert/strict'
import { createV3WorkIdentity, readV3GlobalRuleContext } from '../../../lib/readiness/official-truth-product-v3/contract'
import { createM04SubjectIdentity } from '../../../lib/readiness/official-truth-product-v3/jobs/contract'
import { m04Fixture, m04Canonical, M04_TEST_BINDING } from './fixtures'

export function m04IdentityVectors() {
  const f = m04Fixture('identity-vectors', { fixedNow: '2026-11-09T08:04:00.000Z' })
  const predicates = [
    { kind: 'destination_permission', destinationCountryCode: 'AQ', permissionClass: 'visa', validity: 'valid_on_travel_date' },
    { kind: 'lawful_residence', countryCode: 'DE', entitlement: 'entitled_to_reside', departure: 'unspecified' },
    { kind: 'journey_origin', place: { kind: 'region', regionCode: 'common_travel_area' } },
    { kind: 'age_on_travel_date', comparison: 'at_least', years: 18 },
    { kind: 'travel_purpose', purpose: 'visitor' }, { kind: 'document_class', documentClass: 'ordinary' },
    { kind: 'issuing_country', countryCode: 'CH' }, { kind: 'citizenship_includes', countryCode: 'CH' },
    { kind: 'credential_citizenship_link', countryCode: 'CH' }, { kind: 'nationality_status', status: 'british_national_overseas' },
    { kind: 'institution_status', status: 'confirmed_german_school' }, { kind: 'group_size_at_least', count: 2 },
    { kind: 'group_membership', role: 'traveller_included' }, { kind: 'authority_confirmation', subject: 'institution_status' },
    { kind: 'activity_characteristic', characteristic: 'business_contacts' }, { kind: 'national_passport_for_citizenship', countryCode: 'CH' },
    { kind: 'planned_stay_duration', comparison: 'at_most', duration: { value: 90, unit: 'days' }, counting: 'unspecified' },
  ]
  const contexts = predicates.map(predicate => f.contextWith(predicate))
  contexts.push(f.context, { ...f.context, conditions: { status: 'unconditional' } },
    { ...f.context, conditions: { status: 'unresolved', missing: ['document_class', 'travel_purpose'] } },
    { ...f.context, contextRevision: 2, application: { purpose: 'tourism', tripStartAndEndWindow: { from: '2026-11-09', through: '2026-11-20' } } })
  return Object.freeze(contexts.map((context, index) => {
    const parsed = readV3GlobalRuleContext(context); assert.ok(parsed.ok)
    if (!parsed.ok) throw Error('vector context')
    const input = { context: parsed.value, method: { methodId: M04_TEST_BINDING.methodId, revision: 1 }, factKind: 'blank_passport_pages', researchReason: { status: 'missing' } }
    const s0 = createV3WorkIdentity(input), subject = createM04SubjectIdentity('rule_research', input)
    assert.ok(s0.ok && subject)
    if (!s0.ok || !subject) throw Error('vector identity')
    assert.equal(subject.jobKey, s0.value.jobKey); assert.equal(subject.contextKey, s0.value.contextKey)
    return Object.freeze({ name: index < 17 ? predicates[index].kind : 'context-' + index, input, subject, identity: s0.value, text: m04Canonical(input) })
  }))
}

/** A raw sixteen-node expression, with eight supports on each of fourteen atoms. */
export function m04MaximumContext() {
  const f = m04Fixture('maximum-context', { fixedNow: '2026-11-09T08:04:00.000Z' })
  const codes = ['AD','AE','AF','AG','AI','AL','AM','AO','AQ','AR','AS','AT','AU','AW']
  const atoms = codes.map((country, n) => ({ op: 'atomic', predicate: { kind: 'destination_permission', destinationCountryCode: country,
    permissionClass: 'permission_to_enter_or_stay', validity: 'valid_on_travel_date' },
  supportVersionIds: Array.from({ length: 8 }, (_, support) => 'ev2_' + (n * 8 + support).toString(16).padStart(32, '0')) }))
  const raw = { ...f.context, scope: { ...f.context.scope, transitCountryCode: 'DE', residence: { mode: 'required', countryCode: 'DE' } },
    route: 'transit', contextRevision: 2, application: { purpose: 'tourism', tripStartAndEndWindow: { from: '0001-01-01', through: '9999-12-31' } },
    conditions: { status: 'specified', expression: { op: 'all', operands: [...atoms.slice(0, 7), { op: 'any', operands: atoms.slice(7) }] } } }
  const parsed = readV3GlobalRuleContext(raw); assert.ok(parsed.ok)
  if (!parsed.ok) throw Error('maximum-cardinality context')
  return parsed.value
}

/** Source-derived conservative UTF8 bounds, not a sampled performance claim.
 * All normal metadata is closed ASCII: predicate <=256B across the 17 fixed
 * shapes; atomic wrapper + eight 36B support IDs <=384B; <=16 tree nodes.
 * Scope <=1024B and application/context punctuation <=1024B. Support-free
 * identity has <=16*(256+64)B, doubled once when encoded as a JSON string.
 * The following 20480B allowances dominate both forms, including punctuation.
 * Each retained journal/reply uses only the enumerated copies below. JSON
 * string embedding is conservatively <=2*n+2 for this closed ASCII domain.
 */
export function m04WireUpperBounds() {
  const context = 20480, subject = 20480, job = context + 2048, command = context + 1024
  const envelope = 2 * job + 1536, reference = 1024, result = 2048, claim = 512
  const quote = (n: number) => 2 * n + 2
  const requests = { queue_read: 2048, queue_confirm: command + 2048,
    queue_cas: command + envelope + quote(subject) + 1024,
    execution_read: claim + 512, execution_start: claim + job + quote(subject) + 1024,
    execution_prepare: claim + result + 16 * reference + 1024 }
  const replies = { queue_read: job + 512, queue_confirm: quote(command) + quote(envelope) + job + 2048,
    queue_cas: job + 512, execution_start: claim + job + 1024,
    execution_read: claim + 2 * job + result + 16 * reference + 1024,
    execution_prepare: result + 16 * reference + 1024 }
  assert.ok(16 * 640 + 2048 < context)
  assert.ok(2 * 16 * (256 + 64) + 2048 + 1024 < subject)
  assert.ok(command <= 65536 && envelope <= 196608 && 16 * reference <= 65536)
  assert.ok(Object.values({ ...requests, ...Object.fromEntries(Object.entries(replies).map(([k, v]) => ['reply_' + k, v])) }).every(n => n <= 262144))
  return Object.freeze({ context, subject, job, command, envelope, reference, result, claim,
    requests: Object.freeze(requests), replies: Object.freeze(replies), maximum: Math.max(...Object.values(requests), ...Object.values(replies)) })
}
