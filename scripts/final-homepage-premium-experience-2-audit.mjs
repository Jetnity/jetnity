#!/usr/bin/env node
// scripts/final-homepage-premium-experience-2-audit.mjs
//
// Statischer Vertrag und, mit AUDIT_BROWSER=1, Produktionsnachweis der
// Premium-Startseite. Start: node scripts/final-homepage-premium-experience-2-audit.mjs

import { mkdirSync, readFileSync, writeFileSync } from 'node:fs'
import { dirname, join } from 'node:path'
import { fileURLToPath } from 'node:url'

const hierFrueh = dirname(fileURLToPath(import.meta.url))
const faehigkeitsQuelle = readFileSync(join(hierFrueh, '../lib/seo/final-homepage.ts'), 'utf8')
const faehigkeitsBlock = faehigkeitsQuelle.slice(
  faehigkeitsQuelle.indexOf('export const HOMEPAGE_FAEHIGKEITEN'),
  faehigkeitsQuelle.indexOf('] as const satisfies'),
)
const HOMEPAGE_FAEHIGKEITEN = [...faehigkeitsBlock.matchAll(/id: '([^']+)',\s*stand: '[^']+',\s*titel: '([^']+)',\s*text: '([^']+)'/g)].map(
  (treffer) => ({ id: treffer[1], titel: treffer[2], text: treffer[3] }),
)
if (HOMEPAGE_FAEHIGKEITEN.length !== 9) {
  console.error(`Fähigkeiten nicht lesbar: ${HOMEPAGE_FAEHIGKEITEN.length}`)
  process.exit(1)
}

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
const vertrauen = readFileSync(join(wurzel, 'components/home/HomeVertrauen.tsx'), 'utf8')
const werkzeuge = readFileSync(join(wurzel, 'components/home/HomeWerkzeuge.tsx'), 'utf8')
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
braucht('Beispielroute', 'Beispielroute')
braucht('Lissabon', 'Lissabon')
braucht('Porto', 'Porto')
braucht('<details', 'natives Disclosure')
braucht('<summary', 'Disclosure-Zusammenfassung')
braucht('Was heute gilt', 'Fähigkeitsstand')
braucht('id="entdecken"', 'Navbar-Anker Entdecken')
braucht("id={faehigkeit.id === 'jetnity-pro' ? 'pro' : undefined}", 'Navbar-Anker Pro')
braucht('GastCreateLink', 'bestehender Create-Einstieg')
braucht('zielHref', 'bestehender Ziel-Handoff')
braucht("url: kanonischeUrl('/')", 'kanonische URL im JSON-LD-Aufruf')
braucht('Alles bleibt an derselben Reise.', 'verbundener Reisezusammenhang')

if (!vertrauen.includes('HOMEPAGE_FAEHIGKEITEN')) fehler.push('fehlt: Fähigkeitsliste in HomeVertrauen')
if (vertrauen.includes('sr-only') || vertrauen.includes('display:none')) {
  fehler.push('verboten: Fähigkeitswortlaut versteckt')
}
if (werkzeuge.includes('lg:grid-cols-3')) fehler.push('verboten: 3-Spalten-Matrix der Werkzeuge')

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

const bericht = {
  stand: new Date().toISOString(),
  dateien,
  fehler: [...fehler],
  ergebnis: fehler.length === 0 ? 'PASS' : 'FAIL',
}

if (process.env.AUDIT_BROWSER === '1') {
  const { chromium } = await import('playwright')
  const basis = process.env.AUDIT_BASE || 'http://127.0.0.1:3456'
  const evidenz = process.env.AUDIT_EVIDENCE_DIR || join(wurzel, 'docs/evidence/final-homepage-premium-experience-2/after')
  mkdirSync(evidenz, { recursive: true })
  const browser = await chromium.launch({
    headless: true,
    executablePath: process.env.CHROME_PATH || '/opt/google/chrome/chrome',
    args: ['--no-sandbox', '--disable-dev-shm-usage'],
  })
  const erlaubteHerkunft = new URL(basis).origin
  const html = await fetch(`${basis}/`).then((antwort) => antwort.text())
  bericht.serverHtml = {
    details: html.includes('<details'),
    summary: html.includes('<summary'),
    faehigkeiten: HOMEPAGE_FAEHIGKEITEN.map((eintrag) => ({
      id: eintrag.id,
      text: html.includes(eintrag.text),
      titel: html.includes(eintrag.titel),
    })),
    canonical: html.includes('https://jetnity.com/'),
    noindex: /noindex/i.test(html),
    anmelden: html.includes('Anmelden'),
    abmelden: html.includes('Abmelden'),
  }
  for (const eintrag of bericht.serverHtml.faehigkeiten) {
    if (!eintrag.text || !eintrag.titel) fehler.push(`Server-HTML ohne Fähigkeit ${eintrag.id}`)
  }
  if (!bericht.serverHtml.details) fehler.push('Server-HTML ohne details')
  if (bericht.serverHtml.anmelden || bericht.serverHtml.abmelden) {
    fehler.push('Server-HTML behauptet schon eine Sitzung')
  }

  async function messen(page) {
    return page.evaluate(() => {
      const doc = document.documentElement
      const text = document.body.innerText
      const graph = document.querySelector('script[type="application/ld+json"]')?.textContent ?? ''
      const input = document.querySelector('#travel-idea')
      const knopf = document.querySelector('form button[type="submit"]')
      const summary = document.querySelector('details summary')
      function gebrochen(selektor) {
        const el = document.querySelector(selektor)
        if (!el) return ['fehlt']
        const trefferListe = []
        const walker = document.createTreeWalker(el, NodeFilter.SHOW_TEXT)
        let knoten = walker.nextNode()
        while (knoten) {
          const muster = /\S+/g
          let treffer = muster.exec(knoten.textContent ?? '')
          while (treffer) {
            const range = document.createRange()
            range.setStart(knoten, treffer.index)
            range.setEnd(knoten, treffer.index + treffer[0].length)
            if (range.getClientRects().length > 1) trefferListe.push(treffer[0])
            treffer = muster.exec(knoten.textContent ?? '')
          }
          knoten = walker.nextNode()
        }
        return trefferListe
      }
      return {
        overflow: doc.scrollWidth > doc.clientWidth + 1,
        scrollWidth: doc.scrollWidth,
        clientWidth: doc.clientWidth,
        h1: document.querySelector('h1')?.textContent?.trim() ?? '',
        h1Count: document.querySelectorAll('h1').length,
        canonical: document.querySelector('link[rel="canonical"]')?.getAttribute('href'),
        robots: document.querySelector('meta[name="robots"]')?.getAttribute('content'),
        definition: text.includes('Jetnity plant und begleitet deine Reise an einem Ort.'),
        produktvorschau: text.includes('Produktvorschau'),
        modi: ['Übersicht', 'Reiseplan', 'Organisieren', 'Vorbereitung'].every((name) => text.includes(name)),
        route: text.includes('Lissabon') && text.includes('Porto'),
        formSichtbar: (() => {
          const kasten = document.querySelector('form')?.getBoundingClientRect()
          return Boolean(kasten && kasten.top < window.innerHeight && kasten.bottom > 80)
        })(),
        eingabePx: input ? Number.parseFloat(getComputedStyle(input).fontSize) : 0,
        knopfPx: knopf ? knopf.getBoundingClientRect().height : 0,
        summaryPx: summary ? summary.getBoundingClientRect().height : 0,
        gebrochenH1: gebrochen('h1'),
        gebrochenDefinition: (() => {
          const el = [...document.querySelectorAll('section[aria-labelledby="start-titel"] p')].find((knoten) =>
            (knoten.textContent ?? '').includes('Jetnity plant'),
          )
          if (!el) return ['fehlt']
          const trefferListe = []
          const walker = document.createTreeWalker(el, NodeFilter.SHOW_TEXT)
          let knoten = walker.nextNode()
          while (knoten) {
            const muster = /\S+/g
            let treffer = muster.exec(knoten.textContent ?? '')
            while (treffer) {
              const range = document.createRange()
              range.setStart(knoten, treffer.index)
              range.setEnd(knoten, treffer.index + treffer[0].length)
              if (range.getClientRects().length > 1) trefferListe.push(treffer[0])
              treffer = muster.exec(knoten.textContent ?? '')
            }
            knoten = walker.nextNode()
          }
          return trefferListe
        })(),
        graph,
        detailsOffen: document.querySelector('details')?.open ?? null,
      }
    })
  }

  function pruefe(name, dom, optionen = {}) {
    if (dom.h1 !== 'Deine ganze Reise. Intelligent an einem Ort.' || dom.h1Count !== 1) fehler.push(`${name}: H1`)
    if (!dom.definition) fehler.push(`${name}: Definition fehlt`)
    if (!optionen.text200 && !dom.formSichtbar) fehler.push(`${name}: Formular nicht im ersten Viewport`)
    if (!dom.modi) fehler.push(`${name}: Arbeitsbereiche fehlen`)
    if (!dom.produktvorschau) fehler.push(`${name}: Produktvorschau fehlt`)
    if (!dom.route) fehler.push(`${name}: Beispielroute fehlt`)
    if (dom.overflow) fehler.push(`${name}: horizontaler Overflow ${dom.scrollWidth}/${dom.clientWidth}`)
    if (dom.eingabePx < 16) fehler.push(`${name}: Eingabe ${dom.eingabePx}px`)
    if (dom.knopfPx < 44) fehler.push(`${name}: Knopf ${dom.knopfPx}px`)
    if (dom.summaryPx < 44) fehler.push(`${name}: Disclosure ${dom.summaryPx}px`)
    if (dom.gebrochenH1.length) fehler.push(`${name}: H1 mitten im Wort ${dom.gebrochenH1.join(', ')}`)
    const definition = (dom.gebrochenDefinition ?? []).filter((wort) => wort.length > 2)
    if (definition.length) fehler.push(`${name}: Definition mitten im Wort ${definition.join(', ')}`)
    if (dom.canonical !== 'https://jetnity.com/' && dom.canonical !== 'https://jetnity.com') {
      fehler.push(`${name}: Canonical ${dom.canonical}`)
    }
    if (!dom.graph.includes('Organization') || !dom.graph.includes('WebSite') || !dom.graph.includes('SoftwareApplication')) {
      fehler.push(`${name}: JSON-LD unvollständig`)
    }
    if (dom.robots && /(?<!no)index/i.test(dom.robots)) fehler.push(`${name}: robots erlaubt Index ${dom.robots}`)
  }

  const viewports = [
    { name: '360x800', width: 360, height: 800 },
    { name: '390x844', width: 390, height: 844 },
    { name: '768x1024', width: 768, height: 1024 },
    { name: '1024x768', width: 1024, height: 768 },
    { name: '1280x800', width: 1280, height: 800 },
    { name: '1440x900', width: 1440, height: 900 },
    { name: '1920x1080', width: 1920, height: 1080 },
  ]
  const abschnitte = {
    system: 'section[aria-labelledby="werkzeuge-titel"]',
    produkt: 'section[aria-labelledby="produktfenster-titel"]',
    ablauf: '#so-funktionierts',
    inspiration: '#entdecken',
    vertrauen: 'section[aria-labelledby="vertrauen-titel"]',
    unterschied: 'section[aria-labelledby="unterschied-titel"]',
  }
  const schuesse = {
    '360x800': ['system', 'produkt'],
    '390x844': ['system', 'produkt', 'ablauf', 'inspiration', 'vertrauen'],
    '1440x900': ['system', 'produkt', 'ablauf', 'inspiration', 'vertrauen', 'unterschied'],
  }
  const laeufe = []

  for (const vp of viewports) {
    const page = await browser.newPage({ viewport: { width: vp.width, height: vp.height } })
    const konsole = []
    const seitenfehler = []
    const herkuenfte = new Set()
    page.on('console', (msg) => {
      if (msg.type() === 'error') konsole.push(msg.text())
    })
    page.on('pageerror', (err) => seitenfehler.push(err.message))
    page.on('request', (req) => {
      try {
        herkuenfte.add(new URL(req.url()).origin)
      } catch {
        /* ungültige URL */
      }
    })
    const antwort = await page.goto(`${basis}/`, { waitUntil: 'networkidle', timeout: 60000 })
    const dom = await messen(page)
    pruefe(vp.name, dom)
    if (konsole.length) fehler.push(`${vp.name}: Konsole ${konsole.join(' | ')}`)
    if (seitenfehler.length) fehler.push(`${vp.name}: Laufzeit ${seitenfehler.join(' | ')}`)
    for (const herkunft of herkuenfte) {
      if (herkunft !== erlaubteHerkunft) fehler.push(`${vp.name}: unerwartete Herkunft ${herkunft}`)
    }
    if (vp.name === '360x800' || vp.name === '390x844' || vp.name === '1440x900') {
      await page.screenshot({ path: join(evidenz, `first-${vp.name}.png`) })
    }
    for (const name of schuesse[vp.name] ?? []) {
      const ziel = page.locator(abschnitte[name])
      await ziel.scrollIntoViewIfNeeded()
      await ziel.screenshot({ path: join(evidenz, `${name}-${vp.name}.png`) })
    }
    if (vp.name === '390x844' || vp.name === '1440x900') {
      await page.screenshot({ path: join(evidenz, `full-${vp.name}.png`), fullPage: true })
      await page.locator('details summary').click()
      await page.locator(abschnitte.vertrauen).screenshot({ path: join(evidenz, `vertrauen-offen-${vp.name}.png`) })
      const offen = await page.locator('details').evaluate((el) => el.open)
      const wortlaut = await page.locator('[data-faehigkeit="jetnity-pro"]').innerText()
      if (!offen) fehler.push(`${vp.name}: Disclosure bleibt zu`)
      if (!wortlaut.includes('Live-Hinweise')) fehler.push(`${vp.name}: Wortlaut nach dem Öffnen fehlt`)
    }
    laeufe.push({ name: vp.name, status: antwort?.status() ?? null, dom, konsole, seitenfehler, herkuenfte: [...herkuenfte] })
    await page.close()
  }

  {
    const page = await browser.newPage({ viewport: { width: 360, height: 800 } })
    await page.goto(`${basis}/`, { waitUntil: 'networkidle' })
    await page.addStyleTag({ content: 'html { font-size: 32px !important; }' })
    await page.evaluate(() => new Promise((resolve) => requestAnimationFrame(() => requestAnimationFrame(() => resolve(null)))))
    const dom = await messen(page)
    pruefe('text-200-360', dom, { text200: true })
    await page.screenshot({ path: join(evidenz, 'text-200-360x800.png'), fullPage: true })
    bericht.text200 = { overflow: dom.overflow, h1: dom.h1 }
    await page.close()
  }

  {
    const page = await browser.newPage({ viewport: { width: 390, height: 844 } })
    await page.emulateMedia({ reducedMotion: 'reduce' })
    await page.goto(`${basis}/`, { waitUntil: 'networkidle' })
    const motion = await page.evaluate(() => {
      const bild = document.querySelector('#entdecken img')
      const stil = bild ? getComputedStyle(bild) : null
      return { transition: stil?.transitionDuration ?? 'fehlt' }
    })
    if (motion.transition !== '0s' && motion.transition !== '1e-06s') {
      fehler.push(`reduced motion: transition ${motion.transition}`)
    }
    await page.locator('#entdecken').scrollIntoViewIfNeeded()
    await page.screenshot({ path: join(evidenz, 'reduced-motion-390.png') })
    bericht.reducedMotion = motion
    await page.close()
  }

  {
    const page = await browser.newPage({ viewport: { width: 1440, height: 900 } })
    await page.goto(`${basis}/`, { waitUntil: 'networkidle' })
    await page.locator('a[href="/#pro"]').first().click()
    await page.waitForFunction(
      () => {
        const ziel = document.getElementById('pro')
        const details = document.querySelector('details')
        if (!ziel || !details?.open || location.hash !== '#pro') return false
        const top = ziel.getBoundingClientRect().top
        return top >= 0 && top < window.innerHeight
      },
      { timeout: 3000 },
    )
    const pro = await page.evaluate(() => {
      const details = document.querySelector('details')
      const ziel = document.getElementById('pro')
      const kasten = ziel?.getBoundingClientRect()
      return {
        hash: location.hash,
        offen: details?.open ?? false,
        vorhanden: Boolean(ziel),
        imBlick: Boolean(kasten && kasten.top >= 0 && kasten.top < window.innerHeight),
      }
    })
    if (pro.hash !== '#pro' || !pro.offen || !pro.vorhanden || !pro.imBlick) {
      fehler.push(`#pro öffnet das Disclosure nicht: ${JSON.stringify(pro)}`)
    }
    await page.screenshot({ path: join(evidenz, 'anchor-pro-1440.png') })
    bericht.ankerPro = pro
    await page.close()
  }

  {
    const page = await browser.newPage({ viewport: { width: 390, height: 844 } })
    await page.goto(`${basis}/`, { waitUntil: 'networkidle' })
    const fokus = []
    for (let i = 0; i < 8; i += 1) {
      await page.keyboard.press('Tab')
      fokus.push(
        await page.evaluate(() => {
          const el = document.activeElement
          const stil = el ? getComputedStyle(el) : null
          return {
            tag: el?.tagName ?? '',
            text: (el?.textContent || el?.getAttribute('aria-label') || '').replace(/\s+/g, ' ').trim().slice(0, 80),
            ring: stil ? stil.boxShadow !== 'none' || stil.outlineStyle !== 'none' : false,
          }
        }),
      )
      if (i === 0 || i === 4) await page.screenshot({ path: join(evidenz, `focus-${i}-390.png`) })
    }
    bericht.fokus = fokus
    await page.locator('button[aria-label="Menü öffnen"]').click()
    const mobil = await page.locator('header').first().innerText()
    bericht.navbarMobil = {
      anmelden: mobil.includes('Anmelden'),
      abmelden: mobil.includes('Abmelden'),
      konto: /\bKonto\b/.test(mobil),
    }
    if (!bericht.navbarMobil.anmelden || bericht.navbarMobil.abmelden || bericht.navbarMobil.konto) {
      fehler.push(`Mobile Gast-Leiste widerspricht der Sitzung: ${mobil.replace(/\s+/g, ' ')}`)
    }
    await page.screenshot({ path: join(evidenz, 'nav-mobile-guest-390.png') })
    await page.close()
  }

  {
    const page = await browser.newPage({ viewport: { width: 1440, height: 900 } })
    await page.goto(`${basis}/`, { waitUntil: 'networkidle' })
    const text = await page.locator('header').first().innerText()
    bericht.navbarDesktop = {
      anmelden: text.includes('Anmelden'),
      abmelden: text.includes('Abmelden'),
      konto: /\bKonto\b/.test(text),
    }
    if (!bericht.navbarDesktop.anmelden || bericht.navbarDesktop.abmelden || bericht.navbarDesktop.konto) {
      fehler.push(`Desktop-Gast-Leiste widerspricht der Sitzung: ${text.replace(/\s+/g, ' ')}`)
    }
    await page.screenshot({ path: join(evidenz, 'nav-desktop-guest-1440.png') })
    await page.close()
  }

  await browser.close()
  bericht.browser = laeufe.map((lauf) => ({
    name: lauf.name,
    status: lauf.status,
    overflow: lauf.dom.overflow,
    h1: lauf.dom.h1,
    canonical: lauf.dom.canonical,
    robots: lauf.dom.robots,
    konsole: lauf.konsole,
    seitenfehler: lauf.seitenfehler,
    herkuenfte: lauf.herkuenfte,
  }))
}

bericht.ergebnis = fehler.length === 0 ? 'PASS' : 'FAIL'
bericht.fehler = fehler
const ziel = process.env.AUDIT_REPORT || join(wurzel, 'docs/evidence/final-homepage-premium-experience-2/audit.json')
mkdirSync(dirname(ziel), { recursive: true })
writeFileSync(ziel, JSON.stringify(bericht, null, 2))
console.log(bericht.ergebnis)
if (fehler.length) {
  for (const eintrag of fehler) console.error(eintrag)
  process.exit(1)
}
