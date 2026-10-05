// lib/hotels/reisegraph.ts
//
// Prüft Etappe, Tag und Hotelzeitraum gegen einen vertrauenswürdigen Reisegraphen.
// Client-Daten dürfen hier nicht die Source of Truth sein.
//
// Frei von Next und Providern.

import { naechteZwischen } from '@/lib/hotels/quartier-kontext'
import type { Trip, TripDay, TripStage } from '@/types/trips'

export type HotelReisegraphFehlerArt =
  | 'reise-fremd'
  | 'etappe-fremd'
  | 'tag-fremd'
  | 'tag-etappe'
  | 'tag-zeitraum'
  | 'zeitraum-unvollstaendig'

export type HotelReisegraphEingabe = {
  tripId: string
  stageId: string
  dayId: string | null
}

export type HotelReisegraphErgebnis =
  | {
      ok: true
      etappe: TripStage
      tag: TripDay | null
      checkIn: string
      checkOut: string
    }
  | { ok: false; art: HotelReisegraphFehlerArt; message: string }

const MELDUNG: Record<HotelReisegraphFehlerArt, string> = {
  'reise-fremd': 'Diese Reise wurde nicht gefunden.',
  'etappe-fremd': 'Diese Etappe gehört nicht zur Reise.',
  'tag-fremd': 'Dieser Tag gehört nicht zur Reise.',
  'tag-etappe': 'Dieser Tag gehört nicht zu dieser Etappe.',
  'tag-zeitraum': 'Dieser Tag passt nicht zum Check-in dieser Etappe.',
  'zeitraum-unvollstaendig': 'Für diese Etappe fehlt ein belastbarer Zeitraum.',
}

function fehler(art: HotelReisegraphFehlerArt): HotelReisegraphErgebnis {
  return { ok: false, art, message: MELDUNG[art] }
}

export function hotelZeitraumAusEtappe(
  reise: Pick<Trip, 'startDate' | 'endDate'>,
  etappe: Pick<TripStage, 'arrivalDate' | 'departureDate'>,
): { checkIn: string; checkOut: string } | null {
  const checkIn = etappe.arrivalDate ?? reise.startDate
  const checkOut = etappe.departureDate ?? reise.endDate
  if (!checkIn || !checkOut || !naechteZwischen(checkIn, checkOut)) return null
  return { checkIn, checkOut }
}

export function hotelReisegraphPruefen(
  reise: Trip,
  eingabe: HotelReisegraphEingabe,
): HotelReisegraphErgebnis {
  if (reise.id !== eingabe.tripId) return fehler('reise-fremd')

  const etappe = reise.stages.find((eintrag) => eintrag.id === eingabe.stageId)
  if (!etappe) return fehler('etappe-fremd')

  const zeitraum = hotelZeitraumAusEtappe(reise, etappe)
  if (!zeitraum) return fehler('zeitraum-unvollstaendig')

  if (!eingabe.dayId) {
    return { ok: true, etappe, tag: null, ...zeitraum }
  }

  const tag = reise.days.find((eintrag) => eintrag.id === eingabe.dayId)
  if (!tag) return fehler('tag-fremd')
  if (tag.stageId !== etappe.id) return fehler('tag-etappe')
  if (tag.dayDate !== null && tag.dayDate !== zeitraum.checkIn) return fehler('tag-zeitraum')

  return { ok: true, etappe, tag, ...zeitraum }
}
