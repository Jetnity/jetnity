-- CH->AT BMEIA asset classifier, guarded successor DEV V13.
-- UNAPPLIED CANDIDATE. NOT FOR PRODUCTION. Never authorizes/normalizes ordinary links.
-- The existing ID-Austria hyperlink still causes changed/unavailable in Dev.
BEGIN;
SET LOCAL search_path=pg_catalog;
SET LOCAL statement_timeout='25s';
SET LOCAL lock_timeout='3s';
SET LOCAL idle_in_transaction_session_timeout='25s';
SET LOCAL jetnity.bmeia_dev_target='dev:yfvbxvijcorffwxbxahl:BMEIA-ASSETS-V13';
DO $pre$
DECLARE f record;
BEGIN
 IF session_user<>'postgres' OR current_user<>session_user
 OR current_database()<>'postgres'
 OR current_setting('server_version_num')::int/10000<>17
 OR current_setting('jetnity.bmeia_dev_target',true)<>'dev:yfvbxvijcorffwxbxahl:BMEIA-ASSETS-V13'
 OR to_regclass('official_v3_guard_private.bg1_dev_bmeia_assets_v13') IS NOT NULL
 OR to_regprocedure('official_v3_at_source_watch_private.bmeia_asset_only_v2(text,text,text)') IS NOT NULL
 OR public.official_v3_guard_alarm_status_v1()->>'status'<>'current'
 OR (SELECT count(*) FROM official_v3_at_source_watch_private.pins_v1)<>3
 OR (SELECT count(*) FROM official_v3_at_private.whole_originals_v2)<>3
 OR NOT pg_try_advisory_xact_lock(771106,1)
 OR NOT pg_try_advisory_xact_lock(771108,42)
 THEN RAISE EXCEPTION 'BMEIA_V13_DEV_PARENT_REQUIRED' USING ERRCODE='P7995'; END IF;
 FOR f IN SELECT * FROM (VALUES
 ('official_v3_guard_private.assert_catalog_v1()','503a4f17574ff9bce71307a5cdcedb639a5f6676c2b55550abd8ebacbe7fee79'),
 ('official_v3_guard_private.require_open_v1()','c76b64d2839be90f058b049412ef60e86d8854f8f7da6d26d4453e56494962f7'),
 ('official_v3_guard_private.catalog_status_v1()','620cb54fa8b6f6e1466f29c49c87501d9b9e3a010028fc0458d0e871ebbb9841'),
 ('public.official_v3_guard_alarm_status_v1()','05c18e2e5c6d6c6e496a3b0b55df901c17bc018a4fb21eb8ef166fade4de3327'),
 ('official_v3_at_source_watch_private.collect_v1()','0801fc78366e585d6b1e7841dfa30e6cda2874c4319835f41edbef1780470e44')
 ) v(signature,body_sha) LOOP
 IF to_regprocedure(f.signature) IS NULL OR
  (SELECT encode(sha256(convert_to(prosrc,'UTF8')),'hex') FROM pg_proc WHERE oid=to_regprocedure(f.signature))
  IS DISTINCT FROM f.body_sha
 THEN RAISE EXCEPTION 'BMEIA_V13_DEV_FUNCTION_DRIFT' USING ERRCODE='P7995'; END IF;
 END LOOP;
 PERFORM official_v3_guard_private.assert_catalog_v1();
 PERFORM official_v3_guard_private.require_open_v1();
END $pre$;
CREATE TEMP TABLE bmeia_old_dev (pins bigint,orig bigint,batches bigint,changed bigint,guard_incident bigint, guard_resume bigint)
ON COMMIT DROP;
INSERT INTO bmeia_old_dev SELECT
 (SELECT count(*) FROM official_v3_at_source_watch_private.pins_v1),
 (SELECT count(*) FROM official_v3_at_private.whole_originals_v2),
 (SELECT count(*) FROM official_v3_at_source_watch_private.batches_v1),
 (SELECT count(*) FROM official_v3_at_source_watch_private.reads_v1 WHERE source_id='bmeia-bern-how-to-apply' AND state='changed'),
 s.incident_generation,s.resumed_generation FROM official_v3_guard_private.state_v1 s WHERE singleton;
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
END $collect$;
CREATE TABLE official_v3_guard_private.bg1_dev_bmeia_assets_v13(
 singleton boolean PRIMARY KEY CHECK(singleton),
 predecessor_catalog_digest text NOT NULL CHECK(predecessor_catalog_digest~'^[a-f0-9]{64}$'),
 predecessor_baseline_digest text NOT NULL CHECK(predecessor_baseline_digest~'^[a-f0-9]{64}$'),
 collector_body_sha text NOT NULL CHECK(collector_body_sha~'^[a-f0-9]{64}$'),
 comparator_body_sha text NOT NULL CHECK(comparator_body_sha~'^[a-f0-9]{64}$'),
 required_generation bigint NOT NULL CHECK(required_generation>0),
 proof_not_before timestamptz NOT NULL,
 catalog jsonb NOT NULL
);
ALTER TABLE official_v3_guard_private.bg1_dev_bmeia_assets_v13 ENABLE ROW LEVEL SECURITY;
ALTER TABLE official_v3_guard_private.bg1_dev_bmeia_assets_v13 FORCE ROW LEVEL SECURITY;
REVOKE ALL ON official_v3_guard_private.bg1_dev_bmeia_assets_v13 FROM PUBLIC,anon,authenticated,service_role;
CREATE TRIGGER immutable_rows BEFORE UPDATE OR DELETE ON
 official_v3_guard_private.bg1_dev_bmeia_assets_v13 FOR EACH ROW
 EXECUTE FUNCTION official_v3_guard_private.immutable_v1();
CREATE TRIGGER immutable_truncate BEFORE TRUNCATE ON
 official_v3_guard_private.bg1_dev_bmeia_assets_v13 FOR EACH STATEMENT
 EXECUTE FUNCTION official_v3_guard_private.immutable_v1();

CREATE OR REPLACE FUNCTION official_v3_guard_private.assert_catalog_v1()
 RETURNS void
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO 'pg_catalog'
AS $function$
DECLARE bmeia_v13 official_v3_guard_private.bg1_dev_bmeia_assets_v13%ROWTYPE;
 at_auto_v12 official_v3_guard_private.bg1_dev_at_ch_autorenew_v12%ROWTYPE;
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
  SELECT * INTO STRICT bmeia_v13 FROM official_v3_guard_private.bg1_dev_bmeia_assets_v13 WHERE singleton;
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
 OR bmeia_v13.predecessor_catalog_digest IS DISTINCT FROM
      encode(sha256(convert_to(at_auto_v12.catalog::text,'UTF8')),'hex')
 OR bmeia_v13.predecessor_baseline_digest IS DISTINCT FROM
      encode(sha256(convert_to((to_jsonb(at_auto_v12)||
       jsonb_build_object('proof_not_before',extract(epoch FROM at_auto_v12.proof_not_before)))::text,'UTF8')),'hex')
 OR bmeia_v13.required_generation<=at_auto_v12.required_generation
 OR bmeia_v13.proof_not_before<=at_auto_v12.proof_not_before
 OR bmeia_v13.collector_body_sha IS DISTINCT FROM
    (SELECT encode(sha256(convert_to(p.prosrc,'UTF8')),'hex') FROM pg_proc p
     WHERE p.oid='official_v3_at_source_watch_private.collect_v1()'::regprocedure)
 OR bmeia_v13.comparator_body_sha IS DISTINCT FROM
    (SELECT encode(sha256(convert_to(p.prosrc,'UTF8')),'hex') FROM pg_proc p
     WHERE p.oid='official_v3_at_source_watch_private.bmeia_asset_only_v2(text,text,text)'::regprocedure)
 OR bmeia_v13.catalog IS DISTINCT FROM official_v3_guard_private.catalog_status_v1() THEN
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
  SELECT greatest(required_proof,v.required_generation),greatest(earliest_proof,v.proof_not_before)
  INTO STRICT required_proof,earliest_proof
  FROM official_v3_guard_private.bg1_dev_bmeia_assets_v13 v WHERE v.singleton;
  IF s.generation<required_proof OR s.last_proof_started<earliest_proof OR instant<earliest_proof
    OR NOT EXISTS(SELECT 1 FROM official_v3_guard_private.runs_v1 run WHERE run.outcome='complete' AND run.generation=s.generation
      AND run.due_at=s.last_due AND run.started_at=s.last_started AND run.proof_started_at=s.last_proof_started AND run.finished_at=s.last_finished) THEN
    RAISE EXCEPTION 'bg1 recovery fresh full proof required' USING ERRCODE='P7902'; END IF;
  RETURN s.incident_generation;
END $function$
;
CREATE OR REPLACE FUNCTION public.official_v3_guard_alarm_status_v1()
 RETURNS jsonb
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO 'pg_catalog'
AS $function$
DECLARE required_proof bigint; earliest_proof timestamptz; current_state official_v3_guard_private.state_v1%ROWTYPE;
  unavailable_value jsonb:=jsonb_build_object('schema',1,'status','unavailable');
BEGIN
  IF pg_catalog.current_setting('session_replication_role') NOT IN('origin','local') THEN RETURN unavailable_value; END IF;
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
  FROM official_v3_guard_private.bg1_dev_bmeia_assets_v13 v WHERE v.singleton;
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
END $function$
;
INSERT INTO official_v3_guard_private.bg1_dev_bmeia_assets_v13(
singleton,predecessor_catalog_digest,predecessor_baseline_digest,
collector_body_sha,comparator_body_sha,required_generation,proof_not_before,catalog)
SELECT true,
 encode(sha256(convert_to(v12.catalog::text,'UTF8')),'hex'),
 encode(sha256(convert_to((to_jsonb(v12)||
  jsonb_build_object('proof_not_before',extract(epoch FROM v12.proof_not_before)))::text,'UTF8')),'hex'),
 (SELECT encode(sha256(convert_to(prosrc,'UTF8')),'hex') FROM pg_proc WHERE oid='official_v3_at_source_watch_private.collect_v1()'::regprocedure),
 (SELECT encode(sha256(convert_to(prosrc,'UTF8')),'hex') FROM pg_proc WHERE oid='official_v3_at_source_watch_private.bmeia_asset_only_v2(text,text,text)'::regprocedure),
 state.generation+1,clock_timestamp(),official_v3_guard_private.catalog_status_v1()
FROM official_v3_guard_private.bg1_dev_at_ch_autorenew_v12 v12
CROSS JOIN official_v3_guard_private.state_v1 state
WHERE v12.singleton AND state.singleton;
DO $post$
BEGIN
 IF (SELECT count(*) FROM official_v3_guard_private.bg1_dev_bmeia_assets_v13)<>1
 OR (SELECT count(*) FROM official_v3_at_source_watch_private.pins_v1)<>(SELECT pins FROM bmeia_old_dev)
 OR (SELECT count(*) FROM official_v3_at_private.whole_originals_v2)<>(SELECT orig FROM bmeia_old_dev)
 OR (SELECT count(*) FROM official_v3_at_source_watch_private.batches_v1)<>(SELECT batches FROM bmeia_old_dev)
 OR (SELECT count(*) FROM official_v3_at_source_watch_private.reads_v1 WHERE source_id='bmeia-bern-how-to-apply' AND state='changed')<>(SELECT changed FROM bmeia_old_dev)
 OR (SELECT incident_generation FROM official_v3_guard_private.state_v1)<>(SELECT guard_incident FROM bmeia_old_dev)
 OR (SELECT resumed_generation FROM official_v3_guard_private.state_v1)<>(SELECT guard_resume FROM bmeia_old_dev)
 THEN RAISE EXCEPTION 'BMEIA_V13_HISTORY_CHANGED' USING ERRCODE='P7995'; END IF;
 PERFORM official_v3_guard_private.assert_catalog_v1();
 -- New baseline must fail-closed until the next NATURAL five-minute full proof.
 BEGIN
  PERFORM official_v3_guard_private.require_open_v1();
  RAISE EXCEPTION 'BMEIA_V13_PREMATURE_GUARD_OPEN' USING ERRCODE='P7995';
 EXCEPTION WHEN SQLSTATE 'P7902' THEN NULL;
 END;
END $post$;
ROLLBACK;
SELECT public.official_v3_guard_alarm_status_v1() AS guard_after_rollback;
