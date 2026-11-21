/**
 * Quality Wave 2 — design-time, read-only security review gates.
 * These functions never grant access. They DO NOT replace the database's
 * Official Truth capability or a real client/server preview readback.
 * No env values, secrets, sessions or account rows are ever accepted here.
 */
export const DEV_PROJECT_REF = 'yfvbxvijcorffwxbxahl'
export const PROD_PROJECT_REF = 'qscbgcdmivbbnzrcyegn'

export type OwnerWitnessCandidate = Readonly<{
  role: unknown
  aal: unknown
  accountStatus: unknown
  currentSessionVerified: unknown
  currentAuthUserVerified: unknown
  profileMatchesAuthUser: unknown
}>

/** Proposed invariant, NOT installed in public.darf_official_truth_freigeben. */
export function ownerStatusSessionCandidate(input: OwnerWitnessCandidate): boolean {
  return input.role === 'owner'
    && input.aal === 'aal2'
    && input.accountStatus === 'active'
    && input.currentSessionVerified === true
    && input.currentAuthUserVerified === true
    && input.profileMatchesAuthUser === true
}

export const REQUIRED_PREVIEW_ENV_KEYS = Object.freeze([
  'NEXT_PUBLIC_SUPABASE_URL',
  'NEXT_PUBLIC_SUPABASE_ANON_KEY',
  'SUPABASE_PROJECT_REF',
  'SUPABASE_SERVICE_ROLE_KEY',
  'OPENAI_API_KEY',
  'JETNITY_MODELL_AKTIV',
  'NEXT_PUBLIC_ALLOW_INDEXING',
] as const)

export type PreviewEnvRow = Readonly<{
  key: string
  target: readonly string[]
  gitBranch: string
}>
export type PreviewRuntimeEvidence = Readonly<{
  browserProjectRef: string | null
  serverProjectRef: string | null
  productionCredentialsAbsent: boolean
}>

export type PreviewDecision = Readonly<{
  approved: boolean
  reasons: readonly string[]
}>

/**
 * The input consists ONLY of sanitized Vercel metadata (key/scope/branch)
 * and independently observed runtime project references — no secret values.
 * A READY deployment or a branch-only variable is never sufficient.
 */
export function previewIsolationGate(input: Readonly<{
  branch: string
  entries: readonly unknown[]
  completeInventory: boolean
  runtime: PreviewRuntimeEvidence | null
}>): PreviewDecision {
  const reasons: string[] = []
  if (!/^[-_a-zA-Z0-9/]{5,150}$/.test(input.branch) || input.branch === 'main') {
    reasons.push('branch_invalid')
  }
  if (input.completeInventory !== true) reasons.push('inventory_incomplete')
  const rows: PreviewEnvRow[] = []
  for (const entry of input.entries) {
    if (entry === null || typeof entry !== 'object' || Array.isArray(entry)
      || Object.keys(entry).sort().join(',') !== 'gitBranch,key,target') {
      reasons.push('metadata_unsanitized')
      continue
    }
    const row = entry as PreviewEnvRow
    if (typeof row.key !== 'string' || typeof row.gitBranch !== 'string'
      || !Array.isArray(row.target) || row.target.length !== 1 || row.target[0] !== 'preview'
      || row.gitBranch !== input.branch) {
      reasons.push('scope_invalid')
      continue
    }
    rows.push(row)
  }
  const keys = rows.map(x => x.key)
  const exact = REQUIRED_PREVIEW_ENV_KEYS.length === keys.length
    && keys.length === new Set(keys).size
    && REQUIRED_PREVIEW_ENV_KEYS.every(key => keys.includes(key))
  if (!exact) reasons.push('required_scopes_missing_or_extra')
  if (input.runtime?.browserProjectRef !== DEV_PROJECT_REF
    || input.runtime?.serverProjectRef !== DEV_PROJECT_REF) reasons.push('runtime_dev_unverified')
  if (input.runtime?.productionCredentialsAbsent !== true) reasons.push('privileged_binding_unverified')
  return Object.freeze({ approved: reasons.length === 0, reasons: Object.freeze(reasons) })
}
