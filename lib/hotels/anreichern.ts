// lib/hotels/anreichern.ts
//
// Hängt Jetnity-Kontext an Provideroptionen. Unbekannte Wegezeiten bleiben null.
// Eine Luftlinie ist keine Gehzeit.

import type { HotelKandidat, HotelKontext, HotelOption, HotelSuchanfrage } from '@/lib/hotels/domain'
import { luftlinieKm } from '@/lib/hotels/geo'

function clamp01(wert: number): number {
  return Math.max(0, Math.min(1, wert))
}

function quartierFitScore(option: HotelOption, anfrage: HotelSuchanfrage): number | null {
  const zentrum = anfrage.quartier?.zentrum
  if (!zentrum) return null
  const km = luftlinieKm(option.punkt, zentrum)
  if (!Number.isFinite(km)) return null
  return Math.round(clamp01(1 - km / 8) * 1000) / 1000
}

function hotelKontextAnreichern(option: HotelOption, anfrage: HotelSuchanfrage): HotelKontext {
  return {
    taeglicheWegeMinuten: null,
    quartierFitScore: quartierFitScore(option, anfrage),
    ruheScore: null,
    praeferenzFitScore: null,
  }
}

export function hotelKandidatenAnreichern(
  optionen: HotelOption[],
  anfrage: HotelSuchanfrage,
): HotelKandidat[] {
  return optionen.map((option) => ({
    ...option,
    context: hotelKontextAnreichern(option, anfrage),
  }))
}
