// Synthetic regulations.example receipt versions for the local lookup proof.
import assert from 'node:assert/strict'
import { provenanceCanonical, provenanceHash } from '../../../lib/readiness/official-truth-autonomous-provenance-artifact'
import { contentEvidenceVersionV2 } from '../../../lib/readiness/official-truth-content-identity'
import { verifyLocalIntegratedPilotBundle, type IntegratedPilotPayload, type LocalIntegratedPilotEnvelope } from '../../../lib/readiness/official-truth-integrated-pilot-bundle'
import { officialTruthReviewIdentityV3 } from '../../../lib/readiness/official-truth-rule-review-fingerprint'
import { rewriteIntegratedFixture } from '../official-truth-integrated-pilot-1/integrated-proof'

// Same calendar adjustment as the existing custody proof. Evidence and review
// identities are recomputed with the existing codecs. No live retrieval.
export function currentSyntheticFixture(envelope: LocalIntegratedPilotEnvelope, origin: number) {
  type Value = Record<string, unknown>
  const offset = origin - Date.parse('2026-10-06T12:00:00.000Z')
  const stamp = (s: string) => /^2026-10-06T12:0[01]:[0-9]{2}\.[0-9]{3}Z$/.test(s) ? new Date(Date.parse(s) + offset).toISOString() : s
  const parse = (b: Uint8Array): Value => JSON.parse(Buffer.from(b).toString())
  const encode = (v: unknown) => Buffer.from(provenanceCanonical(v)!)
  const values = envelope.bundle.artifacts.map(a => parse(a.canonicalBytes)), identities = new Map<string, Value>(), replacements = new Map<string, string>()
  for (const value of values) if (value.artifactType === 'implementation_bundle') {
    value.content = { ...(value.content as Value), bundleBase64: encode({ schema: 'implementation-source-bundle-v1', files: [
      { path: 'synthetic-custody-fixture.ts', utf8: '// Synthetic custody conformance capsule; no execution or source authority.\nexport const fixture = true;\n' },
    ] }).toString('base64') }
  }
  const collect = (value: unknown): void => {
    if (Array.isArray(value)) { value.forEach(collect); return }
    if (!value || typeof value !== 'object') return
    const v = value as Value
    if (v.identitySchema === 2 && typeof v.lookupKey === 'string' && typeof v.versionId === 'string') {
      const { versionId, ...preimage } = v
      const identity = contentEvidenceVersionV2({ ...preimage, retrievedAt: stamp(v.retrievedAt as string) })
      assert.ok(identity.ok)
      identities.set(versionId, { ...identity.value.identity, versionId: identity.value.versionId }); replacements.set(versionId, identity.value.versionId)
    }
    Object.values(v).forEach(collect)
  }
  values.forEach(collect)
  const transform = (value: unknown): unknown => {
    if (typeof value === 'string') return replacements.get(value) ?? stamp(value)
    if (Array.isArray(value)) {
      const result = value.map(transform)
      if (result.every(x => typeof x === 'string' && x.startsWith('ev2_'))) return (result as string[]).sort()
      if (result.every(x => x && typeof x === 'object' && typeof (x as Value).versionId === 'string')) return result.sort((a, b) => String((a as Value).versionId).localeCompare(String((b as Value).versionId)))
      return result
    }
    if (!value || typeof value !== 'object') return value
    const v = value as Value
    if (v.identitySchema === 2 && typeof v.sourceId === 'string' && typeof v.versionId === 'string' && identities.has(v.versionId)) {
      const identity = identities.get(v.versionId)!
      if ('lookupKey' in v) return identity
      const { lookupKey, ...compact } = identity; void lookupKey; return compact
    }
    const next = Object.fromEntries(Object.entries(v).map(([k, child]) => [k, transform(child)]))
    if (next.artifactType === 'eligible_version_snapshot') {
      next.dependencies = ((next.content as Value).entries as Value[]).map((entry, i) => ({ slot: `/entries/${i}/custody`, pin: entry.custody }))
    }
    return next
  }
  let rewritten = values.map(transform) as Value[]
  for (const artifact of rewritten) if (artifact.kind === 'AutonomousReviewConstructionV1') {
    const v = artifact.value as Value, preimage = v.safePreimage as Value
    const review = officialTruthReviewIdentityV3(preimage.candidate as Parameters<typeof officialTruthReviewIdentityV3>[0], preimage.supports as Parameters<typeof officialTruthReviewIdentityV3>[1])
    assert.ok(review.ok); replacements.set(v.reviewPacketKey as string, `review-packet:v3:${review.digest}`)
  }
  rewritten = rewritten.map(transform) as Value[]
  return rewriteIntegratedFixture({ profile: envelope.profile, bundle: { ...envelope.bundle,
    receiptBytes: encode(transform(parse(envelope.bundle.receiptBytes))), custodyBindingBytes: encode(transform(parse(envelope.bundle.custodyBindingBytes))),
    artifacts: envelope.bundle.artifacts.map((a, i) => ({ ...a, canonicalBytes: encode(rewritten[i]) })),
  } }, '__rehash_all__', v => v)
}

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
