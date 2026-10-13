import assert from 'node:assert/strict'
import { test } from 'node:test'
import { execFile, execFileSync } from 'node:child_process'
import { findLocalPgBins, startLocalProofCluster } from '../../../scripts/db/official-truth-integrated-pilot-1/local-cluster'
import { localSchema, seedTrip, quote } from '../../../scripts/official-truth-ch-de-application-pilot-1/local-schema'
import { fixtureTrip, fixtureUserId } from '../../../scripts/official-truth-ch-de-application-pilot-1/fixtures'

const bins=findLocalPgBins()
test('native PG: declaration revision/RLS/shape/idempotence and protected finite one-shot admission', {skip:!bins,timeout:60_000},async()=>{
 const cluster=startLocalProofCluster()
 const sql=(text:string)=>execFileSync(bins!.psql,['-h',cluster.socket,'-U',cluster.user,'-d',cluster.database,'-v','ON_ERROR_STOP=1','-Atq'],{input:text,encoding:'utf8',timeout:30_000,stdio:['pipe','pipe','pipe']}).trim()
 const other='99999999-9999-4999-8999-999999999999'
 const session=(text:string,user=fixtureUserId,aal='aal2')=>sql(`begin; set local role authenticated; set local request.jwt.claims=${quote(JSON.stringify({sub:user,aal}))}; ${text}; commit;`)
 try{
  sql(`create role anon nologin; create role authenticated nologin; create role service_role nologin bypassrls;
   create schema auth; create table auth.users(id uuid primary key);
   create function auth.jwt() returns jsonb language sql stable as $$select coalesce(nullif(current_setting('request.jwt.claims',true),''),'{}')::jsonb$$;
   create function auth.uid() returns uuid language sql stable as $$select (auth.jwt()->>'sub')::uuid$$;
   grant usage on schema auth to authenticated,anon; insert into auth.users values(${quote(fixtureUserId)}),(${quote(other)});`)
  localSchema(sql,false);seedTrip(sql)
  const trip=fixtureTrip(),revision=Number(sql(`select revision from trips where id='${trip.id}'`)),context={...trip.regulatoryContext!,tripRevision:revision+1}
  const payload={tripId:trip.id,revision,mutationId:'88888888-8888-4888-8888-888888888888',context}
  const save=(p:unknown,user=fixtureUserId)=>session(`select public.trip_regulatory_context_save_v1(${quote(JSON.stringify(p))}::jsonb)`,user)
  assert.throws(()=>save(payload,other));assert.equal(session(`select count(*) from public.trips`,other),'0')
  for(const bad of [{...payload,context:null},{...payload,context:{...context,version:null}},{...payload,context:{...context,tripId:null}},{...payload,context:{...context,graphFingerprint:null}},{...payload,context:{...context,declaration:{...context.declaration,documentClientRef:'foreign'}}}])assert.throws(()=>save(bad))
  assert.equal(JSON.parse(save(payload)).revision,revision+1);assert.equal(JSON.parse(save(payload)).revision,revision+1)
  assert.throws(()=>save({...payload,mutationId:'different',context:{...context,declaration:{...context.declaration,purpose:'other'}}}))
  const metadata=JSON.parse(sql(`select metadata from trips where id='${trip.id}'`));assert.equal(metadata.preserved,'synthetic');assert.deepEqual(metadata.official_truth_ch_de_application_v1,context)
  const grant='77777777-7777-4777-8777-777777777777',fp='b'.repeat(64)
  sql(`insert into private.official_truth_application_pilot_grants(id,user_id,trip_id,trip_revision,context_fingerprint,contract_id,contract_digest,approval_reference,enabled,expires_at) values('${grant}','${fixtureUserId}','${trip.id}',${revision+1},'${fp}','synthetic-application-v1','${'a'.repeat(64)}','SYNTHETIC LOCAL ONLY',true,clock_timestamp()+interval '2 minutes')`)
  const run={operation:'reserve',tripId:trip.id,revision:revision+1,contextFingerprint:fp,grantId:null as string|null}
  const call=(p:unknown,user=fixtureUserId,aal='aal2')=>session(`select public.official_truth_application_pilot_run_v1(${quote(JSON.stringify(p))}::jsonb)`,user,aal)
  assert.throws(()=>session('select * from private.official_truth_application_pilot_grants'))
  assert.throws(()=>call(run,fixtureUserId,'aal1'));assert.throws(()=>call(run,other))
  assert.throws(()=>call({...run,operation:null}));assert.equal(sql(`select consumed_at is null from private.official_truth_application_pilot_grants`),'t')
  const parallel=await Promise.all([1,2].map(async()=>{
    const text=`begin;set local role authenticated;set local request.jwt.claims=${quote(JSON.stringify({sub:fixtureUserId,aal:'aal2'}))};select public.official_truth_application_pilot_run_v1(${quote(JSON.stringify(run))}::jsonb);commit;`
    const child=execFile(bins!.psql,['-h',cluster.socket,'-U',cluster.user,'-d',cluster.database,'-v','ON_ERROR_STOP=1','-Atq'],{timeout:30_000})
    const done=new Promise<string>((resolve,reject)=>{let out='';child.stdout!.on('data',chunk=>{out+=chunk});child.once('error',reject);child.once('close',code=>code===0?resolve(out.trim()):reject(Error('parallel SQL failed')))})
    child.stdin!.end(text);return done
  }))
  assert.equal(parallel.filter(Boolean).length,1);assert.equal(JSON.parse(parallel.find(Boolean)!).id,grant);assert.equal(call(run),'')
  assert.equal(JSON.parse(call({...run,operation:'recheck',grantId:grant})).id,grant)
  assert.equal(call({...run,operation:'recheck',grantId:other}),'')
  sql('update private.official_truth_application_pilot_grants set enabled=false')
  assert.equal(call({...run,operation:'recheck',grantId:grant}),'')
  sql("update private.official_truth_application_pilot_grants set enabled=true,created_at=clock_timestamp()-interval '2 minutes',expires_at=clock_timestamp()-interval '1 minute'")
  assert.equal(call({...run,operation:'recheck',grantId:grant}),'')
  assert.equal(sql("select has_table_privilege('service_role','private.official_truth_application_pilot_grants','SELECT')"),'f')
 }finally{cluster.stop()}
})
