-- BG1-STATUS1: fixed Dev-only additive status RPC; provider transaction required.
SET LOCAL jetnity.bg1_status_target='dev:yfvbxvijcorffwxbxahl:BG1-STATUS1';
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
    OR current_setting('jetnity.bg1_status_target',true) IS DISTINCT FROM 'dev:yfvbxvijcorffwxbxahl:BG1-STATUS1'
    OR current_setting('createrole_self_grant')<>''
    OR NOT EXISTS(SELECT 1 FROM pg_roles WHERE rolname='postgres' AND NOT rolsuper AND rolcreaterole AND rolbypassrls)
    OR NOT EXISTS(SELECT 1 FROM pg_namespace WHERE nspname='official_v3_guard_private') THEN
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

CREATE TEMP TABLE bg1_status_before(kind text PRIMARY KEY,value jsonb NOT NULL) ON COMMIT DROP;
DO $status_predecessor$
DECLARE pre_expected record; pre_actual record; pre_catalog jsonb; pre_table text; pre_digest text; pre_count bigint;
BEGIN
  IF to_regclass('official_v3_guard_private.status_baseline_v1') IS NOT NULL
    OR EXISTS(SELECT 1 FROM pg_proc p JOIN pg_namespace n ON n.oid=p.pronamespace
      WHERE n.nspname='official_v3_guard_private' AND p.proname='catalog_status_v1'
        OR n.nspname='public' AND p.proname='official_v3_guard_alarm_status_v1') THEN
    RAISE EXCEPTION 'bg1 status exact unused successor required' USING ERRCODE='P7901';
  END IF;
  -- These hashes come from the complete, pinned actually installed artifact.
  -- The old catalog query is also embedded unchanged: no trust in an altered
  -- live catalog/assert helper can silently introduce a successor baseline.
  FOR pre_expected IN SELECT * FROM (VALUES
    ('official_v3_guard_private.immutable_v1()','912ce0a3cee4ab57ee76be8425053f5f42963db5a2943a76f0d49d70059f963b'),
    ('official_v3_guard_private.require_open_v1()','9924b9d1c0d0590f073ce065a2c47e5d06124efef4a15e6ae97177b9789c1203'),
    ('official_v3_guard_private.check_control_v1()','8a37a92bd1293a467665da5831d717e7675650af9a2f5ef60e1cf57899a99eb4'),
    ('official_v3_guard_private.hrs_catalog_v1()','90983802fa25e02731f0595a21deb0a54e6712f470b765be176d3b27ab7b835d'),
    ('official_v3_guard_private.open_until_v1()','38a690b6246405e05f46cccca99753b4031d9efc78069c53afe83ae2cfab5aaf'),
    ('official_v3_guard_private.jobs_catalog_v1()','389b3202c4d2af2d3d8392f594b2b88663f94b91cae9527017e53825a72b5fe5'),
    ('official_v3_guard_private.intake_retired_v1(text)','d9156156a14d52492b1bbad6f39342486c5a6c69a2aa21139766156e104ef282'),
    ('official_v3_guard_private.attempt_retired_v1(text)','d98f6128b8854fe3e94bc7b577d57e9108f1ddde62c9468abf1050e76f043045'),
    ('official_v3_guard_private.alarm_status_v1()','c0d610e700e6dd48b058256ef30bcee551f39a045e70e26429baaa7c3bc0f65b'),
    ('official_v3_guard_private.catalog_v1()','28a3e90b0e6be9db58d5910530437b4a76bd5950663d37a1cbcf8ced8545b1db'),
    ('official_v3_guard_private.assert_catalog_v1()','67e3851c5e7dfc49f75e55b5d7e0d8eec12372a6a71e1750c603a19c78db0590'),
    ('official_v3_guard_private.check_hma_v1()','917992aba6dd635fc0e5fd0c7afacd4456cb47a020ca01be80047687caf7127a'),
    ('official_v3_guard_private.check_s1_v1()','fe7647b8fc342215a286d4853af53c2a91dde01cb7f5dfd131a971d91ea03204'),
    ('official_v3_guard_private.check_method_link_v1(jsonb,timestamptz)','9be92d807c7c15c33a77746ef94fab25654dfb3af6a83d6641c37df35d5df074'),
    ('official_v3_guard_private.check_jobs_v1()','12560e25fc355e9fd903be2bc565b92a78d97f8601b1207f9204bfb8552125d0'),
    ('official_v3_guard_private.hrs_certificate_v1()','64ec973017025af2208a28c89d462182fc218db32df190c2cd5cebe91c14d5f1'),
    ('official_v3_guard_private.check_hrs_v1()','de01e031c184b552e946cb30621aebfdaf1b7525c34024d73be772d4ab30397b'),
    ('official_v3_guard_private.content_digest_v1(text)','804261846f2acd99017f3aed14a5f3859616a913e5ab24ecf32bdd185f40dda6'),
    ('official_v3_guard_private.check_certificate_v1(text)','66cdca6a3635b3bd9b4c60e6751cf07ff78494ef1d726b3aa1dad9d31ae16e5e'),
    ('official_v3_guard_private.check_certificates_v1()','f4e8ada03aa20a08c3d1cff1973ba5757796f5edbb3b41bbeb5bee5b5c858fea'),
    ('official_v3_guard_private.begin_component_v1(text)','5f3029465bea4582e5b2441e5f5dada049b1d318d5d0a50752fdbdee3f22496b'),
    ('official_v3_guard_private.seal_component_v1(text)','efe6ac203d0f8a32c70602a16669d044477f7da86c125d9d641c5e20f1847051'),
    ('official_v3_guard_private.owner_session_v1()','48ba849f43068ae1f3b98a3d794ac060afc17c0c32c7b167a1495d9a6a2bdd26'),
    ('official_v3_guard_private.current_method_v1()','1a18f9d6c3ba0a157dea5ae199501ba173cf0818eb207a3003d0e0b314c86423'),
    ('official_v3_guard_private.fixed_method_v1()','8e993b52161c9495b075f962f390eb61d70da54ae9e69bc746b4b6b3560f7770'),
    ('official_v3_guard_private.recovery_jobs_v1()','e5751cc59b682862adf0797c04b2107eb32e173ec60420a5d8bac8f1ca231c79'),
    ('official_v3_guard_private.recovery_intake_v1(jsonb)','89dddddb04af829f1e3125d9baa2a60e9ace637b1d87e520b153f9b88e955dcc'),
    ('official_v3_guard_private.recovery_hrs_v1()','ab129014587c155f068b9457dc75e2f81305d89c9385f768b2404b927e54e8b2'),
    ('official_v3_guard_private.recovery_snapshot_v1()','0d7f21053b54a6ffacc23a96c1929a3cbdfaed9d6c7491a5ecaf902b3e09591f'),
    ('official_v3_guard_private.retired_state_v1(text)','c4efa2762f8a86801c26362d3598985ccee340cecde563c473466078a74d4f21'),
    ('official_v3_guard_private.close_jobs_v1(text)','5712d20fd40d1dcb78d81b9de3a20c1252d3394dcc0f8bf582ea074581b9a63c'),
    ('official_v3_guard_private.check_retired_jobs_v1(jsonb)','1d1548139f8b59c58daf5482353b0c0788420ee2c3cd033c881663c9e9e2367f'),
    ('official_v3_guard_private.check_retired_s1_v1(jsonb)','81f6c9307db1b7c57d22ddecaa49b4c8d815511b8528a12d13319b472d8f48db'),
    ('official_v3_guard_private.check_retired_hrs_v1(jsonb)','7831102e63c0a2c65415332d706af38da59a3a6226b02a024d91313474fc25df'),
    ('official_v3_guard_private.check_retirements_v1()','439bb69a36625c4611ae3bfb761266c4367e74ce32cf9765c6eaf37d8537466d'),
    ('official_v3_guard_private.incident_snapshot_v1()','4ba7e039404a7d288a2d2fa7d9d61419eb0d3c2e6383c6a662ffb2185a645960'),
    ('public.official_v3_guard_review_v1()','acf1fb22da5c8982014e802d5bb7a258ceaa4f8f4256e5475d49267e980bded9'),
    ('public.official_v3_guard_retire_v1(text,text)','ebeda2435d8d2cd2efaa0d2e190d1654e8a50f402513ed5c8ffae779ebc366d6'),
    ('public.official_v3_guard_resume_v1(text,text)','173ddbb036a23d4e0eb1051c0434c11a72b2726a79da255f112e245dbe0a2f72'),
    ('public.official_v3_guard_confirm_v1(text,text,text)','80249de576440c3f7b00ee97aa86f28d826692d44edcab6e2de905c41d6294cc'),
    ('official_v3_guard_private.ch_de_snapshot_v1(jsonb,integer,timestamptz,text)','da2ad4db69be956317ec9d943c9353bd0237c15e553233a33fd4db802aa155ef'),
    ('official_v3_guard_private.latch_incident_v1(timestamptz,text)','1d84d32855553fb926147fc01fb79751432c80fa6e40e02ea979722095ffbf34'),
    ('official_v3_guard_private.audit_v1()','f357faa41668ae68565d12a2f9086dff86045e0af4b55b6165a4cf5303c51cc8'),
    ('official_v3_guard_private.original_valid_v1(jsonb,text,text)','8b0bb27a424e3d18b7bce8ef4f49c3035f91982863d75f81917e247882e570e5'),
    ('official_v3_guard_private.completion_valid_v1(jsonb,text,integer,integer,uuid,jsonb,jsonb)','5df62d4eb3524bb116b0fcc6cc739f356aa4e4df776819918e7fe866cf45c940'),
    ('official_v3_guard_private.fingerprint_hma_v1()','2c836cbd9f1968cac8f0375adb72c83a029472d88ff356aaebd71a7101cd3962'),
    ('official_v3_guard_private.fingerprint_s1_v1()','570b1b640aae154e31ae043db42eb278cb82fab07aa562eca4e36c5b359da2a0'),
    ('official_v3_guard_private.fingerprint_jobs_v1()','78fdfd4d8e69e9790ff5cae1fc40bf016bcde4ea7ef04ce11f693835cc6f060a'),
    ('official_v3_guard_private.begin_hma_v1()','53aa1bd3c09d60a74c545e4b50862bcb606705cec5b7d0f18e0dbd66be94a97f'),
    ('official_v3_guard_private.seal_hma_v1()','882b622600de1c106fc425523a7daf75037a32320920eff87aaaa4d539c695af'),
    ('official_v3_guard_private.begin_s1_v1()','3df3caf2db11d909febbe9775e2490e73f2d88564d997c6e51869e9b176717c8'),
    ('official_v3_guard_private.seal_s1_v1()','3546d2b21a6ddd54b92e1e81d339fa0eef9baa8d813f70733000acd6450c436d'),
    ('official_v3_guard_private.begin_jobs_v1()','0e74fa135228d58e75e7639ff9118ea61695cf93f8bb34e19d6516d084e36e15'),
    ('official_v3_guard_private.seal_jobs_v1()','4c79c756a9a06cf55720ff9c341616f34b33383beb9fae7246cbaabd1e69bd2a'),
    ('official_v3_guard_private.allowed_owner_edge_v1(oid,oid,oid,"char")','db98bb5781c212347bea467b95dfffbe59d2e3876c5969fc40234afc4ad9859d'),
    ('official_v3_method_api.confirm_operation_v1(text,text,text,integer,text,text,integer,integer,text,text,integer,text,text,text)','dc0c8e711eb360eb40022841b07a4d00f39a3a7a4edb0630bf72a8f8a622db02'),
    ('official_v3_method_api.stage_draft_v1(text,text,integer,text,text,integer)','79e627238134e15d45f09f5acb2aac7f9cf079b147d3220b2c3bbb893f992209'),
    ('official_v3_method_api.approve_v1(text,text,integer,text,text,integer,text,text,integer,text,text,text)','0b0db811d7d667ef63e607afb9cff9d48080821fd62252bf53df2f48c0e5712d'),
    ('official_v3_method_api.revoke_v1(text,text,integer,text,text,integer)','9c090121b1c5471f8e78b2e2b78813d996c82ad97ce57d60e14299d7be485e88'),
    ('official_v3_intake_api.capture_v1(jsonb,text,text)','bca5dcc14b315063bff32cad0122c0fc9e3efdc576c2b599f240f2a26d003b7a'),
    ('official_v3_intake_api.reserve_v1(jsonb,text,integer,integer)','131aa90007cb6729f9925635c98e2145f690776a56031b77a7561a068af84222'),
    ('official_v3_intake_api.finish_v1(jsonb,text,integer,integer,uuid,jsonb,jsonb)','601ab19f1054f47a52505a69c8f7a00b38ff870825fe468f21f2cea034b811c4'),
    ('official_v3_jobs_api.execute_v1(text,text,integer,text,text,integer,integer,text)','ebf97604360e16d31bff8b34e7fb6380a643d207198e9b0af2ea95821650ece5'),
    ('official_v3_jobs_private.assert_history_v1(text)','51f83aeba5523405b1948b92d34c3cebb84eef5872a97c0e02d31c0b4b105588'),
    ('official_v3_jobs_private.tx_execution_prepare_v1(jsonb,jsonb,integer,integer,timestamptz)','4fd077e6222bf925ec8d55b7e8cd53aa7703cf279583a9aaa810daca30255160'),
    ('official_v3_result_private.consume_s1_v1(jsonb,jsonb,jsonb)','d0738e696a066ffddfa725d27b1e3c8f81b4c73a5cb981a5e07460bc6db42ecd'),
    ('official_v3_result_private.assert_catalog_v1()','dac7c17f36163e0c0d6c068977e85fc35975a4621e67dceda234ca639fa945ed'),
    ('official_v3_result_private.command_v1(jsonb,jsonb)','365b04e28ffb7c6f6502f3af77f5afb7abf4d443d4a443c1f04f27128a1996c6'),
    ('official_v3_jobs_private.assert_catalog_v1()','c1f9fc5e7f3d4f0099b6e89e41d47df9165ec9b4e559807d1fff4db99bd25cfc'),
    ('official_v3_result_private.dispatch_v1(text,jsonb,text,text,integer,text,text,integer,integer,text,text)','eccdbd371a0b10f103f2d56902b21d94685e1413c3831e98a33859e8d97bab3f')
  ) expected(signature,body_hash) LOOP
    SELECT p.* INTO pre_actual FROM pg_proc p WHERE p.oid=to_regprocedure(pre_expected.signature);
    IF NOT FOUND OR encode(sha256(convert_to(pre_actual.prosrc,'UTF8')),'hex') IS DISTINCT FROM pre_expected.body_hash THEN
      RAISE EXCEPTION 'bg1 status predecessor definition mismatch' USING ERRCODE='P7901';
    END IF;
  END LOOP;
  SELECT (WITH namespaces AS (
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
SELECT jsonb_object_agg(key,value ORDER BY key COLLATE "C") FROM entries) INTO pre_catalog;
  IF (SELECT count(*) FROM official_v3_guard_private.baselines_v1)<>3
    OR pre_catalog IS DISTINCT FROM (SELECT catalog FROM official_v3_guard_private.baselines_v1 WHERE component='all') THEN
    RAISE EXCEPTION 'bg1 status predecessor catalog mismatch' USING ERRCODE='P7905';
  END IF;
  PERFORM official_v3_guard_private.assert_catalog_v1();
  PERFORM official_v3_guard_private.check_control_v1();
  PERFORM official_v3_guard_private.check_hma_v1();
  PERFORM official_v3_guard_private.check_s1_v1();
  PERFORM official_v3_guard_private.check_jobs_v1();
  PERFORM official_v3_guard_private.check_hrs_v1();
  PERFORM official_v3_guard_private.check_certificates_v1();
  PERFORM official_v3_guard_private.check_retirements_v1();
  INSERT INTO pg_temp.bg1_status_before VALUES('all',pre_catalog),('content',jsonb_build_object(
    'hma',official_v3_guard_private.content_digest_v1('hma'),
    's1',official_v3_guard_private.content_digest_v1('s1'),
    'jobs',official_v3_guard_private.content_digest_v1('jobs'),
    'hrs',official_v3_guard_private.hrs_certificate_v1()));
  -- Preserve all eight old Guard tables too, including every immutable old
  -- baseline, run, certificate and owner/recovery row. These are not reset.
  FOREACH pre_table IN ARRAY ARRAY['baselines_v1','certificates_v1','certificate_history_v1','state_v1',
    'runs_v1','incidents_v1','owner_operations_v1','retired_attempts_v1'] LOOP
    EXECUTE format('SELECT count(*),encode(sha256(convert_to(COALESCE(string_agg(encode(sha256(convert_to(to_jsonb(r)::text,''UTF8'')),''hex''),'''' ORDER BY to_jsonb(r)::text COLLATE "C"),''''),''UTF8'')),''hex'') FROM official_v3_guard_private.%I r',pre_table)
      INTO pre_count,pre_digest;
    INSERT INTO pg_temp.bg1_status_before VALUES('guard:'||pre_table,jsonb_build_object('count',pre_count,'digest',pre_digest));
  END LOOP;
END $status_predecessor$;

CREATE TABLE official_v3_guard_private.status_baseline_v1 (
  singleton boolean PRIMARY KEY DEFAULT true CHECK (singleton),
  predecessor_catalog_digest text NOT NULL CHECK (predecessor_catalog_digest ~ '^[a-f0-9]{64}$'),
  predecessor_baselines_digest text NOT NULL CHECK (predecessor_baselines_digest ~ '^[a-f0-9]{64}$'),
  provider_digest text NOT NULL CHECK (provider_digest='a3a0be9c4eb1e2c61be428d0b825ee8a3b6780f3f8d154c0ccc2b1317181f950'),
  required_generation bigint NOT NULL CHECK (required_generation>0),
  proof_not_before timestamptz NOT NULL CHECK (isfinite(proof_not_before)),
  catalog jsonb NOT NULL
);
ALTER TABLE official_v3_guard_private.status_baseline_v1 ENABLE ROW LEVEL SECURITY;
ALTER TABLE official_v3_guard_private.status_baseline_v1 FORCE ROW LEVEL SECURITY;
CREATE POLICY owner_only ON official_v3_guard_private.status_baseline_v1 TO postgres USING (true) WITH CHECK (true);
CREATE TRIGGER immutable_v1 BEFORE UPDATE OR DELETE ON official_v3_guard_private.status_baseline_v1
  FOR EACH ROW EXECUTE FUNCTION official_v3_guard_private.immutable_v1();
REVOKE ALL ON TABLE official_v3_guard_private.status_baseline_v1 FROM PUBLIC,anon,authenticated,service_role,supabase_read_only_user;

CREATE FUNCTION official_v3_guard_private.catalog_status_v1() RETURNS jsonb
LANGUAGE sql STABLE SECURITY DEFINER SET search_path=pg_catalog SET jit=off AS $status_catalog$
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
      'official_v3_guard_retire_v1','official_v3_guard_resume_v1','official_v3_guard_confirm_v1','official_v3_guard_alarm_status_v1'))
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
$status_catalog$;

-- The sole existing validator replacement. The old three baseline rows and
-- original catalog_v1 remain intact and bound by their actual content hashes.
CREATE OR REPLACE FUNCTION official_v3_guard_private.assert_catalog_v1() RETURNS void
LANGUAGE plpgsql VOLATILE SECURITY DEFINER SET search_path=pg_catalog AS $$
DECLARE status_baseline official_v3_guard_private.status_baseline_v1%ROWTYPE; old_catalog jsonb; old_baselines jsonb;
BEGIN
  SELECT * INTO STRICT status_baseline FROM official_v3_guard_private.status_baseline_v1 WHERE singleton;
  SELECT catalog INTO STRICT old_catalog FROM official_v3_guard_private.baselines_v1 WHERE component='all';
  SELECT jsonb_agg(to_jsonb(b)||jsonb_build_object('installed_at',extract(epoch FROM b.installed_at)) ORDER BY b.component COLLATE "C")
    INTO old_baselines FROM official_v3_guard_private.baselines_v1 b;
  IF jsonb_array_length(old_baselines)<>3
    OR status_baseline.provider_digest<>'a3a0be9c4eb1e2c61be428d0b825ee8a3b6780f3f8d154c0ccc2b1317181f950'
    OR status_baseline.predecessor_catalog_digest IS DISTINCT FROM encode(sha256(convert_to(old_catalog::text,'UTF8')),'hex')
    OR status_baseline.predecessor_baselines_digest IS DISTINCT FROM encode(sha256(convert_to(old_baselines::text,'UTF8')),'hex')
    OR status_baseline.catalog IS DISTINCT FROM official_v3_guard_private.catalog_status_v1() THEN
    RAISE EXCEPTION 'bg1 status protected catalog changed' USING ERRCODE='P7905';
  END IF;
END $$;

-- Public output is deliberately only one health bit plus its schema. No
-- catalog/history scan, mutation, authority operation or heartbeat occurs.
-- An old still-fresh BG1 proof cannot cover this newly installed object graph.
CREATE FUNCTION public.official_v3_guard_alarm_status_v1() RETURNS jsonb
LANGUAGE plpgsql VOLATILE SECURITY DEFINER SET search_path=pg_catalog AS $$
DECLARE required_proof bigint; earliest_proof timestamptz; current_state official_v3_guard_private.state_v1%ROWTYPE;
  unavailable_value jsonb:=jsonb_build_object('schema',1,'status','unavailable');
BEGIN
  IF official_v3_guard_private.alarm_status_v1() IS DISTINCT FROM jsonb_build_object('schema',1,'status','current') THEN
    RETURN unavailable_value;
  END IF;
  SELECT required_generation,proof_not_before INTO STRICT required_proof,earliest_proof
    FROM official_v3_guard_private.status_baseline_v1 WHERE singleton;
  SELECT * INTO STRICT current_state FROM official_v3_guard_private.state_v1 WHERE singleton;
  IF current_state.generation<required_proof OR current_state.last_proof_started<earliest_proof
    OR current_state.incident_generation<>current_state.resumed_generation
    OR current_state.last_finished>current_state.last_started+interval '30 seconds'
    OR current_state.valid_until<>current_state.last_due+interval '5 minutes 30 seconds'
    OR NOT EXISTS(SELECT 1 FROM official_v3_guard_private.runs_v1 run
      WHERE run.due_at=current_state.last_due AND run.outcome='complete' AND run.generation=current_state.generation
        AND run.started_at=current_state.last_started AND run.proof_started_at=current_state.last_proof_started
        AND run.finished_at=current_state.last_finished)
    OR clock_timestamp()<greatest(current_state.last_observed,current_state.last_finished,earliest_proof)
    OR clock_timestamp()>=current_state.valid_until THEN RETURN unavailable_value; END IF;
  RETURN jsonb_build_object('schema',1,'status','current');
EXCEPTION WHEN query_canceled OR OTHERS THEN RETURN unavailable_value;
END $$;

REVOKE ALL ON FUNCTION official_v3_guard_private.catalog_status_v1() FROM PUBLIC,anon,authenticated,service_role,supabase_read_only_user;
REVOKE ALL ON FUNCTION public.official_v3_guard_alarm_status_v1() FROM PUBLIC,anon,authenticated,service_role,supabase_read_only_user;
GRANT EXECUTE ON FUNCTION public.official_v3_guard_alarm_status_v1() TO anon;

CREATE TEMP TABLE bg1_status_objects(classid oid,objid oid,PRIMARY KEY(classid,objid)) ON COMMIT DROP;
DO $status_delta$
DECLARE status_approved jsonb:='[{"signature":"official_v3_guard_private.catalog_status_v1()","hash":"c23417ecf2a50291c347579546316c53ab4b1618b17c92a211022d63d41c6beb","language":"sql","volatile":"s","config":["search_path=pg_catalog","jit=off"],"result":"jsonb","grantees":["postgres"]},{"signature":"official_v3_guard_private.assert_catalog_v1()","hash":"e2707aa34f7a1686fbfaf1185ae524f435bd01a8708edc86cb19b5a89646e77f","language":"plpgsql","volatile":"v","config":["search_path=pg_catalog"],"result":"void","grantees":["postgres"]},{"signature":"public.official_v3_guard_alarm_status_v1()","hash":"ae595595cea5baa628ba1cbc6d4b94a1d66884dbc87556a6039f297485d8103b","language":"plpgsql","volatile":"v","config":["search_path=pg_catalog"],"result":"jsonb","grantees":["anon","postgres"]}]'::jsonb; status_expected record; status_actual pg_proc%ROWTYPE;
  status_acl jsonb; status_before jsonb; status_after jsonb; status_entry record;
  status_class oid; status_id oid; status_relation oid:='official_v3_guard_private.status_baseline_v1'::regclass;
  status_original_assert oid:='official_v3_guard_private.assert_catalog_v1()'::regprocedure;
BEGIN
  SELECT value INTO STRICT status_before FROM pg_temp.bg1_status_before WHERE kind='all';
  FOR status_expected IN SELECT * FROM jsonb_to_recordset(status_approved)
    AS expected(signature text,hash text,language text,volatile text,config jsonb,result text,grantees jsonb) LOOP
    SELECT * INTO STRICT status_actual FROM pg_proc WHERE oid=to_regprocedure(status_expected.signature);
    SELECT jsonb_agg(role_name ORDER BY role_name) INTO status_acl FROM (
      SELECT DISTINCT CASE a.grantee WHEN 0 THEN 'PUBLIC' ELSE pg_get_userbyid(a.grantee) END AS role_name
      FROM aclexplode(COALESCE(status_actual.proacl,acldefault('f',status_actual.proowner))) a
    ) acl;
    IF status_actual.proowner<>'postgres'::regrole OR status_actual.prokind<>'f'
      OR NOT status_actual.prosecdef OR status_actual.proleakproof OR status_actual.proisstrict OR status_actual.proretset
      OR status_actual.pronargs<>0 OR status_actual.pronargdefaults<>0 OR status_actual.provariadic<>0
      OR status_actual.proargnames IS NOT NULL OR status_actual.proargmodes IS NOT NULL OR status_actual.proallargtypes IS NOT NULL
      OR status_actual.proparallel<>'u' OR status_actual.provolatile::text<>status_expected.volatile
      OR status_actual.prorettype<>to_regtype(status_expected.result)
      OR (SELECT lanname FROM pg_language WHERE oid=status_actual.prolang)<>status_expected.language
      OR to_jsonb(status_actual.proconfig) IS DISTINCT FROM status_expected.config
      OR status_acl IS DISTINCT FROM status_expected.grantees
      OR encode(sha256(convert_to(status_actual.prosrc,'UTF8')),'hex')<>status_expected.hash
      OR EXISTS(SELECT 1 FROM aclexplode(COALESCE(status_actual.proacl,acldefault('f',status_actual.proowner))) a
        WHERE a.privilege_type<>'EXECUTE' OR a.is_grantable OR a.grantor<>status_actual.proowner) THEN
      RAISE EXCEPTION 'bg1 status exact function contract' USING ERRCODE='P7901';
    END IF;
    IF status_actual.oid<>status_original_assert THEN
      INSERT INTO pg_temp.bg1_status_objects VALUES('pg_proc'::regclass,status_actual.oid);
    END IF;
  END LOOP;
  IF EXISTS(SELECT 1 FROM pg_class c WHERE c.oid=status_relation AND (c.relowner<>'postgres'::regrole
    OR c.relkind<>'r' OR NOT c.relrowsecurity OR NOT c.relforcerowsecurity
    OR EXISTS(SELECT 1 FROM aclexplode(COALESCE(c.relacl,acldefault('r',c.relowner))) a
      WHERE a.grantee<>'postgres'::regrole OR a.grantor<>'postgres'::regrole OR a.is_grantable)))
    OR (SELECT count(*) FROM pg_attribute a WHERE a.attrelid=status_relation AND a.attnum>0)<>7
    OR (SELECT jsonb_agg(jsonb_build_array(a.attname,a.atttypid::regtype::text,a.attnotnull,a.attisdropped) ORDER BY a.attnum)
      FROM pg_attribute a WHERE a.attrelid=status_relation AND a.attnum>0) IS DISTINCT FROM
      '[["singleton","boolean",true,false],["predecessor_catalog_digest","text",true,false],["predecessor_baselines_digest","text",true,false],["provider_digest","text",true,false],["required_generation","bigint",true,false],["proof_not_before","timestamp with time zone",true,false],["catalog","jsonb",true,false]]'::jsonb
    OR (SELECT count(*) FROM pg_policy p WHERE p.polrelid=status_relation)<>1
    OR NOT EXISTS(SELECT 1 FROM pg_policy p WHERE p.polrelid=status_relation AND p.polname='owner_only'
      AND p.polroles=ARRAY['postgres'::regrole::oid] AND p.polpermissive AND p.polcmd='*'
      AND pg_get_expr(p.polqual,p.polrelid)='true' AND pg_get_expr(p.polwithcheck,p.polrelid)='true')
    OR (SELECT count(*) FROM pg_trigger t WHERE t.tgrelid=status_relation)<>1
    OR NOT EXISTS(SELECT 1 FROM pg_trigger t WHERE t.tgrelid=status_relation AND t.tgname='immutable_v1'
      AND t.tgfoid='official_v3_guard_private.immutable_v1()'::regprocedure AND t.tgtype=27
      AND t.tgenabled='O' AND NOT t.tgisinternal AND t.tgnargs=0 AND t.tgqual IS NULL) THEN
    RAISE EXCEPTION 'bg1 status private baseline contract' USING ERRCODE='P7901';
  END IF;
  INSERT INTO pg_temp.bg1_status_objects
    SELECT 'pg_class'::regclass,status_relation
    UNION SELECT 'pg_class'::regclass,c.reltoastrelid FROM pg_class c WHERE c.oid=status_relation AND c.reltoastrelid<>0
    UNION SELECT 'pg_class'::regclass,i.indexrelid FROM pg_index i WHERE i.indrelid=status_relation
      OR i.indrelid=(SELECT c.reltoastrelid FROM pg_class c WHERE c.oid=status_relation);
  INSERT INTO pg_temp.bg1_status_objects
    SELECT 'pg_type'::regclass,t.oid FROM pg_type t WHERE t.typrelid IN
      (SELECT objid FROM pg_temp.bg1_status_objects WHERE classid='pg_class'::regclass)
      OR t.oid IN (SELECT inner_type.typarray FROM pg_type inner_type WHERE inner_type.typrelid=status_relation);
  INSERT INTO pg_temp.bg1_status_objects
    SELECT 'pg_constraint'::regclass,c.oid FROM pg_constraint c WHERE c.conrelid=status_relation
    UNION SELECT 'pg_trigger'::regclass,t.oid FROM pg_trigger t WHERE t.tgrelid=status_relation
    UNION SELECT 'pg_policy'::regclass,p.oid FROM pg_policy p WHERE p.polrelid=status_relation
    UNION SELECT 'pg_attrdef'::regclass,a.oid FROM pg_attrdef a WHERE a.adrelid=status_relation;
  status_after:=official_v3_guard_private.catalog_status_v1();
  FOR status_entry IN SELECT key,value FROM jsonb_each(status_before) LOOP
    IF status_after->status_entry.key IS NOT DISTINCT FROM status_entry.value THEN CONTINUE; END IF;
    IF status_entry.key='function:'||status_original_assert
      AND (status_after->status_entry.key)-'definition' IS NOT DISTINCT FROM status_entry.value-'definition' THEN CONTINUE; END IF;
    RAISE EXCEPTION 'bg1 status predecessor graph changed' USING ERRCODE='P7901';
  END LOOP;
  FOR status_entry IN SELECT key,value FROM jsonb_each(status_after) WHERE NOT status_before ? key LOOP
    status_class:=CASE split_part(status_entry.key,':',1)
      WHEN 'function' THEN 'pg_proc'::regclass WHEN 'relation' THEN 'pg_class'::regclass
      WHEN 'attribute' THEN 'pg_class'::regclass WHEN 'index' THEN 'pg_class'::regclass
      WHEN 'type' THEN 'pg_type'::regclass WHEN 'constraint' THEN 'pg_constraint'::regclass
      WHEN 'trigger' THEN 'pg_trigger'::regclass WHEN 'policy' THEN 'pg_policy'::regclass WHEN 'default' THEN 'pg_attrdef'::regclass
      WHEN 'dependency' THEN (status_entry.value->>'classid')::oid WHEN 'shared' THEN (status_entry.value->>'classid')::oid END;
    status_id:=CASE WHEN split_part(status_entry.key,':',1) IN ('dependency','shared') THEN (status_entry.value->>'objid')::oid
      ELSE split_part(status_entry.key,':',2)::oid END;
    IF status_class IS NULL OR NOT EXISTS(SELECT 1 FROM pg_temp.bg1_status_objects o WHERE o.classid=status_class AND o.objid=status_id) THEN
      RAISE EXCEPTION 'bg1 status unreviewed additive graph edge' USING ERRCODE='P7901';
    END IF;
  END LOOP;
  INSERT INTO official_v3_guard_private.status_baseline_v1(singleton,predecessor_catalog_digest,predecessor_baselines_digest,
    provider_digest,required_generation,proof_not_before,catalog)
  SELECT true,encode(sha256(convert_to(status_before::text,'UTF8')),'hex'),
    encode(sha256(convert_to((SELECT jsonb_agg(to_jsonb(b)||jsonb_build_object('installed_at',extract(epoch FROM b.installed_at)) ORDER BY b.component COLLATE "C") FROM official_v3_guard_private.baselines_v1 b)::text,'UTF8')),'hex'),
    'a3a0be9c4eb1e2c61be428d0b825ee8a3b6780f3f8d154c0ccc2b1317181f950',s.generation+1,clock_timestamp(),status_after FROM official_v3_guard_private.state_v1 s WHERE s.singleton;
END $status_delta$;

DO $status_postcheck$
DECLARE post_content jsonb; post_original jsonb; post_table text; post_digest text; post_count bigint;
BEGIN
  -- Run the real complete validators, without audit_v1's due-slot shortcut and
  -- without updating any success, incident, certificate, clock or Owner row.
  PERFORM official_v3_guard_private.assert_catalog_v1();
  PERFORM official_v3_guard_private.check_control_v1();
  PERFORM official_v3_guard_private.check_hma_v1();
  PERFORM official_v3_guard_private.check_s1_v1();
  PERFORM official_v3_guard_private.check_jobs_v1();
  PERFORM official_v3_guard_private.check_hrs_v1();
  PERFORM official_v3_guard_private.check_certificates_v1();
  PERFORM official_v3_guard_private.check_retirements_v1();
  SELECT value INTO STRICT post_original FROM pg_temp.bg1_status_before WHERE kind='content';
  post_content:=jsonb_build_object('hma',official_v3_guard_private.content_digest_v1('hma'),
    's1',official_v3_guard_private.content_digest_v1('s1'),'jobs',official_v3_guard_private.content_digest_v1('jobs'),
    'hrs',official_v3_guard_private.hrs_certificate_v1());
  IF post_original IS DISTINCT FROM post_content THEN RAISE EXCEPTION 'bg1 status old data changed' USING ERRCODE='P7901'; END IF;
  FOREACH post_table IN ARRAY ARRAY['baselines_v1','certificates_v1','certificate_history_v1','state_v1',
    'runs_v1','incidents_v1','owner_operations_v1','retired_attempts_v1'] LOOP
    EXECUTE format('SELECT count(*),encode(sha256(convert_to(COALESCE(string_agg(encode(sha256(convert_to(to_jsonb(r)::text,''UTF8'')),''hex''),'''' ORDER BY to_jsonb(r)::text COLLATE "C"),''''),''UTF8'')),''hex'') FROM official_v3_guard_private.%I r',post_table)
      INTO post_count,post_digest;
    SELECT value INTO STRICT post_original FROM pg_temp.bg1_status_before WHERE kind='guard:'||post_table;
    IF post_original IS DISTINCT FROM jsonb_build_object('count',post_count,'digest',post_digest) THEN
      RAISE EXCEPTION 'bg1 status old guard history changed' USING ERRCODE='P7901'; END IF;
  END LOOP;
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
    RAISE EXCEPTION 'bg1 status final quiescence refusal' USING ERRCODE='P7901';
  END IF;
END $status_postcheck$;
