import { tageUtc } from '@/lib/activities/zeit'
import { heutigesDatum } from '@/lib/account/naechste-reise'
import { landName } from '@/lib/country/darstellung'

/** Public click endpoints generated for Jetnity in the Booking.com DACH CJ account. */
const placements = {
  hotels: { action: 'https://www.anrdoezrs.net/click-101919996-14082404', sid: 'jetnity-hotel' },
  flights: { action: 'https://www.dpbolvw.net/click-101919996-14082404', sid: 'jetnity-flug' },
} as const

export const bookingStartPages = {
  hotels: 'https://www.dpbolvw.net/click-101919996-14082404?sid=jetnity-hotel&url=https%3A%2F%2Fwww.booking.com%2Findex.de.html',
  flights: 'https://www.kqzyfj.com/click-101919996-14082404?sid=jetnity-flug&url=https%3A%2F%2Fwww.booking.com%2Fflights%2Findex.de.html',
} as const

const cabinClasses = { economy: 'ECONOMY', premium: 'PREMIUM_ECONOMY', business: 'BUSINESS', first: 'FIRST' } as const

type BookingSearch = { adults: number; currency: string } & (
  | { kind: 'hotels'; place: string; country: string | null; checkIn: string; checkOut: string; rooms: number }
  | { kind: 'flights'; origin?: string; destination?: string; departure: string; returnDate?: string; cabin: keyof typeof cabinClasses }
)

export type BookingHandoff =
  | { error: string }
  | { action: string; sid: string; destination: string }

export function bookingHandoff(input: BookingSearch, today = heutigesDatum()): BookingHandoff {
  const departure = input.kind === 'hotels' ? input.checkIn : input.departure
  const end = input.kind === 'hotels' ? input.checkOut : input.returnDate
  if (tageUtc(departure) === null || departure < today) return { error: 'Bitte wähle heute oder ein künftiges Reisedatum.' }
  if (end !== undefined && (tageUtc(end) === null || end < departure)) return { error: 'Bitte prüfe das Enddatum deiner Suche.' }
  if (!Number.isInteger(input.adults) || input.adults < 1 || input.adults > 9) return { error: 'Bitte wähle zwischen einem und neun Erwachsenen.' }

  let destination: URL
  if (input.kind === 'hotels') {
    const place = input.place.trim()
    if (!place) return { error: 'Bitte wähle ein Reiseziel.' }
    if (input.checkOut === input.checkIn) return { error: 'Die Abreise muss nach der Anreise liegen.' }
    if (!Number.isInteger(input.rooms) || input.rooms < 1 || input.rooms > input.adults) return { error: 'Bitte wähle mindestens einen Erwachsenen pro Zimmer.' }
    destination = new URL('https://www.booking.com/searchresults.de.html')
    const country = input.country ? landName(input.country, 'de') : ''
    destination.searchParams.set('ss', country ? `${place}, ${country}` : place)
    destination.searchParams.set('checkin', input.checkIn)
    destination.searchParams.set('checkout', input.checkOut)
    destination.searchParams.set('group_adults', String(input.adults))
    destination.searchParams.set('no_rooms', String(input.rooms))
    destination.searchParams.set('group_children', '0')
    if (/^[A-Z]{3}$/.test(input.currency)) destination.searchParams.set('selected_currency', input.currency)
  } else {
    const { origin, destination: arrival } = input
    if (!origin || !arrival || !/^[A-Z]{3}$/.test(origin) || !/^[A-Z]{3}$/.test(arrival)) {
      return { error: 'Bitte wähle beide Flughäfen aus den Vorschlägen.' }
    }
    if (origin === arrival) return { error: 'Bitte wähle zwei verschiedene Flughäfen.' }
    const from = `${origin}.AIRPORT`
    const to = `${arrival}.AIRPORT`
    destination = new URL(`https://flights.booking.com/flights/${from}-${to}/`)
    destination.searchParams.set('locale', 'de')
    destination.searchParams.set('type', input.returnDate ? 'ROUNDTRIP' : 'ONEWAY')
    destination.searchParams.set('from', from)
    destination.searchParams.set('to', to)
    destination.searchParams.set('depart', input.departure)
    if (input.returnDate) destination.searchParams.set('return', input.returnDate)
    destination.searchParams.set('adults', String(input.adults))
    destination.searchParams.set('cabinClass', cabinClasses[input.cabin])
    if (/^[A-Z]{3}$/.test(input.currency)) destination.searchParams.set('currency', input.currency)
  }
  return { ...placements[input.kind], destination: destination.href }
}
