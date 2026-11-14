SET LOCAL search_path=pg_catalog;
SET LOCAL statement_timeout='30s';
SET LOCAL lock_timeout='5s';
SET LOCAL idle_in_transaction_session_timeout='30s';
SET LOCAL timezone='UTC';
SET LOCAL datestyle='ISO, YMD';

DO $context$
BEGIN
  IF current_user<>'postgres' OR session_user<>current_user OR current_database()<>'postgres'
    OR current_setting('server_version_num')::integer/10000<>17
    OR current_setting('transaction_isolation') IS DISTINCT FROM 'read committed'
    OR current_setting('jetnity.bg1_target',true) IS DISTINCT FROM 'dev:yfvbxvijcorffwxbxahl:BG1'
    OR current_setting('createrole_self_grant')<>''
    OR NOT EXISTS(SELECT 1 FROM pg_roles WHERE rolname='postgres' AND NOT rolsuper AND rolcreaterole AND rolbypassrls)
    OR EXISTS(SELECT 1 FROM pg_namespace WHERE nspname='official_v3_guard_private') THEN
    RAISE EXCEPTION 'bg1 exact Dev predecessor required' USING ERRCODE='P7901';
  END IF;
  IF NOT pg_try_advisory_xact_lock(771101,1) OR NOT pg_try_advisory_xact_lock(771102,1)
    OR NOT pg_try_advisory_xact_lock(771103,1) OR NOT pg_try_advisory_xact_lock(771104,1)
    OR NOT pg_try_advisory_xact_lock(771105,1) OR NOT pg_try_advisory_xact_lock(771106,1) THEN
    RAISE EXCEPTION 'bg1 package operation already active' USING ERRCODE='P7901';
  END IF;
  -- A login can SET ROLE along SET edges, then use inherited caller rights.
  -- Walk that exact path backwards: INHERIT* first, then SET*. ADMIN-only
  -- grants and implicit superuser powers are the existing trusted-admin
  -- boundary, not runtime membership. Do not exclude any backend by its name.
  IF EXISTS(WITH RECURSIVE inherited_roles(role_oid) AS (
      SELECT oid FROM pg_roles WHERE rolname IN ('ot_v3_jobs_caller','ot_v3_intake_caller','ot_v3_method_reader')
      UNION
      SELECT m.member FROM pg_auth_members m JOIN inherited_roles p ON p.role_oid=m.roleid
        WHERE m.inherit_option
    ), runtime_roles(role_oid) AS (
      SELECT role_oid FROM inherited_roles
      UNION
      SELECT m.member FROM pg_auth_members m JOIN runtime_roles p ON p.role_oid=m.roleid
        WHERE m.set_option
    )
    SELECT 1 FROM pg_stat_activity a JOIN pg_roles r ON r.oid=a.usesysid
    WHERE a.pid<>pg_backend_pid() AND (r.rolname IN ('ot_v3_result_writer','ot_v3_result_reader','ot_v3_result_verifier')
      OR EXISTS(SELECT 1 FROM runtime_roles p WHERE p.role_oid=r.oid))) THEN
    RAISE EXCEPTION 'bg1 controlled quiescence required' USING ERRCODE='P7901';
  END IF;
END $context$;

/* HMT_PREDECESSOR */

CREATE TEMP TABLE bg1_before(kind text PRIMARY KEY,value jsonb NOT NULL) ON COMMIT DROP;
DO $predecessor$
DECLARE expected record; actual record; current_value jsonb; result_value jsonb:='{}';
BEGIN
  DECLARE f record; g record; owner_oid oid:='postgres'::regrole; public_oid oid:='public'::regnamespace;
  BEGIN
  /* PAI_PREDECESSOR */
  END;
  FOR expected IN SELECT * FROM (VALUES
    /* EXPECTED_FUNCTIONS */
  ) e(signature,body_hash) LOOP
    SELECT p.* INTO actual FROM pg_proc p WHERE p.oid=to_regprocedure(expected.signature);
    IF NOT FOUND OR encode(sha256(convert_to(actual.prosrc,'UTF8')),'hex') IS DISTINCT FROM expected.body_hash THEN
      RAISE EXCEPTION 'bg1 predecessor definition mismatch' USING ERRCODE='P7901';
    END IF;
  END LOOP;
  INSERT INTO pg_temp.bg1_before VALUES('all',(/* GLOBAL_CATALOG */));
  INSERT INTO pg_temp.bg1_before VALUES('hrs',(/* HRS_CATALOG */));
  /* JOBS_CATALOG */
  INSERT INTO pg_temp.bg1_before VALUES('jobs',result_value);
END $predecessor$;

-- Temporary existing-owner SET edges are narrowly scoped to this transaction.
-- Their absence was part of the frozen predecessor graph; all are removed before
-- final catalog comparison. No bootstrap ADMIN edge is changed.
GRANT ot_v3_result_owner TO postgres WITH ADMIN FALSE, INHERIT FALSE, SET TRUE GRANTED BY postgres;
GRANT ot_v3_jobs_owner TO postgres WITH ADMIN FALSE, INHERIT FALSE, SET TRUE GRANTED BY postgres;
GRANT ot_v3_intake_owner TO postgres WITH ADMIN FALSE, INHERIT FALSE, SET TRUE GRANTED BY postgres;
DO $locked_predecessor$
DECLARE stored jsonb; expected jsonb;
BEGIN
  SELECT value INTO expected FROM pg_temp.bg1_before WHERE kind='hrs';
  EXECUTE 'SET LOCAL ROLE ot_v3_result_owner';
  LOCK TABLE official_v3_result_private.archive_pages_v1,official_v3_result_private.binding_v1,
    official_v3_result_private.decisions_v1,official_v3_result_private.extractions_v1,
    official_v3_result_private.heads_v1,official_v3_result_private.monitor_schedule_v1,
    official_v3_result_private.operations_v1,official_v3_result_private.originals_v1,
    official_v3_result_private.outbox_v1,official_v3_result_private.projections_v1,
    official_v3_result_private.qualifications_v1,official_v3_result_private.versions_v1 IN ACCESS EXCLUSIVE MODE;
  SELECT catalog INTO STRICT stored FROM official_v3_result_private.binding_v1 WHERE singleton;
  IF stored IS DISTINCT FROM expected THEN RAISE EXCEPTION 'bg1 original HRS catalog refusal' USING ERRCODE='P7901'; END IF;
  PERFORM official_v3_result_private.assert_history_v1();
  IF (SELECT state_certificate FROM official_v3_result_private.binding_v1 WHERE singleton)
    IS DISTINCT FROM official_v3_result_private.state_fingerprint_v1() THEN
    RAISE EXCEPTION 'bg1 original HRS content refusal' USING ERRCODE='P7901';
  END IF;
  stored:=to_jsonb(official_v3_result_private.state_fingerprint_v1());
  EXECUTE 'RESET ROLE';
  INSERT INTO pg_temp.bg1_before VALUES('hrs-content',stored);
  SELECT value INTO expected FROM pg_temp.bg1_before WHERE kind='jobs';
  EXECUTE 'SET LOCAL ROLE ot_v3_jobs_owner';
  LOCK TABLE official_v3_jobs_private.subjects_v1,official_v3_jobs_private.queue_operations_v1,
    official_v3_jobs_private.execution_starts_v1,official_v3_jobs_private.execution_results_v1,
    official_v3_jobs_private.execution_dispositions_v1,official_v3_jobs_private.slots_v1,
    official_v3_jobs_private.catalog_binding_v1 IN ACCESS EXCLUSIVE MODE;
  SELECT jsonb_object_agg(object_identity,fingerprint) INTO stored FROM official_v3_jobs_private.catalog_binding_v1;
  IF stored-'package-context' IS DISTINCT FROM expected THEN RAISE EXCEPTION 'bg1 original HM04 catalog refusal' USING ERRCODE='P7901'; END IF;
  EXECUTE 'RESET ROLE';
  UPDATE pg_temp.bg1_before SET value=stored WHERE kind='jobs';
  EXECUTE 'SET LOCAL ROLE ot_v3_jobs_owner';
  SELECT to_jsonb(d) INTO stored FROM (/* CONTENT_JOBS */) hash_value(d);
  EXECUTE 'RESET ROLE';
  INSERT INTO pg_temp.bg1_before VALUES('jobs-content',stored);
  EXECUTE 'SET LOCAL ROLE ot_v3_intake_owner';
  LOCK TABLE official_v3_intake_private.operations_v1,official_v3_intake_private.reservations_v1,
    official_v3_intake_private.completions_v1 IN ACCESS EXCLUSIVE MODE;
  SELECT to_jsonb(d) INTO stored FROM (/* CONTENT_S1 */) hash_value(d);
  EXECUTE 'RESET ROLE';
  INSERT INTO pg_temp.bg1_before VALUES('s1-content',stored);
  LOCK TABLE official_v3_method_private.revisions_v1,official_v3_method_private.operations_v1,
    official_v3_method_private.heads_v1 IN ACCESS EXCLUSIVE MODE;
  LOCK TABLE public.profiles,auth.users,auth.sessions IN ACCESS SHARE MODE;
  SELECT to_jsonb(d) INTO stored FROM (/* CONTENT_HMA */) hash_value(d);
  INSERT INTO pg_temp.bg1_before VALUES('hma-content',stored);
END $locked_predecessor$;
