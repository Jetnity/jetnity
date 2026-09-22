import 'server-only'

import { evaluateAdminAccess } from '@/lib/auth/admin-guard'
import type { AdminDecision } from '@/lib/auth/admin-access'
import { createServerComponentClient } from '@/lib/supabase/server'
import { isAdminAccountCountsRuntimeEnabled } from '@/lib/admin/account-counts-delivery/activation'
import {
  type AdminAccountCountsExpectedRpc,
  type AdminAccountCountsReadResult,
} from '@/lib/admin/account-counts-delivery/contract'
import { parseAdminAccountCountsPayload } from '@/lib/admin/account-counts-delivery/parser'

export type AdminAccountCountsAccessDecision =
  | { allowed: true; grant: 'role' | 'break-glass' }
  | { allowed: false; kind: 'forbidden' | 'failed' }

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

export function classifyAdminAccountCountsRpcError(
  error: AdminAccountCountsRpcError,
  status?: number,
): Exclude<AdminAccountCountsReadResult['status'], 'disabled' | 'available'> {
  const code = (error.code ?? '').trim()
  if (MISSING_FUNCTION.has(code)) return 'unavailable'
  if (FORBIDDEN.has(code) || status === 401 || status === 403) return 'forbidden'
  if (status === 0) return 'failed'
  return 'failed'
}

export function mapAdminAccessToAccountCountsDecision(
  decision: AdminDecision,
): AdminAccountCountsAccessDecision {
  if (decision.allowed) {
    return { allowed: true, grant: decision.grant }
  }
  if (decision.denial === 'lookup-failed' || decision.denial === 'aal-lookup-failed') {
    return { allowed: false, kind: 'failed' }
  }
  return { allowed: false, kind: 'forbidden' }
}

export async function readAdminAccountCounts(options: {
  enabled: boolean
  gate: AdminAccountCountsAccessGate
  rpc: AdminAccountCountsRpcCall
}): Promise<AdminAccountCountsReadResult> {
  if (!options.enabled) return { status: 'disabled' }

  let access: AdminAccountCountsAccessDecision
  try {
    access = await options.gate()
  } catch {
    return { status: 'failed' }
  }
  if (!access.allowed) return { status: access.kind }
  if (access.grant !== 'role') return { status: 'forbidden' }

  let response: AdminAccountCountsRpcResponse
  try {
    response = await options.rpc()
  } catch {
    return { status: 'failed' }
  }

  if (response.error) {
    return { status: classifyAdminAccountCountsRpcError(response.error, response.status) }
  }

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
  return client.rpc('admin_account_counts_v1')
}

export async function loadAdminAccountCountsFromDependencies(options: {
  runtimeEnabled: boolean
  gate: AdminAccountCountsAccessGate
  rpc: AdminAccountCountsRpcCall
}): Promise<AdminAccountCountsReadResult> {
  return readAdminAccountCounts({
    enabled: options.runtimeEnabled,
    gate: options.gate,
    rpc: options.rpc,
  })
}

async function defaultAccountCountsGate(): Promise<AdminAccountCountsAccessDecision> {
  const decision = await evaluateAdminAccess({
    capability: 'konten-verwalten',
    surface: 'admin-account-counts',
  })
  return mapAdminAccessToAccountCountsDecision(decision)
}

async function defaultAccountCountsRpc(): Promise<AdminAccountCountsRpcResponse> {
  const client = await createServerComponentClient()
  return invokeAdminAccountCountsWrapper(client as unknown as WrapperClient)
}

/**
 * Runtime loader. Accepts no environment snapshot. A synthetic activation
 * object passed as a leftover argument is ignored.
 */
export async function loadAdminAccountCounts(): Promise<AdminAccountCountsReadResult> {
  return loadAdminAccountCountsFromDependencies({
    runtimeEnabled: isAdminAccountCountsRuntimeEnabled(),
    gate: defaultAccountCountsGate,
    rpc: defaultAccountCountsRpc,
  })
}

export async function containAdminAccountCountsLoad(
  load: () => Promise<AdminAccountCountsReadResult> = loadAdminAccountCounts,
): Promise<AdminAccountCountsReadResult> {
  try {
    return await load()
  } catch {
    return { status: 'failed' }
  }
}
