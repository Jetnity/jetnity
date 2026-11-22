-- PREPARED ONLY. Run in Production only after separate installation/Owner-Go.
-- Native BG1 uses SELECT FOR SHARE, so a normal BEGIN is required; no writes.
BEGIN;
SET LOCAL search_path=pg_catalog;
SET LOCAL statement_timeout='12s';
SET LOCAL lock_timeout='700ms';
SET LOCAL ROLE anon;
WITH ch AS (
 SELECT public.jetnity_source_bound_at_visa_v1('CH') AS result
), forbidden AS (
 SELECT code, public.jetnity_source_bound_at_visa_v1(code)->>'status' AS status
 FROM (VALUES('IN'),('DE'),('US'),('TR'),('CN'),('FR'),('IT'),('AT'),('ZZ'),('')) p(code)
)
SELECT jsonb_build_object(
 'scope','PROD_CH_AT_V2_REAL_ANON_READBACK_ONLY',
 'checked_at_utc',clock_timestamp(),
 'role',current_user,
 'public_CH',(SELECT result FROM ch),
 'CH_no_visa',(SELECT result->>'visaEffect'='not_required' FROM ch),
 'CH_three_official_sources',(SELECT jsonb_array_length(result->'sourceUrls')=3 FROM ch
  WHERE result->>'status'='accepted'),
 'forbidden_codes',(SELECT jsonb_agg(code ORDER BY code) FROM forbidden),
 'foreign_passports_fail_closed',(SELECT count(*)=10 AND bool_and(status='unavailable') FROM forbidden),
 'no_direct_private_table_selects',true,
 'no_persistent_writes',true,
 'transaction_end','ROLLBACK'
) AS readback;
ROLLBACK;
