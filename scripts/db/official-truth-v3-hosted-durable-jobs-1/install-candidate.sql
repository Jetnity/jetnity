-- HM04 SOURCE V1 + A1. UNAPPLIED; no hosted execution or runtime login binding.
-- Separate hosted adaptation of exact accepted M04 R41. Never rewrite old artifacts.
BEGIN;
SET LOCAL search_path=pg_catalog,pg_temp;
SET LOCAL statement_timeout='30000';
SET LOCAL lock_timeout='5000';
SET LOCAL idle_in_transaction_session_timeout='30000';
SET LOCAL intervalstyle='postgres';
SET LOCAL datestyle='ISO, YMD';
-- Cooperative package ordering only; no claim of a global external DDL barrier.
SELECT pg_catalog.pg_advisory_xact_lock(771101,1);
SELECT pg_catalog.pg_advisory_xact_lock(771102,1);
SELECT pg_catalog.pg_advisory_xact_lock(771103,1);
SELECT pg_catalog.pg_advisory_xact_lock(771104,1);
DO $hm04_creator$
DECLARE creator oid;
BEGIN
  SELECT r.oid INTO creator FROM pg_catalog.pg_roles r WHERE r.rolname='postgres'
    AND r.rolcanlogin AND NOT r.rolsuper AND r.rolcreaterole AND r.rolbypassrls;
  IF creator IS NULL OR session_user<>'postgres' OR current_user<>session_user
    OR pg_catalog.current_database()<>'postgres'
    OR pg_catalog.current_setting('server_version_num')::integer/10000<>17
    OR pg_catalog.current_setting('server_encoding')<>'UTF8'
    OR pg_catalog.current_setting('createrole_self_grant')<>''
    OR NOT EXISTS(SELECT 1 FROM pg_catalog.pg_database d WHERE d.datname=current_database() AND d.datdba=creator AND d.encoding=6)
    OR NOT pg_catalog.has_database_privilege(creator,current_database(),'CREATE')
    OR NOT EXISTS(SELECT 1 FROM pg_catalog.pg_roles r WHERE r.oid=10 AND r.rolsuper)
    OR EXISTS(SELECT 1 FROM pg_catalog.pg_auth_members m WHERE m.roleid=creator)
    OR (SELECT count(*) FROM pg_catalog.pg_roles r WHERE r.rolname IN ('anon','authenticated','service_role'))<>3
    OR EXISTS(SELECT 1 FROM pg_catalog.pg_roles r WHERE r.rolname IN ('anon','authenticated','service_role')
      AND (pg_catalog.pg_has_role(r.oid,creator,'USAGE') OR pg_catalog.pg_has_role(r.oid,creator,'SET')))
    OR EXISTS(SELECT 1 FROM pg_catalog.pg_default_acl d WHERE d.defaclrole=creator AND d.defaclnamespace=0
      AND (d.defaclobjtype NOT IN ('r','S','f','T','n')
        OR d.defaclacl IS DISTINCT FROM pg_catalog.acldefault(d.defaclobjtype,creator))) THEN
    RAISE EXCEPTION 'hm04 exact managed Creator prerequisite' USING ERRCODE='P7601';
  END IF;
  IF pg_catalog.to_regnamespace('official_v3_jobs_private') IS NOT NULL
    OR pg_catalog.to_regnamespace('official_v3_jobs_api') IS NOT NULL
    OR EXISTS(SELECT 1 FROM pg_catalog.pg_roles r WHERE r.rolname IN ('ot_v3_jobs_owner','ot_v3_jobs_caller')) THEN
    RAISE EXCEPTION 'hm04 collision; adoption forbidden' USING ERRCODE='P7601';
  END IF;
END $hm04_creator$;

-- Exact selected PG1R3/HMA1R4/HS1 inventory blocks. No original object changes.
-- HS1 dependency_boundary is intentionally PRE-CREATION only: no consumer exists yet.
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

DO $hs1_bootstrap_memberships$
DECLARE installer oid := session_user::pg_catalog.regrole; owner_id oid; caller_id oid;
BEGIN
  SELECT r.oid INTO owner_id FROM pg_catalog.pg_roles r WHERE r.rolname='ot_v3_intake_owner';
  SELECT r.oid INTO caller_id FROM pg_catalog.pg_roles r WHERE r.rolname='ot_v3_intake_caller';
  IF owner_id IS NULL OR caller_id IS NULL
    OR EXISTS (SELECT 1 FROM pg_catalog.pg_roles r WHERE r.oid IN (owner_id,caller_id)
      AND (r.rolcanlogin OR r.rolinherit OR r.rolsuper OR r.rolcreatedb OR r.rolcreaterole
        OR r.rolreplication OR r.rolbypassrls OR r.rolconfig IS NOT NULL OR r.rolconnlimit<>-1 OR r.rolvaliduntil IS NOT NULL))
    OR EXISTS (SELECT 1 FROM pg_catalog.pg_db_role_setting s WHERE s.setrole IN (owner_id,caller_id))
    OR EXISTS (SELECT 1 FROM pg_catalog.pg_default_acl d WHERE d.defaclrole IN (owner_id,caller_id))
    OR (SELECT count(*) FROM pg_catalog.pg_auth_members m
      WHERE m.roleid IN (owner_id,caller_id) OR m.member IN (owner_id,caller_id) OR m.grantor IN (owner_id,caller_id))<>2
    OR (SELECT count(*) FROM pg_catalog.pg_auth_members m
      WHERE m.roleid IN (owner_id,caller_id) AND m.member=installer AND m.grantor=10
        AND m.admin_option AND NOT m.inherit_option AND NOT m.set_option)<>2
    OR pg_catalog.pg_has_role(installer,owner_id,'SET') OR pg_catalog.pg_has_role(installer,owner_id,'USAGE')
    OR pg_catalog.pg_has_role(installer,caller_id,'SET') OR pg_catalog.pg_has_role(installer,caller_id,'USAGE') THEN
    RAISE EXCEPTION 'hs1 exact bootstrap-only role state required' USING ERRCODE='P7311';
  END IF;
END $hs1_bootstrap_memberships$;

DO $hs1_function_pins$
DECLARE x record; p pg_catalog.pg_proc%ROWTYPE;
  owner_id oid := 'ot_v3_intake_owner'::pg_catalog.regrole;
  caller_id oid := 'ot_v3_intake_caller'::pg_catalog.regrole; expected_types oid[]; actual_types oid[];
BEGIN
  IF (SELECT count(*) FROM pg_catalog.pg_proc p JOIN pg_catalog.pg_namespace n ON n.oid=p.pronamespace
    WHERE n.nspname IN ('official_v3_intake_private','official_v3_intake_api'))<>14 THEN
    RAISE EXCEPTION 'hs1 function inventory mismatch' USING ERRCODE='P7312';
  END IF;
  FOR x IN SELECT * FROM (VALUES
    ('official_v3_intake_private','exact_keys_v1','jsonb,text[]',ARRAY['v','expected']::text[],'boolean','sql','i',false,0,'d3d8130512d809af7ec2578b88d30412e3dfec516a158c74f0a6fe1d09d486ba'),
    ('official_v3_intake_private','safe_data_v1','jsonb,integer',ARRAY['v','depth']::text[],'boolean','plpgsql','i',false,1,'bce43ae05fa0cff183a1de7afedd8bca5e16f0cfc3e160c9b83fec33d09f0abf'),
    ('official_v3_intake_private','binding_valid_v1','jsonb',ARRAY['b']::text[],'boolean','plpgsql','i',false,0,'8f556b9db0b3786f9c247c9432a9e6a8631b66ee92019ac8aa082cf58aa4f7c1'),
    ('official_v3_intake_private','unique_json_v1','json,integer',ARRAY['v','depth']::text[],'boolean','plpgsql','i',false,1,'d9c536f2969d815c42b8cd00bbb7145808906519a575aff0dd9361f5070e7609'),
    ('official_v3_intake_private','proposal_shape_v1','',NULL::text[],'jsonb','sql','i',false,0,'4ba4184c3733a3849ebf450822f37b46187931f916635c905ca5a3e3704231a9'),
    ('official_v3_intake_private','data_nodes_v1','jsonb,integer,integer,integer',ARRAY['v','depth','max_depth','max_nodes']::text[],'integer','plpgsql','i',false,3,'ca39c759aa56b45e6974d3fecf953b2bf4d679c2bffbf0783f366f42fd621b85'),
    ('official_v3_intake_private','shape_matches_v1','jsonb,jsonb,jsonb,jsonb,integer',ARRAY['v','s','defs','countries','depth']::text[],'boolean','plpgsql','i',false,1,'760ebdb9782c8709c0ede579e94c30f47a74840683772e11b04a2b3f74fc598a'),
    ('official_v3_intake_private','proposal_retainable_v1','jsonb',ARRAY['v']::text[],'boolean','plpgsql','i',false,0,'d30b3540a097ab1832d09bdd67fa922efecaecbfdbae34eb3bfdbdca635cf797'),
    ('official_v3_intake_private','immutable_v1','',NULL::text[],'trigger','plpgsql','v',false,0,'ff1c2db432d3aa48e50b7a043982831be983dc54c6ea16155f4d690a91dcdc86'),
    ('official_v3_intake_private','record_v1','text',ARRAY['p_operation']::text[],'jsonb','sql','v',false,0,'f34089ca87adef99d16d63de7391c5c200e770928c476304d8324b4beb1844f3'),
    ('official_v3_intake_api','capture_v1','jsonb,text,text',ARRAY['p_binding','p_original','p_digest']::text[],'jsonb','plpgsql','v',true,0,'5488c6a3d2613b99f58890fcd2aac7205d3f766ce298102a8a655019787fa1b7'),
    ('official_v3_intake_api','read_v1','jsonb,text,integer',ARRAY['p_binding','p_digest','p_bytes']::text[],'jsonb','plpgsql','v',true,0,'3c3cbff368a4e196247964d35a350ef1d554d685b2a807573aa4f987bfbe17d4'),
    ('official_v3_intake_api','reserve_v1','jsonb,text,integer,integer',ARRAY['p_binding','p_digest','p_bytes','p_lease_ms']::text[],'jsonb','plpgsql','v',true,0,'82055d6a6f736a116c90a500d294d77953a338731e0a5047f5fd9dac6c8746d7'),
    ('official_v3_intake_api','finish_v1','jsonb,text,integer,integer,uuid,jsonb,jsonb',ARRAY['p_binding','p_digest','p_bytes','p_generation','p_token','p_outcome','p_audit']::text[],'jsonb','plpgsql','v',true,0,'d4fa49784f32d0feccdc7e9beaa6cb1e552fb0117be51e91b40b3b4a8556f262')
  ) v(schema_name,function_name,arg_types,arg_names,result_type,language_name,volatility,definer,defaults,body_hash)
  LOOP
    SELECT COALESCE(pg_catalog.array_agg(t::pg_catalog.regtype::oid ORDER BY position),'{}'::oid[]) INTO expected_types
      FROM pg_catalog.unnest(pg_catalog.string_to_array(x.arg_types,',')) WITH ORDINALITY a(t,position);
    SELECT f.* INTO p FROM pg_catalog.pg_proc f JOIN pg_catalog.pg_namespace n ON n.oid=f.pronamespace
      WHERE n.nspname=x.schema_name AND f.proname=x.function_name;
    SELECT COALESCE(pg_catalog.array_agg(t ORDER BY position),'{}'::oid[]) INTO actual_types
      FROM pg_catalog.unnest(p.proargtypes) WITH ORDINALITY a(t,position);
    IF NOT FOUND OR p.oid IS NULL OR p.proowner<>owner_id OR actual_types IS DISTINCT FROM expected_types
      OR p.pronargs<>pg_catalog.cardinality(expected_types) OR p.proargnames IS DISTINCT FROM x.arg_names
      OR p.proallargtypes IS NOT NULL OR p.proargmodes IS NOT NULL
      OR p.prorettype<>x.result_type::pg_catalog.regtype OR p.prokind<>'f' OR p.proretset
      OR p.prolang<>(SELECT l.oid FROM pg_catalog.pg_language l WHERE l.lanname=x.language_name)
      OR p.provolatile::text<>x.volatility OR p.proparallel<>'u' OR p.prosecdef<>x.definer
      OR p.proisstrict OR p.proleakproof OR p.provariadic<>0 OR p.prosupport<>0 OR p.probin IS NOT NULL
      OR p.prosqlbody IS NOT NULL OR p.procost<>100 OR p.prorows<>0
      OR p.pronargdefaults<>x.defaults OR p.proconfig IS DISTINCT FROM ARRAY['search_path=pg_catalog']
      OR pg_catalog.pg_get_expr(p.proargdefaults,0) IS DISTINCT FROM
        (CASE x.defaults WHEN 0 THEN NULL WHEN 3 THEN '0, 16, 8192' ELSE '0' END)
      OR pg_catalog.encode(pg_catalog.sha256(pg_catalog.convert_to(p.prosrc,'UTF8')),'hex')<>x.body_hash
      OR (SELECT count(*) FROM pg_catalog.aclexplode(COALESCE(p.proacl,pg_catalog.acldefault('f',owner_id))))
        <>(CASE WHEN x.definer THEN 2 ELSE 1 END)
      OR EXISTS (SELECT 1 FROM pg_catalog.aclexplode(COALESCE(p.proacl,pg_catalog.acldefault('f',owner_id))) a
        WHERE a.grantor<>owner_id OR a.privilege_type<>'EXECUTE' OR a.is_grantable
          OR NOT (a.grantee=owner_id OR x.definer AND a.grantee=caller_id)) THEN
      RAISE EXCEPTION 'hs1 exact function mismatch' USING ERRCODE='P7312';
    END IF;
  END LOOP;
END $hs1_function_pins$;

DO $hs1_structure$
DECLARE owner_id oid := 'ot_v3_intake_owner'::pg_catalog.regrole;
  caller_id oid := 'ot_v3_intake_caller'::pg_catalog.regrole;
  private_id oid := 'official_v3_intake_private'::pg_catalog.regnamespace;
  api_id oid := 'official_v3_intake_api'::pg_catalog.regnamespace;
  x record; c pg_catalog.pg_class%ROWTYPE; a pg_catalog.pg_attribute%ROWTYPE;
  immutable_id oid; actual jsonb; expected jsonb;
BEGIN
  IF (SELECT count(*) FROM pg_catalog.pg_namespace n WHERE n.oid IN (private_id,api_id) AND n.nspowner=owner_id)<>2
    OR EXISTS (SELECT 1 FROM pg_catalog.pg_default_acl d WHERE d.defaclrole IN (owner_id,caller_id) OR d.defaclnamespace IN (private_id,api_id))
    OR pg_catalog.has_database_privilege(owner_id,current_database(),'CREATE')
    OR EXISTS (SELECT 1 FROM pg_catalog.pg_class c WHERE c.relnamespace=api_id)
    OR (SELECT count(*) FROM pg_catalog.pg_class c WHERE c.relnamespace=private_id)<>6
    OR (SELECT count(*) FROM pg_catalog.pg_type t WHERE t.typnamespace=private_id)<>6
    OR EXISTS (SELECT 1 FROM pg_catalog.pg_type t WHERE t.typnamespace=api_id) THEN
    RAISE EXCEPTION 'hs1 schema/class/type inventory mismatch' USING ERRCODE='P7312';
  END IF;
  FOR x IN SELECT n.* FROM pg_catalog.pg_namespace n WHERE n.oid IN (private_id,api_id) LOOP
    IF (SELECT count(*) FROM pg_catalog.aclexplode(COALESCE(x.nspacl,pg_catalog.acldefault('n',owner_id))))
        <>(CASE WHEN x.oid=api_id THEN 3 ELSE 2 END)
      OR EXISTS (SELECT 1 FROM pg_catalog.aclexplode(COALESCE(x.nspacl,pg_catalog.acldefault('n',owner_id))) e
        WHERE e.grantor<>owner_id OR e.is_grantable
          OR NOT (e.grantee=owner_id AND e.privilege_type IN ('CREATE','USAGE')
            OR x.oid=api_id AND e.grantee=caller_id AND e.privilege_type='USAGE')) THEN
      RAISE EXCEPTION 'hs1 schema ACL mismatch' USING ERRCODE='P7312';
    END IF;
  END LOOP;
  FOR x IN SELECT * FROM (VALUES
    ('operations_v1',9,ARRAY[1]::smallint[]),
    ('reservations_v1',5,ARRAY[1,2]::smallint[]),
    ('completions_v1',7,ARRAY[1]::smallint[])
  ) v(table_name,column_count,primary_columns) LOOP
    SELECT r.* INTO c FROM pg_catalog.pg_class r WHERE r.relnamespace=private_id AND r.relname=x.table_name;
    IF c.oid IS NULL OR c.relkind<>'r' OR c.relowner<>owner_id OR c.relpersistence<>'p'
      OR NOT c.relrowsecurity OR NOT c.relforcerowsecurity OR c.relispartition OR c.reloftype<>0
      OR c.relreplident<>'d' OR c.reloptions IS NOT NULL
      OR c.relam<>(SELECT m.oid FROM pg_catalog.pg_am m WHERE m.amname='heap')
      OR c.reltablespace<>0 OR c.relnatts<>x.column_count
      OR EXISTS (SELECT 1 FROM pg_catalog.pg_inherits i WHERE i.inhrelid=c.oid OR i.inhparent=c.oid)
      OR EXISTS (SELECT 1 FROM pg_catalog.pg_rewrite r WHERE r.ev_class=c.oid)
      OR EXISTS ((SELECT * FROM pg_catalog.aclexplode(COALESCE(c.relacl,pg_catalog.acldefault('r',owner_id)))
          EXCEPT ALL SELECT * FROM pg_catalog.aclexplode(pg_catalog.acldefault('r',owner_id)))
        UNION ALL (SELECT * FROM pg_catalog.aclexplode(pg_catalog.acldefault('r',owner_id))
          EXCEPT ALL SELECT * FROM pg_catalog.aclexplode(COALESCE(c.relacl,pg_catalog.acldefault('r',owner_id)))))
      OR (SELECT count(*) FROM pg_catalog.pg_index i WHERE i.indrelid=c.oid)<>1
      OR NOT EXISTS (SELECT 1 FROM pg_catalog.pg_index i JOIN pg_catalog.pg_class r ON r.oid=i.indexrelid
        WHERE i.indrelid=c.oid AND r.relname=x.table_name||'_pkey' AND r.relnamespace=private_id
          AND r.relowner=owner_id AND r.relkind='i' AND r.reloptions IS NULL AND r.relacl IS NULL
          AND r.reltablespace=0 AND r.relam=(SELECT m.oid FROM pg_catalog.pg_am m WHERE m.amname='btree')
          AND i.indisprimary AND i.indisunique AND i.indisvalid AND i.indisready AND i.indislive AND i.indimmediate
          AND NOT i.indnullsnotdistinct AND NOT i.indisreplident AND NOT i.indisclustered
          AND i.indexprs IS NULL AND i.indpred IS NULL
          AND i.indnatts=pg_catalog.cardinality(x.primary_columns) AND i.indnkeyatts=i.indnatts
          AND ARRAY(SELECT k FROM pg_catalog.unnest(i.indkey) k)=x.primary_columns
          AND ARRAY(SELECT co FROM pg_catalog.unnest(i.indcollation) co)=CASE WHEN x.table_name='reservations_v1'
            THEN ARRAY[(SELECT t.typcollation FROM pg_catalog.pg_type t WHERE t.oid='text'::pg_catalog.regtype),0::oid]
            ELSE ARRAY[(SELECT t.typcollation FROM pg_catalog.pg_type t WHERE t.oid='text'::pg_catalog.regtype)] END
          AND NOT EXISTS (SELECT 1 FROM pg_catalog.unnest(i.indoption) o WHERE o<>0)
          AND ARRAY(SELECT op.opcname::text FROM pg_catalog.unnest(i.indclass) WITH ORDINALITY z(oid,position)
            JOIN pg_catalog.pg_opclass op ON op.oid=z.oid JOIN pg_catalog.pg_namespace ns ON ns.oid=op.opcnamespace
            WHERE ns.nspname='pg_catalog' ORDER BY z.position)
            =CASE WHEN x.table_name='reservations_v1' THEN ARRAY['text_ops','int4_ops'] ELSE ARRAY['text_ops'] END) THEN
      RAISE EXCEPTION 'hs1 table/index mismatch' USING ERRCODE='P7312';
    END IF;
    -- Composite and automatic array type PUBLIC USAGE are the exact engine
    -- baseline. They do not supply the absent schema USAGE or table rights.
    IF NOT EXISTS (SELECT 1 FROM pg_catalog.pg_type t JOIN pg_catalog.pg_type ar ON ar.oid=t.typarray
      WHERE t.oid=c.reltype AND t.typname=x.table_name AND t.typnamespace=private_id AND t.typowner=owner_id
        AND t.typtype='c' AND t.typcategory='C' AND t.typrelid=c.oid AND t.typelem=0 AND t.typbasetype=0
        AND ar.typname='_'||x.table_name AND ar.typnamespace=private_id AND ar.typowner=owner_id
        AND ar.typtype='b' AND ar.typcategory='A' AND ar.typrelid=0 AND ar.typelem=t.oid AND ar.typbasetype=0)
      OR EXISTS (SELECT 1 FROM pg_catalog.pg_type t WHERE (t.oid=c.reltype OR t.typelem=c.reltype)
        AND t.typnamespace=private_id AND
          (t.typnotnull OR t.typdefault IS NOT NULL OR t.typdefaultbin IS NOT NULL)) THEN
      RAISE EXCEPTION 'hs1 row/array type mismatch' USING ERRCODE='P7312';
    END IF;
    IF (SELECT count(*) FROM pg_catalog.pg_policy p WHERE p.polrelid=c.oid)<>1
      OR NOT EXISTS (SELECT 1 FROM pg_catalog.pg_policy p WHERE p.polrelid=c.oid AND p.polname='owner_only'
        AND p.polcmd='*' AND p.polpermissive AND p.polroles=ARRAY[owner_id]
        AND pg_catalog.pg_get_expr(p.polqual,p.polrelid)='true'
        AND pg_catalog.pg_get_expr(p.polwithcheck,p.polrelid)='true') THEN
      RAISE EXCEPTION 'hs1 FORCE RLS policy mismatch' USING ERRCODE='P7312';
    END IF;
  END LOOP;
  IF EXISTS (SELECT 1 FROM pg_catalog.pg_type t WHERE t.typnamespace=private_id AND
    EXISTS ((SELECT * FROM pg_catalog.aclexplode(COALESCE(t.typacl,pg_catalog.acldefault('T',owner_id)))
       EXCEPT ALL SELECT * FROM pg_catalog.aclexplode(pg_catalog.acldefault('T',owner_id)))
      UNION ALL (SELECT * FROM pg_catalog.aclexplode(pg_catalog.acldefault('T',owner_id))
       EXCEPT ALL SELECT * FROM pg_catalog.aclexplode(COALESCE(t.typacl,pg_catalog.acldefault('T',owner_id)))))) THEN
    RAISE EXCEPTION 'hs1 type ACL mismatch' USING ERRCODE='P7312';
  END IF;
  FOR x IN SELECT * FROM (VALUES
    ('operations_v1',1,'operation_id','text',true,NULL::text),
    ('operations_v1',2,'binding','jsonb',true,NULL),
    ('operations_v1',3,'original_bytes','bytea',true,NULL),
    ('operations_v1',4,'proposal_digest','text',true,NULL),
    ('operations_v1',5,'created_at','timestamp with time zone',true,'clock_timestamp()'),
    ('operations_v1',6,'generation','integer',true,'0'),
    ('operations_v1',7,'lease_token','uuid',false,NULL),
    ('operations_v1',8,'acquired_at','timestamp with time zone',false,NULL),
    ('operations_v1',9,'expires_at','timestamp with time zone',false,NULL),
    ('reservations_v1',1,'operation_id','text',true,NULL),
    ('reservations_v1',2,'generation','integer',true,NULL),
    ('reservations_v1',3,'lease_token','uuid',true,NULL),
    ('reservations_v1',4,'acquired_at','timestamp with time zone',true,NULL),
    ('reservations_v1',5,'expires_at','timestamp with time zone',true,NULL),
    ('completions_v1',1,'operation_id','text',true,NULL),
    ('completions_v1',2,'generation','integer',true,NULL),
    ('completions_v1',3,'lease_token','uuid',true,NULL),
    ('completions_v1',4,'outcome','jsonb',true,NULL),
    ('completions_v1',5,'audit','jsonb',true,NULL),
    ('completions_v1',6,'escalation_key','text',false,NULL),
    ('completions_v1',7,'completed_at','timestamp with time zone',true,NULL)
  ) v(table_name,position,column_name,type_name,not_null,default_expr) LOOP
    SELECT a0.* INTO a FROM pg_catalog.pg_attribute a0 JOIN pg_catalog.pg_class c0 ON c0.oid=a0.attrelid
      WHERE c0.relnamespace=private_id AND c0.relname=x.table_name AND a0.attnum=x.position;
    IF a.attname IS DISTINCT FROM x.column_name OR a.attisdropped OR a.atttypid<>x.type_name::pg_catalog.regtype
      OR a.attnotnull<>x.not_null OR a.attgenerated<>'' OR a.attidentity<>'' OR a.atthasmissing
      OR a.attacl IS NOT NULL OR a.attoptions IS NOT NULL OR a.attfdwoptions IS NOT NULL
      OR a.atttypmod<>-1 OR a.attndims<>0 OR a.attstattarget<>-1 OR a.attcompression<>''
      OR a.attstorage<>(SELECT t.typstorage FROM pg_catalog.pg_type t WHERE t.oid=a.atttypid)
      OR a.attcollation<>(SELECT t.typcollation FROM pg_catalog.pg_type t WHERE t.oid=a.atttypid)
      OR (SELECT pg_catalog.pg_get_expr(d.adbin,d.adrelid) FROM pg_catalog.pg_attrdef d
        WHERE d.adrelid=a.attrelid AND d.adnum=a.attnum) IS DISTINCT FROM x.default_expr THEN
      RAISE EXCEPTION 'hs1 exact column mismatch' USING ERRCODE='P7312';
    END IF;
  END LOOP;
  IF (SELECT count(*) FROM pg_catalog.pg_attrdef d JOIN pg_catalog.pg_class c ON c.oid=d.adrelid
    WHERE c.relnamespace=private_id)<>2 OR EXISTS (
    SELECT 1 FROM pg_catalog.pg_attribute a JOIN pg_catalog.pg_class c ON c.oid=a.attrelid
    WHERE c.relnamespace IN (private_id,api_id) AND (a.attacl IS NOT NULL OR a.attisdropped)) THEN
    RAISE EXCEPTION 'hs1 column/default inventory mismatch' USING ERRCODE='P7312';
  END IF;
  SELECT pg_catalog.jsonb_agg(pg_catalog.jsonb_build_array(c.relname,k.contype,
      pg_catalog.pg_get_constraintdef(k.oid,false)) ORDER BY c.relname,k.contype,pg_catalog.pg_get_constraintdef(k.oid,false)) INTO actual
    FROM pg_catalog.pg_constraint k JOIN pg_catalog.pg_class c ON c.oid=k.conrelid WHERE c.relnamespace=private_id;
  SELECT pg_catalog.jsonb_agg(pg_catalog.jsonb_build_array(v.table_name,v.kind,v.definition)
    ORDER BY v.table_name,v.kind,v.definition) INTO expected FROM (VALUES
    ('operations_v1','p','PRIMARY KEY (operation_id)'),
    ('operations_v1','c','CHECK ((operation_id ~ ''^op3_[a-f0-9]{32}$''::text))'),
    ('operations_v1','c','CHECK (((octet_length(original_bytes) >= 1) AND (octet_length(original_bytes) <= 65536)))'),
    ('operations_v1','c','CHECK ((proposal_digest = encode(sha256(original_bytes), ''hex''::text)))'),
    ('operations_v1','c','CHECK (((generation >= 0) AND (generation <= 2147483646)))'),
    ('operations_v1','c','CHECK ((((generation = 0) AND (lease_token IS NULL) AND (acquired_at IS NULL) AND (expires_at IS NULL)) OR ((generation > 0) AND (lease_token IS NOT NULL) AND (acquired_at IS NOT NULL) AND (expires_at IS NOT NULL) AND (expires_at > acquired_at) AND (expires_at <= (acquired_at + ''00:15:00''::interval)))))'),
    ('reservations_v1','p','PRIMARY KEY (operation_id, generation)'),
    ('reservations_v1','c','CHECK (((generation >= 1) AND (generation <= 2147483646)))'),
    ('reservations_v1','c','CHECK (((expires_at > acquired_at) AND (expires_at <= (acquired_at + ''00:15:00''::interval))))'),
    ('reservations_v1','f','FOREIGN KEY (operation_id) REFERENCES official_v3_intake_private.operations_v1(operation_id)'),
    ('completions_v1','p','PRIMARY KEY (operation_id)'),
    ('completions_v1','c','CHECK ((octet_length((outcome)::text) <= 524288))'),
    ('completions_v1','c','CHECK ((octet_length((audit)::text) <= 8192))'),
    ('completions_v1','c','CHECK ((escalation_key ~ ''^source-escalation:v3:[a-f0-9]{64}$''::text))'),
    ('completions_v1','f','FOREIGN KEY (operation_id) REFERENCES official_v3_intake_private.operations_v1(operation_id)'),
    ('completions_v1','f','FOREIGN KEY (operation_id, generation) REFERENCES official_v3_intake_private.reservations_v1(operation_id, generation)')
  ) v(table_name,kind,definition);
  IF actual IS DISTINCT FROM expected OR EXISTS (
    SELECT 1 FROM pg_catalog.pg_constraint k JOIN pg_catalog.pg_class c ON c.oid=k.conrelid
    WHERE c.relnamespace=private_id AND (k.connamespace<>private_id OR k.condeferrable OR k.condeferred
      OR NOT k.convalidated OR NOT k.conislocal OR k.coninhcount<>0 OR k.conparentid<>0
      OR k.contype='c' AND k.connoinherit
      OR k.contype='f' AND (k.confupdtype<>'a' OR k.confdeltype<>'a' OR k.confmatchtype<>'s'))) THEN
    RAISE EXCEPTION 'hs1 exact constraint mismatch' USING ERRCODE='P7312';
  END IF;
  SELECT p.oid INTO immutable_id FROM pg_catalog.pg_proc p WHERE p.pronamespace=private_id AND p.proname='immutable_v1';
  IF (SELECT count(*) FROM pg_catalog.pg_trigger g JOIN pg_catalog.pg_class c ON c.oid=g.tgrelid
      WHERE c.relnamespace=private_id AND NOT g.tgisinternal)<>3
    OR EXISTS (SELECT 1 FROM pg_catalog.pg_trigger g JOIN pg_catalog.pg_class c ON c.oid=g.tgrelid
      WHERE c.relnamespace=private_id AND NOT g.tgisinternal AND
        (g.tgname<>'immutable_v1' OR g.tgfoid<>immutable_id OR g.tgtype<>27 OR g.tgenabled<>'O'
          OR g.tgconstraint<>0 OR g.tgdeferrable OR g.tginitdeferred OR g.tgnargs<>0
          OR g.tgargs<>''::bytea OR g.tgattr<>''::pg_catalog.int2vector OR g.tgqual IS NOT NULL
          OR g.tgoldtable IS NOT NULL OR g.tgnewtable IS NOT NULL OR g.tgparentid<>0))
    OR (SELECT count(*) FROM pg_catalog.pg_trigger g JOIN pg_catalog.pg_class c ON c.oid=g.tgrelid
      WHERE c.relnamespace=private_id AND g.tgisinternal)<>12
    OR EXISTS (SELECT 1 FROM pg_catalog.pg_trigger g JOIN pg_catalog.pg_class c ON c.oid=g.tgrelid
      JOIN pg_catalog.pg_proc p ON p.oid=g.tgfoid JOIN pg_catalog.pg_namespace n ON n.oid=p.pronamespace
      LEFT JOIN pg_catalog.pg_constraint k ON k.oid=g.tgconstraint
      WHERE c.relnamespace=private_id AND g.tgisinternal AND
        (n.nspname<>'pg_catalog' OR k.contype IS DISTINCT FROM 'f' OR k.connamespace<>private_id
          OR g.tgenabled<>'O' OR g.tgdeferrable OR g.tginitdeferred OR g.tgnargs<>0
          OR g.tgargs<>''::bytea OR g.tgattr<>''::pg_catalog.int2vector OR g.tgqual IS NOT NULL
          OR g.tgoldtable IS NOT NULL OR g.tgnewtable IS NOT NULL OR g.tgparentid<>0
          OR NOT (p.proname='RI_FKey_check_ins' AND g.tgtype=5 AND g.tgrelid=k.conrelid AND g.tgconstrrelid=k.confrelid
            OR p.proname='RI_FKey_check_upd' AND g.tgtype=17 AND g.tgrelid=k.conrelid AND g.tgconstrrelid=k.confrelid
            OR p.proname='RI_FKey_noaction_del' AND g.tgtype=9 AND g.tgrelid=k.confrelid AND g.tgconstrrelid=k.conrelid
            OR p.proname='RI_FKey_noaction_upd' AND g.tgtype=17 AND g.tgrelid=k.confrelid AND g.tgconstrrelid=k.conrelid)))
    OR EXISTS (SELECT 1 FROM pg_catalog.pg_constraint k JOIN pg_catalog.pg_class c ON c.oid=k.conrelid
      WHERE c.relnamespace=private_id AND k.contype='f' AND
        (SELECT count(DISTINCT g.tgfoid) FROM pg_catalog.pg_trigger g WHERE g.tgconstraint=k.oid AND g.tgisinternal)<>4) THEN
    RAISE EXCEPTION 'hs1 exact trigger mismatch' USING ERRCODE='P7312';
  END IF;
END $hs1_structure$;

DO $hs1_dependency_boundary$
DECLARE foreign_dependency boolean; owner_id oid := 'ot_v3_intake_owner'::pg_catalog.regrole;
  caller_id oid := 'ot_v3_intake_caller'::pg_catalog.regrole;
BEGIN
  WITH scope_schemas AS (
  SELECT n.oid,n.nspname FROM pg_catalog.pg_namespace n
  WHERE n.nspname IN ('official_v3_intake_private','official_v3_intake_api')
), scope_tables AS (
  SELECT c.oid,c.reltoastrelid FROM pg_catalog.pg_class c JOIN scope_schemas n ON n.oid=c.relnamespace WHERE c.relkind='r'
), scope_classes AS (
  SELECT c.oid FROM pg_catalog.pg_class c JOIN scope_schemas n ON n.oid=c.relnamespace
  UNION SELECT t.reltoastrelid FROM scope_tables t WHERE t.reltoastrelid<>0
  UNION SELECT i.indexrelid FROM pg_catalog.pg_index i JOIN scope_tables t ON i.indrelid=t.reltoastrelid WHERE t.reltoastrelid<>0
), scope_objects AS (
  SELECT 'pg_catalog.pg_namespace'::pg_catalog.regclass::oid AS classid,n.oid AS objid FROM scope_schemas n
  UNION SELECT 'pg_catalog.pg_class'::pg_catalog.regclass,c.oid FROM scope_classes c
  UNION SELECT 'pg_catalog.pg_type'::pg_catalog.regclass,t.oid FROM pg_catalog.pg_type t JOIN scope_schemas n ON n.oid=t.typnamespace
  UNION SELECT 'pg_catalog.pg_proc'::pg_catalog.regclass,p.oid FROM pg_catalog.pg_proc p JOIN scope_schemas n ON n.oid=p.pronamespace
  UNION SELECT 'pg_catalog.pg_constraint'::pg_catalog.regclass,c.oid FROM pg_catalog.pg_constraint c JOIN scope_tables t ON t.oid=c.conrelid
  UNION SELECT 'pg_catalog.pg_trigger'::pg_catalog.regclass,g.oid FROM pg_catalog.pg_trigger g JOIN scope_tables t ON t.oid=g.tgrelid
  UNION SELECT 'pg_catalog.pg_policy'::pg_catalog.regclass,p.oid FROM pg_catalog.pg_policy p JOIN scope_tables t ON t.oid=p.polrelid
  UNION SELECT 'pg_catalog.pg_attrdef'::pg_catalog.regclass,d.oid FROM pg_catalog.pg_attrdef d JOIN scope_tables t ON t.oid=d.adrelid
)
  SELECT EXISTS (SELECT 1 FROM pg_catalog.pg_depend d
    JOIN scope_objects r ON r.classid=d.refclassid AND r.objid=d.refobjid
    WHERE NOT EXISTS (SELECT 1 FROM scope_objects o WHERE o.classid=d.classid AND o.objid=d.objid))
    OR EXISTS (SELECT 1 FROM pg_catalog.pg_depend d
      JOIN scope_objects o ON o.classid=d.classid AND o.objid=d.objid WHERE d.deptype IN ('e','x'))
    OR EXISTS (SELECT 1 FROM pg_catalog.pg_shdepend d
      WHERE d.refclassid='pg_catalog.pg_authid'::pg_catalog.regclass AND d.refobjid IN (owner_id,caller_id)
        AND NOT (d.dbid=(SELECT b.oid FROM pg_catalog.pg_database b WHERE b.datname=current_database())
          AND EXISTS (SELECT 1 FROM scope_objects o WHERE o.classid=d.classid AND o.objid=d.objid))
        AND NOT (d.dbid=0 AND d.classid='pg_catalog.pg_auth_members'::pg_catalog.regclass
          AND EXISTS (SELECT 1 FROM pg_catalog.pg_auth_members m WHERE m.oid=d.objid
            AND m.roleid IN (owner_id,caller_id) AND m.member=session_user::pg_catalog.regrole)))
    OR EXISTS (SELECT 1 FROM pg_catalog.pg_seclabel s JOIN scope_objects o ON o.classid=s.classoid AND o.objid=s.objoid)
    OR EXISTS (SELECT 1 FROM pg_catalog.pg_shseclabel s WHERE s.classoid='pg_catalog.pg_authid'::pg_catalog.regclass
      AND s.objoid IN (owner_id,caller_id))
    OR EXISTS (SELECT 1 FROM pg_catalog.pg_description d JOIN scope_objects o ON o.classid=d.classoid AND o.objid=d.objoid
      WHERE d.objsubid<>0 OR NOT (d.classoid='pg_catalog.pg_namespace'::pg_catalog.regclass AND
        (d.objoid='official_v3_intake_private'::pg_catalog.regnamespace
          AND d.description='S1 candidate v1: untrusted proposal custody only; no Accepted Store or source authority'
         OR d.objoid='official_v3_intake_api'::pg_catalog.regnamespace
          AND d.description='HS1 v1: hosted non-superuser S1 installation; unused-only recovery; no source authority')))
    OR EXISTS (SELECT 1 FROM pg_catalog.pg_shdescription d WHERE d.classoid='pg_catalog.pg_authid'::pg_catalog.regclass
      AND d.objoid IN (owner_id,caller_id))
    OR pg_catalog.obj_description('official_v3_intake_private'::pg_catalog.regnamespace,'pg_namespace')
      IS DISTINCT FROM 'S1 candidate v1: untrusted proposal custody only; no Accepted Store or source authority'
    OR pg_catalog.obj_description('official_v3_intake_api'::pg_catalog.regnamespace,'pg_namespace')
      IS DISTINCT FROM 'HS1 v1: hosted non-superuser S1 installation; unused-only recovery; no source authority'
    INTO foreign_dependency;
  IF foreign_dependency THEN
    RAISE EXCEPTION 'hs1 foreign object/dependency or label' USING ERRCODE='P7312';
  END IF;
END $hs1_dependency_boundary$;

DO $hs1_effective_privileges$
DECLARE actor record; obj record; owner_id oid := 'ot_v3_intake_owner'::pg_catalog.regrole;
  caller_id oid := 'ot_v3_intake_caller'::pg_catalog.regrole;
BEGIN
  -- PUBLIC and every explicitly granted ACL are covered by the exact catalogs.
  -- These effective checks also reject platform-role paths into the new scope.
  FOR actor IN SELECT r.oid,r.rolname FROM pg_catalog.pg_roles r
    WHERE r.rolname IN ('anon','authenticated','service_role','ot_v3_intake_caller') LOOP
    IF pg_catalog.has_schema_privilege(actor.oid,'official_v3_intake_private','USAGE,CREATE')
      OR pg_catalog.has_schema_privilege(actor.oid,'official_v3_intake_api','CREATE')
      OR (actor.oid<>caller_id AND pg_catalog.has_schema_privilege(actor.oid,'official_v3_intake_api','USAGE'))
      OR (actor.oid=caller_id AND NOT pg_catalog.has_schema_privilege(actor.oid,'official_v3_intake_api','USAGE'))
      OR pg_catalog.pg_has_role(actor.oid,owner_id,'USAGE') OR pg_catalog.pg_has_role(actor.oid,owner_id,'SET') THEN
      RAISE EXCEPTION 'hs1 effective schema/owner privilege' USING ERRCODE='P7312';
    END IF;
    FOR obj IN SELECT c.oid FROM pg_catalog.pg_class c JOIN pg_catalog.pg_namespace n ON n.oid=c.relnamespace
      WHERE n.nspname='official_v3_intake_private' AND c.relkind='r' LOOP
      IF pg_catalog.has_table_privilege(actor.oid,obj.oid,'SELECT,INSERT,UPDATE,DELETE,TRUNCATE,REFERENCES,TRIGGER,MAINTAIN')
        OR pg_catalog.has_any_column_privilege(actor.oid,obj.oid,'SELECT,INSERT,UPDATE,REFERENCES') THEN
        RAISE EXCEPTION 'hs1 effective table/column privilege' USING ERRCODE='P7312';
      END IF;
    END LOOP;
    FOR obj IN SELECT p.oid,n.nspname FROM pg_catalog.pg_proc p JOIN pg_catalog.pg_namespace n ON n.oid=p.pronamespace
      WHERE n.nspname IN ('official_v3_intake_private','official_v3_intake_api') LOOP
      IF pg_catalog.has_function_privilege(actor.oid,obj.oid,'EXECUTE')
        IS DISTINCT FROM (actor.oid=caller_id AND obj.nspname='official_v3_intake_api') THEN
        RAISE EXCEPTION 'hs1 effective function privilege' USING ERRCODE='P7312';
      END IF;
    END LOOP;
  END LOOP;
END $hs1_effective_privileges$;

CREATE ROLE ot_v3_jobs_owner NOLOGIN NOINHERIT NOSUPERUSER NOCREATEDB NOCREATEROLE NOREPLICATION NOBYPASSRLS;
CREATE ROLE ot_v3_jobs_caller NOLOGIN NOINHERIT NOSUPERUSER NOCREATEDB NOCREATEROLE NOREPLICATION NOBYPASSRLS;
DO $hm04_bootstrap_edges$
DECLARE creator oid:=session_user::pg_catalog.regrole; owner_id oid:='ot_v3_jobs_owner'::pg_catalog.regrole;
  caller_id oid:='ot_v3_jobs_caller'::pg_catalog.regrole; intake_id oid:='ot_v3_intake_owner'::pg_catalog.regrole; login_id oid;
BEGIN
  -- Exact protected owner edges. ADMIN-only bootstrap grants are never rewritten.
  IF EXISTS(SELECT 1 FROM pg_catalog.pg_roles r WHERE r.oid IN (owner_id,caller_id,intake_id)
      AND (r.rolcanlogin OR r.rolinherit OR r.rolsuper OR r.rolcreatedb OR r.rolcreaterole
        OR r.rolreplication OR r.rolbypassrls OR r.rolconfig IS NOT NULL OR r.rolconnlimit<>-1 OR r.rolvaliduntil IS NOT NULL))
    OR EXISTS(SELECT 1 FROM pg_catalog.pg_db_role_setting s WHERE s.setrole IN (owner_id,caller_id,intake_id))
    OR EXISTS(SELECT 1 FROM pg_catalog.pg_default_acl d WHERE d.defaclrole IN (owner_id,caller_id,intake_id))
    OR pg_catalog.has_database_privilege(owner_id,current_database(),'CREATE')
    OR pg_catalog.has_database_privilege(caller_id,current_database(),'CREATE')
    OR pg_catalog.has_database_privilege(intake_id,current_database(),'CREATE')
    OR NOT EXISTS(SELECT 1 FROM pg_catalog.pg_roles r WHERE r.oid=10 AND r.rolsuper) THEN
    RAISE EXCEPTION 'hm04 restricted role/default boundary' USING ERRCODE='P7603';
  END IF;
  IF (SELECT count(*) FROM pg_catalog.pg_auth_members m
      WHERE m.roleid=owner_id OR m.member=owner_id OR m.grantor=owner_id)<>1
    OR (SELECT count(*) FROM pg_catalog.pg_auth_members m
      WHERE m.roleid=owner_id AND m.member=creator AND m.grantor=10
        AND m.admin_option AND NOT m.inherit_option AND NOT m.set_option)<>1
    
    OR pg_catalog.pg_has_role(creator,owner_id,'USAGE')
    OR pg_catalog.pg_has_role(creator,owner_id,'SET') IS DISTINCT FROM false
    OR (SELECT count(*) FROM pg_catalog.pg_auth_members m
      WHERE m.roleid=intake_id OR m.member=intake_id OR m.grantor=intake_id)<>1
    OR (SELECT count(*) FROM pg_catalog.pg_auth_members m
      WHERE m.roleid=intake_id AND m.member=creator AND m.grantor=10
        AND m.admin_option AND NOT m.inherit_option AND NOT m.set_option)<>1
    
    OR pg_catalog.pg_has_role(creator,intake_id,'USAGE')
    OR pg_catalog.pg_has_role(creator,intake_id,'SET') IS DISTINCT FROM false THEN
    RAISE EXCEPTION 'hm04 exact protected membership boundary' USING ERRCODE='P7603';
  END IF;
  IF (SELECT count(*) FROM pg_catalog.pg_auth_members m WHERE m.roleid=caller_id
      AND m.member=creator AND m.grantor=10 AND m.admin_option AND NOT m.inherit_option AND NOT m.set_option)<>1
    OR EXISTS(SELECT 1 FROM pg_catalog.pg_auth_members m WHERE m.member=caller_id OR m.grantor=caller_id)
    OR pg_catalog.pg_has_role(creator,caller_id,'SET') OR pg_catalog.pg_has_role(creator,caller_id,'USAGE')
    OR (SELECT count(*) FROM pg_catalog.pg_auth_members m WHERE m.roleid=caller_id
      AND NOT(m.member=creator AND m.grantor=10 AND m.admin_option AND NOT m.inherit_option AND NOT m.set_option))>0 THEN
    RAISE EXCEPTION 'hm04 caller graph boundary' USING ERRCODE='P7603';
  END IF;
END $hm04_bootstrap_edges$;

GRANT ot_v3_jobs_owner TO postgres WITH ADMIN FALSE, INHERIT FALSE, SET TRUE GRANTED BY postgres;
DO $hm04_owner_set_edge$
DECLARE creator oid:=session_user::pg_catalog.regrole; owner_id oid:='ot_v3_jobs_owner'::pg_catalog.regrole;
  caller_id oid:='ot_v3_jobs_caller'::pg_catalog.regrole; intake_id oid:='ot_v3_intake_owner'::pg_catalog.regrole; login_id oid;
BEGIN
  -- Exact protected owner edges. ADMIN-only bootstrap grants are never rewritten.
  IF EXISTS(SELECT 1 FROM pg_catalog.pg_roles r WHERE r.oid IN (owner_id,caller_id,intake_id)
      AND (r.rolcanlogin OR r.rolinherit OR r.rolsuper OR r.rolcreatedb OR r.rolcreaterole
        OR r.rolreplication OR r.rolbypassrls OR r.rolconfig IS NOT NULL OR r.rolconnlimit<>-1 OR r.rolvaliduntil IS NOT NULL))
    OR EXISTS(SELECT 1 FROM pg_catalog.pg_db_role_setting s WHERE s.setrole IN (owner_id,caller_id,intake_id))
    OR EXISTS(SELECT 1 FROM pg_catalog.pg_default_acl d WHERE d.defaclrole IN (owner_id,caller_id,intake_id))
    OR pg_catalog.has_database_privilege(owner_id,current_database(),'CREATE')
    OR pg_catalog.has_database_privilege(caller_id,current_database(),'CREATE')
    OR pg_catalog.has_database_privilege(intake_id,current_database(),'CREATE')
    OR NOT EXISTS(SELECT 1 FROM pg_catalog.pg_roles r WHERE r.oid=10 AND r.rolsuper) THEN
    RAISE EXCEPTION 'hm04 restricted role/default boundary' USING ERRCODE='P7603';
  END IF;
  IF (SELECT count(*) FROM pg_catalog.pg_auth_members m
      WHERE m.roleid=owner_id OR m.member=owner_id OR m.grantor=owner_id)<>2
    OR (SELECT count(*) FROM pg_catalog.pg_auth_members m
      WHERE m.roleid=owner_id AND m.member=creator AND m.grantor=10
        AND m.admin_option AND NOT m.inherit_option AND NOT m.set_option)<>1
    OR (SELECT count(*) FROM pg_catalog.pg_auth_members m
      WHERE m.roleid=owner_id AND m.member=creator AND m.grantor=creator
        AND NOT m.admin_option AND NOT m.inherit_option AND m.set_option)<>1
    OR pg_catalog.pg_has_role(creator,owner_id,'USAGE')
    OR pg_catalog.pg_has_role(creator,owner_id,'SET') IS DISTINCT FROM true
    OR (SELECT count(*) FROM pg_catalog.pg_auth_members m
      WHERE m.roleid=intake_id OR m.member=intake_id OR m.grantor=intake_id)<>1
    OR (SELECT count(*) FROM pg_catalog.pg_auth_members m
      WHERE m.roleid=intake_id AND m.member=creator AND m.grantor=10
        AND m.admin_option AND NOT m.inherit_option AND NOT m.set_option)<>1
    
    OR pg_catalog.pg_has_role(creator,intake_id,'USAGE')
    OR pg_catalog.pg_has_role(creator,intake_id,'SET') IS DISTINCT FROM false THEN
    RAISE EXCEPTION 'hm04 exact protected membership boundary' USING ERRCODE='P7603';
  END IF;
  IF (SELECT count(*) FROM pg_catalog.pg_auth_members m WHERE m.roleid=caller_id
      AND m.member=creator AND m.grantor=10 AND m.admin_option AND NOT m.inherit_option AND NOT m.set_option)<>1
    OR EXISTS(SELECT 1 FROM pg_catalog.pg_auth_members m WHERE m.member=caller_id OR m.grantor=caller_id)
    OR pg_catalog.pg_has_role(creator,caller_id,'SET') OR pg_catalog.pg_has_role(creator,caller_id,'USAGE')
    OR (SELECT count(*) FROM pg_catalog.pg_auth_members m WHERE m.roleid=caller_id
      AND NOT(m.member=creator AND m.grantor=10 AND m.admin_option AND NOT m.inherit_option AND NOT m.set_option))>0 THEN
    RAISE EXCEPTION 'hm04 caller graph boundary' USING ERRCODE='P7603';
  END IF;
END $hm04_owner_set_edge$;

-- Creator supplies its own DB-CREATE; JobsOwner never receives that privilege.
CREATE SCHEMA official_v3_jobs_private AUTHORIZATION ot_v3_jobs_owner;
CREATE SCHEMA official_v3_jobs_api AUTHORIZATION ot_v3_jobs_owner;
SET LOCAL ROLE ot_v3_jobs_owner;
REVOKE ALL ON SCHEMA official_v3_jobs_private,official_v3_jobs_api FROM PUBLIC RESTRICT;
GRANT USAGE ON SCHEMA official_v3_jobs_api TO ot_v3_jobs_caller;


CREATE FUNCTION official_v3_jobs_private.exact_keys_v1(v jsonb, expected text[]) RETURNS boolean
LANGUAGE sql IMMUTABLE PARALLEL UNSAFE SECURITY INVOKER CALLED ON NULL INPUT SET search_path=pg_catalog,pg_temp AS $$
  SELECT v IS NOT NULL AND expected IS NOT NULL AND jsonb_typeof(v)='object' AND
    CASE WHEN
      CASE WHEN cardinality(expected) BETWEEN 0 AND 32 THEN
        CASE WHEN (SELECT count(*) FROM jsonb_object_keys(CASE WHEN jsonb_typeof(v)='object' THEN v ELSE '{}'::jsonb END))=cardinality(expected) THEN
          (CASE WHEN jsonb_typeof(v)='object' THEN v ELSE '{}'::jsonb END)
          - (CASE WHEN array_ndims(expected)=1 THEN expected ELSE ARRAY(SELECT k FROM unnest(expected) k) END)='{}'::jsonb
        ELSE false END
      ELSE false END
    THEN expected=expected
    ELSE
    ARRAY(SELECT k FROM jsonb_object_keys(CASE WHEN jsonb_typeof(v)='object' THEN v ELSE '{}'::jsonb END) k ORDER BY k COLLATE "C")
    = ARRAY(SELECT k FROM unnest(expected) k ORDER BY k COLLATE "C")
    END
$$;
CREATE FUNCTION official_v3_jobs_private.unique_json_v1(v json, d integer) RETURNS boolean
LANGUAGE plpgsql IMMUTABLE PARALLEL UNSAFE SECURITY INVOKER CALLED ON NULL INPUT SET search_path=pg_catalog,pg_temp AS $$
DECLARE x record; e json; keys text[]:='{}'; n integer:=0;
BEGIN
  IF v IS NULL OR d IS NULL OR d<0 OR d>24 THEN RETURN false; END IF;
  IF json_typeof(v)='object' THEN
    FOR x IN SELECT * FROM json_each(v) LOOP
      n:=n+1; IF n>32768 OR x.key=ANY(keys) OR official_v3_jobs_private.unique_json_v1(x.value,d+1) IS NOT TRUE THEN RETURN false; END IF;
      keys:=array_append(keys,x.key);
    END LOOP;
  ELSIF json_typeof(v)='array' THEN
    FOR e IN SELECT value FROM json_array_elements(v) LOOP
      n:=n+1; IF n>32768 OR official_v3_jobs_private.unique_json_v1(e,d+1) IS NOT TRUE THEN RETURN false; END IF;
    END LOOP;
  ELSIF json_typeof(v)='number' AND left(v::text,1)='-' AND (v::text)::numeric=0 THEN RETURN false;
  END IF;
  RETURN true;
END $$;
CREATE FUNCTION official_v3_jobs_private.nodes_v1(v jsonb,d integer,max_d integer,max_n integer) RETURNS integer
LANGUAGE plpgsql IMMUTABLE PARALLEL UNSAFE SECURITY INVOKER CALLED ON NULL INPUT SET search_path=pg_catalog,pg_temp AS $$
DECLARE e jsonb; n integer:=1; m integer; child_count bigint;
BEGIN
  IF v IS NULL OR d IS NULL OR max_d IS NULL OR max_n IS NULL OR d<0 OR d>max_d OR max_d>24 OR max_n>65536 OR max_n<1 THEN RETURN -1; END IF;
  IF jsonb_typeof(v)='object' THEN
    SELECT count(*) INTO child_count FROM jsonb_object_keys(v);
    IF child_count>0 AND d+1>max_d THEN RETURN -1; END IF;
    IF child_count>(max_n-1)/2 THEN RETURN -1; END IF;
    n:=1+2*child_count;
    FOR e IN SELECT j.value FROM jsonb_each(v) j WHERE jsonb_typeof(j.value) IN ('object','array') LOOP
      m:=official_v3_jobs_private.nodes_v1(e,d+1,max_d,max_n);
      IF m<0 THEN RETURN -1; END IF;
      n:=n+m-1; IF n>max_n THEN RETURN -1; END IF;
    END LOOP;
  ELSIF jsonb_typeof(v)='array' THEN
    child_count:=jsonb_array_length(v);
    IF child_count>0 AND d+1>max_d THEN RETURN -1; END IF;
    IF child_count>max_n-1 THEN RETURN -1; END IF;
    n:=1+child_count;
    FOR e IN SELECT j.value FROM jsonb_array_elements(v) j WHERE jsonb_typeof(j.value) IN ('object','array') LOOP
      m:=official_v3_jobs_private.nodes_v1(e,d+1,max_d,max_n);
      IF m<0 THEN RETURN -1; END IF;
      n:=n+m-1; IF n>max_n THEN RETURN -1; END IF;
    END LOOP;
  END IF;
  RETURN n;
END $$;
CREATE FUNCTION official_v3_jobs_private.canonical_v1(v jsonb,d integer) RETURNS text
LANGUAGE plpgsql IMMUTABLE PARALLEL UNSAFE SECURITY INVOKER CALLED ON NULL INPUT SET search_path=pg_catalog,pg_temp AS $$
DECLARE x record; e jsonb; s text; parts text[]:='{}'; child_text text; number_value numeric; retained_object jsonb; retained_object_canonical text; object_keys text[]; object_values jsonb[]; part_index integer;
  current_depth integer; child_depth integer; descend_object boolean; pending_positions integer[]; pending_cursor integer;
  child_keys text[]; child_values jsonb[]; child_parts text[]; child_pending_positions integer[];
  stack_parts text[]:='{}'; stack_keys text[]:='{}'; stack_values jsonb[]:='{}'; stack_pending integer[]:='{}';
  frame_lengths integer[]:='{}'; frame_pending_lengths integer[]:='{}'; frame_cursors integer[]:='{}'; stack_level integer:=0;
  frame_length integer; pending_length integer; parent_length integer; parent_pending_length integer; fast_text text;
BEGIN
  IF v IS NULL OR d IS NULL OR d<0 OR d>24 THEN RAISE EXCEPTION 'm04 invalid metadata' USING ERRCODE='P7601'; END IF;
  IF jsonb_typeof(v)='object' THEN
    IF v='{}'::jsonb THEN RETURN '{}'; END IF;
    fast_text:=v::text;
    IF d<24 AND octet_length(fast_text)<=8192 THEN
      IF strpos(fast_text COLLATE "C",chr(92))=0 THEN
        IF fast_text !~ '[^ -~]' THEN
          -- Every object value follows '": ' in JSONB output; no escapes remain.
          -- Matching an opening string quote only adds a conservative fallback.
          IF fast_text COLLATE "C" !~ '": ([[]|-0|-?[0-9]{16}|-?[0-9]+[.])'
            AND strpos(fast_text COLLATE "C",'{,')=0 THEN
            IF strpos(fast_text COLLATE "C",'": {')=0 THEN
              SELECT '{'||string_agg('"'||j.key||'":'||j.value::text,',' ORDER BY j.key COLLATE "C")||'}'
                INTO fast_text FROM jsonb_each(v) j;
            ELSE
              WITH RECURSIVE walk_nodes(node,member_key,node_path,node_depth,node_type) AS (
                SELECT v,NULL::text,ARRAY[]::text[],d,'object'::text
                UNION ALL
                SELECT j.value,j.key,array_append(w.node_path,j.key),w.node_depth+1,jsonb_typeof(j.value)
                  FROM walk_nodes w CROSS JOIN LATERAL jsonb_each(
                    CASE WHEN w.node_type='object' AND w.node_depth<24 THEN w.node ELSE '{}'::jsonb END) j
                  WHERE w.node_type='object' AND w.node_depth<24
              ), token_rows AS (
                SELECT w.node_path AS token_path,
                  CASE WHEN w.node_depth<24 THEN true ELSE w.node_type<>'object' OR w.node='{}'::jsonb END AS is_valid,
                  (CASE WHEN w.member_key IS NULL THEN '' ELSE ',"'||w.member_key||'":' END)||
                    CASE WHEN w.node_type='object' THEN '{' ELSE w.node::text END AS piece
                  FROM walk_nodes w
                UNION ALL
                SELECT array_append(w.node_path,NULL::text),true,'}' FROM walk_nodes w WHERE w.node_type='object'
              )
              SELECT CASE WHEN bool_and(t.is_valid) IS TRUE THEN replace(
                string_agg(t.piece,'' ORDER BY t.token_path COLLATE "C") COLLATE "C",'{,','{') END
                INTO fast_text FROM token_rows t;
            END IF;
            IF fast_text IS NOT NULL THEN RETURN fast_text; END IF;
          END IF;
        END IF;
      END IF;
    END IF;
    fast_text:=NULL;
  END IF;
  CASE jsonb_typeof(v)
  WHEN 'object' THEN
    current_depth:=d;
    SELECT array_agg(j.key ORDER BY j.key COLLATE "C"),
      array_agg(j.value ORDER BY j.key COLLATE "C"),
      COALESCE(array_agg(
        CASE WHEN j.key ~ '[^ -~]' OR current_depth+1>24 THEN NULL
        ELSE to_jsonb(j.key)::text||':'||
          CASE jsonb_typeof(j.value)
          WHEN 'string' THEN CASE WHEN (j.value#>>'{}') ~ '[^ -~]' THEN NULL ELSE j.value::text END
          WHEN 'number' THEN CASE WHEN j.value::numeric=trunc(j.value::numeric)
            AND j.value::numeric BETWEEN -9007199254740991 AND 9007199254740991 THEN trunc(j.value::numeric)::text END
          WHEN 'boolean' THEN j.value::text
          WHEN 'null' THEN 'null'
          ELSE NULL
          END
        END ORDER BY j.key COLLATE "C"),ARRAY[]::text[])
      INTO object_keys,object_values,parts FROM jsonb_each(v) j;
    pending_positions:=array_positions(parts,NULL::text); pending_cursor:=1;
    LOOP
      IF pending_cursor<=cardinality(pending_positions) THEN
        part_index:=pending_positions[pending_cursor];
        IF object_keys[part_index] ~ '[^ -~]' THEN RAISE EXCEPTION 'm04 invalid metadata' USING ERRCODE='P7601'; END IF;
        e:=object_values[part_index];
        IF current_depth+1>24 THEN RAISE EXCEPTION 'm04 invalid metadata' USING ERRCODE='P7601'; END IF;
        CASE jsonb_typeof(e)
        WHEN 'object' THEN
          IF retained_object IS NULL THEN descend_object:=true;
          ELSIF (e::text) COLLATE "C" = (retained_object::text) COLLATE "C" THEN
            child_text:=retained_object_canonical; descend_object:=false;
          ELSE descend_object:=true;
          END IF;
          IF descend_object THEN
            child_depth:=current_depth+1;
            IF e IS NULL OR child_depth IS NULL OR child_depth<0 OR child_depth>24 THEN RAISE EXCEPTION 'm04 invalid metadata' USING ERRCODE='P7601'; END IF;
            SELECT array_agg(j.key ORDER BY j.key COLLATE "C"),
              array_agg(j.value ORDER BY j.key COLLATE "C"),
              COALESCE(array_agg(
                CASE WHEN j.key ~ '[^ -~]' OR child_depth+1>24 THEN NULL
                ELSE to_jsonb(j.key)::text||':'||
                  CASE jsonb_typeof(j.value)
                  WHEN 'string' THEN CASE WHEN (j.value#>>'{}') ~ '[^ -~]' THEN NULL ELSE j.value::text END
                  WHEN 'number' THEN CASE WHEN j.value::numeric=trunc(j.value::numeric)
                    AND j.value::numeric BETWEEN -9007199254740991 AND 9007199254740991 THEN trunc(j.value::numeric)::text END
                  WHEN 'boolean' THEN j.value::text
                  WHEN 'null' THEN 'null'
                  ELSE NULL
                  END
                END ORDER BY j.key COLLATE "C"),ARRAY[]::text[])
              INTO child_keys,child_values,child_parts FROM jsonb_each(e) j;
            child_pending_positions:=array_positions(child_parts,NULL::text);
            IF cardinality(child_pending_positions)=0 THEN
              child_text:='{'||array_to_string(child_parts,',')||'}';
              retained_object:=e; retained_object_canonical:=child_text;
            ELSE
              frame_lengths[stack_level+1]:=cardinality(parts);
              frame_pending_lengths[stack_level+1]:=cardinality(pending_positions);
              frame_cursors[stack_level+1]:=pending_cursor;
              stack_parts:=stack_parts||parts; stack_keys:=stack_keys||object_keys; stack_values:=stack_values||object_values;
              stack_pending:=stack_pending||pending_positions;
              object_keys:=child_keys; object_values:=child_values; parts:=child_parts;
              pending_positions:=child_pending_positions; pending_cursor:=1;
              retained_object:=NULL; retained_object_canonical:=NULL;
              stack_level:=stack_level+1; current_depth:=child_depth;
              CONTINUE;
            END IF;
          END IF;
        WHEN 'array' THEN child_text:=official_v3_jobs_private.canonical_v1(e,current_depth+1);
        WHEN 'string' THEN
          s:=e#>>'{}'; IF s ~ '[^ -~]' THEN RAISE EXCEPTION 'm04 invalid metadata' USING ERRCODE='P7601'; END IF;
          child_text:=e::text;
        WHEN 'number' THEN
          number_value:=e::text::numeric; IF number_value<>trunc(number_value) OR number_value NOT BETWEEN -9007199254740991 AND 9007199254740991 THEN
            RAISE EXCEPTION 'm04 invalid metadata' USING ERRCODE='P7601'; END IF; child_text:=trunc(number_value)::text;
        WHEN 'boolean' THEN child_text:=e::text;
        WHEN 'null' THEN child_text:='null';
        ELSE RAISE EXCEPTION 'm04 invalid metadata' USING ERRCODE='P7601';
        END CASE;
        parts[part_index]:=to_jsonb(object_keys[part_index])::text||':'||child_text; pending_cursor:=pending_cursor+1;
      ELSE
        child_text:='{'||array_to_string(parts,',')||'}';
        IF stack_level=0 THEN RETURN child_text; END IF;
        frame_length:=frame_lengths[stack_level]; pending_length:=frame_pending_lengths[stack_level];
        parent_length:=cardinality(stack_parts)-frame_length; parent_pending_length:=cardinality(stack_pending)-pending_length;
        parts:=stack_parts[parent_length+1:parent_length+frame_length];
        object_keys:=stack_keys[parent_length+1:parent_length+frame_length];
        object_values:=stack_values[parent_length+1:parent_length+frame_length];
        pending_positions:=stack_pending[parent_pending_length+1:parent_pending_length+pending_length];
        pending_cursor:=frame_cursors[stack_level];
        stack_parts:=stack_parts[1:parent_length]; stack_keys:=stack_keys[1:parent_length]; stack_values:=stack_values[1:parent_length];
        stack_pending:=stack_pending[1:parent_pending_length];
        stack_level:=stack_level-1; current_depth:=current_depth-1;
        part_index:=pending_positions[pending_cursor];
        retained_object:=object_values[part_index]; retained_object_canonical:=child_text;
        parts[part_index]:=to_jsonb(object_keys[part_index])::text||':'||child_text; pending_cursor:=pending_cursor+1;
      END IF;
    END LOOP;
  WHEN 'array' THEN
    FOR e IN SELECT value FROM jsonb_array_elements(v) LOOP
      IF d+1>24 THEN RAISE EXCEPTION 'm04 invalid metadata' USING ERRCODE='P7601'; END IF;
      CASE jsonb_typeof(e)
      WHEN 'object' THEN child_text:=official_v3_jobs_private.canonical_v1(e,d+1);
      WHEN 'array' THEN child_text:=official_v3_jobs_private.canonical_v1(e,d+1);
      WHEN 'string' THEN
        s:=e#>>'{}'; IF s ~ '[^ -~]' THEN RAISE EXCEPTION 'm04 invalid metadata' USING ERRCODE='P7601'; END IF;
        child_text:=e::text;
      WHEN 'number' THEN
        number_value:=e::text::numeric; IF number_value<>trunc(number_value) OR number_value NOT BETWEEN -9007199254740991 AND 9007199254740991 THEN
          RAISE EXCEPTION 'm04 invalid metadata' USING ERRCODE='P7601'; END IF; child_text:=trunc(number_value)::text;
      WHEN 'boolean' THEN child_text:=e::text;
      WHEN 'null' THEN child_text:='null';
      ELSE RAISE EXCEPTION 'm04 invalid metadata' USING ERRCODE='P7601';
      END CASE;
      parts:=array_append(parts,child_text);
    END LOOP;
    RETURN '['||array_to_string(parts,',')||']';
  WHEN 'string' THEN
    s:=v#>>'{}'; IF s ~ '[^ -~]' THEN RAISE EXCEPTION 'm04 invalid metadata' USING ERRCODE='P7601'; END IF;
    RETURN v::text;
  WHEN 'number' THEN
    number_value:=v::text::numeric; IF number_value<>trunc(number_value) OR number_value NOT BETWEEN -9007199254740991 AND 9007199254740991 THEN
      RAISE EXCEPTION 'm04 invalid metadata' USING ERRCODE='P7601'; END IF; RETURN trunc(number_value)::text;
  WHEN 'boolean' THEN RETURN v::text;
  WHEN 'null' THEN RETURN 'null';
  ELSE RAISE EXCEPTION 'm04 invalid metadata' USING ERRCODE='P7601';
  END CASE;
END $$;
CREATE FUNCTION official_v3_jobs_private.wire_v1(t text) RETURNS jsonb
LANGUAGE plpgsql IMMUTABLE PARALLEL UNSAFE SECURITY INVOKER CALLED ON NULL INPUT SET search_path=pg_catalog,pg_temp AS $$
DECLARE j json; v jsonb;
BEGIN
  IF t IS NULL OR octet_length(t) NOT BETWEEN 1 AND 262144 THEN RAISE EXCEPTION 'm04 invalid wire' USING ERRCODE='P7601'; END IF;
  j:=t::json;
  IF official_v3_jobs_private.unique_json_v1(j,0) IS NOT TRUE THEN RAISE EXCEPTION 'm04 invalid wire' USING ERRCODE='P7601'; END IF;
  v:=j::jsonb;
  IF official_v3_jobs_private.nodes_v1(v,0,24,32768)<0 OR official_v3_jobs_private.canonical_v1(v,0)<>t
    OR official_v3_jobs_private.exact_keys_v1(v,ARRAY['operation','phase','body']) IS NOT TRUE
    OR (v->>'operation' IN ('queue_read','queue_confirm','queue_cas','execution_read','execution_start','execution_prepare')) IS NOT TRUE
    OR (v->>'phase' IN ('probe','authorized')) IS NOT TRUE OR jsonb_typeof(v->'body') IS DISTINCT FROM 'object' THEN
    RAISE EXCEPTION 'm04 invalid wire' USING ERRCODE='P7601'; END IF;
  RETURN v;
END $$;
CREATE FUNCTION official_v3_jobs_private.civil_date_v1(t text) RETURNS boolean
LANGUAGE plpgsql IMMUTABLE PARALLEL UNSAFE SECURITY INVOKER CALLED ON NULL INPUT SET search_path=pg_catalog,pg_temp AS $$
DECLARE d date; year_value integer; month_value integer; day_value integer;
BEGIN
  IF t IS NULL OR t !~ '^[0-9]{4}-[0-9]{2}-[0-9]{2}$' OR left(t,4)='0000' THEN RETURN false; END IF;
  year_value:=substring(t,1,4)::integer;
  month_value:=substring(t,6,2)::integer;
  day_value:=substring(t,9,2)::integer;
  IF year_value BETWEEN 1 AND 9999 AND month_value BETWEEN 1 AND 12
    AND day_value BETWEEN 1 AND (CASE WHEN month_value=2 THEN
      CASE WHEN year_value%4=0 AND (year_value%100<>0 OR year_value%400=0) THEN 29 ELSE 28 END
      WHEN month_value IN (4,6,9,11) THEN 30 ELSE 31 END) THEN
    d:=make_date(year_value,month_value,day_value);
    RETURN to_char(d,'YYYY-MM-DD')=t;
  END IF;
  BEGIN
    d:=make_date(substring(t,1,4)::integer,substring(t,6,2)::integer,substring(t,9,2)::integer);
    RETURN to_char(d,'YYYY-MM-DD')=t;
  EXCEPTION WHEN datetime_field_overflow OR invalid_datetime_format THEN RETURN false;
  END;
END $$;
CREATE FUNCTION official_v3_jobs_private.timestamp_v1(t text) RETURNS timestamptz
LANGUAGE plpgsql IMMUTABLE PARALLEL UNSAFE SECURITY INVOKER CALLED ON NULL INPUT SET search_path=pg_catalog,pg_temp AS $$
DECLARE v timestamptz;
BEGIN
  IF t IS NULL OR t !~ '^[0-9]{4}-[0-9]{2}-[0-9]{2}T[0-9]{2}:[0-9]{2}:[0-9]{2}\.[0-9]{3}Z$'
    OR official_v3_jobs_private.civil_date_v1(left(t,10)) IS NOT TRUE THEN RAISE EXCEPTION 'm04 invalid time' USING ERRCODE='P7601'; END IF;
  v:=t::timestamptz;
  IF to_char(v AT TIME ZONE 'UTC','YYYY-MM-DD"T"HH24:MI:SS.MS"Z"')<>t THEN RAISE EXCEPTION 'm04 invalid time' USING ERRCODE='P7601'; END IF;
  RETURN v;
END $$;

CREATE FUNCTION official_v3_jobs_private.predicate_v1(v jsonb) RETURNS jsonb
LANGUAGE plpgsql IMMUTABLE PARALLEL UNSAFE SECURITY INVOKER CALLED ON NULL INPUT SET search_path=pg_catalog,pg_temp AS $$
DECLARE valid boolean:=false; k text:=v->>'kind'; countries text[]:=ARRAY['AD','AE','AF','AG','AI','AL','AM','AO','AQ','AR','AS','AT','AU','AW','AX','AZ','BA','BB','BD','BE','BF','BG','BH','BI','BJ','BL','BM','BN','BO','BQ','BR','BS','BT','BV','BW','BY','BZ','CA','CC','CD','CF','CG','CH','CI','CK','CL','CM','CN','CO','CR','CU','CV','CW','CX','CY','CZ','DE','DJ','DK','DM','DO','DZ','EC','EE','EG','EH','ER','ES','ET','FI','FJ','FK','FM','FO','FR','GA','GB','GD','GE','GF','GG','GH','GI','GL','GM','GN','GP','GQ','GR','GS','GT','GU','GW','GY','HK','HM','HN','HR','HT','HU','ID','IE','IL','IM','IN','IO','IQ','IR','IS','IT','JE','JM','JO','JP','KE','KG','KH','KI','KM','KN','KP','KR','KW','KY','KZ','LA','LB','LC','LI','LK','LR','LS','LT','LU','LV','LY','MA','MC','MD','ME','MF','MG','MH','MK','ML','MM','MN','MO','MP','MQ','MR','MS','MT','MU','MV','MW','MX','MY','MZ','NA','NC','NE','NF','NG','NI','NL','NO','NP','NR','NU','NZ','OM','PA','PE','PF','PG','PH','PK','PL','PM','PN','PR','PS','PT','PW','PY','QA','RE','RO','RS','RU','RW','SA','SB','SC','SD','SE','SG','SH','SI','SJ','SK','SL','SM','SN','SO','SR','SS','ST','SV','SX','SY','SZ','TC','TD','TF','TG','TH','TJ','TK','TL','TM','TN','TO','TR','TT','TV','TW','TZ','UA','UG','UM','US','UY','UZ','VA','VC','VE','VG','VI','VN','VU','WF','WS','YE','YT','ZA','ZM','ZW']; keys text[]; x jsonb;
BEGIN
  IF v IS NULL OR jsonb_typeof(v) IS DISTINCT FROM 'object' THEN RAISE EXCEPTION 'm04 invalid predicate' USING ERRCODE='P7601'; END IF;
  CASE k
  WHEN 'destination_permission' THEN keys:=ARRAY['kind','destinationCountryCode','permissionClass','validity'];
    valid:=v->>'destinationCountryCode'=ANY(countries) AND v->>'permissionClass' IN ('entry_clearance','permission_to_enter_or_stay','electronic_travel_authorization','visa','residence_permit') AND v->>'validity'='valid_on_travel_date';
  WHEN 'lawful_residence' THEN keys:=ARRAY['kind','countryCode','entitlement','departure'];
    valid:=v->>'countryCode'=ANY(countries) AND v->>'entitlement'='entitled_to_reside' AND v->>'departure' IN ('unrestricted','unspecified');
  WHEN 'journey_origin' THEN keys:=ARRAY['kind','place']; x:=v->'place';
    valid:=(official_v3_jobs_private.exact_keys_v1(x,ARRAY['kind','countryCode']) AND x->>'kind'='country' AND x->>'countryCode'=ANY(countries))
      OR (official_v3_jobs_private.exact_keys_v1(x,ARRAY['kind','regionCode']) AND x->>'kind'='region' AND x->>'regionCode'='common_travel_area');
  WHEN 'age_on_travel_date' THEN keys:=ARRAY['kind','comparison','years'];
    valid:=v->>'comparison' IN ('at_most','at_least') AND jsonb_typeof(v->'years')='number' AND v->>'years' ~ '^(0|[1-9][0-9]{0,2})$' AND (v->>'years')::numeric BETWEEN 0 AND 120;
  WHEN 'travel_purpose' THEN keys:=ARRAY['kind','purpose']; valid:=v->>'purpose' IN ('visitor','business','study','medical','transit','work','creative_worker','other');
  WHEN 'document_class' THEN keys:=ARRAY['kind','documentClass']; valid:=v->>'documentClass' IN ('ordinary','diplomatic','official','emergency','refugee_travel_document','laissez_passer');
  WHEN 'issuing_country','citizenship_includes','credential_citizenship_link','national_passport_for_citizenship' THEN keys:=ARRAY['kind','countryCode']; valid:=v->>'countryCode'=ANY(countries);
  WHEN 'nationality_status' THEN keys:=ARRAY['kind','status']; valid:=v->>'status' IN ('british_overseas_territory_citizen','british_national_overseas');
  WHEN 'institution_status' THEN keys:=ARRAY['kind','status']; valid:=v->>'status' IN ('french_ministry_of_education_school','confirmed_german_school');
  WHEN 'group_size_at_least' THEN keys:=ARRAY['kind','count']; valid:=jsonb_typeof(v->'count')='number' AND v->>'count' ~ '^[1-9][0-9]?$' AND (v->>'count')::numeric BETWEEN 2 AND 50;
  WHEN 'group_membership' THEN keys:=ARRAY['kind','role']; valid:=v->>'role'='traveller_included';
  WHEN 'authority_confirmation' THEN keys:=ARRAY['kind','subject']; valid:=v->>'subject'='institution_status';
  WHEN 'activity_characteristic' THEN keys:=ARRAY['kind','characteristic']; valid:=v->>'characteristic' IN ('remunerative_activity','income_earning_activity','profit_making_business_operation','business_contacts');
  WHEN 'planned_stay_duration' THEN keys:=ARRAY['kind','comparison','duration','counting']; x:=v->'duration';
    valid:=v->>'comparison' IN ('at_most','more_than') AND official_v3_jobs_private.exact_keys_v1(x,ARRAY['value','unit'])
      AND jsonb_typeof(x->'value')='number' AND x->>'value' ~ '^[1-9][0-9]{0,3}$'
      AND ((x->>'unit'='days' AND (x->>'value')::numeric BETWEEN 1 AND 3660 AND v->>'counting' IN ('unspecified','calendar_dates_inclusive','calendar_dates_exit_exclusive'))
        OR (x->>'unit'='months' AND (x->>'value')::numeric BETWEEN 1 AND 120 AND v->>'counting'='unspecified'));
  ELSE valid:=false;
  END CASE;
  IF valid IS NOT TRUE OR official_v3_jobs_private.exact_keys_v1(v,keys) IS NOT TRUE THEN RAISE EXCEPTION 'm04 invalid predicate' USING ERRCODE='P7601'; END IF;
  RETURN v;
END $$;
CREATE FUNCTION official_v3_jobs_private.expression_v1(v jsonb,strip_support boolean,d integer) RETURNS jsonb
LANGUAGE plpgsql IMMUTABLE PARALLEL UNSAFE SECURITY INVOKER CALLED ON NULL INPUT SET search_path=pg_catalog,pg_temp AS $$
DECLARE op text:=v->>'op'; e jsonb; n jsonb; a jsonb:='[]'; ids jsonb; count_ops integer;
BEGIN
  IF v IS NULL OR strip_support IS NULL OR d IS NULL OR d<1 OR d>4 OR jsonb_typeof(v) IS DISTINCT FROM 'object' THEN RAISE EXCEPTION 'm04 invalid expression' USING ERRCODE='P7601'; END IF;
  WITH RECURSIVE tree(x,level) AS (SELECT v,1 UNION ALL SELECT e.value,t.level+1 FROM tree t
    CROSS JOIN LATERAL jsonb_array_elements(CASE WHEN t.x->>'op' IN ('all','any') AND jsonb_typeof(t.x->'operands')='array' THEN t.x->'operands'
      WHEN t.x->>'op'='not' THEN jsonb_build_array(t.x->'operand') ELSE '[]'::jsonb END) e WHERE t.level<=4)
    SELECT count(*) INTO count_ops FROM tree;
  IF count_ops>16 THEN RAISE EXCEPTION 'm04 expression bound' USING ERRCODE='P7601'; END IF;
  IF op='atomic' THEN
    IF official_v3_jobs_private.exact_keys_v1(v,CASE WHEN v?'supportVersionIds' THEN ARRAY['op','predicate','supportVersionIds'] ELSE ARRAY['op','predicate'] END) IS NOT TRUE THEN RAISE EXCEPTION 'm04 invalid expression' USING ERRCODE='P7601'; END IF;
    n:=jsonb_build_object('op','atomic','predicate',official_v3_jobs_private.predicate_v1(v->'predicate'));
    IF v?'supportVersionIds' THEN
      IF jsonb_typeof(v->'supportVersionIds') IS DISTINCT FROM 'array' OR jsonb_array_length(v->'supportVersionIds')>8 THEN RAISE EXCEPTION 'm04 invalid support' USING ERRCODE='P7601'; END IF;
      FOR e IN SELECT value FROM jsonb_array_elements(v->'supportVersionIds') LOOP
        IF jsonb_typeof(e) IS DISTINCT FROM 'string' OR e#>>'{}' !~ '^ev2_[a-f0-9]{32}$' THEN RAISE EXCEPTION 'm04 invalid support' USING ERRCODE='P7601'; END IF;
      END LOOP;
      SELECT COALESCE(jsonb_agg(x ORDER BY x COLLATE "C"),'[]') INTO ids FROM (SELECT DISTINCT value AS x FROM jsonb_array_elements_text(v->'supportVersionIds')) q;
      IF NOT strip_support AND jsonb_array_length(ids)>0 THEN n:=n||jsonb_build_object('supportVersionIds',ids); END IF;
    END IF;
    RETURN n;
  ELSIF op='not' THEN
    IF official_v3_jobs_private.exact_keys_v1(v,ARRAY['op','operand']) IS NOT TRUE THEN RAISE EXCEPTION 'm04 invalid expression' USING ERRCODE='P7601'; END IF;
    n:=official_v3_jobs_private.expression_v1(v->'operand',strip_support,d+1);
    RETURN CASE WHEN n->>'op'='not' THEN n->'operand' ELSE jsonb_build_object('op','not','operand',n) END;
  ELSIF op IN ('all','any') THEN
    IF official_v3_jobs_private.exact_keys_v1(v,ARRAY['op','operands']) IS NOT TRUE OR jsonb_typeof(v->'operands') IS DISTINCT FROM 'array'
      OR jsonb_array_length(v->'operands') NOT BETWEEN 1 AND 8 THEN RAISE EXCEPTION 'm04 invalid expression' USING ERRCODE='P7601'; END IF;
    FOR e IN SELECT value FROM jsonb_array_elements(v->'operands') LOOP
      n:=official_v3_jobs_private.expression_v1(e,strip_support,d+1);
      a:=a||CASE WHEN n->>'op'=op THEN n->'operands' ELSE jsonb_build_array(n) END;
    END LOOP;
    SELECT jsonb_agg(x ORDER BY official_v3_jobs_private.canonical_v1(x,0) COLLATE "C") INTO a FROM (SELECT DISTINCT value AS x FROM jsonb_array_elements(a)) q;
    IF jsonb_array_length(a)>8 THEN RAISE EXCEPTION 'm04 expression bound' USING ERRCODE='P7601'; END IF;
    RETURN CASE WHEN jsonb_array_length(a)=1 THEN a->0 ELSE jsonb_build_object('op',op,'operands',a) END;
  END IF;
  RAISE EXCEPTION 'm04 invalid expression' USING ERRCODE='P7601';
END $$;

CREATE FUNCTION official_v3_jobs_private.context_v1(v jsonb) RETURNS jsonb
LANGUAGE plpgsql IMMUTABLE PARALLEL UNSAFE SECURITY INVOKER CALLED ON NULL INPUT SET search_path=pg_catalog,pg_temp AS $$
DECLARE s jsonb:=v->'scope'; c jsonb:=v->'conditions'; o jsonb:=s->'credentialOption'; r jsonb:=s->'residence';
  a jsonb:=v->'application'; normal jsonb; semantic jsonb; countries text[]:=ARRAY['AD','AE','AF','AG','AI','AL','AM','AO','AQ','AR','AS','AT','AU','AW','AX','AZ','BA','BB','BD','BE','BF','BG','BH','BI','BJ','BL','BM','BN','BO','BQ','BR','BS','BT','BV','BW','BY','BZ','CA','CC','CD','CF','CG','CH','CI','CK','CL','CM','CN','CO','CR','CU','CV','CW','CX','CY','CZ','DE','DJ','DK','DM','DO','DZ','EC','EE','EG','EH','ER','ES','ET','FI','FJ','FK','FM','FO','FR','GA','GB','GD','GE','GF','GG','GH','GI','GL','GM','GN','GP','GQ','GR','GS','GT','GU','GW','GY','HK','HM','HN','HR','HT','HU','ID','IE','IL','IM','IN','IO','IQ','IR','IS','IT','JE','JM','JO','JP','KE','KG','KH','KI','KM','KN','KP','KR','KW','KY','KZ','LA','LB','LC','LI','LK','LR','LS','LT','LU','LV','LY','MA','MC','MD','ME','MF','MG','MH','MK','ML','MM','MN','MO','MP','MQ','MR','MS','MT','MU','MV','MW','MX','MY','MZ','NA','NC','NE','NF','NG','NI','NL','NO','NP','NR','NU','NZ','OM','PA','PE','PF','PG','PH','PK','PL','PM','PN','PR','PS','PT','PW','PY','QA','RE','RO','RS','RU','RW','SA','SB','SC','SD','SE','SG','SH','SI','SJ','SK','SL','SM','SN','SO','SR','SS','ST','SV','SX','SY','SZ','TC','TD','TF','TG','TH','TJ','TK','TL','TM','TN','TO','TR','TT','TV','TW','TZ','UA','UG','UM','US','UY','UZ','VA','VC','VE','VG','VI','VN','VU','WF','WS','YE','YT','ZA','ZM','ZW']; missing jsonb;
BEGIN
  IF official_v3_jobs_private.exact_keys_v1(v,CASE WHEN v?'contextRevision' THEN ARRAY['contextRevision','scope','route','conditions','application'] ELSE ARRAY['scope','route','conditions'] END) IS NOT TRUE
    OR official_v3_jobs_private.nodes_v1(v,0,16,8192)<0 OR octet_length(official_v3_jobs_private.canonical_v1(v,0))>65536
    OR official_v3_jobs_private.exact_keys_v1(s,ARRAY['destinationCountryCode','transitCountryCode','citizenship','credentialOption','residence','requirementType','validity']) IS NOT TRUE
    OR (s->>'destinationCountryCode'=ANY(countries)) IS NOT TRUE
    OR (s->'transitCountryCode'<>'null'::jsonb AND (s->>'transitCountryCode'=ANY(countries)) IS NOT TRUE)
    OR official_v3_jobs_private.exact_keys_v1(s->'citizenship',ARRAY['mode','countryCodes']) IS NOT TRUE
    OR s#>>'{citizenship,mode}' IS DISTINCT FROM 'required' OR jsonb_typeof(s#>'{citizenship,countryCodes}') IS DISTINCT FROM 'array'
    OR jsonb_array_length(s#>'{citizenship,countryCodes}')<>1 OR (s#>>'{citizenship,countryCodes,0}'=ANY(countries)) IS NOT TRUE
    OR s->'validity'<>'{"mode":"not_applicable"}'::jsonb
    OR (s->>'requirementType' IN ('visa','electronic_travel_authorization','passport','identity_document','passport_validity','blank_passport_pages','transit','health','vaccination','health_document','entry_form','insurance','onward_or_return_ticket','booking_or_travel_document','financial_means','other_entry_requirement')) IS NOT TRUE
    OR (v->>'route' IN ('direct_entry','transit','unresolved')) IS NOT TRUE
    OR (v->>'route'='direct_entry' AND s->'transitCountryCode'<>'null'::jsonb)
    OR (v->>'route'='transit' AND s->'transitCountryCode'='null'::jsonb) THEN RAISE EXCEPTION 'm04 invalid context' USING ERRCODE='P7601'; END IF;
  IF o<>'{"mode":"not_applicable"}'::jsonb THEN
    IF official_v3_jobs_private.exact_keys_v1(o,ARRAY['mode','documentType','issuingCountryCode','relatedCitizenshipCountryCode']) IS NOT TRUE
      OR o->>'mode' IS DISTINCT FROM 'option' OR (o->>'documentType' IN ('passport','national_id','unknown')) IS NOT TRUE
      OR (o->>'issuingCountryCode'=ANY(countries)) IS NOT TRUE
      OR (o->'relatedCitizenshipCountryCode'<>'null'::jsonb AND o->'relatedCitizenshipCountryCode'<>s#>'{citizenship,countryCodes,0}') THEN
      RAISE EXCEPTION 'm04 invalid credential' USING ERRCODE='P7601'; END IF;
  END IF;
  IF r<>'{"mode":"not_applicable"}'::jsonb AND (official_v3_jobs_private.exact_keys_v1(r,ARRAY['mode','countryCode']) IS NOT TRUE
    OR r->>'mode' IS DISTINCT FROM 'required' OR (r->>'countryCode'=ANY(countries)) IS NOT TRUE) THEN RAISE EXCEPTION 'm04 invalid residence' USING ERRCODE='P7601'; END IF;
  IF c->>'status'='specified' THEN
    IF official_v3_jobs_private.exact_keys_v1(c,ARRAY['status','expression']) IS NOT TRUE THEN RAISE EXCEPTION 'm04 invalid conditions' USING ERRCODE='P7601'; END IF;
    normal:=official_v3_jobs_private.expression_v1(c->'expression',false,1);
    IF normal<>c->'expression' THEN RAISE EXCEPTION 'm04 nonnormal context' USING ERRCODE='P7601'; END IF;
    c:=jsonb_build_object('status','specified','expression','rule-applicability-structure:v2:'||official_v3_jobs_private.canonical_v1(official_v3_jobs_private.expression_v1(normal,true,1),0));
  ELSIF c->>'status'='unresolved' THEN
    IF official_v3_jobs_private.exact_keys_v1(c,ARRAY['status','missing']) IS NOT TRUE OR jsonb_typeof(c->'missing') IS DISTINCT FROM 'array'
      OR jsonb_array_length(c->'missing') NOT BETWEEN 1 AND 5 THEN RAISE EXCEPTION 'm04 invalid conditions' USING ERRCODE='P7601'; END IF;
    IF EXISTS(SELECT 1 FROM jsonb_array_elements(c->'missing') x WHERE jsonb_typeof(x) IS DISTINCT FROM 'string'
      OR (x#>>'{}' IN ('document_class','travel_purpose','planned_stay_duration','transit','other_rule_conditions')) IS NOT TRUE) THEN RAISE EXCEPTION 'm04 invalid conditions' USING ERRCODE='P7601'; END IF;
    SELECT jsonb_agg(x ORDER BY x COLLATE "C") INTO missing FROM (SELECT DISTINCT value x FROM jsonb_array_elements_text(c->'missing')) q;
    IF missing<>c->'missing' THEN RAISE EXCEPTION 'm04 nonnormal conditions' USING ERRCODE='P7601'; END IF;
  ELSIF c<>'{"status":"unconditional"}'::jsonb THEN RAISE EXCEPTION 'm04 invalid conditions' USING ERRCODE='P7601'; END IF;
  semantic:=jsonb_build_object('scope',s,'route',v->'route','conditions',c);
  IF v?'contextRevision' THEN
    IF v->'contextRevision'<>'2'::jsonb OR official_v3_jobs_private.exact_keys_v1(a,ARRAY['purpose','tripStartAndEndWindow']) IS NOT TRUE
      OR a->>'purpose' IS DISTINCT FROM 'tourism' OR official_v3_jobs_private.exact_keys_v1(a->'tripStartAndEndWindow',ARRAY['from','through']) IS NOT TRUE
      OR official_v3_jobs_private.civil_date_v1(a#>>'{tripStartAndEndWindow,from}') IS NOT TRUE
      OR official_v3_jobs_private.civil_date_v1(a#>>'{tripStartAndEndWindow,through}') IS NOT TRUE
      OR a#>>'{tripStartAndEndWindow,from}'>a#>>'{tripStartAndEndWindow,through}' THEN RAISE EXCEPTION 'm04 invalid application' USING ERRCODE='P7601'; END IF;
    semantic:=semantic||jsonb_build_object('contextRevision',2,'application',a);
  END IF;
  RETURN semantic;
END $$;
CREATE FUNCTION official_v3_jobs_private.subject_v1(kind text,v jsonb) RETURNS jsonb
LANGUAGE plpgsql IMMUTABLE PARALLEL UNSAFE SECURITY INVOKER CALLED ON NULL INPUT SET search_path=pg_catalog,pg_temp AS $$
DECLARE m jsonb:=v->'method'; context jsonb; s jsonb; o jsonb; r jsonb; preimage jsonb; ck text; jk text; sk text; rk text; legacy text; research jsonb; pair_text text; countries text[]:=ARRAY['AD','AE','AF','AG','AI','AL','AM','AO','AQ','AR','AS','AT','AU','AW','AX','AZ','BA','BB','BD','BE','BF','BG','BH','BI','BJ','BL','BM','BN','BO','BQ','BR','BS','BT','BV','BW','BY','BZ','CA','CC','CD','CF','CG','CH','CI','CK','CL','CM','CN','CO','CR','CU','CV','CW','CX','CY','CZ','DE','DJ','DK','DM','DO','DZ','EC','EE','EG','EH','ER','ES','ET','FI','FJ','FK','FM','FO','FR','GA','GB','GD','GE','GF','GG','GH','GI','GL','GM','GN','GP','GQ','GR','GS','GT','GU','GW','GY','HK','HM','HN','HR','HT','HU','ID','IE','IL','IM','IN','IO','IQ','IR','IS','IT','JE','JM','JO','JP','KE','KG','KH','KI','KM','KN','KP','KR','KW','KY','KZ','LA','LB','LC','LI','LK','LR','LS','LT','LU','LV','LY','MA','MC','MD','ME','MF','MG','MH','MK','ML','MM','MN','MO','MP','MQ','MR','MS','MT','MU','MV','MW','MX','MY','MZ','NA','NC','NE','NF','NG','NI','NL','NO','NP','NR','NU','NZ','OM','PA','PE','PF','PG','PH','PK','PL','PM','PN','PR','PS','PT','PW','PY','QA','RE','RO','RS','RU','RW','SA','SB','SC','SD','SE','SG','SH','SI','SJ','SK','SL','SM','SN','SO','SR','SS','ST','SV','SX','SY','SZ','TC','TD','TF','TG','TH','TJ','TK','TL','TM','TN','TO','TR','TT','TV','TW','TZ','UA','UG','UM','US','UY','UZ','VA','VC','VE','VG','VI','VN','VU','WF','WS','YE','YT','ZA','ZM','ZW'];
BEGIN
  IF official_v3_jobs_private.exact_keys_v1(m,ARRAY['methodId','revision']) IS NOT TRUE OR jsonb_typeof(m->'methodId') IS DISTINCT FROM 'string' OR (m->>'methodId' ~ '^[a-z][a-z0-9_-]{1,63}$') IS NOT TRUE
    OR jsonb_typeof(m->'revision') IS DISTINCT FROM 'number' OR m->>'revision' !~ '^[1-9][0-9]{0,9}$' OR (m->>'revision')::numeric>2147483647 THEN RAISE EXCEPTION 'm04 invalid method' USING ERRCODE='P7601'; END IF;
  IF kind='combination_discovery' THEN
    IF official_v3_jobs_private.exact_keys_v1(v,ARRAY['destinationCountryCode','citizenshipCountryCode','method']) IS NOT TRUE
      OR (v->>'destinationCountryCode'=ANY(countries)) IS NOT TRUE OR (v->>'citizenshipCountryCode'=ANY(countries)) IS NOT TRUE THEN RAISE EXCEPTION 'm04 invalid pair' USING ERRCODE='P7601'; END IF;
    pair_text:=official_v3_jobs_private.canonical_v1(v,0);
    jk:='combination-discovery-job:v3:'||encode(sha256(convert_to(pair_text,'UTF8')),'hex');
    RETURN jsonb_build_object('kind',kind,'jobKey',jk,'subjectText',(CASE WHEN jsonb_typeof(v->'citizenshipCountryCode')='string' AND jsonb_typeof(v->'destinationCountryCode')='string'
      THEN overlay(pair_text placing ',"kind":'||official_v3_jobs_private.canonical_v1(to_jsonb(kind),1) from strpos(pair_text COLLATE "C",',"method":') for 0)
      ELSE official_v3_jobs_private.canonical_v1(v||jsonb_build_object('kind',kind),0) END),'contextKey',NULL);
  END IF;
  IF kind IS DISTINCT FROM 'rule_research' OR official_v3_jobs_private.exact_keys_v1(v,ARRAY['context','method','factKind','researchReason']) IS NOT TRUE
    OR (v->>'factKind' IN ('passport_validity','blank_passport_pages','requirement_effect','visa_options','stay_limit','transit_conditions','official_actions','temporal_rule')) IS NOT TRUE THEN RAISE EXCEPTION 'm04 invalid subject' USING ERRCODE='P7601'; END IF;
  r:=v->'researchReason';
  IF r<>'{"status":"missing"}'::jsonb AND (official_v3_jobs_private.exact_keys_v1(r,ARRAY['status','reason']) IS NOT TRUE
    OR r->>'status' IS DISTINCT FROM 'recheck_needed' OR (r->>'reason' IN ('valid_from_in_future','valid_until_elapsed','max_age_exceeded')) IS NOT TRUE) THEN RAISE EXCEPTION 'm04 invalid reason' USING ERRCODE='P7601'; END IF;
  context:=official_v3_jobs_private.context_v1(v->'context'); s:=context->'scope'; o:=s->'credentialOption';
  ck:='official-truth-context:v3:'||encode(sha256(convert_to(official_v3_jobs_private.canonical_v1(context,0),'UTF8')),'hex');
  -- Legacy insertion order is deliberately distinct from canonical_v1 object order.
  legacy:='{"v":1,"destinationCountryCode":'||(s->'destinationCountryCode')::text||',"transitCountryCode":'||(s->'transitCountryCode')::text
    ||',"citizenshipMode":"required","citizenshipCountryCodes":'||official_v3_jobs_private.canonical_v1(s#>'{citizenship,countryCodes}',0)
    ||',"credentialOptionMode":'||(o->'mode')::text||',"documentType":'||COALESCE((o->'documentType')::text,'null')
    ||',"issuingCountryCode":'||COALESCE((o->'issuingCountryCode')::text,'null')||',"relatedCitizenshipCountryCode":'||COALESCE((o->'relatedCitizenshipCountryCode')::text,'null')
    ||',"relation":'||to_jsonb(CASE WHEN o->>'mode'='not_applicable' THEN 'not_applicable' WHEN o->'relatedCitizenshipCountryCode'='null'::jsonb THEN 'unlinked' ELSE 'explicit' END)::text
    ||',"residenceMode":'||(s#>'{residence,mode}')::text||',"residenceCountryCode":'||COALESCE((s#>'{residence,countryCode}')::text,'null')
    ||',"requirementType":'||(s->'requirementType')::text||',"validityMode":"not_applicable","travelDate":null}';
  sk:='rule-scope:v1:'||encode(sha256(convert_to(legacy,'UTF8')),'hex');
  rk:='research-request:v1:'||encode(sha256(convert_to('{"v":1,"ruleScopeKey":'||to_jsonb(sk)::text||',"factKind":'||(v->'factKind')::text
    ||',"status":'||(r->'status')::text||',"recheckReason":'||COALESCE((r->'reason')::text,'null')||'}','UTF8')),'hex');
  research:=jsonb_build_object('key',rk,'ruleScopeKey',sk,'factKind',v->'factKind','researchReason',r);
  jk:='research-job:v3:'||encode(sha256(convert_to(official_v3_jobs_private.canonical_v1(jsonb_build_object('contextKey',ck,'method',m,'factKind',v->'factKind'),0),'UTF8')),'hex');
  preimage:=jsonb_build_object('kind',kind,'context',context,'method',m,'factKind',v->'factKind');
  RETURN jsonb_build_object('kind',kind,'jobKey',jk,'subjectText',official_v3_jobs_private.canonical_v1(preimage,0),'contextKey',ck,'research',research);
END $$;
CREATE FUNCTION official_v3_jobs_private.job_v1(v jsonb) RETURNS jsonb
LANGUAGE plpgsql IMMUTABLE PARALLEL UNSAFE SECURITY INVOKER CALLED ON NULL INPUT SET search_path=pg_catalog,pg_temp AS $$
DECLARE common text[]:=ARRAY['schema','kind','jobId','operationId','revision','predecessorRevision','state','createdAt','updatedAt','attempt','attemptLimit','lease','nextAttemptAt','lastFailure'];
  i jsonb; result_ref jsonb; l jsonb:=v->'lease'; state text:=v->>'state'; created timestamptz; updated timestamptz;
  attempt integer; lim integer; revision integer;
BEGIN
  IF v IS NULL OR official_v3_jobs_private.nodes_v1(v,0,16,8192)<0 OR octet_length(official_v3_jobs_private.canonical_v1(v,0))>65536 THEN RAISE EXCEPTION 'm04 invalid job' USING ERRCODE='P7601'; END IF;
  IF v->>'kind'='research_job_record' THEN
    IF official_v3_jobs_private.exact_keys_v1(v,common||ARRAY['jobKey','context','contextKey','research','method','resultDecisionRef']) IS NOT TRUE THEN RAISE EXCEPTION 'm04 invalid job' USING ERRCODE='P7601'; END IF;
    i:=official_v3_jobs_private.subject_v1('rule_research',jsonb_build_object('context',v->'context','method',v->'method','factKind',v#>'{research,factKind}','researchReason',v#>'{research,researchReason}'));
    IF i->'jobKey' IS DISTINCT FROM v->'jobKey' OR i->'contextKey' IS DISTINCT FROM v->'contextKey' OR i->'research' IS DISTINCT FROM v->'research' THEN RAISE EXCEPTION 'm04 invalid job identity' USING ERRCODE='P7601'; END IF;
    result_ref:=v->'resultDecisionRef';
    IF result_ref<>'null'::jsonb AND (result_ref#>>'{}' ~ '^source-decision:v3:[a-f0-9]{64}$') IS NOT TRUE THEN RAISE EXCEPTION 'm04 invalid result' USING ERRCODE='P7601'; END IF;
  ELSIF v->>'kind'='combination_discovery_job_record' THEN
    IF official_v3_jobs_private.exact_keys_v1(v,common||ARRAY['identity','resultDiscoveryRef']) IS NOT TRUE
      OR official_v3_jobs_private.exact_keys_v1(v->'identity',ARRAY['kind','destinationCountryCode','citizenshipCountryCode','method','jobKey']) IS NOT TRUE
      OR v#>>'{identity,kind}' IS DISTINCT FROM 'combination_discovery' THEN RAISE EXCEPTION 'm04 invalid job' USING ERRCODE='P7601'; END IF;
    i:=official_v3_jobs_private.subject_v1('combination_discovery',(v->'identity')-'kind'-'jobKey');
    IF i->'jobKey' IS DISTINCT FROM v#>'{identity,jobKey}' THEN RAISE EXCEPTION 'm04 invalid job identity' USING ERRCODE='P7601'; END IF;
    result_ref:=v->'resultDiscoveryRef';
    IF result_ref<>'null'::jsonb AND (result_ref#>>'{}' ~ '^combination-discovery-result:v3:[a-f0-9]{64}$') IS NOT TRUE THEN RAISE EXCEPTION 'm04 invalid result' USING ERRCODE='P7601'; END IF;
  ELSE RAISE EXCEPTION 'm04 invalid job' USING ERRCODE='P7601'; END IF;
  IF v->'schema' IS DISTINCT FROM '3'::jsonb OR (v->>'jobId' ~ '^job3_[a-f0-9]{32}$') IS NOT TRUE
    OR (v->>'operationId' ~ '^op3_[a-f0-9]{32}$') IS NOT TRUE OR jsonb_typeof(v->'revision') IS DISTINCT FROM 'number'
    OR (v->>'revision' ~ '^[1-9][0-9]{0,9}$') IS NOT TRUE OR (v->>'revision')::numeric>2147483647
    OR jsonb_typeof(v->'attempt') IS DISTINCT FROM 'number' OR (v->>'attempt' ~ '^(0|[1-9][0-9]?)$') IS NOT TRUE
    OR jsonb_typeof(v->'attemptLimit') IS DISTINCT FROM 'number' OR (v->>'attemptLimit' ~ '^[1-9][0-9]?$') IS NOT TRUE
    OR (state IN ('queued','leased','backoff','succeeded','exhausted')) IS NOT TRUE THEN RAISE EXCEPTION 'm04 invalid job lifecycle' USING ERRCODE='P7601'; END IF;
  revision:=(v->>'revision')::integer; attempt:=(v->>'attempt')::integer; lim:=(v->>'attemptLimit')::integer;
  IF lim NOT BETWEEN 1 AND 16 OR attempt NOT BETWEEN 0 AND lim
    OR (v->'predecessorRevision'='null'::jsonb AND revision<>1)
    OR (v->'predecessorRevision'<>'null'::jsonb AND (v->'predecessorRevision' IS DISTINCT FROM to_jsonb(revision-1) OR revision<=1)) THEN RAISE EXCEPTION 'm04 invalid job lifecycle' USING ERRCODE='P7601'; END IF;
  created:=official_v3_jobs_private.timestamp_v1(v->>'createdAt'); updated:=(CASE WHEN (v->>'updatedAt') COLLATE "C" = (v->>'createdAt') COLLATE "C" THEN created ELSE official_v3_jobs_private.timestamp_v1(v->>'updatedAt') END);
  IF created>updated OR (v->'lastFailure'<>'null'::jsonb AND (v->>'lastFailure' IN ('unreachable','invalid_proposal','verification_unavailable','commit_unconfirmed')) IS NOT TRUE) THEN RAISE EXCEPTION 'm04 invalid job lifecycle' USING ERRCODE='P7601'; END IF;
  IF state='leased' THEN
    IF official_v3_jobs_private.exact_keys_v1(l,ARRAY['leaseId','generation','acquiredAt','expiresAt']) IS NOT TRUE
      OR (l->>'leaseId' ~ '^lease3_[a-f0-9]{32}$') IS NOT TRUE OR jsonb_typeof(l->'generation') IS DISTINCT FROM 'number'
      OR (l->>'generation' ~ '^[1-9][0-9]{0,9}$') IS NOT TRUE OR (l->>'generation')::numeric NOT BETWEEN 1 AND revision OR attempt<1
      OR (CASE WHEN (l->>'acquiredAt') COLLATE "C" = (v->>'updatedAt') COLLATE "C" THEN updated ELSE official_v3_jobs_private.timestamp_v1(l->>'acquiredAt') END) NOT BETWEEN created AND updated
      OR official_v3_jobs_private.timestamp_v1(l->>'expiresAt')<=updated
      OR official_v3_jobs_private.timestamp_v1(l->>'expiresAt')>(CASE WHEN (l->>'acquiredAt') COLLATE "C" = (v->>'updatedAt') COLLATE "C" THEN updated ELSE official_v3_jobs_private.timestamp_v1(l->>'acquiredAt') END)+interval '900 seconds' THEN RAISE EXCEPTION 'm04 invalid lease' USING ERRCODE='P7601'; END IF;
  ELSIF l<>'null'::jsonb THEN RAISE EXCEPTION 'm04 invalid lease' USING ERRCODE='P7601'; END IF;
  IF state='backoff' THEN
    IF official_v3_jobs_private.timestamp_v1(v->>'nextAttemptAt')<=updated OR v->'lastFailure'='null'::jsonb OR attempt<1 OR attempt>=lim THEN RAISE EXCEPTION 'm04 invalid backoff' USING ERRCODE='P7601'; END IF;
  ELSIF v->'nextAttemptAt'<>'null'::jsonb THEN RAISE EXCEPTION 'm04 invalid backoff' USING ERRCODE='P7601'; END IF;
  IF (state='queued' AND (attempt<>0 OR v->'lastFailure'<>'null'::jsonb))
    OR (state='succeeded' AND (result_ref='null'::jsonb OR attempt<1)) OR (state<>'succeeded' AND result_ref<>'null'::jsonb)
    OR (state='exhausted' AND (attempt<>lim OR v->'lastFailure'='null'::jsonb)) THEN RAISE EXCEPTION 'm04 invalid job state' USING ERRCODE='P7601'; END IF;
  RETURN v;
END $$;
CREATE FUNCTION official_v3_jobs_private.command_v1(v jsonb) RETURNS jsonb
LANGUAGE plpgsql IMMUTABLE PARALLEL UNSAFE SECURITY INVOKER CALLED ON NULL INPUT SET search_path=pg_catalog,pg_temp AS $$
DECLARE a text:=v->>'action'; k text:=v->>'kind'; i jsonb:=v->'input'; identity jsonb; jkey text; f jsonb; t text;
BEGIN
  IF v IS NULL THEN RAISE EXCEPTION 'm04 invalid command' USING ERRCODE='P7601'; END IF;
  t:=official_v3_jobs_private.canonical_v1(v,0);
  IF octet_length(t)>65536
    OR official_v3_jobs_private.exact_keys_v1(v,CASE WHEN a IN ('enqueue','complete') THEN ARRAY['action','kind','input'] ELSE ARRAY['action','input'] END) IS NOT TRUE
    OR (a IN ('enqueue','claim','complete','fail')) IS NOT TRUE OR (i->>'operationId' ~ '^op3_[a-f0-9]{32}$') IS NOT TRUE THEN RAISE EXCEPTION 'm04 invalid command' USING ERRCODE='P7601'; END IF;
  IF a='enqueue' THEN
    IF k='rule_research' THEN
      IF official_v3_jobs_private.exact_keys_v1(i,ARRAY['context','method','factKind','researchReason','operationId','jobId','attemptLimit']) IS NOT TRUE THEN RAISE EXCEPTION 'm04 invalid enqueue' USING ERRCODE='P7601'; END IF;
    ELSIF k='combination_discovery' THEN
      IF official_v3_jobs_private.exact_keys_v1(i,ARRAY['destinationCountryCode','citizenshipCountryCode','method','operationId','jobId','attemptLimit']) IS NOT TRUE THEN RAISE EXCEPTION 'm04 invalid enqueue' USING ERRCODE='P7601'; END IF;
    ELSE RAISE EXCEPTION 'm04 invalid enqueue' USING ERRCODE='P7601'; END IF;
    IF (i->>'jobId' ~ '^job3_[a-f0-9]{32}$') IS NOT TRUE OR jsonb_typeof(i->'attemptLimit') IS DISTINCT FROM 'number'
      OR (i->>'attemptLimit' ~ '^[1-9][0-9]?$') IS NOT TRUE OR (i->>'attemptLimit')::integer NOT BETWEEN 1 AND 16 THEN RAISE EXCEPTION 'm04 invalid enqueue' USING ERRCODE='P7601'; END IF;
    identity:=official_v3_jobs_private.subject_v1(k,i-'operationId'-'jobId'-'attemptLimit'); jkey:=identity->>'jobKey';
  ELSE
    jkey:=i->>'jobKey';
    IF (jkey ~ '^(research-job|combination-discovery-job):v3:[a-f0-9]{64}$') IS NOT TRUE THEN RAISE EXCEPTION 'm04 invalid locator' USING ERRCODE='P7601'; END IF;
    IF a='claim' THEN
      IF official_v3_jobs_private.exact_keys_v1(i,ARRAY['operationId','jobKey','leaseId','leaseMilliseconds']) IS NOT TRUE
        OR (i->>'leaseId' ~ '^lease3_[a-f0-9]{32}$') IS NOT TRUE OR jsonb_typeof(i->'leaseMilliseconds') IS DISTINCT FROM 'number'
        OR (i->>'leaseMilliseconds' ~ '^[1-9][0-9]{0,5}$') IS NOT TRUE OR (i->>'leaseMilliseconds')::integer>900000 THEN RAISE EXCEPTION 'm04 invalid claim' USING ERRCODE='P7601'; END IF;
    ELSE
      f:=i->'fence';
      IF official_v3_jobs_private.exact_keys_v1(f,ARRAY['jobId','revision','leaseId','generation']) IS NOT TRUE
        OR (f->>'jobId' ~ '^job3_[a-f0-9]{32}$') IS NOT TRUE OR (f->>'leaseId' ~ '^lease3_[a-f0-9]{32}$') IS NOT TRUE
        OR jsonb_typeof(f->'revision') IS DISTINCT FROM 'number' OR (f->>'revision' ~ '^[1-9][0-9]{0,9}$') IS NOT TRUE OR (f->>'revision')::numeric>2147483647
        OR jsonb_typeof(f->'generation') IS DISTINCT FROM 'number' OR (f->>'generation' ~ '^[1-9][0-9]{0,9}$') IS NOT TRUE OR (f->>'generation')::numeric>2147483647 THEN RAISE EXCEPTION 'm04 invalid fence' USING ERRCODE='P7601'; END IF;
      IF a='complete' THEN
        IF (k IN ('rule_research','combination_discovery')) IS NOT TRUE OR (k='rule_research')<>(jkey LIKE 'research-job:%')
          OR official_v3_jobs_private.exact_keys_v1(i,CASE WHEN k='rule_research' THEN ARRAY['operationId','jobKey','fence','decisionRef'] ELSE ARRAY['operationId','jobKey','fence','discoveryRef'] END) IS NOT TRUE
          OR (COALESCE(i->>'decisionRef',i->>'discoveryRef') ~ CASE WHEN k='rule_research' THEN '^source-decision:v3:[a-f0-9]{64}$' ELSE '^combination-discovery-result:v3:[a-f0-9]{64}$' END) IS NOT TRUE THEN RAISE EXCEPTION 'm04 invalid completion' USING ERRCODE='P7601'; END IF;
      ELSE
        IF official_v3_jobs_private.exact_keys_v1(i,ARRAY['operationId','jobKey','fence','reason']) IS NOT TRUE
          OR (i->>'reason' IN ('unreachable','invalid_proposal','verification_unavailable','commit_unconfirmed')) IS NOT TRUE THEN RAISE EXCEPTION 'm04 invalid failure' USING ERRCODE='P7601'; END IF;
      END IF;
    END IF;
    k:=CASE WHEN jkey LIKE 'research-job:%' THEN 'rule_research' ELSE 'combination_discovery' END;
  END IF;
  RETURN jsonb_build_object('value',v,'commandText',t,'commandKey','queue-command:v3:'||encode(sha256(convert_to(t,'UTF8')),'hex'),
    'operationId',i->'operationId','jobKey',jkey,'subjectText',identity->'subjectText','action',a,'kind',k);
END $$;
CREATE FUNCTION official_v3_jobs_private.reference_v1(v jsonb) RETURNS jsonb
LANGUAGE plpgsql IMMUTABLE PARALLEL UNSAFE SECURITY INVOKER CALLED ON NULL INPUT SET search_path=pg_catalog,pg_temp AS $$
DECLARE b jsonb:=v->'binding'; m jsonb:=b->'method';
BEGIN
  IF official_v3_jobs_private.exact_keys_v1(v,ARRAY['binding','proposalDigest','bytes']) IS NOT TRUE
    OR official_v3_jobs_private.exact_keys_v1(b,ARRAY['schema','kind','operationId','jobId','contextKey','method','runnerId','deliveryId','inputRevision']) IS NOT TRUE
    OR b->'schema' IS DISTINCT FROM '3'::jsonb OR b->>'kind' IS DISTINCT FROM 'proposal_intake_binding'
    OR (b->>'operationId' ~ '^op3_[a-f0-9]{32}$') IS NOT TRUE OR (b->>'jobId' ~ '^job3_[a-f0-9]{32}$') IS NOT TRUE
    OR (b->>'contextKey' ~ '^official-truth-context:v3:[a-f0-9]{64}$') IS NOT TRUE
    OR (b->>'runnerId' ~ '^runner3_[a-f0-9]{32}$') IS NOT TRUE OR (b->>'deliveryId' ~ '^delivery3_[a-f0-9]{32}$') IS NOT TRUE
    OR (b->>'inputRevision' ~ '^(git:[a-f0-9]{40}|snapshot:[a-f0-9]{64})$') IS NOT TRUE
    OR official_v3_jobs_private.exact_keys_v1(m,ARRAY['methodId','revision']) IS NOT TRUE OR jsonb_typeof(m->'methodId') IS DISTINCT FROM 'string' OR (m->>'methodId' ~ '^[a-z][a-z0-9_-]{1,63}$') IS NOT TRUE
    OR jsonb_typeof(m->'revision') IS DISTINCT FROM 'number' OR (m->>'revision' ~ '^[1-9][0-9]{0,9}$') IS NOT TRUE OR (m->>'revision')::numeric>2147483647
    OR (v->>'proposalDigest' ~ '^[a-f0-9]{64}$') IS NOT TRUE OR jsonb_typeof(v->'bytes') IS DISTINCT FROM 'number'
    OR (v->>'bytes' ~ '^[1-9][0-9]{0,4}$') IS NOT TRUE OR (v->>'bytes')::integer>65536 THEN RAISE EXCEPTION 'm04 invalid reference' USING ERRCODE='P7601'; END IF;
  RETURN v;
END $$;
CREATE FUNCTION official_v3_jobs_private.transition_v1(command jsonb,current_record jsonb,commit jsonb) RETURNS void
LANGUAGE plpgsql IMMUTABLE PARALLEL UNSAFE SECURITY INVOKER CALLED ON NULL INPUT SET search_path=pg_catalog,pg_temp AS $$
DECLARE c jsonb:=official_v3_jobs_private.command_v1(command); i jsonb:=command->'input'; expected jsonb; n jsonb; identity jsonb;
  a jsonb:=commit->'audit'; f jsonb:=i->'fence'; kind text; action text:=command->>'action'; at_time timestamptz; end_time timestamptz;
  observed text:=a->>'observedAt'; rev integer; delay_ms integer; result_key text;
BEGIN
  IF official_v3_jobs_private.exact_keys_v1(commit,ARRAY['operationId','commandKey','jobKey','expected','next','notAfter','audit']) IS NOT TRUE
    OR octet_length(official_v3_jobs_private.canonical_v1(commit,0))>196608
    OR official_v3_jobs_private.exact_keys_v1(a,ARRAY['reference','kind','observedAt','priorRevision','nextRevision']) IS NOT TRUE
    OR commit->'operationId' IS DISTINCT FROM c->'operationId' OR commit->'commandKey' IS DISTINCT FROM c->'commandKey'
    OR commit->'jobKey' IS DISTINCT FROM c->'jobKey' OR commit->'expected' IS DISTINCT FROM current_record THEN RAISE EXCEPTION 'm04 invalid transition' USING ERRCODE='P7601'; END IF;
  at_time:=official_v3_jobs_private.timestamp_v1(observed); end_time:=at_time+interval '5 seconds';
  IF current_record IS DISTINCT FROM 'null'::jsonb THEN
    expected:=official_v3_jobs_private.job_v1(current_record);
    IF COALESCE(expected->'jobKey',expected#>'{identity,jobKey}') IS DISTINCT FROM c->'jobKey' OR expected->>'updatedAt'>observed THEN RAISE EXCEPTION 'm04 invalid prior' USING ERRCODE='P7601'; END IF;
  END IF;
  rev:=COALESCE((expected->>'revision')::integer,0)+1;
  IF action='enqueue' THEN
    IF expected->>'state' IN ('queued','leased','backoff') THEN n:=expected; kind:='deduplicated';
    ELSE
      IF expected->'jobId'=i->'jobId' THEN RAISE EXCEPTION 'm04 repeated cycle' USING ERRCODE='P7601'; END IF;
      n:=jsonb_build_object('schema',3,'jobId',i->'jobId','operationId',i->'operationId','revision',rev,'predecessorRevision',expected->'revision',
        'state','queued','createdAt',observed,'updatedAt',observed,'attempt',0,'attemptLimit',i->'attemptLimit','lease',NULL,'nextAttemptAt',NULL,'lastFailure',NULL);
      identity:=official_v3_jobs_private.subject_v1(command->>'kind',i-'operationId'-'jobId'-'attemptLimit');
      IF command->>'kind'='rule_research' THEN n:=n||jsonb_build_object('kind','research_job_record','jobKey',identity->'jobKey',
        'context',i->'context','contextKey',identity->'contextKey','research',identity->'research','method',i->'method','resultDecisionRef',NULL);
      ELSE n:=n||jsonb_build_object('kind','combination_discovery_job_record','identity',(i-'operationId'-'jobId'-'attemptLimit')||jsonb_build_object('kind','combination_discovery','jobKey',identity->'jobKey'),'resultDiscoveryRef',NULL); END IF;
      kind:='enqueued';
    END IF;
  ELSIF action='claim' THEN
    IF expected IS NULL OR expected->>'state' NOT IN ('queued','leased','backoff')
      OR (expected->>'state'='backoff' AND expected->>'nextAttemptAt'>observed)
      OR (expected->>'state'='leased' AND expected#>>'{lease,expiresAt}'>observed) THEN RAISE EXCEPTION 'm04 not due' USING ERRCODE='P7601'; END IF;
    n:=expected||jsonb_build_object('revision',rev,'predecessorRevision',expected->'revision','updatedAt',observed,'nextAttemptAt',NULL);
    IF (expected->>'attempt')::integer>=(expected->>'attemptLimit')::integer THEN
      n:=n||jsonb_build_object('state','exhausted','lease',NULL,'lastFailure',COALESCE(NULLIF(expected->'lastFailure','null'::jsonb),'"verification_unavailable"'::jsonb)); kind:='exhausted';
    ELSE
      n:=n||jsonb_build_object('state','leased','attempt',(expected->>'attempt')::integer+1,'lease',jsonb_build_object('leaseId',i->'leaseId','generation',rev,
        'acquiredAt',observed,'expiresAt',to_char((at_time+(i->>'leaseMilliseconds')::integer*interval '1 millisecond') AT TIME ZONE 'UTC','YYYY-MM-DD"T"HH24:MI:SS.MS"Z"')));
      kind:=CASE WHEN expected->>'state'='leased' THEN 'reclaimed' ELSE 'leased' END;
    END IF;
  ELSE
    IF expected IS NULL OR expected->>'state'<>'leased' OR f IS DISTINCT FROM jsonb_build_object('jobId',expected->'jobId','revision',expected->'revision',
      'leaseId',expected#>'{lease,leaseId}','generation',expected#>'{lease,generation}') OR expected#>>'{lease,expiresAt}'<=observed THEN RAISE EXCEPTION 'm04 obsolete fence' USING ERRCODE='P7601'; END IF;
    end_time:=least(end_time,official_v3_jobs_private.timestamp_v1(expected#>>'{lease,expiresAt}'));
    n:=expected||jsonb_build_object('revision',rev,'predecessorRevision',expected->'revision','updatedAt',observed,'lease',NULL);
    IF action='complete' THEN
      result_key:=CASE WHEN expected->>'kind'='research_job_record' THEN 'resultDecisionRef' ELSE 'resultDiscoveryRef' END;
      n:=n||jsonb_build_object('state','succeeded','lastFailure',NULL,result_key,COALESCE(i->'decisionRef',i->'discoveryRef')); kind:='completed';
    ELSE
      IF (expected->>'attempt')::integer=(expected->>'attemptLimit')::integer THEN n:=n||jsonb_build_object('state','exhausted','nextAttemptAt',NULL); kind:='exhausted';
      ELSE
        delay_ms:=least(60000,1000*(2^((expected->>'attempt')::integer-1))::integer);
        n:=n||jsonb_build_object('state','backoff','nextAttemptAt',to_char((at_time+delay_ms*interval '1 millisecond') AT TIME ZONE 'UTC','YYYY-MM-DD"T"HH24:MI:SS.MS"Z"')); kind:='backoff';
      END IF;
      n:=n||jsonb_build_object('lastFailure',i->'reason');
    END IF;
  END IF;
  IF kind IS DISTINCT FROM 'deduplicated' THEN n:=official_v3_jobs_private.job_v1(n); END IF;
  IF commit->'next' IS DISTINCT FROM n OR official_v3_jobs_private.timestamp_v1(commit->>'notAfter')<>end_time
    OR a IS DISTINCT FROM jsonb_build_object('reference','queue-event:v3:'||encode(sha256(convert_to(official_v3_jobs_private.canonical_v1(jsonb_build_object('op',i->'operationId','command',c->'commandKey'),0),'UTF8')),'hex'),
      'kind',kind,'observedAt',observed,'priorRevision',expected->'revision','nextRevision',n->'revision') THEN RAISE EXCEPTION 'm04 transition mismatch' USING ERRCODE='P7601'; END IF;
END $$;

CREATE TABLE official_v3_jobs_private.slots_v1(slot_id integer PRIMARY KEY CHECK(slot_id BETWEEN 1 AND 1024),job_key text UNIQUE);
CREATE TABLE official_v3_jobs_private.subjects_v1(
  job_key text PRIMARY KEY CHECK(job_key ~ '^(research-job|combination-discovery-job):v3:[a-f0-9]{64}$'),
  slot_id integer NOT NULL UNIQUE REFERENCES official_v3_jobs_private.slots_v1(slot_id) ON DELETE RESTRICT ON UPDATE RESTRICT,
  kind text NOT NULL CHECK(kind IN ('rule_research','combination_discovery')),
  subject_text text NOT NULL CHECK(octet_length(subject_text) BETWEEN 1 AND 65536),
  method_binding jsonb NOT NULL,current_job jsonb NOT NULL,
  operation_count integer NOT NULL CHECK(operation_count BETWEEN 0 AND 256),start_count integer NOT NULL CHECK(start_count BETWEEN 0 AND 64),
  open_attempt text,terminal_credit_claim text,
  CHECK(operation_count+CASE WHEN terminal_credit_claim IS NULL THEN 0 ELSE 1 END<=256)
);
CREATE TABLE official_v3_jobs_private.queue_operations_v1(
  operation_id text PRIMARY KEY CHECK(operation_id ~ '^op3_[a-f0-9]{32}$'),
  job_key text NOT NULL REFERENCES official_v3_jobs_private.subjects_v1(job_key) ON DELETE RESTRICT ON UPDATE RESTRICT, action text NOT NULL CHECK(action IN ('enqueue','claim','complete','fail')),
  command_key text NOT NULL CHECK(command_key ~ '^queue-command:v3:[a-f0-9]{64}$'),
  command_text text NOT NULL CHECK(octet_length(command_text) BETWEEN 1 AND 65536),
  envelope_text text NOT NULL CHECK(octet_length(envelope_text) BETWEEN 1 AND 196608),
  audit_reference text NOT NULL UNIQUE CHECK(audit_reference ~ '^queue-event:v3:[a-f0-9]{64}$'),
  new_cycle_job_id text UNIQUE,authority jsonb NOT NULL,recorded_at timestamptz NOT NULL
);
CREATE INDEX queue_operations_subject_v1 ON official_v3_jobs_private.queue_operations_v1(job_key,operation_id);
CREATE TABLE official_v3_jobs_private.execution_starts_v1(
  attempt_key text PRIMARY KEY CHECK(attempt_key ~ '^execution-attempt:v3:[a-f0-9]{64}$'),
  job_key text NOT NULL REFERENCES official_v3_jobs_private.subjects_v1(job_key) ON DELETE RESTRICT ON UPDATE RESTRICT,
  claim_operation_id text NOT NULL UNIQUE REFERENCES official_v3_jobs_private.queue_operations_v1(operation_id) ON DELETE RESTRICT ON UPDATE RESTRICT,
  claim_text text NOT NULL CHECK(octet_length(claim_text) BETWEEN 1 AND 65536), leased_job jsonb NOT NULL,
  authority jsonb NOT NULL, token_hash text NOT NULL CHECK(token_hash ~ '^[a-f0-9]{64}$'),reserved_at timestamptz NOT NULL
);
CREATE INDEX execution_starts_subject_v1 ON official_v3_jobs_private.execution_starts_v1(job_key,attempt_key);
CREATE TABLE official_v3_jobs_private.execution_results_v1(
  attempt_key text PRIMARY KEY REFERENCES official_v3_jobs_private.execution_starts_v1(attempt_key) ON DELETE RESTRICT ON UPDATE RESTRICT,
  result jsonb NOT NULL CHECK(octet_length(result::text)<=65536), "references" jsonb NOT NULL CHECK(jsonb_array_length("references") BETWEEN 1 AND 16),
  prepared_at timestamptz NOT NULL
);
CREATE UNIQUE INDEX execution_results_reference_v1 ON official_v3_jobs_private.execution_results_v1((CASE result->>'kind' WHEN 'rule_research' THEN result->>'decisionRef' WHEN 'combination_discovery' THEN result->>'discoveryRef' ELSE NULL END));
CREATE TABLE official_v3_jobs_private.execution_dispositions_v1(
  attempt_key text PRIMARY KEY REFERENCES official_v3_jobs_private.execution_starts_v1(attempt_key) ON DELETE RESTRICT ON UPDATE RESTRICT,
  queue_operation_id text NOT NULL UNIQUE REFERENCES official_v3_jobs_private.queue_operations_v1(operation_id) ON DELETE RESTRICT ON UPDATE RESTRICT,
  kind text NOT NULL CHECK(kind IN ('completed','settled_failure')),failure_reason text,settled_at timestamptz NOT NULL,
  CHECK((kind='completed' AND failure_reason IS NULL) OR (kind='settled_failure' AND failure_reason IS NOT NULL AND failure_reason IN ('unreachable','invalid_proposal','verification_unavailable')))
);
CREATE TABLE official_v3_jobs_private.catalog_binding_v1(object_identity text PRIMARY KEY,fingerprint jsonb NOT NULL CHECK(octet_length(fingerprint::text)<=65536));
INSERT INTO official_v3_jobs_private.slots_v1(slot_id) SELECT generate_series(1,1024);

CREATE FUNCTION official_v3_jobs_private.immutable_v1() RETURNS trigger
LANGUAGE plpgsql VOLATILE PARALLEL UNSAFE SECURITY INVOKER CALLED ON NULL INPUT SET search_path=pg_catalog,pg_temp AS $$
BEGIN
  IF TG_OP='UPDATE' AND TG_TABLE_SCHEMA='official_v3_jobs_private' THEN
    IF TG_TABLE_NAME='subjects_v1' AND (to_jsonb(OLD)-'current_job'-'operation_count'-'start_count'-'open_attempt'-'terminal_credit_claim')
      =(to_jsonb(NEW)-'current_job'-'operation_count'-'start_count'-'open_attempt'-'terminal_credit_claim')
      AND (to_jsonb(NEW)->>'operation_count')::integer>=(to_jsonb(OLD)->>'operation_count')::integer AND (to_jsonb(NEW)->>'start_count')::integer>=(to_jsonb(OLD)->>'start_count')::integer THEN RETURN NEW;
    ELSIF TG_TABLE_NAME='slots_v1' AND to_jsonb(OLD)->'slot_id'=to_jsonb(NEW)->'slot_id' AND to_jsonb(OLD)->'job_key'='null'::jsonb AND to_jsonb(NEW)->'job_key'<>'null'::jsonb THEN RETURN NEW; END IF;
  END IF;
  RAISE EXCEPTION 'm04 immutable history' USING ERRCODE='P7602';
END $$;
ALTER TABLE official_v3_jobs_private.slots_v1 ENABLE ROW LEVEL SECURITY;
ALTER TABLE official_v3_jobs_private.slots_v1 FORCE ROW LEVEL SECURITY;
CREATE POLICY owner_v1 ON official_v3_jobs_private.slots_v1 TO ot_v3_jobs_owner USING(true) WITH CHECK(true);
CREATE TRIGGER guard_row_v1 BEFORE UPDATE OR DELETE ON official_v3_jobs_private.slots_v1 FOR EACH ROW EXECUTE FUNCTION official_v3_jobs_private.immutable_v1();
CREATE TRIGGER guard_truncate_v1 BEFORE TRUNCATE ON official_v3_jobs_private.slots_v1 FOR EACH STATEMENT EXECUTE FUNCTION official_v3_jobs_private.immutable_v1();
ALTER TABLE official_v3_jobs_private.subjects_v1 ENABLE ROW LEVEL SECURITY;
ALTER TABLE official_v3_jobs_private.subjects_v1 FORCE ROW LEVEL SECURITY;
CREATE POLICY owner_v1 ON official_v3_jobs_private.subjects_v1 TO ot_v3_jobs_owner USING(true) WITH CHECK(true);
CREATE TRIGGER guard_row_v1 BEFORE UPDATE OR DELETE ON official_v3_jobs_private.subjects_v1 FOR EACH ROW EXECUTE FUNCTION official_v3_jobs_private.immutable_v1();
CREATE TRIGGER guard_truncate_v1 BEFORE TRUNCATE ON official_v3_jobs_private.subjects_v1 FOR EACH STATEMENT EXECUTE FUNCTION official_v3_jobs_private.immutable_v1();
ALTER TABLE official_v3_jobs_private.queue_operations_v1 ENABLE ROW LEVEL SECURITY;
ALTER TABLE official_v3_jobs_private.queue_operations_v1 FORCE ROW LEVEL SECURITY;
CREATE POLICY owner_v1 ON official_v3_jobs_private.queue_operations_v1 TO ot_v3_jobs_owner USING(true) WITH CHECK(true);
CREATE TRIGGER guard_row_v1 BEFORE UPDATE OR DELETE ON official_v3_jobs_private.queue_operations_v1 FOR EACH ROW EXECUTE FUNCTION official_v3_jobs_private.immutable_v1();
CREATE TRIGGER guard_truncate_v1 BEFORE TRUNCATE ON official_v3_jobs_private.queue_operations_v1 FOR EACH STATEMENT EXECUTE FUNCTION official_v3_jobs_private.immutable_v1();
ALTER TABLE official_v3_jobs_private.execution_starts_v1 ENABLE ROW LEVEL SECURITY;
ALTER TABLE official_v3_jobs_private.execution_starts_v1 FORCE ROW LEVEL SECURITY;
CREATE POLICY owner_v1 ON official_v3_jobs_private.execution_starts_v1 TO ot_v3_jobs_owner USING(true) WITH CHECK(true);
CREATE TRIGGER guard_row_v1 BEFORE UPDATE OR DELETE ON official_v3_jobs_private.execution_starts_v1 FOR EACH ROW EXECUTE FUNCTION official_v3_jobs_private.immutable_v1();
CREATE TRIGGER guard_truncate_v1 BEFORE TRUNCATE ON official_v3_jobs_private.execution_starts_v1 FOR EACH STATEMENT EXECUTE FUNCTION official_v3_jobs_private.immutable_v1();
ALTER TABLE official_v3_jobs_private.execution_results_v1 ENABLE ROW LEVEL SECURITY;
ALTER TABLE official_v3_jobs_private.execution_results_v1 FORCE ROW LEVEL SECURITY;
CREATE POLICY owner_v1 ON official_v3_jobs_private.execution_results_v1 TO ot_v3_jobs_owner USING(true) WITH CHECK(true);
CREATE TRIGGER guard_row_v1 BEFORE UPDATE OR DELETE ON official_v3_jobs_private.execution_results_v1 FOR EACH ROW EXECUTE FUNCTION official_v3_jobs_private.immutable_v1();
CREATE TRIGGER guard_truncate_v1 BEFORE TRUNCATE ON official_v3_jobs_private.execution_results_v1 FOR EACH STATEMENT EXECUTE FUNCTION official_v3_jobs_private.immutable_v1();
ALTER TABLE official_v3_jobs_private.execution_dispositions_v1 ENABLE ROW LEVEL SECURITY;
ALTER TABLE official_v3_jobs_private.execution_dispositions_v1 FORCE ROW LEVEL SECURITY;
CREATE POLICY owner_v1 ON official_v3_jobs_private.execution_dispositions_v1 TO ot_v3_jobs_owner USING(true) WITH CHECK(true);
CREATE TRIGGER guard_row_v1 BEFORE UPDATE OR DELETE ON official_v3_jobs_private.execution_dispositions_v1 FOR EACH ROW EXECUTE FUNCTION official_v3_jobs_private.immutable_v1();
CREATE TRIGGER guard_truncate_v1 BEFORE TRUNCATE ON official_v3_jobs_private.execution_dispositions_v1 FOR EACH STATEMENT EXECUTE FUNCTION official_v3_jobs_private.immutable_v1();
ALTER TABLE official_v3_jobs_private.catalog_binding_v1 ENABLE ROW LEVEL SECURITY;
ALTER TABLE official_v3_jobs_private.catalog_binding_v1 FORCE ROW LEVEL SECURITY;
CREATE POLICY owner_v1 ON official_v3_jobs_private.catalog_binding_v1 TO ot_v3_jobs_owner USING(true) WITH CHECK(true);
CREATE TRIGGER guard_row_v1 BEFORE UPDATE OR DELETE ON official_v3_jobs_private.catalog_binding_v1 FOR EACH ROW EXECUTE FUNCTION official_v3_jobs_private.immutable_v1();
CREATE TRIGGER guard_truncate_v1 BEFORE TRUNCATE ON official_v3_jobs_private.catalog_binding_v1 FOR EACH STATEMENT EXECUTE FUNCTION official_v3_jobs_private.immutable_v1();
-- SQL-standard bodies create real consumed OID dependencies on the predecessors.




CREATE FUNCTION official_v3_jobs_private.consume_s1_v1(reply jsonb,job jsonb,result jsonb,purpose text) RETURNS void
LANGUAGE plpgsql VOLATILE PARALLEL UNSAFE SECURITY INVOKER CALLED ON NULL INPUT SET search_path=pg_catalog,pg_temp AS $$
DECLARE row_value jsonb:=reply->'record'; ref jsonb; b jsonb; p jsonb; raw json; identity jsonb; outcome jsonb; audit jsonb; decision jsonb;
  previous jsonb; archive jsonb; expected_ref text; expected_escalation text; conflict jsonb; retained jsonb; removed jsonb:='[]'; entry_value jsonb; method jsonb:=COALESCE(job->'method',job#>'{identity,method}');
BEGIN
  IF purpose NOT IN ('prepare','read','complete') OR official_v3_jobs_private.exact_keys_v1(reply,ARRAY['status','record']) IS NOT TRUE OR reply->>'status' IS DISTINCT FROM 'recorded'
    OR official_v3_jobs_private.exact_keys_v1(row_value,ARRAY['reference','text','outcome','audit']) IS NOT TRUE
    OR jsonb_typeof(row_value->'text') IS DISTINCT FROM 'string' THEN RAISE EXCEPTION 'm04 S1 proof unavailable' USING ERRCODE='P7604'; END IF;
  ref:=official_v3_jobs_private.reference_v1(row_value->'reference'); b:=ref->'binding'; raw:=(row_value->>'text')::json;
  IF official_v3_jobs_private.unique_json_v1(raw,0) IS NOT TRUE OR octet_length(row_value->>'text')<>(ref->>'bytes')::integer
    OR encode(sha256(convert_to(row_value->>'text','UTF8')),'hex')<>ref->>'proposalDigest' THEN RAISE EXCEPTION 'm04 S1 bytes mismatch' USING ERRCODE='P7604'; END IF;
  p:=raw::jsonb;
  IF official_v3_jobs_private.s1_shape_v1(p,'proposal') IS NOT TRUE OR official_v3_jobs_private.nodes_v1(p,0,16,8192)<0
    OR p->'operationId' IS DISTINCT FROM b->'operationId' OR p->'jobId' IS DISTINCT FROM b->'jobId'
    OR p->'contextKey' IS DISTINCT FROM b->'contextKey' OR p->'jobId' IS DISTINCT FROM job->'jobId'
    OR b->'method' IS DISTINCT FROM method THEN RAISE EXCEPTION 'm04 S1 binding mismatch' USING ERRCODE='P7604'; END IF;
  -- Semantically integral ORIGINAL numbers may be spelled 18.0 or 18e0.
  -- Normalize only the local identity DTO after full actual S1 shape validation;
  -- neither original bytes, their digest nor proposedFact are rewritten.
  p:=jsonb_set(jsonb_set(p,'{context}',official_v3_jobs_private.canonical_v1(p->'context',0)::jsonb),
    '{research}',official_v3_jobs_private.canonical_v1(p->'research',0)::jsonb);
  identity:=official_v3_jobs_private.subject_v1('rule_research',jsonb_build_object('context',p->'context','method',method,
    'factKind',p#>'{research,factKind}','researchReason',p#>'{research,researchReason}'));
  IF p->'contextKey' IS DISTINCT FROM identity->'contextKey' OR p->'research' IS DISTINCT FROM identity->'research' THEN RAISE EXCEPTION 'm04 S1 normal form mismatch' USING ERRCODE='P7604'; END IF;
  IF job->>'kind'='research_job_record' THEN
    IF p->'context' IS DISTINCT FROM job->'context' OR p->'contextKey' IS DISTINCT FROM job->'contextKey' OR p->'research' IS DISTINCT FROM job->'research' THEN RAISE EXCEPTION 'm04 S1 full Rule mismatch' USING ERRCODE='P7604'; END IF;
  ELSIF p#>'{context,scope,destinationCountryCode}' IS DISTINCT FROM job#>'{identity,destinationCountryCode}'
    OR p#>'{context,scope,citizenship,countryCodes,0}' IS DISTINCT FROM job#>'{identity,citizenshipCountryCode}' THEN RAISE EXCEPTION 'm04 S1 pair mismatch' USING ERRCODE='P7604'; END IF;
  outcome:=row_value->'outcome'; audit:=row_value->'audit';
  IF outcome='null'::jsonb AND audit='null'::jsonb THEN
    IF job->>'kind'='research_job_record' THEN RAISE EXCEPTION 'm04 Rule completion missing' USING ERRCODE='P7604'; END IF;
    RETURN;
  END IF;
  IF official_v3_jobs_private.s1_shape_v1(outcome,'outcome') IS NOT TRUE OR official_v3_jobs_private.s1_shape_v1(audit,'audit') IS NOT TRUE
    OR official_v3_jobs_private.exact_keys_v1(audit,ARRAY['schema','kind','operationId','proposalDigest','jobId','contextKey','method','recordedAt','result','decisionRef','escalationKey']) IS NOT TRUE
    OR audit->'schema' IS DISTINCT FROM '3'::jsonb OR audit->>'kind' IS DISTINCT FROM 'import_attempt_record'
    OR audit->'operationId' IS DISTINCT FROM b->'operationId' OR audit->'jobId' IS DISTINCT FROM b->'jobId'
    OR audit->'contextKey' IS DISTINCT FROM b->'contextKey' OR audit->'method' IS DISTINCT FROM method
    OR audit->'proposalDigest' IS DISTINCT FROM ref->'proposalDigest' OR audit->'result' IS DISTINCT FROM outcome->'status' THEN RAISE EXCEPTION 'm04 S1 outcome mismatch' USING ERRCODE='P7604'; END IF;
  PERFORM official_v3_jobs_private.timestamp_v1(audit->>'recordedAt');
  IF outcome->>'status'='prepared' THEN
    decision:=outcome#>'{value,decision}'; previous:=outcome#>'{value,previousDecision}'; archive:=outcome#>'{value,archiveAppend}';
    IF outcome#>'{value,proposalDigest}' IS DISTINCT FROM ref->'proposalDigest' OR outcome#>>'{value,acceptance}' IS DISTINCT FROM 'not_committed'
      OR outcome#>>'{value,reproof}' IS DISTINCT FROM 'required_before_commit'
      OR outcome#>'{value,transition,operationId}' IS DISTINCT FROM p->'operationId' OR outcome#>'{value,version,operationId}' IS DISTINCT FROM p->'operationId'
      OR outcome#>'{value,version,sourceDecisionRef}' IS DISTINCT FROM decision->'reference'
      OR outcome#>'{value,transition,sourceDecisionRef}' IS DISTINCT FROM decision->'reference' THEN RAISE EXCEPTION 'm04 S1 prepared mismatch' USING ERRCODE='P7604'; END IF;
  ELSIF outcome->>'status'='escalation' THEN
    decision:=outcome->'decision'; previous:=outcome->'previousDecision'; archive:=outcome->'archiveAppend'; expected_escalation:=outcome->>'key';
  ELSIF job->>'kind'='research_job_record' THEN RAISE EXCEPTION 'm04 Rule outcome not prepared' USING ERRCODE='P7604';
  END IF;
  IF decision IS NOT NULL THEN
    expected_ref:='source-decision:v3:'||encode(sha256(convert_to(official_v3_jobs_private.canonical_v1(jsonb_build_object('operationId',p->'operationId',
      'proposalDigest',ref->'proposalDigest','contextKey',p->'contextKey','method',method,'predecessor',previous->'reference'),0),'UTF8')),'hex');
    IF decision->>'reference' IS DISTINCT FROM expected_ref OR decision->'predecessor' IS DISTINCT FROM COALESCE(previous->'reference','null'::jsonb)
      OR decision->'context' IS DISTINCT FROM p->'context' OR decision->'contextKey' IS DISTINCT FROM p->'contextKey'
      OR decision->'method' IS DISTINCT FROM method OR decision->'factKind' IS DISTINCT FROM p#>'{research,factKind}'
      OR (job->>'kind'='research_job_record' AND result->>'decisionRef' IS DISTINCT FROM expected_ref) THEN RAISE EXCEPTION 'm04 S1 decision mismatch' USING ERRCODE='P7604'; END IF;
    IF previous='null'::jsonb THEN
      IF decision->'predecessor' IS DISTINCT FROM 'null'::jsonb OR decision->'historyArchive' IS DISTINCT FROM 'null'::jsonb OR archive IS DISTINCT FROM 'null'::jsonb THEN
        RAISE EXCEPTION 'm04 initial decision history mismatch' USING ERRCODE='P7604'; END IF;
    ELSE
      IF previous->'contextKey' IS DISTINCT FROM p->'contextKey' OR previous->'factKind' IS DISTINCT FROM p#>'{research,factKind}'
        OR previous->>'evaluatedAt'>decision->>'evaluatedAt' OR decision->'predecessor' IS DISTINCT FROM previous->'reference' THEN
        RAISE EXCEPTION 'm04 S1 predecessor mismatch' USING ERRCODE='P7604'; END IF;
      -- A historical predecessor may have a different method revision. Compare its
      -- protected context/fact/link/conflict chain, never invent a same-method rule.
      FOR conflict IN SELECT value FROM jsonb_array_elements(previous->'knownConflicts') LOOP
        SELECT value INTO retained FROM jsonb_array_elements(decision->'knownConflicts') WHERE value->'reference'=conflict->'reference';
        IF NOT FOUND THEN
          IF conflict->'resolution'='null'::jsonb THEN RAISE EXCEPTION 'm04 unresolved history removal' USING ERRCODE='P7604'; END IF;
          removed:=removed||jsonb_build_array(conflict);
        ELSIF (conflict-'resolution') IS DISTINCT FROM (retained-'resolution')
          OR (conflict->'resolution'<>'null'::jsonb AND conflict->'resolution' IS DISTINCT FROM retained->'resolution'
            AND (retained->'resolution'='null'::jsonb OR retained#>'{resolution,predecessor}' IS DISTINCT FROM conflict#>'{resolution,reference}'
              OR retained#>'{resolution,reference}'=conflict#>'{resolution,reference}' OR retained#>>'{resolution,resolvedAt}'<conflict#>>'{resolution,resolvedAt}')) THEN
          RAISE EXCEPTION 'm04 conflict predecessor mismatch' USING ERRCODE='P7604';
        END IF;
      END LOOP;
      IF archive='null'::jsonb THEN
        IF jsonb_array_length(removed)<>0 OR decision->'historyArchive' IS DISTINCT FROM previous->'historyArchive' THEN RAISE EXCEPTION 'm04 missing archive link' USING ERRCODE='P7604'; END IF;
      ELSE
        IF archive->'contextKey' IS DISTINCT FROM p->'contextKey' OR archive->'factKind' IS DISTINCT FROM p#>'{research,factKind}'
          OR archive->'fromDecisionRef' IS DISTINCT FROM previous->'reference' OR archive->'head' IS DISTINCT FROM decision->'historyArchive'
          OR archive->'predecessor' IS DISTINCT FROM previous->'historyArchive'
          OR archive->>'archivedAt'<previous->>'evaluatedAt' OR archive->>'archivedAt'>decision->>'evaluatedAt'
          OR archive#>'{head,reference}'=archive#>'{predecessor,reference}'
          OR (archive#>>'{head,revision}')::integer<>COALESCE((archive#>>'{predecessor,revision}')::integer,0)+1
          OR (archive#>>'{head,totalConflicts}')::integer<>COALESCE((archive#>>'{predecessor,totalConflicts}')::integer,0)+jsonb_array_length(archive->'entries')
          OR jsonb_array_length(archive->'entries')<>jsonb_array_length(removed)
          OR (SELECT count(DISTINCT value->>'reference') FROM jsonb_array_elements(archive->'entries'))<>jsonb_array_length(removed) THEN
          RAISE EXCEPTION 'm04 S1 archive mismatch' USING ERRCODE='P7604'; END IF;
        FOR entry_value IN SELECT value FROM jsonb_array_elements(archive->'entries') LOOP
          IF NOT EXISTS(SELECT 1 FROM jsonb_array_elements(removed) WHERE value=entry_value)
            OR entry_value#>'{primary,contextKey}' IS DISTINCT FROM p->'contextKey' OR entry_value#>'{primary,fact,fact,kind}' IS DISTINCT FROM p#>'{research,factKind}'
            OR entry_value->'resolution'='null'::jsonb OR entry_value#>>'{resolution,resolvedAt}'>archive->>'archivedAt' THEN
            RAISE EXCEPTION 'm04 archived entry mismatch' USING ERRCODE='P7604'; END IF;
        END LOOP;
      END IF;
    END IF;
    IF outcome->>'status'='escalation' THEN
      SELECT 'source-escalation:v3:'||encode(sha256(convert_to(official_v3_jobs_private.canonical_v1(jsonb_build_object(
        'contextKey',decision->'contextKey','factKind',decision->'factKind','method',decision->'method','reason',decision->'conclusion',
        'conflicts',COALESCE(jsonb_agg(value->>'reference' ORDER BY value->>'reference' COLLATE "C"),'[]'::jsonb)),0),'UTF8')),'hex') INTO expected_escalation
        FROM jsonb_array_elements(decision->'knownConflicts') WHERE value->'resolution'='null'::jsonb;
      IF outcome->>'key' IS DISTINCT FROM expected_escalation OR outcome->'reason' IS DISTINCT FROM decision->'conclusion' THEN RAISE EXCEPTION 'm04 escalation mismatch' USING ERRCODE='P7604'; END IF;
    END IF;
  END IF;
  IF audit->>'decisionRef' IS DISTINCT FROM decision->>'reference' OR audit->>'escalationKey' IS DISTINCT FROM expected_escalation THEN RAISE EXCEPTION 'm04 S1 audit mismatch' USING ERRCODE='P7604'; END IF;
END $$;

CREATE FUNCTION official_v3_jobs_private.assert_history_v1(k text) RETURNS void
LANGUAGE plpgsql VOLATILE PARALLEL UNSAFE SECURITY INVOKER CALLED ON NULL INPUT SET search_path=pg_catalog,pg_temp AS $$
DECLARE s official_v3_jobs_private.subjects_v1%ROWTYPE; x record; c jsonb; e jsonb; unresolved text[]; ops integer; starts integer; credit jsonb; envelope_canonical text COLLATE "default";
  validated_jobs jsonb:='{}'::jsonb; validated_job_count integer:=0; validated_job_bytes integer:=0; job_text text COLLATE "C"; job_bytes integer;
  memo_subject_kind text COLLATE "C"; memo_subject_text text COLLATE "C"; memo_subject_result jsonb; command_identity jsonb;
BEGIN
  SELECT * INTO s FROM official_v3_jobs_private.subjects_v1 WHERE job_key=k;
  IF NOT FOUND THEN RETURN; END IF;
  SELECT count(*) INTO ops FROM official_v3_jobs_private.queue_operations_v1 WHERE job_key=k;
  SELECT count(*),array_agg(t.attempt_key ORDER BY t.attempt_key) FILTER(WHERE d.attempt_key IS NULL) INTO starts,unresolved
    FROM official_v3_jobs_private.execution_starts_v1 t LEFT JOIN official_v3_jobs_private.execution_dispositions_v1 d USING(attempt_key) WHERE t.job_key=k;
  IF ops<>s.operation_count OR starts<>s.start_count OR ops>256 OR starts>64 OR cardinality(unresolved)>1
    OR s.open_attempt IS DISTINCT FROM unresolved[1] THEN RAISE EXCEPTION 'm04 history invariant' USING ERRCODE='P7603'; END IF;
  PERFORM official_v3_jobs_private.job_v1(s.current_job);
  job_text:=s.current_job::text; job_bytes:=octet_length(job_text);
  IF job_bytes<=1048576 THEN
    validated_jobs:=jsonb_build_object(job_text,true); validated_job_count:=1; validated_job_bytes:=job_bytes;
  END IF;
  FOR x IN SELECT * FROM official_v3_jobs_private.queue_operations_v1 WHERE job_key=k LOOP
    command_identity:=NULL;
    DECLARE v jsonb:=x.command_text::jsonb;
      a text COLLATE "default":=v->>'action'; k text COLLATE "default":=v->>'kind'; i jsonb:=v->'input'; identity jsonb; jkey text COLLATE "default"; f jsonb; t text COLLATE "default";
      subject_input jsonb; subject_input_text text COLLATE "C"; subject_bytes integer;
    BEGIN
      IF v IS NULL THEN RAISE EXCEPTION 'm04 invalid command' USING ERRCODE='P7601'; END IF;
      t:=official_v3_jobs_private.canonical_v1(v,0);
      IF octet_length(t)>65536
        OR official_v3_jobs_private.exact_keys_v1(v,CASE WHEN a IN ('enqueue','complete') THEN ARRAY['action','kind','input'] ELSE ARRAY['action','input'] END) IS NOT TRUE
        OR (a IN ('enqueue','claim','complete','fail')) IS NOT TRUE OR (i->>'operationId' ~ '^op3_[a-f0-9]{32}$') IS NOT TRUE THEN RAISE EXCEPTION 'm04 invalid command' USING ERRCODE='P7601'; END IF;
      IF a='enqueue' THEN
        IF k='rule_research' THEN
          IF official_v3_jobs_private.exact_keys_v1(i,ARRAY['context','method','factKind','researchReason','operationId','jobId','attemptLimit']) IS NOT TRUE THEN RAISE EXCEPTION 'm04 invalid enqueue' USING ERRCODE='P7601'; END IF;
        ELSIF k='combination_discovery' THEN
          IF official_v3_jobs_private.exact_keys_v1(i,ARRAY['destinationCountryCode','citizenshipCountryCode','method','operationId','jobId','attemptLimit']) IS NOT TRUE THEN RAISE EXCEPTION 'm04 invalid enqueue' USING ERRCODE='P7601'; END IF;
        ELSE RAISE EXCEPTION 'm04 invalid enqueue' USING ERRCODE='P7601'; END IF;
        IF (i->>'jobId' ~ '^job3_[a-f0-9]{32}$') IS NOT TRUE OR jsonb_typeof(i->'attemptLimit') IS DISTINCT FROM 'number'
          OR (i->>'attemptLimit' ~ '^[1-9][0-9]?$') IS NOT TRUE OR (i->>'attemptLimit')::integer NOT BETWEEN 1 AND 16 THEN RAISE EXCEPTION 'm04 invalid enqueue' USING ERRCODE='P7601'; END IF;
        subject_input:=i-'operationId'-'jobId'-'attemptLimit'; subject_input_text:=subject_input::text;
        IF memo_subject_kind COLLATE "C" = k COLLATE "C" AND memo_subject_text COLLATE "C" = subject_input_text COLLATE "C" THEN
          identity:=memo_subject_result;
        ELSE
          identity:=official_v3_jobs_private.subject_v1(k,subject_input);
          subject_bytes:=octet_length(k)+octet_length(subject_input_text);
          IF subject_bytes<=1048576 AND octet_length(identity::text)<=1048576-subject_bytes THEN
            memo_subject_kind:=k; memo_subject_text:=subject_input_text; memo_subject_result:=identity;
          END IF;
        END IF;
        jkey:=identity->>'jobKey';
      ELSE
        jkey:=i->>'jobKey';
        IF (jkey ~ '^(research-job|combination-discovery-job):v3:[a-f0-9]{64}$') IS NOT TRUE THEN RAISE EXCEPTION 'm04 invalid locator' USING ERRCODE='P7601'; END IF;
        IF a='claim' THEN
          IF official_v3_jobs_private.exact_keys_v1(i,ARRAY['operationId','jobKey','leaseId','leaseMilliseconds']) IS NOT TRUE
            OR (i->>'leaseId' ~ '^lease3_[a-f0-9]{32}$') IS NOT TRUE OR jsonb_typeof(i->'leaseMilliseconds') IS DISTINCT FROM 'number'
            OR (i->>'leaseMilliseconds' ~ '^[1-9][0-9]{0,5}$') IS NOT TRUE OR (i->>'leaseMilliseconds')::integer>900000 THEN RAISE EXCEPTION 'm04 invalid claim' USING ERRCODE='P7601'; END IF;
        ELSE
          f:=i->'fence';
          IF official_v3_jobs_private.exact_keys_v1(f,ARRAY['jobId','revision','leaseId','generation']) IS NOT TRUE
            OR (f->>'jobId' ~ '^job3_[a-f0-9]{32}$') IS NOT TRUE OR (f->>'leaseId' ~ '^lease3_[a-f0-9]{32}$') IS NOT TRUE
            OR jsonb_typeof(f->'revision') IS DISTINCT FROM 'number' OR (f->>'revision' ~ '^[1-9][0-9]{0,9}$') IS NOT TRUE OR (f->>'revision')::numeric>2147483647
            OR jsonb_typeof(f->'generation') IS DISTINCT FROM 'number' OR (f->>'generation' ~ '^[1-9][0-9]{0,9}$') IS NOT TRUE OR (f->>'generation')::numeric>2147483647 THEN RAISE EXCEPTION 'm04 invalid fence' USING ERRCODE='P7601'; END IF;
          IF a='complete' THEN
            IF (k IN ('rule_research','combination_discovery')) IS NOT TRUE OR (k='rule_research')<>(jkey LIKE 'research-job:%')
              OR official_v3_jobs_private.exact_keys_v1(i,CASE WHEN k='rule_research' THEN ARRAY['operationId','jobKey','fence','decisionRef'] ELSE ARRAY['operationId','jobKey','fence','discoveryRef'] END) IS NOT TRUE
              OR (COALESCE(i->>'decisionRef',i->>'discoveryRef') ~ CASE WHEN k='rule_research' THEN '^source-decision:v3:[a-f0-9]{64}$' ELSE '^combination-discovery-result:v3:[a-f0-9]{64}$' END) IS NOT TRUE THEN RAISE EXCEPTION 'm04 invalid completion' USING ERRCODE='P7601'; END IF;
          ELSE
            IF official_v3_jobs_private.exact_keys_v1(i,ARRAY['operationId','jobKey','fence','reason']) IS NOT TRUE
              OR (i->>'reason' IN ('unreachable','invalid_proposal','verification_unavailable','commit_unconfirmed')) IS NOT TRUE THEN RAISE EXCEPTION 'm04 invalid failure' USING ERRCODE='P7601'; END IF;
          END IF;
        END IF;
        k:=CASE WHEN jkey LIKE 'research-job:%' THEN 'rule_research' ELSE 'combination_discovery' END;
      END IF;
      c:=jsonb_build_object('value',v,'commandText',t,'commandKey','queue-command:v3:'||encode(sha256(convert_to(t,'UTF8')),'hex'),
        'operationId',i->'operationId','jobKey',jkey,'subjectText',identity->'subjectText','action',a,'kind',k);
      command_identity:=identity;
    END;
    e:=x.envelope_text::jsonb;
    IF c->>'commandText'<>x.command_text OR c->>'commandKey'<>x.command_key OR c->>'operationId'<>x.operation_id OR c->>'jobKey'<>k THEN RAISE EXCEPTION 'm04 journal invariant' USING ERRCODE='P7603'; END IF;
    envelope_canonical:=official_v3_jobs_private.canonical_v1(e,0);
    IF envelope_canonical<>x.envelope_text OR e#>>'{audit,reference}'<>x.audit_reference THEN RAISE EXCEPTION 'm04 journal invariant' USING ERRCODE='P7603'; END IF;
    DECLARE command jsonb:=c->'value'; current_record jsonb:=e->'expected'; commit jsonb:=e;
      i jsonb:=command->'input'; expected jsonb; n jsonb; identity jsonb;
      a jsonb:=commit->'audit'; f jsonb:=i->'fence'; kind text COLLATE "default"; action text COLLATE "default":=command->>'action'; at_time timestamptz; end_time timestamptz;
      observed text COLLATE "default":=a->>'observedAt'; rev integer; delay_ms integer; result_key text COLLATE "default";
    BEGIN
      IF official_v3_jobs_private.exact_keys_v1(commit,ARRAY['operationId','commandKey','jobKey','expected','next','notAfter','audit']) IS NOT TRUE
        OR octet_length(envelope_canonical)>196608
        OR official_v3_jobs_private.exact_keys_v1(a,ARRAY['reference','kind','observedAt','priorRevision','nextRevision']) IS NOT TRUE
        OR commit->'operationId' IS DISTINCT FROM c->'operationId' OR commit->'commandKey' IS DISTINCT FROM c->'commandKey'
        OR commit->'jobKey' IS DISTINCT FROM c->'jobKey' OR commit->'expected' IS DISTINCT FROM current_record THEN RAISE EXCEPTION 'm04 invalid transition' USING ERRCODE='P7601'; END IF;
      at_time:=official_v3_jobs_private.timestamp_v1(observed); end_time:=at_time+interval '5 seconds';
      IF current_record IS DISTINCT FROM 'null'::jsonb THEN
        job_text:=current_record::text;
        IF job_text IS NULL OR (validated_jobs ? job_text) IS NOT TRUE THEN
          expected:=official_v3_jobs_private.job_v1(current_record);
          job_bytes:=octet_length(job_text);
          IF validated_job_count<256 AND job_bytes<=1048576-validated_job_bytes THEN
            validated_jobs:=validated_jobs||jsonb_build_object(job_text,true);
            validated_job_count:=validated_job_count+1; validated_job_bytes:=validated_job_bytes+job_bytes;
          END IF;
        ELSE expected:=current_record;
        END IF;
        IF COALESCE(expected->'jobKey',expected#>'{identity,jobKey}') IS DISTINCT FROM c->'jobKey' OR expected->>'updatedAt'>observed THEN RAISE EXCEPTION 'm04 invalid prior' USING ERRCODE='P7601'; END IF;
      END IF;
      rev:=COALESCE((expected->>'revision')::integer,0)+1;
      IF action='enqueue' THEN
        IF expected->>'state' IN ('queued','leased','backoff') THEN n:=expected; kind:='deduplicated';
        ELSE
          IF expected->'jobId'=i->'jobId' THEN RAISE EXCEPTION 'm04 repeated cycle' USING ERRCODE='P7601'; END IF;
          n:=jsonb_build_object('schema',3,'jobId',i->'jobId','operationId',i->'operationId','revision',rev,'predecessorRevision',expected->'revision',
            'state','queued','createdAt',observed,'updatedAt',observed,'attempt',0,'attemptLimit',i->'attemptLimit','lease',NULL,'nextAttemptAt',NULL,'lastFailure',NULL);
          identity:=command_identity;
          IF command->>'kind'='rule_research' THEN n:=n||jsonb_build_object('kind','research_job_record','jobKey',identity->'jobKey',
            'context',i->'context','contextKey',identity->'contextKey','research',identity->'research','method',i->'method','resultDecisionRef',NULL);
          ELSE n:=n||jsonb_build_object('kind','combination_discovery_job_record','identity',(i-'operationId'-'jobId'-'attemptLimit')||jsonb_build_object('kind','combination_discovery','jobKey',identity->'jobKey'),'resultDiscoveryRef',NULL); END IF;
          kind:='enqueued';
        END IF;
      ELSIF action='claim' THEN
        IF expected IS NULL OR expected->>'state' NOT IN ('queued','leased','backoff')
          OR (expected->>'state'='backoff' AND expected->>'nextAttemptAt'>observed)
          OR (expected->>'state'='leased' AND expected#>>'{lease,expiresAt}'>observed) THEN RAISE EXCEPTION 'm04 not due' USING ERRCODE='P7601'; END IF;
        n:=expected||jsonb_build_object('revision',rev,'predecessorRevision',expected->'revision','updatedAt',observed,'nextAttemptAt',NULL);
        IF (expected->>'attempt')::integer>=(expected->>'attemptLimit')::integer THEN
          n:=n||jsonb_build_object('state','exhausted','lease',NULL,'lastFailure',COALESCE(NULLIF(expected->'lastFailure','null'::jsonb),'"verification_unavailable"'::jsonb)); kind:='exhausted';
        ELSE
          n:=n||jsonb_build_object('state','leased','attempt',(expected->>'attempt')::integer+1,'lease',jsonb_build_object('leaseId',i->'leaseId','generation',rev,
            'acquiredAt',observed,'expiresAt',to_char((at_time+(i->>'leaseMilliseconds')::integer*interval '1 millisecond') AT TIME ZONE 'UTC','YYYY-MM-DD"T"HH24:MI:SS.MS"Z"')));
          kind:=CASE WHEN expected->>'state'='leased' THEN 'reclaimed' ELSE 'leased' END;
        END IF;
      ELSE
        IF expected IS NULL OR expected->>'state'<>'leased' OR f IS DISTINCT FROM jsonb_build_object('jobId',expected->'jobId','revision',expected->'revision',
          'leaseId',expected#>'{lease,leaseId}','generation',expected#>'{lease,generation}') OR expected#>>'{lease,expiresAt}'<=observed THEN RAISE EXCEPTION 'm04 obsolete fence' USING ERRCODE='P7601'; END IF;
        end_time:=least(end_time,official_v3_jobs_private.timestamp_v1(expected#>>'{lease,expiresAt}'));
        n:=expected||jsonb_build_object('revision',rev,'predecessorRevision',expected->'revision','updatedAt',observed,'lease',NULL);
        IF action='complete' THEN
          result_key:=CASE WHEN expected->>'kind'='research_job_record' THEN 'resultDecisionRef' ELSE 'resultDiscoveryRef' END;
          n:=n||jsonb_build_object('state','succeeded','lastFailure',NULL,result_key,COALESCE(i->'decisionRef',i->'discoveryRef')); kind:='completed';
        ELSE
          IF (expected->>'attempt')::integer=(expected->>'attemptLimit')::integer THEN n:=n||jsonb_build_object('state','exhausted','nextAttemptAt',NULL); kind:='exhausted';
          ELSE
            delay_ms:=least(60000,1000*(2^((expected->>'attempt')::integer-1))::integer);
            n:=n||jsonb_build_object('state','backoff','nextAttemptAt',to_char((at_time+delay_ms*interval '1 millisecond') AT TIME ZONE 'UTC','YYYY-MM-DD"T"HH24:MI:SS.MS"Z"')); kind:='backoff';
          END IF;
          n:=n||jsonb_build_object('lastFailure',i->'reason');
        END IF;
      END IF;
      IF kind IS DISTINCT FROM 'deduplicated' THEN
        job_text:=n::text;
        IF job_text IS NULL OR (validated_jobs ? job_text) IS NOT TRUE THEN
          n:=official_v3_jobs_private.job_v1(n);
          job_bytes:=octet_length(job_text);
          IF validated_job_count<256 AND job_bytes<=1048576-validated_job_bytes THEN
            validated_jobs:=validated_jobs||jsonb_build_object(job_text,true);
            validated_job_count:=validated_job_count+1; validated_job_bytes:=validated_job_bytes+job_bytes;
          END IF;
        END IF;
      END IF;
      IF commit->'next' IS DISTINCT FROM n OR official_v3_jobs_private.timestamp_v1(commit->>'notAfter')<>end_time
        OR a IS DISTINCT FROM jsonb_build_object('reference','queue-event:v3:'||encode(sha256(convert_to(official_v3_jobs_private.canonical_v1(jsonb_build_object('op',i->'operationId','command',c->'commandKey'),0),'UTF8')),'hex'),
          'kind',kind,'observedAt',observed,'priorRevision',expected->'revision','nextRevision',n->'revision') THEN RAISE EXCEPTION 'm04 transition mismatch' USING ERRCODE='P7601'; END IF;
    END;
  END LOOP;
  FOR x IN SELECT t.*,q.command_text,q.envelope_text,d.kind AS disposition_kind,d.queue_operation_id,r.result
      FROM official_v3_jobs_private.execution_starts_v1 t JOIN official_v3_jobs_private.queue_operations_v1 q ON q.operation_id=t.claim_operation_id
      LEFT JOIN official_v3_jobs_private.execution_dispositions_v1 d USING(attempt_key)
      LEFT JOIN official_v3_jobs_private.execution_results_v1 r USING(attempt_key) WHERE t.job_key=k LOOP
    IF x.command_text::jsonb->>'action'<>'claim' OR x.command_text::jsonb->'input' IS DISTINCT FROM x.claim_text::jsonb
      OR x.envelope_text::jsonb->'next' IS DISTINCT FROM x.leased_job OR x.leased_job->>'state'<>'leased'
      OR x.claim_text IS DISTINCT FROM official_v3_jobs_private.canonical_v1(x.claim_text::jsonb,0)
      OR (x.authority-'epoch') IS DISTINCT FROM s.method_binding OR (x.authority->>'epoch' ~ '^[1-9][0-9]{0,9}$') IS NOT TRUE
      OR x.attempt_key IS DISTINCT FROM 'execution-attempt:v3:'||encode(sha256(convert_to(official_v3_jobs_private.canonical_v1(jsonb_build_object(
        'subject',s.subject_text::jsonb,'claim',x.claim_text::jsonb,'leasedJob',x.leased_job,'authority',x.authority),0),'UTF8')),'hex')
      OR (x.disposition_kind='completed' AND x.result IS NULL) OR (x.disposition_kind='settled_failure' AND x.result IS NOT NULL) THEN RAISE EXCEPTION 'm04 attempt invariant' USING ERRCODE='P7603'; END IF;
    IF x.disposition_kind IS NOT NULL AND NOT EXISTS(SELECT 1 FROM official_v3_jobs_private.queue_operations_v1 q WHERE q.operation_id=x.queue_operation_id AND q.job_key=k
      AND q.action=CASE WHEN x.disposition_kind='completed' THEN 'complete' ELSE 'fail' END
      AND q.envelope_text::jsonb->'expected'=x.leased_job) THEN RAISE EXCEPTION 'm04 disposition invariant' USING ERRCODE='P7603'; END IF;
  END LOOP;
  IF s.current_job->>'state'='leased' THEN
    SELECT envelope_text::jsonb->'next' INTO credit FROM official_v3_jobs_private.queue_operations_v1
      WHERE operation_id=s.terminal_credit_claim AND job_key=k AND action='claim';
    IF credit IS DISTINCT FROM s.current_job THEN RAISE EXCEPTION 'm04 terminal credit invariant' USING ERRCODE='P7603'; END IF;
  ELSIF s.terminal_credit_claim IS NOT NULL THEN RAISE EXCEPTION 'm04 terminal credit invariant' USING ERRCODE='P7603'; END IF;
  IF NOT EXISTS(SELECT 1 FROM official_v3_jobs_private.slots_v1 WHERE slot_id=s.slot_id AND job_key=k) THEN RAISE EXCEPTION 'm04 slot_id invariant' USING ERRCODE='P7603'; END IF;
END $$;

CREATE FUNCTION official_v3_jobs_private.assert_catalog_v1() RETURNS void
LANGUAGE plpgsql VOLATILE PARALLEL UNSAFE SECURITY INVOKER CALLED ON NULL INPUT SET search_path=pg_catalog,pg_temp AS $$
DECLARE creator oid; owner_id oid:='ot_v3_jobs_owner'::pg_catalog.regrole;
  caller_id oid:='ot_v3_jobs_caller'::pg_catalog.regrole; intake_id oid:='ot_v3_intake_owner'::pg_catalog.regrole;
  login_id oid; expected record; actual_function pg_catalog.pg_proc%ROWTYPE; expected_types oid[];
  foreign_dependency boolean; actual_value jsonb; bound_value jsonb;
BEGIN

  SELECT (fingerprint->>'installer')::oid INTO creator
    FROM official_v3_jobs_private.catalog_binding_v1 WHERE object_identity='creator-defaults';
  IF creator IS DISTINCT FROM 'postgres'::pg_catalog.regrole::oid
    OR (SELECT count(*) FROM official_v3_jobs_private.catalog_binding_v1)<>15
    OR EXISTS(SELECT 1 FROM official_v3_jobs_private.catalog_binding_v1
      WHERE object_identity<>ALL(ARRAY['jobs-functions','jobs-relations','jobs-types','jobs-schemas','jobs-dependencies','prerequisite-functions','prerequisite-relations','prerequisite-types','prerequisite-schemas','prerequisite-dependencies','protected-roles','creator-edges','creator-defaults','database','package-context' ]::text[]))
    OR (SELECT fingerprint FROM official_v3_jobs_private.catalog_binding_v1 WHERE object_identity='package-context')
      IS DISTINCT FROM ('{"package":"HM04-v1-A1","original_jobs_sha256":"0d2210d84c02aacbeef1c8e14b38e7be6c2e3e8c387057fd97666fb00c71bba4","original_r41_native_sha256":"a61b94e98691ecf6212f2e9cadfada3d470927c319f0ef9a6ed008f63ec658ea","pg1_sha256":"3e21495ff40f66337b004fadc98599cd336c19c31bb4f6e4f9013c2c01f02bd2","hma1_sha256":"edbaf9d56b3da115b12bf1c8cfd5c76d8bc9483f7fc1658ee648b380a16fe2c0","hs1_sha256":"9430eb05890203b0aefedc2d5a12cb0b16d9940152b75afc864da2440ce62b55"}'::jsonb || pg_catalog.jsonb_build_object('creator','postgres'::pg_catalog.regrole::oid,'database',(SELECT d.oid FROM pg_catalog.pg_database d WHERE d.datname=current_database()))) THEN
    RAISE EXCEPTION 'hm04 original Creator/package binding' USING ERRCODE='P7603';
  END IF;
  SELECT q.value INTO actual_value FROM (
SELECT pg_catalog.to_jsonb(pg_catalog.encode(pg_catalog.sha256(pg_catalog.convert_to(q.value::text,'UTF8')),'hex')) AS value FROM (
SELECT pg_catalog.jsonb_agg(pg_catalog.jsonb_build_object(
  'catalog',pg_catalog.to_jsonb(p)-'prosrc'-'prosqlbody'-'probin',
  'definition',pg_catalog.encode(pg_catalog.sha256(pg_catalog.convert_to(pg_catalog.pg_get_functiondef(p.oid),'UTF8')),'hex'))
  ORDER BY p.oid) AS value FROM pg_catalog.pg_proc p JOIN pg_catalog.pg_namespace n ON n.oid=p.pronamespace
  WHERE n.nspname IN ('official_v3_jobs_private','official_v3_jobs_api')
) q
  ) q;
  SELECT fingerprint INTO bound_value FROM official_v3_jobs_private.catalog_binding_v1 WHERE object_identity='jobs-functions';
  IF actual_value IS DISTINCT FROM bound_value THEN
    RAISE EXCEPTION 'hm04 catalog drift: jobs-functions' USING ERRCODE='P7603';
  END IF;
  SELECT q.value INTO actual_value FROM (
SELECT pg_catalog.to_jsonb(pg_catalog.encode(pg_catalog.sha256(pg_catalog.convert_to(q.value::text,'UTF8')),'hex')) AS value FROM (
SELECT pg_catalog.jsonb_agg(pg_catalog.jsonb_build_object(
  'name',c.relname,'oid',c.oid,'namespace',c.relnamespace,'kind',c.relkind,'owner',c.relowner,'acl',c.relacl,
  'rls',c.relrowsecurity,'force',c.relforcerowsecurity,'persistence',c.relpersistence,'partition',c.relispartition,
  'oftype',c.reloftype,'replica',c.relreplident,'options',c.reloptions,'access',c.relam,'tablespace',c.reltablespace,
  'columns',(SELECT pg_catalog.jsonb_agg(pg_catalog.to_jsonb(a) ORDER BY a.attnum) FROM pg_catalog.pg_attribute a
    WHERE a.attrelid=c.oid AND a.attnum>0),
  'defaults',(SELECT pg_catalog.jsonb_agg(pg_catalog.to_jsonb(a) ORDER BY a.adnum) FROM pg_catalog.pg_attrdef a WHERE a.adrelid=c.oid),
  'constraints',(SELECT pg_catalog.jsonb_agg(pg_catalog.to_jsonb(k) ORDER BY k.oid) FROM pg_catalog.pg_constraint k WHERE k.conrelid=c.oid),
  'indexes',(SELECT pg_catalog.jsonb_agg(pg_catalog.to_jsonb(i) ORDER BY i.indexrelid) FROM pg_catalog.pg_index i WHERE i.indrelid=c.oid),
  'policies',(SELECT pg_catalog.jsonb_agg(pg_catalog.to_jsonb(p) ORDER BY p.oid) FROM pg_catalog.pg_policy p WHERE p.polrelid=c.oid),
  'triggers',(SELECT pg_catalog.jsonb_agg(pg_catalog.to_jsonb(g) ORDER BY g.oid) FROM pg_catalog.pg_trigger g WHERE g.tgrelid=c.oid),
  'inheritance',(SELECT pg_catalog.jsonb_agg(pg_catalog.to_jsonb(i) ORDER BY i.inhrelid,i.inhparent) FROM pg_catalog.pg_inherits i WHERE i.inhrelid=c.oid OR i.inhparent=c.oid),
  'rewrites',(SELECT pg_catalog.jsonb_agg(pg_catalog.to_jsonb(r) ORDER BY r.oid) FROM pg_catalog.pg_rewrite r WHERE r.ev_class=c.oid))
  ORDER BY c.oid) AS value FROM pg_catalog.pg_class c JOIN pg_catalog.pg_namespace n ON n.oid=c.relnamespace
  WHERE n.nspname IN ('official_v3_jobs_private','official_v3_jobs_api')
) q
  ) q;
  SELECT fingerprint INTO bound_value FROM official_v3_jobs_private.catalog_binding_v1 WHERE object_identity='jobs-relations';
  IF actual_value IS DISTINCT FROM bound_value THEN
    RAISE EXCEPTION 'hm04 catalog drift: jobs-relations' USING ERRCODE='P7603';
  END IF;
  SELECT q.value INTO actual_value FROM (
SELECT pg_catalog.to_jsonb(pg_catalog.encode(pg_catalog.sha256(pg_catalog.convert_to(q.value::text,'UTF8')),'hex')) AS value FROM (
SELECT pg_catalog.jsonb_agg(pg_catalog.to_jsonb(t) ORDER BY t.oid) AS value
  FROM pg_catalog.pg_type t JOIN pg_catalog.pg_namespace n ON n.oid=t.typnamespace WHERE n.nspname IN ('official_v3_jobs_private','official_v3_jobs_api')
) q
  ) q;
  SELECT fingerprint INTO bound_value FROM official_v3_jobs_private.catalog_binding_v1 WHERE object_identity='jobs-types';
  IF actual_value IS DISTINCT FROM bound_value THEN
    RAISE EXCEPTION 'hm04 catalog drift: jobs-types' USING ERRCODE='P7603';
  END IF;
  SELECT q.value INTO actual_value FROM (
SELECT pg_catalog.to_jsonb(pg_catalog.encode(pg_catalog.sha256(pg_catalog.convert_to(q.value::text,'UTF8')),'hex')) AS value FROM (
SELECT pg_catalog.jsonb_agg(pg_catalog.to_jsonb(n) ORDER BY n.oid) AS value
  FROM pg_catalog.pg_namespace n WHERE n.nspname IN ('official_v3_jobs_private','official_v3_jobs_api')
) q
  ) q;
  SELECT fingerprint INTO bound_value FROM official_v3_jobs_private.catalog_binding_v1 WHERE object_identity='jobs-schemas';
  IF actual_value IS DISTINCT FROM bound_value THEN
    RAISE EXCEPTION 'hm04 catalog drift: jobs-schemas' USING ERRCODE='P7603';
  END IF;
  SELECT q.value INTO actual_value FROM (
WITH scope_schemas AS (
  SELECT n.oid,n.nspname FROM pg_catalog.pg_namespace n WHERE n.nspname IN ('official_v3_jobs_private','official_v3_jobs_api')
), scope_tables AS (
  SELECT c.oid,c.reltoastrelid FROM pg_catalog.pg_class c JOIN scope_schemas n ON n.oid=c.relnamespace WHERE c.relkind='r'
), scope_classes AS (
  SELECT c.oid FROM pg_catalog.pg_class c JOIN scope_schemas n ON n.oid=c.relnamespace
  UNION SELECT t.reltoastrelid FROM scope_tables t WHERE t.reltoastrelid<>0
  UNION SELECT i.indexrelid FROM pg_catalog.pg_index i JOIN scope_tables t ON i.indrelid=t.reltoastrelid WHERE t.reltoastrelid<>0
), scope_objects AS (
  SELECT 'pg_catalog.pg_namespace'::pg_catalog.regclass::oid AS classid,n.oid AS objid FROM scope_schemas n
  UNION SELECT 'pg_catalog.pg_class'::pg_catalog.regclass,c.oid FROM scope_classes c
  UNION SELECT 'pg_catalog.pg_type'::pg_catalog.regclass,t.oid FROM pg_catalog.pg_type t JOIN scope_schemas n ON n.oid=t.typnamespace
  UNION SELECT 'pg_catalog.pg_proc'::pg_catalog.regclass,p.oid FROM pg_catalog.pg_proc p JOIN scope_schemas n ON n.oid=p.pronamespace
  UNION SELECT 'pg_catalog.pg_constraint'::pg_catalog.regclass,c.oid FROM pg_catalog.pg_constraint c JOIN scope_tables t ON t.oid=c.conrelid
  UNION SELECT 'pg_catalog.pg_trigger'::pg_catalog.regclass,g.oid FROM pg_catalog.pg_trigger g JOIN scope_tables t ON t.oid=g.tgrelid
  UNION SELECT 'pg_catalog.pg_policy'::pg_catalog.regclass,p.oid FROM pg_catalog.pg_policy p JOIN scope_tables t ON t.oid=p.polrelid
  UNION SELECT 'pg_catalog.pg_attrdef'::pg_catalog.regclass,d.oid FROM pg_catalog.pg_attrdef d JOIN scope_tables t ON t.oid=d.adrelid
)
SELECT pg_catalog.to_jsonb(pg_catalog.encode(pg_catalog.sha256(pg_catalog.convert_to(pg_catalog.jsonb_build_object(
  'dependencies',(SELECT pg_catalog.jsonb_agg(pg_catalog.to_jsonb(d) ORDER BY d.classid,d.objid,d.objsubid,d.refclassid,d.refobjid,d.refobjsubid,d.deptype)
    FROM pg_catalog.pg_depend d WHERE EXISTS(SELECT 1 FROM scope_objects o WHERE o.classid=d.classid AND o.objid=d.objid)
      OR EXISTS(SELECT 1 FROM scope_objects o WHERE o.classid=d.refclassid AND o.objid=d.refobjid)),
  'shared',(SELECT pg_catalog.jsonb_agg(pg_catalog.to_jsonb(d) ORDER BY d.dbid,d.classid,d.objid,d.objsubid,d.refclassid,d.refobjid,d.deptype)
    FROM pg_catalog.pg_shdepend d WHERE d.dbid=(SELECT b.oid FROM pg_catalog.pg_database b WHERE b.datname=current_database())
      AND EXISTS(SELECT 1 FROM scope_objects o WHERE o.classid=d.classid AND o.objid=d.objid)),
  'labels',(SELECT pg_catalog.jsonb_agg(pg_catalog.to_jsonb(s) ORDER BY s.classoid,s.objoid,s.objsubid,s.provider)
    FROM pg_catalog.pg_seclabel s JOIN scope_objects o ON o.classid=s.classoid AND o.objid=s.objoid),
  'descriptions',(SELECT pg_catalog.jsonb_agg(pg_catalog.to_jsonb(d) ORDER BY d.classoid,d.objoid,d.objsubid)
    FROM pg_catalog.pg_description d JOIN scope_objects o ON o.classid=d.classoid AND o.objid=d.objoid)
)::text,'UTF8')),'hex')) AS value
  ) q;
  SELECT fingerprint INTO bound_value FROM official_v3_jobs_private.catalog_binding_v1 WHERE object_identity='jobs-dependencies';
  IF actual_value IS DISTINCT FROM bound_value THEN
    RAISE EXCEPTION 'hm04 catalog drift: jobs-dependencies' USING ERRCODE='P7603';
  END IF;
  SELECT q.value INTO actual_value FROM (
SELECT pg_catalog.to_jsonb(pg_catalog.encode(pg_catalog.sha256(pg_catalog.convert_to(q.value::text,'UTF8')),'hex')) AS value FROM (
SELECT pg_catalog.jsonb_agg(pg_catalog.jsonb_build_object(
  'catalog',pg_catalog.to_jsonb(p)-'prosrc'-'prosqlbody'-'probin',
  'definition',pg_catalog.encode(pg_catalog.sha256(pg_catalog.convert_to(pg_catalog.pg_get_functiondef(p.oid),'UTF8')),'hex'))
  ORDER BY p.oid) AS value FROM pg_catalog.pg_proc p JOIN pg_catalog.pg_namespace n ON n.oid=p.pronamespace
  WHERE n.nspname IN ('jetnity_ot_auth','official_v3_method_private','official_v3_method_api','official_v3_intake_private','official_v3_intake_api')
) q
  ) q;
  SELECT fingerprint INTO bound_value FROM official_v3_jobs_private.catalog_binding_v1 WHERE object_identity='prerequisite-functions';
  IF actual_value IS DISTINCT FROM bound_value THEN
    RAISE EXCEPTION 'hm04 catalog drift: prerequisite-functions' USING ERRCODE='P7603';
  END IF;
  SELECT q.value INTO actual_value FROM (
SELECT pg_catalog.to_jsonb(pg_catalog.encode(pg_catalog.sha256(pg_catalog.convert_to(q.value::text,'UTF8')),'hex')) AS value FROM (
SELECT pg_catalog.jsonb_agg(pg_catalog.jsonb_build_object(
  'name',c.relname,'oid',c.oid,'namespace',c.relnamespace,'kind',c.relkind,'owner',c.relowner,'acl',c.relacl,
  'rls',c.relrowsecurity,'force',c.relforcerowsecurity,'persistence',c.relpersistence,'partition',c.relispartition,
  'oftype',c.reloftype,'replica',c.relreplident,'options',c.reloptions,'access',c.relam,'tablespace',c.reltablespace,
  'columns',(SELECT pg_catalog.jsonb_agg(pg_catalog.to_jsonb(a) ORDER BY a.attnum) FROM pg_catalog.pg_attribute a
    WHERE a.attrelid=c.oid AND a.attnum>0),
  'defaults',(SELECT pg_catalog.jsonb_agg(pg_catalog.to_jsonb(a) ORDER BY a.adnum) FROM pg_catalog.pg_attrdef a WHERE a.adrelid=c.oid),
  'constraints',(SELECT pg_catalog.jsonb_agg(pg_catalog.to_jsonb(k) ORDER BY k.oid) FROM pg_catalog.pg_constraint k WHERE k.conrelid=c.oid),
  'indexes',(SELECT pg_catalog.jsonb_agg(pg_catalog.to_jsonb(i) ORDER BY i.indexrelid) FROM pg_catalog.pg_index i WHERE i.indrelid=c.oid),
  'policies',(SELECT pg_catalog.jsonb_agg(pg_catalog.to_jsonb(p) ORDER BY p.oid) FROM pg_catalog.pg_policy p WHERE p.polrelid=c.oid),
  'triggers',(SELECT pg_catalog.jsonb_agg(pg_catalog.to_jsonb(g) ORDER BY g.oid) FROM pg_catalog.pg_trigger g WHERE g.tgrelid=c.oid),
  'inheritance',(SELECT pg_catalog.jsonb_agg(pg_catalog.to_jsonb(i) ORDER BY i.inhrelid,i.inhparent) FROM pg_catalog.pg_inherits i WHERE i.inhrelid=c.oid OR i.inhparent=c.oid),
  'rewrites',(SELECT pg_catalog.jsonb_agg(pg_catalog.to_jsonb(r) ORDER BY r.oid) FROM pg_catalog.pg_rewrite r WHERE r.ev_class=c.oid))
  ORDER BY c.oid) AS value FROM pg_catalog.pg_class c JOIN pg_catalog.pg_namespace n ON n.oid=c.relnamespace
  WHERE n.nspname IN ('jetnity_ot_auth','official_v3_method_private','official_v3_method_api','official_v3_intake_private','official_v3_intake_api')
) q
  ) q;
  SELECT fingerprint INTO bound_value FROM official_v3_jobs_private.catalog_binding_v1 WHERE object_identity='prerequisite-relations';
  IF actual_value IS DISTINCT FROM bound_value THEN
    RAISE EXCEPTION 'hm04 catalog drift: prerequisite-relations' USING ERRCODE='P7603';
  END IF;
  SELECT q.value INTO actual_value FROM (
SELECT pg_catalog.to_jsonb(pg_catalog.encode(pg_catalog.sha256(pg_catalog.convert_to(q.value::text,'UTF8')),'hex')) AS value FROM (
SELECT pg_catalog.jsonb_agg(pg_catalog.to_jsonb(t) ORDER BY t.oid) AS value
  FROM pg_catalog.pg_type t JOIN pg_catalog.pg_namespace n ON n.oid=t.typnamespace WHERE n.nspname IN ('jetnity_ot_auth','official_v3_method_private','official_v3_method_api','official_v3_intake_private','official_v3_intake_api')
) q
  ) q;
  SELECT fingerprint INTO bound_value FROM official_v3_jobs_private.catalog_binding_v1 WHERE object_identity='prerequisite-types';
  IF actual_value IS DISTINCT FROM bound_value THEN
    RAISE EXCEPTION 'hm04 catalog drift: prerequisite-types' USING ERRCODE='P7603';
  END IF;
  SELECT q.value INTO actual_value FROM (
SELECT pg_catalog.to_jsonb(pg_catalog.encode(pg_catalog.sha256(pg_catalog.convert_to(q.value::text,'UTF8')),'hex')) AS value FROM (
SELECT pg_catalog.jsonb_agg(pg_catalog.to_jsonb(n) ORDER BY n.oid) AS value
  FROM pg_catalog.pg_namespace n WHERE n.nspname IN ('jetnity_ot_auth','official_v3_method_private','official_v3_method_api','official_v3_intake_private','official_v3_intake_api')
) q
  ) q;
  SELECT fingerprint INTO bound_value FROM official_v3_jobs_private.catalog_binding_v1 WHERE object_identity='prerequisite-schemas';
  IF actual_value IS DISTINCT FROM bound_value THEN
    RAISE EXCEPTION 'hm04 catalog drift: prerequisite-schemas' USING ERRCODE='P7603';
  END IF;
  SELECT q.value INTO actual_value FROM (
WITH scope_schemas AS (
  SELECT n.oid,n.nspname FROM pg_catalog.pg_namespace n WHERE n.nspname IN ('jetnity_ot_auth','official_v3_method_private','official_v3_method_api','official_v3_intake_private','official_v3_intake_api')
), scope_tables AS (
  SELECT c.oid,c.reltoastrelid FROM pg_catalog.pg_class c JOIN scope_schemas n ON n.oid=c.relnamespace WHERE c.relkind='r'
), scope_classes AS (
  SELECT c.oid FROM pg_catalog.pg_class c JOIN scope_schemas n ON n.oid=c.relnamespace
  UNION SELECT t.reltoastrelid FROM scope_tables t WHERE t.reltoastrelid<>0
  UNION SELECT i.indexrelid FROM pg_catalog.pg_index i JOIN scope_tables t ON i.indrelid=t.reltoastrelid WHERE t.reltoastrelid<>0
), scope_objects AS (
  SELECT 'pg_catalog.pg_namespace'::pg_catalog.regclass::oid AS classid,n.oid AS objid FROM scope_schemas n
  UNION SELECT 'pg_catalog.pg_class'::pg_catalog.regclass,c.oid FROM scope_classes c
  UNION SELECT 'pg_catalog.pg_type'::pg_catalog.regclass,t.oid FROM pg_catalog.pg_type t JOIN scope_schemas n ON n.oid=t.typnamespace
  UNION SELECT 'pg_catalog.pg_proc'::pg_catalog.regclass,p.oid FROM pg_catalog.pg_proc p JOIN scope_schemas n ON n.oid=p.pronamespace
  UNION SELECT 'pg_catalog.pg_constraint'::pg_catalog.regclass,c.oid FROM pg_catalog.pg_constraint c JOIN scope_tables t ON t.oid=c.conrelid
  UNION SELECT 'pg_catalog.pg_trigger'::pg_catalog.regclass,g.oid FROM pg_catalog.pg_trigger g JOIN scope_tables t ON t.oid=g.tgrelid
  UNION SELECT 'pg_catalog.pg_policy'::pg_catalog.regclass,p.oid FROM pg_catalog.pg_policy p JOIN scope_tables t ON t.oid=p.polrelid
  UNION SELECT 'pg_catalog.pg_attrdef'::pg_catalog.regclass,d.oid FROM pg_catalog.pg_attrdef d JOIN scope_tables t ON t.oid=d.adrelid
)
SELECT pg_catalog.to_jsonb(pg_catalog.encode(pg_catalog.sha256(pg_catalog.convert_to(pg_catalog.jsonb_build_object(
  'dependencies',(SELECT pg_catalog.jsonb_agg(pg_catalog.to_jsonb(d) ORDER BY d.classid,d.objid,d.objsubid,d.refclassid,d.refobjid,d.refobjsubid,d.deptype)
    FROM pg_catalog.pg_depend d WHERE EXISTS(SELECT 1 FROM scope_objects o WHERE o.classid=d.classid AND o.objid=d.objid)
      OR EXISTS(SELECT 1 FROM scope_objects o WHERE o.classid=d.refclassid AND o.objid=d.refobjid)),
  'shared',(SELECT pg_catalog.jsonb_agg(pg_catalog.to_jsonb(d) ORDER BY d.dbid,d.classid,d.objid,d.objsubid,d.refclassid,d.refobjid,d.deptype)
    FROM pg_catalog.pg_shdepend d WHERE d.dbid=(SELECT b.oid FROM pg_catalog.pg_database b WHERE b.datname=current_database())
      AND EXISTS(SELECT 1 FROM scope_objects o WHERE o.classid=d.classid AND o.objid=d.objid)),
  'labels',(SELECT pg_catalog.jsonb_agg(pg_catalog.to_jsonb(s) ORDER BY s.classoid,s.objoid,s.objsubid,s.provider)
    FROM pg_catalog.pg_seclabel s JOIN scope_objects o ON o.classid=s.classoid AND o.objid=s.objoid),
  'descriptions',(SELECT pg_catalog.jsonb_agg(pg_catalog.to_jsonb(d) ORDER BY d.classoid,d.objoid,d.objsubid)
    FROM pg_catalog.pg_description d JOIN scope_objects o ON o.classid=d.classoid AND o.objid=d.objoid)
)::text,'UTF8')),'hex')) AS value
  ) q;
  SELECT fingerprint INTO bound_value FROM official_v3_jobs_private.catalog_binding_v1 WHERE object_identity='prerequisite-dependencies';
  IF actual_value IS DISTINCT FROM bound_value THEN
    RAISE EXCEPTION 'hm04 catalog drift: prerequisite-dependencies' USING ERRCODE='P7603';
  END IF;
  SELECT q.value INTO actual_value FROM (
SELECT pg_catalog.to_jsonb(pg_catalog.encode(pg_catalog.sha256(pg_catalog.convert_to(q.value::text,'UTF8')),'hex')) AS value FROM (
SELECT pg_catalog.jsonb_agg(pg_catalog.jsonb_build_object('oid',r.oid,'name',r.rolname,
 'super',r.rolsuper,'inherit',r.rolinherit,'login',r.rolcanlogin,'create_role',r.rolcreaterole,
 'create_db',r.rolcreatedb,'replicate',r.rolreplication,'bypass',r.rolbypassrls,'config',r.rolconfig,
 'connection_limit',r.rolconnlimit,'valid_until',r.rolvaliduntil,
 'settings',(SELECT pg_catalog.jsonb_agg(pg_catalog.to_jsonb(s) ORDER BY s.setdatabase,s.setrole)
   FROM pg_catalog.pg_db_role_setting s WHERE s.setrole=r.oid)) ORDER BY r.oid) AS value
 FROM pg_catalog.pg_roles r WHERE r.rolname IN ('postgres','ot_v3_jobs_owner','ot_v3_jobs_caller','ot_v3_intake_owner','ot_v3_intake_caller','ot_v3_method_reader')
) q
  ) q;
  SELECT fingerprint INTO bound_value FROM official_v3_jobs_private.catalog_binding_v1 WHERE object_identity='protected-roles';
  IF actual_value IS DISTINCT FROM bound_value THEN
    RAISE EXCEPTION 'hm04 catalog drift: protected-roles' USING ERRCODE='P7603';
  END IF;
  SELECT q.value INTO actual_value FROM (
SELECT pg_catalog.to_jsonb(pg_catalog.encode(pg_catalog.sha256(pg_catalog.convert_to(q.value::text,'UTF8')),'hex')) AS value FROM (
SELECT pg_catalog.jsonb_agg(pg_catalog.jsonb_build_object('role',m.roleid,'member',m.member,
 'grantor',m.grantor,'admin',m.admin_option,'inherit',m.inherit_option,'set',m.set_option)
 ORDER BY m.roleid,m.member,m.grantor) AS value FROM pg_catalog.pg_auth_members m
 WHERE (m.roleid='postgres'::pg_catalog.regrole OR m.member='postgres'::pg_catalog.regrole)
   AND NOT(m.roleid IN ('ot_v3_jobs_owner'::pg_catalog.regrole,'ot_v3_intake_owner'::pg_catalog.regrole)
     AND m.member='postgres'::pg_catalog.regrole AND m.grantor='postgres'::pg_catalog.regrole
     AND NOT m.admin_option AND NOT m.inherit_option AND m.set_option)
) q
  ) q;
  SELECT fingerprint INTO bound_value FROM official_v3_jobs_private.catalog_binding_v1 WHERE object_identity='creator-edges';
  IF actual_value IS DISTINCT FROM bound_value THEN
    RAISE EXCEPTION 'hm04 catalog drift: creator-edges' USING ERRCODE='P7603';
  END IF;
  SELECT q.value INTO actual_value FROM (
SELECT pg_catalog.jsonb_build_object('installer','postgres'::pg_catalog.regrole::oid,
 'entries',(SELECT pg_catalog.jsonb_agg(pg_catalog.to_jsonb(d) ORDER BY d.defaclrole,d.defaclnamespace,d.defaclobjtype)
 FROM pg_catalog.pg_default_acl d WHERE d.defaclrole IN
   (SELECT r.oid FROM pg_catalog.pg_roles r WHERE r.rolname IN ('postgres','ot_v3_jobs_owner','ot_v3_jobs_caller','ot_v3_intake_owner','ot_v3_intake_caller','ot_v3_method_reader'))
 OR d.defaclnamespace IN (SELECT n.oid FROM pg_catalog.pg_namespace n WHERE n.nspname IN ('official_v3_jobs_private','official_v3_jobs_api','jetnity_ot_auth','official_v3_method_private','official_v3_method_api','official_v3_intake_private','official_v3_intake_api')))) AS value
  ) q;
  SELECT fingerprint INTO bound_value FROM official_v3_jobs_private.catalog_binding_v1 WHERE object_identity='creator-defaults';
  IF actual_value IS DISTINCT FROM bound_value THEN
    RAISE EXCEPTION 'hm04 catalog drift: creator-defaults' USING ERRCODE='P7603';
  END IF;
  SELECT q.value INTO actual_value FROM (
SELECT pg_catalog.to_jsonb(pg_catalog.encode(pg_catalog.sha256(pg_catalog.convert_to(q.value::text,'UTF8')),'hex')) AS value FROM (
SELECT pg_catalog.jsonb_build_object('oid',d.oid,'name',d.datname,'owner',d.datdba,'acl',d.datacl,
 'encoding',d.encoding,'allow_connections',d.datallowconn,'connection_limit',d.datconnlimit,
 'settings',(SELECT pg_catalog.jsonb_agg(pg_catalog.to_jsonb(s) ORDER BY s.setrole)
   FROM pg_catalog.pg_db_role_setting s WHERE s.setdatabase=d.oid AND s.setrole=0)) AS value
 FROM pg_catalog.pg_database d WHERE d.datname=current_database()
) q
  ) q;
  SELECT fingerprint INTO bound_value FROM official_v3_jobs_private.catalog_binding_v1 WHERE object_identity='database';
  IF actual_value IS DISTINCT FROM bound_value THEN
    RAISE EXCEPTION 'hm04 catalog drift: database' USING ERRCODE='P7603';
  END IF;

  -- Exact protected owner edges. ADMIN-only bootstrap grants are never rewritten.
  IF EXISTS(SELECT 1 FROM pg_catalog.pg_roles r WHERE r.oid IN (owner_id,caller_id,intake_id)
      AND (r.rolcanlogin OR r.rolinherit OR r.rolsuper OR r.rolcreatedb OR r.rolcreaterole
        OR r.rolreplication OR r.rolbypassrls OR r.rolconfig IS NOT NULL OR r.rolconnlimit<>-1 OR r.rolvaliduntil IS NOT NULL))
    OR EXISTS(SELECT 1 FROM pg_catalog.pg_db_role_setting s WHERE s.setrole IN (owner_id,caller_id,intake_id))
    OR EXISTS(SELECT 1 FROM pg_catalog.pg_default_acl d WHERE d.defaclrole IN (owner_id,caller_id,intake_id))
    OR pg_catalog.has_database_privilege(owner_id,current_database(),'CREATE')
    OR pg_catalog.has_database_privilege(caller_id,current_database(),'CREATE')
    OR pg_catalog.has_database_privilege(intake_id,current_database(),'CREATE')
    OR NOT EXISTS(SELECT 1 FROM pg_catalog.pg_roles r WHERE r.oid=10 AND r.rolsuper) THEN
    RAISE EXCEPTION 'hm04 restricted role/default boundary' USING ERRCODE='P7603';
  END IF;
  IF (SELECT count(*) FROM pg_catalog.pg_auth_members m
      WHERE m.roleid=owner_id OR m.member=owner_id OR m.grantor=owner_id)<>1
    OR (SELECT count(*) FROM pg_catalog.pg_auth_members m
      WHERE m.roleid=owner_id AND m.member=creator AND m.grantor=10
        AND m.admin_option AND NOT m.inherit_option AND NOT m.set_option)<>1
    
    OR pg_catalog.pg_has_role(creator,owner_id,'USAGE')
    OR pg_catalog.pg_has_role(creator,owner_id,'SET') IS DISTINCT FROM false
    OR (SELECT count(*) FROM pg_catalog.pg_auth_members m
      WHERE m.roleid=intake_id OR m.member=intake_id OR m.grantor=intake_id)<>1
    OR (SELECT count(*) FROM pg_catalog.pg_auth_members m
      WHERE m.roleid=intake_id AND m.member=creator AND m.grantor=10
        AND m.admin_option AND NOT m.inherit_option AND NOT m.set_option)<>1
    
    OR pg_catalog.pg_has_role(creator,intake_id,'USAGE')
    OR pg_catalog.pg_has_role(creator,intake_id,'SET') IS DISTINCT FROM false THEN
    RAISE EXCEPTION 'hm04 exact protected membership boundary' USING ERRCODE='P7603';
  END IF;
  IF (SELECT count(*) FROM pg_catalog.pg_auth_members m WHERE m.roleid=caller_id
      AND m.member=creator AND m.grantor=10 AND m.admin_option AND NOT m.inherit_option AND NOT m.set_option)<>1
    OR EXISTS(SELECT 1 FROM pg_catalog.pg_auth_members m WHERE m.member=caller_id OR m.grantor=caller_id)
    OR pg_catalog.pg_has_role(creator,caller_id,'SET') OR pg_catalog.pg_has_role(creator,caller_id,'USAGE')
    OR (SELECT count(*) FROM pg_catalog.pg_auth_members m WHERE m.roleid=caller_id
      AND NOT(m.member=creator AND m.grantor=10 AND m.admin_option AND NOT m.inherit_option AND NOT m.set_option))>1 THEN
    RAISE EXCEPTION 'hm04 caller graph boundary' USING ERRCODE='P7603';
  END IF;
  -- A2: preprovisioned by the bound real Creator before the catalog freeze.
  -- This artifact creates no LOGIN, credential or runtime membership.
  SELECT m.member INTO login_id FROM pg_catalog.pg_auth_members m WHERE m.roleid=caller_id
    AND NOT(m.member=creator AND m.grantor=10 AND m.admin_option AND NOT m.inherit_option AND NOT m.set_option);
  IF login_id IS NOT NULL AND (
    NOT EXISTS(SELECT 1 FROM pg_catalog.pg_auth_members m WHERE m.roleid=caller_id AND m.member=login_id
      AND m.grantor=creator AND NOT m.admin_option AND NOT m.inherit_option AND m.set_option)
    OR NOT EXISTS(SELECT 1 FROM pg_catalog.pg_auth_members m WHERE m.roleid=login_id AND m.member=creator
      AND m.grantor=10 AND m.admin_option AND NOT m.inherit_option AND NOT m.set_option)
    OR (SELECT count(*) FROM pg_catalog.pg_auth_members m
      WHERE m.roleid=login_id OR m.member=login_id OR m.grantor=login_id)<>2
    OR pg_catalog.pg_has_role(creator,login_id,'USAGE')
    OR pg_catalog.pg_has_role(creator,login_id,'SET')
    OR NOT EXISTS(SELECT 1 FROM pg_catalog.pg_roles r WHERE r.oid=login_id
      AND r.rolcanlogin AND NOT r.rolinherit AND NOT r.rolsuper AND NOT r.rolcreatedb
      AND NOT r.rolcreaterole AND NOT r.rolreplication AND NOT r.rolbypassrls AND r.rolconfig IS NULL)
    OR EXISTS(SELECT 1 FROM pg_catalog.pg_db_role_setting s WHERE s.setrole=login_id)
    OR pg_catalog.has_database_privilege(login_id,current_database(),'CREATE')
    OR EXISTS(SELECT 1 FROM pg_catalog.pg_auth_members m
      WHERE (m.roleid=login_id OR m.member=login_id OR m.grantor=login_id)
        AND NOT(m.roleid=caller_id AND m.member=login_id AND m.grantor=creator
          AND NOT m.admin_option AND NOT m.inherit_option AND m.set_option
          OR m.roleid=login_id AND m.member=creator AND m.grantor=10
          AND m.admin_option AND NOT m.inherit_option AND NOT m.set_option))
    ) THEN
    RAISE EXCEPTION 'hm04 A2 exact restricted caller and creator-administration binding' USING ERRCODE='P7603';
  END IF;
  WITH scope_schemas AS (
  SELECT n.oid,n.nspname FROM pg_catalog.pg_namespace n WHERE n.nspname IN ('official_v3_jobs_private','official_v3_jobs_api')
), scope_tables AS (
  SELECT c.oid,c.reltoastrelid FROM pg_catalog.pg_class c JOIN scope_schemas n ON n.oid=c.relnamespace WHERE c.relkind='r'
), scope_classes AS (
  SELECT c.oid FROM pg_catalog.pg_class c JOIN scope_schemas n ON n.oid=c.relnamespace
  UNION SELECT t.reltoastrelid FROM scope_tables t WHERE t.reltoastrelid<>0
  UNION SELECT i.indexrelid FROM pg_catalog.pg_index i JOIN scope_tables t ON i.indrelid=t.reltoastrelid WHERE t.reltoastrelid<>0
), scope_objects AS (
  SELECT 'pg_catalog.pg_namespace'::pg_catalog.regclass::oid AS classid,n.oid AS objid FROM scope_schemas n
  UNION SELECT 'pg_catalog.pg_class'::pg_catalog.regclass,c.oid FROM scope_classes c
  UNION SELECT 'pg_catalog.pg_type'::pg_catalog.regclass,t.oid FROM pg_catalog.pg_type t JOIN scope_schemas n ON n.oid=t.typnamespace
  UNION SELECT 'pg_catalog.pg_proc'::pg_catalog.regclass,p.oid FROM pg_catalog.pg_proc p JOIN scope_schemas n ON n.oid=p.pronamespace
  UNION SELECT 'pg_catalog.pg_constraint'::pg_catalog.regclass,c.oid FROM pg_catalog.pg_constraint c JOIN scope_tables t ON t.oid=c.conrelid
  UNION SELECT 'pg_catalog.pg_trigger'::pg_catalog.regclass,g.oid FROM pg_catalog.pg_trigger g JOIN scope_tables t ON t.oid=g.tgrelid
  UNION SELECT 'pg_catalog.pg_policy'::pg_catalog.regclass,p.oid FROM pg_catalog.pg_policy p JOIN scope_tables t ON t.oid=p.polrelid
  UNION SELECT 'pg_catalog.pg_attrdef'::pg_catalog.regclass,d.oid FROM pg_catalog.pg_attrdef d JOIN scope_tables t ON t.oid=d.adrelid
)
  SELECT EXISTS(SELECT 1 FROM pg_catalog.pg_depend d JOIN scope_objects r ON r.classid=d.refclassid AND r.objid=d.refobjid
      WHERE NOT EXISTS(SELECT 1 FROM scope_objects o WHERE o.classid=d.classid AND o.objid=d.objid))
    OR EXISTS(SELECT 1 FROM pg_catalog.pg_depend d JOIN scope_objects o ON o.classid=d.classid AND o.objid=d.objid WHERE d.deptype IN ('e','x'))
    OR EXISTS(SELECT 1 FROM pg_catalog.pg_shdepend d WHERE d.refclassid='pg_catalog.pg_authid'::pg_catalog.regclass
      AND d.refobjid IN (owner_id,caller_id)
      AND NOT(d.dbid=(SELECT b.oid FROM pg_catalog.pg_database b WHERE b.datname=current_database())
        AND EXISTS(SELECT 1 FROM scope_objects o WHERE o.classid=d.classid AND o.objid=d.objid))
      AND NOT(d.dbid=0 AND d.classid='pg_catalog.pg_auth_members'::pg_catalog.regclass))
    OR EXISTS(SELECT 1 FROM pg_catalog.pg_seclabel s JOIN scope_objects o ON o.classid=s.classoid AND o.objid=s.objoid)
    OR EXISTS(SELECT 1 FROM pg_catalog.pg_description d JOIN scope_objects o ON o.classid=d.classoid AND o.objid=d.objoid)
    OR EXISTS(SELECT 1 FROM pg_catalog.pg_shdescription d WHERE d.classoid='pg_catalog.pg_authid'::pg_catalog.regclass AND d.objoid IN (owner_id,caller_id))
    OR EXISTS(SELECT 1 FROM pg_catalog.pg_shseclabel s WHERE s.classoid='pg_catalog.pg_authid'::pg_catalog.regclass AND s.objoid IN (owner_id,caller_id))
    INTO foreign_dependency;
  IF foreign_dependency THEN
    RAISE EXCEPTION 'hm04 unknown consumer/ownership/extension/label' USING ERRCODE='P7603';
  END IF;
  -- Original HS1 ownership remains closed plus exactly the two selected bridges.
  WITH scope_schemas AS (
  SELECT n.oid,n.nspname FROM pg_catalog.pg_namespace n WHERE n.nspname IN ('jetnity_ot_auth','official_v3_method_private','official_v3_method_api','official_v3_intake_private','official_v3_intake_api')
), scope_tables AS (
  SELECT c.oid,c.reltoastrelid FROM pg_catalog.pg_class c JOIN scope_schemas n ON n.oid=c.relnamespace WHERE c.relkind='r'
), scope_classes AS (
  SELECT c.oid FROM pg_catalog.pg_class c JOIN scope_schemas n ON n.oid=c.relnamespace
  UNION SELECT t.reltoastrelid FROM scope_tables t WHERE t.reltoastrelid<>0
  UNION SELECT i.indexrelid FROM pg_catalog.pg_index i JOIN scope_tables t ON i.indrelid=t.reltoastrelid WHERE t.reltoastrelid<>0
), scope_objects AS (
  SELECT 'pg_catalog.pg_namespace'::pg_catalog.regclass::oid AS classid,n.oid AS objid FROM scope_schemas n
  UNION SELECT 'pg_catalog.pg_class'::pg_catalog.regclass,c.oid FROM scope_classes c
  UNION SELECT 'pg_catalog.pg_type'::pg_catalog.regclass,t.oid FROM pg_catalog.pg_type t JOIN scope_schemas n ON n.oid=t.typnamespace
  UNION SELECT 'pg_catalog.pg_proc'::pg_catalog.regclass,p.oid FROM pg_catalog.pg_proc p JOIN scope_schemas n ON n.oid=p.pronamespace
  UNION SELECT 'pg_catalog.pg_constraint'::pg_catalog.regclass,c.oid FROM pg_catalog.pg_constraint c JOIN scope_tables t ON t.oid=c.conrelid
  UNION SELECT 'pg_catalog.pg_trigger'::pg_catalog.regclass,g.oid FROM pg_catalog.pg_trigger g JOIN scope_tables t ON t.oid=g.tgrelid
  UNION SELECT 'pg_catalog.pg_policy'::pg_catalog.regclass,p.oid FROM pg_catalog.pg_policy p JOIN scope_tables t ON t.oid=p.polrelid
  UNION SELECT 'pg_catalog.pg_attrdef'::pg_catalog.regclass,d.oid FROM pg_catalog.pg_attrdef d JOIN scope_tables t ON t.oid=d.adrelid
)
  SELECT EXISTS(SELECT 1 FROM pg_catalog.pg_shdepend d WHERE d.refclassid='pg_catalog.pg_authid'::pg_catalog.regclass
    AND d.refobjid=intake_id AND d.deptype='o'
    AND NOT(d.dbid=(SELECT b.oid FROM pg_catalog.pg_database b WHERE b.datname=current_database())
      AND (EXISTS(SELECT 1 FROM scope_objects o WHERE o.classid=d.classid AND o.objid=d.objid)
        OR d.classid='pg_catalog.pg_proc'::pg_catalog.regclass AND EXISTS(SELECT 1 FROM pg_catalog.pg_proc p JOIN pg_catalog.pg_namespace n ON n.oid=p.pronamespace
          WHERE p.oid=d.objid AND n.nspname='official_v3_jobs_private' AND p.proname IN ('s1_read_v1','s1_shape_v1') AND p.proowner=intake_id))))
    INTO foreign_dependency;
  IF foreign_dependency THEN
    RAISE EXCEPTION 'hm04 HS1 owner foreign object' USING ERRCODE='P7603';
  END IF;
END $$;

-- The API owns relation/advisory/subject locks and all-history admission. Helpers
-- stage immediate effects and return only this private bundle; final S1/MA1 is later.
CREATE FUNCTION official_v3_jobs_private.tx_queue_read_v1(q jsonb,b jsonb,e integer,remaining integer,deadline timestamptz) RETURNS jsonb
LANGUAGE plpgsql VOLATILE PARALLEL UNSAFE SECURITY INVOKER CALLED ON NULL INPUT SET search_path=pg_catalog,pg_temp AS $$
DECLARE s official_v3_jobs_private.subjects_v1%ROWTYPE;
BEGIN
  SELECT * INTO s FROM official_v3_jobs_private.subjects_v1 WHERE job_key=q#>>'{body,jobKey}';
  IF NOT FOUND THEN RETURN jsonb_build_object('reply',jsonb_build_object('status','absent'),'authority',false); END IF;
  RETURN jsonb_build_object('reply',jsonb_build_object('status','present','record',s.current_job),'authority',true);
END $$;
CREATE FUNCTION official_v3_jobs_private.tx_queue_confirm_v1(q jsonb,b jsonb,e integer,remaining integer,deadline timestamptz) RETURNS jsonb
LANGUAGE plpgsql VOLATILE PARALLEL UNSAFE SECURITY INVOKER CALLED ON NULL INPUT SET search_path=pg_catalog,pg_temp AS $$
DECLARE c jsonb:=official_v3_jobs_private.command_v1(q#>'{body,command}'); o official_v3_jobs_private.queue_operations_v1%ROWTYPE;
BEGIN
  SELECT * INTO o FROM official_v3_jobs_private.queue_operations_v1 WHERE operation_id=c->>'operationId';
  IF NOT FOUND THEN RETURN jsonb_build_object('reply',jsonb_build_object('status','not_attempted'),'authority',false); END IF;
  IF o.command_text IS DISTINCT FROM c->>'commandText' OR o.command_key IS DISTINCT FROM c->>'commandKey' OR o.job_key IS DISTINCT FROM c->>'jobKey' THEN
    RETURN jsonb_build_object('reply',jsonb_build_object('status','collision'),'authority',false); END IF;
  RETURN jsonb_build_object('reply',jsonb_build_object('status','committed','operationId',o.operation_id,'commandKey',o.command_key,
    'commandText',o.command_text,'envelopeText',o.envelope_text,'record',o.envelope_text::jsonb->'next'),'authority',true);
END $$;
CREATE FUNCTION official_v3_jobs_private.tx_execution_read_v1(q jsonb,b jsonb,e integer,remaining integer,deadline timestamptz) RETURNS jsonb
LANGUAGE plpgsql VOLATILE PARALLEL UNSAFE SECURITY INVOKER CALLED ON NULL INPUT SET search_path=pg_catalog,pg_temp AS $$
DECLARE claim jsonb:=q#>'{body,claim}'; s official_v3_jobs_private.subjects_v1%ROWTYPE; t official_v3_jobs_private.execution_starts_v1%ROWTYPE;
  r official_v3_jobs_private.execution_results_v1%ROWTYPE; d official_v3_jobs_private.execution_dispositions_v1%ROWTYPE; c jsonb; response jsonb; lease text;
BEGIN
  SELECT * INTO s FROM official_v3_jobs_private.subjects_v1 WHERE job_key=claim->>'jobKey';
  SELECT * INTO t FROM official_v3_jobs_private.execution_starts_v1 WHERE claim_operation_id=claim->>'operationId';
  IF NOT FOUND THEN RETURN jsonb_build_object('reply',jsonb_build_object('status','absent'),'authority',false); END IF;
  IF t.claim_text IS DISTINCT FROM official_v3_jobs_private.canonical_v1(claim,0) OR t.job_key IS DISTINCT FROM s.job_key THEN
    RETURN jsonb_build_object('reply',jsonb_build_object('status','collision'),'authority',false); END IF;
  SELECT * INTO r FROM official_v3_jobs_private.execution_results_v1 WHERE attempt_key=t.attempt_key;
  IF NOT FOUND THEN RETURN jsonb_build_object('reply',jsonb_build_object('status','blocked'),'authority',false); END IF;
  SELECT * INTO d FROM official_v3_jobs_private.execution_dispositions_v1 WHERE attempt_key=t.attempt_key;
  IF d.attempt_key IS NULL THEN
    IF s.current_job IS DISTINCT FROM t.leased_job OR s.open_attempt IS DISTINCT FROM t.attempt_key THEN
      RETURN jsonb_build_object('reply',jsonb_build_object('status','blocked'),'authority',false); END IF;
    response:=jsonb_build_object('status','prepared','attemptKey',t.attempt_key,'claim',claim,'leasedJob',t.leased_job,'result',r.result,'references',r."references");
    lease:=t.leased_job#>>'{lease,expiresAt}';
  ELSIF d.kind='completed' THEN
    SELECT envelope_text::jsonb INTO c FROM official_v3_jobs_private.queue_operations_v1 WHERE operation_id=d.queue_operation_id;
    IF c->'expected' IS DISTINCT FROM t.leased_job OR c->'next' IS DISTINCT FROM s.current_job OR s.current_job->>'state'<>'succeeded'
      OR s.current_job->'jobId' IS DISTINCT FROM t.leased_job->'jobId' THEN
      RETURN jsonb_build_object('reply',jsonb_build_object('status','blocked'),'authority',false); END IF;
    response:=jsonb_build_object('status','completed','attemptKey',t.attempt_key,'claim',claim,'leasedJob',t.leased_job,
      'job',s.current_job,'result',r.result,'references',r."references");
  ELSE RETURN jsonb_build_object('reply',jsonb_build_object('status','blocked'),'authority',false); END IF;
  IF q->>'phase'='authorized' AND t.authority IS DISTINCT FROM (b||jsonb_build_object('epoch',e)) THEN
    RETURN jsonb_build_object('reply',jsonb_build_object('status','blocked'),'authority',false); END IF;
  RETURN jsonb_build_object('reply',response,'authority',true,'references',r."references",'job',t.leased_job,'result',r.result,'lease',lease);
END $$;
CREATE FUNCTION official_v3_jobs_private.tx_execution_start_v1(q jsonb,b jsonb,e integer,remaining integer,deadline timestamptz) RETURNS jsonb
LANGUAGE plpgsql VOLATILE PARALLEL UNSAFE SECURITY INVOKER CALLED ON NULL INPUT SET search_path=pg_catalog,pg_temp AS $$
DECLARE i jsonb:=q->'body'; claim jsonb:=i->'claim'; job jsonb:=official_v3_jobs_private.job_v1(i->'leasedJob');
  s official_v3_jobs_private.subjects_v1%ROWTYPE; o official_v3_jobs_private.queue_operations_v1%ROWTYPE; a jsonb:=b||jsonb_build_object('epoch',e);
  attempt text; token text;
BEGIN
  SELECT * INTO s FROM official_v3_jobs_private.subjects_v1 WHERE job_key=claim->>'jobKey';
  IF NOT FOUND OR s.open_attempt IS NOT NULL OR s.current_job IS DISTINCT FROM job OR s.subject_text IS DISTINCT FROM i->>'subjectText'
    OR job->>'state'<>'leased' OR s.terminal_credit_claim IS DISTINCT FROM claim->>'operationId' THEN
    RETURN jsonb_build_object('reply',jsonb_build_object('status','blocked'),'authority',false); END IF;
  SELECT * INTO o FROM official_v3_jobs_private.queue_operations_v1 WHERE operation_id=claim->>'operationId';
  IF NOT FOUND OR o.job_key IS DISTINCT FROM s.job_key OR o.action<>'claim' OR o.command_text::jsonb->'input' IS DISTINCT FROM claim
    OR o.envelope_text::jsonb->'next' IS DISTINCT FROM job OR EXISTS(SELECT 1 FROM official_v3_jobs_private.execution_starts_v1 WHERE claim_operation_id=o.operation_id) THEN
    RETURN jsonb_build_object('reply',jsonb_build_object('status','blocked'),'authority',false); END IF;
  IF s.start_count>=64 OR s.operation_count>=256 OR s.operation_count+1>256 THEN
    RETURN jsonb_build_object('reply',jsonb_build_object('status','quota'),'authority',false); END IF;
  attempt:='execution-attempt:v3:'||encode(sha256(convert_to(official_v3_jobs_private.canonical_v1(jsonb_build_object(
    'subject',s.subject_text::jsonb,'claim',claim,'leasedJob',job,'authority',a),0),'UTF8')),'hex');
  token:=replace(gen_random_uuid()::text,'-','')||replace(gen_random_uuid()::text,'-','');
  INSERT INTO official_v3_jobs_private.execution_starts_v1(attempt_key,job_key,claim_operation_id,claim_text,leased_job,authority,token_hash,reserved_at)
    VALUES(attempt,s.job_key,o.operation_id,official_v3_jobs_private.canonical_v1(claim,0),job,a,encode(sha256(convert_to(token,'UTF8')),'hex'),clock_timestamp());
  UPDATE official_v3_jobs_private.subjects_v1 SET start_count=start_count+1,open_attempt=attempt WHERE job_key=s.job_key;
  RETURN jsonb_build_object('reply',jsonb_build_object('status','reserved','attemptKey',attempt,'token',token,'claim',claim,'leasedJob',job),
    'authority',true,'lease',job#>>'{lease,expiresAt}');
END $$;
CREATE FUNCTION official_v3_jobs_private.tx_execution_prepare_v1(q jsonb,b jsonb,e integer,remaining integer,deadline timestamptz) RETURNS jsonb
LANGUAGE plpgsql VOLATILE PARALLEL UNSAFE SECURITY INVOKER CALLED ON NULL INPUT SET search_path=pg_catalog,pg_temp AS $$
DECLARE i jsonb:=q->'body'; t official_v3_jobs_private.execution_starts_v1%ROWTYPE; s official_v3_jobs_private.subjects_v1%ROWTYPE;
  old official_v3_jobs_private.execution_results_v1%ROWTYPE; r jsonb:=i->'result'; refs jsonb:=i->'references'; ref jsonb; opids text[]:='{}'; digests text[]:='{}';
  total integer:=0; previous_op text; expected_ref text; fence jsonb; prepared timestamptz; kind text;
BEGIN
  SELECT * INTO t FROM official_v3_jobs_private.execution_starts_v1 WHERE attempt_key=i->>'attemptKey';
  IF NOT FOUND OR t.claim_text IS DISTINCT FROM official_v3_jobs_private.canonical_v1(i->'claim',0)
    OR t.token_hash IS DISTINCT FROM encode(sha256(convert_to(i->>'token','UTF8')),'hex')
    OR t.authority IS DISTINCT FROM (b||jsonb_build_object('epoch',e)) THEN
    RETURN jsonb_build_object('reply',jsonb_build_object('status','blocked'),'authority',false); END IF;
  SELECT * INTO s FROM official_v3_jobs_private.subjects_v1 WHERE job_key=t.job_key;
  IF s.open_attempt IS DISTINCT FROM t.attempt_key OR s.current_job IS DISTINCT FROM t.leased_job
    OR EXISTS(SELECT 1 FROM official_v3_jobs_private.execution_dispositions_v1 WHERE attempt_key=t.attempt_key) THEN
    RETURN jsonb_build_object('reply',jsonb_build_object('status','blocked'),'authority',false); END IF;
  kind:=CASE WHEN t.leased_job->>'kind'='research_job_record' THEN 'rule_research' ELSE 'combination_discovery' END;
  IF official_v3_jobs_private.exact_keys_v1(r,ARRAY['kind','jobId','operationId','jobKey','preparedAt']||CASE WHEN kind='rule_research' THEN ARRAY['decisionRef'] ELSE ARRAY['discoveryRef','proposalDigests'] END) IS NOT TRUE
    OR r->>'kind' IS DISTINCT FROM kind OR r->'jobId' IS DISTINCT FROM t.leased_job->'jobId' OR r->'operationId' IS DISTINCT FROM t.leased_job->'operationId'
    OR r->>'jobKey' IS DISTINCT FROM t.job_key OR octet_length(official_v3_jobs_private.canonical_v1(r,0))>65536
    OR jsonb_typeof(refs) IS DISTINCT FROM 'array' OR jsonb_array_length(refs) NOT BETWEEN 1 AND 16
    OR (kind='rule_research' AND jsonb_array_length(refs)<>1) OR octet_length(official_v3_jobs_private.canonical_v1(refs,0))>65536 THEN
    RAISE EXCEPTION 'm04 invalid prepared result' USING ERRCODE='P7601'; END IF;
  prepared:=official_v3_jobs_private.timestamp_v1(r->>'preparedAt');
  IF prepared<official_v3_jobs_private.timestamp_v1(t.leased_job->>'createdAt') OR prepared>clock_timestamp() THEN RAISE EXCEPTION 'm04 invalid prepared time' USING ERRCODE='P7601'; END IF;
  FOR ref IN SELECT value FROM jsonb_array_elements(refs) LOOP
    PERFORM official_v3_jobs_private.reference_v1(ref);
    IF ref#>'{binding,jobId}' IS DISTINCT FROM t.leased_job->'jobId' OR ref#>'{binding,method}' IS DISTINCT FROM (b-'methodDigest'-'packageDigest')
      OR ref#>>'{binding,operationId}'=ANY(opids) OR ref->>'proposalDigest'=ANY(digests)
      OR (previous_op IS NOT NULL AND (ref#>>'{binding,operationId}') COLLATE "C"<=previous_op COLLATE "C")
      OR (kind='rule_research' AND ref#>'{binding,contextKey}' IS DISTINCT FROM t.leased_job->'contextKey') THEN RAISE EXCEPTION 'm04 prepared binding mismatch' USING ERRCODE='P7601'; END IF;
    previous_op:=ref#>>'{binding,operationId}'; opids:=array_append(opids,previous_op); digests:=array_append(digests,ref->>'proposalDigest'); total:=total+(ref->>'bytes')::integer;
  END LOOP;
  IF total>1048576 THEN RAISE EXCEPTION 'm04 prepared byte bound' USING ERRCODE='P7601'; END IF;
  IF kind='rule_research' THEN
    IF (r->>'decisionRef' ~ '^source-decision:v3:[a-f0-9]{64}$') IS NOT TRUE THEN RAISE EXCEPTION 'm04 decision reference' USING ERRCODE='P7601'; END IF;
  ELSE
    SELECT array_agg(v ORDER BY v COLLATE "C") INTO digests FROM unnest(digests) v;
    fence:=jsonb_build_object('jobId',t.leased_job->'jobId','revision',t.leased_job->'revision','leaseId',t.leased_job#>'{lease,leaseId}','generation',t.leased_job#>'{lease,generation}');
    expected_ref:='combination-discovery-result:v3:'||encode(sha256(convert_to(official_v3_jobs_private.canonical_v1(jsonb_build_object('jobId',r->'jobId',
      'operationId',r->'operationId','jobKey',t.job_key,'claim',i->'claim','fence',fence,'proposalDigests',to_jsonb(digests)),0),'UTF8')),'hex');
    IF r->'proposalDigests' IS DISTINCT FROM to_jsonb(digests) OR r->>'discoveryRef' IS DISTINCT FROM expected_ref THEN RAISE EXCEPTION 'm04 discovery reference' USING ERRCODE='P7601'; END IF;
  END IF;
  SELECT * INTO old FROM official_v3_jobs_private.execution_results_v1 WHERE attempt_key=t.attempt_key;
  IF FOUND THEN
    IF old.result IS DISTINCT FROM r OR old."references" IS DISTINCT FROM refs THEN RETURN jsonb_build_object('reply',jsonb_build_object('status','collision'),'authority',false); END IF;
  ELSE
    INSERT INTO official_v3_jobs_private.execution_results_v1(attempt_key,result,"references",prepared_at) VALUES(t.attempt_key,r,refs,prepared);
  END IF;
  RETURN jsonb_build_object('reply',jsonb_build_object('status','prepared','attemptKey',t.attempt_key,'result',r,'references',refs),
    'authority',true,'references',refs,'job',t.leased_job,'result',r,'lease',t.leased_job#>>'{lease,expiresAt}');
END $$;
CREATE FUNCTION official_v3_jobs_private.tx_queue_cas_v1(q jsonb,b jsonb,e integer,remaining integer,deadline timestamptz) RETURNS jsonb
LANGUAGE plpgsql VOLATILE PARALLEL UNSAFE SECURITY INVOKER CALLED ON NULL INPUT SET search_path=pg_catalog,pg_temp AS $$
DECLARE i jsonb:=q->'body'; c jsonb:=official_v3_jobs_private.command_v1(i->'command'); v jsonb:=i->'commit'; disposition jsonb:=i->'disposition';
  s official_v3_jobs_private.subjects_v1%ROWTYPE; old official_v3_jobs_private.queue_operations_v1%ROWTYPE; t official_v3_jobs_private.execution_starts_v1%ROWTYPE;
  r official_v3_jobs_private.execution_results_v1%ROWTYPE; identity jsonb; current_record jsonb; next_record jsonb; new_credit text; slot_choice integer; cycle text;
  a jsonb:=b||jsonb_build_object('epoch',e); terminal boolean:=false;
BEGIN
  SELECT * INTO old FROM official_v3_jobs_private.queue_operations_v1 WHERE operation_id=c->>'operationId';
  IF FOUND THEN
    IF old.command_text IS DISTINCT FROM c->>'commandText' OR old.command_key IS DISTINCT FROM c->>'commandKey'
      OR old.envelope_text IS DISTINCT FROM official_v3_jobs_private.canonical_v1(v,0) THEN
      RETURN jsonb_build_object('reply',jsonb_build_object('status','collision'),'authority',false); END IF;
    RETURN jsonb_build_object('reply',jsonb_build_object('status','committed','record',old.envelope_text::jsonb->'next'),'authority',true);
  END IF;
  SELECT * INTO s FROM official_v3_jobs_private.subjects_v1 WHERE job_key=c->>'jobKey';
  current_record:=COALESCE(s.current_job,'null'::jsonb);
  IF v->'expected' IS DISTINCT FROM current_record THEN RETURN jsonb_build_object('reply',jsonb_build_object('status','mismatch'),'authority',false); END IF;
  PERFORM official_v3_jobs_private.transition_v1(c->'value',current_record,v);
  next_record:=v->'next';
  identity:=CASE WHEN next_record->>'kind'='research_job_record' THEN official_v3_jobs_private.subject_v1('rule_research',jsonb_build_object(
    'context',next_record->'context','method',next_record->'method','factKind',next_record#>'{research,factKind}','researchReason',next_record#>'{research,researchReason}'))
    ELSE official_v3_jobs_private.subject_v1('combination_discovery',(next_record->'identity')-'kind'-'jobKey') END;
  IF identity->>'jobKey' IS DISTINCT FROM c->>'jobKey' OR identity->>'subjectText' IS DISTINCT FROM i->>'subjectText'
    OR COALESCE(next_record->'method',next_record#>'{identity,method}') IS DISTINCT FROM (b-'methodDigest'-'packageDigest')
    OR (s.job_key IS NOT NULL AND (s.subject_text IS DISTINCT FROM i->>'subjectText' OR s.method_binding IS DISTINCT FROM b)) THEN
    RAISE EXCEPTION 'm04 full subject mismatch' USING ERRCODE='P7601'; END IF;
  IF c->>'action'='enqueue' AND v#>>'{audit,kind}'='enqueued' THEN
    cycle:=next_record->>'jobId';
    IF EXISTS(SELECT 1 FROM official_v3_jobs_private.queue_operations_v1 WHERE new_cycle_job_id=cycle) THEN
      RETURN jsonb_build_object('reply',jsonb_build_object('status','collision'),'authority',false); END IF;
  END IF;
  IF disposition->>'kind'<>'regular' THEN
    SELECT * INTO t FROM official_v3_jobs_private.execution_starts_v1 WHERE attempt_key=disposition->>'attemptKey';
    IF NOT FOUND OR s.open_attempt IS DISTINCT FROM t.attempt_key OR t.job_key IS DISTINCT FROM s.job_key
      OR current_record IS DISTINCT FROM t.leased_job OR t.authority IS DISTINCT FROM a
      OR EXISTS(SELECT 1 FROM official_v3_jobs_private.execution_dispositions_v1 WHERE attempt_key=t.attempt_key) THEN
      RETURN jsonb_build_object('reply',jsonb_build_object('status','blocked'),'authority',false); END IF;
    SELECT * INTO r FROM official_v3_jobs_private.execution_results_v1 WHERE attempt_key=t.attempt_key;
    IF disposition->>'kind'='completed' THEN
      IF c->>'action'<>'complete' OR r.attempt_key IS NULL OR COALESCE(c#>'{value,input,decisionRef}',c#>'{value,input,discoveryRef}')
        IS DISTINCT FROM COALESCE(r.result->'decisionRef',r.result->'discoveryRef') THEN
        RETURN jsonb_build_object('reply',jsonb_build_object('status','blocked'),'authority',false); END IF;
    ELSE
      -- SQL proves its immutable reservation secret and absence of PREPARED. It cannot
      -- observe producer termination. Only the reviewed private composition may call
      -- this fixed runtime role after actual delivery/callback/native terminal custody.
      IF c->>'action'<>'fail' OR c#>>'{value,input,reason}' NOT IN ('unreachable','invalid_proposal','verification_unavailable')
        OR r.attempt_key IS NOT NULL OR t.token_hash IS DISTINCT FROM encode(sha256(convert_to(disposition->>'token','UTF8')),'hex') THEN
        RETURN jsonb_build_object('reply',jsonb_build_object('status','blocked'),'authority',false); END IF;
    END IF;
    terminal:=true;
  ELSIF s.open_attempt IS NOT NULL OR c->>'action'='complete' THEN
    RETURN jsonb_build_object('reply',jsonb_build_object('status','blocked'),'authority',false);
  END IF;
  new_credit:=CASE WHEN next_record->>'state'='leased' THEN
    CASE WHEN c->>'action'='claim' THEN c->>'operationId' ELSE s.terminal_credit_claim END ELSE NULL END;
  IF COALESCE(s.operation_count,0)+1+(CASE WHEN new_credit IS NULL THEN 0 ELSE 1 END)>256
    OR (c->>'action'='claim' AND next_record->>'state'='leased' AND s.start_count>=64) THEN
    RETURN jsonb_build_object('reply',jsonb_build_object('status','quota'),'authority',false); END IF;
  IF s.job_key IS NULL THEN
    IF c->>'action'<>'enqueue' THEN RAISE EXCEPTION 'm04 missing subject' USING ERRCODE='P7601'; END IF;
    SELECT slot_id INTO slot_choice FROM official_v3_jobs_private.slots_v1 WHERE job_key IS NULL ORDER BY slot_id FOR UPDATE SKIP LOCKED LIMIT 1;
    IF slot_choice IS NULL THEN RETURN jsonb_build_object('reply',jsonb_build_object('status','quota'),'authority',false); END IF;
    UPDATE official_v3_jobs_private.slots_v1 SET job_key=c->>'jobKey' WHERE slot_id=slot_choice;
    INSERT INTO official_v3_jobs_private.subjects_v1(job_key,slot_id,kind,subject_text,method_binding,current_job,operation_count,start_count)
      VALUES(c->>'jobKey',slot_choice,c->>'kind',i->>'subjectText',b,next_record,0,0);
  END IF;
  INSERT INTO official_v3_jobs_private.queue_operations_v1(operation_id,job_key,action,command_key,command_text,envelope_text,audit_reference,new_cycle_job_id,authority,recorded_at)
    VALUES(c->>'operationId',c->>'jobKey',c->>'action',c->>'commandKey',c->>'commandText',official_v3_jobs_private.canonical_v1(v,0),v#>>'{audit,reference}',cycle,a,clock_timestamp());
  IF terminal THEN
    INSERT INTO official_v3_jobs_private.execution_dispositions_v1(attempt_key,queue_operation_id,kind,failure_reason,settled_at)
      VALUES(t.attempt_key,c->>'operationId',disposition->>'kind',CASE WHEN disposition->>'kind'='settled_failure' THEN c#>>'{value,input,reason}' END,clock_timestamp());
  END IF;
  UPDATE official_v3_jobs_private.subjects_v1 SET current_job=next_record,operation_count=operation_count+1,
    open_attempt=CASE WHEN terminal THEN NULL ELSE open_attempt END,terminal_credit_claim=new_credit WHERE job_key=c->>'jobKey';
  RETURN jsonb_build_object('reply',jsonb_build_object('status','committed','record',next_record),'authority',true,
    'references',r."references",'job',t.leased_job,'result',r.result,
    'lease',CASE WHEN c->>'action' IN ('complete','fail') THEN current_record#>>'{lease,expiresAt}'
      WHEN c->>'action'='claim' AND next_record->>'state'='leased' THEN next_record#>>'{lease,expiresAt}' END,
    'observedAt',v#>>'{audit,observedAt}',
    'dueAt',CASE WHEN c->>'action'='claim' THEN CASE current_record->>'state' WHEN 'backoff' THEN current_record->>'nextAttemptAt' WHEN 'leased' THEN current_record#>>'{lease,expiresAt}' END END);
END $$;

CREATE FUNCTION official_v3_jobs_api.execute_v1(wire text,method_id text,revision integer,method_digest text,package_digest text,epoch integer,remaining_ms integer,absolute_not_after text) RETURNS jsonb
LANGUAGE plpgsql VOLATILE PARALLEL UNSAFE SECURITY DEFINER CALLED ON NULL INPUT SET search_path=pg_catalog,pg_temp AS $$
DECLARE deadline timestamptz; entry timestamptz:=statement_timestamp(); q jsonb; i jsonb; operation text; phase text; b jsonb; c jsonb; claim jsonb;
  k text; lock_names text[]; lock_value bigint; relation text; next_identity jsonb; attempt text;
  s official_v3_jobs_private.subjects_v1%ROWTYPE; t official_v3_jobs_private.execution_starts_v1%ROWTYPE;
  r official_v3_jobs_private.execution_results_v1%ROWTYPE; continuation jsonb; eligible boolean:=false; bundle jsonb; ref jsonb; opened jsonb; raw_reply jsonb;
BEGIN
  -- Anchor BEFORE any relation/advisory/row wait. Acquisitions cannot restart it.
  IF remaining_ms IS NULL OR remaining_ms NOT BETWEEN 1 AND 5000 OR absolute_not_after IS NULL THEN RAISE EXCEPTION 'm04 invalid budget' USING ERRCODE='P7601'; END IF;
  deadline:=least(entry+remaining_ms*interval '1 millisecond',official_v3_jobs_private.timestamp_v1(absolute_not_after));
  IF clock_timestamp()>=deadline THEN RAISE EXCEPTION 'm04 expired budget' USING ERRCODE='P7605'; END IF;
  q:=official_v3_jobs_private.wire_v1(wire); i:=q->'body'; operation:=q->>'operation'; phase:=q->>'phase';
  IF official_v3_jobs_private.ma1_tuple_valid_v1(method_id,revision,method_digest,package_digest) IS NOT TRUE
    OR (phase='probe' AND (epoch IS NOT NULL OR operation NOT IN ('queue_read','queue_confirm','execution_read')))
    OR (phase='authorized' AND (epoch IS NULL OR epoch NOT BETWEEN 1 AND 2147483647)) THEN RAISE EXCEPTION 'm04 invalid binding' USING ERRCODE='P7601'; END IF;
  b:=jsonb_build_object('methodId',method_id,'revision',revision,'methodDigest',method_digest,'packageDigest',package_digest);
  IF operation='queue_read' THEN
    IF official_v3_jobs_private.exact_keys_v1(i,ARRAY['jobKey','continuation']) IS NOT TRUE THEN RAISE EXCEPTION 'm04 invalid read' USING ERRCODE='P7601'; END IF;
    k:=i->>'jobKey'; continuation:=i->'continuation';
  ELSIF operation IN ('queue_confirm','queue_cas') THEN
    IF official_v3_jobs_private.exact_keys_v1(i,CASE WHEN operation='queue_confirm' THEN ARRAY['command','continuation'] ELSE ARRAY['command','commit','subjectText','disposition'] END) IS NOT TRUE THEN RAISE EXCEPTION 'm04 invalid command envelope' USING ERRCODE='P7601'; END IF;
    c:=official_v3_jobs_private.command_v1(i->'command'); k:=c->>'jobKey'; continuation:=i->'continuation';
    IF operation='queue_cas' THEN
      -- Validate the complete proposed transition before computing its advisory set;
      -- actual expected/current equality is checked again under the subject lock.
      PERFORM official_v3_jobs_private.transition_v1(c->'value',i#>'{commit,expected}',i->'commit');
      IF official_v3_jobs_private.exact_keys_v1(i->'disposition',CASE i#>>'{disposition,kind}' WHEN 'regular' THEN ARRAY['kind'] WHEN 'completed' THEN ARRAY['kind','attemptKey'] WHEN 'settled_failure' THEN ARRAY['kind','attemptKey','token'] ELSE ARRAY[]::text[] END) IS NOT TRUE
        OR (i#>>'{disposition,kind}' IN ('regular','completed','settled_failure')) IS NOT TRUE THEN RAISE EXCEPTION 'm04 invalid disposition' USING ERRCODE='P7601'; END IF;
      IF i#>>'{disposition,kind}'<>'regular' AND (i#>>'{disposition,attemptKey}' ~ '^execution-attempt:v3:[a-f0-9]{64}$') IS NOT TRUE THEN RAISE EXCEPTION 'm04 invalid attempt' USING ERRCODE='P7601'; END IF;
      IF i#>>'{disposition,kind}'='settled_failure' AND (i#>>'{disposition,token}' ~ '^[a-f0-9]{64}$') IS NOT TRUE THEN RAISE EXCEPTION 'm04 invalid token' USING ERRCODE='P7601'; END IF;
      IF jsonb_typeof(i->'subjectText') IS DISTINCT FROM 'string' OR octet_length(i->>'subjectText')>65536 THEN RAISE EXCEPTION 'm04 invalid subject' USING ERRCODE='P7601'; END IF;
      deadline:=least(deadline,official_v3_jobs_private.timestamp_v1(i#>>'{commit,notAfter}'));
    END IF;
  ELSE
    IF official_v3_jobs_private.exact_keys_v1(i,CASE operation WHEN 'execution_read' THEN ARRAY['claim','purpose'] WHEN 'execution_start' THEN ARRAY['claim','leasedJob','subjectText'] ELSE ARRAY['claim','attemptKey','token','result','references'] END) IS NOT TRUE THEN RAISE EXCEPTION 'm04 invalid execution' USING ERRCODE='P7601'; END IF;
    claim:=i->'claim'; PERFORM official_v3_jobs_private.command_v1(jsonb_build_object('action','claim','input',claim)); k:=claim->>'jobKey';
    IF operation='execution_read' AND (i->>'purpose' IN ('resume','lookup','confirm','artifact')) IS NOT TRUE THEN RAISE EXCEPTION 'm04 invalid read purpose' USING ERRCODE='P7601'; END IF;
    IF operation='execution_start' THEN
      PERFORM official_v3_jobs_private.job_v1(i->'leasedJob');
      next_identity:=CASE WHEN i#>>'{leasedJob,kind}'='research_job_record' THEN official_v3_jobs_private.subject_v1('rule_research',jsonb_build_object(
        'context',i#>'{leasedJob,context}','method',i#>'{leasedJob,method}','factKind',i#>'{leasedJob,research,factKind}','researchReason',i#>'{leasedJob,research,researchReason}'))
        ELSE official_v3_jobs_private.subject_v1('combination_discovery',(i#>'{leasedJob,identity}')-'kind'-'jobKey') END;
      IF next_identity->>'jobKey' IS DISTINCT FROM k OR next_identity->'subjectText' IS DISTINCT FROM i->'subjectText' THEN RAISE EXCEPTION 'm04 subject preimage mismatch' USING ERRCODE='P7601'; END IF;
      attempt:='execution-attempt:v3:'||encode(sha256(convert_to(official_v3_jobs_private.canonical_v1(jsonb_build_object('subject',(i->>'subjectText')::jsonb,
        'claim',claim,'leasedJob',i->'leasedJob','authority',b||jsonb_build_object('epoch',epoch)),0),'UTF8')),'hex');
    ELSIF operation='execution_prepare' THEN
      IF (i->>'attemptKey' ~ '^execution-attempt:v3:[a-f0-9]{64}$') IS NOT TRUE OR (i->>'token' ~ '^[a-f0-9]{64}$') IS NOT TRUE
        OR jsonb_typeof(i->'result') IS DISTINCT FROM 'object' OR jsonb_typeof(i->'references') IS DISTINCT FROM 'array' THEN RAISE EXCEPTION 'm04 invalid prepare' USING ERRCODE='P7601'; END IF;
      attempt:=i->>'attemptKey';
    END IF;
  END IF;
  IF (k ~ '^(research-job|combination-discovery-job):v3:[a-f0-9]{64}$') IS NOT TRUE THEN RAISE EXCEPTION 'm04 invalid subject locator' USING ERRCODE='P7601'; END IF;
  IF continuation IS NOT NULL AND continuation<>'null'::jsonb THEN
    IF official_v3_jobs_private.exact_keys_v1(continuation,CASE continuation->>'kind' WHEN 'prepared' THEN ARRAY['kind','claim','attemptKey'] WHEN 'owned_failure' THEN ARRAY['kind','claim','attemptKey','token'] ELSE ARRAY[]::text[] END) IS NOT TRUE
      OR (continuation->>'kind' IN ('prepared','owned_failure')) IS NOT TRUE
      OR (continuation->>'attemptKey' ~ '^execution-attempt:v3:[a-f0-9]{64}$') IS NOT TRUE
      OR (continuation->>'kind'='owned_failure' AND (continuation->>'token' ~ '^[a-f0-9]{64}$') IS NOT TRUE) THEN RAISE EXCEPTION 'm04 invalid continuation' USING ERRCODE='P7601'; END IF;
    PERFORM official_v3_jobs_private.command_v1(jsonb_build_object('action','claim','input',continuation->'claim'));
    IF continuation#>>'{claim,jobKey}' IS DISTINCT FROM k THEN RAISE EXCEPTION 'm04 continuation subject' USING ERRCODE='P7601'; END IF;
  END IF;
  -- All keys depend solely on fully validated request data. There are no later keys.
  lock_names:=ARRAY['subject:'||k];
  IF c IS NOT NULL THEN
    lock_names:=array_append(lock_names,'operation:'||(c->>'operationId'));
    IF c->>'action'='enqueue' THEN lock_names:=array_append(lock_names,'cycle:'||(c#>>'{value,input,jobId}')); END IF;
  END IF;
  IF operation='queue_cas' THEN
    lock_names:=array_append(lock_names,'audit:'||(i#>>'{commit,audit,reference}'));
    IF i#>>'{disposition,kind}'<>'regular' THEN lock_names:=array_append(lock_names,'attempt:'||(i#>>'{disposition,attemptKey}')); END IF;
  END IF;
  IF claim IS NOT NULL THEN lock_names:=array_append(lock_names,'operation:'||(claim->>'operationId')); END IF;
  IF attempt IS NOT NULL THEN lock_names:=array_append(lock_names,'attempt:'||attempt); END IF;
  IF operation='execution_prepare' THEN
    IF (COALESCE(i#>>'{result,decisionRef}',i#>>'{result,discoveryRef}') ~ '^(source-decision|combination-discovery-result):v3:[a-f0-9]{64}$') IS NOT TRUE THEN RAISE EXCEPTION 'm04 invalid result key' USING ERRCODE='P7601'; END IF;
    lock_names:=array_append(lock_names,'result:'||COALESCE(i#>>'{result,decisionRef}',i#>>'{result,discoveryRef}'));
  END IF;
  -- Self-compatible relation locks isolate runtime subjects and finish DDL waits early.
  FOREACH relation IN ARRAY ARRAY['slots_v1','subjects_v1','queue_operations_v1','execution_starts_v1','execution_results_v1','execution_dispositions_v1','catalog_binding_v1'] LOOP
    IF clock_timestamp()>=deadline THEN RAISE EXCEPTION 'm04 expired before relation' USING ERRCODE='P7605'; END IF;
    PERFORM set_config('lock_timeout',greatest(1,floor(extract(epoch FROM(deadline-clock_timestamp()))*1000))::text||'ms',true);
    EXECUTE format('LOCK TABLE official_v3_jobs_private.%I IN ROW EXCLUSIVE MODE',relation);
  END LOOP;
  IF clock_timestamp()>=deadline THEN RAISE EXCEPTION 'm04 expired after relations' USING ERRCODE='P7605'; END IF;
  PERFORM official_v3_jobs_private.assert_catalog_v1();
  FOR lock_value IN SELECT DISTINCT ('x'||substr(encode(sha256(convert_to('m04-lock:v1:'||v,'UTF8')),'hex'),1,16))::bit(64)::bigint AS token
      FROM unnest(lock_names) v ORDER BY token LOOP
    IF clock_timestamp()>=deadline THEN RAISE EXCEPTION 'm04 expired before advisory' USING ERRCODE='P7605'; END IF;
    PERFORM set_config('lock_timeout',greatest(1,floor(extract(epoch FROM(deadline-clock_timestamp()))*1000))::text||'ms',true);
    PERFORM pg_advisory_xact_lock(lock_value);
  END LOOP;
  IF clock_timestamp()>=deadline THEN RAISE EXCEPTION 'm04 expired before subject' USING ERRCODE='P7605'; END IF;
  PERFORM set_config('lock_timeout',greatest(1,floor(extract(epoch FROM(deadline-clock_timestamp()))*1000))::text||'ms',true);
  SELECT * INTO s FROM official_v3_jobs_private.subjects_v1 WHERE job_key=k FOR UPDATE;
  IF s.job_key IS NOT NULL THEN
    PERFORM official_v3_jobs_private.assert_history_v1(k);
    IF s.method_binding IS DISTINCT FROM b THEN RETURN jsonb_build_object('status','blocked'); END IF;
  END IF;
  IF clock_timestamp()>=deadline THEN RAISE EXCEPTION 'm04 expired after subject' USING ERRCODE='P7605'; END IF;
  -- Complete all-older-unknown gate, independent of latest IDs and MA1 availability.
  IF s.open_attempt IS NOT NULL THEN
    SELECT * INTO t FROM official_v3_jobs_private.execution_starts_v1 WHERE attempt_key=s.open_attempt;
    SELECT * INTO r FROM official_v3_jobs_private.execution_results_v1 WHERE attempt_key=s.open_attempt;
    IF operation='execution_read' THEN
      eligible:=r.attempt_key IS NOT NULL AND t.claim_text=official_v3_jobs_private.canonical_v1(claim,0) AND s.current_job=t.leased_job;
    ELSIF operation='execution_prepare' THEN
      eligible:=i->>'attemptKey'=t.attempt_key AND t.claim_text=official_v3_jobs_private.canonical_v1(claim,0)
        AND t.token_hash=encode(sha256(convert_to(i->>'token','UTF8')),'hex') AND s.current_job=t.leased_job;
    ELSIF operation='queue_cas' THEN
      eligible:=i#>>'{disposition,attemptKey}'=t.attempt_key AND i#>'{commit,expected}'=t.leased_job
        AND ((i#>>'{disposition,kind}'='completed' AND r.attempt_key IS NOT NULL)
          OR (i#>>'{disposition,kind}'='settled_failure' AND r.attempt_key IS NULL AND t.token_hash=encode(sha256(convert_to(i#>>'{disposition,token}','UTF8')),'hex')));
    ELSIF operation IN ('queue_read','queue_confirm') AND continuation IS NOT NULL AND continuation<>'null'::jsonb THEN
      eligible:=continuation->>'attemptKey'=t.attempt_key AND t.claim_text=official_v3_jobs_private.canonical_v1(continuation->'claim',0)
        AND s.current_job=t.leased_job AND ((continuation->>'kind'='prepared' AND r.attempt_key IS NOT NULL)
          OR (continuation->>'kind'='owned_failure' AND r.attempt_key IS NULL AND t.token_hash=encode(sha256(convert_to(continuation->>'token','UTF8')),'hex')));
      IF operation='queue_confirm' THEN eligible:=eligible AND ((c->>'action'='claim' AND c#>'{value,input}'=continuation->'claim')
        OR (c->>'action'='complete' AND continuation->>'kind'='prepared') OR (c->>'action'='fail' AND continuation->>'kind'='owned_failure')); END IF;
    END IF;
    IF eligible IS NOT TRUE THEN RETURN jsonb_build_object('status','blocked'); END IF;
    IF phase='authorized' AND t.authority IS DISTINCT FROM (b||jsonb_build_object('epoch',epoch)) THEN RETURN jsonb_build_object('status','blocked'); END IF;
  END IF;
  IF phase='probe' THEN
    bundle:=CASE operation WHEN 'queue_read' THEN official_v3_jobs_private.tx_queue_read_v1(q,b,epoch,remaining_ms,deadline)
      WHEN 'queue_confirm' THEN official_v3_jobs_private.tx_queue_confirm_v1(q,b,epoch,remaining_ms,deadline)
      ELSE official_v3_jobs_private.tx_execution_read_v1(q,b,epoch,remaining_ms,deadline) END;
    IF clock_timestamp()>=deadline THEN RAISE EXCEPTION 'm04 expired probe' USING ERRCODE='P7605'; END IF;
    RETURN CASE WHEN bundle->'authority'='true'::jsonb THEN jsonb_build_object('status','requires_authority') ELSE bundle->'reply' END;
  END IF;
  PERFORM set_config('lock_timeout',greatest(1,floor(extract(epoch FROM(deadline-clock_timestamp()))*1000))::text||'ms',true);
  bundle:=CASE operation WHEN 'queue_read' THEN official_v3_jobs_private.tx_queue_read_v1(q,b,epoch,remaining_ms,deadline)
    WHEN 'queue_confirm' THEN official_v3_jobs_private.tx_queue_confirm_v1(q,b,epoch,remaining_ms,deadline)
    WHEN 'queue_cas' THEN official_v3_jobs_private.tx_queue_cas_v1(q,b,epoch,remaining_ms,deadline)
    WHEN 'execution_read' THEN official_v3_jobs_private.tx_execution_read_v1(q,b,epoch,remaining_ms,deadline)
    WHEN 'execution_start' THEN official_v3_jobs_private.tx_execution_start_v1(q,b,epoch,remaining_ms,deadline)
    ELSE official_v3_jobs_private.tx_execution_prepare_v1(q,b,epoch,remaining_ms,deadline) END;
  IF bundle->'authority' IS DISTINCT FROM 'true'::jsonb THEN
    IF clock_timestamp()>=deadline THEN RAISE EXCEPTION 'm04 expired negative' USING ERRCODE='P7605'; END IF;
    RETURN bundle->'reply';
  END IF;
  -- Preexisting original PREPARED continuation reads also consume full actual S1.
  IF (bundle->'references' IS NULL OR bundle->'references'='null'::jsonb) AND r.attempt_key IS NOT NULL THEN
    bundle:=bundle||jsonb_build_object('references',r."references",'job',t.leased_job,'result',r.result,'lease',t.leased_job#>>'{lease,expiresAt}');
  END IF;
  PERFORM official_v3_jobs_private.assert_history_v1(k);
  IF clock_timestamp()>=deadline THEN RAISE EXCEPTION 'm04 expired after effects' USING ERRCODE='P7605'; END IF;
  IF jsonb_typeof(bundle->'references')='array' THEN
    FOR ref IN SELECT value FROM jsonb_array_elements(bundle->'references') ORDER BY value#>>'{binding,operationId}' COLLATE "C" LOOP
      IF clock_timestamp()>=deadline THEN RAISE EXCEPTION 'm04 expired before S1' USING ERRCODE='P7605'; END IF;
      PERFORM set_config('lock_timeout',greatest(1,floor(extract(epoch FROM(deadline-clock_timestamp()))*1000))::text||'ms',true);
      opened:=official_v3_jobs_private.s1_read_v1(ref->'binding',ref->>'proposalDigest',(ref->>'bytes')::integer);
      IF opened#>'{record,reference}' IS DISTINCT FROM ref THEN RAISE EXCEPTION 'm04 S1 reference mismatch' USING ERRCODE='P7604'; END IF;
      PERFORM official_v3_jobs_private.consume_s1_v1(opened,bundle->'job',bundle->'result',CASE operation WHEN 'execution_prepare' THEN 'prepare' WHEN 'queue_cas' THEN 'complete' ELSE 'read' END);
    END LOOP;
  END IF;
  IF clock_timestamp()>=deadline THEN RAISE EXCEPTION 'm04 expired before authority' USING ERRCODE='P7605'; END IF;
  PERFORM set_config('lock_timeout',greatest(1,floor(extract(epoch FROM(deadline-clock_timestamp()))*1000))::text||'ms',true);
  raw_reply:=bundle->'reply';
  IF raw_reply IS NULL OR octet_length(official_v3_jobs_private.canonical_v1(raw_reply,0))>262144 THEN RAISE EXCEPTION 'm04 oversized reply' USING ERRCODE='P7601'; END IF;
  -- LAST database authority check. It takes actual MA1 head FOR SHARE, then reads
  -- actual clock/tuple/epoch/expiry. No application DML or new lock follows it.
  PERFORM official_v3_jobs_private.ma1_require_v1(method_id,revision,method_digest,package_digest,epoch);
  IF clock_timestamp()>=deadline OR (bundle->>'lease' IS NOT NULL AND clock_timestamp()>=official_v3_jobs_private.timestamp_v1(bundle->>'lease'))
    OR (bundle->>'observedAt' IS NOT NULL AND clock_timestamp()<official_v3_jobs_private.timestamp_v1(bundle->>'observedAt'))
    OR (bundle->>'dueAt' IS NOT NULL AND clock_timestamp()<official_v3_jobs_private.timestamp_v1(bundle->>'dueAt')) THEN
    RAISE EXCEPTION 'm04 final expired budget or lease' USING ERRCODE='P7605'; END IF;
  RETURN raw_reply;
END $$;

-- Temporary rights exist only on the new jobs namespace and only in this transaction.
GRANT USAGE,CREATE ON SCHEMA official_v3_jobs_private TO postgres,ot_v3_intake_owner;
RESET ROLE;
CREATE FUNCTION official_v3_jobs_private.ma1_require_v1(m text,r integer,d text,p text,e integer) RETURNS void
LANGUAGE sql VOLATILE PARALLEL UNSAFE SECURITY DEFINER CALLED ON NULL INPUT SET search_path=pg_catalog,pg_temp
BEGIN ATOMIC
  SELECT official_v3_method_private.require_current_locked_v1(m,r,d,p,e);
END;
REVOKE EXECUTE ON FUNCTION official_v3_jobs_private.ma1_require_v1(text,integer,text,text,integer) FROM PUBLIC RESTRICT;
GRANT EXECUTE ON FUNCTION official_v3_jobs_private.ma1_require_v1(text,integer,text,text,integer) TO ot_v3_jobs_owner;
CREATE FUNCTION official_v3_jobs_private.ma1_tuple_valid_v1(m text,r integer,d text,p text) RETURNS boolean
LANGUAGE sql IMMUTABLE PARALLEL UNSAFE SECURITY DEFINER CALLED ON NULL INPUT SET search_path=pg_catalog,pg_temp
RETURN official_v3_method_private.tuple_valid_v1(m,r,d,p);
REVOKE EXECUTE ON FUNCTION official_v3_jobs_private.ma1_tuple_valid_v1(text,integer,text,text) FROM PUBLIC RESTRICT;
GRANT EXECUTE ON FUNCTION official_v3_jobs_private.ma1_tuple_valid_v1(text,integer,text,text) TO ot_v3_jobs_owner;
GRANT ot_v3_intake_owner TO postgres WITH ADMIN FALSE, INHERIT FALSE, SET TRUE GRANTED BY postgres;
DO $hm04_two_set_edges$
DECLARE creator oid:=session_user::pg_catalog.regrole; owner_id oid:='ot_v3_jobs_owner'::pg_catalog.regrole;
  caller_id oid:='ot_v3_jobs_caller'::pg_catalog.regrole; intake_id oid:='ot_v3_intake_owner'::pg_catalog.regrole; login_id oid;
BEGIN
  -- Exact protected owner edges. ADMIN-only bootstrap grants are never rewritten.
  IF EXISTS(SELECT 1 FROM pg_catalog.pg_roles r WHERE r.oid IN (owner_id,caller_id,intake_id)
      AND (r.rolcanlogin OR r.rolinherit OR r.rolsuper OR r.rolcreatedb OR r.rolcreaterole
        OR r.rolreplication OR r.rolbypassrls OR r.rolconfig IS NOT NULL OR r.rolconnlimit<>-1 OR r.rolvaliduntil IS NOT NULL))
    OR EXISTS(SELECT 1 FROM pg_catalog.pg_db_role_setting s WHERE s.setrole IN (owner_id,caller_id,intake_id))
    OR EXISTS(SELECT 1 FROM pg_catalog.pg_default_acl d WHERE d.defaclrole IN (owner_id,caller_id,intake_id))
    OR pg_catalog.has_database_privilege(owner_id,current_database(),'CREATE')
    OR pg_catalog.has_database_privilege(caller_id,current_database(),'CREATE')
    OR pg_catalog.has_database_privilege(intake_id,current_database(),'CREATE')
    OR NOT EXISTS(SELECT 1 FROM pg_catalog.pg_roles r WHERE r.oid=10 AND r.rolsuper) THEN
    RAISE EXCEPTION 'hm04 restricted role/default boundary' USING ERRCODE='P7603';
  END IF;
  IF (SELECT count(*) FROM pg_catalog.pg_auth_members m
      WHERE m.roleid=owner_id OR m.member=owner_id OR m.grantor=owner_id)<>2
    OR (SELECT count(*) FROM pg_catalog.pg_auth_members m
      WHERE m.roleid=owner_id AND m.member=creator AND m.grantor=10
        AND m.admin_option AND NOT m.inherit_option AND NOT m.set_option)<>1
    OR (SELECT count(*) FROM pg_catalog.pg_auth_members m
      WHERE m.roleid=owner_id AND m.member=creator AND m.grantor=creator
        AND NOT m.admin_option AND NOT m.inherit_option AND m.set_option)<>1
    OR pg_catalog.pg_has_role(creator,owner_id,'USAGE')
    OR pg_catalog.pg_has_role(creator,owner_id,'SET') IS DISTINCT FROM true
    OR (SELECT count(*) FROM pg_catalog.pg_auth_members m
      WHERE m.roleid=intake_id OR m.member=intake_id OR m.grantor=intake_id)<>2
    OR (SELECT count(*) FROM pg_catalog.pg_auth_members m
      WHERE m.roleid=intake_id AND m.member=creator AND m.grantor=10
        AND m.admin_option AND NOT m.inherit_option AND NOT m.set_option)<>1
    OR (SELECT count(*) FROM pg_catalog.pg_auth_members m
      WHERE m.roleid=intake_id AND m.member=creator AND m.grantor=creator
        AND NOT m.admin_option AND NOT m.inherit_option AND m.set_option)<>1
    OR pg_catalog.pg_has_role(creator,intake_id,'USAGE')
    OR pg_catalog.pg_has_role(creator,intake_id,'SET') IS DISTINCT FROM true THEN
    RAISE EXCEPTION 'hm04 exact protected membership boundary' USING ERRCODE='P7603';
  END IF;
  IF (SELECT count(*) FROM pg_catalog.pg_auth_members m WHERE m.roleid=caller_id
      AND m.member=creator AND m.grantor=10 AND m.admin_option AND NOT m.inherit_option AND NOT m.set_option)<>1
    OR EXISTS(SELECT 1 FROM pg_catalog.pg_auth_members m WHERE m.member=caller_id OR m.grantor=caller_id)
    OR pg_catalog.pg_has_role(creator,caller_id,'SET') OR pg_catalog.pg_has_role(creator,caller_id,'USAGE')
    OR (SELECT count(*) FROM pg_catalog.pg_auth_members m WHERE m.roleid=caller_id
      AND NOT(m.member=creator AND m.grantor=10 AND m.admin_option AND NOT m.inherit_option AND NOT m.set_option))>0 THEN
    RAISE EXCEPTION 'hm04 caller graph boundary' USING ERRCODE='P7603';
  END IF;
END $hm04_two_set_edges$;

SET LOCAL ROLE ot_v3_intake_owner;
CREATE FUNCTION official_v3_jobs_private.s1_read_v1(b jsonb,d text,n integer) RETURNS jsonb
LANGUAGE sql VOLATILE PARALLEL UNSAFE SECURITY DEFINER CALLED ON NULL INPUT SET search_path=pg_catalog,pg_temp
RETURN official_v3_intake_api.read_v1(b,d,n);
REVOKE EXECUTE ON FUNCTION official_v3_jobs_private.s1_read_v1(jsonb,text,integer) FROM PUBLIC RESTRICT;
GRANT EXECUTE ON FUNCTION official_v3_jobs_private.s1_read_v1(jsonb,text,integer) TO ot_v3_jobs_owner;
CREATE FUNCTION official_v3_jobs_private.s1_shape_v1(v jsonb,tag text) RETURNS boolean
LANGUAGE sql IMMUTABLE PARALLEL UNSAFE SECURITY DEFINER CALLED ON NULL INPUT SET search_path=pg_catalog,pg_temp
RETURN CASE WHEN tag='proposal' THEN official_v3_intake_private.proposal_retainable_v1(v)
  AND official_v3_intake_private.safe_data_v1(v,0)
  WHEN tag='outcome' THEN octet_length(v::text)<=524288 AND official_v3_intake_private.data_nodes_v1(v,0,24,65536)>=0
    AND official_v3_intake_private.safe_data_v1(v,0)
    AND official_v3_intake_private.shape_matches_v1(v,official_v3_intake_private.proposal_shape_v1()->'definitions'->'outcome',
      official_v3_intake_private.proposal_shape_v1()->'definitions',official_v3_intake_private.proposal_shape_v1()->'countries',0)
  WHEN tag='audit' THEN octet_length(v::text)<=8192 AND official_v3_intake_private.data_nodes_v1(v,0,16,8192)>=0
    AND official_v3_intake_private.safe_data_v1(v,0)
    AND official_v3_intake_private.shape_matches_v1(v,official_v3_intake_private.proposal_shape_v1()->'definitions'->'audit',
      official_v3_intake_private.proposal_shape_v1()->'definitions',official_v3_intake_private.proposal_shape_v1()->'countries',0)
  ELSE false END;
REVOKE EXECUTE ON FUNCTION official_v3_jobs_private.s1_shape_v1(jsonb,text) FROM PUBLIC RESTRICT;
GRANT EXECUTE ON FUNCTION official_v3_jobs_private.s1_shape_v1(jsonb,text) TO ot_v3_jobs_owner;
RESET ROLE;
SET LOCAL ROLE ot_v3_jobs_owner;
REVOKE USAGE,CREATE ON SCHEMA official_v3_jobs_private FROM postgres,ot_v3_intake_owner RESTRICT;

REVOKE ALL ON FUNCTION official_v3_jobs_private.exact_keys_v1(jsonb,text[]) FROM PUBLIC RESTRICT;
REVOKE ALL ON FUNCTION official_v3_jobs_private.unique_json_v1(json,integer) FROM PUBLIC RESTRICT;
REVOKE ALL ON FUNCTION official_v3_jobs_private.nodes_v1(jsonb,integer,integer,integer) FROM PUBLIC RESTRICT;
REVOKE ALL ON FUNCTION official_v3_jobs_private.canonical_v1(jsonb,integer) FROM PUBLIC RESTRICT;
REVOKE ALL ON FUNCTION official_v3_jobs_private.wire_v1(text) FROM PUBLIC RESTRICT;
REVOKE ALL ON FUNCTION official_v3_jobs_private.civil_date_v1(text) FROM PUBLIC RESTRICT;
REVOKE ALL ON FUNCTION official_v3_jobs_private.timestamp_v1(text) FROM PUBLIC RESTRICT;
REVOKE ALL ON FUNCTION official_v3_jobs_private.predicate_v1(jsonb) FROM PUBLIC RESTRICT;
REVOKE ALL ON FUNCTION official_v3_jobs_private.expression_v1(jsonb,boolean,integer) FROM PUBLIC RESTRICT;
REVOKE ALL ON FUNCTION official_v3_jobs_private.context_v1(jsonb) FROM PUBLIC RESTRICT;
REVOKE ALL ON FUNCTION official_v3_jobs_private.subject_v1(text,jsonb) FROM PUBLIC RESTRICT;
REVOKE ALL ON FUNCTION official_v3_jobs_private.job_v1(jsonb) FROM PUBLIC RESTRICT;
REVOKE ALL ON FUNCTION official_v3_jobs_private.command_v1(jsonb) FROM PUBLIC RESTRICT;
REVOKE ALL ON FUNCTION official_v3_jobs_private.reference_v1(jsonb) FROM PUBLIC RESTRICT;
REVOKE ALL ON FUNCTION official_v3_jobs_private.transition_v1(jsonb,jsonb,jsonb) FROM PUBLIC RESTRICT;
REVOKE ALL ON FUNCTION official_v3_jobs_private.immutable_v1() FROM PUBLIC RESTRICT;
REVOKE ALL ON FUNCTION official_v3_jobs_private.consume_s1_v1(jsonb,jsonb,jsonb,text) FROM PUBLIC RESTRICT;
REVOKE ALL ON FUNCTION official_v3_jobs_private.assert_history_v1(text) FROM PUBLIC RESTRICT;
REVOKE ALL ON FUNCTION official_v3_jobs_private.assert_catalog_v1() FROM PUBLIC RESTRICT;
REVOKE ALL ON FUNCTION official_v3_jobs_private.tx_queue_read_v1(jsonb,jsonb,integer,integer,timestamptz) FROM PUBLIC RESTRICT;
REVOKE ALL ON FUNCTION official_v3_jobs_private.tx_queue_confirm_v1(jsonb,jsonb,integer,integer,timestamptz) FROM PUBLIC RESTRICT;
REVOKE ALL ON FUNCTION official_v3_jobs_private.tx_execution_read_v1(jsonb,jsonb,integer,integer,timestamptz) FROM PUBLIC RESTRICT;
REVOKE ALL ON FUNCTION official_v3_jobs_private.tx_execution_start_v1(jsonb,jsonb,integer,integer,timestamptz) FROM PUBLIC RESTRICT;
REVOKE ALL ON FUNCTION official_v3_jobs_private.tx_execution_prepare_v1(jsonb,jsonb,integer,integer,timestamptz) FROM PUBLIC RESTRICT;
REVOKE ALL ON FUNCTION official_v3_jobs_private.tx_queue_cas_v1(jsonb,jsonb,integer,integer,timestamptz) FROM PUBLIC RESTRICT;
REVOKE ALL ON FUNCTION official_v3_jobs_api.execute_v1(text,text,integer,text,text,integer,integer,text) FROM PUBLIC RESTRICT;
REVOKE ALL ON ALL TABLES IN SCHEMA official_v3_jobs_private FROM PUBLIC RESTRICT;
GRANT EXECUTE ON FUNCTION official_v3_jobs_api.execute_v1(text,text,integer,text,text,integer,integer,text) TO ot_v3_jobs_caller;

DO $hm04_created_final_objects$
DECLARE creator oid; owner_id oid:='ot_v3_jobs_owner'::pg_catalog.regrole;
  caller_id oid:='ot_v3_jobs_caller'::pg_catalog.regrole; intake_id oid:='ot_v3_intake_owner'::pg_catalog.regrole;
  login_id oid; expected record; actual_function pg_catalog.pg_proc%ROWTYPE; expected_types oid[];
  foreign_dependency boolean; actual_value jsonb; bound_value jsonb;
BEGIN
  creator:=session_user::pg_catalog.regrole;

  -- Exact protected owner edges. ADMIN-only bootstrap grants are never rewritten.
  IF EXISTS(SELECT 1 FROM pg_catalog.pg_roles r WHERE r.oid IN (owner_id,caller_id,intake_id)
      AND (r.rolcanlogin OR r.rolinherit OR r.rolsuper OR r.rolcreatedb OR r.rolcreaterole
        OR r.rolreplication OR r.rolbypassrls OR r.rolconfig IS NOT NULL OR r.rolconnlimit<>-1 OR r.rolvaliduntil IS NOT NULL))
    OR EXISTS(SELECT 1 FROM pg_catalog.pg_db_role_setting s WHERE s.setrole IN (owner_id,caller_id,intake_id))
    OR EXISTS(SELECT 1 FROM pg_catalog.pg_default_acl d WHERE d.defaclrole IN (owner_id,caller_id,intake_id))
    OR pg_catalog.has_database_privilege(owner_id,current_database(),'CREATE')
    OR pg_catalog.has_database_privilege(caller_id,current_database(),'CREATE')
    OR pg_catalog.has_database_privilege(intake_id,current_database(),'CREATE')
    OR NOT EXISTS(SELECT 1 FROM pg_catalog.pg_roles r WHERE r.oid=10 AND r.rolsuper) THEN
    RAISE EXCEPTION 'hm04 restricted role/default boundary' USING ERRCODE='P7603';
  END IF;
  IF (SELECT count(*) FROM pg_catalog.pg_auth_members m
      WHERE m.roleid=owner_id OR m.member=owner_id OR m.grantor=owner_id)<>2
    OR (SELECT count(*) FROM pg_catalog.pg_auth_members m
      WHERE m.roleid=owner_id AND m.member=creator AND m.grantor=10
        AND m.admin_option AND NOT m.inherit_option AND NOT m.set_option)<>1
    OR (SELECT count(*) FROM pg_catalog.pg_auth_members m
      WHERE m.roleid=owner_id AND m.member=creator AND m.grantor=creator
        AND NOT m.admin_option AND NOT m.inherit_option AND m.set_option)<>1
    OR pg_catalog.pg_has_role(creator,owner_id,'USAGE')
    OR pg_catalog.pg_has_role(creator,owner_id,'SET') IS DISTINCT FROM true
    OR (SELECT count(*) FROM pg_catalog.pg_auth_members m
      WHERE m.roleid=intake_id OR m.member=intake_id OR m.grantor=intake_id)<>2
    OR (SELECT count(*) FROM pg_catalog.pg_auth_members m
      WHERE m.roleid=intake_id AND m.member=creator AND m.grantor=10
        AND m.admin_option AND NOT m.inherit_option AND NOT m.set_option)<>1
    OR (SELECT count(*) FROM pg_catalog.pg_auth_members m
      WHERE m.roleid=intake_id AND m.member=creator AND m.grantor=creator
        AND NOT m.admin_option AND NOT m.inherit_option AND m.set_option)<>1
    OR pg_catalog.pg_has_role(creator,intake_id,'USAGE')
    OR pg_catalog.pg_has_role(creator,intake_id,'SET') IS DISTINCT FROM true THEN
    RAISE EXCEPTION 'hm04 exact protected membership boundary' USING ERRCODE='P7603';
  END IF;
  IF (SELECT count(*) FROM pg_catalog.pg_auth_members m WHERE m.roleid=caller_id
      AND m.member=creator AND m.grantor=10 AND m.admin_option AND NOT m.inherit_option AND NOT m.set_option)<>1
    OR EXISTS(SELECT 1 FROM pg_catalog.pg_auth_members m WHERE m.member=caller_id OR m.grantor=caller_id)
    OR pg_catalog.pg_has_role(creator,caller_id,'SET') OR pg_catalog.pg_has_role(creator,caller_id,'USAGE')
    OR (SELECT count(*) FROM pg_catalog.pg_auth_members m WHERE m.roleid=caller_id
      AND NOT(m.member=creator AND m.grantor=10 AND m.admin_option AND NOT m.inherit_option AND NOT m.set_option))>0 THEN
    RAISE EXCEPTION 'hm04 caller graph boundary' USING ERRCODE='P7603';
  END IF;

  -- Closed thirty-function inventory; names, types, language, security and ACL.
  IF (SELECT count(*) FROM pg_catalog.pg_proc p JOIN pg_catalog.pg_namespace n ON n.oid=p.pronamespace
      WHERE n.nspname IN ('official_v3_jobs_private','official_v3_jobs_api'))<>30 THEN
    RAISE EXCEPTION 'hm04 function inventory' USING ERRCODE='P7603';
  END IF;
  FOR expected IN SELECT * FROM (VALUES
    ('official_v3_jobs_private','exact_keys_v1','jsonb,text[]',ARRAY['v','expected']::text[],'boolean','sql','i',false,'ot_v3_jobs_owner'),
    ('official_v3_jobs_private','unique_json_v1','json,integer',ARRAY['v','d']::text[],'boolean','plpgsql','i',false,'ot_v3_jobs_owner'),
    ('official_v3_jobs_private','nodes_v1','jsonb,integer,integer,integer',ARRAY['v','d','max_d','max_n']::text[],'integer','plpgsql','i',false,'ot_v3_jobs_owner'),
    ('official_v3_jobs_private','canonical_v1','jsonb,integer',ARRAY['v','d']::text[],'text','plpgsql','i',false,'ot_v3_jobs_owner'),
    ('official_v3_jobs_private','wire_v1','text',ARRAY['t']::text[],'jsonb','plpgsql','i',false,'ot_v3_jobs_owner'),
    ('official_v3_jobs_private','civil_date_v1','text',ARRAY['t']::text[],'boolean','plpgsql','i',false,'ot_v3_jobs_owner'),
    ('official_v3_jobs_private','timestamp_v1','text',ARRAY['t']::text[],'timestamptz','plpgsql','i',false,'ot_v3_jobs_owner'),
    ('official_v3_jobs_private','predicate_v1','jsonb',ARRAY['v']::text[],'jsonb','plpgsql','i',false,'ot_v3_jobs_owner'),
    ('official_v3_jobs_private','expression_v1','jsonb,boolean,integer',ARRAY['v','strip_support','d']::text[],'jsonb','plpgsql','i',false,'ot_v3_jobs_owner'),
    ('official_v3_jobs_private','context_v1','jsonb',ARRAY['v']::text[],'jsonb','plpgsql','i',false,'ot_v3_jobs_owner'),
    ('official_v3_jobs_private','subject_v1','text,jsonb',ARRAY['kind','v']::text[],'jsonb','plpgsql','i',false,'ot_v3_jobs_owner'),
    ('official_v3_jobs_private','job_v1','jsonb',ARRAY['v']::text[],'jsonb','plpgsql','i',false,'ot_v3_jobs_owner'),
    ('official_v3_jobs_private','command_v1','jsonb',ARRAY['v']::text[],'jsonb','plpgsql','i',false,'ot_v3_jobs_owner'),
    ('official_v3_jobs_private','reference_v1','jsonb',ARRAY['v']::text[],'jsonb','plpgsql','i',false,'ot_v3_jobs_owner'),
    ('official_v3_jobs_private','transition_v1','jsonb,jsonb,jsonb',ARRAY['command','current_record','commit']::text[],'void','plpgsql','i',false,'ot_v3_jobs_owner'),
    ('official_v3_jobs_private','immutable_v1','',NULL::text[],'trigger','plpgsql','v',false,'ot_v3_jobs_owner'),
    ('official_v3_jobs_private','s1_read_v1','jsonb,text,integer',ARRAY['b','d','n']::text[],'jsonb','sql','v',true,'ot_v3_intake_owner'),
    ('official_v3_jobs_private','s1_shape_v1','jsonb,text',ARRAY['v','tag']::text[],'boolean','sql','i',true,'ot_v3_intake_owner'),
    ('official_v3_jobs_private','ma1_require_v1','text,integer,text,text,integer',ARRAY['m','r','d','p','e']::text[],'void','sql','v',true,'postgres'),
    ('official_v3_jobs_private','consume_s1_v1','jsonb,jsonb,jsonb,text',ARRAY['reply','job','result','purpose']::text[],'void','plpgsql','v',false,'ot_v3_jobs_owner'),
    ('official_v3_jobs_private','assert_history_v1','text',ARRAY['k']::text[],'void','plpgsql','v',false,'ot_v3_jobs_owner'),
    ('official_v3_jobs_private','assert_catalog_v1','',NULL::text[],'void','plpgsql','v',false,'ot_v3_jobs_owner'),
    ('official_v3_jobs_private','tx_queue_read_v1','jsonb,jsonb,integer,integer,timestamptz',ARRAY['q','b','e','remaining','deadline']::text[],'jsonb','plpgsql','v',false,'ot_v3_jobs_owner'),
    ('official_v3_jobs_private','tx_queue_confirm_v1','jsonb,jsonb,integer,integer,timestamptz',ARRAY['q','b','e','remaining','deadline']::text[],'jsonb','plpgsql','v',false,'ot_v3_jobs_owner'),
    ('official_v3_jobs_private','tx_execution_read_v1','jsonb,jsonb,integer,integer,timestamptz',ARRAY['q','b','e','remaining','deadline']::text[],'jsonb','plpgsql','v',false,'ot_v3_jobs_owner'),
    ('official_v3_jobs_private','tx_execution_start_v1','jsonb,jsonb,integer,integer,timestamptz',ARRAY['q','b','e','remaining','deadline']::text[],'jsonb','plpgsql','v',false,'ot_v3_jobs_owner'),
    ('official_v3_jobs_private','tx_execution_prepare_v1','jsonb,jsonb,integer,integer,timestamptz',ARRAY['q','b','e','remaining','deadline']::text[],'jsonb','plpgsql','v',false,'ot_v3_jobs_owner'),
    ('official_v3_jobs_private','tx_queue_cas_v1','jsonb,jsonb,integer,integer,timestamptz',ARRAY['q','b','e','remaining','deadline']::text[],'jsonb','plpgsql','v',false,'ot_v3_jobs_owner'),
    ('official_v3_jobs_api','execute_v1','text,text,integer,text,text,integer,integer,text',ARRAY['wire','method_id','revision','method_digest','package_digest','epoch','remaining_ms','absolute_not_after']::text[],'jsonb','plpgsql','v',true,'ot_v3_jobs_owner'),
    ('official_v3_jobs_private','ma1_tuple_valid_v1','text,integer,text,text',ARRAY['m','r','d','p']::text[],'boolean','sql','i',true,'postgres')
  ) e(schema_name,function_name,argument_types,argument_names,result_type,language_name,volatility,definer,owner_name) LOOP
    SELECT p.* INTO actual_function FROM pg_catalog.pg_proc p JOIN pg_catalog.pg_namespace n ON n.oid=p.pronamespace
      WHERE n.nspname=expected.schema_name AND p.proname=expected.function_name;
    SELECT COALESCE(pg_catalog.array_agg(pg_catalog.to_regtype('pg_catalog.'||t)::oid ORDER BY ordinal),ARRAY[]::oid[])
      INTO expected_types FROM pg_catalog.unnest(CASE WHEN expected.argument_types='' THEN ARRAY[]::text[]
        ELSE pg_catalog.string_to_array(expected.argument_types,',') END) WITH ORDINALITY AS v(t,ordinal);
    IF actual_function.oid IS NULL OR actual_function.proowner<>pg_catalog.to_regrole(expected.owner_name)
      OR actual_function.prokind<>'f' OR actual_function.prorettype<>pg_catalog.to_regtype('pg_catalog.'||expected.result_type)
      OR actual_function.prolang<>(SELECT l.oid FROM pg_catalog.pg_language l WHERE l.lanname=expected.language_name)
      OR actual_function.prosecdef IS DISTINCT FROM expected.definer OR actual_function.provolatile::text<>expected.volatility
      OR actual_function.proparallel<>'u' OR actual_function.proisstrict OR actual_function.proleakproof
      OR actual_function.proretset OR actual_function.pronargdefaults<>0 OR actual_function.provariadic<>0
      OR actual_function.prosupport<>0 OR actual_function.probin IS NOT NULL
      OR actual_function.proargnames IS DISTINCT FROM expected.argument_names
      OR actual_function.proallargtypes IS NOT NULL OR actual_function.proargmodes IS NOT NULL
      OR ARRAY(SELECT a FROM pg_catalog.unnest(actual_function.proargtypes::oid[]) a) IS DISTINCT FROM expected_types
      OR actual_function.proconfig IS DISTINCT FROM ARRAY['search_path=pg_catalog, pg_temp']::text[]
      OR (expected.function_name IN ('s1_read_v1','s1_shape_v1','ma1_require_v1','ma1_tuple_valid_v1')
          AND actual_function.prosqlbody IS NULL)
      OR EXISTS(SELECT 1 FROM pg_catalog.aclexplode(COALESCE(actual_function.proacl,pg_catalog.acldefault('f',actual_function.proowner))) a
        WHERE a.grantor<>actual_function.proowner OR a.privilege_type<>'EXECUTE' OR a.is_grantable
          OR NOT(a.grantee=actual_function.proowner
            OR expected.function_name IN ('s1_read_v1','s1_shape_v1','ma1_require_v1','ma1_tuple_valid_v1') AND a.grantee=owner_id
            OR expected.schema_name='official_v3_jobs_api' AND a.grantee=caller_id))
      OR NOT pg_catalog.has_function_privilege(actual_function.proowner,actual_function.oid,'EXECUTE')
      OR NOT pg_catalog.has_function_privilege(owner_id,actual_function.oid,'EXECUTE')
      OR (expected.schema_name='official_v3_jobs_api'
          AND NOT pg_catalog.has_function_privilege(caller_id,actual_function.oid,'EXECUTE')) THEN
      RAISE EXCEPTION 'hm04 exact function identity/ACL: %',expected.function_name USING ERRCODE='P7603';
    END IF;
  END LOOP;
  -- Complete original relation, row/array type, policy and trigger counts.
  IF (SELECT count(*) FROM pg_catalog.pg_namespace n WHERE n.nspname IN ('official_v3_jobs_private','official_v3_jobs_api'))<>2
    OR EXISTS(SELECT 1 FROM pg_catalog.pg_namespace n WHERE n.nspname IN ('official_v3_jobs_private','official_v3_jobs_api')
      AND (n.nspowner<>owner_id OR EXISTS(SELECT 1 FROM pg_catalog.aclexplode(COALESCE(n.nspacl,pg_catalog.acldefault('n',n.nspowner))) a
        WHERE a.grantor<>owner_id OR a.is_grantable OR NOT(a.grantee=owner_id
          OR n.nspname='official_v3_jobs_api' AND a.grantee=caller_id AND a.privilege_type='USAGE'))))
    OR NOT pg_catalog.has_schema_privilege(caller_id,'official_v3_jobs_api','USAGE')
    OR pg_catalog.has_schema_privilege(caller_id,'official_v3_jobs_api','CREATE')
    OR pg_catalog.has_schema_privilege(caller_id,'official_v3_jobs_private','USAGE,CREATE')
    OR pg_catalog.has_schema_privilege(creator,'official_v3_jobs_private','USAGE,CREATE')
    OR pg_catalog.has_schema_privilege(intake_id,'official_v3_jobs_private','USAGE,CREATE')
    OR (SELECT count(*) FROM pg_catalog.pg_class c JOIN pg_catalog.pg_namespace n ON n.oid=c.relnamespace
      WHERE n.nspname IN ('official_v3_jobs_private','official_v3_jobs_api'))<>23
    OR (SELECT count(*) FROM pg_catalog.pg_class c JOIN pg_catalog.pg_namespace n ON n.oid=c.relnamespace
      WHERE n.nspname='official_v3_jobs_private' AND c.relkind='r'
        AND c.relname IN ('slots_v1','subjects_v1','queue_operations_v1','execution_starts_v1','execution_results_v1','execution_dispositions_v1','catalog_binding_v1'))<>7
    OR (SELECT count(*) FROM pg_catalog.pg_class c JOIN pg_catalog.pg_namespace n ON n.oid=c.relnamespace
      WHERE n.nspname='official_v3_jobs_private' AND c.relkind='i')<>16
    OR EXISTS(SELECT 1 FROM pg_catalog.pg_class c JOIN pg_catalog.pg_namespace n ON n.oid=c.relnamespace
      WHERE n.nspname IN ('official_v3_jobs_private','official_v3_jobs_api')
        AND (n.nspname<>'official_v3_jobs_private' OR c.relowner<>owner_id OR c.relkind NOT IN ('r','i')
          OR c.relpersistence<>'p' OR c.relispartition OR c.reloftype<>0 OR c.reloptions IS NOT NULL
          OR c.relkind='r' AND (NOT c.relrowsecurity OR NOT c.relforcerowsecurity
            OR COALESCE(c.relacl,pg_catalog.acldefault('r',c.relowner)) IS DISTINCT FROM pg_catalog.acldefault('r',owner_id))
          OR c.relkind='i' AND c.relacl IS NOT NULL))
    OR (SELECT count(*) FROM pg_catalog.pg_type t JOIN pg_catalog.pg_namespace n ON n.oid=t.typnamespace
      WHERE n.nspname IN ('official_v3_jobs_private','official_v3_jobs_api'))<>14
    OR EXISTS(SELECT 1 FROM pg_catalog.pg_type t JOIN pg_catalog.pg_namespace n ON n.oid=t.typnamespace
      WHERE n.nspname IN ('official_v3_jobs_private','official_v3_jobs_api')
        AND (t.typowner<>owner_id OR n.nspname<>'official_v3_jobs_private'
          OR COALESCE(t.typacl,pg_catalog.acldefault('T',t.typowner)) IS DISTINCT FROM pg_catalog.acldefault('T',owner_id)
          OR NOT(t.typtype='c' AND EXISTS(SELECT 1 FROM pg_catalog.pg_class c WHERE c.oid=t.typrelid AND c.reltype=t.oid AND c.relkind='r' AND c.relnamespace=t.typnamespace)
            OR t.typtype='b' AND EXISTS(SELECT 1 FROM pg_catalog.pg_type b JOIN pg_catalog.pg_class c ON c.oid=b.typrelid
              WHERE b.typarray=t.oid AND t.typelem=b.oid AND c.relkind='r' AND c.relnamespace=t.typnamespace))))
    OR (SELECT count(*) FROM pg_catalog.pg_constraint k JOIN pg_catalog.pg_namespace n ON n.oid=k.connamespace
      WHERE n.nspname='official_v3_jobs_private')<>41
    OR (SELECT count(*) FROM pg_catalog.pg_trigger g JOIN pg_catalog.pg_class c ON c.oid=g.tgrelid JOIN pg_catalog.pg_namespace n ON n.oid=c.relnamespace
      WHERE n.nspname='official_v3_jobs_private' AND NOT g.tgisinternal)<>14
    OR (SELECT count(*) FROM pg_catalog.pg_policy p JOIN pg_catalog.pg_class c ON c.oid=p.polrelid JOIN pg_catalog.pg_namespace n ON n.oid=c.relnamespace
      WHERE n.nspname='official_v3_jobs_private')<>7
    OR EXISTS(SELECT 1 FROM pg_catalog.pg_policy p JOIN pg_catalog.pg_class c ON c.oid=p.polrelid JOIN pg_catalog.pg_namespace n ON n.oid=c.relnamespace
      WHERE n.nspname='official_v3_jobs_private' AND (p.polname<>'owner_v1' OR p.polroles<>ARRAY[owner_id]::oid[]
        OR p.polcmd<>'*' OR NOT p.polpermissive OR pg_catalog.pg_get_expr(p.polqual,p.polrelid)<>'true'
        OR pg_catalog.pg_get_expr(p.polwithcheck,p.polrelid)<>'true'))
    OR EXISTS(SELECT 1 FROM pg_catalog.pg_attrdef a JOIN pg_catalog.pg_class c ON c.oid=a.adrelid JOIN pg_catalog.pg_namespace n ON n.oid=c.relnamespace
      WHERE n.nspname='official_v3_jobs_private')
    OR EXISTS(SELECT 1 FROM pg_catalog.pg_attribute a JOIN pg_catalog.pg_class c ON c.oid=a.attrelid JOIN pg_catalog.pg_namespace n ON n.oid=c.relnamespace
      WHERE n.nspname='official_v3_jobs_private' AND a.attnum>0
        AND (a.attisdropped OR a.attacl IS NOT NULL OR a.attgenerated<>'' OR a.attidentity<>'')) THEN
    RAISE EXCEPTION 'hm04 closed structure/namespace/type/owner boundary' USING ERRCODE='P7603';
  END IF;
  -- Neither pre-existing private schema is granted to JobsOwner. Only fixed bridges.
  IF pg_catalog.has_schema_privilege(owner_id,'official_v3_method_private','USAGE,CREATE')
    OR pg_catalog.has_schema_privilege(owner_id,'official_v3_intake_private','USAGE,CREATE')
    OR pg_catalog.has_schema_privilege(owner_id,'official_v3_intake_api','USAGE,CREATE')
    OR EXISTS(SELECT 1 FROM pg_catalog.pg_roles r WHERE r.rolname IN ('anon','authenticated','service_role')
      AND (pg_catalog.pg_has_role(r.oid,owner_id,'SET') OR pg_catalog.pg_has_role(r.oid,owner_id,'USAGE')
        OR pg_catalog.pg_has_role(r.oid,caller_id,'SET') OR pg_catalog.pg_has_role(r.oid,caller_id,'USAGE')
        OR pg_catalog.has_schema_privilege(r.oid,'official_v3_jobs_private','USAGE,CREATE')
        OR pg_catalog.has_schema_privilege(r.oid,'official_v3_jobs_api','USAGE,CREATE')))
    OR EXISTS(SELECT 1 FROM pg_catalog.pg_proc p JOIN pg_catalog.pg_namespace n ON n.oid=p.pronamespace
      CROSS JOIN pg_catalog.pg_roles r WHERE n.nspname IN ('official_v3_jobs_private','official_v3_jobs_api')
        AND r.rolname IN ('anon','authenticated','service_role')
        AND pg_catalog.has_function_privilege(r.oid,p.oid,'EXECUTE')) THEN
    RAISE EXCEPTION 'hm04 effective privilege boundary' USING ERRCODE='P7603';
  END IF;
  -- Eight, and only eight, parsed procedure dependencies. No caller-controlled target.
  IF (SELECT count(*) FROM pg_catalog.pg_depend d JOIN pg_catalog.pg_proc p ON p.oid=d.objid
      JOIN pg_catalog.pg_namespace n ON n.oid=p.pronamespace
      WHERE d.classid='pg_catalog.pg_proc'::pg_catalog.regclass AND d.refclassid='pg_catalog.pg_proc'::pg_catalog.regclass
        AND n.nspname IN ('official_v3_jobs_private','official_v3_jobs_api'))<>8 THEN
    RAISE EXCEPTION 'hm04 parsed dependency count' USING ERRCODE='P7603';
  END IF;
  FOR expected IN SELECT * FROM (VALUES
    ('s1_read_v1','official_v3_intake_api','read_v1','jsonb,text,integer'),
    ('s1_shape_v1','official_v3_intake_private','proposal_retainable_v1','jsonb'),
    ('s1_shape_v1','official_v3_intake_private','safe_data_v1','jsonb,integer'),
    ('s1_shape_v1','official_v3_intake_private','data_nodes_v1','jsonb,integer,integer,integer'),
    ('s1_shape_v1','official_v3_intake_private','shape_matches_v1','jsonb,jsonb,jsonb,jsonb,integer'),
    ('s1_shape_v1','official_v3_intake_private','proposal_shape_v1',''),
    ('ma1_require_v1','official_v3_method_private','require_current_locked_v1','text,integer,text,text,integer'),
    ('ma1_tuple_valid_v1','official_v3_method_private','tuple_valid_v1','text,integer,text,text')
  ) e(consumer_name,target_schema,target_name,target_types) LOOP
    IF NOT EXISTS(SELECT 1 FROM pg_catalog.pg_depend d JOIN pg_catalog.pg_proc p ON p.oid=d.objid
      JOIN pg_catalog.pg_namespace n ON n.oid=p.pronamespace JOIN pg_catalog.pg_proc target ON target.oid=d.refobjid
      JOIN pg_catalog.pg_namespace tn ON tn.oid=target.pronamespace
      WHERE d.classid='pg_catalog.pg_proc'::pg_catalog.regclass AND d.refclassid='pg_catalog.pg_proc'::pg_catalog.regclass
        AND d.deptype='n' AND d.objsubid=0 AND d.refobjsubid=0 AND n.nspname='official_v3_jobs_private'
        AND p.proname=expected.consumer_name AND tn.nspname=expected.target_schema AND target.proname=expected.target_name
        AND pg_catalog.replace(pg_catalog.oidvectortypes(target.proargtypes),', ',',')=expected.target_types) THEN
      RAISE EXCEPTION 'hm04 exact parsed dependency: %',expected.consumer_name USING ERRCODE='P7603';
    END IF;
  END LOOP;
  WITH scope_schemas AS (
  SELECT n.oid,n.nspname FROM pg_catalog.pg_namespace n WHERE n.nspname IN ('official_v3_jobs_private','official_v3_jobs_api')
), scope_tables AS (
  SELECT c.oid,c.reltoastrelid FROM pg_catalog.pg_class c JOIN scope_schemas n ON n.oid=c.relnamespace WHERE c.relkind='r'
), scope_classes AS (
  SELECT c.oid FROM pg_catalog.pg_class c JOIN scope_schemas n ON n.oid=c.relnamespace
  UNION SELECT t.reltoastrelid FROM scope_tables t WHERE t.reltoastrelid<>0
  UNION SELECT i.indexrelid FROM pg_catalog.pg_index i JOIN scope_tables t ON i.indrelid=t.reltoastrelid WHERE t.reltoastrelid<>0
), scope_objects AS (
  SELECT 'pg_catalog.pg_namespace'::pg_catalog.regclass::oid AS classid,n.oid AS objid FROM scope_schemas n
  UNION SELECT 'pg_catalog.pg_class'::pg_catalog.regclass,c.oid FROM scope_classes c
  UNION SELECT 'pg_catalog.pg_type'::pg_catalog.regclass,t.oid FROM pg_catalog.pg_type t JOIN scope_schemas n ON n.oid=t.typnamespace
  UNION SELECT 'pg_catalog.pg_proc'::pg_catalog.regclass,p.oid FROM pg_catalog.pg_proc p JOIN scope_schemas n ON n.oid=p.pronamespace
  UNION SELECT 'pg_catalog.pg_constraint'::pg_catalog.regclass,c.oid FROM pg_catalog.pg_constraint c JOIN scope_tables t ON t.oid=c.conrelid
  UNION SELECT 'pg_catalog.pg_trigger'::pg_catalog.regclass,g.oid FROM pg_catalog.pg_trigger g JOIN scope_tables t ON t.oid=g.tgrelid
  UNION SELECT 'pg_catalog.pg_policy'::pg_catalog.regclass,p.oid FROM pg_catalog.pg_policy p JOIN scope_tables t ON t.oid=p.polrelid
  UNION SELECT 'pg_catalog.pg_attrdef'::pg_catalog.regclass,d.oid FROM pg_catalog.pg_attrdef d JOIN scope_tables t ON t.oid=d.adrelid
)
  SELECT EXISTS(SELECT 1 FROM pg_catalog.pg_depend d JOIN scope_objects r ON r.classid=d.refclassid AND r.objid=d.refobjid
      WHERE NOT EXISTS(SELECT 1 FROM scope_objects o WHERE o.classid=d.classid AND o.objid=d.objid))
    OR EXISTS(SELECT 1 FROM pg_catalog.pg_depend d JOIN scope_objects o ON o.classid=d.classid AND o.objid=d.objid WHERE d.deptype IN ('e','x'))
    OR EXISTS(SELECT 1 FROM pg_catalog.pg_shdepend d WHERE d.refclassid='pg_catalog.pg_authid'::pg_catalog.regclass
      AND d.refobjid IN (owner_id,caller_id)
      AND NOT(d.dbid=(SELECT b.oid FROM pg_catalog.pg_database b WHERE b.datname=current_database())
        AND EXISTS(SELECT 1 FROM scope_objects o WHERE o.classid=d.classid AND o.objid=d.objid))
      AND NOT(d.dbid=0 AND d.classid='pg_catalog.pg_auth_members'::pg_catalog.regclass))
    OR EXISTS(SELECT 1 FROM pg_catalog.pg_seclabel s JOIN scope_objects o ON o.classid=s.classoid AND o.objid=s.objoid)
    OR EXISTS(SELECT 1 FROM pg_catalog.pg_description d JOIN scope_objects o ON o.classid=d.classoid AND o.objid=d.objoid)
    OR EXISTS(SELECT 1 FROM pg_catalog.pg_shdescription d WHERE d.classoid='pg_catalog.pg_authid'::pg_catalog.regclass AND d.objoid IN (owner_id,caller_id))
    OR EXISTS(SELECT 1 FROM pg_catalog.pg_shseclabel s WHERE s.classoid='pg_catalog.pg_authid'::pg_catalog.regclass AND s.objoid IN (owner_id,caller_id))
    INTO foreign_dependency;
  IF foreign_dependency THEN
    RAISE EXCEPTION 'hm04 unknown consumer/ownership/extension/label' USING ERRCODE='P7603';
  END IF;
  -- Original HS1 ownership remains closed plus exactly the two selected bridges.
  WITH scope_schemas AS (
  SELECT n.oid,n.nspname FROM pg_catalog.pg_namespace n WHERE n.nspname IN ('jetnity_ot_auth','official_v3_method_private','official_v3_method_api','official_v3_intake_private','official_v3_intake_api')
), scope_tables AS (
  SELECT c.oid,c.reltoastrelid FROM pg_catalog.pg_class c JOIN scope_schemas n ON n.oid=c.relnamespace WHERE c.relkind='r'
), scope_classes AS (
  SELECT c.oid FROM pg_catalog.pg_class c JOIN scope_schemas n ON n.oid=c.relnamespace
  UNION SELECT t.reltoastrelid FROM scope_tables t WHERE t.reltoastrelid<>0
  UNION SELECT i.indexrelid FROM pg_catalog.pg_index i JOIN scope_tables t ON i.indrelid=t.reltoastrelid WHERE t.reltoastrelid<>0
), scope_objects AS (
  SELECT 'pg_catalog.pg_namespace'::pg_catalog.regclass::oid AS classid,n.oid AS objid FROM scope_schemas n
  UNION SELECT 'pg_catalog.pg_class'::pg_catalog.regclass,c.oid FROM scope_classes c
  UNION SELECT 'pg_catalog.pg_type'::pg_catalog.regclass,t.oid FROM pg_catalog.pg_type t JOIN scope_schemas n ON n.oid=t.typnamespace
  UNION SELECT 'pg_catalog.pg_proc'::pg_catalog.regclass,p.oid FROM pg_catalog.pg_proc p JOIN scope_schemas n ON n.oid=p.pronamespace
  UNION SELECT 'pg_catalog.pg_constraint'::pg_catalog.regclass,c.oid FROM pg_catalog.pg_constraint c JOIN scope_tables t ON t.oid=c.conrelid
  UNION SELECT 'pg_catalog.pg_trigger'::pg_catalog.regclass,g.oid FROM pg_catalog.pg_trigger g JOIN scope_tables t ON t.oid=g.tgrelid
  UNION SELECT 'pg_catalog.pg_policy'::pg_catalog.regclass,p.oid FROM pg_catalog.pg_policy p JOIN scope_tables t ON t.oid=p.polrelid
  UNION SELECT 'pg_catalog.pg_attrdef'::pg_catalog.regclass,d.oid FROM pg_catalog.pg_attrdef d JOIN scope_tables t ON t.oid=d.adrelid
)
  SELECT EXISTS(SELECT 1 FROM pg_catalog.pg_shdepend d WHERE d.refclassid='pg_catalog.pg_authid'::pg_catalog.regclass
    AND d.refobjid=intake_id AND d.deptype='o'
    AND NOT(d.dbid=(SELECT b.oid FROM pg_catalog.pg_database b WHERE b.datname=current_database())
      AND (EXISTS(SELECT 1 FROM scope_objects o WHERE o.classid=d.classid AND o.objid=d.objid)
        OR d.classid='pg_catalog.pg_proc'::pg_catalog.regclass AND EXISTS(SELECT 1 FROM pg_catalog.pg_proc p JOIN pg_catalog.pg_namespace n ON n.oid=p.pronamespace
          WHERE p.oid=d.objid AND n.nspname='official_v3_jobs_private' AND p.proname IN ('s1_read_v1','s1_shape_v1') AND p.proowner=intake_id))))
    INTO foreign_dependency;
  IF foreign_dependency THEN
    RAISE EXCEPTION 'hm04 HS1 owner foreign object' USING ERRCODE='P7603';
  END IF;

END $hm04_created_final_objects$;

INSERT INTO official_v3_jobs_private.catalog_binding_v1(object_identity,fingerprint)
SELECT 'jobs-functions',q.value FROM (
SELECT pg_catalog.to_jsonb(pg_catalog.encode(pg_catalog.sha256(pg_catalog.convert_to(q.value::text,'UTF8')),'hex')) AS value FROM (
SELECT pg_catalog.jsonb_agg(pg_catalog.jsonb_build_object(
  'catalog',pg_catalog.to_jsonb(p)-'prosrc'-'prosqlbody'-'probin',
  'definition',pg_catalog.encode(pg_catalog.sha256(pg_catalog.convert_to(pg_catalog.pg_get_functiondef(p.oid),'UTF8')),'hex'))
  ORDER BY p.oid) AS value FROM pg_catalog.pg_proc p JOIN pg_catalog.pg_namespace n ON n.oid=p.pronamespace
  WHERE n.nspname IN ('official_v3_jobs_private','official_v3_jobs_api')
) q
) q;

INSERT INTO official_v3_jobs_private.catalog_binding_v1(object_identity,fingerprint)
SELECT 'jobs-relations',q.value FROM (
SELECT pg_catalog.to_jsonb(pg_catalog.encode(pg_catalog.sha256(pg_catalog.convert_to(q.value::text,'UTF8')),'hex')) AS value FROM (
SELECT pg_catalog.jsonb_agg(pg_catalog.jsonb_build_object(
  'name',c.relname,'oid',c.oid,'namespace',c.relnamespace,'kind',c.relkind,'owner',c.relowner,'acl',c.relacl,
  'rls',c.relrowsecurity,'force',c.relforcerowsecurity,'persistence',c.relpersistence,'partition',c.relispartition,
  'oftype',c.reloftype,'replica',c.relreplident,'options',c.reloptions,'access',c.relam,'tablespace',c.reltablespace,
  'columns',(SELECT pg_catalog.jsonb_agg(pg_catalog.to_jsonb(a) ORDER BY a.attnum) FROM pg_catalog.pg_attribute a
    WHERE a.attrelid=c.oid AND a.attnum>0),
  'defaults',(SELECT pg_catalog.jsonb_agg(pg_catalog.to_jsonb(a) ORDER BY a.adnum) FROM pg_catalog.pg_attrdef a WHERE a.adrelid=c.oid),
  'constraints',(SELECT pg_catalog.jsonb_agg(pg_catalog.to_jsonb(k) ORDER BY k.oid) FROM pg_catalog.pg_constraint k WHERE k.conrelid=c.oid),
  'indexes',(SELECT pg_catalog.jsonb_agg(pg_catalog.to_jsonb(i) ORDER BY i.indexrelid) FROM pg_catalog.pg_index i WHERE i.indrelid=c.oid),
  'policies',(SELECT pg_catalog.jsonb_agg(pg_catalog.to_jsonb(p) ORDER BY p.oid) FROM pg_catalog.pg_policy p WHERE p.polrelid=c.oid),
  'triggers',(SELECT pg_catalog.jsonb_agg(pg_catalog.to_jsonb(g) ORDER BY g.oid) FROM pg_catalog.pg_trigger g WHERE g.tgrelid=c.oid),
  'inheritance',(SELECT pg_catalog.jsonb_agg(pg_catalog.to_jsonb(i) ORDER BY i.inhrelid,i.inhparent) FROM pg_catalog.pg_inherits i WHERE i.inhrelid=c.oid OR i.inhparent=c.oid),
  'rewrites',(SELECT pg_catalog.jsonb_agg(pg_catalog.to_jsonb(r) ORDER BY r.oid) FROM pg_catalog.pg_rewrite r WHERE r.ev_class=c.oid))
  ORDER BY c.oid) AS value FROM pg_catalog.pg_class c JOIN pg_catalog.pg_namespace n ON n.oid=c.relnamespace
  WHERE n.nspname IN ('official_v3_jobs_private','official_v3_jobs_api')
) q
) q;

INSERT INTO official_v3_jobs_private.catalog_binding_v1(object_identity,fingerprint)
SELECT 'jobs-types',q.value FROM (
SELECT pg_catalog.to_jsonb(pg_catalog.encode(pg_catalog.sha256(pg_catalog.convert_to(q.value::text,'UTF8')),'hex')) AS value FROM (
SELECT pg_catalog.jsonb_agg(pg_catalog.to_jsonb(t) ORDER BY t.oid) AS value
  FROM pg_catalog.pg_type t JOIN pg_catalog.pg_namespace n ON n.oid=t.typnamespace WHERE n.nspname IN ('official_v3_jobs_private','official_v3_jobs_api')
) q
) q;

INSERT INTO official_v3_jobs_private.catalog_binding_v1(object_identity,fingerprint)
SELECT 'jobs-schemas',q.value FROM (
SELECT pg_catalog.to_jsonb(pg_catalog.encode(pg_catalog.sha256(pg_catalog.convert_to(q.value::text,'UTF8')),'hex')) AS value FROM (
SELECT pg_catalog.jsonb_agg(pg_catalog.to_jsonb(n) ORDER BY n.oid) AS value
  FROM pg_catalog.pg_namespace n WHERE n.nspname IN ('official_v3_jobs_private','official_v3_jobs_api')
) q
) q;

INSERT INTO official_v3_jobs_private.catalog_binding_v1(object_identity,fingerprint)
SELECT 'jobs-dependencies',q.value FROM (
WITH scope_schemas AS (
  SELECT n.oid,n.nspname FROM pg_catalog.pg_namespace n WHERE n.nspname IN ('official_v3_jobs_private','official_v3_jobs_api')
), scope_tables AS (
  SELECT c.oid,c.reltoastrelid FROM pg_catalog.pg_class c JOIN scope_schemas n ON n.oid=c.relnamespace WHERE c.relkind='r'
), scope_classes AS (
  SELECT c.oid FROM pg_catalog.pg_class c JOIN scope_schemas n ON n.oid=c.relnamespace
  UNION SELECT t.reltoastrelid FROM scope_tables t WHERE t.reltoastrelid<>0
  UNION SELECT i.indexrelid FROM pg_catalog.pg_index i JOIN scope_tables t ON i.indrelid=t.reltoastrelid WHERE t.reltoastrelid<>0
), scope_objects AS (
  SELECT 'pg_catalog.pg_namespace'::pg_catalog.regclass::oid AS classid,n.oid AS objid FROM scope_schemas n
  UNION SELECT 'pg_catalog.pg_class'::pg_catalog.regclass,c.oid FROM scope_classes c
  UNION SELECT 'pg_catalog.pg_type'::pg_catalog.regclass,t.oid FROM pg_catalog.pg_type t JOIN scope_schemas n ON n.oid=t.typnamespace
  UNION SELECT 'pg_catalog.pg_proc'::pg_catalog.regclass,p.oid FROM pg_catalog.pg_proc p JOIN scope_schemas n ON n.oid=p.pronamespace
  UNION SELECT 'pg_catalog.pg_constraint'::pg_catalog.regclass,c.oid FROM pg_catalog.pg_constraint c JOIN scope_tables t ON t.oid=c.conrelid
  UNION SELECT 'pg_catalog.pg_trigger'::pg_catalog.regclass,g.oid FROM pg_catalog.pg_trigger g JOIN scope_tables t ON t.oid=g.tgrelid
  UNION SELECT 'pg_catalog.pg_policy'::pg_catalog.regclass,p.oid FROM pg_catalog.pg_policy p JOIN scope_tables t ON t.oid=p.polrelid
  UNION SELECT 'pg_catalog.pg_attrdef'::pg_catalog.regclass,d.oid FROM pg_catalog.pg_attrdef d JOIN scope_tables t ON t.oid=d.adrelid
)
SELECT pg_catalog.to_jsonb(pg_catalog.encode(pg_catalog.sha256(pg_catalog.convert_to(pg_catalog.jsonb_build_object(
  'dependencies',(SELECT pg_catalog.jsonb_agg(pg_catalog.to_jsonb(d) ORDER BY d.classid,d.objid,d.objsubid,d.refclassid,d.refobjid,d.refobjsubid,d.deptype)
    FROM pg_catalog.pg_depend d WHERE EXISTS(SELECT 1 FROM scope_objects o WHERE o.classid=d.classid AND o.objid=d.objid)
      OR EXISTS(SELECT 1 FROM scope_objects o WHERE o.classid=d.refclassid AND o.objid=d.refobjid)),
  'shared',(SELECT pg_catalog.jsonb_agg(pg_catalog.to_jsonb(d) ORDER BY d.dbid,d.classid,d.objid,d.objsubid,d.refclassid,d.refobjid,d.deptype)
    FROM pg_catalog.pg_shdepend d WHERE d.dbid=(SELECT b.oid FROM pg_catalog.pg_database b WHERE b.datname=current_database())
      AND EXISTS(SELECT 1 FROM scope_objects o WHERE o.classid=d.classid AND o.objid=d.objid)),
  'labels',(SELECT pg_catalog.jsonb_agg(pg_catalog.to_jsonb(s) ORDER BY s.classoid,s.objoid,s.objsubid,s.provider)
    FROM pg_catalog.pg_seclabel s JOIN scope_objects o ON o.classid=s.classoid AND o.objid=s.objoid),
  'descriptions',(SELECT pg_catalog.jsonb_agg(pg_catalog.to_jsonb(d) ORDER BY d.classoid,d.objoid,d.objsubid)
    FROM pg_catalog.pg_description d JOIN scope_objects o ON o.classid=d.classoid AND o.objid=d.objoid)
)::text,'UTF8')),'hex')) AS value
) q;

INSERT INTO official_v3_jobs_private.catalog_binding_v1(object_identity,fingerprint)
SELECT 'prerequisite-functions',q.value FROM (
SELECT pg_catalog.to_jsonb(pg_catalog.encode(pg_catalog.sha256(pg_catalog.convert_to(q.value::text,'UTF8')),'hex')) AS value FROM (
SELECT pg_catalog.jsonb_agg(pg_catalog.jsonb_build_object(
  'catalog',pg_catalog.to_jsonb(p)-'prosrc'-'prosqlbody'-'probin',
  'definition',pg_catalog.encode(pg_catalog.sha256(pg_catalog.convert_to(pg_catalog.pg_get_functiondef(p.oid),'UTF8')),'hex'))
  ORDER BY p.oid) AS value FROM pg_catalog.pg_proc p JOIN pg_catalog.pg_namespace n ON n.oid=p.pronamespace
  WHERE n.nspname IN ('jetnity_ot_auth','official_v3_method_private','official_v3_method_api','official_v3_intake_private','official_v3_intake_api')
) q
) q;

INSERT INTO official_v3_jobs_private.catalog_binding_v1(object_identity,fingerprint)
SELECT 'prerequisite-relations',q.value FROM (
SELECT pg_catalog.to_jsonb(pg_catalog.encode(pg_catalog.sha256(pg_catalog.convert_to(q.value::text,'UTF8')),'hex')) AS value FROM (
SELECT pg_catalog.jsonb_agg(pg_catalog.jsonb_build_object(
  'name',c.relname,'oid',c.oid,'namespace',c.relnamespace,'kind',c.relkind,'owner',c.relowner,'acl',c.relacl,
  'rls',c.relrowsecurity,'force',c.relforcerowsecurity,'persistence',c.relpersistence,'partition',c.relispartition,
  'oftype',c.reloftype,'replica',c.relreplident,'options',c.reloptions,'access',c.relam,'tablespace',c.reltablespace,
  'columns',(SELECT pg_catalog.jsonb_agg(pg_catalog.to_jsonb(a) ORDER BY a.attnum) FROM pg_catalog.pg_attribute a
    WHERE a.attrelid=c.oid AND a.attnum>0),
  'defaults',(SELECT pg_catalog.jsonb_agg(pg_catalog.to_jsonb(a) ORDER BY a.adnum) FROM pg_catalog.pg_attrdef a WHERE a.adrelid=c.oid),
  'constraints',(SELECT pg_catalog.jsonb_agg(pg_catalog.to_jsonb(k) ORDER BY k.oid) FROM pg_catalog.pg_constraint k WHERE k.conrelid=c.oid),
  'indexes',(SELECT pg_catalog.jsonb_agg(pg_catalog.to_jsonb(i) ORDER BY i.indexrelid) FROM pg_catalog.pg_index i WHERE i.indrelid=c.oid),
  'policies',(SELECT pg_catalog.jsonb_agg(pg_catalog.to_jsonb(p) ORDER BY p.oid) FROM pg_catalog.pg_policy p WHERE p.polrelid=c.oid),
  'triggers',(SELECT pg_catalog.jsonb_agg(pg_catalog.to_jsonb(g) ORDER BY g.oid) FROM pg_catalog.pg_trigger g WHERE g.tgrelid=c.oid),
  'inheritance',(SELECT pg_catalog.jsonb_agg(pg_catalog.to_jsonb(i) ORDER BY i.inhrelid,i.inhparent) FROM pg_catalog.pg_inherits i WHERE i.inhrelid=c.oid OR i.inhparent=c.oid),
  'rewrites',(SELECT pg_catalog.jsonb_agg(pg_catalog.to_jsonb(r) ORDER BY r.oid) FROM pg_catalog.pg_rewrite r WHERE r.ev_class=c.oid))
  ORDER BY c.oid) AS value FROM pg_catalog.pg_class c JOIN pg_catalog.pg_namespace n ON n.oid=c.relnamespace
  WHERE n.nspname IN ('jetnity_ot_auth','official_v3_method_private','official_v3_method_api','official_v3_intake_private','official_v3_intake_api')
) q
) q;

INSERT INTO official_v3_jobs_private.catalog_binding_v1(object_identity,fingerprint)
SELECT 'prerequisite-types',q.value FROM (
SELECT pg_catalog.to_jsonb(pg_catalog.encode(pg_catalog.sha256(pg_catalog.convert_to(q.value::text,'UTF8')),'hex')) AS value FROM (
SELECT pg_catalog.jsonb_agg(pg_catalog.to_jsonb(t) ORDER BY t.oid) AS value
  FROM pg_catalog.pg_type t JOIN pg_catalog.pg_namespace n ON n.oid=t.typnamespace WHERE n.nspname IN ('jetnity_ot_auth','official_v3_method_private','official_v3_method_api','official_v3_intake_private','official_v3_intake_api')
) q
) q;

INSERT INTO official_v3_jobs_private.catalog_binding_v1(object_identity,fingerprint)
SELECT 'prerequisite-schemas',q.value FROM (
SELECT pg_catalog.to_jsonb(pg_catalog.encode(pg_catalog.sha256(pg_catalog.convert_to(q.value::text,'UTF8')),'hex')) AS value FROM (
SELECT pg_catalog.jsonb_agg(pg_catalog.to_jsonb(n) ORDER BY n.oid) AS value
  FROM pg_catalog.pg_namespace n WHERE n.nspname IN ('jetnity_ot_auth','official_v3_method_private','official_v3_method_api','official_v3_intake_private','official_v3_intake_api')
) q
) q;

INSERT INTO official_v3_jobs_private.catalog_binding_v1(object_identity,fingerprint)
SELECT 'prerequisite-dependencies',q.value FROM (
WITH scope_schemas AS (
  SELECT n.oid,n.nspname FROM pg_catalog.pg_namespace n WHERE n.nspname IN ('jetnity_ot_auth','official_v3_method_private','official_v3_method_api','official_v3_intake_private','official_v3_intake_api')
), scope_tables AS (
  SELECT c.oid,c.reltoastrelid FROM pg_catalog.pg_class c JOIN scope_schemas n ON n.oid=c.relnamespace WHERE c.relkind='r'
), scope_classes AS (
  SELECT c.oid FROM pg_catalog.pg_class c JOIN scope_schemas n ON n.oid=c.relnamespace
  UNION SELECT t.reltoastrelid FROM scope_tables t WHERE t.reltoastrelid<>0
  UNION SELECT i.indexrelid FROM pg_catalog.pg_index i JOIN scope_tables t ON i.indrelid=t.reltoastrelid WHERE t.reltoastrelid<>0
), scope_objects AS (
  SELECT 'pg_catalog.pg_namespace'::pg_catalog.regclass::oid AS classid,n.oid AS objid FROM scope_schemas n
  UNION SELECT 'pg_catalog.pg_class'::pg_catalog.regclass,c.oid FROM scope_classes c
  UNION SELECT 'pg_catalog.pg_type'::pg_catalog.regclass,t.oid FROM pg_catalog.pg_type t JOIN scope_schemas n ON n.oid=t.typnamespace
  UNION SELECT 'pg_catalog.pg_proc'::pg_catalog.regclass,p.oid FROM pg_catalog.pg_proc p JOIN scope_schemas n ON n.oid=p.pronamespace
  UNION SELECT 'pg_catalog.pg_constraint'::pg_catalog.regclass,c.oid FROM pg_catalog.pg_constraint c JOIN scope_tables t ON t.oid=c.conrelid
  UNION SELECT 'pg_catalog.pg_trigger'::pg_catalog.regclass,g.oid FROM pg_catalog.pg_trigger g JOIN scope_tables t ON t.oid=g.tgrelid
  UNION SELECT 'pg_catalog.pg_policy'::pg_catalog.regclass,p.oid FROM pg_catalog.pg_policy p JOIN scope_tables t ON t.oid=p.polrelid
  UNION SELECT 'pg_catalog.pg_attrdef'::pg_catalog.regclass,d.oid FROM pg_catalog.pg_attrdef d JOIN scope_tables t ON t.oid=d.adrelid
)
SELECT pg_catalog.to_jsonb(pg_catalog.encode(pg_catalog.sha256(pg_catalog.convert_to(pg_catalog.jsonb_build_object(
  'dependencies',(SELECT pg_catalog.jsonb_agg(pg_catalog.to_jsonb(d) ORDER BY d.classid,d.objid,d.objsubid,d.refclassid,d.refobjid,d.refobjsubid,d.deptype)
    FROM pg_catalog.pg_depend d WHERE EXISTS(SELECT 1 FROM scope_objects o WHERE o.classid=d.classid AND o.objid=d.objid)
      OR EXISTS(SELECT 1 FROM scope_objects o WHERE o.classid=d.refclassid AND o.objid=d.refobjid)),
  'shared',(SELECT pg_catalog.jsonb_agg(pg_catalog.to_jsonb(d) ORDER BY d.dbid,d.classid,d.objid,d.objsubid,d.refclassid,d.refobjid,d.deptype)
    FROM pg_catalog.pg_shdepend d WHERE d.dbid=(SELECT b.oid FROM pg_catalog.pg_database b WHERE b.datname=current_database())
      AND EXISTS(SELECT 1 FROM scope_objects o WHERE o.classid=d.classid AND o.objid=d.objid)),
  'labels',(SELECT pg_catalog.jsonb_agg(pg_catalog.to_jsonb(s) ORDER BY s.classoid,s.objoid,s.objsubid,s.provider)
    FROM pg_catalog.pg_seclabel s JOIN scope_objects o ON o.classid=s.classoid AND o.objid=s.objoid),
  'descriptions',(SELECT pg_catalog.jsonb_agg(pg_catalog.to_jsonb(d) ORDER BY d.classoid,d.objoid,d.objsubid)
    FROM pg_catalog.pg_description d JOIN scope_objects o ON o.classid=d.classoid AND o.objid=d.objoid)
)::text,'UTF8')),'hex')) AS value
) q;

INSERT INTO official_v3_jobs_private.catalog_binding_v1(object_identity,fingerprint)
SELECT 'protected-roles',q.value FROM (
SELECT pg_catalog.to_jsonb(pg_catalog.encode(pg_catalog.sha256(pg_catalog.convert_to(q.value::text,'UTF8')),'hex')) AS value FROM (
SELECT pg_catalog.jsonb_agg(pg_catalog.jsonb_build_object('oid',r.oid,'name',r.rolname,
 'super',r.rolsuper,'inherit',r.rolinherit,'login',r.rolcanlogin,'create_role',r.rolcreaterole,
 'create_db',r.rolcreatedb,'replicate',r.rolreplication,'bypass',r.rolbypassrls,'config',r.rolconfig,
 'connection_limit',r.rolconnlimit,'valid_until',r.rolvaliduntil,
 'settings',(SELECT pg_catalog.jsonb_agg(pg_catalog.to_jsonb(s) ORDER BY s.setdatabase,s.setrole)
   FROM pg_catalog.pg_db_role_setting s WHERE s.setrole=r.oid)) ORDER BY r.oid) AS value
 FROM pg_catalog.pg_roles r WHERE r.rolname IN ('postgres','ot_v3_jobs_owner','ot_v3_jobs_caller','ot_v3_intake_owner','ot_v3_intake_caller','ot_v3_method_reader')
) q
) q;

INSERT INTO official_v3_jobs_private.catalog_binding_v1(object_identity,fingerprint)
SELECT 'creator-edges',q.value FROM (
SELECT pg_catalog.to_jsonb(pg_catalog.encode(pg_catalog.sha256(pg_catalog.convert_to(q.value::text,'UTF8')),'hex')) AS value FROM (
SELECT pg_catalog.jsonb_agg(pg_catalog.jsonb_build_object('role',m.roleid,'member',m.member,
 'grantor',m.grantor,'admin',m.admin_option,'inherit',m.inherit_option,'set',m.set_option)
 ORDER BY m.roleid,m.member,m.grantor) AS value FROM pg_catalog.pg_auth_members m
 WHERE (m.roleid='postgres'::pg_catalog.regrole OR m.member='postgres'::pg_catalog.regrole)
   AND NOT(m.roleid IN ('ot_v3_jobs_owner'::pg_catalog.regrole,'ot_v3_intake_owner'::pg_catalog.regrole)
     AND m.member='postgres'::pg_catalog.regrole AND m.grantor='postgres'::pg_catalog.regrole
     AND NOT m.admin_option AND NOT m.inherit_option AND m.set_option)
) q
) q;

INSERT INTO official_v3_jobs_private.catalog_binding_v1(object_identity,fingerprint)
SELECT 'creator-defaults',q.value FROM (
SELECT pg_catalog.jsonb_build_object('installer','postgres'::pg_catalog.regrole::oid,
 'entries',(SELECT pg_catalog.jsonb_agg(pg_catalog.to_jsonb(d) ORDER BY d.defaclrole,d.defaclnamespace,d.defaclobjtype)
 FROM pg_catalog.pg_default_acl d WHERE d.defaclrole IN
   (SELECT r.oid FROM pg_catalog.pg_roles r WHERE r.rolname IN ('postgres','ot_v3_jobs_owner','ot_v3_jobs_caller','ot_v3_intake_owner','ot_v3_intake_caller','ot_v3_method_reader'))
 OR d.defaclnamespace IN (SELECT n.oid FROM pg_catalog.pg_namespace n WHERE n.nspname IN ('official_v3_jobs_private','official_v3_jobs_api','jetnity_ot_auth','official_v3_method_private','official_v3_method_api','official_v3_intake_private','official_v3_intake_api')))) AS value
) q;

INSERT INTO official_v3_jobs_private.catalog_binding_v1(object_identity,fingerprint)
SELECT 'database',q.value FROM (
SELECT pg_catalog.to_jsonb(pg_catalog.encode(pg_catalog.sha256(pg_catalog.convert_to(q.value::text,'UTF8')),'hex')) AS value FROM (
SELECT pg_catalog.jsonb_build_object('oid',d.oid,'name',d.datname,'owner',d.datdba,'acl',d.datacl,
 'encoding',d.encoding,'allow_connections',d.datallowconn,'connection_limit',d.datconnlimit,
 'settings',(SELECT pg_catalog.jsonb_agg(pg_catalog.to_jsonb(s) ORDER BY s.setrole)
   FROM pg_catalog.pg_db_role_setting s WHERE s.setdatabase=d.oid AND s.setrole=0)) AS value
 FROM pg_catalog.pg_database d WHERE d.datname=current_database()
) q
) q;

INSERT INTO official_v3_jobs_private.catalog_binding_v1(object_identity,fingerprint)
SELECT 'package-context','{"package":"HM04-v1-A1","original_jobs_sha256":"0d2210d84c02aacbeef1c8e14b38e7be6c2e3e8c387057fd97666fb00c71bba4","original_r41_native_sha256":"a61b94e98691ecf6212f2e9cadfada3d470927c319f0ef9a6ed008f63ec658ea","pg1_sha256":"3e21495ff40f66337b004fadc98599cd336c19c31bb4f6e4f9013c2c01f02bd2","hma1_sha256":"edbaf9d56b3da115b12bf1c8cfd5c76d8bc9483f7fc1658ee648b380a16fe2c0","hs1_sha256":"9430eb05890203b0aefedc2d5a12cb0b16d9940152b75afc864da2440ce62b55"}'::jsonb || pg_catalog.jsonb_build_object('creator','postgres'::pg_catalog.regrole::oid,'database',(SELECT d.oid FROM pg_catalog.pg_database d WHERE d.datname=current_database()));
DO $hm04_bound_final_objects$
DECLARE creator oid; owner_id oid:='ot_v3_jobs_owner'::pg_catalog.regrole;
  caller_id oid:='ot_v3_jobs_caller'::pg_catalog.regrole; intake_id oid:='ot_v3_intake_owner'::pg_catalog.regrole;
  login_id oid; expected record; actual_function pg_catalog.pg_proc%ROWTYPE; expected_types oid[];
  foreign_dependency boolean; actual_value jsonb; bound_value jsonb;
BEGIN

  SELECT (fingerprint->>'installer')::oid INTO creator
    FROM official_v3_jobs_private.catalog_binding_v1 WHERE object_identity='creator-defaults';
  IF creator IS DISTINCT FROM 'postgres'::pg_catalog.regrole::oid
    OR (SELECT count(*) FROM official_v3_jobs_private.catalog_binding_v1)<>15
    OR EXISTS(SELECT 1 FROM official_v3_jobs_private.catalog_binding_v1
      WHERE object_identity<>ALL(ARRAY['jobs-functions','jobs-relations','jobs-types','jobs-schemas','jobs-dependencies','prerequisite-functions','prerequisite-relations','prerequisite-types','prerequisite-schemas','prerequisite-dependencies','protected-roles','creator-edges','creator-defaults','database','package-context' ]::text[]))
    OR (SELECT fingerprint FROM official_v3_jobs_private.catalog_binding_v1 WHERE object_identity='package-context')
      IS DISTINCT FROM ('{"package":"HM04-v1-A1","original_jobs_sha256":"0d2210d84c02aacbeef1c8e14b38e7be6c2e3e8c387057fd97666fb00c71bba4","original_r41_native_sha256":"a61b94e98691ecf6212f2e9cadfada3d470927c319f0ef9a6ed008f63ec658ea","pg1_sha256":"3e21495ff40f66337b004fadc98599cd336c19c31bb4f6e4f9013c2c01f02bd2","hma1_sha256":"edbaf9d56b3da115b12bf1c8cfd5c76d8bc9483f7fc1658ee648b380a16fe2c0","hs1_sha256":"9430eb05890203b0aefedc2d5a12cb0b16d9940152b75afc864da2440ce62b55"}'::jsonb || pg_catalog.jsonb_build_object('creator','postgres'::pg_catalog.regrole::oid,'database',(SELECT d.oid FROM pg_catalog.pg_database d WHERE d.datname=current_database()))) THEN
    RAISE EXCEPTION 'hm04 original Creator/package binding' USING ERRCODE='P7603';
  END IF;
  SELECT q.value INTO actual_value FROM (
SELECT pg_catalog.to_jsonb(pg_catalog.encode(pg_catalog.sha256(pg_catalog.convert_to(q.value::text,'UTF8')),'hex')) AS value FROM (
SELECT pg_catalog.jsonb_agg(pg_catalog.jsonb_build_object(
  'catalog',pg_catalog.to_jsonb(p)-'prosrc'-'prosqlbody'-'probin',
  'definition',pg_catalog.encode(pg_catalog.sha256(pg_catalog.convert_to(pg_catalog.pg_get_functiondef(p.oid),'UTF8')),'hex'))
  ORDER BY p.oid) AS value FROM pg_catalog.pg_proc p JOIN pg_catalog.pg_namespace n ON n.oid=p.pronamespace
  WHERE n.nspname IN ('official_v3_jobs_private','official_v3_jobs_api')
) q
  ) q;
  SELECT fingerprint INTO bound_value FROM official_v3_jobs_private.catalog_binding_v1 WHERE object_identity='jobs-functions';
  IF actual_value IS DISTINCT FROM bound_value THEN
    RAISE EXCEPTION 'hm04 catalog drift: jobs-functions' USING ERRCODE='P7603';
  END IF;
  SELECT q.value INTO actual_value FROM (
SELECT pg_catalog.to_jsonb(pg_catalog.encode(pg_catalog.sha256(pg_catalog.convert_to(q.value::text,'UTF8')),'hex')) AS value FROM (
SELECT pg_catalog.jsonb_agg(pg_catalog.jsonb_build_object(
  'name',c.relname,'oid',c.oid,'namespace',c.relnamespace,'kind',c.relkind,'owner',c.relowner,'acl',c.relacl,
  'rls',c.relrowsecurity,'force',c.relforcerowsecurity,'persistence',c.relpersistence,'partition',c.relispartition,
  'oftype',c.reloftype,'replica',c.relreplident,'options',c.reloptions,'access',c.relam,'tablespace',c.reltablespace,
  'columns',(SELECT pg_catalog.jsonb_agg(pg_catalog.to_jsonb(a) ORDER BY a.attnum) FROM pg_catalog.pg_attribute a
    WHERE a.attrelid=c.oid AND a.attnum>0),
  'defaults',(SELECT pg_catalog.jsonb_agg(pg_catalog.to_jsonb(a) ORDER BY a.adnum) FROM pg_catalog.pg_attrdef a WHERE a.adrelid=c.oid),
  'constraints',(SELECT pg_catalog.jsonb_agg(pg_catalog.to_jsonb(k) ORDER BY k.oid) FROM pg_catalog.pg_constraint k WHERE k.conrelid=c.oid),
  'indexes',(SELECT pg_catalog.jsonb_agg(pg_catalog.to_jsonb(i) ORDER BY i.indexrelid) FROM pg_catalog.pg_index i WHERE i.indrelid=c.oid),
  'policies',(SELECT pg_catalog.jsonb_agg(pg_catalog.to_jsonb(p) ORDER BY p.oid) FROM pg_catalog.pg_policy p WHERE p.polrelid=c.oid),
  'triggers',(SELECT pg_catalog.jsonb_agg(pg_catalog.to_jsonb(g) ORDER BY g.oid) FROM pg_catalog.pg_trigger g WHERE g.tgrelid=c.oid),
  'inheritance',(SELECT pg_catalog.jsonb_agg(pg_catalog.to_jsonb(i) ORDER BY i.inhrelid,i.inhparent) FROM pg_catalog.pg_inherits i WHERE i.inhrelid=c.oid OR i.inhparent=c.oid),
  'rewrites',(SELECT pg_catalog.jsonb_agg(pg_catalog.to_jsonb(r) ORDER BY r.oid) FROM pg_catalog.pg_rewrite r WHERE r.ev_class=c.oid))
  ORDER BY c.oid) AS value FROM pg_catalog.pg_class c JOIN pg_catalog.pg_namespace n ON n.oid=c.relnamespace
  WHERE n.nspname IN ('official_v3_jobs_private','official_v3_jobs_api')
) q
  ) q;
  SELECT fingerprint INTO bound_value FROM official_v3_jobs_private.catalog_binding_v1 WHERE object_identity='jobs-relations';
  IF actual_value IS DISTINCT FROM bound_value THEN
    RAISE EXCEPTION 'hm04 catalog drift: jobs-relations' USING ERRCODE='P7603';
  END IF;
  SELECT q.value INTO actual_value FROM (
SELECT pg_catalog.to_jsonb(pg_catalog.encode(pg_catalog.sha256(pg_catalog.convert_to(q.value::text,'UTF8')),'hex')) AS value FROM (
SELECT pg_catalog.jsonb_agg(pg_catalog.to_jsonb(t) ORDER BY t.oid) AS value
  FROM pg_catalog.pg_type t JOIN pg_catalog.pg_namespace n ON n.oid=t.typnamespace WHERE n.nspname IN ('official_v3_jobs_private','official_v3_jobs_api')
) q
  ) q;
  SELECT fingerprint INTO bound_value FROM official_v3_jobs_private.catalog_binding_v1 WHERE object_identity='jobs-types';
  IF actual_value IS DISTINCT FROM bound_value THEN
    RAISE EXCEPTION 'hm04 catalog drift: jobs-types' USING ERRCODE='P7603';
  END IF;
  SELECT q.value INTO actual_value FROM (
SELECT pg_catalog.to_jsonb(pg_catalog.encode(pg_catalog.sha256(pg_catalog.convert_to(q.value::text,'UTF8')),'hex')) AS value FROM (
SELECT pg_catalog.jsonb_agg(pg_catalog.to_jsonb(n) ORDER BY n.oid) AS value
  FROM pg_catalog.pg_namespace n WHERE n.nspname IN ('official_v3_jobs_private','official_v3_jobs_api')
) q
  ) q;
  SELECT fingerprint INTO bound_value FROM official_v3_jobs_private.catalog_binding_v1 WHERE object_identity='jobs-schemas';
  IF actual_value IS DISTINCT FROM bound_value THEN
    RAISE EXCEPTION 'hm04 catalog drift: jobs-schemas' USING ERRCODE='P7603';
  END IF;
  SELECT q.value INTO actual_value FROM (
WITH scope_schemas AS (
  SELECT n.oid,n.nspname FROM pg_catalog.pg_namespace n WHERE n.nspname IN ('official_v3_jobs_private','official_v3_jobs_api')
), scope_tables AS (
  SELECT c.oid,c.reltoastrelid FROM pg_catalog.pg_class c JOIN scope_schemas n ON n.oid=c.relnamespace WHERE c.relkind='r'
), scope_classes AS (
  SELECT c.oid FROM pg_catalog.pg_class c JOIN scope_schemas n ON n.oid=c.relnamespace
  UNION SELECT t.reltoastrelid FROM scope_tables t WHERE t.reltoastrelid<>0
  UNION SELECT i.indexrelid FROM pg_catalog.pg_index i JOIN scope_tables t ON i.indrelid=t.reltoastrelid WHERE t.reltoastrelid<>0
), scope_objects AS (
  SELECT 'pg_catalog.pg_namespace'::pg_catalog.regclass::oid AS classid,n.oid AS objid FROM scope_schemas n
  UNION SELECT 'pg_catalog.pg_class'::pg_catalog.regclass,c.oid FROM scope_classes c
  UNION SELECT 'pg_catalog.pg_type'::pg_catalog.regclass,t.oid FROM pg_catalog.pg_type t JOIN scope_schemas n ON n.oid=t.typnamespace
  UNION SELECT 'pg_catalog.pg_proc'::pg_catalog.regclass,p.oid FROM pg_catalog.pg_proc p JOIN scope_schemas n ON n.oid=p.pronamespace
  UNION SELECT 'pg_catalog.pg_constraint'::pg_catalog.regclass,c.oid FROM pg_catalog.pg_constraint c JOIN scope_tables t ON t.oid=c.conrelid
  UNION SELECT 'pg_catalog.pg_trigger'::pg_catalog.regclass,g.oid FROM pg_catalog.pg_trigger g JOIN scope_tables t ON t.oid=g.tgrelid
  UNION SELECT 'pg_catalog.pg_policy'::pg_catalog.regclass,p.oid FROM pg_catalog.pg_policy p JOIN scope_tables t ON t.oid=p.polrelid
  UNION SELECT 'pg_catalog.pg_attrdef'::pg_catalog.regclass,d.oid FROM pg_catalog.pg_attrdef d JOIN scope_tables t ON t.oid=d.adrelid
)
SELECT pg_catalog.to_jsonb(pg_catalog.encode(pg_catalog.sha256(pg_catalog.convert_to(pg_catalog.jsonb_build_object(
  'dependencies',(SELECT pg_catalog.jsonb_agg(pg_catalog.to_jsonb(d) ORDER BY d.classid,d.objid,d.objsubid,d.refclassid,d.refobjid,d.refobjsubid,d.deptype)
    FROM pg_catalog.pg_depend d WHERE EXISTS(SELECT 1 FROM scope_objects o WHERE o.classid=d.classid AND o.objid=d.objid)
      OR EXISTS(SELECT 1 FROM scope_objects o WHERE o.classid=d.refclassid AND o.objid=d.refobjid)),
  'shared',(SELECT pg_catalog.jsonb_agg(pg_catalog.to_jsonb(d) ORDER BY d.dbid,d.classid,d.objid,d.objsubid,d.refclassid,d.refobjid,d.deptype)
    FROM pg_catalog.pg_shdepend d WHERE d.dbid=(SELECT b.oid FROM pg_catalog.pg_database b WHERE b.datname=current_database())
      AND EXISTS(SELECT 1 FROM scope_objects o WHERE o.classid=d.classid AND o.objid=d.objid)),
  'labels',(SELECT pg_catalog.jsonb_agg(pg_catalog.to_jsonb(s) ORDER BY s.classoid,s.objoid,s.objsubid,s.provider)
    FROM pg_catalog.pg_seclabel s JOIN scope_objects o ON o.classid=s.classoid AND o.objid=s.objoid),
  'descriptions',(SELECT pg_catalog.jsonb_agg(pg_catalog.to_jsonb(d) ORDER BY d.classoid,d.objoid,d.objsubid)
    FROM pg_catalog.pg_description d JOIN scope_objects o ON o.classid=d.classoid AND o.objid=d.objoid)
)::text,'UTF8')),'hex')) AS value
  ) q;
  SELECT fingerprint INTO bound_value FROM official_v3_jobs_private.catalog_binding_v1 WHERE object_identity='jobs-dependencies';
  IF actual_value IS DISTINCT FROM bound_value THEN
    RAISE EXCEPTION 'hm04 catalog drift: jobs-dependencies' USING ERRCODE='P7603';
  END IF;
  SELECT q.value INTO actual_value FROM (
SELECT pg_catalog.to_jsonb(pg_catalog.encode(pg_catalog.sha256(pg_catalog.convert_to(q.value::text,'UTF8')),'hex')) AS value FROM (
SELECT pg_catalog.jsonb_agg(pg_catalog.jsonb_build_object(
  'catalog',pg_catalog.to_jsonb(p)-'prosrc'-'prosqlbody'-'probin',
  'definition',pg_catalog.encode(pg_catalog.sha256(pg_catalog.convert_to(pg_catalog.pg_get_functiondef(p.oid),'UTF8')),'hex'))
  ORDER BY p.oid) AS value FROM pg_catalog.pg_proc p JOIN pg_catalog.pg_namespace n ON n.oid=p.pronamespace
  WHERE n.nspname IN ('jetnity_ot_auth','official_v3_method_private','official_v3_method_api','official_v3_intake_private','official_v3_intake_api')
) q
  ) q;
  SELECT fingerprint INTO bound_value FROM official_v3_jobs_private.catalog_binding_v1 WHERE object_identity='prerequisite-functions';
  IF actual_value IS DISTINCT FROM bound_value THEN
    RAISE EXCEPTION 'hm04 catalog drift: prerequisite-functions' USING ERRCODE='P7603';
  END IF;
  SELECT q.value INTO actual_value FROM (
SELECT pg_catalog.to_jsonb(pg_catalog.encode(pg_catalog.sha256(pg_catalog.convert_to(q.value::text,'UTF8')),'hex')) AS value FROM (
SELECT pg_catalog.jsonb_agg(pg_catalog.jsonb_build_object(
  'name',c.relname,'oid',c.oid,'namespace',c.relnamespace,'kind',c.relkind,'owner',c.relowner,'acl',c.relacl,
  'rls',c.relrowsecurity,'force',c.relforcerowsecurity,'persistence',c.relpersistence,'partition',c.relispartition,
  'oftype',c.reloftype,'replica',c.relreplident,'options',c.reloptions,'access',c.relam,'tablespace',c.reltablespace,
  'columns',(SELECT pg_catalog.jsonb_agg(pg_catalog.to_jsonb(a) ORDER BY a.attnum) FROM pg_catalog.pg_attribute a
    WHERE a.attrelid=c.oid AND a.attnum>0),
  'defaults',(SELECT pg_catalog.jsonb_agg(pg_catalog.to_jsonb(a) ORDER BY a.adnum) FROM pg_catalog.pg_attrdef a WHERE a.adrelid=c.oid),
  'constraints',(SELECT pg_catalog.jsonb_agg(pg_catalog.to_jsonb(k) ORDER BY k.oid) FROM pg_catalog.pg_constraint k WHERE k.conrelid=c.oid),
  'indexes',(SELECT pg_catalog.jsonb_agg(pg_catalog.to_jsonb(i) ORDER BY i.indexrelid) FROM pg_catalog.pg_index i WHERE i.indrelid=c.oid),
  'policies',(SELECT pg_catalog.jsonb_agg(pg_catalog.to_jsonb(p) ORDER BY p.oid) FROM pg_catalog.pg_policy p WHERE p.polrelid=c.oid),
  'triggers',(SELECT pg_catalog.jsonb_agg(pg_catalog.to_jsonb(g) ORDER BY g.oid) FROM pg_catalog.pg_trigger g WHERE g.tgrelid=c.oid),
  'inheritance',(SELECT pg_catalog.jsonb_agg(pg_catalog.to_jsonb(i) ORDER BY i.inhrelid,i.inhparent) FROM pg_catalog.pg_inherits i WHERE i.inhrelid=c.oid OR i.inhparent=c.oid),
  'rewrites',(SELECT pg_catalog.jsonb_agg(pg_catalog.to_jsonb(r) ORDER BY r.oid) FROM pg_catalog.pg_rewrite r WHERE r.ev_class=c.oid))
  ORDER BY c.oid) AS value FROM pg_catalog.pg_class c JOIN pg_catalog.pg_namespace n ON n.oid=c.relnamespace
  WHERE n.nspname IN ('jetnity_ot_auth','official_v3_method_private','official_v3_method_api','official_v3_intake_private','official_v3_intake_api')
) q
  ) q;
  SELECT fingerprint INTO bound_value FROM official_v3_jobs_private.catalog_binding_v1 WHERE object_identity='prerequisite-relations';
  IF actual_value IS DISTINCT FROM bound_value THEN
    RAISE EXCEPTION 'hm04 catalog drift: prerequisite-relations' USING ERRCODE='P7603';
  END IF;
  SELECT q.value INTO actual_value FROM (
SELECT pg_catalog.to_jsonb(pg_catalog.encode(pg_catalog.sha256(pg_catalog.convert_to(q.value::text,'UTF8')),'hex')) AS value FROM (
SELECT pg_catalog.jsonb_agg(pg_catalog.to_jsonb(t) ORDER BY t.oid) AS value
  FROM pg_catalog.pg_type t JOIN pg_catalog.pg_namespace n ON n.oid=t.typnamespace WHERE n.nspname IN ('jetnity_ot_auth','official_v3_method_private','official_v3_method_api','official_v3_intake_private','official_v3_intake_api')
) q
  ) q;
  SELECT fingerprint INTO bound_value FROM official_v3_jobs_private.catalog_binding_v1 WHERE object_identity='prerequisite-types';
  IF actual_value IS DISTINCT FROM bound_value THEN
    RAISE EXCEPTION 'hm04 catalog drift: prerequisite-types' USING ERRCODE='P7603';
  END IF;
  SELECT q.value INTO actual_value FROM (
SELECT pg_catalog.to_jsonb(pg_catalog.encode(pg_catalog.sha256(pg_catalog.convert_to(q.value::text,'UTF8')),'hex')) AS value FROM (
SELECT pg_catalog.jsonb_agg(pg_catalog.to_jsonb(n) ORDER BY n.oid) AS value
  FROM pg_catalog.pg_namespace n WHERE n.nspname IN ('jetnity_ot_auth','official_v3_method_private','official_v3_method_api','official_v3_intake_private','official_v3_intake_api')
) q
  ) q;
  SELECT fingerprint INTO bound_value FROM official_v3_jobs_private.catalog_binding_v1 WHERE object_identity='prerequisite-schemas';
  IF actual_value IS DISTINCT FROM bound_value THEN
    RAISE EXCEPTION 'hm04 catalog drift: prerequisite-schemas' USING ERRCODE='P7603';
  END IF;
  SELECT q.value INTO actual_value FROM (
WITH scope_schemas AS (
  SELECT n.oid,n.nspname FROM pg_catalog.pg_namespace n WHERE n.nspname IN ('jetnity_ot_auth','official_v3_method_private','official_v3_method_api','official_v3_intake_private','official_v3_intake_api')
), scope_tables AS (
  SELECT c.oid,c.reltoastrelid FROM pg_catalog.pg_class c JOIN scope_schemas n ON n.oid=c.relnamespace WHERE c.relkind='r'
), scope_classes AS (
  SELECT c.oid FROM pg_catalog.pg_class c JOIN scope_schemas n ON n.oid=c.relnamespace
  UNION SELECT t.reltoastrelid FROM scope_tables t WHERE t.reltoastrelid<>0
  UNION SELECT i.indexrelid FROM pg_catalog.pg_index i JOIN scope_tables t ON i.indrelid=t.reltoastrelid WHERE t.reltoastrelid<>0
), scope_objects AS (
  SELECT 'pg_catalog.pg_namespace'::pg_catalog.regclass::oid AS classid,n.oid AS objid FROM scope_schemas n
  UNION SELECT 'pg_catalog.pg_class'::pg_catalog.regclass,c.oid FROM scope_classes c
  UNION SELECT 'pg_catalog.pg_type'::pg_catalog.regclass,t.oid FROM pg_catalog.pg_type t JOIN scope_schemas n ON n.oid=t.typnamespace
  UNION SELECT 'pg_catalog.pg_proc'::pg_catalog.regclass,p.oid FROM pg_catalog.pg_proc p JOIN scope_schemas n ON n.oid=p.pronamespace
  UNION SELECT 'pg_catalog.pg_constraint'::pg_catalog.regclass,c.oid FROM pg_catalog.pg_constraint c JOIN scope_tables t ON t.oid=c.conrelid
  UNION SELECT 'pg_catalog.pg_trigger'::pg_catalog.regclass,g.oid FROM pg_catalog.pg_trigger g JOIN scope_tables t ON t.oid=g.tgrelid
  UNION SELECT 'pg_catalog.pg_policy'::pg_catalog.regclass,p.oid FROM pg_catalog.pg_policy p JOIN scope_tables t ON t.oid=p.polrelid
  UNION SELECT 'pg_catalog.pg_attrdef'::pg_catalog.regclass,d.oid FROM pg_catalog.pg_attrdef d JOIN scope_tables t ON t.oid=d.adrelid
)
SELECT pg_catalog.to_jsonb(pg_catalog.encode(pg_catalog.sha256(pg_catalog.convert_to(pg_catalog.jsonb_build_object(
  'dependencies',(SELECT pg_catalog.jsonb_agg(pg_catalog.to_jsonb(d) ORDER BY d.classid,d.objid,d.objsubid,d.refclassid,d.refobjid,d.refobjsubid,d.deptype)
    FROM pg_catalog.pg_depend d WHERE EXISTS(SELECT 1 FROM scope_objects o WHERE o.classid=d.classid AND o.objid=d.objid)
      OR EXISTS(SELECT 1 FROM scope_objects o WHERE o.classid=d.refclassid AND o.objid=d.refobjid)),
  'shared',(SELECT pg_catalog.jsonb_agg(pg_catalog.to_jsonb(d) ORDER BY d.dbid,d.classid,d.objid,d.objsubid,d.refclassid,d.refobjid,d.deptype)
    FROM pg_catalog.pg_shdepend d WHERE d.dbid=(SELECT b.oid FROM pg_catalog.pg_database b WHERE b.datname=current_database())
      AND EXISTS(SELECT 1 FROM scope_objects o WHERE o.classid=d.classid AND o.objid=d.objid)),
  'labels',(SELECT pg_catalog.jsonb_agg(pg_catalog.to_jsonb(s) ORDER BY s.classoid,s.objoid,s.objsubid,s.provider)
    FROM pg_catalog.pg_seclabel s JOIN scope_objects o ON o.classid=s.classoid AND o.objid=s.objoid),
  'descriptions',(SELECT pg_catalog.jsonb_agg(pg_catalog.to_jsonb(d) ORDER BY d.classoid,d.objoid,d.objsubid)
    FROM pg_catalog.pg_description d JOIN scope_objects o ON o.classid=d.classoid AND o.objid=d.objoid)
)::text,'UTF8')),'hex')) AS value
  ) q;
  SELECT fingerprint INTO bound_value FROM official_v3_jobs_private.catalog_binding_v1 WHERE object_identity='prerequisite-dependencies';
  IF actual_value IS DISTINCT FROM bound_value THEN
    RAISE EXCEPTION 'hm04 catalog drift: prerequisite-dependencies' USING ERRCODE='P7603';
  END IF;
  SELECT q.value INTO actual_value FROM (
SELECT pg_catalog.to_jsonb(pg_catalog.encode(pg_catalog.sha256(pg_catalog.convert_to(q.value::text,'UTF8')),'hex')) AS value FROM (
SELECT pg_catalog.jsonb_agg(pg_catalog.jsonb_build_object('oid',r.oid,'name',r.rolname,
 'super',r.rolsuper,'inherit',r.rolinherit,'login',r.rolcanlogin,'create_role',r.rolcreaterole,
 'create_db',r.rolcreatedb,'replicate',r.rolreplication,'bypass',r.rolbypassrls,'config',r.rolconfig,
 'connection_limit',r.rolconnlimit,'valid_until',r.rolvaliduntil,
 'settings',(SELECT pg_catalog.jsonb_agg(pg_catalog.to_jsonb(s) ORDER BY s.setdatabase,s.setrole)
   FROM pg_catalog.pg_db_role_setting s WHERE s.setrole=r.oid)) ORDER BY r.oid) AS value
 FROM pg_catalog.pg_roles r WHERE r.rolname IN ('postgres','ot_v3_jobs_owner','ot_v3_jobs_caller','ot_v3_intake_owner','ot_v3_intake_caller','ot_v3_method_reader')
) q
  ) q;
  SELECT fingerprint INTO bound_value FROM official_v3_jobs_private.catalog_binding_v1 WHERE object_identity='protected-roles';
  IF actual_value IS DISTINCT FROM bound_value THEN
    RAISE EXCEPTION 'hm04 catalog drift: protected-roles' USING ERRCODE='P7603';
  END IF;
  SELECT q.value INTO actual_value FROM (
SELECT pg_catalog.to_jsonb(pg_catalog.encode(pg_catalog.sha256(pg_catalog.convert_to(q.value::text,'UTF8')),'hex')) AS value FROM (
SELECT pg_catalog.jsonb_agg(pg_catalog.jsonb_build_object('role',m.roleid,'member',m.member,
 'grantor',m.grantor,'admin',m.admin_option,'inherit',m.inherit_option,'set',m.set_option)
 ORDER BY m.roleid,m.member,m.grantor) AS value FROM pg_catalog.pg_auth_members m
 WHERE (m.roleid='postgres'::pg_catalog.regrole OR m.member='postgres'::pg_catalog.regrole)
   AND NOT(m.roleid IN ('ot_v3_jobs_owner'::pg_catalog.regrole,'ot_v3_intake_owner'::pg_catalog.regrole)
     AND m.member='postgres'::pg_catalog.regrole AND m.grantor='postgres'::pg_catalog.regrole
     AND NOT m.admin_option AND NOT m.inherit_option AND m.set_option)
) q
  ) q;
  SELECT fingerprint INTO bound_value FROM official_v3_jobs_private.catalog_binding_v1 WHERE object_identity='creator-edges';
  IF actual_value IS DISTINCT FROM bound_value THEN
    RAISE EXCEPTION 'hm04 catalog drift: creator-edges' USING ERRCODE='P7603';
  END IF;
  SELECT q.value INTO actual_value FROM (
SELECT pg_catalog.jsonb_build_object('installer','postgres'::pg_catalog.regrole::oid,
 'entries',(SELECT pg_catalog.jsonb_agg(pg_catalog.to_jsonb(d) ORDER BY d.defaclrole,d.defaclnamespace,d.defaclobjtype)
 FROM pg_catalog.pg_default_acl d WHERE d.defaclrole IN
   (SELECT r.oid FROM pg_catalog.pg_roles r WHERE r.rolname IN ('postgres','ot_v3_jobs_owner','ot_v3_jobs_caller','ot_v3_intake_owner','ot_v3_intake_caller','ot_v3_method_reader'))
 OR d.defaclnamespace IN (SELECT n.oid FROM pg_catalog.pg_namespace n WHERE n.nspname IN ('official_v3_jobs_private','official_v3_jobs_api','jetnity_ot_auth','official_v3_method_private','official_v3_method_api','official_v3_intake_private','official_v3_intake_api')))) AS value
  ) q;
  SELECT fingerprint INTO bound_value FROM official_v3_jobs_private.catalog_binding_v1 WHERE object_identity='creator-defaults';
  IF actual_value IS DISTINCT FROM bound_value THEN
    RAISE EXCEPTION 'hm04 catalog drift: creator-defaults' USING ERRCODE='P7603';
  END IF;
  SELECT q.value INTO actual_value FROM (
SELECT pg_catalog.to_jsonb(pg_catalog.encode(pg_catalog.sha256(pg_catalog.convert_to(q.value::text,'UTF8')),'hex')) AS value FROM (
SELECT pg_catalog.jsonb_build_object('oid',d.oid,'name',d.datname,'owner',d.datdba,'acl',d.datacl,
 'encoding',d.encoding,'allow_connections',d.datallowconn,'connection_limit',d.datconnlimit,
 'settings',(SELECT pg_catalog.jsonb_agg(pg_catalog.to_jsonb(s) ORDER BY s.setrole)
   FROM pg_catalog.pg_db_role_setting s WHERE s.setdatabase=d.oid AND s.setrole=0)) AS value
 FROM pg_catalog.pg_database d WHERE d.datname=current_database()
) q
  ) q;
  SELECT fingerprint INTO bound_value FROM official_v3_jobs_private.catalog_binding_v1 WHERE object_identity='database';
  IF actual_value IS DISTINCT FROM bound_value THEN
    RAISE EXCEPTION 'hm04 catalog drift: database' USING ERRCODE='P7603';
  END IF;

  -- Exact protected owner edges. ADMIN-only bootstrap grants are never rewritten.
  IF EXISTS(SELECT 1 FROM pg_catalog.pg_roles r WHERE r.oid IN (owner_id,caller_id,intake_id)
      AND (r.rolcanlogin OR r.rolinherit OR r.rolsuper OR r.rolcreatedb OR r.rolcreaterole
        OR r.rolreplication OR r.rolbypassrls OR r.rolconfig IS NOT NULL OR r.rolconnlimit<>-1 OR r.rolvaliduntil IS NOT NULL))
    OR EXISTS(SELECT 1 FROM pg_catalog.pg_db_role_setting s WHERE s.setrole IN (owner_id,caller_id,intake_id))
    OR EXISTS(SELECT 1 FROM pg_catalog.pg_default_acl d WHERE d.defaclrole IN (owner_id,caller_id,intake_id))
    OR pg_catalog.has_database_privilege(owner_id,current_database(),'CREATE')
    OR pg_catalog.has_database_privilege(caller_id,current_database(),'CREATE')
    OR pg_catalog.has_database_privilege(intake_id,current_database(),'CREATE')
    OR NOT EXISTS(SELECT 1 FROM pg_catalog.pg_roles r WHERE r.oid=10 AND r.rolsuper) THEN
    RAISE EXCEPTION 'hm04 restricted role/default boundary' USING ERRCODE='P7603';
  END IF;
  IF (SELECT count(*) FROM pg_catalog.pg_auth_members m
      WHERE m.roleid=owner_id OR m.member=owner_id OR m.grantor=owner_id)<>2
    OR (SELECT count(*) FROM pg_catalog.pg_auth_members m
      WHERE m.roleid=owner_id AND m.member=creator AND m.grantor=10
        AND m.admin_option AND NOT m.inherit_option AND NOT m.set_option)<>1
    OR (SELECT count(*) FROM pg_catalog.pg_auth_members m
      WHERE m.roleid=owner_id AND m.member=creator AND m.grantor=creator
        AND NOT m.admin_option AND NOT m.inherit_option AND m.set_option)<>1
    OR pg_catalog.pg_has_role(creator,owner_id,'USAGE')
    OR pg_catalog.pg_has_role(creator,owner_id,'SET') IS DISTINCT FROM true
    OR (SELECT count(*) FROM pg_catalog.pg_auth_members m
      WHERE m.roleid=intake_id OR m.member=intake_id OR m.grantor=intake_id)<>2
    OR (SELECT count(*) FROM pg_catalog.pg_auth_members m
      WHERE m.roleid=intake_id AND m.member=creator AND m.grantor=10
        AND m.admin_option AND NOT m.inherit_option AND NOT m.set_option)<>1
    OR (SELECT count(*) FROM pg_catalog.pg_auth_members m
      WHERE m.roleid=intake_id AND m.member=creator AND m.grantor=creator
        AND NOT m.admin_option AND NOT m.inherit_option AND m.set_option)<>1
    OR pg_catalog.pg_has_role(creator,intake_id,'USAGE')
    OR pg_catalog.pg_has_role(creator,intake_id,'SET') IS DISTINCT FROM true THEN
    RAISE EXCEPTION 'hm04 exact protected membership boundary' USING ERRCODE='P7603';
  END IF;
  IF (SELECT count(*) FROM pg_catalog.pg_auth_members m WHERE m.roleid=caller_id
      AND m.member=creator AND m.grantor=10 AND m.admin_option AND NOT m.inherit_option AND NOT m.set_option)<>1
    OR EXISTS(SELECT 1 FROM pg_catalog.pg_auth_members m WHERE m.member=caller_id OR m.grantor=caller_id)
    OR pg_catalog.pg_has_role(creator,caller_id,'SET') OR pg_catalog.pg_has_role(creator,caller_id,'USAGE')
    OR (SELECT count(*) FROM pg_catalog.pg_auth_members m WHERE m.roleid=caller_id
      AND NOT(m.member=creator AND m.grantor=10 AND m.admin_option AND NOT m.inherit_option AND NOT m.set_option))>0 THEN
    RAISE EXCEPTION 'hm04 caller graph boundary' USING ERRCODE='P7603';
  END IF;

END $hm04_bound_final_objects$;

-- This is the last owner operation. No owner write is attempted after revocation.
RESET ROLE;
REVOKE ot_v3_intake_owner FROM postgres GRANTED BY postgres RESTRICT;
REVOKE ot_v3_jobs_owner FROM postgres GRANTED BY postgres RESTRICT;
DO $hm04_final_creator_readback$
DECLARE creator oid; owner_id oid:='ot_v3_jobs_owner'::pg_catalog.regrole;
  caller_id oid:='ot_v3_jobs_caller'::pg_catalog.regrole; intake_id oid:='ot_v3_intake_owner'::pg_catalog.regrole;
  login_id oid; expected record; actual_function pg_catalog.pg_proc%ROWTYPE; expected_types oid[];
  foreign_dependency boolean; actual_value jsonb; bound_value jsonb;
BEGIN
  creator:=session_user::pg_catalog.regrole;

  -- Exact protected owner edges. ADMIN-only bootstrap grants are never rewritten.
  IF EXISTS(SELECT 1 FROM pg_catalog.pg_roles r WHERE r.oid IN (owner_id,caller_id,intake_id)
      AND (r.rolcanlogin OR r.rolinherit OR r.rolsuper OR r.rolcreatedb OR r.rolcreaterole
        OR r.rolreplication OR r.rolbypassrls OR r.rolconfig IS NOT NULL OR r.rolconnlimit<>-1 OR r.rolvaliduntil IS NOT NULL))
    OR EXISTS(SELECT 1 FROM pg_catalog.pg_db_role_setting s WHERE s.setrole IN (owner_id,caller_id,intake_id))
    OR EXISTS(SELECT 1 FROM pg_catalog.pg_default_acl d WHERE d.defaclrole IN (owner_id,caller_id,intake_id))
    OR pg_catalog.has_database_privilege(owner_id,current_database(),'CREATE')
    OR pg_catalog.has_database_privilege(caller_id,current_database(),'CREATE')
    OR pg_catalog.has_database_privilege(intake_id,current_database(),'CREATE')
    OR NOT EXISTS(SELECT 1 FROM pg_catalog.pg_roles r WHERE r.oid=10 AND r.rolsuper) THEN
    RAISE EXCEPTION 'hm04 restricted role/default boundary' USING ERRCODE='P7603';
  END IF;
  IF (SELECT count(*) FROM pg_catalog.pg_auth_members m
      WHERE m.roleid=owner_id OR m.member=owner_id OR m.grantor=owner_id)<>1
    OR (SELECT count(*) FROM pg_catalog.pg_auth_members m
      WHERE m.roleid=owner_id AND m.member=creator AND m.grantor=10
        AND m.admin_option AND NOT m.inherit_option AND NOT m.set_option)<>1
    
    OR pg_catalog.pg_has_role(creator,owner_id,'USAGE')
    OR pg_catalog.pg_has_role(creator,owner_id,'SET') IS DISTINCT FROM false
    OR (SELECT count(*) FROM pg_catalog.pg_auth_members m
      WHERE m.roleid=intake_id OR m.member=intake_id OR m.grantor=intake_id)<>1
    OR (SELECT count(*) FROM pg_catalog.pg_auth_members m
      WHERE m.roleid=intake_id AND m.member=creator AND m.grantor=10
        AND m.admin_option AND NOT m.inherit_option AND NOT m.set_option)<>1
    
    OR pg_catalog.pg_has_role(creator,intake_id,'USAGE')
    OR pg_catalog.pg_has_role(creator,intake_id,'SET') IS DISTINCT FROM false THEN
    RAISE EXCEPTION 'hm04 exact protected membership boundary' USING ERRCODE='P7603';
  END IF;
  IF (SELECT count(*) FROM pg_catalog.pg_auth_members m WHERE m.roleid=caller_id
      AND m.member=creator AND m.grantor=10 AND m.admin_option AND NOT m.inherit_option AND NOT m.set_option)<>1
    OR EXISTS(SELECT 1 FROM pg_catalog.pg_auth_members m WHERE m.member=caller_id OR m.grantor=caller_id)
    OR pg_catalog.pg_has_role(creator,caller_id,'SET') OR pg_catalog.pg_has_role(creator,caller_id,'USAGE')
    OR (SELECT count(*) FROM pg_catalog.pg_auth_members m WHERE m.roleid=caller_id
      AND NOT(m.member=creator AND m.grantor=10 AND m.admin_option AND NOT m.inherit_option AND NOT m.set_option))>0 THEN
    RAISE EXCEPTION 'hm04 caller graph boundary' USING ERRCODE='P7603';
  END IF;

  -- Closed thirty-function inventory; names, types, language, security and ACL.
  IF (SELECT count(*) FROM pg_catalog.pg_proc p JOIN pg_catalog.pg_namespace n ON n.oid=p.pronamespace
      WHERE n.nspname IN ('official_v3_jobs_private','official_v3_jobs_api'))<>30 THEN
    RAISE EXCEPTION 'hm04 function inventory' USING ERRCODE='P7603';
  END IF;
  FOR expected IN SELECT * FROM (VALUES
    ('official_v3_jobs_private','exact_keys_v1','jsonb,text[]',ARRAY['v','expected']::text[],'boolean','sql','i',false,'ot_v3_jobs_owner'),
    ('official_v3_jobs_private','unique_json_v1','json,integer',ARRAY['v','d']::text[],'boolean','plpgsql','i',false,'ot_v3_jobs_owner'),
    ('official_v3_jobs_private','nodes_v1','jsonb,integer,integer,integer',ARRAY['v','d','max_d','max_n']::text[],'integer','plpgsql','i',false,'ot_v3_jobs_owner'),
    ('official_v3_jobs_private','canonical_v1','jsonb,integer',ARRAY['v','d']::text[],'text','plpgsql','i',false,'ot_v3_jobs_owner'),
    ('official_v3_jobs_private','wire_v1','text',ARRAY['t']::text[],'jsonb','plpgsql','i',false,'ot_v3_jobs_owner'),
    ('official_v3_jobs_private','civil_date_v1','text',ARRAY['t']::text[],'boolean','plpgsql','i',false,'ot_v3_jobs_owner'),
    ('official_v3_jobs_private','timestamp_v1','text',ARRAY['t']::text[],'timestamptz','plpgsql','i',false,'ot_v3_jobs_owner'),
    ('official_v3_jobs_private','predicate_v1','jsonb',ARRAY['v']::text[],'jsonb','plpgsql','i',false,'ot_v3_jobs_owner'),
    ('official_v3_jobs_private','expression_v1','jsonb,boolean,integer',ARRAY['v','strip_support','d']::text[],'jsonb','plpgsql','i',false,'ot_v3_jobs_owner'),
    ('official_v3_jobs_private','context_v1','jsonb',ARRAY['v']::text[],'jsonb','plpgsql','i',false,'ot_v3_jobs_owner'),
    ('official_v3_jobs_private','subject_v1','text,jsonb',ARRAY['kind','v']::text[],'jsonb','plpgsql','i',false,'ot_v3_jobs_owner'),
    ('official_v3_jobs_private','job_v1','jsonb',ARRAY['v']::text[],'jsonb','plpgsql','i',false,'ot_v3_jobs_owner'),
    ('official_v3_jobs_private','command_v1','jsonb',ARRAY['v']::text[],'jsonb','plpgsql','i',false,'ot_v3_jobs_owner'),
    ('official_v3_jobs_private','reference_v1','jsonb',ARRAY['v']::text[],'jsonb','plpgsql','i',false,'ot_v3_jobs_owner'),
    ('official_v3_jobs_private','transition_v1','jsonb,jsonb,jsonb',ARRAY['command','current_record','commit']::text[],'void','plpgsql','i',false,'ot_v3_jobs_owner'),
    ('official_v3_jobs_private','immutable_v1','',NULL::text[],'trigger','plpgsql','v',false,'ot_v3_jobs_owner'),
    ('official_v3_jobs_private','s1_read_v1','jsonb,text,integer',ARRAY['b','d','n']::text[],'jsonb','sql','v',true,'ot_v3_intake_owner'),
    ('official_v3_jobs_private','s1_shape_v1','jsonb,text',ARRAY['v','tag']::text[],'boolean','sql','i',true,'ot_v3_intake_owner'),
    ('official_v3_jobs_private','ma1_require_v1','text,integer,text,text,integer',ARRAY['m','r','d','p','e']::text[],'void','sql','v',true,'postgres'),
    ('official_v3_jobs_private','consume_s1_v1','jsonb,jsonb,jsonb,text',ARRAY['reply','job','result','purpose']::text[],'void','plpgsql','v',false,'ot_v3_jobs_owner'),
    ('official_v3_jobs_private','assert_history_v1','text',ARRAY['k']::text[],'void','plpgsql','v',false,'ot_v3_jobs_owner'),
    ('official_v3_jobs_private','assert_catalog_v1','',NULL::text[],'void','plpgsql','v',false,'ot_v3_jobs_owner'),
    ('official_v3_jobs_private','tx_queue_read_v1','jsonb,jsonb,integer,integer,timestamptz',ARRAY['q','b','e','remaining','deadline']::text[],'jsonb','plpgsql','v',false,'ot_v3_jobs_owner'),
    ('official_v3_jobs_private','tx_queue_confirm_v1','jsonb,jsonb,integer,integer,timestamptz',ARRAY['q','b','e','remaining','deadline']::text[],'jsonb','plpgsql','v',false,'ot_v3_jobs_owner'),
    ('official_v3_jobs_private','tx_execution_read_v1','jsonb,jsonb,integer,integer,timestamptz',ARRAY['q','b','e','remaining','deadline']::text[],'jsonb','plpgsql','v',false,'ot_v3_jobs_owner'),
    ('official_v3_jobs_private','tx_execution_start_v1','jsonb,jsonb,integer,integer,timestamptz',ARRAY['q','b','e','remaining','deadline']::text[],'jsonb','plpgsql','v',false,'ot_v3_jobs_owner'),
    ('official_v3_jobs_private','tx_execution_prepare_v1','jsonb,jsonb,integer,integer,timestamptz',ARRAY['q','b','e','remaining','deadline']::text[],'jsonb','plpgsql','v',false,'ot_v3_jobs_owner'),
    ('official_v3_jobs_private','tx_queue_cas_v1','jsonb,jsonb,integer,integer,timestamptz',ARRAY['q','b','e','remaining','deadline']::text[],'jsonb','plpgsql','v',false,'ot_v3_jobs_owner'),
    ('official_v3_jobs_api','execute_v1','text,text,integer,text,text,integer,integer,text',ARRAY['wire','method_id','revision','method_digest','package_digest','epoch','remaining_ms','absolute_not_after']::text[],'jsonb','plpgsql','v',true,'ot_v3_jobs_owner'),
    ('official_v3_jobs_private','ma1_tuple_valid_v1','text,integer,text,text',ARRAY['m','r','d','p']::text[],'boolean','sql','i',true,'postgres')
  ) e(schema_name,function_name,argument_types,argument_names,result_type,language_name,volatility,definer,owner_name) LOOP
    SELECT p.* INTO actual_function FROM pg_catalog.pg_proc p JOIN pg_catalog.pg_namespace n ON n.oid=p.pronamespace
      WHERE n.nspname=expected.schema_name AND p.proname=expected.function_name;
    SELECT COALESCE(pg_catalog.array_agg(pg_catalog.to_regtype('pg_catalog.'||t)::oid ORDER BY ordinal),ARRAY[]::oid[])
      INTO expected_types FROM pg_catalog.unnest(CASE WHEN expected.argument_types='' THEN ARRAY[]::text[]
        ELSE pg_catalog.string_to_array(expected.argument_types,',') END) WITH ORDINALITY AS v(t,ordinal);
    IF actual_function.oid IS NULL OR actual_function.proowner<>pg_catalog.to_regrole(expected.owner_name)
      OR actual_function.prokind<>'f' OR actual_function.prorettype<>pg_catalog.to_regtype('pg_catalog.'||expected.result_type)
      OR actual_function.prolang<>(SELECT l.oid FROM pg_catalog.pg_language l WHERE l.lanname=expected.language_name)
      OR actual_function.prosecdef IS DISTINCT FROM expected.definer OR actual_function.provolatile::text<>expected.volatility
      OR actual_function.proparallel<>'u' OR actual_function.proisstrict OR actual_function.proleakproof
      OR actual_function.proretset OR actual_function.pronargdefaults<>0 OR actual_function.provariadic<>0
      OR actual_function.prosupport<>0 OR actual_function.probin IS NOT NULL
      OR actual_function.proargnames IS DISTINCT FROM expected.argument_names
      OR actual_function.proallargtypes IS NOT NULL OR actual_function.proargmodes IS NOT NULL
      OR ARRAY(SELECT a FROM pg_catalog.unnest(actual_function.proargtypes::oid[]) a) IS DISTINCT FROM expected_types
      OR actual_function.proconfig IS DISTINCT FROM ARRAY['search_path=pg_catalog, pg_temp']::text[]
      OR (expected.function_name IN ('s1_read_v1','s1_shape_v1','ma1_require_v1','ma1_tuple_valid_v1')
          AND actual_function.prosqlbody IS NULL)
      OR EXISTS(SELECT 1 FROM pg_catalog.aclexplode(COALESCE(actual_function.proacl,pg_catalog.acldefault('f',actual_function.proowner))) a
        WHERE a.grantor<>actual_function.proowner OR a.privilege_type<>'EXECUTE' OR a.is_grantable
          OR NOT(a.grantee=actual_function.proowner
            OR expected.function_name IN ('s1_read_v1','s1_shape_v1','ma1_require_v1','ma1_tuple_valid_v1') AND a.grantee=owner_id
            OR expected.schema_name='official_v3_jobs_api' AND a.grantee=caller_id))
      OR NOT pg_catalog.has_function_privilege(actual_function.proowner,actual_function.oid,'EXECUTE')
      OR NOT pg_catalog.has_function_privilege(owner_id,actual_function.oid,'EXECUTE')
      OR (expected.schema_name='official_v3_jobs_api'
          AND NOT pg_catalog.has_function_privilege(caller_id,actual_function.oid,'EXECUTE')) THEN
      RAISE EXCEPTION 'hm04 exact function identity/ACL: %',expected.function_name USING ERRCODE='P7603';
    END IF;
  END LOOP;
  -- Complete original relation, row/array type, policy and trigger counts.
  IF (SELECT count(*) FROM pg_catalog.pg_namespace n WHERE n.nspname IN ('official_v3_jobs_private','official_v3_jobs_api'))<>2
    OR EXISTS(SELECT 1 FROM pg_catalog.pg_namespace n WHERE n.nspname IN ('official_v3_jobs_private','official_v3_jobs_api')
      AND (n.nspowner<>owner_id OR EXISTS(SELECT 1 FROM pg_catalog.aclexplode(COALESCE(n.nspacl,pg_catalog.acldefault('n',n.nspowner))) a
        WHERE a.grantor<>owner_id OR a.is_grantable OR NOT(a.grantee=owner_id
          OR n.nspname='official_v3_jobs_api' AND a.grantee=caller_id AND a.privilege_type='USAGE'))))
    OR NOT pg_catalog.has_schema_privilege(caller_id,'official_v3_jobs_api','USAGE')
    OR pg_catalog.has_schema_privilege(caller_id,'official_v3_jobs_api','CREATE')
    OR pg_catalog.has_schema_privilege(caller_id,'official_v3_jobs_private','USAGE,CREATE')
    OR pg_catalog.has_schema_privilege(creator,'official_v3_jobs_private','USAGE,CREATE')
    OR pg_catalog.has_schema_privilege(intake_id,'official_v3_jobs_private','USAGE,CREATE')
    OR (SELECT count(*) FROM pg_catalog.pg_class c JOIN pg_catalog.pg_namespace n ON n.oid=c.relnamespace
      WHERE n.nspname IN ('official_v3_jobs_private','official_v3_jobs_api'))<>23
    OR (SELECT count(*) FROM pg_catalog.pg_class c JOIN pg_catalog.pg_namespace n ON n.oid=c.relnamespace
      WHERE n.nspname='official_v3_jobs_private' AND c.relkind='r'
        AND c.relname IN ('slots_v1','subjects_v1','queue_operations_v1','execution_starts_v1','execution_results_v1','execution_dispositions_v1','catalog_binding_v1'))<>7
    OR (SELECT count(*) FROM pg_catalog.pg_class c JOIN pg_catalog.pg_namespace n ON n.oid=c.relnamespace
      WHERE n.nspname='official_v3_jobs_private' AND c.relkind='i')<>16
    OR EXISTS(SELECT 1 FROM pg_catalog.pg_class c JOIN pg_catalog.pg_namespace n ON n.oid=c.relnamespace
      WHERE n.nspname IN ('official_v3_jobs_private','official_v3_jobs_api')
        AND (n.nspname<>'official_v3_jobs_private' OR c.relowner<>owner_id OR c.relkind NOT IN ('r','i')
          OR c.relpersistence<>'p' OR c.relispartition OR c.reloftype<>0 OR c.reloptions IS NOT NULL
          OR c.relkind='r' AND (NOT c.relrowsecurity OR NOT c.relforcerowsecurity
            OR COALESCE(c.relacl,pg_catalog.acldefault('r',c.relowner)) IS DISTINCT FROM pg_catalog.acldefault('r',owner_id))
          OR c.relkind='i' AND c.relacl IS NOT NULL))
    OR (SELECT count(*) FROM pg_catalog.pg_type t JOIN pg_catalog.pg_namespace n ON n.oid=t.typnamespace
      WHERE n.nspname IN ('official_v3_jobs_private','official_v3_jobs_api'))<>14
    OR EXISTS(SELECT 1 FROM pg_catalog.pg_type t JOIN pg_catalog.pg_namespace n ON n.oid=t.typnamespace
      WHERE n.nspname IN ('official_v3_jobs_private','official_v3_jobs_api')
        AND (t.typowner<>owner_id OR n.nspname<>'official_v3_jobs_private'
          OR COALESCE(t.typacl,pg_catalog.acldefault('T',t.typowner)) IS DISTINCT FROM pg_catalog.acldefault('T',owner_id)
          OR NOT(t.typtype='c' AND EXISTS(SELECT 1 FROM pg_catalog.pg_class c WHERE c.oid=t.typrelid AND c.reltype=t.oid AND c.relkind='r' AND c.relnamespace=t.typnamespace)
            OR t.typtype='b' AND EXISTS(SELECT 1 FROM pg_catalog.pg_type b JOIN pg_catalog.pg_class c ON c.oid=b.typrelid
              WHERE b.typarray=t.oid AND t.typelem=b.oid AND c.relkind='r' AND c.relnamespace=t.typnamespace))))
    OR (SELECT count(*) FROM pg_catalog.pg_constraint k JOIN pg_catalog.pg_namespace n ON n.oid=k.connamespace
      WHERE n.nspname='official_v3_jobs_private')<>41
    OR (SELECT count(*) FROM pg_catalog.pg_trigger g JOIN pg_catalog.pg_class c ON c.oid=g.tgrelid JOIN pg_catalog.pg_namespace n ON n.oid=c.relnamespace
      WHERE n.nspname='official_v3_jobs_private' AND NOT g.tgisinternal)<>14
    OR (SELECT count(*) FROM pg_catalog.pg_policy p JOIN pg_catalog.pg_class c ON c.oid=p.polrelid JOIN pg_catalog.pg_namespace n ON n.oid=c.relnamespace
      WHERE n.nspname='official_v3_jobs_private')<>7
    OR EXISTS(SELECT 1 FROM pg_catalog.pg_policy p JOIN pg_catalog.pg_class c ON c.oid=p.polrelid JOIN pg_catalog.pg_namespace n ON n.oid=c.relnamespace
      WHERE n.nspname='official_v3_jobs_private' AND (p.polname<>'owner_v1' OR p.polroles<>ARRAY[owner_id]::oid[]
        OR p.polcmd<>'*' OR NOT p.polpermissive OR pg_catalog.pg_get_expr(p.polqual,p.polrelid)<>'true'
        OR pg_catalog.pg_get_expr(p.polwithcheck,p.polrelid)<>'true'))
    OR EXISTS(SELECT 1 FROM pg_catalog.pg_attrdef a JOIN pg_catalog.pg_class c ON c.oid=a.adrelid JOIN pg_catalog.pg_namespace n ON n.oid=c.relnamespace
      WHERE n.nspname='official_v3_jobs_private')
    OR EXISTS(SELECT 1 FROM pg_catalog.pg_attribute a JOIN pg_catalog.pg_class c ON c.oid=a.attrelid JOIN pg_catalog.pg_namespace n ON n.oid=c.relnamespace
      WHERE n.nspname='official_v3_jobs_private' AND a.attnum>0
        AND (a.attisdropped OR a.attacl IS NOT NULL OR a.attgenerated<>'' OR a.attidentity<>'')) THEN
    RAISE EXCEPTION 'hm04 closed structure/namespace/type/owner boundary' USING ERRCODE='P7603';
  END IF;
  -- Neither pre-existing private schema is granted to JobsOwner. Only fixed bridges.
  IF pg_catalog.has_schema_privilege(owner_id,'official_v3_method_private','USAGE,CREATE')
    OR pg_catalog.has_schema_privilege(owner_id,'official_v3_intake_private','USAGE,CREATE')
    OR pg_catalog.has_schema_privilege(owner_id,'official_v3_intake_api','USAGE,CREATE')
    OR EXISTS(SELECT 1 FROM pg_catalog.pg_roles r WHERE r.rolname IN ('anon','authenticated','service_role')
      AND (pg_catalog.pg_has_role(r.oid,owner_id,'SET') OR pg_catalog.pg_has_role(r.oid,owner_id,'USAGE')
        OR pg_catalog.pg_has_role(r.oid,caller_id,'SET') OR pg_catalog.pg_has_role(r.oid,caller_id,'USAGE')
        OR pg_catalog.has_schema_privilege(r.oid,'official_v3_jobs_private','USAGE,CREATE')
        OR pg_catalog.has_schema_privilege(r.oid,'official_v3_jobs_api','USAGE,CREATE')))
    OR EXISTS(SELECT 1 FROM pg_catalog.pg_proc p JOIN pg_catalog.pg_namespace n ON n.oid=p.pronamespace
      CROSS JOIN pg_catalog.pg_roles r WHERE n.nspname IN ('official_v3_jobs_private','official_v3_jobs_api')
        AND r.rolname IN ('anon','authenticated','service_role')
        AND pg_catalog.has_function_privilege(r.oid,p.oid,'EXECUTE')) THEN
    RAISE EXCEPTION 'hm04 effective privilege boundary' USING ERRCODE='P7603';
  END IF;
  -- Eight, and only eight, parsed procedure dependencies. No caller-controlled target.
  IF (SELECT count(*) FROM pg_catalog.pg_depend d JOIN pg_catalog.pg_proc p ON p.oid=d.objid
      JOIN pg_catalog.pg_namespace n ON n.oid=p.pronamespace
      WHERE d.classid='pg_catalog.pg_proc'::pg_catalog.regclass AND d.refclassid='pg_catalog.pg_proc'::pg_catalog.regclass
        AND n.nspname IN ('official_v3_jobs_private','official_v3_jobs_api'))<>8 THEN
    RAISE EXCEPTION 'hm04 parsed dependency count' USING ERRCODE='P7603';
  END IF;
  FOR expected IN SELECT * FROM (VALUES
    ('s1_read_v1','official_v3_intake_api','read_v1','jsonb,text,integer'),
    ('s1_shape_v1','official_v3_intake_private','proposal_retainable_v1','jsonb'),
    ('s1_shape_v1','official_v3_intake_private','safe_data_v1','jsonb,integer'),
    ('s1_shape_v1','official_v3_intake_private','data_nodes_v1','jsonb,integer,integer,integer'),
    ('s1_shape_v1','official_v3_intake_private','shape_matches_v1','jsonb,jsonb,jsonb,jsonb,integer'),
    ('s1_shape_v1','official_v3_intake_private','proposal_shape_v1',''),
    ('ma1_require_v1','official_v3_method_private','require_current_locked_v1','text,integer,text,text,integer'),
    ('ma1_tuple_valid_v1','official_v3_method_private','tuple_valid_v1','text,integer,text,text')
  ) e(consumer_name,target_schema,target_name,target_types) LOOP
    IF NOT EXISTS(SELECT 1 FROM pg_catalog.pg_depend d JOIN pg_catalog.pg_proc p ON p.oid=d.objid
      JOIN pg_catalog.pg_namespace n ON n.oid=p.pronamespace JOIN pg_catalog.pg_proc target ON target.oid=d.refobjid
      JOIN pg_catalog.pg_namespace tn ON tn.oid=target.pronamespace
      WHERE d.classid='pg_catalog.pg_proc'::pg_catalog.regclass AND d.refclassid='pg_catalog.pg_proc'::pg_catalog.regclass
        AND d.deptype='n' AND d.objsubid=0 AND d.refobjsubid=0 AND n.nspname='official_v3_jobs_private'
        AND p.proname=expected.consumer_name AND tn.nspname=expected.target_schema AND target.proname=expected.target_name
        AND pg_catalog.replace(pg_catalog.oidvectortypes(target.proargtypes),', ',',')=expected.target_types) THEN
      RAISE EXCEPTION 'hm04 exact parsed dependency: %',expected.consumer_name USING ERRCODE='P7603';
    END IF;
  END LOOP;
  WITH scope_schemas AS (
  SELECT n.oid,n.nspname FROM pg_catalog.pg_namespace n WHERE n.nspname IN ('official_v3_jobs_private','official_v3_jobs_api')
), scope_tables AS (
  SELECT c.oid,c.reltoastrelid FROM pg_catalog.pg_class c JOIN scope_schemas n ON n.oid=c.relnamespace WHERE c.relkind='r'
), scope_classes AS (
  SELECT c.oid FROM pg_catalog.pg_class c JOIN scope_schemas n ON n.oid=c.relnamespace
  UNION SELECT t.reltoastrelid FROM scope_tables t WHERE t.reltoastrelid<>0
  UNION SELECT i.indexrelid FROM pg_catalog.pg_index i JOIN scope_tables t ON i.indrelid=t.reltoastrelid WHERE t.reltoastrelid<>0
), scope_objects AS (
  SELECT 'pg_catalog.pg_namespace'::pg_catalog.regclass::oid AS classid,n.oid AS objid FROM scope_schemas n
  UNION SELECT 'pg_catalog.pg_class'::pg_catalog.regclass,c.oid FROM scope_classes c
  UNION SELECT 'pg_catalog.pg_type'::pg_catalog.regclass,t.oid FROM pg_catalog.pg_type t JOIN scope_schemas n ON n.oid=t.typnamespace
  UNION SELECT 'pg_catalog.pg_proc'::pg_catalog.regclass,p.oid FROM pg_catalog.pg_proc p JOIN scope_schemas n ON n.oid=p.pronamespace
  UNION SELECT 'pg_catalog.pg_constraint'::pg_catalog.regclass,c.oid FROM pg_catalog.pg_constraint c JOIN scope_tables t ON t.oid=c.conrelid
  UNION SELECT 'pg_catalog.pg_trigger'::pg_catalog.regclass,g.oid FROM pg_catalog.pg_trigger g JOIN scope_tables t ON t.oid=g.tgrelid
  UNION SELECT 'pg_catalog.pg_policy'::pg_catalog.regclass,p.oid FROM pg_catalog.pg_policy p JOIN scope_tables t ON t.oid=p.polrelid
  UNION SELECT 'pg_catalog.pg_attrdef'::pg_catalog.regclass,d.oid FROM pg_catalog.pg_attrdef d JOIN scope_tables t ON t.oid=d.adrelid
)
  SELECT EXISTS(SELECT 1 FROM pg_catalog.pg_depend d JOIN scope_objects r ON r.classid=d.refclassid AND r.objid=d.refobjid
      WHERE NOT EXISTS(SELECT 1 FROM scope_objects o WHERE o.classid=d.classid AND o.objid=d.objid))
    OR EXISTS(SELECT 1 FROM pg_catalog.pg_depend d JOIN scope_objects o ON o.classid=d.classid AND o.objid=d.objid WHERE d.deptype IN ('e','x'))
    OR EXISTS(SELECT 1 FROM pg_catalog.pg_shdepend d WHERE d.refclassid='pg_catalog.pg_authid'::pg_catalog.regclass
      AND d.refobjid IN (owner_id,caller_id)
      AND NOT(d.dbid=(SELECT b.oid FROM pg_catalog.pg_database b WHERE b.datname=current_database())
        AND EXISTS(SELECT 1 FROM scope_objects o WHERE o.classid=d.classid AND o.objid=d.objid))
      AND NOT(d.dbid=0 AND d.classid='pg_catalog.pg_auth_members'::pg_catalog.regclass))
    OR EXISTS(SELECT 1 FROM pg_catalog.pg_seclabel s JOIN scope_objects o ON o.classid=s.classoid AND o.objid=s.objoid)
    OR EXISTS(SELECT 1 FROM pg_catalog.pg_description d JOIN scope_objects o ON o.classid=d.classoid AND o.objid=d.objoid)
    OR EXISTS(SELECT 1 FROM pg_catalog.pg_shdescription d WHERE d.classoid='pg_catalog.pg_authid'::pg_catalog.regclass AND d.objoid IN (owner_id,caller_id))
    OR EXISTS(SELECT 1 FROM pg_catalog.pg_shseclabel s WHERE s.classoid='pg_catalog.pg_authid'::pg_catalog.regclass AND s.objoid IN (owner_id,caller_id))
    INTO foreign_dependency;
  IF foreign_dependency THEN
    RAISE EXCEPTION 'hm04 unknown consumer/ownership/extension/label' USING ERRCODE='P7603';
  END IF;
  -- Original HS1 ownership remains closed plus exactly the two selected bridges.
  WITH scope_schemas AS (
  SELECT n.oid,n.nspname FROM pg_catalog.pg_namespace n WHERE n.nspname IN ('jetnity_ot_auth','official_v3_method_private','official_v3_method_api','official_v3_intake_private','official_v3_intake_api')
), scope_tables AS (
  SELECT c.oid,c.reltoastrelid FROM pg_catalog.pg_class c JOIN scope_schemas n ON n.oid=c.relnamespace WHERE c.relkind='r'
), scope_classes AS (
  SELECT c.oid FROM pg_catalog.pg_class c JOIN scope_schemas n ON n.oid=c.relnamespace
  UNION SELECT t.reltoastrelid FROM scope_tables t WHERE t.reltoastrelid<>0
  UNION SELECT i.indexrelid FROM pg_catalog.pg_index i JOIN scope_tables t ON i.indrelid=t.reltoastrelid WHERE t.reltoastrelid<>0
), scope_objects AS (
  SELECT 'pg_catalog.pg_namespace'::pg_catalog.regclass::oid AS classid,n.oid AS objid FROM scope_schemas n
  UNION SELECT 'pg_catalog.pg_class'::pg_catalog.regclass,c.oid FROM scope_classes c
  UNION SELECT 'pg_catalog.pg_type'::pg_catalog.regclass,t.oid FROM pg_catalog.pg_type t JOIN scope_schemas n ON n.oid=t.typnamespace
  UNION SELECT 'pg_catalog.pg_proc'::pg_catalog.regclass,p.oid FROM pg_catalog.pg_proc p JOIN scope_schemas n ON n.oid=p.pronamespace
  UNION SELECT 'pg_catalog.pg_constraint'::pg_catalog.regclass,c.oid FROM pg_catalog.pg_constraint c JOIN scope_tables t ON t.oid=c.conrelid
  UNION SELECT 'pg_catalog.pg_trigger'::pg_catalog.regclass,g.oid FROM pg_catalog.pg_trigger g JOIN scope_tables t ON t.oid=g.tgrelid
  UNION SELECT 'pg_catalog.pg_policy'::pg_catalog.regclass,p.oid FROM pg_catalog.pg_policy p JOIN scope_tables t ON t.oid=p.polrelid
  UNION SELECT 'pg_catalog.pg_attrdef'::pg_catalog.regclass,d.oid FROM pg_catalog.pg_attrdef d JOIN scope_tables t ON t.oid=d.adrelid
)
  SELECT EXISTS(SELECT 1 FROM pg_catalog.pg_shdepend d WHERE d.refclassid='pg_catalog.pg_authid'::pg_catalog.regclass
    AND d.refobjid=intake_id AND d.deptype='o'
    AND NOT(d.dbid=(SELECT b.oid FROM pg_catalog.pg_database b WHERE b.datname=current_database())
      AND (EXISTS(SELECT 1 FROM scope_objects o WHERE o.classid=d.classid AND o.objid=d.objid)
        OR d.classid='pg_catalog.pg_proc'::pg_catalog.regclass AND EXISTS(SELECT 1 FROM pg_catalog.pg_proc p JOIN pg_catalog.pg_namespace n ON n.oid=p.pronamespace
          WHERE p.oid=d.objid AND n.nspname='official_v3_jobs_private' AND p.proname IN ('s1_read_v1','s1_shape_v1') AND p.proowner=intake_id))))
    INTO foreign_dependency;
  IF foreign_dependency THEN
    RAISE EXCEPTION 'hm04 HS1 owner foreign object' USING ERRCODE='P7603';
  END IF;

END $hm04_final_creator_readback$;

COMMIT;
