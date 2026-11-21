-- Read-only catalog fingerprint. No guard invocation and no private content.
SET LOCAL search_path = pg_catalog, pg_temp;
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

