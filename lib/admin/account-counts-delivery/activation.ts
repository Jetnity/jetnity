import 'server-only'

import {
  ADMIN_ACCOUNT_COUNTS_LOCAL_FLAG,
} from '@/lib/admin/account-counts-delivery/contract'

const LOCAL_RUNTIMES = new Set(['development', 'test'])

const HOSTED_MARKERS = [
  'VERCEL',
  'VERCEL_ENV',
  'VERCEL_URL',
  'VERCEL_REGION',
  'VERCEL_DEPLOYMENT_ID',
  'CI',
  'GITHUB_ACTIONS',
] as const

export type AdminAccountCountsActivationEnv = {
  NODE_ENV?: string
  JETNITY_ADMIN_ACCOUNT_COUNTS_LOCAL_ENABLED?: string
  NEXT_PUBLIC_SUPABASE_URL?: string
  VERCEL?: string
  VERCEL_ENV?: string
  VERCEL_URL?: string
  VERCEL_REGION?: string
  VERCEL_DEPLOYMENT_ID?: string
  CI?: string
  GITHUB_ACTIONS?: string
}

export function adminAccountCountsActivationEnvFromProcess(
  env: NodeJS.ProcessEnv = process.env,
): AdminAccountCountsActivationEnv {
  return {
    NODE_ENV: env.NODE_ENV,
    JETNITY_ADMIN_ACCOUNT_COUNTS_LOCAL_ENABLED: env[ADMIN_ACCOUNT_COUNTS_LOCAL_FLAG],
    NEXT_PUBLIC_SUPABASE_URL: env.NEXT_PUBLIC_SUPABASE_URL,
    VERCEL: env.VERCEL,
    VERCEL_ENV: env.VERCEL_ENV,
    VERCEL_URL: env.VERCEL_URL,
    VERCEL_REGION: env.VERCEL_REGION,
    VERCEL_DEPLOYMENT_ID: env.VERCEL_DEPLOYMENT_ID,
    CI: env.CI,
    GITHUB_ACTIONS: env.GITHUB_ACTIONS,
  }
}

export function isLoopbackSupabaseUrl(raw: string | undefined): boolean {
  if (typeof raw !== 'string' || raw.trim() === '') return false
  let url: URL
  try {
    url = new URL(raw)
  } catch {
    return false
  }
  if (url.username !== '' || url.password !== '') return false
  if (url.protocol !== 'http:' && url.protocol !== 'https:') return false
  const host = url.hostname.toLowerCase()
  return host === '127.0.0.1' || host === 'localhost' || host === '[::1]' || host === '::1'
}

function hasHostedMarker(env: AdminAccountCountsActivationEnv): boolean {
  return HOSTED_MARKERS.some((key) => {
    const value = env[key]
    return typeof value === 'string' && value.trim() !== ''
  })
}

/**
 * Server-only local activation. Default false. Host/query/browser inputs are
 * not read. Hosted/Production/Preview/unknown/remote stays disabled even when
 * the local flag is the exact string `true`.
 */
export function isAdminAccountCountsLocallyEnabled(
  env: AdminAccountCountsActivationEnv = adminAccountCountsActivationEnvFromProcess(),
): boolean {
  if (env.JETNITY_ADMIN_ACCOUNT_COUNTS_LOCAL_ENABLED !== 'true') return false
  if (!LOCAL_RUNTIMES.has(env.NODE_ENV ?? '')) return false
  if (hasHostedMarker(env)) return false
  if (!isLoopbackSupabaseUrl(env.NEXT_PUBLIC_SUPABASE_URL)) return false
  return true
}
