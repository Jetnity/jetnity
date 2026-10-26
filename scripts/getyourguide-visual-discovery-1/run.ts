// scripts/getyourguide-visual-discovery-1/run.ts
//
// Lokale, synthetische Montage. Kein App-Route, kein Anbieter, kein Env-Schalter.
// Aufruf: node --import tsx scripts/getyourguide-visual-discovery-1/run.ts

import { spawnSync } from 'node:child_process'
import { createServer, type ServerResponse } from 'node:http'
import { createRequire } from 'node:module'
import { existsSync, mkdirSync, readFileSync, writeFileSync } from 'node:fs'
import { dirname, join, resolve } from 'node:path'
import { fileURLToPath } from 'node:url'

import { chromium, type Page } from 'playwright'

const require = createRequire(import.meta.url)
const esbuild = require('esbuild') as {
  build: (options: Record<string, unknown>) => Promise<void>
}

const ROOT = resolve(dirname(fileURLToPath(import.meta.url)), '../..')
const OUT = '/tmp/gyg-visual-discovery'
const ARTIFACTS = '/opt/cursor/artifacts/gyg-visual-discovery'
const SCREENS = join(ROOT, 'scripts/getyourguide-visual-discovery-1/screens')

type Bericht = {
  laden: number
  entsorgen: number
  abgebrochen: number
  bezuege: { anbieter?: string; umfang?: string; oeffentlicheKennung?: string }[]
}

const fehler: string[] = []

function pruefe(bedingung: boolean, meldung: string) {
  if (!bedingung) fehler.push(meldung)
}

function dateiAufloesen(basis: string): string | null {
  const kandidaten = [
    basis,
    `${basis}.ts`,
    `${basis}.tsx`,
    `${basis}.js`,
    `${basis}.jsx`,
    join(basis, 'index.ts'),
    join(basis, 'index.tsx'),
  ]
  return kandidaten.find((kandidat) => existsSync(kandidat)) ?? null
}

function html(skript: string): string {
  return `<!doctype html>
<html lang="de">
<head>
  <meta charset="utf-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1" />
  <title>Synthetische GetYourGuide-Prüfung</title>
  <link rel="stylesheet" href="/app.css" />
</head>
<body>
  <div id="root"></div>
  <script src="/${skript}.js"></script>
</body>
</html>`
}

function antwort(res: ServerResponse, status: number, typ: string, body: string | Buffer) {
  res.writeHead(status, { 'content-type': typ, 'cache-control': 'no-store' })
  res.end(body)
}

async function bundeln(css: string) {
  mkdirSync(OUT, { recursive: true })
  await esbuild.build({
    absWorkingDir: ROOT,
    entryPoints: {
      anwendung: 'scripts/getyourguide-visual-discovery-1/anwendung.tsx',
      pruefung: 'scripts/getyourguide-visual-discovery-1/pruefung.tsx',
      gegenprobe: 'scripts/getyourguide-visual-discovery-1/gegenprobe.tsx',
    },
    bundle: true,
    format: 'iife',
    platform: 'browser',
    target: 'es2022',
    jsx: 'automatic',
    outdir: OUT,
    define: { 'process.env.NODE_ENV': '"development"' },
    plugins: [
      {
        name: 'jetnity-alias',
        setup(build: { onResolve: (args: { filter: RegExp }, fn: (args: { path: string }) => { path: string } | null) => void }) {
          build.onResolve({ filter: /^@\// }, (args) => {
            const ziel = dateiAufloesen(join(ROOT, args.path.slice(2)))
            if (!ziel) return null
            return { path: ziel }
          })
        },
      },
    ],
  })
  writeFileSync(join(OUT, 'app.css'), css)
}

function cssBauen(): string {
  const ziel = join(OUT, 'tailwind.css')
  mkdirSync(OUT, { recursive: true })
  const lauf = spawnSync(
    'npx',
    ['tailwindcss', '-i', 'styles/globals.css', '-o', ziel, '--minify'],
    { cwd: ROOT, encoding: 'utf8' },
  )
  if (lauf.status !== 0) {
    throw new Error(`Tailwind fehlgeschlagen\n${lauf.stdout}\n${lauf.stderr}`)
  }
  return readFileSync(ziel, 'utf8')
}

async function ueberlauf(page: Page): Promise<string[]> {
  return page.evaluate(`(() => {
    const wurzel = document.documentElement
    if (wurzel.scrollWidth > wurzel.clientWidth + 1) {
      return ['Seite ' + wurzel.scrollWidth + 'px bei ' + wurzel.clientWidth + 'px']
    }
    const breite = wurzel.clientWidth
    const imLauf = (el) => {
      let knoten = el.parentElement
      while (knoten) {
        const stil = getComputedStyle(knoten)
        if (stil.overflowX === 'auto' || stil.overflowX === 'scroll' || stil.overflowX === 'hidden') return true
        knoten = knoten.parentElement
      }
      return false
    }
    return [...document.querySelectorAll('body *')]
      .filter((el) => {
        const rect = el.getBoundingClientRect()
        return rect.width > 0 && rect.right > breite + 1 && !imLauf(el)
      })
      .slice(0, 6)
      .map((el) => el.tagName + '.' + el.className)
  })()`)
}

async function schiessen(page: Page, name: string) {
  const ziel = join(ARTIFACTS, `${name}.png`)
  const kopie = join(SCREENS, `${name}.png`)
  await page.screenshot({ path: ziel, fullPage: true })
  await page.screenshot({ path: kopie, fullPage: true })
}

async function netzFrei(netz: { url: string }[]) {
  const fremd = netz.filter((eintrag) => {
    const url = new URL(eintrag.url)
    if (url.protocol === 'http:' && url.hostname === '127.0.0.1') return false
    return true
  })
  pruefe(fremd.length === 0, `Fremde Requests: ${fremd.map((eintrag) => eintrag.url).join(' | ')}`)
  const anbieter = netz.filter((eintrag) => /getyourguide|supabase|geonames|googleapis|gstatic/i.test(eintrag.url))
  pruefe(anbieter.length === 0, `Anbieter-Requests: ${anbieter.map((eintrag) => eintrag.url).join(' | ')}`)
}

async function haupt() {
  mkdirSync(ARTIFACTS, { recursive: true })
  mkdirSync(SCREENS, { recursive: true })
  const css = cssBauen()
  await bundeln(css)
  const server = createServer((req, res) => {
    const pfad = (req.url ?? '/').split('?')[0]
    if (pfad === '/anwendung.js' || pfad === '/pruefung.js' || pfad === '/gegenprobe.js') {
      antwort(res, 200, 'text/javascript; charset=utf-8', readFileSync(join(OUT, pfad.slice(1))))
      return
    }
    if (pfad === '/app.css') {
      antwort(res, 200, 'text/css; charset=utf-8', readFileSync(join(OUT, 'app.css')))
      return
    }
    if (pfad === '/pruefung') {
      antwort(res, 200, 'text/html; charset=utf-8', html('pruefung'))
      return
    }
    if (pfad === '/gegenprobe') {
      antwort(res, 200, 'text/html; charset=utf-8', html('gegenprobe'))
      return
    }
    if (pfad === '/api/activities/search') {
      req.resume()
      antwort(res, 200, 'application/json; charset=utf-8', JSON.stringify({
        status: 'ok',
        message: 'Aktivitäten gefunden.',
        coverageNote: 'Synthetische lokale Abdeckung, kein Anbieter.',
        evidenz: {
          hatOrt: true,
          hatKoordinaten: false,
          hatTag: true,
          hatDatum: false,
          hatBestehendePunkte: false,
          hatBelastbareZeiten: false,
          hatInteressen: false,
          hatBudget: false,
        },
        options: [{
          id: 'synthetic-local-boot',
          provider: 'synthetic',
          externalRef: 'synthetic-local-boot',
          title: 'Synthetische Bootsfahrt',
          description: 'Lokale Karte ohne Anbieter.',
          locationName: 'Bangkok',
          punkt: null,
          dauerMinuten: 90,
          timeslot: null,
          preis: 80,
          preisWaehrung: 'CHF',
          bewertung: null,
          bewertungenAnzahl: null,
          stornierbar: null,
          kategorien: [],
          tags: [],
          labels: [],
          reasons: ['Synthetische lokale Karte'],
          konflikt: 'frei',
        }],
      }))
      return
    }
    if (pfad === '/' || pfad === '/anwendung') {
      antwort(res, 200, 'text/html; charset=utf-8', html('anwendung'))
      return
    }
    antwort(res, 204, 'text/plain', '')
  })
  await new Promise<void>((resolve) => server.listen(0, '127.0.0.1', () => resolve()))
  const adresse = server.address()
  if (!adresse || typeof adresse === 'string') throw new Error('Port fehlt')
  const basis = `http://127.0.0.1:${adresse.port}`
  const netz: { url: string }[] = []
  const browser = await chromium.launch({ headless: true, args: ['--no-sandbox', '--disable-dev-shm-usage'] })
  const page = await browser.newPage()
  const seitenfehler: string[] = []
  page.on('pageerror', (error) => {
    seitenfehler.push(String(error))
    console.error('PAGE', error)
  })
  page.on('console', (message) => {
    if (message.type() === 'error') console.error('CONSOLE', message.text())
  })
  page.on('request', (request) => netz.push({ url: request.url() }))
  await page.route('**/*', (route) => {
    const url = new URL(route.request().url())
    if (url.protocol === 'http:' && url.hostname === '127.0.0.1' && url.port === String(adresse.port)) {
      return route.continue()
    }
    return route.abort()
  })

  console.log(`Server ${basis}`)
  await page.goto(`${basis}/anwendung`, { waitUntil: 'domcontentloaded', timeout: 20000 })
  try {
    await page.waitForSelector('[aria-label="GetYourGuide"]', { timeout: 20000 })
  } catch (error) {
    console.error('HTML', (await page.content()).slice(0, 1500))
    console.error('TEXT', await page.locator('body').innerText())
    console.error('FEHLER', seitenfehler)
    throw error
  }
  console.log('Anwendung gemountet')
  const viewports = [
    { name: '320', width: 320, height: 720 },
    { name: '390', width: 390, height: 844 },
    { name: '768', width: 768, height: 1024 },
    { name: '1440', width: 1440, height: 900 },
  ]
  for (const viewport of viewports) {
    await page.setViewportSize({ width: viewport.width, height: viewport.height })
    const ueber = await ueberlauf(page)
    pruefe(ueber.length === 0, `Überlauf ${viewport.name}: ${ueber.join(' | ')}`)
    await schiessen(page, `anwendung-${viewport.name}`)
  }

  await page.setViewportSize({ width: 390, height: 844 })
  const gygTage = page.locator('[data-szenario="tage"] [aria-label="GetYourGuide"]')
  await gygTage.hover()
  await page.locator('[data-szenario="tage"] [role="radio"]').nth(1).click()
  await page.locator('[data-szenario="tage"] button', { hasText: 'Was fehlt hier?' }).focus()
  const fokus = await page.evaluate(() => document.activeElement?.textContent ?? '')
  pruefe(fokus.includes('Was fehlt hier?'), `Fokus liegt nicht auf dem Hinweis: ${fokus}`)
  await page.keyboard.press('Enter')
  await page.waitForSelector('text=Jetnity startet deshalb keine Anfrage')
  const nachAktion = await page.locator('[data-szenario="tage"]').innerText()
  pruefe(nachAktion.includes('Für diese Angaben liegt noch keine Suche vor.'), 'Native Suche wurde ersetzt')
  pruefe(nachAktion.includes('Erster langer Reisetag'), 'Nativer Reisetag fehlt')
  const ungueltig = await page.locator('[data-szenario="ungueltig"] [aria-label="GetYourGuide"]').innerText()
  pruefe(ungueltig.includes('nicht ersatzweise einen anderen Tag'), 'Ungültiger Tag fehlt')
  pruefe(!ungueltig.includes('Phuket'), 'Ungültiger Tag zeigt den ersten Ortsnamen')
  pruefe((await page.locator('[data-szenario="ohne-tage"]').innerText()).includes('noch keine Tage'), 'Ohne-Tage-Text fehlt')

  await page.addStyleTag({ content: 'html { font-size: 32px !important; }' })
  for (const viewport of [
    { name: '320-200', width: 320, height: 720 },
    { name: '390-200', width: 390, height: 844 },
  ]) {
    await page.setViewportSize({ width: viewport.width, height: viewport.height })
    const ueber = await ueberlauf(page)
    pruefe(ueber.length === 0, `Überlauf ${viewport.name}: ${ueber.join(' | ')}`)
    const hoehe = await page.locator('[data-szenario="tage"] button', { hasText: 'Was fehlt hier?' }).evaluate((el) => el.getBoundingClientRect().height)
    pruefe(hoehe >= 44, `Hinweisfläche ${viewport.name} ist ${hoehe}px`)
    await schiessen(page, `anwendung-${viewport.name}`)
  }
  await netzFrei(netz)

  const vorher = netz.length
  console.log('Anwendung geprüft')
  await page.goto(`${basis}/pruefung`, { waitUntil: 'domcontentloaded', timeout: 20000 })
  await page.waitForSelector('[data-szenario="pruef"] [aria-label="GetYourGuide"]', { timeout: 20000 })
  console.log('Prüfung gemountet')
  await page.setViewportSize({ width: 390, height: 844 })
  await page.emulateMedia({ reducedMotion: 'reduce' })
  await page.addStyleTag({ content: 'html { font-size: 16px !important; }' })
  const pruef = page.locator('[data-szenario="pruef"]')
  await pruef.locator('[aria-label="GetYourGuide"]').hover()
  let stand = await lesen(page)
  pruefe(stand.laden === 0, `Hover hat geladen: ${stand.laden}`)

  await page.evaluate(`(() => {
    const flaeche = document.querySelector('[data-szenario="pruef"]')
    const knopf = [...(flaeche ? flaeche.querySelectorAll('button') : [])].find((eintrag) =>
      eintrag.textContent && eintrag.textContent.includes('Bei GetYourGuide anzeigen'),
    )
    if (knopf) {
      knopf.click()
      knopf.click()
    }
  })()`)
  stand = await lesen(page)
  pruefe(stand.laden === 1, `Doppelaktion hat ${stand.laden} Ladungen gestartet`)
  await page.getByRole('button', { name: 'Nach Phuket' }).click()
  await page.waitForTimeout(900)
  const nachWechsel = await pruef.locator('[data-gyg-montage]').innerText()
  stand = await lesen(page)
  pruefe(!nachWechsel.includes('synthetic-public:bangkok-city'), `Alter Bangkok-Inhalt blieb: ${nachWechsel}`)
  pruefe(stand.abgebrochen >= 1, 'Abgebrochene Ladung fehlt')
  pruefe(stand.entsorgen >= 1, 'Entsorgung fehlt')
  pruefe((await pruef.locator('[aria-label="GetYourGuide"]').getAttribute('data-gyg-phase')) === 'ruhend', 'Phuket hat ohne neue Aktion geladen')

  await pruef.getByRole('button', { name: 'Bei GetYourGuide anzeigen' }).click()
  await page.waitForTimeout(900)
  const phuketText = await pruef.locator('[data-gyg-montage]').innerText()
  pruefe(phuketText.includes('synthetic-public:phuket-city'), `Phuket-Inhalt fehlt: ${phuketText}`)
  pruefe(!phuketText.includes('#1'), `Erste Ladung wurde wieder gezeigt: ${phuketText}`)
  const status = await pruef.locator('[aria-label="GetYourGuide"]').innerText()
  pruefe(status.includes('zählt sie nicht'), 'Anzeige wurde als Katalog gelesen')
  pruefe(!/\d+\s+Angebote/.test(status), 'Anzeige enthält eine Angebotszahl')

  await page.getByRole('button', { name: 'Bangkok Rückfahrt' }).click()
  await page.waitForTimeout(200)
  pruefe((await pruef.locator('[data-gyg-montage]').innerText()).trim() === '', 'Rückfahrt zeigt den vorigen Inhalt')
  await pruef.getByRole('button', { name: 'Bei GetYourGuide anzeigen' }).click()
  await page.waitForTimeout(900)
  const rueck = await pruef.locator('[data-gyg-montage]').innerText()
  pruefe(rueck.includes('synthetic-public:bangkok-city'), `Rückfahrt ohne eigenen Abschluss: ${rueck}`)

  await page.getByRole('button', { name: 'Panama ohne Tage' }).click()
  await page.waitForSelector('text=Ideen für Panama')
  const panamaText = await pruef.locator('[aria-label="GetYourGuide"]').innerText()
  pruefe(panamaText.includes('kein bestimmter Ort'), 'Panama wirkt wie eine Stadt')
  pruefe(!panamaText.includes('Panama City'), 'Panama City wurde erfunden')
  await schiessen(page, 'pruefung-panama-390')

  await page.getByRole('button', { name: 'Langer Ländername' }).click()
  await page.setViewportSize({ width: 320, height: 720 })
  await page.addStyleTag({ content: 'html { font-size: 32px !important; }' })
  const langUeber = await ueberlauf(page)
  pruefe(langUeber.length === 0, `Überlauf langer Name: ${langUeber.join(' | ')}`)
  await schiessen(page, 'pruefung-lang-320-200')
  await page.addStyleTag({ content: 'html { font-size: 16px !important; }' })
  await page.setViewportSize({ width: 390, height: 844 })

  await page.getByRole('button', { name: 'Bangkok Hinfahrt' }).click()
  await page.getByRole('button', { name: 'Nächster Abschluss scheitert' }).click()
  await pruef.getByRole('button', { name: 'Bei GetYourGuide anzeigen' }).click()
  await page.waitForSelector('text=GetYourGuide konnte gerade nicht geladen werden.')
  const rohtext = await textVon(page, '[data-szenario="pruef"] [aria-label="GetYourGuide"]')
  pruefe(!rohtext.includes('synthetische Prüfung ist fehlgeschlagen'), `Abgelehnter Klartext bleibt sichtbar: ${rohtext}`)
  const nativeText = await page.locator('[data-szenario="nativ"]').innerText()
  pruefe(nativeText.includes('Für diese Angaben liegt noch keine Suche vor.'), 'GYG-Fehler hat die native Suche ersetzt')
  pruefe(nativeText.includes('noch nicht eingerichtet'), 'Native GetYourGuide-Fläche ist nicht mehr geschlossen')
  await page.getByRole('button', { name: 'Nächster Abschluss gelingt' }).click()
  await pruef.getByRole('button', { name: 'Erneut versuchen' }).focus()
  await page.keyboard.press('Enter')
  await page.waitForTimeout(900)
  pruefe((await pruef.locator('[data-gyg-montage]').innerText()).includes('SYNTHETISCH'), 'Erneuter Versuch zeigt kein synthetisches Bild')
  await schiessen(page, 'pruefung-erneut-390')

  const vorEntzug = (await lesen(page)).laden
  await pruef.getByRole('button', { name: 'Erneut laden' }).click()
  await page.getByRole('button', { name: 'Berechtigung zurückziehen' }).click()
  await page.waitForTimeout(900)
  const nachEntzug = await lesen(page)
  pruefe((await pruef.locator('[data-gyg-montage]').innerText()).trim() === '', 'Zurückgezogene Berechtigung zeigt Inhalt')
  pruefe((await pruef.locator('[data-gyg-zustand="geschlossen"]').count()) === 1, 'Zustand nach Entzug ist nicht geschlossen')
  pruefe(nachEntzug.abgebrochen >= 1, 'Entzug hat nicht abgebrochen')

  await page.getByRole('button', { name: 'Bangkok Hinfahrt' }).click()
  await pruef.getByRole('button', { name: 'Bei GetYourGuide anzeigen' }).click()
  await page.getByRole('button', { name: 'Fläche entfernen' }).click()
  await page.waitForTimeout(900)
  const nachEntfernen = await lesen(page)
  pruefe((await page.locator('[data-entfernt="ja"]').count()) === 1, 'Fläche blieb stehen')
  const ladenNachEntfernen = nachEntfernen.laden
  await page.getByRole('button', { name: 'Fläche wieder zeigen' }).click()
  await page.waitForTimeout(700)
  const nachRemount = await lesen(page)
  pruefe(nachRemount.laden === ladenNachEntfernen, 'Remount hat selbst geladen')
  pruefe((await pruef.locator('[data-gyg-montage]').innerText()).trim() === '', 'Remount zeigt alten Inhalt')
  pruefe(vorEntzug >= 1, 'Vor dem Entzug fehlte eine Ladung')

  stand = await lesen(page)
  for (const bezug of stand.bezuege) {
    pruefe(
      JSON.stringify(Object.keys(bezug).sort()) === JSON.stringify(['anbieter', 'oeffentlicheKennung', 'umfang']),
      `Bezug hat fremde Felder: ${JSON.stringify(bezug)}`,
    )
    const text = JSON.stringify(bezug)
    pruefe(!text.includes('trip-gyg'), `Bezug enthält eine Reisekennung: ${text}`)
    pruefe(!text.includes('CHF'), `Bezug enthält eine Währung: ${text}`)
    pruefe(!/https?:/i.test(text), `Bezug enthält eine Adresse: ${text}`)
    pruefe(!text.includes('Panama City'), `Bezug enthält Panama City: ${text}`)
  }
  await netzFrei(netz)
  pruefe(netz.length >= vorher, 'Netzprotokoll fehlt')
  await gegenprobe(page, basis)
  pruefe(seitenfehler.length === 0, `Seitenfehler: ${seitenfehler.join(' | ')}`)

  const protokoll = {
    synthetisch: true,
    liveAnbieter: false,
    anwendungRenderer: null,
    viewports: ['320', '390', '768', '1440', '320-200', '390-200'],
    netz: netz.map((eintrag) => eintrag.url),
    bericht: stand,
    fehler,
    seitenfehler,
  }
  writeFileSync(join(OUT, 'bericht.json'), JSON.stringify(protokoll, null, 2))
  writeFileSync(join(ROOT, 'scripts/getyourguide-visual-discovery-1/bericht.json'), JSON.stringify(protokoll, null, 2))
  await browser.close()
  await new Promise<void>((resolve, reject) => server.close((error) => (error ? reject(error) : resolve())))
  if (fehler.length > 0) {
    console.error(fehler.join('\n'))
    process.exitCode = 1
    return
  }
  console.log(`Synthetische Montage in Ordnung. Requests: ${netz.length}. Ladungen: ${stand.laden}.`)
}

type Gegenbericht = {
  laden: number
  entsorgen: number
  bestaetigt: number
  schreibungen: { kennung: string; generation: string; verbunden: boolean; abgebrochen: boolean }[]
  entsorgtVerbunden: boolean[]
  ablehnung: {
    vorAbbruch: boolean
    vorVerbunden: boolean
    nachAbbruch: boolean
    nachVerbunden: boolean
    entsorgenDavor: number
    entsorgenDanach: number
    zuhoerer: number
    nachher: number
  } | null
}

function gegenLesen(page: Page): Promise<Gegenbericht> {
  return page.evaluate(`(() => {
    const stand = window.__gygGegenprobe
    return stand || { laden: 0, entsorgen: 0, bestaetigt: 0, schreibungen: [], entsorgtVerbunden: [] }
  })()`)
}

function textVon(page: Page, selektor: string): Promise<string> {
  return page.evaluate(`(() => {
    const ziel = document.querySelector(${JSON.stringify(selektor)})
    return ziel ? (ziel.textContent || '') : ''
  })()`)
}

function anzahlVon(page: Page, selektor: string): Promise<number> {
  return page.evaluate(`(() => document.querySelectorAll(${JSON.stringify(selektor)}).length)()`)
}

async function wartenAufText(page: Page, selektor: string, ausschnitt: string) {
  const start = Date.now()
  let text = ''
  while (Date.now() - start < 8000) {
    text = await textVon(page, selektor)
    if (text.includes(ausschnitt)) return text
    await page.waitForTimeout(40)
  }
  throw new Error(`${ausschnitt} fehlt in ${text.slice(0, 400)}`)
}

async function wartenAufFrei(page: Page, selektor: string, verboten: string) {
  const start = Date.now()
  let text = ''
  while (Date.now() - start < 4000) {
    text = await textVon(page, selektor)
    if (!text.includes(verboten)) return text
    await page.waitForTimeout(40)
  }
  return text
}

async function gegenprobe(page: Page, basis: string) {
  await page.goto(`${basis}/gegenprobe`, { waitUntil: 'domcontentloaded', timeout: 20000 })
  const flaeche = page.locator('[data-szenario="gegenprobe"]')
  const gyg = flaeche.locator('[aria-label="GetYourGuide"]')
  await page.locator('[data-szenario="nativ"]').getByRole('button', { name: 'Für diesen Tag suchen' }).click()
  await page.locator('[data-szenario="nativ"]').getByText('Synthetische Bootsfahrt').waitFor({ timeout: 10000 })
  await gyg.waitFor({ timeout: 10000 })
  await flaeche.getByRole('button', { name: 'Bei GetYourGuide anzeigen' }).waitFor({ timeout: 10000 })

  const instanzStart = await gyg.getAttribute('data-gyg-instanz')
  await flaeche.getByRole('button', { name: 'Bei GetYourGuide anzeigen' }).click()
  await page.getByRole('button', { name: 'Tag B', exact: true }).click()
  await flaeche.getByRole('button', { name: 'Bei GetYourGuide anzeigen' }).click()
  await page.getByRole('button', { name: 'Tag A', exact: true }).click()
  await flaeche.getByRole('button', { name: 'Bei GetYourGuide anzeigen' }).click()
  const sichtbarA = await wartenAufText(page, '[data-szenario="gegenprobe"] [data-gyg-montage]', 'result-synthetic:synthetic-public:map-a:')
  const nachA = await gegenLesen(page)
  const ergebnisseA = await anzahlVon(page, '[data-szenario="gegenprobe"] [data-gyg-montage] [data-synthetic-result]')
  pruefe(ergebnisseA === 1, `A→B→A zeigt ${ergebnisseA} Ergebnisse: ${sichtbarA}`)
  pruefe(!sichtbarA.includes('phuket'), `Phuket blieb sichtbar: ${sichtbarA}`)
  pruefe(nachA.schreibungen.some((eintrag) => eintrag.verbunden === false && eintrag.abgebrochen === true), 'Späte Schreibung auf getrenntem Knoten fehlt')
  pruefe(nachA.entsorgtVerbunden.every((verbunden) => verbunden === false), `Entsorgung sah einen verbundenen Knoten: ${nachA.entsorgtVerbunden.join(',')}`)

  const vorRetry = (await gegenLesen(page)).entsorgen
  await flaeche.getByRole('button', { name: 'Erneut laden' }).click()
  const waehrend = await textVon(page, '[data-szenario="gegenprobe"] [data-gyg-montage]')
  pruefe(!waehrend.includes('result-synthetic'), `Alter Inhalt blieb während des Ladens: ${waehrend}`)
  await wartenAufText(page, '[data-szenario="gegenprobe"] [data-gyg-montage]', 'result-synthetic:')
  const nachRetry = await gegenLesen(page)
  pruefe(nachRetry.entsorgen > vorRetry, 'Erneutes Laden hat nicht entsorgt')
  pruefe((await anzahlVon(page, '[data-szenario="gegenprobe"] [data-gyg-montage] [data-synthetic-result]')) === 1, 'Erneutes Laden hat zwei Ergebnisse angehängt')

  await page.getByRole('button', { name: 'Tag A wieder' }).click()
  await flaeche.getByRole('button', { name: 'Bei GetYourGuide anzeigen' }).click()
  const wieder = await wartenAufText(page, '[data-szenario="gegenprobe"] [data-gyg-montage]', 'result-synthetic:synthetic-public:map-a:')
  const generationen = (await gegenLesen(page)).schreibungen.filter((eintrag) => eintrag.kennung === 'synthetic-public:map-a')
  pruefe(generationen.some((eintrag) => eintrag.verbunden === false), 'Wiederholte Etappe hat die alte Schreibung nicht getrennt')
  pruefe((await anzahlVon(page, '[data-szenario="gegenprobe"] [data-gyg-montage] [data-synthetic-result]')) === 1, `Wiederholte Etappe zeigt mehr als ein Ergebnis: ${wieder}`)

  await page.getByRole('button', { name: 'Als Stadt' }).click()
  await flaeche.getByRole('button', { name: 'Bei GetYourGuide anzeigen' }).click()
  await wartenAufText(page, '[data-szenario="gegenprobe"] [data-gyg-montage]', 'synthetic-public:same-city')
  await page.getByRole('button', { name: 'Als Region' }).click()
  const nachTyp = await wartenAufFrei(page, '[data-szenario="gegenprobe"] [data-gyg-montage]', 'same-city')
  pruefe(!nachTyp.includes('same-city'), `Stadtinhalt blieb nach dem Typwechsel: ${nachTyp}`)
  pruefe((await gyg.getAttribute('data-gyg-phase')) !== 'anzeige', 'Typwechsel liess die alte Anzeige gelten')
  await flaeche.getByRole('button', { name: 'Bei GetYourGuide anzeigen' }).click()
  const regionText = await wartenAufText(page, '[data-szenario="gegenprobe"] [data-gyg-montage]', 'synthetic-public:same-region')
  pruefe(!regionText.includes('same-city'), `Region zeigt noch die Stadt: ${regionText}`)
  pruefe((await gyg.getAttribute('data-gyg-instanz')) === instanzStart, 'Typwechsel hat die Fläche neu erzeugt')

  await page.getByRole('button', { name: 'Tag A', exact: true }).click()
  await flaeche.getByRole('button', { name: 'Bei GetYourGuide anzeigen' }).click()
  await wartenAufText(page, '[data-szenario="gegenprobe"] [data-gyg-montage]', 'synthetic-public:map-a')
  const vorKennung = (await gegenLesen(page)).bestaetigt
  const vorEntsorgung = (await gegenLesen(page)).entsorgen
  await page.getByRole('button', { name: 'Kennung wechseln' }).click()
  const nachKennung = await wartenAufFrei(page, '[data-szenario="gegenprobe"] [data-gyg-montage]', 'result-synthetic')
  pruefe(!nachKennung.includes('result-synthetic'), `Kennungswechsel zeigt den alten Inhalt: ${nachKennung}`)
  pruefe((await gyg.getAttribute('data-gyg-phase')) === 'ruhend', 'Kennungswechsel hat ohne neue Aktion geladen')
  pruefe((await gegenLesen(page)).bestaetigt === vorKennung, 'Kennungswechsel hat die Ortsbestätigung wiederholt')
  await flaeche.getByRole('button', { name: 'Bei GetYourGuide anzeigen' }).click()
  await wartenAufText(page, '[data-szenario="gegenprobe"] [data-gyg-montage]', 'synthetic-public:map-b')
  const vorKlon = await gegenLesen(page)
  await page.getByRole('button', { name: 'Abbildung neu' }).click()
  await page.waitForTimeout(200)
  const nachKlon = await gegenLesen(page)
  pruefe((await textVon(page, '[data-szenario="gegenprobe"] [data-gyg-montage]')).includes('synthetic-public:map-b'), 'Gleiche Abbildung hat die Anzeige verworfen')
  pruefe(nachKlon.entsorgen === vorKlon.entsorgen, 'Gleiche Abbildung hat entsorgt')
  pruefe(nachKlon.bestaetigt === vorKlon.bestaetigt, 'Gleiche Abbildung hat neu bestätigt')
  pruefe((await gyg.getAttribute('data-gyg-phase')) === 'anzeige', 'Gleiche Abbildung hat die Phase zurückgesetzt')
  pruefe(vorEntsorgung >= 0, 'Entsorgung vor dem Kennungswechsel fehlt')

  await page.getByRole('button', { name: 'Zwei Länder' }).click()
  await flaeche.getByRole('radio', { name: 'Panama' }).waitFor({ timeout: 10000 })
  await flaeche.getByRole('radio', { name: 'Thailand' }).waitFor({ timeout: 10000 })
  const instanzLand = await gyg.getAttribute('data-gyg-instanz')
  await flaeche.getByRole('radio', { name: 'Panama' }).focus()
  await page.keyboard.press('Space')
  pruefe((await flaeche.getByRole('radio').count()) === 2, 'Nach der Länderwahl fehlen die Auswahlen')
  await flaeche.getByRole('button', { name: 'Bei GetYourGuide anzeigen' }).click()
  await wartenAufText(page, '[data-szenario="gegenprobe"] [data-gyg-montage]', 'synthetic-public:panama')
  pruefe((await flaeche.getByRole('radio').count()) === 2, 'Während der Anzeige fehlen die Länder')
  await page.getByRole('button', { name: 'Abschluss wirft' }).click()
  await flaeche.getByRole('button', { name: 'Erneut laden' }).click()
  await flaeche.getByText('GetYourGuide konnte gerade nicht geladen werden.').waitFor({ timeout: 5000 })
  const nachWurf = await flaeche.innerText()
  pruefe(!nachWurf.includes('private.example'), `Fehlertext enthält eine Adresse: ${nachWurf}`)
  pruefe(!nachWurf.includes('widget-token'), 'Fehlertext enthält den Ausnahmefehler')
  pruefe((await flaeche.getByRole('radio').count()) === 2, 'Nach dem Fehler fehlen die Länder')
  pruefe((await gyg.getAttribute('data-gyg-phase')) === 'fehler', 'Synchrone Ausnahme blieb hängen')
  await page.getByRole('button', { name: 'Abschluss hängt spät' }).click()
  await flaeche.getByRole('radio', { name: 'Thailand' }).focus()
  await page.keyboard.press('Space')
  const nachLand = await wartenAufFrei(page, '[data-szenario="gegenprobe"] [data-gyg-montage]', 'synthetic-public:panama')
  pruefe(!nachLand.includes('synthetic-public:panama'), `Länderwechsel zeigt Panama weiter: ${nachLand}`)
  pruefe((await gyg.getAttribute('data-gyg-instanz')) === instanzLand, 'Länderwechsel hat die Reise neu erzeugt')
  await flaeche.getByRole('button', { name: 'Bei GetYourGuide anzeigen' }).click()
  await wartenAufText(page, '[data-szenario="gegenprobe"] [data-gyg-montage]', 'synthetic-public:thailand')
  await page.getByRole('button', { name: 'Panama-Abbildung aus' }).click()
  await flaeche.getByRole('radio', { name: 'Panama' }).focus()
  await page.keyboard.press('Space')
  await flaeche.getByText('noch keine geprüfte Zuordnung').waitFor({ timeout: 5000 })
  pruefe((await flaeche.getByRole('radio').count()) === 2, 'Ohne Abbildung fehlen die Länder')
  pruefe((await gyg.getAttribute('data-gyg-instanz')) === instanzLand, 'Abbildungswechsel hat die Fläche neu erzeugt')

  await page.setViewportSize({ width: 320, height: 720 })
  const schmal = await ueberlauf(page)
  pruefe(schmal.length === 0, `Überlauf Gegenprobe 320: ${schmal.join(' | ')}`)
  await schiessen(page, 'gegenprobe-320')
  await page.setViewportSize({ width: 390, height: 844 })
  await schiessen(page, 'gegenprobe-390')
  await page.setViewportSize({ width: 1440, height: 900 })
  await schiessen(page, 'gegenprobe-1440')
  await page.setViewportSize({ width: 390, height: 844 })
  await page.addStyleTag({ content: 'html { font-size: 32px !important; }' })
  const gross = await ueberlauf(page)
  pruefe(gross.length === 0, `Überlauf Gegenprobe 200%: ${gross.join(' | ')}`)
  await schiessen(page, 'gegenprobe-390-200')
  await page.addStyleTag({ content: 'html { font-size: 16px !important; }' })

  await page.getByRole('button', { name: 'Panama-Abbildung an' }).click()
  await flaeche.getByRole('radio', { name: 'Panama' }).focus()
  await page.keyboard.press('Space')
  await page.getByRole('button', { name: 'Entsorgung wirft' }).click()
  await page.getByRole('button', { name: 'Tag A', exact: true }).click()
  const nachEntsorgung = await textVon(page, '[data-szenario="gegenprobe"]')
  pruefe(!nachEntsorgung.includes('private.example'), 'Entsorgungsfehler bleibt sichtbar')
  pruefe(!nachEntsorgung.includes('result-synthetic'), 'Entsorgungsfehler hat alten Inhalt eingehängt')
  const nativeNachher = await page.locator('[data-szenario="nativ"]').innerText()
  pruefe(nativeNachher.includes('Synthetische Bootsfahrt'), 'Native Karte fehlt nach dem GetYourGuide-Fehler')
  pruefe(nativeNachher.includes('noch nicht eingerichtet'), 'Native GetYourGuide-Fläche ist nicht geschlossen')

  const vorEntzug = (await gegenLesen(page)).bestaetigt
  await page.getByRole('button', { name: 'Bestätigung verzögern' }).click()
  await flaeche.getByText('Das Ziel wird bestätigt.').waitFor({ timeout: 5000 })
  await page.getByRole('button', { name: 'Berechtigung zurückziehen' }).click()
  await page.waitForTimeout(1000)
  pruefe((await gyg.getAttribute('data-gyg-zustand')) === 'geschlossen', 'Entzogene Berechtigung bestätigt weiter')
  pruefe((await gegenLesen(page)).bestaetigt === vorEntzug + 1, 'Entzogene Berechtigung hat erneut bestätigt')
  const textEntzug = await flaeche.innerText()
  pruefe(!textEntzug.includes('private.example'), 'Entzug zeigt eine Adresse')
  pruefe(!textEntzug.includes('Bei GetYourGuide anzeigen'), 'Entzug bietet das Laden an')
  await page.getByRole('button', { name: 'Berechtigung wieder geben' }).click()
  await flaeche.getByRole('button', { name: 'Bei GetYourGuide anzeigen' }).waitFor({ timeout: 8000 })
  pruefe((await gegenLesen(page)).bestaetigt > vorEntzug + 1, 'Neue Berechtigung hat die alte Antwort wiederverwendet')

  await page.getByRole('button', { name: 'Bestätigung ablehnen' }).click()
  await flaeche.getByText('Das Ziel konnte gerade nicht bestätigt werden.').waitFor({ timeout: 5000 })
  const ablehnung = await flaeche.innerText()
  pruefe(!ablehnung.includes('private.example'), 'Ablehnung zeigt die Ausnahme')
  pruefe(!ablehnung.includes('places-token'), 'Ablehnung zeigt den Token-Text')
  await page.getByRole('button', { name: 'Bestätigung gelingt' }).click()
  await flaeche.getByRole('button', { name: 'Bei GetYourGuide anzeigen' }).waitFor({ timeout: 8000 })

  const vorAblehnung = (await gegenLesen(page)).entsorgen
  await page.getByRole('button', { name: 'Ergebnis lehnt ab' }).click()
  await flaeche.getByRole('button', { name: 'Bei GetYourGuide anzeigen' }).click()
  await flaeche.getByText('GetYourGuide konnte gerade nicht geladen werden.').waitFor({ timeout: 5000 })
  await page.waitForTimeout(80)
  const nachAblehnung = await gegenLesen(page)
  const probe = nachAblehnung.ablehnung
  pruefe(Boolean(probe), 'Ablehnung hat keinen Nachweis')
  if (probe) {
    pruefe(probe.vorAbbruch === false && probe.vorVerbunden === true, 'Ablehnung startete nicht verbunden und offen')
    pruefe(probe.nachAbbruch === true, 'Abgelehntes Signal blieb offen')
    pruefe(probe.nachVerbunden === false, 'Abgelehnter Knoten blieb verbunden')
    pruefe(probe.entsorgenDanach === probe.entsorgenDavor + 1, `Ablehnung entsorgte ${probe.entsorgenDanach - probe.entsorgenDavor} mal`)
    pruefe(probe.zuhoerer === 1, `Abort-Zuhörer lief ${probe.zuhoerer} mal`)
    pruefe(probe.nachher === 0, 'Abgelehntes Signal nahm einen weiteren Aufruf an')
  }
  pruefe(nachAblehnung.entsorgen === vorAblehnung + 1, 'Ablehnung wartete auf den nächsten Versuch')
  const ablehnungText = await textVon(page, '[data-szenario="gegenprobe"]')
  pruefe(!ablehnungText.includes('adapter-token'), 'Ablehnung zeigt den Adaptertext')
  pruefe(!ablehnungText.includes('private.example'), 'Ablehnung zeigt eine Adresse')
  pruefe(!ablehnungText.includes('after-decline'), 'Späte Schreibung blieb in der Fläche')
  pruefe((await gyg.getAttribute('data-gyg-phase')) === 'fehler', 'Abgelehnte Ladung blieb in der Laufphase')
  pruefe((await textVon(page, '[data-szenario="gegenprobe"] [data-gyg-montage]')).trim() === '', 'Abgelehnter Knoten blieb in der Montage')

  await page.getByRole('button', { name: 'Abschluss hängt spät' }).click()
  await flaeche.getByRole('button', { name: 'Erneut versuchen' }).click()
  await wartenAufText(page, '[data-szenario="gegenprobe"] [data-gyg-montage]', 'result-synthetic:')

  const vorWurf = (await gegenLesen(page)).entsorgen
  await page.getByRole('button', { name: 'Ablehnung wirft bei Entsorgung' }).click()
  await flaeche.getByRole('button', { name: 'Erneut laden' }).click()
  await flaeche.getByText('GetYourGuide konnte gerade nicht geladen werden.').waitFor({ timeout: 5000 })
  await page.waitForTimeout(80)
  const nachWurfAblehnung = await gegenLesen(page)
  const wurfText = await textVon(page, '[data-szenario="gegenprobe"]')
  pruefe(
    nachWurfAblehnung.ablehnung?.entsorgenDanach === (nachWurfAblehnung.ablehnung?.entsorgenDavor ?? 0) + 1,
    'Die abgelehnte Ladung wurde nicht genau einmal entsorgt',
  )
  pruefe(nachWurfAblehnung.entsorgen === vorWurf + 2, 'Erneutes Laden hat die sichtbare und die abgelehnte Ladung nicht entsorgt')
  pruefe(nachWurfAblehnung.ablehnung?.nachVerbunden === false, 'Werfende Entsorgung hängte den Knoten wieder ein')
  pruefe(!wurfText.includes('private.example'), 'Werfende Entsorgung zeigt eine Adresse')
  pruefe(!wurfText.includes('after-decline'), 'Werfende Entsorgung liess die späte Schreibung stehen')
  pruefe((await gyg.getAttribute('data-gyg-phase')) === 'fehler', 'Werfende Ablehnung blieb hängen')

  const vorSpaet = (await gegenLesen(page)).entsorgen
  await page.getByRole('button', { name: 'Ablehnung kommt spät' }).click()
  await flaeche.getByRole('button', { name: 'Erneut versuchen' }).click()
  await page.getByRole('button', { name: 'Tag B', exact: true }).click()
  const nachWechsel = (await gegenLesen(page)).entsorgen
  pruefe(nachWechsel > vorSpaet, 'Der Wechsel hat die alte Ablehnung nicht entsorgt')
  await flaeche.getByRole('button', { name: 'Bei GetYourGuide anzeigen' }).click()
  await wartenAufText(page, '[data-szenario="gegenprobe"] [data-gyg-montage]', 'synthetic-public:phuket-city')
  const beiAnzeige = (await gegenLesen(page)).entsorgen
  await page.waitForTimeout(700)
  const nachSpaet = await gegenLesen(page)
  pruefe(nachSpaet.entsorgen === beiAnzeige, 'Verspätete Ablehnung hat die neue Ladung entsorgt')
  pruefe((await gyg.getAttribute('data-gyg-phase')) === 'anzeige', 'Verspätete Ablehnung hat die neue Anzeige verworfen')
  pruefe((await textVon(page, '[data-szenario="gegenprobe"] [data-gyg-montage]')).includes('synthetic-public:phuket-city'), 'Verspätete Ablehnung hat Phuket ersetzt')

  await page.getByRole('button', { name: 'Bestätigung verzögern' }).click()
  await flaeche.getByText('Das Ziel wird bestätigt.').waitFor({ timeout: 5000 })
  await page.getByRole('button', { name: 'Fläche entfernen' }).click()
  await page.waitForTimeout(1000)
  pruefe((await page.locator('[data-entfernt="ja"]').count()) === 1, 'Entfernte Fläche blieb stehen')
  await page.getByRole('button', { name: 'Fläche wieder zeigen' }).click()
  await flaeche.getByRole('button', { name: 'Bei GetYourGuide anzeigen' }).waitFor({ timeout: 8000 })
  pruefe((await textVon(page, '[data-szenario="gegenprobe"] [data-gyg-montage]')).includes('result-synthetic') === false, 'Neue Fläche zeigt eine alte Auflösung')
  pruefe(await page.locator('[data-szenario="nativ"]').innerText().then((text) => text.includes('Synthetische Bootsfahrt')), 'Native Karte fehlt am Ende')
}

function lesen(page: Page): Promise<Bericht> {
  return page.evaluate(`(() => {
    const stand = window.__gyg
    return stand || { laden: 0, entsorgen: 0, abgebrochen: 0, bezuege: [] }
  })()`)
}

haupt().catch((error: unknown) => {
  console.error(error)
  process.exit(1)
})
