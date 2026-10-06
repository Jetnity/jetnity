import assert from 'node:assert/strict'
import { existsSync } from 'node:fs'
import { provenanceCanonical, historicalPinFor, decodeProvenanceBytes, type Pin } from '../../../lib/readiness/official-truth-autonomous-provenance-artifact'
import { verifyIntegratedPilotBundle, type IntegratedPilotArtifactInput, type IntegratedPilotArtifactType, type IntegratedPilotBundleInput } from '../../../lib/readiness/official-truth-integrated-pilot-bundle'
import { sha256Hex } from '../../../lib/readiness/digest'
import { assertLocalProofEnvironment, startLocalProofCluster, type LocalProofCluster } from './local-cluster'
import { LocalPgConnection, LocalPgError, pgBytes, pgText } from './pg-wire'
import { installLocalProofSchema, localArtifactTypeOids, publishStructuralFixture, commitStructuralFixture, readStructuralFixture, inspectStructuralReadback, persistVerifiedIntegratedBundleLocally } from './storage'

const bytes = (value: unknown) => { const canonical = provenanceCanonical(value); assert.notEqual(canonical, null); return Buffer.from(canonical!) }
function artifact(id: string, artifactType: IntegratedPilotArtifactType, value: unknown): IntegratedPilotArtifactInput {
  return { pin: historicalPinFor(id, 1, value)!, artifactType, artifactContractVersion: 1, canonicalBytes: bytes(value) }
}
/** Deliberately incomplete domain values. These exercise SQL ONLY, never an Official Truth success. */
export function structuralStorageFixture(label: string, conflictingDefinition = false, namespace = 'synthetic-storage', implementationDepth = 1): IntegratedPilotBundleInput {
  const artifacts: IntegratedPilotArtifactInput[] = []
  const manifest = (id: string, kind: IntegratedPilotArtifactType, deps: { slot: string; pin: Pin }[] = [], marker = 'synthetic-structural-fixture') => {
    const a = artifact(id, kind, { artifactType: kind, artifactContractVersion: 1, id, version: 1, content: { fixtureLabel: marker }, dependencies: deps }); artifacts.push(a); return a.pin
  }
  let implementation = manifest(`${namespace}-implementation`, 'implementation_bundle')
  for (let depth = 1; depth < implementationDepth; depth++) implementation = manifest(`${namespace}-implementation-${depth}`, 'implementation_bundle', [{ slot: '/implementation', pin: implementation }])
  const roots: Record<string, Pin> = {}
  for (const kind of ['fact_schema','extractor_definition','extractor_registry','output_contract','proof_contract','catalog_snapshot','freshness_contract'] as const) roots[kind] = manifest(`${namespace}-${kind.replaceAll('_','-')}`, kind, [{ slot: '/implementation', pin: implementation }], conflictingDefinition && kind === 'fact_schema' ? 'conflicting-synthetic-structure' : 'synthetic-structural-fixture')
  const cell = artifact(`${namespace}-cell`, 'global_cell', { id: `${namespace}-cell`, version: 1, scope: { fixtureLabel: 'structural-byte-proof-only' } }); artifacts.push(cell)
  const custody: Record<string, Pin> = {}
  for (const kind of ['GlobalCellAdmissionV1','SelectedSupportManifestV1','AutonomousReviewConstructionV1'] as const) {
    const a = artifact(`${namespace}-${kind.toLowerCase()}`, kind, { kind, schemaVersion: 1, value: { cell: cell.pin } }); artifacts.push(a); custody[kind] = a.pin
  }
  const receiptBytes = bytes({ schema: 'official-truth-autonomous-provenance', schemaVersion: 1, canonicalization: 'ot-provenance-json-v1', outcome: 'trusted_fact_produced', globalCell: { definition: cell.pin }, candidate: { factSchema: roots.fact_schema, applicabilitySchema: null }, extractor: { definition: roots.extractor_definition, registrySnapshot: roots.extractor_registry, outputContract: roots.output_contract }, policy: null, proof: { contract: roots.proof_contract, catalogSnapshot: roots.catalog_snapshot, freshnessContract: roots.freshness_contract, serverReferenceTime: label } })
  const recordFingerprint = `ot-provenance-v1:${sha256Hex(`ot-provenance-v1\n${receiptBytes.toString('utf8')}`)}`
  const custodyBindingBytes = bytes({ kind: 'CustodyDependencyBindingV1', schemaVersion: 1, value: { receiptFingerprint: recordFingerprint, globalAdmission: custody.GlobalCellAdmissionV1, selectedSupportManifest: custody.SelectedSupportManifestV1, autonomousReviewConstruction: custody.AutonomousReviewConstructionV1 } })
  return { recordFingerprint, receiptBytes, custodyBindingBytes, artifacts }
}
export async function runLocalStorageProof() {
  assertLocalProofEnvironment()
  const checks: string[] = [], connections: LocalPgConnection[] = []
  let cluster: LocalProofCluster | null = null
  const mark = (name: string) => checks.push(name)
  const connect = async (user?: string) => { const c = await LocalPgConnection.connect(cluster!, user); connections.push(c); return c }
  try {
    cluster = startLocalProofCluster()
    const root = cluster.root, owner = await connect()
    await installLocalProofSchema(owner)
    const oids = await localArtifactTypeOids(owner), first = structuralStorageFixture('synthetic-first')
    assert.equal(verifyIntegratedPilotBundle(first).ok, false)
    assert.equal((await persistVerifiedIntegratedBundleLocally(cluster, oids, { profile: 'ot-integrated-pilot-local-closure-v2', bundle: first })).ok, false)
    mark('incomplete_domain_bundle_refused_by_shared_verifier_before_write')
    const empty = await owner.query('SELECT count(*)::text AS n FROM official_provenance_private.receipts'); assert.equal(empty[0]?.n, '0')
    // Independent SQL C parity, including UTF-16 ordering beyond the BMP.
    for (const value of [null, true, 9007199254740991, { z: 'ä\n\\"', '😀': 'astral', '\ue000': 'bmp' }, [1, 'é', false, null]]) {
      const canonical = bytes(value)
      const rows = await owner.query('SELECT official_provenance_private.canonical(official_provenance_private.decode($1::bytea,1048576)::json) AS c', [pgBytes(canonical)])
      assert.equal(rows[0]?.c, canonical.toString('utf8'))
    }
    for (const invalid of ['{"a":1,"a":1}', '{"b":2,"a":1}', '{"a":-0}', '{"a":1e0}', '{"a":1}\n', '\ufeff{}', '{"a":"\\ud800"}']) await assert.rejects(owner.query('SELECT official_provenance_private.decode($1::bytea,1048576)', [pgBytes(Buffer.from(invalid))]), LocalPgError)
    await assert.rejects(owner.query('SELECT official_provenance_private.decode($1::bytea,1048576)', [pgBytes(Uint8Array.from([0xc0,0xaf]))]), LocalPgError)
    mark('sql_ts_canonical_byte_parity_and_noncanonical_rejection')
    assert.equal((await owner.query("SELECT official_provenance_private.keys('{}'::jsonb,ARRAY['id'])::text AS v"))[0]?.v,'false')
    assert.equal((await owner.query("SELECT official_provenance_private.keys('null'::jsonb,ARRAY['id'])::text AS v"))[0]?.v,'false')
    for (const value of [{id:null,version:1,scope:{}},{id:'synthetic-null-test',version:'1',scope:{}},{}]) {
      const malformed=bytes(value)
      await assert.rejects(owner.query('SELECT * FROM official_provenance_private.artifact_edges(ROW($1::text,1::bigint,$2::text,$3::text,$4::text,1::integer,$5::bytea)::official_provenance_api.artifact_input_v1)',[pgText('synthetic-null-test'),pgText(sha256Hex(malformed.toString('utf8'))),pgText('global_cell'),pgText('global_definition_v1'),pgBytes(malformed)]),LocalPgError)
    }

    assert.equal(await commitStructuralFixture(cluster, oids, first), 'inserted')
    assert.equal(await commitStructuralFixture(cluster, oids, first, 'verify_existing'), 'idempotent')
    mark('binary_bytea_composite_transport_atomic_insert_exact_retry')
    const reader = await connect('ot_provenance_reader')
    await reader.query('BEGIN ISOLATION LEVEL REPEATABLE READ READ ONLY')
    const history = inspectStructuralReadback(await readStructuralFixture(reader, first.recordFingerprint), first.recordFingerprint)
    assert.equal(history.status,'complete_structure_only')
    if (history.status !== 'complete_structure_only') throw new Error('unexpected_absence')
    assert.deepEqual(history.bundle.receiptBytes, first.receiptBytes); assert.deepEqual(history.bundle.custodyBindingBytes,first.custodyBindingBytes)
    assert.equal(history.semanticVerification.ok,false)
    for(const a of history.bundle.artifacts) assert.equal(Buffer.compare(Buffer.from(a.canonicalBytes),Buffer.from(first.artifacts.find(b=>b.pin.id===a.pin.id)!.canonicalBytes)),0)
    await reader.query('COMMIT')
    mark('read_only_snapshot_exact_historical_bytes_no_semantic_authority')
    // Role, ACL and RLS checks exercise genuine login principals and denied role switching.
    for (const role of ['ot_provenance_writer','ot_provenance_reader','ot_provenance_denied','ot_provenance_bypass_denied']) {
      const client = await connect(role)
      for (const sql of ['SELECT * FROM official_provenance_private.receipts','DELETE FROM official_provenance_private.receipts','TRUNCATE official_provenance_private.receipts CASCADE','SET ROLE ot_provenance_write_exec','CREATE TABLE public.bad_fixture(x integer)','CREATE TEMP TABLE bad_fixture(x integer)']) await assert.rejects(client.query(sql),LocalPgError)
      if(role!=='ot_provenance_writer') await assert.rejects(publishStructuralFixture(client,oids,first),LocalPgError)
      if(role!=='ot_provenance_reader') await assert.rejects(readStructuralFixture(client,first.recordFingerprint),LocalPgError)
    }
    const rls = await owner.query("SELECT count(*)::text AS n FROM pg_catalog.pg_class c JOIN pg_catalog.pg_namespace n ON n.oid=c.relnamespace WHERE n.nspname='official_provenance_private' AND c.relkind='r' AND c.relrowsecurity AND c.relforcerowsecurity"); assert.equal(rls[0]?.n,'8')
    await owner.query('SET ROLE ot_provenance_ddl')
    assert.equal((await owner.query('SELECT count(*)::text AS n FROM official_provenance_private.receipts'))[0]?.n,'0')
    await owner.query('RESET ROLE')
    for(const command of ['UPDATE official_provenance_private.receipts SET receipt_schema_version=receipt_schema_version','DELETE FROM official_provenance_private.receipts','TRUNCATE official_provenance_private.receipts CASCADE']) await assert.rejects(owner.query(command),LocalPgError)
    mark('eight_tables_force_rls_acl_separate_principals_bypass_denial_immutable_guards')
    // A distinct transaction cannot see an uncommitted publication, then sees it whole.
    const staged = structuralStorageFixture('synthetic-staged'), writer = await connect('ot_provenance_writer')
    await writer.query('BEGIN ISOLATION LEVEL READ COMMITTED')
    assert.equal(await publishStructuralFixture(writer,oids,staged),'inserted')
    await reader.query('BEGIN ISOLATION LEVEL REPEATABLE READ READ ONLY')
    assert.equal(inspectStructuralReadback(await readStructuralFixture(reader,staged.recordFingerprint),staged.recordFingerprint).status,'receipt_absent')
    await writer.query('COMMIT')
    assert.equal(inspectStructuralReadback(await readStructuralFixture(reader,staged.recordFingerprint),staged.recordFingerprint).status,'receipt_absent')
    await reader.query('COMMIT')
    await reader.query('BEGIN ISOLATION LEVEL REPEATABLE READ READ ONLY')
    assert.equal(inspectStructuralReadback(await readStructuralFixture(reader,staged.recordFingerprint),staged.recordFingerprint).status,'complete_structure_only')
    await reader.query('COMMIT')
    mark('real_transaction_atomic_visibility_repeatable_read_snapshot')
    // Barrier: owner holds store lock, both independent writer sessions wait for it.
    await owner.query('BEGIN'); await owner.query('SELECT pg_catalog.pg_advisory_xact_lock(1869901924,1)')
    const concurrent = structuralStorageFixture('synthetic-concurrent')
    const pending = [commitStructuralFixture(cluster,oids,concurrent),commitStructuralFixture(cluster,oids,concurrent)]
    let waiting = false
    for(let i=0;i<100;i++) {
      const state = await owner.query("SELECT count(*)::text AS n FROM pg_catalog.pg_locks WHERE locktype='advisory' AND classid=1869901924 AND objid=1 AND NOT granted")
      if(Number(state[0]?.n)>=2){waiting=true;break}
      await new Promise(resolve=>setTimeout(resolve,10))
    }
    assert.equal(waiting,true); await owner.query('COMMIT')
    assert.deepEqual((await Promise.all(pending)).sort(),['idempotent','inserted'])
    mark('barrier_controlled_real_concurrent_identical_writers')
    await owner.query('BEGIN'); await owner.query('SELECT pg_catalog.pg_advisory_xact_lock(1869901924,1)')
    const goodRace = structuralStorageFixture('synthetic-race-good',false,'synthetic-race'), badRace = structuralStorageFixture('synthetic-race-bad',true,'synthetic-race')
    const conflictingRace = [commitStructuralFixture(cluster,oids,goodRace),commitStructuralFixture(cluster,oids,badRace)]
    const observedRace = Promise.allSettled(conflictingRace)
    let raceWaiting = false
    for(let i=0;i<100;i++) {
      const state=await owner.query("SELECT count(*)::text AS n FROM pg_catalog.pg_locks WHERE locktype='advisory' AND classid=1869901924 AND objid=1 AND NOT granted")
      if(Number(state[0]?.n)>=2){raceWaiting=true;break}
      await new Promise(resolve=>setTimeout(resolve,10))
    }
    assert.equal(raceWaiting,true);await owner.query('COMMIT')
    const raceResults=await observedRace
    assert.equal(raceResults.filter(result=>result.status==='fulfilled').length,1)
    assert.equal(raceResults.filter(result=>result.status==='rejected').length,1)
    assert.equal((await owner.query('SELECT count(*)::text AS n FROM official_provenance_private.receipts WHERE record_fingerprint=$1 OR record_fingerprint=$2',[pgText(goodRace.recordFingerprint),pgText(badRace.recordFingerprint)]))[0]?.n,'1')
    mark('barrier_controlled_concurrent_conflicting_artifact_versions_one_winner')
    const atDepth=structuralStorageFixture('synthetic-depth-eight',false,'synthetic-depth-eight',7)
    const overDepth=structuralStorageFixture('synthetic-depth-nine',false,'synthetic-depth-nine',8)
    assert.equal(await commitStructuralFixture(cluster,oids,atDepth),'inserted')
    await assert.rejects(commitStructuralFixture(cluster,oids,overDepth),LocalPgError)
    await assert.rejects(commitStructuralFixture(cluster,oids,{...first,artifacts:[...first.artifacts,first.artifacts[0]!]}),LocalPgError)
    await assert.rejects(commitStructuralFixture(cluster,oids,{...first,artifacts:first.artifacts.slice(1)}),LocalPgError)
    await assert.rejects(commitStructuralFixture(cluster,oids,{...first,receiptBytes:Buffer.concat([first.receiptBytes,Buffer.from(' ')])}),LocalPgError)
    await assert.rejects(commitStructuralFixture(cluster,oids,{...first,artifacts:first.artifacts.map((a,i)=>i===0?{...a,canonicalBytes:Buffer.from('{}')}:a)}),LocalPgError)
    mark('depth_eight_pass_depth_nine_duplicate_missing_changed_bytes_refused')
    const conflict = structuralStorageFixture('synthetic-conflict',true)
    await assert.rejects(commitStructuralFixture(cluster,oids,conflict),LocalPgError)
    assert.equal((await owner.query('SELECT count(*)::text AS n FROM official_provenance_private.receipts WHERE record_fingerprint=$1',[pgText(conflict.recordFingerprint)]))[0]?.n,'0')
    mark('same_artifact_name_version_changed_digest_whole_transaction_refusal')
    const alternateAdmission=artifact('synthetic-storage-alternate-admission','GlobalCellAdmissionV1',{kind:'GlobalCellAdmissionV1',schemaVersion:1,value:{cell:first.artifacts.find(a=>a.artifactType==='global_cell')!.pin}})
    const changedK=JSON.parse(Buffer.from(first.custodyBindingBytes).toString('utf8')) as {value:{globalAdmission:Pin}}
    changedK.value.globalAdmission=alternateAdmission.pin
    await assert.rejects(commitStructuralFixture(cluster,oids,{...first,custodyBindingBytes:bytes(changedK),artifacts:[...first.artifacts.filter(a=>a.artifactType!=='GlobalCellAdmissionV1'),alternateAdmission]}),LocalPgError)
    mark('same_receipt_alternate_custody_binding_refused')

    const rollback = structuralStorageFixture('synthetic-rollback')
    await writer.query('BEGIN'); await publishStructuralFixture(writer,oids,rollback); await writer.query('ROLLBACK')
    await assert.rejects(commitStructuralFixture(cluster,oids,rollback,'verify_existing'),LocalPgError)
    assert.equal((await owner.query('SELECT count(*)::text AS n FROM official_provenance_private.receipts WHERE record_fingerprint=$1',[pgText(rollback.recordFingerprint)]))[0]?.n,'0')
    mark('explicit_rollback_no_publication_verify_existing_never_recreates')
    // Injected database failure after artifact staging, scoped solely to this disposable cluster.
    await owner.query("CREATE FUNCTION official_provenance_private.fixture_fail_insert() RETURNS trigger LANGUAGE plpgsql AS $$ BEGIN RAISE EXCEPTION 'fixture_failure'; END $$; CREATE TRIGGER fixture_failure BEFORE INSERT ON official_provenance_private.custody_bindings FOR EACH ROW EXECUTE FUNCTION official_provenance_private.fixture_fail_insert()")
    const failed = structuralStorageFixture('synthetic-injected-failure')
    await assert.rejects(commitStructuralFixture(cluster,oids,failed),LocalPgError)
    await owner.query('DROP TRIGGER fixture_failure ON official_provenance_private.custody_bindings; DROP FUNCTION official_provenance_private.fixture_fail_insert()')
    assert.equal((await owner.query('SELECT count(*)::text AS n FROM official_provenance_private.receipts WHERE record_fingerprint=$1',[pgText(failed.recordFingerprint)]))[0]?.n,'0')
    mark('sql_failure_after_staging_rolls_back_receipt_binding_and_links')
    // Corrupt retained links as the isolated superuser; a retry is forbidden from repairing them.
    await owner.query('ALTER TABLE official_provenance_private.receipt_dependencies DISABLE TRIGGER USER')
    await owner.query('DELETE FROM official_provenance_private.receipt_dependencies WHERE record_fingerprint=$1 AND root_slot=$2',[pgText(first.recordFingerprint),pgText('proof.contract')])
    await owner.query('ALTER TABLE official_provenance_private.receipt_dependencies ENABLE TRIGGER USER')
    await assert.rejects(commitStructuralFixture(cluster,oids,first),LocalPgError)
    assert.equal((await owner.query('SELECT count(*)::text AS n FROM official_provenance_private.receipt_dependencies WHERE record_fingerprint=$1',[pgText(first.recordFingerprint)]))[0]?.n,'7')
    mark('missing_retained_link_refused_without_incidental_repair')
    // Artificial digest-key collision/corruption is injected only with this disposable owner's DDL authority.
    const collisionFixture=structuralStorageFixture('synthetic-blob-collision',false,'synthetic-collision')
    await commitStructuralFixture(cluster,oids,collisionFixture)
    const collided=collisionFixture.artifacts[0]!
    await owner.query('ALTER TABLE official_provenance_private.artifact_blobs DISABLE TRIGGER USER; ALTER TABLE official_provenance_private.artifact_blobs DROP CONSTRAINT artifact_blob_hash_exact')
    await owner.query('UPDATE official_provenance_private.artifact_blobs SET canonical_bytes=$1 WHERE digest=$2',[pgBytes(bytes({syntheticCorruption:true})),pgText(collided.pin.digest)])
    await owner.query('ALTER TABLE official_provenance_private.artifact_blobs ENABLE TRIGGER USER')
    await assert.rejects(commitStructuralFixture(cluster,oids,collisionFixture,'verify_existing'),LocalPgError)
    const unchanged=await owner.query('SELECT canonical_bytes FROM official_provenance_private.artifact_blobs WHERE digest=$1',[pgText(collided.pin.digest)])
    assert.equal(unchanged[0]?.canonical_bytes,`\\x${bytes({syntheticCorruption:true}).toString('hex')}`)
    mark('injected_digest_key_byte_collision_refused_without_repair')
    for(const a of first.artifacts) assert.equal(decodeProvenanceBytes(a.canonicalBytes).ok,true)
    const version=cluster.version
    for(const c of connections)c.close()
    cluster.stop(); assert.equal(existsSync(root),false); cluster=null
    mark('owned_cluster_stopped_and_only_owned_resources_removed')
    return { status:'PASS' as const, scope:'synthetic_storage_structure_only' as const, postgresVersion:version, checks, integratedReceiptRoundtrip:'NOT_VERIFIED' as const, fullSemanticPublication:'BLOCKED' as const, productionActivation:false, hostedApply:false }
  } finally { for(const c of connections)c.close();cluster?.stop() }
}
