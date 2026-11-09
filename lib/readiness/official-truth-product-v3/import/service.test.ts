import assert from 'node:assert/strict'
import { describe, test } from 'node:test'
import { readFileSync } from 'node:fs'
import { sha256Hex } from '@/lib/readiness/digest'
import { schema2Kanonisch } from '@/lib/readiness/regulierungs-anwendbarkeit'
import { evidenceQuellenFingerprint } from '@/lib/readiness/evidence'
import { contentEvidenceLookupV3, createContentIdentityGraph } from '@/lib/readiness/official-truth-content-identity'
import { quellenRegistryErstellen } from '@/lib/readiness/source-registry'
import {
  officialTruthTrustedFactExtrahierenMitDefinitionen, consumeOfficialTruthTrustedFactExecutionContext,
  type OfficialTruthExtractorDefinition,
} from '@/lib/readiness/official-truth-trusted-fact-extractor-registry'
import type { RegelFakt } from '@/lib/readiness/rule-claims'
import type { OfficialRequirementType } from '@/types/trips'
import {
  createV3WorkIdentity, readV3GlobalRuleContext, readV3SourceDecisionRecord, readV3RuleVersionRecord, type V3ReadResult,
  type V3SourceDecisionRecord, type V3SourceObservationRecord,
} from '../contract'
import { readV3ProposalUpload, V3_PROPOSAL_INTERFACE } from './interface'
import {
  createV3ImportCoordinator, importV3ResearchProposalProduction,
  type V3ImportPorts, type V3ImportHistory, type V3ImportOutcome, type V3ImportAudit,
  type V3ImportResult, type V3ImportVerificationRequest,
} from './service-server'

// Fictional .example originals. This is an isolated in-process protocol test,
// not an official rule, live source, production custody, database or receipt.
const AT = '2026-11-09T12:00:00.000Z'
const DAY = '2026-11-09'
const METHOD = Object.freeze({ methodId: 'synthetic-v3', revision: 1 })
const PRIMARY = 'synthetic-primary', COUNTER = 'synthetic-counter'
const ref = (kind: string, seed: string) => `${kind}:v3:${sha256Hex(seed)}`
const op = (seed: string) => `op3_${sha256Hex(seed).slice(0, 32)}`
const eid = (seed: string) => `ev2_${sha256Hex(seed).slice(0, 32)}`
const pin = (sourceId: string) => ({ sourceId, contentItemId: 'synthetic-publication', representationId: 'synthetic-json',
  contentItemVersion: 1, representationVersion: 1, identityProfileId: 'synthetic-profile', identityProfileVersion: 1 })
const sourceRef = (sourceId: string) => ({ sourceId, contentItemId: 'synthetic-publication', representationId: 'synthetic-json' })
const url = (sourceId: string) => `https://${sourceId}.example/publication`
function ok<T>(result: V3ReadResult<T>): T { if (!result.ok) assert.fail(result.reason); return result.value }

function registry() {
  const created = quellenRegistryErstellen([PRIMARY, COUNTER].map((sourceId) => ({
    sourceId, sourceClass: 'official_authority', publisherName: 'Synthetic publisher', authorityName: 'Synthetic authority',
    domains: [`${sourceId}.example`],
  })))
  if (!created.ok) assert.fail('fixture registry')
  const graph = createContentIdentityGraph(created.registry,
    [PRIMARY, COUNTER].map((sourceId) => ({ sourceId, contentItemId: 'synthetic-publication', contentItemVersion: 1, current: true,
      externalIdNamespace: 'synthetic', externalContentId: 'publication', expectedPublisherIds: ['synthetic'], expectedAuthorityIds: ['synthetic'] })),
    [PRIMARY, COUNTER].map((sourceId) => ({ ...pin(sourceId), current: true, requestUrls: [url(sourceId)], expectedFinalUrl: url(sourceId),
      expectedMediaType: 'application/json', expectedLocale: null, expectedSchema: null })),
    [{ identityProfileId: 'synthetic-profile', identityProfileVersion: 1, current: true,
      verify: () => ({ ok: false as const, reason: 'identity_mismatch' as const }) }])
  if (!graph.ok) assert.fail('fixture graph')
  return { ...created.registry, contentIdentity: graph.value }
}

function context(requirementType: OfficialRequirementType = 'blank_passport_pages') {
  return ok(readV3GlobalRuleContext({ scope: { destinationCountryCode: 'AQ', transitCountryCode: null,
    citizenship: { mode: 'required', countryCodes: ['CH'] },
    credentialOption: { mode: 'option', documentType: 'passport', issuingCountryCode: 'CH', relatedCitizenshipCountryCode: 'CH' },
    residence: { mode: 'not_applicable' }, requirementType, validity: { mode: 'not_applicable' } },
  route: 'direct_entry', conditions: { status: 'unconditional' } }))
}
type CounterMode = 'not_found' | 'unreachable' | 'unclear' | 'not_applicable' | 'agrees' | 'compatible' | 'conflicts'
type Options = { fact?: RegelFakt; counterFact?: RegelFakt; requirementType?: OfficialRequirementType; counter?: CounterMode }

function harness(options: Options = {}) {
  const reg = registry(), scope = context(options.requirementType), fact: RegelFakt = options.fact ?? { kind: 'blank_passport_pages', minimumPages: 9 }
  const work = ok(createV3WorkIdentity({ context: scope, method: METHOD, factKind: fact.kind, researchReason: { status: 'missing' } }))
  const requestSeen: V3ImportVerificationRequest[] = []
  const counters = { inspect: 0, extract: 0, reprove: 0, reserve: 0, finish: 0, method: 0 }
  const state = { now: AT, method: 'approved' as 'approved' | 'revoked' | 'expired' | 'unavailable',
    counter: options.counter ?? 'not_found' as CounterMode, primaryUnclear: false,
    historyCurrent: true, verificationCurrent: true, throwInspect: false, failFinish: false, fakeReceipt: false,
    beforeInspect: async () => {}, beforeMethodReprove: async () => {},
    editParts: undefined as ((parts: V3SourceDecisionRecordParts) => void) | undefined,
    history: { pointer: { state: 'missing', revision: 0, versionRef: null }, version: null, decision: null,
      decisionPredecessor: null, decisionArchiveAppend: null, invalidatedProjectionRefs: [] } as V3ImportHistory }
  type V3SourceDecisionRecordParts = Pick<V3SourceDecisionRecord, 'primary' | 'counterCheck' | 'knownConflicts' | 'historyArchive'>
  const receipts = new WeakMap<object, { parts: string; request: V3ImportVerificationRequest }>()
  const methodReceipts = new WeakSet<object>(), historyReceipts = new WeakMap<object, string>()
  const entries = new Map<string, { digest: string; ticket: object; outcome: V3ImportOutcome | null }>()
  const audits: V3ImportAudit[] = [], escalations = new Set<string>()

  function extracted(sourceId: string, originalFact: RegelFakt): V3SourceObservationRecord {
    // The candidate is not supplied here. A real canonical extraction executes
    // against independent synthetic original bytes held only by this test port.
    const original = JSON.stringify({ synthetic: true, fact: originalFact })
    const fingerprint = evidenceQuellenFingerprint(original)
    assert.ok(fingerprint)
    const versionId = eid(`${sourceId}|${original}`)
    const lookup = contentEvidenceLookupV3(scope.scope, sourceRef(sourceId))
    assert.equal(lookup.ok, true)
    if (!lookup.ok) assert.fail('fixture lookup')
    const definition: OfficialTruthExtractorDefinition = {
      extractorId: `otx_${sourceId.replaceAll('-', '_')}`, extractorVersion: 1, current: true,
      factKind: originalFact.kind, sourceFamilyId: 'otf_synthetic', contentItemRefs: [{ sourceId, contentItemId: 'synthetic-publication' }],
      representations: [pin(sourceId)], urlAllowlist: [{ kind: 'exact', canonicalUrl: url(sourceId) }],
      contentTypes: ['application/json'], schemaFamily: 'ots_synthetic', policyId: null, policyVersion: null, requiredFieldPaths: [],
      match: ({ supports }) => supports.length === 1 ? { ok: true } : { ok: false, reason: 'structure_not_recognized' },
      extract: ({ supports }) => { counters.extract++; const body = JSON.parse(supports[0].sourceSnapshot) as { synthetic?: unknown; fact?: unknown }
        return body.synthetic === true ? { ok: true, fact: body.fact } : { ok: false, reason: 'structure_not_recognized' } },
    }
    const input = { factKind: originalFact.kind, requirementType: scope.scope.requirementType, scopeKey: work.ruleScopeKey,
      scope: scope.scope, evidenceQuality: 'explicit_primary_statement', policy: null, registry: reg,
      supports: [{ versionId, sourceId, retrieval: { ...pin(sourceId), identitySchema: 2, status: 'server_owned_official_retrieval',
        canonicalUrl: url(sourceId), retrievedAt: AT, contentType: 'application/json', sourceSnapshot: original,
        sourceContentHash: fingerprint, redirectCount: 0 } }] }
    const extracted = officialTruthTrustedFactExtrahierenMitDefinitionen(input, [definition])
    if (extracted.status !== 'trusted_fact_extracted') assert.fail(extracted.reason)
    assert.equal(consumeOfficialTruthTrustedFactExecutionContext({ ...extracted }, input), null)
    const execution = consumeOfficialTruthTrustedFactExecutionContext(extracted, input)
    assert.ok(execution)
    assert.equal(consumeOfficialTruthTrustedFactExecutionContext(extracted, input), null)
    return { context: scope, contextKey: work.contextKey, fact: { schema: 1, fact: execution.fact }, evidence: {
      versionId, lookupKey: lookup.value.key, source: pin(sourceId), sourceFingerprintProtocol: 1,
      sourceContentHash: fingerprint, retrievedAt: AT,
      legalValidity: { status: 'specified', validFrom: '2026-01-01', validUntil: '2026-12-31' },
    } }
  }
  const ports: V3ImportPorts<object, object, object, object> = {
    registry: reg, method: METHOD, clock: () => ({ now: state.now, legalDate: state.now.slice(0, 10) }),
    methodAuthority: {
      async resolveCurrent() { counters.method++; if (state.method !== 'approved') return { status: state.method === 'unavailable' ? 'unavailable' : 'not_approved' }
        const receipt = Object.freeze({}); methodReceipts.add(receipt); return { status: 'approved', receipt } },
      async reproveAtCommit(receipt, method) { await state.beforeMethodReprove()
        if (!methodReceipts.has(receipt) || JSON.stringify(method) !== JSON.stringify(METHOD)) return { status: 'unavailable' }
        return { status: state.method === 'approved' ? 'current' : state.method } },
    },
    history: {
      async read() { const receipt = Object.freeze({}); historyReceipts.set(receipt, schema2Kanonisch(state.history))
        return { status: 'snapshot', receipt, history: state.history } },
      async reprove(receipt, history) { return { status: state.historyCurrent && historyReceipts.get(receipt) === schema2Kanonisch(history) ? 'current' : 'changed' } },
    },
    evidence: {
      async inspect(request) {
        counters.inspect++; requestSeen.push(request); await state.beforeInspect()
        if (state.throwInspect) throw new Error('private raw provider error must not escape')
        const primary = extracted(PRIMARY, fact)
        const knownConflicts = structuredClone(request.previousDecision?.knownConflicts ?? [])
        const attempts: V3SourceDecisionRecord['counterCheck']['attempts'] = []
        if (['agrees', 'compatible', 'conflicts'].includes(state.counter)) {
          const counter = extracted(COUNTER, options.counterFact ?? fact)
          const comparisonRef = ref('source-comparison', `${state.counter}|${primary.evidence.versionId}|${counter.evidence.versionId}`)
          if (state.counter === 'conflicts') {
            const conflictRef = ref('source-conflict', `${primary.evidence.versionId}|${counter.evidence.versionId}`)
            if (!knownConflicts.some((entry) => entry.reference === conflictRef)) knownConflicts.push({ reference: conflictRef,
              detectedDecisionRef: request.decisionRef, detectedAt: state.now, primary, counter, resolution: null })
            attempts.push({ status: 'conflicts', attemptedAt: state.now, comparisonRef, conflictRef, observation: counter })
          } else if (state.counter === 'compatible') attempts.push({ status: 'compatible', attemptedAt: state.now, comparisonRef,
            method: METHOD, reproof: 'required_before_acceptance', observation: counter })
          else attempts.push({ status: 'agrees', attemptedAt: state.now, comparisonRef, observation: counter })
        } else if (state.counter === 'not_found') attempts.push({ status: 'not_found', source: null, attemptedAt: state.now })
        else attempts.push({ status: state.counter as 'unreachable' | 'unclear' | 'not_applicable', source: sourceRef(COUNTER), attemptedAt: state.now })
        const parts: V3SourceDecisionRecordParts = { primary: state.primaryUnclear
          ? { status: 'unclear', reason: 'ambiguous_statement', evidence: primary.evidence }
          : { status: 'clear', observation: primary, qualification: { reference: ref('destination-qualification', PRIMARY),
            representedCountryCode: 'AQ', role: 'destination_authority', method: METHOD, evidenceVersionId: primary.evidence.versionId,
            checkedAt: state.now } },
        counterCheck: { attemptPlanRevision: 1, attempts }, knownConflicts, historyArchive: request.previousDecision?.historyArchive ?? null }
        state.editParts?.(parts)
        const receipt = Object.freeze({}); receipts.set(receipt, { parts: schema2Kanonisch(parts), request })
        return { status: 'inspected', receipt: state.fakeReceipt ? { ...receipt } : receipt,
          parts, archiveAppend: null, validUntilExclusive: '2026-11-09T13:00:00.000Z' }
      },
      async reprove(receipt, request, decision, archive, clock) {
        counters.reprove++; const held = receipts.get(receipt)
        const parts = { primary: decision.primary, counterCheck: decision.counterCheck, knownConflicts: decision.knownConflicts,
          historyArchive: decision.historyArchive }
        return { status: state.verificationCurrent && held?.request === request && held.parts === schema2Kanonisch(parts)
          && archive === null && clock.now < '2026-11-09T13:00:00.000Z' ? 'current' : 'changed' }
      },
    },
    quarantine: {
      async reserve(upload) { counters.reserve++; const previous = entries.get(upload.proposal.operationId)
        if (previous) return previous.digest !== upload.digest ? { status: 'collision' }
          : previous.outcome === null ? { status: 'busy' } : { status: 'completed', outcome: previous.outcome }
        const ticket = Object.freeze({}); entries.set(upload.proposal.operationId, { digest: upload.digest, ticket, outcome: null })
        return { status: 'acquired', ticket } },
      async finish(ticket, outcome, audit) { counters.finish++
        const entry = entries.get(audit.operationId)
        if (!entry || entry.ticket !== ticket || entry.outcome !== null) return { status: 'unconfirmed' }
        entry.outcome = outcome; audits.push(audit); if (audit.escalationKey) escalations.add(audit.escalationKey)
        if (state.failFinish) throw new Error('ack lost')
        return { status: 'recorded' } },
    },
  }
  function proposal(seed = 'first') {
    return { schema: 3, kind: 'untrusted_research_proposal', jobId: `job3_${sha256Hex('job').slice(0, 32)}`, operationId: op(seed),
      context: scope, contextKey: work.contextKey, research: work.research, proposedFact: { schema: 1, fact },
      references: [{ source: sourceRef(PRIMARY), claimedRetrievedAt: AT,
        claimedValidity: { status: 'specified', validFrom: null, validUntil: null } }] }
  }
  return { ports, run: createV3ImportCoordinator(ports), proposal, counters, state, requestSeen, audits, escalations, reg, work, extracted }
}

function outcome(result: V3ImportResult): V3ImportOutcome {
  if (result.status !== 'completed') assert.fail(JSON.stringify(result))
  return result.outcome
}

describe('I1 neutral proposal intake and quarantine', () => {
  test('same neutral S0 envelope works for two independent fictional supplier adapters', async () => {
    const h = harness()
    const supplierA = () => JSON.stringify(h.proposal('a'))
    const supplierB = () => JSON.stringify(h.proposal('b'), null, 2)
    assert.equal(V3_PROPOSAL_INTERFACE.schema, 3)
    assert.equal(V3_PROPOSAL_INTERFACE.authority, 'none')
    for (const input of [supplierA(), supplierB()]) assert.equal(outcome(await h.run.submit(input)).status, 'prepared')
    assert.equal(h.audits.length, 2)
    assert.equal(h.counters.extract, 2)
  })
  test('invalid/private/oversized/authority payloads never reach quarantine storage or providers', async () => {
    const h = harness(), base = h.proposal()
    for (const invalid of [undefined, '{', new Uint8Array([1]), ' '.repeat(65_537), '\ud800',
      JSON.stringify({ ...base, approved: true }), JSON.stringify({ ...base, method: METHOD }),
      JSON.stringify({ ...base, passportNumber: 'must-not-persist' }), JSON.stringify({ ...base, receipt: { accepted: true } }),
      JSON.stringify({ ...base, references: [{ ...base.references[0], rawtext: 'private text' }] }),
    ]) assert.equal((await h.run.submit(invalid)).status, 'rejected')
    assert.equal(h.counters.reserve, 0); assert.equal(h.counters.inspect, 0); assert.equal(h.audits.length, 0)
  })
  test('operation replay returns the confirmed historical outcome; other bytes collide without overwrite', async () => {
    const h = harness(), text = JSON.stringify(h.proposal())
    const first = await h.run.submit(text), replay = await h.run.submit(text)
    assert.equal(first.status, 'completed'); assert.equal(replay.status, 'completed')
    assert.deepEqual(outcome(first), outcome(replay))
    if (replay.status === 'completed') assert.equal(replay.replayed, true)
    assert.deepEqual(await h.run.submit(`${text}\n`), { status: 'rejected', reason: 'operation_collision' })
    assert.equal(h.counters.inspect, 1); assert.equal(h.audits.length, 1)
  })
  test('atomic reservation prevents concurrent identical operations from duplicating verification', async () => {
    const h = harness(), text = JSON.stringify(h.proposal())
    const results = await Promise.all([h.run.submit(text), h.run.submit(text), h.run.submit(text)])
    assert.equal(results.filter((result) => result.status === 'completed').length, 1)
    assert.equal(results.filter((result) => result.status === 'busy').length, 2)
    assert.equal(h.counters.inspect, 1)
  })
  test('a lost finish acknowledgement is unknown, then confirmed replay resolves it without a second write', async () => {
    const h = harness(), text = JSON.stringify(h.proposal()); h.state.failFinish = true
    assert.deepEqual(await h.run.submit(text), { status: 'outcome_unknown', operationId: h.proposal().operationId })
    const replay = await h.run.submit(text)
    assert.equal(replay.status, 'completed'); assert.equal(h.counters.finish, 1); assert.equal(h.audits.length, 1)
  })
})

describe('I1 method and source authority boundaries', () => {
  test('production entry remains closed and contains no injectable approval or live fallback', () => {
    assert.deepEqual(importV3ResearchProposalProduction(), { status: 'unavailable', reason: 'unbound' })
    const source = readFileSync('lib/readiness/official-truth-product-v3/import/service-server.ts', 'utf8')
    assert.equal(/\b(fetch|setInterval|createClient|regelKandidatAkzeptieren)\s*\(/.test(source), false)
    assert.equal(/from ['"][^'"]*(?:\.test|fixtures|supabase|store-server)/.test(source), false)
  })
  test('unapproved or unavailable method never reaches original verification', async () => {
    for (const state of ['revoked', 'expired', 'unavailable'] as const) {
      const h = harness(); h.state.method = state
      assert.equal(outcome(await h.run.submit(JSON.stringify(h.proposal()))).status, 'unavailable')
      assert.equal(h.counters.inspect, 0)
    }
  })
  test('method revocation during source await closes the prepared handoff', async () => {
    const h = harness(); h.state.beforeInspect = async () => { await Promise.resolve(); h.state.method = 'revoked' }
    assert.deepEqual(outcome(await h.run.submit(JSON.stringify(h.proposal()))), { status: 'quarantined', reason: 'method_not_current' })
  })
  test('freshness expiring during the final method await cannot produce prepared output', async () => {
    const h = harness(); h.state.beforeMethodReprove = async () => { h.state.now = '2026-11-09T13:00:00.000Z' }
    assert.deepEqual(outcome(await h.run.submit(JSON.stringify(h.proposal()))), { status: 'unavailable', reason: 'verification_unavailable' })
  })
  test('cloned evidence receipt fails despite matching DTOs and hashes', async () => {
    const h = harness(); h.state.fakeReceipt = true
    assert.deepEqual(outcome(await h.run.submit(JSON.stringify(h.proposal()))), { status: 'unavailable', reason: 'verification_unavailable' })
  })
  test('provider exception content never reaches result, audit or quarantine output', async () => {
    const h = harness(); h.state.throwInspect = true
    const result = await h.run.submit(JSON.stringify(h.proposal()))
    assert.deepEqual(outcome(result), { status: 'unavailable', reason: 'temporary_failure' })
    assert.equal(JSON.stringify([result, h.audits]).includes('private raw provider'), false)
  })
  test('researcher fact and claimed retrieval date cannot become canonical extracted truth', async () => {
    const h = harness(), proposal = h.proposal()
    const changed = { ...proposal, proposedFact: { schema: 1, fact: { kind: 'blank_passport_pages', minimumPages: 1 } },
      references: [{ ...proposal.references[0], claimedRetrievedAt: '2099-01-01T00:00:00.000Z' }] }
    const result = outcome(await h.run.submit(JSON.stringify(changed)))
    assert.equal(result.status, 'prepared')
    if (result.status !== 'prepared') assert.fail('expected prepared')
    assert.deepEqual(result.value.version.subject.fact.fact, { kind: 'blank_passport_pages', minimumPages: 9 })
    assert.equal(result.value.proposalDisposition, 'superseded_by_source')
    assert.equal(result.value.version.subject.evidence.retrievedAt, AT)
    assert.equal('proposedFact' in h.requestSeen[0], false)
    assert.equal(JSON.stringify(h.requestSeen).includes('2099'), false)
    assert.equal(result.value.acceptance, 'not_committed')
  })
  test('foreign jurisdiction, wrong method, fact kind and source-context mutations are quarantined', async () => {
    const edits: Array<(parts: Pick<V3SourceDecisionRecord, 'primary' | 'counterCheck' | 'knownConflicts' | 'historyArchive'>) => void> = [
      (parts) => { if (parts.primary.status === 'clear') parts.primary.qualification.representedCountryCode = 'DE' },
      (parts) => { if (parts.primary.status === 'clear') parts.primary.qualification.method = { ...METHOD, revision: 2 } },
      (parts) => { if (parts.primary.status === 'clear') parts.primary.observation.contextKey = ref('official-truth-context', 'foreign') },
      (parts) => { if (parts.primary.status === 'clear') parts.primary.observation.evidence.legalValidity = { status: 'specified', validFrom: null, validUntil: '2026-11-08' } },
      (parts) => { if (parts.primary.status === 'clear') parts.primary.qualification.evidenceVersionId = eid('other') },
    ]
    for (const edit of edits) { const h = harness(); h.state.editParts = edit
      assert.deepEqual(outcome(await h.run.submit(JSON.stringify(h.proposal()))), { status: 'quarantined', reason: 'invalid_verification' }) }
  })
  test('source or actual history change after inspection prevents preparation', async () => {
    const h = harness(); h.state.historyCurrent = false
    assert.deepEqual(outcome(await h.run.submit(JSON.stringify(h.proposal()))), { status: 'quarantined', reason: 'history_changed' })
    const g = harness(); g.state.verificationCurrent = false
    assert.deepEqual(outcome(await g.run.submit(JSON.stringify(g.proposal()))), { status: 'unavailable', reason: 'verification_unavailable' })
  })
})

describe('I1 automatic V3 outcomes and explicit future commit boundary', () => {
  test('one clear destination primary suffices for every unsuccessful optional-check state', async () => {
    for (const counter of ['not_found', 'unreachable', 'unclear', 'not_applicable'] as const) {
      const h = harness({ counter }), value = outcome(await h.run.submit(JSON.stringify(h.proposal())))
      assert.equal(value.status, 'prepared'); assert.equal(h.escalations.size, 0)
      if (value.status === 'prepared') assert.equal(value.value.decision.conclusion, 'clear_primary')
    }
  })
  test('independent agreement prepares but same-publication mirror cannot count as agreement', async () => {
    const h = harness({ counter: 'agrees' }); assert.equal(outcome(await h.run.submit(JSON.stringify(h.proposal()))).status, 'prepared')
    const g = harness({ counter: 'agrees' }); g.state.editParts = (parts) => {
      const check = parts.counterCheck.attempts[0]
      if (parts.primary.status === 'clear' && 'observation' in check) check.observation = structuredClone(parts.primary.observation)
    }
    assert.deepEqual(outcome(await g.run.submit(JSON.stringify(g.proposal()))), { status: 'quarantined', reason: 'invalid_verification' })
  })
  test('unclear mandatory primary escalates once per context/method reason without an accepted version', async () => {
    const h = harness(); h.state.primaryUnclear = true
    const a = outcome(await h.run.submit(JSON.stringify(h.proposal('a'))))
    const b = outcome(await h.run.submit(JSON.stringify(h.proposal('b'))))
    assert.equal(a.status, 'escalation'); assert.equal(b.status, 'escalation'); assert.equal(h.escalations.size, 1)
    if (a.status === 'escalation' && b.status === 'escalation') assert.equal(a.key, b.key)
  })
  test('true comparable conflict escalates without majority and persists after optional outage', async () => {
    const h = harness({ counter: 'conflicts', counterFact: { kind: 'blank_passport_pages', minimumPages: 8 } })
    const first = outcome(await h.run.submit(JSON.stringify(h.proposal('conflict'))))
    assert.equal(first.status, 'escalation')
    if (first.status !== 'escalation') assert.fail('expected conflict')
    assert.equal(first.reason, 'comparable_conflict')
    assert.equal(readV3SourceDecisionRecord(first.decision, h.reg).ok, true)
    if (first.decision.primary.status !== 'clear') assert.fail('fixture primary')
    // Explicit synthetic historical state, as a future M1 commit would supply.
    // Its reader proves relationships only, not real custody or a live commit.
    const conflictedVersion = ok(readV3RuleVersionRecord({ schema: 3, kind: 'rule_version_record',
      reference: ref('rule-version', 'conflicted'), revision: 1, predecessor: null, state: 'conflicted', method: METHOD,
      subject: first.decision.primary.observation, sourceDecisionRef: first.decision.reference,
      operationId: h.proposal('conflict').operationId, recordedAt: AT }, h.reg, first.decision))
    h.state.history = { pointer: { state: 'conflicted', revision: 1, versionRef: conflictedVersion.reference },
      version: conflictedVersion, decision: first.decision, decisionPredecessor: null, decisionArchiveAppend: null, invalidatedProjectionRefs: [] }
    h.state.counter = 'unreachable'
    const next = outcome(await h.run.submit(JSON.stringify(h.proposal('outage'))))
    assert.equal(next.status, 'escalation')
    if (next.status === 'escalation') assert.equal(next.reason, 'comparable_conflict')
    h.state.editParts = (parts) => { parts.knownConflicts = [] }
    assert.deepEqual(outcome(await h.run.submit(JSON.stringify(h.proposal('erase')))), { status: 'quarantined', reason: 'invalid_verification' })
  })
  test('nonexclusive optional visa addition can be compatible without a fabricated second matching fact', async () => {
    const electronic = { visaMode: 'electronic_visa' as const, eligibility: 'allowed' as const, mandate: 'not_mandatory' as const }
    const h = harness({ requirementType: 'visa', counter: 'compatible', fact: { kind: 'visa_options', options: [electronic] },
      counterFact: { kind: 'visa_options', options: [electronic, { visaMode: 'visa_on_arrival', eligibility: 'allowed', mandate: 'not_mandatory' }] } })
    assert.equal(outcome(await h.run.submit(JSON.stringify(h.proposal()))).status, 'prepared')
    const g = harness({ requirementType: 'visa', counter: 'compatible', fact: { kind: 'visa_options', options: [electronic] },
      counterFact: { kind: 'visa_options', options: [{ ...electronic, eligibility: 'not_allowed' }] } })
    assert.deepEqual(outcome(await g.run.submit(JSON.stringify(g.proposal()))), { status: 'quarantined', reason: 'invalid_verification' })
  })
  test('a new prepared version retains expected predecessor, operation and invalidated projection references', async () => {
    const h = harness(), first = outcome(await h.run.submit(JSON.stringify(h.proposal('first'))))
    if (first.status !== 'prepared') assert.fail('prepared expected')
    h.state.history = { pointer: first.value.transition.next, version: first.value.version, decision: first.value.decision,
      decisionPredecessor: null, decisionArchiveAppend: null, invalidatedProjectionRefs: [ref('rule-projection', 'current')] }
    const next = outcome(await h.run.submit(JSON.stringify(h.proposal('second'))))
    if (next.status !== 'prepared') assert.fail(JSON.stringify(next))
    assert.equal(next.value.version.revision, 2)
    assert.equal(next.value.version.predecessor, first.value.version.reference)
    assert.deepEqual(next.value.transition.expected, first.value.transition.next)
    assert.equal(next.value.transition.invalidatedProjectionRefs.length, 1)
    assert.equal(next.value.transition.commitConfirmation, 'required')
  })
  test('caller abort prevents continuation and never implies a successful write', async () => {
    const h = harness(), controller = new AbortController()
    h.state.beforeInspect = async () => { controller.abort() }
    assert.equal((await h.run.submit(JSON.stringify(h.proposal()), controller.signal)).status, 'outcome_unknown')
    assert.equal(h.counters.finish, 0)
    assert.equal((await h.run.submit(JSON.stringify(h.proposal('other')), controller.signal)).status, 'unavailable')
  })
  test('transport error result remains bounded and contains no raw upload data', () => {
    const h = harness()
    assert.deepEqual(readV3ProposalUpload('not JSON: private details', h.reg), { ok: false, reason: 'invalid_upload' })
  })
})

describe('TL I1 R1 — archived history and uncertain bounded operations', () => {
  async function archivedHistory() {
    const h = harness(), first = outcome(await h.run.submit(JSON.stringify(h.proposal('seed'))))
    if (first.status !== 'prepared' || first.value.decision.primary.status !== 'clear') assert.fail('prepared fixture')
    const primary = first.value.decision.primary.observation
    const conflictRef = ref('source-conflict', 'historical')
    const resolved = ok(readV3SourceDecisionRecord({ ...first.value.decision, reference: ref('source-decision', 'resolved'),
      knownConflicts: [{ reference: conflictRef, detectedDecisionRef: ref('source-decision', 'historical-conflict'), detectedAt: AT,
        primary, counter: h.extracted(COUNTER, { kind: 'blank_passport_pages', minimumPages: 8 }),
        resolution: { reference: ref('conflict-resolution', 'corrected'), predecessor: null, conflictRef, method: METHOD,
          resolvedAt: AT, legalAsOfDate: DAY, basis: 'corrected_publication',
          observations: [h.extracted(COUNTER, { kind: 'blank_passport_pages', minimumPages: 9 })] } }],
    }, h.reg))
    const oldVersion = ok(readV3RuleVersionRecord({ ...first.value.version, reference: ref('rule-version', 'resolved'),
      sourceDecisionRef: resolved.reference }, h.reg, resolved))
    const archive = { schema: 3 as const, kind: 'resolved_conflict_archive_record' as const,
      head: { reference: ref('conflict-archive', 'page-1'), revision: 1, totalConflicts: 1 }, predecessor: null,
      contextKey: resolved.contextKey, factKind: resolved.factKind, fromDecisionRef: resolved.reference,
      archivedAt: AT, entries: resolved.knownConflicts }
    const archived = ok(readV3SourceDecisionRecord({ ...resolved, reference: ref('source-decision', 'archived'),
      predecessor: resolved.reference, knownConflicts: [], historyArchive: archive.head }, h.reg, resolved, archive))
    const version = ok(readV3RuleVersionRecord({ ...oldVersion, reference: ref('rule-version', 'archived'), revision: 2,
      predecessor: oldVersion.reference, sourceDecisionRef: archived.reference }, h.reg, archived))
    h.state.history = { pointer: { state: 'accepted', revision: 2, versionRef: version.reference }, version,
      decision: archived, decisionPredecessor: resolved, decisionArchiveAppend: archive, invalidatedProjectionRefs: [] }
    return h
  }
  test('a verified current archive append permits the next import without dropping its history pointer', async () => {
    const h = await archivedHistory(), result = outcome(await h.run.submit(JSON.stringify(h.proposal('next'))))
    if (result.status !== 'prepared') assert.fail(JSON.stringify(result))
    assert.equal(result.value.version.revision, 3)
    assert.deepEqual(result.value.decision.historyArchive, h.state.history.decision?.historyArchive)
    assert.equal(result.value.archiveAppend, null)
  })
  test('missing, foreign or mutated archive proof for the current history remains invalid', async () => {
    for (const change of ['missing', 'foreign', 'mutated'] as const) {
      const h = await archivedHistory(), archive = change === 'missing' ? null : structuredClone(h.state.history.decisionArchiveAppend)
      if (archive) {
        if (change === 'foreign') archive.fromDecisionRef = ref('source-decision', 'foreign')
        else archive.entries[0].detectedDecisionRef = ref('source-decision', 'rewritten')
      }
      h.state.history = { ...h.state.history, decisionArchiveAppend: archive }
      assert.deepEqual(outcome(await h.run.submit(JSON.stringify(h.proposal('next')))), { status: 'quarantined', reason: 'invalid_verification' })
    }
  })
  test('reserve write followed by lost response is unknown, with the same reserved operation retained', async () => {
    const h = harness(), reserve = h.ports.quarantine.reserve.bind(h.ports.quarantine)
    h.ports.quarantine.reserve = async (upload, signal) => { await reserve(upload, signal); throw new Error('reply lost') }
    const json = JSON.stringify(h.proposal()), result = await h.run.submit(json)
    assert.deepEqual(result, { status: 'outcome_unknown', operationId: h.proposal().operationId })
    h.ports.quarantine.reserve = reserve
    assert.deepEqual(await h.run.submit(json), { status: 'busy' })
    assert.equal(h.counters.inspect, 0)
  })
  test('a never-settling inspector times out; late resolution cannot start finish', { timeout: 1500 }, async () => {
    const h = harness(); let release: () => void = () => {}
    h.state.beforeInspect = () => new Promise<void>((resolve) => { release = resolve })
    const run = createV3ImportCoordinator(h.ports, { budgetMilliseconds: 20 })
    const result = await run.submit(JSON.stringify(h.proposal()))
    assert.deepEqual(result, { status: 'outcome_unknown', operationId: h.proposal().operationId })
    release(); await new Promise((resolve) => setImmediate(resolve))
    assert.equal(h.counters.finish, 0)
  })
  test('external abort releases an uncooperative reserve await and late reservation remains unknown', { timeout: 1500 }, async () => {
    const h = harness(), controller = new AbortController(), reserve = h.ports.quarantine.reserve.bind(h.ports.quarantine)
    let release: () => void = () => {}
    h.ports.quarantine.reserve = async (upload, signal) => { await new Promise<void>((resolve) => { release = resolve }); return reserve(upload, signal) }
    const pending = h.run.submit(JSON.stringify(h.proposal()), controller.signal)
    controller.abort()
    assert.equal((await pending).status, 'outcome_unknown')
    release(); await new Promise((resolve) => setImmediate(resolve))
    assert.equal(h.counters.inspect, 0); assert.equal(h.counters.finish, 0)
  })
  test('a hanging finish that later records cannot produce success before its acknowledgement', { timeout: 1500 }, async () => {
    const h = harness(), finish = h.ports.quarantine.finish.bind(h.ports.quarantine)
    let release: () => void = () => {}
    h.ports.quarantine.finish = async (ticket, value, audit, signal) => { await new Promise<void>((resolve) => { release = resolve }); return finish(ticket, value, audit, signal) }
    const result = await createV3ImportCoordinator(h.ports, { budgetMilliseconds: 20 }).submit(JSON.stringify(h.proposal()))
    assert.equal(result.status, 'outcome_unknown')
    release(); await new Promise((resolve) => setImmediate(resolve))
    const replay = await h.run.submit(JSON.stringify(h.proposal()))
    assert.equal(replay.status, 'completed'); assert.equal(h.counters.finish, 1)
  })
})
