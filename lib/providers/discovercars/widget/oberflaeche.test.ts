import assert from 'node:assert/strict'
import { readFileSync } from 'node:fs'
import { dirname, join } from 'node:path'
import { describe, test } from 'node:test'
import { fileURLToPath } from 'node:url'
import { createElement } from 'react'
import { renderToStaticMarkup } from 'react-dom/server'

import DiscoverCarsWidgetOptin from '@/components/trips/DiscoverCarsWidgetOptin'
import MietwagenBereich from '@/components/trips/MietwagenBereich'
import { beispielreise } from '@/lib/reiseaenderung/fixtures/reise'
import { WIDGET_FIXTURE_TEXT, WIDGET_PRUEFNAHT } from '@/lib/providers/discovercars/widget/vertrag'
import type { TripStage } from '@/types/trips'

const hier = dirname(fileURLToPath(import.meta.url))
const wurzel = join(hier, '../../../..')
const REISE = 'trip-uuid-geheim'

function etappe(teil: Partial<TripStage> & Pick<TripStage, 'id' | 'position' | 'name'>): TripStage {
  return {
    countryCode: null,
    arrivalDate: null,
    departureDate: null,
    latitude: null,
    longitude: null,
    placeId: null,
    ...teil,
  }
}

function abschnitt(html: string, marke: string): string {
  const start = html.indexOf(marke)
  assert.notEqual(start, -1, marke)
  const von = html.lastIndexOf('<section', start)
  const bis = html.indexOf('</section>', start)
  assert.notEqual(von, -1)
  assert.notEqual(bis, -1)
  return html.slice(von, bis + '</section>'.length)
}

describe('DiscoverCars Widget-Gehäuse', () => {
  test('normal zeigt kein Laden, kein Netz und keine Reisedaten', () => {
    const html = renderToStaticMarkup(
      createElement(DiscoverCarsWidgetOptin, { reiseId: REISE, laden: async () => 'fixture' as const }),
    )
    assert.match(html, /data-discovercars-widget="inert"/)
    assert.match(html, /data-discovercars-quelle="LIVE_SOURCE_VERIFIED"/)
    assert.match(html, /data-discovercars-laufzeit="CONSENT_BLOCKED"/)
    assert.match(html, /lädt das Skript nicht/)
    assert.match(html, /übernimmt keine Reisedaten/)
    assert.match(html, /Einwilligung dafür liegt nicht vor/)
    assert.equal(html.includes('widget.js'), false)
    assert.match(html, /erscheinen nicht in Jetnity/)
    assert.match(html, /allgemeine Suche/)
    assert.match(html, /keinen Abholort/)
    assert.equal(html.includes('Bangkok'), false)
    assert.equal(html.includes('data-location'), false)
    assert.equal(html.includes('Lokale Prüfseite zeigen'), false)
    assert.equal(html.includes('Mietwagensuche bei DiscoverCars laden'), false)
    assert.equal(html.includes(WIDGET_FIXTURE_TEXT), false)
    assert.equal(html.includes(REISE), false)
    assert.equal(html.includes('<iframe'), false)
    assert.equal(html.includes('<script'), false)
    assert.equal(html.includes('<img'), false)
    assert.equal(html.includes('src='), false)
    assert.equal(html.includes('https://'), false)
    assert.equal(html.includes('data-discovercars-widget-hinweis="pruefnaht"'), false)
  })

  test('die Prüfnaht zeigt den Ladeknopf erst im Markup, nicht die Fixture', () => {
    const html = renderToStaticMarkup(
      createElement(DiscoverCarsWidgetOptin, {
        reiseId: REISE,
        pruefnaht: WIDGET_PRUEFNAHT,
      }),
    )
    assert.match(html, /data-discovercars-widget="pruefnaht"/)
    assert.match(html, /Lokale Prüfseite/)
    assert.match(html, /Lokale Prüfseite zeigen/)
    assert.equal(html.includes('widget.js'), false)
    assert.match(html, /min-h-11/)
    assert.equal(html.includes(WIDGET_FIXTURE_TEXT), false)
    assert.equal(html.includes(REISE), false)
    assert.equal(html.includes('https://'), false)
  })

  test('eine andere Naht bleibt inert', () => {
    const html = renderToStaticMarkup(
      createElement(DiscoverCarsWidgetOptin, { reiseId: REISE, pruefnaht: 'live' }),
    )
    assert.match(html, /data-discovercars-widget="inert"/)
    assert.equal(html.includes('Lokale Prüfseite zeigen'), false)
    assert.equal(html.includes('Mietwagensuche bei DiscoverCars laden'), false)
  })

  test('Mietwagen setzt die Naht nicht und lässt V1 und das Formular stehen', () => {
    const reise = beispielreise({
      id: REISE,
      clientRef: 'client-ref-geheim',
      title: 'Bangkok nur als Titel',
      origin: 'Bangkok',
      currency: 'THB',
      travellers: 4,
      startDate: '1988-04-02',
      endDate: '1988-04-09',
      stages: [
        etappe({
          id: 'stage-bkk-stadt',
          position: 1,
          name: 'Bangkok',
          countryCode: 'TH',
          placeId: 'place-bangkok-city',
          latitude: 13.7563,
          longitude: 100.5018,
        }),
        etappe({
          id: 'stage-phuket',
          position: 2,
          name: 'Phuket',
          countryCode: 'TH',
        }),
      ],
    })
    const html = renderToStaticMarkup(
      createElement(MietwagenBereich, { reise, onManuellAnlegen: async () => null }),
    )
    const widget = abschnitt(html, 'data-discovercars-widget="inert"')
    const affiliate = abschnitt(html, 'data-discovercars-affiliate="1"')
    assert.ok(html.indexOf('data-discovercars-widget="inert"') < html.indexOf('data-discovercars-affiliate="1"'))
    assert.match(html, /Mietwagenangebote werden vorbereitet/)
    assert.match(html, /Manueller Mietwagen/)
    assert.match(html, /Mietwagen speichern/)
    assert.match(affiliate, /href="https:\/\/www\.discovercars\.com\/\?a_aid=jetnity"/)
    assert.equal(widget.includes('Lokale Prüfseite zeigen'), false)
    assert.equal(widget.includes('widget.js'), false)
    assert.match(widget, /Einwilligung dafür liegt nicht vor/)
    assert.equal(widget.includes('https://'), false)
    assert.match(widget, /keinen Abholort/)
    assert.match(widget, /allgemeine Suche/)
    assert.equal(widget.includes('Bangkok'), false)
    assert.equal(widget.includes('Phuket'), false)
    assert.equal(widget.includes('data-location'), false)
    assert.equal(widget.includes('suvarnabhumi'), false)
    for (const verboten of [REISE, 'client-ref-geheim', 'Bangkok nur als Titel', 'place-bangkok-city', '1988-04-02', 'THB']) {
      assert.equal(widget.includes(verboten), false, verboten)
    }
    const quelle = readFileSync(join(wurzel, 'components/trips/MietwagenBereich.tsx'), 'utf8')
    assert.equal(quelle.includes('pruefnaht'), false)
    assert.equal(quelle.includes(WIDGET_PRUEFNAHT), false)
    const komponente = readFileSync(join(wurzel, 'components/trips/DiscoverCarsWidgetOptin.tsx'), 'utf8')
    for (const verboten of ['fetch(', '<iframe', '<script', '<img', 'dangerouslySetInnerHTML', 'document.cookie', 'localStorage', 'https://']) {
      assert.equal(komponente.includes(verboten), false, verboten)
    }
    const fixture = readFileSync(
      join(wurzel, 'scripts/discovercars-v2-widget-optin-1/synthetische-pruefseite.html'),
      'utf8',
    )
    assert.match(fixture, /Synthetische Jetnity-Prüfseite/)
    assert.equal(fixture.includes('discovercars.com'), false)
    assert.equal(fixture.includes('<script'), false)
  })
})
