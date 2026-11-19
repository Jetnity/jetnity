import assert from 'node:assert/strict'
import { test } from 'node:test'
import { createElement } from 'react'
import { renderToStaticMarkup } from 'react-dom/server'
import Hotelsuche from '@/components/trips/organisieren/Hotelsuche'
import { beispielreise } from '@/lib/reiseaenderung/fixtures/reise'
import type { TripStage } from '@/types/trips'

function etappe(teil: Partial<TripStage> & Pick<TripStage, 'id' | 'position'>): TripStage {
  return {
    name: 'Bangkok',
    countryCode: 'TH',
    placeId: 'geonames:1609350',
    latitude: 13.75,
    longitude: 100.52,
    arrivalDate: null,
    departureDate: null,
    ...teil,
  }
}

test('die Hotelsuche zeigt eine Familie nicht als vier Erwachsene und trennt zwei Bangkok-Etappen', () => {
  const basis = beispielreise()
  const erste = etappe({ id: 'bkk-1', position: 1, arrivalDate: '2027-03-01', departureDate: '2027-03-06' })
  const zweite = etappe({ id: 'bkk-2', position: 2 })
  const reise = {
    ...basis,
    title: 'Thailand',
    travellers: 4,
    startDate: '2027-03-01',
    endDate: '2027-03-20',
    stages: [erste, zweite],
    days: [],
    ohneTag: [],
    party: undefined,
  }
  const html = renderToStaticMarkup(createElement(Hotelsuche, {
    reise,
    start: erste,
    auswahlVersion: 0,
    etappen: createElement('p', null, 'Etappen'),
  }))
  assert.match(html, /Reisegruppe: 4 Personen/)
  assert.match(html, /Belegung offen/)
  assert.match(html, /Alter und Zimmer sind nicht belegt/)
  assert.doesNotMatch(html, /4 Erwachsene/)
  assert.match(html, /1\. Bangkok/)
  assert.match(html, /2\. Bangkok/)
  assert.match(html, /Zeitraum offen/)
  assert.match(html, /Aufenthaltsdaten aus dieser Etappe/)
  assert.doesNotMatch(html, /Kinderalter überträgt/)
  assert.equal((html.match(/value="bkk-1"/g) ?? []).length > 0, true)
  assert.equal((html.match(/value="bkk-2"/g) ?? []).length > 0, true)
})

test('eine Person wird ebenfalls nicht als nachgewiesener Erwachsener angezeigt', () => {
  const basis = beispielreise()
  const nur = etappe({ id: 'solo', position: 1, name: 'Phuket', placeId: 'geonames:1151254' })
  const reise = { ...basis, travellers: 1, stages: [nur], days: [], ohneTag: [], party: undefined }
  const html = renderToStaticMarkup(createElement(Hotelsuche, {
    reise,
    start: nur,
    auswahlVersion: 0,
    etappen: createElement('p', null, 'Etappe'),
  }))
  assert.match(html, /Reisegruppe: 1 Person/)
  assert.match(html, /Belegung offen/)
  assert.doesNotMatch(html, /1 Erwachsener/)
  assert.match(html, /Aufenthaltsdaten aus deiner Reise/)
})
