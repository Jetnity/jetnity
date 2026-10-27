// Synthetic Guest/Account read of overnight intervals and hotel periods.
// No live provider, account, or browser session.

import assert from 'node:assert/strict'
import { readFileSync } from 'node:fs'
import { describe, test } from 'node:test'
import { createElement } from 'react'
import { renderToStaticMarkup } from 'react-dom/server'

import HotelBereich from '@/components/trips/HotelBereich'
import UnterkunftBestand from '@/components/trips/UnterkunftBestand'
import { HOTELZEITRAUM_OFFEN } from '@/lib/hotels/quartier-kontext'
import { beispielreise } from '@/lib/reiseaenderung/fixtures/reise'
import { unterkunftAbdeckung } from '@/lib/trips/naechte-abdeckung'
import { tripAuditV1 } from '@/lib/trips/trip-audit-v1/audit'
import type { Trip, TripItem, TripStage } from '@/types/trips'

const JETZT = '2026-08-21T00:00:00.000Z'

function etappe(teil: Partial<TripStage> & Pick<TripStage, 'id' | 'name'>): TripStage {
  return {
    position: 1,
    countryCode: 'TH',
    arrivalDate: null,
    departureDate: null,
    latitude: 13.75,
    longitude: 100.5,
    placeId: 'geonames:1609350',
    ...teil,
  }
}

function stay(teil: Partial<TripItem> & Pick<TripItem, 'id'>): TripItem {
  return {
    dayId: null,
    stageId: 'a',
    kind: 'stay',
    title: 'Haus am Fluss',
    note: null,
    position: 1,
    startsOn: '2026-10-01',
    startsAt: null,
    endsOn: '2026-10-03',
    endsAt: null,
    priceAmount: null,
    priceCurrency: null,
    provider: null,
    externalRef: null,
    bookingUrl: null,
    bookingStatus: 'booked',
    bookingSource: 'user',
    bookingConfirmedAt: JETZT,
    mobilityMode: null,
    originPlaceId: null,
    destinationPlaceId: null,
    originName: null,
    destinationName: null,
    connectionRef: null,
    mobilityChanges: null,
    mobilityEvidence: null,
    rentalSupplier: null,
    vehicleClass: null,
    transmission: null,
    rentalEvidence: null,
    ...teil,
  }
}

function zwoelfTage(): Trip {
  return {
    id: 'trip-12',
    clientRef: 'trip-12',
    title: 'Zwölf Tage',
    origin: 'Zürich',
    originPlaceId: null,
    startDate: '2026-10-01',
    endDate: '2026-10-12',
    travellers: 2,
    currency: 'CHF',
    budgetAmount: null,
    status: 'draft',
    pace: 'calm',
    interests: [],
    travelWish: null,
    revision: 1,
    lastMutationId: null,
    stages: [
      etappe({ id: 'a', name: 'Chiang Mai', position: 1, arrivalDate: '2026-10-01', departureDate: '2026-10-03' }),
      etappe({ id: 'b', name: 'Bangkok', position: 2, arrivalDate: '2026-10-04', departureDate: '2026-10-08' }),
      etappe({ id: 'c', name: 'Phuket', position: 3, arrivalDate: '2026-10-09', departureDate: '2026-10-12' }),
    ],
    days: [],
    ohneTag: [stay({ id: 'stay-a' })],
    createdAt: JETZT,
    updatedAt: JETZT,
  }
}

describe('Nächte und Hotelzeitraum', () => {
  test('Gast und Konto lesen dieselbe 11-Intervall-Bilanz', () => {
    const graph = zwoelfTage()
    const gast = unterkunftAbdeckung(graph)
    const konto = unterkunftAbdeckung(graph, graph.ohneTag)
    assert.deepEqual(gast, konto)
    assert.equal(gast.naechteGesamt, 11)
    assert.equal(gast.naechteGebucht, 2)
    assert.deepEqual(tripAuditV1(graph).sections[0], tripAuditV1(graph, graph.ohneTag).sections[0])
    assert.equal(tripAuditV1(graph).sections[0].coverage, 'partial')
    assert.match(tripAuditV1(graph).sections[0].detail, /11 Übernachtungsintervalle/)
    assert.match(tripAuditV1(graph).sections[0].detail, /2 davon Übergang/)
  })

  test('Bestand zeigt Übergangsnächte und behält die gebuchte Unterkunft', () => {
    const html = renderToStaticMarkup(createElement(UnterkunftBestand, { reise: zwoelfTage() }))
    assert.match(html, /Haus am Fluss/)
    assert.match(html, /2 Übernachtungsintervalle liegen im Übergang/)
    assert.match(html, /ohne angenommene Hotelübernachtung/)
    assert.match(html, /Nächte fehlen/)
    assert.doesNotMatch(html, /whitespace-nowrap/)
  })

  test('Mehrort ohne Etappendaten zeigt keinen Reisezeitraum und startet keine Suche', () => {
    const reise = beispielreise()
    reise.stages = reise.stages.map((stufe) => ({ ...stufe, arrivalDate: null, departureDate: null }))
    const html = renderToStaticMarkup(createElement(HotelBereich, { reise }))
    assert.equal((html.match(new RegExp(HOTELZEITRAUM_OFFEN, 'g')) ?? []).length, reise.stages.length)
    assert.doesNotMatch(html, /Sept/)
    assert.doesNotMatch(html, /Nächte/)
    assert.doesNotMatch(html, /api\/hotels\/search/)
    const source = readFileSync(new URL('../../components/trips/HotelBereich.tsx', import.meta.url), 'utf8')
    const guard = source.indexOf('if (!checkIn || !checkOut)')
    const fetchAt = source.indexOf("fetch('/api/hotels/search'")
    assert.ok(guard !== -1 && fetchAt !== -1 && guard < fetchAt)
    assert.match(source, /break-words/)
    assert.doesNotMatch(source, /whitespace-nowrap/)
  })

  test('12 Tage ohne Etappendaten nennen keine Übergangsnacht und keine Hotelsuche', () => {
    const graph = zwoelfTage()
    graph.stages = graph.stages.map((stufe) => ({ ...stufe, arrivalDate: null, departureDate: null }))
    graph.ohneTag = []
    const gast = unterkunftAbdeckung(graph)
    const konto = unterkunftAbdeckung(graph, graph.ohneTag)
    assert.deepEqual(gast, konto)
    assert.equal(gast.bekannt, false)
    assert.equal(gast.naechteGesamt, null)
    assert.equal(gast.kalenderNaechte, 11)
    assert.deepEqual(gast.zeitraeume, [])
    assert.deepEqual(gast.luecken, [])
    const audit = tripAuditV1(graph).sections[0]
    assert.equal(audit.coverage, 'partial')
    assert.match(audit.detail, /11 Übernachtungsintervalle im Reisekalender sind bekannt/)
    assert.doesNotMatch(audit.detail, /Übergang/)
    assert.equal(tripAuditV1(graph).findings.some((fund) => fund.domain === 'lodging' && /Übergang|Hotelpflicht fehlt|Geplante Unterkunftsnacht/.test(fund.title)), false)
    const bestand = renderToStaticMarkup(createElement(UnterkunftBestand, { reise: graph }))
    assert.match(bestand, /11 Übernachtungsintervalle im Reisekalender/)
    assert.match(bestand, /Etappenzuordnung ist unbekannt/)
    assert.match(bestand, /keine Hotelbuchung/)
    assert.doesNotMatch(bestand, /Übergang/)
    const hotel = renderToStaticMarkup(createElement(HotelBereich, { reise: graph }))
    assert.equal((hotel.match(new RegExp(HOTELZEITRAUM_OFFEN, 'g')) ?? []).length, graph.stages.length)
    assert.doesNotMatch(hotel, /api\/hotels\/search/)
  })

  test('teilweise bekannte Etappen erfinden weder Übergang noch Hotelnacht', () => {
    const graph = zwoelfTage()
    graph.stages[1] = { ...graph.stages[1], arrivalDate: null, departureDate: null }
    graph.stages[2] = { ...graph.stages[2], arrivalDate: null, departureDate: null }
    graph.ohneTag = []
    const ergebnis = unterkunftAbdeckung(graph)
    assert.equal(ergebnis.bekannt, false)
    assert.equal(ergebnis.naechteGesamt, null)
    assert.equal(ergebnis.kalenderNaechte, 11)
    assert.deepEqual(ergebnis.luecken, [])
    assert.equal(ergebnis.zeitraeume.length, 1)
    assert.equal(ergebnis.zeitraeume[0]?.stageId, 'a')
    const bestand = renderToStaticMarkup(createElement(UnterkunftBestand, { reise: graph }))
    assert.doesNotMatch(bestand, /Übergang/)
    assert.match(bestand, /Etappenzuordnung ist unbekannt/)
    const audit = tripAuditV1(graph)
    assert.equal(audit.sections[0].coverage, 'partial')
    assert.doesNotMatch(audit.sections[0].detail, /Übergang/)
    assert.equal(audit.findings.some((fund) => fund.domain === 'lodging' && fund.state === 'known_gap'), false)
  })

  test('bekannte Etappendaten bleiben die Hotelspanne, nicht die ganze Reise', () => {
    const html = renderToStaticMarkup(createElement(HotelBereich, { reise: beispielreise() }))
    assert.match(html, /2 Nächte/)
    assert.match(html, /1 Nacht/)
    assert.doesNotMatch(html, /4 Nächte/)
    assert.equal(html.includes(HOTELZEITRAUM_OFFEN), false)
  })
})
