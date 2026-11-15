-- HMT1 source candidate; UNAPPLIED. Four public SQL SECURITY INVOKER wrappers only.
-- The unchanged HMA1/PG1 checks remain the human authority. No REST-only/D1-only claim.
-- Root/operator binds the exact Dev connection and absence of concurrent administrative DDL.
-- No global/default/schema/managed-role mutation; only these four new functions.
BEGIN;
SET TRANSACTION ISOLATION LEVEL READ COMMITTED;
SET LOCAL search_path=pg_catalog;
SET LOCAL lock_timeout='2s';
SET LOCAL statement_timeout='30s';
SELECT pg_catalog.pg_advisory_xact_lock(771101,1);
SELECT pg_catalog.pg_advisory_xact_lock(771102,1);
SELECT pg_catalog.pg_advisory_xact_lock(771103,1);

DO $hmt1_context$
DECLARE owner_oid oid; version_number integer;
BEGIN
  version_number:=pg_catalog.current_setting('server_version_num')::integer;
  SELECT oid INTO owner_oid FROM pg_catalog.pg_roles
    WHERE rolname='postgres' AND rolcanlogin AND rolinherit AND NOT rolsuper
      AND rolcreatedb AND rolcreaterole AND rolbypassrls;
  IF owner_oid IS NULL OR session_user<>'postgres' OR current_user<>'postgres'
    OR version_number<170000 OR version_number>=180000
    OR pg_catalog.current_setting('server_encoding')<>'UTF8'
    OR pg_catalog.current_setting('createrole_self_grant',true) IS DISTINCT FROM ''
    OR pg_catalog.current_database()<>'postgres'
    OR pg_catalog.current_setting('jetnity.hmt1_target',true)
       IS DISTINCT FROM 'dev:yfvbxvijcorffwxbxahl:postgres:E18B6824905662'
    OR NOT EXISTS(SELECT 1 FROM pg_catalog.pg_database WHERE datname='postgres' AND datdba=owner_oid)
    OR NOT EXISTS(SELECT 1 FROM pg_catalog.pg_roles WHERE oid=10 AND rolsuper)
    OR (SELECT count(*) FROM pg_catalog.pg_roles WHERE rolname IN ('anon','authenticated','service_role'))<>3
    OR EXISTS(SELECT 1 FROM pg_catalog.pg_auth_members WHERE roleid=owner_oid)
    OR EXISTS(SELECT 1 FROM pg_catalog.pg_roles r WHERE r.rolname IN ('anon','authenticated','service_role')
      AND (pg_catalog.pg_has_role(r.oid,owner_oid,'SET') OR pg_catalog.pg_has_role(r.oid,owner_oid,'USAGE'))) THEN
    RAISE EXCEPTION 'hmt1 target or creator boundary invalid' USING ERRCODE='P7901';
  END IF;
END
$hmt1_context$;

-- This source-owned profile is the finite E18B receipt, not a learned ACL.
-- Root must independently bind the connector/project/creator before sending it;
-- the target GUC acknowledges that external fact and cannot establish it.
DO $hmt1_public_boundary$
DECLARE owner_oid oid:='postgres'::pg_catalog.regrole;
  schema_owner oid:='pg_database_owner'::pg_catalog.regrole; public_oid oid;
BEGIN
  SELECT oid INTO public_oid FROM pg_catalog.pg_namespace
    WHERE oid=2200 AND nspname='public' AND nspowner=schema_owner;
  IF public_oid IS NULL
    OR NOT EXISTS(SELECT 1 FROM pg_catalog.pg_roles WHERE oid=schema_owner AND NOT rolcanlogin AND rolinherit AND NOT rolsuper)
    OR (SELECT pg_catalog.array_agg(r.rolname::text ORDER BY r.rolname)
      FROM pg_catalog.pg_roles r WHERE NOT r.rolsuper AND pg_catalog.has_schema_privilege(r.oid,public_oid,'CREATE'))
      IS DISTINCT FROM ARRAY['pg_database_owner','postgres']::text[]
    OR NOT pg_catalog.has_schema_privilege(owner_oid,public_oid,'USAGE')
    OR (SELECT count(*) FROM pg_catalog.pg_namespace n CROSS JOIN LATERAL pg_catalog.aclexplode(n.nspacl) a WHERE n.oid=public_oid)<>7
    OR (SELECT count(DISTINCT (a.grantee,a.privilege_type)) FROM pg_catalog.pg_namespace n CROSS JOIN LATERAL pg_catalog.aclexplode(n.nspacl) a WHERE n.oid=public_oid)<>7
    OR EXISTS(SELECT 1 FROM pg_catalog.pg_namespace n CROSS JOIN LATERAL pg_catalog.aclexplode(n.nspacl) a
      WHERE n.oid=public_oid AND (a.grantor<>schema_owner OR a.is_grantable OR
        NOT ((a.grantee=schema_owner AND a.privilege_type IN ('USAGE','CREATE'))
          OR (a.grantee IN (0,owner_oid,'anon'::pg_catalog.regrole,'authenticated'::pg_catalog.regrole,'service_role'::pg_catalog.regrole)
            AND a.privilege_type='USAGE'))))
    OR EXISTS(SELECT 1 FROM pg_catalog.pg_default_acl WHERE defaclrole=owner_oid AND defaclobjtype='f' AND defaclnamespace=0)
    OR (SELECT count(*) FROM pg_catalog.pg_default_acl WHERE defaclrole=owner_oid AND defaclobjtype='f' AND defaclnamespace=public_oid)<>1
    OR (SELECT count(*) FROM pg_catalog.pg_default_acl d CROSS JOIN LATERAL pg_catalog.aclexplode(d.defaclacl) a
      WHERE d.defaclrole=owner_oid AND d.defaclobjtype='f' AND d.defaclnamespace=public_oid)<>2
    OR (SELECT count(DISTINCT a.grantee) FROM pg_catalog.pg_default_acl d CROSS JOIN LATERAL pg_catalog.aclexplode(d.defaclacl) a
      WHERE d.defaclrole=owner_oid AND d.defaclobjtype='f' AND d.defaclnamespace=public_oid)<>2
    OR EXISTS(SELECT 1 FROM pg_catalog.pg_default_acl d CROSS JOIN LATERAL pg_catalog.aclexplode(d.defaclacl) a
      WHERE d.defaclrole=owner_oid AND d.defaclobjtype='f' AND d.defaclnamespace=public_oid
        AND (a.grantor<>owner_oid OR a.grantee NOT IN (owner_oid,'service_role'::pg_catalog.regrole)
          OR a.privilege_type<>'EXECUTE' OR a.is_grantable)) THEN
    RAISE EXCEPTION 'hmt1 public schema or creator defaults differ from E18B' USING ERRCODE='P7902';
  END IF;
END
$hmt1_public_boundary$;

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

DO $ma1_exact_boundary$
DECLARE
  owner_oid oid:='postgres'::pg_catalog.regrole;
  reader_oid oid:='ot_v3_method_reader'::pg_catalog.regrole;
  human_oid oid:='authenticated'::pg_catalog.regrole;
  e record; f record; assigned oid; boundary_error CONSTANT text:='P7505';
BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_catalog.pg_roles r WHERE r.oid=reader_oid
    AND NOT r.rolcanlogin AND NOT r.rolinherit AND NOT r.rolsuper AND NOT r.rolcreatedb
    AND NOT r.rolcreaterole AND NOT r.rolreplication AND NOT r.rolbypassrls
    AND r.rolconnlimit=-1 AND r.rolvaliduntil IS NULL)
    OR (SELECT count(*) FROM pg_catalog.pg_auth_members m WHERE m.roleid=reader_oid OR m.member=reader_oid)<>1
    OR NOT EXISTS(SELECT 1 FROM pg_catalog.pg_auth_members m WHERE m.roleid=reader_oid
      AND m.member=owner_oid AND m.grantor=10 AND m.admin_option AND NOT m.inherit_option AND NOT m.set_option)
    OR pg_catalog.pg_has_role(owner_oid,reader_oid,'SET')
    OR pg_catalog.pg_has_role(owner_oid,reader_oid,'USAGE')
    OR EXISTS (SELECT 1 FROM pg_catalog.pg_db_role_setting s WHERE s.setrole=reader_oid)
    OR (SELECT count(*) FROM pg_catalog.pg_namespace n WHERE n.nspname IN ('official_v3_method_private','official_v3_method_api')
      AND n.nspowner=owner_oid AND pg_catalog.obj_description(n.oid,'pg_namespace')='jetnity:hma1:hosted-creator-v1:unused')<>2 THEN
    RAISE EXCEPTION 'ma1 exact boundary invalid' USING ERRCODE=boundary_error;
  END IF;
  IF (SELECT pg_catalog.array_agg(n.nspname||'.'||c.relname||':'||c.relkind::text ORDER BY n.nspname,c.relname)
    FROM pg_catalog.pg_class c JOIN pg_catalog.pg_namespace n ON n.oid=c.relnamespace
    WHERE n.nspname IN ('official_v3_method_private','official_v3_method_api')) IS DISTINCT FROM ARRAY[
      'official_v3_method_private.heads_v1:r','official_v3_method_private.heads_v1_pkey:i',
      'official_v3_method_private.operations_v1:r','official_v3_method_private.operations_v1_pkey:i',
      'official_v3_method_private.revisions_v1:r','official_v3_method_private.revisions_v1_pkey:i',
      'official_v3_method_private.revisions_v1_tuple_key:i']::text[]
    OR EXISTS (SELECT 1 FROM pg_catalog.pg_class c JOIN pg_catalog.pg_namespace n ON n.oid=c.relnamespace
      WHERE n.nspname='official_v3_method_private' AND (c.relowner<>owner_oid OR
        (c.relkind='r' AND (NOT c.relrowsecurity OR NOT c.relforcerowsecurity OR c.relpersistence<>'p')))) THEN
    RAISE EXCEPTION 'ma1 exact boundary invalid' USING ERRCODE=boundary_error;
  END IF;
  -- Column identities, ordinal positions, exact base types, nullability and no defaults.
  FOR e IN SELECT * FROM (VALUES
    ('revisions_v1',1,'method_id','text',true),('revisions_v1',2,'revision','integer',true),
    ('revisions_v1',3,'method_digest','text',true),('revisions_v1',4,'package_digest','text',true),
    ('revisions_v1',5,'predecessor_revision','integer',false),('revisions_v1',6,'staged_at','timestamp with time zone',true),
    ('revisions_v1',7,'staged_by','uuid',true),
    ('heads_v1',1,'method_id','text',true),('heads_v1',2,'revision','integer',true),
    ('heads_v1',3,'method_digest','text',true),('heads_v1',4,'package_digest','text',true),
    ('heads_v1',5,'epoch','integer',true),('heads_v1',6,'status','text',true),
    ('heads_v1',7,'approval_mode','text',false),('heads_v1',8,'approval_until','timestamp with time zone',false),
    ('heads_v1',9,'changed_at','timestamp with time zone',true),('heads_v1',10,'changed_by','uuid',true),
    ('heads_v1',11,'operation_id','text',true),
    ('operations_v1',1,'operation_id','text',true),('operations_v1',2,'action','text',true),
    ('operations_v1',3,'method_id','text',true),('operations_v1',4,'revision','integer',true),
    ('operations_v1',5,'command','jsonb',true),('operations_v1',6,'before_state','jsonb',false),
    ('operations_v1',7,'after_state','jsonb',false),('operations_v1',8,'actor_id','uuid',true),
    ('operations_v1',9,'recorded_at','timestamp with time zone',true)
  ) AS expected(table_name,ordinal,column_name,type_name,required) LOOP
    IF NOT EXISTS (SELECT 1 FROM pg_catalog.pg_attribute a WHERE a.attrelid=pg_catalog.to_regclass('official_v3_method_private.'||e.table_name)
      AND a.attnum=e.ordinal AND a.attname=e.column_name AND a.atttypid=pg_catalog.to_regtype(e.type_name)
      AND a.attnotnull=e.required AND NOT a.attisdropped AND NOT a.atthasdef AND a.attgenerated='' AND a.attidentity='') THEN
      RAISE EXCEPTION 'ma1 exact boundary invalid' USING ERRCODE=boundary_error;
    END IF;
  END LOOP;
  IF (SELECT count(*) FROM pg_catalog.pg_attribute a JOIN pg_catalog.pg_class c ON c.oid=a.attrelid
    JOIN pg_catalog.pg_namespace n ON n.oid=c.relnamespace WHERE n.nspname='official_v3_method_private'
    AND c.relkind='r' AND a.attnum>0)<>27 THEN
    RAISE EXCEPTION 'ma1 exact boundary invalid' USING ERRCODE=boundary_error;
  END IF;
  IF (SELECT pg_catalog.array_agg(c.conname||':'||c.contype::text ORDER BY c.conname)
    FROM pg_catalog.pg_constraint c WHERE c.connamespace='official_v3_method_private'::pg_catalog.regnamespace)
    IS DISTINCT FROM ARRAY['heads_v1_pkey:p','heads_v1_revision_fk:f','heads_v1_shape:c',
      'operations_v1_pkey:p','operations_v1_revision_fk:f','operations_v1_shape:c',
      'revisions_v1_pkey:p','revisions_v1_predecessor_fk:f','revisions_v1_shape:c','revisions_v1_tuple_key:u']::text[]
    OR EXISTS (SELECT 1 FROM pg_catalog.pg_constraint c WHERE c.connamespace='official_v3_method_private'::pg_catalog.regnamespace
      AND (NOT c.convalidated OR c.condeferrable OR c.condeferred OR c.coninhcount<>0)) THEN
    RAISE EXCEPTION 'ma1 exact boundary invalid' USING ERRCODE=boundary_error;
  END IF;
  -- Source-owned exact deparser literals. No install-time learned/adopted receipt.
  -- pg_catalog search_path and pretty=false are fixed; native CI must prove these
  -- exact definitions before acceptance. A mismatch fails closed, never normalizes.
  FOR e IN SELECT * FROM (VALUES
    ('revisions_v1_shape',$ma1_expected$(official_v3_method_private.tuple_valid_v1(method_id, revision, method_digest, package_digest) AND (((revision = 1) AND (predecessor_revision IS NULL)) OR ((revision > 1) AND (predecessor_revision IS NOT NULL) AND (predecessor_revision = (revision - 1)))) AND isfinite(staged_at))$ma1_expected$),
    ('heads_v1_shape',$ma1_expected$(official_v3_method_private.tuple_valid_v1(method_id, revision, method_digest, package_digest) AND ((epoch >= 1) AND (epoch <= 2147483647)) AND (status = ANY (ARRAY['approved'::text, 'revoked'::text])) AND (operation_id ~ '^maop1_[0-9a-f]{32}$'::text) AND isfinite(changed_at) AND (((status = 'revoked'::text) AND (approval_mode IS NULL) AND (approval_until IS NULL)) OR ((status = 'approved'::text) AND (epoch <= 2147483646) AND (approval_mode IS NOT NULL) AND (((approval_mode = 'until_revoked'::text) AND (approval_until IS NULL)) OR ((approval_mode = 'until'::text) AND (approval_until IS NOT NULL) AND isfinite(approval_until) AND (date_trunc('milliseconds'::text, approval_until) = approval_until) AND ((EXTRACT(year FROM (approval_until AT TIME ZONE 'UTC'::text)) >= (1)::numeric) AND (EXTRACT(year FROM (approval_until AT TIME ZONE 'UTC'::text)) <= (9999)::numeric)))))))$ma1_expected$),
    ('operations_v1_shape',$ma1_expected$((operation_id ~ '^maop1_[0-9a-f]{32}$'::text) AND (action = ANY (ARRAY['stage'::text, 'approve'::text, 'revoke'::text])) AND (method_id ~ '^[a-z][a-z0-9_-]{1,63}$'::text) AND ((revision >= 1) AND (revision <= 2147483647)) AND (jsonb_typeof(command) = 'object'::text) AND (octet_length((command)::text) <= 4096) AND (command ?& ARRAY['schema'::text, 'operationId'::text, 'action'::text, 'methodId'::text, 'revision'::text, 'methodDigest'::text, 'packageDigest'::text, 'predecessorRevision'::text, 'expected'::text, 'approval'::text]) AND ((command - ARRAY['schema'::text, 'operationId'::text, 'action'::text, 'methodId'::text, 'revision'::text, 'methodDigest'::text, 'packageDigest'::text, 'predecessorRevision'::text, 'expected'::text, 'approval'::text]) = '{}'::jsonb) AND ((command -> 'schema'::text) = '1'::jsonb) AND ((command -> 'revision'::text) = to_jsonb(revision)) AND ((command ->> 'operationId'::text) = operation_id) AND ((command ->> 'action'::text) = action) AND ((command ->> 'methodId'::text) = method_id) AND (command = official_v3_method_private.command_v1(operation_id, action, method_id, revision, (command ->> 'methodDigest'::text), (command ->> 'packageDigest'::text), ((command ->> 'predecessorRevision'::text))::integer, (((command -> 'expected'::text) ->> 'revision'::text))::integer, ((command -> 'expected'::text) ->> 'methodDigest'::text), ((command -> 'expected'::text) ->> 'packageDigest'::text), (((command -> 'expected'::text) ->> 'epoch'::text))::integer, ((command -> 'expected'::text) ->> 'status'::text), ((command -> 'approval'::text) ->> 'mode'::text), ((command -> 'approval'::text) ->> 'until'::text))) AND ((before_state IS NULL) OR ((jsonb_typeof(before_state) = 'object'::text) AND (octet_length((before_state)::text) <= 1024) AND (before_state ?& ARRAY['methodId'::text, 'revision'::text, 'methodDigest'::text, 'packageDigest'::text, 'epoch'::text, 'status'::text, 'approvalMode'::text, 'approvalUntil'::text]) AND ((before_state - ARRAY['methodId'::text, 'revision'::text, 'methodDigest'::text, 'packageDigest'::text, 'epoch'::text, 'status'::text, 'approvalMode'::text, 'approvalUntil'::text]) = '{}'::jsonb) AND ((before_state ->> 'methodId'::text) = method_id))) AND ((after_state IS NULL) OR ((jsonb_typeof(after_state) = 'object'::text) AND (octet_length((after_state)::text) <= 1024) AND (after_state ?& ARRAY['methodId'::text, 'revision'::text, 'methodDigest'::text, 'packageDigest'::text, 'epoch'::text, 'status'::text, 'approvalMode'::text, 'approvalUntil'::text]) AND ((after_state - ARRAY['methodId'::text, 'revision'::text, 'methodDigest'::text, 'packageDigest'::text, 'epoch'::text, 'status'::text, 'approvalMode'::text, 'approvalUntil'::text]) = '{}'::jsonb) AND ((after_state ->> 'methodId'::text) = method_id))) AND isfinite(recorded_at))$ma1_expected$)
  ) AS expected(constraint_name,expression) LOOP
    IF NOT EXISTS (SELECT 1 FROM pg_catalog.pg_constraint c
      WHERE c.connamespace='official_v3_method_private'::pg_catalog.regnamespace AND c.contype='c'
        AND c.conname=e.constraint_name AND pg_catalog.pg_get_expr(c.conbin,c.conrelid,false)=e.expression) THEN
      RAISE EXCEPTION 'ma1 exact boundary invalid' USING ERRCODE=boundary_error;
    END IF;
  END LOOP;
  FOR e IN SELECT * FROM (VALUES
    ('revisions_v1_pkey','revisions_v1',ARRAY[1,2]::smallint[],NULL::smallint[]),
    ('revisions_v1_tuple_key','revisions_v1',ARRAY[1,2,3,4]::smallint[],NULL::smallint[]),
    ('heads_v1_pkey','heads_v1',ARRAY[1]::smallint[],NULL::smallint[]),
    ('operations_v1_pkey','operations_v1',ARRAY[1]::smallint[],NULL::smallint[]),
    ('revisions_v1_predecessor_fk','revisions_v1',ARRAY[1,5]::smallint[],ARRAY[1,2]::smallint[]),
    ('heads_v1_revision_fk','heads_v1',ARRAY[1,2,3,4]::smallint[],ARRAY[1,2,3,4]::smallint[]),
    ('operations_v1_revision_fk','operations_v1',ARRAY[3,4]::smallint[],ARRAY[1,2]::smallint[])
  ) AS expected(constraint_name,table_name,keys,foreign_keys) LOOP
    IF NOT EXISTS (SELECT 1 FROM pg_catalog.pg_constraint c WHERE c.connamespace='official_v3_method_private'::pg_catalog.regnamespace
      AND c.conname=e.constraint_name AND c.conrelid=pg_catalog.to_regclass('official_v3_method_private.'||e.table_name)
      AND c.conkey=e.keys AND (e.foreign_keys IS NULL OR (c.confkey=e.foreign_keys
        AND c.confrelid='official_v3_method_private.revisions_v1'::pg_catalog.regclass
        AND c.confupdtype='a' AND c.confdeltype='a' AND c.confmatchtype='s'))) THEN
      RAISE EXCEPTION 'ma1 exact boundary invalid' USING ERRCODE=boundary_error;
    END IF;
  END LOOP;
  IF (SELECT pg_catalog.array_agg(c.relname||':'||t.tgname ORDER BY c.relname,t.tgname)
    FROM pg_catalog.pg_trigger t JOIN pg_catalog.pg_class c ON c.oid=t.tgrelid JOIN pg_catalog.pg_namespace n ON n.oid=c.relnamespace
    WHERE n.nspname='official_v3_method_private' AND NOT t.tgisinternal)
    IS DISTINCT FROM ARRAY['operations_v1:operations_v1_immutable','revisions_v1:revisions_v1_immutable']::text[]
    OR EXISTS (SELECT 1 FROM pg_catalog.pg_trigger t JOIN pg_catalog.pg_class c ON c.oid=t.tgrelid
      JOIN pg_catalog.pg_namespace n ON n.oid=c.relnamespace WHERE n.nspname='official_v3_method_private' AND NOT t.tgisinternal
      AND (t.tgfoid<>'official_v3_method_private.immutable_v1()'::pg_catalog.regprocedure OR t.tgtype<>27
        OR t.tgenabled<>'O' OR t.tgnargs<>0 OR t.tgqual IS NOT NULL)) THEN
    RAISE EXCEPTION 'ma1 exact boundary invalid' USING ERRCODE=boundary_error;
  END IF;
  IF (SELECT count(*) FROM pg_catalog.pg_policy p JOIN pg_catalog.pg_class c ON c.oid=p.polrelid
    JOIN pg_catalog.pg_namespace n ON n.oid=c.relnamespace WHERE n.nspname='official_v3_method_private')<>3
    OR EXISTS (SELECT 1 FROM pg_catalog.pg_policy p JOIN pg_catalog.pg_class c ON c.oid=p.polrelid
      JOIN pg_catalog.pg_namespace n ON n.oid=c.relnamespace WHERE n.nspname='official_v3_method_private'
      AND (p.polname<>c.relname||'_owner' OR p.polcmd<>'*' OR NOT p.polpermissive
        OR p.polroles IS DISTINCT FROM ARRAY[owner_oid] OR pg_catalog.pg_get_expr(p.polqual,p.polrelid)<>'true'
        OR pg_catalog.pg_get_expr(p.polwithcheck,p.polrelid)<>'true')) THEN
    RAISE EXCEPTION 'ma1 exact boundary invalid' USING ERRCODE=boundary_error;
  END IF;
  -- Effective ACL validation includes inherited access checks below. No normalization.
  IF EXISTS (SELECT 1 FROM pg_catalog.pg_namespace n CROSS JOIN LATERAL
    pg_catalog.aclexplode(COALESCE(n.nspacl,pg_catalog.acldefault('n',n.nspowner))) a
    WHERE n.nspname IN ('official_v3_method_private','official_v3_method_api') AND a.grantee<>owner_oid
      AND NOT (n.nspname='official_v3_method_api' AND a.grantee IN (reader_oid,human_oid) AND a.privilege_type='USAGE' AND NOT a.is_grantable))
    OR (SELECT count(*) FROM pg_catalog.pg_namespace n CROSS JOIN LATERAL pg_catalog.aclexplode(n.nspacl) a
      WHERE n.nspname='official_v3_method_api' AND a.grantee IN (reader_oid,human_oid) AND a.privilege_type='USAGE' AND NOT a.is_grantable)<>2
    OR EXISTS (SELECT 1 FROM pg_catalog.pg_class c JOIN pg_catalog.pg_namespace n ON n.oid=c.relnamespace
      CROSS JOIN LATERAL pg_catalog.aclexplode(COALESCE(c.relacl,pg_catalog.acldefault('r',c.relowner))) a
      WHERE n.nspname='official_v3_method_private' AND c.relkind='r' AND a.grantee<>owner_oid)
    OR EXISTS (SELECT 1 FROM pg_catalog.pg_attribute a JOIN pg_catalog.pg_class c ON c.oid=a.attrelid
      JOIN pg_catalog.pg_namespace n ON n.oid=c.relnamespace WHERE n.nspname='official_v3_method_private' AND a.attacl IS NOT NULL) THEN
    RAISE EXCEPTION 'ma1 exact boundary invalid' USING ERRCODE=boundary_error;
  END IF;
  IF (SELECT count(*) FROM pg_catalog.pg_proc p JOIN pg_catalog.pg_namespace n ON n.oid=p.pronamespace
    WHERE n.nspname IN ('official_v3_method_private','official_v3_method_api'))<>10 THEN
    RAISE EXCEPTION 'ma1 exact boundary invalid' USING ERRCODE=boundary_error;
  END IF;
  FOR e IN SELECT * FROM (VALUES
    ('official_v3_method_private.tuple_valid_v1(text,integer,text,text)',false,'i','s',0),
    ('official_v3_method_private.timestamp_v1(text)',false,'i','s',0),
    ('official_v3_method_private.command_v1(text,text,text,integer,text,text,integer,integer,text,text,integer,text,text,text)',false,'i','s',0),
    ('official_v3_method_private.immutable_v1()',false,'v','u',0),
    ('official_v3_method_private.require_current_locked_v1(text,integer,text,text,integer)',true,'v','u',0),
    ('official_v3_method_api.stage_draft_v1(text,text,integer,text,text,integer)',true,'v','u',1),
    ('official_v3_method_api.approve_v1(text,text,integer,text,text,integer,text,text,integer,text,text,text)',true,'v','u',1),
    ('official_v3_method_api.revoke_v1(text,text,integer,text,text,integer)',true,'v','u',1),
    ('official_v3_method_api.confirm_operation_v1(text,text,text,integer,text,text,integer,integer,text,text,integer,text,text,text)',true,'v','u',1),
    ('official_v3_method_api.read_current_v1(text,integer,text,text,text)',true,'v','u',2)
  ) AS expected(signature,definer,volatility,parallel_kind,grant_kind) LOOP
    SELECT p.* INTO f FROM pg_catalog.pg_proc p WHERE p.oid=pg_catalog.to_regprocedure(e.signature);
    IF NOT FOUND OR f.proowner<>owner_oid OR f.prosecdef<>e.definer OR f.provolatile::text<>e.volatility
      OR f.proparallel::text<>e.parallel_kind OR f.proisstrict OR f.pronargdefaults<>0
      OR f.proconfig IS DISTINCT FROM ARRAY['search_path=pg_catalog']::text[] THEN
      RAISE EXCEPTION 'ma1 exact boundary invalid' USING ERRCODE=boundary_error;
    END IF;
    assigned:=CASE e.grant_kind WHEN 1 THEN human_oid WHEN 2 THEN reader_oid ELSE NULL END;
    IF EXISTS (SELECT 1 FROM pg_catalog.aclexplode(COALESCE(f.proacl,pg_catalog.acldefault('f',owner_oid))) a
      WHERE a.grantee<>owner_oid AND (assigned IS NULL OR a.grantee<>assigned OR a.privilege_type<>'EXECUTE' OR a.is_grantable))
      OR (assigned IS NOT NULL AND NOT EXISTS (SELECT 1 FROM pg_catalog.aclexplode(f.proacl) a
        WHERE a.grantee=assigned AND a.privilege_type='EXECUTE' AND NOT a.is_grantable))
      OR pg_catalog.has_function_privilege('anon',f.oid,'EXECUTE') OR pg_catalog.has_function_privilege('service_role',f.oid,'EXECUTE')
      OR (e.grant_kind<>1 AND pg_catalog.has_function_privilege(human_oid,f.oid,'EXECUTE'))
      OR (e.grant_kind<>2 AND pg_catalog.has_function_privilege(reader_oid,f.oid,'EXECUTE')) THEN
      RAISE EXCEPTION 'ma1 exact boundary invalid' USING ERRCODE=boundary_error;
    END IF;
  END LOOP;
  FOR e IN SELECT rolname FROM pg_catalog.pg_roles WHERE rolname IN ('anon','authenticated','service_role','ot_v3_method_reader') LOOP
    IF pg_catalog.has_schema_privilege(e.rolname,'official_v3_method_private','USAGE,CREATE')
      OR pg_catalog.has_schema_privilege(e.rolname,'official_v3_method_api','CREATE')
      OR (e.rolname IN ('anon','service_role') AND pg_catalog.has_schema_privilege(e.rolname,'official_v3_method_api','USAGE'))
      OR EXISTS (SELECT 1 FROM pg_catalog.pg_class c WHERE c.relnamespace='official_v3_method_private'::pg_catalog.regnamespace
        AND c.relkind='r' AND pg_catalog.has_table_privilege(e.rolname,c.oid,'SELECT,INSERT,UPDATE,DELETE,TRUNCATE,REFERENCES,TRIGGER')) THEN
      RAISE EXCEPTION 'ma1 exact boundary invalid' USING ERRCODE=boundary_error;
    END IF;
  END LOOP;
END
$ma1_exact_boundary$;

DO $hma1_exact_identity$
DECLARE owner_oid oid:='postgres'::pg_catalog.regrole; reader_oid oid:='ot_v3_method_reader'::pg_catalog.regrole; e record; f record;
BEGIN
  IF NOT EXISTS(SELECT 1 FROM pg_catalog.pg_roles WHERE oid=reader_oid AND rolconfig IS NULL)
    OR EXISTS(SELECT 1 FROM pg_catalog.pg_db_role_setting WHERE setrole=reader_oid)
    OR EXISTS(SELECT 1 FROM pg_catalog.pg_default_acl WHERE defaclrole=reader_oid)
    OR EXISTS(SELECT 1 FROM pg_catalog.pg_shdepend WHERE refclassid='pg_catalog.pg_authid'::pg_catalog.regclass AND refobjid=reader_oid AND deptype='o')
    OR NOT EXISTS(SELECT 1 FROM pg_catalog.pg_roles WHERE oid=10 AND rolsuper)
    OR (SELECT count(*) FROM pg_catalog.pg_auth_members m WHERE m.roleid=reader_oid OR m.member=reader_oid)<>1
    OR NOT EXISTS(SELECT 1 FROM pg_catalog.pg_auth_members m WHERE m.roleid=reader_oid
      AND m.member=owner_oid AND m.grantor=10 AND m.admin_option AND NOT m.inherit_option AND NOT m.set_option)
    OR pg_catalog.pg_has_role(owner_oid,reader_oid,'SET')
    OR pg_catalog.pg_has_role(owner_oid,reader_oid,'USAGE')
    OR EXISTS(SELECT 1 FROM pg_catalog.pg_depend d WHERE d.deptype='e' AND (
      (d.classid='pg_catalog.pg_namespace'::pg_catalog.regclass AND d.objid IN ('official_v3_method_private'::pg_catalog.regnamespace,'official_v3_method_api'::pg_catalog.regnamespace))
      OR (d.classid='pg_catalog.pg_proc'::pg_catalog.regclass AND d.objid IN (SELECT oid FROM pg_catalog.pg_proc WHERE pronamespace IN ('official_v3_method_private'::pg_catalog.regnamespace,'official_v3_method_api'::pg_catalog.regnamespace)))
      OR (d.classid='pg_catalog.pg_class'::pg_catalog.regclass AND d.objid IN (SELECT oid FROM pg_catalog.pg_class WHERE relnamespace IN ('official_v3_method_private'::pg_catalog.regnamespace,'official_v3_method_api'::pg_catalog.regnamespace))))) THEN
    RAISE EXCEPTION 'hma1 exact identity invalid' USING ERRCODE='P7802';
  END IF;
  IF (SELECT pg_catalog.array_agg(n.nspname||'.'||t.typname ORDER BY n.nspname,t.typname)
      FROM pg_catalog.pg_type t JOIN pg_catalog.pg_namespace n ON n.oid=t.typnamespace
      WHERE n.nspname IN ('official_v3_method_private','official_v3_method_api'))
    IS DISTINCT FROM ARRAY[
      'official_v3_method_private._heads_v1','official_v3_method_private._operations_v1','official_v3_method_private._revisions_v1',
      'official_v3_method_private.heads_v1','official_v3_method_private.operations_v1','official_v3_method_private.revisions_v1']::text[]
    OR EXISTS(SELECT 1 FROM pg_catalog.pg_type t WHERE t.typnamespace IN ('official_v3_method_private'::pg_catalog.regnamespace,'official_v3_method_api'::pg_catalog.regnamespace)
      AND (t.typowner<>owner_oid OR t.typacl IS NOT NULL)) THEN
    RAISE EXCEPTION 'hma1 exact identity invalid' USING ERRCODE='P7802';
  END IF;
  -- Closed namespace inventory beyond tables/functions/types: reject foreign
  -- collations, operators, conversions, defaults or other dependent objects.
  IF EXISTS(SELECT 1 FROM pg_catalog.pg_depend d
    WHERE d.refclassid='pg_catalog.pg_namespace'::pg_catalog.regclass
      AND d.refobjid IN ('official_v3_method_private'::pg_catalog.regnamespace,'official_v3_method_api'::pg_catalog.regnamespace)
      AND NOT(d.objsubid=0 AND d.deptype='n' AND (
        (d.classid='pg_catalog.pg_class'::pg_catalog.regclass AND EXISTS(SELECT 1 FROM pg_catalog.pg_class c
          WHERE c.oid=d.objid AND c.relnamespace=d.refobjid))
        OR (d.classid='pg_catalog.pg_proc'::pg_catalog.regclass AND EXISTS(SELECT 1 FROM pg_catalog.pg_proc p
          WHERE p.oid=d.objid AND p.pronamespace=d.refobjid))
        OR (d.classid='pg_catalog.pg_type'::pg_catalog.regclass AND EXISTS(SELECT 1 FROM pg_catalog.pg_type t
          WHERE t.oid=d.objid AND t.typnamespace=d.refobjid))
        OR (d.classid='pg_catalog.pg_constraint'::pg_catalog.regclass AND EXISTS(SELECT 1 FROM pg_catalog.pg_constraint c
          WHERE c.oid=d.objid AND c.connamespace=d.refobjid))))) THEN
    RAISE EXCEPTION 'hma1 exact identity invalid' USING ERRCODE='P7802';
  END IF;
  FOR e IN SELECT * FROM (VALUES
    ('official_v3_method_private.tuple_valid_v1(text,integer,text,text)','bool',false,'sql',ARRAY['p_method_id','p_revision','p_method_digest','p_package_digest']::text[],'15741698f4f66adb08e23694b15c6bb9d071b8c01e1123ba7087c4c3d50c6662'),
    ('official_v3_method_private.timestamp_v1(text)','timestamptz',false,'plpgsql',ARRAY['p_value']::text[],'35e5ada766b2b82bc585d403725c2232ffb4c28b3395d9623797a873413cefb1'),
    ('official_v3_method_private.command_v1(text,text,text,integer,text,text,integer,integer,text,text,integer,text,text,text)','jsonb',false,'plpgsql',ARRAY['p_operation_id','p_action','p_method_id','p_revision','p_method_digest','p_package_digest','p_predecessor_revision','p_expected_revision','p_expected_method_digest','p_expected_package_digest','p_expected_epoch','p_expected_status','p_approval_mode','p_approval_until']::text[],'ef0a7fe89cd5bc2d15a40f8ec01ab1dd2bc2f7d6f64498409e9485761597561b'),
    ('official_v3_method_private.immutable_v1()','trigger',false,'plpgsql',NULL::text[],'2a4782a3ca5e568a170743800ad36ea5c8c0a6b926c7524acfe9718c74ffe3a4'),
    ('official_v3_method_api.confirm_operation_v1(text,text,text,integer,text,text,integer,integer,text,text,integer,text,text,text)','jsonb',false,'plpgsql',ARRAY['p_operation_id','p_action','p_method_id','p_revision','p_method_digest','p_package_digest','p_predecessor_revision','p_expected_revision','p_expected_method_digest','p_expected_package_digest','p_expected_epoch','p_expected_status','p_approval_mode','p_approval_until']::text[],'232cdcfb8c10161336d2755a83c2a941dd3a582b235515b01f7d6c167579078b'),
    ('official_v3_method_api.stage_draft_v1(text,text,integer,text,text,integer)','jsonb',false,'plpgsql',ARRAY['p_operation_id','p_method_id','p_revision','p_method_digest','p_package_digest','p_predecessor_revision']::text[],'947d017cbc27e70a1df22ecbd19214e295d5162f371e00c8d040076e5a168c90'),
    ('official_v3_method_api.approve_v1(text,text,integer,text,text,integer,text,text,integer,text,text,text)','jsonb',false,'plpgsql',ARRAY['p_operation_id','p_method_id','p_revision','p_method_digest','p_package_digest','p_expected_revision','p_expected_method_digest','p_expected_package_digest','p_expected_epoch','p_expected_status','p_approval_mode','p_approval_until']::text[],'df1a49cd377c135460f3e3691303bbe527c4b3fc4e293b486a85ea5b8b1a3f49'),
    ('official_v3_method_api.revoke_v1(text,text,integer,text,text,integer)','jsonb',false,'plpgsql',ARRAY['p_operation_id','p_method_id','p_revision','p_method_digest','p_package_digest','p_expected_epoch']::text[],'c6296c4a05ee52b32cdcf6145007dc5b8c3fd6867cf155e500b8bc27f738772f'),
    ('official_v3_method_api.read_current_v1(text,integer,text,text,text)','record',true,'plpgsql',ARRAY['p_method_id','p_revision','p_method_digest','p_package_digest','p_checked_at']::text[],'e5688f6912d6ac5098d3826001386e19e163bf3df16ae3d7503a0ab18bb48de2'),
    ('official_v3_method_private.require_current_locked_v1(text,integer,text,text,integer)','void',false,'plpgsql',ARRAY['p_method_id','p_revision','p_method_digest','p_package_digest','p_epoch']::text[],'7e98f2a32a2388efde95d729d425581bf9443e4397eb8311d82e6a46eb88ca8c')
  ) AS expected(signature,result_type,returns_set,language_name,input_names,body_hash) LOOP
    SELECT p.* INTO f FROM pg_catalog.pg_proc p WHERE p.oid=pg_catalog.to_regprocedure(e.signature);
    IF NOT FOUND OR f.proowner<>owner_oid OR f.prokind<>'f' OR f.proretset<>e.returns_set OR f.proleakproof
      OR f.provariadic<>0 OR f.probin IS NOT NULL OR f.prosupport<>0::pg_catalog.oid OR f.prosqlbody IS NOT NULL
      OR f.prolang<>(SELECT oid FROM pg_catalog.pg_language WHERE lanname=e.language_name)
      OR f.prorettype<>pg_catalog.to_regtype('pg_catalog.'||e.result_type)
      OR pg_catalog.encode(pg_catalog.sha256(pg_catalog.convert_to(f.prosrc,'UTF8')),'hex')<>e.body_hash
      OR EXISTS(SELECT 1 FROM pg_catalog.aclexplode(COALESCE(f.proacl,pg_catalog.acldefault('f',owner_oid))) a WHERE a.grantor<>owner_oid) THEN
      RAISE EXCEPTION 'hma1 exact identity invalid' USING ERRCODE='P7802';
    END IF;
    IF e.returns_set THEN
      IF f.proallargtypes IS DISTINCT FROM ARRAY['text'::pg_catalog.regtype::oid,'integer'::pg_catalog.regtype::oid,'text'::pg_catalog.regtype::oid,'text'::pg_catalog.regtype::oid,'text'::pg_catalog.regtype::oid,
          'text'::pg_catalog.regtype::oid,'text'::pg_catalog.regtype::oid,'integer'::pg_catalog.regtype::oid,'text'::pg_catalog.regtype::oid,'text'::pg_catalog.regtype::oid,'integer'::pg_catalog.regtype::oid,
          'text'::pg_catalog.regtype::oid,'text'::pg_catalog.regtype::oid,'text'::pg_catalog.regtype::oid,'integer'::pg_catalog.regtype::oid]
        OR f.proargmodes IS DISTINCT FROM ARRAY['i','i','i','i','i','t','t','t','t','t','t','t','t','t','t']::"char"[]
        OR f.proargnames IS DISTINCT FROM e.input_names||ARRAY['status','method_id','revision','method_digest','package_digest','epoch','approval_mode','approval_until','observed_at','remaining_ms']::text[] THEN
        RAISE EXCEPTION 'hma1 exact identity invalid' USING ERRCODE='P7802';
      END IF;
    ELSIF f.proallargtypes IS NOT NULL OR f.proargmodes IS NOT NULL OR f.proargnames IS DISTINCT FROM e.input_names THEN
      RAISE EXCEPTION 'hma1 exact identity invalid' USING ERRCODE='P7802';
    END IF;
  END LOOP;
END
$hma1_exact_identity$;

DO $hmt1_no_collisions$
BEGIN
  IF EXISTS(SELECT 1 FROM pg_catalog.pg_proc WHERE pronamespace=2200 AND proname IN ('official_v3_method_stage_draft_v1','official_v3_method_approve_v1','official_v3_method_revoke_v1','official_v3_method_confirm_operation_v1')) THEN
    RAISE EXCEPTION 'hmt1 refuses every existing same-name signature or kind' USING ERRCODE='P7904';
  END IF;
END
$hmt1_no_collisions$;

CREATE FUNCTION public.official_v3_method_stage_draft_v1(
  p_operation_id text,p_method_id text,p_revision integer,p_method_digest text,p_package_digest text,p_predecessor_revision integer)
RETURNS jsonb LANGUAGE SQL VOLATILE PARALLEL UNSAFE SECURITY INVOKER CALLED ON NULL INPUT
SET search_path=pg_catalog
RETURN official_v3_method_api.stage_draft_v1(p_operation_id,p_method_id,p_revision,p_method_digest,p_package_digest,p_predecessor_revision);

CREATE FUNCTION public.official_v3_method_approve_v1(
  p_operation_id text,p_method_id text,p_revision integer,p_method_digest text,p_package_digest text,p_expected_revision integer,p_expected_method_digest text,p_expected_package_digest text,p_expected_epoch integer,p_expected_status text,p_approval_mode text,p_approval_until text)
RETURNS jsonb LANGUAGE SQL VOLATILE PARALLEL UNSAFE SECURITY INVOKER CALLED ON NULL INPUT
SET search_path=pg_catalog
RETURN official_v3_method_api.approve_v1(p_operation_id,p_method_id,p_revision,p_method_digest,p_package_digest,p_expected_revision,p_expected_method_digest,p_expected_package_digest,p_expected_epoch,p_expected_status,p_approval_mode,p_approval_until);

CREATE FUNCTION public.official_v3_method_revoke_v1(
  p_operation_id text,p_method_id text,p_revision integer,p_method_digest text,p_package_digest text,p_expected_epoch integer)
RETURNS jsonb LANGUAGE SQL VOLATILE PARALLEL UNSAFE SECURITY INVOKER CALLED ON NULL INPUT
SET search_path=pg_catalog
RETURN official_v3_method_api.revoke_v1(p_operation_id,p_method_id,p_revision,p_method_digest,p_package_digest,p_expected_epoch);

CREATE FUNCTION public.official_v3_method_confirm_operation_v1(
  p_operation_id text,p_action text,p_method_id text,p_revision integer,p_method_digest text,p_package_digest text,p_predecessor_revision integer,p_expected_revision integer,p_expected_method_digest text,p_expected_package_digest text,p_expected_epoch integer,p_expected_status text,p_approval_mode text,p_approval_until text)
RETURNS jsonb LANGUAGE SQL VOLATILE PARALLEL UNSAFE SECURITY INVOKER CALLED ON NULL INPUT
SET search_path=pg_catalog
RETURN official_v3_method_api.confirm_operation_v1(p_operation_id,p_action,p_method_id,p_revision,p_method_digest,p_package_digest,p_predecessor_revision,p_expected_revision,p_expected_method_digest,p_expected_package_digest,p_expected_epoch,p_expected_status,p_approval_mode,p_approval_until);

DO $hmt1_new_acl_origin$
DECLARE owner_oid oid:='postgres'::pg_catalog.regrole; f record;
BEGIN
  FOR f IN SELECT p.* FROM pg_catalog.pg_proc p WHERE p.pronamespace=2200 AND p.proname IN ('official_v3_method_stage_draft_v1','official_v3_method_approve_v1','official_v3_method_revoke_v1','official_v3_method_confirm_operation_v1') LOOP
    IF f.proowner<>owner_oid OR f.proacl IS NULL
      OR (SELECT count(*) FROM pg_catalog.aclexplode(f.proacl))<>3
      OR (SELECT count(DISTINCT a.grantee) FROM pg_catalog.aclexplode(f.proacl) a)<>3
      OR EXISTS(SELECT 1 FROM pg_catalog.aclexplode(f.proacl) a WHERE a.grantor<>owner_oid
        OR a.grantee NOT IN (0,owner_oid,'service_role'::pg_catalog.regrole)
        OR a.privilege_type<>'EXECUTE' OR a.is_grantable) THEN
      RAISE EXCEPTION 'hmt1 refuses unknown new-object privilege origin' USING ERRCODE='P7902';
    END IF;
  END LOOP;
END
$hmt1_new_acl_origin$;

REVOKE EXECUTE ON FUNCTION public.official_v3_method_stage_draft_v1(text,text,integer,text,text,integer) FROM PUBLIC,service_role;
GRANT EXECUTE ON FUNCTION public.official_v3_method_stage_draft_v1(text,text,integer,text,text,integer) TO authenticated;
COMMENT ON FUNCTION public.official_v3_method_stage_draft_v1(text,text,integer,text,text,integer) IS 'jetnity:hmt1:public-invoker-v1:unused';
REVOKE EXECUTE ON FUNCTION public.official_v3_method_approve_v1(text,text,integer,text,text,integer,text,text,integer,text,text,text) FROM PUBLIC,service_role;
GRANT EXECUTE ON FUNCTION public.official_v3_method_approve_v1(text,text,integer,text,text,integer,text,text,integer,text,text,text) TO authenticated;
COMMENT ON FUNCTION public.official_v3_method_approve_v1(text,text,integer,text,text,integer,text,text,integer,text,text,text) IS 'jetnity:hmt1:public-invoker-v1:unused';
REVOKE EXECUTE ON FUNCTION public.official_v3_method_revoke_v1(text,text,integer,text,text,integer) FROM PUBLIC,service_role;
GRANT EXECUTE ON FUNCTION public.official_v3_method_revoke_v1(text,text,integer,text,text,integer) TO authenticated;
COMMENT ON FUNCTION public.official_v3_method_revoke_v1(text,text,integer,text,text,integer) IS 'jetnity:hmt1:public-invoker-v1:unused';
REVOKE EXECUTE ON FUNCTION public.official_v3_method_confirm_operation_v1(text,text,text,integer,text,text,integer,integer,text,text,integer,text,text,text) FROM PUBLIC,service_role;
GRANT EXECUTE ON FUNCTION public.official_v3_method_confirm_operation_v1(text,text,text,integer,text,text,integer,integer,text,text,integer,text,text,text) TO authenticated;
COMMENT ON FUNCTION public.official_v3_method_confirm_operation_v1(text,text,text,integer,text,text,integer,integer,text,text,integer,text,text,text) IS 'jetnity:hmt1:public-invoker-v1:unused';

DO $hmt1_exact_inventory$
DECLARE owner_oid oid:='postgres'::pg_catalog.regrole;
  human_oid oid:='authenticated'::pg_catalog.regrole; e record; f record; r record;
  target_oid oid; allowed boolean;
BEGIN
  IF (SELECT count(*) FROM pg_catalog.pg_proc WHERE pronamespace=2200 AND proname IN ('official_v3_method_stage_draft_v1','official_v3_method_approve_v1','official_v3_method_revoke_v1','official_v3_method_confirm_operation_v1'))<>4 THEN
    RAISE EXCEPTION 'hmt1 four-name inventory invalid' USING ERRCODE='P7903';
  END IF;
  FOR e IN SELECT * FROM (VALUES
    ('official_v3_method_stage_draft_v1','public.official_v3_method_stage_draft_v1(text,text,integer,text,text,integer)','official_v3_method_api.stage_draft_v1(text,text,integer,text,text,integer)',ARRAY['p_operation_id','p_method_id','p_revision','p_method_digest','p_package_digest','p_predecessor_revision']::text[],'CREATE OR REPLACE FUNCTION public.official_v3_method_stage_draft_v1(p_operation_id text, p_method_id text, p_revision integer, p_method_digest text, p_package_digest text, p_predecessor_revision integer) RETURNS jsonb LANGUAGE sql SET search_path TO ''pg_catalog'' RETURN official_v3_method_api.stage_draft_v1(p_operation_id, p_method_id, p_revision, p_method_digest, p_package_digest, p_predecessor_revision)','RETURN official_v3_method_api.stage_draft_v1(p_operation_id, p_method_id, p_revision, p_method_digest, p_package_digest, p_predecessor_revision)'),
    ('official_v3_method_approve_v1','public.official_v3_method_approve_v1(text,text,integer,text,text,integer,text,text,integer,text,text,text)','official_v3_method_api.approve_v1(text,text,integer,text,text,integer,text,text,integer,text,text,text)',ARRAY['p_operation_id','p_method_id','p_revision','p_method_digest','p_package_digest','p_expected_revision','p_expected_method_digest','p_expected_package_digest','p_expected_epoch','p_expected_status','p_approval_mode','p_approval_until']::text[],'CREATE OR REPLACE FUNCTION public.official_v3_method_approve_v1(p_operation_id text, p_method_id text, p_revision integer, p_method_digest text, p_package_digest text, p_expected_revision integer, p_expected_method_digest text, p_expected_package_digest text, p_expected_epoch integer, p_expected_status text, p_approval_mode text, p_approval_until text) RETURNS jsonb LANGUAGE sql SET search_path TO ''pg_catalog'' RETURN official_v3_method_api.approve_v1(p_operation_id, p_method_id, p_revision, p_method_digest, p_package_digest, p_expected_revision, p_expected_method_digest, p_expected_package_digest, p_expected_epoch, p_expected_status, p_approval_mode, p_approval_until)','RETURN official_v3_method_api.approve_v1(p_operation_id, p_method_id, p_revision, p_method_digest, p_package_digest, p_expected_revision, p_expected_method_digest, p_expected_package_digest, p_expected_epoch, p_expected_status, p_approval_mode, p_approval_until)'),
    ('official_v3_method_revoke_v1','public.official_v3_method_revoke_v1(text,text,integer,text,text,integer)','official_v3_method_api.revoke_v1(text,text,integer,text,text,integer)',ARRAY['p_operation_id','p_method_id','p_revision','p_method_digest','p_package_digest','p_expected_epoch']::text[],'CREATE OR REPLACE FUNCTION public.official_v3_method_revoke_v1(p_operation_id text, p_method_id text, p_revision integer, p_method_digest text, p_package_digest text, p_expected_epoch integer) RETURNS jsonb LANGUAGE sql SET search_path TO ''pg_catalog'' RETURN official_v3_method_api.revoke_v1(p_operation_id, p_method_id, p_revision, p_method_digest, p_package_digest, p_expected_epoch)','RETURN official_v3_method_api.revoke_v1(p_operation_id, p_method_id, p_revision, p_method_digest, p_package_digest, p_expected_epoch)'),
    ('official_v3_method_confirm_operation_v1','public.official_v3_method_confirm_operation_v1(text,text,text,integer,text,text,integer,integer,text,text,integer,text,text,text)','official_v3_method_api.confirm_operation_v1(text,text,text,integer,text,text,integer,integer,text,text,integer,text,text,text)',ARRAY['p_operation_id','p_action','p_method_id','p_revision','p_method_digest','p_package_digest','p_predecessor_revision','p_expected_revision','p_expected_method_digest','p_expected_package_digest','p_expected_epoch','p_expected_status','p_approval_mode','p_approval_until']::text[],'CREATE OR REPLACE FUNCTION public.official_v3_method_confirm_operation_v1(p_operation_id text, p_action text, p_method_id text, p_revision integer, p_method_digest text, p_package_digest text, p_predecessor_revision integer, p_expected_revision integer, p_expected_method_digest text, p_expected_package_digest text, p_expected_epoch integer, p_expected_status text, p_approval_mode text, p_approval_until text) RETURNS jsonb LANGUAGE sql SET search_path TO ''pg_catalog'' RETURN official_v3_method_api.confirm_operation_v1(p_operation_id, p_action, p_method_id, p_revision, p_method_digest, p_package_digest, p_predecessor_revision, p_expected_revision, p_expected_method_digest, p_expected_package_digest, p_expected_epoch, p_expected_status, p_approval_mode, p_approval_until)','RETURN official_v3_method_api.confirm_operation_v1(p_operation_id, p_action, p_method_id, p_revision, p_method_digest, p_package_digest, p_predecessor_revision, p_expected_revision, p_expected_method_digest, p_expected_package_digest, p_expected_epoch, p_expected_status, p_approval_mode, p_approval_until)')
  ) AS expected(name,signature,target_signature,input_names,definition,body) LOOP
    SELECT p.* INTO f FROM pg_catalog.pg_proc p WHERE p.oid=pg_catalog.to_regprocedure(e.signature);
    target_oid:=pg_catalog.to_regprocedure(e.target_signature);
    IF NOT FOUND OR target_oid IS NULL OR f.pronamespace<>2200 OR f.proname<>e.name
      OR f.proowner<>owner_oid OR f.prolang<>14 OR f.prokind<>'f'
      OR f.prosecdef OR f.proretset OR f.proleakproof OR f.proisstrict
      OR f.provolatile<>'v' OR f.proparallel<>'u' OR f.provariadic<>0
      OR f.prorettype<>'pg_catalog.jsonb'::pg_catalog.regtype
      OR f.pronargs<>pg_catalog.cardinality(e.input_names) OR f.pronargdefaults<>0
      OR f.proargdefaults IS NOT NULL OR f.proallargtypes IS NOT NULL OR f.proargmodes IS NOT NULL
      OR f.proargnames IS DISTINCT FROM e.input_names OR f.protrftypes IS NOT NULL
      OR f.probin IS NOT NULL OR f.prosupport<>0::pg_catalog.oid OR f.prosqlbody IS NULL OR f.prosrc<>''
      OR f.procost<>100 OR f.prorows<>0
      OR f.proconfig IS DISTINCT FROM ARRAY['search_path=pg_catalog']::text[]
      OR pg_catalog.btrim(pg_catalog.regexp_replace(pg_catalog.pg_get_functiondef(f.oid),'[[:space:]]+',' ','g'))
        IS DISTINCT FROM e.definition
      OR pg_catalog.btrim(pg_catalog.regexp_replace(pg_catalog.pg_get_function_sqlbody(f.oid),'[[:space:]]+',' ','g'))
        IS DISTINCT FROM e.body
      OR pg_catalog.obj_description(f.oid,'pg_proc') IS DISTINCT FROM 'jetnity:hmt1:public-invoker-v1:unused' THEN
      RAISE EXCEPTION 'hmt1 complete function identity invalid' USING ERRCODE='P7903';
    END IF;
    -- PG17 pins built-in SQL language/types. Exactly the public namespace and
    -- one pre-existing HMA1 callee are the two recorded normal dependencies.
    IF (SELECT count(*) FROM pg_catalog.pg_depend WHERE classid='pg_catalog.pg_proc'::pg_catalog.regclass AND objid=f.oid)<>2
      OR EXISTS(SELECT 1 FROM pg_catalog.pg_depend d
        WHERE d.classid='pg_catalog.pg_proc'::pg_catalog.regclass AND d.objid=f.oid
          AND (d.objsubid<>0 OR d.refobjsubid<>0 OR d.deptype<>'n'
            OR NOT((d.refclassid='pg_catalog.pg_namespace'::pg_catalog.regclass AND d.refobjid=2200)
              OR (d.refclassid='pg_catalog.pg_proc'::pg_catalog.regclass AND d.refobjid=target_oid))))
      OR NOT EXISTS(SELECT 1 FROM pg_catalog.pg_depend d WHERE d.classid='pg_catalog.pg_proc'::pg_catalog.regclass
        AND d.objid=f.oid AND d.refclassid='pg_catalog.pg_proc'::pg_catalog.regclass AND d.refobjid=target_oid)
      OR NOT EXISTS(SELECT 1 FROM pg_catalog.pg_depend d WHERE d.classid='pg_catalog.pg_proc'::pg_catalog.regclass
        AND d.objid=f.oid AND d.refclassid='pg_catalog.pg_namespace'::pg_catalog.regclass AND d.refobjid=2200)
      OR EXISTS(SELECT 1 FROM pg_catalog.pg_depend d WHERE d.refclassid='pg_catalog.pg_proc'::pg_catalog.regclass AND d.refobjid=f.oid)
      OR EXISTS(SELECT 1 FROM pg_catalog.pg_init_privs WHERE classoid='pg_catalog.pg_proc'::pg_catalog.regclass AND objoid=f.oid)
      OR EXISTS(SELECT 1 FROM pg_catalog.pg_seclabel WHERE classoid='pg_catalog.pg_proc'::pg_catalog.regclass AND objoid=f.oid) THEN
      RAISE EXCEPTION 'hmt1 exact function dependency boundary invalid' USING ERRCODE='P7903';
    END IF;
    IF f.proacl IS NULL
      OR (SELECT count(*) FROM pg_catalog.aclexplode(f.proacl))<>2
      OR (SELECT count(DISTINCT a.grantee) FROM pg_catalog.aclexplode(f.proacl) a)<>2
      OR EXISTS(SELECT 1 FROM pg_catalog.aclexplode(f.proacl) a WHERE a.grantor<>owner_oid
        OR a.grantee NOT IN (owner_oid,human_oid) OR a.privilege_type<>'EXECUTE' OR a.is_grantable)
      OR (SELECT count(*) FROM pg_catalog.pg_shdepend d
        WHERE d.classid='pg_catalog.pg_proc'::pg_catalog.regclass AND d.objid=f.oid)<>2
      OR (SELECT count(DISTINCT (d.refobjid,d.deptype)) FROM pg_catalog.pg_shdepend d
        WHERE d.classid='pg_catalog.pg_proc'::pg_catalog.regclass AND d.objid=f.oid)<>2
      OR EXISTS(SELECT 1 FROM pg_catalog.pg_shdepend d
        WHERE d.classid='pg_catalog.pg_proc'::pg_catalog.regclass AND d.objid=f.oid
          AND (d.dbid<>(SELECT oid FROM pg_catalog.pg_database WHERE datname=pg_catalog.current_database())
            OR d.objsubid<>0 OR d.refclassid<>'pg_catalog.pg_authid'::pg_catalog.regclass
            OR NOT((d.deptype='o' AND d.refobjid=owner_oid) OR (d.deptype='a' AND d.refobjid=human_oid)))) THEN
      RAISE EXCEPTION 'hmt1 explicit function ACL or shared dependency invalid' USING ERRCODE='P7903';
    END IF;
    FOR r IN SELECT oid,rolname FROM pg_catalog.pg_roles WHERE NOT rolsuper LOOP
      allowed:=r.oid=owner_oid OR r.oid=human_oid OR pg_catalog.pg_has_role(r.oid,human_oid,'USAGE');
      IF (r.rolname IN ('anon','service_role','ot_v3_method_reader')
          AND pg_catalog.has_function_privilege(r.oid,f.oid,'EXECUTE'))
        OR pg_catalog.has_function_privilege(r.oid,f.oid,'EXECUTE') IS DISTINCT FROM allowed
        OR (r.oid<>owner_oid AND pg_catalog.has_function_privilege(r.oid,f.oid,'EXECUTE WITH GRANT OPTION')) THEN
        RAISE EXCEPTION 'hmt1 effective function privileges invalid' USING ERRCODE='P7903';
      END IF;
    END LOOP;
  END LOOP;
END
$hmt1_exact_inventory$;

-- Persist this exact readback externally; it is not a method approval or HTTP proof.
SELECT pg_catalog.jsonb_build_object('receipt','HMT1_INSTALLED_CATALOG_V1','publicOid',2200,
  'functionOids',pg_catalog.jsonb_agg(p.oid ORDER BY p.proname)) AS evidence
FROM pg_catalog.pg_proc p WHERE p.pronamespace=2200 AND p.proname IN ('official_v3_method_stage_draft_v1','official_v3_method_approve_v1','official_v3_method_revoke_v1','official_v3_method_confirm_operation_v1');
COMMIT;
