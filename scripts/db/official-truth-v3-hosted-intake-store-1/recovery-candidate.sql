-- HS1 V1 UNAPPLIED UNUSED-ONLY recovery candidate. Never use the local S1 rollback.
-- Root must FIRST independently persist current allowed OIDs, no-consumer
-- assessment and controlled quiescence through COMMIT. GUCs only acknowledge
-- that external proof; SQL cannot prove an absent unknown external consumer.
-- Any original/reservation/completion/history => forward repair, never removal.
BEGIN;
SET TRANSACTION ISOLATION LEVEL READ COMMITTED;
SET LOCAL search_path = pg_catalog;
SET LOCAL statement_timeout = '30000';
SET LOCAL lock_timeout = '5000';
SET LOCAL idle_in_transaction_session_timeout = '30000';
SET LOCAL intervalstyle = 'postgres';
SET LOCAL datestyle = 'ISO, YMD';
DO $hs1_prerequisites$
DECLARE installer oid;
BEGIN
  IF session_user <> 'postgres' OR current_user <> session_user OR current_database() <> 'postgres'
    OR pg_catalog.current_setting('server_version_num')::integer / 10000 <> 17
    OR pg_catalog.current_setting('server_encoding') <> 'UTF8'
    OR pg_catalog.current_setting('createrole_self_grant') <> '' THEN
    RAISE EXCEPTION 'hs1 installer prerequisite mismatch' USING ERRCODE='P7310';
  END IF;
  SELECT r.oid INTO installer FROM pg_catalog.pg_roles r
    WHERE r.rolname = session_user AND r.rolcanlogin AND NOT r.rolsuper AND r.rolcreaterole;
  IF installer IS NULL
    OR NOT EXISTS (SELECT 1 FROM pg_catalog.pg_database d
      WHERE d.datname=current_database() AND d.datdba=installer AND d.encoding=6)
    OR NOT pg_catalog.has_database_privilege(installer,current_database(),'CREATE')
    OR NOT EXISTS (SELECT 1 FROM pg_catalog.pg_roles r WHERE r.oid=10 AND r.rolsuper)
    OR EXISTS (SELECT 1 FROM pg_catalog.pg_default_acl d
      WHERE d.defaclrole=installer AND d.defaclnamespace=0
        AND (d.defaclobjtype NOT IN ('r','S','f','T','n')
          OR d.defaclacl IS DISTINCT FROM pg_catalog.acldefault(d.defaclobjtype,installer))) THEN
    RAISE EXCEPTION 'hs1 creator/default prerequisite mismatch' USING ERRCODE='P7310';
  END IF;
  IF NOT pg_catalog.pg_try_advisory_xact_lock(771103,1) THEN
    RAISE EXCEPTION 'hs1 concurrent installation or recovery' USING ERRCODE='P7310';
  END IF;
END $hs1_prerequisites$;

DO $hs1_recovery_context$
DECLARE supplied text; expected_identity jsonb; actual_identity jsonb;
BEGIN
  IF pg_catalog.current_setting('jetnity.hs1_recovery_context',true)
    IS DISTINCT FROM 'root_independent_identity_no_consumers_controlled_quiescence_v1' THEN
    RAISE EXCEPTION 'hs1 independent recovery context missing' USING ERRCODE='P7313';
  END IF;
  supplied:=pg_catalog.current_setting('jetnity.hs1_recovery_identity',true);
  IF supplied IS NULL OR pg_catalog.octet_length(supplied) NOT BETWEEN 1 AND 32768 THEN
    RAISE EXCEPTION 'hs1 independent recovery identity missing' USING ERRCODE='P7313';
  END IF;
  BEGIN expected_identity:=supplied::jsonb;
  EXCEPTION WHEN invalid_text_representation THEN
    RAISE EXCEPTION 'hs1 independent recovery identity invalid' USING ERRCODE='P7313';
  END;
  SELECT q.hs1_identity INTO actual_identity FROM (
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
SELECT pg_catalog.jsonb_build_object(
  'package','HS1-v1',
  'database',pg_catalog.jsonb_build_object('name',d.datname,'oid',d.oid),
  'roles',(SELECT pg_catalog.jsonb_agg(pg_catalog.jsonb_build_object('name',r.rolname,'oid',r.oid) ORDER BY r.rolname)
    FROM pg_catalog.pg_roles r WHERE r.rolname IN ('ot_v3_intake_owner','ot_v3_intake_caller')),
  'objects',(SELECT pg_catalog.jsonb_agg(pg_catalog.jsonb_build_object('catalog',o.classid::pg_catalog.regclass::text,
      'identity',pg_catalog.pg_describe_object(o.classid,o.objid,0),'oid',o.objid) ORDER BY o.classid,o.objid)
    FROM scope_objects o)
) AS hs1_identity
FROM pg_catalog.pg_database d WHERE d.datname=current_database()
  ) q;
  IF expected_identity IS DISTINCT FROM actual_identity
    OR (SELECT count(*) FROM pg_catalog.pg_namespace n
      WHERE n.nspname IN ('official_v3_intake_private','official_v3_intake_api'))<>2
    OR (SELECT count(*) FROM pg_catalog.pg_roles r
      WHERE r.rolname IN ('ot_v3_intake_owner','ot_v3_intake_caller'))<>2 THEN
    RAISE EXCEPTION 'hs1 current target or object OID mismatch' USING ERRCODE='P7313';
  END IF;
  IF EXISTS (SELECT 1 FROM pg_catalog.pg_namespace n WHERE pg_catalog.left(n.nspname,12)='official_v3_'
      AND n.nspname NOT IN ('official_v3_intake_private','official_v3_intake_api','official_v3_method_private','official_v3_method_api'))
    OR EXISTS (SELECT 1 FROM pg_catalog.pg_roles r WHERE pg_catalog.left(r.rolname,6)='ot_v3_'
      AND r.rolname NOT IN ('ot_v3_intake_owner','ot_v3_intake_caller','ot_v3_method_reader')) THEN
    RAISE EXCEPTION 'hs1 known or unfamiliar V3 consumer exists' USING ERRCODE='P7313';
  END IF;
END $hs1_recovery_context$;
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

-- All fourteen originals: exact identity, declaration properties and full body.
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
-- Inbound consumers and off-package role dependencies are refused before any
-- teardown. DROP ... RESTRICT is an additional transactional guard, not CASCADE.
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

GRANT ot_v3_intake_owner TO postgres WITH ADMIN FALSE, INHERIT FALSE, SET TRUE GRANTED BY postgres;
DO $hs1_temporary_membership$
DECLARE installer oid := session_user::pg_catalog.regrole;
  owner_id oid := 'ot_v3_intake_owner'::pg_catalog.regrole;
  caller_id oid := 'ot_v3_intake_caller'::pg_catalog.regrole;
BEGIN
  IF current_user<>session_user
    OR (SELECT count(*) FROM pg_catalog.pg_auth_members m
      WHERE m.roleid IN (owner_id,caller_id) OR m.member IN (owner_id,caller_id) OR m.grantor IN (owner_id,caller_id))<>3
    OR (SELECT count(*) FROM pg_catalog.pg_auth_members m
      WHERE m.roleid IN (owner_id,caller_id) AND m.member=installer AND m.grantor=10
        AND m.admin_option AND NOT m.inherit_option AND NOT m.set_option)<>2
    OR (SELECT count(*) FROM pg_catalog.pg_auth_members m
      WHERE m.roleid=owner_id AND m.member=installer AND m.grantor=installer
        AND NOT m.admin_option AND NOT m.inherit_option AND m.set_option)<>1
    OR NOT pg_catalog.pg_has_role(installer,owner_id,'SET')
    OR pg_catalog.pg_has_role(installer,owner_id,'USAGE')
    OR pg_catalog.pg_has_role(installer,caller_id,'SET')
    OR pg_catalog.pg_has_role(installer,caller_id,'USAGE') THEN
    RAISE EXCEPTION 'hs1 exact temporary SET-only grant required' USING ERRCODE='P7311';
  END IF;
END $hs1_temporary_membership$;

SET LOCAL ROLE ot_v3_intake_owner;
-- All three locks survive the emptiness read and exact teardown through COMMIT.
-- Fixed order and lock_timeout bound contention; no writer can enter after
-- this read while the transaction retains its ACCESS EXCLUSIVE locks.
LOCK TABLE official_v3_intake_private.operations_v1,
  official_v3_intake_private.reservations_v1,
  official_v3_intake_private.completions_v1 IN ACCESS EXCLUSIVE MODE;
DO $hs1_no_history$
BEGIN
  IF EXISTS (SELECT 1 FROM official_v3_intake_private.operations_v1)
    OR EXISTS (SELECT 1 FROM official_v3_intake_private.reservations_v1)
    OR EXISTS (SELECT 1 FROM official_v3_intake_private.completions_v1) THEN
    RAISE EXCEPTION 'hs1 history exists; unused-only removal refused' USING ERRCODE='P7314';
  END IF;
END $hs1_no_history$;
-- HS1_RECOVERY_BEFORE_FIRST_DROP
DROP FUNCTION official_v3_intake_api.finish_v1(jsonb,text,integer,integer,uuid,jsonb,jsonb) RESTRICT;
DROP FUNCTION official_v3_intake_api.reserve_v1(jsonb,text,integer,integer) RESTRICT;
DROP FUNCTION official_v3_intake_api.read_v1(jsonb,text,integer) RESTRICT;
DROP FUNCTION official_v3_intake_api.capture_v1(jsonb,text,text) RESTRICT;
DROP TRIGGER immutable_v1 ON official_v3_intake_private.completions_v1 RESTRICT;
DROP TRIGGER immutable_v1 ON official_v3_intake_private.reservations_v1 RESTRICT;
DROP TRIGGER immutable_v1 ON official_v3_intake_private.operations_v1 RESTRICT;
DROP FUNCTION official_v3_intake_private.record_v1(text) RESTRICT;
DROP FUNCTION official_v3_intake_private.immutable_v1() RESTRICT;
DROP FUNCTION official_v3_intake_private.proposal_retainable_v1(jsonb) RESTRICT;
DROP FUNCTION official_v3_intake_private.shape_matches_v1(jsonb,jsonb,jsonb,jsonb,integer) RESTRICT;
DROP FUNCTION official_v3_intake_private.data_nodes_v1(jsonb,integer,integer,integer) RESTRICT;
DROP FUNCTION official_v3_intake_private.proposal_shape_v1() RESTRICT;
DROP FUNCTION official_v3_intake_private.unique_json_v1(json,integer) RESTRICT;
DROP FUNCTION official_v3_intake_private.binding_valid_v1(jsonb) RESTRICT;
DROP FUNCTION official_v3_intake_private.safe_data_v1(jsonb,integer) RESTRICT;
DROP FUNCTION official_v3_intake_private.exact_keys_v1(jsonb,text[]) RESTRICT;
DROP TABLE official_v3_intake_private.completions_v1 RESTRICT;
DROP TABLE official_v3_intake_private.reservations_v1 RESTRICT;
DROP TABLE official_v3_intake_private.operations_v1 RESTRICT;
DROP SCHEMA official_v3_intake_api RESTRICT;
DROP SCHEMA official_v3_intake_private RESTRICT;
RESET ROLE;
REVOKE ot_v3_intake_owner FROM postgres GRANTED BY postgres RESTRICT;

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

DROP ROLE ot_v3_intake_caller;
DROP ROLE ot_v3_intake_owner;
DO $hs1_removed$
BEGIN
  IF EXISTS (SELECT 1 FROM pg_catalog.pg_roles r WHERE r.rolname IN ('ot_v3_intake_owner','ot_v3_intake_caller'))
    OR EXISTS (SELECT 1 FROM pg_catalog.pg_namespace n WHERE n.nspname IN ('official_v3_intake_private','official_v3_intake_api')) THEN
    RAISE EXCEPTION 'hs1 exact removal incomplete' USING ERRCODE='P7313';
  END IF;
END $hs1_removed$;
COMMIT;
