/** Required actual SQL refusals at old-unbound and final-expiry boundaries. */
import assert from 'node:assert/strict'
import type { TestContext } from 'node:test'
import { startLocalProofCluster,assertLocalProofEnvironment } from '../official-truth-integrated-pilot-1/local-cluster'
import { LocalPgConnection,pgText } from '../official-truth-integrated-pilot-1/pg-wire'
import { nativeSql,installNativeSchema,quote } from './native-schema'
import { startNativeHttp } from './native-http'
import { nativeProductRuntime,type NativeRuntimeState } from './native-loader'
import { seedNativeRows,seedNativeCatalog,nativeBinding,declareNativeTrip } from './native-fixture'
import type { AcceptedStoreTripResult } from '@/lib/readiness/official-truth-accepted-store-trip-integration-1/result'

async function seedOldArchive(cluster:ReturnType<typeof startLocalProofCluster>,archive:unknown) {
  // The old proof role really commits its unchanged local historical archive.
  // Its success conveys no accepted-store authority or new profile binding.
  const connection=await LocalPgConnection.connect(cluster,'ot_provenance_writer')
  try {
    await connection.query('begin isolation level read committed')
    const rows=await connection.query(`select official_provenance_api.publish_local_integrated_v2(
      'ot-integrated-pilot-local-closure-v2',2::smallint,'create_or_verify',$1::jsonb->>'recordFingerprint',
      decode($1::jsonb->>'receiptBase64','base64'),decode($1::jsonb->>'custodyBindingBase64','base64'),
      array(select row(x#>>'{pin,id}',(x#>>'{pin,version}')::bigint,x#>>'{pin,digest}',x->>'artifactType',
        case when x->>'artifactType'='global_cell' then 'global_definition_v1' when right(x->>'artifactType',2)='V1' then 'custody_v1' else 'manifest_v1' end,
        (x->>'artifactContractVersion')::integer,decode(x->>'canonicalBase64','base64'))::official_provenance_api.artifact_input_v1
        from jsonb_array_elements($1::jsonb->'artifacts') x order by x#>>'{pin,id}')) as outcome`,[pgText(JSON.stringify(archive))])
    assert.equal(rows[0]?.outcome,'inserted');await connection.query('commit')
  } catch(error){await connection.query('rollback').catch(()=>[]);throw error}
  finally {connection.close()}
}

export async function nativeAcceptanceFailureProof(t:TestContext) {
  assert.equal(process.versions.node.split('.')[0],'22');assertLocalProofEnvironment()
  const proofs:string[]=[]
  for(const mode of ['unbound_archive','unbound_legacy_claim','source_expiry_after_constraints'] as const) {
    const cluster=startLocalProofCluster(),sql=nativeSql(cluster)
    let http:Awaited<ReturnType<typeof startNativeHttp>>|null=null,witness:Awaited<ReturnType<typeof nativeBinding>>|null=null
    const envKeys=['NEXT_PUBLIC_SUPABASE_URL','NEXT_PUBLIC_SUPABASE_ANON_KEY','SUPABASE_SERVICE_ROLE_KEY'] as const
    const previous=Object.fromEntries(envKeys.map(key=>[key,process.env[key]]))
    let stage='schema',seeded=false,deferredObserved=false,finished=false
    const count=(table:string)=>Number(sql(`select count(*) from official_accepted_trip_private.${table}`))
    const signal=()=>new AbortController().signal
    try {
      installNativeSchema(sql);seedNativeRows(sql);http=await startNativeHttp(cluster)
      process.env.NEXT_PUBLIC_SUPABASE_URL=http.url;process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY=http.anonToken;process.env.SUPABASE_SERVICE_ROLE_KEY=http.serviceToken
      await seedNativeCatalog(http);witness=await nativeBinding(http.url,sql,mode==='source_expiry_after_constraints'?15:300)
      const state:NativeRuntimeState={binding:witness.binding,cookie:http.cookie(),successor:false,sourceStarts:0,authCookieReads:0}
      const runtime=nativeProductRuntime(state),trip=await declareNativeTrip(http,runtime)
      if(mode==='source_expiry_after_constraints') {
        // Test-only deferred work on a NEW candidate table. The canonical
        // schemas/functions and candidate source bytes stay unchanged.
        sql(`create function official_accepted_trip_private.synthetic_expiry_delay() returns trigger
          language plpgsql set search_path='' as $$ begin perform pg_catalog.pg_sleep(17); return new; end $$;
          revoke all on function official_accepted_trip_private.synthetic_expiry_delay() from public,anon,authenticated,service_role;
          grant execute on function official_accepted_trip_private.synthetic_expiry_delay() to ot_accepted_trip_exec;
          create constraint trigger synthetic_expiry_delay after insert on official_accepted_trip_private.versions
            deferrable initially deferred for each row execute function official_accepted_trip_private.synthetic_expiry_delay();`)
      } else {
        http.faults.beforeRpc=async(name,payload)=>{
          if(name!=='official_truth_trip_store_finalize_v1'||seeded)return
          const row=JSON.parse(sql(`select jsonb_build_object('operationId',r.operation_id,'manifest',s.manifest)::text
            from official_accepted_trip_private.reservations r join official_accepted_trip_private.stages s using(operation_id)
            where r.token=${quote(String(payload.token))}::uuid and r.state='prepared'`)) as {operationId:string;manifest:{archive:unknown}}
          assert.equal(count('stages'),1)
          if(mode==='unbound_archive')await seedOldArchive(cluster,row.manifest.archive)
          else {
            // Explicit local DBA NEGATIVE setup: this approved operation-ID
            // bridge creates canonical legacy rows, but no new accepted binding.
            // No runtime client receives this permission or principal.
            sql(`set role postgres;begin isolation level read committed;
              select official_accepted_trip_private.publish_legacy_v1(${quote(row.operationId)}::uuid);
              set constraints all immediate;commit;`)
          }
          assert.equal(count('versions'),0);assert.equal(count('operations'),0);assert.equal(witness!.casCount(),0)
          assert.equal(sql('select sequence from official_accepted_trip_private.heads'),'0')
          assert.equal(sql('select count(*) from official_provenance_private.receipts'),mode==='unbound_archive'?'1':'0')
          assert.equal(sql('select count(*) from private.official_rule_claims'),mode==='unbound_legacy_claim'?'1':'0')
          seeded=true
        }
      }
      stage=mode
      const from=http.evidence.length,publication=runtime.producer.publishAcceptedStore(signal()).finally(()=>{finished=true})
      try {
        if(mode==='source_expiry_after_constraints') {
          const deadline=performance.now()+14_000
          while(!finished&&!deferredObserved&&performance.now()<deadline) {
            deferredObserved=Number(sql(`select count(*) from pg_stat_activity where pid<>pg_backend_pid() and wait_event='PgSleep'
              and query like 'select public.official_truth_trip_store_finalize_v1(%'`))===1
            if(!deferredObserved)await new Promise<void>(resolve=>setTimeout(resolve,10))
          }
          assert(deferredObserved,'Must reach real deferred-constraint work while the original source deadline is live')
        }
        assert.equal((await publication).status,'unavailable')
      } finally {delete http.faults.beforeRpc;await publication;await http.settle()}
      assert(mode==='source_expiry_after_constraints'?deferredObserved:seeded)
      const final=http.evidence.slice(from).find(value=>value.rpc==='official_truth_trip_store_finalize_v1')
      assert(final&&!final.committed,`${mode}: target Finalize must actually refuse`);assert.equal(final.sqlState,'22023')
      assert.equal(count('versions'),0);assert.equal(count('operations'),0);assert.equal(count('originals'),0);assert.equal(count('ciphertexts'),0)
      assert.equal(sql('select sequence from official_accepted_trip_private.heads'),'0');assert.equal(witness.casCount(),0)
      assert.equal(sql('select count(*) from official_provenance_private.receipts'),mode==='unbound_archive'?'1':'0')
      assert.equal(sql('select count(*) from private.official_rule_claims'),mode==='unbound_legacy_claim'?'1':'0')
      assert.equal(sql('select count(*) from private.official_evidence_versions'),mode==='unbound_legacy_claim'?'1':'0')
      runtime.rate.readinessRateLeeren()
      const read=await runtime.reader.readAcceptedStoreTrip(trip.id,trip.revision,signal())
      assert.equal(read.status,200);assert.notEqual((read.body as AcceptedStoreTripResult).status,'current')
      if(mode==='source_expiry_after_constraints') {
        sql(`drop trigger synthetic_expiry_delay on official_accepted_trip_private.versions;
          drop function official_accepted_trip_private.synthetic_expiry_delay();`)
        // If the R4 acknowledgement was uncertain while Finalize held locks,
        // normal later work removes expired provisional bytes before retrying.
        const remaining=Number(sql(`select coalesce(greatest(0,ceil(extract(epoch from max(expires_at)-clock_timestamp())*1000)),0)
          from official_accepted_trip_private.reservations`))
        assert(remaining>=0&&remaining<=45_000)
        t.diagnostic(JSON.stringify({proof:'native-final-expiry-checkpoint',deferredObserved,sqlState:final.sqlState,waitMs:remaining,committedVersions:0}))
        if(remaining)await new Promise<void>(resolve=>setTimeout(resolve,remaining+25))
        stage='fresh publication after failed expired source and bounded provisional sweep'
        assert.equal((await runtime.producer.publishAcceptedStore(signal())).status,'confirmed',JSON.stringify(http.evidence.slice(-8)))
        assert.equal(count('versions'),1);assert.equal(count('stages'),0);assert.equal(count('reservations'),0)
      }
      await http.settle()
      const peers=()=>Number(sql(`select count(*) from pg_stat_activity where pid<>pg_backend_pid() and datname=current_database() and backend_type='client backend'`))
      const deadline=performance.now()+2_000
      while(peers()&&performance.now()<deadline)await new Promise<void>(resolve=>setTimeout(resolve,5))
      assert.equal(peers(),0);assert(witness.keyCopies.every(key=>key.every(byte=>byte===0)))
      proofs.push(mode);t.diagnostic(JSON.stringify({proof:'native-acceptance-refusal',mode,seeded,deferredObserved,sqlState:final.sqlState,
        oldArtifactNotAdopted:mode!=='source_expiry_after_constraints',readerPositive:false,ownedClientBackends:0}))
    } catch(error){t.diagnostic(JSON.stringify({failedAcceptanceMode:mode,stage,proofs,seeded,deferredObserved,lastRpcOutcomes:http?.evidence.slice(-10)}));throw error}
    finally {
      if(http)await http.close();if(witness)await witness.close()
      for(const key of envKeys){if(previous[key]===undefined)delete process.env[key];else process.env[key]=previous[key]}
      cluster.stop()
    }
  }
}
