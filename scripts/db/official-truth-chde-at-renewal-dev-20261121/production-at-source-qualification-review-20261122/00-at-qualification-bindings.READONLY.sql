-- PREPARED ONLY / NOT EXECUTED. Package phase: source decision + binding read.
-- Target must also be verified out of band: qscbgcdmivbbnzrcyegn / Production.
-- Exactly once after its separate Go; one READ ONLY transaction, always ROLLBACK.
-- No HTTP request, source action, Owner action, Publisher, write, sequence allocation,
-- role/ACL change, stored project routine invocation or extra/retry query is permitted.
BEGIN TRANSACTION ISOLATION LEVEL REPEATABLE READ READ ONLY;
SET LOCAL search_path=pg_catalog;
SET LOCAL timezone='UTC';
SET LOCAL statement_timeout='15s';
SET LOCAL lock_timeout='500ms';
SET LOCAL idle_in_transaction_session_timeout='20s';
SET LOCAL transaction_timeout='20s';
SET LOCAL row_security=off;
DO $postcommit_pinned_read_context$
DECLARE item record;
BEGIN
 IF current_database()<>'postgres' OR current_user<>'postgres' OR session_user<>'postgres'
 OR current_setting('server_version_num')::integer/10000<>17
 OR current_setting('transaction_read_only')<>'on'
 OR current_setting('session_replication_role') NOT IN('origin','local')
 OR to_regclass('official_v3_at_production_private.source_pins_v1') IS NULL
 OR to_regclass('jetnity_prod_import_scheduler.dispatches_v1') IS NULL
 OR to_regclass('official_v3_guard_private.bg1_dev_grantor_restore_v7') IS NOT NULL
 OR to_regclass('official_v3_guard_private.bg1_production_http_allocator_v4') IS NULL
 THEN RAISE EXCEPTION 'PROD_HTTP_READBACK_WRONG_INSTALLED_CONTEXT' USING ERRCODE='P7998'; END IF;
 FOR item IN SELECT * FROM (VALUES
  ('official_v3_guard_private.catalog_status_v1()','66612df9bbc2ba0aeb016f97c5c245c76f176e13c02bd1150c5cc618c5363601'),
  ('official_v3_guard_private.assert_catalog_v1()','4d9f578d59ef1f998cf9a26385c078eaacd8dbd375629f965d8feaeb46582eb8'),
  ('official_v3_guard_private.require_open_v1()','de352dc414b5a5545cc0cb0edc245ed2312777d73b250adcdc9b93ca804ebcae'),
  ('public.official_v3_guard_alarm_status_v1()','74c42a03ffa33e850383eaa995af8f935e6686aa4f445719faa3313971fc488f'),
  ('official_v3_at_production_private.renew_ch_v1()','572a243b45785800f67f372c0667397d448e1eea5769c74065d4709a59e3b562')
 ) expected(signature,digest) LOOP
  IF (SELECT encode(sha256(convert_to(prosrc,'UTF8')),'hex') FROM pg_proc WHERE oid=to_regprocedure(item.signature)) IS DISTINCT FROM item.digest
  THEN RAISE EXCEPTION 'PROD_HTTP_READBACK_CHANGED_DEFINITION: %',item.signature USING ERRCODE='P7998'; END IF;
 END LOOP;
 
 -- Check the unchanged calling/authority contract BEFORE the first guard invocation.
 -- Full expected pg_get_functiondef SHA is derived by changing only the body of
 -- native predecessor bytes whose complete SHA matches actual 02. This also binds
 -- STRICT, PARALLEL, LEAKPROOF, set-return and every rendered header attribute.
 -- ACL/config/owner metadata are checked separately; no unknown live header is adopted.
 FOR item IN SELECT * FROM (VALUES
 ('official_v3_guard_private.catalog_status_v1()','sql','postgres',true,'s','jsonb','832d3a9c7b63b399d0470999a0f869119332fb42e27ab93c9c7b65122675b540','0eddb5d2ed46f2e695f62703619d14e395be90a903b67dea2da63eb0dc8e40b1','d80009f6db49c88fb446ee7ce140abafbfe35005e07db453b83b10c068964adf'),
 ('official_v3_guard_private.assert_catalog_v1()','plpgsql','postgres',true,'v','void','832d3a9c7b63b399d0470999a0f869119332fb42e27ab93c9c7b65122675b540','f156afc13bf2dac90d3d3f2965f5e4e3379aaa44d4dacc6ccd902462c63232e1','51527fcf925bb0314187d34c38796bb376230f44e4f36ae1801624a4b9141360'),
 ('official_v3_guard_private.require_open_v1()','plpgsql','postgres',true,'v','bigint','8d7f7dc66cd0965d575cf544d4f9a773c46bda7374851b88fe8da42ea59113f2','f156afc13bf2dac90d3d3f2965f5e4e3379aaa44d4dacc6ccd902462c63232e1','a83142cfd6e51926305171d60f41042792d249d7a4a92ddb7966c485c4dc526b'),
 ('public.official_v3_guard_alarm_status_v1()','plpgsql','postgres',true,'v','jsonb','c8789f4263f3a141a57ef770b25307024c51c4718475db91baa4af8dcd6782f4','f156afc13bf2dac90d3d3f2965f5e4e3379aaa44d4dacc6ccd902462c63232e1','484b9519d6fa2129c9fbaa916732fb93423368c4bedafcf448534f53b942239b'),
 ('official_v3_at_production_private.renew_ch_v1()','plpgsql','postgres',false,'v','integer','832d3a9c7b63b399d0470999a0f869119332fb42e27ab93c9c7b65122675b540','f156afc13bf2dac90d3d3f2965f5e4e3379aaa44d4dacc6ccd902462c63232e1','9d0857cdf2a8942af52409043eac78929d288e46400d17e70834e7a2455bbc9e')
 ) expected(signature,language_name,owner_name,is_definer,volatility,result_type,acl_sha,config_sha,native_definition_sha) LOOP
  IF NOT EXISTS(SELECT 1 FROM pg_proc p JOIN pg_language l ON l.oid=p.prolang
   WHERE p.oid=to_regprocedure(item.signature) AND l.lanname=item.language_name
   AND pg_get_userbyid(p.proowner)=item.owner_name AND p.prosecdef=item.is_definer
   AND p.provolatile::text=item.volatility AND pg_get_function_result(p.oid)=item.result_type
   AND p.prokind='f' AND p.pronargs=0 AND p.pronargdefaults=0 AND p.provariadic=0 AND NOT p.proretset
   AND p.proargdefaults IS NULL AND p.proargnames IS NULL AND p.proallargtypes IS NULL AND p.proargmodes IS NULL
   AND encode(sha256(convert_to(pg_get_functiondef(p.oid),'UTF8')),'hex')=item.native_definition_sha
   AND encode(sha256(convert_to(coalesce(to_jsonb(p.proacl)::text,'null'),'UTF8')),'hex')=item.acl_sha
   AND encode(sha256(convert_to(coalesce(to_jsonb(p.proconfig)::text,'null'),'UTF8')),'hex')=item.config_sha)
  THEN RAISE EXCEPTION 'PROD_HTTP_STOP_NEW_FUNCTION_HEADER_OR_AUTHORITY_CHANGED: %',item.signature USING ERRCODE='P7998'; END IF;
 END LOOP;

 -- Deliberately no stored project function is invoked by this metadata read.
 NULL;
END $postcommit_pinned_read_context$;

-- Catalog-only admission happens before the FIRST project-table data read.
-- Exact ordinary tables and built-in column types; views, foreign tables,
-- inheritance, dropped/extra/reordered columns and custom types fail closed.
DO $at_binding_catalog_shape_before_data$
DECLARE item record;
BEGIN
 FOR item IN SELECT * FROM (VALUES
 ('official_v3_guard_private.bg1_production_http_allocator_v4',9),
 ('official_v3_at_production_private.source_pins_v1',10),
 ('official_v3_at_production_private.first_originals_v1',9),
 ('official_v3_at_production_private.watch_batches_v1',2),
 ('official_v3_at_production_private.watch_requests_v1',4),
 ('official_v3_at_production_private.watch_observations_v1',7),
 ('official_v3_at_production_private.ch_visa_facts_v1',21),
 ('official_v3_method_private.heads_v1',11),
 ('official_v3_method_private.revisions_v1',7),
 ('official_v3_method_private.operations_v1',9),
 ('official_v3_guard_private.state_v1',12),
 ('official_v3_guard_private.runs_v1',7),
 ('net._http_response',8)
 ) x(relation_name,column_count) LOOP
  IF NOT EXISTS(SELECT 1 FROM pg_class c WHERE c.oid=to_regclass(item.relation_name)
    AND c.relkind='r' AND NOT c.relispartition
    AND NOT EXISTS(SELECT 1 FROM pg_inherits i WHERE i.inhparent=c.oid OR i.inhrelid=c.oid)
    AND (SELECT count(*) FROM pg_attribute a WHERE a.attrelid=c.oid AND a.attnum>0)=item.column_count
    AND has_table_privilege(current_user,c.oid,'SELECT'))
  THEN RAISE EXCEPTION 'AT_BINDING_TABLE_SHAPE_BEFORE_DATA: %',item.relation_name; END IF;
 END LOOP;
 FOR item IN SELECT * FROM (VALUES
 ('official_v3_guard_private.bg1_production_http_allocator_v4',1,'singleton','pg_catalog.bool'),
 ('official_v3_guard_private.bg1_production_http_allocator_v4',2,'predecessor_catalog_digest','pg_catalog.text'),
 ('official_v3_guard_private.bg1_production_http_allocator_v4',3,'predecessor_baseline_digest','pg_catalog.text'),
 ('official_v3_guard_private.bg1_production_http_allocator_v4',4,'publisher_function_digest','pg_catalog.text'),
 ('official_v3_guard_private.bg1_production_http_allocator_v4',5,'transport_metadata','pg_catalog.jsonb'),
 ('official_v3_guard_private.bg1_production_http_allocator_v4',6,'transport_metadata_digest','pg_catalog.text'),
 ('official_v3_guard_private.bg1_production_http_allocator_v4',7,'required_generation','pg_catalog.int8'),
 ('official_v3_guard_private.bg1_production_http_allocator_v4',8,'proof_not_before','pg_catalog.timestamptz'),
 ('official_v3_guard_private.bg1_production_http_allocator_v4',9,'catalog','pg_catalog.jsonb'),
 ('official_v3_at_production_private.source_pins_v1',1,'source_id','pg_catalog.text'),
 ('official_v3_at_production_private.source_pins_v1',2,'authority_code','pg_catalog.text'),
 ('official_v3_at_production_private.source_pins_v1',3,'official_url','pg_catalog.text'),
 ('official_v3_at_production_private.source_pins_v1',4,'original_sha','pg_catalog.text'),
 ('official_v3_at_production_private.source_pins_v1',5,'original_bytes','pg_catalog.int4'),
 ('official_v3_at_production_private.source_pins_v1',6,'canonical_sha','pg_catalog.text'),
 ('official_v3_at_production_private.source_pins_v1',7,'normalization','pg_catalog.text'),
 ('official_v3_at_production_private.source_pins_v1',8,'edition','pg_catalog.text'),
 ('official_v3_at_production_private.source_pins_v1',9,'research_only','pg_catalog.bool'),
 ('official_v3_at_production_private.source_pins_v1',10,'source_qualified','pg_catalog.bool'),
 ('official_v3_at_production_private.first_originals_v1',1,'source_id','pg_catalog.text'),
 ('official_v3_at_production_private.first_originals_v1',2,'batch_id','pg_catalog.int8'),
 ('official_v3_at_production_private.first_originals_v1',3,'stored_at','pg_catalog.timestamptz'),
 ('official_v3_at_production_private.first_originals_v1',4,'raw_body','pg_catalog.bytea'),
 ('official_v3_at_production_private.first_originals_v1',5,'raw_sha','pg_catalog.text'),
 ('official_v3_at_production_private.first_originals_v1',6,'raw_bytes','pg_catalog.int4'),
 ('official_v3_at_production_private.first_originals_v1',7,'source_state','pg_catalog.text'),
 ('official_v3_at_production_private.first_originals_v1',8,'legal_source_approved','pg_catalog.bool'),
 ('official_v3_at_production_private.first_originals_v1',9,'customer_rule_approved','pg_catalog.bool'),
 ('official_v3_at_production_private.watch_batches_v1',1,'batch_id','pg_catalog.int8'),
 ('official_v3_at_production_private.watch_batches_v1',2,'started_at','pg_catalog.timestamptz'),
 ('official_v3_at_production_private.watch_requests_v1',1,'batch_id','pg_catalog.int8'),
 ('official_v3_at_production_private.watch_requests_v1',2,'source_id','pg_catalog.text'),
 ('official_v3_at_production_private.watch_requests_v1',3,'request_id','pg_catalog.int8'),
 ('official_v3_at_production_private.watch_requests_v1',4,'requested_at','pg_catalog.timestamptz'),
 ('official_v3_at_production_private.watch_observations_v1',1,'batch_id','pg_catalog.int8'),
 ('official_v3_at_production_private.watch_observations_v1',2,'source_id','pg_catalog.text'),
 ('official_v3_at_production_private.watch_observations_v1',3,'observed_at','pg_catalog.timestamptz'),
 ('official_v3_at_production_private.watch_observations_v1',4,'source_status','pg_catalog.text'),
 ('official_v3_at_production_private.watch_observations_v1',5,'bytes','pg_catalog.int4'),
 ('official_v3_at_production_private.watch_observations_v1',6,'body_sha','pg_catalog.text'),
 ('official_v3_at_production_private.watch_observations_v1',7,'http_status','pg_catalog.int4'),
 ('official_v3_at_production_private.ch_visa_facts_v1',1,'version_id','pg_catalog.int8'),
 ('official_v3_at_production_private.ch_visa_facts_v1',2,'citizenship_code','pg_catalog.text'),
 ('official_v3_at_production_private.ch_visa_facts_v1',3,'destination_code','pg_catalog.text'),
 ('official_v3_at_production_private.ch_visa_facts_v1',4,'requirement_type','pg_catalog.text'),
 ('official_v3_at_production_private.ch_visa_facts_v1',5,'document_type','pg_catalog.text'),
 ('official_v3_at_production_private.ch_visa_facts_v1',6,'route_type','pg_catalog.text'),
 ('official_v3_at_production_private.ch_visa_facts_v1',7,'visa_effect','pg_catalog.text'),
 ('official_v3_at_production_private.ch_visa_facts_v1',8,'visa_mode','pg_catalog.text'),
 ('official_v3_at_production_private.ch_visa_facts_v1',9,'source_batch_id','pg_catalog.int8'),
 ('official_v3_at_production_private.ch_visa_facts_v1',10,'predecessor_version_id','pg_catalog.int8'),
 ('official_v3_at_production_private.ch_visa_facts_v1',11,'method_epoch','pg_catalog.int4'),
 ('official_v3_at_production_private.ch_visa_facts_v1',12,'method_id','pg_catalog.text'),
 ('official_v3_at_production_private.ch_visa_facts_v1',13,'method_revision','pg_catalog.int4'),
 ('official_v3_at_production_private.ch_visa_facts_v1',14,'method_digest','pg_catalog.text'),
 ('official_v3_at_production_private.ch_visa_facts_v1',15,'package_digest','pg_catalog.text'),
 ('official_v3_at_production_private.ch_visa_facts_v1',16,'source_digest','pg_catalog.text'),
 ('official_v3_at_production_private.ch_visa_facts_v1',17,'verified_at','pg_catalog.timestamptz'),
 ('official_v3_at_production_private.ch_visa_facts_v1',18,'source_checked_at','pg_catalog.timestamptz'),
 ('official_v3_at_production_private.ch_visa_facts_v1',19,'expires_at','pg_catalog.timestamptz'),
 ('official_v3_at_production_private.ch_visa_facts_v1',20,'legal_valid_until','pg_catalog.timestamptz'),
 ('official_v3_at_production_private.ch_visa_facts_v1',21,'approved_origin','pg_catalog.text'),
 ('official_v3_method_private.heads_v1',1,'method_id','pg_catalog.text'),
 ('official_v3_method_private.heads_v1',2,'revision','pg_catalog.int4'),
 ('official_v3_method_private.heads_v1',3,'method_digest','pg_catalog.text'),
 ('official_v3_method_private.heads_v1',4,'package_digest','pg_catalog.text'),
 ('official_v3_method_private.heads_v1',5,'epoch','pg_catalog.int4'),
 ('official_v3_method_private.heads_v1',6,'status','pg_catalog.text'),
 ('official_v3_method_private.heads_v1',7,'approval_mode','pg_catalog.text'),
 ('official_v3_method_private.heads_v1',8,'approval_until','pg_catalog.timestamptz'),
 ('official_v3_method_private.heads_v1',9,'changed_at','pg_catalog.timestamptz'),
 ('official_v3_method_private.heads_v1',10,'changed_by','pg_catalog.uuid'),
 ('official_v3_method_private.heads_v1',11,'operation_id','pg_catalog.text'),
 ('official_v3_method_private.revisions_v1',1,'method_id','pg_catalog.text'),
 ('official_v3_method_private.revisions_v1',2,'revision','pg_catalog.int4'),
 ('official_v3_method_private.revisions_v1',3,'method_digest','pg_catalog.text'),
 ('official_v3_method_private.revisions_v1',4,'package_digest','pg_catalog.text'),
 ('official_v3_method_private.revisions_v1',5,'predecessor_revision','pg_catalog.int4'),
 ('official_v3_method_private.revisions_v1',6,'staged_at','pg_catalog.timestamptz'),
 ('official_v3_method_private.revisions_v1',7,'staged_by','pg_catalog.uuid'),
 ('official_v3_method_private.operations_v1',1,'operation_id','pg_catalog.text'),
 ('official_v3_method_private.operations_v1',2,'action','pg_catalog.text'),
 ('official_v3_method_private.operations_v1',3,'method_id','pg_catalog.text'),
 ('official_v3_method_private.operations_v1',4,'revision','pg_catalog.int4'),
 ('official_v3_method_private.operations_v1',5,'command','pg_catalog.jsonb'),
 ('official_v3_method_private.operations_v1',6,'before_state','pg_catalog.jsonb'),
 ('official_v3_method_private.operations_v1',7,'after_state','pg_catalog.jsonb'),
 ('official_v3_method_private.operations_v1',8,'actor_id','pg_catalog.uuid'),
 ('official_v3_method_private.operations_v1',9,'recorded_at','pg_catalog.timestamptz'),
 ('official_v3_guard_private.state_v1',1,'singleton','pg_catalog.bool'),
 ('official_v3_guard_private.state_v1',2,'installed_at','pg_catalog.timestamptz'),
 ('official_v3_guard_private.state_v1',3,'generation','pg_catalog.int8'),
 ('official_v3_guard_private.state_v1',4,'last_due','pg_catalog.timestamptz'),
 ('official_v3_guard_private.state_v1',5,'last_started','pg_catalog.timestamptz'),
 ('official_v3_guard_private.state_v1',6,'last_proof_started','pg_catalog.timestamptz'),
 ('official_v3_guard_private.state_v1',7,'last_finished','pg_catalog.timestamptz'),
 ('official_v3_guard_private.state_v1',8,'valid_until','pg_catalog.timestamptz'),
 ('official_v3_guard_private.state_v1',9,'incident_generation','pg_catalog.int8'),
 ('official_v3_guard_private.state_v1',10,'incident_at','pg_catalog.timestamptz'),
 ('official_v3_guard_private.state_v1',11,'resumed_generation','pg_catalog.int8'),
 ('official_v3_guard_private.state_v1',12,'last_observed','pg_catalog.timestamptz'),
 ('official_v3_guard_private.runs_v1',1,'due_at','pg_catalog.timestamptz'),
 ('official_v3_guard_private.runs_v1',2,'started_at','pg_catalog.timestamptz'),
 ('official_v3_guard_private.runs_v1',3,'proof_started_at','pg_catalog.timestamptz'),
 ('official_v3_guard_private.runs_v1',4,'finished_at','pg_catalog.timestamptz'),
 ('official_v3_guard_private.runs_v1',5,'outcome','pg_catalog.text'),
 ('official_v3_guard_private.runs_v1',6,'generation','pg_catalog.int8'),
 ('official_v3_guard_private.runs_v1',7,'incident_generation','pg_catalog.int8'),
 ('net._http_response',1,'id','pg_catalog.int8'),
 ('net._http_response',2,'status_code','pg_catalog.int4'),
 ('net._http_response',3,'content_type','pg_catalog.text'),
 ('net._http_response',4,'headers','pg_catalog.jsonb'),
 ('net._http_response',5,'content','pg_catalog.text'),
 ('net._http_response',6,'timed_out','pg_catalog.bool'),
 ('net._http_response',7,'error_msg','pg_catalog.text'),
 ('net._http_response',8,'created','pg_catalog.timestamptz')
 ) x(relation_name,ordinal,column_name,type_name) LOOP
  IF NOT EXISTS(SELECT 1 FROM pg_attribute a JOIN pg_type t ON t.oid=a.atttypid
    WHERE a.attrelid=to_regclass(item.relation_name) AND a.attnum=item.ordinal
     AND a.attname=item.column_name AND NOT a.attisdropped AND a.attndims=0
     AND a.atttypid=to_regtype(item.type_name) AND a.atttypmod=-1
     AND t.typnamespace='pg_catalog'::regnamespace AND t.typtype='b')
  THEN RAISE EXCEPTION 'AT_BINDING_COLUMN_SHAPE_BEFORE_DATA: %.%',item.relation_name,item.column_name; END IF;
 END LOOP;
END $at_binding_catalog_shape_before_data$;

DO $at_qualification_binding_bounds$
DECLARE item record; n bigint; bad_sources bigint; duplicate_source boolean;
BEGIN
 IF (SELECT encode(sha256(convert_to((to_jsonb(v)||jsonb_build_object(
    'proof_not_before',extract(epoch FROM v.proof_not_before)))::text,'UTF8')),'hex')
   FROM official_v3_guard_private.bg1_production_http_allocator_v4 v WHERE singleton)
 IS DISTINCT FROM 'c847d8573ac8f62c2d163fcec7d8f0bde409574bd9ae7319e0bf97d99eb9c0a4'
 THEN RAISE EXCEPTION 'AT_BINDING_PARENT_CHANGED_STOP_NEW_PACKAGE_REQUIRED'; END IF;
 FOR item IN SELECT * FROM (VALUES
  ('official_v3_at_production_private.source_pins_v1',3),
  ('official_v3_at_production_private.first_originals_v1',3),
  ('official_v3_at_production_private.watch_batches_v1',10000),
  ('official_v3_at_production_private.watch_requests_v1',30000),
  ('official_v3_at_production_private.watch_observations_v1',30000),
  ('official_v3_at_production_private.ch_visa_facts_v1',1000),
  ('official_v3_method_private.heads_v1',100),
  ('official_v3_method_private.revisions_v1',1000),
  ('official_v3_method_private.operations_v1',10000),
  ('official_v3_guard_private.state_v1',1)
 ) x(relation_name,row_cap) LOOP
  IF to_regclass(item.relation_name) IS NULL OR
    NOT has_table_privilege(current_user,to_regclass(item.relation_name),'SELECT')
  THEN RAISE EXCEPTION 'AT_BINDING_REQUIRED_RELATION_OR_READ_RIGHT_MISSING: %',item.relation_name; END IF;
  IF NOT EXISTS(SELECT 1 FROM pg_class WHERE oid=to_regclass(item.relation_name) AND relkind='r')
  THEN RAISE EXCEPTION 'AT_BINDING_UNEXPECTED_RELATION_KIND: %',item.relation_name; END IF;
  EXECUTE format('SELECT count(*) FROM (SELECT 1 FROM %s LIMIT %s) bounded',
    to_regclass(item.relation_name),item.row_cap+1) INTO n;
  IF n>item.row_cap THEN RAISE EXCEPTION 'AT_BINDING_ROW_CAP: %',item.relation_name; END IF;
 END LOOP;
 IF to_regclass('net._http_response') IS NULL
  OR NOT has_table_privilege(current_user,'net._http_response','SELECT')
  OR to_regclass('official_v3_guard_private.runs_v1') IS NULL
  OR (SELECT count(*) FROM official_v3_at_production_private.source_pins_v1)<>3
  OR (SELECT count(*) FROM official_v3_at_production_private.first_originals_v1)<>3
  OR EXISTS(SELECT 1 FROM official_v3_at_production_private.first_originals_v1
       WHERE octet_length(raw_body) NOT BETWEEN 1 AND 1048576)
 THEN RAISE EXCEPTION 'AT_BINDING_REQUIRED_SHAPE_OR_ORIGINAL_BOUND'; END IF;
 FOR item IN SELECT * FROM (VALUES
  ('public.jetnity_source_bound_at_visa_v1(text)'),
  ('official_v3_method_private.require_current_locked_v1(text,integer,text,text,integer)'),
  ('official_v3_method_api.stage_draft_v1(text,text,integer,text,text,integer)'),
  ('official_v3_method_api.approve_v1(text,text,integer,text,text,integer,text,text,integer,text,text,text)')
 ) x(signature) LOOP
  IF to_regprocedure(item.signature) IS NULL
  THEN RAISE EXCEPTION 'AT_BINDING_REQUIRED_FUNCTION_MISSING: %',item.signature; END IF;
 END LOOP;
 IF (SELECT count(*) FROM pg_proc p JOIN pg_namespace n ON n.oid=p.pronamespace
   WHERE (n.nspname='official_v3_at_production_private' AND p.proname IN
    ('enqueue_v1','collect_v1','renew_ch_v1','source_status_v1','deny_mutation_v1'))
   OR (n.nspname='public' AND p.proname IN
    ('jetnity_source_bound_at_visa_v1','official_v3_method_stage_draft_v1','official_v3_method_approve_v1'))
   OR (n.nspname='official_v3_method_private' AND p.proname='require_current_locked_v1')
   OR (n.nspname='official_v3_method_api' AND p.proname IN('stage_draft_v1','approve_v1','confirm_operation_v1'))
   OR (n.nspname='jetnity_ot_auth' AND p.proname='require_current_owner_session_v1'))>16
 THEN RAISE EXCEPTION 'AT_BINDING_FUNCTION_COUNT_CAP'; END IF;

 -- Bound the actual joined result before its payload can be emitted.
 -- Constraints are metadata under review, so uniqueness is checked explicitly.
 WITH recent AS MATERIALIZED (
  SELECT batch_id FROM official_v3_at_production_private.watch_batches_v1
  ORDER BY batch_id DESC LIMIT 3
 ), bounded AS MATERIALIZED (
  SELECT b.batch_id,r.source_id
  FROM recent b
  LEFT JOIN official_v3_at_production_private.watch_requests_v1 r USING(batch_id)
  LEFT JOIN official_v3_at_production_private.watch_observations_v1 o USING(batch_id,source_id)
  LIMIT 10
 )
 SELECT count(*),
  count(*) FILTER(WHERE source_id IS NOT NULL AND source_id NOT IN
    ('bmi-visa-nationality-matrix','bmi-general-entry','bmeia-bern-how-to-apply')),
  EXISTS(SELECT 1 FROM bounded GROUP BY batch_id,source_id HAVING count(*)>1)
 INTO n,bad_sources,duplicate_source FROM bounded;
 IF n>9 OR bad_sources>0 OR duplicate_source
 THEN RAISE EXCEPTION 'AT_BINDING_RECENT_SOURCE_JOIN_SHAPE_OR_CAP'; END IF;
 IF EXISTS(
  SELECT 1 FROM (
   SELECT r.request_id FROM
    (SELECT batch_id FROM official_v3_at_production_private.watch_batches_v1
      ORDER BY batch_id DESC LIMIT 3) b
   JOIN official_v3_at_production_private.watch_requests_v1 r USING(batch_id)
   LIMIT 10
  ) q WHERE (SELECT count(*) FROM
    (SELECT 1 FROM net._http_response nr WHERE nr.id=q.request_id LIMIT 2) d)>1
 )
 THEN RAISE EXCEPTION 'AT_BINDING_DUPLICATE_STORED_HTTP_RESPONSE'; END IF;

 -- Diagnostic constraints do not themselves authorize duplicate output rows.
 -- Check both fixed three-source lists and the two one-row contracts explicitly.
 IF EXISTS(SELECT 1 FROM official_v3_at_production_private.source_pins_v1
    WHERE source_id IS NULL OR source_id NOT IN
     ('bmi-visa-nationality-matrix','bmi-general-entry','bmeia-bern-how-to-apply'))
  OR (SELECT count(DISTINCT source_id) FROM official_v3_at_production_private.source_pins_v1)<>3
  OR EXISTS(SELECT 1 FROM official_v3_at_production_private.first_originals_v1
    WHERE source_id IS NULL OR source_id NOT IN
     ('bmi-visa-nationality-matrix','bmi-general-entry','bmeia-bern-how-to-apply'))
  OR (SELECT count(DISTINCT source_id) FROM official_v3_at_production_private.first_originals_v1)<>3
 THEN RAISE EXCEPTION 'AT_BINDING_FIXED_SOURCE_LIST_NOT_EXACT'; END IF;
 SELECT count(*) INTO n FROM (
  SELECT 1 FROM official_v3_method_private.heads_v1
  WHERE method_id='jetnity-destination-primary-at-visa' LIMIT 2
 ) bounded;
 IF n>1 THEN RAISE EXCEPTION 'AT_BINDING_METHOD_HEAD_OUTPUT_CAP'; END IF;
 SELECT count(*) INTO n FROM (
  SELECT 1 FROM official_v3_guard_private.state_v1 s
  JOIN official_v3_guard_private.bg1_production_http_allocator_v4 v ON v.singleton
  LEFT JOIN official_v3_guard_private.runs_v1 r ON r.generation=s.generation
   AND r.due_at=s.last_due AND r.started_at=s.last_started
   AND r.proof_started_at=s.last_proof_started AND r.finished_at=s.last_finished
  WHERE s.singleton LIMIT 2
 ) bounded;
 IF n>1 THEN RAISE EXCEPTION 'AT_BINDING_BG1_PROOF_OUTPUT_CAP'; END IF;
END $at_qualification_binding_bounds$;
WITH
required_relations(name) AS (VALUES
 ('official_v3_at_production_private.source_pins_v1'),
 ('official_v3_at_production_private.first_originals_v1'),
 ('official_v3_at_production_private.watch_batches_v1'),
 ('official_v3_at_production_private.watch_requests_v1'),
 ('official_v3_at_production_private.watch_observations_v1'),
 ('official_v3_at_production_private.ch_visa_facts_v1'),
 ('official_v3_method_private.heads_v1'),
 ('official_v3_method_private.revisions_v1'),
 ('official_v3_method_private.operations_v1')),
relation_rows AS MATERIALIZED (
 SELECT x.name,c.oid::text AS oid,c.relkind,pg_get_userbyid(c.relowner) AS owner,
 c.relrowsecurity AS rls,c.relforcerowsecurity AS force_rls,to_jsonb(c.relacl) AS acl,
 (SELECT jsonb_agg(jsonb_build_object('name',a.attname,'type',format_type(a.atttypid,a.atttypmod),
   'not_null',a.attnotnull,'identity',a.attidentity,'generated',a.attgenerated,
   'default_sha256',encode(sha256(convert_to(pg_get_expr(d.adbin,d.adrelid),'UTF8')),'hex'),
   'default_bytes',octet_length(convert_to(pg_get_expr(d.adbin,d.adrelid),'UTF8'))) ORDER BY a.attnum)
  FROM pg_attribute a LEFT JOIN pg_attrdef d ON d.adrelid=a.attrelid AND d.adnum=a.attnum
  WHERE a.attrelid=c.oid AND a.attnum>0 AND NOT a.attisdropped) AS columns,
 (SELECT jsonb_agg(jsonb_build_object('name',k.conname,'type',k.contype,
   'validated',k.convalidated,
   'definition_sha256',encode(sha256(convert_to(pg_get_constraintdef(k.oid,true),'UTF8')),'hex'),
   'definition_bytes',octet_length(convert_to(pg_get_constraintdef(k.oid,true),'UTF8'))) ORDER BY k.conname)
  FROM pg_constraint k WHERE k.conrelid=c.oid) AS constraints,
 (SELECT jsonb_agg(jsonb_build_object('name',t.tgname,'enabled',t.tgenabled,
   'definition_sha256',encode(sha256(convert_to(pg_get_triggerdef(t.oid,true),'UTF8')),'hex'),
   'definition_bytes',octet_length(convert_to(pg_get_triggerdef(t.oid,true),'UTF8')),
   'function_sha256',encode(sha256(convert_to(pg_get_functiondef(t.tgfoid),'UTF8')),'hex')) ORDER BY t.tgname)
  FROM pg_trigger t WHERE t.tgrelid=c.oid AND NOT t.tgisinternal) AS triggers
 FROM required_relations x JOIN pg_class c ON c.oid=to_regclass(x.name)
),
function_rows AS MATERIALIZED (
 SELECT n.nspname||'.'||p.proname||'('||pg_get_function_identity_arguments(p.oid)||')' AS signature,
 p.oid::text AS oid,pg_get_userbyid(p.proowner) AS owner,l.lanname AS language,
 p.prosecdef AS security_definer,p.provolatile AS volatility,p.proisstrict AS strict,
 p.proparallel AS parallel,p.proleakproof AS leakproof,p.prokind AS kind,
 pg_get_function_result(p.oid) AS result_type,to_jsonb(p.proacl) AS acl,
 encode(sha256(convert_to(coalesce(to_jsonb(p.proconfig)::text,'null'),'UTF8')),'hex') AS configuration_sha256,
 octet_length(convert_to(coalesce(to_jsonb(p.proconfig)::text,'null'),'UTF8')) AS configuration_bytes,
 encode(sha256(convert_to(pg_get_functiondef(p.oid),'UTF8')),'hex') AS definition_sha256,
 encode(sha256(convert_to(p.prosrc,'UTF8')),'hex') AS body_sha256,
 octet_length(convert_to(pg_get_functiondef(p.oid),'UTF8')) AS definition_bytes
 FROM pg_proc p JOIN pg_namespace n ON n.oid=p.pronamespace JOIN pg_language l ON l.oid=p.prolang
 WHERE (n.nspname='official_v3_at_production_private' AND p.proname IN
    ('enqueue_v1','collect_v1','renew_ch_v1','source_status_v1','deny_mutation_v1'))
   OR (n.nspname='public' AND p.proname IN
    ('jetnity_source_bound_at_visa_v1','official_v3_method_stage_draft_v1','official_v3_method_approve_v1'))
   OR (n.nspname='official_v3_method_private' AND p.proname='require_current_locked_v1')
   OR (n.nspname='official_v3_method_api' AND p.proname IN('stage_draft_v1','approve_v1','confirm_operation_v1'))
   OR (n.nspname='jetnity_ot_auth' AND p.proname='require_current_owner_session_v1')
),
method_head AS MATERIALIZED (
 SELECT h.method_id,h.revision,h.method_digest,h.package_digest,h.epoch,h.status,
 h.approval_mode,h.approval_until,h.changed_at,
 encode(sha256(convert_to(h.operation_id,'UTF8')),'hex') AS operation_id_sha256,
 encode(sha256(convert_to(to_jsonb(h)::text,'UTF8')),'hex') AS full_row_sha256,
 EXISTS(SELECT 1 FROM official_v3_method_private.revisions_v1 r
   WHERE r.method_id=h.method_id AND r.revision=h.revision AND r.method_digest=h.method_digest
    AND r.package_digest=h.package_digest) AS revision_bound,
 EXISTS(SELECT 1 FROM official_v3_method_private.operations_v1 o
   WHERE o.operation_id=h.operation_id AND o.method_id=h.method_id AND o.revision=h.revision
    AND o.actor_id=h.changed_by AND o.recorded_at=h.changed_at
    AND o.after_state->>'status'=h.status
    AND o.after_state->>'methodDigest'=h.method_digest
    AND o.after_state->>'packageDigest'=h.package_digest
    AND (o.after_state->>'epoch')::integer=h.epoch) AS receipt_correlated
 FROM official_v3_method_private.heads_v1 h
 WHERE h.method_id='jetnity-destination-primary-at-visa'
),
pins AS MATERIALIZED (
 SELECT source_id,authority_code,official_url,original_sha,original_bytes,
 canonical_sha,normalization,edition,research_only,source_qualified,
 encode(sha256(convert_to(to_jsonb(s)::text,'UTF8')),'hex') AS row_sha256
 FROM official_v3_at_production_private.source_pins_v1 s
),
originals AS MATERIALIZED (
 SELECT source_id,batch_id,stored_at,raw_sha,raw_bytes,source_state,
 legal_source_approved,customer_rule_approved,
 encode(sha256(raw_body),'hex') AS actual_body_sha256
 FROM official_v3_at_production_private.first_originals_v1
),
batches AS MATERIALIZED (
 SELECT batch_id,started_at FROM official_v3_at_production_private.watch_batches_v1
 ORDER BY batch_id DESC LIMIT 3
),
observations AS MATERIALIZED (
 SELECT b.batch_id,b.started_at,r.source_id,r.request_id,r.requested_at,
 o.observed_at,o.source_status,o.bytes,o.body_sha,o.http_status,
 n.created AS response_created,n.status_code AS response_http_status,n.timed_out,
 n.error_msg IS NULL AS response_error_absent,
 n.content_type~*'^text/html([; ]|$)' AS response_html,
 octet_length(convert_to(n.content,'UTF8')) AS retained_response_bytes,
 CASE WHEN octet_length(convert_to(n.content,'UTF8')) BETWEEN 1 AND 1048576
  THEN encode(sha256(convert_to(n.content,'UTF8')),'hex') END AS retained_response_body_sha256,
 (SELECT count(*) FROM (SELECT 1 FROM net._http_response x WHERE x.id=r.request_id LIMIT 2) q)
  AS matching_response_rows_capped_at_2
 FROM batches b LEFT JOIN official_v3_at_production_private.watch_requests_v1 r USING(batch_id)
 LEFT JOIN official_v3_at_production_private.watch_observations_v1 o USING(batch_id,source_id)
 LEFT JOIN LATERAL(SELECT created,status_code,timed_out,error_msg,content_type,content
   FROM net._http_response nr WHERE nr.id=r.request_id ORDER BY created DESC LIMIT 1) n ON true
),
fresh_bg1_proof AS MATERIALIZED (
 SELECT s.generation,s.incident_generation,s.resumed_generation,s.valid_until,
 r.due_at,r.started_at,r.proof_started_at,r.finished_at,r.outcome,
 (s.incident_generation=s.resumed_generation AND r.outcome='complete'
  AND s.generation>=v.required_generation AND r.proof_started_at>=v.proof_not_before
  AND s.last_finished<=s.last_started+interval '30 seconds'
  AND s.valid_until=s.last_due+interval '5 minutes 30 seconds'
  AND statement_timestamp()>=s.last_finished AND statement_timestamp()<s.valid_until) AS fresh_complete
 FROM official_v3_guard_private.state_v1 s
 JOIN official_v3_guard_private.bg1_production_http_allocator_v4 v ON v.singleton
 LEFT JOIN official_v3_guard_private.runs_v1 r ON r.generation=s.generation
  AND r.due_at=s.last_due AND r.started_at=s.last_started
  AND r.proof_started_at=s.last_proof_started AND r.finished_at=s.last_finished
 WHERE s.singleton
),
payload AS (
 SELECT jsonb_build_object(
  'result','PROD_AT_QUALIFICATION_BINDINGS_READONLY_OBSERVED',
  'schema',1,'observed_at',statement_timestamp(),'read_only',current_setting('transaction_read_only')='on',
  'target_project_declared','qscbgcdmivbbnzrcyegn',
  'parent_canonical_sha256','c847d8573ac8f62c2d163fcec7d8f0bde409574bd9ae7319e0bf97d99eb9c0a4',
  'relations',(SELECT jsonb_agg(to_jsonb(x) ORDER BY name) FROM relation_rows x),
  'functions',(SELECT jsonb_agg(to_jsonb(x) ORDER BY signature) FROM function_rows x),
  'method_head',coalesce((SELECT jsonb_agg(to_jsonb(x)) FROM method_head x),'[]'::jsonb),
  'source_pins',(SELECT jsonb_agg(to_jsonb(x) ORDER BY source_id) FROM pins x),
  'preserved_originals',(SELECT jsonb_agg(to_jsonb(x) ORDER BY source_id) FROM originals x),
  'latest_three_batches',(SELECT jsonb_agg(to_jsonb(x) ORDER BY batch_id DESC,source_id) FROM observations x),
  'bg1_proof',coalesce((SELECT jsonb_agg(to_jsonb(x)) FROM fresh_bg1_proof x),'[]'::jsonb),
  'facts',(SELECT jsonb_build_object('total',count(*),
     'unexpired',count(*) FILTER(WHERE expires_at>statement_timestamp()),
     'last_version',max(version_id),'last_source_batch',max(source_batch_id),
     'last_verified_at',max(verified_at),'last_expires_at',max(expires_at))
    FROM official_v3_at_production_private.ch_visa_facts_v1),
  'source_generation_successor_present',
    to_regclass('official_v3_at_production_private.qualified_source_generations_v1') IS NOT NULL,
  'method_approval_or_publication_performed',false,
  'http_or_source_action_performed',false,'production_change',false,
  'activation_authorized_by_this_read',false
 ) AS value
)
SELECT CASE WHEN octet_length(convert_to(value::text,'UTF8'))<=131072 THEN value
 ELSE jsonb_build_object('result','STOP_OUTPUT_CAP','maximum_bytes',131072,
    'actual_bytes',octet_length(convert_to(value::text,'UTF8'))) END AS result
FROM payload;
ROLLBACK;

