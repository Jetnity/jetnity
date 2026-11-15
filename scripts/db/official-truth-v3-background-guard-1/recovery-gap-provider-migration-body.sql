-- BG1-RECOVERY3: fixed Dev Claim3 without Start, actual unknown Start4; provider transaction required.
SET LOCAL jetnity.bg1_gap_target='dev:yfvbxvijcorffwxbxahl:BG1-RECOVERY3';
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
    OR current_setting('jetnity.bg1_gap_target',true) IS DISTINCT FROM 'dev:yfvbxvijcorffwxbxahl:BG1-RECOVERY3'
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
CREATE TEMP TABLE bg1_gap_before(kind text PRIMARY KEY,value jsonb NOT NULL) ON COMMIT DROP;
DO $gap_predecessor$
DECLARE expected record; actual record; before_catalog jsonb; table_name text; row_count bigint; row_digest text; owner_name text;
BEGIN
  IF to_regclass('official_v3_guard_private.gap_recovery_baseline_v1') IS NOT NULL THEN
    RAISE EXCEPTION 'bg1 recovery exact unused successor required' USING ERRCODE='P7901'; END IF;
  FOR expected IN SELECT * FROM (VALUES
    ('official_v3_guard_private.immutable_v1()','912ce0a3cee4ab57ee76be8425053f5f42963db5a2943a76f0d49d70059f963b'),
    ('official_v3_guard_private.require_open_v1()','48f3a96639cae37d4b930a0a46149ad1fcaddc4d8f5afd67985528af6f3bfc39'),
    ('official_v3_guard_private.check_control_v1()','8a37a92bd1293a467665da5831d717e7675650af9a2f5ef60e1cf57899a99eb4'),
    ('official_v3_guard_private.hrs_catalog_v1()','90983802fa25e02731f0595a21deb0a54e6712f470b765be176d3b27ab7b835d'),
    ('official_v3_guard_private.open_until_v1()','38a690b6246405e05f46cccca99753b4031d9efc78069c53afe83ae2cfab5aaf'),
    ('official_v3_guard_private.jobs_catalog_v1()','389b3202c4d2af2d3d8392f594b2b88663f94b91cae9527017e53825a72b5fe5'),
    ('official_v3_guard_private.intake_retired_v1(text)','36791e20b7021ae55e507f971b1e89bd9b821afc0bff299dedf9d4d18de74ec1'),
    ('official_v3_guard_private.attempt_retired_v1(text)','299ff555963f73247651989e1d9a4bf8bea78ed1f47f5dba1903957c1f0ec31c'),
    ('official_v3_guard_private.alarm_status_v1()','c0d610e700e6dd48b058256ef30bcee551f39a045e70e26429baaa7c3bc0f65b'),
    ('official_v3_guard_private.catalog_v1()','28a3e90b0e6be9db58d5910530437b4a76bd5950663d37a1cbcf8ced8545b1db'),
    ('official_v3_guard_private.assert_catalog_v1()','1610defe705908c84a1c0b9f415d88434dd3448c493c8c4bf9304dc6f668d55e'),
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
    ('official_v3_guard_private.recovery_jobs_v1()','8c122e36ee064bcd2b2e764f8c642190f43abe69dd5d9219ae135e016a1433eb'),
    ('official_v3_guard_private.recovery_intake_v1(jsonb)','89dddddb04af829f1e3125d9baa2a60e9ace637b1d87e520b153f9b88e955dcc'),
    ('official_v3_guard_private.recovery_hrs_v1()','f2e2304b42313784e39b6ec032aaa44feaace0402250af4c64e64a11318b9644'),
    ('official_v3_guard_private.recovery_snapshot_v1()','ac8fa99fbb775db57d2bf9386e6754c10583dc819453c9aacf0123e662cd1ea7'),
    ('official_v3_guard_private.retired_state_v1(text)','9e1c2283438d7125d1fe2eca59c13f02ddc1d45474107745c9aacbfb1bf903c7'),
    ('official_v3_guard_private.close_jobs_v1(text)','68c8c79279de8a002dd81f3e07c6b9405567c250ce638a3a492c768eba54fbf2'),
    ('official_v3_guard_private.check_retired_jobs_v1(jsonb)','1d1548139f8b59c58daf5482353b0c0788420ee2c3cd033c881663c9e9e2367f'),
    ('official_v3_guard_private.check_retired_s1_v1(jsonb)','81f6c9307db1b7c57d22ddecaa49b4c8d815511b8528a12d13319b472d8f48db'),
    ('official_v3_guard_private.check_retired_hrs_v1(jsonb)','08eae5f6050a4d31ce32a49568a31df5b70169ac0a60e3b9c06a86508fb47ab7'),
    ('official_v3_guard_private.check_retirements_v1()','8f99b7248314262dfefbe9519d52e9c14d69a8532d9a04882198cc1e038e74bf'),
    ('official_v3_guard_private.incident_snapshot_v1()','4ba7e039404a7d288a2d2fa7d9d61419eb0d3c2e6383c6a662ffb2185a645960'),
    ('public.official_v3_guard_review_v1()','3f5cbf0a53c797a851d72d7d07c1f5deff4267d867c33249eff3b1b82316d359'),
    ('public.official_v3_guard_retire_v1(text,text)','4f0065e2b17aece0a3f43fa4da80f5eb4a295e6e71727593c0eed61312264724'),
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
    ('public.official_v3_guard_alarm_status_v1()','0fd765ca693b28d2e9f00752be34f08fabe9fa3193efc775730c1d14be413d22'),
    ('official_v3_guard_private.recovery_canonical_v1(jsonb,integer)','9ae0114402a4d9d45514b45508a03b4be6865ef92b13818acd96d244715e355d')
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
  IF before_catalog IS DISTINCT FROM (SELECT catalog FROM official_v3_guard_private.recovery_baseline_v1 WHERE singleton) THEN
    RAISE EXCEPTION 'bg1 recovery predecessor catalog mismatch' USING ERRCODE='P7905'; END IF;
  PERFORM official_v3_guard_private.assert_catalog_v1();
  PERFORM official_v3_guard_private.check_control_v1();
  PERFORM official_v3_guard_private.check_hma_v1();
  PERFORM official_v3_guard_private.check_s1_v1();
  PERFORM official_v3_guard_private.check_jobs_v1();
  PERFORM official_v3_guard_private.check_hrs_v1();
  PERFORM official_v3_guard_private.check_certificates_v1();
  PERFORM official_v3_guard_private.check_retirements_v1();
  INSERT INTO pg_temp.bg1_gap_before VALUES('catalog',before_catalog),
    ('memberships',COALESCE((SELECT jsonb_agg(to_jsonb(m) ORDER BY m.oid) FROM pg_auth_members m),'[]'::jsonb)),
    ('schema_acl',(SELECT jsonb_build_object('owner',nspowner,'acl',nspacl) FROM pg_namespace WHERE nspname='official_v3_guard_private')),
    ('content',jsonb_build_object('hma',official_v3_guard_private.content_digest_v1('hma'),
      's1',official_v3_guard_private.content_digest_v1('s1'),'jobs',official_v3_guard_private.content_digest_v1('jobs'),
      'hrs',official_v3_guard_private.hrs_certificate_v1()));
  -- The installed, independently checked catalog binds the actual bootstrap
  -- grantor and original OIDs. Never edit or delete those ADMIN-only rows.
  FOREACH owner_name IN ARRAY ARRAY['ot_v3_jobs_owner','ot_v3_intake_owner'] LOOP
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
    'official_v3_guard_private.owner_operations_v1','official_v3_guard_private.retired_attempts_v1','official_v3_guard_private.status_baseline_v1',
    'official_v3_guard_private.recovery_baseline_v1','official_v3_guard_private.retired_later_attempts_v1'
  ] LOOP
    EXECUTE format('SELECT count(*),encode(sha256(convert_to(COALESCE(string_agg(encode(sha256(convert_to(to_jsonb(r)::text,''UTF8'')),''hex''),'''' ORDER BY to_jsonb(r)::text COLLATE "C"),''''),''UTF8'')),''hex'') FROM %s r',table_name::regclass)
      INTO row_count,row_digest;
    INSERT INTO pg_temp.bg1_gap_before VALUES('table:'||table_name,jsonb_build_object('count',row_count,'digest',row_digest));
  END LOOP;
END $gap_predecessor$;



-- Only existing owners receive transaction-local SET/CREATE. Their original
-- membership rows, OIDs, grantors/options and the complete ACL are restored.
GRANT ot_v3_jobs_owner TO postgres WITH ADMIN FALSE, INHERIT FALSE, SET TRUE GRANTED BY postgres;
GRANT ot_v3_intake_owner TO postgres WITH ADMIN FALSE, INHERIT FALSE, SET TRUE GRANTED BY postgres;
GRANT CREATE ON SCHEMA official_v3_guard_private TO ot_v3_jobs_owner,ot_v3_intake_owner;

CREATE TABLE official_v3_guard_private.gap_recovery_baseline_v1 (
  singleton boolean PRIMARY KEY DEFAULT true CHECK (singleton),
  recovery2_provider_digest text NOT NULL CHECK (recovery2_provider_digest='b7cc8c0d061bef261a0d9ab3824672b7759502ab0d26c68139e5cfcf6525eaf7'),
  predecessor_catalog_digest text NOT NULL CHECK (predecessor_catalog_digest ~ '^[a-f0-9]{64}$'),
  predecessor_recovery_digest text NOT NULL CHECK (predecessor_recovery_digest ~ '^[a-f0-9]{64}$'),
  required_generation bigint NOT NULL CHECK (required_generation>0),
  proof_not_before timestamptz NOT NULL CHECK (isfinite(proof_not_before)),
  catalog jsonb NOT NULL
);
ALTER TABLE official_v3_guard_private.gap_recovery_baseline_v1 ENABLE ROW LEVEL SECURITY;
ALTER TABLE official_v3_guard_private.gap_recovery_baseline_v1 FORCE ROW LEVEL SECURITY;
CREATE POLICY owner_only ON official_v3_guard_private.gap_recovery_baseline_v1 TO postgres USING (true) WITH CHECK (true);
CREATE TRIGGER immutable_v1 BEFORE UPDATE OR DELETE ON official_v3_guard_private.gap_recovery_baseline_v1
  FOR EACH ROW EXECUTE FUNCTION official_v3_guard_private.immutable_v1();
CREATE TRIGGER immutable_truncate_v1 BEFORE TRUNCATE ON official_v3_guard_private.gap_recovery_baseline_v1
  FOR EACH STATEMENT EXECUTE FUNCTION official_v3_guard_private.immutable_v1();
REVOKE ALL ON TABLE official_v3_guard_private.gap_recovery_baseline_v1
  FROM PUBLIC,anon,authenticated,service_role,supabase_read_only_user,ot_v3_jobs_owner,ot_v3_result_owner,ot_v3_intake_owner;

SET LOCAL ROLE ot_v3_jobs_owner;
CREATE OR REPLACE FUNCTION official_v3_guard_private.recovery_jobs_v1() RETURNS jsonb
LANGUAGE plpgsql VOLATILE SECURITY DEFINER SET search_path=pg_catalog AS $gap3_body$
DECLARE s official_v3_jobs_private.subjects_v1%ROWTYPE; t official_v3_jobs_private.execution_starts_v1%ROWTYPE;
  c official_v3_jobs_private.queue_operations_v1%ROWTYPE; prior record; held jsonb; preceding jsonb:='[]';
  n integer; expected integer:=1; fence jsonb; seed text; input_revision text; candidate jsonb;
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
  IF (n BETWEEN 2 AND 4) IS NOT TRUE OR (s.start_count<>n AND NOT(n=4 AND s.start_count=3)) OR s.current_job IS DISTINCT FROM t.leased_job
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
  IF expected<>n AND NOT(n=4 AND s.start_count=3 AND expected=3) THEN RAISE EXCEPTION 'bg1 complete preceding retirement chain required' USING ERRCODE='P7906'; END IF;
  fence:=jsonb_build_object('jobId',t.leased_job->'jobId','revision',t.leased_job->'revision',
    'leaseId',t.leased_job#>'{lease,leaseId}','generation',t.leased_job#>'{lease,generation}');
  input_revision:='snapshot:0beb25db2e1f6e4c2c96d61ded30b59a8e06a32ed94498903fbeecc3b6f267e9';
  seed:=official_v3_jobs_private.canonical_v1(jsonb_build_object('producerRevision',1,'inputRevision',input_revision,'job',t.leased_job,'fence',fence),0);
  candidate:=jsonb_build_object('attemptKey',t.attempt_key,'jobKey',t.job_key,'claimOperationId',t.claim_operation_id,
    'claim',t.claim_text::jsonb,'leasedJob',t.leased_job,'authority',t.authority,'fence',fence,
    'intakeOperationId','op3_'||substr(encode(sha256(convert_to('operation:'||seed,'UTF8')),'hex'),1,32),
    'deliveryId','delivery3_'||substr(encode(sha256(convert_to('delivery:'||seed,'UTF8')),'hex'),1,32),
    'runnerId','runner3_'||substr(encode(sha256(convert_to(official_v3_jobs_private.canonical_v1(jsonb_build_object(
      'kind','aa_bern_ch_de_untrusted_delivery','producerRevision',1,'inputRevision',input_revision),0),'UTF8')),'hex'),1,32),
    'inputRevision',input_revision,'startCount',s.start_count,'operationCount',s.operation_count,'preceding',preceding);
  IF n=4 AND s.start_count=3 THEN
DECLARE gap_claim official_v3_jobs_private.queue_operations_v1%ROWTYPE;
  gap_start official_v3_jobs_private.execution_starts_v1%ROWTYPE;
  gap_row official_v3_jobs_private.queue_operations_v1%ROWTYPE;
  gap_number integer:=1; gap_previous jsonb; gap_next jsonb; gap_retired jsonb;
  gap_preceding jsonb; gap_fence jsonb; gap_seed text; gap_value jsonb;
BEGIN
  IF candidate#>'{leasedJob,attempt}' IS DISTINCT FROM '4'::jsonb
    OR candidate#>'{leasedJob,attemptLimit}' IS DISTINCT FROM '4'::jsonb
    OR candidate->'startCount' IS DISTINCT FROM '3'::jsonb
    OR candidate#>'{leasedJob,revision}' IS DISTINCT FROM '5'::jsonb
    OR candidate#>'{leasedJob,lease,generation}' IS DISTINCT FROM '5'::jsonb
    OR candidate#>>'{leasedJob,state}' IS DISTINCT FROM 'leased'
    OR candidate#>>'{leasedJob,contextKey}' IS DISTINCT FROM 'official-truth-context:v3:bfce3bc64dbd7c670441e05033c31f339e03a2c488ab54937320508333c252c2'
    OR candidate->'authority' IS DISTINCT FROM jsonb_build_object('methodId','jetnity-destination-primary-ch-de-visa','revision',1,
      'methodDigest','44ce02752da05796bef98c55b5099b81f915fe6b0975472e163721a06793bdb3',
      'packageDigest','0beb25db2e1f6e4c2c96d61ded30b59a8e06a32ed94498903fbeecc3b6f267e9','epoch',1)
    OR candidate->>'inputRevision' IS DISTINCT FROM 'snapshot:0beb25db2e1f6e4c2c96d61ded30b59a8e06a32ed94498903fbeecc3b6f267e9'
    OR jsonb_typeof(candidate->'preceding') IS DISTINCT FROM 'array'
    OR jsonb_array_length(candidate->'preceding')<>2 THEN
    RAISE EXCEPTION 'bg1 exact gap3 fourth-attempt scope required' USING ERRCODE='P7906';
  END IF;
  PERFORM official_v3_jobs_private.assert_history_v1(candidate->>'jobKey');
  -- Starts are counted as actual immutable rows, never inferred from attempt4.
  IF (SELECT count(*) FROM official_v3_jobs_private.execution_starts_v1 x
      WHERE x.job_key=candidate->>'jobKey' AND x.leased_job->'jobId'=candidate#>'{leasedJob,jobId}')<>3 THEN
    RAISE EXCEPTION 'bg1 exact actual starts 1 2 4 required' USING ERRCODE='P7906';
  END IF;
  FOR gap_row IN SELECT * FROM official_v3_jobs_private.queue_operations_v1 q
    WHERE q.job_key=candidate->>'jobKey' AND q.action='claim'
      AND q.envelope_text::jsonb#>'{next,jobId}'=candidate#>'{leasedJob,jobId}'
      AND q.envelope_text::jsonb#>>'{next,state}'='leased'
    ORDER BY (q.envelope_text::jsonb#>>'{next,attempt}')::integer LOOP
    gap_next:=gap_row.envelope_text::jsonb->'next';
    IF gap_number>4 OR gap_next->'attempt' IS DISTINCT FROM to_jsonb(gap_number)
      OR gap_next->'revision' IS DISTINCT FROM to_jsonb(gap_number+1)
      OR gap_next#>'{lease,generation}' IS DISTINCT FROM to_jsonb(gap_number+1)
      OR gap_next->>'state' IS DISTINCT FROM 'leased'
      OR gap_row.authority IS DISTINCT FROM candidate->'authority'
      OR gap_row.command_text::jsonb->>'action' IS DISTINCT FROM 'claim'
      OR gap_row.command_text::jsonb#>'{input,jobKey}' IS DISTINCT FROM candidate->'jobKey'
      OR gap_row.command_text::jsonb#>'{input,operationId}' IS DISTINCT FROM to_jsonb(gap_row.operation_id)
      OR gap_number=1 AND (gap_row.envelope_text::jsonb#>'{expected,attempt}' IS DISTINCT FROM '0'::jsonb
        OR gap_row.envelope_text::jsonb#>'{expected,revision}' IS DISTINCT FROM '1'::jsonb)
      OR gap_number>1 AND gap_row.envelope_text::jsonb->'expected' IS DISTINCT FROM gap_previous THEN
      RAISE EXCEPTION 'bg1 exact genuine four-claim prefix required' USING ERRCODE='P7906';
    END IF;
    IF gap_number=3 THEN
      gap_claim:=gap_row;
      IF EXISTS(SELECT 1 FROM official_v3_jobs_private.execution_starts_v1 x
          WHERE x.claim_operation_id=gap_row.operation_id OR x.job_key=candidate->>'jobKey'
            AND x.leased_job->'jobId'=candidate#>'{leasedJob,jobId}' AND x.leased_job->'attempt'='3'::jsonb)
        OR clock_timestamp()<=(gap_next#>>'{lease,expiresAt}')::timestamptz THEN
        RAISE EXCEPTION 'bg1 genuine expired claim3 without execution required' USING ERRCODE='P7906';
      END IF;
    ELSE
      SELECT * INTO STRICT gap_start FROM official_v3_jobs_private.execution_starts_v1 x
        WHERE x.claim_operation_id=gap_row.operation_id;
      IF gap_start.job_key IS DISTINCT FROM candidate->>'jobKey'
        OR gap_start.leased_job IS DISTINCT FROM gap_next
        OR gap_start.authority IS DISTINCT FROM gap_row.authority
        OR gap_start.claim_text IS DISTINCT FROM official_v3_jobs_private.canonical_v1(gap_row.command_text::jsonb->'input',0)
        OR EXISTS(SELECT 1 FROM official_v3_jobs_private.execution_results_v1 WHERE attempt_key=gap_start.attempt_key)
        OR EXISTS(SELECT 1 FROM official_v3_jobs_private.execution_dispositions_v1 WHERE attempt_key=gap_start.attempt_key) THEN
        RAISE EXCEPTION 'bg1 gap proof actual execution binding' USING ERRCODE='P7906';
      END IF;
      IF gap_number<3 THEN
        gap_retired:=official_v3_guard_private.retired_state_v1(gap_start.attempt_key);
        gap_preceding:=jsonb_build_object('attemptKey',gap_start.attempt_key,'attempt',gap_number,
          'snapshotDigest',encode(sha256(convert_to(gap_retired::text,'UTF8')),'hex'),
          'intakeOperationId',gap_retired#>'{job,intakeOperationId}','proposalDigest',gap_retired#>'{intake,proposal_digest}');
        IF gap_retired IS NULL OR gap_retired#>'{job,leasedJob}' IS DISTINCT FROM gap_next
          OR gap_retired#>'{job,authority}' IS DISTINCT FROM gap_row.authority
          OR gap_retired->>'kind' IS DISTINCT FROM (CASE WHEN gap_number=1 THEN 'ch_de_first_unknown' ELSE 'ch_de_later_unknown' END)
          OR candidate->'preceding'->(gap_number-1) IS DISTINCT FROM gap_preceding THEN
          RAISE EXCEPTION 'bg1 gap proof real retired predecessors required' USING ERRCODE='P7906';
        END IF;
      ELSIF gap_start.attempt_key IS DISTINCT FROM candidate->>'attemptKey'
        OR gap_start.claim_operation_id IS DISTINCT FROM candidate->>'claimOperationId'
        OR gap_start.leased_job IS DISTINCT FROM candidate->'leasedJob'
        OR gap_start.claim_text::jsonb IS DISTINCT FROM candidate->'claim' THEN
        RAISE EXCEPTION 'bg1 gap proof actual fourth start required' USING ERRCODE='P7906';
      END IF;
    END IF;
    gap_previous:=gap_next; gap_number:=gap_number+1;
  END LOOP;
  IF gap_number<>5 OR gap_claim.operation_id IS NULL THEN
    RAISE EXCEPTION 'bg1 complete genuine claim prefix required' USING ERRCODE='P7906';
  END IF;
  gap_next:=gap_claim.envelope_text::jsonb->'next';
  gap_fence:=jsonb_build_object('jobId',gap_next->'jobId','revision',gap_next->'revision',
    'leaseId',gap_next#>'{lease,leaseId}','generation',gap_next#>'{lease,generation}');
  gap_seed:=official_v3_jobs_private.canonical_v1(jsonb_build_object('producerRevision',1,
    'inputRevision',candidate->'inputRevision','job',gap_next,'fence',gap_fence),0);
  gap_value:=jsonb_build_array(jsonb_build_object('kind','claim_without_execution_start','attempt',3,
    'queueOperation',to_jsonb(gap_claim)||jsonb_build_object('recorded_at',extract(epoch FROM gap_claim.recorded_at)),
    'intakeOperationId','op3_'||substr(encode(sha256(convert_to('operation:'||gap_seed,'UTF8')),'hex'),1,32)));
  IF candidate ? 'skippedClaims' THEN
    IF candidate->'skippedClaims' IS DISTINCT FROM gap_value THEN
      RAISE EXCEPTION 'bg1 immutable skipped claim proof changed' USING ERRCODE='P7906';
    END IF;
  ELSE
    candidate:=candidate||jsonb_build_object('skippedClaims',gap_value);
  END IF;
END;
  END IF;
  RETURN candidate;
END $gap3_body$;
RESET ROLE;

SET LOCAL ROLE ot_v3_jobs_owner;
CREATE OR REPLACE FUNCTION official_v3_guard_private.check_retired_jobs_v1(evidence jsonb) RETURNS void
LANGUAGE plpgsql VOLATILE SECURITY DEFINER SET search_path=pg_catalog AS $gap3_body$
DECLARE candidate jsonb:=evidence->'job';
BEGIN
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
END;
  IF candidate ? 'skippedClaims' THEN
DECLARE gap_claim official_v3_jobs_private.queue_operations_v1%ROWTYPE;
  gap_start official_v3_jobs_private.execution_starts_v1%ROWTYPE;
  gap_row official_v3_jobs_private.queue_operations_v1%ROWTYPE;
  gap_number integer:=1; gap_previous jsonb; gap_next jsonb; gap_retired jsonb;
  gap_preceding jsonb; gap_fence jsonb; gap_seed text; gap_value jsonb;
BEGIN
  IF candidate#>'{leasedJob,attempt}' IS DISTINCT FROM '4'::jsonb
    OR candidate#>'{leasedJob,attemptLimit}' IS DISTINCT FROM '4'::jsonb
    OR candidate->'startCount' IS DISTINCT FROM '3'::jsonb
    OR candidate#>'{leasedJob,revision}' IS DISTINCT FROM '5'::jsonb
    OR candidate#>'{leasedJob,lease,generation}' IS DISTINCT FROM '5'::jsonb
    OR candidate#>>'{leasedJob,state}' IS DISTINCT FROM 'leased'
    OR candidate#>>'{leasedJob,contextKey}' IS DISTINCT FROM 'official-truth-context:v3:bfce3bc64dbd7c670441e05033c31f339e03a2c488ab54937320508333c252c2'
    OR candidate->'authority' IS DISTINCT FROM jsonb_build_object('methodId','jetnity-destination-primary-ch-de-visa','revision',1,
      'methodDigest','44ce02752da05796bef98c55b5099b81f915fe6b0975472e163721a06793bdb3',
      'packageDigest','0beb25db2e1f6e4c2c96d61ded30b59a8e06a32ed94498903fbeecc3b6f267e9','epoch',1)
    OR candidate->>'inputRevision' IS DISTINCT FROM 'snapshot:0beb25db2e1f6e4c2c96d61ded30b59a8e06a32ed94498903fbeecc3b6f267e9'
    OR jsonb_typeof(candidate->'preceding') IS DISTINCT FROM 'array'
    OR jsonb_array_length(candidate->'preceding')<>2 THEN
    RAISE EXCEPTION 'bg1 exact gap3 fourth-attempt scope required' USING ERRCODE='P7906';
  END IF;
  PERFORM official_v3_jobs_private.assert_history_v1(candidate->>'jobKey');
  -- Starts are counted as actual immutable rows, never inferred from attempt4.
  IF (SELECT count(*) FROM official_v3_jobs_private.execution_starts_v1 x
      WHERE x.job_key=candidate->>'jobKey' AND x.leased_job->'jobId'=candidate#>'{leasedJob,jobId}')<>3 THEN
    RAISE EXCEPTION 'bg1 exact actual starts 1 2 4 required' USING ERRCODE='P7906';
  END IF;
  FOR gap_row IN SELECT * FROM official_v3_jobs_private.queue_operations_v1 q
    WHERE q.job_key=candidate->>'jobKey' AND q.action='claim'
      AND q.envelope_text::jsonb#>'{next,jobId}'=candidate#>'{leasedJob,jobId}'
      AND q.envelope_text::jsonb#>>'{next,state}'='leased'
    ORDER BY (q.envelope_text::jsonb#>>'{next,attempt}')::integer LOOP
    gap_next:=gap_row.envelope_text::jsonb->'next';
    IF gap_number>4 OR gap_next->'attempt' IS DISTINCT FROM to_jsonb(gap_number)
      OR gap_next->'revision' IS DISTINCT FROM to_jsonb(gap_number+1)
      OR gap_next#>'{lease,generation}' IS DISTINCT FROM to_jsonb(gap_number+1)
      OR gap_next->>'state' IS DISTINCT FROM 'leased'
      OR gap_row.authority IS DISTINCT FROM candidate->'authority'
      OR gap_row.command_text::jsonb->>'action' IS DISTINCT FROM 'claim'
      OR gap_row.command_text::jsonb#>'{input,jobKey}' IS DISTINCT FROM candidate->'jobKey'
      OR gap_row.command_text::jsonb#>'{input,operationId}' IS DISTINCT FROM to_jsonb(gap_row.operation_id)
      OR gap_number=1 AND (gap_row.envelope_text::jsonb#>'{expected,attempt}' IS DISTINCT FROM '0'::jsonb
        OR gap_row.envelope_text::jsonb#>'{expected,revision}' IS DISTINCT FROM '1'::jsonb)
      OR gap_number>1 AND gap_row.envelope_text::jsonb->'expected' IS DISTINCT FROM gap_previous THEN
      RAISE EXCEPTION 'bg1 exact genuine four-claim prefix required' USING ERRCODE='P7906';
    END IF;
    IF gap_number=3 THEN
      gap_claim:=gap_row;
      IF EXISTS(SELECT 1 FROM official_v3_jobs_private.execution_starts_v1 x
          WHERE x.claim_operation_id=gap_row.operation_id OR x.job_key=candidate->>'jobKey'
            AND x.leased_job->'jobId'=candidate#>'{leasedJob,jobId}' AND x.leased_job->'attempt'='3'::jsonb)
        OR clock_timestamp()<=(gap_next#>>'{lease,expiresAt}')::timestamptz THEN
        RAISE EXCEPTION 'bg1 genuine expired claim3 without execution required' USING ERRCODE='P7906';
      END IF;
    ELSE
      SELECT * INTO STRICT gap_start FROM official_v3_jobs_private.execution_starts_v1 x
        WHERE x.claim_operation_id=gap_row.operation_id;
      IF gap_start.job_key IS DISTINCT FROM candidate->>'jobKey'
        OR gap_start.leased_job IS DISTINCT FROM gap_next
        OR gap_start.authority IS DISTINCT FROM gap_row.authority
        OR gap_start.claim_text IS DISTINCT FROM official_v3_jobs_private.canonical_v1(gap_row.command_text::jsonb->'input',0)
        OR EXISTS(SELECT 1 FROM official_v3_jobs_private.execution_results_v1 WHERE attempt_key=gap_start.attempt_key)
        OR EXISTS(SELECT 1 FROM official_v3_jobs_private.execution_dispositions_v1 WHERE attempt_key=gap_start.attempt_key) THEN
        RAISE EXCEPTION 'bg1 gap proof actual execution binding' USING ERRCODE='P7906';
      END IF;
      IF gap_number<3 THEN
        gap_retired:=official_v3_guard_private.retired_state_v1(gap_start.attempt_key);
        gap_preceding:=jsonb_build_object('attemptKey',gap_start.attempt_key,'attempt',gap_number,
          'snapshotDigest',encode(sha256(convert_to(gap_retired::text,'UTF8')),'hex'),
          'intakeOperationId',gap_retired#>'{job,intakeOperationId}','proposalDigest',gap_retired#>'{intake,proposal_digest}');
        IF gap_retired IS NULL OR gap_retired#>'{job,leasedJob}' IS DISTINCT FROM gap_next
          OR gap_retired#>'{job,authority}' IS DISTINCT FROM gap_row.authority
          OR gap_retired->>'kind' IS DISTINCT FROM (CASE WHEN gap_number=1 THEN 'ch_de_first_unknown' ELSE 'ch_de_later_unknown' END)
          OR candidate->'preceding'->(gap_number-1) IS DISTINCT FROM gap_preceding THEN
          RAISE EXCEPTION 'bg1 gap proof real retired predecessors required' USING ERRCODE='P7906';
        END IF;
      ELSIF gap_start.attempt_key IS DISTINCT FROM candidate->>'attemptKey'
        OR gap_start.claim_operation_id IS DISTINCT FROM candidate->>'claimOperationId'
        OR gap_start.leased_job IS DISTINCT FROM candidate->'leasedJob'
        OR gap_start.claim_text::jsonb IS DISTINCT FROM candidate->'claim' THEN
        RAISE EXCEPTION 'bg1 gap proof actual fourth start required' USING ERRCODE='P7906';
      END IF;
    END IF;
    gap_previous:=gap_next; gap_number:=gap_number+1;
  END LOOP;
  IF gap_number<>5 OR gap_claim.operation_id IS NULL THEN
    RAISE EXCEPTION 'bg1 complete genuine claim prefix required' USING ERRCODE='P7906';
  END IF;
  gap_next:=gap_claim.envelope_text::jsonb->'next';
  gap_fence:=jsonb_build_object('jobId',gap_next->'jobId','revision',gap_next->'revision',
    'leaseId',gap_next#>'{lease,leaseId}','generation',gap_next#>'{lease,generation}');
  gap_seed:=official_v3_jobs_private.canonical_v1(jsonb_build_object('producerRevision',1,
    'inputRevision',candidate->'inputRevision','job',gap_next,'fence',gap_fence),0);
  gap_value:=jsonb_build_array(jsonb_build_object('kind','claim_without_execution_start','attempt',3,
    'queueOperation',to_jsonb(gap_claim)||jsonb_build_object('recorded_at',extract(epoch FROM gap_claim.recorded_at)),
    'intakeOperationId','op3_'||substr(encode(sha256(convert_to('operation:'||gap_seed,'UTF8')),'hex'),1,32)));
  IF candidate ? 'skippedClaims' THEN
    IF candidate->'skippedClaims' IS DISTINCT FROM gap_value THEN
      RAISE EXCEPTION 'bg1 immutable skipped claim proof changed' USING ERRCODE='P7906';
    END IF;
  ELSE
    candidate:=candidate||jsonb_build_object('skippedClaims',gap_value);
  END IF;
END;
  END IF;
END $gap3_body$;
RESET ROLE;

SET LOCAL ROLE ot_v3_intake_owner;
CREATE OR REPLACE FUNCTION official_v3_guard_private.recovery_intake_v1(job_value jsonb) RETURNS jsonb
LANGUAGE plpgsql VOLATILE SECURITY DEFINER SET search_path=pg_catalog SET timezone='UTC' SET datestyle='ISO, YMD' AS $gap3_body$
DECLARE gap_job jsonb:=job_value;
BEGIN
DECLARE gap jsonb; gap_operation text;
BEGIN
  IF gap_job ? 'skippedClaims' THEN
    IF gap_job#>'{leasedJob,attempt}' IS DISTINCT FROM '4'::jsonb OR gap_job->'startCount' IS DISTINCT FROM '3'::jsonb
      OR jsonb_typeof(gap_job->'skippedClaims') IS DISTINCT FROM 'array'
      OR jsonb_array_length(gap_job->'skippedClaims')<>1 THEN
      RAISE EXCEPTION 'bg1 exact skipped intake scope required' USING ERRCODE='P7906';
    END IF;
    gap:=gap_job#>'{skippedClaims,0}'; gap_operation:=gap->>'intakeOperationId';
    IF gap->>'kind' IS DISTINCT FROM 'claim_without_execution_start' OR gap->'attempt' IS DISTINCT FROM '3'::jsonb
      OR (gap_operation ~ '^op3_[a-f0-9]{32}$') IS NOT TRUE
      OR gap_operation IS NOT DISTINCT FROM gap_job->>'intakeOperationId' THEN
      RAISE EXCEPTION 'bg1 exact skipped intake binding required' USING ERRCODE='P7906';
    END IF;
    -- These existing owner bridges observe real absence while all S1 writers
    -- are excluded. No fabricated reservation, original or completion exists.
    LOCK TABLE official_v3_intake_private.operations_v1,official_v3_intake_private.reservations_v1,
      official_v3_intake_private.completions_v1 IN SHARE MODE;
    IF EXISTS(SELECT 1 FROM official_v3_intake_private.operations_v1 WHERE operation_id=gap_operation)
      OR EXISTS(SELECT 1 FROM official_v3_intake_private.reservations_v1 WHERE operation_id=gap_operation)
      OR EXISTS(SELECT 1 FROM official_v3_intake_private.completions_v1 WHERE operation_id=gap_operation) THEN
      RAISE EXCEPTION 'bg1 skipped claim has actual intake history' USING ERRCODE='P7906';
    END IF;
  END IF;
END;
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
END;
END $gap3_body$;
RESET ROLE;

SET LOCAL ROLE ot_v3_intake_owner;
CREATE OR REPLACE FUNCTION official_v3_guard_private.check_retired_s1_v1(evidence jsonb) RETURNS void
LANGUAGE plpgsql VOLATILE SECURITY DEFINER SET search_path=pg_catalog SET timezone='UTC' SET datestyle='ISO, YMD' AS $gap3_body$
DECLARE gap_job jsonb:=evidence->'job';
BEGIN
DECLARE o official_v3_intake_private.operations_v1%ROWTYPE;
BEGIN
  SELECT * INTO STRICT o FROM official_v3_intake_private.operations_v1 WHERE operation_id=evidence#>>'{job,intakeOperationId}';
  IF (to_jsonb(o)-ARRAY['original_bytes','lease_token'])||jsonb_build_object('bytes',octet_length(o.original_bytes)) IS DISTINCT FROM evidence->'intake'
    OR encode(sha256(o.original_bytes),'hex') IS DISTINCT FROM o.proposal_digest
    OR EXISTS(SELECT 1 FROM official_v3_intake_private.completions_v1 WHERE operation_id=o.operation_id) THEN
    RAISE EXCEPTION 'bg1 retired intake changed' USING ERRCODE='P7906';
  END IF;
END;
DECLARE gap jsonb; gap_operation text;
BEGIN
  IF gap_job ? 'skippedClaims' THEN
    IF gap_job#>'{leasedJob,attempt}' IS DISTINCT FROM '4'::jsonb OR gap_job->'startCount' IS DISTINCT FROM '3'::jsonb
      OR jsonb_typeof(gap_job->'skippedClaims') IS DISTINCT FROM 'array'
      OR jsonb_array_length(gap_job->'skippedClaims')<>1 THEN
      RAISE EXCEPTION 'bg1 exact skipped intake scope required' USING ERRCODE='P7906';
    END IF;
    gap:=gap_job#>'{skippedClaims,0}'; gap_operation:=gap->>'intakeOperationId';
    IF gap->>'kind' IS DISTINCT FROM 'claim_without_execution_start' OR gap->'attempt' IS DISTINCT FROM '3'::jsonb
      OR (gap_operation ~ '^op3_[a-f0-9]{32}$') IS NOT TRUE
      OR gap_operation IS NOT DISTINCT FROM gap_job->>'intakeOperationId' THEN
      RAISE EXCEPTION 'bg1 exact skipped intake binding required' USING ERRCODE='P7906';
    END IF;
    -- These existing owner bridges observe real absence while all S1 writers
    -- are excluded. No fabricated reservation, original or completion exists.
    LOCK TABLE official_v3_intake_private.operations_v1,official_v3_intake_private.reservations_v1,
      official_v3_intake_private.completions_v1 IN SHARE MODE;
    IF EXISTS(SELECT 1 FROM official_v3_intake_private.operations_v1 WHERE operation_id=gap_operation)
      OR EXISTS(SELECT 1 FROM official_v3_intake_private.reservations_v1 WHERE operation_id=gap_operation)
      OR EXISTS(SELECT 1 FROM official_v3_intake_private.completions_v1 WHERE operation_id=gap_operation) THEN
      RAISE EXCEPTION 'bg1 skipped claim has actual intake history' USING ERRCODE='P7906';
    END IF;
  END IF;
END;
END $gap3_body$;
RESET ROLE;

CREATE OR REPLACE FUNCTION official_v3_guard_private.check_retirements_v1() RETURNS void
LANGUAGE plpgsql VOLATILE SECURITY DEFINER SET search_path=pg_catalog AS $gap3_body$
DECLARE retired record; original official_v3_guard_private.retired_attempts_v1%ROWTYPE;
  op official_v3_guard_private.owner_operations_v1%ROWTYPE; j jsonb; p jsonb; held jsonb; expected integer; current_number integer:=2; gap_case boolean;
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
    gap_case:=retired.attempt_number=4 AND j ? 'skippedClaims';
    IF (retired.attempt_number<>current_number AND NOT(gap_case AND current_number=3)) OR retired.attempt_number NOT BETWEEN 2 AND 4
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
      OR j->>'startCount' IS DISTINCT FROM (CASE WHEN gap_case THEN 3 ELSE retired.attempt_number END)::text OR j#>'{leasedJob,attemptLimit}' IS DISTINCT FROM '4'::jsonb
      OR jsonb_typeof(j->'preceding') IS DISTINCT FROM 'array'
      OR jsonb_array_length(j->'preceding') IS DISTINCT FROM (CASE WHEN gap_case THEN 2 ELSE retired.attempt_number-1 END)
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
    current_number:=retired.attempt_number+1;
  END LOOP;
END $gap3_body$;

CREATE OR REPLACE FUNCTION official_v3_guard_private.intake_retired_v1(operation_value text) RETURNS boolean
LANGUAGE sql STABLE SECURITY DEFINER SET search_path=pg_catalog AS $gap3_body$
SELECT EXISTS(SELECT 1 FROM official_v3_guard_private.retired_attempts_v1 WHERE intake_operation_id=operation_value)
  OR EXISTS(SELECT 1 FROM official_v3_guard_private.retired_later_attempts_v1 WHERE intake_operation_id=operation_value)
  OR EXISTS(SELECT 1 FROM official_v3_guard_private.retired_later_attempts_v1
    WHERE attempt_number=4 AND before_state#>>'{job,skippedClaims,0,kind}'='claim_without_execution_start'
      AND before_state#>'{job,skippedClaims,0,attempt}'='3'::jsonb
      AND before_state#>>'{job,skippedClaims,0,intakeOperationId}'=operation_value)
$gap3_body$;

CREATE OR REPLACE FUNCTION official_v3_guard_private.assert_catalog_v1() RETURNS void
LANGUAGE plpgsql VOLATILE SECURITY DEFINER SET search_path=pg_catalog AS $gap3_body$
DECLARE successor official_v3_guard_private.recovery_baseline_v1%ROWTYPE;
  predecessor official_v3_guard_private.status_baseline_v1%ROWTYPE; old_baselines jsonb;
  gap_baseline official_v3_guard_private.gap_recovery_baseline_v1%ROWTYPE;
BEGIN
  SELECT * INTO STRICT gap_baseline FROM official_v3_guard_private.gap_recovery_baseline_v1 WHERE singleton;
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
    OR gap_baseline.recovery2_provider_digest<>'b7cc8c0d061bef261a0d9ab3824672b7759502ab0d26c68139e5cfcf6525eaf7'
    OR gap_baseline.predecessor_catalog_digest IS DISTINCT FROM encode(sha256(convert_to(successor.catalog::text,'UTF8')),'hex')
    OR gap_baseline.predecessor_recovery_digest IS DISTINCT FROM encode(sha256(convert_to((to_jsonb(successor)||jsonb_build_object('proof_not_before',extract(epoch FROM successor.proof_not_before)))::text,'UTF8')),'hex')
    OR gap_baseline.catalog IS DISTINCT FROM official_v3_guard_private.catalog_status_v1() THEN
    RAISE EXCEPTION 'bg1 recovery protected catalog changed' USING ERRCODE='P7905'; END IF;
END $gap3_body$;

CREATE OR REPLACE FUNCTION official_v3_guard_private.require_open_v1() RETURNS bigint
LANGUAGE plpgsql VOLATILE SECURITY DEFINER SET search_path=pg_catalog AS $gap3_body$
DECLARE s official_v3_guard_private.state_v1%ROWTYPE; instant timestamptz;
  required_proof bigint; earliest_proof timestamptz;
BEGIN
  SELECT * INTO s FROM official_v3_guard_private.state_v1 WHERE singleton FOR SHARE;
  instant:=clock_timestamp();
  IF NOT FOUND OR s.generation=0 OR s.incident_generation<>s.resumed_generation
    OR instant<s.last_observed OR instant<s.last_finished OR instant>=s.valid_until
    OR s.last_finished>s.last_started+interval '30 seconds' OR s.valid_until<>s.last_due+interval '5 minutes 30 seconds' THEN
    RAISE EXCEPTION 'bg1 integrity unavailable' USING ERRCODE='P7902'; END IF;
  SELECT greatest(g.required_generation,r.required_generation,b.required_generation),greatest(g.proof_not_before,r.proof_not_before,b.proof_not_before)
    INTO STRICT required_proof,earliest_proof FROM official_v3_guard_private.gap_recovery_baseline_v1 g
      CROSS JOIN official_v3_guard_private.recovery_baseline_v1 r
      CROSS JOIN official_v3_guard_private.status_baseline_v1 b WHERE g.singleton AND r.singleton AND b.singleton;
  IF s.generation<required_proof OR s.last_proof_started<earliest_proof OR instant<earliest_proof
    OR NOT EXISTS(SELECT 1 FROM official_v3_guard_private.runs_v1 run WHERE run.outcome='complete' AND run.generation=s.generation
      AND run.due_at=s.last_due AND run.started_at=s.last_started AND run.proof_started_at=s.last_proof_started AND run.finished_at=s.last_finished) THEN
    RAISE EXCEPTION 'bg1 recovery fresh full proof required' USING ERRCODE='P7902'; END IF;
  RETURN s.incident_generation;
END $gap3_body$;

CREATE OR REPLACE FUNCTION public.official_v3_guard_alarm_status_v1() RETURNS jsonb
LANGUAGE plpgsql VOLATILE SECURITY DEFINER SET search_path=pg_catalog AS $gap3_body$
DECLARE required_proof bigint; earliest_proof timestamptz; current_state official_v3_guard_private.state_v1%ROWTYPE;
  unavailable_value jsonb:=jsonb_build_object('schema',1,'status','unavailable');
BEGIN
  IF official_v3_guard_private.alarm_status_v1() IS DISTINCT FROM jsonb_build_object('schema',1,'status','current') THEN RETURN unavailable_value; END IF;
  SELECT greatest(g.required_generation,r.required_generation,b.required_generation),greatest(g.proof_not_before,r.proof_not_before,b.proof_not_before)
    INTO STRICT required_proof,earliest_proof FROM official_v3_guard_private.gap_recovery_baseline_v1 g
      CROSS JOIN official_v3_guard_private.recovery_baseline_v1 r
      CROSS JOIN official_v3_guard_private.status_baseline_v1 b WHERE g.singleton AND r.singleton AND b.singleton;
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
END $gap3_body$;

REVOKE CREATE ON SCHEMA official_v3_guard_private FROM ot_v3_jobs_owner,ot_v3_intake_owner;
REVOKE ot_v3_jobs_owner FROM postgres GRANTED BY postgres;
REVOKE ot_v3_intake_owner FROM postgres GRANTED BY postgres;

CREATE TEMP TABLE bg1_gap_objects(classid oid,objid oid,PRIMARY KEY(classid,objid)) ON COMMIT DROP;
DO $gap_delta$
DECLARE approved jsonb:='[{"signature":"official_v3_guard_private.recovery_jobs_v1()","name":"official_v3_guard_private.recovery_jobs_v1","owner":"ot_v3_jobs_owner","hash":"bda8b372958b984136225c896f5416a18a778d7f265416f993a84a129d544e95","language":"plpgsql","definer":true,"volatile":"v","config":["search_path=pg_catalog"]},{"signature":"official_v3_guard_private.check_retired_jobs_v1(jsonb)","name":"official_v3_guard_private.check_retired_jobs_v1","owner":"ot_v3_jobs_owner","hash":"b80bf16d123e66cbb328650efc6b02ce8a6b1028e24a37c6ff1ead318f4288f0","language":"plpgsql","definer":true,"volatile":"v","config":["search_path=pg_catalog"]},{"signature":"official_v3_guard_private.recovery_intake_v1(jsonb)","name":"official_v3_guard_private.recovery_intake_v1","owner":"ot_v3_intake_owner","hash":"3f5b06793ede7510c6ef9d8c2289d2700eb29ba36b6c17fb7014725a06ab7628","language":"plpgsql","definer":true,"volatile":"v","config":["search_path=pg_catalog","TimeZone=UTC","DateStyle=ISO, YMD"]},{"signature":"official_v3_guard_private.check_retired_s1_v1(jsonb)","name":"official_v3_guard_private.check_retired_s1_v1","owner":"ot_v3_intake_owner","hash":"8253e8ac077ddc59b962530bec8b731fc760eca26b2696b632f16238a46a3d74","language":"plpgsql","definer":true,"volatile":"v","config":["search_path=pg_catalog","TimeZone=UTC","DateStyle=ISO, YMD"]},{"signature":"official_v3_guard_private.check_retirements_v1()","name":"official_v3_guard_private.check_retirements_v1","owner":"postgres","hash":"33989c6c00312d7a1fb8c8ea528a2d8804d798e3083df784166ab1c67cdfe2e9","language":"plpgsql","definer":true,"volatile":"v","config":["search_path=pg_catalog"]},{"signature":"official_v3_guard_private.intake_retired_v1(text)","name":"official_v3_guard_private.intake_retired_v1","owner":"postgres","hash":"f98b43fec4e73e5d0f17eb9841f184c8f620443ad8adb7068a2a50c64ceecf22","language":"sql","definer":true,"volatile":"s","config":["search_path=pg_catalog"]},{"signature":"official_v3_guard_private.assert_catalog_v1()","name":"official_v3_guard_private.assert_catalog_v1","owner":"postgres","hash":"82a5bbfd8a0ba53659ed5e5a3c756b8a8d74bb53008b47a24c391a8353de9d93","language":"plpgsql","definer":true,"volatile":"v","config":["search_path=pg_catalog"]},{"signature":"official_v3_guard_private.require_open_v1()","name":"official_v3_guard_private.require_open_v1","owner":"postgres","hash":"afaf6b3970c6b6a796e2b32ee6ddaa4c428d62661ad5e78233de5d6649a936ca","language":"plpgsql","definer":true,"volatile":"v","config":["search_path=pg_catalog"]},{"signature":"public.official_v3_guard_alarm_status_v1()","name":"public.official_v3_guard_alarm_status_v1","owner":"postgres","hash":"bd3565ce584422120f200ac4f6c657852f6113c0e6c734218bb4da2634774ce0","language":"plpgsql","definer":true,"volatile":"v","config":["search_path=pg_catalog"]}]'::jsonb; expected record; actual pg_proc%ROWTYPE;
  before_catalog jsonb; after_catalog jsonb; entry record; relation_id oid; table_name text;
  class_value oid; object_value oid; expected_columns jsonb; replacement_ids oid[]:='{}';
BEGIN
  IF COALESCE((SELECT jsonb_agg(to_jsonb(m) ORDER BY m.oid) FROM pg_auth_members m),'[]'::jsonb)
      IS DISTINCT FROM (SELECT value FROM pg_temp.bg1_gap_before WHERE kind='memberships')
    OR (SELECT jsonb_build_object('owner',nspowner,'acl',nspacl) FROM pg_namespace WHERE nspname='official_v3_guard_private')
      IS DISTINCT FROM (SELECT value FROM pg_temp.bg1_gap_before WHERE kind='schema_acl') THEN
    RAISE EXCEPTION 'bg1 recovery exact authority restoration required' USING ERRCODE='P7901'; END IF;
  SELECT value INTO STRICT before_catalog FROM pg_temp.bg1_gap_before WHERE kind='catalog';
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
    IF NOT before_catalog ? ('function:'||actual.oid) THEN
      RAISE EXCEPTION 'bg1 gap recovery forbids new functions' USING ERRCODE='P7901'; END IF;
    replacement_ids:=array_append(replacement_ids,actual.oid);
  END LOOP;
  IF cardinality(replacement_ids)<>9 THEN RAISE EXCEPTION 'bg1 recovery exact replacement inventory' USING ERRCODE='P7901'; END IF;
  FOREACH table_name IN ARRAY ARRAY['gap_recovery_baseline_v1'] LOOP
    relation_id:=to_regclass('official_v3_guard_private.'||table_name);
    expected_columns:='[["singleton","boolean",true,false],["recovery2_provider_digest","text",true,false],["predecessor_catalog_digest","text",true,false],["predecessor_recovery_digest","text",true,false],["required_generation","bigint",true,false],["proof_not_before","timestamp with time zone",true,false],["catalog","jsonb",true,false]]'::jsonb;
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
    INSERT INTO pg_temp.bg1_gap_objects
      SELECT 'pg_class'::regclass,relation_id
      UNION SELECT 'pg_class'::regclass,c.reltoastrelid FROM pg_class c WHERE c.oid=relation_id AND c.reltoastrelid<>0
      UNION SELECT 'pg_class'::regclass,i.indexrelid FROM pg_index i WHERE i.indrelid=relation_id
        OR i.indrelid=(SELECT reltoastrelid FROM pg_class WHERE oid=relation_id)
      UNION SELECT 'pg_type'::regclass,t.oid FROM pg_type t WHERE t.typrelid=relation_id
        OR t.typelem IN (SELECT oid FROM pg_type WHERE typrelid=relation_id)
      UNION SELECT 'pg_constraint'::regclass,c.oid FROM pg_constraint c WHERE c.conrelid=relation_id
      UNION SELECT 'pg_trigger'::regclass,t.oid FROM pg_trigger t WHERE t.tgrelid=relation_id
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
    IF class_value IS NULL OR NOT EXISTS(SELECT 1 FROM pg_temp.bg1_gap_objects o WHERE o.classid=class_value AND o.objid=object_value) THEN
      RAISE EXCEPTION 'bg1 recovery unreviewed additive edge' USING ERRCODE='P7901'; END IF;
  END LOOP;
  INSERT INTO official_v3_guard_private.gap_recovery_baseline_v1
  SELECT true,'b7cc8c0d061bef261a0d9ab3824672b7759502ab0d26c68139e5cfcf6525eaf7',encode(sha256(convert_to(before_catalog::text,'UTF8')),'hex'),
    encode(sha256(convert_to((to_jsonb(prior)||jsonb_build_object('proof_not_before',extract(epoch FROM prior.proof_not_before)))::text,'UTF8')),'hex'),
    s.generation+1,clock_timestamp(),after_catalog FROM official_v3_guard_private.state_v1 s
      CROSS JOIN official_v3_guard_private.recovery_baseline_v1 prior WHERE s.singleton AND prior.singleton;
END $gap_delta$;

DO $gap_postcheck$
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
  IF current_content IS DISTINCT FROM (SELECT value FROM pg_temp.bg1_gap_before WHERE kind='content') THEN
    RAISE EXCEPTION 'bg1 recovery old certified content changed' USING ERRCODE='P7901'; END IF;
  FOR prior IN SELECT * FROM pg_temp.bg1_gap_before WHERE kind LIKE 'table:%' LOOP
    table_name:=substr(prior.kind,7);
    EXECUTE format('SELECT count(*),encode(sha256(convert_to(COALESCE(string_agg(encode(sha256(convert_to(to_jsonb(r)::text,''UTF8'')),''hex''),'''' ORDER BY to_jsonb(r)::text COLLATE "C"),''''),''UTF8'')),''hex'') FROM %s r',table_name::regclass)
      INTO row_count,row_digest;
    IF prior.value IS DISTINCT FROM jsonb_build_object('count',row_count,'digest',row_digest) THEN
      RAISE EXCEPTION 'bg1 recovery old table changed' USING ERRCODE='P7901'; END IF;
  END LOOP;
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
END $gap_postcheck$;
