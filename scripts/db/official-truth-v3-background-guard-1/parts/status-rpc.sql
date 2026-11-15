SET LOCAL jetnity.bg1_status_target='dev:yfvbxvijcorffwxbxahl:BG1-STATUS1';
SET LOCAL search_path=pg_catalog;
SET LOCAL statement_timeout='30s';
SET LOCAL lock_timeout='5s';
SET LOCAL idle_in_transaction_session_timeout='30s';
SET LOCAL timezone='UTC';
SET LOCAL datestyle='ISO, YMD';

/* STATUS_CONTEXT */

CREATE TEMP TABLE bg1_status_before(kind text PRIMARY KEY,value jsonb NOT NULL) ON COMMIT DROP;
DO $status_predecessor$
DECLARE pre_expected record; pre_actual record; pre_catalog jsonb; pre_table text; pre_digest text; pre_count bigint;
BEGIN
  IF to_regclass('official_v3_guard_private.status_baseline_v1') IS NOT NULL
    OR EXISTS(SELECT 1 FROM pg_proc p JOIN pg_namespace n ON n.oid=p.pronamespace
      WHERE n.nspname='official_v3_guard_private' AND p.proname='catalog_status_v1'
        OR n.nspname='public' AND p.proname='official_v3_guard_alarm_status_v1') THEN
    RAISE EXCEPTION 'bg1 status exact unused successor required' USING ERRCODE='P7901';
  END IF;
  -- These hashes come from the complete, pinned actually installed artifact.
  -- The old catalog query is also embedded unchanged: no trust in an altered
  -- live catalog/assert helper can silently introduce a successor baseline.
  FOR pre_expected IN SELECT * FROM (VALUES
    /* ORIGINAL_FUNCTIONS */
  ) expected(signature,body_hash) LOOP
    SELECT p.* INTO pre_actual FROM pg_proc p WHERE p.oid=to_regprocedure(pre_expected.signature);
    IF NOT FOUND OR encode(sha256(convert_to(pre_actual.prosrc,'UTF8')),'hex') IS DISTINCT FROM pre_expected.body_hash THEN
      RAISE EXCEPTION 'bg1 status predecessor definition mismatch' USING ERRCODE='P7901';
    END IF;
  END LOOP;
  SELECT (/* ORIGINAL_CATALOG */) INTO pre_catalog;
  IF (SELECT count(*) FROM official_v3_guard_private.baselines_v1)<>3
    OR pre_catalog IS DISTINCT FROM (SELECT catalog FROM official_v3_guard_private.baselines_v1 WHERE component='all') THEN
    RAISE EXCEPTION 'bg1 status predecessor catalog mismatch' USING ERRCODE='P7905';
  END IF;
  PERFORM official_v3_guard_private.assert_catalog_v1();
  PERFORM official_v3_guard_private.check_control_v1();
  PERFORM official_v3_guard_private.check_hma_v1();
  PERFORM official_v3_guard_private.check_s1_v1();
  PERFORM official_v3_guard_private.check_jobs_v1();
  PERFORM official_v3_guard_private.check_hrs_v1();
  PERFORM official_v3_guard_private.check_certificates_v1();
  PERFORM official_v3_guard_private.check_retirements_v1();
  INSERT INTO pg_temp.bg1_status_before VALUES('all',pre_catalog),('content',jsonb_build_object(
    'hma',official_v3_guard_private.content_digest_v1('hma'),
    's1',official_v3_guard_private.content_digest_v1('s1'),
    'jobs',official_v3_guard_private.content_digest_v1('jobs'),
    'hrs',official_v3_guard_private.hrs_certificate_v1()));
  -- Preserve all eight old Guard tables too, including every immutable old
  -- baseline, run, certificate and owner/recovery row. These are not reset.
  FOREACH pre_table IN ARRAY ARRAY['baselines_v1','certificates_v1','certificate_history_v1','state_v1',
    'runs_v1','incidents_v1','owner_operations_v1','retired_attempts_v1'] LOOP
    EXECUTE format('SELECT count(*),encode(sha256(convert_to(COALESCE(string_agg(encode(sha256(convert_to(to_jsonb(r)::text,''UTF8'')),''hex''),'''' ORDER BY to_jsonb(r)::text COLLATE "C"),''''),''UTF8'')),''hex'') FROM official_v3_guard_private.%I r',pre_table)
      INTO pre_count,pre_digest;
    INSERT INTO pg_temp.bg1_status_before VALUES('guard:'||pre_table,jsonb_build_object('count',pre_count,'digest',pre_digest));
  END LOOP;
END $status_predecessor$;

CREATE TABLE official_v3_guard_private.status_baseline_v1 (
  singleton boolean PRIMARY KEY DEFAULT true CHECK (singleton),
  predecessor_catalog_digest text NOT NULL CHECK (predecessor_catalog_digest ~ '^[a-f0-9]{64}$'),
  predecessor_baselines_digest text NOT NULL CHECK (predecessor_baselines_digest ~ '^[a-f0-9]{64}$'),
  provider_digest text NOT NULL CHECK (provider_digest='BG1_PROVIDER_SHA256'),
  required_generation bigint NOT NULL CHECK (required_generation>0),
  proof_not_before timestamptz NOT NULL CHECK (isfinite(proof_not_before)),
  catalog jsonb NOT NULL
);
ALTER TABLE official_v3_guard_private.status_baseline_v1 ENABLE ROW LEVEL SECURITY;
ALTER TABLE official_v3_guard_private.status_baseline_v1 FORCE ROW LEVEL SECURITY;
CREATE POLICY owner_only ON official_v3_guard_private.status_baseline_v1 TO postgres USING (true) WITH CHECK (true);
CREATE TRIGGER immutable_v1 BEFORE UPDATE OR DELETE ON official_v3_guard_private.status_baseline_v1
  FOR EACH ROW EXECUTE FUNCTION official_v3_guard_private.immutable_v1();
REVOKE ALL ON TABLE official_v3_guard_private.status_baseline_v1 FROM PUBLIC,anon,authenticated,service_role,supabase_read_only_user;

/* STATUS_CATALOG */

-- The sole existing validator replacement. The old three baseline rows and
-- original catalog_v1 remain intact and bound by their actual content hashes.
CREATE OR REPLACE FUNCTION official_v3_guard_private.assert_catalog_v1() RETURNS void
LANGUAGE plpgsql VOLATILE SECURITY DEFINER SET search_path=pg_catalog AS $$
DECLARE status_baseline official_v3_guard_private.status_baseline_v1%ROWTYPE; old_catalog jsonb; old_baselines jsonb;
BEGIN
  SELECT * INTO STRICT status_baseline FROM official_v3_guard_private.status_baseline_v1 WHERE singleton;
  SELECT catalog INTO STRICT old_catalog FROM official_v3_guard_private.baselines_v1 WHERE component='all';
  SELECT jsonb_agg(to_jsonb(b)||jsonb_build_object('installed_at',extract(epoch FROM b.installed_at)) ORDER BY b.component COLLATE "C")
    INTO old_baselines FROM official_v3_guard_private.baselines_v1 b;
  IF jsonb_array_length(old_baselines)<>3
    OR status_baseline.provider_digest<>'BG1_PROVIDER_SHA256'
    OR status_baseline.predecessor_catalog_digest IS DISTINCT FROM encode(sha256(convert_to(old_catalog::text,'UTF8')),'hex')
    OR status_baseline.predecessor_baselines_digest IS DISTINCT FROM encode(sha256(convert_to(old_baselines::text,'UTF8')),'hex')
    OR status_baseline.catalog IS DISTINCT FROM official_v3_guard_private.catalog_status_v1() THEN
    RAISE EXCEPTION 'bg1 status protected catalog changed' USING ERRCODE='P7905';
  END IF;
END $$;

-- Public output is deliberately only one health bit plus its schema. No
-- catalog/history scan, mutation, authority operation or heartbeat occurs.
-- An old still-fresh BG1 proof cannot cover this newly installed object graph.
CREATE FUNCTION public.official_v3_guard_alarm_status_v1() RETURNS jsonb
LANGUAGE plpgsql VOLATILE SECURITY DEFINER SET search_path=pg_catalog AS $$
DECLARE required_proof bigint; earliest_proof timestamptz; current_state official_v3_guard_private.state_v1%ROWTYPE;
  unavailable_value jsonb:=jsonb_build_object('schema',1,'status','unavailable');
BEGIN
  IF official_v3_guard_private.alarm_status_v1() IS DISTINCT FROM jsonb_build_object('schema',1,'status','current') THEN
    RETURN unavailable_value;
  END IF;
  SELECT required_generation,proof_not_before INTO STRICT required_proof,earliest_proof
    FROM official_v3_guard_private.status_baseline_v1 WHERE singleton;
  SELECT * INTO STRICT current_state FROM official_v3_guard_private.state_v1 WHERE singleton;
  IF current_state.generation<required_proof OR current_state.last_proof_started<earliest_proof
    OR current_state.incident_generation<>current_state.resumed_generation
    OR current_state.last_finished>current_state.last_started+interval '30 seconds'
    OR current_state.valid_until<>current_state.last_due+interval '5 minutes 30 seconds'
    OR NOT EXISTS(SELECT 1 FROM official_v3_guard_private.runs_v1 run
      WHERE run.due_at=current_state.last_due AND run.outcome='complete' AND run.generation=current_state.generation
        AND run.started_at=current_state.last_started AND run.proof_started_at=current_state.last_proof_started
        AND run.finished_at=current_state.last_finished)
    OR clock_timestamp()<greatest(current_state.last_observed,current_state.last_finished,earliest_proof)
    OR clock_timestamp()>=current_state.valid_until THEN RETURN unavailable_value; END IF;
  RETURN jsonb_build_object('schema',1,'status','current');
EXCEPTION WHEN query_canceled OR OTHERS THEN RETURN unavailable_value;
END $$;

REVOKE ALL ON FUNCTION official_v3_guard_private.catalog_status_v1() FROM PUBLIC,anon,authenticated,service_role,supabase_read_only_user;
REVOKE ALL ON FUNCTION public.official_v3_guard_alarm_status_v1() FROM PUBLIC,anon,authenticated,service_role,supabase_read_only_user;
GRANT EXECUTE ON FUNCTION public.official_v3_guard_alarm_status_v1() TO anon;

CREATE TEMP TABLE bg1_status_objects(classid oid,objid oid,PRIMARY KEY(classid,objid)) ON COMMIT DROP;
DO $status_delta$
DECLARE status_approved jsonb:=/* STATUS_FUNCTIONS */; status_expected record; status_actual pg_proc%ROWTYPE;
  status_acl jsonb; status_before jsonb; status_after jsonb; status_entry record;
  status_class oid; status_id oid; status_relation oid:='official_v3_guard_private.status_baseline_v1'::regclass;
  status_original_assert oid:='official_v3_guard_private.assert_catalog_v1()'::regprocedure;
BEGIN
  SELECT value INTO STRICT status_before FROM pg_temp.bg1_status_before WHERE kind='all';
  FOR status_expected IN SELECT * FROM jsonb_to_recordset(status_approved)
    AS expected(signature text,hash text,language text,volatile text,config jsonb,result text,grantees jsonb) LOOP
    SELECT * INTO STRICT status_actual FROM pg_proc WHERE oid=to_regprocedure(status_expected.signature);
    SELECT jsonb_agg(role_name ORDER BY role_name) INTO status_acl FROM (
      SELECT DISTINCT CASE a.grantee WHEN 0 THEN 'PUBLIC' ELSE pg_get_userbyid(a.grantee) END AS role_name
      FROM aclexplode(COALESCE(status_actual.proacl,acldefault('f',status_actual.proowner))) a
    ) acl;
    IF status_actual.proowner<>'postgres'::regrole OR status_actual.prokind<>'f'
      OR NOT status_actual.prosecdef OR status_actual.proleakproof OR status_actual.proisstrict OR status_actual.proretset
      OR status_actual.pronargs<>0 OR status_actual.pronargdefaults<>0 OR status_actual.provariadic<>0
      OR status_actual.proargnames IS NOT NULL OR status_actual.proargmodes IS NOT NULL OR status_actual.proallargtypes IS NOT NULL
      OR status_actual.proparallel<>'u' OR status_actual.provolatile::text<>status_expected.volatile
      OR status_actual.prorettype<>to_regtype(status_expected.result)
      OR (SELECT lanname FROM pg_language WHERE oid=status_actual.prolang)<>status_expected.language
      OR to_jsonb(status_actual.proconfig) IS DISTINCT FROM status_expected.config
      OR status_acl IS DISTINCT FROM status_expected.grantees
      OR encode(sha256(convert_to(status_actual.prosrc,'UTF8')),'hex')<>status_expected.hash
      OR EXISTS(SELECT 1 FROM aclexplode(COALESCE(status_actual.proacl,acldefault('f',status_actual.proowner))) a
        WHERE a.privilege_type<>'EXECUTE' OR a.is_grantable OR a.grantor<>status_actual.proowner) THEN
      RAISE EXCEPTION 'bg1 status exact function contract' USING ERRCODE='P7901';
    END IF;
    IF status_actual.oid<>status_original_assert THEN
      INSERT INTO pg_temp.bg1_status_objects VALUES('pg_proc'::regclass,status_actual.oid);
    END IF;
  END LOOP;
  IF EXISTS(SELECT 1 FROM pg_class c WHERE c.oid=status_relation AND (c.relowner<>'postgres'::regrole
    OR c.relkind<>'r' OR NOT c.relrowsecurity OR NOT c.relforcerowsecurity
    OR EXISTS(SELECT 1 FROM aclexplode(COALESCE(c.relacl,acldefault('r',c.relowner))) a
      WHERE a.grantee<>'postgres'::regrole OR a.grantor<>'postgres'::regrole OR a.is_grantable)))
    OR (SELECT count(*) FROM pg_attribute a WHERE a.attrelid=status_relation AND a.attnum>0)<>7
    OR (SELECT jsonb_agg(jsonb_build_array(a.attname,a.atttypid::regtype::text,a.attnotnull,a.attisdropped) ORDER BY a.attnum)
      FROM pg_attribute a WHERE a.attrelid=status_relation AND a.attnum>0) IS DISTINCT FROM
      '[["singleton","boolean",true,false],["predecessor_catalog_digest","text",true,false],["predecessor_baselines_digest","text",true,false],["provider_digest","text",true,false],["required_generation","bigint",true,false],["proof_not_before","timestamp with time zone",true,false],["catalog","jsonb",true,false]]'::jsonb
    OR (SELECT count(*) FROM pg_policy p WHERE p.polrelid=status_relation)<>1
    OR NOT EXISTS(SELECT 1 FROM pg_policy p WHERE p.polrelid=status_relation AND p.polname='owner_only'
      AND p.polroles=ARRAY['postgres'::regrole::oid] AND p.polpermissive AND p.polcmd='*'
      AND pg_get_expr(p.polqual,p.polrelid)='true' AND pg_get_expr(p.polwithcheck,p.polrelid)='true')
    OR (SELECT count(*) FROM pg_trigger t WHERE t.tgrelid=status_relation)<>1
    OR NOT EXISTS(SELECT 1 FROM pg_trigger t WHERE t.tgrelid=status_relation AND t.tgname='immutable_v1'
      AND t.tgfoid='official_v3_guard_private.immutable_v1()'::regprocedure AND t.tgtype=27
      AND t.tgenabled='O' AND NOT t.tgisinternal AND t.tgnargs=0 AND t.tgqual IS NULL) THEN
    RAISE EXCEPTION 'bg1 status private baseline contract' USING ERRCODE='P7901';
  END IF;
  INSERT INTO pg_temp.bg1_status_objects
    SELECT 'pg_class'::regclass,status_relation
    UNION SELECT 'pg_class'::regclass,c.reltoastrelid FROM pg_class c WHERE c.oid=status_relation AND c.reltoastrelid<>0
    UNION SELECT 'pg_class'::regclass,i.indexrelid FROM pg_index i WHERE i.indrelid=status_relation
      OR i.indrelid=(SELECT c.reltoastrelid FROM pg_class c WHERE c.oid=status_relation);
  INSERT INTO pg_temp.bg1_status_objects
    SELECT 'pg_type'::regclass,t.oid FROM pg_type t WHERE t.typrelid IN
      (SELECT objid FROM pg_temp.bg1_status_objects WHERE classid='pg_class'::regclass)
      OR t.oid IN (SELECT inner_type.typarray FROM pg_type inner_type WHERE inner_type.typrelid=status_relation);
  INSERT INTO pg_temp.bg1_status_objects
    SELECT 'pg_constraint'::regclass,c.oid FROM pg_constraint c WHERE c.conrelid=status_relation
    UNION SELECT 'pg_trigger'::regclass,t.oid FROM pg_trigger t WHERE t.tgrelid=status_relation
    UNION SELECT 'pg_policy'::regclass,p.oid FROM pg_policy p WHERE p.polrelid=status_relation
    UNION SELECT 'pg_attrdef'::regclass,a.oid FROM pg_attrdef a WHERE a.adrelid=status_relation;
  status_after:=official_v3_guard_private.catalog_status_v1();
  FOR status_entry IN SELECT key,value FROM jsonb_each(status_before) LOOP
    IF status_after->status_entry.key IS NOT DISTINCT FROM status_entry.value THEN CONTINUE; END IF;
    IF status_entry.key='function:'||status_original_assert
      AND (status_after->status_entry.key)-'definition' IS NOT DISTINCT FROM status_entry.value-'definition' THEN CONTINUE; END IF;
    RAISE EXCEPTION 'bg1 status predecessor graph changed' USING ERRCODE='P7901';
  END LOOP;
  FOR status_entry IN SELECT key,value FROM jsonb_each(status_after) WHERE NOT status_before ? key LOOP
    status_class:=CASE split_part(status_entry.key,':',1)
      WHEN 'function' THEN 'pg_proc'::regclass WHEN 'relation' THEN 'pg_class'::regclass
      WHEN 'attribute' THEN 'pg_class'::regclass WHEN 'index' THEN 'pg_class'::regclass
      WHEN 'type' THEN 'pg_type'::regclass WHEN 'constraint' THEN 'pg_constraint'::regclass
      WHEN 'trigger' THEN 'pg_trigger'::regclass WHEN 'policy' THEN 'pg_policy'::regclass WHEN 'default' THEN 'pg_attrdef'::regclass
      WHEN 'dependency' THEN (status_entry.value->>'classid')::oid WHEN 'shared' THEN (status_entry.value->>'classid')::oid END;
    status_id:=CASE WHEN split_part(status_entry.key,':',1) IN ('dependency','shared') THEN (status_entry.value->>'objid')::oid
      ELSE split_part(status_entry.key,':',2)::oid END;
    IF status_class IS NULL OR NOT EXISTS(SELECT 1 FROM pg_temp.bg1_status_objects o WHERE o.classid=status_class AND o.objid=status_id) THEN
      RAISE EXCEPTION 'bg1 status unreviewed additive graph edge' USING ERRCODE='P7901';
    END IF;
  END LOOP;
  INSERT INTO official_v3_guard_private.status_baseline_v1(singleton,predecessor_catalog_digest,predecessor_baselines_digest,
    provider_digest,required_generation,proof_not_before,catalog)
  SELECT true,encode(sha256(convert_to(status_before::text,'UTF8')),'hex'),
    encode(sha256(convert_to((SELECT jsonb_agg(to_jsonb(b)||jsonb_build_object('installed_at',extract(epoch FROM b.installed_at)) ORDER BY b.component COLLATE "C") FROM official_v3_guard_private.baselines_v1 b)::text,'UTF8')),'hex'),
    'BG1_PROVIDER_SHA256',s.generation+1,clock_timestamp(),status_after FROM official_v3_guard_private.state_v1 s WHERE s.singleton;
END $status_delta$;

DO $status_postcheck$
DECLARE post_content jsonb; post_original jsonb; post_table text; post_digest text; post_count bigint;
BEGIN
  -- Run the real complete validators, without audit_v1's due-slot shortcut and
  -- without updating any success, incident, certificate, clock or Owner row.
  PERFORM official_v3_guard_private.assert_catalog_v1();
  PERFORM official_v3_guard_private.check_control_v1();
  PERFORM official_v3_guard_private.check_hma_v1();
  PERFORM official_v3_guard_private.check_s1_v1();
  PERFORM official_v3_guard_private.check_jobs_v1();
  PERFORM official_v3_guard_private.check_hrs_v1();
  PERFORM official_v3_guard_private.check_certificates_v1();
  PERFORM official_v3_guard_private.check_retirements_v1();
  SELECT value INTO STRICT post_original FROM pg_temp.bg1_status_before WHERE kind='content';
  post_content:=jsonb_build_object('hma',official_v3_guard_private.content_digest_v1('hma'),
    's1',official_v3_guard_private.content_digest_v1('s1'),'jobs',official_v3_guard_private.content_digest_v1('jobs'),
    'hrs',official_v3_guard_private.hrs_certificate_v1());
  IF post_original IS DISTINCT FROM post_content THEN RAISE EXCEPTION 'bg1 status old data changed' USING ERRCODE='P7901'; END IF;
  FOREACH post_table IN ARRAY ARRAY['baselines_v1','certificates_v1','certificate_history_v1','state_v1',
    'runs_v1','incidents_v1','owner_operations_v1','retired_attempts_v1'] LOOP
    EXECUTE format('SELECT count(*),encode(sha256(convert_to(COALESCE(string_agg(encode(sha256(convert_to(to_jsonb(r)::text,''UTF8'')),''hex''),'''' ORDER BY to_jsonb(r)::text COLLATE "C"),''''),''UTF8'')),''hex'') FROM official_v3_guard_private.%I r',post_table)
      INTO post_count,post_digest;
    SELECT value INTO STRICT post_original FROM pg_temp.bg1_status_before WHERE kind='guard:'||post_table;
    IF post_original IS DISTINCT FROM jsonb_build_object('count',post_count,'digest',post_digest) THEN
      RAISE EXCEPTION 'bg1 status old guard history changed' USING ERRCODE='P7901'; END IF;
  END LOOP;
  PERFORM official_v3_guard_private.assert_catalog_v1();
  /* FINAL_QUIESCENCE */ THEN
    RAISE EXCEPTION 'bg1 status final quiescence refusal' USING ERRCODE='P7901';
  END IF;
END $status_postcheck$;
