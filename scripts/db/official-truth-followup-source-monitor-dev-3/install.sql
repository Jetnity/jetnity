-- DEV-ONLY V3: source watcher for four research destinations.
-- Real V2 receipt shows Italy MAECI blocked by Radware captcha: HTTP 200
-- with a false HTML body. Italian MAECI's official visa selector is reachable.
-- Keep V1/V2 originals, observations and method/guard/visitor unchanged.
BEGIN;
SET LOCAL search_path=pg_catalog;
SET LOCAL statement_timeout='30s';
SET LOCAL lock_timeout='5s';
SET LOCAL idle_in_transaction_session_timeout='30s';
SET LOCAL jetnity.followup_v3_target='dev:yfvbxvijcorffwxbxahl:FOLLOWUP-WATCH-3';
DO $preflight$
BEGIN
 IF session_user<>'postgres' OR current_user<>session_user OR current_database()<>'postgres'
 OR current_setting('server_version_num')::integer/10000<>17
 OR current_setting('jetnity.followup_v3_target',true) IS DISTINCT FROM 'dev:yfvbxvijcorffwxbxahl:FOLLOWUP-WATCH-3'
 OR public.official_v3_guard_alarm_status_v1()->>'status'<>'current'
 OR to_regclass('jetnity_followup_source_monitor_private.sources_v3') IS NOT NULL
 OR (SELECT count(*) FROM jetnity_followup_source_monitor_private.sources_v2)<>4
 OR (SELECT count(*) FROM jetnity_followup_source_monitor_private.observations_v1)<>4
 OR (SELECT count(*) FROM jetnity_followup_source_monitor_private.observations_v2)<>4
 OR (SELECT count(*) FROM jetnity_followup_source_monitor_private.observations_v2
    WHERE destination_code='IT' AND status='invalid_source_body' AND http_code=200)<>1
 OR (SELECT count(*) FROM jetnity_followup_source_monitor_private.observations_v2
    WHERE destination_code IN('FR','ES','PT') AND status='unqualified_snapshot' AND http_code=200)<>3
 OR (SELECT count(*) FROM cron.job WHERE username='postgres' AND active
   AND jobname IN ('jetnity-followup-government-enqueue-v2-dev','jetnity-followup-government-collect-v2-dev'))<>2
 OR EXISTS(SELECT 1 FROM jetnity_followup_source_monitor_private.sources_v2
   WHERE source_qualified OR legal_fact_approved)
 OR (SELECT count(*) FROM jetnity_followup_primary_private.passport_scope_v1 WHERE can_publish OR legal_fact_accepted)<>0
 OR NOT pg_try_advisory_xact_lock(771110,5)
 THEN RAISE EXCEPTION 'FOLLOWUP_V3_EXACT_DEV_PREDECESSOR_REQUIRED' USING ERRCODE='P7999'; END IF;
 PERFORM official_v3_guard_private.assert_catalog_v1();
END $preflight$;

CREATE TABLE jetnity_followup_source_monitor_private.sources_v3(
 destination_code text PRIMARY KEY CHECK(destination_code IN('IT','FR','ES','PT')),
 authority text NOT NULL,
 official_url text NOT NULL UNIQUE CHECK(official_url LIKE 'https://%'),
 content_marker text NOT NULL CHECK(length(content_marker) BETWEEN 4 AND 120),
 source_state text NOT NULL DEFAULT 'RESEARCH_ONLY' CHECK(source_state='RESEARCH_ONLY'),
 source_qualified boolean NOT NULL DEFAULT false CHECK(source_qualified=false),
 approved_facts integer NOT NULL DEFAULT 0 CHECK(approved_facts=0));
INSERT INTO jetnity_followup_source_monitor_private.sources_v3
(destination_code,authority,official_url,content_marker) VALUES
('IT','Italian Ministry of Foreign Affairs — official visa selector',
 'https://vistoperitalia.esteri.it/','La tua nazionalità'),
('FR','DILA — French Government',
 'https://www.service-public.gouv.fr/particuliers/vosdroits/F13512','Suisse'),
('ES','Boletín Oficial del Estado',
 'https://www.boe.es/eli/es/rd/2007/02/16/240','Entrada'),
('PT','Portuguese Government',
 'https://www.gov.pt/guias/entrar-e-sair-de-portugal','Portugal');

CREATE TABLE jetnity_followup_source_monitor_private.requests_v3(
 batch_id bigint GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
 requested_at timestamptz NOT NULL DEFAULT clock_timestamp());
CREATE TABLE jetnity_followup_source_monitor_private.items_v3(
 batch_id bigint NOT NULL REFERENCES jetnity_followup_source_monitor_private.requests_v3(batch_id),
 destination_code text NOT NULL REFERENCES jetnity_followup_source_monitor_private.sources_v3(destination_code),
 request_id bigint UNIQUE NOT NULL,
 requested_at timestamptz NOT NULL,
 PRIMARY KEY(batch_id,destination_code));
CREATE TABLE jetnity_followup_source_monitor_private.observations_v3(
 batch_id bigint NOT NULL,
 destination_code text NOT NULL,
 observed_at timestamptz NOT NULL,
 status text NOT NULL CHECK(status IN
  ('unqualified_snapshot','unchanged_unqualified','changed_requires_review',
   'http_unavailable','invalid_source_body')),
 source_bytes integer CHECK(source_bytes IS NULL OR source_bytes BETWEEN 1 AND 1048576),
 source_sha256 text CHECK(source_sha256 IS NULL OR source_sha256 ~ '^[a-f0-9]{64}$'),
 http_code integer,
 PRIMARY KEY(batch_id,destination_code),
 FOREIGN KEY(batch_id,destination_code)
   REFERENCES jetnity_followup_source_monitor_private.items_v3(batch_id,destination_code),
 CHECK((status IN('unqualified_snapshot','unchanged_unqualified','changed_requires_review'))
  = (source_bytes IS NOT NULL AND source_sha256 IS NOT NULL)),
 CHECK(status<>'http_unavailable' OR source_sha256 IS NULL));

DO $privacy$
DECLARE t text;
BEGIN
 FOREACH t IN ARRAY ARRAY['sources_v3','requests_v3','items_v3','observations_v3'] LOOP
  EXECUTE format('ALTER TABLE jetnity_followup_source_monitor_private.%I ENABLE ROW LEVEL SECURITY',t);
  EXECUTE format('ALTER TABLE jetnity_followup_source_monitor_private.%I FORCE ROW LEVEL SECURITY',t);
  EXECUTE format('CREATE POLICY postgres_only ON jetnity_followup_source_monitor_private.%I TO postgres USING(true) WITH CHECK(true)',t);
  EXECUTE format('CREATE TRIGGER immutable_rows BEFORE UPDATE OR DELETE ON jetnity_followup_source_monitor_private.%I FOR EACH ROW EXECUTE FUNCTION jetnity_followup_source_monitor_private.no_mutation_v1()',t);
  EXECUTE format('CREATE TRIGGER immutable_truncate BEFORE TRUNCATE ON jetnity_followup_source_monitor_private.%I FOR EACH STATEMENT EXECUTE FUNCTION jetnity_followup_source_monitor_private.no_mutation_v1()',t);
 END LOOP;
END $privacy$;
REVOKE ALL ON ALL TABLES IN SCHEMA jetnity_followup_source_monitor_private
 FROM PUBLIC,anon,authenticated,service_role;
REVOKE ALL ON ALL SEQUENCES IN SCHEMA jetnity_followup_source_monitor_private
 FROM PUBLIC,anon,authenticated,service_role;

CREATE FUNCTION jetnity_followup_source_monitor_private.enqueue_v3()
 RETURNS integer LANGUAGE plpgsql VOLATILE SECURITY INVOKER SET search_path=pg_catalog
 AS $enqueue$
DECLARE s record; bid bigint; n integer:=0; now_at timestamptz;
BEGIN
 IF session_user<>'postgres' OR current_user<>session_user
 OR public.official_v3_guard_alarm_status_v1()->>'status'<>'current'
 THEN RETURN 0; END IF;
 IF NOT pg_try_advisory_xact_lock(771110,6) THEN RETURN 0; END IF;
 IF (SELECT max(requested_at) FROM jetnity_followup_source_monitor_private.requests_v3)
 >clock_timestamp()-interval '50 minutes' THEN RETURN 0; END IF;
 now_at:=clock_timestamp();
 INSERT INTO jetnity_followup_source_monitor_private.requests_v3(requested_at)
 VALUES(now_at) RETURNING batch_id INTO bid;
 FOR s IN SELECT destination_code,official_url
   FROM jetnity_followup_source_monitor_private.sources_v3 ORDER BY destination_code LOOP
   INSERT INTO jetnity_followup_source_monitor_private.items_v3
     (batch_id,destination_code,request_id,requested_at)
   VALUES (bid,s.destination_code,net.http_get(s.official_url,'{}'::jsonb,
     '{"accept":"text/html"}'::jsonb,15000),now_at);
   n:=n+1;
 END LOOP;
 IF n<>4 THEN RAISE EXCEPTION 'FOLLOWUP_V3_INCOMPLETE_BATCH' USING ERRCODE='P7999'; END IF;
 RETURN n;
EXCEPTION WHEN OTHERS THEN RETURN 0;
END $enqueue$;

CREATE FUNCTION jetnity_followup_source_monitor_private.collect_v3()
 RETURNS integer LANGUAGE plpgsql VOLATILE SECURITY INVOKER SET search_path=pg_catalog
 AS $collect$
DECLARE rec record; resp record; state text; n integer:=0; source_size integer;
 fingerprint text; previous_sha text; response_seen boolean;
BEGIN
 IF session_user<>'postgres' OR current_user<>session_user THEN RETURN 0; END IF;
 FOR rec IN
   SELECT i.*,s.content_marker FROM jetnity_followup_source_monitor_private.items_v3 i
   JOIN jetnity_followup_source_monitor_private.sources_v3 s USING(destination_code)
   WHERE NOT EXISTS(SELECT 1 FROM jetnity_followup_source_monitor_private.observations_v3 o
     WHERE o.batch_id=i.batch_id AND o.destination_code=i.destination_code)
   ORDER BY i.batch_id,i.destination_code FOR UPDATE OF i SKIP LOCKED
 LOOP
  SELECT * INTO resp FROM net._http_response
    WHERE id=rec.request_id ORDER BY created DESC LIMIT 1;
  response_seen:=FOUND;
  IF NOT response_seen AND clock_timestamp()<rec.requested_at+interval '6 minutes'
    THEN CONTINUE; END IF;
  state:='http_unavailable'; source_size:=NULL; fingerprint:=NULL;
  IF response_seen AND resp.status_code=200 AND resp.timed_out IS NOT TRUE
     AND resp.error_msg IS NULL AND resp.content IS NOT NULL
     AND resp.content_type ~* '^text/html([; ]|$)' THEN
    source_size:=octet_length(convert_to(resp.content,'UTF8'));
    IF source_size BETWEEN 1 AND 1048576
       AND position(lower(rec.content_marker) IN lower(resp.content))>0
       AND position('captcha' IN lower(resp.content))=0
       AND position('radware' IN lower(resp.content))=0
       AND position('accesso negato' IN lower(resp.content))=0
       AND position('access denied' IN lower(resp.content))=0 THEN
      fingerprint:=encode(sha256(convert_to(resp.content,'UTF8')),'hex');
      SELECT source_sha256 INTO previous_sha
        FROM jetnity_followup_source_monitor_private.observations_v3
        WHERE destination_code=rec.destination_code AND source_sha256 IS NOT NULL
        ORDER BY batch_id DESC LIMIT 1;
      state:=CASE WHEN previous_sha IS NULL THEN 'unqualified_snapshot'
        WHEN previous_sha=fingerprint THEN 'unchanged_unqualified'
        ELSE 'changed_requires_review' END;
    ELSE state:='invalid_source_body'; source_size:=NULL; END IF;
  END IF;
  INSERT INTO jetnity_followup_source_monitor_private.observations_v3(
   batch_id,destination_code,observed_at,status,source_bytes,source_sha256,http_code)
  VALUES(rec.batch_id,rec.destination_code,clock_timestamp(),state,source_size,fingerprint,
     CASE WHEN response_seen THEN resp.status_code ELSE NULL END)
  ON CONFLICT DO NOTHING;
  n:=n+1;
 END LOOP;
 RETURN n;
EXCEPTION WHEN OTHERS THEN RETURN 0;
END $collect$;
REVOKE ALL ON FUNCTION jetnity_followup_source_monitor_private.enqueue_v3()
 FROM PUBLIC,anon,authenticated,service_role;
REVOKE ALL ON FUNCTION jetnity_followup_source_monitor_private.collect_v3()
 FROM PUBLIC,anon,authenticated,service_role;

-- V1/V2 histories are immutable. Only V2 scheduled jobs are retired.
DO $switch$
BEGIN
 IF NOT cron.unschedule('jetnity-followup-government-enqueue-v2-dev')
    OR NOT cron.unschedule('jetnity-followup-government-collect-v2-dev')
 THEN RAISE EXCEPTION 'FOLLOWUP_V3_OLD_JOBS_NOT_RETIRED' USING ERRCODE='P7999'; END IF;
END $switch$;
SELECT cron.schedule('jetnity-followup-government-enqueue-v3-dev',
 '11 * * * *','SELECT jetnity_followup_source_monitor_private.enqueue_v3()');
SELECT cron.schedule('jetnity-followup-government-collect-v3-dev',
 '*/5 * * * *','SELECT jetnity_followup_source_monitor_private.collect_v3()');

DO $post$
BEGIN
 IF (SELECT count(*) FROM jetnity_followup_source_monitor_private.sources_v3)<>4
 OR (SELECT count(*) FROM jetnity_followup_source_monitor_private.requests_v3)<>0
 OR (SELECT count(*) FROM jetnity_followup_source_monitor_private.observations_v1)<>4
 OR (SELECT count(*) FROM jetnity_followup_source_monitor_private.observations_v2)<>4
 OR (SELECT count(*) FROM cron.job WHERE username='postgres' AND active
   AND jobname IN('jetnity-followup-government-enqueue-v3-dev','jetnity-followup-government-collect-v3-dev'))<>2
 OR (SELECT count(*) FROM cron.job WHERE jobname IN
   ('jetnity-followup-government-enqueue-v2-dev','jetnity-followup-government-collect-v2-dev'))<>0
 OR EXISTS(SELECT 1 FROM jetnity_followup_source_monitor_private.sources_v3
   WHERE source_qualified OR approved_facts<>0)
 OR EXISTS(SELECT 1 FROM pg_class c JOIN pg_namespace n ON n.oid=c.relnamespace
   WHERE n.nspname='jetnity_followup_source_monitor_private'
     AND c.relname IN('sources_v3','requests_v3','items_v3','observations_v3')
     AND (NOT c.relrowsecurity OR NOT c.relforcerowsecurity
       OR has_table_privilege('anon',c.oid,'SELECT')
       OR has_table_privilege('authenticated',c.oid,'SELECT')
       OR has_table_privilege('service_role',c.oid,'SELECT')))
 OR public.official_v3_guard_alarm_status_v1()->>'status'<>'current'
 THEN RAISE EXCEPTION 'FOLLOWUP_V3_PRIVACY_OR_HISTORY_REFUSED' USING ERRCODE='P7999'; END IF;
 PERFORM official_v3_guard_private.assert_catalog_v1();
END $post$;
COMMIT;