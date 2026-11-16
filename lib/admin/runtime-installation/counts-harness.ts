// Synthetic transport only; the real session factory is imported after ENV.
import { transportState } from '@/lib/admin/account-counts-delivery/effective-target-recorder.mjs'

export type CountsRuntimeProofMode = 'enabled' | 'disabled' | 'wrong-branch' | 'ci'
export type CountsRuntimeProofResult = {
  mode: CountsRuntimeProofMode
  status: Awaited<ReturnType<typeof import('../account-counts-delivery/reader').loadAdminAccountCounts>>['status']
  transport: ReturnType<typeof transportState>
}

async function run() {
  const mode = process.env.ADMIN_RUNTIME_COUNTS_PROOF
  if (mode !== 'enabled' && mode !== 'disabled' && mode !== 'wrong-branch' && mode !== 'ci')
    throw new Error('a closed synthetic Counts proof mode is required')
  const env = process.env as Record<string, string | undefined>
  env.NODE_ENV = 'production'
  env.VERCEL = '1'
  env.VERCEL_ENV = 'preview'
  env.VERCEL_TARGET_ENV = 'preview'
  env.VERCEL_GIT_COMMIT_REF = mode === 'wrong-branch' ? 'main' : 'feat/places-catalog-refresh-3-20261115'
  env.VERCEL_PROJECT_ID = 'prj_wTTVawPItEO7a4HihEmaU3PsuaXM'
  env.NEXT_PUBLIC_SUPABASE_URL = 'https://yfvbxvijcorffwxbxahl.supabase.co'
  env.NEXT_PUBLIC_SUPABASE_ANON_KEY = 'synthetic-admin-runtime-key'
  env.JETNITY_ADMIN_DEV_RUNTIME_ENABLED = mode === 'disabled' ? undefined : 'true'
  delete env.JETNITY_ADMIN_ACCOUNT_COUNTS_DEV_ENABLED
  delete env.JETNITY_ADMIN_ACCOUNT_COUNTS_LOCAL_ENABLED
  env.ACCOUNT_COUNTS_HARNESS_GUARD = ''
  env.ACCOUNT_COUNTS_HARNESS_CALLER_STATUS = 'active'
  if (mode === 'ci') env.GITHUB_ACTIONS = 'true'
  else delete env.GITHUB_ACTIONS
  globalThis.fetch = async () => { throw new Error('network is forbidden in the synthetic Counts proof') }
  const { loadAdminAccountCounts } = await import('../account-counts-delivery/reader')
  const result = await loadAdminAccountCounts()
  const proof: CountsRuntimeProofResult = { mode, status: result.status, transport: transportState() }
  console.log(JSON.stringify(proof))
}
void run().catch(error => { console.error(error); process.exitCode = 1 })
