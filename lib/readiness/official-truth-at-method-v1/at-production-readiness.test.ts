import assert from 'node:assert/strict'
import { test } from 'node:test'
import { readFileSync } from 'node:fs'
const sql=readFileSync(new URL('../../../scripts/db/official-truth-at-production-readiness-1/read-only-preflight.sql',import.meta.url),'utf8')
const gate=readFileSync(new URL('../../../docs/official-truth-at-production-readiness-20261117.md',import.meta.url),'utf8')
test('Production preflight is read-only, refuses authority, and preserves Dev/Production separation',()=>{
 assert.match(sql,/BEGIN READ ONLY;/)
 assert.match(sql,/ROLLBACK;\s*$/)
 assert.match(sql,/STOP_BEFORE_PRODUCTION_OWNER_RELEASE/)
 assert.doesNotMatch(sql,/\b(?:CREATE|ALTER|INSERT|UPDATE|DELETE|DROP|TRUNCATE|GRANT|REVOKE)\s+(?:TABLE|SCHEMA|ROLE|FUNCTION|INTO|FROM|ON|official_v3_)/i)
 assert.match(gate,/Status: STOP/)
 assert.match(gate,/RESEARCH_ONLY/)
 assert.match(gate,/every 60 minutes|every 60 minutes|alle 60 Minuten|hourly/)
 assert.match(gate,/1 h/)
 assert.match(gate,/24 h/)
 assert.match(gate,/five-minute cadence/)
 assert.match(gate,/Production selector/)
})
