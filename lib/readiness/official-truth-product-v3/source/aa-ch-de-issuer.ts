import 'server-only'

import { performance } from 'node:perf_hooks'
import { immutable, ownRecord } from '@/lib/readiness/official-truth-autonomous-provenance-artifact'
import type { ContentIdentityBinding } from '@/lib/readiness/official-truth-content-identity'
import { readV3SourceDecisionRecord, type V3ReadClock, type V3SourceDecisionRecord } from '../contract'
import { hrs1Canonical, hrs1Clock, hrs1Data, hrs1Method, hrs1OriginalEvidence, hrs1Ref, hrs1Same, hrs1Time,
  type Hrs1Binding, type Hrs1Original, type Hrs1Verification } from '../result/contract'
import type { Hrs1ObservedSource, Hrs1SourceChallenge, Hrs1SourceCustodyIssuer, Hrs1SourceIssued } from '../result/source-proof'
import { AA_CH_DE_PUBLICATION, BERN_CH_DE_PUBLICATION, selectedAaChDeQualification,
  type AaChDeQualificationProgram, type AaChDeSourceRole } from './aa-ch-de-definition'
import { readAaChDeOwnedSources, readAaChDeOwnedSource, readBernChDeOwnedSource,
  inspectAaChDeOwnedOriginal, inspectAaChDeOwnedAttempt, type AaChDeOwnedOriginal,
  type AaChDeOwnedAttempt, type AaChDeOwnedRead } from './aa-ch-de-owned-read'
import { qualifyAaChDeOriginal, selectedAaChDeProgramForBinding, type AaChDeQualifiedData } from './aa-ch-de-qualification'

type NativePair = Readonly<{ primary: object; counter: object }>
type Held = {
  program: AaChDeQualificationProgram; binding: Hrs1Binding; native: NativePair;
  verification: Hrs1Verification; historical: boolean; finalized: Hrs1SourceIssued | null;
}
type HeldObservation = Readonly<{ program: AaChDeQualificationProgram; binding: Hrs1Binding;
  native: object; value: Hrs1ObservedSource }>
type CheckedPair = Readonly<{ primary: AaChDeQualifiedData; counter: AaChDeQualifiedData | null;
  attempt: AaChDeOwnedAttempt; attemptedAt: string }>
type DecisionParts = Pick<V3SourceDecisionRecord, 'primary' | 'counterCheck' | 'knownConflicts' | 'historyArchive' | 'conclusion'>
const issued = new WeakMap<object, Held>()
const observations = new WeakMap<object, HeldObservation>()
const copy = <T>(value: T): T => JSON.parse(hrs1Canonical(value)) as T
const clockNow = (binding: Hrs1Binding) => hrs1Clock(new Date().toISOString(), binding.legalTimeZone)
const representation = (source: ContentIdentityBinding) => ({ sourceId: source.sourceId,
  contentItemId: source.contentItemId, representationId: source.representationId })
const publicationFor = (role: AaChDeSourceRole) => role === 'primary' ? AA_CH_DE_PUBLICATION : BERN_CH_DE_PUBLICATION
const nativeReceipt = (read: AaChDeOwnedRead): object | null => read.status === 'read' ? read.receipt : read.attempt
const originalList = (pair: CheckedPair): readonly Hrs1Original[] => pair.counter
  ? [pair.primary.original, pair.counter.original] : [pair.primary.original]

function freshUntil(binding: Hrs1Binding, originals: readonly Hrs1Original[], attemptedAt: string): string {
  return [binding.activeUntilExclusive, ...[attemptedAt, ...originals.map(o => hrs1OriginalEvidence(o).retrievedAt)]
    .map(at => new Date(Date.parse(at) + binding.sourceMaxAgeMilliseconds).toISOString())].sort()[0]!
}
function currentClock(binding: Hrs1Binding, at: V3ReadClock): boolean {
  const actual = clockNow(binding)
  return !!actual && hrs1Same(at, hrs1Clock(at.now, binding.legalTimeZone))
    && at.now <= actual.now && at.legalDate === actual.legalDate
    && at.now >= binding.activeFrom && actual.now < binding.activeUntilExclusive
}
function validAttempt(receipt: object, role: AaChDeSourceRole): AaChDeOwnedAttempt | null {
  const attempt = inspectAaChDeOwnedAttempt(receipt)
  return attempt && attempt.role === role && attempt.requestUrl === publicationFor(role).url
    && hrs1Time(attempt.startedAt) && hrs1Time(attempt.completedAt) && attempt.startedAt <= attempt.completedAt
    ? attempt : null
}
function unavailableCounter(attempt: AaChDeOwnedAttempt): boolean {
  // A security/framing/identity refusal, local busy state or copied failure is
  // never converted to source unreachability. Only an actual joined attempt is.
  return attempt.status === 'unavailable' && ['dns_failed','http_failed','deadline'].includes(attempt.reason ?? '')
}
function qualifyHeldOriginal(receipt: object, role: AaChDeSourceRole, binding: Hrs1Binding,
  at: V3ReadClock, expected: Hrs1Original | null = null, historical = false): AaChDeQualifiedData | null {
  const raw = inspectAaChDeOwnedOriginal(receipt), attempt = validAttempt(receipt, role)
  if (!raw || !attempt || attempt.status !== 'read' || attempt.reason !== null || raw.role !== role
    || raw.startedAt !== attempt.startedAt || raw.retrievedAt !== attempt.completedAt
    || raw.retrievedAt > at.now || raw.requestUrl !== attempt.requestUrl || (expected && (raw.bodyText !== expected.bodyText
      || raw.rawDigest !== expected.rawDigest || expected.qualification.role !== role))) return null
  if (!expected) return qualifyAaChDeOriginal(raw, binding, at)
  const evidence = hrs1OriginalEvidence(expected), checked = hrs1Clock(expected.qualification.checkedAt, binding.legalTimeZone)
  if (!checked || (!historical && evidence.retrievedAt !== raw.retrievedAt)
    || (historical && (evidence.retrievedAt > raw.startedAt || checked.now > raw.startedAt))) return null
  const input: AaChDeOwnedOriginal = historical
    ? { ...raw, retrievedAt: evidence.retrievedAt, startedAt: evidence.retrievedAt } : raw
  const qualified = qualifyAaChDeOriginal(input, binding, checked)
  return qualified && hrs1Same(qualified.original, expected) ? qualified : null
}

function retainedConflicts(challenge: Pick<Hrs1SourceChallenge, 'history' | 'stickyDecision'>): V3SourceDecisionRecord['knownConflicts'] | null {
  const byReference = new Map<string, V3SourceDecisionRecord['knownConflicts'][number]>()
  for (const decision of [challenge.history.decision, challenge.stickyDecision]) {
    if (!decision) continue
    for (const conflict of decision.knownConflicts) {
      const prior = byReference.get(conflict.reference)
      if (prior && !hrs1Same({ ...prior, resolution: null }, { ...conflict, resolution: null })) return null
      if (prior?.resolution && !hrs1Same(prior.resolution, conflict.resolution)
        && conflict.resolution?.predecessor !== prior.resolution.reference) return null
      byReference.set(conflict.reference, conflict)
    }
  }
  return byReference.size <= 8 ? [...byReference.values()] : null
}

function parts(challenge: Pick<Hrs1SourceChallenge, 'history' | 'stickyDecision' | 'request'>,
  pair: CheckedPair, program: AaChDeQualificationProgram): DecisionParts | null {
  const knownConflicts = retainedConflicts(challenge)
  if (!knownConflicts || pair.attempt.role !== 'counter' || pair.attempt.requestUrl !== BERN_CH_DE_PUBLICATION.url
    || !hrs1Same(program.counterInventory.eligibleRepresentations, [program.counter.source])) return null
  const qualifiedPrimary = pair.primary.outcome
  let primary: V3SourceDecisionRecord['primary']
  if (qualifiedPrimary.status === 'clear') {
    const destination = { representedCountryCode: 'DE' as const, role: 'destination_authority' as const,
      method: program.method, evidenceVersionId: qualifiedPrimary.observation.evidence.versionId,
      checkedAt: pair.primary.original.qualification.checkedAt }
    primary = { ...qualifiedPrimary, qualification: { reference: hrs1Ref('destination-qualification', destination), ...destination } }
  } else primary = qualifiedPrimary
  let counter: V3SourceDecisionRecord['counterCheck']['attempts'][number]
  if (pair.counter === null) {
    if (!unavailableCounter(pair.attempt)) return null
    counter = { status: 'unreachable', attemptedAt: pair.attemptedAt, source: representation(program.counter.source) }
  } else if (pair.counter.outcome.status === 'unclear') {
    if (pair.attempt.status !== 'read' || pair.counter.original.qualification.checkedAt !== pair.attemptedAt) return null
    counter = { status: 'unclear', attemptedAt: pair.attemptedAt, source: representation(program.counter.source) }
  } else {
    if (pair.attempt.status !== 'read') return null
    const observed = pair.counter.outcome.observation
    const relation = qualifiedPrimary.status === 'clear'
      ? program.compare(qualifiedPrimary.observation, observed) : 'not_comparable'
    if (!['agrees','compatible','conflicts','not_comparable'].includes(relation)) return null
    const comparisonRef = hrs1Ref('source-comparison', { method: program.method, contextKey: program.contextKey,
      programRevision: program.revision, attemptPlanRevision: program.counterInventory.revision,
      primary: qualifiedPrimary, counter: observed, relation })
    const common = { attemptedAt: pair.attemptedAt, comparisonRef, observation: observed }
    if (relation === 'conflicts') {
      if (qualifiedPrimary.status !== 'clear') return null
      const conflictRef = hrs1Ref('source-conflict', { method: program.method, contextKey: program.contextKey,
        primary: qualifiedPrimary.observation, counter: observed })
      const existing = knownConflicts.find(conflict => conflict.reference === conflictRef)
      const conflict = { reference: conflictRef, detectedDecisionRef: challenge.request.decisionRef,
        detectedAt: pair.attemptedAt, primary: qualifiedPrimary.observation, counter: observed, resolution: null }
      if (existing) {
        if (!hrs1Same(existing.primary, conflict.primary) || !hrs1Same(existing.counter, conflict.counter)
          || existing.resolution !== null) return null
      } else knownConflicts.push(conflict)
      counter = { ...common, status: 'conflicts', conflictRef }
    } else if (relation === 'compatible') {
      counter = { ...common, status: 'compatible', method: program.method, reproof: 'required_before_acceptance' }
    } else counter = { ...common, status: relation }
  }
  if (knownConflicts.length > 8) return null
  return { primary, counterCheck: { attemptPlanRevision: program.counterInventory.revision, attempts: [counter] }, knownConflicts,
    historyArchive: challenge.stickyDecision?.historyArchive ?? challenge.history.decision?.historyArchive ?? null,
    conclusion: knownConflicts.some(conflict => conflict.resolution === null) ? 'comparable_conflict'
      : primary.status === 'clear' ? 'clear_primary' : 'primary_unclear' }
}

function requestMatches(challenge: Hrs1SourceChallenge, program: AaChDeQualificationProgram): boolean {
  if (!hrs1Data(challenge) || !ownRecord(challenge, ['binding','request','history','stickyDecision','suppressionEpoch'])
    || !hrs1Same(challenge.binding, program.binding)
    || !Number.isSafeInteger(challenge.suppressionEpoch) || challenge.suppressionEpoch < 0
    || !ownRecord(challenge.request, ['context','contextKey','factKind','references','method','clock','previousDecision','decisionRef'])
    || !ownRecord(challenge.history, ['pointer','version','decision','decisionPredecessor','decisionArchiveAppend','invalidatedProjectionRefs'])
    || !hrs1Same(challenge.request.context, program.context) || challenge.request.contextKey !== program.contextKey
    || challenge.request.factKind !== 'requirement_effect' || !hrs1Same(challenge.request.method, program.method)
    || !hrs1Same(challenge.request.previousDecision, challenge.history.decision)
    || (!hrs1Same(challenge.request.references, [representation(program.source)])
      && !hrs1Same(challenge.request.references, [representation(program.source), representation(program.counter.source)]))
    || !currentClock(challenge.binding, challenge.request.clock)) return false
  return true // the Bern attempt is mandatory even when a proposal cites only AA
}

function seal(binding: Hrs1Binding, native: NativePair, program: AaChDeQualificationProgram,
  verification: Hrs1Verification, historical = false): Hrs1SourceIssued {
  const receipt = Object.freeze(Object.create(null) as object)
  const value = immutable(copy(verification))
  issued.set(receipt, { program, binding: immutable(copy(binding)), native, verification: value, historical, finalized: null })
  return Object.freeze({ receipt, verification: value })
}

function requalify(h: Held, at: V3ReadClock): CheckedPair | null {
  const verification = h.verification, original = verification.originals[0], attempt = validAttempt(h.native.counter, 'counter')
  if (!original || !attempt || attempt.completedAt > at.now || verification.decision.counterCheck.attempts.length !== 1
    || verification.originals.length !== (attempt.status === 'read' ? 2 : 1)) return null
  const attemptedAt = verification.decision.counterCheck.attempts[0]!.attemptedAt
  if (!hrs1Time(attemptedAt) || (h.historical ? attemptedAt > attempt.startedAt : attemptedAt !== attempt.completedAt)
    || attemptedAt > at.now) return null
  const primary = qualifyHeldOriginal(h.native.primary, 'primary', h.binding, at, original, h.historical)
  const counter = attempt.status === 'read'
    ? qualifyHeldOriginal(h.native.counter, 'counter', h.binding, at, verification.originals[1]!, h.historical) : null
  if (!primary || (attempt.status === 'read' ? !counter : !unavailableCounter(attempt))
    || (counter && counter.original.qualification.checkedAt !== attemptedAt)) return null
  return { primary, counter, attempt, attemptedAt }
}

function validHeld(h: Held, verification: Hrs1Verification, at: V3ReadClock, signal: AbortSignal): boolean {
  if (signal.aborted || h.program !== selectedAaChDeProgramForBinding(h.binding)
    || !hrs1Data(verification) || !hrs1Same(h.verification, verification) || !currentClock(h.binding, at)
    || at.now < verification.decision.evaluatedAt || at.now >= verification.validUntilExclusive) return false
  const actual = clockNow(h.binding)
  if (!actual || actual.now >= verification.validUntilExclusive) return false
  const pair = requalify(h, at)
  const parsed = readV3SourceDecisionRecord(verification.decision, h.program.registry,
    verification.previousDecision, verification.archiveAppend)
  const selected = pair ? parts({ request: verification.request, history: verification.history,
    stickyDecision: verification.stickyDecision }, pair, h.program) : null
  if (!pair || !selected || !parsed.ok || !hrs1Same(parsed.value, verification.decision)
    || !hrs1Same(originalList(pair), verification.originals)
    || verification.validUntilExclusive !== freshUntil(h.binding, verification.originals, pair.attemptedAt)
    || !hrs1Same(selected, { primary: verification.decision.primary, counterCheck: verification.decision.counterCheck,
      knownConflicts: verification.decision.knownConflicts, historyArchive: verification.decision.historyArchive,
      conclusion: verification.decision.conclusion })) return false
  for (const original of verification.originals) if (original.observation !== null) {
    const validity = original.observation.evidence.legalValidity
    if (validity.status !== 'specified' || (validity.validFrom !== null && validity.validFrom > at.legalDate)
      || (validity.validUntil !== null && validity.validUntil < at.legalDate)) return false
  }
  return true
}

/** The sole production issuer owns both real originals and the real counter
 * attempt. There is no issuer constructor, receipt setter or profile injection. */
export const AA_CH_DE_SOURCE_CUSTODY_ISSUER: Hrs1SourceCustodyIssuer = Object.freeze<Hrs1SourceCustodyIssuer>({
  async inspect(challenge, signal) {
    try {
      if (!hrs1Data(challenge) || signal.aborted) return null
      const program = selectedAaChDeProgramForBinding(challenge.binding)
      if (!program || !requestMatches(challenge, program)) return null
      const heldChallenge = immutable(copy(challenge))
      const reads = await readAaChDeOwnedSources(signal, performance.now() + AA_CH_DE_PUBLICATION.maximumMilliseconds)
      const counterReceipt = nativeReceipt(reads.counter)
      if (reads.primary.status !== 'read' || !counterReceipt || signal.aborted) return null
      const native = Object.freeze({ primary: reads.primary.receipt, counter: counterReceipt })
      const at = clockNow(heldChallenge.binding), counterAttempt = validAttempt(counterReceipt, 'counter')
      const primaryAttempt = validAttempt(native.primary, 'primary')
      if (!at || !primaryAttempt || !counterAttempt || primaryAttempt.startedAt < heldChallenge.request.clock.now
        || counterAttempt.startedAt < heldChallenge.request.clock.now || counterAttempt.completedAt > at.now) return null
      const primary = qualifyHeldOriginal(native.primary, 'primary', heldChallenge.binding, at)
      const counterClock = hrs1Clock(counterAttempt.completedAt, heldChallenge.binding.legalTimeZone)
      const counter = counterAttempt.status === 'read' && counterClock
        ? qualifyHeldOriginal(native.counter, 'counter', heldChallenge.binding, counterClock) : null
      if (!primary || (counterAttempt.status === 'read' ? !counter : !unavailableCounter(counterAttempt))) return null
      const pair: CheckedPair = { primary, counter, attempt: counterAttempt, attemptedAt: counterAttempt.completedAt }
      const selected = parts(heldChallenge, pair, program)
      if (!selected) return null
      const decision = readV3SourceDecisionRecord({ schema: 3, kind: 'source_decision_record',
        reference: heldChallenge.request.decisionRef, predecessor: heldChallenge.history.decision?.reference ?? null,
        method: program.method, context: program.context, contextKey: program.contextKey, factKind: 'requirement_effect',
        evaluatedAt: at.now, legalAsOfDate: at.legalDate, ...selected }, program.registry, heldChallenge.history.decision, null)
      if (!decision.ok || signal.aborted) return null
      const originals = originalList(pair)
      const fields = { request: heldChallenge.request, decision: decision.value, previousDecision: heldChallenge.history.decision,
        archiveAppend: null, originals, history: heldChallenge.history, stickyDecision: heldChallenge.stickyDecision,
        suppressionEpoch: heldChallenge.suppressionEpoch, validUntilExclusive: freshUntil(heldChallenge.binding, originals, pair.attemptedAt) }
      const verification: Hrs1Verification = { reference: hrs1Ref('hrs1-verification', fields), ...fields }
      if (at.now >= verification.validUntilExclusive) return null
      return seal(heldChallenge.binding, native, program, verification)
    } catch { return null }
  },

  async finalize(receipt, inspection, decision, archiveAppend, at, signal) {
    try {
      const h = issued.get(receipt)
      if (!h || !validHeld(h, inspection, at, signal) || !hrs1Same(archiveAppend, inspection.archiveAppend)) return null
      const expectedDecision = { ...inspection.decision, evaluatedAt: at.now, legalAsOfDate: at.legalDate }
      const parsed = readV3SourceDecisionRecord(expectedDecision, h.program.registry, inspection.previousDecision, archiveAppend)
      if (!parsed.ok || !hrs1Same(parsed.value, decision)) return null
      const { reference: oldReference, ...previousFields } = inspection
      void oldReference
      const fields = { ...previousFields, decision: parsed.value }
      const verification = { ...fields, reference: hrs1Ref('hrs1-verification', fields) }
      if (h.finalized) return hrs1Same(h.finalized.verification, verification) ? h.finalized : null
      const finalized = seal(h.binding, h.native, h.program, verification, h.historical)
      h.finalized = finalized
      return finalized
    } catch { return null }
  },

  async reprove(receipt, verification, at, signal) {
    try { const h = issued.get(receipt); return h && validHeld(h, verification, at, signal) ? h.verification : null }
    catch { return null }
  },

  async reopen(verification, signal) {
    try {
      const selected = selectedAaChDeQualification()
      if (!selected || signal.aborted || !hrs1Data(verification)
        || !ownRecord(verification, ['reference','request','decision','previousDecision','archiveAppend','originals','history',
          'stickyDecision','suppressionEpoch','validUntilExclusive'])) return null
      const binding = selected.binding, program = selectedAaChDeProgramForBinding(binding), at = clockNow(binding)
      if (!program || !at || !Array.isArray(verification.originals) || verification.originals.length < 1
        || verification.originals.length > 2 || verification.archiveAppend !== null
        || !currentClock(binding, at) || !hrs1Time(verification.validUntilExclusive) || at.now >= verification.validUntilExclusive
        || verification.decision.counterCheck.attempts.length !== 1) return null
      const { reference, ...fields } = verification
      if (reference !== hrs1Ref('hrs1-verification', fields)
        || !requestMatches({ binding, request: verification.request, history: verification.history,
          stickyDecision: verification.stickyDecision, suppressionEpoch: verification.suppressionEpoch }, program)
        || !hrs1Same(verification.previousDecision, verification.history.decision)
        || !readV3SourceDecisionRecord(verification.decision, program.registry, verification.previousDecision, verification.archiveAppend).ok
        || verification.validUntilExclusive !== freshUntil(binding, verification.originals,
          verification.decision.counterCheck.attempts[0]!.attemptedAt)) return null
      // The consumer first reads this exact durable HRS attestation. These new
      // native operations reprove both origins, never the historical timestamps.
      // A now-readable counter cannot renew an old failed-attempt attestation.
      const reads = await readAaChDeOwnedSources(signal, performance.now() + AA_CH_DE_PUBLICATION.maximumMilliseconds)
      const counterReceipt = nativeReceipt(reads.counter)
      if (reads.primary.status !== 'read' || !counterReceipt || signal.aborted) return null
      const native = Object.freeze({ primary: reads.primary.receipt, counter: counterReceipt })
      const opened = seal(binding, native, program, verification, true), h = issued.get(opened.receipt)!
      const current = clockNow(binding)
      return current && validHeld(h, verification, current, signal) ? opened : null
    } catch { return null }
  },

  async observe(target, binding, signal) {
    try {
      const program = selectedAaChDeProgramForBinding(binding)
      if (!program || signal.aborted || !hrs1Data(target) || !hrs1Same(target.context, binding.context)
        || target.factKind !== binding.factKind || !['primary','counter'].includes(target.role)) return { status: 'unavailable' }
      const selected = target.role === 'primary' ? program : program.counter
      if (!hrs1Same(target.source, selected.source)) return { status: 'unavailable' }
      const heldTarget = immutable(copy(target))
      const read = await (target.role === 'primary' ? readAaChDeOwnedSource : readBernChDeOwnedSource)(
        signal, performance.now() + AA_CH_DE_PUBLICATION.maximumMilliseconds)
      if (read.status !== 'read') {
        const attempt = read.attempt ? validAttempt(read.attempt, target.role) : null
        return { status: !signal.aborted && attempt && unavailableCounter(attempt) ? 'unreachable' : 'unavailable' }
      }
      const at = clockNow(binding)
      const qualified = at ? qualifyHeldOriginal(read.receipt, target.role, binding, at) : null
      if (!qualified || !at || signal.aborted) return { status: 'unavailable' }
      const evidence = hrs1OriginalEvidence(qualified.original)
      const fields = { target: heldTarget, method: hrs1Method(binding),
        observation: { source: evidence.source, fingerprint: { sourceContentHash: evidence.sourceContentHash,
          sourceFingerprintProtocol: evidence.sourceFingerprintProtocol }, retrievedAt: evidence.retrievedAt },
        original: qualified.original, status: qualified.outcome.status === 'clear' ? 'observed' as const : 'unclear' as const,
        checkedAt: at.now }
      const value: Hrs1ObservedSource = immutable({ reference: hrs1Ref('hrs1-source-observation', fields), ...fields })
      const receipt = Object.freeze(Object.create(null) as object)
      observations.set(receipt, { program, binding: immutable(copy(binding)), native: read.receipt, value })
      return { receipt, value }
    } catch { return { status: 'unavailable' } }
  },

  async reproveObservation(receipt, value, at, signal) {
    try {
      const h = observations.get(receipt)
      if (!h || signal.aborted || h.program !== selectedAaChDeProgramForBinding(h.binding)
        || !hrs1Data(value) || !hrs1Same(h.value, value) || !currentClock(h.binding, at)) return null
      const checked = hrs1Clock(value.checkedAt, h.binding.legalTimeZone), current = clockNow(h.binding)
      if (!checked || !current || at.now < checked.now
        || current.now >= freshUntil(h.binding, [value.original], value.checkedAt)) return null
      const qualified = qualifyHeldOriginal(h.native, value.target.role, h.binding, checked, value.original)
      if (!qualified || !hrs1Same(qualified.original, value.original)
        || value.status !== (qualified.outcome.status === 'clear' ? 'observed' : 'unclear')) return null
      if (qualified.outcome.status === 'clear') {
        const validity = qualified.outcome.observation.evidence.legalValidity
        if (validity.status !== 'specified' || (validity.validFrom !== null && validity.validFrom > at.legalDate)
          || (validity.validUntil !== null && validity.validUntil < at.legalDate)) return null
      }
      return h.value
    } catch { return null }
  },
})
