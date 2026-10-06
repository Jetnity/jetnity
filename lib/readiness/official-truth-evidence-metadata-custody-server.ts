import 'server-only'
import { regelScopeAusEvidenceScope } from '@/lib/readiness/rule-claims'
import { historical, historicalValuesEqual, pinsEqual, provenanceCanonical, refused, type Pin } from '@/lib/readiness/official-truth-autonomous-provenance-artifact'
import { artifactPinMatches, readHistoricalArtifact } from '@/lib/readiness/official-truth-autonomous-provenance-record'
import { validateGlobalCellAdmissionValue } from '@/lib/readiness/official-truth-global-cell-admission-server'

/** Checks historical compact identities/pins. Does NOT resolve or certify original issuance. */
export function validateAcceptedCustodyValue(input: {
  definition: unknown; admission: unknown; admissionPin: Pin; scopeContract: Pin;
  custody: unknown; custodyPin: Pin; expectedIdentity: unknown; identityContract: Pin; hashContract: Pin;
}) {
  if (!input || typeof input !== 'object' || provenanceCanonical(input) === null) return refused('schema_incompatible')
  const cell = validateGlobalCellAdmissionValue(input.definition, input.admission, input.admissionPin, input.scopeContract)
  if (!cell.ok) return cell
  const custody = readHistoricalArtifact('AcceptedEvidenceCustodyV1', input.custody)
  if (!custody.ok) return custody
  const c = custody.value.value
  if (!artifactPinMatches('AcceptedEvidenceCustodyV1', input.custodyPin, custody.value)
    || !pinsEqual(c.cell, cell.value.admission.value.cell) || !pinsEqual(c.globalAdmission, input.admissionPin)
    || !pinsEqual(c.scopeContract, input.scopeContract) || !pinsEqual(c.identityContract, input.identityContract)
    || !pinsEqual(c.hashContract, input.hashContract)) return refused('pin_inconsistent')
  const projected = regelScopeAusEvidenceScope(c.evidenceScope)
  const expected = regelScopeAusEvidenceScope(cell.value.definition.scope)
  if (!projected.ok || !expected.ok || projected.key !== expected.key
    || !historicalValuesEqual(projected.scope, expected.scope)) return refused('scope_mismatch')
  if (!historicalValuesEqual(c.evidenceIdentity, input.expectedIdentity)) return refused('evidence_identity_drift')
  return historical(custody.value)
}
