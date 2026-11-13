import assert from 'node:assert/strict'
import { test } from 'node:test'
import { STAY22_FILTER, STAY22_WAEHRUNGEN, stay22Suche, stay22OrtAusEtappe, stay22Ansicht, type Stay22Eingabe } from './suche'
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
  assert.deepEqual([...u.searchParams.keys()].sort(), ['aid','campaign','hotelsapi','address','checkin','checkout','adults','children','rooms','currency','ljs','unitsystem','priceper','maincolor','fontcolor','hotelscolor','hotelsfontcolor','mapstyle','viewmode','listviewexpand','limit','zoom','hidesearchbar','hidecheckinout','hideguestpicker','hidecurrency','hidemodeswitcher','hidebrandlogo','hideenlargemap','lat','lng'].sort())
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

test('Maps-Bewertung wird auf die Anbieterskala umgerechnet; Kartenorte enthalten keine privaten Zusatzfelder', () => {
  const result = stay22Suche({ ...eingabe, filter: { sterne: 4, bewertung: 8, preis: 'nightly' }, umgebung: true, kartenorte: [
    { name: 'Reisestopp <1>\n', latitude: 13.75, longitude: 100.52 },
    { name: 'Ungültig', latitude: NaN, longitude: 100.52 },
    ...Array.from({ length: 12 }, (_, i) => ({ name: `Ort ${i}`, latitude: 13.7 + i / 100, longitude: 100.5 })),
  ] }, heute)
  assert.ok('suche' in result)
  const p = new URL(result.suche.url).searchParams
  assert.equal(p.get('minstarrating'), '4'); assert.equal(p.get('minguestrating'), '4')
  assert.equal(p.get('priceper'), 'nightly'); assert.equal(p.get('zoom'), '14')
  const pois = JSON.parse(p.get('poi')!)
  assert.equal(pois.length, 8)
  assert.equal(result.suche.kartenorte, 8)
  assert.equal(pois[0].name, 'Reisestopp 1')
  assert.deepEqual(Object.keys(pois[0]).sort(), ['lat', 'lng', 'name', 'size'])
  for (const filter of [{ sterne: 8, bewertung: 8, preis: 'total' as const }, { sterne: 0, bewertung: NaN, preis: 'total' as const }]) assert.ok('fehler' in stay22Suche({ ...eingabe, filter }, heute))
})


test('Ansichtswechsel bewahrt Suchbedingungen und Ortsmarker', () => {
  const result = stay22Suche(eingabe, heute)
  assert.ok('suche' in result)
  for (const ansicht of ['map', 'listview', 'all'] as const) {
    const vorher: URLSearchParams = new URL(result.suche.url).searchParams
    const danach: URLSearchParams = new URL(stay22Ansicht(result.suche.url, ansicht)).searchParams
    assert.equal(danach.get('viewmode'), ansicht)
    assert.equal(danach.get('listviewexpand'), String(ansicht === 'all'))
    for (const [key, value] of vorher) if (!['viewmode','listviewexpand'].includes(key)) assert.equal(danach.get(key), value)
  }
})

test('Filterkombinationen und Währungswechsel bewahren Reisedaten und Partnerzuordnung', () => {
  // Observed Maps contract: 6/10 → 3, 7/10 → 3.5, 8/10 → 4, 9/10 → 4.5.
  // Do not reuse the distinct v3 accommodation API's ten-point scale.
  const mapsBewertungen: Record<number, string | null> = { 0: null, 6: '3', 7: '3.5', 8: '4', 9: '4.5' }
  for (const sterne of [0, 1, 2, 3, 4, 5]) for (const bewertung of [0, 6, 7, 8, 9]) {
    for (const preis of ['total', 'nightly'] as const) for (const waehrung of STAY22_WAEHRUNGEN) {
      const result = stay22Suche({ ...eingabe, waehrung, filter: { sterne, bewertung, preis } }, heute)
      assert.ok('suche' in result)
      const p = new URL(result.suche.url).searchParams
      assert.equal(p.get('minstarrating'), sterne ? String(sterne) : null)
      assert.equal(p.get('minguestrating'), mapsBewertungen[bewertung])
      assert.equal(p.get('currency'), waehrung)
      assert.equal(p.get('priceper'), preis)
      assert.equal(p.get('hotelsapi'), 'booking', 'Hotelquelle mit live geprüfter Sterneskala bleibt stabil')
      assert.equal(p.get('min'), null, 'Währung darf keinen USD-Budgetfilter erzeugen')
      assert.equal(p.get('max'), null)
      for (const [name, value] of Object.entries({ aid: 'jetnity', campaign: 'jetnity-unterkunft',
        checkin: eingabe.anreise, checkout: eingabe.abreise, adults: '2', children: '1', rooms: '2', lat: '13.75', lng: '100.52' })) {
        assert.equal(p.get(name), value, name)
      }
    }
  }
})

test('Filter zurücksetzen entfernt Sterne und Gästebewertung ohne die Suche zu verlieren', () => {
  const gefiltert = stay22Suche({ ...eingabe, filter: { sterne: 5, bewertung: 9, preis: 'nightly' } }, heute)
  const zurueckgesetzt = stay22Suche({ ...eingabe, filter: { ...STAY22_FILTER } }, heute)
  const standard = stay22Suche(eingabe, heute)
  assert.ok('suche' in gefiltert && 'suche' in zurueckgesetzt && 'suche' in standard)
  assert.notEqual(gefiltert.suche.url, zurueckgesetzt.suche.url)
  assert.equal(zurueckgesetzt.suche.url, standard.suche.url)
})
