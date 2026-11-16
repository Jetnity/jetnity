import 'server-only'

import { getServerSupabaseUrl } from '@/lib/supabase/server'

export const ADMIN_DEV_RUNTIME_BRANCH = 'feat/places-catalog-refresh-3-20261115'
export const ADMIN_DEV_RUNTIME_PROJECT = 'prj_wTTVawPItEO7a4HihEmaU3PsuaXM'
export const ADMIN_DEV_RUNTIME_URL = 'https://yfvbxvijcorffwxbxahl.supabase.co'
export const ADMIN_DEV_RUNTIME_FLAG = 'JETNITY_ADMIN_DEV_RUNTIME_ENABLED'

export type AdminDevRuntimeEnv = {
  NODE_ENV?: string
  VERCEL?: string
  VERCEL_ENV?: string
  VERCEL_TARGET_ENV?: string
  VERCEL_GIT_COMMIT_REF?: string
  VERCEL_PROJECT_ID?: string
  NEXT_PUBLIC_SUPABASE_URL?: string
  JETNITY_ADMIN_DEV_RUNTIME_ENABLED?: string
  CI?: string
  GITHUB_ACTIONS?: string
}

/** Deployment admission only. Identity, AAL2, role, RLS and BG1 remain separate
 * mandatory checks; no request value can select a database or enable a write. */
export function adminDevRuntimeEnabled(
  env: AdminDevRuntimeEnv,
  capturedUrl: string | undefined,
): boolean {
  return env.JETNITY_ADMIN_DEV_RUNTIME_ENABLED === 'true'
    && env.NODE_ENV === 'production'
    && env.VERCEL === '1'
    && env.VERCEL_ENV === 'preview'
    && (env.VERCEL_TARGET_ENV === undefined || env.VERCEL_TARGET_ENV === 'preview')
    && env.VERCEL_GIT_COMMIT_REF === ADMIN_DEV_RUNTIME_BRANCH
    && env.VERCEL_PROJECT_ID === ADMIN_DEV_RUNTIME_PROJECT
    && env.NEXT_PUBLIC_SUPABASE_URL === ADMIN_DEV_RUNTIME_URL
    && capturedUrl === ADMIN_DEV_RUNTIME_URL
    && !env.GITHUB_ACTIONS
}

/** Bind the process snapshot to the URL already captured by the session factory. */
export function isAdminDevRuntimeEnabled(): boolean {
  return adminDevRuntimeEnabled(process.env, getServerSupabaseUrl())
}
