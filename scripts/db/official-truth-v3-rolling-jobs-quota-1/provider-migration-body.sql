-- ROLLING-QUOTA1: exact Dev CH→DE successor; provider transaction required. No counter reset or history deletion.

SET LOCAL jetnity.rolling_quota_target='dev:yfvbxvijcorffwxbxahl:ROLLING-QUOTA1';

SET LOCAL search_path=pg_catalog; SET LOCAL statement_timeout='30s'; SET LOCAL lock_timeout='5s';

SET LOCAL idle_in_transaction_session_timeout='30s'; SET LOCAL timezone='UTC'; SET LOCAL datestyle='ISO, YMD';

DO $context$
BEGIN
  IF current_user<>'postgres' OR session_user<>current_user OR current_database()<>'postgres'
    OR current_setting('server_version_num')::integer/10000<>17
    OR current_setting('transaction_isolation') IS DISTINCT FROM 'read committed'
    OR current_setting('jetnity.rolling_quota_target',true) IS DISTINCT FROM 'dev:yfvbxvijcorffwxbxahl:ROLLING-QUOTA1'
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

CREATE TEMP TABLE rolling_before(kind text PRIMARY KEY,value jsonb NOT NULL) ON COMMIT DROP;
DO $recovery_predecessor$
DECLARE expected record; actual record; before_catalog jsonb; table_name text; row_count bigint; row_digest text; owner_name text;
BEGIN
  IF to_regclass('official_v3_guard_private.rolling_quota_baseline_v1') IS NOT NULL
    OR to_regclass('official_v3_jobs_private.rolling_policy_v2') IS NOT NULL
    OR to_regprocedure('official_v3_jobs_private.rolling_usage_v2(text)') IS NOT NULL
    OR to_regprocedure('official_v3_guard_private.ch_de_quota_v2()') IS NOT NULL THEN
    RAISE EXCEPTION 'bg1 recovery exact unused successor required' USING ERRCODE='P7901'; END IF;
  FOR expected IN SELECT * FROM (VALUES
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
    ('official_v3_jobs_private.assert_history_v1(text)','51f83aeba5523405b1948b92d34c3cebb84eef5872a97c0e02d31c0b4b105588'),
    ('official_v3_jobs_private.assert_catalog_v1()','c1f9fc5e7f3d4f0099b6e89e41d47df9165ec9b4e559807d1fff4db99bd25cfc'),
    ('official_v3_jobs_private.tx_queue_read_v1(jsonb,jsonb,integer,integer,timestamptz)','5aba833e05ecc71fa7daa4f579a6e982eddf8e67bd5306d9ef383c8a73d73b16'),
    ('official_v3_jobs_private.tx_queue_confirm_v1(jsonb,jsonb,integer,integer,timestamptz)','cc90f242fec962daa71edcf534c5f24eb72541571aadc42ff1d3704efe2ffc75'),
    ('official_v3_jobs_private.tx_execution_read_v1(jsonb,jsonb,integer,integer,timestamptz)','f098888a682adb92c46b4a7cf1b61d6c0b68030b896f40c5b807da001d84468a'),
    ('official_v3_jobs_private.tx_execution_start_v1(jsonb,jsonb,integer,integer,timestamptz)','096225b7014b0c9789d93164ecf82c9122e9a2f8d5df93987fbe54425ace2641'),
    ('official_v3_jobs_private.tx_execution_prepare_v1(jsonb,jsonb,integer,integer,timestamptz)','4fd077e6222bf925ec8d55b7e8cd53aa7703cf279583a9aaa810daca30255160'),
    ('official_v3_jobs_private.tx_queue_cas_v1(jsonb,jsonb,integer,integer,timestamptz)','4f7d372c1b9f4c9d5e9b28f0b03107746329ab219ae94615caf158cc16955008'),
    ('official_v3_jobs_api.execute_v1(text,text,integer,text,text,integer,integer,text)','ebf97604360e16d31bff8b34e7fb6380a643d207198e9b0af2ea95821650ece5'),
    ('official_v3_guard_private.immutable_v1()','912ce0a3cee4ab57ee76be8425053f5f42963db5a2943a76f0d49d70059f963b'),
    ('official_v3_guard_private.require_open_v1()','afaf6b3970c6b6a796e2b32ee6ddaa4c428d62661ad5e78233de5d6649a936ca'),
    ('official_v3_guard_private.check_control_v1()','8a37a92bd1293a467665da5831d717e7675650af9a2f5ef60e1cf57899a99eb4'),
    ('official_v3_guard_private.hrs_catalog_v1()','90983802fa25e02731f0595a21deb0a54e6712f470b765be176d3b27ab7b835d'),
    ('official_v3_guard_private.open_until_v1()','38a690b6246405e05f46cccca99753b4031d9efc78069c53afe83ae2cfab5aaf'),
    ('official_v3_guard_private.jobs_catalog_v1()','389b3202c4d2af2d3d8392f594b2b88663f94b91cae9527017e53825a72b5fe5'),
    ('official_v3_guard_private.intake_retired_v1(text)','f98b43fec4e73e5d0f17eb9841f184c8f620443ad8adb7068a2a50c64ceecf22'),
    ('official_v3_guard_private.attempt_retired_v1(text)','299ff555963f73247651989e1d9a4bf8bea78ed1f47f5dba1903957c1f0ec31c'),
    ('official_v3_guard_private.alarm_status_v1()','c0d610e700e6dd48b058256ef30bcee551f39a045e70e26429baaa7c3bc0f65b'),
    ('official_v3_guard_private.catalog_v1()','28a3e90b0e6be9db58d5910530437b4a76bd5950663d37a1cbcf8ced8545b1db'),
    ('official_v3_guard_private.assert_catalog_v1()','82a5bbfd8a0ba53659ed5e5a3c756b8a8d74bb53008b47a24c391a8353de9d93'),
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
    ('official_v3_guard_private.recovery_jobs_v1()','bda8b372958b984136225c896f5416a18a778d7f265416f993a84a129d544e95'),
    ('official_v3_guard_private.recovery_intake_v1(jsonb)','3f5b06793ede7510c6ef9d8c2289d2700eb29ba36b6c17fb7014725a06ab7628'),
    ('official_v3_guard_private.recovery_hrs_v1()','f2e2304b42313784e39b6ec032aaa44feaace0402250af4c64e64a11318b9644'),
    ('official_v3_guard_private.recovery_snapshot_v1()','ac8fa99fbb775db57d2bf9386e6754c10583dc819453c9aacf0123e662cd1ea7'),
    ('official_v3_guard_private.retired_state_v1(text)','9e1c2283438d7125d1fe2eca59c13f02ddc1d45474107745c9aacbfb1bf903c7'),
    ('official_v3_guard_private.close_jobs_v1(text)','68c8c79279de8a002dd81f3e07c6b9405567c250ce638a3a492c768eba54fbf2'),
    ('official_v3_guard_private.check_retired_jobs_v1(jsonb)','b80bf16d123e66cbb328650efc6b02ce8a6b1028e24a37c6ff1ead318f4288f0'),
    ('official_v3_guard_private.check_retired_s1_v1(jsonb)','8253e8ac077ddc59b962530bec8b731fc760eca26b2696b632f16238a46a3d74'),
    ('official_v3_guard_private.check_retired_hrs_v1(jsonb)','08eae5f6050a4d31ce32a49568a31df5b70169ac0a60e3b9c06a86508fb47ab7'),
    ('official_v3_guard_private.check_retirements_v1()','33989c6c00312d7a1fb8c8ea528a2d8804d798e3083df784166ab1c67cdfe2e9'),
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
    ('official_v3_result_private.consume_s1_v1(jsonb,jsonb,jsonb)','d0738e696a066ffddfa725d27b1e3c8f81b4c73a5cb981a5e07460bc6db42ecd'),
    ('official_v3_result_private.assert_catalog_v1()','dac7c17f36163e0c0d6c068977e85fc35975a4621e67dceda234ca639fa945ed'),
    ('official_v3_result_private.command_v1(jsonb,jsonb)','365b04e28ffb7c6f6502f3af77f5afb7abf4d443d4a443c1f04f27128a1996c6'),
    ('official_v3_result_private.dispatch_v1(text,jsonb,text,text,integer,text,text,integer,integer,text,text)','eccdbd371a0b10f103f2d56902b21d94685e1413c3831e98a33859e8d97bab3f'),
    ('official_v3_guard_private.catalog_status_v1()','c23417ecf2a50291c347579546316c53ab4b1618b17c92a211022d63d41c6beb'),
    ('public.official_v3_guard_alarm_status_v1()','bd3565ce584422120f200ac4f6c657852f6113c0e6c734218bb4da2634774ce0'),
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
  IF before_catalog IS DISTINCT FROM (SELECT catalog FROM official_v3_guard_private.gap_recovery_baseline_v1 WHERE singleton) THEN
    RAISE EXCEPTION 'bg1 recovery predecessor catalog mismatch' USING ERRCODE='P7905'; END IF;
  PERFORM official_v3_guard_private.assert_catalog_v1();
  PERFORM official_v3_guard_private.check_control_v1();
  PERFORM official_v3_guard_private.check_hma_v1();
  PERFORM official_v3_guard_private.check_s1_v1();
  PERFORM official_v3_guard_private.check_jobs_v1();
  PERFORM official_v3_guard_private.check_hrs_v1();
  PERFORM official_v3_guard_private.check_certificates_v1();
  PERFORM official_v3_guard_private.check_retirements_v1();
  INSERT INTO pg_temp.rolling_before VALUES('catalog',before_catalog),
    ('memberships',COALESCE((SELECT jsonb_agg(to_jsonb(m) ORDER BY m.oid) FROM pg_auth_members m),'[]'::jsonb)),
    ('schema_acl',(SELECT jsonb_build_object('owner',nspowner,'acl',nspacl) FROM pg_namespace WHERE nspname='official_v3_guard_private')),
    ('content',jsonb_build_object('hma',official_v3_guard_private.content_digest_v1('hma'),
      's1',official_v3_guard_private.content_digest_v1('s1'),'jobs',official_v3_guard_private.content_digest_v1('jobs'),
      'hrs',official_v3_guard_private.hrs_certificate_v1()));
  -- The installed, independently checked catalog binds the actual bootstrap
  -- grantor and original OIDs. Never edit or delete those ADMIN-only rows.
  FOREACH owner_name IN ARRAY ARRAY['ot_v3_jobs_owner'] LOOP
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
    'official_v3_guard_private.recovery_baseline_v1','official_v3_guard_private.retired_later_attempts_v1','official_v3_guard_private.gap_recovery_baseline_v1'
  ] LOOP
    EXECUTE format('SELECT count(*),encode(sha256(convert_to(COALESCE(string_agg(encode(sha256(convert_to(to_jsonb(r)::text,''UTF8'')),''hex''),'''' ORDER BY to_jsonb(r)::text COLLATE "C"),''''),''UTF8'')),''hex'') FROM %s r',table_name::regclass)
      INTO row_count,row_digest;
    INSERT INTO pg_temp.rolling_before VALUES('table:'||table_name,jsonb_build_object('count',row_count,'digest',row_digest));
  END LOOP;
END $recovery_predecessor$;



-- Compare deparsed predicates against an independently created exact v1 model.
-- Constraint names/OIDs are retained in the transaction's private witness.
CREATE TEMP TABLE rolling_old_checks(id oid PRIMARY KEY,name text NOT NULL,kind text NOT NULL) ON COMMIT DROP;
CREATE TEMP TABLE rolling_v1_check_model(
 operation_count integer CHECK(operation_count BETWEEN 0 AND 256),
 start_count integer CHECK(start_count BETWEEN 0 AND 64),
 terminal_credit_claim text,
 CHECK(operation_count+CASE WHEN terminal_credit_claim IS NULL THEN 0 ELSE 1 END<=256)
) ON COMMIT DROP;
DO $old_checks$
DECLARE expected record; actual record;
BEGIN
 IF (SELECT count(*) FROM official_v3_jobs_private.subjects_v1
     WHERE job_key='research-job:v3:74713fe665cab1a7603f6e93ab06b6a1d1964e83a69571b8cced0ff009032513' AND kind='rule_research')<>1 THEN
   RAISE EXCEPTION 'rolling quota requires exact existing CH DE subject' USING ERRCODE='P7911'; END IF;
 FOR expected IN SELECT pg_get_constraintdef(c.oid) AS definition,
     CASE WHEN cardinality(c.conkey)=2 THEN 'credit' WHEN c.conkey=ARRAY[1]::smallint[] THEN 'operations' ELSE 'starts' END AS kind
   FROM pg_constraint c WHERE c.conrelid='pg_temp.rolling_v1_check_model'::regclass AND c.contype='c' LOOP
   SELECT c.oid,c.conname INTO STRICT actual FROM pg_constraint c
    WHERE c.conrelid='official_v3_jobs_private.subjects_v1'::regclass AND c.contype='c'
      AND c.convalidated AND NOT c.condeferrable AND NOT c.condeferred AND c.conislocal AND c.coninhcount=0
      AND pg_get_constraintdef(c.oid)=expected.definition;
   INSERT INTO pg_temp.rolling_old_checks VALUES(actual.oid,actual.conname,expected.kind);
 END LOOP;
 IF (SELECT count(*) FROM pg_temp.rolling_old_checks)<>3 THEN
   RAISE EXCEPTION 'rolling quota exact three original checks required' USING ERRCODE='P7911'; END IF;
END $old_checks$;


GRANT ot_v3_jobs_owner TO postgres WITH ADMIN FALSE, INHERIT FALSE, SET TRUE GRANTED BY postgres;

-- Only the selected, already existing CH→DE subject receives the new model.
-- Other subjects retain their v1 lifetime quota. No history row is rewritten.
SET LOCAL ROLE ot_v3_jobs_owner;
CREATE TABLE official_v3_jobs_private.rolling_policy_v2 (
  job_key text PRIMARY KEY CHECK(job_key='research-job:v3:74713fe665cab1a7603f6e93ab06b6a1d1964e83a69571b8cced0ff009032513'),
  method_binding jsonb NOT NULL,
  window_seconds integer NOT NULL CHECK(window_seconds=86400),
  start_limit integer NOT NULL CHECK(start_limit=64),
  operation_limit integer NOT NULL CHECK(operation_limit=256),
  anchor_starts integer NOT NULL CHECK(anchor_starts BETWEEN 0 AND 64),
  anchor_operations integer NOT NULL CHECK(anchor_operations BETWEEN 0 AND 256),
  installed_at timestamptz NOT NULL CHECK(isfinite(installed_at))
);
ALTER TABLE official_v3_jobs_private.rolling_policy_v2 ENABLE ROW LEVEL SECURITY;
ALTER TABLE official_v3_jobs_private.rolling_policy_v2 FORCE ROW LEVEL SECURITY;
CREATE POLICY owner_v2 ON official_v3_jobs_private.rolling_policy_v2 TO ot_v3_jobs_owner USING(true) WITH CHECK(true);
CREATE POLICY readback_v2 ON official_v3_jobs_private.rolling_policy_v2 FOR SELECT TO postgres USING(true);
CREATE TRIGGER guard_row_v2 BEFORE UPDATE OR DELETE ON official_v3_jobs_private.rolling_policy_v2
  FOR EACH ROW EXECUTE FUNCTION official_v3_jobs_private.immutable_v1();
CREATE TRIGGER guard_truncate_v2 BEFORE TRUNCATE ON official_v3_jobs_private.rolling_policy_v2
  FOR EACH STATEMENT EXECUTE FUNCTION official_v3_jobs_private.immutable_v1();
REVOKE ALL ON official_v3_jobs_private.rolling_policy_v2 FROM PUBLIC,anon,authenticated,service_role,supabase_read_only_user;
GRANT SELECT ON official_v3_jobs_private.rolling_policy_v2 TO postgres;
INSERT INTO official_v3_jobs_private.rolling_policy_v2
 SELECT job_key,method_binding,86400,64,256,start_count,operation_count,clock_timestamp()
 FROM official_v3_jobs_private.subjects_v1
 WHERE job_key='research-job:v3:74713fe665cab1a7603f6e93ab06b6a1d1964e83a69571b8cced0ff009032513'
   AND kind='rule_research';

-- Same immutable rows; the new indexes bound admission scans to the window.
CREATE INDEX queue_operations_subject_time_v2
 ON official_v3_jobs_private.queue_operations_v1(job_key,recorded_at,operation_id);
CREATE INDEX execution_starts_subject_time_v2
 ON official_v3_jobs_private.execution_starts_v1(job_key,reserved_at,attempt_key);

CREATE FUNCTION official_v3_jobs_private.rolling_usage_v2(k text) RETURNS jsonb
LANGUAGE plpgsql VOLATILE PARALLEL UNSAFE SECURITY INVOKER CALLED ON NULL INPUT
SET search_path=pg_catalog,pg_temp AS $quota$
DECLARE s official_v3_jobs_private.subjects_v1%ROWTYPE;
 p official_v3_jobs_private.rolling_policy_v2%ROWTYPE;
 instant timestamptz:=clock_timestamp(); cutoff timestamptz;
 starts integer; operations integer; credit integer; newest timestamptz;
 next_start timestamptz; next_operation timestamptz;
BEGIN
 SELECT * INTO s FROM official_v3_jobs_private.subjects_v1 WHERE job_key=k;
 SELECT * INTO p FROM official_v3_jobs_private.rolling_policy_v2 WHERE job_key=k;
 credit:=CASE WHEN s.terminal_credit_claim IS NULL THEN 0 ELSE 1 END;
 IF NOT FOUND THEN
   RETURN jsonb_build_object('model','lifetime_v1','starts',COALESCE(s.start_count,0),
     'operations',COALESCE(s.operation_count,0),'credit',credit,'clock_ok',true,
     'remaining_starts',greatest(0,64-COALESCE(s.start_count,0)),
     'remaining_operations',greatest(0,256-COALESCE(s.operation_count,0)-credit));
 END IF;
 IF s.job_key IS NULL OR s.kind<>'rule_research' OR s.method_binding IS DISTINCT FROM p.method_binding
   OR p.window_seconds<>86400 OR p.start_limit<>64 OR p.operation_limit<>256
   OR s.start_count<p.anchor_starts OR s.operation_count<p.anchor_operations THEN
   RAISE EXCEPTION 'rolling quota binding mismatch' USING ERRCODE='P7911';
 END IF;
 cutoff:=instant-interval '24 hours';
 -- There is intentionally no upper time predicate: future records remain
 -- charged. A backward clock refuses fresh effects rather than refilling quota.
 SELECT count(*)::integer,min(reserved_at)+interval '24 hours' INTO starts,next_start
  FROM official_v3_jobs_private.execution_starts_v1 WHERE job_key=k AND reserved_at>=cutoff;
 SELECT count(*)::integer,min(recorded_at)+interval '24 hours' INTO operations,next_operation
  FROM official_v3_jobs_private.queue_operations_v1 WHERE job_key=k AND recorded_at>=cutoff;
 SELECT greatest(
   (SELECT reserved_at FROM official_v3_jobs_private.execution_starts_v1 WHERE job_key=k ORDER BY reserved_at DESC LIMIT 1),
   (SELECT recorded_at FROM official_v3_jobs_private.queue_operations_v1 WHERE job_key=k ORDER BY recorded_at DESC LIMIT 1),p.installed_at)
  INTO newest;
 RETURN jsonb_build_object('model','rolling_24h_v2','observed_at',instant,'window_start',cutoff,
   'starts',starts,'operations',operations,'credit',credit,'clock_ok',newest<=instant,
   'remaining_starts',greatest(0,64-starts),'remaining_operations',greatest(0,256-operations-credit),
   'next_start_capacity_at',CASE WHEN starts>=64 THEN next_start+interval '1 microsecond' END,
   'next_operation_capacity_at',CASE WHEN operations+credit>=256 THEN next_operation+interval '1 microsecond' END,
   'lifetime_starts',s.start_count,'lifetime_operations',s.operation_count);
END $quota$;
REVOKE ALL ON FUNCTION official_v3_jobs_private.rolling_usage_v2(text)
 FROM PUBLIC,anon,authenticated,service_role,supabase_read_only_user;
GRANT EXECUTE ON FUNCTION official_v3_jobs_private.rolling_usage_v2(text) TO postgres;
RESET ROLE;

-- This is an immutable successor, never an UPDATE to an installed baseline.
CREATE TABLE official_v3_guard_private.rolling_quota_baseline_v1 (
 singleton boolean PRIMARY KEY DEFAULT true CHECK(singleton),
 predecessor_provider_digest text NOT NULL CHECK(predecessor_provider_digest='96f86b8d5432508a3172ea483c8804cf405027f1bb565422df683615f061f5d7'),
 predecessor_catalog_digest text NOT NULL CHECK(predecessor_catalog_digest ~ '^[a-f0-9]{64}$'),
 predecessor_gap_digest text NOT NULL CHECK(predecessor_gap_digest ~ '^[a-f0-9]{64}$'),
 required_generation bigint NOT NULL CHECK(required_generation>0),
 proof_not_before timestamptz NOT NULL CHECK(isfinite(proof_not_before)),
 policy jsonb NOT NULL,
 jobs_catalog jsonb NOT NULL,
 hrs_catalog jsonb NOT NULL,
 catalog jsonb NOT NULL
);
ALTER TABLE official_v3_guard_private.rolling_quota_baseline_v1 ENABLE ROW LEVEL SECURITY;
ALTER TABLE official_v3_guard_private.rolling_quota_baseline_v1 FORCE ROW LEVEL SECURITY;
CREATE POLICY owner_only ON official_v3_guard_private.rolling_quota_baseline_v1 TO postgres USING(true) WITH CHECK(true);
CREATE TRIGGER immutable_v1 BEFORE UPDATE OR DELETE ON official_v3_guard_private.rolling_quota_baseline_v1
 FOR EACH ROW EXECUTE FUNCTION official_v3_guard_private.immutable_v1();
CREATE TRIGGER immutable_truncate_v1 BEFORE TRUNCATE ON official_v3_guard_private.rolling_quota_baseline_v1
 FOR EACH STATEMENT EXECUTE FUNCTION official_v3_guard_private.immutable_v1();
REVOKE ALL ON official_v3_guard_private.rolling_quota_baseline_v1
 FROM PUBLIC,anon,authenticated,service_role,supabase_read_only_user,ot_v3_jobs_owner,ot_v3_result_owner,ot_v3_intake_owner;

CREATE FUNCTION official_v3_guard_private.ch_de_quota_v2() RETURNS jsonb
LANGUAGE plpgsql VOLATILE PARALLEL UNSAFE SECURITY DEFINER CALLED ON NULL INPUT
SET search_path=pg_catalog AS $readback$
DECLARE result jsonb;
BEGIN
 PERFORM official_v3_guard_private.require_open_v1();
 result:=official_v3_jobs_private.rolling_usage_v2('research-job:v3:74713fe665cab1a7603f6e93ab06b6a1d1964e83a69571b8cced0ff009032513');
 IF result->>'model'<>'rolling_24h_v2' THEN RAISE EXCEPTION 'rolling quota not installed' USING ERRCODE='P7911'; END IF;
 RETURN result;
END $readback$;
REVOKE ALL ON FUNCTION official_v3_guard_private.ch_de_quota_v2()
 FROM PUBLIC,anon,authenticated,service_role,supabase_read_only_user,ot_v3_jobs_owner,ot_v3_result_owner,ot_v3_intake_owner;


SET LOCAL ROLE ot_v3_jobs_owner;
CREATE OR REPLACE FUNCTION official_v3_jobs_private.assert_history_v1(k text) RETURNS void
LANGUAGE plpgsql VOLATILE PARALLEL UNSAFE SECURITY INVOKER CALLED ON NULL INPUT SET search_path=pg_catalog,pg_temp  AS $rolling_body$
DECLARE s official_v3_jobs_private.subjects_v1%ROWTYPE; x record; c jsonb; e jsonb; unresolved text[]; ops integer; starts integer; credit jsonb; envelope_canonical text COLLATE "default";
  validated_jobs jsonb:='{}'::jsonb; validated_job_count integer:=0; validated_job_bytes integer:=0; job_text text COLLATE "C"; job_bytes integer;
  memo_subject_kind text COLLATE "C"; memo_subject_text text COLLATE "C"; memo_subject_result jsonb; command_identity jsonb; quota jsonb;
  canonical_memo_key_one text COLLATE "C"; canonical_memo_key_two text COLLATE "C";
  canonical_memo_value_one text; canonical_memo_value_two text;
  canonical_memo_bytes_one integer:=0; canonical_memo_bytes_two integer:=0;
BEGIN
  SELECT * INTO s FROM official_v3_jobs_private.subjects_v1 WHERE job_key=k;
  IF NOT FOUND THEN RETURN; END IF;
  SELECT count(*) INTO ops FROM official_v3_jobs_private.queue_operations_v1 WHERE job_key=k;
  SELECT count(*),array_agg(t.attempt_key ORDER BY t.attempt_key) FILTER(WHERE d.attempt_key IS NULL AND NOT official_v3_guard_private.attempt_retired_v1(t.attempt_key)) INTO starts,unresolved
    FROM official_v3_jobs_private.execution_starts_v1 t LEFT JOIN official_v3_jobs_private.execution_dispositions_v1 d USING(attempt_key) WHERE t.job_key=k;
  quota:=official_v3_jobs_private.rolling_usage_v2(k);
  IF ops<>s.operation_count OR starts<>s.start_count
    OR (quota->>'operations')::integer+(quota->>'credit')::integer>256 OR (quota->>'starts')::integer>64 OR cardinality(unresolved)>1
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
    -- Reuse only bytes computed at the same canonical depth in this invocation.
    -- Two exact-text entries share a 64KiB key+value cap. No validation is skipped.
    DECLARE member_name text; child_value jsonb; child_key text COLLATE "C";
      child_canonical text; child_bytes bigint; canonical_parts text[]:='{}';
    BEGIN
      IF official_v3_jobs_private.exact_keys_v1(e,
        ARRAY['audit','commandKey','expected','jobKey','next','notAfter','operationId']) IS TRUE THEN
        -- This is the original canonical object's exact ASCII member order.
        FOREACH member_name IN ARRAY ARRAY['audit','commandKey','expected','jobKey','next','notAfter','operationId'] LOOP
          child_value:=e->member_name;
          IF member_name IN ('expected','next') THEN
            child_key:=child_value::text;
            IF child_key COLLATE "C" = canonical_memo_key_one COLLATE "C" THEN
              child_canonical:=canonical_memo_value_one;
            ELSIF child_key COLLATE "C" = canonical_memo_key_two COLLATE "C" THEN
              child_canonical:=canonical_memo_value_two;
            ELSE
              child_canonical:=official_v3_jobs_private.canonical_v1(child_value,1);
              child_bytes:=octet_length(child_key)::bigint+octet_length(child_canonical)::bigint;
              IF child_bytes<=65536 THEN
                IF child_bytes+canonical_memo_bytes_two<=65536 THEN
                  canonical_memo_key_one:=canonical_memo_key_two;
                  canonical_memo_value_one:=canonical_memo_value_two;
                  canonical_memo_bytes_one:=canonical_memo_bytes_two;
                ELSE
                  canonical_memo_key_one:=NULL; canonical_memo_value_one:=NULL; canonical_memo_bytes_one:=0;
                END IF;
                canonical_memo_key_two:=child_key; canonical_memo_value_two:=child_canonical;
                canonical_memo_bytes_two:=child_bytes::integer;
              END IF;
            END IF;
          ELSE
            child_canonical:=official_v3_jobs_private.canonical_v1(child_value,1);
          END IF;
          canonical_parts:=array_append(canonical_parts,'"'||member_name||'":'||child_canonical);
        END LOOP;
        envelope_canonical:='{'||array_to_string(canonical_parts,',')||'}';
      ELSE
        envelope_canonical:=official_v3_jobs_private.canonical_v1(e,0);
      END IF;
    END;
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
END $rolling_body$;
RESET ROLE;

SET LOCAL ROLE ot_v3_jobs_owner;
CREATE OR REPLACE FUNCTION official_v3_jobs_private.tx_execution_start_v1(q jsonb,b jsonb,e integer,remaining integer,deadline timestamptz) RETURNS jsonb
LANGUAGE plpgsql VOLATILE PARALLEL UNSAFE SECURITY INVOKER CALLED ON NULL INPUT SET search_path=pg_catalog,pg_temp AS $rolling_body$
DECLARE i jsonb:=q->'body'; claim jsonb:=i->'claim'; job jsonb:=official_v3_jobs_private.job_v1(i->'leasedJob');
  s official_v3_jobs_private.subjects_v1%ROWTYPE; o official_v3_jobs_private.queue_operations_v1%ROWTYPE; a jsonb:=b||jsonb_build_object('epoch',e);
  attempt text; token text; quota jsonb;
BEGIN
  SELECT * INTO s FROM official_v3_jobs_private.subjects_v1 WHERE job_key=claim->>'jobKey';
  IF NOT FOUND OR s.open_attempt IS NOT NULL OR s.current_job IS DISTINCT FROM job OR s.subject_text IS DISTINCT FROM i->>'subjectText'
    OR job->>'state'<>'leased' OR s.terminal_credit_claim IS DISTINCT FROM claim->>'operationId' THEN
    RETURN jsonb_build_object('reply',jsonb_build_object('status','blocked'),'authority',false); END IF;
  SELECT * INTO o FROM official_v3_jobs_private.queue_operations_v1 WHERE operation_id=claim->>'operationId';
  IF NOT FOUND OR o.job_key IS DISTINCT FROM s.job_key OR o.action<>'claim' OR o.command_text::jsonb->'input' IS DISTINCT FROM claim
    OR o.envelope_text::jsonb->'next' IS DISTINCT FROM job OR EXISTS(SELECT 1 FROM official_v3_jobs_private.execution_starts_v1 WHERE claim_operation_id=o.operation_id) THEN
    RETURN jsonb_build_object('reply',jsonb_build_object('status','blocked'),'authority',false); END IF;
  quota:=official_v3_jobs_private.rolling_usage_v2(s.job_key);
  IF (quota->>'clock_ok')::boolean IS NOT TRUE OR (quota->>'starts')::integer>=64
    OR (quota->>'operations')::integer+1>256 THEN
    RETURN jsonb_build_object('reply',jsonb_build_object('status','quota'),'authority',false); END IF;
  attempt:='execution-attempt:v3:'||encode(sha256(convert_to(official_v3_jobs_private.canonical_v1(jsonb_build_object(
    'subject',s.subject_text::jsonb,'claim',claim,'leasedJob',job,'authority',a),0),'UTF8')),'hex');
  token:=replace(gen_random_uuid()::text,'-','')||replace(gen_random_uuid()::text,'-','');
  INSERT INTO official_v3_jobs_private.execution_starts_v1(attempt_key,job_key,claim_operation_id,claim_text,leased_job,authority,token_hash,reserved_at)
    VALUES(attempt,s.job_key,o.operation_id,official_v3_jobs_private.canonical_v1(claim,0),job,a,encode(sha256(convert_to(token,'UTF8')),'hex'),clock_timestamp());
  UPDATE official_v3_jobs_private.subjects_v1 SET start_count=start_count+1,open_attempt=attempt WHERE job_key=s.job_key;
  RETURN jsonb_build_object('reply',jsonb_build_object('status','reserved','attemptKey',attempt,'token',token,'claim',claim,'leasedJob',job),
    'authority',true,'lease',job#>>'{lease,expiresAt}');
END $rolling_body$;
RESET ROLE;

SET LOCAL ROLE ot_v3_jobs_owner;
CREATE OR REPLACE FUNCTION official_v3_jobs_private.tx_queue_cas_v1(q jsonb,b jsonb,e integer,remaining integer,deadline timestamptz) RETURNS jsonb
LANGUAGE plpgsql VOLATILE PARALLEL UNSAFE SECURITY INVOKER CALLED ON NULL INPUT SET search_path=pg_catalog,pg_temp AS $rolling_body$
DECLARE i jsonb:=q->'body'; c jsonb:=official_v3_jobs_private.command_v1(i->'command'); v jsonb:=i->'commit'; disposition jsonb:=i->'disposition';
  s official_v3_jobs_private.subjects_v1%ROWTYPE; old official_v3_jobs_private.queue_operations_v1%ROWTYPE; t official_v3_jobs_private.execution_starts_v1%ROWTYPE;
  r official_v3_jobs_private.execution_results_v1%ROWTYPE; identity jsonb; current_record jsonb; next_record jsonb; new_credit text; slot_choice integer; cycle text;
  a jsonb:=b||jsonb_build_object('epoch',e); terminal boolean:=false; quota jsonb;
BEGIN
  SELECT * INTO old FROM official_v3_jobs_private.queue_operations_v1 WHERE operation_id=c->>'operationId';
  IF FOUND THEN
    IF old.command_text IS DISTINCT FROM c->>'commandText' OR old.command_key IS DISTINCT FROM c->>'commandKey'
      OR old.envelope_text IS DISTINCT FROM official_v3_jobs_private.canonical_v1(v,0) THEN
      RETURN jsonb_build_object('reply',jsonb_build_object('status','collision'),'authority',false); END IF;
    RETURN jsonb_build_object('reply',jsonb_build_object('status','committed','record',old.envelope_text::jsonb->'next'),'authority',true);
  END IF;
  SELECT * INTO s FROM official_v3_jobs_private.subjects_v1 WHERE job_key=c->>'jobKey';
  current_record:=COALESCE(s.current_job,'null'::jsonb);
  IF v->'expected' IS DISTINCT FROM current_record THEN RETURN jsonb_build_object('reply',jsonb_build_object('status','mismatch'),'authority',false); END IF;
  PERFORM official_v3_jobs_private.transition_v1(c->'value',current_record,v);
  next_record:=v->'next';
  identity:=CASE WHEN next_record->>'kind'='research_job_record' THEN official_v3_jobs_private.subject_v1('rule_research',jsonb_build_object(
    'context',next_record->'context','method',next_record->'method','factKind',next_record#>'{research,factKind}','researchReason',next_record#>'{research,researchReason}'))
    ELSE official_v3_jobs_private.subject_v1('combination_discovery',(next_record->'identity')-'kind'-'jobKey') END;
  IF identity->>'jobKey' IS DISTINCT FROM c->>'jobKey' OR identity->>'subjectText' IS DISTINCT FROM i->>'subjectText'
    OR COALESCE(next_record->'method',next_record#>'{identity,method}') IS DISTINCT FROM (b-'methodDigest'-'packageDigest')
    OR (s.job_key IS NOT NULL AND (s.subject_text IS DISTINCT FROM i->>'subjectText' OR s.method_binding IS DISTINCT FROM b)) THEN
    RAISE EXCEPTION 'm04 full subject mismatch' USING ERRCODE='P7601'; END IF;
  IF c->>'action'='enqueue' AND v#>>'{audit,kind}'='enqueued' THEN
    cycle:=next_record->>'jobId';
    IF EXISTS(SELECT 1 FROM official_v3_jobs_private.queue_operations_v1 WHERE new_cycle_job_id=cycle) THEN
      RETURN jsonb_build_object('reply',jsonb_build_object('status','collision'),'authority',false); END IF;
  END IF;
  IF disposition->>'kind'<>'regular' THEN
    SELECT * INTO t FROM official_v3_jobs_private.execution_starts_v1 WHERE attempt_key=disposition->>'attemptKey';
    IF NOT FOUND OR s.open_attempt IS DISTINCT FROM t.attempt_key OR t.job_key IS DISTINCT FROM s.job_key
      OR current_record IS DISTINCT FROM t.leased_job OR t.authority IS DISTINCT FROM a
      OR EXISTS(SELECT 1 FROM official_v3_jobs_private.execution_dispositions_v1 WHERE attempt_key=t.attempt_key) THEN
      RETURN jsonb_build_object('reply',jsonb_build_object('status','blocked'),'authority',false); END IF;
    SELECT * INTO r FROM official_v3_jobs_private.execution_results_v1 WHERE attempt_key=t.attempt_key;
    IF disposition->>'kind'='completed' THEN
      IF c->>'action'<>'complete' OR r.attempt_key IS NULL OR COALESCE(c#>'{value,input,decisionRef}',c#>'{value,input,discoveryRef}')
        IS DISTINCT FROM COALESCE(r.result->'decisionRef',r.result->'discoveryRef') THEN
        RETURN jsonb_build_object('reply',jsonb_build_object('status','blocked'),'authority',false); END IF;
    ELSE
      -- SQL proves its immutable reservation secret and absence of PREPARED. It cannot
      -- observe producer termination. Only the reviewed private composition may call
      -- this fixed runtime role after actual delivery/callback/native terminal custody.
      IF c->>'action'<>'fail' OR c#>>'{value,input,reason}' NOT IN ('unreachable','invalid_proposal','verification_unavailable')
        OR r.attempt_key IS NOT NULL OR t.token_hash IS DISTINCT FROM encode(sha256(convert_to(disposition->>'token','UTF8')),'hex') THEN
        RETURN jsonb_build_object('reply',jsonb_build_object('status','blocked'),'authority',false); END IF;
    END IF;
    terminal:=true;
  ELSIF s.open_attempt IS NOT NULL OR c->>'action'='complete' THEN
    RETURN jsonb_build_object('reply',jsonb_build_object('status','blocked'),'authority',false);
  END IF;
  new_credit:=CASE WHEN next_record->>'state'='leased' THEN
    CASE WHEN c->>'action'='claim' THEN c->>'operationId' ELSE s.terminal_credit_claim END ELSE NULL END;
  quota:=official_v3_jobs_private.rolling_usage_v2(c->>'jobKey');
  IF (quota->>'clock_ok')::boolean IS NOT TRUE
    OR (quota->>'operations')::integer+1+(CASE WHEN new_credit IS NULL THEN 0 ELSE 1 END)>256
    OR (c->>'action'='claim' AND next_record->>'state'='leased' AND (quota->>'starts')::integer>=64) THEN
    RETURN jsonb_build_object('reply',jsonb_build_object('status','quota'),'authority',false); END IF;
  IF s.job_key IS NULL THEN
    IF c->>'action'<>'enqueue' THEN RAISE EXCEPTION 'm04 missing subject' USING ERRCODE='P7601'; END IF;
    SELECT slot_id INTO slot_choice FROM official_v3_jobs_private.slots_v1 WHERE job_key IS NULL ORDER BY slot_id FOR UPDATE SKIP LOCKED LIMIT 1;
    IF slot_choice IS NULL THEN RETURN jsonb_build_object('reply',jsonb_build_object('status','quota'),'authority',false); END IF;
    UPDATE official_v3_jobs_private.slots_v1 SET job_key=c->>'jobKey' WHERE slot_id=slot_choice;
    INSERT INTO official_v3_jobs_private.subjects_v1(job_key,slot_id,kind,subject_text,method_binding,current_job,operation_count,start_count)
      VALUES(c->>'jobKey',slot_choice,c->>'kind',i->>'subjectText',b,next_record,0,0);
  END IF;
  INSERT INTO official_v3_jobs_private.queue_operations_v1(operation_id,job_key,action,command_key,command_text,envelope_text,audit_reference,new_cycle_job_id,authority,recorded_at)
    VALUES(c->>'operationId',c->>'jobKey',c->>'action',c->>'commandKey',c->>'commandText',official_v3_jobs_private.canonical_v1(v,0),v#>>'{audit,reference}',cycle,a,clock_timestamp());
  IF terminal THEN
    INSERT INTO official_v3_jobs_private.execution_dispositions_v1(attempt_key,queue_operation_id,kind,failure_reason,settled_at)
      VALUES(t.attempt_key,c->>'operationId',disposition->>'kind',CASE WHEN disposition->>'kind'='settled_failure' THEN c#>>'{value,input,reason}' END,clock_timestamp());
  END IF;
  UPDATE official_v3_jobs_private.subjects_v1 SET current_job=next_record,operation_count=operation_count+1,
    open_attempt=CASE WHEN terminal THEN NULL ELSE open_attempt END,terminal_credit_claim=new_credit WHERE job_key=c->>'jobKey';
  RETURN jsonb_build_object('reply',jsonb_build_object('status','committed','record',next_record),'authority',true,
    'references',r."references",'job',t.leased_job,'result',r.result,
    'lease',CASE WHEN c->>'action' IN ('complete','fail') THEN current_record#>>'{lease,expiresAt}'
      WHEN c->>'action'='claim' AND next_record->>'state'='leased' THEN next_record#>>'{lease,expiresAt}' END,
    'observedAt',v#>>'{audit,observedAt}',
    'dueAt',CASE WHEN c->>'action'='claim' THEN CASE current_record->>'state' WHEN 'backoff' THEN current_record->>'nextAttemptAt' WHEN 'leased' THEN current_record#>>'{lease,expiresAt}' END END);
END $rolling_body$;
RESET ROLE;

CREATE OR REPLACE FUNCTION official_v3_guard_private.jobs_catalog_v1() RETURNS TABLE(object_identity text,fingerprint jsonb)
LANGUAGE sql STABLE SECURITY DEFINER SET search_path=pg_catalog AS $rolling_body$
SELECT key,value FROM official_v3_guard_private.rolling_quota_baseline_v1 b,
LATERAL jsonb_each(b.jobs_catalog) WHERE b.singleton
$rolling_body$;

CREATE OR REPLACE FUNCTION official_v3_guard_private.hrs_catalog_v1() RETURNS jsonb
LANGUAGE sql STABLE SECURITY DEFINER SET search_path=pg_catalog AS $rolling_body$
SELECT hrs_catalog FROM official_v3_guard_private.rolling_quota_baseline_v1 WHERE singleton
$rolling_body$;

CREATE OR REPLACE FUNCTION official_v3_guard_private.assert_catalog_v1() RETURNS void
LANGUAGE plpgsql VOLATILE SECURITY DEFINER SET search_path=pg_catalog AS $rolling_body$
DECLARE successor official_v3_guard_private.recovery_baseline_v1%ROWTYPE;
  predecessor official_v3_guard_private.status_baseline_v1%ROWTYPE; old_baselines jsonb;
  gap_baseline official_v3_guard_private.gap_recovery_baseline_v1%ROWTYPE;
  rolling official_v3_guard_private.rolling_quota_baseline_v1%ROWTYPE;
BEGIN
  SELECT * INTO STRICT rolling FROM official_v3_guard_private.rolling_quota_baseline_v1 WHERE singleton;
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
    OR rolling.predecessor_provider_digest<>'96f86b8d5432508a3172ea483c8804cf405027f1bb565422df683615f061f5d7'
    OR rolling.predecessor_catalog_digest IS DISTINCT FROM encode(sha256(convert_to(gap_baseline.catalog::text,'UTF8')),'hex')
    OR rolling.predecessor_gap_digest IS DISTINCT FROM encode(sha256(convert_to((to_jsonb(gap_baseline)||jsonb_build_object('proof_not_before',extract(epoch FROM gap_baseline.proof_not_before)))::text,'UTF8')),'hex')
    OR rolling.policy IS DISTINCT FROM (SELECT to_jsonb(p)||jsonb_build_object('installed_at',extract(epoch FROM p.installed_at)) FROM official_v3_jobs_private.rolling_policy_v2 p)
    OR rolling.catalog IS DISTINCT FROM official_v3_guard_private.catalog_status_v1() THEN
    RAISE EXCEPTION 'bg1 recovery protected catalog changed' USING ERRCODE='P7905'; END IF;
END $rolling_body$;

CREATE OR REPLACE FUNCTION official_v3_guard_private.require_open_v1() RETURNS bigint
LANGUAGE plpgsql VOLATILE SECURITY DEFINER SET search_path=pg_catalog AS $rolling_body$
DECLARE s official_v3_guard_private.state_v1%ROWTYPE; instant timestamptz;
  required_proof bigint; earliest_proof timestamptz;
BEGIN
  SELECT * INTO s FROM official_v3_guard_private.state_v1 WHERE singleton FOR SHARE;
  instant:=clock_timestamp();
  IF NOT FOUND OR s.generation=0 OR s.incident_generation<>s.resumed_generation
    OR instant<s.last_observed OR instant<s.last_finished OR instant>=s.valid_until
    OR s.last_finished>s.last_started+interval '30 seconds' OR s.valid_until<>s.last_due+interval '5 minutes 30 seconds' THEN
    RAISE EXCEPTION 'bg1 integrity unavailable' USING ERRCODE='P7902'; END IF;
  SELECT greatest(q.required_generation,g.required_generation,r.required_generation,b.required_generation),greatest(q.proof_not_before,g.proof_not_before,r.proof_not_before,b.proof_not_before)
    INTO STRICT required_proof,earliest_proof FROM official_v3_guard_private.rolling_quota_baseline_v1 q
      CROSS JOIN official_v3_guard_private.gap_recovery_baseline_v1 g
      CROSS JOIN official_v3_guard_private.recovery_baseline_v1 r
      CROSS JOIN official_v3_guard_private.status_baseline_v1 b WHERE q.singleton AND g.singleton AND r.singleton AND b.singleton;
  IF s.generation<required_proof OR s.last_proof_started<earliest_proof OR instant<earliest_proof
    OR NOT EXISTS(SELECT 1 FROM official_v3_guard_private.runs_v1 run WHERE run.outcome='complete' AND run.generation=s.generation
      AND run.due_at=s.last_due AND run.started_at=s.last_started AND run.proof_started_at=s.last_proof_started AND run.finished_at=s.last_finished) THEN
    RAISE EXCEPTION 'bg1 recovery fresh full proof required' USING ERRCODE='P7902'; END IF;
  RETURN s.incident_generation;
END $rolling_body$;

CREATE OR REPLACE FUNCTION public.official_v3_guard_alarm_status_v1() RETURNS jsonb
LANGUAGE plpgsql VOLATILE SECURITY DEFINER SET search_path=pg_catalog AS $rolling_body$
DECLARE required_proof bigint; earliest_proof timestamptz; current_state official_v3_guard_private.state_v1%ROWTYPE;
  unavailable_value jsonb:=jsonb_build_object('schema',1,'status','unavailable');
BEGIN
  IF official_v3_guard_private.alarm_status_v1() IS DISTINCT FROM jsonb_build_object('schema',1,'status','current') THEN RETURN unavailable_value; END IF;
  SELECT greatest(q.required_generation,g.required_generation,r.required_generation,b.required_generation),greatest(q.proof_not_before,g.proof_not_before,r.proof_not_before,b.proof_not_before)
    INTO STRICT required_proof,earliest_proof FROM official_v3_guard_private.rolling_quota_baseline_v1 q
      CROSS JOIN official_v3_guard_private.gap_recovery_baseline_v1 g
      CROSS JOIN official_v3_guard_private.recovery_baseline_v1 r
      CROSS JOIN official_v3_guard_private.status_baseline_v1 b WHERE q.singleton AND g.singleton AND r.singleton AND b.singleton;
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
END $rolling_body$;

SET LOCAL ROLE ot_v3_jobs_owner;
-- Keep all lifetime counters and their monotonic trigger unchanged. Only this
-- immutable policy's exact subject may exceed the old lifetime ceilings.
ALTER TABLE official_v3_jobs_private.subjects_v1
 DROP CONSTRAINT subjects_v1_operation_count_check,
 DROP CONSTRAINT subjects_v1_start_count_check,
 DROP CONSTRAINT subjects_v1_check,
 ADD CONSTRAINT subjects_v1_operation_count_check CHECK(operation_count>=0 AND (job_key='research-job:v3:74713fe665cab1a7603f6e93ab06b6a1d1964e83a69571b8cced0ff009032513' OR operation_count<=256)),
 ADD CONSTRAINT subjects_v1_start_count_check CHECK(start_count>=0 AND (job_key='research-job:v3:74713fe665cab1a7603f6e93ab06b6a1d1964e83a69571b8cced0ff009032513' OR start_count<=64)),
 ADD CONSTRAINT subjects_v1_check CHECK(job_key='research-job:v3:74713fe665cab1a7603f6e93ab06b6a1d1964e83a69571b8cced0ff009032513' OR operation_count+CASE WHEN terminal_credit_claim IS NULL THEN 0 ELSE 1 END<=256);
RESET ROLE;

CREATE TEMP TABLE rolling_v2_check_model(
 job_key text,
 operation_count integer CHECK(operation_count>=0 AND (job_key='research-job:v3:74713fe665cab1a7603f6e93ab06b6a1d1964e83a69571b8cced0ff009032513' OR operation_count<=256)),
 start_count integer CHECK(start_count>=0 AND (job_key='research-job:v3:74713fe665cab1a7603f6e93ab06b6a1d1964e83a69571b8cced0ff009032513' OR start_count<=64)),
 terminal_credit_claim text,
 CHECK(job_key='research-job:v3:74713fe665cab1a7603f6e93ab06b6a1d1964e83a69571b8cced0ff009032513' OR operation_count+CASE WHEN terminal_credit_claim IS NULL THEN 0 ELSE 1 END<=256)
) ON COMMIT DROP;


REVOKE ot_v3_jobs_owner FROM postgres GRANTED BY postgres;

CREATE TEMP TABLE rolling_objects(classid oid,objid oid,PRIMARY KEY(classid,objid)) ON COMMIT DROP;
DO $rolling_delta$
DECLARE approved jsonb:='[{"signature":"official_v3_jobs_private.assert_history_v1(text)","name":"official_v3_jobs_private.assert_history_v1","owner":"ot_v3_jobs_owner","hash":"b23d018a05fd96cd779993ba0be510a9d9feafdf94b5b598883e724f097f9399","language":"plpgsql","definer":false,"volatile":"v","config":["search_path=pg_catalog, pg_temp"]},{"signature":"official_v3_jobs_private.tx_execution_start_v1(jsonb,jsonb,integer,integer,timestamptz)","name":"official_v3_jobs_private.tx_execution_start_v1","owner":"ot_v3_jobs_owner","hash":"4c2762b15f062ff3a95bcddcdd9f3f31a29ab961e8dc6d13e0895d0eca017ca1","language":"plpgsql","definer":false,"volatile":"v","config":["search_path=pg_catalog, pg_temp"]},{"signature":"official_v3_jobs_private.tx_queue_cas_v1(jsonb,jsonb,integer,integer,timestamptz)","name":"official_v3_jobs_private.tx_queue_cas_v1","owner":"ot_v3_jobs_owner","hash":"1594e7681d06875e42ac601635561589ce89cdaf5ae4a5091b7a6a71c9ca27b7","language":"plpgsql","definer":false,"volatile":"v","config":["search_path=pg_catalog, pg_temp"]},{"signature":"official_v3_guard_private.jobs_catalog_v1()","name":"official_v3_guard_private.jobs_catalog_v1","owner":"postgres","hash":"9e6d3f2b0dd0cd72e65ccc28dba92ddbeadcf177dcbe79101d6fc605968c90df","language":"sql","definer":true,"volatile":"s","config":["search_path=pg_catalog"]},{"signature":"official_v3_guard_private.hrs_catalog_v1()","name":"official_v3_guard_private.hrs_catalog_v1","owner":"postgres","hash":"97fb62a4b2effafc54f920fff0ff9f11c1ab8b55887e70f3d24aaed6cc5402d9","language":"sql","definer":true,"volatile":"s","config":["search_path=pg_catalog"]},{"signature":"official_v3_guard_private.assert_catalog_v1()","name":"official_v3_guard_private.assert_catalog_v1","owner":"postgres","hash":"29af0ef1184d7ec3991759880a59a97afe654d5a6047e06cb01e22130cbe8ea2","language":"plpgsql","definer":true,"volatile":"v","config":["search_path=pg_catalog"]},{"signature":"official_v3_guard_private.require_open_v1()","name":"official_v3_guard_private.require_open_v1","owner":"postgres","hash":"a4f788a1d8ef4dd42e8917fd56a0f0e88196db3cfd4175457ff751262be5493b","language":"plpgsql","definer":true,"volatile":"v","config":["search_path=pg_catalog"]},{"signature":"public.official_v3_guard_alarm_status_v1()","name":"public.official_v3_guard_alarm_status_v1","owner":"postgres","hash":"87df5171f5c9c01b81d6b5c70e07e1cc0a1781f1ad0350168f8ecc67ee84c7ae","language":"plpgsql","definer":true,"volatile":"v","config":["search_path=pg_catalog"]},{"signature":"official_v3_jobs_private.rolling_usage_v2(text)","name":"official_v3_jobs_private.rolling_usage_v2","owner":"ot_v3_jobs_owner","hash":"9658e2c50d2e37d96cf3cdb09dec3223df6f71256b26457961f217be5fba95b3","language":"plpgsql","definer":false,"volatile":"v","config":["search_path=pg_catalog, pg_temp"]},{"signature":"official_v3_guard_private.ch_de_quota_v2()","name":"official_v3_guard_private.ch_de_quota_v2","owner":"postgres","hash":"ef1f6d904ca5742aaf212b82b3974a1f5ad4f88304eafb011ded94e1f7220372","language":"plpgsql","definer":true,"volatile":"v","config":["search_path=pg_catalog"]}]'::jsonb; expected record; actual pg_proc%ROWTYPE;
 before_catalog jsonb; after_catalog jsonb; entry record; relation_id oid; table_name text; schema_name text; owner_name text;
 class_value oid; object_value oid; expected_columns jsonb; replacement_ids oid[]:='{}';
 result_value jsonb; current_value jsonb; jobs_snapshot jsonb; hrs_snapshot jsonb;
BEGIN
 IF COALESCE((SELECT jsonb_agg(to_jsonb(m) ORDER BY m.oid) FROM pg_auth_members m),'[]'::jsonb)
     IS DISTINCT FROM (SELECT value FROM pg_temp.rolling_before WHERE kind='memberships')
   OR (SELECT jsonb_build_object('owner',nspowner,'acl',nspacl) FROM pg_namespace WHERE nspname='official_v3_guard_private')
     IS DISTINCT FROM (SELECT value FROM pg_temp.rolling_before WHERE kind='schema_acl') THEN
   RAISE EXCEPTION 'rolling exact authority restoration required' USING ERRCODE='P7911'; END IF;
 SELECT value INTO STRICT before_catalog FROM pg_temp.rolling_before WHERE kind='catalog';
 FOR expected IN SELECT * FROM jsonb_to_recordset(approved)
   AS f(signature text,name text,owner text,hash text,language text,definer boolean,volatile text,config jsonb) LOOP
   SELECT * INTO STRICT actual FROM pg_proc WHERE oid=to_regprocedure(expected.signature);
   IF actual.proowner<>to_regrole(expected.owner) OR actual.prokind<>'f' OR actual.proleakproof OR actual.proisstrict
     OR actual.pronargdefaults<>0 OR actual.provariadic<>0 OR actual.proparallel<>'u'
     OR actual.prosecdef<>expected.definer OR actual.provolatile::text<>expected.volatile
     OR (SELECT lanname FROM pg_language WHERE oid=actual.prolang)<>expected.language
     OR to_jsonb(actual.proconfig) IS DISTINCT FROM expected.config
     OR encode(sha256(convert_to(actual.prosrc,'UTF8')),'hex') IS DISTINCT FROM expected.hash THEN
     RAISE EXCEPTION 'rolling exact function contract: %',expected.signature USING ERRCODE='P7911'; END IF;
   IF before_catalog ? ('function:'||actual.oid) THEN replacement_ids:=array_append(replacement_ids,actual.oid);
   ELSE
     IF expected.signature NOT IN ('official_v3_jobs_private.rolling_usage_v2(text)','official_v3_guard_private.ch_de_quota_v2()')
       OR actual.proretset OR actual.prorettype<>'jsonb'::regtype OR actual.proargmodes IS NOT NULL OR actual.proallargtypes IS NOT NULL
       OR (expected.signature='official_v3_jobs_private.rolling_usage_v2(text)' AND (actual.pronargs<>1 OR actual.proargnames IS DISTINCT FROM ARRAY['k']::text[]))
       OR (expected.signature='official_v3_guard_private.ch_de_quota_v2()' AND (actual.pronargs<>0 OR actual.proargnames IS NOT NULL))
       OR EXISTS(SELECT 1 FROM aclexplode(COALESCE(actual.proacl,acldefault('f',actual.proowner))) a
         WHERE a.grantee NOT IN (actual.proowner,'postgres'::regrole) OR a.grantor<>actual.proowner OR a.is_grantable OR a.privilege_type<>'EXECUTE') THEN
       RAISE EXCEPTION 'rolling new helper private contract' USING ERRCODE='P7911'; END IF;
     INSERT INTO pg_temp.rolling_objects VALUES('pg_proc'::regclass,actual.oid);
   END IF;
 END LOOP;
 IF cardinality(replacement_ids)<>8 THEN RAISE EXCEPTION 'rolling exact replacement inventory' USING ERRCODE='P7911'; END IF;
 FOR expected IN SELECT pg_get_constraintdef(c.oid) AS definition FROM pg_constraint c
   WHERE c.conrelid='pg_temp.rolling_v2_check_model'::regclass AND c.contype='c' LOOP
   SELECT c.oid,c.conname INTO STRICT entry FROM pg_constraint c WHERE c.conrelid='official_v3_jobs_private.subjects_v1'::regclass
     AND c.contype='c' AND c.convalidated AND NOT c.condeferrable AND NOT c.condeferred AND c.conislocal AND c.coninhcount=0
     AND pg_get_constraintdef(c.oid)=expected.definition AND c.conname IN (SELECT name FROM pg_temp.rolling_old_checks);
   IF EXISTS(SELECT 1 FROM pg_temp.rolling_old_checks WHERE id=entry.oid) THEN RAISE EXCEPTION 'rolling new check OID required' USING ERRCODE='P7911'; END IF;
   INSERT INTO pg_temp.rolling_objects VALUES('pg_constraint'::regclass,entry.oid);
 END LOOP;
 IF (SELECT count(*) FROM pg_temp.rolling_objects WHERE classid='pg_constraint'::regclass)<>3 THEN
   RAISE EXCEPTION 'rolling exactly three check successors required' USING ERRCODE='P7911'; END IF;
 FOREACH table_name IN ARRAY ARRAY['rolling_policy_v2','rolling_quota_baseline_v1'] LOOP
   schema_name:=CASE table_name WHEN 'rolling_policy_v2' THEN 'official_v3_jobs_private' ELSE 'official_v3_guard_private' END;
   owner_name:=CASE table_name WHEN 'rolling_policy_v2' THEN 'ot_v3_jobs_owner' ELSE 'postgres' END;
   relation_id:=to_regclass(schema_name||'.'||table_name);
   expected_columns:=CASE table_name WHEN 'rolling_policy_v2' THEN
    '[["job_key","text",true,false],["method_binding","jsonb",true,false],["window_seconds","integer",true,false],["start_limit","integer",true,false],["operation_limit","integer",true,false],["anchor_starts","integer",true,false],["anchor_operations","integer",true,false],["installed_at","timestamp with time zone",true,false]]'::jsonb
    ELSE '[["singleton","boolean",true,false],["predecessor_provider_digest","text",true,false],["predecessor_catalog_digest","text",true,false],["predecessor_gap_digest","text",true,false],["required_generation","bigint",true,false],["proof_not_before","timestamp with time zone",true,false],["policy","jsonb",true,false],["jobs_catalog","jsonb",true,false],["hrs_catalog","jsonb",true,false],["catalog","jsonb",true,false]]'::jsonb END;
   IF relation_id IS NULL OR NOT EXISTS(SELECT 1 FROM pg_class c WHERE c.oid=relation_id AND c.relkind='r'
     AND c.relowner=to_regrole(owner_name) AND c.relrowsecurity AND c.relforcerowsecurity)
     OR EXISTS(SELECT 1 FROM pg_class c CROSS JOIN LATERAL aclexplode(COALESCE(c.relacl,acldefault('r',c.relowner))) a
       WHERE c.oid=relation_id AND (a.grantor<>c.relowner OR a.is_grantable
         OR (a.grantee<>c.relowner AND NOT(table_name='rolling_policy_v2' AND a.grantee='postgres'::regrole AND a.privilege_type='SELECT'))))
     OR (SELECT jsonb_agg(jsonb_build_array(a.attname,a.atttypid::regtype::text,a.attnotnull,a.attisdropped) ORDER BY a.attnum)
       FROM pg_attribute a WHERE a.attrelid=relation_id AND a.attnum>0) IS DISTINCT FROM expected_columns
     OR (SELECT count(*) FROM pg_policy p WHERE p.polrelid=relation_id)<>(CASE table_name WHEN 'rolling_policy_v2' THEN 2 ELSE 1 END)
     OR EXISTS(SELECT 1 FROM pg_policy p WHERE p.polrelid=relation_id AND NOT(
       p.polpermissive AND pg_get_expr(p.polqual,p.polrelid)='true' AND (
       p.polroles=ARRAY[to_regrole(owner_name)::oid] AND p.polcmd='*' AND pg_get_expr(p.polwithcheck,p.polrelid)='true'
         AND p.polname=CASE table_name WHEN 'rolling_policy_v2' THEN 'owner_v2' ELSE 'owner_only' END
       OR table_name='rolling_policy_v2' AND p.polname='readback_v2' AND p.polroles=ARRAY['postgres'::regrole::oid] AND p.polcmd='r' AND p.polwithcheck IS NULL)))
     OR (SELECT count(*) FROM pg_trigger t WHERE t.tgrelid=relation_id AND NOT t.tgisinternal)<>2
     OR EXISTS(SELECT 1 FROM pg_trigger t WHERE t.tgrelid=relation_id AND NOT t.tgisinternal
       AND (t.tgfoid<>to_regprocedure(schema_name||'.immutable_v1()') OR t.tgenabled<>'O' OR t.tgnargs<>0 OR t.tgqual IS NOT NULL
         OR NOT (t.tgname=CASE table_name WHEN 'rolling_policy_v2' THEN 'guard_row_v2' ELSE 'immutable_v1' END AND t.tgtype=27
           OR t.tgname=CASE table_name WHEN 'rolling_policy_v2' THEN 'guard_truncate_v2' ELSE 'immutable_truncate_v1' END AND t.tgtype=34)))
     OR (SELECT count(*) FROM pg_constraint c WHERE c.conrelid=relation_id AND c.contype='p')<>1
     OR EXISTS(SELECT 1 FROM pg_constraint c WHERE c.conrelid=relation_id AND (c.contype NOT IN ('p','c') OR NOT c.convalidated OR c.condeferrable OR c.condeferred))
     OR (SELECT count(*) FROM pg_constraint c WHERE c.conrelid=relation_id AND c.contype='c')<>(CASE table_name WHEN 'rolling_policy_v2' THEN 7 ELSE 6 END) THEN
     RAISE EXCEPTION 'rolling exact private table contract' USING ERRCODE='P7911'; END IF;
   INSERT INTO pg_temp.rolling_objects
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
 FOR expected IN SELECT * FROM (VALUES
   ('queue_operations_subject_time_v2','queue_operations_v1','2 10 1'),
   ('execution_starts_subject_time_v2','execution_starts_v1','2 8 1')
 ) i(name,relation,keys) LOOP
   relation_id:=to_regclass('official_v3_jobs_private.'||expected.name);
   IF NOT EXISTS(SELECT 1 FROM pg_index i JOIN pg_class c ON c.oid=i.indexrelid
       WHERE i.indexrelid=relation_id AND i.indrelid=to_regclass('official_v3_jobs_private.'||expected.relation)
         AND c.relowner='ot_v3_jobs_owner'::regrole AND c.relam=(SELECT oid FROM pg_am WHERE amname='btree')
         AND i.indkey::text=expected.keys AND i.indnatts=3 AND i.indnkeyatts=3
         AND NOT i.indisunique AND NOT i.indisprimary AND NOT i.indisexclusion AND NOT i.indisclustered AND NOT i.indisreplident
         AND i.indisvalid AND i.indisready AND i.indislive AND i.indexprs IS NULL AND i.indpred IS NULL) THEN
     RAISE EXCEPTION 'rolling exact time index required' USING ERRCODE='P7911'; END IF;
   INSERT INTO pg_temp.rolling_objects VALUES('pg_class'::regclass,relation_id);
 END LOOP;
 IF (SELECT count(*) FROM official_v3_jobs_private.rolling_policy_v2)<>1 THEN
   RAISE EXCEPTION 'rolling one immutable policy required' USING ERRCODE='P7911'; END IF;
 after_catalog:=official_v3_guard_private.catalog_status_v1();
 FOR entry IN SELECT key,value FROM jsonb_each(before_catalog) LOOP
   IF after_catalog->entry.key IS NOT DISTINCT FROM entry.value THEN CONTINUE; END IF;
   IF entry.key LIKE 'function:%' AND split_part(entry.key,':',2)::oid=ANY(replacement_ids)
     AND (after_catalog->entry.key)-'definition' IS NOT DISTINCT FROM entry.value-'definition' THEN CONTINUE; END IF;
   IF NOT after_catalog ? entry.key AND (
     entry.key LIKE 'constraint:%' AND EXISTS(SELECT 1 FROM pg_temp.rolling_old_checks WHERE id=split_part(entry.key,':',2)::oid)
     OR entry.key LIKE 'dependency:%' AND (entry.value->>'classid')::oid='pg_constraint'::regclass
       AND EXISTS(SELECT 1 FROM pg_temp.rolling_old_checks WHERE id=(entry.value->>'objid')::oid)) THEN CONTINUE; END IF;
   RAISE EXCEPTION 'rolling predecessor graph changed: %',entry.key USING ERRCODE='P7911';
 END LOOP;
 FOR entry IN SELECT key,value FROM jsonb_each(after_catalog) WHERE NOT before_catalog ? key LOOP
   class_value:=CASE split_part(entry.key,':',1)
     WHEN 'function' THEN 'pg_proc'::regclass WHEN 'relation' THEN 'pg_class'::regclass
     WHEN 'attribute' THEN 'pg_class'::regclass WHEN 'index' THEN 'pg_class'::regclass
     WHEN 'type' THEN 'pg_type'::regclass WHEN 'constraint' THEN 'pg_constraint'::regclass
     WHEN 'trigger' THEN 'pg_trigger'::regclass WHEN 'policy' THEN 'pg_policy'::regclass WHEN 'default' THEN 'pg_attrdef'::regclass
     WHEN 'dependency' THEN (entry.value->>'classid')::oid WHEN 'shared' THEN (entry.value->>'classid')::oid END;
   object_value:=CASE WHEN split_part(entry.key,':',1) IN ('dependency','shared') THEN (entry.value->>'objid')::oid ELSE split_part(entry.key,':',2)::oid END;
   IF class_value IS NULL OR NOT EXISTS(SELECT 1 FROM pg_temp.rolling_objects o WHERE o.classid=class_value AND o.objid=object_value) THEN
     RAISE EXCEPTION 'rolling unreviewed additive edge: %',entry.key USING ERRCODE='P7911'; END IF;
 END LOOP;
 result_value:='{}'::jsonb;
SELECT q.value INTO current_value FROM (
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
result_value:=result_value||jsonb_build_object('hrs1-catalog',current_value);
SELECT q.value INTO current_value FROM (
SELECT pg_catalog.to_jsonb(pg_catalog.encode(pg_catalog.sha256(pg_catalog.convert_to(q.value::text,'UTF8')),'hex')) AS value FROM (
SELECT pg_catalog.jsonb_agg(pg_catalog.jsonb_build_object(
  'catalog',pg_catalog.to_jsonb(p)-'prosrc'-'prosqlbody'-'probin',
  'definition',pg_catalog.encode(pg_catalog.sha256(pg_catalog.convert_to(pg_catalog.pg_get_functiondef(p.oid),'UTF8')),'hex'))
  ORDER BY p.oid) AS value FROM pg_catalog.pg_proc p JOIN pg_catalog.pg_namespace n ON n.oid=p.pronamespace
  WHERE n.nspname IN ('official_v3_jobs_private','official_v3_jobs_api')
) q
) q;
result_value:=result_value||jsonb_build_object('jobs-functions',current_value);
SELECT q.value INTO current_value FROM (
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
result_value:=result_value||jsonb_build_object('jobs-relations',current_value);
SELECT q.value INTO current_value FROM (
SELECT pg_catalog.to_jsonb(pg_catalog.encode(pg_catalog.sha256(pg_catalog.convert_to(q.value::text,'UTF8')),'hex')) AS value FROM (
SELECT pg_catalog.jsonb_agg(pg_catalog.to_jsonb(t) ORDER BY t.oid) AS value
  FROM pg_catalog.pg_type t JOIN pg_catalog.pg_namespace n ON n.oid=t.typnamespace WHERE n.nspname IN ('official_v3_jobs_private','official_v3_jobs_api')
) q
) q;
result_value:=result_value||jsonb_build_object('jobs-types',current_value);
SELECT q.value INTO current_value FROM (
SELECT pg_catalog.to_jsonb(pg_catalog.encode(pg_catalog.sha256(pg_catalog.convert_to(q.value::text,'UTF8')),'hex')) AS value FROM (
SELECT pg_catalog.jsonb_agg(pg_catalog.to_jsonb(n) ORDER BY n.oid) AS value
  FROM pg_catalog.pg_namespace n WHERE n.nspname IN ('official_v3_jobs_private','official_v3_jobs_api')
) q
) q;
result_value:=result_value||jsonb_build_object('jobs-schemas',current_value);
SELECT q.value INTO current_value FROM (
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
result_value:=result_value||jsonb_build_object('jobs-dependencies',current_value);
SELECT q.value INTO current_value FROM (
SELECT pg_catalog.to_jsonb(pg_catalog.encode(pg_catalog.sha256(pg_catalog.convert_to(q.value::text,'UTF8')),'hex')) AS value FROM (
SELECT pg_catalog.jsonb_agg(pg_catalog.jsonb_build_object(
  'catalog',pg_catalog.to_jsonb(p)-'prosrc'-'prosqlbody'-'probin',
  'definition',pg_catalog.encode(pg_catalog.sha256(pg_catalog.convert_to(pg_catalog.pg_get_functiondef(p.oid),'UTF8')),'hex'))
  ORDER BY p.oid) AS value FROM pg_catalog.pg_proc p JOIN pg_catalog.pg_namespace n ON n.oid=p.pronamespace
  WHERE n.nspname IN ('jetnity_ot_auth','official_v3_method_private','official_v3_method_api','official_v3_intake_private','official_v3_intake_api')
) q
) q;
result_value:=result_value||jsonb_build_object('prerequisite-functions',current_value);
SELECT q.value INTO current_value FROM (
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
result_value:=result_value||jsonb_build_object('prerequisite-relations',current_value);
SELECT q.value INTO current_value FROM (
SELECT pg_catalog.to_jsonb(pg_catalog.encode(pg_catalog.sha256(pg_catalog.convert_to(q.value::text,'UTF8')),'hex')) AS value FROM (
SELECT pg_catalog.jsonb_agg(pg_catalog.to_jsonb(t) ORDER BY t.oid) AS value
  FROM pg_catalog.pg_type t JOIN pg_catalog.pg_namespace n ON n.oid=t.typnamespace WHERE n.nspname IN ('jetnity_ot_auth','official_v3_method_private','official_v3_method_api','official_v3_intake_private','official_v3_intake_api')
) q
) q;
result_value:=result_value||jsonb_build_object('prerequisite-types',current_value);
SELECT q.value INTO current_value FROM (
SELECT pg_catalog.to_jsonb(pg_catalog.encode(pg_catalog.sha256(pg_catalog.convert_to(q.value::text,'UTF8')),'hex')) AS value FROM (
SELECT pg_catalog.jsonb_agg(pg_catalog.to_jsonb(n) ORDER BY n.oid) AS value
  FROM pg_catalog.pg_namespace n WHERE n.nspname IN ('jetnity_ot_auth','official_v3_method_private','official_v3_method_api','official_v3_intake_private','official_v3_intake_api')
) q
) q;
result_value:=result_value||jsonb_build_object('prerequisite-schemas',current_value);
SELECT q.value INTO current_value FROM (
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
result_value:=result_value||jsonb_build_object('prerequisite-dependencies',current_value);
SELECT q.value INTO current_value FROM (
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
result_value:=result_value||jsonb_build_object('protected-roles',current_value);
SELECT q.value INTO current_value FROM (
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
result_value:=result_value||jsonb_build_object('creator-edges',current_value);
SELECT q.value INTO current_value FROM (
SELECT pg_catalog.jsonb_build_object('installer','postgres'::pg_catalog.regrole::oid,
 'entries',(SELECT pg_catalog.jsonb_agg(pg_catalog.to_jsonb(d) ORDER BY d.defaclrole,d.defaclnamespace,d.defaclobjtype)
 FROM pg_catalog.pg_default_acl d WHERE d.defaclrole IN
   (SELECT r.oid FROM pg_catalog.pg_roles r WHERE r.rolname IN ('postgres','ot_v3_jobs_owner','ot_v3_jobs_caller','ot_v3_intake_owner','ot_v3_intake_caller','ot_v3_method_reader'))
 OR d.defaclnamespace IN (SELECT n.oid FROM pg_catalog.pg_namespace n WHERE n.nspname IN ('official_v3_jobs_private','official_v3_jobs_api','jetnity_ot_auth','official_v3_method_private','official_v3_method_api','official_v3_intake_private','official_v3_intake_api')))) AS value
) q;
result_value:=result_value||jsonb_build_object('creator-defaults',current_value);
SELECT q.value INTO current_value FROM (
SELECT pg_catalog.to_jsonb(pg_catalog.encode(pg_catalog.sha256(pg_catalog.convert_to(q.value::text,'UTF8')),'hex')) AS value FROM (
SELECT pg_catalog.jsonb_build_object('oid',d.oid,'name',d.datname,'owner',d.datdba,'acl',d.datacl,
 'encoding',d.encoding,'allow_connections',d.datallowconn,'connection_limit',d.datconnlimit,
 'settings',(SELECT pg_catalog.jsonb_agg(pg_catalog.to_jsonb(s) ORDER BY s.setrole)
   FROM pg_catalog.pg_db_role_setting s WHERE s.setdatabase=d.oid AND s.setrole=0)) AS value
 FROM pg_catalog.pg_database d WHERE d.datname=current_database()
) q
) q;
result_value:=result_value||jsonb_build_object('database',current_value);
SELECT fingerprint INTO current_value FROM official_v3_jobs_private.catalog_binding_v1 WHERE object_identity='package-context';
result_value:=result_value||jsonb_build_object('package-context',current_value);
 jobs_snapshot:=result_value;
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
) ELSE NULL::jsonb END) INTO hrs_snapshot;
 INSERT INTO official_v3_guard_private.rolling_quota_baseline_v1
 SELECT true,'96f86b8d5432508a3172ea483c8804cf405027f1bb565422df683615f061f5d7',encode(sha256(convert_to(before_catalog::text,'UTF8')),'hex'),
   encode(sha256(convert_to((to_jsonb(prior)||jsonb_build_object('proof_not_before',extract(epoch FROM prior.proof_not_before)))::text,'UTF8')),'hex'),
   s.generation+1,clock_timestamp(),(SELECT to_jsonb(p)||jsonb_build_object('installed_at',extract(epoch FROM p.installed_at)) FROM official_v3_jobs_private.rolling_policy_v2 p),
   jobs_snapshot,hrs_snapshot,after_catalog FROM official_v3_guard_private.state_v1 s
   CROSS JOIN official_v3_guard_private.gap_recovery_baseline_v1 prior WHERE s.singleton AND prior.singleton;
END $rolling_delta$;


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
  IF current_content IS DISTINCT FROM (SELECT value FROM pg_temp.rolling_before WHERE kind='content') THEN
    RAISE EXCEPTION 'bg1 recovery old certified content changed' USING ERRCODE='P7901'; END IF;
  FOR prior IN SELECT * FROM pg_temp.rolling_before WHERE kind LIKE 'table:%' LOOP
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
END $recovery_postcheck$;

