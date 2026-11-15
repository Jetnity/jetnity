-- Separate approved operator action. Supply jetnity.production_credentials as a
-- transaction-local JSON object using a secret-aware parameterized connection.
-- The six keys are the server-only runtime ENV names in manifest.json. Never
-- paste real values into Git, an issue, a generated artifact or a test log.
-- This file does not generate, return, copy or inspect any existing password.
DO $production_credentials$
DECLARE supplied jsonb; expected_keys constant text[]:=ARRAY['JETNITY_V3_PG_METHOD_PASSWORD','JETNITY_V3_PG_INTAKE_PASSWORD',
  'JETNITY_V3_PG_JOBS_PASSWORD','JETNITY_V3_PG_RESULT_WRITER_PASSWORD','JETNITY_V3_PG_RESULT_READER_PASSWORD','JETNITY_V3_PG_RESULT_VERIFIER_PASSWORD'];
  pair record; selected_password text; before_catalog jsonb;
BEGIN
  IF session_user<>'postgres' OR current_user<>session_user OR current_database()<>'postgres'
    OR current_setting('jetnity.production_target',true) IS DISTINCT FROM 'production:qscbgcdmivbbnzrcyegn:INSTALL1'
    OR current_setting('password_encryption')<>'scram-sha-256' THEN
    RAISE EXCEPTION 'production credential operation context refused' USING ERRCODE='P7921'; END IF;
  supplied:=NULLIF(current_setting('jetnity.production_credentials',true),'')::jsonb;
  IF supplied IS NULL OR jsonb_typeof(supplied)<>'object' OR NOT supplied ?& expected_keys
    OR supplied-expected_keys<>'{}'::jsonb
    OR (SELECT count(DISTINCT j.value) FROM jsonb_each_text(supplied) j)<>6
    OR EXISTS(SELECT 1 FROM jsonb_each(supplied) j WHERE jsonb_typeof(j.value)<>'string' OR j.value#>>'{}' !~ '^[A-Za-z0-9_-]{43,128}$') THEN
    RAISE EXCEPTION 'production exactly six distinct strong credential inputs required' USING ERRCODE='P7921'; END IF;
  PERFORM official_v3_guard_private.assert_catalog_v1();
  before_catalog:=official_v3_guard_private.catalog_status_v1();
  FOR pair IN SELECT * FROM (VALUES
    ('ot_v3_method_transport_login','JETNITY_V3_PG_METHOD_PASSWORD'),
    ('ot_v3_intake_transport_login','JETNITY_V3_PG_INTAKE_PASSWORD'),
    ('ot_v3_jobs_transport_login','JETNITY_V3_PG_JOBS_PASSWORD'),
    ('ot_v3_result_writer','JETNITY_V3_PG_RESULT_WRITER_PASSWORD'),
    ('ot_v3_result_reader','JETNITY_V3_PG_RESULT_READER_PASSWORD'),
    ('ot_v3_result_verifier','JETNITY_V3_PG_RESULT_VERIFIER_PASSWORD')
  ) credentials(login_name,env_name) LOOP
    selected_password:=supplied->>pair.env_name;
    EXECUTE format('ALTER ROLE %I PASSWORD %L',pair.login_name,selected_password);
  END LOOP;
  PERFORM set_config('jetnity.production_credentials','',true);
  selected_password:=NULL; supplied:=NULL;
  IF before_catalog IS DISTINCT FROM official_v3_guard_private.catalog_status_v1() THEN
    RAISE EXCEPTION 'production credential operation changed non-secret catalog' USING ERRCODE='P7921'; END IF;
  PERFORM official_v3_guard_private.assert_catalog_v1();
END $production_credentials$;
