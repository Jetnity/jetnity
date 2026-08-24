// lib/seasonal/impact.ts
//
// Konservative Cross-Domain-Naht. Keine erfundenen Ausfälle, keine Mutation.

import type {
  SeasonalImpact,
  SeasonalImpactDomain,
  SeasonalNextAction,
  SeasonalRelevance,
  SeasonalSpatialPrecision,
  SeasonalTripRef,
} from '@/lib/seasonal/domain'
import { effektiveItemStageId, type SeasonalItemKontext, type SeasonalReisekontext } from '@/lib/seasonal/kontext'

function itemRef(item: SeasonalItemKontext): SeasonalTripRef {
  return { kind: 'item', id: item.id, label: item.title }
}

function domainFuer(kind: SeasonalItemKontext['kind']): SeasonalImpactDomain | null {
  if (kind === 'flight') return 'flight'
  if (kind === 'stay') return 'stay'
  if (kind === 'activity') return 'activity'
  if (kind === 'transfer') return 'mobility'
  if (kind === 'rental_car') return 'rental_car'
  return null
}

function unique(impacts: SeasonalImpact[]): SeasonalImpact[] {
  const gesehen = new Set<string>()
  const liste: SeasonalImpact[] = []
  for (const eintrag of [...impacts].sort((a, b) => `${a.domain}:${a.ref.id}`.localeCompare(`${b.domain}:${b.ref.id}`))) {
    const key = `${eintrag.domain}|${eintrag.ref.kind}|${eintrag.ref.id}|${eintrag.status}`
    if (gesehen.has(key)) continue
    gesehen.add(key)
    liste.push(eintrag)
  }
  return liste
}

export function seasonalImpactAus(opts: {
  kontext: SeasonalReisekontext
  relevance: SeasonalRelevance
  precision: SeasonalSpatialPrecision
  affectedRefs: SeasonalTripRef[]
  sourceDomains: readonly SeasonalImpactDomain[]
}): SeasonalImpact[] {
  if (opts.relevance === 'not_applies') return []
  if (opts.relevance !== 'applies') {
    return unique(
      opts.affectedRefs
        .filter((ref) => ref.kind === 'stage')
        .map((ref) => ({
          domain: 'stage' as const,
          ref,
          status: 'unknown' as const,
        })),
    )
  }

  const stageIds = new Set(opts.affectedRefs.filter((ref) => ref.kind === 'stage').map((ref) => ref.id))
  const routeOderAirport = opts.affectedRefs.some(
    (ref) => ref.kind === 'airport' || ref.kind === 'route_point',
  )
  const countryLevel = opts.precision === 'country'
  const impacts: SeasonalImpact[] = opts.affectedRefs
    .filter((ref) => ref.kind === 'stage')
    .map((ref) => ({ domain: 'stage' as const, ref, status: 'affected' as const }))

  for (const item of opts.kontext.items) {
    const domain = domainFuer(item.kind)
    if (!domain) continue
    const sourceWill = opts.sourceDomains.length === 0 || opts.sourceDomains.includes(domain)
    if (!sourceWill) continue
    const effektiveStageId = effektiveItemStageId(item, opts.kontext.days)
    if (effektiveStageId && stageIds.has(effektiveStageId)) {
      impacts.push({
        domain,
        ref: itemRef(item),
        status: countryLevel && domain === 'stay' ? 'needs_recheck' : 'needs_recheck',
      })
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

  return unique(impacts)
}

export function naechsteAktionAus(
  precision: SeasonalSpatialPrecision,
  impacts: readonly SeasonalImpact[],
  relevance: SeasonalRelevance,
): SeasonalNextAction {
  if (relevance !== 'applies') return 'observe'
  if (precision === 'airport' || precision === 'route') return 'check_route'
  if (impacts.some((eintrag) => eintrag.domain === 'activity')) return 'check_activity'
  if (impacts.some((eintrag) => eintrag.domain === 'mobility' || eintrag.domain === 'rental_car')) {
    return 'check_mobility'
  }
  if (impacts.some((eintrag) => eintrag.domain === 'stage')) return 'check_stage'
  if (impacts.some((eintrag) => eintrag.domain === 'flight')) return 'check_route'
  return 'review_timing'
}
