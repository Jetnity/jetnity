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
import { cmsReference } from '@/lib/admin/content/cms/contract'
import { INSPIRATION_ZIELE } from '@/lib/places/inspiration'
import { finalHomepageJsonLd } from '@/lib/seo/final-homepage'
import { STARTSEITENBILD, TEILENBILD } from '@/lib/seo/startseitenbild'
import {
  ALLE_BILDNACHWEISE,
  aktuellerBildpfad,
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
  KI_VORSCHAUBILD,
  LEGACY_BILDPFADE,
  NEUTRALES_REISEBILD,
  VORSCHAUBILD_DATEI,
  ZURUECKGEHALTENE_ILLUSTRATIONEN,
} from '@/lib/trips/organisieren/bildnachweise'
import { reisebildAusEtappe } from '@/lib/trips/organisieren/reisebilder'

const WURZEL = process.cwd()
const FUENF_DATEIEN = ['/images/hero-bali.png', '/images/bali.png', '/images/lisbon.png', '/images/zermatt.png', '/images/amsterdam.png'] as const
const FREIGEGEBEN = ['/images/hero-bali.png', '/images/bali.png', '/images/lisbon.png', '/images/amsterdam.png'] as const
const VORSCHAUBILD = '/images/hero-bali-og.jpg'
// Die CMS-Referenz der Reiseideen führt die alten Pfade mit der falschen Endung .jpg weiter.
const ALTE_PFADE = { '/images/bali.jpg': '/images/bali.png', '/images/lisbon.jpg': '/images/lisbon.png', '/images/zermatt.jpg': '/images/zermatt.png', '/images/amsterdam.jpg': '/images/amsterdam.png' } as const
const MUSTER = /(?:hero-bali(?:-og)?\.(?:png|jpg)|\/images\/(?:bali|lisbon|zermatt|amsterdam)\.(?:jpg|png))/
// Nur diese Quelltexte dürfen einen der Dateinamen nennen: die CMS-Identität, der Katalog und das zentrale Startseitenbild.
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
  test('die Freigabeliste enthält genau die vier belegten Dateien und das abgeleitete Vorschaubild, Zermatt ist zurückgehalten', () => {
    assert.deepEqual([...FREIGEGEBENE_ILLUSTRATIONEN].sort(), [...FREIGEGEBEN, VORSCHAUBILD].sort())
    assert.deepEqual(Object.keys(ZURUECKGEHALTENE_ILLUSTRATIONEN), ['/images/zermatt.png'])
    assert.deepEqual(KI_ILLUSTRATIONEN.map((eintrag) => eintrag.datei).sort(), [...FUENF_DATEIEN].sort())
    assert.equal(KI_VORSCHAUBILD.datei, VORSCHAUBILD)
    for (const datei of [...FREIGEGEBEN, VORSCHAUBILD]) assert.ok(illustrationsnachweisFuerDatei(datei), datei)
    for (const datei of ['/images/zermatt.png', '/images/zermatt.jpg']) {
      assert.equal(illustrationsnachweisFuerDatei(datei), null, datei)
      assert.equal(freigegebenerNachweis(datei), null, datei)
    }
  })

  test('jede freigegebene Datei existiert und ist mit ihrer Prüfsumme an den Nachweis gebunden', () => {
    for (const eintrag of [...KI_ILLUSTRATIONEN, KI_VORSCHAUBILD]) {
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
    assert.equal(bildnachweisFuerDatei(VORSCHAUBILD), null)
    for (const eintrag of [...KI_ILLUSTRATIONEN, KI_VORSCHAUBILD]) {
      assert.equal(eintrag.medium, 'ki-illustration')
      assert.equal(eintrag.urheber, KI_URHEBER)
      assert.equal(eintrag.quelleUrl, null, eintrag.datei)
      assert.match(eintrag.lizenz, /^Keine CC-Lizenz/, eintrag.datei)
      assert.doesNotMatch(eintrag.lizenz, /CC BY|CC0|Creative Commons/i, eintrag.datei)
      assert.match(eintrag.bildbeschreibung, /^KI-Illustration: /, eintrag.datei)
      assert.match(eintrag.herkunft.ersteintrag.datum, /^\d{4}-\d{2}-\d{2}$/)
      assert.match(eintrag.herkunft.ersteintrag.commit, /^[0-9a-f]{40}$/)
    }
    assert.equal(ALLE_BILDNACHWEISE.length, BILDNACHWEISE.length + KI_ILLUSTRATIONEN.length + 1)
  })

  test('Ersteintrag, Eigentumsangabe und OpenAI-Bedingungen entsprechen der Vorgabe', () => {
    assert.equal(KI_URHEBER, 'KI-generiert (ChatGPT/OpenAI), Eigentum Jetnity/Sasa Feirov (PO-Erklärung 26.11.2026)')
    const ersteintrag = Object.fromEntries(KI_ILLUSTRATIONEN.map((eintrag) => [eintrag.datei, eintrag.herkunft.ersteintrag]))
    assert.deepEqual(ersteintrag['/images/hero-bali.png'], { datum: '2025-07-19', commit: '6f59d83eec1453892139eb2eab3e238223487a25' })
    for (const datei of ['/images/bali.png', '/images/lisbon.png', '/images/zermatt.png', '/images/amsterdam.png']) {
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
    for (const [name, datei] of [['Bali', '/images/bali.png'], ['Lissabon', '/images/lisbon.png'], ['Amsterdam', '/images/amsterdam.png']] as const) {
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
      '/images/zermatt.png', '/images/Bali.jpg', '/images/bali.jpg/', '/images/bali.png?x=1', '/images/bali.PNG', '/images/hero-bali-og.png',
      '/images/lisbon.jpg.png', '/images/../images/zermatt.png', '__proto__', 'constructor', 'toString',
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
    for (const roh of [...FUENF_DATEIEN, ...Object.keys(ALTE_PFADE)]) {
      assert.doesNotMatch(inspirationsbild(roh).src, /-commons\.jpg$/, roh)
    }
  })

  test('die vier alten Pfade mit der Endung .jpg werden genau, nie als Muster, auf die korrigierten .png-Dateien abgebildet', () => {
    assert.deepEqual({ ...LEGACY_BILDPFADE }, ALTE_PFADE)
    for (const [alt, neu] of Object.entries(ALTE_PFADE)) {
      assert.equal(aktuellerBildpfad(alt), neu, alt)
      assert.equal(aktuellerBildpfad(neu), neu, neu)
      assert.ok(!existsSync(join(WURZEL, 'public', alt)), `${alt} wird nicht mehr als Datei ausgeliefert`)
      assert.ok(existsSync(join(WURZEL, 'public', neu)), neu)
    }
    for (const fremd of ['/images/unbekannt.jpg', '/images/bali.jpeg', '/images/Bali.jpg', '/images/hero-bali.jpg', '__proto__', 'hasOwnProperty', '']) {
      assert.equal(aktuellerBildpfad(fremd), fremd, fremd)
    }
    const code = readFileSync(join(WURZEL, 'lib/inspiration/bildfreigabe.ts'), 'utf8')
      .split('\n').filter((zeile) => !zeile.trim().startsWith('//')).join('\n')
    assert.doesNotMatch(code, /replace\(|RegExp|\.test\(|\.match\(|\.jpg/)
  })

  test('die Reiseideen zeigen über ihre unveränderte CMS-Referenz die korrigierte Datei; Zermatt bleibt neutral', () => {
    for (const ziel of INSPIRATION_ZIELE) {
      const bild = inspirationsbild(ziel.image)
      if (ziel.name === 'Zermatt') {
        assert.equal(bild.src, NEUTRALES_REISEBILD)
        assert.equal(bild.neutral, true)
      } else {
        assert.equal(bild.src, ALTE_PFADE[ziel.image as keyof typeof ALTE_PFADE], ziel.name)
        assert.equal(bild.neutral, false)
      }
    }
  })

  test('die CMS-Identität bleibt unverändert: persistierte Referenz mit der redaktionellen Kennung und dem alten Bildpfad', () => {
    assert.deepEqual(
      INSPIRATION_ZIELE.map((ziel) => [ziel.placeId, ziel.image]),
      [
        ['geonames:1650535', '/images/bali.jpg'],
        ['geonames:2267057', '/images/lisbon.jpg'],
        ['geonames:2657915', '/images/zermatt.jpg'],
        ['geonames:2759794', '/images/amsterdam.jpg'],
      ],
    )
    assert.deepEqual(cmsReference('geonames:2657915'), {
      entryId: 'geonames:2657915', locale: 'de', name: 'Zermatt', country: 'Schweiz', image: '/images/zermatt.jpg',
    })
    assert.deepEqual(cmsReference('geonames:1650535'), {
      entryId: 'geonames:1650535', locale: 'de', name: 'Bali', country: 'Indonesien', image: '/images/bali.jpg',
    })
    assert.equal(cmsReference('geonames:2657928'), null, 'die Zielkennung ist kein CMS-Eintrag')
  })

  test('redaktionelle Kennung und Planungsziel von Zermatt sind getrennt, die Kennungen werden nicht gleichgesetzt', () => {
    const reiseidee = INSPIRATION_ZIELE.find((ziel) => ziel.name === 'Zermatt')!
    assert.equal(reiseidee.placeId, 'geonames:2657915')
    assert.equal(reiseidee.zielId, 'geonames:2657928')
    for (const ziel of INSPIRATION_ZIELE.filter((eintrag) => eintrag.name !== 'Zermatt')) assert.equal(ziel.zielId, ziel.placeId, ziel.name)
    const katalogZermatt = { name: 'Zermatt', countryCode: 'CH', placeId: reiseidee.zielId }
    assert.equal(reisebildAusEtappe(katalogZermatt), '/images/organisieren/zermatt-commons.jpg')
    const altkennungAlsEtappe = { name: 'Zermatt', countryCode: 'CH', placeId: reiseidee.placeId }
    assert.equal(reisebildAusEtappe(altkennungAlsEtappe), '/images/organisieren/reiseatlas.webp')
    assert.equal(reisebildAusEtappe({ name: 'Zofingen', countryCode: 'CH', placeId: 'geonames:2657915' }), '/images/organisieren/reiseatlas.webp')
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
    for (const datei of ['/images/bali.png', '/images/lisbon.png', '/images/amsterdam.png']) assert.ok(html.includes(kodiert(datei)), `${status} ${datei}`)
    for (const alt of Object.keys(ALTE_PFADE)) assert.ok(!html.includes(kodiert(alt)), `${status} der alte Pfad ${alt} wird nicht angefragt`)
    assert.ok(html.includes(kodiert(NEUTRALES_REISEBILD)), `${status} Zermatt neutral`)
    assert.doesNotMatch(html, /zermatt[\w-]*\.(?:jpg|png)/, status)
    assert.doesNotMatch(html, /hero-bali(?:-og)?\.(?:png|jpg)/, status)
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
    assert.match(TEILENBILD.alt, /KI-Illustration/)
    assert.doesNotMatch(`${STARTSEITENBILD.alt} ${TEILENBILD.alt}`, /Foto|Aufnahme/)
  })

  test('das sichtbare Hero-Bild bleibt das unveränderte Original und wird nie durch das kleinere Vorschaubild ersetzt', () => {
    assert.equal(STARTSEITENBILD.pfad, '/images/hero-bali.png')
    assert.notEqual(STARTSEITENBILD.pfad, TEILENBILD.pfad)
    assert.equal(sha256(STARTSEITENBILD.pfad), '0d8aa8603c674211691e491ed39820b94a0a358c03f852f8bfa2f27bf165ee45')
    assert.equal(statSync(join(WURZEL, 'public', STARTSEITENBILD.pfad)).size, 2_382_129)
    assert.equal(TEILENBILD.quelle, STARTSEITENBILD.pfad)
    const hero = readFileSync(join(WURZEL, 'components/home/HomeHero.tsx'), 'utf8')
    assert.doesNotMatch(hero, /TEILENBILD|hero-bali-og/)
  })

  test('Open Graph und Twitter nutzen den wahren Alt-Text aus dem zentralen Bild, in allen drei Metadaten-Quellen', () => {
    for (const datei of ['app/layout.tsx', 'app/(public)/layout.tsx', 'app/(public)/page.tsx']) {
      const quelle = readFileSync(join(WURZEL, datei), 'utf8')
      assert.match(quelle, /alt: TEILENBILD\.alt/, datei)
      assert.match(quelle, /TEILENBILD\.pfad/, datei)
      if (datei.endsWith('layout.tsx')) assert.doesNotMatch(quelle, /STARTSEITENBILD/, `${datei}: Open Graph und Twitter nutzen nur das Vorschaubild`)
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
    assert.equal(bildobjekt.url, `https://jetnity.com${TEILENBILD.pfad}`)
    assert.equal(bildobjekt.encodingFormat, 'image/jpeg')
    assert.equal(bildobjekt.width, TEILENBILD.breite)
    assert.equal(bildobjekt.height, TEILENBILD.hoehe)
    assert.equal(bildobjekt.caption, STARTSEITENBILD.alt)
    assert.equal(bildobjekt.creditText, KI_URHEBER)
    assert.doesNotMatch(roh, /"photo"|Photograph|Foto|Aufnahme/)
    assert.doesNotMatch(roh.replace(TEILENBILD.pfad, ''), MUSTER)
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
    const illustration = renderToStaticMarkup(createElement(BildnachweisKnopf, { nachweis: illustrationsnachweisFuerDatei('/images/lisbon.png')! }))
    assert.match(illustration, /Bildnachweis zur Illustration/)
    assert.ok(illustration.includes(KI_URHEBER))
    assert.doesNotMatch(illustration, /Bildnachweis zum Foto/)
    const foto = renderToStaticMarkup(createElement(BildnachweisKnopf, { nachweis: bildnachweisFuerDatei('/images/organisieren/paris.jpg')! }))
    assert.match(foto, /Bildnachweis zum Foto/)
  })

  test('Datenquellen: alle fünf Illustrationen und das Vorschaubild mit Herkunft, Bedingungen und Prüfsumme, nur Zermatt zurückgehalten', () => {
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
    assert.match(html, /data-illustration="\/images\/zermatt\.png"[\s\S]*?Derzeit nicht im Einsatz/)
    for (const [alt, neu] of Object.entries(ALTE_PFADE)) {
      assert.ok(html.includes(`Früherer Dateiname: ${alt}`), alt)
      assert.ok(html.includes(neu), neu)
    }
    assert.equal(zaehle(html, /Früherer Dateiname:/g), 4)
    assert.ok(html.includes(KI_VORSCHAUBILD.bildtitel))
    assert.ok(html.includes(KI_VORSCHAUBILD.herkunft.sha256))
    assert.ok(html.includes('kein neues Original'))
    assert.ok(html.includes('kein C2PA-Manifest'))
    assert.ok(html.includes('nicht unabhängig C2PA-verifiziert'))
  })
})

const PNG_SIGNATUR = Buffer.from([0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a])
const JPEG_SIGNATUR = Buffer.from([0xff, 0xd8, 0xff])

function pngAbmessungen(bild: Buffer) {
  assert.ok(bild.subarray(0, 8).equals(PNG_SIGNATUR), 'keine PNG-Signatur')
  assert.equal(bild.subarray(12, 16).toString('latin1'), 'IHDR')
  return { breite: bild.readUInt32BE(16), hoehe: bild.readUInt32BE(20) }
}

function jpegAbmessungen(bild: Buffer) {
  assert.ok(bild.subarray(0, 3).equals(JPEG_SIGNATUR), 'keine JPEG-Signatur')
  let offset = 2
  while (offset + 9 < bild.length) {
    assert.equal(bild[offset], 0xff, `JPEG-Marker bei ${offset}`)
    const marker = bild[offset + 1]!
    if (marker >= 0xc0 && marker <= 0xcf && ![0xc4, 0xc8, 0xcc].includes(marker)) {
      return { hoehe: bild.readUInt16BE(offset + 5), breite: bild.readUInt16BE(offset + 7), baseline: marker === 0xc0 }
    }
    offset += 2 + bild.readUInt16BE(offset + 2)
  }
  throw new Error('JPEG ohne Bildrahmen')
}

function rasterbilder(ordner: string): string[] {
  const treffer: string[] = []
  for (const eintrag of readdirSync(join(WURZEL, ordner))) {
    const pfad = join(ordner, eintrag)
    if (statSync(join(WURZEL, pfad)).isDirectory()) treffer.push(...rasterbilder(pfad))
    else if (/\.(?:png|jpe?g|webp)$/i.test(eintrag)) treffer.push(pfad)
  }
  return treffer
}

describe('Bilddateien: Endung und Inhalt stimmen überein, das Vorschaubild ist ein belegtes JPEG', () => {
  test('keine ausgelieferte Rasterdatei trägt eine Endung, die nicht zu ihrem Inhalt passt', () => {
    const dateien = rasterbilder('public')
    assert.ok(dateien.length >= 30)
    const falsch: string[] = []
    for (const datei of dateien) {
      const bild = readFileSync(join(WURZEL, datei))
      const endung = datei.slice(datei.lastIndexOf('.') + 1).toLowerCase()
      const passt = endung === 'png' ? bild.subarray(0, 8).equals(PNG_SIGNATUR)
        : endung === 'webp' ? bild.subarray(0, 4).toString('latin1') === 'RIFF' && bild.subarray(8, 12).toString('latin1') === 'WEBP'
        : bild.subarray(0, 3).equals(JPEG_SIGNATUR)
      if (!passt) falsch.push(datei)
    }
    assert.deepEqual(falsch, [])
  })

  test('die vier umbenannten Dateien sind PNG-Daten, byteidentisch zum früheren Stand (gleiche Prüfsumme, früherer Name belegt)', () => {
    for (const [alt, neu] of Object.entries(ALTE_PFADE)) {
      const eintrag = KI_ILLUSTRATIONEN.find((kandidat) => kandidat.datei === neu)!
      assert.equal(eintrag.herkunft.fruehererPfad, alt)
      const bild = readFileSync(join(WURZEL, 'public', neu))
      assert.ok(bild.subarray(0, 8).equals(PNG_SIGNATUR), neu)
      assert.equal(createHash('sha256').update(bild).digest('hex'), eintrag.herkunft.sha256, neu)
      assert.match(eintrag.bearbeitung, /byteidentisch/, neu)
    }
    const erwartet: Record<string, string> = {
      '/images/bali.png': '86acf2c0201f65967c6d800dbcf9c498f23a716674f4ec661c25632850d60f07',
      '/images/lisbon.png': 'e8f4f66ba68d75995c7ef053874d8b4f23aff7d9cec66bdff8f0b994f79070c3',
      '/images/zermatt.png': '0720951b5a7e57451184a56c8bce5ca223b59cff4262bf753ca67eceb69192bc',
      '/images/amsterdam.png': '02462fc4943b1b77034c24837541a6f9150697fde75ac9d76b80397b21bfb122',
    }
    for (const [datei, hash] of Object.entries(erwartet)) assert.equal(sha256(datei), hash, datei)
    assert.equal(KI_ILLUSTRATIONEN.filter((eintrag) => eintrag.herkunft.fruehererPfad).length, 4)
    assert.equal(KI_ILLUSTRATIONEN.find((eintrag) => eintrag.datei === '/images/hero-bali.png')!.herkunft.fruehererPfad, undefined)
  })

  test('das Vorschaubild ist ein echtes JPEG, 1200 × 630 px, unter 300 KB, und an seine Quelle und Prüfsumme gebunden', () => {
    const bild = readFileSync(join(WURZEL, 'public', TEILENBILD.pfad))
    assert.equal(TEILENBILD.pfad.endsWith('.jpg'), true)
    assert.equal(TEILENBILD.mime, 'image/jpeg')
    const echt = jpegAbmessungen(bild)
    assert.equal(echt.breite, 1200)
    assert.equal(echt.hoehe, 630)
    assert.equal(echt.breite, TEILENBILD.breite)
    assert.equal(echt.hoehe, TEILENBILD.hoehe)
    assert.equal(echt.baseline, true, 'Baseline-JPEG: von allen Vorschau-Abrufern lesbar')
    assert.ok(bild.length < 300_000, `${bild.length} Bytes`)
    const ableitung = KI_VORSCHAUBILD.herkunft.ableitung!
    assert.equal(ableitung.bytes, bild.length)
    assert.equal(ableitung.breite, echt.breite)
    assert.equal(ableitung.hoehe, echt.hoehe)
    assert.equal(ableitung.mime, TEILENBILD.mime)
    assert.equal(KI_VORSCHAUBILD.herkunft.sha256, createHash('sha256').update(bild).digest('hex'))
    assert.equal(ableitung.quelle, STARTSEITENBILD.pfad)
    assert.equal(ableitung.quelleSha256, sha256(STARTSEITENBILD.pfad))
    assert.equal(KI_VORSCHAUBILD.herkunft.sha256 === ableitung.quelleSha256, false, 'eine Ableitung ist nicht ihr Original')
    const original = pngAbmessungen(readFileSync(join(WURZEL, 'public', STARTSEITENBILD.pfad)))
    assert.deepEqual(original, { breite: STARTSEITENBILD.breite, hoehe: STARTSEITENBILD.hoehe })
  })

  test('das Vorschaubild gibt sich weder als Original noch als C2PA-verifiziert aus und trägt keine Metadaten', () => {
    const bild = readFileSync(join(WURZEL, 'public', TEILENBILD.pfad))
    const text = bild.toString('latin1')
    assert.doesNotMatch(text, /c2pa|jumb|Exif|http:\/\/ns\.adobe\.com/i)
    assert.match(KI_VORSCHAUBILD.herkunft.binaerhinweis, /kein neues Original/)
    assert.match(KI_VORSCHAUBILD.herkunft.binaerhinweis, /kein C2PA-Manifest/)
    assert.match(KI_VORSCHAUBILD.herkunft.binaerhinweis, /nicht unabhängig C2PA-verifiziert/)
    assert.doesNotMatch(KI_VORSCHAUBILD.herkunft.binaerhinweis, /Manifest stimmt|gültig verifiziert/)
    assert.match(KI_VORSCHAUBILD.bearbeitung, /Original ist unverändert/)
    assert.match(KI_VORSCHAUBILD.bildbeschreibung, /^KI-Illustration: /)
    assert.equal(KI_VORSCHAUBILD.urheber, KI_URHEBER)
    assert.equal(KI_VORSCHAUBILD.quelleUrl, null)
    assert.equal(VORSCHAUBILD_DATEI, TEILENBILD.pfad)
  })
})
