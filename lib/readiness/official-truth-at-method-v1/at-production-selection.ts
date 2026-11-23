// PREPARED ONLY. Production visitor activation is a separate Owner-held
// environment gate; preview/Dev AAL2, Dev URLs and release receipts never cross.
// This does not confer method approval or database publication authority.
import 'server-only'
import { getServerSupabaseUrl } from '@/lib/supabase/server'
import { HUMAN_METHOD_PRODUCTION_URL } from '../official-truth-product-v3/method/human-contract'

type AtProductionContext = Readonly<{
  deploymentEnv: string | undefined
  projectId: string | undefined
  repoOwner: string | undefined
  repoSlug: string | undefined
  branch: string | undefined
  supabaseUrl: string | undefined
  ownerRelease: string | undefined
}>

// Narrow pure admission policy for regression tests. A true value authorizes
// ONLY an attempted server RPC; the protected PG17 MA1/BG1/official-source
// visitor must independently accept the exact passport and fresh legal fact.
export function eligibleAustriaProductionVisitor(input: AtProductionContext): boolean {
  return input.ownerRelease === 'enabled'
    && input.deploymentEnv === 'production'
    && input.projectId === 'prj_wTTVawPItEO7a4HihEmaU3PsuaXM'
    && input.repoOwner === 'Jetnity'
    && input.repoSlug === 'jetnity'
    && input.branch === 'main'
    && input.supabaseUrl === HUMAN_METHOD_PRODUCTION_URL
}

export function selectedAustriaProduction(): boolean {
  // Fail closed even when Supabase configuration cannot be read. A flag by
  // itself cannot route Dev credentials into Production or approve an AT fact.
  if (process.env.JETNITY_OFFICIAL_AT_PRODUCTION_VISITOR_V1 !== 'enabled'
    || process.env.VERCEL_ENV !== 'production') return false
  return eligibleAustriaProductionVisitor({
    ownerRelease: process.env.JETNITY_OFFICIAL_AT_PRODUCTION_VISITOR_V1,
    deploymentEnv: process.env.VERCEL_ENV,
    projectId: process.env.VERCEL_PROJECT_ID,
    repoOwner: process.env.VERCEL_GIT_REPO_OWNER,
    repoSlug: process.env.VERCEL_GIT_REPO_SLUG,
    branch: process.env.VERCEL_GIT_COMMIT_REF,
    supabaseUrl: getServerSupabaseUrl(),
  })
}

/** A SEPARATE Owner-held Production gate for stage/approve/revoke.
 * The visitor flag remains disabled until official-source / BG1 / MA1 readback.
 * This merely enables the pre-existing Owner+AAL2 UI transport, never a
 * database method, legal fact, schema migration, public read or new role. */
export function selectedAustriaProductionMethod(): boolean {
  const flag = process.env.JETNITY_OFFICIAL_AT_PRODUCTION_METHOD_OWNER_V1
  if (flag !== 'enabled' || process.env.VERCEL_ENV !== 'production') return false
  return eligibleAustriaProductionVisitor({
    ownerRelease: flag,
    deploymentEnv: process.env.VERCEL_ENV,
    projectId: process.env.VERCEL_PROJECT_ID,
    repoOwner: process.env.VERCEL_GIT_REPO_OWNER,
    repoSlug: process.env.VERCEL_GIT_REPO_SLUG,
    branch: process.env.VERCEL_GIT_COMMIT_REF,
    supabaseUrl: getServerSupabaseUrl(),
  })
}

/** CH→AT revision 2 Owner-only Production selection. Deliberately uses a NEW
 * server-side flag: enabling it before deployment must not awaken the legacy
 * revision-1/50-passport Owner page. The older V1 flag and the visitor flag
 * remain independent and unchanged. This grants no SQL method authority. */
export function selectedAustriaProductionMethodV2(): boolean {
  const flag = process.env.JETNITY_OFFICIAL_AT_PRODUCTION_METHOD_OWNER_V2
  if (flag !== 'enabled' || process.env.VERCEL_ENV !== 'production') return false
  return eligibleAustriaProductionVisitor({
    ownerRelease: flag,
    deploymentEnv: process.env.VERCEL_ENV,
    projectId: process.env.VERCEL_PROJECT_ID,
    repoOwner: process.env.VERCEL_GIT_REPO_OWNER,
    repoSlug: process.env.VERCEL_GIT_REPO_SLUG,
    branch: process.env.VERCEL_GIT_COMMIT_REF,
    supabaseUrl: getServerSupabaseUrl(),
  })
}
