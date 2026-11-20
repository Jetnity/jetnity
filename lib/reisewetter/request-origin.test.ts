import assert from 'node:assert/strict'
import { test } from 'node:test'
import { APP_MAP_ORIGIN } from '@/lib/maps/config'
import { weatherRequestOrigin } from './request-origin'

test('weather incident QA accepts only its exact Preview branch and stable alias', () => {
  const branch = 'fix/release1260-csp-ki-wetter-logout-cancel-dev-20261120'
  const dev = weatherRequestOrigin({ VERCEL_ENV: 'preview', VERCEL_GIT_COMMIT_REF: branch })
  assert.equal(dev, 'https://jetnity-app-git-fix-release1260-csp-ki-b917c2-jetnity-e1b93c82.vercel.app')
  assert.equal(weatherRequestOrigin({ VERCEL_ENV: 'production', VERCEL_GIT_COMMIT_REF: branch }), null)
  assert.equal(weatherRequestOrigin({ VERCEL_ENV: 'preview', VERCEL_GIT_COMMIT_REF: 'another-branch' }), null)
  assert.equal(weatherRequestOrigin({ VERCEL_ENV: undefined, VERCEL_GIT_COMMIT_REF: branch }), null)
})

test('existing production and isolated travel-preview origin contracts stay unchanged', () => {
  assert.equal(weatherRequestOrigin({ VERCEL_ENV: 'production', VERCEL_GIT_COMMIT_REF: 'main' }), 'https://jetnity.com')
  assert.equal(weatherRequestOrigin({ VERCEL_ENV: 'preview', VERCEL_GIT_COMMIT_REF: 'feat/private-travel-ux-20261113' }), APP_MAP_ORIGIN)
  assert.equal(weatherRequestOrigin({ VERCEL_ENV: 'production', VERCEL_GIT_COMMIT_REF: 'another-branch' }), null)
})
