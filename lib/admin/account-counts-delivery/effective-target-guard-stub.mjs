import { transportState } from './effective-target-recorder.mjs'

export async function evaluateAdminAccess(options = {}) {
  transportState().guard.push(options.capability ?? 'unknown')
  if (process.env.ACCOUNT_COUNTS_HARNESS_GUARD === 'throw') {
    throw new Error('guard exploded')
  }
  if (process.env.ACCOUNT_COUNTS_HARNESS_GUARD === 'deny') {
    return { allowed: false, denial: 'forbidden', user: null }
  }
  return {
    allowed: true,
    grant: 'role',
    role: 'owner',
    user: { id: 'harness-user', email: 'harness@local' },
  }
}
