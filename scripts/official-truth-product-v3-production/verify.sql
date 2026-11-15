BEGIN;
SET TRANSACTION READ ONLY;
SET LOCAL search_path=pg_catalog;
DO $production_verify$
DECLARE row_value record; role_value pg_roles%ROWTYPE;
BEGIN
  IF current_setting('jetnity.production_target',true) IS DISTINCT FROM 'production:qscbgcdmivbbnzrcyegn:INSTALL1'
    OR session_user<>'postgres' OR current_user<>session_user OR current_database()<>'postgres'
    OR current_setting('server_version_num')::integer/10000<>17 THEN
    RAISE EXCEPTION 'production verify fixed target and Creator required' USING ERRCODE='P7921'; END IF;
  PERFORM official_v3_guard_private.assert_catalog_v1();
  PERFORM official_v3_guard_private.check_control_v1();
  PERFORM official_v3_guard_private.check_hma_v1();
  PERFORM official_v3_guard_private.check_s1_v1();
  PERFORM official_v3_guard_private.check_jobs_v1();
  PERFORM official_v3_guard_private.check_hrs_v1();
  PERFORM official_v3_guard_private.check_certificates_v1();
  PERFORM official_v3_guard_private.check_retirements_v1();
  FOR row_value IN SELECT * FROM (VALUES
    ('ot_v3_method_transport_login','ot_v3_method_reader',2),
    ('ot_v3_intake_transport_login','ot_v3_intake_caller',2),
    ('ot_v3_jobs_transport_login','ot_v3_jobs_caller',2),
    ('ot_v3_result_writer',NULL,2),('ot_v3_result_reader',NULL,2),('ot_v3_result_verifier',NULL,2)
  ) r(login,caller,connection_limit) LOOP
    SELECT * INTO STRICT role_value FROM pg_roles WHERE rolname=row_value.login;
    IF NOT role_value.rolcanlogin OR role_value.rolinherit OR role_value.rolsuper OR role_value.rolbypassrls
      OR role_value.rolcreaterole OR role_value.rolcreatedb OR role_value.rolreplication
      OR role_value.rolconnlimit<>row_value.connection_limit OR role_value.rolvaliduntil IS NOT NULL
      OR role_value.rolconfig IS NOT NULL OR NOT has_database_privilege(role_value.oid,current_database(),'CONNECT')
      OR has_schema_privilege(role_value.oid,'official_v3_guard_private','USAGE,CREATE')
      OR pg_has_role(role_value.oid,'postgres','SET') OR pg_has_role(role_value.oid,'postgres','USAGE') THEN
      RAISE EXCEPTION 'production technical role boundary differs: %',row_value.login USING ERRCODE='P7921'; END IF;
    IF row_value.caller IS NOT NULL AND ((SELECT count(*) FROM pg_auth_members WHERE member=role_value.oid)<>1
      OR NOT EXISTS(SELECT 1 FROM pg_auth_members WHERE member=role_value.oid AND roleid=to_regrole(row_value.caller)
        AND grantor='postgres'::regrole AND NOT admin_option AND NOT inherit_option AND set_option)) THEN
      RAISE EXCEPTION 'production bounded SET role edge differs' USING ERRCODE='P7921'; END IF;
    IF row_value.caller IS NULL AND EXISTS(SELECT 1 FROM pg_auth_members WHERE member=role_value.oid) THEN
      RAISE EXCEPTION 'production result login unexpectedly inherits a role' USING ERRCODE='P7921'; END IF;
  END LOOP;
END $production_verify$;
SELECT jsonb_build_object('schema',1,'target','qscbgcdmivbbnzrcyegn','catalog','verified',
  'guardStatus',public.official_v3_guard_alarm_status_v1(),
  'methodRows',(SELECT count(*) FROM official_v3_method_private.heads_v1),
  'sourceJobs',(SELECT count(*) FROM official_v3_jobs_private.subjects_v1),
  'publishedProjections',(SELECT count(*) FROM official_v3_result_private.projections_v1),
  'quotaModel','rolling_24h_v2','ownerApproval','not_implied','remoteTLS','separate_runtime_check') AS production_installation_readback;

ROLLBACK;
