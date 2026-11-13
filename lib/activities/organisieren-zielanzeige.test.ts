import assert from 'node:assert/strict'
import { describe, it } from 'node:test'
import { createElement } from 'react'
import { renderToStaticMarkup } from 'react-dom/server'
import AktivitaetenBereich from '@/components/trips/AktivitaetenBereich'
import type { Ort } from '@/lib/places/domain'
import type { Trip } from '@/types/trips'

const paris: Ort = {
  id: 'geonames:2988507', source: 'geonames', sourceId: '2988507', name: 'Paris',
  typ: 'city', country: 'Frankreich', countryCode: 'FR', region: null,
  lat: 48.85341, lon: 2.3488, iata: null, keywords: null,
}

const reise: Trip = {
  id: 'trip-paris', clientRef: 'trip-paris', title: 'Paris', origin: null,
  originPlaceId: null, startDate: null, endDate: null, travellers: 2,
  currency: 'CHF', budgetAmount: null, status: 'draft', pace: 'balanced',
  interests: [], travelWish: null, revision: 1, lastMutationId: null,
  stages: [{
    id: 'stage-paris', position: 1, name: 'Paris', countryCode: 'FR', placeId: paris.id,
    arrivalDate: null, departureDate: null, latitude: paris.lat, longitude: paris.lon,
  }],
  days: [], ohneTag: [], createdAt: '2026-11-13T00:00:00.000Z', updatedAt: '2026-11-13T00:00:00.000Z',
}

describe('Aktivitätenziel aus der Organisieren-Etappe', () => {
  it('erklärt die bereits ausgewählte Paris-Etappe nicht zu einem fehlenden Reiseziel', () => {
    const html = renderToStaticMarkup(createElement(AktivitaetenBereich, {
      reise, organisierenEtappe: 'stage-paris', bestaetigteOrte: new Map([[paris.id, paris]]),
    }))
    assert.equal(html.includes('Diese Reise hat noch kein Ziel'), false)
    assert.match(html, /data-aktivitaet-ziel-status="bereit"/)
    assert.match(html, /Paris/)
  })

  it('meldet eine wirklich leere Reise weiterhin ohne ein Ziel zu erfinden', () => {
    const html = renderToStaticMarkup(createElement(AktivitaetenBereich, {
      reise: { ...reise, stages: [] }, bestaetigteOrte: new Map(),
    }))
    assert.match(html, /Diese Reise hat noch kein Ziel/)
  })
})
