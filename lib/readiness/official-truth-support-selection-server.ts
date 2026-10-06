import 'server-only'
import { historical, historicalValuesEqual, ownRecord, pinsEqual, provenanceCanonical, readPin, refused, type Pin } from '@/lib/readiness/official-truth-autonomous-provenance-artifact'
import { artifactPinMatches, readHistoricalArtifact, type HistoricalArtifact } from '@/lib/readiness/official-truth-autonomous-provenance-record'
import { validateAcceptedCustodyValue } from '@/lib/readiness/official-truth-evidence-metadata-custody-server'

/** Synthetic already-qualified snapshot projection, NOT a live selector or issuer.
 * The full supplied snapshot is retained; its pin is comparison data, not origin proof.
 * Production has no snapshot loader and cannot call this to obtain a live handle.
 */
export function selectHistoricalSupports(input: {
  definition: unknown; selectionDefinition: unknown; selectionPin: Pin; admission: unknown; admissionPin: Pin; scopeContract: Pin;
  identityContract: Pin; hashContract: Pin; eligibleVersionSnapshot: Pin; catalogSnapshot: Pin; extractorRegistrySnapshot: Pin;
  policyRegistrySnapshot: Pin | null; entries: unknown;
}) {
  if (!input || typeof input !== 'object' || provenanceCanonical(input) === null) return refused('schema_incompatible')
  const definition = readHistoricalArtifact('SupportSelectionDefinitionV1', input.selectionDefinition)
  if (!definition.ok || !artifactPinMatches('SupportSelectionDefinitionV1', input.selectionPin, definition.value)) return refused('pin_inconsistent')
  const d = definition.value.value
  if (!readPin(input.eligibleVersionSnapshot) || !readPin(input.catalogSnapshot) || !readPin(input.extractorRegistrySnapshot)
    || (input.policyRegistrySnapshot !== null && !readPin(input.policyRegistrySnapshot))) return refused('pin_inconsistent')
  if ((d.evidenceQuality === 'explicit_primary_statement') !== (input.policyRegistrySnapshot === null)) return refused('support_selection_invalid')
  if (provenanceCanonical(input.entries) === null || !Array.isArray(input.entries) || input.entries.length > 256) return refused('support_selection_invalid')
  const required = d.requiredContentItemRefs.map(r => JSON.stringify([r.sourceId, r.contentItemId]))
  const selected = new Map<string, { custody: HistoricalArtifact<'AcceptedEvidenceCustodyV1'>; pin: Pin }>()
  const seenVersions = new Set<string>(), seenPins = new Set<string>(), semanticPins = new Set<string>()
  for (const entry of input.entries) {
    const row = ownRecord(entry, ['custody', 'pin', 'eligible'])
    if (!row || typeof row.eligible !== 'boolean') return refused('support_selection_invalid')
    const p = readPin(row.pin), c = readHistoricalArtifact('AcceptedEvidenceCustodyV1', row.custody)
    if (!p || !c.ok) return refused('schema_incompatible')
    const checked = validateAcceptedCustodyValue({ ...input, custody: c.value, custodyPin: p, expectedIdentity: c.value.value.evidenceIdentity })
    if (!checked.ok) return checked
    if (!pinsEqual(d.cell, c.value.value.cell) || d.requirementType !== c.value.value.evidenceScope.requirementType) return refused('scope_mismatch')
    const e = c.value.value.evidenceIdentity, item = JSON.stringify([e.sourceId, e.contentItemId]), pinKey = provenanceCanonical(p)!
    if (!required.includes(item) || seenVersions.has(e.versionId) || seenPins.has(pinKey) || semanticPins.has(`${p.id}:${p.version}`)) return refused('support_selection_invalid')
    seenVersions.add(e.versionId); seenPins.add(pinKey); semanticPins.add(`${p.id}:${p.version}`)
    if (row.eligible) {
      if (selected.has(item)) return refused('support_selection_invalid')
      selected.set(item, { custody: c.value, pin: p })
    }
  }
  if (selected.size !== required.length) return refused('support_selection_invalid')
  const supports = [...selected.values()].sort((a, b) => a.custody.value.evidenceIdentity.versionId < b.custody.value.evidenceIdentity.versionId ? -1 : 1)
  const manifest = readHistoricalArtifact('SelectedSupportManifestV1', {
    kind: 'SelectedSupportManifestV1', schemaVersion: 1,
    value: { selectionDefinition: input.selectionPin, cell: d.cell, globalAdmission: input.admissionPin,
      requirementType: d.requirementType, factKind: d.factKind, evidenceQuality: d.evidenceQuality,
      eligibleVersionSnapshot: input.eligibleVersionSnapshot, catalogSnapshot: input.catalogSnapshot,
      extractorRegistrySnapshot: input.extractorRegistrySnapshot, policyRegistrySnapshot: input.policyRegistrySnapshot,
      supports: supports.map(s => ({ versionId: s.custody.value.evidenceIdentity.versionId, custody: s.pin })) },
  })
  if (!manifest.ok) return manifest
  // Defensive exact set equality, independent of iteration order or caller subset.
  if (!historicalValuesEqual([...selected.keys()].sort(), [...required].sort())) return refused('support_selection_invalid')
  return historical({ manifest: manifest.value, custodies: supports.map(s => s.custody), snapshot: JSON.parse(provenanceCanonical(input.entries)!) as unknown })
}
