-- BG1 Production EXACT-LINEAGE READ ONLY; no DDL, grants, resume, restore or secrets.
-- Paired with production-exact-drift-readonly.sql (exactly two role-preload deltas).
-- Valid only on the original uninstalled Production PG17 predecessor, not Dev.
BEGIN TRANSACTION ISOLATION LEVEL REPEATABLE READ READ ONLY;
SET LOCAL search_path=pg_catalog;
SET LOCAL statement_timeout='20s';
WITH expected(signature,digest) AS (VALUES
  ('official_v3_guard_private.assert_catalog_v1()','c0f4f9704a7eec6a0a43c6c2b27990ee9a5488db462aa0377f7b4ae8e30c09cf'),
  ('official_v3_guard_private.audit_v1()','7f9acc800b3b01ad755d608029bd88bf3533496e4602037641b7568c1ce64312'),
  ('official_v3_guard_private.catalog_status_v1()','6880695c2a5986fee7d5b4357612875b449240ea03020831ba691826509a0101'),
  ('official_v3_guard_private.latch_incident_v1(timestamp with time zone,text)','4c85722cb02ca77332f8292f6ec32eb891b17b3fcb6bfc44a1c36d13acf5645f'),
  ('official_v3_guard_private.require_open_v1()','ad7ebc80c5d50a7c8a6cfad475ed55001b1b8e519db6c9a2afecbed2ed61f1bb'),
  ('public.official_v3_guard_alarm_status_v1()','7b1c8e34dd4db19b1d3552424ec442e7a3e741feedb4855137337d09e77c8537')
), pinned_functions AS (
 SELECT signature,
   to_regprocedure(signature) IS NOT NULL AS resolved,
   encode(sha256(convert_to(pg_get_functiondef(to_regprocedure(signature)),'UTF8')),'hex')=digest AS exact
 FROM expected
), chain AS (
 SELECT jsonb_build_object(
  'status_from_v1_baselines_catalog',b.predecessor_catalog_digest=encode(sha256(convert_to((SELECT catalog::text FROM official_v3_guard_private.baselines_v1 WHERE component='all'),'UTF8')),'hex'),
  'admin_from_rolling_catalog',a.predecessor_catalog_digest=encode(sha256(convert_to(q.catalog::text,'UTF8')),'hex'),
  'admin_from_rolling_record',a.predecessor_rolling_digest=encode(sha256(convert_to((to_jsonb(q)||jsonb_build_object('proof_not_before',extract(epoch FROM q.proof_not_before)))::text,'UTF8')),'hex'),
  'offers_from_admin_catalog',o.predecessor_catalog_digest=encode(sha256(convert_to(a.catalog::text,'UTF8')),'hex'),
  'offers_from_admin_record',o.predecessor_admin_digest=encode(sha256(convert_to((to_jsonb(a)||jsonb_build_object('proof_not_before',extract(epoch FROM a.proof_not_before)))::text,'UTF8')),'hex'),
  'weather_from_offers_record',w.predecessor_sha256=encode(sha256(convert_to((to_jsonb(o)||jsonb_build_object('proof_not_before',extract(epoch FROM o.proof_not_before)))::text,'UTF8')),'hex'),
  'at_source_from_weather_catalog',at_prod.predecessor_catalog_digest=encode(sha256(convert_to(w.catalog::text,'UTF8')),'hex'),
  'at_source_from_weather_record',at_prod.predecessor_weather_digest=encode(sha256(convert_to((to_jsonb(w)||jsonb_build_object('proof_not_before',extract(epoch FROM w.proof_not_before)))::text,'UTF8')),'hex'),
  'switch_v2_from_at_source_catalog',sw.predecessor_catalog_digest=encode(sha256(convert_to(at_prod.catalog::text,'UTF8')),'hex'),
  'switch_v2_from_at_source_record',sw.predecessor_baseline_digest=encode(sha256(convert_to((to_jsonb(at_prod)||jsonb_build_object('proof_not_before',extract(epoch FROM at_prod.proof_not_before)))::text,'UTF8')),'hex'),
  'switch_v2_generation_increases',sw.required_generation>at_prod.required_generation,
  'switch_v2_proof_not_before_monotonic',sw.proof_not_before>=at_prod.proof_not_before
 ) AS gates
 FROM official_v3_guard_private.status_baseline_v1 b
 CROSS JOIN official_v3_guard_private.rolling_quota_baseline_v1 q
 CROSS JOIN official_v3_guard_private.admin_runtime_baseline_v1 a
 CROSS JOIN official_v3_guard_private.saved_offers_baseline_v1 o
 CROSS JOIN official_v3_guard_private.weather_quota_baseline_v1 w
 CROSS JOIN official_v3_guard_private.at_source_monitor_baseline_v1 at_prod
 CROSS JOIN official_v3_guard_private.at_batch_switch_baseline_v2 sw
 WHERE b.singleton AND q.singleton AND a.singleton AND o.singleton AND w.singleton AND at_prod.singleton AND sw.singleton
)
SELECT current_timestamp AS observed_utc,
 current_database()='postgres' AND current_setting('server_version_num')::int/10000=17 AS expected_pg17,
 (SELECT count(*)=6 AND bool_and(coalesce(resolved AND exact,false)) FROM pinned_functions) AS six_original_digests_exact,
 (SELECT count(*)=1 FROM chain) AS one_exact_predecessor_chain,
 (SELECT count(*)=12 FROM chain CROSS JOIN LATERAL jsonb_each(gates)) AS all_twelve_links_present,
 (SELECT count(*)=0 FROM chain CROSS JOIN LATERAL jsonb_each(gates) WHERE value IS DISTINCT FROM 'true'::jsonb) AS all_twelve_links_true,
 (to_regclass('official_v3_guard_private.bg1_transient_baseline_v3') IS NULL) AS v3_not_yet_installed,
 (to_regclass('official_v3_guard_private.bg1_transient_correction_baseline_v4') IS NULL) AS v4_not_yet_installed,
 public.official_v3_guard_alarm_status_v1()->>'status'='unavailable' AS fail_closed_before_owner_go,
 false AS production_permission_to_resume;
ROLLBACK;
