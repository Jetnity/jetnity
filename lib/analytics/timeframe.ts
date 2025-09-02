// lib/analytics/timeframe.ts
// Gemeinsame Helpers für "range" (30|90|180|all) → days | 'all' + since/until

export const TIMEFRAME_DEFS = {
  '30':  { key: '30',  days: 30 as const,  label: 'Letzte 30 Tage' },
  '90':  { key: '90',  days: 90 as const,  label: 'Letzte 90 Tage' },
  '180': { key: '180', days: 180 as const, label: 'Letzte 180 Tage' },
  'all': { key: 'all', days: 'all' as const, label: 'Gesamt' },
} as const

export type TimeframeKey = keyof typeof TIMEFRAME_DEFS
export type DaysOrAll = typeof TIMEFRAME_DEFS[TimeframeKey]['days']

export type Timeframe = {
  key: TimeframeKey
  days: DaysOrAll
  label: string
  /** ISO-String oder null bei 'all' */
  since: string | null
  /** ISO-String (jetzt) */
  until: string
}

/** Ungültige Werte fallen auf fallbackKey (standard: '90') zurück. */
export function normalizeTimeframeKey(
  raw: string | null | undefined,
  fallbackKey: TimeframeKey = '90'
): TimeframeKey {
  const v = (raw ?? '').toLowerCase()
  return (v in TIMEFRAME_DEFS ? (v as TimeframeKey) : fallbackKey)
}

/** Liefert kompletten Timeframe inkl. ISO since/until. */
export function getTimeframe(
  keyOrRaw?: string | null,
  fallbackKey: TimeframeKey = '90'
): Timeframe {
  const key = normalizeTimeframeKey(keyOrRaw, fallbackKey)
  const def = TIMEFRAME_DEFS[key]
  const now = Date.now()
  const until = new Date(now).toISOString()
  const since =
    def.days === 'all' ? null : new Date(now - def.days * 24 * 60 * 60 * 1000).toISOString()
  return { key, days: def.days, label: def.label, since, until }
}

/**
 * Liest den Param aus Next.js searchParams (Record oder URLSearchParams) und
 * gibt den normalisierten Timeframe zurück.
 */
export function timeframeFromSearch(
  searchParams:
    | URLSearchParams
    | Record<string, string | string[] | undefined>
    | null
    | undefined,
  param = 'range',
  fallbackKey: TimeframeKey = '90'
): Timeframe {
  let raw: string | null = null
  if (searchParams instanceof URLSearchParams) {
    raw = searchParams.get(param)
  } else if (searchParams && typeof searchParams === 'object') {
    const v = searchParams[param]
    raw = Array.isArray(v) ? v[0] ?? null : v ?? null
  }
  return getTimeframe(raw, fallbackKey)
}

/** Hilft beim Supabase-Query: nur anwenden, wenn since != null */
export function applySinceFilter<T extends { gte: (c: string, v: string) => T }>(
  query: T,
  since: string | null,
  column = 'created_at'
): T {
  return since ? query.gte(column, since) : query
}
