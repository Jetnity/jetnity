// Disposable Development proof only. No application or function deployment.
// All network output is reduced to allowlisted labels, statuses and booleans.
import { randomBytes, randomUUID, createHmac, createHash } from 'node:crypto';
import { appendFileSync } from 'node:fs';

const DEV = 'yfvbxvijcorffwxbxahl';
const HEAD = 'ab0d38a4c7130a648514bd0f4b518c64e27992e6';
const FN_HASH = 'a811d2b24b3b71b2b628d326427818f4905ba32be5d8aeb990141007a185a5ac';
const API = 'https://api.supabase.com/v1';
const URL = `https://${DEV}.supabase.co`;
const marker = `proof590_${randomBytes(10).toString('hex')}`;
const bucket = marker.replaceAll('_', '-');
const policy = `${marker}_insert`;
const users = [];
const tables = ['profiles', 'trips', 'account_travellers', 'account_visits', 'security_events'];
const cases = Object.fromEntries(['wrong_confirmation','no_session','wrong_password','mfa_no_bypass','aal2_totp_delete','storage_api_before_auth','security_event_removed','graph_cascade','stale_jwt_no_authority','second_delete_no_false_success','foreign_data_unchanged'].map(k=>[k,'NOT_RUN']));
const report = { source_head: HEAD, development: DEV, function_version: 1, function_hash: FN_HASH, cases, observations: {}, cleanup: 'NOT_RUN', status: 'BLOCKED', reason: 'preflight' };
let pat = process.env.SUPABASE_ACCESS_TOKEN || '';
let anon = '', service = '', bucketAttempted = false, policyAttempted = false;
let stage = 'preflight';
class ProofError extends Error { constructor(label) { super(label); this.label=label; } }
const must = (v, label) => { if (!v) throw new ProofError(label); };
const quoteId = (id) => { must(/^[a-f0-9-]{36}$/.test(id),'invalid_fixture_id'); return `'${id}'`; };
const digest = v => createHash('sha256').update(typeof v==='string'?v:JSON.stringify(v)).digest('hex');
const progress = s => { stage=s; console.log(`PROOF_STAGE ${s}`); };

async function request(base, path, { method='GET', key, bearer, body, raw=false }={}) {
  must(base === API || base === URL, 'network_target');
  if (base===API) must(path.startsWith(`/projects/${DEV}/`) || path===`/branches/${DEV}` || path===`/projects/${DEV}`, 'management_target');
  let response;
  try { response=await fetch(base+path,{method,redirect:'error',signal:AbortSignal.timeout(25000),headers:{...(key?{apikey:key}:{}),...(bearer?{Authorization:`Bearer ${bearer}`} : {}),...(body!==undefined?{'Content-Type':raw?'text/plain':'application/json'}:{})},...(body!==undefined?{body:raw?body:JSON.stringify(body)}:{})}); }
  catch { throw new ProofError('network_failure'); }
  const text=await response.text();
  let data=null; try {data=JSON.parse(text);} catch {}
  return {status:response.status,data,text};
}
const management=(path, opts={})=>request(API,path,{...opts,bearer:pat});
const admin=(path,method='GET',body)=>request(URL,path,{method,body,key:service,bearer:service});
const user=(token,path,method='GET',body)=>request(URL,path,{method,body,key:anon,bearer:token});
async function sql(query) {
  const r=await management(`/projects/${DEV}/database/query`,{method:'POST',body:{query}});
  must(r.status===200 && Array.isArray(r.data),'sql_failure'); return r.data;
}
async function count(table,id) {
  must(tables.includes(table),'table_allowlist');
  return (await sql(`select count(*)::int n from public.${table} where user_id=${quoteId(id)}`))[0].n;
}
async function signin(u,password=u.password) {return user(anon,'/auth/v1/token?grant_type=password','POST',{email:u.email,password});}
async function session(u) { const r=await signin(u); must(r.status===200 && typeof r.data?.access_token==='string','signin_failure'); return r.data.access_token; }
async function createUser() {
  const u={email:`${marker}-${randomBytes(5).toString('hex')}@example.com`,password:`Aa1!${randomBytes(24).toString('base64url')}`,id:null};
  users.push(u); // Register intent before the request, including ambiguous network failures.
  const r=await admin('/auth/v1/admin/users','POST',{email:u.email,password:u.password,email_confirm:true,user_metadata:{disposable_proof:marker}});
  must([200,201].includes(r.status) && r.data?.id,'auth_admin_create');
  u.id=r.data.id; quoteId(u.id); return u;
}
async function deletion(token,confirmation='KONTO LÖSCHEN') {return user(token,'/functions/v1/account-delete-v1','POST',{confirmation});}
function observe(label,r) {report.observations[label]={status:r.status,...(typeof r.data?.klasse==='string' && /^[a-z_]{1,40}$/.test(r.data.klasse)?{class:r.data.klasse}:{})};}
function check(label,ok,r) { if(r) observe(label,r); cases[label]=ok?'PASS':'FAIL'; must(ok,`${label}_failed`); }
async function graph(u,token) {
  await sql(`insert into public.profiles(user_id,display_name,role,status) values (${quoteId(u.id)},'Disposable proof','user','active') on conflict(user_id) do nothing`);
  let r=await user(token,'/rest/v1/rpc/reise_anlegen','POST',{_reise:{client_ref:`proof-${randomUUID()}`,title:'Disposable proof',origin:'Zürich',start_date:'2026-10-01',end_date:'2026-10-03',travellers:1,currency:'CHF',budget_amount:null,pace:'balanced',interests:[],travel_wish:null,stages:[{position:1,name:'Bern',country_code:'CH',arrival_date:'2026-10-01',departure_date:'2026-10-03'}],days:[],ungeplante:[]}});
  must([200,201].includes(r.status),'fixture_trip');
  r=await user(token,'/rest/v1/account_travellers','POST',{user_id:u.id,client_ref:randomUUID(),label:'Disposable proof'});
  must([200,201,204].includes(r.status),'fixture_traveller');
  r=await user(token,'/rest/v1/rpc/account_visit_bestaetigen','POST',{_place_id:null,_country_code:'CH',_jahr:null,_monat:null,_tag:null});
  must(r.status===200,'fixture_visit');
  r=await admin('/rest/v1/security_events','POST',{type:'account_erasure_proof',user_id:u.id,metadata:{disposable_proof:marker}});
  must([200,201,204].includes(r.status),'fixture_event');
  for (const t of tables) must(await count(t,u.id)>0,'fixture_graph_nonempty');
}
async function upload(u,token) {
  u.object=`${u.id}/proof.bin`;
  const r=await request(URL,`/storage/v1/object/${bucket}/${u.object}`,{method:'POST',key:anon,bearer:token,raw:true,body:'disposable development proof'});
  must([200,201].includes(r.status),'fixture_upload');
  const rows=await sql(`select count(*)::int n from storage.objects where bucket_id='${bucket}' and owner_id=${quoteId(u.id)}`);
  must(rows[0].n===1,'fixture_storage_owned');
}
async function objects(u) {
  const r=await admin(`/storage/v1/object/list/${bucket}`,'POST',{prefix:`${u.id}/`,limit:100,offset:0,sortBy:{column:'name',order:'asc'}});
  must(r.status===200 && Array.isArray(r.data),'storage_list');
  return r.data.filter(v=>v.id);
}
async function snapshot(u) {
  const parts=[];
  for(const t of tables) parts.push((await sql(`select md5(coalesce(jsonb_agg(to_jsonb(t) order by t.id)::text,'[]')) h from public.${t} t where user_id=${quoteId(u.id)}`))[0].h);
  parts.push((await sql(`select md5(coalesce(jsonb_agg(to_jsonb(t) order by t.id)::text,'[]')) h from auth.users t where id=${quoteId(u.id)}`))[0].h);
  parts.push((await sql(`select md5(coalesce(jsonb_agg(to_jsonb(t)-'last_accessed_at' order by t.id)::text,'[]')) h from storage.objects t where bucket_id='${bucket}' and owner_id=${quoteId(u.id)}`))[0].h);
  const r=await admin(`/storage/v1/object/authenticated/${bucket}/${u.object}`);
  must(r.status===200,'foreign_content_read'); parts.push(digest(r.text));
  return digest(parts);
}
function totp(secret) {
  let bits=''; for(const c of secret.replace(/=+$/,'').toUpperCase()) {const n='ABCDEFGHIJKLMNOPQRSTUVWXYZ234567'.indexOf(c);must(n>=0,'totp_format');bits+=n.toString(2).padStart(5,'0');}
  const bytes=[]; for(let i=0;i+8<=bits.length;i+=8)bytes.push(parseInt(bits.slice(i,i+8),2));
  const counter=Buffer.alloc(8);counter.writeBigUInt64BE(BigInt(Math.floor(Date.now()/30000)));
  const mac=createHmac('sha1',Buffer.from(bytes)).update(counter).digest();const off=mac[mac.length-1]&15;
  return String((mac.readUInt32BE(off)&0x7fffffff)%1000000).padStart(6,'0');
}
async function stepUp(token,id,secret) {
  const c=await user(token,`/auth/v1/factors/${id}/challenge`,'POST',{});must(c.status===200 && c.data?.id,'mfa_challenge');
  const r=await user(token,`/auth/v1/factors/${id}/verify`,'POST',{challenge_id:c.data.id,code:totp(secret)});
  must(r.status===200 && r.data?.access_token,'mfa_verify');return r.data.access_token;
}
function claims(token) {return JSON.parse(Buffer.from(token.split('.')[1],'base64url').toString());}
async function preflight() {
  must(process.env.SUPABASE_PROJECT_REF===DEV && pat,'existing_authority_missing_or_wrong_target');
  const b=await management(`/branches/${DEV}`);report.observations.branch_preflight={status:b.status,ref_matches:b.data?.ref===DEV};must(b.status===200 && b.data?.ref===DEV,'development_branch_guard');
  const f=await management(`/projects/${DEV}/functions`);
  const fn=Array.isArray(f.data)?f.data.find(x=>x.slug==='account-delete-v1'):null;
  must(f.status===200 && fn?.status==='ACTIVE' && fn.version===1 && fn.verify_jwt===true && fn.ezbr_sha256===FN_HASH,'function_drift');
  const keys=await management(`/projects/${DEV}/api-keys?reveal=true`);
  must(keys.status===200 && Array.isArray(keys.data),'existing_keys_unavailable');
  // GET existing keys only. Never create a key or export it to the job log/output.
  anon=keys.data.find(k=>k.name==='anon')?.api_key || keys.data.find(k=>k.type==='publishable')?.api_key || '';
  service=keys.data.find(k=>k.name==='service_role')?.api_key || keys.data.find(k=>k.type==='secret')?.api_key || '';
  must(anon && service,'existing_keys_missing');
  const schema=await sql("select c.conrelid::regclass::text t, c.confdeltype d from pg_constraint c where c.contype='f' and c.confrelid='auth.users'::regclass and c.conrelid in ('public.profiles'::regclass,'public.trips'::regclass,'public.account_travellers'::regclass,'public.account_visits'::regclass)");
  must(new Set(schema.filter(x=>x.d==='c').map(x=>x.t.replace(/^public\./,''))).size===4,'cascade_schema');
  const collision=await sql(`select (select count(*) from storage.buckets where id='${bucket}')+(select count(*) from pg_policies where schemaname='storage' and policyname='${policy}') n`);
  must(Number(collision[0].n)===0,'fixture_collision');
}
async function main() {
  await preflight();
  progress('create_disposable_fixtures');
  const target=await createUser(), foreign=await createUser(), mfa=await createUser();
  const targetToken=await session(target), foreignToken=await session(foreign), mfaToken=await session(mfa);
  bucketAttempted=true;
  const br=await admin('/storage/v1/bucket','POST',{id:bucket,name:bucket,public:false});must([200,201].includes(br.status),'bucket_create');
  policyAttempted=true;
  await sql(`create policy ${policy} on storage.objects for insert to authenticated with check (bucket_id='${bucket}' and (storage.foldername(name))[1]=(select auth.uid())::text and (select auth.uid()) in (${users.map(u=>quoteId(u.id)).join(',')}))`);
  await graph(target,targetToken); await graph(foreign,foreignToken); await graph(mfa,mfaToken);
  await upload(target,targetToken);await upload(foreign,foreignToken);await upload(mfa,mfaToken);
  const foreignBefore=await snapshot(foreign);
  const targetBefore=await snapshot(target);
  progress('negative_auth_cases');
  let r=await deletion(targetToken,'NEIN');check('wrong_confirmation',r.status===400 && r.data?.klasse==='anfrage_ungueltig' && await snapshot(target)===targetBefore,r);
  r=await deletion(null);check('no_session',r.status===401 && await snapshot(target)===targetBefore,r);
  r=await signin(target,`Wrong1!${randomBytes(18).toString('hex')}`);
  check('wrong_password',r.status===400 && r.data?.error_code==='invalid_credentials' && !r.data?.access_token && await snapshot(target)===targetBefore,r);
  progress('mfa_enroll_and_bypass');
  r=await user(mfaToken,'/auth/v1/factors','POST',{factor_type:'totp',friendly_name:'Disposable proof'});
  must(r.status===200 && r.data?.id && r.data?.totp?.secret,'mfa_enroll');
  const factor=r.data.id, secret=r.data.totp.secret;
  const enrolled=await stepUp(mfaToken,factor,secret);must(claims(enrolled).aal==='aal2','enroll_aal2');
  const aal1=await session(mfa);must(claims(aal1).aal==='aal1','fresh_aal1');
  r=await deletion(aal1);
  check('mfa_no_bypass',r.status===403 && r.data?.klasse==='mfa_erforderlich' && (await admin(`/auth/v1/admin/users/${mfa.id}`)).status===200 && (await objects(mfa)).length===1,r);
  progress('password_deletion');
  const fresh=await session(target);
  // Positive control for the exact stale-JWT write shape, while the account exists.
  const writeBody={title:'Disposable authority control',client_ref:randomUUID()};
  r=await user(fresh,'/rest/v1/trips','POST',writeBody);must(r.status===201,'authority_positive_control');
  must((await objects(target)).length===1,'owned_storage_precondition');
  r=await deletion(fresh);observe('password_delete',r);must(r.status===200 && r.data?.klasse==='geloescht','password_delete_failed');
  const gone=await admin(`/auth/v1/admin/users/${target.id}`);
  check('storage_api_before_auth',(await objects(target)).length===0 && gone.status===404);
  check('security_event_removed',await count('security_events',target.id)===0);
  check('graph_cascade',(await Promise.all(tables.slice(0,4).map(t=>count(t,target.id)))).every(n=>n===0));
  const staleUser=await user(fresh,'/auth/v1/user');
  const staleRead=await user(fresh,'/rest/v1/trips?select=id');
  const staleWrite=await user(fresh,'/rest/v1/trips','POST',{...writeBody,client_ref:randomUUID()});
  observe('stale_user',staleUser);observe('stale_read',staleRead);observe('stale_write',staleWrite);
  check('stale_jwt_no_authority',[401,403,404].includes(staleUser.status) && ((staleRead.status===200 && Array.isArray(staleRead.data) && staleRead.data.length===0)||[401,403].includes(staleRead.status)) && ([401,403].includes(staleWrite.status)||(staleWrite.status===409 && staleWrite.data?.code==='23503')) && await count('trips',target.id)===0);
  r=await deletion(fresh);check('second_delete_no_false_success',[401,404].includes(r.status) && ['nicht_angemeldet','nicht_gefunden'].includes(r.data?.klasse),r);
  progress('aal2_totp_deletion');
  // A fresh TOTP step prevents replay of the enrollment code within the same period.
  await new Promise(resolve=>setTimeout(resolve,30500-(Date.now()%30000)));
  const mfaFresh=await session(mfa), aal2=await stepUp(mfaFresh,factor,secret);
  must(claims(aal2).aal==='aal2' && claims(aal2).amr.some(x=>x.method==='totp'),'aal2_claims');
  r=await deletion(aal2);
  check('aal2_totp_delete',r.status===200 && r.data?.klasse==='geloescht' && (await admin(`/auth/v1/admin/users/${mfa.id}`)).status===404 && (await objects(mfa)).length===0 && (await Promise.all(tables.map(t=>count(t,mfa.id)))).every(n=>n===0),r);
  check('foreign_data_unchanged',await snapshot(foreign)===foreignBefore && (await objects(foreign)).length===1);
  report.status='PASS';report.reason='all_cases_passed';
}
async function cleanup() {
  if (!service) { report.cleanup=users.length===0 && !bucketAttempted && !policyAttempted?'PASS_NO_FIXTURES':'FAIL';return; }
  progress('cleanup');const errors=[];
  async function attempt(label,fn) {try{await fn();}catch{errors.push(label);}}
  // Recover IDs for any ambiguous Auth Admin creation; no direct auth writes.
  await attempt('resolve_auth_intents',async()=>{
    const rows=await sql(`select id from auth.users where raw_user_meta_data->>'disposable_proof'='${marker}'`);
    for(const row of rows) if(!users.some(u=>u.id===row.id))users.push({id:row.id});
  });
  for(const u of users.filter(u=>u.id)) {
    if(bucketAttempted) await attempt('storage_cleanup',async()=>{
      const listed=await objects(u);
      if(listed.length) {const r=await admin(`/storage/v1/object/${bucket}`,'DELETE',{prefixes:listed.map(o=>`${u.id}/${o.name}`)});must(r.status===200,'storage_remove');}
      must((await objects(u)).length===0,'storage_remaining');
    });
    await attempt('events_cleanup',()=>sql(`delete from public.security_events where user_id=${quoteId(u.id)}`));
    await attempt('auth_admin_cleanup',async()=>{const r=await admin(`/auth/v1/admin/users/${u.id}`,'DELETE',{should_soft_delete:false});must([200,404].includes(r.status),'auth_delete_cleanup');});
  }
  if(policyAttempted) await attempt('policy_cleanup',()=>sql(`drop policy if exists ${policy} on storage.objects`));
  if(bucketAttempted) await attempt('bucket_cleanup',async()=>{const r=await admin(`/storage/v1/bucket/${bucket}`,'DELETE');must([200,404].includes(r.status),'bucket_delete');});
  await attempt('verify_zero_residue',async()=>{
    const ids=users.filter(u=>u.id).map(u=>quoteId(u.id));
    const fixtureIds=ids.length?ids.join(','):'NULL';
    const q=[`select count(*)::int n from auth.users where id in (${fixtureIds}) or raw_user_meta_data->>'disposable_proof'='${marker}'`,...tables.map(t=>`select count(*)::int n from public.${t} where user_id in (${fixtureIds})`),`select count(*)::int n from storage.objects where bucket_id='${bucket}' or owner_id in (${fixtureIds})`,`select count(*)::int n from storage.buckets where id='${bucket}'`,`select count(*)::int n from pg_policies where schemaname='storage' and policyname='${policy}'`,...['identities','sessions','mfa_factors'].map(t=>`select count(*)::int n from auth.${t} where user_id in (${fixtureIds})`)];
    for(const query of q) must((await sql(query))[0].n===0,'residue');
  });
  report.cleanup=errors.length?'FAIL':'PASS';report.cleanup_errors=[...new Set(errors)];
  if(errors.length) {report.status='FAIL';report.reason='cleanup_incomplete';}
}
try {await main();} catch(e) {report.status=users.length?'FAIL':'BLOCKED';report.reason=e instanceof ProofError?e.label:'unexpected_failure';report.failed_stage=stage;}
finally {try{await cleanup();}catch{report.cleanup='FAIL';report.status='FAIL';report.reason='cleanup_exception';}}
console.log('SANITIZED_PROOF '+JSON.stringify(report));
if(process.env.GITHUB_STEP_SUMMARY)appendFileSync(process.env.GITHUB_STEP_SUMMARY,'```json\n'+JSON.stringify(report,null,2)+'\n```\n');
pat='';anon='';service='';for(const u of users){u.password='';u.email='';}
process.exitCode=report.status==='PASS' && report.cleanup==='PASS'?0:1;
