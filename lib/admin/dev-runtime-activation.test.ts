import assert from 'node:assert/strict'
import { test } from 'node:test'
import {
  ADMIN_DEV_RUNTIME_BRANCH,
  ADMIN_DEV_RUNTIME_PROJECT,
  ADMIN_DEV_RUNTIME_URL,
  adminDevRuntimeEnabled,
  type AdminDevRuntimeEnv,
} from './dev-runtime-activation'

const admitted: AdminDevRuntimeEnv = {
  NODE_ENV: 'production', VERCEL: '1', VERCEL_ENV: 'preview',
  VERCEL_GIT_COMMIT_REF: ADMIN_DEV_RUNTIME_BRANCH,
  VERCEL_PROJECT_ID: ADMIN_DEV_RUNTIME_PROJECT,
  NEXT_PUBLIC_SUPABASE_URL: ADMIN_DEV_RUNTIME_URL,
  JETNITY_ADMIN_DEV_RUNTIME_ENABLED: 'true',
}

test('only the explicitly enabled fixed Dev preview and captured session target are admitted', () => {
  assert.equal(adminDevRuntimeEnabled(admitted, ADMIN_DEV_RUNTIME_URL), true)
  assert.equal(adminDevRuntimeEnabled({ ...admitted, VERCEL_TARGET_ENV: 'preview' }, ADMIN_DEV_RUNTIME_URL), true)
  // Vercel may expose CI during its own build; the concrete deployment and
  // captured database identity, not that generic marker, define admission.
  assert.equal(adminDevRuntimeEnabled({ ...admitted, CI: '1' }, ADMIN_DEV_RUNTIME_URL), true)
  for (const key of ['NODE_ENV', 'VERCEL', 'VERCEL_ENV', 'VERCEL_GIT_COMMIT_REF', 'VERCEL_PROJECT_ID',
    'NEXT_PUBLIC_SUPABASE_URL', 'JETNITY_ADMIN_DEV_RUNTIME_ENABLED'] as const) {
    assert.equal(adminDevRuntimeEnabled({ ...admitted, [key]: undefined }, ADMIN_DEV_RUNTIME_URL), false, key)
  }
})

test('Production, other previews, CI and environment changes cannot authorize another session client', () => {
  const denied: AdminDevRuntimeEnv[] = [
    { VERCEL_ENV: 'production' }, { VERCEL_TARGET_ENV: 'production' }, { NODE_ENV: 'development' },
    { VERCEL_GIT_COMMIT_REF: 'main' }, { VERCEL_PROJECT_ID: 'another-project' },
    { JETNITY_ADMIN_DEV_RUNTIME_ENABLED: 'TRUE' }, { GITHUB_ACTIONS: 'true' },
    { NEXT_PUBLIC_SUPABASE_URL: 'https://qscbgcdmivbbnzrcyegn.supabase.co' },
    { NEXT_PUBLIC_SUPABASE_URL: ADMIN_DEV_RUNTIME_URL + '/' },
  ]
  for (const changed of denied) assert.equal(adminDevRuntimeEnabled({ ...admitted, ...changed }, ADMIN_DEV_RUNTIME_URL), false)
  for (const captured of [undefined, '', ADMIN_DEV_RUNTIME_URL + '/', 'https://qscbgcdmivbbnzrcyegn.supabase.co']) {
    assert.equal(adminDevRuntimeEnabled(admitted, captured), false)
  }
})
