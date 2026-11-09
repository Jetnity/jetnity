import assert from 'node:assert/strict'
import { describe, it } from 'node:test'
import type { TripStage } from '@/types/trips'
import { bookingHotelLink, etappenZiel, reiseFoto, vorgeschlagenerFlughafen } from './katalog'

const etappe: TripStage = {
  id: 'bkk',
  position: 1,
  name: 'Bangkok',
  placeId: 'geonames:1609350',
  countryCode: 'TH',
  latitude: 13.75,
  longitude: 100.52,
  arrivalDate: null,
  departureDate: null,
}
describe('Reisefotos, Flughafenwahl und Hotelübergabe', () => {
  it('findet verifizierte Profile und das Fotomotiv für die echte Reiseetappe', () => {
    assert.equal(etappenZiel(etappe)?.hotels.length, 3)
    assert.equal(etappenZiel({ ...etappe, placeId: null })?.hotels.length, 3)
    assert.notEqual(reiseFoto(etappe, true), reiseFoto(undefined, true))
    assert.equal(etappenZiel({ ...etappe, countryCode: 'US' }), null)
    assert.equal(etappenZiel({ ...etappe, placeId: 'unbekannt' }), null)
    assert.equal(etappenZiel({ ...etappe, countryCode: null, placeId: null }), null)
  })
  it('ermittelt Hin- und Rückflughafen separat und lässt unbekannte Orte offen', () => {
    const letzte = { ...etappe, placeId: 'geonames:1151254', name: 'Phuket' }
    assert.equal(vorgeschlagenerFlughafen(etappe.placeId, etappe.name, etappe)?.iata, 'BKK')
    assert.equal(vorgeschlagenerFlughafen(letzte.placeId, letzte.name, letzte)?.iata, 'HKT')
    assert.equal(vorgeschlagenerFlughafen(null, 'Unbekannt'), null)
  })
  it('öffnet das einzelne Hotel mit Belegung, Währung und gültigen Daten', () => {
    const hotel = etappenZiel(etappe)!.hotels[1]!
    const daten = { anreise: '2090-11-15', abreise: '2090-11-21', gaeste: 3, zimmer: 2, waehrung: 'CHF' }
    const link = new URL(bookingHotelLink(hotel, daten))
    assert.equal(link.pathname, '/click-101919996-14082404')
    const ziel = new URL(link.searchParams.get('url')!)
    assert.equal(ziel.hostname, 'www.booking.com')
    assert.equal(ziel.pathname, '/hotel/th/the-peninsula-bangkok.de.html')
    assert.deepEqual(Object.fromEntries(ziel.searchParams), {
      checkin: daten.anreise,
      checkout: daten.abreise,
      group_adults: '3',
      no_rooms: '2',
      group_children: '0',
      selected_currency: 'CHF',
    })
    for (const [anreise, abreise] of [
      ['', ''],
      ['2090-02-30', '2090-03-06'],
      ['2010-11-15', '2010-11-21'],
      ['2090-11-15', '2090-11-15'],
    ]) {
      const z = new URL(
        new URL(bookingHotelLink(hotel, { ...daten, anreise: anreise!, abreise: abreise! })).searchParams.get(
          'url',
        )!,
      )
      assert.equal(z.searchParams.has('checkin'), false)
      assert.equal(z.searchParams.has('checkout'), false)
    }
  })
})
