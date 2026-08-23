// lib/safety/impact.ts
//
// Cross-Domain Recheck-Naht. Keine Mutation der Reise.

import type {
  SafetyImpact,
  SafetyNextAction,
  SafetyRelevance,
  SafetySpatialPrecision,
  SafetyTripRef,
} from '@/lib/safety/domain'
import type { SafetyItemKontext, SafetyReisekontext } from '@/lib/safety/kontext'

function itemRef(item: SafetyItemKontext): SafetyTripRef {
  return { kind: 'item', id: item.id, label: item.title }
}

function domainFuer(kind: SafetyItemKontext['kind']): SafetyImpact['domain'] | null {
  if (kind === 'flight') return 'flight'
  if (kind === 'stay') return 'stay'
  if (kind === 'activity') return 'activity'
  if (kind === 'transfer') return 'mobility'
  if (kind === 'rental_car') return 'rental_car'
  return null
}

function unique(impacts: SafetyImpact[]): SafetyImpact[] {
  const gesehen = new Set<string>()
  const liste: SafetyImpact[] = []
  for (const eintrag of [...impacts].sort((a, b) => `${a.domain}:${a.ref.id}`.localeCompare(`${b.domain}:${b.ref.id}`))) {
    const key = `${eintrag.domain}|${eintrag.ref.kind}|${eintrag.ref.id}|${eintrag.status}`
    if (gesehen.has(key)) continue
    gesehen.add(key)
    liste.push(eintrag)
  }
  return liste
}

export function safetyImpactAus(opts: {
  kontext: SafetyReisekontext
  relevance: SafetyRelevance
  precision: SafetySpatialPrecision
  affectedRefs: SafetyTripRef[]
}): SafetyImpact[] {
  if (opts.relevance === 'not_affected') return []
  if (opts.relevance !== 'affected') {
    return unique(
      opts.affectedRefs.map((ref) => ({
        domain: ref.kind === 'stage' ? 'stage' : 'readiness',
        ref,
        status: 'unknown' as const,
      })),
    )
  }

  const stageIds = new Set(opts.affectedRefs.filter((ref) => ref.kind === 'stage').map((ref) => ref.id))
  const routeOderAirport = opts.affectedRefs.some(
    (ref) => ref.kind === 'airport' || ref.kind === 'route_point',
  )
  const impacts: SafetyImpact[] = opts.affectedRefs
    .filter((ref) => ref.kind === 'stage')
    .map((ref) => ({ domain: 'stage' as const, ref, status: 'affected' as const }))

  for (const item of opts.kontext.items) {
    const domain = domainFuer(item.kind)
    if (!domain) continue
    if (item.stageId && stageIds.has(item.stageId)) {
      impacts.push({ domain, ref: itemRef(item), status: 'needs_recheck' })
    } else if (routeOderAirport && (item.kind === 'flight' || item.kind === 'transfer')) {
      impacts.push({ domain, ref: itemRef(item), status: 'needs_recheck' })
    }
  }

  for (const tag of opts.kontext.days) {
    if (tag.stageId && stageIds.has(tag.stageId)) {
      impacts.push({
        domain: 'day_plan',
        ref: { kind: 'day', id: tag.id, label: tag.dayDate ?? tag.id },
        status: 'needs_recheck',
      })
    }
  }

  if (routeOderAirport || stageIds.size > 0) {
    impacts.push({
      domain: 'readiness',
      ref: { kind: 'item', id: 'readiness', label: 'Reisevorbereitung' },
      status: 'needs_recheck',
    })
  }

  return unique(impacts)
}

export function naechsteAktionAus(
  precision: SafetySpatialPrecision,
  impacts: readonly SafetyImpact[],
  relevance: SafetyRelevance,
): SafetyNextAction {
  if (relevance !== 'affected') return 'observe'
  if (precision === 'airport' || precision === 'route') return 'check_route'
  if (impacts.some((eintrag) => eintrag.domain === 'stay')) return 'check_accommodation'
  if (impacts.some((eintrag) => eintrag.domain === 'activity')) return 'check_activity'
  if (impacts.some((eintrag) => eintrag.domain === 'mobility' || eintrag.domain === 'rental_car')) {
    return 'check_mobility'
  }
  if (impacts.some((eintrag) => eintrag.domain === 'stage')) return 'check_stage'
  if (impacts.some((eintrag) => eintrag.domain === 'flight')) return 'check_route'
  if (impacts.some((eintrag) => eintrag.domain === 'readiness')) return 'check_readiness'
  return 'observe'
}
