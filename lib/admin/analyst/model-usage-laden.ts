import type { AdminDecision } from '@/lib/auth/admin-access'
import { reachesDatabase } from '@/lib/auth/admin-access'
import type { ProviderOpsBoardBericht } from '@/lib/admin/provider-ops-board/typen'
import { leiteModelUsageInsights } from './model-usage-insights'
import {
  MODEL_USAGE_ACCESS_CAPABILITY,
  MODEL_USAGE_ACCESS_SURFACE,
  type ModelUsageBericht,
} from './model-usage-typen'

export { MODEL_USAGE_ACCESS_CAPABILITY, MODEL_USAGE_ACCESS_SURFACE }

export type ModelUsageZugang = AdminDecision

export type ModelUsageLadenAbhaengigkeiten = {
  evaluateAccess: () => Promise<ModelUsageZugang>
  ladeBoard: () => Promise<ProviderOpsBoardBericht>
  nowMs: () => number
}

async function standardZugang(): Promise<ModelUsageZugang> {
  const { evaluateAdminAccess } = await import('@/lib/auth/admin-guard')
  return evaluateAdminAccess({
    capability: MODEL_USAGE_ACCESS_CAPABILITY,
    surface: MODEL_USAGE_ACCESS_SURFACE,
  })
}

async function standardBoard(): Promise<ProviderOpsBoardBericht> {
  const { ladeProviderOpsBoardFuerSeite } = await import('@/lib/admin/provider-ops-board/runtime')
  return ladeProviderOpsBoardFuerSeite()
}

export async function ladeModelUsageBericht(
  deps?: Partial<ModelUsageLadenAbhaengigkeiten>,
): Promise<ModelUsageBericht> {
  const evaluateAccess = deps?.evaluateAccess ?? standardZugang
  const ladeBoard = deps?.ladeBoard ?? standardBoard
  const nowMs = deps?.nowMs ?? Date.now

  const zugang = await evaluateAccess()

  if (!zugang.allowed) {
    return leiteModelUsageInsights({
      access: { status: 'denied', denial: zugang.denial },
      nowMs: nowMs(),
    })
  }

  if (!reachesDatabase(zugang) || zugang.grant === 'break-glass') {
    return leiteModelUsageInsights({
      access: { status: 'allowed', grant: 'break-glass' },
      nowMs: nowMs(),
    })
  }

  try {
    const board = await ladeBoard()
    return leiteModelUsageInsights({
      access: { status: 'allowed', grant: 'role' },
      board,
      nowMs: nowMs(),
    })
  } catch {
    return leiteModelUsageInsights({
      access: { status: 'allowed', grant: 'role' },
      sourceFailed: true,
      nowMs: nowMs(),
    })
  }
}
