import { describe, test } from 'node:test'
import assert from 'node:assert/strict'
import { createElement, type ReactElement } from 'react'
import { renderToStaticMarkup } from 'react-dom/server'

import AktivitaetenBereich from '@/components/trips/AktivitaetenBereich'
import GetYourGuideAktivitaeten, { GetYourGuidePruefFlaeche } from '@/components/trips/GetYourGuideAktivitaeten'
import { ANWENDUNGS_NAHT, type GetYourGuideNaht } from '@/lib/activities/getyourguide/widget'
import type { Ort } from '@/lib/places/domain'
import type { Trip, TripDay, TripStage } from '@/types/trips'

function ort(id: string, name: string, typ: Ort['typ'], countryCode: string, country: string): Ort {
  return {
    id,
    source: 'geonames',
    sourceId: id.split(':')[1] ?? id,
    name,
    typ,
    country,
    countryCode,
    region: null,
    lat: null,
    lon: null,
    iata: null,
    keywords: null,
  }
}

const panama = ort('geonames:9003703430', 'Panama', 'country', 'PA', 'Panama')

function etappe(teil: Partial<TripStage> & Pick<TripStage, 'id' | 'name'>): TripStage {
  return {
    position: 1,
    countryCode: null,
    arrivalDate: null,
    departureDate: null,
    latitude: null,
    longitude: null,
    placeId: null,
    ...teil,
  }
}

function tag(teil: Partial<TripDay> & Pick<TripDay, 'id' | 'dayIndex'>): TripDay {
  return {
    stageId: null,
    dayDate: null,
    title: null,
    items: [],
    ...teil,
  }
}

function reise(teil: Partial<Trip> = {}): Trip {
  return {
    id: 'trip-gyg-1',
    clientRef: 'trip-gyg-1',
    title: 'Reise',
    origin: null,
    originPlaceId: null,
    startDate: null,
    endDate: null,
    travellers: 2,
    currency: 'CHF',
    budgetAmount: null,
    status: 'draft',
    pace: 'balanced',
    interests: [],
    travelWish: null,
    revision: 1,
    lastMutationId: null,
    stages: [],
    days: [],
    ohneTag: [],
    createdAt: '2026-10-26T00:00:00.000Z',
    updatedAt: '2026-10-26T00:00:00.000Z',
    ...teil,
  }
}

function markup(knoten: ReactElement): string {
  return renderToStaticMarkup(knoten)
}

describe('GetYourGuide-Fläche', () => {
  test('ohne Tage bleibt die native Erklärung und die Fläche geschlossen', () => {
    const html = markup(
      createElement(AktivitaetenBereich, {
        reise: reise({
          stages: [etappe({ id: 'stage-gyg-pa', name: 'Panama', countryCode: 'PA', placeId: panama.id })],
        }),
      }),
    )
    assert.match(html, /Diese Reise hat noch keine Tage/)
    assert.match(html, /noch nicht eingerichtet/)
    assert.match(html, /data-gyg-zustand="geschlossen"/)
    assert.equal(html.includes('Panama City'), false)
    assert.equal(html.includes('Bei GetYourGuide anzeigen'), false)
    assert.equal(html.includes('Jetnity empfiehlt'), false)
  })

  test('ein ungültiger Tag bleibt für GetYourGuide ungültig und die native Fläche behält den ersten Tag', () => {
    const html = markup(
      createElement(AktivitaetenBereich, {
        reise: reise({
          stages: [etappe({ id: 'stage-gyg-phu', name: 'Phuket', countryCode: 'TH', placeId: 'geonames:9001151254' })],
          days: [
            tag({ id: 'day-gyg-1', dayIndex: 1, stageId: 'stage-gyg-phu', title: 'Phuket-Tag' }),
            tag({ id: 'day-gyg-2', dayIndex: 2, stageId: 'stage-gyg-phu', title: 'Zweiter Tag' }),
          ],
        }),
        tagId: 'day-fehlt',
      }),
    )
    assert.match(html, /Phuket-Tag/)
    assert.match(html, /Für diesen Tag suchen|Für diese Angaben liegt noch keine Suche vor/)
    const gyg = html.split('aria-label="GetYourGuide"')[1] ?? ''
    assert.match(gyg, /nicht ersatzweise einen anderen Tag/)
    assert.equal(gyg.includes('Phuket'), false)
    assert.match(gyg, /data-gyg-zustand="tag_ungueltig"/)
  })

  test('die Anwendungsfläche ignoriert eine mitgegebene Prüfnaht nicht, weil sie keine annimmt', () => {
    const html = markup(
      createElement(GetYourGuideAktivitaeten, {
        reise: reise({
          stages: [etappe({ id: 'stage-gyg-pa', name: 'Panama', countryCode: 'PA', placeId: panama.id })],
        }),
        angeforderteTagId: null,
      }),
    )
    assert.match(html, /data-gyg-zustand="geschlossen"/)
    assert.equal(html.includes('synthetic-public'), false)
  })

  test('eine Naht mit Anwendungherkunft bleibt geschlossen, eine Prüfnaht darf den nächsten Schritt zeigen', () => {
    const orte = [panama]
    const offen: GetYourGuideNaht = {
      herkunft: 'anwendung',
      freigabe: { status: 'bereit' },
      orteLesen: (id) => orte.find((eintrag) => eintrag.id === id) ?? null,
      abbildung: [{ art: 'land', countryCode: 'PA', kennung: 'synthetic-public:panama' }],
      renderer: null,
    }
    const geschlossen = markup(
      createElement(GetYourGuidePruefFlaeche, {
        reise: reise({ stages: [etappe({ id: 'stage-gyg-pa', name: 'Panama', placeId: panama.id, countryCode: 'PA' })] }),
        angeforderteTagId: null,
        naht: offen,
      }),
    )
    assert.match(geschlossen, /data-gyg-zustand="geschlossen"/)
    assert.equal(geschlossen.includes('Bei GetYourGuide anzeigen'), false)

    const pruefung = markup(
      createElement(GetYourGuidePruefFlaeche, {
        reise: reise({ stages: [etappe({ id: 'stage-gyg-pa', name: 'Panama', placeId: panama.id, countryCode: 'PA' })] }),
        angeforderteTagId: null,
        naht: { ...offen, herkunft: 'pruefung' },
      }),
    )
    assert.match(pruefung, /data-gyg-zustand="bereit"/)
    assert.match(pruefung, /Bei GetYourGuide anzeigen/)
    assert.match(pruefung, /Ideen für Panama/)
    assert.equal(pruefung.includes('Panama City'), false)
    assert.equal(ANWENDUNGS_NAHT.renderer, null)
  })
})
