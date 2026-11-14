SET LOCAL jetnity.bg1_target='dev:yfvbxvijcorffwxbxahl:BG1';
-- BG1 source candidate. Additive upgrade on reviewed 4fd6dc9e; no historical installer rewrite.
SET LOCAL search_path=pg_catalog;
SET LOCAL statement_timeout='30s';
SET LOCAL lock_timeout='5s';
SET LOCAL idle_in_transaction_session_timeout='30s';
SET LOCAL timezone='UTC';
SET LOCAL datestyle='ISO, YMD';

DO $context$
BEGIN
  IF current_user<>'postgres' OR session_user<>current_user OR current_database()<>'postgres'
    OR current_setting('server_version_num')::integer/10000<>17
    OR current_setting('transaction_isolation') IS DISTINCT FROM 'read committed'
    OR current_setting('jetnity.bg1_target',true) IS DISTINCT FROM 'dev:yfvbxvijcorffwxbxahl:BG1'
    OR current_setting('createrole_self_grant')<>''
    OR NOT EXISTS(SELECT 1 FROM pg_roles WHERE rolname='postgres' AND NOT rolsuper AND rolcreaterole AND rolbypassrls)
    OR EXISTS(SELECT 1 FROM pg_namespace WHERE nspname='official_v3_guard_private') THEN
    RAISE EXCEPTION 'bg1 exact Dev predecessor required' USING ERRCODE='P7901';
  END IF;
  IF NOT pg_try_advisory_xact_lock(771101,1) OR NOT pg_try_advisory_xact_lock(771102,1)
    OR NOT pg_try_advisory_xact_lock(771103,1) OR NOT pg_try_advisory_xact_lock(771104,1)
    OR NOT pg_try_advisory_xact_lock(771105,1) OR NOT pg_try_advisory_xact_lock(771106,1) THEN
    RAISE EXCEPTION 'bg1 package operation already active' USING ERRCODE='P7901';
  END IF;
  -- A login can SET ROLE along SET edges, then use inherited caller rights.
  -- Walk that exact path backwards: INHERIT* first, then SET*. ADMIN-only
  -- grants and implicit superuser powers are the existing trusted-admin
  -- boundary, not runtime membership. Do not exclude any backend by its name.
  IF EXISTS(WITH RECURSIVE inherited_roles(role_oid) AS (
      SELECT oid FROM pg_roles WHERE rolname IN ('ot_v3_jobs_caller','ot_v3_intake_caller','ot_v3_method_reader')
      UNION
      SELECT m.member FROM pg_auth_members m JOIN inherited_roles p ON p.role_oid=m.roleid
        WHERE m.inherit_option
    ), runtime_roles(role_oid) AS (
      SELECT role_oid FROM inherited_roles
      UNION
      SELECT m.member FROM pg_auth_members m JOIN runtime_roles p ON p.role_oid=m.roleid
        WHERE m.set_option
    )
    SELECT 1 FROM pg_stat_activity a JOIN pg_roles r ON r.oid=a.usesysid
    WHERE a.pid<>pg_backend_pid() AND (r.rolname IN ('ot_v3_result_writer','ot_v3_result_reader','ot_v3_result_verifier')
      OR EXISTS(SELECT 1 FROM runtime_roles p WHERE p.role_oid=r.oid))) THEN
    RAISE EXCEPTION 'bg1 controlled quiescence required' USING ERRCODE='P7901';
  END IF;
END $context$;

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

CREATE TEMP TABLE bg1_before(kind text PRIMARY KEY,value jsonb NOT NULL) ON COMMIT DROP;
DO $predecessor$
DECLARE expected record; actual record; current_value jsonb; result_value jsonb:='{}';
BEGIN
  DECLARE f record; g record; owner_oid oid:='postgres'::regrole; public_oid oid:='public'::regnamespace;
  BEGIN
  PERFORM set_config('search_path','pg_catalog,public,extensions',true);
  current_value := pg_catalog.jsonb_build_object(
  'relation',(SELECT pg_catalog.jsonb_build_object(
    'owner',pg_catalog.pg_get_userbyid(c.relowner),'rls',c.relrowsecurity,'force_rls',c.relforcerowsecurity,'kind',c.relkind,
    'acl',(SELECT pg_catalog.jsonb_agg(a::text ORDER BY a::text) FROM pg_catalog.unnest(COALESCE(c.relacl,pg_catalog.acldefault('r',c.relowner))) a))
    FROM pg_catalog.pg_class c WHERE c.oid='public.profiles'::pg_catalog.regclass),
  'columns',COALESCE((SELECT pg_catalog.jsonb_agg(pg_catalog.jsonb_build_object(
    'name',a.attname,'type',pg_catalog.format_type(a.atttypid,a.atttypmod),'number',a.attnum,
    'default',pg_catalog.pg_get_expr(d.adbin,d.adrelid),'raw_acl',a.attacl,
    'identity',a.attidentity,'not_null',a.attnotnull,
    'collation',CASE WHEN a.attcollation=0 THEN NULL ELSE a.attcollation::pg_catalog.regcollation::text END,
    'generated',a.attgenerated) ORDER BY a.attnum)
    FROM pg_catalog.pg_attribute a LEFT JOIN pg_catalog.pg_attrdef d ON d.adrelid=a.attrelid AND d.adnum=a.attnum
    WHERE a.attrelid='public.profiles'::pg_catalog.regclass AND a.attnum>0 AND NOT a.attisdropped),'[]'::jsonb),
  'constraints',COALESCE((SELECT pg_catalog.jsonb_agg(pg_catalog.jsonb_build_object(
    'name',c.conname,'kind',c.contype,'validated',c.convalidated,'definition',pg_catalog.pg_get_constraintdef(c.oid,true)) ORDER BY c.conname)
    FROM pg_catalog.pg_constraint c WHERE c.conrelid='public.profiles'::pg_catalog.regclass),'[]'::jsonb),
  'policies',COALESCE((SELECT pg_catalog.jsonb_agg(pg_catalog.jsonb_build_object(
    'name',p.polname,'roles',(SELECT pg_catalog.jsonb_agg(CASE WHEN r=0 THEN 'PUBLIC' ELSE pg_catalog.pg_get_userbyid(r) END ORDER BY r) FROM pg_catalog.unnest(p.polroles) r),
    'using',pg_catalog.pg_get_expr(p.polqual,p.polrelid),'command',p.polcmd,'permissive',p.polpermissive,
    'with_check',pg_catalog.pg_get_expr(p.polwithcheck,p.polrelid)) ORDER BY p.polname)
    FROM pg_catalog.pg_policy p WHERE p.polrelid='public.profiles'::pg_catalog.regclass),'[]'::jsonb),
  'functions',COALESCE((SELECT pg_catalog.jsonb_agg(pg_catalog.jsonb_build_object(
    'set',p.proretset,'kind',p.prokind,'name',p.proname,'owner',pg_catalog.pg_get_userbyid(p.proowner),
    'config',p.proconfig,'strict',p.proisstrict,
    'raw_acl',(SELECT pg_catalog.jsonb_agg(a::text ORDER BY a::text) FROM pg_catalog.unnest(COALESCE(p.proacl,pg_catalog.acldefault('f',p.proowner))) a),
    'returns',pg_catalog.pg_get_function_result(p.oid),'defaults',p.pronargdefaults,'language',l.lanname,'parallel',p.proparallel,
    'arguments',pg_catalog.pg_get_function_identity_arguments(p.oid),'leakproof',p.proleakproof,'volatility',p.provolatile,
    'body_sha256',pg_catalog.encode(pg_catalog.sha256(pg_catalog.convert_to(p.prosrc,'UTF8')),'hex'),
    'security_definer',p.prosecdef,'definition',pg_catalog.pg_get_functiondef(p.oid)) ORDER BY p.proname,p.oid)
    FROM pg_catalog.pg_proc p JOIN pg_catalog.pg_namespace n ON n.oid=p.pronamespace JOIN pg_catalog.pg_language l ON l.oid=p.prolang
    WHERE n.nspname='public' AND p.proname IN ('aktuelle_rolle','aktuelles_admin_aal2','darf_konten_verwalten',
      'hat_rolle_mindestens','profil_kerndaten_aus_auth','profil_rollenwechsel_pruefen','rollenrang')),'[]'::jsonb),
  'triggers',COALESCE((SELECT pg_catalog.jsonb_agg(pg_catalog.jsonb_build_object(
    'name',t.tgname,'type',t.tgtype,'enabled',t.tgenabled,'attributes',t.tgattr::text,
    'definition',pg_catalog.pg_get_triggerdef(t.oid,true),'function_name',p.proname) ORDER BY t.tgname)
    FROM pg_catalog.pg_trigger t JOIN pg_catalog.pg_proc p ON p.oid=t.tgfoid
    WHERE t.tgrelid='public.profiles'::pg_catalog.regclass AND NOT t.tgisinternal
      AND t.tgname<>'profiles_autoritaet_integritaet_v1'),'[]'::jsonb),
  'incoming_profile_foreign_keys',COALESCE((SELECT pg_catalog.jsonb_agg(pg_catalog.jsonb_build_object(
    'oid',c.oid,'name',c.conname,'relation_schema',n.nspname,'relation',r.relname,
    'validated',c.convalidated,'deferrable',c.condeferrable,'deferred',c.condeferred,
    'definition',pg_catalog.pg_get_constraintdef(c.oid,true)) ORDER BY n.nspname,r.relname,c.conname)
    FROM pg_catalog.pg_constraint c JOIN pg_catalog.pg_class r ON r.oid=c.conrelid JOIN pg_catalog.pg_namespace n ON n.oid=r.relnamespace
    WHERE c.contype='f' AND c.confrelid='public.profiles'::pg_catalog.regclass),'[]'::jsonb)
);
 IF current_value IS DISTINCT FROM '{"relation":{"owner":"postgres","rls":true,"force_rls":false,"kind":"r","acl":["authenticated=arwd/postgres","postgres=arwdDxtm/postgres","service_role=arwdDxtm/postgres"]},"columns":[{"name":"id","type":"uuid","number":1,"default":"uuid_generate_v4()","raw_acl":null,"identity":"","not_null":true,"collation":null,"generated":""},{"name":"user_id","type":"uuid","number":2,"default":null,"raw_acl":null,"identity":"","not_null":true,"collation":null,"generated":""},{"name":"role","type":"text","number":3,"default":"''user''::text","raw_acl":null,"identity":"","not_null":true,"collation":"\"default\"","generated":""},{"name":"created_at","type":"timestamp with time zone","number":4,"default":"timezone(''utc''::text, now())","raw_acl":null,"identity":"","not_null":false,"collation":null,"generated":""},{"name":"avatar_url","type":"text","number":6,"default":null,"raw_acl":null,"identity":"","not_null":false,"collation":"\"default\"","generated":""},{"name":"email","type":"text","number":15,"default":null,"raw_acl":null,"identity":"","not_null":false,"collation":"\"default\"","generated":""},{"name":"status","type":"text","number":16,"default":"''active''::text","raw_acl":null,"identity":"","not_null":true,"collation":"\"default\"","generated":""},{"name":"last_seen_at","type":"timestamp with time zone","number":17,"default":null,"raw_acl":null,"identity":"","not_null":false,"collation":null,"generated":""},{"name":"display_name","type":"text","number":18,"default":null,"raw_acl":null,"identity":"","not_null":false,"collation":"\"default\"","generated":""}],"constraints":[{"kind":"p","name":"profiles_pkey","validated":true,"definition":"PRIMARY KEY (id)"},{"kind":"c","name":"profiles_role_check","validated":true,"definition":"CHECK (rollenrang(role) IS NOT NULL)"},{"kind":"c","name":"profiles_status_check","validated":true,"definition":"CHECK (status = ANY (ARRAY[''active''::text, ''pending''::text, ''disabled''::text, ''banned''::text]))"},{"kind":"f","name":"profiles_user_id_fkey","validated":true,"definition":"FOREIGN KEY (user_id) REFERENCES auth.users(id) ON DELETE CASCADE"},{"kind":"u","name":"profiles_user_id_key","validated":true,"definition":"UNIQUE (user_id)"}],"policies":[{"name":"profiles_aendern","roles":["authenticated"],"using":"((user_id = ( SELECT auth.uid() AS uid)) OR darf_konten_verwalten())","command":"w","permissive":true,"with_check":"((user_id = ( SELECT auth.uid() AS uid)) OR darf_konten_verwalten())"},{"name":"profiles_anlegen","roles":["authenticated"],"using":null,"command":"a","permissive":true,"with_check":"(user_id = ( SELECT auth.uid() AS uid))"},{"name":"profiles_lesen","roles":["authenticated"],"using":"((user_id = ( SELECT auth.uid() AS uid)) OR darf_konten_verwalten())","command":"r","permissive":true,"with_check":null},{"name":"profiles_loeschen","roles":["authenticated"],"using":"((user_id = ( SELECT auth.uid() AS uid)) OR darf_konten_verwalten())","command":"d","permissive":true,"with_check":null}],"functions":[{"set":false,"kind":"f","name":"aktuelle_rolle","owner":"postgres","config":["search_path=public, pg_temp"],"strict":false,"raw_acl":["authenticated=X/postgres","postgres=X/postgres","service_role=X/postgres"],"returns":"text","defaults":0,"language":"sql","parallel":"u","arguments":"","leakproof":false,"volatility":"s","body_sha256":"41b223309c2228d87a0ac273ac31cc9ffcaa7e3ac406059d00818b947b09cbd0","security_definer":true,"definition":"CREATE OR REPLACE FUNCTION public.aktuelle_rolle()\n RETURNS text\n LANGUAGE sql\n STABLE SECURITY DEFINER\n SET search_path TO ''public'', ''pg_temp''\nAS $function$\n  select p.role\n  from public.profiles p\n  where p.user_id = (select auth.uid())\n  limit 1\n$function$\n"},{"set":false,"kind":"f","name":"aktuelles_admin_aal2","owner":"postgres","config":["search_path=pg_catalog"],"strict":false,"raw_acl":["authenticated=X/postgres","postgres=X/postgres","service_role=X/postgres"],"returns":"boolean","defaults":0,"language":"sql","parallel":"s","arguments":"","leakproof":false,"volatility":"s","body_sha256":"d3cf53b48caba5d05eef08d940f1199b7ad58a8a78acefd1e899fda0c502ff1a","security_definer":false,"definition":"CREATE OR REPLACE FUNCTION public.aktuelles_admin_aal2()\n RETURNS boolean\n LANGUAGE sql\n STABLE PARALLEL SAFE\n SET search_path TO ''pg_catalog''\nAS $function$\n  select coalesce((select auth.jwt() ->> ''aal'') = ''aal2'', false)\n$function$\n"},{"set":false,"kind":"f","name":"darf_konten_verwalten","owner":"postgres","config":["search_path=pg_catalog"],"strict":false,"raw_acl":["authenticated=X/postgres","postgres=X/postgres","service_role=X/postgres"],"returns":"boolean","defaults":0,"language":"sql","parallel":"s","arguments":"","leakproof":false,"volatility":"s","body_sha256":"35e41fdae08f4663ffd9f58b3e7912b7faf13661ab0159c67067ad43f43498ab","security_definer":false,"definition":"CREATE OR REPLACE FUNCTION public.darf_konten_verwalten()\n RETURNS boolean\n LANGUAGE sql\n STABLE PARALLEL SAFE\n SET search_path TO ''pg_catalog''\nAS $function$\n  select public.hat_rolle_mindestens(''moderator'')\n     and public.aktuelles_admin_aal2()\n$function$\n"},{"set":false,"kind":"f","name":"hat_rolle_mindestens","owner":"postgres","config":["search_path=public, pg_temp"],"strict":false,"raw_acl":["authenticated=X/postgres","postgres=X/postgres","service_role=X/postgres"],"returns":"boolean","defaults":0,"language":"sql","parallel":"u","arguments":"minimum text","leakproof":false,"volatility":"s","body_sha256":"367f630edefe6788750c6cabe7f5cb1b32d7c01ee4e3246d60632bf5ccd77f10","security_definer":true,"definition":"CREATE OR REPLACE FUNCTION public.hat_rolle_mindestens(minimum text)\n RETURNS boolean\n LANGUAGE sql\n STABLE SECURITY DEFINER\n SET search_path TO ''public'', ''pg_temp''\nAS $function$\n  select coalesce(\n           public.rollenrang(public.aktuelle_rolle()) >= public.rollenrang(minimum),\n           false)\n$function$\n"},{"set":false,"kind":"f","name":"profil_kerndaten_aus_auth","owner":"postgres","config":["search_path=pg_catalog, public"],"strict":false,"raw_acl":["postgres=X/postgres","service_role=X/postgres"],"returns":"trigger","defaults":0,"language":"plpgsql","parallel":"u","arguments":"","leakproof":false,"volatility":"v","body_sha256":"05f4673d2bd0e2236a8b6047c29b2105d787e4f55792d0f1b8251547cc8f8422","security_definer":true,"definition":"CREATE OR REPLACE FUNCTION public.profil_kerndaten_aus_auth()\n RETURNS trigger\n LANGUAGE plpgsql\n SECURITY DEFINER\n SET search_path TO ''pg_catalog'', ''public''\nAS $function$\nbegin\n  update public.profiles p\n  set\n    email = coalesce(u.email, p.email),\n    display_name = coalesce(\n      p.display_name,\n      (u.raw_user_meta_data ->> ''full_name''),\n      (u.raw_user_meta_data ->> ''name''),\n      split_part(u.email, ''@'', 1)\n    )\n  from auth.users u\n  where p.user_id = new.user_id and u.id = new.user_id;\n  return new;\nend\n$function$\n"},{"set":false,"kind":"f","name":"profil_rollenwechsel_pruefen","owner":"postgres","config":["search_path=public, pg_temp"],"strict":false,"raw_acl":["postgres=X/postgres","service_role=X/postgres"],"returns":"trigger","defaults":0,"language":"plpgsql","parallel":"u","arguments":"","leakproof":false,"volatility":"v","body_sha256":"382d8bc00583596ef719b4185d47645baec410f71c2a7ebfb8e1c4df08ba8351","security_definer":true,"definition":"CREATE OR REPLACE FUNCTION public.profil_rollenwechsel_pruefen()\n RETURNS trigger\n LANGUAGE plpgsql\n SECURITY DEFINER\n SET search_path TO ''public'', ''pg_temp''\nAS $function$\ndeclare\n  handelnder uuid := (select auth.uid());\n  rang_handelnder integer;\nbegin\n  if handelnder is null then\n    return new;\n  end if;\n\n  rang_handelnder := public.rollenrang(public.aktuelle_rolle());\n\n  if tg_op = ''INSERT'' then\n    if new.user_id = handelnder then\n      if new.role is distinct from ''user'' then\n        raise exception ''Ein neues eigenes Profil erhält immer die Rolle user.''\n          using errcode = ''check_violation'';\n      end if;\n      if new.status is distinct from ''active'' then\n        raise exception ''Ein neues eigenes Profil erhält immer den Status active.''\n          using errcode = ''check_violation'';\n      end if;\n      return new;\n    end if;\n\n    if rang_handelnder is null or rang_handelnder < public.rollenrang(''moderator'') then\n      raise exception ''Keine Berechtigung, Profile für andere Konten anzulegen.''\n        using errcode = ''insufficient_privilege'';\n    end if;\n    if rang_handelnder < public.rollenrang(''owner'')\n       and rang_handelnder <= coalesce(public.rollenrang(new.role), -1) then\n      raise exception ''Diese Rolle liegt nicht unterhalb der eigenen.''\n        using errcode = ''insufficient_privilege'';\n    end if;\n\n    return new;\n  end if;\n\n  if new.role is distinct from old.role then\n    if old.user_id = handelnder then\n      raise exception ''Die eigene Rolle lässt sich nicht ändern.''\n        using errcode = ''check_violation'';\n    end if;\n    if rang_handelnder is null or rang_handelnder < public.rollenrang(''moderator'') then\n      raise exception ''Keine Berechtigung, Rollen zu vergeben.''\n        using errcode = ''insufficient_privilege'';\n    end if;\n    if rang_handelnder < public.rollenrang(''owner'')\n       and (rang_handelnder <= coalesce(public.rollenrang(old.role), -1)\n            or rang_handelnder <= coalesce(public.rollenrang(new.role), -1)) then\n      raise exception ''Diese Rolle liegt nicht unterhalb der eigenen.''\n        using errcode = ''insufficient_privilege'';\n    end if;\n  end if;\n\n  if new.status is distinct from old.status then\n    if old.user_id = handelnder then\n      raise exception ''Der eigene Kontostatus lässt sich nicht ändern.''\n        using errcode = ''check_violation'';\n    end if;\n    if rang_handelnder is null or rang_handelnder < public.rollenrang(''moderator'') then\n      raise exception ''Keine Berechtigung, den Kontostatus zu ändern.''\n        using errcode = ''insufficient_privilege'';\n    end if;\n  end if;\n\n  return new;\nend\n$function$\n"},{"set":false,"kind":"f","name":"rollenrang","owner":"postgres","config":["search_path=pg_catalog"],"strict":false,"raw_acl":["authenticated=X/postgres","postgres=X/postgres","service_role=X/postgres"],"returns":"integer","defaults":0,"language":"sql","parallel":"s","arguments":"rolle text","leakproof":false,"volatility":"i","body_sha256":"56d5753e4ccb189c2472c02a2737b6662c182381d03bf4de1954d069829fe850","security_definer":false,"definition":"CREATE OR REPLACE FUNCTION public.rollenrang(rolle text)\n RETURNS integer\n LANGUAGE sql\n IMMUTABLE PARALLEL SAFE\n SET search_path TO ''pg_catalog''\nAS $function$\n  select case rolle\n           when ''user''      then 0\n           when ''creator''   then 10\n           when ''moderator'' then 20\n           when ''operator''  then 30\n           when ''admin''     then 40\n           when ''owner''     then 50\n         end\n$function$\n"}],"triggers":[{"name":"profiles_kerndaten_aus_auth","type":5,"enabled":"O","attributes":"","definition":"CREATE TRIGGER profiles_kerndaten_aus_auth AFTER INSERT ON profiles FOR EACH ROW EXECUTE FUNCTION profil_kerndaten_aus_auth()","function_name":"profil_kerndaten_aus_auth"},{"name":"profiles_rollenwechsel","type":23,"enabled":"O","attributes":"","definition":"CREATE TRIGGER profiles_rollenwechsel BEFORE INSERT OR UPDATE ON profiles FOR EACH ROW EXECUTE FUNCTION profil_rollenwechsel_pruefen()","function_name":"profil_rollenwechsel_pruefen"}],"incoming_profile_foreign_keys":[]}'::jsonb THEN RAISE EXCEPTION 'bg1 PAI predecessor mismatch' USING ERRCODE='P7901'; END IF;
  SELECT p.* INTO f FROM pg_catalog.pg_proc p
    WHERE p.pronamespace=public_oid AND p.proname='profil_autoritaet_integritaet_pruefen_v1';
  SELECT t.* INTO g FROM pg_catalog.pg_trigger t
    WHERE t.tgrelid='public.profiles'::pg_catalog.regclass AND t.tgname='profiles_autoritaet_integritaet_v1';
  IF f.oid IS NULL OR g.oid IS NULL
     OR (SELECT count(*) FROM pg_catalog.pg_proc p WHERE p.pronamespace=public_oid AND p.proname=f.proname)<>1
     OR f.proowner<>owner_oid OR f.prokind<>'f' OR f.prosecdef OR f.proisstrict OR f.proretset OR f.proleakproof
     OR f.provolatile<>'v' OR f.proparallel<>'u' OR f.pronargs<>0 OR f.pronargdefaults<>0
     OR f.provariadic<>0::oid OR f.proargtypes::text<>'' OR f.proargdefaults IS NOT NULL
     OR f.procost<>100 OR f.prorows<>0 OR f.protrftypes IS NOT NULL
     OR f.proargnames IS NOT NULL OR f.proargmodes IS NOT NULL OR f.proallargtypes IS NOT NULL
     OR f.prorettype<>'pg_catalog.trigger'::pg_catalog.regtype
     OR f.prolang<>(SELECT oid FROM pg_catalog.pg_language WHERE lanname='plpgsql')
     OR f.proconfig IS DISTINCT FROM ARRAY['search_path=pg_catalog']::text[]
     OR f.probin IS NOT NULL OR f.prosupport<>0::oid OR f.prosqlbody IS NOT NULL
     OR pg_catalog.encode(pg_catalog.sha256(pg_catalog.convert_to(f.prosrc,'UTF8')),'hex')<>'b513eca8cc5d7b3981d9b9eb1473428e628410dcb0f4b718290d4cc314756a8d'
     OR (SELECT pg_catalog.array_agg(a::text ORDER BY a::text) FROM pg_catalog.unnest(COALESCE(f.proacl,pg_catalog.acldefault('f',owner_oid))) a)
        IS DISTINCT FROM ARRAY['postgres=X/postgres']::text[]
     OR EXISTS(SELECT 1 FROM pg_catalog.pg_roles r WHERE r.rolname IN ('anon','authenticated','authenticator','service_role')
        AND pg_catalog.has_function_privilege(r.oid,f.oid,'EXECUTE'))
     OR g.tgfoid<>f.oid OR g.tgtype<>27 OR g.tgenabled<>'O' OR g.tgisinternal
     OR g.tgparentid<>0 OR g.tgconstrrelid<>0 OR g.tgconstrindid<>0 OR g.tgconstraint<>0
     OR g.tgdeferrable OR g.tginitdeferred OR g.tgnargs<>0 OR g.tgattr::text<>''
     OR pg_catalog.octet_length(g.tgargs)<>0 OR g.tgqual IS NOT NULL
     OR g.tgoldtable IS NOT NULL OR g.tgnewtable IS NOT NULL
     OR (SELECT count(*) FROM pg_catalog.pg_trigger t WHERE t.tgfoid=f.oid)<>1 THEN
    RAISE EXCEPTION 'profile integrity final object contract invalid' USING ERRCODE='P7905';
  END IF;
PERFORM set_config('search_path','pg_catalog',true);
  END;
  FOR expected IN SELECT * FROM (VALUES
    ('public.profil_autoritaet_integritaet_pruefen_v1()','b513eca8cc5d7b3981d9b9eb1473428e628410dcb0f4b718290d4cc314756a8d'),
('jetnity_ot_auth.own_active_session_v1()','1bf7498146d4827371087a926327db1348ce2a4cc55693427ee154eb81082354'),
('jetnity_ot_auth.require_current_owner_session_v1()','ba3667edd483f0a0abcf53f70f4dc71906f0ffdbc192ee569232c78dd359635b'),
('official_v3_method_private.tuple_valid_v1(text,integer,text,text)','15741698f4f66adb08e23694b15c6bb9d071b8c01e1123ba7087c4c3d50c6662'),
('official_v3_method_private.timestamp_v1(text)','35e5ada766b2b82bc585d403725c2232ffb4c28b3395d9623797a873413cefb1'),
('official_v3_method_private.command_v1(text,text,text,integer,text,text,integer,integer,text,text,integer,text,text,text)','ef0a7fe89cd5bc2d15a40f8ec01ab1dd2bc2f7d6f64498409e9485761597561b'),
('official_v3_method_private.immutable_v1()','2a4782a3ca5e568a170743800ad36ea5c8c0a6b926c7524acfe9718c74ffe3a4'),
('official_v3_method_api.confirm_operation_v1(text,text,text,integer,text,text,integer,integer,text,text,integer,text,text,text)','232cdcfb8c10161336d2755a83c2a941dd3a582b235515b01f7d6c167579078b'),
('official_v3_method_api.stage_draft_v1(text,text,integer,text,text,integer)','947d017cbc27e70a1df22ecbd19214e295d5162f371e00c8d040076e5a168c90'),
('official_v3_method_api.approve_v1(text,text,integer,text,text,integer,text,text,integer,text,text,text)','df1a49cd377c135460f3e3691303bbe527c4b3fc4e293b486a85ea5b8b1a3f49'),
('official_v3_method_api.revoke_v1(text,text,integer,text,text,integer)','c6296c4a05ee52b32cdcf6145007dc5b8c3fd6867cf155e500b8bc27f738772f'),
('official_v3_method_api.read_current_v1(text,integer,text,text,text)','e5688f6912d6ac5098d3826001386e19e163bf3df16ae3d7503a0ab18bb48de2'),
('official_v3_method_private.require_current_locked_v1(text,integer,text,text,integer)','7e98f2a32a2388efde95d729d425581bf9443e4397eb8311d82e6a46eb88ca8c'),
('official_v3_intake_private.exact_keys_v1(jsonb,text[])','d3d8130512d809af7ec2578b88d30412e3dfec516a158c74f0a6fe1d09d486ba'),
('official_v3_intake_private.safe_data_v1(jsonb,integer)','bce43ae05fa0cff183a1de7afedd8bca5e16f0cfc3e160c9b83fec33d09f0abf'),
('official_v3_intake_private.binding_valid_v1(jsonb)','8f556b9db0b3786f9c247c9432a9e6a8631b66ee92019ac8aa082cf58aa4f7c1'),
('official_v3_intake_private.unique_json_v1(json,integer)','d9c536f2969d815c42b8cd00bbb7145808906519a575aff0dd9361f5070e7609'),
('official_v3_intake_private.proposal_shape_v1()','4ba4184c3733a3849ebf450822f37b46187931f916635c905ca5a3e3704231a9'),
('official_v3_intake_private.data_nodes_v1(jsonb,integer,integer,integer)','ca39c759aa56b45e6974d3fecf953b2bf4d679c2bffbf0783f366f42fd621b85'),
('official_v3_intake_private.shape_matches_v1(jsonb,jsonb,jsonb,jsonb,integer)','760ebdb9782c8709c0ede579e94c30f47a74840683772e11b04a2b3f74fc598a'),
('official_v3_intake_private.proposal_retainable_v1(jsonb)','d30b3540a097ab1832d09bdd67fa922efecaecbfdbae34eb3bfdbdca635cf797'),
('official_v3_intake_private.immutable_v1()','ff1c2db432d3aa48e50b7a043982831be983dc54c6ea16155f4d690a91dcdc86'),
('official_v3_intake_private.record_v1(text)','f34089ca87adef99d16d63de7391c5c200e770928c476304d8324b4beb1844f3'),
('official_v3_intake_api.capture_v1(jsonb,text,text)','5488c6a3d2613b99f58890fcd2aac7205d3f766ce298102a8a655019787fa1b7'),
('official_v3_intake_api.read_v1(jsonb,text,integer)','3c3cbff368a4e196247964d35a350ef1d554d685b2a807573aa4f987bfbe17d4'),
('official_v3_intake_api.reserve_v1(jsonb,text,integer,integer)','82055d6a6f736a116c90a500d294d77953a338731e0a5047f5fd9dac6c8746d7'),
('official_v3_intake_api.finish_v1(jsonb,text,integer,integer,uuid,jsonb,jsonb)','d4fa49784f32d0feccdc7e9beaa6cb1e552fb0117be51e91b40b3b4a8556f262'),
('official_v3_result_private.exact_keys_v1(jsonb,text[])','ee7cf54b133b5ba633b55372c6f98b06058d3fbc4ffe8bda08813fc77865cc33'),
('official_v3_result_private.nodes_v1(jsonb,integer,integer,integer)','d2bf4eb545e4c0453f4511ed6585a7643b440ba58dfc35ff1192feeae72941e3'),
('official_v3_result_private.canonical_v1(jsonb,integer)','ae2e3d355bdd0474941339c110beb90cdf0629cd5693de477985691a26d7f9f6'),
('official_v3_result_private.civil_date_v1(text)','fd5ada592127225a2d995658a74f0ba58bd5b4e7e65301a9d656a07d50eb7ea8'),
('official_v3_result_private.timestamp_v1(text)','d2139f87c826b7eaaa7846b9812a6e056240d79650f365aad2733efb2947613c'),
('official_v3_result_private.predicate_v1(jsonb)','28c043c0fc46032e63286c74bc91945c0ed9eeff1a4a09a99263038f9450b4af'),
('official_v3_result_private.expression_v1(jsonb,boolean,integer)','f68a30dc702d07b13c07142c2208410ac39e077f8ecc2695f392d774e12bdb03'),
('official_v3_result_private.context_v1(jsonb)','2468eee17b3168220355a5e5b73e6e06517d97ddab05922b5c7cf9377d511033'),
('official_v3_result_private.subject_v1(text,jsonb)','33f82eebaf249fb6943b8487c7dd29adfcb0c36be12e185255b3b884e4482548'),
('official_v3_result_private.reference_v1(jsonb)','4e23eb880cfe724da64bdb0f3a395dacbff593e1bf6b20560e623b55cc441974'),
('official_v3_result_private.safe_data_v1(jsonb,integer)','fb0338ad099a3849e03670618b22b09e4e91a0f750c760a1a36a51c4fb929292'),
('official_v3_result_private.unique_json_v1(json,integer)','4ce9ae66bc89ec89dd5f684dcb36b8306e04dd9a2d73dc0576e0d8e70932fa83'),
('official_v3_result_private.proposal_shape_v1()','4ba4184c3733a3849ebf450822f37b46187931f916635c905ca5a3e3704231a9'),
('official_v3_result_private.data_nodes_v1(jsonb,integer,integer,integer)','6aa78c456638b6fb9a291ff7a5ce2593f730027cc8eadf95e6043e2d72f1cf90'),
('official_v3_result_private.shape_matches_v1(jsonb,jsonb,jsonb,jsonb,integer)','4b558e73233251f166c11558d8426f2956433a5dfe079acdd0090d40b3ee2181'),
('official_v3_result_private.proposal_retainable_v1(jsonb)','9264fea3daaddb89d01aea123a1d7fc83aa83cdfe78689281fbda198f46eb4dc'),
('official_v3_result_private.validate_s1_copy_v1(jsonb,jsonb,jsonb,text)','343bee988dd465557620d5211bde7017bdf236569f2705e31edcf840c8822e06'),
('official_v3_result_private.state_fingerprint_v1()','a29d456069d288346a0a2eb69aba0d58f2c22df7f38d81e2ee5c9720796d7b25'),
('official_v3_result_private.immutable_v1()','0862c8153ca0d1d26a1f70580366d1b242da401d91ec036f8734f2838e14839a'),
('official_v3_result_private.hash_v1(jsonb)','6a7d2ac8da921bb8553fcf00d9c5823aad51c9f0d7b965d733f86405f7d812a7'),
('official_v3_result_private.ref_v1(text,jsonb)','a4b35b5651099a7373d08ff29b809a3a6c21a97199c564bfad1d4c8558ad6010'),
('official_v3_result_private.time_text_v1(timestamptz)','f07bb7b06d64d88c0d2f3ad3bed101439bb95eda8147e5616e54252ba598804d'),
('official_v3_result_private.s1_shape_v1(jsonb,text)','841d087a3a3cf4a29b9e698589707d65a82d72431e55944300afef543f32de91'),
('official_v3_result_private.record_shape_v1(jsonb,text)','6d18053b7c43efb8887bffdb14ab0e9a85547dcee9bc331c5783af9ea8793ec2'),
('official_v3_result_private.binding_valid_v1(jsonb)','00ce3331c7c10b824f7ca53b23b4a9ce5eb40b597832a3cc76cc74bbac452079'),
('official_v3_result_private.catalog_v1()','a103c90fb3589a9c8819e5ec4c2eb9fbf8bd7e22a049ebe542b64d8184557a81'),
('official_v3_result_private.assert_catalog_v1()','0126d96e6d154e9875f39ddc53f8f81f5696825e3e94ff677179cac5604950f6'),
('official_v3_result_private.selected_binding_v1()','07c52251c1bf1f38b251ed6cb33d834c7319cd7e7b43e14e44a478695043daad'),
('official_v3_result_private.state_v1()','1f181715fa3cb5a84b9fb6fad2658c92138b8e1ac0bed03de0a5d47b1df1b701'),
('official_v3_result_private.assert_history_v1()','9454a79fdebfce4cb63c60bb404bf6321a9fe7c09b825e9f6ce32e750f225c3a'),
('official_v3_result_private.original_v1(jsonb,jsonb)','357efc28a494fa8e002683e760cff7e7c8c05035914c5f40f5931272e0990e3d'),
('official_v3_result_private.observations_v1(jsonb)','f6be0f59dbcc0795f2afdf85f2bd13f7eae358f8782a3cfd01737890c713613a'),
('official_v3_result_private.verification_v1(jsonb,jsonb,boolean)','c3c1bda8bc1403bdb48423f454d5ea2fa324e6bea84127729b80b31f71c302d4'),
('official_v3_result_private.fence_v1(jsonb,integer,timestamptz,text,jsonb)','0a1813c8c4b290f07e7ac47db92c39880b53241dcd96ae6276c7fd4a31e39963'),
('official_v3_result_private.keep_original_v1(jsonb,jsonb)','43b1eb6dd9d99e45a4b1c3bed80d92b5d3c4390544f6394aaa61acf322be4d14'),
('official_v3_result_private.attest_v1(jsonb,jsonb,integer,timestamptz,text)','47a2a1b76f6c088f656c235f5becdfa6f5d23d0e6b4efea7b27a6b15ae4cac17'),
('official_v3_result_private.consume_s1_v1(jsonb,jsonb,jsonb)','2db23086828983df4a93e79bc74c35d93c7c408c612c49885cac327b3fb96111'),
('official_v3_result_private.keep_decision_v1(jsonb)','91351a13b82f9c45e364126032feeea3d9a515a3e693efb37caf3bb8b0ed9bf5'),
('official_v3_result_private.prepared_v1(jsonb,jsonb,jsonb)','6c476735120c4aa69295f881e083efab1d3069a28507d6f3cb7dcf0ff5121a3a'),
('official_v3_result_private.transition_v1(jsonb,jsonb,integer,timestamptz,text,boolean)','ac7027e6d63e9edc455ee4eec6f7371bddc43cc595b7542df4a1f601c8a1b13d'),
('official_v3_result_private.publication_v1(jsonb,jsonb,integer,timestamptz,text,boolean)','0a7161f416d8184b0e0d657ed417d2bbed5df4d42bfacbbc197430126d335f7a'),
('official_v3_result_private.escalation_v1(jsonb,jsonb,integer,timestamptz,text,boolean)','a2096968e60ddf678ba4970529fe0130b90c2883cca1d3bcfde468e3c422274f'),
('official_v3_result_private.projection_binding_v1(jsonb)','2b4281e9e5160277fdcf081797401b01929c17ac084c9ca92c8b846ab9aaca14'),
('official_v3_result_private.current_projection_v1(jsonb,text)','bb464fa0264d0c26fdd71e61ba586e5dd68cb7a38992497dd270be994d2a21cb'),
('official_v3_result_private.plan_v1(jsonb)','cb6c8195f6347fe381407c9fbc17a13babfe80654a01073666e8e5c7a97f37e9'),
('official_v3_result_private.plan_current_v1(bigint,jsonb,jsonb)','56e2e7134965eb9495d1598e4f1a538af276408d7618a91b11c71c7817be86dd'),
('official_v3_result_private.suppress_v1(jsonb,jsonb,integer,timestamptz,text)','258079e814d0add8de6cd3a7da0bbe106b803863665a0c4c8f12cbd68ec909f5'),
('official_v3_result_private.monitor_claim_v1(jsonb,jsonb,integer,timestamptz,text)','d2f5f8cb1f33d926a463a65f5f49941af2c209c1275da0d4a9f9f8afc30a3971'),
('official_v3_result_private.monitor_finish_v1(jsonb,jsonb,integer,timestamptz,text)','37a5426679629449bec19e1a86c95a1f5689300aa5fdaedcb8457976f14f9e3a'),
('official_v3_result_private.command_v1(jsonb,jsonb)','a1672b93a0d614293ddaa6362db17204e74a025072e08ad6cad3958263bd4ac1'),
('official_v3_result_private.dispatch_v1(text,jsonb,text,text,integer,text,text,integer,integer,text,text)','0c911e7dd3dca1ff93c64f5d374789182c3e35dd93902dd74b6b121d68cbd6e6'),
('official_v3_jobs_private.exact_keys_v1(jsonb,text[])','ee7cf54b133b5ba633b55372c6f98b06058d3fbc4ffe8bda08813fc77865cc33'),
('official_v3_jobs_private.unique_json_v1(json,integer)','e7c99b47e34f4c422da0990f2378cb68289d9ac2c71bcb4ed8d933a20bf3f8ac'),
('official_v3_jobs_private.nodes_v1(jsonb,integer,integer,integer)','e28941594d643413964d19010b7ee9627bfee7bff904f76c28ddc246627ef6a9'),
('official_v3_jobs_private.canonical_v1(jsonb,integer)','f4a258c71cf8115a8ea5697e8b9c1735ebd1bc685170567dec5bc1aee89200ce'),
('official_v3_jobs_private.wire_v1(text)','98eb7a975288f3c9afdebc50131dd367a5f0459b3e0230ce2cd7cb88ea83c655'),
('official_v3_jobs_private.civil_date_v1(text)','fd5ada592127225a2d995658a74f0ba58bd5b4e7e65301a9d656a07d50eb7ea8'),
('official_v3_jobs_private.timestamp_v1(text)','98f15926f68b750a7839b6cae68c412cea716370bfb5d8b53f6fb1e7075ba988'),
('official_v3_jobs_private.predicate_v1(jsonb)','f4d7098f74d7257f49042b7ea56e9c4d64ee64d6a96c2d33adf9c6237b93305f'),
('official_v3_jobs_private.expression_v1(jsonb,boolean,integer)','759d342f9ee7f164f163fe9d55006564f6cffa7b3bb828bfa98257c34483dce0'),
('official_v3_jobs_private.context_v1(jsonb)','ba1a29e05daca9ba4bc539ec98a2428a6beb4ca34072ea670977ff14d869d538'),
('official_v3_jobs_private.subject_v1(text,jsonb)','9164ce950d552a47ddcf396b99432be9bffa12bb8e3e705afd83c32cb34d1225'),
('official_v3_jobs_private.job_v1(jsonb)','a34628ad65ba73caa89308cc819b8d1913d7b7e557bddf3b0a42cfef205cf800'),
('official_v3_jobs_private.command_v1(jsonb)','9e8167d51aa60a679d0b921c54b7524fde7b999620f466ba0dc61d93245aa48b'),
('official_v3_jobs_private.reference_v1(jsonb)','5d04a05d43200433df7361507388b5ee3944765035235490649291d3ade9213a'),
('official_v3_jobs_private.transition_v1(jsonb,jsonb,jsonb)','147cb10e9fd33e73082eaf43746552fa589e89db4b600a1fc927a2339f31b7f0'),
('official_v3_jobs_private.immutable_v1()','526c75203d670c57e7decab38466ab2a1048534bb4a16814f0e05e5c7fb47e27'),
('official_v3_jobs_private.consume_s1_v1(jsonb,jsonb,jsonb,text)','12e6ca30954f82a6628b58dd97db8de6599eb3118c90f34a45a96d4347c9a844'),
('official_v3_jobs_private.assert_history_v1(text)','0c1ab457dd10d4d9e404263c9829778a592e99d69c91d172c000e06a93f6f6d8'),
('official_v3_jobs_private.assert_catalog_v1()','e423881b6afe8543f3486a82c5499e2bf7cde32f0877ea323e843d95a6000250'),
('official_v3_jobs_private.tx_queue_read_v1(jsonb,jsonb,integer,integer,timestamptz)','5aba833e05ecc71fa7daa4f579a6e982eddf8e67bd5306d9ef383c8a73d73b16'),
('official_v3_jobs_private.tx_queue_confirm_v1(jsonb,jsonb,integer,integer,timestamptz)','cc90f242fec962daa71edcf534c5f24eb72541571aadc42ff1d3704efe2ffc75'),
('official_v3_jobs_private.tx_execution_read_v1(jsonb,jsonb,integer,integer,timestamptz)','f098888a682adb92c46b4a7cf1b61d6c0b68030b896f40c5b807da001d84468a'),
('official_v3_jobs_private.tx_execution_start_v1(jsonb,jsonb,integer,integer,timestamptz)','096225b7014b0c9789d93164ecf82c9122e9a2f8d5df93987fbe54425ace2641'),
('official_v3_jobs_private.tx_execution_prepare_v1(jsonb,jsonb,integer,integer,timestamptz)','f40fde8459acf11dccddfae5325e3483896c7a398459120f1bd070a931bf5714'),
('official_v3_jobs_private.tx_queue_cas_v1(jsonb,jsonb,integer,integer,timestamptz)','4f7d372c1b9f4c9d5e9b28f0b03107746329ab219ae94615caf158cc16955008'),
('official_v3_jobs_api.execute_v1(text,text,integer,text,text,integer,integer,text)','ed05f01f4370d3854e4f8c1d38bf9c6cc125733e3e936240bfff69a8d1826ddb')
  ) e(signature,body_hash) LOOP
    SELECT p.* INTO actual FROM pg_proc p WHERE p.oid=to_regprocedure(expected.signature);
    IF NOT FOUND OR encode(sha256(convert_to(actual.prosrc,'UTF8')),'hex') IS DISTINCT FROM expected.body_hash THEN
      RAISE EXCEPTION 'bg1 predecessor definition mismatch' USING ERRCODE='P7901';
    END IF;
  END LOOP;
  INSERT INTO pg_temp.bg1_before VALUES('all',(WITH namespaces AS (
  SELECT oid FROM pg_namespace WHERE nspname IN ('jetnity_ot_auth','official_v3_method_private','official_v3_method_api',
    'official_v3_intake_private','official_v3_intake_api','official_v3_jobs_private','official_v3_jobs_api',
    'official_v3_result_private','official_v3_result_api','official_v3_guard_private')
), procs AS (
  SELECT p.oid FROM pg_proc p JOIN pg_namespace n ON n.oid=p.pronamespace
  WHERE p.pronamespace IN (SELECT oid FROM namespaces)
    OR (n.nspname='auth' AND p.proname IN ('uid','jwt','role'))
    OR (n.nspname='public' AND p.proname IN ('aktuelle_rolle','aktuelles_admin_aal2','hat_rolle_mindestens',
      'profil_kerndaten_aus_auth','profil_rollenwechsel_pruefen','rollenrang','darf_konten_verwalten',
      'profil_autoritaet_integritaet_pruefen_v1','official_v3_method_stage_draft_v1','official_v3_method_approve_v1',
      'official_v3_method_revoke_v1','official_v3_method_confirm_operation_v1','official_v3_guard_review_v1',
      'official_v3_guard_retire_v1','official_v3_guard_resume_v1','official_v3_guard_confirm_v1'))
), tables AS (
  SELECT c.oid,c.reltoastrelid FROM pg_class c JOIN pg_namespace n ON n.oid=c.relnamespace
  WHERE c.relkind IN ('r','p') AND (c.relnamespace IN (SELECT oid FROM namespaces)
    OR n.nspname='public' AND c.relname='profiles' OR n.nspname='auth' AND c.relname IN ('users','sessions'))
), classes AS (
  SELECT oid FROM tables UNION SELECT reltoastrelid FROM tables WHERE reltoastrelid<>0
  UNION SELECT i.indexrelid FROM pg_index i WHERE i.indrelid IN (SELECT oid FROM tables UNION SELECT reltoastrelid FROM tables)
), types AS (
  SELECT t.oid FROM pg_type t WHERE t.typnamespace IN (SELECT oid FROM namespaces)
    OR t.typrelid IN (SELECT oid FROM classes)
), objects AS (
  SELECT 'pg_namespace'::regclass::oid AS classid,oid AS objid FROM namespaces
  UNION SELECT 'pg_proc'::regclass,oid FROM procs
  UNION SELECT 'pg_class'::regclass,oid FROM classes
  UNION SELECT 'pg_type'::regclass,oid FROM types
  UNION SELECT 'pg_constraint'::regclass,c.oid FROM pg_constraint c WHERE c.conrelid IN (SELECT oid FROM tables)
  UNION SELECT 'pg_trigger'::regclass,t.oid FROM pg_trigger t WHERE t.tgrelid IN (SELECT oid FROM tables)
  UNION SELECT 'pg_policy'::regclass,p.oid FROM pg_policy p WHERE p.polrelid IN (SELECT oid FROM tables)
  UNION SELECT 'pg_attrdef'::regclass,a.oid FROM pg_attrdef a WHERE a.adrelid IN (SELECT oid FROM tables)
), protected_roles AS (
  SELECT oid FROM pg_roles WHERE rolname IN ('postgres','anon','authenticated','authenticator','service_role','supabase_auth_admin',
    'supabase_read_only_user','ot_v3_result_owner','ot_v3_result_writer','ot_v3_result_reader','ot_v3_result_verifier',
    'ot_v3_jobs_owner','ot_v3_jobs_caller','ot_v3_intake_owner','ot_v3_intake_caller','ot_v3_method_reader')
  UNION SELECT m.member FROM pg_auth_members m JOIN pg_roles r ON r.oid=m.roleid
    WHERE r.rolname IN ('ot_v3_jobs_caller','ot_v3_intake_caller','ot_v3_method_reader')
), entries(key,value) AS (
  SELECT 'namespace:'||n.oid,to_jsonb(n) FROM pg_namespace n WHERE n.oid IN (SELECT oid FROM namespaces)
  UNION ALL SELECT 'function:'||p.oid,(to_jsonb(p)-ARRAY['prosrc','probin','prosqlbody'])
    ||jsonb_build_object('definition',encode(sha256(convert_to(pg_get_functiondef(p.oid),'UTF8')),'hex'))
    FROM pg_proc p WHERE p.oid IN (SELECT oid FROM procs)
  UNION ALL SELECT 'relation:'||c.oid,to_jsonb(c)-ARRAY['relpages','reltuples','relallvisible','relfrozenxid','relminmxid']
    FROM pg_class c WHERE c.oid IN (SELECT oid FROM classes)
  UNION ALL SELECT 'attribute:'||a.attrelid||':'||a.attnum,to_jsonb(a) FROM pg_attribute a WHERE a.attrelid IN (SELECT oid FROM classes)
  UNION ALL SELECT 'type:'||t.oid,to_jsonb(t) FROM pg_type t WHERE t.oid IN (SELECT oid FROM types)
  UNION ALL SELECT 'constraint:'||c.oid,to_jsonb(c) FROM pg_constraint c WHERE c.conrelid IN (SELECT oid FROM tables)
  UNION ALL SELECT 'trigger:'||t.oid,to_jsonb(t) FROM pg_trigger t WHERE t.tgrelid IN (SELECT oid FROM tables)
  UNION ALL SELECT 'policy:'||p.oid,to_jsonb(p) FROM pg_policy p WHERE p.polrelid IN (SELECT oid FROM tables)
  UNION ALL SELECT 'default:'||a.oid,to_jsonb(a) FROM pg_attrdef a WHERE a.adrelid IN (SELECT oid FROM tables)
  UNION ALL SELECT 'index:'||i.indexrelid,to_jsonb(i) FROM pg_index i WHERE i.indexrelid IN (SELECT oid FROM classes)
  UNION ALL SELECT 'rewrite:'||r.oid,to_jsonb(r) FROM pg_rewrite r WHERE r.ev_class IN (SELECT oid FROM classes)
  UNION ALL SELECT 'inheritance:'||i.inhrelid||':'||i.inhparent,to_jsonb(i) FROM pg_inherits i
    WHERE i.inhrelid IN (SELECT oid FROM classes) OR i.inhparent IN (SELECT oid FROM classes)
  UNION ALL SELECT 'role:'||r.oid,to_jsonb(r)-'rolpassword' FROM pg_roles r WHERE r.oid IN (SELECT oid FROM protected_roles)
  UNION ALL SELECT 'membership:'||m.oid,to_jsonb(m) FROM pg_auth_members m
    WHERE m.roleid IN (SELECT oid FROM protected_roles) OR m.member IN (SELECT oid FROM protected_roles) OR m.grantor IN (SELECT oid FROM protected_roles)
  UNION ALL SELECT 'setting:'||s.setdatabase||':'||s.setrole,to_jsonb(s) FROM pg_db_role_setting s
    WHERE s.setrole IN (SELECT oid FROM protected_roles) OR s.setdatabase=(SELECT oid FROM pg_database WHERE datname=current_database())
  UNION ALL SELECT 'default_acl:'||a.oid,to_jsonb(a) FROM pg_default_acl a
    WHERE a.defaclrole IN (SELECT oid FROM protected_roles) OR a.defaclnamespace IN (SELECT oid FROM namespaces)
  UNION ALL SELECT 'database',to_jsonb(d)-ARRAY['datfrozenxid','datminmxid'] FROM pg_database d WHERE d.datname=current_database()
  UNION ALL SELECT 'dependency:'||d.classid||':'||d.objid||':'||d.objsubid||':'||d.refclassid||':'||d.refobjid||':'||d.refobjsubid||':'||d.deptype::text,to_jsonb(d)
    FROM pg_depend d WHERE (d.classid,d.objid) IN (SELECT classid,objid FROM objects)
      OR (d.refclassid,d.refobjid) IN (SELECT classid,objid FROM objects)
  UNION ALL SELECT 'shared:'||d.dbid||':'||d.classid||':'||d.objid||':'||d.objsubid||':'||d.refclassid||':'||d.refobjid||':'||d.deptype::text,to_jsonb(d)
    FROM pg_shdepend d WHERE (d.dbid=(SELECT oid FROM pg_database WHERE datname=current_database())
      AND (d.classid,d.objid) IN (SELECT classid,objid FROM objects))
      OR (d.refclassid='pg_authid'::regclass AND d.refobjid IN (SELECT oid FROM protected_roles WHERE oid<>'postgres'::regrole))
  UNION ALL SELECT 'description:'||d.classoid||':'||d.objoid||':'||d.objsubid,to_jsonb(d)
    FROM pg_description d WHERE (d.classoid,d.objoid) IN (SELECT classid,objid FROM objects)
  UNION ALL SELECT 'label:'||s.classoid||':'||s.objoid||':'||s.objsubid||':'||s.provider,to_jsonb(s)
    FROM pg_seclabel s WHERE (s.classoid,s.objoid) IN (SELECT classid,objid FROM objects)
)
SELECT jsonb_object_agg(key,value ORDER BY key COLLATE "C") FROM entries));
  INSERT INTO pg_temp.bg1_before VALUES('hrs',(
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
));
  SELECT q.value INTO current_value FROM (SELECT pg_catalog.to_jsonb(pg_catalog.encode(pg_catalog.sha256(pg_catalog.convert_to(q.value::text,'UTF8')),'hex')) AS value FROM (
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
) AS value
) q) q; result_value:=result_value||jsonb_build_object('hrs1-catalog',current_value);
SELECT q.value INTO current_value FROM (SELECT pg_catalog.to_jsonb(pg_catalog.encode(pg_catalog.sha256(pg_catalog.convert_to(q.value::text,'UTF8')),'hex')) AS value FROM (
SELECT pg_catalog.jsonb_agg(pg_catalog.jsonb_build_object(
  'catalog',pg_catalog.to_jsonb(p)-'prosrc'-'prosqlbody'-'probin',
  'definition',pg_catalog.encode(pg_catalog.sha256(pg_catalog.convert_to(pg_catalog.pg_get_functiondef(p.oid),'UTF8')),'hex'))
  ORDER BY p.oid) AS value FROM pg_catalog.pg_proc p JOIN pg_catalog.pg_namespace n ON n.oid=p.pronamespace
  WHERE n.nspname IN ('official_v3_jobs_private','official_v3_jobs_api')
) q) q; result_value:=result_value||jsonb_build_object('jobs-functions',current_value);
SELECT q.value INTO current_value FROM (SELECT pg_catalog.to_jsonb(pg_catalog.encode(pg_catalog.sha256(pg_catalog.convert_to(q.value::text,'UTF8')),'hex')) AS value FROM (
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
) q) q; result_value:=result_value||jsonb_build_object('jobs-relations',current_value);
SELECT q.value INTO current_value FROM (SELECT pg_catalog.to_jsonb(pg_catalog.encode(pg_catalog.sha256(pg_catalog.convert_to(q.value::text,'UTF8')),'hex')) AS value FROM (
SELECT pg_catalog.jsonb_agg(pg_catalog.to_jsonb(t) ORDER BY t.oid) AS value
  FROM pg_catalog.pg_type t JOIN pg_catalog.pg_namespace n ON n.oid=t.typnamespace WHERE n.nspname IN ('official_v3_jobs_private','official_v3_jobs_api')
) q) q; result_value:=result_value||jsonb_build_object('jobs-types',current_value);
SELECT q.value INTO current_value FROM (SELECT pg_catalog.to_jsonb(pg_catalog.encode(pg_catalog.sha256(pg_catalog.convert_to(q.value::text,'UTF8')),'hex')) AS value FROM (
SELECT pg_catalog.jsonb_agg(pg_catalog.to_jsonb(n) ORDER BY n.oid) AS value
  FROM pg_catalog.pg_namespace n WHERE n.nspname IN ('official_v3_jobs_private','official_v3_jobs_api')
) q) q; result_value:=result_value||jsonb_build_object('jobs-schemas',current_value);
SELECT q.value INTO current_value FROM (WITH scope_schemas AS (
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
)::text,'UTF8')),'hex')) AS value) q; result_value:=result_value||jsonb_build_object('jobs-dependencies',current_value);
SELECT q.value INTO current_value FROM (SELECT pg_catalog.to_jsonb(pg_catalog.encode(pg_catalog.sha256(pg_catalog.convert_to(q.value::text,'UTF8')),'hex')) AS value FROM (
SELECT pg_catalog.jsonb_agg(pg_catalog.jsonb_build_object(
  'catalog',pg_catalog.to_jsonb(p)-'prosrc'-'prosqlbody'-'probin',
  'definition',pg_catalog.encode(pg_catalog.sha256(pg_catalog.convert_to(pg_catalog.pg_get_functiondef(p.oid),'UTF8')),'hex'))
  ORDER BY p.oid) AS value FROM pg_catalog.pg_proc p JOIN pg_catalog.pg_namespace n ON n.oid=p.pronamespace
  WHERE n.nspname IN ('jetnity_ot_auth','official_v3_method_private','official_v3_method_api','official_v3_intake_private','official_v3_intake_api')
) q) q; result_value:=result_value||jsonb_build_object('prerequisite-functions',current_value);
SELECT q.value INTO current_value FROM (SELECT pg_catalog.to_jsonb(pg_catalog.encode(pg_catalog.sha256(pg_catalog.convert_to(q.value::text,'UTF8')),'hex')) AS value FROM (
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
) q) q; result_value:=result_value||jsonb_build_object('prerequisite-relations',current_value);
SELECT q.value INTO current_value FROM (SELECT pg_catalog.to_jsonb(pg_catalog.encode(pg_catalog.sha256(pg_catalog.convert_to(q.value::text,'UTF8')),'hex')) AS value FROM (
SELECT pg_catalog.jsonb_agg(pg_catalog.to_jsonb(t) ORDER BY t.oid) AS value
  FROM pg_catalog.pg_type t JOIN pg_catalog.pg_namespace n ON n.oid=t.typnamespace WHERE n.nspname IN ('jetnity_ot_auth','official_v3_method_private','official_v3_method_api','official_v3_intake_private','official_v3_intake_api')
) q) q; result_value:=result_value||jsonb_build_object('prerequisite-types',current_value);
SELECT q.value INTO current_value FROM (SELECT pg_catalog.to_jsonb(pg_catalog.encode(pg_catalog.sha256(pg_catalog.convert_to(q.value::text,'UTF8')),'hex')) AS value FROM (
SELECT pg_catalog.jsonb_agg(pg_catalog.to_jsonb(n) ORDER BY n.oid) AS value
  FROM pg_catalog.pg_namespace n WHERE n.nspname IN ('jetnity_ot_auth','official_v3_method_private','official_v3_method_api','official_v3_intake_private','official_v3_intake_api')
) q) q; result_value:=result_value||jsonb_build_object('prerequisite-schemas',current_value);
SELECT q.value INTO current_value FROM (WITH scope_schemas AS (
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
)::text,'UTF8')),'hex')) AS value) q; result_value:=result_value||jsonb_build_object('prerequisite-dependencies',current_value);
SELECT q.value INTO current_value FROM (SELECT pg_catalog.to_jsonb(pg_catalog.encode(pg_catalog.sha256(pg_catalog.convert_to(q.value::text,'UTF8')),'hex')) AS value FROM (
SELECT pg_catalog.jsonb_agg(pg_catalog.jsonb_build_object('oid',r.oid,'name',r.rolname,
 'super',r.rolsuper,'inherit',r.rolinherit,'login',r.rolcanlogin,'create_role',r.rolcreaterole,
 'create_db',r.rolcreatedb,'replicate',r.rolreplication,'bypass',r.rolbypassrls,'config',r.rolconfig,
 'connection_limit',r.rolconnlimit,'valid_until',r.rolvaliduntil,
 'settings',(SELECT pg_catalog.jsonb_agg(pg_catalog.to_jsonb(s) ORDER BY s.setdatabase,s.setrole)
   FROM pg_catalog.pg_db_role_setting s WHERE s.setrole=r.oid)) ORDER BY r.oid) AS value
 FROM pg_catalog.pg_roles r WHERE r.rolname IN ('postgres','ot_v3_jobs_owner','ot_v3_jobs_caller','ot_v3_intake_owner','ot_v3_intake_caller','ot_v3_method_reader')
) q) q; result_value:=result_value||jsonb_build_object('protected-roles',current_value);
SELECT q.value INTO current_value FROM (SELECT pg_catalog.to_jsonb(pg_catalog.encode(pg_catalog.sha256(pg_catalog.convert_to(q.value::text,'UTF8')),'hex')) AS value FROM (
SELECT pg_catalog.jsonb_agg(pg_catalog.jsonb_build_object('role',m.roleid,'member',m.member,
 'grantor',m.grantor,'admin',m.admin_option,'inherit',m.inherit_option,'set',m.set_option)
 ORDER BY m.roleid,m.member,m.grantor) AS value FROM pg_catalog.pg_auth_members m
 WHERE (m.roleid='postgres'::pg_catalog.regrole OR m.member='postgres'::pg_catalog.regrole)
   AND NOT(m.roleid IN ('ot_v3_jobs_owner'::pg_catalog.regrole,'ot_v3_intake_owner'::pg_catalog.regrole)
     AND m.member='postgres'::pg_catalog.regrole AND m.grantor='postgres'::pg_catalog.regrole
     AND NOT m.admin_option AND NOT m.inherit_option AND m.set_option)
) q) q; result_value:=result_value||jsonb_build_object('creator-edges',current_value);
SELECT q.value INTO current_value FROM (SELECT pg_catalog.jsonb_build_object('installer','postgres'::pg_catalog.regrole::oid,
 'entries',(SELECT pg_catalog.jsonb_agg(pg_catalog.to_jsonb(d) ORDER BY d.defaclrole,d.defaclnamespace,d.defaclobjtype)
 FROM pg_catalog.pg_default_acl d WHERE d.defaclrole IN
   (SELECT r.oid FROM pg_catalog.pg_roles r WHERE r.rolname IN ('postgres','ot_v3_jobs_owner','ot_v3_jobs_caller','ot_v3_intake_owner','ot_v3_intake_caller','ot_v3_method_reader'))
 OR d.defaclnamespace IN (SELECT n.oid FROM pg_catalog.pg_namespace n WHERE n.nspname IN ('official_v3_jobs_private','official_v3_jobs_api','jetnity_ot_auth','official_v3_method_private','official_v3_method_api','official_v3_intake_private','official_v3_intake_api')))) AS value) q; result_value:=result_value||jsonb_build_object('creator-defaults',current_value);
SELECT q.value INTO current_value FROM (SELECT pg_catalog.to_jsonb(pg_catalog.encode(pg_catalog.sha256(pg_catalog.convert_to(q.value::text,'UTF8')),'hex')) AS value FROM (
SELECT pg_catalog.jsonb_build_object('oid',d.oid,'name',d.datname,'owner',d.datdba,'acl',d.datacl,
 'encoding',d.encoding,'allow_connections',d.datallowconn,'connection_limit',d.datconnlimit,
 'settings',(SELECT pg_catalog.jsonb_agg(pg_catalog.to_jsonb(s) ORDER BY s.setrole)
   FROM pg_catalog.pg_db_role_setting s WHERE s.setdatabase=d.oid AND s.setrole=0)) AS value
 FROM pg_catalog.pg_database d WHERE d.datname=current_database()
) q) q; result_value:=result_value||jsonb_build_object('database',current_value);
  INSERT INTO pg_temp.bg1_before VALUES('jobs',result_value);
END $predecessor$;

-- Temporary existing-owner SET edges are narrowly scoped to this transaction.
-- Their absence was part of the frozen predecessor graph; all are removed before
-- final catalog comparison. No bootstrap ADMIN edge is changed.
GRANT ot_v3_result_owner TO postgres WITH ADMIN FALSE, INHERIT FALSE, SET TRUE GRANTED BY postgres;
GRANT ot_v3_jobs_owner TO postgres WITH ADMIN FALSE, INHERIT FALSE, SET TRUE GRANTED BY postgres;
GRANT ot_v3_intake_owner TO postgres WITH ADMIN FALSE, INHERIT FALSE, SET TRUE GRANTED BY postgres;
DO $locked_predecessor$
DECLARE stored jsonb; expected jsonb;
BEGIN
  SELECT value INTO expected FROM pg_temp.bg1_before WHERE kind='hrs';
  EXECUTE 'SET LOCAL ROLE ot_v3_result_owner';
  LOCK TABLE official_v3_result_private.archive_pages_v1,official_v3_result_private.binding_v1,
    official_v3_result_private.decisions_v1,official_v3_result_private.extractions_v1,
    official_v3_result_private.heads_v1,official_v3_result_private.monitor_schedule_v1,
    official_v3_result_private.operations_v1,official_v3_result_private.originals_v1,
    official_v3_result_private.outbox_v1,official_v3_result_private.projections_v1,
    official_v3_result_private.qualifications_v1,official_v3_result_private.versions_v1 IN ACCESS EXCLUSIVE MODE;
  SELECT catalog INTO STRICT stored FROM official_v3_result_private.binding_v1 WHERE singleton;
  IF stored IS DISTINCT FROM expected THEN RAISE EXCEPTION 'bg1 original HRS catalog refusal' USING ERRCODE='P7901'; END IF;
  PERFORM official_v3_result_private.assert_history_v1();
  IF (SELECT state_certificate FROM official_v3_result_private.binding_v1 WHERE singleton)
    IS DISTINCT FROM official_v3_result_private.state_fingerprint_v1() THEN
    RAISE EXCEPTION 'bg1 original HRS content refusal' USING ERRCODE='P7901';
  END IF;
  stored:=to_jsonb(official_v3_result_private.state_fingerprint_v1());
  EXECUTE 'RESET ROLE';
  INSERT INTO pg_temp.bg1_before VALUES('hrs-content',stored);
  SELECT value INTO expected FROM pg_temp.bg1_before WHERE kind='jobs';
  EXECUTE 'SET LOCAL ROLE ot_v3_jobs_owner';
  LOCK TABLE official_v3_jobs_private.subjects_v1,official_v3_jobs_private.queue_operations_v1,
    official_v3_jobs_private.execution_starts_v1,official_v3_jobs_private.execution_results_v1,
    official_v3_jobs_private.execution_dispositions_v1,official_v3_jobs_private.slots_v1,
    official_v3_jobs_private.catalog_binding_v1 IN ACCESS EXCLUSIVE MODE;
  SELECT jsonb_object_agg(object_identity,fingerprint) INTO stored FROM official_v3_jobs_private.catalog_binding_v1;
  IF stored-'package-context' IS DISTINCT FROM expected THEN RAISE EXCEPTION 'bg1 original HM04 catalog refusal' USING ERRCODE='P7901'; END IF;
  EXECUTE 'RESET ROLE';
  UPDATE pg_temp.bg1_before SET value=stored WHERE kind='jobs';
  EXECUTE 'SET LOCAL ROLE ot_v3_jobs_owner';
  SELECT to_jsonb(d) INTO stored FROM (
WITH rows AS (SELECT 'official_v3_jobs_private.subjects_v1' AS table_name,(r.job_key)::text AS primary_key,('')::text AS secondary_key,to_jsonb(r) AS value FROM official_v3_jobs_private.subjects_v1 r
UNION ALL SELECT 'official_v3_jobs_private.queue_operations_v1' AS table_name,(r.operation_id)::text AS primary_key,('')::text AS secondary_key,to_jsonb(r) AS value FROM official_v3_jobs_private.queue_operations_v1 r
UNION ALL SELECT 'official_v3_jobs_private.execution_starts_v1' AS table_name,(r.attempt_key)::text AS primary_key,('')::text AS secondary_key,to_jsonb(r) AS value FROM official_v3_jobs_private.execution_starts_v1 r
UNION ALL SELECT 'official_v3_jobs_private.execution_results_v1' AS table_name,(r.attempt_key)::text AS primary_key,('')::text AS secondary_key,to_jsonb(r) AS value FROM official_v3_jobs_private.execution_results_v1 r
UNION ALL SELECT 'official_v3_jobs_private.execution_dispositions_v1' AS table_name,(r.attempt_key)::text AS primary_key,('')::text AS secondary_key,to_jsonb(r) AS value FROM official_v3_jobs_private.execution_dispositions_v1 r
UNION ALL SELECT 'official_v3_jobs_private.slots_v1' AS table_name,(r.slot_id)::text AS primary_key,('')::text AS secondary_key,to_jsonb(r) AS value FROM official_v3_jobs_private.slots_v1 r
UNION ALL SELECT 'official_v3_jobs_private.catalog_binding_v1' AS table_name,(r.object_identity)::text AS primary_key,('')::text AS secondary_key,to_jsonb(r) AS value FROM official_v3_jobs_private.catalog_binding_v1 r), hashes AS (
SELECT table_name,primary_key,secondary_key,encode(sha256(convert_to(value::text,'UTF8')),'hex') AS digest FROM rows
), groups AS (
SELECT expected.name,count(h.primary_key) AS n,COALESCE(string_agg(h.digest,'' ORDER BY h.primary_key COLLATE "C",h.secondary_key COLLATE "C"),'') AS content
FROM (VALUES ('official_v3_jobs_private.subjects_v1'),('official_v3_jobs_private.queue_operations_v1'),('official_v3_jobs_private.execution_starts_v1'),('official_v3_jobs_private.execution_results_v1'),('official_v3_jobs_private.execution_dispositions_v1'),('official_v3_jobs_private.slots_v1'),('official_v3_jobs_private.catalog_binding_v1')) expected(name)
LEFT JOIN hashes h ON h.table_name=expected.name GROUP BY expected.name
)
SELECT encode(sha256(convert_to('bg1-content:jobs:v1:'||string_agg(name||':'||n::text||':'||encode(sha256(convert_to(content,'UTF8')),'hex'),'|' ORDER BY name COLLATE "C"),'UTF8')),'hex') FROM groups
) hash_value(d);
  EXECUTE 'RESET ROLE';
  INSERT INTO pg_temp.bg1_before VALUES('jobs-content',stored);
  EXECUTE 'SET LOCAL ROLE ot_v3_intake_owner';
  LOCK TABLE official_v3_intake_private.operations_v1,official_v3_intake_private.reservations_v1,
    official_v3_intake_private.completions_v1 IN ACCESS EXCLUSIVE MODE;
  SELECT to_jsonb(d) INTO stored FROM (
WITH rows AS (SELECT 'official_v3_intake_private.operations_v1' AS table_name,(r.operation_id)::text AS primary_key,('')::text AS secondary_key,to_jsonb(r) AS value FROM official_v3_intake_private.operations_v1 r
UNION ALL SELECT 'official_v3_intake_private.reservations_v1' AS table_name,(r.operation_id)::text AS primary_key,(r.generation)::text AS secondary_key,to_jsonb(r) AS value FROM official_v3_intake_private.reservations_v1 r
UNION ALL SELECT 'official_v3_intake_private.completions_v1' AS table_name,(r.operation_id)::text AS primary_key,('')::text AS secondary_key,to_jsonb(r) AS value FROM official_v3_intake_private.completions_v1 r), hashes AS (
SELECT table_name,primary_key,secondary_key,encode(sha256(convert_to(value::text,'UTF8')),'hex') AS digest FROM rows
), groups AS (
SELECT expected.name,count(h.primary_key) AS n,COALESCE(string_agg(h.digest,'' ORDER BY h.primary_key COLLATE "C",h.secondary_key COLLATE "C"),'') AS content
FROM (VALUES ('official_v3_intake_private.operations_v1'),('official_v3_intake_private.reservations_v1'),('official_v3_intake_private.completions_v1')) expected(name)
LEFT JOIN hashes h ON h.table_name=expected.name GROUP BY expected.name
)
SELECT encode(sha256(convert_to('bg1-content:s1:v1:'||string_agg(name||':'||n::text||':'||encode(sha256(convert_to(content,'UTF8')),'hex'),'|' ORDER BY name COLLATE "C"),'UTF8')),'hex') FROM groups
) hash_value(d);
  EXECUTE 'RESET ROLE';
  INSERT INTO pg_temp.bg1_before VALUES('s1-content',stored);
  LOCK TABLE official_v3_method_private.revisions_v1,official_v3_method_private.operations_v1,
    official_v3_method_private.heads_v1 IN ACCESS EXCLUSIVE MODE;
  LOCK TABLE public.profiles,auth.users,auth.sessions IN ACCESS SHARE MODE;
  SELECT to_jsonb(d) INTO stored FROM (
WITH rows AS (SELECT 'official_v3_method_private.revisions_v1' AS table_name,(r.method_id)::text AS primary_key,(r.revision)::text AS secondary_key,to_jsonb(r) AS value FROM official_v3_method_private.revisions_v1 r
UNION ALL SELECT 'official_v3_method_private.heads_v1' AS table_name,(r.method_id)::text AS primary_key,('')::text AS secondary_key,to_jsonb(r) AS value FROM official_v3_method_private.heads_v1 r
UNION ALL SELECT 'official_v3_method_private.operations_v1' AS table_name,(r.operation_id)::text AS primary_key,('')::text AS secondary_key,to_jsonb(r) AS value FROM official_v3_method_private.operations_v1 r), hashes AS (
SELECT table_name,primary_key,secondary_key,encode(sha256(convert_to(value::text,'UTF8')),'hex') AS digest FROM rows
), groups AS (
SELECT expected.name,count(h.primary_key) AS n,COALESCE(string_agg(h.digest,'' ORDER BY h.primary_key COLLATE "C",h.secondary_key COLLATE "C"),'') AS content
FROM (VALUES ('official_v3_method_private.revisions_v1'),('official_v3_method_private.heads_v1'),('official_v3_method_private.operations_v1')) expected(name)
LEFT JOIN hashes h ON h.table_name=expected.name GROUP BY expected.name
)
SELECT encode(sha256(convert_to('bg1-content:hma:v1:'||string_agg(name||':'||n::text||':'||encode(sha256(convert_to(content,'UTF8')),'hex'),'|' ORDER BY name COLLATE "C"),'UTF8')),'hex') FROM groups
) hash_value(d);
  INSERT INTO pg_temp.bg1_before VALUES('hma-content',stored);
END $locked_predecessor$;

-- BG1: private state. No runtime login receives table privileges.
CREATE SCHEMA official_v3_guard_private AUTHORIZATION postgres;
REVOKE ALL ON SCHEMA official_v3_guard_private FROM PUBLIC;
CREATE TABLE official_v3_guard_private.baselines_v1 (
  component text PRIMARY KEY CHECK (component IN ('hrs','jobs','all')),
  predecessor_digest text NOT NULL CHECK (predecessor_digest ~ '^[a-f0-9]{64}$'),
  catalog jsonb NOT NULL,
  installed_at timestamptz NOT NULL DEFAULT clock_timestamp()
);
CREATE TABLE official_v3_guard_private.certificates_v1 (
  component text PRIMARY KEY CHECK (component IN ('hma','s1','jobs')),
  generation bigint NOT NULL CHECK (generation > 0),
  digest text NOT NULL CHECK (digest ~ '^[a-f0-9]{64}$')
);
CREATE TABLE official_v3_guard_private.certificate_history_v1 (
  component text NOT NULL CHECK (component IN ('hma','s1','jobs')),
  generation bigint NOT NULL CHECK (generation > 0),
  before_digest text,
  after_digest text NOT NULL CHECK (after_digest ~ '^[a-f0-9]{64}$'),
  predecessor_hash text,
  recorded_at timestamptz NOT NULL,
  entry_hash text NOT NULL UNIQUE CHECK (entry_hash ~ '^[a-f0-9]{64}$'),
  PRIMARY KEY(component,generation),
  CHECK ((generation=1 AND before_digest IS NULL AND predecessor_hash IS NULL)
    OR (generation>1 AND before_digest ~ '^[a-f0-9]{64}$' AND predecessor_hash ~ '^[a-f0-9]{64}$'))
);
CREATE TABLE official_v3_guard_private.state_v1 (
  singleton boolean PRIMARY KEY DEFAULT true CHECK (singleton),
  installed_at timestamptz NOT NULL,
  generation bigint NOT NULL DEFAULT 0 CHECK (generation >= 0),
  last_due timestamptz,
  last_started timestamptz,
  last_proof_started timestamptz,
  last_finished timestamptz,
  valid_until timestamptz,
  incident_generation bigint NOT NULL DEFAULT 0 CHECK (incident_generation >= 0),
  incident_at timestamptz,
  resumed_generation bigint NOT NULL DEFAULT 0 CHECK (resumed_generation >= 0),
  last_observed timestamptz NOT NULL,
  CHECK (resumed_generation <= incident_generation),
  CHECK ((incident_generation = 0) = (incident_at IS NULL)),
  CHECK ((generation = 0 AND last_due IS NULL AND last_started IS NULL AND last_proof_started IS NULL AND last_finished IS NULL AND valid_until IS NULL)
    OR (generation > 0 AND last_due IS NOT NULL AND last_started IS NOT NULL AND last_proof_started IS NOT NULL AND last_finished IS NOT NULL AND valid_until IS NOT NULL
      AND isfinite(last_due) AND isfinite(last_started) AND isfinite(last_proof_started) AND isfinite(last_finished)
      AND last_due <= last_started AND last_started <= last_proof_started AND last_proof_started <= last_finished
      AND last_finished <= last_started + interval '30 seconds'
      AND valid_until = last_due + interval '5 minutes 30 seconds'))
);
CREATE TABLE official_v3_guard_private.runs_v1 (
  due_at timestamptz PRIMARY KEY,
  started_at timestamptz NOT NULL,
  proof_started_at timestamptz NOT NULL,
  finished_at timestamptz NOT NULL,
  outcome text NOT NULL CHECK (outcome IN ('complete','refused','expired','clock','gap')),
  generation bigint NOT NULL CHECK (generation >= 0),
  incident_generation bigint NOT NULL CHECK (incident_generation >= 0)
);
CREATE TABLE official_v3_guard_private.incidents_v1 (
  generation bigint PRIMARY KEY CHECK (generation>0),
  due_at timestamptz NOT NULL,
  reason text NOT NULL CHECK (reason IN ('refused','expired','clock','gap')),
  baseline_generation bigint NOT NULL CHECK (baseline_generation>=0),
  detected_at timestamptz NOT NULL,
  UNIQUE(due_at,reason,baseline_generation)
);
CREATE TABLE official_v3_guard_private.owner_operations_v1 (
  operation_id text PRIMARY KEY CHECK (operation_id ~ '^op3_[a-f0-9]{32}$'),
  action text NOT NULL CHECK (action IN ('retire_unknown','resume')),
  expected_digest text NOT NULL CHECK (expected_digest ~ '^[a-f0-9]{64}$'),
  actor_id uuid NOT NULL,
  recorded_at timestamptz NOT NULL,
  receipt jsonb NOT NULL CHECK (octet_length(receipt::text) <= 8192)
);
CREATE TABLE official_v3_guard_private.retired_attempts_v1 (
  attempt_key text PRIMARY KEY CHECK (attempt_key ~ '^execution-attempt:v3:[a-f0-9]{64}$'),
  job_key text NOT NULL UNIQUE,
  claim_operation_id text NOT NULL UNIQUE,
  intake_operation_id text NOT NULL UNIQUE,
  owner_operation_id text NOT NULL UNIQUE REFERENCES official_v3_guard_private.owner_operations_v1(operation_id),
  before_state jsonb NOT NULL CHECK (octet_length(before_state::text) <= 131072),
  retired_at timestamptz NOT NULL
);

CREATE FUNCTION official_v3_guard_private.immutable_v1() RETURNS trigger
LANGUAGE plpgsql SECURITY INVOKER SET search_path=pg_catalog AS $$
BEGIN RAISE EXCEPTION 'bg1 immutable evidence' USING ERRCODE='P7901'; END $$;

DO $tables$
DECLARE name text;
BEGIN
  FOREACH name IN ARRAY ARRAY['baselines_v1','certificates_v1','certificate_history_v1','state_v1','runs_v1','incidents_v1','owner_operations_v1','retired_attempts_v1'] LOOP
    EXECUTE format('ALTER TABLE official_v3_guard_private.%I ENABLE ROW LEVEL SECURITY',name);
    EXECUTE format('ALTER TABLE official_v3_guard_private.%I FORCE ROW LEVEL SECURITY',name);
    EXECUTE format('CREATE POLICY owner_only ON official_v3_guard_private.%I TO postgres USING (true) WITH CHECK (true)',name);
    EXECUTE format('REVOKE ALL ON TABLE official_v3_guard_private.%I FROM PUBLIC,anon,authenticated,service_role,supabase_read_only_user',name);
  END LOOP;
  FOREACH name IN ARRAY ARRAY['baselines_v1','certificate_history_v1','runs_v1','incidents_v1','owner_operations_v1','retired_attempts_v1'] LOOP
    EXECUTE format('CREATE TRIGGER immutable_v1 BEFORE UPDATE OR DELETE ON official_v3_guard_private.%I FOR EACH ROW EXECUTE FUNCTION official_v3_guard_private.immutable_v1()',name);
  END LOOP;
END $tables$;
INSERT INTO official_v3_guard_private.state_v1(singleton,installed_at,last_observed)
VALUES(true,clock_timestamp(),clock_timestamp());

CREATE FUNCTION official_v3_guard_private.require_open_v1() RETURNS bigint
LANGUAGE plpgsql VOLATILE SECURITY DEFINER SET search_path=pg_catalog AS $$
DECLARE s official_v3_guard_private.state_v1%ROWTYPE; instant timestamptz;
BEGIN
  SELECT * INTO s FROM official_v3_guard_private.state_v1 WHERE singleton FOR SHARE;
  instant:=clock_timestamp();
  IF NOT FOUND OR s.generation=0 OR s.incident_generation<>s.resumed_generation
    OR instant<s.last_observed OR instant<s.last_finished OR instant>=s.valid_until
    OR s.last_finished>s.last_started+interval '30 seconds'
    OR s.valid_until<>s.last_due+interval '5 minutes 30 seconds' THEN
    RAISE EXCEPTION 'bg1 integrity unavailable' USING ERRCODE='P7902';
  END IF;
  RETURN s.incident_generation;
END $$;

CREATE FUNCTION official_v3_guard_private.check_control_v1() RETURNS void
LANGUAGE plpgsql VOLATILE SECURITY DEFINER SET search_path=pg_catalog AS $$
DECLARE s official_v3_guard_private.state_v1%ROWTYPE; r record; g bigint:=0; previous_time timestamptz;
BEGIN
  SELECT * INTO STRICT s FROM official_v3_guard_private.state_v1 WHERE singleton;
  IF NOT isfinite(s.installed_at) OR NOT isfinite(s.last_observed) OR s.last_observed<s.installed_at THEN
    RAISE EXCEPTION 'bg1 control time' USING ERRCODE='P7905'; END IF;
  FOR r IN SELECT * FROM official_v3_guard_private.incidents_v1 ORDER BY generation LOOP
    g:=g+1;
    IF r.generation<>g OR r.baseline_generation>s.generation OR NOT isfinite(r.detected_at)
      OR r.detected_at<previous_time OR r.due_at<>date_bin(interval '5 minutes',r.due_at,timestamptz '2000-01-01 00:00:00+00') THEN
      RAISE EXCEPTION 'bg1 incident history' USING ERRCODE='P7905'; END IF;
    previous_time:=r.detected_at;
  END LOOP;
  IF g<>s.incident_generation OR previous_time IS DISTINCT FROM s.incident_at THEN
    RAISE EXCEPTION 'bg1 incident head' USING ERRCODE='P7905'; END IF;
  g:=0; previous_time:=NULL;
  FOR r IN SELECT * FROM official_v3_guard_private.runs_v1 WHERE outcome='complete' ORDER BY generation LOOP
    g:=g+1;
    IF r.generation<>g OR r.incident_generation>s.incident_generation
      OR r.due_at<>date_bin(interval '5 minutes',r.started_at,timestamptz '2000-01-01 00:00:00+00')
      OR NOT isfinite(r.finished_at) OR r.started_at>r.proof_started_at OR r.proof_started_at>r.finished_at
      OR r.finished_at>r.started_at+interval '30 seconds' OR r.started_at<previous_time THEN
      RAISE EXCEPTION 'bg1 full-proof history' USING ERRCODE='P7905'; END IF;
    previous_time:=r.finished_at;
  END LOOP;
  IF g<>s.generation OR (g>0 AND NOT EXISTS(SELECT 1 FROM official_v3_guard_private.runs_v1 proof
    WHERE proof.outcome='complete' AND proof.generation=s.generation AND proof.due_at=s.last_due
      AND proof.started_at=s.last_started AND proof.proof_started_at=s.last_proof_started AND proof.finished_at=s.last_finished))
    OR (s.resumed_generation>0 AND NOT EXISTS(SELECT 1 FROM official_v3_guard_private.owner_operations_v1 op
      WHERE op.action='resume' AND (op.receipt->>'generation')::bigint=s.resumed_generation)) THEN
    RAISE EXCEPTION 'bg1 proof or resume head' USING ERRCODE='P7905'; END IF;
END $$;

CREATE FUNCTION official_v3_guard_private.hrs_catalog_v1() RETURNS jsonb
LANGUAGE sql STABLE SECURITY DEFINER SET search_path=pg_catalog AS $$
SELECT catalog FROM official_v3_guard_private.baselines_v1 WHERE component='hrs'
$$;
CREATE FUNCTION official_v3_guard_private.open_until_v1() RETURNS timestamptz
LANGUAGE plpgsql VOLATILE SECURITY DEFINER SET search_path=pg_catalog AS $$
BEGIN
  PERFORM official_v3_guard_private.require_open_v1();
  RETURN (SELECT valid_until FROM official_v3_guard_private.state_v1 WHERE singleton);
END $$;
CREATE FUNCTION official_v3_guard_private.jobs_catalog_v1()
RETURNS TABLE(object_identity text,fingerprint jsonb)
LANGUAGE sql STABLE SECURITY DEFINER SET search_path=pg_catalog AS $$
SELECT key,value FROM official_v3_guard_private.baselines_v1 b,
LATERAL jsonb_each(b.catalog) WHERE b.component='jobs'
$$;

CREATE FUNCTION official_v3_guard_private.intake_retired_v1(operation_value text) RETURNS boolean
LANGUAGE sql STABLE SECURITY DEFINER SET search_path=pg_catalog AS $$
SELECT EXISTS(SELECT 1 FROM official_v3_guard_private.retired_attempts_v1 WHERE intake_operation_id=operation_value)
$$;
CREATE FUNCTION official_v3_guard_private.attempt_retired_v1(attempt_value text) RETURNS boolean
LANGUAGE sql STABLE SECURITY DEFINER SET search_path=pg_catalog AS $$
SELECT EXISTS(SELECT 1 FROM official_v3_guard_private.retired_attempts_v1 WHERE attempt_key=attempt_value)
$$;

-- This deliberately contains no actor, operation, source or runtime identifiers.
CREATE FUNCTION official_v3_guard_private.alarm_status_v1() RETURNS jsonb
LANGUAGE plpgsql VOLATILE SECURITY DEFINER SET search_path=pg_catalog AS $$
DECLARE s official_v3_guard_private.state_v1%ROWTYPE; instant timestamptz:=clock_timestamp();
BEGIN
  SELECT * INTO s FROM official_v3_guard_private.state_v1 WHERE singleton;
  IF NOT FOUND THEN RETURN jsonb_build_object('schema',1,'status','unavailable'); END IF;
  RETURN jsonb_build_object('schema',1,'status',CASE
    WHEN instant<s.last_observed OR instant<s.last_finished THEN 'clock'
    WHEN s.incident_generation<>s.resumed_generation THEN 'incident'
    WHEN s.generation=0 THEN 'unchecked'
    WHEN instant>=s.valid_until THEN 'stale' ELSE 'current' END);
END $$;

-- The same finite catalog query is used before any upgrade DDL and afterwards.
-- Physical counters changed by VACUUM/ANALYZE are excluded; authority, complete
-- definitions, ACLs, RLS, columns, constraints and both dependency directions are
-- retained. No auth/profile row or credential is read by this query.
CREATE FUNCTION official_v3_guard_private.catalog_v1() RETURNS jsonb
LANGUAGE sql STABLE SECURITY DEFINER SET search_path=pg_catalog SET jit=off AS $catalog$
WITH namespaces AS (
  SELECT oid FROM pg_namespace WHERE nspname IN ('jetnity_ot_auth','official_v3_method_private','official_v3_method_api',
    'official_v3_intake_private','official_v3_intake_api','official_v3_jobs_private','official_v3_jobs_api',
    'official_v3_result_private','official_v3_result_api','official_v3_guard_private')
), procs AS (
  SELECT p.oid FROM pg_proc p JOIN pg_namespace n ON n.oid=p.pronamespace
  WHERE p.pronamespace IN (SELECT oid FROM namespaces)
    OR (n.nspname='auth' AND p.proname IN ('uid','jwt','role'))
    OR (n.nspname='public' AND p.proname IN ('aktuelle_rolle','aktuelles_admin_aal2','hat_rolle_mindestens',
      'profil_kerndaten_aus_auth','profil_rollenwechsel_pruefen','rollenrang','darf_konten_verwalten',
      'profil_autoritaet_integritaet_pruefen_v1','official_v3_method_stage_draft_v1','official_v3_method_approve_v1',
      'official_v3_method_revoke_v1','official_v3_method_confirm_operation_v1','official_v3_guard_review_v1',
      'official_v3_guard_retire_v1','official_v3_guard_resume_v1','official_v3_guard_confirm_v1'))
), tables AS (
  SELECT c.oid,c.reltoastrelid FROM pg_class c JOIN pg_namespace n ON n.oid=c.relnamespace
  WHERE c.relkind IN ('r','p') AND (c.relnamespace IN (SELECT oid FROM namespaces)
    OR n.nspname='public' AND c.relname='profiles' OR n.nspname='auth' AND c.relname IN ('users','sessions'))
), classes AS (
  SELECT oid FROM tables UNION SELECT reltoastrelid FROM tables WHERE reltoastrelid<>0
  UNION SELECT i.indexrelid FROM pg_index i WHERE i.indrelid IN (SELECT oid FROM tables UNION SELECT reltoastrelid FROM tables)
), types AS (
  SELECT t.oid FROM pg_type t WHERE t.typnamespace IN (SELECT oid FROM namespaces)
    OR t.typrelid IN (SELECT oid FROM classes)
), objects AS (
  SELECT 'pg_namespace'::regclass::oid AS classid,oid AS objid FROM namespaces
  UNION SELECT 'pg_proc'::regclass,oid FROM procs
  UNION SELECT 'pg_class'::regclass,oid FROM classes
  UNION SELECT 'pg_type'::regclass,oid FROM types
  UNION SELECT 'pg_constraint'::regclass,c.oid FROM pg_constraint c WHERE c.conrelid IN (SELECT oid FROM tables)
  UNION SELECT 'pg_trigger'::regclass,t.oid FROM pg_trigger t WHERE t.tgrelid IN (SELECT oid FROM tables)
  UNION SELECT 'pg_policy'::regclass,p.oid FROM pg_policy p WHERE p.polrelid IN (SELECT oid FROM tables)
  UNION SELECT 'pg_attrdef'::regclass,a.oid FROM pg_attrdef a WHERE a.adrelid IN (SELECT oid FROM tables)
), protected_roles AS (
  SELECT oid FROM pg_roles WHERE rolname IN ('postgres','anon','authenticated','authenticator','service_role','supabase_auth_admin',
    'supabase_read_only_user','ot_v3_result_owner','ot_v3_result_writer','ot_v3_result_reader','ot_v3_result_verifier',
    'ot_v3_jobs_owner','ot_v3_jobs_caller','ot_v3_intake_owner','ot_v3_intake_caller','ot_v3_method_reader')
  UNION SELECT m.member FROM pg_auth_members m JOIN pg_roles r ON r.oid=m.roleid
    WHERE r.rolname IN ('ot_v3_jobs_caller','ot_v3_intake_caller','ot_v3_method_reader')
), entries(key,value) AS (
  SELECT 'namespace:'||n.oid,to_jsonb(n) FROM pg_namespace n WHERE n.oid IN (SELECT oid FROM namespaces)
  UNION ALL SELECT 'function:'||p.oid,(to_jsonb(p)-ARRAY['prosrc','probin','prosqlbody'])
    ||jsonb_build_object('definition',encode(sha256(convert_to(pg_get_functiondef(p.oid),'UTF8')),'hex'))
    FROM pg_proc p WHERE p.oid IN (SELECT oid FROM procs)
  UNION ALL SELECT 'relation:'||c.oid,to_jsonb(c)-ARRAY['relpages','reltuples','relallvisible','relfrozenxid','relminmxid']
    FROM pg_class c WHERE c.oid IN (SELECT oid FROM classes)
  UNION ALL SELECT 'attribute:'||a.attrelid||':'||a.attnum,to_jsonb(a) FROM pg_attribute a WHERE a.attrelid IN (SELECT oid FROM classes)
  UNION ALL SELECT 'type:'||t.oid,to_jsonb(t) FROM pg_type t WHERE t.oid IN (SELECT oid FROM types)
  UNION ALL SELECT 'constraint:'||c.oid,to_jsonb(c) FROM pg_constraint c WHERE c.conrelid IN (SELECT oid FROM tables)
  UNION ALL SELECT 'trigger:'||t.oid,to_jsonb(t) FROM pg_trigger t WHERE t.tgrelid IN (SELECT oid FROM tables)
  UNION ALL SELECT 'policy:'||p.oid,to_jsonb(p) FROM pg_policy p WHERE p.polrelid IN (SELECT oid FROM tables)
  UNION ALL SELECT 'default:'||a.oid,to_jsonb(a) FROM pg_attrdef a WHERE a.adrelid IN (SELECT oid FROM tables)
  UNION ALL SELECT 'index:'||i.indexrelid,to_jsonb(i) FROM pg_index i WHERE i.indexrelid IN (SELECT oid FROM classes)
  UNION ALL SELECT 'rewrite:'||r.oid,to_jsonb(r) FROM pg_rewrite r WHERE r.ev_class IN (SELECT oid FROM classes)
  UNION ALL SELECT 'inheritance:'||i.inhrelid||':'||i.inhparent,to_jsonb(i) FROM pg_inherits i
    WHERE i.inhrelid IN (SELECT oid FROM classes) OR i.inhparent IN (SELECT oid FROM classes)
  UNION ALL SELECT 'role:'||r.oid,to_jsonb(r)-'rolpassword' FROM pg_roles r WHERE r.oid IN (SELECT oid FROM protected_roles)
  UNION ALL SELECT 'membership:'||m.oid,to_jsonb(m) FROM pg_auth_members m
    WHERE m.roleid IN (SELECT oid FROM protected_roles) OR m.member IN (SELECT oid FROM protected_roles) OR m.grantor IN (SELECT oid FROM protected_roles)
  UNION ALL SELECT 'setting:'||s.setdatabase||':'||s.setrole,to_jsonb(s) FROM pg_db_role_setting s
    WHERE s.setrole IN (SELECT oid FROM protected_roles) OR s.setdatabase=(SELECT oid FROM pg_database WHERE datname=current_database())
  UNION ALL SELECT 'default_acl:'||a.oid,to_jsonb(a) FROM pg_default_acl a
    WHERE a.defaclrole IN (SELECT oid FROM protected_roles) OR a.defaclnamespace IN (SELECT oid FROM namespaces)
  UNION ALL SELECT 'database',to_jsonb(d)-ARRAY['datfrozenxid','datminmxid'] FROM pg_database d WHERE d.datname=current_database()
  UNION ALL SELECT 'dependency:'||d.classid||':'||d.objid||':'||d.objsubid||':'||d.refclassid||':'||d.refobjid||':'||d.refobjsubid||':'||d.deptype::text,to_jsonb(d)
    FROM pg_depend d WHERE (d.classid,d.objid) IN (SELECT classid,objid FROM objects)
      OR (d.refclassid,d.refobjid) IN (SELECT classid,objid FROM objects)
  UNION ALL SELECT 'shared:'||d.dbid||':'||d.classid||':'||d.objid||':'||d.objsubid||':'||d.refclassid||':'||d.refobjid||':'||d.deptype::text,to_jsonb(d)
    FROM pg_shdepend d WHERE (d.dbid=(SELECT oid FROM pg_database WHERE datname=current_database())
      AND (d.classid,d.objid) IN (SELECT classid,objid FROM objects))
      OR (d.refclassid='pg_authid'::regclass AND d.refobjid IN (SELECT oid FROM protected_roles WHERE oid<>'postgres'::regrole))
  UNION ALL SELECT 'description:'||d.classoid||':'||d.objoid||':'||d.objsubid,to_jsonb(d)
    FROM pg_description d WHERE (d.classoid,d.objoid) IN (SELECT classid,objid FROM objects)
  UNION ALL SELECT 'label:'||s.classoid||':'||s.objoid||':'||s.objsubid||':'||s.provider,to_jsonb(s)
    FROM pg_seclabel s WHERE (s.classoid,s.objoid) IN (SELECT classid,objid FROM objects)
)
SELECT jsonb_object_agg(key,value ORDER BY key COLLATE "C") FROM entries
$catalog$;

CREATE FUNCTION official_v3_guard_private.assert_catalog_v1() RETURNS void
LANGUAGE plpgsql VOLATILE SECURITY DEFINER SET search_path=pg_catalog AS $$
DECLARE expected jsonb;
BEGIN
  SELECT catalog INTO STRICT expected FROM official_v3_guard_private.baselines_v1 WHERE component='all';
  IF expected IS DISTINCT FROM official_v3_guard_private.catalog_v1() THEN
    RAISE EXCEPTION 'bg1 protected catalog changed' USING ERRCODE='P7905';
  END IF;
END $$;

CREATE FUNCTION official_v3_guard_private.check_hma_v1() RETURNS void
LANGUAGE plpgsql VOLATILE SECURITY DEFINER SET search_path=pg_catalog SET timezone='UTC' SET datestyle='ISO, YMD' AS $$
DECLARE o record; r record; m text; previous jsonb; expected jsonb; after_value jsonb;
  epoch_value integer; head_value jsonb; last_operation text; last_actor uuid; last_at timestamptz;
BEGIN
  LOCK TABLE official_v3_method_private.revisions_v1,official_v3_method_private.heads_v1,
    official_v3_method_private.operations_v1 IN SHARE MODE;
  FOR r IN SELECT * FROM official_v3_method_private.revisions_v1 LOOP
    IF official_v3_method_private.tuple_valid_v1(r.method_id,r.revision,r.method_digest,r.package_digest) IS NOT TRUE
      OR (r.revision=1 AND r.predecessor_revision IS NOT NULL)
      OR (r.revision>1 AND (r.predecessor_revision IS DISTINCT FROM r.revision-1 OR NOT EXISTS(
        SELECT 1 FROM official_v3_method_private.revisions_v1 p WHERE p.method_id=r.method_id AND p.revision=r.predecessor_revision)))
      OR NOT EXISTS(SELECT 1 FROM official_v3_method_private.operations_v1 s WHERE s.action='stage'
        AND s.method_id=r.method_id AND s.revision=r.revision AND s.actor_id=r.staged_by AND s.recorded_at=r.staged_at
        AND s.command->>'methodDigest'=r.method_digest AND s.command->>'packageDigest'=r.package_digest) THEN
      RAISE EXCEPTION 'bg1 method revision history' USING ERRCODE='P7905';
    END IF;
  END LOOP;
  FOR o IN SELECT * FROM official_v3_method_private.operations_v1 LOOP
    IF o.command IS DISTINCT FROM official_v3_method_private.command_v1(o.operation_id,o.action,o.method_id,o.revision,
      o.command->>'methodDigest',o.command->>'packageDigest',(o.command->>'predecessorRevision')::integer,
      (o.command#>>'{expected,revision}')::integer,o.command#>>'{expected,methodDigest}',o.command#>>'{expected,packageDigest}',
      (o.command#>>'{expected,epoch}')::integer,o.command#>>'{expected,status}',o.command#>>'{approval,mode}',o.command#>>'{approval,until}')
      OR NOT EXISTS(SELECT 1 FROM official_v3_method_private.revisions_v1 rev_row WHERE rev_row.method_id=o.method_id
        AND rev_row.revision=o.revision AND rev_row.method_digest=o.command->>'methodDigest' AND rev_row.package_digest=o.command->>'packageDigest')
      OR NOT isfinite(o.recorded_at) THEN RAISE EXCEPTION 'bg1 method command history' USING ERRCODE='P7905'; END IF;
    IF o.action='stage' AND (o.before_state IS DISTINCT FROM o.after_state OR
      (o.before_state IS NOT NULL AND NOT EXISTS(SELECT 1 FROM official_v3_method_private.operations_v1 prior
        WHERE prior.method_id=o.method_id AND prior.action IN ('approve','revoke') AND prior.after_state=o.before_state
          AND prior.recorded_at<=o.recorded_at))
      OR EXISTS(SELECT 1 FROM official_v3_method_private.operations_v1 newer WHERE newer.method_id=o.method_id
        AND newer.action IN ('approve','revoke') AND newer.recorded_at<o.recorded_at
        AND (o.before_state IS NULL OR (newer.after_state->>'epoch')::integer>(o.before_state->>'epoch')::integer))) THEN
      RAISE EXCEPTION 'bg1 method stage snapshot' USING ERRCODE='P7905';
    END IF;
  END LOOP;
  FOR m IN SELECT method_id FROM official_v3_method_private.revisions_v1
    UNION SELECT method_id FROM official_v3_method_private.heads_v1
    UNION SELECT method_id FROM official_v3_method_private.operations_v1 LOOP
    previous:=NULL; epoch_value:=0; last_operation:=NULL;
    FOR o IN SELECT * FROM official_v3_method_private.operations_v1 WHERE method_id=m AND action IN ('approve','revoke')
      ORDER BY (after_state->>'epoch')::integer LOOP
      epoch_value:=epoch_value+1;
      expected:=jsonb_build_object('revision',previous->'revision','methodDigest',previous->'methodDigest',
        'packageDigest',previous->'packageDigest','epoch',epoch_value-1,'status',previous->'status');
      IF o.before_state IS DISTINCT FROM previous OR o.command->'expected' IS DISTINCT FROM expected
        OR (o.after_state->>'epoch')::integer IS DISTINCT FROM epoch_value
        OR (epoch_value=1 AND (o.action<>'approve' OR o.revision<>1))
        OR (o.action='approve' AND previous IS NOT NULL AND o.revision::bigint NOT IN ((previous->>'revision')::bigint,(previous->>'revision')::bigint+1))
        OR (o.action='approve' AND o.command#>>'{approval,mode}'='until'
          AND official_v3_method_private.timestamp_v1(o.command#>>'{approval,until}')<=o.recorded_at)
        OR (o.action='revoke' AND (previous->>'status' IS DISTINCT FROM 'approved'
          OR o.revision IS DISTINCT FROM (previous->>'revision')::integer
          OR o.command->'methodDigest' IS DISTINCT FROM previous->'methodDigest'
          OR o.command->'packageDigest' IS DISTINCT FROM previous->'packageDigest')) THEN
        RAISE EXCEPTION 'bg1 method epoch chain' USING ERRCODE='P7905';
      END IF;
      after_value:=jsonb_build_object('methodId',m,'revision',o.revision,'methodDigest',o.command->'methodDigest',
        'packageDigest',o.command->'packageDigest','epoch',epoch_value,'status',CASE o.action WHEN 'approve' THEN 'approved' ELSE 'revoked' END,
        'approvalMode',CASE WHEN o.action='approve' THEN o.command#>'{approval,mode}' ELSE 'null'::jsonb END,
        'approvalUntil',CASE WHEN o.action='approve' THEN o.command#>'{approval,until}' ELSE 'null'::jsonb END);
      IF o.after_state IS DISTINCT FROM after_value THEN RAISE EXCEPTION 'bg1 method after state' USING ERRCODE='P7905'; END IF;
      previous:=after_value; last_operation:=o.operation_id; last_actor:=o.actor_id; last_at:=o.recorded_at;
    END LOOP;
    SELECT jsonb_build_object('methodId',h.method_id,'revision',h.revision,'methodDigest',h.method_digest,
      'packageDigest',h.package_digest,'epoch',h.epoch,'status',h.status,'approvalMode',h.approval_mode,
      'approvalUntil',to_char(h.approval_until AT TIME ZONE 'UTC','YYYY-MM-DD"T"HH24:MI:SS.MS"Z"')) INTO head_value
      FROM official_v3_method_private.heads_v1 h WHERE h.method_id=m;
    IF head_value IS DISTINCT FROM previous OR (previous IS NOT NULL AND NOT EXISTS(
      SELECT 1 FROM official_v3_method_private.heads_v1 h WHERE h.method_id=m AND h.operation_id=last_operation
        AND h.changed_by=last_actor AND h.changed_at=last_at)) THEN
      RAISE EXCEPTION 'bg1 method current head' USING ERRCODE='P7905';
    END IF;
  END LOOP;
END $$;

CREATE FUNCTION official_v3_guard_private.check_s1_v1() RETURNS void
LANGUAGE plpgsql VOLATILE SECURITY DEFINER SET search_path=pg_catalog SET timezone='UTC' SET datestyle='ISO, YMD' AS $$
DECLARE o record; r record; c record; generation_value integer; last_expiry timestamptz; last_token uuid; last_acquired timestamptz;
  text_value text; proposal jsonb;
BEGIN
  LOCK TABLE official_v3_intake_private.operations_v1,official_v3_intake_private.reservations_v1,
    official_v3_intake_private.completions_v1 IN SHARE MODE;
  FOR o IN SELECT * FROM official_v3_intake_private.operations_v1 LOOP
    text_value:=convert_from(o.original_bytes,'UTF8'); proposal:=text_value::jsonb;
    IF official_v3_guard_private.original_valid_v1(o.binding,text_value,o.proposal_digest) IS NOT TRUE
      OR NOT isfinite(o.created_at)
      OR o.operation_id IS DISTINCT FROM o.binding->>'operationId'
      OR octet_length(o.original_bytes) NOT BETWEEN 1 AND 65536 OR o.proposal_digest IS DISTINCT FROM encode(sha256(o.original_bytes),'hex')
      OR official_v3_intake_private.unique_json_v1(text_value::json,0) IS NOT TRUE
      OR official_v3_intake_private.proposal_retainable_v1(proposal) IS NOT TRUE
      OR proposal->>'operationId' IS DISTINCT FROM o.operation_id OR proposal->'jobId' IS DISTINCT FROM o.binding->'jobId'
      OR proposal->'contextKey' IS DISTINCT FROM o.binding->'contextKey' THEN
      RAISE EXCEPTION 'bg1 intake original history' USING ERRCODE='P7905';
    END IF;
    generation_value:=0; last_expiry:=NULL; last_token:=NULL; last_acquired:=NULL;
    FOR r IN SELECT * FROM official_v3_intake_private.reservations_v1 WHERE operation_id=o.operation_id ORDER BY generation LOOP
      generation_value:=generation_value+1;
      IF r.generation<>generation_value OR NOT isfinite(r.acquired_at) OR NOT isfinite(r.expires_at)
        OR r.expires_at<=r.acquired_at OR r.expires_at>r.acquired_at+interval '900 seconds'
        OR r.acquired_at<last_expiry OR r.lease_token IS NOT DISTINCT FROM last_token THEN
        RAISE EXCEPTION 'bg1 intake reservation chain' USING ERRCODE='P7905';
      END IF;
      last_expiry:=r.expires_at; last_token:=r.lease_token; last_acquired:=r.acquired_at;
    END LOOP;
    IF o.generation<>generation_value OR o.lease_token IS DISTINCT FROM last_token
      OR o.acquired_at IS DISTINCT FROM last_acquired OR o.expires_at IS DISTINCT FROM last_expiry THEN
      RAISE EXCEPTION 'bg1 intake reservation head' USING ERRCODE='P7905';
    END IF;
    SELECT * INTO c FROM official_v3_intake_private.completions_v1 WHERE operation_id=o.operation_id;
    IF FOUND AND (c.generation<>generation_value OR c.lease_token IS DISTINCT FROM last_token
      OR c.completed_at>=last_expiry OR NOT isfinite(c.completed_at)
      OR official_v3_guard_private.completion_valid_v1(o.binding,o.proposal_digest,octet_length(o.original_bytes),
        c.generation,c.lease_token,c.outcome,c.audit) IS NOT TRUE
      OR c.escalation_key IS DISTINCT FROM CASE WHEN c.outcome->>'status'='escalation' THEN c.outcome->>'key' END
      OR (c.audit->>'recordedAt')::timestamptz>c.completed_at) THEN
      RAISE EXCEPTION 'bg1 intake completion history' USING ERRCODE='P7905';
    END IF;
  END LOOP;
  IF EXISTS(SELECT 1 FROM official_v3_intake_private.reservations_v1 res_row LEFT JOIN official_v3_intake_private.operations_v1 op_row USING(operation_id) WHERE op_row.operation_id IS NULL)
    OR EXISTS(SELECT 1 FROM official_v3_intake_private.completions_v1 completion_row LEFT JOIN official_v3_intake_private.operations_v1 op_row USING(operation_id) WHERE op_row.operation_id IS NULL) THEN
    RAISE EXCEPTION 'bg1 intake orphan history' USING ERRCODE='P7905';
  END IF;
END $$;

CREATE FUNCTION official_v3_guard_private.check_method_link_v1(authority_value jsonb,at_value timestamptz) RETURNS void
LANGUAGE plpgsql VOLATILE SECURITY DEFINER SET search_path=pg_catalog AS $$
BEGIN
  IF jsonb_typeof(authority_value) IS DISTINCT FROM 'object'
    OR (authority_value ?& ARRAY['methodId','revision','methodDigest','packageDigest','epoch']) IS NOT TRUE
    OR EXISTS(SELECT 1 FROM jsonb_object_keys(authority_value) key WHERE key<>ALL(ARRAY['methodId','revision','methodDigest','packageDigest','epoch']))
    OR NOT isfinite(at_value) OR NOT EXISTS(SELECT 1 FROM official_v3_method_private.operations_v1 o
      WHERE o.method_id=authority_value->>'methodId' AND o.action='approve'
        AND (o.after_state-'status'-'approvalMode'-'approvalUntil')=authority_value AND o.recorded_at<=at_value
        AND (o.after_state->>'approvalMode'='until_revoked' OR (o.after_state->>'approvalUntil')::timestamptz>at_value)
        AND NOT EXISTS(SELECT 1 FROM official_v3_method_private.operations_v1 newer WHERE newer.method_id=o.method_id
          AND newer.action IN ('approve','revoke') AND (newer.after_state->>'epoch')::bigint>(authority_value->>'epoch')::bigint
          AND newer.recorded_at<at_value)) THEN
    RAISE EXCEPTION 'bg1 historical method link' USING ERRCODE='P7905'; END IF;
END $$;

CREATE FUNCTION official_v3_guard_private.check_jobs_v1() RETURNS void
LANGUAGE plpgsql VOLATILE SECURITY DEFINER SET search_path=pg_catalog AS $$
DECLARE k text; x record; ref jsonb; opened jsonb; subject_row record;
  prior jsonb; envelope jsonb; next_revision bigint; head_count bigint;
BEGIN
  LOCK TABLE official_v3_jobs_private.subjects_v1,official_v3_jobs_private.queue_operations_v1,
    official_v3_jobs_private.execution_starts_v1,official_v3_jobs_private.execution_results_v1,
    official_v3_jobs_private.execution_dispositions_v1,official_v3_jobs_private.slots_v1 IN SHARE MODE;
  FOR k IN SELECT job_key FROM official_v3_jobs_private.subjects_v1 ORDER BY job_key COLLATE "C" LOOP
    PERFORM official_v3_jobs_private.assert_history_v1(k);
    SELECT * INTO STRICT subject_row FROM official_v3_jobs_private.subjects_v1 WHERE job_key=k;
    prior:='null'::jsonb; next_revision:=1; head_count:=0;
    -- The predecessor validates each transition separately. BG1 additionally
    -- reconstructs the one complete journal chain and its exact retained head.
    -- Deduplicated enqueues do not advance revisions and are checked below.
    FOR x IN SELECT * FROM official_v3_jobs_private.queue_operations_v1 WHERE job_key=k
      AND envelope_text::jsonb->'expected' IS DISTINCT FROM envelope_text::jsonb->'next'
      ORDER BY (envelope_text::jsonb#>>'{next,revision}')::bigint LOOP
      envelope:=x.envelope_text::jsonb;
      IF envelope->'expected' IS DISTINCT FROM prior OR (envelope#>>'{next,revision}')::bigint<>next_revision
        OR NOT isfinite(x.recorded_at)
        OR (x.authority-'epoch') IS DISTINCT FROM subject_row.method_binding THEN
        RAISE EXCEPTION 'bg1 complete jobs chain' USING ERRCODE='P7905'; END IF;
      prior:=envelope->'next'; next_revision:=next_revision+1; head_count:=head_count+1;
    END LOOP;
    IF head_count=0 OR subject_row.current_job IS DISTINCT FROM prior THEN
      RAISE EXCEPTION 'bg1 exact jobs journal head' USING ERRCODE='P7905'; END IF;
    FOR x IN SELECT * FROM official_v3_jobs_private.queue_operations_v1 WHERE job_key=k
      AND envelope_text::jsonb->'expected' IS NOT DISTINCT FROM envelope_text::jsonb->'next' LOOP
      envelope:=x.envelope_text::jsonb;
      IF x.action<>'enqueue' OR envelope#>>'{audit,kind}' IS DISTINCT FROM 'deduplicated'
        OR NOT isfinite(x.recorded_at)
        OR (x.authority-'epoch') IS DISTINCT FROM subject_row.method_binding
        OR NOT EXISTS(SELECT 1 FROM official_v3_jobs_private.queue_operations_v1 q WHERE q.job_key=k
          AND q.envelope_text::jsonb->'expected' IS DISTINCT FROM q.envelope_text::jsonb->'next'
          AND q.envelope_text::jsonb->'next'=envelope->'expected') THEN
        RAISE EXCEPTION 'bg1 deduplicated jobs chain' USING ERRCODE='P7905'; END IF;
    END LOOP;
    -- A same-revision dedup attaches to its exact immutable chain node. Client
    -- observedAt values are not a global serialization clock; do not order
    -- otherwise valid concurrent historical requests by their observation time.
  END LOOP;
  FOR x IN SELECT authority,recorded_at AS checked_at FROM official_v3_jobs_private.queue_operations_v1
    UNION ALL SELECT authority,reserved_at FROM official_v3_jobs_private.execution_starts_v1 LOOP
    PERFORM official_v3_guard_private.check_method_link_v1(x.authority,x.checked_at);
  END LOOP;
  FOR x IN SELECT t.*,r.result,r."references" FROM official_v3_jobs_private.execution_starts_v1 t
    JOIN official_v3_jobs_private.execution_results_v1 r USING(attempt_key) LOOP
    FOR ref IN SELECT value FROM jsonb_array_elements(x."references") LOOP
      PERFORM official_v3_jobs_private.reference_v1(ref);
      opened:=official_v3_jobs_private.s1_read_v1(ref->'binding',ref->>'proposalDigest',(ref->>'bytes')::integer);
      IF opened#>'{record,reference}' IS DISTINCT FROM ref THEN RAISE EXCEPTION 'bg1 jobs intake reference' USING ERRCODE='P7905'; END IF;
      PERFORM official_v3_jobs_private.consume_s1_v1(opened,x.leased_job,x.result,'read');
    END LOOP;
  END LOOP;
END $$;

CREATE FUNCTION official_v3_guard_private.hrs_certificate_v1() RETURNS text
LANGUAGE sql STABLE SECURITY DEFINER SET search_path=pg_catalog AS $$
SELECT state_certificate FROM official_v3_result_private.binding_v1 WHERE singleton
$$;

CREATE FUNCTION official_v3_guard_private.check_hrs_v1() RETURNS void
LANGUAGE plpgsql VOLATILE SECURITY DEFINER SET search_path=pg_catalog AS $$
DECLARE q record; b jsonb:=official_v3_result_private.selected_binding_v1();
BEGIN
  LOCK TABLE official_v3_result_private.archive_pages_v1,official_v3_result_private.binding_v1,
    official_v3_result_private.decisions_v1,official_v3_result_private.extractions_v1,
    official_v3_result_private.heads_v1,official_v3_result_private.monitor_schedule_v1,
    official_v3_result_private.operations_v1,official_v3_result_private.originals_v1,
    official_v3_result_private.outbox_v1,official_v3_result_private.projections_v1,
    official_v3_result_private.qualifications_v1,official_v3_result_private.versions_v1 IN SHARE MODE;
  PERFORM official_v3_result_private.assert_history_v1();
  IF EXISTS(SELECT 1 FROM official_v3_result_private.originals_v1 o WHERE o.raw_digest IS DISTINCT FROM encode(sha256(convert_to(o.body_text,'UTF8')),'hex'))
    OR (SELECT state_certificate FROM official_v3_result_private.binding_v1 WHERE singleton)
      IS DISTINCT FROM official_v3_result_private.state_fingerprint_v1() THEN
    RAISE EXCEPTION 'bg1 result content certificate' USING ERRCODE='P7905';
  END IF;
  FOR q IN SELECT * FROM official_v3_result_private.qualifications_v1 WHERE kind='verification' LOOP
    PERFORM official_v3_result_private.verification_v1(q.record,b,false);
  END LOOP;
END $$;

CREATE FUNCTION official_v3_guard_private.content_digest_v1(component_value text) RETURNS text
LANGUAGE plpgsql STABLE SECURITY DEFINER SET search_path=pg_catalog AS $$
BEGIN
  CASE component_value
    WHEN 'hma' THEN RETURN official_v3_guard_private.fingerprint_hma_v1();
    WHEN 's1' THEN RETURN official_v3_guard_private.fingerprint_s1_v1();
    WHEN 'jobs' THEN RETURN official_v3_guard_private.fingerprint_jobs_v1();
    ELSE RAISE EXCEPTION 'bg1 component refused' USING ERRCODE='P7901';
  END CASE;
END $$;

CREATE FUNCTION official_v3_guard_private.check_certificate_v1(component_value text) RETURNS void
LANGUAGE plpgsql VOLATILE SECURITY DEFINER SET search_path=pg_catalog SET timezone='UTC' SET datestyle='ISO, YMD' AS $$
DECLARE c official_v3_guard_private.certificates_v1%ROWTYPE; entry record; previous_hash text; previous_digest text; generation_value bigint:=0;
BEGIN
  SELECT * INTO STRICT c FROM official_v3_guard_private.certificates_v1 WHERE component=component_value;
  FOR entry IN SELECT * FROM official_v3_guard_private.certificate_history_v1 WHERE component=component_value ORDER BY generation LOOP
    generation_value:=generation_value+1;
    IF entry.generation<>generation_value OR entry.before_digest IS DISTINCT FROM previous_digest
      OR entry.predecessor_hash IS DISTINCT FROM previous_hash OR NOT isfinite(entry.recorded_at)
      OR entry.entry_hash IS DISTINCT FROM encode(sha256(convert_to('bg1-certificate:v1:'||(to_jsonb(entry)-'entry_hash')::text,'UTF8')),'hex') THEN
      RAISE EXCEPTION 'bg1 certificate chain' USING ERRCODE='P7905';
    END IF;
    previous_hash:=entry.entry_hash; previous_digest:=entry.after_digest;
  END LOOP;
  IF generation_value=0 OR generation_value<>c.generation OR c.digest IS DISTINCT FROM previous_digest
    OR c.digest IS DISTINCT FROM official_v3_guard_private.content_digest_v1(component_value) THEN
    RAISE EXCEPTION 'bg1 unchanged certified content required' USING ERRCODE='P7905';
  END IF;
END $$;

CREATE FUNCTION official_v3_guard_private.check_certificates_v1() RETURNS void
LANGUAGE plpgsql VOLATILE SECURITY DEFINER SET search_path=pg_catalog AS $$
BEGIN
  IF (SELECT count(*) FROM official_v3_guard_private.certificates_v1)<>3 THEN
    RAISE EXCEPTION 'bg1 certificate set' USING ERRCODE='P7905';
  END IF;
  PERFORM official_v3_guard_private.check_certificate_v1('hma');
  PERFORM official_v3_guard_private.check_certificate_v1('s1');
  PERFORM official_v3_guard_private.check_certificate_v1('jobs');
END $$;

-- Only fixed internal entry wrappers have EXECUTE on these helpers. Runtime
-- caller roles have neither EXECUTE nor table privileges. No caller supplies a
-- digest, clock, replacement certificate, component selection or bypass flag.
CREATE FUNCTION official_v3_guard_private.begin_component_v1(component_value text) RETURNS void
LANGUAGE plpgsql VOLATILE SECURITY DEFINER SET search_path=pg_catalog AS $$
BEGIN
  PERFORM pg_advisory_xact_lock(771106,1);
  PERFORM official_v3_guard_private.check_certificate_v1(component_value);
  IF component_value<>'hma' THEN PERFORM official_v3_guard_private.require_open_v1(); END IF;
END $$;

CREATE FUNCTION official_v3_guard_private.seal_component_v1(component_value text) RETURNS void
LANGUAGE plpgsql VOLATILE SECURITY DEFINER SET search_path=pg_catalog SET timezone='UTC' SET datestyle='ISO, YMD' AS $$
DECLARE c official_v3_guard_private.certificates_v1%ROWTYPE; next_digest text; previous_hash text; body jsonb; instant timestamptz;
BEGIN
  -- The component's original mutation is already held under the common write
  -- lock. This obtains no new component lock after its final authority check.
  SELECT * INTO STRICT c FROM official_v3_guard_private.certificates_v1 WHERE component=component_value FOR UPDATE;
  CASE component_value
    WHEN 'hma' THEN PERFORM official_v3_guard_private.check_hma_v1();
    WHEN 's1' THEN PERFORM official_v3_guard_private.check_s1_v1();
    WHEN 'jobs' THEN PERFORM official_v3_guard_private.check_jobs_v1();
    ELSE RAISE EXCEPTION 'bg1 component refused' USING ERRCODE='P7901';
  END CASE;
  SELECT entry_hash INTO STRICT previous_hash FROM official_v3_guard_private.certificate_history_v1
    WHERE component=component_value AND generation=c.generation AND after_digest=c.digest;
  next_digest:=official_v3_guard_private.content_digest_v1(component_value);
  IF next_digest=c.digest THEN RETURN; END IF;
  instant:=clock_timestamp();
  body:=jsonb_build_object('component',component_value,'generation',c.generation+1,'before_digest',c.digest,
    'after_digest',next_digest,'predecessor_hash',previous_hash,'recorded_at',instant);
  INSERT INTO official_v3_guard_private.certificate_history_v1 VALUES(component_value,c.generation+1,c.digest,next_digest,
    previous_hash,instant,encode(sha256(convert_to('bg1-certificate:v1:'||body::text,'UTF8')),'hex'));
  UPDATE official_v3_guard_private.certificates_v1 SET generation=c.generation+1,digest=next_digest WHERE component=component_value;
END $$;

CREATE FUNCTION official_v3_guard_private.owner_session_v1() RETURNS void
LANGUAGE plpgsql VOLATILE SECURITY DEFINER SET search_path=pg_catalog AS $$
BEGIN
  PERFORM jetnity_ot_auth.require_current_owner_session_v1();
  IF auth.uid() IS NULL THEN RAISE EXCEPTION 'bg1 owner authority unavailable' USING ERRCODE='42501'; END IF;
END $$;

CREATE FUNCTION official_v3_guard_private.current_method_v1() RETURNS jsonb
LANGUAGE plpgsql VOLATILE SECURITY DEFINER SET search_path=pg_catalog SET timezone='UTC' SET datestyle='ISO, YMD' AS $$
DECLARE h official_v3_method_private.heads_v1%ROWTYPE;
BEGIN
  SELECT * INTO h FROM official_v3_method_private.heads_v1 WHERE method_id='jetnity-destination-primary-ch-de-visa' FOR SHARE;
  IF NOT FOUND OR h.revision<>1 OR h.method_digest<>'44ce02752da05796bef98c55b5099b81f915fe6b0975472e163721a06793bdb3'
    OR h.package_digest<>'0beb25db2e1f6e4c2c96d61ded30b59a8e06a32ed94498903fbeecc3b6f267e9' THEN RETURN NULL; END IF;
  RETURN jsonb_build_object('methodId',h.method_id,'revision',h.revision,'methodDigest',h.method_digest,
    'packageDigest',h.package_digest,'epoch',h.epoch,'status',h.status,'approvalMode',h.approval_mode,'approvalUntil',h.approval_until);
END $$;

CREATE FUNCTION official_v3_guard_private.fixed_method_v1() RETURNS void
LANGUAGE plpgsql VOLATILE SECURITY DEFINER SET search_path=pg_catalog AS $$
BEGIN
  PERFORM official_v3_method_private.require_current_locked_v1('jetnity-destination-primary-ch-de-visa',1,
    '44ce02752da05796bef98c55b5099b81f915fe6b0975472e163721a06793bdb3',
    '0beb25db2e1f6e4c2c96d61ded30b59a8e06a32ed94498903fbeecc3b6f267e9',1);
END $$;

CREATE FUNCTION official_v3_guard_private.recovery_jobs_v1() RETURNS jsonb
LANGUAGE plpgsql VOLATILE SECURITY DEFINER SET search_path=pg_catalog AS $$
DECLARE s official_v3_jobs_private.subjects_v1%ROWTYPE; t official_v3_jobs_private.execution_starts_v1%ROWTYPE;
  claim_record official_v3_jobs_private.queue_operations_v1%ROWTYPE; fence jsonb; seed text; revision_value text;
BEGIN
  SELECT * INTO STRICT s FROM official_v3_jobs_private.subjects_v1
    WHERE kind='rule_research' AND current_job->>'contextKey'='official-truth-context:v3:bfce3bc64dbd7c670441e05033c31f339e03a2c488ab54937320508333c252c2'
    FOR UPDATE;
  PERFORM official_v3_jobs_private.assert_history_v1(s.job_key);
  SELECT * INTO STRICT t FROM official_v3_jobs_private.execution_starts_v1 WHERE attempt_key=s.open_attempt FOR SHARE;
  SELECT * INTO STRICT claim_record FROM official_v3_jobs_private.queue_operations_v1 WHERE operation_id=t.claim_operation_id FOR SHARE;
  IF s.start_count<>1 OR s.operation_count<>2 OR s.current_job IS DISTINCT FROM t.leased_job
    OR s.current_job->>'state'<>'leased' OR s.current_job->'attempt'<>'1'::jsonb
    OR s.current_job#>>'{research,factKind}' IS DISTINCT FROM 'requirement_effect'
    OR s.current_job#>'{research,researchReason}' IS DISTINCT FROM '{"status":"missing"}'::jsonb
    OR s.job_key IS DISTINCT FROM (official_v3_jobs_private.subject_v1('rule_research',jsonb_build_object(
      'context',s.current_job->'context','method',s.current_job->'method','factKind','requirement_effect',
      'researchReason',jsonb_build_object('status','missing')))->>'jobKey')
    OR s.current_job->'attemptLimit'<>'4'::jsonb OR s.terminal_credit_claim IS DISTINCT FROM t.claim_operation_id
    OR s.method_binding IS DISTINCT FROM jsonb_build_object('methodId','jetnity-destination-primary-ch-de-visa','revision',1,
      'methodDigest','44ce02752da05796bef98c55b5099b81f915fe6b0975472e163721a06793bdb3',
      'packageDigest','0beb25db2e1f6e4c2c96d61ded30b59a8e06a32ed94498903fbeecc3b6f267e9')
    OR t.authority IS DISTINCT FROM s.method_binding||jsonb_build_object('epoch',1)
    OR claim_record.action<>'claim' OR claim_record.envelope_text::jsonb->'next' IS DISTINCT FROM t.leased_job
    OR EXISTS(SELECT 1 FROM official_v3_jobs_private.execution_results_v1 WHERE attempt_key=t.attempt_key)
    OR EXISTS(SELECT 1 FROM official_v3_jobs_private.execution_dispositions_v1 WHERE attempt_key=t.attempt_key)
    OR clock_timestamp()<=(t.leased_job#>>'{lease,expiresAt}')::timestamptz THEN
    RAISE EXCEPTION 'bg1 exact expired first attempt required' USING ERRCODE='P7906';
  END IF;
  fence:=jsonb_build_object('jobId',t.leased_job->'jobId','revision',t.leased_job->'revision',
    'leaseId',t.leased_job#>'{lease,leaseId}','generation',t.leased_job#>'{lease,generation}');
  revision_value:='snapshot:0beb25db2e1f6e4c2c96d61ded30b59a8e06a32ed94498903fbeecc3b6f267e9';
  seed:=official_v3_jobs_private.canonical_v1(jsonb_build_object('producerRevision',1,'inputRevision',revision_value,'job',t.leased_job,'fence',fence),0);
  RETURN jsonb_build_object('attemptKey',t.attempt_key,'jobKey',t.job_key,'claimOperationId',t.claim_operation_id,
    'claim',t.claim_text::jsonb,'leasedJob',t.leased_job,'authority',t.authority,'fence',fence,
    'intakeOperationId','op3_'||substr(encode(sha256(convert_to('operation:'||seed,'UTF8')),'hex'),1,32),
    'deliveryId','delivery3_'||substr(encode(sha256(convert_to('delivery:'||seed,'UTF8')),'hex'),1,32),
    'runnerId','runner3_'||substr(encode(sha256(convert_to(official_v3_jobs_private.canonical_v1(jsonb_build_object(
      'kind','aa_bern_ch_de_untrusted_delivery','producerRevision',1,'inputRevision',revision_value),0),'UTF8')),'hex'),1,32),
    'inputRevision',revision_value);
END $$;

CREATE FUNCTION official_v3_guard_private.recovery_intake_v1(job_value jsonb) RETURNS jsonb
LANGUAGE plpgsql VOLATILE SECURITY DEFINER SET search_path=pg_catalog SET timezone='UTC' SET datestyle='ISO, YMD' AS $$
DECLARE o official_v3_intake_private.operations_v1%ROWTYPE; expected_binding jsonb; proposal jsonb;
BEGIN
  SELECT * INTO STRICT o FROM official_v3_intake_private.operations_v1 WHERE operation_id=job_value->>'intakeOperationId' FOR UPDATE;
  expected_binding:=jsonb_build_object('schema',3,'kind','proposal_intake_binding','operationId',job_value->'intakeOperationId',
    'jobId',job_value#>'{leasedJob,jobId}','contextKey',job_value#>'{leasedJob,contextKey}',
    'method',jsonb_build_object('methodId','jetnity-destination-primary-ch-de-visa','revision',1),
    'runnerId',job_value->'runnerId','deliveryId',job_value->'deliveryId','inputRevision',job_value->'inputRevision');
  proposal:=convert_from(o.original_bytes,'UTF8')::jsonb;
  IF o.binding IS DISTINCT FROM expected_binding OR o.generation<>1
    OR clock_timestamp()<=o.expires_at OR NOT isfinite(o.expires_at)
    OR official_v3_guard_private.original_valid_v1(o.binding,convert_from(o.original_bytes,'UTF8'),o.proposal_digest) IS NOT TRUE
    OR proposal->'context' IS DISTINCT FROM job_value#>'{leasedJob,context}'
    OR proposal->'research' IS DISTINCT FROM job_value#>'{leasedJob,research}'
    OR (SELECT count(*) FROM official_v3_intake_private.reservations_v1 WHERE operation_id=o.operation_id)<>1
    OR EXISTS(SELECT 1 FROM official_v3_intake_private.completions_v1 WHERE operation_id=o.operation_id) THEN
    RAISE EXCEPTION 'bg1 exact expired original required' USING ERRCODE='P7906';
  END IF;
  PERFORM official_v3_guard_private.check_s1_v1();
  RETURN (to_jsonb(o)-ARRAY['original_bytes','lease_token'])||jsonb_build_object('bytes',octet_length(o.original_bytes));
END $$;

CREATE FUNCTION official_v3_guard_private.recovery_hrs_v1() RETURNS jsonb
LANGUAGE plpgsql VOLATILE SECURITY DEFINER SET search_path=pg_catalog AS $$
DECLARE h official_v3_result_private.heads_v1%ROWTYPE; certificate text; q official_v3_result_private.qualifications_v1%ROWTYPE;
BEGIN
  PERFORM pg_advisory_xact_lock(771105,2);
  SELECT * INTO STRICT h FROM official_v3_result_private.heads_v1 WHERE singleton FOR UPDATE;
  PERFORM official_v3_guard_private.check_hrs_v1();
  IF h.context_key<>'official-truth-context:v3:bfce3bc64dbd7c670441e05033c31f339e03a2c488ab54937320508333c252c2'
    OR h.version_ref IS NOT NULL OR h.decision_ref IS NOT NULL OR h.projection_ref IS NOT NULL
    OR EXISTS(SELECT 1 FROM official_v3_result_private.versions_v1)
    OR EXISTS(SELECT 1 FROM official_v3_result_private.projections_v1)
    OR EXISTS(SELECT 1 FROM official_v3_result_private.decisions_v1)
    OR EXISTS(SELECT 1 FROM official_v3_result_private.outbox_v1)
    OR EXISTS(SELECT 1 FROM official_v3_result_private.operations_v1 WHERE operation_kind IN ('version','publication','escalation'))
    OR (SELECT count(*) FROM official_v3_result_private.originals_v1)<>2
    OR (SELECT count(*) FROM official_v3_result_private.qualifications_v1)<>1 THEN
    RAISE EXCEPTION 'bg1 uncommitted first result required' USING ERRCODE='P7906';
  END IF;
  SELECT * INTO STRICT q FROM official_v3_result_private.qualifications_v1 WHERE kind='verification';
  PERFORM official_v3_result_private.verification_v1(q.record,official_v3_result_private.selected_binding_v1(),false);
  IF jsonb_array_length(q.original_ids)<>2 OR (SELECT count(DISTINCT value) FROM jsonb_array_elements(q.original_ids))<>2
    OR EXISTS(SELECT 1 FROM official_v3_result_private.originals_v1 o WHERE NOT q.original_ids ? o.version_id) THEN
    RAISE EXCEPTION 'bg1 exact first source qualification required' USING ERRCODE='P7906'; END IF;
  SELECT state_certificate INTO certificate FROM official_v3_result_private.binding_v1 WHERE singleton;
  RETURN jsonb_build_object('head',to_jsonb(h),'certificate',certificate,'originals',2,'qualifications',1,'versions',0,'publications',0);
END $$;

CREATE FUNCTION official_v3_guard_private.recovery_snapshot_v1() RETURNS jsonb
LANGUAGE plpgsql VOLATILE SECURITY DEFINER SET search_path=pg_catalog AS $$
DECLARE j jsonb; s jsonb; h jsonb;
BEGIN
  PERFORM official_v3_guard_private.fixed_method_v1();
  j:=official_v3_guard_private.recovery_jobs_v1();
  s:=official_v3_guard_private.recovery_intake_v1(j);
  h:=official_v3_guard_private.recovery_hrs_v1();
  -- The global write lock excludes a new generation while the component locks
  -- are acquired. Recheck both original lease ends after every possible wait.
  IF clock_timestamp()<=(j#>>'{leasedJob,lease,expiresAt}')::timestamptz
    OR clock_timestamp()<=(s->>'expires_at')::timestamptz THEN
    RAISE EXCEPTION 'bg1 expired custody required' USING ERRCODE='P7906';
  END IF;
  RETURN jsonb_build_object('schema',1,'kind','ch_de_first_unknown','job',j,'intake',s,'result',h);
END $$;

CREATE FUNCTION official_v3_guard_private.retired_state_v1(attempt_value text) RETURNS jsonb
LANGUAGE sql STABLE SECURITY DEFINER SET search_path=pg_catalog AS $$
SELECT before_state FROM official_v3_guard_private.retired_attempts_v1 WHERE attempt_key=attempt_value
$$;

CREATE FUNCTION official_v3_guard_private.close_jobs_v1(attempt_value text) RETURNS void
LANGUAGE plpgsql VOLATILE SECURITY DEFINER SET search_path=pg_catalog AS $$
DECLARE evidence jsonb; count_value bigint;
BEGIN
  -- Mandatory at the lowest mutator, even when invoked directly by postgres.
  PERFORM official_v3_guard_private.owner_session_v1();
  evidence:=official_v3_guard_private.retired_state_v1(attempt_value);
  IF evidence IS NULL OR evidence#>>'{job,attemptKey}' IS DISTINCT FROM attempt_value THEN
    RAISE EXCEPTION 'bg1 immutable retirement required' USING ERRCODE='P7906';
  END IF;
  UPDATE official_v3_jobs_private.subjects_v1 SET open_attempt=NULL
    WHERE job_key=evidence#>>'{job,jobKey}' AND open_attempt=attempt_value
      AND current_job=evidence#>'{job,leasedJob}' AND start_count=1 AND operation_count=2;
  GET DIAGNOSTICS count_value=ROW_COUNT;
  IF count_value<>1 THEN RAISE EXCEPTION 'bg1 retirement compare failed' USING ERRCODE='P7906'; END IF;
  PERFORM official_v3_guard_private.seal_jobs_v1();
  PERFORM official_v3_guard_private.owner_session_v1();
END $$;

CREATE FUNCTION official_v3_guard_private.check_retired_jobs_v1(evidence jsonb) RETURNS void
LANGUAGE plpgsql VOLATILE SECURITY DEFINER SET search_path=pg_catalog AS $$
DECLARE t official_v3_jobs_private.execution_starts_v1%ROWTYPE;
BEGIN
  SELECT * INTO STRICT t FROM official_v3_jobs_private.execution_starts_v1 WHERE attempt_key=evidence#>>'{job,attemptKey}';
  IF t.job_key IS DISTINCT FROM evidence#>>'{job,jobKey}' OR t.claim_text::jsonb IS DISTINCT FROM evidence#>'{job,claim}'
    OR t.leased_job IS DISTINCT FROM evidence#>'{job,leasedJob}' OR t.authority IS DISTINCT FROM evidence#>'{job,authority}'
    OR EXISTS(SELECT 1 FROM official_v3_jobs_private.execution_results_v1 WHERE attempt_key=t.attempt_key)
    OR EXISTS(SELECT 1 FROM official_v3_jobs_private.execution_dispositions_v1 WHERE attempt_key=t.attempt_key)
    OR EXISTS(SELECT 1 FROM official_v3_jobs_private.subjects_v1 WHERE open_attempt=t.attempt_key) THEN
    RAISE EXCEPTION 'bg1 retired job changed' USING ERRCODE='P7906';
  END IF;
END $$;

CREATE FUNCTION official_v3_guard_private.check_retired_s1_v1(evidence jsonb) RETURNS void
LANGUAGE plpgsql VOLATILE SECURITY DEFINER SET search_path=pg_catalog SET timezone='UTC' SET datestyle='ISO, YMD' AS $$
DECLARE o official_v3_intake_private.operations_v1%ROWTYPE;
BEGIN
  SELECT * INTO STRICT o FROM official_v3_intake_private.operations_v1 WHERE operation_id=evidence#>>'{job,intakeOperationId}';
  IF (to_jsonb(o)-ARRAY['original_bytes','lease_token'])||jsonb_build_object('bytes',octet_length(o.original_bytes)) IS DISTINCT FROM evidence->'intake'
    OR encode(sha256(o.original_bytes),'hex') IS DISTINCT FROM o.proposal_digest
    OR EXISTS(SELECT 1 FROM official_v3_intake_private.completions_v1 WHERE operation_id=o.operation_id) THEN
    RAISE EXCEPTION 'bg1 retired intake changed' USING ERRCODE='P7906';
  END IF;
END $$;

CREATE FUNCTION official_v3_guard_private.check_retired_hrs_v1(evidence jsonb) RETURNS void
LANGUAGE plpgsql VOLATILE SECURITY DEFINER SET search_path=pg_catalog AS $$
BEGIN
  IF EXISTS(SELECT 1 FROM official_v3_result_private.operations_v1
    WHERE operation_id=evidence#>>'{job,intakeOperationId}' OR command#>>'{intake,binding,operationId}'=evidence#>>'{job,intakeOperationId}')
    OR EXISTS(SELECT 1 FROM official_v3_result_private.versions_v1 WHERE prepared#>>'{transition,operationId}'=evidence#>>'{job,intakeOperationId}') THEN
    RAISE EXCEPTION 'bg1 retired intake publication' USING ERRCODE='P7906';
  END IF;
END $$;

CREATE FUNCTION official_v3_guard_private.check_retirements_v1() RETURNS void
LANGUAGE plpgsql VOLATILE SECURITY DEFINER SET search_path=pg_catalog AS $$
DECLARE retirement record; op official_v3_guard_private.owner_operations_v1%ROWTYPE;
BEGIN
  IF (SELECT count(*) FROM official_v3_guard_private.retired_attempts_v1)>1 THEN RAISE EXCEPTION 'bg1 fixed recovery scope' USING ERRCODE='P7906'; END IF;
  FOR retirement IN SELECT * FROM official_v3_guard_private.retired_attempts_v1 LOOP
    SELECT * INTO STRICT op FROM official_v3_guard_private.owner_operations_v1 WHERE operation_id=retirement.owner_operation_id;
    IF op.action<>'retire_unknown' OR op.expected_digest IS DISTINCT FROM encode(sha256(convert_to(retirement.before_state::text,'UTF8')),'hex')
      OR retirement.attempt_key IS DISTINCT FROM retirement.before_state#>>'{job,attemptKey}'
      OR retirement.intake_operation_id IS DISTINCT FROM retirement.before_state#>>'{job,intakeOperationId}'
      OR retirement.claim_operation_id IS DISTINCT FROM retirement.before_state#>>'{job,claimOperationId}'
      OR retirement.job_key IS DISTINCT FROM retirement.before_state#>>'{job,jobKey}'
      OR retirement.retired_at IS DISTINCT FROM op.recorded_at THEN
      RAISE EXCEPTION 'bg1 retirement receipt binding' USING ERRCODE='P7906';
    END IF;
    PERFORM official_v3_guard_private.check_retired_jobs_v1(retirement.before_state);
    PERFORM official_v3_guard_private.check_retired_s1_v1(retirement.before_state);
    PERFORM official_v3_guard_private.check_retired_hrs_v1(retirement.before_state);
  END LOOP;
END $$;

CREATE FUNCTION official_v3_guard_private.incident_snapshot_v1() RETURNS jsonb
LANGUAGE plpgsql VOLATILE SECURITY DEFINER SET search_path=pg_catalog SET timezone='UTC' SET datestyle='ISO, YMD' AS $$
DECLARE s official_v3_guard_private.state_v1%ROWTYPE;
BEGIN
  SELECT * INTO STRICT s FROM official_v3_guard_private.state_v1 WHERE singleton FOR UPDATE;
  RETURN jsonb_build_object('schema',1,'kind','integrity_incident','generation',s.incident_generation,
    'resumedGeneration',s.resumed_generation,'incidentAt',s.incident_at,'proofGeneration',s.generation,
    'proofDue',s.last_due,'proofStarted',s.last_proof_started,'proofFinished',s.last_finished,'validUntil',s.valid_until,
    'method',official_v3_guard_private.current_method_v1());
END $$;

CREATE FUNCTION public.official_v3_guard_review_v1() RETURNS jsonb
LANGUAGE plpgsql VOLATILE SECURITY DEFINER SET search_path=pg_catalog SET statement_timeout='5s' SET lock_timeout='2s' AS $$
DECLARE retirement jsonb; incident jsonb; snapshot jsonb;
BEGIN
  PERFORM official_v3_guard_private.owner_session_v1();
  PERFORM pg_advisory_xact_lock(771106,1);
  PERFORM official_v3_guard_private.assert_catalog_v1();
  PERFORM official_v3_guard_private.check_certificates_v1();
  IF EXISTS(SELECT 1 FROM official_v3_guard_private.retired_attempts_v1) THEN retirement:=jsonb_build_object('status','closed');
  ELSE
    BEGIN
      snapshot:=official_v3_guard_private.recovery_snapshot_v1();
      retirement:=jsonb_build_object('status','reviewable','selection',encode(sha256(convert_to(snapshot::text,'UTF8')),'hex'),
        'attempt',1,'originals',2,'qualifications',1,'acceptedVersions',0,
        'leaseEndedAt',snapshot#>'{job,leasedJob,lease,expiresAt}');
    EXCEPTION WHEN SQLSTATE 'P7906' OR SQLSTATE 'P7504' OR no_data_found OR too_many_rows THEN retirement:=jsonb_build_object('status','unavailable'); END;
  END IF;
  incident:=official_v3_guard_private.incident_snapshot_v1();
  PERFORM official_v3_guard_private.owner_session_v1();
  RETURN jsonb_build_object('schema',1,'status','reviewed','retirement',retirement,
    'incident',jsonb_build_object('status',CASE WHEN incident->'generation'=incident->'resumedGeneration' THEN 'clear' ELSE 'blocked' END,
      'selection',encode(sha256(convert_to(incident::text,'UTF8')),'hex'),'generation',incident->'generation',
      'methodEpoch',incident#>'{method,epoch}','proofFinished',incident->'proofFinished','validUntil',incident->'validUntil',
      'canResume',COALESCE((incident->>'generation')::bigint>(incident->>'resumedGeneration')::bigint
        AND incident#>>'{method,status}'='approved'
        AND (incident->>'proofStarted')::timestamptz>(incident->>'incidentAt')::timestamptz
        AND clock_timestamp()<(incident->>'validUntil')::timestamptz,false)));
END $$;

CREATE FUNCTION public.official_v3_guard_retire_v1(p_operation_id text,p_selection text) RETURNS jsonb
LANGUAGE plpgsql VOLATILE SECURITY DEFINER SET search_path=pg_catalog SET statement_timeout='5s' SET lock_timeout='2s' AS $$
DECLARE snapshot jsonb; prior official_v3_guard_private.owner_operations_v1%ROWTYPE; instant timestamptz; receipt_value jsonb;
BEGIN
  IF p_operation_id !~ '^op3_[a-f0-9]{32}$' OR p_selection !~ '^[a-f0-9]{64}$' OR p_operation_id IS NULL OR p_selection IS NULL THEN
    RAISE EXCEPTION 'bg1 fixed operation input' USING ERRCODE='P7901'; END IF;
  PERFORM official_v3_guard_private.owner_session_v1();
  PERFORM pg_advisory_xact_lock(771106,1);
  SELECT * INTO prior FROM official_v3_guard_private.owner_operations_v1 WHERE operation_id=p_operation_id;
  IF FOUND THEN
    IF prior.action<>'retire_unknown' OR prior.expected_digest<>p_selection OR prior.actor_id<>auth.uid() THEN RAISE EXCEPTION 'bg1 operation collision' USING ERRCODE='P7906'; END IF;
    PERFORM official_v3_guard_private.owner_session_v1(); RETURN prior.receipt;
  END IF;
  PERFORM official_v3_guard_private.assert_catalog_v1();
  PERFORM official_v3_guard_private.check_certificates_v1();
  IF EXISTS(SELECT 1 FROM official_v3_guard_private.retired_attempts_v1) THEN RAISE EXCEPTION 'bg1 first attempt already closed' USING ERRCODE='P7906'; END IF;
  snapshot:=official_v3_guard_private.recovery_snapshot_v1();
  IF encode(sha256(convert_to(snapshot::text,'UTF8')),'hex') IS DISTINCT FROM p_selection THEN RAISE EXCEPTION 'bg1 reviewed state changed' USING ERRCODE='P7906'; END IF;
  instant:=clock_timestamp();
  receipt_value:=jsonb_build_object('schema',1,'status','recorded','action','retire_unknown','operationId',p_operation_id,'selection',p_selection,
    'result','unknown_retired','recordedAt',to_char(instant AT TIME ZONE 'UTC','YYYY-MM-DD"T"HH24:MI:SS.MS"Z"'));
  INSERT INTO official_v3_guard_private.owner_operations_v1 VALUES(p_operation_id,'retire_unknown',p_selection,auth.uid(),instant,receipt_value);
  INSERT INTO official_v3_guard_private.retired_attempts_v1 VALUES(snapshot#>>'{job,attemptKey}',snapshot#>>'{job,jobKey}',snapshot#>>'{job,claimOperationId}',
    snapshot#>>'{job,intakeOperationId}',p_operation_id,snapshot,instant);
  PERFORM official_v3_guard_private.close_jobs_v1(snapshot#>>'{job,attemptKey}');
  PERFORM official_v3_guard_private.check_retirements_v1();
  PERFORM official_v3_guard_private.fixed_method_v1();
  PERFORM official_v3_guard_private.owner_session_v1();
  RETURN receipt_value;
END $$;

CREATE FUNCTION public.official_v3_guard_resume_v1(p_operation_id text,p_selection text) RETURNS jsonb
LANGUAGE plpgsql VOLATILE SECURITY DEFINER SET search_path=pg_catalog SET statement_timeout='5s' SET lock_timeout='2s' AS $$
DECLARE snapshot jsonb; prior official_v3_guard_private.owner_operations_v1%ROWTYPE; instant timestamptz; receipt_value jsonb;
BEGIN
  IF p_operation_id !~ '^op3_[a-f0-9]{32}$' OR p_selection !~ '^[a-f0-9]{64}$' OR p_operation_id IS NULL OR p_selection IS NULL THEN
    RAISE EXCEPTION 'bg1 fixed operation input' USING ERRCODE='P7901'; END IF;
  PERFORM official_v3_guard_private.owner_session_v1();
  PERFORM pg_advisory_xact_lock(771106,1);
  SELECT * INTO prior FROM official_v3_guard_private.owner_operations_v1 WHERE operation_id=p_operation_id;
  IF FOUND THEN
    IF prior.action<>'resume' OR prior.expected_digest<>p_selection OR prior.actor_id<>auth.uid() THEN RAISE EXCEPTION 'bg1 operation collision' USING ERRCODE='P7906'; END IF;
    PERFORM official_v3_guard_private.owner_session_v1(); RETURN prior.receipt;
  END IF;
  PERFORM official_v3_guard_private.assert_catalog_v1();
  snapshot:=official_v3_guard_private.incident_snapshot_v1(); instant:=clock_timestamp();
  IF encode(sha256(convert_to(snapshot::text,'UTF8')),'hex') IS DISTINCT FROM p_selection
    OR snapshot->>'proofStarted' IS NULL OR snapshot->>'proofFinished' IS NULL OR snapshot->>'validUntil' IS NULL
    OR snapshot#>>'{method,status}' IS DISTINCT FROM 'approved'
    OR (snapshot->>'generation')::bigint<=(snapshot->>'resumedGeneration')::bigint
    OR (snapshot->>'proofStarted')::timestamptz<=(snapshot->>'incidentAt')::timestamptz
    OR (snapshot->>'proofFinished')::timestamptz>instant OR instant>=(snapshot->>'validUntil')::timestamptz
    OR NOT EXISTS(SELECT 1 FROM official_v3_guard_private.runs_v1 run_row WHERE run_row.generation=(snapshot->>'proofGeneration')::bigint
      AND run_row.outcome='complete' AND run_row.incident_generation=(snapshot->>'generation')::bigint
      AND run_row.proof_started_at=(snapshot->>'proofStarted')::timestamptz
      AND run_row.finished_at=(snapshot->>'proofFinished')::timestamptz AND run_row.due_at=(snapshot->>'proofDue')::timestamptz
      AND run_row.due_at+interval '5 minutes 30 seconds'=(snapshot->>'validUntil')::timestamptz) THEN
    RAISE EXCEPTION 'bg1 fresh post-incident proof required' USING ERRCODE='P7906'; END IF;
  receipt_value:=jsonb_build_object('schema',1,'status','recorded','action','resume','operationId',p_operation_id,'selection',p_selection,
    'result','resumed','generation',snapshot->'generation','recordedAt',to_char(instant AT TIME ZONE 'UTC','YYYY-MM-DD"T"HH24:MI:SS.MS"Z"'));
  INSERT INTO official_v3_guard_private.owner_operations_v1 VALUES(p_operation_id,'resume',p_selection,auth.uid(),instant,receipt_value);
  UPDATE official_v3_guard_private.state_v1 SET resumed_generation=incident_generation,last_observed=greatest(last_observed,instant)
    WHERE singleton AND incident_generation=(snapshot->>'generation')::bigint;
  PERFORM official_v3_guard_private.owner_session_v1();
  PERFORM official_v3_guard_private.require_open_v1();
  PERFORM official_v3_method_private.require_current_locked_v1(snapshot#>>'{method,methodId}',(snapshot#>>'{method,revision}')::integer,
    snapshot#>>'{method,methodDigest}',snapshot#>>'{method,packageDigest}',(snapshot#>>'{method,epoch}')::integer);
  RETURN receipt_value;
END $$;

CREATE FUNCTION public.official_v3_guard_confirm_v1(p_operation_id text,p_action text,p_selection text) RETURNS jsonb
LANGUAGE plpgsql VOLATILE SECURITY DEFINER SET search_path=pg_catalog SET statement_timeout='5s' SET lock_timeout='2s' AS $$
DECLARE prior official_v3_guard_private.owner_operations_v1%ROWTYPE;
BEGIN
  PERFORM official_v3_guard_private.owner_session_v1();
  IF p_operation_id !~ '^op3_[a-f0-9]{32}$' OR p_selection !~ '^[a-f0-9]{64}$' OR p_action NOT IN ('retire_unknown','resume')
    OR p_operation_id IS NULL OR p_selection IS NULL OR p_action IS NULL THEN RAISE EXCEPTION 'bg1 fixed confirmation input' USING ERRCODE='P7901'; END IF;
  SELECT * INTO prior FROM official_v3_guard_private.owner_operations_v1 WHERE operation_id=p_operation_id;
  IF NOT FOUND THEN RETURN jsonb_build_object('schema',1,'status','absent'); END IF;
  IF prior.action<>p_action OR prior.expected_digest<>p_selection OR prior.actor_id<>auth.uid() THEN RAISE EXCEPTION 'bg1 operation collision' USING ERRCODE='P7906'; END IF;
  PERFORM official_v3_guard_private.owner_session_v1();
  RETURN prior.receipt;
END $$;

-- One fixed current snapshot, reached only through the original reader API,
-- native transaction and private MA1 receipt. It creates no state or authority.
CREATE FUNCTION official_v3_guard_private.ch_de_snapshot_v1(b jsonb,epoch_value integer,deadline timestamptz,legal_day text) RETURNS jsonb
LANGUAGE plpgsql VOLATILE SECURITY DEFINER SET search_path=pg_catalog AS $$
DECLARE h official_v3_result_private.heads_v1%ROWTYPE; p official_v3_result_private.projections_v1%ROWTYPE;
  v official_v3_result_private.versions_v1%ROWTYPE; q official_v3_result_private.qualifications_v1%ROWTYPE;
  original_row official_v3_result_private.originals_v1%ROWTYPE;
  projection_value jsonb; method_value jsonb; result_value jsonb; conflict_value jsonb; original_value jsonb; ev jsonb;
  cap timestamptz; instant timestamptz; reason_value text;
BEGIN
  IF b->>'dataMode' IS DISTINCT FROM 'official_projection' OR b->>'methodId' IS DISTINCT FROM 'jetnity-destination-primary-ch-de-visa'
    OR b->'revision' IS DISTINCT FROM '1'::jsonb OR b->>'contextKey' IS DISTINCT FROM 'official-truth-context:v3:bfce3bc64dbd7c670441e05033c31f339e03a2c488ab54937320508333c252c2'
    OR b->>'methodDigest' IS DISTINCT FROM '44ce02752da05796bef98c55b5099b81f915fe6b0975472e163721a06793bdb3'
    OR b->>'packageDigest' IS DISTINCT FROM '0beb25db2e1f6e4c2c96d61ded30b59a8e06a32ed94498903fbeecc3b6f267e9'
    OR session_user<>'ot_v3_result_reader' THEN RAISE EXCEPTION 'bg1 selected visitor snapshot only' USING ERRCODE='42501'; END IF;
  PERFORM official_v3_result_private.fence_v1(b,epoch_value,deadline,legal_day);
  cap:=least(deadline,official_v3_guard_private.open_until_v1(),(b->>'activeUntilExclusive')::timestamptz);
  method_value:=official_v3_guard_private.current_method_v1();
  IF method_value IS NULL OR method_value->>'status'<>'approved' OR (method_value->>'epoch')::integer<>epoch_value THEN
    RAISE EXCEPTION 'bg1 selected method changed' USING ERRCODE='P7902'; END IF;
  IF method_value->>'approvalUntil' IS NOT NULL THEN cap:=least(cap,(method_value->>'approvalUntil')::timestamptz); END IF;
  instant:=clock_timestamp();
  cap:=least(cap,((instant AT TIME ZONE (b->>'legalTimeZone'))::date+1)::timestamp AT TIME ZONE (b->>'legalTimeZone'));
  SELECT * INTO STRICT h FROM official_v3_result_private.heads_v1 WHERE singleton FOR SHARE;
  IF h.context_key IS DISTINCT FROM b->>'contextKey' THEN RAISE EXCEPTION 'bg1 selected coverage changed' USING ERRCODE='P7905'; END IF;
  IF h.sticky_decision_ref IS NOT NULL OR h.suppression<>'null'::jsonb THEN
    SELECT d.record INTO conflict_value FROM official_v3_result_private.decisions_v1 d
      WHERE d.reference=COALESCE(h.sticky_decision_ref,h.suppression->>'decisionRef');
    reason_value:=CASE WHEN h.suppression->>'reason'='primary_unclear' OR conflict_value->>'conclusion'='primary_unclear' THEN 'primary_unclear'
      WHEN h.suppression->>'reason' IN ('known_conflict','comparable_conflict') OR conflict_value->>'conclusion'='comparable_conflict' THEN 'comparable_conflict' END;
    IF reason_value IS NOT NULL AND conflict_value IS NOT NULL THEN
      result_value:=jsonb_build_object('status','conflict','decisionRef',conflict_value->'reference','reason',reason_value);
    ELSE result_value:=jsonb_build_object('status','unavailable'); END IF;
  ELSIF NOT h.coverage THEN result_value:=jsonb_build_object('status','missing');
  ELSE
    projection_value:=official_v3_result_private.current_projection_v1(b,legal_day);
    IF projection_value IS NULL THEN result_value:=jsonb_build_object('status','missing');
    ELSE
      SELECT * INTO STRICT p FROM official_v3_result_private.projections_v1 WHERE reference=h.projection_ref;
      SELECT * INTO STRICT v FROM official_v3_result_private.versions_v1 WHERE reference=h.version_ref;
      SELECT * INTO STRICT q FROM official_v3_result_private.qualifications_v1 WHERE reference=p.verification_ref AND kind='verification';
      IF p.record IS DISTINCT FROM projection_value OR p.verification_ref<>v.verification_ref
        OR projection_value->'rule' IS DISTINCT FROM v.prepared->'version'
        OR v.prepared->'decision' IS DISTINCT FROM q.record->'decision' OR q.decision_ref IS DISTINCT FROM h.decision_ref
        OR q.record#>'{request,context}' IS DISTINCT FROM b->'context'
        OR q.record#>'{request,method}' IS DISTINCT FROM jsonb_build_object('methodId',b->'methodId','revision',b->'revision')
        OR q.record#>>'{decision,conclusion}' IS DISTINCT FROM 'clear_primary' THEN
        RAISE EXCEPTION 'bg1 accepted snapshot links' USING ERRCODE='P7905'; END IF;
      PERFORM official_v3_result_private.fence_v1(b,epoch_value,deadline,legal_day,q.record);
      cap:=least(cap,(projection_value->>'expiresAt')::timestamptz,(projection_value->>'sourceFreshUntil')::timestamptz,
        q.valid_until,(q.record->>'validUntilExclusive')::timestamptz);
      IF jsonb_array_length(q.record->'originals') NOT BETWEEN 1 AND 8 THEN RAISE EXCEPTION 'bg1 finite source snapshot' USING ERRCODE='P7905'; END IF;
      FOR original_value IN SELECT value FROM jsonb_array_elements(q.record->'originals') LOOP
        ev:=CASE WHEN original_value->'observation'='null'::jsonb THEN original_value#>'{ambiguity,evidence}' ELSE original_value#>'{observation,evidence}' END;
        SELECT * INTO STRICT original_row FROM official_v3_result_private.originals_v1 WHERE version_id=ev->>'versionId';
        IF original_row.evidence IS DISTINCT FROM ev OR original_row.raw_digest IS DISTINCT FROM original_value->>'rawDigest'
          OR NOT q.original_ids ? original_row.version_id
          OR NOT EXISTS(SELECT 1 FROM jsonb_array_elements(b->'sources') source_row WHERE source_row.value->'source'=ev->'source') THEN
          RAISE EXCEPTION 'bg1 exact original snapshot link' USING ERRCODE='P7905'; END IF;
        cap:=least(cap,(ev->>'retrievedAt')::timestamptz+make_interval(secs=>(b->>'sourceMaxAgeMilliseconds')::integer/1000.0));
      END LOOP;
      result_value:=jsonb_build_object('status','accepted','projection',projection_value);
    END IF;
  END IF;
  PERFORM official_v3_guard_private.require_open_v1();
  PERFORM official_v3_result_private.fence_v1(b,epoch_value,cap,legal_day);
  instant:=clock_timestamp();
  IF instant>=cap THEN RAISE EXCEPTION 'bg1 snapshot horizon ended' USING ERRCODE='P7902'; END IF;
  RETURN jsonb_build_object('status','snapshot','value',result_value||jsonb_build_object('schema',1,
    'observedAt',to_char(instant AT TIME ZONE 'UTC','YYYY-MM-DD"T"HH24:MI:SS.MS"Z"'),
    'validUntil',to_char(cap AT TIME ZONE 'UTC','YYYY-MM-DD"T"HH24:MI:SS.MS"Z"')));
END $$;

CREATE FUNCTION official_v3_guard_private.latch_incident_v1(due_value timestamptz,reason_value text) RETURNS void
LANGUAGE plpgsql VOLATILE SECURITY DEFINER SET search_path=pg_catalog AS $$
DECLARE s official_v3_guard_private.state_v1%ROWTYPE; instant timestamptz;
BEGIN
  SELECT * INTO STRICT s FROM official_v3_guard_private.state_v1 WHERE singleton FOR UPDATE;
  IF EXISTS(SELECT 1 FROM official_v3_guard_private.incidents_v1
    WHERE due_at=due_value AND reason=reason_value AND baseline_generation=s.generation) THEN RETURN; END IF;
  instant:=greatest(clock_timestamp(),s.last_observed);
  INSERT INTO official_v3_guard_private.incidents_v1 VALUES(s.incident_generation+1,due_value,reason_value,s.generation,instant);
  UPDATE official_v3_guard_private.state_v1 SET incident_generation=s.incident_generation+1,incident_at=instant WHERE singleton;
END $$;

-- The scheduled statement sets its own real 30-second statement timeout before
-- entering this function. Cancellation is caught inside a subtransaction; the
-- negative run and sticky incident are written afterwards and may COMMIT.
CREATE FUNCTION official_v3_guard_private.audit_v1() RETURNS jsonb
LANGUAGE plpgsql VOLATILE SECURITY DEFINER SET search_path=pg_catalog SET jit=off AS $$
DECLARE s official_v3_guard_private.state_v1%ROWTYPE;
  entered timestamptz:=statement_timestamp(); started timestamptz; finished timestamptz; observed timestamptz;
  due timestamptz:=date_bin(interval '5 minutes',entered,timestamptz '2000-01-01 00:00:00+00');
  deadline timestamptz:=entered+interval '30 seconds'; first_due timestamptz; old_valid_until timestamptz;
  result text:='complete'; gap boolean:=false; healthy boolean:=false; incident_recorded boolean:=false;
BEGIN
  IF session_user<>'postgres' OR current_user<>'postgres'
    OR current_setting('transaction_isolation')<>'read committed'
    OR current_setting('statement_timeout')::interval<=interval '0 seconds'
    OR current_setting('statement_timeout')::interval>interval '30 seconds' THEN
    RAISE EXCEPTION 'bg1 fixed checker context required' USING ERRCODE='P7903';
  END IF;
  -- Same first lock as every guarded write and Owner closure. No takeover of a
  -- half-finished checker; process death releases it and freshness still expires.
  PERFORM pg_advisory_xact_lock(771106,1);
  SELECT * INTO s FROM official_v3_guard_private.state_v1 WHERE singleton FOR UPDATE;
  IF NOT FOUND THEN RETURN jsonb_build_object('status','unavailable'); END IF;
  started:=clock_timestamp();
  IF entered<s.last_observed OR started<entered THEN
    PERFORM official_v3_guard_private.latch_incident_v1(due,'clock');
    SELECT * INTO STRICT s FROM official_v3_guard_private.state_v1 WHERE singleton;
    INSERT INTO official_v3_guard_private.runs_v1 VALUES(due,entered,started,clock_timestamp(),'clock',s.generation,s.incident_generation)
      ON CONFLICT(due_at) DO NOTHING;
    RETURN official_v3_guard_private.alarm_status_v1();
  END IF;
  -- An already completed due slot is immutable, including its negative result.
  -- Retrying it late cannot manufacture another incident or extend freshness.
  IF EXISTS(SELECT 1 FROM official_v3_guard_private.runs_v1 WHERE due_at=due) THEN
    RETURN official_v3_guard_private.alarm_status_v1();
  END IF;
  IF started>deadline THEN result:='expired'; END IF;
  first_due:=date_bin(interval '5 minutes',s.installed_at,timestamptz '2000-01-01 00:00:00+00')+interval '5 minutes';
  old_valid_until:=CASE WHEN s.generation>0 THEN s.valid_until ELSE first_due+interval '30 seconds' END;
  gap:=started>=old_valid_until;
  IF gap OR result<>'complete' THEN
    PERFORM official_v3_guard_private.latch_incident_v1(due,CASE WHEN gap THEN 'gap' ELSE result END);
    SELECT * INTO STRICT s FROM official_v3_guard_private.state_v1 WHERE singleton;
    incident_recorded:=true;
    started:=clock_timestamp();
  END IF;
  IF result='complete' THEN
    BEGIN
      observed:=started;
      PERFORM official_v3_guard_private.check_control_v1();
      PERFORM official_v3_guard_private.assert_catalog_v1();
      PERFORM official_v3_guard_private.check_hma_v1();
      finished:=clock_timestamp();
      IF finished<observed OR finished>deadline THEN RAISE EXCEPTION 'bg1 checker deadline' USING ERRCODE='P7904'; END IF;
      observed:=finished;
      PERFORM official_v3_guard_private.check_s1_v1();
      finished:=clock_timestamp();
      IF finished<observed OR finished>deadline THEN RAISE EXCEPTION 'bg1 checker deadline' USING ERRCODE='P7904'; END IF;
      observed:=finished;
      PERFORM official_v3_guard_private.check_jobs_v1();
      finished:=clock_timestamp();
      IF finished<observed OR finished>deadline THEN RAISE EXCEPTION 'bg1 checker deadline' USING ERRCODE='P7904'; END IF;
      observed:=finished;
      PERFORM official_v3_guard_private.check_hrs_v1();
      PERFORM official_v3_guard_private.check_certificates_v1();
      PERFORM official_v3_guard_private.check_retirements_v1();
      PERFORM official_v3_guard_private.assert_catalog_v1();
      finished:=clock_timestamp();
      IF finished<observed OR finished>deadline THEN RAISE EXCEPTION 'bg1 checker deadline' USING ERRCODE='P7904'; END IF;
      healthy:=true;
    EXCEPTION
      WHEN query_canceled OR lock_not_available THEN result:='expired';
      WHEN SQLSTATE 'P7904' THEN result:='expired';
      WHEN OTHERS THEN result:='refused';
    END;
  END IF;
  finished:=clock_timestamp();
  IF healthy AND (finished<started OR finished>deadline) THEN healthy:=false; result:='expired'; END IF;
  -- The previous lease may expire while this run waits or performs its full
  -- proof. Preserve that gap before publishing new evidence. A proof begun
  -- before this incident cannot satisfy the separate Owner resume predicate.
  IF NOT gap AND finished>=old_valid_until THEN
    gap:=true;
    PERFORM official_v3_guard_private.latch_incident_v1(due,'gap');
    SELECT * INTO STRICT s FROM official_v3_guard_private.state_v1 WHERE singleton;
    incident_recorded:=true;
  END IF;
  IF NOT healthy AND NOT incident_recorded THEN
    PERFORM official_v3_guard_private.latch_incident_v1(due,result);
    SELECT * INTO STRICT s FROM official_v3_guard_private.state_v1 WHERE singleton;
  END IF;
  IF healthy THEN
    s.generation:=s.generation+1;
    UPDATE official_v3_guard_private.state_v1 SET generation=s.generation,
      last_due=due,last_started=entered,last_proof_started=started,last_finished=finished,valid_until=due+interval '5 minutes 30 seconds',
      incident_generation=s.incident_generation,incident_at=s.incident_at,
      last_observed=greatest(last_observed,finished) WHERE singleton;
  ELSE
    UPDATE official_v3_guard_private.state_v1 SET incident_generation=s.incident_generation,incident_at=s.incident_at,
      last_observed=greatest(last_observed,finished) WHERE singleton;
  END IF;
  INSERT INTO official_v3_guard_private.runs_v1(due_at,started_at,proof_started_at,finished_at,outcome,generation,incident_generation)
  VALUES(due,entered,started,finished,result,s.generation,s.incident_generation);
  RETURN official_v3_guard_private.alarm_status_v1();
END $$;

CREATE FUNCTION official_v3_guard_private.original_valid_v1(p_binding jsonb, p_original text, p_digest text) RETURNS boolean
LANGUAGE plpgsql STABLE SECURITY DEFINER SET search_path=pg_catalog AS $body$
DECLARE proposal jsonb; original bytea; held official_v3_intake_private.operations_v1%ROWTYPE;
BEGIN
  IF official_v3_intake_private.binding_valid_v1(p_binding) IS NOT TRUE OR p_original IS NULL
    OR octet_length(p_original) NOT BETWEEN 1 AND 65536 OR p_digest IS NULL OR p_digest !~ '^[a-f0-9]{64}$' THEN
    RETURN false;
  END IF;
  original := convert_to(p_original, 'UTF8');
  IF encode(sha256(original),'hex') <> p_digest THEN RETURN false; END IF;
  BEGIN
    IF official_v3_intake_private.unique_json_v1(p_original::json) IS NOT TRUE THEN RETURN false; END IF;
    proposal := p_original::jsonb;
  EXCEPTION WHEN invalid_text_representation OR untranslatable_character OR numeric_value_out_of_range THEN RETURN false; END;
  IF official_v3_intake_private.exact_keys_v1(proposal, ARRAY['schema','kind','jobId','operationId','context','contextKey','research','proposedFact','references']) IS NOT TRUE
    OR official_v3_intake_private.proposal_retainable_v1(proposal) IS NOT TRUE
    OR official_v3_intake_private.safe_data_v1(proposal) IS NOT TRUE OR proposal->'schema' IS DISTINCT FROM '3'::jsonb
    OR proposal->>'kind' IS DISTINCT FROM 'untrusted_research_proposal'
    OR proposal->>'operationId' IS DISTINCT FROM p_binding->>'operationId'
    OR proposal->>'jobId' IS DISTINCT FROM p_binding->>'jobId' OR proposal->>'contextKey' IS DISTINCT FROM p_binding->>'contextKey' THEN
    RETURN false;
  END IF;
  RETURN true;
END $body$;
CREATE FUNCTION official_v3_guard_private.completion_valid_v1(p_binding jsonb, p_digest text, p_bytes integer,
  p_generation integer, p_token uuid, p_outcome jsonb, p_audit jsonb) RETURNS boolean
LANGUAGE plpgsql STABLE SECURITY DEFINER SET search_path=pg_catalog AS $body$
DECLARE held official_v3_intake_private.operations_v1%ROWTYPE; finished official_v3_intake_private.completions_v1%ROWTYPE;
  decision jsonb; expected_key text; now_at timestamptz; shape jsonb := official_v3_intake_private.proposal_shape_v1();
BEGIN
  IF official_v3_intake_private.binding_valid_v1(p_binding) IS NOT TRUE OR p_digest IS NULL OR p_digest !~ '^[a-f0-9]{64}$'
    OR p_bytes IS NULL OR p_bytes NOT BETWEEN 1 AND 65536 OR p_generation IS NULL OR p_generation NOT BETWEEN 1 AND 2147483646
    OR p_token IS NULL OR p_outcome IS NULL OR p_audit IS NULL OR octet_length(p_outcome::text) > 524288 OR octet_length(p_audit::text) > 8192
    OR official_v3_intake_private.safe_data_v1(p_outcome) IS NOT TRUE OR official_v3_intake_private.safe_data_v1(p_audit) IS NOT TRUE THEN
    RETURN false;
  END IF;
  IF official_v3_intake_private.data_nodes_v1(p_outcome,0,24,65536) < 0
    OR official_v3_intake_private.data_nodes_v1(p_audit) < 0
    OR official_v3_intake_private.shape_matches_v1(p_outcome,shape->'definitions'->'outcome',shape->'definitions',shape->'countries') IS NOT TRUE
    OR official_v3_intake_private.shape_matches_v1(p_audit,shape->'definitions'->'audit',shape->'definitions',shape->'countries') IS NOT TRUE THEN
    RETURN false;
  END IF;
  IF official_v3_intake_private.exact_keys_v1(p_audit, ARRAY['schema','kind','operationId','proposalDigest','jobId','contextKey','method','recordedAt','result','decisionRef','escalationKey']) IS NOT TRUE
    OR p_audit->'schema' IS DISTINCT FROM '3'::jsonb OR p_audit->>'kind' IS DISTINCT FROM 'import_attempt_record'
    OR p_audit->>'operationId' IS DISTINCT FROM p_binding->>'operationId' OR p_audit->>'jobId' IS DISTINCT FROM p_binding->>'jobId'
    OR p_audit->>'contextKey' IS DISTINCT FROM p_binding->>'contextKey' OR p_audit->'method' IS DISTINCT FROM p_binding->'method'
    OR p_audit->>'proposalDigest' IS DISTINCT FROM p_digest OR p_audit->>'result' IS DISTINCT FROM p_outcome->>'status'
    OR (p_audit->>'recordedAt' ~ '^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}\.\d{3}Z$') IS NOT TRUE THEN
    RETURN false;
  END IF;
  IF p_outcome->>'status' = 'prepared' THEN
    IF official_v3_intake_private.exact_keys_v1(p_outcome, ARRAY['status','value']) IS NOT TRUE
      OR official_v3_intake_private.exact_keys_v1(p_outcome->'value', ARRAY['proposalDigest','decision','previousDecision','archiveAppend','version','transition','proposalDisposition','acceptance','reproof']) IS NOT TRUE
      OR p_outcome->'value'->>'proposalDigest' IS DISTINCT FROM p_digest
      OR (p_outcome->'value'->>'proposalDisposition' IN ('matched','superseded_by_source')) IS NOT TRUE
      OR (jsonb_typeof(p_outcome->'value'->'previousDecision') IN ('null','object')) IS NOT TRUE
      OR (jsonb_typeof(p_outcome->'value'->'archiveAppend') IN ('null','object')) IS NOT TRUE
      OR jsonb_typeof(p_outcome->'value'->'version') IS DISTINCT FROM 'object'
      OR jsonb_typeof(p_outcome->'value'->'transition') IS DISTINCT FROM 'object'
      OR p_outcome->'value'->>'acceptance' IS DISTINCT FROM 'not_committed'
      OR p_outcome->'value'->>'reproof' IS DISTINCT FROM 'required_before_commit' THEN RETURN false; END IF;
    decision := p_outcome->'value'->'decision';
  ELSIF p_outcome->>'status' = 'escalation' THEN
    IF official_v3_intake_private.exact_keys_v1(p_outcome, ARRAY['status','key','reason','decision','previousDecision','archiveAppend']) IS NOT TRUE
      OR (p_outcome->>'key' ~ '^source-escalation:v3:[a-f0-9]{64}$') IS NOT TRUE
      OR (p_outcome->>'reason' IN ('primary_unclear','comparable_conflict')) IS NOT TRUE
      OR (jsonb_typeof(p_outcome->'previousDecision') IN ('null','object')) IS NOT TRUE
      OR (jsonb_typeof(p_outcome->'archiveAppend') IN ('null','object')) IS NOT TRUE THEN RETURN false; END IF;
    decision := p_outcome->'decision'; expected_key := p_outcome->>'key';
  ELSIF p_outcome->>'status' IN ('quarantined','unavailable') THEN
    IF official_v3_intake_private.exact_keys_v1(p_outcome, ARRAY['status','reason']) IS NOT TRUE
      OR (p_outcome->>'status' = 'quarantined' AND (p_outcome->>'reason' IN ('conditions_unresolved','invalid_verification','history_changed','method_not_current')) IS NOT TRUE)
      OR (p_outcome->>'status' = 'unavailable' AND (p_outcome->>'reason' IN ('method_not_approved','method_unavailable','verification_unavailable','history_unavailable','aborted','temporary_failure')) IS NOT TRUE) THEN
      RETURN false; END IF;
  ELSE RETURN false; END IF;
  IF p_audit->>'decisionRef' IS DISTINCT FROM decision->>'reference' OR p_audit->>'escalationKey' IS DISTINCT FROM expected_key
    OR (p_outcome->>'status' IN ('prepared','escalation') AND (
      jsonb_typeof(decision) IS DISTINCT FROM 'object'
      OR (decision->>'reference' ~ '^source-decision:v3:[a-f0-9]{64}$') IS NOT TRUE
      OR decision->>'contextKey' IS DISTINCT FROM p_binding->>'contextKey' OR decision->'method' IS DISTINCT FROM p_binding->'method')) THEN
    RETURN false;
  END IF;
  RETURN true;
END $body$;
CREATE FUNCTION official_v3_guard_private.fingerprint_hma_v1() RETURNS text
LANGUAGE sql STABLE SECURITY DEFINER SET search_path=pg_catalog SET timezone='UTC' SET datestyle='ISO, YMD' AS $$
WITH rows AS (SELECT 'official_v3_method_private.revisions_v1' AS table_name,(r.method_id)::text AS primary_key,(r.revision)::text AS secondary_key,to_jsonb(r) AS value FROM official_v3_method_private.revisions_v1 r
UNION ALL SELECT 'official_v3_method_private.heads_v1' AS table_name,(r.method_id)::text AS primary_key,('')::text AS secondary_key,to_jsonb(r) AS value FROM official_v3_method_private.heads_v1 r
UNION ALL SELECT 'official_v3_method_private.operations_v1' AS table_name,(r.operation_id)::text AS primary_key,('')::text AS secondary_key,to_jsonb(r) AS value FROM official_v3_method_private.operations_v1 r), hashes AS (
SELECT table_name,primary_key,secondary_key,encode(sha256(convert_to(value::text,'UTF8')),'hex') AS digest FROM rows
), groups AS (
SELECT expected.name,count(h.primary_key) AS n,COALESCE(string_agg(h.digest,'' ORDER BY h.primary_key COLLATE "C",h.secondary_key COLLATE "C"),'') AS content
FROM (VALUES ('official_v3_method_private.revisions_v1'),('official_v3_method_private.heads_v1'),('official_v3_method_private.operations_v1')) expected(name)
LEFT JOIN hashes h ON h.table_name=expected.name GROUP BY expected.name
)
SELECT encode(sha256(convert_to('bg1-content:hma:v1:'||string_agg(name||':'||n::text||':'||encode(sha256(convert_to(content,'UTF8')),'hex'),'|' ORDER BY name COLLATE "C"),'UTF8')),'hex') FROM groups
$$;
CREATE FUNCTION official_v3_guard_private.fingerprint_s1_v1() RETURNS text
LANGUAGE sql STABLE SECURITY DEFINER SET search_path=pg_catalog SET timezone='UTC' SET datestyle='ISO, YMD' AS $$
WITH rows AS (SELECT 'official_v3_intake_private.operations_v1' AS table_name,(r.operation_id)::text AS primary_key,('')::text AS secondary_key,to_jsonb(r) AS value FROM official_v3_intake_private.operations_v1 r
UNION ALL SELECT 'official_v3_intake_private.reservations_v1' AS table_name,(r.operation_id)::text AS primary_key,(r.generation)::text AS secondary_key,to_jsonb(r) AS value FROM official_v3_intake_private.reservations_v1 r
UNION ALL SELECT 'official_v3_intake_private.completions_v1' AS table_name,(r.operation_id)::text AS primary_key,('')::text AS secondary_key,to_jsonb(r) AS value FROM official_v3_intake_private.completions_v1 r), hashes AS (
SELECT table_name,primary_key,secondary_key,encode(sha256(convert_to(value::text,'UTF8')),'hex') AS digest FROM rows
), groups AS (
SELECT expected.name,count(h.primary_key) AS n,COALESCE(string_agg(h.digest,'' ORDER BY h.primary_key COLLATE "C",h.secondary_key COLLATE "C"),'') AS content
FROM (VALUES ('official_v3_intake_private.operations_v1'),('official_v3_intake_private.reservations_v1'),('official_v3_intake_private.completions_v1')) expected(name)
LEFT JOIN hashes h ON h.table_name=expected.name GROUP BY expected.name
)
SELECT encode(sha256(convert_to('bg1-content:s1:v1:'||string_agg(name||':'||n::text||':'||encode(sha256(convert_to(content,'UTF8')),'hex'),'|' ORDER BY name COLLATE "C"),'UTF8')),'hex') FROM groups
$$;
CREATE FUNCTION official_v3_guard_private.fingerprint_jobs_v1() RETURNS text
LANGUAGE sql STABLE SECURITY DEFINER SET search_path=pg_catalog SET timezone='UTC' SET datestyle='ISO, YMD' AS $$
WITH rows AS (SELECT 'official_v3_jobs_private.subjects_v1' AS table_name,(r.job_key)::text AS primary_key,('')::text AS secondary_key,to_jsonb(r) AS value FROM official_v3_jobs_private.subjects_v1 r
UNION ALL SELECT 'official_v3_jobs_private.queue_operations_v1' AS table_name,(r.operation_id)::text AS primary_key,('')::text AS secondary_key,to_jsonb(r) AS value FROM official_v3_jobs_private.queue_operations_v1 r
UNION ALL SELECT 'official_v3_jobs_private.execution_starts_v1' AS table_name,(r.attempt_key)::text AS primary_key,('')::text AS secondary_key,to_jsonb(r) AS value FROM official_v3_jobs_private.execution_starts_v1 r
UNION ALL SELECT 'official_v3_jobs_private.execution_results_v1' AS table_name,(r.attempt_key)::text AS primary_key,('')::text AS secondary_key,to_jsonb(r) AS value FROM official_v3_jobs_private.execution_results_v1 r
UNION ALL SELECT 'official_v3_jobs_private.execution_dispositions_v1' AS table_name,(r.attempt_key)::text AS primary_key,('')::text AS secondary_key,to_jsonb(r) AS value FROM official_v3_jobs_private.execution_dispositions_v1 r
UNION ALL SELECT 'official_v3_jobs_private.slots_v1' AS table_name,(r.slot_id)::text AS primary_key,('')::text AS secondary_key,to_jsonb(r) AS value FROM official_v3_jobs_private.slots_v1 r
UNION ALL SELECT 'official_v3_jobs_private.catalog_binding_v1' AS table_name,(r.object_identity)::text AS primary_key,('')::text AS secondary_key,to_jsonb(r) AS value FROM official_v3_jobs_private.catalog_binding_v1 r), hashes AS (
SELECT table_name,primary_key,secondary_key,encode(sha256(convert_to(value::text,'UTF8')),'hex') AS digest FROM rows
), groups AS (
SELECT expected.name,count(h.primary_key) AS n,COALESCE(string_agg(h.digest,'' ORDER BY h.primary_key COLLATE "C",h.secondary_key COLLATE "C"),'') AS content
FROM (VALUES ('official_v3_jobs_private.subjects_v1'),('official_v3_jobs_private.queue_operations_v1'),('official_v3_jobs_private.execution_starts_v1'),('official_v3_jobs_private.execution_results_v1'),('official_v3_jobs_private.execution_dispositions_v1'),('official_v3_jobs_private.slots_v1'),('official_v3_jobs_private.catalog_binding_v1')) expected(name)
LEFT JOIN hashes h ON h.table_name=expected.name GROUP BY expected.name
)
SELECT encode(sha256(convert_to('bg1-content:jobs:v1:'||string_agg(name||':'||n::text||':'||encode(sha256(convert_to(content,'UTF8')),'hex'),'|' ORDER BY name COLLATE "C"),'UTF8')),'hex') FROM groups
$$;
CREATE FUNCTION official_v3_guard_private.begin_hma_v1() RETURNS void
LANGUAGE sql VOLATILE SECURITY DEFINER SET search_path=pg_catalog AS $$ SELECT official_v3_guard_private.begin_component_v1('hma') $$;
CREATE FUNCTION official_v3_guard_private.seal_hma_v1() RETURNS void
LANGUAGE sql VOLATILE SECURITY DEFINER SET search_path=pg_catalog AS $$ SELECT official_v3_guard_private.seal_component_v1('hma') $$;
CREATE FUNCTION official_v3_guard_private.begin_s1_v1() RETURNS void
LANGUAGE sql VOLATILE SECURITY DEFINER SET search_path=pg_catalog AS $$ SELECT official_v3_guard_private.begin_component_v1('s1') $$;
CREATE FUNCTION official_v3_guard_private.seal_s1_v1() RETURNS void
LANGUAGE sql VOLATILE SECURITY DEFINER SET search_path=pg_catalog AS $$ SELECT official_v3_guard_private.seal_component_v1('s1') $$;
CREATE FUNCTION official_v3_guard_private.begin_jobs_v1() RETURNS void
LANGUAGE sql VOLATILE SECURITY DEFINER SET search_path=pg_catalog AS $$ SELECT official_v3_guard_private.begin_component_v1('jobs') $$;
CREATE FUNCTION official_v3_guard_private.seal_jobs_v1() RETURNS void
LANGUAGE sql VOLATILE SECURITY DEFINER SET search_path=pg_catalog AS $$ SELECT official_v3_guard_private.seal_component_v1('jobs') $$;
CREATE FUNCTION official_v3_guard_private.allowed_owner_edge_v1(class_value oid,object_value oid,role_value oid,dependency_value "char") RETURNS boolean
LANGUAGE sql STABLE SECURITY DEFINER SET search_path=pg_catalog AS $$
SELECT (class_value='pg_namespace'::regclass AND object_value='official_v3_guard_private'::regnamespace
 AND dependency_value='a' AND role_value IN ('ot_v3_jobs_owner'::regrole,'ot_v3_intake_owner'::regrole,'ot_v3_result_owner'::regrole))
OR (class_value='pg_proc'::regclass AND EXISTS(SELECT 1 FROM (VALUES ('official_v3_guard_private.require_open_v1()','ot_v3_result_owner','a'),('official_v3_guard_private.hrs_catalog_v1()','ot_v3_result_owner','a'),('official_v3_guard_private.open_until_v1()','ot_v3_result_owner','a'),('official_v3_guard_private.jobs_catalog_v1()','ot_v3_jobs_owner','a'),('official_v3_guard_private.intake_retired_v1(text)','ot_v3_result_owner','a'),('official_v3_guard_private.intake_retired_v1(text)','ot_v3_intake_owner','a'),('official_v3_guard_private.attempt_retired_v1(text)','ot_v3_jobs_owner','a'),('official_v3_guard_private.check_s1_v1()','ot_v3_intake_owner','o'),('official_v3_guard_private.check_method_link_v1(jsonb,timestamptz)','ot_v3_jobs_owner','a'),('official_v3_guard_private.check_jobs_v1()','ot_v3_jobs_owner','o'),('official_v3_guard_private.hrs_certificate_v1()','ot_v3_result_owner','o'),('official_v3_guard_private.check_hrs_v1()','ot_v3_result_owner','o'),('official_v3_guard_private.owner_session_v1()','ot_v3_jobs_owner','a'),('official_v3_guard_private.current_method_v1()','ot_v3_result_owner','a'),('official_v3_guard_private.recovery_jobs_v1()','ot_v3_jobs_owner','o'),('official_v3_guard_private.recovery_intake_v1(jsonb)','ot_v3_intake_owner','o'),('official_v3_guard_private.recovery_hrs_v1()','ot_v3_result_owner','o'),('official_v3_guard_private.retired_state_v1(text)','ot_v3_jobs_owner','a'),('official_v3_guard_private.close_jobs_v1(text)','ot_v3_jobs_owner','o'),('official_v3_guard_private.check_retired_jobs_v1(jsonb)','ot_v3_jobs_owner','o'),('official_v3_guard_private.check_retired_s1_v1(jsonb)','ot_v3_intake_owner','o'),('official_v3_guard_private.check_retired_hrs_v1(jsonb)','ot_v3_result_owner','o'),('official_v3_guard_private.ch_de_snapshot_v1(jsonb,integer,timestamptz,text)','ot_v3_result_owner','o'),('official_v3_guard_private.original_valid_v1(jsonb,text,text)','ot_v3_intake_owner','o'),('official_v3_guard_private.original_valid_v1(jsonb,text,text)','ot_v3_intake_owner','a'),('official_v3_guard_private.completion_valid_v1(jsonb,text,integer,integer,uuid,jsonb,jsonb)','ot_v3_intake_owner','o'),('official_v3_guard_private.completion_valid_v1(jsonb,text,integer,integer,uuid,jsonb,jsonb)','ot_v3_intake_owner','a'),('official_v3_guard_private.fingerprint_s1_v1()','ot_v3_intake_owner','o'),('official_v3_guard_private.fingerprint_jobs_v1()','ot_v3_jobs_owner','o'),('official_v3_guard_private.begin_s1_v1()','ot_v3_intake_owner','a'),('official_v3_guard_private.seal_s1_v1()','ot_v3_intake_owner','a'),('official_v3_guard_private.begin_jobs_v1()','ot_v3_jobs_owner','a'),('official_v3_guard_private.seal_jobs_v1()','ot_v3_jobs_owner','a'),('official_v3_guard_private.allowed_owner_edge_v1(oid,oid,oid,"char")','ot_v3_jobs_owner','a'),('official_v3_guard_private.allowed_owner_edge_v1(oid,oid,oid,"char")','ot_v3_intake_owner','a')) allowed(signature,role_name,kind)
 WHERE object_value=to_regprocedure(allowed.signature) AND role_value=to_regrole(allowed.role_name) AND dependency_value::text=allowed.kind))
$$;
GRANT USAGE,CREATE ON SCHEMA official_v3_guard_private TO ot_v3_result_owner,ot_v3_jobs_owner,ot_v3_intake_owner;
ALTER FUNCTION official_v3_guard_private.check_s1_v1() OWNER TO ot_v3_intake_owner;
ALTER FUNCTION official_v3_guard_private.check_jobs_v1() OWNER TO ot_v3_jobs_owner;
ALTER FUNCTION official_v3_guard_private.hrs_certificate_v1() OWNER TO ot_v3_result_owner;
ALTER FUNCTION official_v3_guard_private.check_hrs_v1() OWNER TO ot_v3_result_owner;
ALTER FUNCTION official_v3_guard_private.recovery_jobs_v1() OWNER TO ot_v3_jobs_owner;
ALTER FUNCTION official_v3_guard_private.recovery_intake_v1(jsonb) OWNER TO ot_v3_intake_owner;
ALTER FUNCTION official_v3_guard_private.recovery_hrs_v1() OWNER TO ot_v3_result_owner;
ALTER FUNCTION official_v3_guard_private.close_jobs_v1(text) OWNER TO ot_v3_jobs_owner;
ALTER FUNCTION official_v3_guard_private.check_retired_jobs_v1(jsonb) OWNER TO ot_v3_jobs_owner;
ALTER FUNCTION official_v3_guard_private.check_retired_s1_v1(jsonb) OWNER TO ot_v3_intake_owner;
ALTER FUNCTION official_v3_guard_private.check_retired_hrs_v1(jsonb) OWNER TO ot_v3_result_owner;
ALTER FUNCTION official_v3_guard_private.ch_de_snapshot_v1(jsonb,integer,timestamptz,text) OWNER TO ot_v3_result_owner;
ALTER FUNCTION official_v3_guard_private.original_valid_v1(jsonb,text,text) OWNER TO ot_v3_intake_owner;
ALTER FUNCTION official_v3_guard_private.completion_valid_v1(jsonb,text,integer,integer,uuid,jsonb,jsonb) OWNER TO ot_v3_intake_owner;
ALTER FUNCTION official_v3_guard_private.fingerprint_s1_v1() OWNER TO ot_v3_intake_owner;
ALTER FUNCTION official_v3_guard_private.fingerprint_jobs_v1() OWNER TO ot_v3_jobs_owner;
REVOKE ALL ON FUNCTION official_v3_guard_private.immutable_v1() FROM PUBLIC,anon,authenticated,service_role,supabase_read_only_user;
REVOKE ALL ON FUNCTION official_v3_guard_private.require_open_v1() FROM PUBLIC,anon,authenticated,service_role,supabase_read_only_user;
REVOKE ALL ON FUNCTION official_v3_guard_private.check_control_v1() FROM PUBLIC,anon,authenticated,service_role,supabase_read_only_user;
REVOKE ALL ON FUNCTION official_v3_guard_private.hrs_catalog_v1() FROM PUBLIC,anon,authenticated,service_role,supabase_read_only_user;
REVOKE ALL ON FUNCTION official_v3_guard_private.open_until_v1() FROM PUBLIC,anon,authenticated,service_role,supabase_read_only_user;
REVOKE ALL ON FUNCTION official_v3_guard_private.jobs_catalog_v1() FROM PUBLIC,anon,authenticated,service_role,supabase_read_only_user;
REVOKE ALL ON FUNCTION official_v3_guard_private.intake_retired_v1(text) FROM PUBLIC,anon,authenticated,service_role,supabase_read_only_user;
REVOKE ALL ON FUNCTION official_v3_guard_private.attempt_retired_v1(text) FROM PUBLIC,anon,authenticated,service_role,supabase_read_only_user;
REVOKE ALL ON FUNCTION official_v3_guard_private.alarm_status_v1() FROM PUBLIC,anon,authenticated,service_role,supabase_read_only_user;
REVOKE ALL ON FUNCTION official_v3_guard_private.catalog_v1() FROM PUBLIC,anon,authenticated,service_role,supabase_read_only_user;
REVOKE ALL ON FUNCTION official_v3_guard_private.assert_catalog_v1() FROM PUBLIC,anon,authenticated,service_role,supabase_read_only_user;
REVOKE ALL ON FUNCTION official_v3_guard_private.check_hma_v1() FROM PUBLIC,anon,authenticated,service_role,supabase_read_only_user;
SET LOCAL ROLE ot_v3_intake_owner;
REVOKE ALL ON FUNCTION official_v3_guard_private.check_s1_v1() FROM PUBLIC,anon,authenticated,service_role,supabase_read_only_user;
RESET ROLE;
REVOKE ALL ON FUNCTION official_v3_guard_private.check_method_link_v1(jsonb,timestamptz) FROM PUBLIC,anon,authenticated,service_role,supabase_read_only_user;
SET LOCAL ROLE ot_v3_jobs_owner;
REVOKE ALL ON FUNCTION official_v3_guard_private.check_jobs_v1() FROM PUBLIC,anon,authenticated,service_role,supabase_read_only_user;
RESET ROLE;
SET LOCAL ROLE ot_v3_result_owner;
REVOKE ALL ON FUNCTION official_v3_guard_private.hrs_certificate_v1() FROM PUBLIC,anon,authenticated,service_role,supabase_read_only_user;
RESET ROLE;
SET LOCAL ROLE ot_v3_result_owner;
REVOKE ALL ON FUNCTION official_v3_guard_private.check_hrs_v1() FROM PUBLIC,anon,authenticated,service_role,supabase_read_only_user;
RESET ROLE;
REVOKE ALL ON FUNCTION official_v3_guard_private.content_digest_v1(text) FROM PUBLIC,anon,authenticated,service_role,supabase_read_only_user;
REVOKE ALL ON FUNCTION official_v3_guard_private.check_certificate_v1(text) FROM PUBLIC,anon,authenticated,service_role,supabase_read_only_user;
REVOKE ALL ON FUNCTION official_v3_guard_private.check_certificates_v1() FROM PUBLIC,anon,authenticated,service_role,supabase_read_only_user;
REVOKE ALL ON FUNCTION official_v3_guard_private.begin_component_v1(text) FROM PUBLIC,anon,authenticated,service_role,supabase_read_only_user;
REVOKE ALL ON FUNCTION official_v3_guard_private.seal_component_v1(text) FROM PUBLIC,anon,authenticated,service_role,supabase_read_only_user;
REVOKE ALL ON FUNCTION official_v3_guard_private.owner_session_v1() FROM PUBLIC,anon,authenticated,service_role,supabase_read_only_user;
REVOKE ALL ON FUNCTION official_v3_guard_private.current_method_v1() FROM PUBLIC,anon,authenticated,service_role,supabase_read_only_user;
REVOKE ALL ON FUNCTION official_v3_guard_private.fixed_method_v1() FROM PUBLIC,anon,authenticated,service_role,supabase_read_only_user;
SET LOCAL ROLE ot_v3_jobs_owner;
REVOKE ALL ON FUNCTION official_v3_guard_private.recovery_jobs_v1() FROM PUBLIC,anon,authenticated,service_role,supabase_read_only_user;
RESET ROLE;
SET LOCAL ROLE ot_v3_intake_owner;
REVOKE ALL ON FUNCTION official_v3_guard_private.recovery_intake_v1(jsonb) FROM PUBLIC,anon,authenticated,service_role,supabase_read_only_user;
RESET ROLE;
SET LOCAL ROLE ot_v3_result_owner;
REVOKE ALL ON FUNCTION official_v3_guard_private.recovery_hrs_v1() FROM PUBLIC,anon,authenticated,service_role,supabase_read_only_user;
RESET ROLE;
REVOKE ALL ON FUNCTION official_v3_guard_private.recovery_snapshot_v1() FROM PUBLIC,anon,authenticated,service_role,supabase_read_only_user;
REVOKE ALL ON FUNCTION official_v3_guard_private.retired_state_v1(text) FROM PUBLIC,anon,authenticated,service_role,supabase_read_only_user;
SET LOCAL ROLE ot_v3_jobs_owner;
REVOKE ALL ON FUNCTION official_v3_guard_private.close_jobs_v1(text) FROM PUBLIC,anon,authenticated,service_role,supabase_read_only_user;
RESET ROLE;
SET LOCAL ROLE ot_v3_jobs_owner;
REVOKE ALL ON FUNCTION official_v3_guard_private.check_retired_jobs_v1(jsonb) FROM PUBLIC,anon,authenticated,service_role,supabase_read_only_user;
RESET ROLE;
SET LOCAL ROLE ot_v3_intake_owner;
REVOKE ALL ON FUNCTION official_v3_guard_private.check_retired_s1_v1(jsonb) FROM PUBLIC,anon,authenticated,service_role,supabase_read_only_user;
RESET ROLE;
SET LOCAL ROLE ot_v3_result_owner;
REVOKE ALL ON FUNCTION official_v3_guard_private.check_retired_hrs_v1(jsonb) FROM PUBLIC,anon,authenticated,service_role,supabase_read_only_user;
RESET ROLE;
REVOKE ALL ON FUNCTION official_v3_guard_private.check_retirements_v1() FROM PUBLIC,anon,authenticated,service_role,supabase_read_only_user;
REVOKE ALL ON FUNCTION official_v3_guard_private.incident_snapshot_v1() FROM PUBLIC,anon,authenticated,service_role,supabase_read_only_user;
REVOKE ALL ON FUNCTION public.official_v3_guard_review_v1() FROM PUBLIC,anon,authenticated,service_role,supabase_read_only_user;
REVOKE ALL ON FUNCTION public.official_v3_guard_retire_v1(text,text) FROM PUBLIC,anon,authenticated,service_role,supabase_read_only_user;
REVOKE ALL ON FUNCTION public.official_v3_guard_resume_v1(text,text) FROM PUBLIC,anon,authenticated,service_role,supabase_read_only_user;
REVOKE ALL ON FUNCTION public.official_v3_guard_confirm_v1(text,text,text) FROM PUBLIC,anon,authenticated,service_role,supabase_read_only_user;
SET LOCAL ROLE ot_v3_result_owner;
REVOKE ALL ON FUNCTION official_v3_guard_private.ch_de_snapshot_v1(jsonb,integer,timestamptz,text) FROM PUBLIC,anon,authenticated,service_role,supabase_read_only_user;
RESET ROLE;
REVOKE ALL ON FUNCTION official_v3_guard_private.latch_incident_v1(timestamptz,text) FROM PUBLIC,anon,authenticated,service_role,supabase_read_only_user;
REVOKE ALL ON FUNCTION official_v3_guard_private.audit_v1() FROM PUBLIC,anon,authenticated,service_role,supabase_read_only_user;
SET LOCAL ROLE ot_v3_intake_owner;
REVOKE ALL ON FUNCTION official_v3_guard_private.original_valid_v1(jsonb,text,text) FROM PUBLIC,anon,authenticated,service_role,supabase_read_only_user;
RESET ROLE;
SET LOCAL ROLE ot_v3_intake_owner;
REVOKE ALL ON FUNCTION official_v3_guard_private.completion_valid_v1(jsonb,text,integer,integer,uuid,jsonb,jsonb) FROM PUBLIC,anon,authenticated,service_role,supabase_read_only_user;
RESET ROLE;
REVOKE ALL ON FUNCTION official_v3_guard_private.fingerprint_hma_v1() FROM PUBLIC,anon,authenticated,service_role,supabase_read_only_user;
SET LOCAL ROLE ot_v3_intake_owner;
REVOKE ALL ON FUNCTION official_v3_guard_private.fingerprint_s1_v1() FROM PUBLIC,anon,authenticated,service_role,supabase_read_only_user;
RESET ROLE;
SET LOCAL ROLE ot_v3_jobs_owner;
REVOKE ALL ON FUNCTION official_v3_guard_private.fingerprint_jobs_v1() FROM PUBLIC,anon,authenticated,service_role,supabase_read_only_user;
RESET ROLE;
REVOKE ALL ON FUNCTION official_v3_guard_private.begin_hma_v1() FROM PUBLIC,anon,authenticated,service_role,supabase_read_only_user;
REVOKE ALL ON FUNCTION official_v3_guard_private.seal_hma_v1() FROM PUBLIC,anon,authenticated,service_role,supabase_read_only_user;
REVOKE ALL ON FUNCTION official_v3_guard_private.begin_s1_v1() FROM PUBLIC,anon,authenticated,service_role,supabase_read_only_user;
REVOKE ALL ON FUNCTION official_v3_guard_private.seal_s1_v1() FROM PUBLIC,anon,authenticated,service_role,supabase_read_only_user;
REVOKE ALL ON FUNCTION official_v3_guard_private.begin_jobs_v1() FROM PUBLIC,anon,authenticated,service_role,supabase_read_only_user;
REVOKE ALL ON FUNCTION official_v3_guard_private.seal_jobs_v1() FROM PUBLIC,anon,authenticated,service_role,supabase_read_only_user;
REVOKE ALL ON FUNCTION official_v3_guard_private.allowed_owner_edge_v1(oid,oid,oid,"char") FROM PUBLIC,anon,authenticated,service_role,supabase_read_only_user;
GRANT EXECUTE ON FUNCTION official_v3_guard_private.require_open_v1() TO ot_v3_result_owner;
GRANT EXECUTE ON FUNCTION official_v3_guard_private.open_until_v1() TO ot_v3_result_owner;
GRANT EXECUTE ON FUNCTION official_v3_guard_private.current_method_v1() TO ot_v3_result_owner;
GRANT EXECUTE ON FUNCTION official_v3_guard_private.hrs_catalog_v1() TO ot_v3_result_owner;
GRANT EXECUTE ON FUNCTION official_v3_guard_private.intake_retired_v1(text) TO ot_v3_result_owner;
GRANT EXECUTE ON FUNCTION official_v3_guard_private.begin_jobs_v1() TO ot_v3_jobs_owner;
GRANT EXECUTE ON FUNCTION official_v3_guard_private.seal_jobs_v1() TO ot_v3_jobs_owner;
GRANT EXECUTE ON FUNCTION official_v3_guard_private.jobs_catalog_v1() TO ot_v3_jobs_owner;
GRANT EXECUTE ON FUNCTION official_v3_guard_private.allowed_owner_edge_v1(oid,oid,oid,"char") TO ot_v3_jobs_owner;
GRANT EXECUTE ON FUNCTION official_v3_guard_private.attempt_retired_v1(text) TO ot_v3_jobs_owner;
GRANT EXECUTE ON FUNCTION official_v3_guard_private.owner_session_v1() TO ot_v3_jobs_owner;
GRANT EXECUTE ON FUNCTION official_v3_guard_private.retired_state_v1(text) TO ot_v3_jobs_owner;
GRANT EXECUTE ON FUNCTION official_v3_guard_private.check_method_link_v1(jsonb,timestamptz) TO ot_v3_jobs_owner;
GRANT EXECUTE ON FUNCTION official_v3_guard_private.begin_s1_v1() TO ot_v3_intake_owner;
GRANT EXECUTE ON FUNCTION official_v3_guard_private.seal_s1_v1() TO ot_v3_intake_owner;
GRANT EXECUTE ON FUNCTION official_v3_guard_private.intake_retired_v1(text) TO ot_v3_intake_owner;
GRANT EXECUTE ON FUNCTION official_v3_guard_private.allowed_owner_edge_v1(oid,oid,oid,"char") TO ot_v3_intake_owner;
SET LOCAL ROLE ot_v3_intake_owner;
GRANT EXECUTE ON FUNCTION official_v3_guard_private.original_valid_v1(jsonb,text,text) TO ot_v3_intake_owner;
RESET ROLE;
SET LOCAL ROLE ot_v3_intake_owner;
GRANT EXECUTE ON FUNCTION official_v3_guard_private.completion_valid_v1(jsonb,text,integer,integer,uuid,jsonb,jsonb) TO ot_v3_intake_owner;
RESET ROLE;
SET LOCAL ROLE ot_v3_intake_owner;
GRANT EXECUTE ON FUNCTION official_v3_guard_private.check_s1_v1() TO postgres;
RESET ROLE;
SET LOCAL ROLE ot_v3_jobs_owner;
GRANT EXECUTE ON FUNCTION official_v3_guard_private.check_jobs_v1() TO postgres;
RESET ROLE;
SET LOCAL ROLE ot_v3_result_owner;
GRANT EXECUTE ON FUNCTION official_v3_guard_private.hrs_certificate_v1() TO postgres;
RESET ROLE;
SET LOCAL ROLE ot_v3_result_owner;
GRANT EXECUTE ON FUNCTION official_v3_guard_private.check_hrs_v1() TO postgres;
RESET ROLE;
SET LOCAL ROLE ot_v3_jobs_owner;
GRANT EXECUTE ON FUNCTION official_v3_guard_private.recovery_jobs_v1() TO postgres;
RESET ROLE;
SET LOCAL ROLE ot_v3_intake_owner;
GRANT EXECUTE ON FUNCTION official_v3_guard_private.recovery_intake_v1(jsonb) TO postgres;
RESET ROLE;
SET LOCAL ROLE ot_v3_result_owner;
GRANT EXECUTE ON FUNCTION official_v3_guard_private.recovery_hrs_v1() TO postgres;
RESET ROLE;
SET LOCAL ROLE ot_v3_jobs_owner;
GRANT EXECUTE ON FUNCTION official_v3_guard_private.close_jobs_v1(text) TO postgres;
RESET ROLE;
SET LOCAL ROLE ot_v3_jobs_owner;
GRANT EXECUTE ON FUNCTION official_v3_guard_private.check_retired_jobs_v1(jsonb) TO postgres;
RESET ROLE;
SET LOCAL ROLE ot_v3_intake_owner;
GRANT EXECUTE ON FUNCTION official_v3_guard_private.check_retired_s1_v1(jsonb) TO postgres;
RESET ROLE;
SET LOCAL ROLE ot_v3_result_owner;
GRANT EXECUTE ON FUNCTION official_v3_guard_private.check_retired_hrs_v1(jsonb) TO postgres;
RESET ROLE;
SET LOCAL ROLE ot_v3_result_owner;
GRANT EXECUTE ON FUNCTION official_v3_guard_private.ch_de_snapshot_v1(jsonb,integer,timestamptz,text) TO postgres;
RESET ROLE;
SET LOCAL ROLE ot_v3_intake_owner;
GRANT EXECUTE ON FUNCTION official_v3_guard_private.original_valid_v1(jsonb,text,text) TO postgres;
RESET ROLE;
SET LOCAL ROLE ot_v3_intake_owner;
GRANT EXECUTE ON FUNCTION official_v3_guard_private.completion_valid_v1(jsonb,text,integer,integer,uuid,jsonb,jsonb) TO postgres;
RESET ROLE;
SET LOCAL ROLE ot_v3_intake_owner;
GRANT EXECUTE ON FUNCTION official_v3_guard_private.fingerprint_s1_v1() TO postgres;
RESET ROLE;
SET LOCAL ROLE ot_v3_jobs_owner;
GRANT EXECUTE ON FUNCTION official_v3_guard_private.fingerprint_jobs_v1() TO postgres;
RESET ROLE;
SET LOCAL ROLE postgres;
CREATE OR REPLACE FUNCTION official_v3_method_api.confirm_operation_v1(
  p_operation_id text,p_action text,p_method_id text,p_revision integer,
  p_method_digest text,p_package_digest text,p_predecessor_revision integer,
  p_expected_revision integer,p_expected_method_digest text,p_expected_package_digest text,
  p_expected_epoch integer,p_expected_status text,p_approval_mode text,p_approval_until text
) RETURNS jsonb LANGUAGE plpgsql VOLATILE PARALLEL UNSAFE SECURITY DEFINER
SET search_path=pg_catalog  AS $bg1_body$
DECLARE command jsonb; actor uuid; op official_v3_method_private.operations_v1%ROWTYPE;
BEGIN
  command:=official_v3_method_private.command_v1(p_operation_id,p_action,p_method_id,p_revision,p_method_digest,
    p_package_digest,p_predecessor_revision,p_expected_revision,p_expected_method_digest,p_expected_package_digest,
    p_expected_epoch,p_expected_status,p_approval_mode,p_approval_until);
  PERFORM jetnity_ot_auth.require_current_owner_session_v1();
  PERFORM official_v3_guard_private.begin_hma_v1();
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
END $bg1_body$;
RESET ROLE;
SET LOCAL ROLE postgres;
CREATE OR REPLACE FUNCTION official_v3_method_api.stage_draft_v1(
  p_operation_id text,p_method_id text,p_revision integer,p_method_digest text,p_package_digest text,p_predecessor_revision integer
) RETURNS jsonb LANGUAGE plpgsql VOLATILE PARALLEL UNSAFE SECURITY DEFINER
SET search_path=pg_catalog  AS $bg1_body$
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
  PERFORM official_v3_guard_private.seal_hma_v1();
  PERFORM jetnity_ot_auth.require_current_owner_session_v1();
  RETURN pg_catalog.jsonb_build_object('status','recorded','operationId',op.operation_id,'action',op.action,
    'command',op.command,'actorId',op.actor_id,'recordedAt',pg_catalog.to_char(op.recorded_at AT TIME ZONE 'UTC','YYYY-MM-DD"T"HH24:MI:SS.US"Z"'),
    'before',op.before_state,'after',op.after_state);
END $bg1_body$;
RESET ROLE;
SET LOCAL ROLE postgres;
CREATE OR REPLACE FUNCTION official_v3_method_api.approve_v1(
  p_operation_id text,p_method_id text,p_revision integer,p_method_digest text,p_package_digest text,
  p_expected_revision integer,p_expected_method_digest text,p_expected_package_digest text,p_expected_epoch integer,
  p_expected_status text,p_approval_mode text,p_approval_until text
) RETURNS jsonb LANGUAGE plpgsql VOLATILE PARALLEL UNSAFE SECURITY DEFINER
SET search_path=pg_catalog  AS $bg1_body$
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
  PERFORM official_v3_guard_private.seal_hma_v1();
  PERFORM jetnity_ot_auth.require_current_owner_session_v1();
  RETURN pg_catalog.jsonb_build_object('status','recorded','operationId',op.operation_id,'action',op.action,
    'command',op.command,'actorId',op.actor_id,'recordedAt',pg_catalog.to_char(op.recorded_at AT TIME ZONE 'UTC','YYYY-MM-DD"T"HH24:MI:SS.US"Z"'),
    'before',op.before_state,'after',op.after_state);
END $bg1_body$;
RESET ROLE;
SET LOCAL ROLE postgres;
CREATE OR REPLACE FUNCTION official_v3_method_api.revoke_v1(
  p_operation_id text,p_method_id text,p_revision integer,p_method_digest text,p_package_digest text,p_expected_epoch integer
) RETURNS jsonb LANGUAGE plpgsql VOLATILE PARALLEL UNSAFE SECURITY DEFINER
SET search_path=pg_catalog  AS $bg1_body$
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
  PERFORM official_v3_guard_private.seal_hma_v1();
  PERFORM jetnity_ot_auth.require_current_owner_session_v1();
  RETURN pg_catalog.jsonb_build_object('status','recorded','operationId',op.operation_id,'action',op.action,
    'command',op.command,'actorId',op.actor_id,'recordedAt',pg_catalog.to_char(op.recorded_at AT TIME ZONE 'UTC','YYYY-MM-DD"T"HH24:MI:SS.US"Z"'),
    'before',op.before_state,'after',op.after_state);
END $bg1_body$;
RESET ROLE;
SET LOCAL ROLE ot_v3_intake_owner;
CREATE OR REPLACE FUNCTION official_v3_intake_api.capture_v1(p_binding jsonb, p_original text, p_digest text) RETURNS jsonb
LANGUAGE plpgsql SECURITY DEFINER SET search_path = pg_catalog  AS $bg1_body$
DECLARE proposal jsonb; original bytea; held official_v3_intake_private.operations_v1%ROWTYPE;
BEGIN
  PERFORM official_v3_guard_private.begin_s1_v1();
  IF official_v3_guard_private.intake_retired_v1(p_binding->>'operationId') THEN RETURN jsonb_build_object('status','unconfirmed'); END IF;
  IF official_v3_intake_private.binding_valid_v1(p_binding) IS NOT TRUE OR p_original IS NULL
    OR octet_length(p_original) NOT BETWEEN 1 AND 65536 OR p_digest IS NULL OR p_digest !~ '^[a-f0-9]{64}$' THEN
    RETURN jsonb_build_object('status','invalid');
  END IF;
  original := convert_to(p_original, 'UTF8');
  IF encode(sha256(original),'hex') <> p_digest THEN RETURN jsonb_build_object('status','invalid'); END IF;
  BEGIN
    IF official_v3_intake_private.unique_json_v1(p_original::json) IS NOT TRUE THEN RETURN jsonb_build_object('status','invalid'); END IF;
    proposal := p_original::jsonb;
  EXCEPTION WHEN invalid_text_representation OR untranslatable_character OR numeric_value_out_of_range THEN RETURN jsonb_build_object('status','invalid'); END;
  IF official_v3_intake_private.exact_keys_v1(proposal, ARRAY['schema','kind','jobId','operationId','context','contextKey','research','proposedFact','references']) IS NOT TRUE
    OR official_v3_intake_private.proposal_retainable_v1(proposal) IS NOT TRUE
    OR official_v3_intake_private.safe_data_v1(proposal) IS NOT TRUE OR proposal->'schema' IS DISTINCT FROM '3'::jsonb
    OR proposal->>'kind' IS DISTINCT FROM 'untrusted_research_proposal'
    OR proposal->>'operationId' IS DISTINCT FROM p_binding->>'operationId'
    OR proposal->>'jobId' IS DISTINCT FROM p_binding->>'jobId' OR proposal->>'contextKey' IS DISTINCT FROM p_binding->>'contextKey' THEN
    RETURN jsonb_build_object('status','invalid');
  END IF;
  INSERT INTO official_v3_intake_private.operations_v1(operation_id,binding,original_bytes,proposal_digest)
    VALUES(p_binding->>'operationId',p_binding,original,p_digest) ON CONFLICT(operation_id) DO NOTHING;
  SELECT * INTO held FROM official_v3_intake_private.operations_v1 WHERE operation_id = p_binding->>'operationId' FOR UPDATE;
  IF held.binding <> p_binding OR held.original_bytes <> original OR held.proposal_digest <> p_digest THEN
    RETURN jsonb_build_object('status','collision');
  END IF;
  PERFORM official_v3_guard_private.seal_s1_v1();
  RETURN jsonb_build_object('status','recorded','record',official_v3_intake_private.record_v1(held.operation_id));
END $bg1_body$;
RESET ROLE;
SET LOCAL ROLE ot_v3_intake_owner;
CREATE OR REPLACE FUNCTION official_v3_intake_api.reserve_v1(p_binding jsonb, p_digest text, p_bytes integer, p_lease_ms integer) RETURNS jsonb
LANGUAGE plpgsql SECURITY DEFINER SET search_path = pg_catalog  AS $bg1_body$
DECLARE held official_v3_intake_private.operations_v1%ROWTYPE; acquired timestamptz; expires timestamptz; ticket uuid;
BEGIN
  PERFORM official_v3_guard_private.begin_s1_v1();
  IF official_v3_guard_private.intake_retired_v1(p_binding->>'operationId') THEN RETURN jsonb_build_object('status','unconfirmed'); END IF;
  IF official_v3_intake_private.binding_valid_v1(p_binding) IS NOT TRUE OR p_digest IS NULL OR p_digest !~ '^[a-f0-9]{64}$'
    OR p_bytes IS NULL OR p_bytes NOT BETWEEN 1 AND 65536 OR p_lease_ms IS NULL OR p_lease_ms NOT BETWEEN 1 AND 900000 THEN
    RETURN jsonb_build_object('status','invalid');
  END IF;
  SELECT * INTO held FROM official_v3_intake_private.operations_v1 WHERE operation_id = p_binding->>'operationId' FOR UPDATE;
  IF NOT FOUND THEN RETURN jsonb_build_object('status','not_attempted'); END IF;
  IF held.binding <> p_binding OR held.proposal_digest <> p_digest OR octet_length(held.original_bytes) <> p_bytes THEN
    RETURN jsonb_build_object('status','collision');
  END IF;
  IF EXISTS(SELECT 1 FROM official_v3_intake_private.completions_v1 WHERE operation_id = held.operation_id) THEN
    RETURN jsonb_build_object('status','completed','record',official_v3_intake_private.record_v1(held.operation_id));
  END IF;
  acquired := clock_timestamp();
  IF held.expires_at > acquired THEN RETURN jsonb_build_object('status','busy'); END IF;
  IF held.generation >= 2147483646 THEN RETURN jsonb_build_object('status','unavailable'); END IF;
  expires := acquired + p_lease_ms * interval '1 millisecond'; ticket := gen_random_uuid();
  UPDATE official_v3_intake_private.operations_v1 SET generation = held.generation + 1,
    lease_token = ticket, acquired_at = acquired, expires_at = expires WHERE operation_id = held.operation_id;
  INSERT INTO official_v3_intake_private.reservations_v1 VALUES(held.operation_id, held.generation + 1, ticket, acquired, expires);
  PERFORM official_v3_guard_private.seal_s1_v1();
  IF clock_timestamp() >= expires THEN RAISE EXCEPTION USING ERRCODE = 'P7302', MESSAGE = 'intake_lease_elapsed'; END IF;
  RETURN jsonb_build_object('status','acquired', 'generation', held.generation + 1, 'leaseToken', ticket::text,
    'acquiredAt', to_char(acquired AT TIME ZONE 'UTC','YYYY-MM-DD"T"HH24:MI:SS.MS"Z"'),
    'expiresAt', to_char(expires AT TIME ZONE 'UTC','YYYY-MM-DD"T"HH24:MI:SS.MS"Z"'),
    'record',official_v3_intake_private.record_v1(held.operation_id));
END $bg1_body$;
RESET ROLE;
SET LOCAL ROLE ot_v3_intake_owner;
CREATE OR REPLACE FUNCTION official_v3_intake_api.finish_v1(p_binding jsonb, p_digest text, p_bytes integer,
  p_generation integer, p_token uuid, p_outcome jsonb, p_audit jsonb) RETURNS jsonb
LANGUAGE plpgsql SECURITY DEFINER SET search_path = pg_catalog  AS $bg1_body$
DECLARE held official_v3_intake_private.operations_v1%ROWTYPE; finished official_v3_intake_private.completions_v1%ROWTYPE;
  decision jsonb; expected_key text; now_at timestamptz; shape jsonb := official_v3_intake_private.proposal_shape_v1();
BEGIN
  PERFORM official_v3_guard_private.begin_s1_v1();
  IF official_v3_guard_private.intake_retired_v1(p_binding->>'operationId') THEN RETURN jsonb_build_object('status','unconfirmed'); END IF;
  IF official_v3_intake_private.binding_valid_v1(p_binding) IS NOT TRUE OR p_digest IS NULL OR p_digest !~ '^[a-f0-9]{64}$'
    OR p_bytes IS NULL OR p_bytes NOT BETWEEN 1 AND 65536 OR p_generation IS NULL OR p_generation NOT BETWEEN 1 AND 2147483646
    OR p_token IS NULL OR p_outcome IS NULL OR p_audit IS NULL OR octet_length(p_outcome::text) > 524288 OR octet_length(p_audit::text) > 8192
    OR official_v3_intake_private.safe_data_v1(p_outcome) IS NOT TRUE OR official_v3_intake_private.safe_data_v1(p_audit) IS NOT TRUE THEN
    RETURN jsonb_build_object('status','unconfirmed');
  END IF;
  IF official_v3_intake_private.data_nodes_v1(p_outcome,0,24,65536) < 0
    OR official_v3_intake_private.data_nodes_v1(p_audit) < 0
    OR official_v3_intake_private.shape_matches_v1(p_outcome,shape->'definitions'->'outcome',shape->'definitions',shape->'countries') IS NOT TRUE
    OR official_v3_intake_private.shape_matches_v1(p_audit,shape->'definitions'->'audit',shape->'definitions',shape->'countries') IS NOT TRUE THEN
    RETURN jsonb_build_object('status','unconfirmed');
  END IF;
  IF official_v3_intake_private.exact_keys_v1(p_audit, ARRAY['schema','kind','operationId','proposalDigest','jobId','contextKey','method','recordedAt','result','decisionRef','escalationKey']) IS NOT TRUE
    OR p_audit->'schema' IS DISTINCT FROM '3'::jsonb OR p_audit->>'kind' IS DISTINCT FROM 'import_attempt_record'
    OR p_audit->>'operationId' IS DISTINCT FROM p_binding->>'operationId' OR p_audit->>'jobId' IS DISTINCT FROM p_binding->>'jobId'
    OR p_audit->>'contextKey' IS DISTINCT FROM p_binding->>'contextKey' OR p_audit->'method' IS DISTINCT FROM p_binding->'method'
    OR p_audit->>'proposalDigest' IS DISTINCT FROM p_digest OR p_audit->>'result' IS DISTINCT FROM p_outcome->>'status'
    OR (p_audit->>'recordedAt' ~ '^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}\.\d{3}Z$') IS NOT TRUE THEN
    RETURN jsonb_build_object('status','unconfirmed');
  END IF;
  IF p_outcome->>'status' = 'prepared' THEN
    IF official_v3_intake_private.exact_keys_v1(p_outcome, ARRAY['status','value']) IS NOT TRUE
      OR official_v3_intake_private.exact_keys_v1(p_outcome->'value', ARRAY['proposalDigest','decision','previousDecision','archiveAppend','version','transition','proposalDisposition','acceptance','reproof']) IS NOT TRUE
      OR p_outcome->'value'->>'proposalDigest' IS DISTINCT FROM p_digest
      OR (p_outcome->'value'->>'proposalDisposition' IN ('matched','superseded_by_source')) IS NOT TRUE
      OR (jsonb_typeof(p_outcome->'value'->'previousDecision') IN ('null','object')) IS NOT TRUE
      OR (jsonb_typeof(p_outcome->'value'->'archiveAppend') IN ('null','object')) IS NOT TRUE
      OR jsonb_typeof(p_outcome->'value'->'version') IS DISTINCT FROM 'object'
      OR jsonb_typeof(p_outcome->'value'->'transition') IS DISTINCT FROM 'object'
      OR p_outcome->'value'->>'acceptance' IS DISTINCT FROM 'not_committed'
      OR p_outcome->'value'->>'reproof' IS DISTINCT FROM 'required_before_commit' THEN RETURN jsonb_build_object('status','unconfirmed'); END IF;
    decision := p_outcome->'value'->'decision';
  ELSIF p_outcome->>'status' = 'escalation' THEN
    IF official_v3_intake_private.exact_keys_v1(p_outcome, ARRAY['status','key','reason','decision','previousDecision','archiveAppend']) IS NOT TRUE
      OR (p_outcome->>'key' ~ '^source-escalation:v3:[a-f0-9]{64}$') IS NOT TRUE
      OR (p_outcome->>'reason' IN ('primary_unclear','comparable_conflict')) IS NOT TRUE
      OR (jsonb_typeof(p_outcome->'previousDecision') IN ('null','object')) IS NOT TRUE
      OR (jsonb_typeof(p_outcome->'archiveAppend') IN ('null','object')) IS NOT TRUE THEN RETURN jsonb_build_object('status','unconfirmed'); END IF;
    decision := p_outcome->'decision'; expected_key := p_outcome->>'key';
  ELSIF p_outcome->>'status' IN ('quarantined','unavailable') THEN
    IF official_v3_intake_private.exact_keys_v1(p_outcome, ARRAY['status','reason']) IS NOT TRUE
      OR (p_outcome->>'status' = 'quarantined' AND (p_outcome->>'reason' IN ('conditions_unresolved','invalid_verification','history_changed','method_not_current')) IS NOT TRUE)
      OR (p_outcome->>'status' = 'unavailable' AND (p_outcome->>'reason' IN ('method_not_approved','method_unavailable','verification_unavailable','history_unavailable','aborted','temporary_failure')) IS NOT TRUE) THEN
      RETURN jsonb_build_object('status','unconfirmed'); END IF;
  ELSE RETURN jsonb_build_object('status','unconfirmed'); END IF;
  IF p_audit->>'decisionRef' IS DISTINCT FROM decision->>'reference' OR p_audit->>'escalationKey' IS DISTINCT FROM expected_key
    OR (p_outcome->>'status' IN ('prepared','escalation') AND (
      jsonb_typeof(decision) IS DISTINCT FROM 'object'
      OR (decision->>'reference' ~ '^source-decision:v3:[a-f0-9]{64}$') IS NOT TRUE
      OR decision->>'contextKey' IS DISTINCT FROM p_binding->>'contextKey' OR decision->'method' IS DISTINCT FROM p_binding->'method')) THEN
    RETURN jsonb_build_object('status','unconfirmed');
  END IF;
  SELECT * INTO held FROM official_v3_intake_private.operations_v1 WHERE operation_id = p_binding->>'operationId' FOR UPDATE;
  IF NOT FOUND OR held.binding <> p_binding OR held.proposal_digest <> p_digest OR octet_length(held.original_bytes) <> p_bytes THEN
    RETURN jsonb_build_object('status','unconfirmed');
  END IF;
  SELECT * INTO finished FROM official_v3_intake_private.completions_v1 WHERE operation_id = held.operation_id;
  IF FOUND THEN
    IF finished.generation = p_generation AND finished.lease_token = p_token AND finished.outcome = p_outcome AND finished.audit = p_audit THEN
      RETURN jsonb_build_object('status','recorded');
    END IF;
    RETURN jsonb_build_object('status','unconfirmed');
  END IF;
  now_at := clock_timestamp();
  IF held.generation IS DISTINCT FROM p_generation OR held.lease_token IS DISTINCT FROM p_token
    OR (held.expires_at > now_at) IS NOT TRUE THEN RETURN jsonb_build_object('status','unconfirmed'); END IF;
  BEGIN
    IF (p_audit->>'recordedAt')::timestamptz > now_at THEN RETURN jsonb_build_object('status','unconfirmed'); END IF;
  EXCEPTION WHEN invalid_datetime_format OR datetime_field_overflow THEN RETURN jsonb_build_object('status','unconfirmed'); END;
  INSERT INTO official_v3_intake_private.completions_v1 VALUES(held.operation_id,p_generation,p_token,p_outcome,p_audit,expected_key,clock_timestamp());
  -- Linearization is under the held operation lock. This is not source authority,
  -- nor a claim that a deferred trigger can certify arbitrary future COMMIT work.
  PERFORM official_v3_guard_private.seal_s1_v1();
  IF clock_timestamp() >= held.expires_at THEN RAISE EXCEPTION USING ERRCODE = 'P7302', MESSAGE = 'intake_lease_elapsed'; END IF;
  RETURN jsonb_build_object('status','recorded');
END $bg1_body$;
RESET ROLE;
SET LOCAL ROLE ot_v3_jobs_owner;
CREATE OR REPLACE FUNCTION official_v3_jobs_api.execute_v1(wire text,method_id text,revision integer,method_digest text,package_digest text,epoch integer,remaining_ms integer,absolute_not_after text) RETURNS jsonb
LANGUAGE plpgsql VOLATILE PARALLEL UNSAFE SECURITY DEFINER CALLED ON NULL INPUT SET search_path=pg_catalog,pg_temp  AS $bg1_body$
DECLARE deadline timestamptz; entry timestamptz:=statement_timestamp(); q jsonb; i jsonb; operation text; phase text; b jsonb; c jsonb; claim jsonb;
  k text; lock_names text[]; lock_value bigint; relation text; next_identity jsonb; attempt text;
  s official_v3_jobs_private.subjects_v1%ROWTYPE; t official_v3_jobs_private.execution_starts_v1%ROWTYPE;
  r official_v3_jobs_private.execution_results_v1%ROWTYPE; continuation jsonb; eligible boolean:=false; bundle jsonb; ref jsonb; opened jsonb; raw_reply jsonb;
BEGIN
  PERFORM official_v3_guard_private.begin_jobs_v1();
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
  PERFORM official_v3_guard_private.seal_jobs_v1();
  -- LAST database authority check. It takes actual MA1 head FOR SHARE, then reads
  -- actual clock/tuple/epoch/expiry. No application DML or new lock follows it.
  PERFORM official_v3_jobs_private.ma1_require_v1(method_id,revision,method_digest,package_digest,epoch);
  IF clock_timestamp()>=deadline OR (bundle->>'lease' IS NOT NULL AND clock_timestamp()>=official_v3_jobs_private.timestamp_v1(bundle->>'lease'))
    OR (bundle->>'observedAt' IS NOT NULL AND clock_timestamp()<official_v3_jobs_private.timestamp_v1(bundle->>'observedAt'))
    OR (bundle->>'dueAt' IS NOT NULL AND clock_timestamp()<official_v3_jobs_private.timestamp_v1(bundle->>'dueAt')) THEN
    RAISE EXCEPTION 'm04 final expired budget or lease' USING ERRCODE='P7605'; END IF;
  RETURN raw_reply;
END $bg1_body$;
RESET ROLE;
SET LOCAL ROLE ot_v3_jobs_owner;
CREATE OR REPLACE FUNCTION official_v3_jobs_private.assert_history_v1(k text) RETURNS void
LANGUAGE plpgsql VOLATILE PARALLEL UNSAFE SECURITY INVOKER CALLED ON NULL INPUT SET search_path=pg_catalog,pg_temp  AS $bg1_body$
DECLARE s official_v3_jobs_private.subjects_v1%ROWTYPE; x record; c jsonb; e jsonb; unresolved text[]; ops integer; starts integer; credit jsonb; envelope_canonical text COLLATE "default";
  validated_jobs jsonb:='{}'::jsonb; validated_job_count integer:=0; validated_job_bytes integer:=0; job_text text COLLATE "C"; job_bytes integer;
  memo_subject_kind text COLLATE "C"; memo_subject_text text COLLATE "C"; memo_subject_result jsonb; command_identity jsonb;
BEGIN
  SELECT * INTO s FROM official_v3_jobs_private.subjects_v1 WHERE job_key=k;
  IF NOT FOUND THEN RETURN; END IF;
  SELECT count(*) INTO ops FROM official_v3_jobs_private.queue_operations_v1 WHERE job_key=k;
  SELECT count(*),array_agg(t.attempt_key ORDER BY t.attempt_key) FILTER(WHERE d.attempt_key IS NULL AND NOT official_v3_guard_private.attempt_retired_v1(t.attempt_key)) INTO starts,unresolved
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
END $bg1_body$;
RESET ROLE;
SET LOCAL ROLE ot_v3_jobs_owner;
CREATE OR REPLACE FUNCTION official_v3_jobs_private.tx_execution_prepare_v1(q jsonb,b jsonb,e integer,remaining integer,deadline timestamptz) RETURNS jsonb
LANGUAGE plpgsql VOLATILE PARALLEL UNSAFE SECURITY INVOKER CALLED ON NULL INPUT SET search_path=pg_catalog,pg_temp  AS $bg1_body$
DECLARE i jsonb:=q->'body'; t official_v3_jobs_private.execution_starts_v1%ROWTYPE; s official_v3_jobs_private.subjects_v1%ROWTYPE;
  old official_v3_jobs_private.execution_results_v1%ROWTYPE; r jsonb:=i->'result'; refs jsonb:=i->'references'; ref jsonb; opids text[]:='{}'; digests text[]:='{}';
  total integer:=0; previous_op text; expected_ref text; fence jsonb; prepared timestamptz; kind text;
BEGIN
  IF official_v3_guard_private.attempt_retired_v1(i->>'attemptKey') THEN RETURN jsonb_build_object('reply',jsonb_build_object('status','blocked'),'authority',false); END IF;
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
END $bg1_body$;
RESET ROLE;
SET LOCAL ROLE ot_v3_result_owner;
CREATE OR REPLACE FUNCTION official_v3_result_private.consume_s1_v1(ref jsonb,expected_outcome jsonb,b jsonb) RETURNS jsonb
LANGUAGE plpgsql VOLATILE PARALLEL UNSAFE SECURITY INVOKER CALLED ON NULL INPUT SET search_path=pg_catalog  AS $bg1_body$
DECLARE reply jsonb; proposal_value jsonb; validation_job jsonb; decision_ref text;
BEGIN
 IF official_v3_guard_private.intake_retired_v1(ref#>>'{binding,operationId}') THEN RAISE EXCEPTION 'bg1 retired intake cannot publish' USING ERRCODE='P7906'; END IF;
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
END $bg1_body$;
RESET ROLE;
SET LOCAL ROLE ot_v3_result_owner;
CREATE OR REPLACE FUNCTION official_v3_result_private.assert_catalog_v1() RETURNS void
LANGUAGE plpgsql VOLATILE PARALLEL UNSAFE SECURITY INVOKER CALLED ON NULL INPUT SET search_path=pg_catalog  AS $bg1_body$
DECLARE stored_catalog jsonb; role_row record; creator oid:='postgres'::regrole;
BEGIN
 SELECT official_v3_guard_private.hrs_catalog_v1() INTO stored_catalog;
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
END $bg1_body$;
RESET ROLE;
SET LOCAL ROLE ot_v3_result_owner;
CREATE OR REPLACE FUNCTION official_v3_result_private.command_v1(wire_value jsonb,b jsonb) RETURNS jsonb
LANGUAGE plpgsql IMMUTABLE PARALLEL UNSAFE SECURITY INVOKER CALLED ON NULL INPUT SET search_path=pg_catalog  AS $bg1_body$
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
  WHEN 'ch_de_snapshot' THEN ARRAY[]::text[]
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
END $bg1_body$;
RESET ROLE;
SET LOCAL ROLE ot_v3_jobs_owner;
CREATE OR REPLACE FUNCTION official_v3_jobs_private.assert_catalog_v1() RETURNS void
LANGUAGE plpgsql VOLATILE PARALLEL UNSAFE SECURITY INVOKER CALLED ON NULL INPUT SET search_path=pg_catalog,pg_temp SET jit=off  AS $bg1_body$
DECLARE creator oid; owner_id oid:='ot_v3_jobs_owner'::pg_catalog.regrole;
  caller_id oid:='ot_v3_jobs_caller'::pg_catalog.regrole; intake_id oid:='ot_v3_intake_owner'::pg_catalog.regrole;
  login_id oid; expected record; actual_function pg_catalog.pg_proc%ROWTYPE; expected_types oid[];
  foreign_dependency boolean; actual_value jsonb; bound_value jsonb;
BEGIN

  -- The HRS binding is optional only at installation; it cannot appear, disappear or drift later.
  IF NOT EXISTS(SELECT 1 FROM pg_catalog.pg_namespace hrs_ns WHERE hrs_ns.nspname IN ('official_v3_result_private','official_v3_result_api')) THEN
    IF EXISTS(SELECT 1 FROM pg_catalog.pg_roles hrs_role WHERE hrs_role.rolname IN ('ot_v3_result_owner','ot_v3_result_writer','ot_v3_result_reader','ot_v3_result_verifier'))
      OR EXISTS(SELECT 1 FROM official_v3_guard_private.jobs_catalog_v1() WHERE object_identity='hrs1-catalog') THEN
      RAISE EXCEPTION 'hm04 optional HRS disappearance/partial state' USING ERRCODE='P7603';
    END IF;
  ELSE
    IF (SELECT count(*) FROM pg_catalog.pg_namespace hrs_ns WHERE hrs_ns.nspname IN ('official_v3_result_private','official_v3_result_api'))<>2
      OR (SELECT count(*) FROM pg_catalog.pg_roles hrs_role WHERE hrs_role.rolname IN ('ot_v3_result_owner','ot_v3_result_writer','ot_v3_result_reader','ot_v3_result_verifier'))<>4
    OR EXISTS(SELECT 1 FROM pg_catalog.pg_roles hrs_role WHERE hrs_role.rolname IN ('ot_v3_result_owner','ot_v3_result_writer','ot_v3_result_reader','ot_v3_result_verifier')
      AND (hrs_role.rolcanlogin IS DISTINCT FROM (hrs_role.rolname<>'ot_v3_result_owner')
        OR hrs_role.rolinherit OR hrs_role.rolsuper OR hrs_role.rolcreatedb OR hrs_role.rolcreaterole
        OR hrs_role.rolbypassrls OR hrs_role.rolreplication OR hrs_role.rolconfig IS NOT NULL
        OR hrs_role.rolvaliduntil IS NOT NULL
        OR hrs_role.rolconnlimit<>(CASE WHEN hrs_role.rolname='ot_v3_result_owner' THEN -1 ELSE 2 END)
        OR EXISTS(SELECT 1 FROM pg_catalog.pg_db_role_setting hrs_setting WHERE hrs_setting.setrole=hrs_role.oid)
        OR EXISTS(SELECT 1 FROM pg_catalog.pg_default_acl hrs_default WHERE hrs_default.defaclrole=hrs_role.oid)
        OR (SELECT count(*) FROM pg_catalog.pg_auth_members hrs_edge WHERE hrs_role.oid IN
          (hrs_edge.roleid,hrs_edge.member,hrs_edge.grantor))<>1
        OR NOT EXISTS(SELECT 1 FROM pg_catalog.pg_auth_members hrs_edge WHERE hrs_edge.roleid=hrs_role.oid
          AND hrs_edge.member='postgres'::pg_catalog.regrole AND hrs_edge.grantor=10
          AND hrs_edge.admin_option AND NOT hrs_edge.inherit_option AND NOT hrs_edge.set_option)
        OR pg_catalog.pg_has_role('postgres'::pg_catalog.regrole,hrs_role.oid,'USAGE')
        OR pg_catalog.pg_has_role('postgres'::pg_catalog.regrole,hrs_role.oid,'SET'))) THEN
      RAISE EXCEPTION 'hm04 exact bound HRS topology' USING ERRCODE='P7603';
    END IF;
    SELECT q.value INTO actual_value FROM (
SELECT pg_catalog.to_jsonb(pg_catalog.encode(pg_catalog.sha256(pg_catalog.convert_to(q.value::text,'UTF8')),'hex')) AS value FROM (
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
) AS value
) q
    ) q;
    SELECT fingerprint INTO bound_value FROM official_v3_guard_private.jobs_catalog_v1() WHERE object_identity='hrs1-catalog';
    IF actual_value IS DISTINCT FROM bound_value THEN
      RAISE EXCEPTION 'hm04 bound HRS catalog drift' USING ERRCODE='P7603';
    END IF;
  END IF;
  SELECT (fingerprint->>'installer')::oid INTO creator
    FROM official_v3_guard_private.jobs_catalog_v1() WHERE object_identity='creator-defaults';
  IF creator IS DISTINCT FROM 'postgres'::pg_catalog.regrole::oid
    OR (SELECT count(*) FROM official_v3_guard_private.jobs_catalog_v1())<>(15 + (CASE WHEN EXISTS(SELECT 1 FROM pg_catalog.pg_namespace hrs_ns WHERE hrs_ns.nspname IN ('official_v3_result_private','official_v3_result_api')) THEN 1 ELSE 0 END))
    OR EXISTS(SELECT 1 FROM official_v3_guard_private.jobs_catalog_v1()
      WHERE object_identity<>ALL(ARRAY['jobs-functions','jobs-relations','jobs-types','jobs-schemas','jobs-dependencies','prerequisite-functions','prerequisite-relations','prerequisite-types','prerequisite-schemas','prerequisite-dependencies','protected-roles','creator-edges','creator-defaults','database','package-context','hrs1-catalog' ]::text[]))
    OR (SELECT fingerprint FROM official_v3_guard_private.jobs_catalog_v1() WHERE object_identity='package-context')
      IS DISTINCT FROM ('{"package":"HM04-v1-A1","original_jobs_sha256":"0d2210d84c02aacbeef1c8e14b38e7be6c2e3e8c387057fd97666fb00c71bba4","original_r41_native_sha256":"a61b94e98691ecf6212f2e9cadfada3d470927c319f0ef9a6ed008f63ec658ea","pg1_sha256":"3e21495ff40f66337b004fadc98599cd336c19c31bb4f6e4f9013c2c01f02bd2","hma1_sha256":"edbaf9d56b3da115b12bf1c8cfd5c76d8bc9483f7fc1658ee648b380a16fe2c0","hs1_sha256":"f2a3f1b8a2845b2706d06dbef66c225c1836d9398e65682a01bf19d035018ac0"}'::jsonb || pg_catalog.jsonb_build_object('creator','postgres'::pg_catalog.regrole::oid,'database',(SELECT d.oid FROM pg_catalog.pg_database d WHERE d.datname=current_database()))) THEN
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
  SELECT fingerprint INTO bound_value FROM official_v3_guard_private.jobs_catalog_v1() WHERE object_identity='jobs-functions';
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
  SELECT fingerprint INTO bound_value FROM official_v3_guard_private.jobs_catalog_v1() WHERE object_identity='jobs-relations';
  IF actual_value IS DISTINCT FROM bound_value THEN
    RAISE EXCEPTION 'hm04 catalog drift: jobs-relations' USING ERRCODE='P7603';
  END IF;
  SELECT q.value INTO actual_value FROM (
SELECT pg_catalog.to_jsonb(pg_catalog.encode(pg_catalog.sha256(pg_catalog.convert_to(q.value::text,'UTF8')),'hex')) AS value FROM (
SELECT pg_catalog.jsonb_agg(pg_catalog.to_jsonb(t) ORDER BY t.oid) AS value
  FROM pg_catalog.pg_type t JOIN pg_catalog.pg_namespace n ON n.oid=t.typnamespace WHERE n.nspname IN ('official_v3_jobs_private','official_v3_jobs_api')
) q
  ) q;
  SELECT fingerprint INTO bound_value FROM official_v3_guard_private.jobs_catalog_v1() WHERE object_identity='jobs-types';
  IF actual_value IS DISTINCT FROM bound_value THEN
    RAISE EXCEPTION 'hm04 catalog drift: jobs-types' USING ERRCODE='P7603';
  END IF;
  SELECT q.value INTO actual_value FROM (
SELECT pg_catalog.to_jsonb(pg_catalog.encode(pg_catalog.sha256(pg_catalog.convert_to(q.value::text,'UTF8')),'hex')) AS value FROM (
SELECT pg_catalog.jsonb_agg(pg_catalog.to_jsonb(n) ORDER BY n.oid) AS value
  FROM pg_catalog.pg_namespace n WHERE n.nspname IN ('official_v3_jobs_private','official_v3_jobs_api')
) q
  ) q;
  SELECT fingerprint INTO bound_value FROM official_v3_guard_private.jobs_catalog_v1() WHERE object_identity='jobs-schemas';
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
  SELECT fingerprint INTO bound_value FROM official_v3_guard_private.jobs_catalog_v1() WHERE object_identity='jobs-dependencies';
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
  SELECT fingerprint INTO bound_value FROM official_v3_guard_private.jobs_catalog_v1() WHERE object_identity='prerequisite-functions';
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
  SELECT fingerprint INTO bound_value FROM official_v3_guard_private.jobs_catalog_v1() WHERE object_identity='prerequisite-relations';
  IF actual_value IS DISTINCT FROM bound_value THEN
    RAISE EXCEPTION 'hm04 catalog drift: prerequisite-relations' USING ERRCODE='P7603';
  END IF;
  SELECT q.value INTO actual_value FROM (
SELECT pg_catalog.to_jsonb(pg_catalog.encode(pg_catalog.sha256(pg_catalog.convert_to(q.value::text,'UTF8')),'hex')) AS value FROM (
SELECT pg_catalog.jsonb_agg(pg_catalog.to_jsonb(t) ORDER BY t.oid) AS value
  FROM pg_catalog.pg_type t JOIN pg_catalog.pg_namespace n ON n.oid=t.typnamespace WHERE n.nspname IN ('jetnity_ot_auth','official_v3_method_private','official_v3_method_api','official_v3_intake_private','official_v3_intake_api')
) q
  ) q;
  SELECT fingerprint INTO bound_value FROM official_v3_guard_private.jobs_catalog_v1() WHERE object_identity='prerequisite-types';
  IF actual_value IS DISTINCT FROM bound_value THEN
    RAISE EXCEPTION 'hm04 catalog drift: prerequisite-types' USING ERRCODE='P7603';
  END IF;
  SELECT q.value INTO actual_value FROM (
SELECT pg_catalog.to_jsonb(pg_catalog.encode(pg_catalog.sha256(pg_catalog.convert_to(q.value::text,'UTF8')),'hex')) AS value FROM (
SELECT pg_catalog.jsonb_agg(pg_catalog.to_jsonb(n) ORDER BY n.oid) AS value
  FROM pg_catalog.pg_namespace n WHERE n.nspname IN ('jetnity_ot_auth','official_v3_method_private','official_v3_method_api','official_v3_intake_private','official_v3_intake_api')
) q
  ) q;
  SELECT fingerprint INTO bound_value FROM official_v3_guard_private.jobs_catalog_v1() WHERE object_identity='prerequisite-schemas';
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
  SELECT fingerprint INTO bound_value FROM official_v3_guard_private.jobs_catalog_v1() WHERE object_identity='prerequisite-dependencies';
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
  SELECT fingerprint INTO bound_value FROM official_v3_guard_private.jobs_catalog_v1() WHERE object_identity='protected-roles';
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
  SELECT fingerprint INTO bound_value FROM official_v3_guard_private.jobs_catalog_v1() WHERE object_identity='creator-edges';
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
  SELECT fingerprint INTO bound_value FROM official_v3_guard_private.jobs_catalog_v1() WHERE object_identity='creator-defaults';
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
  SELECT fingerprint INTO bound_value FROM official_v3_guard_private.jobs_catalog_v1() WHERE object_identity='database';
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
      AND NOT official_v3_guard_private.allowed_owner_edge_v1(d.classid,d.objid,d.refobjid,d.deptype)
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
    AND NOT official_v3_guard_private.allowed_owner_edge_v1(d.classid,d.objid,d.refobjid,d.deptype)
    AND NOT(d.dbid=(SELECT b.oid FROM pg_catalog.pg_database b WHERE b.datname=current_database())
      AND (EXISTS(SELECT 1 FROM scope_objects o WHERE o.classid=d.classid AND o.objid=d.objid)
        OR d.classid='pg_catalog.pg_proc'::pg_catalog.regclass AND (EXISTS(SELECT 1 FROM pg_catalog.pg_proc p JOIN pg_catalog.pg_namespace n ON n.oid=p.pronamespace
          WHERE p.oid=d.objid AND n.nspname='official_v3_jobs_private' AND p.proname IN ('s1_read_v1','s1_shape_v1') AND p.proowner=intake_id)
          OR EXISTS(SELECT 1 FROM pg_catalog.pg_proc hrs_bridge
            JOIN pg_catalog.pg_namespace hrs_namespace ON hrs_namespace.oid=hrs_bridge.pronamespace
            WHERE hrs_bridge.oid=d.objid AND hrs_namespace.nspname='official_v3_result_private'
              AND hrs_bridge.proname='s1_read_locked_v1' AND hrs_bridge.proowner=intake_id
              AND hrs_bridge.pronargs=3 AND hrs_bridge.prorettype='pg_catalog.jsonb'::pg_catalog.regtype
              AND ARRAY(SELECT hrs_arg FROM pg_catalog.unnest(hrs_bridge.proargtypes) hrs_arg)=ARRAY[
                'pg_catalog.jsonb'::pg_catalog.regtype,'pg_catalog.text'::pg_catalog.regtype,'pg_catalog.int4'::pg_catalog.regtype]::oid[])))))
    INTO foreign_dependency;
  IF foreign_dependency THEN
    RAISE EXCEPTION 'hm04 HS1 owner foreign object' USING ERRCODE='P7603';
  END IF;
END $bg1_body$;
RESET ROLE;
SET LOCAL ROLE ot_v3_result_owner;
CREATE OR REPLACE FUNCTION official_v3_result_private.dispatch_v1(channel_value text,wire_value jsonb,binding_hash_value text,
 method_id_value text,revision_value integer,method_digest_value text,package_digest_value text,
 epoch_value integer,remaining_ms_value integer,not_after_value text,legal_day_value text) RETURNS jsonb
LANGUAGE plpgsql VOLATILE PARALLEL UNSAFE SECURITY INVOKER CALLED ON NULL INPUT SET search_path=pg_catalog SET jit=off SET plan_cache_mode=force_generic_plan  AS $bg1_body$
DECLARE b jsonb:=official_v3_result_private.selected_binding_v1(); q jsonb; operation_value text:=wire_value->>'operation';
 expected_channel text; deadline timestamptz; actual_now timestamptz:=clock_timestamp(); reply_value jsonb; proof_value jsonb;
 head_row official_v3_result_private.heads_v1%ROWTYPE; original_operation official_v3_result_private.operations_v1%ROWTYPE;
 projection_value jsonb; projection_binding jsonb; requested jsonb; key_value jsonb; refs jsonb:='[]'; public_reader boolean;
 stored_certificate text; certificate_rows bigint;
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
    OR public_reader AND operation_value IN ('coverage','projection','projection_current','projection_batch','ch_de_snapshot'))) THEN
  RAISE EXCEPTION 'hrs1 wrong dedicated channel identity' USING ERRCODE='42501';
 END IF;
 deadline:=LEAST(official_v3_result_private.timestamp_v1(not_after_value),
  actual_now+make_interval(secs=>remaining_ms_value/1000.0));
 IF NOT isfinite(deadline) OR deadline<=actual_now THEN RAISE EXCEPTION 'hrs1 original deadline ended' USING ERRCODE='P7806'; END IF;
 PERFORM set_config('lock_timeout',remaining_ms_value::text||'ms',true);
 PERFORM set_config('statement_timeout',remaining_ms_value::text||'ms',true);
 PERFORM set_config('idle_in_transaction_session_timeout',remaining_ms_value::text||'ms',true);
 IF public_reader THEN
  PERFORM official_v3_guard_private.require_open_v1();
 ELSE
  PERFORM pg_advisory_xact_lock(771106,1);
  PERFORM official_v3_guard_private.require_open_v1();
 END IF;
 -- Same selected head, then the actual original MA1 lock, for all channels.
 -- A reader waits for any in-progress write and checks freshness after that wait.
 IF channel_value IN ('execute','attest') THEN
  PERFORM pg_advisory_xact_lock(771105,2);
 ELSE
  PERFORM pg_advisory_xact_lock_shared(771105,2);
 END IF;
 LOCK TABLE official_v3_result_private.archive_pages_v1,official_v3_result_private.binding_v1,
  official_v3_result_private.decisions_v1,official_v3_result_private.extractions_v1,
  official_v3_result_private.heads_v1,official_v3_result_private.monitor_schedule_v1,
  official_v3_result_private.operations_v1,official_v3_result_private.originals_v1,
  official_v3_result_private.outbox_v1,official_v3_result_private.projections_v1,
  official_v3_result_private.qualifications_v1,official_v3_result_private.versions_v1 IN SHARE MODE;
 IF channel_value IN ('execute','attest') THEN
  SELECT * INTO head_row FROM official_v3_result_private.heads_v1 WHERE singleton FOR UPDATE;
 ELSE
  SELECT * INTO head_row FROM official_v3_result_private.heads_v1 WHERE singleton FOR SHARE;
 END IF;
 IF NOT FOUND THEN RAISE EXCEPTION 'hrs1 selected durable head absent' USING ERRCODE='P7803'; END IF;
 PERFORM official_v3_result_private.fence_v1(b,epoch_value,deadline,legal_day_value);
 IF NOT public_reader THEN
 PERFORM official_v3_result_private.assert_catalog_v1();
 SELECT stored.state_certificate INTO stored_certificate FROM official_v3_result_private.binding_v1 stored WHERE stored.singleton;
 IF (stored_certificate ~ '^[a-f0-9]{64}$') IS NOT TRUE
  OR stored_certificate IS DISTINCT FROM official_v3_result_private.state_fingerprint_v1() THEN
  RAISE EXCEPTION 'hrs1 checked durable state changed or absent' USING ERRCODE='P7804';
 END IF;
 END IF;
 IF operation_value='ch_de_snapshot' THEN
  reply_value:=official_v3_guard_private.ch_de_snapshot_v1(b,epoch_value,deadline,legal_day_value);
 ELSIF operation_value IN ('history','head') THEN
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
 IF NOT public_reader THEN
 PERFORM official_v3_result_private.assert_catalog_v1();
 IF channel_value IN ('attest','execute') THEN
  -- The existing immutable trigger owns the complete validation and refuses a
  -- forged certificate, including an otherwise privileged direct UPDATE.
  UPDATE official_v3_result_private.binding_v1 SET state_certificate=official_v3_result_private.state_fingerprint_v1() WHERE singleton;
  GET DIAGNOSTICS certificate_rows=ROW_COUNT;
  IF certificate_rows<>1 THEN RAISE EXCEPTION 'hrs1 state certificate row absent' USING ERRCODE='P7804'; END IF;
 ELSE
  IF stored_certificate IS DISTINCT FROM (SELECT stored.state_certificate FROM official_v3_result_private.binding_v1 stored WHERE stored.singleton)
   OR stored_certificate IS DISTINCT FROM official_v3_result_private.state_fingerprint_v1() THEN
   RAISE EXCEPTION 'hrs1 checked durable state changed during read' USING ERRCODE='P7804';
  END IF;
 END IF;
 END IF;
 PERFORM official_v3_guard_private.require_open_v1();
 IF operation_value='ch_de_snapshot' AND clock_timestamp()>=(reply_value#>>'{value,validUntil}')::timestamptz THEN RAISE EXCEPTION 'bg1 final snapshot expired' USING ERRCODE='P7902'; END IF;
 PERFORM official_v3_result_private.fence_v1(b,epoch_value,deadline,legal_day_value);
 RETURN reply_value;
END $bg1_body$;
RESET ROLE;
-- No caller receives direct state/table access. The existing platform reader
-- obtains exactly the redacted status function; the Management API remains the
-- independent read-only transport boundary (the provider role has BYPASSRLS).
GRANT USAGE ON SCHEMA official_v3_guard_private TO supabase_read_only_user;
GRANT EXECUTE ON FUNCTION official_v3_guard_private.alarm_status_v1() TO supabase_read_only_user;
GRANT EXECUTE ON FUNCTION public.official_v3_guard_review_v1(),
  public.official_v3_guard_retire_v1(text,text),public.official_v3_guard_resume_v1(text,text),
  public.official_v3_guard_confirm_v1(text,text,text) TO authenticated;
REVOKE CREATE ON SCHEMA official_v3_guard_private FROM ot_v3_result_owner,ot_v3_jobs_owner,ot_v3_intake_owner;
REVOKE ot_v3_result_owner FROM postgres GRANTED BY postgres;
REVOKE ot_v3_jobs_owner FROM postgres GRANTED BY postgres;
REVOKE ot_v3_intake_owner FROM postgres GRANTED BY postgres;

CREATE TEMP TABLE bg1_new_objects(classid oid,objid oid,PRIMARY KEY(classid,objid)) ON COMMIT DROP;
DO $exact_delta$
DECLARE approved jsonb:='{"replacements":[{"signature":"official_v3_method_api.confirm_operation_v1(text,text,text,integer,text,text,integer,integer,text,text,integer,text,text,text)","hash":"dc0c8e711eb360eb40022841b07a4d00f39a3a7a4edb0630bf72a8f8a622db02"},{"signature":"official_v3_method_api.stage_draft_v1(text,text,integer,text,text,integer)","hash":"79e627238134e15d45f09f5acb2aac7f9cf079b147d3220b2c3bbb893f992209"},{"signature":"official_v3_method_api.approve_v1(text,text,integer,text,text,integer,text,text,integer,text,text,text)","hash":"0b0db811d7d667ef63e607afb9cff9d48080821fd62252bf53df2f48c0e5712d"},{"signature":"official_v3_method_api.revoke_v1(text,text,integer,text,text,integer)","hash":"9c090121b1c5471f8e78b2e2b78813d996c82ad97ce57d60e14299d7be485e88"},{"signature":"official_v3_intake_api.capture_v1(jsonb,text,text)","hash":"bca5dcc14b315063bff32cad0122c0fc9e3efdc576c2b599f240f2a26d003b7a"},{"signature":"official_v3_intake_api.reserve_v1(jsonb,text,integer,integer)","hash":"131aa90007cb6729f9925635c98e2145f690776a56031b77a7561a068af84222"},{"signature":"official_v3_intake_api.finish_v1(jsonb,text,integer,integer,uuid,jsonb,jsonb)","hash":"601ab19f1054f47a52505a69c8f7a00b38ff870825fe468f21f2cea034b811c4"},{"signature":"official_v3_jobs_api.execute_v1(text,text,integer,text,text,integer,integer,text)","hash":"ebf97604360e16d31bff8b34e7fb6380a643d207198e9b0af2ea95821650ece5"},{"signature":"official_v3_jobs_private.assert_history_v1(text)","hash":"51f83aeba5523405b1948b92d34c3cebb84eef5872a97c0e02d31c0b4b105588"},{"signature":"official_v3_jobs_private.tx_execution_prepare_v1(jsonb,jsonb,integer,integer,timestamptz)","hash":"4fd077e6222bf925ec8d55b7e8cd53aa7703cf279583a9aaa810daca30255160"},{"signature":"official_v3_result_private.consume_s1_v1(jsonb,jsonb,jsonb)","hash":"d0738e696a066ffddfa725d27b1e3c8f81b4c73a5cb981a5e07460bc6db42ecd"},{"signature":"official_v3_result_private.assert_catalog_v1()","hash":"dac7c17f36163e0c0d6c068977e85fc35975a4621e67dceda234ca639fa945ed"},{"signature":"official_v3_result_private.command_v1(jsonb,jsonb)","hash":"365b04e28ffb7c6f6502f3af77f5afb7abf4d443d4a443c1f04f27128a1996c6"},{"signature":"official_v3_jobs_private.assert_catalog_v1()","hash":"c1f9fc5e7f3d4f0099b6e89e41d47df9165ec9b4e559807d1fff4db99bd25cfc"},{"signature":"official_v3_result_private.dispatch_v1(text,jsonb,text,text,integer,text,text,integer,integer,text,text)","hash":"eccdbd371a0b10f103f2d56902b21d94685e1413c3831e98a33859e8d97bab3f"}],"functions":[{"signature":"official_v3_guard_private.immutable_v1()","name":"official_v3_guard_private.immutable_v1","owner":"postgres","hash":"912ce0a3cee4ab57ee76be8425053f5f42963db5a2943a76f0d49d70059f963b","language":"plpgsql","definer":false,"volatile":"v","config":["search_path=pg_catalog"],"grantees":["postgres"]},{"signature":"official_v3_guard_private.require_open_v1()","name":"official_v3_guard_private.require_open_v1","owner":"postgres","hash":"9924b9d1c0d0590f073ce065a2c47e5d06124efef4a15e6ae97177b9789c1203","language":"plpgsql","definer":true,"volatile":"v","config":["search_path=pg_catalog"],"grantees":["ot_v3_result_owner","postgres"]},{"signature":"official_v3_guard_private.check_control_v1()","name":"official_v3_guard_private.check_control_v1","owner":"postgres","hash":"8a37a92bd1293a467665da5831d717e7675650af9a2f5ef60e1cf57899a99eb4","language":"plpgsql","definer":true,"volatile":"v","config":["search_path=pg_catalog"],"grantees":["postgres"]},{"signature":"official_v3_guard_private.hrs_catalog_v1()","name":"official_v3_guard_private.hrs_catalog_v1","owner":"postgres","hash":"90983802fa25e02731f0595a21deb0a54e6712f470b765be176d3b27ab7b835d","language":"sql","definer":true,"volatile":"s","config":["search_path=pg_catalog"],"grantees":["ot_v3_result_owner","postgres"]},{"signature":"official_v3_guard_private.open_until_v1()","name":"official_v3_guard_private.open_until_v1","owner":"postgres","hash":"38a690b6246405e05f46cccca99753b4031d9efc78069c53afe83ae2cfab5aaf","language":"plpgsql","definer":true,"volatile":"v","config":["search_path=pg_catalog"],"grantees":["ot_v3_result_owner","postgres"]},{"signature":"official_v3_guard_private.jobs_catalog_v1()","name":"official_v3_guard_private.jobs_catalog_v1","owner":"postgres","hash":"389b3202c4d2af2d3d8392f594b2b88663f94b91cae9527017e53825a72b5fe5","language":"sql","definer":true,"volatile":"s","config":["search_path=pg_catalog"],"grantees":["ot_v3_jobs_owner","postgres"]},{"signature":"official_v3_guard_private.intake_retired_v1(text)","name":"official_v3_guard_private.intake_retired_v1","owner":"postgres","hash":"d9156156a14d52492b1bbad6f39342486c5a6c69a2aa21139766156e104ef282","language":"sql","definer":true,"volatile":"s","config":["search_path=pg_catalog"],"grantees":["ot_v3_intake_owner","ot_v3_result_owner","postgres"]},{"signature":"official_v3_guard_private.attempt_retired_v1(text)","name":"official_v3_guard_private.attempt_retired_v1","owner":"postgres","hash":"d98f6128b8854fe3e94bc7b577d57e9108f1ddde62c9468abf1050e76f043045","language":"sql","definer":true,"volatile":"s","config":["search_path=pg_catalog"],"grantees":["ot_v3_jobs_owner","postgres"]},{"signature":"official_v3_guard_private.alarm_status_v1()","name":"official_v3_guard_private.alarm_status_v1","owner":"postgres","hash":"c0d610e700e6dd48b058256ef30bcee551f39a045e70e26429baaa7c3bc0f65b","language":"plpgsql","definer":true,"volatile":"v","config":["search_path=pg_catalog"],"grantees":["postgres","supabase_read_only_user"]},{"signature":"official_v3_guard_private.catalog_v1()","name":"official_v3_guard_private.catalog_v1","owner":"postgres","hash":"28a3e90b0e6be9db58d5910530437b4a76bd5950663d37a1cbcf8ced8545b1db","language":"sql","definer":true,"volatile":"s","config":["search_path=pg_catalog","jit=off"],"grantees":["postgres"]},{"signature":"official_v3_guard_private.assert_catalog_v1()","name":"official_v3_guard_private.assert_catalog_v1","owner":"postgres","hash":"67e3851c5e7dfc49f75e55b5d7e0d8eec12372a6a71e1750c603a19c78db0590","language":"plpgsql","definer":true,"volatile":"v","config":["search_path=pg_catalog"],"grantees":["postgres"]},{"signature":"official_v3_guard_private.check_hma_v1()","name":"official_v3_guard_private.check_hma_v1","owner":"postgres","hash":"917992aba6dd635fc0e5fd0c7afacd4456cb47a020ca01be80047687caf7127a","language":"plpgsql","definer":true,"volatile":"v","config":["search_path=pg_catalog","TimeZone=UTC","DateStyle=ISO, YMD"],"grantees":["postgres"]},{"signature":"official_v3_guard_private.check_s1_v1()","name":"official_v3_guard_private.check_s1_v1","owner":"ot_v3_intake_owner","hash":"fe7647b8fc342215a286d4853af53c2a91dde01cb7f5dfd131a971d91ea03204","language":"plpgsql","definer":true,"volatile":"v","config":["search_path=pg_catalog","TimeZone=UTC","DateStyle=ISO, YMD"],"grantees":["ot_v3_intake_owner","postgres"]},{"signature":"official_v3_guard_private.check_method_link_v1(jsonb,timestamptz)","name":"official_v3_guard_private.check_method_link_v1","owner":"postgres","hash":"9be92d807c7c15c33a77746ef94fab25654dfb3af6a83d6641c37df35d5df074","language":"plpgsql","definer":true,"volatile":"v","config":["search_path=pg_catalog"],"grantees":["ot_v3_jobs_owner","postgres"]},{"signature":"official_v3_guard_private.check_jobs_v1()","name":"official_v3_guard_private.check_jobs_v1","owner":"ot_v3_jobs_owner","hash":"12560e25fc355e9fd903be2bc565b92a78d97f8601b1207f9204bfb8552125d0","language":"plpgsql","definer":true,"volatile":"v","config":["search_path=pg_catalog"],"grantees":["ot_v3_jobs_owner","postgres"]},{"signature":"official_v3_guard_private.hrs_certificate_v1()","name":"official_v3_guard_private.hrs_certificate_v1","owner":"ot_v3_result_owner","hash":"64ec973017025af2208a28c89d462182fc218db32df190c2cd5cebe91c14d5f1","language":"sql","definer":true,"volatile":"s","config":["search_path=pg_catalog"],"grantees":["ot_v3_result_owner","postgres"]},{"signature":"official_v3_guard_private.check_hrs_v1()","name":"official_v3_guard_private.check_hrs_v1","owner":"ot_v3_result_owner","hash":"de01e031c184b552e946cb30621aebfdaf1b7525c34024d73be772d4ab30397b","language":"plpgsql","definer":true,"volatile":"v","config":["search_path=pg_catalog"],"grantees":["ot_v3_result_owner","postgres"]},{"signature":"official_v3_guard_private.content_digest_v1(text)","name":"official_v3_guard_private.content_digest_v1","owner":"postgres","hash":"804261846f2acd99017f3aed14a5f3859616a913e5ab24ecf32bdd185f40dda6","language":"plpgsql","definer":true,"volatile":"s","config":["search_path=pg_catalog"],"grantees":["postgres"]},{"signature":"official_v3_guard_private.check_certificate_v1(text)","name":"official_v3_guard_private.check_certificate_v1","owner":"postgres","hash":"66cdca6a3635b3bd9b4c60e6751cf07ff78494ef1d726b3aa1dad9d31ae16e5e","language":"plpgsql","definer":true,"volatile":"v","config":["search_path=pg_catalog","TimeZone=UTC","DateStyle=ISO, YMD"],"grantees":["postgres"]},{"signature":"official_v3_guard_private.check_certificates_v1()","name":"official_v3_guard_private.check_certificates_v1","owner":"postgres","hash":"f4e8ada03aa20a08c3d1cff1973ba5757796f5edbb3b41bbeb5bee5b5c858fea","language":"plpgsql","definer":true,"volatile":"v","config":["search_path=pg_catalog"],"grantees":["postgres"]},{"signature":"official_v3_guard_private.begin_component_v1(text)","name":"official_v3_guard_private.begin_component_v1","owner":"postgres","hash":"5f3029465bea4582e5b2441e5f5dada049b1d318d5d0a50752fdbdee3f22496b","language":"plpgsql","definer":true,"volatile":"v","config":["search_path=pg_catalog"],"grantees":["postgres"]},{"signature":"official_v3_guard_private.seal_component_v1(text)","name":"official_v3_guard_private.seal_component_v1","owner":"postgres","hash":"efe6ac203d0f8a32c70602a16669d044477f7da86c125d9d641c5e20f1847051","language":"plpgsql","definer":true,"volatile":"v","config":["search_path=pg_catalog","TimeZone=UTC","DateStyle=ISO, YMD"],"grantees":["postgres"]},{"signature":"official_v3_guard_private.owner_session_v1()","name":"official_v3_guard_private.owner_session_v1","owner":"postgres","hash":"48ba849f43068ae1f3b98a3d794ac060afc17c0c32c7b167a1495d9a6a2bdd26","language":"plpgsql","definer":true,"volatile":"v","config":["search_path=pg_catalog"],"grantees":["ot_v3_jobs_owner","postgres"]},{"signature":"official_v3_guard_private.current_method_v1()","name":"official_v3_guard_private.current_method_v1","owner":"postgres","hash":"1a18f9d6c3ba0a157dea5ae199501ba173cf0818eb207a3003d0e0b314c86423","language":"plpgsql","definer":true,"volatile":"v","config":["search_path=pg_catalog","TimeZone=UTC","DateStyle=ISO, YMD"],"grantees":["ot_v3_result_owner","postgres"]},{"signature":"official_v3_guard_private.fixed_method_v1()","name":"official_v3_guard_private.fixed_method_v1","owner":"postgres","hash":"8e993b52161c9495b075f962f390eb61d70da54ae9e69bc746b4b6b3560f7770","language":"plpgsql","definer":true,"volatile":"v","config":["search_path=pg_catalog"],"grantees":["postgres"]},{"signature":"official_v3_guard_private.recovery_jobs_v1()","name":"official_v3_guard_private.recovery_jobs_v1","owner":"ot_v3_jobs_owner","hash":"e5751cc59b682862adf0797c04b2107eb32e173ec60420a5d8bac8f1ca231c79","language":"plpgsql","definer":true,"volatile":"v","config":["search_path=pg_catalog"],"grantees":["ot_v3_jobs_owner","postgres"]},{"signature":"official_v3_guard_private.recovery_intake_v1(jsonb)","name":"official_v3_guard_private.recovery_intake_v1","owner":"ot_v3_intake_owner","hash":"89dddddb04af829f1e3125d9baa2a60e9ace637b1d87e520b153f9b88e955dcc","language":"plpgsql","definer":true,"volatile":"v","config":["search_path=pg_catalog","TimeZone=UTC","DateStyle=ISO, YMD"],"grantees":["ot_v3_intake_owner","postgres"]},{"signature":"official_v3_guard_private.recovery_hrs_v1()","name":"official_v3_guard_private.recovery_hrs_v1","owner":"ot_v3_result_owner","hash":"ab129014587c155f068b9457dc75e2f81305d89c9385f768b2404b927e54e8b2","language":"plpgsql","definer":true,"volatile":"v","config":["search_path=pg_catalog"],"grantees":["ot_v3_result_owner","postgres"]},{"signature":"official_v3_guard_private.recovery_snapshot_v1()","name":"official_v3_guard_private.recovery_snapshot_v1","owner":"postgres","hash":"0d7f21053b54a6ffacc23a96c1929a3cbdfaed9d6c7491a5ecaf902b3e09591f","language":"plpgsql","definer":true,"volatile":"v","config":["search_path=pg_catalog"],"grantees":["postgres"]},{"signature":"official_v3_guard_private.retired_state_v1(text)","name":"official_v3_guard_private.retired_state_v1","owner":"postgres","hash":"c4efa2762f8a86801c26362d3598985ccee340cecde563c473466078a74d4f21","language":"sql","definer":true,"volatile":"s","config":["search_path=pg_catalog"],"grantees":["ot_v3_jobs_owner","postgres"]},{"signature":"official_v3_guard_private.close_jobs_v1(text)","name":"official_v3_guard_private.close_jobs_v1","owner":"ot_v3_jobs_owner","hash":"5712d20fd40d1dcb78d81b9de3a20c1252d3394dcc0f8bf582ea074581b9a63c","language":"plpgsql","definer":true,"volatile":"v","config":["search_path=pg_catalog"],"grantees":["ot_v3_jobs_owner","postgres"]},{"signature":"official_v3_guard_private.check_retired_jobs_v1(jsonb)","name":"official_v3_guard_private.check_retired_jobs_v1","owner":"ot_v3_jobs_owner","hash":"1d1548139f8b59c58daf5482353b0c0788420ee2c3cd033c881663c9e9e2367f","language":"plpgsql","definer":true,"volatile":"v","config":["search_path=pg_catalog"],"grantees":["ot_v3_jobs_owner","postgres"]},{"signature":"official_v3_guard_private.check_retired_s1_v1(jsonb)","name":"official_v3_guard_private.check_retired_s1_v1","owner":"ot_v3_intake_owner","hash":"81f6c9307db1b7c57d22ddecaa49b4c8d815511b8528a12d13319b472d8f48db","language":"plpgsql","definer":true,"volatile":"v","config":["search_path=pg_catalog","TimeZone=UTC","DateStyle=ISO, YMD"],"grantees":["ot_v3_intake_owner","postgres"]},{"signature":"official_v3_guard_private.check_retired_hrs_v1(jsonb)","name":"official_v3_guard_private.check_retired_hrs_v1","owner":"ot_v3_result_owner","hash":"7831102e63c0a2c65415332d706af38da59a3a6226b02a024d91313474fc25df","language":"plpgsql","definer":true,"volatile":"v","config":["search_path=pg_catalog"],"grantees":["ot_v3_result_owner","postgres"]},{"signature":"official_v3_guard_private.check_retirements_v1()","name":"official_v3_guard_private.check_retirements_v1","owner":"postgres","hash":"439bb69a36625c4611ae3bfb761266c4367e74ce32cf9765c6eaf37d8537466d","language":"plpgsql","definer":true,"volatile":"v","config":["search_path=pg_catalog"],"grantees":["postgres"]},{"signature":"official_v3_guard_private.incident_snapshot_v1()","name":"official_v3_guard_private.incident_snapshot_v1","owner":"postgres","hash":"4ba7e039404a7d288a2d2fa7d9d61419eb0d3c2e6383c6a662ffb2185a645960","language":"plpgsql","definer":true,"volatile":"v","config":["search_path=pg_catalog","TimeZone=UTC","DateStyle=ISO, YMD"],"grantees":["postgres"]},{"signature":"public.official_v3_guard_review_v1()","name":"public.official_v3_guard_review_v1","owner":"postgres","hash":"acf1fb22da5c8982014e802d5bb7a258ceaa4f8f4256e5475d49267e980bded9","language":"plpgsql","definer":true,"volatile":"v","config":["search_path=pg_catalog","statement_timeout=5s","lock_timeout=2s"],"grantees":["authenticated","postgres"]},{"signature":"public.official_v3_guard_retire_v1(text,text)","name":"public.official_v3_guard_retire_v1","owner":"postgres","hash":"ebeda2435d8d2cd2efaa0d2e190d1654e8a50f402513ed5c8ffae779ebc366d6","language":"plpgsql","definer":true,"volatile":"v","config":["search_path=pg_catalog","statement_timeout=5s","lock_timeout=2s"],"grantees":["authenticated","postgres"]},{"signature":"public.official_v3_guard_resume_v1(text,text)","name":"public.official_v3_guard_resume_v1","owner":"postgres","hash":"173ddbb036a23d4e0eb1051c0434c11a72b2726a79da255f112e245dbe0a2f72","language":"plpgsql","definer":true,"volatile":"v","config":["search_path=pg_catalog","statement_timeout=5s","lock_timeout=2s"],"grantees":["authenticated","postgres"]},{"signature":"public.official_v3_guard_confirm_v1(text,text,text)","name":"public.official_v3_guard_confirm_v1","owner":"postgres","hash":"80249de576440c3f7b00ee97aa86f28d826692d44edcab6e2de905c41d6294cc","language":"plpgsql","definer":true,"volatile":"v","config":["search_path=pg_catalog","statement_timeout=5s","lock_timeout=2s"],"grantees":["authenticated","postgres"]},{"signature":"official_v3_guard_private.ch_de_snapshot_v1(jsonb,integer,timestamptz,text)","name":"official_v3_guard_private.ch_de_snapshot_v1","owner":"ot_v3_result_owner","hash":"da2ad4db69be956317ec9d943c9353bd0237c15e553233a33fd4db802aa155ef","language":"plpgsql","definer":true,"volatile":"v","config":["search_path=pg_catalog"],"grantees":["ot_v3_result_owner","postgres"]},{"signature":"official_v3_guard_private.latch_incident_v1(timestamptz,text)","name":"official_v3_guard_private.latch_incident_v1","owner":"postgres","hash":"1d84d32855553fb926147fc01fb79751432c80fa6e40e02ea979722095ffbf34","language":"plpgsql","definer":true,"volatile":"v","config":["search_path=pg_catalog"],"grantees":["postgres"]},{"signature":"official_v3_guard_private.audit_v1()","name":"official_v3_guard_private.audit_v1","owner":"postgres","hash":"f357faa41668ae68565d12a2f9086dff86045e0af4b55b6165a4cf5303c51cc8","language":"plpgsql","definer":true,"volatile":"v","config":["search_path=pg_catalog","jit=off"],"grantees":["postgres"]},{"signature":"official_v3_guard_private.original_valid_v1(jsonb,text,text)","name":"official_v3_guard_private.original_valid_v1","owner":"ot_v3_intake_owner","hash":"8b0bb27a424e3d18b7bce8ef4f49c3035f91982863d75f81917e247882e570e5","language":"plpgsql","definer":true,"volatile":"s","config":["search_path=pg_catalog"],"grantees":["ot_v3_intake_owner","postgres"]},{"signature":"official_v3_guard_private.completion_valid_v1(jsonb,text,integer,integer,uuid,jsonb,jsonb)","name":"official_v3_guard_private.completion_valid_v1","owner":"ot_v3_intake_owner","hash":"5df62d4eb3524bb116b0fcc6cc739f356aa4e4df776819918e7fe866cf45c940","language":"plpgsql","definer":true,"volatile":"s","config":["search_path=pg_catalog"],"grantees":["ot_v3_intake_owner","postgres"]},{"signature":"official_v3_guard_private.fingerprint_hma_v1()","name":"official_v3_guard_private.fingerprint_hma_v1","owner":"postgres","hash":"2c836cbd9f1968cac8f0375adb72c83a029472d88ff356aaebd71a7101cd3962","language":"sql","definer":true,"volatile":"s","config":["search_path=pg_catalog","TimeZone=UTC","DateStyle=ISO, YMD"],"grantees":["postgres"]},{"signature":"official_v3_guard_private.fingerprint_s1_v1()","name":"official_v3_guard_private.fingerprint_s1_v1","owner":"ot_v3_intake_owner","hash":"570b1b640aae154e31ae043db42eb278cb82fab07aa562eca4e36c5b359da2a0","language":"sql","definer":true,"volatile":"s","config":["search_path=pg_catalog","TimeZone=UTC","DateStyle=ISO, YMD"],"grantees":["ot_v3_intake_owner","postgres"]},{"signature":"official_v3_guard_private.fingerprint_jobs_v1()","name":"official_v3_guard_private.fingerprint_jobs_v1","owner":"ot_v3_jobs_owner","hash":"78fdfd4d8e69e9790ff5cae1fc40bf016bcde4ea7ef04ce11f693835cc6f060a","language":"sql","definer":true,"volatile":"s","config":["search_path=pg_catalog","TimeZone=UTC","DateStyle=ISO, YMD"],"grantees":["ot_v3_jobs_owner","postgres"]},{"signature":"official_v3_guard_private.begin_hma_v1()","name":"official_v3_guard_private.begin_hma_v1","owner":"postgres","hash":"53aa1bd3c09d60a74c545e4b50862bcb606705cec5b7d0f18e0dbd66be94a97f","language":"sql","definer":true,"volatile":"v","config":["search_path=pg_catalog"],"grantees":["postgres"]},{"signature":"official_v3_guard_private.seal_hma_v1()","name":"official_v3_guard_private.seal_hma_v1","owner":"postgres","hash":"882b622600de1c106fc425523a7daf75037a32320920eff87aaaa4d539c695af","language":"sql","definer":true,"volatile":"v","config":["search_path=pg_catalog"],"grantees":["postgres"]},{"signature":"official_v3_guard_private.begin_s1_v1()","name":"official_v3_guard_private.begin_s1_v1","owner":"postgres","hash":"3df3caf2db11d909febbe9775e2490e73f2d88564d997c6e51869e9b176717c8","language":"sql","definer":true,"volatile":"v","config":["search_path=pg_catalog"],"grantees":["ot_v3_intake_owner","postgres"]},{"signature":"official_v3_guard_private.seal_s1_v1()","name":"official_v3_guard_private.seal_s1_v1","owner":"postgres","hash":"3546d2b21a6ddd54b92e1e81d339fa0eef9baa8d813f70733000acd6450c436d","language":"sql","definer":true,"volatile":"v","config":["search_path=pg_catalog"],"grantees":["ot_v3_intake_owner","postgres"]},{"signature":"official_v3_guard_private.begin_jobs_v1()","name":"official_v3_guard_private.begin_jobs_v1","owner":"postgres","hash":"0e74fa135228d58e75e7639ff9118ea61695cf93f8bb34e19d6516d084e36e15","language":"sql","definer":true,"volatile":"v","config":["search_path=pg_catalog"],"grantees":["ot_v3_jobs_owner","postgres"]},{"signature":"official_v3_guard_private.seal_jobs_v1()","name":"official_v3_guard_private.seal_jobs_v1","owner":"postgres","hash":"4c79c756a9a06cf55720ff9c341616f34b33383beb9fae7246cbaabd1e69bd2a","language":"sql","definer":true,"volatile":"v","config":["search_path=pg_catalog"],"grantees":["ot_v3_jobs_owner","postgres"]},{"signature":"official_v3_guard_private.allowed_owner_edge_v1(oid,oid,oid,\"char\")","name":"official_v3_guard_private.allowed_owner_edge_v1","owner":"postgres","hash":"db98bb5781c212347bea467b95dfffbe59d2e3876c5969fc40234afc4ad9859d","language":"sql","definer":true,"volatile":"s","config":["search_path=pg_catalog"],"grantees":["ot_v3_intake_owner","ot_v3_jobs_owner","postgres"]}],"tables":["baselines_v1","certificates_v1","certificate_history_v1","state_v1","runs_v1","incidents_v1","owner_operations_v1","retired_attempts_v1"]}'::jsonb; before_value jsonb; after_value jsonb;
  entry record; f record; checked_function_row pg_proc%ROWTYPE; actual_acl jsonb; current_value jsonb; result_value jsonb:='{}';
  schema_oid oid:='official_v3_guard_private'::regnamespace; function_oid oid; object_class oid; object_id oid;
BEGIN
  SELECT value INTO STRICT before_value FROM pg_temp.bg1_before WHERE kind='all';
  after_value:=official_v3_guard_private.catalog_v1();
  -- Exact fixed new function inventory, body, owner, execution attributes and
  -- minimal grant set. No existing function gains privileges during replacement.
  FOR f IN SELECT * FROM jsonb_to_recordset(approved->'functions')
    AS x(signature text,name text,owner text,hash text,language text,definer boolean,volatile text,config jsonb,grantees jsonb) LOOP
    SELECT * INTO STRICT checked_function_row FROM pg_proc WHERE oid=to_regprocedure(f.signature);
    SELECT jsonb_agg(role_name ORDER BY role_name) INTO actual_acl FROM (
      SELECT DISTINCT CASE a.grantee WHEN 0 THEN 'PUBLIC' ELSE pg_get_userbyid(a.grantee) END AS role_name
      FROM aclexplode(COALESCE(checked_function_row.proacl,acldefault('f',checked_function_row.proowner))) a
      WHERE a.privilege_type='EXECUTE' AND NOT a.is_grantable AND a.grantor=checked_function_row.proowner
    ) acl;
    IF checked_function_row.proowner<>to_regrole(f.owner) OR encode(sha256(convert_to(checked_function_row.prosrc,'UTF8')),'hex')<>f.hash
      OR checked_function_row.prokind<>'f' OR checked_function_row.proleakproof OR checked_function_row.proisstrict OR checked_function_row.pronargdefaults<>0 OR checked_function_row.proparallel<>'u'
      OR checked_function_row.prosecdef<>f.definer OR checked_function_row.provolatile::text<>f.volatile
      OR (SELECT lanname FROM pg_language WHERE oid=checked_function_row.prolang)<>f.language
      OR to_jsonb(checked_function_row.proconfig) IS DISTINCT FROM f.config OR actual_acl IS DISTINCT FROM f.grantees
      OR EXISTS(SELECT 1 FROM aclexplode(COALESCE(checked_function_row.proacl,acldefault('f',checked_function_row.proowner))) a
        WHERE a.privilege_type<>'EXECUTE' OR a.is_grantable OR a.grantor<>checked_function_row.proowner) THEN
      RAISE EXCEPTION 'bg1 new function contract' USING ERRCODE='P7901'; END IF;
    INSERT INTO pg_temp.bg1_new_objects VALUES('pg_proc'::regclass,checked_function_row.oid);
  END LOOP;
  IF EXISTS(SELECT 1 FROM pg_proc p2 WHERE p2.pronamespace=schema_oid
    AND NOT EXISTS(SELECT 1 FROM pg_temp.bg1_new_objects o WHERE o.classid='pg_proc'::regclass AND o.objid=p2.oid)) THEN
    RAISE EXCEPTION 'bg1 additional function' USING ERRCODE='P7901'; END IF;
  IF (SELECT jsonb_agg(c.relname ORDER BY c.relname) FROM pg_class c WHERE c.relnamespace=schema_oid AND c.relkind='r')
    IS DISTINCT FROM (SELECT jsonb_agg(n ORDER BY n) FROM jsonb_array_elements_text(approved->'tables') n) THEN
    RAISE EXCEPTION 'bg1 table inventory' USING ERRCODE='P7901'; END IF;
  IF EXISTS(SELECT 1 FROM pg_class c WHERE c.relnamespace=schema_oid AND c.relkind='r' AND (
    c.relowner<>'postgres'::regrole OR NOT c.relrowsecurity OR NOT c.relforcerowsecurity
    OR EXISTS(SELECT 1 FROM aclexplode(COALESCE(c.relacl,acldefault('r',c.relowner))) a WHERE a.grantee<>'postgres'::regrole OR a.grantor<>'postgres'::regrole OR a.is_grantable)
    OR (SELECT count(*) FROM pg_policy p2 WHERE p2.polrelid=c.oid)<>1
    OR NOT EXISTS(SELECT 1 FROM pg_policy p2 WHERE p2.polrelid=c.oid AND p2.polname='owner_only'
      AND p2.polroles=ARRAY['postgres'::regrole::oid] AND p2.polpermissive AND p2.polcmd='*'
      AND pg_get_expr(p2.polqual,p2.polrelid)='true' AND pg_get_expr(p2.polwithcheck,p2.polrelid)='true'))) THEN
    RAISE EXCEPTION 'bg1 private table authority' USING ERRCODE='P7901'; END IF;
  INSERT INTO pg_temp.bg1_new_objects VALUES('pg_namespace'::regclass,schema_oid);
  INSERT INTO pg_temp.bg1_new_objects
    SELECT 'pg_class'::regclass,c.oid FROM pg_class c WHERE c.relnamespace=schema_oid
    UNION SELECT 'pg_class'::regclass,c.reltoastrelid FROM pg_class c WHERE c.relnamespace=schema_oid AND c.reltoastrelid<>0
    UNION SELECT 'pg_class'::regclass,i.indexrelid FROM pg_index i JOIN pg_class c ON c.reltoastrelid=i.indrelid WHERE c.relnamespace=schema_oid;
  INSERT INTO pg_temp.bg1_new_objects
    SELECT 'pg_type'::regclass,t.oid FROM pg_type t WHERE t.typnamespace=schema_oid
      OR t.typrelid IN (SELECT objid FROM pg_temp.bg1_new_objects WHERE classid='pg_class'::regclass);
  INSERT INTO pg_temp.bg1_new_objects
    SELECT 'pg_constraint'::regclass,c.oid FROM pg_constraint c WHERE c.conrelid IN (SELECT objid FROM pg_temp.bg1_new_objects WHERE classid='pg_class'::regclass)
    UNION SELECT 'pg_trigger'::regclass,t.oid FROM pg_trigger t WHERE t.tgrelid IN (SELECT objid FROM pg_temp.bg1_new_objects WHERE classid='pg_class'::regclass)
    UNION SELECT 'pg_policy'::regclass,p2.oid FROM pg_policy p2 WHERE p2.polrelid IN (SELECT objid FROM pg_temp.bg1_new_objects WHERE classid='pg_class'::regclass)
    UNION SELECT 'pg_attrdef'::regclass,d.oid FROM pg_attrdef d WHERE d.adrelid IN (SELECT objid FROM pg_temp.bg1_new_objects WHERE classid='pg_class'::regclass);

  FOR f IN SELECT * FROM jsonb_to_recordset(approved->'replacements') AS x(signature text,hash text) LOOP
    SELECT * INTO STRICT checked_function_row FROM pg_proc WHERE oid=to_regprocedure(f.signature);
    IF encode(sha256(convert_to(checked_function_row.prosrc,'UTF8')),'hex')<>f.hash
      OR NOT before_value ? ('function:'||checked_function_row.oid)
      OR (after_value->('function:'||checked_function_row.oid))-'definition' IS DISTINCT FROM (before_value->('function:'||checked_function_row.oid))-'definition' THEN
      RAISE EXCEPTION 'bg1 replacement exceeds approved body' USING ERRCODE='P7901'; END IF;
  END LOOP;
  -- Every predecessor key remains byte-identical except the explicitly hashed
  -- replacement body. New graph edges must originate at an enumerated new
  -- object; incoming foreign edges to old authority cannot be silently learned.
  FOR entry IN SELECT key,value FROM jsonb_each(before_value) LOOP
    IF after_value->entry.key IS NOT DISTINCT FROM entry.value THEN CONTINUE; END IF;
    IF entry.key LIKE 'function:%' AND EXISTS(SELECT 1 FROM jsonb_array_elements(approved->'replacements') a
      WHERE to_regprocedure(a->>'signature')::oid=split_part(entry.key,':',2)::oid)
      AND (after_value->entry.key)-'definition' IS NOT DISTINCT FROM entry.value-'definition' THEN CONTINUE; END IF;
    RAISE EXCEPTION 'bg1 predecessor graph changed' USING ERRCODE='P7901';
  END LOOP;
  FOR entry IN SELECT key,value FROM jsonb_each(after_value) WHERE NOT before_value ? key LOOP
    object_class:=CASE split_part(entry.key,':',1)
      WHEN 'namespace' THEN 'pg_namespace'::regclass WHEN 'function' THEN 'pg_proc'::regclass
      WHEN 'relation' THEN 'pg_class'::regclass WHEN 'attribute' THEN 'pg_class'::regclass WHEN 'index' THEN 'pg_class'::regclass
      WHEN 'type' THEN 'pg_type'::regclass WHEN 'constraint' THEN 'pg_constraint'::regclass
      WHEN 'trigger' THEN 'pg_trigger'::regclass WHEN 'policy' THEN 'pg_policy'::regclass WHEN 'default' THEN 'pg_attrdef'::regclass
      WHEN 'dependency' THEN (entry.value->>'classid')::oid WHEN 'shared' THEN (entry.value->>'classid')::oid END;
    object_id:=CASE WHEN split_part(entry.key,':',1) IN ('dependency','shared') THEN (entry.value->>'objid')::oid
      ELSE split_part(entry.key,':',2)::oid END;
    IF object_class IS NULL OR NOT EXISTS(SELECT 1 FROM pg_temp.bg1_new_objects o WHERE o.classid=object_class AND o.objid=object_id) THEN
      RAISE EXCEPTION 'bg1 unreviewed additive graph edge' USING ERRCODE='P7901'; END IF;
  END LOOP;
  INSERT INTO official_v3_guard_private.baselines_v1(component,predecessor_digest,catalog)
    VALUES('all',encode(sha256(convert_to(before_value::text,'UTF8')),'hex'),after_value);
  SELECT value INTO STRICT before_value FROM pg_temp.bg1_before WHERE kind='hrs';
  INSERT INTO official_v3_guard_private.baselines_v1(component,predecessor_digest,catalog)
    VALUES('hrs',encode(sha256(convert_to(before_value::text,'UTF8')),'hex'),(
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
));
  SELECT value INTO STRICT before_value FROM pg_temp.bg1_before WHERE kind='jobs';
  SELECT q.value INTO current_value FROM (SELECT pg_catalog.to_jsonb(pg_catalog.encode(pg_catalog.sha256(pg_catalog.convert_to(q.value::text,'UTF8')),'hex')) AS value FROM (
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
) AS value
) q) q; result_value:=result_value||jsonb_build_object('hrs1-catalog',current_value);
SELECT q.value INTO current_value FROM (SELECT pg_catalog.to_jsonb(pg_catalog.encode(pg_catalog.sha256(pg_catalog.convert_to(q.value::text,'UTF8')),'hex')) AS value FROM (
SELECT pg_catalog.jsonb_agg(pg_catalog.jsonb_build_object(
  'catalog',pg_catalog.to_jsonb(p)-'prosrc'-'prosqlbody'-'probin',
  'definition',pg_catalog.encode(pg_catalog.sha256(pg_catalog.convert_to(pg_catalog.pg_get_functiondef(p.oid),'UTF8')),'hex'))
  ORDER BY p.oid) AS value FROM pg_catalog.pg_proc p JOIN pg_catalog.pg_namespace n ON n.oid=p.pronamespace
  WHERE n.nspname IN ('official_v3_jobs_private','official_v3_jobs_api')
) q) q; result_value:=result_value||jsonb_build_object('jobs-functions',current_value);
SELECT q.value INTO current_value FROM (SELECT pg_catalog.to_jsonb(pg_catalog.encode(pg_catalog.sha256(pg_catalog.convert_to(q.value::text,'UTF8')),'hex')) AS value FROM (
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
) q) q; result_value:=result_value||jsonb_build_object('jobs-relations',current_value);
SELECT q.value INTO current_value FROM (SELECT pg_catalog.to_jsonb(pg_catalog.encode(pg_catalog.sha256(pg_catalog.convert_to(q.value::text,'UTF8')),'hex')) AS value FROM (
SELECT pg_catalog.jsonb_agg(pg_catalog.to_jsonb(t) ORDER BY t.oid) AS value
  FROM pg_catalog.pg_type t JOIN pg_catalog.pg_namespace n ON n.oid=t.typnamespace WHERE n.nspname IN ('official_v3_jobs_private','official_v3_jobs_api')
) q) q; result_value:=result_value||jsonb_build_object('jobs-types',current_value);
SELECT q.value INTO current_value FROM (SELECT pg_catalog.to_jsonb(pg_catalog.encode(pg_catalog.sha256(pg_catalog.convert_to(q.value::text,'UTF8')),'hex')) AS value FROM (
SELECT pg_catalog.jsonb_agg(pg_catalog.to_jsonb(n) ORDER BY n.oid) AS value
  FROM pg_catalog.pg_namespace n WHERE n.nspname IN ('official_v3_jobs_private','official_v3_jobs_api')
) q) q; result_value:=result_value||jsonb_build_object('jobs-schemas',current_value);
SELECT q.value INTO current_value FROM (WITH scope_schemas AS (
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
)::text,'UTF8')),'hex')) AS value) q; result_value:=result_value||jsonb_build_object('jobs-dependencies',current_value);
SELECT q.value INTO current_value FROM (SELECT pg_catalog.to_jsonb(pg_catalog.encode(pg_catalog.sha256(pg_catalog.convert_to(q.value::text,'UTF8')),'hex')) AS value FROM (
SELECT pg_catalog.jsonb_agg(pg_catalog.jsonb_build_object(
  'catalog',pg_catalog.to_jsonb(p)-'prosrc'-'prosqlbody'-'probin',
  'definition',pg_catalog.encode(pg_catalog.sha256(pg_catalog.convert_to(pg_catalog.pg_get_functiondef(p.oid),'UTF8')),'hex'))
  ORDER BY p.oid) AS value FROM pg_catalog.pg_proc p JOIN pg_catalog.pg_namespace n ON n.oid=p.pronamespace
  WHERE n.nspname IN ('jetnity_ot_auth','official_v3_method_private','official_v3_method_api','official_v3_intake_private','official_v3_intake_api')
) q) q; result_value:=result_value||jsonb_build_object('prerequisite-functions',current_value);
SELECT q.value INTO current_value FROM (SELECT pg_catalog.to_jsonb(pg_catalog.encode(pg_catalog.sha256(pg_catalog.convert_to(q.value::text,'UTF8')),'hex')) AS value FROM (
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
) q) q; result_value:=result_value||jsonb_build_object('prerequisite-relations',current_value);
SELECT q.value INTO current_value FROM (SELECT pg_catalog.to_jsonb(pg_catalog.encode(pg_catalog.sha256(pg_catalog.convert_to(q.value::text,'UTF8')),'hex')) AS value FROM (
SELECT pg_catalog.jsonb_agg(pg_catalog.to_jsonb(t) ORDER BY t.oid) AS value
  FROM pg_catalog.pg_type t JOIN pg_catalog.pg_namespace n ON n.oid=t.typnamespace WHERE n.nspname IN ('jetnity_ot_auth','official_v3_method_private','official_v3_method_api','official_v3_intake_private','official_v3_intake_api')
) q) q; result_value:=result_value||jsonb_build_object('prerequisite-types',current_value);
SELECT q.value INTO current_value FROM (SELECT pg_catalog.to_jsonb(pg_catalog.encode(pg_catalog.sha256(pg_catalog.convert_to(q.value::text,'UTF8')),'hex')) AS value FROM (
SELECT pg_catalog.jsonb_agg(pg_catalog.to_jsonb(n) ORDER BY n.oid) AS value
  FROM pg_catalog.pg_namespace n WHERE n.nspname IN ('jetnity_ot_auth','official_v3_method_private','official_v3_method_api','official_v3_intake_private','official_v3_intake_api')
) q) q; result_value:=result_value||jsonb_build_object('prerequisite-schemas',current_value);
SELECT q.value INTO current_value FROM (WITH scope_schemas AS (
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
)::text,'UTF8')),'hex')) AS value) q; result_value:=result_value||jsonb_build_object('prerequisite-dependencies',current_value);
SELECT q.value INTO current_value FROM (SELECT pg_catalog.to_jsonb(pg_catalog.encode(pg_catalog.sha256(pg_catalog.convert_to(q.value::text,'UTF8')),'hex')) AS value FROM (
SELECT pg_catalog.jsonb_agg(pg_catalog.jsonb_build_object('oid',r.oid,'name',r.rolname,
 'super',r.rolsuper,'inherit',r.rolinherit,'login',r.rolcanlogin,'create_role',r.rolcreaterole,
 'create_db',r.rolcreatedb,'replicate',r.rolreplication,'bypass',r.rolbypassrls,'config',r.rolconfig,
 'connection_limit',r.rolconnlimit,'valid_until',r.rolvaliduntil,
 'settings',(SELECT pg_catalog.jsonb_agg(pg_catalog.to_jsonb(s) ORDER BY s.setdatabase,s.setrole)
   FROM pg_catalog.pg_db_role_setting s WHERE s.setrole=r.oid)) ORDER BY r.oid) AS value
 FROM pg_catalog.pg_roles r WHERE r.rolname IN ('postgres','ot_v3_jobs_owner','ot_v3_jobs_caller','ot_v3_intake_owner','ot_v3_intake_caller','ot_v3_method_reader')
) q) q; result_value:=result_value||jsonb_build_object('protected-roles',current_value);
SELECT q.value INTO current_value FROM (SELECT pg_catalog.to_jsonb(pg_catalog.encode(pg_catalog.sha256(pg_catalog.convert_to(q.value::text,'UTF8')),'hex')) AS value FROM (
SELECT pg_catalog.jsonb_agg(pg_catalog.jsonb_build_object('role',m.roleid,'member',m.member,
 'grantor',m.grantor,'admin',m.admin_option,'inherit',m.inherit_option,'set',m.set_option)
 ORDER BY m.roleid,m.member,m.grantor) AS value FROM pg_catalog.pg_auth_members m
 WHERE (m.roleid='postgres'::pg_catalog.regrole OR m.member='postgres'::pg_catalog.regrole)
   AND NOT(m.roleid IN ('ot_v3_jobs_owner'::pg_catalog.regrole,'ot_v3_intake_owner'::pg_catalog.regrole)
     AND m.member='postgres'::pg_catalog.regrole AND m.grantor='postgres'::pg_catalog.regrole
     AND NOT m.admin_option AND NOT m.inherit_option AND m.set_option)
) q) q; result_value:=result_value||jsonb_build_object('creator-edges',current_value);
SELECT q.value INTO current_value FROM (SELECT pg_catalog.jsonb_build_object('installer','postgres'::pg_catalog.regrole::oid,
 'entries',(SELECT pg_catalog.jsonb_agg(pg_catalog.to_jsonb(d) ORDER BY d.defaclrole,d.defaclnamespace,d.defaclobjtype)
 FROM pg_catalog.pg_default_acl d WHERE d.defaclrole IN
   (SELECT r.oid FROM pg_catalog.pg_roles r WHERE r.rolname IN ('postgres','ot_v3_jobs_owner','ot_v3_jobs_caller','ot_v3_intake_owner','ot_v3_intake_caller','ot_v3_method_reader'))
 OR d.defaclnamespace IN (SELECT n.oid FROM pg_catalog.pg_namespace n WHERE n.nspname IN ('official_v3_jobs_private','official_v3_jobs_api','jetnity_ot_auth','official_v3_method_private','official_v3_method_api','official_v3_intake_private','official_v3_intake_api')))) AS value) q; result_value:=result_value||jsonb_build_object('creator-defaults',current_value);
SELECT q.value INTO current_value FROM (SELECT pg_catalog.to_jsonb(pg_catalog.encode(pg_catalog.sha256(pg_catalog.convert_to(q.value::text,'UTF8')),'hex')) AS value FROM (
SELECT pg_catalog.jsonb_build_object('oid',d.oid,'name',d.datname,'owner',d.datdba,'acl',d.datacl,
 'encoding',d.encoding,'allow_connections',d.datallowconn,'connection_limit',d.datconnlimit,
 'settings',(SELECT pg_catalog.jsonb_agg(pg_catalog.to_jsonb(s) ORDER BY s.setrole)
   FROM pg_catalog.pg_db_role_setting s WHERE s.setdatabase=d.oid AND s.setrole=0)) AS value
 FROM pg_catalog.pg_database d WHERE d.datname=current_database()
) q) q; result_value:=result_value||jsonb_build_object('database',current_value);
  result_value:=result_value||jsonb_build_object('package-context',before_value->'package-context');
  INSERT INTO official_v3_guard_private.baselines_v1(component,predecessor_digest,catalog)
    VALUES('jobs',encode(sha256(convert_to(before_value::text,'UTF8')),'hex'),result_value);
END $exact_delta$;

DO $certify_existing$
DECLARE component_value text; content_value text; original_value jsonb; entry_value jsonb; instant timestamptz:=clock_timestamp();
BEGIN
  PERFORM official_v3_guard_private.check_hma_v1();
  PERFORM official_v3_guard_private.check_s1_v1();
  PERFORM official_v3_guard_private.check_jobs_v1();
  PERFORM official_v3_guard_private.check_hrs_v1();
  FOREACH component_value IN ARRAY ARRAY['hma','s1','jobs'] LOOP
    content_value:=official_v3_guard_private.content_digest_v1(component_value);
    SELECT value INTO STRICT original_value FROM pg_temp.bg1_before WHERE kind=component_value||'-content';
    IF to_jsonb(content_value) IS DISTINCT FROM original_value THEN RAISE EXCEPTION 'bg1 historical data changed' USING ERRCODE='P7901'; END IF;
    entry_value:=jsonb_build_object('component',component_value,'generation',1,'before_digest',NULL,
      'after_digest',content_value,'predecessor_hash',NULL,'recorded_at',instant);
    INSERT INTO official_v3_guard_private.certificate_history_v1 VALUES(component_value,1,NULL,content_value,NULL,instant,
      encode(sha256(convert_to('bg1-certificate:v1:'||entry_value::text,'UTF8')),'hex'));
    INSERT INTO official_v3_guard_private.certificates_v1 VALUES(component_value,1,content_value);
  END LOOP;
  SELECT value INTO STRICT original_value FROM pg_temp.bg1_before WHERE kind='hrs-content';
  IF to_jsonb(official_v3_guard_private.hrs_certificate_v1()) IS DISTINCT FROM original_value THEN
    RAISE EXCEPTION 'bg1 original HRS certificate changed' USING ERRCODE='P7901'; END IF;
  PERFORM official_v3_guard_private.check_certificates_v1();
  PERFORM official_v3_guard_private.check_retirements_v1();
  PERFORM official_v3_guard_private.check_control_v1();
  PERFORM official_v3_guard_private.assert_catalog_v1();
  IF EXISTS(WITH RECURSIVE inherited_roles(role_oid) AS (
      SELECT oid FROM pg_roles WHERE rolname IN ('ot_v3_jobs_caller','ot_v3_intake_caller','ot_v3_method_reader')
      UNION
      SELECT m.member FROM pg_auth_members m JOIN inherited_roles p ON p.role_oid=m.roleid
        WHERE m.inherit_option
    ), runtime_roles(role_oid) AS (
      SELECT role_oid FROM inherited_roles
      UNION
      SELECT m.member FROM pg_auth_members m JOIN runtime_roles p ON p.role_oid=m.roleid
        WHERE m.set_option
    )
    SELECT 1 FROM pg_stat_activity a JOIN pg_roles r ON r.oid=a.usesysid
    WHERE a.pid<>pg_backend_pid() AND (r.rolname IN ('ot_v3_result_writer','ot_v3_result_reader','ot_v3_result_verifier')
      OR EXISTS(SELECT 1 FROM runtime_roles p WHERE p.role_oid=r.oid))) THEN
    RAISE EXCEPTION 'bg1 final quiescence refusal' USING ERRCODE='P7901'; END IF;
END $certify_existing$;
