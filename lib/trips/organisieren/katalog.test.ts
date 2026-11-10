import assert from 'node:assert/strict'
import { describe, it } from 'node:test'
import type { TripStage } from '@/types/trips'
import {
  BOOKING_HOTEL_PARTNERLINK,
  bookingHotelSuche,
  etappenZiel,
  reiseFoto,
  vorgeschlagenerFlughafen,
} from './katalog'

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
  it('findet das Fotomotiv für die echte Reiseetappe', () => {
    assert.equal(etappenZiel(etappe), etappenZiel({ ...etappe, placeId: null }))
    assert.notEqual(reiseFoto(etappe, true), reiseFoto(undefined, true))
    assert.match(reiseFoto({ ...etappe, name: 'Nusa Penida', placeId: 'geonames:1631470', countryCode: 'ID' }), /nusa-penida/)
    assert.match(reiseFoto({ ...etappe, name: 'Republic of Panama', placeId: 'geonames:3703430', countryCode: 'PA' }), /panama/)
    assert.equal(reiseFoto({ ...etappe, name: 'Anderer Ort', placeId: null, countryCode: 'PA' }), reiseFoto())
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
  it('übergibt Reiseziel, Belegung und Termine an die weltweite Booking.com-Suche', () => {
    assert.equal(BOOKING_HOTEL_PARTNERLINK, 'https://www.anrdoezrs.net/click-101919996-14082404')
    const daten = { anreise: '2090-11-15', abreise: '2090-11-21', gaeste: 3, zimmer: 2, waehrung: 'CHF' }
    const suche = bookingHotelSuche({ name: 'Paris', countryCode: 'FR' }, daten)
    assert.ok('ziel' in suche)
    const ziel = new URL(suche.ziel)
    assert.equal(ziel.origin + ziel.pathname, 'https://www.booking.com/searchresults.de.html')
    assert.deepEqual(Object.fromEntries(ziel.searchParams), {
      ss: 'Paris, Frankreich',
      checkin: daten.anreise,
      checkout: daten.abreise,
      group_adults: '3',
      no_rooms: '2',
      group_children: '0',
      selected_currency: 'CHF',
    })
    const offen = bookingHotelSuche(
      { name: 'Ko Chang', countryCode: null },
      { ...daten, anreise: '', abreise: '' },
    )
    assert.ok('ziel' in offen)
    assert.equal(new URL(offen.ziel).searchParams.get('ss'), 'Ko Chang')
    assert.equal(new URL(offen.ziel).searchParams.has('checkin'), false)
    assert.equal(new URL(offen.ziel).searchParams.has('checkout'), false)
    for (const [anreise, abreise] of [
      ['2090-02-30', '2090-03-04'],
      ['', '2090-11-21'],
      ['2090-11-15', ''],
      ['2010-11-15', '2010-11-21'],
      ['2090-11-15', '2090-11-15'],
    ]) {
      assert.ok('fehler' in bookingHotelSuche(etappe, { ...daten, anreise, abreise }))
    }
  })
})
