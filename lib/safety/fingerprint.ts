// lib/safety/fingerprint.ts
//
// Deterministischer Safety-Kontext. Reihenfolge von Arrays ändert nichts.
// Titel, Notizen und Provider-Rohdaten gehören nicht hinein.

import { routeFactsAusGraph } from '@/lib/route/ableitung'
import { safetyLandescode } from '@/lib/safety/domain'
import { scopeIdentitaet, type SafetySpatialScope } from '@/lib/safety/scope'
import { planpunkteSammeln } from '@/lib/trips/arbeitsbereich'
import type { Trip } from '@/types/trips'

const SAFETY_CONTEXT_VERSION = 'safety-ctx-v1'
const SAFETY_EVENT_VERSION = 'safety-evt-v1'

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
  return [
    SAFETY_CONTEXT_VERSION,
    `start=${reise.startDate ?? ''}`,
    `end=${reise.endDate ?? ''}`,
    `stages=${stages.join(',')}`,
    `days=${days.join(',')}`,
    `items=${items.join(',')}`,
    `route=${route.fingerprint ?? ''}`,
  ].join('|')
}

export function safetyEventFingerprint(opts: {
  factKey: string
  status: string
  updatedAt: string | null
  validUntil: string | null
  scope: SafetySpatialScope
}): string {
  return [
    SAFETY_EVENT_VERSION,
    opts.factKey,
    opts.status,
    opts.updatedAt ?? '',
    opts.validUntil ?? '',
    scopeIdentitaet(opts.scope),
  ].join('|')
}
