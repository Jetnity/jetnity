import 'server-only'

// Public deployment identity, not credentials. A different rollout needs its
// own review; no request headers, cookies or URL parameters can select a target.
export const ADMIN_ACCOUNT_COUNTS_DEV_PROJECT = 'yfvbxvijcorffwxbxahl'
export const ADMIN_ACCOUNT_COUNTS_DEV_URL = `https://${ADMIN_ACCOUNT_COUNTS_DEV_PROJECT}.supabase.co`
export const ADMIN_ACCOUNT_COUNTS_DEV_BRANCH = 'feat/admin-account-counts-dev-20261115'
export const ADMIN_ACCOUNT_COUNTS_VERCEL_PROJECT = 'prj_wTTVawPItEO7a4HihEmaU3PsuaXM'
export const ADMIN_ACCOUNT_COUNTS_DEV_FLAG = 'JETNITY_ADMIN_ACCOUNT_COUNTS_DEV_ENABLED'

export type AdminAccountCountsDevEnv = {
  NODE_ENV?: string
  VERCEL?: string
  VERCEL_ENV?: string
  VERCEL_TARGET_ENV?: string
  VERCEL_GIT_COMMIT_REF?: string
  VERCEL_PROJECT_ID?: string
  NEXT_PUBLIC_SUPABASE_URL?: string
  JETNITY_ADMIN_ACCOUNT_COUNTS_DEV_ENABLED?: string
}

/** Pure, fail-closed target check. Permission to read still belongs to the loader/DB. */
export function isAdminAccountCountsDevEnabled(
  env: AdminAccountCountsDevEnv,
  capturedSupabaseUrl: string | undefined,
): boolean {
  return env.JETNITY_ADMIN_ACCOUNT_COUNTS_DEV_ENABLED === 'true'
    && env.NODE_ENV === 'production'
    && env.VERCEL === '1'
    && env.VERCEL_ENV === 'preview'
    && (env.VERCEL_TARGET_ENV === undefined || env.VERCEL_TARGET_ENV === 'preview')
    && env.VERCEL_GIT_COMMIT_REF === ADMIN_ACCOUNT_COUNTS_DEV_BRANCH
    && env.VERCEL_PROJECT_ID === ADMIN_ACCOUNT_COUNTS_VERCEL_PROJECT
    && env.NEXT_PUBLIC_SUPABASE_URL === ADMIN_ACCOUNT_COUNTS_DEV_URL
    && capturedSupabaseUrl === ADMIN_ACCOUNT_COUNTS_DEV_URL
}
