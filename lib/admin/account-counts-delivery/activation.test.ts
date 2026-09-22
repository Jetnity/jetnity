import assert from 'node:assert/strict'
import { describe, test } from 'node:test'

import {
  ADMIN_ACCOUNT_COUNTS_MODULE_SUPABASE_URL,
  adminAccountCountsActivationEnvFromProcess,
  isAdminAccountCountsLocallyEnabled,
  isAdminAccountCountsRuntimeEnabled,
  isLoopbackSupabaseUrl,
  type AdminAccountCountsActivationEnv,
} from '@/lib/admin/account-counts-delivery/activation'

const LOCAL: AdminAccountCountsActivationEnv = {
  NODE_ENV: 'test',
  JETNITY_ADMIN_ACCOUNT_COUNTS_LOCAL_ENABLED: 'true',
  NEXT_PUBLIC_SUPABASE_URL: 'http://127.0.0.1:54321',
}

describe('Admin account-counts local activation', () => {
  test('is disabled by default and on missing/unknown configuration', () => {
    assert.equal(isAdminAccountCountsLocallyEnabled({}), false)
    assert.equal(
      isAdminAccountCountsLocallyEnabled({
        ...LOCAL,
        JETNITY_ADMIN_ACCOUNT_COUNTS_LOCAL_ENABLED: undefined,
      }),
      false,
    )
    assert.equal(
      isAdminAccountCountsLocallyEnabled({
        ...LOCAL,
        JETNITY_ADMIN_ACCOUNT_COUNTS_LOCAL_ENABLED: 'TRUE',
      }),
      false,
    )
    assert.equal(
      isAdminAccountCountsLocallyEnabled({
        ...LOCAL,
        JETNITY_ADMIN_ACCOUNT_COUNTS_LOCAL_ENABLED: '1',
      }),
      false,
    )
    assert.equal(
      isAdminAccountCountsLocallyEnabled({
        ...LOCAL,
        NODE_ENV: undefined,
      }),
      false,
    )
    assert.equal(
      isAdminAccountCountsLocallyEnabled({
        ...LOCAL,
        NODE_ENV: 'production',
      }),
      false,
    )
  })

  test('hosted Production/Preview/Vercel/CI stay disabled even with the local flag', () => {
    for (const hosted of [
      { VERCEL: '1' },
      { VERCEL_ENV: 'production' },
      { VERCEL_ENV: 'preview' },
      { VERCEL_ENV: 'development' },
      { VERCEL_URL: 'jetnity-app.vercel.app' },
      { VERCEL_REGION: 'fra1' },
      { VERCEL_DEPLOYMENT_ID: 'dpl_test' },
      { CI: 'true' },
      { GITHUB_ACTIONS: 'true' },
    ] satisfies Array<Partial<AdminAccountCountsActivationEnv>>) {
      assert.equal(isAdminAccountCountsLocallyEnabled({ ...LOCAL, ...hosted }), false, JSON.stringify(hosted))
    }
  })

  test('remote or malformed Supabase URLs never enable the path', () => {
    for (const url of [
      undefined,
      '',
      'https://abcdefgh.supabase.co',
      'http://192.168.1.10:54321',
      'http://0.0.0.0:54321',
      'http://127.0.0.1.evil.example:54321',
      'http://user:secret@127.0.0.1:54321',
      'not-a-url',
      'file://127.0.0.1/db',
    ]) {
      assert.equal(isLoopbackSupabaseUrl(url), false, String(url))
      assert.equal(
        isAdminAccountCountsLocallyEnabled({ ...LOCAL, NEXT_PUBLIC_SUPABASE_URL: url }),
        false,
        String(url),
      )
    }
  })

  test('only exact local development/test + loopback URL + flag=true enables the pure evaluator', () => {
    assert.equal(isAdminAccountCountsLocallyEnabled(LOCAL), true)
    assert.equal(
      isAdminAccountCountsLocallyEnabled({
        ...LOCAL,
        NODE_ENV: 'development',
        NEXT_PUBLIC_SUPABASE_URL: 'http://localhost:54321',
      }),
      true,
    )
    assert.equal(isLoopbackSupabaseUrl('http://[::1]:54321'), true)
    assert.equal(isLoopbackSupabaseUrl('https://127.0.0.1:8443'), true)
  })

  test('process snapshot helper reads the current environment without enabling the loader', () => {
    const snapshot = adminAccountCountsActivationEnvFromProcess()
    assert.equal(snapshot.NODE_ENV, process.env.NODE_ENV)
    assert.equal(isAdminAccountCountsLocallyEnabled(snapshot) && !isLoopbackSupabaseUrl(snapshot.NEXT_PUBLIC_SUPABASE_URL), false)
  })

  test('runtime enablement stays off when the module-captured URL is not loopback', () => {
    const previousFlag = process.env.JETNITY_ADMIN_ACCOUNT_COUNTS_LOCAL_ENABLED
    const previousUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
    const previousVercel = process.env.VERCEL
    try {
      process.env.JETNITY_ADMIN_ACCOUNT_COUNTS_LOCAL_ENABLED = 'true'
      process.env.NEXT_PUBLIC_SUPABASE_URL = 'http://127.0.0.1:54321'
      delete process.env.VERCEL
      const laterProcessLooksLocal = isAdminAccountCountsLocallyEnabled({
        NODE_ENV: 'test',
        JETNITY_ADMIN_ACCOUNT_COUNTS_LOCAL_ENABLED: 'true',
        NEXT_PUBLIC_SUPABASE_URL: 'http://127.0.0.1:54321',
      })
      assert.equal(laterProcessLooksLocal, true)
      if (!isLoopbackSupabaseUrl(ADMIN_ACCOUNT_COUNTS_MODULE_SUPABASE_URL)) {
        assert.equal(isAdminAccountCountsRuntimeEnabled(), false)
      }
    } finally {
      if (previousFlag === undefined) delete process.env.JETNITY_ADMIN_ACCOUNT_COUNTS_LOCAL_ENABLED
      else process.env.JETNITY_ADMIN_ACCOUNT_COUNTS_LOCAL_ENABLED = previousFlag
      if (previousUrl === undefined) delete process.env.NEXT_PUBLIC_SUPABASE_URL
      else process.env.NEXT_PUBLIC_SUPABASE_URL = previousUrl
      if (previousVercel === undefined) delete process.env.VERCEL
      else process.env.VERCEL = previousVercel
    }
  })
})
