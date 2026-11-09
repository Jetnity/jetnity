// S1 TEST-ONLY: existing E1 fictional originals and actual I1 preparation.
// No provider/DB/source authority is created by these fixtures.
import assert from 'node:assert/strict'
import { sha256Hex } from '../../../lib/readiness/digest'
import { createV3ImportCoordinator, type V3ImportAudit, type V3ImportOutcome } from '../../../lib/readiness/official-truth-product-v3/import/service-server'
import { readV3ProposalUpload } from '../../../lib/readiness/official-truth-product-v3/import/interface'
import { makeSyntheticOriginals, METHOD, ref, must } from '../../../lib/readiness/official-truth-product-v3/integration/test-support/originals'
import { makeSyntheticStore } from '../../../lib/readiness/official-truth-product-v3/integration/test-support/store'
import { readV3RuleVersionRecord, readV3SourceDecisionRecord } from '../../../lib/readiness/official-truth-product-v3/contract'
import type { V3IntakeBinding } from '../../../lib/readiness/official-truth-product-v3/storage/intake-contract'

export function s1Fixture(seed = 's1', options: { pretty?: boolean } = {}) {
  const originals = makeSyntheticOriginals(), synthetic = makeSyntheticStore(originals)
  const proposal = originals.proposal(seed), text = JSON.stringify(proposal, null, options.pretty === false ? undefined : 2)
  const parsed = readV3ProposalUpload(text, originals.registry)
  if (!parsed.ok) assert.fail('synthetic S1 proposal')
  const binding: V3IntakeBinding = { schema: 3, kind: 'proposal_intake_binding', operationId: proposal.operationId,
    jobId: proposal.jobId, contextKey: proposal.contextKey, method: METHOD,
    runnerId: `runner3_${sha256Hex('s1-runner').slice(0,32)}`, deliveryId: `delivery3_${sha256Hex(seed).slice(0,32)}`,
    inputRevision: `snapshot:${sha256Hex('s1-runner-selected-snapshot')}` }
  const reference = { binding, proposalDigest: parsed.value.digest, bytes: parsed.value.bytes }
  const auditFor = (outcome: V3ImportOutcome): V3ImportAudit => ({ schema: 3, kind: 'import_attempt_record',
    operationId: proposal.operationId, proposalDigest: parsed.value.digest, jobId: proposal.jobId, contextKey: proposal.contextKey,
    method: METHOD, recordedAt: synthetic.clock().now, result: outcome.status,
    decisionRef: outcome.status === 'prepared' ? outcome.value.decision.reference : outcome.status === 'escalation' ? outcome.decision.reference : null,
    escalationKey: outcome.status === 'escalation' ? outcome.key : null })
  async function completion() {
    const result = await createV3ImportCoordinator(synthetic.importPorts).submit(text)
    if (result.status !== 'completed') assert.fail(`synthetic outcome ${result.status}`)
    return { outcome: result.outcome, audit: synthetic.importAudits.at(-1)! }
  }
  async function withArchivedPredecessor(reason: 'primary_unclear' | 'comparable_conflict') {
    const seedText = JSON.stringify(originals.proposal(`${seed}-predecessor`))
    const before = await createV3ImportCoordinator(synthetic.importPorts).submit(seedText)
    if (before.status !== 'completed' || before.outcome.status !== 'prepared'
      || before.outcome.value.decision.primary.status !== 'clear') assert.fail('archive predecessor fixture')
    const prepared = before.outcome.value, primary = prepared.decision.primary
    if (primary.status !== 'clear') assert.fail('clear primary')
    originals.control.counterPages = 7
    const counter = originals.extract(proposal.context, 'synthetic-counter')
    originals.control.counterPages = 9
    const corrected = originals.extract(proposal.context, 'synthetic-counter')
    const conflictRef = ref('source-conflict', `${seed}-previous-conflict`)
    const previous = must(readV3SourceDecisionRecord({ ...prepared.decision,
      reference: ref('source-decision', `${seed}-previous`), knownConflicts: [{ reference: conflictRef,
        detectedDecisionRef: ref('source-decision', `${seed}-detected`), detectedAt: originals.control.retrievedAt,
        primary: primary.observation, counter, resolution: { reference: ref('conflict-resolution', `${seed}-resolution`),
          predecessor: null, conflictRef, method: METHOD, resolvedAt: synthetic.clock().now,
          legalAsOfDate: synthetic.clock().legalDate, basis: 'corrected_publication', observations: [corrected] } }] }, originals.registry))
    const version = must(readV3RuleVersionRecord({ ...prepared.version, reference: ref('rule-version', `${seed}-previous`),
      sourceDecisionRef: previous.reference }, originals.registry, previous))
    synthetic.heads.set(proposal.contextKey, { pointer: { state: 'accepted', revision: 1, versionRef: version.reference },
      version, decision: previous, decisionPredecessor: null, decisionArchiveAppend: null, invalidatedProjectionRefs: [] })
    originals.control.archive = true
    originals.control.primaryUnclear = reason === 'primary_unclear'
    originals.control.counter = reason === 'comparable_conflict' ? 'conflicts' : 'not_found'
    originals.control.counterPages = 8
    return completion()
  }
  return { originals, synthetic, proposal, text, upload: parsed.value, binding, reference, auditFor, completion, withArchivedPredecessor }
}
