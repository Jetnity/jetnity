import 'server-only'

import { getServerSupabaseUrl } from '@/lib/supabase/server'
import type { AdminDevRuntimeEnv } from '@/lib/admin/dev-runtime-activation'

/** Admission for this public, published-only Dev reader. This does not enable
 * the Admin runtime, a write command, login, or an AAL2 capability. */
export function cmsPreviewReadEnabled(env: AdminDevRuntimeEnv, capturedUrl: string | undefined): boolean {
  return env.JETNITY_ADMIN_DEV_RUNTIME_ENABLED === 'true'
    && env.NODE_ENV === 'production'
    && env.VERCEL === '1'
    && env.VERCEL_ENV === 'preview'
    && (env.VERCEL_TARGET_ENV === undefined || env.VERCEL_TARGET_ENV === 'preview')
    && env.VERCEL_GIT_COMMIT_REF === 'fix/inspiration-catalog-under-eight-dev-20261121'
    && env.VERCEL_PROJECT_ID === 'prj_wTTVawPItEO7a4HihEmaU3PsuaXM'
    && env.NEXT_PUBLIC_SUPABASE_URL === 'https://yfvbxvijcorffwxbxahl.supabase.co'
    && capturedUrl === 'https://yfvbxvijcorffwxbxahl.supabase.co'
    && !env.GITHUB_ACTIONS
}

export function isCmsPreviewReadEnabled(): boolean {
  return cmsPreviewReadEnabled(process.env, getServerSupabaseUrl())
}
