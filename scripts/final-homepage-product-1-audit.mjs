#!/usr/bin/env node
// scripts/final-homepage-product-1-audit.mjs
//
// Statischer Vertrag der finalen Startseite.
// Mit AUDIT_BROWSER=1 zusätzlich DOM, Overflow, Konsole und Netzwerk gegen AUDIT_BASE.

import { readFileSync, writeFileSync, mkdirSync } from 'node:fs'
import { dirname, join } from 'node:path'
import { fileURLToPath } from 'node:url'

const hier = dirname(fileURLToPath(import.meta.url))
const wurzel = join(hier, '..')
const dateien = [
  'app/(public)/page.tsx',
  'lib/seo/final-homepage.ts',
  'components/home/HomeHero.tsx',
  'components/home/HomeWerkzeuge.tsx',
  'components/home/HomeProduktfenster.tsx',
  'components/home/HomeBegleitung.tsx',
  'components/home/HomeUnterschied.tsx',
  'components/home/HomeInspiration.tsx',
  'components/home/HomeVertrauen.tsx',
]

const texte = dateien.map((pfad) => readFileSync(join(wurzel, pfad), 'utf8')).join('\n')
const oberflaeche = dateien
  .filter((pfad) => pfad !== 'lib/seo/final-homepage.ts')
  .map((pfad) => readFileSync(join(wurzel, pfad), 'utf8'))
  .join('\n')
const fehler = []

function braucht(text, grund) {
  if (!texte.includes(text)) fehler.push(`fehlt: ${grund}: ${text}`)
}

function verboten(muster, grund) {
  if (muster.test(oberflaeche)) fehler.push(`verboten: ${grund}`)
}

braucht('Deine ganze Reise. Intelligent an einem Ort.', 'H1')
braucht('Eine Reise statt fünf getrennte Tools', 'Werkzeuge')
braucht('So begleitet Jetnity deine Reise', 'Begleitung')
braucht('Warum Jetnity anders ist', 'Unterschied')
braucht('Deine Reise. Deine Entscheidungen.', 'Vertrauen')
braucht('Reise starten', 'Abschluss-CTA')
braucht('In Vorbereitung', 'geplante Fähigkeit')
braucht('Kommt später', 'geplante Fähigkeit')
braucht('Produktvorschau', 'Vorschau')
braucht('Heute nutzbar', 'live Fähigkeit')
braucht('Übersicht', 'Arbeitsbereich Übersicht')
braucht('Reiseplan', 'Arbeitsbereich Reiseplan')
braucht('Organisieren', 'Arbeitsbereich Organisieren')
braucht('Vorbereitung', 'Arbeitsbereich Vorbereitung')
braucht('Jetzt wichtig', 'Jetzt wichtig')
braucht('id="entdecken"', 'Navbar-Anker Entdecken')
braucht("id={faehigkeit.id === 'jetnity-pro' ? 'pro' : undefined}", 'Navbar-Anker Pro')
braucht('GastCreateLink', 'bestehender Create-Einstieg')
braucht('zielHref', 'bestehender Ziel-Handoff')
braucht("url: kanonischeUrl('/')", 'kanonische URL im JSON-LD-Aufruf')
const inspiration = readFileSync(join(wurzel, 'lib/places/inspiration.ts'), 'utf8')
if (!inspiration.includes('geonames:1650535')) fehler.push('fehlt: Bali-Place-ID')
if (!inspiration.includes('geonames:2267057')) fehler.push('fehlt: Lissabon-Place-ID')
if (!inspiration.includes('geonames:2657915')) fehler.push('fehlt: Zermatt-Place-ID')
if (!inspiration.includes('geonames:2759794')) fehler.push('fehlt: Amsterdam-Place-ID')
braucht('@type\': \'Organization\'', 'Organization')
braucht('@type\': \'WebSite\'', 'WebSite')
braucht('@type\': \'SoftwareApplication\'', 'SoftwareApplication')

verboten(/\bindex:\s*true\b/, 'öffentliche Indexfreigabe')
verboten(/sameAs|aggregateRating|reviewCount|"offers"|"award"/, 'erfundene Entity-Signale')
verboten(/\d+\s*(CHF|EUR|€|\$)/, 'Preisangabe')
verboten(/llms\.txt/, 'llms.txt')
verboten(/gtag|googletagmanager|facebook\.net|pixel/i, 'Tracking')

const indexing = ['lib/seo/index-grenze.ts', 'lib/seo/oeffentlicher-origin.ts', 'app/robots.ts']
for (const pfad of indexing) {
  const aktuell = readFileSync(join(wurzel, pfad), 'utf8')
  if (!aktuell.includes('darfIndexieren') && pfad.endsWith('oeffentlicher-origin.ts')) {
    fehler.push(`Indexing-Gate fehlt in ${pfad}`)
  }
}

const bericht = {
  stand: new Date().toISOString(),
  dateien,
  fehler,
  ergebnis: fehler.length === 0 ? 'PASS' : 'FAIL',
}

if (process.env.AUDIT_BROWSER === '1') {
  const { chromium } = await import('playwright')
  const basis = process.env.AUDIT_BASE || 'http://127.0.0.1:3000'
  const evidenz = process.env.AUDIT_EVIDENCE_DIR || join(wurzel, 'docs/evidence/final-homepage-product-1/after')
  mkdirSync(evidenz, { recursive: true })
  const viewports = [
    { name: '360x800', width: 360, height: 800 },
    { name: '390x844', width: 390, height: 844 },
    { name: '768x1024', width: 768, height: 1024 },
    { name: '1024x768', width: 1024, height: 768 },
    { name: '1280x800', width: 1280, height: 800 },
    { name: '1440x900', width: 1440, height: 900 },
    { name: '1920x1080', width: 1920, height: 1080 },
  ]
  const browser = await chromium.launch({ headless: true })
  const erlaubteHerkunft = new URL(basis).origin
  const laeufe = []
  const text200 = process.env.AUDIT_TEXT_200 === '1'
  const durchlaeufe = text200
    ? [...viewports, { name: 'text-200-360x800', width: 360, height: 800, text200: true }]
    : viewports
  for (const vp of durchlaeufe) {
    const page = await browser.newPage({ viewport: { width: vp.width, height: vp.height } })
    const konsole = []
    const seitenfehler = []
    const herkuenfte = new Set()
    page.on('console', (msg) => {
      if (msg.type() === 'error') konsole.push(msg.text())
    })
    page.on('pageerror', (err) => {
      seitenfehler.push(err.message)
    })
    page.on('request', (req) => {
      try {
        herkuenfte.add(new URL(req.url()).origin)
      } catch {
        /* ungültige URL */
      }
    })
    if (vp.text200) {
      await page.addInitScript(() => {
        const stil = document.createElement('style')
        stil.textContent = 'html { font-size: 32px !important; }'
        document.documentElement.appendChild(stil)
      })
    }
    const antwort = await page.goto(`${basis}/`, { waitUntil: 'networkidle', timeout: 60000 })
    const dom = await page.evaluate(() => {
      const doc = document.documentElement
      const form = document.querySelector('form')
      const kasten = form?.getBoundingClientRect()
      const graph = document.querySelector('script[type="application/ld+json"]')?.textContent ?? ''
      const robots = document.querySelector('meta[name="robots"]')?.getAttribute('content')
      const input = document.querySelector('#travel-idea')
      const knopf = document.querySelector('form button[type="submit"]')
      function gebrocheneWoerter(selektor) {
        const el = document.querySelector(selektor)
        if (!el) return ['fehlt']
        const gebrochen = []
        const walker = document.createTreeWalker(el, NodeFilter.SHOW_TEXT)
        let knoten = walker.nextNode()
        while (knoten) {
          const wert = knoten.textContent ?? ''
          const muster = /\S+/g
          let treffer = muster.exec(wert)
          while (treffer) {
            const range = document.createRange()
            range.setStart(knoten, treffer.index)
            range.setEnd(knoten, treffer.index + treffer[0].length)
            if (range.getClientRects().length > 1) gebrochen.push(treffer[0])
            treffer = muster.exec(wert)
          }
          knoten = walker.nextNode()
        }
        return gebrochen
      }
      const text = document.body.innerText
      return {
        overflow: doc.scrollWidth > doc.clientWidth + 1,
        scrollWidth: doc.scrollWidth,
        clientWidth: doc.clientWidth,
        h1: document.querySelector('h1')?.textContent?.trim() ?? '',
        title: document.title,
        canonical: document.querySelector('link[rel="canonical"]')?.getAttribute('href'),
        robots,
        definition: text.includes('Jetnity ist eine Reiseplanungs- und Reisebegleitungsplattform.'),
        modi: ['Übersicht', 'Reiseplan', 'Organisieren', 'Vorbereitung'].every((name) => text.includes(name)),
        produktvorschau: text.includes('Produktvorschau'),
        formSichtbar: Boolean(kasten && kasten.top < window.innerHeight && kasten.bottom > 80),
        formBottom: kasten ? Math.round(kasten.bottom) : null,
        eingabePx: input ? Number.parseFloat(getComputedStyle(input).fontSize) : 0,
        knopfPx: knopf ? knopf.getBoundingClientRect().height : 0,
        gebrochenH1: gebrocheneWoerter('h1'),
        gebrochenAugenbraue: gebrocheneWoerter('section[aria-labelledby="start-titel"] p'),
        cta: text.includes('Reise starten'),
        graph,
      }
    })
    if (dom.h1 !== 'Deine ganze Reise. Intelligent an einem Ort.') fehler.push(`${vp.name}: H1`)
    if (!dom.definition) fehler.push(`${vp.name}: Definition fehlt`)
    if (!vp.text200 && !dom.formSichtbar) fehler.push(`${vp.name}: Formular nicht im ersten Viewport`)
    if (!dom.modi) fehler.push(`${vp.name}: Arbeitsbereiche fehlen`)
    if (!dom.produktvorschau) fehler.push(`${vp.name}: Produktvorschau fehlt`)
    if (dom.overflow) fehler.push(`${vp.name}: horizontaler Overflow ${dom.scrollWidth}/${dom.clientWidth}`)
    if (dom.eingabePx < 16) fehler.push(`${vp.name}: Eingabe ${dom.eingabePx}px`)
    if (dom.knopfPx < 44) fehler.push(`${vp.name}: Knopf ${dom.knopfPx}px`)
    if (dom.gebrochenH1.length) fehler.push(`${vp.name}: H1 mitten im Wort ${dom.gebrochenH1.join(', ')}`)
    if (dom.gebrochenAugenbraue.length) {
      fehler.push(`${vp.name}: Augenbraue mitten im Wort ${dom.gebrochenAugenbraue.join(', ')}`)
    }
    if (dom.canonical !== 'https://jetnity.com/' && dom.canonical !== 'https://jetnity.com') {
      fehler.push(`${vp.name}: Canonical ${dom.canonical}`)
    }
    if (!dom.graph.includes('Organization') || !dom.graph.includes('WebSite')) {
      fehler.push(`${vp.name}: JSON-LD unvollständig`)
    }
    if (dom.robots && /index/i.test(dom.robots) && !/noindex/i.test(dom.robots)) {
      fehler.push(`${vp.name}: robots erlaubt Index ${dom.robots}`)
    }
    if (konsole.length) fehler.push(`${vp.name}: Konsole ${konsole.join(' | ')}`)
    if (seitenfehler.length) fehler.push(`${vp.name}: Laufzeit ${seitenfehler.join(' | ')}`)
    for (const herkunft of herkuenfte) {
      if (herkunft !== erlaubteHerkunft) fehler.push(`${vp.name}: unerwartete Herkunft ${herkunft}`)
    }
    await page.screenshot({ path: join(evidenz, `first-${vp.name}.png`) })
    await page.screenshot({ path: join(evidenz, `full-${vp.name}.png`), fullPage: true })
    laeufe.push({
      ...vp,
      status: antwort?.status() ?? null,
      dom,
      konsole,
      seitenfehler,
      herkuenfte: [...herkuenfte],
    })
    await page.close()
  }
  await browser.close()
  bericht.browser = laeufe
}

bericht.ergebnis = fehler.length === 0 ? 'PASS' : 'FAIL'
bericht.fehler = fehler
const ziel = process.env.AUDIT_REPORT || join(wurzel, 'docs/evidence/final-homepage-product-1/audit.json')
mkdirSync(dirname(ziel), { recursive: true })
writeFileSync(ziel, JSON.stringify(bericht, null, 2))
console.log(bericht.ergebnis)
if (fehler.length) {
  for (const eintrag of fehler) console.error(eintrag)
  process.exit(1)
}
