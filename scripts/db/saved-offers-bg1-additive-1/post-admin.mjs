import assert from 'node:assert/strict'
import { createHash } from 'node:crypto'
import { readFileSync } from 'node:fs'
import { functionsIn } from '../official-truth-v3-background-guard-1/build.mjs'

const baseline = 'official_v3_guard_private.saved_offers_baseline_v1'
const adminBundle = new URL('../admin-runtime-production-1/provider-migration-body.sql', import.meta.url)

function once(text, original, replacement) {
  assert.equal(text.split(original).length, 2, 'Expected one guard anchor: ' + original)
  return text.replace(original, () => replacement)
}

export function postAdminValidators(migrationBlob) {
  const sql = readFileSync(adminBundle, 'utf8')
  assert.equal(createHash('sha256').update(sql).digest('hex'),
    '04a58df6b3871d0114c3507a44204d0e7de9fe769c96cb426afdc63954aa982b')
  const installed = new Map(functionsIn(sql).map(fn => [fn.name, fn]))
  function extend(name, change) {
    const fn = installed.get(name)
    assert.ok(fn, name)
    return once(fn.sql, fn.body, change(fn.body))
  }
  function fresh(body) {
    return once(once(once(body, 'greatest(a.required_generation,', 'greatest(offers.required_generation,a.required_generation,'),
      'greatest(a.proof_not_before,', 'greatest(offers.proof_not_before,a.proof_not_before,'),
      'a WHERE q.singleton AND b.singleton AND a.singleton',
      'a CROSS JOIN ' + baseline + ' offers WHERE q.singleton AND b.singleton AND a.singleton AND offers.singleton')
  }
  return [
    extend('official_v3_guard_private.catalog_status_v1', body =>
      once(body, "c.relname='profiles'", "c.relname IN ('profiles','saved_offers')")),
    extend('official_v3_guard_private.assert_catalog_v1', body => {
      body = once(body, 'DECLARE admin ', 'DECLARE offers ' + baseline + '%ROWTYPE;\n  admin ')
      body = once(body, 'BEGIN\n', 'BEGIN\n  SELECT * INTO STRICT offers FROM ' + baseline + ' WHERE singleton;\n')
      return once(body, 'OR admin.catalog IS DISTINCT FROM official_v3_guard_private.catalog_status_v1()', [
        "OR offers.migration_blob IS DISTINCT FROM '" + migrationBlob + "'",
        "OR offers.predecessor_catalog_digest IS DISTINCT FROM encode(sha256(convert_to(admin.catalog::text,'UTF8')),'hex')",
        "OR offers.predecessor_admin_digest IS DISTINCT FROM encode(sha256(convert_to((to_jsonb(admin)||jsonb_build_object('proof_not_before',extract(epoch FROM admin.proof_not_before)))::text,'UTF8')),'hex')",
        'OR offers.catalog IS DISTINCT FROM official_v3_guard_private.catalog_status_v1()',
      ].join('\n    '))
    }),
    extend('official_v3_guard_private.require_open_v1', fresh),
    extend('public.official_v3_guard_alarm_status_v1', fresh),
  ].join('\n\n')
}
