import { VIATOR_SANDBOX_API_KEY_ENV, VIATOR_SANDBOX_CALLS_ENV } from '@/lib/providers/viator/activities/contracts'

export type ViatorSandboxEnv = {
  VERCEL_ENV?: string
  VIATOR_SANDBOX_CALLS?: string
  VIATOR_SANDBOX_API_KEY?: string
  VIATOR_API_ORIGIN?: string
}

export type ViatorSandboxBlockReason = 'disabled' | 'missing_key' | 'production_blocked' | 'environment_blocked'

export type ViatorSandboxZugang =
  | { ok: true }
  | { ok: false; reason: ViatorSandboxBlockReason }

const VIATOR_SANDBOX_UMGEBUNGEN = ['preview', 'development'] as const

/**
 * Default closed. The real client opens only for an exact `preview` or
 * `development` value. Missing, empty, unknown, Production, and malformed
 * values stay closed before any transport call. A missing calls flag stays
 * `disabled`. An unusable key stays `missing_key`.
 * VIATOR_API_ORIGIN is intentionally unread: the host is a constant.
 */
export function viatorSandboxZugang(env: ViatorSandboxEnv): ViatorSandboxZugang {
  if (env.VERCEL_ENV === 'production') return { ok: false, reason: 'production_blocked' }
  if (env[VIATOR_SANDBOX_CALLS_ENV] !== 'true') return { ok: false, reason: 'disabled' }
  const key = env[VIATOR_SANDBOX_API_KEY_ENV]
  if (typeof key !== 'string' || !/^[A-Za-z0-9-]{8,256}$/.test(key)) return { ok: false, reason: 'missing_key' }
  if (!VIATOR_SANDBOX_UMGEBUNGEN.some((erlaubt) => env.VERCEL_ENV === erlaubt)) {
    return { ok: false, reason: 'environment_blocked' }
  }
  return { ok: true }
}
