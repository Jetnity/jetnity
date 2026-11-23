import assert from 'node:assert/strict'
import { readFileSync } from 'node:fs'
import { test } from 'node:test'

const root=new URL('../../../scripts/db/official-truth-at-bmeia-assets-dev-1/',import.meta.url)
const rollback=readFileSync(new URL('v13.DEV-ROLLBACK.sql',root),'utf8')
const candidate=readFileSync(new URL('v13.DEV-INSTALL-COMMIT.sql',root),'utf8')
const comparator=readFileSync(new URL('asset-only-v2.function.sql',root),'utf8')
const native=readFileSync(new URL('native-pg17-rollback.sql',root),'utf8')

test('BMEIA V13 Dev commit and verified transaction rollback have exactly the same installation body',()=>{
 const a=rollback.lastIndexOf('\nROLLBACK;')
 const b=candidate.lastIndexOf('\nCOMMIT;')
 assert.ok(a>0 && b>0)
 assert.equal(rollback.slice(0,a),candidate.slice(0,b))
 assert.match(rollback.slice(a),/^\nROLLBACK;/)
 assert.match(candidate.slice(b),/^\nCOMMIT;/)
 assert.match(candidate,/dev:yfvbxvijcorffwxbxahl:BMEIA-ASSETS-V13/)
 assert.doesNotMatch(candidate,/production:qscbgcdmivbbnzrcyegn/)
})

test('BMEIA V13 is the next immutable BG1 successor, never a silent old V12 overwrite',()=>{
 assert.match(candidate,/bg1_dev_bmeia_assets_v13/)
 assert.match(candidate,/bg1_dev_at_ch_autorenew_v12/)
 assert.match(candidate,/predecessor_catalog_digest/)
 assert.match(candidate,/predecessor_baseline_digest/)
 assert.match(candidate,/comparator_body_sha/)
 assert.match(candidate,/collector_body_sha/)
 assert.match(candidate,/v13.required_generation|bmeia_v13.required_generation/)
 assert.match(candidate,/v13.proof_not_before|bmeia_v13.proof_not_before/)
 assert.match(candidate,/v13.catalog IS DISTINCT FROM official_v3_guard_private.catalog_status_v1\(\)/)
 assert.match(candidate,/CREATE TRIGGER immutable_rows BEFORE UPDATE OR DELETE/)
 assert.match(candidate,/CREATE TRIGGER immutable_truncate BEFORE TRUNCATE/)
 assert.match(candidate,/ENABLE ROW LEVEL SECURITY/)
 assert.match(candidate,/FORCE ROW LEVEL SECURITY/)
 assert.match(candidate,/PERFORM official_v3_guard_private.assert_catalog_v1\(\)/)
 assert.match(candidate,/BMEIA_V13_PREMATURE_GUARD_OPEN/)
 assert.match(candidate,/session_user<>'postgres'/)
 assert.match(candidate,/ROLLBACK|No.*authorize|never authorizes/i)
 assert.doesNotMatch(candidate,/(UPDATE|DELETE FROM|TRUNCATE)\s+official_v3_at_private\.whole_originals_v2/i)
 // Existing collector may make its one-time pending->terminal receipt transition,
 // but can never rewrite completed observations or original/pin history.
 assert.match(candidate,/UPDATE official_v3_at_source_watch_private\.reads_v1/)
 assert.match(candidate,/WHERE batch_id=a\.batch_id AND source_id=a\.source_id AND state='pending'/)
 assert.doesNotMatch(candidate,/(DELETE FROM|TRUNCATE)\s+official_v3_at_source_watch_private\.reads_v1/i)
 assert.doesNotMatch(candidate,/(UPDATE|DELETE FROM|TRUNCATE)\s+official_v3_at_source_watch_private\.(pins_v1|batches_v1)/i)
 assert.doesNotMatch(candidate,/(UPDATE|DELETE FROM|TRUNCATE)\s+official_v3_guard_private\.bg1_dev_at_ch_autorenew_v12/i)
 assert.doesNotMatch(candidate,/GRANT\s+EXECUTE\s+ON\s+FUNCTION\s+.*TO\s+(anon|authenticated|service_role)/i)
})

test('only bounded BMEIA CSS/JS theme asset references are tolerated; an ordinary link remains a negative test',()=>{
 assert.match(comparator,/source_id IS DISTINCT FROM 'bmeia-bern-how-to-apply'/)
 assert.match(comparator,/c1<>4 OR c2<>4 OR s1<>15 OR s2<>15/)
 assert.match(comparator,/reference_normal=observed_normal/)
 assert.match(comparator,/CSS\/\[A-Za-z0-9\._-\]\+/)
 assert.match(comparator,/JS\/\[A-Za-z0-9\._-\]\+/)
 assert.doesNotMatch(comparator,/id-austria|handy-signatur/)
 for(const negative of [
  'changed visible visa text','changed official date','changed table',
  'changed normal link','changed data','changed external script',
  'changed stylesheet tag','added script','other official source',
  'injected inline script','missing content',
 ]) assert.ok(native.includes(negative))
 assert.match(native,/BMEIA_PG17_ROLLBACK_PASS/)
})
