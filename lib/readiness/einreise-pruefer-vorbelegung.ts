// Prefill for the entry checker inside a trip. Read-only: it starts no request and stores nothing.

import { landAnzeigeText } from '@/lib/country/darstellung'
import { istKatalogLand, type Iso3166Alpha2 } from '@/lib/country/katalog'
import type { TravellerSlot } from '@/lib/readiness/party'
import { citizenshipCodesAus } from '@/lib/readiness/traveller-kontext'

export const EINREISE_PRUEFER_MAX_PAESSE = 5

export type EinreisePrueferVorbelegung = {
  ziele: Iso3166Alpha2[]
  paesse: Iso3166Alpha2[]
  nichtUebernommen: Iso3166Alpha2[]
  personen: { clientRef: string; label: string; paesse: Iso3166Alpha2[]; text: string }[]
}

function katalogCode(wert: string | null | undefined): Iso3166Alpha2 | null {
  const code = wert?.trim().toUpperCase() ?? ''
  return istKatalogLand(code) ? code : null
}

/**
 * Prefill for the checker inside a trip: stage countries in route order and the citizenships stored per traveller.
 * Citizenship is never inferred from a document's issuing country; a traveller without one stays «noch nicht angegeben».
 */
export function einreisePrueferVorbelegung(eingabe: {
  laender: readonly (string | null | undefined)[]
  slots: readonly Pick<TravellerSlot, 'clientRef' | 'label' | 'traveller' | 'applicable'>[]
}): EinreisePrueferVorbelegung {
  const ziele: Iso3166Alpha2[] = []
  for (const land of eingabe.laender) {
    const code = katalogCode(land)
    if (code && !ziele.includes(code)) ziele.push(code)
  }
  const alle: Iso3166Alpha2[] = []
  const personen = eingabe.slots
    .filter((slot) => slot.applicable)
    .map((slot) => {
      const paesse: Iso3166Alpha2[] = []
      for (const wert of slot.traveller ? citizenshipCodesAus(slot.traveller) : []) {
        const code = katalogCode(wert)
        if (code && !paesse.includes(code)) paesse.push(code)
      }
      for (const code of paesse) if (!alle.includes(code)) alle.push(code)
      return {
        clientRef: slot.clientRef,
        label: slot.label,
        paesse,
        text: paesse.length > 0 ? paesse.map((code) => landAnzeigeText(code)).join(', ') : 'noch nicht angegeben',
      }
    })
  return {
    ziele,
    paesse: alle.slice(0, EINREISE_PRUEFER_MAX_PAESSE),
    nichtUebernommen: alle.slice(EINREISE_PRUEFER_MAX_PAESSE),
    personen,
  }
}
