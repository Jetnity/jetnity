import { heutigesDatum } from '@/lib/account/naechste-reise'
import { tageUtc } from '@/lib/activities/zeit'
import type { FlugKabine } from '@/lib/flights/domain'

export const BOOKING_FLUG_PARTNERLINK = 'https://www.dpbolvw.net/click-101919996-14082404'

interface FlugEingabe {
  art: 'einfach' | 'retour' | 'gabel'
  von?: string
  nach?: string
  rueckflugAb?: string
  hin: string
  rueck: string
  gaeste: number
  kabine: FlugKabine
  direkt: boolean
  waehrung: string
}

export function bookingFlugSuche(
  e: FlugEingabe,
  heute = heutigesDatum(),
): { ziel: string } | { fehler: string } {
  const iata = (wert?: string): wert is string => typeof wert === 'string' && /^[A-Z]{3}$/.test(wert)
  if (!iata(e.von) || !iata(e.nach) || (e.art === 'gabel' && !iata(e.rueckflugAb))) {
    return { fehler: 'Bitte wähle alle Flughäfen aus den Vorschlägen.' }
  }
  if (e.von === e.nach || (e.art === 'gabel' && e.von === e.rueckflugAb)) {
    return { fehler: 'Abflug und Ankunft müssen je Strecke verschieden sein.' }
  }
  if (
    tageUtc(e.hin) === null ||
    e.hin < heute ||
    (e.art !== 'einfach' && (tageUtc(e.rueck) === null || e.rueck < e.hin))
  ) {
    return { fehler: 'Bitte prüfe die Flugtermine.' }
  }
  if (!Number.isInteger(e.gaeste) || e.gaeste < 1 || e.gaeste > 9) {
    return { fehler: 'Bitte wähle zwischen einem und neun Erwachsenen.' }
  }
  const start = e.von + '.AIRPORT'
  const ende = e.nach + '.AIRPORT'
  const multi = e.art === 'gabel'
  const von = multi ? start + '|' + e.rueckflugAb + '.AIRPORT' : start
  const nach = multi ? ende + '|' + start : ende
  const ziel = new URL(
    'https://flights.booking.com/flights/' + encodeURIComponent(von) + '-' + encodeURIComponent(nach) + '/',
  )
  const query = ziel.searchParams
  query.set('type', multi ? 'MULTISTOP' : e.art === 'retour' ? 'ROUNDTRIP' : 'ONEWAY')
  query.set('from', von)
  query.set('to', nach)
  if (multi) query.set('multiStopDates', e.hin + '|' + e.rueck)
  else {
    query.set('depart', e.hin)
    if (e.art === 'retour') query.set('return', e.rueck)
  }
  query.set('adults', String(e.gaeste))
  query.set('cabinClass', e.kabine.toUpperCase())
  query.set('locale', 'de')
  if (e.direkt) query.set('stops', '0')
  if (/^[A-Z]{3}$/.test(e.waehrung)) query.set('currency', e.waehrung)
  return { ziel: ziel.href }
}

export type Flugart = FlugEingabe['art']
