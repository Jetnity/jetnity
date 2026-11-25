import assert from 'node:assert/strict'
import { execFileSync } from 'node:child_process'
import { readFileSync } from 'node:fs'
import { test } from 'node:test'
import { findLocalPgBins, startLocalProofCluster } from '../../../scripts/db/official-truth-integrated-pilot-1/local-cluster'

const root = new URL('../../../scripts/db/official-truth-at-stage2/', import.meta.url)
const stage1 = new URL('../../../scripts/db/official-truth-at-source-v3/', import.meta.url)
const read = (name: string, dir = root) => readFileSync(new URL(name, dir), 'utf8')
const core = read('renewal-core.CANDIDATE.sql')
const wrapper = read('public-wrapper.CANDIDATE.sql')
const source = read('production-stufe1.candidate.sql', stage1)
const start = source.indexOf('CREATE FUNCTION official_v3_at_production_private.batch_qualified_ch_v3(')
const stop = source.indexOf('END $verified$;', start) + 'END $verified$;'.length
assert.ok(start >= 0 && stop > start)
const gate = source.slice(start, stop)
const comparator = read('bmeia-theme-assets-v3.function.sql', stage1)
function fixtureSql(owner: string) {
  assert.match(owner, /^[a-z_][a-z0-9_]*$/)
  return [read('fixture-before.sql'), comparator, gate, core, wrapper, read('fixture-after.sql')].join('\n')
    .replaceAll('official_v3_at_production_private', 'at_stage2_fixture_at')
    .replaceAll('official_v3_guard_private', 'at_stage2_fixture_guard')
    .replaceAll('official_v3_method_private', 'at_stage2_fixture_method')
    .replaceAll('public.official_v3_guard_alarm_status_v1', 'at_stage2_fixture_api.official_v3_guard_alarm_status_v1')
    .replaceAll('public.jetnity_source_bound_at_visa_v1', 'at_stage2_fixture_api.jetnity_source_bound_at_visa_v1')
    .replace(/\bpostgres\b/g, owner)
}

test('AT Stage2 modules cannot install or renew automatically and do not rewrite V1/V2 or research pins', () => {
  assert.match(core, /AT_STAGE2_STANDALONE_INSTALL_FORBIDDEN/)
  assert.match(core, /ch_renewal_go_v3/)
  assert.match(core, /ch_visa_publication_v3/)
  assert.match(core, /batch_qualified_ch_v3\(p_batch\)/)
  assert.match(core, /FORCE ROW LEVEL SECURITY/)
  assert.match(core, /require_open_v1\(\)/)
  assert.match(core, /assert_catalog_v1\(\)/)
  assert.match(wrapper, /read_published_ch_v3/)
  assert.doesNotMatch(core + wrapper, /^\s*COMMIT\s*;/mi)
  assert.doesNotMatch(core + wrapper, /cron\.schedule|cron\.alter_job|GRANT EXECUTE|SETVAL\s*\(/i)
  assert.doesNotMatch(core + wrapper, /INSERT INTO official_v3_at_production_private\.ch_visa_facts_v[12]|UPDATE official_v3_at_production_private\.ch_source_/i)
  assert.doesNotMatch(core + wrapper, /JETNITY_OFFICIAL_AT_PRODUCTION_VISITOR_V1=enabled/)
})

test('native isolated AT V3 renewal, separate publication, expiry, conflicts, guard failure, ACL and rollback', { timeout: 120_000 }, () => {
  const cluster = startLocalProofCluster()
  try {
    const bins = findLocalPgBins()
    assert.ok(bins)
    const sql = fixtureSql(cluster.user)
    assert.doesNotMatch(sql, /official_v3_at_production_private\.|official_v3_guard_private\.|official_v3_method_private\.|public\.jetnity_source_bound_at_visa_v1/)
    const result = execFileSync(bins.psql, ['-X', '--no-psqlrc', '-h', cluster.socket, '-p', String(cluster.port),
      '-U', cluster.user, '-d', cluster.database, '-v', 'ON_ERROR_STOP=1'], {
        input: sql, encoding: 'utf8', timeout: 65_000, maxBuffer: 1_048_576,
      })
    assert.match(result, /AT_STAGE2_NATIVE_SYNTHETIC_PASS/)
    assert.match(result, /AT_STAGE2_ROLLBACK_PASS/)
  } finally { cluster.stop() }
})
