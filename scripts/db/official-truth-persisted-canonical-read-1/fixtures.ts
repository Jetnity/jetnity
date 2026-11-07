// Local conformance fixtures only; never imported by the reader or application.
import assert from 'node:assert/strict'
import { provenanceCanonical, provenanceHash } from '../../../lib/readiness/official-truth-autonomous-provenance-artifact'
import { verifyLocalIntegratedPilotBundle, type IntegratedPilotPayload, type LocalIntegratedPilotEnvelope } from '../../../lib/readiness/official-truth-integrated-pilot-bundle'
import { runFreshControlledSyntheticPilot } from '../../official-truth-integrated-pilot-1/controlled-runtime'
import { pilotBody, type PilotItem, type PilotMode } from '../../official-truth-integrated-pilot-1/corpus'
import { prepareOriginals } from '../official-truth-original-custody-1/storage'

/** Actual fresh execution; no rewriting of clocks, reviews, identities or code. */
export async function freshExecutedFixture(mode: PilotMode) {
  const result = await runFreshControlledSyntheticPilot(mode)
  assert.equal(result.status, 'synthetic_bundle_verified')
  if (result.status !== 'synthetic_bundle_verified') throw Error('fresh_fixture_failed')
  assert.equal(result.trace.actualFactIdentity, true)
  assert.equal(result.trace.publicationCount, 0)
  return originalsFor(result.envelope)
}

/** Byte-for-byte fixed simulated responses, ordered by the verified manifest. */
export function originalsFor(envelope: LocalIntegratedPilotEnvelope) {
  const verified = verifyLocalIntegratedPilotBundle(envelope)
  assert.ok(verified.ok)
  return prepareOriginals(envelope, verified.value.receipt.payload.supports.map(support =>
    Buffer.from(pilotBody((support.binding as { contentItemId: PilotItem }).contentItemId), 'utf8')))
}

/** Deliberate forgery: receipt hashes and closure all pass; stored bytes disagree.
 * This is a negative historical fixture, never claimed as an executed producer.
 */
export function contradictingFactFixture(envelope: LocalIntegratedPilotEnvelope): LocalIntegratedPilotEnvelope {
  const payload = JSON.parse(Buffer.from(envelope.bundle.receiptBytes).toString('utf8')) as IntegratedPilotPayload
  const fact = { kind: 'requirement_effect', effect: 'required', visaMode: 'visa_on_arrival' }
  const ids = payload.supports.map(support => support.versionId)
  const factHash = provenanceHash('ot-fact-v1', { factSchema: payload.candidate.factSchema,
    applicabilitySchema: payload.candidate.applicabilitySchema, factKind: payload.candidate.factKind,
    requirementType: payload.candidate.requirementType, fact })!
  const candidateBinding = provenanceHash('ot-candidate-v1', { scope: payload.globalCell.scope, ruleScopeKey: payload.globalCell.ruleScopeKey,
    factKind: payload.candidate.factKind, requirementType: payload.candidate.requirementType, schemaFamily: payload.extractor.schemaFamily,
    factSchema: payload.candidate.factSchema, applicabilitySchema: payload.candidate.applicabilitySchema,
    factHash, evidenceQuality: payload.evidenceQuality, supportVersionIds: ids })!
  const policy = payload.policy === null ? null : { ...payload.policy,
    resultIdentity: provenanceHash('ot-composition-result-v1', { candidateBinding, factHash,
      extractorDefinition: payload.extractor.definition, extractorRegistrySnapshot: payload.extractor.registrySnapshot,
      outputContract: payload.extractor.outputContract, policyDefinition: payload.policy.definition,
      policyRegistrySnapshot: payload.policy.registrySnapshot, preHttpSelectionKey: payload.policy.preHttpSelectionKey,
      assignments: payload.policy.assignments, supportVersionIds: ids, citations: payload.citations })! }
  const next = { ...payload, candidate: { ...payload.candidate, fact, factHash, candidateBinding }, policy }
  const recordFingerprint = provenanceHash('ot-provenance-v1', next)!
  const binding = JSON.parse(Buffer.from(envelope.bundle.custodyBindingBytes).toString('utf8')) as { value: Record<string, unknown> }
  const result: LocalIntegratedPilotEnvelope = { profile: envelope.profile, bundle: { ...envelope.bundle, recordFingerprint,
    receiptBytes: Buffer.from(provenanceCanonical(next)!),
    custodyBindingBytes: Buffer.from(provenanceCanonical({ ...binding, value: { ...binding.value, receiptFingerprint: recordFingerprint } })!),
  } }
  assert.notEqual(recordFingerprint, envelope.bundle.recordFingerprint)
  assert.ok(verifyLocalIntegratedPilotBundle(result).ok, 'forgery must pass the full historical closure verifier')
  return result
}
