-- PG1 UNAPPLIED private V3 prerequisite. Not the full #1142 public-capability repair.
-- Root must separately bind the exact Dev target, API exclusion, Auth semantics,
-- effective privileges, signed-request plan and recovery evidence before applying.
-- No old public capability, Pilot object or historical ledger is read or changed.
BEGIN;
SET LOCAL search_path=pg_catalog;
SET LOCAL lock_timeout='2s';
SET LOCAL statement_timeout='10s';
-- Serializes this package's install/removal only; not a universal DDL barrier.
SELECT pg_catalog.pg_advisory_xact_lock(771101,1);
DO $pg1_context$
DECLARE owner_oid oid;
BEGIN
  SELECT oid INTO owner_oid FROM pg_catalog.pg_roles WHERE rolname='postgres' AND NOT rolsuper AND rolbypassrls;
  IF owner_oid IS NULL OR current_user<>'postgres' OR pg_catalog.current_database()<>'postgres'
    OR (SELECT count(*) FROM pg_catalog.pg_roles WHERE rolname IN ('anon','authenticated','service_role'))<>3
    OR EXISTS(SELECT 1 FROM pg_catalog.pg_auth_members WHERE roleid=owner_oid)
    OR EXISTS(SELECT 1 FROM pg_catalog.pg_roles r WHERE r.rolname IN ('anon','authenticated','service_role')
      AND (pg_catalog.pg_has_role(r.oid,owner_oid,'USAGE') OR pg_catalog.pg_has_role(r.oid,owner_oid,'SET'))) THEN
    RAISE EXCEPTION 'pg1 installer boundary invalid' USING ERRCODE='P7701';
  END IF;
END
$pg1_context$;

DO $pg1_create_boundary$
DECLARE owner_oid oid:='postgres'::pg_catalog.regrole;
BEGIN
  IF EXISTS(SELECT 1 FROM pg_catalog.pg_namespace WHERE nspname='jetnity_ot_auth')
    OR EXISTS(SELECT 1 FROM pg_catalog.pg_default_acl d CROSS JOIN LATERAL pg_catalog.aclexplode(d.defaclacl) a
      WHERE d.defaclrole=owner_oid AND d.defaclnamespace=0 AND d.defaclobjtype IN ('f','n')
        AND (a.grantor<>owner_oid OR (a.grantee<>owner_oid
          AND NOT(d.defaclobjtype='f' AND a.grantee=0 AND a.privilege_type='EXECUTE' AND NOT a.is_grantable)))) THEN
    RAISE EXCEPTION 'pg1 collision or creator defaults invalid' USING ERRCODE='P7702';
  END IF;
END
$pg1_create_boundary$;

CREATE SCHEMA jetnity_ot_auth AUTHORIZATION postgres;

create function jetnity_ot_auth.own_active_session_v1()
returns boolean language plpgsql stable parallel unsafe security definer
set search_path = pg_catalog as $$
declare
  claims jsonb := auth.jwt();
  uid uuid; sid uuid;
begin
  if jsonb_typeof(claims) is distinct from 'object'
    or jsonb_typeof(claims->'sub') is distinct from 'string'
    or (claims->>'sub') !~ '^[0-9a-fA-F]{8}-[0-9a-fA-F]{4}-[0-9a-fA-F]{4}-[0-9a-fA-F]{4}-[0-9a-fA-F]{12}$'
    or jsonb_typeof(claims->'session_id') is distinct from 'string'
    or (claims->>'session_id') !~ '^[0-9a-fA-F]{8}-[0-9a-fA-F]{4}-[0-9a-fA-F]{4}-[0-9a-fA-F]{4}-[0-9a-fA-F]{12}$'
    or claims->>'role' is distinct from 'authenticated'
    or claims->>'aal' is distinct from 'aal2'
    or jsonb_typeof(claims->'exp') is distinct from 'number'
    or (claims->>'exp') !~ '^[0-9]{1,12}$' then
    return false;
  end if;
  uid := (claims->>'sub')::uuid;
  sid := (claims->>'session_id')::uuid;
  if auth.uid() is distinct from uid then return false; end if;
  return exists (
    select 1 from auth.users u
      join auth.sessions s on s.user_id=u.id and s.id=sid
      join public.profiles p on p.user_id=u.id
    where u.id=uid and p.role='owner' and p.status='active'
      and u.deleted_at is null and u.is_anonymous is false
      and (u.banned_until is null or u.banned_until<=statement_timestamp())
      and s.aal::text='aal2'
      and (s.not_after is null or s.not_after>statement_timestamp())
      and (claims->>'exp')::numeric>extract(epoch from statement_timestamp())
  );
end $$;

create function jetnity_ot_auth.require_current_owner_session_v1()
returns void language plpgsql volatile parallel unsafe security definer
set search_path = pg_catalog set lock_timeout = '2s' as $$
declare
  claims jsonb := auth.jwt();
  uid uuid; sid uuid; checked_at timestamptz; permitted boolean;
begin
  if not coalesce(jetnity_ot_auth.own_active_session_v1(),false) then
    raise exception 'official truth authority unavailable' using errcode='42501';
  end if;
  uid := auth.uid(); sid := (claims->>'session_id')::uuid;
  perform u.id from auth.users u where u.id=uid for share nowait;
  if not found then raise exception 'official truth authority unavailable' using errcode='42501'; end if;
  perform s.id from auth.sessions s where s.id=sid and s.user_id=uid for share nowait;
  if not found then raise exception 'official truth authority unavailable' using errcode='42501'; end if;
  perform p.user_id from public.profiles p where p.user_id=uid for share nowait;
  if not found then raise exception 'official truth authority unavailable' using errcode='42501'; end if;

  -- Defined authorization time: fresh clock AFTER all relevant row locks.
  -- At READ COMMITTED this SELECT sees the latest committed rows. Stronger
  -- isolation must propagate serialization failure, never catch-and-allow.
  checked_at := clock_timestamp();
  select p.role='owner' and p.status='active'
    and u.deleted_at is null and u.is_anonymous is false
    and (u.banned_until is null or u.banned_until<=checked_at)
    and s.aal::text='aal2' and (s.not_after is null or s.not_after>checked_at)
    and (claims->>'exp')::numeric>extract(epoch from checked_at)
    into permitted
    from auth.users u
      join auth.sessions s on s.user_id=u.id and s.id=sid
      join public.profiles p on p.user_id=u.id
    where u.id=uid;
  if permitted is distinct from true then
    raise exception 'official truth authority unavailable' using errcode='42501';
  end if;
  -- Locks remain held until transaction end. No guarantee of retroactively
  -- cancelling work that serialized before a later revocation is claimed.
end $$;

-- Inspect actual new-object ACLs before changing any right. Only the documented
-- baseline PUBLIC EXECUTE may be removed; no extra grantee is normalized away.
DO $pg1_creator_acl$
DECLARE owner_oid oid:='postgres'::pg_catalog.regrole;
BEGIN
  IF EXISTS(SELECT 1 FROM pg_catalog.pg_namespace n CROSS JOIN LATERAL
      pg_catalog.aclexplode(COALESCE(n.nspacl,pg_catalog.acldefault('n',owner_oid))) a
      WHERE n.nspname='jetnity_ot_auth' AND (n.nspowner<>owner_oid OR a.grantor<>owner_oid OR a.grantee<>owner_oid))
    OR EXISTS(SELECT 1 FROM pg_catalog.pg_proc p JOIN pg_catalog.pg_namespace n ON n.oid=p.pronamespace
      CROSS JOIN LATERAL pg_catalog.aclexplode(COALESCE(p.proacl,pg_catalog.acldefault('f',owner_oid))) a
      WHERE n.nspname='jetnity_ot_auth' AND (p.proowner<>owner_oid OR a.grantor<>owner_oid
        OR (a.grantee<>owner_oid AND NOT(a.grantee=0 AND a.privilege_type='EXECUTE' AND NOT a.is_grantable)))) THEN
    RAISE EXCEPTION 'pg1 unexpected creator privileges' USING ERRCODE='P7702';
  END IF;
END
$pg1_creator_acl$;
REVOKE ALL ON FUNCTION jetnity_ot_auth.own_active_session_v1(),jetnity_ot_auth.require_current_owner_session_v1() FROM PUBLIC;
COMMENT ON SCHEMA jetnity_ot_auth IS 'jetnity:v3-private-owner-guards:1:unbound';
COMMENT ON FUNCTION jetnity_ot_auth.own_active_session_v1() IS 'jetnity:v3-private-owner-guards:1:unbound';
COMMENT ON FUNCTION jetnity_ot_auth.require_current_owner_session_v1() IS 'jetnity:v3-private-owner-guards:1:unbound';

DO $pg1_exact_inventory$
DECLARE owner_oid oid:='postgres'::pg_catalog.regrole; namespace_oid oid; e record; f record;
BEGIN
  SELECT n.oid INTO namespace_oid FROM pg_catalog.pg_namespace n
    WHERE n.nspname='jetnity_ot_auth' AND n.nspowner=owner_oid
      AND pg_catalog.obj_description(n.oid,'pg_namespace')='jetnity:v3-private-owner-guards:1:unbound';
  IF namespace_oid IS NULL
    OR EXISTS(SELECT 1 FROM pg_catalog.pg_namespace n CROSS JOIN LATERAL
      pg_catalog.aclexplode(COALESCE(n.nspacl,pg_catalog.acldefault('n',owner_oid))) a
      WHERE n.oid=namespace_oid AND (a.grantee<>owner_oid OR a.grantor<>owner_oid))
    OR NOT pg_catalog.has_schema_privilege(owner_oid,namespace_oid,'USAGE')
    OR NOT pg_catalog.has_schema_privilege(owner_oid,namespace_oid,'CREATE')
    OR (SELECT count(*) FROM pg_catalog.pg_proc WHERE pronamespace=namespace_oid)<>2
    OR EXISTS(SELECT 1 FROM pg_catalog.pg_depend d WHERE d.refclassid='pg_catalog.pg_namespace'::pg_catalog.regclass
      AND d.refobjid=namespace_oid AND (d.classid<>'pg_catalog.pg_proc'::pg_catalog.regclass
        OR d.objsubid<>0 OR d.deptype<>'n' OR NOT EXISTS(SELECT 1 FROM pg_catalog.pg_proc p
          WHERE p.oid=d.objid AND p.pronamespace=namespace_oid
            AND p.proname IN ('own_active_session_v1','require_current_owner_session_v1') AND p.pronargs=0)))
    OR EXISTS(SELECT 1 FROM pg_catalog.pg_depend d
      WHERE d.classid='pg_catalog.pg_namespace'::pg_catalog.regclass AND d.objid=namespace_oid AND d.deptype='e') THEN
    RAISE EXCEPTION 'pg1 exact inventory invalid' USING ERRCODE='P7703';
  END IF;
  FOR e IN SELECT * FROM (VALUES
    ('own_active_session_v1','bool','s',ARRAY['search_path=pg_catalog']::text[],
      '1bf7498146d4827371087a926327db1348ce2a4cc55693427ee154eb81082354'),
    ('require_current_owner_session_v1','void','v',ARRAY['search_path=pg_catalog','lock_timeout=2s']::text[],
      'ba3667edd483f0a0abcf53f70f4dc71906f0ffdbc192ee569232c78dd359635b')
  ) AS expected(name,result_type,volatility,config,body_hash) LOOP
    SELECT p.* INTO f FROM pg_catalog.pg_proc p WHERE p.pronamespace=namespace_oid AND p.proname=e.name AND p.pronargs=0;
    IF NOT FOUND OR f.proowner<>owner_oid OR f.prokind<>'f' OR NOT f.prosecdef OR f.proretset OR f.proleakproof
      OR f.proisstrict OR f.provolatile::text<>e.volatility OR f.proparallel<>'u' OR f.pronargdefaults<>0
      OR f.proallargtypes IS NOT NULL OR f.proargmodes IS NOT NULL OR f.proargnames IS NOT NULL
      OR f.prorettype<>pg_catalog.to_regtype('pg_catalog.'||e.result_type)
      OR f.prolang<>(SELECT oid FROM pg_catalog.pg_language WHERE lanname='plpgsql')
      OR f.proconfig IS DISTINCT FROM e.config OR f.probin IS NOT NULL OR f.prosupport<>0::pg_catalog.oid
      OR pg_catalog.encode(pg_catalog.sha256(pg_catalog.convert_to(f.prosrc,'UTF8')),'hex')<>e.body_hash
      OR pg_catalog.obj_description(f.oid,'pg_proc') IS DISTINCT FROM 'jetnity:v3-private-owner-guards:1:unbound'
      OR EXISTS(SELECT 1 FROM pg_catalog.aclexplode(COALESCE(f.proacl,pg_catalog.acldefault('f',owner_oid))) a
        WHERE a.grantee<>owner_oid OR a.grantor<>owner_oid OR a.privilege_type<>'EXECUTE')
      OR NOT pg_catalog.has_function_privilege(owner_oid,f.oid,'EXECUTE') THEN
      RAISE EXCEPTION 'pg1 exact inventory invalid' USING ERRCODE='P7703';
    END IF;
    IF EXISTS(SELECT 1 FROM pg_catalog.pg_roles r WHERE r.rolname IN ('anon','authenticated','service_role')
      AND (pg_catalog.has_function_privilege(r.oid,f.oid,'EXECUTE')
        OR pg_catalog.has_schema_privilege(r.oid,namespace_oid,'USAGE,CREATE'))) THEN
      RAISE EXCEPTION 'pg1 effective privileges invalid' USING ERRCODE='P7703';
    END IF;
  END LOOP;
END
$pg1_exact_inventory$;

COMMIT;
