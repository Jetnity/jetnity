import 'server-only'

export const ADMIN_ACCOUNT_COUNTS_REQUIRED_CALLER_STATUS = 'active' as const

export type AccountCountsCallerStatusLookup =
  | { ok: true; status: string }
  | { ok: false; reason: 'missing' | 'unknown' | 'failed' }

export type AccountCountsCallerAccessDecision =
  | { allowed: true; grant: 'role' | 'break-glass' }
  | { allowed: false; kind: 'forbidden' | 'failed' }

export type AccountCountsOwnStatusRead = () => Promise<{
  data: { status?: unknown } | null
  error: { message?: string | null } | null
}>

export function decideAccountCountsCallerStatus(
  lookup: AccountCountsCallerStatusLookup,
): AccountCountsCallerAccessDecision {
  if (!lookup.ok) {
    return { allowed: false, kind: lookup.reason === 'failed' ? 'failed' : 'forbidden' }
  }
  if (lookup.status === ADMIN_ACCOUNT_COUNTS_REQUIRED_CALLER_STATUS) {
    return { allowed: true, grant: 'role' }
  }
  return { allowed: false, kind: 'forbidden' }
}

export async function loadOwnAccountCountsCallerStatus(
  readOwnStatus: AccountCountsOwnStatusRead,
): Promise<AccountCountsCallerStatusLookup> {
  try {
    const { data, error } = await readOwnStatus()
    if (error) return { ok: false, reason: 'failed' }
    if (!data) return { ok: false, reason: 'missing' }
    if (typeof data.status !== 'string' || data.status.length === 0) {
      return { ok: false, reason: 'unknown' }
    }
    return { ok: true, status: data.status }
  } catch {
    return { ok: false, reason: 'failed' }
  }
}

/**
 * Feature-local defense after the existing role/AAL decision.
 * Does not look up status unless the caller already has a role grant.
 * Break-glass is left unchanged so the reader can still deny it without a
 * new profile read. A missing verified user after a role grant fails closed.
 */
export async function applyAccountCountsCallerStatus(
  access: AccountCountsCallerAccessDecision,
  verifiedUserId: string | null | undefined,
  loadStatus: (userId: string) => Promise<AccountCountsCallerStatusLookup>,
): Promise<AccountCountsCallerAccessDecision> {
  if (!access.allowed) return access
  if (access.grant !== 'role') return access
  if (typeof verifiedUserId !== 'string' || verifiedUserId.length === 0) {
    return { allowed: false, kind: 'failed' }
  }

  let lookup: AccountCountsCallerStatusLookup
  try {
    lookup = await loadStatus(verifiedUserId)
  } catch {
    return { allowed: false, kind: 'failed' }
  }
  return decideAccountCountsCallerStatus(lookup)
}
