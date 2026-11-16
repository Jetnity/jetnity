DO $admin_runtime_context$
BEGIN
  IF current_user<>'postgres' OR session_user<>current_user OR current_database()<>'postgres'
    OR current_setting('server_version_num')::integer/10000<>17
    OR current_setting('transaction_isolation') IS DISTINCT FROM 'read committed'
    OR current_setting('jetnity.admin_runtime_target',true) IS DISTINCT FROM 'dev:yfvbxvijcorffwxbxahl:ADMIN-RUNTIME-BG1-1'
    OR NOT EXISTS(SELECT 1 FROM pg_roles WHERE rolname='postgres' AND NOT rolsuper AND rolbypassrls)
    OR to_regclass('official_v3_guard_private.cycle4_attempt2_baseline_v1') IS NULL
    OR to_regclass('official_v3_guard_private.admin_runtime_baseline_v1') IS NOT NULL
    OR to_regnamespace('jetnity_reporting') IS NOT NULL OR to_regnamespace('jetnity_cms_private') IS NOT NULL
    OR to_regnamespace('jetnity_marketing_private') IS NOT NULL THEN
    RAISE EXCEPTION 'admin runtime exact unused Dev predecessor required' USING ERRCODE='P7931';
  END IF;
  -- Existing sender/package/checker order. Never stop or alter the scheduler.
  IF NOT pg_try_advisory_xact_lock(771106,31)
    OR NOT pg_try_advisory_xact_lock(771101,1) OR NOT pg_try_advisory_xact_lock(771102,1)
    OR NOT pg_try_advisory_xact_lock(771103,1) OR NOT pg_try_advisory_xact_lock(771104,1)
    OR NOT pg_try_advisory_xact_lock(771105,1) OR NOT pg_try_advisory_xact_lock(771106,1) THEN
    RAISE EXCEPTION 'admin runtime package operation already active' USING ERRCODE='P7931';
  END IF;
  PERFORM 1 FROM official_v3_guard_private.state_v1 WHERE singleton FOR UPDATE;
  IF NOT FOUND THEN RAISE EXCEPTION 'admin runtime missing guard state' USING ERRCODE='P7931'; END IF;
END $admin_runtime_context$;

CREATE TEMP TABLE admin_runtime_before(kind text PRIMARY KEY,value jsonb NOT NULL) ON COMMIT DROP;
CREATE TEMP TABLE admin_runtime_objects(classid oid,objid oid,PRIMARY KEY(classid,objid)) ON COMMIT DROP;
DO $admin_runtime_predecessor$
DECLARE expected record; actual pg_proc%ROWTYPE; old_catalog jsonb; expanded_catalog jsonb;
  item record; helper oid; old_table text; old_value jsonb;
BEGIN
  -- These are pinned source bodies, not values learned from the live database.
  FOR expected IN SELECT * FROM jsonb_to_recordset(/* PREDECESSOR_FUNCTIONS */)
    AS f(signature text,hash text) LOOP
    SELECT * INTO actual FROM pg_proc WHERE oid=to_regprocedure(expected.signature);
    IF NOT FOUND OR encode(sha256(convert_to(actual.prosrc,'UTF8')),'hex') IS DISTINCT FROM expected.hash THEN
      RAISE EXCEPTION 'admin runtime predecessor function changed: %',expected.signature USING ERRCODE='P7931';
    END IF;
  END LOOP;
  IF EXISTS(SELECT 1 FROM pg_proc p JOIN pg_namespace n ON n.oid=p.pronamespace
      WHERE n.nspname='public' AND p.proname=ANY(/* PUBLIC_NAMES */))
    OR EXISTS(SELECT 1 FROM pg_proc p WHERE p.pronamespace='official_v3_guard_private'::regnamespace
      AND p.proname='admin_runtime_guard_v1') THEN
    RAISE EXCEPTION 'admin runtime fresh function names required' USING ERRCODE='P7931';
  END IF;
  SELECT (/* ORIGINAL_CATALOG */) INTO old_catalog;
  IF old_catalog IS DISTINCT FROM (SELECT catalog FROM official_v3_guard_private.cycle4_attempt2_baseline_v1 WHERE singleton) THEN
    RAISE EXCEPTION 'admin runtime predecessor catalog mismatch' USING ERRCODE='P7905';
  END IF;
  PERFORM official_v3_guard_private.assert_catalog_v1();
  PERFORM official_v3_guard_private.require_open_v1();
  PERFORM official_v3_guard_private.check_control_v1();
  PERFORM official_v3_guard_private.check_hma_v1();
  PERFORM official_v3_guard_private.check_s1_v1();
  PERFORM official_v3_guard_private.check_jobs_v1();
  PERFORM official_v3_guard_private.check_hrs_v1();
  PERFORM official_v3_guard_private.check_certificates_v1();
  PERFORM official_v3_guard_private.check_retirements_v1();

  -- CMS and campaigns use one existing moderation helper not in the old
  -- finite namespace list. Its canonical body/authority is independently pinned
  -- before it and its existing dependency edges enter the successor catalog.
  helper:=to_regprocedure('public.darf_inhalte_moderieren()');
  SELECT * INTO actual FROM pg_proc WHERE oid=helper;
  IF NOT FOUND OR actual.proowner<>'postgres'::regrole OR actual.prosecdef
    OR actual.prokind<>'f' OR actual.prorettype<>'boolean'::regtype OR actual.proretset
    OR actual.prolang<>(SELECT oid FROM pg_language WHERE lanname='sql')
    OR actual.provolatile<>'s' OR actual.proparallel<>'s' OR actual.proisstrict OR actual.proleakproof
    OR actual.pronargs<>0 OR actual.pronargdefaults<>0 OR actual.provariadic<>0 OR actual.prosupport<>0
    OR actual.proconfig IS DISTINCT FROM ARRAY['search_path=pg_catalog']
    OR encode(sha256(convert_to(actual.prosrc,'UTF8')),'hex') IS DISTINCT FROM 'MODERATION_SHA256'
    OR (SELECT array_agg(a::text ORDER BY a::text) FROM unnest(actual.proacl) a)
      IS DISTINCT FROM ARRAY['authenticated=X/postgres','postgres=X/postgres','service_role=X/postgres'] THEN
    RAISE EXCEPTION 'admin runtime moderation authority changed' USING ERRCODE='P7931';
  END IF;
  SELECT (/* EXPANDED_CATALOG */) INTO expanded_catalog;
  FOR item IN SELECT key,value FROM jsonb_each(old_catalog) LOOP
    IF expanded_catalog->item.key IS DISTINCT FROM item.value THEN
      RAISE EXCEPTION 'admin runtime old catalog projection changed' USING ERRCODE='P7931';
    END IF;
  END LOOP;
  FOR item IN SELECT key,value FROM jsonb_each(expanded_catalog) WHERE NOT old_catalog ? key LOOP
    IF item.key='function:'||helper
      OR (item.key LIKE 'dependency:%' AND (
        ((item.value->>'classid')::oid='pg_proc'::regclass AND (item.value->>'objid')::oid=helper)
        OR ((item.value->>'refclassid')::oid='pg_proc'::regclass AND (item.value->>'refobjid')::oid=helper)))
      OR (item.key LIKE 'description:%' AND (item.value->>'classoid')::oid='pg_proc'::regclass
        AND (item.value->>'objoid')::oid=helper)
      -- The already verified helper's postgres owner edge was outside the
      -- predecessor's finite public-function list. It is preserved, not made.
      OR (item.key LIKE 'shared:%' AND (item.value->>'classid')::oid='pg_proc'::regclass
        AND (item.value->>'objid')::oid=helper AND (item.value->>'objsubid')::integer=0
        AND (item.value->>'dbid')::oid=(SELECT oid FROM pg_database WHERE datname=current_database())
        AND (item.value->>'refclassid')::oid='pg_authid'::regclass
        AND (item.value->>'refobjid')::oid='postgres'::regrole AND item.value->>'deptype'='o') THEN CONTINUE; END IF;
    RAISE EXCEPTION 'admin runtime unreviewed old catalog expansion: %',item.key USING ERRCODE='P7931';
  END LOOP;
  INSERT INTO pg_temp.admin_runtime_before VALUES('catalog',expanded_catalog),('original_catalog',old_catalog),
    ('roles',(SELECT jsonb_agg(to_jsonb(r) ORDER BY r.oid) FROM pg_roles r)),
    ('memberships',COALESCE((SELECT jsonb_agg(to_jsonb(m) ORDER BY m.oid) FROM pg_auth_members m),'[]'::jsonb)),
    ('global_shared',COALESCE((SELECT jsonb_agg(to_jsonb(d) ORDER BY d.dbid,d.classid,d.objid,d.objsubid,d.refclassid,d.refobjid,d.deptype) FROM pg_shdepend d),'[]'::jsonb));
  -- Freeze and preserve every existing BG1 evidence row. No original row,
  -- incident, generation, retirement, certificate or baseline is rewritten.
  FOR old_table IN SELECT format('%I.%I',n.nspname,c.relname) FROM pg_class c
    JOIN pg_namespace n ON n.oid=c.relnamespace WHERE n.nspname='official_v3_guard_private'
      AND c.relkind='r' ORDER BY c.oid LOOP
    EXECUTE format('LOCK TABLE %s IN SHARE MODE',old_table::regclass);
    EXECUTE format('SELECT jsonb_build_object(''count'',count(*),''digest'',encode(sha256(convert_to(COALESCE(string_agg(encode(sha256(convert_to(to_jsonb(t)::text,''UTF8'')),''hex''),'''' ORDER BY to_jsonb(t)::text COLLATE "C"),''''),''UTF8'')),''hex'')) FROM %s t',old_table::regclass) INTO old_value;
    INSERT INTO pg_temp.admin_runtime_before VALUES('table:'||old_table,old_value);
  END LOOP;
END $admin_runtime_predecessor$;
