// One disposable loopback application rehearsal. Requires already installed
// Docker images and Chrome; never pulls packages/images or accepts a remote URL.
import assert from 'node:assert/strict'
import { execFileSync, spawn } from 'node:child_process'
import { randomBytes, createHmac } from 'node:crypto'
import { cpSync, mkdtempSync, readFileSync, writeFileSync, mkdirSync, symlinkSync, rmSync, openSync, closeSync } from 'node:fs'
import { tmpdir } from 'node:os'
import { resolve, join } from 'node:path'
import { createServer, request } from 'node:http'
import { createClient } from '@supabase/supabase-js'
import { createServerClient } from '@supabase/ssr'
import { chromium } from 'playwright'
import { localSchema, seedTrip } from './local-schema'
import { fixtureTripId, fixtureDeclaration, fixtureContract } from './fixtures'
import { reiseAus } from '@/lib/trips/abbildung'
import { partyAusZeilen } from '@/lib/readiness/reisende'
import { pilotContextFingerprint } from '@/lib/readiness/official-truth-ch-de-application-pilot-1/context'

const root=process.cwd(),output=resolve('../application-proof'),owned=mkdtempSync(join(tmpdir(),'ch-de-application-'))
const app=join(owned,'app'),faultFile=join(owned,'fault.json'),run=`jetnity-application-${randomBytes(5).toString('hex')}`,created:string[]=[]
const secret=randomBytes(48).toString('hex'),password=randomBytes(24).toString('hex'),results:unknown[]=[],errors:string[]=[],outbound:string[]=[]
let server:ReturnType<typeof spawn>|undefined,gateway:ReturnType<typeof createServer>|undefined,browser:Awaited<ReturnType<typeof chromium.launch>>|undefined
let stage='bootstrap',failure:string|undefined,sourceRequests=0
const docker=(args:string[],input?:string)=>execFileSync('docker',args,{input,encoding:'utf8',stdio:['pipe','pipe','pipe'],maxBuffer:8*1024*1024,timeout:60_000})
const sql=(text:string)=>docker(['exec','-i',`${run}-db`,'psql','-U','postgres','-v','ON_ERROR_STOP=1','-Atq'],text).trim()
const start=(name:string,args:string[])=>{docker(['run','-d','--pull=never','--name',name,'--label',`jetnity.application.owner=${run}`,...args]);created.push(name)}
const wait=async(fn:()=>unknown)=>{for(let i=0;i<90;i++){try{if(await fn())return}catch{}await new Promise(r=>setTimeout(r,500))}throw Error('Local startup deadline')}
const sign=(claims:unknown)=>{const a=Buffer.from(JSON.stringify({alg:'HS256',typ:'JWT'})).toString('base64url'),b=Buffer.from(JSON.stringify(claims)).toString('base64url');return `${a}.${b}.${createHmac('sha256',secret).update(`${a}.${b}`).digest('base64url')}`}
const fault=(value:string)=>writeFileSync(faultFile,JSON.stringify(value))
const check=async(name:string,fn:()=>Promise<void>)=>{stage=name;await fn();results.push({name,status:'PASS'})}
async function main() {
mkdirSync(output,{recursive:true});fault('none')
try{
 assert.match(docker(['context','inspect','--format','{{.Endpoints.docker.Host}}']).trim(),/^unix:\/\//)
 for(const image of ['jetnity-r2-validation:local','public.ecr.aws/supabase/gotrue:v2.196.0','public.ecr.aws/supabase/postgrest:v16.2'])docker(['image','inspect',image])
 docker(['network','create','--label',`jetnity.application.owner=${run}`,run])
 start(`${run}-db`,['--network',run,'--network-alias','db','--entrypoint','sh','jetnity-r2-validation:local','-c',"initdb -D /tmp/application-db -A trust >/tmp/init.log && echo 'host all all 0.0.0.0/0 trust' >> /tmp/application-db/pg_hba.conf && exec postgres -D /tmp/application-db -c listen_addresses='*'"])
 await wait(()=>{sql('select 1');return true})
 sql('create role anon nologin; create role authenticated nologin; create role service_role nologin bypassrls; create role authenticator login noinherit; grant anon,authenticated,service_role to authenticator; create role supabase_auth_admin login superuser; create schema auth authorization supabase_auth_admin; alter role supabase_auth_admin set search_path=auth;')
 start(`${run}-auth`,['--network',run,'-p','127.0.0.1::9999','-e','GOTRUE_API_HOST=0.0.0.0','-e','GOTRUE_API_PORT=9999','-e','API_EXTERNAL_URL=http://127.0.0.1:54349/auth/v1','-e','GOTRUE_SITE_URL=http://localhost:3529','-e','GOTRUE_DB_DRIVER=postgres','-e','GOTRUE_DB_DATABASE_URL=postgres://supabase_auth_admin@db:5432/postgres?sslmode=disable','-e',`GOTRUE_JWT_SECRET=${secret}`,'-e','GOTRUE_JWT_EXP=3600','-e','GOTRUE_JWT_AUD=authenticated','-e','GOTRUE_JWT_DEFAULT_GROUP_NAME=authenticated','-e','GOTRUE_JWT_ADMIN_ROLES=service_role','-e','GOTRUE_EXTERNAL_EMAIL_ENABLED=true','-e','GOTRUE_MAILER_AUTOCONFIRM=true','public.ecr.aws/supabase/gotrue:v2.196.0'])
 const port=(name:string)=>Number(docker(['port',name]).trim().split(':').at(-1)),authPort=port(`${run}-auth`)
 await wait(async()=> (await fetch(`http://127.0.0.1:${authPort}/health`)).ok)
 sql('grant usage on schema auth to anon,authenticated; grant execute on function auth.uid() to anon,authenticated; grant execute on function auth.jwt() to anon,authenticated;')
 localSchema(sql)
 start(`${run}-rest`,['--network',run,'-p','127.0.0.1::3000','-e','PGRST_DB_URI=postgres://authenticator@db:5432/postgres','-e','PGRST_DB_SCHEMAS=public','-e','PGRST_DB_ANON_ROLE=anon','-e',`PGRST_JWT_SECRET=${secret}`,'public.ecr.aws/supabase/postgrest:v16.2'])
 const restPort=port(`${run}-rest`);await wait(async()=> (await fetch(`http://127.0.0.1:${restPort}/`)).ok)
 gateway=createServer((req,res)=>{
  const isAuth=req.url!.startsWith('/auth/v1/'),isRest=req.url!.startsWith('/rest/v1/')
  if(!isAuth&&!isRest){res.writeHead(404);res.end();return}
  const proxy=request({host:'127.0.0.1',port:isAuth?authPort:restPort,path:req.url!.replace(isAuth?'/auth/v1':'/rest/v1',''),method:req.method,headers:req.headers},up=>{res.writeHead(up.statusCode!,up.headers);up.pipe(res)})
  proxy.on('error',()=>{res.writeHead(502);res.end()});req.pipe(proxy)
 })
 await new Promise<void>((r,j)=>{gateway!.once('error',j);gateway!.listen(54349,'127.0.0.1',r)})
 const url='http://127.0.0.1:54349',base='http://localhost:3529',anon=sign({role:'anon',iss:'supabase',iat:Math.floor(Date.now()/1000),exp:Math.floor(Date.now()/1000)+3600})
 const db=createClient(url,anon,{auth:{persistSession:false,autoRefreshToken:false}}),outsider=createClient(url,anon,{auth:{persistSession:false,autoRefreshToken:false}})
 const ownerSignup=await db.auth.signUp({email:'owner@application-fixture.invalid',password});assert.ifError(ownerSignup.error);assert(ownerSignup.data.session)
 const otherSignup=await outsider.auth.signUp({email:'other@application-fixture.invalid',password});assert.ifError(otherSignup.error);assert(otherSignup.data.session)
 const owner=ownerSignup.data.user!.id;seedTrip(sql,owner)
 // Synthetic AAL2 signed by this disposable GoTrue key, NOT real MFA evidence.
 // No existing account, MFA factor, hosted role or real secret is changed.
 const aal1=ownerSignup.data.session,claims=JSON.parse(Buffer.from(aal1.access_token.split('.')[1]!,'base64url').toString()),aal2={...aal1,access_token:sign({...claims,aal:'aal2'})}
 assert.ifError((await db.auth.setSession(aal2)).error)
 // Copy source; ONLY external source/gate ports in this throwaway copy change.
 // No fixture switch is included in the repository's Next configuration.
 mkdirSync(app);for(const item of ['styles','.jetnity','app','components','lib','types','hooks','public','scripts','package.json','tsconfig.json','next.config.js','postcss.config.js','tailwind.config.js','next-env.d.ts','middleware.ts','proxy.ts']){try{cpSync(join(root,item),join(app,item),{recursive:true})}catch(e){if((e as NodeJS.ErrnoException).code!=='ENOENT')throw e}}
 for(const file of ['postcss.config.mjs','tailwind.config.ts','next.config.mjs']){try{cpSync(join(root,file),join(app,file))}catch{}}
 symlinkSync(join(root,'node_modules'),join(app,'node_modules'),'dir')
 const ports=join(app,'scripts/official-truth-ch-de-application-pilot-1/browser-ports.ts')
 writeFileSync(ports,`import {readFileSync,appendFileSync} from 'node:fs'; import {fixtureContract,fixtureRegistry,fixtureRetrieve,fixtureExtract,consumeOfficialTruthTrustedFactExecutionContext} from './fixtures'; const state=()=>JSON.parse(readFileSync(${JSON.stringify(faultFile)},'utf8')); export const applicationPilotEnabled=()=>state()!=='disabled'; export const applicationContract=()=>state()==='not-admitted'?null:fixtureContract; export const quellenKatalogLesen=async()=>({ok:true,registry:fixtureRegistry}); export const loadOfficialTruthServerOwnedRetrieval=async()=>{appendFileSync(${JSON.stringify(join(owned,'retrievals'))},'1');return fixtureRetrieve(state())}; export {fixtureExtract as officialTruthTrustedFactExtrahieren,consumeOfficialTruthTrustedFactExecutionContext};`)
 const evaluatePath=join(app,'lib/readiness/official-truth-ch-de-application-pilot-1/evaluate-server.ts')
 let evaluator=readFileSync(evaluatePath,'utf8')
 for(const path of ['./contract-server','@/lib/readiness/official-truth-source-catalog-server','@/lib/readiness/official-truth-server-owned-retrieval','@/lib/readiness/official-truth-trusted-fact-extractor-registry'])evaluator=evaluator.replace(`from '${path}'`,"from '@/scripts/official-truth-ch-de-application-pilot-1/browser-ports'")
 writeFileSync(evaluatePath,evaluator)
 const env:NodeJS.ProcessEnv={PATH:process.env.PATH,HOME:process.env.HOME,TMPDIR:process.env.TMPDIR,NEXT_TELEMETRY_DISABLED:'1',NEXT_PUBLIC_SUPABASE_URL:url,NEXT_PUBLIC_SUPABASE_ANON_KEY:anon}
 const log=openSync(join(output,'local-next.log'),'w')
 server=spawn(process.execPath,[join(root,'node_modules/next/dist/bin/next'),'dev','--webpack','--hostname','127.0.0.1','--port','3529'],{cwd:app,env,detached:true,stdio:['ignore',log,log]});closeSync(log)
 await wait(async()=> (await fetch(`${base}/api/health`)).status!==0)
 browser=await chromium.launch({headless:true,channel:'chrome'})
 const contextFor=async(session:typeof aal1)=>{
  const context=await browser!.newContext({viewport:{width:390,height:844},reducedMotion:'reduce'}),jar=new Map<string,{name:string;value:string}>()
  const ssr=createServerClient(url,anon,{cookies:{getAll:()=>[...jar.values()],setAll:values=>values.forEach(c=>jar.set(c.name,c))}});assert.ifError((await ssr.auth.setSession(session)).error);await ssr.auth.stopAutoRefresh()
  await context.addCookies([...jar.values()].map(c=>({...c,url:base,sameSite:'Lax' as const})))
  await context.route('**/*',route=>{const origin=new URL(route.request().url()).origin;if(![base,url].includes(origin)){outbound.push(origin);return route.abort()}return route.continue()})
  return context
 }
 const context=await contextFor(aal2),page=await context.newPage();page.setDefaultTimeout(20_000);page.on('pageerror',e=>errors.push(e.message))
 const form=()=>page.getByRole('region',{name:'Angaben zur CH–DE-Prüfung'})
 const api=async(operation:string,revision:number,ctx=context)=>{const response=await ctx.request.post(`${base}/api/readiness/ch-de-application`,{headers:{origin:base},data:{operation,tripId:fixtureTripId,revision}});return {status:response.status(),body:await response.json()}}
 const graph=async()=>{const raw=await db.from('trips').select('*,trip_stages(*),trip_days(*),trip_items(*),trip_travellers(*,trip_traveller_citizenships(*),trip_traveller_documents(*))').eq('id',fixtureTripId).single();assert.ifError(raw.error);const r=raw.data;return {...reiseAus(r,r.trip_stages,r.trip_days,r.trip_items),party:partyAusZeilen(r.trip_travellers)}}
 const admit=async(seconds=120)=>{const trip=await graph();sql(`delete from private.official_truth_application_pilot_grants;insert into private.official_truth_application_pilot_grants(user_id,trip_id,trip_revision,context_fingerprint,contract_id,contract_digest,approval_reference,enabled,expires_at) values('${owner}','${trip.id}',${trip.revision},'${pilotContextFingerprint(trip)}','${fixtureContract.id}','${fixtureContract.digest}','SYNTHETIC LOCAL TEST ONLY',true,clock_timestamp()+interval '${seconds} seconds')`);return trip.revision}
 const clickCheck=async()=>{const response=page.waitForResponse(r=>r.url().endsWith('/api/readiness/ch-de-application')&&r.request().method()==='POST');await form().getByRole('button',{name:'Offizielle Prüfung starten'}).click();return (await response).json()}
 await check('Actual owned account route, explicit linked declarations, save, authenticated reload',async()=>{
  await page.goto(`${base}/reisen/${fixtureTripId}`)
  await page.getByRole('button',{name:/Vorbereitung/}).first().click()
  await form().getByLabel('Reisende Person und verknüpftes Dokument').selectOption(fixtureDeclaration.credentialOptionRef!)
  await form().getByLabel('Passart').selectOption('ordinary');await form().getByLabel('Reisezweck').selectOption('tourism');await form().getByLabel('Abreiseland').selectOption('CH');await form().getByLabel('Vollständige Reiseroute').selectOption('complete_direct_ch_de')
  const response=page.waitForResponse(r=>r.url().endsWith('/api/readiness/ch-de-application'));await form().getByRole('button',{name:'Angaben speichern'}).click();const saved=await response;assert.equal(saved.status(),200,JSON.stringify(await saved.json()))
  await page.reload();await page.getByRole('button',{name:/Vorbereitung/}).first().click();await form().waitFor();assert.equal(await form().getByLabel('Reisezweck').inputValue(),'tourism');assert.deepEqual((await graph()).regulatoryContext!.declaration,fixtureDeclaration)
 })
 await check('Full current-only synthetic source to canonical Workspace visa and unknown other cells',async()=>{
  await admit();const body=await clickCheck();assert.equal(body.status,'verified',JSON.stringify(body));assert.equal(body.evaluations.filter((e:{result:string})=>e.result!=='unknown').length,1)
  await page.getByText('SYNTHETISCHE TESTQUELLE – KEINE BEHÖRDE',{exact:false}).first().waitFor()
  await form().evaluate(el=>el.scrollIntoView({block:'start'}));await page.evaluate(()=>window.scrollBy(0,-90));await page.screenshot({path:join(output,'smartphone-context.png')})
  const visa=page.locator('[data-official-requirement-type="visa"][data-official-result="not_required"]');await visa.scrollIntoViewIfNeeded();await page.screenshot({path:join(output,'smartphone-result.png')})
  await page.setViewportSize({width:1440,height:1000});await page.evaluate(()=>new Promise(r=>requestAnimationFrame(()=>requestAnimationFrame(r))))
  await form().screenshot({path:join(output,'desktop-context.png')});await visa.scrollIntoViewIfNeeded();await page.screenshot({path:join(output,'desktop-result.png')})
  assert(body.evaluations.find((e:{requirementType:string})=>e.requirementType==='visa').evidence.checkedAt);assert(!JSON.stringify(body).includes('END OF COMPLETE'))
 })
 await check('Unsaved edit immediately removes positive; save is keyboard accessible and no horizontal overflow',async()=>{
  const select=form().getByLabel('Reisezweck');await select.focus();assert(await select.evaluate(e=>e===document.activeElement));await select.selectOption('other')
  assert.equal(await page.getByText('SYNTHETISCHE TESTQUELLE – KEINE BEHÖRDE',{exact:false}).count(),0)
  await select.selectOption('tourism');const response=page.waitForResponse(r=>r.url().endsWith('/api/readiness/ch-de-application'));await form().getByRole('button',{name:'Angaben speichern'}).focus();await page.keyboard.press('Enter');assert.equal((await response).status(),200)
  await page.setViewportSize({width:390,height:844});assert(await page.evaluate(()=>document.documentElement.scrollWidth<=window.innerWidth))
 })
 await check('Presentation expiry clears the visible synthetic positive without inventing legal validity',async()=>{
  await admit(5);const body=await clickCheck();assert.equal(body.status,'verified');await page.getByText('SYNTHETISCHE TESTQUELLE – KEINE BEHÖRDE',{exact:false}).first().waitFor();await page.waitForFunction(()=>!document.body.textContent!.includes('SYNTHETISCHE TESTQUELLE – KEINE BEHÖRDE'),{},{timeout:10_000});await form().getByText(/Anzeige ist abgelaufen/).waitFor()
 })
 for(const bad of ['disabled','not-admitted','altered','partial','oversize','timeout'])await check(`Workspace no positive: ${bad}`,async()=>{await admit();fault(bad);const body=await clickCheck();assert.notEqual(body.status,'verified');assert(body.evaluations.every((e:{result:string})=>e.result==='unknown'));assert.equal(await page.getByText('SYNTHETISCHE TESTQUELLE – KEINE BEHÖRDE',{exact:false}).count(),0)})
 fault('none')
 await check('Real guards deny synthetic AAL1/wrong account/stale revision and withdrawn admission',async()=>{
  const revision=await admit();const low=await contextFor(aal1),foreign=await contextFor(otherSignup.data.session!)
  assert.notEqual((await api('check',revision,low)).body.status,'verified');assert.equal((await api('check',revision,foreign)).status,404);assert.equal((await api('check',revision+1)).status,409)
  sql(`update profiles set role='user' where user_id='${owner}'`);assert.notEqual((await api('check',revision)).body.status,'verified');sql(`update profiles set role='owner' where user_id='${owner}'`);
  sql('update private.official_truth_application_pilot_grants set enabled=false');assert.equal((await api('check',revision)).body.status,'source_not_admitted');await low.close();await foreign.close()
 })
 await check('Saved incompatible route cannot request a source',async()=>{
  await form().getByLabel('Vollständige Reiseroute').selectOption('other');let response=page.waitForResponse(r=>r.url().endsWith('/api/readiness/ch-de-application'));await form().getByRole('button',{name:'Angaben speichern'}).click();assert.equal((await response).status(),200)
  await admit();const before=readFileSync(join(owned,'retrievals'),'utf8');assert.equal((await clickCheck()).status,'unsupported_context');assert.equal(readFileSync(join(owned,'retrievals'),'utf8'),before)
  await form().getByLabel('Vollständige Reiseroute').selectOption('complete_direct_ch_de');response=page.waitForResponse(r=>r.url().endsWith('/api/readiness/ch-de-application'));await form().getByRole('button',{name:'Angaben speichern'}).click();assert.equal((await response).status(),200)
 })
 await check('Fetch failure announces error and clears prior result',async()=>{
  await admit();assert.equal((await clickCheck()).status,'verified');await page.route('**/api/readiness/ch-de-application',route=>route.abort());await form().getByRole('button',{name:'Offizielle Prüfung starten'}).click();await form().getByRole('alert').waitFor();assert.equal(await page.getByText('SYNTHETISCHE TESTQUELLE – KEINE BEHÖRDE',{exact:false}).count(),0);await form().screenshot({path:join(output,'smartphone-error.png')})
 })
 assert.deepEqual(errors,[]);assert.deepEqual(outbound,[])
 sourceRequests=readFileSync(join(owned,'retrievals'),'utf8').length
 await context.close();await db.auth.stopAutoRefresh();await outsider.auth.stopAutoRefresh()
}catch(e){failure=`${stage}: ${(e as Error).message}`.replaceAll(secret,'[redacted]').replaceAll(password,'[redacted]');process.exitCode=1;console.error(failure);if(browser){const page=browser.contexts()[0]?.pages()[0];await page?.screenshot({path:join(output,'diagnostic.png'),fullPage:true}).catch(()=>{})}}
finally{
 await browser?.close();if(server?.pid && server.exitCode===null){try{process.kill(-server.pid,'SIGTERM')}catch{};await new Promise<void>(r=>{const timer=setTimeout(()=>{try{process.kill(-server!.pid!,'SIGKILL')}catch{};r()},5000);server!.once('exit',()=>{clearTimeout(timer);r()})})}if(gateway?.listening){gateway.closeAllConnections();await new Promise<void>(r=>gateway!.close(()=>r()))}
 for(const name of created.reverse())try{docker(['rm','-fv',name])}catch{}try{docker(['network','rm',run])}catch{}
 rmSync(owned,{recursive:true,force:true})
 writeFileSync(join(output,'result.json'),JSON.stringify({status:failure?'FAIL':'PASS',boundary:'Actual Next account route/components, GoTrue getUser, PostgREST RLS, context RPC, real Owner/AAL guards and one-shot RPC. AAL2 claim and profiles are disposable synthetic fixtures, not a genuine Owner/MFA witness. Only source/gate ports substituted in destroyed copy. No hosted writes or government traffic.',results,errors,outbound,sourceRequests,failure,cleanup:'Owned copy/containers/network removed; no real credentials used'},null,2)+'\n')
 console.log(`${failure?'FAIL':'PASS'}: ${results.length} application checks; ${output}`)
}

}
void main()
