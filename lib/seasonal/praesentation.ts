// lib/seasonal/praesentation.ts
//
// Eigene Seasonal-Präsentation. Kein Safety-Alarm-Vokabular.
// Kategorie ist keine Severity. Outcome kommt nur source-backed.

import type {
  SeasonalFreshness,
  SeasonalOutcome,
  SeasonalPresentationClass,
  SeasonalRelevance,
} from '@/lib/seasonal/domain'

export function praesentationsklasseAus(opts: {
  relevance: SeasonalRelevance
  freshness: SeasonalFreshness
  outcome: SeasonalOutcome
  conflict: boolean
  vertrauenswuerdig: boolean
}): SeasonalPresentationClass {
  if (opts.conflict) return 'unknown'
  if (!opts.vertrauenswuerdig) return 'unknown'
  if (opts.freshness !== 'current') return 'unknown'
  if (opts.relevance !== 'applies') return 'unknown'
  if (opts.outcome === 'less_favorable') return 'timing_check'
  if (opts.outcome === 'mixed_tradeoff') return 'timing_notice'
  if (opts.outcome === 'favorable_context') return 'information'
  return 'unknown'
}
