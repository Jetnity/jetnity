// lib/safety/fingerprint.ts
//
// Deterministischer Safety-Kontext. Reihenfolge von Arrays ändert nichts.
// Titel, Notizen und Provider-Rohdaten gehören nicht hinein.

import { travellerSlots } from '@/lib/readiness/party'
import { citizenshipCodesAus } from '@/lib/readiness/traveller-kontext'
import { routeFactsAusGraph } from '@/lib/route/ableitung'
import { safetyLandescode } from '@/lib/safety/domain'
import { scopeIdentitaet, type SafetySpatialScope } from '@/lib/safety/scope'
import { planpunkteSammeln } from '@/lib/trips/arbeitsbereich'
import type { Trip } from '@/types/trips'

const SAFETY_CONTEXT_VERSION = 'safety-ctx-v3'
const SAFETY_EVENT_VERSION = 'safety-evt-v3'

function zahl(wert: number | null | undefined): string {
  return wert == null || !Number.isFinite(wert) ? '' : wert.toFixed(4)
}

export function safetyContextFingerprint(reise: Trip): string {
  const route = routeFactsAusGraph(reise)
  const stages = [...reise.stages]
    .map((etappe) =>
      [
        etappe.id,
        safetyLandescode(etappe.countryCode) ?? '',
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
  const party = travellerSlots(reise)
    .filter((slot) => slot.applicable)
    .map((slot) => {
      const codes = slot.traveller ? citizenshipCodesAus(slot.traveller) : []
      const unvollstaendig = !slot.traveller || codes.length === 0
      return `${slot.clientRef}:${codes.join(',')}:${unvollstaendig ? '?' : 'ok'}`
    })
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
    SAFETY_CONTEXT_VERSION,
    `start=${reise.startDate ?? ''}`,
    `end=${reise.endDate ?? ''}`,
    `stages=${stages.join(',')}`,
    `days=${days.join(',')}`,
    `items=${items.join(',')}`,
    `route=${route.fingerprint ?? ''}`,
    `routeTimes=${routeZeiten.join(',')}`,
    `party=${party.join(',')}`,
  ].join('|')
}

export function safetyEventFingerprint(opts: {
  factKey: string
  category?: string
  status: string
  nature?: string | null
  updatedAt: string | null
  checkedAt?: string | null
  validFrom?: string | null
  validUntil: string | null
  freshUntil?: string | null
  sourceSeverity?: string | null
  advisoryClass?: string | null
  travellerDependent?: boolean
  travellerCitizenshipCodes?: readonly string[]
  vertrauenswuerdig?: boolean
  scope: SafetySpatialScope
}): string {
  return [
    SAFETY_EVENT_VERSION,
    opts.factKey,
    opts.category ?? '',
    opts.status,
    opts.nature ?? '',
    opts.updatedAt ?? '',
    opts.checkedAt ?? '',
    opts.validFrom ?? '',
    opts.validUntil ?? '',
    opts.freshUntil ?? '',
    opts.sourceSeverity ?? '',
    opts.advisoryClass ?? '',
    opts.travellerDependent ? 'traveller' : 'trip',
    [...(opts.travellerCitizenshipCodes ?? [])].sort().join(','),
    opts.vertrauenswuerdig ? 'trusted' : 'untrusted',
    scopeIdentitaet(opts.scope),
  ].join('|')
}
