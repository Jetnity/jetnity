import assert from 'node:assert/strict'
import { test } from 'node:test'
import { stay22Suche, stay22OrtAusEtappe, type Stay22Eingabe } from './suche'
import { stay22DatenschutzErlaubt } from './rahmen'
import { CMP_CATEGORIES } from '@/lib/privacy/privacybee-cmp/vertrag'

const eingabe: Stay22Eingabe = { ort: { name: 'Bangkok', adresse: 'Bangkok, Thailand', latitude: 13.75, longitude: 100.52 }, anreise: '2027-02-27', abreise: '2027-03-02', erwachsene: 2, kinder: 1, zimmer: 2, waehrung: 'CHF' }
const heute = '2027-02-01'

test('Stay22 sucht den expliziten Aufenthalt mit Gesamtpreisen und der Jetnity-Zuordnung', () => {
  const result = stay22Suche(eingabe, heute)
  assert.ok('suche' in result)
  assert.equal(result.suche.naechte, 3)
  const u = new URL(result.suche.url)
  assert.equal(u.origin, 'https://www.stay22.com')
  assert.equal(u.pathname, '/embed/gm')
  for (const [k,v] of Object.entries({ aid: 'jetnity', campaign: 'jetnity-unterkunft', checkin: '2027-02-27', checkout: '2027-03-02', adults: '2', children: '1', rooms: '2', currency: 'CHF', priceper: 'total', ljs: 'de', lat: '13.75', lng: '100.52' })) assert.equal(u.searchParams.get(k), v, k)
  assert.equal(u.searchParams.has('roam'), false)
  assert.equal(u.searchParams.has('min'), false, 'kein unbewiesener Währungs-/Budgetfilter')
  assert.equal(u.searchParams.has('max'), false)
  assert.deepEqual([...u.searchParams.keys()].sort(), ['aid','campaign','address','checkin','checkout','adults','children','rooms','currency','ljs','unitsystem','priceper','maincolor','fontcolor','hotelscolor','hotelsfontcolor','mapstyle','viewmode','listviewexpand','limit','zoom','hidesearchbar','hidecheckinout','hideguestpicker','hidecurrency','hidemodeswitcher','lat','lng'].sort())
})

test('Ungültige, fehlende, alte und verkehrte Reisedaten erzeugen niemals Ersatzangebote', () => {
  for (const [anreise, abreise] of [
    ['', ''], ['', '2027-03-02'], ['2027-02-27', ''], ['2027-02-30', '2027-03-02'],
    ['2027-02-27', '2027-02-27'], ['2027-03-02', '2027-02-27'],
    ['2027-01-31', '2027-03-02'], ['2029-03-01', '2029-03-04'], ['2027-02-27', '2027-12-01'],
  ]) assert.ok('fehler' in stay22Suche({ ...eingabe, anreise, abreise }, heute), `${anreise}/${abreise}`)
})

test('Belegung, Ortswahl und Währung werden vor einer Anfrage validiert', () => {
  for (const patch of [
    { ort: null }, { erwachsene: 0 }, { erwachsene: 2.2 }, { erwachsene: 10 },
    { kinder: -1 }, { kinder: 9 }, { kinder: NaN }, { zimmer: 0 }, { zimmer: 3 },
    { waehrung: 'ABC' }, { waehrung: 'chf' },
  ]) assert.ok('fehler' in stay22Suche({ ...eingabe, ...patch }, heute))
})

test('Öffentlicher Ort bleibt ohne Koordinaten verwendbar; private Graphdaten verlassen Jetnity nicht', () => {
  const ort = stay22OrtAusEtappe({ id: 'private-stage-123', position: 1, name: 'Paris', countryCode: 'FR', placeId: 'geonames:2988507', arrivalDate: null, departureDate: null, latitude: null, longitude: null })
  assert.ok(ort)
  const result = stay22Suche({ ...eingabe, ort }, heute)
  assert.ok('suche' in result)
  const u = new URL(result.suche.url)
  assert.match(u.searchParams.get('address')!, /^Paris, /)
  assert.equal(u.searchParams.has('lat'), false)
  assert.doesNotMatch(u.href, /private-stage|geonames|tripId|budget|passport/)
  for (const [latitude, longitude] of [[NaN, 1], [91, 1], [1, 181], [1, null]]) {
    const invalid = stay22Suche({ ...eingabe, ort: { ...ort, latitude, longitude } }, heute)
    assert.ok('suche' in invalid)
    assert.equal(new URL(invalid.suche.url).searchParams.has('lat'), false)
  }
})

test('CMP-Ablehnung und fehlerhafte API blockieren die explizite Suche', () => {
  assert.equal(stay22DatenschutzErlaubt(undefined, false), true)
  assert.equal(stay22DatenschutzErlaubt(undefined, true), false)
  assert.equal(stay22DatenschutzErlaubt({}, false), false)
  const consents = Object.fromEntries(CMP_CATEGORIES.map(c => [c, true]))
  const api = { getAllConsents: () => consents, getConsent: (c: string) => consents[c], hasExplicitConsent: () => true }
  assert.equal(stay22DatenschutzErlaubt(api, true), true)
  consents.AD_STORAGE = false
  assert.equal(stay22DatenschutzErlaubt(api, false), false)
  consents.AD_STORAGE = true
  assert.equal(stay22DatenschutzErlaubt({ ...api, hasExplicitConsent: () => false }, false), false)
})
