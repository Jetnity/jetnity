-- LOCAL-ONLY classification of the accepted account-count objects.
-- Returns one JSON object. Never a migration. Never hosted SQL.
-- States: FRESH | ALREADY_INSTALLED | INCOMPATIBLE
select jsonb_build_object(
  'state',
  case
    when not coalesce(inv.schema_exists, false)
     and not coalesce(inv.producer_exists, false)
     and not coalesce(inv.wrapper_exists, false)
      then 'FRESH'
    when coalesce(inv.schema_exists, false)
     and coalesce(inv.producer_ok, false)
     and coalesce(inv.wrapper_ok, false)
     and coalesce(inv.extra_object_count, 0) = 0
      then 'ALREADY_INSTALLED'
    else 'INCOMPATIBLE'
  end,
  'executor', current_user,
  'session_user', session_user,
  'inventory', to_jsonb(inv)
)
from (
  select
    exists(select 1 from pg_namespace where nspname = 'jetnity_reporting') as schema_exists,
    (
      select pg_get_userbyid(n.nspowner)
      from pg_namespace n
      where n.nspname = 'jetnity_reporting'
    ) as schema_owner,
    exists(
      select 1
      from pg_proc p
      join pg_namespace n on n.oid = p.pronamespace
      where n.nspname = 'jetnity_reporting'
        and p.proname = 'account_counts_v1'
        and p.pronargs = 0
    ) as producer_exists,
    exists(
      select 1
      from pg_proc p
      join pg_namespace n on n.oid = p.pronamespace
      where n.nspname = 'public'
        and p.proname = 'admin_account_counts_v1'
        and p.pronargs = 0
    ) as wrapper_exists,
    (
      select count(*)::int
      from (
        select p.oid
        from pg_proc p
        join pg_namespace n on n.oid = p.pronamespace
        where n.nspname = 'jetnity_reporting'
          and not (p.proname = 'account_counts_v1' and p.pronargs = 0)
        union all
        select c.oid
        from pg_class c
        join pg_namespace n on n.oid = c.relnamespace
        where n.nspname = 'jetnity_reporting'
          and c.relkind in ('r', 'v', 'm', 'S', 'p')
      ) extra
    ) as extra_object_count,
    (
      select jsonb_agg(jsonb_build_object(
        'for_role', pg_get_userbyid(d.defaclrole),
        'objtype', d.defaclobjtype,
        'acl', d.defaclacl::text
      ) order by pg_get_userbyid(d.defaclrole), d.defaclobjtype)
      from pg_default_acl d
      join pg_namespace n on n.oid = d.defaclnamespace
      where n.nspname = 'jetnity_reporting'
    ) as default_privileges,
    (
      select
        pg_get_userbyid(p.proowner) = 'postgres'
        and p.prosecdef is true
        and p.provolatile = 's'
        and p.pronargs = 0
        and pg_get_function_identity_arguments(p.oid) = ''
        and coalesce(p.proconfig, array[]::text[]) @> array['search_path=pg_catalog']
        and (
          coalesce(p.proconfig, array[]::text[]) @> array['TimeZone=UTC']
          or coalesce(p.proconfig, array[]::text[]) @> array['timezone=UTC']
        )
        and pg_get_functiondef(p.oid) ilike '%interval ''720 hours''%'
        and pg_get_functiondef(p.oid) ilike '%42501%'
        and pg_get_functiondef(p.oid) ilike '%darf_konten_verwalten%'
        and pg_get_functiondef(p.oid) not ilike '%execute format%'
        and has_function_privilege('authenticated', p.oid, 'EXECUTE')
        and not has_function_privilege('anon', p.oid, 'EXECUTE')
        and not has_function_privilege('service_role', p.oid, 'EXECUTE')
        and not exists (
          select 1
          from unnest(coalesce(p.proacl, acldefault('f', p.proowner))) as acl
          where acl::text like '=X/%'
        )
      from pg_proc p
      join pg_namespace n on n.oid = p.pronamespace
      where n.nspname = 'jetnity_reporting'
        and p.proname = 'account_counts_v1'
        and p.pronargs = 0
    ) as producer_ok,
    (
      select
        pg_get_userbyid(p.proowner) not in ('anon', 'authenticated', 'service_role')
        and p.prosecdef is false
        and p.provolatile = 's'
        and p.pronargs = 0
        and pg_get_function_identity_arguments(p.oid) = ''
        and coalesce(p.proconfig, array[]::text[]) @> array['search_path=pg_catalog']
        and pg_get_functiondef(p.oid) ilike '%jetnity_reporting.account_counts_v1()%'
        and pg_get_functiondef(p.oid) ilike '%btrim%'
        and has_function_privilege('authenticated', p.oid, 'EXECUTE')
        and not has_function_privilege('anon', p.oid, 'EXECUTE')
        and not has_function_privilege('service_role', p.oid, 'EXECUTE')
        and not exists (
          select 1
          from unnest(coalesce(p.proacl, acldefault('f', p.proowner))) as acl
          where acl::text like '=X/%'
        )
      from pg_proc p
      join pg_namespace n on n.oid = p.pronamespace
      where n.nspname = 'public'
        and p.proname = 'admin_account_counts_v1'
        and p.pronargs = 0
    ) as wrapper_ok,
    (
      select pg_get_userbyid(p.proowner)
      from pg_proc p
      join pg_namespace n on n.oid = p.pronamespace
      where n.nspname = 'jetnity_reporting'
        and p.proname = 'account_counts_v1'
        and p.pronargs = 0
    ) as producer_owner,
    (
      select pg_get_userbyid(p.proowner)
      from pg_proc p
      join pg_namespace n on n.oid = p.pronamespace
      where n.nspname = 'public'
        and p.proname = 'admin_account_counts_v1'
        and p.pronargs = 0
    ) as wrapper_owner,
    exists(select 1 from pg_roles where rolname = 'jetnity_reporting_owner') as unexpected_privilege_role
) inv;
