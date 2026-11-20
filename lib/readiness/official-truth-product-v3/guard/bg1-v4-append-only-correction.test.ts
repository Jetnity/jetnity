import assert from 'node:assert/strict'
import {readFileSync} from 'node:fs'
import {test} from 'node:test'
const base='../../../../scripts/db/official-truth-bg1-self-heal-dev-1/'
const dev=readFileSync(new URL(base+'rehearse-v3-to-v4-append-only.ROLLBACK.sql',import.meta.url),'utf8')
const prod=readFileSync(new URL(base+'production-bg1-v4-correction.CANDIDATE-ROLLBACK.sql',import.meta.url),'utf8')
const install=readFileSync(new URL(base+'dev-install-v3-guard-persistent.DEV-COMMIT.sql',import.meta.url),'utf8')
test('v4 native rehearsal appends rather than erases historical v3 and stays rollback-only',()=>{
 assert.ok(dev.trimEnd().endsWith('ROLLBACK;'))
 assert.ok(prod.trimEnd().endsWith('ROLLBACK;'))
 assert.doesNotMatch(prod,/^COMMIT;/m)
 assert.match(dev,/CREATE TABLE official_v3_guard_private\.bg1_transient_correction_baseline_v4/)
 assert.match(prod,/bg1_v4\.predecessor_baseline_digest/)
 assert.match(prod,/bg1_v4\.catalog IS DISTINCT FROM official_v3_guard_private\.catalog_status_v1\(\)/)
 assert.match(prod,/bg1_transient_correction_baseline_v4 FORCE ROW LEVEL SECURITY/)
 assert.match(prod,/BG1_V4_PREDECESSOR_CATALOG_MISMATCH/)
 assert.match(prod,/visitorFailsClosed/)
 assert.match(prod,/oldAuditRestored/)
 assert.match(prod,/at_batch_switch_baseline_v2/)
 assert.doesNotMatch(prod,/source_renewal_baseline_v1/)
 assert.doesNotMatch(prod,/ALTER ROLE|UPDATE official_v3_guard_private\.state_v1 SET resumed_generation/)
})
test('explicit Dev persistence cannot masquerade as Production release, installs one v3 with postchecks',()=>{
 assert.match(install,/DEV-ONLY PERSISTENT INSTALL/)
 assert.match(install,/DEV_BG1_V3_PERSISTENT_INSTALL_PG17_PASS/)
 assert.ok(install.trimEnd().endsWith('COMMIT;'))
 assert.match(install,/public\.official_v3_guard_alarm_status_v1\(\)->>'status'<>'unavailable'/)
 assert.match(install,/bg1_v3\.catalog IS DISTINCT FROM official_v3_guard_private\.catalog_status_v1\(\)/)
})
