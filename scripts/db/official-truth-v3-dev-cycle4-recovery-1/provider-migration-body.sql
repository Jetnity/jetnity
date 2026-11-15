-- CYCLE4-RECOVERY1: exact Dev unknown START; provider transaction required. Installer records no retirement.

SET LOCAL jetnity.cycle4_recovery_target='dev:yfvbxvijcorffwxbxahl:CYCLE4-RECOVERY1';

SET LOCAL search_path=pg_catalog; SET LOCAL statement_timeout='30s'; SET LOCAL lock_timeout='5s';

SET LOCAL idle_in_transaction_session_timeout='30s'; SET LOCAL timezone='UTC'; SET LOCAL datestyle='ISO, YMD';

DO $cycle4_context$
BEGIN
  IF current_user<>'postgres' OR session_user<>current_user OR current_database()<>'postgres'
    OR current_setting('server_version_num')::integer/10000<>17
    OR current_setting('transaction_isolation') IS DISTINCT FROM 'read committed'
    OR current_setting('jetnity.cycle4_recovery_target',true) IS DISTINCT FROM 'dev:yfvbxvijcorffwxbxahl:CYCLE4-RECOVERY1'
    OR current_setting('createrole_self_grant')<>''
    OR NOT EXISTS(SELECT 1 FROM pg_roles WHERE rolname='postgres' AND NOT rolsuper AND rolcreaterole AND rolbypassrls)
    OR to_regclass('official_v3_guard_private.refresh_retirement_baseline_v1') IS NULL
    OR to_regclass('official_v3_guard_private.cycle4_recovery_baseline_v1') IS NOT NULL
    OR to_regclass('official_v3_guard_private.retired_cycle4_attempts_v1') IS NOT NULL THEN
    RAISE EXCEPTION 'cycle4 exact unused Dev predecessor required' USING ERRCODE='P7923';
  END IF;
  -- Match the sender's first lock, then the existing package/guard lock order.
  -- The sender is controlled outside this migration; no enable/disable is hidden.
  IF NOT pg_try_advisory_xact_lock(771106,31)
    OR NOT pg_try_advisory_xact_lock(771101,1) OR NOT pg_try_advisory_xact_lock(771102,1)
    OR NOT pg_try_advisory_xact_lock(771103,1) OR NOT pg_try_advisory_xact_lock(771104,1)
    OR NOT pg_try_advisory_xact_lock(771105,1) OR NOT pg_try_advisory_xact_lock(771106,1) THEN
    RAISE EXCEPTION 'cycle4 package operation already active' USING ERRCODE='P7923';
  END IF;
  IF to_regclass('jetnity_dev_import_scheduler.state_v1') IS NOT NULL THEN
    IF EXISTS(SELECT 1 FROM jetnity_dev_import_scheduler.state_v1 WHERE enabled)
      OR EXISTS(SELECT 1 FROM jetnity_dev_import_scheduler.cycles_v1 WHERE state='active')
      OR EXISTS(SELECT 1 FROM jetnity_dev_import_scheduler.dispatches_v1 WHERE processed_at IS NULL) THEN
      RAISE EXCEPTION 'cycle4 disabled drained sender required' USING ERRCODE='P7923';
    END IF;
  END IF;
  IF to_regclass('jetnity_dev_import_scheduler.preview_dispatches_v1') IS NOT NULL THEN
    IF EXISTS(SELECT 1 FROM jetnity_dev_import_scheduler.preview_dispatches_v1 WHERE processed_at IS NULL) THEN
      RAISE EXCEPTION 'cycle4 disabled drained sender required' USING ERRCODE='P7923';
    END IF;
  END IF;
  IF to_regclass('jetnity_dev_import_scheduler.terminal_cycle3_review_v1') IS NULL
    OR (SELECT to_jsonb(c) FROM jetnity_dev_import_scheduler.cycles_v1 c WHERE id=4) IS DISTINCT FROM '{"id":4,"phase":"resume","state":"blocked","lease_id":"lease3_491cf756e95d47e0892613c0e81c556b","published":0,"created_at":"2026-11-15T16:36:00.075065+00:00","finished_at":"2026-11-15T16:47:00.059105+00:00","last_status":"retry_budget_exhausted","operation_id":"op3_2b7811ed9b5f488cbffcd09a0ec0409b","phase_attempts":8}'::jsonb
    OR (SELECT jsonb_agg(to_jsonb(d) ORDER BY id) FROM jetnity_dev_import_scheduler.dispatches_v1 d WHERE cycle_id=4)
      IS DISTINCT FROM '[{"id":21,"phase":"start","outcome":"queued","cycle_id":4,"http_status":200,"processed_at":"2026-11-15T16:37:00.075091+00:00","signed_at_ms":"1794760560078","dispatched_at":"2026-11-15T16:36:00.098011+00:00","net_request_id":25},{"id":22,"phase":"resume","outcome":"unresolved","cycle_id":4,"http_status":503,"processed_at":"2026-11-15T16:38:00.068981+00:00","signed_at_ms":"1794760620094","dispatched_at":"2026-11-15T16:37:00.096608+00:00","net_request_id":26},{"id":23,"phase":"resume","outcome":"unresolved","cycle_id":4,"http_status":503,"processed_at":"2026-11-15T16:39:00.057892+00:00","signed_at_ms":"1794760680087","dispatched_at":"2026-11-15T16:38:00.089743+00:00","net_request_id":27},{"id":24,"phase":"resume","outcome":"unresolved","cycle_id":4,"http_status":503,"processed_at":"2026-11-15T16:41:00.078373+00:00","signed_at_ms":"1794760740097","dispatched_at":"2026-11-15T16:39:00.098864+00:00","net_request_id":28},{"id":25,"phase":"resume","outcome":"unresolved","cycle_id":4,"http_status":503,"processed_at":"2026-11-15T16:42:00.07449+00:00","signed_at_ms":"1794760860092","dispatched_at":"2026-11-15T16:41:00.096547+00:00","net_request_id":29},{"id":26,"phase":"resume","outcome":"unresolved","cycle_id":4,"http_status":503,"processed_at":"2026-11-15T16:43:00.041819+00:00","signed_at_ms":"1794760920094","dispatched_at":"2026-11-15T16:42:00.096264+00:00","net_request_id":30},{"id":27,"phase":"resume","outcome":"unresolved","cycle_id":4,"http_status":503,"processed_at":"2026-11-15T16:44:00.019999+00:00","signed_at_ms":"1794760980054","dispatched_at":"2026-11-15T16:43:00.057194+00:00","net_request_id":31},{"id":28,"phase":"resume","outcome":"unresolved","cycle_id":4,"http_status":503,"processed_at":"2026-11-15T16:46:00.054979+00:00","signed_at_ms":"1794761040032","dispatched_at":"2026-11-15T16:44:00.034+00:00","net_request_id":32},{"id":29,"phase":"resume","outcome":"unresolved","cycle_id":4,"http_status":503,"processed_at":"2026-11-15T16:47:00.059105+00:00","signed_at_ms":"1794761160066","dispatched_at":"2026-11-15T16:46:00.067858+00:00","net_request_id":33}]'::jsonb
    OR EXISTS(SELECT 1 FROM jetnity_dev_import_scheduler.cycles_v1 WHERE state='active' OR state='blocked' AND id NOT IN(2,3,4))
    OR (SELECT to_jsonb(r)-'reviewed_at'-'reviewed_head'-'runtime_commit'-'ready_deployment'-'ci_run'-'ui_version' FROM jetnity_dev_import_scheduler.terminal_cycle2_review_v1 r) IS DISTINCT FROM '{"cycle_id":2,"evidence_digest":"624257e5e0902a9ed1e5ba6f647430771850daf94edf54034c2e169a32af4fdd","queue_fix_sha256":"4205b79b1a22c80823a4965cf911445213e3f99b8daae6365a710a4748a24f3d","composition_fix_sha256":"667316468efe2328ae41493537462a7ff4bd571da43fe219bdf738a63dd47b89"}'::jsonb
    OR (SELECT to_jsonb(r)-'reviewed_at'-'reviewed_head'-'runtime_commit'-'ready_deployment'-'ci_run'-'ui_version' FROM jetnity_dev_import_scheduler.terminal_cycle3_review_v1 r) IS DISTINCT FROM '{"cycle_id":3,"evidence_digest":"cc61f8b41a289d4a78f0d0fdaaca369e2f532c1f820577ca6a5b3a1a44f45dc1","queue_fix_sha256":"1ac59c6db4e32ad14b57ffef050c833ccd71c4260218b433e90a58fcc8b56a45","executors_fix_sha256":"f1fcc6a0e762104c117e771207e266a3d7eac58492bb573b7aa1be1802c7ce3b","quarantine_fix_sha256":"aa7fe8e22dd1368f99528232f6f573ca0c37f38f3bc35a36c5c1a0b02480bca2","composition_fix_sha256":"9a34e02bb16fccbd087be21b93b52af923b29587e8bc7d3747f2c2cde9bfec5a","job_storage_fix_sha256":"1fea4f1e74713c93be8b2b3cab1360b5ab95a082e89793f9a86b9a817c787d89","owned_scope_fix_sha256":"89a22b2a2de00365505258a301614a0ac2870af79bd3ced40a66c8794c6fe280","job_contract_fix_sha256":"eaf4d0cd72def7b8fe266d6016b587483204d6919917ce2e50700194fba9fc84","owned_session_fix_sha256":"0d818c574ef4784589273f4e31b5abb74879028cbacce66e810012f987734f6c","import_service_fix_sha256":"8bef6976a8199a87d3db0a4f62214486eb330641849c89afb3d0e5b3adcd7b33","selected_claim_fix_sha256":"29be658ca64918c1f7d2d8f50041eca2395b5ccbbfd787dd988a7ea463914dd1","method_authority_fix_sha256":"42fb1f7094764fa8ba85c122f39ee8290e0cdf08b6b8c4f2ed84f58a3139a2f3","worker_authority_fix_sha256":"e614e23bf62b0d196bb0756d2e131413517d2e9d3c3ef28182534f884a97af28","prior_cycle2_evidence_digest":"624257e5e0902a9ed1e5ba6f647430771850daf94edf54034c2e169a32af4fdd","result_composition_fix_sha256":"ac82224f1ac8c7f25f17e06eb1e878355a2ee8ea45edb8ffd9a7500d872c79cd"}'::jsonb
    OR NOT EXISTS(SELECT 1 FROM jetnity_dev_import_scheduler.state_v1 WHERE singleton AND NOT enabled)
    OR NOT EXISTS(SELECT 1 FROM cron.job WHERE jobid=5 AND jobname='jetnity-ch-de-dev-import-v1'
      AND schedule='* * * * *' AND command='SELECT jetnity_dev_import_scheduler.run_v1();'
      AND database='postgres' AND username='postgres' AND nodename='localhost' AND nodeport=5432 AND NOT active) THEN
    RAISE EXCEPTION 'cycle4 exact disabled drained original sender and immutable reviews required' USING ERRCODE='P7923';
  END IF;
  IF (SELECT count(*) FROM official_v3_jobs_private.subjects_v1)<>1
    OR (SELECT to_jsonb(s) FROM official_v3_jobs_private.subjects_v1 s) IS DISTINCT FROM '{"kind":"rule_research","job_key":"research-job:v3:74713fe665cab1a7603f6e93ab06b6a1d1964e83a69571b8cced0ff009032513","slot_id":1,"current_job":{"kind":"research_job_record","jobId":"job3_c70d23ff344cdf2998818ecf5243d15e","lease":{"leaseId":"lease3_491cf756e95d47e0892613c0e81c556b","expiresAt":"2026-11-15T16:37:34.504Z","acquiredAt":"2026-11-15T16:37:04.504Z","generation":41},"state":"leased","jobKey":"research-job:v3:74713fe665cab1a7603f6e93ab06b6a1d1964e83a69571b8cced0ff009032513","method":{"methodId":"jetnity-destination-primary-ch-de-visa","revision":1},"schema":3,"attempt":1,"context":{"route":"direct_entry","scope":{"validity":{"mode":"not_applicable"},"residence":{"mode":"not_applicable"},"citizenship":{"mode":"required","countryCodes":["CH"]},"requirementType":"visa","credentialOption":{"mode":"option","documentType":"passport","issuingCountryCode":"CH","relatedCitizenshipCountryCode":"CH"},"transitCountryCode":null,"destinationCountryCode":"DE"},"conditions":{"status":"unconditional"}},"research":{"key":"research-request:v1:b682f1de48389c7d5a3ac0d39fa4406d0e3796be91fb6e253bfd5a45cf7f945a","factKind":"requirement_effect","ruleScopeKey":"rule-scope:v1:3a24b4bc807a384b6d08e105f1107cc45d6d83c07c75eff01bc0ffc43f61477f","researchReason":{"status":"missing"}},"revision":41,"createdAt":"2026-11-15T16:36:02.293Z","updatedAt":"2026-11-15T16:37:04.504Z","contextKey":"official-truth-context:v3:bfce3bc64dbd7c670441e05033c31f339e03a2c488ab54937320508333c252c2","lastFailure":null,"operationId":"op3_91a38dc806d3f21bac3d9d16493c6be6","attemptLimit":4,"nextAttemptAt":null,"resultDecisionRef":null,"predecessorRevision":40},"start_count":11,"open_attempt":"execution-attempt:v3:89720170633a22f22effbf861d9b7c18a465546b43999375f567145a1449d3de","subject_text":"{\"context\":{\"conditions\":{\"status\":\"unconditional\"},\"route\":\"direct_entry\",\"scope\":{\"citizenship\":{\"countryCodes\":[\"CH\"],\"mode\":\"required\"},\"credentialOption\":{\"documentType\":\"passport\",\"issuingCountryCode\":\"CH\",\"mode\":\"option\",\"relatedCitizenshipCountryCode\":\"CH\"},\"destinationCountryCode\":\"DE\",\"requirementType\":\"visa\",\"residence\":{\"mode\":\"not_applicable\"},\"transitCountryCode\":null,\"validity\":{\"mode\":\"not_applicable\"}}},\"factKind\":\"requirement_effect\",\"kind\":\"rule_research\",\"method\":{\"methodId\":\"jetnity-destination-primary-ch-de-visa\",\"revision\":1}}","method_binding":{"methodId":"jetnity-destination-primary-ch-de-visa","revision":1,"methodDigest":"44ce02752da05796bef98c55b5099b81f915fe6b0975472e163721a06793bdb3","packageDigest":"0beb25db2e1f6e4c2c96d61ded30b59a8e06a32ed94498903fbeecc3b6f267e9"},"operation_count":45,"terminal_credit_claim":"op3_2b7811ed9b5f488cbffcd09a0ec0409b"}'::jsonb
    OR (SELECT count(*) FROM official_v3_guard_private.retired_attempts_v1)<>1
    OR (SELECT count(*) FROM official_v3_guard_private.retired_later_attempts_v1)<>2
      OR (SELECT count(*) FROM official_v3_guard_private.retired_refresh_attempts_v1)<>1
    OR EXISTS(SELECT 1 FROM official_v3_jobs_private.execution_results_v1 WHERE attempt_key='execution-attempt:v3:89720170633a22f22effbf861d9b7c18a465546b43999375f567145a1449d3de')
    OR EXISTS(SELECT 1 FROM official_v3_jobs_private.execution_dispositions_v1 WHERE attempt_key='execution-attempt:v3:89720170633a22f22effbf861d9b7c18a465546b43999375f567145a1449d3de')
    OR EXISTS(SELECT 1 FROM official_v3_intake_private.completions_v1 WHERE operation_id='op3_90bd61aa6d32e79273bdd923f1851576')
    OR clock_timestamp()<='2026-11-15T16:37:34.504Z'::timestamptz THEN
    RAISE EXCEPTION 'cycle4 exact expired unknown original required' USING ERRCODE='P7923';
  END IF;
  IF EXISTS(WITH RECURSIVE inherited_roles(role_oid) AS (
      SELECT oid FROM pg_roles WHERE rolname IN ('ot_v3_jobs_caller','ot_v3_intake_caller','ot_v3_method_reader')
      UNION SELECT m.member FROM pg_auth_members m JOIN inherited_roles p ON p.role_oid=m.roleid WHERE m.inherit_option
    ), runtime_roles(role_oid) AS (
      SELECT role_oid FROM inherited_roles
      UNION SELECT m.member FROM pg_auth_members m JOIN runtime_roles p ON p.role_oid=m.roleid WHERE m.set_option
    ) SELECT 1 FROM pg_stat_activity a JOIN pg_roles r ON r.oid=a.usesysid
      WHERE a.pid<>pg_backend_pid() AND (r.rolname IN ('ot_v3_result_writer','ot_v3_result_reader','ot_v3_result_verifier')
        OR EXISTS(SELECT 1 FROM runtime_roles p WHERE p.role_oid=r.oid))) THEN
    RAISE EXCEPTION 'cycle4 controlled quiescence required' USING ERRCODE='P7923';
  END IF;
END $cycle4_context$;

CREATE TEMP TABLE cycle4_before(kind text PRIMARY KEY,value jsonb NOT NULL) ON COMMIT DROP;
DO $cycle4_predecessor$
DECLARE expected record; actual record; before_catalog jsonb; table_name text; row_count bigint; row_digest text; owner_name text;
BEGIN
  FOR expected IN SELECT * FROM (VALUES
    ('official_v3_intake_private.exact_keys_v1(jsonb,text[])','d3d8130512d809af7ec2578b88d30412e3dfec516a158c74f0a6fe1d09d486ba'),
    ('official_v3_intake_private.safe_data_v1(jsonb,integer)','bce43ae05fa0cff183a1de7afedd8bca5e16f0cfc3e160c9b83fec33d09f0abf'),
    ('official_v3_intake_private.binding_valid_v1(jsonb)','8f556b9db0b3786f9c247c9432a9e6a8631b66ee92019ac8aa082cf58aa4f7c1'),
    ('official_v3_intake_private.unique_json_v1(json,integer)','d9c536f2969d815c42b8cd00bbb7145808906519a575aff0dd9361f5070e7609'),
    ('official_v3_intake_private.proposal_shape_v1()','18259c9664e66a9d953e7ee6cf1a1e3decc7502a71832533eb68eb441a8728b9'),
    ('official_v3_intake_private.data_nodes_v1(jsonb,integer,integer,integer)','ca39c759aa56b45e6974d3fecf953b2bf4d679c2bffbf0783f366f42fd621b85'),
    ('official_v3_intake_private.shape_matches_v1(jsonb,jsonb,jsonb,jsonb,integer)','760ebdb9782c8709c0ede579e94c30f47a74840683772e11b04a2b3f74fc598a'),
    ('official_v3_intake_private.proposal_retainable_v1(jsonb)','d30b3540a097ab1832d09bdd67fa922efecaecbfdbae34eb3bfdbdca635cf797'),
    ('official_v3_intake_private.immutable_v1()','ff1c2db432d3aa48e50b7a043982831be983dc54c6ea16155f4d690a91dcdc86'),
    ('official_v3_intake_private.record_v1(text)','f34089ca87adef99d16d63de7391c5c200e770928c476304d8324b4beb1844f3'),
    ('official_v3_intake_api.capture_v1(jsonb,text,text)','bca5dcc14b315063bff32cad0122c0fc9e3efdc576c2b599f240f2a26d003b7a'),
    ('official_v3_intake_api.read_v1(jsonb,text,integer)','3c3cbff368a4e196247964d35a350ef1d554d685b2a807573aa4f987bfbe17d4'),
    ('official_v3_intake_api.reserve_v1(jsonb,text,integer,integer)','131aa90007cb6729f9925635c98e2145f690776a56031b77a7561a068af84222'),
    ('official_v3_intake_api.finish_v1(jsonb,text,integer,integer,uuid,jsonb,jsonb)','601ab19f1054f47a52505a69c8f7a00b38ff870825fe468f21f2cea034b811c4'),
    ('official_v3_result_private.exact_keys_v1(jsonb,text[])','ee7cf54b133b5ba633b55372c6f98b06058d3fbc4ffe8bda08813fc77865cc33'),
    ('official_v3_result_private.nodes_v1(jsonb,integer,integer,integer)','d2bf4eb545e4c0453f4511ed6585a7643b440ba58dfc35ff1192feeae72941e3'),
    ('official_v3_result_private.canonical_v1(jsonb,integer)','ae2e3d355bdd0474941339c110beb90cdf0629cd5693de477985691a26d7f9f6'),
    ('official_v3_result_private.civil_date_v1(text)','fd5ada592127225a2d995658a74f0ba58bd5b4e7e65301a9d656a07d50eb7ea8'),
    ('official_v3_result_private.timestamp_v1(text)','d2139f87c826b7eaaa7846b9812a6e056240d79650f365aad2733efb2947613c'),
    ('official_v3_result_private.predicate_v1(jsonb)','28c043c0fc46032e63286c74bc91945c0ed9eeff1a4a09a99263038f9450b4af'),
    ('official_v3_result_private.expression_v1(jsonb,boolean,integer)','f68a30dc702d07b13c07142c2208410ac39e077f8ecc2695f392d774e12bdb03'),
    ('official_v3_result_private.context_v1(jsonb)','d17e2c5e8e8c34561a47215ae9091ecf541e68035eebc8d4a444663b3e8cc845'),
    ('official_v3_result_private.subject_v1(text,jsonb)','608b0d0d62fd54f5ea0032bca8df46e71924e7c565e7000f5181c32029f90828'),
    ('official_v3_result_private.reference_v1(jsonb)','4e23eb880cfe724da64bdb0f3a395dacbff593e1bf6b20560e623b55cc441974'),
    ('official_v3_result_private.safe_data_v1(jsonb,integer)','fb0338ad099a3849e03670618b22b09e4e91a0f750c760a1a36a51c4fb929292'),
    ('official_v3_result_private.unique_json_v1(json,integer)','4ce9ae66bc89ec89dd5f684dcb36b8306e04dd9a2d73dc0576e0d8e70932fa83'),
    ('official_v3_result_private.proposal_shape_v1()','18259c9664e66a9d953e7ee6cf1a1e3decc7502a71832533eb68eb441a8728b9'),
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
    ('official_v3_result_private.assert_catalog_v1()','dac7c17f36163e0c0d6c068977e85fc35975a4621e67dceda234ca639fa945ed'),
    ('official_v3_result_private.selected_binding_v1()','07c52251c1bf1f38b251ed6cb33d834c7319cd7e7b43e14e44a478695043daad'),
    ('official_v3_result_private.state_v1()','1f181715fa3cb5a84b9fb6fad2658c92138b8e1ac0bed03de0a5d47b1df1b701'),
    ('official_v3_result_private.assert_history_v1()','9454a79fdebfce4cb63c60bb404bf6321a9fe7c09b825e9f6ce32e750f225c3a'),
    ('official_v3_result_private.original_v1(jsonb,jsonb)','357efc28a494fa8e002683e760cff7e7c8c05035914c5f40f5931272e0990e3d'),
    ('official_v3_result_private.observations_v1(jsonb)','f6be0f59dbcc0795f2afdf85f2bd13f7eae358f8782a3cfd01737890c713613a'),
    ('official_v3_result_private.verification_v1(jsonb,jsonb,boolean)','c3c1bda8bc1403bdb48423f454d5ea2fa324e6bea84127729b80b31f71c302d4'),
    ('official_v3_result_private.fence_v1(jsonb,integer,timestamptz,text,jsonb)','0a1813c8c4b290f07e7ac47db92c39880b53241dcd96ae6276c7fd4a31e39963'),
    ('official_v3_result_private.keep_original_v1(jsonb,jsonb)','43b1eb6dd9d99e45a4b1c3bed80d92b5d3c4390544f6394aaa61acf322be4d14'),
    ('official_v3_result_private.attest_v1(jsonb,jsonb,integer,timestamptz,text)','47a2a1b76f6c088f656c235f5becdfa6f5d23d0e6b4efea7b27a6b15ae4cac17'),
    ('official_v3_result_private.consume_s1_v1(jsonb,jsonb,jsonb)','d0738e696a066ffddfa725d27b1e3c8f81b4c73a5cb981a5e07460bc6db42ecd'),
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
    ('official_v3_result_private.command_v1(jsonb,jsonb)','365b04e28ffb7c6f6502f3af77f5afb7abf4d443d4a443c1f04f27128a1996c6'),
    ('official_v3_result_private.dispatch_v1(text,jsonb,text,text,integer,text,text,integer,integer,text,text)','eccdbd371a0b10f103f2d56902b21d94685e1413c3831e98a33859e8d97bab3f'),
    ('official_v3_jobs_private.exact_keys_v1(jsonb,text[])','ee7cf54b133b5ba633b55372c6f98b06058d3fbc4ffe8bda08813fc77865cc33'),
    ('official_v3_jobs_private.unique_json_v1(json,integer)','e7c99b47e34f4c422da0990f2378cb68289d9ac2c71bcb4ed8d933a20bf3f8ac'),
    ('official_v3_jobs_private.nodes_v1(jsonb,integer,integer,integer)','e28941594d643413964d19010b7ee9627bfee7bff904f76c28ddc246627ef6a9'),
    ('official_v3_jobs_private.canonical_v1(jsonb,integer)','f4a258c71cf8115a8ea5697e8b9c1735ebd1bc685170567dec5bc1aee89200ce'),
    ('official_v3_jobs_private.wire_v1(text)','8f8e72bc6487cb7885440aa2163fdb6bb2d2f352a5986e3ae5860570ea85930a'),
    ('official_v3_jobs_private.civil_date_v1(text)','fd5ada592127225a2d995658a74f0ba58bd5b4e7e65301a9d656a07d50eb7ea8'),
    ('official_v3_jobs_private.timestamp_v1(text)','98f15926f68b750a7839b6cae68c412cea716370bfb5d8b53f6fb1e7075ba988'),
    ('official_v3_jobs_private.predicate_v1(jsonb)','f4d7098f74d7257f49042b7ea56e9c4d64ee64d6a96c2d33adf9c6237b93305f'),
    ('official_v3_jobs_private.expression_v1(jsonb,boolean,integer)','759d342f9ee7f164f163fe9d55006564f6cffa7b3bb828bfa98257c34483dce0'),
    ('official_v3_jobs_private.context_v1(jsonb)','d13ef1168f3fd032298fdd563e6045acd85d3a948de45d9eae16bb352f22379e'),
    ('official_v3_jobs_private.subject_v1(text,jsonb)','ba126e5d789cbc5ef470f98fd8c33de0b0cb548688110037d43e48baaee4f922'),
    ('official_v3_jobs_private.job_v1(jsonb)','a34628ad65ba73caa89308cc819b8d1913d7b7e557bddf3b0a42cfef205cf800'),
    ('official_v3_jobs_private.command_v1(jsonb)','9e8167d51aa60a679d0b921c54b7524fde7b999620f466ba0dc61d93245aa48b'),
    ('official_v3_jobs_private.reference_v1(jsonb)','5d04a05d43200433df7361507388b5ee3944765035235490649291d3ade9213a'),
    ('official_v3_jobs_private.transition_v1(jsonb,jsonb,jsonb)','147cb10e9fd33e73082eaf43746552fa589e89db4b600a1fc927a2339f31b7f0'),
    ('official_v3_jobs_private.immutable_v1()','526c75203d670c57e7decab38466ab2a1048534bb4a16814f0e05e5c7fb47e27'),
    ('official_v3_jobs_private.consume_s1_v1(jsonb,jsonb,jsonb,text)','12e6ca30954f82a6628b58dd97db8de6599eb3118c90f34a45a96d4347c9a844'),
    ('official_v3_jobs_private.assert_history_v1(text)','33515f642611e5a0788e30f5a8744b91a6c7f14d374a613e53d2051836a72b4c'),
    ('official_v3_jobs_private.assert_catalog_v1()','c1f9fc5e7f3d4f0099b6e89e41d47df9165ec9b4e559807d1fff4db99bd25cfc'),
    ('official_v3_jobs_private.tx_queue_read_v1(jsonb,jsonb,integer,integer,timestamptz)','5aba833e05ecc71fa7daa4f579a6e982eddf8e67bd5306d9ef383c8a73d73b16'),
    ('official_v3_jobs_private.tx_queue_confirm_v1(jsonb,jsonb,integer,integer,timestamptz)','cc90f242fec962daa71edcf534c5f24eb72541571aadc42ff1d3704efe2ffc75'),
    ('official_v3_jobs_private.tx_execution_read_v1(jsonb,jsonb,integer,integer,timestamptz)','847ffa69cf6a2362fb5259953675b9f01b2fe059dbfd3ac30bb45d7be3fd635d'),
    ('official_v3_jobs_private.tx_execution_start_v1(jsonb,jsonb,integer,integer,timestamptz)','4c2762b15f062ff3a95bcddcdd9f3f31a29ab961e8dc6d13e0895d0eca017ca1'),
    ('official_v3_jobs_private.tx_execution_prepare_v1(jsonb,jsonb,integer,integer,timestamptz)','4fd077e6222bf925ec8d55b7e8cd53aa7703cf279583a9aaa810daca30255160'),
    ('official_v3_jobs_private.tx_queue_cas_v1(jsonb,jsonb,integer,integer,timestamptz)','1594e7681d06875e42ac601635561589ce89cdaf5ae4a5091b7a6a71c9ca27b7'),
    ('official_v3_jobs_api.execute_v1(text,text,integer,text,text,integer,integer,text)','7c7889672fbafc7d69bb32a655a93f419354fe0c49fc1b9b1f1d549b09545ad5'),
    ('official_v3_guard_private.immutable_v1()','912ce0a3cee4ab57ee76be8425053f5f42963db5a2943a76f0d49d70059f963b'),
    ('official_v3_guard_private.require_open_v1()','03783db299bd5416e090261ef6f67a6bfaf3132c181a2babf8a79ce08aa4a3a3'),
    ('official_v3_guard_private.check_control_v1()','8a37a92bd1293a467665da5831d717e7675650af9a2f5ef60e1cf57899a99eb4'),
    ('official_v3_guard_private.hrs_catalog_v1()','3044e759b31f412d4a879bf8b2f6b1ff742b8dd35a98261f541cc7139ad83082'),
    ('official_v3_guard_private.open_until_v1()','38a690b6246405e05f46cccca99753b4031d9efc78069c53afe83ae2cfab5aaf'),
    ('official_v3_guard_private.jobs_catalog_v1()','de9a66bdfa3749289ba6d37445899cca9aaf8919e8e1e5a36eefc2ecea71e57a'),
    ('official_v3_guard_private.intake_retired_v1(text)','b80e0ce79720f2fd56d4c20ea2bd5f85bb1233fea93ce4f5977c1d6ca4730290'),
    ('official_v3_guard_private.attempt_retired_v1(text)','343cd64c01c2ac5cd87a971d1134294902284908d988c64cb5513f1fd6a85cbe'),
    ('official_v3_guard_private.alarm_status_v1()','c0d610e700e6dd48b058256ef30bcee551f39a045e70e26429baaa7c3bc0f65b'),
    ('official_v3_guard_private.catalog_v1()','28a3e90b0e6be9db58d5910530437b4a76bd5950663d37a1cbcf8ced8545b1db'),
    ('official_v3_guard_private.assert_catalog_v1()','63cc1cedf81265c450f5c5e7e41fb954ff2129a86c15858b7e5cd2dbb627550d'),
    ('official_v3_guard_private.check_hma_v1()','917992aba6dd635fc0e5fd0c7afacd4456cb47a020ca01be80047687caf7127a'),
    ('official_v3_guard_private.check_s1_v1()','fe7647b8fc342215a286d4853af53c2a91dde01cb7f5dfd131a971d91ea03204'),
    ('official_v3_guard_private.check_method_link_v1(jsonb,timestamptz)','9be92d807c7c15c33a77746ef94fab25654dfb3af6a83d6641c37df35d5df074'),
    ('official_v3_guard_private.check_jobs_v1()','a5e9fca902cbc69cb1504467b743670c78a0f0f08e32dc512c8160d65fd2c7cc'),
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
    ('official_v3_guard_private.recovery_jobs_v1()','8c118cb0aa0ca68cb61d618787f676d885a71e9f996d2f8100d27634abd56cbd'),
    ('official_v3_guard_private.recovery_intake_v1(jsonb)','3f5b06793ede7510c6ef9d8c2289d2700eb29ba36b6c17fb7014725a06ab7628'),
    ('official_v3_guard_private.recovery_hrs_v1()','cb38910e4435f5872a2cf1a0b8b3ad558d59a15f8c7bb293115a31eded81e598'),
    ('official_v3_guard_private.recovery_snapshot_v1()','f832a1f60babe928f7bfc0194f8b970802b360c4ee977853981804e102383d24'),
    ('official_v3_guard_private.retired_state_v1(text)','a634ce72ec1cfbd427ec86406ac14d2753117898ea1b228393883d69782815b8'),
    ('official_v3_guard_private.close_jobs_v1(text)','80fb53bef7bf9223dabe4b4d7ae11d131b7cfd4e742510a78abf6f8ba70a1db2'),
    ('official_v3_guard_private.check_retired_jobs_v1(jsonb)','eefcddbb1f132e05e744d2fb74ca7e65fc62a2e946ce7f0f7c30527c49b0e3fb'),
    ('official_v3_guard_private.check_retired_s1_v1(jsonb)','8253e8ac077ddc59b962530bec8b731fc760eca26b2696b632f16238a46a3d74'),
    ('official_v3_guard_private.check_retired_hrs_v1(jsonb)','eeafd1406afeec9d84ddcc4b2a4c5bedefb1473d72871a483e911a68b48d91b9'),
    ('official_v3_guard_private.check_retirements_v1()','b12ac000dc279db3bccd4c9b256f28ad4b186af349da3027855340cd8ce46f7b'),
    ('official_v3_guard_private.incident_snapshot_v1()','4ba7e039404a7d288a2d2fa7d9d61419eb0d3c2e6383c6a662ffb2185a645960'),
    ('public.official_v3_guard_review_v1()','3f5cbf0a53c797a851d72d7d07c1f5deff4267d867c33249eff3b1b82316d359'),
    ('public.official_v3_guard_retire_v1(text,text)','0b72b6a61ad57a571ad9902d861a7e5b74dbdc102cee426614a3aaf986187550'),
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
    ('official_v3_guard_private.catalog_status_v1()','c23417ecf2a50291c347579546316c53ab4b1618b17c92a211022d63d41c6beb'),
    ('public.official_v3_guard_alarm_status_v1()','4419c74f593b9f320b5d347273529ca6c13c21297258ebda7226a09a1c76574d'),
    ('official_v3_guard_private.recovery_canonical_v1(jsonb,integer)','9ae0114402a4d9d45514b45508a03b4be6865ef92b13818acd96d244715e355d'),
    ('official_v3_jobs_private.rolling_usage_v2(text)','9658e2c50d2e37d96cf3cdb09dec3223df6f71256b26457961f217be5fba95b3'),
    ('official_v3_guard_private.ch_de_quota_v2()','ef1f6d904ca5742aaf212b82b3974a1f5ad4f88304eafb011ded94e1f7220372'),
    ('official_v3_jobs_private.tx_queue_claim_v1(jsonb,jsonb,integer,integer,timestamptz)','12b60c32ccf4a69b43f2bf788b1ee583aab978be01ea5099714dcc98cd3aedad'),
    ('official_v3_jobs_private.tx_queue_mutate_v1(jsonb,jsonb,integer,integer,timestamptz)','a1d38701d18e99e9ceee8369385a6bd637436ef52ee8e11688d110d3f32a2721'),
    ('jetnity_dev_import_scheduler.preserve_request_v1()','60af95f0d0646db2811a7121adc15bad39f5a2f37e8aca74420e0ab610277b5d'),
    ('jetnity_dev_import_scheduler.tick_v1()','354a5727d1e7f872e42cdda0e56f3f6411ccdf94993a9b9363429ea247e65dbe'),
    ('jetnity_dev_import_scheduler.maintain_preview_v1()','d6867e8594ca18caee69b11ffd536b1fcd143d58efa6090e3de2680675e7009d'),
    ('jetnity_dev_import_scheduler.run_v1()','f0caaffd0fa096df54ec94a59c846ecb0c2047f34f1183bb42ef58c5d5b028be'),
    ('jetnity_dev_import_scheduler.immutable_terminal_cycle2_review_v1()','c05f98814ca56c78f4b1c9adc46c46ac391d49d2c25c934e13c539c2bde27496'),
    ('jetnity_dev_import_scheduler.immutable_terminal_cycle3_review_v1()','8a03c9bf92fe2676e1fb602f9f1d7ab017c9d82dc6b32f619163a7043f6afa6f')
  ) f(signature,body_hash) LOOP
    SELECT * INTO actual FROM pg_proc WHERE oid=to_regprocedure(expected.signature);
    IF NOT FOUND OR encode(sha256(convert_to(actual.prosrc,'UTF8')),'hex') IS DISTINCT FROM expected.body_hash THEN
      RAISE EXCEPTION 'cycle4 predecessor definition mismatch: %',expected.signature USING ERRCODE='P7923';
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
  IF before_catalog IS DISTINCT FROM (SELECT catalog FROM official_v3_guard_private.refresh_retirement_baseline_v1 WHERE singleton) THEN
    RAISE EXCEPTION 'cycle4 predecessor catalog mismatch' USING ERRCODE='P7923';
  END IF;
  PERFORM official_v3_guard_private.assert_catalog_v1();
  PERFORM official_v3_guard_private.check_control_v1();
  PERFORM official_v3_guard_private.check_hma_v1();
  PERFORM official_v3_guard_private.check_s1_v1();
  PERFORM official_v3_guard_private.check_jobs_v1();
  PERFORM official_v3_guard_private.check_hrs_v1();
  PERFORM official_v3_guard_private.check_certificates_v1();
  PERFORM official_v3_guard_private.check_retirements_v1();
  INSERT INTO pg_temp.cycle4_before VALUES('catalog',before_catalog),
    ('roles',COALESCE((SELECT jsonb_agg(to_jsonb(r) ORDER BY r.oid) FROM pg_roles r),'[]'::jsonb)),
    ('memberships',COALESCE((SELECT jsonb_agg(to_jsonb(m) ORDER BY m.oid) FROM pg_auth_members m),'[]'::jsonb)),
    ('schema_acl',(SELECT jsonb_build_object('owner',nspowner,'acl',nspacl) FROM pg_namespace WHERE nspname='official_v3_guard_private')),
    ('content',jsonb_build_object('hma',official_v3_guard_private.content_digest_v1('hma'),
      's1',official_v3_guard_private.content_digest_v1('s1'),'jobs',official_v3_guard_private.content_digest_v1('jobs'),
      'hrs',official_v3_guard_private.hrs_certificate_v1()));
  -- Do not UPDATE or revoke the bootstrap grantor's ADMIN-only edges. Only a
  -- new postgres-grantor SET-only edge is admitted and later removed exactly.
  FOREACH owner_name IN ARRAY ARRAY['ot_v3_jobs_owner','ot_v3_result_owner'] LOOP
    IF (SELECT count(*) FROM pg_auth_members WHERE roleid=to_regrole(owner_name) AND member='postgres'::regrole)<>1
      OR NOT EXISTS(SELECT 1 FROM pg_auth_members WHERE roleid=to_regrole(owner_name) AND member='postgres'::regrole
        AND grantor<>'postgres'::regrole AND admin_option AND NOT inherit_option AND NOT set_option)
      OR pg_has_role('postgres',to_regrole(owner_name),'USAGE') IS DISTINCT FROM false
      OR pg_has_role('postgres',to_regrole(owner_name),'SET') IS DISTINCT FROM false
      OR has_schema_privilege(to_regrole(owner_name),'official_v3_guard_private','CREATE') IS DISTINCT FROM false THEN
      RAISE EXCEPTION 'cycle4 exact original owner authority required' USING ERRCODE='P7923';
    END IF;
  END LOOP;
  -- Include every existing private history/baseline and, when installed, every
  -- sender/review table. No auth/profile data or credential is read.
  FOR table_name IN SELECT format('%I.%I',n.nspname,c.relname)
    FROM pg_class c JOIN pg_namespace n ON n.oid=c.relnamespace
    WHERE c.relkind IN ('r','p') AND n.nspname IN ('official_v3_method_private','official_v3_intake_private',
      'official_v3_jobs_private','official_v3_result_private','official_v3_guard_private','jetnity_dev_import_scheduler')
    ORDER BY n.nspname COLLATE "C",c.relname COLLATE "C" LOOP
    -- The existing component checks already hold their owner-authorized SHARE
    -- locks. These SELECT-authorized locks additionally prevent old-table DDL.
    EXECUTE format('LOCK TABLE %s IN ACCESS SHARE MODE',table_name::regclass);
    EXECUTE format('SELECT count(*),encode(sha256(convert_to(COALESCE(string_agg(encode(sha256(convert_to(to_jsonb(r)::text,''UTF8'')),''hex''),'''' ORDER BY to_jsonb(r)::text COLLATE "C"),''''),''UTF8'')),''hex'') FROM %s r',table_name::regclass)
      INTO row_count,row_digest;
    INSERT INTO pg_temp.cycle4_before VALUES('table:'||table_name,jsonb_build_object('count',row_count,'digest',row_digest));
  END LOOP;
END $cycle4_predecessor$;


GRANT ot_v3_jobs_owner TO postgres WITH ADMIN FALSE, INHERIT FALSE, SET TRUE GRANTED BY postgres;

GRANT ot_v3_result_owner TO postgres WITH ADMIN FALSE, INHERIT FALSE, SET TRUE GRANTED BY postgres;

GRANT CREATE ON SCHEMA official_v3_guard_private TO ot_v3_jobs_owner,ot_v3_result_owner;

CREATE TABLE official_v3_guard_private.retired_cycle4_attempts_v1 (
  attempt_key text PRIMARY KEY CHECK(attempt_key='execution-attempt:v3:89720170633a22f22effbf861d9b7c18a465546b43999375f567145a1449d3de'),
  job_key text NOT NULL CHECK(job_key='research-job:v3:74713fe665cab1a7603f6e93ab06b6a1d1964e83a69571b8cced0ff009032513'),
  claim_operation_id text NOT NULL UNIQUE CHECK(claim_operation_id='op3_2b7811ed9b5f488cbffcd09a0ec0409b'),
  intake_operation_id text NOT NULL UNIQUE CHECK(intake_operation_id='op3_90bd61aa6d32e79273bdd923f1851576'),
  owner_operation_id text NOT NULL UNIQUE CHECK(owner_operation_id ~ '^op3_[a-f0-9]{32}$'),
  before_state jsonb NOT NULL CHECK(octet_length(before_state::text)<=131072 AND before_state->>'kind'='ch_de_cycle4_unknown'),
  retired_at timestamptz NOT NULL CHECK(isfinite(retired_at))
);
CREATE TABLE official_v3_guard_private.cycle4_recovery_baseline_v1 (
  singleton boolean PRIMARY KEY DEFAULT true CHECK(singleton),
  predecessor_provider_digest text NOT NULL CHECK(predecessor_provider_digest='e71c729360c0e36e7d3a00504b8f013d716ef33c76ae35c9e8fbb484d01c67fe'),
  predecessor_catalog_digest text NOT NULL CHECK(predecessor_catalog_digest ~ '^[a-f0-9]{64}$'),
  predecessor_refresh_digest text NOT NULL CHECK(predecessor_refresh_digest ~ '^[a-f0-9]{64}$'),
  original_evidence_digest text NOT NULL CHECK(original_evidence_digest='5829475017f545d3ba1573de7d94593754bfc280262b9c7dd44a04d66cad3f14'),
  required_generation bigint NOT NULL CHECK(required_generation>0),
  proof_not_before timestamptz NOT NULL CHECK(isfinite(proof_not_before)),
  jobs_catalog jsonb NOT NULL,
  hrs_catalog jsonb NOT NULL,
  catalog jsonb NOT NULL
);
DO $cycle4_tables$
DECLARE table_name text;
BEGIN
  FOREACH table_name IN ARRAY ARRAY['retired_cycle4_attempts_v1','cycle4_recovery_baseline_v1'] LOOP
    EXECUTE format('ALTER TABLE official_v3_guard_private.%I ENABLE ROW LEVEL SECURITY',table_name);
    EXECUTE format('ALTER TABLE official_v3_guard_private.%I FORCE ROW LEVEL SECURITY',table_name);
    EXECUTE format('CREATE POLICY owner_only ON official_v3_guard_private.%I TO postgres USING(true) WITH CHECK(true)',table_name);
    EXECUTE format('CREATE TRIGGER immutable_v1 BEFORE UPDATE OR DELETE ON official_v3_guard_private.%I FOR EACH ROW EXECUTE FUNCTION official_v3_guard_private.immutable_v1()',table_name);
    EXECUTE format('CREATE TRIGGER immutable_truncate_v1 BEFORE TRUNCATE ON official_v3_guard_private.%I FOR EACH STATEMENT EXECUTE FUNCTION official_v3_guard_private.immutable_v1()',table_name);
    EXECUTE format('REVOKE ALL ON TABLE official_v3_guard_private.%I FROM PUBLIC,anon,authenticated,service_role,supabase_read_only_user,ot_v3_jobs_owner,ot_v3_result_owner,ot_v3_intake_owner',table_name);
  END LOOP;
END $cycle4_tables$;


SET LOCAL ROLE ot_v3_jobs_owner;
CREATE OR REPLACE FUNCTION official_v3_guard_private.recovery_jobs_v1() RETURNS jsonb
LANGUAGE plpgsql VOLATILE SECURITY DEFINER SET search_path=pg_catalog AS $cycle4_body$
DECLARE s official_v3_jobs_private.subjects_v1%ROWTYPE; t official_v3_jobs_private.execution_starts_v1%ROWTYPE;
  c official_v3_jobs_private.queue_operations_v1%ROWTYPE; prior record; held jsonb; preceding jsonb:='[]';
  n integer; expected integer:=1; fence jsonb; seed text; input_revision text; candidate jsonb;
BEGIN
  SELECT * INTO STRICT s FROM official_v3_jobs_private.subjects_v1
    WHERE kind='rule_research' AND current_job->>'contextKey'='official-truth-context:v3:bfce3bc64dbd7c670441e05033c31f339e03a2c488ab54937320508333c252c2' FOR UPDATE;
  IF s.open_attempt='execution-attempt:v3:3a32cf934505f82ba078e4e41afa60c4f47c2fa29e53be1f33a2976bf5d69aea' THEN
    PERFORM official_v3_jobs_private.assert_history_v1(s.job_key);
    SELECT * INTO STRICT t FROM official_v3_jobs_private.execution_starts_v1 WHERE attempt_key=s.open_attempt FOR SHARE;
    SELECT * INTO STRICT c FROM official_v3_jobs_private.queue_operations_v1 WHERE operation_id=t.claim_operation_id FOR SHARE;
    IF to_jsonb(s) IS DISTINCT FROM '{"kind":"rule_research","job_key":"research-job:v3:74713fe665cab1a7603f6e93ab06b6a1d1964e83a69571b8cced0ff009032513","slot_id":1,"current_job":{"kind":"research_job_record","jobId":"job3_e1467267780885ae38068e6be1738958","lease":{"leaseId":"lease3_1d7d014131bb4d42a09058b719edfaf5","expiresAt":"2026-11-15T10:45:56.164Z","acquiredAt":"2026-11-15T10:45:26.164Z","generation":37},"state":"leased","jobKey":"research-job:v3:74713fe665cab1a7603f6e93ab06b6a1d1964e83a69571b8cced0ff009032513","method":{"methodId":"jetnity-destination-primary-ch-de-visa","revision":1},"schema":3,"attempt":1,"context":{"route":"direct_entry","scope":{"validity":{"mode":"not_applicable"},"residence":{"mode":"not_applicable"},"citizenship":{"mode":"required","countryCodes":["CH"]},"requirementType":"visa","credentialOption":{"mode":"option","documentType":"passport","issuingCountryCode":"CH","relatedCitizenshipCountryCode":"CH"},"transitCountryCode":null,"destinationCountryCode":"DE"},"conditions":{"status":"unconditional"}},"research":{"key":"research-request:v1:b682f1de48389c7d5a3ac0d39fa4406d0e3796be91fb6e253bfd5a45cf7f945a","factKind":"requirement_effect","ruleScopeKey":"rule-scope:v1:3a24b4bc807a384b6d08e105f1107cc45d6d83c07c75eff01bc0ffc43f61477f","researchReason":{"status":"missing"}},"revision":37,"createdAt":"2026-11-15T10:45:20.652Z","updatedAt":"2026-11-15T10:45:26.164Z","contextKey":"official-truth-context:v3:bfce3bc64dbd7c670441e05033c31f339e03a2c488ab54937320508333c252c2","lastFailure":null,"operationId":"op3_3c550f64e49d0b2b1af14f09edca65c1","attemptLimit":4,"nextAttemptAt":null,"resultDecisionRef":null,"predecessorRevision":36},"start_count":9,"open_attempt":"execution-attempt:v3:3a32cf934505f82ba078e4e41afa60c4f47c2fa29e53be1f33a2976bf5d69aea","subject_text":"{\"context\":{\"conditions\":{\"status\":\"unconditional\"},\"route\":\"direct_entry\",\"scope\":{\"citizenship\":{\"countryCodes\":[\"CH\"],\"mode\":\"required\"},\"credentialOption\":{\"documentType\":\"passport\",\"issuingCountryCode\":\"CH\",\"mode\":\"option\",\"relatedCitizenshipCountryCode\":\"CH\"},\"destinationCountryCode\":\"DE\",\"requirementType\":\"visa\",\"residence\":{\"mode\":\"not_applicable\"},\"transitCountryCode\":null,\"validity\":{\"mode\":\"not_applicable\"}}},\"factKind\":\"requirement_effect\",\"kind\":\"rule_research\",\"method\":{\"methodId\":\"jetnity-destination-primary-ch-de-visa\",\"revision\":1}}","method_binding":{"methodId":"jetnity-destination-primary-ch-de-visa","revision":1,"methodDigest":"44ce02752da05796bef98c55b5099b81f915fe6b0975472e163721a06793bdb3","packageDigest":"0beb25db2e1f6e4c2c96d61ded30b59a8e06a32ed94498903fbeecc3b6f267e9"},"operation_count":41,"terminal_credit_claim":"op3_af6a4ab203d24be7869136eec570468e"}'::jsonb
      OR t.leased_job IS DISTINCT FROM s.current_job OR t.job_key IS DISTINCT FROM s.job_key
      OR t.claim_operation_id IS DISTINCT FROM 'op3_af6a4ab203d24be7869136eec570468e'
      OR t.claim_text::jsonb IS DISTINCT FROM '{"jobKey":"research-job:v3:74713fe665cab1a7603f6e93ab06b6a1d1964e83a69571b8cced0ff009032513","leaseId":"lease3_1d7d014131bb4d42a09058b719edfaf5","leaseMilliseconds":30000,"operationId":"op3_af6a4ab203d24be7869136eec570468e"}'::jsonb
      OR t.authority IS DISTINCT FROM s.method_binding||jsonb_build_object('epoch',1)
      OR t.reserved_at IS DISTINCT FROM '2026-11-15T10:45:28.476004+00:00'::timestamptz
      OR c.action IS DISTINCT FROM 'claim' OR c.job_key IS DISTINCT FROM s.job_key
      OR c.envelope_text::jsonb->'next' IS DISTINCT FROM t.leased_job
      OR EXISTS(SELECT 1 FROM official_v3_jobs_private.execution_results_v1 WHERE attempt_key=t.attempt_key)
      OR EXISTS(SELECT 1 FROM official_v3_jobs_private.execution_dispositions_v1 WHERE attempt_key=t.attempt_key)
      OR clock_timestamp()<=(t.leased_job#>>'{lease,expiresAt}')::timestamptz THEN
      RAISE EXCEPTION 'bg1 exact expired refresh original required' USING ERRCODE='P7906';
    END IF;
    fence:=jsonb_build_object('jobId',t.leased_job->'jobId','revision',t.leased_job->'revision',
      'leaseId',t.leased_job#>'{lease,leaseId}','generation',t.leased_job#>'{lease,generation}');
    RETURN jsonb_build_object('refreshScope','ch_de_refresh_unknown','attemptKey',t.attempt_key,
      'jobKey',t.job_key,'claimOperationId',t.claim_operation_id,'claim',t.claim_text::jsonb,
      'leasedJob',t.leased_job,'authority',t.authority,'fence',fence,'subjectState',to_jsonb(s),
      'startCount',s.start_count,'operationCount',s.operation_count,
      'startDigest',encode(sha256(convert_to((to_jsonb(t)||jsonb_build_object('reserved_at',extract(epoch FROM t.reserved_at)))::text,'UTF8')),'hex'),
      'claimDigest',encode(sha256(convert_to((to_jsonb(c)||jsonb_build_object('recorded_at',extract(epoch FROM c.recorded_at)))::text,'UTF8')),'hex'),
      'intakeOperationId','op3_7e003b5a015c26976fbdf3fed1b8d494','deliveryId','delivery3_797ef30884c5f6c03e5b1f416c6c0c83','runnerId','runner3_90922ba96f3470f827630bccb857f7b1',
      'inputRevision','snapshot:0beb25db2e1f6e4c2c96d61ded30b59a8e06a32ed94498903fbeecc3b6f267e9');
  END IF;
  IF s.open_attempt='execution-attempt:v3:89720170633a22f22effbf861d9b7c18a465546b43999375f567145a1449d3de' THEN
    PERFORM official_v3_jobs_private.assert_history_v1(s.job_key);
    SELECT * INTO STRICT t FROM official_v3_jobs_private.execution_starts_v1 WHERE attempt_key=s.open_attempt FOR SHARE;
    SELECT * INTO STRICT c FROM official_v3_jobs_private.queue_operations_v1 WHERE operation_id=t.claim_operation_id FOR SHARE;
    IF to_jsonb(s) IS DISTINCT FROM '{"kind":"rule_research","job_key":"research-job:v3:74713fe665cab1a7603f6e93ab06b6a1d1964e83a69571b8cced0ff009032513","slot_id":1,"current_job":{"kind":"research_job_record","jobId":"job3_c70d23ff344cdf2998818ecf5243d15e","lease":{"leaseId":"lease3_491cf756e95d47e0892613c0e81c556b","expiresAt":"2026-11-15T16:37:34.504Z","acquiredAt":"2026-11-15T16:37:04.504Z","generation":41},"state":"leased","jobKey":"research-job:v3:74713fe665cab1a7603f6e93ab06b6a1d1964e83a69571b8cced0ff009032513","method":{"methodId":"jetnity-destination-primary-ch-de-visa","revision":1},"schema":3,"attempt":1,"context":{"route":"direct_entry","scope":{"validity":{"mode":"not_applicable"},"residence":{"mode":"not_applicable"},"citizenship":{"mode":"required","countryCodes":["CH"]},"requirementType":"visa","credentialOption":{"mode":"option","documentType":"passport","issuingCountryCode":"CH","relatedCitizenshipCountryCode":"CH"},"transitCountryCode":null,"destinationCountryCode":"DE"},"conditions":{"status":"unconditional"}},"research":{"key":"research-request:v1:b682f1de48389c7d5a3ac0d39fa4406d0e3796be91fb6e253bfd5a45cf7f945a","factKind":"requirement_effect","ruleScopeKey":"rule-scope:v1:3a24b4bc807a384b6d08e105f1107cc45d6d83c07c75eff01bc0ffc43f61477f","researchReason":{"status":"missing"}},"revision":41,"createdAt":"2026-11-15T16:36:02.293Z","updatedAt":"2026-11-15T16:37:04.504Z","contextKey":"official-truth-context:v3:bfce3bc64dbd7c670441e05033c31f339e03a2c488ab54937320508333c252c2","lastFailure":null,"operationId":"op3_91a38dc806d3f21bac3d9d16493c6be6","attemptLimit":4,"nextAttemptAt":null,"resultDecisionRef":null,"predecessorRevision":40},"start_count":11,"open_attempt":"execution-attempt:v3:89720170633a22f22effbf861d9b7c18a465546b43999375f567145a1449d3de","subject_text":"{\"context\":{\"conditions\":{\"status\":\"unconditional\"},\"route\":\"direct_entry\",\"scope\":{\"citizenship\":{\"countryCodes\":[\"CH\"],\"mode\":\"required\"},\"credentialOption\":{\"documentType\":\"passport\",\"issuingCountryCode\":\"CH\",\"mode\":\"option\",\"relatedCitizenshipCountryCode\":\"CH\"},\"destinationCountryCode\":\"DE\",\"requirementType\":\"visa\",\"residence\":{\"mode\":\"not_applicable\"},\"transitCountryCode\":null,\"validity\":{\"mode\":\"not_applicable\"}}},\"factKind\":\"requirement_effect\",\"kind\":\"rule_research\",\"method\":{\"methodId\":\"jetnity-destination-primary-ch-de-visa\",\"revision\":1}}","method_binding":{"methodId":"jetnity-destination-primary-ch-de-visa","revision":1,"methodDigest":"44ce02752da05796bef98c55b5099b81f915fe6b0975472e163721a06793bdb3","packageDigest":"0beb25db2e1f6e4c2c96d61ded30b59a8e06a32ed94498903fbeecc3b6f267e9"},"operation_count":45,"terminal_credit_claim":"op3_2b7811ed9b5f488cbffcd09a0ec0409b"}'::jsonb
      OR t.leased_job IS DISTINCT FROM s.current_job OR t.job_key IS DISTINCT FROM s.job_key
      OR t.claim_operation_id IS DISTINCT FROM 'op3_2b7811ed9b5f488cbffcd09a0ec0409b'
      OR t.claim_text::jsonb IS DISTINCT FROM '{"jobKey":"research-job:v3:74713fe665cab1a7603f6e93ab06b6a1d1964e83a69571b8cced0ff009032513","leaseId":"lease3_491cf756e95d47e0892613c0e81c556b","leaseMilliseconds":30000,"operationId":"op3_2b7811ed9b5f488cbffcd09a0ec0409b"}'::jsonb
      OR t.authority IS DISTINCT FROM s.method_binding||jsonb_build_object('epoch',1)
      OR t.reserved_at IS DISTINCT FROM '2026-11-15T16:37:06.497224+00:00'::timestamptz
      OR c.action IS DISTINCT FROM 'claim' OR c.job_key IS DISTINCT FROM s.job_key
      OR c.envelope_text::jsonb->'next' IS DISTINCT FROM t.leased_job
      OR EXISTS(SELECT 1 FROM official_v3_jobs_private.execution_results_v1 WHERE attempt_key=t.attempt_key)
      OR EXISTS(SELECT 1 FROM official_v3_jobs_private.execution_dispositions_v1 WHERE attempt_key=t.attempt_key)
      OR clock_timestamp()<=(t.leased_job#>>'{lease,expiresAt}')::timestamptz THEN
      RAISE EXCEPTION 'bg1 exact expired cycle4 original required' USING ERRCODE='P7906';
    END IF;
    fence:=jsonb_build_object('jobId',t.leased_job->'jobId','revision',t.leased_job->'revision',
      'leaseId',t.leased_job#>'{lease,leaseId}','generation',t.leased_job#>'{lease,generation}');
    RETURN jsonb_build_object('cycle4Scope','ch_de_cycle4_unknown','attemptKey',t.attempt_key,
      'jobKey',t.job_key,'claimOperationId',t.claim_operation_id,'claim',t.claim_text::jsonb,
      'leasedJob',t.leased_job,'authority',t.authority,'fence',fence,'subjectState',to_jsonb(s),
      'startCount',s.start_count,'operationCount',s.operation_count,
      'startDigest',encode(sha256(convert_to((to_jsonb(t)||jsonb_build_object('reserved_at',extract(epoch FROM t.reserved_at)))::text,'UTF8')),'hex'),
      'claimDigest',encode(sha256(convert_to((to_jsonb(c)||jsonb_build_object('recorded_at',extract(epoch FROM c.recorded_at)))::text,'UTF8')),'hex'),
      'intakeOperationId','op3_90bd61aa6d32e79273bdd923f1851576','deliveryId','delivery3_327549dd1c368966041a04ef1bb4540a','runnerId','runner3_90922ba96f3470f827630bccb857f7b1',
      'inputRevision','snapshot:0beb25db2e1f6e4c2c96d61ded30b59a8e06a32ed94498903fbeecc3b6f267e9');
  END IF;
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
END $cycle4_body$;
RESET ROLE;

SET LOCAL ROLE ot_v3_result_owner;
CREATE OR REPLACE FUNCTION official_v3_guard_private.recovery_hrs_v1() RETURNS jsonb
LANGUAGE plpgsql VOLATILE SECURITY DEFINER SET search_path=pg_catalog AS $cycle4_body$
DECLARE h official_v3_result_private.heads_v1%ROWTYPE; certificate text; q record; inventory jsonb;
BEGIN
  PERFORM pg_advisory_xact_lock(771105,2);
  SELECT * INTO STRICT h FROM official_v3_result_private.heads_v1 WHERE singleton FOR UPDATE;
  PERFORM official_v3_guard_private.check_hrs_v1();
  IF h.version_ref='rule-version:v3:748250a8d3286904ec156d6ab6761a3050621a1039c4194a281765655d10d553' THEN
    IF to_jsonb(h) IS DISTINCT FROM '{"coverage":true,"singleton":true,"generation":12,"context_key":"official-truth-context:v3:bfce3bc64dbd7c670441e05033c31f339e03a2c488ab54937320508333c252c2","suppression":null,"version_ref":"rule-version:v3:748250a8d3286904ec156d6ab6761a3050621a1039c4194a281765655d10d553","decision_ref":"source-decision:v3:5f232330d22f8ec66453a05eedfc06006821dc330a6d5c96475362006fd97d33","projection_ref":"rule-projection:v3:977f22b8940fbee874274fa3b900efbbcf8134884474a8f1be2d26c4d3af2009","suppression_epoch":6,"sticky_decision_ref":null}'::jsonb
      OR (SELECT count(*) FROM official_v3_result_private.versions_v1)<>6
      OR (SELECT count(*) FROM official_v3_result_private.projections_v1)<>6
      OR (SELECT count(*) FROM official_v3_result_private.operations_v1 WHERE operation_kind='publication')<>6
      OR EXISTS(SELECT 1 FROM official_v3_result_private.operations_v1
        WHERE operation_id='op3_90bd61aa6d32e79273bdd923f1851576' OR command#>>'{intake,binding,operationId}'='op3_90bd61aa6d32e79273bdd923f1851576')
      OR EXISTS(SELECT 1 FROM official_v3_result_private.versions_v1 WHERE prepared#>>'{transition,operationId}'='op3_90bd61aa6d32e79273bdd923f1851576') THEN
      RAISE EXCEPTION 'bg1 exact previous cycle4 publications required' USING ERRCODE='P7906';
    END IF;
    SELECT * INTO STRICT q FROM official_v3_result_private.qualifications_v1 WHERE reference='hrs1-verification:v3:92b30e2ec7f318c09dfdf56f10bf819d2ef0a96ac0bdd0b4b242d37e605d559d';
    IF q.kind IS DISTINCT FROM 'verification' OR q.decision_ref IS DISTINCT FROM 'source-decision:v3:762f84fdcf571cf33ab651f76cb2ef000bf559cca40b402a37cfa37ce5f05c07'
      OR q.original_ids IS DISTINCT FROM '["ev2_769df91455e7e468be9c569847f96a05","ev2_d87855f85879c16b478449eab7e18e21"]'::jsonb
      OR q.record#>'{history,pointer}' IS DISTINCT FROM '{"state":"accepted","revision":6,"versionRef":"rule-version:v3:748250a8d3286904ec156d6ab6761a3050621a1039c4194a281765655d10d553"}'::jsonb THEN
      RAISE EXCEPTION 'bg1 exact cycle4 source qualification required' USING ERRCODE='P7906';
    END IF;
    PERFORM official_v3_result_private.verification_v1(q.record,official_v3_result_private.selected_binding_v1(),false);
    SELECT jsonb_build_object('originals',COALESCE((SELECT jsonb_agg(jsonb_build_object('id',r.version_id,'digest',encode(sha256(convert_to(to_jsonb(r)::text,'UTF8')),'hex')) ORDER BY r.version_id COLLATE "C") FROM official_v3_result_private.originals_v1 r),'[]'::jsonb),
'extractions',COALESCE((SELECT jsonb_agg(jsonb_build_object('id',r.version_id,'digest',encode(sha256(convert_to(to_jsonb(r)::text,'UTF8')),'hex')) ORDER BY r.version_id COLLATE "C") FROM official_v3_result_private.extractions_v1 r),'[]'::jsonb),
'qualifications',COALESCE((SELECT jsonb_agg(jsonb_build_object('id',r.reference,'digest',encode(sha256(convert_to((to_jsonb(r)||jsonb_build_object('valid_until',extract(epoch FROM r.valid_until)))::text,'UTF8')),'hex')) ORDER BY r.reference COLLATE "C") FROM official_v3_result_private.qualifications_v1 r),'[]'::jsonb),
'decisions',COALESCE((SELECT jsonb_agg(jsonb_build_object('id',r.reference,'digest',encode(sha256(convert_to(to_jsonb(r)::text,'UTF8')),'hex')) ORDER BY r.reference COLLATE "C") FROM official_v3_result_private.decisions_v1 r),'[]'::jsonb),
'archive_pages',COALESCE((SELECT jsonb_agg(jsonb_build_object('id',r.reference,'digest',encode(sha256(convert_to(to_jsonb(r)::text,'UTF8')),'hex')) ORDER BY r.reference COLLATE "C") FROM official_v3_result_private.archive_pages_v1 r),'[]'::jsonb),
'versions',COALESCE((SELECT jsonb_agg(jsonb_build_object('id',r.reference,'digest',encode(sha256(convert_to((to_jsonb(r)||jsonb_build_object('committed_at',extract(epoch FROM r.committed_at)))::text,'UTF8')),'hex')) ORDER BY r.reference COLLATE "C") FROM official_v3_result_private.versions_v1 r),'[]'::jsonb),
'projections',COALESCE((SELECT jsonb_agg(jsonb_build_object('id',r.reference,'digest',encode(sha256(convert_to((to_jsonb(r)||jsonb_build_object('published_at',extract(epoch FROM r.published_at)))::text,'UTF8')),'hex')) ORDER BY r.reference COLLATE "C") FROM official_v3_result_private.projections_v1 r),'[]'::jsonb),
'operations',COALESCE((SELECT jsonb_agg(jsonb_build_object('id',jsonb_build_array(r.operation_kind,r.operation_id),'digest',encode(sha256(convert_to((to_jsonb(r)||jsonb_build_object('recorded_at',extract(epoch FROM r.recorded_at)))::text,'UTF8')),'hex')) ORDER BY r.operation_kind COLLATE "C",r.operation_id COLLATE "C") FROM official_v3_result_private.operations_v1 r),'[]'::jsonb),
'outbox',COALESCE((SELECT jsonb_agg(jsonb_build_object('id',r.escalation_key,'digest',encode(sha256(convert_to((to_jsonb(r)||jsonb_build_object('recorded_at',extract(epoch FROM r.recorded_at)))::text,'UTF8')),'hex')) ORDER BY r.escalation_key COLLATE "C") FROM official_v3_result_private.outbox_v1 r),'[]'::jsonb)) INTO inventory;
    SELECT state_certificate INTO certificate FROM official_v3_result_private.binding_v1 WHERE singleton;
    RETURN jsonb_build_object('head',to_jsonb(h),'certificate',certificate,
      'originals',2,'qualifications',1,'versions',0,'publications',0,
      'priorVersions',6,'priorPublications',6,'qualificationRef',q.reference,'decisionRef',q.decision_ref,'inventory',inventory);
  END IF;
  IF h.version_ref IS NOT NULL THEN
    IF to_jsonb(h) IS DISTINCT FROM '{"coverage":true,"singleton":true,"generation":10,"context_key":"official-truth-context:v3:bfce3bc64dbd7c670441e05033c31f339e03a2c488ab54937320508333c252c2","suppression":null,"version_ref":"rule-version:v3:71c3cf2d28c3b59117b355ae195b621198f2672fc4781b52fe3f90b4c4bed492","decision_ref":"source-decision:v3:b85d8662f371a5e095f1407af339d9ad50db66a6ab6ec930be8f789475a593af","projection_ref":"rule-projection:v3:6dab3b5cb3b9d9e5fcdbc4bd4b8040e30c9b1cdb2f25972ab1e4c9b5a7b62e69","suppression_epoch":5,"sticky_decision_ref":null}'::jsonb
      OR (SELECT count(*) FROM official_v3_result_private.versions_v1)<>5
      OR (SELECT count(*) FROM official_v3_result_private.projections_v1)<>5
      OR (SELECT count(*) FROM official_v3_result_private.operations_v1 WHERE operation_kind='publication')<>5
      OR EXISTS(SELECT 1 FROM official_v3_result_private.operations_v1
        WHERE operation_id='op3_7e003b5a015c26976fbdf3fed1b8d494' OR command#>>'{intake,binding,operationId}'='op3_7e003b5a015c26976fbdf3fed1b8d494')
      OR EXISTS(SELECT 1 FROM official_v3_result_private.versions_v1 WHERE prepared#>>'{transition,operationId}'='op3_7e003b5a015c26976fbdf3fed1b8d494') THEN
      RAISE EXCEPTION 'bg1 exact previous refresh publications required' USING ERRCODE='P7906';
    END IF;
    SELECT * INTO STRICT q FROM official_v3_result_private.qualifications_v1 WHERE reference='hrs1-verification:v3:bad827be07120532e251a637ca3319603bf883e7f02f398eaab0a0332f3f1004';
    IF q.kind IS DISTINCT FROM 'verification' OR q.decision_ref IS DISTINCT FROM 'source-decision:v3:af2792470ac0868ed30a6d2ffab5a0eddef79c9226f65a5102a73e4c822b924d'
      OR q.original_ids IS DISTINCT FROM '["ev2_4e1f434d8d93fbed1f83432b91931026","ev2_492c8a656dcfd58796bd78fbc032ac0b"]'::jsonb
      OR q.record#>'{history,pointer}' IS DISTINCT FROM '{"state":"accepted","revision":5,"versionRef":"rule-version:v3:71c3cf2d28c3b59117b355ae195b621198f2672fc4781b52fe3f90b4c4bed492"}'::jsonb THEN
      RAISE EXCEPTION 'bg1 exact refresh source qualification required' USING ERRCODE='P7906';
    END IF;
    PERFORM official_v3_result_private.verification_v1(q.record,official_v3_result_private.selected_binding_v1(),false);
    SELECT jsonb_build_object('originals',COALESCE((SELECT jsonb_agg(jsonb_build_object('id',r.version_id,'digest',encode(sha256(convert_to(to_jsonb(r)::text,'UTF8')),'hex')) ORDER BY r.version_id COLLATE "C") FROM official_v3_result_private.originals_v1 r),'[]'::jsonb),
'extractions',COALESCE((SELECT jsonb_agg(jsonb_build_object('id',r.version_id,'digest',encode(sha256(convert_to(to_jsonb(r)::text,'UTF8')),'hex')) ORDER BY r.version_id COLLATE "C") FROM official_v3_result_private.extractions_v1 r),'[]'::jsonb),
'qualifications',COALESCE((SELECT jsonb_agg(jsonb_build_object('id',r.reference,'digest',encode(sha256(convert_to((to_jsonb(r)||jsonb_build_object('valid_until',extract(epoch FROM r.valid_until)))::text,'UTF8')),'hex')) ORDER BY r.reference COLLATE "C") FROM official_v3_result_private.qualifications_v1 r),'[]'::jsonb),
'decisions',COALESCE((SELECT jsonb_agg(jsonb_build_object('id',r.reference,'digest',encode(sha256(convert_to(to_jsonb(r)::text,'UTF8')),'hex')) ORDER BY r.reference COLLATE "C") FROM official_v3_result_private.decisions_v1 r),'[]'::jsonb),
'archive_pages',COALESCE((SELECT jsonb_agg(jsonb_build_object('id',r.reference,'digest',encode(sha256(convert_to(to_jsonb(r)::text,'UTF8')),'hex')) ORDER BY r.reference COLLATE "C") FROM official_v3_result_private.archive_pages_v1 r),'[]'::jsonb),
'versions',COALESCE((SELECT jsonb_agg(jsonb_build_object('id',r.reference,'digest',encode(sha256(convert_to((to_jsonb(r)||jsonb_build_object('committed_at',extract(epoch FROM r.committed_at)))::text,'UTF8')),'hex')) ORDER BY r.reference COLLATE "C") FROM official_v3_result_private.versions_v1 r),'[]'::jsonb),
'projections',COALESCE((SELECT jsonb_agg(jsonb_build_object('id',r.reference,'digest',encode(sha256(convert_to((to_jsonb(r)||jsonb_build_object('published_at',extract(epoch FROM r.published_at)))::text,'UTF8')),'hex')) ORDER BY r.reference COLLATE "C") FROM official_v3_result_private.projections_v1 r),'[]'::jsonb),
'operations',COALESCE((SELECT jsonb_agg(jsonb_build_object('id',jsonb_build_array(r.operation_kind,r.operation_id),'digest',encode(sha256(convert_to((to_jsonb(r)||jsonb_build_object('recorded_at',extract(epoch FROM r.recorded_at)))::text,'UTF8')),'hex')) ORDER BY r.operation_kind COLLATE "C",r.operation_id COLLATE "C") FROM official_v3_result_private.operations_v1 r),'[]'::jsonb),
'outbox',COALESCE((SELECT jsonb_agg(jsonb_build_object('id',r.escalation_key,'digest',encode(sha256(convert_to((to_jsonb(r)||jsonb_build_object('recorded_at',extract(epoch FROM r.recorded_at)))::text,'UTF8')),'hex')) ORDER BY r.escalation_key COLLATE "C") FROM official_v3_result_private.outbox_v1 r),'[]'::jsonb)) INTO inventory;
    SELECT state_certificate INTO certificate FROM official_v3_result_private.binding_v1 WHERE singleton;
    RETURN jsonb_build_object('head',to_jsonb(h),'certificate',certificate,
      'originals',2,'qualifications',1,'versions',0,'publications',0,
      'priorVersions',5,'priorPublications',5,'qualificationRef',q.reference,'decisionRef',q.decision_ref,'inventory',inventory);
  END IF;
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
END $cycle4_body$;
RESET ROLE;

CREATE OR REPLACE FUNCTION official_v3_guard_private.recovery_snapshot_v1() RETURNS jsonb
LANGUAGE plpgsql VOLATILE SECURITY DEFINER SET search_path=pg_catalog AS $cycle4_body$
DECLARE j jsonb; s jsonb; h jsonb; result_value jsonb; q jsonb; p jsonb; allowed_decisions jsonb:='[]'; expected_ref text; n integer;
BEGIN
  PERFORM official_v3_guard_private.fixed_method_v1();
  j:=official_v3_guard_private.recovery_jobs_v1();
  IF j->>'cycle4Scope'='ch_de_cycle4_unknown' THEN
    PERFORM official_v3_guard_private.require_open_v1();
    s:=official_v3_guard_private.recovery_intake_v1(j);
    h:=official_v3_guard_private.recovery_hrs_v1();
    IF s IS DISTINCT FROM '{"bytes":1425,"binding":{"kind":"proposal_intake_binding","jobId":"job3_c70d23ff344cdf2998818ecf5243d15e","method":{"methodId":"jetnity-destination-primary-ch-de-visa","revision":1},"schema":3,"runnerId":"runner3_90922ba96f3470f827630bccb857f7b1","contextKey":"official-truth-context:v3:bfce3bc64dbd7c670441e05033c31f339e03a2c488ab54937320508333c252c2","deliveryId":"delivery3_327549dd1c368966041a04ef1bb4540a","operationId":"op3_90bd61aa6d32e79273bdd923f1851576","inputRevision":"snapshot:0beb25db2e1f6e4c2c96d61ded30b59a8e06a32ed94498903fbeecc3b6f267e9"},"created_at":"2026-11-15T16:37:07.449208+00:00","expires_at":"2026-11-15T16:37:13.357084+00:00","generation":1,"acquired_at":"2026-11-15T16:37:08.357084+00:00","operation_id":"op3_90bd61aa6d32e79273bdd923f1851576","proposal_digest":"9aa177cc03a813a83212e498a6dbcc29b2da2eb2e0f50607d5555db1ced8cb63"}'::jsonb
      OR h->'priorVersions' IS DISTINCT FROM '6'::jsonb
      OR h->'priorPublications' IS DISTINCT FROM '6'::jsonb
      OR h->>'decisionRef' IS DISTINCT FROM 'source-decision:v3:'||encode(sha256(convert_to(
        official_v3_guard_private.recovery_canonical_v1(jsonb_build_object('operationId',j->'intakeOperationId',
          'proposalDigest',s->'proposal_digest','contextKey',j#>'{leasedJob,contextKey}','method',j#>'{leasedJob,method}',
          'predecessor',h#>'{head,decision_ref}'),0),'UTF8')),'hex')
      OR (SELECT count(*) FROM official_v3_guard_private.retired_attempts_v1)<>1
      OR (SELECT count(*) FROM official_v3_guard_private.retired_later_attempts_v1)<>2
      OR (SELECT count(*) FROM official_v3_guard_private.retired_refresh_attempts_v1)<>1
      OR clock_timestamp()<=(j#>>'{leasedJob,lease,expiresAt}')::timestamptz
      OR clock_timestamp()<=(s->>'expires_at')::timestamptz THEN
      RAISE EXCEPTION 'bg1 exact cycle4 custody required' USING ERRCODE='P7906';
    END IF;
    result_value:=jsonb_build_object('schema',1,'kind','ch_de_cycle4_unknown',
      'originalEvidenceDigest','5829475017f545d3ba1573de7d94593754bfc280262b9c7dd44a04d66cad3f14','job',j,'intake',s,'result',h,
      'previousRetirements',jsonb_build_object('first',COALESCE((SELECT jsonb_agg(jsonb_build_object('attemptKey',r.attempt_key,'rowDigest',encode(sha256(convert_to((to_jsonb(r)||jsonb_build_object('retired_at',extract(epoch FROM r.retired_at)))::text,'UTF8')),'hex'),'ownerOperationDigest',encode(sha256(convert_to((to_jsonb(prior_receipt)||jsonb_build_object('recorded_at',extract(epoch FROM prior_receipt.recorded_at)))::text,'UTF8')),'hex')) ORDER BY r.attempt_key COLLATE "C") FROM official_v3_guard_private.retired_attempts_v1 r JOIN official_v3_guard_private.owner_operations_v1 prior_receipt ON prior_receipt.operation_id=r.owner_operation_id),'[]'::jsonb),'later',COALESCE((SELECT jsonb_agg(jsonb_build_object('attemptKey',r.attempt_key,'rowDigest',encode(sha256(convert_to((to_jsonb(r)||jsonb_build_object('retired_at',extract(epoch FROM r.retired_at)))::text,'UTF8')),'hex'),'ownerOperationDigest',encode(sha256(convert_to((to_jsonb(prior_receipt)||jsonb_build_object('recorded_at',extract(epoch FROM prior_receipt.recorded_at)))::text,'UTF8')),'hex')) ORDER BY r.attempt_key COLLATE "C") FROM official_v3_guard_private.retired_later_attempts_v1 r JOIN official_v3_guard_private.owner_operations_v1 prior_receipt ON prior_receipt.operation_id=r.owner_operation_id),'[]'::jsonb),'refresh',COALESCE((SELECT jsonb_agg(jsonb_build_object('attemptKey',r.attempt_key,'rowDigest',encode(sha256(convert_to((to_jsonb(r)||jsonb_build_object('retired_at',extract(epoch FROM r.retired_at)))::text,'UTF8')),'hex'),'ownerOperationDigest',encode(sha256(convert_to((to_jsonb(prior_receipt)||jsonb_build_object('recorded_at',extract(epoch FROM prior_receipt.recorded_at)))::text,'UTF8')),'hex')) ORDER BY r.attempt_key COLLATE "C") FROM official_v3_guard_private.retired_refresh_attempts_v1 r JOIN official_v3_guard_private.owner_operations_v1 prior_receipt ON prior_receipt.operation_id=r.owner_operation_id),'[]'::jsonb)));
    IF octet_length(result_value::text)>131072 THEN
      RAISE EXCEPTION 'bg1 bounded cycle4 snapshot required' USING ERRCODE='P7906'; END IF;
    PERFORM official_v3_guard_private.require_open_v1();
    RETURN result_value;
  END IF;
  IF j->>'refreshScope'='ch_de_refresh_unknown' THEN
    PERFORM official_v3_guard_private.require_open_v1();
    s:=official_v3_guard_private.recovery_intake_v1(j);
    h:=official_v3_guard_private.recovery_hrs_v1();
    IF s IS DISTINCT FROM '{"bytes":1425,"binding":{"kind":"proposal_intake_binding","jobId":"job3_e1467267780885ae38068e6be1738958","method":{"methodId":"jetnity-destination-primary-ch-de-visa","revision":1},"schema":3,"runnerId":"runner3_90922ba96f3470f827630bccb857f7b1","contextKey":"official-truth-context:v3:bfce3bc64dbd7c670441e05033c31f339e03a2c488ab54937320508333c252c2","deliveryId":"delivery3_797ef30884c5f6c03e5b1f416c6c0c83","operationId":"op3_7e003b5a015c26976fbdf3fed1b8d494","inputRevision":"snapshot:0beb25db2e1f6e4c2c96d61ded30b59a8e06a32ed94498903fbeecc3b6f267e9"},"created_at":"2026-11-15T10:45:29.291149+00:00","expires_at":"2026-11-15T10:45:35.107317+00:00","generation":1,"acquired_at":"2026-11-15T10:45:30.107317+00:00","operation_id":"op3_7e003b5a015c26976fbdf3fed1b8d494","proposal_digest":"4428af871266c369adb5c43e81b3f385f91540ddc6288e7f25b1ad57fde76cfd"}'::jsonb
      OR h->'priorVersions' IS DISTINCT FROM '5'::jsonb
      OR h->'priorPublications' IS DISTINCT FROM '5'::jsonb
      OR h->>'decisionRef' IS DISTINCT FROM 'source-decision:v3:'||encode(sha256(convert_to(
        official_v3_guard_private.recovery_canonical_v1(jsonb_build_object('operationId',j->'intakeOperationId',
          'proposalDigest',s->'proposal_digest','contextKey',j#>'{leasedJob,contextKey}','method',j#>'{leasedJob,method}',
          'predecessor',h#>'{head,decision_ref}'),0),'UTF8')),'hex')
      OR (SELECT count(*) FROM official_v3_guard_private.retired_attempts_v1)<>1
      OR (SELECT count(*) FROM official_v3_guard_private.retired_later_attempts_v1)<>2
      OR clock_timestamp()<=(j#>>'{leasedJob,lease,expiresAt}')::timestamptz
      OR clock_timestamp()<=(s->>'expires_at')::timestamptz THEN
      RAISE EXCEPTION 'bg1 exact refresh custody required' USING ERRCODE='P7906';
    END IF;
    result_value:=jsonb_build_object('schema',1,'kind','ch_de_refresh_unknown',
      'originalEvidenceDigest','be111b7f3b024a7b967e80ceeb9b844ea5a63d67042218f4cc10e23329de7ea0','job',j,'intake',s,'result',h,
      'previousRetirements',(SELECT jsonb_build_object('first',COALESCE((SELECT jsonb_agg((to_jsonb(r)||jsonb_build_object('retired_at',extract(epoch FROM r.retired_at))) ORDER BY attempt_key) FROM official_v3_guard_private.retired_attempts_v1 r),'[]'::jsonb),'later',COALESCE((SELECT jsonb_agg((to_jsonb(r)||jsonb_build_object('retired_at',extract(epoch FROM r.retired_at))) ORDER BY attempt_number) FROM official_v3_guard_private.retired_later_attempts_v1 r),'[]'::jsonb))));
    IF octet_length(result_value::text)>131072 THEN
      RAISE EXCEPTION 'bg1 bounded refresh snapshot required' USING ERRCODE='P7906'; END IF;
    PERFORM official_v3_guard_private.require_open_v1();
    RETURN result_value;
  END IF;
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
END $cycle4_body$;

SET LOCAL ROLE ot_v3_jobs_owner;
CREATE OR REPLACE FUNCTION official_v3_guard_private.close_jobs_v1(attempt_value text) RETURNS void
LANGUAGE plpgsql VOLATILE SECURITY DEFINER SET search_path=pg_catalog AS $cycle4_body$
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
  ELSIF evidence->>'kind'='ch_de_refresh_unknown' THEN
    PERFORM official_v3_guard_private.begin_jobs_v1();
    IF attempt_value IS DISTINCT FROM 'execution-attempt:v3:3a32cf934505f82ba078e4e41afa60c4f47c2fa29e53be1f33a2976bf5d69aea'
      OR evidence->>'originalEvidenceDigest' IS DISTINCT FROM 'be111b7f3b024a7b967e80ceeb9b844ea5a63d67042218f4cc10e23329de7ea0'
      OR evidence#>'{job,subjectState}' IS DISTINCT FROM '{"kind":"rule_research","job_key":"research-job:v3:74713fe665cab1a7603f6e93ab06b6a1d1964e83a69571b8cced0ff009032513","slot_id":1,"current_job":{"kind":"research_job_record","jobId":"job3_e1467267780885ae38068e6be1738958","lease":{"leaseId":"lease3_1d7d014131bb4d42a09058b719edfaf5","expiresAt":"2026-11-15T10:45:56.164Z","acquiredAt":"2026-11-15T10:45:26.164Z","generation":37},"state":"leased","jobKey":"research-job:v3:74713fe665cab1a7603f6e93ab06b6a1d1964e83a69571b8cced0ff009032513","method":{"methodId":"jetnity-destination-primary-ch-de-visa","revision":1},"schema":3,"attempt":1,"context":{"route":"direct_entry","scope":{"validity":{"mode":"not_applicable"},"residence":{"mode":"not_applicable"},"citizenship":{"mode":"required","countryCodes":["CH"]},"requirementType":"visa","credentialOption":{"mode":"option","documentType":"passport","issuingCountryCode":"CH","relatedCitizenshipCountryCode":"CH"},"transitCountryCode":null,"destinationCountryCode":"DE"},"conditions":{"status":"unconditional"}},"research":{"key":"research-request:v1:b682f1de48389c7d5a3ac0d39fa4406d0e3796be91fb6e253bfd5a45cf7f945a","factKind":"requirement_effect","ruleScopeKey":"rule-scope:v1:3a24b4bc807a384b6d08e105f1107cc45d6d83c07c75eff01bc0ffc43f61477f","researchReason":{"status":"missing"}},"revision":37,"createdAt":"2026-11-15T10:45:20.652Z","updatedAt":"2026-11-15T10:45:26.164Z","contextKey":"official-truth-context:v3:bfce3bc64dbd7c670441e05033c31f339e03a2c488ab54937320508333c252c2","lastFailure":null,"operationId":"op3_3c550f64e49d0b2b1af14f09edca65c1","attemptLimit":4,"nextAttemptAt":null,"resultDecisionRef":null,"predecessorRevision":36},"start_count":9,"open_attempt":"execution-attempt:v3:3a32cf934505f82ba078e4e41afa60c4f47c2fa29e53be1f33a2976bf5d69aea","subject_text":"{\"context\":{\"conditions\":{\"status\":\"unconditional\"},\"route\":\"direct_entry\",\"scope\":{\"citizenship\":{\"countryCodes\":[\"CH\"],\"mode\":\"required\"},\"credentialOption\":{\"documentType\":\"passport\",\"issuingCountryCode\":\"CH\",\"mode\":\"option\",\"relatedCitizenshipCountryCode\":\"CH\"},\"destinationCountryCode\":\"DE\",\"requirementType\":\"visa\",\"residence\":{\"mode\":\"not_applicable\"},\"transitCountryCode\":null,\"validity\":{\"mode\":\"not_applicable\"}}},\"factKind\":\"requirement_effect\",\"kind\":\"rule_research\",\"method\":{\"methodId\":\"jetnity-destination-primary-ch-de-visa\",\"revision\":1}}","method_binding":{"methodId":"jetnity-destination-primary-ch-de-visa","revision":1,"methodDigest":"44ce02752da05796bef98c55b5099b81f915fe6b0975472e163721a06793bdb3","packageDigest":"0beb25db2e1f6e4c2c96d61ded30b59a8e06a32ed94498903fbeecc3b6f267e9"},"operation_count":41,"terminal_credit_claim":"op3_af6a4ab203d24be7869136eec570468e"}'::jsonb THEN
      RAISE EXCEPTION 'bg1 exact refresh retirement required' USING ERRCODE='P7906'; END IF;
    UPDATE official_v3_jobs_private.subjects_v1 s SET open_attempt=NULL
      WHERE s.job_key=evidence#>>'{job,jobKey}' AND s.open_attempt=attempt_value
        AND to_jsonb(s)=evidence#>'{job,subjectState}'
        AND s.current_job=evidence#>'{job,leasedJob}'
        AND s.terminal_credit_claim=evidence#>>'{job,claimOperationId}'
        AND s.start_count=9 AND s.operation_count=41;
  ELSIF evidence->>'kind'='ch_de_cycle4_unknown' THEN
    PERFORM official_v3_guard_private.begin_jobs_v1();
    IF attempt_value IS DISTINCT FROM 'execution-attempt:v3:89720170633a22f22effbf861d9b7c18a465546b43999375f567145a1449d3de'
      OR evidence->>'originalEvidenceDigest' IS DISTINCT FROM '5829475017f545d3ba1573de7d94593754bfc280262b9c7dd44a04d66cad3f14'
      OR evidence#>'{job,subjectState}' IS DISTINCT FROM '{"kind":"rule_research","job_key":"research-job:v3:74713fe665cab1a7603f6e93ab06b6a1d1964e83a69571b8cced0ff009032513","slot_id":1,"current_job":{"kind":"research_job_record","jobId":"job3_c70d23ff344cdf2998818ecf5243d15e","lease":{"leaseId":"lease3_491cf756e95d47e0892613c0e81c556b","expiresAt":"2026-11-15T16:37:34.504Z","acquiredAt":"2026-11-15T16:37:04.504Z","generation":41},"state":"leased","jobKey":"research-job:v3:74713fe665cab1a7603f6e93ab06b6a1d1964e83a69571b8cced0ff009032513","method":{"methodId":"jetnity-destination-primary-ch-de-visa","revision":1},"schema":3,"attempt":1,"context":{"route":"direct_entry","scope":{"validity":{"mode":"not_applicable"},"residence":{"mode":"not_applicable"},"citizenship":{"mode":"required","countryCodes":["CH"]},"requirementType":"visa","credentialOption":{"mode":"option","documentType":"passport","issuingCountryCode":"CH","relatedCitizenshipCountryCode":"CH"},"transitCountryCode":null,"destinationCountryCode":"DE"},"conditions":{"status":"unconditional"}},"research":{"key":"research-request:v1:b682f1de48389c7d5a3ac0d39fa4406d0e3796be91fb6e253bfd5a45cf7f945a","factKind":"requirement_effect","ruleScopeKey":"rule-scope:v1:3a24b4bc807a384b6d08e105f1107cc45d6d83c07c75eff01bc0ffc43f61477f","researchReason":{"status":"missing"}},"revision":41,"createdAt":"2026-11-15T16:36:02.293Z","updatedAt":"2026-11-15T16:37:04.504Z","contextKey":"official-truth-context:v3:bfce3bc64dbd7c670441e05033c31f339e03a2c488ab54937320508333c252c2","lastFailure":null,"operationId":"op3_91a38dc806d3f21bac3d9d16493c6be6","attemptLimit":4,"nextAttemptAt":null,"resultDecisionRef":null,"predecessorRevision":40},"start_count":11,"open_attempt":"execution-attempt:v3:89720170633a22f22effbf861d9b7c18a465546b43999375f567145a1449d3de","subject_text":"{\"context\":{\"conditions\":{\"status\":\"unconditional\"},\"route\":\"direct_entry\",\"scope\":{\"citizenship\":{\"countryCodes\":[\"CH\"],\"mode\":\"required\"},\"credentialOption\":{\"documentType\":\"passport\",\"issuingCountryCode\":\"CH\",\"mode\":\"option\",\"relatedCitizenshipCountryCode\":\"CH\"},\"destinationCountryCode\":\"DE\",\"requirementType\":\"visa\",\"residence\":{\"mode\":\"not_applicable\"},\"transitCountryCode\":null,\"validity\":{\"mode\":\"not_applicable\"}}},\"factKind\":\"requirement_effect\",\"kind\":\"rule_research\",\"method\":{\"methodId\":\"jetnity-destination-primary-ch-de-visa\",\"revision\":1}}","method_binding":{"methodId":"jetnity-destination-primary-ch-de-visa","revision":1,"methodDigest":"44ce02752da05796bef98c55b5099b81f915fe6b0975472e163721a06793bdb3","packageDigest":"0beb25db2e1f6e4c2c96d61ded30b59a8e06a32ed94498903fbeecc3b6f267e9"},"operation_count":45,"terminal_credit_claim":"op3_2b7811ed9b5f488cbffcd09a0ec0409b"}'::jsonb THEN
      RAISE EXCEPTION 'bg1 exact cycle4 retirement required' USING ERRCODE='P7906'; END IF;
    UPDATE official_v3_jobs_private.subjects_v1 s SET open_attempt=NULL
      WHERE s.job_key=evidence#>>'{job,jobKey}' AND s.open_attempt=attempt_value
        AND to_jsonb(s)=evidence#>'{job,subjectState}'
        AND s.current_job=evidence#>'{job,leasedJob}'
        AND s.terminal_credit_claim=evidence#>>'{job,claimOperationId}'
        AND s.start_count=11 AND s.operation_count=45;
  ELSE RAISE EXCEPTION 'bg1 fixed retirement kind required' USING ERRCODE='P7906'; END IF;
  GET DIAGNOSTICS count_value=ROW_COUNT;
  IF count_value<>1 THEN RAISE EXCEPTION 'bg1 retirement compare failed' USING ERRCODE='P7906'; END IF;
  PERFORM official_v3_guard_private.seal_jobs_v1();
  IF evidence->>'kind' IN ('ch_de_later_unknown','ch_de_refresh_unknown','ch_de_cycle4_unknown') THEN PERFORM official_v3_guard_private.begin_jobs_v1(); END IF;
  PERFORM official_v3_guard_private.owner_session_v1();
END $cycle4_body$;
RESET ROLE;

SET LOCAL ROLE ot_v3_jobs_owner;
CREATE OR REPLACE FUNCTION official_v3_guard_private.check_retired_jobs_v1(evidence jsonb) RETURNS void
LANGUAGE plpgsql VOLATILE SECURITY DEFINER SET search_path=pg_catalog AS $cycle4_body$
BEGIN
BEGIN
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
END;
  IF evidence->>'kind'='ch_de_refresh_unknown' THEN
    IF evidence#>>'{job,attemptKey}' IS DISTINCT FROM 'execution-attempt:v3:3a32cf934505f82ba078e4e41afa60c4f47c2fa29e53be1f33a2976bf5d69aea'
      OR evidence#>>'{job,claimOperationId}' IS DISTINCT FROM 'op3_af6a4ab203d24be7869136eec570468e'
      OR (SELECT encode(sha256(convert_to((to_jsonb(t)||jsonb_build_object('reserved_at',extract(epoch FROM t.reserved_at)))::text,'UTF8')),'hex')
        FROM official_v3_jobs_private.execution_starts_v1 t WHERE attempt_key='execution-attempt:v3:3a32cf934505f82ba078e4e41afa60c4f47c2fa29e53be1f33a2976bf5d69aea') IS DISTINCT FROM evidence#>>'{job,startDigest}'
      OR (SELECT encode(sha256(convert_to((to_jsonb(c)||jsonb_build_object('recorded_at',extract(epoch FROM c.recorded_at)))::text,'UTF8')),'hex')
        FROM official_v3_jobs_private.queue_operations_v1 c WHERE operation_id='op3_af6a4ab203d24be7869136eec570468e') IS DISTINCT FROM evidence#>>'{job,claimDigest}' THEN
      RAISE EXCEPTION 'bg1 retained refresh execution changed' USING ERRCODE='P7906'; END IF;
  END IF;
END;
  IF evidence->>'kind'='ch_de_cycle4_unknown' THEN
    IF evidence#>>'{job,attemptKey}' IS DISTINCT FROM 'execution-attempt:v3:89720170633a22f22effbf861d9b7c18a465546b43999375f567145a1449d3de'
      OR evidence#>>'{job,claimOperationId}' IS DISTINCT FROM 'op3_2b7811ed9b5f488cbffcd09a0ec0409b'
      OR (SELECT encode(sha256(convert_to((to_jsonb(t)||jsonb_build_object('reserved_at',extract(epoch FROM t.reserved_at)))::text,'UTF8')),'hex')
        FROM official_v3_jobs_private.execution_starts_v1 t WHERE attempt_key='execution-attempt:v3:89720170633a22f22effbf861d9b7c18a465546b43999375f567145a1449d3de') IS DISTINCT FROM evidence#>>'{job,startDigest}'
      OR (SELECT encode(sha256(convert_to((to_jsonb(c)||jsonb_build_object('recorded_at',extract(epoch FROM c.recorded_at)))::text,'UTF8')),'hex')
        FROM official_v3_jobs_private.queue_operations_v1 c WHERE operation_id='op3_2b7811ed9b5f488cbffcd09a0ec0409b') IS DISTINCT FROM evidence#>>'{job,claimDigest}' THEN
      RAISE EXCEPTION 'bg1 retained cycle4 execution changed' USING ERRCODE='P7906'; END IF;
  END IF;
END $cycle4_body$;
RESET ROLE;

SET LOCAL ROLE ot_v3_result_owner;
CREATE OR REPLACE FUNCTION official_v3_guard_private.check_retired_hrs_v1(evidence jsonb) RETURNS void
LANGUAGE plpgsql VOLATILE SECURITY DEFINER SET search_path=pg_catalog AS $cycle4_body$
DECLARE entry jsonb; actual text;
BEGIN
DECLARE entry jsonb; actual text;
BEGIN
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
END;
  IF evidence->>'kind'='ch_de_refresh_unknown' THEN

    IF jsonb_typeof(evidence#>'{result,inventory,originals}') IS DISTINCT FROM 'array' THEN
      RAISE EXCEPTION 'bg1 complete refresh originals inventory required' USING ERRCODE='P7906'; END IF;
    FOR entry IN SELECT value FROM jsonb_array_elements(evidence#>'{result,inventory,originals}') LOOP
      SELECT encode(sha256(convert_to(to_jsonb(r)::text,'UTF8')),'hex') INTO actual FROM official_v3_result_private.originals_v1 r
        WHERE r.version_id=entry->>'id';
      IF NOT FOUND OR actual IS DISTINCT FROM entry->>'digest' THEN
        RAISE EXCEPTION 'bg1 retained refresh originals changed' USING ERRCODE='P7906'; END IF;
    END LOOP;

    IF jsonb_typeof(evidence#>'{result,inventory,extractions}') IS DISTINCT FROM 'array' THEN
      RAISE EXCEPTION 'bg1 complete refresh extractions inventory required' USING ERRCODE='P7906'; END IF;
    FOR entry IN SELECT value FROM jsonb_array_elements(evidence#>'{result,inventory,extractions}') LOOP
      SELECT encode(sha256(convert_to(to_jsonb(r)::text,'UTF8')),'hex') INTO actual FROM official_v3_result_private.extractions_v1 r
        WHERE r.version_id=entry->>'id';
      IF NOT FOUND OR actual IS DISTINCT FROM entry->>'digest' THEN
        RAISE EXCEPTION 'bg1 retained refresh extractions changed' USING ERRCODE='P7906'; END IF;
    END LOOP;

    IF jsonb_typeof(evidence#>'{result,inventory,qualifications}') IS DISTINCT FROM 'array' THEN
      RAISE EXCEPTION 'bg1 complete refresh qualifications inventory required' USING ERRCODE='P7906'; END IF;
    FOR entry IN SELECT value FROM jsonb_array_elements(evidence#>'{result,inventory,qualifications}') LOOP
      SELECT encode(sha256(convert_to((to_jsonb(r)||jsonb_build_object('valid_until',extract(epoch FROM r.valid_until)))::text,'UTF8')),'hex') INTO actual FROM official_v3_result_private.qualifications_v1 r
        WHERE r.reference=entry->>'id';
      IF NOT FOUND OR actual IS DISTINCT FROM entry->>'digest' THEN
        RAISE EXCEPTION 'bg1 retained refresh qualifications changed' USING ERRCODE='P7906'; END IF;
    END LOOP;

    IF jsonb_typeof(evidence#>'{result,inventory,decisions}') IS DISTINCT FROM 'array' THEN
      RAISE EXCEPTION 'bg1 complete refresh decisions inventory required' USING ERRCODE='P7906'; END IF;
    FOR entry IN SELECT value FROM jsonb_array_elements(evidence#>'{result,inventory,decisions}') LOOP
      SELECT encode(sha256(convert_to(to_jsonb(r)::text,'UTF8')),'hex') INTO actual FROM official_v3_result_private.decisions_v1 r
        WHERE r.reference=entry->>'id';
      IF NOT FOUND OR actual IS DISTINCT FROM entry->>'digest' THEN
        RAISE EXCEPTION 'bg1 retained refresh decisions changed' USING ERRCODE='P7906'; END IF;
    END LOOP;

    IF jsonb_typeof(evidence#>'{result,inventory,archive_pages}') IS DISTINCT FROM 'array' THEN
      RAISE EXCEPTION 'bg1 complete refresh archive_pages inventory required' USING ERRCODE='P7906'; END IF;
    FOR entry IN SELECT value FROM jsonb_array_elements(evidence#>'{result,inventory,archive_pages}') LOOP
      SELECT encode(sha256(convert_to(to_jsonb(r)::text,'UTF8')),'hex') INTO actual FROM official_v3_result_private.archive_pages_v1 r
        WHERE r.reference=entry->>'id';
      IF NOT FOUND OR actual IS DISTINCT FROM entry->>'digest' THEN
        RAISE EXCEPTION 'bg1 retained refresh archive_pages changed' USING ERRCODE='P7906'; END IF;
    END LOOP;

    IF jsonb_typeof(evidence#>'{result,inventory,versions}') IS DISTINCT FROM 'array' THEN
      RAISE EXCEPTION 'bg1 complete refresh versions inventory required' USING ERRCODE='P7906'; END IF;
    FOR entry IN SELECT value FROM jsonb_array_elements(evidence#>'{result,inventory,versions}') LOOP
      SELECT encode(sha256(convert_to((to_jsonb(r)||jsonb_build_object('committed_at',extract(epoch FROM r.committed_at)))::text,'UTF8')),'hex') INTO actual FROM official_v3_result_private.versions_v1 r
        WHERE r.reference=entry->>'id';
      IF NOT FOUND OR actual IS DISTINCT FROM entry->>'digest' THEN
        RAISE EXCEPTION 'bg1 retained refresh versions changed' USING ERRCODE='P7906'; END IF;
    END LOOP;

    IF jsonb_typeof(evidence#>'{result,inventory,projections}') IS DISTINCT FROM 'array' THEN
      RAISE EXCEPTION 'bg1 complete refresh projections inventory required' USING ERRCODE='P7906'; END IF;
    FOR entry IN SELECT value FROM jsonb_array_elements(evidence#>'{result,inventory,projections}') LOOP
      SELECT encode(sha256(convert_to((to_jsonb(r)||jsonb_build_object('published_at',extract(epoch FROM r.published_at)))::text,'UTF8')),'hex') INTO actual FROM official_v3_result_private.projections_v1 r
        WHERE r.reference=entry->>'id';
      IF NOT FOUND OR actual IS DISTINCT FROM entry->>'digest' THEN
        RAISE EXCEPTION 'bg1 retained refresh projections changed' USING ERRCODE='P7906'; END IF;
    END LOOP;

    IF jsonb_typeof(evidence#>'{result,inventory,operations}') IS DISTINCT FROM 'array' THEN
      RAISE EXCEPTION 'bg1 complete refresh operations inventory required' USING ERRCODE='P7906'; END IF;
    FOR entry IN SELECT value FROM jsonb_array_elements(evidence#>'{result,inventory,operations}') LOOP
      SELECT encode(sha256(convert_to((to_jsonb(r)||jsonb_build_object('recorded_at',extract(epoch FROM r.recorded_at)))::text,'UTF8')),'hex') INTO actual FROM official_v3_result_private.operations_v1 r
        WHERE r.operation_kind=entry#>>'{id,0}' AND r.operation_id=entry#>>'{id,1}';
      IF NOT FOUND OR actual IS DISTINCT FROM entry->>'digest' THEN
        RAISE EXCEPTION 'bg1 retained refresh operations changed' USING ERRCODE='P7906'; END IF;
    END LOOP;

    IF jsonb_typeof(evidence#>'{result,inventory,outbox}') IS DISTINCT FROM 'array' THEN
      RAISE EXCEPTION 'bg1 complete refresh outbox inventory required' USING ERRCODE='P7906'; END IF;
    FOR entry IN SELECT value FROM jsonb_array_elements(evidence#>'{result,inventory,outbox}') LOOP
      SELECT encode(sha256(convert_to((to_jsonb(r)||jsonb_build_object('recorded_at',extract(epoch FROM r.recorded_at)))::text,'UTF8')),'hex') INTO actual FROM official_v3_result_private.outbox_v1 r
        WHERE r.escalation_key=entry->>'id';
      IF NOT FOUND OR actual IS DISTINCT FROM entry->>'digest' THEN
        RAISE EXCEPTION 'bg1 retained refresh outbox changed' USING ERRCODE='P7906'; END IF;
    END LOOP;
  END IF;
END;
  IF evidence->>'kind'='ch_de_cycle4_unknown' THEN

    IF jsonb_typeof(evidence#>'{result,inventory,originals}') IS DISTINCT FROM 'array' THEN
      RAISE EXCEPTION 'bg1 complete refresh originals inventory required' USING ERRCODE='P7906'; END IF;
    FOR entry IN SELECT value FROM jsonb_array_elements(evidence#>'{result,inventory,originals}') LOOP
      SELECT encode(sha256(convert_to(to_jsonb(r)::text,'UTF8')),'hex') INTO actual FROM official_v3_result_private.originals_v1 r
        WHERE r.version_id=entry->>'id';
      IF NOT FOUND OR actual IS DISTINCT FROM entry->>'digest' THEN
        RAISE EXCEPTION 'bg1 retained refresh originals changed' USING ERRCODE='P7906'; END IF;
    END LOOP;

    IF jsonb_typeof(evidence#>'{result,inventory,extractions}') IS DISTINCT FROM 'array' THEN
      RAISE EXCEPTION 'bg1 complete refresh extractions inventory required' USING ERRCODE='P7906'; END IF;
    FOR entry IN SELECT value FROM jsonb_array_elements(evidence#>'{result,inventory,extractions}') LOOP
      SELECT encode(sha256(convert_to(to_jsonb(r)::text,'UTF8')),'hex') INTO actual FROM official_v3_result_private.extractions_v1 r
        WHERE r.version_id=entry->>'id';
      IF NOT FOUND OR actual IS DISTINCT FROM entry->>'digest' THEN
        RAISE EXCEPTION 'bg1 retained refresh extractions changed' USING ERRCODE='P7906'; END IF;
    END LOOP;

    IF jsonb_typeof(evidence#>'{result,inventory,qualifications}') IS DISTINCT FROM 'array' THEN
      RAISE EXCEPTION 'bg1 complete refresh qualifications inventory required' USING ERRCODE='P7906'; END IF;
    FOR entry IN SELECT value FROM jsonb_array_elements(evidence#>'{result,inventory,qualifications}') LOOP
      SELECT encode(sha256(convert_to((to_jsonb(r)||jsonb_build_object('valid_until',extract(epoch FROM r.valid_until)))::text,'UTF8')),'hex') INTO actual FROM official_v3_result_private.qualifications_v1 r
        WHERE r.reference=entry->>'id';
      IF NOT FOUND OR actual IS DISTINCT FROM entry->>'digest' THEN
        RAISE EXCEPTION 'bg1 retained refresh qualifications changed' USING ERRCODE='P7906'; END IF;
    END LOOP;

    IF jsonb_typeof(evidence#>'{result,inventory,decisions}') IS DISTINCT FROM 'array' THEN
      RAISE EXCEPTION 'bg1 complete refresh decisions inventory required' USING ERRCODE='P7906'; END IF;
    FOR entry IN SELECT value FROM jsonb_array_elements(evidence#>'{result,inventory,decisions}') LOOP
      SELECT encode(sha256(convert_to(to_jsonb(r)::text,'UTF8')),'hex') INTO actual FROM official_v3_result_private.decisions_v1 r
        WHERE r.reference=entry->>'id';
      IF NOT FOUND OR actual IS DISTINCT FROM entry->>'digest' THEN
        RAISE EXCEPTION 'bg1 retained refresh decisions changed' USING ERRCODE='P7906'; END IF;
    END LOOP;

    IF jsonb_typeof(evidence#>'{result,inventory,archive_pages}') IS DISTINCT FROM 'array' THEN
      RAISE EXCEPTION 'bg1 complete refresh archive_pages inventory required' USING ERRCODE='P7906'; END IF;
    FOR entry IN SELECT value FROM jsonb_array_elements(evidence#>'{result,inventory,archive_pages}') LOOP
      SELECT encode(sha256(convert_to(to_jsonb(r)::text,'UTF8')),'hex') INTO actual FROM official_v3_result_private.archive_pages_v1 r
        WHERE r.reference=entry->>'id';
      IF NOT FOUND OR actual IS DISTINCT FROM entry->>'digest' THEN
        RAISE EXCEPTION 'bg1 retained refresh archive_pages changed' USING ERRCODE='P7906'; END IF;
    END LOOP;

    IF jsonb_typeof(evidence#>'{result,inventory,versions}') IS DISTINCT FROM 'array' THEN
      RAISE EXCEPTION 'bg1 complete refresh versions inventory required' USING ERRCODE='P7906'; END IF;
    FOR entry IN SELECT value FROM jsonb_array_elements(evidence#>'{result,inventory,versions}') LOOP
      SELECT encode(sha256(convert_to((to_jsonb(r)||jsonb_build_object('committed_at',extract(epoch FROM r.committed_at)))::text,'UTF8')),'hex') INTO actual FROM official_v3_result_private.versions_v1 r
        WHERE r.reference=entry->>'id';
      IF NOT FOUND OR actual IS DISTINCT FROM entry->>'digest' THEN
        RAISE EXCEPTION 'bg1 retained refresh versions changed' USING ERRCODE='P7906'; END IF;
    END LOOP;

    IF jsonb_typeof(evidence#>'{result,inventory,projections}') IS DISTINCT FROM 'array' THEN
      RAISE EXCEPTION 'bg1 complete refresh projections inventory required' USING ERRCODE='P7906'; END IF;
    FOR entry IN SELECT value FROM jsonb_array_elements(evidence#>'{result,inventory,projections}') LOOP
      SELECT encode(sha256(convert_to((to_jsonb(r)||jsonb_build_object('published_at',extract(epoch FROM r.published_at)))::text,'UTF8')),'hex') INTO actual FROM official_v3_result_private.projections_v1 r
        WHERE r.reference=entry->>'id';
      IF NOT FOUND OR actual IS DISTINCT FROM entry->>'digest' THEN
        RAISE EXCEPTION 'bg1 retained refresh projections changed' USING ERRCODE='P7906'; END IF;
    END LOOP;

    IF jsonb_typeof(evidence#>'{result,inventory,operations}') IS DISTINCT FROM 'array' THEN
      RAISE EXCEPTION 'bg1 complete refresh operations inventory required' USING ERRCODE='P7906'; END IF;
    FOR entry IN SELECT value FROM jsonb_array_elements(evidence#>'{result,inventory,operations}') LOOP
      SELECT encode(sha256(convert_to((to_jsonb(r)||jsonb_build_object('recorded_at',extract(epoch FROM r.recorded_at)))::text,'UTF8')),'hex') INTO actual FROM official_v3_result_private.operations_v1 r
        WHERE r.operation_kind=entry#>>'{id,0}' AND r.operation_id=entry#>>'{id,1}';
      IF NOT FOUND OR actual IS DISTINCT FROM entry->>'digest' THEN
        RAISE EXCEPTION 'bg1 retained refresh operations changed' USING ERRCODE='P7906'; END IF;
    END LOOP;

    IF jsonb_typeof(evidence#>'{result,inventory,outbox}') IS DISTINCT FROM 'array' THEN
      RAISE EXCEPTION 'bg1 complete refresh outbox inventory required' USING ERRCODE='P7906'; END IF;
    FOR entry IN SELECT value FROM jsonb_array_elements(evidence#>'{result,inventory,outbox}') LOOP
      SELECT encode(sha256(convert_to((to_jsonb(r)||jsonb_build_object('recorded_at',extract(epoch FROM r.recorded_at)))::text,'UTF8')),'hex') INTO actual FROM official_v3_result_private.outbox_v1 r
        WHERE r.escalation_key=entry->>'id';
      IF NOT FOUND OR actual IS DISTINCT FROM entry->>'digest' THEN
        RAISE EXCEPTION 'bg1 retained refresh outbox changed' USING ERRCODE='P7906'; END IF;
    END LOOP;
  END IF;
END $cycle4_body$;
RESET ROLE;

CREATE OR REPLACE FUNCTION official_v3_guard_private.intake_retired_v1(operation_value text) RETURNS boolean
LANGUAGE sql STABLE SECURITY DEFINER SET search_path=pg_catalog AS $cycle4_body$
SELECT EXISTS(SELECT 1 FROM official_v3_guard_private.retired_attempts_v1 WHERE intake_operation_id=operation_value)
  OR EXISTS(SELECT 1 FROM official_v3_guard_private.retired_later_attempts_v1 WHERE intake_operation_id=operation_value)
  OR EXISTS(SELECT 1 FROM official_v3_guard_private.retired_later_attempts_v1
    WHERE attempt_number=4 AND before_state#>>'{job,skippedClaims,0,kind}'='claim_without_execution_start'
      AND before_state#>'{job,skippedClaims,0,attempt}'='3'::jsonb
      AND before_state#>>'{job,skippedClaims,0,intakeOperationId}'=operation_value)
  OR EXISTS(SELECT 1 FROM official_v3_guard_private.retired_refresh_attempts_v1 WHERE intake_operation_id=operation_value)
  OR EXISTS(SELECT 1 FROM official_v3_guard_private.retired_cycle4_attempts_v1 WHERE intake_operation_id=operation_value)
$cycle4_body$;

CREATE OR REPLACE FUNCTION official_v3_guard_private.attempt_retired_v1(attempt_value text) RETURNS boolean
LANGUAGE sql STABLE SECURITY DEFINER SET search_path=pg_catalog AS $cycle4_body$
SELECT EXISTS(SELECT 1 FROM official_v3_guard_private.retired_attempts_v1 WHERE attempt_key=attempt_value)
  OR EXISTS(SELECT 1 FROM official_v3_guard_private.retired_later_attempts_v1 WHERE attempt_key=attempt_value)
  OR EXISTS(SELECT 1 FROM official_v3_guard_private.retired_refresh_attempts_v1 WHERE attempt_key=attempt_value)
  OR EXISTS(SELECT 1 FROM official_v3_guard_private.retired_cycle4_attempts_v1 WHERE attempt_key=attempt_value)
$cycle4_body$;

CREATE OR REPLACE FUNCTION official_v3_guard_private.retired_state_v1(attempt_value text) RETURNS jsonb
LANGUAGE sql STABLE SECURITY DEFINER SET search_path=pg_catalog AS $cycle4_body$
SELECT before_state FROM official_v3_guard_private.retired_attempts_v1 WHERE attempt_key=attempt_value
UNION ALL SELECT before_state FROM official_v3_guard_private.retired_later_attempts_v1 WHERE attempt_key=attempt_value
UNION ALL SELECT r.before_state FROM official_v3_guard_private.retired_refresh_attempts_v1 r
JOIN official_v3_guard_private.owner_operations_v1 op ON op.operation_id=r.owner_operation_id
WHERE r.attempt_key=attempt_value AND r.attempt_key='execution-attempt:v3:3a32cf934505f82ba078e4e41afa60c4f47c2fa29e53be1f33a2976bf5d69aea'
  AND op.action='retire_unknown' AND op.recorded_at=r.retired_at
  AND op.expected_digest=encode(sha256(convert_to(r.before_state::text,'UTF8')),'hex')
  AND op.receipt=jsonb_build_object('schema',1,'status','recorded','action','retire_unknown',
    'operationId',op.operation_id,'selection',op.expected_digest,'result','unknown_retired',
    'recordedAt',to_char(op.recorded_at AT TIME ZONE 'UTC','YYYY-MM-DD"T"HH24:MI:SS.MS"Z"'))
UNION ALL SELECT r.before_state FROM official_v3_guard_private.retired_cycle4_attempts_v1 r
JOIN official_v3_guard_private.owner_operations_v1 op ON op.operation_id=r.owner_operation_id
WHERE r.attempt_key=attempt_value AND r.attempt_key='execution-attempt:v3:89720170633a22f22effbf861d9b7c18a465546b43999375f567145a1449d3de'
  AND op.action='retire_unknown' AND op.recorded_at=r.retired_at
  AND op.expected_digest=encode(sha256(convert_to(r.before_state::text,'UTF8')),'hex')
  AND op.receipt=jsonb_build_object('schema',1,'status','recorded','action','retire_unknown',
    'operationId',op.operation_id,'selection',op.expected_digest,'result','unknown_retired',
    'recordedAt',to_char(op.recorded_at AT TIME ZONE 'UTC','YYYY-MM-DD"T"HH24:MI:SS.MS"Z"'))
$cycle4_body$;

CREATE OR REPLACE FUNCTION official_v3_guard_private.check_retirements_v1() RETURNS void
LANGUAGE plpgsql VOLATILE SECURITY DEFINER SET search_path=pg_catalog AS $cycle4_body$
DECLARE retired record; op official_v3_guard_private.owner_operations_v1%ROWTYPE; j jsonb;
BEGIN
DECLARE retired record; op official_v3_guard_private.owner_operations_v1%ROWTYPE; j jsonb;
BEGIN
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
END;
  FOR retired IN SELECT * FROM official_v3_guard_private.retired_refresh_attempts_v1 LOOP
    SELECT * INTO STRICT op FROM official_v3_guard_private.owner_operations_v1 WHERE operation_id=retired.owner_operation_id;
    j:=retired.before_state->'job';
    IF retired.attempt_key IS DISTINCT FROM 'execution-attempt:v3:3a32cf934505f82ba078e4e41afa60c4f47c2fa29e53be1f33a2976bf5d69aea' OR j->>'attemptKey' IS DISTINCT FROM retired.attempt_key
      OR retired.job_key IS DISTINCT FROM j->>'jobKey' OR retired.claim_operation_id IS DISTINCT FROM 'op3_af6a4ab203d24be7869136eec570468e'
      OR retired.claim_operation_id IS DISTINCT FROM j->>'claimOperationId'
      OR retired.intake_operation_id IS DISTINCT FROM 'op3_7e003b5a015c26976fbdf3fed1b8d494' OR retired.intake_operation_id IS DISTINCT FROM j->>'intakeOperationId'
      OR retired.before_state->'schema' IS DISTINCT FROM '1'::jsonb
      OR retired.before_state->>'kind' IS DISTINCT FROM 'ch_de_refresh_unknown'
      OR retired.before_state->>'originalEvidenceDigest' IS DISTINCT FROM 'be111b7f3b024a7b967e80ceeb9b844ea5a63d67042218f4cc10e23329de7ea0'
      OR j->'subjectState' IS DISTINCT FROM '{"kind":"rule_research","job_key":"research-job:v3:74713fe665cab1a7603f6e93ab06b6a1d1964e83a69571b8cced0ff009032513","slot_id":1,"current_job":{"kind":"research_job_record","jobId":"job3_e1467267780885ae38068e6be1738958","lease":{"leaseId":"lease3_1d7d014131bb4d42a09058b719edfaf5","expiresAt":"2026-11-15T10:45:56.164Z","acquiredAt":"2026-11-15T10:45:26.164Z","generation":37},"state":"leased","jobKey":"research-job:v3:74713fe665cab1a7603f6e93ab06b6a1d1964e83a69571b8cced0ff009032513","method":{"methodId":"jetnity-destination-primary-ch-de-visa","revision":1},"schema":3,"attempt":1,"context":{"route":"direct_entry","scope":{"validity":{"mode":"not_applicable"},"residence":{"mode":"not_applicable"},"citizenship":{"mode":"required","countryCodes":["CH"]},"requirementType":"visa","credentialOption":{"mode":"option","documentType":"passport","issuingCountryCode":"CH","relatedCitizenshipCountryCode":"CH"},"transitCountryCode":null,"destinationCountryCode":"DE"},"conditions":{"status":"unconditional"}},"research":{"key":"research-request:v1:b682f1de48389c7d5a3ac0d39fa4406d0e3796be91fb6e253bfd5a45cf7f945a","factKind":"requirement_effect","ruleScopeKey":"rule-scope:v1:3a24b4bc807a384b6d08e105f1107cc45d6d83c07c75eff01bc0ffc43f61477f","researchReason":{"status":"missing"}},"revision":37,"createdAt":"2026-11-15T10:45:20.652Z","updatedAt":"2026-11-15T10:45:26.164Z","contextKey":"official-truth-context:v3:bfce3bc64dbd7c670441e05033c31f339e03a2c488ab54937320508333c252c2","lastFailure":null,"operationId":"op3_3c550f64e49d0b2b1af14f09edca65c1","attemptLimit":4,"nextAttemptAt":null,"resultDecisionRef":null,"predecessorRevision":36},"start_count":9,"open_attempt":"execution-attempt:v3:3a32cf934505f82ba078e4e41afa60c4f47c2fa29e53be1f33a2976bf5d69aea","subject_text":"{\"context\":{\"conditions\":{\"status\":\"unconditional\"},\"route\":\"direct_entry\",\"scope\":{\"citizenship\":{\"countryCodes\":[\"CH\"],\"mode\":\"required\"},\"credentialOption\":{\"documentType\":\"passport\",\"issuingCountryCode\":\"CH\",\"mode\":\"option\",\"relatedCitizenshipCountryCode\":\"CH\"},\"destinationCountryCode\":\"DE\",\"requirementType\":\"visa\",\"residence\":{\"mode\":\"not_applicable\"},\"transitCountryCode\":null,\"validity\":{\"mode\":\"not_applicable\"}}},\"factKind\":\"requirement_effect\",\"kind\":\"rule_research\",\"method\":{\"methodId\":\"jetnity-destination-primary-ch-de-visa\",\"revision\":1}}","method_binding":{"methodId":"jetnity-destination-primary-ch-de-visa","revision":1,"methodDigest":"44ce02752da05796bef98c55b5099b81f915fe6b0975472e163721a06793bdb3","packageDigest":"0beb25db2e1f6e4c2c96d61ded30b59a8e06a32ed94498903fbeecc3b6f267e9"},"operation_count":41,"terminal_credit_claim":"op3_af6a4ab203d24be7869136eec570468e"}'::jsonb
      OR retired.before_state->'previousRetirements' IS DISTINCT FROM (SELECT jsonb_build_object('first',COALESCE((SELECT jsonb_agg((to_jsonb(r)||jsonb_build_object('retired_at',extract(epoch FROM r.retired_at))) ORDER BY attempt_key) FROM official_v3_guard_private.retired_attempts_v1 r),'[]'::jsonb),'later',COALESCE((SELECT jsonb_agg((to_jsonb(r)||jsonb_build_object('retired_at',extract(epoch FROM r.retired_at))) ORDER BY attempt_number) FROM official_v3_guard_private.retired_later_attempts_v1 r),'[]'::jsonb)))
      OR op.action IS DISTINCT FROM 'retire_unknown' OR op.recorded_at IS DISTINCT FROM retired.retired_at
      OR op.expected_digest IS DISTINCT FROM encode(sha256(convert_to(retired.before_state::text,'UTF8')),'hex')
      OR op.receipt IS DISTINCT FROM jsonb_build_object('schema',1,'status','recorded','action','retire_unknown',
        'operationId',op.operation_id,'selection',op.expected_digest,'result','unknown_retired',
        'recordedAt',to_char(op.recorded_at AT TIME ZONE 'UTC','YYYY-MM-DD"T"HH24:MI:SS.MS"Z"'))
      OR (j#>>'{leasedJob,lease,expiresAt}')::timestamptz>=retired.retired_at
      OR (retired.before_state#>>'{intake,expires_at}')::timestamptz>=retired.retired_at THEN
      RAISE EXCEPTION 'bg1 refresh retirement receipt binding' USING ERRCODE='P7906'; END IF;
    PERFORM official_v3_guard_private.check_retired_jobs_v1(retired.before_state);
    PERFORM official_v3_guard_private.check_retired_s1_v1(retired.before_state);
    PERFORM official_v3_guard_private.check_retired_hrs_v1(retired.before_state);
  END LOOP;
END;
  FOR retired IN SELECT * FROM official_v3_guard_private.retired_cycle4_attempts_v1 LOOP
    SELECT * INTO STRICT op FROM official_v3_guard_private.owner_operations_v1 WHERE operation_id=retired.owner_operation_id;
    j:=retired.before_state->'job';
    IF retired.attempt_key IS DISTINCT FROM 'execution-attempt:v3:89720170633a22f22effbf861d9b7c18a465546b43999375f567145a1449d3de' OR j->>'attemptKey' IS DISTINCT FROM retired.attempt_key
      OR retired.job_key IS DISTINCT FROM j->>'jobKey' OR retired.claim_operation_id IS DISTINCT FROM 'op3_2b7811ed9b5f488cbffcd09a0ec0409b'
      OR retired.claim_operation_id IS DISTINCT FROM j->>'claimOperationId'
      OR retired.intake_operation_id IS DISTINCT FROM 'op3_90bd61aa6d32e79273bdd923f1851576' OR retired.intake_operation_id IS DISTINCT FROM j->>'intakeOperationId'
      OR retired.before_state->'schema' IS DISTINCT FROM '1'::jsonb
      OR retired.before_state->>'kind' IS DISTINCT FROM 'ch_de_cycle4_unknown'
      OR retired.before_state->>'originalEvidenceDigest' IS DISTINCT FROM '5829475017f545d3ba1573de7d94593754bfc280262b9c7dd44a04d66cad3f14'
      OR j->'subjectState' IS DISTINCT FROM '{"kind":"rule_research","job_key":"research-job:v3:74713fe665cab1a7603f6e93ab06b6a1d1964e83a69571b8cced0ff009032513","slot_id":1,"current_job":{"kind":"research_job_record","jobId":"job3_c70d23ff344cdf2998818ecf5243d15e","lease":{"leaseId":"lease3_491cf756e95d47e0892613c0e81c556b","expiresAt":"2026-11-15T16:37:34.504Z","acquiredAt":"2026-11-15T16:37:04.504Z","generation":41},"state":"leased","jobKey":"research-job:v3:74713fe665cab1a7603f6e93ab06b6a1d1964e83a69571b8cced0ff009032513","method":{"methodId":"jetnity-destination-primary-ch-de-visa","revision":1},"schema":3,"attempt":1,"context":{"route":"direct_entry","scope":{"validity":{"mode":"not_applicable"},"residence":{"mode":"not_applicable"},"citizenship":{"mode":"required","countryCodes":["CH"]},"requirementType":"visa","credentialOption":{"mode":"option","documentType":"passport","issuingCountryCode":"CH","relatedCitizenshipCountryCode":"CH"},"transitCountryCode":null,"destinationCountryCode":"DE"},"conditions":{"status":"unconditional"}},"research":{"key":"research-request:v1:b682f1de48389c7d5a3ac0d39fa4406d0e3796be91fb6e253bfd5a45cf7f945a","factKind":"requirement_effect","ruleScopeKey":"rule-scope:v1:3a24b4bc807a384b6d08e105f1107cc45d6d83c07c75eff01bc0ffc43f61477f","researchReason":{"status":"missing"}},"revision":41,"createdAt":"2026-11-15T16:36:02.293Z","updatedAt":"2026-11-15T16:37:04.504Z","contextKey":"official-truth-context:v3:bfce3bc64dbd7c670441e05033c31f339e03a2c488ab54937320508333c252c2","lastFailure":null,"operationId":"op3_91a38dc806d3f21bac3d9d16493c6be6","attemptLimit":4,"nextAttemptAt":null,"resultDecisionRef":null,"predecessorRevision":40},"start_count":11,"open_attempt":"execution-attempt:v3:89720170633a22f22effbf861d9b7c18a465546b43999375f567145a1449d3de","subject_text":"{\"context\":{\"conditions\":{\"status\":\"unconditional\"},\"route\":\"direct_entry\",\"scope\":{\"citizenship\":{\"countryCodes\":[\"CH\"],\"mode\":\"required\"},\"credentialOption\":{\"documentType\":\"passport\",\"issuingCountryCode\":\"CH\",\"mode\":\"option\",\"relatedCitizenshipCountryCode\":\"CH\"},\"destinationCountryCode\":\"DE\",\"requirementType\":\"visa\",\"residence\":{\"mode\":\"not_applicable\"},\"transitCountryCode\":null,\"validity\":{\"mode\":\"not_applicable\"}}},\"factKind\":\"requirement_effect\",\"kind\":\"rule_research\",\"method\":{\"methodId\":\"jetnity-destination-primary-ch-de-visa\",\"revision\":1}}","method_binding":{"methodId":"jetnity-destination-primary-ch-de-visa","revision":1,"methodDigest":"44ce02752da05796bef98c55b5099b81f915fe6b0975472e163721a06793bdb3","packageDigest":"0beb25db2e1f6e4c2c96d61ded30b59a8e06a32ed94498903fbeecc3b6f267e9"},"operation_count":45,"terminal_credit_claim":"op3_2b7811ed9b5f488cbffcd09a0ec0409b"}'::jsonb
      OR retired.before_state->'previousRetirements' IS DISTINCT FROM jsonb_build_object('first',COALESCE((SELECT jsonb_agg(jsonb_build_object('attemptKey',r.attempt_key,'rowDigest',encode(sha256(convert_to((to_jsonb(r)||jsonb_build_object('retired_at',extract(epoch FROM r.retired_at)))::text,'UTF8')),'hex'),'ownerOperationDigest',encode(sha256(convert_to((to_jsonb(prior_receipt)||jsonb_build_object('recorded_at',extract(epoch FROM prior_receipt.recorded_at)))::text,'UTF8')),'hex')) ORDER BY r.attempt_key COLLATE "C") FROM official_v3_guard_private.retired_attempts_v1 r JOIN official_v3_guard_private.owner_operations_v1 prior_receipt ON prior_receipt.operation_id=r.owner_operation_id),'[]'::jsonb),'later',COALESCE((SELECT jsonb_agg(jsonb_build_object('attemptKey',r.attempt_key,'rowDigest',encode(sha256(convert_to((to_jsonb(r)||jsonb_build_object('retired_at',extract(epoch FROM r.retired_at)))::text,'UTF8')),'hex'),'ownerOperationDigest',encode(sha256(convert_to((to_jsonb(prior_receipt)||jsonb_build_object('recorded_at',extract(epoch FROM prior_receipt.recorded_at)))::text,'UTF8')),'hex')) ORDER BY r.attempt_key COLLATE "C") FROM official_v3_guard_private.retired_later_attempts_v1 r JOIN official_v3_guard_private.owner_operations_v1 prior_receipt ON prior_receipt.operation_id=r.owner_operation_id),'[]'::jsonb),'refresh',COALESCE((SELECT jsonb_agg(jsonb_build_object('attemptKey',r.attempt_key,'rowDigest',encode(sha256(convert_to((to_jsonb(r)||jsonb_build_object('retired_at',extract(epoch FROM r.retired_at)))::text,'UTF8')),'hex'),'ownerOperationDigest',encode(sha256(convert_to((to_jsonb(prior_receipt)||jsonb_build_object('recorded_at',extract(epoch FROM prior_receipt.recorded_at)))::text,'UTF8')),'hex')) ORDER BY r.attempt_key COLLATE "C") FROM official_v3_guard_private.retired_refresh_attempts_v1 r JOIN official_v3_guard_private.owner_operations_v1 prior_receipt ON prior_receipt.operation_id=r.owner_operation_id),'[]'::jsonb))
      OR op.action IS DISTINCT FROM 'retire_unknown' OR op.recorded_at IS DISTINCT FROM retired.retired_at
      OR op.expected_digest IS DISTINCT FROM encode(sha256(convert_to(retired.before_state::text,'UTF8')),'hex')
      OR op.receipt IS DISTINCT FROM jsonb_build_object('schema',1,'status','recorded','action','retire_unknown',
        'operationId',op.operation_id,'selection',op.expected_digest,'result','unknown_retired',
        'recordedAt',to_char(op.recorded_at AT TIME ZONE 'UTC','YYYY-MM-DD"T"HH24:MI:SS.MS"Z"'))
      OR (j#>>'{leasedJob,lease,expiresAt}')::timestamptz>=retired.retired_at
      OR (retired.before_state#>>'{intake,expires_at}')::timestamptz>=retired.retired_at THEN
      RAISE EXCEPTION 'bg1 cycle4 retirement receipt binding' USING ERRCODE='P7906'; END IF;
    PERFORM official_v3_guard_private.check_retired_jobs_v1(retired.before_state);
    PERFORM official_v3_guard_private.check_retired_s1_v1(retired.before_state);
    PERFORM official_v3_guard_private.check_retired_hrs_v1(retired.before_state);
  END LOOP;
END $cycle4_body$;

CREATE OR REPLACE FUNCTION public.official_v3_guard_retire_v1(p_operation_id text,p_selection text) RETURNS jsonb
LANGUAGE plpgsql VOLATILE SECURITY DEFINER SET search_path=pg_catalog SET statement_timeout='5s' SET lock_timeout='2s' AS $cycle4_body$
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
  IF n=1 AND snapshot->>'kind' NOT IN ('ch_de_refresh_unknown','ch_de_cycle4_unknown') AND EXISTS(SELECT 1 FROM official_v3_guard_private.retired_attempts_v1) THEN
    RAISE EXCEPTION 'bg1 first attempt already closed' USING ERRCODE='P7906'; END IF;
  instant:=clock_timestamp();
  receipt_value:=jsonb_build_object('schema',1,'status','recorded','action','retire_unknown','operationId',p_operation_id,'selection',p_selection,
    'result','unknown_retired','recordedAt',to_char(instant AT TIME ZONE 'UTC','YYYY-MM-DD"T"HH24:MI:SS.MS"Z"'));
  INSERT INTO official_v3_guard_private.owner_operations_v1 VALUES(p_operation_id,'retire_unknown',p_selection,auth.uid(),instant,receipt_value);
  IF snapshot->>'kind'='ch_de_cycle4_unknown' THEN
    INSERT INTO official_v3_guard_private.retired_cycle4_attempts_v1 VALUES(snapshot#>>'{job,attemptKey}',snapshot#>>'{job,jobKey}',snapshot#>>'{job,claimOperationId}',
      snapshot#>>'{job,intakeOperationId}',p_operation_id,snapshot,instant);
  ELSIF snapshot->>'kind'='ch_de_refresh_unknown' THEN
    INSERT INTO official_v3_guard_private.retired_refresh_attempts_v1 VALUES(snapshot#>>'{job,attemptKey}',snapshot#>>'{job,jobKey}',snapshot#>>'{job,claimOperationId}',
      snapshot#>>'{job,intakeOperationId}',p_operation_id,snapshot,instant);
  ELSIF n=1 THEN
    INSERT INTO official_v3_guard_private.retired_attempts_v1 VALUES(snapshot#>>'{job,attemptKey}',snapshot#>>'{job,jobKey}',snapshot#>>'{job,claimOperationId}',
      snapshot#>>'{job,intakeOperationId}',p_operation_id,snapshot,instant);
  ELSE
    INSERT INTO official_v3_guard_private.retired_later_attempts_v1 VALUES(snapshot#>>'{job,attemptKey}',snapshot#>>'{job,jobKey}',n,snapshot#>>'{job,claimOperationId}',
      snapshot#>>'{job,intakeOperationId}',p_operation_id,snapshot,instant);
  END IF;
  PERFORM official_v3_guard_private.close_jobs_v1(snapshot#>>'{job,attemptKey}');
  PERFORM official_v3_guard_private.check_retirements_v1();
  PERFORM official_v3_guard_private.fixed_method_v1();
  IF n>1 OR snapshot->>'kind' IN ('ch_de_refresh_unknown','ch_de_cycle4_unknown') THEN PERFORM official_v3_guard_private.require_open_v1(); END IF;
  PERFORM official_v3_guard_private.owner_session_v1();
  RETURN receipt_value;
END $cycle4_body$;

CREATE OR REPLACE FUNCTION official_v3_guard_private.jobs_catalog_v1() RETURNS TABLE(object_identity text,fingerprint jsonb)
LANGUAGE sql STABLE SECURITY DEFINER SET search_path=pg_catalog AS $cycle4_body$
SELECT key,value FROM official_v3_guard_private.cycle4_recovery_baseline_v1 b,
LATERAL jsonb_each(b.jobs_catalog) WHERE b.singleton
$cycle4_body$;

CREATE OR REPLACE FUNCTION official_v3_guard_private.hrs_catalog_v1() RETURNS jsonb
LANGUAGE sql STABLE SECURITY DEFINER SET search_path=pg_catalog AS $cycle4_body$
SELECT hrs_catalog FROM official_v3_guard_private.cycle4_recovery_baseline_v1 WHERE singleton
$cycle4_body$;

CREATE OR REPLACE FUNCTION official_v3_guard_private.assert_catalog_v1() RETURNS void
LANGUAGE plpgsql VOLATILE SECURITY DEFINER SET search_path=pg_catalog AS $cycle4_body$
DECLARE successor official_v3_guard_private.recovery_baseline_v1%ROWTYPE;
  predecessor official_v3_guard_private.status_baseline_v1%ROWTYPE; old_baselines jsonb;
  gap_baseline official_v3_guard_private.gap_recovery_baseline_v1%ROWTYPE;
  rolling official_v3_guard_private.rolling_quota_baseline_v1%ROWTYPE;
  customer official_v3_guard_private.customer_information_baseline_v1%ROWTYPE;
  refresh official_v3_guard_private.refresh_retirement_baseline_v1%ROWTYPE;
  cycle4 official_v3_guard_private.cycle4_recovery_baseline_v1%ROWTYPE;
BEGIN
  SELECT * INTO STRICT cycle4 FROM official_v3_guard_private.cycle4_recovery_baseline_v1 WHERE singleton;
  SELECT * INTO STRICT refresh FROM official_v3_guard_private.refresh_retirement_baseline_v1 WHERE singleton;
  SELECT * INTO STRICT customer FROM official_v3_guard_private.customer_information_baseline_v1 WHERE singleton;
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
    OR customer.predecessor_provider_digest<>'7324c5e87d18de2a692e7e61123a44565ca440ecc9f8e9afddf379ede2aac32a'
    OR customer.definitions_digest<>'6c5d64c50389caf424d99b204e7f0f08ba64c0f669e7b9e3f8cccead2deb992f'
    OR customer.history_definition_digest<>'061e62165021fe13959b72bfb3135114d5c77b5119f32eb7233e1290d586d692'
    OR customer.history_guard_definition_digest<>'f4a6ee4ade45524bd8ce12e389b9958568c6e2bcda1c103d22233e1e3d32987b'
    OR customer.atomic_claim_definition_digest<>'75f43cdf119fe9bd862dd5bdcbbd6d53da974b09a6162ad999f23ab62fd3af8a'
    OR customer.predecessor_catalog_digest IS DISTINCT FROM encode(sha256(convert_to(rolling.catalog::text,'UTF8')),'hex')
    OR customer.predecessor_rolling_digest IS DISTINCT FROM encode(sha256(convert_to((to_jsonb(rolling)||jsonb_build_object('proof_not_before',extract(epoch FROM rolling.proof_not_before)))::text,'UTF8')),'hex')
    OR refresh.predecessor_provider_digest<>'cd886ead66b92ec48ee9c5c5a214f310bc6e6645e1fc15f88a78650fcb95b37f'
    OR refresh.original_evidence_digest<>'be111b7f3b024a7b967e80ceeb9b844ea5a63d67042218f4cc10e23329de7ea0'
    OR refresh.predecessor_catalog_digest IS DISTINCT FROM encode(sha256(convert_to(customer.catalog::text,'UTF8')),'hex')
    OR refresh.predecessor_customer_digest IS DISTINCT FROM encode(sha256(convert_to((to_jsonb(customer)||jsonb_build_object('proof_not_before',extract(epoch FROM customer.proof_not_before)))::text,'UTF8')),'hex')
    OR cycle4.predecessor_provider_digest<>'e71c729360c0e36e7d3a00504b8f013d716ef33c76ae35c9e8fbb484d01c67fe'
    OR cycle4.original_evidence_digest<>'5829475017f545d3ba1573de7d94593754bfc280262b9c7dd44a04d66cad3f14'
    OR cycle4.predecessor_catalog_digest IS DISTINCT FROM encode(sha256(convert_to(refresh.catalog::text,'UTF8')),'hex')
    OR cycle4.predecessor_refresh_digest IS DISTINCT FROM encode(sha256(convert_to((to_jsonb(refresh)||jsonb_build_object('proof_not_before',extract(epoch FROM refresh.proof_not_before)))::text,'UTF8')),'hex')
    OR cycle4.catalog IS DISTINCT FROM official_v3_guard_private.catalog_status_v1() THEN
    RAISE EXCEPTION 'bg1 recovery protected catalog changed' USING ERRCODE='P7905'; END IF;
END $cycle4_body$;

CREATE OR REPLACE FUNCTION official_v3_guard_private.require_open_v1() RETURNS bigint
LANGUAGE plpgsql VOLATILE SECURITY DEFINER SET search_path=pg_catalog AS $cycle4_body$
DECLARE s official_v3_guard_private.state_v1%ROWTYPE; instant timestamptz;
  required_proof bigint; earliest_proof timestamptz;
BEGIN
  SELECT * INTO s FROM official_v3_guard_private.state_v1 WHERE singleton FOR SHARE;
  instant:=clock_timestamp();
  IF NOT FOUND OR s.generation=0 OR s.incident_generation<>s.resumed_generation
    OR instant<s.last_observed OR instant<s.last_finished OR instant>=s.valid_until
    OR s.last_finished>s.last_started+interval '30 seconds' OR s.valid_until<>s.last_due+interval '5 minutes 30 seconds' THEN
    RAISE EXCEPTION 'bg1 integrity unavailable' USING ERRCODE='P7902'; END IF;
  SELECT greatest(k.required_generation,f.required_generation,c.required_generation,q.required_generation,g.required_generation,r.required_generation,b.required_generation),greatest(k.proof_not_before,f.proof_not_before,c.proof_not_before,q.proof_not_before,g.proof_not_before,r.proof_not_before,b.proof_not_before)
    INTO STRICT required_proof,earliest_proof FROM official_v3_guard_private.cycle4_recovery_baseline_v1 k CROSS JOIN official_v3_guard_private.refresh_retirement_baseline_v1 f CROSS JOIN official_v3_guard_private.customer_information_baseline_v1 c
      CROSS JOIN official_v3_guard_private.rolling_quota_baseline_v1 q
      CROSS JOIN official_v3_guard_private.gap_recovery_baseline_v1 g
      CROSS JOIN official_v3_guard_private.recovery_baseline_v1 r
      CROSS JOIN official_v3_guard_private.status_baseline_v1 b WHERE k.singleton AND f.singleton AND c.singleton AND q.singleton AND g.singleton AND r.singleton AND b.singleton;
  IF s.generation<required_proof OR s.last_proof_started<earliest_proof OR instant<earliest_proof
    OR NOT EXISTS(SELECT 1 FROM official_v3_guard_private.runs_v1 run WHERE run.outcome='complete' AND run.generation=s.generation
      AND run.due_at=s.last_due AND run.started_at=s.last_started AND run.proof_started_at=s.last_proof_started AND run.finished_at=s.last_finished) THEN
    RAISE EXCEPTION 'bg1 recovery fresh full proof required' USING ERRCODE='P7902'; END IF;
  RETURN s.incident_generation;
END $cycle4_body$;

CREATE OR REPLACE FUNCTION public.official_v3_guard_alarm_status_v1() RETURNS jsonb
LANGUAGE plpgsql VOLATILE SECURITY DEFINER SET search_path=pg_catalog AS $cycle4_body$
DECLARE required_proof bigint; earliest_proof timestamptz; current_state official_v3_guard_private.state_v1%ROWTYPE;
  unavailable_value jsonb:=jsonb_build_object('schema',1,'status','unavailable');
BEGIN
  IF official_v3_guard_private.alarm_status_v1() IS DISTINCT FROM jsonb_build_object('schema',1,'status','current') THEN RETURN unavailable_value; END IF;
  SELECT greatest(k.required_generation,f.required_generation,c.required_generation,q.required_generation,g.required_generation,r.required_generation,b.required_generation),greatest(k.proof_not_before,f.proof_not_before,c.proof_not_before,q.proof_not_before,g.proof_not_before,r.proof_not_before,b.proof_not_before)
    INTO STRICT required_proof,earliest_proof FROM official_v3_guard_private.cycle4_recovery_baseline_v1 k CROSS JOIN official_v3_guard_private.refresh_retirement_baseline_v1 f CROSS JOIN official_v3_guard_private.customer_information_baseline_v1 c
      CROSS JOIN official_v3_guard_private.rolling_quota_baseline_v1 q
      CROSS JOIN official_v3_guard_private.gap_recovery_baseline_v1 g
      CROSS JOIN official_v3_guard_private.recovery_baseline_v1 r
      CROSS JOIN official_v3_guard_private.status_baseline_v1 b WHERE k.singleton AND f.singleton AND c.singleton AND q.singleton AND g.singleton AND r.singleton AND b.singleton;
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
END $cycle4_body$;

SET LOCAL ROLE ot_v3_jobs_owner;
CREATE OR REPLACE FUNCTION official_v3_jobs_private.tx_execution_read_v1(q jsonb,b jsonb,e integer,remaining integer,deadline timestamptz) RETURNS jsonb
LANGUAGE plpgsql VOLATILE PARALLEL UNSAFE SECURITY INVOKER CALLED ON NULL INPUT SET search_path=pg_catalog,pg_temp AS $cycle4_body$
DECLARE claim jsonb:=q#>'{body,claim}'; s official_v3_jobs_private.subjects_v1%ROWTYPE; t official_v3_jobs_private.execution_starts_v1%ROWTYPE;
  r official_v3_jobs_private.execution_results_v1%ROWTYPE; d official_v3_jobs_private.execution_dispositions_v1%ROWTYPE; c jsonb; response jsonb; lease text;
BEGIN
  SELECT * INTO s FROM official_v3_jobs_private.subjects_v1 WHERE job_key=claim->>'jobKey';
  SELECT * INTO t FROM official_v3_jobs_private.execution_starts_v1 WHERE claim_operation_id=claim->>'operationId';
  IF NOT FOUND THEN RETURN jsonb_build_object('reply',jsonb_build_object('status','absent'),'authority',false); END IF;
  IF t.claim_text IS DISTINCT FROM official_v3_jobs_private.canonical_v1(claim,0) OR t.job_key IS DISTINCT FROM s.job_key THEN
    RETURN jsonb_build_object('reply',jsonb_build_object('status','collision'),'authority',false); END IF;
  SELECT * INTO r FROM official_v3_jobs_private.execution_results_v1 WHERE attempt_key=t.attempt_key;
  IF NOT FOUND THEN
    -- A permanently retired original has no resumable result custody. This
    -- exact read does not erase its START, restore a token or authorize work.
    -- The normal caller must still confirm the original claim and perform the
    -- full subsequent queue CAS and MA1 checks before a new START is possible.
    -- A permanently retired original has no resumable result custody. This
    -- exact read does not erase its START, restore a token or authorize work.
    -- The normal caller must still confirm the original claim and perform the
    -- full subsequent queue CAS and MA1 checks before a new START is possible.
    IF q#>>'{body,purpose}'='resume' AND t.attempt_key='execution-attempt:v3:89720170633a22f22effbf861d9b7c18a465546b43999375f567145a1449d3de' THEN
      c:=official_v3_guard_private.retired_state_v1(t.attempt_key);
      IF c->>'kind'='ch_de_cycle4_unknown'
        AND c->>'originalEvidenceDigest'='5829475017f545d3ba1573de7d94593754bfc280262b9c7dd44a04d66cad3f14'
        AND c#>'{job,subjectState}'='{"kind":"rule_research","job_key":"research-job:v3:74713fe665cab1a7603f6e93ab06b6a1d1964e83a69571b8cced0ff009032513","slot_id":1,"current_job":{"kind":"research_job_record","jobId":"job3_c70d23ff344cdf2998818ecf5243d15e","lease":{"leaseId":"lease3_491cf756e95d47e0892613c0e81c556b","expiresAt":"2026-11-15T16:37:34.504Z","acquiredAt":"2026-11-15T16:37:04.504Z","generation":41},"state":"leased","jobKey":"research-job:v3:74713fe665cab1a7603f6e93ab06b6a1d1964e83a69571b8cced0ff009032513","method":{"methodId":"jetnity-destination-primary-ch-de-visa","revision":1},"schema":3,"attempt":1,"context":{"route":"direct_entry","scope":{"validity":{"mode":"not_applicable"},"residence":{"mode":"not_applicable"},"citizenship":{"mode":"required","countryCodes":["CH"]},"requirementType":"visa","credentialOption":{"mode":"option","documentType":"passport","issuingCountryCode":"CH","relatedCitizenshipCountryCode":"CH"},"transitCountryCode":null,"destinationCountryCode":"DE"},"conditions":{"status":"unconditional"}},"research":{"key":"research-request:v1:b682f1de48389c7d5a3ac0d39fa4406d0e3796be91fb6e253bfd5a45cf7f945a","factKind":"requirement_effect","ruleScopeKey":"rule-scope:v1:3a24b4bc807a384b6d08e105f1107cc45d6d83c07c75eff01bc0ffc43f61477f","researchReason":{"status":"missing"}},"revision":41,"createdAt":"2026-11-15T16:36:02.293Z","updatedAt":"2026-11-15T16:37:04.504Z","contextKey":"official-truth-context:v3:bfce3bc64dbd7c670441e05033c31f339e03a2c488ab54937320508333c252c2","lastFailure":null,"operationId":"op3_91a38dc806d3f21bac3d9d16493c6be6","attemptLimit":4,"nextAttemptAt":null,"resultDecisionRef":null,"predecessorRevision":40},"start_count":11,"open_attempt":"execution-attempt:v3:89720170633a22f22effbf861d9b7c18a465546b43999375f567145a1449d3de","subject_text":"{\"context\":{\"conditions\":{\"status\":\"unconditional\"},\"route\":\"direct_entry\",\"scope\":{\"citizenship\":{\"countryCodes\":[\"CH\"],\"mode\":\"required\"},\"credentialOption\":{\"documentType\":\"passport\",\"issuingCountryCode\":\"CH\",\"mode\":\"option\",\"relatedCitizenshipCountryCode\":\"CH\"},\"destinationCountryCode\":\"DE\",\"requirementType\":\"visa\",\"residence\":{\"mode\":\"not_applicable\"},\"transitCountryCode\":null,\"validity\":{\"mode\":\"not_applicable\"}}},\"factKind\":\"requirement_effect\",\"kind\":\"rule_research\",\"method\":{\"methodId\":\"jetnity-destination-primary-ch-de-visa\",\"revision\":1}}","method_binding":{"methodId":"jetnity-destination-primary-ch-de-visa","revision":1,"methodDigest":"44ce02752da05796bef98c55b5099b81f915fe6b0975472e163721a06793bdb3","packageDigest":"0beb25db2e1f6e4c2c96d61ded30b59a8e06a32ed94498903fbeecc3b6f267e9"},"operation_count":45,"terminal_credit_claim":"op3_2b7811ed9b5f488cbffcd09a0ec0409b"}'::jsonb
        AND c#>>'{job,attemptKey}'=t.attempt_key
        AND c#>>'{job,claimOperationId}'='op3_2b7811ed9b5f488cbffcd09a0ec0409b'
        AND c#>'{job,claim}'=claim AND claim='{"jobKey":"research-job:v3:74713fe665cab1a7603f6e93ab06b6a1d1964e83a69571b8cced0ff009032513","leaseId":"lease3_491cf756e95d47e0892613c0e81c556b","leaseMilliseconds":30000,"operationId":"op3_2b7811ed9b5f488cbffcd09a0ec0409b"}'::jsonb
        AND c#>'{job,leasedJob}'=t.leased_job AND c#>'{job,authority}'=t.authority
        AND to_jsonb(s)=(c#>'{job,subjectState}'||jsonb_build_object('open_attempt',NULL))
        AND s.open_attempt IS NULL
        AND NOT EXISTS(SELECT 1 FROM official_v3_jobs_private.execution_dispositions_v1 WHERE attempt_key=t.attempt_key) THEN
        RETURN jsonb_build_object('reply',jsonb_build_object('status','absent'),'authority',false);
      END IF;
    END IF;
    IF q#>>'{body,purpose}'='resume' AND t.attempt_key='execution-attempt:v3:3a32cf934505f82ba078e4e41afa60c4f47c2fa29e53be1f33a2976bf5d69aea' THEN
      c:=official_v3_guard_private.retired_state_v1(t.attempt_key);
      IF c->>'kind'='ch_de_refresh_unknown'
        AND c->>'originalEvidenceDigest'='be111b7f3b024a7b967e80ceeb9b844ea5a63d67042218f4cc10e23329de7ea0'
        AND c#>'{job,subjectState}'='{"kind":"rule_research","job_key":"research-job:v3:74713fe665cab1a7603f6e93ab06b6a1d1964e83a69571b8cced0ff009032513","slot_id":1,"current_job":{"kind":"research_job_record","jobId":"job3_e1467267780885ae38068e6be1738958","lease":{"leaseId":"lease3_1d7d014131bb4d42a09058b719edfaf5","expiresAt":"2026-11-15T10:45:56.164Z","acquiredAt":"2026-11-15T10:45:26.164Z","generation":37},"state":"leased","jobKey":"research-job:v3:74713fe665cab1a7603f6e93ab06b6a1d1964e83a69571b8cced0ff009032513","method":{"methodId":"jetnity-destination-primary-ch-de-visa","revision":1},"schema":3,"attempt":1,"context":{"route":"direct_entry","scope":{"validity":{"mode":"not_applicable"},"residence":{"mode":"not_applicable"},"citizenship":{"mode":"required","countryCodes":["CH"]},"requirementType":"visa","credentialOption":{"mode":"option","documentType":"passport","issuingCountryCode":"CH","relatedCitizenshipCountryCode":"CH"},"transitCountryCode":null,"destinationCountryCode":"DE"},"conditions":{"status":"unconditional"}},"research":{"key":"research-request:v1:b682f1de48389c7d5a3ac0d39fa4406d0e3796be91fb6e253bfd5a45cf7f945a","factKind":"requirement_effect","ruleScopeKey":"rule-scope:v1:3a24b4bc807a384b6d08e105f1107cc45d6d83c07c75eff01bc0ffc43f61477f","researchReason":{"status":"missing"}},"revision":37,"createdAt":"2026-11-15T10:45:20.652Z","updatedAt":"2026-11-15T10:45:26.164Z","contextKey":"official-truth-context:v3:bfce3bc64dbd7c670441e05033c31f339e03a2c488ab54937320508333c252c2","lastFailure":null,"operationId":"op3_3c550f64e49d0b2b1af14f09edca65c1","attemptLimit":4,"nextAttemptAt":null,"resultDecisionRef":null,"predecessorRevision":36},"start_count":9,"open_attempt":"execution-attempt:v3:3a32cf934505f82ba078e4e41afa60c4f47c2fa29e53be1f33a2976bf5d69aea","subject_text":"{\"context\":{\"conditions\":{\"status\":\"unconditional\"},\"route\":\"direct_entry\",\"scope\":{\"citizenship\":{\"countryCodes\":[\"CH\"],\"mode\":\"required\"},\"credentialOption\":{\"documentType\":\"passport\",\"issuingCountryCode\":\"CH\",\"mode\":\"option\",\"relatedCitizenshipCountryCode\":\"CH\"},\"destinationCountryCode\":\"DE\",\"requirementType\":\"visa\",\"residence\":{\"mode\":\"not_applicable\"},\"transitCountryCode\":null,\"validity\":{\"mode\":\"not_applicable\"}}},\"factKind\":\"requirement_effect\",\"kind\":\"rule_research\",\"method\":{\"methodId\":\"jetnity-destination-primary-ch-de-visa\",\"revision\":1}}","method_binding":{"methodId":"jetnity-destination-primary-ch-de-visa","revision":1,"methodDigest":"44ce02752da05796bef98c55b5099b81f915fe6b0975472e163721a06793bdb3","packageDigest":"0beb25db2e1f6e4c2c96d61ded30b59a8e06a32ed94498903fbeecc3b6f267e9"},"operation_count":41,"terminal_credit_claim":"op3_af6a4ab203d24be7869136eec570468e"}'::jsonb
        AND c#>>'{job,attemptKey}'=t.attempt_key
        AND c#>>'{job,claimOperationId}'='op3_af6a4ab203d24be7869136eec570468e'
        AND c#>'{job,claim}'=claim AND claim='{"jobKey":"research-job:v3:74713fe665cab1a7603f6e93ab06b6a1d1964e83a69571b8cced0ff009032513","leaseId":"lease3_1d7d014131bb4d42a09058b719edfaf5","leaseMilliseconds":30000,"operationId":"op3_af6a4ab203d24be7869136eec570468e"}'::jsonb
        AND c#>'{job,leasedJob}'=t.leased_job AND c#>'{job,authority}'=t.authority
        AND to_jsonb(s)=(c#>'{job,subjectState}'||jsonb_build_object('open_attempt',NULL))
        AND s.open_attempt IS NULL
        AND NOT EXISTS(SELECT 1 FROM official_v3_jobs_private.execution_dispositions_v1 WHERE attempt_key=t.attempt_key) THEN
        RETURN jsonb_build_object('reply',jsonb_build_object('status','absent'),'authority',false);
      END IF;
    END IF;
    RETURN jsonb_build_object('reply',jsonb_build_object('status','blocked'),'authority',false);
  END IF;
  SELECT * INTO d FROM official_v3_jobs_private.execution_dispositions_v1 WHERE attempt_key=t.attempt_key;
  IF d.attempt_key IS NULL THEN
    IF s.current_job IS DISTINCT FROM t.leased_job OR s.open_attempt IS DISTINCT FROM t.attempt_key THEN
      RETURN jsonb_build_object('reply',jsonb_build_object('status','blocked'),'authority',false); END IF;
    response:=jsonb_build_object('status','prepared','attemptKey',t.attempt_key,'claim',claim,'leasedJob',t.leased_job,'result',r.result,'references',r."references");
    lease:=t.leased_job#>>'{lease,expiresAt}';
  ELSIF d.kind='completed' THEN
    SELECT envelope_text::jsonb INTO c FROM official_v3_jobs_private.queue_operations_v1 WHERE operation_id=d.queue_operation_id;
    IF c->'expected' IS DISTINCT FROM t.leased_job OR c->'next' IS DISTINCT FROM s.current_job OR s.current_job->>'state'<>'succeeded'
      OR s.current_job->'jobId' IS DISTINCT FROM t.leased_job->'jobId' THEN
      RETURN jsonb_build_object('reply',jsonb_build_object('status','blocked'),'authority',false); END IF;
    response:=jsonb_build_object('status','completed','attemptKey',t.attempt_key,'claim',claim,'leasedJob',t.leased_job,
      'job',s.current_job,'result',r.result,'references',r."references");
  ELSE RETURN jsonb_build_object('reply',jsonb_build_object('status','blocked'),'authority',false); END IF;
  IF q->>'phase'='authorized' AND t.authority IS DISTINCT FROM (b||jsonb_build_object('epoch',e)) THEN
    RETURN jsonb_build_object('reply',jsonb_build_object('status','blocked'),'authority',false); END IF;
  RETURN jsonb_build_object('reply',response,'authority',true,'references',r."references",'job',t.leased_job,'result',r.result,'lease',lease);
END $cycle4_body$;
RESET ROLE;

REVOKE CREATE ON SCHEMA official_v3_guard_private FROM ot_v3_jobs_owner,ot_v3_result_owner;

REVOKE ot_v3_jobs_owner FROM postgres GRANTED BY postgres;

REVOKE ot_v3_result_owner FROM postgres GRANTED BY postgres;

CREATE TEMP TABLE cycle4_objects(classid oid,objid oid,PRIMARY KEY(classid,objid)) ON COMMIT DROP;
DO $cycle4_delta$
DECLARE approved jsonb:='[{"signature":"official_v3_guard_private.recovery_jobs_v1()","name":"official_v3_guard_private.recovery_jobs_v1","owner":"ot_v3_jobs_owner","hash":"0b9297b38352fec049303c5635c45204dce570908ad397711d667ac601ca363e","language":"plpgsql","definer":true,"volatile":"v","config":["search_path=pg_catalog"]},{"signature":"official_v3_guard_private.recovery_hrs_v1()","name":"official_v3_guard_private.recovery_hrs_v1","owner":"ot_v3_result_owner","hash":"e09a1a4ef10f53a7735d80a518cfd30309e672d57bbe250b1817ef7004628023","language":"plpgsql","definer":true,"volatile":"v","config":["search_path=pg_catalog"]},{"signature":"official_v3_guard_private.recovery_snapshot_v1()","name":"official_v3_guard_private.recovery_snapshot_v1","owner":"postgres","hash":"ff43355af09fe639cb314442546aec8418f127b58636ae6a8fc0238dc30f992f","language":"plpgsql","definer":true,"volatile":"v","config":["search_path=pg_catalog"]},{"signature":"official_v3_guard_private.close_jobs_v1(text)","name":"official_v3_guard_private.close_jobs_v1","owner":"ot_v3_jobs_owner","hash":"13e7b8d98638f1ded0077c6c0cbca0fdc0268d72d1f6ed79703106c3b79f2294","language":"plpgsql","definer":true,"volatile":"v","config":["search_path=pg_catalog"]},{"signature":"official_v3_guard_private.check_retired_jobs_v1(jsonb)","name":"official_v3_guard_private.check_retired_jobs_v1","owner":"ot_v3_jobs_owner","hash":"58721d2ab352906a246c242856d520a7a2836aa6766bf8b6382994ff5bc5d60c","language":"plpgsql","definer":true,"volatile":"v","config":["search_path=pg_catalog"]},{"signature":"official_v3_guard_private.check_retired_hrs_v1(jsonb)","name":"official_v3_guard_private.check_retired_hrs_v1","owner":"ot_v3_result_owner","hash":"5d2057ff64f02eb0a04f5086e1662b52c4822addb43dfce108d07adeb58db925","language":"plpgsql","definer":true,"volatile":"v","config":["search_path=pg_catalog"]},{"signature":"official_v3_guard_private.intake_retired_v1(text)","name":"official_v3_guard_private.intake_retired_v1","owner":"postgres","hash":"6b93e042f0d81a971216fbaacd78f85d523ae8d7d5ab30aeb192555a5e355661","language":"sql","definer":true,"volatile":"s","config":["search_path=pg_catalog"]},{"signature":"official_v3_guard_private.attempt_retired_v1(text)","name":"official_v3_guard_private.attempt_retired_v1","owner":"postgres","hash":"761f1062ba37d11ace4c396455f6a362b44cc1dd1270760be12a0e3241ad815b","language":"sql","definer":true,"volatile":"s","config":["search_path=pg_catalog"]},{"signature":"official_v3_guard_private.retired_state_v1(text)","name":"official_v3_guard_private.retired_state_v1","owner":"postgres","hash":"b4c33ebc030bf6d4c2048121f23ec5e7f6f078d6a7f8f46e38b9d1f01b9bad49","language":"sql","definer":true,"volatile":"s","config":["search_path=pg_catalog"]},{"signature":"official_v3_guard_private.check_retirements_v1()","name":"official_v3_guard_private.check_retirements_v1","owner":"postgres","hash":"24cffa29b97c764bdf9b9b7fb5c06f80b9b865ffed0d4eddf2cf44b86a500d78","language":"plpgsql","definer":true,"volatile":"v","config":["search_path=pg_catalog"]},{"signature":"public.official_v3_guard_retire_v1(text,text)","name":"public.official_v3_guard_retire_v1","owner":"postgres","hash":"1d79e7e915a347c41410035f5cfece168333f63c18dd4576259f28a4119f3646","language":"plpgsql","definer":true,"volatile":"v","config":["search_path=pg_catalog","statement_timeout=5s","lock_timeout=2s"]},{"signature":"official_v3_guard_private.jobs_catalog_v1()","name":"official_v3_guard_private.jobs_catalog_v1","owner":"postgres","hash":"b5d2a695d861a90f2fbfb2a379f7dc3d721b5488d08e8243193fdb4fa8aecec0","language":"sql","definer":true,"volatile":"s","config":["search_path=pg_catalog"]},{"signature":"official_v3_guard_private.hrs_catalog_v1()","name":"official_v3_guard_private.hrs_catalog_v1","owner":"postgres","hash":"9ae85db3b4e1d8307deea3bcb9b46f741d060d2b20ab292874e85080b5ae7554","language":"sql","definer":true,"volatile":"s","config":["search_path=pg_catalog"]},{"signature":"official_v3_guard_private.assert_catalog_v1()","name":"official_v3_guard_private.assert_catalog_v1","owner":"postgres","hash":"6ab248a90bd97a68b4fbe4feb57f69132aec7da14fd5d8e0698c233c6649bb25","language":"plpgsql","definer":true,"volatile":"v","config":["search_path=pg_catalog"]},{"signature":"official_v3_guard_private.require_open_v1()","name":"official_v3_guard_private.require_open_v1","owner":"postgres","hash":"a368c6b9d6f26af237c2317d5dcc047dad3a622d3fb5ebe02175b02e320b0450","language":"plpgsql","definer":true,"volatile":"v","config":["search_path=pg_catalog"]},{"signature":"public.official_v3_guard_alarm_status_v1()","name":"public.official_v3_guard_alarm_status_v1","owner":"postgres","hash":"31c0729958c662b199e45c8a99815b158ed5d3ad71f166a5aa1a1ef909ef9f6d","language":"plpgsql","definer":true,"volatile":"v","config":["search_path=pg_catalog"]},{"signature":"official_v3_jobs_private.tx_execution_read_v1(jsonb,jsonb,integer,integer,timestamptz)","name":"official_v3_jobs_private.tx_execution_read_v1","owner":"ot_v3_jobs_owner","hash":"a9486f53836a7d89d22ac3affa8fcf0877cc3aef6ef0feb81106cfaea31cbe35","language":"plpgsql","definer":false,"volatile":"v","config":["search_path=pg_catalog, pg_temp"]}]'::jsonb; expected record; actual pg_proc%ROWTYPE;
 before_catalog jsonb; after_catalog jsonb; entry record; relation_id oid;
 class_value oid; object_value oid; replacement_ids oid[]:='{}'; addition_ids oid[]:='{}';
 result_value jsonb; current_value jsonb; jobs_snapshot jsonb; hrs_snapshot jsonb; table_name text; expected_columns jsonb;
BEGIN
 IF COALESCE((SELECT jsonb_agg(to_jsonb(r) ORDER BY r.oid) FROM pg_roles r),'[]'::jsonb)
     IS DISTINCT FROM (SELECT value FROM pg_temp.cycle4_before WHERE kind='roles')
   OR COALESCE((SELECT jsonb_agg(to_jsonb(m) ORDER BY m.oid) FROM pg_auth_members m),'[]'::jsonb)
     IS DISTINCT FROM (SELECT value FROM pg_temp.cycle4_before WHERE kind='memberships')
   OR (SELECT jsonb_build_object('owner',nspowner,'acl',nspacl) FROM pg_namespace WHERE nspname='official_v3_guard_private')
     IS DISTINCT FROM (SELECT value FROM pg_temp.cycle4_before WHERE kind='schema_acl') THEN
   RAISE EXCEPTION 'cycle4 exact authority restoration required' USING ERRCODE='P7923';
 END IF;
 SELECT value INTO STRICT before_catalog FROM pg_temp.cycle4_before WHERE kind='catalog';
 FOR expected IN SELECT * FROM jsonb_to_recordset(approved)
   AS f(signature text,name text,owner text,hash text,language text,definer boolean,volatile text,config jsonb) LOOP
   SELECT * INTO STRICT actual FROM pg_proc WHERE oid=to_regprocedure(expected.signature);
   IF actual.proowner<>to_regrole(expected.owner) OR actual.prokind<>'f' OR actual.proleakproof OR actual.proisstrict
     OR actual.pronargdefaults<>0 OR actual.provariadic<>0 OR actual.proparallel<>'u'
     OR actual.prosecdef<>expected.definer OR actual.provolatile::text<>expected.volatile
     OR (SELECT lanname FROM pg_language WHERE oid=actual.prolang)<>expected.language
     OR to_jsonb(actual.proconfig) IS DISTINCT FROM expected.config
     OR encode(sha256(convert_to(actual.prosrc,'UTF8')),'hex') IS DISTINCT FROM expected.hash THEN
     RAISE EXCEPTION 'cycle4 exact existing function contract: %',expected.signature USING ERRCODE='P7923';
   END IF;
   IF NOT before_catalog ? ('function:'||actual.oid) THEN
     RAISE EXCEPTION 'cycle4 forbids new functions' USING ERRCODE='P7923'; END IF;
   replacement_ids:=array_append(replacement_ids,actual.oid);
 END LOOP;
 IF cardinality(replacement_ids)<>17 OR cardinality(addition_ids)<>0 THEN
   RAISE EXCEPTION 'cycle4 exactly seventeen existing function bodies required' USING ERRCODE='P7923'; END IF;
 FOREACH table_name IN ARRAY ARRAY['retired_cycle4_attempts_v1','cycle4_recovery_baseline_v1'] LOOP
 relation_id:=to_regclass('official_v3_guard_private.'||table_name);
 expected_columns:=CASE table_name WHEN 'retired_cycle4_attempts_v1' THEN
   '[ ["attempt_key","text",true,false], ["job_key","text",true,false], ["claim_operation_id","text",true,false], ["intake_operation_id","text",true,false], ["owner_operation_id","text",true,false], ["before_state","jsonb",true,false], ["retired_at","timestamp with time zone",true,false] ]'::jsonb
 ELSE
   '[ ["singleton","boolean",true,false], ["predecessor_provider_digest","text",true,false], ["predecessor_catalog_digest","text",true,false], ["predecessor_refresh_digest","text",true,false], ["original_evidence_digest","text",true,false], ["required_generation","bigint",true,false], ["proof_not_before","timestamp with time zone",true,false], ["jobs_catalog","jsonb",true,false], ["hrs_catalog","jsonb",true,false], ["catalog","jsonb",true,false] ]'::jsonb END;
 IF NOT EXISTS(SELECT 1 FROM pg_class c WHERE c.oid=relation_id AND c.relkind='r'
     AND c.relowner='postgres'::regrole AND c.relrowsecurity AND c.relforcerowsecurity)
   OR EXISTS(SELECT 1 FROM pg_class c CROSS JOIN LATERAL aclexplode(COALESCE(c.relacl,acldefault('r',c.relowner))) a
     WHERE c.oid=relation_id AND (a.grantor<>c.relowner OR a.grantee<>c.relowner OR a.is_grantable))
   OR (SELECT jsonb_agg(jsonb_build_array(a.attname,a.atttypid::regtype::text,a.attnotnull,a.attisdropped) ORDER BY a.attnum)
     FROM pg_attribute a WHERE a.attrelid=relation_id AND a.attnum>0) IS DISTINCT FROM expected_columns
   OR (SELECT count(*) FROM pg_policy p WHERE p.polrelid=relation_id)<>1
   OR EXISTS(SELECT 1 FROM pg_policy p WHERE p.polrelid=relation_id AND NOT(
     p.polpermissive AND pg_get_expr(p.polqual,p.polrelid)='true' AND p.polroles=ARRAY['postgres'::regrole::oid]
     AND p.polcmd='*' AND pg_get_expr(p.polwithcheck,p.polrelid)='true' AND p.polname='owner_only'))
   OR (SELECT count(*) FROM pg_trigger t WHERE t.tgrelid=relation_id AND NOT t.tgisinternal)<>2
   OR EXISTS(SELECT 1 FROM pg_trigger t WHERE t.tgrelid=relation_id AND NOT t.tgisinternal
     AND (t.tgfoid<>'official_v3_guard_private.immutable_v1()'::regprocedure OR t.tgenabled<>'O' OR t.tgnargs<>0 OR t.tgqual IS NOT NULL
       OR NOT(t.tgname='immutable_v1' AND t.tgtype=27 OR t.tgname='immutable_truncate_v1' AND t.tgtype=34)))
   OR (SELECT count(*) FROM pg_constraint c WHERE c.conrelid=relation_id AND c.contype='p')<>1
   OR EXISTS(SELECT 1 FROM pg_constraint c WHERE c.conrelid=relation_id AND (c.contype NOT IN ('p','c','u') OR NOT c.convalidated OR c.condeferrable OR c.condeferred))
   OR (SELECT count(*) FROM pg_constraint c WHERE c.conrelid=relation_id AND c.contype='c')<>7
   OR (SELECT count(*) FROM pg_constraint c WHERE c.conrelid=relation_id AND c.contype='u')<>(CASE table_name WHEN 'retired_cycle4_attempts_v1' THEN 3 ELSE 0 END) THEN
   RAISE EXCEPTION 'cycle4 exact private immutable baseline required' USING ERRCODE='P7923';
 END IF;
 INSERT INTO pg_temp.cycle4_objects
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
   RAISE EXCEPTION 'cycle4 predecessor graph changed: %',entry.key USING ERRCODE='P7923';
 END LOOP;
 FOR entry IN SELECT key,value FROM jsonb_each(after_catalog) WHERE NOT before_catalog ? key LOOP
   class_value:=CASE split_part(entry.key,':',1)
     WHEN 'function' THEN 'pg_proc'::regclass
     WHEN 'relation' THEN 'pg_class'::regclass WHEN 'attribute' THEN 'pg_class'::regclass WHEN 'index' THEN 'pg_class'::regclass
     WHEN 'type' THEN 'pg_type'::regclass WHEN 'constraint' THEN 'pg_constraint'::regclass
     WHEN 'trigger' THEN 'pg_trigger'::regclass WHEN 'policy' THEN 'pg_policy'::regclass WHEN 'default' THEN 'pg_attrdef'::regclass
     WHEN 'dependency' THEN (entry.value->>'classid')::oid WHEN 'shared' THEN (entry.value->>'classid')::oid END;
   object_value:=CASE WHEN split_part(entry.key,':',1) IN ('dependency','shared') THEN (entry.value->>'objid')::oid ELSE split_part(entry.key,':',2)::oid END;
   IF class_value IS NULL OR NOT EXISTS(SELECT 1 FROM pg_temp.cycle4_objects o WHERE o.classid=class_value AND o.objid=object_value) THEN
     RAISE EXCEPTION 'cycle4 unreviewed additive edge: %',entry.key USING ERRCODE='P7923';
   END IF;
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
 INSERT INTO official_v3_guard_private.cycle4_recovery_baseline_v1
 SELECT true,'e71c729360c0e36e7d3a00504b8f013d716ef33c76ae35c9e8fbb484d01c67fe',encode(sha256(convert_to(before_catalog::text,'UTF8')),'hex'),
   encode(sha256(convert_to((to_jsonb(prior)||jsonb_build_object('proof_not_before',extract(epoch FROM prior.proof_not_before)))::text,'UTF8')),'hex'),
   '5829475017f545d3ba1573de7d94593754bfc280262b9c7dd44a04d66cad3f14',s.generation+1,clock_timestamp(),jobs_snapshot,hrs_snapshot,after_catalog
   FROM official_v3_guard_private.state_v1 s CROSS JOIN official_v3_guard_private.refresh_retirement_baseline_v1 prior
   WHERE s.singleton AND prior.singleton;
END $cycle4_delta$;


DO $cycle4_postcheck$
DECLARE prior record; table_name text; row_count bigint; row_digest text; current_content jsonb;
BEGIN
  IF EXISTS(SELECT 1 FROM official_v3_guard_private.retired_cycle4_attempts_v1) THEN
    RAISE EXCEPTION 'cycle4 installer cannot retire an attempt' USING ERRCODE='P7923'; END IF;
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
  IF current_content IS DISTINCT FROM (SELECT value FROM pg_temp.cycle4_before WHERE kind='content') THEN
    RAISE EXCEPTION 'cycle4 old certified content changed' USING ERRCODE='P7923';
  END IF;
  FOR prior IN SELECT * FROM pg_temp.cycle4_before WHERE kind LIKE 'table:%' LOOP
    table_name:=substr(prior.kind,7);
    EXECUTE format('SELECT count(*),encode(sha256(convert_to(COALESCE(string_agg(encode(sha256(convert_to(to_jsonb(r)::text,''UTF8'')),''hex''),'''' ORDER BY to_jsonb(r)::text COLLATE "C"),''''),''UTF8'')),''hex'') FROM %s r',table_name::regclass)
      INTO row_count,row_digest;
    IF prior.value IS DISTINCT FROM jsonb_build_object('count',row_count,'digest',row_digest) THEN
      RAISE EXCEPTION 'cycle4 old table changed: %',table_name USING ERRCODE='P7923';
    END IF;
  END LOOP;
  IF public.official_v3_guard_alarm_status_v1() IS DISTINCT FROM '{"schema":1,"status":"unavailable"}'::jsonb THEN
    RAISE EXCEPTION 'cycle4 fresh proof admission required' USING ERRCODE='P7923';
  END IF;
  BEGIN
    PERFORM official_v3_guard_private.require_open_v1();
    RAISE EXCEPTION 'cycle4 old proof admitted business IO' USING ERRCODE='P7923';
  EXCEPTION WHEN SQLSTATE 'P7902' THEN NULL; END;
  PERFORM official_v3_guard_private.assert_catalog_v1();
  IF EXISTS(WITH RECURSIVE inherited_roles(role_oid) AS (
      SELECT oid FROM pg_roles WHERE rolname IN ('ot_v3_jobs_caller','ot_v3_intake_caller','ot_v3_method_reader')
      UNION SELECT m.member FROM pg_auth_members m JOIN inherited_roles p ON p.role_oid=m.roleid WHERE m.inherit_option
    ), runtime_roles(role_oid) AS (
      SELECT role_oid FROM inherited_roles
      UNION SELECT m.member FROM pg_auth_members m JOIN runtime_roles p ON p.role_oid=m.roleid WHERE m.set_option
    ) SELECT 1 FROM pg_stat_activity a JOIN pg_roles r ON r.oid=a.usesysid
      WHERE a.pid<>pg_backend_pid() AND (r.rolname IN ('ot_v3_result_writer','ot_v3_result_reader','ot_v3_result_verifier')
        OR EXISTS(SELECT 1 FROM runtime_roles p WHERE p.role_oid=r.oid))) THEN
    RAISE EXCEPTION 'cycle4 final quiescence refusal' USING ERRCODE='P7923';
  END IF;
END $cycle4_postcheck$;
