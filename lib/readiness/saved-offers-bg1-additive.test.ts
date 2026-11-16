import assert from 'node:assert/strict'
import test from 'node:test'
import { readFileSync } from 'node:fs'
import { compileSavedOffersGuard, verifyMigrationBytes } from '../../scripts/db/saved-offers-bg1-additive-1/compose.mjs'

test('one owner-only bundle binds unchanged migration bytes and refuses alterations',()=>{
  const canonical=readFileSync(new URL('../../supabase/migrations/20261113173644_saved_offers.sql',import.meta.url))
  assert.equal(verifyMigrationBytes(canonical),true)
  assert.throws(()=>verifyMigrationBytes(Buffer.concat([canonical,Buffer.from('\n-- bypass')])) )
  const sql=compileSavedOffersGuard()
  assert.match(sql,/^BEGIN;\n/)
  assert.match(sql,/COMMIT;\n$/)
  assert.match(sql,/production:qscbgcdmivbbnzrcyegn:SAVED-OFFERS-BG1-1/)
  assert.match(sql,/approved_delta_digest/)
  assert.match(sql,/c\.relname IN \('profiles','saved_offers'\)/)
  assert.match(sql,/CREATE OR REPLACE FUNCTION official_v3_guard_private\.catalog_status_v1\(\)/)
  assert.match(sql,/saved_offers unauthorized catalog delta/)
  assert.match(sql,/saved_offers unproved successor must fail closed/)
  assert.match(sql,/official_v3_guard_private\.saved_offers_baseline_v1/)
  assert.match(sql,/official_v3_guard_private\.assert_catalog_v1\(\)/)
  assert.match(sql,/official_v3_guard_private\.require_open_v1\(\)/)
  assert.match(sql,/public\.official_v3_guard_alarm_status_v1\(\)/)
  assert.ok(sql.indexOf('CREATE TABLE public.saved_offers')>=0||sql.indexOf('create table public.saved_offers')>=0)
  assert.ok(sql.indexOf('saved_offers unauthorized catalog delta')<sql.indexOf('CREATE TABLE official_v3_guard_private.saved_offers_baseline_v1'))
  assert.equal((sql.match(/(?:create table public\.saved_offers)/gi)||[]).length,2) // original + retained migration history byte string
  assert.ok(sql.length<140000)
})

test('predecessor and publication guards are never bypassed',()=>{
  const sql=compileSavedOffersGuard()
  const blocked=[
    /ALTER\s+TABLE\s+official_v3_guard_private\.baselines_v1\s+DISABLE\s+TRIGGER/i,
    /TRUNCATE\s+official_v3_guard_private\.baselines_v1/i,
    /DROP\s+TABLE\s+official_v3_guard_private/i,
    /GRANT\s+(?:ALL|SELECT|INSERT|UPDATE|DELETE)\s+ON\s+(?:public\.)?saved_offers\s+TO\s+anon/i,
  ]
  for (const item of blocked) assert.doesNotMatch(sql,item)
  assert.match(sql,/migration_blob IS DISTINCT FROM/)
  assert.match(sql,/offers.predecessor_admin_digest IS DISTINCT FROM/)
  assert.match(sql,/admin.predecessor_rolling_digest IS DISTINCT FROM/)
  assert.match(sql,/greatest\(offers.required_generation,a.required_generation,q.required_generation,b.required_generation\)/)
  assert.match(sql,/proof_not_before/)
  assert.match(sql,/required_generation/)
  assert.match(sql,/GET|ROLLBACK|SAVEPOINT|COMMIT/) // only source contract, not hosted proof
})
