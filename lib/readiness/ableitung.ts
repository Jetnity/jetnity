// lib/readiness/ableitung.ts
//
// System-Checks aus dem Reisegraphen. Keine erfundenen Anforderungen.
// Nicht persistieren, bis der Nutzer einen Status setzt.

import {
  clientRefFuerAbgeleitet,
  type ReadinessDerivedCheck,
} from '@/lib/readiness/domain'
import { readinessFingerprint } from '@/lib/readiness/fingerprint'
import { readinessReisekontext, routeFingerprintFelder } from '@/lib/readiness/kontext'
import { travellerSlots } from '@/lib/readiness/party'
import { citizenshipCodesAus, documentFingerprintTeil, documentsSortieren } from '@/lib/readiness/traveller-kontext'
import type { Trip, TripTraveller } from '@/types/trips'

function travellerFingerprintFelder(traveller: TripTraveller | null) {
  if (!traveller) {
    return {
      travellerClientRef: null as string | null,
      citizenshipCountryCodes: [] as string[],
      documentFingerprints: [] as string[],
      residenceCountryCode: null as string | null,
    }
  }
  return {
    travellerClientRef: traveller.clientRef,
    citizenshipCountryCodes: citizenshipCodesAus(traveller),
    documentFingerprints: documentsSortieren(traveller.documents).map((document) =>
      documentFingerprintTeil(document, traveller),
    ),
    residenceCountryCode: traveller.residenceCountryCode,
  }
}

export function readinessChecksAbleiten(reise: Trip): ReadinessDerivedCheck[] {
  const kontext = readinessReisekontext(reise)
  const routeFelder = routeFingerprintFelder(reise)
  const checks: ReadinessDerivedCheck[] = []
  const gesehen = new Set<string>()

  const merken = (check: ReadinessDerivedCheck) => {
    if (gesehen.has(check.clientRef)) return
    gesehen.add(check.clientRef)
    checks.push(check)
  }

  const slots = travellerSlots(reise).filter((slot) => slot.applicable)
  const travellerFuerKarten = slots.length > 0 ? slots : [{ clientRef: 'traveller:1', traveller: null as TripTraveller | null }]

  for (const countryCode of kontext.destinationCountries) {
    for (const slot of travellerFuerKarten) {
      const travellerFelder = travellerFingerprintFelder(slot.traveller ?? null)
      const basis = {
        countryCode,
        startDate: kontext.startDate,
        endDate: kontext.endDate,
        travellers: kontext.travellers,
        destinationCountries: kontext.destinationCountries,
        rentalCarPresent: kontext.rentalCarPresent,
        tripItemId: null,
        itemKind: null,
        bookingStatus: null,
        startsOn: null,
        endsOn: null,
        originPlaceId: null,
        destinationPlaceId: null,
        title: null,
        ...routeFelder,
        ...travellerFelder,
      }
      const schluessel = `${countryCode}:${slot.clientRef}`

      merken({
        clientRef: clientRefFuerAbgeleitet('entry_check', schluessel),
        kind: 'entry_check',
        countryCode,
        tripItemId: null,
        title: null,
        travellerClientRef: slot.clientRef,
        contextFingerprint: readinessFingerprint({ ...basis, kind: 'entry_check' }),
      })
      merken({
        clientRef: clientRefFuerAbgeleitet('visa_check', schluessel),
        kind: 'visa_check',
        countryCode,
        tripItemId: null,
        title: null,
        travellerClientRef: slot.clientRef,
        contextFingerprint: readinessFingerprint({ ...basis, kind: 'visa_check' }),
      })
      merken({
        clientRef: clientRefFuerAbgeleitet('travel_document_check', schluessel),
        kind: 'travel_document_check',
        countryCode,
        tripItemId: null,
        title: null,
        travellerClientRef: slot.clientRef,
        contextFingerprint: readinessFingerprint({ ...basis, kind: 'travel_document_check' }),
      })
    }
  }

  if (
    kontext.startDate ||
    kontext.endDate ||
    kontext.destinationCountries.length > 0 ||
    kontext.rentalCarPresent
  ) {
    merken({
      clientRef: clientRefFuerAbgeleitet('insurance_check', 'trip'),
      kind: 'insurance_check',
      countryCode: null,
      tripItemId: null,
      title: null,
      travellerClientRef: null,
      contextFingerprint: readinessFingerprint({
        kind: 'insurance_check',
        countryCode: null,
        startDate: kontext.startDate,
        endDate: kontext.endDate,
        travellers: kontext.travellers,
        destinationCountries: kontext.destinationCountries,
        rentalCarPresent: kontext.rentalCarPresent,
        tripItemId: null,
        itemKind: null,
        bookingStatus: null,
        startsOn: null,
        endsOn: null,
        originPlaceId: null,
        destinationPlaceId: null,
        title: null,
        ...routeFelder,
      }),
    })
  }

  for (const punkt of kontext.bookedItems) {
    const itemBasis = {
      countryCode: null,
      startDate: kontext.startDate,
      endDate: kontext.endDate,
      travellers: kontext.travellers,
      destinationCountries: kontext.destinationCountries,
      rentalCarPresent: kontext.rentalCarPresent,
      tripItemId: punkt.id,
      itemKind: punkt.kind,
      bookingStatus: punkt.bookingStatus,
      startsOn: punkt.startsOn,
      endsOn: punkt.endsOn,
      originPlaceId: punkt.originPlaceId,
      destinationPlaceId: punkt.destinationPlaceId,
      title: null,
    }

    merken({
      clientRef: clientRefFuerAbgeleitet('booking_confirmation_check', punkt.id),
      kind: 'booking_confirmation_check',
      countryCode: null,
      tripItemId: punkt.id,
      title: null,
      travellerClientRef: null,
      contextFingerprint: readinessFingerprint({
        ...itemBasis,
        kind: 'booking_confirmation_check',
      }),
    })

    if (punkt.kind === 'flight') {
      merken({
        clientRef: clientRefFuerAbgeleitet('ticket_confirmation_check', punkt.id),
        kind: 'ticket_confirmation_check',
        countryCode: null,
        tripItemId: punkt.id,
        title: null,
        travellerClientRef: null,
        contextFingerprint: readinessFingerprint({
          ...itemBasis,
          kind: 'ticket_confirmation_check',
        }),
      })
    }
  }

  return checks
}
