// SYNTHETIC C1 TEST DATA ONLY. Fictional .example sources and nine blank pages.
// Never imports the AA mapper or represents actual source qualification.
import 'server-only'
import assert from 'node:assert/strict'
import { readFileSync } from 'node:fs'
import { sha256Hex } from '@/lib/readiness/digest'
import { createV3WorkIdentity, readV3GlobalRuleContext, type V3GlobalRuleContext } from '../../contract'
import { createV3ImportCoordinator, type V3ImportAudit, type V3ImportOutcome } from '../../import/service-server'
import { readV3ProposalUpload } from '../../import/interface'
import { makeSyntheticOriginals, METHOD, must } from '../../integration/test-support/originals'
import { makeSyntheticStore } from '../../integration/test-support/store'
import type { V3IntakeBinding } from '../../storage/intake-contract'

// Root calculated these expectations in unchanged IN1, without this fixture or
// the new carrier. Do not regenerate expected identities from C1 code.
const referenceBytes = readFileSync('docs/official-truth-product-v3/C1_SYNTHETIC_CONTEXT_REFERENCE_V1.json', 'utf8')
assert.equal(sha256Hex(referenceBytes), '8573baaa6431d6fff27e3ed2a9a00749dfff78adc5d88d055c38b0d3da6a9d09')
const expected = JSON.parse(referenceBytes) as { context: unknown; contextKey: string; ruleScopeKey: string;
  jobKey: string; method: unknown; factKind: string }
assert.equal(expected.contextKey, 'official-truth-context:v3:7b207172288079805fc963b695493e61f5401e9c62fe93c5a3c0541c16d27773')
assert.equal(expected.jobKey, 'research-job:v3:936e653d3580cb4790a5188098c5e27f328fa996bb6e6359b625af75e417ea78')

function c1SyntheticContext(from = '2026-11-07', through = '2026-11-13'): Extract<V3GlobalRuleContext, { contextRevision: 2 }> {
  const context = must(readV3GlobalRuleContext({ contextRevision: 2,
    scope: { destinationCountryCode: 'DE', transitCountryCode: null,
      citizenship: { mode: 'required', countryCodes: ['CH'] },
      credentialOption: { mode: 'option', documentType: 'passport', issuingCountryCode: 'CH', relatedCitizenshipCountryCode: 'CH' },
      residence: { mode: 'not_applicable' }, requirementType: 'blank_passport_pages', validity: { mode: 'not_applicable' } },
    route: 'direct_entry', conditions: { status: 'specified', expression: { op: 'all', operands: [
      { op: 'atomic', predicate: { kind: 'document_class', documentClass: 'ordinary' } },
      { op: 'atomic', predicate: { kind: 'journey_origin', place: { kind: 'country', countryCode: 'CH' } } },
    ] } }, application: { purpose: 'tourism', tripStartAndEndWindow: { from, through } },
  }))
  if (!('contextRevision' in context)) assert.fail('synthetic application context')
  return context
}

export function c1Fixture(seed: string, approved = true) {
  const originals = makeSyntheticOriginals(), synthetic = makeSyntheticStore(originals), context = c1SyntheticContext()
  synthetic.control.methodEnabled = approved
  // The application window is independent of today's/source/legal-as-of date.
  synthetic.control.instant = Date.parse('2026-11-01T00:04:00.000Z')
  originals.control.retrievedAt = '2026-11-01T00:00:00.000Z'
  originals.control.counter = 'agrees'; originals.control.counterPages = originals.control.primaryPages
  const identity = must(createV3WorkIdentity({ context, method: METHOD, factKind: 'blank_passport_pages', researchReason: { status: 'missing' } }))
  assert.deepEqual(context, expected.context)
  assert.deepEqual(METHOD, expected.method); assert.equal(expected.factKind, 'blank_passport_pages')
  assert.equal(identity.contextKey, expected.contextKey)
  assert.equal(identity.ruleScopeKey, expected.ruleScopeKey); assert.equal(identity.jobKey, expected.jobKey)
  const base = originals.proposal(seed, 'CH', undefined, 'DE')
  const proposal = { ...base, context, contextKey: identity.contextKey, research: identity.research }
  const text = JSON.stringify(proposal, null, 2), upload = readV3ProposalUpload(text, originals.registry)
  if (!upload.ok) assert.fail('synthetic C1 upload')
  const binding: V3IntakeBinding = { schema: 3, kind: 'proposal_intake_binding', operationId: proposal.operationId,
    jobId: proposal.jobId, contextKey: identity.contextKey, method: METHOD,
    runnerId: `runner3_${sha256Hex('c1-synthetic-runner').slice(0, 32)}`, deliveryId: `delivery3_${sha256Hex(seed).slice(0, 32)}`,
    inputRevision: `snapshot:${sha256Hex('c1-synthetic-pinned-input')}` }
  const reference = { binding, proposalDigest: upload.value.digest, bytes: upload.value.bytes }
  const auditFor = (outcome: V3ImportOutcome): V3ImportAudit => ({ schema: 3, kind: 'import_attempt_record',
    operationId: proposal.operationId, proposalDigest: reference.proposalDigest, jobId: proposal.jobId, contextKey: identity.contextKey,
    method: METHOD, recordedAt: synthetic.clock().now, result: outcome.status,
    decisionRef: outcome.status === 'prepared' ? outcome.value.decision.reference : outcome.status === 'escalation' ? outcome.decision.reference : null,
    escalationKey: outcome.status === 'escalation' ? outcome.key : null })
  async function completion() {
    const result = await createV3ImportCoordinator(synthetic.importPorts).submit(text)
    if (result.status !== 'completed') assert.fail(`synthetic C1 completion ${result.status}`)
    return { outcome: result.outcome, audit: auditFor(result.outcome) }
  }
  return { originals, synthetic, context, identity, proposal, text, upload: upload.value, binding, reference, auditFor, completion }
}

export function c1InvalidShapes(proposal: ReturnType<typeof c1Fixture>['proposal']): Array<{ label: string; value: unknown }> {
  const context = proposal.context, application = context.application, window = application.tripStartAndEndWindow
  const withContext = (label: string, value: unknown) => ({ label, value: { ...proposal, context: value } })
  const withApplication = (label: string, value: unknown) => withContext(label, { ...context, application: value })
  const withWindow = (label: string, value: unknown) => withApplication(label, { ...application, tripStartAndEndWindow: value })
  return [
    withContext('unknown context field', { ...context, ignored: true }),
    ...[1, 3, '2', null].map(value => withContext(`invalid revision ${value}`, { ...context, contextRevision: value })),
    withApplication('null application', null), withApplication('unknown application field', { ...application, ignored: true }),
    withApplication('private application field', { ...application, passportNumber: 'PRIVATE_CANARY' }),
    ...['visitor', 'business', null, 2].map(purpose => withApplication(`invalid purpose ${purpose}`, { ...application, purpose })),
    withWindow('null window', null), withWindow('missing from', { through: window.through }), withWindow('missing through', { from: window.from }),
    withWindow('unknown window field', { ...window, ignored: true }), withWindow('private window field', { ...window, mrz: 'PRIVATE_CANARY' }),
    ...['from', 'through'].flatMap(key => [null, 2, false, [], {}, '2026-02-29'].map(value =>
      withWindow(`invalid ${key} ${JSON.stringify(value)}`, { ...window, [key]: value }))),
  ]
}

export function assertC1NoPublication(f: ReturnType<typeof c1Fixture>): void {
  for (const map of [f.synthetic.heads, f.synthetic.versions, f.synthetic.versionOperations,
    f.synthetic.publications, f.synthetic.cache, f.synthetic.outbox]) assert.equal(map.size, 0)
  assert.equal(f.synthetic.counts.versionWrites, 0)
  assert.equal(f.synthetic.counts.publicationWrites, 0)
}

export function assertC1Prepared(f: ReturnType<typeof c1Fixture>, outcome: V3ImportOutcome, audit: V3ImportAudit): void {
  if (outcome.status !== 'prepared') assert.fail(`expected prepared synthetic data, received ${outcome.status}`)
  const prepared = outcome.value
  assert.equal(prepared.acceptance, 'not_committed'); assert.equal(prepared.reproof, 'required_before_commit')
  assert.deepEqual(prepared.decision.context, f.context)
  assert.equal(prepared.decision.primary.status, 'clear')
  assert.deepEqual(prepared.version.subject.context, f.context)
  assert.deepEqual(prepared.version.subject.evidence.legalValidity, { status: 'specified', validFrom: '2026-11-01', validUntil: '2026-12-31' })
  assert.deepEqual(audit, f.auditFor(outcome))
  assert.equal(audit.contextKey, f.identity.contextKey)
  assert.equal(prepared.transition.contextKey, f.identity.contextKey)
  let contexts = 0
  const walk = (value: unknown): void => {
    if (!value || typeof value !== 'object') return
    if (Array.isArray(value)) { value.forEach(walk); return }
    for (const [key, child] of Object.entries(value)) {
      if (key === 'context') { contexts++; assert.deepEqual(child, f.context) }
      if (key === 'contextKey') assert.equal(child, f.identity.contextKey)
      walk(child)
    }
  }
  walk(outcome)
  // Decision + primary observation + agreeing counter observation + rule subject.
  assert.equal(contexts, 4)
  assertC1NoPublication(f)
}
