// Synthetic regulations.example receipt versions for the local lookup proof.
import { provenanceCanonical, provenanceHash } from '../../../lib/readiness/official-truth-autonomous-provenance-artifact'
import { verifyLocalIntegratedPilotBundle, type IntegratedPilotPayload, type LocalIntegratedPilotEnvelope } from '../../../lib/readiness/official-truth-integrated-pilot-bundle'

/** Second stored receipt for the same cell, scope, fact kind and requirement type. */
export function alternateSameIdentityReceipt(envelope: LocalIntegratedPilotEnvelope): LocalIntegratedPilotEnvelope {
  const payload = JSON.parse(Buffer.from(envelope.bundle.receiptBytes).toString('utf8')) as IntegratedPilotPayload
  const reference = Date.parse(payload.proof.serverReferenceTime)
  const offsets = [1000, -1000, 500, -500, 100, -100, 2000, -2000, 5000, -5000, 10000, -10000]
  for (const offset of offsets) {
    const shifted = reference + offset
    if (shifted === reference) continue
    const serverReferenceTime = new Date(shifted).toISOString()
    const ids = payload.supports.map(support => support.versionId)
    const proofIdentity = provenanceHash('ot-proof-v1', {
      contract: payload.proof.contract, reviewPacketKey: payload.proof.reviewPacketKey, ruleScopeKey: payload.globalCell.ruleScopeKey,
      factKind: payload.candidate.factKind, supportVersionIds: ids, serverReferenceTime, catalogSnapshot: payload.proof.catalogSnapshot,
      freshnessContract: payload.proof.freshnessContract, evidenceFreshnessAtReference: 'current' as const,
    })
    if (!proofIdentity) continue
    const nextPayload: IntegratedPilotPayload = { ...payload, proof: { ...payload.proof, serverReferenceTime, proofIdentity } }
    const canonical = provenanceCanonical(nextPayload)
    const recordFingerprint = provenanceHash('ot-provenance-v1', nextPayload)
    if (!canonical || !recordFingerprint || recordFingerprint === envelope.bundle.recordFingerprint) continue
    const binding = JSON.parse(Buffer.from(envelope.bundle.custodyBindingBytes).toString('utf8')) as { value: Record<string, unknown> }
    const bindingCanonical = provenanceCanonical({ ...binding, value: { ...binding.value, receiptFingerprint: recordFingerprint } })
    if (!bindingCanonical) continue
    const candidate: LocalIntegratedPilotEnvelope = { profile: envelope.profile, bundle: {
      recordFingerprint, receiptBytes: Buffer.from(canonical), custodyBindingBytes: Buffer.from(bindingCanonical), artifacts: envelope.bundle.artifacts,
    } }
    const verified = verifyLocalIntegratedPilotBundle(candidate)
    if (!verified.ok) continue
    if (verified.value.receipt.payload.globalCell.ruleScopeKey !== payload.globalCell.ruleScopeKey) continue
    if (verified.value.receipt.payload.candidate.factKind !== payload.candidate.factKind) continue
    if (verified.value.receipt.payload.candidate.requirementType !== payload.candidate.requirementType) continue
    if (verified.value.receipt.payload.globalCell.definition.digest !== payload.globalCell.definition.digest) continue
    return candidate
  }
  throw new Error('alternate_identity_unverified')
}
