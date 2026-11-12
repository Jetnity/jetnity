-- PG1 pre-use removal ONLY. Not MA1 recovery and not the disposable MA1 rollback.
-- Requires Root's separately persisted exact-target/current-consumer readback
-- and a controlled quiescent interval through COMMIT. These two caller settings
-- are an explicit operator acknowledgement, NOT proof of external quiescence:
-- jetnity.pg1_recovery_context = root-verified-unbound-quiescent-v1
-- jetnity.pg1_recovery_namespace_oid = exact current namespace OID from that readback
-- Missing evidence => do not set them or execute. No blanket dependency guarantee.
-- Unknown COMMIT => new-scope readback, never blind replay.
BEGIN;
SET LOCAL search_path=pg_catalog;
SET LOCAL lock_timeout='2s';
SET LOCAL statement_timeout='10s';
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

DO $pg1_recovery_scope$
DECLARE namespace_oid oid;
BEGIN
  SELECT oid INTO namespace_oid FROM pg_catalog.pg_namespace WHERE nspname='jetnity_ot_auth';
  IF namespace_oid IS NULL
    OR pg_catalog.current_setting('jetnity.pg1_recovery_context',true)
      IS DISTINCT FROM 'root-verified-unbound-quiescent-v1'
    OR pg_catalog.current_setting('jetnity.pg1_recovery_namespace_oid',true)
      IS DISTINCT FROM namespace_oid::text
    OR EXISTS(SELECT 1 FROM pg_catalog.pg_namespace WHERE pg_catalog.left(nspname,12)='official_v3_')
    OR EXISTS(SELECT 1 FROM pg_catalog.pg_roles WHERE pg_catalog.left(rolname,6)='ot_v3_') THEN
    RAISE EXCEPTION 'pg1 removal context or consumer boundary invalid' USING ERRCODE='P7704';
  END IF;
END
$pg1_recovery_scope$;
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

-- Order is fixed. RESTRICT is a final backstop, not the external-consumer proof.
-- Existing approved methods/history require supported revocation or a separately
-- reviewed forward repair; this file never reads or deletes that history.
DROP FUNCTION jetnity_ot_auth.require_current_owner_session_v1() RESTRICT;
DROP FUNCTION jetnity_ot_auth.own_active_session_v1() RESTRICT;
DROP SCHEMA jetnity_ot_auth RESTRICT;
COMMIT;
