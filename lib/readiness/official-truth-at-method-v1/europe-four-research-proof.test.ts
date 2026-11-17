import assert from 'node:assert/strict'
import { readFileSync } from 'node:fs'
import { test } from 'node:test'
const path=new URL('../../../scripts/official-truth-europe-four-research-proof.py',import.meta.url)
const content=readFileSync(path,'utf8')
test('four-Europe archive integrity checker is offline, exact and fail-closed',()=>{
 assert.match(content,/ARCHIVE_SHA = "6ef8c9f6e36bee2f75cf162d725a60844ef757bfad14407f69d81631cb9f55e5"/)
 assert.match(content,/PRIORITY_SHA = "4515324024236916142857bf16d67590a7a1ca11c31fd1263e8b7979fd6eb358"/)
 assert.match(content,/RESEARCH_ONLY/)
 assert.ok(content.includes('schemas[schema]'))
 assert.ok(content.includes('aggregate.hexdigest()==expected'))
 assert.match(content,/country_record_bundle_refused/)
 assert.match(content,/archive_identity_refused/)
 assert.ok(content.includes('record.get("status")=="RESEARCH_ONLY"'))
 assert.doesNotMatch(content,/(psycopg|asyncpg|subprocess|requests\\.get|urllib\\.request|supabase\\.client|sqlalchemy|http\\.client)/)
})
