// SYNTHETIC IN-PROCESS STORAGE ONLY. Not durable, hosted, official or production.
import { schema2Kanonisch } from '@/lib/readiness/regulierungs-anwendbarkeit'
import { sha256Hex } from '@/lib/readiness/digest'
import { readV3ConflictArchiveRecord, readV3RuleVersionRecord, readV3TransitionPlan, readV3SourceDecisionRecord, createV3WorkIdentity,
  type V3ConflictArchiveRecord, type V3MethodRef, type V3SourceDecisionRecord, type V3PublicProjectionRecord } from '../../contract'
import type { V3ImportPorts, V3ImportHistory, V3ImportPrepared, V3ImportOutcome, V3ImportAudit,
  V3ImportVerificationRequest } from '../../import/service-server'
import type { V3ProposalUpload } from '../../import/interface'
import { commitV3PreparedTransition, type V3TransitionProofPort, type V3VersionCommitPort, type V3TransitionConfirmation,
  type V3TransitionAtomicCommand, type V3VersionHead } from '../../monitor/recovery'
import type { V3ManagedJobRecord, V3QueueStoragePort, V3QueueConfirmation, V3QueueCommit } from '../../monitor/queue'
import type { V3ProjectionBinding, V3VisitorPorts } from '../../visitor/query'
import { key, same } from '../../monitor/internal'
import type { V3EscalationCommand, V3EscalationPublicationPort, V3PublicationCommand,
  V3ProjectionPublicationPort, V3PublicationConfirmation } from '../ports'
import { makeSyntheticOriginals, METHOD, ref, id, must } from './originals'

const missing = (): V3ImportHistory => ({ pointer: { state: 'missing', revision: 0, versionRef: null },
  version: null, decision: null, decisionPredecessor: null, decisionArchiveAppend: null, invalidatedProjectionRefs: [] })

export function makeSyntheticStore(originals: ReturnType<typeof makeSyntheticOriginals>) {
  const control = { instant: Date.parse('2026-11-09T08:04:00.000Z'), methodEnabled: true, methodRevision: 1,
    proofEpoch: 1, archiveEpoch: 1, loseVersion: false, losePublication: false, loseEscalation: false,
    loseQueue: false, obscurePublication: false, cacheError: false,
    beforeVersion: null as (() => Promise<void>) | null, beforePublication: null as (() => Promise<void>) | null,
    beforeRead: null as (() => Promise<void>) | null }
  const clock = () => ({ now: new Date(control.instant).toISOString(), legalDate: new Date(control.instant).toISOString().slice(0, 10) })
  const freshUntil = () => new Date(Date.parse(originals.control.retrievedAt) + 3_600_000).toISOString()
  const heads = new Map<string, V3ImportHistory>(), versions = new Map<string, V3ImportPrepared>(), archives = new Map<string, V3ConflictArchiveRecord>()
  // Private immutable commitment created only by the actual atomic M1 commit.
  // Finding an externally visible map key is not historical custody.
  const committedVersionKeys = new Map<string, string>()
  const versionOperations = new Map<string, V3TransitionConfirmation>(), publications = new Map<string, { key: string; projection: V3PublicProjectionRecord }>()
  const cache = new Map<string, V3PublicProjectionRecord>(), coverage = new Map<string, V3ImportPrepared['decision']['context']>()
  const blocks = new Map<string, V3EscalationCommand>(), escalationOperations = new Map<string, V3EscalationCommand>(), outbox = new Set<string>()
  const quarantine = new Map<string, { upload: V3ProposalUpload; ticket: object; revision: number; expires: number; outcome: V3ImportOutcome | null }>()
  const importAudits: V3ImportAudit[] = [], audit: { kind: string; operationId: string; reference: string }[] = []
  const queueRows = new Map<string, V3ManagedJobRecord>(), queueOperations = new Map<string, Extract<V3QueueConfirmation, { status: 'committed' }>>()
  const queueEvents: V3QueueCommit['audit'][] = []
  const counts = { versionWrites: 0, publicationWrites: 0, escalationWrites: 0, queueWrites: 0, importWrites: 0 }
  const methodReceipts = new WeakMap<object, V3MethodRef>(), proofReceipts = new WeakMap<object, { key: string; sourceEpoch: number; proofEpoch: number; archiveEpoch: number }>()
  const historyReceipts = new WeakMap<object, { contextKey: string; snapshot: string }>()
  const evidenceReceipts = new WeakMap<object, { request: V3ImportVerificationRequest; parts: string; archive: string;
    epoch: number; proofEpoch: number; archiveEpoch: number }>()
  const decisionProofs = new Map<string, { receipt: object; decision: V3SourceDecisionRecord; archive: V3ConflictArchiveRecord | null }>()
  const projectionReceipts = new WeakMap<object, V3ProjectionBinding>()
  let tail = Promise.resolve()
  async function locked<T>(run: () => Promise<T>): Promise<T> {
    const previous = tail; let release = () => {}
    tail = new Promise<void>((resolve) => { release = resolve }); await previous
    try { return await run() } finally { release() }
  }
  const methodCurrent = (receipt: object, method: V3MethodRef) => control.methodEnabled && method.methodId === METHOD.methodId
    && method.revision === control.methodRevision && same(methodReceipts.get(receipt), method)
  const methodAuthority = {
    async resolveCurrent(method: V3MethodRef) {
      if (!control.methodEnabled || !same(method, { ...METHOD, revision: control.methodRevision })) return { status: 'not_approved' as const }
      const receipt = Object.freeze({}); methodReceipts.set(receipt, structuredClone(method)); return { status: 'approved' as const, receipt }
    },
    async reproveAtCommit(receipt: object, method: V3MethodRef) { return { status: methodCurrent(receipt, method) ? 'current' as const : 'revoked' as const } },
  }
  function history(contextKey: string): V3ImportHistory { return structuredClone(heads.get(contextKey) ?? missing()) }
  function actualHead(contextKey: string): V3VersionHead {
    const h = history(contextKey)
    return { pointer: h.pointer, sourceDecisionRef: h.decision?.reference ?? null, historyArchive: h.decision?.historyArchive ?? null }
  }
  function outcomeFor(p: V3ImportPrepared) { return quarantine.get(p.transition.operationId)?.outcome }
  function historicalRecoveryCurrent(p: V3ImportPrepared) {
    const reference = p.transition.recoverFromVersionRef
    if (!reference) return false
    const historic = versions.get(reference)
    if (!historic || committedVersionKeys.get(reference) !== key('test-prepared', historic)) return false
    const decision = readV3SourceDecisionRecord(historic.decision, originals.registry, historic.previousDecision, historic.archiveAppend)
    const version = readV3RuleVersionRecord(historic.version, originals.registry, historic.decision)
    const transition = readV3TransitionPlan(historic.transition)
    if (!decision.ok || !version.ok || !transition.ok) return false
    const record = version.value, plan = transition.value, confirmed = versionOperations.get(record.operationId)
    if (!confirmed || record.reference !== reference || confirmed.versionRef !== reference || record.state !== 'accepted'
      || confirmed.sourceDecisionRef !== decision.value.reference || confirmed.revision !== record.revision
      || confirmed.state !== record.state || !same(confirmed.historyArchive, decision.value.historyArchive)
      || plan.next.versionRef !== reference || plan.next.revision !== record.revision || plan.contextKey !== record.subject.contextKey
      || plan.sourceDecisionRef !== decision.value.reference || plan.operationId !== record.operationId
      || record.revision > p.transition.expected.revision || record.recordedAt > p.version.recordedAt) return false
    const historicalIdentity = createV3WorkIdentity({ context: record.subject.context, method: record.method,
      factKind: record.subject.fact.fact.kind, researchReason: { status: 'missing' } })
    const freshIdentity = createV3WorkIdentity({ context: p.version.subject.context, method: p.version.method,
      factKind: p.version.subject.fact.fact.kind, researchReason: { status: 'missing' } })
    if (!historicalIdentity.ok || !freshIdentity.ok || historicalIdentity.value.contextKey !== freshIdentity.value.contextKey
      || historicalIdentity.value.ruleScopeKey !== freshIdentity.value.ruleScopeKey
      || record.subject.contextKey !== p.version.subject.contextKey || decision.value.contextKey !== p.decision.contextKey
      || !same(record.subject.context, p.version.subject.context) || !same(record.subject.fact, p.version.subject.fact)
      || !same(record.method, p.version.method) || !same(decision.value.method, p.decision.method)) return false
    return (!historic.archiveAppend || same(archives.get(historic.archiveAppend.head.reference), historic.archiveAppend))
      && (!decision.value.historyArchive || same(archives.get(decision.value.historyArchive.reference)?.head, decision.value.historyArchive))
  }
  function decisionProofCurrent(decision: V3SourceDecisionRecord, previous: V3SourceDecisionRecord | null, archive: V3ConflictArchiveRecord | null) {
    const proof = decisionProofs.get(decision.reference), held = proof && evidenceReceipts.get(proof.receipt)
    return !!proof && !!held && held.epoch === originals.control.epoch && held.proofEpoch === control.proofEpoch
      && held.archiveEpoch === control.archiveEpoch && clock().now < freshUntil()
      && same(proof.decision, decision) && same(proof.archive, archive) && same(held.request.previousDecision, previous)
      && same(held.request.method, decision.method) && decision.legalAsOfDate === clock().legalDate
      && held.request.contextKey === decision.contextKey && held.request.factKind === decision.factKind
  }
  function preparedAuthorized(p: V3ImportPrepared): boolean {
    const stored = quarantine.get(p.transition.operationId), outcome = stored?.outcome
    if (!stored || stored.upload.digest !== p.proposalDigest || !outcome) return false
    if (outcome.status === 'prepared') {
      if (p.transition.action === 'recover') {
        const transition = { ...p.transition, action: outcome.value.transition.action,
          recoverFromVersionRef: outcome.value.transition.recoverFromVersionRef }
        return same({ ...p, transition }, outcome.value)
          && historicalRecoveryCurrent(p)
      }
      return same(outcome.value, p)
    }
    if (outcome.status !== 'escalation' || !same(outcome.decision, p.decision)
      || !same(outcome.previousDecision, p.previousDecision) || !same(outcome.archiveAppend, p.archiveAppend)) return false
    const previous = p.version.predecessor ? versions.get(p.version.predecessor) : null
    return !!previous && same(previous.version.subject, p.version.subject)
      && p.version.state === (outcome.reason === 'comparable_conflict' ? 'conflicted' : 'withdrawn')
  }
  function proofCurrent(receipt: object, p: V3ImportPrepared) {
    const record = proofReceipts.get(receipt)
    if (!record || record.key !== key('test-prepared', p) || record.sourceEpoch !== originals.control.epoch
      || record.proofEpoch !== control.proofEpoch || record.archiveEpoch !== control.archiveEpoch || !preparedAuthorized(p)
      || !decisionProofCurrent(p.decision, p.previousDecision, p.archiveAppend)) return false
    if (p.archiveAppend?.predecessor && !archives.has(p.archiveAppend.predecessor.reference)) return false
    if (p.version.state !== 'accepted') return true
    if (originals.control.primaryUnclear || !same(originals.extract(p.decision.context, 'synthetic-primary'), p.version.subject)) return false
    const blocked = blocks.get(p.decision.contextKey)
    return !blocked || blocked.outcome.decision.knownConflicts.every((conflict) =>
      p.decision.knownConflicts.some((item) => item.reference === conflict.reference && item.resolution !== null)
        || (conflict.resolution !== null && p.archiveAppend?.entries.some((entry) => same(entry, conflict))))
  }
  const versionProofs: V3TransitionProofPort<object> = {
    async inspect(p) {
      if (!preparedAuthorized(p)) return { status: 'invalid' }
      const receipt = Object.freeze({}); proofReceipts.set(receipt, { key: key('test-prepared', p), sourceEpoch: originals.control.epoch,
        proofEpoch: control.proofEpoch, archiveEpoch: control.archiveEpoch })
      return proofCurrent(receipt, p) ? { status: 'verified', receipt } : { status: 'invalid' }
    },
    async reprove(receipt, p) { return proofCurrent(receipt, p) ? { status: 'current', freshUntil: freshUntil() } : { status: 'invalid' } },
  }
  function authority(command: V3TransitionAtomicCommand | V3PublicationCommand, signal: AbortSignal) {
    const p = command.prepared, methodReceipt = 'authority' in command ? command.authority.methodReceipt : command.methodReceipt
    const proofReceipt = 'authority' in command ? command.authority.proofReceipt : command.proofReceipt
    const validity = p.version.subject.evidence.legalValidity, time = clock()
    return !signal.aborted && time.now < command.notAfter && time.now < freshUntil()
      && methodCurrent(methodReceipt, p.version.method) && proofCurrent(proofReceipt, p)
      && (p.version.state !== 'accepted' || (p.decision.legalAsOfDate === time.legalDate && validity.status === 'specified'
        && (validity.validFrom === null || validity.validFrom <= time.legalDate)
        && (validity.validUntil === null || validity.validUntil >= time.legalDate)))
  }
  function recordEscalation(command: V3EscalationCommand) {
    const c = structuredClone(command)
    escalationOperations.set(c.operationId, c); blocks.set(c.outcome.decision.contextKey, c)
    outbox.add(c.outcome.key); counts.escalationWrites++
    if (c.outcome.archiveAppend) archives.set(c.outcome.archiveAppend.head.reference, structuredClone(c.outcome.archiveAppend))
    audit.push({ kind: 'escalation', operationId: c.operationId, reference: c.outcome.decision.reference })
  }
  const versionStore: V3VersionCommitPort = {
    async confirm(operationId, operationKey) {
      const prior = versionOperations.get(operationId)
      return prior ? prior.operationKey === operationKey ? { status: 'committed', confirmation: structuredClone(prior) } : { status: 'collision' }
        : { status: 'not_attempted' }
    },
    async readHead(contextKey) { return { status: 'current', head: actualHead(contextKey) } },
    atomicBoundary: {
      async commit(command, signal) {
        return locked(async () => {
          const old = versionOperations.get(command.prepared.transition.operationId)
          if (old) return { status: old.operationKey === command.operationKey ? 'commit_reported' : 'unavailable' }
          await control.beforeVersion?.(); const preflight = await command.reprove(signal)
          if (preflight.status !== 'current' || !authority(command, signal)) return { status: 'unavailable' }
          if (!same(actualHead(command.prepared.transition.contextKey), command.expectedHead)) return { status: 'stale_head' }
          const p = command.prepared, outcome = outcomeFor(p)
          if (p.archiveAppend) archives.set(p.archiveAppend.head.reference, structuredClone(p.archiveAppend))
          versions.set(p.version.reference, structuredClone(p))
          committedVersionKeys.set(p.version.reference, key('test-prepared', p))
          heads.set(p.transition.contextKey, { pointer: p.transition.next, version: p.version, decision: p.decision,
            decisionPredecessor: p.previousDecision, decisionArchiveAppend: p.archiveAppend,
            invalidatedProjectionRefs: [] })
          if (outcome?.status === 'escalation') {
            const upload = quarantine.get(p.transition.operationId)!.upload
            recordEscalation({ operationId: p.transition.operationId, operationKey: key('escalation-publish', { digest: upload.digest, outcome }), upload, outcome })
          } else if (p.version.state === 'accepted') blocks.delete(p.transition.contextKey)
          const confirmation: V3TransitionConfirmation = { operationId: p.transition.operationId, operationKey: command.operationKey,
            versionRef: p.version.reference, sourceDecisionRef: p.decision.reference, revision: p.version.revision, state: p.version.state,
            auditRef: ref('rule-audit', command.operationKey), committedAt: clock().now,
            historyArchive: p.decision.historyArchive, invalidatedProjectionRefs: p.transition.invalidatedProjectionRefs }
          versionOperations.set(p.transition.operationId, confirmation); counts.versionWrites++
          audit.push({ kind: p.transition.action, operationId: p.transition.operationId, reference: p.version.reference })
          if (control.loseVersion) { control.loseVersion = false; return { status: 'unconfirmed' } }
          return { status: 'commit_reported' }
        })
      },
      async confirmCurrent(command, signal) {
        return locked(async () => {
          const preflight = await command.reprove(signal)
          if (preflight.status !== 'current' || !authority(command, signal) || !same(actualHead(command.prepared.transition.contextKey), command.expectedHead)) return { status: 'not_current' }
          const operation = versionOperations.get(command.prepared.transition.operationId)
          if (!operation || operation.operationKey !== command.operationKey) return { status: 'unconfirmed' }
          return { status: 'current', confirmation: { operation: structuredClone(operation), head: actualHead(command.prepared.transition.contextKey),
            method: structuredClone(command.authority.method), checkedAt: clock().now, legalDate: clock().legalDate, freshUntil: freshUntil() } }
        })
      },
    },
  }
  const importPorts: V3ImportPorts<object, object, object, object> = {
    registry: originals.registry, method: METHOD, clock, methodAuthority,
    history: {
      async read(contextKey) { const value = history(contextKey), receipt = Object.freeze({}); historyReceipts.set(receipt, { contextKey, snapshot: schema2Kanonisch(value) })
        return { status: 'snapshot', receipt, history: value } },
      async reprove(receipt, value) { const held = historyReceipts.get(receipt); return { status: held?.snapshot === schema2Kanonisch(value)
        && same(history(held.contextKey), value) ? 'current' : 'changed' } },
    },
    evidence: {
      async inspect(request) {
        const primary = originals.extract(request.context, 'synthetic-primary'), prior = request.previousDecision
        let conflicts = structuredClone(prior?.knownConflicts ?? [])
        const blocked = blocks.get(request.contextKey)
        for (const item of blocked?.outcome.decision.knownConflicts ?? []) if (!conflicts.some((old) => old.reference === item.reference)) conflicts.push(structuredClone(item))
        if (originals.control.resolve) conflicts = conflicts.map((item) => ({ ...item, resolution: item.resolution ?? {
          reference: ref('conflict-resolution', `${item.reference}|${originals.control.epoch}`), predecessor: null,
          conflictRef: item.reference, method: METHOD, resolvedAt: clock().now, legalAsOfDate: clock().legalDate,
          basis: 'corrected_publication', observations: [originals.extract(request.context, 'synthetic-counter')],
        } }))
        const attempts: V3SourceDecisionRecord['counterCheck']['attempts'] = []
        if (!originals.control.primaryUnclear && originals.control.counter === 'conflicts') {
          const counter = originals.extract(request.context, 'synthetic-counter'), conflictRef = ref('source-conflict', primary.evidence.versionId + counter.evidence.versionId)
          if (!conflicts.some((item) => item.reference === conflictRef)) conflicts.push({ reference: conflictRef, detectedDecisionRef: request.decisionRef,
            detectedAt: clock().now, primary, counter, resolution: null })
          attempts.push({ status: 'conflicts', observation: counter, attemptedAt: clock().now, conflictRef,
            comparisonRef: ref('source-comparison', conflictRef) })
        } else if (!originals.control.primaryUnclear && originals.control.counter === 'agrees') attempts.push({ status: 'agrees',
          observation: originals.extract(request.context, 'synthetic-counter'), attemptedAt: clock().now, comparisonRef: ref('source-comparison', request.decisionRef) })
        else if (originals.control.counter === 'unreachable') attempts.push({ status: 'unreachable', source: { sourceId: 'synthetic-counter',
          contentItemId: 'synthetic-publication', representationId: 'synthetic-json' }, attemptedAt: clock().now })
        else attempts.push({ status: 'not_found', source: null, attemptedAt: clock().now })
        let archive: V3ConflictArchiveRecord | null = null
        const removed = originals.control.archive ? (prior?.knownConflicts.filter((item) => item.resolution !== null) ?? []) : []
        if (removed.length) {
          archive = must(readV3ConflictArchiveRecord({ schema: 3, kind: 'resolved_conflict_archive_record',
            head: { reference: ref('conflict-archive', request.decisionRef), revision: (prior?.historyArchive?.revision ?? 0) + 1,
              totalConflicts: (prior?.historyArchive?.totalConflicts ?? 0) + removed.length }, predecessor: prior?.historyArchive ?? null,
            contextKey: request.contextKey, factKind: request.factKind, fromDecisionRef: prior!.reference,
            archivedAt: clock().now, entries: removed }, originals.registry))
          conflicts = conflicts.filter((item) => !removed.some((old) => old.reference === item.reference))
        }
        const parts = { primary: originals.control.primaryUnclear ? { status: 'unclear' as const, reason: 'ambiguous_statement' as const, evidence: primary.evidence }
          : { status: 'clear' as const, observation: primary, qualification: { reference: ref('destination-qualification', request.decisionRef),
            representedCountryCode: request.context.scope.destinationCountryCode, role: 'destination_authority' as const,
            method: METHOD, evidenceVersionId: primary.evidence.versionId, checkedAt: clock().now } },
        counterCheck: { attemptPlanRevision: 1, attempts }, knownConflicts: conflicts, historyArchive: archive?.head ?? prior?.historyArchive ?? null }
        const receipt = Object.freeze({}); evidenceReceipts.set(receipt, { request: structuredClone(request),
          parts: schema2Kanonisch(parts), archive: schema2Kanonisch(archive), epoch: originals.control.epoch,
          proofEpoch: control.proofEpoch, archiveEpoch: control.archiveEpoch })
        return { status: 'inspected', receipt, parts, archiveAppend: archive, validUntilExclusive: freshUntil() }
      },
      async reprove(receipt, request, decision, archive) { const held = evidenceReceipts.get(receipt)
        const current = held?.epoch === originals.control.epoch && held.proofEpoch === control.proofEpoch
          && held.archiveEpoch === control.archiveEpoch && same(held.request, request) && held.parts === schema2Kanonisch({ primary: decision.primary,
          counterCheck: decision.counterCheck, knownConflicts: decision.knownConflicts, historyArchive: decision.historyArchive })
          && held.archive === schema2Kanonisch(archive) && clock().now < freshUntil()
        if (current) decisionProofs.set(decision.reference, { receipt, decision: structuredClone(decision), archive: structuredClone(archive) })
        return { status: current ? 'current' : 'changed' } },
    },
    quarantine: {
      async reserve(upload) { return locked(async () => {
        const old = quarantine.get(upload.proposal.operationId)
        if (old && old.upload.digest !== upload.digest) return { status: 'collision' }
        if (old?.outcome) return { status: 'completed', outcome: structuredClone(old.outcome) }
        if (old && old.expires > control.instant) return { status: 'busy' }
        const ticket = Object.freeze({}); quarantine.set(upload.proposal.operationId, { upload: structuredClone(upload), ticket,
          revision: (old?.revision ?? 0) + 1, expires: control.instant + 30_000, outcome: null })
        return { status: 'acquired', ticket }
      }) },
      async finish(ticket, outcome, record, signal) { return locked(async () => {
        const entry = quarantine.get(record.operationId)
        if (signal.aborted || !entry || entry.ticket !== ticket || entry.outcome || entry.expires <= control.instant
          || entry.upload.digest !== record.proposalDigest) return { status: 'unconfirmed' }
        if (outcome.status === 'prepared' || outcome.status === 'escalation') {
          const bundle = outcome.status === 'prepared' ? outcome.value : outcome
          if (!control.methodEnabled || !same(bundle.decision.method, { ...METHOD, revision: control.methodRevision })
            || !decisionProofCurrent(bundle.decision, bundle.previousDecision, bundle.archiveAppend)
            || !same(history(record.contextKey).decision, bundle.previousDecision)) return { status: 'unconfirmed' }
        }
        entry.outcome = structuredClone(outcome); importAudits.push(structuredClone(record)); counts.importWrites++
        return { status: 'recorded' }
      }) },
    },
  }
  const publication: V3ProjectionPublicationPort = {
    async confirm(command, signal) { return locked(async () => {
      if (control.obscurePublication) return { status: 'unconfirmed' }
      const held = publications.get(command.operationId)
      if (!held) return { status: 'not_attempted' }
      if (held.key !== command.operationKey) return { status: 'collision' }
      const proof = await command.reprove(signal)
      if (proof.status !== 'current' || !authority(command, signal) || !same(cache.get(command.prepared.transition.contextKey), held.projection)
        || actualHead(command.prepared.transition.contextKey).pointer.versionRef !== command.prepared.version.reference
        || blocks.has(command.prepared.transition.contextKey)) return { status: 'not_current' }
      const confirmation: V3PublicationConfirmation = { operationId: command.operationId, operationKey: command.operationKey,
        projectionRef: held.projection.reference, versionRef: held.projection.rule.reference, checkedAt: clock().now, freshUntil: freshUntil() }
      return { status: 'confirmed', confirmation }
    }) },
    async publish(command, signal) { return locked(async () => {
      const old = publications.get(command.operationId)
      if (old) return { status: old.key === command.operationKey ? 'reported' : 'collision' }
      await control.beforePublication?.(); const preflight = await command.reprove(signal)
      if (preflight.status !== 'current' || !authority(command, signal)
        || actualHead(command.prepared.transition.contextKey).pointer.versionRef !== command.prepared.version.reference
        || blocks.has(command.prepared.transition.contextKey)) return { status: 'not_current' }
      const projection = structuredClone(command.projection)
      publications.set(command.operationId, { key: command.operationKey, projection })
      cache.set(command.prepared.transition.contextKey, projection); coverage.set(command.prepared.transition.contextKey, projection.rule.subject.context)
      heads.set(command.prepared.transition.contextKey, { ...heads.get(command.prepared.transition.contextKey)!, invalidatedProjectionRefs: [projection.reference] })
      counts.publicationWrites++; audit.push({ kind: 'projection', operationId: command.operationId, reference: projection.reference })
      if (control.losePublication) { control.losePublication = false; return { status: 'unconfirmed' } }
      return { status: 'reported' }
    }) },
  }
  const escalations: V3EscalationPublicationPort = {
    async confirm(command) {
      const old = escalationOperations.get(command.operationId)
      return old ? old.operationKey === command.operationKey ? { status: 'confirmed', operationKey: old.operationKey, escalationKey: old.outcome.key }
        : { status: 'collision' } : { status: 'not_attempted' }
    },
    async publish(command, signal) {
      const current = history(command.outcome.decision.contextKey)
      if (current.pointer.state === 'accepted' && current.version) {
        const state = command.outcome.reason === 'comparable_conflict' ? 'conflicted' : 'withdrawn'
        const version = must(readV3RuleVersionRecord({ ...current.version, reference: ref('rule-version', command.operationKey),
          revision: current.pointer.revision + 1, predecessor: current.pointer.versionRef, state,
          sourceDecisionRef: command.outcome.decision.reference, operationId: command.operationId, recordedAt: clock().now }, originals.registry, command.outcome.decision))
        const transition = must(readV3TransitionPlan({ schema: 3, protocolRevision: 1, operationId: command.operationId,
          contextKey: command.outcome.decision.contextKey, method: METHOD, factKind: version.subject.fact.fact.kind,
          action: state === 'conflicted' ? 'conflict' : 'withdraw', expected: current.pointer,
          next: { revision: version.revision, state, versionRef: version.reference }, primaryEvidenceVersionId: version.subject.evidence.versionId,
          sourceDecisionRef: command.outcome.decision.reference, resolutionRefs: [], recoverFromVersionRef: null,
          invalidatedProjectionRefs: current.invalidatedProjectionRefs, reproof: 'required_before_commit', commitConfirmation: 'required' }))
        const prepared: V3ImportPrepared = { proposalDigest: command.upload.digest, decision: command.outcome.decision,
          previousDecision: command.outcome.previousDecision, archiveAppend: command.outcome.archiveAppend, version, transition,
          proposalDisposition: 'superseded_by_source', acceptance: 'not_committed', reproof: 'required_before_commit' }
        const result = await commitV3PreparedTransition(prepared, { registry: originals.registry, store: versionStore, proofs: versionProofs,
          methodAuthority, now: () => clock().now, legalDate: () => clock().legalDate, invocationMilliseconds: 2000 }, signal)
        return { status: result.status === 'confirmed' ? 'reported' : 'unconfirmed' }
      }
      return locked(async () => {
        const old = escalationOperations.get(command.operationId)
        if (old) return { status: old.operationKey === command.operationKey ? 'reported' : 'collision' }
        const stored = quarantine.get(command.operationId)
        if (signal.aborted || !control.methodEnabled || !same(command.outcome.decision.method, { ...METHOD, revision: control.methodRevision })
          || !stored || stored.upload.digest !== command.upload.digest || !same(stored.outcome, command.outcome)
          || !decisionProofCurrent(command.outcome.decision, command.outcome.previousDecision, command.outcome.archiveAppend)
          || !same(history(command.outcome.decision.contextKey).decision, command.outcome.previousDecision)) return { status: 'unavailable' }
        recordEscalation(command)
        if (control.loseEscalation) { control.loseEscalation = false; return { status: 'unconfirmed' } }
        return { status: 'reported' }
      })
    },
  }
  const queueStorage: V3QueueStoragePort = {
    async read(jobKey) { return { status: 'ok', record: structuredClone(queueRows.get(jobKey) ?? null) } },
    async confirm(operationId, commandKey) { const held = queueOperations.get(operationId)
      return held ? held.commandKey === commandKey ? structuredClone(held) : { status: 'collision' } : { status: 'not_attempted' } },
    async compareAndSwap(command, authorization, signal) { return locked(async () => {
      const held = queueOperations.get(command.operationId)
      if (held) return held.commandKey === command.commandKey ? structuredClone(held) : { status: 'collision' }
      if (!same(queueRows.get(command.jobKey) ?? null, command.expected)) return { status: 'mismatch' }
      const proved = await authorization.reprove(signal)
      if (!proved || signal.aborted || !methodCurrent(authorization.receipt, authorization.method)
        || clock().now >= command.notAfter || (command.next.lease && command.next.lease.expiresAt <= clock().now)) return { status: 'unavailable' }
      queueRows.set(command.jobKey, structuredClone(command.next)); queueEvents.push(structuredClone(command.audit)); counts.queueWrites++
      const receipt = { status: 'committed' as const, operationId: command.operationId, commandKey: command.commandKey, record: structuredClone(command.next) }
      queueOperations.set(command.operationId, receipt)
      if (control.loseQueue) { control.loseQueue = false; return { status: 'unconfirmed' } }
      return structuredClone(receipt)
    }) },
  }
  const visitor: Omit<V3VisitorPorts<object, object>, 'registry' | 'method' | 'methodAuthority' | 'clock' | 'queue' | 'discoveryQueue'> = {
    dataMode: 'synthetic_test', ids: (() => { let n = 0; return () => ({ operationId: id('op3', `visitor-${++n}`), jobId: id('job3', `visitor-${n}`) }) })(),
    coverage: { async targets(pair) { return { zeilen: [...coverage.values()].filter((context) => context.scope.destinationCountryCode === pair.destinationCountryCode
      && context.scope.citizenship.countryCodes[0] === pair.citizenshipCountryCode).map((context) => ({ context, factKind: 'blank_passport_pages' as const })), problem: null } } },
    cache: { async read(k) { return control.cacheError ? { zeilen: null, problem: { status: 503, message: 'synthetic read error' } }
      : { zeilen: cache.has(k.contextKey) ? [structuredClone(cache.get(k.contextKey))] : [], problem: null } } },
    current: {
      async reprove(binding) {
        const block = blocks.get(binding.contextKey)
        if (block) return { status: 'conflict', decisionRef: block.outcome.decision.reference, reason: block.outcome.reason }
        const p = cache.get(binding.contextKey), h = history(binding.contextKey)
        if (h.pointer.state !== 'accepted') return { status: 'withdrawn' }
        if (!p || h.pointer.versionRef !== binding.versionRef || binding.projectionHash !== sha256Hex(schema2Kanonisch(p))) return { status: 'unavailable' }
        const receipt = Object.freeze({}); projectionReceipts.set(receipt, structuredClone(binding)); return { status: 'current', binding, receipt }
      },
      async confirmBatch(items, methodReceipt, _clock, signal) { return locked(async () => {
        await control.beforeRead?.()
        if (signal.aborted || !methodCurrent(methodReceipt, METHOD)) return { status: 'not_current' }
        return { status: 'confirmed', currentProjectionRefs: items.filter(({ receipt, binding }) => {
          const p = cache.get(binding.contextKey), h = history(binding.contextKey)
          return projectionReceipts.has(receipt) && same(projectionReceipts.get(receipt), binding) && p
            && sha256Hex(schema2Kanonisch(p)) === binding.projectionHash && h.pointer.state === 'accepted'
            && h.pointer.versionRef === binding.versionRef && !blocks.has(binding.contextKey)
            && p.expiresAt > clock().now && p.sourceFreshUntil > clock().now
        }).map(({ binding }) => binding.projectionRef) }
      }) },
    },
  }
  return { originals, control, clock, freshUntil, heads, versions, archives, versionOperations, publications, cache, coverage,
    blocks, escalationOperations, outbox, quarantine, importAudits, audit, queueRows, queueOperations, queueEvents, counts,
    methodAuthority, importPorts, versionProofs, versionStore, publication, escalations, queueStorage, visitor,
    history, actualHead, locked, methodCurrent }
}
