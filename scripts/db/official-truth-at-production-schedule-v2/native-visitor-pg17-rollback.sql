-- Native PostgreSQL 17 isolated P0 visitor proof, zero permanent mutation.
BEGIN;
SET LOCAL search_path=pg_catalog;
SET LOCAL statement_timeout='20s';
CREATE SCHEMA jetnity_at_p0_native_test;
REVOKE ALL ON SCHEMA jetnity_at_p0_native_test FROM PUBLIC,anon,authenticated,service_role;
CREATE TABLE jetnity_at_p0_native_test.methods(method_id text,epoch int);
CREATE TABLE jetnity_at_p0_native_test.guard_state(ok boolean);
INSERT INTO jetnity_at_p0_native_test.guard_state VALUES(true);
CREATE TABLE jetnity_at_p0_native_test.cron_job(jobname text,active boolean,username text);
CREATE TABLE jetnity_at_p0_native_test.watch_batches_v1(batch_id bigint generated always as identity,started_at timestamptz);
CREATE TABLE jetnity_at_p0_native_test.watch_observations_v1(batch_id bigint,source_id text,source_status text,observed_at timestamptz,body_sha text);
CREATE TABLE jetnity_at_p0_native_test.watch_requests_v1(batch_id bigint,source_id text);
CREATE TABLE jetnity_at_p0_native_test.source_pins_v1(source_id text,official_url text);
CREATE TABLE jetnity_at_p0_native_test.first_originals_v1(source_id text);
CREATE TABLE jetnity_at_p0_native_test.ch_visa_facts_v1(
version_id int,source_batch_id bigint,verified_at timestamptz,expires_at timestamptz,source_checked_at timestamptz,
citizenship_code text,destination_code text,method_id text,method_epoch int,method_revision int,
method_digest text,package_digest text,source_digest text);
CREATE FUNCTION jetnity_at_p0_native_test.guard() RETURNS jsonb LANGUAGE sql AS $a$
SELECT jsonb_build_object('status',CASE WHEN ok THEN 'current' ELSE 'unavailable' END)
FROM jetnity_at_p0_native_test.guard_state $a$;
CREATE FUNCTION jetnity_at_p0_native_test.require_method(a text,b int,c text,d text,e int) RETURNS void LANGUAGE plpgsql AS $a$
BEGIN IF NOT EXISTS(SELECT 1 FROM jetnity_at_p0_native_test.methods WHERE method_id=a and epoch=e)
THEN RAISE EXCEPTION 'MA1 shadow rejected'; END IF; END $a$;
CREATE OR REPLACE FUNCTION jetnity_at_p0_native_test.visitor_v3(p_citizenship_country_code text)
 RETURNS jsonb
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO 'pg_catalog'
AS $function$
DECLARE f record; b record; method jetnity_at_p0_native_test.methods%ROWTYPE;
 instant timestamptz; check_count integer; source_count integer;
 source_links jsonb; signed_sources text;
 unavailable jsonb:=jsonb_build_object('status','unavailable','destinationCountryCode','AT');
BEGIN
 -- Nothing else (including any other passport, destination or document) can
 -- be promoted by a generic 50-passport method approval.
 IF p_citizenship_country_code IS DISTINCT FROM 'CH'
   OR jetnity_at_p0_native_test.guard()->>'status'<>'current'
 THEN RETURN unavailable; END IF;
 -- Read the most recently AUTHORISED fact first. A newly queued
 -- network batch is not an accepted replacement until renewal commits.
 instant:=clock_timestamp();
 SELECT * INTO f FROM jetnity_at_p0_native_test.ch_visa_facts_v1
 ORDER BY version_id DESC LIMIT 1;
 IF NOT FOUND THEN RETURN unavailable; END IF;
 SELECT * INTO b FROM jetnity_at_p0_native_test.watch_batches_v1
 WHERE batch_id=f.source_batch_id;
 IF NOT FOUND OR b.started_at>instant OR b.started_at<=instant-interval '70 minutes'
 THEN RETURN unavailable; END IF;
 SELECT count(*) INTO check_count
 FROM jetnity_at_p0_native_test.watch_observations_v1
 WHERE batch_id=b.batch_id
   AND source_status IN('unchanged_exact','unchanged_asset_version_only')
   AND observed_at<=instant AND observed_at>instant-interval '70 minutes';
 SELECT count(*) INTO source_count
 FROM jetnity_at_p0_native_test.source_pins_v1;
 IF check_count<>3 OR source_count<>3
   OR (SELECT count(*) FROM jetnity_at_p0_native_test.first_originals_v1)<>3
   OR (SELECT count(*) FROM jetnity_at_p0_native_test.cron_job WHERE active AND username='postgres'
     AND jobname IN('jetnity-at-production-source-enqueue-v1',
        'jetnity-at-production-source-collect-v1',
        'jetnity-at-production-source-renew-v1'))<>3
 THEN RETURN unavailable; END IF;
 IF f.citizenship_code<>'CH' OR f.destination_code<>'AT'
  OR f.source_batch_id<>b.batch_id OR f.verified_at>instant
  OR f.source_checked_at>instant OR instant>=f.expires_at
  OR instant>=f.source_checked_at+interval '70 minutes'
  OR f.method_revision<>1
  OR f.method_digest<>'cd9b8584d08cc3bfb83f0f1a7095c1c6e011c8d25336f8767ec6678ec8bbc9e9'
  OR f.package_digest<>'55e574d7c70c20513a4ac05273c43cdd87dd854e0b403ce0c9a5ab168220ebfe'
 THEN RETURN unavailable; END IF;

 -- A queued successor does not invalidate an unexpired approved fact,
 -- but ANY observed changed/failed official source does so immediately.
 -- Collector reports a missing HTTP response as unavailable after 6 min.
 IF EXISTS(
   SELECT 1 FROM jetnity_at_p0_native_test.watch_observations_v1 o
   WHERE o.batch_id>f.source_batch_id AND o.observed_at<=instant
    AND o.source_status IN('changed','unavailable')
 ) THEN RETURN unavailable; END IF;
 -- Do not keep serving the old fact if an unfinished successor fails to
 -- collect all 3 pinned sources within the established collector deadline.
 IF EXISTS(
   SELECT 1 FROM jetnity_at_p0_native_test.watch_batches_v1 newer
   WHERE newer.batch_id>f.source_batch_id
    AND newer.started_at<=instant-interval '6 minutes'
    AND ( (SELECT count(*) FROM jetnity_at_p0_native_test.watch_requests_v1 r
            WHERE r.batch_id=newer.batch_id)<>3
       OR (SELECT count(*) FROM jetnity_at_p0_native_test.watch_observations_v1 o
            WHERE o.batch_id=newer.batch_id AND o.observed_at<=instant)<>3 )
 ) THEN RETURN unavailable; END IF;
 SELECT * INTO method FROM jetnity_at_p0_native_test.methods
 WHERE method_id=f.method_id FOR SHARE;
 IF NOT FOUND OR method.epoch<>f.method_epoch THEN RETURN unavailable; END IF;
 PERFORM jetnity_at_p0_native_test.require_method(
 f.method_id,f.method_revision,f.method_digest,f.package_digest,f.method_epoch);
 SELECT encode(sha256(convert_to(
   string_agg(source_id||':'||body_sha,'|' ORDER BY source_id COLLATE "C"),'UTF8')),'hex')
 INTO signed_sources FROM jetnity_at_p0_native_test.watch_observations_v1
 WHERE batch_id=b.batch_id;
 IF signed_sources IS DISTINCT FROM f.source_digest THEN RETURN unavailable; END IF;
 SELECT jsonb_agg(official_url ORDER BY CASE source_id
  WHEN 'bmi-general-entry' THEN 1
  WHEN 'bmi-visa-nationality-matrix' THEN 2
  WHEN 'bmeia-bern-how-to-apply' THEN 3 ELSE 4 END)
 INTO source_links FROM jetnity_at_p0_native_test.source_pins_v1;
 IF jsonb_array_length(source_links)<>3 THEN RETURN unavailable; END IF;
 RETURN jsonb_build_object(
 'status','accepted','citizenshipCountryCode','CH',
 'destinationCountryCode','AT','documentType','passport',
 'visaEffect','not_required','visaMode','visa_exempt',
 'ruleVersion',f.version_id,
 'sourceCheckedAt',to_char(f.source_checked_at AT TIME ZONE 'UTC','YYYY-MM-DD"T"HH24:MI:SS.MS"Z"'),
 'verifiedAt',to_char(f.verified_at AT TIME ZONE 'UTC','YYYY-MM-DD"T"HH24:MI:SS.MS"Z"'),
 'expiresAt',to_char(f.expires_at AT TIME ZONE 'UTC','YYYY-MM-DD"T"HH24:MI:SS.MS"Z"'),
 'sourceUrls',source_links);
EXCEPTION WHEN query_canceled OR OTHERS THEN RETURN unavailable;
END $function$;
CREATE OR REPLACE FUNCTION jetnity_at_p0_native_test.visitor_v1(p_citizenship_country_code text)
 RETURNS jsonb
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO 'pg_catalog'
AS $function$
DECLARE f record; b record; method jetnity_at_p0_native_test.methods%ROWTYPE;
 instant timestamptz; check_count integer; source_count integer;
 source_links jsonb; signed_sources text;
 unavailable jsonb:=jsonb_build_object('status','unavailable','destinationCountryCode','AT');
BEGIN
 -- Nothing else (including any other passport, destination or document) can
 -- be promoted by a generic 50-passport method approval.
 IF p_citizenship_country_code IS DISTINCT FROM 'CH'
   OR jetnity_at_p0_native_test.guard()->>'status'<>'current'
 THEN RETURN unavailable; END IF;
 SELECT * INTO b FROM jetnity_at_p0_native_test.watch_batches_v1
 ORDER BY batch_id DESC LIMIT 1;
 instant:=clock_timestamp();
 IF NOT FOUND OR b.started_at>instant OR b.started_at<=instant-interval '70 minutes'
 THEN RETURN unavailable; END IF;
 SELECT count(*) INTO check_count
 FROM jetnity_at_p0_native_test.watch_observations_v1
 WHERE batch_id=b.batch_id
   AND source_status IN('unchanged_exact','unchanged_asset_version_only')
   AND observed_at<=instant AND observed_at>instant-interval '70 minutes';
 SELECT count(*) INTO source_count
 FROM jetnity_at_p0_native_test.source_pins_v1;
 IF check_count<>3 OR source_count<>3
   OR (SELECT count(*) FROM jetnity_at_p0_native_test.first_originals_v1)<>3
   OR (SELECT count(*) FROM jetnity_at_p0_native_test.cron_job WHERE active AND username='postgres'
     AND jobname IN('jetnity-at-production-source-enqueue-v1',
        'jetnity-at-production-source-collect-v1',
        'jetnity-at-production-source-renew-v1'))<>3
 THEN RETURN unavailable; END IF;
 SELECT * INTO f FROM jetnity_at_p0_native_test.ch_visa_facts_v1
 ORDER BY version_id DESC LIMIT 1;
 IF NOT FOUND OR f.citizenship_code<>'CH' OR f.destination_code<>'AT'
  OR f.source_batch_id<>b.batch_id OR f.verified_at>instant
  OR f.source_checked_at>instant OR instant>=f.expires_at
  OR instant>=f.source_checked_at+interval '70 minutes'
  OR f.method_revision<>1
  OR f.method_digest<>'cd9b8584d08cc3bfb83f0f1a7095c1c6e011c8d25336f8767ec6678ec8bbc9e9'
  OR f.package_digest<>'55e574d7c70c20513a4ac05273c43cdd87dd854e0b403ce0c9a5ab168220ebfe'
 THEN RETURN unavailable; END IF;
 SELECT * INTO method FROM jetnity_at_p0_native_test.methods
 WHERE method_id=f.method_id FOR SHARE;
 IF NOT FOUND OR method.epoch<>f.method_epoch THEN RETURN unavailable; END IF;
 PERFORM jetnity_at_p0_native_test.require_method(
 f.method_id,f.method_revision,f.method_digest,f.package_digest,f.method_epoch);
 SELECT encode(sha256(convert_to(
   string_agg(source_id||':'||body_sha,'|' ORDER BY source_id COLLATE "C"),'UTF8')),'hex')
 INTO signed_sources FROM jetnity_at_p0_native_test.watch_observations_v1
 WHERE batch_id=b.batch_id;
 IF signed_sources IS DISTINCT FROM f.source_digest THEN RETURN unavailable; END IF;
 SELECT jsonb_agg(official_url ORDER BY CASE source_id
  WHEN 'bmi-general-entry' THEN 1
  WHEN 'bmi-visa-nationality-matrix' THEN 2
  WHEN 'bmeia-bern-how-to-apply' THEN 3 ELSE 4 END)
 INTO source_links FROM jetnity_at_p0_native_test.source_pins_v1;
 IF jsonb_array_length(source_links)<>3 THEN RETURN unavailable; END IF;
 RETURN jsonb_build_object(
 'status','accepted','citizenshipCountryCode','CH',
 'destinationCountryCode','AT','documentType','passport',
 'visaEffect','not_required','visaMode','visa_exempt',
 'ruleVersion',f.version_id,
 'sourceCheckedAt',to_char(f.source_checked_at AT TIME ZONE 'UTC','YYYY-MM-DD"T"HH24:MI:SS.MS"Z"'),
 'verifiedAt',to_char(f.verified_at AT TIME ZONE 'UTC','YYYY-MM-DD"T"HH24:MI:SS.MS"Z"'),
 'expiresAt',to_char(f.expires_at AT TIME ZONE 'UTC','YYYY-MM-DD"T"HH24:MI:SS.MS"Z"'),
 'sourceUrls',source_links);
EXCEPTION WHEN query_canceled OR OTHERS THEN RETURN unavailable;
END $function$
;
REVOKE ALL ON ALL FUNCTIONS IN SCHEMA jetnity_at_p0_native_test FROM PUBLIC,anon,authenticated,service_role;
INSERT INTO jetnity_at_p0_native_test.methods VALUES('jetnity-destination-primary-at-visa',1);
INSERT INTO jetnity_at_p0_native_test.cron_job SELECT x,true,'postgres' FROM unnest(array[
'jetnity-at-production-source-enqueue-v1','jetnity-at-production-source-collect-v1','jetnity-at-production-source-renew-v1']) x;
INSERT INTO jetnity_at_p0_native_test.source_pins_v1 VALUES('bmi-general-entry','https://www.bmi.gv.at/202/fremdenpolizei_und_grenzkontrolle/start.html'),
('bmi-visa-nationality-matrix','https://www.bmi.gv.at/202/fremdenpolizei_und_grenzkontrolle/visumpflichtige_laender/start.html'),
('bmeia-bern-how-to-apply','https://www.bmeia.gv.at/oeb-bern/reise-nach-oesterreich/einreise-und-aufenthalt/wie-stelle-ich-einen-antrag/');
INSERT INTO jetnity_at_p0_native_test.first_originals_v1 SELECT source_id FROM jetnity_at_p0_native_test.source_pins_v1;
INSERT INTO jetnity_at_p0_native_test.watch_batches_v1(started_at) VALUES(clock_timestamp()-interval '15 minutes');
INSERT INTO jetnity_at_p0_native_test.watch_observations_v1 VALUES
(1,'bmi-general-entry','unchanged_exact',clock_timestamp()-interval '14 minutes',repeat('1',64)),
(1,'bmi-visa-nationality-matrix','unchanged_exact',clock_timestamp()-interval '14 minutes',repeat('2',64)),
(1,'bmeia-bern-how-to-apply','unchanged_exact',clock_timestamp()-interval '14 minutes',repeat('3',64));
INSERT INTO jetnity_at_p0_native_test.ch_visa_facts_v1 VALUES(1,1,clock_timestamp()-interval '13 minutes',clock_timestamp()+interval '47 minutes',
clock_timestamp()-interval '14 minutes','CH','AT','jetnity-destination-primary-at-visa',1,1,
'cd9b8584d08cc3bfb83f0f1a7095c1c6e011c8d25336f8767ec6678ec8bbc9e9',
'55e574d7c70c20513a4ac05273c43cdd87dd854e0b403ce0c9a5ab168220ebfe',
(SELECT encode(sha256(convert_to(string_agg(source_id||':'||body_sha,'|' ORDER BY source_id COLLATE "C"),'UTF8')),'hex') FROM jetnity_at_p0_native_test.watch_observations_v1 WHERE batch_id=1));
INSERT INTO jetnity_at_p0_native_test.watch_batches_v1(started_at) VALUES(clock_timestamp()-interval '20 seconds');

DO $test$
DECLARE old_status text; new_status text; checked integer:=0; original_digest text;
BEGIN
 old_status:=jetnity_at_p0_native_test.visitor_v1('CH')->>'status';new_status:=jetnity_at_p0_native_test.visitor_v3('CH')->>'status';
 IF old_status<>'unavailable' OR new_status<>'accepted'
 THEN RAISE EXCEPTION 'Expected old unavailable and new accepted, got old % / new %',old_status,new_status; END IF;
 checked:=checked+1;
 IF jetnity_at_p0_native_test.visitor_v3('IN')->>'status'<>'unavailable' THEN RAISE EXCEPTION 'IN unavailable failure'; END IF;checked:=checked+1;

 INSERT INTO jetnity_at_p0_native_test.watch_observations_v1 VALUES
 (2,'bmi-general-entry','changed',clock_timestamp(),repeat('4',64));
 IF jetnity_at_p0_native_test.visitor_v3('CH')->>'status'<>'unavailable' THEN RAISE EXCEPTION 'Changed source gate failure'; END IF;checked:=checked+1;
 DELETE FROM jetnity_at_p0_native_test.watch_observations_v1 WHERE batch_id=2;

 INSERT INTO jetnity_at_p0_native_test.watch_observations_v1 VALUES
 (2,'bmi-general-entry','unavailable',clock_timestamp(),NULL);
 IF jetnity_at_p0_native_test.visitor_v3('CH')->>'status'<>'unavailable' THEN RAISE EXCEPTION 'Unavailable source gate failure'; END IF;checked:=checked+1;
 DELETE FROM jetnity_at_p0_native_test.watch_observations_v1 WHERE batch_id=2;

 UPDATE jetnity_at_p0_native_test.watch_batches_v1 SET started_at=clock_timestamp()-interval '7 minutes' WHERE batch_id=2;
 IF jetnity_at_p0_native_test.visitor_v3('CH')->>'status'<>'unavailable' THEN RAISE EXCEPTION 'Pending timeout gate failure'; END IF;checked:=checked+1;
 UPDATE jetnity_at_p0_native_test.watch_batches_v1 SET started_at=clock_timestamp()-interval '20 seconds' WHERE batch_id=2;

 UPDATE jetnity_at_p0_native_test.guard_state SET ok=false;
 IF jetnity_at_p0_native_test.visitor_v3('CH')->>'status'<>'unavailable' THEN RAISE EXCEPTION 'BG1 gate failure'; END IF;checked:=checked+1;
 UPDATE jetnity_at_p0_native_test.guard_state SET ok=true;

 UPDATE jetnity_at_p0_native_test.methods SET epoch=2;
 IF jetnity_at_p0_native_test.visitor_v3('CH')->>'status'<>'unavailable' THEN RAISE EXCEPTION 'MA1 revoked gate failure'; END IF;checked:=checked+1;
 UPDATE jetnity_at_p0_native_test.methods SET epoch=1;

 SELECT source_digest INTO original_digest FROM jetnity_at_p0_native_test.ch_visa_facts_v1 WHERE version_id=1;
 UPDATE jetnity_at_p0_native_test.ch_visa_facts_v1 SET source_digest=repeat('0',64) WHERE version_id=1;
 IF jetnity_at_p0_native_test.visitor_v3('CH')->>'status'<>'unavailable' THEN RAISE EXCEPTION 'Digest mismatch gate failure'; END IF;checked:=checked+1;
 UPDATE jetnity_at_p0_native_test.ch_visa_facts_v1 SET source_digest=original_digest WHERE version_id=1;

 UPDATE jetnity_at_p0_native_test.ch_visa_facts_v1 SET expires_at=clock_timestamp()-interval '1 second' WHERE version_id=1;
 IF jetnity_at_p0_native_test.visitor_v3('CH')->>'status'<>'unavailable' THEN RAISE EXCEPTION 'Expired lease gate failure'; END IF;checked:=checked+1;
 UPDATE jetnity_at_p0_native_test.ch_visa_facts_v1 SET expires_at=clock_timestamp()+interval '47 minutes' WHERE version_id=1;

 INSERT INTO jetnity_at_p0_native_test.watch_observations_v1
 SELECT 2,source_id,'unchanged_exact',clock_timestamp(),repeat('3',64) FROM jetnity_at_p0_native_test.source_pins_v1;
 UPDATE jetnity_at_p0_native_test.watch_observations_v1 SET body_sha=CASE source_id WHEN 'bmi-general-entry' THEN repeat('1',64)
 WHEN 'bmi-visa-nationality-matrix' THEN repeat('2',64) ELSE repeat('3',64) END WHERE batch_id=2;
 INSERT INTO jetnity_at_p0_native_test.ch_visa_facts_v1 SELECT 2,2,clock_timestamp(),clock_timestamp()+interval '1 hour',
 clock_timestamp(),'CH','AT','jetnity-destination-primary-at-visa',1,1,
 'cd9b8584d08cc3bfb83f0f1a7095c1c6e011c8d25336f8767ec6678ec8bbc9e9',
 '55e574d7c70c20513a4ac05273c43cdd87dd854e0b403ce0c9a5ab168220ebfe',
 (SELECT encode(sha256(convert_to(string_agg(source_id||':'||body_sha,'|' ORDER BY source_id COLLATE "C"),'UTF8')),'hex')
 FROM jetnity_at_p0_native_test.watch_observations_v1 WHERE batch_id=2);
 IF jetnity_at_p0_native_test.visitor_v3('CH')->>'status'<>'accepted' THEN RAISE EXCEPTION 'Atomic successor gate failure'; END IF;checked:=checked+1;
 RAISE NOTICE 'PG17_NATIVE_REAL_VISITOR_NEGATIVE_CHECKS %',checked;
END $test$;
SELECT (SELECT count(*) FROM jetnity_at_p0_native_test.ch_visa_facts_v1) AS synthetic_versions,
  jetnity_at_p0_native_test.visitor_v3('CH')->>'status' AS visitor_status,
  jetnity_at_p0_native_test.visitor_v3('IN')->>'status' AS unqualified_status;
ROLLBACK;