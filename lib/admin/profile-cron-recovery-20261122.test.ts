import assert from 'node:assert/strict'
import { readFileSync } from 'node:fs'
import { test } from 'node:test'
import { composeProfileCronOperation, rollbackAcknowledgement } from '../../scripts/db/profile-cron-recovery-20261122/package.mjs'

const beforeDigest = 'a'.repeat(64)
const target = 'production:qscbgcdmivbbnzrcyegn:PROFILE-CRON1'
const source = readFileSync('scripts/db/profile-cron-recovery-20261122/transition.sql', 'utf8')

test('profile Cron operation binds reviewed SQL to one SERIALIZABLE transaction and validated input', () => {
  const sql = composeProfileCronOperation({ action: 'deactivate', target, beforeDigest })
  assert.equal(sql, 'BEGIN ISOLATION LEVEL SERIALIZABLE;\n'
    + `SET LOCAL jetnity.profile_cron_target = '${target}';\n`
    + "SET LOCAL jetnity.profile_cron_action = 'deactivate';\n"
    + `SET LOCAL jetnity.profile_cron_before_sha256 = '${beforeDigest}';\n`
    + source + '\nCOMMIT;\n')
  for (const changes of [
    { target: 'production:another-project:PROFILE-CRON1' },
    { target: 'development:yfvbxvijcorffwxbxahl:PROFILE-CRON1' },
    { target: target + "'; SELECT 1; --" },
    { beforeDigest: 'a'.repeat(63) }, { beforeDigest: beforeDigest + "'; SELECT 1; --" },
    { beforeDigest: beforeDigest.toUpperCase() }, { action: 'unschedule' }, { commit: 'true' },
    { rollbackAck: rollbackAcknowledgement },
  ]) assert.throws(() => composeProfileCronOperation({ action: 'deactivate', target, beforeDigest, ...changes }), /profile_cron_/)
})

test('reactivation needs an explicit acknowledgement and never gains an implicit retry', () => {
  assert.throws(() => composeProfileCronOperation({ action: 'rollback', target, beforeDigest }), /rollback_reactivates_broken_job/)
  const sql = composeProfileCronOperation({ action: 'rollback', target, beforeDigest,
    rollbackAck: rollbackAcknowledgement, commit: false })
  assert.match(sql, /SET LOCAL jetnity\.profile_cron_action = 'rollback'/)
  assert.ok(sql.endsWith('\nROLLBACK;\n'))
  assert.ok(!sql.includes('\nCOMMIT;'))
  assert.equal(sql.split(source).length, 2, 'rollback must use the identical guarded transaction body')
})
