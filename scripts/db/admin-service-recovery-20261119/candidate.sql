-- Admin/CMS and KI reliability, 19.11.2026.
-- Owner-approved scope: Dev install only. Production: UNAPPLIED until explicit Owner release.
-- Does not touch the Official-Truth guard or its protected catalog baseline.
BEGIN;
SET LOCAL search_path = pg_catalog, pg_temp;
SET LOCAL lock_timeout = '3s';
SET LOCAL statement_timeout = '15s';

DO $admin_service_preflight$
DECLARE alte_funktion text;
BEGIN
  IF to_regprocedure('public.cms_inspiration_published_v2()') IS NOT NULL THEN
    RAISE EXCEPTION 'cms reader v2 already exists: use separate reviewed upgrade path';
  END IF;
  IF to_regclass('jetnity_cms_private.inspiration_entries_v1') IS NULL
     OR to_regclass('jetnity_cms_private.inspiration_revisions_v1') IS NULL THEN
    RAISE EXCEPTION 'cms published-only prerequisites unavailable';
  END IF;
  alte_funktion := pg_get_functiondef('public.cms_inspiration_published_v1()'::regprocedure);
  IF (length(alte_funktion) - length(replace(alte_funktion, 'admin_runtime_guard_v1', ''))) /
       length('admin_runtime_guard_v1') <> 2 THEN
    RAISE EXCEPTION 'cms v1 definition drift; do not touch protected function';
  END IF;
  IF has_function_privilege('service_role',
      'public.modell_kontingent_beanspruchen(text,text,text,uuid)', 'EXECUTE') IS NOT TRUE
     OR has_function_privilege('anon',
      'public.modell_kontingent_beanspruchen(text,text,text,uuid)', 'EXECUTE') IS TRUE
     OR has_function_privilege('authenticated',
      'public.modell_kontingent_beanspruchen(text,text,text,uuid)', 'EXECUTE') IS TRUE THEN
    RAISE EXCEPTION 'KI quota RPC grant drift';
  END IF;
END $admin_service_preflight$;

-- Public reader is a separate, narrowly bounded, publication-only endpoint.
-- The existing protected v1 function and all Official-Truth fingerprints stay unchanged.
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
ALTER FUNCTION public.cms_inspiration_published_v2() OWNER TO postgres;
REVOKE ALL ON FUNCTION public.cms_inspiration_published_v2() FROM PUBLIC, anon, authenticated, service_role;
-- Deliberate PUBLIC grant for this *published-only*, side-effect-free endpoint.
-- Per-role anon/authenticated grants add pg_shdepend role dependencies watched
-- by the shared integrity catalog, causing a guard incident. PUBLIC is the
-- correct lowest common API audience for content that is already public and
-- creates no individual-role shdepend rows. Never use this on admin writers.
GRANT EXECUTE ON FUNCTION public.cms_inspiration_published_v2() TO PUBLIC;

-- Keep the single authoritative quota, limits, lock and service-only privileges.
-- Only replace five expected user-facing resource-limit SQLSTATEs so PostgREST
-- returns 429 instead of treating a correctly enforced limit as HTTP 500.
DO $admin_service_quota$
DECLARE f regprocedure := 'public.modell_kontingent_beanspruchen(text,text,text,uuid)'::regprocedure;
        src text;
BEGIN
  SELECT pg_get_functiondef(p.oid) INTO src
    FROM pg_proc p WHERE p.oid = f::oid AND p.prosecdef
       AND pg_get_userbyid(p.proowner) = 'postgres';
  IF src IS NULL
     OR (length(src) - length(replace(src, 'errcode = ''53400''', ''))) /
          length('errcode = ''53400''') <> 5
     OR src !~* 'SECURITY DEFINER'
     OR src !~ 'pg_advisory_xact_lock' THEN
    RAISE EXCEPTION 'KI quota body drift: refuse partial or unsafe rewrite';
  END IF;
  EXECUTE replace(src, 'errcode = ''53400''', 'errcode = ''PT429''');
  IF NOT has_function_privilege('service_role', f, 'EXECUTE')
    OR has_function_privilege('anon', f, 'EXECUTE')
    OR has_function_privilege('authenticated', f, 'EXECUTE') THEN
    RAISE EXCEPTION 'KI quota grant changed after rewrite';
  END IF;
END $admin_service_quota$;

DO $admin_service_readback$
DECLARE v2 regprocedure := 'public.cms_inspiration_published_v2()'::regprocedure;
        quota regprocedure := 'public.modell_kontingent_beanspruchen(text,text,text,uuid)'::regprocedure;
        cms text; model text;
BEGIN
  SELECT pg_get_functiondef(v2::oid), pg_get_functiondef(quota::oid) INTO cms, model;
  IF cms ~* '(pg_advisory|admin_runtime_guard|official_v3_guard)'
     OR NOT has_function_privilege('anon',v2,'EXECUTE')
     OR NOT has_function_privilege('authenticated',v2,'EXECUTE')
     OR EXISTS(SELECT 1 FROM pg_shdepend d WHERE d.classid='pg_proc'::regclass
          AND d.objid=v2::oid AND d.deptype='a'
          AND d.refobjid IN ('anon'::regrole, 'authenticated'::regrole))
     OR (length(model)-length(replace(model, 'errcode = ''PT429''', ''))) /
          length('errcode = ''PT429''') <> 5 THEN
    RAISE EXCEPTION 'Admin public read / KI quota readback failed';
  END IF;
END $admin_service_readback$;
COMMIT;
