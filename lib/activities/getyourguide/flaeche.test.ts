import { describe, test } from 'node:test'
import assert from 'node:assert/strict'
import { createElement, type ReactElement } from 'react'
import { renderToStaticMarkup } from 'react-dom/server'

import AktivitaetenBereich, { nativeAktivitaetsAnzeige } from '@/components/trips/AktivitaetenBereich'
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

describe('Native Aktivitätensuche bei unavailable', () => {
  test('unavailable versteckt die Angebotszusage und benennt die Prüfung neu', () => {
    const aus = nativeAktivitaetsAnzeige('unavailable')
    assert.equal(aus.label, 'Suche erneut prüfen')
    assert.equal(aus.abdeckung, false)
    assert.equal(nativeAktivitaetsAnzeige(null).label, 'Für diesen Tag suchen')
    assert.equal(nativeAktivitaetsAnzeige('ok').label, 'Erneut suchen')
    assert.equal(nativeAktivitaetsAnzeige('ok').abdeckung, true)
    assert.equal(nativeAktivitaetsAnzeige('partial').abdeckung, true)
    assert.equal(nativeAktivitaetsAnzeige('empty').abdeckung, true)
    assert.equal(nativeAktivitaetsAnzeige('error').label, 'Erneut suchen')
    assert.equal(nativeAktivitaetsAnzeige('error').abdeckung, true)
  })
})

describe('GetYourGuide-Fläche', () => {
  test('ohne Tage bleibt die native Erklärung und GetYourGuide lädt noch nichts', () => {
    const html = markup(
      createElement(AktivitaetenBereich, {
        reise: reise({
          stages: [etappe({ id: 'stage-gyg-pa', name: 'Panama', countryCode: 'PA', placeId: panama.id })],
        }),
      }),
    )
    assert.match(html, /data-aktivitaet-ziel-status="ausstehend"/)
    assert.match(html, /Angebote laden dabei noch nicht/)
    assert.equal(html.includes('Diese Reise hat noch keine Tage'), false)
    assert.match(html, /data-gyg-zustand="ort_ausstehend"/)
    assert.match(html, /lädt dabei noch nichts/)
    assert.equal(html.includes('Panama City'), false)
    assert.equal(html.includes('Bei GetYourGuide anzeigen'), false)
    assert.equal(html.includes('widget.getyourguide.com'), false)
    assert.equal(html.includes('<iframe'), false)
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
    assert.match(html, /data-aktivitaet-ziel-status="ausstehend"/)
    assert.equal(html.includes('Zielort fehlt'), false)
    const gyg = html.split('aria-label="GetYourGuide"')[1] ?? ''
    assert.equal(gyg.includes('nicht ersatzweise einen anderen Tag'), false)
    assert.match(gyg, /data-gyg-zustand="ort_ausstehend"/)
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
    assert.match(html, /data-gyg-zustand="ort_ausstehend"/)
    assert.equal(html.includes('synthetic-public'), false)
    assert.equal(html.includes('<iframe'), false)
  })

  test('eine Anwendungsherkunft ignoriert die injizierte Kennung, eine Prüfnaht zeigt die Suche', () => {
    const orte = [panama]
    const offen: GetYourGuideNaht = {
      herkunft: 'anwendung',
      freigabe: { status: 'bereit' },
      orteLesen: (id) => orte.find((eintrag) => eintrag.id === id) ?? null,
      kanonBestaetigen: null,
      renderer: null,
    }
    const anwendung = markup(
      createElement(GetYourGuidePruefFlaeche, {
        reise: reise({ stages: [etappe({ id: 'stage-gyg-pa', name: 'Panama', placeId: panama.id, countryCode: 'PA' })] }),
        angeforderteTagId: null,
        naht: offen,
      }),
    )
    assert.match(anwendung, /data-gyg-zustand="ort_ausstehend"/)
    assert.equal(anwendung.includes('Bei GetYourGuide anzeigen'), false)
    assert.equal(anwendung.includes('synthetic-public'), false)

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
    assert.match(pruefung, /Integration Analyzer/)
    assert.match(pruefung, /Der Analyzer dient GetYourGuide zur Auswertung der Einbindung und ihrer Nutzung/)
    assert.match(pruefung, /Datenschutz von GetYourGuide/)
    assert.match(pruefung, /Ein Angebotsklick kann zunächst eine Ergebnisliste bei GetYourGuide öffnen/)
    assert.equal(pruefung.includes('Panama City'), false)
    assert.equal(pruefung.includes('<iframe'), false)
    assert.equal(pruefung.includes('widget.getyourguide.com'), false)
    assert.equal(ANWENDUNGS_NAHT.renderer, null)
    assert.equal(ANWENDUNGS_NAHT.kanonBestaetigen, null)
  })

  test('zwei Länder bleiben als Auswahl sichtbar', () => {
    const bangkok = ort('geonames:1609350', 'Bangkok', 'city', 'TH', 'Thailand')
    const html = markup(
      createElement(GetYourGuidePruefFlaeche, {
        reise: reise({
          stages: [
            etappe({ id: 'stage-gyg-bkk', name: 'Bangkok', placeId: bangkok.id, countryCode: 'TH' }),
            etappe({ id: 'stage-gyg-pa', name: 'Panama', placeId: panama.id, countryCode: 'PA' }),
          ],
        }),
        angeforderteTagId: null,
        naht: {
          herkunft: 'pruefung',
          freigabe: { status: 'bereit' },
          orteLesen: (id) => (id === bangkok.id ? bangkok : id === panama.id ? panama : null),
          kanonBestaetigen: null,
          renderer: null,
        },
      }),
    )
    assert.match(html, /data-gyg-zustand="land_auswahl"/)
    assert.match(html, /name="gyg-land-/)
    assert.equal(html.includes('name="gyg-land-trip-gyg-1"'), false)
    assert.equal(html.split('type="radio"').length - 1, 2)
    assert.match(html, /Panama/)
    assert.match(html, /Thailand/)
    assert.equal(html.includes('Bei GetYourGuide anzeigen'), false)
  })
})
