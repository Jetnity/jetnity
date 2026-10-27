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

  test('bekannte Etappendaten bleiben die Hotelspanne, nicht die ganze Reise', () => {
    const html = renderToStaticMarkup(createElement(HotelBereich, { reise: beispielreise() }))
    assert.match(html, /2 Nächte/)
    assert.match(html, /1 Nacht/)
    assert.doesNotMatch(html, /4 Nächte/)
    assert.equal(html.includes(HOTELZEITRAUM_OFFEN), false)
  })
})
