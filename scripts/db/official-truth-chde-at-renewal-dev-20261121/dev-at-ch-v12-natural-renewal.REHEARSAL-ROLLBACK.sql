-- DEV ONLY: natural AT source renewal with rule-neutral BMEIA changed without relabel.
-- Native rehearsal ROLLBACK. No manual cron, no owner action, no Production.
BEGIN;
SET LOCAL search_path=pg_catalog;
SET LOCAL timezone='UTC';
SET LOCAL statement_timeout='40s';
SET LOCAL lock_timeout='1s';
SET LOCAL idle_in_transaction_session_timeout='45s';
SELECT pg_advisory_xact_lock(771106,1);
SELECT pg_advisory_xact_lock(771108,44);
DO $pre$
BEGIN
 IF current_database()<>'postgres' OR current_user<>'postgres'
 OR to_regclass('official_v3_guard_private.bg1_dev_at_ch_autorenew_v12') IS NOT NULL
 OR (SELECT catalog IS DISTINCT FROM official_v3_guard_private.catalog_status_v1()
     FROM official_v3_guard_private.bg1_dev_at_ch_continuity_v11 WHERE singleton)
 OR (SELECT count(*) FROM official_v3_at_private.ch_source_qualifications_v4)<>3
 OR (SELECT count(*) FROM official_v3_method_private.heads_v1
     WHERE method_id='jetnity-destination-primary-at-visa'
       AND revision=2 AND epoch=2 AND status='approved'
       AND method_digest='fe161a865c50d26be4a41c1b122fcd14efb3b39bc9100fd66b13304dfca07a4e'
       AND package_digest='6584d20adcc08e94edc4a74cad6c780b6db9c7ce89fff8e89afb0d23380e27a0')<>1
 OR (SELECT max(batch_id) FROM official_v3_at_source_watch_private.batches_v1)<>136
 OR (SELECT outcome FROM official_v3_source_renewal_private.batches_v1
     WHERE destination_code='AT' AND source_batch_id=136)<>'changed'
 OR (SELECT count(*) FROM official_v3_at_private.ch_visa_facts_v4)<>1
 OR (SELECT encode(sha256(convert_to(pg_get_functiondef('official_v3_guard_private.assert_catalog_v1()'::regprocedure),'UTF8')),'hex'))<>'fdb624b3be37b1e56c4556f3bb55022ba654d4af39ed0f0fa3e5e29b36bc676d'
 OR (SELECT encode(sha256(convert_to(pg_get_functiondef('official_v3_guard_private.require_open_v1()'::regprocedure),'UTF8')),'hex'))<>'f912690260ff7203055809b9c3270930b98f483ee702704c70449a15ac9f2ede'
 OR (SELECT encode(sha256(convert_to(pg_get_functiondef('official_v3_source_renewal_private.seal_at_v1()'::regprocedure),'UTF8')),'hex'))<>'da3f51a72993b2a6be89effd9b7095540174f7d4502090487dc3b9ad7b5375e8'
 THEN RAISE EXCEPTION 'DEV_AT_V12_PREDECESSOR_CHANGED_STOP' USING ERRCODE='P7905'; END IF;
 PERFORM official_v3_guard_private.assert_catalog_v1();
 PERFORM official_v3_guard_private.require_open_v1();
END $pre$;
CREATE OR REPLACE FUNCTION official_v3_source_renewal_private.seal_at_v1()
 RETURNS jsonb
 LANGUAGE plpgsql
 SET search_path TO 'pg_catalog'
AS $function$
DECLARE b record; rec record; h official_v3_method_private.heads_v1%ROWTYPE;
  subject record; predecessor record; old_v3 record;
  count_sources integer:=0; count_good integer:=0; changed integer:=0;
  clock_now timestamptz; seen_at timestamptz; result_value text;
  collected_digest text; result_rows integer:=0;
BEGIN
 IF session_user<>'postgres' OR current_user<>session_user OR current_database()<>'postgres'
  OR public.official_v3_guard_alarm_status_v1()->>'status'<>'current'
  OR NOT pg_try_advisory_xact_lock(771108,44)
 THEN RETURN jsonb_build_object('status','unavailable','renewed',0); END IF;
 -- Exact comparator implementation pinned; changed code requires new review.
 IF (SELECT encode(sha256(convert_to(prosrc,'UTF8')),'hex') FROM pg_proc
       WHERE oid='official_v3_at_source_watch_private.collect_v1()'::regprocedure)
    IS DISTINCT FROM '0801fc78366e585d6b1e7841dfa30e6cda2874c4319835f41edbef1780470e44'
 OR (SELECT encode(sha256(convert_to(prosrc,'UTF8')),'hex') FROM pg_proc
       WHERE oid='official_v3_at_source_watch_private.status_v1()'::regprocedure)
    IS DISTINCT FROM 'bca9b6333bd3081e2053ca8ca224348333cb6e6c4e7709c8d3c18c0f1ee5f743'
 THEN RETURN jsonb_build_object('status','monitor_implementation_changed','renewed',0); END IF;
 PERFORM official_v3_guard_private.assert_catalog_v1();
 SELECT * INTO b FROM official_v3_at_source_watch_private.batches_v1
  ORDER BY batch_id DESC LIMIT 1;
 clock_now:=clock_timestamp();
 IF NOT FOUND OR b.requested_at>clock_now OR b.requested_at<=clock_now-interval '70 minutes'
 THEN RETURN jsonb_build_object('status','source_unavailable','renewed',0); END IF;
 IF (SELECT count(*) FROM official_v3_at_source_watch_private.reads_v1
      WHERE batch_id=b.batch_id AND state='pending')>0
 THEN RETURN jsonb_build_object('status','pending','renewed',0); END IF;

 -- Reread all complete official originals; retain unchanged, changed and
 -- unavailable observations in a NEW immutable journal, never overwrite.
 FOR rec IN
  SELECT r.*,p.url,p.raw_sha,p.canonical_sha,p.expected_bytes,p.edition_marker,
     s.official_url,s.raw_sha AS pinned_sha,s.original_bytes,s.canonical_sha AS pinned_canonical,
     s.normalization
  FROM official_v3_at_source_watch_private.reads_v1 r
  JOIN official_v3_at_source_watch_private.pins_v1 p USING(source_id)
  JOIN official_v3_source_renewal_private.sources_v1 s
    ON s.destination_code='AT' AND s.source_id=r.source_id
  WHERE r.batch_id=b.batch_id ORDER BY r.source_id
 LOOP
  count_sources:=count_sources+1;
  IF rec.observed_at IS NULL OR rec.observed_at>clock_now
   OR rec.requested_at IS DISTINCT FROM b.requested_at
   OR rec.requested_at>rec.observed_at OR rec.observed_at>rec.requested_at+interval '5 minutes 10 seconds'
   OR rec.url IS DISTINCT FROM rec.official_url OR rec.raw_sha IS DISTINCT FROM rec.pinned_sha
   OR rec.expected_bytes IS DISTINCT FROM rec.original_bytes
   OR rec.canonical_sha IS DISTINCT FROM rec.pinned_canonical
   OR rec.state NOT IN ('unchanged_exact','unchanged_asset_version_only','changed','unavailable')
  THEN RETURN jsonb_build_object('status','invalid_source_receipt','renewed',0); END IF;
  IF rec.state='unchanged_exact' AND rec.observed_sha=rec.pinned_sha
   AND rec.observed_bytes=rec.original_bytes THEN count_good:=count_good+1;
  ELSIF rec.state='unchanged_asset_version_only'
   AND rec.source_id='bmeia-bern-how-to-apply'
   AND rec.normalization='bmeia-theme-assets-v1'
   AND rec.pinned_canonical='b696180d20ac97333f54f0bb6fc3dc55481884ac3663d3dcb67a7a3367052a55'
   AND rec.observed_sha ~ '^[a-f0-9]{64}$' AND rec.observed_bytes=rec.original_bytes
  THEN count_good:=count_good+1;
  ELSIF rec.state='changed' THEN changed:=changed+1; END IF;
 END LOOP;
 IF count_sources<>3 THEN RETURN jsonb_build_object('status','incomplete_source_set','renewed',0); END IF;
 result_value:=CASE WHEN changed>0 THEN 'changed'
  WHEN count_good=3 THEN 'unchanged' ELSE 'unavailable' END;
 INSERT INTO official_v3_source_renewal_private.batches_v1(
   destination_code,source_batch_id,requested_at,sealed_at,outcome,source_count)
 VALUES('AT',b.batch_id,b.requested_at,clock_now,result_value,3)
 ON CONFLICT DO NOTHING;
 IF (SELECT outcome FROM official_v3_source_renewal_private.batches_v1
   WHERE destination_code='AT' AND source_batch_id=b.batch_id) IS DISTINCT FROM result_value
 THEN RETURN jsonb_build_object('status','conflicting_journal','renewed',0); END IF;
 INSERT INTO official_v3_source_renewal_private.observations_v1(
  destination_code,source_batch_id,source_id,request_id,requested_at,
  observed_at,result,observed_bytes,observed_sha,reference_digest)
 SELECT 'AT',r.batch_id,r.source_id,r.request_id,r.requested_at,
  r.observed_at,r.state,r.observed_bytes,r.observed_sha,
  encode(sha256(convert_to(
    'AT|'||r.source_id||'|'||p.url||'|'||p.raw_sha||'|'||coalesce(p.canonical_sha,'')||'|'||
    r.request_id::text||'|'||r.state||'|'||coalesce(r.observed_sha,'')||'|'||
    to_char(r.observed_at AT TIME ZONE 'UTC','YYYY-MM-DD"T"HH24:MI:SS.US"Z"'),'UTF8')),'hex')
 FROM official_v3_at_source_watch_private.reads_v1 r
 JOIN official_v3_at_source_watch_private.pins_v1 p USING(source_id)
 WHERE r.batch_id=b.batch_id
 ON CONFLICT DO NOTHING;
 IF (SELECT count(*) FROM official_v3_source_renewal_private.observations_v1
   WHERE destination_code='AT' AND source_batch_id=b.batch_id)<>3
 THEN RETURN jsonb_build_object('status','incomplete_journal','renewed',0); END IF;
 IF result_value<>'unchanged' THEN
   -- A changed source is NOT falsely marked unchanged. The reviewed narrow
   -- BMEIA revision can be lawfully renewed only by the independent v4
   -- exact SHA/bytes, live method, BG1, passport-scope and time checks.
   -- Any other changed/unqualified source fails closed in that issuer.
   IF result_value='changed' THEN
     result_rows:=official_v3_source_renewal_private.renew_approved_batch_v1('AT',b.batch_id);
     PERFORM official_v3_guard_private.assert_catalog_v1();
     RETURN jsonb_build_object('status','changed','renewed',result_rows,
       'sources',count_sources,'accepted_from_research',0);
   END IF;
   RETURN jsonb_build_object('status',result_value,'renewed',0);
 END IF;
 -- Fresh observation and current official method/Owner epoch are mandatory.
 IF official_v3_at_source_watch_private.status_v1()->>'status'<>'PINNED_UNCHANGED_NOT_APPROVED'
 THEN RETURN jsonb_build_object('status','watch_unavailable','renewed',0); END IF;
 SELECT min(observed_at) INTO seen_at FROM official_v3_source_renewal_private.observations_v1
  WHERE destination_code='AT' AND source_batch_id=b.batch_id;
 IF seen_at IS NULL OR seen_at>clock_now OR seen_at<clock_now-interval '70 minutes'
 THEN RETURN jsonb_build_object('status','old_batch','renewed',0); END IF;
 SELECT * INTO STRICT h FROM official_v3_method_private.heads_v1
  WHERE method_id='jetnity-destination-primary-at-visa' FOR SHARE;
 PERFORM official_v3_method_private.require_current_locked_v1(
  'jetnity-destination-primary-at-visa',1,
  'cd9b8584d08cc3bfb83f0f1a7095c1c6e011c8d25336f8767ec6678ec8bbc9e9',
  '55e574d7c70c20513a4ac05273c43cdd87dd854e0b403ce0c9a5ab168220ebfe',h.epoch);
 result_rows:=official_v3_source_renewal_private.renew_approved_batch_v1('AT',b.batch_id);
 PERFORM official_v3_guard_private.assert_catalog_v1();
 RETURN jsonb_build_object('status','source_checked','renewed',result_rows,
   'sources',count_sources,'accepted_from_research',0);
EXCEPTION WHEN OTHERS THEN
 -- A status writer may fail closed; no exception is converted into
 -- a visitor-facing positive. Transactional SQL errors roll back its effects.
 RETURN jsonb_build_object('status','unavailable','renewed',0);
END $function$
;
CREATE TABLE official_v3_guard_private.bg1_dev_at_ch_autorenew_v12(
 singleton boolean PRIMARY KEY CHECK(singleton),
 predecessor_catalog_digest text NOT NULL,
 predecessor_baseline_digest text NOT NULL,
 required_generation bigint NOT NULL,
 proof_not_before timestamptz NOT NULL,
 catalog jsonb NOT NULL
);
ALTER TABLE official_v3_guard_private.bg1_dev_at_ch_autorenew_v12 ENABLE ROW LEVEL SECURITY;
ALTER TABLE official_v3_guard_private.bg1_dev_at_ch_autorenew_v12 FORCE ROW LEVEL SECURITY;
REVOKE ALL ON official_v3_guard_private.bg1_dev_at_ch_autorenew_v12
 FROM PUBLIC,anon,authenticated,service_role;
INSERT INTO official_v3_guard_private.bg1_dev_at_ch_autorenew_v12(
 singleton,predecessor_catalog_digest,predecessor_baseline_digest,
 required_generation,proof_not_before,catalog)
SELECT true,
 encode(sha256(convert_to(v.catalog::text,'UTF8')),'hex'),
 encode(sha256(convert_to((to_jsonb(v)||jsonb_build_object('proof_not_before',
 extract(epoch FROM v.proof_not_before)))::text,'UTF8')),'hex'),
 st.generation+1,clock_timestamp(),'{}'::jsonb
FROM official_v3_guard_private.bg1_dev_at_ch_continuity_v11 v
 CROSS JOIN official_v3_guard_private.state_v1 st
 WHERE v.singleton AND st.singleton;
CREATE OR REPLACE FUNCTION official_v3_guard_private.assert_catalog_v1()
 RETURNS void
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO 'pg_catalog'
AS $function$
DECLARE at_auto_v12 official_v3_guard_private.bg1_dev_at_ch_autorenew_v12%ROWTYPE;
 at_continuity_v11 official_v3_guard_private.bg1_dev_at_ch_continuity_v11%ROWTYPE;
 at_fresh_v10 official_v3_guard_private.bg1_dev_at_ch_freshproof_v10%ROWTYPE;
 at_source_v9 official_v3_guard_private.bg1_dev_at_ch_source_v9%ROWTYPE;
 transport_v8 official_v3_guard_private.bg1_dev_http_id_allocator_v8%ROWTYPE;
 restore_v7 official_v3_guard_private.bg1_dev_grantor_restore_v7%ROWTYPE;
 cycle5_v6 official_v3_guard_private.bg1_dev_cycle5_baseline_v6%ROWTYPE;
 maintenance_v5 official_v3_guard_private.bg1_dev_maintenance_baseline_v5%ROWTYPE;
 acl_v4 official_v3_guard_private.bg1_dev_weather_acl_baseline_v4%ROWTYPE;
 bg1_v3 official_v3_guard_private.bg1_transient_baseline_v3%ROWTYPE;
 renewal official_v3_guard_private.source_renewal_baseline_v1%ROWTYPE;
  at_baseline official_v3_guard_private.at_hrs2_baseline_v1%ROWTYPE;
  admin official_v3_guard_private.admin_runtime_baseline_v1%ROWTYPE;
  successor official_v3_guard_private.recovery_baseline_v1%ROWTYPE;
  predecessor official_v3_guard_private.status_baseline_v1%ROWTYPE; old_baselines jsonb;
  gap_baseline official_v3_guard_private.gap_recovery_baseline_v1%ROWTYPE;
  rolling official_v3_guard_private.rolling_quota_baseline_v1%ROWTYPE;
  customer official_v3_guard_private.customer_information_baseline_v1%ROWTYPE;
  refresh official_v3_guard_private.refresh_retirement_baseline_v1%ROWTYPE;
  cycle4 official_v3_guard_private.cycle4_recovery_baseline_v1%ROWTYPE;
  attempt2 official_v3_guard_private.cycle4_attempt2_baseline_v1%ROWTYPE;
BEGIN
  IF pg_catalog.current_setting('session_replication_role') NOT IN('origin','local') THEN
    RAISE EXCEPTION 'bg1 transport session context unavailable' USING ERRCODE='P7905'; END IF;
  SELECT * INTO STRICT at_auto_v12 FROM official_v3_guard_private.bg1_dev_at_ch_autorenew_v12 WHERE singleton;
  SELECT * INTO STRICT at_continuity_v11 FROM official_v3_guard_private.bg1_dev_at_ch_continuity_v11 WHERE singleton;
  SELECT * INTO STRICT at_fresh_v10 FROM official_v3_guard_private.bg1_dev_at_ch_freshproof_v10 WHERE singleton;
  SELECT * INTO STRICT at_source_v9 FROM official_v3_guard_private.bg1_dev_at_ch_source_v9 WHERE singleton;
  SELECT * INTO STRICT transport_v8 FROM official_v3_guard_private.bg1_dev_http_id_allocator_v8 WHERE singleton;
  SELECT * INTO STRICT restore_v7 FROM official_v3_guard_private.bg1_dev_grantor_restore_v7 WHERE singleton;
  SELECT * INTO STRICT cycle5_v6 FROM official_v3_guard_private.bg1_dev_cycle5_baseline_v6 WHERE singleton;
  SELECT * INTO STRICT maintenance_v5 FROM official_v3_guard_private.bg1_dev_maintenance_baseline_v5 WHERE singleton;
  SELECT * INTO STRICT acl_v4 FROM official_v3_guard_private.bg1_dev_weather_acl_baseline_v4 WHERE singleton;
  SELECT * INTO STRICT bg1_v3 FROM official_v3_guard_private.bg1_transient_baseline_v3 WHERE singleton;
 SELECT * INTO STRICT renewal FROM official_v3_guard_private.source_renewal_baseline_v1 WHERE singleton;
  SELECT * INTO STRICT at_baseline FROM official_v3_guard_private.at_hrs2_baseline_v1 WHERE singleton;
  SELECT * INTO STRICT admin FROM official_v3_guard_private.admin_runtime_baseline_v1 WHERE singleton;
  SELECT * INTO STRICT attempt2 FROM official_v3_guard_private.cycle4_attempt2_baseline_v1 WHERE singleton;
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
    OR attempt2.predecessor_provider_digest<>'e12dc341cc01de2a459826e8b1c6a3a9b4dd48b40dd8cd1c765660007b7694f3'
    OR attempt2.original_evidence_digest<>'7debd26332c22a3b675280fb5401fd3116f80c0ba9b633c76a4883ab4a48d113'
    OR attempt2.predecessor_catalog_digest IS DISTINCT FROM encode(sha256(convert_to(cycle4.catalog::text,'UTF8')),'hex')
    OR attempt2.predecessor_cycle4_digest IS DISTINCT FROM encode(sha256(convert_to((to_jsonb(cycle4)||jsonb_build_object('proof_not_before',extract(epoch FROM cycle4.proof_not_before)))::text,'UTF8')),'hex')
    OR admin.predecessor_provider_digest<>'9da5d3dee7a4c3a45fea976b27fc2996e5b5d912741407c6be9954baefa1e106'
    OR admin.definition_digest<>'872bec621ba99e88c62b61cc2c5ab54725593bf424f18dae2c5442897d7f228b'
    OR admin.predecessor_catalog_digest IS DISTINCT FROM encode(sha256(convert_to(attempt2.catalog::text,'UTF8')),'hex')
    OR admin.predecessor_attempt2_digest IS DISTINCT FROM encode(sha256(convert_to((to_jsonb(attempt2)||jsonb_build_object('proof_not_before',extract(epoch FROM attempt2.proof_not_before)))::text,'UTF8')),'hex')
    OR at_baseline.predecessor_catalog_digest IS DISTINCT FROM encode(sha256(convert_to(admin.catalog::text,'UTF8')),'hex')
    OR at_baseline.predecessor_admin_digest IS DISTINCT FROM encode(sha256(convert_to((to_jsonb(admin)||jsonb_build_object('proof_not_before',extract(epoch FROM admin.proof_not_before)))::text,'UTF8')),'hex')
    OR at_baseline.source_chain IS DISTINCT FROM (SELECT encode(sha256(convert_to(string_agg(source_id||':'||encode(sha256(original_body),'hex'),'|' ORDER BY source_id COLLATE "C"),'UTF8')),'hex') FROM official_v3_at_private.whole_originals_v2)
    OR renewal.predecessor_catalog_digest IS DISTINCT FROM encode(sha256(convert_to(at_baseline.catalog::text,'UTF8')),'hex')
    OR renewal.predecessor_baseline_digest IS DISTINCT FROM encode(sha256(convert_to((to_jsonb(at_baseline)||jsonb_build_object('proof_not_before',extract(epoch FROM at_baseline.proof_not_before)))::text,'UTF8')),'hex')
    OR bg1_v3.predecessor_catalog_digest IS DISTINCT FROM encode(sha256(convert_to(renewal.catalog::text,'UTF8')),'hex')
 OR bg1_v3.predecessor_baseline_digest IS DISTINCT FROM encode(sha256(convert_to((to_jsonb(renewal)||jsonb_build_object('proof_not_before',extract(epoch FROM renewal.proof_not_before)))::text,'UTF8')),'hex')
 OR bg1_v3.required_generation<=renewal.required_generation
 OR bg1_v3.proof_not_before<=renewal.proof_not_before
 OR acl_v4.predecessor_catalog_digest IS DISTINCT FROM encode(sha256(convert_to(bg1_v3.catalog::text,'UTF8')),'hex')
 OR acl_v4.predecessor_baseline_digest IS DISTINCT FROM
   encode(sha256(convert_to((to_jsonb(bg1_v3)||jsonb_build_object('proof_not_before',extract(epoch FROM bg1_v3.proof_not_before)))::text,'UTF8')),'hex')
 OR acl_v4.approved_dependency_key IS DISTINCT FROM 'shared:5:1255:91879:0:1260:16485:a'
 OR NOT (acl_v4.catalog ? 'shared:5:1255:91879:0:1260:16485:a') OR (bg1_v3.catalog ? 'shared:5:1255:91879:0:1260:16485:a')
 OR acl_v4.weather_function_digest IS DISTINCT FROM
   encode(sha256(convert_to(pg_get_functiondef('public.reisewetter_reservieren_v1()'::regprocedure),'UTF8')),'hex')
 OR acl_v4.weather_function_digest<>'9c9e0dc4a1c7cf48c60b434b32eb26f2c65805f9ab95e9c0ca832d7b5e1b27be'
 OR acl_v4.weather_acl_text IS DISTINCT FROM
   (SELECT proacl::text FROM pg_proc WHERE oid='public.reisewetter_reservieren_v1()'::regprocedure)
 OR acl_v4.weather_acl_text<>'{postgres=X/postgres,authenticated=X/postgres}'
 OR has_function_privilege('anon','public.reisewetter_reservieren_v1()','EXECUTE')
 OR has_function_privilege('service_role','public.reisewetter_reservieren_v1()','EXECUTE')
 OR NOT has_function_privilege('authenticated','public.reisewetter_reservieren_v1()','EXECUTE')
 OR acl_v4.required_generation<=bg1_v3.required_generation
 OR acl_v4.proof_not_before<=bg1_v3.proof_not_before
 OR maintenance_v5.predecessor_catalog_digest IS DISTINCT FROM encode(sha256(convert_to(acl_v4.catalog::text,'UTF8')),'hex')
 OR maintenance_v5.predecessor_baseline_digest IS DISTINCT FROM
   encode(sha256(convert_to((to_jsonb(acl_v4)||jsonb_build_object('proof_not_before',extract(epoch FROM acl_v4.proof_not_before)))::text,'UTF8')),'hex')
 OR maintenance_v5.required_generation<=acl_v4.required_generation
 OR maintenance_v5.proof_not_before<=acl_v4.proof_not_before
 OR cycle5_v6.predecessor_catalog_digest IS DISTINCT FROM encode(sha256(convert_to(maintenance_v5.catalog::text,'UTF8')),'hex')
 OR cycle5_v6.predecessor_baseline_digest IS DISTINCT FROM encode(sha256(convert_to((to_jsonb(maintenance_v5)||jsonb_build_object('proof_not_before',extract(epoch FROM maintenance_v5.proof_not_before)))::text,'UTF8')),'hex')
 OR cycle5_v6.attempt_key<>'execution-attempt:v3:c932f0e7f8a196714a21d8785185efdd0a43b7d81021b5b7bf5200e19f65d153' OR cycle5_v6.prior_retirement_count<>6
 OR cycle5_v6.required_generation<=maintenance_v5.required_generation
 OR cycle5_v6.proof_not_before<=maintenance_v5.proof_not_before
 OR maintenance_v5.catalog IS DISTINCT FROM (SELECT catalog FROM official_v3_guard_private.bg1_dev_maintenance_baseline_v5 WHERE singleton)

 OR restore_v7.predecessor_catalog_digest IS DISTINCT FROM encode(sha256(convert_to(cycle5_v6.catalog::text,'UTF8')),'hex')
 OR restore_v7.predecessor_baseline_digest IS DISTINCT FROM encode(sha256(convert_to((to_jsonb(cycle5_v6)||
  jsonb_build_object('proof_not_before',extract(epoch FROM cycle5_v6.proof_not_before)))::text,'UTF8')),'hex')
 OR restore_v7.removed_duplicate_membership_key IS DISTINCT FROM 'membership:92604'
 OR NOT (cycle5_v6.catalog ? 'membership:92604') OR restore_v7.catalog ? 'membership:92604'
 OR (SELECT count(*) FROM pg_auth_members WHERE roleid='ot_v3_jobs_owner'::regrole AND member='postgres'::regrole)<>1
 OR NOT EXISTS(SELECT 1 FROM pg_auth_members WHERE roleid='ot_v3_jobs_owner'::regrole AND member='postgres'::regrole
    AND grantor='supabase_admin'::regrole AND admin_option AND NOT inherit_option AND NOT set_option)
 OR restore_v7.required_generation<=cycle5_v6.required_generation
 OR restore_v7.proof_not_before<=cycle5_v6.proof_not_before
 OR transport_v8.predecessor_catalog_digest IS DISTINCT FROM encode(sha256(convert_to(restore_v7.catalog::text,'UTF8')),'hex')
 OR transport_v8.predecessor_baseline_digest IS DISTINCT FROM encode(sha256(convert_to((to_jsonb(restore_v7)||
   jsonb_build_object('proof_not_before',extract(epoch FROM restore_v7.proof_not_before)))::text,'UTF8')),'hex')
 OR transport_v8.required_generation<=restore_v7.required_generation
 OR transport_v8.proof_not_before<=restore_v7.proof_not_before
 OR transport_v8.transport_metadata_digest IS DISTINCT FROM encode(sha256(convert_to(transport_v8.transport_metadata::text,'UTF8')),'hex')
 OR transport_v8.transport_metadata IS DISTINCT FROM official_v3_guard_private.catalog_status_v1()->'transport:dev_http_id_allocator_v8'
 OR at_source_v9.predecessor_catalog_digest IS DISTINCT FROM encode(sha256(convert_to(transport_v8.catalog::text,'UTF8')),'hex')
 OR at_source_v9.predecessor_baseline_digest IS DISTINCT FROM encode(sha256(convert_to((to_jsonb(transport_v8)||
   jsonb_build_object('proof_not_before',extract(epoch FROM transport_v8.proof_not_before)))::text,'UTF8')),'hex')
 OR at_source_v9.required_generation<=transport_v8.required_generation
 OR at_source_v9.proof_not_before<=transport_v8.proof_not_before
 OR (SELECT count(*) FROM official_v3_at_private.ch_source_qualifications_v4)<>3
 OR at_source_v9.sources_digest IS DISTINCT FROM (
   SELECT encode(sha256(convert_to(string_agg(source_id||':'||body_digest||':'||
     encode(sha256(original_body),'hex')||':'||body_bytes::text,'|' ORDER BY source_id COLLATE "C"),'UTF8')),'hex')
   FROM official_v3_at_private.ch_source_qualifications_v4)
 OR at_fresh_v10.predecessor_catalog_digest IS DISTINCT FROM
    encode(sha256(convert_to(at_source_v9.catalog::text,'UTF8')),'hex')
 OR at_fresh_v10.predecessor_baseline_digest IS DISTINCT FROM
    encode(sha256(convert_to((to_jsonb(at_source_v9)||
     jsonb_build_object('proof_not_before',extract(epoch FROM at_source_v9.proof_not_before)))::text,'UTF8')),'hex')
 OR at_fresh_v10.required_generation<=at_source_v9.required_generation
 OR at_fresh_v10.proof_not_before<=at_source_v9.proof_not_before
 OR at_continuity_v11.predecessor_catalog_digest IS DISTINCT FROM
    encode(sha256(convert_to(at_fresh_v10.catalog::text,'UTF8')),'hex')
 OR at_continuity_v11.predecessor_baseline_digest IS DISTINCT FROM
    encode(sha256(convert_to((to_jsonb(at_fresh_v10)||
     jsonb_build_object('proof_not_before',extract(epoch FROM at_fresh_v10.proof_not_before)))::text,'UTF8')),'hex')
 OR at_continuity_v11.required_generation<=at_fresh_v10.required_generation
 OR at_continuity_v11.proof_not_before<=at_fresh_v10.proof_not_before
 OR at_auto_v12.predecessor_catalog_digest IS DISTINCT FROM
     encode(sha256(convert_to(at_continuity_v11.catalog::text,'UTF8')),'hex')
 OR at_auto_v12.predecessor_baseline_digest IS DISTINCT FROM
     encode(sha256(convert_to((to_jsonb(at_continuity_v11)||
       jsonb_build_object('proof_not_before',extract(epoch FROM at_continuity_v11.proof_not_before)))::text,'UTF8')),'hex')
 OR at_auto_v12.required_generation<=at_continuity_v11.required_generation
 OR at_auto_v12.proof_not_before<=at_continuity_v11.proof_not_before
 OR at_auto_v12.catalog IS DISTINCT FROM official_v3_guard_private.catalog_status_v1() THEN
    RAISE EXCEPTION 'bg1 recovery protected catalog changed' USING ERRCODE='P7905'; END IF;
END $function$
;
CREATE OR REPLACE FUNCTION official_v3_guard_private.require_open_v1()
 RETURNS bigint
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO 'pg_catalog'
AS $function$
DECLARE s official_v3_guard_private.state_v1%ROWTYPE; instant timestamptz;
  required_proof bigint; earliest_proof timestamptz;
BEGIN
  IF pg_catalog.current_setting('session_replication_role') NOT IN('origin','local') THEN
    RAISE EXCEPTION 'bg1 transport session context unavailable' USING ERRCODE='P7902'; END IF;
  SELECT * INTO s FROM official_v3_guard_private.state_v1 WHERE singleton FOR SHARE;
  instant:=clock_timestamp();
  IF NOT FOUND OR s.generation=0 OR s.incident_generation<>s.resumed_generation
    OR instant<s.last_observed OR instant<s.last_finished OR instant>=s.valid_until
    OR s.last_finished>s.last_started+interval '30 seconds' OR s.valid_until<>s.last_due+interval '5 minutes 30 seconds' THEN
    RAISE EXCEPTION 'bg1 integrity unavailable' USING ERRCODE='P7902'; END IF;
  SELECT greatest(renewal.required_generation,at_baseline.required_generation,admin.required_generation,a.required_generation,k.required_generation,f.required_generation,c.required_generation,q.required_generation,g.required_generation,r.required_generation,b.required_generation),greatest(renewal.proof_not_before,at_baseline.proof_not_before,admin.proof_not_before,a.proof_not_before,k.proof_not_before,f.proof_not_before,c.proof_not_before,q.proof_not_before,g.proof_not_before,r.proof_not_before,b.proof_not_before)
    INTO STRICT required_proof,earliest_proof FROM official_v3_guard_private.source_renewal_baseline_v1 renewal CROSS JOIN official_v3_guard_private.at_hrs2_baseline_v1 at_baseline CROSS JOIN official_v3_guard_private.admin_runtime_baseline_v1 admin CROSS JOIN official_v3_guard_private.cycle4_attempt2_baseline_v1 a CROSS JOIN official_v3_guard_private.cycle4_recovery_baseline_v1 k CROSS JOIN official_v3_guard_private.refresh_retirement_baseline_v1 f CROSS JOIN official_v3_guard_private.customer_information_baseline_v1 c
      CROSS JOIN official_v3_guard_private.rolling_quota_baseline_v1 q
      CROSS JOIN official_v3_guard_private.gap_recovery_baseline_v1 g
      CROSS JOIN official_v3_guard_private.recovery_baseline_v1 r
      CROSS JOIN official_v3_guard_private.status_baseline_v1 b WHERE renewal.singleton AND at_baseline.singleton AND admin.singleton AND a.singleton AND k.singleton AND f.singleton AND c.singleton AND q.singleton AND g.singleton AND r.singleton AND b.singleton;
    SELECT greatest(v.required_generation,required_proof),greatest(v.proof_not_before,earliest_proof)
     INTO STRICT required_proof,earliest_proof FROM official_v3_guard_private.bg1_transient_baseline_v3 v WHERE singleton;
 SELECT greatest(required_proof,v.required_generation),greatest(earliest_proof,v.proof_not_before)
 INTO STRICT required_proof,earliest_proof FROM official_v3_guard_private.bg1_dev_weather_acl_baseline_v4 v WHERE singleton;
 SELECT greatest(required_proof,v.required_generation),greatest(earliest_proof,v.proof_not_before)
 INTO STRICT required_proof,earliest_proof FROM official_v3_guard_private.bg1_dev_maintenance_baseline_v5 v WHERE singleton;
  SELECT greatest(required_proof,v.required_generation),greatest(earliest_proof,v.proof_not_before)
   INTO STRICT required_proof,earliest_proof
  FROM official_v3_guard_private.bg1_dev_cycle5_baseline_v6 v WHERE singleton;
  SELECT greatest(required_proof,v.required_generation),greatest(earliest_proof,v.proof_not_before)
   INTO STRICT required_proof,earliest_proof
  FROM official_v3_guard_private.bg1_dev_grantor_restore_v7 v WHERE singleton;
  SELECT greatest(required_proof,v.required_generation),greatest(earliest_proof,v.proof_not_before)
   INTO STRICT required_proof,earliest_proof
  FROM official_v3_guard_private.bg1_dev_http_id_allocator_v8 v WHERE singleton;
  SELECT greatest(required_proof,v.required_generation),greatest(earliest_proof,v.proof_not_before)
    INTO STRICT required_proof,earliest_proof
    FROM official_v3_guard_private.bg1_dev_at_ch_source_v9 v WHERE singleton;
 SELECT greatest(required_proof,v.required_generation),greatest(earliest_proof,v.proof_not_before)
 INTO STRICT required_proof,earliest_proof FROM official_v3_guard_private.bg1_dev_at_ch_freshproof_v10 v WHERE singleton;
  SELECT greatest(required_proof,v.required_generation),greatest(earliest_proof,v.proof_not_before)
   INTO STRICT required_proof,earliest_proof
   FROM official_v3_guard_private.bg1_dev_at_ch_continuity_v11 v WHERE singleton;
 SELECT greatest(required_proof,v.required_generation),greatest(earliest_proof,v.proof_not_before)
   INTO STRICT required_proof,earliest_proof
   FROM official_v3_guard_private.bg1_dev_at_ch_autorenew_v12 v WHERE singleton;
  IF s.generation<required_proof OR s.last_proof_started<earliest_proof OR instant<earliest_proof
    OR NOT EXISTS(SELECT 1 FROM official_v3_guard_private.runs_v1 run WHERE run.outcome='complete' AND run.generation=s.generation
      AND run.due_at=s.last_due AND run.started_at=s.last_started AND run.proof_started_at=s.last_proof_started AND run.finished_at=s.last_finished) THEN
    RAISE EXCEPTION 'bg1 recovery fresh full proof required' USING ERRCODE='P7902'; END IF;
  RETURN s.incident_generation;
END $function$
;
UPDATE official_v3_guard_private.bg1_dev_at_ch_autorenew_v12
 SET catalog=official_v3_guard_private.catalog_status_v1() WHERE singleton;
SELECT official_v3_guard_private.assert_catalog_v1();
DO $negative$
BEGIN
 IF (SELECT count(*) FROM official_v3_guard_private.bg1_dev_at_ch_autorenew_v12)<>1
 OR (SELECT catalog IS DISTINCT FROM official_v3_guard_private.catalog_status_v1()
       FROM official_v3_guard_private.bg1_dev_at_ch_autorenew_v12 WHERE singleton)
 OR (SELECT count(*) FROM official_v3_at_private.ch_visa_facts_v4)<>1
 OR public.jetnity_at_ch_visa_v4('IN')->>'status'<>'unavailable'
 OR public.jetnity_at_ch_visa_v4('CH')->>'status'<>'unavailable'
 OR (SELECT count(*) FROM official_v3_at_private.whole_originals_v2
     WHERE disposition='RESEARCH_ONLY' AND NOT importable AND accepted_fact_count=0)<>3
 THEN RAISE EXCEPTION 'DEV_AT_V12_NEGATIVE_PREPROOF_FAIL' USING ERRCODE='P7905'; END IF;
END $negative$;
SELECT jsonb_build_object(
 'verdict','DEV_AT_V12_NATURAL_RENEWAL_HELD_UNTIL_NEW_BG1_PROOF_PASS',
 'source_batch',136,'source_outcome_remains','changed',
 'new_BG1_generation_needed',(SELECT required_generation FROM official_v3_guard_private.bg1_dev_at_ch_autorenew_v12 WHERE singleton),
 'source_originals_preserved',3,'previous_fact_count',1,
 'no_manual_cron',true,'no_owner_action',true,'no_production_write',true,
 'transaction_fate','ROLLBACK') AS result;
ROLLBACK;
