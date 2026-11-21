-- DEV REVIEW CANDIDATE: exact R2 bounded SECURITY DEFINER helper. No execution.
-- Trigger O does not fire in replica mode; this context check applies only when invoked.
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
