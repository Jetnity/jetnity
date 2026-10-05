// lib/flights/nutzlast.ts
//
// Guest → Account darf eine unbewiesene Flugoption nicht zu belegter
// kommerzieller Wahrheit hochstufen. Preis, Provider, External-Ref und
// Booking-URL kommen nur aus einem serverseitigen FlugNachweis.
//
// Route-Itinerary bleibt Foundation-D-Intake und wird später kanonisiert.
// Frei von Next und Supabase.

import type { ReiseNutzlast } from '@/lib/trips/schema'

type NutzlastPunkt = ReiseNutzlast['days'][number]['items'][number]

function flugPunktOhneUnbewieseneWahrheit(punkt: NutzlastPunkt): NutzlastPunkt {
  if (punkt.kind !== 'flight') return punkt
  return {
    ...punkt,
    price_amount: null,
    price_currency: null,
    provider: null,
    external_ref: null,
    booking_url: null,
  }
}

export function flugNutzlastOhneUnbewieseneWahrheit(nutzlast: ReiseNutzlast): ReiseNutzlast {
  return {
    ...nutzlast,
    days: nutzlast.days.map((tag) => ({
      ...tag,
      items: tag.items.map(flugPunktOhneUnbewieseneWahrheit),
    })),
    ungeplante: nutzlast.ungeplante.map(flugPunktOhneUnbewieseneWahrheit),
  }
}
