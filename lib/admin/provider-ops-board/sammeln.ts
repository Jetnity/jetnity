import {
  bewerteCostGuard,
  bewerteKillSwitch,
  bewerteModelUsage,
  bewerteProviderOps,
  wendeEvidenceAlterAn,
  type DomainZustandSnapshot,
  type ModelUsageSnapshot,
} from './bewertung'
import { PROVIDER_OPS_BOARD_IDS, type ProviderOpsBoardBericht, type ProviderOpsBoardItem } from './typen'

export type ProviderOpsBoardAbhaengigkeiten = {
  nowMs: () => number
  vercelEnv: () => string | null
  domainZustaende: () => DomainZustandSnapshot[]
  liesModelUsage: () => Promise<ModelUsageSnapshot>
}

const CACHE_MS = 30_000
let cache: { bis: number; bericht: ProviderOpsBoardBericht } | null = null

export function leereProviderOpsBoardCache(): void {
  cache = null
}

async function isoliert(
  arbeit: () => Promise<ProviderOpsBoardItem>,
  fallback: ProviderOpsBoardItem,
): Promise<ProviderOpsBoardItem> {
  try {
    return await arbeit()
  } catch {
    return fallback
  }
}

export async function sammleProviderOpsBoard(
  deps: ProviderOpsBoardAbhaengigkeiten,
  options?: { ignoreCache?: boolean },
): Promise<ProviderOpsBoardBericht> {
  const nowMs = deps.nowMs()
  if (!options?.ignoreCache && cache && cache.bis > nowMs) {
    return {
      ...cache.bericht,
      items: cache.bericht.items.map((item) => wendeEvidenceAlterAn(item, nowMs)),
    }
  }

  const providerOps = bewerteProviderOps(deps.domainZustaende(), nowMs)
  const killSwitch = bewerteKillSwitch({ vercelEnv: deps.vercelEnv(), nowMs })
  const costGuard = bewerteCostGuard(nowMs)
  const usageFallback = bewerteModelUsage({ nowMs })
  const modelUsage = await isoliert(async () => {
    try {
      const usage = await deps.liesModelUsage()
      return bewerteModelUsage({ nowMs, usage })
    } catch (error) {
      const timeout = Boolean(error && typeof error === 'object' && 'timeout' in error)
      return bewerteModelUsage({
        nowMs,
        usage: {
          ok: false,
          timeout,
          message: error instanceof Error ? error.message : 'unbekannter Fehler',
        },
      })
    }
  }, usageFallback)

  const bericht: ProviderOpsBoardBericht = {
    checkedAt: new Date(nowMs).toISOString(),
    items: [providerOps, killSwitch, costGuard, modelUsage],
    writeActions: [],
  }
  cache = { bis: nowMs + CACHE_MS, bericht }
  return bericht
}

export function providerOpsBoardIdsVollstaendig(bericht: ProviderOpsBoardBericht): boolean {
  const ids = new Set(bericht.items.map((item) => item.id))
  return PROVIDER_OPS_BOARD_IDS.every((id) => ids.has(id))
}
