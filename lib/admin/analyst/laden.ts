import type { AdminDecision } from '@/lib/auth/admin-access'
import type { SystemHealthBericht } from '@/lib/admin/system-health/typen'
import { leiteSystemHealthInsights } from './system-health-insights'
import type { AnalystBericht } from './typen'

export const ANALYST_ACCESS_SURFACE = 'admin-home-analyst'
export const ANALYST_ACCESS_CAPABILITY = 'betrieb-lesen' as const

export type AnalystZugang = AdminDecision

export type AnalystLadenAbhaengigkeiten = {
  evaluateAccess: () => Promise<AnalystZugang>
  ladeBericht: () => Promise<SystemHealthBericht>
  nowMs: () => number
}

async function standardZugang(): Promise<AnalystZugang> {
  const { evaluateAdminAccess } = await import('@/lib/auth/admin-guard')
  return evaluateAdminAccess({
    capability: ANALYST_ACCESS_CAPABILITY,
    surface: ANALYST_ACCESS_SURFACE,
  })
}

async function standardBericht(): Promise<SystemHealthBericht> {
  const { ladeSystemHealthFuerSeite } = await import('@/lib/admin/system-health/runtime')
  return ladeSystemHealthFuerSeite()
}

export async function ladeAnalystBericht(
  deps?: Partial<AnalystLadenAbhaengigkeiten>,
): Promise<AnalystBericht> {
  const evaluateAccess = deps?.evaluateAccess ?? standardZugang
  const ladeBericht = deps?.ladeBericht ?? standardBericht
  const nowMs = deps?.nowMs ?? Date.now

  const zugang = await evaluateAccess()

  if (!zugang.allowed) {
    return leiteSystemHealthInsights({
      access: { status: 'denied', denial: zugang.denial },
      nowMs: nowMs(),
    })
  }

  try {
    const bericht = await ladeBericht()
    return leiteSystemHealthInsights({
      access: { status: 'allowed', grant: zugang.grant },
      bericht,
      nowMs: nowMs(),
    })
  } catch {
    return leiteSystemHealthInsights({
      access: { status: 'allowed', grant: zugang.grant },
      sourceFailed: true,
      nowMs: nowMs(),
    })
  }
}
