import assert from 'node:assert/strict'
import { test } from 'node:test'
import { readFileSync } from 'node:fs'
const v1=readFileSync(new URL(
  '../../scripts/db/official-truth-global-source-body-v1/dev-install.sql',import.meta.url),'utf8')
const v2=readFileSync(new URL(
  '../../scripts/db/official-truth-global-source-body-v1/capacity-v2-dev.sql',import.meta.url),'utf8')

function collector(sql:string, name:'capture_changed_v1'|'capture_changed_v2'):string {
 const start=sql.indexOf('CREATE FUNCTION jetnity_source_body_private.'+name+'() RETURNS integer')
 const end=sql.indexOf('END $capture$;',start)
 assert.ok(start>=0 && end>start,name)
 return sql.slice(start,end+'END $capture$;'.length)
}

test('V2 duplicates exactly the V1 research-only collector, changing solely its bounded limits',()=>{
 const old=collector(v1,'capture_changed_v1')
 const updated=collector(v2,'capture_changed_v2')
 const normalized=updated.replace('capture_changed_v2() RETURNS integer','capture_changed_v1() RETURNS integer')
  .replace('used_rows>=256 OR used_bytes>=33554432','used_rows>=96 OR used_bytes>=16777216')
  .replace('used_rows>=256 OR used_bytes+current_bytes>33554432','used_rows>=96 OR used_bytes+current_bytes>16777216')
  .replace("\n OR pg_database_size(current_database())>=268435456 THEN RETURN 0; END IF;",
    " THEN RETURN 0; END IF;")
 assert.equal(normalized,old)
})
test('Only one exact Dev-only installation, safely stopping at 32 MiB raw and 256 MiB whole DB',()=>{
 assert.match(v2,/^-- Exact-scope, Dev-only/)
 assert.match(v2,/dev:yfvbxvijcorffwxbxahl:BODY-CAPACITY-V2/)
 assert.match(v2,/session_user<>'postgres' OR current_user<>session_user/)
 assert.match(v2,/current_database\(\)<>'postgres'/)
 assert.match(v2,/current_setting\('server_version_num'\)::integer\/10000<>17/)
 assert.match(v2,/official_v3_guard_alarm_status_v1\(\)->>'status'<>'current'/)
 assert.match(v2,/md5\(pg_get_functiondef\('jetnity_source_body_private\.capture_changed_v1\(\)'::regprocedure\)\)/)
 assert.match(v2,/ade26b9ce0e93fbf71320cf6a7f36159/)
 assert.match(v2,/f084da1b45709c3de594a73ce22a764d/)
 assert.match(v2,/used_rows>=256 OR used_bytes>=33554432/)
 assert.match(v2,/used_rows>=256 OR used_bytes\+current_bytes>33554432/)
 assert.match(v2,/pg_database_size\(current_database\(\)\)>=268435456/)
 assert.equal((v2.match(/^BEGIN;$/gm)??[]).length,1)
 assert.equal((v2.match(/^COMMIT;$/gm)??[]).length,1)
})
test('V1 runtime remains unchanged, source snapshots immutable and no extra Cron, keys or HTTP',()=>{
 assert.match(v2,/CREATE FUNCTION jetnity_source_body_private\.capture_changed_v2\(\)/)
 assert.match(v2,/CREATE FUNCTION jetnity_source_body_private\.capture_all_v2\(\)/)
 assert.match(v2,/cron\.alter_job\(jobid,command=>'SELECT jetnity_source_body_private\.capture_all_v2\(\)'\)/)
 assert.match(v2,/jetnity_global_review_private\.capture_all_v2\(\)/)
 assert.match(v2,/REVOKE ALL ON ALL FUNCTIONS IN SCHEMA jetnity_source_body_private/)
 assert.match(v2,/REVOKE ALL ON SCHEMA jetnity_source_body_private/)
 assert.match(v2,/official_v3_guard_private\.assert_catalog_v1\(\)/)
 assert.match(v2,/SELECT jetnity_source_body_private\.capture_all_v2\(\)/)
 assert.match(v2,/original_html/)
 assert.match(v2,/raw_sha<>encode\(sha256\(original_html\),'hex'\)/)
 assert.doesNotMatch(v2,/\bnet\.http_get\s*\(|\bnet\.http_post\s*\(|\bcron\.schedule\s*\(|\bCREATE ROLE\b|\bALTER ROLE\b|\bCREATE TABLE\b|\bALTER TABLE\b|\bCREATE OR REPLACE\b|\bGRANT EXECUTE\b|\bINSERT INTO official_v3_\b/i)
 assert.doesNotMatch(v2,/\bOPENAI_API_KEY\b|\bXAI_API_KEY\b|qscbgcdmivbbnzrcyegn/)
})
test('Source publication stays impossible and append-only security is asserted before and after',()=>{
 assert.match(v2,/WHERE publication_allowed OR legal_rule_qualified OR accepted_fact_count<>0/)
 assert.match(v2,/WHERE raw_sha<>encode\(sha256\(original_html\),'hex'\)/)
 assert.match(v2,/OR primary_rule_qualified OR legal_fact_approved OR public_publish_allowed/)
 assert.match(v2,/relrowsecurity AND c\.relforcerowsecurity/)
 for (const role of ['anon','authenticated','service_role']) {
   assert.match(v2,new RegExp("has_schema_privilege\\('"+role+"','jetnity_source_body_private','USAGE'\\)"))
 }
 assert.match(v2,/BODY_CAPACITY_DEV_EXACT_PREDECESSOR_REQUIRED/)
 assert.match(v2,/BODY_CAPACITY_V2_POSTCHECK_ROLLBACK/)
})
