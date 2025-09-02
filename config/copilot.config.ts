/* config/copilot.config.ts
 * Konfiguration für Jetnity CoPilot Pro – keine Secrets, nur public-safe Defaults.
 * Module, Modell-Defaults, Limits & Feature-Flags zentral steuerbar.
 */

const toInt = (v: string | undefined, def: number) => {
  const n = Number.parseInt(String(v ?? ''), 10)
  return Number.isFinite(n) ? n : def
}
const toFloat = (v: string | undefined, def: number) => {
  const n = Number.parseFloat(String(v ?? ''))
  return Number.isFinite(n) ? n : def
}

export type CopilotModuleKey =
  | 'mediaStudio'
  | 'creatorHub'
  | 'feed'
  | 'analytics'
  | 'search'
  | 'blog'

export type CopilotModuleConfig = {
  enabled: boolean
  /** 1 (höchste Pri.) – 5 (niedrigste) */
  priority: 1 | 2 | 3 | 4 | 5
  description: string
}

export const CopilotModules: Record<CopilotModuleKey, CopilotModuleConfig> = Object.freeze({
  mediaStudio: {
    enabled: true,
    priority: 1,
    description: 'Bearbeitung, Snippets, Smart-Tools, Asset-Generierung',
  },
  creatorHub: {
    enabled: true,
    priority: 2,
    description: 'Profile, Uploads, Kollaboration, Monetarisierung',
  },
  analytics: {
    enabled: true,
    priority: 2,
    description: 'Impact Score, KPIs, Alerts, Heatmaps',
  },
  feed: {
    enabled: true,
    priority: 3,
    description: 'Kuratiertes Ranking, Empfehlungen, Qualitätskontrollen',
  },
  search: {
    enabled: true,
    priority: 3,
    description: 'Reisesuche: Query-Verständnis, Autovervollständigung',
  },
  blog: {
    enabled: true,
    priority: 4,
    description: 'Themenvorschläge, Zusammenfassungen, Kommentare',
  },
})

/** Modell-Vorgaben (public-safe). Runtime-Secrets bleiben in Servercode. */
export const CopilotModels = Object.freeze({
  textModel: process.env.NEXT_PUBLIC_COPILOT_TEXT_MODEL?.trim() || 'gpt-4o-mini',
  imageModel:
    process.env.NEXT_PUBLIC_COPILOT_IMAGE_MODEL?.trim() || 'dall-e-3', // Platzhalter – echte Auswahl im Servercode
  maxTokens: toInt(process.env.NEXT_PUBLIC_COPILOT_MAX_TOKENS, 1200),
  temperature: toFloat(process.env.NEXT_PUBLIC_COPILOT_TEMPERATURE, 0.7),
})

/** Generelle Defaults & Richtlinien für den Agenten. */
export const CopilotDefaults = Object.freeze({
  cacheTtlSec: toInt(process.env.NEXT_PUBLIC_COPILOT_CACHE_TTL, 60),
  persona: {
    name: 'CoPilot Pro',
    tone: 'präzise, freundlich, proaktiv',
    localeFallback: 'de',
  },
  safety: {
    allowExternalLinks: true,
    maxConcurrentTasks: toInt(process.env.NEXT_PUBLIC_COPILOT_MAX_CONCURRENCY, 4),
  },
})

export function isModuleEnabled(key: CopilotModuleKey): boolean {
  return CopilotModules[key]?.enabled ?? false
}

export const CopilotConfig = Object.freeze({
  modules: CopilotModules,
  models: CopilotModels,
  defaults: CopilotDefaults,
})
export type CopilotConfig = typeof CopilotConfig
