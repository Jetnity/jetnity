import assert from 'node:assert/strict'
import { readFileSync } from 'node:fs'
import { join } from 'node:path'
import { describe, test } from 'node:test'

import {
  ADMIN_ACCOUNT_COUNTS_DEFINITION_VERSION,
  ADMIN_ACCOUNT_COUNTS_WRAPPER_RPC,
} from '@/lib/admin/account-counts-delivery/contract'
import {
  classifyAdminAccountCountsRpcError,
  containAdminAccountCountsLoad,
  invokeAdminAccountCountsWrapper,
  loadAdminAccountCounts,
  loadAdminAccountCountsFromDependencies,
  mapAdminAccessToAccountCountsDecision,
  readAdminAccountCounts,
} from '@/lib/admin/account-counts-delivery/reader'

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
      gate: async () => ({ allowed: false, kind: 'forbidden' }),
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

  test('propagates lookup failures as failed and genuine denials as forbidden', async () => {
    assert.deepEqual(
      mapAdminAccessToAccountCountsDecision({ allowed: false, denial: 'lookup-failed' }),
      { allowed: false, kind: 'failed' },
    )
    assert.deepEqual(
      mapAdminAccessToAccountCountsDecision({ allowed: false, denial: 'aal-lookup-failed' }),
      { allowed: false, kind: 'failed' },
    )
    assert.deepEqual(
      mapAdminAccessToAccountCountsDecision({ allowed: false, denial: 'forbidden' }),
      { allowed: false, kind: 'forbidden' },
    )
    assert.deepEqual(
      mapAdminAccessToAccountCountsDecision({ allowed: false, denial: 'aal2-required' }),
      { allowed: false, kind: 'forbidden' },
    )
    assert.deepEqual(
      mapAdminAccessToAccountCountsDecision({
        allowed: true,
        grant: 'role',
        role: 'moderator',
      }),
      { allowed: true, grant: 'role' },
    )

    const lookupFailed = await readAdminAccountCounts({
      enabled: true,
      gate: async () => ({ allowed: false, kind: 'failed' }),
      rpc: async () => ({ data: VALID_ROW, error: null }),
    })
    const gateThrown = await readAdminAccountCounts({
      enabled: true,
      gate: async () => {
        throw new Error('guard exploded')
      },
      rpc: async () => ({ data: VALID_ROW, error: null }),
    })
    assert.deepEqual(lookupFailed, { status: 'failed' })
    assert.deepEqual(gateThrown, { status: 'failed' })
  })

  test('classifies missing producer by structured codes only and does not infer from message text', async () => {
    assert.equal(classifyAdminAccountCountsRpcError({ code: 'PGRST202' }), 'unavailable')
    assert.equal(classifyAdminAccountCountsRpcError({ code: '42883' }), 'unavailable')
    assert.equal(
      classifyAdminAccountCountsRpcError({
        code: '42P01',
        message: 'relation "test_table" does not exist',
      }),
      'failed',
    )
    assert.equal(
      classifyAdminAccountCountsRpcError({
        message: 'could not find the function',
      }),
      'failed',
    )
    assert.equal(classifyAdminAccountCountsRpcError({ code: '42501' }), 'forbidden')
    assert.equal(classifyAdminAccountCountsRpcError({ message: 'fetch failed' }, 0), 'failed')
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
    const brokenRelation = await readAdminAccountCounts({
      enabled: true,
      gate: async () => ({ allowed: true, grant: 'role' }),
      rpc: async () => ({
        data: null,
        error: { code: '42P01', message: 'relation "test_table" does not exist' },
      }),
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
    assert.deepEqual(brokenRelation, { status: 'failed' })
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
      gate: async () => ({ allowed: false, kind: 'forbidden' }),
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

  test('exported loader stays disabled for production/hosted/remote process snapshots', async () => {
    const previous = {
      NODE_ENV: process.env.NODE_ENV,
      FLAG: process.env.JETNITY_ADMIN_ACCOUNT_COUNTS_LOCAL_ENABLED,
      URL: process.env.NEXT_PUBLIC_SUPABASE_URL,
      VERCEL: process.env.VERCEL,
      CI: process.env.CI,
    }
    const env = process.env as { NODE_ENV?: string }
    try {
      env.NODE_ENV = 'production'
      process.env.VERCEL = '1'
      process.env.JETNITY_ADMIN_ACCOUNT_COUNTS_LOCAL_ENABLED = 'true'
      process.env.NEXT_PUBLIC_SUPABASE_URL = 'https://test-only-remote.invalid'
      assert.deepEqual(await loadAdminAccountCounts(), { status: 'disabled' })

      env.NODE_ENV = 'test'
      delete process.env.VERCEL
      process.env.NEXT_PUBLIC_SUPABASE_URL = 'https://test-only-remote.invalid'
      assert.deepEqual(await loadAdminAccountCounts(), { status: 'disabled' })

      delete process.env.JETNITY_ADMIN_ACCOUNT_COUNTS_LOCAL_ENABLED
      delete process.env.VERCEL
      assert.deepEqual(await loadAdminAccountCounts(), { status: 'disabled' })
    } finally {
      env.NODE_ENV = previous.NODE_ENV
      if (previous.FLAG === undefined) delete process.env.JETNITY_ADMIN_ACCOUNT_COUNTS_LOCAL_ENABLED
      else process.env.JETNITY_ADMIN_ACCOUNT_COUNTS_LOCAL_ENABLED = previous.FLAG
      if (previous.URL === undefined) delete process.env.NEXT_PUBLIC_SUPABASE_URL
      else process.env.NEXT_PUBLIC_SUPABASE_URL = previous.URL
      if (previous.VERCEL === undefined) delete process.env.VERCEL
      else process.env.VERCEL = previous.VERCEL
      if (previous.CI === undefined) delete process.env.CI
      else process.env.CI = previous.CI
    }
  })

  test('exported loader ignores a synthetic environment and stays default-off with zero dependency calls', async () => {
    assert.equal(loadAdminAccountCounts.length, 0)
    let gateCalls = 0
    let rpcCalls = 0
    const synthetic = {
      NODE_ENV: 'test',
      JETNITY_ADMIN_ACCOUNT_COUNTS_LOCAL_ENABLED: 'true',
      NEXT_PUBLIC_SUPABASE_URL: 'http://127.0.0.1:54321',
    }
    const ignored = await (loadAdminAccountCounts as unknown as (env: unknown) => ReturnType<
      typeof loadAdminAccountCounts
    >)(synthetic)
    const fromDeps = await loadAdminAccountCountsFromDependencies({
      runtimeEnabled: false,
      gate: async () => {
        gateCalls += 1
        return { allowed: true, grant: 'role' }
      },
      rpc: async () => {
        rpcCalls += 1
        return { data: VALID_ROW, error: null }
      },
    })
    const productionLike = await loadAdminAccountCountsFromDependencies({
      runtimeEnabled: false,
      gate: async () => {
        gateCalls += 1
        return { allowed: true, grant: 'role' }
      },
      rpc: async () => {
        rpcCalls += 1
        return { data: VALID_ROW, error: null }
      },
    })
    assert.deepEqual(ignored, { status: 'disabled' })
    assert.deepEqual(fromDeps, { status: 'disabled' })
    assert.deepEqual(productionLike, { status: 'disabled' })
    assert.equal(gateCalls, 0)
    assert.equal(rpcCalls, 0)
  })

  test('actual loader wiring covers role-backed AAL2, break-glass, factory failure and containment', async () => {
    const roleOk = await loadAdminAccountCountsFromDependencies({
      runtimeEnabled: true,
      gate: async () => ({ allowed: true, grant: 'role' }),
      rpc: async () => ({ data: VALID_ROW, error: null }),
    })
    const breakGlass = await loadAdminAccountCountsFromDependencies({
      runtimeEnabled: true,
      gate: async () => ({ allowed: true, grant: 'break-glass' }),
      rpc: async () => ({ data: VALID_ROW, error: null }),
    })
    const factoryFail = await loadAdminAccountCountsFromDependencies({
      runtimeEnabled: true,
      gate: async () => ({ allowed: true, grant: 'role' }),
      rpc: async () => {
        throw new Error('client factory failed')
      },
    })
    const contained = await containAdminAccountCountsLoad(async () => {
      throw new Error('loader exploded')
    })
    assert.equal(roleOk.status, 'available')
    assert.deepEqual(breakGlass, { status: 'forbidden' })
    assert.deepEqual(factoryFail, { status: 'failed' })
    assert.deepEqual(contained, { status: 'failed' })
  })

  test('wrapper invoker uses a scanner-visible literal and does not claim generated-schema coverage', async () => {
    const seen: string[] = []
    await invokeAdminAccountCountsWrapper({
      rpc: async (name) => {
        seen.push(name)
        return { data: VALID_ROW, error: null }
      },
    })
    assert.deepEqual(seen, [ADMIN_ACCOUNT_COUNTS_WRAPPER_RPC])
    assert.equal(ADMIN_ACCOUNT_COUNTS_WRAPPER_RPC, 'admin_account_counts_v1')
    const readerSource = readFileSync(join(process.cwd(), 'lib/admin/account-counts-delivery/reader.ts'), 'utf8')
    assert.match(readerSource, /\.rpc\(\s*['"`]admin_account_counts_v1['"`]/)
    const pageSource = readFileSync(join(process.cwd(), 'app/(admin)/admin/page.tsx'), 'utf8')
    const componentSource = readFileSync(
      join(process.cwd(), 'components/admin/home/AdminAccountCounts.tsx'),
      'utf8',
    )
    for (const source of [readerSource, pageSource, componentSource]) {
      assert.doesNotMatch(source, /service[_-]?role/i)
    }
    assert.match(pageSource, /isAdminAccountCountsRuntimeEnabled/)
    assert.match(pageSource, /AdminAccountCounts/)
    assert.match(pageSource, /AdminStatsStrip/)
    assert.match(componentSource, /containAdminAccountCountsLoad/)
  })
})
