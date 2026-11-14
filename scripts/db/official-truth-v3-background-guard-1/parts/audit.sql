CREATE FUNCTION official_v3_guard_private.latch_incident_v1(due_value timestamptz,reason_value text) RETURNS void
LANGUAGE plpgsql VOLATILE SECURITY DEFINER SET search_path=pg_catalog AS $$
DECLARE s official_v3_guard_private.state_v1%ROWTYPE; instant timestamptz;
BEGIN
  SELECT * INTO STRICT s FROM official_v3_guard_private.state_v1 WHERE singleton FOR UPDATE;
  IF EXISTS(SELECT 1 FROM official_v3_guard_private.incidents_v1
    WHERE due_at=due_value AND reason=reason_value AND baseline_generation=s.generation) THEN RETURN; END IF;
  instant:=greatest(clock_timestamp(),s.last_observed);
  INSERT INTO official_v3_guard_private.incidents_v1 VALUES(s.incident_generation+1,due_value,reason_value,s.generation,instant);
  UPDATE official_v3_guard_private.state_v1 SET incident_generation=s.incident_generation+1,incident_at=instant WHERE singleton;
END $$;

-- The scheduled statement sets its own real 30-second statement timeout before
-- entering this function. Cancellation is caught inside a subtransaction; the
-- negative run and sticky incident are written afterwards and may COMMIT.
CREATE FUNCTION official_v3_guard_private.audit_v1() RETURNS jsonb
LANGUAGE plpgsql VOLATILE SECURITY DEFINER SET search_path=pg_catalog SET jit=off AS $$
DECLARE s official_v3_guard_private.state_v1%ROWTYPE;
  entered timestamptz:=statement_timestamp(); started timestamptz; finished timestamptz; observed timestamptz;
  due timestamptz:=date_bin(interval '5 minutes',entered,timestamptz '2000-01-01 00:00:00+00');
  deadline timestamptz:=entered+interval '30 seconds'; first_due timestamptz; old_valid_until timestamptz;
  result text:='complete'; gap boolean:=false; healthy boolean:=false; incident_recorded boolean:=false;
BEGIN
  IF session_user<>'postgres' OR current_user<>'postgres'
    OR current_setting('transaction_isolation')<>'read committed'
    OR current_setting('statement_timeout')::interval<=interval '0 seconds'
    OR current_setting('statement_timeout')::interval>interval '30 seconds' THEN
    RAISE EXCEPTION 'bg1 fixed checker context required' USING ERRCODE='P7903';
  END IF;
  -- Same first lock as every guarded write and Owner closure. No takeover of a
  -- half-finished checker; process death releases it and freshness still expires.
  PERFORM pg_advisory_xact_lock(771106,1);
  SELECT * INTO s FROM official_v3_guard_private.state_v1 WHERE singleton FOR UPDATE;
  IF NOT FOUND THEN RETURN jsonb_build_object('status','unavailable'); END IF;
  started:=clock_timestamp();
  IF entered<s.last_observed OR started<entered THEN
    PERFORM official_v3_guard_private.latch_incident_v1(due,'clock');
    SELECT * INTO STRICT s FROM official_v3_guard_private.state_v1 WHERE singleton;
    INSERT INTO official_v3_guard_private.runs_v1 VALUES(due,entered,started,clock_timestamp(),'clock',s.generation,s.incident_generation)
      ON CONFLICT(due_at) DO NOTHING;
    RETURN official_v3_guard_private.alarm_status_v1();
  END IF;
  -- An already completed due slot is immutable, including its negative result.
  -- Retrying it late cannot manufacture another incident or extend freshness.
  IF EXISTS(SELECT 1 FROM official_v3_guard_private.runs_v1 WHERE due_at=due) THEN
    RETURN official_v3_guard_private.alarm_status_v1();
  END IF;
  IF started>deadline THEN result:='expired'; END IF;
  first_due:=date_bin(interval '5 minutes',s.installed_at,timestamptz '2000-01-01 00:00:00+00')+interval '5 minutes';
  old_valid_until:=CASE WHEN s.generation>0 THEN s.valid_until ELSE first_due+interval '30 seconds' END;
  gap:=started>=old_valid_until;
  IF gap OR result<>'complete' THEN
    PERFORM official_v3_guard_private.latch_incident_v1(due,CASE WHEN gap THEN 'gap' ELSE result END);
    SELECT * INTO STRICT s FROM official_v3_guard_private.state_v1 WHERE singleton;
    incident_recorded:=true;
    started:=clock_timestamp();
  END IF;
  IF result='complete' THEN
    BEGIN
      observed:=started;
      PERFORM official_v3_guard_private.check_control_v1();
      PERFORM official_v3_guard_private.assert_catalog_v1();
      PERFORM official_v3_guard_private.check_hma_v1();
      finished:=clock_timestamp();
      IF finished<observed OR finished>deadline THEN RAISE EXCEPTION 'bg1 checker deadline' USING ERRCODE='P7904'; END IF;
      observed:=finished;
      PERFORM official_v3_guard_private.check_s1_v1();
      finished:=clock_timestamp();
      IF finished<observed OR finished>deadline THEN RAISE EXCEPTION 'bg1 checker deadline' USING ERRCODE='P7904'; END IF;
      observed:=finished;
      PERFORM official_v3_guard_private.check_jobs_v1();
      finished:=clock_timestamp();
      IF finished<observed OR finished>deadline THEN RAISE EXCEPTION 'bg1 checker deadline' USING ERRCODE='P7904'; END IF;
      observed:=finished;
      PERFORM official_v3_guard_private.check_hrs_v1();
      PERFORM official_v3_guard_private.check_certificates_v1();
      PERFORM official_v3_guard_private.check_retirements_v1();
      PERFORM official_v3_guard_private.assert_catalog_v1();
      finished:=clock_timestamp();
      IF finished<observed OR finished>deadline THEN RAISE EXCEPTION 'bg1 checker deadline' USING ERRCODE='P7904'; END IF;
      healthy:=true;
    EXCEPTION
      WHEN query_canceled OR lock_not_available THEN result:='expired';
      WHEN SQLSTATE 'P7904' THEN result:='expired';
      WHEN OTHERS THEN result:='refused';
    END;
  END IF;
  finished:=clock_timestamp();
  IF healthy AND (finished<started OR finished>deadline) THEN healthy:=false; result:='expired'; END IF;
  -- The previous lease may expire while this run waits or performs its full
  -- proof. Preserve that gap before publishing new evidence. A proof begun
  -- before this incident cannot satisfy the separate Owner resume predicate.
  IF NOT gap AND finished>=old_valid_until THEN
    gap:=true;
    PERFORM official_v3_guard_private.latch_incident_v1(due,'gap');
    SELECT * INTO STRICT s FROM official_v3_guard_private.state_v1 WHERE singleton;
    incident_recorded:=true;
  END IF;
  IF NOT healthy AND NOT incident_recorded THEN
    PERFORM official_v3_guard_private.latch_incident_v1(due,result);
    SELECT * INTO STRICT s FROM official_v3_guard_private.state_v1 WHERE singleton;
  END IF;
  IF healthy THEN
    s.generation:=s.generation+1;
    UPDATE official_v3_guard_private.state_v1 SET generation=s.generation,
      last_due=due,last_started=entered,last_proof_started=started,last_finished=finished,valid_until=due+interval '5 minutes 30 seconds',
      incident_generation=s.incident_generation,incident_at=s.incident_at,
      last_observed=greatest(last_observed,finished) WHERE singleton;
  ELSE
    UPDATE official_v3_guard_private.state_v1 SET incident_generation=s.incident_generation,incident_at=s.incident_at,
      last_observed=greatest(last_observed,finished) WHERE singleton;
  END IF;
  INSERT INTO official_v3_guard_private.runs_v1(due_at,started_at,proof_started_at,finished_at,outcome,generation,incident_generation)
  VALUES(due,entered,started,finished,result,s.generation,s.incident_generation);
  RETURN official_v3_guard_private.alarm_status_v1();
END $$;
