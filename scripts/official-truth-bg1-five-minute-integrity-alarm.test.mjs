import assert from 'node:assert/strict'
import {test} from 'node:test'
import {readFileSync} from 'node:fs'
import {observeBg1FiveMinuteIntegrity} from './official-truth-bg1-five-minute-integrity-alarm.mjs'
// Fake offline fixture, *not* a real JWT signature or API key.
const legacyAnon=(overrides={},header={alg:'HS256',typ:'JWT'})=>
 [Buffer.from(JSON.stringify(header)).toString('base64url'),
  Buffer.from(JSON.stringify({iss:'supabase',ref:'qscbgcdmivbbnzrcyegn',
   role:'anon',iat:1600000000,exp:2000000000,...overrides})).toString('base64url'),
  Buffer.alloc(32,7).toString('base64url')].join('.')
const token='ghs_syntheticgithubactionstokenwithminimumlength'
const env={
 JETNITY_BG1_FIVE_MIN_ALARM:'production:qscbgcdmivbbnzrcyegn:integrity-only-v2',
 SUPABASE_PROJECT_REF:'qscbgcdmivbbnzrcyegn',
 JETNITY_BG1_PROD_ANON_KEY:legacyAnon(),
 GITHUB_REPOSITORY:'Jetnity/jetnity',GITHUB_REF:'refs/heads/main',
 GITHUB_TOKEN:token,
}
const dto=(status,incidentGeneration=0)=>({schema:1,status,incidentGeneration})
const response=(body,status=200)=>new Response(JSON.stringify(body),{
 status,headers:{'content-type':'application/json'}
})
test('Alarm is disabled until exact Owner activation and never performs production I/O unarmed',async()=>{
 let calls=0
 const r=await observeBg1FiveMinuteIntegrity({env:{...env,JETNITY_BG1_FIVE_MIN_ALARM:'OFF'},
  fetchImpl:async()=>{calls++;return response(dto('current'))}})
 assert.equal(r.status,'unarmed');assert.equal(calls,0)
})
test('Current and short-term unavailable make NO GitHub owner alarm',async()=>{
 for(const status of ['current','temporarily_unavailable']){
  let calls=0
  const r=await observeBg1FiveMinuteIntegrity({env,fetchImpl:async(url,req)=>{
   assert.ok(url.includes('qscbgcdmivbbnzrcyegn.supabase.co'))
   assert.equal(req.method,'POST')
   assert.equal(req.credentials,'omit')
   assert.equal(req.redirect,'error')
   calls++;return response(dto(status))
  }})
  assert.equal(r.status,status==='current'?'current':'transient')
  assert.equal(calls,1)
 }
})
test('One genuine fixed hard incident produces one deduplicated GitHub PR comment with no secrets',async()=>{
 let post=0;const gen=19
 const r=await observeBg1FiveMinuteIntegrity({env,fetchImpl:async(url,opts)=>{
  if(url.includes('supabase.co'))return response(dto('integrity_locked',gen))
  assert.ok(url.includes('repos/Jetnity/jetnity/issues/1254/comments'))
  assert.equal(opts.headers.Authorization,'Bearer '+token)
  if(opts.method==='GET')return response([])
  assert.equal(opts.method,'POST');post++
  const body=JSON.parse(opts.body).body
  assert.match(body,/jetnity_bg1_integrity_alarm_v2:generation:19/)
  assert.match(body,/https:\/\/jetnity.com\/einreise\/betrieb/)
  assert.equal(body.includes(token),false)
  assert.equal(body.includes(env.JETNITY_BG1_PROD_ANON_KEY),false)
  return response({id:1337},201)
 }})
 assert.equal(r.status,'integrity_alert_posted');assert.equal(r.generation,gen);assert.equal(post,1)
})
test('Replayed integrity generation never creates a second comment',async()=>{
 let posts=0
 const r=await observeBg1FiveMinuteIntegrity({env,fetchImpl:async(url,opts)=>{
  if(url.includes('supabase.co'))return response(dto('integrity_locked',22))
  if(opts.method==='GET')return response([{user:{login:'github-actions[bot]',type:'Bot'},body:'jetnity_bg1_integrity_alarm_v2:generation:22\n\nAlarm'}])
  posts++;return response({id:2},201)
 }})
 assert.equal(r.status,'deduplicated');assert.equal(posts,0)
})
test('A public PR commenter cannot spoof a GitHub Actions integrity alarm to suppress delivery',async()=>{
 let posted=0
 const r=await observeBg1FiveMinuteIntegrity({env,fetchImpl:async(url,opts)=>{
  if(url.includes('supabase.co'))return response(dto('integrity_locked',24))
  if(opts.method==='GET')return response([{user:{login:'someone-else',type:'User'},
    body:'jetnity_bg1_integrity_alarm_v2:generation:24\n\nFake'}])
  posted++;return response({id:4},201)
 }})
 assert.equal(r.status,'integrity_alert_posted')
 assert.equal(posted,1)
})
test('Malformed/redirect/non-json responses and wrong project cannot forge a hard integrity claim',async()=>{
 for(const p of [{...dto('current'),extra:true},{schema:1,status:'integrity_locked',incidentGeneration:'22'},
  {schema:1,status:'integrity_locked',incidentGeneration:-1},{schema:1,status:'transient',incidentGeneration:0}]){
  const r=await observeBg1FiveMinuteIntegrity({env,fetchImpl:async()=>response(p)})
  assert.equal(r.status,'monitor_failed')
 }
 const r=await observeBg1FiveMinuteIntegrity({env:{...env,SUPABASE_PROJECT_REF:'yfvbxvijcorffwxbxahl'},
  fetchImpl:async()=>{throw Error('should not send')}})
 assert.equal(r.code,'target_refused')
})
test('Workflow stays on main, gated by explicit Owner variable, uses a strictly scoped legacy anon secret and is five-minute only',()=>{
 const code=readFileSync(new URL('../.github/workflows/official-truth-bg1-five-minute-integrity-alarm.yml',import.meta.url),'utf8')
 assert.match(code,/cron: '\*\/5 \* \* \* \*'/)
 assert.match(code,/github.ref == 'refs\/heads\/main'/)
 assert.match(code,/JETNITY_BG1_FIVE_MIN_ALARM == 'production:qscbgcdmivbbnzrcyegn:integrity-only-v2'/)
 assert.match(code,/github.event.repository.private == false/)
 assert.match(code,/issues: write/)
 assert.match(code,/pull-requests: write/)
 assert.match(code,/secrets\.JETNITY_BG1_PROD_ANON_KEY/)
 assert.doesNotMatch(code,/JETNITY_PROD_SUPABASE_PUBLISHABLE_KEY|sb_secret_\b/)
 assert.doesNotMatch(code,/SUPABASE_SERVICE_ROLE_KEY|SUPABASE_DB_PASSWORD|personal_access_token|secret_role/i)
})

test('Non-anon, other-project, expired, non-HS256 and malformed JWTs fail with zero network calls',async()=>{
 const candidates=[
  legacyAnon({role:'service_role'}),legacyAnon({role:'authenticated'}),
  legacyAnon({ref:'yfvbxvijcorffwxbxahl'}),legacyAnon({iss:'not-supabase'}),
  legacyAnon({exp:1600000001}),legacyAnon({iat:2500000000}),
  legacyAnon({},{alg:'none',typ:'JWT'}),'sb_secret_not_public',
  'sb_publishable_requires_separate_future_migration','bad.jwt.sig',''
 ]
 for(const k of candidates){
  let calls=0
  const v=await observeBg1FiveMinuteIntegrity({env:{...env,JETNITY_BG1_PROD_ANON_KEY:k},
   fetchImpl:async()=>{calls++;return response(dto('current'))}})
  assert.equal(v.status,'monitor_failed');assert.equal(v.code,'credentials_invalid');assert.equal(calls,0)
 }
})
test('Real transport receives only the exact public anon JWT in fixed apikey header',async()=>{
 const v=await observeBg1FiveMinuteIntegrity({env,fetchImpl:async(url,opts)=>{
  assert.equal(url,'https://qscbgcdmivbbnzrcyegn.supabase.co/rest/v1/rpc/jetnity_bg1_alarm_kind_v2')
  assert.equal(opts.method,'POST');assert.equal(opts.credentials,'omit')
  assert.equal(opts.headers.apikey,env.JETNITY_BG1_PROD_ANON_KEY)
  assert.equal(opts.headers.Authorization,undefined)
  return response(dto('current'))
 }})
 assert.equal(v.status,'current')
})
test('Missing secret refuses even a previously armed workflow',async()=>{
 let calls=0
 const v=await observeBg1FiveMinuteIntegrity({env:{...env,JETNITY_BG1_PROD_ANON_KEY:undefined},
 fetchImpl:async()=>{calls++;return response(dto('current'))}})
 assert.equal(v.code,'credentials_invalid');assert.equal(calls,0)
})
