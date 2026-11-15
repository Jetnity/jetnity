DO $cycle4_context$
BEGIN
  IF current_user<>'postgres' OR session_user<>current_user OR current_database()<>'postgres'
    OR current_setting('server_version_num')::integer/10000<>17
    OR current_setting('transaction_isolation') IS DISTINCT FROM 'read committed'
    OR current_setting('jetnity.cycle4_recovery_target',true) IS DISTINCT FROM 'dev:yfvbxvijcorffwxbxahl:CYCLE4-RECOVERY1'
    OR current_setting('createrole_self_grant')<>''
    OR NOT EXISTS(SELECT 1 FROM pg_roles WHERE rolname='postgres' AND NOT rolsuper AND rolcreaterole AND rolbypassrls)
    OR to_regclass('official_v3_guard_private.refresh_retirement_baseline_v1') IS NULL
    OR to_regclass('official_v3_guard_private.cycle4_recovery_baseline_v1') IS NOT NULL
    OR to_regclass('official_v3_guard_private.retired_cycle4_attempts_v1') IS NOT NULL THEN
    RAISE EXCEPTION 'cycle4 exact unused Dev predecessor required' USING ERRCODE='P7923';
  END IF;
  -- Match the sender's first lock, then the existing package/guard lock order.
  -- The sender is controlled outside this migration; no enable/disable is hidden.
  IF NOT pg_try_advisory_xact_lock(771106,31)
    OR NOT pg_try_advisory_xact_lock(771101,1) OR NOT pg_try_advisory_xact_lock(771102,1)
    OR NOT pg_try_advisory_xact_lock(771103,1) OR NOT pg_try_advisory_xact_lock(771104,1)
    OR NOT pg_try_advisory_xact_lock(771105,1) OR NOT pg_try_advisory_xact_lock(771106,1) THEN
    RAISE EXCEPTION 'cycle4 package operation already active' USING ERRCODE='P7923';
  END IF;
  IF to_regclass('jetnity_dev_import_scheduler.state_v1') IS NOT NULL THEN
    IF EXISTS(SELECT 1 FROM jetnity_dev_import_scheduler.state_v1 WHERE enabled)
      OR EXISTS(SELECT 1 FROM jetnity_dev_import_scheduler.cycles_v1 WHERE state='active')
      OR EXISTS(SELECT 1 FROM jetnity_dev_import_scheduler.dispatches_v1 WHERE processed_at IS NULL) THEN
      RAISE EXCEPTION 'cycle4 disabled drained sender required' USING ERRCODE='P7923';
    END IF;
  END IF;
  IF to_regclass('jetnity_dev_import_scheduler.preview_dispatches_v1') IS NOT NULL THEN
    IF EXISTS(SELECT 1 FROM jetnity_dev_import_scheduler.preview_dispatches_v1 WHERE processed_at IS NULL) THEN
      RAISE EXCEPTION 'cycle4 disabled drained sender required' USING ERRCODE='P7923';
    END IF;
  END IF;
  /* CYCLE4_SCHEDULER_CHECK */
  IF (SELECT count(*) FROM official_v3_jobs_private.subjects_v1)<>1
    OR (SELECT to_jsonb(s) FROM official_v3_jobs_private.subjects_v1 s) IS DISTINCT FROM /* EXACT_SUBJECT */
    OR (SELECT count(*) FROM official_v3_guard_private.retired_attempts_v1)<>1
    OR (SELECT count(*) FROM official_v3_guard_private.retired_later_attempts_v1)<>2
      OR (SELECT count(*) FROM official_v3_guard_private.retired_refresh_attempts_v1)<>1
    OR EXISTS(SELECT 1 FROM official_v3_jobs_private.execution_results_v1 WHERE attempt_key='CYCLE4_ATTEMPT')
    OR EXISTS(SELECT 1 FROM official_v3_jobs_private.execution_dispositions_v1 WHERE attempt_key='CYCLE4_ATTEMPT')
    OR EXISTS(SELECT 1 FROM official_v3_intake_private.completions_v1 WHERE operation_id='CYCLE4_INTAKE')
    OR clock_timestamp()<='CYCLE4_LEASE_EXPIRES'::timestamptz THEN
    RAISE EXCEPTION 'cycle4 exact expired unknown original required' USING ERRCODE='P7923';
  END IF;
  IF EXISTS(WITH RECURSIVE inherited_roles(role_oid) AS (
      SELECT oid FROM pg_roles WHERE rolname IN ('ot_v3_jobs_caller','ot_v3_intake_caller','ot_v3_method_reader')
      UNION SELECT m.member FROM pg_auth_members m JOIN inherited_roles p ON p.role_oid=m.roleid WHERE m.inherit_option
    ), runtime_roles(role_oid) AS (
      SELECT role_oid FROM inherited_roles
      UNION SELECT m.member FROM pg_auth_members m JOIN runtime_roles p ON p.role_oid=m.roleid WHERE m.set_option
    ) SELECT 1 FROM pg_stat_activity a JOIN pg_roles r ON r.oid=a.usesysid
      WHERE a.pid<>pg_backend_pid() AND (r.rolname IN ('ot_v3_result_writer','ot_v3_result_reader','ot_v3_result_verifier')
        OR EXISTS(SELECT 1 FROM runtime_roles p WHERE p.role_oid=r.oid))) THEN
    RAISE EXCEPTION 'cycle4 controlled quiescence required' USING ERRCODE='P7923';
  END IF;
END $cycle4_context$;

CREATE TEMP TABLE cycle4_before(kind text PRIMARY KEY,value jsonb NOT NULL) ON COMMIT DROP;
DO $cycle4_predecessor$
DECLARE expected record; actual record; before_catalog jsonb; table_name text; row_count bigint; row_digest text; owner_name text;
BEGIN
  FOR expected IN SELECT * FROM (VALUES
    /* PREDECESSOR_FUNCTIONS */
  ) f(signature,body_hash) LOOP
    SELECT * INTO actual FROM pg_proc WHERE oid=to_regprocedure(expected.signature);
    IF NOT FOUND OR encode(sha256(convert_to(actual.prosrc,'UTF8')),'hex') IS DISTINCT FROM expected.body_hash THEN
      RAISE EXCEPTION 'cycle4 predecessor definition mismatch: %',expected.signature USING ERRCODE='P7923';
    END IF;
  END LOOP;
  SELECT (/* STATUS_CATALOG_QUERY */) INTO before_catalog;
  IF before_catalog IS DISTINCT FROM (SELECT catalog FROM official_v3_guard_private.refresh_retirement_baseline_v1 WHERE singleton) THEN
    RAISE EXCEPTION 'cycle4 predecessor catalog mismatch' USING ERRCODE='P7923';
  END IF;
  PERFORM official_v3_guard_private.assert_catalog_v1();
  PERFORM official_v3_guard_private.check_control_v1();
  PERFORM official_v3_guard_private.check_hma_v1();
  PERFORM official_v3_guard_private.check_s1_v1();
  PERFORM official_v3_guard_private.check_jobs_v1();
  PERFORM official_v3_guard_private.check_hrs_v1();
  PERFORM official_v3_guard_private.check_certificates_v1();
  PERFORM official_v3_guard_private.check_retirements_v1();
  INSERT INTO pg_temp.cycle4_before VALUES('catalog',before_catalog),
    ('roles',COALESCE((SELECT jsonb_agg(to_jsonb(r) ORDER BY r.oid) FROM pg_roles r),'[]'::jsonb)),
    ('memberships',COALESCE((SELECT jsonb_agg(to_jsonb(m) ORDER BY m.oid) FROM pg_auth_members m),'[]'::jsonb)),
    ('schema_acl',(SELECT jsonb_build_object('owner',nspowner,'acl',nspacl) FROM pg_namespace WHERE nspname='official_v3_guard_private')),
    ('content',jsonb_build_object('hma',official_v3_guard_private.content_digest_v1('hma'),
      's1',official_v3_guard_private.content_digest_v1('s1'),'jobs',official_v3_guard_private.content_digest_v1('jobs'),
      'hrs',official_v3_guard_private.hrs_certificate_v1()));
  -- Do not UPDATE or revoke the bootstrap grantor's ADMIN-only edges. Only a
  -- new postgres-grantor SET-only edge is admitted and later removed exactly.
  FOREACH owner_name IN ARRAY ARRAY['ot_v3_jobs_owner','ot_v3_result_owner'] LOOP
    IF (SELECT count(*) FROM pg_auth_members WHERE roleid=to_regrole(owner_name) AND member='postgres'::regrole)<>1
      OR NOT EXISTS(SELECT 1 FROM pg_auth_members WHERE roleid=to_regrole(owner_name) AND member='postgres'::regrole
        AND grantor<>'postgres'::regrole AND admin_option AND NOT inherit_option AND NOT set_option)
      OR pg_has_role('postgres',to_regrole(owner_name),'USAGE') IS DISTINCT FROM false
      OR pg_has_role('postgres',to_regrole(owner_name),'SET') IS DISTINCT FROM false
      OR has_schema_privilege(to_regrole(owner_name),'official_v3_guard_private','CREATE') IS DISTINCT FROM false THEN
      RAISE EXCEPTION 'cycle4 exact original owner authority required' USING ERRCODE='P7923';
    END IF;
  END LOOP;
  -- Include every existing private history/baseline and, when installed, every
  -- sender/review table. No auth/profile data or credential is read.
  FOR table_name IN SELECT format('%I.%I',n.nspname,c.relname)
    FROM pg_class c JOIN pg_namespace n ON n.oid=c.relnamespace
    WHERE c.relkind IN ('r','p') AND n.nspname IN ('official_v3_method_private','official_v3_intake_private',
      'official_v3_jobs_private','official_v3_result_private','official_v3_guard_private','jetnity_dev_import_scheduler')
    ORDER BY n.nspname COLLATE "C",c.relname COLLATE "C" LOOP
    -- The existing component checks already hold their owner-authorized SHARE
    -- locks. These SELECT-authorized locks additionally prevent old-table DDL.
    EXECUTE format('LOCK TABLE %s IN ACCESS SHARE MODE',table_name::regclass);
    EXECUTE format('SELECT count(*),encode(sha256(convert_to(COALESCE(string_agg(encode(sha256(convert_to(to_jsonb(r)::text,''UTF8'')),''hex''),'''' ORDER BY to_jsonb(r)::text COLLATE "C"),''''),''UTF8'')),''hex'') FROM %s r',table_name::regclass)
      INTO row_count,row_digest;
    INSERT INTO pg_temp.cycle4_before VALUES('table:'||table_name,jsonb_build_object('count',row_count,'digest',row_digest));
  END LOOP;
END $cycle4_predecessor$;
