// lib/trips/handelsfelder-nutzlast.ts
//
// Guest → Account darf unbewiesene Stay-/Activity-Handelsfelder nicht zu
// Account-Truth machen. Dieselbe Feldmenge wie der bestehende Flug-Strip:
// price_amount, price_currency, provider, external_ref, booking_url.
//
// Flight bleibt über `flugNutzlastOhneUnbewieseneWahrheit` unverändert.
// Transfer und rental_car bleiben bewusst unberührt: manuelle Nutzerpreise
// sind S3-User-Intake, nicht derselbe untrusted-commercial Vertrag.
//
// Frei von Next und Supabase.

import { flugNutzlastOhneUnbewieseneWahrheit } from '@/lib/flights/nutzlast'
import type { ReiseNutzlast } from '@/lib/trips/schema'

type NutzlastPunkt = ReiseNutzlast['days'][number]['items'][number]

function stayOderActivityOhneUnbewieseneWahrheit(punkt: NutzlastPunkt): NutzlastPunkt {
  if (punkt.kind !== 'stay' && punkt.kind !== 'activity') return punkt
  return {
    ...punkt,
    price_amount: null,
    price_currency: null,
    provider: null,
    external_ref: null,
    booking_url: null,
  }
}

export function nutzlastOhneUnbewieseneHandelsfelder(nutzlast: ReiseNutzlast): ReiseNutzlast {
  const nachFlug = flugNutzlastOhneUnbewieseneWahrheit(nutzlast)
  return {
    ...nachFlug,
    days: nachFlug.days.map((tag) => ({
      ...tag,
      items: tag.items.map(stayOderActivityOhneUnbewieseneWahrheit),
    })),
    ungeplante: nachFlug.ungeplante.map(stayOderActivityOhneUnbewieseneWahrheit),
  }
}
