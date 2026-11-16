-- Read-only native metadata evidence. Does not invoke a command, audit or guard.
-- It is safe to inspect an absent candidate: absence remains absence, not PASS.
SELECT jsonb_build_object(
  'schema', 'jetnity.admin-editorial-cms.native.v1',
  'namespace_present', to_regnamespace('jetnity_cms_private') IS NOT NULL,
  'tables', coalesce((SELECT jsonb_agg(jsonb_build_object(
    'name', c.relname, 'owner', pg_get_userbyid(c.relowner),
    'rls', c.relrowsecurity, 'force_rls', c.relforcerowsecurity,
    'anon_select', has_table_privilege('anon', c.oid, 'SELECT'),
    'authenticated_select', has_table_privilege('authenticated', c.oid, 'SELECT'),
    'authenticated_insert', has_table_privilege('authenticated', c.oid, 'INSERT'),
    'authenticated_update', has_table_privilege('authenticated', c.oid, 'UPDATE'),
    'authenticated_delete', has_table_privilege('authenticated', c.oid, 'DELETE'),
    'service_select', has_table_privilege('service_role', c.oid, 'SELECT')
  ) ORDER BY c.relname) FROM pg_class c JOIN pg_namespace n ON n.oid = c.relnamespace
    WHERE n.nspname = 'jetnity_cms_private' AND c.relkind = 'r'), '[]'::jsonb),
  'public_functions', coalesce((SELECT jsonb_agg(jsonb_build_object(
    'name', p.proname, 'arguments', pg_get_function_identity_arguments(p.oid),
    'owner', pg_get_userbyid(p.proowner), 'security_definer', p.prosecdef,
    'settings', p.proconfig, 'anon_execute', has_function_privilege('anon', p.oid, 'EXECUTE'),
    'authenticated_execute', has_function_privilege('authenticated', p.oid, 'EXECUTE'),
    'service_execute', has_function_privilege('service_role', p.oid, 'EXECUTE')
  ) ORDER BY p.proname) FROM pg_proc p JOIN pg_namespace n ON n.oid = p.pronamespace
    WHERE n.nspname = 'public' AND p.proname IN ('admin_cms_inspiration_command_v1',
      'admin_cms_inspiration_read_v1', 'admin_cms_inspiration_confirm_v1', 'cms_inspiration_published_v1')), '[]'::jsonb)
) AS native_metadata;
