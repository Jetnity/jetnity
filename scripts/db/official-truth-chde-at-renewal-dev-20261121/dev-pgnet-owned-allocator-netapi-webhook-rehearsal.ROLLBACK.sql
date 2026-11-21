-- DEV ONLY / R2 API + NESTED WEBHOOK + THREE PUBLIC ROLES / UNEXECUTED REVIEW.
-- Independently select yfvbxvijcorffwxbxahl; NEVER Production. FINAL ROLLBACK.
-- The unchanged real net.http_get/post/delete functions execute net.wake().
-- The unchanged real supabase_functions.http_request trigger executes a nested
-- POST under its existing supabase_functions_admin SECURITY DEFINER context.
-- All seven synthetic .invalid probe rows stay UNCOMMITTED behind the global
-- queue lock until rollback; this proves enqueue integration, not HTTP delivery.
-- Expected NONTRANSACTIONAL effects: seven old HTTP nextval calls and one
-- hooks-ID nextval call. Numeric delta depends on starting is_called. Never reset.
-- The NEW LOGGED private sequence, bounded SD helper, triggers and fixture are
-- entirely removed. No new grants, no existing owner/ACL/default/role changes.
-- Normal origin/local trigger mode only; O triggers do not run in replica mode.
-- This is not proof of replica bypass prevention, restart safety, v8 or install.
-- Actual API/context pins: dev-pgnet-r2-public-api-context.json, 14:28:37 UTC.
-- Shared SD helper: dev-pgnet-owned-allocator-assign-request-id-v1.SD.sql.
-- pg_net 0.20.4 queue/worker behavior independently reviewed by the parent.
BEGIN TRANSACTION ISOLATION LEVEL READ COMMITTED;
SET LOCAL search_path=pg_catalog;
SET LOCAL timezone='UTC';
SET LOCAL statement_timeout='25s';
SET LOCAL lock_timeout='2s';
SET LOCAL idle_in_transaction_session_timeout='30s';

-- Read-only authority/target gate before the first temporary object.
DO $allocator_authority$
BEGIN
 IF current_database()<>'postgres' OR current_user<>'postgres' OR session_user<>'postgres'
 OR current_setting('server_version_num')::integer/10000<>17
 OR current_setting('transaction_isolation')<>'read committed' OR auth.uid() IS NOT NULL
 OR to_regclass('official_v3_guard_private.bg1_dev_grantor_restore_v7') IS NULL
 OR to_regclass('official_v3_guard_private.at_batch_switch_baseline_v2') IS NOT NULL
 OR to_regclass('official_v3_at_production_private.source_pins_v1') IS NOT NULL
 OR to_regclass('jetnity_prod_import_scheduler.dispatches_v1') IS NOT NULL
 THEN RAISE EXCEPTION 'DEV_ALLOCATOR_WRONG_TARGET' USING ERRCODE='P7998'; END IF;
 IF NOT has_table_privilege(current_user,'net.http_request_queue','TRIGGER')
 OR NOT has_table_privilege(current_user,'net.http_request_queue','INSERT')
 OR NOT has_table_privilege(current_user,'net.http_request_queue','UPDATE')
 OR NOT has_table_privilege(current_user,'net.http_request_queue','SELECT')
 OR NOT has_schema_privilege(current_user,'net','USAGE')
 OR NOT has_database_privilege(current_user,current_database(),'CREATE')
 THEN RAISE EXCEPTION 'DEV_ALLOCATOR_ORDINARY_PRIVILEGE_MISSING' USING ERRCODE='42501'; END IF;
 IF to_regnamespace('jetnity_pgnet_allocator_private') IS NOT NULL THEN
  RAISE EXCEPTION 'DEV_ALLOCATOR_NAMESPACE_ALREADY_EXISTS' USING ERRCODE='P7998'; END IF;
END $allocator_authority$;


DO $r2_pinned_entry$
DECLARE s pg_sequence%ROWTYPE; role_name text;
BEGIN
 IF current_setting('session_replication_role') NOT IN('origin','local')
 OR (SELECT extversion FROM pg_extension WHERE extname='pg_net') IS DISTINCT FROM '0.20.4'
 OR pg_get_serial_sequence('supabase_functions.hooks','id') IS DISTINCT FROM 'supabase_functions.hooks_id_seq'
 OR NOT has_table_privilege(current_user,'supabase_functions.hooks','SELECT')
 OR NOT has_table_privilege(current_user,'supabase_functions.hooks','UPDATE')
 OR NOT has_sequence_privilege(current_user,'supabase_functions.hooks_id_seq','SELECT')
 OR NOT has_table_privilege('supabase_functions_admin','net.http_request_queue','INSERT')
 OR NOT has_schema_privilege('supabase_functions_admin','net','USAGE')
 OR NOT has_sequence_privilege('supabase_functions_admin','net.http_request_queue_id_seq','USAGE')
 OR NOT has_table_privilege('supabase_functions_admin','supabase_functions.hooks','INSERT')
 OR NOT has_sequence_privilege('supabase_functions_admin','supabase_functions.hooks_id_seq','USAGE')
 OR NOT has_function_privilege('supabase_functions_admin','net.http_post(text,jsonb,jsonb,jsonb,integer)','EXECUTE')
 THEN RAISE EXCEPTION 'DEV_R2_EXISTING_AUTHORITY_OR_MODE_CHANGED' USING ERRCODE='P7998'; END IF;
 FOR role_name IN SELECT unnest(ARRAY['anon','authenticated','service_role']) LOOP
  IF NOT pg_has_role(current_user,role_name,'SET')
  OR NOT has_schema_privilege(role_name,'net','USAGE')
  OR NOT has_table_privilege(role_name,'net.http_request_queue','INSERT')
  OR NOT has_sequence_privilege(role_name,'net.http_request_queue_id_seq','USAGE')
  OR NOT has_function_privilege(role_name,'net.http_get(text,jsonb,jsonb,integer)','EXECUTE')
  THEN RAISE EXCEPTION 'DEV_R2_EXISTING_PUBLIC_ROLE_PERMISSION_MISSING' USING ERRCODE='P7998'; END IF;
 END LOOP;
 IF (SELECT count(*) FROM (VALUES
  ('net.http_get(text,jsonb,jsonb,integer)','7012c5582cd0ab8d38f546af6633ea3c531950fb009f07127b99f8a1640eac1a','supabase_admin',false),
  ('net.http_post(text,jsonb,jsonb,jsonb,integer)','ee3ec5bc54158b60b6c4e3a966a07a33dc009788fad8f6b7480ad1c45acdfe78','supabase_admin',false),
  ('net.http_delete(text,jsonb,jsonb,integer,jsonb)','1f2b6fc5ccc1511e77737a95c71228bed710482133a95a87cdb672d80373617b','supabase_admin',false),
  ('supabase_functions.http_request()','053080bf8c8a0b0c8daadedc700c6b857fd3ef0aa34fc2096ee7f5214389b146','supabase_functions_admin',true)
 ) e(identity,sha,owner_name,definer) JOIN pg_proc p ON p.oid=to_regprocedure(e.identity)
 WHERE p.proowner=to_regrole(e.owner_name) AND p.prosecdef=e.definer
 AND encode(sha256(convert_to(pg_get_functiondef(p.oid),'UTF8')),'hex')=e.sha
 AND has_function_privilege(current_user,p.oid,'EXECUTE'))<>4
 THEN RAISE EXCEPTION 'DEV_R2_PINNED_API_OR_WEBHOOK_CHANGED' USING ERRCODE='P7998'; END IF;
 SELECT * INTO STRICT s FROM pg_sequence WHERE seqrelid='supabase_functions.hooks_id_seq'::regclass;
 IF s.seqtypid<>'bigint'::regtype OR s.seqincrement<>1 OR s.seqcache<>1 OR s.seqcycle
 OR s.seqmin::text<>'1' OR s.seqmax::text<>'9223372036854775807'
 OR NOT EXISTS(SELECT 1 FROM pg_class WHERE oid=s.seqrelid AND relkind='S'
  AND relpersistence='p' AND relowner='supabase_functions_admin'::regrole)
 THEN RAISE EXCEPTION 'DEV_R2_HOOK_SEQUENCE_PARAMETERS_CHANGED' USING ERRCODE='P7998'; END IF;
END $r2_pinned_entry$;

CREATE TEMP TABLE pg_temp.dev_http_id_inventory(
 schema_name text NOT NULL,table_name text NOT NULL,column_name text NOT NULL,
 expected_persistence "char" NOT NULL,
 PRIMARY KEY(schema_name,table_name,column_name)
) ON COMMIT DROP;
INSERT INTO pg_temp.dev_http_id_inventory VALUES
 ('jetnity_dev_import_scheduler','dispatches_v1','net_request_id','p'),
 ('jetnity_dev_import_scheduler','preview_dispatches_v1','net_request_id','p'),
 ('official_v3_at_source_watch_private','reads_v1','request_id','p'),
 ('official_v3_source_renewal_private','observations_v1','request_id','p'),
 ('jetnity_followup_source_monitor_private','items_v1','request_id','p'),
 ('jetnity_followup_source_monitor_private','items_v2','pgnet_request_id','p'),
 ('jetnity_followup_source_monitor_private','items_v3','request_id','p'),
 ('jetnity_global_source_monitor_private','requests_v1','request_id','p'),
 ('jetnity_usagov_fallback_private','original_v1','request_id','p'),
 ('jetnity_usagov_watch_private','requests_v1','request_id','p'),
 ('jetnity_usagov_watch_private','observations_v1','request_id','p'),
 ('jetnity_source_dispatch_private','requests_v1','request_id','p'),
 ('jetnity_source_dispatch_private','observations_v1','request_id','p'),
 ('supabase_functions','hooks','request_id','p'),
 ('net','http_request_queue','id','u'),
 ('net','_http_response','id','u');

-- Exact catalog inventory, including every durable bigint *request_id* column.
-- UUID/text request IDs are different namespaces and deliberately excluded.
CREATE FUNCTION pg_temp.dev_http_inventory_exact() RETURNS boolean
LANGUAGE sql VOLATILE SECURITY INVOKER SET search_path=pg_catalog AS $inventory$
 WITH actual AS (
  SELECT n.nspname AS schema_name,c.relname AS table_name,a.attname AS column_name,
   c.relpersistence AS expected_persistence
  FROM pg_class c JOIN pg_namespace n ON n.oid=c.relnamespace
  JOIN pg_attribute a ON a.attrelid=c.oid
  WHERE c.relkind IN('r','p') AND c.relpersistence IN('p','u')
   AND n.nspname NOT IN('pg_catalog','information_schema')
   AND n.nspname NOT LIKE 'pg_toast%' AND n.nspname NOT LIKE 'pg_temp%'
   AND a.attnum>0 AND NOT a.attisdropped AND a.atttypid='bigint'::regtype
   AND (a.attname ~ '(^|_)request_id$'
     OR n.nspname='net' AND c.relname IN('http_request_queue','_http_response') AND a.attname='id')
 ), differences AS (
  (SELECT * FROM actual EXCEPT SELECT * FROM pg_temp.dev_http_id_inventory)
  UNION ALL
  (SELECT * FROM pg_temp.dev_http_id_inventory EXCEPT SELECT * FROM actual)
 )
 SELECT (SELECT count(*) FROM pg_temp.dev_http_id_inventory)=16
   AND (SELECT count(*) FROM actual)=16 AND NOT EXISTS(SELECT 1 FROM differences)
$inventory$;
REVOKE ALL ON FUNCTION pg_temp.dev_http_inventory_exact() FROM PUBLIC,anon,authenticated,service_role;

CREATE FUNCTION pg_temp.dev_seq_protected_state() RETURNS jsonb
LANGUAGE sql VOLATILE SECURITY INVOKER SET search_path=pg_catalog AS $state$
 SELECT jsonb_build_object(
 'catalog',official_v3_guard_private.catalog_status_v1(),
 'v7',(SELECT to_jsonb(v) FROM official_v3_guard_private.bg1_dev_grantor_restore_v7 v WHERE singleton),
 'publisher_body_sha',(SELECT encode(sha256(convert_to(p.prosrc,'UTF8')),'hex') FROM pg_proc p
   WHERE p.oid='official_v3_source_renewal_private.renew_approved_batch_v1(text,bigint)'::regprocedure),
 'publisher_definition_sha',encode(sha256(convert_to(pg_get_functiondef(
   'official_v3_source_renewal_private.renew_approved_batch_v1(text,bigint)'::regprocedure),'UTF8')),'hex'),
 'originals',(SELECT encode(sha256(convert_to(string_agg(((to_jsonb(o)-'original_body')||
   jsonb_build_object('actual_sha',encode(sha256(o.original_body),'hex')))::text,'|' ORDER BY source_id COLLATE "C"),'UTF8')),'hex')
   FROM official_v3_at_private.whole_originals_v2 o),
 'facts',(SELECT encode(sha256(convert_to(coalesce(string_agg(to_jsonb(f)::text,'|' ORDER BY fact_id),''),'UTF8')),'hex')
   FROM official_v3_source_renewal_private.facts_v1 f),
 'original_visas',(SELECT encode(sha256(convert_to(coalesce(string_agg(to_jsonb(v)::text,'|' ORDER BY rule_version),''),'UTF8')),'hex')
   FROM official_v3_at_private.verified_visas_v3 v),
 'source_pins',(SELECT encode(sha256(convert_to(string_agg(to_jsonb(p)::text,'|' ORDER BY source_id COLLATE "C"),'UTF8')),'hex')
   FROM official_v3_at_source_watch_private.pins_v1 p),
 'renewal_sources',(SELECT encode(sha256(convert_to(string_agg(to_jsonb(p)::text,'|' ORDER BY destination_code,source_id COLLATE "C"),'UTF8')),'hex')
   FROM official_v3_source_renewal_private.sources_v1 p),
 'at_request_identity',(SELECT encode(sha256(convert_to(coalesce(string_agg(
   jsonb_build_array(batch_id,source_id,request_id,requested_at)::text,'|' ORDER BY batch_id,source_id COLLATE "C"),''),'UTF8')),'hex')
   FROM official_v3_at_source_watch_private.reads_v1),
 'renewal_batches',(SELECT encode(sha256(convert_to(coalesce(string_agg(to_jsonb(b)::text,'|' ORDER BY destination_code,source_batch_id),''),'UTF8')),'hex')
   FROM official_v3_source_renewal_private.batches_v1 b),
 'renewal_observations',(SELECT encode(sha256(convert_to(coalesce(string_agg(to_jsonb(o)::text,'|' ORDER BY destination_code,source_batch_id,source_id COLLATE "C"),''),'UTF8')),'hex')
   FROM official_v3_source_renewal_private.observations_v1 o),
 'owner_receipts',(SELECT encode(sha256(convert_to(coalesce(string_agg(to_jsonb(o)::text,'|' ORDER BY operation_id),''),'UTF8')),'hex')
   FROM official_v3_guard_private.owner_operations_v1 o),
 'cron_config',(SELECT encode(sha256(convert_to(coalesce(string_agg(to_jsonb(j)::text,'|' ORDER BY jobid),''),'UTF8')),'hex') FROM cron.job j)
 )
$state$;
REVOKE ALL ON FUNCTION pg_temp.dev_seq_protected_state() FROM PUBLIC,anon,authenticated,service_role;

DO $dev_pre$
DECLARE item record; sequence_parameters pg_sequence%ROWTYPE;
BEGIN
 IF current_database()<>'postgres' OR current_user<>'postgres' OR session_user<>'postgres'
 OR current_setting('server_version_num')::integer/10000<>17
 OR current_setting('transaction_isolation')<>'read committed' OR auth.uid() IS NOT NULL
 OR to_regclass('official_v3_guard_private.bg1_dev_grantor_restore_v7') IS NULL
 OR to_regclass('official_v3_guard_private.at_batch_switch_baseline_v2') IS NOT NULL
 OR to_regclass('official_v3_at_production_private.source_pins_v1') IS NOT NULL
 OR to_regclass('jetnity_prod_import_scheduler.dispatches_v1') IS NOT NULL
 THEN RAISE EXCEPTION 'DEV_HTTP_SEQUENCE_WRONG_TARGET' USING ERRCODE='P7998'; END IF;
 PERFORM official_v3_guard_private.assert_catalog_v1();
 PERFORM official_v3_guard_private.require_open_v1();
 IF public.official_v3_guard_alarm_status_v1()->>'status' IS DISTINCT FROM 'current'
 OR NOT EXISTS(SELECT 1 FROM official_v3_guard_private.bg1_dev_grantor_restore_v7 v
  WHERE singleton AND catalog=official_v3_guard_private.catalog_status_v1())
 OR (SELECT encode(sha256(convert_to(prosrc,'UTF8')),'hex') FROM pg_proc
   WHERE oid='official_v3_source_renewal_private.renew_approved_batch_v1(text,bigint)'::regprocedure)
   IS DISTINCT FROM '05bf4f11d1b5b482d798afc11396c53016cd17470ce3b857cacb87323b520105'
 OR has_function_privilege('anon','official_v3_source_renewal_private.renew_approved_batch_v1(text,bigint)','EXECUTE')
 OR has_function_privilege('authenticated','official_v3_source_renewal_private.renew_approved_batch_v1(text,bigint)','EXECUTE')
 OR has_function_privilege('service_role','official_v3_source_renewal_private.renew_approved_batch_v1(text,bigint)','EXECUTE')
 THEN RAISE EXCEPTION 'DEV_HTTP_SEQUENCE_PROTECTED_SOURCE_GUARD_CHANGED' USING ERRCODE='P7998'; END IF;
 IF (SELECT count(*) FROM official_v3_at_private.whole_originals_v2)<>3
 OR (SELECT count(*) FROM official_v3_at_private.whole_originals_v2
  WHERE disposition='RESEARCH_ONLY' AND NOT importable AND accepted_fact_count=0
   AND body_digest=encode(sha256(original_body),'hex'))<>3
 OR EXISTS(SELECT 1 FROM official_v3_source_renewal_private.sources_v1 p
  LEFT JOIN official_v3_at_private.whole_originals_v2 o USING(source_id)
  WHERE p.destination_code='AT' AND (o.source_id IS NULL OR o.official_url IS DISTINCT FROM p.official_url
   OR o.body_digest IS DISTINCT FROM p.raw_sha OR octet_length(o.original_body) IS DISTINCT FROM p.original_bytes))
 OR (SELECT count(*) FROM official_v3_source_renewal_private.sources_v1 WHERE destination_code='AT')<>3
 THEN RAISE EXCEPTION 'DEV_HTTP_SEQUENCE_ORIGINAL_SOURCE_CHANGED' USING ERRCODE='P7998'; END IF;
 IF NOT pg_temp.dev_http_inventory_exact() THEN
  RAISE EXCEPTION 'DEV_HTTP_SEQUENCE_ID_INVENTORY_CHANGED' USING ERRCODE='P7998'; END IF;
 -- Leaf producer locks, numeric order. All are TRY locks: any busy producer
 -- aborts this transaction without waiting for an inverted wrapper hierarchy.
 FOR item IN SELECT * FROM (VALUES
  (771106,31),(771108,2),(771108,44),(771110,2),(771110,4),(771110,6),
  (771115,61),(771115,752),(771115,768)) AS locks(k1,k2) ORDER BY k1,k2 LOOP
  IF NOT pg_try_advisory_xact_lock(item.k1,item.k2) THEN
   RAISE EXCEPTION 'DEV_HTTP_SEQUENCE_PRODUCER_BUSY' USING ERRCODE='P7998'; END IF;
 END LOOP;
 SELECT * INTO STRICT sequence_parameters FROM pg_sequence
  WHERE seqrelid='net.http_request_queue_id_seq'::regclass;
 IF sequence_parameters.seqtypid<>'bigint'::regtype OR sequence_parameters.seqincrement<>1
 OR sequence_parameters.seqcache<>1 OR sequence_parameters.seqcycle
 OR sequence_parameters.seqmin<>1 OR sequence_parameters.seqmax<>9223372036854775807
 OR (SELECT relpersistence FROM pg_class WHERE oid='net.http_request_queue_id_seq'::regclass)<>'u'
 THEN RAISE EXCEPTION 'DEV_HTTP_SEQUENCE_GENERATOR_PARAMETERS_CHANGED' USING ERRCODE='P7998'; END IF;
END $dev_pre$;



-- Global barrier before either sequence or any of the 16 historical maxima.
-- Queue->hooks matches the genuine webhook's write order. No lock escalation.
LOCK TABLE net.http_request_queue IN SHARE ROW EXCLUSIVE MODE;
LOCK TABLE supabase_functions.hooks IN SHARE ROW EXCLUSIVE MODE;

CREATE FUNCTION pg_temp.dev_allocator_runtime_state() RETURNS jsonb
LANGUAGE sql VOLATILE SECURITY INVOKER SET search_path=pg_catalog AS $runtime$
 SELECT jsonb_build_object(
  'protected',pg_temp.dev_seq_protected_state(),
  'legacy_sequence',(SELECT jsonb_build_object('last_value',last_value::text,'log_cnt',log_cnt::text,'is_called',is_called) FROM net.http_request_queue_id_seq),
  'legacy_parameters',(SELECT to_jsonb(s) FROM pg_sequence s
    WHERE seqrelid='net.http_request_queue_id_seq'::regclass),
  'legacy_class',(SELECT to_jsonb(c)-ARRAY['relpages','reltuples','relallvisible','relfrozenxid','relminmxid']
    FROM pg_class c WHERE oid='net.http_request_queue_id_seq'::regclass),
  'queue_class',(SELECT to_jsonb(c)-ARRAY['relpages','reltuples','relallvisible','relfrozenxid','relminmxid']
    FROM pg_class c WHERE oid='net.http_request_queue'::regclass),
  'queue_attributes',(SELECT jsonb_agg(to_jsonb(a) ORDER BY attnum) FROM pg_attribute a
    WHERE attrelid='net.http_request_queue'::regclass AND attnum>0),
  'queue_defaults',(SELECT coalesce(jsonb_agg(to_jsonb(d) ORDER BY adnum),'[]'::jsonb)
    FROM pg_attrdef d WHERE adrelid='net.http_request_queue'::regclass),
  'queue_constraints',(SELECT coalesce(jsonb_agg(to_jsonb(c) ORDER BY oid),'[]'::jsonb)
    FROM pg_constraint c WHERE conrelid='net.http_request_queue'::regclass),
  'queue_triggers',(SELECT coalesce(jsonb_agg(to_jsonb(t) ORDER BY oid),'[]'::jsonb)
    FROM pg_trigger t WHERE tgrelid='net.http_request_queue'::regclass),
  'queue_rows',(SELECT encode(sha256(convert_to(coalesce(string_agg(to_jsonb(q)::text,'|' ORDER BY id,ctid),''),'UTF8')),'hex')
    FROM net.http_request_queue q),
  'response_rows',(SELECT encode(sha256(convert_to(coalesce(string_agg(to_jsonb(r)::text,'|' ORDER BY id,ctid),''),'UTF8')),'hex')
    FROM net._http_response r)
 )||jsonb_build_object(
  'hooks_sequence',(SELECT jsonb_build_object('last_value',last_value::text,'log_cnt',log_cnt::text,'is_called',is_called) FROM supabase_functions.hooks_id_seq),
  'hooks_parameters',(SELECT to_jsonb(s) FROM pg_sequence s WHERE seqrelid='supabase_functions.hooks_id_seq'::regclass),
  'hooks_seq_class',(SELECT to_jsonb(c)-ARRAY['relpages','reltuples','relallvisible','relfrozenxid','relminmxid'] FROM pg_class c WHERE oid='supabase_functions.hooks_id_seq'::regclass),
  'hooks_class',(SELECT to_jsonb(c)-ARRAY['relpages','reltuples','relallvisible','relfrozenxid','relminmxid'] FROM pg_class c WHERE oid='supabase_functions.hooks'::regclass),
  'hooks_defaults',(SELECT coalesce(jsonb_agg(to_jsonb(d) ORDER BY adnum),'[]'::jsonb) FROM pg_attrdef d WHERE adrelid='supabase_functions.hooks'::regclass),
  'hooks_triggers',(SELECT coalesce(jsonb_agg(to_jsonb(t) ORDER BY oid),'[]'::jsonb) FROM pg_trigger t WHERE tgrelid='supabase_functions.hooks'::regclass),
  'hooks_rows',(SELECT encode(sha256(convert_to(coalesce(string_agg(to_jsonb(h)::text,'|' ORDER BY id,ctid),''),'UTF8')),'hex') FROM supabase_functions.hooks h),
  'transport_functions',(SELECT jsonb_agg((to_jsonb(p)-ARRAY['prosrc','probin','prosqlbody'])||jsonb_build_object('definition_sha',encode(sha256(convert_to(pg_get_functiondef(p.oid),'UTF8')),'hex')) ORDER BY oid)
   FROM pg_proc p WHERE oid IN('net.http_get(text,jsonb,jsonb,integer)'::regprocedure,'net.http_post(text,jsonb,jsonb,jsonb,integer)'::regprocedure,'net.http_delete(text,jsonb,jsonb,integer,jsonb)'::regprocedure,'supabase_functions.http_request()'::regprocedure)),
  'transport_dependencies',(WITH objects(classid,objid) AS (
   VALUES('pg_class'::regclass::oid,'net.http_request_queue'::regclass::oid),
    ('pg_class'::regclass::oid,'net.http_request_queue_id_seq'::regclass::oid),
    ('pg_class'::regclass::oid,'supabase_functions.hooks'::regclass::oid),
    ('pg_class'::regclass::oid,'supabase_functions.hooks_id_seq'::regclass::oid),
    ('pg_proc'::regclass::oid,'supabase_functions.http_request()'::regprocedure::oid))
   SELECT coalesce(jsonb_agg(to_jsonb(d) ORDER BY classid,objid,objsubid,refclassid,refobjid,refobjsubid,deptype),'[]'::jsonb)
   FROM pg_depend d WHERE (d.classid,d.objid) IN(SELECT * FROM objects)
    OR (d.refclassid,d.refobjid) IN(SELECT * FROM objects))
 )
$runtime$;
REVOKE ALL ON FUNCTION pg_temp.dev_allocator_runtime_state() FROM PUBLIC,anon,authenticated,service_role;


CREATE TEMP TABLE pg_temp.dev_allocator_before(
 singleton boolean PRIMARY KEY DEFAULT true CHECK(singleton),state jsonb NOT NULL,
 historical_max bigint NOT NULL,legacy_last bigint NOT NULL,legacy_called boolean NOT NULL,
 hooks_last bigint NOT NULL,hooks_called boolean NOT NULL,expected_legacy_after bigint NOT NULL,
 expected_hooks_after bigint NOT NULL,first_unused bigint NOT NULL,
 original_queue_count bigint NOT NULL,original_hooks_count bigint NOT NULL,probe_url_prefix text NOT NULL
) ON COMMIT DROP;
CREATE TEMP TABLE pg_temp.dev_allocator_proof(
 singleton boolean PRIMARY KEY DEFAULT true CHECK(singleton),get_id bigint,post_id bigint,delete_id bigint,
 webhook_id bigint,anon_id bigint,authenticated_id bigint,service_role_id bigint,hook_row_id bigint,
 inner_checks_pass boolean NOT NULL DEFAULT false,complete_install_rollback_exact boolean NOT NULL DEFAULT false
) ON COMMIT DROP;
INSERT INTO pg_temp.dev_allocator_proof DEFAULT VALUES;
DO $r2_locked_snapshot$
DECLARE item record; part_max bigint; high bigint:=0; lv bigint; lc boolean; hv bigint; hc boolean;
BEGIN
 IF NOT EXISTS(SELECT 1 FROM pg_locks WHERE pid=pg_backend_pid() AND relation='net.http_request_queue'::regclass AND mode='ShareRowExclusiveLock' AND granted)
 OR NOT EXISTS(SELECT 1 FROM pg_locks WHERE pid=pg_backend_pid() AND relation='supabase_functions.hooks'::regclass AND mode='ShareRowExclusiveLock' AND granted)
 OR NOT pg_temp.dev_http_inventory_exact() OR to_regnamespace('jetnity_pgnet_allocator_private') IS NOT NULL
 OR current_setting('session_replication_role') NOT IN('origin','local')
 THEN RAISE EXCEPTION 'DEV_R2_LOCK_OR_INVENTORY_CHANGED' USING ERRCODE='P7998'; END IF;
 IF EXISTS(SELECT 1 FROM pg_trigger WHERE tgrelid='net.http_request_queue'::regclass)
 OR EXISTS(SELECT 1 FROM pg_rewrite WHERE ev_class='net.http_request_queue'::regclass)
 OR EXISTS(SELECT 1 FROM pg_constraint WHERE conrelid='net.http_request_queue'::regclass)
 OR EXISTS(SELECT 1 FROM pg_trigger WHERE tgrelid='supabase_functions.hooks'::regclass AND NOT tgisinternal)
 OR NOT EXISTS(SELECT 1 FROM pg_class WHERE oid='net.http_request_queue'::regclass AND relkind='r'
  AND relpersistence='u' AND NOT relrowsecurity AND NOT relispartition AND relowner='supabase_admin'::regrole)
 THEN RAISE EXCEPTION 'DEV_R2_QUEUE_OR_HOOK_SHAPE_NOT_REVIEWED' USING ERRCODE='P7998'; END IF;
 SELECT last_value,is_called INTO STRICT lv,lc FROM net.http_request_queue_id_seq;
 SELECT last_value,is_called INTO STRICT hv,hc FROM supabase_functions.hooks_id_seq;
 FOR item IN SELECT * FROM pg_temp.dev_http_id_inventory ORDER BY schema_name,table_name,column_name LOOP
  EXECUTE format('SELECT max(%I) FROM %I.%I',item.column_name,item.schema_name,item.table_name) INTO part_max;
  IF part_max IS NOT NULL AND part_max<1 THEN RAISE EXCEPTION 'DEV_R2_INVALID_HISTORY_ID' USING ERRCODE='P7998'; END IF;
  high:=greatest(high,coalesce(part_max,0));
 END LOOP;
 IF high<1 OR lv<1 OR hv<1 OR greatest(high,lv)>9223372036854775787 OR hv>9223372036854775806
 THEN RAISE EXCEPTION 'DEV_R2_INVALID_OR_EXHAUSTED_RANGE' USING ERRCODE='P7998'; END IF;
 INSERT INTO pg_temp.dev_allocator_before(state,historical_max,legacy_last,legacy_called,hooks_last,hooks_called,
  expected_legacy_after,expected_hooks_after,first_unused,original_queue_count,original_hooks_count,probe_url_prefix)
 VALUES(pg_temp.dev_allocator_runtime_state(),high,lv,lc,hv,hc,
  lv+CASE WHEN lc THEN 7 ELSE 6 END,hv+CASE WHEN hc THEN 1 ELSE 0 END,greatest(high,lv)+1,
  (SELECT count(*) FROM net.http_request_queue),(SELECT count(*) FROM supabase_functions.hooks),
  'https://example.invalid/jetnity-dev-allocator-r2/'||txid_current()::text||'/');
END $r2_locked_snapshot$;

SAVEPOINT dev_allocator_install;
CREATE SCHEMA jetnity_pgnet_allocator_private AUTHORIZATION postgres;
REVOKE ALL ON SCHEMA jetnity_pgnet_allocator_private FROM PUBLIC,anon,authenticated,service_role,supabase_functions_admin,supabase_read_only_user;
DO $create_owned_sequence$
DECLARE first_id bigint;
BEGIN
 SELECT first_unused INTO STRICT first_id FROM pg_temp.dev_allocator_before WHERE singleton;
 EXECUTE format('CREATE SEQUENCE jetnity_pgnet_allocator_private.http_request_id_v1 AS bigint INCREMENT BY 1 MINVALUE 1 MAXVALUE 9223372036854775807 START WITH %s CACHE 1 NO CYCLE',first_id);
END $create_owned_sequence$;
REVOKE ALL ON SEQUENCE jetnity_pgnet_allocator_private.http_request_id_v1 FROM PUBLIC,anon,authenticated,service_role,supabase_functions_admin,supabase_read_only_user;

CREATE FUNCTION jetnity_pgnet_allocator_private.assign_request_id_v1() RETURNS trigger
LANGUAGE plpgsql VOLATILE SECURITY DEFINER SET search_path=pg_catalog AS $assign$
BEGIN
 IF TG_RELID<>'net.http_request_queue'::pg_catalog.regclass OR TG_OP<>'INSERT'
 OR TG_WHEN<>'BEFORE' OR TG_LEVEL<>'ROW' OR TG_NARGS<>0
 OR TG_NAME<>'jetnity_pgnet_request_id_v1'
 OR pg_catalog.current_setting('session_replication_role') NOT IN('origin','local') THEN
  RAISE EXCEPTION 'DEV_ALLOCATOR_EXACT_QUEUE_TRIGGER_REQUIRED' USING ERRCODE='P7998';
 END IF;
 -- Incoming/default IDs are deliberately ignored for EVERY queue producer.
 NEW.id:=pg_catalog.nextval('jetnity_pgnet_allocator_private.http_request_id_v1'::pg_catalog.regclass);
 RETURN NEW;
END $assign$;
REVOKE ALL ON FUNCTION jetnity_pgnet_allocator_private.assign_request_id_v1() FROM PUBLIC,anon,authenticated,service_role,supabase_functions_admin,supabase_read_only_user;
CREATE TRIGGER jetnity_pgnet_request_id_v1 BEFORE INSERT ON net.http_request_queue
 FOR EACH ROW EXECUTE FUNCTION jetnity_pgnet_allocator_private.assign_request_id_v1();


-- Owner-only fixture: the existing webhook switches to its own installed
-- SECURITY DEFINER role naturally. No new rights are given to that role.
CREATE TABLE jetnity_pgnet_allocator_private.webhook_fixture_r2(
 id bigint PRIMARY KEY CHECK(id=1),payload text NOT NULL CHECK(payload='r2-rollback-only')
);
ALTER TABLE jetnity_pgnet_allocator_private.webhook_fixture_r2 ENABLE ROW LEVEL SECURITY;
ALTER TABLE jetnity_pgnet_allocator_private.webhook_fixture_r2 FORCE ROW LEVEL SECURITY;
CREATE POLICY postgres_only ON jetnity_pgnet_allocator_private.webhook_fixture_r2
 TO postgres USING(true) WITH CHECK(true);
REVOKE ALL ON TABLE jetnity_pgnet_allocator_private.webhook_fixture_r2
 FROM PUBLIC,anon,authenticated,service_role,supabase_functions_admin,supabase_read_only_user;
DO $r2_fixture_hook$
DECLARE target_url text;
BEGIN
 SELECT probe_url_prefix||'webhook' INTO STRICT target_url FROM pg_temp.dev_allocator_before WHERE singleton;
 EXECUTE format('CREATE TRIGGER dev_allocator_real_webhook_r2 AFTER INSERT ON jetnity_pgnet_allocator_private.webhook_fixture_r2 FOR EACH ROW EXECUTE FUNCTION supabase_functions.http_request(%L,%L,%L,%L,%L)',
  target_url,'POST','{"Content-Type":"application/json","x-jetnity-proof":"r2-rollback-only"}','{}','1');
END $r2_fixture_hook$;

DO $r2_private_object_gate$
DECLARE s pg_sequence%ROWTYPE;
BEGIN
 SELECT * INTO STRICT s FROM pg_sequence WHERE seqrelid='jetnity_pgnet_allocator_private.http_request_id_v1'::regclass;
 IF NOT EXISTS(SELECT 1 FROM pg_class WHERE oid=s.seqrelid AND relkind='S'
  AND relpersistence='p' AND relowner='postgres'::regrole)
 OR s.seqtypid<>'bigint'::regtype OR s.seqincrement<>1 OR s.seqcache<>1 OR s.seqcycle
 OR s.seqmin::text<>'1' OR s.seqmax::text<>'9223372036854775807'
 OR NOT EXISTS(SELECT 1 FROM pg_proc WHERE oid='jetnity_pgnet_allocator_private.assign_request_id_v1()'::regprocedure
  AND prosecdef AND proowner='postgres'::regrole AND proconfig=ARRAY['search_path=pg_catalog']
  AND encode(sha256(convert_to(prosrc,'UTF8')),'hex')='16151e29d3859b8574afcc934c2fa4cc6709c82280697e34474b41f711801afa')
 OR (SELECT count(*) FROM pg_trigger WHERE tgrelid='net.http_request_queue'::regclass)<>1
 OR NOT EXISTS(SELECT 1 FROM pg_trigger WHERE tgrelid='net.http_request_queue'::regclass
  AND tgname='jetnity_pgnet_request_id_v1' AND tgfoid='jetnity_pgnet_allocator_private.assign_request_id_v1()'::regprocedure
  AND tgtype=7 AND tgenabled='O' AND NOT tgisinternal AND tgqual IS NULL AND tgnargs=0)
 OR EXISTS(SELECT 1 FROM pg_namespace n,LATERAL aclexplode(coalesce(n.nspacl,acldefault('n',n.nspowner))) a
  WHERE n.nspname='jetnity_pgnet_allocator_private' AND (n.nspowner<>'postgres'::regrole OR a.grantee<>'postgres'::regrole))
 OR EXISTS(SELECT 1 FROM pg_class c,LATERAL aclexplode(coalesce(c.relacl,acldefault(CASE WHEN c.relkind='S' THEN 'S'::"char" ELSE 'r'::"char" END,c.relowner))) a
  WHERE c.relnamespace='jetnity_pgnet_allocator_private'::regnamespace AND c.relkind IN('r','S')
   AND (c.relowner<>'postgres'::regrole OR a.grantee<>'postgres'::regrole))
 OR EXISTS(SELECT 1 FROM pg_proc p,LATERAL aclexplode(coalesce(p.proacl,acldefault('f',p.proowner))) a
  WHERE p.oid='jetnity_pgnet_allocator_private.assign_request_id_v1()'::regprocedure
   AND (p.proowner<>'postgres'::regrole OR a.grantee<>'postgres'::regrole))
 OR (SELECT coalesce(max(id),0) FROM supabase_functions.hooks)>=(SELECT expected_hooks_after FROM pg_temp.dev_allocator_before WHERE singleton)
 OR NOT pg_temp.dev_http_inventory_exact()
 THEN RAISE EXCEPTION 'DEV_R2_PRIVATE_SCOPE_OR_HOOK_ID_NOT_EXACT' USING ERRCODE='P7998'; END IF;
END $r2_private_object_gate$;

-- The three actual API calls execute with their normal defaults and wake calls.
-- No hand-written queue insert stands in for a public API.
DO $r2_direct_apis$
DECLARE b pg_temp.dev_allocator_before%ROWTYPE; actual_get bigint; actual_post bigint; actual_delete bigint;
 headers jsonb:='{"Content-Type":"application/json","x-jetnity-proof":"r2-rollback-only"}'::jsonb;
BEGIN
 SELECT * INTO STRICT b FROM pg_temp.dev_allocator_before WHERE singleton;
 actual_get:=net.http_get(url:=b.probe_url_prefix||'get',params:='{}'::jsonb,headers:=headers,timeout_milliseconds:=1);
 actual_post:=net.http_post(url:=b.probe_url_prefix||'post',body:='{"probe":"r2-direct-post"}'::jsonb,
  params:='{}'::jsonb,headers:=headers,timeout_milliseconds:=1);
 actual_delete:=net.http_delete(url:=b.probe_url_prefix||'delete',params:='{}'::jsonb,headers:=headers,
  timeout_milliseconds:=1,body:='{"probe":"r2-direct-delete"}'::jsonb);
 IF ARRAY[actual_get,actual_post,actual_delete] IS DISTINCT FROM ARRAY[b.first_unused,b.first_unused+1,b.first_unused+2]
 THEN RAISE EXCEPTION 'DEV_R2_DIRECT_API_RETURNING_ID_MISMATCH' USING ERRCODE='P7998'; END IF;
 UPDATE pg_temp.dev_allocator_proof SET get_id=actual_get,post_id=actual_post,delete_id=actual_delete WHERE singleton;
END $r2_direct_apis$;

-- Genuine nesting: source-table AFTER INSERT -> installed webhook (functions
-- admin) -> real net.http_post -> bounded SD queue trigger -> real hooks INSERT.
INSERT INTO jetnity_pgnet_allocator_private.webhook_fixture_r2(id,payload)
VALUES(1,'r2-rollback-only');

-- No new grant: these roles already have net INSERT/USAGE/EXECUTE. SET ROLE
-- authority was checked before any probe. Values stay in local PL/pgSQL vars;
-- the role is restored before touching the private evidence table.
DO $r2_existing_public_roles$
DECLARE b pg_temp.dev_allocator_before%ROWTYPE; role_name text; allocated bigint; offset_id integer:=4;
 headers jsonb:='{"Content-Type":"application/json","x-jetnity-proof":"r2-rollback-only"}'::jsonb;
BEGIN
 SELECT * INTO STRICT b FROM pg_temp.dev_allocator_before WHERE singleton;
 FOREACH role_name IN ARRAY ARRAY['anon','authenticated','service_role'] LOOP
  EXECUTE format('SET LOCAL ROLE %I',role_name);
  IF current_user IS DISTINCT FROM role_name OR session_user<>'postgres'
   OR current_setting('session_replication_role') NOT IN('origin','local')
  THEN RAISE EXCEPTION 'DEV_R2_PUBLIC_ROLE_CONTEXT_NOT_EXACT' USING ERRCODE='P7998'; END IF;
  allocated:=net.http_get(url:=b.probe_url_prefix||'role-'||role_name,
   params:='{}'::jsonb,headers:=headers,timeout_milliseconds:=1);
  EXECUTE 'SET LOCAL ROLE postgres';
  IF current_user<>'postgres' OR allocated IS DISTINCT FROM b.first_unused+offset_id
  THEN RAISE EXCEPTION 'DEV_R2_PUBLIC_ROLE_RETURNING_ID_MISMATCH' USING ERRCODE='P7998'; END IF;
  IF role_name='anon' THEN UPDATE pg_temp.dev_allocator_proof SET anon_id=allocated WHERE singleton;
  ELSIF role_name='authenticated' THEN UPDATE pg_temp.dev_allocator_proof SET authenticated_id=allocated WHERE singleton;
  ELSE UPDATE pg_temp.dev_allocator_proof SET service_role_id=allocated WHERE singleton;
  END IF;
  offset_id:=offset_id+1;
 END LOOP;
END $r2_existing_public_roles$;

DO $r2_verify_paths$
DECLARE b pg_temp.dev_allocator_before%ROWTYPE; p pg_temp.dev_allocator_proof%ROWTYPE;
 current_state jsonb; webhook_request bigint; hook_row bigint; lv bigint; lc boolean; hv bigint; hc boolean;
 ids bigint[]; expected_webhook jsonb; skip_keys text[]:=ARRAY[
 'protected','legacy_sequence','hooks_sequence','queue_class','queue_triggers','queue_rows','hooks_rows','transport_dependencies'];
 expected_headers jsonb:='{"Content-Type":"application/json","x-jetnity-proof":"r2-rollback-only"}'::jsonb;
BEGIN
 SELECT * INTO STRICT b FROM pg_temp.dev_allocator_before WHERE singleton;
 SELECT * INTO STRICT p FROM pg_temp.dev_allocator_proof WHERE singleton;
 SELECT request_id,id INTO STRICT webhook_request,hook_row FROM supabase_functions.hooks
  WHERE hook_table_id::bigint=('jetnity_pgnet_allocator_private.webhook_fixture_r2'::regclass)::oid::bigint
   AND hook_name='dev_allocator_real_webhook_r2';
 ids:=ARRAY[p.get_id,p.post_id,p.delete_id,webhook_request,p.anon_id,p.authenticated_id,p.service_role_id];
 expected_webhook:=jsonb_build_object('old_record',NULL,'record',jsonb_build_object('id',1,'payload','r2-rollback-only'),
  'type','INSERT','table','webhook_fixture_r2','schema','jetnity_pgnet_allocator_private');
 SELECT last_value,is_called INTO STRICT lv,lc FROM net.http_request_queue_id_seq;
 SELECT last_value,is_called INTO STRICT hv,hc FROM supabase_functions.hooks_id_seq;
 current_state:=pg_temp.dev_allocator_runtime_state();
 IF current_user<>'postgres' OR session_user<>'postgres'
 OR current_setting('session_replication_role') NOT IN('origin','local')
 OR NOT EXISTS(SELECT 1 FROM pg_locks WHERE pid=pg_backend_pid() AND relation='net.http_request_queue'::regclass
  AND mode='ShareRowExclusiveLock' AND granted)
 OR NOT EXISTS(SELECT 1 FROM pg_locks WHERE pid=pg_backend_pid() AND relation='supabase_functions.hooks'::regclass
  AND mode='ShareRowExclusiveLock' AND granted)
 OR ids IS DISTINCT FROM ARRAY[b.first_unused,b.first_unused+1,b.first_unused+2,b.first_unused+3,b.first_unused+4,b.first_unused+5,b.first_unused+6]
 OR hook_row IS DISTINCT FROM b.expected_hooks_after
 OR lv IS DISTINCT FROM b.expected_legacy_after OR lc IS DISTINCT FROM true
 OR hv IS DISTINCT FROM b.expected_hooks_after OR hc IS DISTINCT FROM true
 OR (SELECT last_value FROM jetnity_pgnet_allocator_private.http_request_id_v1) IS DISTINCT FROM b.first_unused+6
 OR (SELECT is_called FROM jetnity_pgnet_allocator_private.http_request_id_v1) IS DISTINCT FROM true
 OR (SELECT count(*) FROM net.http_request_queue)<>b.original_queue_count+7
 OR (SELECT count(*) FROM supabase_functions.hooks)<>b.original_hooks_count+1
 OR (SELECT count(*) FROM jetnity_pgnet_allocator_private.webhook_fixture_r2)<>1
 OR (SELECT count(*) FROM net.http_request_queue WHERE id=ANY(ids))<>7
 OR EXISTS(SELECT 1 FROM net.http_request_queue WHERE id=ANY(ids)
  AND (headers IS DISTINCT FROM expected_headers OR timeout_milliseconds IS DISTINCT FROM 1))
 OR NOT EXISTS(SELECT 1 FROM net.http_request_queue WHERE id=p.get_id AND method='GET'
  AND url=b.probe_url_prefix||'get' AND body IS NULL)
 OR NOT EXISTS(SELECT 1 FROM net.http_request_queue WHERE id=p.post_id AND method='POST'
  AND url=b.probe_url_prefix||'post' AND convert_from(body,'UTF8')::jsonb='{"probe":"r2-direct-post"}'::jsonb)
 OR NOT EXISTS(SELECT 1 FROM net.http_request_queue WHERE id=p.delete_id AND method='DELETE'
  AND url=b.probe_url_prefix||'delete' AND convert_from(body,'UTF8')::jsonb='{"probe":"r2-direct-delete"}'::jsonb)
 OR NOT EXISTS(SELECT 1 FROM net.http_request_queue WHERE id=webhook_request AND method='POST'
  AND url=b.probe_url_prefix||'webhook' AND convert_from(body,'UTF8')::jsonb=expected_webhook)
 OR NOT EXISTS(SELECT 1 FROM net.http_request_queue WHERE id=p.anon_id AND method='GET'
  AND url=b.probe_url_prefix||'role-anon' AND body IS NULL)
 OR NOT EXISTS(SELECT 1 FROM net.http_request_queue WHERE id=p.authenticated_id AND method='GET'
  AND url=b.probe_url_prefix||'role-authenticated' AND body IS NULL)
 OR NOT EXISTS(SELECT 1 FROM net.http_request_queue WHERE id=p.service_role_id AND method='GET'
  AND url=b.probe_url_prefix||'role-service_role' AND body IS NULL)
 OR EXISTS(SELECT 1 FROM net._http_response WHERE id=ANY(ids))
 OR (SELECT encode(sha256(convert_to(coalesce(string_agg(to_jsonb(q)::text,'|' ORDER BY id,ctid),''),'UTF8')),'hex')
  FROM net.http_request_queue q WHERE NOT(id=ANY(ids))) IS DISTINCT FROM b.state->>'queue_rows'
 OR (SELECT encode(sha256(convert_to(coalesce(string_agg(to_jsonb(h)::text,'|' ORDER BY id,ctid),''),'UTF8')),'hex')
  FROM supabase_functions.hooks h WHERE h.id<>hook_row) IS DISTINCT FROM b.state->>'hooks_rows'
 OR (current_state-skip_keys) IS DISTINCT FROM (b.state-skip_keys)
 OR ((current_state->'protected')-'catalog') IS DISTINCT FROM ((b.state->'protected')-'catalog')
 OR NOT pg_temp.dev_http_inventory_exact()
 THEN RAISE EXCEPTION 'DEV_R2_ACTUAL_PATH_OR_COUNTER_PROOF_FAILED' USING ERRCODE='P7998'; END IF;
 -- Any catalogue dependency delta stays uncommitted; v7 is never refreshed.
 UPDATE pg_temp.dev_allocator_proof SET webhook_id=webhook_request,hook_row_id=hook_row,inner_checks_pass=true WHERE singleton;
END $r2_verify_paths$;

DO $r2_inner_complete$
BEGIN
 IF NOT EXISTS(SELECT 1 FROM pg_temp.dev_allocator_proof p CROSS JOIN pg_temp.dev_allocator_before b
  WHERE p.singleton AND b.singleton AND p.inner_checks_pass
   AND ARRAY[p.get_id,p.post_id,p.delete_id,p.webhook_id,p.anon_id,p.authenticated_id,p.service_role_id]
    =ARRAY[b.first_unused,b.first_unused+1,b.first_unused+2,b.first_unused+3,b.first_unused+4,b.first_unused+5,b.first_unused+6]
   AND p.hook_row_id=b.expected_hooks_after)
 THEN RAISE EXCEPTION 'DEV_R2_INNER_PROOF_MISSING' USING ERRCODE='P7998'; END IF;
END $r2_inner_complete$;

-- Queue/hooks locks precede this savepoint and survive its rollback.
-- New objects, grants/ACL dependencies and all probe rows disappear.
-- Existing nextval effects remain and must match exactly seven plus one calls.
ROLLBACK TO SAVEPOINT dev_allocator_install;
DO $r2_complete_rollback$
DECLARE b pg_temp.dev_allocator_before%ROWTYPE; now_state jsonb;
BEGIN
 SELECT * INTO STRICT b FROM pg_temp.dev_allocator_before WHERE singleton;
 now_state:=pg_temp.dev_allocator_runtime_state();
 IF current_user<>'postgres' OR session_user<>'postgres'
 OR to_regnamespace('jetnity_pgnet_allocator_private') IS NOT NULL
 OR (now_state-ARRAY['legacy_sequence','hooks_sequence']) IS DISTINCT FROM (b.state-ARRAY['legacy_sequence','hooks_sequence'])
 OR (now_state#>>'{legacy_sequence,last_value}')::bigint IS DISTINCT FROM b.expected_legacy_after
 OR (now_state#>>'{legacy_sequence,is_called}')::boolean IS DISTINCT FROM true
 OR (now_state#>>'{hooks_sequence,last_value}')::bigint IS DISTINCT FROM b.expected_hooks_after
 OR (now_state#>>'{hooks_sequence,is_called}')::boolean IS DISTINCT FROM true
 OR NOT EXISTS(SELECT 1 FROM pg_locks WHERE pid=pg_backend_pid() AND relation='net.http_request_queue'::regclass
  AND mode='ShareRowExclusiveLock' AND granted)
 OR NOT EXISTS(SELECT 1 FROM pg_locks WHERE pid=pg_backend_pid() AND relation='supabase_functions.hooks'::regclass
  AND mode='ShareRowExclusiveLock' AND granted)
 OR NOT pg_temp.dev_http_inventory_exact()
 OR current_setting('session_replication_role') NOT IN('origin','local')
 THEN RAISE EXCEPTION 'DEV_R2_ROLLBACK_OR_SEQUENCE_SIDE_EFFECT_NOT_EXACT' USING ERRCODE='P7998'; END IF;
 PERFORM official_v3_guard_private.assert_catalog_v1();
 PERFORM official_v3_guard_private.require_open_v1();
 IF public.official_v3_guard_alarm_status_v1()->>'status' IS DISTINCT FROM 'current'
 THEN RAISE EXCEPTION 'DEV_R2_BG1_NOT_CURRENT_AFTER_ROLLBACK' USING ERRCODE='P7998'; END IF;
 UPDATE pg_temp.dev_allocator_proof SET complete_install_rollback_exact=true WHERE singleton;
END $r2_complete_rollback$;

-- Safe aggregate only: no arbitrary request URLs/bodies/headers/private rows.
-- BIGINT counters are explicit text; no rounded JavaScript range evidence.
SELECT 'DEV_PGNET_OWNED_ALLOCATOR_SEVEN_API_WEBHOOK_ROLLBACK_PASS' AS result,
 b.historical_max::text AS actual_reserved_high_water,
 ARRAY[b.first_unused::text,(b.first_unused+1)::text,(b.first_unused+2)::text,(b.first_unused+3)::text,
  (b.first_unused+4)::text,(b.first_unused+5)::text,(b.first_unused+6)::text] AS validated_request_ids,
 3 AS actual_direct_net_api_calls,1 AS actual_nested_webhook_calls,3 AS actual_additional_public_role_calls,
 7 AS expected_legacy_nextval_calls,1 AS expected_hooks_nextval_calls,
 b.state->'legacy_sequence' AS legacy_sequence_before,
 jsonb_build_object('last_value',l.last_value::text,'log_cnt',l.log_cnt::text,'is_called',l.is_called) AS legacy_sequence_after,
 (l.last_value-b.legacy_last)::text AS actual_legacy_numeric_delta,
 b.state->'hooks_sequence' AS hooks_sequence_before,
 jsonb_build_object('last_value',h.last_value::text,'log_cnt',h.log_cnt::text,'is_called',h.is_called) AS hooks_sequence_after,
 (h.last_value-b.hooks_last)::text AS actual_hooks_numeric_delta,
 p.complete_install_rollback_exact,
 true AS original_queue_responses_hooks_catalog_v7_sources_facts_receipts_restored,
 true AS new_allocator_trigger_fixture_and_dependency_rows_removed,
 true AS legacy_and_hooks_nextval_effects_explicitly_preserved,
 true AS actual_get_post_delete_and_nested_webhook_executed,
 true AS anon_authenticated_service_role_without_new_grants_tested,
 false AS existing_sequence_restart_tested,false AS existing_nextval_rolled_back,
 false AS real_network_delivery_tested,false AS source_renewal_tested,
 false AS multisession_concurrency_tested,false AS restart_durability_tested,
 false AS replica_bypass_prevention_tested,false AS v8_tamper_guard_installed,
 false AS persistent_allocator_install,false AS probe_http_request_sent,false AS production_write
FROM pg_temp.dev_allocator_before b CROSS JOIN pg_temp.dev_allocator_proof p
 CROSS JOIN net.http_request_queue_id_seq l CROSS JOIN supabase_functions.hooks_id_seq h
WHERE b.singleton AND p.singleton AND p.complete_install_rollback_exact;
ROLLBACK;
