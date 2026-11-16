import assert from 'node:assert/strict'
import { test } from 'node:test'
import { ADMIN_DEV_RUNTIME_PROJECT, ADMIN_DEV_RUNTIME_URL } from './dev-runtime-activation'
import { adminProductionRuntimeEnabled } from './hosted-runtime-activation'

const url = 'https://qscbgcdmivbbnzrcyegn.supabase.co'
const allowed = {
  NODE_ENV: 'production', VERCEL: '1', VERCEL_ENV: 'production', VERCEL_TARGET_ENV: 'production',
  VERCEL_GIT_COMMIT_REF: 'main', VERCEL_PROJECT_ID: ADMIN_DEV_RUNTIME_PROJECT,
  NEXT_PUBLIC_SUPABASE_URL: url, JETNITY_ADMIN_PRODUCTION_RUNTIME_ENABLED: 'true',
}

test('Production admission requires its own switch, deployed main and the same Production client', () => {
  assert.equal(adminProductionRuntimeEnabled(allowed, url), true)
  assert.equal(adminProductionRuntimeEnabled({ ...allowed, VERCEL_TARGET_ENV: undefined }, url), true)
  for (const k of Object.keys(allowed)) {
    assert.equal(adminProductionRuntimeEnabled({ ...allowed, [k]: 'wrong' }, url), false, k)
  }
  for (const value of [undefined, '', ADMIN_DEV_RUNTIME_URL, url + '/']) {
    assert.equal(adminProductionRuntimeEnabled(allowed, value), false)
  }
  assert.equal(adminProductionRuntimeEnabled({ ...allowed, VERCEL_ENV: 'preview' }, url), false)
  assert.equal(adminProductionRuntimeEnabled({ ...allowed, GITHUB_ACTIONS: 'true' }, url), false)
  assert.equal(adminProductionRuntimeEnabled({ ...allowed, JETNITY_ADMIN_DEV_RUNTIME_ENABLED: 'true',
    JETNITY_ADMIN_PRODUCTION_RUNTIME_ENABLED: undefined }, url), false)
})
