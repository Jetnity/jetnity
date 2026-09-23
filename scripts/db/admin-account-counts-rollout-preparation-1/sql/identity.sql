-- LOCAL-ONLY shared identity contract for the accepted account-count package.
-- Single source for classify / verify / rollback. Never a migration. Never hosted SQL.
--
-- Pinned pg_get_functiondef SHA-256 values were captured from a disposable
-- PostgreSQL 16.15 install of the unchanged accepted sources. A different
-- major engine that pretty-prints differently is a BLOCKED mismatch, not a
-- repair. States: FRESH | ALREADY_INSTALLED | REVOKED_EXACT | INCOMPATIBLE
--
-- identity_core_ok is exact definition/owner/schema/ADP/dependency identity
-- plus "no unexpected ACL grantee". The only permitted ACL delta between
-- ALREADY_INSTALLED and REVOKED_EXACT is this package's explicit REVOKE of
-- authenticated EXECUTE/USAGE (PUBLIC/anon/service_role stay revoked).
select jsonb_build_object(
  'state',
  case
    when not coalesce(inv.schema_exists, false)
     and not coalesce(inv.producer_exists, false)
     and not coalesce(inv.wrapper_exists, false)
      then 'FRESH'
    when coalesce(inv.identity_core_ok, false)
     and coalesce(inv.acl_granted_exact, false)
      then 'ALREADY_INSTALLED'
    when coalesce(inv.identity_core_ok, false)
     and coalesce(inv.acl_revoked_exact, false)
      then 'REVOKED_EXACT'
    else 'INCOMPATIBLE'
  end,
  'executor', current_user,
  'session_user', session_user,
  'inventory', to_jsonb(inv)
)
from (
  select
    raw.*,
    (
      coalesce(raw.producer_identity_ok, false)
      and coalesce(raw.wrapper_identity_ok, false)
      and coalesce(raw.schema_owner_ok, false)
      and coalesce(raw.default_privileges_ok, false)
      and coalesce(raw.acl_no_unexpected_grantee, false)
      and coalesce(raw.extra_object_count, 0) = 0
      and coalesce(raw.unexpected_deps, 0) = 0
      and not coalesce(raw.unexpected_privilege_role, false)
    ) as identity_core_ok,
    (
      coalesce(raw.producer_exists, false)
      and coalesce(raw.wrapper_exists, false)
      and coalesce(raw.schema_exists, false)
      and coalesce(raw.authenticated_execute_granted, false)
      and coalesce(raw.authenticated_schema_usage_granted, false)
    ) as acl_granted_exact,
    (
      coalesce(raw.producer_exists, false)
      and coalesce(raw.wrapper_exists, false)
      and coalesce(raw.schema_exists, false)
      and coalesce(raw.authenticated_execute_revoked, false)
      and coalesce(raw.authenticated_schema_usage_revoked, false)
    ) as acl_revoked_exact
  from (
    select
      exists(select 1 from pg_namespace where nspname = 'jetnity_reporting') as schema_exists,
      (
        select pg_get_userbyid(n.nspowner)
        from pg_namespace n
        where n.nspname = 'jetnity_reporting'
      ) as schema_owner,
      exists(
        select 1 from pg_proc p
        join pg_namespace n on n.oid = p.pronamespace
        where n.nspname = 'jetnity_reporting'
          and p.proname = 'account_counts_v1'
          and p.pronargs = 0
      ) as producer_exists,
      exists(
        select 1 from pg_proc p
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
        (
          select count(*)::int
          from pg_depend d
          where d.refobjid in (
              (select p.oid from pg_proc p join pg_namespace n on n.oid = p.pronamespace
                where n.nspname = 'jetnity_reporting' and p.proname = 'account_counts_v1' and p.pronargs = 0),
              (select p.oid from pg_proc p join pg_namespace n on n.oid = p.pronamespace
                where n.nspname = 'public' and p.proname = 'admin_account_counts_v1' and p.pronargs = 0)
            )
            and d.classid = 'pg_proc'::regclass
            and d.objid is distinct from (
              select p.oid from pg_proc p join pg_namespace n on n.oid = p.pronamespace
              where n.nspname = 'public' and p.proname = 'admin_account_counts_v1' and p.pronargs = 0
            )
            and d.objid is distinct from (
              select p.oid from pg_proc p join pg_namespace n on n.oid = p.pronamespace
              where n.nspname = 'jetnity_reporting' and p.proname = 'account_counts_v1' and p.pronargs = 0
            )
        )
        + (
          select count(*)::int
          from pg_proc p
          join pg_namespace n on n.oid = p.pronamespace
          where not (
              (n.nspname = 'jetnity_reporting' and p.proname = 'account_counts_v1' and p.pronargs = 0)
              or (n.nspname = 'public' and p.proname = 'admin_account_counts_v1' and p.pronargs = 0)
            )
            and (
              p.prosrc ilike '%account_counts_v1%'
              or p.prosrc ilike '%admin_account_counts_v1%'
            )
        )
      ) as unexpected_deps,
      (
        select encode(sha256(convert_to(pg_get_functiondef(p.oid), 'UTF8')), 'hex')
        from pg_proc p
        join pg_namespace n on n.oid = p.pronamespace
        where n.nspname = 'jetnity_reporting'
          and p.proname = 'account_counts_v1'
          and p.pronargs = 0
      ) as producer_def_sha256,
      (
        select encode(sha256(convert_to(pg_get_functiondef(p.oid), 'UTF8')), 'hex')
        from pg_proc p
        join pg_namespace n on n.oid = p.pronamespace
        where n.nspname = 'public'
          and p.proname = 'admin_account_counts_v1'
          and p.pronargs = 0
      ) as wrapper_def_sha256,
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
      exists(select 1 from pg_roles where rolname = 'jetnity_reporting_owner') as unexpected_privilege_role,
      (
        select
          encode(sha256(convert_to(pg_get_functiondef(p.oid), 'UTF8')), 'hex')
            = '0c936c2a5a693cefe051d3a0c92e9a47f51e902f9e273efcebb82113d834d7ef'
          and pg_get_userbyid(p.proowner) = 'postgres'
          and p.prosecdef is true
          and p.provolatile = 's'
          and p.pronargs = 0
          and pg_get_function_identity_arguments(p.oid) = ''
          and coalesce(p.proconfig, array[]::text[]) @> array['search_path=pg_catalog']
          and (
            coalesce(p.proconfig, array[]::text[]) @> array['TimeZone=UTC']
            or coalesce(p.proconfig, array[]::text[]) @> array['timezone=UTC']
          )
        from pg_proc p
        join pg_namespace n on n.oid = p.pronamespace
        where n.nspname = 'jetnity_reporting'
          and p.proname = 'account_counts_v1'
          and p.pronargs = 0
      ) as producer_identity_ok,
      (
        select
          encode(sha256(convert_to(pg_get_functiondef(p.oid), 'UTF8')), 'hex')
            = '15fc07ede14dd74eb5f77382b730c85c27a2004199f272d76ee1967525efc609'
          and pg_get_userbyid(p.proowner) not in ('anon', 'authenticated', 'service_role')
          and pg_get_userbyid(p.proowner) = current_user
          and pg_get_userbyid(p.proowner) = (
            select pg_get_userbyid(n.nspowner)
            from pg_namespace n
            where n.nspname = 'jetnity_reporting'
          )
          and p.prosecdef is false
          and p.provolatile = 's'
          and p.pronargs = 0
          and pg_get_function_identity_arguments(p.oid) = ''
          and coalesce(p.proconfig, array[]::text[]) @> array['search_path=pg_catalog']
        from pg_proc p
        join pg_namespace n on n.oid = p.pronamespace
        where n.nspname = 'public'
          and p.proname = 'admin_account_counts_v1'
          and p.pronargs = 0
      ) as wrapper_identity_ok,
      (
        select
          pg_get_userbyid(n.nspowner) = current_user
          and pg_get_userbyid(n.nspowner) not in ('anon', 'authenticated', 'service_role')
        from pg_namespace n
        where n.nspname = 'jetnity_reporting'
      ) as schema_owner_ok,
      not exists (
        select 1
        from pg_default_acl d
        join pg_namespace n on n.oid = d.defaclnamespace
        cross join lateral aclexplode(coalesce(d.defaclacl, array[]::aclitem[])) e
        where n.nspname = 'jetnity_reporting'
          and d.defaclobjtype = 'f'
          and e.privilege_type = 'EXECUTE'
          and e.grantee is distinct from d.defaclrole
      ) as default_privileges_ok,
      (
        not exists (
          select 1
          from pg_proc p
          join pg_namespace n on n.oid = p.pronamespace
          cross join lateral aclexplode(coalesce(p.proacl, acldefault('f', p.proowner))) e
          where (
              (n.nspname = 'jetnity_reporting' and p.proname = 'account_counts_v1' and p.pronargs = 0)
              or (n.nspname = 'public' and p.proname = 'admin_account_counts_v1' and p.pronargs = 0)
            )
            and e.privilege_type = 'EXECUTE'
            and e.grantee is distinct from p.proowner
            and e.grantee not in (select oid from pg_roles where rolname = 'authenticated')
        )
        and not exists (
          select 1
          from pg_namespace n
          cross join lateral aclexplode(coalesce(n.nspacl, acldefault('n', n.nspowner))) e
          where n.nspname = 'jetnity_reporting'
            and e.privilege_type in ('USAGE', 'CREATE')
            and e.grantee is distinct from n.nspowner
            and not (
              e.privilege_type = 'USAGE'
              and e.grantee in (select oid from pg_roles where rolname = 'authenticated')
            )
        )
      ) as acl_no_unexpected_grantee,
      (
        exists (
          select 1
          from pg_proc p
          join pg_namespace n on n.oid = p.pronamespace
          cross join lateral aclexplode(coalesce(p.proacl, acldefault('f', p.proowner))) e
          where n.nspname = 'jetnity_reporting'
            and p.proname = 'account_counts_v1' and p.pronargs = 0
            and e.privilege_type = 'EXECUTE'
            and e.grantee = (select oid from pg_roles where rolname = 'authenticated')
        )
        and exists (
          select 1
          from pg_proc p
          join pg_namespace n on n.oid = p.pronamespace
          cross join lateral aclexplode(coalesce(p.proacl, acldefault('f', p.proowner))) e
          where n.nspname = 'public'
            and p.proname = 'admin_account_counts_v1' and p.pronargs = 0
            and e.privilege_type = 'EXECUTE'
            and e.grantee = (select oid from pg_roles where rolname = 'authenticated')
        )
      ) as authenticated_execute_granted,
      (
        not exists (
          select 1
          from pg_proc p
          join pg_namespace n on n.oid = p.pronamespace
          cross join lateral aclexplode(coalesce(p.proacl, acldefault('f', p.proowner))) e
          where n.nspname = 'jetnity_reporting'
            and p.proname = 'account_counts_v1' and p.pronargs = 0
            and e.privilege_type = 'EXECUTE'
            and e.grantee = (select oid from pg_roles where rolname = 'authenticated')
        )
        and not exists (
          select 1
          from pg_proc p
          join pg_namespace n on n.oid = p.pronamespace
          cross join lateral aclexplode(coalesce(p.proacl, acldefault('f', p.proowner))) e
          where n.nspname = 'public'
            and p.proname = 'admin_account_counts_v1' and p.pronargs = 0
            and e.privilege_type = 'EXECUTE'
            and e.grantee = (select oid from pg_roles where rolname = 'authenticated')
        )
      ) as authenticated_execute_revoked,
      exists (
        select 1
        from pg_namespace n
        cross join lateral aclexplode(coalesce(n.nspacl, acldefault('n', n.nspowner))) e
        where n.nspname = 'jetnity_reporting'
          and e.privilege_type = 'USAGE'
          and e.grantee = (select oid from pg_roles where rolname = 'authenticated')
      ) as authenticated_schema_usage_granted,
      (
        not exists (
          select 1
          from pg_namespace n
          cross join lateral aclexplode(coalesce(n.nspacl, acldefault('n', n.nspowner))) e
          where n.nspname = 'jetnity_reporting'
            and e.privilege_type = 'USAGE'
            and e.grantee = (select oid from pg_roles where rolname = 'authenticated')
        )
      ) as authenticated_schema_usage_revoked
  ) raw
) inv;
