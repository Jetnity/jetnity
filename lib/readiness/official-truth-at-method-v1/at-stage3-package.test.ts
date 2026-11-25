import assert from 'node:assert/strict'
import { createHash } from 'node:crypto'
import { readFileSync } from 'node:fs'
import { test } from 'node:test'
import { buildPackage, manifestFor } from '../../../scripts/db/official-truth-at-stage3/assemble.mjs'

const root = new URL('../../../scripts/db/official-truth-at-stage3/', import.meta.url)
const read = (name: string) => readFileSync(new URL(name, root), 'utf8')
const pkg = buildPackage()
const stage2 = readFileSync(new URL('../../../scripts/db/official-truth-at-stage2/renewal-core.CANDIDATE.sql', import.meta.url), 'utf8')
  + readFileSync(new URL('../../../scripts/db/official-truth-at-stage2/public-wrapper.CANDIDATE.sql', import.meta.url), 'utf8')

test('the Stage 3 package is one UNAPPLIED transaction and keeps the V6 parent pins', () => {
  assert.equal(read('production-stage3.PACKAGE-BODY.sql'), pkg.body)
  assert.equal(read('production-stage3.ROLLBACK-PROBE.sql'), pkg.probe)
  assert.equal(read('production-stage3.COMMIT-CANDIDATE.sql'), pkg.commit)
  assert.equal(read('production-stage3.WITHDRAWAL.sql'), pkg.withdrawal)
  assert.equal(read('production-stage3.WITHDRAWAL-REHEARSAL.sql'), pkg.withdrawalRehearsal)
  assert.equal(read('production-read-only-preflight.sql'), pkg.preflight)
  assert.equal(read('production-post-commit-readback.sql'), pkg.readback)
  assert.ok(pkg.body.includes(read('renewal-overlay.sql').trim()))
  assert.equal(JSON.parse(read('PACKAGE-MANIFEST.json')).files.map((file: { sha256: string }) => file.sha256).join(','),
    manifestFor(pkg).files.map(file => file.sha256).join(','))
  assert.doesNotMatch(pkg.body, /\nCOMMIT\s*;/i)
  assert.match(pkg.probe, /\nROLLBACK;\n/)
  assert.match(pkg.commit, /\nCOMMIT;\s*$/)
  assert.doesNotMatch(pkg.body, /CREATE OR REPLACE FUNCTION official_v3_guard_private\.catalog_status_v1/)
  assert.match(pkg.body, /aaf93dcd12350720cac4ce76e557043908760034d353851e9de6c6094bea3086/)
  assert.match(pkg.body, /renew_ch_v1\(\)/)
  assert.match(pkg.body, /jetnity-ch-de-prod-import-v1/)
  assert.match(pkg.body, /bg1_prod_ch_at_source_rollback_v7/)
  assert.doesNotMatch(pkg.body, /CREATE TABLE official_v3_guard_private\.bg1_prod_ch_at_source_rollback_v7/)
  assert.match(pkg.body, /AT_STAGE3_V6_CATALOG_DIGEST_REQUIRES_FRESH_READBACK/)
  assert.match(pkg.body, /batch_qualified_ch_v3\(p_batch\)/)
  assert.doesNotMatch(pkg.body + pkg.withdrawal, /cron\.schedule|cron\.alter_job|GRANT EXECUTE/i)
  assert.doesNotMatch(pkg.body, /JETNITY_OFFICIAL_AT_PRODUCTION_VISITOR_V1=enabled/)
  assert.ok(pkg.body.includes(stage2.slice(0, 80)))
  const server = readFileSync(new URL('./at-visitor-release-server.ts', import.meta.url), 'utf8')
  assert.match(server, /const APPROVED_COPY: AtApprovedVisitorCopy \| null = null/)
  const manifest = JSON.parse(read('PACKAGE-MANIFEST.json'))
  assert.equal(manifest.status, 'UNAPPLIED')
  assert.equal(manifest.productionExecution, 'NOT_RUN')
  assert.equal(manifest.freshProductionReadback, 'OPEN_PO_GATE')
  assert.equal(manifest.v7EmergencyMarker, 'RESERVED_ABSENT')
  for (const file of manifest.files) {
    assert.equal(createHash('sha256').update(read(file.name)).digest('hex'), file.sha256)
  }
})
