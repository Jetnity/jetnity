-- DEV ONLY: append-only source monitor V2 after independent actual 403
-- responses from FR/ES official portals. V1 receipts remain immutable and
-- the original V1 Cron jobs are retired atomically after this new owner.
-- IT/PT URLs remain; FR uses France official Service-Public (DILA), ES the
-- Spanish official BOE legal text. These are research ONLY, NOT law approval.
BEGIN;
SET LOCAL search_path=pg_catalog;
SET LOCAL statement_timeout='30s';
SET LOCAL lock_timeout='5s';
SET LOCAL jetnity.followup_monitor_v2_target='dev:yfvbxvijcorffwxbxahl:FOLLOWUP-WATCH-2';
DO $pre$
BEGIN
 IF session_user<>'postgres' OR current_user<>session_user
 OR current_database()<>'postgres' OR current_setting('server_version_num')::int/10000<>17
 OR current_setting('jetnity.followup_monitor_v2_target',true)
     IS DISTINCT FROM 'dev:yfvbxvijcorffwxbxahl:FOLLOWUP-WATCH-2'
 OR public.official_v3_guard_alarm_status_v1()->>'status'<>'current'
 OR to_regclass('jetnity_followup_source_monitor_private.sources_v2') IS NOT NULL
 OR to_regprocedure('net.http_get(text,jsonb,jsonb,integer)') IS NULL
 OR (SELECT count(*) FROM jetnity_followup_source_monitor_private.sources_v1)<>4
 OR (SELECT count(*) FROM jetnity_followup_source_monitor_private.requests_v1)<>1
 OR (SELECT count(*) FROM jetnity_followup_source_monitor_private.observations_v1)<>4
 OR (SELECT count(*) FROM jetnity_followup_source_monitor_private.observations_v1
    WHERE destination_code IN ('FR','ES')
      AND status='http_unavailable' AND http_code=403)<>2
 OR (SELECT count(*) FROM jetnity_followup_source_monitor_private.observations_v1
    WHERE destination_code IN ('IT','PT')
      AND status='unqualified_snapshot' AND http_code=200)<>2
 OR (SELECT count(*) FROM cron.job WHERE jobname IN
  ('jetnity-followup-government-enqueue-dev-v1','jetnity-followup-government-collect-dev-v1')
     AND active AND username='postgres')<>2
 OR EXISTS(SELECT 1 FROM jetnity_followup_source_monitor_private.sources_v1
    WHERE raw_source_approved OR legal_fact_approved)
 OR NOT pg_try_advisory_xact_lock(771110,3)
 THEN RAISE EXCEPTION 'FOLLOWUP_SOURCE_V2_EXACT_PREDECESSOR_REFUSED'
 USING ERRCODE='P7999'; END IF;
 PERFORM official_v3_guard_private.assert_catalog_v1();
END $pre$;

-- V1 sources, queue, receipts, append-only triggers and RLS stay unchanged.
CREATE TABLE jetnity_followup_source_monitor_private.sources_v2(
 destination_code text PRIMARY KEY CHECK(destination_code IN('IT','FR','ES','PT')),
 authority text NOT NULL,
 official_url text NOT NULL UNIQUE CHECK(official_url LIKE 'https://%'),
 content_marker text NOT NULL,
 source_revision integer NOT NULL DEFAULT 2 CHECK(source_revision=2),
 source_qualified boolean NOT NULL DEFAULT false CHECK(source_qualified=false),
 legal_fact_approved boolean NOT NULL DEFAULT false CHECK(legal_fact_approved=false));
INSERT INTO jetnity_followup_source_monitor_private.sources_v2
(destination_code,authority,official_url,content_marker) VALUES
 ('IT','MAECI','https://www.esteri.it/it/servizi-opportunita/ingressosoggiornoinitalia/visto_ingresso/paesi_esenti_visto/','Paesi i cui cittadini'),
 ('FR','DILA / Service-Public','https://www.service-public.gouv.fr/particuliers/vosdroits/F13512','Suisse'),
 ('ES','BOE / Gobierno de España','https://www.boe.es/eli/es/rd/2007/02/16/240','Entrada'),
 ('PT','gov.pt','https://www.gov.pt/guias/entrar-e-sair-de-portugal','Portugal');
CREATE TABLE jetnity_followup_source_monitor_private.requests_v2(
 batch bigint GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
 requested_at timestamptz NOT NULL DEFAULT clock_timestamp(),
 source_count integer NOT NULL DEFAULT 4 CHECK(source_count=4));
CREATE TABLE jetnity_followup_source_monitor_private.items_v2(
 batch bigint NOT NULL REFERENCES jetnity_followup_source_monitor_private.requests_v2(batch),
 destination_code text NOT NULL REFERENCES jetnity_followup_source_monitor_private.sources_v2(destination_code),
 pgnet_request_id bigint NOT NULL UNIQUE,
 requested_at timestamptz NOT NULL,
 PRIMARY KEY(batch,destination_code));
CREATE TABLE jetnity_followup_source_monitor_private.observations_v2(
 batch bigint NOT NULL,
 destination_code text NOT NULL,
 observed_at timestamptz NOT NULL,
 status text NOT NULL CHECK(status IN
 ('unqualified_snapshot','unchanged_unqualified','changed_requires_review',
  'http_unavailable','invalid_source_body')),
 source_sha256 text CHECK(source_sha256 IS NULL OR source_sha256~'^[a-f0-9]{64}$'),
 source_bytes integer CHECK(source_bytes IS NULL OR source_bytes BETWEEN 1 AND 1048576),
 http_code integer,
 PRIMARY KEY(batch,destination_code),
 FOREIGN KEY(batch,destination_code) REFERENCES
   jetnity_followup_source_monitor_private.items_v2(batch,destination_code),
 CHECK ((status IN('unqualified_snapshot','unchanged_unqualified','changed_requires_review'))
  = (source_sha256 IS NOT NULL AND source_bytes IS NOT NULL)),
 CHECK(status<>'http_unavailable' OR source_sha256 IS NULL));

DO $privacy$ DECLARE t text; BEGIN
 FOREACH t IN ARRAY ARRAY['sources_v2','requests_v2','items_v2','observations_v2'] LOOP
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

CREATE FUNCTION jetnity_followup_source_monitor_private.enqueue_v2()
 RETURNS integer LANGUAGE plpgsql VOLATILE SECURITY INVOKER
 SET search_path=pg_catalog AS $enqueue$
DECLARE s record; id bigint; n integer:=0; instant timestamptz;
BEGIN
 IF session_user<>'postgres' OR current_user<>session_user
 OR public.official_v3_guard_alarm_status_v1()->>'status'<>'current'
 THEN RETURN 0; END IF;
 IF NOT pg_try_advisory_xact_lock(771110,4) THEN RETURN 0; END IF;
 IF (SELECT max(requested_at) FROM jetnity_followup_source_monitor_private.requests_v2)
    >clock_timestamp()-interval '50 minutes' THEN RETURN 0; END IF;
 instant:=clock_timestamp();
 INSERT INTO jetnity_followup_source_monitor_private.requests_v2(requested_at)
 VALUES(instant) RETURNING batch INTO id;
 FOR s IN SELECT destination_code,official_url
  FROM jetnity_followup_source_monitor_private.sources_v2 ORDER BY destination_code LOOP
   INSERT INTO jetnity_followup_source_monitor_private.items_v2
    (batch,destination_code,pgnet_request_id,requested_at)
   VALUES(id,s.destination_code,net.http_get(s.official_url,'{}'::jsonb,
     '{"accept":"text/html"}'::jsonb,15000),instant);
   n:=n+1;
 END LOOP;
 IF n<>4 THEN RAISE EXCEPTION 'SOURCE_V2_INCOMPLETE_NETWORK_BATCH'; END IF;
 RETURN n;
EXCEPTION WHEN OTHERS THEN RETURN 0;
END $enqueue$;

CREATE FUNCTION jetnity_followup_source_monitor_private.collect_v2()
 RETURNS integer LANGUAGE plpgsql VOLATILE SECURITY INVOKER
 SET search_path=pg_catalog AS $collect$
DECLARE item record; resp record; state text; sz integer; sh text;
 prior text; got boolean; n integer:=0;
BEGIN
 IF session_user<>'postgres' OR current_user<>session_user THEN RETURN 0; END IF;
 FOR item IN SELECT i.*,s.content_marker
 FROM jetnity_followup_source_monitor_private.items_v2 i
 JOIN jetnity_followup_source_monitor_private.sources_v2 s USING(destination_code)
 WHERE NOT EXISTS(SELECT 1 FROM jetnity_followup_source_monitor_private.observations_v2 o
   WHERE o.batch=i.batch AND o.destination_code=i.destination_code)
 ORDER BY i.batch,i.destination_code FOR UPDATE OF i SKIP LOCKED LOOP
   SELECT * INTO resp FROM net._http_response WHERE id=item.pgnet_request_id
      ORDER BY created DESC LIMIT 1;
   got:=FOUND;
   IF NOT got AND clock_timestamp()<item.requested_at+interval '6 minutes' THEN CONTINUE; END IF;
   state:='http_unavailable';sz:=NULL;sh:=NULL;
   IF got AND resp.status_code=200 AND resp.timed_out IS NOT TRUE
      AND resp.error_msg IS NULL AND resp.content IS NOT NULL
      AND resp.content_type~*'^text/html([; ]|$)' THEN
      sz:=octet_length(convert_to(resp.content,'UTF8'));
      IF sz BETWEEN 1 AND 1048576
        AND position(lower(item.content_marker) IN lower(resp.content))>0 THEN
        sh:=encode(sha256(convert_to(resp.content,'UTF8')),'hex');
        SELECT source_sha256 INTO prior
        FROM jetnity_followup_source_monitor_private.observations_v2
        WHERE destination_code=item.destination_code AND source_sha256 IS NOT NULL
        ORDER BY batch DESC LIMIT 1;
        state:=CASE WHEN prior IS NULL THEN 'unqualified_snapshot'
          WHEN prior=sh THEN 'unchanged_unqualified'
          ELSE 'changed_requires_review' END;
      ELSE state:='invalid_source_body';sz:=NULL; END IF;
   END IF;
   INSERT INTO jetnity_followup_source_monitor_private.observations_v2
    (batch,destination_code,observed_at,status,source_sha256,source_bytes,http_code)
   VALUES(item.batch,item.destination_code,clock_timestamp(),state,sh,sz,
       CASE WHEN got THEN resp.status_code ELSE NULL END)
   ON CONFLICT DO NOTHING;
   n:=n+1;
 END LOOP;
 RETURN n;
EXCEPTION WHEN OTHERS THEN RETURN 0;
END $collect$;
REVOKE ALL ON FUNCTION jetnity_followup_source_monitor_private.enqueue_v2()
 FROM PUBLIC,anon,authenticated,service_role;
REVOKE ALL ON FUNCTION jetnity_followup_source_monitor_private.collect_v2()
 FROM PUBLIC,anon,authenticated,service_role;

-- Atomically retire the exact previous research monitor schedule; V1 tables
-- and every historical receipt remain immutable and independently inspectable.
DO $switch$
BEGIN
 IF NOT cron.unschedule('jetnity-followup-government-enqueue-dev-v1')
 OR NOT cron.unschedule('jetnity-followup-government-collect-dev-v1') THEN
 RAISE EXCEPTION 'SOURCE_V2_OLD_CRON_NOT_RETIRED' USING ERRCODE='P7999'; END IF;
END $switch$;
SELECT cron.schedule('jetnity-followup-government-enqueue-v2-dev','11 * * * *',
 'SELECT jetnity_followup_source_monitor_private.enqueue_v2()');
SELECT cron.schedule('jetnity-followup-government-collect-v2-dev','*/5 * * * *',
 'SELECT jetnity_followup_source_monitor_private.collect_v2()');
DO $post$
BEGIN
 IF (SELECT count(*) FROM jetnity_followup_source_monitor_private.sources_v2)<>4
 OR (SELECT count(*) FROM jetnity_followup_source_monitor_private.requests_v2)<>0
 OR (SELECT count(*) FROM jetnity_followup_source_monitor_private.observations_v2)<>0
 OR (SELECT count(*) FROM jetnity_followup_source_monitor_private.observations_v1)<>4
 OR (SELECT count(*) FROM cron.job WHERE jobname IN
  ('jetnity-followup-government-enqueue-v2-dev','jetnity-followup-government-collect-v2-dev')
    AND active AND username='postgres')<>2
 OR (SELECT count(*) FROM cron.job WHERE jobname IN
   ('jetnity-followup-government-enqueue-dev-v1','jetnity-followup-government-collect-dev-v1'))<>0
 OR EXISTS(SELECT 1 FROM jetnity_followup_source_monitor_private.sources_v2
   WHERE source_qualified OR legal_fact_approved)
 OR EXISTS(SELECT 1 FROM pg_class c JOIN pg_namespace n ON n.oid=c.relnamespace
  WHERE n.nspname='jetnity_followup_source_monitor_private'
   AND c.relname IN ('sources_v2','requests_v2','items_v2','observations_v2')
   AND (NOT c.relrowsecurity OR NOT c.relforcerowsecurity
   OR has_table_privilege('anon',c.oid,'SELECT')
   OR has_table_privilege('authenticated',c.oid,'SELECT')
   OR has_table_privilege('service_role',c.oid,'SELECT')))
 OR public.official_v3_guard_alarm_status_v1()->>'status'<>'current'
 THEN RAISE EXCEPTION 'SOURCE_V2_HISTORY_OR_SECURITY_NOT_PRESERVED'
  USING ERRCODE='P7999'; END IF;
 PERFORM official_v3_guard_private.assert_catalog_v1();
END $post$;
COMMIT;