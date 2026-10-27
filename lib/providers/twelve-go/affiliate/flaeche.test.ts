import { describe, test } from 'node:test'
import assert from 'node:assert/strict'
import { createElement } from 'react'
import { renderToStaticMarkup } from 'react-dom/server'

import MobilitaetBereich from '@/components/trips/MobilitaetBereich'
import TwelveGoAffiliateLinks from '@/components/trips/TwelveGoAffiliateLinks'
import { leereMobilitaet } from '@/lib/trips/mobilitaet-felder'
import { unbestaetigteBuchung } from '@/lib/trips/buchung'
import type { Trip, TripItem, TripStage } from '@/types/trips'

const JETZT = '2026-10-27T18:00:00.000Z'

function etappe(teil: Partial<TripStage> & Pick<TripStage, 'id' | 'name' | 'position'>): TripStage {
  return {
    countryCode: 'TH',
    arrivalDate: null,
    departureDate: null,
    latitude: null,
    longitude: null,
    placeId: null,
    ...teil,
  }
}

function reise(teil: Partial<Trip> = {}): Trip {
  return {
    id: 'trip-flaeche',
    clientRef: 'ref-bleibt-lokal',
    title: 'Flaeche',
    origin: 'Zürich',
    originPlaceId: 'geonames:2657896',
    startDate: '2026-11-01',
    endDate: '2026-11-20',
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
      etappe({ id: 'bkk', name: 'Bangkok', position: 1, placeId: 'geonames:1609350' }),
      etappe({ id: 'koh', name: 'Koh Chang', position: 2 }),
      etappe({ id: 'hkt', name: 'Phuket', position: 3 }),
    ],
    days: [],
    ohneTag: [],
    createdAt: JETZT,
    updatedAt: JETZT,
    ...teil,
  }
}

function anker(html: string): string[] {
  return [...html.matchAll(/<a\b[^>]*>[\s\S]*?<\/a>/g)].map((treffer) => treffer[0])
}

describe('12Go-Fläche', () => {
  test('zwei allgemeine Links, kein Drittinhalt, kein Deep Link', () => {
    const html = renderToStaticMarkup(createElement(TwelveGoAffiliateLinks, { reise: reise() }))
    assert.equal(html.includes('data-twelve-go-affiliate="1"'), true)
    assert.equal(html.includes('Externer Affiliate-Link – Angebote, Verfügbarkeit und Buchung ausschliesslich bei 12Go'), true)
    const links = anker(html)
    assert.equal(links.length, 2)
    assert.equal(links.every((link) => link.includes('target="_blank"')), true)
    assert.equal(links.every((link) => link.includes('rel="noopener noreferrer sponsored"')), true)
    assert.equal(links.every((link) => link.includes('min-h-11')), true)
    assert.equal(links.every((link) => link.includes('data-twelve-go-art="generic"')), true)
    assert.equal(links.every((link) => link.includes('https://12go.asia/?z=17323861&amp;sub_id=jetnity-mobility-route')), true)
    assert.equal(links.every((link) => link.includes('Bei 12Go selbst nach Verbindungen suchen')), true)
    assert.equal(html.includes('Bitte Strecke und Datum bei 12Go auswählen'), true)
    assert.equal(html.includes('data-twelve-go-kante="bkk:koh"'), true)
    assert.equal(html.includes('data-twelve-go-kante="koh:hkt"'), true)
    assert.equal(html.includes('data-twelve-go-kante="bkk:hkt"'), false)
    assert.equal(html.includes('<iframe'), false)
    assert.equal(html.includes('<script'), false)
    assert.equal(html.includes('<img'), false)
    assert.equal(html.includes('src='), false)
    assert.doesNotMatch(html, /\/de\/travel\/|date=|CHF|ref-bleibt/)
    assert.equal(html.includes('Zürich'), false)
  })

  test('ohne zweite Etappe gibt es keinen Ausgang', () => {
    const html = renderToStaticMarkup(
      createElement(TwelveGoAffiliateLinks, {
        reise: reise({ stages: [etappe({ id: 'bkk', name: 'Bangkok', position: 1 })] }),
      }),
    )
    assert.equal(anker(html).length, 0)
    assert.match(html, /Sobald mindestens zwei Ziele/)
  })

  test('geplantes Transferdatum steht in der Fläche und nicht in der Adresse', () => {
    const transfer: TripItem = {
      id: 'transfer-1',
      dayId: null,
      stageId: null,
      kind: 'transfer',
      title: 'Fähre',
      note: null,
      position: 1,
      startsOn: '2026-11-15',
      startsAt: null,
      endsOn: '2026-11-16',
      endsAt: null,
      priceAmount: null,
      priceCurrency: 'CHF',
      provider: null,
      externalRef: null,
      bookingUrl: null,
      ...unbestaetigteBuchung(),
      ...leereMobilitaet(),
      originPlaceId: 'geonames:1609350',
      destinationPlaceId: 'geonames:9002',
      originName: 'Bangkok',
      destinationName: 'Koh Chang',
    }
    const html = renderToStaticMarkup(
      createElement(TwelveGoAffiliateLinks, {
        reise: reise({
          stages: [
            etappe({ id: 'bkk', name: 'Bangkok', position: 1, placeId: 'geonames:1609350', arrivalDate: '2026-11-01' }),
            etappe({ id: 'koh', name: 'Koh Chang', position: 2, placeId: 'geonames:9002', arrivalDate: '2026-11-16' }),
          ],
          ohneTag: [transfer],
        }),
      }),
    )
    assert.equal(html.includes('data-geplant="2026-11-15"'), true)
    assert.match(html, /Geplant am .+ Bitte das Datum bei 12Go bestätigen/)
    assert.doesNotMatch(html, /date=|2026-11-15\?|currency=CHF|pax=/)
    assert.match(html, /Währung und Anzahl Reisende bitte bei 12Go prüfen/)
  })

  test('Verbindungen enthalten die Fläche und lassen die eigene Suche geschlossen', () => {
    const html = renderToStaticMarkup(createElement(MobilitaetBereich, { reise: reise() }))
    const bestand = html.indexOf('data-organisieren-flaeche="bestand"')
    const affiliate = html.indexOf('data-twelve-go-affiliate="1"')
    const suche = html.indexOf('data-organisieren-flaeche="suche"')
    assert.equal(bestand >= 0 && affiliate > bestand && suche > affiliate, true)
    assert.equal(html.includes('Verbindungen prüfen'), true)
    assert.equal(html.includes('<iframe'), false)
    assert.equal(html.includes('https://12go.asia/?z=17323861&amp;sub_id=jetnity-mobility-route'), true)
  })
})
