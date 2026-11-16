DO $cycle4_postcheck$
DECLARE prior record; table_name text; row_count bigint; row_digest text; current_content jsonb;
BEGIN
  IF EXISTS(SELECT 1 FROM official_v3_guard_private.retired_cycle4_attempts_v1) THEN
    RAISE EXCEPTION 'cycle4 installer cannot retire an attempt' USING ERRCODE='P7923'; END IF;
  PERFORM official_v3_guard_private.assert_catalog_v1();
  PERFORM official_v3_guard_private.check_control_v1();
  PERFORM official_v3_guard_private.check_hma_v1();
  PERFORM official_v3_guard_private.check_s1_v1();
  PERFORM official_v3_guard_private.check_jobs_v1();
  PERFORM official_v3_guard_private.check_hrs_v1();
  PERFORM official_v3_guard_private.check_certificates_v1();
  PERFORM official_v3_guard_private.check_retirements_v1();
  current_content:=jsonb_build_object('hma',official_v3_guard_private.content_digest_v1('hma'),
    's1',official_v3_guard_private.content_digest_v1('s1'),'jobs',official_v3_guard_private.content_digest_v1('jobs'),
    'hrs',official_v3_guard_private.hrs_certificate_v1());
  IF current_content IS DISTINCT FROM (SELECT value FROM pg_temp.cycle4_before WHERE kind='content') THEN
    RAISE EXCEPTION 'cycle4 old certified content changed' USING ERRCODE='P7923';
  END IF;
  FOR prior IN SELECT * FROM pg_temp.cycle4_before WHERE kind LIKE 'table:%' LOOP
    table_name:=substr(prior.kind,7);
    EXECUTE format('SELECT count(*),encode(sha256(convert_to(COALESCE(string_agg(encode(sha256(convert_to(to_jsonb(r)::text,''UTF8'')),''hex''),'''' ORDER BY to_jsonb(r)::text COLLATE "C"),''''),''UTF8'')),''hex'') FROM %s r',table_name::regclass)
      INTO row_count,row_digest;
    IF prior.value IS DISTINCT FROM jsonb_build_object('count',row_count,'digest',row_digest) THEN
      RAISE EXCEPTION 'cycle4 old table changed: %',table_name USING ERRCODE='P7923';
    END IF;
  END LOOP;
  IF public.official_v3_guard_alarm_status_v1() IS DISTINCT FROM '{"schema":1,"status":"unavailable"}'::jsonb THEN
    RAISE EXCEPTION 'cycle4 fresh proof admission required' USING ERRCODE='P7923';
  END IF;
  BEGIN
    PERFORM official_v3_guard_private.require_open_v1();
    RAISE EXCEPTION 'cycle4 old proof admitted business IO' USING ERRCODE='P7923';
  EXCEPTION WHEN SQLSTATE 'P7902' THEN NULL; END;
  PERFORM official_v3_guard_private.assert_catalog_v1();
  IF EXISTS(WITH RECURSIVE inherited_roles(role_oid) AS (
      SELECT oid FROM pg_roles WHERE rolname IN ('ot_v3_jobs_caller','ot_v3_intake_caller','ot_v3_method_reader')
      UNION SELECT m.member FROM pg_auth_members m JOIN inherited_roles p ON p.role_oid=m.roleid WHERE m.inherit_option
    ), runtime_roles(role_oid) AS (
      SELECT role_oid FROM inherited_roles
      UNION SELECT m.member FROM pg_auth_members m JOIN runtime_roles p ON p.role_oid=m.roleid WHERE m.set_option
    ) SELECT 1 FROM pg_stat_activity a JOIN pg_roles r ON r.oid=a.usesysid
      WHERE a.pid<>pg_backend_pid() AND (r.rolname IN ('ot_v3_result_writer','ot_v3_result_reader','ot_v3_result_verifier')
        OR EXISTS(SELECT 1 FROM runtime_roles p WHERE p.role_oid=r.oid))) THEN
    RAISE EXCEPTION 'cycle4 final quiescence refusal' USING ERRCODE='P7923';
  END IF;
END $cycle4_postcheck$;
