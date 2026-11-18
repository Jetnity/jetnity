-- DEV ONLY: four government-source fingerprint monitors for IT/FR/ES/PT.
-- Source visibility is RESEARCH_ONLY, not MA1 approval, effective law or
-- passport-specific guidance. Each successful or failed read is append-only.
BEGIN;
SET LOCAL search_path=pg_catalog;
SET LOCAL statement_timeout='30s';
SET LOCAL lock_timeout='5s';
SET LOCAL jetnity.followup_monitor_target='dev:yfvbxvijcorffwxbxahl:FOLLOWUP-WATCH-1';
DO $pre$ BEGIN
 IF session_user<>'postgres' OR current_user<>session_user
 OR current_database()<>'postgres' OR current_setting('server_version_num')::int/10000<>17
 OR current_setting('jetnity.followup_monitor_target',true)
     IS DISTINCT FROM 'dev:yfvbxvijcorffwxbxahl:FOLLOWUP-WATCH-1'
 OR public.official_v3_guard_alarm_status_v1()->>'status'<>'current'
 OR to_regnamespace('jetnity_followup_source_monitor_private') IS NOT NULL
 OR to_regprocedure('net.http_get(text,jsonb,jsonb,integer)') IS NULL
 OR (SELECT count(*) FROM jetnity_followup_primary_private.passport_scope_v1)<>200
 OR (SELECT count(*) FROM jetnity_followup_primary_private.sources_v1)<>13
 OR EXISTS(SELECT 1 FROM jetnity_followup_primary_private.sources_v1
    WHERE publication_allowed OR source_qualified OR original_body_sha256 IS NOT NULL)
 OR NOT pg_try_advisory_xact_lock(771110,1)
 THEN RAISE EXCEPTION 'FOLLOWUP_WATCH_DEV_PREDECESSOR_REFUSED'
    USING ERRCODE='P7997'; END IF;
 PERFORM official_v3_guard_private.assert_catalog_v1();
END $pre$;
CREATE SCHEMA jetnity_followup_source_monitor_private AUTHORIZATION postgres;
REVOKE ALL ON SCHEMA jetnity_followup_source_monitor_private
 FROM PUBLIC,anon,authenticated,service_role;
CREATE TABLE jetnity_followup_source_monitor_private.sources_v1(
 destination_code text PRIMARY KEY CHECK(destination_code IN ('IT','FR','ES','PT')),
 authority text NOT NULL,
 official_url text NOT NULL UNIQUE CHECK(official_url LIKE 'https://%'),
 content_marker text NOT NULL,
 raw_source_approved boolean NOT NULL DEFAULT false CHECK(raw_source_approved=false),
 legal_fact_approved boolean NOT NULL DEFAULT false CHECK(legal_fact_approved=false));
INSERT INTO jetnity_followup_source_monitor_private.sources_v1
 (destination_code,authority,official_url,content_marker) VALUES
 ('IT','MAECI','https://www.esteri.it/it/servizi-opportunita/ingressosoggiornoinitalia/visto_ingresso/paesi_esenti_visto/','Paesi i cui cittadini'),
 ('FR','France-Visas','https://france-visas.gouv.fr/web/france-visas/visa-de-court-sejour','visa'),
 ('ES','Ministerio del Interior','https://www.interior.gob.es/opencms/es/servicios-al-ciudadano/tramites-y-gestiones/extranjeria/ciudadanos-de-la-union-europea/entrada-y-salida/','Entrada'),
 ('PT','gov.pt','https://www.gov.pt/guias/entrar-e-sair-de-portugal','Portugal');
CREATE TABLE jetnity_followup_source_monitor_private.requests_v1(
 request_batch bigint GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
 requested_at timestamptz NOT NULL DEFAULT clock_timestamp(),
 source_count integer NOT NULL DEFAULT 4 CHECK(source_count=4));
CREATE TABLE jetnity_followup_source_monitor_private.items_v1(
 request_batch bigint NOT NULL REFERENCES jetnity_followup_source_monitor_private.requests_v1(request_batch),
 destination_code text NOT NULL REFERENCES jetnity_followup_source_monitor_private.sources_v1(destination_code),
 request_id bigint NOT NULL UNIQUE,
 requested_at timestamptz NOT NULL,
 PRIMARY KEY(request_batch,destination_code));
CREATE TABLE jetnity_followup_source_monitor_private.observations_v1(
 request_batch bigint NOT NULL,
 destination_code text NOT NULL,
 observed_at timestamptz NOT NULL,
 status text NOT NULL CHECK(status IN
 ('unqualified_snapshot','unchanged_unqualified','changed_requires_review',
 'http_unavailable','invalid_source_body')),
 source_sha256 text CHECK(source_sha256 IS NULL OR source_sha256~'^[a-f0-9]{64}$'),
 source_bytes integer CHECK(source_bytes IS NULL OR source_bytes BETWEEN 1 AND 1048576),
 http_code integer,
 PRIMARY KEY(request_batch,destination_code),
 FOREIGN KEY(request_batch,destination_code)
 REFERENCES jetnity_followup_source_monitor_private.items_v1(request_batch,destination_code),
 CHECK ((status IN ('unqualified_snapshot','unchanged_unqualified','changed_requires_review'))
 = (source_sha256 IS NOT NULL AND source_bytes IS NOT NULL)),
 CHECK(status <> 'http_unavailable' OR source_sha256 IS NULL));
CREATE FUNCTION jetnity_followup_source_monitor_private.no_mutation_v1()
 RETURNS trigger LANGUAGE plpgsql VOLATILE SECURITY INVOKER SET search_path=pg_catalog AS $deny$
BEGIN RAISE EXCEPTION 'FOLLOWUP_WATCH_APPEND_ONLY' USING ERRCODE='P7998'; END $deny$;
REVOKE ALL ON FUNCTION jetnity_followup_source_monitor_private.no_mutation_v1()
 FROM PUBLIC,anon,authenticated,service_role;
DO $priv$ DECLARE t text; BEGIN
 FOREACH t IN ARRAY ARRAY['sources_v1','requests_v1','items_v1','observations_v1'] LOOP
  EXECUTE format('ALTER TABLE jetnity_followup_source_monitor_private.%I ENABLE ROW LEVEL SECURITY',t);
  EXECUTE format('ALTER TABLE jetnity_followup_source_monitor_private.%I FORCE ROW LEVEL SECURITY',t);
  EXECUTE format('CREATE POLICY postgres_only ON jetnity_followup_source_monitor_private.%I TO postgres USING(true) WITH CHECK(true)',t);
  EXECUTE format('CREATE TRIGGER no_row_mutation BEFORE UPDATE OR DELETE ON jetnity_followup_source_monitor_private.%I FOR EACH ROW EXECUTE FUNCTION jetnity_followup_source_monitor_private.no_mutation_v1()',t);
  EXECUTE format('CREATE TRIGGER no_truncate BEFORE TRUNCATE ON jetnity_followup_source_monitor_private.%I FOR EACH STATEMENT EXECUTE FUNCTION jetnity_followup_source_monitor_private.no_mutation_v1()',t);
 END LOOP;
END $priv$;
REVOKE ALL ON ALL TABLES IN SCHEMA jetnity_followup_source_monitor_private
 FROM PUBLIC,anon,authenticated,service_role;
REVOKE ALL ON ALL SEQUENCES IN SCHEMA jetnity_followup_source_monitor_private
 FROM PUBLIC,anon,authenticated,service_role;
CREATE FUNCTION jetnity_followup_source_monitor_private.enqueue_v1()
RETURNS integer LANGUAGE plpgsql VOLATILE SECURITY INVOKER
SET search_path=pg_catalog AS $enqueue$
DECLARE s record; batch bigint; n integer:=0; now_at timestamptz;
BEGIN
 IF session_user<>'postgres' OR current_user<>session_user
 OR public.official_v3_guard_alarm_status_v1()->>'status'<>'current'
 THEN RETURN 0; END IF;
 IF NOT pg_try_advisory_xact_lock(771110,2) THEN RETURN 0; END IF;
 IF (SELECT max(requested_at) FROM jetnity_followup_source_monitor_private.requests_v1)
    >clock_timestamp()-interval '50 minutes' THEN RETURN 0; END IF;
 now_at:=clock_timestamp();
 INSERT INTO jetnity_followup_source_monitor_private.requests_v1(requested_at)
 VALUES(now_at) RETURNING request_batch INTO batch;
 FOR s IN SELECT destination_code,official_url FROM
   jetnity_followup_source_monitor_private.sources_v1 ORDER BY destination_code LOOP
   INSERT INTO jetnity_followup_source_monitor_private.items_v1
    (request_batch,destination_code,request_id,requested_at)
   VALUES(batch,s.destination_code,net.http_get(s.official_url,'{}'::jsonb,
       '{"accept":"text/html"}'::jsonb,15000),now_at);
   n:=n+1;
 END LOOP;
 IF n<>4 THEN RAISE EXCEPTION 'FOLLOWUP_WATCH_INCOMPLETE_BATCH' USING ERRCODE='P7997'; END IF;
 RETURN n;
EXCEPTION WHEN OTHERS THEN RETURN 0;
END $enqueue$;
CREATE FUNCTION jetnity_followup_source_monitor_private.collect_v1()
RETURNS integer LANGUAGE plpgsql VOLATILE SECURITY INVOKER
SET search_path=pg_catalog AS $collect$
DECLARE item record; response record; state text; bytes integer; digest text;
 prior text; marked boolean; n integer:=0; has_response boolean;
BEGIN
 IF session_user<>'postgres' OR current_user<>session_user THEN RETURN 0; END IF;
 FOR item IN SELECT i.*,s.content_marker
 FROM jetnity_followup_source_monitor_private.items_v1 i
 JOIN jetnity_followup_source_monitor_private.sources_v1 s USING(destination_code)
 WHERE NOT EXISTS(SELECT 1 FROM jetnity_followup_source_monitor_private.observations_v1 o
     WHERE o.request_batch=i.request_batch AND o.destination_code=i.destination_code)
 ORDER BY i.request_batch,i.destination_code FOR UPDATE OF i SKIP LOCKED
 LOOP
  SELECT * INTO response FROM net._http_response
    WHERE id=item.request_id ORDER BY created DESC LIMIT 1;
  has_response:=FOUND;
  IF NOT has_response AND clock_timestamp()<item.requested_at+interval '6 minutes'
  THEN CONTINUE; END IF;
  state:='http_unavailable';bytes:=NULL;digest:=NULL;marked:=false;
  IF has_response AND response.status_code=200 AND response.timed_out IS NOT TRUE
    AND response.error_msg IS NULL AND response.content IS NOT NULL
    AND response.content_type~*'^text/html([; ]|$)' THEN
    bytes:=octet_length(convert_to(response.content,'UTF8'));
    IF bytes BETWEEN 1 AND 1048576 THEN
      marked:=position(lower(item.content_marker) IN lower(response.content))>0;
      IF marked THEN
       digest:=encode(sha256(convert_to(response.content,'UTF8')),'hex');
       SELECT o.source_sha256 INTO prior
       FROM jetnity_followup_source_monitor_private.observations_v1 o
       WHERE o.destination_code=item.destination_code AND o.source_sha256 IS NOT NULL
       ORDER BY o.request_batch DESC LIMIT 1;
       state:=CASE WHEN prior IS NULL THEN 'unqualified_snapshot'
       WHEN prior=digest THEN 'unchanged_unqualified'
       ELSE 'changed_requires_review' END;
      ELSE
       state:='invalid_source_body';bytes:=NULL;
      END IF;
    ELSE state:='invalid_source_body';bytes:=NULL; END IF;
  END IF;
  INSERT INTO jetnity_followup_source_monitor_private.observations_v1(
    request_batch,destination_code,observed_at,status,source_sha256,source_bytes,http_code)
  VALUES(item.request_batch,item.destination_code,clock_timestamp(),state,digest,bytes,
     CASE WHEN has_response THEN response.status_code ELSE NULL END)
  ON CONFLICT DO NOTHING;
  n:=n+1;
 END LOOP;
 RETURN n;
EXCEPTION WHEN OTHERS THEN RETURN 0;
END $collect$;
REVOKE ALL ON FUNCTION jetnity_followup_source_monitor_private.enqueue_v1()
 FROM PUBLIC,anon,authenticated,service_role;
REVOKE ALL ON FUNCTION jetnity_followup_source_monitor_private.collect_v1()
 FROM PUBLIC,anon,authenticated,service_role;
SELECT cron.schedule('jetnity-followup-government-enqueue-dev-v1','11 * * * *',
 'SELECT jetnity_followup_source_monitor_private.enqueue_v1()');
SELECT cron.schedule('jetnity-followup-government-collect-dev-v1','*/5 * * * *',
 'SELECT jetnity_followup_source_monitor_private.collect_v1()');
DO $post$
BEGIN
 IF (SELECT count(*) FROM jetnity_followup_source_monitor_private.sources_v1)<>4
 OR (SELECT count(*) FROM jetnity_followup_source_monitor_private.requests_v1)<>0
 OR (SELECT count(*) FROM jetnity_followup_source_monitor_private.observations_v1)<>0
 OR (SELECT count(*) FROM cron.job
     WHERE jobname IN ('jetnity-followup-government-enqueue-dev-v1','jetnity-followup-government-collect-dev-v1')
       AND username='postgres' AND active)<>2
 OR EXISTS(SELECT 1 FROM jetnity_followup_source_monitor_private.sources_v1
    WHERE raw_source_approved OR legal_fact_approved)
 OR EXISTS(SELECT 1 FROM pg_class c JOIN pg_namespace n ON n.oid=c.relnamespace
    WHERE n.nspname='jetnity_followup_source_monitor_private' AND c.relkind='r'
    AND (NOT c.relrowsecurity OR NOT c.relforcerowsecurity
      OR has_table_privilege('anon',c.oid,'SELECT')
      OR has_table_privilege('authenticated',c.oid,'SELECT')
      OR has_table_privilege('service_role',c.oid,'SELECT')))
 OR public.official_v3_guard_alarm_status_v1()->>'status'<>'current'
 THEN RAISE EXCEPTION 'FOLLOWUP_WATCH_PRIVACY_OR_GUARD_REFUSED'
 USING ERRCODE='P7997'; END IF;
 PERFORM official_v3_guard_private.assert_catalog_v1();
END $post$;
COMMIT;