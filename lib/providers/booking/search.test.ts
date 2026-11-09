import assert from 'node:assert/strict'
import test from 'node:test'
import { bookingHandoff } from './search'

const today = '2027-03-01'
const hotel = {
  kind: 'hotels', place: 'São Paulo & Centro', country: 'BR', rooms: 1, adults: 2,
  checkIn: '2027-03-12', checkOut: '2027-03-17', currency: 'CHF',
} as const
const flight = {
  kind: 'flights', origin: 'JFK', destination: 'BKK', cabin: 'premium', adults: 3,
  departure: '2027-03-12', returnDate: '2027-03-17', currency: 'EUR',
} as const

function target(input: Parameters<typeof bookingHandoff>[0]) {
  const result = bookingHandoff(input, today)
  assert.ok('destination' in result)
  return { ...result, target: new URL(result.destination) }
}

test('Hotelübergabe begrenzt Suchangaben und verwendet die CJ-Platzierung für Jetnity', () => {
  const { action, sid, target: url } = target({ ...hotel, ...{ id: 'private', party: ['private'] } })
  assert.equal(action, 'https://www.anrdoezrs.net/click-101919996-14082404')
  assert.equal(sid, 'jetnity-hotel')
  assert.equal(url.origin + url.pathname, 'https://www.booking.com/searchresults.de.html')
  assert.deepEqual(Object.fromEntries(url.searchParams), {
    ss: 'São Paulo & Centro, Brasilien', checkin: hotel.checkIn, checkout: hotel.checkOut,
    group_adults: '2', group_children: '0', no_rooms: '1', selected_currency: 'CHF',
  })
  assert.equal(target({ ...hotel, country: null }).target.searchParams.get('ss'), hotel.place)
})

test('Flugübergabe bindet die bestätigten Flughäfen, Sitzklasse und Reisedaten', () => {
  const { action, sid, target: url } = target(flight)
  assert.equal(action, 'https://www.dpbolvw.net/click-101919996-14082404')
  assert.equal(sid, 'jetnity-flug')
  assert.equal(url.origin + url.pathname, 'https://flights.booking.com/flights/JFK.AIRPORT-BKK.AIRPORT/')
  assert.deepEqual(Object.fromEntries(url.searchParams), {
    locale: 'de', type: 'ROUNDTRIP', from: 'JFK.AIRPORT', to: 'BKK.AIRPORT', depart: flight.departure,
    return: flight.returnDate, adults: '3', cabinClass: 'PREMIUM_ECONOMY', currency: 'EUR',
  })
  const oneWay = target({ ...flight, returnDate: undefined }).target
  assert.equal(oneWay.searchParams.get('type'), 'ONEWAY')
  assert.equal(oneWay.searchParams.has('return'), false)
})

test('Unvollständige, vergangene und widersprüchliche Suchen bleiben bei Jetnity', () => {
  const invalid = [
    { ...hotel, checkIn: '2027-02-28' }, { ...hotel, checkOut: '2027-02-31' },
    { ...hotel, checkOut: hotel.checkIn }, { ...hotel, place: '  ' }, { ...hotel, rooms: 3 },
    { ...hotel, adults: 0 }, { ...flight, adults: 2.5 }, { ...flight, destination: 'JFK' },
    { ...flight, origin: 'ZRH?x=1' }, { ...flight, returnDate: '2027-03-11' }, { ...flight, origin: undefined },
  ]
  for (const input of invalid) assert.ok('error' in bookingHandoff(input, today))
})
