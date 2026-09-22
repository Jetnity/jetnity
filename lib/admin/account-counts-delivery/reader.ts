import 'server-only'

import { evaluateAdminAccess } from '@/lib/auth/admin-guard'
import { createServerComponentClient } from '@/lib/supabase/server'
import {
  adminAccountCountsActivationEnvFromProcess,
  isAdminAccountCountsLocallyEnabled,
  type AdminAccountCountsActivationEnv,
} from '@/lib/admin/account-counts-delivery/activation'
import {
  ADMIN_ACCOUNT_COUNTS_WRAPPER_RPC,
  type AdminAccountCountsExpectedRpc,
  type AdminAccountCountsReadResult,
} from '@/lib/admin/account-counts-delivery/contract'
import { parseAdminAccountCountsPayload } from '@/lib/admin/account-counts-delivery/parser'

export type AdminAccountCountsAccessDecision =
  | { allowed: true; grant: 'role' | 'break-glass' }
  | { allowed: false }

export type AdminAccountCountsAccessGate = () => Promise<AdminAccountCountsAccessDecision>

export type AdminAccountCountsRpcError = {
  code?: string | null
  message?: string | null
}

export type AdminAccountCountsRpcResponse = {
  data: unknown
  error: AdminAccountCountsRpcError | null
  status?: number
}

export type AdminAccountCountsRpcCall = () => Promise<AdminAccountCountsRpcResponse>

const MISSING_FUNCTION = new Set(['42883', 'PGRST202'])
const FORBIDDEN = new Set(['42501', '42503', 'PGRST301', 'PGRST302'])

function classifyRpcError(error: AdminAccountCountsRpcError, status?: number): Exclude<
  AdminAccountCountsReadResult['status'],
  'disabled' | 'available'
> {
  const code = (error.code ?? '').trim()
  if (MISSING_FUNCTION.has(code)) return 'unavailable'
  if (FORBIDDEN.has(code) || status === 401 || status === 403) return 'forbidden'
  const message = (error.message ?? '').toLowerCase()
  if (message.includes('could not find the function') || message.includes('does not exist')) {
    return 'unavailable'
  }
  if (message.includes('permission denied') || message.includes('not authorized')) {
    return 'forbidden'
  }
  if (status === 0) return 'failed'
  return 'failed'
}

export async function readAdminAccountCounts(options: {
  enabled: boolean
  gate: AdminAccountCountsAccessGate
  rpc: AdminAccountCountsRpcCall
}): Promise<AdminAccountCountsReadResult> {
  if (!options.enabled) return { status: 'disabled' }

  const access = await options.gate()
  if (!access.allowed || access.grant !== 'role') return { status: 'forbidden' }

  let response: AdminAccountCountsRpcResponse
  try {
    response = await options.rpc()
  } catch {
    return { status: 'failed' }
  }

  if (response.error) return { status: classifyRpcError(response.error, response.status) }

  const parsed = parseAdminAccountCountsPayload(response.data)
  if (!parsed.ok) return { status: 'failed' }
  return { status: 'available', measures: parsed.measures }
}

type WrapperClient = {
  rpc: (
    name: keyof AdminAccountCountsExpectedRpc['Functions'],
  ) => Promise<AdminAccountCountsRpcResponse>
}

export async function invokeAdminAccountCountsWrapper(
  client: WrapperClient,
): Promise<AdminAccountCountsRpcResponse> {
  return client.rpc(ADMIN_ACCOUNT_COUNTS_WRAPPER_RPC)
}

export async function loadAdminAccountCounts(
  env?: AdminAccountCountsActivationEnv,
): Promise<AdminAccountCountsReadResult> {
  const enabled = isAdminAccountCountsLocallyEnabled(
    env ?? adminAccountCountsActivationEnvFromProcess(),
  )
  if (!enabled) return { status: 'disabled' }

  return readAdminAccountCounts({
    enabled: true,
    gate: async () => {
      const decision = await evaluateAdminAccess({
        capability: 'konten-verwalten',
        surface: 'admin-account-counts',
      })
      if (!decision.allowed) return { allowed: false }
      return { allowed: true, grant: decision.grant }
    },
    rpc: async () => {
      const client = await createServerComponentClient()
      return invokeAdminAccountCountsWrapper(client as unknown as WrapperClient)
    },
  })
}
