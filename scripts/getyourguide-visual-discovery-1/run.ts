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
    if (pfad === '/anwendung.js' || pfad === '/pruefung.js') {
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
  await page.waitForSelector('text=synthetische Prüfung ist fehlgeschlagen')
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

function lesen(page: Page): Promise<Bericht> {
  return page.evaluate(`(() => {
    const stand = window.__gyg
    return stand || { laden: 0, entsorgen: 0, abgebrochen: 0, bezuege: [] }
  })()`)
}

haupt().catch((error: unknown) => {
  console.error(error)
  process.exitCode = 1
})
