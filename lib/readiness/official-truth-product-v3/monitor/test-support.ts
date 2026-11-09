// SYNTHETIC TEST SUPPORT ONLY. No production module imports this file.
// Fictional .example authorities and entry-form facts are never travel advice.
import assert from 'node:assert/strict'
import { sha256Hex } from '@/lib/readiness/digest'
import { schema2Kanonisch } from '@/lib/readiness/regulierungs-anwendbarkeit'
import { contentEvidenceLookupV3, createContentIdentityGraph } from '@/lib/readiness/official-truth-content-identity'
import { quellenRegistryErstellen } from '@/lib/readiness/source-registry'
import { createV3WorkIdentity, readV3GlobalRuleContext, readV3SourceDecisionRecord, readV3RuleVersionRecord,
  readV3TransitionPlan, type V3ReadResult, type V3MethodAuthorityPort, type V3MethodRef } from '../contract'
import { createV3QueueCoordinator, createV3DiscoveryQueueCoordinator, type V3QueueCommit,
  type V3QueueCommitAuthority, type V3QueueConfirmation, type V3QueueStoragePort, type V3ManagedJobRecord } from './queue'

export const METHOD = { methodId: 'synthetic-method', revision: 1 }
export const ids = (kind: 'op3' | 'job3' | 'lease3', seed: string) => `${kind}_${sha256Hex(seed).slice(0, 32)}`
export const ref = (kind: string, seed: string) => `${kind}:v3:${sha256Hex(seed)}`
export function must<T>(result: V3ReadResult<T>): T { if (!result.ok) assert.fail(result.reason); return result.value }
function testClock() {
  let instant = Date.parse('2026-11-09T08:04:00.000Z')
  return { now: () => new Date(instant).toISOString(), advance: (ms: number) => { instant += ms },
    legalDate: () => new Date(instant).toISOString().slice(0, 10) }
}
function testMethod() {
  const receipts = new WeakMap<object, V3MethodRef>()
  const control = { enabled: true, revision: 1, checks: 0, beforeCheck: null as (() => void) | null }
  const port: V3MethodAuthorityPort<object> = {
    async resolveCurrent(method) {
      if (!control.enabled || method.methodId !== METHOD.methodId || method.revision !== control.revision) return { status: 'not_approved' }
      const receipt = Object.freeze({}); receipts.set(receipt, method)
      return { status: 'approved', receipt }
    },
    async reproveAtCommit(receipt, method) {
      control.checks++; control.beforeCheck?.()
      return control.enabled && method.revision === control.revision && schema2Kanonisch(receipts.get(receipt)) === schema2Kanonisch(method)
        ? { status: 'current' } : { status: 'revoked' }
    },
  }
  const isCurrent = (receipt: object, method: V3MethodRef) => control.enabled
    && method.methodId === METHOD.methodId && method.revision === control.revision
    && receipts.has(receipt) && schema2Kanonisch(receipts.get(receipt)) === schema2Kanonisch(method)
  return { port, control, isCurrent }
}

/** Atomic local test adapter, explicitly not a durable production store. */
class AtomicTestQueue implements V3QueueStoragePort {
  readonly records = new Map<string, V3ManagedJobRecord>()
  readonly operations = new Map<string, Extract<V3QueueConfirmation, { status: 'committed' }>>()
  readonly events: V3QueueCommit['audit'][] = []
  writes = 0
  loseNextResponse = false
  obscureConfirm = false
  unavailableReads = false
  beforeCommit: (() => Promise<void>) | null = null
  private tail: Promise<void> = Promise.resolve()
  constructor(readonly now: () => string) {}
  async read(jobKey: string) {
    await Promise.resolve()
    return this.unavailableReads ? { status: 'unavailable' as const }
      : { status: 'ok' as const, record: structuredClone(this.records.get(jobKey) ?? null) }
  }
  async confirm(operationId: string, commandKey: string): Promise<V3QueueConfirmation> {
    await Promise.resolve()
    if (this.obscureConfirm) return { status: 'unconfirmed' }
    const prior = this.operations.get(operationId)
    if (!prior) return { status: 'not_attempted' }
    return prior.commandKey === commandKey ? structuredClone(prior) : { status: 'collision' }
  }
  async compareAndSwap(commit: V3QueueCommit, authority: V3QueueCommitAuthority, signal: AbortSignal) {
    let release: () => void = () => {}
    const prior = this.tail
    this.tail = new Promise<void>((resolve) => { release = resolve })
    await prior
    try {
      const old = this.operations.get(commit.operationId)
      if (old) return old.commandKey === commit.commandKey ? structuredClone(old) : { status: 'collision' as const }
      if (schema2Kanonisch(this.records.get(commit.jobKey) ?? null) !== schema2Kanonisch(commit.expected)) return { status: 'mismatch' as const }
      await this.beforeCommit?.()
      if (signal.aborted || this.now() >= commit.notAfter || !await authority.reprove(signal)) return { status: 'unavailable' as const }
      const method = commit.next.kind === 'research_job_record' ? commit.next.method : commit.next.identity.method
      if (schema2Kanonisch(authority.method) !== schema2Kanonisch(method)) return { status: 'unavailable' as const }
      // Authoritative time guard is checked after the asynchronous method proof.
      if (signal.aborted || this.now() >= commit.notAfter
        || (commit.next.lease && commit.next.lease.expiresAt <= this.now())) return { status: 'unavailable' as const }
      this.writes++
      this.records.set(commit.jobKey, structuredClone(commit.next))
      const receipt = { status: 'committed' as const, operationId: commit.operationId, commandKey: commit.commandKey,
        record: structuredClone(commit.next) }
      this.operations.set(commit.operationId, receipt)
      this.events.push(structuredClone(commit.audit))
      if (this.loseNextResponse) { this.loseNextResponse = false; return { status: 'unconfirmed' as const } }
      return structuredClone(receipt)
    } finally { release() }
  }
}
export function queueHarness() {
  const clock = testClock(), method = testMethod(), storage = new AtomicTestQueue(clock.now)
  const options = { storage, methodAuthority: method.port, now: clock.now, invocationMilliseconds: 1000,
    backoffBaseMilliseconds: 100, backoffMaxMilliseconds: 400 }
  return { clock, method, storage, options, queue: createV3QueueCoordinator(options), discovery: createV3DiscoveryQueueCoordinator(options) }
}
export function fixture() {
  const context = must(readV3GlobalRuleContext({ scope: { destinationCountryCode: 'AQ', transitCountryCode: null,
    citizenship: { mode: 'required', countryCodes: ['CH'] }, credentialOption: { mode: 'not_applicable' },
    residence: { mode: 'not_applicable' }, requirementType: 'entry_form', validity: { mode: 'not_applicable' } },
  route: 'direct_entry', conditions: { status: 'unconditional' } }))
  const identity = must(createV3WorkIdentity({ context, method: METHOD, factKind: 'requirement_effect', researchReason: { status: 'missing' } }))
  const registryResult = quellenRegistryErstellen([
    { sourceId: 'synthetic-primary', sourceClass: 'official_authority', publisherName: 'Synthetic primary only',
      authorityName: 'Synthetic authority only', domains: ['primary.example'] },
    { sourceId: 'synthetic-counter', sourceClass: 'official_authority', publisherName: 'Synthetic counter only',
      authorityName: 'Synthetic counter authority only', domains: ['counter.example'] },
  ])
  assert.equal(registryResult.ok, true)
  if (!registryResult.ok) assert.fail('registry')
  const source = { sourceId: 'synthetic-primary', contentItemId: 'synthetic-publication', representationId: 'synthetic-original',
    contentItemVersion: 1, representationVersion: 1, identityProfileId: 'synthetic-profile', identityProfileVersion: 1 }
  const counterSource = { ...source, sourceId: 'synthetic-counter' }
  const graph = createContentIdentityGraph(registryResult.registry,
    [source, counterSource].map((item) => ({ sourceId: item.sourceId, contentItemId: item.contentItemId, contentItemVersion: 1, current: true,
      externalIdNamespace: 'synthetic', externalContentId: 'synthetic-publication', expectedPublisherIds: ['synthetic-publisher'], expectedAuthorityIds: ['synthetic-authority'] })),
    [source, counterSource].map((item) => ({ ...item, current: true,
      requestUrls: [`https://${item.sourceId === source.sourceId ? 'primary' : 'counter'}.example/rules`],
      expectedFinalUrl: `https://${item.sourceId === source.sourceId ? 'primary' : 'counter'}.example/rules`,
      expectedMediaType: 'text/plain', expectedLocale: null, expectedSchema: null })),
    [{ identityProfileId: 'synthetic-profile', identityProfileVersion: 1, current: true,
      verify: () => ({ ok: false as const, reason: 'identity_mismatch' as const }) }])
  assert.equal(graph.ok, true); if (!graph.ok) assert.fail('graph')
  const registry = { ...registryResult.registry, contentIdentity: graph.value }
  const lookup = contentEvidenceLookupV3(context.scope, { sourceId: source.sourceId, contentItemId: source.contentItemId, representationId: source.representationId })
  assert.equal(lookup.ok, true); if (!lookup.ok) assert.fail('lookup')
  const observation = { context, contextKey: identity.contextKey,
    fact: { schema: 1 as const, fact: { kind: 'requirement_effect' as const, effect: 'required' as const, visaMode: null } },
    evidence: { versionId: `ev2_${sha256Hex('synthetic-original').slice(0, 32)}`, lookupKey: lookup.value.key, source,
      sourceFingerprintProtocol: 1 as const, sourceContentHash: sha256Hex('synthetic-original'), retrievedAt: '2026-11-09T08:00:00.000Z',
      legalValidity: { status: 'specified' as const, validFrom: '2026-11-01', validUntil: '2026-12-31' } } }
  const decision = must(readV3SourceDecisionRecord({ schema: 3, kind: 'source_decision_record', reference: ref('source-decision', 'first'), predecessor: null,
    method: METHOD, context, contextKey: identity.contextKey, factKind: 'requirement_effect', evaluatedAt: '2026-11-09T08:01:00.000Z', legalAsOfDate: '2026-11-09',
    primary: { status: 'clear', observation, qualification: { reference: ref('destination-qualification', 'synthetic'), representedCountryCode: 'AQ',
      role: 'destination_authority', method: METHOD, evidenceVersionId: observation.evidence.versionId, checkedAt: '2026-11-09T08:01:00.000Z' } },
    counterCheck: { attemptPlanRevision: 1, attempts: [{ status: 'not_found', attemptedAt: '2026-11-09T08:01:00.000Z', source: null }] },
    knownConflicts: [], historyArchive: null, conclusion: 'clear_primary' }, registry))
  const operationId = ids('op3', 'first-version')
  const version = must(readV3RuleVersionRecord({ schema: 3, kind: 'rule_version_record', reference: ref('rule-version', 'first'), revision: 1,
    predecessor: null, state: 'accepted', method: METHOD, subject: observation, sourceDecisionRef: decision.reference,
    operationId, recordedAt: '2026-11-09T08:02:00.000Z' }, registry, decision))
  const transition = must(readV3TransitionPlan({ schema: 3, protocolRevision: 1, operationId, contextKey: identity.contextKey,
    method: METHOD, factKind: 'requirement_effect', action: 'accept', expected: { revision: 0, state: 'missing', versionRef: null },
    next: { revision: 1, state: 'accepted', versionRef: version.reference }, primaryEvidenceVersionId: observation.evidence.versionId,
    sourceDecisionRef: decision.reference, resolutionRefs: [], recoverFromVersionRef: null, invalidatedProjectionRefs: [],
    reproof: 'required_before_commit', commitConfirmation: 'required' }))
  return { registry, context, identity, source, counterSource, observation, decision, version, transition,
    enqueue: { context, method: METHOD, factKind: 'requirement_effect', researchReason: { status: 'missing' },
      operationId: ids('op3', 'enqueue'), jobId: ids('job3', 'job'), attemptLimit: 3 },
    discoveryEnqueue: { destinationCountryCode: 'AQ', citizenshipCountryCode: 'CH', method: METHOD,
      operationId: ids('op3', 'discovery-enqueue'), jobId: ids('job3', 'discovery-job'), attemptLimit: 3 },
    prepared: { proposalDigest: sha256Hex('synthetic-proposal'), decision, previousDecision: null, archiveAppend: null, version, transition,
      proposalDisposition: 'matched' as const, acceptance: 'not_committed' as const, reproof: 'required_before_commit' as const } }
}
