-- Jetnity Cycle12: native Dev proof of existing owner-role authority only.
-- This is a STOP gate, not a role-upgrade or an Owner/retirement action.
BEGIN TRANSACTION ISOLATION LEVEL REPEATABLE READ READ ONLY;
SET LOCAL search_path=pg_catalog;
SET LOCAL statement_timeout='12s';
SET LOCAL lock_timeout='500ms';
SET LOCAL idle_in_transaction_session_timeout='18s';
DO $proof$
DECLARE n integer; roleok boolean;
BEGIN
 IF current_database()<>'postgres' OR current_user<>'postgres'
   OR to_regprocedure('official_v3_jobs_private.cycle5_close_v1(jsonb)') IS NULL
   OR to_regprocedure('official_v3_guard_private.close_jobs_v1(text)') IS NULL
   OR to_regprocedure('jetnity_ot_auth.require_current_owner_session_v1()') IS NULL
   OR pg_get_userbyid((SELECT relowner FROM pg_class
     WHERE oid='official_v3_jobs_private.subjects_v1'::regclass))<>'ot_v3_jobs_owner'
   OR has_table_privilege('postgres','official_v3_jobs_private.subjects_v1','UPDATE')
 THEN RAISE EXCEPTION 'DEV_CHDE12_STOP_UNEXPECTED_ROLE_OR_FUNCTION' USING ERRCODE='P7906'; END IF;
 SELECT count(*)=1 AND bool_and(m.admin_option AND NOT m.inherit_option AND NOT m.set_option)
 INTO roleok FROM pg_auth_members m
 WHERE m.roleid='ot_v3_jobs_owner'::regrole AND m.member='postgres'::regrole;
 IF roleok IS DISTINCT FROM true OR
    pg_has_role('postgres','ot_v3_jobs_owner','SET')
    OR pg_has_role('postgres','ot_v3_jobs_owner','USAGE')
 THEN RAISE EXCEPTION 'DEV_CHDE12_STOP_ROLE_AUTHORITY_CHANGED' USING ERRCODE='P7906'; END IF;
 IF pg_get_userbyid((SELECT proowner FROM pg_proc
     WHERE oid='official_v3_jobs_private.cycle5_close_v1(jsonb)'::regprocedure))<>'ot_v3_jobs_owner'
   OR NOT (SELECT prosecdef FROM pg_proc WHERE oid='official_v3_jobs_private.cycle5_close_v1(jsonb)'::regprocedure)
   OR position('CYCLE5_EXACT_OWNER_QUEUE_SCOPE_REQUIRED' IN
     pg_get_functiondef('official_v3_jobs_private.cycle5_close_v1(jsonb)'::regprocedure))=0
   OR to_regprocedure('official_v3_jobs_private.cycle12_close_v1(jsonb)') IS NOT NULL
 THEN RAISE EXCEPTION 'DEV_CHDE12_STOP_OWNER_ROUTING_NOT_BOUND' USING ERRCODE='P7906'; END IF;
END $proof$;
SELECT jsonb_build_object(
 'verdict','DEV_CHDE12_OWNER_ROLE_PATH_NOT_INSTALLED__NO_NEW_DIRECT_RIGHTS',
 'postgres_update_to_jobs',has_table_privilege('postgres','official_v3_jobs_private.subjects_v1','UPDATE'),
 'postgres_set_owner',pg_has_role('postgres','ot_v3_jobs_owner','SET'),
 'existing_cycle5_definer_is_cycle12_authority',false,
 'cycle12_specific_owner_definer_present',false,
 'eligible_next_step','versioned jobs-owner native C12 mutator + real Owner/AAL2 receipt + BG1 successor',
 'new_rights',false,'role_or_acl_change',false,'owner_action',false,
 'test_scope','Supabase Dev yfvbxvijcorffwxbxahl',
 'transaction_end','ROLLBACK'
) AS result;
ROLLBACK;
