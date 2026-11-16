// Exact, one-cycle Dev successor. Compilation has no database or network effect.
import assert from 'node:assert/strict'
import { createHash } from 'node:crypto'
import { readFileSync, writeFileSync } from 'node:fs'
import { pathToFileURL } from 'node:url'

const hash = value => createHash('sha256').update(value).digest('hex')
const literal = value => "'" + value.replaceAll("'", "''") + "'"
const read = relative => readFileSync(new URL(relative, import.meta.url), 'utf8')
export const REVIEW = Object.freeze({
  target: 'dev:yfvbxvijcorffwxbxahl:terminal-cycle2-v1',
  ack: 'full-ci-ready-preview-and-normal-ui-verified-cycle2-v1',
  subject: 'research-job:v3:74713fe665cab1a7603f6e93ab06b6a1d1964e83a69571b8cced0ff009032513',
  job: 'job3_c8654463b7bdf52342887764ac1d1b40',
  terminal: 'op3_5a9ada0e40b2af467fd7e34cc51cb323',
  queueFix: '4205b79b1a22c80823a4965cf911445213e3f99b8daae6365a710a4748a24f3d',
  compositionFix: '667316468efe2328ae41493537462a7ff4bd571da43fe219bdf738a63dd47b89',
})

// PostgreSQL JSONB's textual key order. The native test independently hashes
// the actual PG17 value; this serializer is only a deterministic build input.
function pgJson(value) {
  if (Array.isArray(value)) return '[' + value.map(pgJson).join(', ') + ']'
  if (value && typeof value === 'object') return '{' + Object.keys(value)
    .sort((a, b) => Buffer.byteLength(a) - Buffer.byteLength(b) || Buffer.compare(Buffer.from(a), Buffer.from(b)))
    .map(key => JSON.stringify(key) + ': ' + pgJson(value[key])).join(', ') + '}'
  return JSON.stringify(value)
}
export const originalEvidence = JSON.parse(read('./original-evidence.json'))
export const evidenceQuery = `(SELECT jsonb_build_object(
 'cycle',(SELECT to_jsonb(c)||jsonb_build_object(
   'created_at',to_char(c.created_at AT TIME ZONE 'UTC','YYYY-MM-DD"T"HH24:MI:SS.US"Z"'),
   'finished_at',to_char(c.finished_at AT TIME ZONE 'UTC','YYYY-MM-DD"T"HH24:MI:SS.US"Z"'))
   FROM jetnity_dev_import_scheduler.cycles_v1 c WHERE c.id=2),
 'dispatches',(SELECT jsonb_agg(to_jsonb(d)||jsonb_build_object(
   'dispatched_at',to_char(d.dispatched_at AT TIME ZONE 'UTC','YYYY-MM-DD"T"HH24:MI:SS.US"Z"'),
   'processed_at',to_char(d.processed_at AT TIME ZONE 'UTC','YYYY-MM-DD"T"HH24:MI:SS.US"Z"')) ORDER BY d.id)
   FROM jetnity_dev_import_scheduler.dispatches_v1 d WHERE d.cycle_id=2),
 'terminal_operation',(SELECT to_jsonb(q)||jsonb_build_object(
   'recorded_at',to_char(q.recorded_at AT TIME ZONE 'UTC','YYYY-MM-DD"T"HH24:MI:SS.US"Z"'))
   FROM official_v3_jobs_private.queue_operations_v1 q WHERE q.operation_id='${REVIEW.terminal}')))`
const evidenceHashExpression = `encode(sha256(convert_to((${evidenceQuery})::text,'UTF8')),'hex')`
const allChecks = `
  PERFORM official_v3_guard_private.require_open_v1();
  PERFORM official_v3_guard_private.check_control_v1();
  PERFORM official_v3_guard_private.assert_catalog_v1();
  PERFORM official_v3_guard_private.check_hma_v1();
  PERFORM official_v3_guard_private.check_s1_v1();
  PERFORM official_v3_guard_private.check_jobs_v1();
  PERFORM official_v3_guard_private.check_hrs_v1();
  PERFORM official_v3_guard_private.check_certificates_v1();
  PERFORM official_v3_guard_private.check_retirements_v1();`
const runtimeSessions = `EXISTS(SELECT 1 FROM pg_stat_activity WHERE pid<>pg_backend_pid()
  AND usename IN ('ot_v3_method_transport_login','ot_v3_intake_transport_login','ot_v3_jobs_transport_login',
    'ot_v3_result_writer','ot_v3_result_reader','ot_v3_result_verifier'))`

export function compileDevTerminalReview() {
  // This exact review was applied on 1c6915bf. Preserve its original runtime
  // evidence even when a separately reviewed successor changes current source.
  // Never rewrite the already applied SQL, proof hashes or historical receipt.
  const runtime = JSON.parse(read('./reviewed-runtime-1c6915bf/manifest.json'))
  assert.equal(runtime.commit, '1c6915bf0ed661a8b57c5fb3a43c9b71b559a90a')
  assert.equal(runtime.tree, '9467287fbe9c5fd00b3b2fc6a218eb46a22e0a4f')
  assert.equal(runtime.ciRun, 43663530549)
  assert.equal(runtime.appliedReviewAt, '2026-11-15T02:11:51.736081Z')
  assert.deepEqual(runtime.pins, [
    { path: 'lib/readiness/official-truth-product-v3/monitor/queue.ts', archive: 'queue.ts.txt', bytes: 22643, sha256: REVIEW.queueFix },
    { path: 'lib/readiness/official-truth-product-v3/jobs/composition.ts', archive: 'composition.ts.txt', bytes: 29022, sha256: REVIEW.compositionFix },
  ])
  for (const pin of runtime.pins) {
    const source = read('./reviewed-runtime-1c6915bf/' + pin.archive)
    assert.equal(Buffer.byteLength(source), pin.bytes)
    assert.equal(hash(source), pin.sha256, 'exact independently reviewed predecessor runtime required')
  }
  assert.equal(originalEvidence.cycle.id, 2)
  assert.equal(originalEvidence.cycle.state, 'blocked'); assert.equal(originalEvidence.cycle.last_status, 'exhausted')
  assert.equal(originalEvidence.dispatches.length, 8)
  assert.equal(originalEvidence.dispatches.at(-1).id, 12)
  assert.equal(originalEvidence.dispatches.at(-1).outcome, 'exhausted')
  assert.equal(hash(originalEvidence.terminal_operation.command_text), 'd8d9a3c3f78da3a13029851abf7a40e464da6f060eb095770506791544a6764c')
  assert.equal(hash(originalEvidence.terminal_operation.envelope_text), '1d8b073aa5819dcf76bd463a104f78c66eae59b8dc63593cc2fdc8796dce182b')
  const evidenceHash = hash(pgJson(originalEvidence))
  const oldCore = read('../official-truth-v3-dev-import-schedule-1/core.sql')
  const oldBody = /AS \$tick\$([\s\S]*?)\$tick\$;/.exec(oldCore)?.[1]; assert.ok(oldBody)
  const oldClause = "IF EXISTS(SELECT 1 FROM jetnity_dev_import_scheduler.cycles_v1 WHERE state='blocked') THEN"
  assert.equal(oldBody.split(oldClause).length, 2)
  const newClause = `IF EXISTS(SELECT 1 FROM jetnity_dev_import_scheduler.cycles_v1 blocked WHERE blocked.state='blocked'
      AND NOT EXISTS(SELECT 1 FROM jetnity_dev_import_scheduler.terminal_cycle2_review_v1 reviewed
        WHERE reviewed.cycle_id=blocked.id AND reviewed.evidence_digest=${literal(evidenceHash)}
          AND reviewed.evidence_digest=${evidenceHashExpression})) THEN`
  const newBody = oldBody.replace(oldClause, newClause)
  const oldHash = hash(oldBody), newHash = hash(newBody)
  const migration = `-- Generated exact Dev Cycle2 terminal review; no source/audit/tick/HTTP effect.
-- Runtime/CI/Ready/UI facts below are an operator declaration, not a DB proof
-- of a remote deployment. Original scheduler and protected rows stay unchanged.
BEGIN;
SET LOCAL search_path=pg_catalog;
SET LOCAL timezone='UTC';
SET LOCAL datestyle='ISO, YMD';
SET LOCAL statement_timeout='30s';
SET LOCAL lock_timeout='2s';
CREATE TEMP TABLE cycle2_review_before(kind text PRIMARY KEY,value jsonb NOT NULL) ON COMMIT DROP;
DO $preflight$
DECLARE s official_v3_jobs_private.subjects_v1%ROWTYPE; p pg_proc%ROWTYPE; t record; rows_digest text; quota jsonb;
BEGIN
  IF session_user<>'postgres' OR current_user<>'postgres' OR current_database()<>'postgres'
    OR current_setting('server_version_num')::integer/10000<>17
    OR current_setting('jetnity.dev_terminal_review_target',true) IS DISTINCT FROM '${REVIEW.target}'
    OR current_setting('jetnity.dev_terminal_review_ack',true) IS DISTINCT FROM '${REVIEW.ack}'
    OR (current_setting('jetnity.dev_terminal_review_commit',true) ~ '^[a-f0-9]{40}$') IS NOT TRUE
    OR (current_setting('jetnity.dev_terminal_review_deployment',true) ~ '^dpl_[A-Za-z0-9]{20,64}$') IS NOT TRUE
    OR (current_setting('jetnity.dev_terminal_review_ci_run',true) ~ '^[1-9][0-9]{0,17}$') IS NOT TRUE
    OR (current_setting('jetnity.dev_terminal_review_ui_version',true) ~ '^([5-9]|[1-9][0-9]{1,8})$') IS NOT TRUE THEN
    RAISE EXCEPTION 'exact Dev Cycle2 operator declaration required';
  END IF;
  PERFORM pg_advisory_xact_lock(771106,31);
  IF to_regclass('jetnity_dev_import_scheduler.terminal_cycle2_review_v1') IS NOT NULL THEN
    RAISE EXCEPTION 'review already present; confirm original readback, never replace';
  END IF;
  SELECT * INTO STRICT p FROM pg_proc WHERE oid='jetnity_dev_import_scheduler.tick_v1()'::regprocedure;
  IF encode(sha256(convert_to(p.prosrc,'UTF8')),'hex')<>${literal(oldHash)} OR p.proowner<>'postgres'::regrole
    OR p.prosecdef OR p.pronargs<>0 OR p.prorettype<>'text'::regtype
    OR p.proconfig IS DISTINCT FROM ARRAY['search_path=pg_catalog','statement_timeout=10s','lock_timeout=2s']::text[] THEN
    RAISE EXCEPTION 'exact unchanged Dev sender predecessor required';
  END IF;
  INSERT INTO pg_temp.cycle2_review_before VALUES('tick_metadata',to_jsonb(p)-'prosrc');
  -- Same sender lock/state row, then BG1's existing common write lock BEFORE
  -- any guard row lock, as in audit_v1/begin_component_v1. The genuine checks
  -- below acquire the protected SHARE table locks under their existing owners.
  PERFORM 1 FROM jetnity_dev_import_scheduler.state_v1 WHERE singleton FOR UPDATE;
  IF NOT FOUND THEN RAISE EXCEPTION 'Dev sender state missing'; END IF;
  PERFORM pg_advisory_xact_lock(771106,1);
  PERFORM official_v3_guard_private.require_open_v1();
  IF ${runtimeSessions} THEN RAISE EXCEPTION 'technical runtime session remains'; END IF;
  LOCK TABLE jetnity_dev_import_scheduler.state_v1,jetnity_dev_import_scheduler.cycles_v1,
    jetnity_dev_import_scheduler.dispatches_v1,jetnity_dev_import_scheduler.preview_access_v1,
    jetnity_dev_import_scheduler.preview_dispatches_v1 IN SHARE MODE;
  IF EXISTS(SELECT 1 FROM jetnity_dev_import_scheduler.cycles_v1 WHERE state='active' OR (state='blocked' AND id<>2))
    OR EXISTS(SELECT 1 FROM jetnity_dev_import_scheduler.dispatches_v1 WHERE processed_at IS NULL)
    OR EXISTS(SELECT 1 FROM jetnity_dev_import_scheduler.preview_dispatches_v1 WHERE processed_at IS NULL) THEN
    RAISE EXCEPTION 'unreviewed scheduler work remains';
  END IF;
  IF ${evidenceHashExpression} IS DISTINCT FROM ${literal(evidenceHash)} THEN
    RAISE EXCEPTION 'original Cycle2 signed exhausted evidence differs';
  END IF;
  SELECT * INTO STRICT s FROM official_v3_jobs_private.subjects_v1 WHERE job_key='${REVIEW.subject}';
  IF s.open_attempt IS NOT NULL OR s.terminal_credit_claim IS NOT NULL
    OR s.current_job->'lease' IS DISTINCT FROM 'null'::jsonb
    OR s.current_job->>'state' NOT IN ('succeeded','exhausted')
    OR (s.current_job->>'revision')::integer<25
    OR EXISTS(SELECT 1 FROM official_v3_jobs_private.execution_starts_v1 WHERE leased_job->>'jobId'='${REVIEW.job}') THEN
    RAISE EXCEPTION 'original job or current subject has unresolved custody';
  END IF;
  ${allChecks}
  quota:=official_v3_guard_private.ch_de_quota_v2();
  IF quota->>'model' IS DISTINCT FROM 'rolling_24h_v2' OR quota->'clock_ok' IS DISTINCT FROM 'true'::jsonb THEN
    RAISE EXCEPTION 'genuine current rolling quota required';
  END IF;
  INSERT INTO pg_temp.cycle2_review_before VALUES('quota',quota-'observed_at'-'window_start');
  INSERT INTO pg_temp.cycle2_review_before VALUES('protected_catalog',official_v3_guard_private.catalog_status_v1());
  INSERT INTO pg_temp.cycle2_review_before VALUES('roles',(SELECT jsonb_agg(to_jsonb(r) ORDER BY r.oid) FROM pg_roles r));
  FOR t IN SELECT n.nspname,c.relname FROM pg_class c JOIN pg_namespace n ON n.oid=c.relnamespace
    WHERE c.relkind IN ('r','p') AND n.nspname IN ('jetnity_dev_import_scheduler','official_v3_guard_private',
      'official_v3_method_private','official_v3_intake_private','official_v3_jobs_private','official_v3_result_private')
    ORDER BY n.nspname,c.relname LOOP
    EXECUTE format('LOCK TABLE %I.%I IN ACCESS SHARE MODE',t.nspname,t.relname);
    EXECUTE format('SELECT encode(sha256(convert_to(coalesce(jsonb_agg(to_jsonb(r) ORDER BY to_jsonb(r)::text COLLATE "C"),''[]''::jsonb)::text,''UTF8'')),''hex'') FROM %I.%I r',t.nspname,t.relname) INTO rows_digest;
    INSERT INTO pg_temp.cycle2_review_before VALUES('rows:'||t.nspname||'.'||t.relname,to_jsonb(rows_digest));
  END LOOP;
END $preflight$;

CREATE TABLE jetnity_dev_import_scheduler.terminal_cycle2_review_v1(
  cycle_id bigint PRIMARY KEY CHECK(cycle_id=2) REFERENCES jetnity_dev_import_scheduler.cycles_v1(id),
  evidence_digest text NOT NULL CHECK(evidence_digest=${literal(evidenceHash)}),
  queue_fix_sha256 text NOT NULL CHECK(queue_fix_sha256='${REVIEW.queueFix}'),
  composition_fix_sha256 text NOT NULL CHECK(composition_fix_sha256='${REVIEW.compositionFix}'),
  runtime_commit text NOT NULL CHECK(runtime_commit ~ '^[a-f0-9]{40}$'),
  ready_deployment text NOT NULL CHECK(ready_deployment ~ '^dpl_[A-Za-z0-9]{20,64}$'),
  ci_run bigint NOT NULL CHECK(ci_run>0), ui_version integer NOT NULL CHECK(ui_version>=5),
  reviewed_at timestamptz NOT NULL CHECK(isfinite(reviewed_at)),
  reviewed_head jsonb NOT NULL
);
ALTER TABLE jetnity_dev_import_scheduler.terminal_cycle2_review_v1 ENABLE ROW LEVEL SECURITY;
REVOKE ALL ON jetnity_dev_import_scheduler.terminal_cycle2_review_v1 FROM PUBLIC,anon,authenticated,service_role,supabase_read_only_user;
CREATE FUNCTION jetnity_dev_import_scheduler.immutable_terminal_cycle2_review_v1() RETURNS trigger
LANGUAGE plpgsql SECURITY INVOKER SET search_path=pg_catalog AS $immutable$
BEGIN RAISE EXCEPTION 'the original Cycle2 review is immutable'; END $immutable$;
REVOKE ALL ON FUNCTION jetnity_dev_import_scheduler.immutable_terminal_cycle2_review_v1() FROM PUBLIC,anon,authenticated,service_role,supabase_read_only_user;
CREATE TRIGGER immutable_row BEFORE UPDATE OR DELETE ON jetnity_dev_import_scheduler.terminal_cycle2_review_v1
FOR EACH ROW EXECUTE FUNCTION jetnity_dev_import_scheduler.immutable_terminal_cycle2_review_v1();
CREATE TRIGGER immutable_truncate BEFORE TRUNCATE ON jetnity_dev_import_scheduler.terminal_cycle2_review_v1
FOR EACH STATEMENT EXECUTE FUNCTION jetnity_dev_import_scheduler.immutable_terminal_cycle2_review_v1();
INSERT INTO jetnity_dev_import_scheduler.terminal_cycle2_review_v1
SELECT 2,${literal(evidenceHash)},'${REVIEW.queueFix}','${REVIEW.compositionFix}',
  current_setting('jetnity.dev_terminal_review_commit'),current_setting('jetnity.dev_terminal_review_deployment'),
  current_setting('jetnity.dev_terminal_review_ci_run')::bigint,current_setting('jetnity.dev_terminal_review_ui_version')::integer,
  clock_timestamp(),current_job FROM official_v3_jobs_private.subjects_v1 WHERE job_key='${REVIEW.subject}';

-- Exactly one predicate is replaced. All requests, quotas, periods and normal
-- admission/source/publication checks in the installed sender remain intact.
CREATE OR REPLACE FUNCTION jetnity_dev_import_scheduler.tick_v1() RETURNS text
LANGUAGE plpgsql SECURITY INVOKER SET search_path=pg_catalog SET statement_timeout='10s' SET lock_timeout='2s'
AS $tick$${newBody}$tick$;

DO $postcheck$
DECLARE t record; rows_digest text; schema_name text; table_name text; p pg_proc%ROWTYPE;
BEGIN
  ${allChecks}
  IF ${runtimeSessions} THEN RAISE EXCEPTION 'technical runtime session appeared during review'; END IF;
  SELECT * INTO STRICT p FROM pg_proc WHERE oid='jetnity_dev_import_scheduler.tick_v1()'::regprocedure;
  IF encode(sha256(convert_to(p.prosrc,'UTF8')),'hex')<>${literal(newHash)}
    OR (to_jsonb(p)-'prosrc') IS DISTINCT FROM (SELECT value FROM pg_temp.cycle2_review_before WHERE kind='tick_metadata')
    OR official_v3_guard_private.catalog_status_v1() IS DISTINCT FROM (SELECT value FROM pg_temp.cycle2_review_before WHERE kind='protected_catalog')
    OR (SELECT jsonb_agg(to_jsonb(r) ORDER BY r.oid) FROM pg_roles r) IS DISTINCT FROM (SELECT value FROM pg_temp.cycle2_review_before WHERE kind='roles')
    OR (official_v3_guard_private.ch_de_quota_v2()-'observed_at'-'window_start') IS DISTINCT FROM (SELECT value FROM pg_temp.cycle2_review_before WHERE kind='quota') THEN
    RAISE EXCEPTION 'review changed a protected catalog, quota or sender attribute';
  END IF;
  FOR t IN SELECT kind,value FROM pg_temp.cycle2_review_before WHERE kind LIKE 'rows:%' LOOP
    schema_name:=split_part(substring(t.kind from 6),'.',1); table_name:=split_part(substring(t.kind from 6),'.',2);
    EXECUTE format('SELECT encode(sha256(convert_to(coalesce(jsonb_agg(to_jsonb(r) ORDER BY to_jsonb(r)::text COLLATE "C"),''[]''::jsonb)::text,''UTF8'')),''hex'') FROM %I.%I r',schema_name,table_name) INTO rows_digest;
    IF to_jsonb(rows_digest) IS DISTINCT FROM t.value THEN RAISE EXCEPTION 'review changed old rows: %',t.kind; END IF;
  END LOOP;
  IF (SELECT count(*) FROM jetnity_dev_import_scheduler.terminal_cycle2_review_v1)<>1
    OR ${evidenceHashExpression} IS DISTINCT FROM ${literal(evidenceHash)} THEN
    RAISE EXCEPTION 'original terminal review readback differs';
  END IF;
END $postcheck$;
COMMIT;
`
  return Object.freeze({ migration, oldHash, newHash, evidenceHash })
}

if (process.argv[1] && import.meta.url === pathToFileURL(process.argv[1]).href) {
  assert.equal(process.argv.length, 2, 'no target or source override')
  const compiled = compileDevTerminalReview()
  writeFileSync(new URL('./review-cycle2.sql', import.meta.url), compiled.migration)
  process.stdout.write(JSON.stringify({ oldBody: compiled.oldHash, newBody: compiled.newHash, originalEvidence: compiled.evidenceHash }) + '\n')
}
