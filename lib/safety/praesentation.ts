// lib/safety/praesentation.ts
//
// Präsentationsklasse nur aus belegbaren Facts + konkreter Relevanz.
// Ohne source-backed Extreme/Advisory keine kritische Warnung.

import type {
  SafetyAdvisoryClass,
  SafetyEventCategory,
  SafetyEventStatus,
  SafetyFreshness,
  SafetyPresentationClass,
  SafetyRelevance,
  SafetySourceSeverity,
} from '@/lib/safety/domain'

const ERNSTE_KATEGORIEN = new Set<SafetyEventCategory>([
  'armed_conflict',
  'tsunami',
  'tropical_cyclone',
  'earthquake',
  'volcanic_activity',
  'flood',
  'wildfire',
  'civil_unrest',
])

export function praesentationsklasseAus(opts: {
  relevance: SafetyRelevance
  freshness: SafetyFreshness
  eventStatus: SafetyEventStatus
  sourceSeverity: SafetySourceSeverity | null
  advisoryClass: SafetyAdvisoryClass | null
  category: SafetyEventCategory
  conflict: boolean
  vertrauenswuerdig: boolean
}): SafetyPresentationClass {
  if (opts.conflict) return 'unknown'
  if (!opts.vertrauenswuerdig) return 'unknown'
  if (opts.eventStatus === 'resolved' || opts.eventStatus === 'withdrawn') return 'unknown'
  if (opts.freshness !== 'current') return 'unknown'
  if (opts.relevance !== 'affected') return 'unknown'

  if (opts.advisoryClass === 'do_not_travel' || opts.advisoryClass === 'avoid_all_travel') {
    return 'critical_warning'
  }
  if (opts.sourceSeverity === 'extreme' || opts.sourceSeverity === 'severe') {
    return 'critical_warning'
  }
  if (opts.sourceSeverity === 'moderate' || opts.advisoryClass === 'reconsider_travel') {
    return 'important_notice'
  }
  if (opts.eventStatus === 'monitoring' || opts.sourceSeverity === 'minor' || opts.advisoryClass === 'informational') {
    return 'information'
  }
  if (ERNSTE_KATEGORIEN.has(opts.category)) return 'important_notice'
  return 'information'
}
