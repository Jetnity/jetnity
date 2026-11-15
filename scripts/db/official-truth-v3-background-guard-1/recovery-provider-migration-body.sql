-- BG1-RECOVERY2: fixed Dev initial CH-DE pilot, attempts 2..4; provider transaction required.
SET LOCAL jetnity.bg1_recovery_target='dev:yfvbxvijcorffwxbxahl:BG1-RECOVERY2';
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
    OR current_setting('jetnity.bg1_recovery_target',true) IS DISTINCT FROM 'dev:yfvbxvijcorffwxbxahl:BG1-RECOVERY2'
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

CREATE TEMP TABLE bg1_recovery_before(kind text PRIMARY KEY,value jsonb NOT NULL) ON COMMIT DROP;
DO $recovery_predecessor$
DECLARE expected record; actual record; before_catalog jsonb; table_name text; row_count bigint; row_digest text; owner_name text;
BEGIN
  IF to_regclass('official_v3_guard_private.recovery_baseline_v1') IS NOT NULL
    OR to_regclass('official_v3_guard_private.retired_later_attempts_v1') IS NOT NULL
    OR to_regprocedure('official_v3_guard_private.recovery_canonical_v1(jsonb,integer)') IS NOT NULL THEN
    RAISE EXCEPTION 'bg1 recovery exact unused successor required' USING ERRCODE='P7901'; END IF;
  FOR expected IN SELECT * FROM (VALUES
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
    ('official_v3_guard_private.assert_catalog_v1()','e2707aa34f7a1686fbfaf1185ae524f435bd01a8708edc86cb19b5a89646e77f'),
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
    ('official_v3_result_private.dispatch_v1(text,jsonb,text,text,integer,text,text,integer,integer,text,text)','eccdbd371a0b10f103f2d56902b21d94685e1413c3831e98a33859e8d97bab3f'),
    ('official_v3_guard_private.catalog_status_v1()','c23417ecf2a50291c347579546316c53ab4b1618b17c92a211022d63d41c6beb'),
    ('public.official_v3_guard_alarm_status_v1()','ae595595cea5baa628ba1cbc6d4b94a1d66884dbc87556a6039f297485d8103b')
  ) f(signature,body_hash) LOOP
    SELECT * INTO actual FROM pg_proc WHERE oid=to_regprocedure(expected.signature);
    IF NOT FOUND OR encode(sha256(convert_to(actual.prosrc,'UTF8')),'hex') IS DISTINCT FROM expected.body_hash THEN
      RAISE EXCEPTION 'bg1 recovery predecessor definition mismatch' USING ERRCODE='P7901'; END IF;
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
SELECT jsonb_object_agg(key,value ORDER BY key COLLATE "C") FROM entries) INTO before_catalog;
  IF before_catalog IS DISTINCT FROM (SELECT catalog FROM official_v3_guard_private.status_baseline_v1 WHERE singleton) THEN
    RAISE EXCEPTION 'bg1 recovery predecessor catalog mismatch' USING ERRCODE='P7905'; END IF;
  PERFORM official_v3_guard_private.assert_catalog_v1();
  PERFORM official_v3_guard_private.check_control_v1();
  PERFORM official_v3_guard_private.check_hma_v1();
  PERFORM official_v3_guard_private.check_s1_v1();
  PERFORM official_v3_guard_private.check_jobs_v1();
  PERFORM official_v3_guard_private.check_hrs_v1();
  PERFORM official_v3_guard_private.check_certificates_v1();
  PERFORM official_v3_guard_private.check_retirements_v1();
  INSERT INTO pg_temp.bg1_recovery_before VALUES('catalog',before_catalog),
    ('memberships',COALESCE((SELECT jsonb_agg(to_jsonb(m) ORDER BY m.oid) FROM pg_auth_members m),'[]'::jsonb)),
    ('schema_acl',(SELECT jsonb_build_object('owner',nspowner,'acl',nspacl) FROM pg_namespace WHERE nspname='official_v3_guard_private')),
    ('content',jsonb_build_object('hma',official_v3_guard_private.content_digest_v1('hma'),
      's1',official_v3_guard_private.content_digest_v1('s1'),'jobs',official_v3_guard_private.content_digest_v1('jobs'),
      'hrs',official_v3_guard_private.hrs_certificate_v1()));
  -- The installed, independently checked catalog binds the actual bootstrap
  -- grantor and original OIDs. Never edit or delete those ADMIN-only rows.
  FOREACH owner_name IN ARRAY ARRAY['ot_v3_jobs_owner','ot_v3_result_owner'] LOOP
    IF (SELECT count(*) FROM pg_auth_members WHERE roleid=to_regrole(owner_name) AND member='postgres'::regrole)<>1
      OR NOT EXISTS(SELECT 1 FROM pg_auth_members WHERE roleid=to_regrole(owner_name) AND member='postgres'::regrole
        AND grantor<>'postgres'::regrole AND admin_option AND NOT inherit_option AND NOT set_option)
      OR pg_has_role('postgres',to_regrole(owner_name),'USAGE') IS DISTINCT FROM false
      OR pg_has_role('postgres',to_regrole(owner_name),'SET') IS DISTINCT FROM false
      OR has_schema_privilege(to_regrole(owner_name),'official_v3_guard_private','CREATE') IS DISTINCT FROM false THEN
      RAISE EXCEPTION 'bg1 recovery exact original owner authority required' USING ERRCODE='P7901'; END IF;
  END LOOP;
  FOREACH table_name IN ARRAY ARRAY[
    'official_v3_method_private.revisions_v1','official_v3_method_private.heads_v1','official_v3_method_private.operations_v1',
    'official_v3_intake_private.operations_v1','official_v3_intake_private.reservations_v1','official_v3_intake_private.completions_v1',
    'official_v3_jobs_private.slots_v1','official_v3_jobs_private.subjects_v1','official_v3_jobs_private.queue_operations_v1',
    'official_v3_jobs_private.execution_starts_v1','official_v3_jobs_private.execution_results_v1','official_v3_jobs_private.execution_dispositions_v1','official_v3_jobs_private.catalog_binding_v1',
    'official_v3_result_private.binding_v1','official_v3_result_private.originals_v1','official_v3_result_private.extractions_v1','official_v3_result_private.qualifications_v1',
    'official_v3_result_private.decisions_v1','official_v3_result_private.archive_pages_v1','official_v3_result_private.versions_v1','official_v3_result_private.projections_v1',
    'official_v3_result_private.heads_v1','official_v3_result_private.operations_v1','official_v3_result_private.outbox_v1','official_v3_result_private.monitor_schedule_v1',
    'official_v3_guard_private.baselines_v1','official_v3_guard_private.certificates_v1','official_v3_guard_private.certificate_history_v1',
    'official_v3_guard_private.state_v1','official_v3_guard_private.runs_v1','official_v3_guard_private.incidents_v1',
    'official_v3_guard_private.owner_operations_v1','official_v3_guard_private.retired_attempts_v1','official_v3_guard_private.status_baseline_v1'
  ] LOOP
    EXECUTE format('SELECT count(*),encode(sha256(convert_to(COALESCE(string_agg(encode(sha256(convert_to(to_jsonb(r)::text,''UTF8'')),''hex''),'''' ORDER BY to_jsonb(r)::text COLLATE "C"),''''),''UTF8'')),''hex'') FROM %s r',table_name::regclass)
      INTO row_count,row_digest;
    INSERT INTO pg_temp.bg1_recovery_before VALUES('table:'||table_name,jsonb_build_object('count',row_count,'digest',row_digest));
  END LOOP;
END $recovery_predecessor$;

-- PO-authorized, transaction-local elevation of two EXISTING owners. These
-- separate postgres-grantor edges did not exist at preflight. Original grantor
-- rows, their OIDs/options and the Intake owner remain completely untouched.
GRANT ot_v3_jobs_owner TO postgres WITH ADMIN FALSE, INHERIT FALSE, SET TRUE GRANTED BY postgres;
GRANT ot_v3_result_owner TO postgres WITH ADMIN FALSE, INHERIT FALSE, SET TRUE GRANTED BY postgres;
GRANT CREATE ON SCHEMA official_v3_guard_private TO ot_v3_jobs_owner,ot_v3_result_owner;

CREATE TABLE official_v3_guard_private.retired_later_attempts_v1 (
  attempt_key text PRIMARY KEY CHECK (attempt_key ~ '^execution-attempt:v3:[a-f0-9]{64}$'),
  job_key text NOT NULL,
  attempt_number integer NOT NULL CHECK (attempt_number BETWEEN 2 AND 4),
  claim_operation_id text NOT NULL UNIQUE,
  intake_operation_id text NOT NULL UNIQUE,
  owner_operation_id text NOT NULL UNIQUE REFERENCES official_v3_guard_private.owner_operations_v1(operation_id),
  before_state jsonb NOT NULL CHECK (octet_length(before_state::text)<=131072),
  retired_at timestamptz NOT NULL CHECK (isfinite(retired_at)),
  UNIQUE(job_key,attempt_number)
);
CREATE TABLE official_v3_guard_private.recovery_baseline_v1 (
  singleton boolean PRIMARY KEY DEFAULT true CHECK (singleton),
  bg1_provider_digest text NOT NULL CHECK (bg1_provider_digest='a3a0be9c4eb1e2c61be428d0b825ee8a3b6780f3f8d154c0ccc2b1317181f950'),
  status_provider_digest text NOT NULL CHECK (status_provider_digest='71e2f9f080b8af0b7100d49b70520f8c34dffdc1bc84f3912b20aff413adf97c'),
  predecessor_catalog_digest text NOT NULL CHECK (predecessor_catalog_digest ~ '^[a-f0-9]{64}$'),
  predecessor_baselines_digest text NOT NULL CHECK (predecessor_baselines_digest ~ '^[a-f0-9]{64}$'),
  predecessor_status_digest text NOT NULL CHECK (predecessor_status_digest ~ '^[a-f0-9]{64}$'),
  required_generation bigint NOT NULL CHECK (required_generation>0),
  proof_not_before timestamptz NOT NULL CHECK (isfinite(proof_not_before)),
  catalog jsonb NOT NULL
);
DO $recovery_tables$
DECLARE table_name text;
BEGIN
  FOREACH table_name IN ARRAY ARRAY['retired_later_attempts_v1','recovery_baseline_v1'] LOOP
    EXECUTE format('ALTER TABLE official_v3_guard_private.%I ENABLE ROW LEVEL SECURITY',table_name);
    EXECUTE format('ALTER TABLE official_v3_guard_private.%I FORCE ROW LEVEL SECURITY',table_name);
    EXECUTE format('CREATE POLICY owner_only ON official_v3_guard_private.%I TO postgres USING (true) WITH CHECK (true)',table_name);
    EXECUTE format('CREATE TRIGGER immutable_v1 BEFORE UPDATE OR DELETE ON official_v3_guard_private.%I FOR EACH ROW EXECUTE FUNCTION official_v3_guard_private.immutable_v1()',table_name);
    EXECUTE format('CREATE TRIGGER immutable_truncate_v1 BEFORE TRUNCATE ON official_v3_guard_private.%I FOR EACH STATEMENT EXECUTE FUNCTION official_v3_guard_private.immutable_v1()',table_name);
    EXECUTE format('REVOKE ALL ON TABLE official_v3_guard_private.%I FROM PUBLIC,anon,authenticated,service_role,supabase_read_only_user,ot_v3_jobs_owner,ot_v3_result_owner,ot_v3_intake_owner',table_name);
  END LOOP;
END $recovery_tables$;

-- Pure canonical data calculation, bound to the installed HRS algorithm. It
-- reads no table and grants no authority or EXECUTE to another role.
CREATE FUNCTION official_v3_guard_private.recovery_canonical_v1(v jsonb,d integer) RETURNS text
LANGUAGE plpgsql IMMUTABLE SECURITY INVOKER SET search_path=pg_catalog AS $canonical$

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
  -- Bounded general-container serialization; the complete fallback below is
  -- still authoritative whenever any node is outside this fast path's domain.
  IF jsonb_typeof(v) IN ('object','array') THEN
    fast_text:=v::text;
    IF octet_length(fast_text)<=262144 THEN
      WITH RECURSIVE walk_nodes(node,member_key,node_path,node_depth,node_type,member_position,flat_text) AS (
        SELECT v,NULL::text,''::bytea,d,jsonb_typeof(v),0::bigint,NULL::text
        UNION ALL
        SELECT j.node,j.member_key,w.node_path||pg_catalog.int8send(j.member_position),w.node_depth+1,
          jsonb_typeof(j.node),j.member_position,
          CASE WHEN jsonb_typeof(j.node) IN ('object','array') AND w.node_depth+1<32 THEN (
            SELECT CASE WHEN bool_and(
              (f.member_key IS NULL OR f.member_key !~ '[^ -~]') AND
              CASE jsonb_typeof(f.node)
                WHEN 'string' THEN true
                WHEN 'number' THEN f.node::numeric=trunc(f.node::numeric)
                  AND f.node::numeric BETWEEN -9007199254740991 AND 9007199254740991
                WHEN 'boolean' THEN true
                WHEN 'null' THEN true
                ELSE false
              END) IS TRUE THEN
              (CASE WHEN jsonb_typeof(j.node)='object' THEN '{' ELSE '[' END)||
              string_agg(
                (CASE WHEN f.member_key IS NULL THEN '' ELSE to_jsonb(f.member_key)::text||':' END)||
                CASE jsonb_typeof(f.node)
                  WHEN 'number' THEN trunc(f.node::numeric)::text
                  WHEN 'string' THEN f.node::text
                  WHEN 'boolean' THEN f.node::text
                  WHEN 'null' THEN 'null'
                  ELSE NULL
                END,',' ORDER BY f.member_key COLLATE "C",f.member_position)||
              (CASE WHEN jsonb_typeof(j.node)='object' THEN '}' ELSE ']' END)
            END
            FROM (
              SELECT q.key AS member_key,q.value AS node,0::bigint AS member_position
                FROM jsonb_each(CASE WHEN jsonb_typeof(j.node)='object' THEN j.node ELSE '{}'::jsonb END) q
              UNION ALL
              SELECT NULL::text,q.value,q.ordinality
                FROM jsonb_array_elements(CASE WHEN jsonb_typeof(j.node)='array' THEN j.node ELSE '[]'::jsonb END)
                  WITH ORDINALITY q(value,ordinality)
            ) f
          ) END
          FROM walk_nodes w CROSS JOIN LATERAL (
            SELECT q.value AS node,q.key AS member_key,
              row_number() OVER (ORDER BY q.key COLLATE "C") AS member_position
              FROM jsonb_each(CASE WHEN w.node_type='object' AND w.node_depth<32
                THEN w.node ELSE '{}'::jsonb END) q
            UNION ALL
            SELECT q.value,NULL::text,q.ordinality
              FROM jsonb_array_elements(CASE WHEN w.node_type='array' AND w.node_depth<32
                THEN w.node ELSE '[]'::jsonb END) WITH ORDINALITY q(value,ordinality)
          ) j WHERE w.node_type IN ('object','array') AND w.node_depth<32 AND w.flat_text IS NULL
      ), token_rows AS (
        SELECT w.node_path AS token_path,
          (w.member_key IS NULL OR w.member_key !~ '[^ -~]') AND w.node_depth<=32 AND
          CASE w.node_type
            WHEN 'object' THEN w.node_depth<32 OR w.node='{}'::jsonb
            WHEN 'array' THEN w.node_depth<32 OR w.node='[]'::jsonb
            WHEN 'string' THEN true
            WHEN 'number' THEN w.node::numeric=trunc(w.node::numeric)
              AND w.node::numeric BETWEEN -9007199254740991 AND 9007199254740991
            WHEN 'boolean' THEN true
            WHEN 'null' THEN true
            ELSE false
          END AS is_valid,
          (CASE WHEN w.member_position>1 THEN ',' ELSE '' END)||
          (CASE WHEN w.member_key IS NULL THEN '' ELSE to_jsonb(w.member_key)::text||':' END)||
          COALESCE(w.flat_text,CASE w.node_type
            WHEN 'object' THEN '{'
            WHEN 'array' THEN '['
            WHEN 'number' THEN trunc(w.node::numeric)::text
            ELSE w.node::text
          END) AS piece
          FROM walk_nodes w
        UNION ALL
        SELECT w.node_path||pg_catalog.decode('ff','hex'),true,
          CASE WHEN w.node_type='object' THEN '}' ELSE ']' END
          FROM walk_nodes w WHERE w.node_type IN ('object','array') AND w.flat_text IS NULL
      )
      SELECT CASE WHEN bool_and(t.is_valid) IS TRUE THEN string_agg(t.piece,'' ORDER BY t.token_path) END
        INTO fast_text FROM token_rows t;
      IF fast_text IS NOT NULL THEN RETURN fast_text; END IF;
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
          WHEN 'string' THEN j.value::text
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
                  WHEN 'string' THEN j.value::text
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
        WHEN 'array' THEN child_text:=official_v3_guard_private.recovery_canonical_v1(e,current_depth+1);
        WHEN 'string' THEN
          s:=e#>>'{}';
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
      WHEN 'object' THEN child_text:=official_v3_guard_private.recovery_canonical_v1(e,d+1);
      WHEN 'array' THEN child_text:=official_v3_guard_private.recovery_canonical_v1(e,d+1);
      WHEN 'string' THEN
        s:=e#>>'{}';
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
    s:=v#>>'{}';
    RETURN v::text;
  WHEN 'number' THEN
    number_value:=v::text::numeric; IF number_value<>trunc(number_value) OR number_value NOT BETWEEN -9007199254740991 AND 9007199254740991 THEN
      RAISE EXCEPTION 'm04 invalid metadata' USING ERRCODE='P7601'; END IF; RETURN trunc(number_value)::text;
  WHEN 'boolean' THEN RETURN v::text;
  WHEN 'null' THEN RETURN 'null';
  ELSE RAISE EXCEPTION 'm04 invalid metadata' USING ERRCODE='P7601';
  END CASE;
END 
$canonical$;
REVOKE ALL ON FUNCTION official_v3_guard_private.recovery_canonical_v1(jsonb,integer) FROM PUBLIC,anon,authenticated,service_role,supabase_read_only_user;

SET LOCAL ROLE ot_v3_jobs_owner;
CREATE OR REPLACE FUNCTION official_v3_guard_private.recovery_jobs_v1() RETURNS jsonb
LANGUAGE plpgsql VOLATILE SECURITY DEFINER SET search_path=pg_catalog AS $$
DECLARE s official_v3_jobs_private.subjects_v1%ROWTYPE; t official_v3_jobs_private.execution_starts_v1%ROWTYPE;
  c official_v3_jobs_private.queue_operations_v1%ROWTYPE; prior record; held jsonb; preceding jsonb:='[]';
  n integer; expected integer:=1; fence jsonb; seed text; input_revision text;
BEGIN
  SELECT * INTO STRICT s FROM official_v3_jobs_private.subjects_v1
    WHERE kind='rule_research' AND current_job->>'contextKey'='official-truth-context:v3:bfce3bc64dbd7c670441e05033c31f339e03a2c488ab54937320508333c252c2' FOR UPDATE;
  IF s.current_job->'attempt'='1'::jsonb THEN
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
END;
  END IF;
  PERFORM official_v3_jobs_private.assert_history_v1(s.job_key);
  SELECT * INTO STRICT t FROM official_v3_jobs_private.execution_starts_v1 WHERE attempt_key=s.open_attempt FOR SHARE;
  SELECT * INTO STRICT c FROM official_v3_jobs_private.queue_operations_v1 WHERE operation_id=t.claim_operation_id FOR SHARE;
  n:=(s.current_job->>'attempt')::integer;
  IF (n BETWEEN 2 AND 4) IS NOT TRUE OR s.start_count<>n OR s.current_job IS DISTINCT FROM t.leased_job
    OR s.current_job->>'state'<>'leased' OR s.current_job->'attemptLimit'<>'4'::jsonb
    OR s.current_job#>>'{research,factKind}' IS DISTINCT FROM 'requirement_effect'
    OR s.current_job#>'{research,researchReason}' IS DISTINCT FROM '{"status":"missing"}'::jsonb
    OR s.job_key IS DISTINCT FROM (official_v3_jobs_private.subject_v1('rule_research',jsonb_build_object(
      'context',s.current_job->'context','method',s.current_job->'method','factKind','requirement_effect','researchReason',jsonb_build_object('status','missing')))->>'jobKey')
    OR s.terminal_credit_claim IS DISTINCT FROM t.claim_operation_id
    OR s.method_binding IS DISTINCT FROM jsonb_build_object('methodId','jetnity-destination-primary-ch-de-visa','revision',1,
      'methodDigest','44ce02752da05796bef98c55b5099b81f915fe6b0975472e163721a06793bdb3','packageDigest','0beb25db2e1f6e4c2c96d61ded30b59a8e06a32ed94498903fbeecc3b6f267e9')
    OR t.authority IS DISTINCT FROM s.method_binding||jsonb_build_object('epoch',1)
    OR c.action<>'claim' OR c.envelope_text::jsonb->'next' IS DISTINCT FROM t.leased_job
    OR EXISTS(SELECT 1 FROM official_v3_jobs_private.execution_results_v1 WHERE attempt_key=t.attempt_key)
    OR EXISTS(SELECT 1 FROM official_v3_jobs_private.execution_dispositions_v1 WHERE attempt_key=t.attempt_key)
    OR clock_timestamp()<=(t.leased_job#>>'{lease,expiresAt}')::timestamptz THEN
    RAISE EXCEPTION 'bg1 exact expired later attempt required' USING ERRCODE='P7906'; END IF;
  FOR prior IN SELECT * FROM official_v3_jobs_private.execution_starts_v1 WHERE job_key=s.job_key AND attempt_key<>t.attempt_key
    ORDER BY (leased_job->>'attempt')::integer LOOP
    held:=official_v3_guard_private.retired_state_v1(prior.attempt_key);
    IF held IS NULL OR (prior.leased_job->>'attempt')::integer<>expected OR expected>=n
      OR held->>'kind' IS DISTINCT FROM (CASE WHEN expected=1 THEN 'ch_de_first_unknown' ELSE 'ch_de_later_unknown' END)
      OR held#>'{job,leasedJob}' IS DISTINCT FROM prior.leased_job OR held#>>'{job,jobKey}' IS DISTINCT FROM s.job_key
      OR prior.leased_job->'jobId' IS DISTINCT FROM t.leased_job->'jobId'
      OR prior.authority IS DISTINCT FROM t.authority
      OR EXISTS(SELECT 1 FROM official_v3_jobs_private.execution_results_v1 WHERE attempt_key=prior.attempt_key)
      OR EXISTS(SELECT 1 FROM official_v3_jobs_private.execution_dispositions_v1 WHERE attempt_key=prior.attempt_key) THEN
      RAISE EXCEPTION 'bg1 genuine preceding retirement required' USING ERRCODE='P7906'; END IF;
    preceding:=preceding||jsonb_build_array(jsonb_build_object('attemptKey',prior.attempt_key,'attempt',expected,
      'snapshotDigest',encode(sha256(convert_to(held::text,'UTF8')),'hex'),
      'intakeOperationId',held#>'{job,intakeOperationId}','proposalDigest',held#>'{intake,proposal_digest}'));
    expected:=expected+1;
  END LOOP;
  IF expected<>n THEN RAISE EXCEPTION 'bg1 complete preceding retirement chain required' USING ERRCODE='P7906'; END IF;
  fence:=jsonb_build_object('jobId',t.leased_job->'jobId','revision',t.leased_job->'revision',
    'leaseId',t.leased_job#>'{lease,leaseId}','generation',t.leased_job#>'{lease,generation}');
  input_revision:='snapshot:0beb25db2e1f6e4c2c96d61ded30b59a8e06a32ed94498903fbeecc3b6f267e9';
  seed:=official_v3_jobs_private.canonical_v1(jsonb_build_object('producerRevision',1,'inputRevision',input_revision,'job',t.leased_job,'fence',fence),0);
  RETURN jsonb_build_object('attemptKey',t.attempt_key,'jobKey',t.job_key,'claimOperationId',t.claim_operation_id,
    'claim',t.claim_text::jsonb,'leasedJob',t.leased_job,'authority',t.authority,'fence',fence,
    'intakeOperationId','op3_'||substr(encode(sha256(convert_to('operation:'||seed,'UTF8')),'hex'),1,32),
    'deliveryId','delivery3_'||substr(encode(sha256(convert_to('delivery:'||seed,'UTF8')),'hex'),1,32),
    'runnerId','runner3_'||substr(encode(sha256(convert_to(official_v3_jobs_private.canonical_v1(jsonb_build_object(
      'kind','aa_bern_ch_de_untrusted_delivery','producerRevision',1,'inputRevision',input_revision),0),'UTF8')),'hex'),1,32),
    'inputRevision',input_revision,'startCount',s.start_count,'operationCount',s.operation_count,'preceding',preceding);
END $$;

CREATE OR REPLACE FUNCTION official_v3_guard_private.close_jobs_v1(attempt_value text) RETURNS void
LANGUAGE plpgsql VOLATILE SECURITY DEFINER SET search_path=pg_catalog AS $$
DECLARE evidence jsonb; count_value bigint;
BEGIN
  PERFORM official_v3_guard_private.owner_session_v1();
  evidence:=official_v3_guard_private.retired_state_v1(attempt_value);
  IF evidence IS NULL OR evidence#>>'{job,attemptKey}' IS DISTINCT FROM attempt_value THEN
    RAISE EXCEPTION 'bg1 immutable retirement required' USING ERRCODE='P7906'; END IF;
  IF evidence->>'kind'='ch_de_first_unknown' THEN
    UPDATE official_v3_jobs_private.subjects_v1 SET open_attempt=NULL
      WHERE job_key=evidence#>>'{job,jobKey}' AND open_attempt=attempt_value
        AND current_job=evidence#>'{job,leasedJob}' AND start_count=1 AND operation_count=2;
  ELSIF evidence->>'kind'='ch_de_later_unknown' THEN
    PERFORM official_v3_guard_private.begin_jobs_v1();
    UPDATE official_v3_jobs_private.subjects_v1 SET open_attempt=NULL
      WHERE job_key=evidence#>>'{job,jobKey}' AND open_attempt=attempt_value
        AND current_job=evidence#>'{job,leasedJob}' AND terminal_credit_claim=evidence#>>'{job,claimOperationId}'
        AND start_count=(evidence#>>'{job,startCount}')::integer AND operation_count=(evidence#>>'{job,operationCount}')::integer
        AND start_count BETWEEN 2 AND 4 AND current_job->'attemptLimit'='4'::jsonb;
  ELSE RAISE EXCEPTION 'bg1 fixed retirement kind required' USING ERRCODE='P7906'; END IF;
  GET DIAGNOSTICS count_value=ROW_COUNT;
  IF count_value<>1 THEN RAISE EXCEPTION 'bg1 retirement compare failed' USING ERRCODE='P7906'; END IF;
  PERFORM official_v3_guard_private.seal_jobs_v1();
  IF evidence->>'kind'='ch_de_later_unknown' THEN PERFORM official_v3_guard_private.begin_jobs_v1(); END IF;
  PERFORM official_v3_guard_private.owner_session_v1();
END $$;
RESET ROLE;

SET LOCAL ROLE ot_v3_result_owner;
CREATE OR REPLACE FUNCTION official_v3_guard_private.recovery_hrs_v1() RETURNS jsonb
LANGUAGE plpgsql VOLATILE SECURITY DEFINER SET search_path=pg_catalog AS $$
DECLARE h official_v3_result_private.heads_v1%ROWTYPE; certificate text; q record; inventory jsonb;
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
    OR EXISTS(SELECT 1 FROM official_v3_result_private.operations_v1 WHERE operation_kind IN ('version','publication','escalation')) THEN
    RAISE EXCEPTION 'bg1 uncommitted initial result required' USING ERRCODE='P7906'; END IF;
  FOR q IN SELECT * FROM official_v3_result_private.qualifications_v1 WHERE kind='verification' LOOP
    PERFORM official_v3_result_private.verification_v1(q.record,official_v3_result_private.selected_binding_v1(),false);
  END LOOP;
  SELECT jsonb_build_object(
    'originals',COALESCE((SELECT jsonb_agg(jsonb_build_object('id',o.version_id,'digest',encode(sha256(convert_to(to_jsonb(o)::text,'UTF8')),'hex')) ORDER BY o.version_id COLLATE "C") FROM official_v3_result_private.originals_v1 o),'[]'::jsonb),
    'extractions',COALESCE((SELECT jsonb_agg(jsonb_build_object('id',e.version_id,'digest',encode(sha256(convert_to(to_jsonb(e)::text,'UTF8')),'hex')) ORDER BY e.version_id COLLATE "C") FROM official_v3_result_private.extractions_v1 e),'[]'::jsonb),
    'qualifications',COALESCE((SELECT jsonb_agg(jsonb_build_object('id',q2.reference,'kind',q2.kind,'decisionRef',q2.decision_ref,'originalIds',q2.original_ids,
      'digest',encode(sha256(convert_to((to_jsonb(q2)||jsonb_build_object('valid_until',extract(epoch FROM q2.valid_until)))::text,'UTF8')),'hex')) ORDER BY q2.reference COLLATE "C") FROM official_v3_result_private.qualifications_v1 q2),'[]'::jsonb)) INTO inventory;
  SELECT state_certificate INTO certificate FROM official_v3_result_private.binding_v1 WHERE singleton;
  RETURN jsonb_build_object('head',to_jsonb(h),'certificate',certificate,
    'originals',jsonb_array_length(inventory->'originals'),'qualifications',jsonb_array_length(inventory->'qualifications'),
    'versions',0,'publications',0,'inventory',inventory);
END $$;

CREATE OR REPLACE FUNCTION official_v3_guard_private.check_retired_hrs_v1(evidence jsonb) RETURNS void
LANGUAGE plpgsql VOLATILE SECURITY DEFINER SET search_path=pg_catalog AS $$
DECLARE entry jsonb; actual text;
BEGIN
  BEGIN
  IF EXISTS(SELECT 1 FROM official_v3_result_private.operations_v1
    WHERE operation_id=evidence#>>'{job,intakeOperationId}' OR command#>>'{intake,binding,operationId}'=evidence#>>'{job,intakeOperationId}')
    OR EXISTS(SELECT 1 FROM official_v3_result_private.versions_v1 WHERE prepared#>>'{transition,operationId}'=evidence#>>'{job,intakeOperationId}') THEN
    RAISE EXCEPTION 'bg1 retired intake publication' USING ERRCODE='P7906';
  END IF;
END;
  IF evidence->>'kind'='ch_de_later_unknown' THEN
    IF jsonb_typeof(evidence#>'{result,inventory}') IS DISTINCT FROM 'object'
      OR jsonb_typeof(evidence#>'{result,inventory,originals}') IS DISTINCT FROM 'array'
      OR jsonb_typeof(evidence#>'{result,inventory,extractions}') IS DISTINCT FROM 'array'
      OR jsonb_typeof(evidence#>'{result,inventory,qualifications}') IS DISTINCT FROM 'array'
      OR evidence#>'{result,originals}' IS DISTINCT FROM to_jsonb(jsonb_array_length(evidence#>'{result,inventory,originals}'))
      OR evidence#>'{result,qualifications}' IS DISTINCT FROM to_jsonb(jsonb_array_length(evidence#>'{result,inventory,qualifications}')) THEN
      RAISE EXCEPTION 'bg1 complete retained source inventory required' USING ERRCODE='P7906'; END IF;
    -- Compare retained entries, not the future whole-store count/fingerprint:
    -- later legitimate originals, qualifications and publications may append.
    FOR entry IN SELECT value FROM jsonb_array_elements(evidence#>'{result,inventory,originals}') LOOP
      SELECT encode(sha256(convert_to(to_jsonb(o)::text,'UTF8')),'hex') INTO actual
        FROM official_v3_result_private.originals_v1 o WHERE o.version_id=entry->>'id';
      IF NOT FOUND OR actual IS DISTINCT FROM entry->>'digest' THEN RAISE EXCEPTION 'bg1 retained original changed' USING ERRCODE='P7906'; END IF;
    END LOOP;
    FOR entry IN SELECT value FROM jsonb_array_elements(evidence#>'{result,inventory,extractions}') LOOP
      SELECT encode(sha256(convert_to(to_jsonb(e)::text,'UTF8')),'hex') INTO actual
        FROM official_v3_result_private.extractions_v1 e WHERE e.version_id=entry->>'id';
      IF NOT FOUND OR actual IS DISTINCT FROM entry->>'digest' THEN RAISE EXCEPTION 'bg1 retained extraction changed' USING ERRCODE='P7906'; END IF;
    END LOOP;
    FOR entry IN SELECT value FROM jsonb_array_elements(evidence#>'{result,inventory,qualifications}') LOOP
      SELECT encode(sha256(convert_to((to_jsonb(q)||jsonb_build_object('valid_until',extract(epoch FROM q.valid_until)))::text,'UTF8')),'hex') INTO actual
        FROM official_v3_result_private.qualifications_v1 q WHERE q.reference=entry->>'id';
      IF NOT FOUND OR actual IS DISTINCT FROM entry->>'digest' THEN RAISE EXCEPTION 'bg1 retained qualification changed' USING ERRCODE='P7906'; END IF;
    END LOOP;
  END IF;
END $$;
RESET ROLE;

CREATE OR REPLACE FUNCTION official_v3_guard_private.recovery_snapshot_v1() RETURNS jsonb
LANGUAGE plpgsql VOLATILE SECURITY DEFINER SET search_path=pg_catalog AS $$
DECLARE j jsonb; s jsonb; h jsonb; result_value jsonb; q jsonb; p jsonb; allowed_decisions jsonb:='[]'; expected_ref text; n integer;
BEGIN
  PERFORM official_v3_guard_private.fixed_method_v1();
  j:=official_v3_guard_private.recovery_jobs_v1();
  n:=(j#>>'{leasedJob,attempt}')::integer;
  IF n>1 THEN PERFORM official_v3_guard_private.require_open_v1(); END IF;
  s:=official_v3_guard_private.recovery_intake_v1(j);
  h:=official_v3_guard_private.recovery_hrs_v1();
  IF clock_timestamp()<=(j#>>'{leasedJob,lease,expiresAt}')::timestamptz OR clock_timestamp()<=(s->>'expires_at')::timestamptz THEN
    RAISE EXCEPTION 'bg1 expired custody required' USING ERRCODE='P7906'; END IF;
  IF n=1 THEN
    IF h->'originals'<>'2'::jsonb OR h->'qualifications'<>'1'::jsonb
      OR h#>>'{inventory,qualifications,0,kind}' IS DISTINCT FROM 'verification'
      OR jsonb_array_length(h#>'{inventory,qualifications,0,originalIds}')<>2
      OR (SELECT count(DISTINCT value) FROM jsonb_array_elements(h#>'{inventory,qualifications,0,originalIds}'))<>2
      OR EXISTS(SELECT 1 FROM jsonb_array_elements(h#>'{inventory,originals}') o
        WHERE NOT ((h#>'{inventory,qualifications,0,originalIds}') ? (o->>'id'))) THEN
      RAISE EXCEPTION 'bg1 exact first source qualification required' USING ERRCODE='P7906'; END IF;
    RETURN jsonb_build_object('schema',1,'kind','ch_de_first_unknown','job',j,'intake',s,'result',h-'inventory');
  END IF;
  FOR p IN SELECT value FROM jsonb_array_elements((j->'preceding')||jsonb_build_array(jsonb_build_object(
    'intakeOperationId',j->'intakeOperationId','proposalDigest',s->'proposal_digest'))) LOOP
    expected_ref:='source-decision:v3:'||encode(sha256(convert_to(official_v3_guard_private.recovery_canonical_v1(jsonb_build_object(
      'operationId',p->'intakeOperationId','proposalDigest',p->'proposalDigest','contextKey',j#>'{leasedJob,contextKey}',
      'method',j#>'{leasedJob,method}','predecessor',NULL),0),'UTF8')),'hex');
    allowed_decisions:=allowed_decisions||jsonb_build_array(expected_ref);
  END LOOP;
  FOR q IN SELECT value FROM jsonb_array_elements(h#>'{inventory,qualifications}') LOOP
    IF q->>'kind'='verification' AND NOT (allowed_decisions ? (q->>'decisionRef')) THEN
      RAISE EXCEPTION 'bg1 actual intake source binding required' USING ERRCODE='P7906'; END IF;
  END LOOP;
  result_value:=jsonb_build_object('schema',1,'kind','ch_de_later_unknown','job',j,'intake',s,'result',h);
  IF octet_length(result_value::text)>131072 THEN RAISE EXCEPTION 'bg1 bounded recovery snapshot required' USING ERRCODE='P7906'; END IF;
  PERFORM official_v3_guard_private.require_open_v1();
  RETURN result_value;
END $$;

CREATE OR REPLACE FUNCTION official_v3_guard_private.intake_retired_v1(operation_value text) RETURNS boolean
LANGUAGE sql STABLE SECURITY DEFINER SET search_path=pg_catalog AS $$
SELECT EXISTS(SELECT 1 FROM official_v3_guard_private.retired_attempts_v1 WHERE intake_operation_id=operation_value)
  OR EXISTS(SELECT 1 FROM official_v3_guard_private.retired_later_attempts_v1 WHERE intake_operation_id=operation_value)
$$;
CREATE OR REPLACE FUNCTION official_v3_guard_private.attempt_retired_v1(attempt_value text) RETURNS boolean
LANGUAGE sql STABLE SECURITY DEFINER SET search_path=pg_catalog AS $$
SELECT EXISTS(SELECT 1 FROM official_v3_guard_private.retired_attempts_v1 WHERE attempt_key=attempt_value)
  OR EXISTS(SELECT 1 FROM official_v3_guard_private.retired_later_attempts_v1 WHERE attempt_key=attempt_value)
$$;
CREATE OR REPLACE FUNCTION official_v3_guard_private.retired_state_v1(attempt_value text) RETURNS jsonb
LANGUAGE sql STABLE SECURITY DEFINER SET search_path=pg_catalog AS $$
SELECT before_state FROM official_v3_guard_private.retired_attempts_v1 WHERE attempt_key=attempt_value
UNION ALL SELECT before_state FROM official_v3_guard_private.retired_later_attempts_v1 WHERE attempt_key=attempt_value
$$;

CREATE OR REPLACE FUNCTION official_v3_guard_private.check_retirements_v1() RETURNS void
LANGUAGE plpgsql VOLATILE SECURITY DEFINER SET search_path=pg_catalog AS $$
DECLARE retired record; original official_v3_guard_private.retired_attempts_v1%ROWTYPE;
  op official_v3_guard_private.owner_operations_v1%ROWTYPE; j jsonb; p jsonb; held jsonb; expected integer; current_number integer:=2;
BEGIN
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
END;
  IF (SELECT count(*) FROM official_v3_guard_private.retired_later_attempts_v1)>3 THEN
    RAISE EXCEPTION 'bg1 bounded later recovery scope' USING ERRCODE='P7906'; END IF;
  FOR retired IN SELECT * FROM official_v3_guard_private.retired_later_attempts_v1 ORDER BY attempt_number LOOP
    SELECT * INTO STRICT original FROM official_v3_guard_private.retired_attempts_v1;
    SELECT * INTO STRICT op FROM official_v3_guard_private.owner_operations_v1 WHERE operation_id=retired.owner_operation_id;
    j:=retired.before_state->'job';
    IF retired.attempt_number<>current_number OR retired.attempt_number NOT BETWEEN 2 AND 4
      OR retired.before_state->'schema' IS DISTINCT FROM '1'::jsonb
      OR retired.before_state->>'kind' IS DISTINCT FROM 'ch_de_later_unknown'
      OR op.action<>'retire_unknown' OR op.receipt->>'result' IS DISTINCT FROM 'unknown_retired'
      OR op.expected_digest IS DISTINCT FROM encode(sha256(convert_to(retired.before_state::text,'UTF8')),'hex')
      OR op.receipt->>'operationId' IS DISTINCT FROM op.operation_id OR op.receipt->>'selection' IS DISTINCT FROM op.expected_digest
      OR op.receipt IS DISTINCT FROM jsonb_build_object('schema',1,'status','recorded','action','retire_unknown',
        'operationId',op.operation_id,'selection',op.expected_digest,'result','unknown_retired',
        'recordedAt',to_char(op.recorded_at AT TIME ZONE 'UTC','YYYY-MM-DD"T"HH24:MI:SS.MS"Z"'))
      OR retired.attempt_key IS DISTINCT FROM j->>'attemptKey' OR retired.intake_operation_id IS DISTINCT FROM j->>'intakeOperationId'
      OR retired.claim_operation_id IS DISTINCT FROM j->>'claimOperationId' OR retired.job_key IS DISTINCT FROM j->>'jobKey'
      OR retired.job_key IS DISTINCT FROM original.job_key OR retired.retired_at IS DISTINCT FROM op.recorded_at
      OR j#>'{leasedJob,jobId}' IS DISTINCT FROM original.before_state#>'{job,leasedJob,jobId}'
      OR j#>>'{leasedJob,attempt}' IS DISTINCT FROM retired.attempt_number::text
      OR j->>'startCount' IS DISTINCT FROM retired.attempt_number::text OR j#>'{leasedJob,attemptLimit}' IS DISTINCT FROM '4'::jsonb
      OR jsonb_typeof(j->'preceding') IS DISTINCT FROM 'array'
      OR jsonb_array_length(j->'preceding') IS DISTINCT FROM retired.attempt_number-1
      OR (j#>>'{leasedJob,lease,expiresAt}')::timestamptz>=retired.retired_at
      OR (retired.before_state#>>'{intake,expires_at}')::timestamptz>=retired.retired_at THEN
      RAISE EXCEPTION 'bg1 later retirement receipt binding' USING ERRCODE='P7906'; END IF;
    expected:=1;
    FOR p IN SELECT value FROM jsonb_array_elements(j->'preceding') LOOP
      held:=official_v3_guard_private.retired_state_v1(p->>'attemptKey');
      IF held IS NULL OR p->>'attempt' IS DISTINCT FROM expected::text
        OR held#>>'{job,leasedJob,attempt}' IS DISTINCT FROM expected::text
        OR held#>>'{job,jobKey}' IS DISTINCT FROM retired.job_key
        OR p->>'snapshotDigest' IS DISTINCT FROM encode(sha256(convert_to(held::text,'UTF8')),'hex')
        OR p->'intakeOperationId' IS DISTINCT FROM held#>'{job,intakeOperationId}'
        OR p->'proposalDigest' IS DISTINCT FROM held#>'{intake,proposal_digest}'
        OR expected=1 AND p->>'attemptKey' IS DISTINCT FROM original.attempt_key THEN
        RAISE EXCEPTION 'bg1 later retirement predecessor changed' USING ERRCODE='P7906'; END IF;
      expected:=expected+1;
    END LOOP;
    PERFORM official_v3_guard_private.check_retired_jobs_v1(retired.before_state);
    PERFORM official_v3_guard_private.check_retired_s1_v1(retired.before_state);
    PERFORM official_v3_guard_private.check_retired_hrs_v1(retired.before_state);
    current_number:=current_number+1;
  END LOOP;
END $$;

CREATE OR REPLACE FUNCTION public.official_v3_guard_review_v1() RETURNS jsonb
LANGUAGE plpgsql VOLATILE SECURITY DEFINER SET search_path=pg_catalog SET statement_timeout='5s' SET lock_timeout='2s' AS $$
DECLARE retirement jsonb; incident jsonb; snapshot jsonb;
BEGIN
  PERFORM official_v3_guard_private.owner_session_v1();
  PERFORM pg_advisory_xact_lock(771106,1);
  PERFORM official_v3_guard_private.assert_catalog_v1();
  PERFORM official_v3_guard_private.check_certificates_v1();
  PERFORM official_v3_guard_private.check_retirements_v1();
  IF EXISTS(SELECT 1 FROM official_v3_guard_private.retired_attempts_v1)
    AND NOT EXISTS(SELECT 1 FROM official_v3_jobs_private.subjects_v1 WHERE kind='rule_research'
      AND current_job->>'contextKey'='official-truth-context:v3:bfce3bc64dbd7c670441e05033c31f339e03a2c488ab54937320508333c252c2' AND open_attempt IS NOT NULL) THEN
    retirement:=jsonb_build_object('status','closed');
  ELSE
    BEGIN
      snapshot:=official_v3_guard_private.recovery_snapshot_v1();
      retirement:=jsonb_build_object('status','reviewable','selection',encode(sha256(convert_to(snapshot::text,'UTF8')),'hex'),
        'attempt',snapshot#>'{job,leasedJob,attempt}','originals',snapshot#>'{result,originals}',
        'qualifications',snapshot#>'{result,qualifications}','acceptedVersions',0,'leaseEndedAt',snapshot#>'{job,leasedJob,lease,expiresAt}');
    EXCEPTION WHEN SQLSTATE 'P7906' OR SQLSTATE 'P7902' OR SQLSTATE 'P7504' OR no_data_found OR too_many_rows THEN
      retirement:=jsonb_build_object('status','unavailable'); END;
  END IF;
  incident:=official_v3_guard_private.incident_snapshot_v1();
  PERFORM official_v3_guard_private.owner_session_v1();
  RETURN jsonb_build_object('schema',1,'status','reviewed','retirement',retirement,
    'incident',jsonb_build_object('status',CASE WHEN incident->'generation'=incident->'resumedGeneration' THEN 'clear' ELSE 'blocked' END,
      'selection',encode(sha256(convert_to(incident::text,'UTF8')),'hex'),'generation',incident->'generation',
      'methodEpoch',incident#>'{method,epoch}','proofFinished',incident->'proofFinished','validUntil',incident->'validUntil',
      'canResume',COALESCE((incident->>'generation')::bigint>(incident->>'resumedGeneration')::bigint
        AND incident#>>'{method,status}'='approved' AND (incident->>'proofStarted')::timestamptz>(incident->>'incidentAt')::timestamptz
        AND clock_timestamp()<(incident->>'validUntil')::timestamptz,false)));
END $$;

CREATE OR REPLACE FUNCTION public.official_v3_guard_retire_v1(p_operation_id text,p_selection text) RETURNS jsonb
LANGUAGE plpgsql VOLATILE SECURITY DEFINER SET search_path=pg_catalog SET statement_timeout='5s' SET lock_timeout='2s' AS $$
DECLARE snapshot jsonb; prior official_v3_guard_private.owner_operations_v1%ROWTYPE; instant timestamptz; receipt_value jsonb; n integer;
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
  PERFORM official_v3_guard_private.check_retirements_v1();
  snapshot:=official_v3_guard_private.recovery_snapshot_v1();
  IF encode(sha256(convert_to(snapshot::text,'UTF8')),'hex') IS DISTINCT FROM p_selection THEN
    RAISE EXCEPTION 'bg1 reviewed state changed' USING ERRCODE='P7906'; END IF;
  n:=(snapshot#>>'{job,leasedJob,attempt}')::integer;
  IF n=1 AND EXISTS(SELECT 1 FROM official_v3_guard_private.retired_attempts_v1) THEN
    RAISE EXCEPTION 'bg1 first attempt already closed' USING ERRCODE='P7906'; END IF;
  instant:=clock_timestamp();
  receipt_value:=jsonb_build_object('schema',1,'status','recorded','action','retire_unknown','operationId',p_operation_id,'selection',p_selection,
    'result','unknown_retired','recordedAt',to_char(instant AT TIME ZONE 'UTC','YYYY-MM-DD"T"HH24:MI:SS.MS"Z"'));
  INSERT INTO official_v3_guard_private.owner_operations_v1 VALUES(p_operation_id,'retire_unknown',p_selection,auth.uid(),instant,receipt_value);
  IF n=1 THEN
    INSERT INTO official_v3_guard_private.retired_attempts_v1 VALUES(snapshot#>>'{job,attemptKey}',snapshot#>>'{job,jobKey}',snapshot#>>'{job,claimOperationId}',
      snapshot#>>'{job,intakeOperationId}',p_operation_id,snapshot,instant);
  ELSE
    INSERT INTO official_v3_guard_private.retired_later_attempts_v1 VALUES(snapshot#>>'{job,attemptKey}',snapshot#>>'{job,jobKey}',n,snapshot#>>'{job,claimOperationId}',
      snapshot#>>'{job,intakeOperationId}',p_operation_id,snapshot,instant);
  END IF;
  PERFORM official_v3_guard_private.close_jobs_v1(snapshot#>>'{job,attemptKey}');
  PERFORM official_v3_guard_private.check_retirements_v1();
  PERFORM official_v3_guard_private.fixed_method_v1();
  IF n>1 THEN PERFORM official_v3_guard_private.require_open_v1(); END IF;
  PERFORM official_v3_guard_private.owner_session_v1();
  RETURN receipt_value;
END $$;

CREATE OR REPLACE FUNCTION official_v3_guard_private.assert_catalog_v1() RETURNS void
LANGUAGE plpgsql VOLATILE SECURITY DEFINER SET search_path=pg_catalog AS $$
DECLARE successor official_v3_guard_private.recovery_baseline_v1%ROWTYPE;
  predecessor official_v3_guard_private.status_baseline_v1%ROWTYPE; old_baselines jsonb;
BEGIN
  SELECT * INTO STRICT successor FROM official_v3_guard_private.recovery_baseline_v1 WHERE singleton;
  SELECT * INTO STRICT predecessor FROM official_v3_guard_private.status_baseline_v1 WHERE singleton;
  SELECT jsonb_agg(to_jsonb(b)||jsonb_build_object('installed_at',extract(epoch FROM b.installed_at)) ORDER BY b.component COLLATE "C")
    INTO old_baselines FROM official_v3_guard_private.baselines_v1 b;
  IF jsonb_array_length(old_baselines) IS DISTINCT FROM 3
    OR predecessor.provider_digest<>'a3a0be9c4eb1e2c61be428d0b825ee8a3b6780f3f8d154c0ccc2b1317181f950'
    OR successor.bg1_provider_digest<>'a3a0be9c4eb1e2c61be428d0b825ee8a3b6780f3f8d154c0ccc2b1317181f950' OR successor.status_provider_digest<>'71e2f9f080b8af0b7100d49b70520f8c34dffdc1bc84f3912b20aff413adf97c'
    OR predecessor.predecessor_catalog_digest IS DISTINCT FROM (SELECT encode(sha256(convert_to(catalog::text,'UTF8')),'hex') FROM official_v3_guard_private.baselines_v1 WHERE component='all')
    OR predecessor.predecessor_baselines_digest IS DISTINCT FROM encode(sha256(convert_to(old_baselines::text,'UTF8')),'hex')
    OR successor.predecessor_baselines_digest IS DISTINCT FROM predecessor.predecessor_baselines_digest
    OR successor.predecessor_catalog_digest IS DISTINCT FROM encode(sha256(convert_to(predecessor.catalog::text,'UTF8')),'hex')
    OR successor.predecessor_status_digest IS DISTINCT FROM encode(sha256(convert_to((to_jsonb(predecessor)||jsonb_build_object('proof_not_before',extract(epoch FROM predecessor.proof_not_before)))::text,'UTF8')),'hex')
    OR successor.catalog IS DISTINCT FROM official_v3_guard_private.catalog_status_v1() THEN
    RAISE EXCEPTION 'bg1 recovery protected catalog changed' USING ERRCODE='P7905'; END IF;
END $$;

CREATE OR REPLACE FUNCTION official_v3_guard_private.require_open_v1() RETURNS bigint
LANGUAGE plpgsql VOLATILE SECURITY DEFINER SET search_path=pg_catalog AS $$
DECLARE s official_v3_guard_private.state_v1%ROWTYPE; instant timestamptz;
  required_proof bigint; earliest_proof timestamptz;
BEGIN
  SELECT * INTO s FROM official_v3_guard_private.state_v1 WHERE singleton FOR SHARE;
  instant:=clock_timestamp();
  IF NOT FOUND OR s.generation=0 OR s.incident_generation<>s.resumed_generation
    OR instant<s.last_observed OR instant<s.last_finished OR instant>=s.valid_until
    OR s.last_finished>s.last_started+interval '30 seconds' OR s.valid_until<>s.last_due+interval '5 minutes 30 seconds' THEN
    RAISE EXCEPTION 'bg1 integrity unavailable' USING ERRCODE='P7902'; END IF;
  SELECT greatest(r.required_generation,b.required_generation),greatest(r.proof_not_before,b.proof_not_before)
    INTO STRICT required_proof,earliest_proof FROM official_v3_guard_private.recovery_baseline_v1 r
      CROSS JOIN official_v3_guard_private.status_baseline_v1 b WHERE r.singleton AND b.singleton;
  IF s.generation<required_proof OR s.last_proof_started<earliest_proof OR instant<earliest_proof
    OR NOT EXISTS(SELECT 1 FROM official_v3_guard_private.runs_v1 run WHERE run.outcome='complete' AND run.generation=s.generation
      AND run.due_at=s.last_due AND run.started_at=s.last_started AND run.proof_started_at=s.last_proof_started AND run.finished_at=s.last_finished) THEN
    RAISE EXCEPTION 'bg1 recovery fresh full proof required' USING ERRCODE='P7902'; END IF;
  RETURN s.incident_generation;
END $$;

CREATE OR REPLACE FUNCTION public.official_v3_guard_alarm_status_v1() RETURNS jsonb
LANGUAGE plpgsql VOLATILE SECURITY DEFINER SET search_path=pg_catalog AS $$
DECLARE required_proof bigint; earliest_proof timestamptz; current_state official_v3_guard_private.state_v1%ROWTYPE;
  unavailable_value jsonb:=jsonb_build_object('schema',1,'status','unavailable');
BEGIN
  IF official_v3_guard_private.alarm_status_v1() IS DISTINCT FROM jsonb_build_object('schema',1,'status','current') THEN RETURN unavailable_value; END IF;
  SELECT greatest(r.required_generation,b.required_generation),greatest(r.proof_not_before,b.proof_not_before)
    INTO STRICT required_proof,earliest_proof FROM official_v3_guard_private.recovery_baseline_v1 r
      CROSS JOIN official_v3_guard_private.status_baseline_v1 b WHERE r.singleton AND b.singleton;
  SELECT * INTO STRICT current_state FROM official_v3_guard_private.state_v1 WHERE singleton;
  IF current_state.generation<required_proof OR current_state.last_proof_started<earliest_proof
    OR current_state.incident_generation<>current_state.resumed_generation
    OR current_state.last_finished>current_state.last_started+interval '30 seconds'
    OR current_state.valid_until<>current_state.last_due+interval '5 minutes 30 seconds'
    OR NOT EXISTS(SELECT 1 FROM official_v3_guard_private.runs_v1 run
      WHERE run.due_at=current_state.last_due AND run.outcome='complete' AND run.generation=current_state.generation
        AND run.started_at=current_state.last_started AND run.proof_started_at=current_state.last_proof_started AND run.finished_at=current_state.last_finished)
    OR clock_timestamp()<greatest(current_state.last_observed,current_state.last_finished,earliest_proof)
    OR clock_timestamp()>=current_state.valid_until THEN RETURN unavailable_value; END IF;
  RETURN jsonb_build_object('schema',1,'status','current');
EXCEPTION WHEN query_canceled OR OTHERS THEN RETURN unavailable_value;
END $$;

-- Remove ONLY edges/privileges proven absent before this transaction. Preserve
-- all original bootstrap-grantor memberships, including their immutable OIDs.
REVOKE CREATE ON SCHEMA official_v3_guard_private FROM ot_v3_jobs_owner,ot_v3_result_owner;
REVOKE ot_v3_jobs_owner FROM postgres GRANTED BY postgres;
REVOKE ot_v3_result_owner FROM postgres GRANTED BY postgres;

CREATE TEMP TABLE bg1_recovery_objects(classid oid,objid oid,PRIMARY KEY(classid,objid)) ON COMMIT DROP;
DO $recovery_delta$
DECLARE approved jsonb:='[{"signature":"official_v3_guard_private.recovery_canonical_v1(jsonb,integer)","name":"official_v3_guard_private.recovery_canonical_v1","owner":"postgres","hash":"9ae0114402a4d9d45514b45508a03b4be6865ef92b13818acd96d244715e355d","language":"plpgsql","definer":false,"volatile":"i","config":["search_path=pg_catalog"]},{"signature":"official_v3_guard_private.recovery_jobs_v1()","name":"official_v3_guard_private.recovery_jobs_v1","owner":"ot_v3_jobs_owner","hash":"8c122e36ee064bcd2b2e764f8c642190f43abe69dd5d9219ae135e016a1433eb","language":"plpgsql","definer":true,"volatile":"v","config":["search_path=pg_catalog"]},{"signature":"official_v3_guard_private.close_jobs_v1(text)","name":"official_v3_guard_private.close_jobs_v1","owner":"ot_v3_jobs_owner","hash":"68c8c79279de8a002dd81f3e07c6b9405567c250ce638a3a492c768eba54fbf2","language":"plpgsql","definer":true,"volatile":"v","config":["search_path=pg_catalog"]},{"signature":"official_v3_guard_private.recovery_hrs_v1()","name":"official_v3_guard_private.recovery_hrs_v1","owner":"ot_v3_result_owner","hash":"f2e2304b42313784e39b6ec032aaa44feaace0402250af4c64e64a11318b9644","language":"plpgsql","definer":true,"volatile":"v","config":["search_path=pg_catalog"]},{"signature":"official_v3_guard_private.check_retired_hrs_v1(jsonb)","name":"official_v3_guard_private.check_retired_hrs_v1","owner":"ot_v3_result_owner","hash":"08eae5f6050a4d31ce32a49568a31df5b70169ac0a60e3b9c06a86508fb47ab7","language":"plpgsql","definer":true,"volatile":"v","config":["search_path=pg_catalog"]},{"signature":"official_v3_guard_private.recovery_snapshot_v1()","name":"official_v3_guard_private.recovery_snapshot_v1","owner":"postgres","hash":"ac8fa99fbb775db57d2bf9386e6754c10583dc819453c9aacf0123e662cd1ea7","language":"plpgsql","definer":true,"volatile":"v","config":["search_path=pg_catalog"]},{"signature":"official_v3_guard_private.intake_retired_v1(text)","name":"official_v3_guard_private.intake_retired_v1","owner":"postgres","hash":"36791e20b7021ae55e507f971b1e89bd9b821afc0bff299dedf9d4d18de74ec1","language":"sql","definer":true,"volatile":"s","config":["search_path=pg_catalog"]},{"signature":"official_v3_guard_private.attempt_retired_v1(text)","name":"official_v3_guard_private.attempt_retired_v1","owner":"postgres","hash":"299ff555963f73247651989e1d9a4bf8bea78ed1f47f5dba1903957c1f0ec31c","language":"sql","definer":true,"volatile":"s","config":["search_path=pg_catalog"]},{"signature":"official_v3_guard_private.retired_state_v1(text)","name":"official_v3_guard_private.retired_state_v1","owner":"postgres","hash":"9e1c2283438d7125d1fe2eca59c13f02ddc1d45474107745c9aacbfb1bf903c7","language":"sql","definer":true,"volatile":"s","config":["search_path=pg_catalog"]},{"signature":"official_v3_guard_private.check_retirements_v1()","name":"official_v3_guard_private.check_retirements_v1","owner":"postgres","hash":"8f99b7248314262dfefbe9519d52e9c14d69a8532d9a04882198cc1e038e74bf","language":"plpgsql","definer":true,"volatile":"v","config":["search_path=pg_catalog"]},{"signature":"public.official_v3_guard_review_v1()","name":"public.official_v3_guard_review_v1","owner":"postgres","hash":"3f5cbf0a53c797a851d72d7d07c1f5deff4267d867c33249eff3b1b82316d359","language":"plpgsql","definer":true,"volatile":"v","config":["search_path=pg_catalog","statement_timeout=5s","lock_timeout=2s"]},{"signature":"public.official_v3_guard_retire_v1(text,text)","name":"public.official_v3_guard_retire_v1","owner":"postgres","hash":"4f0065e2b17aece0a3f43fa4da80f5eb4a295e6e71727593c0eed61312264724","language":"plpgsql","definer":true,"volatile":"v","config":["search_path=pg_catalog","statement_timeout=5s","lock_timeout=2s"]},{"signature":"official_v3_guard_private.assert_catalog_v1()","name":"official_v3_guard_private.assert_catalog_v1","owner":"postgres","hash":"1610defe705908c84a1c0b9f415d88434dd3448c493c8c4bf9304dc6f668d55e","language":"plpgsql","definer":true,"volatile":"v","config":["search_path=pg_catalog"]},{"signature":"official_v3_guard_private.require_open_v1()","name":"official_v3_guard_private.require_open_v1","owner":"postgres","hash":"48f3a96639cae37d4b930a0a46149ad1fcaddc4d8f5afd67985528af6f3bfc39","language":"plpgsql","definer":true,"volatile":"v","config":["search_path=pg_catalog"]},{"signature":"public.official_v3_guard_alarm_status_v1()","name":"public.official_v3_guard_alarm_status_v1","owner":"postgres","hash":"0fd765ca693b28d2e9f00752be34f08fabe9fa3193efc775730c1d14be413d22","language":"plpgsql","definer":true,"volatile":"v","config":["search_path=pg_catalog"]}]'::jsonb; expected record; actual pg_proc%ROWTYPE;
  before_catalog jsonb; after_catalog jsonb; entry record; relation_id oid; table_name text;
  class_value oid; object_value oid; expected_columns jsonb; replacement_ids oid[]:='{}';
BEGIN
  IF COALESCE((SELECT jsonb_agg(to_jsonb(m) ORDER BY m.oid) FROM pg_auth_members m),'[]'::jsonb)
      IS DISTINCT FROM (SELECT value FROM pg_temp.bg1_recovery_before WHERE kind='memberships')
    OR (SELECT jsonb_build_object('owner',nspowner,'acl',nspacl) FROM pg_namespace WHERE nspname='official_v3_guard_private')
      IS DISTINCT FROM (SELECT value FROM pg_temp.bg1_recovery_before WHERE kind='schema_acl') THEN
    RAISE EXCEPTION 'bg1 recovery exact authority restoration required' USING ERRCODE='P7901'; END IF;
  SELECT value INTO STRICT before_catalog FROM pg_temp.bg1_recovery_before WHERE kind='catalog';
  FOR expected IN SELECT * FROM jsonb_to_recordset(approved)
    AS f(signature text,name text,owner text,hash text,language text,definer boolean,volatile text,config jsonb) LOOP
    SELECT * INTO STRICT actual FROM pg_proc WHERE oid=to_regprocedure(expected.signature);
    IF actual.proowner<>to_regrole(expected.owner) OR actual.prokind<>'f' OR actual.proleakproof OR actual.proisstrict OR actual.proretset
      OR actual.pronargdefaults<>0 OR actual.provariadic<>0 OR actual.proparallel<>'u'
      OR actual.prosecdef<>expected.definer OR actual.provolatile::text<>expected.volatile
      OR (SELECT lanname FROM pg_language WHERE oid=actual.prolang)<>expected.language
      OR to_jsonb(actual.proconfig) IS DISTINCT FROM expected.config
      OR encode(sha256(convert_to(actual.prosrc,'UTF8')),'hex') IS DISTINCT FROM expected.hash THEN
      RAISE EXCEPTION 'bg1 recovery exact function contract' USING ERRCODE='P7901'; END IF;
    IF before_catalog ? ('function:'||actual.oid) THEN replacement_ids:=array_append(replacement_ids,actual.oid);
    ELSE
      IF expected.signature<>'official_v3_guard_private.recovery_canonical_v1(jsonb,integer)'
        OR actual.prorettype<>'text'::regtype OR actual.proargnames IS DISTINCT FROM ARRAY['v','d']::text[]
        OR actual.pronargs<>2 OR actual.proargmodes IS NOT NULL OR actual.proallargtypes IS NOT NULL
        OR EXISTS(SELECT 1 FROM aclexplode(COALESCE(actual.proacl,acldefault('f',actual.proowner))) a
          WHERE a.grantee<>'postgres'::regrole OR a.grantor<>'postgres'::regrole OR a.is_grantable OR a.privilege_type<>'EXECUTE') THEN
        RAISE EXCEPTION 'bg1 recovery new helper owner-only contract' USING ERRCODE='P7901'; END IF;
      INSERT INTO pg_temp.bg1_recovery_objects VALUES('pg_proc'::regclass,actual.oid);
    END IF;
  END LOOP;
  IF cardinality(replacement_ids)<>14 THEN RAISE EXCEPTION 'bg1 recovery exact replacement inventory' USING ERRCODE='P7901'; END IF;
  FOREACH table_name IN ARRAY ARRAY['retired_later_attempts_v1','recovery_baseline_v1'] LOOP
    relation_id:=to_regclass('official_v3_guard_private.'||table_name);
    expected_columns:=CASE table_name WHEN 'retired_later_attempts_v1' THEN
      '[["attempt_key","text",true,false],["job_key","text",true,false],["attempt_number","integer",true,false],["claim_operation_id","text",true,false],["intake_operation_id","text",true,false],["owner_operation_id","text",true,false],["before_state","jsonb",true,false],["retired_at","timestamp with time zone",true,false]]'::jsonb
      ELSE '[["singleton","boolean",true,false],["bg1_provider_digest","text",true,false],["status_provider_digest","text",true,false],["predecessor_catalog_digest","text",true,false],["predecessor_baselines_digest","text",true,false],["predecessor_status_digest","text",true,false],["required_generation","bigint",true,false],["proof_not_before","timestamp with time zone",true,false],["catalog","jsonb",true,false]]'::jsonb END;
    IF relation_id IS NULL OR NOT EXISTS(SELECT 1 FROM pg_class c WHERE c.oid=relation_id AND c.relkind='r'
      AND c.relowner='postgres'::regrole AND c.relrowsecurity AND c.relforcerowsecurity)
      OR EXISTS(SELECT 1 FROM pg_class c CROSS JOIN LATERAL aclexplode(COALESCE(c.relacl,acldefault('r',c.relowner))) a
        WHERE c.oid=relation_id AND (a.grantee<>'postgres'::regrole OR a.grantor<>'postgres'::regrole OR a.is_grantable))
      OR (SELECT jsonb_agg(jsonb_build_array(a.attname,a.atttypid::regtype::text,a.attnotnull,a.attisdropped) ORDER BY a.attnum)
        FROM pg_attribute a WHERE a.attrelid=relation_id AND a.attnum>0) IS DISTINCT FROM expected_columns
      OR (SELECT count(*) FROM pg_policy p WHERE p.polrelid=relation_id)<>1
      OR NOT EXISTS(SELECT 1 FROM pg_policy p WHERE p.polrelid=relation_id AND p.polname='owner_only'
        AND p.polroles=ARRAY['postgres'::regrole::oid] AND p.polpermissive AND p.polcmd='*'
        AND pg_get_expr(p.polqual,p.polrelid)='true' AND pg_get_expr(p.polwithcheck,p.polrelid)='true')
      OR (SELECT count(*) FROM pg_trigger t WHERE t.tgrelid=relation_id AND NOT t.tgisinternal)<>2
      OR EXISTS(SELECT 1 FROM pg_trigger t WHERE t.tgrelid=relation_id AND NOT t.tgisinternal
        AND (t.tgfoid<>'official_v3_guard_private.immutable_v1()'::regprocedure OR t.tgenabled<>'O' OR t.tgnargs<>0 OR t.tgqual IS NOT NULL
          OR NOT (t.tgname='immutable_v1' AND t.tgtype=27 OR t.tgname='immutable_truncate_v1' AND t.tgtype=34))) THEN
      RAISE EXCEPTION 'bg1 recovery private table contract' USING ERRCODE='P7901'; END IF;
    INSERT INTO pg_temp.bg1_recovery_objects
      SELECT 'pg_class'::regclass,relation_id
      UNION SELECT 'pg_class'::regclass,c.reltoastrelid FROM pg_class c WHERE c.oid=relation_id AND c.reltoastrelid<>0
      UNION SELECT 'pg_class'::regclass,i.indexrelid FROM pg_index i WHERE i.indrelid=relation_id
        OR i.indrelid=(SELECT reltoastrelid FROM pg_class WHERE oid=relation_id)
      UNION SELECT 'pg_type'::regclass,t.oid FROM pg_type t WHERE t.typrelid=relation_id
        OR t.typelem IN (SELECT oid FROM pg_type WHERE typrelid=relation_id)
      UNION SELECT 'pg_constraint'::regclass,c.oid FROM pg_constraint c WHERE c.conrelid=relation_id
      UNION SELECT 'pg_trigger'::regclass,t.oid FROM pg_trigger t WHERE t.tgrelid=relation_id
        OR t.tgisinternal AND t.tgrelid='official_v3_guard_private.owner_operations_v1'::regclass
          AND t.tgconstrrelid=relation_id AND t.tgconstraint IN (SELECT c.oid FROM pg_constraint c
          WHERE c.conrelid=relation_id AND c.contype='f' AND c.confrelid='official_v3_guard_private.owner_operations_v1'::regclass
            AND c.conkey=ARRAY[6]::smallint[] AND c.confkey=ARRAY[1]::smallint[])
      UNION SELECT 'pg_policy'::regclass,p.oid FROM pg_policy p WHERE p.polrelid=relation_id
      UNION SELECT 'pg_attrdef'::regclass,a.oid FROM pg_attrdef a WHERE a.adrelid=relation_id;
  END LOOP;
  after_catalog:=official_v3_guard_private.catalog_status_v1();
  FOR entry IN SELECT key,value FROM jsonb_each(before_catalog) LOOP
    IF after_catalog->entry.key IS NOT DISTINCT FROM entry.value THEN CONTINUE; END IF;
    IF entry.key LIKE 'function:%' AND split_part(entry.key,':',2)::oid=ANY(replacement_ids)
      AND (after_catalog->entry.key)-'definition' IS NOT DISTINCT FROM entry.value-'definition' THEN CONTINUE; END IF;
    RAISE EXCEPTION 'bg1 recovery predecessor graph changed' USING ERRCODE='P7901';
  END LOOP;
  FOR entry IN SELECT key,value FROM jsonb_each(after_catalog) WHERE NOT before_catalog ? key LOOP
    class_value:=CASE split_part(entry.key,':',1)
      WHEN 'function' THEN 'pg_proc'::regclass WHEN 'relation' THEN 'pg_class'::regclass
      WHEN 'attribute' THEN 'pg_class'::regclass WHEN 'index' THEN 'pg_class'::regclass
      WHEN 'type' THEN 'pg_type'::regclass WHEN 'constraint' THEN 'pg_constraint'::regclass
      WHEN 'trigger' THEN 'pg_trigger'::regclass WHEN 'policy' THEN 'pg_policy'::regclass WHEN 'default' THEN 'pg_attrdef'::regclass
      WHEN 'dependency' THEN (entry.value->>'classid')::oid WHEN 'shared' THEN (entry.value->>'classid')::oid END;
    object_value:=CASE WHEN split_part(entry.key,':',1) IN ('dependency','shared') THEN (entry.value->>'objid')::oid ELSE split_part(entry.key,':',2)::oid END;
    IF class_value IS NULL OR NOT EXISTS(SELECT 1 FROM pg_temp.bg1_recovery_objects o WHERE o.classid=class_value AND o.objid=object_value) THEN
      RAISE EXCEPTION 'bg1 recovery unreviewed additive edge' USING ERRCODE='P7901'; END IF;
  END LOOP;
  INSERT INTO official_v3_guard_private.recovery_baseline_v1
  SELECT true,'a3a0be9c4eb1e2c61be428d0b825ee8a3b6780f3f8d154c0ccc2b1317181f950','71e2f9f080b8af0b7100d49b70520f8c34dffdc1bc84f3912b20aff413adf97c',encode(sha256(convert_to(before_catalog::text,'UTF8')),'hex'),
    encode(sha256(convert_to((SELECT jsonb_agg(to_jsonb(b)||jsonb_build_object('installed_at',extract(epoch FROM b.installed_at)) ORDER BY b.component COLLATE "C") FROM official_v3_guard_private.baselines_v1 b)::text,'UTF8')),'hex'),
    encode(sha256(convert_to((to_jsonb(prior)||jsonb_build_object('proof_not_before',extract(epoch FROM prior.proof_not_before)))::text,'UTF8')),'hex'),
    s.generation+1,clock_timestamp(),after_catalog FROM official_v3_guard_private.state_v1 s
      CROSS JOIN official_v3_guard_private.status_baseline_v1 prior WHERE s.singleton AND prior.singleton;
END $recovery_delta$;

DO $recovery_postcheck$
DECLARE prior record; table_name text; row_count bigint; row_digest text; current_content jsonb;
BEGIN
  PERFORM official_v3_guard_private.assert_catalog_v1();
  PERFORM official_v3_guard_private.check_control_v1();
  PERFORM official_v3_guard_private.check_hma_v1();
  PERFORM official_v3_guard_private.check_s1_v1();
  PERFORM official_v3_guard_private.check_jobs_v1();
  PERFORM official_v3_guard_private.check_hrs_v1();
  PERFORM official_v3_guard_private.check_certificates_v1();
  PERFORM official_v3_guard_private.check_retirements_v1();
  current_content:=jsonb_build_object('hma',official_v3_guard_private.content_digest_v1('hma'),
    's1',official_v3_guard_private.content_digest_v1('s1'),'jobs',official_v3_guard_private.content_digest_v1('jobs'),
    'hrs',official_v3_guard_private.hrs_certificate_v1());
  IF current_content IS DISTINCT FROM (SELECT value FROM pg_temp.bg1_recovery_before WHERE kind='content') THEN
    RAISE EXCEPTION 'bg1 recovery old certified content changed' USING ERRCODE='P7901'; END IF;
  FOR prior IN SELECT * FROM pg_temp.bg1_recovery_before WHERE kind LIKE 'table:%' LOOP
    table_name:=substr(prior.kind,7);
    EXECUTE format('SELECT count(*),encode(sha256(convert_to(COALESCE(string_agg(encode(sha256(convert_to(to_jsonb(r)::text,''UTF8'')),''hex''),'''' ORDER BY to_jsonb(r)::text COLLATE "C"),''''),''UTF8'')),''hex'') FROM %s r',table_name::regclass)
      INTO row_count,row_digest;
    IF prior.value IS DISTINCT FROM jsonb_build_object('count',row_count,'digest',row_digest) THEN
      RAISE EXCEPTION 'bg1 recovery old table changed' USING ERRCODE='P7901'; END IF;
  END LOOP;
  IF EXISTS(SELECT 1 FROM official_v3_guard_private.retired_later_attempts_v1) THEN
    RAISE EXCEPTION 'bg1 recovery installer cannot retire an attempt' USING ERRCODE='P7901'; END IF;
  IF public.official_v3_guard_alarm_status_v1() IS DISTINCT FROM '{"schema":1,"status":"unavailable"}'::jsonb THEN
    RAISE EXCEPTION 'bg1 recovery fresh proof admission required' USING ERRCODE='P7901'; END IF;
  BEGIN
    PERFORM official_v3_guard_private.require_open_v1();
    RAISE EXCEPTION 'bg1 recovery old proof admitted business IO' USING ERRCODE='P7901';
  EXCEPTION WHEN SQLSTATE 'P7902' THEN NULL; END;
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
    RAISE EXCEPTION 'bg1 recovery final quiescence refusal' USING ERRCODE='P7901'; END IF;
END $recovery_postcheck$;
