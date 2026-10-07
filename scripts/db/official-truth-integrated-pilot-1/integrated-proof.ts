import assert from 'node:assert/strict'
import {existsSync} from 'node:fs'
import {provenanceCanonical,provenanceHash,type Pin} from '../../../lib/readiness/official-truth-autonomous-provenance-artifact'
import {sha256Hex} from '../../../lib/readiness/digest'
import {LOCAL_INTEGRATED_PILOT_CLOSURE_PROFILE,verifyLocalIntegratedPilotBundle,type LocalIntegratedPilotEnvelope,type IntegratedPilotArtifactInput,type IntegratedPilotPayload} from '../../../lib/readiness/official-truth-integrated-pilot-bundle'
import {runSemanticRegressions} from './semantic-regressions'
import {startLocalProofCluster} from './local-cluster'
import {LocalPgConnection,LocalPgError,pgBytes,pgText,type PgRows} from './pg-wire'
import {installLocalProofSchema,localArtifactTypeOids,persistVerifiedIntegratedBundleLocally,publishIntegratedBundle,readVerifiedIntegratedBundleLocally,readIntegratedRows,inspectIntegratedReadback} from './storage'
const bytes=(v:unknown)=>{const s=provenanceCanonical(v);assert.notEqual(s,null);return Uint8Array.from(Buffer.from(s!))}
const parse=(v:Uint8Array):unknown=>JSON.parse(Buffer.from(v).toString('utf8'))
const key=(p:Pin)=>`${p.id}:${p.version}:${p.digest}`
function replacePins(value:unknown,lookup:(p:Pin)=>Pin):unknown {
  if(Array.isArray(value))return value.map(v=>replacePins(v,lookup))
  if(value!==null&&typeof value==='object') {
    const o=value as Record<string,unknown>
    if(Object.keys(o).sort().join(',')==='digest,id,version'&&typeof o.id==='string'&&typeof o.version==='number'&&typeof o.digest==='string')return lookup(o as Pin)
    return Object.fromEntries(Object.entries(o).map(([k,v])=>[k,replacePins(v,lookup)]))
  }
  return value
}
function sealReceipt(envelope:LocalIntegratedPilotEnvelope,payload:IntegratedPilotPayload,artifacts:readonly IntegratedPilotArtifactInput[]=envelope.bundle.artifacts,k:unknown=parse(envelope.bundle.custodyBindingBytes)):LocalIntegratedPilotEnvelope {
  const receiptBytes=bytes(payload),recordFingerprint=provenanceHash('ot-provenance-v1',payload)!
  const binding=k as {kind:string;schemaVersion:number;value:Record<string,unknown>}
  return {profile:envelope.profile,bundle:{recordFingerprint,receiptBytes,custodyBindingBytes:bytes({...binding,value:{...binding.value,receiptFingerprint:recordFingerprint}}),artifacts}}
}
/** Test-only historical rewrite: rehash every ancestor, so semantic negatives cannot hide behind bad hashes. */
export function rewriteIntegratedFixture(envelope:LocalIntegratedPilotEnvelope,targetId:string,mutate:(value:Record<string,unknown>)=>Record<string,unknown>,rebuildReceipt=true):LocalIntegratedPilotEnvelope {
  const byKey=new Map(envelope.bundle.artifacts.map(a=>[key(a.pin),a])),rewritten=new Map<string,IntegratedPilotArtifactInput>()
  const visit=(pin:Pin):Pin=>{
    const old=byKey.get(key(pin));assert.ok(old)
    if(rewritten.has(key(pin)))return rewritten.get(key(pin))!.pin
    let value=parse(old.canonicalBytes) as Record<string,unknown>
    if(old.pin.id===targetId)value=mutate(value)
    value=replacePins(value,visit) as Record<string,unknown>
    const canonicalBytes=bytes(value),next={...old,canonicalBytes,pin:{...old.pin,digest:sha256Hex(Buffer.from(canonicalBytes).toString('utf8'))}}
    rewritten.set(key(pin),next);return next.pin
  }
  for(const a of envelope.bundle.artifacts)visit(a.pin)
  let p=replacePins(parse(envelope.bundle.receiptBytes),visit) as IntegratedPilotPayload
  if(rebuildReceipt) {
    const ids=p.supports.map(s=>s.versionId),factHash=provenanceHash('ot-fact-v1',{factSchema:p.candidate.factSchema,applicabilitySchema:p.candidate.applicabilitySchema,factKind:p.candidate.factKind,requirementType:p.candidate.requirementType,fact:p.candidate.fact})!
    const candidateBinding=provenanceHash('ot-candidate-v1',{scope:p.globalCell.scope,ruleScopeKey:p.globalCell.ruleScopeKey,factKind:p.candidate.factKind,requirementType:p.candidate.requirementType,schemaFamily:p.extractor.schemaFamily,factSchema:p.candidate.factSchema,applicabilitySchema:p.candidate.applicabilitySchema,factHash,evidenceQuality:p.evidenceQuality,supportVersionIds:ids})!
    const proofIdentity=provenanceHash('ot-proof-v1',{contract:p.proof.contract,reviewPacketKey:p.proof.reviewPacketKey,ruleScopeKey:p.globalCell.ruleScopeKey,factKind:p.candidate.factKind,supportVersionIds:ids,serverReferenceTime:p.proof.serverReferenceTime,catalogSnapshot:p.proof.catalogSnapshot,freshnessContract:p.proof.freshnessContract,evidenceFreshnessAtReference:'current'})!
    const contentItemRefs=p.supports.map(s=>{const b=s.binding as {sourceId:string;contentItemId:string};return {sourceId:b.sourceId,contentItemId:b.contentItemId}}).sort((a,b)=>JSON.stringify([a.sourceId,a.contentItemId]).localeCompare(JSON.stringify([b.sourceId,b.contentItemId])))
    const representations=p.supports.map(s=>s.binding).sort((a,b)=>provenanceCanonical(a)!<provenanceCanonical(b)!?-1:1),canonicalFinalUrls=p.supports.map(s=>s.canonicalFinalUrl)
    const selectionKey=p.policy===null?provenanceHash('ot-extractor-selection-v1',{path:'explicit_post_retrieval',selectorContract:p.proof.contract,registrySnapshot:p.extractor.registrySnapshot,factKind:p.candidate.factKind,requirementType:p.candidate.requirementType,evidenceQuality:'explicit_primary_statement',contentItemRefs,representations,canonicalFinalUrls,observedContentTypes:[...new Set(p.supports.map(s=>s.contentType))].sort(),policy:null})!:provenanceHash('ot-composition-selection-v1',{path:'composed_pre_http',selectorContract:p.proof.contract,extractorRegistrySnapshot:p.extractor.registrySnapshot,policyRegistrySnapshot:p.policy.registrySnapshot,factKind:p.candidate.factKind,requirementType:p.candidate.requirementType,contentItemRefs,representations,canonicalFinalUrls,sourceFamilyId:p.extractor.sourceFamilyId,schemaFamily:p.extractor.schemaFamily})!
    const policy=p.policy===null?null:{...p.policy,preHttpSelectionKey:selectionKey,resultIdentity:provenanceHash('ot-composition-result-v1',{candidateBinding,factHash,extractorDefinition:p.extractor.definition,extractorRegistrySnapshot:p.extractor.registrySnapshot,outputContract:p.extractor.outputContract,policyDefinition:p.policy.definition,policyRegistrySnapshot:p.policy.registrySnapshot,preHttpSelectionKey:selectionKey,assignments:p.policy.assignments,supportVersionIds:ids,citations:p.citations})!}
    p={...p,candidate:{...p.candidate,factHash,candidateBinding},extractor:{...p.extractor,selectionKey},proof:{...p.proof,proofIdentity},policy}
  }
  return sealReceipt(envelope,p,[...rewritten.values()],replacePins(parse(envelope.bundle.custodyBindingBytes),visit))
}
function changedImplementation(envelope:LocalIntegratedPilotEnvelope) {
  const impl=envelope.bundle.artifacts.find(a=>a.artifactType==='implementation_bundle')!
  return rewriteIntegratedFixture(envelope,impl.pin.id,value=>{
    const content=value.content as {bundleBase64:string};const source=JSON.parse(Buffer.from(content.bundleBase64,'base64').toString()) as {files:{path:string;utf8:string}[]}
    source.files[0]!.utf8+='\n// local disposable collision variant\n'
    return {...value,content:{...content,bundleBase64:Buffer.from(bytes(source)).toString('base64')}}
  })
}
export async function runIntegratedLocalStorageProof(primaryEnvelope:LocalIntegratedPilotEnvelope,composedEnvelope:LocalIntegratedPilotEnvelope) {
  assert.equal(verifyLocalIntegratedPilotBundle(primaryEnvelope).ok,true);assert.equal(verifyLocalIntegratedPilotBundle(composedEnvelope).ok,true)
  const checks:string[]=[],cluster=startLocalProofCluster(),connections:LocalPgConnection[]=[]
  const connect=async(user?:string)=>{const c=await LocalPgConnection.connect(cluster,user);connections.push(c);return c}
  const owner=await connect(),root=cluster.root
  try {
    await installLocalProofSchema(owner);const oids=await localArtifactTypeOids(owner)
    // The owner remains ready while other connections work; its lifetime is not a query deadline.
    const ownerBackend=await owner.query('SELECT pg_catalog.pg_backend_pid()::text AS pid')
    const timeoutProbe=await connect()
    const activeTimeout=assert.rejects(timeoutProbe.query('SELECT pg_catalog.pg_sleep(60)'),error=>error instanceof LocalPgError&&error.code==='connection_closed')
    await Promise.all([new Promise<void>(resolve=>setTimeout(resolve,31_000)),activeTimeout])
    assert.deepEqual(await owner.query('SELECT pg_catalog.pg_backend_pid()::text AS pid'),ownerBackend)
    checks.push('idle_owner_connection_survives_31_seconds_and_reuses_same_backend','active_query_inactivity_timeout_remains_30_seconds')
    const write=async(e:LocalIntegratedPilotEnvelope,mode:'create_or_verify'|'verify_existing'='create_or_verify')=>{const c=await connect('ot_provenance_writer');try{await c.query('BEGIN ISOLATION LEVEL READ COMMITTED');const out=await publishIntegratedBundle(c,oids,e,mode);await c.query('COMMIT');return out}catch(error){try{await c.query('ROLLBACK')}catch{}throw error}finally{c.close()}}
    const rejectSql=async(e:LocalIntegratedPilotEnvelope)=>{await assert.rejects(write(e),LocalPgError)}
    // Verify-existing does not create absent bundles; explicit rollback removes all staged writes.
    await assert.rejects(write(primaryEnvelope,'verify_existing'),LocalPgError)
    const staged=await connect('ot_provenance_writer');await staged.query('BEGIN ISOLATION LEVEL READ COMMITTED');assert.equal(await publishIntegratedBundle(staged,oids,primaryEnvelope),'inserted')
    assert.equal((await readVerifiedIntegratedBundleLocally(cluster,primaryEnvelope.bundle.recordFingerprint)).status,'receipt_absent')
    await staged.query('ROLLBACK');assert.equal((await owner.query('SELECT count(*)::text n FROM official_provenance_private.artifacts'))[0]?.n,'0')
    checks.push('complete_primary_staged_atomically_invisible_then_rollback_no_artifacts','verify_existing_absent_never_creates')
    // Exact admitted bytes are detached synchronously before connection awaits.
    const primaryConnections:LocalPgConnection[]=[],primaryConnect=LocalPgConnection.connect
    LocalPgConnection.connect=async(...args:Parameters<typeof LocalPgConnection.connect>)=>{const c=await primaryConnect.call(LocalPgConnection,...args);primaryConnections.push(c);return c}
    let primary:Awaited<ReturnType<typeof persistVerifiedIntegratedBundleLocally>>
    const primaryDiagnostics=()=>primaryConnections.map((connection,index)=>({connection:index,operations:connection.operationDiagnostics}))
    try {
      const caller=structuredClone(primaryEnvelope),pending=persistVerifiedIntegratedBundleLocally(cluster,oids,caller)
      caller.bundle.receiptBytes.fill(0);caller.bundle.custodyBindingBytes.fill(0);caller.bundle.artifacts[0]!.canonicalBytes.fill(0)
      primary=await pending
    }catch(error){assert.fail(JSON.stringify({stage:'primary_publication',failure:error instanceof LocalPgError&&/^[0-9A-Z]{5}$/.test(error.code)?error.code:'operational_failure',connections:primaryDiagnostics()}))}
    finally{LocalPgConnection.connect=primaryConnect}
    assert.ok(primary.ok,JSON.stringify({stage:'primary_publication',reason:primary.ok?null:primary.reason,connections:primaryDiagnostics()}));assert.equal(primary.outcome,'inserted')
    checks.push('primary_real_sql_commit_fresh_23_column_semantic_readback','caller_mutation_after_invocation_cannot_change_owned_bytes')
    const counts=async()=>owner.query("SELECT 'artifact_names' t,count(*)::text n FROM official_provenance_private.artifact_names UNION ALL SELECT 'artifact_blobs',count(*)::text FROM official_provenance_private.artifact_blobs UNION ALL SELECT 'artifacts',count(*)::text FROM official_provenance_private.artifacts UNION ALL SELECT 'receipts',count(*)::text FROM official_provenance_private.receipts UNION ALL SELECT 'receipt_dependencies',count(*)::text FROM official_provenance_private.receipt_dependencies UNION ALL SELECT 'artifact_dependencies',count(*)::text FROM official_provenance_private.artifact_dependencies UNION ALL SELECT 'custody_bindings',count(*)::text FROM official_provenance_private.custody_bindings UNION ALL SELECT 'custody_dependencies',count(*)::text FROM official_provenance_private.custody_dependencies ORDER BY t")
    const beforeRepeat=await counts()
    const primaryRepeat=await persistVerifiedIntegratedBundleLocally(cluster,oids,primaryEnvelope,'verify_existing');assert.ok(primaryRepeat.ok);assert.equal(primaryRepeat.outcome,'idempotent')
    assert.deepEqual(await counts(),beforeRepeat);checks.push('exact_retry_and_verify_existing_full_semantic_readback_all_eight_table_counts_unchanged')
    // Genuine concurrent connections: both complete independent validation, then wait on the same owned lock.
    await owner.query('BEGIN');await owner.query('SELECT pg_catalog.pg_advisory_xact_lock(1869901924,1)')
    const raced=Promise.allSettled([write(composedEnvelope),write(composedEnvelope)])
    let waiting=false
    for(let i=0;i<1500;i++){const state=await owner.query("SELECT count(*)::text n FROM pg_catalog.pg_locks WHERE locktype='advisory' AND classid=1869901924 AND objid=1 AND NOT granted");if(Number(state[0]?.n)===2){waiting=true;break}await new Promise(r=>setTimeout(r,20))}
    await owner.query('COMMIT');assert.equal(waiting,true)
    const outcomes=await raced;assert.deepEqual(outcomes.map(r=>r.status==='fulfilled'?r.value:'failed').sort(),['idempotent','inserted'])
    const composed=await readVerifiedIntegratedBundleLocally(cluster,composedEnvelope.bundle.recordFingerprint);assert.equal(composed.status,'verified');if(composed.status!=='verified')throw Error('composed_readback')
    checks.push('composed_real_sql_commit_fresh_23_column_semantic_readback','barrier_controlled_real_concurrent_full_bundle_writers_inserted_idempotent')
    const composedRepeat=await persistVerifiedIntegratedBundleLocally(cluster,oids,composedEnvelope,'verify_existing');assert.ok(composedRepeat.ok);assert.equal(composedRepeat.outcome,'idempotent')
    checks.push(...await runSemanticRegressions({owner,cluster,oids,primaryEnvelope,composedEnvelope}))
    // All negatives originate from successfully verified complete bundles; call SQL directly to prove independent refusal.
    const p=primaryEnvelope.bundle
    await rejectSql({...primaryEnvelope,profile:'unknown-profile' as typeof primaryEnvelope.profile})
    const versionWriter=await connect('ot_provenance_writer');await versionWriter.query('BEGIN ISOLATION LEVEL READ COMMITTED');await assert.rejects(versionWriter.query("SELECT official_provenance_api.publish_local_integrated_v2($1::text,1::smallint,'create_or_verify',$2::text,$3::bytea,$4::bytea,ARRAY[]::official_provenance_api.artifact_input_v1[])",[pgText(primaryEnvelope.profile),pgText(p.recordFingerprint),pgBytes(p.receiptBytes),pgBytes(p.custodyBindingBytes)]),LocalPgError);await versionWriter.query('ROLLBACK');checks.push('sql_unknown_profile_and_mixed_storage_version_refused')
    await rejectSql({...primaryEnvelope,bundle:{...p,receiptBytes:Uint8Array.from([...p.receiptBytes,32])}})
    await rejectSql({...primaryEnvelope,bundle:{...p,custodyBindingBytes:bytes({})}})
    await rejectSql({...primaryEnvelope,bundle:{...p,artifacts:p.artifacts.slice(1)}})
    await rejectSql({...primaryEnvelope,bundle:{...p,artifacts:[...p.artifacts,p.artifacts[0]!]}})
    await rejectSql({...primaryEnvelope,bundle:{...p,artifacts:p.artifacts.map((a,i)=>i===0?{...a,pin:{...a.pin,digest:'0'.repeat(64)}}:a)}})
    await rejectSql({...primaryEnvelope,bundle:{...p,artifacts:p.artifacts.map((a,i)=>i===0?{...a,canonicalBytes:bytes({})}:a)}})
    checks.push('sql_independently_refuses_manipulated_bytes_pins_K_missing_duplicate_artifacts')
    const payload=parse(p.receiptBytes) as IntegratedPilotPayload
    const badSemantic=sealReceipt(primaryEnvelope,{...payload,candidate:{...payload.candidate,factHash:`ot-fact-v1:${'0'.repeat(64)}`}})
    assert.equal(verifyLocalIntegratedPilotBundle(badSemantic).ok,false);await rejectSql(badSemantic)
    const contract=p.artifacts.find(a=>a.artifactType==='fact_schema')!
    for(const extra of [false,true]){
      const bad=rewriteIntegratedFixture(primaryEnvelope,contract.pin.id,v=>({...v,dependencies:extra?[...(v.dependencies as unknown[]),{slot:'/undeclared',pin:p.artifacts.find(a=>a.artifactType==='implementation_bundle')!.pin}]:[]}))
      await rejectSql(bad)
    }
    const badOrigin=p.artifacts.find(a=>a.artifactType==='validity_origin')!
    const originMismatch=rewriteIntegratedFixture(primaryEnvelope,badOrigin.pin.id,v=>({...v,content:{...(v.content as Record<string,unknown>),validFrom:null,validFromBasis:{kind:'no_bound_asserted'}}}))
    await rejectSql(originMismatch)
    checks.push('valid_hash_bad_fact_semantics_origin_crossbinding_and_missing_extra_declared_edges_refused')
    // Same immutable names and versions, altered implementation bytes: otherwise complete and semantically valid.
    const collision=changedImplementation(primaryEnvelope);assert.equal(verifyLocalIntegratedPilotBundle(collision).ok,true);await rejectSql(collision)
    const beforeConflict=await counts();await owner.query('BEGIN');await owner.query('SELECT pg_catalog.pg_advisory_xact_lock(1869901924,1)')
    const conflictRace=Promise.allSettled([write(primaryEnvelope),write(collision)]);let conflictWaiting=false
    for(let i=0;i<1500;i++){const state=await owner.query("SELECT count(*)::text n FROM pg_catalog.pg_locks WHERE locktype='advisory' AND classid=1869901924 AND objid=1 AND NOT granted");if(Number(state[0]?.n)===2){conflictWaiting=true;break}await new Promise(r=>setTimeout(r,20))}
    await owner.query('COMMIT');const conflictResult=await conflictRace;assert.equal(conflictWaiting,true);assert.equal(conflictResult.filter(r=>r.status==='fulfilled'&&r.value==='idempotent').length,1);assert.equal(conflictResult.filter(r=>r.status==='rejected').length,1);assert.deepEqual(await counts(),beforeConflict)
    checks.push('complete_semantically_valid_changed_artifact_name_version_conflict_refused','barrier_controlled_real_concurrent_conflict_one_idempotent_one_refusal_no_extra_rows')
    // Transport lost its COMMIT acknowledgement after a genuine commit. No success until explicit verify_existing.
    const ackEnvelope=sealReceipt(primaryEnvelope,{...payload,supports:payload.supports.map(s=>({...s,freshRetrieval:{...s.freshRetrieval,completedAt:new Date(Date.parse(s.freshRetrieval.completedAt)+1000).toISOString()}}))});assert.equal(verifyLocalIntegratedPilotBundle(ackEnvelope).ok,true)
    const originalConnect=LocalPgConnection.connect
    LocalPgConnection.connect=async(...args:Parameters<typeof LocalPgConnection.connect>)=>{const c=await originalConnect.call(LocalPgConnection,...args);if(args[1]==='ot_provenance_writer'){const query=c.query.bind(c);c.query=async(sql,params)=>{const rows=await query(sql,params);if(sql==='COMMIT'){c.close();throw new LocalPgError('connection_closed')}return rows}}return c}
    let unknown:Awaited<ReturnType<typeof persistVerifiedIntegratedBundleLocally>>
    try{unknown=await persistVerifiedIntegratedBundleLocally(cluster,oids,ackEnvelope)}finally{LocalPgConnection.connect=originalConnect}
    assert.deepEqual(unknown,{ok:false,reason:'commit_outcome_unknown'})
    const resolved=await persistVerifiedIntegratedBundleLocally(cluster,oids,ackEnvelope,'verify_existing');assert.ok(resolved.ok)
    checks.push('real_commit_lost_ack_reports_unknown_then_verify_existing_resolves')
    const reader=await connect('ot_provenance_reader');await reader.query('BEGIN ISOLATION LEVEL REPEATABLE READ READ ONLY');const rows=await readIntegratedRows(reader,p.recordFingerprint);await reader.query('COMMIT')
    const inspect=(r:PgRows)=>inspectIntegratedReadback({profile:LOCAL_INTEGRATED_PILOT_CLOSURE_PROFILE,rows:r},p.recordFingerprint)
    for(const malformed of [rows.slice(0,-1),[...rows,rows.at(-1)!],rows.map((r,i)=>i===0?{...r,extra:'x'}:r),rows.map((r,i)=>i===0?{...r,status:'complete'}:r),rows.map((r,i)=>i===1?{...r,record_fingerprint:'foreign'}:r),rows.map((r,i)=>i===1?{...r,storage_contract_version:'1'}:r),rows.filter(r=>r.row_kind!=='artifact_link'),rows.map(r=>r.row_kind==='binding'?{...r,object_digest:'0'.repeat(64)}:r),rows.map(r=>r.row_kind==='artifact_link'?{...r,target_version:'01'}:r),[rows[1]!,rows[0]!,...rows.slice(2)]])assert.throws(()=>inspect(malformed))
    checks.push('closed_23_columns_null_discipline_terminal_status_and_exact_stored_links_required')
    const observation=p.artifacts.find(a=>a.artifactType==='original_observation')!
    const invalidRequest=rewriteIntegratedFixture(primaryEnvelope,observation.pin.id,v=>({...v,content:{...(v.content as Record<string,unknown>),requestUrl:'https://unregistered.example/incorrect'}}));await rejectSql(invalidRequest)
    const conditional=sealReceipt(primaryEnvelope,{...payload,candidate:{...payload.candidate,fact:{kind:'requirement_effect',effect:'conditional',visaMode:'electronic_visa'}}})
    const conditionalFact=provenanceHash('ot-fact-v1',{factSchema:payload.candidate.factSchema,applicabilitySchema:null,factKind:'requirement_effect',requirementType:'visa',fact:{kind:'requirement_effect',effect:'conditional',visaMode:'electronic_visa'}})!
    const cp=parse(conditional.bundle.receiptBytes) as IntegratedPilotPayload;const conditionalCandidate=provenanceHash('ot-candidate-v1',{scope:cp.globalCell.scope,ruleScopeKey:cp.globalCell.ruleScopeKey,factKind:cp.candidate.factKind,requirementType:cp.candidate.requirementType,schemaFamily:cp.extractor.schemaFamily,factSchema:cp.candidate.factSchema,applicabilitySchema:null,factHash:conditionalFact,evidenceQuality:cp.evidenceQuality,supportVersionIds:cp.supports.map(s=>s.versionId)})!
    await rejectSql(sealReceipt(conditional,{...cp,candidate:{...cp.candidate,factHash:conditionalFact,candidateBinding:conditionalCandidate}}));checks.push('valid_hash_conditional_without_applicability_and_foreign_original_url_refused')
    // Real SQL corruption: retries/readers refuse, with no incidental repair.
    const rootArtifact=p.artifacts.find(a=>a.artifactType==='global_cell')!,targetArtifact=p.artifacts.find(a=>a.artifactType==='implementation_bundle')!
    await owner.query('ALTER TABLE official_provenance_private.artifact_dependencies DISABLE TRIGGER USER')
    await owner.query('INSERT INTO official_provenance_private.artifact_dependencies VALUES($1,1,$2,$3,$4,1,$5)',[pgText(rootArtifact.pin.id),pgText(rootArtifact.pin.digest),pgText('/unexpected'),pgText(targetArtifact.pin.id),pgText(targetArtifact.pin.digest)])
    await owner.query('ALTER TABLE official_provenance_private.artifact_dependencies ENABLE TRIGGER USER')
    await rejectSql(primaryEnvelope);await assert.rejects(readVerifiedIntegratedBundleLocally(cluster,p.recordFingerprint),LocalPgError)
    await owner.query('ALTER TABLE official_provenance_private.artifact_dependencies DISABLE TRIGGER USER');await owner.query('DELETE FROM official_provenance_private.artifact_dependencies WHERE parent_id=$1 AND slot=$2',[pgText(rootArtifact.pin.id),pgText('/unexpected')]);await owner.query('ALTER TABLE official_provenance_private.artifact_dependencies ENABLE TRIGGER USER');checks.push('retained_extra_edge_refused_by_full_read_and_retry')
    await owner.query('BEGIN');await owner.query('SET LOCAL ROLE ot_provenance_write_exec')
    await owner.query('INSERT INTO official_provenance_private.artifact_dependencies VALUES($1,1,$2,$3,$4,1,$5)',[pgText(rootArtifact.pin.id),pgText(rootArtifact.pin.digest),pgText('/constraint-check'),pgText(targetArtifact.pin.id),pgText(targetArtifact.pin.digest)])
    await assert.rejects(owner.query('SET CONSTRAINTS ALL IMMEDIATE'),LocalPgError);await owner.query('ROLLBACK');checks.push('independent_deferred_constraint_rejects_extra_edge_without_publication_API')
    await owner.query('SET session_replication_role=replica');await owner.query('DELETE FROM official_provenance_private.artifact_names WHERE artifact_id=$1',[pgText(targetArtifact.pin.id)]);await owner.query('SET session_replication_role=origin')
    await rejectSql(primaryEnvelope);await assert.rejects(readVerifiedIntegratedBundleLocally(cluster,p.recordFingerprint),LocalPgError)
    assert.equal((await owner.query('SELECT count(*)::text n FROM official_provenance_private.artifact_names WHERE artifact_id=$1',[pgText(targetArtifact.pin.id)]))[0]?.n,'0')
    await owner.query('INSERT INTO official_provenance_private.artifact_names VALUES($1,$2,$3)',[pgText(targetArtifact.pin.id),pgText(targetArtifact.artifactType),pgText('manifest_v1')]);checks.push('retained_permanent_name_index_missing_refused_without_healing')
    const originalKDigest=sha256Hex(Buffer.from(p.custodyBindingBytes).toString('utf8'))
    await owner.query('ALTER TABLE official_provenance_private.artifact_blobs DISABLE TRIGGER USER; ALTER TABLE official_provenance_private.artifact_blobs DROP CONSTRAINT artifact_blob_hash_exact')
    for(const [digest,original] of [[targetArtifact.pin.digest,targetArtifact.canonicalBytes],[originalKDigest,p.custodyBindingBytes]] as const){
      await owner.query('UPDATE official_provenance_private.artifact_blobs SET canonical_bytes=$1 WHERE digest=$2',[pgBytes(bytes({corruption:true})),pgText(digest)])
      await rejectSql(primaryEnvelope);await assert.rejects(readVerifiedIntegratedBundleLocally(cluster,p.recordFingerprint),LocalPgError)
      assert.equal((await owner.query('SELECT canonical_bytes FROM official_provenance_private.artifact_blobs WHERE digest=$1',[pgText(digest)]))[0]?.canonical_bytes,`\\x${Buffer.from(bytes({corruption:true})).toString('hex')}`)
      await owner.query('UPDATE official_provenance_private.artifact_blobs SET canonical_bytes=$1 WHERE digest=$2',[pgBytes(original),pgText(digest)])
    }
    await owner.query("ALTER TABLE official_provenance_private.artifact_blobs ADD CONSTRAINT artifact_blob_hash_exact CHECK (pg_catalog.encode(pg_catalog.sha256(canonical_bytes),'hex')=digest);ALTER TABLE official_provenance_private.artifact_blobs ENABLE TRIGGER USER");checks.push('retained_artifact_and_K_corruption_refused_without_healing')
    const sharedPayload={...payload,supports:payload.supports.map(s=>({...s,freshRetrieval:{...s.freshRetrieval,completedAt:new Date(Date.parse(s.freshRetrieval.completedAt)+2000).toISOString()}}))};const newReceipt=sealReceipt(primaryEnvelope,sharedPayload);assert.equal(verifyLocalIntegratedPilotBundle(newReceipt).ok,true)
    await owner.query('SET session_replication_role=replica');await owner.query('DELETE FROM official_provenance_private.artifacts WHERE artifact_id=$1 AND artifact_version=1',[pgText(targetArtifact.pin.id)]);await owner.query('SET session_replication_role=origin')
    await rejectSql(newReceipt);assert.equal((await owner.query('SELECT count(*)::text n FROM official_provenance_private.artifacts WHERE artifact_id=$1',[pgText(targetArtifact.pin.id)]))[0]?.n,'0')
    await owner.query('INSERT INTO official_provenance_private.artifacts VALUES($1,1,$2,$3,$4,1)',[pgText(targetArtifact.pin.id),pgText(targetArtifact.pin.digest),pgText(targetArtifact.artifactType),pgText('manifest_v1')]);checks.push('new_receipt_shared_subgraph_missing_artifact_cannot_heal')
    await owner.query('ALTER TABLE official_provenance_private.receipt_dependencies DISABLE TRIGGER USER')
    await owner.query('DELETE FROM official_provenance_private.receipt_dependencies WHERE record_fingerprint=$1 AND root_slot=$2',[pgText(p.recordFingerprint),pgText('proof.contract')]);await owner.query('ALTER TABLE official_provenance_private.receipt_dependencies ENABLE TRIGGER USER')
    await rejectSql(primaryEnvelope);await assert.rejects(readVerifiedIntegratedBundleLocally(cluster,p.recordFingerprint),LocalPgError)
    assert.equal((await owner.query('SELECT count(*)::text n FROM official_provenance_private.receipt_dependencies WHERE record_fingerprint=$1 AND root_slot=$2',[pgText(p.recordFingerprint),pgText('proof.contract')]))[0]?.n,'0')
    checks.push('corrupt_retained_missing_link_refused_by_read_and_retry_without_healing')
    // Leave the corruption unchanged and remove only the owned disposable cluster.
    for(const c of connections)c.close();cluster.stop();assert.equal(existsSync(root),false);checks.push('owned_cluster_stopped_and_only_owned_resources_removed')
    return {status:'PASS' as const,profile:LOCAL_INTEGRATED_PILOT_CLOSURE_PROFILE,postgresVersion:cluster.version,checks,
      primary:{outcome:'inserted' as const,repeat:'idempotent' as const,readback:'VERIFIED' as const,rowCount:primary.readback.rowCount},
      composed:{outcome:'inserted' as const,repeat:'idempotent' as const,readback:'VERIFIED' as const,rowCount:composed.rowCount},
      integratedReceiptRoundtrip:'VERIFIED' as const,fullSemanticPublication:'VERIFIED' as const,productionActivation:false,hostedApply:false}
  }finally{for(const c of connections)c.close();cluster.stop()}
}
