-- HMA1 UNAPPLIED hosted-creator companion. No installation or method approval is implied.
-- Exact independent PG1 prerequisite; all ten original MA1 runtime declarations remain unchanged.
-- Only newly created MA1 objects and the exact PostgreSQL17 automatic reader ADMIN edge.
-- Root must bind actual target, API exclusion, signed Owner path and recovery before apply.
BEGIN;
SET LOCAL search_path=pg_catalog;
SET LOCAL lock_timeout='2s';
SET LOCAL statement_timeout='30s';
-- Consistent lock order with PG1 prevents its cooperating pre-use removal
-- racing this installation. These are not a universal external DDL barrier.
SELECT pg_catalog.pg_advisory_xact_lock(771101,1);
SELECT pg_catalog.pg_advisory_xact_lock(771102,1);
DO $hma1_creator$
DECLARE owner_oid oid; version_number integer;
BEGIN
  version_number:=pg_catalog.current_setting('server_version_num')::integer;
  SELECT oid INTO owner_oid FROM pg_catalog.pg_roles
    WHERE rolname='postgres' AND NOT rolsuper AND rolbypassrls AND rolcreaterole;
  IF owner_oid IS NULL OR session_user<>'postgres' OR current_user<>'postgres'
    OR version_number<170000 OR version_number>=180000
    OR pg_catalog.current_setting('server_encoding')<>'UTF8'
    OR pg_catalog.current_setting('createrole_self_grant',true) IS DISTINCT FROM ''
    OR pg_catalog.current_database()<>'postgres'
    OR NOT EXISTS(SELECT 1 FROM pg_catalog.pg_database WHERE datname=pg_catalog.current_database() AND datdba=owner_oid)
    OR NOT EXISTS(SELECT 1 FROM pg_catalog.pg_roles WHERE oid=10 AND rolsuper)
    OR (SELECT count(*) FROM pg_catalog.pg_roles WHERE rolname IN ('anon','authenticated','service_role'))<>3
    OR EXISTS(SELECT 1 FROM pg_catalog.pg_auth_members WHERE roleid=owner_oid)
    OR EXISTS(SELECT 1 FROM pg_catalog.pg_roles r WHERE r.rolname IN ('anon','authenticated','service_role')
      AND (pg_catalog.pg_has_role(r.oid,owner_oid,'SET') OR pg_catalog.pg_has_role(r.oid,owner_oid,'USAGE'))) THEN
    RAISE EXCEPTION 'hma1 creator boundary invalid' USING ERRCODE='P7801';
  END IF;
END
$hma1_creator$;

-- Read-only complete PG1 prerequisite before any destination mutation.
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

DO $ma1_prerequisites$
DECLARE owner_oid oid; helper record;
BEGIN
  SELECT oid INTO owner_oid FROM pg_catalog.pg_roles WHERE rolname='postgres';
  IF owner_oid IS NULL
    OR (SELECT count(*) FROM pg_catalog.pg_roles WHERE rolname IN ('anon','authenticated','service_role'))<>3
    OR EXISTS (SELECT 1 FROM pg_catalog.pg_namespace WHERE nspname IN ('official_v3_method_private','official_v3_method_api'))
    OR EXISTS (SELECT 1 FROM pg_catalog.pg_roles WHERE rolname='ot_v3_method_reader') THEN
    RAISE EXCEPTION 'ma1 prerequisite boundary invalid' USING ERRCODE='P7505';
  END IF;
  SELECT p.* INTO helper FROM pg_catalog.pg_proc p
    WHERE p.oid=pg_catalog.to_regprocedure('jetnity_ot_auth.require_current_owner_session_v1()');
  IF NOT FOUND OR helper.proowner<>owner_oid OR NOT helper.prosecdef
    OR helper.provolatile<>'v' OR helper.proparallel<>'u' OR helper.proisstrict
    OR helper.prorettype<>'pg_catalog.void'::pg_catalog.regtype
    OR helper.proconfig IS DISTINCT FROM ARRAY['search_path=pg_catalog','lock_timeout=2s']::text[]
    OR pg_catalog.encode(pg_catalog.sha256(pg_catalog.convert_to(helper.prosrc,'UTF8')),'hex')
      <>'ba3667edd483f0a0abcf53f70f4dc71906f0ffdbc192ee569232c78dd359635b'
    OR EXISTS (SELECT 1 FROM pg_catalog.aclexplode(COALESCE(helper.proacl,pg_catalog.acldefault('f',owner_oid))) a
      WHERE a.grantee<>owner_oid) THEN
    RAISE EXCEPTION 'ma1 prerequisite boundary invalid' USING ERRCODE='P7505';
  END IF;
END
$ma1_prerequisites$;

CREATE ROLE ot_v3_method_reader NOLOGIN NOINHERIT NOSUPERUSER NOCREATEDB NOCREATEROLE NOREPLICATION NOBYPASSRLS;
-- Create as the actual installer first. Inspect creator ACLs before ALTER OWNER.
CREATE SCHEMA official_v3_method_private;
CREATE SCHEMA official_v3_method_api;

CREATE FUNCTION official_v3_method_private.tuple_valid_v1(
  p_method_id text,p_revision integer,p_method_digest text,p_package_digest text
) RETURNS boolean LANGUAGE sql IMMUTABLE PARALLEL SAFE SECURITY INVOKER
SET search_path=pg_catalog AS $$
  SELECT COALESCE(p_method_id ~ '^[a-z][a-z0-9_-]{1,63}$'
    AND p_revision BETWEEN 1 AND 2147483647
    AND p_method_digest ~ '^[0-9a-f]{64}$' AND p_package_digest ~ '^[0-9a-f]{64}$',false)
$$;

CREATE FUNCTION official_v3_method_private.timestamp_v1(p_value text)
RETURNS timestamptz LANGUAGE plpgsql IMMUTABLE PARALLEL SAFE SECURITY INVOKER
SET search_path=pg_catalog AS $$
DECLARE parsed timestamptz;
BEGIN
  IF p_value IS NULL OR pg_catalog.octet_length(p_value)<>24
    OR p_value !~ '^[0-9]{4}-(0[1-9]|1[0-2])-(0[1-9]|[12][0-9]|3[01])T([01][0-9]|2[0-3]):[0-5][0-9]:[0-5][0-9]\.[0-9]{3}Z$'
    OR pg_catalog.left(p_value,4)='0000' THEN
    RAISE EXCEPTION 'ma1 invalid closed input' USING ERRCODE='P7501';
  END IF;
  BEGIN
    parsed:=p_value::timestamptz;
  EXCEPTION WHEN datetime_field_overflow OR invalid_datetime_format THEN
    RAISE EXCEPTION 'ma1 invalid closed input' USING ERRCODE='P7501';
  END;
  IF NOT pg_catalog.isfinite(parsed)
    OR pg_catalog.to_char(parsed AT TIME ZONE 'UTC','YYYY-MM-DD"T"HH24:MI:SS.MS"Z"')<>p_value THEN
    RAISE EXCEPTION 'ma1 invalid closed input' USING ERRCODE='P7501';
  END IF;
  RETURN parsed;
END $$;

CREATE FUNCTION official_v3_method_private.command_v1(
  p_operation_id text,p_action text,p_method_id text,p_revision integer,
  p_method_digest text,p_package_digest text,p_predecessor_revision integer,
  p_expected_revision integer,p_expected_method_digest text,p_expected_package_digest text,
  p_expected_epoch integer,p_expected_status text,p_approval_mode text,p_approval_until text
) RETURNS jsonb LANGUAGE plpgsql IMMUTABLE PARALLEL SAFE SECURITY INVOKER
SET search_path=pg_catalog AS $$
DECLARE expected jsonb; approval jsonb; command jsonb;
BEGIN
  IF p_operation_id IS NULL OR p_operation_id !~ '^maop1_[0-9a-f]{32}$'
    OR p_action IS NULL OR p_action NOT IN ('stage','approve','revoke')
    OR NOT official_v3_method_private.tuple_valid_v1(p_method_id,p_revision,p_method_digest,p_package_digest) THEN
    RAISE EXCEPTION 'ma1 invalid closed input' USING ERRCODE='P7501';
  END IF;
  IF p_action='stage' THEN
    IF (p_revision=1 AND p_predecessor_revision IS NOT NULL)
      OR (p_revision>1 AND p_predecessor_revision IS DISTINCT FROM p_revision-1)
      OR p_expected_revision IS NOT NULL OR p_expected_method_digest IS NOT NULL
      OR p_expected_package_digest IS NOT NULL OR p_expected_epoch IS NOT NULL
      OR p_expected_status IS NOT NULL OR p_approval_mode IS NOT NULL OR p_approval_until IS NOT NULL THEN
      RAISE EXCEPTION 'ma1 invalid closed input' USING ERRCODE='P7501';
    END IF;
    expected:=NULL; approval:=NULL;
  ELSE
    IF p_predecessor_revision IS NOT NULL OR p_expected_epoch IS NULL
      OR p_expected_epoch NOT BETWEEN 0 AND 2147483647 THEN
      RAISE EXCEPTION 'ma1 invalid closed input' USING ERRCODE='P7501';
    END IF;
    IF p_expected_epoch=0 THEN
      IF p_action<>'approve' OR p_expected_revision IS NOT NULL OR p_expected_method_digest IS NOT NULL
        OR p_expected_package_digest IS NOT NULL OR p_expected_status IS NOT NULL THEN
        RAISE EXCEPTION 'ma1 invalid closed input' USING ERRCODE='P7501';
      END IF;
    ELSIF NOT official_v3_method_private.tuple_valid_v1(p_method_id,p_expected_revision,p_expected_method_digest,p_expected_package_digest)
      OR p_expected_status IS NULL OR p_expected_status NOT IN ('approved','revoked') THEN
      RAISE EXCEPTION 'ma1 invalid closed input' USING ERRCODE='P7501';
    END IF;
    expected:=pg_catalog.jsonb_build_object('revision',p_expected_revision,'methodDigest',p_expected_method_digest,
      'packageDigest',p_expected_package_digest,'epoch',p_expected_epoch,'status',p_expected_status);
    IF p_action='approve' THEN
      IF p_approval_mode IS NULL OR p_approval_mode NOT IN ('until','until_revoked')
        OR (p_approval_mode='until_revoked' AND p_approval_until IS NOT NULL) THEN
        RAISE EXCEPTION 'ma1 invalid closed input' USING ERRCODE='P7501';
      END IF;
      IF p_approval_mode='until' THEN PERFORM official_v3_method_private.timestamp_v1(p_approval_until); END IF;
      approval:=pg_catalog.jsonb_build_object('mode',p_approval_mode,'until',p_approval_until);
    ELSE
      IF p_expected_epoch=0 OR p_expected_status IS DISTINCT FROM 'approved'
        OR p_expected_revision IS DISTINCT FROM p_revision
        OR p_expected_method_digest IS DISTINCT FROM p_method_digest
        OR p_expected_package_digest IS DISTINCT FROM p_package_digest
        OR p_approval_mode IS NOT NULL OR p_approval_until IS NOT NULL THEN
        RAISE EXCEPTION 'ma1 invalid closed input' USING ERRCODE='P7501';
      END IF;
      approval:=NULL;
    END IF;
  END IF;
  command:=pg_catalog.jsonb_build_object('schema',1,'operationId',p_operation_id,'action',p_action,
    'methodId',p_method_id,'revision',p_revision,'methodDigest',p_method_digest,'packageDigest',p_package_digest,
    'predecessorRevision',p_predecessor_revision,'expected',expected,'approval',approval);
  IF pg_catalog.octet_length(command::text)>4096 THEN
    RAISE EXCEPTION 'ma1 invalid closed input' USING ERRCODE='P7501';
  END IF;
  RETURN command;
END $$;

CREATE TABLE official_v3_method_private.revisions_v1 (
  method_id text NOT NULL, revision integer NOT NULL, method_digest text NOT NULL, package_digest text NOT NULL,
  predecessor_revision integer, staged_at timestamptz NOT NULL, staged_by uuid NOT NULL,
  CONSTRAINT revisions_v1_pkey PRIMARY KEY(method_id,revision),
  CONSTRAINT revisions_v1_tuple_key UNIQUE(method_id,revision,method_digest,package_digest),
  CONSTRAINT revisions_v1_predecessor_fk FOREIGN KEY(method_id,predecessor_revision)
    REFERENCES official_v3_method_private.revisions_v1(method_id,revision),
  CONSTRAINT revisions_v1_shape CHECK(
    official_v3_method_private.tuple_valid_v1(method_id,revision,method_digest,package_digest)
    AND ((revision=1 AND predecessor_revision IS NULL)
      OR (revision>1 AND predecessor_revision IS NOT NULL AND predecessor_revision=revision-1))
    AND pg_catalog.isfinite(staged_at))
);

CREATE TABLE official_v3_method_private.heads_v1 (
  method_id text NOT NULL, revision integer NOT NULL, method_digest text NOT NULL, package_digest text NOT NULL,
  epoch integer NOT NULL, status text NOT NULL, approval_mode text, approval_until timestamptz,
  changed_at timestamptz NOT NULL, changed_by uuid NOT NULL, operation_id text NOT NULL,
  CONSTRAINT heads_v1_pkey PRIMARY KEY(method_id),
  CONSTRAINT heads_v1_revision_fk FOREIGN KEY(method_id,revision,method_digest,package_digest)
    REFERENCES official_v3_method_private.revisions_v1(method_id,revision,method_digest,package_digest),
  CONSTRAINT heads_v1_shape CHECK(
    official_v3_method_private.tuple_valid_v1(method_id,revision,method_digest,package_digest)
    AND epoch BETWEEN 1 AND 2147483647 AND status IN ('approved','revoked')
    AND operation_id ~ '^maop1_[0-9a-f]{32}$' AND pg_catalog.isfinite(changed_at)
    AND ((status='revoked' AND approval_mode IS NULL AND approval_until IS NULL)
      OR (status='approved' AND epoch<=2147483646 AND approval_mode IS NOT NULL
        AND ((approval_mode='until_revoked' AND approval_until IS NULL)
          OR (approval_mode='until' AND approval_until IS NOT NULL AND pg_catalog.isfinite(approval_until)
            AND pg_catalog.date_trunc('milliseconds',approval_until)=approval_until
            AND extract(year FROM approval_until AT TIME ZONE 'UTC') BETWEEN 1 AND 9999)))))
);

CREATE TABLE official_v3_method_private.operations_v1 (
  operation_id text NOT NULL, action text NOT NULL, method_id text NOT NULL, revision integer NOT NULL,
  command jsonb NOT NULL, before_state jsonb, after_state jsonb, actor_id uuid NOT NULL, recorded_at timestamptz NOT NULL,
  CONSTRAINT operations_v1_pkey PRIMARY KEY(operation_id),
  CONSTRAINT operations_v1_revision_fk FOREIGN KEY(method_id,revision)
    REFERENCES official_v3_method_private.revisions_v1(method_id,revision),
  CONSTRAINT operations_v1_shape CHECK(
    operation_id ~ '^maop1_[0-9a-f]{32}$' AND action IN ('stage','approve','revoke')
    AND method_id ~ '^[a-z][a-z0-9_-]{1,63}$' AND revision BETWEEN 1 AND 2147483647
    AND pg_catalog.jsonb_typeof(command)='object' AND pg_catalog.octet_length(command::text)<=4096
    AND command ?& ARRAY['schema','operationId','action','methodId','revision','methodDigest','packageDigest','predecessorRevision','expected','approval']
    AND command-ARRAY['schema','operationId','action','methodId','revision','methodDigest','packageDigest','predecessorRevision','expected','approval']='{}'::jsonb
    AND command->'schema'='1'::jsonb AND command->'revision'=pg_catalog.to_jsonb(revision)
    AND command->>'operationId'=operation_id AND command->>'action'=action AND command->>'methodId'=method_id
    AND command=official_v3_method_private.command_v1(operation_id,action,method_id,revision,
      command->>'methodDigest',command->>'packageDigest',(command->>'predecessorRevision')::integer,
      (command->'expected'->>'revision')::integer,command->'expected'->>'methodDigest',command->'expected'->>'packageDigest',
      (command->'expected'->>'epoch')::integer,command->'expected'->>'status',command->'approval'->>'mode',command->'approval'->>'until')
    AND (before_state IS NULL OR (pg_catalog.jsonb_typeof(before_state)='object'
      AND pg_catalog.octet_length(before_state::text)<=1024
      AND before_state ?& ARRAY['methodId','revision','methodDigest','packageDigest','epoch','status','approvalMode','approvalUntil']
      AND before_state-ARRAY['methodId','revision','methodDigest','packageDigest','epoch','status','approvalMode','approvalUntil']='{}'::jsonb
      AND before_state->>'methodId'=method_id))
    AND (after_state IS NULL OR (pg_catalog.jsonb_typeof(after_state)='object'
      AND pg_catalog.octet_length(after_state::text)<=1024
      AND after_state ?& ARRAY['methodId','revision','methodDigest','packageDigest','epoch','status','approvalMode','approvalUntil']
      AND after_state-ARRAY['methodId','revision','methodDigest','packageDigest','epoch','status','approvalMode','approvalUntil']='{}'::jsonb
      AND after_state->>'methodId'=method_id)) AND pg_catalog.isfinite(recorded_at))
);

CREATE FUNCTION official_v3_method_private.immutable_v1()
RETURNS trigger LANGUAGE plpgsql VOLATILE PARALLEL UNSAFE SECURITY INVOKER
SET search_path=pg_catalog AS $$
BEGIN RAISE EXCEPTION 'ma1 immutable history' USING ERRCODE='P7508'; END $$;
CREATE TRIGGER revisions_v1_immutable BEFORE UPDATE OR DELETE ON official_v3_method_private.revisions_v1
FOR EACH ROW EXECUTE FUNCTION official_v3_method_private.immutable_v1();
CREATE TRIGGER operations_v1_immutable BEFORE UPDATE OR DELETE ON official_v3_method_private.operations_v1
FOR EACH ROW EXECUTE FUNCTION official_v3_method_private.immutable_v1();

CREATE FUNCTION official_v3_method_api.confirm_operation_v1(
  p_operation_id text,p_action text,p_method_id text,p_revision integer,
  p_method_digest text,p_package_digest text,p_predecessor_revision integer,
  p_expected_revision integer,p_expected_method_digest text,p_expected_package_digest text,
  p_expected_epoch integer,p_expected_status text,p_approval_mode text,p_approval_until text
) RETURNS jsonb LANGUAGE plpgsql VOLATILE PARALLEL UNSAFE SECURITY DEFINER
SET search_path=pg_catalog AS $$
DECLARE command jsonb; actor uuid; op official_v3_method_private.operations_v1%ROWTYPE;
BEGIN
  command:=official_v3_method_private.command_v1(p_operation_id,p_action,p_method_id,p_revision,p_method_digest,
    p_package_digest,p_predecessor_revision,p_expected_revision,p_expected_method_digest,p_expected_package_digest,
    p_expected_epoch,p_expected_status,p_approval_mode,p_approval_until);
  PERFORM pg_catalog.pg_advisory_xact_lock(750101,pg_catalog.hashtext(p_operation_id));
  PERFORM pg_catalog.pg_advisory_xact_lock(750102,pg_catalog.hashtext(p_method_id));
  LOCK TABLE official_v3_method_private.heads_v1,official_v3_method_private.revisions_v1,
    official_v3_method_private.operations_v1 IN ROW EXCLUSIVE MODE;
  PERFORM h.method_id FROM official_v3_method_private.heads_v1 h WHERE h.method_id=p_method_id FOR UPDATE;
  PERFORM r.revision FROM official_v3_method_private.revisions_v1 r WHERE r.method_id=p_method_id
    AND r.revision IN (p_revision,p_predecessor_revision,p_expected_revision) ORDER BY r.revision FOR SHARE;
  -- Every potentially waiting method/state lock precedes unchanged human checks.
  PERFORM jetnity_ot_auth.require_current_owner_session_v1();
  actor:=auth.uid();
  IF actor IS NULL THEN RAISE EXCEPTION 'ma1 prerequisite boundary invalid' USING ERRCODE='P7505'; END IF;
  SELECT o.* INTO op FROM official_v3_method_private.operations_v1 o WHERE o.operation_id=p_operation_id;
  IF NOT FOUND THEN RETURN pg_catalog.jsonb_build_object('status','absent','operationId',p_operation_id); END IF;
  IF op.command IS DISTINCT FROM command OR op.actor_id IS DISTINCT FROM actor THEN
    RAISE EXCEPTION 'ma1 operation collision' USING ERRCODE='P7502';
  END IF;
  -- No NEW-state CAS, predecessor, future-expiry or exhaustion check on replay.
  RETURN pg_catalog.jsonb_build_object('status','recorded','operationId',op.operation_id,'action',op.action,
    'command',op.command,'actorId',op.actor_id,'recordedAt',pg_catalog.to_char(op.recorded_at AT TIME ZONE 'UTC','YYYY-MM-DD"T"HH24:MI:SS.US"Z"'),
    'before',op.before_state,'after',op.after_state);
END $$;

CREATE FUNCTION official_v3_method_api.stage_draft_v1(
  p_operation_id text,p_method_id text,p_revision integer,p_method_digest text,p_package_digest text,p_predecessor_revision integer
) RETURNS jsonb LANGUAGE plpgsql VOLATILE PARALLEL UNSAFE SECURITY DEFINER
SET search_path=pg_catalog AS $$
DECLARE prior jsonb; command jsonb; snapshot jsonb; actor uuid; instant timestamptz;
  r official_v3_method_private.revisions_v1%ROWTYPE; op official_v3_method_private.operations_v1%ROWTYPE;
BEGIN
  prior:=official_v3_method_api.confirm_operation_v1(p_operation_id,'stage',p_method_id,p_revision,p_method_digest,p_package_digest,
    p_predecessor_revision,NULL,NULL,NULL,NULL,NULL,NULL,NULL);
  IF prior->>'status'='recorded' THEN RETURN prior; END IF;
  actor:=auth.uid(); instant:=pg_catalog.clock_timestamp();
  SELECT v.* INTO r FROM official_v3_method_private.revisions_v1 v WHERE v.method_id=p_method_id AND v.revision=p_revision;
  IF FOUND THEN
    IF r.method_digest<>p_method_digest OR r.package_digest<>p_package_digest
      OR r.predecessor_revision IS DISTINCT FROM p_predecessor_revision THEN
      RAISE EXCEPTION 'ma1 immutable revision collision' USING ERRCODE='P7502';
    END IF;
  ELSE
    IF p_predecessor_revision IS NOT NULL AND NOT EXISTS (SELECT 1 FROM official_v3_method_private.revisions_v1 v
      WHERE v.method_id=p_method_id AND v.revision=p_predecessor_revision) THEN
      RAISE EXCEPTION 'ma1 new state refused' USING ERRCODE='P7503';
    END IF;
    INSERT INTO official_v3_method_private.revisions_v1 VALUES
      (p_method_id,p_revision,p_method_digest,p_package_digest,p_predecessor_revision,instant,actor);
  END IF;
  SELECT pg_catalog.jsonb_build_object('methodId',h.method_id,'revision',h.revision,'methodDigest',h.method_digest,
    'packageDigest',h.package_digest,'epoch',h.epoch,'status',h.status,'approvalMode',h.approval_mode,
    'approvalUntil',pg_catalog.to_char(h.approval_until AT TIME ZONE 'UTC','YYYY-MM-DD"T"HH24:MI:SS.MS"Z"')) INTO snapshot
    FROM official_v3_method_private.heads_v1 h WHERE h.method_id=p_method_id;
  command:=official_v3_method_private.command_v1(p_operation_id,'stage',p_method_id,p_revision,p_method_digest,p_package_digest,
    p_predecessor_revision,NULL,NULL,NULL,NULL,NULL,NULL,NULL);
  INSERT INTO official_v3_method_private.operations_v1 VALUES
    (p_operation_id,'stage',p_method_id,p_revision,command,snapshot,snapshot,actor,instant) RETURNING * INTO op;
  RETURN pg_catalog.jsonb_build_object('status','recorded','operationId',op.operation_id,'action',op.action,
    'command',op.command,'actorId',op.actor_id,'recordedAt',pg_catalog.to_char(op.recorded_at AT TIME ZONE 'UTC','YYYY-MM-DD"T"HH24:MI:SS.US"Z"'),
    'before',op.before_state,'after',op.after_state);
END $$;

CREATE FUNCTION official_v3_method_api.approve_v1(
  p_operation_id text,p_method_id text,p_revision integer,p_method_digest text,p_package_digest text,
  p_expected_revision integer,p_expected_method_digest text,p_expected_package_digest text,p_expected_epoch integer,
  p_expected_status text,p_approval_mode text,p_approval_until text
) RETURNS jsonb LANGUAGE plpgsql VOLATILE PARALLEL UNSAFE SECURITY DEFINER
SET search_path=pg_catalog AS $$
DECLARE prior jsonb; command jsonb; before_snapshot jsonb; after_snapshot jsonb; actor uuid;
  instant timestamptz; until_at timestamptz; next_epoch integer; has_head boolean;
  h official_v3_method_private.heads_v1%ROWTYPE; op official_v3_method_private.operations_v1%ROWTYPE;
BEGIN
  prior:=official_v3_method_api.confirm_operation_v1(p_operation_id,'approve',p_method_id,p_revision,p_method_digest,p_package_digest,
    NULL,p_expected_revision,p_expected_method_digest,p_expected_package_digest,p_expected_epoch,p_expected_status,p_approval_mode,p_approval_until);
  IF prior->>'status'='recorded' THEN RETURN prior; END IF;
  SELECT v.* INTO h FROM official_v3_method_private.heads_v1 v WHERE v.method_id=p_method_id; has_head:=FOUND;
  IF NOT EXISTS (SELECT 1 FROM official_v3_method_private.revisions_v1 v WHERE v.method_id=p_method_id AND v.revision=p_revision
    AND v.method_digest=p_method_digest AND v.package_digest=p_package_digest) THEN
    RAISE EXCEPTION 'ma1 new state refused' USING ERRCODE='P7503';
  END IF;
  IF NOT has_head THEN
    IF p_expected_epoch<>0 OR p_revision<>1 THEN RAISE EXCEPTION 'ma1 new state refused' USING ERRCODE='P7503'; END IF;
    next_epoch:=1; before_snapshot:=NULL;
  ELSE
    IF h.epoch<>p_expected_epoch OR h.revision IS DISTINCT FROM p_expected_revision
      OR h.method_digest IS DISTINCT FROM p_expected_method_digest OR h.package_digest IS DISTINCT FROM p_expected_package_digest
      OR h.status IS DISTINCT FROM p_expected_status OR h.epoch>=2147483646
      OR (p_revision::bigint<>h.revision::bigint AND p_revision::bigint<>h.revision::bigint+1) THEN
      RAISE EXCEPTION 'ma1 new state refused' USING ERRCODE='P7503';
    END IF;
    next_epoch:=h.epoch+1;
    before_snapshot:=pg_catalog.jsonb_build_object('methodId',h.method_id,'revision',h.revision,'methodDigest',h.method_digest,
      'packageDigest',h.package_digest,'epoch',h.epoch,'status',h.status,'approvalMode',h.approval_mode,
      'approvalUntil',pg_catalog.to_char(h.approval_until AT TIME ZONE 'UTC','YYYY-MM-DD"T"HH24:MI:SS.MS"Z"'));
  END IF;
  actor:=auth.uid(); instant:=pg_catalog.clock_timestamp();
  IF p_approval_mode='until' THEN
    until_at:=official_v3_method_private.timestamp_v1(p_approval_until);
    IF until_at<=instant THEN RAISE EXCEPTION 'ma1 new state refused' USING ERRCODE='P7503'; END IF;
  ELSE until_at:=NULL; END IF;
  IF has_head THEN
    UPDATE official_v3_method_private.heads_v1 SET revision=p_revision,method_digest=p_method_digest,package_digest=p_package_digest,
      epoch=next_epoch,status='approved',approval_mode=p_approval_mode,approval_until=until_at,changed_at=instant,changed_by=actor,operation_id=p_operation_id
      WHERE method_id=p_method_id AND epoch=p_expected_epoch;
    IF NOT FOUND THEN RAISE EXCEPTION 'ma1 new state refused' USING ERRCODE='P7503'; END IF;
  ELSE
    INSERT INTO official_v3_method_private.heads_v1 VALUES
      (p_method_id,p_revision,p_method_digest,p_package_digest,next_epoch,'approved',p_approval_mode,until_at,instant,actor,p_operation_id);
  END IF;
  after_snapshot:=pg_catalog.jsonb_build_object('methodId',p_method_id,'revision',p_revision,'methodDigest',p_method_digest,
    'packageDigest',p_package_digest,'epoch',next_epoch,'status','approved','approvalMode',p_approval_mode,'approvalUntil',p_approval_until);
  command:=official_v3_method_private.command_v1(p_operation_id,'approve',p_method_id,p_revision,p_method_digest,p_package_digest,
    NULL,p_expected_revision,p_expected_method_digest,p_expected_package_digest,p_expected_epoch,p_expected_status,p_approval_mode,p_approval_until);
  INSERT INTO official_v3_method_private.operations_v1 VALUES
    (p_operation_id,'approve',p_method_id,p_revision,command,before_snapshot,after_snapshot,actor,instant) RETURNING * INTO op;
  RETURN pg_catalog.jsonb_build_object('status','recorded','operationId',op.operation_id,'action',op.action,
    'command',op.command,'actorId',op.actor_id,'recordedAt',pg_catalog.to_char(op.recorded_at AT TIME ZONE 'UTC','YYYY-MM-DD"T"HH24:MI:SS.US"Z"'),
    'before',op.before_state,'after',op.after_state);
END $$;

CREATE FUNCTION official_v3_method_api.revoke_v1(
  p_operation_id text,p_method_id text,p_revision integer,p_method_digest text,p_package_digest text,p_expected_epoch integer
) RETURNS jsonb LANGUAGE plpgsql VOLATILE PARALLEL UNSAFE SECURITY DEFINER
SET search_path=pg_catalog AS $$
DECLARE prior jsonb; command jsonb; before_snapshot jsonb; after_snapshot jsonb; actor uuid; instant timestamptz;
  h official_v3_method_private.heads_v1%ROWTYPE; op official_v3_method_private.operations_v1%ROWTYPE;
BEGIN
  prior:=official_v3_method_api.confirm_operation_v1(p_operation_id,'revoke',p_method_id,p_revision,p_method_digest,p_package_digest,
    NULL,p_revision,p_method_digest,p_package_digest,p_expected_epoch,'approved',NULL,NULL);
  IF prior->>'status'='recorded' THEN RETURN prior; END IF;
  SELECT v.* INTO h FROM official_v3_method_private.heads_v1 v WHERE v.method_id=p_method_id;
  IF NOT FOUND OR h.epoch<>p_expected_epoch OR h.revision<>p_revision OR h.method_digest<>p_method_digest
    OR h.package_digest<>p_package_digest OR h.status<>'approved' OR h.epoch>=2147483647 THEN
    RAISE EXCEPTION 'ma1 new state refused' USING ERRCODE='P7503';
  END IF;
  actor:=auth.uid(); instant:=pg_catalog.clock_timestamp();
  before_snapshot:=pg_catalog.jsonb_build_object('methodId',h.method_id,'revision',h.revision,'methodDigest',h.method_digest,
    'packageDigest',h.package_digest,'epoch',h.epoch,'status',h.status,'approvalMode',h.approval_mode,
    'approvalUntil',pg_catalog.to_char(h.approval_until AT TIME ZONE 'UTC','YYYY-MM-DD"T"HH24:MI:SS.MS"Z"'));
  UPDATE official_v3_method_private.heads_v1 SET epoch=h.epoch+1,status='revoked',approval_mode=NULL,approval_until=NULL,
    changed_at=instant,changed_by=actor,operation_id=p_operation_id WHERE method_id=p_method_id AND epoch=p_expected_epoch;
  IF NOT FOUND THEN RAISE EXCEPTION 'ma1 new state refused' USING ERRCODE='P7503'; END IF;
  after_snapshot:=pg_catalog.jsonb_build_object('methodId',h.method_id,'revision',h.revision,'methodDigest',h.method_digest,
    'packageDigest',h.package_digest,'epoch',h.epoch+1,'status','revoked','approvalMode',NULL,'approvalUntil',NULL);
  command:=official_v3_method_private.command_v1(p_operation_id,'revoke',p_method_id,p_revision,p_method_digest,p_package_digest,
    NULL,p_revision,p_method_digest,p_package_digest,p_expected_epoch,'approved',NULL,NULL);
  INSERT INTO official_v3_method_private.operations_v1 VALUES
    (p_operation_id,'revoke',p_method_id,p_revision,command,before_snapshot,after_snapshot,actor,instant) RETURNING * INTO op;
  RETURN pg_catalog.jsonb_build_object('status','recorded','operationId',op.operation_id,'action',op.action,
    'command',op.command,'actorId',op.actor_id,'recordedAt',pg_catalog.to_char(op.recorded_at AT TIME ZONE 'UTC','YYYY-MM-DD"T"HH24:MI:SS.US"Z"'),
    'before',op.before_state,'after',op.after_state);
END $$;

CREATE FUNCTION official_v3_method_api.read_current_v1(
  p_method_id text,p_revision integer,p_method_digest text,p_package_digest text,p_checked_at text
) RETURNS TABLE(status text,method_id text,revision integer,method_digest text,package_digest text,
  epoch integer,approval_mode text,approval_until text,observed_at text,remaining_ms integer)
LANGUAGE plpgsql VOLATILE PARALLEL UNSAFE SECURITY DEFINER SET search_path=pg_catalog AS $$
DECLARE h official_v3_method_private.heads_v1%ROWTYPE; r official_v3_method_private.revisions_v1%ROWTYPE;
  caller_at timestamptz; instant timestamptz; has_head boolean;
BEGIN
  IF NOT official_v3_method_private.tuple_valid_v1(p_method_id,p_revision,p_method_digest,p_package_digest) THEN
    RAISE EXCEPTION 'ma1 invalid closed input' USING ERRCODE='P7501';
  END IF;
  caller_at:=official_v3_method_private.timestamp_v1(p_checked_at);
  SELECT v.* INTO h FROM official_v3_method_private.heads_v1 v WHERE v.method_id=p_method_id FOR SHARE;
  has_head:=FOUND; instant:=pg_catalog.clock_timestamp();
  observed_at:=pg_catalog.to_char(instant AT TIME ZONE 'UTC','YYYY-MM-DD"T"HH24:MI:SS.MS"Z"');
  method_id:=p_method_id; remaining_ms:=0; epoch:=0;
  IF NOT has_head THEN
    SELECT v.* INTO r FROM official_v3_method_private.revisions_v1 v WHERE v.method_id=p_method_id AND v.revision=p_revision;
    IF NOT FOUND THEN status:='absent'; RETURN NEXT; RETURN; END IF;
    revision:=r.revision; method_digest:=r.method_digest; package_digest:=r.package_digest;
    IF r.method_digest<>p_method_digest OR r.package_digest<>p_package_digest THEN status:='binding_mismatch'; ELSE status:='draft'; END IF;
    RETURN NEXT; RETURN;
  END IF;
  revision:=h.revision; method_digest:=h.method_digest; package_digest:=h.package_digest;
  epoch:=h.epoch; approval_mode:=h.approval_mode;
  approval_until:=pg_catalog.to_char(h.approval_until AT TIME ZONE 'UTC','YYYY-MM-DD"T"HH24:MI:SS.MS"Z"');
  IF h.revision<>p_revision THEN status:='different_revision';
  ELSIF h.method_digest<>p_method_digest OR h.package_digest<>p_package_digest THEN status:='binding_mismatch';
  ELSIF h.status='revoked' THEN status:='revoked';
  ELSIF h.approval_mode='until' THEN
    remaining_ms:=GREATEST(0,LEAST(5000,pg_catalog.floor(extract(epoch FROM (h.approval_until-GREATEST(instant,caller_at)))*1000)))::integer;
    IF remaining_ms=0 THEN status:='expired'; ELSE status:='approved'; END IF;
  ELSE status:='approved'; remaining_ms:=5000;
  END IF;
  RETURN NEXT;
END $$;

CREATE FUNCTION official_v3_method_private.require_current_locked_v1(
  p_method_id text,p_revision integer,p_method_digest text,p_package_digest text,p_epoch integer
) RETURNS void LANGUAGE plpgsql VOLATILE PARALLEL UNSAFE SECURITY DEFINER SET search_path=pg_catalog AS $$
DECLARE h official_v3_method_private.heads_v1%ROWTYPE; instant timestamptz;
BEGIN
  IF NOT official_v3_method_private.tuple_valid_v1(p_method_id,p_revision,p_method_digest,p_package_digest)
    OR p_epoch IS NULL OR p_epoch NOT BETWEEN 1 AND 2147483646 THEN
    RAISE EXCEPTION 'ma1 invalid closed input' USING ERRCODE='P7501';
  END IF;
  SELECT v.* INTO h FROM official_v3_method_private.heads_v1 v WHERE v.method_id=p_method_id FOR SHARE;
  IF NOT FOUND THEN RAISE EXCEPTION 'ma1 locked current authority unavailable' USING ERRCODE='P7504'; END IF;
  instant:=pg_catalog.clock_timestamp();
  IF h.revision<>p_revision OR h.method_digest<>p_method_digest OR h.package_digest<>p_package_digest
    OR h.epoch<>p_epoch OR h.status<>'approved' OR (h.approval_mode='until' AND h.approval_until<=instant) THEN
    RAISE EXCEPTION 'ma1 locked current authority unavailable' USING ERRCODE='P7504';
  END IF;
  -- Only this method boundary. A later publication must finish other waits/reproofs.
END $$;

DO $hma1_creator_acl_origin$
DECLARE owner_oid oid:='postgres'::pg_catalog.regrole;
BEGIN
  IF EXISTS(SELECT 1 FROM pg_catalog.pg_namespace n CROSS JOIN LATERAL
      pg_catalog.aclexplode(COALESCE(n.nspacl,pg_catalog.acldefault('n',n.nspowner))) a
      WHERE n.nspname IN ('official_v3_method_private','official_v3_method_api')
        AND (n.nspowner<>owner_oid OR a.grantor<>owner_oid))
    OR EXISTS(SELECT 1 FROM pg_catalog.pg_class c JOIN pg_catalog.pg_namespace n ON n.oid=c.relnamespace
      CROSS JOIN LATERAL pg_catalog.aclexplode(COALESCE(c.relacl,pg_catalog.acldefault('r',c.relowner))) a
      WHERE n.nspname='official_v3_method_private' AND c.relkind='r'
        AND (c.relowner<>owner_oid OR a.grantor<>owner_oid))
    OR EXISTS(SELECT 1 FROM pg_catalog.pg_proc p JOIN pg_catalog.pg_namespace n ON n.oid=p.pronamespace
      CROSS JOIN LATERAL pg_catalog.aclexplode(COALESCE(p.proacl,pg_catalog.acldefault('f',p.proowner))) a
      WHERE n.nspname IN ('official_v3_method_private','official_v3_method_api')
        AND (p.proowner<>owner_oid OR a.grantor<>owner_oid)) THEN
    RAISE EXCEPTION 'hma1 creator ACL origin invalid' USING ERRCODE='P7802';
  END IF;
END
$hma1_creator_acl_origin$;

-- Inspect untouched effective creator ACLs before owner transfer or normalization.
DO $ma1_creator_acl$
BEGIN
  IF EXISTS (SELECT 1 FROM pg_catalog.pg_namespace n CROSS JOIN LATERAL
      pg_catalog.aclexplode(COALESCE(n.nspacl,pg_catalog.acldefault('n',n.nspowner))) a
      WHERE n.nspname IN ('official_v3_method_private','official_v3_method_api') AND a.grantee<>n.nspowner)
    OR EXISTS (SELECT 1 FROM pg_catalog.pg_class c JOIN pg_catalog.pg_namespace n ON n.oid=c.relnamespace
      CROSS JOIN LATERAL pg_catalog.aclexplode(COALESCE(c.relacl,pg_catalog.acldefault('r',c.relowner))) a
      WHERE n.nspname='official_v3_method_private' AND c.relkind='r' AND a.grantee<>c.relowner)
    OR EXISTS (SELECT 1 FROM pg_catalog.pg_proc p JOIN pg_catalog.pg_namespace n ON n.oid=p.pronamespace
      CROSS JOIN LATERAL pg_catalog.aclexplode(COALESCE(p.proacl,pg_catalog.acldefault('f',p.proowner))) a
      WHERE n.nspname IN ('official_v3_method_private','official_v3_method_api') AND a.grantee<>p.proowner
        AND NOT (a.grantee=0 AND a.privilege_type='EXECUTE' AND NOT a.is_grantable))
    OR EXISTS (SELECT 1 FROM pg_catalog.pg_attribute a JOIN pg_catalog.pg_class c ON c.oid=a.attrelid
      JOIN pg_catalog.pg_namespace n ON n.oid=c.relnamespace WHERE n.nspname='official_v3_method_private' AND a.attacl IS NOT NULL)
    OR (SELECT count(*) FROM pg_catalog.pg_auth_members m WHERE m.roleid='ot_v3_method_reader'::pg_catalog.regrole OR m.member='ot_v3_method_reader'::pg_catalog.regrole)<>1
    OR NOT EXISTS(SELECT 1 FROM pg_catalog.pg_auth_members m WHERE m.roleid='ot_v3_method_reader'::pg_catalog.regrole
      AND m.member='postgres'::pg_catalog.regrole AND m.grantor=10 AND m.admin_option AND NOT m.inherit_option AND NOT m.set_option)
    OR pg_catalog.pg_has_role('postgres'::pg_catalog.regrole,'ot_v3_method_reader'::pg_catalog.regrole,'SET')
    OR pg_catalog.pg_has_role('postgres'::pg_catalog.regrole,'ot_v3_method_reader'::pg_catalog.regrole,'USAGE') THEN
    RAISE EXCEPTION 'ma1 creator privilege boundary invalid' USING ERRCODE='P7505';
  END IF;
END
$ma1_creator_acl$;

ALTER SCHEMA official_v3_method_private OWNER TO postgres;
ALTER SCHEMA official_v3_method_api OWNER TO postgres;
ALTER TABLE official_v3_method_private.revisions_v1 OWNER TO postgres;
ALTER TABLE official_v3_method_private.heads_v1 OWNER TO postgres;
ALTER TABLE official_v3_method_private.operations_v1 OWNER TO postgres;
ALTER FUNCTION official_v3_method_private.tuple_valid_v1(text,integer,text,text) OWNER TO postgres;
ALTER FUNCTION official_v3_method_private.timestamp_v1(text) OWNER TO postgres;
ALTER FUNCTION official_v3_method_private.command_v1(text,text,text,integer,text,text,integer,integer,text,text,integer,text,text,text) OWNER TO postgres;
ALTER FUNCTION official_v3_method_private.immutable_v1() OWNER TO postgres;
ALTER FUNCTION official_v3_method_private.require_current_locked_v1(text,integer,text,text,integer) OWNER TO postgres;
ALTER FUNCTION official_v3_method_api.stage_draft_v1(text,text,integer,text,text,integer) OWNER TO postgres;
ALTER FUNCTION official_v3_method_api.approve_v1(text,text,integer,text,text,integer,text,text,integer,text,text,text) OWNER TO postgres;
ALTER FUNCTION official_v3_method_api.revoke_v1(text,text,integer,text,text,integer) OWNER TO postgres;
ALTER FUNCTION official_v3_method_api.confirm_operation_v1(text,text,text,integer,text,text,integer,integer,text,text,integer,text,text,text) OWNER TO postgres;
ALTER FUNCTION official_v3_method_api.read_current_v1(text,integer,text,text,text) OWNER TO postgres;
REVOKE ALL ON ALL FUNCTIONS IN SCHEMA official_v3_method_private,official_v3_method_api FROM PUBLIC;
GRANT USAGE ON SCHEMA official_v3_method_api TO authenticated,ot_v3_method_reader;
GRANT EXECUTE ON FUNCTION official_v3_method_api.stage_draft_v1(text,text,integer,text,text,integer),
  official_v3_method_api.approve_v1(text,text,integer,text,text,integer,text,text,integer,text,text,text),
  official_v3_method_api.revoke_v1(text,text,integer,text,text,integer),
  official_v3_method_api.confirm_operation_v1(text,text,text,integer,text,text,integer,integer,text,text,integer,text,text,text) TO authenticated;
GRANT EXECUTE ON FUNCTION official_v3_method_api.read_current_v1(text,integer,text,text,text) TO ot_v3_method_reader;
ALTER TABLE official_v3_method_private.revisions_v1 ENABLE ROW LEVEL SECURITY;
ALTER TABLE official_v3_method_private.revisions_v1 FORCE ROW LEVEL SECURITY;
ALTER TABLE official_v3_method_private.heads_v1 ENABLE ROW LEVEL SECURITY;
ALTER TABLE official_v3_method_private.heads_v1 FORCE ROW LEVEL SECURITY;
ALTER TABLE official_v3_method_private.operations_v1 ENABLE ROW LEVEL SECURITY;
ALTER TABLE official_v3_method_private.operations_v1 FORCE ROW LEVEL SECURITY;
CREATE POLICY revisions_v1_owner ON official_v3_method_private.revisions_v1 TO postgres USING(true) WITH CHECK(true);
CREATE POLICY heads_v1_owner ON official_v3_method_private.heads_v1 TO postgres USING(true) WITH CHECK(true);
CREATE POLICY operations_v1_owner ON official_v3_method_private.operations_v1 TO postgres USING(true) WITH CHECK(true);
COMMENT ON SCHEMA official_v3_method_private IS 'jetnity:hma1:hosted-creator-v1:unused';
COMMENT ON SCHEMA official_v3_method_api IS 'jetnity:hma1:hosted-creator-v1:unused';

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

COMMIT;
