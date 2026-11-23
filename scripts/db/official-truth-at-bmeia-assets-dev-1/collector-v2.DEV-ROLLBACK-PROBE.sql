-- DEV ONLY / NEVER INSTALL: exact read-backable transactional probe.
-- Every schema/function change is ROLLED BACK, even on successful probe.
-- An actual installation additionally requires an independently reviewed
-- append-only BG1 guard/catalog successor and exact-head CI; this probe
-- never changes the scheduled Dev cron, source pins, facts or history.
BEGIN;
SET LOCAL search_path=pg_catalog;
SET LOCAL statement_timeout='15s';
SET LOCAL lock_timeout='3s';
SET LOCAL jetnity.bmeia_dev_target='dev:yfvbxvijcorffwxbxahl:BMEIA-ASSETS-V2-ROLLBACK';
DO $pre$
BEGIN
 IF session_user<>'postgres' OR current_user<>session_user
  OR current_database()<>'postgres'
  OR current_setting('server_version_num')::integer/10000<>17
  OR current_setting('jetnity.bmeia_dev_target',true) IS DISTINCT FROM
     'dev:yfvbxvijcorffwxbxahl:BMEIA-ASSETS-V2-ROLLBACK'
  OR public.official_v3_guard_alarm_status_v1()->>'status'<>'current'
  OR (SELECT encode(sha256(convert_to(prosrc,'UTF8')),'hex') FROM pg_proc
     WHERE oid='official_v3_at_source_watch_private.collect_v1()'::regprocedure)
     IS DISTINCT FROM '0801fc78366e585d6b1e7841dfa30e6cda2874c4319835f41edbef1780470e44'
 THEN RAISE EXCEPTION 'BMEIA_ASSETS_DEV_EXACT_GUARD_REQUIRED' USING ERRCODE='P7995'; END IF;
 PERFORM official_v3_guard_private.assert_catalog_v1();
END $pre$;

-- DEV CANDIDATE ONLY. Do not deploy to Production or execute outside
-- project yfvbxvijcorffwxbxahl. The protected Dev collector/guard
-- remains unchanged until an exact BG1 successor is separately tested.
-- Only BMEIA Bern, only 4 stylesheet and 15 script asset REFERENCES
-- inside the fixed Austrian theme directory. Full remaining HTML is
-- compared byte for byte; visible words, dates, tables, data, a[href],
-- ordinary links, inline scripts/styles and all other source IDs block.
CREATE OR REPLACE FUNCTION official_v3_at_source_watch_private.bmeia_asset_only_v2(
 p_source_id text, p_reference text, p_observed text)
RETURNS boolean LANGUAGE plpgsql IMMUTABLE SECURITY INVOKER
SET search_path=pg_catalog AS $safe$
DECLARE
 css_re CONSTANT text := '(<link[[:space:]]+rel="stylesheet"[[:space:]]+href=")/typo3conf/ext/theme_bmeia/Resources/Public/CSS/[A-Za-z0-9._-]+[.]css([?][0-9]{10})?(")';
 js_re CONSTANT text := '(<script[[:space:]]+src=")/typo3conf/ext/theme_bmeia/Resources/Public/JS/[A-Za-z0-9._-]+[.]js([?][0-9]{10})?(")';
 reference_normal text; observed_normal text;
 c1 bigint; c2 bigint; s1 bigint; s2 bigint;
BEGIN
 IF p_source_id IS DISTINCT FROM 'bmeia-bern-how-to-apply'
 OR p_reference IS NULL OR p_observed IS NULL
 OR octet_length(p_reference)<1 OR octet_length(p_observed)<1
 OR octet_length(p_reference)>1048576 OR octet_length(p_observed)>1048576 THEN
  RETURN false;
 END IF;
 SELECT count(*) INTO c1 FROM regexp_matches(p_reference,css_re,'g');
 SELECT count(*) INTO c2 FROM regexp_matches(p_observed,css_re,'g');
 SELECT count(*) INTO s1 FROM regexp_matches(p_reference,js_re,'g');
 SELECT count(*) INTO s2 FROM regexp_matches(p_observed,js_re,'g');
 IF c1<>4 OR c2<>4 OR s1<>15 OR s2<>15 THEN RETURN false; END IF;
 reference_normal:=regexp_replace(
  regexp_replace(p_reference,css_re,E'\\1CSS_ASSET\\3','g'),
  js_re,E'\\1JS_ASSET\\3','g');
 observed_normal:=regexp_replace(
  regexp_replace(p_observed,css_re,E'\\1CSS_ASSET\\3','g'),
  js_re,E'\\1JS_ASSET\\3','g');
 RETURN reference_normal=observed_normal;
END $safe$;
REVOKE ALL ON FUNCTION official_v3_at_source_watch_private.bmeia_asset_only_v2(text,text,text) FROM PUBLIC;

CREATE OR REPLACE FUNCTION official_v3_at_source_watch_private.collect_v1() RETURNS integer
LANGUAGE plpgsql VOLATILE SECURITY INVOKER SET search_path=pg_catalog AS $collect$
DECLARE a record; r record; result_state text; measured_bytes integer; measured_sha text;
 reference_html text; settled integer:=0;
BEGIN
 IF session_user<>'postgres' OR current_user<>session_user THEN
  RAISE EXCEPTION 'AT_SOURCE_WATCH_COLLECT_ROLE_REFUSED' USING ERRCODE='P7987'; END IF;
 FOR a IN
  SELECT c.batch_id,c.source_id,c.request_id,c.requested_at,p.expected_bytes,p.raw_sha,
   p.canonical_sha,p.edition_marker
  FROM official_v3_at_source_watch_private.reads_v1 c
  JOIN official_v3_at_source_watch_private.pins_v1 p USING(source_id)
  WHERE c.state='pending' ORDER BY c.batch_id,c.source_id FOR UPDATE OF c SKIP LOCKED
 LOOP
  SELECT * INTO r FROM net._http_response WHERE id=a.request_id ORDER BY created DESC LIMIT 1;
  IF NOT FOUND AND clock_timestamp()<a.requested_at+interval '5 minutes' THEN CONTINUE; END IF;
  result_state:='unavailable'; measured_bytes:=NULL; measured_sha:=NULL;
  IF FOUND AND r.status_code=200 AND r.timed_out IS NOT TRUE AND r.error_msg IS NULL
   AND r.content IS NOT NULL AND r.content_type ~* '^text/html([; ]|$)' THEN
   measured_bytes:=octet_length(convert_to(r.content,'UTF8'));
   IF measured_bytes BETWEEN 1 AND 1048576 THEN
    measured_sha:=encode(extensions.digest(convert_to(r.content,'UTF8'),'sha256'),'hex');
    IF measured_bytes=a.expected_bytes AND measured_sha=a.raw_sha
      AND (a.edition_marker IS NULL OR position(a.edition_marker IN r.content)>0)
    THEN result_state:='unchanged_exact';
    ELSIF a.source_id='bmeia-bern-how-to-apply' AND a.canonical_sha IS NOT NULL THEN
      -- Compare against immutable and digest-verified original; do not
      -- rewrite an old observation or the original document.
      SELECT convert_from(archive.original_body,'UTF8') INTO reference_html
      FROM official_v3_at_private.whole_originals_v2 archive
      WHERE archive.source_id=a.source_id
       AND archive.body_bytes=a.expected_bytes AND archive.body_digest=a.raw_sha
       AND archive.body_digest=encode(extensions.digest(archive.original_body,'sha256'),'hex')
       AND archive.official_url=(SELECT p.url FROM official_v3_at_source_watch_private.pins_v1 p WHERE p.source_id=a.source_id);
      IF reference_html IS NOT NULL AND
       official_v3_at_source_watch_private.bmeia_asset_only_v2(a.source_id,reference_html,r.content)
      THEN result_state:='unchanged_asset_version_only';
      ELSE result_state:='changed'; END IF;
    ELSE result_state:='changed'; END IF;
   END IF;
  END IF;
  UPDATE official_v3_at_source_watch_private.reads_v1
    SET state=result_state,observed_at=clock_timestamp(),
      observed_bytes=measured_bytes,observed_sha=measured_sha
    WHERE batch_id=a.batch_id AND source_id=a.source_id AND state='pending';
  settled:=settled+1;
 END LOOP;
 RETURN settled;
END $collect$;;

-- Native BG1 negative gate: the unreleased collector/canonizer CANNOT
-- bypass the existing protected catalog; this must fail while changed.
DO $bg1_negative$
BEGIN
 BEGIN
  PERFORM official_v3_guard_private.assert_catalog_v1();
  RAISE EXCEPTION 'BG1_FAIL_OPEN_UNRELEASED_COLLECTOR' USING ERRCODE='P7995';
 EXCEPTION WHEN SQLSTATE 'P7905' THEN NULL;
 END;
END $bg1_negative$;

-- Proof must never publish or mutate an existing receipt.
DO $verify$
DECLARE written text;
BEGIN
 SELECT prosrc INTO written FROM pg_proc WHERE oid=
 'official_v3_at_source_watch_private.collect_v1()'::regprocedure;
 IF written NOT LIKE '%bmeia_asset_only_v2%'
  OR (SELECT count(*) FROM official_v3_at_source_watch_private.pins_v1)<>3
  OR NOT pg_has_role('postgres','postgres','USAGE')
 THEN RAISE EXCEPTION 'BMEIA_ASSETS_DEV_PROBE_INCOMPLETE' USING ERRCODE='P7995'; END IF;
END $verify$;
ROLLBACK;
-- After rollback the historical Dev collector, BG1 and facts remain unchanged.
SELECT public.official_v3_guard_alarm_status_v1() AS bg1_after_rollback;