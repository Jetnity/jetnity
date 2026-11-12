-- HM04 V1 + A1 UNAPPLIED, unused-only recovery. Source review is not permission to run.
-- Root must independently bind original package/OIDs and controlled quiescence through COMMIT.
-- The GUCs acknowledge that external evidence; they do not prove absent external users.
BEGIN;
SET TRANSACTION ISOLATION LEVEL READ COMMITTED;
SET LOCAL search_path=pg_catalog,pg_temp;
SET LOCAL statement_timeout='30000';
SET LOCAL lock_timeout='5000';
SET LOCAL idle_in_transaction_session_timeout='30000';
SET LOCAL intervalstyle='postgres';
SET LOCAL datestyle='ISO, YMD';
DO $hm04_recovery_creator$
DECLARE creator oid;
BEGIN
  SELECT r.oid INTO creator FROM pg_catalog.pg_roles r WHERE r.rolname='postgres'
    AND r.rolcanlogin AND NOT r.rolsuper AND r.rolcreaterole AND r.rolbypassrls;
  IF creator IS NULL OR session_user<>'postgres' OR current_user<>session_user OR current_database()<>'postgres'
    OR pg_catalog.current_setting('server_version_num')::integer/10000<>17
    OR pg_catalog.current_setting('server_encoding')<>'UTF8'
    OR pg_catalog.current_setting('createrole_self_grant')<>''
    OR NOT pg_catalog.has_database_privilege(creator,current_database(),'CREATE')
    OR NOT EXISTS(SELECT 1 FROM pg_catalog.pg_database d WHERE d.datname=current_database() AND d.datdba=creator AND d.encoding=6) THEN
    RAISE EXCEPTION 'hm04 same real restricted Creator required' USING ERRCODE='P7601';
  END IF;
  IF NOT pg_catalog.pg_try_advisory_xact_lock(771101,1)
    OR NOT pg_catalog.pg_try_advisory_xact_lock(771102,1)
    OR NOT pg_catalog.pg_try_advisory_xact_lock(771103,1)
    OR NOT pg_catalog.pg_try_advisory_xact_lock(771104,1) THEN
    RAISE EXCEPTION 'hm04 concurrent package installation/recovery' USING ERRCODE='P7607';
  END IF;
END $hm04_recovery_creator$;
DO $hm04_recovery_context$
DECLARE supplied text; expected_identity jsonb; actual_identity jsonb;
BEGIN
  IF pg_catalog.current_setting('jetnity.hm04_recovery_context',true)
    IS DISTINCT FROM 'root_independent_identity_no_consumers_controlled_quiescence_v1' THEN
    RAISE EXCEPTION 'hm04 external quiescence/package context missing' USING ERRCODE='P7607';
  END IF;
  supplied:=pg_catalog.current_setting('jetnity.hm04_recovery_identity',true);
  IF supplied IS NULL OR pg_catalog.octet_length(supplied) NOT BETWEEN 1 AND 65536 THEN
    RAISE EXCEPTION 'hm04 external original object identity missing' USING ERRCODE='P7607';
  END IF;
  BEGIN expected_identity:=supplied::jsonb;
  EXCEPTION WHEN invalid_text_representation THEN
    RAISE EXCEPTION 'hm04 external original identity invalid' USING ERRCODE='P7607';
  END;
  SELECT q.hm04_identity INTO actual_identity FROM (
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
SELECT pg_catalog.jsonb_build_object(
  'package','HM04-v1-A1',
  'original_jobs_sha256','0d2210d84c02aacbeef1c8e14b38e7be6c2e3e8c387057fd97666fb00c71bba4',
  'database',pg_catalog.jsonb_build_object('name',d.datname,'oid',d.oid),
  'creator','postgres'::pg_catalog.regrole::oid,
  'roles',(SELECT pg_catalog.jsonb_agg(pg_catalog.jsonb_build_object('name',r.rolname,'oid',r.oid) ORDER BY r.rolname)
    FROM pg_catalog.pg_roles r WHERE r.rolname IN ('ot_v3_jobs_owner','ot_v3_jobs_caller','ot_v3_intake_owner')),
  'objects',(SELECT pg_catalog.jsonb_agg(pg_catalog.jsonb_build_object('catalog',o.classid::pg_catalog.regclass::text,
    'identity',pg_catalog.pg_describe_object(o.classid,o.objid,0),'oid',o.objid) ORDER BY o.classid,o.objid) FROM scope_objects o)
) AS hm04_identity FROM pg_catalog.pg_database d WHERE d.datname=current_database()
  ) q;
  IF expected_identity IS DISTINCT FROM actual_identity THEN
    RAISE EXCEPTION 'hm04 original package/Creator/object OID mismatch' USING ERRCODE='P7607';
  END IF;
END $hm04_recovery_context$;

DO $hm04_recovery_final_roles$
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

END $hm04_recovery_final_roles$;

GRANT ot_v3_jobs_owner TO postgres WITH ADMIN FALSE, INHERIT FALSE, SET TRUE GRANTED BY postgres;
SET LOCAL ROLE ot_v3_jobs_owner;
-- Separate exact transition: the normal runtime guard never accepts this SET edge.
DO $hm04_recovery_transition$
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

  SELECT (fingerprint->>'installer')::oid INTO creator
    FROM official_v3_jobs_private.catalog_binding_v1 WHERE object_identity='creator-defaults';
  IF creator IS DISTINCT FROM 'postgres'::pg_catalog.regrole::oid
    OR (SELECT count(*) FROM official_v3_jobs_private.catalog_binding_v1)<>15
    OR EXISTS(SELECT 1 FROM official_v3_jobs_private.catalog_binding_v1
      WHERE object_identity<>ALL(ARRAY['jobs-functions','jobs-relations','jobs-types','jobs-schemas','jobs-dependencies','prerequisite-functions','prerequisite-relations','prerequisite-types','prerequisite-schemas','prerequisite-dependencies','protected-roles','creator-edges','creator-defaults','database','package-context' ]::text[]))
    OR (SELECT fingerprint FROM official_v3_jobs_private.catalog_binding_v1 WHERE object_identity='package-context')
      IS DISTINCT FROM ('{"package":"HM04-v1-A1","original_jobs_sha256":"0d2210d84c02aacbeef1c8e14b38e7be6c2e3e8c387057fd97666fb00c71bba4","original_r41_native_sha256":"a61b94e98691ecf6212f2e9cadfada3d470927c319f0ef9a6ed008f63ec658ea","pg1_sha256":"3e21495ff40f66337b004fadc98599cd336c19c31bb4f6e4f9013c2c01f02bd2","hma1_sha256":"edbaf9d56b3da115b12bf1c8cfd5c76d8bc9483f7fc1658ee648b380a16fe2c0","hs1_sha256":"f56bd702c8e9228251382d5986eadb88895925ca0224b96f0c8f56b70a9b5620"}'::jsonb || pg_catalog.jsonb_build_object('creator','postgres'::pg_catalog.regrole::oid,'database',(SELECT d.oid FROM pg_catalog.pg_database d WHERE d.datname=current_database()))) THEN
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

END $hm04_recovery_transition$;

LOCK TABLE official_v3_jobs_private.slots_v1,official_v3_jobs_private.subjects_v1,
 official_v3_jobs_private.queue_operations_v1,official_v3_jobs_private.execution_starts_v1,
 official_v3_jobs_private.execution_results_v1,official_v3_jobs_private.execution_dispositions_v1,
 official_v3_jobs_private.catalog_binding_v1 IN ACCESS EXCLUSIVE MODE;
-- A new READ COMMITTED command snapshot after all lock waits sees a writer that committed.
DO $hm04_unused_after_locks$
BEGIN
  IF EXISTS(SELECT 1 FROM official_v3_jobs_private.subjects_v1)
    OR EXISTS(SELECT 1 FROM official_v3_jobs_private.queue_operations_v1)
    OR EXISTS(SELECT 1 FROM official_v3_jobs_private.execution_starts_v1)
    OR EXISTS(SELECT 1 FROM official_v3_jobs_private.execution_results_v1)
    OR EXISTS(SELECT 1 FROM official_v3_jobs_private.execution_dispositions_v1)
    OR EXISTS(SELECT 1 FROM official_v3_jobs_private.slots_v1 WHERE job_key IS NOT NULL)
    OR (SELECT count(*) FROM official_v3_jobs_private.slots_v1)<>1024 THEN
    RAISE EXCEPTION 'hm04 nonempty history recovery refused' USING ERRCODE='P7606';
  END IF;
END $hm04_unused_after_locks$;
DO $hm04_recovery_no_bound_caller$
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

  SELECT (fingerprint->>'installer')::oid INTO creator
    FROM official_v3_jobs_private.catalog_binding_v1 WHERE object_identity='creator-defaults';
  IF creator IS DISTINCT FROM 'postgres'::pg_catalog.regrole::oid
    OR (SELECT count(*) FROM official_v3_jobs_private.catalog_binding_v1)<>15
    OR EXISTS(SELECT 1 FROM official_v3_jobs_private.catalog_binding_v1
      WHERE object_identity<>ALL(ARRAY['jobs-functions','jobs-relations','jobs-types','jobs-schemas','jobs-dependencies','prerequisite-functions','prerequisite-relations','prerequisite-types','prerequisite-schemas','prerequisite-dependencies','protected-roles','creator-edges','creator-defaults','database','package-context' ]::text[]))
    OR (SELECT fingerprint FROM official_v3_jobs_private.catalog_binding_v1 WHERE object_identity='package-context')
      IS DISTINCT FROM ('{"package":"HM04-v1-A1","original_jobs_sha256":"0d2210d84c02aacbeef1c8e14b38e7be6c2e3e8c387057fd97666fb00c71bba4","original_r41_native_sha256":"a61b94e98691ecf6212f2e9cadfada3d470927c319f0ef9a6ed008f63ec658ea","pg1_sha256":"3e21495ff40f66337b004fadc98599cd336c19c31bb4f6e4f9013c2c01f02bd2","hma1_sha256":"edbaf9d56b3da115b12bf1c8cfd5c76d8bc9483f7fc1658ee648b380a16fe2c0","hs1_sha256":"f56bd702c8e9228251382d5986eadb88895925ca0224b96f0c8f56b70a9b5620"}'::jsonb || pg_catalog.jsonb_build_object('creator','postgres'::pg_catalog.regrole::oid,'database',(SELECT d.oid FROM pg_catalog.pg_database d WHERE d.datname=current_database()))) THEN
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

END $hm04_recovery_no_bound_caller$;

-- Minimal schema USAGE for the two final bridge owners. No old namespace grants.
GRANT USAGE ON SCHEMA official_v3_jobs_private TO postgres,ot_v3_intake_owner;
RESET ROLE;
GRANT ot_v3_intake_owner TO postgres WITH ADMIN FALSE, INHERIT FALSE, SET TRUE GRANTED BY postgres;
DO $hm04_recovery_bridge_transition$
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

  IF EXISTS(SELECT 1 FROM pg_catalog.pg_namespace n
    CROSS JOIN LATERAL pg_catalog.aclexplode(COALESCE(n.nspacl,pg_catalog.acldefault('n',n.nspowner))) a
    WHERE n.nspname='official_v3_jobs_private' AND (n.nspowner<>owner_id OR a.grantor<>owner_id OR a.is_grantable
      OR NOT(a.grantee=owner_id OR a.grantee IN (creator,intake_id) AND a.privilege_type='USAGE')))
    OR NOT pg_catalog.has_schema_privilege(creator,'official_v3_jobs_private','USAGE')
    OR NOT pg_catalog.has_schema_privilege(intake_id,'official_v3_jobs_private','USAGE')
    OR pg_catalog.has_schema_privilege(creator,'official_v3_jobs_private','CREATE')
    OR pg_catalog.has_schema_privilege(intake_id,'official_v3_jobs_private','CREATE') THEN
    RAISE EXCEPTION 'hm04 exact recovery namespace transition' USING ERRCODE='P7603';
  END IF;
END $hm04_recovery_bridge_transition$;

DROP FUNCTION official_v3_jobs_private.ma1_tuple_valid_v1(text,integer,text,text) RESTRICT;
DROP FUNCTION official_v3_jobs_private.ma1_require_v1(text,integer,text,text,integer) RESTRICT;
SET LOCAL ROLE ot_v3_intake_owner;
DROP FUNCTION official_v3_jobs_private.s1_shape_v1(jsonb,text) RESTRICT;
DROP FUNCTION official_v3_jobs_private.s1_read_v1(jsonb,text,integer) RESTRICT;
RESET ROLE;
SET LOCAL ROLE ot_v3_jobs_owner;
REVOKE USAGE ON SCHEMA official_v3_jobs_private FROM postgres,ot_v3_intake_owner RESTRICT;
DROP FUNCTION official_v3_jobs_api.execute_v1(text,text,integer,text,text,integer,integer,text) RESTRICT;
DROP FUNCTION official_v3_jobs_private.tx_queue_cas_v1(jsonb,jsonb,integer,integer,timestamptz) RESTRICT;
DROP FUNCTION official_v3_jobs_private.tx_execution_prepare_v1(jsonb,jsonb,integer,integer,timestamptz) RESTRICT;
DROP FUNCTION official_v3_jobs_private.tx_execution_start_v1(jsonb,jsonb,integer,integer,timestamptz) RESTRICT;
DROP FUNCTION official_v3_jobs_private.tx_execution_read_v1(jsonb,jsonb,integer,integer,timestamptz) RESTRICT;
DROP FUNCTION official_v3_jobs_private.tx_queue_confirm_v1(jsonb,jsonb,integer,integer,timestamptz) RESTRICT;
DROP FUNCTION official_v3_jobs_private.tx_queue_read_v1(jsonb,jsonb,integer,integer,timestamptz) RESTRICT;
DROP FUNCTION official_v3_jobs_private.assert_catalog_v1() RESTRICT;
DROP FUNCTION official_v3_jobs_private.assert_history_v1(text) RESTRICT;
DROP FUNCTION official_v3_jobs_private.consume_s1_v1(jsonb,jsonb,jsonb,text) RESTRICT;
DROP FUNCTION official_v3_jobs_private.transition_v1(jsonb,jsonb,jsonb) RESTRICT;
DROP TRIGGER guard_row_v1 ON official_v3_jobs_private.slots_v1 RESTRICT;
DROP TRIGGER guard_truncate_v1 ON official_v3_jobs_private.slots_v1 RESTRICT;
DROP TRIGGER guard_row_v1 ON official_v3_jobs_private.subjects_v1 RESTRICT;
DROP TRIGGER guard_truncate_v1 ON official_v3_jobs_private.subjects_v1 RESTRICT;
DROP TRIGGER guard_row_v1 ON official_v3_jobs_private.queue_operations_v1 RESTRICT;
DROP TRIGGER guard_truncate_v1 ON official_v3_jobs_private.queue_operations_v1 RESTRICT;
DROP TRIGGER guard_row_v1 ON official_v3_jobs_private.execution_starts_v1 RESTRICT;
DROP TRIGGER guard_truncate_v1 ON official_v3_jobs_private.execution_starts_v1 RESTRICT;
DROP TRIGGER guard_row_v1 ON official_v3_jobs_private.execution_results_v1 RESTRICT;
DROP TRIGGER guard_truncate_v1 ON official_v3_jobs_private.execution_results_v1 RESTRICT;
DROP TRIGGER guard_row_v1 ON official_v3_jobs_private.execution_dispositions_v1 RESTRICT;
DROP TRIGGER guard_truncate_v1 ON official_v3_jobs_private.execution_dispositions_v1 RESTRICT;
DROP TRIGGER guard_row_v1 ON official_v3_jobs_private.catalog_binding_v1 RESTRICT;
DROP TRIGGER guard_truncate_v1 ON official_v3_jobs_private.catalog_binding_v1 RESTRICT;
DROP POLICY owner_v1 ON official_v3_jobs_private.slots_v1 RESTRICT;
DROP POLICY owner_v1 ON official_v3_jobs_private.subjects_v1 RESTRICT;
DROP POLICY owner_v1 ON official_v3_jobs_private.queue_operations_v1 RESTRICT;
DROP POLICY owner_v1 ON official_v3_jobs_private.execution_starts_v1 RESTRICT;
DROP POLICY owner_v1 ON official_v3_jobs_private.execution_results_v1 RESTRICT;
DROP POLICY owner_v1 ON official_v3_jobs_private.execution_dispositions_v1 RESTRICT;
DROP POLICY owner_v1 ON official_v3_jobs_private.catalog_binding_v1 RESTRICT;
DROP TABLE official_v3_jobs_private.catalog_binding_v1 RESTRICT;
DROP TABLE official_v3_jobs_private.execution_dispositions_v1 RESTRICT;
DROP TABLE official_v3_jobs_private.execution_results_v1 RESTRICT;
DROP TABLE official_v3_jobs_private.execution_starts_v1 RESTRICT;
DROP TABLE official_v3_jobs_private.queue_operations_v1 RESTRICT;
DROP TABLE official_v3_jobs_private.subjects_v1 RESTRICT;
DROP TABLE official_v3_jobs_private.slots_v1 RESTRICT;
DROP FUNCTION official_v3_jobs_private.immutable_v1() RESTRICT;
DROP FUNCTION official_v3_jobs_private.reference_v1(jsonb) RESTRICT;
DROP FUNCTION official_v3_jobs_private.command_v1(jsonb) RESTRICT;
DROP FUNCTION official_v3_jobs_private.job_v1(jsonb) RESTRICT;
DROP FUNCTION official_v3_jobs_private.subject_v1(text,jsonb) RESTRICT;
DROP FUNCTION official_v3_jobs_private.context_v1(jsonb) RESTRICT;
DROP FUNCTION official_v3_jobs_private.expression_v1(jsonb,boolean,integer) RESTRICT;
DROP FUNCTION official_v3_jobs_private.predicate_v1(jsonb) RESTRICT;
DROP FUNCTION official_v3_jobs_private.timestamp_v1(text) RESTRICT;
DROP FUNCTION official_v3_jobs_private.civil_date_v1(text) RESTRICT;
DROP FUNCTION official_v3_jobs_private.wire_v1(text) RESTRICT;
DROP FUNCTION official_v3_jobs_private.canonical_v1(jsonb,integer) RESTRICT;
DROP FUNCTION official_v3_jobs_private.nodes_v1(jsonb,integer,integer,integer) RESTRICT;
DROP FUNCTION official_v3_jobs_private.unique_json_v1(json,integer) RESTRICT;
DROP FUNCTION official_v3_jobs_private.exact_keys_v1(jsonb,text[]) RESTRICT;
DROP SCHEMA official_v3_jobs_api RESTRICT;
DROP SCHEMA official_v3_jobs_private RESTRICT;
RESET ROLE;
REVOKE ot_v3_intake_owner FROM postgres GRANTED BY postgres RESTRICT;
REVOKE ot_v3_jobs_owner FROM postgres GRANTED BY postgres RESTRICT;
-- Regular role deletion removes only the new roles' automatic memberships.
-- No manual change to bootstrap-grantor edges and no DROP OWNED / CASCADE.
DROP ROLE ot_v3_jobs_caller;
DROP ROLE ot_v3_jobs_owner;
DO $hm04_recovery_preserved_hs1_owner$
DECLARE creator oid:=session_user::pg_catalog.regrole; intake_id oid:='ot_v3_intake_owner'::pg_catalog.regrole;
BEGIN
  IF (SELECT count(*) FROM pg_catalog.pg_auth_members m WHERE m.roleid=intake_id OR m.member=intake_id OR m.grantor=intake_id)<>1
    OR NOT EXISTS(SELECT 1 FROM pg_catalog.pg_auth_members m WHERE m.roleid=intake_id AND m.member=creator AND m.grantor=10
      AND m.admin_option AND NOT m.inherit_option AND NOT m.set_option)
    OR pg_catalog.pg_has_role(creator,intake_id,'SET') OR pg_catalog.pg_has_role(creator,intake_id,'USAGE')
    OR pg_catalog.to_regnamespace('official_v3_jobs_private') IS NOT NULL OR pg_catalog.to_regnamespace('official_v3_jobs_api') IS NOT NULL
    OR EXISTS(SELECT 1 FROM pg_catalog.pg_roles r WHERE r.rolname IN ('ot_v3_jobs_owner','ot_v3_jobs_caller')) THEN
    RAISE EXCEPTION 'hm04 final removal boundary' USING ERRCODE='P7607';
  END IF;
END $hm04_recovery_preserved_hs1_owner$;
COMMIT;
