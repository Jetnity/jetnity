-- Production READ-ONLY PRE-FLIGHT, never a Production fix/approval.
-- Exact 20.11.2026 incident: BG1 P7905 from the platform-managed authenticator
-- preload change safeupdate -> supautils, safeupdate, plus its pg_db_role_setting.
-- The whole protected catalog must differ in EXACTLY those two entries.
-- This is an approval candidate only: unknown future library/grant drift
-- must NEVER be auto-whitelisted. Do not execute ALTER ROLE in Production.
BEGIN TRANSACTION ISOLATION LEVEL REPEATABLE READ READ ONLY;
SET LOCAL search_path=pg_catalog;
SET LOCAL statement_timeout='25s';
WITH base AS(
 SELECT catalog AS pinned
 FROM official_v3_guard_private.at_batch_switch_baseline_v2 WHERE singleton
), present AS(
 SELECT official_v3_guard_private.catalog_status_v1() AS live
), authority AS(
 SELECT oid FROM pg_roles WHERE rolname='authenticator'
), deltas AS(
 SELECT coalesce(l.key,p.key) AS item,l.value AS current,p.value AS original
 FROM (SELECT e.key,e.value FROM present CROSS JOIN LATERAL jsonb_each(present.live) e) l
 FULL JOIN (SELECT e.key,e.value FROM base CROSS JOIN LATERAL jsonb_each(base.pinned) e) p
 ON l.key=p.key
), live_auth_role AS (
 SELECT live->('role:'||oid::text) AS item FROM present,authority
), pinned_role AS(
 SELECT pinned->('role:'||oid::text) AS item FROM base,authority
), live_auth_settings AS(
 SELECT live->('setting:0:'||oid::text) AS item FROM present,authority
), pinned_settings AS(
 SELECT pinned->('setting:0:'||oid::text) AS item FROM base,authority
), role_preload AS(
 SELECT
 (SELECT value FROM jsonb_array_elements_text((SELECT item FROM live_auth_role)->'rolconfig') value
  WHERE value LIKE 'session_preload_libraries=%') AS current_value,
 (SELECT value FROM jsonb_array_elements_text((SELECT item FROM pinned_role)->'rolconfig') value
  WHERE value LIKE 'session_preload_libraries=%') AS pinned_value,
 (SELECT jsonb_agg(value ORDER BY value) FROM jsonb_array_elements_text((SELECT item FROM live_auth_role)->'rolconfig') value
  WHERE value NOT LIKE 'session_preload_libraries=%') AS current_other,
 (SELECT jsonb_agg(value ORDER BY value) FROM jsonb_array_elements_text((SELECT item FROM pinned_role)->'rolconfig') value
  WHERE value NOT LIKE 'session_preload_libraries=%') AS pinned_other
), setting_preload AS(
 SELECT
 (SELECT value FROM jsonb_array_elements_text((SELECT item FROM live_auth_settings)->'setconfig') value
  WHERE value LIKE 'session_preload_libraries=%') AS current_value,
 (SELECT value FROM jsonb_array_elements_text((SELECT item FROM pinned_settings)->'setconfig') value
  WHERE value LIKE 'session_preload_libraries=%') AS pinned_value,
 (SELECT jsonb_agg(value ORDER BY value) FROM jsonb_array_elements_text((SELECT item FROM live_auth_settings)->'setconfig') value
  WHERE value NOT LIKE 'session_preload_libraries=%') AS current_other,
 (SELECT jsonb_agg(value ORDER BY value) FROM jsonb_array_elements_text((SELECT item FROM pinned_settings)->'setconfig') value
  WHERE value NOT LIKE 'session_preload_libraries=%') AS pinned_other
), approved_delta AS(
 SELECT count(*)=2
  AND count(*) FILTER(WHERE item IN ('role:'||(SELECT oid FROM authority),
                                     'setting:0:'||(SELECT oid FROM authority)))=2
  AS only_two_known_keys
 FROM deltas WHERE current IS DISTINCT FROM original
)
SELECT
 current_database() AS db,
 current_setting('server_version_num')::int/10000 AS pg,
 (SELECT only_two_known_keys FROM approved_delta) AS catalog_diff_is_exactly_two,
 (SELECT item - 'rolconfig' FROM live_auth_role)
  IS NOT DISTINCT FROM (SELECT item - 'rolconfig' FROM pinned_role) AS all_other_role_attributes_unchanged,
 (SELECT item - 'setconfig' FROM live_auth_settings)
  IS NOT DISTINCT FROM (SELECT item - 'setconfig' FROM pinned_settings) AS all_other_role_settings_unchanged,
 role_preload.current_other IS NOT DISTINCT FROM role_preload.pinned_other AS other_role_gucs_unchanged,
 setting_preload.current_other IS NOT DISTINCT FROM setting_preload.pinned_other AS other_setting_gucs_unchanged,
 role_preload.current_value='session_preload_libraries=supautils, safeupdate'
   AND role_preload.pinned_value='session_preload_libraries=safeupdate' AS exact_supabase_preload_transition,
 setting_preload.current_value='session_preload_libraries=supautils, safeupdate'
   AND setting_preload.pinned_value='session_preload_libraries=safeupdate' AS exact_db_role_setting_transition,
 public.official_v3_guard_alarm_status_v1()->>'status' AS existing_bg1,
 false::boolean AS auto_accept_platform_config_change,
 false::boolean AS production_permission_to_resume,
 'OWNER_BASELINE_SUCCESSOR_AND_FULL_PROOF_REQUIRED'::text AS disposition
FROM role_preload CROSS JOIN setting_preload;
ROLLBACK;
