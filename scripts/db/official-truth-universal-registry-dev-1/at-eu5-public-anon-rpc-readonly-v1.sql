-- AT EU5 Dev-only public visitor RPC negative end-to-end; no account or 2FA.
-- Two existing public APIs only, strict anon role, no writes and no issuer.
BEGIN TRANSACTION ISOLATION LEVEL READ COMMITTED READ ONLY;
SET LOCAL ROLE anon;
SET LOCAL search_path=pg_catalog;
SET LOCAL statement_timeout='12s';
WITH passports(code,rank) AS (
 VALUES ('DE',4),('PL',5),('IT',6),('RO',9),('FR',10)
), observed AS (
 SELECT p.code,p.rank,public.jetnity_at_visa_v3(p.code) AS v3,
 public.jetnity_source_bound_at_visa_v1(p.code) AS source_bound
 FROM passports p
)
SELECT current_user='anon' AS executed_as_public_anonymous_role,
 count(*)=5 AS checked_five_exact,
 string_agg(code,' ' ORDER BY rank)='DE PL IT RO FR' AS priority_preserved,
 count(*) FILTER(WHERE v3->>'status'='unavailable' AND
   v3->>'message'='derzeit nicht verfügbar' AND
   source_bound->>'status'='unavailable' AND
   source_bound->>'message'='derzeit nicht verfügbar')=5 AS all_five_fails_closed,
 count(*) FILTER(WHERE v3->>'status'='accepted' OR
   source_bound->>'status'='accepted')=0 AS zero_unapproved_positives,
 false AS certified_legal_fact,
 false AS authorized_issuer,
 false AS permits_publication
FROM observed;
ROLLBACK;
