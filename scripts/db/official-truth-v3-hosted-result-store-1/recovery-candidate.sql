-- HRS1 V1 / A1 / A2 UNAPPLIED, unused-only recovery.
-- Root binds the original full identity and controlled quiescence through COMMIT.
-- The context GUC acknowledges external evidence; it is not an absence-of-users proof.
BEGIN;
SET TRANSACTION ISOLATION LEVEL READ COMMITTED;
SET LOCAL search_path=pg_catalog;
SET LOCAL statement_timeout='30000';
SET LOCAL lock_timeout='5000';
SET LOCAL idle_in_transaction_session_timeout='30000';
SET LOCAL intervalstyle='postgres';
SET LOCAL datestyle='ISO, YMD';
DO $hrs1_recovery_creator$
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
   AND (d.defaclobjtype NOT IN ('r','S','f','T','n') OR d.defaclacl IS DISTINCT FROM pg_catalog.acldefault(d.defaclobjtype,creator))) THEN
  RAISE EXCEPTION 'hrs1 same real restricted Creator required' USING ERRCODE='P7801';
 END IF;
 IF NOT pg_catalog.pg_try_advisory_xact_lock(771101,1)
  OR NOT pg_catalog.pg_try_advisory_xact_lock(771102,1)
  OR NOT pg_catalog.pg_try_advisory_xact_lock(771103,1)
  OR NOT pg_catalog.pg_try_advisory_xact_lock(771104,1)
  OR NOT pg_catalog.pg_try_advisory_xact_lock(771105,1) THEN
  RAISE EXCEPTION 'hrs1 concurrent package installation or recovery' USING ERRCODE='P7809';
 END IF;
END $hrs1_recovery_creator$;
DO $hrs1_recovery_context$
DECLARE supplied text; expected_identity jsonb;
BEGIN
 IF pg_catalog.current_setting('jetnity.hrs1_recovery_context',true)
  IS DISTINCT FROM 'root_independent_identity_no_consumers_controlled_quiescence_v1' THEN
  RAISE EXCEPTION 'hrs1 external identity and quiescence context required' USING ERRCODE='P7802';
 END IF;
 supplied:=pg_catalog.current_setting('jetnity.hrs1_recovery_identity',true);
 IF supplied IS NULL OR pg_catalog.octet_length(supplied) NOT BETWEEN 1 AND 2097152 THEN
  RAISE EXCEPTION 'hrs1 full external original identity required' USING ERRCODE='P7802';
 END IF;
 BEGIN expected_identity:=supplied::jsonb;
 EXCEPTION WHEN invalid_text_representation THEN
  RAISE EXCEPTION 'hrs1 invalid external original identity' USING ERRCODE='P7802';
 END;
 IF pg_catalog.jsonb_typeof(expected_identity) IS DISTINCT FROM 'object'
  OR NOT expected_identity ?& ARRAY['package','bindingHash','catalog']
  OR expected_identity-ARRAY['package','bindingHash','catalog'] IS DISTINCT FROM '{}'::jsonb
  OR expected_identity->'package' IS DISTINCT FROM '"HRS1-v1"'::jsonb
  OR pg_catalog.jsonb_typeof(expected_identity->'bindingHash') IS DISTINCT FROM 'string'
  OR (expected_identity->>'bindingHash' ~ '^[a-f0-9]{64}$') IS NOT TRUE
  OR pg_catalog.jsonb_typeof(expected_identity->'catalog') IS DISTINCT FROM 'object'
  OR (SELECT count(*) FROM pg_catalog.pg_roles r WHERE r.rolname IN
    ('ot_v3_result_owner','ot_v3_result_writer','ot_v3_result_reader','ot_v3_result_verifier'))<>4
  OR (SELECT count(*) FROM pg_catalog.pg_namespace n WHERE n.nspname IN
    ('official_v3_result_private','official_v3_result_api'))<>2
  OR NOT EXISTS(SELECT 1 FROM pg_catalog.pg_roles r WHERE r.rolname='ot_v3_intake_owner') THEN
  RAISE EXCEPTION 'hrs1 original package or complete object identity missing' USING ERRCODE='P7802';
 END IF;
END $hrs1_recovery_context$;

-- Pure catalog SQL, byte-identical to the installed catalog_v1 body; no private call.
DO $hrs1_recovery_metadata$
DECLARE actual_catalog jsonb; expected_identity jsonb:=pg_catalog.current_setting('jetnity.hrs1_recovery_identity')::jsonb;
BEGIN
 SELECT (
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
)
) INTO actual_catalog;
 IF actual_catalog IS DISTINCT FROM expected_identity->'catalog' THEN
  RAISE EXCEPTION 'hrs1 original full catalog identity differs' USING ERRCODE='P7802';
 END IF;
END $hrs1_recovery_metadata$;

DO $hrs1_recovery_role_boundary$
DECLARE role_row record; creator oid:='postgres'::regrole; owner_id oid:='ot_v3_result_owner'::regrole;
 temporary_edge boolean:=false;
BEGIN
 IF session_user<>'postgres'
  OR current_user<>CASE WHEN temporary_edge THEN 'ot_v3_result_owner' ELSE 'postgres' END THEN
  RAISE EXCEPTION 'hrs1 exact recovery role transition required' USING ERRCODE='P7802';
 END IF;
 FOR role_row IN SELECT role.* FROM pg_catalog.pg_roles role WHERE role.rolname IN
  ('ot_v3_result_owner','ot_v3_result_writer','ot_v3_result_reader','ot_v3_result_verifier') LOOP
  IF role_row.rolcanlogin IS DISTINCT FROM (role_row.rolname<>'ot_v3_result_owner') OR role_row.rolinherit OR role_row.rolsuper
   OR role_row.rolcreatedb OR role_row.rolcreaterole OR role_row.rolbypassrls OR role_row.rolreplication OR role_row.rolconfig IS NOT NULL
   OR role_row.rolvaliduntil IS NOT NULL OR role_row.rolconnlimit<>(CASE WHEN role_row.rolname='ot_v3_result_owner' THEN -1 ELSE 2 END)
   OR EXISTS(SELECT 1 FROM pg_catalog.pg_db_role_setting settings WHERE settings.setrole=role_row.oid)
   OR EXISTS(SELECT 1 FROM pg_catalog.pg_default_acl defaults WHERE defaults.defaclrole=role_row.oid)
   OR pg_catalog.has_database_privilege(role_row.oid,current_database(),'CREATE')
   OR (SELECT count(*) FROM pg_catalog.pg_auth_members membership WHERE role_row.oid IN (membership.roleid,membership.member,membership.grantor))
     <>CASE WHEN temporary_edge AND role_row.oid=owner_id THEN 2 ELSE 1 END
   OR NOT EXISTS(SELECT 1 FROM pg_catalog.pg_auth_members membership WHERE membership.roleid=role_row.oid
     AND membership.member=creator AND membership.grantor=10 AND membership.admin_option
     AND NOT membership.inherit_option AND NOT membership.set_option)
   OR (temporary_edge AND role_row.oid=owner_id AND NOT EXISTS(SELECT 1 FROM pg_catalog.pg_auth_members membership
     WHERE membership.roleid=owner_id AND membership.member=creator AND membership.grantor=creator
      AND NOT membership.admin_option AND NOT membership.inherit_option AND membership.set_option))
   OR pg_catalog.pg_has_role(creator,role_row.oid,'USAGE')
   OR pg_catalog.pg_has_role(creator,role_row.oid,'SET') IS DISTINCT FROM (temporary_edge AND role_row.oid=owner_id) THEN
   RAISE EXCEPTION 'hrs1 exact recovery role topology required' USING ERRCODE='P7802';
  END IF;
 END LOOP;
 IF (SELECT count(*) FROM pg_catalog.pg_roles role WHERE role.rolname IN
   ('ot_v3_result_owner','ot_v3_result_writer','ot_v3_result_reader','ot_v3_result_verifier'))<>4
  OR NOT EXISTS(SELECT 1 FROM pg_catalog.pg_roles role WHERE role.rolname='ot_v3_intake_owner'
    AND NOT role.rolcanlogin AND NOT role.rolinherit AND NOT role.rolsuper AND NOT role.rolcreatedb
    AND NOT role.rolcreaterole AND NOT role.rolreplication AND NOT role.rolbypassrls
    AND role.rolconnlimit=-1 AND role.rolconfig IS NULL AND role.rolvaliduntil IS NULL)
  OR EXISTS(SELECT 1 FROM pg_catalog.pg_db_role_setting settings WHERE settings.setrole='ot_v3_intake_owner'::regrole)
  OR EXISTS(SELECT 1 FROM pg_catalog.pg_default_acl defaults WHERE defaults.defaclrole='ot_v3_intake_owner'::regrole)
  OR (SELECT count(*) FROM pg_catalog.pg_auth_members membership WHERE 'ot_v3_intake_owner'::regrole IN
    (membership.roleid,membership.member,membership.grantor))<>1
  OR NOT EXISTS(SELECT 1 FROM pg_catalog.pg_auth_members membership WHERE membership.roleid='ot_v3_intake_owner'::regrole
    AND membership.member=creator AND membership.grantor=10 AND membership.admin_option
    AND NOT membership.inherit_option AND NOT membership.set_option)
  OR pg_catalog.pg_has_role(creator,'ot_v3_intake_owner'::regrole,'USAGE')
  OR pg_catalog.pg_has_role(creator,'ot_v3_intake_owner'::regrole,'SET') THEN
  RAISE EXCEPTION 'hrs1 original intake owner topology required' USING ERRCODE='P7802';
 END IF;
END $hrs1_recovery_role_boundary$;

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

-- Only the independently verified unused package owner receives this transaction-local SET capability.
GRANT ot_v3_result_owner TO postgres WITH ADMIN FALSE, INHERIT FALSE, SET TRUE GRANTED BY postgres;
SET LOCAL ROLE ot_v3_result_owner;

DO $hrs1_recovery_role_boundary$
DECLARE role_row record; creator oid:='postgres'::regrole; owner_id oid:='ot_v3_result_owner'::regrole;
 temporary_edge boolean:=true;
BEGIN
 IF session_user<>'postgres'
  OR current_user<>CASE WHEN temporary_edge THEN 'ot_v3_result_owner' ELSE 'postgres' END THEN
  RAISE EXCEPTION 'hrs1 exact recovery role transition required' USING ERRCODE='P7802';
 END IF;
 FOR role_row IN SELECT role.* FROM pg_catalog.pg_roles role WHERE role.rolname IN
  ('ot_v3_result_owner','ot_v3_result_writer','ot_v3_result_reader','ot_v3_result_verifier') LOOP
  IF role_row.rolcanlogin IS DISTINCT FROM (role_row.rolname<>'ot_v3_result_owner') OR role_row.rolinherit OR role_row.rolsuper
   OR role_row.rolcreatedb OR role_row.rolcreaterole OR role_row.rolbypassrls OR role_row.rolreplication OR role_row.rolconfig IS NOT NULL
   OR role_row.rolvaliduntil IS NOT NULL OR role_row.rolconnlimit<>(CASE WHEN role_row.rolname='ot_v3_result_owner' THEN -1 ELSE 2 END)
   OR EXISTS(SELECT 1 FROM pg_catalog.pg_db_role_setting settings WHERE settings.setrole=role_row.oid)
   OR EXISTS(SELECT 1 FROM pg_catalog.pg_default_acl defaults WHERE defaults.defaclrole=role_row.oid)
   OR pg_catalog.has_database_privilege(role_row.oid,current_database(),'CREATE')
   OR (SELECT count(*) FROM pg_catalog.pg_auth_members membership WHERE role_row.oid IN (membership.roleid,membership.member,membership.grantor))
     <>CASE WHEN temporary_edge AND role_row.oid=owner_id THEN 2 ELSE 1 END
   OR NOT EXISTS(SELECT 1 FROM pg_catalog.pg_auth_members membership WHERE membership.roleid=role_row.oid
     AND membership.member=creator AND membership.grantor=10 AND membership.admin_option
     AND NOT membership.inherit_option AND NOT membership.set_option)
   OR (temporary_edge AND role_row.oid=owner_id AND NOT EXISTS(SELECT 1 FROM pg_catalog.pg_auth_members membership
     WHERE membership.roleid=owner_id AND membership.member=creator AND membership.grantor=creator
      AND NOT membership.admin_option AND NOT membership.inherit_option AND membership.set_option))
   OR pg_catalog.pg_has_role(creator,role_row.oid,'USAGE')
   OR pg_catalog.pg_has_role(creator,role_row.oid,'SET') IS DISTINCT FROM (temporary_edge AND role_row.oid=owner_id) THEN
   RAISE EXCEPTION 'hrs1 exact recovery role topology required' USING ERRCODE='P7802';
  END IF;
 END LOOP;
 IF (SELECT count(*) FROM pg_catalog.pg_roles role WHERE role.rolname IN
   ('ot_v3_result_owner','ot_v3_result_writer','ot_v3_result_reader','ot_v3_result_verifier'))<>4
  OR NOT EXISTS(SELECT 1 FROM pg_catalog.pg_roles role WHERE role.rolname='ot_v3_intake_owner'
    AND NOT role.rolcanlogin AND NOT role.rolinherit AND NOT role.rolsuper AND NOT role.rolcreatedb
    AND NOT role.rolcreaterole AND NOT role.rolreplication AND NOT role.rolbypassrls
    AND role.rolconnlimit=-1 AND role.rolconfig IS NULL AND role.rolvaliduntil IS NULL)
  OR EXISTS(SELECT 1 FROM pg_catalog.pg_db_role_setting settings WHERE settings.setrole='ot_v3_intake_owner'::regrole)
  OR EXISTS(SELECT 1 FROM pg_catalog.pg_default_acl defaults WHERE defaults.defaclrole='ot_v3_intake_owner'::regrole)
  OR (SELECT count(*) FROM pg_catalog.pg_auth_members membership WHERE 'ot_v3_intake_owner'::regrole IN
    (membership.roleid,membership.member,membership.grantor))<>1
  OR NOT EXISTS(SELECT 1 FROM pg_catalog.pg_auth_members membership WHERE membership.roleid='ot_v3_intake_owner'::regrole
    AND membership.member=creator AND membership.grantor=10 AND membership.admin_option
    AND NOT membership.inherit_option AND NOT membership.set_option)
  OR pg_catalog.pg_has_role(creator,'ot_v3_intake_owner'::regrole,'USAGE')
  OR pg_catalog.pg_has_role(creator,'ot_v3_intake_owner'::regrole,'SET') THEN
  RAISE EXCEPTION 'hrs1 original intake owner topology required' USING ERRCODE='P7802';
 END IF;
END $hrs1_recovery_role_boundary$;

DO $hrs1_recovery_unused$
DECLARE expected_identity jsonb:=pg_catalog.current_setting('jetnity.hrs1_recovery_identity')::jsonb;
 bound official_v3_result_private.binding_v1%ROWTYPE;
BEGIN
 SELECT binding_row.* INTO bound FROM official_v3_result_private.binding_v1 binding_row WHERE binding_row.singleton;
 IF (SELECT count(*) FROM official_v3_result_private.binding_v1)<>1 OR bound.singleton IS DISTINCT FROM true
  OR bound.creator_oid IS DISTINCT FROM 'postgres'::regrole::oid
  OR bound.binding_hash IS DISTINCT FROM expected_identity->>'bindingHash'
  OR bound.catalog IS DISTINCT FROM expected_identity->'catalog'
  OR official_v3_result_private.binding_valid_v1(bound.binding) IS NOT TRUE
  OR official_v3_result_private.hash_v1(bound.binding) IS DISTINCT FROM bound.binding_hash THEN
  RAISE EXCEPTION 'hrs1 complete original binding or stored catalog differs' USING ERRCODE='P7802';
 END IF;
 IF EXISTS(SELECT 1 FROM official_v3_result_private.originals_v1)
  OR EXISTS(SELECT 1 FROM official_v3_result_private.extractions_v1)
  OR EXISTS(SELECT 1 FROM official_v3_result_private.qualifications_v1)
  OR EXISTS(SELECT 1 FROM official_v3_result_private.decisions_v1)
  OR EXISTS(SELECT 1 FROM official_v3_result_private.archive_pages_v1)
  OR EXISTS(SELECT 1 FROM official_v3_result_private.versions_v1)
  OR EXISTS(SELECT 1 FROM official_v3_result_private.projections_v1)
  OR EXISTS(SELECT 1 FROM official_v3_result_private.operations_v1)
  OR EXISTS(SELECT 1 FROM official_v3_result_private.outbox_v1)
  OR (SELECT count(*) FROM official_v3_result_private.heads_v1)<>1
  OR NOT EXISTS(SELECT 1 FROM official_v3_result_private.heads_v1 head WHERE head.singleton
    AND head.context_key=bound.binding->>'contextKey'
    AND head.version_ref IS NULL AND head.decision_ref IS NULL AND head.sticky_decision_ref IS NULL AND head.projection_ref IS NULL
    AND head.suppression='null'::jsonb AND head.suppression_epoch=0 AND head.generation=0 AND head.coverage=false)
  OR (SELECT count(*) FROM official_v3_result_private.monitor_schedule_v1)<>1
  OR NOT EXISTS(SELECT 1 FROM official_v3_result_private.monitor_schedule_v1 schedule WHERE schedule.singleton
    AND schedule.generation=0 AND schedule.claimed_by IS NULL AND schedule.claim_operation IS NULL
    AND schedule.next_check_at=official_v3_result_private.timestamp_v1(bound.binding->>'activeFrom')
    AND schedule.lease_until IS NULL AND schedule.outcomes='[]'::jsonb AND schedule.finish_operation IS NULL) THEN
  RAISE EXCEPTION 'hrs1 retained history or noninitial head or schedule forbids recovery' USING ERRCODE='P7807';
 END IF;
 IF EXISTS(SELECT 1 FROM pg_catalog.pg_namespace namespace_row WHERE namespace_row.nspname IN ('official_v3_jobs_private','official_v3_jobs_api'))
  OR EXISTS(SELECT 1 FROM pg_catalog.pg_roles role_row WHERE role_row.rolname IN ('ot_v3_jobs_owner','ot_v3_jobs_caller')) THEN
  RAISE EXCEPTION 'hrs1 recover the unused HM04 consumer first' USING ERRCODE='P7808';
 END IF;
END $hrs1_recovery_unused$;

DO $hrs1_recovery_callers$
BEGIN
 PERFORM pg_catalog.pg_stat_clear_snapshot();
 IF EXISTS(SELECT 1 FROM pg_catalog.pg_stat_activity activity WHERE activity.usesysid IN (
   SELECT role.oid FROM pg_catalog.pg_roles role WHERE role.rolname IN
    ('ot_v3_result_writer','ot_v3_result_reader','ot_v3_result_verifier'))) THEN
  RAISE EXCEPTION 'hrs1 a Result LOGIN still has an active backend' USING ERRCODE='P7809';
 END IF;
END $hrs1_recovery_callers$;

DO $hrs1_recovery_quiescence$
BEGIN
 IF NOT pg_catalog.pg_try_advisory_xact_lock(771105,2) THEN
  RAISE EXCEPTION 'hrs1 an actual Result operation is still active' USING ERRCODE='P7809';
 END IF;
 BEGIN
  LOCK TABLE official_v3_result_private.binding_v1,
   official_v3_result_private.originals_v1,
   official_v3_result_private.extractions_v1,
   official_v3_result_private.qualifications_v1,
   official_v3_result_private.decisions_v1,
   official_v3_result_private.archive_pages_v1,
   official_v3_result_private.versions_v1,
   official_v3_result_private.projections_v1,
   official_v3_result_private.heads_v1,
   official_v3_result_private.operations_v1,
   official_v3_result_private.outbox_v1,
   official_v3_result_private.monitor_schedule_v1 IN ACCESS EXCLUSIVE MODE NOWAIT;
 EXCEPTION WHEN lock_not_available THEN
  RAISE EXCEPTION 'hrs1 a Result table still has an external user' USING ERRCODE='P7809';
 END;
END $hrs1_recovery_quiescence$;

-- Repeat identity, exact inventories and unused state under the actual operation/table fences.

-- Pure catalog SQL, byte-identical to the installed catalog_v1 body; no private call.
DO $hrs1_recovery_metadata$
DECLARE actual_catalog jsonb; expected_identity jsonb:=pg_catalog.current_setting('jetnity.hrs1_recovery_identity')::jsonb;
BEGIN
 SELECT (
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
)
) INTO actual_catalog;
 IF actual_catalog IS DISTINCT FROM expected_identity->'catalog' THEN
  RAISE EXCEPTION 'hrs1 original full catalog identity differs' USING ERRCODE='P7802';
 END IF;
END $hrs1_recovery_metadata$;

DO $hrs1_recovery_role_boundary$
DECLARE role_row record; creator oid:='postgres'::regrole; owner_id oid:='ot_v3_result_owner'::regrole;
 temporary_edge boolean:=true;
BEGIN
 IF session_user<>'postgres'
  OR current_user<>CASE WHEN temporary_edge THEN 'ot_v3_result_owner' ELSE 'postgres' END THEN
  RAISE EXCEPTION 'hrs1 exact recovery role transition required' USING ERRCODE='P7802';
 END IF;
 FOR role_row IN SELECT role.* FROM pg_catalog.pg_roles role WHERE role.rolname IN
  ('ot_v3_result_owner','ot_v3_result_writer','ot_v3_result_reader','ot_v3_result_verifier') LOOP
  IF role_row.rolcanlogin IS DISTINCT FROM (role_row.rolname<>'ot_v3_result_owner') OR role_row.rolinherit OR role_row.rolsuper
   OR role_row.rolcreatedb OR role_row.rolcreaterole OR role_row.rolbypassrls OR role_row.rolreplication OR role_row.rolconfig IS NOT NULL
   OR role_row.rolvaliduntil IS NOT NULL OR role_row.rolconnlimit<>(CASE WHEN role_row.rolname='ot_v3_result_owner' THEN -1 ELSE 2 END)
   OR EXISTS(SELECT 1 FROM pg_catalog.pg_db_role_setting settings WHERE settings.setrole=role_row.oid)
   OR EXISTS(SELECT 1 FROM pg_catalog.pg_default_acl defaults WHERE defaults.defaclrole=role_row.oid)
   OR pg_catalog.has_database_privilege(role_row.oid,current_database(),'CREATE')
   OR (SELECT count(*) FROM pg_catalog.pg_auth_members membership WHERE role_row.oid IN (membership.roleid,membership.member,membership.grantor))
     <>CASE WHEN temporary_edge AND role_row.oid=owner_id THEN 2 ELSE 1 END
   OR NOT EXISTS(SELECT 1 FROM pg_catalog.pg_auth_members membership WHERE membership.roleid=role_row.oid
     AND membership.member=creator AND membership.grantor=10 AND membership.admin_option
     AND NOT membership.inherit_option AND NOT membership.set_option)
   OR (temporary_edge AND role_row.oid=owner_id AND NOT EXISTS(SELECT 1 FROM pg_catalog.pg_auth_members membership
     WHERE membership.roleid=owner_id AND membership.member=creator AND membership.grantor=creator
      AND NOT membership.admin_option AND NOT membership.inherit_option AND membership.set_option))
   OR pg_catalog.pg_has_role(creator,role_row.oid,'USAGE')
   OR pg_catalog.pg_has_role(creator,role_row.oid,'SET') IS DISTINCT FROM (temporary_edge AND role_row.oid=owner_id) THEN
   RAISE EXCEPTION 'hrs1 exact recovery role topology required' USING ERRCODE='P7802';
  END IF;
 END LOOP;
 IF (SELECT count(*) FROM pg_catalog.pg_roles role WHERE role.rolname IN
   ('ot_v3_result_owner','ot_v3_result_writer','ot_v3_result_reader','ot_v3_result_verifier'))<>4
  OR NOT EXISTS(SELECT 1 FROM pg_catalog.pg_roles role WHERE role.rolname='ot_v3_intake_owner'
    AND NOT role.rolcanlogin AND NOT role.rolinherit AND NOT role.rolsuper AND NOT role.rolcreatedb
    AND NOT role.rolcreaterole AND NOT role.rolreplication AND NOT role.rolbypassrls
    AND role.rolconnlimit=-1 AND role.rolconfig IS NULL AND role.rolvaliduntil IS NULL)
  OR EXISTS(SELECT 1 FROM pg_catalog.pg_db_role_setting settings WHERE settings.setrole='ot_v3_intake_owner'::regrole)
  OR EXISTS(SELECT 1 FROM pg_catalog.pg_default_acl defaults WHERE defaults.defaclrole='ot_v3_intake_owner'::regrole)
  OR (SELECT count(*) FROM pg_catalog.pg_auth_members membership WHERE 'ot_v3_intake_owner'::regrole IN
    (membership.roleid,membership.member,membership.grantor))<>1
  OR NOT EXISTS(SELECT 1 FROM pg_catalog.pg_auth_members membership WHERE membership.roleid='ot_v3_intake_owner'::regrole
    AND membership.member=creator AND membership.grantor=10 AND membership.admin_option
    AND NOT membership.inherit_option AND NOT membership.set_option)
  OR pg_catalog.pg_has_role(creator,'ot_v3_intake_owner'::regrole,'USAGE')
  OR pg_catalog.pg_has_role(creator,'ot_v3_intake_owner'::regrole,'SET') THEN
  RAISE EXCEPTION 'hrs1 original intake owner topology required' USING ERRCODE='P7802';
 END IF;
END $hrs1_recovery_role_boundary$;

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

DO $hrs1_recovery_unused$
DECLARE expected_identity jsonb:=pg_catalog.current_setting('jetnity.hrs1_recovery_identity')::jsonb;
 bound official_v3_result_private.binding_v1%ROWTYPE;
BEGIN
 SELECT binding_row.* INTO bound FROM official_v3_result_private.binding_v1 binding_row WHERE binding_row.singleton;
 IF (SELECT count(*) FROM official_v3_result_private.binding_v1)<>1 OR bound.singleton IS DISTINCT FROM true
  OR bound.creator_oid IS DISTINCT FROM 'postgres'::regrole::oid
  OR bound.binding_hash IS DISTINCT FROM expected_identity->>'bindingHash'
  OR bound.catalog IS DISTINCT FROM expected_identity->'catalog'
  OR official_v3_result_private.binding_valid_v1(bound.binding) IS NOT TRUE
  OR official_v3_result_private.hash_v1(bound.binding) IS DISTINCT FROM bound.binding_hash THEN
  RAISE EXCEPTION 'hrs1 complete original binding or stored catalog differs' USING ERRCODE='P7802';
 END IF;
 IF EXISTS(SELECT 1 FROM official_v3_result_private.originals_v1)
  OR EXISTS(SELECT 1 FROM official_v3_result_private.extractions_v1)
  OR EXISTS(SELECT 1 FROM official_v3_result_private.qualifications_v1)
  OR EXISTS(SELECT 1 FROM official_v3_result_private.decisions_v1)
  OR EXISTS(SELECT 1 FROM official_v3_result_private.archive_pages_v1)
  OR EXISTS(SELECT 1 FROM official_v3_result_private.versions_v1)
  OR EXISTS(SELECT 1 FROM official_v3_result_private.projections_v1)
  OR EXISTS(SELECT 1 FROM official_v3_result_private.operations_v1)
  OR EXISTS(SELECT 1 FROM official_v3_result_private.outbox_v1)
  OR (SELECT count(*) FROM official_v3_result_private.heads_v1)<>1
  OR NOT EXISTS(SELECT 1 FROM official_v3_result_private.heads_v1 head WHERE head.singleton
    AND head.context_key=bound.binding->>'contextKey'
    AND head.version_ref IS NULL AND head.decision_ref IS NULL AND head.sticky_decision_ref IS NULL AND head.projection_ref IS NULL
    AND head.suppression='null'::jsonb AND head.suppression_epoch=0 AND head.generation=0 AND head.coverage=false)
  OR (SELECT count(*) FROM official_v3_result_private.monitor_schedule_v1)<>1
  OR NOT EXISTS(SELECT 1 FROM official_v3_result_private.monitor_schedule_v1 schedule WHERE schedule.singleton
    AND schedule.generation=0 AND schedule.claimed_by IS NULL AND schedule.claim_operation IS NULL
    AND schedule.next_check_at=official_v3_result_private.timestamp_v1(bound.binding->>'activeFrom')
    AND schedule.lease_until IS NULL AND schedule.outcomes='[]'::jsonb AND schedule.finish_operation IS NULL) THEN
  RAISE EXCEPTION 'hrs1 retained history or noninitial head or schedule forbids recovery' USING ERRCODE='P7807';
 END IF;
 IF EXISTS(SELECT 1 FROM pg_catalog.pg_namespace namespace_row WHERE namespace_row.nspname IN ('official_v3_jobs_private','official_v3_jobs_api'))
  OR EXISTS(SELECT 1 FROM pg_catalog.pg_roles role_row WHERE role_row.rolname IN ('ot_v3_jobs_owner','ot_v3_jobs_caller')) THEN
  RAISE EXCEPTION 'hrs1 recover the unused HM04 consumer first' USING ERRCODE='P7808';
 END IF;
END $hrs1_recovery_unused$;

DO $hrs1_recovery_callers$
BEGIN
 PERFORM pg_catalog.pg_stat_clear_snapshot();
 IF EXISTS(SELECT 1 FROM pg_catalog.pg_stat_activity activity WHERE activity.usesysid IN (
   SELECT role.oid FROM pg_catalog.pg_roles role WHERE role.rolname IN
    ('ot_v3_result_writer','ot_v3_result_reader','ot_v3_result_verifier'))) THEN
  RAISE EXCEPTION 'hrs1 a Result LOGIN still has an active backend' USING ERRCODE='P7809';
 END IF;
END $hrs1_recovery_callers$;

-- Fixed finite reverse inventory. RESTRICT preserves every unknown dependency.

DROP TRIGGER hrs1_immutable_row ON official_v3_result_private.binding_v1 RESTRICT;

DROP TRIGGER hrs1_immutable_truncate ON official_v3_result_private.binding_v1 RESTRICT;

DROP POLICY hrs1_owner ON official_v3_result_private.binding_v1 RESTRICT;

DROP TRIGGER hrs1_immutable_row ON official_v3_result_private.originals_v1 RESTRICT;

DROP TRIGGER hrs1_immutable_truncate ON official_v3_result_private.originals_v1 RESTRICT;

DROP POLICY hrs1_owner ON official_v3_result_private.originals_v1 RESTRICT;

DROP TRIGGER hrs1_immutable_row ON official_v3_result_private.extractions_v1 RESTRICT;

DROP TRIGGER hrs1_immutable_truncate ON official_v3_result_private.extractions_v1 RESTRICT;

DROP POLICY hrs1_owner ON official_v3_result_private.extractions_v1 RESTRICT;

DROP TRIGGER hrs1_immutable_row ON official_v3_result_private.qualifications_v1 RESTRICT;

DROP TRIGGER hrs1_immutable_truncate ON official_v3_result_private.qualifications_v1 RESTRICT;

DROP POLICY hrs1_owner ON official_v3_result_private.qualifications_v1 RESTRICT;

DROP TRIGGER hrs1_immutable_row ON official_v3_result_private.decisions_v1 RESTRICT;

DROP TRIGGER hrs1_immutable_truncate ON official_v3_result_private.decisions_v1 RESTRICT;

DROP POLICY hrs1_owner ON official_v3_result_private.decisions_v1 RESTRICT;

DROP TRIGGER hrs1_immutable_row ON official_v3_result_private.archive_pages_v1 RESTRICT;

DROP TRIGGER hrs1_immutable_truncate ON official_v3_result_private.archive_pages_v1 RESTRICT;

DROP POLICY hrs1_owner ON official_v3_result_private.archive_pages_v1 RESTRICT;

DROP TRIGGER hrs1_immutable_row ON official_v3_result_private.versions_v1 RESTRICT;

DROP TRIGGER hrs1_immutable_truncate ON official_v3_result_private.versions_v1 RESTRICT;

DROP POLICY hrs1_owner ON official_v3_result_private.versions_v1 RESTRICT;

DROP TRIGGER hrs1_immutable_row ON official_v3_result_private.projections_v1 RESTRICT;

DROP TRIGGER hrs1_immutable_truncate ON official_v3_result_private.projections_v1 RESTRICT;

DROP POLICY hrs1_owner ON official_v3_result_private.projections_v1 RESTRICT;

DROP TRIGGER hrs1_immutable_row ON official_v3_result_private.heads_v1 RESTRICT;

DROP TRIGGER hrs1_immutable_truncate ON official_v3_result_private.heads_v1 RESTRICT;

DROP POLICY hrs1_owner ON official_v3_result_private.heads_v1 RESTRICT;

DROP TRIGGER hrs1_immutable_row ON official_v3_result_private.operations_v1 RESTRICT;

DROP TRIGGER hrs1_immutable_truncate ON official_v3_result_private.operations_v1 RESTRICT;

DROP POLICY hrs1_owner ON official_v3_result_private.operations_v1 RESTRICT;

DROP TRIGGER hrs1_immutable_row ON official_v3_result_private.outbox_v1 RESTRICT;

DROP TRIGGER hrs1_immutable_truncate ON official_v3_result_private.outbox_v1 RESTRICT;

DROP POLICY hrs1_owner ON official_v3_result_private.outbox_v1 RESTRICT;

DROP TRIGGER hrs1_immutable_row ON official_v3_result_private.monitor_schedule_v1 RESTRICT;

DROP TRIGGER hrs1_immutable_truncate ON official_v3_result_private.monitor_schedule_v1 RESTRICT;

DROP POLICY hrs1_owner ON official_v3_result_private.monitor_schedule_v1 RESTRICT;

DROP TABLE official_v3_result_private.heads_v1 RESTRICT;

DROP TABLE official_v3_result_private.outbox_v1 RESTRICT;

DROP TABLE official_v3_result_private.projections_v1 RESTRICT;

DROP TABLE official_v3_result_private.versions_v1 RESTRICT;

DROP TABLE official_v3_result_private.decisions_v1 RESTRICT;

DROP TABLE official_v3_result_private.archive_pages_v1 RESTRICT;

DROP TABLE official_v3_result_private.qualifications_v1 RESTRICT;

DROP TABLE official_v3_result_private.extractions_v1 RESTRICT;

DROP TABLE official_v3_result_private.originals_v1 RESTRICT;

DROP TABLE official_v3_result_private.operations_v1 RESTRICT;

DROP TABLE official_v3_result_private.monitor_schedule_v1 RESTRICT;

DROP TABLE official_v3_result_private.binding_v1 RESTRICT;

DROP FUNCTION official_v3_result_private.s1_read_locked_v1(jsonb,text,int4) RESTRICT;

DROP FUNCTION official_v3_result_private.ma1_require_current_locked_v1(text,int4,text,text,int4) RESTRICT;

DROP FUNCTION official_v3_result_api.read_v1(jsonb,text,text,int4,text,text,int4,int4,text,text) RESTRICT;

DROP FUNCTION official_v3_result_api.execute_v1(jsonb,text,text,int4,text,text,int4,int4,text,text) RESTRICT;

DROP FUNCTION official_v3_result_api.attest_v1(jsonb,text,text,int4,text,text,int4,int4,text,text) RESTRICT;

DROP FUNCTION official_v3_result_private.dispatch_v1(text,jsonb,text,text,int4,text,text,int4,int4,text,text) RESTRICT;

DROP FUNCTION official_v3_result_private.command_v1(jsonb,jsonb) RESTRICT;

DROP FUNCTION official_v3_result_private.monitor_finish_v1(jsonb,jsonb,int4,timestamptz,text) RESTRICT;

DROP FUNCTION official_v3_result_private.monitor_claim_v1(jsonb,jsonb,int4,timestamptz,text) RESTRICT;

DROP FUNCTION official_v3_result_private.suppress_v1(jsonb,jsonb,int4,timestamptz,text) RESTRICT;

DROP FUNCTION official_v3_result_private.plan_current_v1(int8,jsonb,jsonb) RESTRICT;

DROP FUNCTION official_v3_result_private.plan_v1(jsonb) RESTRICT;

DROP FUNCTION official_v3_result_private.current_projection_v1(jsonb,text) RESTRICT;

DROP FUNCTION official_v3_result_private.projection_binding_v1(jsonb) RESTRICT;

DROP FUNCTION official_v3_result_private.escalation_v1(jsonb,jsonb,int4,timestamptz,text,bool) RESTRICT;

DROP FUNCTION official_v3_result_private.publication_v1(jsonb,jsonb,int4,timestamptz,text,bool) RESTRICT;

DROP FUNCTION official_v3_result_private.transition_v1(jsonb,jsonb,int4,timestamptz,text,bool) RESTRICT;

DROP FUNCTION official_v3_result_private.prepared_v1(jsonb,jsonb,jsonb) RESTRICT;

DROP FUNCTION official_v3_result_private.keep_decision_v1(jsonb) RESTRICT;

DROP FUNCTION official_v3_result_private.consume_s1_v1(jsonb,jsonb,jsonb) RESTRICT;

DROP FUNCTION official_v3_result_private.attest_v1(jsonb,jsonb,int4,timestamptz,text) RESTRICT;

DROP FUNCTION official_v3_result_private.keep_original_v1(jsonb,jsonb) RESTRICT;

DROP FUNCTION official_v3_result_private.fence_v1(jsonb,int4,timestamptz,text,jsonb) RESTRICT;

DROP FUNCTION official_v3_result_private.verification_v1(jsonb,jsonb,bool) RESTRICT;

DROP FUNCTION official_v3_result_private.observations_v1(jsonb) RESTRICT;

DROP FUNCTION official_v3_result_private.original_v1(jsonb,jsonb) RESTRICT;

DROP FUNCTION official_v3_result_private.assert_history_v1() RESTRICT;

DROP FUNCTION official_v3_result_private.state_v1() RESTRICT;

DROP FUNCTION official_v3_result_private.selected_binding_v1() RESTRICT;

DROP FUNCTION official_v3_result_private.assert_catalog_v1() RESTRICT;

DROP FUNCTION official_v3_result_private.catalog_v1() RESTRICT;

DROP FUNCTION official_v3_result_private.binding_valid_v1(jsonb) RESTRICT;

DROP FUNCTION official_v3_result_private.record_shape_v1(jsonb,text) RESTRICT;

DROP FUNCTION official_v3_result_private.s1_shape_v1(jsonb,text) RESTRICT;

DROP FUNCTION official_v3_result_private.time_text_v1(timestamptz) RESTRICT;

DROP FUNCTION official_v3_result_private.ref_v1(text,jsonb) RESTRICT;

DROP FUNCTION official_v3_result_private.hash_v1(jsonb) RESTRICT;

DROP FUNCTION official_v3_result_private.immutable_v1() RESTRICT;

DROP FUNCTION official_v3_result_private.validate_s1_copy_v1(jsonb,jsonb,jsonb,text) RESTRICT;

DROP FUNCTION official_v3_result_private.proposal_retainable_v1(jsonb) RESTRICT;

DROP FUNCTION official_v3_result_private.shape_matches_v1(jsonb,jsonb,jsonb,jsonb,int4) RESTRICT;

DROP FUNCTION official_v3_result_private.data_nodes_v1(jsonb,int4,int4,int4) RESTRICT;

DROP FUNCTION official_v3_result_private.proposal_shape_v1() RESTRICT;

DROP FUNCTION official_v3_result_private.unique_json_v1(json,int4) RESTRICT;

DROP FUNCTION official_v3_result_private.safe_data_v1(jsonb,int4) RESTRICT;

DROP FUNCTION official_v3_result_private.reference_v1(jsonb) RESTRICT;

DROP FUNCTION official_v3_result_private.subject_v1(text,jsonb) RESTRICT;

DROP FUNCTION official_v3_result_private.context_v1(jsonb) RESTRICT;

DROP FUNCTION official_v3_result_private.expression_v1(jsonb,bool,int4) RESTRICT;

DROP FUNCTION official_v3_result_private.predicate_v1(jsonb) RESTRICT;

DROP FUNCTION official_v3_result_private.timestamp_v1(text) RESTRICT;

DROP FUNCTION official_v3_result_private.civil_date_v1(text) RESTRICT;

DROP FUNCTION official_v3_result_private.canonical_v1(jsonb,int4) RESTRICT;

DROP FUNCTION official_v3_result_private.nodes_v1(jsonb,int4,int4,int4) RESTRICT;

DROP FUNCTION official_v3_result_private.exact_keys_v1(jsonb,_text) RESTRICT;

DROP SCHEMA official_v3_result_api RESTRICT;
DROP SCHEMA official_v3_result_private RESTRICT;
RESET ROLE;
REVOKE ot_v3_result_owner FROM postgres GRANTED BY postgres RESTRICT;

DO $hrs1_recovery_role_boundary$
DECLARE role_row record; creator oid:='postgres'::regrole; owner_id oid:='ot_v3_result_owner'::regrole;
 temporary_edge boolean:=false;
BEGIN
 IF session_user<>'postgres'
  OR current_user<>CASE WHEN temporary_edge THEN 'ot_v3_result_owner' ELSE 'postgres' END THEN
  RAISE EXCEPTION 'hrs1 exact recovery role transition required' USING ERRCODE='P7802';
 END IF;
 FOR role_row IN SELECT role.* FROM pg_catalog.pg_roles role WHERE role.rolname IN
  ('ot_v3_result_owner','ot_v3_result_writer','ot_v3_result_reader','ot_v3_result_verifier') LOOP
  IF role_row.rolcanlogin IS DISTINCT FROM (role_row.rolname<>'ot_v3_result_owner') OR role_row.rolinherit OR role_row.rolsuper
   OR role_row.rolcreatedb OR role_row.rolcreaterole OR role_row.rolbypassrls OR role_row.rolreplication OR role_row.rolconfig IS NOT NULL
   OR role_row.rolvaliduntil IS NOT NULL OR role_row.rolconnlimit<>(CASE WHEN role_row.rolname='ot_v3_result_owner' THEN -1 ELSE 2 END)
   OR EXISTS(SELECT 1 FROM pg_catalog.pg_db_role_setting settings WHERE settings.setrole=role_row.oid)
   OR EXISTS(SELECT 1 FROM pg_catalog.pg_default_acl defaults WHERE defaults.defaclrole=role_row.oid)
   OR pg_catalog.has_database_privilege(role_row.oid,current_database(),'CREATE')
   OR (SELECT count(*) FROM pg_catalog.pg_auth_members membership WHERE role_row.oid IN (membership.roleid,membership.member,membership.grantor))
     <>CASE WHEN temporary_edge AND role_row.oid=owner_id THEN 2 ELSE 1 END
   OR NOT EXISTS(SELECT 1 FROM pg_catalog.pg_auth_members membership WHERE membership.roleid=role_row.oid
     AND membership.member=creator AND membership.grantor=10 AND membership.admin_option
     AND NOT membership.inherit_option AND NOT membership.set_option)
   OR (temporary_edge AND role_row.oid=owner_id AND NOT EXISTS(SELECT 1 FROM pg_catalog.pg_auth_members membership
     WHERE membership.roleid=owner_id AND membership.member=creator AND membership.grantor=creator
      AND NOT membership.admin_option AND NOT membership.inherit_option AND membership.set_option))
   OR pg_catalog.pg_has_role(creator,role_row.oid,'USAGE')
   OR pg_catalog.pg_has_role(creator,role_row.oid,'SET') IS DISTINCT FROM (temporary_edge AND role_row.oid=owner_id) THEN
   RAISE EXCEPTION 'hrs1 exact recovery role topology required' USING ERRCODE='P7802';
  END IF;
 END LOOP;
 IF (SELECT count(*) FROM pg_catalog.pg_roles role WHERE role.rolname IN
   ('ot_v3_result_owner','ot_v3_result_writer','ot_v3_result_reader','ot_v3_result_verifier'))<>4
  OR NOT EXISTS(SELECT 1 FROM pg_catalog.pg_roles role WHERE role.rolname='ot_v3_intake_owner'
    AND NOT role.rolcanlogin AND NOT role.rolinherit AND NOT role.rolsuper AND NOT role.rolcreatedb
    AND NOT role.rolcreaterole AND NOT role.rolreplication AND NOT role.rolbypassrls
    AND role.rolconnlimit=-1 AND role.rolconfig IS NULL AND role.rolvaliduntil IS NULL)
  OR EXISTS(SELECT 1 FROM pg_catalog.pg_db_role_setting settings WHERE settings.setrole='ot_v3_intake_owner'::regrole)
  OR EXISTS(SELECT 1 FROM pg_catalog.pg_default_acl defaults WHERE defaults.defaclrole='ot_v3_intake_owner'::regrole)
  OR (SELECT count(*) FROM pg_catalog.pg_auth_members membership WHERE 'ot_v3_intake_owner'::regrole IN
    (membership.roleid,membership.member,membership.grantor))<>1
  OR NOT EXISTS(SELECT 1 FROM pg_catalog.pg_auth_members membership WHERE membership.roleid='ot_v3_intake_owner'::regrole
    AND membership.member=creator AND membership.grantor=10 AND membership.admin_option
    AND NOT membership.inherit_option AND NOT membership.set_option)
  OR pg_catalog.pg_has_role(creator,'ot_v3_intake_owner'::regrole,'USAGE')
  OR pg_catalog.pg_has_role(creator,'ot_v3_intake_owner'::regrole,'SET') THEN
  RAISE EXCEPTION 'hrs1 original intake owner topology required' USING ERRCODE='P7802';
 END IF;
END $hrs1_recovery_role_boundary$;

DO $hrs1_recovery_callers$
BEGIN
 PERFORM pg_catalog.pg_stat_clear_snapshot();
 IF EXISTS(SELECT 1 FROM pg_catalog.pg_stat_activity activity WHERE activity.usesysid IN (
   SELECT role.oid FROM pg_catalog.pg_roles role WHERE role.rolname IN
    ('ot_v3_result_writer','ot_v3_result_reader','ot_v3_result_verifier'))) THEN
  RAISE EXCEPTION 'hrs1 a Result LOGIN still has an active backend' USING ERRCODE='P7809';
 END IF;
END $hrs1_recovery_callers$;

REVOKE CONNECT ON DATABASE postgres FROM ot_v3_result_writer,ot_v3_result_reader,ot_v3_result_verifier RESTRICT;
DROP ROLE ot_v3_result_verifier;
DROP ROLE ot_v3_result_reader;
DROP ROLE ot_v3_result_writer;
DROP ROLE ot_v3_result_owner;

DO $hrs1_recovery_final$
DECLARE original_catalog jsonb:=(pg_catalog.current_setting('jetnity.hrs1_recovery_identity')::jsonb)->'catalog';
 original_database jsonb; retained_acl jsonb; expected_preserved jsonb; actual_preserved jsonb;
BEGIN
 IF session_user<>'postgres' OR current_user<>session_user
  OR EXISTS(SELECT 1 FROM pg_catalog.pg_namespace n WHERE n.nspname IN ('official_v3_result_private','official_v3_result_api'))
  OR EXISTS(SELECT 1 FROM pg_catalog.pg_roles r WHERE r.rolname IN
   ('ot_v3_result_owner','ot_v3_result_writer','ot_v3_result_reader','ot_v3_result_verifier'))
  OR EXISTS(SELECT 1 FROM pg_catalog.pg_auth_members m WHERE m.roleid IN
   (SELECT (role_value->>'oid')::oid FROM pg_catalog.jsonb_array_elements(original_catalog->'roles') role_value)
    OR m.member IN (SELECT (role_value->>'oid')::oid FROM pg_catalog.jsonb_array_elements(original_catalog->'roles') role_value)
    OR m.grantor IN (SELECT (role_value->>'oid')::oid FROM pg_catalog.jsonb_array_elements(original_catalog->'roles') role_value))
  OR EXISTS(SELECT 1 FROM pg_catalog.pg_shdepend d WHERE d.refclassid='pg_catalog.pg_authid'::regclass
   AND d.refobjid IN (SELECT (role_value->>'oid')::oid FROM pg_catalog.jsonb_array_elements(original_catalog->'roles') role_value)) THEN
  RAISE EXCEPTION 'hrs1 exact removal boundary differs' USING ERRCODE='P7802';
 END IF;
 PERFORM pg_catalog.pg_stat_clear_snapshot();
 IF EXISTS(SELECT 1 FROM pg_catalog.pg_stat_activity activity WHERE activity.usesysid IN
   (SELECT (role_value->>'oid')::oid FROM pg_catalog.jsonb_array_elements(original_catalog->'roles') role_value
     WHERE role_value->>'rolname' IN ('ot_v3_result_writer','ot_v3_result_reader','ot_v3_result_verifier'))) THEN
  RAISE EXCEPTION 'hrs1 a Result LOGIN entered during recovery' USING ERRCODE='P7809';
 END IF;
 -- The only database-ACL delta is the three independently verified new CONNECT grants.
 SELECT pg_catalog.jsonb_agg(acl_value ORDER BY ordinal) INTO retained_acl
  FROM pg_catalog.jsonb_array_elements(original_catalog#>'{database,datacl}') WITH ORDINALITY AS original_acl(acl_value,ordinal)
  WHERE acl_value NOT IN ('"ot_v3_result_writer=c/postgres"'::jsonb,
   '"ot_v3_result_reader=c/postgres"'::jsonb,'"ot_v3_result_verifier=c/postgres"'::jsonb);
 IF retained_acl IS NULL OR pg_catalog.jsonb_array_length(original_catalog#>'{database,datacl}')-pg_catalog.jsonb_array_length(retained_acl)<>3 THEN
  RAISE EXCEPTION 'hrs1 original database ACL cannot be preserved exactly' USING ERRCODE='P7802';
 END IF;
 original_database:=pg_catalog.jsonb_set(original_catalog->'database','{datacl}',retained_acl,false);
 expected_preserved:=pg_catalog.jsonb_build_object('database',original_database,'creator',original_catalog->'creator',
  'settings',original_catalog->'settings','defaults',original_catalog->'defaults',
  'prerequisiteFunctions',original_catalog->'prerequisiteFunctions','prerequisiteRelations',original_catalog->'prerequisiteRelations');
 SELECT (WITH prerequisite_ns AS (
 SELECT n.oid FROM pg_catalog.pg_namespace n WHERE n.nspname IN
  ('jetnity_ot_auth','official_v3_method_private','official_v3_method_api','official_v3_intake_private','official_v3_intake_api')
)
SELECT jsonb_build_object(
 'database',(SELECT to_jsonb(d)-ARRAY['datfrozenxid','datminmxid'] FROM pg_catalog.pg_database d WHERE d.datname=current_database()),
 'creator',(SELECT to_jsonb(r) FROM pg_catalog.pg_roles r WHERE r.rolname='postgres'),
 'settings',(SELECT jsonb_agg(to_jsonb(s) ORDER BY s.setdatabase,s.setrole) FROM pg_catalog.pg_db_role_setting s
   WHERE s.setrole='postgres'::regrole),
 'defaults',(SELECT jsonb_agg(to_jsonb(d) ORDER BY d.oid) FROM pg_catalog.pg_default_acl d
   WHERE d.defaclrole='postgres'::regrole AND d.defaclnamespace=0),
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
)
) INTO actual_preserved;
 IF actual_preserved IS DISTINCT FROM expected_preserved
  OR (SELECT count(*) FROM pg_catalog.pg_auth_members membership WHERE 'ot_v3_intake_owner'::regrole IN
    (membership.roleid,membership.member,membership.grantor))<>1
  OR NOT EXISTS(SELECT 1 FROM pg_catalog.pg_auth_members membership WHERE membership.roleid='ot_v3_intake_owner'::regrole
    AND membership.member='postgres'::regrole AND membership.grantor=10 AND membership.admin_option
    AND NOT membership.inherit_option AND NOT membership.set_option)
  OR pg_catalog.pg_has_role('postgres'::regrole,'ot_v3_intake_owner'::regrole,'USAGE')
  OR pg_catalog.pg_has_role('postgres'::regrole,'ot_v3_intake_owner'::regrole,'SET') THEN
  RAISE EXCEPTION 'hrs1 original database, Creator or prerequisites changed' USING ERRCODE='P7802';
 END IF;
END $hrs1_recovery_final$;
COMMIT;
