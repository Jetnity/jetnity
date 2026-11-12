// HRS1 SOURCE-V1/A1: complete consumer; actual global production issuer is NOT selected.
// No legacy Same-request/capability path, source GET, environment flag or test issuer.
import 'server-only'
import { sha256Hex } from '@/lib/readiness/digest'
import { ownRecord, immutable } from '@/lib/readiness/official-truth-autonomous-provenance-artifact'
import { evidenceQuellenFingerprint } from '@/lib/readiness/evidence'
import { officialTruthSourceFingerprintV2 } from '@/lib/readiness/official-truth-source-fingerprint-v2'
import type { QuellenRegistry } from '@/lib/readiness/source-registry'
import { readV3SourceDecisionRecord, readV3ConflictArchiveRecord, type V3ReadClock, type V3SourceDecisionRecord, type V3SourceObservationRecord, type V3ConflictArchiveRecord } from '../contract'
import type { V3ImportEvidencePort, V3ImportVerificationRequest, V3ImportHistory } from '../import/service-server'
import type { V3SourceObservationPort, V3MonitorTarget } from '../monitor/monitor'
import {
  HRS1_LIMITS, hrs1Canonical, hrs1Data, hrs1Hash, hrs1Ref, hrs1Same, hrs1Time, hrs1Clock, hrs1Method, hrs1OriginalEvidence,
  type Hrs1Binding, type Hrs1Verification, type Hrs1FixedOperation, type Hrs1Original,
} from './contract'

export type Hrs1SourceChallenge = Readonly<{
  binding: Hrs1Binding; request: V3ImportVerificationRequest; history: V3ImportHistory;
  stickyDecision: V3SourceDecisionRecord | null; suppressionEpoch: number;
}>
export type Hrs1SourceIssued = Readonly<{ receipt: object; verification: Hrs1Verification }>
export type Hrs1ObservedSource = Readonly<{
  reference: string; target: V3MonitorTarget; method: ReturnType<typeof hrs1Method>;
  observation: Readonly<{ source: V3SourceObservationRecord['evidence']['source'];
    fingerprint: Readonly<{ sourceContentHash: string; sourceFingerprintProtocol: 1 | 2 }>; retrievedAt: string }>;
  original: Hrs1Original; status: 'observed' | 'unclear'; checkedAt: string;
}>
/** Future genuine issuer contract. Its object must be selected by a reviewed,
 * literal server import below. An arbitrary configured implementation is not a
 * production authority. Each receipt belongs to the issuer's private invocation
 * custody; reprove returns full checked facts, not a boolean or DTO certificate.
 * The issuer owns and joins its actual source/extractor/qualification work. */
export interface Hrs1SourceCustodyIssuer {
  inspect(challenge: Hrs1SourceChallenge, signal: AbortSignal): Promise<Hrs1SourceIssued | null>
  finalize(receipt: object, inspection: Hrs1Verification, decision: V3SourceDecisionRecord,
    archiveAppend: V3ConflictArchiveRecord | null, clock: V3ReadClock, signal: AbortSignal): Promise<Hrs1SourceIssued | null>
  reprove(receipt: object, verification: Hrs1Verification, clock: V3ReadClock, signal: AbortSignal): Promise<Hrs1Verification | null>
  reopen(verification: Hrs1Verification, signal: AbortSignal): Promise<Hrs1SourceIssued | null>
  observe(target: V3MonitorTarget, binding: Hrs1Binding, signal: AbortSignal): Promise<
    { receipt: object; value: Hrs1ObservedSource } | { status: 'unreachable' | 'unavailable' }>
  reproveObservation(receipt: object, value: Hrs1ObservedSource, clock: V3ReadClock, signal: AbortSignal): Promise<Hrs1ObservedSource | null>
}
// Root A1: the genuine global issuer is a separate selected source task. This
// nonexported selector has no caller setter, loader, environment path or issuer.
// Later integration must replace this literal with its independently gated import.
function selectedProductionIssuer(): Hrs1SourceCustodyIssuer | null { return null }

export type Hrs1SourceConsumer = Readonly<{
  available: boolean;
  evidence: V3ImportEvidencePort<object>;
  sources: V3SourceObservationPort<object>;
  openVerification(reference: string, signal: AbortSignal): Promise<{ receipt: object; verification: Hrs1Verification } | null>;
  reproveVerification(receipt: object, verification: Hrs1Verification, clock: V3ReadClock, signal: AbortSignal): Promise<boolean>;
  held(receipt: object): Hrs1Verification | null;
  lastObservation(target: V3MonitorTarget): Hrs1ObservedSource | null;
}>

function observations(value: unknown): V3SourceObservationRecord[] {
  const result: V3SourceObservationRecord[] = []
  function walk(v: unknown) {
    if (Array.isArray(v)) { for (const item of v) walk(item); return }
    if (!v || typeof v !== 'object') return
    const r = v as Record<string, unknown>
    if (r.context && r.contextKey && r.fact && r.evidence) result.push(r as unknown as V3SourceObservationRecord)
    else for (const child of Object.values(r)) walk(child)
  }
  walk(value); return result
}
function validOriginal(o: Hrs1Original, binding: Hrs1Binding): boolean {
  const ambiguous = o.observation === null
  const keys = ambiguous ? ['observation','ambiguity','bodyText','rawDigest','extraction','qualification']
    : ['observation','bodyText','rawDigest','extraction','qualification']
  if (!ownRecord(o, keys) || typeof o.bodyText !== 'string'
    || new TextEncoder().encode(o.bodyText).byteLength < 1 || new TextEncoder().encode(o.bodyText).byteLength > HRS1_LIMITS.originalBytes
    || o.rawDigest !== sha256Hex(o.bodyText)) return false
  const originalContext = ambiguous ? o.ambiguity : o.observation
  if (!hrs1Same(originalContext.context, binding.context) || originalContext.contextKey !== binding.contextKey
    || (!ambiguous && o.observation.fact.fact.kind !== binding.factKind)
    || (ambiguous && (!ownRecord(o.ambiguity, ['context','contextKey','evidence','reason'])
      || !['ambiguous_statement','unqualified_destination_authority','invalid_or_unknown_validity'].includes(o.ambiguity.reason)))
    || !ownRecord(o.extraction, ambiguous ? ['executableDigest','observation','ambiguity'] : ['executableDigest','observation'])
    || !hrs1Same(o.extraction.observation, o.observation)
    || (ambiguous && !hrs1Same(o.extraction.ambiguity, o.ambiguity))
    || !ownRecord(o.qualification, ['qualificationDigest','source','contextKey','method','checkedAt','role'])
    || !hrs1Same(o.qualification.method, hrs1Method(binding)) || o.qualification.contextKey !== binding.contextKey
    || !hrs1Time(o.qualification.checkedAt)) return false
  const e = hrs1OriginalEvidence(o)
  if (!hrs1Same(o.qualification.source, e.source) || o.qualification.checkedAt < e.retrievedAt) return false
  const selected = binding.sources.find(s => hrs1Same(s.source, e.source))
  if (!selected || o.extraction.executableDigest !== selected.executableDigest
    || o.qualification.qualificationDigest !== selected.qualificationDigest || o.qualification.role !== selected.role) return false
  const fingerprint = e.sourceFingerprintProtocol === 1 ? evidenceQuellenFingerprint(o.bodyText)
    : officialTruthSourceFingerprintV2(o.bodyText, { ...e.source, canonicalUrl: selected.canonicalUrl, contentType: selected.contentType })
  return fingerprint !== null && fingerprint === e.sourceContentHash
}
function readVerification(raw: unknown, binding: Hrs1Binding, registry: QuellenRegistry): Hrs1Verification | null {
  try {
    if (!hrs1Data(raw)) return null
    const row = ownRecord(raw, ['reference','request','decision','previousDecision','archiveAppend','originals','history','stickyDecision','suppressionEpoch','validUntilExclusive'])
    if (!row || row.reference !== hrs1Ref('hrs1-verification', Object.fromEntries(Object.entries(row).filter(([k]) => k !== 'reference')))
      || !Number.isSafeInteger(row.suppressionEpoch) || (row.suppressionEpoch as number) < 0
      || !hrs1Time(row.validUntilExclusive) || !Array.isArray(row.originals)
      || row.originals.length < 1 || row.originals.length > HRS1_LIMITS.originals) return null
    const v = JSON.parse(hrs1Canonical(row)) as Hrs1Verification
    const request = ownRecord(v.request, ['context','contextKey','factKind','references','method','clock','previousDecision','decisionRef'])
    if (!request || !hrs1Same(v.request.context, binding.context) || v.request.contextKey !== binding.contextKey
      || v.request.factKind !== binding.factKind || !hrs1Same(v.request.method, hrs1Method(binding))
      || !hrs1Same(v.request.previousDecision, v.previousDecision) || !hrs1Same(v.request.clock, hrs1Clock(v.request.clock.now, binding.legalTimeZone))
      || !Array.isArray(v.request.references) || v.request.references.length < 1 || v.request.references.length > 8
      || v.request.references.some(r => !binding.sources.some(s => s.source.sourceId === r.sourceId
        && s.source.contentItemId === r.contentItemId && s.source.representationId === r.representationId))) return null
    const decision = readV3SourceDecisionRecord(v.decision, registry, v.previousDecision, v.archiveAppend)
    if (!decision.ok || !hrs1Same(v.decision, decision.value) || v.decision.reference !== v.request.decisionRef
      || !hrs1Same(v.decision.context, binding.context) || v.decision.contextKey !== binding.contextKey
      || !hrs1Same(v.decision.method, hrs1Method(binding)) || v.decision.factKind !== binding.factKind
      || v.decision.evaluatedAt < v.request.clock.now
      || v.decision.legalAsOfDate !== hrs1Clock(v.decision.evaluatedAt, binding.legalTimeZone)?.legalDate
      || v.validUntilExclusive <= v.request.clock.now || (v.archiveAppend !== null && !readV3ConflictArchiveRecord(v.archiveAppend, registry).ok)
      || !ownRecord(v.history, ['pointer','version','decision','decisionPredecessor','decisionArchiveAppend','invalidatedProjectionRefs'])
      || !hrs1Same(v.previousDecision, v.history.decision)) return null
    const past = observations([v.previousDecision, v.history.decisionArchiveAppend, v.stickyDecision])
    const used = observations([v.decision, v.archiveAppend])
    const ids = new Set<string>()
    for (const original of v.originals) {
      const originalEvidence = hrs1OriginalEvidence(original)
      const usedHere = original.observation === null
        ? (original.qualification.role === 'primary'
          ? v.decision.primary.status === 'unclear' && v.decision.primary.reason === original.ambiguity.reason
            && hrs1Same(v.decision.primary.evidence, originalEvidence)
          : original.qualification.role === 'counter'
            && binding.sources.some(s => s.role === 'counter' && hrs1Same(s.source, originalEvidence.source))
            && v.decision.counterCheck.attempts.filter(a => a.status === 'unclear'
              && hrs1Same(a.source, { sourceId: originalEvidence.source.sourceId,
                contentItemId: originalEvidence.source.contentItemId, representationId: originalEvidence.source.representationId })
              && a.attemptedAt === original.qualification.checkedAt).length === 1)
        : used.some(o => hrs1Same(o, original.observation))
      if (!validOriginal(original, binding) || ids.has(originalEvidence.versionId) || !usedHere
        || Date.parse(v.validUntilExclusive) > Date.parse(originalEvidence.retrievedAt) + binding.sourceMaxAgeMilliseconds) return null
      ids.add(originalEvidence.versionId)
    }
    // Old bounded pages remain exact durable references; they are not recopied
    // or removed merely to fit this command's new-original bound.
    for (const observed of used) {
      if (!v.originals.some(o => o.observation !== null && hrs1Same(o.observation, observed)) && !past.some(o => hrs1Same(o, observed))) return null
    }
    if (v.decision.primary.status === 'unclear' && v.decision.primary.evidence !== null
      && !v.originals.some(o => hrs1Same(hrs1OriginalEvidence(o), v.decision.primary.status === 'unclear' ? v.decision.primary.evidence : null))) return null
    if (v.stickyDecision) for (const old of v.stickyDecision.knownConflicts) {
      const retained = v.decision.knownConflicts.find(c => c.reference === old.reference)
      if (!retained || !hrs1Same({ ...retained, resolution: null }, { ...old, resolution: null })
        || (old.resolution && !hrs1Same(old.resolution, retained.resolution) && retained.resolution?.predecessor !== old.resolution.reference)) return null
    }
    return immutable(v)
  } catch { return null }
}
/** There is deliberately no exported issuer/test-token constructor. Native owns
 * its fixture's private WeakMap and actual PG17/lifetime guard in native.ts.
 * A fixture implementation is considered only for literal synthetic bindings
 * with exclusively .example sources. It can never activate official_projection. */
export function createHrs1SourceConsumer(input: Readonly<{
  binding: Hrs1Binding; registry: QuellenRegistry; fixed: Hrs1FixedOperation; clock: () => V3ReadClock;
  fixtureIssuer?: Hrs1SourceCustodyIssuer | null;
}>): Hrs1SourceConsumer {
  const { binding, registry, fixed, clock } = input
  const issuer = binding.dataMode === 'official_projection' ? selectedProductionIssuer()
    : binding.sources.every(s => new URL(s.canonicalUrl).hostname.endsWith('.example')) ? input.fixtureIssuer ?? null : null
  const held = new WeakMap<object, { issuerReceipt: object; verification: Hrs1Verification; finalized: boolean }>()
  const observed = new WeakMap<object, { issuerReceipt: object; value: Hrs1ObservedSource }>()
  const last = new Map<string, Hrs1ObservedSource>() // one invocation, <=8 exact selected sources
  const command = (operation: 'history' | 'evidence' | 'attest', body: Record<string, unknown>) =>
    ({ schema: 1 as const, operation, bindingHash: hrs1Hash(binding), body })
  function ownReceipt(issuerReceipt: object, verification: Hrs1Verification, finalized = true): object {
    const receipt = Object.freeze(Object.create(null) as object)
    held.set(receipt, { issuerReceipt, verification, finalized }); return receipt
  }
  async function reprove(receipt: object, verification: Hrs1Verification, at: V3ReadClock, signal: AbortSignal): Promise<boolean> {
    const h = receipt && held.get(receipt)
    if (!issuer || !h || !h.finalized || !hrs1Same(h.verification, verification) || signal.aborted
      || !hrs1Same(at, hrs1Clock(at.now, binding.legalTimeZone)) || at.now >= verification.validUntilExclusive) return false
    const actual = await issuer.reprove(h.issuerReceipt, verification, at, signal)
    const parsed = readVerification(actual, binding, registry)
    if (!parsed || !hrs1Same(parsed, verification) || signal.aborted) return false
    const stored = await fixed(command('evidence', { reference: verification.reference }), signal)
    const end = clock()
    return stored.status === 'inspected' && hrs1Same(stored.value, verification) && !signal.aborted
      && hrs1Same(end, hrs1Clock(end.now, binding.legalTimeZone)) && end.now >= at.now
      && end.legalDate === at.legalDate && end.now < verification.validUntilExclusive
  }
  const evidence: V3ImportEvidencePort<object> = Object.freeze({
    async inspect(request, signal) {
      if (!issuer || signal.aborted || !hrs1Same(request.context, binding.context) || request.contextKey !== binding.contextKey
        || request.factKind !== binding.factKind || !hrs1Same(request.method, hrs1Method(binding))) return { status: 'unavailable' }
      const history = await fixed(command('history', { contextKey: binding.contextKey, factKind: binding.factKind }), signal)
      const snapshot = history.status === 'snapshot' && ownRecord(history.value, ['history','head','stickyDecision','suppressionEpoch','generation','suppression'])
      if (!snapshot || !hrs1Same((snapshot.history as V3ImportHistory).decision, request.previousDecision) || signal.aborted) return { status: 'unavailable' }
      const challenge: Hrs1SourceChallenge = immutable({ binding, request, history: snapshot.history as V3ImportHistory,
        stickyDecision: snapshot.stickyDecision as V3SourceDecisionRecord | null, suppressionEpoch: snapshot.suppressionEpoch as number })
      const issued = await issuer.inspect(challenge, signal)
      if (!issued || !issued.receipt || typeof issued.receipt !== 'object') return { status: 'unavailable' }
      const v = readVerification(issued.verification, binding, registry)
      if (!v || !hrs1Same(v.request, request) || !hrs1Same(v.history, challenge.history)
        || !hrs1Same(v.stickyDecision, challenge.stickyDecision) || v.suppressionEpoch !== challenge.suppressionEpoch) return { status: 'unavailable' }
      const verified = await issuer.reprove(issued.receipt, v, clock(), signal)
      if (!hrs1Same(verified, v) || signal.aborted) return { status: 'unavailable' }
      // I1 constructs its exact decision AFTER this await with a fresh clock.
      // Keep private source parts, originals and their absolute expiry; no durable
      // finalized decision is minted before that actual I1 reproof step.
      const receipt = ownReceipt(issued.receipt, v, false)
      return { status: 'inspected', receipt, parts: { primary: v.decision.primary, counterCheck: v.decision.counterCheck,
        knownConflicts: v.decision.knownConflicts, historyArchive: v.decision.historyArchive },
        archiveAppend: v.archiveAppend, validUntilExclusive: v.validUntilExclusive }
    },
    async reprove(receipt, request, decision, archive, at, signal) {
      const h = held.get(receipt)
      if (!issuer || !h || !hrs1Same(h.verification.request, request)
        || !hrs1Same(h.verification.archiveAppend, archive)
        || !hrs1Same(at, hrs1Clock(at.now, binding.legalTimeZone))
        || at.now < h.verification.decision.evaluatedAt || at.now >= h.verification.validUntilExclusive) return { status: 'changed' }
      if (!h.finalized) {
        const inspection = h.verification, parts = inspection.decision
        // These are exactly I1's deterministic decision fields from its original
        // request/history, privately held source parts and actual checked clock.
        const expectedDecision = {
          schema: 3, kind: 'source_decision_record', reference: request.decisionRef,
          predecessor: inspection.previousDecision?.reference ?? null, method: request.method,
          context: request.context, contextKey: request.contextKey, factKind: request.factKind,
          evaluatedAt: at.now, legalAsOfDate: at.legalDate,
          primary: parts.primary, counterCheck: parts.counterCheck, knownConflicts: parts.knownConflicts,
          historyArchive: parts.historyArchive, conclusion: parts.conclusion,
        }
        const parsedDecision = readV3SourceDecisionRecord(expectedDecision, registry, inspection.previousDecision, archive)
        if (!parsedDecision.ok || !hrs1Same(parsedDecision.value, decision)) return { status: 'changed' }
        const finalized = await issuer.finalize(h.issuerReceipt, inspection, parsedDecision.value, archive, at, signal)
        if (!finalized || !finalized.receipt || typeof finalized.receipt !== 'object' || signal.aborted) return { status: 'unavailable' }
        const expectedFields = { ...inspection, decision: parsedDecision.value }
        const { reference: ignoredReference, ...withoutReference } = expectedFields
        void ignoredReference
        const expected = { ...withoutReference, reference: hrs1Ref('hrs1-verification', withoutReference) }
        const actual = readVerification(finalized.verification, binding, registry)
        if (!actual || !hrs1Same(actual, expected)
          || !hrs1Same(await issuer.reprove(finalized.receipt, actual, at, signal), actual) || signal.aborted) return { status: 'unavailable' }
        const stored = await fixed(command('attest', { kind: 'verification', verification: actual }), signal)
        if (stored.status !== 'recorded' || !hrs1Same(stored.value, { reference: actual.reference, digest: hrs1Hash(actual) }) || signal.aborted) return { status: 'unavailable' }
        h.issuerReceipt = finalized.receipt; h.verification = actual; h.finalized = true
      }
      if (!hrs1Same(h.verification.decision, decision)) return { status: 'changed' }
      return await reprove(receipt, h.verification, at, signal) ? { status: 'current' } : { status: 'unavailable' }
    },
  })
  const sources: V3SourceObservationPort<object> = Object.freeze({
    async observe(target, method, signal) {
      if (!issuer || signal.aborted || !hrs1Same(target.context, binding.context) || !hrs1Same(method, hrs1Method(binding))) return { status: 'unavailable' }
      const result = await issuer.observe(target, binding, signal)
      if (!('receipt' in result)) return result
      const value = result.value
      if (!hrs1Data(value) || !ownRecord(value, ['reference','target','method','observation','original','status','checkedAt'])
        || !hrs1Same(value.target, target) || !hrs1Same(value.method, method)
        || value.reference !== hrs1Ref('hrs1-source-observation', Object.fromEntries(Object.entries(value).filter(([k]) => k !== 'reference')))
        || !validOriginal(value.original, binding) || !hrs1Same(value.observation.source, target.source)
        || !hrs1Same(hrs1OriginalEvidence(value.original).source, target.source)
        || !hrs1Same(value.observation.fingerprint, { sourceContentHash: hrs1OriginalEvidence(value.original).sourceContentHash,
          sourceFingerprintProtocol: hrs1OriginalEvidence(value.original).sourceFingerprintProtocol })
        || value.observation.retrievedAt !== hrs1OriginalEvidence(value.original).retrievedAt
        || (value.status === 'observed' && value.original.observation === null)
        || (value.status === 'unclear' && value.original.observation !== null)
        || !hrs1Time(value.checkedAt) || !['observed','unclear'].includes(value.status)
        || !hrs1Same(await issuer.reproveObservation(result.receipt, value, clock(), signal), value) || signal.aborted) return { status: 'unavailable' }
      const stored = await fixed(command('attest', { kind: 'observation', verification: value }), signal)
      if (stored.status !== 'recorded' || !hrs1Same(stored.value, { reference: value.reference, digest: hrs1Hash(value) }) || signal.aborted) return { status: 'unavailable' }
      const receipt = Object.freeze(Object.create(null) as object)
      observed.set(receipt, { issuerReceipt: result.receipt, value: immutable(value) })
      last.set(hrs1Hash(target), immutable(value))
      return value.status === 'unclear' ? { status: 'unclear', receipt } : { status: 'observed', observation: value.observation, receipt }
    },
    async reprove(receipt, target, method, checkedAt, signal) {
      const h = observed.get(receipt), at = hrs1Clock(checkedAt, binding.legalTimeZone)
      if (!issuer || !h || !at || !hrs1Same(h.value.target, target) || !hrs1Same(h.value.method, method) || signal.aborted) return false
      return hrs1Same(await issuer.reproveObservation(h.issuerReceipt, h.value, at, signal), h.value) && !signal.aborted
    },
  })
  return Object.freeze({
    available: issuer !== null, evidence, sources, reproveVerification: reprove,
    held(receipt) { const h = held.get(receipt); return h?.finalized ? h.verification : null },
    lastObservation(target) { return last.get(hrs1Hash(target)) ?? null },
    async openVerification(reference, signal) {
      if (!issuer || signal.aborted) return null
      const stored = await fixed(command('evidence', { reference }), signal)
      const v = stored.status === 'inspected' ? readVerification(stored.value, binding, registry) : null
      if (!v) return null
      const issued = await issuer.reopen(v, signal)
      if (!issued || !hrs1Same(issued.verification, v) || !issued.receipt || typeof issued.receipt !== 'object') return null
      const receipt = ownReceipt(issued.receipt, v)
      return await reprove(receipt, v, clock(), signal) ? { receipt, verification: v } : null
    },
  })
}
