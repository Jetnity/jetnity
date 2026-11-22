import { readFileSync } from 'node:fs'
import { fileURLToPath } from 'node:url'
import { resolve } from 'node:path'

const targets = new Set([
  'local:owned:PROFILE-CRON1',
  'production:qscbgcdmivbbnzrcyegn:PROFILE-CRON1',
])
const transition = readFileSync(new URL('./transition.sql', import.meta.url), 'utf8')
export const rollbackAcknowledgement = 'REACTIVATES_THE_MISSING_FUNCTION_JOB'

/**
 * Build one explicit transaction. This helper neither connects nor executes SQL.
 * @param {{ action: unknown, target: unknown, beforeDigest: unknown, rollbackAck?: unknown, commit?: unknown }} input
 */
export function composeProfileCronOperation({ action, target, beforeDigest, rollbackAck, commit = true }) {
  if (!['deactivate', 'rollback'].includes(action) || !targets.has(target)
    || typeof beforeDigest !== 'string' || !/^[0-9a-f]{64}$/.test(beforeDigest)
    || typeof commit !== 'boolean') throw new Error('profile_cron_invalid_operation_input')
  if (action === 'rollback' && rollbackAck !== rollbackAcknowledgement)
    throw new Error('profile_cron_rollback_reactivates_broken_job')
  if (action === 'deactivate' && rollbackAck !== undefined)
    throw new Error('profile_cron_deactivation_has_no_rollback_ack')
  return 'BEGIN ISOLATION LEVEL SERIALIZABLE;\n'
    + `SET LOCAL jetnity.profile_cron_target = '${target}';\n`
    + `SET LOCAL jetnity.profile_cron_action = '${action}';\n`
    + `SET LOCAL jetnity.profile_cron_before_sha256 = '${beforeDigest}';\n`
    + (action === 'rollback' ? `SET LOCAL jetnity.profile_cron_rollback_ack = '${rollbackAcknowledgement}';\n` : '')
    + transition + (commit ? '\nCOMMIT;\n' : '\nROLLBACK;\n')
}

if (process.argv[1] && resolve(process.argv[1]) === fileURLToPath(import.meta.url)) {
  const [action, target, beforeDigest, rollbackAck, ...extra] = process.argv.slice(2)
  if (extra.length) throw new Error('profile_cron_unexpected_arguments')
  process.stdout.write(composeProfileCronOperation({ action, target, beforeDigest, rollbackAck }))
}
