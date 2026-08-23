// lib/seasonal/fingerprint.ts
//
// Deterministischer Seasonal-Kontext. Reihenfolge von Arrays ändert nichts.
// Keine User-Labels, keine Citizenship, keine Provider-Rohdaten.

import { routeFactsAusGraph } from '@/lib/route/ableitung'
import { seasonalLandescode } from '@/lib/seasonal/domain'
import { travelWindowIdentitaet, type SeasonalTravelWindow } from '@/lib/seasonal/fenster'
import { scopeIdentitaet, type SeasonalSpatialScope } from '@/lib/seasonal/scope'
import { planpunkteSammeln } from '@/lib/trips/arbeitsbereich'
import type { Trip } from '@/types/trips'

const SEASONAL_CONTEXT_VERSION = 'seasonal-context-v1'
const SEASONAL_FACT_VERSION = 'seasonal-fact-v1'

function zahl(wert: number | null | undefined): string {
  return wert == null || !Number.isFinite(wert) ? '' : wert.toFixed(4)
}

export function seasonalContextFingerprint(reise: Trip): string {
  const route = routeFactsAusGraph(reise)
  const stages = [...reise.stages]
    .map((etappe) =>
      [
        etappe.id,
        seasonalLandescode(etappe.countryCode) ?? '',
        etappe.placeId ?? '',
        zahl(etappe.latitude),
        zahl(etappe.longitude),
        etappe.arrivalDate ?? '',
        etappe.departureDate ?? '',
      ].join(':'),
    )
    .sort()
  const items = planpunkteSammeln(reise, reise.ohneTag)
    .map((punkt) =>
      [
        punkt.id,
        punkt.kind,
        punkt.stageId ?? '',
        punkt.dayId ?? '',
        punkt.startsOn ?? '',
        punkt.endsOn ?? '',
        punkt.originPlaceId ?? '',
        punkt.destinationPlaceId ?? '',
      ].join(':'),
    )
    .sort()
  const days = [...reise.days]
    .map((tag) => [tag.id, tag.stageId ?? '', tag.dayDate ?? ''].join(':'))
    .sort()
  const routeZeiten = route.segments
    .map((segment) =>
      [
        segment.origin.airportCode ?? '',
        segment.departureDate ?? '',
        segment.departureTime ?? '',
        segment.destination.airportCode ?? '',
        segment.arrivalDate ?? '',
        segment.arrivalTime ?? '',
      ].join(':'),
    )
    .sort()
  return [
    SEASONAL_CONTEXT_VERSION,
    `start=${reise.startDate ?? ''}`,
    `end=${reise.endDate ?? ''}`,
    `stages=${stages.join(',')}`,
    `days=${days.join(',')}`,
    `items=${items.join(',')}`,
    `route=${route.fingerprint ?? ''}`,
    `routeTimes=${routeZeiten.join(',')}`,
  ].join('|')
}

export function seasonalFactFingerprint(opts: {
  factKey: string
  category: string
  evidenceClass: string
  outcome: string
  updatedAt: string | null
  checkedAt: string | null
  freshUntil: string | null
  referencePeriod: { startYear: number; endYear: number } | null
  vertrauenswuerdig: boolean
  scope: SeasonalSpatialScope
  travelWindow: SeasonalTravelWindow
  affectedDomains: readonly string[]
}): string {
  return [
    SEASONAL_FACT_VERSION,
    opts.factKey,
    opts.category,
    opts.evidenceClass,
    opts.outcome,
    opts.updatedAt ?? '',
    opts.checkedAt ?? '',
    opts.freshUntil ?? '',
    opts.referencePeriod ? `${opts.referencePeriod.startYear}-${opts.referencePeriod.endYear}` : '',
    opts.vertrauenswuerdig ? 'trusted' : 'untrusted',
    scopeIdentitaet(opts.scope),
    travelWindowIdentitaet(opts.travelWindow),
    [...opts.affectedDomains].sort().join(','),
  ].join('|')
}
