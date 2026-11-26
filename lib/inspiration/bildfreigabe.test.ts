import assert from 'node:assert/strict'
import { existsSync, readdirSync, readFileSync, statSync } from 'node:fs'
import { join, relative } from 'node:path'
import { describe, test } from 'node:test'
import { createElement } from 'react'
import { renderToStaticMarkup } from 'react-dom/server'

import { HomeHero } from '@/components/home/HomeHero'
import { HomeInspiration } from '@/components/home/HomeInspiration'
import InspirationExplorer from '@/components/inspiration/explorer-1/InspirationExplorer'
import { Bildnachweisliste } from '@/components/inspiration/Bildnachweisliste'
import { FREIGEGEBENE_ERSATZBILDER, inspirationsbild } from '@/lib/inspiration/bildfreigabe'
import { ENTDECKEN_ZIELE } from '@/lib/inspiration/explorer-1/katalog'
import { INSPIRATION_ZIELE } from '@/lib/places/inspiration'
import { finalHomepageJsonLd } from '@/lib/seo/final-homepage'
import { STARTSEITENBILD } from '@/lib/seo/startseitenbild'
import { BILDNACHWEISE, bildnachweisFuerDatei, NEUTRALES_REISEBILD } from '@/lib/trips/organisieren/bildnachweise'
import { reisebildAusEtappe } from '@/lib/trips/organisieren/reisebilder'

const WURZEL = process.cwd()
// Dateien ohne belegten Lizenznachweis. Sie bleiben als CMS-Identität im Bestand,
// werden aber nirgends mehr angezeigt oder als Metadaten ausgeliefert.
const OHNE_NACHWEIS = ['hero-bali.png', 'bali.jpg', 'lisbon.jpg', 'zermatt.jpg', 'amsterdam.jpg'] as const
const MUSTER = /(?:hero-bali\.png|\/images\/(?:bali|lisbon|zermatt|amsterdam)\.jpg)/

function quelldateien(ordner: string): string[] {
  const treffer: string[] = []
  for (const eintrag of readdirSync(join(WURZEL, ordner))) {
    const pfad = join(ordner, eintrag)
    if (statSync(join(WURZEL, pfad)).isDirectory()) {
      if (eintrag !== 'node_modules' && eintrag !== '.next') treffer.push(...quelldateien(pfad))
    } else if (/\.(?:ts|tsx|css|mjs|json)$/.test(eintrag) && !/\.test\.[cm]?tsx?$/.test(eintrag)) {
      treffer.push(pfad)
    }
  }
  return treffer
}

describe('Lizenz-Gate der öffentlichen Bilder', () => {
  test('die fünf Bilder ohne Nachweis sind nicht freigegeben', () => {
    for (const datei of OHNE_NACHWEIS) {
      assert.equal(bildnachweisFuerDatei(`/images/${datei}`), null, datei)
    }
    for (const eintrag of BILDNACHWEISE) {
      assert.doesNotMatch(eintrag.datei, MUSTER)
    }
  })

  test('jedes Ersatzbild und das Startseitenbild haben einen Nachweis und existieren', () => {
    for (const ersatz of Object.values(FREIGEGEBENE_ERSATZBILDER)) {
      assert.ok(bildnachweisFuerDatei(ersatz), ersatz)
      assert.ok(existsSync(join(WURZEL, 'public', ersatz)), ersatz)
    }
    assert.ok(bildnachweisFuerDatei(STARTSEITENBILD.pfad))
    assert.ok(existsSync(join(WURZEL, 'public', STARTSEITENBILD.pfad)))
    assert.doesNotMatch(STARTSEITENBILD.pfad, MUSTER)
  })

  test('alle vier Reiseideen zeigen nur Bilder mit Nachweis; Bali bleibt neutral', () => {
    const bilder = Object.fromEntries(INSPIRATION_ZIELE.map((ziel) => [ziel.name, inspirationsbild(ziel.image)]))
    assert.equal(bilder.Lissabon!.src, '/images/organisieren/lisbon-commons.jpg')
    assert.equal(bilder.Zermatt!.src, '/images/organisieren/zermatt-commons.jpg')
    assert.equal(bilder.Amsterdam!.src, '/images/organisieren/amsterdam-commons.jpg')
    assert.equal(bilder.Bali!.src, NEUTRALES_REISEBILD)
    assert.equal(bilder.Bali!.neutral, true)
    for (const [name, bild] of Object.entries(bilder)) {
      assert.equal(bild.nachweis.datei, bild.src, name)
      assert.equal(bild.neutral, name === 'Bali', name)
    }
  })

  test('unbekannte oder fremde Bildwerte fallen auf das neutrale Motiv, nie auf den Rohwert', () => {
    for (const roh of ['/images/unbekannt.jpg', 'https://example.test/foto.jpg', '', '/images/bali.jpg']) {
      const bild = inspirationsbild(roh)
      assert.equal(bild.src, NEUTRALES_REISEBILD, roh)
      assert.equal(bild.neutral, true)
    }
    const freigegeben = inspirationsbild('/images/organisieren/paris.jpg')
    assert.equal(freigegeben.src, '/images/organisieren/paris.jpg')
    assert.equal(freigegeben.neutral, false)
  })

  test('die CMS-Identität bleibt unverändert und der Ersatz bindet nur Dateien, keine Orts-IDs', () => {
    assert.deepEqual(
      INSPIRATION_ZIELE.map((ziel) => [ziel.placeId, ziel.image]),
      [
        ['geonames:1650535', '/images/bali.jpg'],
        ['geonames:2267057', '/images/lisbon.jpg'],
        ['geonames:2657915', '/images/zermatt.jpg'],
        ['geonames:2759794', '/images/amsterdam.jpg'],
      ],
    )
    assert.deepEqual(Object.keys(FREIGEGEBENE_ERSATZBILDER).sort(), ['/images/amsterdam.jpg', '/images/lisbon.jpg', '/images/zermatt.jpg'])
  })

  test('die beiden Zermatt-Kennungen werden nicht gleichgesetzt', () => {
    const reiseidee = INSPIRATION_ZIELE.find((ziel) => ziel.name === 'Zermatt')!
    assert.equal(reiseidee.placeId, 'geonames:2657915')
    const katalogZermatt = { name: 'Zermatt', countryCode: 'CH', placeId: 'geonames:2657928' }
    assert.equal(reisebildAusEtappe(katalogZermatt), '/images/organisieren/zermatt-commons.jpg')
    const reiseideeAlsEtappe = { name: 'Zermatt', countryCode: 'CH', placeId: reiseidee.placeId }
    assert.equal(reisebildAusEtappe(reiseideeAlsEtappe), '/images/organisieren/reiseatlas.webp')
  })

  test('kein aktiver Quelltext verweist auf eines der fünf Bilder ausser der Identität und dem Ersatz', () => {
    const erlaubt = new Set(['lib/places/inspiration.ts', 'lib/inspiration/bildfreigabe.ts'])
    const verstoesse: string[] = []
    for (const ordner of ['app', 'components', 'lib', 'styles']) {
      for (const datei of quelldateien(ordner)) {
        const pfad = relative(WURZEL, join(WURZEL, datei))
        if (erlaubt.has(pfad)) continue
        if (MUSTER.test(readFileSync(join(WURZEL, datei), 'utf8'))) verstoesse.push(pfad)
      }
    }
    assert.deepEqual(verstoesse, [])
  })
})

describe('Lizenz-Gate in der gerenderten Anzeige', () => {
  const ziele = ENTDECKEN_ZIELE.map((ziel) => ({ name: ziel.name, country: ziel.country, image: ziel.image, href: ziel.href ?? '/planen' }))
  const entdeckt = (name: string) => encodeURIComponent(`/images/organisieren/${name}`)

  test('Startseite: Reiseideen zeigen freigegebene Bilder in allen Zuständen', () => {
    for (const status of ['static', 'published', 'supplemented', 'fallback'] as const) {
      const html = renderToStaticMarkup(createElement(HomeInspiration, { ziele, status }))
      assert.doesNotMatch(html, MUSTER, status)
      assert.doesNotMatch(html, /%2Fimages%2F(?:bali|lisbon|zermatt|amsterdam)\.jpg/, status)
      assert.ok(html.includes(entdeckt('lisbon-commons.jpg')), status)
      assert.ok(html.includes(entdeckt('zermatt-commons.jpg')), status)
      assert.ok(html.includes(entdeckt('amsterdam-commons.jpg')), status)
      assert.ok(html.includes(entdeckt('reiseatlas.webp')), status)
    }
  })

  test('Startseite: das neutrale Motiv behauptet keinen Ort im Bildtext', () => {
    const html = renderToStaticMarkup(createElement(HomeInspiration, { ziele: [ziele[0]!], status: 'static' }))
    assert.match(html, /alt=""/)
    assert.doesNotMatch(html, /alt="Bali, Indonesien"/)
    const lissabon = renderToStaticMarkup(createElement(HomeInspiration, { ziele: [ziele[1]!], status: 'static' }))
    assert.match(lissabon, /alt="Lissabon, Portugal"/)
  })

  test('Entdecken: Karten zeigen freigegebene Bilder, auch beim CMS-Fallback', () => {
    for (const status of ['static', 'published', 'supplemented', 'fallback'] as const) {
      const html = renderToStaticMarkup(createElement(InspirationExplorer, { initial: { q: '', thema: 'alle' }, ziele: ENTDECKEN_ZIELE, status }))
      assert.doesNotMatch(html, MUSTER, status)
      assert.doesNotMatch(html, /%2Fimages%2F(?:bali|lisbon|zermatt|amsterdam)\.jpg/, status)
      assert.ok(html.includes(entdeckt('zermatt-commons.jpg')), status)
      assert.ok(html.includes(entdeckt('reiseatlas.webp')), status)
    }
  })

  test('Hero: freigegebenes Foto mit wahrer Ortsangabe und Link auf den Nachweis', () => {
    // Der Hero enthält die Startziel-Suche und braucht den App-Router; der gerenderte
    // Hero ist im Browser-Nachweis `scripts/premium-redesign-a/bildlizenz.mjs` geprüft.
    const quelle = readFileSync(join(WURZEL, 'components/home/HomeHero.tsx'), 'utf8')
    assert.match(quelle, /src=\{STARTSEITENBILD\.pfad\}/)
    assert.match(quelle, /alt=\{STARTSEITENBILD\.alt\}/)
    assert.match(quelle, /\{STARTSEITENBILD\.ort\}/)
    assert.match(quelle, /href=\{`#\$\{BILDNACHWEISE_ID\}`\}/)
    assert.doesNotMatch(quelle, MUSTER)
    assert.doesNotMatch(quelle, /Bali/)
    assert.doesNotMatch(STARTSEITENBILD.ort + STARTSEITENBILD.alt, /Bali/)
  })

  test('Bildnachweise bleiben vollständig: Urheber, Quelle, Lizenz, Bearbeitung je gezeigtem Foto', () => {
    const eintraege = [
      { bezug: 'Startseite', nachweis: bildnachweisFuerDatei(STARTSEITENBILD.pfad)! },
      ...ziele.map((ziel) => ({ bezug: ziel.name, nachweis: inspirationsbild(ziel.image).nachweis })),
    ]
    const html = renderToStaticMarkup(createElement(Bildnachweisliste, { id: 'bildnachweise', eintraege }))
    for (const { nachweis } of eintraege) {
      assert.ok(html.includes(nachweis.bildtitel.replace(/&/g, '&amp;')), nachweis.datei)
      assert.ok(html.includes(nachweis.quelleUrl.replace(/&/g, '&amp;')), nachweis.datei)
      assert.ok(html.includes(nachweis.lizenz), nachweis.datei)
      assert.ok(html.includes(nachweis.bearbeitung), nachweis.datei)
      if (nachweis.urheber) assert.ok(html.includes(nachweis.urheber), nachweis.datei)
    }
    assert.match(html, /id="bildnachweise"/)
    assert.equal(renderToStaticMarkup(createElement(Bildnachweisliste, { id: 'leer', eintraege: [] })), '')
  })

  test('JSON-LD verweist auf das freigegebene Startseitenbild', () => {
    const graph = finalHomepageJsonLd({ url: 'https://jetnity.com/' })
    const roh = JSON.stringify(graph)
    assert.doesNotMatch(roh, MUSTER)
    assert.ok(roh.includes(STARTSEITENBILD.pfad))
  })
})
