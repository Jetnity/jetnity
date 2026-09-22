import type { AdminDenial } from '@/lib/auth/admin-access'
import {
  FRESHNESS_LABEL,
  type BoardFreshness,
  type ProviderOpsBoardStatus,
} from '@/lib/admin/provider-ops-board/typen'

export const MODEL_USAGE_INSIGHT_KIND = 'deterministic-source' as const
export const MODEL_USAGE_SOURCE = 'model-usage' as const
export const MODEL_USAGE_ITEM_ID = 'model-usage' as const
export const MODEL_USAGE_TTL_MS = 120_000
export const MODEL_USAGE_ACCESS_CAPABILITY = 'betrieb-lesen' as const
export const MODEL_USAGE_ACCESS_SURFACE = 'admin-home-model-usage' as const

export const MODEL_USAGE_MATERIALITY = ['attention', 'coverage', 'none'] as const
export type ModelUsageMateriality = (typeof MODEL_USAGE_MATERIALITY)[number]

export const MODEL_USAGE_SAFE_HREFS = ['/admin/provider-ops'] as const
export type ModelUsageSafeHref = (typeof MODEL_USAGE_SAFE_HREFS)[number]

export type ModelUsageObserved =
  | ProviderOpsBoardStatus
  | 'access_denied'
  | 'lookup-failed'
  | 'source_failed'
  | 'partial_failed'

/** Exact AdminDenial → observed. `aal-lookup-failed` is unavailable, not a distinct observed token. */
export const MODEL_USAGE_DENIAL_TO_OBSERVED: Record<
  AdminDenial,
  Extract<ModelUsageObserved, 'access_denied' | 'lookup-failed'>
> = {
  unauthenticated: 'access_denied',
  forbidden: 'access_denied',
  'aal2-required': 'access_denied',
  'lookup-failed': 'lookup-failed',
  'aal-lookup-failed': 'lookup-failed',
}

export type ModelUsageAccess =
  | { status: 'allowed'; grant: 'role' | 'break-glass' }
  | { status: 'denied'; denial: AdminDenial }

export type ModelUsageObservationScope = 'none' | 'process-recent'

export type ModelUsageAttribution = 'none' | 'process-recent' | 'not_attributed'

export type ModelUsageNext =
  | { href: ModelUsageSafeHref; label: string; kind: 'investigate' }
  | null

export type ModelUsageInsight = {
  id: string
  kind: typeof MODEL_USAGE_INSIGHT_KIND
  category: typeof MODEL_USAGE_SOURCE
  sourceItemId: typeof MODEL_USAGE_ITEM_ID
  sourceCheckId: string | null
  sourceRef: typeof MODEL_USAGE_SOURCE
  observed: ModelUsageObserved
  freshness: BoardFreshness
  checkedAt: string | null
  materiality: ModelUsageMateriality
  attribution: ModelUsageAttribution
  title: string
  explanation: string
  proves: string
  doesNotProve: string
  limitations: readonly string[]
  next: ModelUsageNext
}

export type ModelUsageCoverage = {
  evidenced: readonly string[]
  notConfigured: readonly string[]
  unknown: readonly string[]
  failed: readonly string[]
  notAttributed: readonly string[]
}

export type ModelUsageBericht = {
  generatedAt: string
  sourceCheckedAt: string | null
  source: typeof MODEL_USAGE_SOURCE
  observationScope: ModelUsageObservationScope
  access: ModelUsageAccess
  insights: ModelUsageInsight[]
  coverage: ModelUsageCoverage
  writeActions: []
  modelExplanation: { enabled: false }
}

export const MODEL_USAGE_OBSERVED_LABEL: Record<ModelUsageObserved, string> = {
  available: 'Lesbar',
  empty: 'Keine Einträge',
  unavailable: 'Nicht erreichbar',
  unknown: 'Unbekannt',
  foundation_only: 'Nur Foundation',
  disabled: 'Abgeschaltet',
  not_configured: 'Nicht konfiguriert',
  access_denied: 'Zugang verweigert',
  'lookup-failed': 'Prüfung nicht möglich',
  source_failed: 'Quelle fehlgeschlagen',
  partial_failed: 'Unvollständig',
}

export const MODEL_USAGE_FRESHNESS_LABEL = FRESHNESS_LABEL

export const MODEL_USAGE_UNTERSUCHEN: ModelUsageNext = {
  href: '/admin/provider-ops',
  label: 'Provider & Kosten öffnen',
  kind: 'investigate',
}

export const LEERE_MODEL_USAGE_ABDECKUNG: ModelUsageCoverage = {
  evidenced: [],
  notConfigured: [],
  unknown: [],
  failed: [],
  notAttributed: [],
}
