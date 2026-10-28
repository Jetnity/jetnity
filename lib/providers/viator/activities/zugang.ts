import { VIATOR_SANDBOX_API_KEY_ENV, VIATOR_SANDBOX_CALLS_ENV } from '@/lib/providers/viator/activities/contracts'

export type ViatorSandboxEnv = {
  VERCEL_ENV?: string
  VIATOR_SANDBOX_CALLS?: string
  VIATOR_SANDBOX_API_KEY?: string
  VIATOR_API_ORIGIN?: string
}

export type ViatorSandboxBlockReason = 'disabled' | 'missing_key' | 'production_blocked'

export type ViatorSandboxZugang =
  | { ok: true }
  | { ok: false; reason: ViatorSandboxBlockReason }

/**
 * Default closed. A Production environment cannot enable the client.
 * VIATOR_API_ORIGIN is intentionally unread: the host is a constant.
 */
export function viatorSandboxZugang(env: ViatorSandboxEnv): ViatorSandboxZugang {
  if (env.VERCEL_ENV === 'production') return { ok: false, reason: 'production_blocked' }
  if (env[VIATOR_SANDBOX_CALLS_ENV] !== 'true') return { ok: false, reason: 'disabled' }
  const key = env[VIATOR_SANDBOX_API_KEY_ENV]
  if (typeof key !== 'string' || !/^[A-Za-z0-9-]{8,256}$/.test(key)) return { ok: false, reason: 'missing_key' }
  return { ok: true }
}
