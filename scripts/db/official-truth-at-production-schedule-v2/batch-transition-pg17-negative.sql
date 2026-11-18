-- Read-only PG17 executable negative-fixture for the proposed P0 AT batch transition.
-- No references to production objects, no DDL/DML, no rights, no live RPC calls.
-- Runs as a single SELECT in a PG17 Dev session; expected failed_cases=0.
WITH test_cases(
  name, evaluated_at, fact_checked_at, fact_expires_at,
  new_started_at, new_observations, bg1_current, citizen,
  source_digest_valid, method_current, expected, renewed_after_change
) AS (
 VALUES
 ('pending_queue_no_negative',
   timestamptz '2026-11-18 03:00:17+00',timestamptz '2026-11-18 02:09:00+00',
   timestamptz '2026-11-18 03:12:09+00',timestamptz '2026-11-18 03:00:00+00',
   ARRAY[]::text[],true,'CH',true,true,'accepted',false),
 ('one_http_request_pending',
   timestamptz '2026-11-18 03:01:00+00',timestamptz '2026-11-18 02:09:00+00',
   timestamptz '2026-11-18 03:12:09+00',timestamptz '2026-11-18 03:00:00+00',
   ARRAY['unchanged']::text[],true,'CH',true,true,'accepted',false),
 ('unchanged_three_before_renewal',
   timestamptz '2026-11-18 03:06:00+00',timestamptz '2026-11-18 02:09:00+00',
   timestamptz '2026-11-18 03:12:09+00',timestamptz '2026-11-18 03:00:00+00',
   ARRAY['unchanged','unchanged','unchanged']::text[],true,'CH',true,true,'accepted',false),
 ('one_source_changed',
   timestamptz '2026-11-18 03:01:00+00',timestamptz '2026-11-18 02:09:00+00',
   timestamptz '2026-11-18 03:12:09+00',timestamptz '2026-11-18 03:00:00+00',
   ARRAY['changed']::text[],true,'CH',true,true,'unavailable',false),
 ('one_source_http_failure',
   timestamptz '2026-11-18 03:01:00+00',timestamptz '2026-11-18 02:09:00+00',
   timestamptz '2026-11-18 03:12:09+00',timestamptz '2026-11-18 03:00:00+00',
   ARRAY['unavailable']::text[],true,'CH',true,true,'unavailable',false),
 ('pending_after_six_minutes',
   timestamptz '2026-11-18 03:06:01+00',timestamptz '2026-11-18 02:09:00+00',
   timestamptz '2026-11-18 03:12:09+00',timestamptz '2026-11-18 03:00:00+00',
   ARRAY[]::text[],true,'CH',true,true,'unavailable',false),
 ('old_lease_expires_even_if_new_unchanged',
   timestamptz '2026-11-18 03:12:09+00',timestamptz '2026-11-18 02:09:00+00',
   timestamptz '2026-11-18 03:12:09+00',timestamptz '2026-11-18 03:00:00+00',
   ARRAY['unchanged','unchanged','unchanged']::text[],true,'CH',true,true,'unavailable',false),
 ('new_signed_fact_after_atomic_renewal',
   timestamptz '2026-11-18 03:07:01+00',timestamptz '2026-11-18 03:05:00+00',
   timestamptz '2026-11-18 04:07:00+00',NULL::timestamptz,
   ARRAY[]::text[],true,'CH',true,true,'accepted',false),
 ('bg1_off',
   timestamptz '2026-11-18 03:00:17+00',timestamptz '2026-11-18 02:09:00+00',
   timestamptz '2026-11-18 03:12:09+00',timestamptz '2026-11-18 03:00:00+00',
   ARRAY[]::text[],false,'CH',true,true,'unavailable',false),
 ('in_pass_not_qualified',
   timestamptz '2026-11-18 03:00:17+00',timestamptz '2026-11-18 02:09:00+00',
   timestamptz '2026-11-18 03:12:09+00',timestamptz '2026-11-18 03:00:00+00',
   ARRAY[]::text[],true,'IN',true,true,'unavailable',false),
 ('source_digest_tampered',
   timestamptz '2026-11-18 03:00:17+00',timestamptz '2026-11-18 02:09:00+00',
   timestamptz '2026-11-18 03:12:09+00',timestamptz '2026-11-18 03:00:00+00',
   ARRAY[]::text[],true,'CH',false,true,'unavailable',false),
 ('method_revoked',
   timestamptz '2026-11-18 03:00:17+00',timestamptz '2026-11-18 02:09:00+00',
   timestamptz '2026-11-18 03:12:09+00',timestamptz '2026-11-18 03:00:00+00',
   ARRAY[]::text[],true,'CH',true,false,'unavailable',false),
 ('observed_change_blocks_auto_renewal_after_recovery',
   timestamptz '2026-11-18 03:07:01+00',timestamptz '2026-11-18 02:09:00+00',
   timestamptz '2026-11-18 04:07:00+00',NULL::timestamptz,
   ARRAY[]::text[],true,'CH',true,true,'unavailable',true)
),
evaluation AS (
 SELECT name,expected,
   CASE WHEN NOT bg1_current OR citizen <> 'CH' OR NOT source_digest_valid
     OR NOT method_current OR renewed_after_change
     OR evaluated_at>=fact_expires_at
     OR evaluated_at>=fact_checked_at+interval '70 minutes'
     OR 'changed'=ANY(new_observations) OR 'unavailable'=ANY(new_observations)
     OR (new_started_at IS NOT NULL
        AND evaluated_at>=new_started_at+interval '6 minutes'
        AND coalesce(array_length(new_observations,1),0)<>3)
   THEN 'unavailable' ELSE 'accepted' END AS actual
 FROM test_cases
)
SELECT count(*) AS pg17_cases,
       count(*) FILTER(WHERE expected IS DISTINCT FROM actual) AS failed_cases,
       string_agg(name,',' ORDER BY name) FILTER(WHERE expected IS DISTINCT FROM actual) AS failed_scenarios
FROM evaluation;
