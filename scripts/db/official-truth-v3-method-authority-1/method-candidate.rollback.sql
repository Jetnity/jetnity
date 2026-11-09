-- MA1 disposable owned-native-fixture removal ONLY. Never a hosted recovery/apply.
BEGIN;
SET LOCAL search_path=pg_catalog;
DO $ma1_owned_fixture$
BEGIN
  IF pg_catalog.current_setting('jetnity.ma1_fixture',true) IS DISTINCT FROM 'jetnity-ma1-disposable-native-v1'
    OR pg_catalog.current_database()<>'postgres' OR session_user<>'ot_pilot_owner' OR current_user<>session_user
    OR pg_catalog.inet_server_addr() IS NOT NULL OR pg_catalog.inet_client_addr() IS NOT NULL
    OR pg_catalog.current_setting('unix_socket_directories') !~ '/ot-pilot-1-[A-Za-z0-9]+/socket$'
    OR pg_catalog.strpos(pg_catalog.current_setting('unix_socket_directories'),',')>0
    OR NOT EXISTS (SELECT 1 FROM pg_catalog.pg_roles WHERE rolname=session_user AND rolsuper)
    OR (SELECT count(*) FROM pg_catalog.pg_namespace n WHERE n.nspname IN ('official_v3_method_private','official_v3_method_api')
      AND n.nspowner='postgres'::pg_catalog.regrole AND pg_catalog.obj_description(n.oid,'pg_namespace')='jetnity:ma1:unapplied-candidate-v1')<>2 THEN
    RAISE EXCEPTION 'ma1 disposable fixture guard invalid' USING ERRCODE='P7506';
  END IF;
END
$ma1_owned_fixture$;
LOCK TABLE official_v3_method_private.heads_v1,official_v3_method_private.revisions_v1,
  official_v3_method_private.operations_v1 IN ACCESS EXCLUSIVE MODE;
DO $ma1_empty_after_all_waits$
BEGIN
  IF EXISTS(SELECT 1 FROM official_v3_method_private.heads_v1)
    OR EXISTS(SELECT 1 FROM official_v3_method_private.revisions_v1)
    OR EXISTS(SELECT 1 FROM official_v3_method_private.operations_v1) THEN
    RAISE EXCEPTION 'ma1 retained history prevents rollback' USING ERRCODE='P7507';
  END IF;
END
$ma1_empty_after_all_waits$;
-- This explicit inventory precedes every DROP. RESTRICT alone is not an ACL/membership guard.
DO $ma1_exact_boundary$
DECLARE
  owner_oid oid:='postgres'::pg_catalog.regrole;
  reader_oid oid:='ot_v3_method_reader'::pg_catalog.regrole;
  human_oid oid:='authenticated'::pg_catalog.regrole;
  e record; f record; assigned oid; boundary_error CONSTANT text:='P7506';
BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_catalog.pg_roles r WHERE r.oid=reader_oid
    AND NOT r.rolcanlogin AND NOT r.rolinherit AND NOT r.rolsuper AND NOT r.rolcreatedb
    AND NOT r.rolcreaterole AND NOT r.rolreplication AND NOT r.rolbypassrls
    AND r.rolconnlimit=-1 AND r.rolvaliduntil IS NULL)
    OR EXISTS (SELECT 1 FROM pg_catalog.pg_auth_members m WHERE m.roleid=reader_oid OR m.member=reader_oid)
    OR EXISTS (SELECT 1 FROM pg_catalog.pg_db_role_setting s WHERE s.setrole=reader_oid)
    OR (SELECT count(*) FROM pg_catalog.pg_namespace n WHERE n.nspname IN ('official_v3_method_private','official_v3_method_api')
      AND n.nspowner=owner_oid AND pg_catalog.obj_description(n.oid,'pg_namespace')='jetnity:ma1:unapplied-candidate-v1')<>2 THEN
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
    ('operations_v1_shape',$ma1_expected$((operation_id ~ '^maop1_[0-9a-f]{32}$'::text) AND (action = ANY (ARRAY['stage'::text, 'approve'::text, 'revoke'::text])) AND (method_id ~ '^[a-z][a-z0-9_-]{1,63}$'::text) AND ((revision >= 1) AND (revision <= 2147483647)) AND (jsonb_typeof(command) = 'object'::text) AND (octet_length((command)::text) <= 4096) AND (command ?& ARRAY['schema'::text, 'operationId'::text, 'action'::text, 'methodId'::text, 'revision'::text, 'methodDigest'::text, 'packageDigest'::text, 'predecessorRevision'::text, 'expected'::text, 'approval'::text]) AND ((command - ARRAY['schema'::text, 'operationId'::text, 'action'::text, 'methodId'::text, 'revision'::text, 'methodDigest'::text, 'packageDigest'::text, 'predecessorRevision'::text, 'expected'::text, 'approval'::text]) = '{}'::jsonb) AND ((command -> 'schema'::text) = '1'::jsonb) AND ((command -> 'revision'::text) = to_jsonb(revision)) AND ((command ->> 'operationId'::text) = operation_id) AND ((command ->> 'action'::text) = action) AND ((command ->> 'methodId'::text) = method_id) AND (command = official_v3_method_private.command_v1(operation_id, action, method_id, revision, (command ->> 'methodDigest'::text), (command ->> 'packageDigest'::text), ((command ->> 'predecessorRevision'::text))::integer, (((command -> 'expected'::text) ->> 'revision'::text))::integer, ((command -> 'expected'::text) ->> 'methodDigest'::text), ((command -> 'expected'::text) ->> 'packageDigest'::text), (((command -> 'expected'::text) ->> 'epoch'::text))::integer, ((command -> 'expected'::text) ->> 'status'::text), ((command -> 'approval'::text) ->> 'mode'::text), ((command -> 'approval'::text) ->> 'until'::text)))) AND ((before_state IS NULL) OR ((jsonb_typeof(before_state) = 'object'::text) AND (octet_length((before_state)::text) <= 1024) AND (before_state ?& ARRAY['methodId'::text, 'revision'::text, 'methodDigest'::text, 'packageDigest'::text, 'epoch'::text, 'status'::text, 'approvalMode'::text, 'approvalUntil'::text]) AND ((before_state - ARRAY['methodId'::text, 'revision'::text, 'methodDigest'::text, 'packageDigest'::text, 'epoch'::text, 'status'::text, 'approvalMode'::text, 'approvalUntil'::text]) = '{}'::jsonb) AND ((before_state ->> 'methodId'::text) = method_id))) AND ((after_state IS NULL) OR ((jsonb_typeof(after_state) = 'object'::text) AND (octet_length((after_state)::text) <= 1024) AND (after_state ?& ARRAY['methodId'::text, 'revision'::text, 'methodDigest'::text, 'packageDigest'::text, 'epoch'::text, 'status'::text, 'approvalMode'::text, 'approvalUntil'::text]) AND ((after_state - ARRAY['methodId'::text, 'revision'::text, 'methodDigest'::text, 'packageDigest'::text, 'epoch'::text, 'status'::text, 'approvalMode'::text, 'approvalUntil'::text]) = '{}'::jsonb) AND ((after_state ->> 'methodId'::text) = method_id))) AND isfinite(recorded_at))$ma1_expected$)
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

DROP FUNCTION official_v3_method_api.stage_draft_v1(text,text,integer,text,text,integer) RESTRICT;
DROP FUNCTION official_v3_method_api.approve_v1(text,text,integer,text,text,integer,text,text,integer,text,text,text) RESTRICT;
DROP FUNCTION official_v3_method_api.revoke_v1(text,text,integer,text,text,integer) RESTRICT;
DROP FUNCTION official_v3_method_api.confirm_operation_v1(text,text,text,integer,text,text,integer,integer,text,text,integer,text,text,text) RESTRICT;
DROP FUNCTION official_v3_method_api.read_current_v1(text,integer,text,text,text) RESTRICT;
DROP FUNCTION official_v3_method_private.require_current_locked_v1(text,integer,text,text,integer) RESTRICT;
DROP TRIGGER operations_v1_immutable ON official_v3_method_private.operations_v1 RESTRICT;
DROP TRIGGER revisions_v1_immutable ON official_v3_method_private.revisions_v1 RESTRICT;
DROP TABLE official_v3_method_private.operations_v1 RESTRICT;
DROP TABLE official_v3_method_private.heads_v1 RESTRICT;
DROP TABLE official_v3_method_private.revisions_v1 RESTRICT;
DROP FUNCTION official_v3_method_private.immutable_v1() RESTRICT;
DROP FUNCTION official_v3_method_private.command_v1(text,text,text,integer,text,text,integer,integer,text,text,integer,text,text,text) RESTRICT;
DROP FUNCTION official_v3_method_private.timestamp_v1(text) RESTRICT;
DROP FUNCTION official_v3_method_private.tuple_valid_v1(text,integer,text,text) RESTRICT;
DROP SCHEMA official_v3_method_api RESTRICT;
DROP SCHEMA official_v3_method_private RESTRICT;
DROP ROLE ot_v3_method_reader;
COMMIT;
