-- Provider transaction body. Exactly install.sql without its outer transaction.
-- CMS public reader only, 21.11.2026. No KI quota, Auth, Admin writer or BG1 change.
-- Run in one transaction on the explicitly selected, Owner-approved project.
-- Refuses an existing v2. Already-installed Dev uses readback.sql; never replace it.
SET LOCAL search_path = pg_catalog, pg_temp;
SET LOCAL lock_timeout = '3s';
SET LOCAL statement_timeout = '15s';

DO $cms_public_reader_release$
DECLARE before_state text; after_state text; old_reader text; reader oid;
BEGIN
  IF current_user <> 'postgres' THEN
    RAISE EXCEPTION 'CMS reader installation requires existing postgres owner' USING ERRCODE='42501';
  END IF;
  IF to_regprocedure('public.cms_inspiration_published_v2()') IS NOT NULL THEN
    RAISE EXCEPTION 'CMS reader v2 already exists; use readback, never replace an installed reader';
  END IF;
  IF to_regclass('jetnity_cms_private.inspiration_entries_v1') IS NULL
    OR to_regclass('jetnity_cms_private.inspiration_revisions_v1') IS NULL
    OR to_regclass('jetnity_cms_private.inspiration_operations_v1') IS NULL
    OR to_regprocedure('jetnity_cms_private.timestamp_v1(timestamp with time zone)') IS NULL
    OR to_regprocedure('public.admin_cms_inspiration_command_v1(uuid,text,bigint,text,jsonb)') IS NULL
    OR to_regprocedure('public.admin_cms_inspiration_read_v1(text,bigint,bigint,integer)') IS NULL
    OR to_regprocedure('public.admin_cms_inspiration_confirm_v1(uuid)') IS NULL THEN
    RAISE EXCEPTION 'CMS reader prerequisites unavailable';
  END IF;
  SELECT pg_get_functiondef(p.oid) INTO old_reader FROM pg_proc p
    WHERE p.oid=to_regprocedure('public.cms_inspiration_published_v1()')
      AND p.proowner='postgres'::regrole AND p.prosecdef AND p.prorettype='jsonb'::regtype;
  IF old_reader IS NULL
    OR (length(old_reader)-length(replace(old_reader,'admin_runtime_guard_v1','')))
        / length('admin_runtime_guard_v1') <> 2 THEN
    RAISE EXCEPTION 'Protected CMS v1 predecessor drift; do not change or bypass Admin guards';
  END IF;
  IF EXISTS (SELECT 1 FROM pg_class c JOIN pg_namespace n ON n.oid=c.relnamespace
      WHERE n.nspname='jetnity_cms_private' AND c.relkind='r'
        AND (c.relowner <> 'postgres'::regrole OR NOT c.relrowsecurity OR NOT c.relforcerowsecurity))
    OR has_schema_privilege('anon','jetnity_cms_private','USAGE')
    OR has_schema_privilege('authenticated','jetnity_cms_private','USAGE')
    OR has_function_privilege('anon',
      'public.admin_cms_inspiration_command_v1(uuid,text,bigint,text,jsonb)','EXECUTE') THEN
    RAISE EXCEPTION 'Existing private CMS boundary drift';
  END IF;

  -- Inspect bounded catalogs only; do not run the heavy guard or acquire its locks.
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

  EXECUTE $cms_reader_definition$
CREATE FUNCTION public.cms_inspiration_published_v2() RETURNS jsonb
LANGUAGE sql STABLE SECURITY DEFINER
SET search_path = pg_catalog, pg_temp
SET timezone = 'UTC' AS $cms_public_reader$
  SELECT jsonb_build_object('schema', 1, 'items', coalesce(jsonb_agg(jsonb_build_object(
    'entryId', e.entry_id, 'revision', r.revision::text, 'content', r.content,
    'publishedAt', jetnity_cms_private.timestamp_v1(e.published_at)) ORDER BY e.sort_order), '[]'::jsonb))
  FROM jetnity_cms_private.inspiration_entries_v1 e
  JOIN jetnity_cms_private.inspiration_revisions_v1 r
    ON r.entry_id = e.entry_id AND r.revision = e.published_revision
  WHERE NOT e.archived AND e.published_revision IS NOT NULL
$cms_public_reader$;
$cms_reader_definition$;
  ALTER FUNCTION public.cms_inspiration_published_v2() OWNER TO postgres;
  REVOKE ALL ON FUNCTION public.cms_inspiration_published_v2() FROM PUBLIC, anon, authenticated, service_role;
  -- Deliberate PUBLIC grant: this endpoint exposes only already-public snapshots.
  -- Per-role grants would add pg_shdepend rows watched by the existing guard.
  -- This does not grant direct table access or relax any Admin writer.
  GRANT EXECUTE ON FUNCTION public.cms_inspiration_published_v2() TO PUBLIC;

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
  IF before_state IS DISTINCT FROM after_state THEN
    RAISE EXCEPTION 'CMS public reader changed a protected function, role, table boundary or role dependency';
  END IF;
END $cms_public_reader_release$;

