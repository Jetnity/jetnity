import assert from 'node:assert/strict'
import { test } from 'node:test'
import { readFileSync } from 'node:fs'
import { LOCAL_UNAPPLIED_RPCS, pruefe } from '../../../scripts/db/verwendung.mjs'
import {
 readAtSourceV3Command,AT_SOURCE_V3_BMEIA_SHA,AT_SOURCE_V3_BMEIA_BYTES,
 AT_SOURCE_V3_SELECTION,AT_SOURCE_V3_SOURCES
} from './at-source-v3-owner-contract'

const folder=new URL('../../../scripts/db/official-truth-at-source-v3/',import.meta.url)
const core=readFileSync(new URL('production-stufe1.candidate.sql',folder),'utf8')
const bg1=readFileSync(new URL('production-bg1-v6.suffix.sql',folder),'utf8')
const installer=readFileSync(new URL('production-v3-v6.PO-GO-INSTALL.sql',folder),'utf8')
const rehearsal=readFileSync(new URL('production-v3-v6.ROLLBACK-REHEARSAL.sql',folder),'utf8')
const rollback=readFileSync(new URL('production-v3-v7.APPEND-ONLY-EMERGENCY-ROLLBACK.sql',folder),'utf8')
const comparator=readFileSync(new URL('bmeia-theme-assets-v3.function.sql',folder),'utf8')
const native=readFileSync(new URL('native-pg17-rollback.sql',folder),'utf8')
const manifest=JSON.parse(readFileSync(new URL('../../../docs/official-truth-product-v3/CH_AT_BMEIA_SOURCE_SUCCESSOR_V3_REVIEW_20261123.json',import.meta.url),'utf8'))
const server=readFileSync(new URL('./at-source-v3-owner-server.ts',import.meta.url),'utf8')
const api=readFileSync(new URL('../../../app/api/admin/official-truth/at-source-v3/route.ts',import.meta.url),'utf8')

test('AT Source V3 first stage is not Production-armed or live without Owner',()=>{
 assert.match(installer,/production:qscbgcdmivbbnzrcyegn:AT-CH-SOURCE-V3-STUFE1/)
 assert.match(installer,/server_version_num/)
 assert.match(installer,/jetnity_ot_auth.require_current_owner_session_v1\(\)/)
 assert.match(installer,/official_v3_guard_private.require_open_v1\(\)/)
 assert.match(installer,/MA1_EXACT_REV2_REQUIRED|AT_V3_SOURCE_MA1_EXACT_REV2_REQUIRED/)
 assert.match(installer,/CREATE TABLE official_v3_at_production_private.ch_source_owner_decisions_v3/)
 assert.match(installer,/UNIQUE\(source_sha,decision\)/)
 assert.match(installer,/source_sha=p_bmeia_sha/)
 assert.match(installer,/source_id='bmeia-bern-how-to-apply'/)
 assert.match(installer,/GRANT EXECUTE ON FUNCTION public.official_v3_at_ch_source_approve_v3\(text,text\) TO authenticated/)
 assert.match(installer,/REVOKE ALL ON FUNCTION public.official_v3_at_ch_source_approve_v3\(text,text\)/)
 assert.match(installer,/GRANT EXECUTE ON FUNCTION public.official_v3_at_ch_source_confirm_v3\(text,text\) TO authenticated/)
 assert.match(installer,/NO COMMIT: assembler supplies V6 exact guards/)
 assert.doesNotMatch(core,/\nCOMMIT\s*;/i)
 assert.doesNotMatch(installer,/JETNITY_OFFICIAL_AT_PRODUCTION_VISITOR_V1=enabled/)
 assert.doesNotMatch(installer,/cron.schedule|cron.alter_job|UPDATE\s+official_v3_at_production_private.ch_source_qualifications_v2/i)
})
test('immutable V3 sources and raw original custody bound to exact released legal scope',()=>{
 assert.equal(AT_SOURCE_V3_SOURCES.length,3)
 assert.equal(AT_SOURCE_V3_BMEIA_BYTES,172428)
 assert.equal(AT_SOURCE_V3_BMEIA_SHA,'b8ae6ea71f8ca44556ec30be7921de9c18c26211da1a6175d9b5c0bda85aabc8')
 assert.equal(AT_SOURCE_V3_SELECTION,'CH_AT_VALID_SWISS_PASSPORT_DIRECT_VISA_ONLY')
 assert.equal(manifest.sources.length,3)
 for(const row of AT_SOURCE_V3_SOURCES){
  const pinned=manifest.sources.find((s:{source_id:string})=>s.source_id===row.id)
  assert.ok(pinned)
  assert.equal(pinned.current_original_sha256,row.sha)
  assert.equal(pinned.current_original_bytes,row.bytes)
  assert.ok(installer.includes(row.sha))
 }
 for(const part of [
  'ch_source_qualifications_v3','ch_source_originals_v3','ch_source_owner_decisions_v3',
  'CREATE POLICY postgres_only','FORCE ROW LEVEL SECURITY',
  'immutable_rows BEFORE UPDATE OR DELETE','immutable_truncate BEFORE TRUNCATE'
 ])assert.ok(installer.includes(part))
 assert.match(installer,/ch_source_owner_decisions_v3\)<>0/)
})
test('BG1 V6 and append-only V7 rollback do not extend visitors',()=>{
 assert.match(bg1,/bg1_prod_ch_at_source_v6/)
 assert.match(bg1,/predecessor_catalog_digest/)
 assert.match(bg1,/predecessor_baseline_digest/)
 assert.match(bg1,/bg1_prod_ch_at_qualified_v5/)
 assert.match(bg1,/source_digest IS DISTINCT FROM/)
 assert.match(bg1,/AT_SOURCE_V3_V6_PREMATURE_GUARD_OPEN/)
 assert.match(bg1,/official_v3_at_ch_source_approve_v3/)
 assert.match(bg1,/official_v3_at_ch_source_confirm_v3/)
 assert.match(rollback,/bg1_prod_ch_at_source_rollback_v7/)
 assert.match(rollback,/AT_V3_ROLLBACK_FAIL_OPEN/)
 assert.match(core,/bg1_prod_ch_at_source_rollback_v7/)
 assert.doesNotMatch(rollback,/(DROP TABLE|TRUNCATE TABLE|DELETE FROM)\s+official_v3_at_production_private/i)
 assert.doesNotMatch(rollback,/GRANT\s+.*\s+TO\s+(anon|service_role)\b/i)
})
test('strict production installer and rollback run the EXACT same guarded SQL',()=>{
 assert.equal(installer,core+'\n'+bg1+'\nCOMMIT;\n')
 assert.equal(rehearsal,core+'\n'+bg1+'\nROLLBACK;\n-- Production rehearsal is NOT authorized by this PR: execute on isolated Dev-compatible PG17 only.\n')
 assert.match(installer,/\nCOMMIT;\s*$/)
 assert.match(rehearsal,/\nROLLBACK;\n/)
})
test('BMEIA V3 comparator is identical to the production function body',()=>{
 const start=core.indexOf('CREATE FUNCTION official_v3_at_production_private.bmeia_theme_assets_v3(')
 const end=core.indexOf('END $assets$;',start)+'END $assets$;'.length
 assert.ok(start>0&&end>start)
 assert.equal(comparator,core.slice(start,end)+'\n')
 assert.match(comparator,/css_old<>4 OR css_new<>4 OR js_old<>15 OR js_new<>15/)
 assert.match(comparator,/left_text=right_text/)
 for(const stop of ['changed visible visa text','changed official date','changed table',
  'changed normal link','changed data','added script','injected inline script',
  'missing content'])assert.ok(native.includes(stop),stop)
 assert.match(native,/BMEIA_PG17_ROLLBACK_PASS/)
})
test('strict Owner RPC and deployment client do not allow visitor or Dev source action',()=>{
 const valid={schema:3,intent:'approve',operationId:'atsrc3_'+'a'.repeat(32),selectionId:AT_SOURCE_V3_SELECTION,sourceSha:AT_SOURCE_V3_BMEIA_SHA}
 assert.ok(readAtSourceV3Command(valid))
 for(const wrong of [
  {...valid,sourceSha:'0'.repeat(64)}, {...valid,selectionId:'OTHER'},
  {...valid,operationId:'atsrc3_'+ 'f'.repeat(31)+'x'},
  {...valid,intent:'publish'}, {...valid,userId:'spoofed'},
  {...valid,schema:2},null,{},[]
 ])assert.equal(readAtSourceV3Command(wrong),null)
 assert.match(server,/JETNITY_OFFICIAL_AT_PRODUCTION_SOURCE_V3_OWNER_V1==='enabled'/)
 assert.match(server,/VERCEL_ENV==='production'/)
 assert.match(server,/getServerSupabaseUrl\(\)===HUMAN_METHOD_PRODUCTION_URL/)
 assert.match(api,/requireAdminApi\(\{surface:'official-truth-source-v3',capability:'official-truth-freigeben'\}\)/)
 assert.match(api,/adminWriteErlaubt\(\{grant:gate.grant\}\)\.erlaubt/)
 assert.match(api,/request.headers.get\('origin'\)!==url.origin/)
 assert.match(api,/MAX_BYTES=512/)
 assert.match(server,/official_v3_at_ch_source_approve_v3/)
 assert.match(server,/official_v3_at_ch_source_confirm_v3/)
})


test('real Dev PG17 native negative Owner/AAL2 and V14 catalog successor are rollback-only',()=>{
 const owner=readFileSync(new URL('dev-owner-aal2-native.ROLLBACK.sql',folder),'utf8')
 const guard=readFileSync(new URL('dev-bg1-v14.NATIVE-ROLLBACK.sql',folder),'utf8')
 assert.match(owner,/AT_V3_DEV_OWNER_AAL2_2_NEGATIVE_PASS/)
 assert.match(owner,/require_current_owner_session_v1\(\)/)
 assert.match(owner,/has_function_privilege\('anon'/)
 assert.match(owner,/AT_V3_DEV_OWNER_API_ROLLBACK_FAILED/)
 assert.match(guard,/bg1_dev_at_source_v14/)
 assert.match(guard,/bg1_dev_bmeia_assets_v13/)
 assert.match(guard,/AT_SOURCE_V3_DEV_BG1_PREMATURE_CURRENT/)
 assert.match(guard,/AT_SOURCE_V3_DEV_SOURCE_CHANGED_STOP/)
 assert.match(guard,/source_v14.catalog IS DISTINCT FROM official_v3_guard_private.catalog_status_v1\(\)/)
 assert.match(guard,/official_v3_guard_private.assert_catalog_v1\(\)/)
 for(const sql of [owner,guard]){
  assert.match(sql,/^BEGIN;/m)
  assert.match(sql,/^ROLLBACK;/m)
  assert.doesNotMatch(sql,/^COMMIT;/mi)
  assert.doesNotMatch(sql,/cron\.schedule|UPDATE\s+official_v3_at_production_private/mi)
 }
})

test('schema-bezug admits only exact Owner V3 server + SQL migration, never unknown or spoofed RPCs',()=>{
 const sourcePath='lib/readiness/official-truth-at-method-v1/at-source-v3-owner-server.ts'
 const sqlPath='scripts/db/official-truth-at-source-v3/production-v3-v6.PO-GO-INSTALL.sql'
 const names=['official_v3_at_ch_source_approve_v3','official_v3_at_ch_source_confirm_v3']
 assert.deepEqual(LOCAL_UNAPPLIED_RPCS.filter(item=>item.sourcePath===sourcePath),
   names.map(name=>({name,sourcePath,sqlPath})))
 const actualSource=readFileSync(sourcePath,'utf8')
 const sql=readFileSync(sqlPath,'utf8')
 for(const name of names){
  assert.match(sql,new RegExp('CREATE FUNCTION public\\.'+name+'\\('))
  assert.match(sql,new RegExp('REVOKE ALL ON FUNCTION public\\.'+name+'\\('))
 }
 assert.ok(sql.includes('require_current_owner_session_v1()'))
 const check=(file:string,source:string,migration:string|null)=>pruefe({
  dateien:[file],lese:()=>source,
  typenInhalt:'    Tables: {\n    }\n    Views: {\n    }\n    Functions: {\n    }',
  sqlVorhanden:(filePath:string)=>filePath===sqlPath && migration!==null,
  sqlInhalt:()=>migration??'',
 })
 const valid=check(sourcePath,actualSource,sql)
 assert.deepEqual(valid.befunde,[])
 assert.deepEqual(valid.lokaleUnapplied.map(x=>x.name).sort(),[...names].sort())
 for(const name of names){
  const call='.rpc('+JSON.stringify(name)+')'
  assert.equal(check('lib/untrusted-server.ts',call,sql).befunde[0]?.grund,'wrong-source')
  assert.equal(check(sourcePath,call,null).befunde[0]?.grund,'missing-sql')
  assert.equal(check(sourcePath,call,'CREATE FUNCTION public.unrelated()').befunde[0]?.grund,'missing-sql')
 }
 // Construct synthetic RPC text just as the other negative cases do: the
 // repository scanner must not mistake the test fixture for a runtime call.
 const unknown='unreviewed_source_v3_publish'
 assert.equal(check(sourcePath,'.rpc('+JSON.stringify(unknown)+')',sql).befunde[0]?.name,unknown)
})
