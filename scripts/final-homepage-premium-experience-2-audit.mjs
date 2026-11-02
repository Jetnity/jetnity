#!/usr/bin/env node
// Existing homepage audit, updated for the owner-approved Final 1 customer story.
// AUDIT_BROWSER=1 adds an isolated localhost-only check against an actual Next server.
import { mkdirSync, readFileSync, writeFileSync } from 'node:fs'
import { dirname, join } from 'node:path'
import { tmpdir } from 'node:os'
import { fileURLToPath } from 'node:url'

const wurzel = join(dirname(fileURLToPath(import.meta.url)), '..')
const lesen = (pfad) => readFileSync(join(wurzel, pfad), 'utf8')
const dateien = ['app/(public)/page.tsx', 'lib/seo/final-homepage.ts', ...['HomeHero', 'HomeWerkzeuge', 'HomeProduktfenster', 'HomeBegleitung', 'HomeUnterschied', 'HomeInspiration', 'HomeVertrauen'].map((name) => `components/home/${name}.tsx`)]
const texte = dateien.map(lesen).join('\n')
const fehler = []
const pruefe = (wahr, text) => { if (!wahr) fehler.push(text) }
for (const text of ['Deine ganze Reise. Intelligent an einem Ort.', 'Reiseplaner und Reisebegleiter', 'StartzielForm', 'GastCreateLink', 'zielHref', 'Beispielreise', 'Lissabon', 'Porto', 'Übersicht', 'Reiseplan', 'Organisieren', 'Vorbereitung', 'HOMEPAGE_FAQ', '<details', '<summary', 'beim jeweiligen Anbieter', 'noch keine Buchung', 'id="so-funktionierts"', 'id="entdecken"', 'id="fragen"', 'id="pro"']) {
  pruefe(texte.includes(text), `Homepage contract missing: ${text}`)
}
pruefe(!/Heute nutzbar|Soweit Daten vorliegen|In Vorbereitung|Kommt später|synthetische Reise|HOMEPAGE_FAEHIGKEITEN/.test(texte), 'Obsolete development matrix remains')
pruefe(!/\bindex:\s*true\b/.test(texte), 'Homepage must not change global indexing permission')
pruefe(!/\d+\s*(CHF|EUR|€|\$)/.test(texte), 'Unverified price in homepage')
pruefe(!/gtag|googletagmanager|facebook\.net/.test(texte), 'New tracking in homepage')
pruefe(lesen('lib/seo/oeffentlicher-origin.ts').includes('darfIndexieren'), 'Global indexing gate missing')
for (const id of ['1650535', '2267057', '2657915', '2759794']) pruefe(lesen('lib/places/inspiration.ts').includes(`geonames:${id}`), `Canonical inspiration id missing: ${id}`)
const share = readFileSync(join(wurzel, 'public/images/jetnity-reiseplaner-share.png'))
pruefe(share.readUInt32BE(16) === 1200 && share.readUInt32BE(20) === 630, 'Share image must be 1200×630')
pruefe(!lesen('app/sitemap.ts').includes('lastModified: new Date()'), 'Sitemap fabricates last modification time')
const bericht = { stand: new Date().toISOString(), dateien, browser: 'NOT RUN (set AUDIT_BROWSER=1)', fehler }

if (process.env.AUDIT_BROWSER === '1') {
  const basis = process.env.AUDIT_BASE || 'http://127.0.0.1:3456'
  const origin = new URL(basis).origin
  if (!['localhost', '127.0.0.1'].includes(new URL(basis).hostname)) throw new Error('This audit is local-only; remote/authenticated browsers are outside its scope.')
  const ausgabe = process.env.AUDIT_EVIDENCE_DIR || join(tmpdir(), 'jetnity-homepage-final-1')
  mkdirSync(ausgabe, { recursive: true })
  const { chromium } = await import('playwright')
  let browser
  try { browser = await chromium.launch({ headless: true, ...(process.env.CHROME_PATH ? { executablePath: process.env.CHROME_PATH } : {}) }) }
  catch (error) { if (!String(error).includes("Executable doesn't exist")) throw error; browser = await chromium.launch({ headless: true, channel: 'chrome' }) }
  try {
    const html = await fetch(`${origin}/`).then((res) => res.text())
    for (const text of ['Reiseplaner und Reisebegleiter', 'Beispielreise', 'Was ist Jetnity?', 'beim jeweiligen Anbieter', '<details', 'application/ld+json']) pruefe(html.includes(text), `Important content absent from SSR HTML: ${text}`)
    const laeufe = []
    for (const breite of [320, 360, 390, 768, 1024, 1440]) {
      const context = await browser.newContext({ viewport: { width: breite, height: 900 }, reducedMotion: 'reduce' })
      const fremd = []
      await context.route('**/*', (route) => {
        if (new URL(route.request().url()).origin !== origin) { fremd.push(route.request().url()); return route.abort() }
        return route.continue()
      })
      const page = await context.newPage()
      const laufzeitfehler = []
      page.on('pageerror', (error) => laufzeitfehler.push(error.message))
      await page.goto(`${origin}/`, { waitUntil: 'networkidle' })
      for (const bild of await page.locator('main img').all()) await bild.scrollIntoViewIfNeeded()
      await page.evaluate(() => { window.scrollTo({ top: 0, behavior: 'instant' }) })
      await page.waitForFunction(() => [...document.images].every((img) => img.complete && img.naturalWidth > 0))
      const dom = await page.evaluate(() => {
        const input = document.querySelector('#travel-idea')
        const form = input?.closest('form')
        const button = form?.querySelector('button[type="submit"]')
        const graph = JSON.parse(document.querySelector('script[type="application/ld+json"]')?.textContent || '{}')
        return {
          h1: document.querySelector('h1')?.textContent,
          h1Count: document.querySelectorAll('h1').length,
          overflow: document.documentElement.scrollWidth - document.documentElement.clientWidth,
          canonical: document.querySelector('link[rel="canonical"]')?.getAttribute('href'),
          description: document.querySelector('meta[name="description"]')?.getAttribute('content'),
          share: document.querySelector('meta[property="og:image"]')?.getAttribute('content'),
          inputPx: input ? parseFloat(getComputedStyle(input).fontSize) : 0,
          buttonHeight: button?.getBoundingClientRect().height || 0,
          firstScreenCta: (button?.getBoundingClientRect().bottom || Infinity) < innerHeight,
          images: [...document.images].every((img) => img.complete && img.naturalWidth > 0),
          summaries: [...document.querySelectorAll('summary')].every((el) => el.getBoundingClientRect().height >= 44),
          graph,
        }
      })
      pruefe(dom.h1Count === 1 && dom.h1 === 'Deine ganze Reise. Intelligent an einem Ort.', `${breite}: single correct H1`)
      pruefe(dom.overflow <= 1, `${breite}: horizontal overflow ${dom.overflow}`)
      pruefe(dom.canonical === 'https://jetnity.com/', `${breite}: canonical ${dom.canonical}`)
      pruefe(Boolean(dom.description && dom.description.length <= 160), `${breite}: meta description`)
      pruefe(dom.share?.includes('/images/jetnity-reiseplaner-share.png'), `${breite}: share image`)
      pruefe(dom.images, `${breite}: broken image`)
      pruefe(dom.buttonHeight >= 44 && dom.inputPx >= 16 && dom.summaries, `${breite}: input/touch dimensions`)
      pruefe(dom.firstScreenCta, `${breite}: primary CTA not in first viewport`)
      pruefe(['Organization', 'WebSite', 'SoftwareApplication'].every((typ) => dom.graph['@graph']?.some((node) => node['@type'] === typ)), `${breite}: entity graph`)
      pruefe(!/"(?:sameAs|aggregateRating|reviewCount|offers|award)"/.test(JSON.stringify(dom.graph)), `${breite}: unsupported structured claim`)
      pruefe(laufzeitfehler.length === 0, `${breite}: ${laufzeitfehler.join(', ')}`)
      pruefe(fremd.length === 0, `${breite}: unexpected external request`)
      await page.screenshot({ path: join(ausgabe, `homepage-${breite}.png`), fullPage: true })
      const summary = page.locator('summary').filter({ hasText: 'Wie buche ich Flüge, Unterkünfte oder Aktivitäten?' })
      await summary.focus(); await page.keyboard.press('Enter')
      pruefe(await summary.evaluate((el) => el.closest('details')?.open), `${breite}: FAQ keyboard interaction`)
      if (breite === 320 || breite === 1440) {
        await page.addStyleTag({ content: 'html { font-size: 32px !important }' })
        const overflow = await page.evaluate(() => document.documentElement.scrollWidth - document.documentElement.clientWidth)
        pruefe(overflow <= 1, `${breite} 200%: overflow ${overflow}`)
        await page.screenshot({ path: join(ausgabe, `homepage-${breite}-200-percent.png`), fullPage: true })
      }
      laeufe.push({ breite, dom, laufzeitfehler, fremd })
      await context.close()
    }
    bericht.browser = laeufe
  } finally { await browser.close() }
}
bericht.ergebnis = fehler.length ? 'FAIL' : 'PASS'
const ziel = process.env.AUDIT_REPORT || join(tmpdir(), 'jetnity-homepage-final-1-audit.json')
mkdirSync(dirname(ziel), { recursive: true }); writeFileSync(ziel, JSON.stringify(bericht, null, 2))
console.log(`${bericht.ergebnis}: ${ziel}`)
if (fehler.length) { for (const text of fehler) console.error(text); process.exitCode = 1 }
