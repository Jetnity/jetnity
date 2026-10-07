import assert from 'node:assert/strict'
import { test } from 'node:test'
import { assertLocalProofEnvironment, findLocalPgBins, startLocalProofCluster } from '../../scripts/db/official-truth-integrated-pilot-1/local-cluster'
import { LocalPgConnection, LocalPgError, pgBytes, pgText } from '../../scripts/db/official-truth-integrated-pilot-1/pg-wire'
import { runLocalStorageProof, structuralStorageFixture } from '../../scripts/db/official-truth-integrated-pilot-1/proof'
import { inspectStructuralReadback, installLocalProofSchema } from '../../scripts/db/official-truth-integrated-pilot-1/storage'
import { verifyIntegratedPilotBundle } from './official-truth-integrated-pilot-bundle'

test('local storage rejects inherited targets, explicit DSNs, forged socket ownership and incomplete transport', async () => {
  for (const key of ['PGHOST','PGDATA','PGPASSWORD','DATABASE_URL','POSTGRES_URL','SUPABASE_DB_URL','SUPABASE_PROJECT_REF','JETNITY_LOCAL_DB_URL']) {
    assert.throws(() => assertLocalProofEnvironment({[key]:'untrusted-value'},[]),/connection_override_forbidden/)
  }
  for(const argument of ['postgres://localhost/db','postgresql://host/db','--host=/tmp/socket','--dsn=something','https://project.supabase.co']) assert.throws(()=>assertLocalProofEnvironment({},[argument]),/connection_argument_forbidden/)
  assert.doesNotThrow(()=>assertLocalProofEnvironment({},[]))
  await assert.rejects(LocalPgConnection.connect({socket:'/tmp/foreign/socket',port:5432,user:'foreign',database:'foreign',root:'/tmp/foreign',version:'foreign',stop(){}}),/foreign_cluster/)
  assert.throws(()=>inspectStructuralReadback([],`ot-provenance-v1:${'0'.repeat(64)}`),/response_incomplete/)
  assert.equal(verifyIntegratedPilotBundle(structuralStorageFixture('deliberately-incomplete-synthetic-domain-fixture')).ok,false)
})

test('real disposable PostgreSQL proves structural bytes, atomic transactions, concurrent writers and ACL/RLS; no full-domain success claimed', { timeout:120_000 }, async context => {
  assert.ok(findLocalPgBins(),'NOT_VERIFIED: local PostgreSQL binaries are required; no hosted fallback or emulator')
  const result=await runLocalStorageProof()
  assert.equal(result.status,'PASS')
  assert.equal(result.scope,'synthetic_storage_structure_only')
  assert.equal(result.integratedReceiptRoundtrip,'NOT_VERIFIED')
  assert.equal(result.fullSemanticPublication,'BLOCKED')
  assert.ok(result.checks.includes('barrier_controlled_real_concurrent_identical_writers'))
  assert.ok(result.checks.includes('barrier_controlled_concurrent_conflicting_artifact_versions_one_winner'))
  assert.ok(result.checks.includes('owned_cluster_stopped_and_only_owned_resources_removed'))
  context.diagnostic(JSON.stringify(result))
})

test('actual primary and composed v2 bundles survive real SQL commit, complete fresh readback and semantic/adversarial proof', {timeout:900_000}, async context=>{
  assert.ok(findLocalPgBins(),'NOT_VERIFIED: local PostgreSQL binaries are required; no hosted fallback or emulator')
  const {runControlledSyntheticPilot}=await import('../../scripts/official-truth-integrated-pilot-1/controlled-runtime')
  const {runIntegratedLocalStorageProof}=await import('../../scripts/db/official-truth-integrated-pilot-1/integrated-proof')
  const primary=await runControlledSyntheticPilot('primary'),composed=await runControlledSyntheticPilot('composed')
  assert.equal(primary.status,'synthetic_bundle_verified');assert.equal(composed.status,'synthetic_bundle_verified')
  if(primary.status!=='synthetic_bundle_verified'||composed.status!=='synthetic_bundle_verified')throw Error('actual_bundle_prerequisite_failed')
  const result=await runIntegratedLocalStorageProof(primary.envelope,composed.envelope)
  assert.equal(result.status,'PASS');assert.equal(result.profile,'ot-integrated-pilot-local-closure-v2')
  assert.equal(result.integratedReceiptRoundtrip,'VERIFIED');assert.equal(result.fullSemanticPublication,'VERIFIED')
  assert.equal(result.primary.readback,'VERIFIED');assert.equal(result.composed.readback,'VERIFIED')
  assert.ok(result.checks.includes('barrier_controlled_real_concurrent_full_bundle_writers_inserted_idempotent'))
  assert.ok(result.checks.includes('barrier_controlled_real_concurrent_conflict_one_idempotent_one_refusal_no_extra_rows'))
  assert.ok(result.checks.includes('new_receipt_shared_subgraph_missing_artifact_cannot_heal'))
  context.diagnostic(JSON.stringify(result))
})

// The refactored shared SQL decoder must keep both native consumers' admission
// boundaries. Rehash lexical/semantic mutations so digest mismatch cannot hide them.
test('R5 native legacy and typed SQL consumers preserve envelope admission boundaries', {timeout:120_000}, async context=>{
  const {runControlledSyntheticPilot}=await import('../../scripts/official-truth-integrated-pilot-1/controlled-runtime')
  const {provenanceCanonical}=await import('./official-truth-autonomous-provenance-artifact')
  const {sha256Hex}=await import('./digest')
  const primary=await runControlledSyntheticPilot('primary')
  assert.equal(primary.status,'synthetic_bundle_verified');if(primary.status!=='synthetic_bundle_verified')throw Error('r5_baseline')
  const cluster=startLocalProofCluster(),owner=await LocalPgConnection.connect(cluster)
  let positiveNativeCalls=0,rejectedNativeCalls=0
  try{
    await installLocalProofSchema(owner)
    for(const type of ['global_cell','GlobalCellAdmissionV1','extractor_definition'] as const){
      const a=primary.envelope.bundle.artifacts.find(a=>a.artifactType===type)!
      const family=type==='global_cell'?'global_definition_v1':type==='GlobalCellAdmissionV1'?'custody_v1':'manifest_v1'
      const original=JSON.parse(Buffer.from(a.canonicalBytes).toString()) as Record<string,unknown>
      const canonical=(value:unknown)=>Buffer.from(provenanceCanonical(value)!)
      const native=(fn:'artifact_edges'|'artifact_v2',bytes:Uint8Array,digest=sha256Hex(Buffer.from(bytes).toString()))=>owner.query(`SELECT * FROM official_provenance_private.${fn}(ROW($1::text,1::bigint,$2::text,$3::text,$4::text,1::integer,$5::bytea)::official_provenance_api.artifact_input_v1)`,[pgText(a.pin.id),pgText(digest),pgText(type),pgText(family),pgBytes(bytes)])
      const invalid=[Buffer.concat([Buffer.from(a.canonicalBytes),Buffer.from('\n')]),canonical({...original,unexpected:true}),canonical({...original,...(type==='GlobalCellAdmissionV1'?{schemaVersion:2}:{version:'1'})})]
      if(type==='extractor_definition'){
        const pin=primary.envelope.bundle.artifacts[0]!.pin
        for(const dependency of [{slot:'',pin},{slot:'x'.repeat(1025),pin},{slot:'/x',pin:{...pin,digest:'0'}}])invalid.push(canonical({...original,dependencies:[dependency]}))
        invalid.push(canonical({...original,dependencies:Array.from({length:257},(_,i)=>({slot:`/x/${i}`,pin}))}))
      }
      for(const fn of ['artifact_edges','artifact_v2'] as const){
        await native(fn,a.canonicalBytes,a.pin.digest);positiveNativeCalls++
        await assert.rejects(native(fn,a.canonicalBytes,'0'.repeat(64)),LocalPgError);rejectedNativeCalls++
        for(const bytes of invalid){await assert.rejects(native(fn,bytes),LocalPgError);rejectedNativeCalls++}
      }
    }
    assert.equal((await owner.query('SELECT count(*)::text AS n FROM official_provenance_private.receipts'))[0]?.n,'0')
    context.diagnostic(JSON.stringify({schema:'ot-pilot-r5-envelope-regression-v1',positiveNativeCalls,rejectedNativeCalls,storedReceipts:0}))
  }finally{owner.close();cluster.stop()}
})
