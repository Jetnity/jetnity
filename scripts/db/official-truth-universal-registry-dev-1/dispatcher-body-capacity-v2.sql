-- DEV ONLY. Versioned correction for legitimate large Austrian government HTML.
-- Preserve immutable source receipts and every existing official monitor.
-- Source body <=1 MiB, aggregate 64 MiB + one possible in-flight body, DB <=256 MiB.
BEGIN;
SET LOCAL search_path=pg_catalog;
SET LOCAL statement_timeout='35s';
SET LOCAL lock_timeout='5s';
SET LOCAL jetnity.dispatch_body_target='dev:yfvbxvijcorffwxbxahl:DISPATCH-BODY-V2';
DO $pre$
BEGIN
 IF session_user<>'postgres' OR current_user<>session_user
 OR current_database()<>'postgres'
 OR current_setting('server_version_num')::integer/10000<>17
 OR current_setting('jetnity.dispatch_body_target',true)
    IS DISTINCT FROM 'dev:yfvbxvijcorffwxbxahl:DISPATCH-BODY-V2'
 OR public.official_v3_guard_alarm_status_v1()->>'status'<>'current'
 OR md5(pg_get_functiondef('jetnity_source_dispatch_private.enqueue_v1()'::regprocedure))
   IS DISTINCT FROM '4634de7f1236d48814c17d12dbc4af50'
 OR md5(pg_get_functiondef('jetnity_source_dispatch_private.collect_v1()'::regprocedure))
   IS DISTINCT FROM '16d6e46c9bbc06c26708440198d3a35f'
 OR (SELECT count(*) FROM cron.job WHERE active AND jobname='jetnity-global-source-review-queue-dev'
 AND schedule='*/5 * * * *' AND command='SELECT jetnity_source_dispatch_private.tick_v1()')<>1
 OR (SELECT count(*) FROM jetnity_source_registry_private.sources_v1 WHERE destination_code='AT')<>7
 OR (SELECT count(*) FROM jetnity_source_dispatch_private.research_admissions_v1)<>4
 OR (SELECT count(*) FROM jetnity_global_research_private.cases_v1 WHERE legal_rule_qualified OR publication_allowed OR accepted_fact_count<>0)<>0
 OR pg_database_size(current_database())>=268435456
 OR NOT pg_try_advisory_xact_lock(771115,772)
 THEN RAISE EXCEPTION 'BODY_CAPACITY_V2_DEV_PREDECESSOR_REQUIRED' USING ERRCODE='P7993'; END IF;
 PERFORM official_v3_guard_private.assert_catalog_v1();
END $pre$;

ALTER TABLE jetnity_source_dispatch_private.observations_v1 DROP CONSTRAINT observations_v1_check;
ALTER TABLE jetnity_source_dispatch_private.observations_v1 ADD CONSTRAINT observations_v1_check
CHECK (
 (result IN('UNQUALIFIED_FIRST','UNQUALIFIED_SAME','CHANGED_REQUIRES_REVIEW')
  AND http_code=200 AND original_html IS NOT NULL
  AND body_bytes=octet_length(original_html)
  AND body_bytes BETWEEN 1000 AND 1048576
  AND raw_sha=encode(sha256(original_html),'hex'))
 OR
 (result IN('SOURCE_UNAVAILABLE','REJECTED_HTML','COLLECTION_TIMEOUT')
  AND original_html IS NULL AND body_bytes IS NULL AND raw_sha IS NULL)
);
CREATE OR REPLACE FUNCTION jetnity_source_dispatch_private.enqueue_v1()
 RETURNS integer LANGUAGE plpgsql SECURITY INVOKER SET search_path=pg_catalog AS $enqueue$
DECLARE candidate record; new_id bigint;
BEGIN
 IF session_user<>'postgres' OR current_user<>session_user
 OR public.official_v3_guard_alarm_status_v1()->>'status'<>'current'
 OR NOT pg_try_advisory_xact_lock(771115,768)
 OR pg_database_size(current_database())>=268435456
 OR (SELECT count(*) FROM jetnity_source_dispatch_private.requests_v1)>=3000
 OR (SELECT coalesce(sum(body_bytes),0) FROM jetnity_source_dispatch_private.observations_v1)>67108864
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
CREATE OR REPLACE FUNCTION jetnity_source_dispatch_private.collect_v1()
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
     OR octet_length(convert_to(row_item.content,'UTF8')) NOT BETWEEN 1000 AND 1048576
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
REVOKE ALL ON ALL FUNCTIONS IN SCHEMA jetnity_source_dispatch_private
FROM PUBLIC,anon,authenticated,service_role;

DO $post$
BEGIN
 IF (SELECT count(*) FROM cron.job WHERE active AND jobname='jetnity-global-source-review-queue-dev'
 AND schedule='*/5 * * * *' AND command='SELECT jetnity_source_dispatch_private.tick_v1()')<>1
 OR (SELECT count(*) FROM jetnity_source_dispatch_private.observations_v1 WHERE legal_rule_qualified OR publication_allowed OR accepted_fact_count<>0)<>0
 OR (SELECT count(*) FROM jetnity_global_research_private.cases_v1 WHERE legal_rule_qualified OR publication_allowed OR accepted_fact_count<>0)<>0
 OR NOT EXISTS(SELECT 1 FROM pg_constraint WHERE conrelid='jetnity_source_dispatch_private.observations_v1'::regclass
  AND conname='observations_v1_check' AND pg_get_constraintdef(oid) LIKE '%1048576%')
 OR (SELECT count(*) FROM pg_class WHERE oid='jetnity_source_dispatch_private.observations_v1'::regclass
  AND relrowsecurity AND relforcerowsecurity)<>1
 OR has_schema_privilege('anon','jetnity_source_dispatch_private','USAGE')
 OR has_schema_privilege('authenticated','jetnity_source_dispatch_private','USAGE')
 OR has_schema_privilege('service_role','jetnity_source_dispatch_private','USAGE')
 OR public.official_v3_guard_alarm_status_v1()->>'status'<>'current'
 THEN RAISE EXCEPTION 'BODY_CAPACITY_V2_DEV_POSTCHECK_ROLLBACK' USING ERRCODE='P7993'; END IF;
 PERFORM official_v3_guard_private.assert_catalog_v1();
END $post$;
COMMIT;