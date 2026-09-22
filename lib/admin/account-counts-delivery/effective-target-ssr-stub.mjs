import { transportState } from './effective-target-recorder.mjs'

export function createServerClient(url, key) {
  transportState().create.push({
    url,
    keyPresent: typeof key === 'string' && key.length > 0,
  })
  return {
    rpc: async (name) => {
      transportState().rpc.push(name)
      return {
        data: {
          present_registered_accounts: '4',
          created_in_prior_30_days: '1',
          measured_at: '2026-09-22T12:00:00.000Z',
          window_start: '2026-08-23T12:00:00.000Z',
          definition_version: 'jetnity.admin-account-counts.v1',
        },
        error: null,
      }
    },
  }
}
