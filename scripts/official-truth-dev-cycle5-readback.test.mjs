import assert from 'node:assert/strict'
import {readFile} from 'node:fs/promises'
import {test} from 'node:test'
import {runCli, runReadback} from './official-truth-dev-cycle5-readback.mjs'

const SQL = await readFile(new URL('./db/official-truth-chde-at-renewal-dev-20261121/dev-cycle5-independent-readback.READONLY.sql', import.meta.url), 'utf8')
const REF = 'refs/heads/fix/official-truth-chde-at-renewal-dev-20261121'
const TOKEN = 'offline_test_only_invalid_supabase_token'
const SECRET_BODY = 'MUST_NEVER_APPEAR_BRANCH_PASSWORD_OR_JWT'
const env = {
  CI: 'true', GITHUB_ACTIONS: 'true', GITHUB_REPOSITORY: 'Jetnity/jetnity',
  GITHUB_EVENT_NAME: 'push', GITHUB_REF: REF,
  GITHUB_WORKFLOW_REF: 'Jetnity/jetnity/.github/workflows/official-truth-chde-at-renewal-dev.yml@' + REF,
  GITHUB_SHA: 'a'.repeat(40), SUPABASE_ACCESS_TOKEN: TOKEN,
}
const row = {
  observed_at: '2026-11-21 13:25:10.123456+00', cycle5_retirement_count: 1,
  cycle5_retired_at: '2026-11-21T12:17:00.000Z', prior_retirement_count: 6,
  retirement_owner_receipt_count: 7, cycle5_owner_receipt_exact: true,
  closed_job_and_15_53_history_unchanged: true, cycle5_original_intake_bytes_exact: true,
  archived_original_count: 2, archived_original_bytes_exact: true,
  later_source_starts: 0, later_accepted_versions: 0, later_public_projections: 0,
  retired_attempt_results: 0, retired_attempt_dispositions: 0,
  jobs_membership_count: 1, jobs_membership_original: true, v7_catalog_exact: true,
  bg1: 'current', bg1_generation: 2063, incident_generation: 14, resumed_generation: 14,
  latest_bg1_due_at: '2026-11-21 13:25:00+00', natural_post_v7_complete_proofs: 16,
  verdict: 'DEV_CYCLE5_RETIREMENT_AND_ARCHIVE_INDEPENDENT_READBACK_PASS',
  historical_ui_confirmation_proven_from_database: false, owner_session_used: false,
  new_source_run_started: false, production_write: false,
}
function preflight(status, cancelled) {
  return {status, body: {cancel: async () => { cancelled.push(status) }},
    json() { throw new Error(SECRET_BODY) }, text() { throw new Error(SECRET_BODY) }}
}
function fixture({projectStatus=404, branchStatus=200, queryStatus=201, body=[row], headers,
  transportError, queryResponse} = {}) {
  const calls = [], cancelled = []
  const fetchImpl = async (url, init) => {
    calls.push({url, init})
    if (transportError) throw new Error(TOKEN + SECRET_BODY + ' https://private.invalid')
    if (calls.length === 1) return preflight(projectStatus, cancelled)
    if (calls.length === 2) return preflight(branchStatus, cancelled)
    return queryResponse ?? new Response(typeof body === 'string' ? body : JSON.stringify(body), {
      status: queryStatus, headers: headers ?? {'Content-Type': 'application/json'},
    })
  }
  return {calls, cancelled, options: {env: {...env}, argv: [], fetchImpl, readFileImpl: async () => SQL}}
}
async function stopped(f, code) {
  let stdout = '', stderr = ''
  const exit = await runCli(f.options, {write: s => { stdout += s }}, {write: s => { stderr += s }})
  assert.equal(exit, 1); assert.equal(stdout, '')
  assert.equal(stderr, 'DEV_READBACK_STOP ' + code + '\n')
  assert.doesNotMatch(stderr, /offline_test_only|MUST_NEVER|https?:|Bearer|stack/)
}

test('only exact Dev branch can run; both metadata bodies are cancelled unread', async () => {
  const f = fixture(); const result = await runReadback(f.options)
  assert.equal(result.status, 'pass'); assert.equal(result.cycle5_retired_at, '2026-11-21T12:17:00.000Z')
  assert.deepEqual(f.cancelled, [404,200]); assert.equal(f.calls.length, 3)
  assert.deepEqual(f.calls.map(c=>c.url), [
    'https://api.supabase.com/v1/projects/yfvbxvijcorffwxbxahl',
    'https://api.supabase.com/v1/branches/yfvbxvijcorffwxbxahl',
    'https://api.supabase.com/v1/projects/yfvbxvijcorffwxbxahl/database/query',
  ])
  assert.deepEqual(f.calls.map(c=>c.init.method), ['GET','GET','POST'])
  for(const c of f.calls) { assert.equal(c.init.redirect,'error'); assert.ok(c.init.signal instanceof AbortSignal) }
  assert.deepEqual(JSON.parse(f.calls[2].init.body), {query:SQL,read_only:true})
  assert.doesNotMatch(JSON.stringify(result), /offline_test_only|MUST_NEVER|https?:/)
})
test('no argv, local, fork, PR, wrong branch/workflow, or target override can call API', async () => {
  const changes = [ {CI:'false'}, {GITHUB_ACTIONS:'false'}, {GITHUB_REPOSITORY:'other/fork'},
    {GITHUB_EVENT_NAME:'pull_request'}, {GITHUB_REF:'refs/heads/main'},
    {GITHUB_WORKFLOW_REF:'wrong'}, {GITHUB_SHA:'unsafe'},
    {SUPABASE_PROJECT_REF:'qscbgcdmivbbnzrcyegn'} ]
  for(const change of changes) {
    const f=fixture(); Object.assign(f.options.env,change); await stopped(f,'CI_SCOPE'); assert.equal(f.calls.length,0)
  }
  const f=fixture(); f.options.argv=['--sql=SELECT 1']; await stopped(f,'CI_SCOPE'); assert.equal(f.calls.length,0)
})
test('changed SQL, unavailable fixed file and missing secret fail before any request', async () => {
  const modified=fixture(); modified.options.readFileImpl=async()=>SQL+'\nSELECT 1;'; await stopped(modified,'SQL_DIGEST')
  const missing=fixture(); missing.options.readFileImpl=async()=>{throw new Error(TOKEN)}; await stopped(missing,'SQL_FILE')
  const noSecret=fixture(); delete noSecret.options.env.SUPABASE_ACCESS_TOKEN; await stopped(noSecret,'CREDENTIAL_UNAVAILABLE')
  for(const f of [modified,missing,noSecret]) assert.equal(f.calls.length,0)
})
test('401/403/redirect/wrong target/unknown metadata never reach query', async () => {
  for(const status of [200,301,401,403,429,500]) {
    const f=fixture({projectStatus:status}); await stopped(f,'DEV_PROJECT_GATE_'+status); assert.equal(f.calls.length,1)
  }
  for(const status of [301,401,403,404,429,500]) {
    const f=fixture({branchStatus:status}); await stopped(f,'DEV_BRANCH_GATE_'+status); assert.equal(f.calls.length,2)
  }
})
test('query refusal and transport exceptions cannot leak server messages, token or URL', async () => {
  for(const status of [301,401,403,429,500]) {
    const f=fixture({queryStatus:status,body:TOKEN+SECRET_BODY}); await stopped(f,'QUERY_HTTP_'+status); assert.equal(f.calls.length,3)
  }
  const f=fixture({transportError:true}); await stopped(f,'TRANSPORT'); assert.equal(f.calls.length,1)
})
test('only one complete aggregate row passes; string/secret injection or forged PASS cannot', async () => {
  const cases=[[],[row,row],{},[null],[{...row,secret:TOKEN}],[{...row,cycle5_retirement_count:2}],
    [{...row,v7_catalog_exact:false}],[{...row,bg1:'unavailable'}],[{...row,production_write:true}],
    [{...row,resumed_generation:13}],[{...row,bg1_generation:-1}],
    [{...row,natural_post_v7_complete_proofs:0}],[{...row,verdict:TOKEN}],
    [{...row,observed_at:TOKEN}],[{...row,archived_original_count:'2'}]]
  for(const body of cases) {
    const f=fixture({body}); let out='',err=''; const exit=await runCli(f.options,{write:s=>{out+=s}},{write:s=>{err+=s}})
    assert.equal(exit,1); assert.equal(out,''); assert.match(err,/^DEV_READBACK_STOP [A-Z_]+\n$/)
    assert.doesNotMatch(err,/offline_test_only|MUST_NEVER|https?:/)
  }
})
test('invalid JSON, content type, declared and streamed oversized body fail closed', async () => {
  await stopped(fixture({body:TOKEN}),'RESPONSE_JSON')
  await stopped(fixture({headers:{'Content-Type':'text/html'},body:SECRET_BODY}),'RESPONSE_TYPE')
  await stopped(fixture({headers:{'Content-Type':'application/json','Content-Length':'99999'}}),'RESPONSE_SIZE')
  await stopped(fixture({body:'x'.repeat(17000)}),'RESPONSE_SIZE')
})
test('body read failure and body cancel failure are sanitized', async () => {
  const brokenStream=new ReadableStream({start(controller){controller.error(new Error(TOKEN+SECRET_BODY))}})
  await stopped(fixture({queryResponse:new Response(brokenStream,{status:201,headers:{'Content-Type':'application/json'}})}),'TRANSPORT')
  const f=fixture(); f.options.fetchImpl=async()=>({status:404,body:{cancel:async()=>{throw new Error(TOKEN)}}})
  await stopped(f,'BODY_CANCEL')
})
test('transport deadline aborts and fails closed without retry or token-bearing error', async t => {
  t.mock.timers.enable({apis:['setTimeout']})
  let observedSignal, calls=0
  const f=fixture()
  f.options.fetchImpl=async (_url,init)=>{
    calls++; observedSignal=init.signal
    return new Promise((_resolve,reject)=>init.signal.addEventListener('abort',
      ()=>reject(new Error(TOKEN+SECRET_BODY)),{once:true}))
  }
  const pending=stopped(f,'TIMEOUT')
  for(let i=0;!observedSignal&&i<10;i++) await Promise.resolve()
  assert.ok(observedSignal); assert.equal(observedSignal.aborted,false)
  t.mock.timers.tick(15000)
  await pending
  assert.equal(observedSignal.aborted,true); assert.equal(calls,1)
})
