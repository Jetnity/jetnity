import { describe, test } from 'node:test'
import assert from 'node:assert/strict'
import { readFileSync } from 'node:fs'
import { createElement } from 'react'
import { renderToStaticMarkup } from 'react-dom/server'

import MobilitaetBereich from '@/components/trips/MobilitaetBereich'
import TwelveGoAffiliateLinks from '@/components/trips/TwelveGoAffiliateLinks'
import { unbestaetigteBuchung } from '@/lib/trips/buchung'
import { leereMobilitaet } from '@/lib/trips/mobilitaet-felder'
import { TWELVE_GO_WIDGET_SUB_ID_ALLGEMEIN } from '@/lib/providers/twelve-go/widget/kennungen'
import type { Trip, TripItem, TripStage } from '@/types/trips'

const JETZT = '2026-10-29T18:00:00.000Z'
const GENERISCH = 'https://12go.asia/?z=17323861&amp;sub_id=jetnity-mobility-route'

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
    id: 'trip-widget',
    clientRef: 'ref-bleibt-lokal',
    title: 'Widget',
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
      etappe({ id: 'a', name: 'Chiang Mai', position: 1, placeId: 'geonames:1153671', countryCode: 'TH' }),
      etappe({ id: 'b', name: 'Ayutthaya', position: 2, placeId: 'geonames:1621034', countryCode: 'TH' }),
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

function v1Anker(html: string): string[] {
  return anker(html).filter((link) => link.includes('data-twelve-go-art='))
}

function quelle(relativ: string): string {
  return readFileSync(new URL(relativ, import.meta.url), 'utf8')
}

function ohneDrittinhalt(html: string) {
  assert.equal(html.includes('<script'), false)
  assert.equal(html.includes('<iframe'), false)
  assert.equal(html.includes('<img'), false)
  assert.equal(html.includes('src='), false)
  assert.equal(html.includes('/tools/form'), false)
  assert.equal(html.includes(TWELVE_GO_WIDGET_SUB_ID_ALLGEMEIN), false)
  assert.equal(html.includes('id="powered"'), false)
  assert.equal(html.includes('data-origin='), false)
  assert.equal(html.includes('twelvego-general-chf'), false)
  assert.equal(html.includes('f056b01d'), false)
  assert.equal((html.match(/<button\b/g) ?? []).length, 1)
  assert.equal(html.includes('data-twelve-go-aktion="anfragen"'), true)
  assert.equal(html.includes('Suchformular anfragen'), true)
  assert.doesNotMatch(html, /\/de\/travel\/|date=|CHF|ref-bleibt/)
  assert.equal(html.includes('data-twelve-go-widget="consent-blocked"'), true)
  assert.equal(html.includes('data-twelve-go-widget-ausfuehrbar="false"'), true)
  assert.equal(html.includes('data-twelve-go-disclosure="twelvego-general-disclosure-v1"'), true)
  assert.equal(html.includes('href="https://12go.asia/en/privacy-policy"'), true)
  assert.equal(html.includes('Datenschutzhinweise von 12Go'), true)
  assert.match(html, /Bangkok-Referenz/)
  assert.match(html, /cdn0\.trainbusferry\.com/)
  const datenschutz = html.indexOf('data-twelve-go-datenschutz')
  const anfrage = html.indexOf('data-twelve-go-aktion="anfragen"')
  assert.equal(datenschutz >= 0 && anfrage > datenschutz, true)
}

describe('12Go-Widget in der V1-Fläche', () => {
  test('die Besucherfläche importiert weder Quelle noch Prüfhnaht', () => {
    const links = quelle('../../../../components/trips/TwelveGoAffiliateLinks.tsx')
    const einbau = quelle('../../../../components/trips/TwelveGoWidgetEinbau.tsx')
    const pruefung = quelle('../../../../components/trips/TwelveGoWidgetPruefung.tsx')
    assert.match(links, /TwelveGoWidgetEinbau/)
    assert.equal(links.includes('TwelveGoWidgetPruefung'), false)
    assert.equal(links.includes('widget/quelle'), false)
    assert.equal(links.includes('widget/einfuegen'), false)
    assert.equal(einbau.includes('widget/quelle'), false)
    assert.equal(einbau.includes('widget/einfuegen'), false)
    assert.equal(einbau.includes('TwelveGoWidgetPruefung'), false)
    assert.equal(einbau.includes('TwelveGoWidgetRahmen'), false)
    assert.equal(einbau.includes('TwelveGoWidgetHost'), true)
    assert.equal(links.includes('TwelveGoWidgetRahmen'), false)
    const host = quelle('../../../../components/trips/TwelveGoWidgetHost.tsx')
    assert.equal(host.includes('requestProductionExecution'), true)
    assert.equal(host.includes('__jetnityUseFixturePolicy'), false)
    assert.equal(host.includes('widget/quelle'), false)
    assert.equal(host.includes('node:crypto'), false)
    assert.equal(einbau.includes('trainbusferry'), false)
    assert.equal(pruefung.includes('trainbusferry'), false)
    assert.equal(pruefung.includes('<script'), false)
    assert.equal(links.includes('fetch('), false)
    assert.equal(einbau.includes('fetch('), false)
  })

  test('gleiches Land, mehrere Stopps und Rückkehr bleiben allgemeine Links', () => {
    const gleich = renderToStaticMarkup(createElement(TwelveGoAffiliateLinks, { reise: reise() }))
    ohneDrittinhalt(gleich)
    const links = v1Anker(gleich)
    assert.equal(links.length, 1)
    assert.equal(links[0]?.includes(GENERISCH), true)
    assert.equal(links[0]?.includes('data-twelve-go-art="generic"'), true)
    assert.equal(gleich.includes('Zürich'), false)

    const mehrere = renderToStaticMarkup(
      createElement(TwelveGoAffiliateLinks, {
        reise: reise({
          stages: [
            etappe({ id: 'a', name: 'Chiang Mai', position: 1, countryCode: 'TH' }),
            etappe({ id: 'b', name: 'Ayutthaya', position: 2, countryCode: 'TH' }),
            etappe({ id: 'c', name: 'Hua Hin', position: 3, countryCode: 'TH' }),
          ],
        }),
      }),
    )
    ohneDrittinhalt(mehrere)
    assert.equal(v1Anker(mehrere).length, 2)
    assert.equal(mehrere.includes('data-twelve-go-kante="a:c"'), false)

    const rueckkehr = renderToStaticMarkup(
      createElement(TwelveGoAffiliateLinks, {
        reise: reise({
          stages: [
            etappe({ id: 'a1', name: 'Chiang Mai', position: 1, countryCode: 'TH' }),
            etappe({ id: 'b', name: 'Ayutthaya', position: 2, countryCode: 'TH' }),
            etappe({ id: 'a2', name: 'Chiang Mai', position: 3, countryCode: 'TH' }),
          ],
        }),
      }),
    )
    ohneDrittinhalt(rueckkehr)
    assert.equal(v1Anker(rueckkehr).length, 2)
    assert.equal(rueckkehr.includes('data-twelve-go-kante="a1:b"'), true)
    assert.equal(rueckkehr.includes('data-twelve-go-kante="b:a2"'), true)

    const gedreht = renderToStaticMarkup(
      createElement(TwelveGoAffiliateLinks, {
        reise: reise({
          stages: [
            etappe({ id: 'b', name: 'Ayutthaya', position: 1, countryCode: 'TH' }),
            etappe({ id: 'a', name: 'Chiang Mai', position: 2, countryCode: 'TH' }),
          ],
        }),
      }),
    )
    ohneDrittinhalt(gedreht)
    assert.equal(gedreht.includes('data-twelve-go-kante="b:a"'), true)
    assert.equal(v1Anker(gedreht).length, 1)
  })

  test('ein Stopp, ein Datum und der Bereich laden kein Formular', () => {
    const einer = renderToStaticMarkup(
      createElement(TwelveGoAffiliateLinks, {
        reise: reise({ stages: [etappe({ id: 'a', name: 'Chiang Mai', position: 1 })] }),
      }),
    )
    ohneDrittinhalt(einer)
    assert.equal(v1Anker(einer).length, 0)
    assert.match(einer, /Sobald mindestens zwei Ziele/)

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
      endsOn: null,
      endsAt: null,
      priceAmount: null,
      priceCurrency: 'CHF',
      provider: null,
      externalRef: null,
      bookingUrl: null,
      ...unbestaetigteBuchung(),
      ...leereMobilitaet(),
      originPlaceId: 'geonames:1153671',
      destinationPlaceId: 'geonames:1621034',
      originName: 'Chiang Mai',
      destinationName: 'Ayutthaya',
    }
    const datiert = renderToStaticMarkup(
      createElement(TwelveGoAffiliateLinks, {
        reise: reise({
          stages: [
            etappe({ id: 'a', name: 'Chiang Mai', position: 1, placeId: 'geonames:1153671' }),
            etappe({ id: 'b', name: 'Ayutthaya', position: 2, placeId: 'geonames:1621034' }),
          ],
          ohneTag: [transfer],
        }),
      }),
    )
    ohneDrittinhalt(datiert)
    assert.equal(datiert.includes('data-geplant="2026-11-15"'), true)
    assert.match(datiert, /Geplant am/)
    assert.doesNotMatch(v1Anker(datiert).join('\n'), /2026-11-15|date=/)

    const bereich = renderToStaticMarkup(createElement(MobilitaetBereich, { reise: reise() }))
    const bestand = bereich.indexOf('data-organisieren-flaeche="bestand"')
    const affiliate = bereich.indexOf('data-twelve-go-affiliate="1"')
    const suche = bereich.indexOf('data-organisieren-flaeche="suche"')
    assert.equal(bestand >= 0 && affiliate > bestand && suche > affiliate, true)
    assert.equal(bereich.includes('data-twelve-go-widget="consent-blocked"'), true)
    assert.equal(bereich.includes('<iframe'), false)
    assert.equal(bereich.includes('/tools/form'), false)
    assert.match(bereich, /cdn0\.trainbusferry\.com/)
    assert.equal(bereich.includes(GENERISCH), true)
  })
})
