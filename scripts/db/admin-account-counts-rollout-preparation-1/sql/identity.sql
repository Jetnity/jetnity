-- LOCAL-ONLY shared identity contract for the accepted account-count package.
-- Single source for classify / verify / rollback. Never a migration. Never hosted SQL.
--
-- Expected ACL/default-ACL/signature identity is derived from the immutable
-- accepted sources, not from the target catalog. NULL ACL is treated as the
-- engine default (PUBLIC execute / PUBLIC schema usage) and is not the
-- package state. Comparison is order-independent and includes grantor,
-- grantee, privilege and is_grantable. WITH GRANT OPTION is never accepted.
--
-- Pinned pg_get_functiondef SHA-256: PostgreSQL 16.15 pretty-print of the
-- unchanged accepted sources. A different major is BLOCKED, not a repair.
-- States: FRESH | ALREADY_INSTALLED | REVOKED_EXACT | INCOMPATIBLE
select jsonb_build_object(
  'state',
  case
    when not coalesce(inv.schema_exists, false)
     and coalesce(inv.producer_name_count, 0) = 0
     and coalesce(inv.wrapper_name_count, 0) = 0
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
      and coalesce(raw.producer_name_count, 0) = 1
      and coalesce(raw.wrapper_name_count, 0) = 1
      and coalesce(raw.extra_object_count, 0) = 0
      and coalesce(raw.unexpected_deps, 0) = 0
      and not coalesce(raw.unexpected_privilege_role, false)
    ) as identity_core_ok,
    (
      coalesce(raw.producer_exists, false)
      and coalesce(raw.wrapper_exists, false)
      and coalesce(raw.schema_exists, false)
      and raw.producer_acl = raw.expected_granted_function_acl_postgres
      and raw.wrapper_acl = raw.expected_granted_function_acl_executor
      and raw.schema_acl = raw.expected_granted_schema_acl
    ) as acl_granted_exact,
    (
      coalesce(raw.producer_exists, false)
      and coalesce(raw.wrapper_exists, false)
      and coalesce(raw.schema_exists, false)
      and raw.producer_acl = raw.expected_revoked_function_acl_postgres
      and raw.wrapper_acl = raw.expected_revoked_function_acl_executor
      and raw.schema_acl = raw.expected_revoked_schema_acl
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
        from pg_proc p
        join pg_namespace n on n.oid = p.pronamespace
        where n.nspname = 'jetnity_reporting'
          and p.proname = 'account_counts_v1'
      ) as producer_name_count,
      (
        select count(*)::int
        from pg_proc p
        join pg_namespace n on n.oid = p.pronamespace
        where n.nspname = 'public'
          and p.proname = 'admin_account_counts_v1'
      ) as wrapper_name_count,
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
        where n.nspname = 'jetnity_reporting'
      ) as default_privileges_ok,
      (
        select coalesce(jsonb_agg(e.entry order by e.entry->>'grantee', e.entry->>'privilege', e.entry->>'grantor', e.entry->>'is_grantable'), '[]'::jsonb)
        from (
          select jsonb_build_object(
            'grantee', case when x.grantee = 0 then 'PUBLIC' else pg_get_userbyid(x.grantee) end,
            'grantor', pg_get_userbyid(x.grantor),
            'privilege', x.privilege_type,
            'is_grantable', x.is_grantable
          ) as entry
          from pg_proc p
          join pg_namespace n on n.oid = p.pronamespace
          cross join lateral aclexplode(coalesce(p.proacl, acldefault('f', p.proowner))) x
          where n.nspname = 'jetnity_reporting'
            and p.proname = 'account_counts_v1'
            and p.pronargs = 0
        ) e
      ) as producer_acl,
      (
        select coalesce(jsonb_agg(e.entry order by e.entry->>'grantee', e.entry->>'privilege', e.entry->>'grantor', e.entry->>'is_grantable'), '[]'::jsonb)
        from (
          select jsonb_build_object(
            'grantee', case when x.grantee = 0 then 'PUBLIC' else pg_get_userbyid(x.grantee) end,
            'grantor', pg_get_userbyid(x.grantor),
            'privilege', x.privilege_type,
            'is_grantable', x.is_grantable
          ) as entry
          from pg_proc p
          join pg_namespace n on n.oid = p.pronamespace
          cross join lateral aclexplode(coalesce(p.proacl, acldefault('f', p.proowner))) x
          where n.nspname = 'public'
            and p.proname = 'admin_account_counts_v1'
            and p.pronargs = 0
        ) e
      ) as wrapper_acl,
      (
        select coalesce(jsonb_agg(e.entry order by e.entry->>'grantee', e.entry->>'privilege', e.entry->>'grantor', e.entry->>'is_grantable'), '[]'::jsonb)
        from (
          select jsonb_build_object(
            'grantee', case when x.grantee = 0 then 'PUBLIC' else pg_get_userbyid(x.grantee) end,
            'grantor', pg_get_userbyid(x.grantor),
            'privilege', x.privilege_type,
            'is_grantable', x.is_grantable
          ) as entry
          from pg_namespace n
          cross join lateral aclexplode(coalesce(n.nspacl, acldefault('n', n.nspowner))) x
          where n.nspname = 'jetnity_reporting'
        ) e
      ) as schema_acl,
      (
        select coalesce(jsonb_agg(e.entry order by e.entry->>'grantee', e.entry->>'privilege', e.entry->>'grantor', e.entry->>'is_grantable'), '[]'::jsonb)
        from (
          select jsonb_build_object(
            'grantee', v.grantee,
            'grantor', 'postgres',
            'privilege', 'EXECUTE',
            'is_grantable', false
          ) as entry
          from (values ('authenticated'), ('postgres')) v(grantee)
        ) e
      ) as expected_granted_function_acl_postgres,
      (
        select coalesce(jsonb_agg(e.entry order by e.entry->>'grantee', e.entry->>'privilege', e.entry->>'grantor', e.entry->>'is_grantable'), '[]'::jsonb)
        from (
          select jsonb_build_object(
            'grantee', v.grantee,
            'grantor', current_user,
            'privilege', 'EXECUTE',
            'is_grantable', false
          ) as entry
          from (values ('authenticated'), (current_user)) v(grantee)
        ) e
      ) as expected_granted_function_acl_executor,
      (
        select coalesce(jsonb_agg(e.entry order by e.entry->>'grantee', e.entry->>'privilege', e.entry->>'grantor', e.entry->>'is_grantable'), '[]'::jsonb)
        from (
          select jsonb_build_object(
            'grantee', 'postgres',
            'grantor', 'postgres',
            'privilege', 'EXECUTE',
            'is_grantable', false
          ) as entry
        ) e
      ) as expected_revoked_function_acl_postgres,
      (
        select coalesce(jsonb_agg(e.entry order by e.entry->>'grantee', e.entry->>'privilege', e.entry->>'grantor', e.entry->>'is_grantable'), '[]'::jsonb)
        from (
          select jsonb_build_object(
            'grantee', current_user,
            'grantor', current_user,
            'privilege', 'EXECUTE',
            'is_grantable', false
          ) as entry
        ) e
      ) as expected_revoked_function_acl_executor,
      (
        select coalesce(jsonb_agg(e.entry order by e.entry->>'grantee', e.entry->>'privilege', e.entry->>'grantor', e.entry->>'is_grantable'), '[]'::jsonb)
        from (
          select jsonb_build_object(
            'grantee', v.grantee,
            'grantor', current_user,
            'privilege', v.privilege,
            'is_grantable', false
          ) as entry
          from (
            values
              (current_user, 'CREATE'),
              (current_user, 'USAGE'),
              ('authenticated', 'USAGE')
          ) v(grantee, privilege)
        ) e
      ) as expected_granted_schema_acl,
      (
        select coalesce(jsonb_agg(e.entry order by e.entry->>'grantee', e.entry->>'privilege', e.entry->>'grantor', e.entry->>'is_grantable'), '[]'::jsonb)
        from (
          select jsonb_build_object(
            'grantee', v.grantee,
            'grantor', current_user,
            'privilege', v.privilege,
            'is_grantable', false
          ) as entry
          from (
            values
              (current_user, 'CREATE'),
              (current_user, 'USAGE')
          ) v(grantee, privilege)
        ) e
      ) as expected_revoked_schema_acl
  ) raw
) inv;
