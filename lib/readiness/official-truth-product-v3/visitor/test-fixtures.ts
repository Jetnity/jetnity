// SYNTHETIC TEST FIXTURES ONLY. Runtime query/component never imports this file.
// Fictional .example authority, fabricated nine-page rule, local memory only.
import 'server-only'
import assert from 'node:assert/strict'
import { sha256Hex } from '@/lib/readiness/digest'
import { contentEvidenceLookupV3, createContentIdentityGraph } from '@/lib/readiness/official-truth-content-identity'
import { schema2Kanonisch } from '@/lib/readiness/regulierungs-anwendbarkeit'
import { quellenRegistryErstellen } from '@/lib/readiness/source-registry'
import { createV3CombinationDiscoveryIdentity, createV3WorkIdentity, readV3GlobalRuleContext, readV3RuleVersionRecord,
  type V3CombinationDiscoveryJobRecord, type V3GlobalRuleContext, type V3PublicProjectionRecord, type V3ReadClock, type V3ResearchJobRecord } from '../contract'
import { prepareV3VisitorProjection, type V3ProjectionBinding, type V3VisitorPorts } from './query'

export const SYNTHETIC_INPUT = { destinationCountryCode: 'DE', citizenshipCountryCodes: ['CH', 'RS'] }
export const SYNTHETIC_CLOCK: V3ReadClock = { now: '2026-11-09T08:04:00.000Z', legalDate: '2026-11-09' }
const METHOD = { methodId: 'synthetic-method', revision: 1 }
const ref = (kind: string, seed: string) => `${kind}:v3:${sha256Hex(seed)}`
const source = { sourceId: 'synthetic-destination', contentItemId: 'synthetic-publication', representationId: 'synthetic-original',
  contentItemVersion: 1, representationVersion: 1, identityProfileId: 'synthetic-profile', identityProfileVersion: 1 }
const url = 'https://destination.example/synthetic-test-publication'

export function syntheticV3Fixture() {
  const result = quellenRegistryErstellen([{ sourceId: source.sourceId, sourceClass: 'official_authority',
    publisherName: 'Fiktive Testpublikation', authorityName: 'Fiktive Testbehörde', domains: ['destination.example'] }])
  assert.equal(result.ok, true)
  if (!result.ok) throw new Error('synthetic registry')
  const graph = createContentIdentityGraph(result.registry, [{ sourceId: source.sourceId, contentItemId: source.contentItemId,
    contentItemVersion: 1, current: true, externalIdNamespace: 'synthetic', externalContentId: source.contentItemId,
    expectedPublisherIds: ['synthetic-publisher'], expectedAuthorityIds: ['synthetic-authority'] }], [{
    ...source, current: true, requestUrls: [url], expectedFinalUrl: url, expectedMediaType: 'text/plain', expectedLocale: null, expectedSchema: null,
  }], [{ identityProfileId: source.identityProfileId, identityProfileVersion: 1, current: true,
    verify: () => ({ ok: false as const, reason: 'identity_mismatch' as const }) }])
  if (!graph.ok) throw new Error('synthetic graph')
  const registry = { ...result.registry, contentIdentity: graph.value }
  const context = (country = 'CH', purpose: 'visitor' | 'business' = 'visitor'): V3GlobalRuleContext => {
    const read = readV3GlobalRuleContext({ scope: { destinationCountryCode: 'DE', transitCountryCode: null,
      citizenship: { mode: 'required', countryCodes: [country] },
      credentialOption: { mode: 'option', documentType: 'passport', issuingCountryCode: country, relatedCitizenshipCountryCode: country },
      residence: { mode: 'not_applicable' }, requirementType: 'blank_passport_pages', validity: { mode: 'not_applicable' } },
    route: 'direct_entry', conditions: { status: 'specified', expression: { op: 'all', operands: [
      { op: 'atomic', predicate: { kind: 'document_class', documentClass: 'ordinary' } },
      { op: 'atomic', predicate: { kind: 'travel_purpose', purpose } },
      { op: 'atomic', predicate: { kind: 'planned_stay_duration', comparison: 'at_most', duration: { value: 5, unit: 'days' }, counting: 'calendar_dates_inclusive' } },
    ] } } })
    if (!read.ok) throw new Error('synthetic context')
    return read.value
  }
  // Separate fictional nine-page example, never an AA/global visa qualification.
  const applicationContext = (unconditional = false): V3GlobalRuleContext => {
    const read = readV3GlobalRuleContext({ ...context(), contextRevision: 2,
      conditions: unconditional ? { status: 'unconditional' } : { status: 'specified', expression: { op: 'all', operands: [
        { op: 'atomic', predicate: { kind: 'document_class', documentClass: 'ordinary' } },
        { op: 'atomic', predicate: { kind: 'journey_origin', place: { kind: 'country', countryCode: 'CH' } } },
      ] } },
      application: { purpose: 'tourism', tripStartAndEndWindow: { from: '2026-11-07', through: '2026-11-13' } },
    })
    if (!read.ok) throw new Error('synthetic application context')
    return read.value
  }
  const make = (value = context()) => {
    const identity = createV3WorkIdentity({ context: value, method: METHOD, factKind: 'blank_passport_pages', researchReason: { status: 'missing' } })
    const lookup = contentEvidenceLookupV3(value.scope, { sourceId: source.sourceId, contentItemId: source.contentItemId, representationId: source.representationId })
    if (!identity.ok || !lookup.ok) throw new Error('synthetic identity')
    const observation = { context: value, contextKey: identity.value.contextKey,
      fact: { schema: 1 as const, fact: { kind: 'blank_passport_pages' as const, minimumPages: 9 } },
      evidence: { versionId: `ev2_${sha256Hex(identity.value.contextKey).slice(0, 32)}`, lookupKey: lookup.value.key,
        source, sourceFingerprintProtocol: 1 as const, sourceContentHash: sha256Hex('SYNTHETIC_NINE_PAGES'),
        retrievedAt: '2026-11-09T08:00:00.000Z', legalValidity: { status: 'specified' as const, validFrom: '2026-11-01', validUntil: '2026-12-31' } } }
    const decision = { schema: 3 as const, kind: 'source_decision_record' as const,
      reference: ref('source-decision', identity.value.contextKey), predecessor: null, method: METHOD, context: value,
      contextKey: identity.value.contextKey, factKind: 'blank_passport_pages' as const, evaluatedAt: '2026-11-09T08:01:00.000Z', legalAsOfDate: SYNTHETIC_CLOCK.legalDate,
      primary: { status: 'clear' as const, observation, qualification: {
        reference: ref('destination-qualification', identity.value.contextKey), representedCountryCode: 'DE', role: 'destination_authority' as const,
        method: METHOD, evidenceVersionId: observation.evidence.versionId, checkedAt: '2026-11-09T08:01:00.000Z' } },
      counterCheck: { attemptPlanRevision: 1, attempts: [{ status: 'not_found' as const, attemptedAt: '2026-11-09T08:01:00.000Z', source: null }] },
      knownConflicts: [], historyArchive: null, conclusion: 'clear_primary' as const }
    const rule = readV3RuleVersionRecord({ schema: 3, kind: 'rule_version_record', reference: ref('rule-version', identity.value.contextKey),
      revision: 1, predecessor: null, state: 'accepted', method: METHOD, subject: observation,
      sourceDecisionRef: decision.reference, operationId: `op3_${'a'.repeat(32)}`, recordedAt: '2026-11-09T08:02:00.000Z',
    }, registry, decision)
    if (!rule.ok) throw new Error('synthetic rule')
    const prepared = prepareV3VisitorProjection({ rule: rule.value, decision, builtAt: '2026-11-09T08:03:00.000Z',
      expiresAt: '2026-11-09T08:30:00.000Z', sourceFreshUntil: '2026-11-09T09:00:00.000Z' }, registry, SYNTHETIC_CLOCK)
    if (prepared.status !== 'prepared') throw new Error('synthetic projection')
    return { decision, rule: rule.value, projection: prepared.projection }
  }
  const accepted = make()
  const application = make(applicationContext()), applicationUnconditional = make(applicationContext(true))
  const originals = new Map([accepted.projection, make(context('RS')).projection, make(context('CH', 'business')).projection,
    application.projection, applicationUnconditional.projection]
    .map((projection) => [projection.rule.subject.contextKey, projection]))
  const cache = new Map<string, V3PublicProjectionRecord>([[accepted.projection.rule.subject.contextKey, accepted.projection]])
  const jobs = new Map<string, V3ResearchJobRecord>()
  const discoveryJobs = new Map<string, V3CombinationDiscoveryJobRecord>()
  const methodReceipt = Object.freeze({ syntheticOnly: true })
  type Receipt = Readonly<{ syntheticOnly: true }>
  const proofs = new WeakMap<Receipt, V3ProjectionBinding>()
  let clock = { ...SYNTHETIC_CLOCK }, approved = true, sequence = 0
  let state: 'current' | 'withdrawn' | 'conflict' | 'unavailable' = 'current'
  const counts = { reads: 0, queue: 0, discoveryQueue: 0, reproof: 0, confirm: 0 }
  const ports: V3VisitorPorts<typeof methodReceipt, Receipt> = {
    registry, method: METHOD, dataMode: 'synthetic_test', clock: () => ({ ...clock }),
    methodAuthority: {
      resolveCurrent: async () => approved ? { status: 'approved', receipt: methodReceipt } : { status: 'not_approved' },
      reproveAtCommit: async (receipt, method) => approved && receipt === methodReceipt && schema2Kanonisch(method) === schema2Kanonisch(METHOD)
        ? { status: 'current' } : { status: 'revoked' },
    },
    coverage: { targets: async (input) => ({ zeilen: input.destinationCountryCode === 'DE'
      ? [{ context: context(input.citizenshipCountryCode), factKind: 'blank_passport_pages' }] : [], problem: null }) },
    cache: { read: async (key) => { counts.reads += 1; const value = cache.get(key.contextKey); return { zeilen: value ? [value] : [], problem: null } } },
    current: {
      reprove: async (binding) => {
        counts.reproof += 1
        if (state === 'conflict') return { status: 'conflict', decisionRef: ref('source-decision', 'synthetic-conflict'), reason: 'comparable_conflict' }
        if (state !== 'current') return { status: state }
        // This test port has its own fixed original, not an echo of the requested bytes.
        const original = originals.get(binding.contextKey)
        if (!original || binding.versionRef !== original.rule.reference || binding.projectionHash !== sha256Hex(schema2Kanonisch(original))) return { status: 'unavailable' }
        const receipt: Receipt = Object.freeze({ syntheticOnly: true })
        proofs.set(receipt, binding)
        return { status: 'current', binding, receipt }
      },
      confirmBatch: async (items, method) => {
        counts.confirm += 1
        if (!approved || state !== 'current' || method !== methodReceipt) return { status: 'not_current' }
        return { status: 'confirmed', currentProjectionRefs: items.filter(({ receipt, binding }) =>
          proofs.has(receipt) && schema2Kanonisch(proofs.get(receipt)) === schema2Kanonisch(binding)).map(({ binding }) => binding.projectionRef) }
      },
    },
    queue: { enqueue: async (work) => {
      counts.queue += 1
      const identity = createV3WorkIdentity({ context: work.context, method: work.method,
        factKind: work.factKind, researchReason: work.researchReason })
      if (!identity.ok) return { status: 'conflict' }
      const existing = jobs.get(identity.value.jobKey)
      if (existing) return { status: 'confirmed', record: existing }
      const job: V3ResearchJobRecord = { schema: 3, kind: 'research_job_record', jobId: work.jobId, operationId: work.operationId,
        jobKey: identity.value.jobKey, context: work.context, contextKey: identity.value.contextKey, research: identity.value.research,
        method: work.method, revision: 1, predecessorRevision: null, state: 'queued', createdAt: clock.now, updatedAt: clock.now,
        attempt: 0, attemptLimit: work.attemptLimit, lease: null, nextAttemptAt: null, lastFailure: null, resultDecisionRef: null }
      jobs.set(job.jobKey, job)
      return { status: 'confirmed', record: job }
    } },
    discoveryQueue: { enqueue: async (pair) => {
      counts.discoveryQueue += 1
      const identity = createV3CombinationDiscoveryIdentity({ destinationCountryCode: pair.destinationCountryCode,
        citizenshipCountryCode: pair.citizenshipCountryCode, method: pair.method })
      if (!identity.ok) return { status: 'conflict' }
      const existing = discoveryJobs.get(identity.value.jobKey)
      if (existing) return { status: 'confirmed', record: existing }
      const job: V3CombinationDiscoveryJobRecord = { schema: 3, kind: 'combination_discovery_job_record',
        identity: identity.value, jobId: pair.jobId, operationId: pair.operationId,
        revision: 1, predecessorRevision: null, state: 'queued', createdAt: clock.now, updatedAt: clock.now,
        attempt: 0, attemptLimit: pair.attemptLimit, lease: null, nextAttemptAt: null, lastFailure: null, resultDiscoveryRef: null }
      discoveryJobs.set(identity.value.jobKey, job)
      return { status: 'confirmed', record: job }
    } },
    ids: () => { sequence += 1; return { jobId: `job3_${sequence.toString(16).padStart(32, '0')}`, operationId: `op3_${sequence.toString(16).padStart(32, '0')}` } },
  }
  return { ports, context, applicationContext, application, applicationUnconditional, make, accepted, cache, jobs, discoveryJobs, counts,
    setClock: (value: V3ReadClock) => { clock = value }, revoke: () => { approved = false },
    setState: (value: typeof state) => { state = value }, methodReceipt }
}
