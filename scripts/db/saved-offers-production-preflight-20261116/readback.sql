-- READ ONLY. Not an installer, migration, grant, rebaseline or Owner approval.
BEGIN READ ONLY;
SET LOCAL statement_timeout='5s';
SELECT jsonb_build_object(
  'table_present',to_regclass('public.saved_offers') IS NOT NULL,
  'migration_entries',(SELECT count(*) FROM supabase_migrations.schema_migrations WHERE version='20261113173644'),
  'rls',(SELECT relrowsecurity FROM pg_class WHERE oid=to_regclass('public.saved_offers')),
  'policies',(SELECT count(*) FROM pg_policy WHERE polrelid=to_regclass('public.saved_offers')),
  'anon_table_privileges',(SELECT count(*) FROM information_schema.table_privileges WHERE table_schema='public' AND table_name='saved_offers' AND grantee='anon'),
  'authenticated_update_columns',(SELECT count(*) FROM information_schema.column_privileges WHERE table_schema='public' AND table_name='saved_offers' AND grantee='authenticated' AND privilege_type='UPDATE'),
  'bg1_present',to_regprocedure('official_v3_guard_private.assert_catalog_v1()') IS NOT NULL,
  'meaning','inventory_only_not_permission_or_isolation_pass'
) AS saved_offers_preflight;
COMMIT;
