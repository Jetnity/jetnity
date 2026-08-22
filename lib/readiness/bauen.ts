// lib/readiness/bauen.ts
//
// Baut einen persistierbaren Nutzer-Check aus einer Eingabe und dem
// aktuellen Reisegraphen. Der Fingerprint kommt immer aus Trip-Fakten.

import { READINESS_GRENZEN } from '@/lib/readiness/domain'
import { readinessFingerprint } from '@/lib/readiness/fingerprint'
import { punktFuerReadiness, readinessReisekontext } from '@/lib/readiness/kontext'
import { enthaltSensitiveDaten, type ReadinessEingabe } from '@/lib/readiness/schema'
import type { Trip, TripReadinessItem } from '@/types/trips'

function clientRefErzeugen(prefix: string): string {
  const zufall =
    typeof crypto !== 'undefined' && 'randomUUID' in crypto
      ? crypto.randomUUID()
      : `${Date.now()}-${Math.random().toString(36).slice(2)}`
  return `${prefix}-${zufall}`.slice(0, READINESS_GRENZEN.clientRef)
}

export function readinessItemBauen(
  reise: Trip,
  eingabe: ReadinessEingabe,
  bestehend?: TripReadinessItem | null,
): { ok: true; item: TripReadinessItem } | { ok: false; meldung: string } {
  if (eingabe.kind === 'preparation') {
    if (!eingabe.title) {
      return { ok: false, meldung: 'Eine eigene Vorbereitung braucht einen kurzen Titel.' }
    }
    if (enthaltSensitiveDaten(eingabe.title)) {
      return { ok: false, meldung: 'Keine Passnummern, Ausweisdaten oder andere sensible Daten eintragen.' }
    }
  }

  if (
    (eingabe.kind === 'ticket_confirmation_check' || eingabe.kind === 'booking_confirmation_check') &&
    eingabe.tripItemId
  ) {
    const punkt = punktFuerReadiness(reise, eingabe.tripItemId)
    if (!punkt) {
      return { ok: false, meldung: 'Dieser Planpunkt gehört nicht zur Reise.' }
    }
  }

  const jetzt = new Date().toISOString()
  const kontext = readinessReisekontext(reise)
  const punkt = punktFuerReadiness(reise, eingabe.tripItemId ?? null)
  const countryCode = eingabe.countryCode ?? null
  const title = eingabe.kind === 'preparation' ? eingabe.title : null
  const clientRef = bestehend?.clientRef ?? eingabe.clientRef ?? clientRefErzeugen(eingabe.kind)

  const item: TripReadinessItem = {
    id: bestehend?.id ?? clientRefErzeugen('rdy'),
    clientRef,
    kind: eingabe.kind,
    userStatus: eingabe.userStatus,
    evidence: 'user',
    countryCode,
    tripItemId: punkt?.id ?? null,
    title,
    contextFingerprint: readinessFingerprint({
      kind: eingabe.kind,
      countryCode,
      startDate: kontext.startDate,
      endDate: kontext.endDate,
      travellers: kontext.travellers,
      destinationCountries: kontext.destinationCountries,
      rentalCarPresent: kontext.rentalCarPresent,
      tripItemId: punkt?.id ?? null,
      itemKind: punkt?.kind ?? null,
      bookingStatus: punkt?.bookingStatus ?? null,
      startsOn: punkt?.startsOn ?? null,
      endsOn: punkt?.endsOn ?? null,
      originPlaceId: punkt?.originPlaceId ?? null,
      destinationPlaceId: punkt?.destinationPlaceId ?? null,
      title,
    }),
    createdAt: bestehend?.createdAt ?? jetzt,
    updatedAt: jetzt,
  }

  return { ok: true, item }
}
