-- Read-only proof for the already-installed Dev reader and post-installation Production.
-- No fixtures, writes, fake JWT, guard execution or private content in the output.
BEGIN READ ONLY;
SET LOCAL search_path = pg_catalog, pg_temp;
SET LOCAL lock_timeout = '1s';
SET LOCAL statement_timeout = '3s';
DO $cms_public_reader_readback$
DECLARE reader oid; payload jsonb; item jsonb; expected_count bigint;
BEGIN
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
  SELECT public.cms_inspiration_published_v2() INTO payload;
  IF (SELECT array_agg(k ORDER BY k) FROM jsonb_object_keys(payload) k)
      IS DISTINCT FROM ARRAY['items','schema']::text[]
    OR payload->'schema' IS DISTINCT FROM '1'::jsonb
    OR jsonb_typeof(payload->'items') IS DISTINCT FROM 'array' THEN
    RAISE EXCEPTION 'CMS reader response envelope invalid';
  END IF;
  SELECT count(*) INTO expected_count FROM jetnity_cms_private.inspiration_entries_v1
    WHERE NOT archived AND published_revision IS NOT NULL;
  IF jsonb_array_length(payload->'items') <> expected_count
    OR (SELECT count(DISTINCT value->>'entryId') FROM jsonb_array_elements(payload->'items')) <> expected_count THEN
    RAISE EXCEPTION 'CMS reader omitted or duplicated a current publication';
  END IF;
  FOR item IN SELECT value FROM jsonb_array_elements(payload->'items') LOOP
    IF (SELECT array_agg(k ORDER BY k) FROM jsonb_object_keys(item) k)
        IS DISTINCT FROM ARRAY['content','entryId','publishedAt','revision']::text[]
      OR NOT EXISTS (SELECT 1 FROM jetnity_cms_private.inspiration_entries_v1 e
          JOIN jetnity_cms_private.inspiration_revisions_v1 r
            ON r.entry_id=e.entry_id AND r.revision=e.published_revision
        WHERE e.entry_id=item->>'entryId' AND NOT e.archived
          AND e.published_revision::text=item->>'revision'
          AND r.content=item->'content'
          AND jetnity_cms_private.timestamp_v1(e.published_at)=item->>'publishedAt')
      OR (SELECT array_agg(k ORDER BY k) FROM jsonb_object_keys(item->'content') k)
        IS DISTINCT FROM ARRAY['beschreibung','country','entryId','idea','image','locale','name','themen']::text[] THEN
      RAISE EXCEPTION 'CMS reader returned something other than the exact public snapshot';
    END IF;
  END LOOP;
END $cms_public_reader_readback$;

SELECT 'cms-public-reader-release-20261121' AS release,
  encode(sha256(convert_to(p.prosrc,'UTF8')),'hex') AS reader_body_sha256,
  pg_get_userbyid(p.proowner) AS owner, l.lanname AS language,
  p.prosecdef AS security_definer, p.provolatile AS volatility, p.proconfig AS settings,
  has_function_privilege('anon',p.oid,'EXECUTE') AS anon_execute,
  NOT EXISTS (SELECT 1 FROM pg_shdepend d WHERE d.classid='pg_proc'::regclass
    AND d.objid=p.oid AND d.deptype='a') AS no_role_acl_dependencies
FROM pg_proc p JOIN pg_language l ON l.oid=p.prolang
WHERE p.oid='public.cms_inspiration_published_v2()'::regprocedure;

-- This fingerprint can be compared immediately before/after install/rollback.
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
  )::text, 'UTF8')), 'hex') AS protected_catalog_sha256;

-- Real SQL role, no synthetic claims: PUBLIC permission must suffice without Auth.
SET LOCAL ROLE anon;
WITH started AS MATERIALIZED (SELECT clock_timestamp() AS at),
result AS MATERIALIZED (SELECT public.cms_inspiration_published_v2() AS payload FROM started)
SELECT current_user AS caller, result.payload->>'schema' AS schema,
  jsonb_array_length(result.payload->'items') AS published_count,
  (SELECT jsonb_agg(jsonb_build_object('entryId',i->>'entryId','revision',i->>'revision')
    ORDER BY i->>'entryId') FROM jsonb_array_elements(result.payload->'items') i) AS publications,
  round((extract(epoch FROM clock_timestamp()-started.at)*1000)::numeric,2) AS elapsed_ms
FROM started CROSS JOIN result;
ROLLBACK;

