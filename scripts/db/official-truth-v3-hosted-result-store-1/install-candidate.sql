-- HRS1 SOURCE V1 / A1 / A2. UNAPPLIED; no source or method approval is created.
BEGIN;
SET TRANSACTION ISOLATION LEVEL READ COMMITTED;
SET LOCAL search_path=pg_catalog;
SET LOCAL statement_timeout='30000';
SET LOCAL lock_timeout='5000';
SET LOCAL idle_in_transaction_session_timeout='30000';
SET LOCAL intervalstyle='postgres';
SET LOCAL datestyle='ISO, YMD';
SELECT pg_catalog.pg_advisory_xact_lock(771101,1);
SELECT pg_catalog.pg_advisory_xact_lock(771102,1);
SELECT pg_catalog.pg_advisory_xact_lock(771103,1);
SELECT pg_catalog.pg_advisory_xact_lock(771105,1);
DO $hrs1_creator$
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
     AND (d.defaclobjtype NOT IN ('r','S','f','T','n') OR d.defaclacl IS DISTINCT FROM pg_catalog.acldefault(d.defaclobjtype,creator)))
   OR pg_catalog.current_setting('jetnity.hrs1_install_context',true) IS DISTINCT FROM 'root_selected_complete_binding_v1'
   OR NULLIF(pg_catalog.current_setting('jetnity.hrs1_binding',true),'') IS NULL THEN
   RAISE EXCEPTION 'hrs1 exact Creator and selected configuration required' USING ERRCODE='P7801';
 END IF;
 IF EXISTS(SELECT 1 FROM pg_catalog.pg_namespace n WHERE n.nspname IN ('official_v3_result_private','official_v3_result_api','official_v3_jobs_private','official_v3_jobs_api'))
   OR EXISTS(SELECT 1 FROM pg_catalog.pg_roles r WHERE r.rolname IN ('ot_v3_result_owner','ot_v3_result_writer','ot_v3_result_reader','ot_v3_result_verifier')) THEN
   RAISE EXCEPTION 'hrs1 collision; adoption forbidden; install before HM04' USING ERRCODE='P7801';
 END IF;
END $hrs1_creator$;

-- Exact current PG1/HMA1/HS1 prerequisites, before any Result consumer exists.
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
  IF (SELECT count(*) FROM pg_catalog.pg_proc function_inventory JOIN pg_catalog.pg_namespace n ON n.oid=function_inventory.pronamespace
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
    OR EXISTS (SELECT 1 FROM pg_catalog.pg_class class_inventory WHERE class_inventory.relnamespace=api_id)
    OR (SELECT count(*) FROM pg_catalog.pg_class class_inventory WHERE class_inventory.relnamespace=private_id)<>6
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
      OR a.attacl IS NOT NULL
      -- PG17.12 internal composite-layout version only; user options still fail.
      -- NULL remains the legitimate pre-versioning/upgrade representation.
      OR (a.attoptions IS NOT NULL AND NOT (
        pg_catalog.current_setting('server_version_num')::integer>=170012
        AND pg_catalog.array_ndims(a.attoptions)=1
        AND pg_catalog.array_lower(a.attoptions,1)=1
        AND pg_catalog.cardinality(a.attoptions)=1
        AND CASE WHEN a.attoptions[1] ~ '^pg_attver=(0|[1-9][0-9]{0,19})$'
          THEN pg_catalog.split_part(a.attoptions[1],'=',2)::numeric<=18446744073709551615::numeric
          ELSE false END))
      OR a.attfdwoptions IS NOT NULL
      OR a.atttypmod<>-1 OR a.attndims<>0 OR a.attstattarget IS NOT NULL OR a.attcompression<>''
      OR a.attstorage<>(SELECT t.typstorage FROM pg_catalog.pg_type t WHERE t.oid=a.atttypid)
      OR a.attcollation<>(SELECT t.typcollation FROM pg_catalog.pg_type t WHERE t.oid=a.atttypid)
      OR (SELECT pg_catalog.pg_get_expr(d.adbin,d.adrelid) FROM pg_catalog.pg_attrdef d
        WHERE d.adrelid=a.attrelid AND d.adnum=a.attnum) IS DISTINCT FROM x.default_expr THEN
      RAISE EXCEPTION 'hs1 exact column mismatch' USING ERRCODE='P7312';
    END IF;
  END LOOP;
  IF (SELECT count(*) FROM pg_catalog.pg_attrdef d JOIN pg_catalog.pg_class class_inventory ON class_inventory.oid=d.adrelid
    WHERE class_inventory.relnamespace=private_id)<>2 OR EXISTS (
    SELECT 1 FROM pg_catalog.pg_attribute attribute_inventory JOIN pg_catalog.pg_class class_inventory ON class_inventory.oid=attribute_inventory.attrelid
    WHERE class_inventory.relnamespace IN (private_id,api_id) AND (attribute_inventory.attacl IS NOT NULL OR attribute_inventory.attisdropped)) THEN
    RAISE EXCEPTION 'hs1 column/default inventory mismatch' USING ERRCODE='P7312';
  END IF;
  SELECT pg_catalog.jsonb_agg(pg_catalog.jsonb_build_array(class_inventory.relname,k.contype,
      pg_catalog.pg_get_constraintdef(k.oid,false)) ORDER BY class_inventory.relname,k.contype,pg_catalog.pg_get_constraintdef(k.oid,false)) INTO actual
    FROM pg_catalog.pg_constraint k JOIN pg_catalog.pg_class class_inventory ON class_inventory.oid=k.conrelid WHERE class_inventory.relnamespace=private_id;
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
    SELECT 1 FROM pg_catalog.pg_constraint k JOIN pg_catalog.pg_class class_inventory ON class_inventory.oid=k.conrelid
    WHERE class_inventory.relnamespace=private_id AND (k.connamespace<>private_id OR k.condeferrable OR k.condeferred
      OR NOT k.convalidated OR NOT k.conislocal OR k.coninhcount<>0 OR k.conparentid<>0
      OR k.contype='c' AND k.connoinherit
      OR k.contype='f' AND (k.confupdtype<>'a' OR k.confdeltype<>'a' OR k.confmatchtype<>'s'))) THEN
    RAISE EXCEPTION 'hs1 exact constraint mismatch' USING ERRCODE='P7312';
  END IF;
  SELECT p.oid INTO immutable_id FROM pg_catalog.pg_proc p WHERE p.pronamespace=private_id AND p.proname='immutable_v1';
  IF (SELECT count(*) FROM pg_catalog.pg_trigger g JOIN pg_catalog.pg_class class_inventory ON class_inventory.oid=g.tgrelid
      WHERE class_inventory.relnamespace=private_id AND NOT g.tgisinternal)<>3
    OR EXISTS (SELECT 1 FROM pg_catalog.pg_trigger g JOIN pg_catalog.pg_class class_inventory ON class_inventory.oid=g.tgrelid
      WHERE class_inventory.relnamespace=private_id AND NOT g.tgisinternal AND
        (g.tgname<>'immutable_v1' OR g.tgfoid<>immutable_id OR g.tgtype<>27 OR g.tgenabled<>'O'
          OR g.tgconstraint<>0 OR g.tgdeferrable OR g.tginitdeferred OR g.tgnargs<>0
          OR g.tgargs<>''::bytea OR g.tgattr<>''::pg_catalog.int2vector OR g.tgqual IS NOT NULL
          OR g.tgoldtable IS NOT NULL OR g.tgnewtable IS NOT NULL OR g.tgparentid<>0))
    OR (SELECT count(*) FROM pg_catalog.pg_trigger g JOIN pg_catalog.pg_class class_inventory ON class_inventory.oid=g.tgrelid
      WHERE class_inventory.relnamespace=private_id AND g.tgisinternal)<>12
    OR EXISTS (SELECT 1 FROM pg_catalog.pg_trigger g JOIN pg_catalog.pg_class class_inventory ON class_inventory.oid=g.tgrelid
      JOIN pg_catalog.pg_proc p ON p.oid=g.tgfoid JOIN pg_catalog.pg_namespace n ON n.oid=p.pronamespace
      LEFT JOIN pg_catalog.pg_constraint k ON k.oid=g.tgconstraint
      WHERE class_inventory.relnamespace=private_id AND g.tgisinternal AND
        (n.nspname<>'pg_catalog' OR k.contype IS DISTINCT FROM 'f' OR k.connamespace<>private_id
          OR g.tgenabled<>'O' OR g.tgdeferrable OR g.tginitdeferred OR g.tgnargs<>0
          OR g.tgargs<>''::bytea OR g.tgattr<>''::pg_catalog.int2vector OR g.tgqual IS NOT NULL
          OR g.tgoldtable IS NOT NULL OR g.tgnewtable IS NOT NULL OR g.tgparentid<>0
          OR NOT (p.proname='RI_FKey_check_ins' AND g.tgtype=5 AND g.tgrelid=k.conrelid AND g.tgconstrrelid=k.confrelid
            OR p.proname='RI_FKey_check_upd' AND g.tgtype=17 AND g.tgrelid=k.conrelid AND g.tgconstrrelid=k.confrelid
            OR p.proname='RI_FKey_noaction_del' AND g.tgtype=9 AND g.tgrelid=k.confrelid AND g.tgconstrrelid=k.conrelid
            OR p.proname='RI_FKey_noaction_upd' AND g.tgtype=17 AND g.tgrelid=k.confrelid AND g.tgconstrrelid=k.conrelid)))
    OR EXISTS (SELECT 1 FROM pg_catalog.pg_constraint k JOIN pg_catalog.pg_class class_inventory ON class_inventory.oid=k.conrelid
      WHERE class_inventory.relnamespace=private_id AND k.contype='f' AND
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


CREATE ROLE ot_v3_result_owner NOLOGIN NOINHERIT NOSUPERUSER NOCREATEDB NOCREATEROLE NOREPLICATION NOBYPASSRLS;
CREATE ROLE ot_v3_result_writer LOGIN NOINHERIT NOSUPERUSER NOCREATEDB NOCREATEROLE NOREPLICATION NOBYPASSRLS CONNECTION LIMIT 2;
CREATE ROLE ot_v3_result_reader LOGIN NOINHERIT NOSUPERUSER NOCREATEDB NOCREATEROLE NOREPLICATION NOBYPASSRLS CONNECTION LIMIT 2;
CREATE ROLE ot_v3_result_verifier LOGIN NOINHERIT NOSUPERUSER NOCREATEDB NOCREATEROLE NOREPLICATION NOBYPASSRLS CONNECTION LIMIT 2;
GRANT CONNECT ON DATABASE postgres TO ot_v3_result_writer,ot_v3_result_reader,ot_v3_result_verifier;
DO $hrs1_new_roles$
DECLARE x record; creator oid:='postgres'::pg_catalog.regrole;
BEGIN
 FOR x IN SELECT r.* FROM pg_catalog.pg_roles r WHERE r.rolname IN
   ('ot_v3_result_owner','ot_v3_result_writer','ot_v3_result_reader','ot_v3_result_verifier') LOOP
   IF x.rolcanlogin IS DISTINCT FROM (x.rolname<>'ot_v3_result_owner') OR x.rolinherit OR x.rolsuper
     OR x.rolcreatedb OR x.rolcreaterole OR x.rolreplication OR x.rolbypassrls OR x.rolconfig IS NOT NULL
     OR x.rolvaliduntil IS NOT NULL OR x.rolconnlimit<>(CASE WHEN x.rolname='ot_v3_result_owner' THEN -1 ELSE 2 END)
     OR EXISTS(SELECT 1 FROM pg_catalog.pg_db_role_setting s WHERE s.setrole=x.oid)
     OR EXISTS(SELECT 1 FROM pg_catalog.pg_default_acl d WHERE d.defaclrole=x.oid)
     OR pg_catalog.has_database_privilege(x.oid,current_database(),'CREATE')
     OR (SELECT count(*) FROM pg_catalog.pg_auth_members m WHERE m.roleid=x.oid OR m.member=x.oid OR m.grantor=x.oid)<>1
     OR NOT EXISTS(SELECT 1 FROM pg_catalog.pg_auth_members m WHERE m.roleid=x.oid AND m.member=creator
       AND m.grantor=10 AND m.admin_option AND NOT m.inherit_option AND NOT m.set_option) THEN
     RAISE EXCEPTION 'hrs1 exact restrictive roles and automatic edges required' USING ERRCODE='P7802';
   END IF;
 END LOOP;
END $hrs1_new_roles$;
GRANT ot_v3_result_owner TO postgres WITH ADMIN FALSE, INHERIT FALSE, SET TRUE GRANTED BY postgres;
CREATE SCHEMA official_v3_result_private AUTHORIZATION ot_v3_result_owner;
CREATE SCHEMA official_v3_result_api AUTHORIZATION ot_v3_result_owner;
SET LOCAL ROLE ot_v3_result_owner;
REVOKE ALL ON SCHEMA official_v3_result_private,official_v3_result_api FROM PUBLIC RESTRICT;
GRANT USAGE ON SCHEMA official_v3_result_api TO ot_v3_result_writer,ot_v3_result_reader,ot_v3_result_verifier;

-- Copied finite validators; original predecessor packages remain unchanged.
CREATE FUNCTION official_v3_result_private.exact_keys_v1(v jsonb, expected text[]) RETURNS boolean
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
CREATE FUNCTION official_v3_result_private.nodes_v1(v jsonb,d integer,max_d integer,max_n integer) RETURNS integer
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
      m:=official_v3_result_private.nodes_v1(e,d+1,max_d,max_n);
      IF m<0 THEN RETURN -1; END IF;
      n:=n+m-1; IF n>max_n THEN RETURN -1; END IF;
    END LOOP;
  ELSIF jsonb_typeof(v)='array' THEN
    child_count:=jsonb_array_length(v);
    IF child_count>0 AND d+1>max_d THEN RETURN -1; END IF;
    IF child_count>max_n-1 THEN RETURN -1; END IF;
    n:=1+child_count;
    FOR e IN SELECT j.value FROM jsonb_array_elements(v) j WHERE jsonb_typeof(j.value) IN ('object','array') LOOP
      m:=official_v3_result_private.nodes_v1(e,d+1,max_d,max_n);
      IF m<0 THEN RETURN -1; END IF;
      n:=n+m-1; IF n>max_n THEN RETURN -1; END IF;
    END LOOP;
  END IF;
  RETURN n;
END $$;
CREATE FUNCTION official_v3_result_private.canonical_v1(v jsonb,d integer) RETURNS text
LANGUAGE plpgsql IMMUTABLE PARALLEL UNSAFE SECURITY INVOKER CALLED ON NULL INPUT SET search_path=pg_catalog,pg_temp AS $$
DECLARE x record; e jsonb; s text; parts text[]:='{}'; child_text text; number_value numeric; retained_object jsonb; retained_object_canonical text; object_keys text[]; object_values jsonb[]; part_index integer;
  current_depth integer; child_depth integer; descend_object boolean; pending_positions integer[]; pending_cursor integer;
  child_keys text[]; child_values jsonb[]; child_parts text[]; child_pending_positions integer[];
  stack_parts text[]:='{}'; stack_keys text[]:='{}'; stack_values jsonb[]:='{}'; stack_pending integer[]:='{}';
  frame_lengths integer[]:='{}'; frame_pending_lengths integer[]:='{}'; frame_cursors integer[]:='{}'; stack_level integer:=0;
  frame_length integer; pending_length integer; parent_length integer; parent_pending_length integer; fast_text text;
BEGIN
  IF v IS NULL OR d IS NULL OR d<0 OR d>32 THEN RAISE EXCEPTION 'm04 invalid metadata' USING ERRCODE='P7601'; END IF;
  IF jsonb_typeof(v)='object' THEN
    IF v='{}'::jsonb THEN RETURN '{}'; END IF;
    fast_text:=v::text;
    IF d<32 AND octet_length(fast_text)<=8192 THEN
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
                    CASE WHEN w.node_type='object' AND w.node_depth<32 THEN w.node ELSE '{}'::jsonb END) j
                  WHERE w.node_type='object' AND w.node_depth<32
              ), token_rows AS (
                SELECT w.node_path AS token_path,
                  CASE WHEN w.node_depth<32 THEN true ELSE w.node_type<>'object' OR w.node='{}'::jsonb END AS is_valid,
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
        CASE WHEN j.key ~ '[^ -~]' OR current_depth+1>32 THEN NULL
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
        IF current_depth+1>32 THEN RAISE EXCEPTION 'm04 invalid metadata' USING ERRCODE='P7601'; END IF;
        CASE jsonb_typeof(e)
        WHEN 'object' THEN
          IF retained_object IS NULL THEN descend_object:=true;
          ELSIF (e::text) COLLATE "C" = (retained_object::text) COLLATE "C" THEN
            child_text:=retained_object_canonical; descend_object:=false;
          ELSE descend_object:=true;
          END IF;
          IF descend_object THEN
            child_depth:=current_depth+1;
            IF e IS NULL OR child_depth IS NULL OR child_depth<0 OR child_depth>32 THEN RAISE EXCEPTION 'm04 invalid metadata' USING ERRCODE='P7601'; END IF;
            SELECT array_agg(j.key ORDER BY j.key COLLATE "C"),
              array_agg(j.value ORDER BY j.key COLLATE "C"),
              COALESCE(array_agg(
                CASE WHEN j.key ~ '[^ -~]' OR child_depth+1>32 THEN NULL
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
        WHEN 'array' THEN child_text:=official_v3_result_private.canonical_v1(e,current_depth+1);
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
      IF d+1>32 THEN RAISE EXCEPTION 'm04 invalid metadata' USING ERRCODE='P7601'; END IF;
      CASE jsonb_typeof(e)
      WHEN 'object' THEN child_text:=official_v3_result_private.canonical_v1(e,d+1);
      WHEN 'array' THEN child_text:=official_v3_result_private.canonical_v1(e,d+1);
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
CREATE FUNCTION official_v3_result_private.civil_date_v1(t text) RETURNS boolean
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
CREATE FUNCTION official_v3_result_private.timestamp_v1(t text) RETURNS timestamptz
LANGUAGE plpgsql IMMUTABLE PARALLEL UNSAFE SECURITY INVOKER CALLED ON NULL INPUT SET search_path=pg_catalog,pg_temp AS $$
DECLARE v timestamptz;
BEGIN
  IF t IS NULL OR t !~ '^[0-9]{4}-[0-9]{2}-[0-9]{2}T[0-9]{2}:[0-9]{2}:[0-9]{2}\.[0-9]{3}Z$'
    OR official_v3_result_private.civil_date_v1(left(t,10)) IS NOT TRUE THEN RAISE EXCEPTION 'm04 invalid time' USING ERRCODE='P7601'; END IF;
  v:=t::timestamptz;
  IF to_char(v AT TIME ZONE 'UTC','YYYY-MM-DD"T"HH24:MI:SS.MS"Z"')<>t THEN RAISE EXCEPTION 'm04 invalid time' USING ERRCODE='P7601'; END IF;
  RETURN v;
END $$;

CREATE FUNCTION official_v3_result_private.predicate_v1(v jsonb) RETURNS jsonb
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
    valid:=(official_v3_result_private.exact_keys_v1(x,ARRAY['kind','countryCode']) AND x->>'kind'='country' AND x->>'countryCode'=ANY(countries))
      OR (official_v3_result_private.exact_keys_v1(x,ARRAY['kind','regionCode']) AND x->>'kind'='region' AND x->>'regionCode'='common_travel_area');
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
    valid:=v->>'comparison' IN ('at_most','more_than') AND official_v3_result_private.exact_keys_v1(x,ARRAY['value','unit'])
      AND jsonb_typeof(x->'value')='number' AND x->>'value' ~ '^[1-9][0-9]{0,3}$'
      AND ((x->>'unit'='days' AND (x->>'value')::numeric BETWEEN 1 AND 3660 AND v->>'counting' IN ('unspecified','calendar_dates_inclusive','calendar_dates_exit_exclusive'))
        OR (x->>'unit'='months' AND (x->>'value')::numeric BETWEEN 1 AND 120 AND v->>'counting'='unspecified'));
  ELSE valid:=false;
  END CASE;
  IF valid IS NOT TRUE OR official_v3_result_private.exact_keys_v1(v,keys) IS NOT TRUE THEN RAISE EXCEPTION 'm04 invalid predicate' USING ERRCODE='P7601'; END IF;
  RETURN v;
END $$;
CREATE FUNCTION official_v3_result_private.expression_v1(v jsonb,strip_support boolean,d integer) RETURNS jsonb
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
    IF official_v3_result_private.exact_keys_v1(v,CASE WHEN v?'supportVersionIds' THEN ARRAY['op','predicate','supportVersionIds'] ELSE ARRAY['op','predicate'] END) IS NOT TRUE THEN RAISE EXCEPTION 'm04 invalid expression' USING ERRCODE='P7601'; END IF;
    n:=jsonb_build_object('op','atomic','predicate',official_v3_result_private.predicate_v1(v->'predicate'));
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
    IF official_v3_result_private.exact_keys_v1(v,ARRAY['op','operand']) IS NOT TRUE THEN RAISE EXCEPTION 'm04 invalid expression' USING ERRCODE='P7601'; END IF;
    n:=official_v3_result_private.expression_v1(v->'operand',strip_support,d+1);
    RETURN CASE WHEN n->>'op'='not' THEN n->'operand' ELSE jsonb_build_object('op','not','operand',n) END;
  ELSIF op IN ('all','any') THEN
    IF official_v3_result_private.exact_keys_v1(v,ARRAY['op','operands']) IS NOT TRUE OR jsonb_typeof(v->'operands') IS DISTINCT FROM 'array'
      OR jsonb_array_length(v->'operands') NOT BETWEEN 1 AND 8 THEN RAISE EXCEPTION 'm04 invalid expression' USING ERRCODE='P7601'; END IF;
    FOR e IN SELECT value FROM jsonb_array_elements(v->'operands') LOOP
      n:=official_v3_result_private.expression_v1(e,strip_support,d+1);
      a:=a||CASE WHEN n->>'op'=op THEN n->'operands' ELSE jsonb_build_array(n) END;
    END LOOP;
    SELECT jsonb_agg(x ORDER BY official_v3_result_private.canonical_v1(x,0) COLLATE "C") INTO a FROM (SELECT DISTINCT value AS x FROM jsonb_array_elements(a)) q;
    IF jsonb_array_length(a)>8 THEN RAISE EXCEPTION 'm04 expression bound' USING ERRCODE='P7601'; END IF;
    RETURN CASE WHEN jsonb_array_length(a)=1 THEN a->0 ELSE jsonb_build_object('op',op,'operands',a) END;
  END IF;
  RAISE EXCEPTION 'm04 invalid expression' USING ERRCODE='P7601';
END $$;

CREATE FUNCTION official_v3_result_private.context_v1(v jsonb) RETURNS jsonb
LANGUAGE plpgsql IMMUTABLE PARALLEL UNSAFE SECURITY INVOKER CALLED ON NULL INPUT SET search_path=pg_catalog,pg_temp AS $$
DECLARE s jsonb:=v->'scope'; c jsonb:=v->'conditions'; o jsonb:=s->'credentialOption'; r jsonb:=s->'residence';
  a jsonb:=v->'application'; normal jsonb; semantic jsonb; countries text[]:=ARRAY['AD','AE','AF','AG','AI','AL','AM','AO','AQ','AR','AS','AT','AU','AW','AX','AZ','BA','BB','BD','BE','BF','BG','BH','BI','BJ','BL','BM','BN','BO','BQ','BR','BS','BT','BV','BW','BY','BZ','CA','CC','CD','CF','CG','CH','CI','CK','CL','CM','CN','CO','CR','CU','CV','CW','CX','CY','CZ','DE','DJ','DK','DM','DO','DZ','EC','EE','EG','EH','ER','ES','ET','FI','FJ','FK','FM','FO','FR','GA','GB','GD','GE','GF','GG','GH','GI','GL','GM','GN','GP','GQ','GR','GS','GT','GU','GW','GY','HK','HM','HN','HR','HT','HU','ID','IE','IL','IM','IN','IO','IQ','IR','IS','IT','JE','JM','JO','JP','KE','KG','KH','KI','KM','KN','KP','KR','KW','KY','KZ','LA','LB','LC','LI','LK','LR','LS','LT','LU','LV','LY','MA','MC','MD','ME','MF','MG','MH','MK','ML','MM','MN','MO','MP','MQ','MR','MS','MT','MU','MV','MW','MX','MY','MZ','NA','NC','NE','NF','NG','NI','NL','NO','NP','NR','NU','NZ','OM','PA','PE','PF','PG','PH','PK','PL','PM','PN','PR','PS','PT','PW','PY','QA','RE','RO','RS','RU','RW','SA','SB','SC','SD','SE','SG','SH','SI','SJ','SK','SL','SM','SN','SO','SR','SS','ST','SV','SX','SY','SZ','TC','TD','TF','TG','TH','TJ','TK','TL','TM','TN','TO','TR','TT','TV','TW','TZ','UA','UG','UM','US','UY','UZ','VA','VC','VE','VG','VI','VN','VU','WF','WS','YE','YT','ZA','ZM','ZW']; missing jsonb;
BEGIN
  IF official_v3_result_private.exact_keys_v1(v,CASE WHEN v?'contextRevision' THEN ARRAY['contextRevision','scope','route','conditions','application'] ELSE ARRAY['scope','route','conditions'] END) IS NOT TRUE
    OR official_v3_result_private.nodes_v1(v,0,16,8192)<0 OR octet_length(official_v3_result_private.canonical_v1(v,0))>65536
    OR official_v3_result_private.exact_keys_v1(s,ARRAY['destinationCountryCode','transitCountryCode','citizenship','credentialOption','residence','requirementType','validity']) IS NOT TRUE
    OR (s->>'destinationCountryCode'=ANY(countries)) IS NOT TRUE
    OR (s->'transitCountryCode'<>'null'::jsonb AND (s->>'transitCountryCode'=ANY(countries)) IS NOT TRUE)
    OR official_v3_result_private.exact_keys_v1(s->'citizenship',ARRAY['mode','countryCodes']) IS NOT TRUE
    OR s#>>'{citizenship,mode}' IS DISTINCT FROM 'required' OR jsonb_typeof(s#>'{citizenship,countryCodes}') IS DISTINCT FROM 'array'
    OR jsonb_array_length(s#>'{citizenship,countryCodes}')<>1 OR (s#>>'{citizenship,countryCodes,0}'=ANY(countries)) IS NOT TRUE
    OR s->'validity'<>'{"mode":"not_applicable"}'::jsonb
    OR (s->>'requirementType' IN ('visa','electronic_travel_authorization','passport','identity_document','passport_validity','blank_passport_pages','transit','health','vaccination','health_document','entry_form','insurance','onward_or_return_ticket','booking_or_travel_document','financial_means','other_entry_requirement')) IS NOT TRUE
    OR (v->>'route' IN ('direct_entry','transit','unresolved')) IS NOT TRUE
    OR (v->>'route'='direct_entry' AND s->'transitCountryCode'<>'null'::jsonb)
    OR (v->>'route'='transit' AND s->'transitCountryCode'='null'::jsonb) THEN RAISE EXCEPTION 'm04 invalid context' USING ERRCODE='P7601'; END IF;
  IF o<>'{"mode":"not_applicable"}'::jsonb THEN
    IF official_v3_result_private.exact_keys_v1(o,ARRAY['mode','documentType','issuingCountryCode','relatedCitizenshipCountryCode']) IS NOT TRUE
      OR o->>'mode' IS DISTINCT FROM 'option' OR (o->>'documentType' IN ('passport','national_id','unknown')) IS NOT TRUE
      OR (o->>'issuingCountryCode'=ANY(countries)) IS NOT TRUE
      OR (o->'relatedCitizenshipCountryCode'<>'null'::jsonb AND o->'relatedCitizenshipCountryCode'<>s#>'{citizenship,countryCodes,0}') THEN
      RAISE EXCEPTION 'm04 invalid credential' USING ERRCODE='P7601'; END IF;
  END IF;
  IF r<>'{"mode":"not_applicable"}'::jsonb AND (official_v3_result_private.exact_keys_v1(r,ARRAY['mode','countryCode']) IS NOT TRUE
    OR r->>'mode' IS DISTINCT FROM 'required' OR (r->>'countryCode'=ANY(countries)) IS NOT TRUE) THEN RAISE EXCEPTION 'm04 invalid residence' USING ERRCODE='P7601'; END IF;
  IF c->>'status'='specified' THEN
    IF official_v3_result_private.exact_keys_v1(c,ARRAY['status','expression']) IS NOT TRUE THEN RAISE EXCEPTION 'm04 invalid conditions' USING ERRCODE='P7601'; END IF;
    normal:=official_v3_result_private.expression_v1(c->'expression',false,1);
    IF normal<>c->'expression' THEN RAISE EXCEPTION 'm04 nonnormal context' USING ERRCODE='P7601'; END IF;
    c:=jsonb_build_object('status','specified','expression','rule-applicability-structure:v2:'||official_v3_result_private.canonical_v1(official_v3_result_private.expression_v1(normal,true,1),0));
  ELSIF c->>'status'='unresolved' THEN
    IF official_v3_result_private.exact_keys_v1(c,ARRAY['status','missing']) IS NOT TRUE OR jsonb_typeof(c->'missing') IS DISTINCT FROM 'array'
      OR jsonb_array_length(c->'missing') NOT BETWEEN 1 AND 5 THEN RAISE EXCEPTION 'm04 invalid conditions' USING ERRCODE='P7601'; END IF;
    IF EXISTS(SELECT 1 FROM jsonb_array_elements(c->'missing') x WHERE jsonb_typeof(x) IS DISTINCT FROM 'string'
      OR (x#>>'{}' IN ('document_class','travel_purpose','planned_stay_duration','transit','other_rule_conditions')) IS NOT TRUE) THEN RAISE EXCEPTION 'm04 invalid conditions' USING ERRCODE='P7601'; END IF;
    SELECT jsonb_agg(x ORDER BY x COLLATE "C") INTO missing FROM (SELECT DISTINCT value x FROM jsonb_array_elements_text(c->'missing')) q;
    IF missing<>c->'missing' THEN RAISE EXCEPTION 'm04 nonnormal conditions' USING ERRCODE='P7601'; END IF;
  ELSIF c<>'{"status":"unconditional"}'::jsonb THEN RAISE EXCEPTION 'm04 invalid conditions' USING ERRCODE='P7601'; END IF;
  semantic:=jsonb_build_object('scope',s,'route',v->'route','conditions',c);
  IF v?'contextRevision' THEN
    IF v->'contextRevision'<>'2'::jsonb OR official_v3_result_private.exact_keys_v1(a,ARRAY['purpose','tripStartAndEndWindow']) IS NOT TRUE
      OR a->>'purpose' IS DISTINCT FROM 'tourism' OR official_v3_result_private.exact_keys_v1(a->'tripStartAndEndWindow',ARRAY['from','through']) IS NOT TRUE
      OR official_v3_result_private.civil_date_v1(a#>>'{tripStartAndEndWindow,from}') IS NOT TRUE
      OR official_v3_result_private.civil_date_v1(a#>>'{tripStartAndEndWindow,through}') IS NOT TRUE
      OR a#>>'{tripStartAndEndWindow,from}'>a#>>'{tripStartAndEndWindow,through}' THEN RAISE EXCEPTION 'm04 invalid application' USING ERRCODE='P7601'; END IF;
    semantic:=semantic||jsonb_build_object('contextRevision',2,'application',a);
  END IF;
  RETURN semantic;
END $$;
CREATE FUNCTION official_v3_result_private.subject_v1(kind text,v jsonb) RETURNS jsonb
LANGUAGE plpgsql IMMUTABLE PARALLEL UNSAFE SECURITY INVOKER CALLED ON NULL INPUT SET search_path=pg_catalog,pg_temp AS $$
DECLARE m jsonb:=v->'method'; context jsonb; s jsonb; o jsonb; r jsonb; preimage jsonb; ck text; jk text; sk text; rk text; legacy text; research jsonb; pair_text text; countries text[]:=ARRAY['AD','AE','AF','AG','AI','AL','AM','AO','AQ','AR','AS','AT','AU','AW','AX','AZ','BA','BB','BD','BE','BF','BG','BH','BI','BJ','BL','BM','BN','BO','BQ','BR','BS','BT','BV','BW','BY','BZ','CA','CC','CD','CF','CG','CH','CI','CK','CL','CM','CN','CO','CR','CU','CV','CW','CX','CY','CZ','DE','DJ','DK','DM','DO','DZ','EC','EE','EG','EH','ER','ES','ET','FI','FJ','FK','FM','FO','FR','GA','GB','GD','GE','GF','GG','GH','GI','GL','GM','GN','GP','GQ','GR','GS','GT','GU','GW','GY','HK','HM','HN','HR','HT','HU','ID','IE','IL','IM','IN','IO','IQ','IR','IS','IT','JE','JM','JO','JP','KE','KG','KH','KI','KM','KN','KP','KR','KW','KY','KZ','LA','LB','LC','LI','LK','LR','LS','LT','LU','LV','LY','MA','MC','MD','ME','MF','MG','MH','MK','ML','MM','MN','MO','MP','MQ','MR','MS','MT','MU','MV','MW','MX','MY','MZ','NA','NC','NE','NF','NG','NI','NL','NO','NP','NR','NU','NZ','OM','PA','PE','PF','PG','PH','PK','PL','PM','PN','PR','PS','PT','PW','PY','QA','RE','RO','RS','RU','RW','SA','SB','SC','SD','SE','SG','SH','SI','SJ','SK','SL','SM','SN','SO','SR','SS','ST','SV','SX','SY','SZ','TC','TD','TF','TG','TH','TJ','TK','TL','TM','TN','TO','TR','TT','TV','TW','TZ','UA','UG','UM','US','UY','UZ','VA','VC','VE','VG','VI','VN','VU','WF','WS','YE','YT','ZA','ZM','ZW'];
BEGIN
  IF official_v3_result_private.exact_keys_v1(m,ARRAY['methodId','revision']) IS NOT TRUE OR jsonb_typeof(m->'methodId') IS DISTINCT FROM 'string' OR (m->>'methodId' ~ '^[a-z][a-z0-9_-]{1,63}$') IS NOT TRUE
    OR jsonb_typeof(m->'revision') IS DISTINCT FROM 'number' OR m->>'revision' !~ '^[1-9][0-9]{0,9}$' OR (m->>'revision')::numeric>2147483647 THEN RAISE EXCEPTION 'm04 invalid method' USING ERRCODE='P7601'; END IF;
  IF kind='combination_discovery' THEN
    IF official_v3_result_private.exact_keys_v1(v,ARRAY['destinationCountryCode','citizenshipCountryCode','method']) IS NOT TRUE
      OR (v->>'destinationCountryCode'=ANY(countries)) IS NOT TRUE OR (v->>'citizenshipCountryCode'=ANY(countries)) IS NOT TRUE THEN RAISE EXCEPTION 'm04 invalid pair' USING ERRCODE='P7601'; END IF;
    pair_text:=official_v3_result_private.canonical_v1(v,0);
    jk:='combination-discovery-job:v3:'||encode(sha256(convert_to(pair_text,'UTF8')),'hex');
    RETURN jsonb_build_object('kind',kind,'jobKey',jk,'subjectText',(CASE WHEN jsonb_typeof(v->'citizenshipCountryCode')='string' AND jsonb_typeof(v->'destinationCountryCode')='string'
      THEN overlay(pair_text placing ',"kind":'||official_v3_result_private.canonical_v1(to_jsonb(kind),1) from strpos(pair_text COLLATE "C",',"method":') for 0)
      ELSE official_v3_result_private.canonical_v1(v||jsonb_build_object('kind',kind),0) END),'contextKey',NULL);
  END IF;
  IF kind IS DISTINCT FROM 'rule_research' OR official_v3_result_private.exact_keys_v1(v,ARRAY['context','method','factKind','researchReason']) IS NOT TRUE
    OR (v->>'factKind' IN ('passport_validity','blank_passport_pages','requirement_effect','visa_options','stay_limit','transit_conditions','official_actions','temporal_rule')) IS NOT TRUE THEN RAISE EXCEPTION 'm04 invalid subject' USING ERRCODE='P7601'; END IF;
  r:=v->'researchReason';
  IF r<>'{"status":"missing"}'::jsonb AND (official_v3_result_private.exact_keys_v1(r,ARRAY['status','reason']) IS NOT TRUE
    OR r->>'status' IS DISTINCT FROM 'recheck_needed' OR (r->>'reason' IN ('valid_from_in_future','valid_until_elapsed','max_age_exceeded')) IS NOT TRUE) THEN RAISE EXCEPTION 'm04 invalid reason' USING ERRCODE='P7601'; END IF;
  context:=official_v3_result_private.context_v1(v->'context'); s:=context->'scope'; o:=s->'credentialOption';
  ck:='official-truth-context:v3:'||encode(sha256(convert_to(official_v3_result_private.canonical_v1(context,0),'UTF8')),'hex');
  -- Legacy insertion order is deliberately distinct from canonical_v1 object order.
  legacy:='{"v":1,"destinationCountryCode":'||(s->'destinationCountryCode')::text||',"transitCountryCode":'||(s->'transitCountryCode')::text
    ||',"citizenshipMode":"required","citizenshipCountryCodes":'||official_v3_result_private.canonical_v1(s#>'{citizenship,countryCodes}',0)
    ||',"credentialOptionMode":'||(o->'mode')::text||',"documentType":'||COALESCE((o->'documentType')::text,'null')
    ||',"issuingCountryCode":'||COALESCE((o->'issuingCountryCode')::text,'null')||',"relatedCitizenshipCountryCode":'||COALESCE((o->'relatedCitizenshipCountryCode')::text,'null')
    ||',"relation":'||to_jsonb(CASE WHEN o->>'mode'='not_applicable' THEN 'not_applicable' WHEN o->'relatedCitizenshipCountryCode'='null'::jsonb THEN 'unlinked' ELSE 'explicit' END)::text
    ||',"residenceMode":'||(s#>'{residence,mode}')::text||',"residenceCountryCode":'||COALESCE((s#>'{residence,countryCode}')::text,'null')
    ||',"requirementType":'||(s->'requirementType')::text||',"validityMode":"not_applicable","travelDate":null}';
  sk:='rule-scope:v1:'||encode(sha256(convert_to(legacy,'UTF8')),'hex');
  rk:='research-request:v1:'||encode(sha256(convert_to('{"v":1,"ruleScopeKey":'||to_jsonb(sk)::text||',"factKind":'||(v->'factKind')::text
    ||',"status":'||(r->'status')::text||',"recheckReason":'||COALESCE((r->'reason')::text,'null')||'}','UTF8')),'hex');
  research:=jsonb_build_object('key',rk,'ruleScopeKey',sk,'factKind',v->'factKind','researchReason',r);
  jk:='research-job:v3:'||encode(sha256(convert_to(official_v3_result_private.canonical_v1(jsonb_build_object('contextKey',ck,'method',m,'factKind',v->'factKind'),0),'UTF8')),'hex');
  preimage:=jsonb_build_object('kind',kind,'context',context,'method',m,'factKind',v->'factKind');
  RETURN jsonb_build_object('kind',kind,'jobKey',jk,'subjectText',official_v3_result_private.canonical_v1(preimage,0),'contextKey',ck,'research',research);
END $$;
CREATE FUNCTION official_v3_result_private.reference_v1(v jsonb) RETURNS jsonb
LANGUAGE plpgsql IMMUTABLE PARALLEL UNSAFE SECURITY INVOKER CALLED ON NULL INPUT SET search_path=pg_catalog,pg_temp AS $$
DECLARE b jsonb:=v->'binding'; m jsonb:=b->'method';
BEGIN
  IF official_v3_result_private.exact_keys_v1(v,ARRAY['binding','proposalDigest','bytes']) IS NOT TRUE
    OR official_v3_result_private.exact_keys_v1(b,ARRAY['schema','kind','operationId','jobId','contextKey','method','runnerId','deliveryId','inputRevision']) IS NOT TRUE
    OR b->'schema' IS DISTINCT FROM '3'::jsonb OR b->>'kind' IS DISTINCT FROM 'proposal_intake_binding'
    OR (b->>'operationId' ~ '^op3_[a-f0-9]{32}$') IS NOT TRUE OR (b->>'jobId' ~ '^job3_[a-f0-9]{32}$') IS NOT TRUE
    OR (b->>'contextKey' ~ '^official-truth-context:v3:[a-f0-9]{64}$') IS NOT TRUE
    OR (b->>'runnerId' ~ '^runner3_[a-f0-9]{32}$') IS NOT TRUE OR (b->>'deliveryId' ~ '^delivery3_[a-f0-9]{32}$') IS NOT TRUE
    OR (b->>'inputRevision' ~ '^(git:[a-f0-9]{40}|snapshot:[a-f0-9]{64})$') IS NOT TRUE
    OR official_v3_result_private.exact_keys_v1(m,ARRAY['methodId','revision']) IS NOT TRUE OR jsonb_typeof(m->'methodId') IS DISTINCT FROM 'string' OR (m->>'methodId' ~ '^[a-z][a-z0-9_-]{1,63}$') IS NOT TRUE
    OR jsonb_typeof(m->'revision') IS DISTINCT FROM 'number' OR (m->>'revision' ~ '^[1-9][0-9]{0,9}$') IS NOT TRUE OR (m->>'revision')::numeric>2147483647
    OR (v->>'proposalDigest' ~ '^[a-f0-9]{64}$') IS NOT TRUE OR jsonb_typeof(v->'bytes') IS DISTINCT FROM 'number'
    OR (v->>'bytes' ~ '^[1-9][0-9]{0,4}$') IS NOT TRUE OR (v->>'bytes')::integer>65536 THEN RAISE EXCEPTION 'm04 invalid reference' USING ERRCODE='P7601'; END IF;
  RETURN v;
END $$;
CREATE FUNCTION official_v3_result_private.safe_data_v1(v jsonb, depth integer DEFAULT 0) RETURNS boolean
LANGUAGE plpgsql IMMUTABLE SECURITY INVOKER SET search_path = pg_catalog AS $$
DECLARE item record; element jsonb; n integer := 0;
BEGIN
  IF v IS NULL OR depth > 24 OR octet_length(v::text) > 524288 THEN RETURN false; END IF;
  IF jsonb_typeof(v) = 'object' THEN
    FOR item IN SELECT key, value FROM jsonb_each(v) LOOP
      n := n + 1;
      IF n > 8192 OR replace(lower(item.key), '_', '') = ANY(ARRAY[
        'sessionid','sessionkey','visitorid','ipaddress','passportphoto','documentphoto','photo','image','file',
        'rawtext','rawhtml','screenshot','address','streetaddress','firstname','lastname','fullname','name','email','phone',
        'passportnumber','documentnumber','mrz','userid','accountid','tripid','travellerid','dateofbirth','dob','biometrics',
        'note','notes','comment','freetext'])
        OR NOT official_v3_result_private.safe_data_v1(item.value, depth + 1) THEN RETURN false; END IF;
    END LOOP;
  ELSIF jsonb_typeof(v) = 'array' THEN
    FOR element IN SELECT value FROM jsonb_array_elements(v) LOOP
      n := n + 1;
      IF n > 8192 OR NOT official_v3_result_private.safe_data_v1(element, depth + 1) THEN RETURN false; END IF;
    END LOOP;
  END IF;
  RETURN true;
END $$;
CREATE FUNCTION official_v3_result_private.unique_json_v1(v json, depth integer DEFAULT 0) RETURNS boolean
LANGUAGE plpgsql IMMUTABLE SECURITY INVOKER SET search_path = pg_catalog AS $$
DECLARE item record; element json; names text[] := ARRAY[]::text[];
BEGIN
  IF v IS NULL OR depth > 16 OR octet_length(v::text) > 65536 THEN RETURN false; END IF;
  IF json_typeof(v) = 'object' THEN
    FOR item IN SELECT key, value FROM json_each(v) LOOP
      IF item.key = ANY(names) OR cardinality(names) >= 8192 THEN RETURN false; END IF;
      names := array_append(names, item.key);
      IF NOT official_v3_result_private.unique_json_v1(item.value, depth + 1) THEN RETURN false; END IF;
    END LOOP;
  ELSIF json_typeof(v) = 'array' THEN
    IF json_array_length(v) > 8192 THEN RETURN false; END IF;
    FOR element IN SELECT value FROM json_array_elements(v) LOOP
      IF NOT official_v3_result_private.unique_json_v1(element, depth + 1) THEN RETURN false; END IF;
    END LOOP;
  END IF;
  RETURN true;
END $$;

-- S1_RETENTION_SHAPE_BEGIN
CREATE FUNCTION official_v3_result_private.proposal_shape_v1() RETURNS jsonb
LANGUAGE sql IMMUTABLE SECURITY INVOKER SET search_path = pg_catalog AS $shape_function$
  SELECT $shape_json${"revision":2,"root":"proposal","countries":["AD","AE","AF","AG","AI","AL","AM","AO","AQ","AR","AS","AT","AU","AW","AX","AZ","BA","BB","BD","BE","BF","BG","BH","BI","BJ","BL","BM","BN","BO","BQ","BR","BS","BT","BV","BW","BY","BZ","CA","CC","CD","CF","CG","CH","CI","CK","CL","CM","CN","CO","CR","CU","CV","CW","CX","CY","CZ","DE","DJ","DK","DM","DO","DZ","EC","EE","EG","EH","ER","ES","ET","FI","FJ","FK","FM","FO","FR","GA","GB","GD","GE","GF","GG","GH","GI","GL","GM","GN","GP","GQ","GR","GS","GT","GU","GW","GY","HK","HM","HN","HR","HT","HU","ID","IE","IL","IM","IN","IO","IQ","IR","IS","IT","JE","JM","JO","JP","KE","KG","KH","KI","KM","KN","KP","KR","KW","KY","KZ","LA","LB","LC","LI","LK","LR","LS","LT","LU","LV","LY","MA","MC","MD","ME","MF","MG","MH","MK","ML","MM","MN","MO","MP","MQ","MR","MS","MT","MU","MV","MW","MX","MY","MZ","NA","NC","NE","NF","NG","NI","NL","NO","NP","NR","NU","NZ","OM","PA","PE","PF","PG","PH","PK","PL","PM","PN","PR","PS","PT","PW","PY","QA","RE","RO","RS","RU","RW","SA","SB","SC","SD","SE","SG","SH","SI","SJ","SK","SL","SM","SN","SO","SR","SS","ST","SV","SX","SY","SZ","TC","TD","TF","TG","TH","TJ","TK","TL","TM","TN","TO","TR","TT","TV","TW","TZ","UA","UG","UM","US","UY","UZ","VA","VC","VE","VG","VI","VN","VU","WF","WS","YE","YT","ZA","ZM","ZW"],"definitions":{"predicate1":{"type":"union","choices":[{"type":"object","properties":{"kind":{"type":"literal","value":"destination_permission"},"destinationCountryCode":{"type":"country"},"permissionClass":{"type":"enum","values":["entry_clearance","permission_to_enter_or_stay","electronic_travel_authorization","visa","residence_permit"]},"validity":{"type":"literal","value":"valid_on_travel_date"}},"optional":[]},{"type":"object","properties":{"kind":{"type":"literal","value":"lawful_residence"},"countryCode":{"type":"country"},"entitlement":{"type":"literal","value":"entitled_to_reside"},"departure":{"type":"enum","values":["unrestricted","unspecified"]}},"optional":[]},{"type":"object","properties":{"kind":{"type":"literal","value":"journey_origin"},"place":{"type":"union","choices":[{"type":"object","properties":{"kind":{"type":"literal","value":"country"},"countryCode":{"type":"country"}},"optional":[]},{"type":"object","properties":{"kind":{"type":"literal","value":"region"},"regionCode":{"type":"enum","values":["common_travel_area"]}},"optional":[]}]}},"optional":[]},{"type":"object","properties":{"kind":{"type":"literal","value":"age_on_travel_date"},"comparison":{"type":"enum","values":["at_most","at_least"]},"years":{"type":"integer","minimum":0,"maximum":120}},"optional":[]},{"type":"object","properties":{"kind":{"type":"literal","value":"travel_purpose"},"purpose":{"type":"enum","values":["visitor","business","study","medical","transit","work","creative_worker","other"]}},"optional":[]},{"type":"object","properties":{"kind":{"type":"literal","value":"document_class"},"documentClass":{"type":"enum","values":["ordinary","diplomatic","official","emergency","refugee_travel_document","laissez_passer"]}},"optional":[]},{"type":"object","properties":{"kind":{"type":"literal","value":"issuing_country"},"countryCode":{"type":"country"}},"optional":[]},{"type":"object","properties":{"kind":{"type":"literal","value":"citizenship_includes"},"countryCode":{"type":"country"}},"optional":[]},{"type":"object","properties":{"kind":{"type":"literal","value":"credential_citizenship_link"},"countryCode":{"type":"country"}},"optional":[]},{"type":"object","properties":{"kind":{"type":"literal","value":"nationality_status"},"status":{"type":"enum","values":["british_overseas_territory_citizen","british_national_overseas"]}},"optional":[]},{"type":"object","properties":{"kind":{"type":"literal","value":"institution_status"},"status":{"type":"enum","values":["french_ministry_of_education_school","confirmed_german_school"]}},"optional":[]},{"type":"object","properties":{"kind":{"type":"literal","value":"group_size_at_least"},"count":{"type":"integer","minimum":2,"maximum":50}},"optional":[]},{"type":"object","properties":{"kind":{"type":"literal","value":"group_membership"},"role":{"type":"literal","value":"traveller_included"}},"optional":[]},{"type":"object","properties":{"kind":{"type":"literal","value":"authority_confirmation"},"subject":{"type":"literal","value":"institution_status"}},"optional":[]}]},"predicate2":{"type":"union","choices":[{"type":"object","properties":{"kind":{"type":"literal","value":"destination_permission"},"destinationCountryCode":{"type":"country"},"permissionClass":{"type":"enum","values":["entry_clearance","permission_to_enter_or_stay","electronic_travel_authorization","visa","residence_permit"]},"validity":{"type":"literal","value":"valid_on_travel_date"}},"optional":[]},{"type":"object","properties":{"kind":{"type":"literal","value":"lawful_residence"},"countryCode":{"type":"country"},"entitlement":{"type":"literal","value":"entitled_to_reside"},"departure":{"type":"enum","values":["unrestricted","unspecified"]}},"optional":[]},{"type":"object","properties":{"kind":{"type":"literal","value":"journey_origin"},"place":{"type":"union","choices":[{"type":"object","properties":{"kind":{"type":"literal","value":"country"},"countryCode":{"type":"country"}},"optional":[]},{"type":"object","properties":{"kind":{"type":"literal","value":"region"},"regionCode":{"type":"enum","values":["common_travel_area"]}},"optional":[]}]}},"optional":[]},{"type":"object","properties":{"kind":{"type":"literal","value":"age_on_travel_date"},"comparison":{"type":"enum","values":["at_most","at_least"]},"years":{"type":"integer","minimum":0,"maximum":120}},"optional":[]},{"type":"object","properties":{"kind":{"type":"literal","value":"travel_purpose"},"purpose":{"type":"enum","values":["visitor","business","study","medical","transit","work","creative_worker","other"]}},"optional":[]},{"type":"object","properties":{"kind":{"type":"literal","value":"document_class"},"documentClass":{"type":"enum","values":["ordinary","diplomatic","official","emergency","refugee_travel_document","laissez_passer"]}},"optional":[]},{"type":"object","properties":{"kind":{"type":"literal","value":"issuing_country"},"countryCode":{"type":"country"}},"optional":[]},{"type":"object","properties":{"kind":{"type":"literal","value":"citizenship_includes"},"countryCode":{"type":"country"}},"optional":[]},{"type":"object","properties":{"kind":{"type":"literal","value":"credential_citizenship_link"},"countryCode":{"type":"country"}},"optional":[]},{"type":"object","properties":{"kind":{"type":"literal","value":"nationality_status"},"status":{"type":"enum","values":["british_overseas_territory_citizen","british_national_overseas"]}},"optional":[]},{"type":"object","properties":{"kind":{"type":"literal","value":"institution_status"},"status":{"type":"enum","values":["french_ministry_of_education_school","confirmed_german_school"]}},"optional":[]},{"type":"object","properties":{"kind":{"type":"literal","value":"group_size_at_least"},"count":{"type":"integer","minimum":2,"maximum":50}},"optional":[]},{"type":"object","properties":{"kind":{"type":"literal","value":"group_membership"},"role":{"type":"literal","value":"traveller_included"}},"optional":[]},{"type":"object","properties":{"kind":{"type":"literal","value":"authority_confirmation"},"subject":{"type":"literal","value":"institution_status"}},"optional":[]},{"type":"object","properties":{"kind":{"type":"literal","value":"activity_characteristic"},"characteristic":{"type":"enum","values":["remunerative_activity","income_earning_activity","profit_making_business_operation","business_contacts"]}},"optional":[]},{"type":"object","properties":{"kind":{"type":"literal","value":"national_passport_for_citizenship"},"countryCode":{"type":"country"}},"optional":[]},{"type":"object","properties":{"kind":{"type":"literal","value":"planned_stay_duration"},"comparison":{"type":"enum","values":["at_most","more_than"]},"duration":{"type":"union","choices":[{"type":"object","properties":{"value":{"type":"integer","minimum":1,"maximum":3660},"unit":{"type":"literal","value":"days"}},"optional":[]},{"type":"object","properties":{"value":{"type":"integer","minimum":1,"maximum":120},"unit":{"type":"literal","value":"months"}},"optional":[]}]},"counting":{"type":"enum","values":["unspecified","calendar_dates_inclusive","calendar_dates_exit_exclusive"]}},"optional":[]}]},"expression1":{"type":"union","choices":[{"type":"object","properties":{"op":{"type":"literal","value":"atomic"},"predicate":{"ref":"predicate1"},"supportVersionIds":{"type":"array","items":{"type":"string","pattern":"^ev2_[a-f0-9]{32}$","maximum":36},"minimum":0,"maximum":8,"unique":false}},"optional":["supportVersionIds"]},{"type":"object","properties":{"op":{"type":"enum","values":["all","any"]},"operands":{"type":"array","items":{"ref":"expression1"},"minimum":1,"maximum":8,"unique":false}},"optional":[]},{"type":"object","properties":{"op":{"type":"literal","value":"not"},"operand":{"ref":"expression1"}},"optional":[]}]},"expression2":{"type":"union","choices":[{"type":"object","properties":{"op":{"type":"literal","value":"atomic"},"predicate":{"ref":"predicate2"},"supportVersionIds":{"type":"array","items":{"type":"string","pattern":"^ev2_[a-f0-9]{32}$","maximum":36},"minimum":0,"maximum":8,"unique":false}},"optional":["supportVersionIds"]},{"type":"object","properties":{"op":{"type":"enum","values":["all","any"]},"operands":{"type":"array","items":{"ref":"expression2"},"minimum":1,"maximum":8,"unique":false}},"optional":[]},{"type":"object","properties":{"op":{"type":"literal","value":"not"},"operand":{"ref":"expression2"}},"optional":[]}]},"context":{"type":"union","choices":[{"type":"object","properties":{"scope":{"type":"object","properties":{"destinationCountryCode":{"type":"country"},"transitCountryCode":{"type":"union","choices":[{"type":"null"},{"type":"country"}]},"citizenship":{"type":"object","properties":{"mode":{"type":"literal","value":"required"},"countryCodes":{"type":"array","items":{"type":"country"},"minimum":1,"maximum":1,"unique":false}},"optional":[]},"credentialOption":{"type":"union","choices":[{"type":"object","properties":{"mode":{"type":"literal","value":"not_applicable"}},"optional":[]},{"type":"object","properties":{"mode":{"type":"literal","value":"option"},"documentType":{"type":"enum","values":["passport","national_id","unknown"]},"issuingCountryCode":{"type":"country"},"relatedCitizenshipCountryCode":{"type":"union","choices":[{"type":"null"},{"type":"country"}]}},"optional":[]}]},"residence":{"type":"union","choices":[{"type":"object","properties":{"mode":{"type":"literal","value":"not_applicable"}},"optional":[]},{"type":"object","properties":{"mode":{"type":"literal","value":"required"},"countryCode":{"type":"country"}},"optional":[]}]},"requirementType":{"type":"enum","values":["visa","electronic_travel_authorization","passport","identity_document","passport_validity","blank_passport_pages","transit","health","vaccination","health_document","entry_form","insurance","onward_or_return_ticket","booking_or_travel_document","financial_means","other_entry_requirement"]},"validity":{"type":"object","properties":{"mode":{"type":"literal","value":"not_applicable"}},"optional":[]}},"optional":[]},"route":{"type":"enum","values":["direct_entry","transit","unresolved"]},"conditions":{"type":"union","choices":[{"type":"object","properties":{"status":{"type":"literal","value":"unconditional"}},"optional":[]},{"type":"object","properties":{"status":{"type":"literal","value":"specified"},"expression":{"ref":"expression2"}},"optional":[]},{"type":"object","properties":{"status":{"type":"literal","value":"unresolved"},"missing":{"type":"array","items":{"type":"enum","values":["document_class","travel_purpose","planned_stay_duration","transit","other_rule_conditions"]},"minimum":1,"maximum":5,"unique":true}},"optional":[]}]}},"optional":[]},{"type":"object","properties":{"contextRevision":{"type":"literal","value":2},"scope":{"type":"object","properties":{"destinationCountryCode":{"type":"country"},"transitCountryCode":{"type":"union","choices":[{"type":"null"},{"type":"country"}]},"citizenship":{"type":"object","properties":{"mode":{"type":"literal","value":"required"},"countryCodes":{"type":"array","items":{"type":"country"},"minimum":1,"maximum":1,"unique":false}},"optional":[]},"credentialOption":{"type":"union","choices":[{"type":"object","properties":{"mode":{"type":"literal","value":"not_applicable"}},"optional":[]},{"type":"object","properties":{"mode":{"type":"literal","value":"option"},"documentType":{"type":"enum","values":["passport","national_id","unknown"]},"issuingCountryCode":{"type":"country"},"relatedCitizenshipCountryCode":{"type":"union","choices":[{"type":"null"},{"type":"country"}]}},"optional":[]}]},"residence":{"type":"union","choices":[{"type":"object","properties":{"mode":{"type":"literal","value":"not_applicable"}},"optional":[]},{"type":"object","properties":{"mode":{"type":"literal","value":"required"},"countryCode":{"type":"country"}},"optional":[]}]},"requirementType":{"type":"enum","values":["visa","electronic_travel_authorization","passport","identity_document","passport_validity","blank_passport_pages","transit","health","vaccination","health_document","entry_form","insurance","onward_or_return_ticket","booking_or_travel_document","financial_means","other_entry_requirement"]},"validity":{"type":"object","properties":{"mode":{"type":"literal","value":"not_applicable"}},"optional":[]}},"optional":[]},"route":{"type":"enum","values":["direct_entry","transit","unresolved"]},"conditions":{"type":"union","choices":[{"type":"object","properties":{"status":{"type":"literal","value":"unconditional"}},"optional":[]},{"type":"object","properties":{"status":{"type":"literal","value":"specified"},"expression":{"ref":"expression2"}},"optional":[]},{"type":"object","properties":{"status":{"type":"literal","value":"unresolved"},"missing":{"type":"array","items":{"type":"enum","values":["document_class","travel_purpose","planned_stay_duration","transit","other_rule_conditions"]},"minimum":1,"maximum":5,"unique":true}},"optional":[]}]},"application":{"type":"object","properties":{"purpose":{"type":"literal","value":"tourism"},"tripStartAndEndWindow":{"type":"object","properties":{"from":{"type":"date"},"through":{"type":"date"}},"optional":[]}},"optional":[]}},"optional":[]}]},"research":{"type":"object","properties":{"key":{"type":"string","pattern":"^research-request:v1:[a-f0-9]{64}$","maximum":84},"ruleScopeKey":{"type":"string","pattern":"^rule-scope:v1:[a-f0-9]{64}$","maximum":78},"factKind":{"type":"enum","values":["requirement_effect","visa_options","stay_limit","passport_validity","blank_passport_pages","transit_conditions","official_actions","temporal_rule"]},"researchReason":{"type":"union","choices":[{"type":"object","properties":{"status":{"type":"literal","value":"missing"}},"optional":[]},{"type":"object","properties":{"status":{"type":"literal","value":"recheck_needed"},"reason":{"type":"enum","values":["valid_from_in_future","valid_until_elapsed","max_age_exceeded"]}},"optional":[]}]}},"optional":[]},"fact1":{"type":"union","choices":[{"type":"object","properties":{"kind":{"type":"literal","value":"requirement_effect"},"effect":{"type":"enum","values":["required","not_required"]},"visaMode":{"type":"union","choices":[{"type":"null"},{"type":"enum","values":["visa_exempt","visa_on_arrival","electronic_visa","visa_before_travel","unknown"]}]}},"optional":[]},{"type":"object","properties":{"kind":{"type":"literal","value":"requirement_effect"},"schema":{"type":"literal","value":1},"applicability":{"type":"object","properties":{"schema":{"type":"literal","value":1},"kind":{"type":"literal","value":"unconditional"}},"optional":[]},"effect":{"type":"enum","values":["required","not_required"]},"visaMode":{"type":"union","choices":[{"type":"null"},{"type":"enum","values":["visa_exempt","visa_on_arrival","electronic_visa","visa_before_travel","unknown"]}]}},"optional":[]},{"type":"object","properties":{"kind":{"type":"literal","value":"requirement_effect"},"schema":{"type":"literal","value":1},"applicability":{"type":"object","properties":{"schema":{"type":"literal","value":1},"kind":{"type":"literal","value":"branches"},"branches":{"type":"array","items":{"type":"object","properties":{"id":{"type":"string","pattern":"^[a-z][a-z0-9_]{0,31}$","maximum":32},"when":{"type":"union","choices":[{"type":"object","properties":{"kind":{"type":"literal","value":"otherwise"}},"optional":[]},{"type":"object","properties":{"kind":{"type":"literal","value":"expression"},"expression":{"ref":"expression1"}},"optional":[]}]},"outcome":{"type":"object","properties":{"effect":{"type":"enum","values":["required","not_required"]},"visaMode":{"type":"union","choices":[{"type":"null"},{"type":"enum","values":["visa_exempt","visa_on_arrival","electronic_visa","visa_before_travel","unknown"]}]}},"optional":[]},"supportVersionIds":{"type":"array","items":{"type":"string","pattern":"^ev2_[a-f0-9]{32}$","maximum":36},"minimum":0,"maximum":8,"unique":false}},"optional":[]},"minimum":1,"maximum":8,"unique":false}},"optional":[]}},"optional":[]},{"type":"object","properties":{"kind":{"type":"literal","value":"visa_options"},"options":{"type":"array","items":{"type":"object","properties":{"visaMode":{"type":"enum","values":["visa_exempt","visa_on_arrival","electronic_visa","visa_before_travel"]},"eligibility":{"type":"enum","values":["allowed","not_allowed","unknown"]},"mandate":{"type":"enum","values":["mandatory","not_mandatory","unknown"]}},"optional":[]},"minimum":1,"maximum":4,"unique":false}},"optional":[]},{"type":"object","properties":{"kind":{"type":"literal","value":"visa_options"},"schema":{"type":"literal","value":1},"options":{"type":"array","items":{"type":"union","choices":[{"type":"object","properties":{"visaMode":{"type":"enum","values":["visa_exempt","visa_on_arrival","electronic_visa","visa_before_travel"]},"applicability":{"type":"object","properties":{"schema":{"type":"literal","value":1},"kind":{"type":"literal","value":"unconditional"}},"optional":[]},"eligibility":{"type":"enum","values":["allowed","not_allowed","unknown"]},"mandate":{"type":"enum","values":["mandatory","not_mandatory","unknown"]}},"optional":[]},{"type":"object","properties":{"visaMode":{"type":"enum","values":["visa_exempt","visa_on_arrival","electronic_visa","visa_before_travel"]},"applicability":{"type":"object","properties":{"schema":{"type":"literal","value":1},"kind":{"type":"literal","value":"branches"},"branches":{"type":"array","items":{"type":"object","properties":{"id":{"type":"string","pattern":"^[a-z][a-z0-9_]{0,31}$","maximum":32},"when":{"type":"union","choices":[{"type":"object","properties":{"kind":{"type":"literal","value":"otherwise"}},"optional":[]},{"type":"object","properties":{"kind":{"type":"literal","value":"expression"},"expression":{"ref":"expression1"}},"optional":[]}]},"outcome":{"type":"object","properties":{"eligibility":{"type":"enum","values":["allowed","not_allowed"]},"mandate":{"type":"enum","values":["mandatory","not_mandatory","unknown"]}},"optional":[]},"supportVersionIds":{"type":"array","items":{"type":"string","pattern":"^ev2_[a-f0-9]{32}$","maximum":36},"minimum":0,"maximum":8,"unique":false}},"optional":[]},"minimum":1,"maximum":8,"unique":false}},"optional":[]}},"optional":[]}]},"minimum":1,"maximum":4,"unique":false}},"optional":[]},{"type":"object","properties":{"kind":{"type":"literal","value":"stay_limit"},"perVisit":{"type":"union","choices":[{"type":"null"},{"type":"union","choices":[{"type":"object","properties":{"value":{"type":"integer","minimum":1,"maximum":3660},"unit":{"type":"literal","value":"days"}},"optional":[]},{"type":"object","properties":{"value":{"type":"integer","minimum":1,"maximum":120},"unit":{"type":"literal","value":"months"}},"optional":[]},{"type":"object","properties":{"value":{"type":"integer","minimum":1,"maximum":10},"unit":{"type":"literal","value":"years"}},"optional":[]}]}]},"rollingWindow":{"type":"union","choices":[{"type":"null"},{"type":"object","properties":{"maximum":{"type":"union","choices":[{"type":"object","properties":{"value":{"type":"integer","minimum":1,"maximum":3660},"unit":{"type":"literal","value":"days"}},"optional":[]},{"type":"object","properties":{"value":{"type":"integer","minimum":1,"maximum":120},"unit":{"type":"literal","value":"months"}},"optional":[]},{"type":"object","properties":{"value":{"type":"integer","minimum":1,"maximum":10},"unit":{"type":"literal","value":"years"}},"optional":[]}]},"within":{"type":"union","choices":[{"type":"object","properties":{"value":{"type":"integer","minimum":1,"maximum":3660},"unit":{"type":"literal","value":"days"}},"optional":[]},{"type":"object","properties":{"value":{"type":"integer","minimum":1,"maximum":120},"unit":{"type":"literal","value":"months"}},"optional":[]},{"type":"object","properties":{"value":{"type":"integer","minimum":1,"maximum":10},"unit":{"type":"literal","value":"years"}},"optional":[]}]}},"optional":[]}]},"initialGrant":{"type":"union","choices":[{"type":"null"},{"type":"union","choices":[{"type":"object","properties":{"value":{"type":"integer","minimum":1,"maximum":3660},"unit":{"type":"literal","value":"days"}},"optional":[]},{"type":"object","properties":{"value":{"type":"integer","minimum":1,"maximum":120},"unit":{"type":"literal","value":"months"}},"optional":[]},{"type":"object","properties":{"value":{"type":"integer","minimum":1,"maximum":10},"unit":{"type":"literal","value":"years"}},"optional":[]}]}]},"extension":{"type":"union","choices":[{"type":"null"},{"type":"object","properties":{"requiresApplication":{"type":"boolean"},"maximumTotal":{"type":"union","choices":[{"type":"object","properties":{"value":{"type":"integer","minimum":1,"maximum":3660},"unit":{"type":"literal","value":"days"}},"optional":[]},{"type":"object","properties":{"value":{"type":"integer","minimum":1,"maximum":120},"unit":{"type":"literal","value":"months"}},"optional":[]},{"type":"object","properties":{"value":{"type":"integer","minimum":1,"maximum":10},"unit":{"type":"literal","value":"years"}},"optional":[]}]}},"optional":[]}]},"borderDiscretion":{"type":"enum","values":["fixed","may_be_shorter","determined_at_border"]}},"optional":[]},{"type":"object","properties":{"kind":{"type":"literal","value":"passport_validity"},"semantics":{"type":"enum","values":["valid_on_entry","valid_through_stay"]},"duration":{"type":"null"}},"optional":["duration"]},{"type":"object","properties":{"kind":{"type":"literal","value":"passport_validity"},"semantics":{"type":"enum","values":["minimum_remaining_from_entry","minimum_remaining_from_planned_departure","minimum_remaining_at_application","expired_document_exception"]},"duration":{"type":"union","choices":[{"type":"object","properties":{"value":{"type":"integer","minimum":1,"maximum":3660},"unit":{"type":"literal","value":"days"}},"optional":[]},{"type":"object","properties":{"value":{"type":"integer","minimum":1,"maximum":120},"unit":{"type":"literal","value":"months"}},"optional":[]},{"type":"object","properties":{"value":{"type":"integer","minimum":1,"maximum":10},"unit":{"type":"literal","value":"years"}},"optional":[]}]}},"optional":[]},{"type":"object","properties":{"kind":{"type":"literal","value":"blank_passport_pages"},"minimumPages":{"type":"integer","minimum":1,"maximum":10}},"optional":[]},{"type":"object","properties":{"kind":{"type":"literal","value":"transit_conditions"},"paths":{"type":"array","items":{"type":"object","properties":{"crossesBorderControl":{"type":"union","choices":[{"type":"null"},{"type":"boolean"}]},"leavesTransitArea":{"type":"union","choices":[{"type":"null"},{"type":"boolean"}]},"transitAirportCodes":{"type":"union","choices":[{"type":"null"},{"type":"array","items":{"type":"string","pattern":"^[A-Z]{3}$","maximum":3},"minimum":1,"maximum":8192,"unique":false}]},"maxTransitDurationMinutes":{"type":"union","choices":[{"type":"null"},{"type":"integer","minimum":1,"maximum":20160}]},"arrivalMode":{"type":"union","choices":[{"type":"null"},{"type":"enum","values":["air","land","sea"]}]},"departureMode":{"type":"union","choices":[{"type":"null"},{"type":"enum","values":["air","land","sea"]}]},"thirdCountryRequired":{"type":"union","choices":[{"type":"null"},{"type":"boolean"}]},"sameFlightRequired":{"type":"union","choices":[{"type":"null"},{"type":"boolean"}]},"onwardTicketRequired":{"type":"union","choices":[{"type":"null"},{"type":"boolean"}]}},"optional":[]},"minimum":1,"maximum":8,"unique":false}},"optional":[]},{"type":"object","properties":{"kind":{"type":"literal","value":"temporal_rule"},"rule":{"type":"object","properties":{"kind":{"type":"literal","value":"relative_duration"},"availableFrom":{"type":"union","choices":[{"type":"null"},{"type":"union","choices":[{"type":"object","properties":{"anchor":{"type":"enum","values":["trip_departure","destination_arrival","transit_arrival","border_crossing"]},"relation":{"type":"literal","value":"at"},"offsetMinutes":{"type":"literal","value":0}},"optional":[]},{"type":"object","properties":{"anchor":{"type":"enum","values":["trip_departure","destination_arrival","transit_arrival","border_crossing"]},"relation":{"type":"literal","value":"before"},"offsetMinutes":{"type":"integer","minimum":1,"maximum":1051200}},"optional":[]},{"type":"object","properties":{"anchor":{"type":"enum","values":["trip_departure","destination_arrival","transit_arrival","border_crossing"]},"relation":{"type":"literal","value":"after"},"offsetMinutes":{"type":"integer","minimum":1,"maximum":1051200}},"optional":[]}]}]},"dueBy":{"type":"union","choices":[{"type":"null"},{"type":"union","choices":[{"type":"object","properties":{"anchor":{"type":"enum","values":["trip_departure","destination_arrival","transit_arrival","border_crossing"]},"relation":{"type":"literal","value":"at"},"offsetMinutes":{"type":"literal","value":0},"semantics":{"type":"enum","values":["mandatory","recommended"]}},"optional":[]},{"type":"object","properties":{"anchor":{"type":"enum","values":["trip_departure","destination_arrival","transit_arrival","border_crossing"]},"relation":{"type":"literal","value":"before"},"offsetMinutes":{"type":"integer","minimum":1,"maximum":1051200},"semantics":{"type":"enum","values":["mandatory","recommended"]}},"optional":[]},{"type":"object","properties":{"anchor":{"type":"enum","values":["trip_departure","destination_arrival","transit_arrival","border_crossing"]},"relation":{"type":"literal","value":"after"},"offsetMinutes":{"type":"integer","minimum":1,"maximum":1051200},"semantics":{"type":"enum","values":["mandatory","recommended"]}},"optional":[]}]}]}},"optional":["availableFrom","dueBy"]}},"optional":[]}]},"fact2":{"type":"union","choices":[{"type":"object","properties":{"kind":{"type":"literal","value":"requirement_effect"},"schema":{"type":"literal","value":2},"applicability":{"type":"object","properties":{"schema":{"type":"literal","value":2},"kind":{"type":"literal","value":"unconditional"}},"optional":[]},"effect":{"type":"enum","values":["required","not_required"]},"visaMode":{"type":"union","choices":[{"type":"null"},{"type":"enum","values":["visa_exempt","visa_on_arrival","electronic_visa","visa_before_travel","unknown"]}]}},"optional":[]},{"type":"object","properties":{"kind":{"type":"literal","value":"requirement_effect"},"schema":{"type":"literal","value":2},"applicability":{"type":"object","properties":{"schema":{"type":"literal","value":2},"kind":{"type":"literal","value":"branches"},"branches":{"type":"array","items":{"type":"object","properties":{"id":{"type":"string","pattern":"^[a-z][a-z0-9_]{0,31}$","maximum":32},"when":{"type":"union","choices":[{"type":"object","properties":{"kind":{"type":"literal","value":"otherwise"}},"optional":[]},{"type":"object","properties":{"kind":{"type":"literal","value":"expression"},"expression":{"ref":"expression2"}},"optional":[]}]},"outcome":{"type":"object","properties":{"effect":{"type":"enum","values":["required","not_required"]},"visaMode":{"type":"union","choices":[{"type":"null"},{"type":"enum","values":["visa_exempt","visa_on_arrival","electronic_visa","visa_before_travel","unknown"]}]}},"optional":[]},"supportVersionIds":{"type":"array","items":{"type":"string","pattern":"^ev2_[a-f0-9]{32}$","maximum":36},"minimum":0,"maximum":8,"unique":false}},"optional":[]},"minimum":1,"maximum":8,"unique":false}},"optional":[]}},"optional":[]},{"type":"object","properties":{"kind":{"type":"literal","value":"visa_options"},"schema":{"type":"literal","value":2},"options":{"type":"array","items":{"type":"union","choices":[{"type":"object","properties":{"visaMode":{"type":"enum","values":["visa_exempt","visa_on_arrival","electronic_visa","visa_before_travel"]},"applicability":{"type":"object","properties":{"schema":{"type":"literal","value":2},"kind":{"type":"literal","value":"unconditional"}},"optional":[]},"eligibility":{"type":"enum","values":["allowed","not_allowed","unknown"]},"mandate":{"type":"enum","values":["mandatory","not_mandatory","unknown"]}},"optional":[]},{"type":"object","properties":{"visaMode":{"type":"enum","values":["visa_exempt","visa_on_arrival","electronic_visa","visa_before_travel"]},"applicability":{"type":"object","properties":{"schema":{"type":"literal","value":2},"kind":{"type":"literal","value":"branches"},"branches":{"type":"array","items":{"type":"object","properties":{"id":{"type":"string","pattern":"^[a-z][a-z0-9_]{0,31}$","maximum":32},"when":{"type":"union","choices":[{"type":"object","properties":{"kind":{"type":"literal","value":"otherwise"}},"optional":[]},{"type":"object","properties":{"kind":{"type":"literal","value":"expression"},"expression":{"ref":"expression2"}},"optional":[]}]},"outcome":{"type":"object","properties":{"eligibility":{"type":"enum","values":["allowed","not_allowed"]},"mandate":{"type":"enum","values":["mandatory","not_mandatory","unknown"]}},"optional":[]},"supportVersionIds":{"type":"array","items":{"type":"string","pattern":"^ev2_[a-f0-9]{32}$","maximum":36},"minimum":0,"maximum":8,"unique":false}},"optional":[]},"minimum":1,"maximum":8,"unique":false}},"optional":[]}},"optional":[]}]},"minimum":1,"maximum":4,"unique":false}},"optional":[]},{"type":"union","choices":[{"type":"object","properties":{"kind":{"type":"literal","value":"stay_limit"},"schema":{"type":"literal","value":2},"applicability":{"type":"object","properties":{"schema":{"type":"literal","value":2},"kind":{"type":"literal","value":"unconditional"}},"optional":[]},"outcome":{"type":"object","properties":{"perVisit":{"type":"union","choices":[{"type":"null"},{"type":"union","choices":[{"type":"object","properties":{"value":{"type":"integer","minimum":1,"maximum":3660},"unit":{"type":"literal","value":"days"}},"optional":[]},{"type":"object","properties":{"value":{"type":"integer","minimum":1,"maximum":120},"unit":{"type":"literal","value":"months"}},"optional":[]}]}]},"initialGrant":{"type":"union","choices":[{"type":"null"},{"type":"object","properties":{"quantity":{"type":"union","choices":[{"type":"object","properties":{"value":{"type":"integer","minimum":1,"maximum":3660},"unit":{"type":"literal","value":"days"}},"optional":[]},{"type":"object","properties":{"value":{"type":"integer","minimum":1,"maximum":120},"unit":{"type":"literal","value":"months"}},"optional":[]}]},"event":{"type":"literal","value":"permission_to_enter_granted"}},"optional":[]}]},"extension":{"type":"union","choices":[{"type":"null"},{"type":"object","properties":{"requiresApplication":{"type":"boolean"},"maximumTotal":{"type":"union","choices":[{"type":"object","properties":{"value":{"type":"integer","minimum":1,"maximum":3660},"unit":{"type":"literal","value":"days"}},"optional":[]},{"type":"object","properties":{"value":{"type":"integer","minimum":1,"maximum":120},"unit":{"type":"literal","value":"months"}},"optional":[]}]},"applicationDeadline":{"type":"union","choices":[{"type":"null"},{"type":"object","properties":{"schema":{"type":"literal","value":2},"kind":{"type":"literal","value":"event_deadline"},"action":{"type":"literal","value":"stay_extension_application"},"reference":{"type":"object","properties":{"event":{"type":"literal","value":"current_stay_permission_expiry"},"countryCode":{"type":"country"}},"optional":[]},"relation":{"type":"literal","value":"before"},"semantics":{"type":"enum","values":["mandatory","recommended"]}},"optional":[]}]},"authority":{"type":"union","choices":[{"type":"null"},{"type":"object","properties":{"countryCode":{"type":"country"},"role":{"type":"literal","value":"immigration_authority"}},"optional":[]}]}},"optional":[]}]},"borderDiscretion":{"type":"enum","values":["fixed","may_be_shorter","determined_at_border"]}},"optional":[]}},"optional":[]},{"type":"object","properties":{"kind":{"type":"literal","value":"stay_limit"},"schema":{"type":"literal","value":2},"applicability":{"type":"object","properties":{"schema":{"type":"literal","value":2},"kind":{"type":"literal","value":"branches"},"branches":{"type":"array","items":{"type":"object","properties":{"id":{"type":"string","pattern":"^[a-z][a-z0-9_]{0,31}$","maximum":32},"when":{"type":"union","choices":[{"type":"object","properties":{"kind":{"type":"literal","value":"otherwise"}},"optional":[]},{"type":"object","properties":{"kind":{"type":"literal","value":"expression"},"expression":{"ref":"expression2"}},"optional":[]}]},"outcome":{"type":"object","properties":{"perVisit":{"type":"union","choices":[{"type":"null"},{"type":"union","choices":[{"type":"object","properties":{"value":{"type":"integer","minimum":1,"maximum":3660},"unit":{"type":"literal","value":"days"}},"optional":[]},{"type":"object","properties":{"value":{"type":"integer","minimum":1,"maximum":120},"unit":{"type":"literal","value":"months"}},"optional":[]}]}]},"initialGrant":{"type":"union","choices":[{"type":"null"},{"type":"object","properties":{"quantity":{"type":"union","choices":[{"type":"object","properties":{"value":{"type":"integer","minimum":1,"maximum":3660},"unit":{"type":"literal","value":"days"}},"optional":[]},{"type":"object","properties":{"value":{"type":"integer","minimum":1,"maximum":120},"unit":{"type":"literal","value":"months"}},"optional":[]}]},"event":{"type":"literal","value":"permission_to_enter_granted"}},"optional":[]}]},"extension":{"type":"union","choices":[{"type":"null"},{"type":"object","properties":{"requiresApplication":{"type":"boolean"},"maximumTotal":{"type":"union","choices":[{"type":"object","properties":{"value":{"type":"integer","minimum":1,"maximum":3660},"unit":{"type":"literal","value":"days"}},"optional":[]},{"type":"object","properties":{"value":{"type":"integer","minimum":1,"maximum":120},"unit":{"type":"literal","value":"months"}},"optional":[]}]},"applicationDeadline":{"type":"union","choices":[{"type":"null"},{"type":"object","properties":{"schema":{"type":"literal","value":2},"kind":{"type":"literal","value":"event_deadline"},"action":{"type":"literal","value":"stay_extension_application"},"reference":{"type":"object","properties":{"event":{"type":"literal","value":"current_stay_permission_expiry"},"countryCode":{"type":"country"}},"optional":[]},"relation":{"type":"literal","value":"before"},"semantics":{"type":"enum","values":["mandatory","recommended"]}},"optional":[]}]},"authority":{"type":"union","choices":[{"type":"null"},{"type":"object","properties":{"countryCode":{"type":"country"},"role":{"type":"literal","value":"immigration_authority"}},"optional":[]}]}},"optional":[]}]},"borderDiscretion":{"type":"enum","values":["fixed","may_be_shorter","determined_at_border"]}},"optional":[]},"supportVersionIds":{"type":"array","items":{"type":"string","pattern":"^ev2_[a-f0-9]{32}$","maximum":36},"minimum":0,"maximum":8,"unique":false}},"optional":[]},"minimum":1,"maximum":8,"unique":false}},"optional":[]}},"optional":[]}]},{"type":"union","choices":[{"type":"object","properties":{"kind":{"type":"literal","value":"temporal_rule"},"schema":{"type":"literal","value":2},"applicability":{"type":"object","properties":{"schema":{"type":"literal","value":2},"kind":{"type":"literal","value":"unconditional"}},"optional":[]},"outcome":{"type":"object","properties":{"schema":{"type":"literal","value":2},"kind":{"type":"literal","value":"event_deadline"},"action":{"type":"literal","value":"stay_extension_application"},"reference":{"type":"object","properties":{"event":{"type":"literal","value":"current_stay_permission_expiry"},"countryCode":{"type":"country"}},"optional":[]},"relation":{"type":"literal","value":"before"},"semantics":{"type":"enum","values":["mandatory","recommended"]}},"optional":[]}},"optional":[]},{"type":"object","properties":{"kind":{"type":"literal","value":"temporal_rule"},"schema":{"type":"literal","value":2},"applicability":{"type":"object","properties":{"schema":{"type":"literal","value":2},"kind":{"type":"literal","value":"branches"},"branches":{"type":"array","items":{"type":"object","properties":{"id":{"type":"string","pattern":"^[a-z][a-z0-9_]{0,31}$","maximum":32},"when":{"type":"union","choices":[{"type":"object","properties":{"kind":{"type":"literal","value":"otherwise"}},"optional":[]},{"type":"object","properties":{"kind":{"type":"literal","value":"expression"},"expression":{"ref":"expression2"}},"optional":[]}]},"outcome":{"type":"object","properties":{"schema":{"type":"literal","value":2},"kind":{"type":"literal","value":"event_deadline"},"action":{"type":"literal","value":"stay_extension_application"},"reference":{"type":"object","properties":{"event":{"type":"literal","value":"current_stay_permission_expiry"},"countryCode":{"type":"country"}},"optional":[]},"relation":{"type":"literal","value":"before"},"semantics":{"type":"enum","values":["mandatory","recommended"]}},"optional":[]},"supportVersionIds":{"type":"array","items":{"type":"string","pattern":"^ev2_[a-f0-9]{32}$","maximum":36},"minimum":0,"maximum":8,"unique":false}},"optional":[]},"minimum":1,"maximum":8,"unique":false}},"optional":[]}},"optional":[]}]}]},"validity":{"type":"union","choices":[{"type":"object","properties":{"status":{"type":"literal","value":"unresolved"}},"optional":[]},{"type":"object","properties":{"status":{"type":"literal","value":"specified"},"validFrom":{"type":"union","choices":[{"type":"null"},{"type":"date"}]},"validUntil":{"type":"union","choices":[{"type":"null"},{"type":"date"}]}},"optional":[]}]},"proposal":{"type":"object","properties":{"schema":{"type":"literal","value":3},"kind":{"type":"literal","value":"untrusted_research_proposal"},"jobId":{"type":"string","pattern":"^job3_[a-f0-9]{32}$","maximum":37},"operationId":{"type":"string","pattern":"^op3_[a-f0-9]{32}$","maximum":36},"context":{"ref":"context"},"contextKey":{"type":"string","pattern":"^official-truth-context:v3:[a-f0-9]{64}$","maximum":90},"research":{"ref":"research"},"proposedFact":{"type":"union","choices":[{"type":"object","properties":{"schema":{"type":"literal","value":1},"fact":{"ref":"fact1"}},"optional":[]},{"type":"object","properties":{"schema":{"type":"literal","value":2},"fact":{"ref":"fact2"}},"optional":[]}]},"references":{"type":"array","items":{"type":"object","properties":{"source":{"type":"object","properties":{"sourceId":{"type":"string","pattern":"^[a-z][a-z0-9_-]{1,63}$","maximum":64},"contentItemId":{"type":"string","pattern":"^[a-z][a-z0-9_-]{1,63}$","maximum":64},"representationId":{"type":"string","pattern":"^[a-z][a-z0-9_-]{1,63}$","maximum":64}},"optional":[]},"claimedRetrievedAt":{"type":"union","choices":[{"type":"null"},{"type":"timestamp"}]},"claimedValidity":{"ref":"validity"}},"optional":[]},"minimum":1,"maximum":8,"unique":false}},"optional":[]},"evidence":{"type":"object","properties":{"versionId":{"type":"string","pattern":"^ev2_[a-f0-9]{32}$","maximum":36},"lookupKey":{"type":"string","pattern":"^evidence-key:v3:[a-f0-9]{64}$","maximum":80},"source":{"type":"object","properties":{"sourceId":{"type":"string","pattern":"^[a-z][a-z0-9_-]{1,63}$","maximum":64},"contentItemId":{"type":"string","pattern":"^[a-z][a-z0-9_-]{1,63}$","maximum":64},"representationId":{"type":"string","pattern":"^[a-z][a-z0-9_-]{1,63}$","maximum":64},"contentItemVersion":{"type":"integer","minimum":1,"maximum":2147483647},"representationVersion":{"type":"integer","minimum":1,"maximum":2147483647},"identityProfileId":{"type":"string","pattern":"^[a-z][a-z0-9_-]{1,63}$","maximum":64},"identityProfileVersion":{"type":"integer","minimum":1,"maximum":2147483647}},"optional":[]},"sourceFingerprintProtocol":{"type":"union","choices":[{"type":"literal","value":1},{"type":"literal","value":2}]},"sourceContentHash":{"type":"string","pattern":"^[a-f0-9]{64}$","maximum":64},"retrievedAt":{"type":"timestamp"},"legalValidity":{"ref":"validity"}},"optional":[]},"observation":{"type":"object","properties":{"context":{"ref":"context"},"contextKey":{"type":"string","pattern":"^official-truth-context:v3:[a-f0-9]{64}$","maximum":90},"fact":{"type":"union","choices":[{"type":"object","properties":{"schema":{"type":"literal","value":1},"fact":{"ref":"fact1"}},"optional":[]},{"type":"object","properties":{"schema":{"type":"literal","value":2},"fact":{"ref":"fact2"}},"optional":[]}]},"evidence":{"ref":"evidence"}},"optional":[]},"conflict":{"type":"object","properties":{"reference":{"type":"string","pattern":"^source-conflict:v3:[a-f0-9]{64}$","maximum":83},"detectedDecisionRef":{"type":"string","pattern":"^source-decision:v3:[a-f0-9]{64}$","maximum":83},"detectedAt":{"type":"timestamp"},"primary":{"ref":"observation"},"counter":{"ref":"observation"},"resolution":{"type":"union","choices":[{"type":"null"},{"type":"object","properties":{"reference":{"type":"string","pattern":"^conflict-resolution:v3:[a-f0-9]{64}$","maximum":87},"predecessor":{"type":"union","choices":[{"type":"null"},{"type":"string","pattern":"^conflict-resolution:v3:[a-f0-9]{64}$","maximum":87}]},"conflictRef":{"type":"string","pattern":"^source-conflict:v3:[a-f0-9]{64}$","maximum":83},"method":{"type":"object","properties":{"methodId":{"type":"string","pattern":"^[a-z][a-z0-9_-]{1,63}$","maximum":64},"revision":{"type":"integer","minimum":1,"maximum":2147483647}},"optional":[]},"resolvedAt":{"type":"timestamp"},"legalAsOfDate":{"type":"date"},"basis":{"type":"enum","values":["corrected_publication","context_distinguished","legal_validity_changed"]},"observations":{"type":"array","items":{"ref":"observation"},"minimum":1,"maximum":2,"unique":false}},"optional":[]}]}},"optional":[]},"archive":{"type":"object","properties":{"schema":{"type":"literal","value":3},"kind":{"type":"literal","value":"resolved_conflict_archive_record"},"head":{"type":"object","properties":{"reference":{"type":"string","pattern":"^conflict-archive:v3:[a-f0-9]{64}$","maximum":84},"revision":{"type":"integer","minimum":1,"maximum":2147483647},"totalConflicts":{"type":"integer","minimum":1,"maximum":2147483647}},"optional":[]},"predecessor":{"type":"union","choices":[{"type":"null"},{"type":"object","properties":{"reference":{"type":"string","pattern":"^conflict-archive:v3:[a-f0-9]{64}$","maximum":84},"revision":{"type":"integer","minimum":1,"maximum":2147483647},"totalConflicts":{"type":"integer","minimum":1,"maximum":2147483647}},"optional":[]}]},"contextKey":{"type":"string","pattern":"^official-truth-context:v3:[a-f0-9]{64}$","maximum":90},"factKind":{"type":"enum","values":["requirement_effect","visa_options","stay_limit","passport_validity","blank_passport_pages","transit_conditions","temporal_rule"]},"fromDecisionRef":{"type":"string","pattern":"^source-decision:v3:[a-f0-9]{64}$","maximum":83},"archivedAt":{"type":"timestamp"},"entries":{"type":"array","items":{"ref":"conflict"},"minimum":1,"maximum":8,"unique":false}},"optional":[]},"decision":{"type":"object","properties":{"schema":{"type":"literal","value":3},"kind":{"type":"literal","value":"source_decision_record"},"reference":{"type":"string","pattern":"^source-decision:v3:[a-f0-9]{64}$","maximum":83},"predecessor":{"type":"union","choices":[{"type":"null"},{"type":"string","pattern":"^source-decision:v3:[a-f0-9]{64}$","maximum":83}]},"method":{"type":"object","properties":{"methodId":{"type":"string","pattern":"^[a-z][a-z0-9_-]{1,63}$","maximum":64},"revision":{"type":"integer","minimum":1,"maximum":2147483647}},"optional":[]},"context":{"ref":"context"},"contextKey":{"type":"string","pattern":"^official-truth-context:v3:[a-f0-9]{64}$","maximum":90},"factKind":{"type":"enum","values":["requirement_effect","visa_options","stay_limit","passport_validity","blank_passport_pages","transit_conditions","temporal_rule"]},"evaluatedAt":{"type":"timestamp"},"legalAsOfDate":{"type":"date"},"primary":{"type":"union","choices":[{"type":"object","properties":{"status":{"type":"literal","value":"clear"},"observation":{"ref":"observation"},"qualification":{"type":"object","properties":{"reference":{"type":"string","pattern":"^destination-qualification:v3:[a-f0-9]{64}$","maximum":93},"representedCountryCode":{"type":"country"},"role":{"type":"enum","values":["destination_authority","destination_border_police","destination_embassy"]},"method":{"type":"object","properties":{"methodId":{"type":"string","pattern":"^[a-z][a-z0-9_-]{1,63}$","maximum":64},"revision":{"type":"integer","minimum":1,"maximum":2147483647}},"optional":[]},"evidenceVersionId":{"type":"string","pattern":"^ev2_[a-f0-9]{32}$","maximum":36},"checkedAt":{"type":"timestamp"}},"optional":[]}},"optional":[]},{"type":"object","properties":{"status":{"type":"literal","value":"unclear"},"reason":{"type":"enum","values":["missing","ambiguous_statement","unqualified_destination_authority","invalid_or_unknown_validity"]},"evidence":{"type":"union","choices":[{"type":"null"},{"ref":"evidence"}]}},"optional":[]}]},"counterCheck":{"type":"object","properties":{"attemptPlanRevision":{"type":"integer","minimum":1,"maximum":2147483647},"attempts":{"type":"array","items":{"type":"union","choices":[{"type":"object","properties":{"status":{"type":"literal","value":"not_found"},"attemptedAt":{"type":"timestamp"},"source":{"type":"union","choices":[{"type":"null"},{"type":"object","properties":{"sourceId":{"type":"string","pattern":"^[a-z][a-z0-9_-]{1,63}$","maximum":64},"contentItemId":{"type":"string","pattern":"^[a-z][a-z0-9_-]{1,63}$","maximum":64},"representationId":{"type":"string","pattern":"^[a-z][a-z0-9_-]{1,63}$","maximum":64}},"optional":[]}]}},"optional":[]},{"type":"object","properties":{"status":{"type":"literal","value":"unreachable"},"attemptedAt":{"type":"timestamp"},"source":{"type":"object","properties":{"sourceId":{"type":"string","pattern":"^[a-z][a-z0-9_-]{1,63}$","maximum":64},"contentItemId":{"type":"string","pattern":"^[a-z][a-z0-9_-]{1,63}$","maximum":64},"representationId":{"type":"string","pattern":"^[a-z][a-z0-9_-]{1,63}$","maximum":64}},"optional":[]}},"optional":[]},{"type":"object","properties":{"status":{"type":"literal","value":"unclear"},"attemptedAt":{"type":"timestamp"},"source":{"type":"object","properties":{"sourceId":{"type":"string","pattern":"^[a-z][a-z0-9_-]{1,63}$","maximum":64},"contentItemId":{"type":"string","pattern":"^[a-z][a-z0-9_-]{1,63}$","maximum":64},"representationId":{"type":"string","pattern":"^[a-z][a-z0-9_-]{1,63}$","maximum":64}},"optional":[]}},"optional":[]},{"type":"object","properties":{"status":{"type":"literal","value":"not_applicable"},"attemptedAt":{"type":"timestamp"},"source":{"type":"object","properties":{"sourceId":{"type":"string","pattern":"^[a-z][a-z0-9_-]{1,63}$","maximum":64},"contentItemId":{"type":"string","pattern":"^[a-z][a-z0-9_-]{1,63}$","maximum":64},"representationId":{"type":"string","pattern":"^[a-z][a-z0-9_-]{1,63}$","maximum":64}},"optional":[]}},"optional":[]},{"type":"object","properties":{"status":{"type":"literal","value":"agrees"},"attemptedAt":{"type":"timestamp"},"comparisonRef":{"type":"string","pattern":"^source-comparison:v3:[a-f0-9]{64}$","maximum":85},"observation":{"ref":"observation"}},"optional":[]},{"type":"object","properties":{"status":{"type":"literal","value":"compatible"},"attemptedAt":{"type":"timestamp"},"comparisonRef":{"type":"string","pattern":"^source-comparison:v3:[a-f0-9]{64}$","maximum":85},"observation":{"ref":"observation"},"method":{"type":"object","properties":{"methodId":{"type":"string","pattern":"^[a-z][a-z0-9_-]{1,63}$","maximum":64},"revision":{"type":"integer","minimum":1,"maximum":2147483647}},"optional":[]},"reproof":{"type":"literal","value":"required_before_acceptance"}},"optional":[]},{"type":"object","properties":{"status":{"type":"literal","value":"conflicts"},"attemptedAt":{"type":"timestamp"},"comparisonRef":{"type":"string","pattern":"^source-comparison:v3:[a-f0-9]{64}$","maximum":85},"observation":{"ref":"observation"},"conflictRef":{"type":"string","pattern":"^source-conflict:v3:[a-f0-9]{64}$","maximum":83}},"optional":[]},{"type":"object","properties":{"status":{"type":"literal","value":"not_comparable"},"attemptedAt":{"type":"timestamp"},"comparisonRef":{"type":"string","pattern":"^source-comparison:v3:[a-f0-9]{64}$","maximum":85},"observation":{"ref":"observation"}},"optional":[]}]},"minimum":1,"maximum":8,"unique":false}},"optional":[]},"knownConflicts":{"type":"array","items":{"ref":"conflict"},"minimum":0,"maximum":8,"unique":false},"historyArchive":{"type":"union","choices":[{"type":"null"},{"type":"object","properties":{"reference":{"type":"string","pattern":"^conflict-archive:v3:[a-f0-9]{64}$","maximum":84},"revision":{"type":"integer","minimum":1,"maximum":2147483647},"totalConflicts":{"type":"integer","minimum":1,"maximum":2147483647}},"optional":[]}]},"conclusion":{"type":"enum","values":["clear_primary","primary_unclear","conditions_unresolved","comparable_conflict"]}},"optional":[]},"version":{"type":"object","properties":{"schema":{"type":"literal","value":3},"kind":{"type":"literal","value":"rule_version_record"},"reference":{"type":"string","pattern":"^rule-version:v3:[a-f0-9]{64}$","maximum":80},"revision":{"type":"integer","minimum":1,"maximum":2147483647},"predecessor":{"type":"union","choices":[{"type":"null"},{"type":"string","pattern":"^rule-version:v3:[a-f0-9]{64}$","maximum":80}]},"state":{"type":"literal","value":"accepted"},"method":{"type":"object","properties":{"methodId":{"type":"string","pattern":"^[a-z][a-z0-9_-]{1,63}$","maximum":64},"revision":{"type":"integer","minimum":1,"maximum":2147483647}},"optional":[]},"subject":{"ref":"observation"},"sourceDecisionRef":{"type":"string","pattern":"^source-decision:v3:[a-f0-9]{64}$","maximum":83},"operationId":{"type":"string","pattern":"^op3_[a-f0-9]{32}$","maximum":36},"recordedAt":{"type":"timestamp"}},"optional":[]},"transition":{"type":"object","properties":{"schema":{"type":"literal","value":3},"protocolRevision":{"type":"literal","value":1},"operationId":{"type":"string","pattern":"^op3_[a-f0-9]{32}$","maximum":36},"contextKey":{"type":"string","pattern":"^official-truth-context:v3:[a-f0-9]{64}$","maximum":90},"method":{"type":"object","properties":{"methodId":{"type":"string","pattern":"^[a-z][a-z0-9_-]{1,63}$","maximum":64},"revision":{"type":"integer","minimum":1,"maximum":2147483647}},"optional":[]},"factKind":{"type":"enum","values":["requirement_effect","visa_options","stay_limit","passport_validity","blank_passport_pages","transit_conditions","temporal_rule"]},"action":{"type":"enum","values":["accept","reaccept"]},"expected":{"type":"object","properties":{"revision":{"type":"integer","minimum":0,"maximum":2147483646},"state":{"type":"enum","values":["missing","accepted","withdrawn","conflicted"]},"versionRef":{"type":"union","choices":[{"type":"null"},{"type":"string","pattern":"^rule-version:v3:[a-f0-9]{64}$","maximum":80}]}},"optional":[]},"next":{"type":"object","properties":{"revision":{"type":"integer","minimum":1,"maximum":2147483647},"state":{"type":"literal","value":"accepted"},"versionRef":{"type":"string","pattern":"^rule-version:v3:[a-f0-9]{64}$","maximum":80}},"optional":[]},"primaryEvidenceVersionId":{"type":"string","pattern":"^ev2_[a-f0-9]{32}$","maximum":36},"sourceDecisionRef":{"type":"string","pattern":"^source-decision:v3:[a-f0-9]{64}$","maximum":83},"resolutionRefs":{"type":"array","items":{"type":"string","pattern":"^conflict-resolution:v3:[a-f0-9]{64}$","maximum":87},"minimum":0,"maximum":8,"unique":true},"recoverFromVersionRef":{"type":"null"},"invalidatedProjectionRefs":{"type":"array","items":{"type":"string","pattern":"^rule-projection:v3:[a-f0-9]{64}$","maximum":83},"minimum":0,"maximum":64,"unique":true},"reproof":{"type":"literal","value":"required_before_commit"},"commitConfirmation":{"type":"literal","value":"required"}},"optional":[]},"outcome":{"type":"union","choices":[{"type":"object","properties":{"status":{"type":"literal","value":"prepared"},"value":{"type":"object","properties":{"proposalDigest":{"type":"string","pattern":"^[a-f0-9]{64}$","maximum":64},"decision":{"ref":"decision"},"previousDecision":{"type":"union","choices":[{"type":"null"},{"ref":"decision"}]},"archiveAppend":{"type":"union","choices":[{"type":"null"},{"ref":"archive"}]},"version":{"ref":"version"},"transition":{"ref":"transition"},"proposalDisposition":{"type":"enum","values":["matched","superseded_by_source"]},"acceptance":{"type":"literal","value":"not_committed"},"reproof":{"type":"literal","value":"required_before_commit"}},"optional":[]}},"optional":[]},{"type":"object","properties":{"status":{"type":"literal","value":"escalation"},"key":{"type":"string","pattern":"^source-escalation:v3:[a-f0-9]{64}$","maximum":85},"reason":{"type":"enum","values":["primary_unclear","comparable_conflict"]},"decision":{"ref":"decision"},"previousDecision":{"type":"union","choices":[{"type":"null"},{"ref":"decision"}]},"archiveAppend":{"type":"union","choices":[{"type":"null"},{"ref":"archive"}]}},"optional":[]},{"type":"object","properties":{"status":{"type":"literal","value":"quarantined"},"reason":{"type":"enum","values":["conditions_unresolved","invalid_verification","history_changed","method_not_current"]}},"optional":[]},{"type":"object","properties":{"status":{"type":"literal","value":"unavailable"},"reason":{"type":"enum","values":["method_not_approved","method_unavailable","verification_unavailable","history_unavailable","aborted","temporary_failure"]}},"optional":[]}]},"audit":{"type":"object","properties":{"schema":{"type":"literal","value":3},"kind":{"type":"literal","value":"import_attempt_record"},"operationId":{"type":"string","pattern":"^op3_[a-f0-9]{32}$","maximum":36},"proposalDigest":{"type":"string","pattern":"^[a-f0-9]{64}$","maximum":64},"jobId":{"type":"string","pattern":"^job3_[a-f0-9]{32}$","maximum":37},"contextKey":{"type":"string","pattern":"^official-truth-context:v3:[a-f0-9]{64}$","maximum":90},"method":{"type":"object","properties":{"methodId":{"type":"string","pattern":"^[a-z][a-z0-9_-]{1,63}$","maximum":64},"revision":{"type":"integer","minimum":1,"maximum":2147483647}},"optional":[]},"recordedAt":{"type":"timestamp"},"result":{"type":"enum","values":["prepared","escalation","quarantined","unavailable"]},"decisionRef":{"type":"union","choices":[{"type":"null"},{"type":"string","pattern":"^source-decision:v3:[a-f0-9]{64}$","maximum":83}]},"escalationKey":{"type":"union","choices":[{"type":"null"},{"type":"string","pattern":"^source-escalation:v3:[a-f0-9]{64}$","maximum":85}]}},"optional":[]}}}$shape_json$::jsonb
$shape_function$;
-- S1_RETENTION_SHAPE_END

CREATE FUNCTION official_v3_result_private.data_nodes_v1(v jsonb, depth integer DEFAULT 0, max_depth integer DEFAULT 16, max_nodes integer DEFAULT 8192) RETURNS integer
LANGUAGE plpgsql IMMUTABLE SECURITY INVOKER SET search_path = pg_catalog AS $$
DECLARE child jsonb; n integer := 1; next_n integer;
BEGIN
  IF v IS NULL OR depth > max_depth THEN RETURN -1; END IF;
  IF jsonb_typeof(v) = 'object' THEN
    FOR child IN SELECT value FROM jsonb_each(v) LOOP
      next_n := official_v3_result_private.data_nodes_v1(child,depth+1,max_depth,max_nodes);
      IF next_n < 0 THEN RETURN -1; END IF;
      n := n + 1 + next_n;
      IF n > max_nodes THEN RETURN -1; END IF;
    END LOOP;
  ELSIF jsonb_typeof(v) = 'array' THEN
    FOR child IN SELECT value FROM jsonb_array_elements(v) LOOP
      next_n := official_v3_result_private.data_nodes_v1(child,depth+1,max_depth,max_nodes);
      IF next_n < 0 THEN RETURN -1; END IF;
      n := n + next_n;
      IF n > max_nodes THEN RETURN -1; END IF;
    END LOOP;
  END IF;
  RETURN n;
END $$;

-- Fixed finite reader. Only private functions can supply a shape. There is no
-- dynamic SQL, registry copy, URL whitelist shortcut or acceptance authority.
CREATE FUNCTION official_v3_result_private.shape_matches_v1(v jsonb, s jsonb, defs jsonb, countries jsonb, depth integer DEFAULT 0) RETURNS boolean
LANGUAGE plpgsql IMMUTABLE SECURITY INVOKER SET search_path = pg_catalog AS $$
DECLARE item record; child jsonb; scalar text; normalized text; typ text; count_n integer;
BEGIN
  IF v IS NULL OR s IS NULL OR depth > 24 THEN RETURN false; END IF;
  IF s ? 'ref' THEN
    RETURN official_v3_result_private.shape_matches_v1(v, defs->(s->>'ref'), defs, countries, depth);
  END IF;
  typ := s->>'type';
  IF typ = 'literal' THEN RETURN v = s->'value'; END IF;
  IF typ = 'null' THEN RETURN v = 'null'::jsonb; END IF;
  IF typ = 'boolean' THEN RETURN jsonb_typeof(v) = 'boolean'; END IF;
  IF typ = 'integer' THEN
    IF jsonb_typeof(v) <> 'number' THEN RETURN false; END IF;
    RETURN (v::text)::numeric = trunc((v::text)::numeric) AND (v::text)::numeric BETWEEN (s->>'minimum')::numeric AND (s->>'maximum')::numeric;
  END IF;
  IF typ IN ('string','enum','country','date','timestamp') THEN
    IF jsonb_typeof(v) <> 'string' THEN RETURN false; END IF;
    scalar := v #>> '{}';
    IF typ = 'enum' THEN RETURN (s->'values') @> jsonb_build_array(scalar); END IF;
    IF typ = 'string' THEN RETURN length(scalar) <= (s->>'maximum')::integer AND scalar ~ (s->>'pattern'); END IF;
    IF typ = 'country' THEN
      -- Same bounded ECMA whitespace trim/uppercase as the existing country reader.
      normalized := upper(btrim(scalar, chr(9)||chr(10)||chr(11)||chr(12)||chr(13)||chr(32)||chr(160)||chr(5760)||chr(8192)||chr(8193)||chr(8194)||chr(8195)||chr(8196)||chr(8197)||chr(8198)||chr(8199)||chr(8200)||chr(8201)||chr(8202)||chr(8232)||chr(8233)||chr(8239)||chr(8287)||chr(12288)||chr(65279)));
      RETURN length(scalar) <= 8 AND countries @> jsonb_build_array(normalized);
    END IF;
    IF typ = 'date' THEN
      IF scalar !~ '^[0-9]{4}-[0-9]{2}-[0-9]{2}$' THEN RETURN false; END IF;
      RETURN to_char(scalar::date,'YYYY-MM-DD') = scalar;
    END IF;
    IF scalar !~ '^[0-9]{4}-[0-9]{2}-[0-9]{2}T[0-9]{2}:[0-9]{2}:[0-9]{2}\.[0-9]{3}Z$' THEN RETURN false; END IF;
    RETURN to_char(scalar::timestamptz AT TIME ZONE 'UTC','YYYY-MM-DD"T"HH24:MI:SS.MS"Z"') = scalar;
  END IF;
  IF typ = 'union' THEN
    FOR child IN SELECT value FROM jsonb_array_elements(s->'choices') LOOP
      IF official_v3_result_private.shape_matches_v1(v,child,defs,countries,depth) IS TRUE THEN RETURN true; END IF;
    END LOOP;
    RETURN false;
  END IF;
  IF typ = 'array' THEN
    IF jsonb_typeof(v) <> 'array' THEN RETURN false; END IF;
    count_n := jsonb_array_length(v);
    IF count_n NOT BETWEEN (s->>'minimum')::integer AND (s->>'maximum')::integer THEN RETURN false; END IF;
    IF s->'unique' = 'true'::jsonb AND (SELECT count(DISTINCT value) FROM jsonb_array_elements(v)) <> count_n THEN RETURN false; END IF;
    FOR child IN SELECT value FROM jsonb_array_elements(v) LOOP
      IF official_v3_result_private.shape_matches_v1(child,s->'items',defs,countries,depth+1) IS NOT TRUE THEN RETURN false; END IF;
    END LOOP;
    RETURN true;
  END IF;
  IF typ = 'object' THEN
    IF jsonb_typeof(v) <> 'object' THEN RETURN false; END IF;
    IF EXISTS (SELECT 1 FROM jsonb_object_keys(v) k WHERE NOT (s->'properties' ? k)) THEN RETURN false; END IF;
    FOR item IN SELECT key,value FROM jsonb_each(s->'properties') LOOP
      IF NOT (v ? item.key) THEN
        IF NOT (s->'optional' ? item.key) THEN RETURN false; END IF;
      ELSIF official_v3_result_private.shape_matches_v1(v->item.key,item.value,defs,countries,depth+1) IS NOT TRUE THEN RETURN false;
      END IF;
    END LOOP;
    RETURN true;
  END IF;
  RETURN false;
EXCEPTION WHEN invalid_datetime_format OR datetime_field_overflow OR invalid_text_representation OR numeric_value_out_of_range THEN RETURN false;
END $$;

CREATE FUNCTION official_v3_result_private.proposal_retainable_v1(v jsonb) RETURNS boolean
LANGUAGE plpgsql IMMUTABLE SECURITY INVOKER SET search_path = pg_catalog AS $$
DECLARE shape jsonb := official_v3_result_private.proposal_shape_v1();
BEGIN
  IF official_v3_result_private.data_nodes_v1(v) < 0 THEN RETURN false; END IF;
  RETURN official_v3_result_private.shape_matches_v1(v,shape->'definitions'->(shape->>'root'),shape->'definitions',shape->'countries');
END $$;

CREATE FUNCTION official_v3_result_private.validate_s1_copy_v1(reply jsonb,job jsonb,result jsonb,purpose text) RETURNS void
LANGUAGE plpgsql VOLATILE PARALLEL UNSAFE SECURITY INVOKER CALLED ON NULL INPUT SET search_path=pg_catalog,pg_temp AS $$
DECLARE row_value jsonb:=reply->'record'; ref jsonb; b jsonb; p jsonb; raw json; identity jsonb; outcome jsonb; audit jsonb; decision jsonb;
  previous jsonb; archive jsonb; expected_ref text; expected_escalation text; conflict jsonb; retained jsonb; removed jsonb:='[]'; entry_value jsonb; method jsonb:=COALESCE(job->'method',job#>'{identity,method}');
BEGIN
  IF purpose NOT IN ('prepare','read','complete') OR official_v3_result_private.exact_keys_v1(reply,ARRAY['status','record']) IS NOT TRUE OR reply->>'status' IS DISTINCT FROM 'recorded'
    OR official_v3_result_private.exact_keys_v1(row_value,ARRAY['reference','text','outcome','audit']) IS NOT TRUE
    OR jsonb_typeof(row_value->'text') IS DISTINCT FROM 'string' THEN RAISE EXCEPTION 'm04 S1 proof unavailable' USING ERRCODE='P7604'; END IF;
  ref:=official_v3_result_private.reference_v1(row_value->'reference'); b:=ref->'binding'; raw:=(row_value->>'text')::json;
  IF official_v3_result_private.unique_json_v1(raw,0) IS NOT TRUE OR octet_length(row_value->>'text')<>(ref->>'bytes')::integer
    OR encode(sha256(convert_to(row_value->>'text','UTF8')),'hex')<>ref->>'proposalDigest' THEN RAISE EXCEPTION 'm04 S1 bytes mismatch' USING ERRCODE='P7604'; END IF;
  p:=raw::jsonb;
  IF official_v3_result_private.s1_shape_v1(p,'proposal') IS NOT TRUE OR official_v3_result_private.nodes_v1(p,0,16,8192)<0
    OR p->'operationId' IS DISTINCT FROM b->'operationId' OR p->'jobId' IS DISTINCT FROM b->'jobId'
    OR p->'contextKey' IS DISTINCT FROM b->'contextKey' OR p->'jobId' IS DISTINCT FROM job->'jobId'
    OR b->'method' IS DISTINCT FROM method THEN RAISE EXCEPTION 'm04 S1 binding mismatch' USING ERRCODE='P7604'; END IF;
  -- Semantically integral ORIGINAL numbers may be spelled 18.0 or 18e0.
  -- Normalize only the local identity DTO after full actual S1 shape validation;
  -- neither original bytes, their digest nor proposedFact are rewritten.
  p:=jsonb_set(jsonb_set(p,'{context}',official_v3_result_private.canonical_v1(p->'context',0)::jsonb),
    '{research}',official_v3_result_private.canonical_v1(p->'research',0)::jsonb);
  identity:=official_v3_result_private.subject_v1('rule_research',jsonb_build_object('context',p->'context','method',method,
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
  IF official_v3_result_private.s1_shape_v1(outcome,'outcome') IS NOT TRUE OR official_v3_result_private.s1_shape_v1(audit,'audit') IS NOT TRUE
    OR official_v3_result_private.exact_keys_v1(audit,ARRAY['schema','kind','operationId','proposalDigest','jobId','contextKey','method','recordedAt','result','decisionRef','escalationKey']) IS NOT TRUE
    OR audit->'schema' IS DISTINCT FROM '3'::jsonb OR audit->>'kind' IS DISTINCT FROM 'import_attempt_record'
    OR audit->'operationId' IS DISTINCT FROM b->'operationId' OR audit->'jobId' IS DISTINCT FROM b->'jobId'
    OR audit->'contextKey' IS DISTINCT FROM b->'contextKey' OR audit->'method' IS DISTINCT FROM method
    OR audit->'proposalDigest' IS DISTINCT FROM ref->'proposalDigest' OR audit->'result' IS DISTINCT FROM outcome->'status' THEN RAISE EXCEPTION 'm04 S1 outcome mismatch' USING ERRCODE='P7604'; END IF;
  PERFORM official_v3_result_private.timestamp_v1(audit->>'recordedAt');
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
    expected_ref:='source-decision:v3:'||encode(sha256(convert_to(official_v3_result_private.canonical_v1(jsonb_build_object('operationId',p->'operationId',
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
      SELECT 'source-escalation:v3:'||encode(sha256(convert_to(official_v3_result_private.canonical_v1(jsonb_build_object(
        'contextKey',decision->'contextKey','factKind',decision->'factKind','method',decision->'method','reason',decision->'conclusion',
        'conflicts',COALESCE(jsonb_agg(value->>'reference' ORDER BY value->>'reference' COLLATE "C"),'[]'::jsonb)),0),'UTF8')),'hex') INTO expected_escalation
        FROM jsonb_array_elements(decision->'knownConflicts') WHERE value->'resolution'='null'::jsonb;
      IF outcome->>'key' IS DISTINCT FROM expected_escalation OR outcome->'reason' IS DISTINCT FROM decision->'conclusion' THEN RAISE EXCEPTION 'm04 escalation mismatch' USING ERRCODE='P7604'; END IF;
    END IF;
  END IF;
  IF audit->>'decisionRef' IS DISTINCT FROM decision->>'reference' OR audit->>'escalationKey' IS DISTINCT FROM expected_escalation THEN RAISE EXCEPTION 'm04 S1 audit mismatch' USING ERRCODE='P7604'; END IF;
END $$;



-- HRS owns only these twelve finite tables. Records and original bytes are append-only.
CREATE TABLE official_v3_result_private.binding_v1(
 singleton boolean PRIMARY KEY CHECK(singleton), binding jsonb NOT NULL, binding_hash text NOT NULL UNIQUE,
 creator_oid oid NOT NULL, catalog jsonb NOT NULL);
CREATE TABLE official_v3_result_private.originals_v1(
 version_id text PRIMARY KEY, evidence jsonb NOT NULL, body_text text NOT NULL, raw_digest text NOT NULL,
 CHECK(octet_length(body_text) BETWEEN 1 AND 131072 AND raw_digest ~ '^[a-f0-9]{64}$'));
CREATE TABLE official_v3_result_private.extractions_v1(
 version_id text PRIMARY KEY REFERENCES official_v3_result_private.originals_v1(version_id),
 record jsonb NOT NULL);
CREATE TABLE official_v3_result_private.qualifications_v1(
 reference text PRIMARY KEY, kind text NOT NULL CHECK(kind IN ('verification','observation')), record jsonb NOT NULL,
 digest text NOT NULL, decision_ref text, decision_content_key text, valid_until timestamptz NOT NULL,
 original_ids jsonb NOT NULL, UNIQUE(kind,decision_content_key),
 CHECK(isfinite(valid_until) AND digest ~ '^[a-f0-9]{64}$' AND jsonb_typeof(original_ids)='array'));
CREATE TABLE official_v3_result_private.decisions_v1(
 reference text PRIMARY KEY, predecessor_ref text REFERENCES official_v3_result_private.decisions_v1(reference),
 record jsonb NOT NULL, archive_ref text, verification_ref text NOT NULL REFERENCES official_v3_result_private.qualifications_v1(reference));
CREATE TABLE official_v3_result_private.archive_pages_v1(
 reference text PRIMARY KEY, predecessor_ref text REFERENCES official_v3_result_private.archive_pages_v1(reference),
 revision integer NOT NULL UNIQUE CHECK(revision>0), record jsonb NOT NULL);
CREATE TABLE official_v3_result_private.versions_v1(
 reference text PRIMARY KEY, revision integer NOT NULL UNIQUE CHECK(revision>0),
 predecessor_ref text REFERENCES official_v3_result_private.versions_v1(reference),
 decision_ref text NOT NULL REFERENCES official_v3_result_private.decisions_v1(reference),
 verification_ref text NOT NULL REFERENCES official_v3_result_private.qualifications_v1(reference),
 prepared jsonb NOT NULL, committed_at timestamptz NOT NULL CHECK(isfinite(committed_at)));
CREATE TABLE official_v3_result_private.projections_v1(
 reference text PRIMARY KEY, version_ref text NOT NULL REFERENCES official_v3_result_private.versions_v1(reference),
 verification_ref text NOT NULL REFERENCES official_v3_result_private.qualifications_v1(reference),
 record jsonb NOT NULL, suppression_epoch bigint NOT NULL CHECK(suppression_epoch>=0),
 published_at timestamptz NOT NULL CHECK(isfinite(published_at)));
CREATE TABLE official_v3_result_private.heads_v1(
 singleton boolean PRIMARY KEY CHECK(singleton), context_key text NOT NULL UNIQUE,
 version_ref text REFERENCES official_v3_result_private.versions_v1(reference),
 decision_ref text REFERENCES official_v3_result_private.decisions_v1(reference),
 sticky_decision_ref text REFERENCES official_v3_result_private.decisions_v1(reference),
 projection_ref text REFERENCES official_v3_result_private.projections_v1(reference),
 suppression jsonb NOT NULL, suppression_epoch bigint NOT NULL CHECK(suppression_epoch>=0),
 generation bigint NOT NULL CHECK(generation>=0), coverage boolean NOT NULL);
CREATE TABLE official_v3_result_private.operations_v1(
 operation_kind text NOT NULL CHECK(operation_kind IN ('version','publication','escalation','suppression','monitor_claim','monitor_finish')),
 operation_id text NOT NULL, operation_key text NOT NULL, command_digest text NOT NULL, command jsonb NOT NULL,
 result jsonb NOT NULL, head_generation bigint NOT NULL CHECK(head_generation>=0),
 recorded_at timestamptz NOT NULL CHECK(isfinite(recorded_at)), PRIMARY KEY(operation_kind,operation_id));
CREATE TABLE official_v3_result_private.outbox_v1(
 escalation_key text PRIMARY KEY, decision_ref text NOT NULL REFERENCES official_v3_result_private.decisions_v1(reference),
 operation_kind text NOT NULL, operation_id text NOT NULL, record jsonb NOT NULL,
 recorded_at timestamptz NOT NULL CHECK(isfinite(recorded_at)),
 FOREIGN KEY(operation_kind,operation_id) REFERENCES official_v3_result_private.operations_v1(operation_kind,operation_id));
CREATE TABLE official_v3_result_private.monitor_schedule_v1(
 singleton boolean PRIMARY KEY CHECK(singleton), generation bigint NOT NULL CHECK(generation>=0),
 claimed_by text, claim_operation text, next_check_at timestamptz NOT NULL CHECK(isfinite(next_check_at)),
 lease_until timestamptz, outcomes jsonb NOT NULL, finish_operation text,
 CHECK((claimed_by IS NULL)=(lease_until IS NULL) AND (lease_until IS NULL OR isfinite(lease_until))));
CREATE FUNCTION official_v3_result_private.immutable_v1() RETURNS trigger
LANGUAGE plpgsql VOLATILE PARALLEL UNSAFE SECURITY INVOKER CALLED ON NULL INPUT SET search_path=pg_catalog AS $$
BEGIN
 IF TG_OP='UPDATE' AND TG_TABLE_SCHEMA='official_v3_result_private' THEN
  IF TG_TABLE_NAME='heads_v1'
   AND (to_jsonb(OLD)-ARRAY['version_ref','decision_ref','sticky_decision_ref','projection_ref','suppression','suppression_epoch','generation','coverage'])
    =(to_jsonb(NEW)-ARRAY['version_ref','decision_ref','sticky_decision_ref','projection_ref','suppression','suppression_epoch','generation','coverage'])
   AND (to_jsonb(NEW)->>'generation')::bigint>(to_jsonb(OLD)->>'generation')::bigint
   AND (to_jsonb(NEW)->>'suppression_epoch')::bigint>=(to_jsonb(OLD)->>'suppression_epoch')::bigint THEN RETURN NEW;
  ELSIF TG_TABLE_NAME='monitor_schedule_v1'
   AND to_jsonb(OLD)->'singleton'=to_jsonb(NEW)->'singleton'
   AND (to_jsonb(NEW)->>'generation')::bigint>=(to_jsonb(OLD)->>'generation')::bigint THEN RETURN NEW;
  END IF;
 END IF;
 RAISE EXCEPTION 'hrs1 immutable history' USING ERRCODE='P7803';
END $$;
CREATE FUNCTION official_v3_result_private.hash_v1(v jsonb) RETURNS text
LANGUAGE sql IMMUTABLE PARALLEL UNSAFE SECURITY INVOKER CALLED ON NULL INPUT SET search_path=pg_catalog AS $$
 SELECT encode(sha256(convert_to(official_v3_result_private.canonical_v1(v,0),'UTF8')),'hex')
$$;
CREATE FUNCTION official_v3_result_private.ref_v1(kind text,v jsonb) RETURNS text
LANGUAGE sql IMMUTABLE PARALLEL UNSAFE SECURITY INVOKER CALLED ON NULL INPUT SET search_path=pg_catalog AS $$
 SELECT kind||':v3:'||official_v3_result_private.hash_v1(v)
$$;
CREATE FUNCTION official_v3_result_private.time_text_v1(v timestamptz) RETURNS text
LANGUAGE sql IMMUTABLE PARALLEL UNSAFE SECURITY INVOKER CALLED ON NULL INPUT SET search_path=pg_catalog AS $$
 SELECT to_char(v AT TIME ZONE 'UTC','YYYY-MM-DD"T"HH24:MI:SS.MS"Z"')
$$;
CREATE FUNCTION official_v3_result_private.s1_shape_v1(v jsonb,tag text) RETURNS boolean
LANGUAGE sql IMMUTABLE PARALLEL UNSAFE SECURITY INVOKER CALLED ON NULL INPUT SET search_path=pg_catalog AS $$
 SELECT official_v3_result_private.safe_data_v1(v,0) AND
 CASE WHEN tag='proposal' THEN official_v3_result_private.proposal_retainable_v1(v)
 WHEN tag='outcome' THEN octet_length(v::text)<=524288 AND official_v3_result_private.data_nodes_v1(v,0,24,65536)>=0
   AND official_v3_result_private.shape_matches_v1(v,official_v3_result_private.proposal_shape_v1()->'definitions'->'outcome',
    official_v3_result_private.proposal_shape_v1()->'definitions',official_v3_result_private.proposal_shape_v1()->'countries',0)
 WHEN tag='audit' THEN octet_length(v::text)<=8192 AND official_v3_result_private.data_nodes_v1(v,0,16,8192)>=0
   AND official_v3_result_private.shape_matches_v1(v,official_v3_result_private.proposal_shape_v1()->'definitions'->'audit',
    official_v3_result_private.proposal_shape_v1()->'definitions',official_v3_result_private.proposal_shape_v1()->'countries',0)
 ELSE false END
$$;
CREATE FUNCTION official_v3_result_private.record_shape_v1(v jsonb,tag text) RETURNS boolean
LANGUAGE sql IMMUTABLE PARALLEL UNSAFE SECURITY INVOKER CALLED ON NULL INPUT SET search_path=pg_catalog AS $$
 SELECT octet_length(v::text)<=65536 AND official_v3_result_private.safe_data_v1(v,0)
  AND official_v3_result_private.data_nodes_v1(v,0,24,65536)>=0
  AND official_v3_result_private.shape_matches_v1(v,official_v3_result_private.proposal_shape_v1()->'definitions'->tag,
   official_v3_result_private.proposal_shape_v1()->'definitions',official_v3_result_private.proposal_shape_v1()->'countries',0)
$$;
CREATE FUNCTION official_v3_result_private.binding_valid_v1(b jsonb) RETURNS boolean
LANGUAGE plpgsql STABLE PARALLEL UNSAFE SECURITY INVOKER CALLED ON NULL INPUT SET search_path=pg_catalog AS $$
DECLARE source_value jsonb; sources_seen text[]:='{}'; primary_count integer:=0; identity jsonb; method_value jsonb; item_key text;
BEGIN
 IF official_v3_result_private.exact_keys_v1(b,ARRAY['schema','qualificationScope','context','contextKey','factKind','methodId','revision',
  'methodDigest','packageDigest','dataMode','legalTimeZone','activeFrom','activeUntilExclusive','sourceMaxAgeMilliseconds',
  'projectionMaxAgeMilliseconds','monitorIntervalMilliseconds','monitorLeaseMilliseconds','attemptLimit','sources']) IS NOT TRUE
  OR octet_length(b::text)>65536 OR b->'schema' IS DISTINCT FROM '1'::jsonb
  OR b->>'qualificationScope' IS DISTINCT FROM 'global_context' OR b->>'factKind' IS DISTINCT FROM 'requirement_effect'
  OR (b->>'dataMode' IN ('synthetic_test','official_projection')) IS NOT TRUE
  OR b#>>'{context,scope,destinationCountryCode}' IS DISTINCT FROM 'DE'
  OR b#>'{context,scope,citizenship,countryCodes}' IS DISTINCT FROM '["CH"]'::jsonb
  OR b#>>'{context,scope,requirementType}' IS DISTINCT FROM 'visa'
  OR b#>>'{context,route}'='unresolved' OR b#>>'{context,conditions,status}'='unresolved'
  OR (b#>>'{context,scope,credentialOption,mode}'='option' AND
   (b#>>'{context,scope,credentialOption,documentType}'='unknown' OR b#>>'{context,scope,credentialOption,relatedCitizenshipCountryCode}' IS DISTINCT FROM 'CH'))
  OR (b->>'methodId' ~ '^[a-z][a-z0-9_-]{1,63}$') IS NOT TRUE
  OR (b->>'revision' ~ '^[1-9][0-9]{0,9}$') IS NOT TRUE OR (b->>'revision')::numeric>2147483647
  OR (b->>'methodDigest' ~ '^[a-f0-9]{64}$') IS NOT TRUE OR (b->>'packageDigest' ~ '^[a-f0-9]{64}$') IS NOT TRUE
  OR (b->>'legalTimeZone' ~ '^[A-Za-z][A-Za-z0-9_+/-]*$') IS NOT TRUE OR length(b->>'legalTimeZone')>64
  OR NOT EXISTS(SELECT 1 FROM pg_catalog.pg_timezone_names z WHERE z.name=b->>'legalTimeZone')
  OR official_v3_result_private.timestamp_v1(b->>'activeUntilExclusive')<=official_v3_result_private.timestamp_v1(b->>'activeFrom')
  OR jsonb_typeof(b->'sources') IS DISTINCT FROM 'array' OR jsonb_array_length(b->'sources') NOT BETWEEN 1 AND 8 THEN RETURN false; END IF;
 FOREACH item_key IN ARRAY ARRAY['sourceMaxAgeMilliseconds','projectionMaxAgeMilliseconds','monitorIntervalMilliseconds','monitorLeaseMilliseconds','attemptLimit'] LOOP
  IF jsonb_typeof(b->item_key) IS DISTINCT FROM 'number' OR (b->>item_key ~ '^[1-9][0-9]{0,8}$') IS NOT TRUE THEN RETURN false; END IF;
 END LOOP;
 IF (b->>'sourceMaxAgeMilliseconds')::integer>86400000
  OR (b->>'projectionMaxAgeMilliseconds')::integer>LEAST(3600000,(b->>'sourceMaxAgeMilliseconds')::integer)
  OR (b->>'monitorIntervalMilliseconds')::integer>(b->>'sourceMaxAgeMilliseconds')::integer
  OR (b->>'monitorLeaseMilliseconds')::integer>30000 OR (b->>'attemptLimit')::integer>16 THEN RETURN false; END IF;
 method_value:=jsonb_build_object('methodId',b->'methodId','revision',b->'revision');
 identity:=official_v3_result_private.subject_v1('rule_research',jsonb_build_object('context',b->'context','method',method_value,
  'factKind',b->'factKind','researchReason',jsonb_build_object('status','missing')));
 IF identity->'contextKey' IS DISTINCT FROM b->'contextKey' OR (identity->>'subjectText')::jsonb->'context' IS DISTINCT FROM official_v3_result_private.context_v1(b->'context') THEN RETURN false; END IF;
 FOR source_value IN SELECT value FROM jsonb_array_elements(b->'sources') LOOP
  IF official_v3_result_private.exact_keys_v1(source_value,ARRAY['source','canonicalUrl','contentType','executableDigest','qualificationDigest','role']) IS NOT TRUE
   OR official_v3_result_private.exact_keys_v1(source_value->'source',ARRAY['sourceId','contentItemId','representationId','contentItemVersion','representationVersion','identityProfileId','identityProfileVersion']) IS NOT TRUE THEN
   RETURN false;
  END IF;
  IF official_v3_result_private.shape_matches_v1(source_value->'source',official_v3_result_private.proposal_shape_v1()->'definitions'->'evidence'->'properties'->'source',official_v3_result_private.proposal_shape_v1()->'definitions',official_v3_result_private.proposal_shape_v1()->'countries',0) IS NOT TRUE
   OR (source_value->>'role' IN ('primary','counter')) IS NOT TRUE
   OR (source_value->>'executableDigest' ~ '^[a-f0-9]{64}$') IS NOT TRUE
   OR (source_value->>'qualificationDigest' ~ '^[a-f0-9]{64}$') IS NOT TRUE
   OR (source_value->>'contentType' IN ('text/html','application/pdf','text/plain','application/json')) IS NOT TRUE
   OR (source_value->>'canonicalUrl' ~ '^https://[A-Za-z0-9.-]+(/[^#]*)?$') IS NOT TRUE
   OR (b->>'dataMode'='synthetic_test' AND (source_value->>'canonicalUrl' ~ '^https://[A-Za-z0-9.-]+[.]example(/[^#]*)?$') IS NOT TRUE) THEN RETURN false; END IF;
  item_key:=official_v3_result_private.hash_v1(source_value->'source');
  IF item_key=ANY(sources_seen) THEN RETURN false; END IF;
  sources_seen:=array_append(sources_seen,item_key);
  IF source_value->>'role'='primary' THEN primary_count:=primary_count+1; END IF;
 END LOOP;
 RETURN primary_count=1;
END $$;


-- Full actual object metadata; no row contents, credentials or caller-supplied catalog.
-- The one installer-owned SET edge is excluded from the stored snapshot and
-- independently forbidden by assert_catalog_v1 after installation.
CREATE FUNCTION official_v3_result_private.catalog_v1() RETURNS jsonb
LANGUAGE sql STABLE PARALLEL UNSAFE SECURITY INVOKER CALLED ON NULL INPUT SET search_path=pg_catalog SET jit=off AS $catalog$
WITH ns AS (
 SELECT n.oid,n.nspname FROM pg_catalog.pg_namespace n WHERE n.nspname IN ('official_v3_result_private','official_v3_result_api')
), tabs AS (
 SELECT c.oid,c.reltoastrelid FROM pg_catalog.pg_class c JOIN ns n ON n.oid=c.relnamespace WHERE c.relkind='r'
), classes AS (
 SELECT c.oid FROM pg_catalog.pg_class c JOIN ns n ON n.oid=c.relnamespace
 UNION SELECT t.reltoastrelid FROM tabs t WHERE t.reltoastrelid<>0
 UNION SELECT i.indexrelid FROM pg_catalog.pg_index i JOIN tabs t ON i.indrelid=t.reltoastrelid WHERE t.reltoastrelid<>0
), objects AS (
 SELECT 'pg_catalog.pg_namespace'::pg_catalog.regclass::oid AS classid,n.oid AS objid FROM ns n
 UNION SELECT 'pg_catalog.pg_class'::pg_catalog.regclass,c.oid FROM classes c
 UNION SELECT 'pg_catalog.pg_type'::pg_catalog.regclass,t.oid FROM pg_catalog.pg_type t JOIN ns n ON n.oid=t.typnamespace
 UNION SELECT 'pg_catalog.pg_proc'::pg_catalog.regclass,p.oid FROM pg_catalog.pg_proc p JOIN ns n ON n.oid=p.pronamespace
 UNION SELECT 'pg_catalog.pg_constraint'::pg_catalog.regclass,c.oid FROM pg_catalog.pg_constraint c JOIN tabs t ON t.oid=c.conrelid
 UNION SELECT 'pg_catalog.pg_trigger'::pg_catalog.regclass,g.oid FROM pg_catalog.pg_trigger g JOIN tabs t ON t.oid=g.tgrelid
 UNION SELECT 'pg_catalog.pg_policy'::pg_catalog.regclass,p.oid FROM pg_catalog.pg_policy p JOIN tabs t ON t.oid=p.polrelid
 UNION SELECT 'pg_catalog.pg_attrdef'::pg_catalog.regclass,d.oid FROM pg_catalog.pg_attrdef d JOIN tabs t ON t.oid=d.adrelid
), role_ids AS (
 SELECT r.oid FROM pg_catalog.pg_roles r WHERE r.rolname IN ('ot_v3_result_owner','ot_v3_result_writer','ot_v3_result_reader','ot_v3_result_verifier')
), prerequisite_ns AS (
 SELECT n.oid FROM pg_catalog.pg_namespace n WHERE n.nspname IN
  ('jetnity_ot_auth','official_v3_method_private','official_v3_method_api','official_v3_intake_private','official_v3_intake_api')
), proc_attribute_inventory AS (
 SELECT array_agg(a.attnum ORDER BY a.attnum)=ARRAY[1,2,3,4,5,6,7,8,9,10,11,12,13,14,15,16,17,18,19,20,21,22,23,24,25,26,27,28,29,30]::pg_catalog.int2[]
   AND array_agg(a.attname::text ORDER BY a.attnum)=ARRAY[
    'oid','proname','pronamespace','proowner','prolang',
    'procost','prorows','provariadic','prosupport','prokind',
    'prosecdef','proleakproof','proisstrict','proretset','provolatile',
    'proparallel','pronargs','pronargdefaults','prorettype','proargtypes',
    'proallargtypes','proargmodes','proargnames','proargdefaults','protrftypes',
    'prosrc','probin','prosqlbody','proconfig','proacl']::text[]
   AND array_agg(a.atttypid ORDER BY a.attnum)=ARRAY[
    'pg_catalog.oid'::pg_catalog.regtype::oid,'pg_catalog.name'::pg_catalog.regtype::oid,'pg_catalog.oid'::pg_catalog.regtype::oid,
    'pg_catalog.oid'::pg_catalog.regtype::oid,'pg_catalog.oid'::pg_catalog.regtype::oid,'pg_catalog.float4'::pg_catalog.regtype::oid,
    'pg_catalog.float4'::pg_catalog.regtype::oid,'pg_catalog.oid'::pg_catalog.regtype::oid,'pg_catalog.regproc'::pg_catalog.regtype::oid,
    'pg_catalog."char"'::pg_catalog.regtype::oid,'pg_catalog.bool'::pg_catalog.regtype::oid,'pg_catalog.bool'::pg_catalog.regtype::oid,
    'pg_catalog.bool'::pg_catalog.regtype::oid,'pg_catalog.bool'::pg_catalog.regtype::oid,'pg_catalog."char"'::pg_catalog.regtype::oid,
    'pg_catalog."char"'::pg_catalog.regtype::oid,'pg_catalog.int2'::pg_catalog.regtype::oid,'pg_catalog.int2'::pg_catalog.regtype::oid,
    'pg_catalog.oid'::pg_catalog.regtype::oid,'pg_catalog.oidvector'::pg_catalog.regtype::oid,'pg_catalog.oid[]'::pg_catalog.regtype::oid,
    'pg_catalog."char"[]'::pg_catalog.regtype::oid,'pg_catalog.text[]'::pg_catalog.regtype::oid,'pg_catalog.pg_node_tree'::pg_catalog.regtype::oid,
    'pg_catalog.oid[]'::pg_catalog.regtype::oid,'pg_catalog.text'::pg_catalog.regtype::oid,'pg_catalog.text'::pg_catalog.regtype::oid,
    'pg_catalog.pg_node_tree'::pg_catalog.regtype::oid,'pg_catalog.text[]'::pg_catalog.regtype::oid,'pg_catalog.aclitem[]'::pg_catalog.regtype::oid]
   AND bool_and(a.attisdropped IS FALSE) AS matches_pg17
 FROM pg_catalog.pg_attribute a
 WHERE a.attrelid='pg_catalog.pg_proc'::pg_catalog.regclass AND a.attnum>0
)
SELECT CASE WHEN (SELECT matches_pg17 FROM proc_attribute_inventory) IS TRUE THEN jsonb_build_object(
 'database',(SELECT to_jsonb(d)-ARRAY['datfrozenxid','datminmxid'] FROM pg_catalog.pg_database d WHERE d.datname=current_database()),
 'creator',(SELECT to_jsonb(r) FROM pg_catalog.pg_roles r WHERE r.rolname='postgres'),
 'namespaces',(SELECT jsonb_agg(to_jsonb(n) ORDER BY n.oid) FROM pg_catalog.pg_namespace n JOIN ns s ON s.oid=n.oid),
 'roles',(SELECT jsonb_agg(to_jsonb(r) ORDER BY r.oid) FROM pg_catalog.pg_roles r JOIN role_ids i ON i.oid=r.oid),
 'memberships',(SELECT jsonb_agg(to_jsonb(m) ORDER BY m.oid) FROM pg_catalog.pg_auth_members m
   WHERE EXISTS(SELECT 1 FROM role_ids r WHERE r.oid IN (m.roleid,m.member,m.grantor))
    AND NOT(m.roleid='ot_v3_result_owner'::regrole AND m.member='postgres'::regrole AND m.grantor='postgres'::regrole
     AND NOT m.admin_option AND NOT m.inherit_option AND m.set_option)),
 'settings',(SELECT jsonb_agg(to_jsonb(s) ORDER BY s.setdatabase,s.setrole) FROM pg_catalog.pg_db_role_setting s
   WHERE s.setrole='postgres'::regrole OR s.setrole IN (SELECT oid FROM role_ids)),
 'defaults',(SELECT jsonb_agg(to_jsonb(d) ORDER BY d.oid) FROM pg_catalog.pg_default_acl d
   WHERE d.defaclrole IN (SELECT oid FROM role_ids) OR d.defaclnamespace IN (SELECT oid FROM ns)
    OR (d.defaclrole='postgres'::regrole AND d.defaclnamespace=0)),
 'functions',(SELECT jsonb_agg(jsonb_build_object('catalog',to_jsonb(p),
   'definition',encode(sha256(convert_to(pg_get_functiondef(p.oid),'UTF8')),'hex')) ORDER BY p.oid)
   FROM (
    SELECT p.oid,p.proname,p.pronamespace,p.proowner,p.prolang,
     p.procost,p.prorows,p.provariadic,p.prosupport,p.prokind,
     p.prosecdef,p.proleakproof,p.proisstrict,p.proretset,p.provolatile,
     p.proparallel,p.pronargs,p.pronargdefaults,p.prorettype,p.proargtypes,
     p.proallargtypes,p.proargmodes,p.proargnames,p.proargdefaults,p.protrftypes,
     p.proconfig,p.proacl
    FROM pg_catalog.pg_proc p
   ) p JOIN ns n ON n.oid=p.pronamespace),
 'relations',(SELECT jsonb_agg(jsonb_build_object('catalog',to_jsonb(c)-ARRAY['relpages','reltuples','relallvisible','relfrozenxid','relminmxid'],
   'attributes',(SELECT jsonb_agg(to_jsonb(a) ORDER BY a.attnum) FROM pg_catalog.pg_attribute a WHERE a.attrelid=c.oid),
   'constraints',(SELECT jsonb_agg(to_jsonb(k) ORDER BY k.oid) FROM pg_catalog.pg_constraint k WHERE k.conrelid=c.oid),
   'indexes',(SELECT jsonb_agg(to_jsonb(i) ORDER BY i.indexrelid) FROM pg_catalog.pg_index i WHERE i.indrelid=c.oid OR i.indexrelid=c.oid),
   'policies',(SELECT jsonb_agg(to_jsonb(p) ORDER BY p.oid) FROM pg_catalog.pg_policy p WHERE p.polrelid=c.oid),
   'triggers',(SELECT jsonb_agg(to_jsonb(g) ORDER BY g.oid) FROM pg_catalog.pg_trigger g WHERE g.tgrelid=c.oid),
   'defaults',(SELECT jsonb_agg(to_jsonb(d) ORDER BY d.adnum) FROM pg_catalog.pg_attrdef d WHERE d.adrelid=c.oid),
   'inheritance',(SELECT jsonb_agg(to_jsonb(i) ORDER BY i.inhrelid,i.inhparent) FROM pg_catalog.pg_inherits i WHERE i.inhrelid=c.oid OR i.inhparent=c.oid),
   'rewrites',(SELECT jsonb_agg(to_jsonb(r) ORDER BY r.oid) FROM pg_catalog.pg_rewrite r WHERE r.ev_class=c.oid))
   ORDER BY c.oid) FROM pg_catalog.pg_class c JOIN classes i ON i.oid=c.oid),
 'types',(SELECT jsonb_agg(to_jsonb(t) ORDER BY t.oid) FROM pg_catalog.pg_type t JOIN ns n ON n.oid=t.typnamespace),
 'objects',(SELECT jsonb_agg(to_jsonb(o) ORDER BY o.classid,o.objid) FROM objects o),
 'dependencies',(SELECT jsonb_agg(to_jsonb(d) ORDER BY d.classid,d.objid,d.objsubid,d.refclassid,d.refobjid,d.refobjsubid,d.deptype)
   FROM pg_catalog.pg_depend d WHERE (d.classid,d.objid) IN (SELECT classid,objid FROM objects)
     OR (d.refclassid,d.refobjid) IN (SELECT classid,objid FROM objects)),
 'shared',(SELECT jsonb_agg(to_jsonb(d) ORDER BY d.dbid,d.classid,d.objid,d.objsubid,d.refclassid,d.refobjid,d.deptype)
   FROM pg_catalog.pg_shdepend d WHERE ((d.dbid=(SELECT b.oid FROM pg_catalog.pg_database b WHERE b.datname=current_database())
    AND (d.classid,d.objid) IN (SELECT classid,objid FROM objects))
    OR (d.refclassid='pg_catalog.pg_authid'::regclass AND d.refobjid IN (SELECT oid FROM role_ids)))
    AND NOT(d.dbid=0 AND d.classid='pg_catalog.pg_auth_members'::regclass AND EXISTS(
     SELECT 1 FROM pg_catalog.pg_auth_members m WHERE m.oid=d.objid AND m.roleid='ot_v3_result_owner'::regrole
      AND m.member='postgres'::regrole AND m.grantor='postgres'::regrole
      AND NOT m.admin_option AND NOT m.inherit_option AND m.set_option))),
 'descriptions',(SELECT jsonb_agg(to_jsonb(d) ORDER BY d.classoid,d.objoid,d.objsubid) FROM pg_catalog.pg_description d
   JOIN objects o ON o.classid=d.classoid AND o.objid=d.objoid),
 'labels',(SELECT jsonb_agg(to_jsonb(s) ORDER BY s.classoid,s.objoid,s.objsubid,s.provider) FROM pg_catalog.pg_seclabel s
   JOIN objects o ON o.classid=s.classoid AND o.objid=s.objoid),
 'prerequisiteFunctions',(SELECT jsonb_agg(jsonb_build_object('catalog',to_jsonb(p),
   'definition',encode(sha256(convert_to(pg_get_functiondef(p.oid),'UTF8')),'hex')) ORDER BY p.oid)
   FROM (
    SELECT p.oid,p.proname,p.pronamespace,p.proowner,p.prolang,
     p.procost,p.prorows,p.provariadic,p.prosupport,p.prokind,
     p.prosecdef,p.proleakproof,p.proisstrict,p.proretset,p.provolatile,
     p.proparallel,p.pronargs,p.pronargdefaults,p.prorettype,p.proargtypes,
     p.proallargtypes,p.proargmodes,p.proargnames,p.proargdefaults,p.protrftypes,
     p.proconfig,p.proacl
    FROM pg_catalog.pg_proc p
   ) p JOIN prerequisite_ns n ON n.oid=p.pronamespace),
 'prerequisiteRelations',(SELECT jsonb_agg(jsonb_build_object('oid',c.oid,'namespace',c.relnamespace,'owner',c.relowner,'kind',c.relkind,
   'acl',c.relacl,'rls',c.relrowsecurity,'force',c.relforcerowsecurity,'options',c.reloptions,
   'attributes',(SELECT jsonb_agg(to_jsonb(a) ORDER BY a.attnum) FROM pg_catalog.pg_attribute a WHERE a.attrelid=c.oid),
   'constraints',(SELECT jsonb_agg(to_jsonb(k) ORDER BY k.oid) FROM pg_catalog.pg_constraint k WHERE k.conrelid=c.oid),
   'triggers',(SELECT jsonb_agg(to_jsonb(g) ORDER BY g.oid) FROM pg_catalog.pg_trigger g WHERE g.tgrelid=c.oid),
   'policies',(SELECT jsonb_agg(to_jsonb(p) ORDER BY p.oid) FROM pg_catalog.pg_policy p WHERE p.polrelid=c.oid))
   ORDER BY c.oid) FROM pg_catalog.pg_class c JOIN prerequisite_ns n ON n.oid=c.relnamespace)
) ELSE NULL::jsonb END
$catalog$;
CREATE FUNCTION official_v3_result_private.assert_catalog_v1() RETURNS void
LANGUAGE plpgsql VOLATILE PARALLEL UNSAFE SECURITY INVOKER CALLED ON NULL INPUT SET search_path=pg_catalog AS $$
DECLARE stored_catalog jsonb; role_row record; creator oid:='postgres'::regrole;
BEGIN
 SELECT b.catalog INTO stored_catalog FROM official_v3_result_private.binding_v1 b WHERE b.singleton;
 IF stored_catalog IS NULL OR (SELECT count(*) FROM official_v3_result_private.binding_v1)<>1
   OR official_v3_result_private.catalog_v1() IS DISTINCT FROM stored_catalog THEN
   RAISE EXCEPTION 'hrs1 exact catalog changed' USING ERRCODE='P7802';
 END IF;
 FOR role_row IN SELECT r.oid FROM pg_catalog.pg_roles r WHERE r.rolname IN
  ('ot_v3_result_owner','ot_v3_result_writer','ot_v3_result_reader','ot_v3_result_verifier') LOOP
  IF (SELECT count(*) FROM pg_catalog.pg_auth_members m WHERE m.roleid=role_row.oid OR m.member=role_row.oid OR m.grantor=role_row.oid)<>1
   OR NOT EXISTS(SELECT 1 FROM pg_catalog.pg_auth_members m WHERE m.roleid=role_row.oid AND m.member=creator
    AND m.grantor=10 AND m.admin_option AND NOT m.inherit_option AND NOT m.set_option) THEN
   RAISE EXCEPTION 'hrs1 runtime membership drift' USING ERRCODE='P7802';
  END IF;
 END LOOP;
END $$;
CREATE FUNCTION official_v3_result_private.selected_binding_v1() RETURNS jsonb
LANGUAGE sql STABLE PARALLEL UNSAFE SECURITY INVOKER CALLED ON NULL INPUT SET search_path=pg_catalog AS $$
 SELECT b.binding FROM official_v3_result_private.binding_v1 b WHERE b.singleton
$$;


CREATE FUNCTION official_v3_result_private.state_v1() RETURNS jsonb
LANGUAGE plpgsql STABLE PARALLEL UNSAFE SECURITY INVOKER CALLED ON NULL INPUT SET search_path=pg_catalog AS $$
DECLARE h official_v3_result_private.heads_v1%ROWTYPE; v jsonb; d jsonb; prior jsonb; arc jsonb; sticky jsonb; pointer jsonb; invalidated jsonb;
BEGIN
 SELECT * INTO STRICT h FROM official_v3_result_private.heads_v1 WHERE singleton;
 SELECT x.prepared->'version',x.prepared->'decision',x.prepared->'previousDecision',x.prepared->'archiveAppend'
  INTO v,d,prior,arc FROM official_v3_result_private.versions_v1 x WHERE x.reference=h.version_ref;
 SELECT x.record INTO sticky FROM official_v3_result_private.decisions_v1 x WHERE x.reference=h.sticky_decision_ref;
 pointer:=CASE WHEN v IS NULL THEN jsonb_build_object('revision',0,'state','missing','versionRef',NULL)
  ELSE jsonb_build_object('revision',v->'revision','state',v->'state','versionRef',v->'reference') END;
 invalidated:=CASE WHEN h.projection_ref IS NULL THEN '[]'::jsonb ELSE jsonb_build_array(h.projection_ref) END;
 RETURN jsonb_build_object(
  'history',jsonb_build_object('pointer',pointer,'version',v,'decision',d,'decisionPredecessor',prior,'decisionArchiveAppend',arc,
   'invalidatedProjectionRefs',invalidated),
  'head',jsonb_build_object('pointer',pointer,'sourceDecisionRef',d->'reference','historyArchive',d->'historyArchive'),
  'stickyDecision',sticky,'suppressionEpoch',h.suppression_epoch,'generation',h.generation,'suppression',h.suppression);
END $$;
CREATE FUNCTION official_v3_result_private.assert_history_v1() RETURNS void
LANGUAGE plpgsql VOLATILE PARALLEL UNSAFE SECURITY INVOKER CALLED ON NULL INPUT SET search_path=pg_catalog AS $$
DECLARE h official_v3_result_private.heads_v1%ROWTYPE; b jsonb:=official_v3_result_private.selected_binding_v1(); total_versions bigint; last_revision integer; chain_count bigint;
BEGIN
 SELECT * INTO STRICT h FROM official_v3_result_private.heads_v1 WHERE singleton;
 SELECT count(*),max(v.revision) INTO total_versions,last_revision FROM official_v3_result_private.versions_v1 v;
 WITH RECURSIVE chain(reference,predecessor_ref,revision) AS (
  SELECT v.reference,v.predecessor_ref,v.revision FROM official_v3_result_private.versions_v1 v WHERE v.reference=h.version_ref
  UNION ALL SELECT v.reference,v.predecessor_ref,v.revision FROM official_v3_result_private.versions_v1 v
   JOIN chain c ON v.reference=c.predecessor_ref AND v.revision=c.revision-1
 ) SELECT count(*) INTO chain_count FROM chain;
 IF h.context_key IS DISTINCT FROM b->>'contextKey'
  OR total_versions<>chain_count OR total_versions<>COALESCE(last_revision,0)
  OR (h.version_ref IS NULL) IS DISTINCT FROM (total_versions=0)
  OR EXISTS(SELECT 1 FROM official_v3_result_private.versions_v1 v LEFT JOIN official_v3_result_private.versions_v1 prev ON prev.reference=v.predecessor_ref
   JOIN official_v3_result_private.decisions_v1 d ON d.reference=v.decision_ref
   JOIN official_v3_result_private.qualifications_v1 q ON q.reference=v.verification_ref
   WHERE v.prepared#>>'{version,reference}' IS DISTINCT FROM v.reference OR (v.prepared#>>'{version,revision}')::integer IS DISTINCT FROM v.revision
    OR v.prepared#>>'{version,predecessor}' IS DISTINCT FROM v.predecessor_ref
    OR v.prepared->'decision' IS DISTINCT FROM d.record OR v.prepared->'decision' IS DISTINCT FROM q.record->'decision'
    OR q.kind<>'verification' OR v.prepared#>>'{version,state}' IS DISTINCT FROM 'accepted'
    OR (v.revision=1 AND v.predecessor_ref IS NOT NULL) OR (v.revision>1 AND (prev.reference IS NULL OR prev.revision<>v.revision-1))
    OR v.prepared#>'{transition,expected}' IS DISTINCT FROM (CASE WHEN prev.reference IS NULL
     THEN jsonb_build_object('revision',0,'state','missing','versionRef',NULL)
     ELSE jsonb_build_object('revision',prev.revision,'state',prev.prepared#>'{version,state}','versionRef',prev.reference) END)
    OR v.prepared->'previousDecision' IS DISTINCT FROM COALESCE(prev.prepared->'decision','null'::jsonb))
  OR EXISTS(SELECT 1 FROM official_v3_result_private.decisions_v1 d
   JOIN official_v3_result_private.qualifications_v1 q ON q.reference=d.verification_ref
   LEFT JOIN official_v3_result_private.decisions_v1 prior ON prior.reference=d.predecessor_ref
   WHERE d.record->>'reference' IS DISTINCT FROM d.reference OR d.record->>'predecessor' IS DISTINCT FROM d.predecessor_ref
    OR d.record IS DISTINCT FROM q.record->'decision' OR q.record->'previousDecision' IS DISTINCT FROM COALESCE(prior.record,'null'::jsonb))
  OR EXISTS(SELECT 1 FROM official_v3_result_private.archive_pages_v1 a LEFT JOIN official_v3_result_private.archive_pages_v1 prev ON prev.reference=a.predecessor_ref
   WHERE a.record#>>'{head,reference}' IS DISTINCT FROM a.reference OR a.record#>>'{predecessor,reference}' IS DISTINCT FROM a.predecessor_ref
    OR (a.record#>>'{head,revision}')::integer IS DISTINCT FROM a.revision
    OR (a.revision=1 AND a.predecessor_ref IS NOT NULL) OR (a.revision>1 AND (prev.reference IS NULL OR prev.revision<>a.revision-1)))
  OR EXISTS(SELECT 1 FROM official_v3_result_private.qualifications_v1 q
   WHERE q.digest<>official_v3_result_private.hash_v1(q.record)
    OR EXISTS(SELECT 1 FROM jsonb_array_elements_text(q.original_ids) ids
      LEFT JOIN official_v3_result_private.originals_v1 o ON o.version_id=ids.value
      LEFT JOIN official_v3_result_private.extractions_v1 e ON e.version_id=ids.value
      WHERE o.version_id IS NULL OR e.version_id IS NULL OR o.raw_digest<>encode(sha256(convert_to(o.body_text,'UTF8')),'hex')))
  OR EXISTS(SELECT 1 FROM official_v3_result_private.projections_v1 p JOIN official_v3_result_private.versions_v1 v ON v.reference=p.version_ref
   WHERE p.record->'rule' IS DISTINCT FROM v.prepared->'version' OR p.record->>'reference' IS DISTINCT FROM p.reference)
  OR (h.version_ref IS NOT NULL AND NOT EXISTS(SELECT 1 FROM official_v3_result_private.versions_v1 v
   WHERE v.reference=h.version_ref AND v.revision=last_revision AND v.decision_ref=h.decision_ref))
  OR (h.version_ref IS NULL AND (h.decision_ref IS NOT NULL OR h.projection_ref IS NOT NULL))
  OR (h.projection_ref IS NOT NULL AND NOT EXISTS(SELECT 1 FROM official_v3_result_private.projections_v1 p
   WHERE p.reference=h.projection_ref AND p.version_ref=h.version_ref)) THEN
  RAISE EXCEPTION 'hrs1 complete durable history mismatch' USING ERRCODE='P7804';
 END IF;
END $$;
CREATE FUNCTION official_v3_result_private.original_v1(o jsonb,b jsonb) RETURNS jsonb
LANGUAGE plpgsql STABLE PARALLEL UNSAFE SECURITY INVOKER CALLED ON NULL INPUT SET search_path=pg_catalog AS $$
DECLARE ambiguous boolean:=o->'observation'='null'::jsonb; evidence_value jsonb; selected_source jsonb; subject jsonb; expected_keys text[];
BEGIN
 expected_keys:=CASE WHEN ambiguous THEN ARRAY['observation','ambiguity','bodyText','rawDigest','extraction','qualification']
  ELSE ARRAY['observation','bodyText','rawDigest','extraction','qualification'] END;
 subject:=CASE WHEN ambiguous THEN o->'ambiguity' ELSE o->'observation' END;
 evidence_value:=subject->'evidence';
 IF official_v3_result_private.exact_keys_v1(o,expected_keys) IS NOT TRUE
  OR jsonb_typeof(o->'bodyText') IS DISTINCT FROM 'string' OR octet_length(o->>'bodyText') NOT BETWEEN 1 AND 131072
  OR o->>'rawDigest' IS DISTINCT FROM encode(sha256(convert_to(o->>'bodyText','UTF8')),'hex')
  OR subject->'context' IS DISTINCT FROM b->'context' OR subject->'contextKey' IS DISTINCT FROM b->'contextKey'
  OR official_v3_result_private.record_shape_v1(evidence_value,'evidence') IS NOT TRUE
  OR official_v3_result_private.exact_keys_v1(o->'qualification',ARRAY['qualificationDigest','source','contextKey','method','checkedAt','role']) IS NOT TRUE
  OR o#>'{qualification,source}' IS DISTINCT FROM evidence_value->'source'
  OR o#>'{qualification,contextKey}' IS DISTINCT FROM b->'contextKey'
  OR o#>'{qualification,method}' IS DISTINCT FROM jsonb_build_object('methodId',b->'methodId','revision',b->'revision')
  OR official_v3_result_private.timestamp_v1(o#>>'{qualification,checkedAt}')<official_v3_result_private.timestamp_v1(evidence_value->>'retrievedAt') THEN
  RAISE EXCEPTION 'hrs1 original binding invalid' USING ERRCODE='P7804';
 END IF;
 IF ambiguous THEN
  IF official_v3_result_private.exact_keys_v1(subject,ARRAY['context','contextKey','evidence','reason']) IS NOT TRUE
   OR (subject->>'reason' IN ('ambiguous_statement','unqualified_destination_authority','invalid_or_unknown_validity')) IS NOT TRUE
   OR official_v3_result_private.exact_keys_v1(o->'extraction',ARRAY['executableDigest','observation','ambiguity']) IS NOT TRUE
   OR o#>'{extraction,observation}' IS DISTINCT FROM 'null'::jsonb OR o#>'{extraction,ambiguity}' IS DISTINCT FROM subject THEN
   RAISE EXCEPTION 'hrs1 qualified ambiguity invalid' USING ERRCODE='P7804';
  END IF;
 ELSE
  IF official_v3_result_private.record_shape_v1(subject,'observation') IS NOT TRUE
   OR subject#>'{fact,fact,kind}' IS DISTINCT FROM b->'factKind'
   OR official_v3_result_private.exact_keys_v1(o->'extraction',ARRAY['executableDigest','observation']) IS NOT TRUE
   OR o#>'{extraction,observation}' IS DISTINCT FROM subject THEN
   RAISE EXCEPTION 'hrs1 extraction invalid' USING ERRCODE='P7804';
  END IF;
 END IF;
 SELECT s.value INTO selected_source FROM jsonb_array_elements(b->'sources') s WHERE s.value->'source'=evidence_value->'source';
 IF selected_source IS NULL OR o#>'{extraction,executableDigest}' IS DISTINCT FROM selected_source->'executableDigest'
  OR o#>'{qualification,qualificationDigest}' IS DISTINCT FROM selected_source->'qualificationDigest'
  OR o#>'{qualification,role}' IS DISTINCT FROM selected_source->'role' THEN
  RAISE EXCEPTION 'hrs1 exact selected qualification missing' USING ERRCODE='P7804';
 END IF;
 RETURN evidence_value;
END $$;

CREATE FUNCTION official_v3_result_private.observations_v1(v jsonb) RETURNS jsonb
LANGUAGE sql IMMUTABLE PARALLEL UNSAFE SECURITY INVOKER CALLED ON NULL INPUT SET search_path=pg_catalog AS $$
 WITH RECURSIVE nodes(value,depth) AS (
  SELECT v,0 UNION ALL SELECT child.value,parent.depth+1 FROM nodes parent CROSS JOIN LATERAL (
   SELECT value FROM jsonb_each(CASE WHEN jsonb_typeof(parent.value)='object' THEN parent.value ELSE '{}'::jsonb END)
   UNION ALL SELECT value FROM jsonb_array_elements(CASE WHEN jsonb_typeof(parent.value)='array' THEN parent.value ELSE '[]'::jsonb END)
  ) child WHERE parent.depth<32 AND NOT (jsonb_typeof(parent.value)='object' AND parent.value ?& ARRAY['context','contextKey','fact','evidence'])
 )
 SELECT COALESCE(jsonb_agg(value),'[]'::jsonb) FROM nodes
  WHERE jsonb_typeof(value)='object' AND value ?& ARRAY['context','contextKey','fact','evidence']
$$;
CREATE FUNCTION official_v3_result_private.verification_v1(v jsonb,b jsonb,require_current boolean) RETURNS void
LANGUAGE plpgsql VOLATILE PARALLEL UNSAFE SECURITY INVOKER CALLED ON NULL INPUT SET search_path=pg_catalog AS $$
DECLARE o jsonb; ev jsonb; ids text[]:='{}'; seen jsonb; snapshot jsonb; prior jsonb; conflict_value jsonb; retained jsonb;
 archive_value jsonb:=v->'archiveAppend'; previous_value jsonb:=v->'previousDecision'; removed_conflicts jsonb:='[]'::jsonb; archived_entry jsonb;
BEGIN
 IF official_v3_result_private.exact_keys_v1(v,ARRAY['reference','request','decision','previousDecision','archiveAppend','originals','history','stickyDecision','suppressionEpoch','validUntilExclusive']) IS NOT TRUE
  OR v->>'reference' IS DISTINCT FROM official_v3_result_private.ref_v1('hrs1-verification',v-'reference')
  OR official_v3_result_private.record_shape_v1(v->'decision','decision') IS NOT TRUE
  OR (v->'previousDecision'<>'null'::jsonb AND official_v3_result_private.record_shape_v1(v->'previousDecision','decision') IS NOT TRUE)
  OR (v->'archiveAppend'<>'null'::jsonb AND official_v3_result_private.record_shape_v1(v->'archiveAppend','archive') IS NOT TRUE)
  OR official_v3_result_private.exact_keys_v1(v->'request',ARRAY['context','contextKey','factKind','references','method','clock','previousDecision','decisionRef']) IS NOT TRUE
  OR v#>'{request,context}' IS DISTINCT FROM b->'context' OR v#>'{request,contextKey}' IS DISTINCT FROM b->'contextKey'
  OR v#>'{request,factKind}' IS DISTINCT FROM b->'factKind'
  OR v#>'{request,method}' IS DISTINCT FROM jsonb_build_object('methodId',b->'methodId','revision',b->'revision')
  OR v#>'{request,previousDecision}' IS DISTINCT FROM v->'previousDecision'
  OR v#>'{decision,context}' IS DISTINCT FROM b->'context' OR v#>'{decision,contextKey}' IS DISTINCT FROM b->'contextKey'
  OR v#>'{decision,factKind}' IS DISTINCT FROM b->'factKind' OR v#>'{decision,method}' IS DISTINCT FROM v#>'{request,method}'
  OR v#>'{decision,reference}' IS DISTINCT FROM v#>'{request,decisionRef}'
  OR v#>'{decision,predecessor}' IS DISTINCT FROM COALESCE(v#>'{previousDecision,reference}','null'::jsonb)
  OR v#>'{history,decision}' IS DISTINCT FROM v->'previousDecision'
  OR official_v3_result_private.exact_keys_v1(v#>'{request,clock}',ARRAY['now','legalDate']) IS NOT TRUE
  OR v#>>'{request,clock,legalDate}' IS DISTINCT FROM to_char(official_v3_result_private.timestamp_v1(v#>>'{request,clock,now}') AT TIME ZONE (b->>'legalTimeZone'),'YYYY-MM-DD')
  OR v#>>'{decision,legalAsOfDate}' IS DISTINCT FROM to_char(official_v3_result_private.timestamp_v1(v#>>'{decision,evaluatedAt}') AT TIME ZONE (b->>'legalTimeZone'),'YYYY-MM-DD')
  OR official_v3_result_private.timestamp_v1(v#>>'{decision,evaluatedAt}')<official_v3_result_private.timestamp_v1(v#>>'{request,clock,now}')
  OR official_v3_result_private.timestamp_v1(v->>'validUntilExclusive')<=official_v3_result_private.timestamp_v1(v#>>'{decision,evaluatedAt}')
  OR jsonb_typeof(v->'originals') IS DISTINCT FROM 'array' OR jsonb_array_length(v->'originals') NOT BETWEEN 1 AND 8
  OR jsonb_typeof(v#>'{request,references}') IS DISTINCT FROM 'array' OR jsonb_array_length(v#>'{request,references}') NOT BETWEEN 1 AND 8
  OR (v->>'suppressionEpoch' ~ '^(0|[1-9][0-9]{0,15})$') IS NOT TRUE THEN
  RAISE EXCEPTION 'hrs1 complete verification invalid' USING ERRCODE='P7804';
 END IF;
 FOR seen IN SELECT value FROM jsonb_array_elements(v#>'{request,references}') LOOP
  IF official_v3_result_private.exact_keys_v1(seen,ARRAY['sourceId','contentItemId','representationId']) IS NOT TRUE
   OR NOT EXISTS(SELECT 1 FROM jsonb_array_elements(b->'sources') s WHERE s.value#>'{source,sourceId}'=seen->'sourceId'
    AND s.value#>'{source,contentItemId}'=seen->'contentItemId' AND s.value#>'{source,representationId}'=seen->'representationId') THEN
   RAISE EXCEPTION 'hrs1 unselected source reference' USING ERRCODE='P7804';
  END IF;
 END LOOP;
 FOR o IN SELECT value FROM jsonb_array_elements(v->'originals') LOOP
  ev:=official_v3_result_private.original_v1(o,b);
  IF ev->>'versionId'=ANY(ids) OR official_v3_result_private.timestamp_v1(v->>'validUntilExclusive')>
    official_v3_result_private.timestamp_v1(ev->>'retrievedAt')+make_interval(secs=>(b->>'sourceMaxAgeMilliseconds')::integer/1000.0)
   OR official_v3_result_private.timestamp_v1(o#>>'{qualification,checkedAt}')>official_v3_result_private.timestamp_v1(v#>>'{decision,evaluatedAt}') THEN
   RAISE EXCEPTION 'hrs1 original freshness or uniqueness invalid' USING ERRCODE='P7804';
  END IF;
  ids:=array_append(ids,ev->>'versionId');
  IF o->'observation'='null'::jsonb THEN
   IF (CASE o#>>'{qualification,role}' WHEN 'primary' THEN
      v#>>'{decision,primary,status}'='unclear' AND v#>'{decision,primary,evidence}'=ev
       AND v#>'{decision,primary,reason}'=o#>'{ambiguity,reason}'
     WHEN 'counter' THEN
      EXISTS(SELECT 1 FROM jsonb_array_elements(b->'sources') selected_counter
       WHERE selected_counter.value->>'role'='counter' AND selected_counter.value->'source'=ev->'source')
      AND (SELECT count(*) FROM jsonb_array_elements(v#>'{decision,counterCheck,attempts}') counter_attempt
       WHERE counter_attempt.value->>'status'='unclear' AND counter_attempt.value->'source'=jsonb_build_object(
         'sourceId',ev#>'{source,sourceId}','contentItemId',ev#>'{source,contentItemId}','representationId',ev#>'{source,representationId}')
        AND counter_attempt.value->'attemptedAt'=o#>'{qualification,checkedAt}')=1
     ELSE false END) IS NOT TRUE THEN
    RAISE EXCEPTION 'hrs1 ambiguity not used by decision' USING ERRCODE='P7804';
   END IF;
  ELSE
   WITH RECURSIVE nodes(x,depth) AS (
    SELECT jsonb_build_array(v->'decision',v->'archiveAppend'),0
    UNION ALL SELECT j.value,n.depth+1 FROM nodes n CROSS JOIN LATERAL (
      SELECT value FROM jsonb_each(CASE WHEN jsonb_typeof(n.x)='object' THEN n.x ELSE '{}'::jsonb END)
      UNION ALL SELECT value FROM jsonb_array_elements(CASE WHEN jsonb_typeof(n.x)='array' THEN n.x ELSE '[]'::jsonb END)) j WHERE n.depth<24
   ) SELECT x INTO seen FROM nodes WHERE x=o->'observation' LIMIT 1;
   IF seen IS NULL THEN RAISE EXCEPTION 'hrs1 unused original' USING ERRCODE='P7804'; END IF;
  END IF;
 END LOOP;

 FOR seen IN SELECT value FROM jsonb_array_elements(official_v3_result_private.observations_v1(jsonb_build_array(v->'decision',v->'archiveAppend'))) LOOP
  IF NOT EXISTS(SELECT 1 FROM jsonb_array_elements(v->'originals') new_original WHERE new_original.value->'observation'=seen)
   AND NOT EXISTS(SELECT 1 FROM jsonb_array_elements(official_v3_result_private.observations_v1(
    jsonb_build_array(v->'previousDecision',v#>'{history,decisionArchiveAppend}',v->'stickyDecision'))) past WHERE past.value=seen) THEN
   RAISE EXCEPTION 'hrs1 decision uses unheld original' USING ERRCODE='P7804';
  END IF;
 END LOOP;
 IF v#>>'{decision,primary,status}'='unclear' AND v#>'{decision,primary,evidence}'<>'null'::jsonb
  AND NOT EXISTS(SELECT 1 FROM jsonb_array_elements(v->'originals') original_value
   WHERE CASE WHEN original_value.value->'observation'='null'::jsonb THEN original_value.value#>'{ambiguity,evidence}'
    ELSE original_value.value#>'{observation,evidence}' END=v#>'{decision,primary,evidence}') THEN
  RAISE EXCEPTION 'hrs1 primary ambiguity original absent' USING ERRCODE='P7804';
 END IF;
 IF require_current THEN
  snapshot:=official_v3_result_private.state_v1();
  IF v->'history' IS DISTINCT FROM snapshot->'history' OR v->'stickyDecision' IS DISTINCT FROM snapshot->'stickyDecision'
   OR v->'suppressionEpoch' IS DISTINCT FROM snapshot->'suppressionEpoch' THEN RAISE EXCEPTION 'hrs1 proof head changed' USING ERRCODE='P7805'; END IF;
 END IF;
 prior:=v->'stickyDecision';
 IF prior<>'null'::jsonb THEN
  IF archive_value<>'null'::jsonb THEN
   -- The same bounded canonical append checked by validate_s1_copy_v1 must
   -- already hold before archival can satisfy this verification's sticky set.
   FOR conflict_value IN SELECT value FROM jsonb_array_elements(previous_value->'knownConflicts') LOOP
    IF NOT EXISTS(SELECT 1 FROM jsonb_array_elements(v#>'{decision,knownConflicts}') current_conflict
     WHERE current_conflict.value->'reference'=conflict_value->'reference') THEN
     IF conflict_value->'resolution'='null'::jsonb THEN
      RAISE EXCEPTION 'hrs1 unresolved archive removal' USING ERRCODE='P7804';
     END IF;
     removed_conflicts:=removed_conflicts||jsonb_build_array(conflict_value);
    END IF;
   END LOOP;
   IF archive_value->'contextKey' IS DISTINCT FROM b->'contextKey' OR archive_value->'factKind' IS DISTINCT FROM b->'factKind'
    OR archive_value->'fromDecisionRef' IS DISTINCT FROM previous_value->'reference'
    OR archive_value->'head' IS DISTINCT FROM v#>'{decision,historyArchive}'
    OR archive_value->'predecessor' IS DISTINCT FROM previous_value->'historyArchive'
    OR archive_value->>'archivedAt'<previous_value->>'evaluatedAt' OR archive_value->>'archivedAt'>v#>>'{decision,evaluatedAt}'
    OR archive_value#>'{head,reference}'=archive_value#>'{predecessor,reference}'
    OR (archive_value#>>'{head,revision}')::integer<>COALESCE((archive_value#>>'{predecessor,revision}')::integer,0)+1
    OR (archive_value#>>'{head,totalConflicts}')::integer<>COALESCE((archive_value#>>'{predecessor,totalConflicts}')::integer,0)+jsonb_array_length(archive_value->'entries')
    OR jsonb_array_length(archive_value->'entries')<>jsonb_array_length(removed_conflicts)
    OR (SELECT count(DISTINCT value->>'reference') FROM jsonb_array_elements(archive_value->'entries'))<>jsonb_array_length(removed_conflicts) THEN
    RAISE EXCEPTION 'hrs1 canonical sticky archive mismatch' USING ERRCODE='P7804';
   END IF;
   FOR archived_entry IN SELECT value FROM jsonb_array_elements(archive_value->'entries') LOOP
    IF NOT EXISTS(SELECT 1 FROM jsonb_array_elements(removed_conflicts) WHERE value=archived_entry)
     OR archived_entry#>'{primary,contextKey}' IS DISTINCT FROM b->'contextKey'
     OR archived_entry#>'{primary,fact,fact,kind}' IS DISTINCT FROM b->'factKind'
     OR archived_entry->'resolution'='null'::jsonb OR archived_entry#>>'{resolution,resolvedAt}'>archive_value->>'archivedAt' THEN
     RAISE EXCEPTION 'hrs1 exact resolved archive entry required' USING ERRCODE='P7804';
    END IF;
   END LOOP;
  END IF;
  FOR conflict_value IN SELECT value FROM jsonb_array_elements(prior->'knownConflicts') LOOP
   SELECT value INTO retained FROM jsonb_array_elements(v#>'{decision,knownConflicts}') WHERE value->'reference'=conflict_value->'reference';
   IF retained IS NULL AND conflict_value->'resolution'<>'null'::jsonb AND archive_value<>'null'::jsonb THEN
    SELECT value INTO retained FROM jsonb_array_elements(archive_value->'entries') WHERE value=conflict_value;
   END IF;
   IF retained IS NULL OR (retained-'resolution') IS DISTINCT FROM (conflict_value-'resolution')
    OR (conflict_value->'resolution'<>'null'::jsonb AND retained->'resolution' IS DISTINCT FROM conflict_value->'resolution'
     AND retained#>'{resolution,predecessor}' IS DISTINCT FROM conflict_value#>'{resolution,reference}') THEN
    RAISE EXCEPTION 'hrs1 sticky conflict omitted' USING ERRCODE='P7804';
   END IF;
  END LOOP;
 END IF;
END $$;


CREATE FUNCTION official_v3_result_private.fence_v1(b jsonb,epoch_value integer,deadline timestamptz,legal_day text,verification_value jsonb DEFAULT NULL) RETURNS void
LANGUAGE plpgsql VOLATILE PARALLEL UNSAFE SECURITY INVOKER CALLED ON NULL INPUT SET search_path=pg_catalog AS $$
DECLARE actual_now timestamptz; ev jsonb; original_value jsonb; validity jsonb;
BEGIN
 -- The original HMA row lock lives through the caller's actual COMMIT.
 PERFORM official_v3_result_private.ma1_require_current_locked_v1(b->>'methodId',(b->>'revision')::integer,
  b->>'methodDigest',b->>'packageDigest',epoch_value);
 actual_now:=clock_timestamp();
 IF current_setting('transaction_isolation')<>'read committed' OR NOT isfinite(deadline)
  OR actual_now>=deadline OR actual_now<official_v3_result_private.timestamp_v1(b->>'activeFrom')
  OR actual_now>=official_v3_result_private.timestamp_v1(b->>'activeUntilExclusive')
  OR legal_day IS DISTINCT FROM to_char(actual_now AT TIME ZONE (b->>'legalTimeZone'),'YYYY-MM-DD') THEN
  RAISE EXCEPTION 'hrs1 end authority time or legal day invalid' USING ERRCODE='P7806';
 END IF;
 IF verification_value IS NOT NULL THEN
  IF actual_now>=official_v3_result_private.timestamp_v1(verification_value->>'validUntilExclusive')
   OR official_v3_result_private.timestamp_v1(verification_value#>>'{decision,evaluatedAt}')>actual_now THEN
   RAISE EXCEPTION 'hrs1 source proof expired' USING ERRCODE='P7806';
  END IF;
  FOR original_value IN SELECT value FROM jsonb_array_elements(verification_value->'originals') LOOP
   ev:=CASE WHEN original_value->'observation'='null'::jsonb THEN original_value#>'{ambiguity,evidence}' ELSE original_value#>'{observation,evidence}' END;
   IF official_v3_result_private.timestamp_v1(ev->>'retrievedAt')>actual_now OR actual_now>=
    official_v3_result_private.timestamp_v1(ev->>'retrievedAt')+make_interval(secs=>(b->>'sourceMaxAgeMilliseconds')::integer/1000.0) THEN
    RAISE EXCEPTION 'hrs1 immutable original expired' USING ERRCODE='P7806';
   END IF;
  END LOOP;
  IF verification_value#>>'{decision,conclusion}'='clear_primary' THEN
   validity:=verification_value#>'{decision,primary,observation,evidence,legalValidity}';
   IF validity->>'status' IS DISTINCT FROM 'specified'
    OR (validity->>'validFrom' IS NOT NULL AND validity->>'validFrom'>legal_day)
    OR (validity->>'validUntil' IS NOT NULL AND validity->>'validUntil'<legal_day) THEN
    RAISE EXCEPTION 'hrs1 legal validity expired' USING ERRCODE='P7806';
   END IF;
  END IF;
 END IF;
END $$;
CREATE FUNCTION official_v3_result_private.keep_original_v1(o jsonb,b jsonb) RETURNS text
LANGUAGE plpgsql VOLATILE PARALLEL UNSAFE SECURITY INVOKER CALLED ON NULL INPUT SET search_path=pg_catalog AS $$
DECLARE ev jsonb:=official_v3_result_private.original_v1(o,b); prior official_v3_result_private.originals_v1%ROWTYPE; extraction_value jsonb;
BEGIN
 SELECT * INTO prior FROM official_v3_result_private.originals_v1 x WHERE x.version_id=ev->>'versionId';
 IF FOUND THEN
  SELECT x.record INTO extraction_value FROM official_v3_result_private.extractions_v1 x WHERE x.version_id=prior.version_id;
  IF prior.evidence IS DISTINCT FROM ev OR prior.body_text IS DISTINCT FROM o->>'bodyText'
   OR prior.raw_digest IS DISTINCT FROM o->>'rawDigest' OR extraction_value IS DISTINCT FROM o->'extraction' THEN
   RAISE EXCEPTION 'hrs1 immutable original collision' USING ERRCODE='P7804';
  END IF;
 ELSE
  INSERT INTO official_v3_result_private.originals_v1(version_id,evidence,body_text,raw_digest)
   VALUES(ev->>'versionId',ev,o->>'bodyText',o->>'rawDigest');
  INSERT INTO official_v3_result_private.extractions_v1(version_id,record) VALUES(ev->>'versionId',o->'extraction');
 END IF;
 RETURN ev->>'versionId';
END $$;
CREATE FUNCTION official_v3_result_private.attest_v1(q jsonb,b jsonb,epoch_value integer,deadline timestamptz,legal_day text) RETURNS jsonb
LANGUAGE plpgsql VOLATILE PARALLEL UNSAFE SECURITY INVOKER CALLED ON NULL INPUT SET search_path=pg_catalog AS $$
DECLARE v jsonb:=q->'verification'; kind_value text:=q->>'kind'; ids jsonb:='[]'; original_value jsonb; prior official_v3_result_private.qualifications_v1%ROWTYPE;
 digest_value text; expires timestamptz; decision_key text; ev jsonb; target_value jsonb;
BEGIN
 IF kind_value NOT IN ('verification','observation') OR v IS NULL THEN RAISE EXCEPTION 'hrs1 invalid attestation' USING ERRCODE='P7804'; END IF;
 digest_value:=official_v3_result_private.hash_v1(v);
 IF kind_value='verification' THEN
  PERFORM official_v3_result_private.verification_v1(v,b,false);
  expires:=official_v3_result_private.timestamp_v1(v->>'validUntilExclusive');
  decision_key:=official_v3_result_private.ref_v1('hrs1-decision-custody',v->'decision');
 ELSE
  IF official_v3_result_private.exact_keys_v1(v,ARRAY['reference','target','method','observation','original','status','checkedAt']) IS NOT TRUE
   OR v->>'reference' IS DISTINCT FROM official_v3_result_private.ref_v1('hrs1-source-observation',v-'reference')
   OR v->'method' IS DISTINCT FROM jsonb_build_object('methodId',b->'methodId','revision',b->'revision')
   OR (v->>'status' IN ('observed','unclear')) IS NOT TRUE
   OR official_v3_result_private.exact_keys_v1(v->'observation',ARRAY['source','fingerprint','retrievedAt']) IS NOT TRUE THEN
   RAISE EXCEPTION 'hrs1 observation attestation invalid' USING ERRCODE='P7804';
  END IF;
  ev:=official_v3_result_private.original_v1(v->'original',b);
  IF v#>'{target,context}' IS DISTINCT FROM b->'context' OR v#>'{target,factKind}' IS DISTINCT FROM b->'factKind'
   OR v#>'{observation,source}' IS DISTINCT FROM ev->'source' OR v#>'{target,source}' IS DISTINCT FROM ev->'source'
   OR v#>'{observation,retrievedAt}' IS DISTINCT FROM ev->'retrievedAt'
   OR v#>'{observation,fingerprint}' IS DISTINCT FROM jsonb_build_object('sourceContentHash',ev->'sourceContentHash','sourceFingerprintProtocol',ev->'sourceFingerprintProtocol')
   OR (v->>'status'='observed') IS DISTINCT FROM (v#>'{original,observation}'<>'null'::jsonb)
   OR official_v3_result_private.timestamp_v1(v->>'checkedAt')<official_v3_result_private.timestamp_v1(ev->>'retrievedAt')
   OR official_v3_result_private.timestamp_v1(v->>'checkedAt')>clock_timestamp() THEN
   RAISE EXCEPTION 'hrs1 observed original binding mismatch' USING ERRCODE='P7804';
  END IF;
  expires:=official_v3_result_private.timestamp_v1(ev->>'retrievedAt')+make_interval(secs=>(b->>'sourceMaxAgeMilliseconds')::integer/1000.0);
 END IF;
 SELECT * INTO prior FROM official_v3_result_private.qualifications_v1 x WHERE x.reference=v->>'reference'
  OR (kind_value='verification' AND x.kind='verification' AND x.decision_content_key=decision_key);
 IF FOUND THEN
  IF prior.reference IS DISTINCT FROM v->>'reference' OR prior.kind IS DISTINCT FROM kind_value OR prior.record IS DISTINCT FROM v
   OR prior.digest IS DISTINCT FROM digest_value OR prior.valid_until IS DISTINCT FROM expires THEN RETURN jsonb_build_object('status','collision'); END IF;
 ELSE
  IF kind_value='verification' THEN
   PERFORM official_v3_result_private.verification_v1(v,b,true);
   FOR original_value IN SELECT value FROM jsonb_array_elements(v->'originals') LOOP
    ids:=ids||jsonb_build_array(official_v3_result_private.keep_original_v1(original_value,b));
   END LOOP;
  ELSE
   -- Exact current plan target; an arbitrary JSON source observation is not accepted.
   IF NOT EXISTS(SELECT 1 FROM jsonb_array_elements(official_v3_result_private.plan_v1(b)#>'{plan,targets}') t WHERE t.value=v->'target') THEN
    RAISE EXCEPTION 'hrs1 observation plan changed' USING ERRCODE='P7805';
   END IF;
   ids:=jsonb_build_array(official_v3_result_private.keep_original_v1(v->'original',b));
  END IF;
  INSERT INTO official_v3_result_private.qualifications_v1(reference,kind,record,digest,decision_ref,decision_content_key,valid_until,original_ids)
   VALUES(v->>'reference',kind_value,v,digest_value,CASE WHEN kind_value='verification' THEN v#>>'{decision,reference}' ELSE NULL END,decision_key,expires,ids);
 END IF;
 PERFORM official_v3_result_private.fence_v1(b,epoch_value,LEAST(deadline,expires),legal_day,CASE WHEN kind_value='verification' THEN v ELSE NULL END);
 RETURN jsonb_build_object('status','recorded','value',jsonb_build_object('reference',v->'reference','digest',digest_value));
END $$;
CREATE FUNCTION official_v3_result_private.consume_s1_v1(ref jsonb,expected_outcome jsonb,b jsonb) RETURNS jsonb
LANGUAGE plpgsql VOLATILE PARALLEL UNSAFE SECURITY INVOKER CALLED ON NULL INPUT SET search_path=pg_catalog AS $$
DECLARE reply jsonb; proposal_value jsonb; validation_job jsonb; decision_ref text;
BEGIN
 PERFORM official_v3_result_private.reference_v1(ref);
 IF ref#>'{binding,contextKey}' IS DISTINCT FROM b->'contextKey'
  OR ref#>'{binding,method}' IS DISTINCT FROM jsonb_build_object('methodId',b->'methodId','revision',b->'revision') THEN
  RAISE EXCEPTION 'hrs1 complete S1 tuple mismatch' USING ERRCODE='P7804';
 END IF;
 reply:=official_v3_result_private.s1_read_locked_v1(ref->'binding',ref->>'proposalDigest',(ref->>'bytes')::integer);
 IF reply->>'status' IS DISTINCT FROM 'recorded' OR reply#>'{record,reference}' IS DISTINCT FROM ref
  OR reply#>'{record,outcome}' IS DISTINCT FROM expected_outcome THEN
  RAISE EXCEPTION 'hrs1 exact completed S1 outcome required' USING ERRCODE='P7804';
 END IF;
 proposal_value:=(reply#>>'{record,text}')::jsonb;
 validation_job:=jsonb_build_object('kind','research_job_record','jobId',proposal_value->'jobId','context',proposal_value->'context',
  'contextKey',proposal_value->'contextKey','research',proposal_value->'research','method',ref#>'{binding,method}');
 decision_ref:=CASE WHEN expected_outcome->>'status'='prepared' THEN expected_outcome#>>'{value,decision,reference}' ELSE expected_outcome#>>'{decision,reference}' END;
 PERFORM official_v3_result_private.validate_s1_copy_v1(reply,validation_job,jsonb_build_object('decisionRef',decision_ref),'prepare');
 IF proposal_value->'context' IS DISTINCT FROM b->'context' OR proposal_value->'contextKey' IS DISTINCT FROM b->'contextKey'
  OR proposal_value#>'{research,factKind}' IS DISTINCT FROM b->'factKind' THEN
  RAISE EXCEPTION 'hrs1 original global context mismatch' USING ERRCODE='P7804';
 END IF;
 RETURN proposal_value;
END $$;
CREATE FUNCTION official_v3_result_private.keep_decision_v1(v jsonb) RETURNS void
LANGUAGE plpgsql VOLATILE PARALLEL UNSAFE SECURITY INVOKER CALLED ON NULL INPUT SET search_path=pg_catalog AS $$
DECLARE decision_value jsonb:=v->'decision'; archive_value jsonb:=v->'archiveAppend'; prior_record jsonb; archive_reference text;
BEGIN
 SELECT d.record INTO prior_record FROM official_v3_result_private.decisions_v1 d WHERE d.reference=decision_value->>'reference';
 IF FOUND THEN
  IF prior_record IS DISTINCT FROM decision_value THEN RAISE EXCEPTION 'hrs1 decision collision' USING ERRCODE='P7804'; END IF;
  RETURN;
 END IF;
 IF archive_value<>'null'::jsonb THEN
  archive_reference:=archive_value#>>'{head,reference}';
  SELECT a.record INTO prior_record FROM official_v3_result_private.archive_pages_v1 a WHERE a.reference=archive_reference;
  IF FOUND THEN
   IF prior_record IS DISTINCT FROM archive_value THEN RAISE EXCEPTION 'hrs1 archive collision' USING ERRCODE='P7804'; END IF;
  ELSE
   INSERT INTO official_v3_result_private.archive_pages_v1(reference,predecessor_ref,revision,record)
    VALUES(archive_reference,archive_value#>>'{predecessor,reference}',(archive_value#>>'{head,revision}')::integer,archive_value);
  END IF;
 END IF;
 INSERT INTO official_v3_result_private.decisions_v1(reference,predecessor_ref,record,archive_ref,verification_ref)
  VALUES(decision_value->>'reference',decision_value->>'predecessor',decision_value,archive_reference,v->>'reference');
END $$;


CREATE FUNCTION official_v3_result_private.prepared_v1(prepared_value jsonb,proof_value jsonb,b jsonb) RETURNS void
LANGUAGE plpgsql VOLATILE PARALLEL UNSAFE SECURITY INVOKER CALLED ON NULL INPUT SET search_path=pg_catalog AS $$
DECLARE version_value jsonb:=prepared_value->'version'; transition_value jsonb:=prepared_value->'transition'; previous_pointer jsonb:=proof_value#>'{history,pointer}'; expected_version text; resolutions jsonb;
BEGIN
 IF official_v3_result_private.exact_keys_v1(prepared_value,ARRAY['proposalDigest','decision','previousDecision','archiveAppend','version','transition','proposalDisposition','acceptance','reproof']) IS NOT TRUE
  OR official_v3_result_private.record_shape_v1(version_value,'version') IS NOT TRUE
  OR official_v3_result_private.record_shape_v1(transition_value,'transition') IS NOT TRUE
  OR prepared_value->'decision' IS DISTINCT FROM proof_value->'decision' OR prepared_value->'previousDecision' IS DISTINCT FROM proof_value->'previousDecision'
  OR prepared_value->'archiveAppend' IS DISTINCT FROM proof_value->'archiveAppend' OR prepared_value->>'acceptance' IS DISTINCT FROM 'not_committed'
  OR prepared_value->>'reproof' IS DISTINCT FROM 'required_before_commit'
  OR (prepared_value->>'proposalDisposition' IN ('matched','superseded_by_source')) IS NOT TRUE
  OR (prepared_value->>'proposalDigest' ~ '^[a-f0-9]{64}$') IS NOT TRUE
  OR proof_value#>>'{decision,conclusion}' IS DISTINCT FROM 'clear_primary' OR proof_value#>>'{decision,primary,status}' IS DISTINCT FROM 'clear'
  OR version_value->'subject' IS DISTINCT FROM proof_value#>'{decision,primary,observation}'
  OR version_value->'method' IS DISTINCT FROM proof_value#>'{decision,method}'
  OR version_value->'sourceDecisionRef' IS DISTINCT FROM proof_value#>'{decision,reference}'
  OR official_v3_result_private.timestamp_v1(version_value->>'recordedAt')<official_v3_result_private.timestamp_v1(proof_value#>>'{decision,evaluatedAt}')
  OR official_v3_result_private.timestamp_v1(version_value->>'recordedAt')>clock_timestamp()
  OR transition_value->'method' IS DISTINCT FROM version_value->'method'
  OR transition_value->'contextKey' IS DISTINCT FROM b->'contextKey' OR transition_value->'factKind' IS DISTINCT FROM b->'factKind'
  OR transition_value->'operationId' IS DISTINCT FROM version_value->'operationId'
  OR transition_value->'expected' IS DISTINCT FROM previous_pointer
  OR transition_value->'invalidatedProjectionRefs' IS DISTINCT FROM proof_value#>'{history,invalidatedProjectionRefs}'
  OR transition_value->'sourceDecisionRef' IS DISTINCT FROM proof_value#>'{decision,reference}'
  OR transition_value->'primaryEvidenceVersionId' IS DISTINCT FROM version_value#>'{subject,evidence,versionId}'
  OR version_value->'predecessor' IS DISTINCT FROM previous_pointer->'versionRef'
  OR (version_value->>'revision')::integer<>(previous_pointer->>'revision')::integer+1
  OR transition_value->'next' IS DISTINCT FROM jsonb_build_object('revision',version_value->'revision','state','accepted','versionRef',version_value->'reference') THEN
  RAISE EXCEPTION 'hrs1 prepared full binding invalid' USING ERRCODE='P7804';
 END IF;
 expected_version:=official_v3_result_private.ref_v1('rule-version',jsonb_build_object('decisionRef',proof_value#>'{decision,reference}',
  'operationId',version_value->'operationId','predecessor',previous_pointer->'versionRef','revision',version_value->'revision'));
 SELECT COALESCE(jsonb_agg(item.value#>'{resolution,reference}' ORDER BY item.ordinality),'[]'::jsonb) INTO resolutions
  FROM jsonb_array_elements(proof_value#>'{decision,knownConflicts}') WITH ORDINALITY item(value,ordinality) WHERE item.value->'resolution'<>'null'::jsonb;
 IF version_value->>'reference' IS DISTINCT FROM expected_version OR transition_value->'resolutionRefs' IS DISTINCT FROM resolutions
  OR transition_value->>'action' IS DISTINCT FROM (CASE WHEN previous_pointer->>'state' IN ('withdrawn','conflicted') THEN 'reaccept' ELSE 'accept' END) THEN
  RAISE EXCEPTION 'hrs1 exact I1 version required' USING ERRCODE='P7804';
 END IF;
END $$;
CREATE FUNCTION official_v3_result_private.transition_v1(q jsonb,b jsonb,epoch_value integer,deadline timestamptz,legal_day text,current_check boolean) RETURNS jsonb
LANGUAGE plpgsql VOLATILE PARALLEL UNSAFE SECURITY INVOKER CALLED ON NULL INPUT SET search_path=pg_catalog AS $$
DECLARE prepared_value jsonb:=q->'prepared'; proof_value jsonb; old_op official_v3_result_private.operations_v1%ROWTYPE;
 head_row official_v3_result_private.heads_v1%ROWTYPE; snapshot jsonb; expected_key text; original_proposal jsonb; result_value jsonb; at_time timestamptz;
 command_digest text:=official_v3_result_private.hash_v1(q-'expectedHead'); new_epoch bigint; new_generation bigint;
BEGIN
 SELECT stored.record INTO proof_value FROM official_v3_result_private.qualifications_v1 stored WHERE stored.reference=q->>'verificationRef' AND stored.kind='verification';
 IF proof_value IS NULL THEN RAISE EXCEPTION 'hrs1 actual verification required' USING ERRCODE='P7804'; END IF;
 PERFORM official_v3_result_private.verification_v1(proof_value,b,false);
 PERFORM official_v3_result_private.prepared_v1(prepared_value,proof_value,b);
 expected_key:=official_v3_result_private.ref_v1('version-commit',jsonb_build_object('planKey',official_v3_result_private.ref_v1('rule-operation',prepared_value->'transition'),'prepared',prepared_value));
 IF q->>'operationKey' IS DISTINCT FROM expected_key OR q#>'{intake,proposalDigest}' IS DISTINCT FROM prepared_value->'proposalDigest'
  OR q#>'{intake,binding,operationId}' IS DISTINCT FROM prepared_value#>'{transition,operationId}' THEN
  RAISE EXCEPTION 'hrs1 version operation mismatch' USING ERRCODE='P7804';
 END IF;
 original_proposal:=official_v3_result_private.consume_s1_v1(q->'intake',jsonb_build_object('status','prepared','value',prepared_value),b);
 IF prepared_value->>'proposalDisposition' IS DISTINCT FROM (CASE WHEN original_proposal->'proposedFact'=prepared_value#>'{version,subject,fact}' THEN 'matched' ELSE 'superseded_by_source' END) THEN
  RAISE EXCEPTION 'hrs1 proposal disposition mismatch' USING ERRCODE='P7804';
 END IF;
 SELECT * INTO head_row FROM official_v3_result_private.heads_v1 WHERE singleton;
 snapshot:=official_v3_result_private.state_v1();
 SELECT * INTO old_op FROM official_v3_result_private.operations_v1 stored WHERE stored.operation_kind='version' AND stored.operation_id=prepared_value#>>'{transition,operationId}';
 IF FOUND THEN
  IF old_op.operation_key<>expected_key OR old_op.command_digest<>command_digest THEN RETURN jsonb_build_object('status','collision'); END IF;
  result_value:=old_op.result->'confirmation';
  IF current_check THEN
   IF snapshot->'head' IS DISTINCT FROM q->'expectedHead'
    OR head_row.version_ref IS DISTINCT FROM prepared_value#>>'{version,reference}'
    OR head_row.suppression<>'null'::jsonb OR head_row.sticky_decision_ref IS NOT NULL
    OR head_row.suppression_epoch IS DISTINCT FROM (old_op.result->>'suppressionEpoch')::bigint THEN
    RETURN jsonb_build_object('status','not_current');
   END IF;
   PERFORM official_v3_result_private.fence_v1(b,epoch_value,deadline,legal_day,proof_value);
   RETURN jsonb_build_object('status','current','value',jsonb_build_object('operation',result_value,'head',snapshot->'head',
    'method',prepared_value#>'{transition,method}','checkedAt',official_v3_result_private.time_text_v1(clock_timestamp()),
    'legalDate',legal_day,'freshUntil',proof_value->'validUntilExclusive'));
  END IF;
  PERFORM official_v3_result_private.fence_v1(b,epoch_value,deadline,legal_day,proof_value);
  RETURN jsonb_build_object('status','committed','value',result_value);
 END IF;
 IF current_check THEN RETURN jsonb_build_object('status','not_current'); END IF;
 IF snapshot->'head' IS DISTINCT FROM q->'expectedHead' OR snapshot->'history' IS DISTINCT FROM proof_value->'history'
  OR snapshot->'stickyDecision' IS DISTINCT FROM proof_value->'stickyDecision'
  OR snapshot->'suppressionEpoch' IS DISTINCT FROM proof_value->'suppressionEpoch' THEN RETURN jsonb_build_object('status','stale_head'); END IF;
 PERFORM official_v3_result_private.fence_v1(b,epoch_value,deadline,legal_day,proof_value);
 PERFORM official_v3_result_private.keep_decision_v1(proof_value);
 at_time:=clock_timestamp(); new_epoch:=head_row.suppression_epoch+1; new_generation:=head_row.generation+1;
 IF new_epoch>9007199254740991 OR new_generation>9007199254740991 THEN RAISE EXCEPTION 'hrs1 counter exhausted' USING ERRCODE='P7804'; END IF;
 INSERT INTO official_v3_result_private.versions_v1(reference,revision,predecessor_ref,decision_ref,verification_ref,prepared,committed_at)
  VALUES(prepared_value#>>'{version,reference}',(prepared_value#>>'{version,revision}')::integer,prepared_value#>>'{version,predecessor}',
   prepared_value#>>'{decision,reference}',q->>'verificationRef',prepared_value,at_time);
 UPDATE official_v3_result_private.heads_v1 SET version_ref=prepared_value#>>'{version,reference}',decision_ref=prepared_value#>>'{decision,reference}',
  sticky_decision_ref=NULL,projection_ref=NULL,suppression='null'::jsonb,suppression_epoch=new_epoch,generation=new_generation WHERE singleton;
 result_value:=jsonb_build_object('operationId',prepared_value#>'{transition,operationId}','operationKey',expected_key,
  'versionRef',prepared_value#>'{version,reference}','sourceDecisionRef',prepared_value#>'{decision,reference}',
  'revision',prepared_value#>'{version,revision}','state','accepted',
  'auditRef',official_v3_result_private.ref_v1('rule-audit',jsonb_build_object('operationKey',expected_key,'prepared',prepared_value)),
  'committedAt',official_v3_result_private.time_text_v1(at_time),'historyArchive',prepared_value#>'{decision,historyArchive}',
  'invalidatedProjectionRefs',prepared_value#>'{transition,invalidatedProjectionRefs}');
 INSERT INTO official_v3_result_private.operations_v1(operation_kind,operation_id,operation_key,command_digest,command,result,head_generation,recorded_at)
  VALUES('version',prepared_value#>>'{transition,operationId}',expected_key,command_digest,q-'expectedHead',
   jsonb_build_object('confirmation',result_value,'suppressionEpoch',new_epoch),new_generation,at_time);
 -- Every write/unique/FK wait has completed. Any failure now aborts the whole transaction.
 PERFORM official_v3_result_private.assert_history_v1();
 PERFORM official_v3_result_private.fence_v1(b,epoch_value,deadline,legal_day,proof_value);
 RETURN jsonb_build_object('status','committed','value',result_value);
END $$;
CREATE FUNCTION official_v3_result_private.publication_v1(q jsonb,b jsonb,epoch_value integer,deadline timestamptz,legal_day text,confirm_only boolean) RETURNS jsonb
LANGUAGE plpgsql VOLATILE PARALLEL UNSAFE SECURITY INVOKER CALLED ON NULL INPUT SET search_path=pg_catalog AS $$
DECLARE prepared_value jsonb:=q->'prepared'; projection_value jsonb:=q->'projection'; proof_value jsonb;
 head_row official_v3_result_private.heads_v1%ROWTYPE; version_op official_v3_result_private.operations_v1%ROWTYPE;
 prior_op official_v3_result_private.operations_v1%ROWTYPE; expected_key text; expected_projection jsonb; desired_expiry timestamptz; at_time timestamptz;
BEGIN
 SELECT stored.record INTO proof_value FROM official_v3_result_private.qualifications_v1 stored WHERE stored.reference=q->>'verificationRef' AND stored.kind='verification';
 IF proof_value IS NULL THEN RAISE EXCEPTION 'hrs1 publication proof missing' USING ERRCODE='P7804'; END IF;
 PERFORM official_v3_result_private.verification_v1(proof_value,b,false); PERFORM official_v3_result_private.prepared_v1(prepared_value,proof_value,b);
 desired_expiry:=LEAST(official_v3_result_private.timestamp_v1(prepared_value#>>'{version,recordedAt}')+make_interval(secs=>(b->>'projectionMaxAgeMilliseconds')::integer/1000.0),
  official_v3_result_private.timestamp_v1(proof_value->>'validUntilExclusive'));
 expected_projection:=jsonb_build_object('schema',3,'kind','public_projection_record','rule',prepared_value->'version',
  'sourceCheckedAt',prepared_value#>'{version,subject,evidence,retrievedAt}','sourceFreshUntil',proof_value->'validUntilExclusive',
  'builtAt',prepared_value#>'{version,recordedAt}','expiresAt',official_v3_result_private.time_text_v1(desired_expiry));
 expected_projection:=expected_projection||jsonb_build_object('reference',official_v3_result_private.ref_v1('rule-projection',expected_projection));
 expected_key:=official_v3_result_private.ref_v1('projection-publish',jsonb_build_object('operationId',q->'operationId','prepared',prepared_value,'projection',expected_projection));
 IF projection_value IS DISTINCT FROM expected_projection OR q->>'operationKey' IS DISTINCT FROM expected_key
  OR q->'operationId' IS DISTINCT FROM prepared_value#>'{transition,operationId}'
  OR q#>'{intake,proposalDigest}' IS DISTINCT FROM prepared_value->'proposalDigest' THEN RAISE EXCEPTION 'hrs1 stable publication bytes required' USING ERRCODE='P7804'; END IF;
 PERFORM official_v3_result_private.consume_s1_v1(q->'intake',jsonb_build_object('status','prepared','value',prepared_value),b);
 SELECT * INTO head_row FROM official_v3_result_private.heads_v1 WHERE singleton;
 SELECT * INTO version_op FROM official_v3_result_private.operations_v1 stored WHERE stored.operation_kind='version' AND stored.operation_id=q->>'operationId';
 IF version_op.operation_id IS NULL OR version_op.command->'prepared' IS DISTINCT FROM prepared_value
  OR version_op.command->'verificationRef' IS DISTINCT FROM q->'verificationRef'
  OR head_row.version_ref IS DISTINCT FROM prepared_value#>>'{version,reference}' OR head_row.suppression<>'null'::jsonb
  OR head_row.sticky_decision_ref IS NOT NULL OR head_row.suppression_epoch IS DISTINCT FROM (version_op.result->>'suppressionEpoch')::bigint
  OR NOT EXISTS(SELECT 1 FROM official_v3_result_private.versions_v1 stored WHERE stored.reference=head_row.version_ref AND stored.prepared=prepared_value) THEN
  RETURN jsonb_build_object('status','not_current');
 END IF;
 SELECT * INTO prior_op FROM official_v3_result_private.operations_v1 stored WHERE stored.operation_kind='publication' AND stored.operation_id=q->>'operationId';
 IF FOUND THEN
  IF prior_op.operation_key<>expected_key OR prior_op.command_digest<>official_v3_result_private.hash_v1(q) THEN RETURN jsonb_build_object('status','collision'); END IF;
  IF head_row.projection_ref IS DISTINCT FROM projection_value->>'reference' OR NOT head_row.coverage
   OR NOT EXISTS(SELECT 1 FROM official_v3_result_private.projections_v1 stored WHERE stored.reference=head_row.projection_ref
     AND stored.record=projection_value AND stored.suppression_epoch=head_row.suppression_epoch) THEN RETURN jsonb_build_object('status','not_current'); END IF;
 ELSE
  IF confirm_only THEN RETURN jsonb_build_object('status','not_attempted'); END IF;
  PERFORM official_v3_result_private.fence_v1(b,epoch_value,LEAST(deadline,desired_expiry),legal_day,proof_value);
  at_time:=clock_timestamp();
  INSERT INTO official_v3_result_private.projections_v1(reference,version_ref,verification_ref,record,suppression_epoch,published_at)
   VALUES(projection_value->>'reference',head_row.version_ref,q->>'verificationRef',projection_value,head_row.suppression_epoch,at_time);
  UPDATE official_v3_result_private.heads_v1 SET projection_ref=projection_value->>'reference',coverage=true,generation=generation+1 WHERE singleton;
  INSERT INTO official_v3_result_private.operations_v1(operation_kind,operation_id,operation_key,command_digest,command,result,head_generation,recorded_at)
   VALUES('publication',q->>'operationId',expected_key,official_v3_result_private.hash_v1(q),q,
    jsonb_build_object('projectionRef',projection_value->'reference','versionRef',prepared_value#>'{version,reference}',
      'publishedAt',official_v3_result_private.time_text_v1(at_time),'freshUntil',proof_value->'validUntilExclusive'),head_row.generation+1,at_time);
 END IF;
 PERFORM official_v3_result_private.assert_history_v1();
 PERFORM official_v3_result_private.fence_v1(b,epoch_value,LEAST(deadline,desired_expiry),legal_day,proof_value);
 IF NOT confirm_only THEN RETURN jsonb_build_object('status','reported'); END IF;
 RETURN jsonb_build_object('status','confirmed','value',jsonb_build_object('operationId',q->'operationId','operationKey',q->'operationKey',
  'projectionRef',projection_value->'reference','versionRef',prepared_value#>'{version,reference}',
  'checkedAt',official_v3_result_private.time_text_v1(clock_timestamp()),'freshUntil',proof_value->'validUntilExclusive'));
END $$;
CREATE FUNCTION official_v3_result_private.escalation_v1(q jsonb,b jsonb,epoch_value integer,deadline timestamptz,legal_day text,confirm_only boolean) RETURNS jsonb
LANGUAGE plpgsql VOLATILE PARALLEL UNSAFE SECURITY INVOKER CALLED ON NULL INPUT SET search_path=pg_catalog AS $$
DECLARE outcome_value jsonb:=q->'outcome'; proof_value jsonb; proposal_value jsonb; snapshot jsonb;
 head_row official_v3_result_private.heads_v1%ROWTYPE; prior_op official_v3_result_private.operations_v1%ROWTYPE; expected_key text; at_time timestamptz; outcome_reply jsonb;
BEGIN
 SELECT stored.record INTO proof_value FROM official_v3_result_private.qualifications_v1 stored WHERE stored.reference=q->>'verificationRef' AND stored.kind='verification';
 IF proof_value IS NULL OR outcome_value->>'status' IS DISTINCT FROM 'escalation'
  OR outcome_value->'decision' IS DISTINCT FROM proof_value->'decision' OR outcome_value->'previousDecision' IS DISTINCT FROM proof_value->'previousDecision'
  OR outcome_value->'archiveAppend' IS DISTINCT FROM proof_value->'archiveAppend' OR (outcome_value->>'reason' IN ('primary_unclear','comparable_conflict')) IS NOT TRUE
  OR official_v3_result_private.exact_keys_v1(q->'upload',ARRAY['proposal','digest','bytes']) IS NOT TRUE
  OR q->'operationId' IS DISTINCT FROM q#>'{intake,binding,operationId}'
  OR q#>'{upload,digest}' IS DISTINCT FROM q#>'{intake,proposalDigest}' OR q#>'{upload,bytes}' IS DISTINCT FROM q#>'{intake,bytes}' THEN
  RAISE EXCEPTION 'hrs1 actual escalation custody required' USING ERRCODE='P7804';
 END IF;
 PERFORM official_v3_result_private.verification_v1(proof_value,b,false);
 expected_key:=official_v3_result_private.ref_v1('escalation-publish',jsonb_build_object('digest',q#>'{upload,digest}','outcome',outcome_value));
 IF q->>'operationKey' IS DISTINCT FROM expected_key THEN RAISE EXCEPTION 'hrs1 escalation operation mismatch' USING ERRCODE='P7804'; END IF;
 proposal_value:=official_v3_result_private.consume_s1_v1(q->'intake',outcome_value,b);
 IF proposal_value IS DISTINCT FROM q#>'{upload,proposal}' THEN RAISE EXCEPTION 'hrs1 escalation upload mismatch' USING ERRCODE='P7804'; END IF;
 outcome_reply:=jsonb_build_object('operationKey',expected_key,'escalationKey',outcome_value->'key');
 SELECT * INTO prior_op FROM official_v3_result_private.operations_v1 stored WHERE stored.operation_kind='escalation' AND stored.operation_id=q->>'operationId';
 IF FOUND THEN
  IF prior_op.operation_key<>expected_key OR prior_op.command_digest<>official_v3_result_private.hash_v1(q) THEN RETURN jsonb_build_object('status','collision'); END IF;
  -- Historical confirmation performs no new suppression and cannot erase a later resolution.
  PERFORM official_v3_result_private.fence_v1(b,epoch_value,deadline,legal_day,proof_value);
  RETURN jsonb_build_object('status',CASE WHEN confirm_only THEN 'confirmed' ELSE 'reported' END,'value',outcome_reply);
 END IF;
 IF confirm_only THEN RETURN jsonb_build_object('status','not_attempted'); END IF;
 snapshot:=official_v3_result_private.state_v1();
 IF snapshot->'history' IS DISTINCT FROM proof_value->'history' OR snapshot->'stickyDecision' IS DISTINCT FROM proof_value->'stickyDecision'
  OR snapshot->'suppressionEpoch' IS DISTINCT FROM proof_value->'suppressionEpoch' THEN RETURN jsonb_build_object('status','not_current'); END IF;
 SELECT * INTO head_row FROM official_v3_result_private.heads_v1 WHERE singleton;
 PERFORM official_v3_result_private.fence_v1(b,epoch_value,deadline,legal_day,proof_value);
 PERFORM official_v3_result_private.keep_decision_v1(proof_value);
 at_time:=clock_timestamp();
 UPDATE official_v3_result_private.heads_v1 SET sticky_decision_ref=outcome_value#>>'{decision,reference}',
  suppression=jsonb_build_object('reason',outcome_value->'reason','decisionRef',outcome_value#>'{decision,reference}','operationId',q->'operationId'),
  suppression_epoch=suppression_epoch+1,generation=generation+1 WHERE singleton;
 INSERT INTO official_v3_result_private.operations_v1(operation_kind,operation_id,operation_key,command_digest,command,result,head_generation,recorded_at)
  VALUES('escalation',q->>'operationId',expected_key,official_v3_result_private.hash_v1(q),q,outcome_reply,head_row.generation+1,at_time);
 -- Deliberately late component: an actual outbox write wait/failure rolls back
 -- the already written decision, archive, sticky suppression and operation too.
 INSERT INTO official_v3_result_private.outbox_v1(escalation_key,decision_ref,operation_kind,operation_id,record,recorded_at)
  SELECT outcome_value->>'key',outcome_value#>>'{decision,reference}','escalation',q->>'operationId',outcome_value,at_time
  WHERE NOT EXISTS(SELECT 1 FROM official_v3_result_private.outbox_v1 stored WHERE stored.escalation_key=outcome_value->>'key');
 PERFORM official_v3_result_private.assert_history_v1();
 PERFORM official_v3_result_private.fence_v1(b,epoch_value,deadline,legal_day,proof_value);
 RETURN jsonb_build_object('status','reported');
END $$;


CREATE FUNCTION official_v3_result_private.projection_binding_v1(p jsonb) RETURNS jsonb
LANGUAGE sql IMMUTABLE PARALLEL UNSAFE SECURITY INVOKER CALLED ON NULL INPUT SET search_path=pg_catalog AS $$
 SELECT jsonb_build_object('projectionRef',p->'reference','projectionHash',official_v3_result_private.hash_v1(p),
  'versionRef',p#>'{rule,reference}','revision',p#>'{rule,revision}','contextKey',p#>'{rule,subject,contextKey}',
  'factKind',p#>'{rule,subject,fact,fact,kind}','method',p#>'{rule,method}',
  'sourceDecisionRef',p#>'{rule,sourceDecisionRef}','evidenceVersionId',p#>'{rule,subject,evidence,versionId}',
  'sourceFreshUntil',p->'sourceFreshUntil')
$$;
CREATE FUNCTION official_v3_result_private.current_projection_v1(b jsonb,legal_day text) RETURNS jsonb
LANGUAGE plpgsql VOLATILE PARALLEL UNSAFE SECURITY INVOKER CALLED ON NULL INPUT SET search_path=pg_catalog AS $$
DECLARE head_row official_v3_result_private.heads_v1%ROWTYPE; stored official_v3_result_private.projections_v1%ROWTYPE;
 proof_value jsonb; validity jsonb; actual_now timestamptz:=clock_timestamp();
BEGIN
 SELECT * INTO head_row FROM official_v3_result_private.heads_v1 WHERE singleton;
 IF NOT FOUND THEN RAISE EXCEPTION 'hrs1 selected head absent' USING ERRCODE='P7803'; END IF;
 IF head_row.suppression<>'null'::jsonb OR head_row.sticky_decision_ref IS NOT NULL OR head_row.projection_ref IS NULL THEN RETURN NULL; END IF;
 SELECT * INTO stored FROM official_v3_result_private.projections_v1 p WHERE p.reference=head_row.projection_ref;
 IF NOT FOUND OR stored.version_ref IS DISTINCT FROM head_row.version_ref OR stored.suppression_epoch<>head_row.suppression_epoch
  OR stored.record#>>'{rule,sourceDecisionRef}' IS DISTINCT FROM head_row.decision_ref THEN
  RAISE EXCEPTION 'hrs1 projection pointer history mismatch' USING ERRCODE='P7803';
 END IF;
 SELECT q.record INTO proof_value FROM official_v3_result_private.qualifications_v1 q WHERE q.reference=stored.verification_ref AND q.kind='verification';
 IF proof_value IS NULL OR stored.record->>'reference' IS DISTINCT FROM official_v3_result_private.ref_v1('rule-projection',stored.record-'reference')
  OR stored.record#>'{rule,subject,context}' IS DISTINCT FROM b->'context'
  OR stored.record#>'{rule,method}' IS DISTINCT FROM jsonb_build_object('methodId',b->'methodId','revision',b->'revision')
  OR stored.record#>>'{rule,state}' IS DISTINCT FROM 'accepted'
  OR stored.record#>>'{rule,sourceDecisionRef}' IS DISTINCT FROM proof_value#>>'{decision,reference}' THEN
  RAISE EXCEPTION 'hrs1 retained projection binding invalid' USING ERRCODE='P7803';
 END IF;
 validity:=stored.record#>'{rule,subject,evidence,legalValidity}';
 IF actual_now>=official_v3_result_private.timestamp_v1(stored.record->>'expiresAt')
  OR actual_now>=official_v3_result_private.timestamp_v1(stored.record->>'sourceFreshUntil')
  OR actual_now>=official_v3_result_private.timestamp_v1(proof_value->>'validUntilExclusive')
  OR actual_now<official_v3_result_private.timestamp_v1(stored.record->>'builtAt')
  OR validity->>'status' IS DISTINCT FROM 'specified'
  OR (validity->>'validFrom' IS NOT NULL AND validity->>'validFrom'>legal_day)
  OR (validity->>'validUntil' IS NOT NULL AND validity->>'validUntil'<legal_day) THEN RETURN NULL; END IF;
 RETURN stored.record;
END $$;
CREATE FUNCTION official_v3_result_private.plan_v1(b jsonb) RETURNS jsonb
LANGUAGE plpgsql STABLE PARALLEL UNSAFE SECURITY INVOKER CALLED ON NULL INPUT SET search_path=pg_catalog AS $$
DECLARE head_row official_v3_result_private.heads_v1%ROWTYPE; version_row official_v3_result_private.versions_v1%ROWTYPE;
 proof_value jsonb; decision_value jsonb; source_value jsonb; ev jsonb; conflict_value text;
 next_check timestamptz; targets jsonb:='[]'; projected jsonb;
BEGIN
 SELECT * INTO head_row FROM official_v3_result_private.heads_v1 WHERE singleton;
 IF NOT FOUND THEN RAISE EXCEPTION 'hrs1 monitor head absent' USING ERRCODE='P7803'; END IF;
 SELECT s.next_check_at INTO next_check FROM official_v3_result_private.monitor_schedule_v1 s WHERE singleton;
 IF next_check IS NULL THEN RAISE EXCEPTION 'hrs1 monitor schedule absent' USING ERRCODE='P7803'; END IF;
 IF head_row.version_ref IS NOT NULL THEN
  SELECT * INTO version_row FROM official_v3_result_private.versions_v1 v WHERE v.reference=head_row.version_ref;
  SELECT q.record INTO proof_value FROM official_v3_result_private.qualifications_v1 q WHERE q.reference=version_row.verification_ref AND q.kind='verification';
  SELECT d.record INTO decision_value FROM official_v3_result_private.decisions_v1 d
    WHERE d.reference=COALESCE(head_row.sticky_decision_ref,head_row.decision_ref);
  IF version_row.reference IS NULL OR proof_value IS NULL OR decision_value IS NULL THEN
   RAISE EXCEPTION 'hrs1 monitor durable history incomplete' USING ERRCODE='P7803';
  END IF;
  SELECT c.value->>'reference' INTO conflict_value FROM jsonb_array_elements(decision_value->'knownConflicts') c
    WHERE c.value->'resolution'='null'::jsonb ORDER BY c.value->>'reference' LIMIT 1;
  projected:=CASE WHEN head_row.projection_ref IS NULL THEN '[]'::jsonb ELSE jsonb_build_array(head_row.projection_ref) END;
  FOR source_value IN SELECT value FROM jsonb_array_elements(b->'sources') ORDER BY CASE WHEN value->>'role'='primary' THEN 0 ELSE 1 END,value#>>'{source,sourceId}' LOOP
   ev:=NULL;
   IF source_value->>'role'='primary' THEN
    ev:=version_row.prepared#>'{version,subject,evidence}';
    IF ev->'source' IS DISTINCT FROM source_value->'source' THEN RAISE EXCEPTION 'hrs1 selected primary differs from accepted original' USING ERRCODE='P7803'; END IF;
   ELSE
    SELECT attempt.value#>'{observation,evidence}' INTO ev FROM jsonb_array_elements(proof_value#>'{decision,counterCheck,attempts}') attempt
     WHERE attempt.value#>'{observation,evidence,source}'=source_value->'source'
     ORDER BY attempt.value->>'attemptedAt' DESC,attempt.value#>>'{observation,evidence,versionId}' LIMIT 1;
    IF ev IS NULL THEN CONTINUE; END IF;
   END IF;
   IF NOT EXISTS(SELECT 1 FROM official_v3_result_private.originals_v1 original_row
    JOIN official_v3_result_private.extractions_v1 extraction_row USING(version_id)
    WHERE original_row.version_id=ev->>'versionId' AND original_row.evidence=ev
      AND extraction_row.record#>'{observation,evidence}'=ev) THEN
    RAISE EXCEPTION 'hrs1 monitor baseline original missing' USING ERRCODE='P7803';
   END IF;
   targets:=targets||jsonb_build_array(jsonb_build_object('context',b->'context','factKind',b->'factKind','source',source_value->'source',
    'role',source_value->'role','baseline',jsonb_build_object('sourceContentHash',ev->'sourceContentHash','sourceFingerprintProtocol',ev->'sourceFingerprintProtocol'),
    'nextCheckAt',official_v3_result_private.time_text_v1(next_check),'primaryFreshUntil',proof_value->'validUntilExclusive',
    'expectedVersionRef',head_row.version_ref,'sourceDecisionRef',decision_value->'reference','projectionRefs',projected,
    'knownUnresolvedConflictRef',conflict_value));
  END LOOP;
 END IF;
 RETURN jsonb_build_object('generation',head_row.generation,'plan',jsonb_build_object('method',
  jsonb_build_object('methodId',b->'methodId','revision',b->'revision'),'targets',targets,'attemptLimit',b->'attemptLimit'));
END $$;
CREATE FUNCTION official_v3_result_private.plan_current_v1(generation_value bigint,target_value jsonb,b jsonb) RETURNS boolean
LANGUAGE plpgsql STABLE PARALLEL UNSAFE SECURITY INVOKER CALLED ON NULL INPUT SET search_path=pg_catalog AS $$
DECLARE plan_value jsonb:=official_v3_result_private.plan_v1(b); current_generation bigint:=(plan_value->>'generation')::bigint;
BEGIN
 IF generation_value<0 OR generation_value>current_generation OR NOT EXISTS(
  SELECT 1 FROM jsonb_array_elements(plan_value#>'{plan,targets}') target_row WHERE target_row.value=target_value) THEN RETURN false; END IF;
 IF current_generation=generation_value THEN RETURN true; END IF;
 -- Only this exact monitor head's own suppressions can advance during its pass.
 -- A version/publication/escalation or any unjournalled generation closes it.
 IF (SELECT count(*) FROM official_v3_result_private.operations_v1 o
   WHERE o.head_generation>generation_value AND o.head_generation<=current_generation
     AND o.operation_kind IN ('version','publication','escalation','suppression'))<>current_generation-generation_value
  OR EXISTS(SELECT 1 FROM official_v3_result_private.operations_v1 o
   WHERE o.head_generation>generation_value AND o.head_generation<=current_generation
     AND o.operation_kind IN ('version','publication','escalation','suppression')
     AND (o.operation_kind<>'suppression'
       OR o.command#>'{effect,expectedVersionRef}' IS DISTINCT FROM target_value->'expectedVersionRef'
       OR o.command#>'{effect,sourceDecisionRef}' IS DISTINCT FROM target_value->'sourceDecisionRef'
       OR o.command#>'{effect,projectionRefs}' IS DISTINCT FROM target_value->'projectionRefs'
       OR (o.command->>'generation')::bigint<>generation_value)) THEN RETURN false; END IF;
 RETURN true;
END $$;
CREATE FUNCTION official_v3_result_private.suppress_v1(q jsonb,b jsonb,epoch_value integer,deadline timestamptz,legal_day text) RETURNS jsonb
LANGUAGE plpgsql VOLATILE PARALLEL UNSAFE SECURITY INVOKER CALLED ON NULL INPUT SET search_path=pg_catalog AS $$
DECLARE effect_value jsonb:=q->'effect'; target_value jsonb; plan_value jsonb:=official_v3_result_private.plan_v1(b);
 observation_value jsonb; observation_expiry timestamptz; prior official_v3_result_private.operations_v1%ROWTYPE;
 seed jsonb; audit_value text; escalation_value text; expected_effect jsonb; reason_value text:=effect_value->>'reason';
 head_row official_v3_result_private.heads_v1%ROWTYPE; at_time timestamptz:=clock_timestamp(); original_evidence jsonb;
BEGIN
 IF official_v3_result_private.exact_keys_v1(effect_value,ARRAY['operationId','auditRef','contextKey','expectedVersionRef','sourceDecisionRef',
  'reason','projectionRefs','escalationKey','observedAt']) IS NOT TRUE
  OR (reason_value IN ('known_conflict','primary_unclear','expired','source_changed')) IS NOT TRUE
  OR effect_value->'contextKey' IS DISTINCT FROM b->'contextKey'
  OR official_v3_result_private.timestamp_v1(effect_value->>'observedAt')>at_time THEN
  RAISE EXCEPTION 'hrs1 suppression shape invalid' USING ERRCODE='P7804';
 END IF;
 IF q->'observationRef'<>'null'::jsonb THEN
  SELECT stored.record,stored.valid_until INTO observation_value,observation_expiry FROM official_v3_result_private.qualifications_v1 stored
   WHERE stored.reference=q->>'observationRef' AND stored.kind='observation';
  IF observation_value IS NULL THEN RAISE EXCEPTION 'hrs1 suppression original custody absent' USING ERRCODE='P7804'; END IF;
 END IF;
 SELECT t.value INTO target_value FROM jsonb_array_elements(plan_value#>'{plan,targets}') t
  WHERE t.value->'expectedVersionRef'=effect_value->'expectedVersionRef'
   AND t.value->'sourceDecisionRef'=effect_value->'sourceDecisionRef' AND t.value->'projectionRefs'=effect_value->'projectionRefs'
   AND (reason_value NOT IN ('primary_unclear','source_changed') OR
     t.value->>'role'='primary' AND t.value=observation_value->'target')
  ORDER BY CASE WHEN t.value->>'role'='primary' THEN 0 ELSE 1 END,t.value#>>'{source,sourceId}' LIMIT 1;
 IF target_value IS NULL OR NOT official_v3_result_private.plan_current_v1((q->>'generation')::bigint,target_value,b) THEN
  RETURN jsonb_build_object('status','stale_head');
 END IF;
 seed:=jsonb_build_object('contextKey',b->'contextKey','method',jsonb_build_object('methodId',b->'methodId','revision',b->'revision'),
  'expectedVersionRef',target_value->'expectedVersionRef','sourceDecisionRef',target_value->'sourceDecisionRef',
  'reason',reason_value,'conflict',target_value->'knownUnresolvedConflictRef');
 audit_value:=official_v3_result_private.ref_v1('projection-suppression',seed||jsonb_build_object('projectionRefs',
  (SELECT COALESCE(jsonb_agg(value ORDER BY value),'[]'::jsonb) FROM jsonb_array_elements(target_value->'projectionRefs'))));
 escalation_value:=CASE WHEN reason_value IN ('expired','source_changed') THEN NULL ELSE official_v3_result_private.ref_v1('source-escalation',seed) END;
 expected_effect:=jsonb_build_object('operationId','op3_'||left(right(audit_value,64),32),
  'auditRef',audit_value,'contextKey',b->'contextKey','expectedVersionRef',target_value->'expectedVersionRef',
  'sourceDecisionRef',target_value->'sourceDecisionRef','reason',reason_value,'projectionRefs',target_value->'projectionRefs',
  'escalationKey',escalation_value,'observedAt',effect_value->'observedAt');
 IF effect_value IS DISTINCT FROM expected_effect THEN RAISE EXCEPTION 'hrs1 stable suppression key mismatch' USING ERRCODE='P7804'; END IF;
 SELECT * INTO prior FROM official_v3_result_private.operations_v1 o WHERE o.operation_kind='suppression' AND o.operation_id=effect_value->>'operationId';
 IF FOUND THEN
  IF prior.operation_key<>audit_value OR prior.command_digest<>official_v3_result_private.hash_v1(q) THEN RETURN jsonb_build_object('status','collision'); END IF;
  PERFORM official_v3_result_private.fence_v1(b,epoch_value,deadline,legal_day);
  RETURN jsonb_build_object('status','confirmed','value',jsonb_build_object('auditRef',audit_value));
 END IF;
 IF reason_value='known_conflict' THEN
  IF target_value->'knownUnresolvedConflictRef'='null'::jsonb THEN RAISE EXCEPTION 'hrs1 actual unresolved conflict required' USING ERRCODE='P7804'; END IF;
 ELSIF reason_value='expired' THEN
  IF official_v3_result_private.timestamp_v1(target_value->>'primaryFreshUntil')>at_time THEN RAISE EXCEPTION 'hrs1 primary is not expired' USING ERRCODE='P7804'; END IF;
 ELSE
  IF observation_value->'target' IS DISTINCT FROM target_value OR observation_value->'method' IS DISTINCT FROM jsonb_build_object('methodId',b->'methodId','revision',b->'revision')
   OR observation_expiry<=at_time OR official_v3_result_private.timestamp_v1(observation_value->>'checkedAt')>at_time
   OR (reason_value='primary_unclear' AND (observation_value->>'status' IS DISTINCT FROM 'unclear' OR observation_value#>'{original,observation}' IS DISTINCT FROM 'null'::jsonb))
   OR (reason_value='source_changed' AND (observation_value->>'status' IS DISTINCT FROM 'observed' OR observation_value#>'{original,observation}'='null'::jsonb
      OR observation_value#>'{observation,fingerprint,sourceFingerprintProtocol}' IS DISTINCT FROM target_value#>'{baseline,sourceFingerprintProtocol}'
      OR (observation_value#>>'{observation,fingerprint,sourceFingerprintProtocol}' IN ('1','2')) IS NOT TRUE
      OR observation_value#>'{observation,fingerprint,sourceContentHash}' IS NOT DISTINCT FROM target_value#>'{baseline,sourceContentHash}')) THEN
   RAISE EXCEPTION 'hrs1 actual observed primary change required' USING ERRCODE='P7804';
  END IF;
  original_evidence:=official_v3_result_private.original_v1(observation_value->'original',b);
  IF observation_value#>'{observation,source}' IS DISTINCT FROM original_evidence->'source'
   OR observation_value#>'{observation,fingerprint}' IS DISTINCT FROM jsonb_build_object('sourceContentHash',original_evidence->'sourceContentHash',
    'sourceFingerprintProtocol',original_evidence->'sourceFingerprintProtocol') THEN
   RAISE EXCEPTION 'hrs1 observation bytes do not bind suppression' USING ERRCODE='P7804';
  END IF;
 END IF;
 PERFORM official_v3_result_private.fence_v1(b,epoch_value,LEAST(deadline,COALESCE(observation_expiry,deadline)),legal_day);
 SELECT * INTO head_row FROM official_v3_result_private.heads_v1 WHERE singleton;
 UPDATE official_v3_result_private.heads_v1 SET suppression=jsonb_build_object('reason',reason_value,'decisionRef',target_value->'sourceDecisionRef',
   'operationId',effect_value->'operationId','auditRef',audit_value),suppression_epoch=suppression_epoch+1,generation=generation+1 WHERE singleton;
 INSERT INTO official_v3_result_private.operations_v1(operation_kind,operation_id,operation_key,command_digest,command,result,head_generation,recorded_at)
  VALUES('suppression',effect_value->>'operationId',audit_value,official_v3_result_private.hash_v1(q),q,
   jsonb_build_object('auditRef',audit_value),head_row.generation+1,at_time);
 IF escalation_value IS NOT NULL THEN
  INSERT INTO official_v3_result_private.outbox_v1(escalation_key,decision_ref,operation_kind,operation_id,record,recorded_at)
   SELECT escalation_value,target_value->>'sourceDecisionRef','suppression',effect_value->>'operationId',effect_value,at_time
   WHERE NOT EXISTS(SELECT 1 FROM official_v3_result_private.outbox_v1 stored WHERE stored.escalation_key=escalation_value);
 END IF;
 PERFORM official_v3_result_private.assert_history_v1();
 PERFORM official_v3_result_private.fence_v1(b,epoch_value,LEAST(deadline,COALESCE(observation_expiry,deadline)),legal_day);
 RETURN jsonb_build_object('status','confirmed','value',jsonb_build_object('auditRef',audit_value));
END $$;
CREATE FUNCTION official_v3_result_private.monitor_claim_v1(q jsonb,b jsonb,epoch_value integer,deadline timestamptz,legal_day text) RETURNS jsonb
LANGUAGE plpgsql VOLATILE PARALLEL UNSAFE SECURITY INVOKER CALLED ON NULL INPUT SET search_path=pg_catalog AS $$
DECLARE schedule_row official_v3_result_private.monitor_schedule_v1%ROWTYPE; prior official_v3_result_private.operations_v1%ROWTYPE;
 expected_key text; at_time timestamptz:=clock_timestamp(); lease_end timestamptz; plan_value jsonb; reply_value jsonb;
 initial_research boolean; head_generation bigint;
BEGIN
 IF (q->>'operationId' ~ '^op3_[a-f0-9]{32}$') IS NOT TRUE OR (q->>'claimId' ~ '^hrsclaim1_[a-f0-9]{32}$') IS NOT TRUE THEN
  RAISE EXCEPTION 'hrs1 monitor claim identity invalid' USING ERRCODE='P7804';
 END IF;
 expected_key:=official_v3_result_private.ref_v1('hrs1-monitor-claim',q);
 SELECT * INTO schedule_row FROM official_v3_result_private.monitor_schedule_v1 WHERE singleton FOR UPDATE;
 SELECT * INTO prior FROM official_v3_result_private.operations_v1 o WHERE o.operation_kind='monitor_claim' AND o.operation_id=q->>'operationId';
 IF FOUND THEN
  IF prior.operation_key<>expected_key OR prior.command_digest<>official_v3_result_private.hash_v1(q) THEN RETURN jsonb_build_object('status','collision'); END IF;
  IF schedule_row.claimed_by IS DISTINCT FROM q->>'claimId' OR schedule_row.generation<>(prior.result->>'generation')::bigint
    OR schedule_row.lease_until<=at_time THEN RETURN jsonb_build_object('status','not_current'); END IF;
  IF prior.result->'initialResearch'='true'::jsonb AND NOT EXISTS(
    SELECT 1 FROM official_v3_result_private.heads_v1 head_row WHERE head_row.singleton AND head_row.version_ref IS NULL
      AND head_row.generation=(prior.result->>'planGeneration')::bigint) THEN
   RETURN jsonb_build_object('status','not_current');
  END IF;
  PERFORM official_v3_result_private.fence_v1(b,epoch_value,LEAST(deadline,schedule_row.lease_until),legal_day);
  RETURN jsonb_build_object('status','claimed','value',prior.result);
 END IF;
 IF schedule_row.next_check_at>at_time OR schedule_row.lease_until>at_time THEN RETURN jsonb_build_object('status','busy'); END IF;
 plan_value:=official_v3_result_private.plan_v1(b);
 SELECT head_row.version_ref IS NULL,head_row.generation INTO STRICT initial_research,head_generation
  FROM official_v3_result_private.heads_v1 head_row WHERE head_row.singleton;
 IF head_generation IS DISTINCT FROM (plan_value->>'generation')::bigint THEN
  RAISE EXCEPTION 'hrs1 monitor claim head changed' USING ERRCODE='P7805';
 END IF;
 lease_end:=LEAST(at_time+make_interval(secs=>(b->>'monitorLeaseMilliseconds')::integer/1000.0),
  official_v3_result_private.timestamp_v1(b->>'activeUntilExclusive'));
 reply_value:=jsonb_build_object('claimId',q->'claimId','generation',schedule_row.generation+1,
  'leaseUntil',official_v3_result_private.time_text_v1(lease_end),'planGeneration',plan_value->'generation','plan',plan_value->'plan',
  'initialResearch',initial_research);
 UPDATE official_v3_result_private.monitor_schedule_v1 SET generation=generation+1,claimed_by=q->>'claimId',
  claim_operation=q->>'operationId',lease_until=lease_end,outcomes='[]'::jsonb,finish_operation=NULL WHERE singleton;
 INSERT INTO official_v3_result_private.operations_v1(operation_kind,operation_id,operation_key,command_digest,command,result,head_generation,recorded_at)
  VALUES('monitor_claim',q->>'operationId',expected_key,official_v3_result_private.hash_v1(q),q,reply_value,(plan_value->>'generation')::bigint,at_time);
 PERFORM official_v3_result_private.fence_v1(b,epoch_value,LEAST(deadline,lease_end),legal_day);
 RETURN jsonb_build_object('status','claimed','value',reply_value);
END $$;
CREATE FUNCTION official_v3_result_private.monitor_finish_v1(q jsonb,b jsonb,epoch_value integer,deadline timestamptz,legal_day text) RETURNS jsonb
LANGUAGE plpgsql VOLATILE PARALLEL UNSAFE SECURITY INVOKER CALLED ON NULL INPUT SET search_path=pg_catalog AS $$
DECLARE schedule_row official_v3_result_private.monitor_schedule_v1%ROWTYPE; prior official_v3_result_private.operations_v1%ROWTYPE;
 expected_key text; at_time timestamptz:=clock_timestamp(); next_time timestamptz; reply_value jsonb; outcome_value jsonb; selected_head bigint;
BEGIN
 IF (q->>'operationId' ~ '^op3_[a-f0-9]{32}$') IS NOT TRUE OR (q->>'claimId' ~ '^hrsclaim1_[a-f0-9]{32}$') IS NOT TRUE
  OR jsonb_typeof(q->'generation')<>'number' OR (q->>'generation' ~ '^[0-9]+$') IS NOT TRUE
  OR jsonb_typeof(q->'outcomes')<>'array' OR jsonb_array_length(q->'outcomes')>16 THEN
  RAISE EXCEPTION 'hrs1 monitor finish identity invalid' USING ERRCODE='P7804';
 END IF;
 FOR outcome_value IN SELECT value FROM jsonb_array_elements(q->'outcomes') LOOP
  IF jsonb_typeof(outcome_value)<>'object' OR NOT outcome_value ?& ARRAY['contextKey','sourceId','status','ruleChange']
   OR EXISTS(SELECT 1 FROM jsonb_object_keys(outcome_value) key WHERE key<>ALL(ARRAY['contextKey','sourceId','status','ruleChange','auditRef','jobKey']))
   OR outcome_value->'contextKey' IS DISTINCT FROM b->'contextKey' OR outcome_value->>'ruleChange' IS DISTINCT FROM 'not_asserted'
   OR (outcome_value->>'status' IN ('unchanged','research_queued','already_researched','optional_unreachable','source_unavailable',
    'suppressed','unconfirmed','unavailable','not_due','invalid')) IS NOT TRUE
   OR NOT EXISTS(SELECT 1 FROM jsonb_array_elements(b->'sources') source_value WHERE source_value.value#>'{source,sourceId}'=outcome_value->'sourceId')
   OR (outcome_value ? 'auditRef' AND (outcome_value->>'auditRef' ~ '^projection-suppression:v3:[a-f0-9]{64}$') IS NOT TRUE)
   OR (outcome_value ? 'jobKey' AND (outcome_value->>'jobKey' ~ '^research-job:v3:[a-f0-9]{64}$') IS NOT TRUE) THEN
   RAISE EXCEPTION 'hrs1 monitor outcome shape invalid' USING ERRCODE='P7804';
  END IF;
 END LOOP;
 expected_key:=official_v3_result_private.ref_v1('hrs1-monitor-finish',q);
 SELECT * INTO schedule_row FROM official_v3_result_private.monitor_schedule_v1 WHERE singleton FOR UPDATE;
 SELECT * INTO prior FROM official_v3_result_private.operations_v1 o WHERE o.operation_kind='monitor_finish' AND o.operation_id=q->>'operationId';
 IF FOUND THEN
  IF prior.operation_key<>expected_key OR prior.command_digest<>official_v3_result_private.hash_v1(q) THEN RETURN jsonb_build_object('status','collision'); END IF;
  PERFORM official_v3_result_private.fence_v1(b,epoch_value,deadline,legal_day);
  RETURN jsonb_build_object('status','finished','value',prior.result);
 END IF;
 IF schedule_row.claimed_by IS DISTINCT FROM q->>'claimId' OR schedule_row.generation<>(q->>'generation')::bigint
  OR schedule_row.lease_until<=at_time THEN RETURN jsonb_build_object('status','not_current'); END IF;
 next_time:=at_time+make_interval(secs=>(b->>'monitorIntervalMilliseconds')::integer/1000.0);
 reply_value:=jsonb_build_object('generation',schedule_row.generation,'nextCheckAt',official_v3_result_private.time_text_v1(next_time));
 SELECT generation INTO selected_head FROM official_v3_result_private.heads_v1 WHERE singleton;
 UPDATE official_v3_result_private.monitor_schedule_v1 SET claimed_by=NULL,lease_until=NULL,outcomes=q->'outcomes',
  finish_operation=q->>'operationId',next_check_at=next_time WHERE singleton;
 INSERT INTO official_v3_result_private.operations_v1(operation_kind,operation_id,operation_key,command_digest,command,result,head_generation,recorded_at)
  VALUES('monitor_finish',q->>'operationId',expected_key,official_v3_result_private.hash_v1(q),q,reply_value,selected_head,at_time);
 PERFORM official_v3_result_private.fence_v1(b,epoch_value,LEAST(deadline,schedule_row.lease_until),legal_day);
 RETURN jsonb_build_object('status','finished','value',reply_value);
END $$;


CREATE FUNCTION official_v3_result_private.command_v1(wire_value jsonb,b jsonb) RETURNS jsonb
LANGUAGE plpgsql IMMUTABLE PARALLEL UNSAFE SECURITY INVOKER CALLED ON NULL INPUT SET search_path=pg_catalog AS $$
DECLARE fields text[]; operation_value text:=wire_value->>'operation';
BEGIN
 IF wire_value IS NULL OR octet_length(wire_value::text)>4194304
  OR official_v3_result_private.data_nodes_v1(wire_value,0,32,65536)<0
  OR official_v3_result_private.exact_keys_v1(wire_value,ARRAY['schema','operation','bindingHash','body']) IS NOT TRUE
  OR wire_value->'schema' IS DISTINCT FROM '1'::jsonb
  OR wire_value->>'bindingHash' IS DISTINCT FROM official_v3_result_private.hash_v1(b)
  OR octet_length(official_v3_result_private.canonical_v1(wire_value,0))>2097152 THEN
  RAISE EXCEPTION 'hrs1 bounded command invalid' USING ERRCODE='P7804';
 END IF;
 fields:=CASE operation_value
  WHEN 'attest' THEN ARRAY['kind','verification']
  WHEN 'history' THEN ARRAY['contextKey','factKind']
  WHEN 'evidence' THEN ARRAY['reference']
  WHEN 'head' THEN ARRAY['contextKey','factKind']
  WHEN 'version_confirm' THEN ARRAY['operationId','operationKey']
  WHEN 'transition' THEN ARRAY['operationKey','prepared','expectedHead','verificationRef','intake']
  WHEN 'transition_current' THEN ARRAY['operationKey','prepared','expectedHead','verificationRef','intake']
  WHEN 'publication' THEN ARRAY['operationId','operationKey','prepared','projection','verificationRef','intake']
  WHEN 'publication_confirm' THEN ARRAY['operationId','operationKey','prepared','projection','verificationRef','intake']
  WHEN 'escalation' THEN ARRAY['operationId','operationKey','upload','outcome','verificationRef','intake']
  WHEN 'escalation_confirm' THEN ARRAY['operationId','operationKey','upload','outcome','verificationRef','intake']
  WHEN 'coverage' THEN ARRAY['destinationCountryCode','citizenshipCountryCode']
  WHEN 'projection' THEN ARRAY['key']
  WHEN 'projection_current' THEN ARRAY['binding']
  WHEN 'projection_batch' THEN ARRAY['bindings']
  WHEN 'plan' THEN ARRAY[]::text[]
  WHEN 'plan_reprove' THEN ARRAY['generation','target']
  WHEN 'suppress' THEN ARRAY['effect','generation','observationRef']
  WHEN 'suppression_confirm' THEN ARRAY['operationId','auditRef']
  WHEN 'monitor_claim' THEN ARRAY['operationId','claimId']
  WHEN 'monitor_finish' THEN ARRAY['operationId','claimId','generation','outcomes']
  ELSE NULL END;
 IF fields IS NULL OR official_v3_result_private.exact_keys_v1(wire_value->'body',fields) IS NOT TRUE THEN
  RAISE EXCEPTION 'hrs1 fixed operation shape invalid' USING ERRCODE='P7804';
 END IF;
 RETURN wire_value->'body';
END $$;
CREATE FUNCTION official_v3_result_private.dispatch_v1(channel_value text,wire_value jsonb,binding_hash_value text,
 method_id_value text,revision_value integer,method_digest_value text,package_digest_value text,
 epoch_value integer,remaining_ms_value integer,not_after_value text,legal_day_value text) RETURNS jsonb
LANGUAGE plpgsql VOLATILE PARALLEL UNSAFE SECURITY INVOKER CALLED ON NULL INPUT SET search_path=pg_catalog SET jit=off AS $$
DECLARE b jsonb:=official_v3_result_private.selected_binding_v1(); q jsonb; operation_value text:=wire_value->>'operation';
 expected_channel text; deadline timestamptz; actual_now timestamptz:=clock_timestamp(); reply_value jsonb; proof_value jsonb;
 head_row official_v3_result_private.heads_v1%ROWTYPE; original_operation official_v3_result_private.operations_v1%ROWTYPE;
 projection_value jsonb; projection_binding jsonb; requested jsonb; key_value jsonb; refs jsonb:='[]'; public_reader boolean;
BEGIN
 IF b IS NULL OR current_setting('transaction_isolation')<>'read committed'
  OR binding_hash_value IS DISTINCT FROM official_v3_result_private.hash_v1(b)
  OR method_id_value IS DISTINCT FROM b->>'methodId' OR revision_value IS DISTINCT FROM (b->>'revision')::integer
  OR method_digest_value IS DISTINCT FROM b->>'methodDigest' OR package_digest_value IS DISTINCT FROM b->>'packageDigest'
  OR epoch_value IS NULL OR epoch_value<1 OR remaining_ms_value IS NULL OR remaining_ms_value NOT BETWEEN 1 AND 5000
  OR official_v3_result_private.civil_date_v1(legal_day_value) IS NOT TRUE THEN
  RAISE EXCEPTION 'hrs1 selected fixed invocation invalid' USING ERRCODE='P7804';
 END IF;
 q:=official_v3_result_private.command_v1(wire_value,b);
 expected_channel:=CASE WHEN operation_value='attest' THEN 'attest'
  WHEN operation_value IN ('transition','publication','escalation','suppress','monitor_claim','monitor_finish') THEN 'execute' ELSE 'read' END;
 public_reader:=session_user='ot_v3_result_reader';
 IF channel_value IS DISTINCT FROM expected_channel OR NOT(
  channel_value='attest' AND session_user='ot_v3_result_verifier'
  OR channel_value='execute' AND session_user='ot_v3_result_writer'
  OR channel_value='read' AND (session_user='ot_v3_result_writer'
    OR public_reader AND operation_value IN ('coverage','projection','projection_current','projection_batch'))) THEN
  RAISE EXCEPTION 'hrs1 wrong dedicated channel identity' USING ERRCODE='42501';
 END IF;
 deadline:=LEAST(official_v3_result_private.timestamp_v1(not_after_value),
  actual_now+make_interval(secs=>remaining_ms_value/1000.0));
 IF NOT isfinite(deadline) OR deadline<=actual_now THEN RAISE EXCEPTION 'hrs1 original deadline ended' USING ERRCODE='P7806'; END IF;
 PERFORM set_config('lock_timeout',remaining_ms_value::text||'ms',true);
 PERFORM set_config('statement_timeout',remaining_ms_value::text||'ms',true);
 PERFORM set_config('idle_in_transaction_session_timeout',remaining_ms_value::text||'ms',true);
 -- Same selected head, then the actual original MA1 lock, for all channels.
 -- A reader waits for any in-progress write and checks freshness after that wait.
 IF channel_value IN ('execute','attest') THEN
  PERFORM pg_advisory_xact_lock(771105,2);
  SELECT * INTO head_row FROM official_v3_result_private.heads_v1 WHERE singleton FOR UPDATE;
 ELSE
  PERFORM pg_advisory_xact_lock_shared(771105,2);
  SELECT * INTO head_row FROM official_v3_result_private.heads_v1 WHERE singleton FOR SHARE;
 END IF;
 IF NOT FOUND THEN RAISE EXCEPTION 'hrs1 selected durable head absent' USING ERRCODE='P7803'; END IF;
 PERFORM official_v3_result_private.fence_v1(b,epoch_value,deadline,legal_day_value);
 PERFORM official_v3_result_private.assert_catalog_v1();
 PERFORM official_v3_result_private.assert_history_v1();
 IF operation_value IN ('history','head') THEN
  IF q->'contextKey' IS DISTINCT FROM b->'contextKey' OR q->'factKind' IS DISTINCT FROM b->'factKind' THEN
   RAISE EXCEPTION 'hrs1 context read mismatch' USING ERRCODE='P7804';
  END IF;
  reply_value:=CASE WHEN operation_value='history' THEN jsonb_build_object('status','snapshot','value',official_v3_result_private.state_v1())
   ELSE jsonb_build_object('status','current','value',official_v3_result_private.state_v1()->'head') END;
 ELSIF operation_value='evidence' THEN
  IF (q->>'reference' ~ '^hrs1-(verification|decision-custody):v3:[a-f0-9]{64}$') IS NOT TRUE THEN
   RAISE EXCEPTION 'hrs1 private evidence key invalid' USING ERRCODE='P7804';
  END IF;
  SELECT stored.record INTO proof_value FROM official_v3_result_private.qualifications_v1 stored
   WHERE stored.kind='verification' AND (stored.reference=q->>'reference' OR stored.decision_content_key=q->>'reference');
  IF proof_value IS NULL THEN reply_value:=jsonb_build_object('status','missing');
  ELSE
   PERFORM official_v3_result_private.verification_v1(proof_value,b,false);
   PERFORM official_v3_result_private.fence_v1(b,epoch_value,deadline,legal_day_value,proof_value);
   reply_value:=jsonb_build_object('status','inspected','value',proof_value);
  END IF;
 ELSIF operation_value='attest' THEN
  reply_value:=official_v3_result_private.attest_v1(q,b,epoch_value,deadline,legal_day_value);
 ELSIF operation_value='version_confirm' THEN
  IF (q->>'operationId' ~ '^op3_[a-f0-9]{32}$') IS NOT TRUE
   OR (q->>'operationKey' ~ '^version-commit:v3:[a-f0-9]{64}$') IS NOT TRUE THEN
   RAISE EXCEPTION 'hrs1 version confirmation key invalid' USING ERRCODE='P7804';
  END IF;
  SELECT * INTO original_operation FROM official_v3_result_private.operations_v1 stored
   WHERE stored.operation_kind='version' AND stored.operation_id=q->>'operationId';
  reply_value:=CASE WHEN NOT FOUND THEN jsonb_build_object('status','not_attempted')
   WHEN original_operation.operation_key<>q->>'operationKey' THEN jsonb_build_object('status','collision')
   ELSE jsonb_build_object('status','committed','value',original_operation.result->'confirmation') END;
 ELSIF operation_value IN ('transition','transition_current') THEN
  reply_value:=official_v3_result_private.transition_v1(q,b,epoch_value,deadline,legal_day_value,operation_value='transition_current');
 ELSIF operation_value IN ('publication','publication_confirm') THEN
  reply_value:=official_v3_result_private.publication_v1(q,b,epoch_value,deadline,legal_day_value,operation_value='publication_confirm');
 ELSIF operation_value IN ('escalation','escalation_confirm') THEN
  reply_value:=official_v3_result_private.escalation_v1(q,b,epoch_value,deadline,legal_day_value,operation_value='escalation_confirm');
 ELSIF operation_value='coverage' THEN
  IF (q->>'destinationCountryCode' ~ '^[A-Z]{2}$') IS NOT TRUE OR (q->>'citizenshipCountryCode' ~ '^[A-Z]{2}$') IS NOT TRUE THEN
   RAISE EXCEPTION 'hrs1 coverage pair invalid' USING ERRCODE='P7804';
  END IF;
  reply_value:=jsonb_build_object('status','current','value',CASE WHEN head_row.coverage
   AND q->>'destinationCountryCode'='DE' AND q->>'citizenshipCountryCode'='CH'
   THEN jsonb_build_array(jsonb_build_object('context',b->'context','factKind',b->'factKind')) ELSE '[]'::jsonb END);
 ELSIF operation_value IN ('projection','projection_current','projection_batch') THEN
  projection_value:=official_v3_result_private.current_projection_v1(b,legal_day_value);
  IF projection_value IS NOT NULL THEN projection_binding:=official_v3_result_private.projection_binding_v1(projection_value); END IF;
  IF operation_value='projection' THEN
   key_value:=jsonb_build_object('destinationCountryCode','DE','citizenshipCountryCode','CH','contextKey',b->'contextKey','factKind',b->'factKind',
     'method',jsonb_build_object('methodId',b->'methodId','revision',b->'revision'));
   IF q->'key' IS DISTINCT FROM key_value THEN RAISE EXCEPTION 'hrs1 public cache key mismatch' USING ERRCODE='P7804'; END IF;
   reply_value:=CASE WHEN projection_value IS NULL THEN jsonb_build_object('status','missing')
    ELSE jsonb_build_object('status','current','value',jsonb_build_array(projection_value)) END;
  ELSIF operation_value='projection_current' THEN
   IF projection_value IS NOT NULL AND projection_binding=q->'binding' THEN
    reply_value:=jsonb_build_object('status','current','value',projection_binding);
   ELSIF head_row.suppression->>'reason' IN ('known_conflict','comparable_conflict','primary_unclear') THEN
    reply_value:=jsonb_build_object('status','conflict','value',jsonb_build_object('decisionRef',head_row.suppression->'decisionRef',
      'reason',CASE WHEN head_row.suppression->>'reason'='primary_unclear' THEN 'primary_unclear' ELSE 'comparable_conflict' END));
   ELSE reply_value:=jsonb_build_object('status','missing'); END IF;
  ELSE
   IF jsonb_typeof(q->'bindings')<>'array' OR jsonb_array_length(q->'bindings')>16
    OR (SELECT count(DISTINCT value) FROM jsonb_array_elements(q->'bindings'))<>jsonb_array_length(q->'bindings') THEN
    RAISE EXCEPTION 'hrs1 finite projection batch invalid' USING ERRCODE='P7804';
   END IF;
   FOR requested IN SELECT value FROM jsonb_array_elements(q->'bindings') LOOP
    IF projection_value IS NULL OR requested IS DISTINCT FROM projection_binding THEN
     reply_value:=jsonb_build_object('status','not_current'); EXIT;
    END IF;
    refs:=refs||jsonb_build_array(projection_value->'reference');
   END LOOP;
   IF reply_value IS NULL THEN reply_value:=jsonb_build_object('status','confirmed','value',refs); END IF;
  END IF;
  IF projection_value IS NOT NULL THEN
   SELECT stored.record INTO proof_value FROM official_v3_result_private.qualifications_v1 stored
    JOIN official_v3_result_private.projections_v1 p ON p.verification_ref=stored.reference
    WHERE p.reference=projection_value->>'reference' AND stored.kind='verification';
   PERFORM official_v3_result_private.fence_v1(b,epoch_value,LEAST(deadline,
    official_v3_result_private.timestamp_v1(projection_value->>'expiresAt'),
    official_v3_result_private.timestamp_v1(projection_value->>'sourceFreshUntil')),legal_day_value,proof_value);
  END IF;
 ELSIF operation_value='plan' THEN
  reply_value:=jsonb_build_object('status','snapshot','value',official_v3_result_private.plan_v1(b));
 ELSIF operation_value='plan_reprove' THEN
  IF (q->>'generation' ~ '^(0|[1-9][0-9]{0,15})$') IS NOT TRUE THEN RAISE EXCEPTION 'hrs1 plan generation invalid' USING ERRCODE='P7804'; END IF;
  reply_value:=CASE WHEN official_v3_result_private.plan_current_v1((q->>'generation')::bigint,q->'target',b)
   THEN jsonb_build_object('status','current','value',q) ELSE jsonb_build_object('status','not_current') END;
 ELSIF operation_value='suppress' THEN
  IF (q->>'generation' ~ '^(0|[1-9][0-9]{0,15})$') IS NOT TRUE THEN RAISE EXCEPTION 'hrs1 suppression generation invalid' USING ERRCODE='P7804'; END IF;
  reply_value:=official_v3_result_private.suppress_v1(q,b,epoch_value,deadline,legal_day_value);
 ELSIF operation_value='suppression_confirm' THEN
  IF (q->>'operationId' ~ '^op3_[a-f0-9]{32}$') IS NOT TRUE
   OR (q->>'auditRef' ~ '^projection-suppression:v3:[a-f0-9]{64}$') IS NOT TRUE THEN
   RAISE EXCEPTION 'hrs1 suppression confirmation key invalid' USING ERRCODE='P7804';
  END IF;
  SELECT * INTO original_operation FROM official_v3_result_private.operations_v1 stored
   WHERE stored.operation_kind='suppression' AND stored.operation_id=q->>'operationId';
  reply_value:=CASE WHEN NOT FOUND THEN jsonb_build_object('status','not_attempted')
   WHEN original_operation.operation_key<>q->>'auditRef' THEN jsonb_build_object('status','collision')
   ELSE jsonb_build_object('status','confirmed','value',jsonb_build_object('auditRef',q->'auditRef')) END;
 ELSIF operation_value='monitor_claim' THEN
  reply_value:=official_v3_result_private.monitor_claim_v1(q,b,epoch_value,deadline,legal_day_value);
 ELSIF operation_value='monitor_finish' THEN
  reply_value:=official_v3_result_private.monitor_finish_v1(q,b,epoch_value,deadline,legal_day_value);
 ELSE RAISE EXCEPTION 'hrs1 operation not selected' USING ERRCODE='P7804';
 END IF;
 IF reply_value IS NULL OR octet_length(official_v3_result_private.canonical_v1(reply_value,0))>2097152 THEN
  RAISE EXCEPTION 'hrs1 response invalid or unbounded' USING ERRCODE='P7804';
 END IF;
 PERFORM official_v3_result_private.assert_catalog_v1();
 PERFORM official_v3_result_private.assert_history_v1();
 PERFORM official_v3_result_private.fence_v1(b,epoch_value,deadline,legal_day_value);
 RETURN reply_value;
END $$;

-- Three fixed public APIs; no runtime table or private-schema grant.
CREATE FUNCTION official_v3_result_api.attest_v1(wire_value jsonb,binding_hash_value text,method_id_value text,
 revision_value integer,method_digest_value text,package_digest_value text,epoch_value integer,
 remaining_ms_value integer,not_after_value text,legal_day_value text) RETURNS jsonb
LANGUAGE sql VOLATILE PARALLEL UNSAFE SECURITY DEFINER CALLED ON NULL INPUT SET search_path=pg_catalog
RETURN official_v3_result_private.dispatch_v1('attest'::text,wire_value,binding_hash_value,method_id_value,revision_value,
 method_digest_value,package_digest_value,epoch_value,remaining_ms_value,not_after_value,legal_day_value);
CREATE FUNCTION official_v3_result_api.execute_v1(wire_value jsonb,binding_hash_value text,method_id_value text,
 revision_value integer,method_digest_value text,package_digest_value text,epoch_value integer,
 remaining_ms_value integer,not_after_value text,legal_day_value text) RETURNS jsonb
LANGUAGE sql VOLATILE PARALLEL UNSAFE SECURITY DEFINER CALLED ON NULL INPUT SET search_path=pg_catalog
RETURN official_v3_result_private.dispatch_v1('execute'::text,wire_value,binding_hash_value,method_id_value,revision_value,
 method_digest_value,package_digest_value,epoch_value,remaining_ms_value,not_after_value,legal_day_value);
CREATE FUNCTION official_v3_result_api.read_v1(wire_value jsonb,binding_hash_value text,method_id_value text,
 revision_value integer,method_digest_value text,package_digest_value text,epoch_value integer,
 remaining_ms_value integer,not_after_value text,legal_day_value text) RETURNS jsonb
LANGUAGE sql VOLATILE PARALLEL UNSAFE SECURITY DEFINER CALLED ON NULL INPUT SET search_path=pg_catalog
RETURN official_v3_result_private.dispatch_v1('read'::text,wire_value,binding_hash_value,method_id_value,revision_value,
 method_digest_value,package_digest_value,epoch_value,remaining_ms_value,not_after_value,legal_day_value);

REVOKE ALL ON ALL FUNCTIONS IN SCHEMA official_v3_result_private,official_v3_result_api FROM PUBLIC RESTRICT;
REVOKE ALL ON ALL TABLES IN SCHEMA official_v3_result_private FROM PUBLIC RESTRICT;
GRANT EXECUTE ON FUNCTION official_v3_result_api.attest_v1(jsonb,text,text,integer,text,text,integer,integer,text,text) TO ot_v3_result_verifier;
GRANT EXECUTE ON FUNCTION official_v3_result_api.execute_v1(jsonb,text,text,integer,text,text,integer,integer,text,text) TO ot_v3_result_writer;
GRANT EXECUTE ON FUNCTION official_v3_result_api.read_v1(jsonb,text,text,integer,text,text,integer,integer,text,text) TO ot_v3_result_writer,ot_v3_result_reader;

DO $hrs1_policy_and_immutability$
DECLARE table_name text;
BEGIN
 FOREACH table_name IN ARRAY ARRAY['binding_v1','originals_v1','extractions_v1','qualifications_v1','decisions_v1','archive_pages_v1',
  'versions_v1','heads_v1','projections_v1','operations_v1','outbox_v1','monitor_schedule_v1'] LOOP
  EXECUTE format('ALTER TABLE official_v3_result_private.%I ENABLE ROW LEVEL SECURITY',table_name);
  EXECUTE format('ALTER TABLE official_v3_result_private.%I FORCE ROW LEVEL SECURITY',table_name);
  EXECUTE format('CREATE POLICY hrs1_owner ON official_v3_result_private.%I FOR ALL TO ot_v3_result_owner USING (true) WITH CHECK (true)',table_name);
  EXECUTE format('CREATE TRIGGER hrs1_immutable_row BEFORE UPDATE OR DELETE ON official_v3_result_private.%I FOR EACH ROW EXECUTE FUNCTION official_v3_result_private.immutable_v1()',table_name);
  EXECUTE format('CREATE TRIGGER hrs1_immutable_truncate BEFORE TRUNCATE ON official_v3_result_private.%I FOR EACH STATEMENT EXECUTE FUNCTION official_v3_result_private.immutable_v1()',table_name);
 END LOOP;
END $hrs1_policy_and_immutability$;

-- Temporary namespace/SET rights exist only during this transaction.
GRANT USAGE,CREATE ON SCHEMA official_v3_result_private TO postgres,ot_v3_intake_owner;
RESET ROLE;
CREATE FUNCTION official_v3_result_private.ma1_require_current_locked_v1(m text,r integer,d text,p text,e integer) RETURNS void
LANGUAGE sql VOLATILE PARALLEL UNSAFE SECURITY DEFINER CALLED ON NULL INPUT SET search_path=pg_catalog
RETURN official_v3_method_private.require_current_locked_v1(m,r,d,p,e);
REVOKE ALL ON FUNCTION official_v3_result_private.ma1_require_current_locked_v1(text,integer,text,text,integer) FROM PUBLIC RESTRICT;
GRANT EXECUTE ON FUNCTION official_v3_result_private.ma1_require_current_locked_v1(text,integer,text,text,integer) TO ot_v3_result_owner;
GRANT ot_v3_intake_owner TO postgres WITH ADMIN FALSE, INHERIT FALSE, SET TRUE GRANTED BY postgres;
DO $hrs1_intake_edge$
BEGIN
 IF (SELECT count(*) FROM pg_catalog.pg_auth_members m WHERE m.roleid='ot_v3_intake_owner'::regrole
  OR m.member='ot_v3_intake_owner'::regrole OR m.grantor='ot_v3_intake_owner'::regrole)<>2
  OR (SELECT count(*) FROM pg_catalog.pg_auth_members m WHERE m.roleid='ot_v3_intake_owner'::regrole AND m.member='postgres'::regrole
   AND (m.grantor=10 AND m.admin_option AND NOT m.inherit_option AND NOT m.set_option
    OR m.grantor='postgres'::regrole AND NOT m.admin_option AND NOT m.inherit_option AND m.set_option))<>2 THEN
  RAISE EXCEPTION 'hrs1 exact temporary intake SET edge required' USING ERRCODE='P7802';
 END IF;
END $hrs1_intake_edge$;
SET LOCAL ROLE ot_v3_intake_owner;
CREATE FUNCTION official_v3_result_private.s1_read_locked_v1(b jsonb,d text,n integer) RETURNS jsonb
LANGUAGE sql VOLATILE PARALLEL UNSAFE SECURITY DEFINER CALLED ON NULL INPUT SET search_path=pg_catalog
RETURN official_v3_intake_api.read_v1(b,d,n);
REVOKE ALL ON FUNCTION official_v3_result_private.s1_read_locked_v1(jsonb,text,integer) FROM PUBLIC RESTRICT;
GRANT EXECUTE ON FUNCTION official_v3_result_private.s1_read_locked_v1(jsonb,text,integer) TO ot_v3_result_owner;
RESET ROLE;
REVOKE ot_v3_intake_owner FROM postgres GRANTED BY postgres RESTRICT;
SET LOCAL ROLE ot_v3_result_owner;
REVOKE ALL ON SCHEMA official_v3_result_private FROM postgres,ot_v3_intake_owner RESTRICT;
DO $hrs1_function_inventory$
DECLARE expected_function record; function_row pg_catalog.pg_proc%ROWTYPE; expected_types oid[]; allowed_grantees oid[];
 target_oid oid; target_types oid[]; target_name text; namespace_oid oid; owner_oid oid; expected_dependency_count integer;
BEGIN
 IF (SELECT count(*) FROM pg_catalog.pg_proc f JOIN pg_catalog.pg_namespace ns ON ns.oid=f.pronamespace
  WHERE ns.nspname IN ('official_v3_result_private','official_v3_result_api'))<>55 THEN
  RAISE EXCEPTION 'hrs1 exact function count' USING ERRCODE='P7802';
 END IF;
 FOR expected_function IN SELECT * FROM (VALUES
  ('official_v3_result_private','exact_keys_v1','jsonb,_text',ARRAY['v','expected']::text[],'bool','sql','i',false,'ot_v3_result_owner','search_path=pg_catalog, pg_temp',0,NULL::text,'ee7cf54b133b5ba633b55372c6f98b06058d3fbc4ffe8bda08813fc77865cc33',NULL::text,NULL::text,ARRAY['ot_v3_result_owner']::text[]),
  ('official_v3_result_private','nodes_v1','jsonb,int4,int4,int4',ARRAY['v','d','max_d','max_n']::text[],'int4','plpgsql','i',false,'ot_v3_result_owner','search_path=pg_catalog, pg_temp',0,NULL::text,'d2bf4eb545e4c0453f4511ed6585a7643b440ba58dfc35ff1192feeae72941e3',NULL::text,NULL::text,ARRAY['ot_v3_result_owner']::text[]),
  ('official_v3_result_private','canonical_v1','jsonb,int4',ARRAY['v','d']::text[],'text','plpgsql','i',false,'ot_v3_result_owner','search_path=pg_catalog, pg_temp',0,NULL::text,'8e7603943fbb64a7641c169196cc2d49690ddf2e6290b15cfc98a9f90d8e58a2',NULL::text,NULL::text,ARRAY['ot_v3_result_owner']::text[]),
  ('official_v3_result_private','civil_date_v1','text',ARRAY['t']::text[],'bool','plpgsql','i',false,'ot_v3_result_owner','search_path=pg_catalog, pg_temp',0,NULL::text,'fd5ada592127225a2d995658a74f0ba58bd5b4e7e65301a9d656a07d50eb7ea8',NULL::text,NULL::text,ARRAY['ot_v3_result_owner']::text[]),
  ('official_v3_result_private','timestamp_v1','text',ARRAY['t']::text[],'timestamptz','plpgsql','i',false,'ot_v3_result_owner','search_path=pg_catalog, pg_temp',0,NULL::text,'d2139f87c826b7eaaa7846b9812a6e056240d79650f365aad2733efb2947613c',NULL::text,NULL::text,ARRAY['ot_v3_result_owner']::text[]),
  ('official_v3_result_private','predicate_v1','jsonb',ARRAY['v']::text[],'jsonb','plpgsql','i',false,'ot_v3_result_owner','search_path=pg_catalog, pg_temp',0,NULL::text,'28c043c0fc46032e63286c74bc91945c0ed9eeff1a4a09a99263038f9450b4af',NULL::text,NULL::text,ARRAY['ot_v3_result_owner']::text[]),
  ('official_v3_result_private','expression_v1','jsonb,bool,int4',ARRAY['v','strip_support','d']::text[],'jsonb','plpgsql','i',false,'ot_v3_result_owner','search_path=pg_catalog, pg_temp',0,NULL::text,'f68a30dc702d07b13c07142c2208410ac39e077f8ecc2695f392d774e12bdb03',NULL::text,NULL::text,ARRAY['ot_v3_result_owner']::text[]),
  ('official_v3_result_private','context_v1','jsonb',ARRAY['v']::text[],'jsonb','plpgsql','i',false,'ot_v3_result_owner','search_path=pg_catalog, pg_temp',0,NULL::text,'2468eee17b3168220355a5e5b73e6e06517d97ddab05922b5c7cf9377d511033',NULL::text,NULL::text,ARRAY['ot_v3_result_owner']::text[]),
  ('official_v3_result_private','subject_v1','text,jsonb',ARRAY['kind','v']::text[],'jsonb','plpgsql','i',false,'ot_v3_result_owner','search_path=pg_catalog, pg_temp',0,NULL::text,'33f82eebaf249fb6943b8487c7dd29adfcb0c36be12e185255b3b884e4482548',NULL::text,NULL::text,ARRAY['ot_v3_result_owner']::text[]),
  ('official_v3_result_private','reference_v1','jsonb',ARRAY['v']::text[],'jsonb','plpgsql','i',false,'ot_v3_result_owner','search_path=pg_catalog, pg_temp',0,NULL::text,'4e23eb880cfe724da64bdb0f3a395dacbff593e1bf6b20560e623b55cc441974',NULL::text,NULL::text,ARRAY['ot_v3_result_owner']::text[]),
  ('official_v3_result_private','safe_data_v1','jsonb,int4',ARRAY['v','depth']::text[],'bool','plpgsql','i',false,'ot_v3_result_owner','search_path=pg_catalog',1,'0','fb0338ad099a3849e03670618b22b09e4e91a0f750c760a1a36a51c4fb929292',NULL::text,NULL::text,ARRAY['ot_v3_result_owner']::text[]),
  ('official_v3_result_private','unique_json_v1','json,int4',ARRAY['v','depth']::text[],'bool','plpgsql','i',false,'ot_v3_result_owner','search_path=pg_catalog',1,'0','4ce9ae66bc89ec89dd5f684dcb36b8306e04dd9a2d73dc0576e0d8e70932fa83',NULL::text,NULL::text,ARRAY['ot_v3_result_owner']::text[]),
  ('official_v3_result_private','proposal_shape_v1','',NULL::text[],'jsonb','sql','i',false,'ot_v3_result_owner','search_path=pg_catalog',0,NULL::text,'4ba4184c3733a3849ebf450822f37b46187931f916635c905ca5a3e3704231a9',NULL::text,NULL::text,ARRAY['ot_v3_result_owner']::text[]),
  ('official_v3_result_private','data_nodes_v1','jsonb,int4,int4,int4',ARRAY['v','depth','max_depth','max_nodes']::text[],'int4','plpgsql','i',false,'ot_v3_result_owner','search_path=pg_catalog',3,'0, 16, 8192','6aa78c456638b6fb9a291ff7a5ce2593f730027cc8eadf95e6043e2d72f1cf90',NULL::text,NULL::text,ARRAY['ot_v3_result_owner']::text[]),
  ('official_v3_result_private','shape_matches_v1','jsonb,jsonb,jsonb,jsonb,int4',ARRAY['v','s','defs','countries','depth']::text[],'bool','plpgsql','i',false,'ot_v3_result_owner','search_path=pg_catalog',1,'0','4b558e73233251f166c11558d8426f2956433a5dfe079acdd0090d40b3ee2181',NULL::text,NULL::text,ARRAY['ot_v3_result_owner']::text[]),
  ('official_v3_result_private','proposal_retainable_v1','jsonb',ARRAY['v']::text[],'bool','plpgsql','i',false,'ot_v3_result_owner','search_path=pg_catalog',0,NULL::text,'9264fea3daaddb89d01aea123a1d7fc83aa83cdfe78689281fbda198f46eb4dc',NULL::text,NULL::text,ARRAY['ot_v3_result_owner']::text[]),
  ('official_v3_result_private','validate_s1_copy_v1','jsonb,jsonb,jsonb,text',ARRAY['reply','job','result','purpose']::text[],'void','plpgsql','v',false,'ot_v3_result_owner','search_path=pg_catalog, pg_temp',0,NULL::text,'343bee988dd465557620d5211bde7017bdf236569f2705e31edcf840c8822e06',NULL::text,NULL::text,ARRAY['ot_v3_result_owner']::text[]),
  ('official_v3_result_private','immutable_v1','',NULL::text[],'trigger','plpgsql','v',false,'ot_v3_result_owner','search_path=pg_catalog',0,NULL::text,'510b2e846162da437c9d0989015c449b6f8435e1e6eae91356f23ec5aafc827f',NULL::text,NULL::text,ARRAY['ot_v3_result_owner']::text[]),
  ('official_v3_result_private','hash_v1','jsonb',ARRAY['v']::text[],'text','sql','i',false,'ot_v3_result_owner','search_path=pg_catalog',0,NULL::text,'6a7d2ac8da921bb8553fcf00d9c5823aad51c9f0d7b965d733f86405f7d812a7',NULL::text,NULL::text,ARRAY['ot_v3_result_owner']::text[]),
  ('official_v3_result_private','ref_v1','text,jsonb',ARRAY['kind','v']::text[],'text','sql','i',false,'ot_v3_result_owner','search_path=pg_catalog',0,NULL::text,'a4b35b5651099a7373d08ff29b809a3a6c21a97199c564bfad1d4c8558ad6010',NULL::text,NULL::text,ARRAY['ot_v3_result_owner']::text[]),
  ('official_v3_result_private','time_text_v1','timestamptz',ARRAY['v']::text[],'text','sql','i',false,'ot_v3_result_owner','search_path=pg_catalog',0,NULL::text,'f07bb7b06d64d88c0d2f3ad3bed101439bb95eda8147e5616e54252ba598804d',NULL::text,NULL::text,ARRAY['ot_v3_result_owner']::text[]),
  ('official_v3_result_private','s1_shape_v1','jsonb,text',ARRAY['v','tag']::text[],'bool','sql','i',false,'ot_v3_result_owner','search_path=pg_catalog',0,NULL::text,'841d087a3a3cf4a29b9e698589707d65a82d72431e55944300afef543f32de91',NULL::text,NULL::text,ARRAY['ot_v3_result_owner']::text[]),
  ('official_v3_result_private','record_shape_v1','jsonb,text',ARRAY['v','tag']::text[],'bool','sql','i',false,'ot_v3_result_owner','search_path=pg_catalog',0,NULL::text,'6d18053b7c43efb8887bffdb14ab0e9a85547dcee9bc331c5783af9ea8793ec2',NULL::text,NULL::text,ARRAY['ot_v3_result_owner']::text[]),
  ('official_v3_result_private','binding_valid_v1','jsonb',ARRAY['b']::text[],'bool','plpgsql','s',false,'ot_v3_result_owner','search_path=pg_catalog',0,NULL::text,'00ce3331c7c10b824f7ca53b23b4a9ce5eb40b597832a3cc76cc74bbac452079',NULL::text,NULL::text,ARRAY['ot_v3_result_owner']::text[]),
  ('official_v3_result_private','catalog_v1','',NULL::text[],'jsonb','sql','s',false,'ot_v3_result_owner','search_path=pg_catalog',0,NULL::text,'ac8151dc90ec603ea9170b3527b749fd488bb144474fe6c6cc1ee16f9168bbf1',NULL::text,NULL::text,ARRAY['ot_v3_result_owner']::text[]),
  ('official_v3_result_private','assert_catalog_v1','',NULL::text[],'void','plpgsql','v',false,'ot_v3_result_owner','search_path=pg_catalog',0,NULL::text,'0126d96e6d154e9875f39ddc53f8f81f5696825e3e94ff677179cac5604950f6',NULL::text,NULL::text,ARRAY['ot_v3_result_owner']::text[]),
  ('official_v3_result_private','selected_binding_v1','',NULL::text[],'jsonb','sql','s',false,'ot_v3_result_owner','search_path=pg_catalog',0,NULL::text,'07c52251c1bf1f38b251ed6cb33d834c7319cd7e7b43e14e44a478695043daad',NULL::text,NULL::text,ARRAY['ot_v3_result_owner']::text[]),
  ('official_v3_result_private','state_v1','',NULL::text[],'jsonb','plpgsql','s',false,'ot_v3_result_owner','search_path=pg_catalog',0,NULL::text,'1f181715fa3cb5a84b9fb6fad2658c92138b8e1ac0bed03de0a5d47b1df1b701',NULL::text,NULL::text,ARRAY['ot_v3_result_owner']::text[]),
  ('official_v3_result_private','assert_history_v1','',NULL::text[],'void','plpgsql','v',false,'ot_v3_result_owner','search_path=pg_catalog',0,NULL::text,'9454a79fdebfce4cb63c60bb404bf6321a9fe7c09b825e9f6ce32e750f225c3a',NULL::text,NULL::text,ARRAY['ot_v3_result_owner']::text[]),
  ('official_v3_result_private','original_v1','jsonb,jsonb',ARRAY['o','b']::text[],'jsonb','plpgsql','s',false,'ot_v3_result_owner','search_path=pg_catalog',0,NULL::text,'357efc28a494fa8e002683e760cff7e7c8c05035914c5f40f5931272e0990e3d',NULL::text,NULL::text,ARRAY['ot_v3_result_owner']::text[]),
  ('official_v3_result_private','observations_v1','jsonb',ARRAY['v']::text[],'jsonb','sql','i',false,'ot_v3_result_owner','search_path=pg_catalog',0,NULL::text,'f6be0f59dbcc0795f2afdf85f2bd13f7eae358f8782a3cfd01737890c713613a',NULL::text,NULL::text,ARRAY['ot_v3_result_owner']::text[]),
  ('official_v3_result_private','verification_v1','jsonb,jsonb,bool',ARRAY['v','b','require_current']::text[],'void','plpgsql','v',false,'ot_v3_result_owner','search_path=pg_catalog',0,NULL::text,'c3c1bda8bc1403bdb48423f454d5ea2fa324e6bea84127729b80b31f71c302d4',NULL::text,NULL::text,ARRAY['ot_v3_result_owner']::text[]),
  ('official_v3_result_private','fence_v1','jsonb,int4,timestamptz,text,jsonb',ARRAY['b','epoch_value','deadline','legal_day','verification_value']::text[],'void','plpgsql','v',false,'ot_v3_result_owner','search_path=pg_catalog',1,'NULL::jsonb','0a1813c8c4b290f07e7ac47db92c39880b53241dcd96ae6276c7fd4a31e39963',NULL::text,NULL::text,ARRAY['ot_v3_result_owner']::text[]),
  ('official_v3_result_private','keep_original_v1','jsonb,jsonb',ARRAY['o','b']::text[],'text','plpgsql','v',false,'ot_v3_result_owner','search_path=pg_catalog',0,NULL::text,'43b1eb6dd9d99e45a4b1c3bed80d92b5d3c4390544f6394aaa61acf322be4d14',NULL::text,NULL::text,ARRAY['ot_v3_result_owner']::text[]),
  ('official_v3_result_private','attest_v1','jsonb,jsonb,int4,timestamptz,text',ARRAY['q','b','epoch_value','deadline','legal_day']::text[],'jsonb','plpgsql','v',false,'ot_v3_result_owner','search_path=pg_catalog',0,NULL::text,'47a2a1b76f6c088f656c235f5becdfa6f5d23d0e6b4efea7b27a6b15ae4cac17',NULL::text,NULL::text,ARRAY['ot_v3_result_owner']::text[]),
  ('official_v3_result_private','consume_s1_v1','jsonb,jsonb,jsonb',ARRAY['ref','expected_outcome','b']::text[],'jsonb','plpgsql','v',false,'ot_v3_result_owner','search_path=pg_catalog',0,NULL::text,'2db23086828983df4a93e79bc74c35d93c7c408c612c49885cac327b3fb96111',NULL::text,NULL::text,ARRAY['ot_v3_result_owner']::text[]),
  ('official_v3_result_private','keep_decision_v1','jsonb',ARRAY['v']::text[],'void','plpgsql','v',false,'ot_v3_result_owner','search_path=pg_catalog',0,NULL::text,'91351a13b82f9c45e364126032feeea3d9a515a3e693efb37caf3bb8b0ed9bf5',NULL::text,NULL::text,ARRAY['ot_v3_result_owner']::text[]),
  ('official_v3_result_private','prepared_v1','jsonb,jsonb,jsonb',ARRAY['prepared_value','proof_value','b']::text[],'void','plpgsql','v',false,'ot_v3_result_owner','search_path=pg_catalog',0,NULL::text,'6c476735120c4aa69295f881e083efab1d3069a28507d6f3cb7dcf0ff5121a3a',NULL::text,NULL::text,ARRAY['ot_v3_result_owner']::text[]),
  ('official_v3_result_private','transition_v1','jsonb,jsonb,int4,timestamptz,text,bool',ARRAY['q','b','epoch_value','deadline','legal_day','current_check']::text[],'jsonb','plpgsql','v',false,'ot_v3_result_owner','search_path=pg_catalog',0,NULL::text,'4311dc7c4c7b70e7e3bbbc2a2ad37de9fd83ed5231eb277a33b7560e1e9e4d3e',NULL::text,NULL::text,ARRAY['ot_v3_result_owner']::text[]),
  ('official_v3_result_private','publication_v1','jsonb,jsonb,int4,timestamptz,text,bool',ARRAY['q','b','epoch_value','deadline','legal_day','confirm_only']::text[],'jsonb','plpgsql','v',false,'ot_v3_result_owner','search_path=pg_catalog',0,NULL::text,'06d0f730fd449ae367cde5bc4e06ec2e6b4cf5f351d037c3d3f9920b73d3e6d8',NULL::text,NULL::text,ARRAY['ot_v3_result_owner']::text[]),
  ('official_v3_result_private','escalation_v1','jsonb,jsonb,int4,timestamptz,text,bool',ARRAY['q','b','epoch_value','deadline','legal_day','confirm_only']::text[],'jsonb','plpgsql','v',false,'ot_v3_result_owner','search_path=pg_catalog',0,NULL::text,'1a7b5cad87c42ffebf4c3b41ce6e3eabd62caf656c67e858e9254b6975d3a64f',NULL::text,NULL::text,ARRAY['ot_v3_result_owner']::text[]),
  ('official_v3_result_private','projection_binding_v1','jsonb',ARRAY['p']::text[],'jsonb','sql','i',false,'ot_v3_result_owner','search_path=pg_catalog',0,NULL::text,'2b4281e9e5160277fdcf081797401b01929c17ac084c9ca92c8b846ab9aaca14',NULL::text,NULL::text,ARRAY['ot_v3_result_owner']::text[]),
  ('official_v3_result_private','current_projection_v1','jsonb,text',ARRAY['b','legal_day']::text[],'jsonb','plpgsql','v',false,'ot_v3_result_owner','search_path=pg_catalog',0,NULL::text,'bb464fa0264d0c26fdd71e61ba586e5dd68cb7a38992497dd270be994d2a21cb',NULL::text,NULL::text,ARRAY['ot_v3_result_owner']::text[]),
  ('official_v3_result_private','plan_v1','jsonb',ARRAY['b']::text[],'jsonb','plpgsql','s',false,'ot_v3_result_owner','search_path=pg_catalog',0,NULL::text,'cb6c8195f6347fe381407c9fbc17a13babfe80654a01073666e8e5c7a97f37e9',NULL::text,NULL::text,ARRAY['ot_v3_result_owner']::text[]),
  ('official_v3_result_private','plan_current_v1','int8,jsonb,jsonb',ARRAY['generation_value','target_value','b']::text[],'bool','plpgsql','s',false,'ot_v3_result_owner','search_path=pg_catalog',0,NULL::text,'56e2e7134965eb9495d1598e4f1a538af276408d7618a91b11c71c7817be86dd',NULL::text,NULL::text,ARRAY['ot_v3_result_owner']::text[]),
  ('official_v3_result_private','suppress_v1','jsonb,jsonb,int4,timestamptz,text',ARRAY['q','b','epoch_value','deadline','legal_day']::text[],'jsonb','plpgsql','v',false,'ot_v3_result_owner','search_path=pg_catalog',0,NULL::text,'9082b6172399afbfb132819cf0e78a5f11031a443bfe95eb5768317cc62098a7',NULL::text,NULL::text,ARRAY['ot_v3_result_owner']::text[]),
  ('official_v3_result_private','monitor_claim_v1','jsonb,jsonb,int4,timestamptz,text',ARRAY['q','b','epoch_value','deadline','legal_day']::text[],'jsonb','plpgsql','v',false,'ot_v3_result_owner','search_path=pg_catalog',0,NULL::text,'d2f5f8cb1f33d926a463a65f5f49941af2c209c1275da0d4a9f9f8afc30a3971',NULL::text,NULL::text,ARRAY['ot_v3_result_owner']::text[]),
  ('official_v3_result_private','monitor_finish_v1','jsonb,jsonb,int4,timestamptz,text',ARRAY['q','b','epoch_value','deadline','legal_day']::text[],'jsonb','plpgsql','v',false,'ot_v3_result_owner','search_path=pg_catalog',0,NULL::text,'37a5426679629449bec19e1a86c95a1f5689300aa5fdaedcb8457976f14f9e3a',NULL::text,NULL::text,ARRAY['ot_v3_result_owner']::text[]),
  ('official_v3_result_private','command_v1','jsonb,jsonb',ARRAY['wire_value','b']::text[],'jsonb','plpgsql','i',false,'ot_v3_result_owner','search_path=pg_catalog',0,NULL::text,'a1672b93a0d614293ddaa6362db17204e74a025072e08ad6cad3958263bd4ac1',NULL::text,NULL::text,ARRAY['ot_v3_result_owner']::text[]),
  ('official_v3_result_private','dispatch_v1','text,jsonb,text,text,int4,text,text,int4,int4,text,text',ARRAY['channel_value','wire_value','binding_hash_value','method_id_value','revision_value','method_digest_value','package_digest_value','epoch_value','remaining_ms_value','not_after_value','legal_day_value']::text[],'jsonb','plpgsql','v',false,'ot_v3_result_owner','search_path=pg_catalog',0,NULL::text,'034449052e7103134c487c9372f9b76b1df1b6d7eb893299f8b08015a0b7f4fb',NULL::text,NULL::text,ARRAY['ot_v3_result_owner']::text[]),
  ('official_v3_result_api','attest_v1','jsonb,text,text,int4,text,text,int4,int4,text,text',ARRAY['wire_value','binding_hash_value','method_id_value','revision_value','method_digest_value','package_digest_value','epoch_value','remaining_ms_value','not_after_value','legal_day_value']::text[],'jsonb','sql','v',true,'ot_v3_result_owner','search_path=pg_catalog',0,NULL::text,NULL::text,'RETURN official_v3_result_private.dispatch_v1(''attest''::text, wire_value, binding_hash_value, method_id_value, revision_value, method_digest_value, package_digest_value, epoch_value, remaining_ms_value, not_after_value, legal_day_value)','official_v3_result_private.dispatch_v1(text,jsonb,text,text,int4,text,text,int4,int4,text,text)',ARRAY['ot_v3_result_owner','ot_v3_result_verifier']::text[]),
  ('official_v3_result_api','execute_v1','jsonb,text,text,int4,text,text,int4,int4,text,text',ARRAY['wire_value','binding_hash_value','method_id_value','revision_value','method_digest_value','package_digest_value','epoch_value','remaining_ms_value','not_after_value','legal_day_value']::text[],'jsonb','sql','v',true,'ot_v3_result_owner','search_path=pg_catalog',0,NULL::text,NULL::text,'RETURN official_v3_result_private.dispatch_v1(''execute''::text, wire_value, binding_hash_value, method_id_value, revision_value, method_digest_value, package_digest_value, epoch_value, remaining_ms_value, not_after_value, legal_day_value)','official_v3_result_private.dispatch_v1(text,jsonb,text,text,int4,text,text,int4,int4,text,text)',ARRAY['ot_v3_result_owner','ot_v3_result_writer']::text[]),
  ('official_v3_result_api','read_v1','jsonb,text,text,int4,text,text,int4,int4,text,text',ARRAY['wire_value','binding_hash_value','method_id_value','revision_value','method_digest_value','package_digest_value','epoch_value','remaining_ms_value','not_after_value','legal_day_value']::text[],'jsonb','sql','v',true,'ot_v3_result_owner','search_path=pg_catalog',0,NULL::text,NULL::text,'RETURN official_v3_result_private.dispatch_v1(''read''::text, wire_value, binding_hash_value, method_id_value, revision_value, method_digest_value, package_digest_value, epoch_value, remaining_ms_value, not_after_value, legal_day_value)','official_v3_result_private.dispatch_v1(text,jsonb,text,text,int4,text,text,int4,int4,text,text)',ARRAY['ot_v3_result_owner','ot_v3_result_writer','ot_v3_result_reader']::text[]),
  ('official_v3_result_private','ma1_require_current_locked_v1','text,int4,text,text,int4',ARRAY['m','r','d','p','e']::text[],'void','sql','v',true,'postgres','search_path=pg_catalog',0,NULL::text,NULL::text,'RETURN official_v3_method_private.require_current_locked_v1(m, r, d, p, e)','official_v3_method_private.require_current_locked_v1(text,int4,text,text,int4)',ARRAY['postgres','ot_v3_result_owner']::text[]),
  ('official_v3_result_private','s1_read_locked_v1','jsonb,text,int4',ARRAY['b','d','n']::text[],'jsonb','sql','v',true,'ot_v3_intake_owner','search_path=pg_catalog',0,NULL::text,NULL::text,'RETURN official_v3_intake_api.read_v1(b, d, n)','official_v3_intake_api.read_v1(jsonb,text,int4)',ARRAY['ot_v3_intake_owner','ot_v3_result_owner']::text[])
 ) AS inventory(schema_name,function_name,input_types,input_names,result_type,language_name,volatility,definer,owner_name,config,defaults,default_expression,body_hash,parsed_body,target_signature,grantees) LOOP
  namespace_oid:=pg_catalog.to_regnamespace(expected_function.schema_name);
  owner_oid:=pg_catalog.to_regrole(expected_function.owner_name);
  expected_types:=ARRAY(SELECT pg_catalog.to_regtype('pg_catalog.'||type_name)::oid
   FROM pg_catalog.unnest(CASE WHEN expected_function.input_types='' THEN ARRAY[]::text[] ELSE pg_catalog.string_to_array(expected_function.input_types,',') END)
    WITH ORDINALITY AS argument_type(type_name,ordinal) ORDER BY ordinal);
  allowed_grantees:=ARRAY(SELECT pg_catalog.to_regrole(role_name)::oid FROM pg_catalog.unnest(expected_function.grantees) role_name);
  target_oid:=NULL;
  IF expected_function.target_signature IS NOT NULL THEN
   target_name:=pg_catalog.split_part(expected_function.target_signature,'(',1);
   target_types:=ARRAY(SELECT pg_catalog.to_regtype('pg_catalog.'||type_name)::oid
    FROM pg_catalog.unnest(pg_catalog.string_to_array(pg_catalog.rtrim(pg_catalog.split_part(expected_function.target_signature,'(',2),')'),','))
     WITH ORDINALITY AS target_argument(type_name,ordinal) ORDER BY ordinal);
   SELECT target_function.oid INTO target_oid FROM pg_catalog.pg_proc target_function
    JOIN pg_catalog.pg_namespace target_namespace ON target_namespace.oid=target_function.pronamespace
    WHERE target_namespace.nspname=pg_catalog.split_part(target_name,'.',1)
     AND target_function.proname=pg_catalog.split_part(target_name,'.',2)
     AND ARRAY(SELECT x FROM pg_catalog.unnest(target_function.proargtypes) WITH ORDINALITY arg(x,ordinal) ORDER BY ordinal)=target_types
     AND target_function.pronargs=pg_catalog.cardinality(target_types);
   IF pg_catalog.array_position(target_types,NULL::oid) IS NOT NULL THEN target_oid:=NULL; END IF;
  END IF;
  SELECT f.* INTO function_row FROM pg_catalog.pg_proc f
   WHERE f.pronamespace=namespace_oid AND f.proname=expected_function.function_name;
  IF NOT FOUND OR namespace_oid IS NULL OR owner_oid IS NULL
   OR pg_catalog.array_position(expected_types,NULL::oid) IS NOT NULL OR pg_catalog.array_position(allowed_grantees,NULL::oid) IS NOT NULL
   OR ARRAY(SELECT x FROM pg_catalog.unnest(function_row.proargtypes) WITH ORDINALITY arg(x,ordinal) ORDER BY ordinal) IS DISTINCT FROM expected_types
   OR function_row.pronargs<>pg_catalog.cardinality(expected_types)
   OR function_row.proowner IS DISTINCT FROM owner_oid OR function_row.proargnames IS DISTINCT FROM expected_function.input_names
   OR function_row.proallargtypes IS NOT NULL OR function_row.proargmodes IS NOT NULL
   OR function_row.prorettype IS DISTINCT FROM pg_catalog.to_regtype('pg_catalog.'||expected_function.result_type)
   OR function_row.prokind<>'f' OR function_row.proretset OR function_row.proleakproof OR function_row.proisstrict
   OR function_row.prolang IS DISTINCT FROM (SELECT lang.oid FROM pg_catalog.pg_language lang WHERE lang.lanname=expected_function.language_name)
   OR function_row.provolatile::text<>expected_function.volatility OR function_row.proparallel<>'u' OR function_row.prosecdef<>expected_function.definer
   OR function_row.provariadic<>0 OR function_row.prosupport<>0 OR function_row.probin IS NOT NULL OR function_row.protrftypes IS NOT NULL
   OR function_row.procost<>100 OR function_row.prorows<>0 OR function_row.pronargdefaults<>expected_function.defaults
   OR pg_catalog.pg_get_expr(function_row.proargdefaults,0) IS DISTINCT FROM expected_function.default_expression
   OR function_row.proconfig IS DISTINCT FROM (CASE
     WHEN expected_function.schema_name='official_v3_result_private' AND expected_function.function_name IN ('catalog_v1','dispatch_v1')
     THEN ARRAY[expected_function.config,'jit=off'] ELSE ARRAY[expected_function.config] END)
   OR (expected_function.body_hash IS NOT NULL AND (function_row.prosqlbody IS NOT NULL
     OR pg_catalog.encode(pg_catalog.sha256(pg_catalog.convert_to(function_row.prosrc,'UTF8')),'hex') IS DISTINCT FROM expected_function.body_hash))
   OR (expected_function.parsed_body IS NOT NULL AND (function_row.prosqlbody IS NULL OR function_row.prosrc<>'' OR target_oid IS NULL
     OR pg_catalog.btrim(pg_catalog.regexp_replace(pg_catalog.pg_get_function_sqlbody(function_row.oid),'[[:space:]]+',' ','g'))
      IS DISTINCT FROM expected_function.parsed_body))
   OR (SELECT count(*) FROM pg_catalog.aclexplode(COALESCE(function_row.proacl,pg_catalog.acldefault('f',owner_oid))))<>pg_catalog.cardinality(allowed_grantees)
   OR EXISTS(SELECT 1 FROM pg_catalog.aclexplode(COALESCE(function_row.proacl,pg_catalog.acldefault('f',owner_oid))) acl_entry
     WHERE acl_entry.grantor<>owner_oid OR acl_entry.privilege_type<>'EXECUTE' OR acl_entry.is_grantable
      OR NOT acl_entry.grantee=ANY(allowed_grantees))
   OR (SELECT count(DISTINCT acl_entry.grantee) FROM pg_catalog.aclexplode(COALESCE(function_row.proacl,pg_catalog.acldefault('f',owner_oid))) acl_entry)
     <>pg_catalog.cardinality(allowed_grantees) THEN
   RAISE EXCEPTION 'hrs1 exact function declaration or ACL: %',expected_function.function_name USING ERRCODE='P7802';
  END IF;
  expected_dependency_count:=(CASE WHEN target_oid IS NULL THEN 1 ELSE 2 END)+(CASE WHEN expected_function.language_name='plpgsql' THEN 1 ELSE 0 END);
  IF (SELECT count(*) FROM pg_catalog.pg_depend dep WHERE dep.classid='pg_catalog.pg_proc'::regclass AND dep.objid=function_row.oid)<>expected_dependency_count
   OR NOT EXISTS(SELECT 1 FROM pg_catalog.pg_depend dep WHERE dep.classid='pg_catalog.pg_proc'::regclass AND dep.objid=function_row.oid
    AND dep.refclassid='pg_catalog.pg_namespace'::regclass AND dep.refobjid=namespace_oid AND dep.deptype='n' AND dep.objsubid=0 AND dep.refobjsubid=0)
   OR (expected_function.language_name='plpgsql' AND NOT EXISTS(SELECT 1 FROM pg_catalog.pg_depend dep
    WHERE dep.classid='pg_catalog.pg_proc'::regclass AND dep.objid=function_row.oid
     AND dep.refclassid='pg_catalog.pg_language'::regclass AND dep.refobjid=function_row.prolang
     AND dep.deptype='n' AND dep.objsubid=0 AND dep.refobjsubid=0))
   OR EXISTS(SELECT 1 FROM pg_catalog.pg_depend dep WHERE dep.classid='pg_catalog.pg_proc'::regclass AND dep.objid=function_row.oid
    AND (dep.objsubid<>0 OR dep.refobjsubid<>0 OR dep.deptype<>'n'
      OR NOT(dep.refclassid='pg_catalog.pg_namespace'::regclass AND dep.refobjid=namespace_oid
        OR target_oid IS NOT NULL AND dep.refclassid='pg_catalog.pg_proc'::regclass AND dep.refobjid=target_oid
        OR expected_function.language_name='plpgsql' AND dep.refclassid='pg_catalog.pg_language'::regclass AND dep.refobjid=function_row.prolang)))
   OR EXISTS(SELECT 1 FROM pg_catalog.pg_init_privs init WHERE init.classoid='pg_catalog.pg_proc'::regclass AND init.objoid=function_row.oid)
   OR pg_catalog.obj_description(function_row.oid,'pg_proc') IS NOT NULL
   OR EXISTS(SELECT 1 FROM pg_catalog.pg_seclabel label WHERE label.classoid='pg_catalog.pg_proc'::regclass AND label.objoid=function_row.oid) THEN
   RAISE EXCEPTION 'hrs1 exact function dependencies: %',expected_function.function_name USING ERRCODE='P7802';
  END IF;
 END LOOP;
END $hrs1_function_inventory$;
DO $hrs1_structure_inventory$
DECLARE owner_id oid:='ot_v3_result_owner'::regrole; private_id oid:='official_v3_result_private'::regnamespace;
 api_id oid:='official_v3_result_api'::regnamespace; expected_column record; column_row pg_catalog.pg_attribute%ROWTYPE;
 expected_constraint record; table_row record; class_row pg_catalog.pg_class%ROWTYPE; namespace_row record; role_row record; type_row pg_catalog.pg_type%ROWTYPE;
 immutable_id oid;
BEGIN
 SELECT fn.oid INTO immutable_id FROM pg_catalog.pg_proc fn JOIN pg_catalog.pg_namespace ns ON ns.oid=fn.pronamespace
  WHERE ns.nspname='official_v3_result_private' AND fn.proname='immutable_v1' AND fn.pronargs=0
   AND ARRAY(SELECT arg FROM pg_catalog.unnest(fn.proargtypes) arg)=ARRAY[]::oid[];
 IF immutable_id IS NULL THEN RAISE EXCEPTION 'hrs1 immutable function missing' USING ERRCODE='P7802'; END IF;
 IF (SELECT count(*) FROM pg_catalog.pg_namespace ns WHERE ns.oid IN (private_id,api_id) AND ns.nspowner=owner_id)<>2
  OR EXISTS(SELECT 1 FROM pg_catalog.pg_default_acl defaults WHERE defaults.defaclrole IN
   (SELECT r.oid FROM pg_catalog.pg_roles r WHERE r.rolname IN ('ot_v3_result_owner','ot_v3_result_writer','ot_v3_result_reader','ot_v3_result_verifier'))
    OR defaults.defaclnamespace IN (private_id,api_id))
  OR EXISTS(SELECT 1 FROM pg_catalog.pg_class rel WHERE rel.relnamespace=api_id)
  OR (SELECT count(*) FROM pg_catalog.pg_class rel WHERE rel.relnamespace=private_id)<>29
  OR (SELECT count(*) FROM pg_catalog.pg_class rel WHERE rel.relnamespace=private_id AND rel.relkind='r')<>12
  OR (SELECT count(*) FROM pg_catalog.pg_class rel WHERE rel.relnamespace=private_id AND rel.relkind='i')<>17
  OR (SELECT count(*) FROM pg_catalog.pg_type typ WHERE typ.typnamespace=private_id)<>24
  OR EXISTS(SELECT 1 FROM pg_catalog.pg_type typ WHERE typ.typnamespace=api_id)
  OR (SELECT count(*) FROM pg_catalog.pg_constraint constraint_row WHERE constraint_row.connamespace=private_id)<>52
  OR EXISTS(SELECT 1 FROM pg_catalog.pg_attrdef def JOIN pg_catalog.pg_class rel ON rel.oid=def.adrelid WHERE rel.relnamespace=private_id)
  OR EXISTS(SELECT 1 FROM pg_catalog.pg_class rel WHERE rel.relnamespace=private_id
    AND (rel.relowner<>owner_id OR rel.relpersistence<>'p' OR rel.relispartition OR rel.reloptions IS NOT NULL
      OR rel.reltablespace<>0 OR rel.relkind NOT IN ('r','i') OR rel.relreplident<>'d' AND rel.relkind='r'
      OR rel.relhasrules OR rel.relhassubclass))
  OR EXISTS(SELECT 1 FROM pg_catalog.pg_type typ WHERE typ.typnamespace=private_id
    AND (typ.typowner<>owner_id OR typ.typacl IS NOT NULL OR typ.typtype NOT IN ('c','b') OR typ.typbasetype<>0
      OR typ.typnotnull OR typ.typdefault IS NOT NULL OR typ.typdefaultbin IS NOT NULL))
  OR EXISTS(SELECT 1 FROM pg_catalog.pg_class rel JOIN pg_catalog.pg_rewrite rewrite ON rewrite.ev_class=rel.oid WHERE rel.relnamespace=private_id)
  OR EXISTS(SELECT 1 FROM pg_catalog.pg_inherits inheritance JOIN pg_catalog.pg_class rel ON rel.oid IN (inheritance.inhrelid,inheritance.inhparent)
    WHERE rel.relnamespace=private_id) THEN
  RAISE EXCEPTION 'hrs1 exact schema/relation/type count or ownership' USING ERRCODE='P7802';
 END IF;
 FOR namespace_row IN SELECT ns.* FROM pg_catalog.pg_namespace ns WHERE ns.oid IN (private_id,api_id) LOOP
  IF (SELECT count(*) FROM pg_catalog.aclexplode(COALESCE(namespace_row.nspacl,pg_catalog.acldefault('n',owner_id))))
    <>(CASE WHEN namespace_row.oid=private_id THEN 2 ELSE 5 END)
   OR EXISTS(SELECT 1 FROM pg_catalog.aclexplode(COALESCE(namespace_row.nspacl,pg_catalog.acldefault('n',owner_id))) acl_entry
     WHERE acl_entry.grantor<>owner_id OR acl_entry.is_grantable
      OR NOT(acl_entry.grantee=owner_id AND acl_entry.privilege_type IN ('USAGE','CREATE')
        OR namespace_row.oid=api_id AND acl_entry.privilege_type='USAGE' AND acl_entry.grantee IN
         ('ot_v3_result_writer'::regrole,'ot_v3_result_reader'::regrole,'ot_v3_result_verifier'::regrole))) THEN
   RAISE EXCEPTION 'hrs1 exact namespace ACL' USING ERRCODE='P7802';
  END IF;
 END LOOP;
 FOR role_row IN SELECT role.oid FROM pg_catalog.pg_roles role WHERE role.rolname IN
  ('ot_v3_result_writer','ot_v3_result_reader','ot_v3_result_verifier','anon','authenticated','service_role','postgres','ot_v3_intake_owner') LOOP
  IF pg_catalog.has_schema_privilege(role_row.oid,private_id,'USAGE,CREATE')
   OR pg_catalog.has_schema_privilege(role_row.oid,api_id,'CREATE')
   OR pg_catalog.has_database_privilege(role_row.oid,current_database(),'CREATE') AND role_row.oid NOT IN ('postgres'::regrole) THEN
   RAISE EXCEPTION 'hrs1 forbidden ambient schema/database rights' USING ERRCODE='P7802';
  END IF;
 END LOOP;
 FOR expected_column IN SELECT * FROM (VALUES
  ('binding_v1',1,'singleton','bool',true),
  ('binding_v1',2,'binding','jsonb',true),
  ('binding_v1',3,'binding_hash','text',true),
  ('binding_v1',4,'creator_oid','oid',true),
  ('binding_v1',5,'catalog','jsonb',true),
  ('originals_v1',1,'version_id','text',true),
  ('originals_v1',2,'evidence','jsonb',true),
  ('originals_v1',3,'body_text','text',true),
  ('originals_v1',4,'raw_digest','text',true),
  ('extractions_v1',1,'version_id','text',true),
  ('extractions_v1',2,'record','jsonb',true),
  ('qualifications_v1',1,'reference','text',true),
  ('qualifications_v1',2,'kind','text',true),
  ('qualifications_v1',3,'record','jsonb',true),
  ('qualifications_v1',4,'digest','text',true),
  ('qualifications_v1',5,'decision_ref','text',false),
  ('qualifications_v1',6,'decision_content_key','text',false),
  ('qualifications_v1',7,'valid_until','timestamptz',true),
  ('qualifications_v1',8,'original_ids','jsonb',true),
  ('decisions_v1',1,'reference','text',true),
  ('decisions_v1',2,'predecessor_ref','text',false),
  ('decisions_v1',3,'record','jsonb',true),
  ('decisions_v1',4,'archive_ref','text',false),
  ('decisions_v1',5,'verification_ref','text',true),
  ('archive_pages_v1',1,'reference','text',true),
  ('archive_pages_v1',2,'predecessor_ref','text',false),
  ('archive_pages_v1',3,'revision','int4',true),
  ('archive_pages_v1',4,'record','jsonb',true),
  ('versions_v1',1,'reference','text',true),
  ('versions_v1',2,'revision','int4',true),
  ('versions_v1',3,'predecessor_ref','text',false),
  ('versions_v1',4,'decision_ref','text',true),
  ('versions_v1',5,'verification_ref','text',true),
  ('versions_v1',6,'prepared','jsonb',true),
  ('versions_v1',7,'committed_at','timestamptz',true),
  ('projections_v1',1,'reference','text',true),
  ('projections_v1',2,'version_ref','text',true),
  ('projections_v1',3,'verification_ref','text',true),
  ('projections_v1',4,'record','jsonb',true),
  ('projections_v1',5,'suppression_epoch','int8',true),
  ('projections_v1',6,'published_at','timestamptz',true),
  ('heads_v1',1,'singleton','bool',true),
  ('heads_v1',2,'context_key','text',true),
  ('heads_v1',3,'version_ref','text',false),
  ('heads_v1',4,'decision_ref','text',false),
  ('heads_v1',5,'sticky_decision_ref','text',false),
  ('heads_v1',6,'projection_ref','text',false),
  ('heads_v1',7,'suppression','jsonb',true),
  ('heads_v1',8,'suppression_epoch','int8',true),
  ('heads_v1',9,'generation','int8',true),
  ('heads_v1',10,'coverage','bool',true),
  ('operations_v1',1,'operation_kind','text',true),
  ('operations_v1',2,'operation_id','text',true),
  ('operations_v1',3,'operation_key','text',true),
  ('operations_v1',4,'command_digest','text',true),
  ('operations_v1',5,'command','jsonb',true),
  ('operations_v1',6,'result','jsonb',true),
  ('operations_v1',7,'head_generation','int8',true),
  ('operations_v1',8,'recorded_at','timestamptz',true),
  ('outbox_v1',1,'escalation_key','text',true),
  ('outbox_v1',2,'decision_ref','text',true),
  ('outbox_v1',3,'operation_kind','text',true),
  ('outbox_v1',4,'operation_id','text',true),
  ('outbox_v1',5,'record','jsonb',true),
  ('outbox_v1',6,'recorded_at','timestamptz',true),
  ('monitor_schedule_v1',1,'singleton','bool',true),
  ('monitor_schedule_v1',2,'generation','int8',true),
  ('monitor_schedule_v1',3,'claimed_by','text',false),
  ('monitor_schedule_v1',4,'claim_operation','text',false),
  ('monitor_schedule_v1',5,'next_check_at','timestamptz',true),
  ('monitor_schedule_v1',6,'lease_until','timestamptz',false),
  ('monitor_schedule_v1',7,'outcomes','jsonb',true),
  ('monitor_schedule_v1',8,'finish_operation','text',false)
 ) AS column_inventory(table_name,ordinal,column_name,type_name,not_null) LOOP
  SELECT attribute.* INTO column_row FROM pg_catalog.pg_attribute attribute
   JOIN pg_catalog.pg_class rel ON rel.oid=attribute.attrelid
   WHERE rel.relnamespace=private_id AND rel.relname=expected_column.table_name AND attribute.attnum=expected_column.ordinal;
  SELECT typ.* INTO type_row FROM pg_catalog.pg_type typ WHERE typ.oid=pg_catalog.to_regtype('pg_catalog.'||expected_column.type_name);
  IF column_row.attrelid IS NULL OR type_row.oid IS NULL OR column_row.attname IS DISTINCT FROM expected_column.column_name
   OR column_row.atttypid IS DISTINCT FROM type_row.oid OR column_row.attnotnull IS DISTINCT FROM expected_column.not_null
   OR column_row.attlen<>type_row.typlen OR column_row.attbyval<>type_row.typbyval OR column_row.attalign<>type_row.typalign
   OR column_row.attstorage<>type_row.typstorage OR column_row.attcompression<>'' OR column_row.atttypmod<>-1 OR column_row.attndims<>0
   OR column_row.attcollation IS DISTINCT FROM type_row.typcollation OR column_row.attisdropped OR NOT column_row.attislocal
   OR column_row.attinhcount<>0 OR column_row.atthasdef OR column_row.attgenerated<>'' OR column_row.attidentity<>''
   OR column_row.atthasmissing OR column_row.attmissingval IS NOT NULL OR column_row.attacl IS NOT NULL
   OR column_row.attstattarget IS NOT NULL OR column_row.attfdwoptions IS NOT NULL
   OR (column_row.attoptions IS NOT NULL AND NOT(
      pg_catalog.current_setting('server_version_num')::integer>=170012
      AND pg_catalog.array_ndims(column_row.attoptions)=1 AND pg_catalog.array_lower(column_row.attoptions,1)=1
      AND pg_catalog.cardinality(column_row.attoptions)=1
      AND CASE WHEN column_row.attoptions[1] ~ '^pg_attver=(0|[1-9][0-9]{0,19})$'
        THEN pg_catalog.substring(column_row.attoptions[1], 11)::numeric<=18446744073709551615::numeric ELSE false END)) THEN
   RAISE EXCEPTION 'hrs1 exact selected column: %.%',expected_column.table_name,expected_column.column_name USING ERRCODE='P7802';
  END IF;
 END LOOP;
 IF (SELECT count(*) FROM pg_catalog.pg_attribute attribute JOIN pg_catalog.pg_class rel ON rel.oid=attribute.attrelid
   WHERE rel.relnamespace=private_id AND rel.relkind='r' AND attribute.attnum>0)<>73 THEN
  RAISE EXCEPTION 'hrs1 extra or missing table column' USING ERRCODE='P7802';
 END IF;
 FOR expected_constraint IN SELECT * FROM (VALUES
  ('binding_v1','p','PRIMARY KEY (singleton)'),
  ('originals_v1','p','PRIMARY KEY (version_id)'),
  ('extractions_v1','p','PRIMARY KEY (version_id)'),
  ('qualifications_v1','p','PRIMARY KEY (reference)'),
  ('decisions_v1','p','PRIMARY KEY (reference)'),
  ('archive_pages_v1','p','PRIMARY KEY (reference)'),
  ('versions_v1','p','PRIMARY KEY (reference)'),
  ('projections_v1','p','PRIMARY KEY (reference)'),
  ('heads_v1','p','PRIMARY KEY (singleton)'),
  ('operations_v1','p','PRIMARY KEY (operation_kind, operation_id)'),
  ('outbox_v1','p','PRIMARY KEY (escalation_key)'),
  ('monitor_schedule_v1','p','PRIMARY KEY (singleton)'),
  ('binding_v1','u','UNIQUE (binding_hash)'),
  ('qualifications_v1','u','UNIQUE (kind, decision_content_key)'),
  ('archive_pages_v1','u','UNIQUE (revision)'),
  ('versions_v1','u','UNIQUE (revision)'),
  ('heads_v1','u','UNIQUE (context_key)'),
  ('extractions_v1','f','FOREIGN KEY (version_id) REFERENCES official_v3_result_private.originals_v1(version_id)'),
  ('decisions_v1','f','FOREIGN KEY (predecessor_ref) REFERENCES official_v3_result_private.decisions_v1(reference)'),
  ('decisions_v1','f','FOREIGN KEY (verification_ref) REFERENCES official_v3_result_private.qualifications_v1(reference)'),
  ('archive_pages_v1','f','FOREIGN KEY (predecessor_ref) REFERENCES official_v3_result_private.archive_pages_v1(reference)'),
  ('versions_v1','f','FOREIGN KEY (predecessor_ref) REFERENCES official_v3_result_private.versions_v1(reference)'),
  ('versions_v1','f','FOREIGN KEY (decision_ref) REFERENCES official_v3_result_private.decisions_v1(reference)'),
  ('versions_v1','f','FOREIGN KEY (verification_ref) REFERENCES official_v3_result_private.qualifications_v1(reference)'),
  ('projections_v1','f','FOREIGN KEY (version_ref) REFERENCES official_v3_result_private.versions_v1(reference)'),
  ('projections_v1','f','FOREIGN KEY (verification_ref) REFERENCES official_v3_result_private.qualifications_v1(reference)'),
  ('heads_v1','f','FOREIGN KEY (version_ref) REFERENCES official_v3_result_private.versions_v1(reference)'),
  ('heads_v1','f','FOREIGN KEY (decision_ref) REFERENCES official_v3_result_private.decisions_v1(reference)'),
  ('heads_v1','f','FOREIGN KEY (sticky_decision_ref) REFERENCES official_v3_result_private.decisions_v1(reference)'),
  ('heads_v1','f','FOREIGN KEY (projection_ref) REFERENCES official_v3_result_private.projections_v1(reference)'),
  ('outbox_v1','f','FOREIGN KEY (decision_ref) REFERENCES official_v3_result_private.decisions_v1(reference)'),
  ('outbox_v1','f','FOREIGN KEY (operation_kind, operation_id) REFERENCES official_v3_result_private.operations_v1(operation_kind, operation_id)'),
  ('binding_v1','c','CHECK (singleton)'),
  ('originals_v1','c','CHECK ((((octet_length(body_text) >= 1) AND (octet_length(body_text) <= 131072)) AND (raw_digest ~ ''^[a-f0-9]{64}$''::text)))'),
  ('qualifications_v1','c','CHECK ((kind = ANY (ARRAY[''verification''::text, ''observation''::text])))'),
  ('qualifications_v1','c','CHECK ((isfinite(valid_until) AND (digest ~ ''^[a-f0-9]{64}$''::text) AND (jsonb_typeof(original_ids) = ''array''::text)))'),
  ('archive_pages_v1','c','CHECK ((revision > 0))'),
  ('versions_v1','c','CHECK ((revision > 0))'),
  ('versions_v1','c','CHECK (isfinite(committed_at))'),
  ('projections_v1','c','CHECK ((suppression_epoch >= 0))'),
  ('projections_v1','c','CHECK (isfinite(published_at))'),
  ('heads_v1','c','CHECK (singleton)'),
  ('heads_v1','c','CHECK ((suppression_epoch >= 0))'),
  ('heads_v1','c','CHECK ((generation >= 0))'),
  ('operations_v1','c','CHECK ((operation_kind = ANY (ARRAY[''version''::text, ''publication''::text, ''escalation''::text, ''suppression''::text, ''monitor_claim''::text, ''monitor_finish''::text])))'),
  ('operations_v1','c','CHECK ((head_generation >= 0))'),
  ('operations_v1','c','CHECK (isfinite(recorded_at))'),
  ('outbox_v1','c','CHECK (isfinite(recorded_at))'),
  ('monitor_schedule_v1','c','CHECK (singleton)'),
  ('monitor_schedule_v1','c','CHECK ((generation >= 0))'),
  ('monitor_schedule_v1','c','CHECK (isfinite(next_check_at))'),
  ('monitor_schedule_v1','c','CHECK ((((claimed_by IS NULL) = (lease_until IS NULL)) AND ((lease_until IS NULL) OR isfinite(lease_until))))')
 ) AS constraint_inventory(table_name,kind,definition) LOOP
  IF (SELECT count(*) FROM pg_catalog.pg_constraint constraint_row JOIN pg_catalog.pg_class rel ON rel.oid=constraint_row.conrelid
   WHERE rel.relnamespace=private_id AND rel.relname=expected_constraint.table_name AND constraint_row.contype::text=expected_constraint.kind
    AND pg_catalog.btrim(pg_catalog.regexp_replace(pg_catalog.pg_get_constraintdef(constraint_row.oid,false),'[[:space:]]+',' ','g'))=expected_constraint.definition
    AND constraint_row.convalidated AND NOT constraint_row.condeferrable AND NOT constraint_row.condeferred
    AND constraint_row.conparentid=0 AND constraint_row.conislocal AND constraint_row.coninhcount=0
    AND constraint_row.connoinherit IS NOT DISTINCT FROM (expected_constraint.kind<>'c')
    AND (constraint_row.contype<>'f' OR constraint_row.confupdtype='a' AND constraint_row.confdeltype='a' AND constraint_row.confmatchtype='s'))<>1 THEN
   RAISE EXCEPTION 'hrs1 exact constraint: %',expected_constraint.table_name USING ERRCODE='P7802';
  END IF;
 END LOOP;
 IF EXISTS(SELECT 1 FROM pg_catalog.pg_index index_row JOIN pg_catalog.pg_class index_rel ON index_rel.oid=index_row.indexrelid
  WHERE index_rel.relnamespace=private_id AND (NOT index_row.indisunique OR NOT index_row.indisvalid OR NOT index_row.indisready OR NOT index_row.indislive
   OR index_row.indnullsnotdistinct OR NOT index_row.indimmediate OR index_row.indisclustered OR index_row.indisreplident
   OR index_row.indexprs IS NOT NULL OR index_row.indpred IS NOT NULL OR index_row.indnkeyatts<>index_row.indnatts
   OR index_rel.relam IS DISTINCT FROM (SELECT method.oid FROM pg_catalog.pg_am method WHERE method.amname='btree')
   OR index_rel.relacl IS NOT NULL OR index_rel.relrowsecurity OR index_rel.relforcerowsecurity)) THEN
  RAISE EXCEPTION 'hrs1 exact unique index metadata' USING ERRCODE='P7802';
 END IF;
 FOR table_row IN SELECT rel.* FROM pg_catalog.pg_class rel WHERE rel.relnamespace=private_id AND rel.relkind='r' LOOP
  IF NOT table_row.relrowsecurity OR NOT table_row.relforcerowsecurity OR table_row.relam IS DISTINCT FROM
    (SELECT method.oid FROM pg_catalog.pg_am method WHERE method.amname='heap')
   OR COALESCE(table_row.relacl,pg_catalog.acldefault('r',owner_id)) IS DISTINCT FROM pg_catalog.acldefault('r',owner_id)
   OR (SELECT count(*) FROM pg_catalog.pg_policy policy WHERE policy.polrelid=table_row.oid)<>1
   OR NOT EXISTS(SELECT 1 FROM pg_catalog.pg_policy policy WHERE policy.polrelid=table_row.oid AND policy.polname='hrs1_owner'
    AND policy.polcmd='*' AND policy.polpermissive AND policy.polroles=ARRAY[owner_id]
    AND pg_catalog.pg_get_expr(policy.polqual,table_row.oid)='true' AND pg_catalog.pg_get_expr(policy.polwithcheck,table_row.oid)='true')
   OR (SELECT count(*) FROM pg_catalog.pg_trigger trigger_row WHERE trigger_row.tgrelid=table_row.oid AND NOT trigger_row.tgisinternal)<>2
   OR (SELECT count(*) FROM pg_catalog.pg_trigger trigger_row WHERE trigger_row.tgrelid=table_row.oid AND NOT trigger_row.tgisinternal
    AND trigger_row.tgfoid=immutable_id AND trigger_row.tgenabled='O' AND trigger_row.tgnargs=0 AND trigger_row.tgargs=''::bytea
    AND trigger_row.tgqual IS NULL AND trigger_row.tgattr=''::int2vector AND NOT trigger_row.tgdeferrable AND NOT trigger_row.tginitdeferred
    AND trigger_row.tgconstraint=0 AND trigger_row.tgconstrrelid=0 AND trigger_row.tgconstrindid=0 AND trigger_row.tgparentid=0
    AND trigger_row.tgoldtable IS NULL AND trigger_row.tgnewtable IS NULL
    AND (trigger_row.tgname='hrs1_immutable_row' AND trigger_row.tgtype=27
      OR trigger_row.tgname='hrs1_immutable_truncate' AND trigger_row.tgtype=34))<>2 THEN
   RAISE EXCEPTION 'hrs1 exact table ACL/RLS/immutability: %',table_row.relname USING ERRCODE='P7802';
  END IF;
 END LOOP;
END $hrs1_structure_inventory$;
DO $hrs1_dependency_boundary$
DECLARE foreign_object boolean;
BEGIN
 WITH ns AS (
  SELECT namespace_row.oid FROM pg_catalog.pg_namespace namespace_row
   WHERE namespace_row.nspname IN ('official_v3_result_private','official_v3_result_api')
 ), tabs AS (
  SELECT relation.oid,relation.reltoastrelid FROM pg_catalog.pg_class relation JOIN ns ON ns.oid=relation.relnamespace WHERE relation.relkind='r'
 ), classes AS (
  SELECT relation.oid FROM pg_catalog.pg_class relation JOIN ns ON ns.oid=relation.relnamespace
  UNION SELECT tab.reltoastrelid FROM tabs tab WHERE tab.reltoastrelid<>0
  UNION SELECT index_row.indexrelid FROM pg_catalog.pg_index index_row JOIN tabs tab ON index_row.indrelid=tab.reltoastrelid WHERE tab.reltoastrelid<>0
 ), objects AS (
  SELECT 'pg_catalog.pg_namespace'::regclass::oid classid,ns.oid objid FROM ns
  UNION SELECT 'pg_catalog.pg_class'::regclass,classes.oid FROM classes
  UNION SELECT 'pg_catalog.pg_type'::regclass,typ.oid FROM pg_catalog.pg_type typ JOIN ns ON ns.oid=typ.typnamespace
  UNION SELECT 'pg_catalog.pg_proc'::regclass,fn.oid FROM pg_catalog.pg_proc fn JOIN ns ON ns.oid=fn.pronamespace
  UNION SELECT 'pg_catalog.pg_constraint'::regclass,constraint_row.oid FROM pg_catalog.pg_constraint constraint_row JOIN tabs ON tabs.oid=constraint_row.conrelid
  UNION SELECT 'pg_catalog.pg_trigger'::regclass,trigger_row.oid FROM pg_catalog.pg_trigger trigger_row JOIN tabs ON tabs.oid=trigger_row.tgrelid
  UNION SELECT 'pg_catalog.pg_policy'::regclass,policy.oid FROM pg_catalog.pg_policy policy JOIN tabs ON tabs.oid=policy.polrelid
  UNION SELECT 'pg_catalog.pg_attrdef'::regclass,def.oid FROM pg_catalog.pg_attrdef def JOIN tabs ON tabs.oid=def.adrelid
 ), roles AS (
  SELECT role.oid FROM pg_catalog.pg_roles role WHERE role.rolname IN
   ('ot_v3_result_owner','ot_v3_result_writer','ot_v3_result_reader','ot_v3_result_verifier')
 )
 SELECT EXISTS(SELECT 1 FROM pg_catalog.pg_depend dep JOIN objects referenced ON referenced.classid=dep.refclassid AND referenced.objid=dep.refobjid
    WHERE NOT EXISTS(SELECT 1 FROM objects dependent WHERE dependent.classid=dep.classid AND dependent.objid=dep.objid))
  OR EXISTS(SELECT 1 FROM pg_catalog.pg_depend dep JOIN objects dependent ON dependent.classid=dep.classid AND dependent.objid=dep.objid
    WHERE dep.deptype IN ('e','x'))
  OR EXISTS(SELECT 1 FROM pg_catalog.pg_shdepend dep WHERE dep.refclassid='pg_catalog.pg_authid'::regclass AND dep.refobjid IN (SELECT oid FROM roles)
   AND NOT(dep.dbid=(SELECT database_row.oid FROM pg_catalog.pg_database database_row WHERE database_row.datname=current_database())
     AND EXISTS(SELECT 1 FROM objects obj WHERE obj.classid=dep.classid AND obj.objid=dep.objid))
   AND NOT(dep.dbid=0 AND dep.classid='pg_catalog.pg_database'::regclass
     AND dep.objid=(SELECT database_row.oid FROM pg_catalog.pg_database database_row WHERE database_row.datname=current_database())
     AND dep.deptype='a' AND dep.refobjid IN ('ot_v3_result_writer'::regrole,'ot_v3_result_reader'::regrole,'ot_v3_result_verifier'::regrole))
   AND NOT(dep.dbid=0 AND dep.classid='pg_catalog.pg_auth_members'::regclass AND EXISTS(
     SELECT 1 FROM pg_catalog.pg_auth_members membership WHERE membership.oid=dep.objid AND membership.member='postgres'::regrole
      AND membership.roleid IN (SELECT oid FROM roles)
      AND (membership.grantor=10 AND membership.admin_option AND NOT membership.inherit_option AND NOT membership.set_option
       OR membership.roleid='ot_v3_result_owner'::regrole AND membership.grantor='postgres'::regrole
        AND NOT membership.admin_option AND NOT membership.inherit_option AND membership.set_option))))
  OR EXISTS(SELECT 1 FROM pg_catalog.pg_description description JOIN objects obj ON obj.classid=description.classoid AND obj.objid=description.objoid)
  OR EXISTS(SELECT 1 FROM pg_catalog.pg_seclabel label JOIN objects obj ON obj.classid=label.classoid AND obj.objid=label.objoid)
  OR EXISTS(SELECT 1 FROM pg_catalog.pg_init_privs initial_acl JOIN objects obj ON obj.classid=initial_acl.classoid AND obj.objid=initial_acl.objoid)
  OR EXISTS(SELECT 1 FROM pg_catalog.pg_shdescription description WHERE description.classoid='pg_catalog.pg_authid'::regclass AND description.objoid IN (SELECT oid FROM roles))
  OR EXISTS(SELECT 1 FROM pg_catalog.pg_shseclabel label WHERE label.classoid='pg_catalog.pg_authid'::regclass AND label.objoid IN (SELECT oid FROM roles))
  INTO foreign_object;
 IF foreign_object THEN RAISE EXCEPTION 'hrs1 unknown dependency/ownership/label/extension' USING ERRCODE='P7802'; END IF;
 IF (SELECT count(*) FROM pg_catalog.pg_database database_row CROSS JOIN LATERAL pg_catalog.aclexplode(database_row.datacl) acl_entry
   WHERE database_row.datname=current_database() AND acl_entry.grantee IN
    ('ot_v3_result_writer'::regrole,'ot_v3_result_reader'::regrole,'ot_v3_result_verifier'::regrole))<>3
  OR EXISTS(SELECT 1 FROM pg_catalog.pg_database database_row CROSS JOIN LATERAL pg_catalog.aclexplode(database_row.datacl) acl_entry
   WHERE database_row.datname=current_database() AND acl_entry.grantee IN
    ('ot_v3_result_owner'::regrole,'ot_v3_result_writer'::regrole,'ot_v3_result_reader'::regrole,'ot_v3_result_verifier'::regrole)
    AND (acl_entry.grantee='ot_v3_result_owner'::regrole OR acl_entry.grantor<>'postgres'::regrole
      OR acl_entry.privilege_type<>'CONNECT' OR acl_entry.is_grantable)) THEN
  RAISE EXCEPTION 'hrs1 exact new database CONNECT ACL' USING ERRCODE='P7802';
 END IF;
END $hrs1_dependency_boundary$;
DO $hrs1_initial_state$
DECLARE binding_value jsonb; selected_catalog jsonb;
BEGIN
 BEGIN binding_value:=pg_catalog.current_setting('jetnity.hrs1_binding')::jsonb;
 EXCEPTION WHEN invalid_text_representation THEN RAISE EXCEPTION 'hrs1 invalid selected binding JSON' USING ERRCODE='P7801'; END;
 IF official_v3_result_private.binding_valid_v1(binding_value) IS NOT TRUE THEN
  RAISE EXCEPTION 'hrs1 complete selected binding required' USING ERRCODE='P7801';
 END IF;
 INSERT INTO official_v3_result_private.heads_v1(singleton,context_key,version_ref,decision_ref,sticky_decision_ref,projection_ref,
  suppression,suppression_epoch,generation,coverage)
  VALUES(true,binding_value->>'contextKey',NULL,NULL,NULL,NULL,'null'::jsonb,0,0,false);
 INSERT INTO official_v3_result_private.monitor_schedule_v1(singleton,generation,claimed_by,claim_operation,next_check_at,lease_until,outcomes,finish_operation)
  VALUES(true,0,NULL,NULL,official_v3_result_private.timestamp_v1(binding_value->>'activeFrom'),NULL,'[]'::jsonb,NULL);
 selected_catalog:=official_v3_result_private.catalog_v1();
 INSERT INTO official_v3_result_private.binding_v1(singleton,binding,binding_hash,creator_oid,catalog)
  VALUES(true,binding_value,official_v3_result_private.hash_v1(binding_value),'postgres'::regrole,selected_catalog);
 PERFORM official_v3_result_private.assert_history_v1();
 PERFORM pg_catalog.set_config('jetnity.hrs1_install_frozen_catalog',selected_catalog::text,true);
END $hrs1_initial_state$;
RESET ROLE;
REVOKE ot_v3_result_owner FROM postgres GRANTED BY postgres RESTRICT;
DO $hrs1_final_state$
DECLARE actual_catalog jsonb; role_row record;
BEGIN
 SELECT q.value INTO actual_catalog FROM (
 SELECT (WITH ns AS (
 SELECT n.oid,n.nspname FROM pg_catalog.pg_namespace n WHERE n.nspname IN ('official_v3_result_private','official_v3_result_api')
), tabs AS (
 SELECT c.oid,c.reltoastrelid FROM pg_catalog.pg_class c JOIN ns n ON n.oid=c.relnamespace WHERE c.relkind='r'
), classes AS (
 SELECT c.oid FROM pg_catalog.pg_class c JOIN ns n ON n.oid=c.relnamespace
 UNION SELECT t.reltoastrelid FROM tabs t WHERE t.reltoastrelid<>0
 UNION SELECT i.indexrelid FROM pg_catalog.pg_index i JOIN tabs t ON i.indrelid=t.reltoastrelid WHERE t.reltoastrelid<>0
), objects AS (
 SELECT 'pg_catalog.pg_namespace'::pg_catalog.regclass::oid AS classid,n.oid AS objid FROM ns n
 UNION SELECT 'pg_catalog.pg_class'::pg_catalog.regclass,c.oid FROM classes c
 UNION SELECT 'pg_catalog.pg_type'::pg_catalog.regclass,t.oid FROM pg_catalog.pg_type t JOIN ns n ON n.oid=t.typnamespace
 UNION SELECT 'pg_catalog.pg_proc'::pg_catalog.regclass,p.oid FROM pg_catalog.pg_proc p JOIN ns n ON n.oid=p.pronamespace
 UNION SELECT 'pg_catalog.pg_constraint'::pg_catalog.regclass,c.oid FROM pg_catalog.pg_constraint c JOIN tabs t ON t.oid=c.conrelid
 UNION SELECT 'pg_catalog.pg_trigger'::pg_catalog.regclass,g.oid FROM pg_catalog.pg_trigger g JOIN tabs t ON t.oid=g.tgrelid
 UNION SELECT 'pg_catalog.pg_policy'::pg_catalog.regclass,p.oid FROM pg_catalog.pg_policy p JOIN tabs t ON t.oid=p.polrelid
 UNION SELECT 'pg_catalog.pg_attrdef'::pg_catalog.regclass,d.oid FROM pg_catalog.pg_attrdef d JOIN tabs t ON t.oid=d.adrelid
), role_ids AS (
 SELECT r.oid FROM pg_catalog.pg_roles r WHERE r.rolname IN ('ot_v3_result_owner','ot_v3_result_writer','ot_v3_result_reader','ot_v3_result_verifier')
), prerequisite_ns AS (
 SELECT n.oid FROM pg_catalog.pg_namespace n WHERE n.nspname IN
  ('jetnity_ot_auth','official_v3_method_private','official_v3_method_api','official_v3_intake_private','official_v3_intake_api')
)
SELECT jsonb_build_object(
 'database',(SELECT to_jsonb(d)-ARRAY['datfrozenxid','datminmxid'] FROM pg_catalog.pg_database d WHERE d.datname=current_database()),
 'creator',(SELECT to_jsonb(r) FROM pg_catalog.pg_roles r WHERE r.rolname='postgres'),
 'namespaces',(SELECT jsonb_agg(to_jsonb(n) ORDER BY n.oid) FROM pg_catalog.pg_namespace n JOIN ns s ON s.oid=n.oid),
 'roles',(SELECT jsonb_agg(to_jsonb(r) ORDER BY r.oid) FROM pg_catalog.pg_roles r JOIN role_ids i ON i.oid=r.oid),
 'memberships',(SELECT jsonb_agg(to_jsonb(m) ORDER BY m.oid) FROM pg_catalog.pg_auth_members m
   WHERE EXISTS(SELECT 1 FROM role_ids r WHERE r.oid IN (m.roleid,m.member,m.grantor))
    AND NOT(m.roleid='ot_v3_result_owner'::regrole AND m.member='postgres'::regrole AND m.grantor='postgres'::regrole
     AND NOT m.admin_option AND NOT m.inherit_option AND m.set_option)),
 'settings',(SELECT jsonb_agg(to_jsonb(s) ORDER BY s.setdatabase,s.setrole) FROM pg_catalog.pg_db_role_setting s
   WHERE s.setrole='postgres'::regrole OR s.setrole IN (SELECT oid FROM role_ids)),
 'defaults',(SELECT jsonb_agg(to_jsonb(d) ORDER BY d.oid) FROM pg_catalog.pg_default_acl d
   WHERE d.defaclrole IN (SELECT oid FROM role_ids) OR d.defaclnamespace IN (SELECT oid FROM ns)
    OR (d.defaclrole='postgres'::regrole AND d.defaclnamespace=0)),
 'functions',(SELECT jsonb_agg(jsonb_build_object('catalog',to_jsonb(p)-ARRAY['prosrc','prosqlbody','probin'],
   'definition',encode(sha256(convert_to(pg_get_functiondef(p.oid),'UTF8')),'hex')) ORDER BY p.oid)
   FROM pg_catalog.pg_proc p JOIN ns n ON n.oid=p.pronamespace),
 'relations',(SELECT jsonb_agg(jsonb_build_object('catalog',to_jsonb(c)-ARRAY['relpages','reltuples','relallvisible','relfrozenxid','relminmxid'],
   'attributes',(SELECT jsonb_agg(to_jsonb(a) ORDER BY a.attnum) FROM pg_catalog.pg_attribute a WHERE a.attrelid=c.oid),
   'constraints',(SELECT jsonb_agg(to_jsonb(k) ORDER BY k.oid) FROM pg_catalog.pg_constraint k WHERE k.conrelid=c.oid),
   'indexes',(SELECT jsonb_agg(to_jsonb(i) ORDER BY i.indexrelid) FROM pg_catalog.pg_index i WHERE i.indrelid=c.oid OR i.indexrelid=c.oid),
   'policies',(SELECT jsonb_agg(to_jsonb(p) ORDER BY p.oid) FROM pg_catalog.pg_policy p WHERE p.polrelid=c.oid),
   'triggers',(SELECT jsonb_agg(to_jsonb(g) ORDER BY g.oid) FROM pg_catalog.pg_trigger g WHERE g.tgrelid=c.oid),
   'defaults',(SELECT jsonb_agg(to_jsonb(d) ORDER BY d.adnum) FROM pg_catalog.pg_attrdef d WHERE d.adrelid=c.oid),
   'inheritance',(SELECT jsonb_agg(to_jsonb(i) ORDER BY i.inhrelid,i.inhparent) FROM pg_catalog.pg_inherits i WHERE i.inhrelid=c.oid OR i.inhparent=c.oid),
   'rewrites',(SELECT jsonb_agg(to_jsonb(r) ORDER BY r.oid) FROM pg_catalog.pg_rewrite r WHERE r.ev_class=c.oid))
   ORDER BY c.oid) FROM pg_catalog.pg_class c JOIN classes i ON i.oid=c.oid),
 'types',(SELECT jsonb_agg(to_jsonb(t) ORDER BY t.oid) FROM pg_catalog.pg_type t JOIN ns n ON n.oid=t.typnamespace),
 'objects',(SELECT jsonb_agg(to_jsonb(o) ORDER BY o.classid,o.objid) FROM objects o),
 'dependencies',(SELECT jsonb_agg(to_jsonb(d) ORDER BY d.classid,d.objid,d.objsubid,d.refclassid,d.refobjid,d.refobjsubid,d.deptype)
   FROM pg_catalog.pg_depend d WHERE (d.classid,d.objid) IN (SELECT classid,objid FROM objects)
     OR (d.refclassid,d.refobjid) IN (SELECT classid,objid FROM objects)),
 'shared',(SELECT jsonb_agg(to_jsonb(d) ORDER BY d.dbid,d.classid,d.objid,d.objsubid,d.refclassid,d.refobjid,d.deptype)
   FROM pg_catalog.pg_shdepend d WHERE ((d.dbid=(SELECT b.oid FROM pg_catalog.pg_database b WHERE b.datname=current_database())
    AND (d.classid,d.objid) IN (SELECT classid,objid FROM objects))
    OR (d.refclassid='pg_catalog.pg_authid'::regclass AND d.refobjid IN (SELECT oid FROM role_ids)))
    AND NOT(d.dbid=0 AND d.classid='pg_catalog.pg_auth_members'::regclass AND EXISTS(
     SELECT 1 FROM pg_catalog.pg_auth_members m WHERE m.oid=d.objid AND m.roleid='ot_v3_result_owner'::regrole
      AND m.member='postgres'::regrole AND m.grantor='postgres'::regrole
      AND NOT m.admin_option AND NOT m.inherit_option AND m.set_option))),
 'descriptions',(SELECT jsonb_agg(to_jsonb(d) ORDER BY d.classoid,d.objoid,d.objsubid) FROM pg_catalog.pg_description d
   JOIN objects o ON o.classid=d.classoid AND o.objid=d.objoid),
 'labels',(SELECT jsonb_agg(to_jsonb(s) ORDER BY s.classoid,s.objoid,s.objsubid,s.provider) FROM pg_catalog.pg_seclabel s
   JOIN objects o ON o.classid=s.classoid AND o.objid=s.objoid),
 'prerequisiteFunctions',(SELECT jsonb_agg(jsonb_build_object('catalog',to_jsonb(p)-ARRAY['prosrc','prosqlbody','probin'],
   'definition',encode(sha256(convert_to(pg_get_functiondef(p.oid),'UTF8')),'hex')) ORDER BY p.oid)
   FROM pg_catalog.pg_proc p JOIN prerequisite_ns n ON n.oid=p.pronamespace),
 'prerequisiteRelations',(SELECT jsonb_agg(jsonb_build_object('oid',c.oid,'namespace',c.relnamespace,'owner',c.relowner,'kind',c.relkind,
   'acl',c.relacl,'rls',c.relrowsecurity,'force',c.relforcerowsecurity,'options',c.reloptions,
   'attributes',(SELECT jsonb_agg(to_jsonb(a) ORDER BY a.attnum) FROM pg_catalog.pg_attribute a WHERE a.attrelid=c.oid),
   'constraints',(SELECT jsonb_agg(to_jsonb(k) ORDER BY k.oid) FROM pg_catalog.pg_constraint k WHERE k.conrelid=c.oid),
   'triggers',(SELECT jsonb_agg(to_jsonb(g) ORDER BY g.oid) FROM pg_catalog.pg_trigger g WHERE g.tgrelid=c.oid),
   'policies',(SELECT jsonb_agg(to_jsonb(p) ORDER BY p.oid) FROM pg_catalog.pg_policy p WHERE p.polrelid=c.oid))
   ORDER BY c.oid) FROM pg_catalog.pg_class c JOIN prerequisite_ns n ON n.oid=c.relnamespace)
)) AS value
 ) q;
 IF actual_catalog IS DISTINCT FROM pg_catalog.current_setting('jetnity.hrs1_install_frozen_catalog')::jsonb THEN
  RAISE EXCEPTION 'hrs1 final catalog differs after temporary rights removal' USING ERRCODE='P7802';
 END IF;
 FOR role_row IN SELECT role.* FROM pg_catalog.pg_roles role WHERE role.rolname IN
  ('ot_v3_result_owner','ot_v3_result_writer','ot_v3_result_reader','ot_v3_result_verifier') LOOP
  IF role_row.rolcanlogin IS DISTINCT FROM (role_row.rolname<>'ot_v3_result_owner') OR role_row.rolinherit OR role_row.rolsuper
   OR role_row.rolcreatedb OR role_row.rolcreaterole OR role_row.rolbypassrls OR role_row.rolreplication OR role_row.rolconfig IS NOT NULL
   OR role_row.rolvaliduntil IS NOT NULL OR role_row.rolconnlimit<>(CASE WHEN role_row.rolname='ot_v3_result_owner' THEN -1 ELSE 2 END)
   OR EXISTS(SELECT 1 FROM pg_catalog.pg_db_role_setting settings WHERE settings.setrole=role_row.oid)
   OR EXISTS(SELECT 1 FROM pg_catalog.pg_default_acl defaults WHERE defaults.defaclrole=role_row.oid)
   OR (SELECT count(*) FROM pg_catalog.pg_auth_members membership WHERE role_row.oid IN (membership.roleid,membership.member,membership.grantor))<>1
   OR NOT EXISTS(SELECT 1 FROM pg_catalog.pg_auth_members membership WHERE membership.roleid=role_row.oid
    AND membership.member='postgres'::regrole AND membership.grantor=10 AND membership.admin_option
    AND NOT membership.inherit_option AND NOT membership.set_option)
   OR pg_catalog.pg_has_role('postgres'::regrole,role_row.oid,'USAGE')
   OR pg_catalog.pg_has_role('postgres'::regrole,role_row.oid,'SET') THEN
   RAISE EXCEPTION 'hrs1 final role topology differs' USING ERRCODE='P7802';
  END IF;
 END LOOP;
 IF (SELECT count(*) FROM pg_catalog.pg_auth_members membership WHERE 'ot_v3_intake_owner'::regrole IN
   (membership.roleid,membership.member,membership.grantor))<>1
  OR NOT EXISTS(SELECT 1 FROM pg_catalog.pg_auth_members membership WHERE membership.roleid='ot_v3_intake_owner'::regrole
    AND membership.member='postgres'::regrole AND membership.grantor=10 AND membership.admin_option
    AND NOT membership.inherit_option AND NOT membership.set_option)
  OR pg_catalog.pg_has_role('postgres'::regrole,'ot_v3_intake_owner'::regrole,'USAGE')
  OR pg_catalog.pg_has_role('postgres'::regrole,'ot_v3_intake_owner'::regrole,'SET') THEN
  RAISE EXCEPTION 'hrs1 original intake role topology differs' USING ERRCODE='P7802';
 END IF;
END $hrs1_final_state$;
COMMIT;

