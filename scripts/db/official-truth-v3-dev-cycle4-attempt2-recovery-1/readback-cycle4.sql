-- Dev postgres SELECT only. Reconcile a lost apply ACK without replacing
-- a review, resuming cron, changing the sender or running an audit/tick.
SELECT jsonb_build_object(
 'schema',1,'observed_at',clock_timestamp(),
 'review',(SELECT to_jsonb(r)-'reviewed_head'||jsonb_build_object('reviewed_job_id',r.reviewed_head->>'jobId',
   'reviewed_revision',r.reviewed_head->'revision','reviewed_state',r.reviewed_head->>'state')
   FROM jetnity_dev_import_scheduler.terminal_cycle4_attempt2_review_v1 r WHERE cycle_id=4),
 'prior_cycle2_review_valid',EXISTS(SELECT 1 FROM jetnity_dev_import_scheduler.terminal_cycle2_review_v1 prior
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
   FROM official_v3_jobs_private.queue_operations_v1 q WHERE q.operation_id='op3_5a9ada0e40b2af467fd7e34cc51cb323'))))::text,'UTF8')),'hex')),'prior_cycle3_review_valid',EXISTS(SELECT 1 FROM jetnity_dev_import_scheduler.terminal_cycle3_review_v1 r
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
      AND r.owned_session_fix_sha256='0d818c574ef4784589273f4e31b5abb74879028cbacce66e810012f987734f6c' AND r.executors_fix_sha256='f1fcc6a0e762104c117e771207e266a3d7eac58492bb573b7aa1be1802c7ce3b'),
 'original_cycle4_evidence_unchanged',encode(sha256(convert_to(((SELECT jsonb_build_object(
 'cycle',(SELECT to_jsonb(c)||jsonb_build_object(
   'created_at',to_char(c.created_at AT TIME ZONE 'UTC','YYYY-MM-DD"T"HH24:MI:SS.US"Z"'),
   'finished_at',to_char(c.finished_at AT TIME ZONE 'UTC','YYYY-MM-DD"T"HH24:MI:SS.US"Z"'))
   FROM jetnity_dev_import_scheduler.cycles_v1 c WHERE c.id=4),
 'dispatches',(SELECT jsonb_agg(to_jsonb(d)||jsonb_build_object(
   'dispatched_at',to_char(d.dispatched_at AT TIME ZONE 'UTC','YYYY-MM-DD"T"HH24:MI:SS.US"Z"'),
   'processed_at',to_char(d.processed_at AT TIME ZONE 'UTC','YYYY-MM-DD"T"HH24:MI:SS.US"Z"')) ORDER BY d.id)
   FROM jetnity_dev_import_scheduler.dispatches_v1 d WHERE d.cycle_id=4))))::text,'UTF8')),'hex')='0a16d6263e9b40500d45e3851309465c84b7b214124b46113844bd74b0763b45',
 'original_owner_retirements_valid',(SELECT jsonb_build_object('retirement',to_jsonb(r)||jsonb_build_object('retired_at',extract(epoch FROM r.retired_at)),'owner',to_jsonb(o)||jsonb_build_object('recorded_at',extract(epoch FROM o.recorded_at)))
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
   AND NOT EXISTS(SELECT 1 FROM official_v3_jobs_private.execution_dispositions_v1 WHERE attempt_key=r.attempt_key)) IS NOT NULL AND (SELECT jsonb_build_object('retirement',to_jsonb(r)||jsonb_build_object('retired_at',extract(epoch FROM r.retired_at)),'owner',to_jsonb(o)||jsonb_build_object('recorded_at',extract(epoch FROM o.recorded_at)))
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
   AND NOT EXISTS(SELECT 1 FROM official_v3_jobs_private.execution_dispositions_v1 WHERE attempt_key=r.attempt_key)) IS NOT NULL,
 'original_attempt3_publication_valid',(SELECT jsonb_build_object(
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
   AND pub.command#>>'{intake,binding,jobId}'='job3_c70d23ff344cdf2998818ecf5243d15e') IS NOT NULL,
 'review_valid',EXISTS(SELECT 1 FROM jetnity_dev_import_scheduler.terminal_cycle4_attempt2_review_v1 reviewed
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
   AND pub.command#>>'{intake,binding,jobId}'='job3_c70d23ff344cdf2998818ecf5243d15e'))::text,'UTF8')),'hex')),
 'exact_reviewed_sender',(SELECT encode(sha256(convert_to((prosrc)::text,'UTF8')),'hex')='b247e6cf887e9cb0a6985e396083b8f2752ead44140a6f96905047364f4184dd' FROM pg_proc
   WHERE oid='jetnity_dev_import_scheduler.tick_v1()'::regprocedure),
 'sender',(SELECT to_jsonb(s) FROM jetnity_dev_import_scheduler.state_v1 s WHERE singleton),
 'cron',(SELECT jsonb_build_object('jobid',jobid,'jobname',jobname,'active',active) FROM cron.job WHERE jobid=5),
 'original_cycle4',(SELECT to_jsonb(c) FROM jetnity_dev_import_scheduler.cycles_v1 c WHERE id=4),
 'original_dispatch_count',(SELECT count(*) FROM jetnity_dev_import_scheduler.dispatches_v1 WHERE cycle_id=4),
 'other_blocked_count',(SELECT count(*) FROM jetnity_dev_import_scheduler.cycles_v1 WHERE state='blocked' AND id NOT IN (2,3,4)),
 'guard',public.official_v3_guard_alarm_status_v1(),'quota',official_v3_jobs_private.rolling_usage_v2('research-job:v3:74713fe665cab1a7603f6e93ab06b6a1d1964e83a69571b8cced0ff009032513')
);
