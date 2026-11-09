import assert from 'node:assert/strict'
import { describe, test } from 'node:test'
import { sha256Hex } from '@/lib/readiness/digest'
import { schema2Kanonisch } from '@/lib/readiness/regulierungs-anwendbarkeit'
import { contentEvidenceLookupV3 } from '@/lib/readiness/official-truth-content-identity'
import { readV3SourceDecisionRecord, readV3RuleVersionRecord, readV3TransitionPlan } from '../contract'
import { commitV3PreparedTransition, type V3PreparedTransition, type V3VersionCommitPort,
  type V3TransitionProofPort, type V3VersionHead, type V3TransitionConfirmation,
  type V3AtomicVersionBoundaryPort, type V3TransitionAtomicCommand, type V3TransitionProofState } from './recovery'
import { fixture, queueHarness, ref, ids, must } from './test-support'

function harness() {
  const f = fixture(), h = queueHarness()
  const operations = new Map<string, V3TransitionConfirmation>(), versions = new Map<string, V3PreparedTransition['version']>()
  const archives = new Map<string, NonNullable<V3PreparedTransition['archiveAppend']>>()
  const receipts = new WeakMap<object, { preparedKey: string; proofEpoch: number; archiveEpoch: number }>()
  const control = { head: { pointer: f.transition.expected, sourceDecisionRef: null, historyArchive: null } as V3VersionHead,
    commitCount: 0, atomicChecks: 0, proofValid: true, archiveValid: true, proofEpoch: 1, archiveEpoch: 1,
    unsupported: false, hideConfirm: false, corruptConfirmation: false, legalDateOverride: null as string | null,
    lostCommitResponse: false, failReadAfterCommit: false, freshness: '2026-11-09T09:00:00.000Z',
    beforeCommit: null as (() => Promise<void>) | null }
  const legalDate = () => control.legalDateOverride ?? h.clock.legalDate()
  const proofCurrent = (receipt: object, prepared: V3PreparedTransition) => {
    const actual = receipts.get(receipt)
    return control.proofValid && control.archiveValid && actual?.preparedKey === sha256Hex(schema2Kanonisch(prepared))
      && actual.proofEpoch === control.proofEpoch && actual.archiveEpoch === control.archiveEpoch
      && schema2Kanonisch(prepared.version.subject.fact) === schema2Kanonisch(f.observation.fact)
      && (prepared.transition.action !== 'recover' || versions.has(prepared.transition.recoverFromVersionRef!))
  }
  const proofs: V3TransitionProofPort<object> = {
    async inspect(prepared) {
      if (!control.proofValid || !control.archiveValid
        || schema2Kanonisch(prepared.version.subject.fact) !== schema2Kanonisch(f.observation.fact)) return { status: 'invalid' }
      if (prepared.transition.action === 'recover' && !versions.has(prepared.transition.recoverFromVersionRef!)) return { status: 'invalid' }
      const receipt = Object.freeze({}); receipts.set(receipt, { preparedKey: sha256Hex(schema2Kanonisch(prepared)),
        proofEpoch: control.proofEpoch, archiveEpoch: control.archiveEpoch })
      return { status: 'verified', receipt }
    },
    async reprove(receipt, prepared) {
      return proofCurrent(receipt, prepared) ? { status: 'current', freshUntil: control.freshness } : { status: 'invalid' }
    },
  }
  // A single mutex serializes BOTH mutations and current confirmations. The
  // actual receipt maps and authority/head clocks are inspected synchronously
  // after the last awaited proof; no pre-await boolean authorizes the operation.
  let tail = Promise.resolve()
  async function locked<T>(run: () => Promise<T>): Promise<T> {
    let release: () => void = () => {}; const previous = tail
    tail = new Promise<void>((resolve) => { release = resolve }); await previous
    try { return await run() } finally { release() }
  }
  function actualAuthority(command: V3TransitionAtomicCommand, proof: V3TransitionProofState, signal: AbortSignal): boolean {
    control.atomicChecks++
    const p = command.prepared, at = h.clock.now(), date = legalDate(), validity = p.version.subject.evidence.legalValidity
    return !signal.aborted && at < command.notAfter && p.version.recordedAt <= at
      && proof.status === 'current' && proof.freshUntil === control.freshness && control.freshness > at
      && schema2Kanonisch(command.authority.method) === schema2Kanonisch(p.transition.method)
      && h.method.isCurrent(command.authority.methodReceipt, p.transition.method)
      && proofCurrent(command.authority.proofReceipt, p)
      && (p.version.state !== 'accepted' || (p.decision.legalAsOfDate === date && validity.status === 'specified'
        && (validity.validFrom === null || validity.validFrom <= date) && (validity.validUntil === null || validity.validUntil >= date)))
  }
  const boundary: V3AtomicVersionBoundaryPort = {
    async commit(command, signal) {
      return locked(async () => {
        const existing = operations.get(command.prepared.transition.operationId)
        if (existing) return { status: existing.operationKey === command.operationKey ? 'commit_reported' : 'unavailable' }
        if (control.unsupported) return { status: 'unsupported' }
        await control.beforeCommit?.()
        const proof = await command.reprove(signal)
        if (!actualAuthority(command, proof, signal)) return { status: 'unavailable' }
        if (schema2Kanonisch(control.head) !== schema2Kanonisch(command.expectedHead)) return { status: 'stale_head' }
        const p = command.prepared
        if (p.archiveAppend && p.archiveAppend.predecessor && !archives.has(p.archiveAppend.predecessor.reference)) return { status: 'unavailable' }
        if (p.archiveAppend && archives.has(p.archiveAppend.head.reference)) return { status: 'unavailable' }
        // One synchronous atomic test commit publishes all state together.
        if (p.archiveAppend) archives.set(p.archiveAppend.head.reference, structuredClone(p.archiveAppend))
        versions.set(p.version.reference, structuredClone(p.version))
        control.head = { pointer: p.transition.next, sourceDecisionRef: p.decision.reference, historyArchive: p.decision.historyArchive }
        const confirmation: V3TransitionConfirmation = { operationId: p.transition.operationId, operationKey: command.operationKey,
          versionRef: p.version.reference, sourceDecisionRef: p.decision.reference, revision: p.version.revision, state: p.version.state,
          auditRef: ref('rule-audit', command.operationKey), committedAt: h.clock.now(), historyArchive: p.decision.historyArchive,
          invalidatedProjectionRefs: p.transition.invalidatedProjectionRefs }
        operations.set(p.transition.operationId, confirmation); control.commitCount++
        if (control.lostCommitResponse) { control.lostCommitResponse = false; return { status: 'unconfirmed' } }
        return { status: 'commit_reported' }
      })
    },
    async confirmCurrent(command, signal) {
      return locked(async () => {
        if (control.unsupported) return { status: 'unsupported' }
        if (control.hideConfirm || control.failReadAfterCommit) return { status: 'unconfirmed' }
        const proof = await command.reprove(signal)
        if (!actualAuthority(command, proof, signal)
          || schema2Kanonisch(control.head) !== schema2Kanonisch(command.expectedHead)) return { status: 'not_current' }
        const prior = operations.get(command.prepared.transition.operationId)
        if (!prior || prior.operationKey !== command.operationKey
          || schema2Kanonisch(versions.get(prior.versionRef)) !== schema2Kanonisch(command.prepared.version)) return { status: 'unconfirmed' }
        const operation = control.corruptConfirmation ? { ...prior, versionRef: ref('rule-version', 'forged-confirmation') } : prior
        return { status: 'current', confirmation: { operation: structuredClone(operation), head: structuredClone(control.head),
          method: structuredClone(command.authority.method), checkedAt: h.clock.now(), legalDate: legalDate(), freshUntil: control.freshness } }
      })
    },
  }
  const store: V3VersionCommitPort = {
    async confirm(operationId, operationKey) {
      const existing = operations.get(operationId)
      if (existing && control.hideConfirm) return { status: 'unconfirmed' }
      if (!existing) return { status: 'not_attempted' }
      if (existing.operationKey !== operationKey) return { status: 'collision' }
      return { status: 'committed', confirmation: structuredClone(existing) }
    },
    async readHead() {
      if (control.failReadAfterCommit && control.commitCount > 0) return { status: 'unavailable' }
      return { status: 'current', head: structuredClone(control.head) }
    },
    atomicBoundary: boundary,
  }
  return { f, h, control, operations, versions, archives, store, proofs, boundary,
    deps: { registry: f.registry, store, proofs, methodAuthority: h.method.port, now: h.clock.now,
      legalDate, invocationMilliseconds: 1000 } }
}

function nextPrepared(t: ReturnType<typeof harness>, prior: V3PreparedTransition, action: 'withdraw' | 'recover' | 'reaccept' | 'accept'): V3PreparedTransition {
  const serial = prior.version.revision + 1, at = t.h.clock.now()
  const subject = action === 'withdraw' ? prior.version.subject : { ...prior.version.subject, evidence: { ...prior.version.subject.evidence,
    versionId: `ev2_${sha256Hex(`fresh-${serial}`).slice(0, 32)}`, retrievedAt: at } }
  const qualification = t.f.decision.primary.status === 'clear' ? t.f.decision.primary.qualification : assert.fail('primary')
  const primary = action === 'withdraw' ? { status: 'unclear' as const, reason: 'missing' as const, evidence: null }
    : { status: 'clear' as const, observation: subject, qualification: { ...qualification, evidenceVersionId: subject.evidence.versionId, checkedAt: at } }
  const decision = must(readV3SourceDecisionRecord({ ...prior.decision, reference: ref('source-decision', `next-${serial}`),
    predecessor: prior.decision.reference, primary, evaluatedAt: at, legalAsOfDate: t.h.clock.legalDate(),
    conclusion: action === 'withdraw' ? 'primary_unclear' : 'clear_primary' }, t.f.registry, prior.decision))
  const operationId = ids('op3', `next-${serial}`), state = action === 'withdraw' ? 'withdrawn' : 'accepted'
  const version = must(readV3RuleVersionRecord({ ...prior.version, reference: ref('rule-version', `next-${serial}`),
    revision: serial, predecessor: prior.version.reference, state, subject, sourceDecisionRef: decision.reference,
    operationId, recordedAt: at }, t.f.registry, decision))
  const transition = must(readV3TransitionPlan({ ...prior.transition, action, operationId, expected: prior.transition.next,
    next: { revision: serial, state, versionRef: version.reference }, sourceDecisionRef: decision.reference,
    primaryEvidenceVersionId: subject.evidence.versionId, resolutionRefs: [],
    recoverFromVersionRef: action === 'recover' ? t.f.version.reference : null,
    invalidatedProjectionRefs: [ref('rule-projection', `prior-${serial - 1}`)] }))
  return { ...prior, decision, previousDecision: prior.decision, version, transition, archiveAppend: null }
}

describe('M1 exact version transitions and actual commit confirmation', () => {
  test('prepared records require separate proof and actual commit plus canonical current-head confirmation', async () => {
    const t = harness(), result = await commitV3PreparedTransition(t.f.prepared, t.deps)
    assert.equal(result.status, 'confirmed'); if (result.status !== 'confirmed') assert.fail()
    assert.equal(result.version.reference, t.f.version.reference); assert.equal(result.replayed, false)
    assert.equal(t.control.commitCount, 1); assert.equal(t.versions.size, 1); assert.equal(t.operations.size, 1)
  })
  test('two concurrent versions on the same missing predecessor cannot both become the head', async () => {
    const t = harness()
    const other = { ...t.f.prepared, version: { ...t.f.version, reference: ref('rule-version', 'other'), operationId: ids('op3', 'other') },
      transition: { ...t.f.transition, operationId: ids('op3', 'other'), next: { ...t.f.transition.next, versionRef: ref('rule-version', 'other') } } }
    const results = await Promise.all([commitV3PreparedTransition(t.f.prepared, t.deps), commitV3PreparedTransition(other, t.deps)])
    assert.equal(results.filter((result) => result.status === 'confirmed').length, 1)
    assert.ok(results.some((result) => result.status === 'stale_head')); assert.equal(t.control.commitCount, 1)
  })
  test('unknown commit is confirmed on retry without a second mutation, and stays unconfirmed while custody is obscured', async () => {
    const t = harness(); t.control.lostCommitResponse = true
    assert.equal((await commitV3PreparedTransition(t.f.prepared, t.deps)).status, 'unconfirmed')
    assert.equal(t.control.commitCount, 1)
    t.control.hideConfirm = true
    assert.equal((await commitV3PreparedTransition(t.f.prepared, t.deps)).status, 'unconfirmed'); assert.equal(t.control.commitCount, 1)
    t.control.hideConfirm = false
    const result = await commitV3PreparedTransition(t.f.prepared, t.deps)
    assert.equal(result.status, 'confirmed'); if (result.status === 'confirmed') assert.equal(result.replayed, true)
    assert.equal(t.control.commitCount, 1)
  })
  for (const mode of ['head', 'method', 'freshness', 'method_before_commit'] as const) {
    test(`R1 root final-await regression: ${mode}`, async () => {
      const t = harness(), original = t.proofs.reprove.bind(t.proofs)
      let calls = 0
      t.proofs.reprove = async (...args) => {
        const value = await original(...args); calls++
        if (calls === (mode === 'method_before_commit' ? 2 : 3)) {
          await Promise.resolve()
          if (mode === 'head') t.control.head = { ...t.control.head,
            pointer: { ...t.control.head.pointer, versionRef: ref('rule-version', 'newer-at-final-await') } }
          if (mode === 'method' || mode === 'method_before_commit') t.h.method.control.enabled = false
          if (mode === 'freshness') t.h.clock.advance(3_600_001)
        }
        return value
      }
      const result = await commitV3PreparedTransition(t.f.prepared, t.deps)
      assert.notEqual(result.status, 'confirmed')
      assert.equal(result.status, mode === 'method_before_commit' ? 'unavailable' : 'committed_not_current')
      assert.equal(t.control.commitCount, mode === 'method_before_commit' ? 0 : 1)
      assert.equal(calls, mode === 'method_before_commit' ? 2 : 3)
      assert.ok(t.control.atomicChecks > 0)
    })
  }
  test('R1 current proof and legal-date changes during the final awaited reproof cannot pass', async () => {
    for (const mode of ['proof_epoch', 'archive_epoch', 'legal_date'] as const) {
      const t = harness(), original = t.proofs.reprove.bind(t.proofs)
      let calls = 0
      t.proofs.reprove = async (...args) => {
        const value = await original(...args)
        if (++calls === 3) {
          await Promise.resolve()
          if (mode === 'proof_epoch') t.control.proofEpoch++
          if (mode === 'archive_epoch') t.control.archiveEpoch++
          if (mode === 'legal_date') t.control.legalDateOverride = '2026-11-10'
        }
        return value
      }
      assert.equal((await commitV3PreparedTransition(t.f.prepared, t.deps)).status, 'committed_not_current')
      assert.equal(t.control.commitCount, 1)
    }
  })
  test('R1 end clock and legal date are checked after the atomic confirmation Promise settles', async () => {
    for (const mode of ['clock', 'legal_date'] as const) {
      const t = harness(), original = t.boundary.confirmCurrent.bind(t.boundary)
      t.boundary.confirmCurrent = async (...args) => {
        const result = await original(...args)
        if (mode === 'clock') t.h.clock.advance(3_600_001)
        else t.control.legalDateOverride = '2026-11-10'
        return result
      }
      assert.equal((await commitV3PreparedTransition(t.f.prepared, t.deps)).status, 'committed_not_current')
      assert.equal(t.control.commitCount, 1)
    }
  })
  test('R1 an adapter without a joint atomic boundary is unsupported before writes, including historical replay', async () => {
    const t = harness(), unsupported = { ...t.deps, store: { ...t.store, atomicBoundary: null } }
    assert.equal((await commitV3PreparedTransition(t.f.prepared, unsupported)).status, 'unsupported')
    assert.equal(t.control.commitCount, 0)
    await commitV3PreparedTransition(t.f.prepared, t.deps)
    assert.equal((await commitV3PreparedTransition(t.f.prepared, unsupported)).status, 'unsupported')
    assert.equal(t.control.commitCount, 1)
  })
  test('same operation with changed full prepared bytes collides even if transition references remain unchanged', async () => {
    const t = harness(); assert.equal((await commitV3PreparedTransition(t.f.prepared, t.deps)).status, 'confirmed')
    assert.equal((await commitV3PreparedTransition({ ...t.f.prepared, proposalDigest: sha256Hex('other-content') }, t.deps)).status, 'collision')
    assert.equal(t.control.commitCount, 1)
  })
  test('stale predecessor and post-wait method revocation prevent writes', async () => {
    const stale = harness(); stale.control.head = { ...stale.control.head, sourceDecisionRef: ref('source-decision', 'foreign') }
    assert.equal((await commitV3PreparedTransition(stale.f.prepared, stale.deps)).status, 'stale_head'); assert.equal(stale.control.commitCount, 0)
    const revoked = harness(); revoked.control.beforeCommit = async () => { revoked.h.method.control.enabled = false }
    assert.equal((await commitV3PreparedTransition(revoked.f.prepared, revoked.deps)).status, 'unavailable'); assert.equal(revoked.control.commitCount, 0)
  })
  test('freshness expiring while waiting prevents commit without extending the source clock', async () => {
    const t = harness(); t.control.freshness = '2026-11-09T08:04:00.010Z'
    t.control.beforeCommit = async () => { t.h.clock.advance(10) }
    assert.equal((await commitV3PreparedTransition(t.f.prepared, t.deps)).status, 'unavailable'); assert.equal(t.control.commitCount, 0)
  })
  test('false proof, self-asserted acceptance and foreign source fact cannot mint a committed version', async () => {
    const t = harness(); t.control.proofValid = false
    assert.equal((await commitV3PreparedTransition(t.f.prepared, t.deps)).status, 'invalid')
    assert.equal((await commitV3PreparedTransition({ ...t.f.prepared, acceptance: 'accepted' }, t.deps)).status, 'invalid')
    assert.equal((await commitV3PreparedTransition({ ...t.f.prepared, trustedReceipt: true }, t.deps)).status, 'invalid')
    assert.equal(t.control.commitCount, 0)
  })
  test('unsupported legacy adapter and unbound production ports stay closed', async () => {
    const t = harness(); t.control.unsupported = true
    assert.equal((await commitV3PreparedTransition(t.f.prepared, t.deps)).status, 'unsupported')
    assert.equal((await commitV3PreparedTransition(t.f.prepared, { ...t.deps, store: null })).status, 'unavailable')
    assert.equal((await commitV3PreparedTransition(t.f.prepared, { ...t.deps, proofs: null })).status, 'unavailable')
    assert.equal(t.control.commitCount, 0)
  })
  test('withdrawal and recovery append fresh versions and retain old versions and consumed operations', async () => {
    const t = harness(); assert.equal((await commitV3PreparedTransition(t.f.prepared, t.deps)).status, 'confirmed')
    const withdrawal = nextPrepared(t, t.f.prepared, 'withdraw')
    assert.equal((await commitV3PreparedTransition(withdrawal, t.deps)).status, 'confirmed')
    t.h.clock.advance(1)
    const recovery = nextPrepared(t, withdrawal, 'recover')
    const result = await commitV3PreparedTransition(recovery, t.deps)
    assert.equal(result.status, 'confirmed'); assert.equal(t.versions.size, 3); assert.equal(t.operations.size, 3)
    assert.notEqual(recovery.version.reference, t.f.version.reference)
    assert.notEqual(recovery.version.subject.evidence.versionId, t.f.version.subject.evidence.versionId)
    assert.equal(recovery.transition.recoverFromVersionRef, t.f.version.reference)
    assert.equal(t.versions.get(t.f.version.reference)?.state, 'accepted')
    assert.equal(t.versions.get(withdrawal.version.reference)?.state, 'withdrawn')
  })
  test('reaccepting a conflicted head requires a linked positive resolution, fresh evidence and current method', async () => {
    const t = harness(), f = t.f
    assert.equal((await commitV3PreparedTransition(f.prepared, t.deps)).status, 'confirmed')
    const lookup = contentEvidenceLookupV3(f.context.scope, { sourceId: f.counterSource.sourceId,
      contentItemId: f.counterSource.contentItemId, representationId: f.counterSource.representationId })
    if (!lookup.ok) assert.fail('counter lookup')
    const counter = { ...f.observation,
      fact: { schema: 1 as const, fact: { kind: 'requirement_effect' as const, effect: 'not_required' as const, visaMode: null } },
      evidence: { ...f.observation.evidence, source: f.counterSource, lookupKey: lookup.value.key,
        versionId: `ev2_${sha256Hex('live-conflict').slice(0, 32)}`, sourceContentHash: sha256Hex('live-conflict') } }
    const conflictRef = ref('source-conflict', 'live'), conflictDecisionRef = ref('source-decision', 'live-conflict')
    const conflict = { reference: conflictRef, detectedDecisionRef: conflictDecisionRef, detectedAt: t.h.clock.now(),
      primary: f.observation, counter, resolution: null }
    const blockedDecision = must(readV3SourceDecisionRecord({ ...f.decision, reference: conflictDecisionRef,
      predecessor: f.decision.reference, evaluatedAt: t.h.clock.now(), knownConflicts: [conflict], conclusion: 'comparable_conflict',
      counterCheck: { attemptPlanRevision: 1, attempts: [{ status: 'conflicts', attemptedAt: t.h.clock.now(),
        comparisonRef: ref('source-comparison', 'live-conflict'), conflictRef, observation: counter }] } }, f.registry, f.decision))
    const blockedOperation = ids('op3', 'live-conflict')
    const blockedVersion = must(readV3RuleVersionRecord({ ...f.version, reference: ref('rule-version', 'live-conflict'),
      revision: 2, predecessor: f.version.reference, state: 'conflicted', sourceDecisionRef: blockedDecision.reference,
      operationId: blockedOperation, recordedAt: t.h.clock.now() }, f.registry, blockedDecision))
    const blockedPlan = must(readV3TransitionPlan({ ...f.transition, operationId: blockedOperation, action: 'conflict',
      expected: f.transition.next, next: { revision: 2, state: 'conflicted', versionRef: blockedVersion.reference },
      sourceDecisionRef: blockedDecision.reference, invalidatedProjectionRefs: [ref('rule-projection', 'first')] }))
    const blocked = { ...f.prepared, decision: blockedDecision, previousDecision: f.decision, version: blockedVersion, transition: blockedPlan }
    assert.equal((await commitV3PreparedTransition(blocked, t.deps)).status, 'confirmed')
    t.h.clock.advance(1)
    const fresh = { ...f.observation, evidence: { ...f.observation.evidence, retrievedAt: t.h.clock.now(),
      versionId: `ev2_${sha256Hex('reaccepted-primary').slice(0, 32)}` } }
    const corrected = { ...counter, fact: f.observation.fact, evidence: { ...counter.evidence, retrievedAt: t.h.clock.now(),
      versionId: `ev2_${sha256Hex('reaccepted-counter').slice(0, 32)}`, sourceContentHash: sha256Hex('reaccepted-counter') } }
    const resolution = { reference: ref('conflict-resolution', 'live-positive'), predecessor: null, conflictRef,
      method: f.decision.method, resolvedAt: t.h.clock.now(), legalAsOfDate: t.h.clock.legalDate(),
      basis: 'corrected_publication', observations: [corrected] }
    if (f.decision.primary.status !== 'clear') assert.fail('primary')
    const decision = must(readV3SourceDecisionRecord({ ...blockedDecision, reference: ref('source-decision', 'reaccepted'),
      predecessor: blockedDecision.reference, evaluatedAt: t.h.clock.now(), conclusion: 'clear_primary',
      primary: { status: 'clear', observation: fresh, qualification: { ...f.decision.primary.qualification,
        evidenceVersionId: fresh.evidence.versionId, checkedAt: t.h.clock.now() } },
      knownConflicts: [{ ...conflict, resolution }], counterCheck: { attemptPlanRevision: 1, attempts: [{ status: 'agrees',
        attemptedAt: t.h.clock.now(), comparisonRef: ref('source-comparison', 'reaccepted'), observation: corrected }] } }, f.registry, blockedDecision))
    const operationId = ids('op3', 'reaccepted'), version = must(readV3RuleVersionRecord({ ...blockedVersion,
      reference: ref('rule-version', 'reaccepted'), revision: 3, predecessor: blockedVersion.reference, state: 'accepted',
      subject: fresh, sourceDecisionRef: decision.reference, operationId, recordedAt: t.h.clock.now() }, f.registry, decision))
    const transition = must(readV3TransitionPlan({ ...blockedPlan, action: 'reaccept', operationId, expected: blockedPlan.next,
      next: { revision: 3, state: 'accepted', versionRef: version.reference }, sourceDecisionRef: decision.reference,
      primaryEvidenceVersionId: fresh.evidence.versionId, resolutionRefs: [resolution.reference] }))
    const prepared = { ...blocked, decision, previousDecision: blockedDecision, version, transition }
    assert.equal((await commitV3PreparedTransition({ ...prepared, transition: { ...transition, resolutionRefs: [] } }, t.deps)).status, 'invalid')
    assert.equal((await commitV3PreparedTransition({ ...prepared, decision: { ...decision, knownConflicts: [] } }, t.deps)).status, 'invalid')
    t.h.method.control.enabled = false
    assert.equal((await commitV3PreparedTransition(prepared, t.deps)).status, 'unavailable')
    assert.equal(t.control.commitCount, 2)
    t.h.method.control.enabled = true
    assert.equal((await commitV3PreparedTransition(prepared, t.deps)).status, 'confirmed')
    assert.equal(t.versions.size, 3); assert.equal(t.operations.size, 3)
    assert.equal(t.versions.get(blockedVersion.reference)?.state, 'conflicted')
    assert.equal(t.control.head.sourceDecisionRef, decision.reference)
    assert.equal(prepared.decision.knownConflicts[0].resolution?.reference, resolution.reference)
  })
  test('in-place historical restoration and accept over a withdrawn pointer are invalid', async () => {
    const t = harness(); await commitV3PreparedTransition(t.f.prepared, t.deps)
    const withdrawal = nextPrepared(t, t.f.prepared, 'withdraw'); await commitV3PreparedTransition(withdrawal, t.deps)
    const recovery = nextPrepared(t, withdrawal, 'recover')
    assert.equal((await commitV3PreparedTransition({ ...recovery, version: { ...recovery.version, reference: t.f.version.reference },
      transition: { ...recovery.transition, next: { ...recovery.transition.next, versionRef: t.f.version.reference } } }, t.deps)).status, 'invalid')
    assert.equal((await commitV3PreparedTransition({ ...recovery, transition: { ...recovery.transition, action: 'accept', recoverFromVersionRef: null } }, t.deps)).status, 'invalid')
    assert.equal(t.control.commitCount, 2)
  })
  test('a malformed confirmation and a failed independent current-head read never produce confirmed success', async () => {
    const a = harness(); a.control.corruptConfirmation = true
    assert.equal((await commitV3PreparedTransition(a.f.prepared, a.deps)).status, 'unconfirmed'); assert.equal(a.control.commitCount, 1)
    const b = harness(); b.control.failReadAfterCommit = true
    assert.equal((await commitV3PreparedTransition(b.f.prepared, b.deps)).status, 'unconfirmed'); assert.equal(b.control.commitCount, 1)
  })
  test('historically committed but superseded or revoked operations are never presented as current', async () => {
    const t = harness(); await commitV3PreparedTransition(t.f.prepared, t.deps)
    t.h.method.control.enabled = false
    assert.equal((await commitV3PreparedTransition(t.f.prepared, t.deps)).status, 'committed_not_current')
    t.h.method.control.enabled = true
    t.control.head = { ...t.control.head, pointer: { ...t.control.head.pointer, versionRef: ref('rule-version', 'newer') } }
    assert.equal((await commitV3PreparedTransition(t.f.prepared, t.deps)).status, 'committed_not_current')
    assert.equal(t.control.commitCount, 1)
  })
  test('archive append retains the exact resolved conflict and advances the same atomic head', async () => {
    const t = harness(), f = t.f
    const counterLookup = contentEvidenceLookupV3(f.context.scope, { sourceId: f.counterSource.sourceId,
      contentItemId: f.counterSource.contentItemId, representationId: f.counterSource.representationId })
    assert.equal(counterLookup.ok, true); if (!counterLookup.ok) assert.fail()
    const counter = { ...f.observation, fact: { schema: 1 as const, fact: { kind: 'requirement_effect' as const, effect: 'not_required' as const, visaMode: null } },
      evidence: { ...f.observation.evidence, source: f.counterSource, lookupKey: counterLookup.value.key,
        versionId: `ev2_${sha256Hex('counter').slice(0, 32)}`, sourceContentHash: sha256Hex('counter') } }
    const corrected = { ...counter, fact: f.observation.fact, evidence: { ...counter.evidence, retrievedAt: '2026-11-09T08:01:00.000Z',
      versionId: `ev2_${sha256Hex('corrected').slice(0, 32)}`, sourceContentHash: sha256Hex('corrected') } }
    const conflictRef = ref('source-conflict', 'historical-resolved')
    const conflict = { reference: conflictRef, detectedDecisionRef: f.decision.reference, detectedAt: '2026-11-09T08:00:00.000Z',
      primary: f.observation, counter, resolution: { reference: ref('conflict-resolution', 'positive'), predecessor: null,
        conflictRef, method: f.decision.method, resolvedAt: '2026-11-09T08:02:00.000Z', legalAsOfDate: '2026-11-09',
        basis: 'corrected_publication', observations: [corrected] } }
    const firstDecision = must(readV3SourceDecisionRecord({ ...f.decision, evaluatedAt: '2026-11-09T08:03:00.000Z', knownConflicts: [conflict] }, f.registry))
    const firstVersion = must(readV3RuleVersionRecord({ ...f.version, recordedAt: '2026-11-09T08:03:00.000Z' }, f.registry, firstDecision))
    const first = { ...f.prepared, decision: firstDecision, version: firstVersion }
    assert.equal((await commitV3PreparedTransition(first, t.deps)).status, 'confirmed')
    const archive = { schema: 3, kind: 'resolved_conflict_archive_record', head: { reference: ref('conflict-archive', 'page'), revision: 1, totalConflicts: 1 },
      predecessor: null, contextKey: f.identity.contextKey, factKind: 'requirement_effect', fromDecisionRef: firstDecision.reference,
      archivedAt: t.h.clock.now(), entries: firstDecision.knownConflicts }
    const decision = must(readV3SourceDecisionRecord({ ...firstDecision, reference: ref('source-decision', 'archived'), predecessor: firstDecision.reference,
      evaluatedAt: t.h.clock.now(), knownConflicts: [], historyArchive: archive.head }, f.registry, firstDecision, archive))
    const operationId = ids('op3', 'archive'), version = must(readV3RuleVersionRecord({ ...firstVersion, reference: ref('rule-version', 'archived'),
      revision: 2, predecessor: firstVersion.reference, sourceDecisionRef: decision.reference, operationId, recordedAt: t.h.clock.now() }, f.registry, decision))
    const transition = must(readV3TransitionPlan({ ...f.transition, operationId, expected: f.transition.next,
      next: { revision: 2, state: 'accepted', versionRef: version.reference }, sourceDecisionRef: decision.reference }))
    const prepared = { ...first, decision, previousDecision: firstDecision, archiveAppend: archive, version, transition }
    assert.equal((await commitV3PreparedTransition({ ...prepared, archiveAppend: null }, t.deps)).status, 'invalid')
    assert.equal((await commitV3PreparedTransition(prepared, t.deps)).status, 'confirmed')
    assert.equal(t.archives.size, 1); assert.deepEqual(t.archives.get(archive.head.reference)?.entries, firstDecision.knownConflicts)
    assert.deepEqual(t.control.head.historyArchive, archive.head); assert.equal(t.versions.size, 2)
  })
  test('getter, personal input and timeout fail without raw error exposure or speculative commit success', async () => {
    const t = harness(); let invoked = false
    const getter = Object.defineProperty({}, 'decision', { get() { invoked = true; return t.f.decision } })
    assert.equal((await commitV3PreparedTransition(getter, t.deps)).status, 'invalid')
    assert.equal((await commitV3PreparedTransition({ ...t.f.prepared, mrz: 'PRIVATE' }, t.deps)).status, 'invalid')
    assert.equal(invoked, false)
    const store: V3VersionCommitPort = { ...t.store, atomicBoundary: { ...t.boundary, commit: async (_command, signal) => new Promise((resolve) => {
      signal.addEventListener('abort', () => resolve({ status: 'unconfirmed' }), { once: true })
    }) } }
    assert.equal((await commitV3PreparedTransition(t.f.prepared, { ...t.deps, store, invocationMilliseconds: 15 })).status, 'unconfirmed')
    assert.equal(t.control.commitCount, 0)
  })
})
