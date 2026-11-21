-- Dev AT10 five EU passports live public RPC negative evidence; READ ONLY.
-- No browser state, tokens, passports or positive rules are created.
BEGIN TRANSACTION ISOLATION LEVEL READ COMMITTED READ ONLY;
SET LOCAL ROLE anon;
SET LOCAL search_path=pg_catalog;
SET LOCAL statement_timeout='8s';
WITH codes(code,rank) AS (VALUES ('DE',4),('PL',5),('IT',6),('RO',9),('FR',10)),
answers AS (SELECT code,rank,public.jetnity_at_visa_v3(code) visa,
 public.jetnity_source_bound_at_visa_v1(code) sourcebound FROM codes)
SELECT current_user AS role,count(*) AS checked,
 count(*) FILTER(WHERE visa->>'status'='unavailable' AND sourcebound->>'status'='unavailable'
 AND visa->>'message'='derzeit nicht verfügbar'
 AND sourcebound->>'message'='derzeit nicht verfügbar') AS safely_unavailable,
 count(*) FILTER(WHERE visa->>'status'='accepted' OR sourcebound->>'status'='accepted') AS unauthorized_positive,
 string_agg(code,' ' ORDER BY rank) AS passports,
 false AS legal_rule_approved,false AS hsr2_issuer_installed
FROM answers;
ROLLBACK;
