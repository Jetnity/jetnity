import assert from 'node:assert/strict'
import { readFileSync } from 'node:fs'
import test from 'node:test'
import { compileAdminRuntimeInstallation, BASELINE, REPLACEMENTS, TARGET } from '../../../scripts/db/admin-runtime-bg1-1/build.mjs'
import { functionsIn } from '../../../scripts/db/official-truth-v3-background-guard-1/build.mjs'

const compiled = compileAdminRuntimeInstallation()

test('the fixed Dev provider artifact is reproducible, atomic and contains no executor', () => {
  assert.equal(readFileSync('scripts/db/admin-runtime-bg1-1/provider-migration-body.sql', 'utf8'), compiled.migration)
  assert.equal(compileAdminRuntimeInstallation().migration, compiled.migration)
  assert.equal(TARGET, 'dev:yfvbxvijcorffwxbxahl:ADMIN-RUNTIME-BG1-1')
  assert.match(compiled.migration, /transaction_isolation/)
  assert.doesNotMatch(compiled.migration, /ALTER ROLE|CREATE ROLE|DISABLE TRIGGER|session_replication_role/)
  assert.doesNotMatch(compiled.migration, /UPDATE official_v3_guard_private\.|DELETE FROM official_v3_guard_private\.|TRUNCATE official_v3_guard_private\./)
  assert.equal(compiled.inventory.tables.length, 7)
  assert.equal(compiled.inventory.functions.length, 36)
  assert.deepEqual(compiled.inventory.replacements.map((f: { signature: string }) => f.signature), REPLACEMENTS)
})

test('all old graph entries remain mandatory; added graph origins are closed and old evidence is immutable', () => {
  assert.match(compiled.migration, /FOR item IN SELECT key,value FROM jsonb_each\(before_catalog\)/)
  assert.match(compiled.migration, /admin runtime predecessor graph changed/)
  assert.match(compiled.migration, /admin runtime unreviewed additive graph edge/)
  assert.match(compiled.migration, /admin runtime foreign shared dependency changed/)
  assert.match(compiled.migration, /admin runtime historical evidence changed/)
  assert.match(compiled.migration, /CREATE TRIGGER immutable_truncate_v1 BEFORE TRUNCATE ON official_v3_guard_private.admin_runtime_baseline_v1/)
  assert.match(compiled.migration, /s\.generation\+1,clock_timestamp\(\),after_catalog/)
  assert.match(compiled.migration, /requires a new regular BG1 generation/)
  assert.equal(BASELINE, 'official_v3_guard_private.admin_runtime_baseline_v1')
})

test('all new public entrypoints and actors enforce the DB guard before and after work', () => {
  const derived = functionsIn(compiled.runtimeDefinitions) as { signature: string; options: string; body: string }[]
  assert.equal(derived.length, 10)
  for (const f of derived) {
    assert.match(f.options, /\bvolatile\b/i, f.signature)
    if (f.signature === 'public.admin_account_counts_v1()') continue // Invoker delegates to guarded Producer.
    assert.ok(f.body.split('official_v3_guard_private.admin_runtime_guard_v1();').length >= 3, f.signature)
    if (f.signature.startsWith('public.admin_cms_') || f.signature.startsWith('public.admin_marketing_')) {
      const returned = [...f.body.matchAll(/\bRETURN\s+([^;]+);/g)]
      assert.ok(returned.length > 0)
      for (const value of returned) assert.equal(value[1], 'admin_runtime_result')
      assert.equal([...f.body.matchAll(/admin_runtime_result := /g)].length, returned.length)
    }
  }
  const published = derived.find(f => f.signature === 'public.cms_inspiration_published_v1()')!
  assert.match(published.options, /LANGUAGE plpgsql VOLATILE SECURITY DEFINER/)
  assert.match(published.body, /WHERE NOT e.archived AND e.published_revision IS NOT NULL/)
  assert.match(readFileSync('scripts/db/admin-account-counts-dev-20261115/install.sql', 'utf8'), /counts_dev_entry_guard_integration_required/)
})

test('the finite schema manifest retains adjacent inline constraints and precise trigger bindings', () => {
  const tables = compiled.inventory.tables as { name: string; constraints: number; triggers: { name: string; type: number; deferred: boolean }[] }[]
  assert.deepEqual(tables.map(t => t.constraints), [8, 22, 7, 12, 5, 17, 6])
  assert.deepEqual(tables.map(t => t.constraints - t.triggers.filter(trigger => trigger.deferred).length),
    [8, 22, 7, 12, 4, 16, 5])
  assert.deepEqual(tables.map(t => t.triggers.length), [2, 3, 2, 2, 4, 3, 3])
  const drafts = tables.find(t => t.name === 'jetnity_marketing_private.drafts_v1')!
  assert.deepEqual(drafts.triggers.find(t => t.name === 'drafts_complete_v1'), {
    name: 'drafts_complete_v1', function: 'jetnity_marketing_private.enforce_chain_v1()', type: 21, deferred: true,
  })
})
