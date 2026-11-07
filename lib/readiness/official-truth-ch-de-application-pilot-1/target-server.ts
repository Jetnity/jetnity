import 'server-only'
import { getServerSupabaseUrl } from '@/lib/supabase/server'

const DEVELOPMENT_URL = 'https://yfvbxvijcorffwxbxahl.supabase.co'
const VERCEL_PROJECT = 'prj_wTTVawPItEO7a4HihEmaU3PsuaXM'

/** Necessary target boundary only; never grants pilot or account authority. */
export function applicationPilotTargetAllowed(): boolean {
  // Read the current runtime object, not a NEXT_PUBLIC expression inlined at
  // build time. The shared session factory independently captured its URL.
  const env = process.env
  return env.VERCEL === '1' && env.VERCEL_ENV === 'preview'
    && env.VERCEL_TARGET_ENV === 'preview' && env.VERCEL_PROJECT_ID === VERCEL_PROJECT
    && env.NEXT_PUBLIC_SUPABASE_URL === DEVELOPMENT_URL
    && getServerSupabaseUrl() === DEVELOPMENT_URL
}
