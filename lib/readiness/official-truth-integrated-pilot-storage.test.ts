import assert from 'node:assert/strict'
import { test } from 'node:test'
import { assertLocalProofEnvironment, findLocalPgBins } from '../../scripts/db/official-truth-integrated-pilot-1/local-cluster'
import { LocalPgConnection } from '../../scripts/db/official-truth-integrated-pilot-1/pg-wire'
import { runLocalStorageProof, structuralStorageFixture } from '../../scripts/db/official-truth-integrated-pilot-1/proof'
import { inspectStructuralReadback } from '../../scripts/db/official-truth-integrated-pilot-1/storage'
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
