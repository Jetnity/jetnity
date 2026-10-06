import 'server-only'
import { historical, historicalValuesEqual, pinsEqual, refused, type Pin } from '@/lib/readiness/official-truth-autonomous-provenance-artifact'
import { artifactPinMatches, cellPinMatches, readGlobalCellDefinition, readHistoricalArtifact } from '@/lib/readiness/official-truth-autonomous-provenance-record'

/** Value equality only: no corpus lookup, category admission, current eligibility or authority. */
export function validateGlobalCellAdmissionValue(definition: unknown, admission: unknown, admissionPin: Pin, scopeContract: Pin) {
  const cell = readGlobalCellDefinition(definition), admitted = readHistoricalArtifact('GlobalCellAdmissionV1', admission)
  if (!cell.ok || !admitted.ok) return refused('schema_incompatible')
  if (!cellPinMatches(admitted.value.value.cell, cell.value) || !artifactPinMatches('GlobalCellAdmissionV1', admissionPin, admitted.value)
    || !pinsEqual(scopeContract, admitted.value.value.scopeContract)) return refused('pin_inconsistent')
  for (const key of Object.keys(cell.value.scope) as (keyof typeof cell.value.scope)[]) {
    if (!historicalValuesEqual(cell.value.scope[key], admitted.value.value.dimensionBasis[key].category)) return refused('scope_mismatch')
  }
  return historical({ definition: cell.value, admission: admitted.value })
}
