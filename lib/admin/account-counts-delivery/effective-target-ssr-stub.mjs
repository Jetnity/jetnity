import { transportState } from './effective-target-recorder.mjs'

const HARNESS_OWN_USER_ID = 'harness-user'

function createOwnStatusQuery(table) {
  let columns = null
  let eqColumn = null
  let eqValue = null

  return {
    select(nextColumns) {
      columns = nextColumns
      return this
    },
    eq(column, value) {
      eqColumn = column
      eqValue = value
      return this
    },
    async maybeSingle() {
      if (table !== 'profiles' || columns !== 'status' || eqColumn !== 'user_id') {
        return { data: null, error: { message: 'unsupported lookup' } }
      }
      if (eqValue !== HARNESS_OWN_USER_ID) {
        return { data: null, error: null }
      }
      return { data: { status: 'active' }, error: null }
    },
  }
}

export function createServerClient(url, key) {
  transportState().create.push({
    url,
    keyPresent: typeof key === 'string' && key.length > 0,
  })
  return {
    from(table) {
      return createOwnStatusQuery(table)
    },
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
