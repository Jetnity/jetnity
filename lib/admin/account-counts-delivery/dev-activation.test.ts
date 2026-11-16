import assert from 'node:assert/strict'
import { describe, test } from 'node:test'
import { spawnSync } from 'node:child_process'
import {
  ADMIN_ACCOUNT_COUNTS_DEV_BRANCH,
  ADMIN_ACCOUNT_COUNTS_DEV_URL,
  ADMIN_ACCOUNT_COUNTS_VERCEL_PROJECT,
  isAdminAccountCountsDevEnabled,
  type AdminAccountCountsDevEnv,
} from './dev-activation'

const DEV: AdminAccountCountsDevEnv = {
  NODE_ENV: 'production', VERCEL: '1', VERCEL_ENV: 'preview',
  VERCEL_GIT_COMMIT_REF: ADMIN_ACCOUNT_COUNTS_DEV_BRANCH,
  VERCEL_PROJECT_ID: ADMIN_ACCOUNT_COUNTS_VERCEL_PROJECT,
  NEXT_PUBLIC_SUPABASE_URL: ADMIN_ACCOUNT_COUNTS_DEV_URL,
  JETNITY_ADMIN_ACCOUNT_COUNTS_DEV_ENABLED: 'true',
}

describe('isolated Dev account-count activation', () => {
  test('requires the exact approved preview and both equal Dev targets', () => {
    assert.equal(isAdminAccountCountsDevEnabled(DEV, ADMIN_ACCOUNT_COUNTS_DEV_URL), true)
    assert.equal(isAdminAccountCountsDevEnabled({ ...DEV, VERCEL_TARGET_ENV: 'preview' }, ADMIN_ACCOUNT_COUNTS_DEV_URL), true)
    assert.equal(isAdminAccountCountsDevEnabled({}, ADMIN_ACCOUNT_COUNTS_DEV_URL), false)
    for (const patch of [
      { JETNITY_ADMIN_ACCOUNT_COUNTS_DEV_ENABLED: undefined },
      { JETNITY_ADMIN_ACCOUNT_COUNTS_DEV_ENABLED: 'TRUE' },
      { JETNITY_ADMIN_ACCOUNT_COUNTS_DEV_ENABLED: '1' },
      { NODE_ENV: 'test' }, { NODE_ENV: 'development' }, { NODE_ENV: undefined },
      { VERCEL: undefined }, { VERCEL: 'true' },
      { VERCEL_ENV: 'production' }, { VERCEL_ENV: 'development' }, { VERCEL_ENV: undefined },
      { VERCEL_TARGET_ENV: 'production' }, { VERCEL_TARGET_ENV: 'unknown' },
      { VERCEL_GIT_COMMIT_REF: 'main' }, { VERCEL_GIT_COMMIT_REF: undefined },
      { VERCEL_PROJECT_ID: undefined }, { VERCEL_PROJECT_ID: 'prj_unreviewed' },
    ] satisfies Partial<AdminAccountCountsDevEnv>[]) {
      assert.equal(isAdminAccountCountsDevEnabled({ ...DEV, ...patch }, ADMIN_ACCOUNT_COUNTS_DEV_URL), false, JSON.stringify(patch))
    }
  })

  test('rejects production, credentials, aliases and mismatched captured/current URLs', () => {
    for (const target of [
      undefined, '', 'https://qscbgcdmivbbnzrcyegn.supabase.co',
      'https://synthetic-remote.invalid', 'http://127.0.0.1:54321',
      `${ADMIN_ACCOUNT_COUNTS_DEV_URL}/`, `${ADMIN_ACCOUNT_COUNTS_DEV_URL}?x=1`,
      `${ADMIN_ACCOUNT_COUNTS_DEV_URL}#x`, `${ADMIN_ACCOUNT_COUNTS_DEV_URL}:443`,
      ADMIN_ACCOUNT_COUNTS_DEV_URL.replace('https:', 'http:'),
      ADMIN_ACCOUNT_COUNTS_DEV_URL.replace('https://', 'https://user:secret@'),
      `${ADMIN_ACCOUNT_COUNTS_DEV_URL}.invalid`, ` ${ADMIN_ACCOUNT_COUNTS_DEV_URL}`,
    ]) {
      assert.equal(isAdminAccountCountsDevEnabled({ ...DEV, NEXT_PUBLIC_SUPABASE_URL: target }, ADMIN_ACCOUNT_COUNTS_DEV_URL), false, String(target))
      assert.equal(isAdminAccountCountsDevEnabled(DEV, target), false, String(target))
    }
  })
})

type Transport = { create: { url: string }[]; rpc: string[]; guard: string[]; cookies: number }
type Result = { status: string; sharedUrl: string; processUrl: string; transport: Transport }

function run(mode: string): Result {
  const result = spawnSync(process.execPath, [
    '--import', './scripts/server-only-test-register.mjs',
    '--import', './lib/admin/account-counts-delivery/effective-target-preload.mjs',
    '--import', 'tsx', './lib/admin/account-counts-delivery/effective-target-harness.ts',
  ], { cwd: process.cwd(), encoding: 'utf8', env: { ...process.env, ACCOUNT_COUNTS_HARNESS_MODE: mode,
    ACCOUNT_COUNTS_HARNESS_GUARD: '', ACCOUNT_COUNTS_HARNESS_CALLER_STATUS: 'active' } })
  assert.equal(result.status, 0, `${mode}: ${result.stderr}\n${result.stdout}`)
  return JSON.parse(result.stdout.trim())
}

describe('Dev activation through the actual captured-client loader, synthetic transport', () => {
  test('uses only the approved Dev target and the existing guard, own status and wrapper', () => {
    const result = run('dev-positive')
    assert.equal(result.status, 'available')
    assert.equal(result.sharedUrl, ADMIN_ACCOUNT_COUNTS_DEV_URL)
    assert.deepEqual(result.transport.guard, ['konten-verwalten'])
    assert.deepEqual(result.transport.rpc, ['admin_account_counts_v1'])
    assert.deepEqual(result.transport.create.map(row => row.url), [ADMIN_ACCOUNT_COUNTS_DEV_URL, ADMIN_ACCOUNT_COUNTS_DEV_URL])
    assert.equal(result.transport.cookies, 2)
  })
  for (const mode of ['dev-captured-other', 'dev-process-other', 'dev-production', 'dev-default-off', 'dev-other-branch', 'dev-other-project', 'dev-missing-project']) {
    test(`${mode} never reaches guard, cookies, client creation or RPC`, () => {
      const result = run(mode)
      assert.equal(result.status, 'disabled')
      assert.deepEqual(result.transport, { create: [], rpc: [], guard: [], cookies: 0 })
    })
  }
  test('Dev activation cannot bypass the access guard', () => {
    const result = run('dev-guard-denied')
    assert.equal(result.status, 'forbidden')
    assert.deepEqual(result.transport.guard, ['konten-verwalten'])
    assert.deepEqual(result.transport.create, [])
    assert.deepEqual(result.transport.rpc, [])
  })
  test('a banned own profile stops before the count RPC', () => {
    const result = run('dev-banned-caller')
    assert.equal(result.status, 'forbidden')
    assert.equal(result.transport.create.length, 1)
    assert.deepEqual(result.transport.rpc, [])
  })
})
