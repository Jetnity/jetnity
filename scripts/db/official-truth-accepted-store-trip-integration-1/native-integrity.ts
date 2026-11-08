/** Deliberate partial-restore corruption in the disposable owned cluster.
 * These DBA writes are negative fixtures, never accepted lifecycle operations. */
import assert from 'node:assert/strict'
import type { TestContext } from 'node:test'
import { quote,type nativeSql } from './native-schema'
import type { startNativeHttp } from './native-http'
import type { nativeBinding } from './native-fixture'
import type { AcceptedStoreTripResult } from '@/lib/readiness/official-truth-accepted-store-trip-integration-1/result'

type Response={status:number;body:unknown}
export async function retainedIntegrityProof(t:TestContext,sql:ReturnType<typeof nativeSql>,http:Awaited<ReturnType<typeof startNativeHttp>>,
  witness:Awaited<ReturnType<typeof nativeBinding>>,receipt:string,read:()=>Promise<Response>){
  const held=()=>sql(`select jsonb_build_object('heads',(select jsonb_agg(to_jsonb(h)) from official_accepted_trip_private.heads h),
    'operations',(select jsonb_agg(to_jsonb(o) order by sequence) from official_accepted_trip_private.operations o))::text`)
  const journal=held(),advances=witness.casCount(),cases:string[]=[]
  const corruption=(statement:string)=>sql(`begin;set local session_replication_role=replica;${statement};commit;`)
  async function reject(name:string,change:()=>void,restore:()=>void){
    const from=http.evidence.length
    change()
    try {
      const response=await read(),body=response.body as AcceptedStoreTripResult
      assert.equal(response.status,200,name);assert.notEqual(body.status,'current',name)
      assert(body.evaluations.every(value=>value.result==='unknown'),name)
      const actual=http.evidence.slice(from)
      assert(actual.some(value=>value.rpc==='official_truth_trip_store_reserve_v1'&&!value.committed),`${name}: must reach the new native journal guard, not a limiter/source-time refusal`)
      assert.equal(held(),journal);assert.equal(witness.casCount(),advances)
    } finally {restore()}
    const positive=await read();assert.equal(positive.status,200,name)
    assert.equal((positive.body as AcceptedStoreTripResult).status,'current',`${name}: independent positive control after exact restore`)
    assert.equal((positive.body as AcceptedStoreTripResult).receiptFingerprint,receipt)
    cases.push(name)
  }
  const current=sql(`select to_jsonb(cv)::text from official_accepted_trip_private.current_versions cv where receipt=${quote(receipt)}`)
  await reject('missing current version despite retained journal',
    ()=>corruption(`delete from official_accepted_trip_private.current_versions where receipt=${quote(receipt)}`),
    ()=>corruption(`insert into official_accepted_trip_private.current_versions select *
      from jsonb_populate_record(null::official_accepted_trip_private.current_versions,${quote(current)}::jsonb)`))
  // A second current row for the same admitted cell is impossible through the
  // actual native primary key, even with an older accepted version available.
  // The existing two-version positive reader separately proves exact selection.
  assert.throws(()=>sql(`insert into official_accepted_trip_private.current_versions
    select cv.cell,v.receipt,'accepted' from official_accepted_trip_private.current_versions cv
    join official_accepted_trip_private.versions v on v.cell=cv.cell and v.receipt<>cv.receipt`),
    error=>{const stderr=(error as {stderr?:unknown}).stderr;return typeof stderr==='string'&&stderr.includes('23505')})
  assert.equal(held(),journal);assert.equal(witness.casCount(),advances)
  assert.equal(((await read()).body as AcceptedStoreTripResult).status,'current')
  cases.push('ambiguous second current row refused by actual unique constraint')
  const evidence=sql(`select evidence_version from official_accepted_trip_private.version_supports where receipt=${quote(receipt)}`)
  const originalHash=sql(`select source_content_hash from private.official_evidence_versions where version_id=${quote(evidence)}`)
  await reject('actual retained legacy Evidence content identity',
    ()=>corruption(`update private.official_evidence_versions set source_content_hash=repeat('0',64) where version_id=${quote(evidence)}`),
    ()=>corruption(`update private.official_evidence_versions set source_content_hash=${quote(originalHash)} where version_id=${quote(evidence)}`))
  const pin=sql(`select original_pin::text from official_accepted_trip_private.version_supports where receipt=${quote(receipt)}`)
  await reject('actual retained version support and original pin',
    ()=>corruption(`update official_accepted_trip_private.version_supports set original_pin=jsonb_set(original_pin,'{digest}',to_jsonb(repeat('0',64))) where receipt=${quote(receipt)}`),
    ()=>corruption(`update official_accepted_trip_private.version_supports set original_pin=${quote(pin)}::jsonb where receipt=${quote(receipt)}`))
  // Keep the blob's own hash/check constraint valid. A restore that substitutes
  // different real canonical bytes and a corresponding blob identity still
  // must not borrow the accepted receipt/operation/witness authority.
  const originalBinding=sql(`select binding_digest from official_provenance_private.custody_bindings where record_fingerprint=${quote(receipt)}`)
  const otherDigest=sql(`select encode(sha256(canonical_bytes||decode('20','hex')),'hex') from official_provenance_private.artifact_blobs where digest=${quote(originalBinding)}`)
  await reject('actual retained archive binding bytes',
    ()=>corruption(`insert into official_provenance_private.artifact_blobs(digest,canonical_bytes)
      select ${quote(otherDigest)},canonical_bytes||decode('20','hex') from official_provenance_private.artifact_blobs where digest=${quote(originalBinding)};
      update official_provenance_private.custody_bindings set binding_digest=${quote(otherDigest)} where record_fingerprint=${quote(receipt)}`),
    ()=>corruption(`update official_provenance_private.custody_bindings set binding_digest=${quote(originalBinding)} where record_fingerprint=${quote(receipt)};
      delete from official_provenance_private.artifact_blobs where digest=${quote(otherDigest)}`))
  const metadata=sql(`select metadata::text from official_accepted_trip_private.originals where receipt=${quote(receipt)}`)
  await reject('actual retained custody metadata',
    ()=>corruption(`update official_accepted_trip_private.originals set metadata=jsonb_set(metadata,'{contentHash}',to_jsonb(repeat('0',64))) where receipt=${quote(receipt)}`),
    ()=>corruption(`update official_accepted_trip_private.originals set metadata=${quote(metadata)}::jsonb where receipt=${quote(receipt)}`))
  const cipher=sql(`select envelope::text from official_accepted_trip_private.ciphertexts where receipt=${quote(receipt)}`)
  await reject('actual retained ciphertext envelope',
    ()=>corruption(`update official_accepted_trip_private.ciphertexts set envelope=jsonb_set(envelope,'{tag}',to_jsonb('AAAAAAAAAAAAAAAAAAAAAA=='::text)) where receipt=${quote(receipt)}`),
    ()=>corruption(`update official_accepted_trip_private.ciphertexts set envelope=${quote(cipher)}::jsonb where receipt=${quote(receipt)}`))
  t.diagnostic(JSON.stringify({proof:'native-retained-row-integrity',cases,positiveControlAfterEveryExactRestore:true,
    journalAndExternalWitnessUnchanged:true,boundary:'Local physical-restore corruption only; canonical schemas, policies and runtime mutators remain unchanged'}))
}
