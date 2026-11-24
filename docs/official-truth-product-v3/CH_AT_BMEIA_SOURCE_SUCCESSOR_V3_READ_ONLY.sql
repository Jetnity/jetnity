-- Owner-source-successor V3 – RETEST ONLY. NO fact issuance or approval.
-- Production qscbgcdmivbbnzrcyegn; target source snapshot 23.11.2026 batch 639.
-- The actual most recent completed batch may drift. On ANY mismatch: STOP,
-- collect a NEW whole-original identity and obtain NEW Owner decision.
BEGIN TRANSACTION ISOLATION LEVEL REPEATABLE READ READ ONLY;
SET LOCAL search_path=pg_catalog;
SET LOCAL statement_timeout='12s';
WITH expected(source_id,expected_sha,expected_bytes) AS (
 VALUES
 ('bmeia-bern-how-to-apply','b8ae6ea71f8ca44556ec30be7921de9c18c26211da1a6175d9b5c0bda85aabc8',172428),
 ('bmi-general-entry','ab2b735bf53e21a83c447fe9cfefabd7ffc54406f68793d01acac421fd6c301e',91655),
 ('bmi-visa-nationality-matrix','fcec70ebb5e7869591eaa8490025288534f5e44dddc0926102cd0bb27de8e778',498415)
),latest AS(
 SELECT MAX(batch_id) AS batch_id FROM official_v3_at_production_private.watch_batches_v1
),readback AS(
 SELECT e.source_id,e.expected_sha,e.expected_bytes,
  o.batch_id,o.observed_at,o.source_status,o.http_status,o.body_sha,o.bytes,
  (o.http_status=200 AND o.body_sha=e.expected_sha AND o.bytes=e.expected_bytes) AS exact_source_match
 FROM expected e CROSS JOIN latest l
 LEFT JOIN official_v3_at_production_private.watch_observations_v1 o
  ON o.source_id=e.source_id AND o.batch_id=l.batch_id
)
SELECT source_id,expected_sha,expected_bytes,batch_id,observed_at,
 source_status,http_status,body_sha,bytes,exact_source_match,
 CASE WHEN exact_source_match IS NOT TRUE THEN 'STOP_NEW_SOURCE_VERSION_REQUIRED'
 WHEN source_id='bmeia-bern-how-to-apply' AND source_status='changed'
 THEN 'REVIEW_ONLY_SOURCE_CHANGED_OWNER_V3_NOT_YET_APPROVED'
 WHEN source_id<>'bmeia-bern-how-to-apply' AND source_status='unchanged_exact'
 THEN 'EXACT_BMI_READBACK_ONLY_NOT_PUBLICATION'
 ELSE 'STOP_UNEXPECTED_STATE'
 END AS reviewer_verdict
FROM readback ORDER BY source_id;
ROLLBACK;
