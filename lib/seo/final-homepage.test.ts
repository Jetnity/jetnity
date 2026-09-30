import { readFileSync } from 'node:fs'
import { dirname, join } from 'node:path'
import { describe, test } from 'node:test'
import assert from 'node:assert/strict'
import { fileURLToPath } from 'node:url'

import { INSPIRATION_ZIELE } from '@/lib/places/inspiration'
import { zielHref } from '@/lib/places/auswahl'
import {
  FINAL_HOMEPAGE_DEFINITION,
  FINAL_HOMEPAGE_DESCRIPTION,
  FINAL_HOMEPAGE_H1,
  HOMEPAGE_FAEHIGKEITEN,
  HOMEPAGE_KENNZEICHNUNGEN,
  HOMEPAGE_PRODUKTFENSTER,
  HOMEPAGE_SCHRITTE,
  HOMEPAGE_UEBERSCHRIFTEN,
  HOMEPAGE_UNTERSCHIEDE,
  HOMEPAGE_WERKZEUGE,
  finalHomepageJsonLd,
  finalHomepageMetadaten,
  finalHomepageSeitenUrl,
  homepageFaehigkeitenGruppiert,
} from '@/lib/seo/final-homepage'
import { KANONISCHE_PUBLIC_ORIGIN, kanonischeUrl } from '@/lib/seo/oeffentlicher-origin'

const hier = dirname(fileURLToPath(import.meta.url))

function quelle(relativ: string) {
  return readFileSync(join(hier, relativ), 'utf8')
}

const VERBOTENE_SCHLUESSEL = [
  'sameAs',
  'aggregateRating',
  'review',
  'reviewCount',
  'offers',
  'award',
  'price',
  'priceRange',
]

describe('final homepage product 1 – Wahrheit und Entity', () => {
  test('kanonische URL bleibt die Produktdomain', () => {
    assert.equal(finalHomepageSeitenUrl(), `${KANONISCHE_PUBLIC_ORIGIN}/`)
    assert.equal(finalHomepageSeitenUrl(), kanonischeUrl('/'))
  })

  test('Metadaten und JSON-LD übernehmen keine fremde Origin', () => {
    assert.throws(() => finalHomepageMetadaten('https://jetnity-app.vercel.app/'))
    assert.throws(() => finalHomepageJsonLd({ url: 'https://example.com/' }))
  })

  test('JSON-LD beschreibt Organization, WebSite und SoftwareApplication ohne erfundene Signale', () => {
    const graph = finalHomepageJsonLd({ url: kanonischeUrl('/') })
    const roh = JSON.stringify(graph)
    const typen = graph['@graph'].map((knoten) => knoten['@type'])
    assert.deepEqual(typen, ['Organization', 'WebSite', 'SoftwareApplication'])
    for (const knoten of graph['@graph']) {
      assert.equal(knoten.url, kanonischeUrl('/'))
      assert.equal(knoten.description, FINAL_HOMEPAGE_DEFINITION)
      assert.equal(knoten.name, 'Jetnity')
    }
    assert.equal(graph['@graph'][1].inLanguage, 'de')
    assert.equal(graph['@graph'][2].operatingSystem, 'Web')
    assert.equal(roh.includes('vercel.app'), false)
    for (const schluessel of VERBOTENE_SCHLUESSEL) {
      assert.equal(roh.includes(`"${schluessel}"`), false, schluessel)
    }
  })

  test('jede Fähigkeit hat einen erlaubten Stand und eine sichtbare Kennzeichnung', () => {
    const ids = new Set<string>()
    for (const faehigkeit of HOMEPAGE_FAEHIGKEITEN) {
      assert.equal(ids.has(faehigkeit.id), false)
      ids.add(faehigkeit.id)
      assert.ok(['LIVE', 'PARTIAL', 'PLANNED'].includes(faehigkeit.stand))
      assert.ok(HOMEPAGE_KENNZEICHNUNGEN.includes(faehigkeit.kennzeichnung))
      if (faehigkeit.stand === 'PLANNED') {
        assert.notEqual(faehigkeit.kennzeichnung, 'Heute nutzbar')
        assert.notEqual(faehigkeit.kennzeichnung, 'Soweit Daten vorliegen')
      }
      if (faehigkeit.stand === 'LIVE') assert.equal(faehigkeit.kennzeichnung, 'Heute nutzbar')
    }
    assert.ok(HOMEPAGE_FAEHIGKEITEN.some((eintrag) => eintrag.kennzeichnung === 'In Vorbereitung'))
    assert.ok(HOMEPAGE_FAEHIGKEITEN.some((eintrag) => eintrag.kennzeichnung === 'Kommt später'))
    assert.ok(HOMEPAGE_FAEHIGKEITEN.some((eintrag) => eintrag.kennzeichnung === 'Produktvorschau'))
  })

  test('Produktfenster und Werkzeuge nennen keine Preise', () => {
    const roh = JSON.stringify({ HOMEPAGE_PRODUKTFENSTER, HOMEPAGE_WERKZEUGE, HOMEPAGE_SCHRITTE })
    assert.equal(/\d+\s*(CHF|EUR|€|\$)/.test(roh), false)
    assert.equal(HOMEPAGE_PRODUKTFENSTER.kennzeichnung, 'Produktvorschau')
    assert.match(HOMEPAGE_PRODUKTFENSTER.hinweis, /Kein Preis/)
    assert.match(HOMEPAGE_PRODUKTFENSTER.hinweis, /keine amtliche Auskunft/)
    assert.deepEqual(
      HOMEPAGE_PRODUKTFENSTER.modi.map((modus) => modus.titel),
      ['Übersicht', 'Reiseplan', 'Organisieren', 'Vorbereitung'],
    )
    assert.deepEqual(
      HOMEPAGE_PRODUKTFENSTER.route.map((halt) => halt.ort),
      ['Lissabon', 'Porto'],
    )
    assert.match(HOMEPAGE_PRODUKTFENSTER.route[1]?.text ?? '', /Unterkunft noch offen/)
    for (const modus of HOMEPAGE_PRODUKTFENSTER.modi) {
      assert.equal(modus.kennzeichnung, 'Heute nutzbar')
    }
    const reisebereich = HOMEPAGE_FAEHIGKEITEN.find((eintrag) => eintrag.id === 'reisebereich')
    assert.equal(reisebereich?.stand, 'LIVE')
    assert.match(reisebereich?.text ?? '', /Übersicht, Reiseplan, Organisieren und Vorbereitung/)
    assert.match(reisebereich?.text ?? '', /nicht live/)
  })

  test('die Pflichtstory bleibt wörtlich', () => {
    assert.equal(FINAL_HOMEPAGE_DESCRIPTION, FINAL_HOMEPAGE_DEFINITION)
    assert.equal(FINAL_HOMEPAGE_H1, 'Deine ganze Reise. Intelligent an einem Ort.')
    assert.equal(HOMEPAGE_UEBERSCHRIFTEN.werkzeuge, 'Eine Reise statt fünf getrennte Tools')
    assert.equal(HOMEPAGE_UEBERSCHRIFTEN.begleitung, 'So begleitet Jetnity deine Reise')
    assert.equal(HOMEPAGE_UEBERSCHRIFTEN.unterschied, 'Warum Jetnity anders ist')
    assert.equal(HOMEPAGE_UEBERSCHRIFTEN.vertrauen, 'Deine Reise. Deine Entscheidungen.')
    assert.deepEqual(
      HOMEPAGE_SCHRITTE.map((schritt) => schritt.titel),
      ['Beschreiben', 'Organisieren', 'Begleiten lassen'],
    )
    assert.deepEqual(
      HOMEPAGE_UNTERSCHIEDE.map((punkt) => punkt.titel),
      [
        'Reisekontext statt Einzelsuche',
        'Wahrheit statt geratenen Antworten',
        'Nächster sinnvoller Schritt statt Informationsflut',
      ],
    )
  })
})

describe('final homepage product 1 – Seite bleibt am bestehenden Einstieg', () => {
  test('Startseite verdrahtet Formular, Handoff, Anker und JSON-LD ohne Index-Freigabe', () => {
    const seite = quelle('../../app/(public)/page.tsx')
    assert.match(seite, /GastCreateLink/)
    assert.match(seite, /zielHref/)
    assert.match(seite, /url: kanonischeUrl\('\/'\)/)
    assert.match(seite, /createLabel="Reise starten"/)
    assert.match(seite, /FINAL_HOMEPAGE_H1|homepageMeta\.title/)
    assert.equal(seite.includes('index: true'), false)
    assert.equal(seite.includes('genericCreateHrefFuerGast'), false)
    assert.equal(seite.includes('genericCreateCtaFuerSitzung'), false)
    assert.equal(seite.includes('gastreiseAnlegen'), false)
    assert.equal(seite.includes('sameAs'), false)
  })

  test('Inspirationsziele behalten Place-ID, Reihenfolge und Handoff', () => {
    assert.deepEqual(
      INSPIRATION_ZIELE.map((ziel) => ziel.placeId),
      ['geonames:1650535', 'geonames:2267057', 'geonames:2657915', 'geonames:2759794'],
    )
    const hrefs = INSPIRATION_ZIELE.map((ziel) => zielHref({ id: ziel.placeId, name: ziel.name }, ziel.idea))
    assert.equal(hrefs.every((href) => href?.startsWith('/planen?')), true)
    assert.match(hrefs[0] ?? '', /zielId=geonames%3A1650535/)
  })

  test('Navbar-Anker und Fähigkeitsliste bleiben auf der Startseite', () => {
    const vertrauen = quelle('../../components/home/HomeVertrauen.tsx')
    const inspiration = quelle('../../components/home/HomeInspiration.tsx')
    assert.match(vertrauen, /id=\{faehigkeit\.id === 'jetnity-pro' \? 'pro' : undefined\}/)
    assert.match(vertrauen, /HOMEPAGE_FAEHIGKEITEN/)
    assert.match(inspiration, /id="entdecken"/)
  })

  test('der vollständige Fähigkeitswortlaut bleibt in einem nativen Disclosure', () => {
    const vertrauen = quelle('../../components/home/HomeVertrauen.tsx')
    const werkzeuge = quelle('../../components/home/HomeWerkzeuge.tsx')
    assert.match(vertrauen, /<details/)
    assert.match(vertrauen, /<summary/)
    assert.equal(vertrauen.includes('sr-only'), false)
    assert.equal(vertrauen.includes('display:none'), false)
    assert.equal(werkzeuge.includes('lg:grid-cols-3'), false)
    const gruppen = homepageFaehigkeitenGruppiert()
    const gesehen = gruppen.flatMap((gruppe) => gruppe.eintraege.map((eintrag) => eintrag.id))
    assert.deepEqual(gesehen, HOMEPAGE_FAEHIGKEITEN.map((eintrag) => eintrag.id))
    assert.deepEqual(
      gruppen.map((gruppe) => gruppe.kennzeichnung),
      ['Heute nutzbar', 'Soweit Daten vorliegen', 'In Vorbereitung', 'Produktvorschau', 'Kommt später'],
    )
  })
})
