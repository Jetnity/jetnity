import 'server-only'

import { getServerSupabaseUrl } from '@/lib/supabase/server'
import { ADMIN_DEV_RUNTIME_PROJECT, isAdminDevRuntimeEnabled, type AdminDevRuntimeEnv } from './dev-runtime-activation'

const productionDatabase = 'https://qscbgcdmivbbnzrcyegn.supabase.co'
type RuntimeEnv = AdminDevRuntimeEnv & { JETNITY_ADMIN_PRODUCTION_RUNTIME_ENABLED?: string }

export function adminProductionRuntimeEnabled(env: RuntimeEnv, capturedUrl: string | undefined): boolean {
  return env.JETNITY_ADMIN_PRODUCTION_RUNTIME_ENABLED === 'true'
    && env.NODE_ENV === 'production'
    && env.VERCEL === '1'
    && env.VERCEL_ENV === 'production'
    && (env.VERCEL_TARGET_ENV === undefined || env.VERCEL_TARGET_ENV === 'production')
    && env.VERCEL_GIT_COMMIT_REF === 'main'
    && env.VERCEL_PROJECT_ID === ADMIN_DEV_RUNTIME_PROJECT
    && env.NEXT_PUBLIC_SUPABASE_URL === productionDatabase
    && capturedUrl === productionDatabase
    && !env.GITHUB_ACTIONS
}

export function adminHostedRuntimeTarget(): 'development' | 'production' | 'unavailable' {
  if (isAdminDevRuntimeEnabled()) return 'development'
  return adminProductionRuntimeEnabled(process.env, getServerSupabaseUrl()) ? 'production' : 'unavailable'
}

export function isAdminHostedRuntimeEnabled(): boolean {
  return adminHostedRuntimeTarget() !== 'unavailable'
}
