// Canonical application contract for the local Admin account-count delivery.
//
// The producer remains jetnity.admin-account-counts.v1. This module owns only
// the application-facing result, transport field names and the public wrapper
// RPC name. It does not invent counts or claim a live schema object.

export const ADMIN_ACCOUNT_COUNTS_DEFINITION_VERSION = 'jetnity.admin-account-counts.v1' as const

export const ADMIN_ACCOUNT_COUNTS_WINDOW_HOURS = 720 as const

export const ADMIN_ACCOUNT_COUNTS_WINDOW_MS = ADMIN_ACCOUNT_COUNTS_WINDOW_HOURS * 3600 * 1000

export const ADMIN_ACCOUNT_COUNTS_LOCAL_FLAG = 'JETNITY_ADMIN_ACCOUNT_COUNTS_LOCAL_ENABLED'

export const ADMIN_ACCOUNT_COUNTS_WRAPPER_RPC = 'admin_account_counts_v1'

export const ADMIN_ACCOUNT_COUNTS_RESULT_KEYS = [
  'present_registered_accounts',
  'created_in_prior_30_days',
  'measured_at',
  'window_start',
  'definition_version',
] as const

export type AdminAccountCountsResultKey = (typeof ADMIN_ACCOUNT_COUNTS_RESULT_KEYS)[number]

export type AdminAccountCountsMeasures = {
  presentRegisteredAccounts: string
  createdInPrior30Days: string
  measuredAt: string
  windowStart: string
  definitionVersion: typeof ADMIN_ACCOUNT_COUNTS_DEFINITION_VERSION
}

export type AdminAccountCountsReadResult =
  | { status: 'disabled' }
  | { status: 'available'; measures: AdminAccountCountsMeasures }
  | { status: 'forbidden' }
  | { status: 'unavailable' }
  | { status: 'failed' }

export type AdminAccountCountsRpcRow = {
  present_registered_accounts: string
  created_in_prior_30_days: string
  measured_at: string
  window_start: string
  definition_version: string
}

/** Narrow expected-RPC type. Not a claim that types/supabase.ts already lists this unapplied wrapper. */
export type AdminAccountCountsExpectedRpc = {
  Functions: {
    admin_account_counts_v1: {
      Args: Record<string, never>
      Returns: AdminAccountCountsRpcRow[]
    }
  }
}
