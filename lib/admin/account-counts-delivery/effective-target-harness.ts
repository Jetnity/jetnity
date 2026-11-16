import { resolve } from 'node:path'
import { fileURLToPath } from 'node:url'
import { createElement } from 'react'
import { renderToStaticMarkup } from 'react-dom/server'

import { transportState } from '@/lib/admin/account-counts-delivery/effective-target-recorder.mjs'
import {
  ADMIN_ACCOUNT_COUNTS_DEV_BRANCH,
  ADMIN_ACCOUNT_COUNTS_DEV_URL,
  ADMIN_ACCOUNT_COUNTS_VERCEL_PROJECT,
} from '@/lib/admin/account-counts-delivery/dev-activation'

export const REMOTE_EFFECTIVE_TARGET = 'https://synthetic-remote.invalid'
export const LOCAL_EFFECTIVE_TARGET = 'http://127.0.0.1:54321'

export function effectiveTargetPreload() {
  return import('./effective-target-preload.mjs')
}

function unsetHostedMarkers() {
  delete process.env.VERCEL
  delete process.env.VERCEL_ENV
  delete process.env.VERCEL_TARGET_ENV
  delete process.env.VERCEL_GIT_COMMIT_REF
  delete process.env.VERCEL_PROJECT_ID
  delete process.env.VERCEL_URL
  delete process.env.VERCEL_REGION
  delete process.env.VERCEL_DEPLOYMENT_ID
  delete process.env.CI
  delete process.env.GITHUB_ACTIONS
}

function applyLocalRuntime() {
  const env = process.env as { NODE_ENV?: string }
  env.NODE_ENV = 'test'
  process.env.JETNITY_ADMIN_ACCOUNT_COUNTS_LOCAL_ENABLED = 'true'
  delete process.env.JETNITY_ADMIN_ACCOUNT_COUNTS_DEV_ENABLED
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY = 'test-only-anon-key'
  unsetHostedMarkers()
}

async function runEffectiveTargetHarness(): Promise<Record<string, unknown>> {
  const mode = process.env.ACCOUNT_COUNTS_HARNESS_MODE ?? 'split-remote-then-loopback'
  const env = process.env as { NODE_ENV?: string }

  if (mode.startsWith('dev-')) {
    delete process.env.JETNITY_ADMIN_ACCOUNT_COUNTS_LOCAL_ENABLED
    process.env.JETNITY_ADMIN_ACCOUNT_COUNTS_DEV_ENABLED = 'true'
    env.NODE_ENV = 'production'
    process.env.VERCEL = '1'
    process.env.VERCEL_ENV = 'preview'
    process.env.VERCEL_TARGET_ENV = 'preview'
    process.env.VERCEL_GIT_COMMIT_REF = ADMIN_ACCOUNT_COUNTS_DEV_BRANCH
    process.env.VERCEL_PROJECT_ID = ADMIN_ACCOUNT_COUNTS_VERCEL_PROJECT
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY = 'synthetic-dev-public-key'
    process.env.NEXT_PUBLIC_SUPABASE_URL = mode === 'dev-captured-other'
      ? REMOTE_EFFECTIVE_TARGET : ADMIN_ACCOUNT_COUNTS_DEV_URL
    const { getServerSupabaseUrl } = await import('@/lib/supabase/server')
    if (mode === 'dev-captured-other') process.env.NEXT_PUBLIC_SUPABASE_URL = ADMIN_ACCOUNT_COUNTS_DEV_URL
    if (mode === 'dev-process-other') process.env.NEXT_PUBLIC_SUPABASE_URL = REMOTE_EFFECTIVE_TARGET
    if (mode === 'dev-production') process.env.VERCEL_ENV = 'production'
    if (mode === 'dev-default-off') delete process.env.JETNITY_ADMIN_ACCOUNT_COUNTS_DEV_ENABLED
    if (mode === 'dev-other-branch') process.env.VERCEL_GIT_COMMIT_REF = 'main'
    if (mode === 'dev-other-project') process.env.VERCEL_PROJECT_ID = 'prj_unreviewed'
    if (mode === 'dev-missing-project') delete process.env.VERCEL_PROJECT_ID
    if (mode === 'dev-guard-denied') process.env.ACCOUNT_COUNTS_HARNESS_GUARD = 'deny'
    if (mode === 'dev-banned-caller') process.env.ACCOUNT_COUNTS_HARNESS_CALLER_STATUS = 'banned'
    const { loadAdminAccountCounts } = await import('@/lib/admin/account-counts-delivery/reader')
    const result = await loadAdminAccountCounts()
    return { mode, status: result.status, sharedUrl: getServerSupabaseUrl(),
      processUrl: process.env.NEXT_PUBLIC_SUPABASE_URL,
      measures: result.status === 'available' ? result.measures : null, transport: transportState() }
  }

  if (mode === 'split-remote-then-loopback') {
    process.env.NEXT_PUBLIC_SUPABASE_URL = REMOTE_EFFECTIVE_TARGET
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY = 'test-only-anon-key'
    env.NODE_ENV = 'test'
    const { getServerSupabaseUrl } = await import('@/lib/supabase/server')
    applyLocalRuntime()
    process.env.NEXT_PUBLIC_SUPABASE_URL = LOCAL_EFFECTIVE_TARGET
    const { loadAdminAccountCounts } = await import('@/lib/admin/account-counts-delivery/reader')
    const result = await (loadAdminAccountCounts as unknown as (env?: unknown) => ReturnType<
      typeof loadAdminAccountCounts
    >)({
      NODE_ENV: 'test',
      JETNITY_ADMIN_ACCOUNT_COUNTS_LOCAL_ENABLED: 'true',
      NEXT_PUBLIC_SUPABASE_URL: LOCAL_EFFECTIVE_TARGET,
    })
    return {
      mode,
      status: result.status,
      sharedUrl: getServerSupabaseUrl(),
      processUrl: process.env.NEXT_PUBLIC_SUPABASE_URL,
      transport: transportState(),
    }
  }

  if (mode === 'local-positive' || mode === 'component-success' || mode === 'component-failed') {
    applyLocalRuntime()
    process.env.NEXT_PUBLIC_SUPABASE_URL = LOCAL_EFFECTIVE_TARGET
    if (mode === 'component-failed') process.env.ACCOUNT_COUNTS_HARNESS_GUARD = 'throw'
    const { getServerSupabaseUrl } = await import('@/lib/supabase/server')
    if (mode === 'local-positive') {
      const { loadAdminAccountCounts } = await import('@/lib/admin/account-counts-delivery/reader')
      const result = await loadAdminAccountCounts()
      return {
        mode,
        status: result.status,
        sharedUrl: getServerSupabaseUrl(),
        measures: result.status === 'available' ? result.measures : null,
        transport: transportState(),
      }
    }
    const { default: AdminAccountCounts } = await import('@/components/admin/home/AdminAccountCounts')
    const element = await AdminAccountCounts()
    const html = element ? renderToStaticMarkup(createElement(element.type, element.props)) : ''
    return {
      mode,
      html,
      empty: element === null,
      transport: transportState(),
      sharedUrl: getServerSupabaseUrl(),
    }
  }

  if (mode === 'inverse-stale-process') {
    applyLocalRuntime()
    process.env.NEXT_PUBLIC_SUPABASE_URL = LOCAL_EFFECTIVE_TARGET
    const { getServerSupabaseUrl } = await import('@/lib/supabase/server')
    process.env.NEXT_PUBLIC_SUPABASE_URL = REMOTE_EFFECTIVE_TARGET
    const { loadAdminAccountCounts } = await import('@/lib/admin/account-counts-delivery/reader')
    const result = await loadAdminAccountCounts()
    return {
      mode,
      status: result.status,
      sharedUrl: getServerSupabaseUrl(),
      processUrl: process.env.NEXT_PUBLIC_SUPABASE_URL,
      transport: transportState(),
    }
  }

  if (mode === 'hosted-production' || mode === 'default-off' || mode === 'missing-target') {
    applyLocalRuntime()
    if (mode === 'hosted-production') {
      env.NODE_ENV = 'production'
      process.env.VERCEL = '1'
      process.env.NEXT_PUBLIC_SUPABASE_URL = LOCAL_EFFECTIVE_TARGET
    } else if (mode === 'default-off') {
      delete process.env.JETNITY_ADMIN_ACCOUNT_COUNTS_LOCAL_ENABLED
      process.env.NEXT_PUBLIC_SUPABASE_URL = LOCAL_EFFECTIVE_TARGET
    } else {
      delete process.env.NEXT_PUBLIC_SUPABASE_URL
    }
    const { getServerSupabaseUrl } = await import('@/lib/supabase/server')
    const { loadAdminAccountCounts } = await import('@/lib/admin/account-counts-delivery/reader')
    const { default: AdminAccountCounts } = await import('@/components/admin/home/AdminAccountCounts')
    const result = await loadAdminAccountCounts()
    const element = await AdminAccountCounts()
    return {
      mode,
      status: result.status,
      empty: element === null,
      sharedUrl: getServerSupabaseUrl(),
      transport: transportState(),
    }
  }

  throw new Error(`unknown harness mode ${mode}`)
}

const invokedDirectly =
  typeof process.argv[1] === 'string' &&
  fileURLToPath(import.meta.url) === resolve(process.argv[1])

if (invokedDirectly) {
  runEffectiveTargetHarness()
    .then((payload) => {
      process.stdout.write(`${JSON.stringify(payload)}\n`)
    })
    .catch((error: unknown) => {
      console.error(error)
      process.exitCode = 1
    })
}
