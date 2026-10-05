import type { AdminDenial } from '@/lib/auth/admin-access'
import {
  FRESHNESS_LABEL,
  HEALTH_STATUS_LABEL,
  type HealthFreshness,
  type HealthStatus,
  type SystemHealthId,
} from '@/lib/admin/system-health/typen'

export const ANALYST_INSIGHT_KIND = 'deterministic-source' as const

export const ANALYST_MATERIALITY = ['attention', 'coverage', 'none'] as const
export type AnalystMateriality = (typeof ANALYST_MATERIALITY)[number]

export const ANALYST_SAFE_HREFS = ['/admin/system-health'] as const
export type AnalystSafeHref = (typeof ANALYST_SAFE_HREFS)[number]

export type AnalystObserved =
  | HealthStatus
  | 'access_denied'
  | 'lookup-failed'
  | 'source_failed'
  | 'partial_failed'

/** Exact AdminDenial → observed. `aal-lookup-failed` is unavailable, not a distinct observed token. */
export const ANALYST_DENIAL_TO_OBSERVED: Record<
  AdminDenial,
  Extract<AnalystObserved, 'access_denied' | 'lookup-failed'>
> = {
  unauthenticated: 'access_denied',
  forbidden: 'access_denied',
  'aal2-required': 'access_denied',
  'lookup-failed': 'lookup-failed',
  'aal-lookup-failed': 'lookup-failed',
}

export type AnalystAccess =
  | { status: 'allowed'; grant: 'role' | 'break-glass' }
  | { status: 'denied'; denial: AdminDenial }

export type AnalystObservationScope = 'none' | 'process-recent'

export type AnalystAttribution = 'none' | 'process-recent' | 'not_attributed'

export type AnalystNext =
  | { href: AnalystSafeHref; label: string; kind: 'investigate' }
  | null

export type AnalystInsight = {
  id: string
  kind: typeof ANALYST_INSIGHT_KIND
  category: 'system-health'
  sourceItemId: SystemHealthId | 'system-health-collection'
  sourceCheckId: string | null
  sourceRef: string
  observed: AnalystObserved
  freshness: HealthFreshness
  checkedAt: string | null
  materiality: AnalystMateriality
  attribution: AnalystAttribution
  title: string
  explanation: string
  proves: string
  doesNotProve: string
  limitations: readonly string[]
  next: AnalystNext
}

export type AnalystCoverage = {
  evidenced: readonly string[]
  notConfigured: readonly string[]
  unknown: readonly string[]
  failed: readonly string[]
  notAttributed: readonly string[]
}

export type AnalystBericht = {
  generatedAt: string
  sourceCheckedAt: string | null
  source: 'system-health'
  observationScope: AnalystObservationScope
  access: AnalystAccess
  insights: AnalystInsight[]
  coverage: AnalystCoverage
  writeActions: []
  modelExplanation: { enabled: false }
}

export const ANALYST_OBSERVED_LABEL: Record<AnalystObserved, string> = {
  healthy: HEALTH_STATUS_LABEL.healthy,
  degraded: HEALTH_STATUS_LABEL.degraded,
  unavailable: HEALTH_STATUS_LABEL.unavailable,
  unknown: HEALTH_STATUS_LABEL.unknown,
  not_configured: HEALTH_STATUS_LABEL.not_configured,
  access_denied: 'Zugang verweigert',
  'lookup-failed': 'Prüfung nicht möglich',
  source_failed: 'Quelle fehlgeschlagen',
  partial_failed: 'Unvollständig',
}

export const ANALYST_FRESHNESS_LABEL = FRESHNESS_LABEL

export const ANALYST_UNTERSUCHEN: AnalystNext = {
  href: '/admin/system-health',
  label: 'System Health öffnen',
  kind: 'investigate',
}

export const DATENBANKGESTUETZTE_SYSTEM_HEALTH_CHECKS = ['supabase-app-datenzugriff'] as const

export const ERWARTETE_NICHT_KONFIGURIERTE_IDS = [
  'vercel',
  'github',
  'infomaniak',
  'supabase-management',
] as const
