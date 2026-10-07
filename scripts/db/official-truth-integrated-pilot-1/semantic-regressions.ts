import assert from 'node:assert/strict'
import { provenanceCanonical, type Pin } from '../../../lib/readiness/official-truth-autonomous-provenance-artifact'
import { sha256Hex } from '../../../lib/readiness/digest'
import { verifyLocalIntegratedPilotBundle, type IntegratedPilotArtifactInput, type LocalIntegratedPilotEnvelope } from '../../../lib/readiness/official-truth-integrated-pilot-bundle'
import type { LocalProofCluster } from './local-cluster'
import { rewriteIntegratedFixture } from './integrated-proof'
import { LocalPgConnection, LocalPgError, pgBytes, pgCompositeArray, pgText, type PgRows } from './pg-wire'
import { inspectIntegratedReadback, readIntegratedRows } from './storage'

const parse = (bytes: Uint8Array): Record<string, unknown> => JSON.parse(Buffer.from(bytes).toString('utf8'))
const canonical = (value: unknown): string => { const result = provenanceCanonical(value); assert.notEqual(result, null); return result! }
const content = (artifact: IntegratedPilotArtifactInput): Record<string, unknown> => parse(artifact.canonicalBytes).content as Record<string, unknown>
const semanticRefusal = (error: unknown) => error instanceof LocalPgError && error.code === 'P0001'

/** Pure SQL probes: retained name/version collisions cannot conceal missing semantic validation. */
export async function runSemanticRegressions({ owner, cluster, oids, primaryEnvelope, composedEnvelope }: Readonly<{
  owner: LocalPgConnection
  cluster: LocalProofCluster
  oids: Readonly<{ element: number; array: number }>
  primaryEnvelope: LocalIntegratedPilotEnvelope
  composedEnvelope: LocalIntegratedPilotEnvelope
}>): Promise<string[]> {
  const checks: string[] = []
  const validate = (envelope: LocalIntegratedPilotEnvelope) => {
    const bundle = envelope.bundle
    const artifacts = pgCompositeArray(oids.array, oids.element, bundle.artifacts.map(a => [
      pgText(a.pin.id), pgText(String(a.pin.version), 20), pgText(a.pin.digest), pgText(a.artifactType),
      pgText(a.artifactType === 'global_cell' ? 'global_definition_v1' : a.artifactType.endsWith('V1') ? 'custody_v1' : 'manifest_v1'),
      pgText(String(a.artifactContractVersion), 23), pgBytes(a.canonicalBytes),
    ]))
    return owner.query('SELECT official_provenance_private.validate_bundle_v2($1::text,$2::text,$3::bytea,$4::bytea,$5::official_provenance_api.artifact_input_v1[])',
      [pgText(envelope.profile), pgText(bundle.recordFingerprint), pgBytes(bundle.receiptBytes), pgBytes(bundle.custodyBindingBytes), artifacts])
  }
  const descriptorVariant = (envelope: LocalIntegratedPilotEnvelope, id: string, patch: Record<string, unknown>) =>
    rewriteIntegratedFixture(envelope, id, value => {
      const previous = value.content as Record<string, unknown>
      return { ...value, content: { ...previous, descriptor: { ...(previous.descriptor as Record<string, unknown>), ...patch } } }
    })
  // Establish that the exact rewrite/rehash operation preserves both complete valid graphs.
  for (const envelope of [primaryEnvelope, composedEnvelope]) {
    const rewritten = rewriteIntegratedFixture(envelope, 'otx_integrated_primary', value => value)
    assert.equal(verifyLocalIntegratedPilotBundle(rewritten).ok, true)
    await validate(rewritten)
  }
  checks.push('pure_sql_validator_accepts_complete_rehashed_primary_and_composed_baselines')
  const primaryDefinition = primaryEnvelope.bundle.artifacts.find(a => a.pin.id === 'otx_integrated_primary')!
  const primaryDescriptor = content(primaryDefinition).descriptor as { urlAllowlist: readonly { kind: 'exact'; canonicalUrl: string }[] }
  const variants: readonly [string, LocalIntegratedPilotEnvelope][] = [
    ['original_request_unqualified', rewriteIntegratedFixture(primaryEnvelope,primaryEnvelope.bundle.artifacts.find(a=>a.artifactType==='original_observation')!.pin.id,value=>({...value,content:{...(value.content as Record<string,unknown>),requestUrl:'https://unregistered.example/incorrect'}}))],
    ['validity_origin_identity_mismatch', rewriteIntegratedFixture(primaryEnvelope,primaryEnvelope.bundle.artifacts.find(a=>a.artifactType==='validity_origin')!.pin.id,value=>({...value,content:{...(value.content as Record<string,unknown>),validFrom:null,validFromBasis:{kind:'no_bound_asserted'}}}))],
    ['global_admission_category_mismatch', rewriteIntegratedFixture(primaryEnvelope,primaryEnvelope.bundle.artifacts.find(a=>a.artifactType==='GlobalCellAdmissionV1')!.pin.id,value=>{const v=value.value as Record<string,unknown>,d=v.dimensionBasis as Record<string,unknown>;return {...value,value:{...v,dimensionBasis:{...d,destinationCountryCode:{...(d.destinationCountryCode as Record<string,unknown>),category:'US'}}}}})],
    ['primary_required_field_paths', descriptorVariant(primaryEnvelope, 'otx_integrated_primary', { requiredFieldPaths: ['effect'] })],
    ['selected_content_type_ineligible', descriptorVariant(primaryEnvelope, 'otx_integrated_primary', { contentTypes: ['text/html'] })],
    ['duplicate_content_types', descriptorVariant(primaryEnvelope, 'otx_integrated_primary', { contentTypes: ['application/json', 'application/json'] })],
    ['selected_url_ineligible', descriptorVariant(primaryEnvelope, 'otx_integrated_primary', { urlAllowlist: primaryDescriptor.urlAllowlist.map(rule => ({ ...rule, canonicalUrl: `${rule.canonicalUrl}/unmatched` })) })],
    ['unselected_composed_duplicate_fields', descriptorVariant(primaryEnvelope, 'otx_integrated_composed', { requiredFieldPaths: ['effect', 'effect', 'visaMode'] })],
    ['unselected_primary_illegal_fields', descriptorVariant(composedEnvelope, 'otx_integrated_primary', { requiredFieldPaths: ['effect'] })],
  ]
  for (const [name, envelope] of variants) {
    await assert.rejects(validate(envelope), semanticRefusal, `SQL must independently reject ${name}`)
    checks.push(`pure_sql_correct_hash_${name}_refused`)
  }

  // A separately named, individually valid definition duplicates the selector, not the Pin.
  const duplicateId = 'otx_integrated_primary_duplicate', original = parse(primaryDefinition.canonicalBytes)
  const originalContent = original.content as Record<string, unknown>
  const duplicateBytes = Buffer.from(canonical({ ...original, id: duplicateId, content: { ...originalContent,
    descriptor: { ...(originalContent.descriptor as Record<string, unknown>), extractorId: duplicateId } } }))
  const duplicate: IntegratedPilotArtifactInput = { ...primaryDefinition, canonicalBytes: duplicateBytes,
    pin: { id: duplicateId, version: 1, digest: sha256Hex(duplicateBytes.toString('utf8')) } }
  const augmented = { ...primaryEnvelope, bundle: { ...primaryEnvelope.bundle, artifacts: [...primaryEnvelope.bundle.artifacts, duplicate] } }
  const duplicateSelector = rewriteIntegratedFixture(augmented, 'pilot-extractor-registry', value => {
    const registry = value.content as { definitions: readonly { id: string; version: number; current: boolean; definition: Pin }[] }
    const definitions = [...registry.definitions, { id: duplicateId, version: 1, current: true, definition: duplicate.pin }]
      .sort((a, b) => a.id < b.id ? -1 : a.id > b.id ? 1 : a.version - b.version)
    return { ...value, content: { definitions }, dependencies: definitions.map((entry, index) => ({ slot: `/definitions/${index}/definition`, pin: entry.definition })) }
  })
  const baseline = verifyLocalIntegratedPilotBundle(primaryEnvelope); assert.equal(baseline.ok, true)
  if (!baseline.ok) throw Error('semantic_regression_baseline')
  const addedEdges = (original.dependencies as unknown[]).length + 1
  assert.ok(baseline.value.artifactEdges.length + baseline.value.receiptRoots.length + baseline.value.bindingRoots.length + addedEdges + 1 <= 1024)
  await assert.rejects(validate(duplicateSelector), semanticRefusal, 'SQL must reject duplicate current selectors with distinct valid names')
  checks.push('pure_sql_correct_hash_duplicate_current_selector_distinct_definition_refused')

  // Codec-level date boundary: UTC midnight is before 00:30Z regardless of caller timezone.
  // These are explicitly helper-level probes, not a fabricated complete receipt.
  const validity = content(primaryEnvelope.bundle.artifacts.find(a => a.artifactType === 'validity_origin')!)
  const boundary = { ...validity, validFrom: '2026-10-01', validUntil: '2026-10-01T00:30:00Z',
    validFromBasis: { ...(validity.validFromBasis as Record<string, unknown>), value: '2026-10-01' },
    validUntilBasis: { ...(validity.validFromBasis as Record<string, unknown>), value: '2026-10-01T00:30:00Z' } }
  for (const timezone of ['UTC', 'America/Los_Angeles', 'Pacific/Kiritimati']) {
    await owner.query('BEGIN')
    try {
      await owner.query("SELECT pg_catalog.set_config('TimeZone',$1::text,true)", [pgText(timezone)])
      await owner.query("SELECT official_provenance_private.typed($1::jsonb,'validity_origin')", [pgText(canonical(boundary))])
    } finally { await owner.query('ROLLBACK') }
  }
  checks.push('sql_typed_validity_midnight_boundary_independent_of_three_caller_timezones')

  const reader = await LocalPgConnection.connect(cluster, 'ot_provenance_reader')
  let rows: PgRows
  try {
    await reader.query('BEGIN ISOLATION LEVEL REPEATABLE READ READ ONLY')
    rows = await readIntegratedRows(reader, primaryEnvelope.bundle.recordFingerprint)
    await reader.query('COMMIT')
  } finally { reader.close() }
  const inspect = (result: PgRows) => inspectIntegratedReadback({ profile: primaryEnvelope.profile, rows: result }, primaryEnvelope.bundle.recordFingerprint)
  assert.equal(inspect(rows).status, 'verified')
  const edgeIndex = rows.findIndex(row => row.row_kind === 'artifact_link'); assert.ok(edgeIndex >= 0)
  for (const field of ['parent_version', 'target_version']) {
    for (const invalid of ['01', '1e0', ' 1', '+1', '0', '9007199254740992']) {
      const changed = rows.map((row, index) => index === edgeIndex ? { ...row, [field]: invalid } : row)
      assert.throws(() => inspect(changed), /local_storage_response_version/)
    }
  }
  const firstArtifact = rows.findIndex(row => row.row_kind === 'artifact'); assert.equal(rows[firstArtifact + 1]?.row_kind, 'artifact')
  const artifactOrder = [...rows]; [artifactOrder[firstArtifact], artifactOrder[firstArtifact + 1]] = [artifactOrder[firstArtifact + 1]!, artifactOrder[firstArtifact]!]
  assert.throws(() => inspect(artifactOrder), /local_storage_response_order/)
  const kindOrder = [...rows]; [kindOrder[0], kindOrder[1]] = [kindOrder[1]!, kindOrder[0]!]
  assert.throws(() => inspect(kindOrder), /local_storage_response_order/)
  for (const value of [undefined, 1, false, {}]) {
    const malformed = rows.map((row, index) => index === edgeIndex ? { ...row, detail_code: value } : row)
    assert.throws(() => inspect(malformed as unknown as PgRows), /local_storage_response_shape/)
  }
  checks.push('fresh_readback_rejects_noncanonical_edge_versions_out_of_order_rows_and_nonstring_nullable_columns')
  return checks
}
