import assert from 'node:assert/strict'
import { test } from 'node:test'
import { readFileSync } from 'node:fs'
const sql=readFileSync(new URL('../../../scripts/db/official-truth-followup-raw-originals-dev-1/install.sql',import.meta.url),'utf8')
test('original government responses for four countries come from real pinned GET and not research guesses',()=>{
 assert.match(sql,/ORIGINALS-4-V1/)
 for(const country of ['IT','FR','ES','PT'])assert.match(sql,new RegExp("'"+country+"'"))
 assert.match(sql,/JOIN net\._http_response r ON r\.id=i\.request_id/)
 assert.match(sql,/r\.status_code=200/)
 assert.match(sql,/raw_sha256 text GENERATED ALWAYS/)
 assert.match(sql,/raw_bytes integer GENERATED ALWAYS/)
 assert.match(sql,/position\(lower\(s\.content_marker\) IN lower\(r\.content\)\)>0/)
 assert.match(sql,/position\('radware bot manager captcha' IN lower\(r\.content\)\)=0/)
 assert.match(sql,/observations_v3\)<>4/)
})
test('private append-only research originals can never become public or automatically approved',()=>{
 assert.match(sql,/FORCE ROW LEVEL SECURITY/)
 assert.match(sql,/immutable_rows BEFORE UPDATE OR DELETE/)
 assert.match(sql,/immutable_truncate BEFORE TRUNCATE/)
 assert.match(sql,/research_only boolean NOT NULL DEFAULT true CHECK\(research_only=true\)/)
 assert.match(sql,/source_qualified boolean NOT NULL DEFAULT false CHECK\(source_qualified=false\)/)
 assert.match(sql,/positive_legal_facts integer NOT NULL DEFAULT 0 CHECK\(positive_legal_facts=0\)/)
 assert.match(sql,/publication_allowed boolean NOT NULL DEFAULT false CHECK\(publication_allowed=false\)/)
 assert.match(sql,/REVOKE ALL ON TABLE jetnity_followup_source_monitor_private\.source_originals_v1/)
 assert.match(sql,/PERFORM official_v3_guard_private\.assert_catalog_v1\(\)/)
 assert.match(sql,/BEGIN;/);assert.match(sql,/COMMIT;\s*$/)
 assert.doesNotMatch(sql,/GRANT EXECUTE|CREATE OR REPLACE FUNCTION public\.|INSERT INTO official_v3_source_renewal_private/i)
})