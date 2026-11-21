import assert from 'node:assert/strict'
import { test } from 'node:test'
import {
  ADMIN_DEV_RUNTIME_BRANCH,
  adminDevRuntimeEnabled,
  type AdminDevRuntimeEnv,
} from '@/lib/admin/dev-runtime-activation'
import { cmsPreviewReadEnabled } from './cms-preview-read'

const devUrl = 'https://yfvbxvijcorffwxbxahl.supabase.co'
const productionUrl = 'https://qscbgcdmivbbnzrcyegn.supabase.co'
const admitted: Readonly<AdminDevRuntimeEnv> = Object.freeze({
  NODE_ENV: 'production',
  VERCEL: '1',
  VERCEL_ENV: 'preview',
  VERCEL_GIT_COMMIT_REF: 'fix/inspiration-catalog-under-eight-dev-20261121',
  VERCEL_PROJECT_ID: 'prj_wTTVawPItEO7a4HihEmaU3PsuaXM',
  NEXT_PUBLIC_SUPABASE_URL: devUrl,
  JETNITY_ADMIN_DEV_RUNTIME_ENABLED: 'true',
})

test('only the explicitly enabled public preview and captured Dev target are admitted', () => {
  assert.equal(cmsPreviewReadEnabled(admitted, devUrl), true)
  assert.equal(cmsPreviewReadEnabled({ ...admitted, VERCEL_TARGET_ENV: 'preview' }, devUrl), true)
  // Vercel's ordinary build marker is not a GitHub Actions environment.
  assert.equal(cmsPreviewReadEnabled({ ...admitted, CI: '1' }, devUrl), true)
})

test('the separate public-reader release preview uses Dev without acquiring Admin admission', () => {
  const release = { ...admitted, VERCEL_GIT_COMMIT_REF: 'fix/cms-public-reader-release-20261121' }
  assert.equal(cmsPreviewReadEnabled(release, devUrl), true)
  assert.equal(adminDevRuntimeEnabled(release, devUrl), false)
  assert.equal(cmsPreviewReadEnabled({ ...release, VERCEL_ENV: 'production' }, devUrl), false)
  assert.equal(cmsPreviewReadEnabled({ ...release, NEXT_PUBLIC_SUPABASE_URL: productionUrl }, productionUrl), false)
  assert.equal(cmsPreviewReadEnabled({ ...release, VERCEL_GIT_COMMIT_REF: `${release.VERCEL_GIT_COMMIT_REF}-other` }, devUrl), false)
})

test('public read admission never admits the same preview to the actual Admin runtime', () => {
  for (const env of [admitted, { ...admitted, VERCEL_TARGET_ENV: 'preview' }, { ...admitted, CI: '1' }]) {
    assert.equal(cmsPreviewReadEnabled(env, devUrl), true)
    assert.equal(adminDevRuntimeEnabled(env, devUrl), false)
  }
  const existingAdminPreview = { ...admitted, VERCEL_GIT_COMMIT_REF: ADMIN_DEV_RUNTIME_BRANCH }
  assert.equal(adminDevRuntimeEnabled(existingAdminPreview, devUrl), true)
  assert.equal(cmsPreviewReadEnabled(existingAdminPreview, devUrl), false)
})

test('every required admission field must be present', () => {
  for (const key of [
    'NODE_ENV', 'VERCEL', 'VERCEL_ENV', 'VERCEL_GIT_COMMIT_REF',
    'VERCEL_PROJECT_ID', 'NEXT_PUBLIC_SUPABASE_URL', 'JETNITY_ADMIN_DEV_RUNTIME_ENABLED',
  ] as const) {
    assert.equal(cmsPreviewReadEnabled({ ...admitted, [key]: undefined }, devUrl), false, key)
  }
})

test('another branch, project or differently written activation flag cannot enable the reader', () => {
  const denied: readonly AdminDevRuntimeEnv[] = [
    { VERCEL_GIT_COMMIT_REF: 'main' },
    { VERCEL_GIT_COMMIT_REF: `${admitted.VERCEL_GIT_COMMIT_REF}-other` },
    { VERCEL_GIT_COMMIT_REF: ADMIN_DEV_RUNTIME_BRANCH },
    { VERCEL_PROJECT_ID: 'another-project' },
    { JETNITY_ADMIN_DEV_RUNTIME_ENABLED: 'false' },
    { JETNITY_ADMIN_DEV_RUNTIME_ENABLED: 'TRUE' },
    { JETNITY_ADMIN_DEV_RUNTIME_ENABLED: 'true ' },
  ]
  for (const override of denied) {
    assert.equal(cmsPreviewReadEnabled({ ...admitted, ...override }, devUrl), false)
  }
})

test('Production, a different target and local development are always rejected', () => {
  const denied: readonly AdminDevRuntimeEnv[] = [
    { VERCEL_ENV: 'production' },
    { VERCEL_TARGET_ENV: 'production' },
    { VERCEL_ENV: 'production', VERCEL_TARGET_ENV: 'production' },
    { VERCEL_ENV: 'development' },
    { VERCEL_TARGET_ENV: 'staging' },
    { NODE_ENV: 'development' },
    { VERCEL: '0' },
  ]
  for (const override of denied) {
    assert.equal(cmsPreviewReadEnabled({ ...admitted, ...override }, devUrl), false)
  }
})

test('both configured and captured database identities must match the exact Dev URL', () => {
  for (const captured of [undefined, '', `${devUrl}/`, productionUrl, 'https://other.supabase.co']) {
    assert.equal(cmsPreviewReadEnabled(admitted, captured), false)
  }
  for (const configured of ['', `${devUrl}/`, productionUrl, 'https://other.supabase.co']) {
    const env = { ...admitted, NEXT_PUBLIC_SUPABASE_URL: configured }
    assert.equal(cmsPreviewReadEnabled(env, devUrl), false)
    assert.equal(cmsPreviewReadEnabled(env, configured), false)
  }
})

test('GitHub Actions cannot acquire public preview admission', () => {
  for (const value of ['true', '1', 'false']) {
    assert.equal(cmsPreviewReadEnabled({ ...admitted, GITHUB_ACTIONS: value }, devUrl), false)
  }
})
