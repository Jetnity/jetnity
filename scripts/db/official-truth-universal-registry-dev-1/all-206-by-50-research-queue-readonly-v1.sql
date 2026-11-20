-- Jetnity Official Truth #1254: original 206 destinations x exact 50 pass
-- priority, development read-only research queue. No raw archive files are
-- imported here. Previously recorded original passport-priority.csv SHA-256:
-- 4515324024236916142857bf16d67590a7a1ca11c31fd1263e8b7979fd6eb358
-- The actual CSV bytes are external; this binds the current Dev *ranking*,
-- not a new independent re-hash of that external file.
-- 204 ISO destinations plus two explicit CN-HK and CN-MO special regions.
-- Dest order: pre-approved 13 first (AT IT FR ES PT GR HR NL GB US TR TH
-- AE), then alphabetically for deterministic research queue ONLY. This is
-- NOT a legal preference or a publication plan. Pass order ALWAYS exact.
BEGIN TRANSACTION ISOLATION LEVEL REPEATABLE READ READ ONLY;
SET LOCAL search_path=pg_catalog;
SET LOCAL statement_timeout='30s';
SET LOCAL lock_timeout='4s';

WITH queue_order AS (
 SELECT ARRAY['AT','IT','FR','ES','PT','GR','HR','NL','GB','US','TR','TH','AE']::text[] AS selected
), expected_rank AS (
 SELECT string_agg(code,' ' ORDER BY rank) AS actual,
   count(*) AS passports,count(DISTINCT rank) AS ranks,count(DISTINCT code) AS codes
 FROM official_v3_source_renewal_private.passport_priority_v1
), custody AS (
 SELECT r.destination_code,count(*) AS rows,
   count(DISTINCT r.citizenship_code) AS unique_passports,
   count(DISTINCT r.priority_rank) AS unique_ranks,
   count(*) FILTER (WHERE r.citizenship_code<>p.code OR r.priority_rank<>p.rank) AS rank_mismatches,
   count(*) FILTER (WHERE r.original_slice_path<>
     'records/dest/'||r.destination_code||'/'||r.citizenship_code||'.json') AS invalid_archive_path,
   count(*) FILTER (WHERE r.document_scope<>'ordinary_national_passport'
     OR r.source_snapshot_class<>'RESEARCH_ONLY_UNVERIFIED_CONTENT'
     OR r.customer_status<>'derzeit nicht verfügbar'
     OR r.primary_source_verified OR r.legal_rule_qualified OR r.publication_allowed
     OR r.accepted_fact_count<>0 OR r.source_checked_at IS NOT NULL
     OR r.legal_valid_until IS NOT NULL) AS unreviewed_status_corruptions,
   min(r.priority_rank) AS first_rank,max(r.priority_rank) AS last_rank,
   string_agg(r.citizenship_code,' ' ORDER BY r.priority_rank) AS ranked_passports
 FROM jetnity_global_research_private.cases_v1 r
 JOIN official_v3_source_renewal_private.passport_priority_v1 p
 ON p.rank=r.priority_rank
 GROUP BY r.destination_code
), totals AS (
 SELECT count(*) AS destinations,sum(rows) AS rows,
 count(*) FILTER(WHERE length(destination_code)=2
   AND destination_code~'^[A-Z]{2}$') AS ordinary_destinations,
 count(*) FILTER(WHERE destination_code IN('CN-HK','CN-MO')) AS special_regions,
 count(*) FILTER(WHERE rows=50 AND unique_passports=50 AND unique_ranks=50
   AND first_rank=1 AND last_rank=50) AS fully_ranked,
 sum(rank_mismatches) AS rank_mismatches,
 sum(invalid_archive_path) AS invalid_archive_path,
 sum(unreviewed_status_corruptions) AS status_failures,
 count(*) FILTER(WHERE destination_code IN('AT','IT','FR','ES','PT','GR','HR','NL','GB','US','TR','TH','AE')) AS priority_destinations
 FROM custody
), safety AS (
 SELECT (t.destinations=206 AND t.rows=10300 AND t.ordinary_destinations=204
  AND t.special_regions=2 AND t.fully_ranked=206
  AND t.rank_mismatches=0 AND t.invalid_archive_path=0
  AND t.status_failures=0 AND t.priority_destinations=13
  AND e.passports=50 AND e.ranks=50 AND e.codes=50
  AND e.actual='IN TR CN DE PL IT US UA RO FR NL GB AT ES HU SY CZ AF CH RU HR BE IQ PT BG BR GR IR SK PK ER TH SO VN SE NG EG XK KR LK DK PH JP LB RS LT CA CM MA IL'
  AND current_database()='postgres' AND current_setting('server_version_num')::int/10000=17
  AND public.official_v3_guard_alarm_status_v1()->>'status'='current'
  ) AS exactly_ordered_research_only
 FROM totals t CROSS JOIN expected_rank e
)
SELECT r.destination_code,
 row_number() OVER(ORDER BY coalesce(array_position(q.selected,r.destination_code),2147483647),
  r.destination_code) AS research_queue_position,
 r.rows AS research_passports,
 r.unique_passports AS distinct_passports,
 r.unique_ranks AS distinct_priority_ranks,
 r.first_rank,r.last_rank,
 r.rank_mismatches,r.invalid_archive_path,r.unreviewed_status_corruptions,
 CASE WHEN s.exactly_ordered_research_only
  AND r.rows=50 AND r.rank_mismatches=0 AND r.invalid_archive_path=0
  AND r.unreviewed_status_corruptions=0
  THEN 'RESEARCH_INPUT_REGISTER_VERIFIED_NOT_DESTINATION_LAW'
  ELSE '206_SOURCE_OR_PRIORITY_OR_BG1_REFUSED' END AS source_queue_verdict,
 false::boolean AS official_destination_primary_fact_sealed,
 false::boolean AS visa_legally_qualified,
 false::boolean AS individual_documents_route_status_verified,
 false::boolean AS ma1_owner_aal2_approved,
 false::boolean AS publication_allowed,
 'derzeit nicht verfügbar'::text AS visitor_answer,
 'derzeit nicht verfügbar'::text AS individual_vaccination_answer,
 'derzeit nicht verfügbar'::text AS individual_form_cost_answer
FROM custody r CROSS JOIN queue_order q CROSS JOIN safety s
ORDER BY research_queue_position;
ROLLBACK;