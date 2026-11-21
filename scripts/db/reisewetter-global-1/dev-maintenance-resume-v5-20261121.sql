-- DEV ONLY yfvbxvijcorffwxbxahl: one-shot postgres acknowledgement of Incident14.
-- Requires the separately installed immutable v5 and a new real scheduled full proof.
-- No Owner/AAL2/JWT claims. Nothing here changes proof timestamps, audit runs or expiry.
BEGIN;
SET LOCAL search_path=pg_catalog;
SET LOCAL statement_timeout='30s';
SET LOCAL lock_timeout='3s';
SET LOCAL timezone='UTC';
DO $maintenance_resume$
DECLARE s official_v3_guard_private.state_v1%ROWTYPE;
 baseline official_v3_guard_private.bg1_dev_maintenance_baseline_v5%ROWTYPE;
 method_value jsonb; instant timestamptz; changed integer;
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

  PERFORM official_v3_guard_private.assert_catalog_v1();
  PERFORM official_v3_guard_private.check_control_v1();
  SELECT * INTO STRICT s FROM official_v3_guard_private.state_v1 WHERE singleton FOR UPDATE;
  SELECT * INTO STRICT baseline FROM official_v3_guard_private.bg1_dev_maintenance_baseline_v5 WHERE singleton;
  instant:=clock_timestamp();
  IF s.incident_generation<>14 OR s.resumed_generation<>13 OR s.incident_at<>timestamptz '2026-11-20 22:55:01.735769+00'
    OR baseline.dev_project_ref<>'yfvbxvijcorffwxbxahl' OR baseline.incident_generation<>14 OR baseline.previous_resumed_generation<>13
    OR EXISTS(SELECT 1 FROM official_v3_guard_private.bg1_dev_maintenance_receipts_v1)
    OR s.generation<baseline.required_generation OR s.last_proof_started<baseline.proof_not_before
    OR s.last_proof_started<=s.incident_at OR s.last_finished>s.last_started+interval '30 seconds'
    OR instant<greatest(s.last_observed,s.last_finished,baseline.proof_not_before)
    OR instant>=s.valid_until OR s.valid_until<>s.last_due+interval '5 minutes 30 seconds'
    OR NOT EXISTS(SELECT 1 FROM official_v3_guard_private.runs_v1 r WHERE r.outcome='complete'
      AND r.generation=s.generation AND r.incident_generation=14 AND r.due_at=s.last_due
      AND r.started_at=s.last_started AND r.proof_started_at=s.last_proof_started AND r.finished_at=s.last_finished)
  THEN RAISE EXCEPTION 'bg1_maintenance_fresh_exact_proof_required' USING ERRCODE='P7991'; END IF;
  method_value:=official_v3_guard_private.current_method_v1();
  IF method_value->>'status' IS DISTINCT FROM 'approved' THEN
    RAISE EXCEPTION 'bg1_maintenance_approved_method_required' USING ERRCODE='P7991'; END IF;
  PERFORM official_v3_method_private.require_current_locked_v1(method_value->>'methodId',(method_value->>'revision')::integer,
    method_value->>'methodDigest',method_value->>'packageDigest',(method_value->>'epoch')::integer);
  INSERT INTO official_v3_guard_private.bg1_dev_maintenance_receipts_v1 (
    singleton,dev_project_ref,action,actor,incident_generation,previous_resumed_generation,incident_at,
    baseline_digest,method_snapshot,proof_generation,proof_due,started_at,proof_started_at,finished_at,valid_until,recorded_at)
  VALUES(true,'yfvbxvijcorffwxbxahl','dev_weather_incident14_maintenance',session_user,14,13,s.incident_at,
    encode(sha256(convert_to((to_jsonb(baseline)||jsonb_build_object('proof_not_before',extract(epoch FROM baseline.proof_not_before),'incident_at',extract(epoch FROM baseline.incident_at)))::text,'UTF8')),'hex'),method_value,
    s.generation,s.last_due,s.last_started,s.last_proof_started,s.last_finished,s.valid_until,instant);
  UPDATE official_v3_guard_private.state_v1 SET resumed_generation=14,last_observed=greatest(last_observed,instant)
    WHERE singleton AND incident_generation=14 AND resumed_generation=13;
  GET DIAGNOSTICS changed=ROW_COUNT;
  IF changed<>1 THEN RAISE EXCEPTION 'bg1_maintenance_state_race' USING ERRCODE='P7991'; END IF;
  PERFORM official_v3_guard_private.assert_catalog_v1();
  PERFORM official_v3_guard_private.check_control_v1();
  PERFORM official_v3_guard_private.require_open_v1();
  PERFORM official_v3_method_private.require_current_locked_v1(method_value->>'methodId',(method_value->>'revision')::integer,
    method_value->>'methodDigest',method_value->>'packageDigest',(method_value->>'epoch')::integer);
  IF public.official_v3_guard_alarm_status_v1()->>'status' IS DISTINCT FROM 'current' THEN
    RAISE EXCEPTION 'bg1_maintenance_not_current' USING ERRCODE='P7991'; END IF;
END $maintenance_resume$;
COMMIT;
