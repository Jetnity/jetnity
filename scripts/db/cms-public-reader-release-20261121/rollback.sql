-- First restore the previous application build/flag so v2 has no caller.
-- Removes only this exact v2 and refuses altered definitions, grants or dependencies.
-- Never disables a guard, restores content, or cascades to another object.
BEGIN;
SET LOCAL search_path = pg_catalog, pg_temp;
SET LOCAL lock_timeout = '3s';
SET LOCAL statement_timeout = '15s';
DO $cms_public_reader_rollback$
DECLARE reader oid; before_state text; after_state text;
BEGIN
  IF current_user <> 'postgres' THEN
    RAISE EXCEPTION 'CMS reader rollback requires existing postgres owner' USING ERRCODE='42501';
  END IF;
  SELECT p.oid INTO reader FROM pg_proc p JOIN pg_namespace n ON n.oid=p.pronamespace
    JOIN pg_language l ON l.oid=p.prolang
    WHERE n.nspname='public' AND p.proname='cms_inspiration_published_v2'
      AND p.pronargs=0 AND p.prokind='f' AND p.prorettype='jsonb'::regtype
      AND NOT p.proretset AND NOT p.proisstrict AND NOT p.proleakproof
      AND p.prosecdef AND p.provolatile='s' AND p.proparallel='u'
      AND p.proowner='postgres'::regrole AND l.lanname='sql'
      AND p.pronargdefaults=0 AND p.provariadic=0 AND p.prosupport=0
      AND p.procost=100 AND p.prorows=0 AND p.proacl IS NOT NULL
      AND p.proargnames IS NULL AND p.proallargtypes IS NULL AND p.proargmodes IS NULL
      AND p.proconfig=ARRAY['search_path=pg_catalog, pg_temp','TimeZone=UTC']::text[]
      AND encode(sha256(convert_to(p.prosrc,'UTF8')),'hex')
        = 'f72bc939e3aa134892973c80c99c19aeb010fd769bd89eabad71872f7673e65e';
  IF reader IS NULL THEN
    RAISE EXCEPTION 'CMS public reader definition or metadata changed; refuse operation';
  END IF;
  IF (SELECT count(*) FROM pg_proc p, LATERAL aclexplode(p.proacl) a WHERE p.oid=reader) <> 2
    OR NOT EXISTS (SELECT 1 FROM pg_proc p, LATERAL aclexplode(p.proacl) a
      WHERE p.oid=reader AND a.grantor='postgres'::regrole AND a.grantee=0
        AND a.privilege_type='EXECUTE' AND NOT a.is_grantable)
    OR NOT EXISTS (SELECT 1 FROM pg_proc p, LATERAL aclexplode(p.proacl) a
      WHERE p.oid=reader AND a.grantor='postgres'::regrole AND a.grantee='postgres'::regrole
        AND a.privilege_type='EXECUTE' AND NOT a.is_grantable)
    OR NOT has_function_privilege('anon',reader,'EXECUTE')
    OR NOT has_function_privilege('authenticated',reader,'EXECUTE')
    OR NOT has_function_privilege('service_role',reader,'EXECUTE')
    OR EXISTS (SELECT 1 FROM pg_shdepend d WHERE d.classid='pg_proc'::regclass
      AND d.objid=reader AND (d.refclassid <> 'pg_authid'::regclass
        OR d.refobjid <> 'postgres'::regrole OR d.deptype <> 'o'))
    OR EXISTS (SELECT 1 FROM pg_depend d WHERE d.classid='pg_proc'::regclass AND d.objid=reader
      AND NOT (d.objsubid=0 AND d.refclassid='pg_namespace'::regclass
        AND d.refobjid='public'::regnamespace AND d.refobjsubid=0 AND d.deptype='n')) THEN
    RAISE EXCEPTION 'CMS public reader privileges or dependencies changed; refuse operation';
  END IF;
  IF EXISTS (SELECT 1 FROM pg_depend d
    WHERE d.refclassid='pg_proc'::regclass AND d.refobjid=reader) THEN
    RAISE EXCEPTION 'CMS reader has dependent objects; rollback refuses removal';
  END IF;
  SELECT encode(sha256(convert_to(jsonb_build_object(
    'functions', (SELECT coalesce(jsonb_agg(to_jsonb(p) ORDER BY p.oid), '[]'::jsonb)
      FROM pg_proc p JOIN pg_namespace n ON n.oid=p.pronamespace
      WHERE n.nspname IN ('jetnity_cms_private','official_v3_guard_private')
        OR (n.nspname='public' AND (p.proname='cms_inspiration_published_v1'
          OR p.proname LIKE 'admin\_%' ESCAPE '\'
          OR p.proname LIKE 'official\_v3\_guard\_%' ESCAPE '\'
          OR p.proname IN ('darf_inhalte_moderieren','aktuelles_admin_aal2')))),
    'cms_tables', (SELECT coalesce(jsonb_agg(jsonb_build_array(c.oid,c.relowner,c.relacl,
        c.relrowsecurity,c.relforcerowsecurity) ORDER BY c.oid), '[]'::jsonb)
      FROM pg_class c JOIN pg_namespace n ON n.oid=c.relnamespace
      WHERE n.nspname='jetnity_cms_private' AND c.relkind='r'),
    'roles', (SELECT jsonb_agg(to_jsonb(r) ORDER BY r.oid) FROM pg_roles r),
    'memberships', (SELECT coalesce(jsonb_agg(to_jsonb(m) ORDER BY m.oid), '[]'::jsonb)
      FROM pg_auth_members m),
    'role_dependencies', (SELECT coalesce(jsonb_agg(to_jsonb(d)
        ORDER BY d.dbid,d.classid,d.objid,d.objsubid,d.refclassid,d.refobjid,d.deptype), '[]'::jsonb)
      FROM pg_shdepend d WHERE d.refclassid='pg_authid'::regclass
        AND d.refobjid <> 'postgres'::regrole
        AND d.dbid IN (0,(SELECT oid FROM pg_database WHERE datname=current_database())))
  )::text, 'UTF8')), 'hex') INTO before_state;
  DROP FUNCTION public.cms_inspiration_published_v2() RESTRICT;
  SELECT encode(sha256(convert_to(jsonb_build_object(
    'functions', (SELECT coalesce(jsonb_agg(to_jsonb(p) ORDER BY p.oid), '[]'::jsonb)
      FROM pg_proc p JOIN pg_namespace n ON n.oid=p.pronamespace
      WHERE n.nspname IN ('jetnity_cms_private','official_v3_guard_private')
        OR (n.nspname='public' AND (p.proname='cms_inspiration_published_v1'
          OR p.proname LIKE 'admin\_%' ESCAPE '\'
          OR p.proname LIKE 'official\_v3\_guard\_%' ESCAPE '\'
          OR p.proname IN ('darf_inhalte_moderieren','aktuelles_admin_aal2')))),
    'cms_tables', (SELECT coalesce(jsonb_agg(jsonb_build_array(c.oid,c.relowner,c.relacl,
        c.relrowsecurity,c.relforcerowsecurity) ORDER BY c.oid), '[]'::jsonb)
      FROM pg_class c JOIN pg_namespace n ON n.oid=c.relnamespace
      WHERE n.nspname='jetnity_cms_private' AND c.relkind='r'),
    'roles', (SELECT jsonb_agg(to_jsonb(r) ORDER BY r.oid) FROM pg_roles r),
    'memberships', (SELECT coalesce(jsonb_agg(to_jsonb(m) ORDER BY m.oid), '[]'::jsonb)
      FROM pg_auth_members m),
    'role_dependencies', (SELECT coalesce(jsonb_agg(to_jsonb(d)
        ORDER BY d.dbid,d.classid,d.objid,d.objsubid,d.refclassid,d.refobjid,d.deptype), '[]'::jsonb)
      FROM pg_shdepend d WHERE d.refclassid='pg_authid'::regclass
        AND d.refobjid <> 'postgres'::regrole
        AND d.dbid IN (0,(SELECT oid FROM pg_database WHERE datname=current_database())))
  )::text, 'UTF8')), 'hex') INTO after_state;
  IF before_state IS DISTINCT FROM after_state
    OR to_regprocedure('public.cms_inspiration_published_v2()') IS NOT NULL THEN
    RAISE EXCEPTION 'CMS reader rollback changed a protected object';
  END IF;
END $cms_public_reader_rollback$;
COMMIT;

