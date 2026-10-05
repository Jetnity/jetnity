import type { FreshnessState, HealthFreshness } from './typen'

export function berechneFreshness(input: {
  checkedAt: string | null | undefined
  nowMs: number
  ttlMs: number
}): HealthFreshness {
  if (!input.checkedAt) {
    return { state: 'unknown', ageMs: null, ttlMs: input.ttlMs }
  }
  const geprueft = Date.parse(input.checkedAt)
  if (!Number.isFinite(geprueft)) {
    return { state: 'unknown', ageMs: null, ttlMs: input.ttlMs }
  }
  const ageMs = Math.max(0, input.nowMs - geprueft)
  const state: FreshnessState = ageMs > input.ttlMs ? 'stale' : 'fresh'
  return { state, ageMs, ttlMs: input.ttlMs }
}
