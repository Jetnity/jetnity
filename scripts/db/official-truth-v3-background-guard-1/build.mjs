// Deterministic source assembly, never a database runner. Historical installers
// remain exact. Every replaced body is checked against its reviewed predecessor.
import assert from 'node:assert/strict'
import { createHash } from 'node:crypto'
import { readFileSync, writeFileSync } from 'node:fs'
import { fileURLToPath } from 'node:url'

const root = new URL('../../../', import.meta.url)
const here = new URL('./', import.meta.url)
const pins = {
  'profile-authority-integrity-1': '2dda7f1bd523e5046bcc72f352a876133d1c7ed01994eb7687c6d1c9d3218774',
  'official-truth-v3-private-owner-guards-1': '3e21495ff40f66337b004fadc98599cd336c19c31bb4f6e4f9013c2c01f02bd2',
  'official-truth-v3-hosted-method-authority-1': 'edbaf9d56b3da115b12bf1c8cfd5c76d8bc9483f7fc1658ee648b380a16fe2c0',
  'official-truth-v3-hosted-intake-store-1': 'f2a3f1b8a2845b2706d06dbef66c225c1836d9398e65682a01bf19d035018ac0',
  'official-truth-v3-human-method-transport-1': '727e83dbed7f0a6b127c3003248d85acc6b920fddc44356cdfeb8f3f57a82d2c',
  'official-truth-v3-hosted-result-store-1': 'ba036a9394baf8a0a4194850ed25e0dba0c97ed8dabfd7842d0c5bf8bbcc4d16',
  'official-truth-v3-hosted-durable-jobs-1': '9d9623206dfd82a9cbd465aef6e36ea48fe0534ff02a85d1a857b2672ec67818',
}
const sha = value => createHash('sha256').update(value).digest('hex')
const quote = value => "'" + String(value).replaceAll("'", "''") + "'"
const read = name => readFileSync(new URL(name, here), 'utf8')

export function functionsIn(sql) {
  const result = []
  const re = /CREATE(?: OR REPLACE)? FUNCTION\s+([a-z_][\w]*\.[a-z_][\w]*)\s*\(([\s\S]*?)\)\s*([\s\S]*?)\bAS\s+(\$[\w]*\$)([\s\S]*?)\4\s*;/gi
  for (const match of sql.matchAll(re)) {
    const args = match[2].split(',').map(x => x.trim()).filter(Boolean)
    const signature = match[1] + '(' + args.map(x => x.replace(/\s+DEFAULT[\s\S]*/i, '').split(/\s+/).slice(1).join(' ')).join(',') + ')'
    result.push({ name: match[1], args: match[2], options: match[3], body: match[5], signature, sql: match[0] })
  }
  return result
}
function replaceOnce(text, before, after) {
  assert.equal(text.split(before).length, 2, 'single reviewed patch anchor: ' + before.slice(0, 90))
  return text.replace(before, after)
}
function definition(f, body) {
  return `CREATE OR REPLACE FUNCTION ${f.name}(${f.args}) ${f.options} AS $bg1_body$${body}$bg1_body$;`
}
function fingerprint(component, tables) {
  const selects = tables.map(([table, a, b = "''"]) => `SELECT ${quote(table)} AS table_name,(${a})::text AS primary_key,(${b})::text AS secondary_key,to_jsonb(r) AS value FROM ${table} r`).join('\nUNION ALL ')
  return `CREATE FUNCTION official_v3_guard_private.fingerprint_${component}_v1() RETURNS text
LANGUAGE sql STABLE SECURITY DEFINER SET search_path=pg_catalog SET timezone='UTC' SET datestyle='ISO, YMD' AS $$
WITH rows AS (${selects}), hashes AS (
SELECT table_name,primary_key,secondary_key,encode(sha256(convert_to(value::text,'UTF8')),'hex') AS digest FROM rows
), groups AS (
SELECT expected.name,count(h.primary_key) AS n,COALESCE(string_agg(h.digest,'' ORDER BY h.primary_key COLLATE "C",h.secondary_key COLLATE "C"),'') AS content
FROM (VALUES ${tables.map(([t]) => '(' + quote(t) + ')').join(',')}) expected(name)
LEFT JOIN hashes h ON h.table_name=expected.name GROUP BY expected.name
)
SELECT encode(sha256(convert_to(${quote('bg1-content:' + component + ':v1:')}||string_agg(name||':'||n::text||':'||encode(sha256(convert_to(content,'UTF8')),'hex'),'|' ORDER BY name COLLATE "C"),'UTF8')),'hex') FROM groups
$$;`
}

export function compileCandidate() {
  const source = new Map()
  for (const [name, digest] of Object.entries(pins)) {
    const text = readFileSync(new URL(`scripts/db/${name}/install-candidate.sql`, root), 'utf8')
    assert.equal(sha(text), digest, 'immutable predecessor: ' + name)
    source.set(name, text)
  }
  const all = [...source.values()].flatMap(functionsIn)
  const get = name => { const matches = all.filter(x => x.name === name); assert.equal(matches.length, 1, name); return matches[0] }
  const changes = []
  const change = (name, owner, transform) => {
    const old = get(name), body = transform(old.body)
    assert.notEqual(body, old.body, name)
    changes.push({ old, body, owner, sql: definition(old, body) })
  }
  change('official_v3_method_api.confirm_operation_v1','postgres', b => replaceOnce(b,
    '  PERFORM pg_catalog.pg_advisory_xact_lock(750101,pg_catalog.hashtext(p_operation_id));',
    "  PERFORM jetnity_ot_auth.require_current_owner_session_v1();\n  PERFORM official_v3_guard_private.begin_hma_v1();\n  PERFORM pg_catalog.pg_advisory_xact_lock(750101,pg_catalog.hashtext(p_operation_id));"))
  for (const name of ['stage_draft_v1','approve_v1','revoke_v1']) change('official_v3_method_api.'+name,'postgres', b => replaceOnce(b,
    "  RETURN pg_catalog.jsonb_build_object('status','recorded','operationId',op.operation_id,'action',op.action,",
    "  PERFORM official_v3_guard_private.seal_hma_v1();\n  PERFORM jetnity_ot_auth.require_current_owner_session_v1();\n  RETURN pg_catalog.jsonb_build_object('status','recorded','operationId',op.operation_id,'action',op.action,"))
  for (const name of ['capture_v1','reserve_v1','finish_v1']) change('official_v3_intake_api.'+name,'ot_v3_intake_owner', b => {
    b=replaceOnce(b,'\nBEGIN\n', "\nBEGIN\n  PERFORM official_v3_guard_private.begin_s1_v1();\n  IF official_v3_guard_private.intake_retired_v1(p_binding->>'operationId') THEN RETURN jsonb_build_object('status','unconfirmed'); END IF;\n")
    if (name==='capture_v1') return replaceOnce(b,
      "  RETURN jsonb_build_object('status','recorded','record',official_v3_intake_private.record_v1(held.operation_id));",
      "  PERFORM official_v3_guard_private.seal_s1_v1();\n  RETURN jsonb_build_object('status','recorded','record',official_v3_intake_private.record_v1(held.operation_id));")
    return replaceOnce(b, name==='reserve_v1' ? '  IF clock_timestamp() >= expires THEN' : '  IF clock_timestamp() >= held.expires_at THEN',
      '  PERFORM official_v3_guard_private.seal_s1_v1();\n'+(name==='reserve_v1' ? '  IF clock_timestamp() >= expires THEN' : '  IF clock_timestamp() >= held.expires_at THEN'))
  })
  change('official_v3_jobs_api.execute_v1','ot_v3_jobs_owner', b => {
    b=replaceOnce(b,'\nBEGIN\n', '\nBEGIN\n  PERFORM official_v3_guard_private.begin_jobs_v1();\n')
    return replaceOnce(b,'  -- LAST database authority check.', '  PERFORM official_v3_guard_private.seal_jobs_v1();\n  -- LAST database authority check.')
  })
  change('official_v3_jobs_private.assert_history_v1','ot_v3_jobs_owner', b => replaceOnce(b,
    'FILTER(WHERE d.attempt_key IS NULL)',
    'FILTER(WHERE d.attempt_key IS NULL AND NOT official_v3_guard_private.attempt_retired_v1(t.attempt_key))'))
  change('official_v3_jobs_private.tx_execution_prepare_v1','ot_v3_jobs_owner', b => replaceOnce(b,'\nBEGIN\n',
    "\nBEGIN\n  IF official_v3_guard_private.attempt_retired_v1(i->>'attemptKey') THEN RETURN jsonb_build_object('reply',jsonb_build_object('status','blocked'),'authority',false); END IF;\n"))
  change('official_v3_result_private.consume_s1_v1','ot_v3_result_owner', b => replaceOnce(b,'\nBEGIN\n',
    "\nBEGIN\n IF official_v3_guard_private.intake_retired_v1(ref#>>'{binding,operationId}') THEN RAISE EXCEPTION 'bg1 retired intake cannot publish' USING ERRCODE='P7906'; END IF;\n"))
  change('official_v3_result_private.assert_catalog_v1','ot_v3_result_owner', b => replaceOnce(b,
    ' SELECT b.catalog INTO stored_catalog FROM official_v3_result_private.binding_v1 b WHERE b.singleton;',
    ' SELECT official_v3_guard_private.hrs_catalog_v1() INTO stored_catalog;'))
  change('official_v3_result_private.command_v1','ot_v3_result_owner', b=>replaceOnce(b,
    "  WHEN 'projection_batch' THEN ARRAY['bindings']",
    "  WHEN 'projection_batch' THEN ARRAY['bindings']\n  WHEN 'ch_de_snapshot' THEN ARRAY[]::text[]"))
  change('official_v3_jobs_private.assert_catalog_v1','ot_v3_jobs_owner', b => {
    b=b.replaceAll('official_v3_jobs_private.catalog_binding_v1','official_v3_guard_private.jobs_catalog_v1()')
    b=replaceOnce(b, '      AND d.refobjid IN (owner_id,caller_id)\n      AND NOT(',
      '      AND d.refobjid IN (owner_id,caller_id)\n      AND NOT official_v3_guard_private.allowed_owner_edge_v1(d.classid,d.objid,d.refobjid,d.deptype)\n      AND NOT(')
    return replaceOnce(b, "    AND d.refobjid=intake_id AND d.deptype='o'\n    AND NOT(",
      "    AND d.refobjid=intake_id AND d.deptype='o'\n    AND NOT official_v3_guard_private.allowed_owner_edge_v1(d.classid,d.objid,d.refobjid,d.deptype)\n    AND NOT(")
  })
  change('official_v3_result_private.dispatch_v1','ot_v3_result_owner', b => {
    b=replaceOnce(b,"OR public_reader AND operation_value IN ('coverage','projection','projection_current','projection_batch')",
      "OR public_reader AND operation_value IN ('coverage','projection','projection_current','projection_batch','ch_de_snapshot')")
    b=replaceOnce(b,' -- Same selected head, then the actual original MA1 lock, for all channels.',
      " IF public_reader THEN\n  PERFORM official_v3_guard_private.require_open_v1();\n ELSE\n  PERFORM pg_advisory_xact_lock(771106,1);\n  PERFORM official_v3_guard_private.require_open_v1();\n END IF;\n -- Same selected head, then the actual original MA1 lock, for all channels.")
    const scanStart=' PERFORM official_v3_result_private.assert_catalog_v1();\n SELECT stored.state_certificate'
    b=replaceOnce(b,scanStart,' IF NOT public_reader THEN\n PERFORM official_v3_result_private.assert_catalog_v1();\n SELECT stored.state_certificate')
    b=replaceOnce(b," IF operation_value IN ('history','head') THEN", " END IF;\n IF operation_value='ch_de_snapshot' THEN\n  reply_value:=official_v3_guard_private.ch_de_snapshot_v1(b,epoch_value,deadline,legal_day_value);\n ELSIF operation_value IN ('history','head') THEN")
    b=replaceOnce(b," PERFORM official_v3_result_private.assert_catalog_v1();\n IF channel_value IN ('attest','execute') THEN",
      " IF NOT public_reader THEN\n PERFORM official_v3_result_private.assert_catalog_v1();\n IF channel_value IN ('attest','execute') THEN")
    return replaceOnce(b,' PERFORM official_v3_result_private.fence_v1(b,epoch_value,deadline,legal_day_value);\n RETURN reply_value;',
      " END IF;\n PERFORM official_v3_guard_private.require_open_v1();\n IF operation_value='ch_de_snapshot' AND clock_timestamp()>=(reply_value#>>'{value,validUntil}')::timestamptz THEN RAISE EXCEPTION 'bg1 final snapshot expired' USING ERRCODE='P7902'; END IF;\n PERFORM official_v3_result_private.fence_v1(b,epoch_value,deadline,legal_day_value);\n RETURN reply_value;")
  })
  const capture=get('official_v3_intake_api.capture_v1'), finish=get('official_v3_intake_api.finish_v1')
  const capturePrefix=capture.body.slice(0,capture.body.indexOf('  INSERT INTO official_v3_intake_private.operations_v1'))
  assert.ok(capturePrefix.includes('safe_data_v1') && capturePrefix.includes('unique_json_v1'))
  const originalValidator=`CREATE FUNCTION official_v3_guard_private.original_valid_v1(${capture.args}) RETURNS boolean
LANGUAGE plpgsql STABLE SECURITY DEFINER SET search_path=pg_catalog AS $body$${capturePrefix.replaceAll(/RETURN jsonb_build_object\('status','(?:invalid|collision)'\);/g,'RETURN false;')}  RETURN true;\nEND $body$;`
  const finishPrefix=finish.body.slice(0,finish.body.indexOf('  SELECT * INTO held FROM official_v3_intake_private.operations_v1'))
  assert.ok(finishPrefix.includes("'acceptance'") && finishPrefix.includes('shape_matches_v1'))
  const completionValidator=`CREATE FUNCTION official_v3_guard_private.completion_valid_v1(${finish.args}) RETURNS boolean
LANGUAGE plpgsql STABLE SECURITY DEFINER SET search_path=pg_catalog AS $body$${finishPrefix.replaceAll(/RETURN jsonb_build_object\('status','unconfirmed'\);/g,'RETURN false;')}  RETURN true;\nEND $body$;`
  const fingerprints=[
    fingerprint('hma', [['official_v3_method_private.revisions_v1','r.method_id','r.revision'],['official_v3_method_private.heads_v1','r.method_id'],['official_v3_method_private.operations_v1','r.operation_id']]),
    fingerprint('s1', [['official_v3_intake_private.operations_v1','r.operation_id'],['official_v3_intake_private.reservations_v1','r.operation_id','r.generation'],['official_v3_intake_private.completions_v1','r.operation_id']]),
    fingerprint('jobs', [['official_v3_jobs_private.subjects_v1','r.job_key'],['official_v3_jobs_private.queue_operations_v1','r.operation_id'],['official_v3_jobs_private.execution_starts_v1','r.attempt_key'],['official_v3_jobs_private.execution_results_v1','r.attempt_key'],['official_v3_jobs_private.execution_dispositions_v1','r.attempt_key'],['official_v3_jobs_private.slots_v1','r.slot_id'],['official_v3_jobs_private.catalog_binding_v1','r.object_identity']]),
  ].join('\n')
  const wrappers=['hma','s1','jobs'].flatMap(c => ['begin','seal'].map(kind => `CREATE FUNCTION official_v3_guard_private.${kind}_${c}_v1() RETURNS void
LANGUAGE sql VOLATILE SECURITY DEFINER SET search_path=pg_catalog AS $$ SELECT official_v3_guard_private.${kind}_component_v1(${quote(c)}) $$;`)).join('\n')
  const parts=['state','catalog','history','certificates','owner','visitor','audit'].map(name => read('parts/'+name+'.sql')).join('\n')
  const extras=[originalValidator,completionValidator,fingerprints,wrappers].join('\n')
  const newFunctions=functionsIn(parts+'\n'+extras)
  const ownerOf=f => /^official_v3_guard_private\.(check_s1|check_retired_s1|fingerprint_s1|original_valid|completion_valid|recovery_intake)_v1\(/.test(f.signature) ? 'ot_v3_intake_owner'
    : /^official_v3_guard_private\.(check_jobs|check_retired_jobs|fingerprint_jobs|recovery_jobs|close_jobs)_v1\(/.test(f.signature) ? 'ot_v3_jobs_owner'
      : /^official_v3_guard_private\.(check_hrs|check_retired_hrs|hrs_certificate|recovery_hrs|ch_de_snapshot)_v1\(/.test(f.signature) ? 'ot_v3_result_owner' : 'postgres'
  const grants={
    ot_v3_result_owner:['require_open_v1','open_until_v1','current_method_v1','hrs_catalog_v1','intake_retired_v1'],
    ot_v3_jobs_owner:['begin_jobs_v1','seal_jobs_v1','jobs_catalog_v1','allowed_owner_edge_v1','attempt_retired_v1','owner_session_v1','retired_state_v1','check_method_link_v1'],
    ot_v3_intake_owner:['begin_s1_v1','seal_s1_v1','intake_retired_v1','allowed_owner_edge_v1','original_valid_v1','completion_valid_v1'],
  }
  // Complete source-hash allowlist for replacing definitions, plus unchanged
  // prerequisite bodies. The parsed SQL RETURN wrappers are independently
  // checked with their original complete HMT inventory before any baseline.
  const expectedFunctions=all.map(f =>
    `(${quote(f.signature)},${quote(sha(f.body))})`).join(',\n')
  const replacementNames=changes.map(c => quote(c.old.signature)).join(',')
  const functionMetadata = f => ({signature:f.signature,name:f.name,owner:ownerOf(f),hash:sha(f.body),
    language:/LANGUAGE\s+(\w+)/i.exec(f.options)[1].toLowerCase(),
    definer:/SECURITY DEFINER/i.test(f.options),volatile:/\bIMMUTABLE\b/.test(f.options)?'i':/\bSTABLE\b/.test(f.options)?'s':'v',
    config:[...f.options.matchAll(/SET\s+(\w+)\s*=\s*('[^']*'|[^\s]+)/gi)].map(m=>m[1]+'='+m[2].replace(/^'|'$/g,'')),
    grantees:[ownerOf(f),...(ownerOf(f)!=='postgres'?['postgres']:[]),
      ...Object.entries(grants).filter(([,names])=>names.includes(f.name.split('.')[1])).map(([role])=>role),
      ...(f.name.startsWith('public.official_v3_guard_')?['authenticated']:[]),
      ...(f.name.endsWith('.alarm_status_v1')?['supabase_read_only_user']:[])].filter((v,i,a)=>a.indexOf(v)===i).sort()})
  const declarations=newFunctions.map(functionMetadata)
  // Explicit accepted owner-dependency edges, never a schema-wide exception.
  const edgeRows=[]
  for (const f of newFunctions) {
    const owner=ownerOf(f)
    if (owner!=='postgres') edgeRows.push(`(${quote(f.signature)},${quote(owner)},'o')`)
    for (const [role,names] of Object.entries(grants)) if (names.includes(f.name.split('.')[1])) edgeRows.push(`(${quote(f.signature)},${quote(role)},'a')`)
  }
  for (const role of ['ot_v3_jobs_owner','ot_v3_intake_owner']) edgeRows.push(`('official_v3_guard_private.allowed_owner_edge_v1(oid,oid,oid,"char")',${quote(role)},'a')`)
  const allowedEdges=`CREATE FUNCTION official_v3_guard_private.allowed_owner_edge_v1(class_value oid,object_value oid,role_value oid,dependency_value "char") RETURNS boolean
LANGUAGE sql STABLE SECURITY DEFINER SET search_path=pg_catalog AS $$
SELECT (class_value='pg_namespace'::regclass AND object_value='official_v3_guard_private'::regnamespace
 AND dependency_value='a' AND role_value IN ('ot_v3_jobs_owner'::regrole,'ot_v3_intake_owner'::regrole,'ot_v3_result_owner'::regrole))
OR (class_value='pg_proc'::regclass AND EXISTS(SELECT 1 FROM (VALUES ${edgeRows.join(',')}) allowed(signature,role_name,kind)
 WHERE object_value=to_regprocedure(allowed.signature) AND role_value=to_regrole(allowed.role_name) AND dependency_value::text=allowed.kind))
$$;`
  declarations.push(functionMetadata(functionsIn(allowedEdges)[0]))
  const globalCatalog=functionsIn(read('parts/catalog.sql')).find(f=>f.name==='official_v3_guard_private.catalog_v1').body.trim()
  const hrsCatalog=get('official_v3_result_private.catalog_v1').body.trim().replace(/^BEGIN\s+RETURN\s*\(/,'').replace(/\);\s*END\s*$/,'')
  const jobsQueries=[]
  for (const match of get('official_v3_jobs_private.assert_catalog_v1').body.matchAll(/SELECT q\.value INTO actual_value FROM \(\n([\s\S]*?)\n\s*\) q;\n\s*SELECT fingerprint INTO bound_value FROM official_v3_jobs_private\.catalog_binding_v1 WHERE object_identity='([^']+)'/g)) jobsQueries.push({key:match[2],query:match[1]})
  assert.equal(jobsQueries.length,15,'all existing HM04 catalog queries')
  const jobsNow=jobsQueries.map(x=>`SELECT q.value INTO current_value FROM (${x.query}) q; result_value:=result_value||jsonb_build_object(${quote(x.key)},current_value);`).join('\n')
  const pai=source.get('profile-authority-integrity-1')
  const paiShape=/\$pai1_shape\$([\s\S]*?)\$pai1_shape\$/.exec(pai)[1]
  const paiQuery=/  SELECT pg_catalog.jsonb_build_object\(\n  'relation',[\s\S]*?\) INTO current_shape;/.exec(pai)[0]
    .replace('SELECT pg_catalog.jsonb_build_object','current_value := pg_catalog.jsonb_build_object').replace(') INTO current_shape;',');')
    .replace("WHERE t.tgrelid='public.profiles'::pg_catalog.regclass)","WHERE t.tgrelid='public.profiles'::pg_catalog.regclass AND t.tgname<>'profiles_autoritaet_integritaet_v1')")
  const paiContract= pai.slice(pai.indexOf('  SELECT p.* INTO f',pai.indexOf('  CREATE TRIGGER profiles_autoritaet_integritaet_v1')),
    pai.indexOf('\n\n  SELECT pg_catalog.jsonb_build_object',pai.indexOf('  CREATE TRIGGER profiles_autoritaet_integritaet_v1')))
  assert.ok(paiContract.includes("g.tgenabled<>'O'") && paiContract.includes('g.tgfoid<>f.oid'))
  const hmt=source.get('official-truth-v3-human-method-transport-1')
  const hmtInventory=/DO \$hmt1_exact_inventory\$[\s\S]*?\$hmt1_exact_inventory\$;/.exec(hmt)[0]
  const header=read('parts/upgrade-prefix.sql').replace('/* EXPECTED_FUNCTIONS */',expectedFunctions)
    .replace('/* GLOBAL_CATALOG */',globalCatalog).replace('/* HRS_CATALOG */',hrsCatalog).replace('/* JOBS_CATALOG */',jobsNow)
    .replace('/* HMT_PREDECESSOR */',hmtInventory)
    .replace('/* PAI_PREDECESSOR */',"PERFORM set_config('search_path','pg_catalog,public,extensions',true);\n"+paiQuery+'\n IF current_value IS DISTINCT FROM '+quote(paiShape)+"::jsonb THEN RAISE EXCEPTION 'bg1 PAI predecessor mismatch' USING ERRCODE='P7901'; END IF;\n"+paiContract+"\nPERFORM set_config('search_path','pg_catalog',true);")
    .replace('/* CONTENT_HMA */',functionsIn(fingerprints).find(f=>f.name.endsWith('fingerprint_hma_v1')).body)
    .replace('/* CONTENT_S1 */',functionsIn(fingerprints).find(f=>f.name.endsWith('fingerprint_s1_v1')).body)
    .replace('/* CONTENT_JOBS */',functionsIn(fingerprints).find(f=>f.name.endsWith('fingerprint_jobs_v1')).body)
  const metadata={ replacements:changes.map(c=>({signature:c.old.signature,hash:sha(c.body)})),functions:declarations,
    tables:[...read('parts/state.sql').matchAll(/CREATE TABLE official_v3_guard_private\.([a-z_0-9]+)/g)].map(m=>m[1]) }
  const suffix=read('parts/upgrade-suffix.sql').replaceAll('/* GLOBAL_CATALOG */',globalCatalog)
    .replaceAll('/* HRS_CATALOG */',hrsCatalog).replaceAll('/* JOBS_CATALOG */',jobsNow)
    .replace('/* APPROVED_DELTA */',quote(JSON.stringify(metadata))+'::jsonb')
    .replace('/* REPLACEMENTS */','ARRAY['+replacementNames+']::text[]')
  const ownership=newFunctions.filter(f=>ownerOf(f)!=='postgres').map(f=>`ALTER FUNCTION ${f.signature} OWNER TO ${ownerOf(f)};`).join('\n')
  const asOwner = (f, sql) => ownerOf(f)==='postgres'?sql:`SET LOCAL ROLE ${ownerOf(f)};\n${sql}\nRESET ROLE;`
  const acl=[...newFunctions,functionsIn(allowedEdges)[0]].map(f=>asOwner(f,`REVOKE ALL ON FUNCTION ${f.signature} FROM PUBLIC,anon,authenticated,service_role,supabase_read_only_user;`)).join('\n')
  const execute=Object.entries(grants).flatMap(([role,names])=>names.map(name=>{
    const f=newFunctions.find(x=>x.name==='official_v3_guard_private.'+name)
    const signature=f?.signature??(name==='allowed_owner_edge_v1'?'official_v3_guard_private.allowed_owner_edge_v1(oid,oid,oid,"char")':null)
    assert.ok(signature,name)
    const sql=`GRANT EXECUTE ON FUNCTION ${signature} TO ${role};`
    return f?asOwner(f,sql):sql
  })).concat(newFunctions.filter(f=>ownerOf(f)!=='postgres').map(f=>asOwner(f,`GRANT EXECUTE ON FUNCTION ${f.signature} TO postgres;`))).join('\n')
  const replacementDdl=changes.map(c=>`SET LOCAL ROLE ${c.owner};\n${c.sql}\nRESET ROLE;`).join('\n')
  return `-- BG1 source candidate. Additive upgrade on reviewed 4fd6dc9e; no historical installer rewrite.\n${header}\n${parts}\n${extras}\n${allowedEdges}\nGRANT USAGE,CREATE ON SCHEMA official_v3_guard_private TO ot_v3_result_owner,ot_v3_jobs_owner,ot_v3_intake_owner;\n${ownership}\n${acl}\n${execute}\n${replacementDdl}\n${suffix}\n`
}

if (process.argv[1]===fileURLToPath(import.meta.url)) {
  const output=compileCandidate(), path=new URL('upgrade-candidate.sql',here)
  if (process.argv.slice(2).length!==1 || !['--check','--write'].includes(process.argv[2])) throw Error('bg1_build_mode_required')
  if (process.argv[2]==='--write') writeFileSync(path,output)
  else assert.equal(readFileSync(path,'utf8'),output,'BG1 generated SQL matches reviewed sources')
}
