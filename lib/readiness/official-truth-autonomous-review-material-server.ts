import 'server-only'
import { officialTruthRegelKandidatAusEvidence } from '@/lib/readiness/official-truth-rule-candidate'
import { officialTruthReviewIdentityV3 } from '@/lib/readiness/official-truth-rule-review-fingerprint'
import { regelScopeAusEvidenceScope } from '@/lib/readiness/rule-claims'
import { historical, historicalValuesEqual, ownRecord, pinsEqual, provenanceCanonical, readPin, refused, type Pin } from '@/lib/readiness/official-truth-autonomous-provenance-artifact'
import { artifactPinMatches, cellPinMatches, readGlobalCellDefinition, readHistoricalArtifact } from '@/lib/readiness/official-truth-autonomous-provenance-record'

/** Pure value constructor over complete synthetic accepted values; issues NO stage handle.
 * Live wiring must independently select/resolve these values in a later reviewed slice.
 */
export function constructHistoricalAutonomousReview(input: {
  definition: unknown; manifest: unknown; manifestPin: Pin; constructionContract: Pin;
  custodies: unknown; acceptedVersions: unknown; registry: unknown; proposal: unknown;
}) {
  if (!input || typeof input !== 'object' || provenanceCanonical(input) === null) return refused('schema_incompatible')
  if (input.proposal !== null) return refused('proposal_not_null')
  const cell = readGlobalCellDefinition(input.definition), manifest = readHistoricalArtifact('SelectedSupportManifestV1', input.manifest)
  if (!cell.ok || !manifest.ok || !readPin(input.constructionContract)) return refused('schema_incompatible')
  const m = manifest.value.value
  if (!cellPinMatches(m.cell, cell.value) || !artifactPinMatches('SelectedSupportManifestV1', input.manifestPin, manifest.value)) return refused('pin_inconsistent')
  if (provenanceCanonical(input.custodies) === null || provenanceCanonical(input.acceptedVersions) === null
    || provenanceCanonical(input.registry) === null || !Array.isArray(input.custodies) || !Array.isArray(input.acceptedVersions)
    || input.custodies.length !== m.supports.length || input.acceptedVersions.length !== m.supports.length) return refused('support_selection_invalid')
  const compacts = []
  for (let i = 0; i < m.supports.length; i++) {
    const c = readHistoricalArtifact('AcceptedEvidenceCustodyV1', input.custodies[i]), s = m.supports[i]!
    if (!c.ok || !artifactPinMatches('AcceptedEvidenceCustodyV1', s.custody, c.value)) return refused('pin_inconsistent')
    const v = c.value.value, e = v.evidenceIdentity
    const rebound = regelScopeAusEvidenceScope(v.evidenceScope)
    if (!pinsEqual(v.cell, m.cell) || !pinsEqual(v.globalAdmission, m.globalAdmission) || !rebound.ok
      || !historicalValuesEqual(rebound.scope, cell.value.scope)) return refused('scope_mismatch')
    if (e.versionId !== s.versionId) return refused('evidence_identity_drift')
    const version = input.acceptedVersions[i] as Record<string, unknown>
    if (!ownRecord(version, [...Object.keys(e), 'previousVersionId', 'lifecycle', 'validationState', 'sourceClass', 'authorityName', 'publisherName', 'scope', 'extractionNote'])
      || version.extractionNote !== null || !historicalValuesEqual(version.scope, v.evidenceScope)) return refused('evidence_identity_drift')
    for (const key of Object.keys(e) as (keyof typeof e)[]) {
      if (!historicalValuesEqual(e[key], version[key])) return refused('evidence_identity_drift')
    }
    const { lookupKey, ...compact } = e
    void lookupKey
    compacts.push(compact)
  }
  const candidate = officialTruthRegelKandidatAusEvidence(input.acceptedVersions, input.registry,
    { factKind: m.factKind, evidenceQuality: m.evidenceQuality, proposal: null })
  if (!candidate.ok) return refused('schema_incompatible')
  const k = candidate.kandidat
  if (k.lifecycle !== 'candidate' || k.validationState !== 'pending' || k.proposal !== null
    || !historicalValuesEqual(k.scope, cell.value.scope) || k.scope.requirementType !== m.requirementType
    || !historicalValuesEqual(k.supportVersionIds, m.supports.map(s => s.versionId))) return refused('scope_mismatch')
  const fingerprint = officialTruthReviewIdentityV3(k, compacts)
  if (!fingerprint.ok) return refused('schema_incompatible')
  return readHistoricalArtifact('AutonomousReviewConstructionV1', { kind: 'AutonomousReviewConstructionV1', schemaVersion: 1,
    value: { cell: m.cell, selectedSupportManifest: input.manifestPin, constructionContract: input.constructionContract,
      safePreimage: fingerprint.preimage, reviewPacketKey: `review-packet:v3:${fingerprint.digest}` } })
}

/** Separate #861 binding, never a receipt extension or a bundle/authority constructor. */
export function validateHistoricalCustodyBinding(input: {
  binding: unknown; receiptFingerprint: string; admission: unknown; admissionPin: Pin;
  manifest: unknown; manifestPin: Pin; review: unknown; reviewPin: Pin;
}) {
  if (!input || typeof input !== 'object' || provenanceCanonical(input) === null) return refused('schema_incompatible')
  const b = readHistoricalArtifact('CustodyDependencyBindingV1', input.binding)
  const a = readHistoricalArtifact('GlobalCellAdmissionV1', input.admission)
  const m = readHistoricalArtifact('SelectedSupportManifestV1', input.manifest)
  const r = readHistoricalArtifact('AutonomousReviewConstructionV1', input.review)
  if (!b.ok || !a.ok || !m.ok || !r.ok) return refused('schema_incompatible')
  if (!artifactPinMatches('GlobalCellAdmissionV1', input.admissionPin, a.value)
    || !artifactPinMatches('SelectedSupportManifestV1', input.manifestPin, m.value)
    || !artifactPinMatches('AutonomousReviewConstructionV1', input.reviewPin, r.value)
    || b.value.value.receiptFingerprint !== input.receiptFingerprint
    || !pinsEqual(b.value.value.globalAdmission, input.admissionPin)
    || !pinsEqual(b.value.value.selectedSupportManifest, input.manifestPin)
    || !pinsEqual(b.value.value.autonomousReviewConstruction, input.reviewPin)
    || !pinsEqual(a.value.value.cell, m.value.value.cell) || !pinsEqual(a.value.value.cell, r.value.value.cell)
    || !pinsEqual(m.value.value.globalAdmission, input.admissionPin)
    || !pinsEqual(r.value.value.selectedSupportManifest, input.manifestPin)
    || !historicalValuesEqual(r.value.value.safePreimage.candidate.supportVersionIds, m.value.value.supports.map(s => s.versionId))
    || r.value.value.safePreimage.candidate.factKind !== m.value.value.factKind
    || r.value.value.safePreimage.candidate.evidenceQuality !== m.value.value.evidenceQuality
    || r.value.value.safePreimage.candidate.scope.requirementType !== m.value.value.requirementType) return refused('custody_dependency_mismatch')
  const scope = r.value.value.safePreimage.candidate.scope
  for (const key of Object.keys(scope) as (keyof typeof scope)[]) {
    if (!historicalValuesEqual(scope[key], a.value.value.dimensionBasis[key].category)) return refused('custody_dependency_mismatch')
  }
  return historical(b.value)
}
