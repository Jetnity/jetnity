import assert from 'node:assert/strict'
import { readFileSync } from 'node:fs'
import { test } from 'node:test'
const sql=readFileSync(new URL('../../../scripts/db/official-truth-at-whole-originals-v2/candidate.sql',import.meta.url),'utf8')
test('AT-only whole-original V2 SQL keeps CH-DE HRS1 and Owner method gates intact',()=>{
  assert.match(sql,/guard_alarm_status_v1/)
  assert.match(sql,/at_v2_hrs1_drift/)
  assert.match(sql,/at_v2_method_already_started/)
  assert.match(sql,/498415/)
  assert.match(sql,/172460/)
  assert.match(sql,/91655/)
  assert.match(sql,/524288/)
  assert.match(sql,/2026-11-06/)
  assert.match(sql,/fcec70ebb5e7869591eaa8490025288534f5e44dddc0926102cd0bb27de8e778/)
  assert.match(sql,/RESEARCH_ONLY/)
  assert.match(sql,/importable=false/)
  assert.match(sql,/accepted_fact_count=0/)
  assert.match(sql,/FORCE ROW LEVEL SECURITY/)
  assert.match(sql,/BEFORE UPDATE OR DELETE/)
  assert.doesNotMatch(sql,/DROP\s+(?:TABLE|SCHEMA|POLICY|CONSTRAINT)/i)
  assert.doesNotMatch(sql,/GRANT\s+(?:ALL|SELECT|INSERT|UPDATE|DELETE)/i)
  assert.doesNotMatch(sql,/ALTER\s+TABLE\s+official_v3_result_private/i)
  assert.doesNotMatch(sql,/CREATE\s+(?:OR\s+REPLACE\s+)?FUNCTION\s+public/i)
})
