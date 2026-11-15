import assert from 'node:assert/strict'
import { readFileSync } from 'node:fs'
import { test } from 'node:test'
import { sha256Hex } from '@/lib/readiness/digest'
import { schema2Kanonisch } from '@/lib/readiness/regulierungs-anwendbarkeit'
import { officialTruthRechercheEntscheiden } from '@/lib/readiness/official-truth-research-request'
import { akzeptierteRegelClaimSpeichern } from '@/lib/readiness/official-truth-store-server'
import { createV3ContextIdentity, createV3WorkIdentity, readV3GlobalRuleContext, readV3ResearchJobRecord,
  readV3ResearchProposal, readV3SourceDecisionRecord, readV3PublicProjectionRecord } from '../contract'
import { readV3RetainableProposal } from '../storage/proposal-bytes'
import { S1_RETENTION_SHAPE, S1_RETENTION_SHAPE_V2, s1RetentionShapeAllows } from '../storage/retention-shape'
import { shapeSql } from '../../../../scripts/db/official-truth-v3-intake-store-1/generate-retention-shape'
import { unknownMemberMutations } from '../../../../scripts/db/official-truth-v3-intake-store-1/retention-fixtures'
import { c1Fixture } from '../global-conditions/test-support/fixture'
import { customerInformationFixture, CUSTOMER_DETAIL_SAMPLES } from './test-support/fixture'
import { readV3CustomerInformationDetail } from './details'
import { v3CanonicalInformationTopic, v3CanonicalRelatedInformationTopics } from './canonical-topic'

test('CI1 retains every detailed family through actual canonical intake, I1 source extraction, outcome and visitor projection', async () => {
  for (const [index, detail] of CUSTOMER_DETAIL_SAMPLES.entries()) {
    const f = customerInformationFixture(detail, 'synthetic_rule', `detail-${index}`)
    assert.ok(readV3ResearchProposal(f.proposal, f.originals.registry).ok, detail.kind)
    assert.ok(readV3RetainableProposal(JSON.stringify(f.proposal), f.originals.registry).ok, detail.kind)
    const { outcome, audit } = await f.completion()
    if (outcome.status !== 'prepared') assert.fail(`${detail.kind}: ${outcome.status}`)
    assert.equal(outcome.value.acceptance, 'not_committed')
    assert.deepEqual(outcome.value.version.subject.fact, f.proposal.proposedFact, detail.kind)
    assert.equal(s1RetentionShapeAllows(outcome, 'outcome'), true, detail.kind)
    assert.equal(s1RetentionShapeAllows(audit, 'audit'), true, detail.kind)
    const projection = await f.projection()
    assert.ok(readV3PublicProjectionRecord(projection, f.originals.registry, f.synthetic.clock()).ok, detail.kind)
    assert.equal(f.synthetic.counts.versionWrites, 0)
    assert.equal(f.synthetic.counts.publicationWrites, 0)
  }
})

test('CI1 historical descriptor and both old context identities are unchanged', () => {
  assert.equal(S1_RETENTION_SHAPE.revision, 3)
  assert.equal(S1_RETENTION_SHAPE_V2.revision, 2)
  const sql = readFileSync('scripts/db/official-truth-v3-intake-store-1/intake-candidate.sql', 'utf8')
  assert.equal(sql.match(/-- S1_RETENTION_SHAPE_BEGIN[\s\S]*?-- S1_RETENTION_SHAPE_END/)?.[0], shapeSql())
  const c1 = c1Fixture('ci1-preserve-c1') // includes independently pinned old identity assertions
  assert.ok(readV3RetainableProposal(c1.text, c1.originals.registry).ok)
  const old = c1.originals.proposal('ci1-preserve-legacy')
  assert.ok(readV3RetainableProposal(JSON.stringify(old), c1.originals.registry).ok)
})

test('CI1 stable semantic items separate rules without resetting identity when a fee or source value changes', () => {
  const form = CUSTOMER_DETAIL_SAMPLES[3]!
  assert.equal(form.kind, 'entry_form_details')
  if (form.kind !== 'entry_form_details') assert.fail('form sample')
  const first = customerInformationFixture(form, 'arrival_form'), second = customerInformationFixture(form, 'departure_form')
  const changed = customerInformationFixture({ ...form, cost: { status: 'specified', amount: { value: '20.00', currency: 'CHF', basis: 'per_person' } } }, 'arrival_form')
  assert.equal(first.identity.ruleScopeKey, second.identity.ruleScopeKey)
  assert.notEqual(first.identity.contextKey, second.identity.contextKey)
  assert.notEqual(first.identity.jobKey, second.identity.jobKey)
  assert.equal(first.identity.contextKey, changed.identity.contextKey)
  assert.equal(first.identity.jobKey, changed.identity.jobKey)
  const required = customerInformationFixture(CUSTOMER_DETAIL_SAMPLES[0]!, 'synthetic_vaccine')
  const recommended = customerInformationFixture(CUSTOMER_DETAIL_SAMPLES[1]!, 'synthetic_vaccine')
  assert.equal(required.identity.ruleScopeKey, recommended.identity.ruleScopeKey)
  assert.notEqual(required.identity.contextKey, recommended.identity.contextKey)
  for (const informationItem of ['', 'price_2026', '12_50', 'https://x.example', 'arrival_form\n', 'a'.repeat(65), 'Arrival_Form']) {
    assert.equal(readV3GlobalRuleContext({ ...first.context, informationItem }).ok, false, informationItem)
  }
})

test('CI1 proposal retention strictly pairs context topic, requirement, fact kind and detailed subtype', () => {
  const f = customerInformationFixture()
  const mutations = [
    { ...f.proposal, context: { ...f.context, informationTopic: 'required_vaccinations' } },
    { ...f.proposal, context: { ...f.context, scope: { ...f.context.scope, requirementType: 'vaccination' } } },
    { ...f.proposal, proposedFact: { schema: 1, fact: { kind: 'blank_passport_pages', minimumPages: 2 } } },
    { ...f.proposal, proposedFact: { schema: 1, fact: { kind: 'entry_information', detail: CUSTOMER_DETAIL_SAMPLES[0] } } },
    { ...f.proposal, research: { ...f.proposal.research, factKind: 'requirement_effect' } },
    { ...f.proposal, context: { scope: f.context.scope, route: f.context.route, conditions: f.context.conditions } },
    { ...f.proposal, proposedFact: { schema: 2, fact: f.proposal.proposedFact.fact } },
  ]
  for (const value of mutations) {
    assert.equal(s1RetentionShapeAllows(value), false)
    assert.equal(readV3ResearchProposal(value, f.originals.registry).ok, false)
  }
  for (const detail of CUSTOMER_DETAIL_SAMPLES) {
    const one = customerInformationFixture(detail)
    for (const bad of unknownMemberMutations(one.proposal)) {
      assert.equal(s1RetentionShapeAllows(bad), false, detail.kind)
      assert.equal(readV3ResearchProposal(bad, one.originals.registry).ok, false, detail.kind)
    }
  }
})

test('CI1 independent durable job and unclear-decision readers reject both cross-revision fact-kind smuggling directions', () => {
  const f = customerInformationFixture(), old = f.originals.context('CH', 'DE')
  for (const [context, factKind] of [[f.context, 'requirement_effect'], [old, 'entry_information']] as const) {
    const identity = createV3ContextIdentity(context); assert.ok(identity.ok)
    const research = officialTruthRechercheEntscheiden({ status: 'missing', ruleScopeKey: identity.value.ruleScopeKey, factKind }, context.scope)
    assert.equal(research.action, 'research'); if (research.action !== 'research') assert.fail('research checksum fixture')
    const { key, ruleScopeKey, researchReason } = research.request
    const jobKey = `research-job:v3:${sha256Hex(schema2Kanonisch({ contextKey: identity.value.contextKey, method: f.method, factKind }))}`
    assert.equal(createV3WorkIdentity({ context, method: f.method, factKind, researchReason }).ok, false)
    const job = { schema: 3, kind: 'research_job_record', jobId: f.proposal.jobId, operationId: f.proposal.operationId,
      context, contextKey: identity.value.contextKey, jobKey, research: { key, ruleScopeKey, factKind, researchReason }, method: f.method,
      revision: 1, predecessorRevision: null, state: 'queued', createdAt: f.synthetic.clock().now, updatedAt: f.synthetic.clock().now,
      attempt: 0, attemptLimit: 3, lease: null, nextAttemptAt: null, lastFailure: null, resultDecisionRef: null }
    assert.equal(readV3ResearchJobRecord(job).ok, false)
    const decision = { schema: 3, kind: 'source_decision_record', reference: `source-decision:v3:${'a'.repeat(64)}`, predecessor: null,
      context, contextKey: identity.value.contextKey, factKind, method: f.method, evaluatedAt: f.synthetic.clock().now, legalAsOfDate: f.synthetic.clock().legalDate,
      primary: { status: 'unclear', reason: 'missing', evidence: null }, counterCheck: { attemptPlanRevision: 1,
        attempts: [{ status: 'not_found', attemptedAt: f.synthetic.clock().now, source: null }] },
      knownConflicts: [], historyArchive: null, conclusion: 'primary_unclear' }
    assert.equal(readV3SourceDecisionRecord(decision, f.originals.registry).ok, false)
  }
})

test('CI1 detailed cross-field contradictions, fabricated URLs and private members fail closed', () => {
  const form = CUSTOMER_DETAIL_SAMPLES[3]!, financial = CUSTOMER_DETAIL_SAMPLES[10]!, consent = CUSTOMER_DETAIL_SAMPLES[12]!
  const invalid = [
    { ...form, due: { relation: 'on_arrival', offset: { value: 2, unit: 'days' } } },
    { ...CUSTOMER_DETAIL_SAMPLES[14], acceptedDocument: 'passport', replacesPassport: true },
    { ...financial, effect: 'not_required' }, { ...consent, effect: 'not_required' },
    { ...CUSTOMER_DETAIL_SAMPLES[13], disposition: 'prohibited' },
    { ...form, formTitle: 'https://imposter.example' }, { ...form, applicantName: 'PRIVATE_CANARY' },
    { ...form, cost: { status: 'specified', amount: { value: '-1', currency: 'CHF', basis: 'per_person' } } },
  ]
  for (const value of invalid) assert.equal(readV3CustomerInformationDetail(value).ok, false)
  const f = customerInformationFixture()
  for (const href of ['https://synthetic-primary.example/other', 'https://synthetic-primary.example/synthetic-rules?token=private']) {
    const proposedFact = { schema: 1, fact: { kind: 'entry_information', detail: { ...form,
      action: { source: f.proposal.references[0]!.source, purpose: 'form', href } } } }
    assert.equal(readV3ResearchProposal({ ...f.proposal, proposedFact }, f.originals.registry).ok, false)
  }
  assert.equal(v3CanonicalInformationTopic(f.context, f.proposal.proposedFact), 'entry_forms')
  assert.deepEqual(v3CanonicalRelatedInformationTopics(f.context, f.proposal.proposedFact), ['form_costs', 'official_actions'])
})

test('CI1 legacy flat writer refuses the new kind before clock, client or RPC access', async () => {
  let touched = false
  const dependencies = Object.defineProperty({}, 'transport', { enumerable: true, get() { touched = true; throw Error('no legacy transport') } })
  for (const value of [{ trustedRuleFact: { kind: 'entry_information', detail: CUSTOMER_DETAIL_SAMPLES[3] } },
    { kandidat: { proposal: { kind: 'entry_information', detail: CUSTOMER_DETAIL_SAMPLES[3] } } }]) {
    assert.deepEqual(await akzeptierteRegelClaimSpeichern(value, dependencies), { ok: false, reason: 'applicability_not_persistable' })
  }
  assert.equal(touched, false)
})
