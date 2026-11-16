import assert from 'node:assert/strict'
import { readFileSync } from 'node:fs'
import test from 'node:test'
import { compileProductionArtifacts, INSTALL_ORDER, LOGINS, PRODUCTION, sha256 } from './build.mjs'
import { functionsIn } from '../db/official-truth-v3-background-guard-1/build.mjs'

test('Production compiler reproduces all fixed artifacts and exact source identities', () => {
  for (const [path, output] of compileProductionArtifacts()) {
    assert.equal(readFileSync(new URL('../../' + path, import.meta.url), 'utf8'), output, path)
  }
})
test('Production manifest is fixed, unapplied, HRS before HM04, no owner/source activation', () => {
  const artifacts = compileProductionArtifacts()
  const manifest = JSON.parse(artifacts.get('scripts/official-truth-product-v3-production/manifest.json'))
  assert.equal(manifest.status, 'UNAPPLIED'); assert.equal(manifest.target.project, 'qscbgcdmivbbnzrcyegn')
  assert.ok(INSTALL_ORDER.indexOf('HRS1') < INSTALL_ORDER.indexOf('HM04'))
  assert.equal(LOGINS.length, 6); assert.equal(new Set(LOGINS.map(([login]) => login)).size, 6)
  assert.equal(manifest.activation.productionReads, 'UNAPPLIED')
  assert.equal(manifest.activation.research206, 'RESEARCH_ONLY')
  for (const artifact of manifest.artifacts) assert.equal(sha256(artifacts.get(artifact.path)), artifact.sha256)
  assert.equal(PRODUCTION.host, 'db.qscbgcdmivbbnzrcyegn.supabase.co')
})
test('fresh Production rolling functions do not import Dev recovery baselines or counters', () => {
  const sql = compileProductionArtifacts().get('scripts/db/official-truth-v3-production-install-1/rolling-production.sql')
  assert.doesNotMatch(sql, /CREATE TABLE .*retired_later|CROSS JOIN .*recovery_baseline|dev:yfvbx/)
  assert.match(sql, /VALUES\('research-job:v3:74713f/)
  assert.match(sql, /86400,64,256,0,0,clock_timestamp\(\)/)
  // Ordinary CAS bodies must retain their actual counter updates. The installer
  // itself cannot rewrite a business row; the native proof checks this too.
  const installer = functionsIn(sql).reduce((text, fn) => text.replace(fn.sql, ''), sql)
  assert.doesNotMatch(installer, /UPDATE official_v3_jobs_private\.(?:subjects|queue_operations|execution_starts)/)
})
