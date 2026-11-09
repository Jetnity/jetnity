-- LOCAL NATIVE FIXTURE REMOVAL ONLY. This is not a hosted Dev recovery plan.
-- The disposable-test owner must explicitly set jetnity.s1_owned_fixture first.
BEGIN;
DO $$ BEGIN
  IF current_user <> 'ot_pilot_owner' OR current_database() <> 'postgres'
    OR current_setting('jetnity.s1_owned_fixture',true) IS DISTINCT FROM 's1_disposable_native_test_v1'
    OR inet_server_addr() IS NOT NULL OR current_setting('listen_addresses') <> ''
    OR current_setting('unix_socket_directories') !~ '/ot-pilot-1-[^/]+/socket$'
    OR obj_description('official_v3_intake_private'::regnamespace,'pg_namespace')
      IS DISTINCT FROM 'S1 candidate v1: untrusted proposal custody only; no Accepted Store or source authority' THEN
    RAISE EXCEPTION USING ERRCODE = 'P7303', MESSAGE = 'intake_owned_fixture_required';
  END IF;
END $$;
-- Finite candidate-object teardown. RESTRICT refuses external dependents,
-- including installer-owned views outside these schemas. Any refusal rolls
-- back this entire transaction, preserving both candidate and foreign object.
DROP FUNCTION official_v3_intake_api.finish_v1(jsonb,text,integer,integer,uuid,jsonb,jsonb) RESTRICT;
DROP FUNCTION official_v3_intake_api.reserve_v1(jsonb,text,integer,integer) RESTRICT;
DROP FUNCTION official_v3_intake_api.read_v1(jsonb,text,integer) RESTRICT;
DROP FUNCTION official_v3_intake_api.capture_v1(jsonb,text,text) RESTRICT;
DROP TRIGGER immutable_v1 ON official_v3_intake_private.completions_v1 RESTRICT;
DROP TRIGGER immutable_v1 ON official_v3_intake_private.reservations_v1 RESTRICT;
DROP TRIGGER immutable_v1 ON official_v3_intake_private.operations_v1 RESTRICT;
DROP FUNCTION official_v3_intake_private.record_v1(text) RESTRICT;
DROP FUNCTION official_v3_intake_private.immutable_v1() RESTRICT;
DROP FUNCTION official_v3_intake_private.proposal_retainable_v1(jsonb) RESTRICT;
DROP FUNCTION official_v3_intake_private.shape_matches_v1(jsonb,jsonb,jsonb,jsonb,integer) RESTRICT;
DROP FUNCTION official_v3_intake_private.data_nodes_v1(jsonb,integer,integer,integer) RESTRICT;
DROP FUNCTION official_v3_intake_private.proposal_shape_v1() RESTRICT;
DROP FUNCTION official_v3_intake_private.unique_json_v1(json,integer) RESTRICT;
DROP FUNCTION official_v3_intake_private.binding_valid_v1(jsonb) RESTRICT;
DROP FUNCTION official_v3_intake_private.safe_data_v1(jsonb,integer) RESTRICT;
DROP FUNCTION official_v3_intake_private.exact_keys_v1(jsonb,text[]) RESTRICT;
-- Referencing candidate tables first; unknown external FKs or views refuse.
DROP TABLE official_v3_intake_private.completions_v1 RESTRICT;
DROP TABLE official_v3_intake_private.reservations_v1 RESTRICT;
DROP TABLE official_v3_intake_private.operations_v1 RESTRICT;
DROP SCHEMA official_v3_intake_api RESTRICT;
DROP SCHEMA official_v3_intake_private RESTRICT;
-- Restore only the freshly created owner's global function default to remove
-- its default-ACL dependency. DROP ROLE then FAILS if unexpected objects/grants
-- exist elsewhere; no broad DROP OWNED may erase them as collateral cleanup.
ALTER DEFAULT PRIVILEGES FOR ROLE ot_v3_intake_owner GRANT EXECUTE ON FUNCTIONS TO PUBLIC;
DROP ROLE ot_v3_intake_caller;
DROP ROLE ot_v3_intake_owner;
COMMIT;
