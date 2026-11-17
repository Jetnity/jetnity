// No new authority, source checksum or passport visa fact is asserted by this
// test. It verifies the safe, reproducible DEV_ONLY research-stage contract.
import assert from 'node:assert/strict'
import { test } from 'node:test'
import { readFileSync } from 'node:fs'

const sql = readFileSync(
 new URL('../../../scripts/db/official-truth-followup-primary-dev-1/install.sql',import.meta.url),
 'utf8',
)
test('four destinations and all 50 existing passport identities stay research-only',()=>{
 assert.match(sql,/FOLLOWUP-SOURCE-CANDIDATES-1/)
 assert.match(sql,/passport_priority_v1\(rank,code\)/)
 assert.match(sql,/passports?._?research_v1|passport_research_v1/)
 assert.match(sql,/<>200/)
 assert.match(sql,/<>5200/)
 assert.match(sql,/EU_CH_OFFICIAL_CANDIDATE/)
 assert.match(sql,/<>76/)
 assert.match(sql,/visitor_status text NOT NULL DEFAULT 'derzeit nicht verfügbar'/)
 assert.match(sql,/source_qualified boolean NOT NULL DEFAULT false CHECK\(source_qualified=false\)/)
 assert.match(sql,/publication_allowed boolean NOT NULL DEFAULT false CHECK\(publication_allowed=false\)/)
 assert.match(sql,/original_body_sha256 text CHECK\(original_body_sha256 IS NULL\)/)
 assert.match(sql,/legal_valid_until timestamptz CHECK\(legal_valid_until IS NULL\)/)
 assert.match(sql,/PERFORM official_v3_guard_private\.assert_catalog_v1\(\)/)
})
test('source inventory cannot be promoted to public, nor modify old protected truth',()=>{
 assert.match(sql,/BEGIN;/)
 assert.match(sql,/COMMIT;\s*$/)
 assert.match(sql,/FORCE ROW LEVEL SECURITY/)
 assert.match(sql,/BEFORE UPDATE OR DELETE/)
 assert.match(sql,/BEFORE TRUNCATE/)
 assert.match(sql,/REVOKE ALL ON SCHEMA jetnity_followup_primary_private FROM PUBLIC,anon,authenticated,service_role/)
 assert.match(sql,/REVOKE ALL ON ALL TABLES IN SCHEMA jetnity_followup_primary_private/)
 assert.doesNotMatch(sql,/GRANT EXECUTE|GRANT SELECT|SET ROLE authenticated|CREATE OR REPLACE FUNCTION official_v3_/i)
 assert.doesNotMatch(sql,/cron\.schedule|jetnity_source_bound_at_visa_v1\(/)
 assert.match(sql,/research_conflicts<>CASE WHEN c.destination_code='ES' THEN 30 ELSE 0 END/)
})
