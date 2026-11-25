// Presentation preview only. This is NOT the AT RPC selection, a source approval,
// a fact publisher or a Production release flag. Never widen at-dev-selection.
import 'server-only'
import { getServerSupabaseUrl } from '@/lib/supabase/server'
import { HUMAN_METHOD_DEV_URL } from '../official-truth-product-v3/method/human-contract'

type PreviewContext = Readonly<{
  env: string | undefined
  project: string | undefined
  owner: string | undefined
  repo: string | undefined
  branch: string | undefined
  supabaseUrl: string | undefined
}>

export function eligibleAtVisitorPresentationPreview(input: PreviewContext): boolean {
  return input.env === 'preview'
    && input.project === 'prj_wTTVawPItEO7a4HihEmaU3PsuaXM'
    && input.owner === 'Jetnity'
    && input.repo === 'jetnity'
    && input.branch === 'feat/official-truth-at-visitor-preview-20261124'
    && input.supabaseUrl === HUMAN_METHOD_DEV_URL
}

export function selectedAtVisitorPresentationPreview(): boolean {
  return eligibleAtVisitorPresentationPreview({
    env: process.env.VERCEL_ENV,
    project: process.env.VERCEL_PROJECT_ID,
    owner: process.env.VERCEL_GIT_REPO_OWNER,
    repo: process.env.VERCEL_GIT_REPO_SLUG,
    branch: process.env.VERCEL_GIT_COMMIT_REF,
    supabaseUrl: getServerSupabaseUrl(),
  })
}
