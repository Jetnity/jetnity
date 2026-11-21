// Bounded, reproducible SQL package. No connection, environment or credential access.
import assert from 'node:assert/strict'
import { createHash } from 'node:crypto'
import { readFileSync, writeFileSync } from 'node:fs'
import { fileURLToPath } from 'node:url'

export const directory = new URL('./', import.meta.url)
export const observed = JSON.parse(readFileSync(new URL('observed-production-functions.json', directory), 'utf8'))
export const original = Object.fromEntries(observed.functions.map(f => [f.signature, f.definition]))
export const digest = value => createHash('sha256').update(value).digest('hex')
for (const f of observed.functions) assert.equal(digest(f.definition), f.definition_sha256, 'captured source digest mismatch')
const catalogName = 'official_v3_guard_private.catalog_status_v1()'
const assertName = 'official_v3_guard_private.assert_catalog_v1()'
const auditName = 'official_v3_guard_private.audit_v1()'
const table = 'official_v3_guard_private.query_cost_baseline_v1'
export const target = 'production:qscbgcdmivbbnzrcyegn:BG1-QUERY-COST1'
export const literal = text => "'" + text.replaceAll("'", "''") + "'"

function once(text, before, after) {
  assert.equal(text.split(before).length, 2, 'exact predecessor shape changed')
  return text.replace(before, after)
}

export function optimizeCatalog(definition) {
  let result = once(definition,
    'FROM pg_depend d WHERE (d.classid,d.objid) IN (SELECT classid,objid FROM objects)\n      OR (d.refclassid,d.refobjid) IN (SELECT classid,objid FROM objects)',
    'FROM (SELECT DISTINCT d.classid,d.objid,d.objsubid,d.refclassid,d.refobjid,d.refobjsubid,d.deptype FROM pg_depend d\n      WHERE (d.classid,d.objid) IN (SELECT classid,objid FROM objects)\n        OR (d.refclassid,d.refobjid) IN (SELECT classid,objid FROM objects)) d')
  result = once(result,
    "FROM pg_shdepend d WHERE (d.dbid=(SELECT oid FROM pg_database WHERE datname=current_database())\n      AND (d.classid,d.objid) IN (SELECT classid,objid FROM objects))\n      OR (d.refclassid='pg_authid'::regclass AND d.refobjid IN (SELECT oid FROM protected_roles WHERE oid<>'postgres'::regrole))",
    "FROM (SELECT DISTINCT d.dbid,d.classid,d.objid,d.objsubid,d.refclassid,d.refobjid,d.deptype FROM pg_shdepend d\n      WHERE (d.dbid=(SELECT oid FROM pg_database WHERE datname=current_database())\n        AND (d.classid,d.objid) IN (SELECT classid,objid FROM objects))\n        OR (d.refclassid='pg_authid'::regclass AND d.refobjid IN (SELECT oid FROM protected_roles WHERE oid<>'postgres'::regrole))) d")
  return once(result, 'SELECT jsonb_object_agg(key,value ORDER BY key COLLATE "C") FROM entries',
    'SELECT jsonb_object_agg_unique(key,value) FROM entries')
}

const changedKeys = `ARRAY['function:'||'${catalogName}'::regprocedure::oid,'function:'||'${assertName}'::regprocedure::oid]`
export const successorClauses = `optimized.algorithm IS DISTINCT FROM 'jsonb_unique_narrow_dependency_distinct_v1'
 OR optimized.predecessor_catalog_digest IS DISTINCT FROM encode(sha256(convert_to(bg1_v3.catalog::text,'UTF8')),'hex')
 OR optimized.predecessor_baseline_digest IS DISTINCT FROM encode(sha256(convert_to((to_jsonb(bg1_v3)
   ||jsonb_build_object('proof_not_before',extract(epoch FROM bg1_v3.proof_not_before)))::text,'UTF8')),'hex')
 OR optimized.catalog IS DISTINCT FROM official_v3_guard_private.catalog_status_v1()`

export function extendAssertion(definition) {
  let result = once(definition, 'DECLARE bg1_v3 ', `DECLARE optimized ${table}%ROWTYPE;\n bg1_v3 `)
  result = once(result, 'BEGIN\n  SELECT * INTO STRICT bg1_v3',
    `BEGIN\n  SELECT * INTO STRICT optimized FROM ${table} WHERE singleton;\n  SELECT * INTO STRICT bg1_v3`)
  return once(result, 'bg1_v3.catalog IS DISTINCT FROM official_v3_guard_private.catalog_status_v1()', successorClauses)
}

export const optimized = {
  [catalogName]: optimizeCatalog(original[catalogName]),
  [assertName]: extendAssertion(original[assertName]),
}

const oldPins = [catalogName, assertName, auditName].map(name => [name, digest(original[name])])
const newPins = [catalogName, assertName, auditName].map(name => [name, digest(optimized[name] ?? original[name])])

function checkPins(pins) {
  return `FOR f IN SELECT * FROM (VALUES ${pins.map(([n,d]) => '(' + literal(n) + ',' + literal(d) + ')').join(',\n')}) expected(signature,digest) LOOP
    IF encode(sha256(convert_to(pg_get_functiondef(to_regprocedure(f.signature)),'UTF8')),'hex') IS DISTINCT FROM f.digest
      OR (SELECT p.proowner<>'postgres'::regrole OR NOT p.prosecdef
        OR p.proacl IS DISTINCT FROM ARRAY['postgres=X/postgres']::aclitem[]
        FROM pg_proc p WHERE p.oid=to_regprocedure(f.signature)) IS DISTINCT FROM false THEN
      RAISE EXCEPTION 'query-cost exact routine predecessor changed: %',f.signature USING ERRCODE='P7992';
    END IF;
  END LOOP;`
}

const context = `IF session_user<>'postgres' OR current_user<>'postgres' OR current_database()<>'postgres'
    OR current_setting('server_version_num')::integer NOT BETWEEN 170000 AND 179999
    OR current_setting('transaction_isolation')<>'read committed'
    OR current_setting('jetnity.bg1_query_cost_target',true) IS DISTINCT FROM ${literal(target)} THEN
    RAISE EXCEPTION 'query-cost fixed target and PG17 Creator context required' USING ERRCODE='P7992';
  END IF;
  PERFORM pg_advisory_xact_lock(771106,1);
  PERFORM 1 FROM official_v3_guard_private.state_v1 WHERE singleton FOR UPDATE;
  IF NOT FOUND THEN RAISE EXCEPTION 'query-cost missing guard state' USING ERRCODE='P7992'; END IF;
  LOCK TABLE official_v3_guard_private.baselines_v1, official_v3_guard_private.status_baseline_v1,
    official_v3_guard_private.rolling_quota_baseline_v1, official_v3_guard_private.admin_runtime_baseline_v1,
    official_v3_guard_private.saved_offers_baseline_v1, official_v3_guard_private.weather_quota_baseline_v1,
    official_v3_guard_private.at_source_monitor_baseline_v1, official_v3_guard_private.at_batch_switch_baseline_v2,
    official_v3_guard_private.bg1_transient_baseline_v3 IN SHARE MODE;`

const snapshot = `(SELECT jsonb_build_object(
  'base',(SELECT jsonb_agg(to_jsonb(v) ORDER BY component COLLATE "C") FROM official_v3_guard_private.baselines_v1 v),
  'status',(SELECT to_jsonb(v) FROM official_v3_guard_private.status_baseline_v1 v WHERE singleton),
  'rolling',(SELECT to_jsonb(v) FROM official_v3_guard_private.rolling_quota_baseline_v1 v WHERE singleton),
  'admin',(SELECT to_jsonb(v) FROM official_v3_guard_private.admin_runtime_baseline_v1 v WHERE singleton),
  'offers',(SELECT to_jsonb(v) FROM official_v3_guard_private.saved_offers_baseline_v1 v WHERE singleton),
  'weather',(SELECT to_jsonb(v) FROM official_v3_guard_private.weather_quota_baseline_v1 v WHERE singleton),
  'at',(SELECT to_jsonb(v) FROM official_v3_guard_private.at_source_monitor_baseline_v1 v WHERE singleton),
  'switch',(SELECT to_jsonb(v) FROM official_v3_guard_private.at_batch_switch_baseline_v2 v WHERE singleton),
  'v3',(SELECT to_jsonb(v) FROM official_v3_guard_private.bg1_transient_baseline_v3 v WHERE singleton),
  'state',(SELECT to_jsonb(v) FROM official_v3_guard_private.state_v1 v WHERE singleton)))`

// Every allowed added entry belongs to a newly created object. Existing keys
// are compared separately; this predicate cannot hide changes to predecessors.
const additions = `WITH new_classes AS (
    SELECT c.oid FROM pg_class c WHERE c.oid=table_oid OR c.oid=(SELECT reltoastrelid FROM pg_class WHERE oid=table_oid)
    UNION SELECT i.indexrelid FROM pg_index i WHERE i.indrelid=table_oid
      OR i.indrelid=(SELECT reltoastrelid FROM pg_class WHERE oid=table_oid)
  ), new_row_types AS (
    SELECT c.reltype AS oid FROM pg_class c WHERE c.oid IN(SELECT oid FROM new_classes) AND c.reltype<>0
  ), new_types AS (
    SELECT oid FROM new_row_types UNION SELECT t.typarray FROM pg_type t WHERE t.oid IN(SELECT oid FROM new_row_types) AND t.typarray<>0
  ), new_objects(classid,objid) AS (
    SELECT 'pg_class'::regclass::oid,oid FROM new_classes
    UNION SELECT 'pg_type'::regclass,oid FROM new_types
    UNION SELECT 'pg_constraint'::regclass,oid FROM pg_constraint WHERE conrelid=table_oid
    UNION SELECT 'pg_trigger'::regclass,oid FROM pg_trigger WHERE tgrelid=table_oid
    UNION SELECT 'pg_policy'::regclass,oid FROM pg_policy WHERE polrelid=table_oid
    UNION SELECT 'pg_attrdef'::regclass,oid FROM pg_attrdef WHERE adrelid=table_oid
  )
  SELECT coalesce(array_agg(e.key),'{}'::text[]) INTO added_keys FROM jsonb_each(after_catalog) e
  WHERE NOT before_catalog ? e.key AND CASE split_part(e.key,':',1)
    WHEN 'relation' THEN (e.value->>'oid')::oid IN(SELECT oid FROM new_classes)
    WHEN 'attribute' THEN (e.value->>'attrelid')::oid IN(SELECT oid FROM new_classes)
    WHEN 'type' THEN (e.value->>'oid')::oid IN(SELECT oid FROM new_types)
    WHEN 'constraint' THEN (e.value->>'conrelid')::oid=table_oid
    WHEN 'trigger' THEN (e.value->>'tgrelid')::oid=table_oid
    WHEN 'policy' THEN (e.value->>'polrelid')::oid=table_oid
    WHEN 'default' THEN (e.value->>'adrelid')::oid=table_oid
    WHEN 'index' THEN (e.value->>'indexrelid')::oid IN(SELECT oid FROM new_classes)
    WHEN 'dependency' THEN ((e.value->>'classid')::oid,(e.value->>'objid')::oid) IN(SELECT * FROM new_objects)
    WHEN 'shared' THEN ((e.value->>'classid')::oid,(e.value->>'objid')::oid) IN(SELECT * FROM new_objects)
    ELSE false END;`

const header = `-- Generated by build.mjs. Owner-authorized bounded BG1 query optimization.
-- No state/freshness/incident/cron/Auth/role setting changes. No automatic migration.
`
const transactionStart = `BEGIN READ ONLY;
SET LOCAL statement_timeout='25s';
SET LOCAL lock_timeout='3s';
SET LOCAL search_path=pg_catalog;
SET LOCAL jit=off;
`
const installBody = `SET LOCAL statement_timeout='25s';
SET LOCAL lock_timeout='3s';
SET LOCAL search_path=pg_catalog;
SET LOCAL jit=off;
DO $install$
DECLARE f record; before_catalog jsonb; after_catalog jsonb; before_rows jsonb; table_oid oid;
  changed_keys text[]; added_keys text[]; normalized jsonb; old_row jsonb; old_catalog jsonb;
BEGIN
  ${context}
  IF to_regclass('${table}') IS NOT NULL THEN
    RAISE EXCEPTION 'query-cost successor already exists' USING ERRCODE='P7992'; END IF;
  ${checkPins(oldPins)}
  -- Must succeed BEFORE any DDL: no silent adoption of existing protected drift.
  PERFORM official_v3_guard_private.assert_catalog_v1();
  before_catalog:=official_v3_guard_private.catalog_status_v1();
  before_rows:=${snapshot};
  SELECT catalog,to_jsonb(v)||jsonb_build_object('proof_not_before',extract(epoch FROM v.proof_not_before))
    INTO STRICT old_catalog,old_row FROM official_v3_guard_private.bg1_transient_baseline_v3 v WHERE singleton;
  IF before_catalog IS DISTINCT FROM old_catalog THEN
    RAISE EXCEPTION 'query-cost predecessor changed during preflight' USING ERRCODE='P7992'; END IF;

  CREATE TABLE official_v3_guard_private.query_cost_baseline_v1(
    singleton boolean PRIMARY KEY DEFAULT true CHECK(singleton),
    algorithm text NOT NULL CHECK(algorithm='jsonb_unique_narrow_dependency_distinct_v1'),
    predecessor_catalog_digest text NOT NULL CHECK(predecessor_catalog_digest ~ '^[a-f0-9]{64}$'),
    predecessor_baseline_digest text NOT NULL CHECK(predecessor_baseline_digest ~ '^[a-f0-9]{64}$'),
    catalog jsonb NOT NULL
  );
  ALTER TABLE official_v3_guard_private.query_cost_baseline_v1 ENABLE ROW LEVEL SECURITY;
  ALTER TABLE official_v3_guard_private.query_cost_baseline_v1 FORCE ROW LEVEL SECURITY;
  CREATE POLICY postgres_only ON official_v3_guard_private.query_cost_baseline_v1 TO postgres USING(true) WITH CHECK(true);
  CREATE TRIGGER immutable_rows BEFORE UPDATE OR DELETE ON official_v3_guard_private.query_cost_baseline_v1
    FOR EACH ROW EXECUTE FUNCTION official_v3_guard_private.immutable_v1();
  CREATE TRIGGER immutable_truncate BEFORE TRUNCATE ON official_v3_guard_private.query_cost_baseline_v1
    FOR EACH STATEMENT EXECUTE FUNCTION official_v3_guard_private.immutable_v1();
  REVOKE ALL ON official_v3_guard_private.query_cost_baseline_v1 FROM PUBLIC,anon,authenticated,service_role,supabase_read_only_user;
  IF (SELECT c.relowner='postgres'::regrole AND c.relrowsecurity AND c.relforcerowsecurity
      AND coalesce(c.relacl,acldefault('r',c.relowner))=acldefault('r','postgres'::regrole)
      FROM pg_class c WHERE c.oid='official_v3_guard_private.query_cost_baseline_v1'::regclass) IS DISTINCT FROM true THEN
    RAISE EXCEPTION 'query-cost successor owner-only privileges required' USING ERRCODE='P7992'; END IF;
  EXECUTE $catalog_definition$${optimized[catalogName]}$catalog_definition$;
  EXECUTE $assert_definition$${optimized[assertName]}$assert_definition$;
  ${checkPins(newPins)}
  table_oid:='${table}'::regclass;
  changed_keys:=${changedKeys};
  after_catalog:=official_v3_guard_private.catalog_status_v1();
  ${additions}
  -- Existing metadata may change only in the definition field of these two
  -- exact functions. Every other existing entry must remain byte-equivalent JSONB.
  normalized:=after_catalog-added_keys;
  FOR f IN SELECT unnest(changed_keys) AS key LOOP
    IF (after_catalog->f.key)-'definition' IS DISTINCT FROM (before_catalog->f.key)-'definition' THEN
      RAISE EXCEPTION 'query-cost changed function metadata' USING ERRCODE='P7992'; END IF;
    normalized:=jsonb_set(normalized,ARRAY[f.key],before_catalog->f.key,false);
  END LOOP;
  IF normalized IS DISTINCT FROM before_catalog OR before_rows IS DISTINCT FROM ${snapshot} THEN
    RAISE EXCEPTION 'query-cost unexpected catalog or predecessor-row delta' USING ERRCODE='P7992'; END IF;
  INSERT INTO official_v3_guard_private.query_cost_baseline_v1 VALUES(true,'jsonb_unique_narrow_dependency_distinct_v1',
    encode(sha256(convert_to(old_catalog::text,'UTF8')),'hex'),
    encode(sha256(convert_to(old_row::text,'UTF8')),'hex'),after_catalog);
  PERFORM official_v3_guard_private.assert_catalog_v1();
  IF before_rows IS DISTINCT FROM ${snapshot} THEN
    RAISE EXCEPTION 'query-cost protected rows changed' USING ERRCODE='P7992'; END IF;
END $install$;
`

const rollbackBody = `SET LOCAL statement_timeout='25s';
SET LOCAL lock_timeout='3s';
SET LOCAL search_path=pg_catalog;
SET LOCAL jit=off;
DO $rollback$
DECLARE f record; before_rows jsonb; old_catalog jsonb;
BEGIN
  ${context}
  ${checkPins(newPins)}
  PERFORM official_v3_guard_private.assert_catalog_v1();
  before_rows:=${snapshot};
  SELECT catalog INTO STRICT old_catalog FROM official_v3_guard_private.bg1_transient_baseline_v3 WHERE singleton;
  EXECUTE $catalog_definition$${original[catalogName]}$catalog_definition$;
  EXECUTE $assert_definition$${original[assertName]}$assert_definition$;
  DROP TABLE official_v3_guard_private.query_cost_baseline_v1 RESTRICT;
  ${checkPins(oldPins)}
  PERFORM official_v3_guard_private.assert_catalog_v1();
  IF official_v3_guard_private.catalog_status_v1() IS DISTINCT FROM old_catalog
    OR before_rows IS DISTINCT FROM ${snapshot} THEN
    RAISE EXCEPTION 'query-cost rollback did not restore exact predecessor' USING ERRCODE='P7992'; END IF;
END $rollback$;
`

export function compileArtifacts() {
  const install = header + 'BEGIN;\n' + installBody + 'COMMIT;\n'
  const rollback = header + 'BEGIN;\n' + rollbackBody + 'COMMIT;\n'
  return new Map([
    ['install.sql',install], ['provider-migration-body.sql',header+installBody],
    ['rollback.sql',rollback], ['rollback-provider-body.sql',header+rollbackBody],
    ['readback.sql',header+transactionStart+`SELECT official_v3_guard_private.assert_catalog_v1();
SELECT algorithm, predecessor_catalog_digest, predecessor_baseline_digest,
  encode(sha256(convert_to(catalog::text,'UTF8')),'hex') AS catalog_digest
FROM ${table} WHERE singleton;
SELECT p.oid::regprocedure::text AS signature,
  encode(sha256(convert_to(pg_get_functiondef(p.oid),'UTF8')),'hex') AS definition_sha256,
  p.proowner::regrole::text AS owner,p.prosecdef,p.proacl::text
FROM pg_proc p WHERE p.oid IN('${catalogName}'::regprocedure,'${assertName}'::regprocedure,'${auditName}'::regprocedure);
ROLLBACK;\n`],
  ])
}

if (process.argv[1] === fileURLToPath(import.meta.url)) {
  for (const [name,content] of compileArtifacts()) writeFileSync(new URL(name,directory),content)
}
