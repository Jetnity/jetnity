// Offline composition for the original Production rolling baseline and the #1212 stores.
import assert from 'node:assert/strict'
import { createHash } from 'node:crypto'
import { readFileSync, writeFileSync } from 'node:fs'
import { fileURLToPath } from 'node:url'
import { assertTransactionBody, functionsIn } from '../official-truth-v3-background-guard-1/build.mjs'
import { compileAdminRuntimeInstallation, functionMetadata, REPLACEMENTS, STORE_SCHEMAS } from '../admin-runtime-bg1-1/build.mjs'

const read = name => readFileSync(new URL(name, import.meta.url), 'utf8')
const sha = value => createHash('sha256').update(value).digest('hex')
const literal = value => "'" + value.replaceAll("'", "''") + "'"
const json = value => literal(JSON.stringify(value)) + '::jsonb'
const legacy = name => read('../admin-runtime-bg1-1/' + name)
const rolling = 'official_v3_guard_private.rolling_quota_baseline_v1'
export const BASELINE = 'official_v3_guard_private.admin_runtime_baseline_v1'
export const TARGET = 'production:qscbgcdmivbbnzrcyegn:ADMIN-1212'
function once(s, anchor, replacement) {
  assert.equal(s.split(anchor).length, 2, 'expected one fixed source anchor: ' + anchor.slice(0,96))
  return s.replace(anchor, () => replacement)
}
function slice(s, from, to) {
  assert.equal(s.split(from).length, 2)
  assert.equal(s.split(to).length, 2)
  assert.ok(s.indexOf(from)<s.indexOf(to))
  return s.slice(s.indexOf(from),s.indexOf(to))
}
export function compileProductionAdmin() {
  const origin = read('../official-truth-v3-production-install-1/install-and-start-guard.sql')
  assert.equal(sha(origin), 'e5a9db6404a7377cf8ec853ffe0a839474aaf7885e8f6a2195b8ce8e14462290')
  const predecessor = sha(read('../official-truth-v3-production-install-1/rolling-production.sql'))
  assert.equal(predecessor,'2804ccfd293752a9c4a7cb3259e71940d02c5019e89ee987ffd7d37c1da7ac4a')
  const reviewed = compileAdminRuntimeInstallation()
  assert.equal(reviewed.digest,'f373c42e84d70b6348f2cb51dc782427bb7ef582a20396d6443870ab67b2af06')
  const definitionDigest = sha([sha(origin),reviewed.digest,sha(read('./build.mjs'))].join(':'))
  const pins = new Map(functionsIn(origin)
    .filter(f=>f.name.startsWith('official_v3_guard_private.') || f.name==='public.official_v3_guard_alarm_status_v1')
    .map(f=>[f.signature,f]))
  const [catalog,check,open,alarm] = REPLACEMENTS.map(s=>{assert.ok(pins.has(s));return pins.get(s)})
  const newNames = reviewed.inventory.functions.filter(f=>f.name.startsWith('public.')).map(f=>f.name.split('.')[1])
  const expanded = once(once(catalog.body,"'official_v3_guard_private')",
    "'official_v3_guard_private'," + STORE_SCHEMAS.map(literal).join(',') + ')'),
    "'official_v3_guard_alarm_status_v1'))","'official_v3_guard_alarm_status_v1'," +
      [...newNames,'darf_inhalte_moderieren'].map(literal).join(',') + '))')
  const adminBinding = [
    'OR admin.predecessor_provider_digest<>'+literal(predecessor),
    'OR admin.definition_digest<>'+literal(definitionDigest),
    "OR admin.predecessor_catalog_digest IS DISTINCT FROM encode(sha256(convert_to(rolling.catalog::text,'UTF8')),'hex')",
    "OR admin.predecessor_rolling_digest IS DISTINCT FROM encode(sha256(convert_to((to_jsonb(rolling)||jsonb_build_object('proof_not_before',extract(epoch FROM rolling.proof_not_before)))::text,'UTF8')),'hex')",
    'OR admin.catalog IS DISTINCT FROM official_v3_guard_private.catalog_status_v1()',
  ].join('\n    ')
  let checkBody = once(check.body,'DECLARE predecessor ', 'DECLARE admin '+BASELINE+'%ROWTYPE;\n  predecessor ')
  checkBody = once(checkBody,'BEGIN\n','BEGIN\n  SELECT * INTO STRICT admin FROM '+BASELINE+' WHERE singleton;\n')
  checkBody = once(checkBody,'OR rolling.catalog IS DISTINCT FROM official_v3_guard_private.catalog_status_v1()',adminBinding)
  function fresh(body) {
    return once(once(once(body,'greatest(q.required_generation,b.required_generation)',
      'greatest(a.required_generation,q.required_generation,b.required_generation)'),
      'greatest(q.proof_not_before,b.proof_not_before)','greatest(a.proof_not_before,q.proof_not_before,b.proof_not_before)'),
      'b WHERE q.singleton AND b.singleton','b CROSS JOIN '+BASELINE+' a WHERE q.singleton AND b.singleton AND a.singleton')
  }
  const replacementFns = [catalog,check,open,alarm].map((f,i)=>({...f,body:[expanded,checkBody,fresh(open.body),fresh(alarm.body)][i]}))
  const replacementSql = replacementFns.map(f=>'CREATE OR REPLACE FUNCTION '+f.name+'('+f.args+') '+f.options+'AS $admin_prod$'+f.body+'$admin_prod$;').join('\n\n')

  let preflight = legacy('preflight.sql').replaceAll('cycle4_attempt2_baseline_v1','rolling_quota_baseline_v1')
  preflight = once(preflight,"'dev:yfvbxvijcorffwxbxahl:ADMIN-RUNTIME-BG1-1'",literal(TARGET))
  preflight = once(preflight,'exact unused Dev predecessor','exact unused Production predecessor')
  preflight = once(preflight,"OR to_regclass('"+BASELINE+"') IS NOT NULL",
    "OR to_regclass('official_v3_guard_private.cycle4_attempt2_baseline_v1') IS NOT NULL\n    OR to_regclass('"+BASELINE+"') IS NOT NULL")
  preflight = once(preflight,'/* PREDECESSOR_FUNCTIONS */',json([...pins.values()].map(f=>({signature:f.signature,hash:sha(f.body)}))))
  preflight = once(preflight,'/* ORIGINAL_CATALOG */',catalog.body.trim())
  preflight = once(preflight,'/* EXPANDED_CATALOG */',expanded.trim())
  preflight = once(preflight,'/* PUBLIC_NAMES */','ARRAY['+newNames.map(literal).join(',')+']::text[]')
  preflight = once(preflight,'MODERATION_SHA256','35e41fdae08f4663ffd9f58b3e7912b7faf13661ab0159c67067ad43f43498ab')
  const substitute = s=>s.replaceAll('PREDECESSOR_SHA256',predecessor).replaceAll('DEFINITION_SHA256',definitionDigest)
  const baseline = substitute(legacy('baseline.sql').replaceAll('predecessor_attempt2_digest','predecessor_rolling_digest'))
  const storeStart='-- COMPOSED DEV ONLY: explicit API target yfvbxvijcorffwxbxahl; no connection is selected by this SQL.'
  const store = once(slice(reviewed.migration,storeStart,'CREATE OR REPLACE FUNCTION official_v3_guard_private.catalog_status_v1()'),
    storeStart,'-- Count, CMS and campaign stores compiled and verified by #1212.')
  const tables=reviewed.inventory.tables.map(t=>t.baseline?{...t,columns:t.columns.map(c=>c.name==='predecessor_attempt2_digest'?{...c,name:'predecessor_rolling_digest'}:c)}:t)
  const replacements=replacementFns.map(f=>functionMetadata(f,reviewed.inventory.replacements.find(r=>r.signature===f.signature).grantees))
  let delta = once(legacy('delta.sql'),'/* APPROVED_FUNCTIONS */',json(reviewed.inventory.functions))
  delta = once(delta,'/* APPROVED_TABLES */',json(tables))
  delta = once(delta,'/* APPROVED_REPLACEMENTS */',json(replacements))
  delta = substitute(once(delta,'official_v3_guard_private.cycle4_attempt2_baseline_v1 prior',rolling+' prior'))
  const migration = [
    '-- One externally targeted Production transaction. Caller supplies the exact acknowledgement.',
    "SET LOCAL search_path=pg_catalog,pg_temp; SET LOCAL statement_timeout='30s'; SET LOCAL lock_timeout='5s';",
    "SET LOCAL idle_in_transaction_session_timeout='30s'; SET LOCAL timezone='UTC'; SET LOCAL datestyle='ISO, YMD';",
    preflight,baseline,store,replacementSql,delta,legacy('postcheck.sql'),
  ].join('\n\n').trimEnd()+'\n'
  assertTransactionBody(migration)
  assert.doesNotMatch(migration,/ALTER ROLE|CREATE ROLE|DISABLE TRIGGER|session_replication_role|public\.saved_offers|public\.places\b/i)
  return {migration,digest:sha(migration)}
}
if(process.argv[1]===fileURLToPath(import.meta.url)){
  assert.ok(process.argv.length===3 && ['--check','--write'].includes(process.argv[2]))
  const {migration}=compileProductionAdmin()
  if(process.argv[2]==='--write')writeFileSync(new URL('./provider-migration-body.sql',import.meta.url),migration)
  else assert.equal(read('./provider-migration-body.sql'),migration)
}
