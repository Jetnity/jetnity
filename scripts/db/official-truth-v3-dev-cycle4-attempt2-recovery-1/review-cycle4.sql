-- Exact Dev Cycle4 Attempt3 review. Original blocked cycle, dispatches and both unknown
-- STARTs remain intact. CI/Ready/UI declarations are external operator facts;
-- the DB independently requires actual Owner retirement and bound publication.
-- This migration does not audit, tick, enable the sender or enable cron.
BEGIN;
SET LOCAL search_path=pg_catalog;
SET LOCAL timezone='UTC';
SET LOCAL datestyle='ISO, YMD';
SET LOCAL statement_timeout='30s';
SET LOCAL lock_timeout='2s';
CREATE TEMP TABLE cycle4_attempt2_review_before(kind text PRIMARY KEY,value jsonb NOT NULL) ON COMMIT DROP;
DO $preflight$
DECLARE s official_v3_jobs_private.subjects_v1%ROWTYPE; p pg_proc%ROWTYPE; t record; rows_digest text;
  quota jsonb; retired jsonb; prior_retired jsonb; continued jsonb; current_head official_v3_result_private.heads_v1%ROWTYPE;
BEGIN
  IF session_user<>'postgres' OR current_user<>'postgres' OR current_database()<>'postgres'
    OR current_setting('server_version_num')::integer/10000<>17
    OR current_setting('jetnity.dev_terminal_cycle4_attempt2_review_target',true) IS DISTINCT FROM 'dev:yfvbxvijcorffwxbxahl:terminal-cycle4-attempt2-v1'
    OR current_setting('jetnity.dev_terminal_cycle4_attempt2_review_ack',true) IS DISTINCT FROM 'full-ci-ready-preview-and-normal-ui-verified-cycle4-attempt2-v1'
    OR (current_setting('jetnity.dev_terminal_cycle4_attempt2_review_commit',true) ~ '^[a-f0-9]{40}$') IS NOT TRUE
    OR (current_setting('jetnity.dev_terminal_cycle4_attempt2_review_deployment',true) ~ '^dpl_[A-Za-z0-9]{20,64}$') IS NOT TRUE
    OR (current_setting('jetnity.dev_terminal_cycle4_attempt2_review_ci_run',true) ~ '^[1-9][0-9]{0,17}$') IS NOT TRUE
    OR (current_setting('jetnity.dev_terminal_cycle4_attempt2_review_ui_version',true) ~ '^([7-9]|[1-9][0-9]{1,8})$') IS NOT TRUE THEN
    RAISE EXCEPTION 'exact Dev Cycle4 operator declaration required';
  END IF;
  PERFORM pg_advisory_xact_lock(771106,31);
  IF to_regclass('jetnity_dev_import_scheduler.terminal_cycle4_attempt2_review_v1') IS NOT NULL THEN
    RAISE EXCEPTION 'review already present; confirm original readback, never replace';
  END IF;
  IF to_regclass('official_v3_guard_private.retired_cycle4_attempts_v1') IS NULL
    OR to_regclass('official_v3_guard_private.retired_cycle4_attempt2_v1') IS NULL
    OR to_regclass('jetnity_dev_import_scheduler.terminal_cycle2_review_v1') IS NULL
    OR to_regclass('jetnity_dev_import_scheduler.terminal_cycle3_review_v1') IS NULL THEN
    RAISE EXCEPTION 'unchanged old reviews and exact Cycle4 recovery are required';
  END IF;
  SELECT * INTO STRICT p FROM pg_proc WHERE oid='jetnity_dev_import_scheduler.tick_v1()'::regprocedure;
  IF encode(sha256(convert_to((p.prosrc)::text,'UTF8')),'hex')<>'354a5727d1e7f872e42cdda0e56f3f6411ccdf94993a9b9363429ea247e65dbe' OR p.proowner<>'postgres'::regrole OR p.prosecdef
    OR p.pronargs<>0 OR p.prorettype<>'text'::regtype
    OR p.proconfig IS DISTINCT FROM ARRAY['search_path=pg_catalog','statement_timeout=10s','lock_timeout=2s']::text[] THEN
    RAISE EXCEPTION 'exact unchanged Cycle3 sender predecessor required';
  END IF;
  INSERT INTO pg_temp.cycle4_attempt2_review_before VALUES('tick_metadata',to_jsonb(p)-'prosrc');
  PERFORM 1 FROM jetnity_dev_import_scheduler.state_v1 WHERE singleton FOR UPDATE;
  IF NOT FOUND THEN RAISE EXCEPTION 'Dev sender state missing'; END IF;
  PERFORM pg_advisory_xact_lock(771106,1);
  PERFORM official_v3_guard_private.require_open_v1();
  IF EXISTS(SELECT 1 FROM pg_stat_activity WHERE pid<>pg_backend_pid()
  AND usename IN ('ot_v3_method_transport_login','ot_v3_intake_transport_login','ot_v3_jobs_transport_login',
    'ot_v3_result_writer','ot_v3_result_reader','ot_v3_result_verifier')) THEN RAISE EXCEPTION 'technical runtime session remains'; END IF;
  LOCK TABLE jetnity_dev_import_scheduler.state_v1,jetnity_dev_import_scheduler.cycles_v1,
    jetnity_dev_import_scheduler.dispatches_v1,jetnity_dev_import_scheduler.preview_access_v1,
    jetnity_dev_import_scheduler.preview_dispatches_v1,jetnity_dev_import_scheduler.terminal_cycle2_review_v1,
    jetnity_dev_import_scheduler.terminal_cycle3_review_v1 IN SHARE MODE;
  LOCK TABLE cron.job IN ACCESS SHARE MODE;
  IF NOT (EXISTS(SELECT 1 FROM jetnity_dev_import_scheduler.state_v1 WHERE singleton AND NOT enabled)
    AND EXISTS(SELECT 1 FROM cron.job WHERE jobid=5 AND jobname='jetnity-ch-de-dev-import-v1' AND NOT active
      AND command='SELECT jetnity_dev_import_scheduler.run_v1();' AND database='postgres' AND username='postgres'
      AND nodename='localhost' AND nodeport=5432 AND schedule='* * * * *')) THEN RAISE EXCEPTION 'exact paused Dev sender and cron are required'; END IF;
  IF EXISTS(SELECT 1 FROM jetnity_dev_import_scheduler.cycles_v1 WHERE state='active' OR (state='blocked' AND id NOT IN (2,3,4)))
    OR EXISTS(SELECT 1 FROM jetnity_dev_import_scheduler.dispatches_v1 WHERE processed_at IS NULL)
    OR EXISTS(SELECT 1 FROM jetnity_dev_import_scheduler.preview_dispatches_v1 WHERE processed_at IS NULL) THEN
    RAISE EXCEPTION 'unreviewed scheduler work remains';
  END IF;
  IF NOT EXISTS(SELECT 1 FROM jetnity_dev_import_scheduler.terminal_cycle2_review_v1 prior
    WHERE prior.cycle_id=2 AND prior.evidence_digest='624257e5e0902a9ed1e5ba6f647430771850daf94edf54034c2e169a32af4fdd'
      AND prior.queue_fix_sha256='4205b79b1a22c80823a4965cf911445213e3f99b8daae6365a710a4748a24f3d'
      AND prior.composition_fix_sha256='667316468efe2328ae41493537462a7ff4bd571da43fe219bdf738a63dd47b89'
      AND prior.evidence_digest=encode(sha256(convert_to(((SELECT jsonb_build_object(
 'cycle',(SELECT to_jsonb(c)||jsonb_build_object(
   'created_at',to_char(c.created_at AT TIME ZONE 'UTC','YYYY-MM-DD"T"HH24:MI:SS.US"Z"'),
   'finished_at',to_char(c.finished_at AT TIME ZONE 'UTC','YYYY-MM-DD"T"HH24:MI:SS.US"Z"'))
   FROM jetnity_dev_import_scheduler.cycles_v1 c WHERE c.id=2),
 'dispatches',(SELECT jsonb_agg(to_jsonb(d)||jsonb_build_object(
   'dispatched_at',to_char(d.dispatched_at AT TIME ZONE 'UTC','YYYY-MM-DD"T"HH24:MI:SS.US"Z"'),
   'processed_at',to_char(d.processed_at AT TIME ZONE 'UTC','YYYY-MM-DD"T"HH24:MI:SS.US"Z"')) ORDER BY d.id)
   FROM jetnity_dev_import_scheduler.dispatches_v1 d WHERE d.cycle_id=2),
 'terminal_operation',(SELECT to_jsonb(q)||jsonb_build_object(
   'recorded_at',to_char(q.recorded_at AT TIME ZONE 'UTC','YYYY-MM-DD"T"HH24:MI:SS.US"Z"'))
   FROM official_v3_jobs_private.queue_operations_v1 q WHERE q.operation_id='op3_5a9ada0e40b2af467fd7e34cc51cb323'))))::text,'UTF8')),'hex')) OR NOT EXISTS(SELECT 1 FROM jetnity_dev_import_scheduler.terminal_cycle3_review_v1 r
    WHERE r.cycle_id=3 AND r.evidence_digest='cc61f8b41a289d4a78f0d0fdaaca369e2f532c1f820577ca6a5b3a1a44f45dc1'
      AND r.evidence_digest=encode(sha256(convert_to(((SELECT jsonb_build_object(
 'cycle',(SELECT to_jsonb(c)||jsonb_build_object(
   'created_at',to_char(c.created_at AT TIME ZONE 'UTC','YYYY-MM-DD"T"HH24:MI:SS.US"Z"'),
   'finished_at',to_char(c.finished_at AT TIME ZONE 'UTC','YYYY-MM-DD"T"HH24:MI:SS.US"Z"'))
   FROM jetnity_dev_import_scheduler.cycles_v1 c WHERE c.id=3),
 'dispatches',(SELECT jsonb_agg(to_jsonb(d)||jsonb_build_object(
   'dispatched_at',to_char(d.dispatched_at AT TIME ZONE 'UTC','YYYY-MM-DD"T"HH24:MI:SS.US"Z"'),
   'processed_at',to_char(d.processed_at AT TIME ZONE 'UTC','YYYY-MM-DD"T"HH24:MI:SS.US"Z"')) ORDER BY d.id)
   FROM jetnity_dev_import_scheduler.dispatches_v1 d WHERE d.cycle_id=3),
 'terminal_operation',(SELECT to_jsonb(q)||jsonb_build_object(
   'recorded_at',to_char(q.recorded_at AT TIME ZONE 'UTC','YYYY-MM-DD"T"HH24:MI:SS.US"Z"'))
   FROM official_v3_jobs_private.queue_operations_v1 q WHERE q.operation_id='op3_0ab5b766f0d954b88a7481b0d531881f'))))::text,'UTF8')),'hex') AND r.prior_cycle2_evidence_digest='624257e5e0902a9ed1e5ba6f647430771850daf94edf54034c2e169a32af4fdd'
      AND r.queue_fix_sha256='1ac59c6db4e32ad14b57ffef050c833ccd71c4260218b433e90a58fcc8b56a45' AND r.composition_fix_sha256='9a34e02bb16fccbd087be21b93b52af923b29587e8bc7d3747f2c2cde9bfec5a'
      AND r.result_composition_fix_sha256='ac82224f1ac8c7f25f17e06eb1e878355a2ee8ea45edb8ffd9a7500d872c79cd'
      AND r.import_service_fix_sha256='8bef6976a8199a87d3db0a4f62214486eb330641849c89afb3d0e5b3adcd7b33' AND r.quarantine_fix_sha256='aa7fe8e22dd1368f99528232f6f573ca0c37f38f3bc35a36c5c1a0b02480bca2'
      AND r.job_contract_fix_sha256='eaf4d0cd72def7b8fe266d6016b587483204d6919917ce2e50700194fba9fc84' AND r.job_storage_fix_sha256='1fea4f1e74713c93be8b2b3cab1360b5ab95a082e89793f9a86b9a817c787d89'
      AND r.worker_authority_fix_sha256='e614e23bf62b0d196bb0756d2e131413517d2e9d3c3ef28182534f884a97af28' AND r.selected_claim_fix_sha256='29be658ca64918c1f7d2d8f50041eca2395b5ccbbfd787dd988a7ea463914dd1'
      AND r.method_authority_fix_sha256='42fb1f7094764fa8ba85c122f39ee8290e0cdf08b6b8c4f2ed84f58a3139a2f3' AND r.owned_scope_fix_sha256='89a22b2a2de00365505258a301614a0ac2870af79bd3ced40a66c8794c6fe280'
      AND r.owned_session_fix_sha256='0d818c574ef4784589273f4e31b5abb74879028cbacce66e810012f987734f6c' AND r.executors_fix_sha256='f1fcc6a0e762104c117e771207e266a3d7eac58492bb573b7aa1be1802c7ce3b')
    OR (SELECT count(*) FROM jetnity_dev_import_scheduler.terminal_cycle2_review_v1)<>1
    OR (SELECT count(*) FROM jetnity_dev_import_scheduler.terminal_cycle3_review_v1)<>1 THEN
    RAISE EXCEPTION 'original Cycle2 and Cycle3 reviews and evidence are required';
  END IF;
  IF current_setting('jetnity.dev_terminal_cycle4_attempt2_review_commit')='8ed4778002f058e9bba6e98c58283140085064f3'
    OR current_setting('jetnity.dev_terminal_cycle4_attempt2_review_commit')=(SELECT runtime_commit FROM jetnity_dev_import_scheduler.terminal_cycle3_review_v1)
    OR current_setting('jetnity.dev_terminal_cycle4_attempt2_review_ci_run')::bigint<=(SELECT ci_run FROM jetnity_dev_import_scheduler.terminal_cycle3_review_v1) THEN
    RAISE EXCEPTION 'new successful CI and Ready runtime must be declared';
  END IF;
  IF encode(sha256(convert_to(((SELECT jsonb_build_object(
 'cycle',(SELECT to_jsonb(c)||jsonb_build_object(
   'created_at',to_char(c.created_at AT TIME ZONE 'UTC','YYYY-MM-DD"T"HH24:MI:SS.US"Z"'),
   'finished_at',to_char(c.finished_at AT TIME ZONE 'UTC','YYYY-MM-DD"T"HH24:MI:SS.US"Z"'))
   FROM jetnity_dev_import_scheduler.cycles_v1 c WHERE c.id=4),
 'dispatches',(SELECT jsonb_agg(to_jsonb(d)||jsonb_build_object(
   'dispatched_at',to_char(d.dispatched_at AT TIME ZONE 'UTC','YYYY-MM-DD"T"HH24:MI:SS.US"Z"'),
   'processed_at',to_char(d.processed_at AT TIME ZONE 'UTC','YYYY-MM-DD"T"HH24:MI:SS.US"Z"')) ORDER BY d.id)
   FROM jetnity_dev_import_scheduler.dispatches_v1 d WHERE d.cycle_id=4))))::text,'UTF8')),'hex') IS DISTINCT FROM '0a16d6263e9b40500d45e3851309465c84b7b214124b46113844bd74b0763b45' THEN
    RAISE EXCEPTION 'original Cycle4 signed failure evidence differs';
  END IF;

  PERFORM official_v3_guard_private.require_open_v1();
  PERFORM official_v3_guard_private.check_control_v1();
  PERFORM official_v3_guard_private.assert_catalog_v1();
  PERFORM official_v3_guard_private.check_hma_v1();
  PERFORM official_v3_guard_private.check_s1_v1();
  PERFORM official_v3_guard_private.check_jobs_v1();
  PERFORM official_v3_guard_private.check_hrs_v1();
  PERFORM official_v3_guard_private.check_certificates_v1();
  PERFORM official_v3_guard_private.check_retirements_v1();
  retired:=(SELECT jsonb_build_object('retirement',to_jsonb(r)||jsonb_build_object('retired_at',extract(epoch FROM r.retired_at)),'owner',to_jsonb(o)||jsonb_build_object('recorded_at',extract(epoch FROM o.recorded_at)))
 FROM official_v3_guard_private.retired_cycle4_attempt2_v1 r
 JOIN official_v3_guard_private.owner_operations_v1 o ON o.operation_id=r.owner_operation_id
 WHERE r.attempt_key='execution-attempt:v3:2fe5321b98827f44835f830b9c923735fab5e2a07cb1354952b516c2b035be99' AND r.job_key='research-job:v3:74713fe665cab1a7603f6e93ab06b6a1d1964e83a69571b8cced0ff009032513'
   AND r.claim_operation_id='op3_aa4029549e0cf99ec5d882752e492713' AND r.intake_operation_id='op3_e062b171cbf4958094a86366d013a73d'
   AND r.before_state->>'kind'='ch_de_cycle4_attempt2_unknown'
   AND r.before_state->>'originalEvidenceDigest'='7debd26332c22a3b675280fb5401fd3116f80c0ba9b633c76a4883ab4a48d113'
   AND r.before_state#>'{job,subjectState}'='{"kind":"rule_research","job_key":"research-job:v3:74713fe665cab1a7603f6e93ab06b6a1d1964e83a69571b8cced0ff009032513","slot_id":1,"current_job":{"kind":"research_job_record","jobId":"job3_c70d23ff344cdf2998818ecf5243d15e","lease":{"leaseId":"lease3_61fea9f1b961deb3301791adb8a3bfa4","expiresAt":"2026-11-15T17:55:23.069Z","acquiredAt":"2026-11-15T17:54:53.069Z","generation":42},"state":"leased","jobKey":"research-job:v3:74713fe665cab1a7603f6e93ab06b6a1d1964e83a69571b8cced0ff009032513","method":{"methodId":"jetnity-destination-primary-ch-de-visa","revision":1},"schema":3,"attempt":2,"context":{"route":"direct_entry","scope":{"validity":{"mode":"not_applicable"},"residence":{"mode":"not_applicable"},"citizenship":{"mode":"required","countryCodes":["CH"]},"requirementType":"visa","credentialOption":{"mode":"option","documentType":"passport","issuingCountryCode":"CH","relatedCitizenshipCountryCode":"CH"},"transitCountryCode":null,"destinationCountryCode":"DE"},"conditions":{"status":"unconditional"}},"research":{"key":"research-request:v1:b682f1de48389c7d5a3ac0d39fa4406d0e3796be91fb6e253bfd5a45cf7f945a","factKind":"requirement_effect","ruleScopeKey":"rule-scope:v1:3a24b4bc807a384b6d08e105f1107cc45d6d83c07c75eff01bc0ffc43f61477f","researchReason":{"status":"missing"}},"revision":42,"createdAt":"2026-11-15T16:36:02.293Z","updatedAt":"2026-11-15T17:54:53.069Z","contextKey":"official-truth-context:v3:bfce3bc64dbd7c670441e05033c31f339e03a2c488ab54937320508333c252c2","lastFailure":null,"operationId":"op3_91a38dc806d3f21bac3d9d16493c6be6","attemptLimit":4,"nextAttemptAt":null,"resultDecisionRef":null,"predecessorRevision":41},"start_count":12,"open_attempt":"execution-attempt:v3:2fe5321b98827f44835f830b9c923735fab5e2a07cb1354952b516c2b035be99","subject_text":"{\"context\":{\"conditions\":{\"status\":\"unconditional\"},\"route\":\"direct_entry\",\"scope\":{\"citizenship\":{\"countryCodes\":[\"CH\"],\"mode\":\"required\"},\"credentialOption\":{\"documentType\":\"passport\",\"issuingCountryCode\":\"CH\",\"mode\":\"option\",\"relatedCitizenshipCountryCode\":\"CH\"},\"destinationCountryCode\":\"DE\",\"requirementType\":\"visa\",\"residence\":{\"mode\":\"not_applicable\"},\"transitCountryCode\":null,\"validity\":{\"mode\":\"not_applicable\"}}},\"factKind\":\"requirement_effect\",\"kind\":\"rule_research\",\"method\":{\"methodId\":\"jetnity-destination-primary-ch-de-visa\",\"revision\":1}}","method_binding":{"methodId":"jetnity-destination-primary-ch-de-visa","revision":1,"methodDigest":"44ce02752da05796bef98c55b5099b81f915fe6b0975472e163721a06793bdb3","packageDigest":"0beb25db2e1f6e4c2c96d61ded30b59a8e06a32ed94498903fbeecc3b6f267e9"},"operation_count":46,"terminal_credit_claim":"op3_aa4029549e0cf99ec5d882752e492713"}'::jsonb
   AND o.action='retire_unknown' AND o.recorded_at=r.retired_at
   AND o.expected_digest=encode(sha256(convert_to((r.before_state)::text,'UTF8')),'hex')
   AND o.receipt=jsonb_build_object('schema',1,'status','recorded','action','retire_unknown',
     'operationId',o.operation_id,'selection',o.expected_digest,'result','unknown_retired',
     'recordedAt',to_char(o.recorded_at AT TIME ZONE 'UTC','YYYY-MM-DD"T"HH24:MI:SS.MS"Z"'))
   AND NOT EXISTS(SELECT 1 FROM official_v3_jobs_private.execution_results_v1 WHERE attempt_key=r.attempt_key)
   AND NOT EXISTS(SELECT 1 FROM official_v3_jobs_private.execution_dispositions_v1 WHERE attempt_key=r.attempt_key)); prior_retired:=(SELECT jsonb_build_object('retirement',to_jsonb(r)||jsonb_build_object('retired_at',extract(epoch FROM r.retired_at)),'owner',to_jsonb(o)||jsonb_build_object('recorded_at',extract(epoch FROM o.recorded_at)))
 FROM official_v3_guard_private.retired_cycle4_attempts_v1 r
 JOIN official_v3_guard_private.owner_operations_v1 o ON o.operation_id=r.owner_operation_id
 WHERE r.attempt_key='execution-attempt:v3:89720170633a22f22effbf861d9b7c18a465546b43999375f567145a1449d3de' AND r.job_key='research-job:v3:74713fe665cab1a7603f6e93ab06b6a1d1964e83a69571b8cced0ff009032513'
   AND r.claim_operation_id='op3_2b7811ed9b5f488cbffcd09a0ec0409b' AND r.intake_operation_id='op3_90bd61aa6d32e79273bdd923f1851576'
   AND r.before_state->>'kind'='ch_de_cycle4_unknown'
   AND r.before_state->>'originalEvidenceDigest'='5829475017f545d3ba1573de7d94593754bfc280262b9c7dd44a04d66cad3f14'
   AND r.before_state#>'{job,subjectState}'='{"kind":"rule_research","job_key":"research-job:v3:74713fe665cab1a7603f6e93ab06b6a1d1964e83a69571b8cced0ff009032513","slot_id":1,"current_job":{"kind":"research_job_record","jobId":"job3_c70d23ff344cdf2998818ecf5243d15e","lease":{"leaseId":"lease3_491cf756e95d47e0892613c0e81c556b","expiresAt":"2026-11-15T16:37:34.504Z","acquiredAt":"2026-11-15T16:37:04.504Z","generation":41},"state":"leased","jobKey":"research-job:v3:74713fe665cab1a7603f6e93ab06b6a1d1964e83a69571b8cced0ff009032513","method":{"methodId":"jetnity-destination-primary-ch-de-visa","revision":1},"schema":3,"attempt":1,"context":{"route":"direct_entry","scope":{"validity":{"mode":"not_applicable"},"residence":{"mode":"not_applicable"},"citizenship":{"mode":"required","countryCodes":["CH"]},"requirementType":"visa","credentialOption":{"mode":"option","documentType":"passport","issuingCountryCode":"CH","relatedCitizenshipCountryCode":"CH"},"transitCountryCode":null,"destinationCountryCode":"DE"},"conditions":{"status":"unconditional"}},"research":{"key":"research-request:v1:b682f1de48389c7d5a3ac0d39fa4406d0e3796be91fb6e253bfd5a45cf7f945a","factKind":"requirement_effect","ruleScopeKey":"rule-scope:v1:3a24b4bc807a384b6d08e105f1107cc45d6d83c07c75eff01bc0ffc43f61477f","researchReason":{"status":"missing"}},"revision":41,"createdAt":"2026-11-15T16:36:02.293Z","updatedAt":"2026-11-15T16:37:04.504Z","contextKey":"official-truth-context:v3:bfce3bc64dbd7c670441e05033c31f339e03a2c488ab54937320508333c252c2","lastFailure":null,"operationId":"op3_91a38dc806d3f21bac3d9d16493c6be6","attemptLimit":4,"nextAttemptAt":null,"resultDecisionRef":null,"predecessorRevision":40},"start_count":11,"open_attempt":"execution-attempt:v3:89720170633a22f22effbf861d9b7c18a465546b43999375f567145a1449d3de","subject_text":"{\"context\":{\"conditions\":{\"status\":\"unconditional\"},\"route\":\"direct_entry\",\"scope\":{\"citizenship\":{\"countryCodes\":[\"CH\"],\"mode\":\"required\"},\"credentialOption\":{\"documentType\":\"passport\",\"issuingCountryCode\":\"CH\",\"mode\":\"option\",\"relatedCitizenshipCountryCode\":\"CH\"},\"destinationCountryCode\":\"DE\",\"requirementType\":\"visa\",\"residence\":{\"mode\":\"not_applicable\"},\"transitCountryCode\":null,\"validity\":{\"mode\":\"not_applicable\"}}},\"factKind\":\"requirement_effect\",\"kind\":\"rule_research\",\"method\":{\"methodId\":\"jetnity-destination-primary-ch-de-visa\",\"revision\":1}}","method_binding":{"methodId":"jetnity-destination-primary-ch-de-visa","revision":1,"methodDigest":"44ce02752da05796bef98c55b5099b81f915fe6b0975472e163721a06793bdb3","packageDigest":"0beb25db2e1f6e4c2c96d61ded30b59a8e06a32ed94498903fbeecc3b6f267e9"},"operation_count":45,"terminal_credit_claim":"op3_2b7811ed9b5f488cbffcd09a0ec0409b"}'::jsonb
   AND o.action='retire_unknown' AND o.recorded_at=r.retired_at
   AND o.expected_digest=encode(sha256(convert_to((r.before_state)::text,'UTF8')),'hex')
   AND o.receipt=jsonb_build_object('schema',1,'status','recorded','action','retire_unknown',
     'operationId',o.operation_id,'selection',o.expected_digest,'result','unknown_retired',
     'recordedAt',to_char(o.recorded_at AT TIME ZONE 'UTC','YYYY-MM-DD"T"HH24:MI:SS.MS"Z"'))
   AND NOT EXISTS(SELECT 1 FROM official_v3_jobs_private.execution_results_v1 WHERE attempt_key=r.attempt_key)
   AND NOT EXISTS(SELECT 1 FROM official_v3_jobs_private.execution_dispositions_v1 WHERE attempt_key=r.attempt_key)); continued:=(SELECT jsonb_build_object(
 'start',to_jsonb(continued_start)||jsonb_build_object('reserved_at',extract(epoch FROM continued_start.reserved_at)),'result',to_jsonb(r)||jsonb_build_object('prepared_at',extract(epoch FROM r.prepared_at)),
 'disposition',to_jsonb(d)||jsonb_build_object('settled_at',extract(epoch FROM d.settled_at)),'complete',to_jsonb(q)||jsonb_build_object('recorded_at',extract(epoch FROM q.recorded_at)),
 'version',to_jsonb(v)||jsonb_build_object('committed_at',extract(epoch FROM v.committed_at)),'projection',to_jsonb(continued_projection)||jsonb_build_object('published_at',extract(epoch FROM continued_projection.published_at)),
 'publication',to_jsonb(pub)||jsonb_build_object('recorded_at',extract(epoch FROM pub.recorded_at)))
 FROM official_v3_jobs_private.execution_starts_v1 continued_start
 JOIN official_v3_jobs_private.execution_results_v1 r ON r.attempt_key=continued_start.attempt_key
 JOIN official_v3_jobs_private.execution_dispositions_v1 d ON d.attempt_key=continued_start.attempt_key
 JOIN official_v3_jobs_private.queue_operations_v1 q ON q.operation_id=d.queue_operation_id
 JOIN official_v3_result_private.versions_v1 v ON v.decision_ref=r.result->>'decisionRef'
 JOIN official_v3_result_private.projections_v1 continued_projection ON continued_projection.version_ref=v.reference
 JOIN official_v3_result_private.operations_v1 pub ON pub.operation_kind='publication'
   AND pub.operation_id=v.prepared#>>'{transition,operationId}'
 WHERE continued_start.job_key='research-job:v3:74713fe665cab1a7603f6e93ab06b6a1d1964e83a69571b8cced0ff009032513' AND continued_start.claim_operation_id='op3_ce1ca9be51062b8da8887027c208affc'
   AND continued_start.claim_text='{"jobKey":"research-job:v3:74713fe665cab1a7603f6e93ab06b6a1d1964e83a69571b8cced0ff009032513","leaseId":"lease3_9526232e043973267787eb577b98ae18","leaseMilliseconds":30000,"operationId":"op3_ce1ca9be51062b8da8887027c208affc"}'
   AND continued_start.leased_job->>'jobId'='job3_c70d23ff344cdf2998818ecf5243d15e' AND continued_start.leased_job->>'operationId'='op3_91a38dc806d3f21bac3d9d16493c6be6'
   AND continued_start.leased_job->'attempt'='3'::jsonb AND continued_start.leased_job->'revision'='43'::jsonb
   AND continued_start.leased_job->'predecessorRevision'='42'::jsonb
   AND continued_start.leased_job#>>'{lease,leaseId}'='lease3_9526232e043973267787eb577b98ae18'
   AND r.result->>'kind'='rule_research' AND r.result->>'jobId'='job3_c70d23ff344cdf2998818ecf5243d15e'
   AND r.result->>'operationId'='op3_91a38dc806d3f21bac3d9d16493c6be6' AND r.result->>'jobKey'='research-job:v3:74713fe665cab1a7603f6e93ab06b6a1d1964e83a69571b8cced0ff009032513'
   AND d.kind='completed' AND d.failure_reason IS NULL AND q.action='complete' AND q.job_key='research-job:v3:74713fe665cab1a7603f6e93ab06b6a1d1964e83a69571b8cced0ff009032513'
   AND q.envelope_text::jsonb#>>'{next,jobId}'='job3_c70d23ff344cdf2998818ecf5243d15e'
   AND q.envelope_text::jsonb#>>'{next,operationId}'='op3_91a38dc806d3f21bac3d9d16493c6be6'
   AND q.envelope_text::jsonb#>'{next,attempt}'='3'::jsonb
   AND q.envelope_text::jsonb#>'{next,revision}'='44'::jsonb
   AND q.envelope_text::jsonb#>>'{next,state}'='succeeded'
   AND q.envelope_text::jsonb#>'{next,lease}'='null'::jsonb
   AND q.envelope_text::jsonb#>>'{next,resultDecisionRef}'=r.result->>'decisionRef'
   AND v.revision>=7 AND continued_projection.record->'rule'=v.prepared->'version'
   AND continued_projection.verification_ref=v.verification_ref
   AND pub.command->'prepared'=v.prepared AND pub.command->'projection'=continued_projection.record
   AND pub.command->>'verificationRef'=v.verification_ref
   AND pub.result->>'versionRef'=v.reference AND pub.result->>'projectionRef'=continued_projection.reference
   AND r."references" @> jsonb_build_array(pub.command->'intake')
   AND pub.command#>>'{intake,binding,jobId}'='job3_c70d23ff344cdf2998818ecf5243d15e');
  IF retired IS NULL OR prior_retired IS NULL THEN RAISE EXCEPTION 'both exact confirmed Cycle4 Owner retirements required'; END IF;
  IF continued IS NULL THEN RAISE EXCEPTION 'normal original Attempt3 completion and publication required'; END IF;
  SELECT * INTO STRICT s FROM official_v3_jobs_private.subjects_v1 WHERE job_key='research-job:v3:74713fe665cab1a7603f6e93ab06b6a1d1964e83a69571b8cced0ff009032513';
  SELECT * INTO STRICT current_head FROM official_v3_result_private.heads_v1 WHERE singleton;
  IF s.open_attempt IS NOT NULL OR s.terminal_credit_claim IS NOT NULL
    OR s.current_job IS DISTINCT FROM (continued#>>'{complete,envelope_text}')::jsonb->'next'
    OR s.current_job->>'jobId' IS DISTINCT FROM 'job3_c70d23ff344cdf2998818ecf5243d15e'
    OR s.current_job->>'state' IS DISTINCT FROM 'succeeded' OR s.current_job->'attempt' IS DISTINCT FROM '3'::jsonb
    OR s.current_job->'lease' IS DISTINCT FROM 'null'::jsonb THEN
    RAISE EXCEPTION 'same original Cycle4 Attempt3 must be completely terminal';
  END IF;
  IF current_head.version_ref IS DISTINCT FROM continued#>>'{version,reference}'
    OR current_head.projection_ref IS DISTINCT FROM continued#>>'{projection,reference}'
    OR current_head.decision_ref IS DISTINCT FROM continued#>>'{result,result,decisionRef}'
    OR current_head.suppression IS DISTINCT FROM 'null'::jsonb OR current_head.sticky_decision_ref IS NOT NULL
    OR NOT current_head.coverage
    OR current_setting('jetnity.dev_terminal_cycle4_attempt2_review_ui_version')::integer IS DISTINCT FROM (continued#>>'{version,revision}')::integer
    OR (SELECT count(*) FROM official_v3_result_private.versions_v1)<7
    OR (SELECT count(*) FROM official_v3_result_private.operations_v1 WHERE operation_kind='publication')<7 THEN
    RAISE EXCEPTION 'exact current published UI version seven or later required';
  END IF;
  quota:=official_v3_guard_private.ch_de_quota_v2();
  IF quota->>'model' IS DISTINCT FROM 'rolling_24h_v2' OR quota->'clock_ok' IS DISTINCT FROM 'true'::jsonb THEN
    RAISE EXCEPTION 'genuine current rolling quota required';
  END IF;
  INSERT INTO pg_temp.cycle4_attempt2_review_before VALUES
    ('quota',quota-'observed_at'-'window_start'),('protected_catalog',official_v3_guard_private.catalog_status_v1()),
    ('roles',(SELECT jsonb_agg(to_jsonb(r) ORDER BY r.oid) FROM pg_roles r)),
    ('memberships',(SELECT jsonb_agg(to_jsonb(m) ORDER BY m.oid) FROM pg_auth_members m)),
    ('cron',(SELECT jsonb_agg(to_jsonb(c) ORDER BY c.jobid) FROM cron.job c)),
    ('retirement',retired),('prior_retirement',prior_retired),('continuation',continued);
  FOR t IN SELECT n.nspname,c.relname FROM pg_class c JOIN pg_namespace n ON n.oid=c.relnamespace
    WHERE c.relkind IN ('r','p') AND n.nspname IN ('jetnity_dev_import_scheduler','official_v3_guard_private',
      'official_v3_method_private','official_v3_intake_private','official_v3_jobs_private','official_v3_result_private')
    ORDER BY n.nspname,c.relname LOOP
    EXECUTE format('LOCK TABLE %I.%I IN ACCESS SHARE MODE',t.nspname,t.relname);
    EXECUTE format('SELECT encode(sha256(convert_to(coalesce(jsonb_agg(to_jsonb(r) ORDER BY to_jsonb(r)::text COLLATE "C"),''[]''::jsonb)::text,''UTF8'')),''hex'') FROM %I.%I r',t.nspname,t.relname) INTO rows_digest;
    INSERT INTO pg_temp.cycle4_attempt2_review_before VALUES('rows:'||t.nspname||'.'||t.relname,to_jsonb(rows_digest));
  END LOOP;
END $preflight$;

CREATE TABLE jetnity_dev_import_scheduler.terminal_cycle4_attempt2_review_v1(
  cycle_id bigint PRIMARY KEY CHECK(cycle_id=4) REFERENCES jetnity_dev_import_scheduler.cycles_v1(id),
  evidence_digest text NOT NULL CHECK(evidence_digest='0a16d6263e9b40500d45e3851309465c84b7b214124b46113844bd74b0763b45'),
  original_evidence_sha256 text NOT NULL CHECK(original_evidence_sha256='7debd26332c22a3b675280fb5401fd3116f80c0ba9b633c76a4883ab4a48d113'),
  prior_original_evidence_sha256 text NOT NULL CHECK(prior_original_evidence_sha256='5829475017f545d3ba1573de7d94593754bfc280262b9c7dd44a04d66cad3f14'),
  prior_cycle3_evidence_digest text NOT NULL CHECK(prior_cycle3_evidence_digest='cc61f8b41a289d4a78f0d0fdaaca369e2f532c1f820577ca6a5b3a1a44f45dc1'),
  runtime_source_pins jsonb NOT NULL CHECK(runtime_source_pins='[{"path":"lib/readiness/official-truth-product-v3/source/aa-ch-de-issuer.ts","bytes":31148,"sha256":"3f875d2455f11888aaa944086f8a624b2c1c443fd42db73ce0f2778c1ba9e1aa"},{"path":"lib/readiness/official-truth-product-v3/result/source-proof.ts","bytes":30248,"sha256":"3e6c76d62d103a244f4c792f3f3c7454c9e410fc1f4acdd230eb143d3a5c215f"},{"path":"lib/readiness/official-truth-product-v3/result/ch-de-import-frame.ts","bytes":9754,"sha256":"e27dc02031590c9088cfd298037690301fcc273092341c356f882f6eb42c24a4"},{"path":"lib/readiness/official-truth-product-v3/result/composition.ts","bytes":14828,"sha256":"07410b4795edfd793ec7dd0a1ede00445d29a059da4c43f31db484049aa1e4f2"},{"path":"lib/readiness/official-truth-product-v3/jobs/selected-claim.ts","bytes":18328,"sha256":"29be658ca64918c1f7d2d8f50041eca2395b5ccbbfd787dd988a7ea463914dd1"},{"path":"lib/readiness/official-truth-product-v3/runtime/ch-de-server.ts","bytes":3931,"sha256":"f3f69481b1e158a4db5dbe57cbc79c4a458e2bf83c6a8224d9aad126e1ba3176"},{"path":"lib/readiness/official-truth-product-v3/runtime/ch-de-source-admission.ts","bytes":1293,"sha256":"ed61adeaef389f0f946af4d35dc456ef4b3470f46fe1a2377aec94fa83e860ae"},{"path":"app/api/internal/readiness/ch-de-visa-tick/route.ts","bytes":2572,"sha256":"91ab59b1fb9091fa8bfc6fb2f68e1847632a0a71684ca0e885c9e41e2810362c"}]'::jsonb),
  owner_operation_id text NOT NULL CHECK(owner_operation_id ~ '^op3_[a-f0-9]{32}$'),
  retirement_digest text NOT NULL CHECK(retirement_digest ~ '^[a-f0-9]{64}$'),
  prior_owner_operation_id text NOT NULL CHECK(prior_owner_operation_id ~ '^op3_[a-f0-9]{32}$'),
  prior_retirement_digest text NOT NULL CHECK(prior_retirement_digest ~ '^[a-f0-9]{64}$'),
  continuation_attempt_key text NOT NULL CHECK(continuation_attempt_key ~ '^execution-attempt:v3:[a-f0-9]{64}$'),
  continuation_digest text NOT NULL CHECK(continuation_digest ~ '^[a-f0-9]{64}$'),
  published_version_ref text NOT NULL CHECK(published_version_ref ~ '^rule-version:v3:[a-f0-9]{64}$'),
  published_projection_ref text NOT NULL CHECK(published_projection_ref ~ '^rule-projection:v3:[a-f0-9]{64}$'),
  runtime_commit text NOT NULL CHECK(runtime_commit ~ '^[a-f0-9]{40}$'),
  ready_deployment text NOT NULL CHECK(ready_deployment ~ '^dpl_[A-Za-z0-9]{20,64}$'),
  ci_run bigint NOT NULL CHECK(ci_run>0),ui_version integer NOT NULL CHECK(ui_version>=7),
  reviewed_at timestamptz NOT NULL CHECK(isfinite(reviewed_at)),reviewed_head jsonb NOT NULL
);
ALTER TABLE jetnity_dev_import_scheduler.terminal_cycle4_attempt2_review_v1 ENABLE ROW LEVEL SECURITY;
REVOKE ALL ON jetnity_dev_import_scheduler.terminal_cycle4_attempt2_review_v1 FROM PUBLIC,anon,authenticated,service_role,supabase_read_only_user;
CREATE FUNCTION jetnity_dev_import_scheduler.immutable_terminal_cycle4_attempt2_review_v1() RETURNS trigger
LANGUAGE plpgsql SECURITY INVOKER SET search_path=pg_catalog AS $immutable$
BEGIN RAISE EXCEPTION 'the original Cycle4 review is immutable'; END $immutable$;
REVOKE ALL ON FUNCTION jetnity_dev_import_scheduler.immutable_terminal_cycle4_attempt2_review_v1() FROM PUBLIC,anon,authenticated,service_role,supabase_read_only_user;
CREATE TRIGGER immutable_row BEFORE UPDATE OR DELETE ON jetnity_dev_import_scheduler.terminal_cycle4_attempt2_review_v1
FOR EACH ROW EXECUTE FUNCTION jetnity_dev_import_scheduler.immutable_terminal_cycle4_attempt2_review_v1();
CREATE TRIGGER immutable_truncate BEFORE TRUNCATE ON jetnity_dev_import_scheduler.terminal_cycle4_attempt2_review_v1
FOR EACH STATEMENT EXECUTE FUNCTION jetnity_dev_import_scheduler.immutable_terminal_cycle4_attempt2_review_v1();
INSERT INTO jetnity_dev_import_scheduler.terminal_cycle4_attempt2_review_v1
SELECT 4,'0a16d6263e9b40500d45e3851309465c84b7b214124b46113844bd74b0763b45','7debd26332c22a3b675280fb5401fd3116f80c0ba9b633c76a4883ab4a48d113','5829475017f545d3ba1573de7d94593754bfc280262b9c7dd44a04d66cad3f14','cc61f8b41a289d4a78f0d0fdaaca369e2f532c1f820577ca6a5b3a1a44f45dc1','[{"path":"lib/readiness/official-truth-product-v3/source/aa-ch-de-issuer.ts","bytes":31148,"sha256":"3f875d2455f11888aaa944086f8a624b2c1c443fd42db73ce0f2778c1ba9e1aa"},{"path":"lib/readiness/official-truth-product-v3/result/source-proof.ts","bytes":30248,"sha256":"3e6c76d62d103a244f4c792f3f3c7454c9e410fc1f4acdd230eb143d3a5c215f"},{"path":"lib/readiness/official-truth-product-v3/result/ch-de-import-frame.ts","bytes":9754,"sha256":"e27dc02031590c9088cfd298037690301fcc273092341c356f882f6eb42c24a4"},{"path":"lib/readiness/official-truth-product-v3/result/composition.ts","bytes":14828,"sha256":"07410b4795edfd793ec7dd0a1ede00445d29a059da4c43f31db484049aa1e4f2"},{"path":"lib/readiness/official-truth-product-v3/jobs/selected-claim.ts","bytes":18328,"sha256":"29be658ca64918c1f7d2d8f50041eca2395b5ccbbfd787dd988a7ea463914dd1"},{"path":"lib/readiness/official-truth-product-v3/runtime/ch-de-server.ts","bytes":3931,"sha256":"f3f69481b1e158a4db5dbe57cbc79c4a458e2bf83c6a8224d9aad126e1ba3176"},{"path":"lib/readiness/official-truth-product-v3/runtime/ch-de-source-admission.ts","bytes":1293,"sha256":"ed61adeaef389f0f946af4d35dc456ef4b3470f46fe1a2377aec94fa83e860ae"},{"path":"app/api/internal/readiness/ch-de-visa-tick/route.ts","bytes":2572,"sha256":"91ab59b1fb9091fa8bfc6fb2f68e1847632a0a71684ca0e885c9e41e2810362c"}]'::jsonb,
  r.value#>>'{owner,operation_id}',encode(sha256(convert_to((r.value)::text,'UTF8')),'hex'),pr.value#>>'{owner,operation_id}',encode(sha256(convert_to((pr.value)::text,'UTF8')),'hex'),
  c.value#>>'{start,attempt_key}',encode(sha256(convert_to((c.value)::text,'UTF8')),'hex'),
  c.value#>>'{version,reference}',c.value#>>'{projection,reference}',
  current_setting('jetnity.dev_terminal_cycle4_attempt2_review_commit'),current_setting('jetnity.dev_terminal_cycle4_attempt2_review_deployment'),
  current_setting('jetnity.dev_terminal_cycle4_attempt2_review_ci_run')::bigint,current_setting('jetnity.dev_terminal_cycle4_attempt2_review_ui_version')::integer,
  clock_timestamp(),s.current_job
FROM official_v3_jobs_private.subjects_v1 s,pg_temp.cycle4_attempt2_review_before r,pg_temp.cycle4_attempt2_review_before pr,pg_temp.cycle4_attempt2_review_before c
WHERE s.job_key='research-job:v3:74713fe665cab1a7603f6e93ab06b6a1d1964e83a69571b8cced0ff009032513' AND r.kind='retirement' AND pr.kind='prior_retirement' AND c.kind='continuation';

-- Only the original blocked-cycle admission predicate changes. All ordinary
-- requests, periods, quotas, source processing and publication gates remain.
CREATE OR REPLACE FUNCTION jetnity_dev_import_scheduler.tick_v1() RETURNS text
LANGUAGE plpgsql SECURITY INVOKER SET search_path=pg_catalog SET statement_timeout='10s' SET lock_timeout='2s'
AS $tick$
DECLARE
  moment timestamptz:=clock_timestamp();
  control jetnity_dev_import_scheduler.state_v1%ROWTYPE;
  cycle jetnity_dev_import_scheduler.cycles_v1%ROWTYPE;
  dispatch jetnity_dev_import_scheduler.dispatches_v1%ROWTYPE;
  reply record;
  result jsonb;
  signing_key text;
  preview_cookie text;
  actual_mac text;
  expected_mac text;
  mac_count integer;
  response_status text;
  amount integer;
  request_id bigint;
  timestamp_ms text;
  request_body jsonb;
  start_left integer;
  operation_left integer;
  quota jsonb;
  response_verified boolean:=false;
  target_url constant text:='https://jetnity-app-git-feat-official-truth-hum-6fe0cd-jetnity-e1b93c82.vercel.app/api/internal/readiness/ch-de-dev-refresh';
  target_path constant text:='/api/internal/readiness/ch-de-dev-refresh';
BEGIN
  IF current_user<>'postgres' OR session_user<>'postgres' OR current_database()<>'postgres' THEN
    RAISE EXCEPTION 'Dev scheduler operator only';
  END IF;
  IF NOT pg_try_advisory_xact_lock(771106,31) THEN RETURN 'busy'; END IF;
  SELECT * INTO STRICT control FROM jetnity_dev_import_scheduler.state_v1 WHERE singleton FOR UPDATE;
  IF NOT control.enabled THEN RETURN 'disabled'; END IF;
  IF control.transport_expires_at IS NULL OR control.transport_expires_at<=moment THEN
    UPDATE jetnity_dev_import_scheduler.state_v1 SET status='transport_access_expired',observed_at=moment WHERE singleton;
    RETURN 'transport_access_expired';
  END IF;
  -- Unchanged normal BG1 remains authoritative; this sender never runs an audit.
  IF NOT EXISTS(SELECT 1 FROM official_v3_guard_private.state_v1
    WHERE singleton AND incident_generation=resumed_generation AND valid_until>moment
      AND last_proof_started IS NOT NULL AND last_finished>=last_proof_started) THEN
    UPDATE jetnity_dev_import_scheduler.state_v1 SET status='guard_not_current' WHERE singleton;
    RETURN 'guard_not_current';
  END IF;
  IF to_regprocedure('official_v3_guard_private.ch_de_quota_v2()') IS NULL THEN
    UPDATE jetnity_dev_import_scheduler.state_v1 SET status='quota_state_unavailable',observed_at=moment WHERE singleton;
    RETURN 'quota_state_unavailable';
  END IF;
  -- The separately installed successor owns rolling admission and terminal
  -- reserve. Never derive a daily allowance by resetting lifetime counters.
  quota:=official_v3_guard_private.ch_de_quota_v2();
  IF quota->>'model' IS DISTINCT FROM 'rolling_24h_v2' OR quota->'clock_ok' IS DISTINCT FROM 'true'::jsonb
    OR jsonb_typeof(quota->'remaining_starts') IS DISTINCT FROM 'number'
    OR jsonb_typeof(quota->'remaining_operations') IS DISTINCT FROM 'number'
    OR (quota->>'remaining_starts') !~ '^[0-9]{1,2}$'
    OR (quota->>'remaining_operations') !~ '^[0-9]{1,3}$' THEN
    UPDATE jetnity_dev_import_scheduler.state_v1 SET status='quota_state_unavailable',observed_at=moment WHERE singleton;
    RETURN 'quota_state_unavailable';
  END IF;
  start_left:=(quota->>'remaining_starts')::integer;
  operation_left:=(quota->>'remaining_operations')::integer;
  IF start_left>64 OR operation_left>256 THEN
    UPDATE jetnity_dev_import_scheduler.state_v1 SET status='quota_state_unavailable',observed_at=moment WHERE singleton;
    RETURN 'quota_state_unavailable';
  END IF;
  UPDATE jetnity_dev_import_scheduler.state_v1 SET observed_at=moment,
    remaining_starts=start_left,remaining_operations=operation_left WHERE singleton;
  SELECT decrypted_secret INTO STRICT signing_key FROM vault.decrypted_secrets
    WHERE name='jetnity_dev_import_cron_v1';
  IF signing_key IS NULL OR length(signing_key) NOT BETWEEN 32 AND 256 OR signing_key !~ '^[A-Za-z0-9_-]+$' THEN
    RAISE EXCEPTION 'scheduler signing configuration unavailable';
  END IF;
  -- This separate credential admits only the fixed Dev preview URL. It grants
  -- no application/Owner/import authority. PUBLIC pg_net can see this cookie
  -- and per-request MACs, but never the persistent import signing key.
  SELECT decrypted_secret INTO STRICT preview_cookie FROM vault.decrypted_secrets
    WHERE name='jetnity_dev_import_preview_cookie_v1';
  IF preview_cookie IS NULL OR length(preview_cookie)>2048
    OR preview_cookie !~ '^_vercel_jwt=[A-Za-z0-9_-]+\.[A-Za-z0-9_-]+\.[A-Za-z0-9_-]+$' THEN
    RAISE EXCEPTION 'scheduler preview admission unavailable';
  END IF;
  SELECT * INTO cycle FROM jetnity_dev_import_scheduler.cycles_v1 WHERE state='active' FOR UPDATE;
  IF NOT FOUND THEN
    IF NOT EXISTS(SELECT 1 FROM jetnity_dev_import_scheduler.terminal_cycle2_review_v1 prior
    WHERE prior.cycle_id=2 AND prior.evidence_digest='624257e5e0902a9ed1e5ba6f647430771850daf94edf54034c2e169a32af4fdd'
      AND prior.queue_fix_sha256='4205b79b1a22c80823a4965cf911445213e3f99b8daae6365a710a4748a24f3d'
      AND prior.composition_fix_sha256='667316468efe2328ae41493537462a7ff4bd571da43fe219bdf738a63dd47b89'
      AND prior.evidence_digest=encode(sha256(convert_to(((SELECT jsonb_build_object(
 'cycle',(SELECT to_jsonb(c)||jsonb_build_object(
   'created_at',to_char(c.created_at AT TIME ZONE 'UTC','YYYY-MM-DD"T"HH24:MI:SS.US"Z"'),
   'finished_at',to_char(c.finished_at AT TIME ZONE 'UTC','YYYY-MM-DD"T"HH24:MI:SS.US"Z"'))
   FROM jetnity_dev_import_scheduler.cycles_v1 c WHERE c.id=2),
 'dispatches',(SELECT jsonb_agg(to_jsonb(d)||jsonb_build_object(
   'dispatched_at',to_char(d.dispatched_at AT TIME ZONE 'UTC','YYYY-MM-DD"T"HH24:MI:SS.US"Z"'),
   'processed_at',to_char(d.processed_at AT TIME ZONE 'UTC','YYYY-MM-DD"T"HH24:MI:SS.US"Z"')) ORDER BY d.id)
   FROM jetnity_dev_import_scheduler.dispatches_v1 d WHERE d.cycle_id=2),
 'terminal_operation',(SELECT to_jsonb(q)||jsonb_build_object(
   'recorded_at',to_char(q.recorded_at AT TIME ZONE 'UTC','YYYY-MM-DD"T"HH24:MI:SS.US"Z"'))
   FROM official_v3_jobs_private.queue_operations_v1 q WHERE q.operation_id='op3_5a9ada0e40b2af467fd7e34cc51cb323'))))::text,'UTF8')),'hex')) OR NOT EXISTS(SELECT 1 FROM jetnity_dev_import_scheduler.terminal_cycle3_review_v1 r
    WHERE r.cycle_id=3 AND r.evidence_digest='cc61f8b41a289d4a78f0d0fdaaca369e2f532c1f820577ca6a5b3a1a44f45dc1'
      AND r.evidence_digest=encode(sha256(convert_to(((SELECT jsonb_build_object(
 'cycle',(SELECT to_jsonb(c)||jsonb_build_object(
   'created_at',to_char(c.created_at AT TIME ZONE 'UTC','YYYY-MM-DD"T"HH24:MI:SS.US"Z"'),
   'finished_at',to_char(c.finished_at AT TIME ZONE 'UTC','YYYY-MM-DD"T"HH24:MI:SS.US"Z"'))
   FROM jetnity_dev_import_scheduler.cycles_v1 c WHERE c.id=3),
 'dispatches',(SELECT jsonb_agg(to_jsonb(d)||jsonb_build_object(
   'dispatched_at',to_char(d.dispatched_at AT TIME ZONE 'UTC','YYYY-MM-DD"T"HH24:MI:SS.US"Z"'),
   'processed_at',to_char(d.processed_at AT TIME ZONE 'UTC','YYYY-MM-DD"T"HH24:MI:SS.US"Z"')) ORDER BY d.id)
   FROM jetnity_dev_import_scheduler.dispatches_v1 d WHERE d.cycle_id=3),
 'terminal_operation',(SELECT to_jsonb(q)||jsonb_build_object(
   'recorded_at',to_char(q.recorded_at AT TIME ZONE 'UTC','YYYY-MM-DD"T"HH24:MI:SS.US"Z"'))
   FROM official_v3_jobs_private.queue_operations_v1 q WHERE q.operation_id='op3_0ab5b766f0d954b88a7481b0d531881f'))))::text,'UTF8')),'hex') AND r.prior_cycle2_evidence_digest='624257e5e0902a9ed1e5ba6f647430771850daf94edf54034c2e169a32af4fdd'
      AND r.queue_fix_sha256='1ac59c6db4e32ad14b57ffef050c833ccd71c4260218b433e90a58fcc8b56a45' AND r.composition_fix_sha256='9a34e02bb16fccbd087be21b93b52af923b29587e8bc7d3747f2c2cde9bfec5a'
      AND r.result_composition_fix_sha256='ac82224f1ac8c7f25f17e06eb1e878355a2ee8ea45edb8ffd9a7500d872c79cd'
      AND r.import_service_fix_sha256='8bef6976a8199a87d3db0a4f62214486eb330641849c89afb3d0e5b3adcd7b33' AND r.quarantine_fix_sha256='aa7fe8e22dd1368f99528232f6f573ca0c37f38f3bc35a36c5c1a0b02480bca2'
      AND r.job_contract_fix_sha256='eaf4d0cd72def7b8fe266d6016b587483204d6919917ce2e50700194fba9fc84' AND r.job_storage_fix_sha256='1fea4f1e74713c93be8b2b3cab1360b5ab95a082e89793f9a86b9a817c787d89'
      AND r.worker_authority_fix_sha256='e614e23bf62b0d196bb0756d2e131413517d2e9d3c3ef28182534f884a97af28' AND r.selected_claim_fix_sha256='29be658ca64918c1f7d2d8f50041eca2395b5ccbbfd787dd988a7ea463914dd1'
      AND r.method_authority_fix_sha256='42fb1f7094764fa8ba85c122f39ee8290e0cdf08b6b8c4f2ed84f58a3139a2f3' AND r.owned_scope_fix_sha256='89a22b2a2de00365505258a301614a0ac2870af79bd3ced40a66c8794c6fe280'
      AND r.owned_session_fix_sha256='0d818c574ef4784589273f4e31b5abb74879028cbacce66e810012f987734f6c' AND r.executors_fix_sha256='f1fcc6a0e762104c117e771207e266a3d7eac58492bb573b7aa1be1802c7ce3b')
    OR EXISTS(SELECT 1 FROM jetnity_dev_import_scheduler.cycles_v1 blocked WHERE blocked.state='blocked'
      AND NOT EXISTS(SELECT 1 FROM jetnity_dev_import_scheduler.terminal_cycle2_review_v1 reviewed
        WHERE reviewed.cycle_id=blocked.id AND reviewed.evidence_digest='624257e5e0902a9ed1e5ba6f647430771850daf94edf54034c2e169a32af4fdd'
          AND reviewed.evidence_digest=encode(sha256(convert_to(((SELECT jsonb_build_object(
 'cycle',(SELECT to_jsonb(c)||jsonb_build_object(
   'created_at',to_char(c.created_at AT TIME ZONE 'UTC','YYYY-MM-DD"T"HH24:MI:SS.US"Z"'),
   'finished_at',to_char(c.finished_at AT TIME ZONE 'UTC','YYYY-MM-DD"T"HH24:MI:SS.US"Z"'))
   FROM jetnity_dev_import_scheduler.cycles_v1 c WHERE c.id=2),
 'dispatches',(SELECT jsonb_agg(to_jsonb(d)||jsonb_build_object(
   'dispatched_at',to_char(d.dispatched_at AT TIME ZONE 'UTC','YYYY-MM-DD"T"HH24:MI:SS.US"Z"'),
   'processed_at',to_char(d.processed_at AT TIME ZONE 'UTC','YYYY-MM-DD"T"HH24:MI:SS.US"Z"')) ORDER BY d.id)
   FROM jetnity_dev_import_scheduler.dispatches_v1 d WHERE d.cycle_id=2),
 'terminal_operation',(SELECT to_jsonb(q)||jsonb_build_object(
   'recorded_at',to_char(q.recorded_at AT TIME ZONE 'UTC','YYYY-MM-DD"T"HH24:MI:SS.US"Z"'))
   FROM official_v3_jobs_private.queue_operations_v1 q WHERE q.operation_id='op3_5a9ada0e40b2af467fd7e34cc51cb323'))))::text,'UTF8')),'hex'))
      AND NOT EXISTS(SELECT 1 FROM jetnity_dev_import_scheduler.terminal_cycle3_review_v1 reviewed
        WHERE reviewed.cycle_id=blocked.id AND reviewed.evidence_digest='cc61f8b41a289d4a78f0d0fdaaca369e2f532c1f820577ca6a5b3a1a44f45dc1'
          AND reviewed.prior_cycle2_evidence_digest='624257e5e0902a9ed1e5ba6f647430771850daf94edf54034c2e169a32af4fdd'
          AND reviewed.evidence_digest=encode(sha256(convert_to(((SELECT jsonb_build_object(
 'cycle',(SELECT to_jsonb(c)||jsonb_build_object(
   'created_at',to_char(c.created_at AT TIME ZONE 'UTC','YYYY-MM-DD"T"HH24:MI:SS.US"Z"'),
   'finished_at',to_char(c.finished_at AT TIME ZONE 'UTC','YYYY-MM-DD"T"HH24:MI:SS.US"Z"'))
   FROM jetnity_dev_import_scheduler.cycles_v1 c WHERE c.id=3),
 'dispatches',(SELECT jsonb_agg(to_jsonb(d)||jsonb_build_object(
   'dispatched_at',to_char(d.dispatched_at AT TIME ZONE 'UTC','YYYY-MM-DD"T"HH24:MI:SS.US"Z"'),
   'processed_at',to_char(d.processed_at AT TIME ZONE 'UTC','YYYY-MM-DD"T"HH24:MI:SS.US"Z"')) ORDER BY d.id)
   FROM jetnity_dev_import_scheduler.dispatches_v1 d WHERE d.cycle_id=3),
 'terminal_operation',(SELECT to_jsonb(q)||jsonb_build_object(
   'recorded_at',to_char(q.recorded_at AT TIME ZONE 'UTC','YYYY-MM-DD"T"HH24:MI:SS.US"Z"'))
   FROM official_v3_jobs_private.queue_operations_v1 q WHERE q.operation_id='op3_0ab5b766f0d954b88a7481b0d531881f'))))::text,'UTF8')),'hex'))
      AND NOT (blocked.id=4 AND EXISTS(SELECT 1 FROM jetnity_dev_import_scheduler.terminal_cycle4_attempt2_review_v1 reviewed
        WHERE reviewed.cycle_id=4 AND reviewed.evidence_digest='0a16d6263e9b40500d45e3851309465c84b7b214124b46113844bd74b0763b45'
          AND reviewed.evidence_digest=encode(sha256(convert_to(((SELECT jsonb_build_object(
 'cycle',(SELECT to_jsonb(c)||jsonb_build_object(
   'created_at',to_char(c.created_at AT TIME ZONE 'UTC','YYYY-MM-DD"T"HH24:MI:SS.US"Z"'),
   'finished_at',to_char(c.finished_at AT TIME ZONE 'UTC','YYYY-MM-DD"T"HH24:MI:SS.US"Z"'))
   FROM jetnity_dev_import_scheduler.cycles_v1 c WHERE c.id=4),
 'dispatches',(SELECT jsonb_agg(to_jsonb(d)||jsonb_build_object(
   'dispatched_at',to_char(d.dispatched_at AT TIME ZONE 'UTC','YYYY-MM-DD"T"HH24:MI:SS.US"Z"'),
   'processed_at',to_char(d.processed_at AT TIME ZONE 'UTC','YYYY-MM-DD"T"HH24:MI:SS.US"Z"')) ORDER BY d.id)
   FROM jetnity_dev_import_scheduler.dispatches_v1 d WHERE d.cycle_id=4))))::text,'UTF8')),'hex')
          AND reviewed.original_evidence_sha256='7debd26332c22a3b675280fb5401fd3116f80c0ba9b633c76a4883ab4a48d113'
          AND reviewed.prior_original_evidence_sha256='5829475017f545d3ba1573de7d94593754bfc280262b9c7dd44a04d66cad3f14'
          AND reviewed.prior_cycle3_evidence_digest='cc61f8b41a289d4a78f0d0fdaaca369e2f532c1f820577ca6a5b3a1a44f45dc1'
          AND reviewed.runtime_source_pins='[{"path":"lib/readiness/official-truth-product-v3/source/aa-ch-de-issuer.ts","bytes":31148,"sha256":"3f875d2455f11888aaa944086f8a624b2c1c443fd42db73ce0f2778c1ba9e1aa"},{"path":"lib/readiness/official-truth-product-v3/result/source-proof.ts","bytes":30248,"sha256":"3e6c76d62d103a244f4c792f3f3c7454c9e410fc1f4acdd230eb143d3a5c215f"},{"path":"lib/readiness/official-truth-product-v3/result/ch-de-import-frame.ts","bytes":9754,"sha256":"e27dc02031590c9088cfd298037690301fcc273092341c356f882f6eb42c24a4"},{"path":"lib/readiness/official-truth-product-v3/result/composition.ts","bytes":14828,"sha256":"07410b4795edfd793ec7dd0a1ede00445d29a059da4c43f31db484049aa1e4f2"},{"path":"lib/readiness/official-truth-product-v3/jobs/selected-claim.ts","bytes":18328,"sha256":"29be658ca64918c1f7d2d8f50041eca2395b5ccbbfd787dd988a7ea463914dd1"},{"path":"lib/readiness/official-truth-product-v3/runtime/ch-de-server.ts","bytes":3931,"sha256":"f3f69481b1e158a4db5dbe57cbc79c4a458e2bf83c6a8224d9aad126e1ba3176"},{"path":"lib/readiness/official-truth-product-v3/runtime/ch-de-source-admission.ts","bytes":1293,"sha256":"ed61adeaef389f0f946af4d35dc456ef4b3470f46fe1a2377aec94fa83e860ae"},{"path":"app/api/internal/readiness/ch-de-visa-tick/route.ts","bytes":2572,"sha256":"91ab59b1fb9091fa8bfc6fb2f68e1847632a0a71684ca0e885c9e41e2810362c"}]'::jsonb
          AND reviewed.retirement_digest=encode(sha256(convert_to(((SELECT jsonb_build_object('retirement',to_jsonb(r)||jsonb_build_object('retired_at',extract(epoch FROM r.retired_at)),'owner',to_jsonb(o)||jsonb_build_object('recorded_at',extract(epoch FROM o.recorded_at)))
 FROM official_v3_guard_private.retired_cycle4_attempt2_v1 r
 JOIN official_v3_guard_private.owner_operations_v1 o ON o.operation_id=r.owner_operation_id
 WHERE r.attempt_key='execution-attempt:v3:2fe5321b98827f44835f830b9c923735fab5e2a07cb1354952b516c2b035be99' AND r.job_key='research-job:v3:74713fe665cab1a7603f6e93ab06b6a1d1964e83a69571b8cced0ff009032513'
   AND r.claim_operation_id='op3_aa4029549e0cf99ec5d882752e492713' AND r.intake_operation_id='op3_e062b171cbf4958094a86366d013a73d'
   AND r.before_state->>'kind'='ch_de_cycle4_attempt2_unknown'
   AND r.before_state->>'originalEvidenceDigest'='7debd26332c22a3b675280fb5401fd3116f80c0ba9b633c76a4883ab4a48d113'
   AND r.before_state#>'{job,subjectState}'='{"kind":"rule_research","job_key":"research-job:v3:74713fe665cab1a7603f6e93ab06b6a1d1964e83a69571b8cced0ff009032513","slot_id":1,"current_job":{"kind":"research_job_record","jobId":"job3_c70d23ff344cdf2998818ecf5243d15e","lease":{"leaseId":"lease3_61fea9f1b961deb3301791adb8a3bfa4","expiresAt":"2026-11-15T17:55:23.069Z","acquiredAt":"2026-11-15T17:54:53.069Z","generation":42},"state":"leased","jobKey":"research-job:v3:74713fe665cab1a7603f6e93ab06b6a1d1964e83a69571b8cced0ff009032513","method":{"methodId":"jetnity-destination-primary-ch-de-visa","revision":1},"schema":3,"attempt":2,"context":{"route":"direct_entry","scope":{"validity":{"mode":"not_applicable"},"residence":{"mode":"not_applicable"},"citizenship":{"mode":"required","countryCodes":["CH"]},"requirementType":"visa","credentialOption":{"mode":"option","documentType":"passport","issuingCountryCode":"CH","relatedCitizenshipCountryCode":"CH"},"transitCountryCode":null,"destinationCountryCode":"DE"},"conditions":{"status":"unconditional"}},"research":{"key":"research-request:v1:b682f1de48389c7d5a3ac0d39fa4406d0e3796be91fb6e253bfd5a45cf7f945a","factKind":"requirement_effect","ruleScopeKey":"rule-scope:v1:3a24b4bc807a384b6d08e105f1107cc45d6d83c07c75eff01bc0ffc43f61477f","researchReason":{"status":"missing"}},"revision":42,"createdAt":"2026-11-15T16:36:02.293Z","updatedAt":"2026-11-15T17:54:53.069Z","contextKey":"official-truth-context:v3:bfce3bc64dbd7c670441e05033c31f339e03a2c488ab54937320508333c252c2","lastFailure":null,"operationId":"op3_91a38dc806d3f21bac3d9d16493c6be6","attemptLimit":4,"nextAttemptAt":null,"resultDecisionRef":null,"predecessorRevision":41},"start_count":12,"open_attempt":"execution-attempt:v3:2fe5321b98827f44835f830b9c923735fab5e2a07cb1354952b516c2b035be99","subject_text":"{\"context\":{\"conditions\":{\"status\":\"unconditional\"},\"route\":\"direct_entry\",\"scope\":{\"citizenship\":{\"countryCodes\":[\"CH\"],\"mode\":\"required\"},\"credentialOption\":{\"documentType\":\"passport\",\"issuingCountryCode\":\"CH\",\"mode\":\"option\",\"relatedCitizenshipCountryCode\":\"CH\"},\"destinationCountryCode\":\"DE\",\"requirementType\":\"visa\",\"residence\":{\"mode\":\"not_applicable\"},\"transitCountryCode\":null,\"validity\":{\"mode\":\"not_applicable\"}}},\"factKind\":\"requirement_effect\",\"kind\":\"rule_research\",\"method\":{\"methodId\":\"jetnity-destination-primary-ch-de-visa\",\"revision\":1}}","method_binding":{"methodId":"jetnity-destination-primary-ch-de-visa","revision":1,"methodDigest":"44ce02752da05796bef98c55b5099b81f915fe6b0975472e163721a06793bdb3","packageDigest":"0beb25db2e1f6e4c2c96d61ded30b59a8e06a32ed94498903fbeecc3b6f267e9"},"operation_count":46,"terminal_credit_claim":"op3_aa4029549e0cf99ec5d882752e492713"}'::jsonb
   AND o.action='retire_unknown' AND o.recorded_at=r.retired_at
   AND o.expected_digest=encode(sha256(convert_to((r.before_state)::text,'UTF8')),'hex')
   AND o.receipt=jsonb_build_object('schema',1,'status','recorded','action','retire_unknown',
     'operationId',o.operation_id,'selection',o.expected_digest,'result','unknown_retired',
     'recordedAt',to_char(o.recorded_at AT TIME ZONE 'UTC','YYYY-MM-DD"T"HH24:MI:SS.MS"Z"'))
   AND NOT EXISTS(SELECT 1 FROM official_v3_jobs_private.execution_results_v1 WHERE attempt_key=r.attempt_key)
   AND NOT EXISTS(SELECT 1 FROM official_v3_jobs_private.execution_dispositions_v1 WHERE attempt_key=r.attempt_key)))::text,'UTF8')),'hex')
          AND reviewed.prior_retirement_digest=encode(sha256(convert_to(((SELECT jsonb_build_object('retirement',to_jsonb(r)||jsonb_build_object('retired_at',extract(epoch FROM r.retired_at)),'owner',to_jsonb(o)||jsonb_build_object('recorded_at',extract(epoch FROM o.recorded_at)))
 FROM official_v3_guard_private.retired_cycle4_attempts_v1 r
 JOIN official_v3_guard_private.owner_operations_v1 o ON o.operation_id=r.owner_operation_id
 WHERE r.attempt_key='execution-attempt:v3:89720170633a22f22effbf861d9b7c18a465546b43999375f567145a1449d3de' AND r.job_key='research-job:v3:74713fe665cab1a7603f6e93ab06b6a1d1964e83a69571b8cced0ff009032513'
   AND r.claim_operation_id='op3_2b7811ed9b5f488cbffcd09a0ec0409b' AND r.intake_operation_id='op3_90bd61aa6d32e79273bdd923f1851576'
   AND r.before_state->>'kind'='ch_de_cycle4_unknown'
   AND r.before_state->>'originalEvidenceDigest'='5829475017f545d3ba1573de7d94593754bfc280262b9c7dd44a04d66cad3f14'
   AND r.before_state#>'{job,subjectState}'='{"kind":"rule_research","job_key":"research-job:v3:74713fe665cab1a7603f6e93ab06b6a1d1964e83a69571b8cced0ff009032513","slot_id":1,"current_job":{"kind":"research_job_record","jobId":"job3_c70d23ff344cdf2998818ecf5243d15e","lease":{"leaseId":"lease3_491cf756e95d47e0892613c0e81c556b","expiresAt":"2026-11-15T16:37:34.504Z","acquiredAt":"2026-11-15T16:37:04.504Z","generation":41},"state":"leased","jobKey":"research-job:v3:74713fe665cab1a7603f6e93ab06b6a1d1964e83a69571b8cced0ff009032513","method":{"methodId":"jetnity-destination-primary-ch-de-visa","revision":1},"schema":3,"attempt":1,"context":{"route":"direct_entry","scope":{"validity":{"mode":"not_applicable"},"residence":{"mode":"not_applicable"},"citizenship":{"mode":"required","countryCodes":["CH"]},"requirementType":"visa","credentialOption":{"mode":"option","documentType":"passport","issuingCountryCode":"CH","relatedCitizenshipCountryCode":"CH"},"transitCountryCode":null,"destinationCountryCode":"DE"},"conditions":{"status":"unconditional"}},"research":{"key":"research-request:v1:b682f1de48389c7d5a3ac0d39fa4406d0e3796be91fb6e253bfd5a45cf7f945a","factKind":"requirement_effect","ruleScopeKey":"rule-scope:v1:3a24b4bc807a384b6d08e105f1107cc45d6d83c07c75eff01bc0ffc43f61477f","researchReason":{"status":"missing"}},"revision":41,"createdAt":"2026-11-15T16:36:02.293Z","updatedAt":"2026-11-15T16:37:04.504Z","contextKey":"official-truth-context:v3:bfce3bc64dbd7c670441e05033c31f339e03a2c488ab54937320508333c252c2","lastFailure":null,"operationId":"op3_91a38dc806d3f21bac3d9d16493c6be6","attemptLimit":4,"nextAttemptAt":null,"resultDecisionRef":null,"predecessorRevision":40},"start_count":11,"open_attempt":"execution-attempt:v3:89720170633a22f22effbf861d9b7c18a465546b43999375f567145a1449d3de","subject_text":"{\"context\":{\"conditions\":{\"status\":\"unconditional\"},\"route\":\"direct_entry\",\"scope\":{\"citizenship\":{\"countryCodes\":[\"CH\"],\"mode\":\"required\"},\"credentialOption\":{\"documentType\":\"passport\",\"issuingCountryCode\":\"CH\",\"mode\":\"option\",\"relatedCitizenshipCountryCode\":\"CH\"},\"destinationCountryCode\":\"DE\",\"requirementType\":\"visa\",\"residence\":{\"mode\":\"not_applicable\"},\"transitCountryCode\":null,\"validity\":{\"mode\":\"not_applicable\"}}},\"factKind\":\"requirement_effect\",\"kind\":\"rule_research\",\"method\":{\"methodId\":\"jetnity-destination-primary-ch-de-visa\",\"revision\":1}}","method_binding":{"methodId":"jetnity-destination-primary-ch-de-visa","revision":1,"methodDigest":"44ce02752da05796bef98c55b5099b81f915fe6b0975472e163721a06793bdb3","packageDigest":"0beb25db2e1f6e4c2c96d61ded30b59a8e06a32ed94498903fbeecc3b6f267e9"},"operation_count":45,"terminal_credit_claim":"op3_2b7811ed9b5f488cbffcd09a0ec0409b"}'::jsonb
   AND o.action='retire_unknown' AND o.recorded_at=r.retired_at
   AND o.expected_digest=encode(sha256(convert_to((r.before_state)::text,'UTF8')),'hex')
   AND o.receipt=jsonb_build_object('schema',1,'status','recorded','action','retire_unknown',
     'operationId',o.operation_id,'selection',o.expected_digest,'result','unknown_retired',
     'recordedAt',to_char(o.recorded_at AT TIME ZONE 'UTC','YYYY-MM-DD"T"HH24:MI:SS.MS"Z"'))
   AND NOT EXISTS(SELECT 1 FROM official_v3_jobs_private.execution_results_v1 WHERE attempt_key=r.attempt_key)
   AND NOT EXISTS(SELECT 1 FROM official_v3_jobs_private.execution_dispositions_v1 WHERE attempt_key=r.attempt_key)))::text,'UTF8')),'hex')
          AND reviewed.continuation_digest=encode(sha256(convert_to(((SELECT jsonb_build_object(
 'start',to_jsonb(continued_start)||jsonb_build_object('reserved_at',extract(epoch FROM continued_start.reserved_at)),'result',to_jsonb(r)||jsonb_build_object('prepared_at',extract(epoch FROM r.prepared_at)),
 'disposition',to_jsonb(d)||jsonb_build_object('settled_at',extract(epoch FROM d.settled_at)),'complete',to_jsonb(q)||jsonb_build_object('recorded_at',extract(epoch FROM q.recorded_at)),
 'version',to_jsonb(v)||jsonb_build_object('committed_at',extract(epoch FROM v.committed_at)),'projection',to_jsonb(continued_projection)||jsonb_build_object('published_at',extract(epoch FROM continued_projection.published_at)),
 'publication',to_jsonb(pub)||jsonb_build_object('recorded_at',extract(epoch FROM pub.recorded_at)))
 FROM official_v3_jobs_private.execution_starts_v1 continued_start
 JOIN official_v3_jobs_private.execution_results_v1 r ON r.attempt_key=continued_start.attempt_key
 JOIN official_v3_jobs_private.execution_dispositions_v1 d ON d.attempt_key=continued_start.attempt_key
 JOIN official_v3_jobs_private.queue_operations_v1 q ON q.operation_id=d.queue_operation_id
 JOIN official_v3_result_private.versions_v1 v ON v.decision_ref=r.result->>'decisionRef'
 JOIN official_v3_result_private.projections_v1 continued_projection ON continued_projection.version_ref=v.reference
 JOIN official_v3_result_private.operations_v1 pub ON pub.operation_kind='publication'
   AND pub.operation_id=v.prepared#>>'{transition,operationId}'
 WHERE continued_start.job_key='research-job:v3:74713fe665cab1a7603f6e93ab06b6a1d1964e83a69571b8cced0ff009032513' AND continued_start.claim_operation_id='op3_ce1ca9be51062b8da8887027c208affc'
   AND continued_start.claim_text='{"jobKey":"research-job:v3:74713fe665cab1a7603f6e93ab06b6a1d1964e83a69571b8cced0ff009032513","leaseId":"lease3_9526232e043973267787eb577b98ae18","leaseMilliseconds":30000,"operationId":"op3_ce1ca9be51062b8da8887027c208affc"}'
   AND continued_start.leased_job->>'jobId'='job3_c70d23ff344cdf2998818ecf5243d15e' AND continued_start.leased_job->>'operationId'='op3_91a38dc806d3f21bac3d9d16493c6be6'
   AND continued_start.leased_job->'attempt'='3'::jsonb AND continued_start.leased_job->'revision'='43'::jsonb
   AND continued_start.leased_job->'predecessorRevision'='42'::jsonb
   AND continued_start.leased_job#>>'{lease,leaseId}'='lease3_9526232e043973267787eb577b98ae18'
   AND r.result->>'kind'='rule_research' AND r.result->>'jobId'='job3_c70d23ff344cdf2998818ecf5243d15e'
   AND r.result->>'operationId'='op3_91a38dc806d3f21bac3d9d16493c6be6' AND r.result->>'jobKey'='research-job:v3:74713fe665cab1a7603f6e93ab06b6a1d1964e83a69571b8cced0ff009032513'
   AND d.kind='completed' AND d.failure_reason IS NULL AND q.action='complete' AND q.job_key='research-job:v3:74713fe665cab1a7603f6e93ab06b6a1d1964e83a69571b8cced0ff009032513'
   AND q.envelope_text::jsonb#>>'{next,jobId}'='job3_c70d23ff344cdf2998818ecf5243d15e'
   AND q.envelope_text::jsonb#>>'{next,operationId}'='op3_91a38dc806d3f21bac3d9d16493c6be6'
   AND q.envelope_text::jsonb#>'{next,attempt}'='3'::jsonb
   AND q.envelope_text::jsonb#>'{next,revision}'='44'::jsonb
   AND q.envelope_text::jsonb#>>'{next,state}'='succeeded'
   AND q.envelope_text::jsonb#>'{next,lease}'='null'::jsonb
   AND q.envelope_text::jsonb#>>'{next,resultDecisionRef}'=r.result->>'decisionRef'
   AND v.revision>=7 AND continued_projection.record->'rule'=v.prepared->'version'
   AND continued_projection.verification_ref=v.verification_ref
   AND pub.command->'prepared'=v.prepared AND pub.command->'projection'=continued_projection.record
   AND pub.command->>'verificationRef'=v.verification_ref
   AND pub.result->>'versionRef'=v.reference AND pub.result->>'projectionRef'=continued_projection.reference
   AND r."references" @> jsonb_build_array(pub.command->'intake')
   AND pub.command#>>'{intake,binding,jobId}'='job3_c70d23ff344cdf2998818ecf5243d15e'))::text,'UTF8')),'hex')))) THEN
      UPDATE jetnity_dev_import_scheduler.state_v1 SET status='operator_review_required' WHERE singleton;
      RETURN 'operator_review_required';
    END IF;
    IF control.next_due_at>moment THEN
      UPDATE jetnity_dev_import_scheduler.state_v1 SET status='not_due' WHERE singleton;
      RETURN 'not_due';
    END IF;
    -- Reserve the existing attempt/operation allowance. Never reset or increase it.
    IF start_left<4 OR operation_left<16 THEN
      UPDATE jetnity_dev_import_scheduler.state_v1 SET status='daily_capacity_low' WHERE singleton;
      RETURN 'daily_capacity_low';
    END IF;
    INSERT INTO jetnity_dev_import_scheduler.cycles_v1(operation_id,lease_id)
      VALUES('op3_'||replace(gen_random_uuid()::text,'-',''),'lease3_'||replace(gen_random_uuid()::text,'-',''))
      RETURNING * INTO cycle;
  END IF;
  SELECT * INTO dispatch FROM jetnity_dev_import_scheduler.dispatches_v1
    WHERE cycle_id=cycle.id AND processed_at IS NULL ORDER BY id DESC LIMIT 1 FOR UPDATE;
  IF FOUND THEN
    SELECT * INTO reply FROM net._http_response WHERE id=dispatch.net_request_id;
    IF NOT FOUND AND moment<dispatch.dispatched_at+interval '90 seconds' THEN
      UPDATE jetnity_dev_import_scheduler.state_v1 SET status='awaiting_response' WHERE singleton;
      RETURN 'awaiting_response';
    END IF;
    response_status:='response_unconfirmed';
    IF FOUND AND reply.timed_out IS NOT TRUE AND reply.error_msg IS NULL AND reply.status_code BETWEEN 200 AND 599
      AND reply.content IS NOT NULL AND octet_length(reply.content)<=1024
      AND moment<=dispatch.dispatched_at+interval '150 seconds' THEN
      BEGIN
        result:=reply.content::jsonb;
        amount:=(result->>'published')::integer;
        response_status:=result->>'status';
        SELECT count(*),min(value) INTO mac_count,actual_mac FROM jsonb_each_text(reply.headers)
          WHERE lower(key)='x-jetnity-dev-import-mac';
        expected_mac:=encode(extensions.hmac(concat_ws(E'\n','jetnity-dev-import-response-v1','POST',target_path,
          dispatch.signed_at_ms,'2',dispatch.phase,cycle.operation_id,cycle.lease_id,'1',reply.status_code::text,response_status,amount::text),
          signing_key,'sha256'),'hex');
        response_verified:=result=jsonb_build_object('schema',1,'status',response_status,'published',amount)
          AND response_status IN ('queued','published','complete','exhausted','busy','not_approved','unavailable','access_required','request_refused','unresolved')
          AND amount BETWEEN 0 AND 32 AND (response_status IN ('published','unresolved') OR amount=0)
          AND mac_count=1 AND actual_mac ~ '^[a-f0-9]{64}$' AND actual_mac=expected_mac
          AND dispatch.phase=cycle.phase;
      EXCEPTION WHEN invalid_text_representation OR numeric_value_out_of_range OR invalid_parameter_value THEN
        response_verified:=false;
      END;
    END IF;
    IF response_verified IS NOT TRUE THEN response_status:='response_unconfirmed'; END IF;
    UPDATE jetnity_dev_import_scheduler.dispatches_v1 SET processed_at=moment,
      http_status=CASE WHEN reply.id IS NOT NULL THEN reply.status_code ELSE NULL END,outcome=response_status
      WHERE id=dispatch.id;
    IF response_verified AND reply.status_code=200 AND response_status='queued' AND cycle.phase='start' THEN
      UPDATE jetnity_dev_import_scheduler.cycles_v1 SET phase='resume',phase_attempts=0,last_status='queued'
        WHERE id=cycle.id RETURNING * INTO cycle;
    ELSIF response_verified AND reply.status_code=200 AND response_status='published' AND amount>0 AND cycle.phase='resume' THEN
      UPDATE jetnity_dev_import_scheduler.cycles_v1 SET state='published',published=amount,finished_at=moment,last_status='published'
        WHERE id=cycle.id;
      -- Preparation can precede publication ACK. Anchor to original request time.
      UPDATE jetnity_dev_import_scheduler.state_v1 SET next_due_at=cycle.created_at+interval '40 minutes',status='published' WHERE singleton;
      RETURN 'published';
    ELSE
      UPDATE jetnity_dev_import_scheduler.cycles_v1 SET last_status=response_status WHERE id=cycle.id;
    END IF;
    IF response_verified AND response_status IN ('exhausted','not_approved','access_required','request_refused') THEN
      UPDATE jetnity_dev_import_scheduler.cycles_v1 SET state='blocked',finished_at=moment WHERE id=cycle.id;
      UPDATE jetnity_dev_import_scheduler.state_v1 SET status='operator_review_required' WHERE singleton;
      RETURN 'operator_review_required';
    END IF;
  END IF;
  IF cycle.phase_attempts>=8 OR moment>=cycle.created_at+interval '25 minutes' THEN
    UPDATE jetnity_dev_import_scheduler.cycles_v1 SET state='blocked',finished_at=moment,last_status='retry_budget_exhausted' WHERE id=cycle.id;
    UPDATE jetnity_dev_import_scheduler.state_v1 SET status='operator_review_required' WHERE singleton;
    RETURN 'operator_review_required';
  END IF;
  -- Identifiers and phase are durable before pg_net can send after COMMIT.
  timestamp_ms:=floor(extract(epoch FROM clock_timestamp())*1000)::bigint::text;
  request_body:=jsonb_build_object('schema',2,'mode',cycle.phase,'operationId',cycle.operation_id,'leaseId',cycle.lease_id);
  expected_mac:=encode(extensions.hmac(concat_ws(E'\n','jetnity-dev-import-v1','POST',target_path,timestamp_ms,'2',
    cycle.phase,cycle.operation_id,cycle.lease_id),signing_key,'sha256'),'hex');
  request_id:=net.http_post(url:=target_url,body:=request_body,params:='{}'::jsonb,
    headers:=jsonb_build_object('Content-Type','application/json','Authorization','HMAC-SHA256 '||expected_mac,
      'X-Jetnity-Dev-Import-Time',timestamp_ms,'Cookie',preview_cookie),timeout_milliseconds:=65000);
  INSERT INTO jetnity_dev_import_scheduler.dispatches_v1(cycle_id,phase,signed_at_ms,net_request_id)
    VALUES(cycle.id,cycle.phase,timestamp_ms,request_id);
  UPDATE jetnity_dev_import_scheduler.cycles_v1 SET phase_attempts=phase_attempts+1 WHERE id=cycle.id;
  UPDATE jetnity_dev_import_scheduler.state_v1 SET status='dispatched_'||cycle.phase WHERE singleton;
  RETURN 'dispatched_'||cycle.phase;
END $tick$;

DO $postcheck$
DECLARE t record; rows_digest text; schema_name text; table_name text; p pg_proc%ROWTYPE;
BEGIN

  PERFORM official_v3_guard_private.require_open_v1();
  PERFORM official_v3_guard_private.check_control_v1();
  PERFORM official_v3_guard_private.assert_catalog_v1();
  PERFORM official_v3_guard_private.check_hma_v1();
  PERFORM official_v3_guard_private.check_s1_v1();
  PERFORM official_v3_guard_private.check_jobs_v1();
  PERFORM official_v3_guard_private.check_hrs_v1();
  PERFORM official_v3_guard_private.check_certificates_v1();
  PERFORM official_v3_guard_private.check_retirements_v1();
  IF EXISTS(SELECT 1 FROM pg_stat_activity WHERE pid<>pg_backend_pid()
  AND usename IN ('ot_v3_method_transport_login','ot_v3_intake_transport_login','ot_v3_jobs_transport_login',
    'ot_v3_result_writer','ot_v3_result_reader','ot_v3_result_verifier')) THEN RAISE EXCEPTION 'technical runtime session appeared during review'; END IF;
  SELECT * INTO STRICT p FROM pg_proc WHERE oid='jetnity_dev_import_scheduler.tick_v1()'::regprocedure;
  IF encode(sha256(convert_to((p.prosrc)::text,'UTF8')),'hex')<>'b247e6cf887e9cb0a6985e396083b8f2752ead44140a6f96905047364f4184dd'
    OR (to_jsonb(p)-'prosrc') IS DISTINCT FROM (SELECT value FROM pg_temp.cycle4_attempt2_review_before WHERE kind='tick_metadata')
    OR official_v3_guard_private.catalog_status_v1() IS DISTINCT FROM (SELECT value FROM pg_temp.cycle4_attempt2_review_before WHERE kind='protected_catalog')
    OR (SELECT jsonb_agg(to_jsonb(r) ORDER BY r.oid) FROM pg_roles r) IS DISTINCT FROM (SELECT value FROM pg_temp.cycle4_attempt2_review_before WHERE kind='roles')
    OR (SELECT jsonb_agg(to_jsonb(m) ORDER BY m.oid) FROM pg_auth_members m) IS DISTINCT FROM (SELECT value FROM pg_temp.cycle4_attempt2_review_before WHERE kind='memberships')
    OR (SELECT jsonb_agg(to_jsonb(c) ORDER BY c.jobid) FROM cron.job c) IS DISTINCT FROM (SELECT value FROM pg_temp.cycle4_attempt2_review_before WHERE kind='cron')
    OR (official_v3_guard_private.ch_de_quota_v2()-'observed_at'-'window_start') IS DISTINCT FROM (SELECT value FROM pg_temp.cycle4_attempt2_review_before WHERE kind='quota') THEN
    RAISE EXCEPTION 'review changed a protected catalog, quota, authority, cron or sender attribute';
  END IF;
  FOR t IN SELECT kind,value FROM pg_temp.cycle4_attempt2_review_before WHERE kind LIKE 'rows:%' LOOP
    schema_name:=split_part(substring(t.kind from 6),'.',1);table_name:=split_part(substring(t.kind from 6),'.',2);
    EXECUTE format('SELECT encode(sha256(convert_to(coalesce(jsonb_agg(to_jsonb(r) ORDER BY to_jsonb(r)::text COLLATE "C"),''[]''::jsonb)::text,''UTF8'')),''hex'') FROM %I.%I r',schema_name,table_name) INTO rows_digest;
    IF to_jsonb(rows_digest) IS DISTINCT FROM t.value THEN RAISE EXCEPTION 'review changed old rows: %',t.kind; END IF;
  END LOOP;
  IF (SELECT count(*) FROM jetnity_dev_import_scheduler.terminal_cycle4_attempt2_review_v1)<>1
    OR NOT EXISTS(SELECT 1 FROM jetnity_dev_import_scheduler.terminal_cycle2_review_v1 prior
    WHERE prior.cycle_id=2 AND prior.evidence_digest='624257e5e0902a9ed1e5ba6f647430771850daf94edf54034c2e169a32af4fdd'
      AND prior.queue_fix_sha256='4205b79b1a22c80823a4965cf911445213e3f99b8daae6365a710a4748a24f3d'
      AND prior.composition_fix_sha256='667316468efe2328ae41493537462a7ff4bd571da43fe219bdf738a63dd47b89'
      AND prior.evidence_digest=encode(sha256(convert_to(((SELECT jsonb_build_object(
 'cycle',(SELECT to_jsonb(c)||jsonb_build_object(
   'created_at',to_char(c.created_at AT TIME ZONE 'UTC','YYYY-MM-DD"T"HH24:MI:SS.US"Z"'),
   'finished_at',to_char(c.finished_at AT TIME ZONE 'UTC','YYYY-MM-DD"T"HH24:MI:SS.US"Z"'))
   FROM jetnity_dev_import_scheduler.cycles_v1 c WHERE c.id=2),
 'dispatches',(SELECT jsonb_agg(to_jsonb(d)||jsonb_build_object(
   'dispatched_at',to_char(d.dispatched_at AT TIME ZONE 'UTC','YYYY-MM-DD"T"HH24:MI:SS.US"Z"'),
   'processed_at',to_char(d.processed_at AT TIME ZONE 'UTC','YYYY-MM-DD"T"HH24:MI:SS.US"Z"')) ORDER BY d.id)
   FROM jetnity_dev_import_scheduler.dispatches_v1 d WHERE d.cycle_id=2),
 'terminal_operation',(SELECT to_jsonb(q)||jsonb_build_object(
   'recorded_at',to_char(q.recorded_at AT TIME ZONE 'UTC','YYYY-MM-DD"T"HH24:MI:SS.US"Z"'))
   FROM official_v3_jobs_private.queue_operations_v1 q WHERE q.operation_id='op3_5a9ada0e40b2af467fd7e34cc51cb323'))))::text,'UTF8')),'hex')) OR NOT EXISTS(SELECT 1 FROM jetnity_dev_import_scheduler.terminal_cycle3_review_v1 r
    WHERE r.cycle_id=3 AND r.evidence_digest='cc61f8b41a289d4a78f0d0fdaaca369e2f532c1f820577ca6a5b3a1a44f45dc1'
      AND r.evidence_digest=encode(sha256(convert_to(((SELECT jsonb_build_object(
 'cycle',(SELECT to_jsonb(c)||jsonb_build_object(
   'created_at',to_char(c.created_at AT TIME ZONE 'UTC','YYYY-MM-DD"T"HH24:MI:SS.US"Z"'),
   'finished_at',to_char(c.finished_at AT TIME ZONE 'UTC','YYYY-MM-DD"T"HH24:MI:SS.US"Z"'))
   FROM jetnity_dev_import_scheduler.cycles_v1 c WHERE c.id=3),
 'dispatches',(SELECT jsonb_agg(to_jsonb(d)||jsonb_build_object(
   'dispatched_at',to_char(d.dispatched_at AT TIME ZONE 'UTC','YYYY-MM-DD"T"HH24:MI:SS.US"Z"'),
   'processed_at',to_char(d.processed_at AT TIME ZONE 'UTC','YYYY-MM-DD"T"HH24:MI:SS.US"Z"')) ORDER BY d.id)
   FROM jetnity_dev_import_scheduler.dispatches_v1 d WHERE d.cycle_id=3),
 'terminal_operation',(SELECT to_jsonb(q)||jsonb_build_object(
   'recorded_at',to_char(q.recorded_at AT TIME ZONE 'UTC','YYYY-MM-DD"T"HH24:MI:SS.US"Z"'))
   FROM official_v3_jobs_private.queue_operations_v1 q WHERE q.operation_id='op3_0ab5b766f0d954b88a7481b0d531881f'))))::text,'UTF8')),'hex') AND r.prior_cycle2_evidence_digest='624257e5e0902a9ed1e5ba6f647430771850daf94edf54034c2e169a32af4fdd'
      AND r.queue_fix_sha256='1ac59c6db4e32ad14b57ffef050c833ccd71c4260218b433e90a58fcc8b56a45' AND r.composition_fix_sha256='9a34e02bb16fccbd087be21b93b52af923b29587e8bc7d3747f2c2cde9bfec5a'
      AND r.result_composition_fix_sha256='ac82224f1ac8c7f25f17e06eb1e878355a2ee8ea45edb8ffd9a7500d872c79cd'
      AND r.import_service_fix_sha256='8bef6976a8199a87d3db0a4f62214486eb330641849c89afb3d0e5b3adcd7b33' AND r.quarantine_fix_sha256='aa7fe8e22dd1368f99528232f6f573ca0c37f38f3bc35a36c5c1a0b02480bca2'
      AND r.job_contract_fix_sha256='eaf4d0cd72def7b8fe266d6016b587483204d6919917ce2e50700194fba9fc84' AND r.job_storage_fix_sha256='1fea4f1e74713c93be8b2b3cab1360b5ab95a082e89793f9a86b9a817c787d89'
      AND r.worker_authority_fix_sha256='e614e23bf62b0d196bb0756d2e131413517d2e9d3c3ef28182534f884a97af28' AND r.selected_claim_fix_sha256='29be658ca64918c1f7d2d8f50041eca2395b5ccbbfd787dd988a7ea463914dd1'
      AND r.method_authority_fix_sha256='42fb1f7094764fa8ba85c122f39ee8290e0cdf08b6b8c4f2ed84f58a3139a2f3' AND r.owned_scope_fix_sha256='89a22b2a2de00365505258a301614a0ac2870af79bd3ced40a66c8794c6fe280'
      AND r.owned_session_fix_sha256='0d818c574ef4784589273f4e31b5abb74879028cbacce66e810012f987734f6c' AND r.executors_fix_sha256='f1fcc6a0e762104c117e771207e266a3d7eac58492bb573b7aa1be1802c7ce3b') OR NOT EXISTS(SELECT 1 FROM jetnity_dev_import_scheduler.terminal_cycle4_attempt2_review_v1 reviewed
        WHERE reviewed.cycle_id=4 AND reviewed.evidence_digest='0a16d6263e9b40500d45e3851309465c84b7b214124b46113844bd74b0763b45'
          AND reviewed.evidence_digest=encode(sha256(convert_to(((SELECT jsonb_build_object(
 'cycle',(SELECT to_jsonb(c)||jsonb_build_object(
   'created_at',to_char(c.created_at AT TIME ZONE 'UTC','YYYY-MM-DD"T"HH24:MI:SS.US"Z"'),
   'finished_at',to_char(c.finished_at AT TIME ZONE 'UTC','YYYY-MM-DD"T"HH24:MI:SS.US"Z"'))
   FROM jetnity_dev_import_scheduler.cycles_v1 c WHERE c.id=4),
 'dispatches',(SELECT jsonb_agg(to_jsonb(d)||jsonb_build_object(
   'dispatched_at',to_char(d.dispatched_at AT TIME ZONE 'UTC','YYYY-MM-DD"T"HH24:MI:SS.US"Z"'),
   'processed_at',to_char(d.processed_at AT TIME ZONE 'UTC','YYYY-MM-DD"T"HH24:MI:SS.US"Z"')) ORDER BY d.id)
   FROM jetnity_dev_import_scheduler.dispatches_v1 d WHERE d.cycle_id=4))))::text,'UTF8')),'hex')
          AND reviewed.original_evidence_sha256='7debd26332c22a3b675280fb5401fd3116f80c0ba9b633c76a4883ab4a48d113'
          AND reviewed.prior_original_evidence_sha256='5829475017f545d3ba1573de7d94593754bfc280262b9c7dd44a04d66cad3f14'
          AND reviewed.prior_cycle3_evidence_digest='cc61f8b41a289d4a78f0d0fdaaca369e2f532c1f820577ca6a5b3a1a44f45dc1'
          AND reviewed.runtime_source_pins='[{"path":"lib/readiness/official-truth-product-v3/source/aa-ch-de-issuer.ts","bytes":31148,"sha256":"3f875d2455f11888aaa944086f8a624b2c1c443fd42db73ce0f2778c1ba9e1aa"},{"path":"lib/readiness/official-truth-product-v3/result/source-proof.ts","bytes":30248,"sha256":"3e6c76d62d103a244f4c792f3f3c7454c9e410fc1f4acdd230eb143d3a5c215f"},{"path":"lib/readiness/official-truth-product-v3/result/ch-de-import-frame.ts","bytes":9754,"sha256":"e27dc02031590c9088cfd298037690301fcc273092341c356f882f6eb42c24a4"},{"path":"lib/readiness/official-truth-product-v3/result/composition.ts","bytes":14828,"sha256":"07410b4795edfd793ec7dd0a1ede00445d29a059da4c43f31db484049aa1e4f2"},{"path":"lib/readiness/official-truth-product-v3/jobs/selected-claim.ts","bytes":18328,"sha256":"29be658ca64918c1f7d2d8f50041eca2395b5ccbbfd787dd988a7ea463914dd1"},{"path":"lib/readiness/official-truth-product-v3/runtime/ch-de-server.ts","bytes":3931,"sha256":"f3f69481b1e158a4db5dbe57cbc79c4a458e2bf83c6a8224d9aad126e1ba3176"},{"path":"lib/readiness/official-truth-product-v3/runtime/ch-de-source-admission.ts","bytes":1293,"sha256":"ed61adeaef389f0f946af4d35dc456ef4b3470f46fe1a2377aec94fa83e860ae"},{"path":"app/api/internal/readiness/ch-de-visa-tick/route.ts","bytes":2572,"sha256":"91ab59b1fb9091fa8bfc6fb2f68e1847632a0a71684ca0e885c9e41e2810362c"}]'::jsonb
          AND reviewed.retirement_digest=encode(sha256(convert_to(((SELECT jsonb_build_object('retirement',to_jsonb(r)||jsonb_build_object('retired_at',extract(epoch FROM r.retired_at)),'owner',to_jsonb(o)||jsonb_build_object('recorded_at',extract(epoch FROM o.recorded_at)))
 FROM official_v3_guard_private.retired_cycle4_attempt2_v1 r
 JOIN official_v3_guard_private.owner_operations_v1 o ON o.operation_id=r.owner_operation_id
 WHERE r.attempt_key='execution-attempt:v3:2fe5321b98827f44835f830b9c923735fab5e2a07cb1354952b516c2b035be99' AND r.job_key='research-job:v3:74713fe665cab1a7603f6e93ab06b6a1d1964e83a69571b8cced0ff009032513'
   AND r.claim_operation_id='op3_aa4029549e0cf99ec5d882752e492713' AND r.intake_operation_id='op3_e062b171cbf4958094a86366d013a73d'
   AND r.before_state->>'kind'='ch_de_cycle4_attempt2_unknown'
   AND r.before_state->>'originalEvidenceDigest'='7debd26332c22a3b675280fb5401fd3116f80c0ba9b633c76a4883ab4a48d113'
   AND r.before_state#>'{job,subjectState}'='{"kind":"rule_research","job_key":"research-job:v3:74713fe665cab1a7603f6e93ab06b6a1d1964e83a69571b8cced0ff009032513","slot_id":1,"current_job":{"kind":"research_job_record","jobId":"job3_c70d23ff344cdf2998818ecf5243d15e","lease":{"leaseId":"lease3_61fea9f1b961deb3301791adb8a3bfa4","expiresAt":"2026-11-15T17:55:23.069Z","acquiredAt":"2026-11-15T17:54:53.069Z","generation":42},"state":"leased","jobKey":"research-job:v3:74713fe665cab1a7603f6e93ab06b6a1d1964e83a69571b8cced0ff009032513","method":{"methodId":"jetnity-destination-primary-ch-de-visa","revision":1},"schema":3,"attempt":2,"context":{"route":"direct_entry","scope":{"validity":{"mode":"not_applicable"},"residence":{"mode":"not_applicable"},"citizenship":{"mode":"required","countryCodes":["CH"]},"requirementType":"visa","credentialOption":{"mode":"option","documentType":"passport","issuingCountryCode":"CH","relatedCitizenshipCountryCode":"CH"},"transitCountryCode":null,"destinationCountryCode":"DE"},"conditions":{"status":"unconditional"}},"research":{"key":"research-request:v1:b682f1de48389c7d5a3ac0d39fa4406d0e3796be91fb6e253bfd5a45cf7f945a","factKind":"requirement_effect","ruleScopeKey":"rule-scope:v1:3a24b4bc807a384b6d08e105f1107cc45d6d83c07c75eff01bc0ffc43f61477f","researchReason":{"status":"missing"}},"revision":42,"createdAt":"2026-11-15T16:36:02.293Z","updatedAt":"2026-11-15T17:54:53.069Z","contextKey":"official-truth-context:v3:bfce3bc64dbd7c670441e05033c31f339e03a2c488ab54937320508333c252c2","lastFailure":null,"operationId":"op3_91a38dc806d3f21bac3d9d16493c6be6","attemptLimit":4,"nextAttemptAt":null,"resultDecisionRef":null,"predecessorRevision":41},"start_count":12,"open_attempt":"execution-attempt:v3:2fe5321b98827f44835f830b9c923735fab5e2a07cb1354952b516c2b035be99","subject_text":"{\"context\":{\"conditions\":{\"status\":\"unconditional\"},\"route\":\"direct_entry\",\"scope\":{\"citizenship\":{\"countryCodes\":[\"CH\"],\"mode\":\"required\"},\"credentialOption\":{\"documentType\":\"passport\",\"issuingCountryCode\":\"CH\",\"mode\":\"option\",\"relatedCitizenshipCountryCode\":\"CH\"},\"destinationCountryCode\":\"DE\",\"requirementType\":\"visa\",\"residence\":{\"mode\":\"not_applicable\"},\"transitCountryCode\":null,\"validity\":{\"mode\":\"not_applicable\"}}},\"factKind\":\"requirement_effect\",\"kind\":\"rule_research\",\"method\":{\"methodId\":\"jetnity-destination-primary-ch-de-visa\",\"revision\":1}}","method_binding":{"methodId":"jetnity-destination-primary-ch-de-visa","revision":1,"methodDigest":"44ce02752da05796bef98c55b5099b81f915fe6b0975472e163721a06793bdb3","packageDigest":"0beb25db2e1f6e4c2c96d61ded30b59a8e06a32ed94498903fbeecc3b6f267e9"},"operation_count":46,"terminal_credit_claim":"op3_aa4029549e0cf99ec5d882752e492713"}'::jsonb
   AND o.action='retire_unknown' AND o.recorded_at=r.retired_at
   AND o.expected_digest=encode(sha256(convert_to((r.before_state)::text,'UTF8')),'hex')
   AND o.receipt=jsonb_build_object('schema',1,'status','recorded','action','retire_unknown',
     'operationId',o.operation_id,'selection',o.expected_digest,'result','unknown_retired',
     'recordedAt',to_char(o.recorded_at AT TIME ZONE 'UTC','YYYY-MM-DD"T"HH24:MI:SS.MS"Z"'))
   AND NOT EXISTS(SELECT 1 FROM official_v3_jobs_private.execution_results_v1 WHERE attempt_key=r.attempt_key)
   AND NOT EXISTS(SELECT 1 FROM official_v3_jobs_private.execution_dispositions_v1 WHERE attempt_key=r.attempt_key)))::text,'UTF8')),'hex')
          AND reviewed.prior_retirement_digest=encode(sha256(convert_to(((SELECT jsonb_build_object('retirement',to_jsonb(r)||jsonb_build_object('retired_at',extract(epoch FROM r.retired_at)),'owner',to_jsonb(o)||jsonb_build_object('recorded_at',extract(epoch FROM o.recorded_at)))
 FROM official_v3_guard_private.retired_cycle4_attempts_v1 r
 JOIN official_v3_guard_private.owner_operations_v1 o ON o.operation_id=r.owner_operation_id
 WHERE r.attempt_key='execution-attempt:v3:89720170633a22f22effbf861d9b7c18a465546b43999375f567145a1449d3de' AND r.job_key='research-job:v3:74713fe665cab1a7603f6e93ab06b6a1d1964e83a69571b8cced0ff009032513'
   AND r.claim_operation_id='op3_2b7811ed9b5f488cbffcd09a0ec0409b' AND r.intake_operation_id='op3_90bd61aa6d32e79273bdd923f1851576'
   AND r.before_state->>'kind'='ch_de_cycle4_unknown'
   AND r.before_state->>'originalEvidenceDigest'='5829475017f545d3ba1573de7d94593754bfc280262b9c7dd44a04d66cad3f14'
   AND r.before_state#>'{job,subjectState}'='{"kind":"rule_research","job_key":"research-job:v3:74713fe665cab1a7603f6e93ab06b6a1d1964e83a69571b8cced0ff009032513","slot_id":1,"current_job":{"kind":"research_job_record","jobId":"job3_c70d23ff344cdf2998818ecf5243d15e","lease":{"leaseId":"lease3_491cf756e95d47e0892613c0e81c556b","expiresAt":"2026-11-15T16:37:34.504Z","acquiredAt":"2026-11-15T16:37:04.504Z","generation":41},"state":"leased","jobKey":"research-job:v3:74713fe665cab1a7603f6e93ab06b6a1d1964e83a69571b8cced0ff009032513","method":{"methodId":"jetnity-destination-primary-ch-de-visa","revision":1},"schema":3,"attempt":1,"context":{"route":"direct_entry","scope":{"validity":{"mode":"not_applicable"},"residence":{"mode":"not_applicable"},"citizenship":{"mode":"required","countryCodes":["CH"]},"requirementType":"visa","credentialOption":{"mode":"option","documentType":"passport","issuingCountryCode":"CH","relatedCitizenshipCountryCode":"CH"},"transitCountryCode":null,"destinationCountryCode":"DE"},"conditions":{"status":"unconditional"}},"research":{"key":"research-request:v1:b682f1de48389c7d5a3ac0d39fa4406d0e3796be91fb6e253bfd5a45cf7f945a","factKind":"requirement_effect","ruleScopeKey":"rule-scope:v1:3a24b4bc807a384b6d08e105f1107cc45d6d83c07c75eff01bc0ffc43f61477f","researchReason":{"status":"missing"}},"revision":41,"createdAt":"2026-11-15T16:36:02.293Z","updatedAt":"2026-11-15T16:37:04.504Z","contextKey":"official-truth-context:v3:bfce3bc64dbd7c670441e05033c31f339e03a2c488ab54937320508333c252c2","lastFailure":null,"operationId":"op3_91a38dc806d3f21bac3d9d16493c6be6","attemptLimit":4,"nextAttemptAt":null,"resultDecisionRef":null,"predecessorRevision":40},"start_count":11,"open_attempt":"execution-attempt:v3:89720170633a22f22effbf861d9b7c18a465546b43999375f567145a1449d3de","subject_text":"{\"context\":{\"conditions\":{\"status\":\"unconditional\"},\"route\":\"direct_entry\",\"scope\":{\"citizenship\":{\"countryCodes\":[\"CH\"],\"mode\":\"required\"},\"credentialOption\":{\"documentType\":\"passport\",\"issuingCountryCode\":\"CH\",\"mode\":\"option\",\"relatedCitizenshipCountryCode\":\"CH\"},\"destinationCountryCode\":\"DE\",\"requirementType\":\"visa\",\"residence\":{\"mode\":\"not_applicable\"},\"transitCountryCode\":null,\"validity\":{\"mode\":\"not_applicable\"}}},\"factKind\":\"requirement_effect\",\"kind\":\"rule_research\",\"method\":{\"methodId\":\"jetnity-destination-primary-ch-de-visa\",\"revision\":1}}","method_binding":{"methodId":"jetnity-destination-primary-ch-de-visa","revision":1,"methodDigest":"44ce02752da05796bef98c55b5099b81f915fe6b0975472e163721a06793bdb3","packageDigest":"0beb25db2e1f6e4c2c96d61ded30b59a8e06a32ed94498903fbeecc3b6f267e9"},"operation_count":45,"terminal_credit_claim":"op3_2b7811ed9b5f488cbffcd09a0ec0409b"}'::jsonb
   AND o.action='retire_unknown' AND o.recorded_at=r.retired_at
   AND o.expected_digest=encode(sha256(convert_to((r.before_state)::text,'UTF8')),'hex')
   AND o.receipt=jsonb_build_object('schema',1,'status','recorded','action','retire_unknown',
     'operationId',o.operation_id,'selection',o.expected_digest,'result','unknown_retired',
     'recordedAt',to_char(o.recorded_at AT TIME ZONE 'UTC','YYYY-MM-DD"T"HH24:MI:SS.MS"Z"'))
   AND NOT EXISTS(SELECT 1 FROM official_v3_jobs_private.execution_results_v1 WHERE attempt_key=r.attempt_key)
   AND NOT EXISTS(SELECT 1 FROM official_v3_jobs_private.execution_dispositions_v1 WHERE attempt_key=r.attempt_key)))::text,'UTF8')),'hex')
          AND reviewed.continuation_digest=encode(sha256(convert_to(((SELECT jsonb_build_object(
 'start',to_jsonb(continued_start)||jsonb_build_object('reserved_at',extract(epoch FROM continued_start.reserved_at)),'result',to_jsonb(r)||jsonb_build_object('prepared_at',extract(epoch FROM r.prepared_at)),
 'disposition',to_jsonb(d)||jsonb_build_object('settled_at',extract(epoch FROM d.settled_at)),'complete',to_jsonb(q)||jsonb_build_object('recorded_at',extract(epoch FROM q.recorded_at)),
 'version',to_jsonb(v)||jsonb_build_object('committed_at',extract(epoch FROM v.committed_at)),'projection',to_jsonb(continued_projection)||jsonb_build_object('published_at',extract(epoch FROM continued_projection.published_at)),
 'publication',to_jsonb(pub)||jsonb_build_object('recorded_at',extract(epoch FROM pub.recorded_at)))
 FROM official_v3_jobs_private.execution_starts_v1 continued_start
 JOIN official_v3_jobs_private.execution_results_v1 r ON r.attempt_key=continued_start.attempt_key
 JOIN official_v3_jobs_private.execution_dispositions_v1 d ON d.attempt_key=continued_start.attempt_key
 JOIN official_v3_jobs_private.queue_operations_v1 q ON q.operation_id=d.queue_operation_id
 JOIN official_v3_result_private.versions_v1 v ON v.decision_ref=r.result->>'decisionRef'
 JOIN official_v3_result_private.projections_v1 continued_projection ON continued_projection.version_ref=v.reference
 JOIN official_v3_result_private.operations_v1 pub ON pub.operation_kind='publication'
   AND pub.operation_id=v.prepared#>>'{transition,operationId}'
 WHERE continued_start.job_key='research-job:v3:74713fe665cab1a7603f6e93ab06b6a1d1964e83a69571b8cced0ff009032513' AND continued_start.claim_operation_id='op3_ce1ca9be51062b8da8887027c208affc'
   AND continued_start.claim_text='{"jobKey":"research-job:v3:74713fe665cab1a7603f6e93ab06b6a1d1964e83a69571b8cced0ff009032513","leaseId":"lease3_9526232e043973267787eb577b98ae18","leaseMilliseconds":30000,"operationId":"op3_ce1ca9be51062b8da8887027c208affc"}'
   AND continued_start.leased_job->>'jobId'='job3_c70d23ff344cdf2998818ecf5243d15e' AND continued_start.leased_job->>'operationId'='op3_91a38dc806d3f21bac3d9d16493c6be6'
   AND continued_start.leased_job->'attempt'='3'::jsonb AND continued_start.leased_job->'revision'='43'::jsonb
   AND continued_start.leased_job->'predecessorRevision'='42'::jsonb
   AND continued_start.leased_job#>>'{lease,leaseId}'='lease3_9526232e043973267787eb577b98ae18'
   AND r.result->>'kind'='rule_research' AND r.result->>'jobId'='job3_c70d23ff344cdf2998818ecf5243d15e'
   AND r.result->>'operationId'='op3_91a38dc806d3f21bac3d9d16493c6be6' AND r.result->>'jobKey'='research-job:v3:74713fe665cab1a7603f6e93ab06b6a1d1964e83a69571b8cced0ff009032513'
   AND d.kind='completed' AND d.failure_reason IS NULL AND q.action='complete' AND q.job_key='research-job:v3:74713fe665cab1a7603f6e93ab06b6a1d1964e83a69571b8cced0ff009032513'
   AND q.envelope_text::jsonb#>>'{next,jobId}'='job3_c70d23ff344cdf2998818ecf5243d15e'
   AND q.envelope_text::jsonb#>>'{next,operationId}'='op3_91a38dc806d3f21bac3d9d16493c6be6'
   AND q.envelope_text::jsonb#>'{next,attempt}'='3'::jsonb
   AND q.envelope_text::jsonb#>'{next,revision}'='44'::jsonb
   AND q.envelope_text::jsonb#>>'{next,state}'='succeeded'
   AND q.envelope_text::jsonb#>'{next,lease}'='null'::jsonb
   AND q.envelope_text::jsonb#>>'{next,resultDecisionRef}'=r.result->>'decisionRef'
   AND v.revision>=7 AND continued_projection.record->'rule'=v.prepared->'version'
   AND continued_projection.verification_ref=v.verification_ref
   AND pub.command->'prepared'=v.prepared AND pub.command->'projection'=continued_projection.record
   AND pub.command->>'verificationRef'=v.verification_ref
   AND pub.result->>'versionRef'=v.reference AND pub.result->>'projectionRef'=continued_projection.reference
   AND r."references" @> jsonb_build_array(pub.command->'intake')
   AND pub.command#>>'{intake,binding,jobId}'='job3_c70d23ff344cdf2998818ecf5243d15e'))::text,'UTF8')),'hex'))
    OR NOT (EXISTS(SELECT 1 FROM jetnity_dev_import_scheduler.state_v1 WHERE singleton AND NOT enabled)
    AND EXISTS(SELECT 1 FROM cron.job WHERE jobid=5 AND jobname='jetnity-ch-de-dev-import-v1' AND NOT active
      AND command='SELECT jetnity_dev_import_scheduler.run_v1();' AND database='postgres' AND username='postgres'
      AND nodename='localhost' AND nodeport=5432 AND schedule='* * * * *')) THEN RAISE EXCEPTION 'original Cycle4 terminal review readback differs'; END IF;
END $postcheck$;
COMMIT;
