-- No caller receives direct state/table access. The existing platform reader
-- obtains exactly the redacted status function; the Management API remains the
-- independent read-only transport boundary (the provider role has BYPASSRLS).
GRANT USAGE ON SCHEMA official_v3_guard_private TO supabase_read_only_user;
GRANT EXECUTE ON FUNCTION official_v3_guard_private.alarm_status_v1() TO supabase_read_only_user;
GRANT EXECUTE ON FUNCTION public.official_v3_guard_review_v1(),
  public.official_v3_guard_retire_v1(text,text),public.official_v3_guard_resume_v1(text,text),
  public.official_v3_guard_confirm_v1(text,text,text) TO authenticated;
REVOKE CREATE ON SCHEMA official_v3_guard_private FROM ot_v3_result_owner,ot_v3_jobs_owner,ot_v3_intake_owner;
REVOKE ot_v3_result_owner FROM postgres GRANTED BY postgres;
REVOKE ot_v3_jobs_owner FROM postgres GRANTED BY postgres;
REVOKE ot_v3_intake_owner FROM postgres GRANTED BY postgres;

CREATE TEMP TABLE bg1_new_objects(classid oid,objid oid,PRIMARY KEY(classid,objid)) ON COMMIT DROP;
DO $exact_delta$
DECLARE approved jsonb:=/* APPROVED_DELTA */; before_value jsonb; after_value jsonb;
  entry record; f record; p pg_proc%ROWTYPE; actual_acl jsonb; current_value jsonb; result_value jsonb:='{}';
  schema_oid oid:='official_v3_guard_private'::regnamespace; function_oid oid; object_class oid; object_id oid;
BEGIN
  SELECT value INTO STRICT before_value FROM pg_temp.bg1_before WHERE kind='all';
  after_value:=official_v3_guard_private.catalog_v1();
  -- Exact fixed new function inventory, body, owner, execution attributes and
  -- minimal grant set. No existing function gains privileges during replacement.
  FOR f IN SELECT * FROM jsonb_to_recordset(approved->'functions')
    AS x(signature text,name text,owner text,hash text,language text,definer boolean,volatile text,config jsonb,grantees jsonb) LOOP
    SELECT * INTO STRICT p FROM pg_proc WHERE oid=to_regprocedure(f.signature);
    SELECT jsonb_agg(role_name ORDER BY role_name) INTO actual_acl FROM (
      SELECT DISTINCT CASE a.grantee WHEN 0 THEN 'PUBLIC' ELSE pg_get_userbyid(a.grantee) END AS role_name
      FROM aclexplode(COALESCE(p.proacl,acldefault('f',p.proowner))) a
      WHERE a.privilege_type='EXECUTE' AND NOT a.is_grantable AND a.grantor=p.proowner
    ) acl;
    IF p.proowner<>to_regrole(f.owner) OR encode(sha256(convert_to(p.prosrc,'UTF8')),'hex')<>f.hash
      OR p.prokind<>'f' OR p.proleakproof OR p.proisstrict OR p.pronargdefaults<>0 OR p.proparallel<>'u'
      OR p.prosecdef<>f.definer OR p.provolatile::text<>f.volatile
      OR (SELECT lanname FROM pg_language WHERE oid=p.prolang)<>f.language
      OR to_jsonb(p.proconfig) IS DISTINCT FROM f.config OR actual_acl IS DISTINCT FROM f.grantees
      OR EXISTS(SELECT 1 FROM aclexplode(COALESCE(p.proacl,acldefault('f',p.proowner))) a
        WHERE a.privilege_type<>'EXECUTE' OR a.is_grantable OR a.grantor<>p.proowner) THEN
      RAISE EXCEPTION 'bg1 new function contract' USING ERRCODE='P7901'; END IF;
    INSERT INTO pg_temp.bg1_new_objects VALUES('pg_proc'::regclass,p.oid);
  END LOOP;
  IF EXISTS(SELECT 1 FROM pg_proc p2 WHERE p2.pronamespace=schema_oid
    AND NOT EXISTS(SELECT 1 FROM pg_temp.bg1_new_objects o WHERE o.classid='pg_proc'::regclass AND o.objid=p2.oid)) THEN
    RAISE EXCEPTION 'bg1 additional function' USING ERRCODE='P7901'; END IF;
  IF (SELECT jsonb_agg(c.relname ORDER BY c.relname) FROM pg_class c WHERE c.relnamespace=schema_oid AND c.relkind='r')
    IS DISTINCT FROM (SELECT jsonb_agg(n ORDER BY n) FROM jsonb_array_elements_text(approved->'tables') n) THEN
    RAISE EXCEPTION 'bg1 table inventory' USING ERRCODE='P7901'; END IF;
  IF EXISTS(SELECT 1 FROM pg_class c WHERE c.relnamespace=schema_oid AND c.relkind='r' AND (
    c.relowner<>'postgres'::regrole OR NOT c.relrowsecurity OR NOT c.relforcerowsecurity
    OR EXISTS(SELECT 1 FROM aclexplode(COALESCE(c.relacl,acldefault('r',c.relowner))) a WHERE a.grantee<>'postgres'::regrole OR a.grantor<>'postgres'::regrole OR a.is_grantable)
    OR (SELECT count(*) FROM pg_policy p2 WHERE p2.polrelid=c.oid)<>1
    OR NOT EXISTS(SELECT 1 FROM pg_policy p2 WHERE p2.polrelid=c.oid AND p2.polname='owner_only'
      AND p2.polroles=ARRAY['postgres'::regrole::oid] AND p2.polpermissive AND p2.polcmd='*'
      AND pg_get_expr(p2.polqual,p2.polrelid)='true' AND pg_get_expr(p2.polwithcheck,p2.polrelid)='true'))) THEN
    RAISE EXCEPTION 'bg1 private table authority' USING ERRCODE='P7901'; END IF;
  INSERT INTO pg_temp.bg1_new_objects VALUES('pg_namespace'::regclass,schema_oid);
  INSERT INTO pg_temp.bg1_new_objects
    SELECT 'pg_class'::regclass,c.oid FROM pg_class c WHERE c.relnamespace=schema_oid
    UNION SELECT 'pg_class'::regclass,c.reltoastrelid FROM pg_class c WHERE c.relnamespace=schema_oid AND c.reltoastrelid<>0
    UNION SELECT 'pg_class'::regclass,i.indexrelid FROM pg_index i JOIN pg_class c ON c.reltoastrelid=i.indrelid WHERE c.relnamespace=schema_oid;
  INSERT INTO pg_temp.bg1_new_objects
    SELECT 'pg_type'::regclass,t.oid FROM pg_type t WHERE t.typnamespace=schema_oid
      OR t.typrelid IN (SELECT objid FROM pg_temp.bg1_new_objects WHERE classid='pg_class'::regclass);
  INSERT INTO pg_temp.bg1_new_objects
    SELECT 'pg_constraint'::regclass,c.oid FROM pg_constraint c WHERE c.conrelid IN (SELECT objid FROM pg_temp.bg1_new_objects WHERE classid='pg_class'::regclass)
    UNION SELECT 'pg_trigger'::regclass,t.oid FROM pg_trigger t WHERE t.tgrelid IN (SELECT objid FROM pg_temp.bg1_new_objects WHERE classid='pg_class'::regclass)
    UNION SELECT 'pg_policy'::regclass,p2.oid FROM pg_policy p2 WHERE p2.polrelid IN (SELECT objid FROM pg_temp.bg1_new_objects WHERE classid='pg_class'::regclass)
    UNION SELECT 'pg_attrdef'::regclass,d.oid FROM pg_attrdef d WHERE d.adrelid IN (SELECT objid FROM pg_temp.bg1_new_objects WHERE classid='pg_class'::regclass);

  FOR f IN SELECT * FROM jsonb_to_recordset(approved->'replacements') AS x(signature text,hash text) LOOP
    SELECT * INTO STRICT p FROM pg_proc WHERE oid=to_regprocedure(f.signature);
    IF encode(sha256(convert_to(p.prosrc,'UTF8')),'hex')<>f.hash
      OR NOT before_value ? ('function:'||p.oid)
      OR (after_value->('function:'||p.oid))-'definition' IS DISTINCT FROM (before_value->('function:'||p.oid))-'definition' THEN
      RAISE EXCEPTION 'bg1 replacement exceeds approved body' USING ERRCODE='P7901'; END IF;
  END LOOP;
  -- Every predecessor key remains byte-identical except the explicitly hashed
  -- replacement body. New graph edges must originate at an enumerated new
  -- object; incoming foreign edges to old authority cannot be silently learned.
  FOR entry IN SELECT key,value FROM jsonb_each(before_value) LOOP
    IF after_value->entry.key IS NOT DISTINCT FROM entry.value THEN CONTINUE; END IF;
    IF entry.key LIKE 'function:%' AND EXISTS(SELECT 1 FROM jsonb_array_elements(approved->'replacements') a
      WHERE to_regprocedure(a->>'signature')::oid=split_part(entry.key,':',2)::oid)
      AND (after_value->entry.key)-'definition' IS NOT DISTINCT FROM entry.value-'definition' THEN CONTINUE; END IF;
    RAISE EXCEPTION 'bg1 predecessor graph changed' USING ERRCODE='P7901';
  END LOOP;
  FOR entry IN SELECT key,value FROM jsonb_each(after_value) WHERE NOT before_value ? key LOOP
    object_class:=CASE split_part(entry.key,':',1)
      WHEN 'namespace' THEN 'pg_namespace'::regclass WHEN 'function' THEN 'pg_proc'::regclass
      WHEN 'relation' THEN 'pg_class'::regclass WHEN 'attribute' THEN 'pg_class'::regclass WHEN 'index' THEN 'pg_class'::regclass
      WHEN 'type' THEN 'pg_type'::regclass WHEN 'constraint' THEN 'pg_constraint'::regclass
      WHEN 'trigger' THEN 'pg_trigger'::regclass WHEN 'policy' THEN 'pg_policy'::regclass WHEN 'default' THEN 'pg_attrdef'::regclass
      WHEN 'dependency' THEN (entry.value->>'classid')::oid WHEN 'shared' THEN (entry.value->>'classid')::oid END;
    object_id:=CASE WHEN split_part(entry.key,':',1) IN ('dependency','shared') THEN (entry.value->>'objid')::oid
      ELSE split_part(entry.key,':',2)::oid END;
    IF object_class IS NULL OR NOT EXISTS(SELECT 1 FROM pg_temp.bg1_new_objects o WHERE o.classid=object_class AND o.objid=object_id) THEN
      RAISE EXCEPTION 'bg1 unreviewed additive graph edge' USING ERRCODE='P7901'; END IF;
  END LOOP;
  INSERT INTO official_v3_guard_private.baselines_v1(component,predecessor_digest,catalog)
    VALUES('all',encode(sha256(convert_to(before_value::text,'UTF8')),'hex'),after_value);
  SELECT value INTO STRICT before_value FROM pg_temp.bg1_before WHERE kind='hrs';
  INSERT INTO official_v3_guard_private.baselines_v1(component,predecessor_digest,catalog)
    VALUES('hrs',encode(sha256(convert_to(before_value::text,'UTF8')),'hex'),(/* HRS_CATALOG */));
  SELECT value INTO STRICT before_value FROM pg_temp.bg1_before WHERE kind='jobs';
  /* JOBS_CATALOG */
  result_value:=result_value||jsonb_build_object('package-context',before_value->'package-context');
  INSERT INTO official_v3_guard_private.baselines_v1(component,predecessor_digest,catalog)
    VALUES('jobs',encode(sha256(convert_to(before_value::text,'UTF8')),'hex'),result_value);
END $exact_delta$;

DO $certify_existing$
DECLARE component_value text; content_value text; original_value jsonb; entry_value jsonb; instant timestamptz:=clock_timestamp();
BEGIN
  PERFORM official_v3_guard_private.check_hma_v1();
  PERFORM official_v3_guard_private.check_s1_v1();
  PERFORM official_v3_guard_private.check_jobs_v1();
  PERFORM official_v3_guard_private.check_hrs_v1();
  FOREACH component_value IN ARRAY ARRAY['hma','s1','jobs'] LOOP
    content_value:=official_v3_guard_private.content_digest_v1(component_value);
    SELECT value INTO STRICT original_value FROM pg_temp.bg1_before WHERE kind=component_value||'-content';
    IF to_jsonb(content_value) IS DISTINCT FROM original_value THEN RAISE EXCEPTION 'bg1 historical data changed' USING ERRCODE='P7901'; END IF;
    entry_value:=jsonb_build_object('component',component_value,'generation',1,'before_digest',NULL,
      'after_digest',content_value,'predecessor_hash',NULL,'recorded_at',instant);
    INSERT INTO official_v3_guard_private.certificate_history_v1 VALUES(component_value,1,NULL,content_value,NULL,instant,
      encode(sha256(convert_to('bg1-certificate:v1:'||entry_value::text,'UTF8')),'hex'));
    INSERT INTO official_v3_guard_private.certificates_v1 VALUES(component_value,1,content_value);
  END LOOP;
  SELECT value INTO STRICT original_value FROM pg_temp.bg1_before WHERE kind='hrs-content';
  IF to_jsonb(official_v3_guard_private.hrs_certificate_v1()) IS DISTINCT FROM original_value THEN
    RAISE EXCEPTION 'bg1 original HRS certificate changed' USING ERRCODE='P7901'; END IF;
  PERFORM official_v3_guard_private.check_certificates_v1();
  PERFORM official_v3_guard_private.check_retirements_v1();
  PERFORM official_v3_guard_private.check_control_v1();
  PERFORM official_v3_guard_private.assert_catalog_v1();
  IF EXISTS(SELECT 1 FROM pg_stat_activity a JOIN pg_roles r ON r.oid=a.usesysid
    WHERE a.pid<>pg_backend_pid() AND (r.rolname IN ('ot_v3_result_writer','ot_v3_result_reader','ot_v3_result_verifier')
      OR EXISTS(SELECT 1 FROM pg_auth_members m JOIN pg_roles role_row ON role_row.oid=m.roleid WHERE m.member=r.oid
        AND role_row.rolname IN ('ot_v3_jobs_caller','ot_v3_intake_caller','ot_v3_method_reader')))) THEN
    RAISE EXCEPTION 'bg1 final quiescence refusal' USING ERRCODE='P7901'; END IF;
END $certify_existing$;
