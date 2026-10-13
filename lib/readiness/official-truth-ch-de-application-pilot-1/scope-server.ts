import 'server-only'
import type { Trip } from '@/types/trips'
import { chDeVisaReadRequestPruefen } from '@/lib/readiness/official-truth-ch-de-first-visa-vertical-1/read-request'
import { declarationReferencesValid, pilotContextCurrent } from './context'

export function pilotScope(trip: Trip) {
  const c = trip.regulatoryContext
  if (!c) return { ok: false as const, reason: 'context_missing' }
  if (!pilotContextCurrent(trip)) return { ok: false as const, reason: 'context_changed' }
  const d = c.declaration
  if (!declarationReferencesValid(trip, d)) return { ok: false as const, reason: 'context_changed' }
  return chDeVisaReadRequestPruefen(trip, {
    travellerClientRef: d.travellerClientRef, credentialOptionRef: d.credentialOptionRef,
    destinationCountryCode: 'DE', requirementType: 'visa',
    proposedContext: {
      evidenceClass: 'user_attestation', tripId: trip.id, tripRevision: trip.revision,
      documentClientRef: d.documentClientRef, citizenshipClientRef: d.citizenshipClientRef,
      passportClass: d.passportClass, purpose: d.purpose,
      travelDates: { startDate: c.startDate, endDate: c.endDate },
      route: { completeness: d.route === 'complete_direct_ch_de' ? 'complete' : 'unknown',
        topology: d.route === 'complete_direct_ch_de' ? 'direct' : 'unknown',
        originCountryCode: d.originCountryCode === 'CH' ? 'CH' : null,
        destinationCountryCode: d.route === 'complete_direct_ch_de' ? 'DE' : null, transitCountryCodes: [] },
    },
  })
}
