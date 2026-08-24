import {
  bewerteApp,
  bewerteSupabaseAppZugriff,
  githubNichtKonfiguriert,
  infomaniakNichtKonfiguriert,
  vercelNichtKonfiguriert,
  wendeEvidenceAlterAn,
  type AppRuntimeSnapshot,
  type PingErgebnis,
} from './bewertung'
import { SYSTEM_HEALTH_IDS, type SystemHealthBericht, type SystemHealthItem } from './typen'

export type SystemHealthAbhaengigkeiten = {
  nowMs: () => number
  appRuntime: () => AppRuntimeSnapshot
  supabaseConfigured: () => boolean
  pingSupabase: () => Promise<PingErgebnis>
}

const CACHE_MS = 30_000
let cache: { bis: number; bericht: SystemHealthBericht } | null = null

export function leseAppRuntime(
  env: Record<string, string | undefined> = process.env,
): AppRuntimeSnapshot {
  return {
    vercelEnv: env.VERCEL_ENV?.trim() || null,
    commitSha: env.VERCEL_GIT_COMMIT_SHA?.trim() || null,
    deploymentId: env.VERCEL_DEPLOYMENT_ID?.trim() || null,
    region: env.VERCEL_REGION?.trim() || null,
  }
}

export function supabaseAppIstKonfiguriert(
  env: Record<string, string | undefined> = process.env,
): boolean {
  return Boolean(env.NEXT_PUBLIC_SUPABASE_URL?.trim() && env.NEXT_PUBLIC_SUPABASE_ANON_KEY?.trim())
}

export async function mitTimeout<T>(ms: number, arbeit: () => Promise<T>): Promise<T> {
  let timer: ReturnType<typeof setTimeout> | undefined
  try {
    return await Promise.race([
      arbeit(),
      new Promise<T>((_, reject) => {
        timer = setTimeout(() => reject(Object.assign(new Error('timeout'), { timeout: true })), ms)
      }),
    ])
  } finally {
    if (timer) clearTimeout(timer)
  }
}

async function isoliert(arbeit: () => Promise<SystemHealthItem>, fallback: SystemHealthItem): Promise<SystemHealthItem> {
  try {
    return await arbeit()
  } catch {
    return fallback
  }
}

export function leereSystemHealthCache(): void {
  cache = null
}

export async function sammleSystemHealth(
  deps: SystemHealthAbhaengigkeiten,
  options?: { ignoreCache?: boolean },
): Promise<SystemHealthBericht> {
  const nowMs = deps.nowMs()
  if (!options?.ignoreCache && cache && cache.bis > nowMs) {
    return {
      ...cache.bericht,
      items: cache.bericht.items.map((item) => wendeEvidenceAlterAn(item, nowMs)),
    }
  }

  const app = bewerteApp(deps.appRuntime(), nowMs)
  const vercel = vercelNichtKonfiguriert(nowMs)
  const github = githubNichtKonfiguriert(nowMs)
  const infomaniak = infomaniakNichtKonfiguriert(nowMs)

  const supabaseFallback = bewerteSupabaseAppZugriff({
    configured: deps.supabaseConfigured(),
    nowMs,
  })
  const supabase = await isoliert(async () => {
    if (!deps.supabaseConfigured()) {
      return bewerteSupabaseAppZugriff({ configured: false, nowMs })
    }
    try {
      const ping = await deps.pingSupabase()
      return bewerteSupabaseAppZugriff({ configured: true, ping, nowMs })
    } catch (error) {
      const timeout = Boolean(error && typeof error === 'object' && 'timeout' in error)
      return bewerteSupabaseAppZugriff({
        configured: true,
        ping: {
          ok: false,
          timeout,
          message: error instanceof Error ? error.message : 'unbekannter Fehler',
        },
        nowMs,
      })
    }
  }, supabaseFallback)

  const items = [app, vercel, supabase, github, infomaniak]
  const bericht: SystemHealthBericht = {
    checkedAt: new Date(nowMs).toISOString(),
    items,
    writeActions: [],
  }

  cache = { bis: nowMs + CACHE_MS, bericht }
  return bericht
}

export function systemHealthIdsVollstaendig(bericht: SystemHealthBericht): boolean {
  const ids = new Set(bericht.items.map((item) => item.id))
  return SYSTEM_HEALTH_IDS.every((id) => ids.has(id))
}
