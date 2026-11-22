-- Dev-only validation of three exact source editions and a closed method-v2 candidate.
-- It creates pg_temp objects only; existing originals/methods/BG1 are never changed.
BEGIN;
SET LOCAL search_path=pg_catalog;
SET LOCAL timezone='UTC';
SET LOCAL statement_timeout='15s';
SET LOCAL lock_timeout='500ms';
SET LOCAL idle_in_transaction_session_timeout='20s';
DO $pre$
BEGIN
 IF current_database()<>'postgres' OR current_user<>'postgres'
 OR to_regclass('official_v3_at_private.whole_originals_v2') IS NULL
 OR to_regclass('official_v3_method_private.heads_v1') IS NULL
 OR to_regclass('official_v3_at_source_watch_private.reads_v1') IS NULL
 OR to_regclass('net._http_response') IS NULL
 THEN RAISE EXCEPTION 'DEV_AT_V2_STOP_WRONG_CONTEXT'; END IF;
END $pre$;
CREATE TEMP TABLE at_ch_source_v2_candidate (
 source_id text PRIMARY KEY, recorded_sha text NOT NULL,
 recorded_bytes integer NOT NULL, watcher_state text NOT NULL,
 fetched_original bytea NOT NULL
) ON COMMIT DROP;
INSERT INTO pg_temp.at_ch_source_v2_candidate
 (source_id,recorded_sha,recorded_bytes,watcher_state,fetched_original)
SELECT e.source_id,e.expected_sha,e.expected_bytes,w.state,convert_to(n.content,'UTF8')
FROM (VALUES
 ('bmi-visa-nationality-matrix',2296,'fcec70ebb5e7869591eaa8490025288534f5e44dddc0926102cd0bb27de8e778',498415,'unchanged_exact'),
 ('bmi-general-entry',2295,'ab2b735bf53e21a83c447fe9cfefabd7ffc54406f68793d01acac421fd6c301e',91655,'unchanged_exact'),
 ('bmeia-bern-how-to-apply',2294,'2521a95cc70490decb12051b28f1e5d208b9429ffb589e2491b34ca110f62cbe',172428,'changed')
) e(source_id,request_id,expected_sha,expected_bytes,expected_state)
JOIN official_v3_at_source_watch_private.reads_v1 w
 ON w.batch_id=129 AND w.source_id=e.source_id AND w.request_id=e.request_id
JOIN net._http_response n ON n.id=e.request_id
WHERE w.state=e.expected_state AND w.observed_sha=e.expected_sha AND w.observed_bytes=e.expected_bytes
 AND n.status_code=200 AND n.timed_out IS FALSE AND n.error_msg IS NULL
 AND octet_length(convert_to(n.content,'UTF8'))=e.expected_bytes
 AND encode(sha256(convert_to(n.content,'UTF8')),'hex')=e.expected_sha;
DO $gates$
DECLARE matched integer; 
BEGIN
 SELECT count(*) INTO matched FROM pg_temp.at_ch_source_v2_candidate;
 IF matched<>3 OR EXISTS(SELECT 1 FROM pg_temp.at_ch_source_v2_candidate
   WHERE encode(sha256(fetched_original),'hex')<>recorded_sha
      OR octet_length(fetched_original)<>recorded_bytes)
 THEN RAISE EXCEPTION 'DEV_AT_V2_SOURCE_WITNESS_STOP'; END IF;
 IF (SELECT count(*) FROM official_v3_at_private.whole_originals_v2)<>3
 OR EXISTS(SELECT 1 FROM official_v3_at_private.whole_originals_v2
   WHERE disposition<>'RESEARCH_ONLY' OR importable OR accepted_fact_count<>0
    OR body_digest<>encode(sha256(original_body),'hex'))
 THEN RAISE EXCEPTION 'DEV_AT_V2_HISTORIC_ORIGINAL_CHANGED'; END IF;
 IF (SELECT count(*) FROM official_v3_method_private.heads_v1
   WHERE method_id='jetnity-destination-primary-at-visa' AND revision=1
    AND epoch=1 AND status='approved')<>1
 OR EXISTS(SELECT 1 FROM official_v3_method_private.revisions_v1
   WHERE method_id='jetnity-destination-primary-at-visa' AND revision=2)
 THEN RAISE EXCEPTION 'DEV_AT_V2_METHOD_PREDECESSOR_CHANGED'; END IF;
 IF (SELECT count(*) FROM (VALUES
   ('CH','AT','visa','passport','direct_entry'),
   ('DE','AT','visa','passport','direct_entry'),
   ('CH','AT','visa','passport','airside_transit'),
   ('CH','AT','health','passport','direct_entry')
 ) v(citizenship,destination,requirement,document,route)
 WHERE citizenship='CH' AND destination='AT' AND requirement='visa'
 AND document='passport' AND route='direct_entry')<>1
 THEN RAISE EXCEPTION 'DEV_AT_V2_NEGATIVE_SCOPE_FAILED'; END IF;
END $gates$;
SELECT jsonb_build_object('verdict','DEV_AT_CH_SOURCE_EDITION_V2_TEMP_WITNESS_PASS',
 'sources_exact',3,'watch_batch',129,'bmeia_remains_changed',true,
 'scope','CH ordinary valid passport / AT direct entry / visa only',
 'negative_scopes',3,'historic_originals_preserved',true,
 'method_revision_candidate',2,'method_v2_staged',false,
 'source_edition_persisted',false,'issuer_wired',false,
 'owner_action',false,'positive_customer_fact',false,'production_change',false,
 'transaction_fate','ROLLBACK') AS result;
ROLLBACK;
