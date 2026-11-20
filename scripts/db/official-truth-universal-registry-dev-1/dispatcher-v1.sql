-- DEV ONLY. Generic HTTP scheduler for vetted registry hosts and sources.
-- Existing AT/SIX/FOUR/USAGov monitors stay active; NO legal publishing.
-- One existing Cron job, no new roles, no external keys.
BEGIN;
SET LOCAL search_path=pg_catalog;
SET LOCAL statement_timeout='45s';
SET LOCAL lock_timeout='5s';
SET LOCAL idle_in_transaction_session_timeout='50s';
SET LOCAL jetnity.dispatch_target='dev:yfvbxvijcorffwxbxahl:REGISTRY-DISPATCH-V1';

DO $gate$
BEGIN
 IF session_user<>'postgres' OR current_user<>session_user
 OR current_database()<>'postgres'
 OR current_setting('server_version_num')::integer/10000<>17
 OR current_setting('jetnity.dispatch_target',true)
   IS DISTINCT FROM 'dev:yfvbxvijcorffwxbxahl:REGISTRY-DISPATCH-V1'
 OR public.official_v3_guard_alarm_status_v1()->>'status'<>'current'
 OR to_regnamespace('jetnity_source_dispatch_private') IS NOT NULL
 OR (SELECT count(*) FROM jetnity_source_registry_private.sources_v1)<>19
 OR (SELECT count(*) FROM jetnity_source_registry_private.sources_v1
      WHERE monitor_family='GENERIC')<>0
 OR (SELECT count(*) FROM jetnity_global_research_private.cases_v1)<>10300
 OR EXISTS(SELECT 1 FROM jetnity_global_research_private.cases_v1
      WHERE legal_rule_qualified OR publication_allowed OR accepted_fact_count<>0)
 OR (SELECT count(*) FROM cron.job WHERE jobname='jetnity-global-source-review-queue-dev'
     AND active AND username='postgres' AND database='postgres'
     AND schedule='*/5 * * * *'
     AND command='SELECT jetnity_usagov_watch_private.tick_v1()')<>1
 OR pg_database_size(current_database())>=268435456
 OR NOT pg_try_advisory_xact_lock(771115,765)
 THEN RAISE EXCEPTION 'REGISTRY_DISPATCH_DEV_PREDECESSOR_REQUIRED' USING ERRCODE='P7992'; END IF;
 PERFORM official_v3_guard_private.assert_catalog_v1();
END $gate$;

CREATE SCHEMA jetnity_source_dispatch_private AUTHORIZATION postgres;
REVOKE ALL ON SCHEMA jetnity_source_dispatch_private FROM PUBLIC,anon,authenticated,service_role;

CREATE FUNCTION jetnity_source_dispatch_private.deny_mutation_v1()
 RETURNS trigger LANGUAGE plpgsql SECURITY INVOKER SET search_path=pg_catalog AS $deny$
BEGIN RAISE EXCEPTION 'REGISTRY_DISPATCH_APPEND_ONLY' USING ERRCODE='P7992'; END $deny$;

-- A separate operator-reviewed HOST admission is necessary before pg_net
-- may fetch a registered generic URL. The registry alone does not authorize
-- HTTP egress. This is network permission, NOT official provenance/visa proof.
CREATE TABLE jetnity_source_dispatch_private.research_hosts_v1(
 destination_code text NOT NULL REFERENCES jetnity_global_research_private.destinations_v1(destination_code),
 hostname text NOT NULL CHECK(
  hostname ~ '^[a-z0-9-]+(\.[a-z0-9-]+)+$'
  AND length(hostname) BETWEEN 5 AND 200
  AND hostname NOT IN('localhost','localhost.localdomain')
  AND hostname !~ '(^|\.)(local|internal|test|example|invalid)$'
  AND hostname !~ '(^|\.)(localhost|metadata|169-254-169-254)$'
  AND hostname !~ '^[0-9.]+$'
 ),
 reviewer_class text NOT NULL DEFAULT 'POSTGRES_OPERATOR_SOURCE_REVIEW'
  CHECK(reviewer_class='POSTGRES_OPERATOR_SOURCE_REVIEW'),
 legal_identity_verified boolean NOT NULL DEFAULT false CHECK(NOT legal_identity_verified),
 publication_allowed boolean NOT NULL DEFAULT false CHECK(NOT publication_allowed),
 registered_at timestamptz NOT NULL DEFAULT clock_timestamp(),
 PRIMARY KEY(destination_code,hostname)
);
CREATE TABLE jetnity_source_dispatch_private.research_admissions_v1(
 source_id text PRIMARY KEY REFERENCES jetnity_source_registry_private.sources_v1(source_id),
 destination_code text NOT NULL,
 hostname text NOT NULL,
 exact_url text NOT NULL,
 url_sha text NOT NULL CHECK(url_sha~'^[a-f0-9]{64}$'),
 admitted_at timestamptz NOT NULL DEFAULT clock_timestamp(),
 research_only boolean NOT NULL DEFAULT true CHECK(research_only),
 legal_rule_qualified boolean NOT NULL DEFAULT false CHECK(NOT legal_rule_qualified),
 publication_allowed boolean NOT NULL DEFAULT false CHECK(NOT publication_allowed),
 FOREIGN KEY(destination_code,hostname)
  REFERENCES jetnity_source_dispatch_private.research_hosts_v1(destination_code,hostname),
 CHECK(url_sha=encode(sha256(convert_to(exact_url,'UTF8')),'hex')),
 CHECK(split_part(exact_url,'/',3)=hostname)
);
CREATE TABLE jetnity_source_dispatch_private.requests_v1(
 request_id bigint PRIMARY KEY CHECK(request_id>0),
 source_id text NOT NULL REFERENCES jetnity_source_dispatch_private.research_admissions_v1(source_id),
 requested_at timestamptz NOT NULL DEFAULT clock_timestamp(),
 research_only boolean NOT NULL DEFAULT true CHECK(research_only)
);
CREATE INDEX requests_source_requested ON jetnity_source_dispatch_private.requests_v1(source_id,requested_at DESC);
CREATE TABLE jetnity_source_dispatch_private.observations_v1(
 request_id bigint PRIMARY KEY REFERENCES jetnity_source_dispatch_private.requests_v1(request_id),
 observed_at timestamptz NOT NULL DEFAULT clock_timestamp(),
 result text NOT NULL CHECK(result IN('UNQUALIFIED_FIRST','UNQUALIFIED_SAME','CHANGED_REQUIRES_REVIEW','SOURCE_UNAVAILABLE','REJECTED_HTML','COLLECTION_TIMEOUT')),
 http_code integer CHECK(http_code IS NULL OR http_code BETWEEN 100 AND 599),
 body_bytes integer,
 raw_sha text,
 original_html bytea,
 research_only boolean NOT NULL DEFAULT true CHECK(research_only),
 source_verified boolean NOT NULL DEFAULT false CHECK(NOT source_verified),
 legal_rule_qualified boolean NOT NULL DEFAULT false CHECK(NOT legal_rule_qualified),
 publication_allowed boolean NOT NULL DEFAULT false CHECK(NOT publication_allowed),
 accepted_fact_count integer NOT NULL DEFAULT 0 CHECK(accepted_fact_count=0),
 CHECK (
  (result IN('UNQUALIFIED_FIRST','UNQUALIFIED_SAME','CHANGED_REQUIRES_REVIEW')
   AND http_code=200 AND original_html IS NOT NULL
   AND body_bytes=octet_length(original_html)
   AND body_bytes BETWEEN 1000 AND 131072
   AND raw_sha=encode(sha256(original_html),'hex'))
  OR
  (result IN('SOURCE_UNAVAILABLE','REJECTED_HTML','COLLECTION_TIMEOUT')
   AND original_html IS NULL AND body_bytes IS NULL AND raw_sha IS NULL)
 )
);

-- The exact host must have been independently registered by postgres. A
-- new country needs only data intake and host review, never a country script.
CREATE FUNCTION jetnity_source_dispatch_private.admit_host_v1(
 p_country text,p_hostname text)
 RETURNS text LANGUAGE plpgsql SECURITY INVOKER SET search_path=pg_catalog AS $host$
BEGIN
 IF session_user<>'postgres' OR current_user<>session_user
 OR public.official_v3_guard_alarm_status_v1()->>'status'<>'current'
 OR p_country IS NULL OR p_country !~ '^[A-Z]{2}$'
 OR p_hostname IS NULL OR p_hostname !~ '^[a-z0-9-]+(\.[a-z0-9-]+)+$'
 OR length(p_hostname) NOT BETWEEN 5 AND 200
 OR p_hostname ~ '(^|\.)(local|internal|test|example|invalid|localhost|metadata)$'
 OR p_hostname ~ '^[0-9.]+$'
 OR NOT EXISTS(SELECT 1 FROM jetnity_global_research_private.destinations_v1 WHERE destination_code=p_country)
 OR NOT pg_try_advisory_xact_lock(771115,766)
 THEN RAISE EXCEPTION 'REGISTRY_HOST_NOT_ADMITTED' USING ERRCODE='P7992'; END IF;
 INSERT INTO jetnity_source_dispatch_private.research_hosts_v1(destination_code,hostname)
 VALUES(p_country,p_hostname);
 RETURN p_country||':'||p_hostname;
END $host$;

CREATE FUNCTION jetnity_source_dispatch_private.admit_source_v1(
 p_source_id text,p_expected_url text)
 RETURNS text LANGUAGE plpgsql SECURITY INVOKER SET search_path=pg_catalog AS $source$
DECLARE s record; host text;
BEGIN
 IF session_user<>'postgres' OR current_user<>session_user
 OR public.official_v3_guard_alarm_status_v1()->>'status'<>'current'
 OR p_source_id IS NULL OR p_expected_url IS NULL
 OR NOT pg_try_advisory_xact_lock(771115,767)
 THEN RAISE EXCEPTION 'REGISTRY_SOURCE_ADMISSION_REFUSED' USING ERRCODE='P7992'; END IF;
 SELECT * INTO STRICT s FROM jetnity_source_registry_private.sources_v1
 WHERE source_id=p_source_id AND official_url=p_expected_url
 AND monitor_family='GENERIC' AND migration_state='REGISTERED_RESEARCH_ONLY'
 AND research_only AND NOT legal_rule_qualified AND NOT publication_allowed
 AND NOT source_custody_verified AND accepted_facts=0;
 host:=split_part(s.official_url,'/',3);
 IF s.official_url NOT LIKE 'https://%'
 OR NOT EXISTS(SELECT 1 FROM jetnity_source_dispatch_private.research_hosts_v1 h
   WHERE h.destination_code=s.destination_code AND h.hostname=host
    AND NOT h.legal_identity_verified AND NOT h.publication_allowed)
 THEN RAISE EXCEPTION 'REGISTRY_SOURCE_HOST_UNREVIEWED' USING ERRCODE='P7992'; END IF;
 INSERT INTO jetnity_source_dispatch_private.research_admissions_v1(
  source_id,destination_code,hostname,exact_url,url_sha)
 VALUES(s.source_id,s.destination_code,host,s.official_url,
  encode(sha256(convert_to(s.official_url,'UTF8')),'hex'));
 RETURN s.source_id;
EXCEPTION WHEN no_data_found OR too_many_rows THEN
 RAISE EXCEPTION 'REGISTRY_SOURCE_NOT_FOUND_OR_AMBIGUOUS' USING ERRCODE='P7992';
END $source$;

CREATE FUNCTION jetnity_source_dispatch_private.enqueue_v1()
 RETURNS integer LANGUAGE plpgsql SECURITY INVOKER SET search_path=pg_catalog AS $enqueue$
DECLARE candidate record; new_id bigint;
BEGIN
 IF session_user<>'postgres' OR current_user<>session_user
 OR public.official_v3_guard_alarm_status_v1()->>'status'<>'current'
 OR NOT pg_try_advisory_xact_lock(771115,768)
 OR pg_database_size(current_database())>=268435456
 OR (SELECT count(*) FROM jetnity_source_dispatch_private.requests_v1)>=3000
 OR (SELECT coalesce(sum(body_bytes),0) FROM jetnity_source_dispatch_private.observations_v1)>33554432
 OR EXISTS(SELECT 1 FROM jetnity_global_research_private.cases_v1
   WHERE legal_rule_qualified OR publication_allowed OR accepted_fact_count<>0)
 THEN RETURN 0; END IF;
 SELECT s.source_id,s.official_url,s.review_interval_minutes,a.exact_url
 INTO candidate
 FROM jetnity_source_registry_private.sources_v1 s
 JOIN jetnity_source_dispatch_private.research_admissions_v1 a USING(source_id)
 JOIN jetnity_source_dispatch_private.research_hosts_v1 h
  ON h.destination_code=a.destination_code AND h.hostname=a.hostname
 LEFT JOIN LATERAL (
  SELECT max(r.requested_at) latest_at,count(*) total
  FROM jetnity_source_dispatch_private.requests_v1 r
  WHERE r.source_id=s.source_id
 ) existing ON true
 WHERE s.monitor_family='GENERIC' AND s.migration_state='REGISTERED_RESEARCH_ONLY'
 AND s.research_only AND NOT s.source_custody_verified AND NOT s.legal_rule_qualified
 AND NOT s.publication_allowed AND s.accepted_facts=0
 AND a.exact_url=s.official_url
 AND a.url_sha=encode(sha256(convert_to(s.official_url,'UTF8')),'hex')
 AND NOT h.legal_identity_verified AND NOT h.publication_allowed
 AND coalesce(existing.total,0)<256
 AND (existing.latest_at IS NULL OR existing.latest_at<=clock_timestamp()
      -make_interval(mins=>greatest(65,s.review_interval_minutes)))
 ORDER BY coalesce(existing.latest_at,'2000-01-01'::timestamptz),s.launch_priority,s.source_id
 LIMIT 1;
 IF NOT FOUND THEN RETURN 0; END IF;
 -- Fixed HTTP method/headers, never any caller-provided credentials.
 new_id:=net.http_get(candidate.exact_url,'{}'::jsonb,'{"accept":"text/html"}'::jsonb,15000);
 INSERT INTO jetnity_source_dispatch_private.requests_v1(request_id,source_id,requested_at)
 VALUES(new_id,candidate.source_id,clock_timestamp());
 RETURN 1;
END $enqueue$;

CREATE FUNCTION jetnity_source_dispatch_private.collect_v1()
 RETURNS integer LANGUAGE plpgsql SECURITY INVOKER SET search_path=pg_catalog AS $collect$
DECLARE row_item record; result_code text; bytes bytea; digest text; size_bytes integer; previous_digest text; saved integer:=0;
BEGIN
 IF session_user<>'postgres' OR current_user<>session_user
 OR public.official_v3_guard_alarm_status_v1()->>'status'<>'current'
 OR NOT pg_try_advisory_xact_lock(771115,769)
 THEN RETURN 0; END IF;
 FOR row_item IN
  SELECT q.request_id,q.source_id,q.requested_at,n.id AS response_id,
   n.status_code,n.content_type,n.timed_out,n.error_msg,n.content
  FROM jetnity_source_dispatch_private.requests_v1 q
  LEFT JOIN net._http_response n ON n.id=q.request_id
  WHERE NOT EXISTS(SELECT 1 FROM jetnity_source_dispatch_private.observations_v1 o
    WHERE o.request_id=q.request_id)
  ORDER BY q.requested_at LIMIT 12
 LOOP
  IF row_item.response_id IS NULL AND row_item.requested_at>clock_timestamp()-interval '8 minutes'
  THEN CONTINUE; END IF;
  bytes:=NULL;digest:=NULL;size_bytes:=NULL;
  IF row_item.response_id IS NULL THEN result_code:='COLLECTION_TIMEOUT';
  ELSIF row_item.status_code IS DISTINCT FROM 200 OR row_item.timed_out IS TRUE
     OR row_item.error_msg IS NOT NULL THEN result_code:='SOURCE_UNAVAILABLE';
  ELSIF row_item.content IS NULL OR row_item.content_type IS NULL
     OR row_item.content_type !~* '^text/html([; ]|$)'
     OR octet_length(convert_to(row_item.content,'UTF8')) NOT BETWEEN 1000 AND 131072
     OR position('<html' IN lower(left(row_item.content,4096)))=0
     OR position('captcha' IN lower(left(row_item.content,4096)))>0
     OR position('access denied' IN lower(left(row_item.content,4096)))>0
    THEN result_code:='REJECTED_HTML';
  ELSE
   bytes:=convert_to(row_item.content,'UTF8');
   size_bytes:=octet_length(bytes);
   digest:=encode(sha256(bytes),'hex');
   SELECT o.raw_sha INTO previous_digest
   FROM jetnity_source_dispatch_private.observations_v1 o
   JOIN jetnity_source_dispatch_private.requests_v1 r ON r.request_id=o.request_id
   WHERE r.source_id=row_item.source_id AND o.raw_sha IS NOT NULL
   ORDER BY o.observed_at DESC,o.request_id DESC LIMIT 1;
   IF previous_digest IS NULL THEN result_code:='UNQUALIFIED_FIRST';
   ELSIF previous_digest=digest THEN result_code:='UNQUALIFIED_SAME';
   ELSE result_code:='CHANGED_REQUIRES_REVIEW'; END IF;
  END IF;
  INSERT INTO jetnity_source_dispatch_private.observations_v1(
   request_id,observed_at,result,http_code,body_bytes,raw_sha,original_html)
  VALUES(row_item.request_id,clock_timestamp(),result_code,row_item.status_code,
    size_bytes,digest,bytes)
  ON CONFLICT DO NOTHING;
  IF FOUND THEN saved:=saved+1; END IF;
 END LOOP;
 RETURN saved;
END $collect$;

CREATE FUNCTION jetnity_source_dispatch_private.tick_v1()
 RETURNS integer LANGUAGE plpgsql SECURITY INVOKER SET search_path=pg_catalog AS $tick$
DECLARE old_count integer; new_count integer; enqueued integer;
BEGIN
 IF session_user<>'postgres' OR current_user<>session_user
 OR public.official_v3_guard_alarm_status_v1()->>'status'<>'current'
 OR NOT pg_try_advisory_xact_lock(771115,770)
 THEN RETURN 0; END IF;
 old_count:=jetnity_usagov_watch_private.tick_v1();
 new_count:=jetnity_source_dispatch_private.collect_v1();
 enqueued:=jetnity_source_dispatch_private.enqueue_v1();
 RETURN old_count+new_count+enqueued;
END $tick$;

-- Forced RLS, private postgres-only, no mutable records.
DO $lockdown$
DECLARE t record;
BEGIN
 FOR t IN SELECT table_name FROM information_schema.tables
 WHERE table_schema='jetnity_source_dispatch_private' AND table_type='BASE TABLE'
 LOOP
  EXECUTE format('ALTER TABLE jetnity_source_dispatch_private.%I ENABLE ROW LEVEL SECURITY',t.table_name);
  EXECUTE format('ALTER TABLE jetnity_source_dispatch_private.%I FORCE ROW LEVEL SECURITY',t.table_name);
  EXECUTE format('CREATE POLICY postgres_only ON jetnity_source_dispatch_private.%I TO postgres USING(true) WITH CHECK(true)',t.table_name);
  EXECUTE format('CREATE TRIGGER immutable_rows BEFORE UPDATE OR DELETE ON jetnity_source_dispatch_private.%I FOR EACH ROW EXECUTE FUNCTION jetnity_source_dispatch_private.deny_mutation_v1()',t.table_name);
  EXECUTE format('CREATE TRIGGER immutable_truncate BEFORE TRUNCATE ON jetnity_source_dispatch_private.%I FOR EACH STATEMENT EXECUTE FUNCTION jetnity_source_dispatch_private.deny_mutation_v1()',t.table_name);
 END LOOP;
END $lockdown$;
REVOKE ALL ON ALL TABLES IN SCHEMA jetnity_source_dispatch_private FROM PUBLIC,anon,authenticated,service_role;
REVOKE ALL ON ALL FUNCTIONS IN SCHEMA jetnity_source_dispatch_private FROM PUBLIC,anon,authenticated,service_role;
REVOKE ALL ON SCHEMA jetnity_source_dispatch_private FROM PUBLIC,anon,authenticated,service_role;

DO $sched$
DECLARE job_id bigint;
BEGIN
 SELECT j.jobid INTO STRICT job_id FROM cron.job j
 WHERE j.jobname='jetnity-global-source-review-queue-dev' AND j.active
  AND j.username='postgres' AND j.database='postgres' AND j.schedule='*/5 * * * *'
  AND j.command='SELECT jetnity_usagov_watch_private.tick_v1()';
 PERFORM cron.alter_job(job_id,command=>'SELECT jetnity_source_dispatch_private.tick_v1()');
END $sched$;

SELECT jetnity_source_dispatch_private.tick_v1();

DO $post$
BEGIN
 IF (SELECT count(*) FROM jetnity_source_dispatch_private.requests_v1)<>0
 OR (SELECT count(*) FROM jetnity_source_dispatch_private.observations_v1)<>0
 OR (SELECT count(*) FROM jetnity_source_registry_private.sources_v1)<>19
 OR EXISTS(SELECT 1 FROM jetnity_global_research_private.cases_v1
    WHERE legal_rule_qualified OR publication_allowed OR accepted_fact_count<>0)
 OR (SELECT count(*) FROM cron.job j WHERE j.jobname='jetnity-global-source-review-queue-dev'
    AND j.active AND j.schedule='*/5 * * * *'
    AND j.command='SELECT jetnity_source_dispatch_private.tick_v1()')<>1
 OR EXISTS(SELECT 1 FROM pg_class c JOIN pg_namespace n ON n.oid=c.relnamespace
    WHERE n.nspname='jetnity_source_dispatch_private' AND c.relkind='r'
     AND (NOT c.relrowsecurity OR NOT c.relforcerowsecurity
       OR has_table_privilege('anon',c.oid,'SELECT')
       OR has_table_privilege('authenticated',c.oid,'SELECT')
       OR has_table_privilege('service_role',c.oid,'SELECT')))
 OR has_schema_privilege('anon','jetnity_source_dispatch_private','USAGE')
 OR has_schema_privilege('authenticated','jetnity_source_dispatch_private','USAGE')
 OR has_schema_privilege('service_role','jetnity_source_dispatch_private','USAGE')
 OR public.official_v3_guard_alarm_status_v1()->>'status'<>'current'
 THEN RAISE EXCEPTION 'REGISTRY_DISPATCH_POSTCHECK_ROLLBACK' USING ERRCODE='P7992'; END IF;
 PERFORM official_v3_guard_private.assert_catalog_v1();
END $post$;
COMMIT;