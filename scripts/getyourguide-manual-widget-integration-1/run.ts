// scripts/getyourguide-manual-widget-integration-1/run.ts
//
// Öffentliche Widget-Prüfung. Kein privater Trip, kein Secret, kein Kauf.
// Aufruf: node --import tsx scripts/getyourguide-manual-widget-integration-1/run.ts

import { spawnSync } from 'node:child_process'
import { createServer, type IncomingMessage } from 'node:http'
import { createRequire } from 'node:module'
import { mkdirSync, readFileSync, writeFileSync } from 'node:fs'
import { dirname, join, resolve } from 'node:path'
import { fileURLToPath } from 'node:url'

import { chromium, type Page } from 'playwright'

import { embedAntwort } from '@/lib/activities/getyourguide/dokument'

const require = createRequire(import.meta.url)
const esbuild = require('esbuild') as {
  build: (options: Record<string, unknown>) => Promise<void>
}

const ROOT = resolve(dirname(fileURLToPath(import.meta.url)), '../..')
const OUT = '/tmp/gyg-manual-widget'
const ARTIFACTS = '/opt/cursor/artifacts/gyg-manual-widget'
const KANARIEN = 'kanarien-private-reise-7f3a'

const fehler: string[] = []
const netz: { phase: string; host: string; path: string }[] = []
let phase = 'vorher'

function pruefe(bedingung: boolean, meldung: string) {
  if (!bedingung) fehler.push(meldung)
}

function dateiAufloesen(basis: string): string | null {
  const kandidaten = [basis, `${basis}.ts`, `${basis}.tsx`, `${basis}.js`, `${basis}.mjs`]
  const { existsSync } = require('node:fs') as typeof import('node:fs')
  return kandidaten.find((kandidat) => existsSync(kandidat)) ?? null
}

function html(): string {
  return `<!doctype html>
<html lang="de">
<head>
  <meta charset="utf-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1" />
  <title>Prüfung ${KANARIEN}</title>
  <link rel="stylesheet" href="/app.css" />
</head>
<body>
  <div id="root"></div>
  <script src="/flaeche.js"></script>
</body>
</html>`
}

async function bundeln(css: string) {
  mkdirSync(OUT, { recursive: true })
  await esbuild.build({
    absWorkingDir: ROOT,
    entryPoints: { flaeche: 'scripts/getyourguide-manual-widget-integration-1/flaeche.tsx' },
    bundle: true,
    format: 'iife',
    platform: 'browser',
    target: 'es2022',
    jsx: 'automatic',
    outfile: join(OUT, 'flaeche.js'),
    define: { 'process.env.NODE_ENV': '"development"' },
    plugins: [
      {
        name: 'jetnity-alias',
        setup(build: {
          onResolve: (
            args: { filter: RegExp },
            fn: (args: { path: string }) => { path: string } | null,
          ) => void
        }) {
          build.onResolve({ filter: /^@\/lib\/places\/aktionen$/ }, () => ({
            path: join(ROOT, 'scripts/getyourguide-manual-widget-integration-1/aktionen-stub.ts'),
          }))
          build.onResolve({ filter: /^server-only$/ }, () => ({
            path: join(ROOT, 'scripts/server-only-empty.js'),
          }))
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
  const lauf = spawnSync(join(ROOT, 'node_modules/.bin/tailwindcss'), ['-i', 'styles/globals.css', '-o', ziel, '--minify'], {
    cwd: ROOT,
    encoding: 'utf8',
  })
  if (lauf.status !== 0) throw new Error(`Tailwind fehlgeschlagen\n${lauf.stdout}\n${lauf.stderr}`)
  return readFileSync(ziel, 'utf8')
}

function zuRequest(req: IncomingMessage, basis: string): Request {
  const url = new URL(req.url ?? '/', basis)
  const headers = new Headers()
  for (const [name, wert] of Object.entries(req.headers)) {
    if (typeof wert === 'string') headers.set(name, wert)
  }
  return new Request(url, { method: req.method, headers })
}

async function rahmenBild(page: Page, datei: string) {
  const ziel = page.locator('[data-szenario="wechsel"] iframe[title="GetYourGuide"], [data-szenario="land"] iframe[title="GetYourGuide"]').first()
  if (await ziel.count()) {
    await ziel.screenshot({ path: join(ARTIFACTS, datei) })
    return
  }
  await page.screenshot({ path: join(ARTIFACTS, datei), fullPage: true })
}

type Karte = { unten: number; oben: number; sicht: number }
type Angebot = {
  bilder: number
  links: string[]
  texte: string[]
  hoehe: { scroll: number; client: number } | null
  karten: Karte[]
}

async function kartenStand(page: Page): Promise<Karte[]> {
  const sammlung: Karte[] = []
  for (const frame of page.frames()) {
    if (!frame.url().includes('activities.frame')) continue
    const karten = await frame
      .evaluate(() =>
        [...document.querySelectorAll('a[href*="et="]')].map((anker) => {
          const box = (anker as HTMLElement).getBoundingClientRect()
          return { unten: Math.round(box.bottom), oben: Math.round(box.top), sicht: document.documentElement.clientHeight }
        }),
      )
      .catch(() => [] as Karte[])
    sammlung.push(...karten)
  }
  return sammlung
}

async function wartenAufAngebot(page: Page): Promise<Angebot> {
  const start = Date.now()
  let bilder = 0
  let links: string[] = []
  let texte: string[] = []
  let hoehe: Angebot['hoehe'] = null
  while (Date.now() - start < 25000) {
    const frames = page.frames().filter((frame) => frame.url().includes('getyourguide.com'))
    for (const frame of frames) {
      const stand = await frame
        .evaluate(() => {
          const bilder = [...document.images].filter((bild) => bild.naturalWidth > 40).length
          const knoten = [...document.querySelectorAll('a[href]')] as HTMLAnchorElement[]
          const links = knoten.map((anker) => anker.href).filter((href) => href.includes('getyourguide.com')).slice(0, 8)
          const texte = knoten.map((anker) => anker.innerText.replace(/\s+/g, ' ').trim()).filter(Boolean).slice(0, 8)
          return {
            bilder,
            links,
            texte,
            hoehe: { scroll: document.documentElement.scrollHeight, client: document.documentElement.clientHeight },
          }
        })
        .catch(() => null)
      if (!stand) continue
      bilder = Math.max(bilder, stand.bilder)
      if (stand.links.length > links.length) links = stand.links
      if (stand.texte.length > texte.length) texte = stand.texte
      if (!hoehe || stand.hoehe.scroll > hoehe.scroll) hoehe = stand.hoehe
    }
    if (bilder > 0 && links.length > 0) {
      const passend = await kartenStand(page)
      if (passend.length > 0 && passend.every((karte) => karte.unten <= karte.sicht + 1)) break
    }
    await page.waitForTimeout(500)
  }
  const rahmen = []
  for (const frame of page.frames()) {
    const mass = await frame
      .evaluate(() => ({
        scroll: document.documentElement.scrollHeight,
        client: document.documentElement.clientHeight,
        text: document.body?.innerText?.replace(/\s+/g, ' ').trim().slice(0, 420) ?? '',
        karten: [...document.querySelectorAll('a[href*="et="]')].map((anker) => {
          const box = (anker as HTMLElement).getBoundingClientRect()
          return { unten: Math.round(box.bottom), oben: Math.round(box.top), sicht: document.documentElement.clientHeight }
        }),
      }))
      .catch(() => null)
    if (mass) rahmen.push({ url: frame.url().slice(0, 180), ...mass })
  }
  writeFileSync(join(ARTIFACTS, `rahmen-${phase}.json`), JSON.stringify(rahmen, null, 2))
  const karten = rahmen.flatMap((eintrag) => eintrag.karten)
  return { bilder, links, texte, hoehe, karten }
}

function zielArt(url: string, text: string): 'ausfall' | 'suchliste' | 'angebot' | 'andere' {
  if (/An error occurred|We’ll be right back|We'll be right back/i.test(text)) return 'ausfall'
  const partner = /partner_id=2MQHT6Z|partner=2MQHT6Z/.test(url)
  if (!partner) return 'andere'
  const liste = /Ergebnisse|results|Aktivitäten|activities|weitere|See all|Alle Aktivitäten|\d+\s+(results|Ergebnisse)/i.test(text)
  const einzel = /Check availability|Verfügbarkeit prüfen|In den Warenkorb|Add to cart/i.test(text)
  if (liste) return 'suchliste'
  if (einzel) return 'angebot'
  return 'andere'
}

async function analyzerTick(page: Page) {
  const staende = []
  for (const frame of page.frames()) {
    const stand = await frame
      .evaluate(() => {
        const fenster = window as Window & { gygPAStatus?: unknown; __jetnityBeobachtung?: string[] }
        let speicher = 'nicht-gelesen'
        try {
          sessionStorage.getItem('jetnity-gyg-lesetest')
          speicher = 'lesbar'
        } catch (error) {
          speicher = `wirft ${String(error).slice(0, 140)}`
        }
        return {
          hostname: location.hostname,
          script: Boolean(document.querySelector('script[src*="pa.umd.production.min.js"]')),
          status: fenster.gygPAStatus === undefined ? null : String(fenster.gygPAStatus).slice(0, 40),
          speicher,
          beobachtung: (fenster.__jetnityBeobachtung ?? []).slice(0, 8),
        }
      })
      .catch(() => null)
    if (!stand) continue
    staende.push({ url: frame.url().slice(0, 140), ...stand })
  }
  return staende
}

async function produktOeffnen(
  page: Page,
  bild: string,
): Promise<{ url: string; titel: string; text: string; h1: string } | null> {
  for (const frame of page.frames()) {
    if (!frame.url().includes('getyourguide.com')) continue
    const link = frame.locator('a[href*="et="]').first()
    if ((await link.count()) === 0) continue
    const popup = page.context().waitForEvent('page', { timeout: 20000 }).catch(() => null)
    await link.click({ timeout: 8000 })
    const fenster = await popup
    if (!fenster) return { url: frame.url(), titel: '', text: '', h1: '' }
    await fenster.waitForLoadState('domcontentloaded').catch(() => undefined)
    await fenster.waitForTimeout(2500)
    let text = (await fenster.locator('body').innerText().catch(() => '')).replace(/\s+/g, ' ').trim()
    if (/An error occurred/i.test(text)) {
      await fenster.reload({ waitUntil: 'domcontentloaded' }).catch(() => undefined)
      await fenster.waitForTimeout(2500)
      text = (await fenster.locator('body').innerText().catch(() => '')).replace(/\s+/g, ' ').trim()
    }
    await fenster.screenshot({ path: join(ARTIFACTS, bild) }).catch(() => undefined)
    const h1 = (await fenster.locator('h1').first().innerText().catch(() => '')).replace(/\s+/g, ' ').trim().slice(0, 180)
    const ergebnis = { url: fenster.url(), titel: await fenster.title(), text: text.slice(0, 400), h1 }
    await fenster.close().catch(() => undefined)
    return ergebnis
  }
  return null
}

async function ausschnitt375(page: Page, szenario: string) {
  const aussen = await page.evaluate((name) => {
    const vorfahre = document.querySelector(`[data-szenario="${name}"]`)
    const rahmen = vorfahre?.querySelector('iframe')
    if (!(vorfahre instanceof HTMLElement) || !(rahmen instanceof HTMLElement)) return { fehlt: true }
    const a = rahmen.getBoundingClientRect()
    const b = vorfahre.getBoundingClientRect()
    const stil = getComputedStyle(vorfahre)
    return {
      fehlt: false,
      rahmen: { breite: Math.round(a.width), hoehe: Math.round(a.height) },
      vorfahre: { breite: Math.round(b.width), hoehe: Math.round(b.height), overflowY: stil.overflowY },
      ragtSeitlich: a.left < b.left - 1 || a.right > b.right + 1,
      ragtUnten: a.bottom > b.bottom + 1,
    }
  }, szenario)
  const innen = []
  for (const frame of page.frames()) {
    if (!frame.url().includes('/embed/getyourguide') && !frame.url().includes('activities.frame')) continue
    const mass = await frame
      .evaluate(() => {
        const widget = document.querySelector('iframe')
        const karten = [...document.querySelectorAll('a[href*="et="]')].map((anker) => {
          const box = (anker as HTMLElement).getBoundingClientRect()
          return { oben: Math.round(box.top), unten: Math.round(box.bottom) }
        })
        return {
          scroll: document.documentElement.scrollHeight,
          client: document.documentElement.clientHeight,
          widgetHoehe: widget instanceof HTMLElement ? Math.round(widget.getBoundingClientRect().height) : 0,
          karten,
        }
      })
      .catch(() => null)
    if (mass) innen.push({ url: frame.url().slice(0, 100), ...mass })
  }
  return { aussen, innen }
}

async function main() {
  mkdirSync(ARTIFACTS, { recursive: true })
  const css = cssBauen()
  await bundeln(css)
  const server = createServer(async (req, res) => {
    const url = new URL(req.url ?? '/', 'http://127.0.0.1')
    if (url.pathname === '/embed/getyourguide') {
      const adresse = `${url.search}${req.url ?? ''}`
      if (adresse.includes(KANARIEN)) fehler.push('Kanarienvogel steht in der Einbettungsadresse')
      const cookie = req.headers.cookie ?? ''
      const ziel = req.headers['sec-fetch-dest'] ?? ''
      if (ziel === 'iframe' && cookie.includes(KANARIEN)) fehler.push('Kanarienvogel steht im Cookie der gerahmten Einbettung')
      const antwort = embedAntwort(zuRequest(req, 'http://127.0.0.1'))
      const body = Buffer.from(await antwort.arrayBuffer())
      if (body.includes(Buffer.from(KANARIEN))) fehler.push('Kanarienvogel steht im Einbettungsdokument')
      res.writeHead(antwort.status, Object.fromEntries(antwort.headers.entries()))
      res.end(body)
      return
    }
    if (url.pathname === '/api/activities/search') {
      res.writeHead(200, { 'content-type': 'application/json; charset=utf-8' })
      res.end(JSON.stringify({
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
          locationName: 'Lissabon',
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
    if (url.pathname === '/flaeche.js') {
      res.writeHead(200, { 'content-type': 'text/javascript; charset=utf-8' })
      res.end(readFileSync(join(OUT, 'flaeche.js')))
      return
    }
    if (url.pathname === '/app.css') {
      res.writeHead(200, { 'content-type': 'text/css; charset=utf-8' })
      res.end(readFileSync(join(OUT, 'app.css')))
      return
    }
    if (url.pathname === '/') {
      res.writeHead(200, { 'content-type': 'text/html; charset=utf-8' })
      res.end(html())
      return
    }
    res.writeHead(404)
    res.end('fehlt')
  })
  await new Promise<void>((resolve) => server.listen(0, '127.0.0.1', () => resolve()))
  const adresse = server.address()
  if (!adresse || typeof adresse === 'string') throw new Error('Port fehlt')
  const basis = `http://127.0.0.1:${adresse.port}`

  const browser = await chromium.launch({ headless: true, args: ['--no-sandbox', '--disable-dev-shm-usage'] })
  const context = await browser.newContext()
  await context.addInitScript(`(() => {
    const merken = (art, wert) => {
      const liste = (window.__jetnityBeobachtung = window.__jetnityBeobachtung || [])
      if (liste.length < 12) liste.push(art + ': ' + String(wert).slice(0, 220))
    }
    addEventListener('error', (event) => merken('error', event.message))
    addEventListener('unhandledrejection', (event) => merken('unhandledrejection', event.reason))
  })()`)
  const page = await context.newPage()
  page.on('request', (request) => {
    try {
      const url = new URL(request.url())
      netz.push({ phase, host: url.host, path: url.pathname })
      if (request.url().includes(KANARIEN) && url.pathname === '/embed/getyourguide') {
        fehler.push(`Kanarienvogel in Einbettungsanfrage während ${phase}`)
      }
      if (url.host.includes('getyourguide') && request.url().includes(KANARIEN)) {
        fehler.push(`Kanarienvogel in Anbieteranfrage während ${phase}`)
      }
    } catch {
      fehler.push('Anfrage ohne gültige Adresse')
    }
  })
  const konsole: string[] = []
  const seitenfehler: string[] = []
  page.on('console', (msg) => {
    if (msg.type() === 'error') konsole.push(msg.text().slice(0, 300))
  })
  page.on('pageerror', (error) => {
    const text = String(error).slice(0, 300)
    seitenfehler.push(text)
    konsole.push(text)
  })

  await page.goto(`${basis}/?reise=${KANARIEN}`, { waitUntil: 'networkidle' })
  await page.evaluate((token) => {
    localStorage.setItem(token, '1')
    document.cookie = `${token}=1; path=/`
  }, KANARIEN)
  const vorher = netz.filter((eintrag) => eintrag.host.includes('getyourguide'))
  pruefe(vorher.length === 0, `Anbieteranfragen vor dem Anzeigen: ${vorher.length}`)
  pruefe((await page.locator('iframe').count()) === 0, 'Ein Rahmen existiert vor dem Anzeigen')
  pruefe(
    (await page.getByText('Ein Angebotsklick kann zunächst eine Ergebnisliste bei GetYourGuide öffnen.').count()) > 0,
    'Der Hinweis auf eine mögliche Ergebnisliste fehlt',
  )

  await page.locator('[data-szenario="nativ"]').getByRole('button', { name: 'Für diesen Tag suchen' }).click()
  await page.getByText('Synthetische Bootsfahrt').waitFor({ timeout: 8000 })
  const uebernehmen = page.locator('[data-szenario="nativ"]').getByRole('button', { name: /übernehmen/i })
  if (await uebernehmen.count()) await uebernehmen.first().click()

  phase = 'stadt'
  const laden = page.locator('[data-szenario="wechsel"]').getByRole('button', { name: 'Bei GetYourGuide anzeigen' })
  await laden.focus()
  await page.keyboard.press('Enter')
  const stadt = await wartenAufAngebot(page)
  const analyzer: Awaited<ReturnType<typeof analyzerTick>>[] = []
  for (let tick = 0; tick < 3; tick += 1) {
    analyzer.push(await analyzerTick(page))
    await page.waitForTimeout(2000)
  }
  await page.setViewportSize({ width: 1440, height: 900 })
  await rahmenBild(page, 'stadt-1440.png')
  await page.setViewportSize({ width: 768, height: 900 })
  await rahmenBild(page, 'stadt-768.png')
  await page.setViewportSize({ width: 390, height: 844 })
  await rahmenBild(page, 'stadt-390.png')
  await page.setViewportSize({ width: 320, height: 700 })
  await rahmenBild(page, 'stadt-320.png')
  await page.evaluate(() => {
    document.documentElement.style.fontSize = '32px'
  })
  await page.setViewportSize({ width: 390, height: 844 })
  await rahmenBild(page, 'stadt-390-200.png')
  await page.evaluate(() => {
    document.documentElement.style.fontSize = ''
  })
  pruefe(stadt.bilder > 0, `Lissabon zeigt keine Anbieterbilder (${stadt.bilder})`)
  pruefe(
    stadt.karten.length > 0 && stadt.karten.every((karte) => karte.unten <= karte.sicht + 1),
    `Angebotskarten ragen aus dem Anbieterrahmen: ${JSON.stringify(stadt.karten)}`,
  )
  await page.setViewportSize({ width: 375, height: 812 })
  let schnitt375 = await ausschnitt375(page, 'wechsel')
  const startHoehe = Date.now()
  while (Date.now() - startHoehe < 8000) {
    const embed = schnitt375.innen.find((eintrag) => eintrag.url.includes('/embed/getyourguide'))
    const widget = schnitt375.innen.find((eintrag) => eintrag.url.includes('activities.frame'))
    const tiefste = Math.max(0, ...(widget?.karten ?? []).map((karte) => karte.unten))
    if (embed && tiefste > 640 && embed.client + 8 >= tiefste && schnitt375.aussen.ragtUnten !== true) break
    await page.waitForTimeout(400)
    schnitt375 = await ausschnitt375(page, 'wechsel')
  }
  await page.screenshot({ path: join(ARTIFACTS, 'stadt-375.png'), fullPage: true })
  const embed375 = schnitt375.innen.find((eintrag) => eintrag.url.includes('/embed/getyourguide'))
  const widget375 = schnitt375.innen.find((eintrag) => eintrag.url.includes('activities.frame'))
  const tiefste375 = Math.max(0, ...(widget375?.karten ?? []).map((karte) => karte.unten))
  pruefe(
    Boolean(embed375) && tiefste375 > 640 && embed375!.client + 8 >= tiefste375 && schnitt375.aussen.ragtUnten !== true,
    `Bei 375px bleiben Angebote unter dem sichtbaren Rahmen: ${JSON.stringify(schnitt375)}`,
  )
  await page.setViewportSize({ width: 1440, height: 900 })
  const produkt = await produktOeffnen(page, 'produkt-aktion.png')
  const art = produkt ? zielArt(produkt.url, produkt.text) : 'andere'
  pruefe(
    art === 'suchliste' || art === 'angebot',
    `Der Angebotsklick öffnet kein beobachtbares GetYourGuide-Ziel mit Partner 2MQHT6Z. Art: ${art}. Gelandet: ${produkt?.url ?? 'keine Navigation'} Titel: ${produkt?.titel ?? ''} Text: ${produkt?.text ?? ''}`,
  )

  const beschnitt = await page.evaluate(() => {
    const rahmen = document.querySelector('[data-szenario="wechsel"] iframe')
    const vorfahre = document.querySelector('[data-szenario="wechsel"]')
    if (!rahmen || !vorfahre) return 'Rahmen fehlt'
    const a = rahmen.getBoundingClientRect()
    const b = vorfahre.getBoundingClientRect()
    if (a.width < 40 || a.height < 40) return `Rahmen zu klein ${Math.round(a.width)}x${Math.round(a.height)}`
    if (a.left < b.left - 1 || a.right > b.right + 1) return 'Rahmen ragt seitlich aus dem Vorfahren'
    return ''
  })
  pruefe(beschnitt === '', beschnitt)

  phase = 'entfernt'
  await page.setViewportSize({ width: 1280, height: 800 })
  const entfernen = page.locator('[data-szenario="wechsel"]').getByRole('button', { name: 'Entfernen' })
  await entfernen.focus()
  await page.keyboard.press('Enter')
  await page.waitForTimeout(300)
  pruefe((await page.locator('[data-szenario="wechsel"] iframe').count()) === 0, 'Entfernen lässt den Rahmen stehen')
  pruefe((await page.getByText('Synthetische Bootsfahrt').count()) === 1, 'Native Karte fehlt nach dem Entfernen')

  phase = 'kreta'
  await page.getByRole('button', { name: 'Tag Kreta' }).click()
  pruefe((await page.locator('[data-szenario="wechsel"] iframe').count()) === 0, 'Zielwechsel lädt ohne neue Aktion')
  await page.locator('[data-szenario="wechsel"]').getByRole('button', { name: 'Bei GetYourGuide anzeigen' }).click()
  const insel = await wartenAufAngebot(page)
  await page.setViewportSize({ width: 1440, height: 900 })
  await rahmenBild(page, 'insel-1440.png')
  const inselZiel = await produktOeffnen(page, 'produkt-insel.png')
  await page.locator('[data-szenario="wechsel"]').getByRole('button', { name: 'Entfernen' }).click()
  await page.getByRole('button', { name: 'Tag Lissabon' }).click()
  pruefe((await page.locator('[data-szenario="wechsel"] iframe').count()) === 0, 'Rückwechsel belebt den alten Rahmen')

  phase = 'land'
  await page.locator('[data-szenario="land"]').getByRole('button', { name: 'Bei GetYourGuide anzeigen' }).click()
  const land = await wartenAufAngebot(page)
  await rahmenBild(page, 'land-1440.png')
  const landZiel = await produktOeffnen(page, 'produkt-land.png')
  await page.screenshot({ path: join(ARTIFACTS, 'nativ-und-land.png'), fullPage: true })

  phase = 'direkt'
  const direkt = await context.newPage()
  await direkt.goto(`${basis}/embed/getyourguide?umfang=stadt&code=PT&name=Lissabon`, { waitUntil: 'domcontentloaded' })
  const direktText = await direkt.content()
  pruefe(direktText.includes('nur nach dem Anzeigen'), 'Direktaufruf ist nicht inaktiv')
  pruefe(!direktText.includes('pa.umd.production.min.js'), 'Direktaufruf enthält den Analyzer')
  await direkt.screenshot({ path: join(ARTIFACTS, 'direkt-inaktiv.png') })

  const anbieter = netz.filter((eintrag) => eintrag.host.includes('getyourguide'))
  const bericht = {
    bilder: { stadt: stadt.bilder, insel: insel.bilder, land: land.bilder },
    texte: { stadt: stadt.texte, insel: insel.texte, land: land.texte },
    hoehe: { stadt: stadt.hoehe, insel: insel.hoehe, land: land.hoehe },
    produkt: produkt?.url ?? null,
    produktTitel: produkt?.titel ?? null,
    produktText: produkt?.text ?? null,
    produktH1: produkt?.h1 ?? null,
    inselZiel: inselZiel,
    landZiel: landZiel,
    schnitt375,
    zielArt: art,
    v2Navigation: art === 'suchliste' || art === 'angebot',
    v1Abschnitt93: art === 'angebot' ? 'eine beobachtete Angebotsseite, kein Abschluss von V1 9.3' : 'nicht erfüllt',
    karten: { stadt: stadt.karten, insel: insel.karten, land: land.karten },
    links: { stadt: stadt.links, insel: insel.links, land: land.links },
    anbieterVorKlick: vorher.length,
    anbieterGesamt: anbieter.length,
    hosts: [...new Set(anbieter.map((eintrag) => eintrag.host))],
    analyzerSkript: anbieter.filter((eintrag) => eintrag.path.includes('pa.umd')).map((eintrag) => eintrag.path),
    telemetry: anbieter.filter((eintrag) => eintrag.host.startsWith('collector.')).length,
    analyzer,
    seitenfehler: seitenfehler.slice(0, 12),
    konsole: konsole.slice(0, 20),
    fehler,
  }
  writeFileSync(join(ARTIFACTS, 'bericht.json'), JSON.stringify(bericht, null, 2))
  await browser.close()
  server.close()
  if (fehler.length > 0) {
    console.error(fehler.join('\n'))
    process.exitCode = 1
  } else {
    console.log(`GetYourGuide-Prüfung grün. Bilder Stadt ${stadt.bilder}, Insel ${insel.bilder}, Land ${land.bilder}.`)
  }
}

main().catch((error) => {
  console.error(error)
  process.exitCode = 1
})
