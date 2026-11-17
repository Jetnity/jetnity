-- DEV only. Six archive-verified (50 passports each) RESEARCH_ONLY queues.
-- HR/NL remain blocked because their v2.2 indexes lack explicit split layout.
-- No positive legal facts, no source bytes, no method/visitor/production changes.
BEGIN;
SET LOCAL search_path=pg_catalog;
SET LOCAL statement_timeout='30s';
SET LOCAL lock_timeout='5s';
SET LOCAL jetnity.next_target='dev:yfvbxvijcorffwxbxahl:NEXT6-1';
DO $pre$ BEGIN
 IF session_user<>'postgres' OR current_user<>session_user
 OR current_setting('server_version_num')::integer/10000<>17
 OR current_setting('jetnity.next_target',true) IS DISTINCT FROM 'dev:yfvbxvijcorffwxbxahl:NEXT6-1'
 OR public.official_v3_guard_alarm_status_v1()->>'status'<>'current'
 OR to_regnamespace('jetnity_next_six_research_private') IS NOT NULL
 OR (SELECT count(*) FROM official_v3_source_renewal_private.passport_priority_v1)<>50
 OR (SELECT count(*) FROM jetnity_followup_primary_private.passport_scope_v1)<>200
 OR NOT pg_try_advisory_xact_lock(771109,3)
 THEN RAISE EXCEPTION 'NEXT6_DEV_PREDECESSOR_REFUSED' USING ERRCODE='P7995'; END IF;
 PERFORM official_v3_guard_private.assert_catalog_v1();
END $pre$;
CREATE SCHEMA jetnity_next_six_research_private AUTHORIZATION postgres;
REVOKE ALL ON SCHEMA jetnity_next_six_research_private FROM PUBLIC,anon,authenticated,service_role;
CREATE TABLE jetnity_next_six_research_private.original_index_v1(
 dest text PRIMARY KEY CHECK(dest IN ('GR','GB','US','TR','TH','AE')),
 archive_sha text NOT NULL DEFAULT '6ef8c9f6e36bee2f75cf162d725a60844ef757bfad14407f69d81631cb9f55e5'
 CHECK(archive_sha='6ef8c9f6e36bee2f75cf162d725a60844ef757bfad14407f69d81631cb9f55e5'),
 index_sha text NOT NULL CHECK(index_sha~'^[a-f0-9]{64}$'),
 original_50_slices_sha text NOT NULL CHECK(original_50_slices_sha~'^[a-f0-9]{64}$'),
 state text NOT NULL DEFAULT 'RESEARCH_ONLY' CHECK(state='RESEARCH_ONLY'),
 qualified boolean NOT NULL DEFAULT false CHECK(qualified=false));
INSERT INTO jetnity_next_six_research_private.original_index_v1
(dest,index_sha,original_50_slices_sha) VALUES
('GR','9f79696dd0556d0acbf31a06d1b68f3e96677a77fb5d3b6f5f2f5c8962d602a5','4b9c728714e697877eee112759c51569643a2952f0c778e229d561be61a94bf4'),
('GB','caf578292f7969372e47e9fbffc59523c8dee35244f6be0c4b64e444bdd1340f','1e0a40726db9dc2de3282a45100e3febb511aa93b6789d07f87af15ae0890981'),
('US','832805254b8ebc7d3bbf4e065c2fbac5a4cbe865f2252653cb89beb90a03b847','de9528f680f54c417ac7f9bbc3ddb846d2412490c2d3378e1e498d1ef354b074'),
('TR','38acb85ea0d3e83d07782b8630f1d011093aaf5b82485bffad9467e8544b91f7','b4346f2c1aff943fd7cdd85432e055b16c6d21f19129d8c09ab0146fa39b58b3'),
('TH','9f44469b8129fd55520b83675db319bf4029af992ef2ba37b642fe1cf8f5a46a','7094ef0d7b0c66f8e92d9b5add727225e387d3a8fab3ce95f8b60f2097c52f1d'),
('AE','408111da7401fbc199b62de0e6e0e913eae1715fc374c5be91e727ee754573d6','fe6fbfbe51b836a3394037eddd71fbc51ae23591d9dbfebcf31a6c2bc84522f3');
CREATE TABLE jetnity_next_six_research_private.blocked_index_v1(
 dest text PRIMARY KEY CHECK(dest IN ('HR','NL')),
 index_sha text NOT NULL CHECK(index_sha~'^[a-f0-9]{64}$'),
 issue text NOT NULL CHECK(issue='AMBIGUOUS_UNSPLIT_V2_2_INDEX'),
 accepted integer NOT NULL DEFAULT 0 CHECK(accepted=0));
INSERT INTO jetnity_next_six_research_private.blocked_index_v1(dest,index_sha,issue)
VALUES ('HR','7332702463a2b809a628765a58db275da6f72db6297457812cd9bef6b24cab9a','AMBIGUOUS_UNSPLIT_V2_2_INDEX'),
('NL','cc01621bf2974d9feef12f0cfeb6cc76dd6e62ceaff373840afd512614808760','AMBIGUOUS_UNSPLIT_V2_2_INDEX');
CREATE TABLE jetnity_next_six_research_private.passports_v1(
 dest text NOT NULL REFERENCES jetnity_next_six_research_private.original_index_v1(dest),
 priority_rank integer NOT NULL CHECK(priority_rank BETWEEN 1 AND 50),
 passport text NOT NULL CHECK(passport~'^[A-Z]{2}$'),
 status text NOT NULL DEFAULT 'derzeit nicht verfügbar' CHECK(status='derzeit nicht verfügbar'),
 accepted integer NOT NULL DEFAULT 0 CHECK(accepted=0),
 published boolean NOT NULL DEFAULT false CHECK(published=false),
 PRIMARY KEY(dest,priority_rank),UNIQUE(dest,passport));
INSERT INTO jetnity_next_six_research_private.passports_v1(dest,priority_rank,passport)
SELECT d.dest,p.rank,p.code FROM jetnity_next_six_research_private.original_index_v1 d
CROSS JOIN official_v3_source_renewal_private.passport_priority_v1 p;
CREATE TABLE jetnity_next_six_research_private.official_urls_v1(
 dest text NOT NULL REFERENCES jetnity_next_six_research_private.original_index_v1(dest),
 source_key text NOT NULL CHECK(source_key~'^[a-z][a-z0-9_-]{2,63}$'),
 topic text NOT NULL CHECK(topic IN ('visa','eta','forms','transit','passport_validity')),
 official_url text NOT NULL CHECK(official_url LIKE 'https://%'),
 official_page_date date,
 research_note text NOT NULL CHECK(length(research_note) BETWEEN 16 AND 300),
 form_name text,
 form_cost numeric(8,2),
 fake_site_warning text,
 source_body_sha text CHECK(source_body_sha IS NULL),
 verified boolean NOT NULL DEFAULT false CHECK(verified=false),
 accepted boolean NOT NULL DEFAULT false CHECK(accepted=false),
 PRIMARY KEY(dest,source_key),UNIQUE(dest,official_url),
 CHECK(form_cost IS NULL OR (dest='TH' AND source_key='thai-tdac' AND form_cost=0)),
 CHECK(form_name IS NULL OR (dest='TH' AND source_key='thai-tdac' AND form_name='Thailand Digital Arrival Card')),
 CHECK(fake_site_warning IS NULL OR (dest='TH' AND source_key='thai-tdac')));
INSERT INTO jetnity_next_six_research_private.official_urls_v1
(dest,source_key,topic,official_url,official_page_date,research_note,form_name,form_cost,fake_site_warning) VALUES
('GR','greek-mfa-visa','visa','https://www.mfa.gr/en/services/visas-for-foreigners-traveling-to-greece/countries-requiring-or-not-requiring-a-visa/',NULL,
'Passport category and table footnotes require per-pass source qualification',NULL,NULL,NULL),
('GB','uk-visa-check','visa','https://www.gov.uk/check-uk-visa',NULL,
'Government wizard needs nationality, passport type and purpose',NULL,NULL,NULL),
('GB','uk-eta-eligibility','eta','https://www.gov.uk/guidance/check-when-you-can-get-an-electronic-travel-authorisation-eta','2026-04-09',
'ETA eligibility is not an unconditional entry requirement',NULL,NULL,NULL),
('US','us-vwp','visa','https://travel.state.gov/content/travel/en/us-visas/tourism-visit/visa-waiver-program.html',NULL,
'VWP may require ESTA, e-passport and checks of dual nationality and travel history',NULL,NULL,NULL),
('TR','turkey-mfa-visa','visa','https://www.mfa.gov.tr/visa-information-for-foreigners.en.mfa',NULL,
'Official ordinary passport and purpose conditions vary by nationality',NULL,NULL,NULL),
('TR','turkey-evisa','forms','https://www.evisa.gov.tr/',NULL,
'Only use this official portal if independently passport-qualified; fees unknown',NULL,NULL,NULL),
('TH','thai-mfa-revision','visa','https://www.mfa.go.th/en/content/pb-summary-03092026-en','2026-09-03',
'Old 60 day tourism visa exemption revoked from 15 September 2026, new bilateral exceptions apply',NULL,NULL,NULL),
('TH','thai-embassy-visa','visa','https://frankfurt.thaiembassy.org/de/page/einreisen-ohne-visa-visa-exemption?menu=649ae96aa2648b042457d4a2',NULL,
'30 day unilateral, 15 day VOA and bilateral categories need separate normal passport decisions',NULL,NULL,NULL),
('TH','thai-tdac','forms','https://tdac.immigration.go.th/arrival-card/',NULL,
'Official zero-fee arrival card; not required if no immigration on sterile transit','Thailand Digital Arrival Card',0,
'Das offizielle TDAC ist kostenlos. Keine kostenpflichtigen Fake-Seiten nutzen.'),
('TH','thai-tdac-faq','transit','https://tdac.immigration.go.th/manual/en/faq.html',NULL,
'Official Thailand immigration form eligibility and sterile transit exception',NULL,NULL,NULL),
('AE','uae-visa-gov','visa','https://u.ae/en/information-and-services/visa-and-emirates-id/Visa-information/do-you-need-an-entry-permit-or-a-visa-to-enter-the-uae','2026-07-13',
'Official visa-on-arrival eligibility depends on nationality and six-month passport rule',NULL,NULL,NULL);
CREATE FUNCTION jetnity_next_six_research_private.deny_change_v1() RETURNS trigger
LANGUAGE plpgsql SECURITY INVOKER SET search_path=pg_catalog AS $deny$
BEGIN RAISE EXCEPTION 'NEXT6_RESEARCH_APPEND_ONLY' USING ERRCODE='P7996'; END $deny$;
REVOKE ALL ON FUNCTION jetnity_next_six_research_private.deny_change_v1() FROM PUBLIC,anon,authenticated,service_role;
DO $privacy$ DECLARE t text; BEGIN
 FOREACH t IN ARRAY ARRAY['original_index_v1','blocked_index_v1','passports_v1','official_urls_v1'] LOOP
  EXECUTE format('ALTER TABLE jetnity_next_six_research_private.%I ENABLE ROW LEVEL SECURITY',t);
  EXECUTE format('ALTER TABLE jetnity_next_six_research_private.%I FORCE ROW LEVEL SECURITY',t);
  EXECUTE format('CREATE POLICY postgres_only ON jetnity_next_six_research_private.%I TO postgres USING(true) WITH CHECK(true)',t);
  EXECUTE format('CREATE TRIGGER no_row_change BEFORE UPDATE OR DELETE ON jetnity_next_six_research_private.%I FOR EACH ROW EXECUTE FUNCTION jetnity_next_six_research_private.deny_change_v1()',t);
  EXECUTE format('CREATE TRIGGER no_truncate BEFORE TRUNCATE ON jetnity_next_six_research_private.%I FOR EACH STATEMENT EXECUTE FUNCTION jetnity_next_six_research_private.deny_change_v1()',t);
 END LOOP; END $privacy$;
REVOKE ALL ON ALL TABLES IN SCHEMA jetnity_next_six_research_private FROM PUBLIC,anon,authenticated,service_role;
DO $post$ BEGIN
 IF (SELECT count(*) FROM jetnity_next_six_research_private.original_index_v1)<>6
 OR (SELECT count(*) FROM jetnity_next_six_research_private.blocked_index_v1)<>2
 OR (SELECT count(*) FROM jetnity_next_six_research_private.passports_v1)<>300
 OR (SELECT count(*) FROM jetnity_next_six_research_private.official_urls_v1)<>11
 OR EXISTS(SELECT 1 FROM jetnity_next_six_research_private.passports_v1 WHERE status<>'derzeit nicht verfügbar' OR accepted<>0 OR published)
 OR EXISTS(SELECT 1 FROM jetnity_next_six_research_private.official_urls_v1 WHERE verified OR accepted OR source_body_sha IS NOT NULL)
 OR EXISTS(SELECT 1 FROM pg_class c JOIN pg_namespace n ON n.oid=c.relnamespace
   WHERE n.nspname='jetnity_next_six_research_private' AND c.relkind='r'
   AND (NOT c.relrowsecurity OR NOT c.relforcerowsecurity
    OR has_table_privilege('anon',c.oid,'SELECT') OR has_table_privilege('authenticated',c.oid,'SELECT')
    OR has_table_privilege('service_role',c.oid,'SELECT')))
 OR public.official_v3_guard_alarm_status_v1()->>'status'<>'current'
 THEN RAISE EXCEPTION 'NEXT6_RESEARCH_POSTCHECK_FAILED' USING ERRCODE='P7995'; END IF;
 PERFORM official_v3_guard_private.assert_catalog_v1();
END $post$;
COMMIT;
