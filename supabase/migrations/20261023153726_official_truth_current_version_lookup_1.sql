-- LOCAL / UNAPPLIED. No hosted Development or Production apply is authorized.
-- No new table, role, writer, policy, trigger or data import.
-- Requires the existing official_original_* and official_provenance_* chain.
-- This file does not install or apply that chain.
-- Filename created by Supabase CLI 2.48.3: supabase migration new
-- official_truth_current_version_lookup_1. The timestamp was not typed by hand.
BEGIN;

-- Resolve an exact cell/fact request to the unique currently usable retained
-- receipt. The caller supplies the external lifecycle witness. This function
-- does not commit, does not decrypt originals, and does not accept a fingerprint
-- or a candidate list. Ceilings match the existing review quota, receipt maximum
-- and 8 MiB aggregate metadata bound: 1024 / 262144 / 8388608.
CREATE FUNCTION official_original_api.lookup_current_version(
 definition_id_ text,
 definition_version_ bigint,
 definition_digest_ text,
 scope_bytes bytea,
 fact_kind_ text,
 requirement_type_ text,
 sequence_ bigint,
 hash_ text
) RETURNS TABLE(
 outcome text,
 reason text,
 record_fingerprint text,
 match_count integer,
 accepted_count integer,
 rule_scope_key text,
 definition_id text,
 definition_version bigint,
 definition_digest text,
 fact_kind text,
 requirement_type text,
 read_at text,
 production_accepted_read text,
 positive_visa_cells integer
)
LANGUAGE plpgsql VOLATILE SECURITY DEFINER SET search_path='' SET timezone='UTC' SET statement_timeout='20s' AS $$
DECLARE
 scope_value jsonb;
 expected_key text;
 review_count integer;
 ev record;
 raw bytea;
 byte_len integer;
 total_bytes bigint := 0;
 receipt jsonb;
 review_packet text;
 ordered jsonb;
 terminal boolean;
 identity_match boolean;
 targets text[] := '{}';
 decoded jsonb[] := '{}';
 slot_index integer;
BEGIN
 IF definition_id_ IS NULL OR definition_version_ IS NULL OR definition_digest_ IS NULL OR scope_bytes IS NULL
 OR fact_kind_ IS NULL OR requirement_type_ IS NULL OR sequence_ IS NULL OR hash_ IS NULL THEN
  RAISE EXCEPTION 'identity_request_invalid' USING ERRCODE='22023';
 END IF;
 BEGIN
  scope_value:=official_provenance_private.decode(scope_bytes,8192);
  PERFORM official_provenance_private.typed(scope_value,'scope');
  PERFORM official_provenance_private.typed(pg_catalog.to_jsonb(fact_kind_),'fact_kind');
  PERFORM official_provenance_private.typed(pg_catalog.to_jsonb(requirement_type_),'requirement');
  PERFORM official_provenance_private.typed(pg_catalog.jsonb_build_object('id',definition_id_,'version',definition_version_,'digest',definition_digest_),'pin');
  IF scope_value->>'requirementType' IS DISTINCT FROM requirement_type_ THEN
   RAISE EXCEPTION 'identity_request_invalid' USING ERRCODE='22023';
  END IF;
  expected_key:=official_provenance_private.scope_key_v2(scope_value);
 EXCEPTION WHEN OTHERS THEN
  IF SQLSTATE IN ('57014','55P03','57000','40001','40P01','25000','25P02') THEN RAISE; END IF;
  RAISE EXCEPTION 'identity_request_invalid' USING ERRCODE='22023';
 END;
 -- Witness and SHARE lock before any accepted-row enumeration.
 PERFORM official_original_private.check_head(sequence_,hash_);
 production_accepted_read:='NOT_AUTHORIZED';
 positive_visa_cells:=0;
 rule_scope_key:=expected_key;
 definition_id:=definition_id_;
 definition_version:=definition_version_;
 definition_digest:=definition_digest_;
 fact_kind:=fact_kind_;
 requirement_type:=requirement_type_;
 read_at:=pg_catalog.to_char(pg_catalog.clock_timestamp() AT TIME ZONE 'UTC','YYYY-MM-DD"T"HH24:MI:SS.US"Z"');
 record_fingerprint:=NULL;
 match_count:=NULL;
 reason:=NULL;
 SELECT count(*) INTO accepted_count FROM official_original_private.events WHERE kind='accepted';
 SELECT count(*) INTO review_count FROM official_original_private.reviews;
 IF accepted_count>1024 OR review_count>1024 THEN
  outcome:='refused'; reason:='lookup_budget_count'; RETURN NEXT; RETURN;
 END IF;
 IF EXISTS(
  SELECT 1 FROM official_original_private.events WHERE kind='accepted' GROUP BY target HAVING count(*)<>1
 ) OR EXISTS(
  SELECT 1 FROM official_original_private.rule_bindings b
  WHERE (SELECT count(*) FROM official_original_private.events e WHERE e.kind='accepted' AND e.target=b.fingerprint)<>1
 ) OR (SELECT count(*) FROM official_original_private.rule_bindings)<>accepted_count THEN
  outcome:='refused'; reason:='accepted_corpus_incomplete'; RETURN NEXT; RETURN;
 END IF;
 -- Gap detector before any byte ceiling: a binding whose review id or fingerprint
 -- does not line up stays visible. This is not a candidate filter.
 IF EXISTS(
  SELECT 1 FROM official_original_private.rule_bindings b
  LEFT JOIN official_original_private.reviews v ON v.review_id=b.review_id AND v.fingerprint=b.fingerprint
  WHERE v.review_id IS NULL
 ) THEN
  outcome:='refused'; reason:='accepted_corpus_incomplete'; RETURN NEXT; RETURN;
 END IF;
 -- Presence and byte measurement see every accepted event. A missing receipt is a
 -- gap, not a row dropped by an inner join.
 FOR ev IN SELECT e.target FROM official_original_private.events e WHERE e.kind='accepted' ORDER BY e.sequence LOOP
  IF ev.target !~ '^ot-provenance-v1:[a-f0-9]{64}$' THEN
   outcome:='refused'; reason:='accepted_corpus_incomplete'; RETURN NEXT; RETURN;
  END IF;
  SELECT r.canonical_payload_bytes, pg_catalog.octet_length(r.canonical_payload_bytes) INTO raw, byte_len
  FROM official_original_private.events e
  LEFT JOIN official_provenance_private.receipts r ON r.record_fingerprint=e.target
  WHERE e.kind='accepted' AND e.target=ev.target;
  IF NOT FOUND OR raw IS NULL OR byte_len IS NULL THEN
   outcome:='refused'; reason:='accepted_corpus_incomplete'; RETURN NEXT; RETURN;
  END IF;
  IF byte_len>262144 THEN
   outcome:='refused'; reason:='lookup_budget_receipt'; RETURN NEXT; RETURN;
  END IF;
  total_bytes:=total_bytes+byte_len;
  IF total_bytes>8388608 THEN
   outcome:='refused'; reason:='lookup_budget_bytes'; RETURN NEXT; RETURN;
  END IF;
 END LOOP;
 match_count:=0;
 -- Review identity for every accepted receipt before provenance hashing or a
 -- cell/fact filter. A damaged packet key or ordered support refuses here, so
 -- the closure walk does not run on an already incomplete corpus. Originals
 -- stay encrypted. A corpus that passes this pass still gets verify_retained_v2
 -- on every accepted receipt before any match is counted.
 FOR ev IN SELECT e.target FROM official_original_private.events e WHERE e.kind='accepted' ORDER BY e.sequence LOOP
  BEGIN
   SELECT r.canonical_payload_bytes INTO STRICT raw FROM official_provenance_private.receipts r WHERE r.record_fingerprint=ev.target;
   receipt:=official_provenance_private.decode(raw,262144);
   PERFORM official_provenance_private.typed(receipt,'receipt');
   IF receipt#>>'{globalCell,ruleScopeKey}' IS DISTINCT FROM official_provenance_private.scope_key_v2(receipt#>'{globalCell,scope}')
   OR receipt#>>'{candidate,requirementType}' IS DISTINCT FROM receipt#>>'{globalCell,scope,requirementType}'
   OR receipt#>>'{candidate,factKind}' IS NULL THEN
    outcome:='refused'; reason:='accepted_corpus_unclassifiable'; record_fingerprint:=NULL; match_count:=NULL; RETURN NEXT; RETURN;
   END IF;
   SELECT v.packet_key, v.ordered_supports INTO STRICT review_packet, ordered
   FROM official_original_private.rule_bindings b
   JOIN official_original_private.reviews v ON v.review_id=b.review_id AND v.fingerprint=b.fingerprint
   WHERE b.fingerprint=ev.target;
   IF review_packet IS DISTINCT FROM receipt#>>'{proof,reviewPacketKey}'
   OR pg_catalog.jsonb_typeof(ordered) IS DISTINCT FROM 'array'
   OR pg_catalog.jsonb_array_length(ordered) IS DISTINCT FROM pg_catalog.jsonb_array_length(receipt->'supports')
   OR (SELECT count(*) FROM official_original_private.supports s WHERE s.fingerprint=ev.target) IS DISTINCT FROM pg_catalog.jsonb_array_length(ordered)
   OR EXISTS (
    SELECT 1 FROM pg_catalog.generate_series(0, pg_catalog.jsonb_array_length(ordered)-1) AS slot(position)
    WHERE (ordered->slot.position) IS DISTINCT FROM (
     SELECT pg_catalog.jsonb_build_object('versionId', o.evidence_version, 'rawDigest', o.raw_digest)
     FROM official_original_private.supports s
     JOIN official_original_private.originals o ON o.original_pin=s.original_pin AND o.evidence_version=s.evidence_version
     WHERE s.fingerprint=ev.target AND s.position=slot.position
    )
    OR (ordered->slot.position)->>'versionId' IS DISTINCT FROM receipt#>>ARRAY['supports', slot.position::text, 'versionId']
   ) THEN
    outcome:='refused'; reason:='accepted_corpus_incomplete'; record_fingerprint:=NULL; match_count:=NULL; RETURN NEXT; RETURN;
   END IF;
   targets:=targets||ev.target;
   decoded:=decoded||receipt;
  EXCEPTION WHEN OTHERS THEN
   IF SQLSTATE IN ('57014','55P03','57000','40001','40P01','25000','25P02') THEN RAISE; END IF;
   outcome:='refused'; reason:='accepted_corpus_unclassifiable'; record_fingerprint:=NULL; match_count:=NULL; RETURN NEXT; RETURN;
  END;
 END LOOP;
 FOR slot_index IN 1..coalesce(pg_catalog.array_length(targets,1),0) LOOP
  BEGIN
   PERFORM official_provenance_private.verify_retained_v2(targets[slot_index]);
   receipt:=decoded[slot_index];
   terminal:=EXISTS(
    SELECT 1 FROM official_original_private.events t
    WHERE t.target=targets[slot_index] AND t.kind IN ('withdrawn','conflicted','superseded','expired')
   );
   identity_match:=receipt#>>'{globalCell,definition,id}'=definition_id_
    AND (receipt#>>'{globalCell,definition,version}')::bigint=definition_version_
    AND receipt#>>'{globalCell,definition,digest}'=definition_digest_
    AND receipt#>'{globalCell,scope}'=scope_value
    AND receipt#>>'{globalCell,ruleScopeKey}'=expected_key
    AND receipt#>>'{candidate,factKind}'=fact_kind_
    AND receipt#>>'{candidate,requirementType}'=requirement_type_;
   IF identity_match AND NOT terminal THEN
    match_count:=match_count+1;
    IF match_count=1 THEN record_fingerprint:=targets[slot_index]; ELSE record_fingerprint:=NULL; END IF;
   END IF;
  EXCEPTION WHEN OTHERS THEN
   IF SQLSTATE IN ('57014','55P03','57000','40001','40P01','25000','25P02') THEN RAISE; END IF;
   outcome:='refused'; reason:='accepted_corpus_unclassifiable'; record_fingerprint:=NULL; match_count:=NULL; RETURN NEXT; RETURN;
  END;
 END LOOP;
 IF match_count=0 THEN
  outcome:='no_match'; reason:=NULL; record_fingerprint:=NULL;
 ELSIF match_count=1 THEN
  outcome:='unique'; reason:=NULL;
 ELSE
  outcome:='ambiguous'; reason:=NULL; record_fingerprint:=NULL;
 END IF;
 RETURN NEXT;
END $$;

REVOKE ALL ON FUNCTION official_original_api.lookup_current_version(text,bigint,text,bytea,text,text,bigint,text) FROM PUBLIC;
GRANT EXECUTE ON FUNCTION official_original_api.lookup_current_version(text,bigint,text,bytea,text,text,bigint,text) TO ot_original_reader;
COMMIT;
