import assert from 'node:assert/strict'
import { readFileSync } from 'node:fs'
import { test } from 'node:test'
import { customerInformationDefinitions } from './generate-definitions'
// @ts-expect-error Existing reviewed SQL inventory parser is a JS module.
import { functionsIn } from '../db/official-truth-v3-background-guard-1/build.mjs'
import { V3_INFORMATION_ITEM_PATTERN } from '../../lib/readiness/official-truth-product-v3/customer-information/topics'

test('CI1 additive overlay contains only six reviewed body replacements with original function metadata', () => {
  const sql = customerInformationDefinitions()
  assert.equal(sql, readFileSync('scripts/db/official-truth-v3-customer-information-1/definitions.sql', 'utf8'))
  const current = functionsIn(sql), originals = [
    'scripts/db/official-truth-v3-hosted-intake-store-1/install-candidate.sql',
    'scripts/db/official-truth-v3-hosted-result-store-1/install-candidate.sql',
    'scripts/db/official-truth-v3-hosted-durable-jobs-1/install-candidate.sql',
  ].flatMap(path => functionsIn(readFileSync(path, 'utf8')))
  assert.equal(current.length, 6)
  for (const f of current) {
    const old = originals.find((candidate: { signature: string }) => candidate.signature === f.signature)
    assert.ok(old)
    assert.equal(f.args, old.args)
    assert.equal(f.options.trimEnd(), old.options.trimEnd())
    assert.notEqual(f.body, old.body)
    if (f.name.endsWith('.context_v1')) {
      assert.equal(f.body.split("semantic:=jsonb_build_object('scope'").length, 2)
      assert.ok(f.body.includes(`informationItem' ~ '${V3_INFORMATION_ITEM_PATTERN}')`), 'SQL regex dollar must not interpolate JS replacement suffix')
    }
  }
})
