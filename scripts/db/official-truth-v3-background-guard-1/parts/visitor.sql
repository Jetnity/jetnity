-- One fixed current snapshot, reached only through the original reader API,
-- native transaction and private MA1 receipt. It creates no state or authority.
CREATE FUNCTION official_v3_guard_private.ch_de_snapshot_v1(b jsonb,epoch_value integer,deadline timestamptz,legal_day text) RETURNS jsonb
LANGUAGE plpgsql VOLATILE SECURITY DEFINER SET search_path=pg_catalog AS $$
DECLARE h official_v3_result_private.heads_v1%ROWTYPE; p official_v3_result_private.projections_v1%ROWTYPE;
  v official_v3_result_private.versions_v1%ROWTYPE; q official_v3_result_private.qualifications_v1%ROWTYPE;
  original_row official_v3_result_private.originals_v1%ROWTYPE;
  projection_value jsonb; method_value jsonb; result_value jsonb; conflict_value jsonb; original_value jsonb; ev jsonb;
  cap timestamptz; instant timestamptz; reason_value text;
BEGIN
  IF b->>'dataMode' IS DISTINCT FROM 'official_projection' OR b->>'methodId' IS DISTINCT FROM 'jetnity-destination-primary-ch-de-visa'
    OR b->'revision' IS DISTINCT FROM '1'::jsonb OR b->>'contextKey' IS DISTINCT FROM 'official-truth-context:v3:bfce3bc64dbd7c670441e05033c31f339e03a2c488ab54937320508333c252c2'
    OR b->>'methodDigest' IS DISTINCT FROM '44ce02752da05796bef98c55b5099b81f915fe6b0975472e163721a06793bdb3'
    OR b->>'packageDigest' IS DISTINCT FROM '0beb25db2e1f6e4c2c96d61ded30b59a8e06a32ed94498903fbeecc3b6f267e9'
    OR session_user<>'ot_v3_result_reader' THEN RAISE EXCEPTION 'bg1 selected visitor snapshot only' USING ERRCODE='42501'; END IF;
  PERFORM official_v3_result_private.fence_v1(b,epoch_value,deadline,legal_day);
  cap:=least(deadline,official_v3_guard_private.open_until_v1(),(b->>'activeUntilExclusive')::timestamptz);
  method_value:=official_v3_guard_private.current_method_v1();
  IF method_value IS NULL OR method_value->>'status'<>'approved' OR (method_value->>'epoch')::integer<>epoch_value THEN
    RAISE EXCEPTION 'bg1 selected method changed' USING ERRCODE='P7902'; END IF;
  IF method_value->>'approvalUntil' IS NOT NULL THEN cap:=least(cap,(method_value->>'approvalUntil')::timestamptz); END IF;
  instant:=clock_timestamp();
  cap:=least(cap,((instant AT TIME ZONE (b->>'legalTimeZone'))::date+1)::timestamp AT TIME ZONE (b->>'legalTimeZone'));
  SELECT * INTO STRICT h FROM official_v3_result_private.heads_v1 WHERE singleton FOR SHARE;
  IF h.context_key IS DISTINCT FROM b->>'contextKey' THEN RAISE EXCEPTION 'bg1 selected coverage changed' USING ERRCODE='P7905'; END IF;
  IF h.sticky_decision_ref IS NOT NULL OR h.suppression<>'null'::jsonb THEN
    SELECT d.record INTO conflict_value FROM official_v3_result_private.decisions_v1 d
      WHERE d.reference=COALESCE(h.sticky_decision_ref,h.suppression->>'decisionRef');
    reason_value:=CASE WHEN h.suppression->>'reason'='primary_unclear' OR conflict_value->>'conclusion'='primary_unclear' THEN 'primary_unclear'
      WHEN h.suppression->>'reason' IN ('known_conflict','comparable_conflict') OR conflict_value->>'conclusion'='comparable_conflict' THEN 'comparable_conflict' END;
    IF reason_value IS NOT NULL AND conflict_value IS NOT NULL THEN
      result_value:=jsonb_build_object('status','conflict','decisionRef',conflict_value->'reference','reason',reason_value);
    ELSE result_value:=jsonb_build_object('status','unavailable'); END IF;
  ELSIF NOT h.coverage THEN result_value:=jsonb_build_object('status','missing');
  ELSE
    projection_value:=official_v3_result_private.current_projection_v1(b,legal_day);
    IF projection_value IS NULL THEN result_value:=jsonb_build_object('status','missing');
    ELSE
      SELECT * INTO STRICT p FROM official_v3_result_private.projections_v1 WHERE reference=h.projection_ref;
      SELECT * INTO STRICT v FROM official_v3_result_private.versions_v1 WHERE reference=h.version_ref;
      SELECT * INTO STRICT q FROM official_v3_result_private.qualifications_v1 WHERE reference=p.verification_ref AND kind='verification';
      IF p.record IS DISTINCT FROM projection_value OR p.verification_ref<>v.verification_ref
        OR projection_value->'rule' IS DISTINCT FROM v.prepared->'version'
        OR v.prepared->'decision' IS DISTINCT FROM q.record->'decision' OR q.decision_ref IS DISTINCT FROM h.decision_ref
        OR q.record#>'{request,context}' IS DISTINCT FROM b->'context'
        OR q.record#>'{request,method}' IS DISTINCT FROM jsonb_build_object('methodId',b->'methodId','revision',b->'revision')
        OR q.record#>>'{decision,conclusion}' IS DISTINCT FROM 'clear_primary' THEN
        RAISE EXCEPTION 'bg1 accepted snapshot links' USING ERRCODE='P7905'; END IF;
      PERFORM official_v3_result_private.fence_v1(b,epoch_value,deadline,legal_day,q.record);
      cap:=least(cap,(projection_value->>'expiresAt')::timestamptz,(projection_value->>'sourceFreshUntil')::timestamptz,
        q.valid_until,(q.record->>'validUntilExclusive')::timestamptz);
      IF jsonb_array_length(q.record->'originals') NOT BETWEEN 1 AND 8 THEN RAISE EXCEPTION 'bg1 finite source snapshot' USING ERRCODE='P7905'; END IF;
      FOR original_value IN SELECT value FROM jsonb_array_elements(q.record->'originals') LOOP
        ev:=CASE WHEN original_value->'observation'='null'::jsonb THEN original_value#>'{ambiguity,evidence}' ELSE original_value#>'{observation,evidence}' END;
        SELECT * INTO STRICT original_row FROM official_v3_result_private.originals_v1 WHERE version_id=ev->>'versionId';
        IF original_row.evidence IS DISTINCT FROM ev OR original_row.raw_digest IS DISTINCT FROM original_value->>'rawDigest'
          OR NOT q.original_ids ? original_row.version_id
          OR NOT EXISTS(SELECT 1 FROM jsonb_array_elements(b->'sources') source_row WHERE source_row.value->'source'=ev->'source') THEN
          RAISE EXCEPTION 'bg1 exact original snapshot link' USING ERRCODE='P7905'; END IF;
        cap:=least(cap,(ev->>'retrievedAt')::timestamptz+make_interval(secs=>(b->>'sourceMaxAgeMilliseconds')::integer/1000.0));
      END LOOP;
      result_value:=jsonb_build_object('status','accepted','projection',projection_value);
    END IF;
  END IF;
  PERFORM official_v3_guard_private.require_open_v1();
  PERFORM official_v3_result_private.fence_v1(b,epoch_value,cap,legal_day);
  instant:=clock_timestamp();
  IF instant>=cap THEN RAISE EXCEPTION 'bg1 snapshot horizon ended' USING ERRCODE='P7902'; END IF;
  RETURN jsonb_build_object('status','snapshot','value',result_value||jsonb_build_object('schema',1,
    'observedAt',to_char(instant AT TIME ZONE 'UTC','YYYY-MM-DD"T"HH24:MI:SS.MS"Z"'),
    'validUntil',to_char(cap AT TIME ZONE 'UTC','YYYY-MM-DD"T"HH24:MI:SS.MS"Z"')));
END $$;
