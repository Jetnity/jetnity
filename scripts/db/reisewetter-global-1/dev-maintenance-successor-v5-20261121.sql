-- DEV ONLY: yfvbxvijcorffwxbxahl, Incident 14. NEVER install in Production.
-- Authorised by the Owner's 21 November Dev instruction, including Dev rights.
-- Adds an honest, one-shot postgres maintenance authority; no Owner/AAL2 impersonation.
-- All immutable v4 predecessors and the installed weather/AT code remain unchanged.
-- Installation stays fail-closed; a NEW regular complete proof and the separate
-- dev-maintenance-resume-v5-20261121.sql operation are mandatory afterwards.
BEGIN;
SET LOCAL search_path=pg_catalog;
SET LOCAL statement_timeout='30s';
SET LOCAL lock_timeout='3s';
SET LOCAL timezone='UTC';

DO $maintenance_pre$
DECLARE prior official_v3_guard_private.bg1_dev_weather_acl_baseline_v4%ROWTYPE;
BEGIN

  IF session_user<>'postgres' OR current_user<>'postgres'
    OR current_database()<>'postgres' OR current_setting('server_version_num')::int/10000<>17
    OR current_setting('transaction_isolation')<>'read committed'
    OR (SELECT count(*) FROM supabase_migrations.schema_migrations WHERE
      (version='20261118011224' AND name='jetnity_global_206x50_research_scope_dev_20261118') OR
      (version='20261118023046' AND name='jetnity_global_six_source_cadence_v2_dev_20261118') OR
      (version='20261120225149' AND name='jetnity_reisewetter_dev_bg1_guarded_composition_20261120') OR
      (version='20261121012149' AND name='bg1_dev_weather_acl_v4_with_at_legal_guard_20261121'))<>4
    OR NOT pg_try_advisory_xact_lock(771106,1)
  THEN RAISE EXCEPTION 'bg1_maintenance_exact_dev_admin_required' USING ERRCODE='P7991'; END IF;

  IF to_regclass('official_v3_guard_private.bg1_dev_maintenance_baseline_v5') IS NOT NULL
    OR to_regclass('official_v3_guard_private.bg1_dev_maintenance_receipts_v1') IS NOT NULL
    OR NOT EXISTS(SELECT 1 FROM official_v3_guard_private.state_v1 WHERE singleton
      AND incident_generation=14 AND resumed_generation=13 AND generation>=1919
      AND incident_at=timestamptz '2026-11-20 22:55:01.735769+00')
    OR encode(sha256(convert_to(pg_get_functiondef('public.official_v3_guard_alarm_status_v1()'::regprocedure),'UTF8')),'hex') IS DISTINCT FROM 'f846d051bc6dc59ceb459393dc9f82d0b06efcccb77672a02f9db5091214c55a'
    OR encode(sha256(convert_to(pg_get_functiondef('public.reisewetter_reservieren_v1()'::regprocedure),'UTF8')),'hex') IS DISTINCT FROM '9c9e0dc4a1c7cf48c60b434b32eb26f2c65805f9ab95e9c0ca832d7b5e1b27be'
    OR encode(sha256(convert_to(pg_get_functiondef('official_v3_guard_private.assert_catalog_v1()'::regprocedure),'UTF8')),'hex') IS DISTINCT FROM 'd86bb2a1d409bfa672b59e474bf4cd4f00169de25778292e070fbfb233042e85'
    OR encode(sha256(convert_to(pg_get_functiondef('official_v3_guard_private.latch_incident_v1(timestamp with time zone,text)'::regprocedure),'UTF8')),'hex') IS DISTINCT FROM '0237901ef275badb4f12f6491f4f9f475177669e767001127a1de004a8d061cd'
    OR encode(sha256(convert_to(pg_get_functiondef('official_v3_guard_private.audit_v1()'::regprocedure),'UTF8')),'hex') IS DISTINCT FROM 'b6f56232b998dea7868bf9767f8e9012282a43512a1e5fd622c9824e62fd2fff'
    OR encode(sha256(convert_to(pg_get_functiondef('official_v3_guard_private.catalog_status_v1()'::regprocedure),'UTF8')),'hex') IS DISTINCT FROM '605a8527181f7535118258d80f9e2057027fcea06d4ddb4847345f57d58ae86d'
    OR encode(sha256(convert_to(pg_get_functiondef('public.official_v3_guard_resume_v1(text,text)'::regprocedure),'UTF8')),'hex') IS DISTINCT FROM '2b6410808912453f99d12b6b84ada9af3a1ecfd51343c20012074032927566f3'
    OR encode(sha256(convert_to(pg_get_functiondef('official_v3_guard_private.require_open_v1()'::regprocedure),'UTF8')),'hex') IS DISTINCT FROM '07d5471fc071f8d8b788bd6ab80fe03084d91b98de7cb9aa6d083a0e962bab79'
    OR encode(sha256(convert_to(pg_get_functiondef('official_v3_guard_private.check_control_v1()'::regprocedure),'UTF8')),'hex') IS DISTINCT FROM '8a5b56136dc5564b4d52e6e0dcb1f119f4b229cb985296044696c7463b646669'
    OR encode(sha256(convert_to(pg_get_functiondef('official_v3_guard_private.incident_snapshot_v1()'::regprocedure),'UTF8')),'hex') IS DISTINCT FROM '76d3450131fd0d5a86ce79f3502a37321ddcdac677f845f94a75f6674de50afb'
  THEN RAISE EXCEPTION 'bg1_maintenance_predecessor_changed' USING ERRCODE='P7991'; END IF;
  SELECT * INTO STRICT prior FROM official_v3_guard_private.bg1_dev_weather_acl_baseline_v4 WHERE singleton;
  IF encode(sha256(convert_to((to_jsonb(prior)||jsonb_build_object('proof_not_before',extract(epoch FROM prior.proof_not_before)))::text,'UTF8')),'hex') IS DISTINCT FROM '6246aa0f91b24f1c644a656f13ce5294ed96f9b488993ffbb438f32075cbd83f'
    OR encode(sha256(convert_to(prior.catalog::text,'UTF8')),'hex') IS DISTINCT FROM 'fdef57d57b57b0c34184752d8fe347e1d5e84d4909bf71256d64b540ba11fbf9'
    OR prior.catalog IS DISTINCT FROM official_v3_guard_private.catalog_status_v1()
  THEN RAISE EXCEPTION 'bg1_maintenance_exact_v4_required' USING ERRCODE='P7991'; END IF;
  -- No new catalog drift is accepted. This is not a second weather/AT repair.
  PERFORM official_v3_guard_private.assert_catalog_v1();
  PERFORM official_v3_guard_private.check_control_v1();
END $maintenance_pre$;

CREATE TABLE official_v3_guard_private.bg1_dev_maintenance_baseline_v5 (
 singleton boolean PRIMARY KEY DEFAULT true CHECK(singleton),
 dev_project_ref text NOT NULL CHECK(dev_project_ref='yfvbxvijcorffwxbxahl'),
 incident_generation bigint NOT NULL CHECK(incident_generation=14),
 previous_resumed_generation bigint NOT NULL CHECK(previous_resumed_generation=13),
 incident_at timestamptz NOT NULL CHECK(incident_at=timestamptz '2026-11-20 22:55:01.735769+00'),
 predecessor_catalog_digest text NOT NULL CHECK(predecessor_catalog_digest='fdef57d57b57b0c34184752d8fe347e1d5e84d4909bf71256d64b540ba11fbf9'),
 predecessor_baseline_digest text NOT NULL CHECK(predecessor_baseline_digest='6246aa0f91b24f1c644a656f13ce5294ed96f9b488993ffbb438f32075cbd83f'),
 required_generation bigint NOT NULL CHECK(required_generation>1919),
 proof_not_before timestamptz NOT NULL CHECK(isfinite(proof_not_before)),
 catalog jsonb NOT NULL
);
CREATE TABLE official_v3_guard_private.bg1_dev_maintenance_receipts_v1 (
 singleton boolean PRIMARY KEY DEFAULT true CHECK(singleton),
 dev_project_ref text NOT NULL CHECK(dev_project_ref='yfvbxvijcorffwxbxahl'),
 action text NOT NULL CHECK(action='dev_weather_incident14_maintenance'),
 actor name NOT NULL CHECK(actor='postgres'),
 incident_generation bigint NOT NULL CHECK(incident_generation=14),
 previous_resumed_generation bigint NOT NULL CHECK(previous_resumed_generation=13),
 incident_at timestamptz NOT NULL CHECK(incident_at=timestamptz '2026-11-20 22:55:01.735769+00'),
 baseline_digest text NOT NULL CHECK(baseline_digest ~ '^[a-f0-9]{64}$'),
 method_snapshot jsonb NOT NULL CHECK(jsonb_typeof(method_snapshot)='object' AND method_snapshot->>'status'='approved'),
 proof_generation bigint NOT NULL CHECK(proof_generation>1919),
 proof_due timestamptz NOT NULL CHECK(isfinite(proof_due)),
 started_at timestamptz NOT NULL CHECK(isfinite(started_at)),
 proof_started_at timestamptz NOT NULL CHECK(isfinite(proof_started_at)),
 finished_at timestamptz NOT NULL CHECK(isfinite(finished_at)),
 valid_until timestamptz NOT NULL CHECK(isfinite(valid_until)),
 recorded_at timestamptz NOT NULL CHECK(isfinite(recorded_at)),
 CHECK(proof_due=date_bin(interval '5 minutes',started_at,timestamptz '2000-01-01 00:00:00+00')),
 CHECK(started_at<=proof_started_at AND proof_started_at<=finished_at AND finished_at<=started_at+interval '30 seconds'),
 CHECK(proof_started_at>incident_at AND finished_at<=recorded_at AND recorded_at<valid_until),
 CHECK(valid_until=proof_due+interval '5 minutes 30 seconds')
);

ALTER TABLE official_v3_guard_private.bg1_dev_maintenance_baseline_v5 ENABLE ROW LEVEL SECURITY;
ALTER TABLE official_v3_guard_private.bg1_dev_maintenance_baseline_v5 FORCE ROW LEVEL SECURITY;
CREATE POLICY postgres_only ON official_v3_guard_private.bg1_dev_maintenance_baseline_v5 TO postgres USING(true) WITH CHECK(true);
CREATE TRIGGER immutable_rows BEFORE UPDATE OR DELETE ON official_v3_guard_private.bg1_dev_maintenance_baseline_v5
 FOR EACH ROW EXECUTE FUNCTION official_v3_guard_private.immutable_v1();
CREATE TRIGGER immutable_truncate BEFORE TRUNCATE ON official_v3_guard_private.bg1_dev_maintenance_baseline_v5
 FOR EACH STATEMENT EXECUTE FUNCTION official_v3_guard_private.immutable_v1();
REVOKE ALL ON official_v3_guard_private.bg1_dev_maintenance_baseline_v5 FROM PUBLIC,anon,authenticated,service_role,supabase_read_only_user,
 ot_v3_jobs_owner,ot_v3_result_owner,ot_v3_intake_owner;

ALTER TABLE official_v3_guard_private.bg1_dev_maintenance_receipts_v1 ENABLE ROW LEVEL SECURITY;
ALTER TABLE official_v3_guard_private.bg1_dev_maintenance_receipts_v1 FORCE ROW LEVEL SECURITY;
CREATE POLICY postgres_only ON official_v3_guard_private.bg1_dev_maintenance_receipts_v1 TO postgres USING(true) WITH CHECK(true);
CREATE TRIGGER immutable_rows BEFORE UPDATE OR DELETE ON official_v3_guard_private.bg1_dev_maintenance_receipts_v1
 FOR EACH ROW EXECUTE FUNCTION official_v3_guard_private.immutable_v1();
CREATE TRIGGER immutable_truncate BEFORE TRUNCATE ON official_v3_guard_private.bg1_dev_maintenance_receipts_v1
 FOR EACH STATEMENT EXECUTE FUNCTION official_v3_guard_private.immutable_v1();
REVOKE ALL ON official_v3_guard_private.bg1_dev_maintenance_receipts_v1 FROM PUBLIC,anon,authenticated,service_role,supabase_read_only_user,
 ot_v3_jobs_owner,ot_v3_result_owner,ot_v3_intake_owner;
CREATE OR REPLACE FUNCTION official_v3_guard_private.assert_catalog_v1()
 RETURNS void
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO 'pg_catalog'
AS $function$
DECLARE maintenance_v5 official_v3_guard_private.bg1_dev_maintenance_baseline_v5%ROWTYPE;
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
 OR maintenance_v5.catalog IS DISTINCT FROM official_v3_guard_private.catalog_status_v1() THEN
    RAISE EXCEPTION 'bg1 recovery protected catalog changed' USING ERRCODE='P7905'; END IF;
END $function$;
CREATE OR REPLACE FUNCTION official_v3_guard_private.require_open_v1()
 RETURNS bigint
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO 'pg_catalog'
AS $function$
DECLARE s official_v3_guard_private.state_v1%ROWTYPE; instant timestamptz;
  required_proof bigint; earliest_proof timestamptz;
BEGIN
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
  IF s.generation<required_proof OR s.last_proof_started<earliest_proof OR instant<earliest_proof
    OR NOT EXISTS(SELECT 1 FROM official_v3_guard_private.runs_v1 run WHERE run.outcome='complete' AND run.generation=s.generation
      AND run.due_at=s.last_due AND run.started_at=s.last_started AND run.proof_started_at=s.last_proof_started AND run.finished_at=s.last_finished) THEN
    RAISE EXCEPTION 'bg1 recovery fresh full proof required' USING ERRCODE='P7902'; END IF;
  RETURN s.incident_generation;
END $function$;
CREATE OR REPLACE FUNCTION public.official_v3_guard_alarm_status_v1()
 RETURNS jsonb
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO 'pg_catalog'
AS $function$
DECLARE required_proof bigint; earliest_proof timestamptz; current_state official_v3_guard_private.state_v1%ROWTYPE;
  unavailable_value jsonb:=jsonb_build_object('schema',1,'status','unavailable');
BEGIN
  IF official_v3_guard_private.alarm_status_v1() IS DISTINCT FROM jsonb_build_object('schema',1,'status','current') THEN RETURN unavailable_value; END IF;
  SELECT greatest(renewal.required_generation,at_baseline.required_generation,admin.required_generation,a.required_generation,k.required_generation,f.required_generation,c.required_generation,q.required_generation,g.required_generation,r.required_generation,b.required_generation),greatest(renewal.proof_not_before,at_baseline.proof_not_before,admin.proof_not_before,a.proof_not_before,k.proof_not_before,f.proof_not_before,c.proof_not_before,q.proof_not_before,g.proof_not_before,r.proof_not_before,b.proof_not_before)
    INTO STRICT required_proof,earliest_proof FROM official_v3_guard_private.source_renewal_baseline_v1 renewal CROSS JOIN official_v3_guard_private.at_hrs2_baseline_v1 at_baseline CROSS JOIN official_v3_guard_private.admin_runtime_baseline_v1 admin CROSS JOIN official_v3_guard_private.cycle4_attempt2_baseline_v1 a CROSS JOIN official_v3_guard_private.cycle4_recovery_baseline_v1 k CROSS JOIN official_v3_guard_private.refresh_retirement_baseline_v1 f CROSS JOIN official_v3_guard_private.customer_information_baseline_v1 c
      CROSS JOIN official_v3_guard_private.rolling_quota_baseline_v1 q
      CROSS JOIN official_v3_guard_private.gap_recovery_baseline_v1 g
      CROSS JOIN official_v3_guard_private.recovery_baseline_v1 r
      CROSS JOIN official_v3_guard_private.status_baseline_v1 b WHERE renewal.singleton AND at_baseline.singleton AND admin.singleton AND a.singleton AND k.singleton AND f.singleton AND c.singleton AND q.singleton AND g.singleton AND r.singleton AND b.singleton;
  SELECT * INTO STRICT current_state FROM official_v3_guard_private.state_v1 WHERE singleton;
    SELECT greatest(v.required_generation,required_proof),greatest(v.proof_not_before,earliest_proof)
     INTO STRICT required_proof,earliest_proof FROM official_v3_guard_private.bg1_transient_baseline_v3 v WHERE singleton;
 SELECT greatest(required_proof,v.required_generation),greatest(earliest_proof,v.proof_not_before)
 INTO STRICT required_proof,earliest_proof FROM official_v3_guard_private.bg1_dev_weather_acl_baseline_v4 v WHERE singleton;
 SELECT greatest(required_proof,v.required_generation),greatest(earliest_proof,v.proof_not_before)
 INTO STRICT required_proof,earliest_proof FROM official_v3_guard_private.bg1_dev_maintenance_baseline_v5 v WHERE singleton;
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
END $function$;
CREATE OR REPLACE FUNCTION official_v3_guard_private.check_control_v1()
 RETURNS void
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO 'pg_catalog'
AS $function$
DECLARE s official_v3_guard_private.state_v1%ROWTYPE; r record; g bigint:=0; previous_time timestamptz;
 maintenance official_v3_guard_private.bg1_dev_maintenance_receipts_v1%ROWTYPE;
 baseline official_v3_guard_private.bg1_dev_maintenance_baseline_v5%ROWTYPE;
 maintenance_valid boolean:=false;
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

  -- A historical maintenance receipt remains required after later Owner resumes.
  -- Freshness is evaluated at its actual recorded_at, never against today's clock.
  SELECT * INTO maintenance FROM official_v3_guard_private.bg1_dev_maintenance_receipts_v1 WHERE singleton;
  IF FOUND THEN
    SELECT * INTO STRICT baseline FROM official_v3_guard_private.bg1_dev_maintenance_baseline_v5 WHERE singleton;
    IF maintenance.dev_project_ref IS DISTINCT FROM baseline.dev_project_ref
      OR maintenance.action<>'dev_weather_incident14_maintenance' OR maintenance.actor<>'postgres'
      OR maintenance.incident_generation<>14 OR maintenance.previous_resumed_generation<>13
      OR maintenance.incident_at IS DISTINCT FROM baseline.incident_at
      OR maintenance.incident_generation IS DISTINCT FROM baseline.incident_generation
      OR maintenance.previous_resumed_generation IS DISTINCT FROM baseline.previous_resumed_generation
      OR maintenance.baseline_digest IS DISTINCT FROM encode(sha256(convert_to((to_jsonb(baseline)||jsonb_build_object('proof_not_before',extract(epoch FROM baseline.proof_not_before),'incident_at',extract(epoch FROM baseline.incident_at)))::text,'UTF8')),'hex')
      OR maintenance.method_snapshot->>'status' IS DISTINCT FROM 'approved'
      OR maintenance.proof_generation<baseline.required_generation
      OR maintenance.proof_started_at<baseline.proof_not_before
      OR maintenance.proof_started_at<=maintenance.incident_at
      OR NOT isfinite(maintenance.recorded_at) OR maintenance.finished_at>maintenance.recorded_at OR maintenance.recorded_at>=maintenance.valid_until
      OR maintenance.valid_until<>maintenance.proof_due+interval '5 minutes 30 seconds'
      OR s.resumed_generation<maintenance.incident_generation OR s.generation<maintenance.proof_generation
      OR NOT EXISTS(SELECT 1 FROM official_v3_guard_private.incidents_v1 i WHERE i.generation=14
        AND i.detected_at=maintenance.incident_at AND i.reason='refused' AND i.baseline_generation=1918)
      OR NOT EXISTS(SELECT 1 FROM official_v3_guard_private.owner_operations_v1 op WHERE op.action='resume' AND (op.receipt->>'generation')::bigint=13)
      OR NOT EXISTS(SELECT 1 FROM official_v3_guard_private.runs_v1 proof WHERE proof.outcome='complete'
        AND proof.generation=maintenance.proof_generation AND proof.incident_generation=14
        AND proof.due_at=maintenance.proof_due AND proof.started_at=maintenance.started_at
        AND proof.proof_started_at=maintenance.proof_started_at AND proof.finished_at=maintenance.finished_at)
    THEN RAISE EXCEPTION 'bg1 dev maintenance history' USING ERRCODE='P7905'; END IF;
    maintenance_valid:=true;
  END IF;
  IF s.resumed_generation>=14 AND NOT maintenance_valid
    AND NOT EXISTS(SELECT 1 FROM official_v3_guard_private.owner_operations_v1 op
      WHERE op.action='resume' AND (op.receipt->>'generation')::bigint=14) THEN
    RAISE EXCEPTION 'bg1 dev maintenance authority missing' USING ERRCODE='P7905'; END IF;

  IF g<>s.generation OR (g>0 AND NOT EXISTS(SELECT 1 FROM official_v3_guard_private.runs_v1 proof
    WHERE proof.outcome='complete' AND proof.generation=s.generation AND proof.due_at=s.last_due
      AND proof.started_at=s.last_started AND proof.proof_started_at=s.last_proof_started AND proof.finished_at=s.last_finished))
    OR (s.resumed_generation>0 AND NOT EXISTS(SELECT 1 FROM official_v3_guard_private.owner_operations_v1 op
      WHERE op.action='resume' AND (op.receipt->>'generation')::bigint=s.resumed_generation)
      AND NOT (s.resumed_generation=14 AND maintenance_valid)) THEN
    RAISE EXCEPTION 'bg1 proof or resume head' USING ERRCODE='P7905'; END IF;
END $function$;

-- No concurrent DDL may be blessed by taking a fresh broad catalog snapshot.
-- Compare every old entry and admit new entries only for the two locked tables
-- and their exact supporting objects, never for a whole schema or an ACL role.
DO $maintenance_capture$
DECLARE old_catalog jsonb; actual jsonb; expected_functions jsonb; allowed_keys text[]; entry record;
BEGIN
  SELECT catalog INTO STRICT old_catalog FROM official_v3_guard_private.bg1_dev_weather_acl_baseline_v4 WHERE singleton;
  actual:=official_v3_guard_private.catalog_status_v1();
  expected_functions:=jsonb_build_object('function:'||'official_v3_guard_private.assert_catalog_v1()'::regprocedure::oid,'bdeadbdc9dee963e9819f1a061419dc22b305ffb9a591ff7ee773740a5b2709d','function:'||'official_v3_guard_private.require_open_v1()'::regprocedure::oid,'04c396ad205b7e4c40bcfcf58fe6bc2dba29ce5bf26211ff58413eced0020dbb','function:'||'public.official_v3_guard_alarm_status_v1()'::regprocedure::oid,'dcb3e8078f77d46b4cf99baf418d3d5c2009997234c72a5a11d383f5fdff8e4c','function:'||'official_v3_guard_private.check_control_v1()'::regprocedure::oid,'f1d8fdf3e64e88b2fd31dc72afff7ad035c2865056db97cebde1dc0e0d981f24');
  FOR entry IN SELECT * FROM jsonb_each(old_catalog) LOOP
    IF expected_functions ? entry.key THEN
      IF (actual->entry.key)-'definition' IS DISTINCT FROM entry.value-'definition'
        OR actual->entry.key->>'definition' IS DISTINCT FROM expected_functions->>entry.key THEN
        RAISE EXCEPTION 'bg1_maintenance_unexpected_function_delta' USING ERRCODE='P7991'; END IF;
    ELSIF actual->entry.key IS DISTINCT FROM entry.value THEN
      RAISE EXCEPTION 'bg1_maintenance_unexpected_old_catalog_delta' USING ERRCODE='P7991';
    END IF;
  END LOOP;
  IF EXISTS(SELECT 1 FROM jsonb_object_keys(expected_functions) k WHERE NOT old_catalog ? k) THEN
    RAISE EXCEPTION 'bg1_maintenance_function_predecessor_missing' USING ERRCODE='P7991'; END IF;
  WITH new_tables AS (
    SELECT c.oid,c.reltoastrelid FROM pg_class c
    WHERE c.oid IN ('official_v3_guard_private.bg1_dev_maintenance_baseline_v5'::regclass,'official_v3_guard_private.bg1_dev_maintenance_receipts_v1'::regclass)
  ), new_classes AS (
    SELECT oid FROM new_tables UNION SELECT reltoastrelid FROM new_tables WHERE reltoastrelid<>0
    UNION SELECT i.indexrelid FROM pg_index i WHERE i.indrelid IN
      (SELECT oid FROM new_tables UNION SELECT reltoastrelid FROM new_tables WHERE reltoastrelid<>0)
  ), new_types AS (
    SELECT t.oid FROM pg_type t WHERE t.typrelid IN (SELECT oid FROM new_classes)
    UNION SELECT t.typarray FROM pg_type t WHERE t.typrelid IN (SELECT oid FROM new_classes) AND t.typarray<>0
  ), objects(classid,objid) AS (
    SELECT 'pg_class'::regclass::oid,oid FROM new_classes
    UNION SELECT 'pg_type'::regclass,oid FROM new_types
    UNION SELECT 'pg_constraint'::regclass,c.oid FROM pg_constraint c WHERE c.conrelid IN (SELECT oid FROM new_tables)
    UNION SELECT 'pg_trigger'::regclass,t.oid FROM pg_trigger t WHERE t.tgrelid IN (SELECT oid FROM new_tables)
    UNION SELECT 'pg_policy'::regclass,p.oid FROM pg_policy p WHERE p.polrelid IN (SELECT oid FROM new_tables)
    UNION SELECT 'pg_attrdef'::regclass,a.oid FROM pg_attrdef a WHERE a.adrelid IN (SELECT oid FROM new_tables)
  ), allowed(key) AS (
    SELECT 'relation:'||oid FROM new_classes
    UNION ALL SELECT 'attribute:'||a.attrelid||':'||a.attnum FROM pg_attribute a WHERE a.attrelid IN (SELECT oid FROM new_classes)
    UNION ALL SELECT 'type:'||oid FROM new_types
    UNION ALL SELECT 'constraint:'||c.oid FROM pg_constraint c WHERE c.conrelid IN (SELECT oid FROM new_tables)
    UNION ALL SELECT 'trigger:'||t.oid FROM pg_trigger t WHERE t.tgrelid IN (SELECT oid FROM new_tables)
    UNION ALL SELECT 'policy:'||p.oid FROM pg_policy p WHERE p.polrelid IN (SELECT oid FROM new_tables)
    UNION ALL SELECT 'default:'||a.oid FROM pg_attrdef a WHERE a.adrelid IN (SELECT oid FROM new_tables)
    UNION ALL SELECT 'index:'||i.indexrelid FROM pg_index i WHERE i.indexrelid IN (SELECT oid FROM new_classes)
    UNION ALL SELECT 'dependency:'||d.classid||':'||d.objid||':'||d.objsubid||':'||d.refclassid||':'||d.refobjid||':'||d.refobjsubid||':'||d.deptype::text
      FROM pg_depend d WHERE (d.classid,d.objid) IN (SELECT classid,objid FROM objects)
        OR (d.refclassid,d.refobjid) IN (SELECT classid,objid FROM objects)
    UNION ALL SELECT 'shared:'||d.dbid||':'||d.classid||':'||d.objid||':'||d.objsubid||':'||d.refclassid||':'||d.refobjid||':'||d.deptype::text
      FROM pg_shdepend d WHERE d.dbid=(SELECT oid FROM pg_database WHERE datname=current_database())
        AND (d.classid,d.objid) IN (SELECT classid,objid FROM objects)
  ) SELECT array_agg(key) INTO STRICT allowed_keys FROM allowed;
  IF EXISTS(SELECT 1 FROM jsonb_object_keys(actual) k WHERE NOT old_catalog ? k AND NOT (k=ANY(allowed_keys))) THEN
    RAISE EXCEPTION 'bg1_maintenance_unexpected_new_catalog_entry' USING ERRCODE='P7991'; END IF;

INSERT INTO official_v3_guard_private.bg1_dev_maintenance_baseline_v5 (
 singleton,dev_project_ref,incident_generation,previous_resumed_generation,incident_at,
 predecessor_catalog_digest,predecessor_baseline_digest,required_generation,proof_not_before,catalog)
SELECT true,'yfvbxvijcorffwxbxahl',14,13,timestamptz '2026-11-20 22:55:01.735769+00',
 'fdef57d57b57b0c34184752d8fe347e1d5e84d4909bf71256d64b540ba11fbf9','6246aa0f91b24f1c644a656f13ce5294ed96f9b488993ffbb438f32075cbd83f',s.generation+1,clock_timestamp(),actual
 FROM official_v3_guard_private.state_v1 s WHERE singleton;
END $maintenance_capture$;
DO $maintenance_post$
BEGIN
  PERFORM official_v3_guard_private.assert_catalog_v1();
  PERFORM official_v3_guard_private.check_control_v1();
  IF public.official_v3_guard_alarm_status_v1()->>'status' IS DISTINCT FROM 'unavailable'
    OR EXISTS(SELECT 1 FROM official_v3_guard_private.bg1_dev_maintenance_receipts_v1)
    OR NOT EXISTS(SELECT 1 FROM official_v3_guard_private.bg1_dev_maintenance_baseline_v5 b CROSS JOIN official_v3_guard_private.state_v1 s
      WHERE b.singleton AND s.singleton AND b.required_generation>s.generation AND b.proof_not_before>s.last_proof_started
        AND s.incident_generation=14 AND s.resumed_generation=13)
    OR EXISTS(SELECT 1 FROM pg_class c,LATERAL aclexplode(c.relacl) a
      WHERE c.oid IN ('official_v3_guard_private.bg1_dev_maintenance_baseline_v5'::regclass,'official_v3_guard_private.bg1_dev_maintenance_receipts_v1'::regclass)
        AND a.grantee<>'postgres'::regrole)
    OR (SELECT count(*) FROM pg_class c
      WHERE c.oid IN ('official_v3_guard_private.bg1_dev_maintenance_baseline_v5'::regclass,'official_v3_guard_private.bg1_dev_maintenance_receipts_v1'::regclass)
        AND c.relowner='postgres'::regrole AND c.relrowsecurity AND c.relforcerowsecurity)<>2
  THEN RAISE EXCEPTION 'bg1_maintenance_install_postcheck_refused' USING ERRCODE='P7991'; END IF;
END $maintenance_post$;
COMMIT;
