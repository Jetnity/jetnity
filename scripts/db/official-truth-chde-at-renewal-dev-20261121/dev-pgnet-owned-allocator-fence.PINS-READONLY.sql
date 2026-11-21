-- READ ONLY. Use only in independently selected Dev yfvbxvijcorffwxbxahl.
-- Run after the actual v8 COMMIT; never infer pins from a rehearsal with new OIDs.
-- Require exactly one row and independently compare the known final prosrc SHA.
SELECT current_database() AS database_name,current_user AS database_role,
 current_setting('server_version_num') AS postgres_version,
 encode(sha256(convert_to((to_jsonb(v)||jsonb_build_object(
  'proof_not_before',extract(epoch FROM v.proof_not_before)))::text,'UTF8')),'hex')
  AS expected_v8_baseline_sha256,
 encode(sha256(convert_to(pg_get_functiondef(p.oid),'UTF8')),'hex')
  AS expected_allocator_definition_sha256,
 encode(sha256(convert_to(p.prosrc,'UTF8')),'hex')
  AS expected_allocator_prosrc_sha256,
 pg_get_userbyid(p.proowner) AS helper_owner,p.prosecdef AS helper_security_definer,
 v.catalog=official_v3_guard_private.catalog_status_v1() AS sealed_catalog_matches
FROM official_v3_guard_private.bg1_dev_http_id_allocator_v8 v
CROSS JOIN pg_proc p
WHERE v.singleton
 AND p.oid='jetnity_pgnet_allocator_private.assign_request_id_v1()'::pg_catalog.regprocedure
 AND current_database()='postgres' AND current_user='postgres'
 AND current_setting('server_version_num')::integer/10000=17
 AND to_regclass('official_v3_guard_private.at_batch_switch_baseline_v2') IS NULL
 AND to_regclass('official_v3_at_production_private.source_pins_v1') IS NULL
 AND to_regclass('jetnity_prod_import_scheduler.dispatches_v1') IS NULL;
