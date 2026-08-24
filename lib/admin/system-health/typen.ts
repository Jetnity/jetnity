export const SYSTEM_HEALTH_IDS = ['app', 'vercel', 'supabase', 'github', 'infomaniak'] as const

export type SystemHealthId = (typeof SYSTEM_HEALTH_IDS)[number]

export const HEALTH_STATUSES = [
  'healthy',
  'degraded',
  'unavailable',
  'unknown',
  'not_configured',
] as const

export type HealthStatus = (typeof HEALTH_STATUSES)[number]

export const FRESHNESS_STATES = ['fresh', 'stale', 'unknown'] as const

export type FreshnessState = (typeof FRESHNESS_STATES)[number]

export type HealthFreshness = {
  state: FreshnessState
  ageMs: number | null
  ttlMs: number
}

export type SystemHealthItem = {
  id: SystemHealthId
  name: string
  status: HealthStatus
  source: string
  checkedAt: string
  sourceUpdatedAt?: string
  freshness: HealthFreshness
  summary: string
  detail?: string
  proves: string
  doesNotProve: string
  metadata?: Record<string, string | null>
}

export type SystemHealthBericht = {
  checkedAt: string
  items: SystemHealthItem[]
  writeActions: []
}

export const SYSTEM_HEALTH_NAMEN: Record<SystemHealthId, string> = {
  app: 'App / Deployment',
  vercel: 'Vercel',
  supabase: 'Supabase',
  github: 'GitHub / CI',
  infomaniak: 'Infomaniak',
}

export const SYSTEM_HEALTH_TTL_MS: Record<SystemHealthId, number> = {
  app: 60_000,
  vercel: 120_000,
  supabase: 60_000,
  github: 300_000,
  infomaniak: 300_000,
}

export const HEALTH_STATUS_LABEL: Record<HealthStatus, string> = {
  healthy: 'Gesund',
  degraded: 'Eingeschränkt',
  unavailable: 'Nicht erreichbar',
  unknown: 'Unbekannt',
  not_configured: 'Nicht konfiguriert',
}

export const FRESHNESS_LABEL: Record<FreshnessState, string> = {
  fresh: 'frisch',
  stale: 'veraltet',
  unknown: 'Alter unbekannt',
}

/** Sichtbares Grün nur bei frischer, realer Bestätigung. */
export function healthKarteIstGruen(item: Pick<SystemHealthItem, 'status' | 'freshness'>): boolean {
  return item.status === 'healthy' && item.freshness.state === 'fresh'
}

export const SYSTEM_HEALTH_WRITE_ACTIONS: readonly never[] = []

export const SYSTEM_HEALTH_API_PFAD = '/api/admin/system-health'
