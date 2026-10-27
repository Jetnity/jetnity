import { readFileSync } from 'node:fs'
import { dirname, join } from 'node:path'
import { describe, test } from 'node:test'
import assert from 'node:assert/strict'
import { fileURLToPath } from 'node:url'
import { createElement } from 'react'
import { renderToStaticMarkup } from 'react-dom/server'

import DiscoverCarsAffiliateLinks from '@/components/trips/DiscoverCarsAffiliateLinks'
import MietwagenBereich from '@/components/trips/MietwagenBereich'
import { beispielreise } from '@/lib/reiseaenderung/fixtures/reise'
import {
  DISCOVERCARS_BKK_HREF,
  DISCOVERCARS_BKK_STATION,
  DISCOVERCARS_GENERISCH_HREF,
} from '@/lib/providers/discovercars/affiliate/ziel'
import type { TripStage } from '@/types/trips'

const hier = dirname(fileURLToPath(import.meta.url))
const wurzel = join(hier, '../../../..')

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

function abschnitt(html: string): string {
  const start = html.indexOf('data-discovercars-affiliate="1"')
  assert.notEqual(start, -1)
  const von = html.lastIndexOf('<section', start)
  const bis = html.indexOf('</section>', start)
  assert.notEqual(von, -1)
  assert.notEqual(bis, -1)
  return html.slice(von, bis + '</section>'.length)
}

function link(html: string): string {
  const bereich = abschnitt(html)
  const treffer = bereich.match(/<a\b[^>]*>/)
  assert.ok(treffer, bereich)
  return treffer[0]
}

describe('DiscoverCars Affiliate-Markup', () => {
  test('Standard ist der allgemeine Link mit Schutz und ohne Drittquelle', () => {
    const html = renderToStaticMarkup(
      createElement(DiscoverCarsAffiliateLinks, { reiseId: 'reise-gast', stationen: 1 }),
    )
    const anker = link(html)
    assert.match(anker, new RegExp(`href="${DISCOVERCARS_GENERISCH_HREF.replaceAll('?', '\\?')}"`))
    assert.match(anker, /target="_blank"/)
    assert.match(anker, /rel="noopener noreferrer sponsored"/)
    assert.match(anker, /referrerpolicy="no-referrer"/i)
    assert.match(html, /Externer Affiliate-Link/)
    assert.match(html, /nicht bei Jetnity/)
    assert.match(html, /Bangkok als Stadt ist nicht der Flughafen/)
    assert.equal(html.includes(DISCOVERCARS_BKK_HREF), false)
    assert.equal(html.includes('reise-gast'), false)
    assert.equal(html.includes('<iframe'), false)
    assert.equal(html.includes('<script'), false)
    assert.equal(html.includes('<img'), false)
    assert.equal(html.includes('src='), false)
    assert.match(anker, /min-h-11/)
    assert.match(html, /focus-visible:ring-4/)
    assert.match(html, /focus-within:ring-4/)
  })

  test('ausdrückliches BKK zeigt nur die geprüfte Stationsseite', () => {
    const html = renderToStaticMarkup(
      createElement(DiscoverCarsAffiliateLinks, {
        reiseId: 'reise-bkk',
        stationen: 3,
        gewaehlteStation: { ...DISCOVERCARS_BKK_STATION },
      }),
    )
    const anker = link(html)
    assert.match(anker, /suvarnabhumi-airport-bkk\?a_aid=jetnity&amp;currency=chf/)
    assert.match(html, /nicht die Währung deiner Reise/)
    assert.match(html, /keine Einwegmiete/)
    assert.match(html, /data-discovercars-hinweis="mehrere-stationen"/)
    assert.equal(html.includes('reise-bkk'), false)
    assert.equal(html.includes('one_way'), false)
  })

  test('eine abweichende Stationswahl bleibt allgemein, auch bei Bangkok', () => {
    const html = renderToStaticMarkup(
      createElement(DiscoverCarsAffiliateLinks, {
        reiseId: 'nicht-im-markup',
        stationen: 2,
        gewaehlteStation: {
          art: 'stadt',
          name: 'Bangkok',
          iata: 'BKK',
          country: 'TH',
          href: 'https://evil.example/bkk',
        },
      }),
    )
    assert.match(link(html), /href="https:\/\/www\.discovercars\.com\/\?a_aid=jetnity"/)
    assert.equal(html.includes('evil.example'), false)
    assert.equal(html.includes('nicht-im-markup'), false)
    assert.match(html, /data-discovercars-hinweis="mehrere-stationen"/)
  })

  test('Mietwagen behält Bestand, ehrliche Suche und manuelle Erfassung', () => {
    const reise = beispielreise({
      id: 'trip-uuid-geheim',
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
      createElement(MietwagenBereich, {
        reise,
        onManuellAnlegen: async () => null,
      }),
    )
    assert.match(html, /Bestand und Status/)
    assert.match(html, /Mietwagenangebote werden vorbereitet/)
    assert.match(html, /Manueller Mietwagen/)
    assert.match(html, /Keine Suche startet nicht automatisch|Eine Suche startet nicht automatisch/)
    const bereich = abschnitt(html)
    assert.match(bereich, /href="https:\/\/www\.discovercars\.com\/\?a_aid=jetnity"/)
    assert.equal(bereich.includes(DISCOVERCARS_BKK_HREF.replaceAll('&', '&amp;')), false)
    for (const verboten of [
      'trip-uuid-geheim',
      'client-ref-geheim',
      'Bangkok nur als Titel',
      'place-bangkok-city',
      'Phuket',
      '1988-04-02',
      'THB',
      'evil.example',
    ]) {
      assert.equal(bereich.includes(verboten), false, verboten)
    }
    assert.match(bereich, /data-discovercars-hinweis="mehrere-stationen"/)
  })

  test('Quellen laden vor dem Klick nichts und rufen die Suche nicht auf', () => {
    const komponente = readFileSync(
      join(wurzel, 'components/trips/DiscoverCarsAffiliateLinks.tsx'),
      'utf8',
    )
    const mietwagen = readFileSync(join(wurzel, 'components/trips/MietwagenBereich.tsx'), 'utf8')
    const fabrik = readFileSync(join(wurzel, 'lib/rental-cars/factory.ts'), 'utf8')
    for (const quelle of [komponente]) {
      assert.equal(quelle.includes('fetch('), false)
      assert.equal(quelle.includes('<iframe'), false)
      assert.equal(quelle.includes('<script'), false)
      assert.equal(quelle.includes('<img'), false)
      assert.equal(quelle.includes('dangerouslySetInnerHTML'), false)
      assert.equal(quelle.includes('document.cookie'), false)
      assert.equal(quelle.includes('localStorage'), false)
    }
    assert.match(komponente, /rel="noopener noreferrer sponsored"/)
    assert.match(komponente, /target="_blank"/)
    assert.match(komponente, /min-h-11/)
    const aufruf = mietwagen.slice(
      mietwagen.indexOf('<DiscoverCarsAffiliateLinks'),
      mietwagen.indexOf('/>', mietwagen.indexOf('<DiscoverCarsAffiliateLinks')) + 2,
    )
    assert.equal(aufruf, '<DiscoverCarsAffiliateLinks reiseId={reise.id} stationen={reise.stages.length} />')
    assert.match(fabrik, /return null/)
    assert.equal(mietwagen.includes('currency={'), false)
  })
})
