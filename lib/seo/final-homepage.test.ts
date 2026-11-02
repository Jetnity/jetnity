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
  HOMEPAGE_FAQ,
  HOMEPAGE_PRODUKTFENSTER,
  HOMEPAGE_SCHRITTE,
  HOMEPAGE_UEBERSCHRIFTEN,
  HOMEPAGE_UNTERSCHIEDE,
  HOMEPAGE_WERKZEUGE,
  finalHomepageJsonLd,
  finalHomepageMetadaten,
  finalHomepageSeitenUrl,
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
    assert.equal(graph['@graph'][0].logo, 'https://jetnity.com/brand/jetnity-logo.png')
    assert.equal(graph['@graph'][2].image, 'https://jetnity.com/images/jetnity-reiseplaner-share.png')
    assert.equal(roh.includes('vercel.app'), false)
    for (const schluessel of VERBOTENE_SCHLUESSEL) {
      assert.equal(roh.includes(`"${schluessel}"`), false, schluessel)
    }
  })

  test('Reisebeispiel enthält keine erfundenen Angebote oder Buchungen', () => {
    const roh = JSON.stringify({ HOMEPAGE_PRODUKTFENSTER, HOMEPAGE_WERKZEUGE, HOMEPAGE_SCHRITTE })
    assert.equal(/\d+\s*(CHF|EUR|€|\$)/.test(roh), false)
    assert.equal(HOMEPAGE_PRODUKTFENSTER.kennzeichnung, 'Beispielreise')
    assert.deepEqual(HOMEPAGE_PRODUKTFENSTER.modi, ['Übersicht', 'Reiseplan', 'Organisieren', 'Vorbereitung'])
    assert.deepEqual(HOMEPAGE_PRODUKTFENSTER.route.map((halt) => halt.ort), ['Lissabon', 'Porto'])
    assert.equal(HOMEPAGE_PRODUKTFENSTER.tagesplan.length, 3)
    assert.equal(/gebucht|bestätigte Buchung|verfügbar für/i.test(roh), false)
  })

  test('die finale Kundenstory beschreibt das Produkt ohne Statusmatrix', () => {
    assert.equal(FINAL_HOMEPAGE_H1, 'Deine ganze Reise. Intelligent an einem Ort.')
    assert.match(FINAL_HOMEPAGE_DEFINITION, /Reiseplaner und Reisebegleiter/)
    assert.ok(FINAL_HOMEPAGE_DESCRIPTION.length <= 160)
    const texte = JSON.stringify({ HOMEPAGE_UEBERSCHRIFTEN, HOMEPAGE_SCHRITTE, HOMEPAGE_UNTERSCHIEDE, HOMEPAGE_WERKZEUGE, HOMEPAGE_FAQ })
    assert.equal(/In Vorbereitung|Kommt später|Heute nutzbar|synthetisch/.test(texte), false)
    assert.equal(HOMEPAGE_SCHRITTE.length, 3)
    const buchung = HOMEPAGE_FAQ.find((eintrag) => eintrag.frage.includes('buche'))
    assert.match(buchung?.antwort ?? '', /beim jeweiligen Anbieter/)
    assert.match(buchung?.antwort ?? '', /noch keine Buchung/)
    const gast = HOMEPAGE_FAQ.find((eintrag) => eintrag.frage.includes('ohne Konto'))
    assert.match(gast?.antwort ?? '', /diesem Browser/)
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

  test('FAQ ist ohne JavaScript lesbar und alte Pro-Links haben ein kompatibles Ziel', () => {
    const vertrauen = quelle('../../components/home/HomeVertrauen.tsx')
    const inspiration = quelle('../../components/home/HomeInspiration.tsx')
    assert.match(vertrauen, /id="pro"/)
    assert.match(vertrauen, /id="fragen"/)
    assert.match(vertrauen, /HOMEPAGE_FAQ/)
    assert.match(vertrauen, /<details/)
    assert.match(vertrauen, /<summary/)
    assert.equal(vertrauen.includes("'use client'"), false)
    assert.equal(vertrauen.includes('dangerouslySetInnerHTML'), false)
    assert.match(inspiration, /id="entdecken"/)
  })

  test('Share-Bild und Bildreferenzen existieren; Sitemap erfindet kein Aktualisierungsdatum', () => {
    const seite = quelle('../../app/(public)/page.tsx')
    assert.match(seite, /jetnity-reiseplaner-share.png/)
    const bild = readFileSync(join(hier, '../../public/images/jetnity-reiseplaner-share.png'))
    assert.equal(bild.readUInt32BE(16), 1200)
    assert.equal(bild.readUInt32BE(20), 630)
    const sitemap = quelle('../../app/sitemap.ts')
    assert.equal(sitemap.includes('lastModified: new Date()'), false)
  })
})
