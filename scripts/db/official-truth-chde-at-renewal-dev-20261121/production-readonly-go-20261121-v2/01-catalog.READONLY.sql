-- DRAFT FOR OWNER REVIEW; NOT EXECUTED. Only after explicit Production READ Go.
-- Fixed connector target: qscbgcdmivbbnzrcyegn. SQL cannot authenticate a Supabase project ref.
-- V2: four named required ID paths, fourteen optional paths including hooks.
-- 01: catalog metadata only; one result, at most 64 discovered ID paths, 64 KiB output. No app routine, HTTP, Owner, audit, publication, lock, sequence advance or DDL.
BEGIN TRANSACTION ISOLATION LEVEL REPEATABLE READ READ ONLY;
SET LOCAL search_path=pg_catalog,pg_temp;
SET LOCAL timezone='UTC';
SET LOCAL statement_timeout='8s';
SET LOCAL lock_timeout='500ms';
SET LOCAL idle_in_transaction_session_timeout='12s';
SET LOCAL transaction_timeout='12s';
WITH expected_id(schema_name,table_name,column_name,expected_persistence,required_for_core) AS (VALUES
 ('official_v3_at_production_private','watch_requests_v1','request_id','p',true),
 ('jetnity_prod_import_scheduler','dispatches_v1','net_request_id','p',true),
 ('supabase_functions','hooks','request_id','p',false),
 ('net','http_request_queue','id','u',true),
 ('net','_http_response','id','u',true),
 ('jetnity_dev_import_scheduler','dispatches_v1','net_request_id','p',false),
 ('jetnity_dev_import_scheduler','preview_dispatches_v1','net_request_id','p',false),
 ('official_v3_at_source_watch_private','reads_v1','request_id','p',false),
 ('official_v3_source_renewal_private','observations_v1','request_id','p',false),
 ('jetnity_followup_source_monitor_private','items_v1','request_id','p',false),
 ('jetnity_followup_source_monitor_private','items_v2','pgnet_request_id','p',false),
 ('jetnity_followup_source_monitor_private','items_v3','request_id','p',false),
 ('jetnity_global_source_monitor_private','requests_v1','request_id','p',false),
 ('jetnity_usagov_fallback_private','original_v1','request_id','p',false),
 ('jetnity_usagov_watch_private','requests_v1','request_id','p',false),
 ('jetnity_usagov_watch_private','observations_v1','request_id','p',false),
 ('jetnity_source_dispatch_private','requests_v1','request_id','p',false),
 ('jetnity_source_dispatch_private','observations_v1','request_id','p',false)
), required_column(schema_name,table_name,column_name,expected_type) AS (VALUES
 ('official_v3_guard_private','state_v1','singleton','boolean'),
 ('official_v3_guard_private','state_v1','generation','bigint'),
 ('official_v3_guard_private','state_v1','last_due','timestamp with time zone'),
 ('official_v3_guard_private','state_v1','last_started','timestamp with time zone'),
 ('official_v3_guard_private','state_v1','last_proof_started','timestamp with time zone'),
 ('official_v3_guard_private','state_v1','last_finished','timestamp with time zone'),
 ('official_v3_guard_private','state_v1','valid_until','timestamp with time zone'),
 ('official_v3_guard_private','state_v1','incident_generation','bigint'),
 ('official_v3_guard_private','state_v1','resumed_generation','bigint'),
 ('official_v3_guard_private','state_v1','last_observed','timestamp with time zone'),
 ('official_v3_guard_private','runs_v1','generation','bigint'),
 ('official_v3_guard_private','runs_v1','due_at','timestamp with time zone'),
 ('official_v3_guard_private','runs_v1','started_at','timestamp with time zone'),
 ('official_v3_guard_private','runs_v1','proof_started_at','timestamp with time zone'),
 ('official_v3_guard_private','runs_v1','finished_at','timestamp with time zone'),
 ('official_v3_guard_private','runs_v1','outcome','text'),
 ('official_v3_guard_private','bg1_transient_baseline_v3','singleton','boolean'),
 ('official_v3_guard_private','bg1_transient_baseline_v3','required_generation','bigint'),
 ('official_v3_guard_private','bg1_transient_baseline_v3','proof_not_before','timestamp with time zone'),
 ('official_v3_guard_private','bg1_transient_baseline_v3','catalog','jsonb'),
 ('official_v3_at_production_private','source_pins_v1','source_id','text'),
 ('official_v3_at_production_private','source_pins_v1','source_qualified','boolean'),
 ('official_v3_at_production_private','source_pins_v1','research_only','boolean'),
 ('official_v3_at_production_private','first_originals_v1','legal_source_approved','boolean'),
 ('official_v3_at_production_private','first_originals_v1','customer_rule_approved','boolean'),
 ('official_v3_at_production_private','ch_visa_facts_v1','expires_at','timestamp with time zone'),
 ('cron','job','jobid','bigint'),
 ('cron','job','jobname','text'),
 ('cron','job','schedule','text'),
 ('cron','job','command','text'),
 ('cron','job','database','text'),
 ('cron','job','username','text'),
 ('cron','job','active','boolean'),
 ('cron','job_run_details','runid','bigint'),
 ('cron','job_run_details','jobid','bigint'),
 ('cron','job_run_details','command','text'),
 ('cron','job_run_details','database','text'),
 ('cron','job_run_details','username','text'),
 ('cron','job_run_details','status','text'),
 ('cron','job_run_details','start_time','timestamp with time zone'),
 ('cron','job_run_details','end_time','timestamp with time zone'),
 ('official_v3_at_production_private','watch_requests_v1','request_id','bigint'),
 ('jetnity_prod_import_scheduler','dispatches_v1','net_request_id','bigint'),
 ('net','http_request_queue','id','bigint'),
 ('net','_http_response','id','bigint')
), relation_target(schema_name,table_name) AS (VALUES
 ('cron','job'),
 ('cron','job_run_details'),
 ('jetnity_dev_import_scheduler','dispatches_v1'),
 ('jetnity_dev_import_scheduler','preview_dispatches_v1'),
 ('jetnity_followup_source_monitor_private','items_v1'),
 ('jetnity_followup_source_monitor_private','items_v2'),
 ('jetnity_followup_source_monitor_private','items_v3'),
 ('jetnity_global_source_monitor_private','requests_v1'),
 ('jetnity_pgnet_allocator_private','http_request_id_v1'),
 ('jetnity_prod_import_scheduler','dispatches_v1'),
 ('jetnity_source_dispatch_private','observations_v1'),
 ('jetnity_source_dispatch_private','requests_v1'),
 ('jetnity_usagov_fallback_private','original_v1'),
 ('jetnity_usagov_watch_private','observations_v1'),
 ('jetnity_usagov_watch_private','requests_v1'),
 ('net','_http_response'),
 ('net','http_request_queue'),
 ('net','http_request_queue_id_seq'),
 ('official_v3_at_production_private','ch_visa_facts_v1'),
 ('official_v3_at_production_private','first_originals_v1'),
 ('official_v3_at_production_private','source_pins_v1'),
 ('official_v3_at_production_private','watch_requests_v1'),
 ('official_v3_at_source_watch_private','reads_v1'),
 ('official_v3_guard_private','admin_runtime_baseline_v1'),
 ('official_v3_guard_private','at_batch_switch_baseline_v2'),
 ('official_v3_guard_private','at_legal_source_guard_baseline_v4'),
 ('official_v3_guard_private','at_source_monitor_baseline_v1'),
 ('official_v3_guard_private','bg1_dev_grantor_restore_v7'),
 ('official_v3_guard_private','bg1_dev_http_id_allocator_v8'),
 ('official_v3_guard_private','bg1_transient_baseline_v3'),
 ('official_v3_guard_private','bg1_transient_correction_baseline_v4'),
 ('official_v3_guard_private','rolling_quota_baseline_v1'),
 ('official_v3_guard_private','runs_v1'),
 ('official_v3_guard_private','saved_offers_baseline_v1'),
 ('official_v3_guard_private','state_v1'),
 ('official_v3_guard_private','status_baseline_v1'),
 ('official_v3_guard_private','weather_quota_baseline_v1'),
 ('official_v3_source_renewal_private','observations_v1'),
 ('supabase_functions','hooks')
), function_target(signature,schema_name,function_name,argument_types) AS (VALUES
 ('net.http_get(text,jsonb,jsonb,integer)','net','http_get','text, jsonb, jsonb, integer'),
 ('net.http_post(text,jsonb,jsonb,jsonb,integer)','net','http_post','text, jsonb, jsonb, jsonb, integer'),
 ('net.http_delete(text,jsonb,jsonb,integer,jsonb)','net','http_delete','text, jsonb, jsonb, integer, jsonb'),
 ('supabase_functions.http_request()','supabase_functions','http_request',''),
 ('official_v3_guard_private.audit_v1()','official_v3_guard_private','audit_v1',''),
 ('official_v3_guard_private.assert_catalog_v1()','official_v3_guard_private','assert_catalog_v1',''),
 ('official_v3_guard_private.catalog_status_v1()','official_v3_guard_private','catalog_status_v1',''),
 ('official_v3_guard_private.require_open_v1()','official_v3_guard_private','require_open_v1',''),
 ('public.official_v3_guard_alarm_status_v1()','public','official_v3_guard_alarm_status_v1',''),
 ('official_v3_at_production_private.enqueue_v1()','official_v3_at_production_private','enqueue_v1',''),
 ('official_v3_at_production_private.collect_v1()','official_v3_at_production_private','collect_v1',''),
 ('official_v3_at_production_private.renew_ch_v1()','official_v3_at_production_private','renew_ch_v1',''),
 ('jetnity_pgnet_allocator_private.assign_request_id_v1()','jetnity_pgnet_allocator_private','assign_request_id_v1','')
), context AS (SELECT (current_database()='postgres' AND current_user='postgres' AND session_user='postgres'
 AND current_setting('server_version_num')::integer/10000=17
 AND current_setting('transaction_read_only')='on'
 AND current_setting('transaction_isolation')='repeatable read'
 AND current_setting('session_replication_role') IN('origin','local')
 AND EXISTS(SELECT 1 FROM pg_roles WHERE rolname=current_user AND rolbypassrls)
 AND to_regclass('official_v3_at_production_private.source_pins_v1') IS NOT NULL
 AND to_regclass('jetnity_prod_import_scheduler.dispatches_v1') IS NOT NULL
 AND to_regclass('official_v3_guard_private.bg1_transient_baseline_v3') IS NOT NULL
 AND to_regclass('official_v3_guard_private.bg1_dev_grantor_restore_v7') IS NULL
 AND to_regclass('official_v3_guard_private.bg1_dev_http_id_allocator_v8') IS NULL) AS context_ok),
 actual_ids AS MATERIALIZED (
 SELECT n.nspname::text schema_name,c.relname::text table_name,a.attname::text column_name,
  c.oid relation_oid,a.attnum,c.relpersistence::text persistence,c.relkind::text kind,c.relispartition,
  EXISTS(SELECT 1 FROM pg_inherits h WHERE h.inhrelid=c.oid OR h.inhparent=c.oid) AS inherited_or_parent,
  EXISTS(SELECT 1 FROM pg_index i JOIN pg_class ic ON ic.oid=i.indexrelid
    JOIN pg_am am ON am.oid=ic.relam WHERE i.indrelid=c.oid AND i.indisvalid
    AND i.indisready AND i.indpred IS NULL AND am.amname='btree' AND i.indkey[0]=a.attnum)
    AS leading_btree_index
 FROM pg_class c JOIN pg_namespace n ON n.oid=c.relnamespace
 JOIN pg_attribute a ON a.attrelid=c.oid
 WHERE c.relkind IN('r','p') AND c.relpersistence IN('p','u')
 AND n.nspname NOT IN('pg_catalog','information_schema')
 AND n.nspname NOT LIKE 'pg_toast%' AND n.nspname NOT LIKE 'pg_temp%'
 AND a.attnum>0 AND NOT a.attisdropped AND a.atttypid='pg_catalog.int8'::regtype
 AND (a.attname~'(^|_)request_id$'
  OR n.nspname='net' AND c.relname IN('http_request_queue','_http_response') AND a.attname='id')
), id_review AS (
 SELECT a.*,(e.schema_name IS NOT NULL AND a.persistence=e.expected_persistence
   AND a.kind='r' AND NOT a.relispartition AND NOT a.inherited_or_parent) AS known_fixed_shape
 FROM actual_ids a LEFT JOIN expected_id e USING(schema_name,table_name,column_name)
), known_id_contract AS (
 -- Check every fixed path directly, even when its column ceased to be bigint.
 -- Only optional missing relations are ABSENT. Every required core relation must be present.
 -- A present wrong shape or missing read privilege remains STOP.
 SELECT e.schema_name,e.table_name,e.column_name,e.required_for_core,
  c.oid IS NOT NULL AS relation_present,
  coalesce(a.attnum IS NOT NULL AND NOT a.attisdropped,false) AS column_present,
  CASE WHEN a.attnum IS NOT NULL THEN format_type(a.atttypid,a.atttypmod) END AS actual_type,
  coalesce(c.relkind='r' AND NOT c.relispartition
   AND NOT EXISTS(SELECT 1 FROM pg_inherits h WHERE h.inhrelid=c.oid OR h.inhparent=c.oid)
   AND c.relpersistence::text=e.expected_persistence
   AND a.attnum>0 AND NOT a.attisdropped AND a.atttypid='pg_catalog.int8'::regtype
   AND has_schema_privilege(current_user,n.oid,'USAGE')
   AND has_table_privilege(current_user,c.oid,'SELECT'),false) AS fixed_shape,
  CASE WHEN c.oid IS NULL AND e.required_for_core THEN 'STOP_REQUIRED_ID_RELATION_MISSING'
   WHEN c.oid IS NULL THEN 'ABSENT_RELATION'
   WHEN a.attnum IS NULL OR a.attisdropped THEN 'STOP_KNOWN_ID_COLUMN_MISSING'
   WHEN a.atttypid<>'pg_catalog.int8'::regtype THEN 'STOP_KNOWN_ID_COLUMN_NOT_BIGINT'
   WHEN c.relkind<>'r' OR c.relispartition
    OR EXISTS(SELECT 1 FROM pg_inherits h WHERE h.inhrelid=c.oid OR h.inhparent=c.oid)
    THEN 'STOP_KNOWN_ID_RELATION_SHAPE'
   WHEN c.relpersistence::text<>e.expected_persistence THEN 'STOP_KNOWN_ID_PERSISTENCE'
   WHEN NOT has_schema_privilege(current_user,n.oid,'USAGE') THEN 'STOP_KNOWN_ID_SCHEMA_PRIVILEGE'
   WHEN NOT has_table_privilege(current_user,c.oid,'SELECT') THEN 'STOP_KNOWN_ID_READ_PRIVILEGE'
   ELSE 'PRESENT_FIXED' END AS contract_status
 FROM expected_id e LEFT JOIN pg_namespace n ON n.nspname=e.schema_name
 LEFT JOIN pg_class c ON c.relnamespace=n.oid AND c.relname=e.table_name
 LEFT JOIN pg_attribute a ON a.attrelid=c.oid AND a.attname=e.column_name AND a.attnum>0
), column_review AS (
 SELECT e.*,
  CASE WHEN e.schema_name='cron' AND e.column_name IN('jobname','database','username')
    AND e.expected_type='text' THEN 'pg_catalog.name' END AS allowed_alternative_type,
  CASE WHEN a.attnum IS NOT NULL THEN format_type(a.atttypid,a.atttypmod) END AS actual_type,
  coalesce(c.relkind='r' AND NOT c.relispartition
   AND NOT EXISTS(SELECT 1 FROM pg_inherits h WHERE h.inhrelid=c.oid OR h.inhparent=c.oid)
   -- cron identifiers may be built-in text or name; no domain/custom type.
   AND (a.atttypid=to_regtype(e.expected_type)
     OR e.schema_name='cron' AND e.column_name IN('jobname','database','username')
       AND e.expected_type='text' AND a.atttypid='pg_catalog.name'::regtype)
   AND NOT a.attisdropped
   AND has_schema_privilege(current_user,n.oid,'USAGE')
   AND has_table_privilege(current_user,c.oid,'SELECT'),false) AS exact_readable_plain_table_column
 FROM required_column e LEFT JOIN pg_namespace n ON n.nspname=e.schema_name
 LEFT JOIN pg_class c ON c.relnamespace=n.oid AND c.relname=e.table_name
 LEFT JOIN pg_attribute a ON a.attrelid=c.oid AND a.attname=e.column_name AND a.attnum>0
), relation_review AS (
 SELECT t.schema_name,t.table_name,c.oid IS NOT NULL AS present,c.relkind::text AS kind,
 c.relpersistence::text AS persistence,pg_get_userbyid(c.relowner) AS owner,
 c.relrowsecurity,c.relforcerowsecurity,c.relispartition,
 CASE WHEN c.relkind='S' THEN has_sequence_privilege(current_user,c.oid,'SELECT')
  WHEN c.relkind='r' THEN has_table_privilege(current_user,c.oid,'SELECT') END AS current_select,
 CASE WHEN c.relkind='r' THEN has_table_privilege(current_user,c.oid,'TRIGGER') END AS current_trigger,
 CASE WHEN c.oid IS NOT NULL THEN pg_has_role(current_user,c.relowner,'USAGE') END AS current_owner_usage,
 CASE WHEN c.oid IS NOT NULL THEN pg_has_role(current_user,c.relowner,'SET') END AS current_owner_set,
 (SELECT coalesce(jsonb_agg(jsonb_build_object('grantor',pg_get_userbyid(a.grantor),
   'grantee',CASE WHEN a.grantee=0 THEN 'PUBLIC' ELSE pg_get_userbyid(a.grantee) END,
   'privilege',a.privilege_type,'grantable',a.is_grantable)
   ORDER BY a.grantee,a.privilege_type),'[]'::jsonb)
  FROM (SELECT * FROM aclexplode(coalesce(c.relacl,acldefault(
   CASE WHEN c.relkind='S' THEN 's'::"char" ELSE 'r'::"char" END,c.relowner))) LIMIT 65) a) AS acl_at_most_65,
 (SELECT count(*)>64 FROM aclexplode(coalesce(c.relacl,acldefault(
   CASE WHEN c.relkind='S' THEN 's'::"char" ELSE 'r'::"char" END,c.relowner)))) AS acl_over_64,
 CASE WHEN c.relkind='S' THEN (SELECT jsonb_build_object('type',s.seqtypid::regtype::text,
   'start',s.seqstart::text,'min',s.seqmin::text,'max',s.seqmax::text,'increment',s.seqincrement::text,
   'cache',s.seqcache::text,'cycle',s.seqcycle) FROM pg_sequence s WHERE s.seqrelid=c.oid) END AS sequence_parameters
 FROM relation_target t LEFT JOIN pg_namespace n ON n.nspname=t.schema_name
 LEFT JOIN pg_class c ON c.relnamespace=n.oid AND c.relname=t.table_name
), function_review AS (
 SELECT t.signature,p.oid IS NOT NULL AS present,pg_get_userbyid(p.proowner) AS owner,
 p.prosecdef AS security_definer,p.provolatile::text AS volatility,p.prokind::text AS kind,
 CASE WHEN p.prokind='f' THEN encode(sha256(convert_to(pg_get_functiondef(p.oid),'UTF8')),'hex') END AS definition_sha256,
 CASE WHEN p.prokind='f' THEN encode(sha256(convert_to(p.prosrc,'UTF8')),'hex') END AS body_sha256,
 CASE WHEN p.oid IS NOT NULL THEN encode(sha256(convert_to(coalesce(array_to_json(p.proconfig)::text,'null'),'UTF8')),'hex') END AS config_sha256,
 (SELECT coalesce(jsonb_agg(jsonb_build_object('grantor',pg_get_userbyid(a.grantor),
   'grantee',CASE WHEN a.grantee=0 THEN 'PUBLIC' ELSE pg_get_userbyid(a.grantee) END,
   'privilege',a.privilege_type,'grantable',a.is_grantable) ORDER BY a.grantee,a.privilege_type),'[]'::jsonb)
   FROM (SELECT * FROM aclexplode(coalesce(p.proacl,acldefault('f',p.proowner))) LIMIT 65) a) AS acl_at_most_65,
 (SELECT count(*)>64 FROM aclexplode(coalesce(p.proacl,acldefault('f',p.proowner)))) AS acl_over_64
 FROM function_target t LEFT JOIN pg_namespace fn ON fn.nspname=t.schema_name
 LEFT JOIN pg_proc p ON p.pronamespace=fn.oid AND p.proname=t.function_name
  AND oidvectortypes(p.proargtypes)=t.argument_types
), queue_trigger AS (
 SELECT t.tgname::text AS trigger_name,t.tgtype,t.tgenabled::text,t.tgisinternal,t.tgnargs,
  pg_get_userbyid(p.proowner) AS function_owner,p.prosecdef,
  encode(sha256(convert_to(pg_get_triggerdef(t.oid),'UTF8')),'hex') AS trigger_definition_sha256,
  encode(sha256(convert_to(pg_get_functiondef(p.oid),'UTF8')),'hex') AS function_definition_sha256
 FROM pg_trigger t JOIN pg_proc p ON p.oid=t.tgfoid
 WHERE t.tgrelid=to_regclass('net.http_request_queue') ORDER BY t.tgname LIMIT 9
), schema_review AS (
 SELECT wanted.schema_name,n.oid IS NOT NULL AS present,pg_get_userbyid(n.nspowner) AS owner,
 (SELECT coalesce(jsonb_agg(jsonb_build_object('grantor',pg_get_userbyid(a.grantor),
   'grantee',CASE WHEN a.grantee=0 THEN 'PUBLIC' ELSE pg_get_userbyid(a.grantee) END,
   'privilege',a.privilege_type,'grantable',a.is_grantable) ORDER BY a.grantee,a.privilege_type),'[]'::jsonb)
   FROM (SELECT * FROM aclexplode(coalesce(n.nspacl,acldefault('n',n.nspowner))) LIMIT 65) a) AS acl_at_most_65,
 (SELECT count(*)>64 FROM aclexplode(coalesce(n.nspacl,acldefault('n',n.nspowner)))) AS acl_over_64
 FROM (SELECT DISTINCT schema_name FROM relation_target) wanted
 LEFT JOIN pg_namespace n ON n.nspname=wanted.schema_name
), gates AS (
 SELECT context_ok,
 (SELECT bool_and(exact_readable_plain_table_column) FROM column_review) AS fixed_columns_ready,
 (SELECT bool_and(contract_status IN('ABSENT_RELATION','PRESENT_FIXED')) FROM known_id_contract) AS fixed_id_contracts_ready,
 (SELECT count(*)=4 AND bool_and(contract_status='PRESENT_FIXED')
  FROM known_id_contract WHERE required_for_core) AS required_core_id_paths_ready,
 (SELECT count(*)<=64 AND coalesce(bool_and(known_fixed_shape),false) FROM id_review) AS bounded_id_inventory_known,
 (SELECT coalesce(bool_and(NOT coalesce(acl_over_64,false)),true) FROM relation_review) AS relation_acls_bounded,
 (SELECT coalesce(bool_and(NOT coalesce(acl_over_64,false)),true) FROM function_review) AS function_acls_bounded,
 (SELECT coalesce(bool_and(NOT coalesce(acl_over_64,false)),true) FROM schema_review) AS schema_acls_bounded,
 (SELECT count(*)<=8 FROM queue_trigger) AS queue_triggers_bounded,
 coalesce((SELECT c.relkind='S' AND has_schema_privilege(current_user,c.relnamespace,'USAGE')
  AND has_sequence_privilege(current_user,c.oid,'SELECT')
  AND s.seqtypid='pg_catalog.int8'::regtype FROM pg_class c JOIN pg_sequence s ON s.seqrelid=c.oid
  WHERE c.oid=to_regclass('net.http_request_queue_id_seq')),false) AS sequence_readable
 FROM context
), decision AS (
 SELECT g.*,coalesce(context_ok AND fixed_columns_ready AND fixed_id_contracts_ready
  AND required_core_id_paths_ready AND bounded_id_inventory_known
  AND relation_acls_bounded AND function_acls_bounded AND schema_acls_bounded
  AND queue_triggers_bounded AND sequence_readable,false) AS data_phase_allowed
 FROM gates g
), payload AS (
 SELECT jsonb_build_object(
 'package','PROD_READONLY_BASELINE_20261121_V2','declared_target','qscbgcdmivbbnzrcyegn',
 'project_ref_authenticated_by_sql',false,'observed_at',statement_timestamp(),
 'database',current_database(),'current_role',current_user,'session_role',session_user,
 'server_version_num',current_setting('server_version_num'),'read_only',current_setting('transaction_read_only'),
 'replication_context',current_setting('session_replication_role'),
 'role_metadata',(SELECT jsonb_build_object('superuser',rolsuper,'bypassrls',rolbypassrls,'createrole',rolcreaterole) FROM pg_roles WHERE rolname=current_user),
 'extension_versions',(SELECT coalesce(jsonb_agg(jsonb_build_object('name',extname,'version',extversion) ORDER BY extname),'[]'::jsonb) FROM pg_extension WHERE extname IN('pg_net','pg_cron')),
 'gates',(SELECT to_jsonb(g) FROM gates g),
 'catalog_status',CASE WHEN data_phase_allowed THEN 'READY_FOR_FIXED_READ_PHASES_ONLY' ELSE 'STOP_REVIEW_NO_DATA_PHASE' END,
 'data_phase_allowed',data_phase_allowed,
 'selected_core_query_file',CASE WHEN data_phase_allowed THEN (
   SELECT CASE contract_status WHEN 'PRESENT_FIXED' THEN '03-core-id-maxima-with-hooks.READONLY.sql'
    WHEN 'ABSENT_RELATION' THEN '03-core-id-maxima-without-hooks.READONLY.sql' END
   FROM known_id_contract WHERE schema_name='supabase_functions' AND table_name='hooks' AND column_name='request_id') END,
 'optional_hooks',(
   SELECT jsonb_build_object('path','supabase_functions.hooks.request_id','required',false,
    'status',contract_status,'display',CASE WHEN contract_status='ABSENT_RELATION' THEN 'nicht vorhanden'
     WHEN contract_status='PRESENT_FIXED' THEN 'vorhanden' ELSE 'STOP' END,'maximum_not_read_in_catalog',true)
   FROM known_id_contract WHERE schema_name='supabase_functions' AND table_name='hooks' AND column_name='request_id'),
 'actual_id_path_count',(SELECT count(*) FROM actual_ids),
 'actual_id_paths',(SELECT coalesce(jsonb_agg(to_jsonb(x)-'relation_oid'-'attnum' ORDER BY schema_name,table_name,column_name),'[]'::jsonb) FROM (SELECT * FROM id_review ORDER BY schema_name,table_name,column_name LIMIT 64) x),
 'known_id_path_presence',(SELECT jsonb_agg(jsonb_build_object('schema',k.schema_name,'table',k.table_name,'column',k.column_name,
   'present',k.relation_present,'column_present',k.column_present,'actual_type',k.actual_type,
   'required_for_core',k.required_for_core,'fixed_shape',k.fixed_shape,'contract_status',k.contract_status,
   'presence_display',CASE WHEN k.contract_status='ABSENT_RELATION' THEN 'nicht vorhanden'
    WHEN k.contract_status='PRESENT_FIXED' THEN 'vorhanden' ELSE 'STOP' END)
   ORDER BY k.schema_name,k.table_name,k.column_name) FROM known_id_contract k),
 'column_contracts',(SELECT jsonb_agg(to_jsonb(c) ORDER BY schema_name,table_name,column_name) FROM column_review c),
 'relation_metadata',(SELECT jsonb_agg(to_jsonb(r) ORDER BY schema_name,table_name) FROM relation_review r),
 'function_metadata',(SELECT jsonb_agg(to_jsonb(f) ORDER BY signature) FROM function_review f),
 'schema_metadata',(SELECT jsonb_agg(to_jsonb(s) ORDER BY schema_name) FROM schema_review s),
 'queue_triggers',(SELECT coalesce(jsonb_agg(to_jsonb(t) ORDER BY trigger_name),'[]'::jsonb) FROM queue_trigger t),
 'product_routine_invoked',false,'repair_permission',false,'publication_permission',false) AS document
 FROM decision
)
SELECT CASE WHEN octet_length(document::text)<=65536 THEN document ELSE
 jsonb_build_object('catalog_status','STOP_OUTPUT_OVER_65536_BYTES','data_phase_allowed',false) END AS result
FROM payload;
ROLLBACK;
