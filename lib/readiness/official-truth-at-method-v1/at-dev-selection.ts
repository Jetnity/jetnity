import 'server-only'
import { getServerSupabaseUrl } from '@/lib/supabase/server'
import { HUMAN_METHOD_DEV_URL } from '../official-truth-product-v3/method/human-contract'
// Exact two preapproved Dev-only Vercel preview branches. Both are bound to
// the same Development Supabase and Vercel project; DB MA1/BG1/source-bound
// checks are NEVER changed. No runtime flag, caller-selected host or secret.
export function selectedAustriaDev():boolean{
 return process.env.VERCEL_ENV==='preview'
  && process.env.VERCEL_PROJECT_ID==='prj_wTTVawPItEO7a4HihEmaU3PsuaXM'
  && process.env.VERCEL_GIT_REPO_OWNER==='Jetnity'
  && process.env.VERCEL_GIT_REPO_SLUG==='jetnity'
  && (process.env.VERCEL_GIT_COMMIT_REF==='feat/official-truth-at-owned-20261116'
   || process.env.VERCEL_GIT_COMMIT_REF==='feat/official-truth-universal-source-registry-dev-20261119')
  && getServerSupabaseUrl()===HUMAN_METHOD_DEV_URL
}


/** Separate, default-OFF Owner selection for the CH→AT V2 successor.
 * The existing two AT50 preview selections are deliberately unchanged.
 * No branch may ever inherit Production credentials; equality to the named
 * Development Supabase URL is mandatory on the server.
 */
export function selectedAustriaChV2Dev(): boolean {
 return process.env.VERCEL_ENV==='preview'
  && process.env.VERCEL_PROJECT_ID==='prj_wTTVawPItEO7a4HihEmaU3PsuaXM'
  && process.env.VERCEL_GIT_REPO_OWNER==='Jetnity'
  && process.env.VERCEL_GIT_REPO_SLUG==='jetnity'
  && process.env.VERCEL_GIT_COMMIT_REF==='fix/official-truth-chde-at-renewal-dev-20261121'
  && getServerSupabaseUrl()===HUMAN_METHOD_DEV_URL
}
