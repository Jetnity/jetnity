import assert from 'node:assert/strict'
import { readFileSync } from 'node:fs'
import { join } from 'node:path'
import { describe, test } from 'node:test'

import { ADMIN_ACCOUNT_COUNTS_DEFINITION_VERSION } from '@/lib/admin/account-counts-delivery/contract'
import { invokeAdminAccountCountsWrapper, readAdminAccountCounts } from '@/lib/admin/account-counts-delivery/reader'

const VALID_ROW = {
  present_registered_accounts: '4',
  created_in_prior_30_days: '1',
  measured_at: '2026-09-22T12:00:00.000Z',
  window_start: '2026-08-23T12:00:00.000Z',
  definition_version: ADMIN_ACCOUNT_COUNTS_DEFINITION_VERSION,
}

describe('Admin account-counts session reader', () => {
  test('does not invoke the RPC while disabled', async () => {
    let rpcCalls = 0
    let gateCalls = 0
    const result = await readAdminAccountCounts({
      enabled: false,
      gate: async () => {
        gateCalls += 1
        return { allowed: true, grant: 'role' }
      },
      rpc: async () => {
        rpcCalls += 1
        return { data: VALID_ROW, error: null }
      },
    })
    assert.deepEqual(result, { status: 'disabled' })
    assert.equal(rpcCalls, 0)
    assert.equal(gateCalls, 0)
  })

  test('requires a role-backed AAL/capability grant before any count query', async () => {
    let rpcCalls = 0
    const forbidden = await readAdminAccountCounts({
      enabled: true,
      gate: async () => ({ allowed: false }),
      rpc: async () => {
        rpcCalls += 1
        return { data: VALID_ROW, error: null }
      },
    })
    const breakGlass = await readAdminAccountCounts({
      enabled: true,
      gate: async () => ({ allowed: true, grant: 'break-glass' }),
      rpc: async () => {
        rpcCalls += 1
        return { data: VALID_ROW, error: null }
      },
    })
    assert.deepEqual(forbidden, { status: 'forbidden' })
    assert.deepEqual(breakGlass, { status: 'forbidden' })
    assert.equal(rpcCalls, 0)
  })

  test('distinguishes forbidden, missing producer, network failure and valid window 0', async () => {
    const denied = await readAdminAccountCounts({
      enabled: true,
      gate: async () => ({ allowed: true, grant: 'role' }),
      rpc: async () => ({ data: null, error: { code: '42501', message: 'not authorized' } }),
    })
    const missing = await readAdminAccountCounts({
      enabled: true,
      gate: async () => ({ allowed: true, grant: 'role' }),
      rpc: async () => ({ data: null, error: { code: 'PGRST202', message: 'could not find the function' } }),
    })
    const network = await readAdminAccountCounts({
      enabled: true,
      gate: async () => ({ allowed: true, grant: 'role' }),
      rpc: async () => ({ data: null, error: { message: 'fetch failed' }, status: 0 }),
    })
    const thrown = await readAdminAccountCounts({
      enabled: true,
      gate: async () => ({ allowed: true, grant: 'role' }),
      rpc: async () => {
        throw new Error('boom')
      },
    })
    const windowZero = await readAdminAccountCounts({
      enabled: true,
      gate: async () => ({ allowed: true, grant: 'role' }),
      rpc: async () => ({
        data: { ...VALID_ROW, created_in_prior_30_days: '0' },
        error: null,
      }),
    })
    assert.deepEqual(denied, { status: 'forbidden' })
    assert.deepEqual(missing, { status: 'unavailable' })
    assert.deepEqual(network, { status: 'failed' })
    assert.deepEqual(thrown, { status: 'failed' })
    assert.equal(windowZero.status, 'available')
    if (windowZero.status === 'available') {
      assert.equal(windowZero.measures.createdInPrior30Days, '0')
      assert.equal(windowZero.measures.presentRegisteredAccounts, '4')
    }
  })

  test('rejects invalid rows and does not leak a second request into the first result', async () => {
    const invalid = await readAdminAccountCounts({
      enabled: true,
      gate: async () => ({ allowed: true, grant: 'role' }),
      rpc: async () => ({
        data: { ...VALID_ROW, present_registered_accounts: 4 },
        error: null,
      }),
    })
    const first = await readAdminAccountCounts({
      enabled: true,
      gate: async () => ({ allowed: true, grant: 'role' }),
      rpc: async () => ({
        data: { ...VALID_ROW, present_registered_accounts: '9' },
        error: null,
      }),
    })
    const second = await readAdminAccountCounts({
      enabled: true,
      gate: async () => ({ allowed: false }),
      rpc: async () => ({
        data: { ...VALID_ROW, present_registered_accounts: '9' },
        error: null,
      }),
    })
    assert.deepEqual(invalid, { status: 'failed' })
    assert.equal(first.status, 'available')
    if (first.status === 'available') {
      assert.equal(first.measures.presentRegisteredAccounts, '9')
    }
    assert.deepEqual(second, { status: 'forbidden' })
  })

  test('wrapper invoker uses the named constant, not a schema-literal .rpc() call', async () => {
    const seen: string[] = []
    await invokeAdminAccountCountsWrapper({
      rpc: async (name) => {
        seen.push(name)
        return { data: VALID_ROW, error: null }
      },
    })
    assert.deepEqual(seen, ['admin_account_counts_v1'])
    const readerSource = readFileSync(join(process.cwd(), 'lib/admin/account-counts-delivery/reader.ts'), 'utf8')
    const pageSource = readFileSync(join(process.cwd(), 'app/(admin)/admin/page.tsx'), 'utf8')
    const componentSource = readFileSync(
      join(process.cwd(), 'components/admin/home/AdminAccountCounts.tsx'),
      'utf8',
    )
    for (const source of [readerSource, pageSource, componentSource]) {
      assert.doesNotMatch(source, /\.rpc\(\s*['"`]admin_account_counts_v1['"`]/)
      assert.doesNotMatch(source, /service[_-]?role/i)
    }
    assert.match(pageSource, /isAdminAccountCountsLocallyEnabled/)
    assert.match(pageSource, /AdminAccountCounts/)
    assert.match(pageSource, /AdminStatsStrip/)
  })
})
