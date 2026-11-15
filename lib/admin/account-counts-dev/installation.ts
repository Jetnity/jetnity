import 'server-only'
import { createHash } from 'node:crypto'
import { readFileSync } from 'node:fs'
import { ADMIN_ACCOUNT_COUNTS_DEV_PROJECT } from '@/lib/admin/account-counts-delivery/dev-activation'

const PRODUCER_FILE = '612f755c12f1817e129226648b6c6fd2c1eba19b57bd163102a2eb5e344c12de'
const WRAPPER_FILE = '13fa3fe280d76d42ca6b2a1dff12077edc3d44a599a22300e89dd5578d63a6fb'
const PRODUCER_BODY = 'eaedfdc58cc572164f2bffd8dd8429e074afdd3aef9033afcfdffb3929e70e16'
const WRAPPER_BODY = 'aed37c6c5abd5fa8c05918e345226a0712adbe60d72f01b191f91141660c5f9c'
const PROFILE_BODY = 'b513eca8cc5d7b3981d9b9eb1473428e628410dcb0f4b718290d4cc314756a8d'

type Sources = { producer: string; wrapper: string }
function hash(value: string) { return createHash('sha256').update(value, 'utf8').digest('hex') }
function replaceOnce(source: string, from: string, to: string) {
  if (source.split(from).length !== 2) throw new Error('counts_dev_ddl_head_not_exact')
  return source.replace(from, to)
}

// Catalog-only evidence. The new reporting schema/default ACL is deliberately
// excluded: every pre-existing authority object must remain byte-identical.
const SECURITY_SNAPSHOT = `select jsonb_build_object(
  'tables', (select jsonb_agg(jsonb_build_object('oid',c.oid,'owner',c.relowner,'acl',c.relacl,
    'rls',c.relrowsecurity,'force_rls',c.relforcerowsecurity) order by c.oid) from pg_class c
    where c.oid in ('auth.users'::regclass,'public.profiles'::regclass)),
  'columns', (select jsonb_agg(to_jsonb(a) order by a.attrelid,a.attnum) from pg_attribute a
    where a.attrelid in ('auth.users'::regclass,'public.profiles'::regclass) and a.attnum>0 and not a.attisdropped),
  'constraints', (select jsonb_agg(to_jsonb(c) order by c.oid) from pg_constraint c
    where c.conrelid in ('auth.users'::regclass,'public.profiles'::regclass)),
  'policies', (select jsonb_agg(to_jsonb(p) order by p.oid) from pg_policy p
    where p.polrelid in ('auth.users'::regclass,'public.profiles'::regclass)),
  'source_schemas', (select jsonb_agg(to_jsonb(n) order by n.oid) from pg_namespace n where n.nspname in ('public','auth')),
  'roles', (select jsonb_agg(to_jsonb(r) order by r.oid) from pg_roles r
    where r.rolname in ('postgres','anon','authenticated','service_role','supabase_auth_admin','authenticator','pg_database_owner')),
  'memberships', (select jsonb_agg(to_jsonb(m) order by m.roleid,m.member,m.grantor) from pg_auth_members m),
  'default_acl', (select jsonb_agg(to_jsonb(d) order by d.oid) from pg_default_acl d
    where d.defaclnamespace=0 or d.defaclnamespace in ('public'::regnamespace,'auth'::regnamespace)),
  'helpers', (select jsonb_agg(to_jsonb(p) order by p.oid) from pg_proc p join pg_namespace n on n.oid=p.pronamespace
    where (n.nspname='public' and p.proname in ('rollenrang','aktuelle_rolle','hat_rolle_mindestens',
      'aktuelles_admin_aal2','darf_konten_verwalten','profil_autoritaet_integritaet_pruefen_v1','profil_rollenwechsel_pruefen'))
      or (n.nspname='auth' and p.proname in ('uid','jwt'))),
  'profile_triggers', (select jsonb_agg(to_jsonb(t) order by t.oid) from pg_trigger t
    where t.tgrelid='public.profiles'::regclass)
)`

const HELPER_PINS = [
  ['aktuelle_rolle', '41b223309c2228d87a0ac273ac31cc9ffcaa7e3ac406059d00818b947b09cbd0', 0, true, 's', 'u', 'search_path=public, pg_temp', 'text', null],
  ['aktuelles_admin_aal2', 'd3cf53b48caba5d05eef08d940f1199b7ad58a8a78acefd1e899fda0c502ff1a', 0, false, 's', 's', 'search_path=pg_catalog', 'bool', null],
  ['darf_konten_verwalten', '35e41fdae08f4663ffd9f58b3e7912b7faf13661ab0159c67067ad43f43498ab', 0, false, 's', 's', 'search_path=pg_catalog', 'bool', null],
  ['hat_rolle_mindestens', '367f630edefe6788750c6cabe7f5cb1b32d7c01ee4e3246d60632bf5ccd77f10', 1, true, 's', 'u', 'search_path=public, pg_temp', 'bool', 'minimum'],
  ['rollenrang', '56d5753e4ccb189c2472c02a2737b6662c182381d03bf4de1954d069829fe850', 1, false, 'i', 's', 'search_path=pg_catalog', 'int4', 'rolle'],
] as const

/** Produces SQL only. Never connects, applies SQL, reads account rows or accepts a remote DSN. */
export function composeDevAccountCountsInstallation(project: string, sources?: Sources) {
  if (project !== ADMIN_ACCOUNT_COUNTS_DEV_PROJECT) throw new Error('counts_dev_target_not_allowed')
  const original = sources ?? {
    producer: readFileSync(new URL('../../../scripts/db/admin-account-counts-1-candidate.sql', import.meta.url), 'utf8'),
    wrapper: readFileSync(new URL('../../../scripts/db/admin-account-counts-delivery-1-rpc.sql', import.meta.url), 'utf8'),
  }
  if (hash(original.producer) !== PRODUCER_FILE || hash(original.wrapper) !== WRAPPER_FILE) {
    throw new Error('counts_dev_source_changed')
  }
  let producer = replaceOnce(original.producer, 'create schema if not exists jetnity_reporting;', 'create schema jetnity_reporting;')
  producer = replaceOnce(producer, 'create or replace function jetnity_reporting.account_counts_v1()', 'create function jetnity_reporting.account_counts_v1()')
  const wrapper = replaceOnce(original.wrapper, 'create or replace function public.admin_account_counts_v1()', 'create function public.admin_account_counts_v1()')
  const helperValues = HELPER_PINS.map(([name, digest, args, definer, volatility, parallel, config, returns, argument]) =>
    `('${name}','${digest}',${args},${definer},'${volatility}','${parallel}','${config}','${returns}',${argument === null ? 'null::text' : `'${argument}'`})`).join(',\n')
  const sql = `-- DEV ONLY: explicit API target ${ADMIN_ACCOUNT_COUNTS_DEV_PROJECT}; no connection is selected by this SQL.
-- One atomic statement. Original source files are pinned; only three CREATE heads are made strict.
DO $counts_dev_install$
DECLARE
  security_before jsonb;
  security_after jsonb;
  v_routine record;
  expected record;
  acl text[];
  reporting oid;
BEGIN
  perform pg_catalog.set_config('search_path','pg_catalog,pg_temp',true);
  security_before := (${SECURITY_SNAPSHOT});
  if current_user <> 'postgres' or session_user <> 'postgres'
     or not exists(select 1 from pg_roles where rolname='postgres' and not rolsuper and rolbypassrls)
     or current_setting('server_version_num')::integer not between 160000 and 179999
     or current_setting('statement_timeout')::interval <= interval '0 seconds'
     or current_setting('statement_timeout')::interval > interval '2 minutes' then
    raise exception 'counts_dev_executor_or_engine_not_reviewed' using errcode='42501';
  end if;
  perform set_config('lock_timeout','5s',true);
  if not pg_try_advisory_xact_lock(hashtextextended('jetnity.admin-account-counts.dev-v1',0)) then
    raise exception 'counts_dev_install_in_progress' using errcode='55P03';
  end if;
  if to_regnamespace('jetnity_reporting') is not null
     or exists(select 1 from pg_proc p join pg_namespace n on n.oid=p.pronamespace
       where n.nspname='public' and p.proname='admin_account_counts_v1') then
    raise exception 'counts_dev_target_not_fresh' using errcode='55000';
  end if;
  if exists(select 1 from pg_roles where rolname='jetnity_reporting_owner')
     or exists(select 1 from pg_roles r where r.rolname in ('anon','authenticated','service_role')
       and (pg_has_role(r.oid,'postgres','MEMBER') or has_table_privilege(r.oid,'auth.users','SELECT')))
     or not has_table_privilege('postgres','auth.users','SELECT')
     or not exists(select 1 from pg_class where oid='auth.users'::regclass and relrowsecurity and not relforcerowsecurity
       and relowner='supabase_auth_admin'::regrole)
     or not exists(select 1 from pg_class where oid='public.profiles'::regclass and relrowsecurity and relowner='postgres'::regrole) then
    raise exception 'counts_dev_source_authority_changed' using errcode='42501';
  end if;
  if to_regnamespace('jetnity_internal') is not null and exists(select 1 from pg_roles r
      where r.rolname in ('anon','authenticated','service_role')
      and has_schema_privilege(r.oid,'jetnity_internal','USAGE')) then
    raise exception 'counts_dev_internal_schema_exposed' using errcode='42501';
  end if;
  for expected in select * from (values
    ('auth.users','id','uuid',true),('auth.users','created_at','timestamptz',false),
    ('auth.users','deleted_at','timestamptz',false),('auth.users','is_anonymous','bool',true),
    ('public.profiles','id','uuid',true),('public.profiles','user_id','uuid',true),('public.profiles','status','text',true)
  ) as v(relation,column_name,type_name,not_null) loop
    if not exists(select 1 from pg_attribute a where a.attrelid=expected.relation::regclass
      and a.attname=expected.column_name and a.atttypid=expected.type_name::regtype
      and a.attnotnull=expected.not_null and a.attnum>0 and not a.attisdropped) then
      raise exception 'counts_dev_source_column_changed' using errcode='55000';
    end if;
  end loop;
  if not exists(select 1 from pg_constraint c where c.conrelid='public.profiles'::regclass
      and c.contype in ('p','u') and c.convalidated and c.conkey=array[(select attnum from pg_attribute
        where attrelid='public.profiles'::regclass and attname='user_id')]::smallint[]) then
    raise exception 'counts_dev_profile_identity_not_unique' using errcode='55000';
  end if;
  if not exists(select 1 from pg_constraint c where c.conrelid='public.profiles'::regclass
      and c.contype='f' and c.convalidated and c.confrelid='auth.users'::regclass and c.confdeltype='c'
      and c.conkey=array[(select attnum from pg_attribute where attrelid='public.profiles'::regclass and attname='user_id')]::smallint[]
      and c.confkey=array[(select attnum from pg_attribute where attrelid='auth.users'::regclass and attname='id')]::smallint[]) then
    raise exception 'counts_dev_profile_auth_binding_changed' using errcode='55000';
  end if;
  for expected in select * from (values ${helperValues})
    as v(name,digest,nargs,definer,volatility,parallel,configuration,return_type,argument_name) loop
    if (select count(*) from pg_proc p join pg_namespace n on n.oid=p.pronamespace
       where n.nspname='public' and p.proname=expected.name) <> 1 then
      raise exception 'counts_dev_helper_identity_changed' using errcode='55000';
    end if;
    if not exists(select 1 from pg_proc p join pg_namespace n on n.oid=p.pronamespace
      join pg_language l on l.oid=p.prolang where n.nspname='public' and p.proname=expected.name
      and encode(sha256(convert_to(p.prosrc,'UTF8')),'hex')=expected.digest
      and p.pronargs=expected.nargs and p.proowner='postgres'::regrole and p.prosecdef=expected.definer
      and p.provolatile=expected.volatility::"char" and p.proparallel=expected.parallel::"char"
      and p.prokind='f' and l.lanname='sql' and not p.proisstrict and not p.proleakproof
      and p.prorettype=expected.return_type::regtype and not p.proretset
      and p.pronargdefaults=0 and p.proargdefaults is null and p.provariadic=0 and p.prosupport=0
      and p.proallargtypes is null and p.proargmodes is null and p.probin is null and p.prosqlbody is null
      and p.proargtypes::text=case when expected.nargs=0 then '' else 'text'::regtype::oid::text end
      and p.proargnames is not distinct from case when expected.argument_name is null then null::text[] else array[expected.argument_name] end
      and p.proconfig=array[expected.configuration]
      and (select array_agg(x::text order by x::text) from unnest(p.proacl) x)
        =array['authenticated=X/postgres','postgres=X/postgres','service_role=X/postgres']) then
      raise exception 'counts_dev_helper_contract_changed' using errcode='55000';
    end if;
  end loop;
  -- counts-dev-authority-validation-boundary
  if not exists(select 1 from pg_trigger t join pg_proc p on p.oid=t.tgfoid
    where t.tgrelid='public.profiles'::regclass and t.tgname='profiles_autoritaet_integritaet_v1'
      and t.tgtype=27 and t.tgenabled='O' and not t.tgisinternal and t.tgnargs=0
      and t.tgqual is null and t.tgattr::text='' and octet_length(t.tgargs)=0
      and t.tgparentid=0 and t.tgconstraint=0 and t.tgconstrrelid=0 and t.tgconstrindid=0
      and not t.tgdeferrable and not t.tginitdeferred and t.tgoldtable is null and t.tgnewtable is null
      and p.oid=to_regprocedure('public.profil_autoritaet_integritaet_pruefen_v1()')
      and p.proowner='postgres'::regrole and not p.prosecdef and p.proconfig=array['search_path=pg_catalog']
      and p.prokind='f' and p.pronargs=0 and p.prorettype='trigger'::regtype
      and p.provolatile='v' and p.proparallel='u' and not p.proisstrict and not p.proleakproof
      and p.prolang=(select oid from pg_language where lanname='plpgsql') and not p.proretset
      and p.proargtypes::text='' and p.proallargtypes is null and p.proargmodes is null and p.proargnames is null
      and p.pronargdefaults=0 and p.proargdefaults is null and p.provariadic=0 and p.prosupport=0
      and p.probin is null and p.prosqlbody is null
      and encode(sha256(convert_to(p.prosrc,'UTF8')),'hex')='${PROFILE_BODY}'
      and p.proacl::text[] = array['postgres=X/postgres']) then
    raise exception 'counts_dev_profile_guard_changed' using errcode='55000';
  end if;
  -- Strict creation also rejects a concurrent uncooperative creator after the fresh check.
  EXECUTE $counts_producer_source$${producer}$counts_producer_source$;
  -- counts-dev-wrapper-boundary
  EXECUTE $counts_wrapper_source$${wrapper}$counts_wrapper_source$;
  -- counts-dev-verification-boundary
  reporting := 'jetnity_reporting'::regnamespace;
  select array_agg(a::text order by a::text) into acl from pg_namespace n, unnest(n.nspacl) a where n.oid=reporting;
  if (select nspowner from pg_namespace where oid=reporting) <> 'postgres'::regrole
     or acl is distinct from array['authenticated=U/postgres','postgres=UC/postgres']
     or (select count(*) from pg_proc where pronamespace=reporting) <> 1
     or exists(select 1 from pg_class where relnamespace=reporting) then
    raise exception 'counts_dev_reporting_schema_not_exact' using errcode='55000';
  end if;
  for expected in select * from (values
    ('jetnity_reporting','account_counts_v1','plpgsql',true,'${PRODUCER_BODY}',array['bigint','bigint','timestamptz','timestamptz','text']),
    ('public','admin_account_counts_v1','sql',false,'${WRAPPER_BODY}',array['text','text','timestamptz','timestamptz','text'])
  ) as v(schema_name,name,language_name,definer,digest,types) loop
    if (select count(*) from pg_proc q join pg_namespace n on n.oid=q.pronamespace
      where n.nspname=expected.schema_name and q.proname=expected.name) <> 1 then
      raise exception 'counts_dev_function_count_not_exact' using errcode='55000';
    end if;
    select q.*, l.lanname into strict v_routine from pg_proc q join pg_namespace n on n.oid=q.pronamespace
      join pg_language l on l.oid=q.prolang where n.nspname=expected.schema_name and q.proname=expected.name;
    select array_agg(a::text order by a::text) into acl from unnest(v_routine.proacl) a;
    if v_routine.proowner <> 'postgres'::regrole or v_routine.prosecdef <> expected.definer
       or v_routine.lanname <> expected.language_name or v_routine.provolatile <> 's' or v_routine.proparallel <> 'u'
       or v_routine.prokind <> 'f' or v_routine.pronargs <> 0 or not v_routine.proretset or v_routine.prorettype <> 'record'::regtype
       or v_routine.proisstrict or v_routine.proleakproof or v_routine.pronargdefaults <> 0 or v_routine.proargdefaults is not null
       or v_routine.provariadic <> 0 or v_routine.prosupport <> 0 or v_routine.probin is not null or v_routine.prosqlbody is not null
       or v_routine.proargmodes is distinct from array['t','t','t','t','t']::"char"[]
       or v_routine.proargnames is distinct from array['present_registered_accounts','created_in_prior_30_days','measured_at','window_start','definition_version']
       or v_routine.proallargtypes is distinct from (select array_agg(x::regtype::oid order by nr) from unnest(expected.types) with ordinality as a(x,nr))
       or encode(sha256(convert_to(v_routine.prosrc,'UTF8')),'hex') <> expected.digest
       or acl is distinct from array['authenticated=X/postgres','postgres=X/postgres'] then
      raise exception 'counts_dev_function_contract_not_exact' using errcode='55000';
    end if;
    if not (v_routine.proconfig @> array['search_path=pg_catalog'])
       or (expected.definer and (cardinality(v_routine.proconfig) <> 2 or not exists(select 1 from unnest(v_routine.proconfig) c where lower(c)='timezone=utc')))
       or (not expected.definer and v_routine.proconfig is distinct from array['search_path=pg_catalog'])
       or has_function_privilege('anon',v_routine.oid,'EXECUTE') or has_function_privilege('service_role',v_routine.oid,'EXECUTE')
       or not has_function_privilege('authenticated',v_routine.oid,'EXECUTE') then
      raise exception 'counts_dev_function_access_not_exact' using errcode='42501';
    end if;
  end loop;
  if has_schema_privilege('anon',reporting,'USAGE') or has_schema_privilege('service_role',reporting,'USAGE')
     or not has_schema_privilege('authenticated',reporting,'USAGE')
     or has_schema_privilege('authenticated',reporting,'CREATE')
     or exists(select 1 from pg_default_acl d where d.defaclnamespace=reporting and
       (d.defaclrole <> 'postgres'::regrole or d.defaclobjtype <> 'f' or
        (select array_agg(a::text order by a::text) from unnest(d.defaclacl) a) is distinct from array['postgres=X/postgres'])) then
    raise exception 'counts_dev_reporting_access_not_exact' using errcode='42501';
  end if;
  security_after := (${SECURITY_SNAPSHOT});
  if security_after is distinct from security_before then
    raise exception 'counts_dev_preexisting_authority_changed' using errcode='55000';
  end if;
  comment on schema jetnity_reporting is 'Dev-only account-count rollout; no client access to auth.users and no Production activation.';
  comment on function jetnity_reporting.account_counts_v1() is 'Dev-only activation of the reviewed jetnity.admin-account-counts.v1 producer. Unchanged counting and active-caller/AAL2 contract.';
  comment on function public.admin_account_counts_v1() is 'Dev-only zero-argument SECURITY INVOKER transport for the reviewed account-count producer; exact decimal text counts.';
  perform pg_notify('pgrst','reload schema');
END
$counts_dev_install$;
`
  return { sql, sha256: hash(sql), project, sourceHashes: { producer: PRODUCER_FILE, wrapper: WRAPPER_FILE } }
}
