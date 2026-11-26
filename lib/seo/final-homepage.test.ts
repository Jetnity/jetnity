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
import { STARTSEITENBILD } from '@/lib/seo/startseitenbild'
import { freigegebenerNachweis, KI_URHEBER } from '@/lib/trips/organisieren/bildnachweise'

const hier = dirname(fileURLToPath(import.meta.url))

/** Echte Abmessungen aus dem Dateikopf (PNG oder WebP), unabhängig von der Dateiendung. */
function bildabmessungen(bild: Buffer): { format: 'png' | 'webp'; breite: number; hoehe: number } {
  if (bild.subarray(0, 8).equals(Buffer.from([0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a]))) {
    assert.equal(bild.subarray(12, 16).toString('latin1'), 'IHDR')
    return { format: 'png', breite: bild.readUInt32BE(16), hoehe: bild.readUInt32BE(20) }
  }
  assert.equal(bild.subarray(0, 4).toString('latin1'), 'RIFF', 'Das Startseitenbild ist weder PNG noch WebP.')
  assert.equal(bild.subarray(8, 12).toString('latin1'), 'WEBP')
  const art = bild.subarray(12, 16).toString('latin1')
  if (art === 'VP8 ') return { format: 'webp', breite: bild.readUInt16LE(26) & 0x3fff, hoehe: bild.readUInt16LE(28) & 0x3fff }
  if (art === 'VP8X') return { format: 'webp', breite: bild.readUIntLE(24, 3) + 1, hoehe: bild.readUIntLE(27, 3) + 1 }
  assert.equal(art, 'VP8L', 'Unbekannte WebP-Kodierung.')
  const bits = bild.readUInt32LE(21)
  return { format: 'webp', breite: (bits & 0x3fff) + 1, hoehe: ((bits >> 14) & 0x3fff) + 1 }
}

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
    assert.deepEqual(graph['@graph'][2].image, {
      '@type': 'ImageObject',
      url: `https://jetnity.com${STARTSEITENBILD.pfad}`,
      width: STARTSEITENBILD.breite,
      height: STARTSEITENBILD.hoehe,
      caption: STARTSEITENBILD.alt,
      creditText: KI_URHEBER,
    })
    assert.match(STARTSEITENBILD.alt, /^KI-Illustration: /)
    assert.equal(roh.includes('vercel.app'), false)
    for (const schluessel of VERBOTENE_SCHLUESSEL) {
      assert.equal(roh.includes(`"${schluessel}"`), false, schluessel)
    }
  })

  test('Reisebeispiel enthält keine erfundenen Angebote oder Buchungen', () => {
    const roh = JSON.stringify({ HOMEPAGE_PRODUKTFENSTER, HOMEPAGE_WERKZEUGE, HOMEPAGE_SCHRITTE })
    assert.equal(/\d+\s*(CHF|EUR|€|\$)/.test(roh), false)
    assert.equal(HOMEPAGE_PRODUKTFENSTER.kennzeichnung, 'Beispielreise')
    assert.equal(HOMEPAGE_PRODUKTFENSTER.schritte.length, 3)
    assert.match(HOMEPAGE_PRODUKTFENSTER.schritte[2].naechsterSchritt, /bestätigen/)
    assert.equal(/gebucht|bestätigte Buchung|verfügbar für/i.test(roh), false)
  })

  test('die finale Kundenstory beschreibt das Produkt ohne Statusmatrix', () => {
    assert.equal(FINAL_HOMEPAGE_H1, 'Deine ganze Reise. Intelligent an einem Ort.')
    assert.match(FINAL_HOMEPAGE_DEFINITION, /intelligente Reiseplattform/)
    assert.ok(FINAL_HOMEPAGE_DESCRIPTION.length <= 160)
    const texte = JSON.stringify({ HOMEPAGE_UEBERSCHRIFTEN, HOMEPAGE_SCHRITTE, HOMEPAGE_UNTERSCHIEDE, HOMEPAGE_WERKZEUGE, HOMEPAGE_FAQ })
    assert.equal(/In Vorbereitung|Kommt später|Heute nutzbar|synthetisch/.test(texte), false)
    assert.equal(HOMEPAGE_SCHRITTE.length, 3)
    assert.equal(/\bKI\b|künstliche Intelligenz|Wie finanziert|Provision|Affiliate/i.test(texte), false)
    const buchung = HOMEPAGE_FAQ.find((eintrag) => eintrag.frage.includes('automatisch'))
    assert.match(buchung?.antwort ?? '', /beim jeweiligen Anbieter/)
    assert.match(buchung?.antwort ?? '', /noch keine Buchung/)
  })

})

describe('final homepage product 1 – Seite bleibt am bestehenden Einstieg', () => {
  test('Startseite verdrahtet Formular, Handoff, Anker und JSON-LD ohne Index-Freigabe', () => {
    const seite = quelle('../../app/(public)/page.tsx')
    assert.match(seite, /GastCreateLink/)
    assert.match(seite, /zielHref/)
    assert.match(seite, /url: kanonischeUrl\('\/'\)/)
    assert.match(seite, /createLabel="Meine Reise planen"/)
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
    assert.match(seite, /STARTSEITENBILD\.pfad/)
    assert.ok(freigegebenerNachweis(STARTSEITENBILD.pfad), 'Das Startseitenbild braucht einen Herkunftsnachweis.')
    const bild = readFileSync(join(hier, '../../public', STARTSEITENBILD.pfad))
    const echt = bildabmessungen(bild)
    assert.equal(echt.breite, STARTSEITENBILD.breite, `Breite von ${STARTSEITENBILD.pfad}`)
    assert.equal(echt.hoehe, STARTSEITENBILD.hoehe, `Höhe von ${STARTSEITENBILD.pfad}`)
    const sitemap = quelle('../../app/sitemap.ts')
    assert.equal(sitemap.includes('lastModified: new Date()'), false)
  })
})
