import assert from 'node:assert/strict'
import { createHash } from 'node:crypto'
import { existsSync, readdirSync, readFileSync, statSync } from 'node:fs'
import { join, relative } from 'node:path'
import { describe, test } from 'node:test'
import { createElement } from 'react'
import { renderToStaticMarkup } from 'react-dom/server'

import DatenquellenPage from '@/app/(public)/datenquellen/page'
import { HomeInspiration } from '@/components/home/HomeInspiration'
import InspirationExplorer from '@/components/inspiration/explorer-1/InspirationExplorer'
import { Bildnachweisliste } from '@/components/inspiration/Bildnachweisliste'
import { BildnachweisKnopf } from '@/components/ui/bildnachweis'
import { IllustrationsHinweis } from '@/components/ui/IllustrationsHinweis'
import * as bildfreigabe from '@/lib/inspiration/bildfreigabe'
import { inspirationsbild } from '@/lib/inspiration/bildfreigabe'
import { ENTDECKEN_ZIELE } from '@/lib/inspiration/explorer-1/katalog'
import { INSPIRATION_ZIELE } from '@/lib/places/inspiration'
import { finalHomepageJsonLd } from '@/lib/seo/final-homepage'
import { STARTSEITENBILD } from '@/lib/seo/startseitenbild'
import {
  ALLE_BILDNACHWEISE,
  BILDNACHWEISE,
  bildMitNachweis,
  bildnachweisFuerDatei,
  datumDeutsch,
  freigegebenerNachweis,
  FREIGEGEBENE_ILLUSTRATIONEN,
  ILLUSTRATIONSHINWEIS,
  illustrationsnachweisFuerDatei,
  KI_ILLUSTRATIONEN,
  KI_URHEBER,
  NEUTRALES_REISEBILD,
  ZURUECKGEHALTENE_ILLUSTRATIONEN,
} from '@/lib/trips/organisieren/bildnachweise'
import { reisebildAusEtappe } from '@/lib/trips/organisieren/reisebilder'

const WURZEL = process.cwd()
const FUENF_DATEIEN = ['/images/hero-bali.png', '/images/bali.jpg', '/images/lisbon.jpg', '/images/zermatt.jpg', '/images/amsterdam.jpg'] as const
const FREIGEGEBEN = ['/images/hero-bali.png', '/images/bali.jpg', '/images/lisbon.jpg', '/images/amsterdam.jpg'] as const
const MUSTER = /(?:hero-bali\.png|\/images\/(?:bali|lisbon|zermatt|amsterdam)\.jpg)/
// Nur diese Quelltexte dürfen einen der fünf Dateinamen nennen: die CMS-Identität, der Katalog und das zentrale Startseitenbild.
const ERLAUBTE_NENNER = new Set(['lib/places/inspiration.ts', 'lib/trips/organisieren/bildnachweise.ts', 'lib/seo/startseitenbild.ts'])

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

const sha256 = (pfad: string) => createHash('sha256').update(readFileSync(join(WURZEL, 'public', pfad))).digest('hex')
const entschaerft = (text: string) => text.replace(/&/g, '&amp;')
const kodiert = (datei: string) => encodeURIComponent(datei)
const zaehle = (html: string, muster: RegExp) => (html.match(muster) ?? []).length

describe('Freigabe der KI-Illustrationen: nur einzeln belegte Dateien', () => {
  test('die Freigabeliste enthält genau die vier belegten Dateien, Zermatt ist zurückgehalten', () => {
    assert.deepEqual([...FREIGEGEBENE_ILLUSTRATIONEN].sort(), [...FREIGEGEBEN].sort())
    assert.deepEqual(Object.keys(ZURUECKGEHALTENE_ILLUSTRATIONEN), ['/images/zermatt.jpg'])
    assert.deepEqual(KI_ILLUSTRATIONEN.map((eintrag) => eintrag.datei).sort(), [...FUENF_DATEIEN].sort())
    for (const datei of FREIGEGEBEN) assert.ok(illustrationsnachweisFuerDatei(datei), datei)
    assert.equal(illustrationsnachweisFuerDatei('/images/zermatt.jpg'), null)
    assert.equal(freigegebenerNachweis('/images/zermatt.jpg'), null)
  })

  test('jede freigegebene Datei existiert und ist mit ihrer Prüfsumme an den Nachweis gebunden', () => {
    for (const eintrag of KI_ILLUSTRATIONEN) {
      assert.ok(existsSync(join(WURZEL, 'public', eintrag.datei)), eintrag.datei)
      assert.equal(sha256(eintrag.datei), eintrag.herkunft.sha256, eintrag.datei)
    }
  })

  test('eine KI-Illustration ist nie als Foto geführt: kein Fotokatalog, keine Quelle, keine CC-Lizenz', () => {
    for (const datei of FUENF_DATEIEN) {
      assert.equal(bildnachweisFuerDatei(datei), null, datei)
      assert.equal(bildMitNachweis(datei, null).src, NEUTRALES_REISEBILD, datei)
    }
    for (const eintrag of BILDNACHWEISE) assert.equal(eintrag.medium, 'foto')
    for (const eintrag of KI_ILLUSTRATIONEN) {
      assert.equal(eintrag.medium, 'ki-illustration')
      assert.equal(eintrag.urheber, KI_URHEBER)
      assert.equal(eintrag.quelleUrl, null, eintrag.datei)
      assert.match(eintrag.lizenz, /^Keine CC-Lizenz/, eintrag.datei)
      assert.doesNotMatch(eintrag.lizenz, /CC BY|CC0|Creative Commons/i, eintrag.datei)
      assert.match(eintrag.bildbeschreibung, /^KI-Illustration: /, eintrag.datei)
      assert.match(eintrag.herkunft.ersteintrag.datum, /^\d{4}-\d{2}-\d{2}$/)
      assert.match(eintrag.herkunft.ersteintrag.commit, /^[0-9a-f]{40}$/)
    }
    assert.equal(ALLE_BILDNACHWEISE.length, BILDNACHWEISE.length + KI_ILLUSTRATIONEN.length)
  })

  test('Ersteintrag, Eigentumsangabe und OpenAI-Bedingungen entsprechen der Vorgabe', () => {
    assert.equal(KI_URHEBER, 'KI-generiert (ChatGPT/OpenAI), Eigentum Jetnity/Sasa Feirov (PO-Erklärung 26.11.2026)')
    const ersteintrag = Object.fromEntries(KI_ILLUSTRATIONEN.map((eintrag) => [eintrag.datei, eintrag.herkunft.ersteintrag]))
    assert.deepEqual(ersteintrag['/images/hero-bali.png'], { datum: '2025-07-19', commit: '6f59d83eec1453892139eb2eab3e238223487a25' })
    for (const datei of ['/images/bali.jpg', '/images/lisbon.jpg', '/images/zermatt.jpg', '/images/amsterdam.jpg']) {
      assert.deepEqual(ersteintrag[datei], { datum: '2025-09-02', commit: '265887dd8a5dbdaf450eb14eec6b84f987568e6f' }, datei)
    }
    for (const eintrag of KI_ILLUSTRATIONEN) {
      assert.equal(eintrag.herkunft.bedingungen.archiv, 'https://openai.com/policies/dec-2024-eu-terms/')
      assert.equal(eintrag.herkunft.bedingungen.aktuell, 'https://openai.com/policies/eu-terms-of-use/')
    }
    assert.equal(datumDeutsch('2025-07-19'), '19.07.2025')
  })
})

describe('Inspirationsbild: Allowlist, Medium und neutrale Rückfälle', () => {
  test('Bali, Lissabon und Amsterdam zeigen ihre Illustration als KI-Illustration; Zermatt bleibt neutral', () => {
    const bilder = Object.fromEntries(INSPIRATION_ZIELE.map((ziel) => [ziel.name, inspirationsbild(ziel.image)]))
    for (const [name, datei] of [['Bali', '/images/bali.jpg'], ['Lissabon', '/images/lisbon.jpg'], ['Amsterdam', '/images/amsterdam.jpg']] as const) {
      const ergebnis = bilder[name]!
      assert.equal(ergebnis.src, datei, name)
      assert.equal(ergebnis.neutral, false, name)
      assert.equal(ergebnis.medium, 'ki-illustration', name)
      assert.match(ergebnis.beschreibung ?? '', /^KI-Illustration: /, name)
      assert.equal(ergebnis.nachweis.medium, 'ki-illustration', name)
      assert.equal(ergebnis.nachweis.datei, datei, name)
    }
    const zermatt = bilder.Zermatt!
    assert.equal(zermatt.src, NEUTRALES_REISEBILD)
    assert.equal(zermatt.neutral, true)
    assert.equal(zermatt.medium, 'foto')
    assert.equal(zermatt.beschreibung, null)
    assert.equal(zermatt.nachweis.datei, NEUTRALES_REISEBILD)
  })

  test('unbekannte, fremde, abgewandelte und alte Bildwerte fallen auf das neutrale Motiv, nie auf den Rohwert', () => {
    const unbekannt = [
      '/images/unbekannt.jpg', 'https://example.test/foto.jpg', 'https://example.test/images/bali.jpg', '', ' ', '/images/zermatt.jpg',
      '/images/bali.jpg?x=1', '/images/bali.jpg#a', '/IMAGES/bali.jpg', '//evil.test/images/bali.jpg', '/images/bali.jpg ', '/images/bali.jpeg',
      '/images/hero-bali.png.evil', '/images/organisieren/zermatt.jpg', '/images/organisieren/zermatt-commons.jpg-x',
    ]
    for (const roh of unbekannt) {
      const ergebnis = inspirationsbild(roh)
      assert.equal(ergebnis.src, NEUTRALES_REISEBILD, roh)
      assert.equal(ergebnis.neutral, true, roh)
      assert.equal(ergebnis.medium, 'foto', roh)
      assert.equal(ergebnis.beschreibung, null, roh)
    }
    const foto = inspirationsbild('/images/organisieren/paris.jpg')
    assert.equal(foto.src, '/images/organisieren/paris.jpg')
    assert.equal(foto.neutral, false)
    assert.equal(foto.medium, 'foto')
    assert.equal(foto.beschreibung, null)
  })

  test('die frühere Ersatz-Zuordnung ist entfernt und die fünf Dateien werden nie auf ein Commons-Foto abgebildet', () => {
    assert.ok(!('FREIGEGEBENE_ERSATZBILDER' in bildfreigabe))
    for (const roh of FUENF_DATEIEN) {
      assert.doesNotMatch(inspirationsbild(roh).src, /-commons\.jpg$/, roh)
    }
  })

  test('die CMS-Identität bleibt unverändert', () => {
    assert.deepEqual(
      INSPIRATION_ZIELE.map((ziel) => [ziel.placeId, ziel.image]),
      [
        ['geonames:1650535', '/images/bali.jpg'],
        ['geonames:2267057', '/images/lisbon.jpg'],
        ['geonames:2657915', '/images/zermatt.jpg'],
        ['geonames:2759794', '/images/amsterdam.jpg'],
      ],
    )
  })

  test('die beiden Zermatt-Kennungen werden nicht gleichgesetzt', () => {
    const reiseidee = INSPIRATION_ZIELE.find((ziel) => ziel.name === 'Zermatt')!
    assert.equal(reiseidee.placeId, 'geonames:2657915')
    const katalogZermatt = { name: 'Zermatt', countryCode: 'CH', placeId: 'geonames:2657928' }
    assert.equal(reisebildAusEtappe(katalogZermatt), '/images/organisieren/zermatt-commons.jpg')
    const reiseideeAlsEtappe = { name: 'Zermatt', countryCode: 'CH', placeId: reiseidee.placeId }
    assert.equal(reisebildAusEtappe(reiseideeAlsEtappe), '/images/organisieren/reiseatlas.webp')
  })

  test('kein aktiver Quelltext nennt eine der fünf Dateien ausser Identität, Katalog und Startseitenbild', () => {
    const verstoesse: string[] = []
    for (const ordner of ['app', 'components', 'lib', 'styles']) {
      for (const datei of quelldateien(ordner)) {
        const pfad = relative(WURZEL, join(WURZEL, datei))
        if (ERLAUBTE_NENNER.has(pfad)) continue
        if (MUSTER.test(readFileSync(join(WURZEL, datei), 'utf8'))) verstoesse.push(pfad)
      }
    }
    assert.deepEqual(verstoesse, [])
  })
})

describe('Kennzeichnung in der gerenderten Anzeige', () => {
  const ziele = ENTDECKEN_ZIELE.map((ziel) => ({ name: ziel.name, country: ziel.country, image: ziel.image, href: ziel.href ?? '/planen' }))
  const ALT = {
    Bali: 'KI-Illustration: Reisterrassen und Palmen im Morgenlicht, Motiv Bali',
    Lissabon: 'KI-Illustration: gelbe Tram in einer Gasse bei Sonnenuntergang, Motiv Lissabon',
    Amsterdam: 'KI-Illustration: Grachtenhäuser und beleuchtete Brücken am Abend mit Tulpen, Motiv Amsterdam',
  } as const

  function pruefe(html: string, status: string) {
    for (const datei of ['/images/bali.jpg', '/images/lisbon.jpg', '/images/amsterdam.jpg']) assert.ok(html.includes(kodiert(datei)), `${status} ${datei}`)
    assert.ok(html.includes(kodiert(NEUTRALES_REISEBILD)), `${status} Zermatt neutral`)
    assert.doesNotMatch(html, /zermatt[\w-]*\.jpg/, status)
    assert.doesNotMatch(html, /hero-bali\.png/, status)
    assert.doesNotMatch(html, /Matterhorn mit Berghütte/, status)
    assert.equal(zaehle(html, /data-illustrationshinweis/g), 3, `${status} ein Hinweis je Illustration`)
    for (const text of Object.values(ALT)) assert.ok(html.includes(`alt="${text}"`), `${status} ${text}`)
  }

  test('Startseite: Hinweis und Alt-Text je Illustration in allen Zuständen, Zermatt neutral', () => {
    for (const status of ['static', 'published', 'supplemented', 'fallback'] as const) {
      pruefe(renderToStaticMarkup(createElement(HomeInspiration, { ziele, status })), status)
    }
  })

  test('Entdecken: Hinweis und Alt-Text je Illustration in allen Zuständen, auch beim CMS-Rückfall', () => {
    for (const status of ['static', 'published', 'supplemented', 'fallback'] as const) {
      pruefe(renderToStaticMarkup(createElement(InspirationExplorer, { initial: { q: '', thema: 'alle' }, ziele: ENTDECKEN_ZIELE, status })), status)
    }
  })

  test('der Hinweis trägt den Text «KI-Illustration» sichtbar und nicht als versteckten Text', () => {
    const html = renderToStaticMarkup(createElement(IllustrationsHinweis))
    assert.match(html, /data-illustrationshinweis/)
    assert.ok(html.includes(`>${ILLUSTRATIONSHINWEIS}<`))
    assert.doesNotMatch(html, /aria-hidden|sr-only/)
    assert.match(html, /bg-black\/80/)
    assert.match(html, /text-white/)
  })

  test('das neutrale Motiv behauptet keinen Ort und trägt keinen Illustrationshinweis', () => {
    const zermatt = renderToStaticMarkup(createElement(HomeInspiration, { ziele: [ziele[2]!], status: 'static' }))
    assert.match(zermatt, /alt=""/)
    assert.doesNotMatch(zermatt, /alt="Zermatt/)
    assert.doesNotMatch(zermatt, /data-illustrationshinweis/)
    assert.doesNotMatch(zermatt, /KI-Illustration/)
    const bali = renderToStaticMarkup(createElement(HomeInspiration, { ziele: [ziele[0]!], status: 'static' }))
    assert.match(bali, /data-illustrationshinweis/)
    assert.doesNotMatch(bali, /alt="Bali, Indonesien"/)
  })

  test('die Illustration behauptet nirgends ein Foto oder eine echte Ortsaufnahme', () => {
    const html = renderToStaticMarkup(createElement(HomeInspiration, { ziele, status: 'static' }))
    assert.doesNotMatch(html, /Foto|Fotografie|Aufnahme/)
  })

  test('Hero: Quelltext nutzt das zentrale Bild, den Hinweis und den Link auf die Bildnachweise', () => {
    // Der Hero enthält die Startziel-Suche und braucht den App-Router; der gerenderte Hero ist im
    // Browser-Nachweis `scripts/premium-redesign-a/bildlizenz.mjs` und `dunkelstart.mjs` geprüft.
    const quelle = readFileSync(join(WURZEL, 'components/home/HomeHero.tsx'), 'utf8')
    assert.match(quelle, /src=\{STARTSEITENBILD\.pfad\}/)
    assert.match(quelle, /alt=\{STARTSEITENBILD\.alt\}/)
    assert.match(quelle, /\{STARTSEITENBILD\.ort\}/)
    assert.match(quelle, /data-illustrationshinweis/)
    assert.match(quelle, /\{ILLUSTRATIONSHINWEIS\}/)
    assert.match(quelle, /href=\{`#\$\{BILDNACHWEISE_ID\}`\}/)
    assert.doesNotMatch(quelle, MUSTER)
  })

  test('das Startseitenbild ist eine freigegebene, belegte Illustration mit wahrer Beschriftung', () => {
    assert.equal(STARTSEITENBILD.medium, 'ki-illustration')
    assert.ok((FREIGEGEBEN as readonly string[]).includes(STARTSEITENBILD.pfad))
    assert.ok(illustrationsnachweisFuerDatei(STARTSEITENBILD.pfad))
    assert.ok(existsSync(join(WURZEL, 'public', STARTSEITENBILD.pfad)))
    assert.match(STARTSEITENBILD.alt, /^KI-Illustration: /)
    assert.match(STARTSEITENBILD.teilenAlt, /KI-Illustration/)
    assert.doesNotMatch(`${STARTSEITENBILD.alt} ${STARTSEITENBILD.teilenAlt}`, /Foto|Aufnahme/)
  })

  test('Open Graph und Twitter nutzen den wahren Alt-Text aus dem zentralen Bild, in allen drei Metadaten-Quellen', () => {
    for (const datei of ['app/layout.tsx', 'app/(public)/layout.tsx', 'app/(public)/page.tsx']) {
      const quelle = readFileSync(join(WURZEL, datei), 'utf8')
      assert.match(quelle, /alt: STARTSEITENBILD\.teilenAlt/, datei)
      assert.doesNotMatch(quelle, MUSTER, datei)
    }
    const seite = readFileSync(join(WURZEL, 'app/(public)/page.tsx'), 'utf8')
    assert.match(seite, /freigegebenerNachweis\(STARTSEITENBILD\.pfad\)/)
    assert.doesNotMatch(seite, /bildnachweisFuerDatei/)
  })

  test('JSON-LD: das Bild ist ein ImageObject mit Illustrations-Beschriftung und Herkunft, ohne Fotobehauptung', () => {
    const graph = finalHomepageJsonLd({ url: 'https://jetnity.com/' })
    const roh = JSON.stringify(graph)
    const app = (graph['@graph'] as Array<Record<string, unknown>>).find((knoten) => knoten['@type'] === 'SoftwareApplication')!
    const bildobjekt = app.image as Record<string, unknown>
    assert.equal(bildobjekt['@type'], 'ImageObject')
    assert.ok(String(bildobjekt.url).endsWith(STARTSEITENBILD.pfad))
    assert.equal(bildobjekt.width, STARTSEITENBILD.breite)
    assert.equal(bildobjekt.height, STARTSEITENBILD.hoehe)
    assert.equal(bildobjekt.caption, STARTSEITENBILD.alt)
    assert.equal(bildobjekt.creditText, KI_URHEBER)
    assert.doesNotMatch(roh, /"photo"|Photograph|Foto|Aufnahme/)
    assert.doesNotMatch(roh.replace(STARTSEITENBILD.pfad, ''), MUSTER)
  })
})

describe('Bildnachweise bleiben vollständig und trennen Foto und Illustration', () => {
  const eintraege = [
    { bezug: 'Startseite', nachweis: freigegebenerNachweis(STARTSEITENBILD.pfad)! },
    ...INSPIRATION_ZIELE.map((ziel) => ({ bezug: ziel.name, nachweis: inspirationsbild(ziel.image).nachweis })),
    { bezug: 'Reise', nachweis: bildnachweisFuerDatei('/images/organisieren/paris.jpg')! },
  ]

  test('die Liste nennt je Illustration Medium, Eigentum, Bedingungen, Ersteintrag und Link auf die Herkunft', () => {
    const html = renderToStaticMarkup(createElement(Bildnachweisliste, { id: 'bildnachweise', eintraege }))
    assert.match(html, /id="bildnachweise"/)
    assert.equal(zaehle(html, /data-medium="ki-illustration"/g), 4)
    assert.ok(html.includes(`${ILLUSTRATIONSHINWEIS}, kein Foto: `))
    assert.ok(html.includes(KI_URHEBER))
    assert.ok(html.includes('https://openai.com/policies/eu-terms-of-use/'))
    assert.ok(html.includes('Ersteintrag im Repository 19.07.2025'))
    assert.ok(html.includes('Ersteintrag im Repository 02.09.2025'))
    assert.ok(html.includes('href="/datenquellen#ki-illustrationen"'))
    for (const zeile of html.split('<li ').filter((teil) => teil.includes('data-medium="ki-illustration"'))) {
      assert.doesNotMatch(zeile.split('</li>')[0]!, /CC BY|Quelle:/)
    }
    const foto = eintraege.at(-1)!.nachweis
    assert.equal(foto.medium, 'foto')
    assert.ok(html.includes(entschaerft(foto.quelleUrl)))
    assert.ok(html.includes(foto.lizenz))
    assert.ok(html.includes(foto.bearbeitung))
    assert.equal(renderToStaticMarkup(createElement(Bildnachweisliste, { id: 'leer', eintraege: [] })), '')
  })

  test('der Nachweisknopf nennt bei einer Illustration kein Foto, bei einem Foto wie bisher', () => {
    const illustration = renderToStaticMarkup(createElement(BildnachweisKnopf, { nachweis: illustrationsnachweisFuerDatei('/images/lisbon.jpg')! }))
    assert.match(illustration, /Bildnachweis zur Illustration/)
    assert.ok(illustration.includes(KI_URHEBER))
    assert.doesNotMatch(illustration, /Bildnachweis zum Foto/)
    const foto = renderToStaticMarkup(createElement(BildnachweisKnopf, { nachweis: bildnachweisFuerDatei('/images/organisieren/paris.jpg')! }))
    assert.match(foto, /Bildnachweis zum Foto/)
  })

  test('Datenquellen: alle fünf Illustrationen mit Herkunft, Bedingungen und Prüfsumme, nur Zermatt zurückgehalten', () => {
    const html = renderToStaticMarkup(createElement(DatenquellenPage))
    assert.match(html, /id="ki-illustrationen"/)
    assert.ok(html.includes(KI_URHEBER))
    assert.ok(html.includes('https://openai.com/policies/dec-2024-eu-terms/'))
    assert.ok(html.includes('https://openai.com/policies/eu-terms-of-use/'))
    assert.ok(html.includes('kein verifiziertes Erstellungsdatum'))
    assert.ok(html.includes('keine Creative-Commons-Lizenz'))
    assert.ok(html.includes('Garantie'))
    for (const eintrag of KI_ILLUSTRATIONEN) {
      assert.ok(html.includes(eintrag.bildtitel), eintrag.datei)
      assert.ok(html.includes(eintrag.herkunft.sha256), eintrag.datei)
      assert.ok(html.includes(eintrag.herkunft.ersteintrag.commit.slice(0, 9)), eintrag.datei)
    }
    assert.equal(zaehle(html, /Derzeit nicht im Einsatz/g), 1)
    assert.match(html, /data-illustration="\/images\/zermatt\.jpg"[\s\S]*?Derzeit nicht im Einsatz/)
  })
})
