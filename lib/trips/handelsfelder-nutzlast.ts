// lib/trips/handelsfelder-nutzlast.ts
//
// Guest → Account darf unbewiesene Handelsfelder nicht zu Account- oder
// Provider-Hard-Truth machen. S5-B Guard-Matrix (ADR-0197 / ADR-0198):
// Flight bleibt über `flugNutzlastOhneUnbewieseneWahrheit` unverändert.
// Stay/Activity/Note: ganze Legacy-Menge streichen.
// Transfer/Rental: User-Intake-Preis behalten, Provider/Ref/URL streichen.
// Guest-Promotion mintet keine Provenance-Zeile.
//
// Frei von Next und Supabase.

import { flugNutzlastOhneUnbewieseneWahrheit } from '@/lib/flights/nutzlast'
import type { ReiseNutzlast } from '@/lib/trips/schema'

type NutzlastPunkt = ReiseNutzlast['days'][number]['items'][number]

function ohneProviderFelder(punkt: NutzlastPunkt): NutzlastPunkt {
  return {
    ...punkt,
    provider: null,
    external_ref: null,
    booking_url: null,
  }
}

function ohneUnbewieseneHandelsfelder(punkt: NutzlastPunkt): NutzlastPunkt {
  if (punkt.kind === 'stay' || punkt.kind === 'activity' || punkt.kind === 'note') {
    return {
      ...ohneProviderFelder(punkt),
      price_amount: null,
      price_currency: null,
    }
  }
  if (punkt.kind === 'transfer' || punkt.kind === 'rental_car') {
    return ohneProviderFelder(punkt)
  }
  return punkt
}

export function nutzlastOhneUnbewieseneHandelsfelder(nutzlast: ReiseNutzlast): ReiseNutzlast {
  const nachFlug = flugNutzlastOhneUnbewieseneWahrheit(nutzlast)
  return {
    ...nachFlug,
    days: nachFlug.days.map((tag) => ({
      ...tag,
      items: tag.items.map(ohneUnbewieseneHandelsfelder),
    })),
    ungeplante: nachFlug.ungeplante.map(ohneUnbewieseneHandelsfelder),
  }
}
