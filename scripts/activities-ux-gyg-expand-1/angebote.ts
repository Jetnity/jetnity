// Öffentliche manuelle Widget-Prüfung für 12 und 24.
// Zählt nur in dieser QA. Kein Laufzeitkatalog, kein Secret, kein Kauf.
// Aufruf: node --import tsx scripts/activities-ux-gyg-expand-1/angebote.ts

import { spawnSync } from 'node:child_process'
import { createServer, type IncomingMessage } from 'node:http'
import { createRequire } from 'node:module'
import { mkdirSync, readFileSync, writeFileSync } from 'node:fs'
import { dirname, join, resolve } from 'node:path'
import { fileURLToPath } from 'node:url'

import { chromium, type Page } from 'playwright'

import { embedAntwort } from '@/lib/activities/getyourguide/dokument'

const require = createRequire(import.meta.url)
const esbuild = require('esbuild') as { build: (options: Record<string, unknown>) => Promise<void> }
const ROOT = resolve(dirname(fileURLToPath(import.meta.url)), '../..')
const OUT = '/tmp/activities-ux-gyg-expand-1-angebote'
const ARTIFACTS = '/opt/cursor/artifacts/activities-ux-gyg-expand-1'
const KANARIEN = 'private-canary-ux-gyg-expand-1'
const PARTNER = '2MQHT6Z'

function dateiAufloesen(basis: string): string | null {
  const { existsSync, statSync } = require('node:fs') as typeof import('node:fs')
  const kandidaten = ['.ts', '.tsx', '.js', '.mjs'].flatMap((endung) => [basis + endung, join(basis, `index${endung}`)])
  return kandidaten.find((kandidat) => existsSync(kandidat) && statSync(kandidat).isFile()) ?? null
}

function zuRequest(req: IncomingMessage, basis: string): Request {
  const url = new URL(req.url ?? '/', basis)
  const headers = new Headers()
  for (const [name, wert] of Object.entries(req.headers)) {
    if (typeof wert === 'string') headers.set(name, wert)
  }
  return new Request(url, { method: req.method, headers })
}

function cssBauen() {
  const ziel = join(OUT, 'tailwind.css')
  mkdirSync(OUT, { recursive: true })
  const lauf = spawnSync(join(ROOT, 'node_modules/.bin/tailwindcss'), ['-i', 'styles/globals.css', '-o', ziel, '--minify'], {
    cwd: ROOT,
    encoding: 'utf8',
  })
  if (lauf.status !== 0) throw new Error(`Tailwind fehlgeschlagen\n${lauf.stdout}\n${lauf.stderr}`)
  return readFileSync(ziel, 'utf8')
}

async function bundeln() {
  await esbuild.build({
    absWorkingDir: ROOT,
    entryPoints: { angebote: 'scripts/activities-ux-gyg-expand-1/angebote-flaeche.tsx' },
    bundle: true,
    format: 'iife',
    platform: 'browser',
    target: 'es2022',
    jsx: 'automatic',
    outfile: join(OUT, 'angebote.js'),
    define: { 'process.env.NODE_ENV': '"production"' },
    plugins: [
      {
        name: 'jetnity-alias',
        setup(build: { onResolve: (args: { filter: RegExp }, fn: (args: { path: string }) => { path: string } | null) => void }) {
          build.onResolve({ filter: /^@\/lib\/places\/aktionen$/ }, () => ({
            path: join(ROOT, 'scripts/activities-ux-gyg-expand-1/orte-stub.ts'),
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
}

type Messung = {
  phase: string | null
  anzahlAttribut: string | null
  karten: number
  bilder: number
  oben: number | null
  unten: number | null
  rohPx: number | null
  rahmenPx: number | null
  rahmenSrc: string | null
  sandbox: string | null
  partnerImElternpfad: boolean
  kanarienImElternpfad: boolean
  numberOfItems: string | null
  partnerImDokument: string | null
  rahmenStil: string | null
  rahmenClient: number | null
}

function passt(url: string, name: string): boolean {
  if (name === 'bangkok') return url.includes('Bangkok')
  if (name === 'kreta') return url.includes('Kreta')
  if (name === 'portugal') return url.includes('Portugal') || (url.includes('umfang=land') && url.includes('code=PT'))
  return false
}

async function messen(page: Page, name: string): Promise<Messung> {
  const region = page.locator(`[data-szenario="${name}"]`)
  const rahmen = region.locator('iframe[title="GetYourGuide"]')
  const aussen = (await rahmen.count())
    ? await rahmen.evaluate((el) => {
        const iframe = el as HTMLIFrameElement
        const px = Number.parseFloat(iframe.style.height)
        return {
          phase: iframe.closest('[data-gyg-phase]')?.getAttribute('data-gyg-phase') ?? null,
          rahmenPx: Number.isFinite(px) ? Math.round(px) : null,
          rahmenStil: iframe.style.height,
          rahmenClient: iframe.clientHeight,
          rahmenSrc: iframe.getAttribute('src'),
          sandbox: iframe.getAttribute('sandbox'),
        }
      })
    : {
        phase: await region.locator('[data-gyg-phase]').getAttribute('data-gyg-phase'),
        rahmenPx: null,
        rahmenStil: null,
        rahmenClient: null,
        rahmenSrc: null,
        sandbox: null,
      }

  let innen: {
    karten: number
    bilder: number
    oben: number | null
    unten: number | null
    rohPx: number | null
    numberOfItems: string | null
    partnerImDokument: string | null
  } = {
    karten: 0,
    bilder: 0,
    oben: null,
    unten: null,
    rohPx: null,
    numberOfItems: null,
    partnerImDokument: null,
  }
  for (const frame of page.frames()) {
    if (!frame.url().includes('/embed/getyourguide') || !passt(frame.url(), name)) continue
    const stand = await frame
      .evaluate(() => {
        const widget = document.querySelector('iframe')
        const vater = widget?.parentElement as HTMLElement | null
        const treffer = /^([0-9]+(?:\.[0-9]+)?)px$/.exec(String(vater?.style.height || ''))
        const roh = treffer ? Math.round(Number(treffer[1])) : null
        return {
          karten: 0,
          bilder: [...document.images].filter((bild) => bild.naturalWidth > 40).length,
          oben: null as number | null,
          unten: null as number | null,
          rohPx: roh,
          numberOfItems: document.querySelector('[data-gyg-number-of-items]')?.getAttribute('data-gyg-number-of-items') ?? null,
          partnerImDokument: document.querySelector('[data-gyg-partner-id]')?.getAttribute('data-gyg-partner-id') ?? null,
        }
      })
      .catch(() => null)
    if (!stand) continue
    innen = { ...innen, ...stand, karten: innen.karten, bilder: Math.max(innen.bilder, stand.bilder) }
  }
  const widgetRahmen = page.frames().filter((frame) => frame.url().includes('activities.frame'))
  const benannte = widgetRahmen.filter((frame) => passt(frame.url(), name))
  const gezaehlt = benannte.length > 0 ? benannte : widgetRahmen.length === 1 ? widgetRahmen : []
  for (const frame of gezaehlt) {
    const stand = await frame
      .evaluate(() => {
        const gesehen = new Set<string>()
        const kanten: number[] = []
        for (const anker of document.querySelectorAll('a[href*="et="]')) {
          const href = (anker as HTMLAnchorElement).href
          let schluessel = href
          try {
            const url = new URL(href)
            schluessel = url.searchParams.get('et') || `${url.origin}${url.pathname}`
          } catch {
            schluessel = href
          }
          if (gesehen.has(schluessel)) continue
          gesehen.add(schluessel)
          kanten.push((anker as HTMLElement).getBoundingClientRect().top)
        }
        const bilder = [...document.images].filter((bild) => bild.naturalWidth > 40).length
        return {
          karten: gesehen.size,
          bilder,
          oben: kanten.length ? Math.round(Math.min(...kanten)) : null,
          unten: kanten.length ? Math.round(Math.max(...kanten)) : null,
        }
      })
      .catch(() => null)
    if (!stand) continue
    innen = {
      ...innen,
      karten: Math.max(innen.karten, stand.karten),
      bilder: Math.max(innen.bilder, stand.bilder),
      oben: stand.oben,
      unten: stand.unten,
    }
  }
  const src = aussen.rahmenSrc ?? ''
  return {
    phase: aussen.phase,
    anzahlAttribut: region.locator('[data-gyg-anzahl]').first() ? await region.locator('[data-gyg-anzahl]').getAttribute('data-gyg-anzahl') : null,
    karten: innen.karten,
    bilder: innen.bilder,
    oben: innen.oben,
    unten: innen.unten,
    rohPx: innen.rohPx,
    rahmenPx: aussen.rahmenPx,
    rahmenSrc: src ? src.split('?')[0] + (src.includes('anzahl=') ? `?anzahl=${new URLSearchParams(src.split('?')[1] ?? '').get('anzahl')}` : '') : null,
    sandbox: aussen.sandbox,
    partnerImElternpfad: src.includes(PARTNER),
    kanarienImElternpfad: src.includes(KANARIEN),
    numberOfItems: innen.numberOfItems,
    partnerImDokument: innen.partnerImDokument,
    rahmenStil: aussen.rahmenStil,
    rahmenClient: aussen.rahmenClient,
  }
}

async function warten(page: Page, name: string, mindest = 1, ruhe = 3): Promise<Messung> {
  const start = Date.now()
  let letzte: Messung | null = null
  let gleich = 0
  while (Date.now() - start < 40000) {
    const stand = await messen(page, name)
    const schluessel = `${stand.karten}|${stand.rohPx}|${stand.rahmenClient}|${stand.numberOfItems}`
    const vorher = letzte ? `${letzte.karten}|${letzte.rohPx}|${letzte.rahmenClient}|${letzte.numberOfItems}` : ''
    const hoeheFolgt = stand.rohPx != null && stand.rahmenClient != null && Math.abs(stand.rohPx - stand.rahmenClient) <= 2
    if (stand.karten > 0 && hoeheFolgt && schluessel === vorher) {
      gleich += 1
      if (gleich >= ruhe && (stand.karten >= mindest || Date.now() - start > 15000)) return stand
    } else {
      gleich = 0
    }
    letzte = stand
    await page.waitForTimeout(600)
  }
  return letzte ?? (await messen(page, name))
}

type Schnitt = {
  karten: number
  tiefste: number | null
  widgetClient: number | null
  widgetBreite: number | null
  seitlichKarte: boolean
  embedClient: number | null
  rahmenClient: number | null
  rohPx: number | null
  rahmenZahl: number
  vorfahreOverflow: string | null
  rahmenRagtUnten: boolean
  rahmenRagtSeitlich: boolean
  kartenUnterRahmen: boolean
  kartenUnterWidget: boolean
}

async function schnitt(page: Page, name: string): Promise<Schnitt> {
  const aussen = await page.evaluate((ziel) => {
    const vorfahre = document.querySelector(`[data-szenario="${ziel}"]`)
    const rahmen = vorfahre?.querySelector('iframe[title="GetYourGuide"]')
    if (!(vorfahre instanceof HTMLElement) || !(rahmen instanceof HTMLElement)) {
      return { fehlt: true as const, rahmenZahl: vorfahre?.querySelectorAll('iframe').length ?? 0 }
    }
    const a = rahmen.getBoundingClientRect()
    const b = vorfahre.getBoundingClientRect()
    const stil = getComputedStyle(vorfahre)
    return {
      fehlt: false as const,
      rahmenZahl: vorfahre.querySelectorAll('iframe').length,
      rahmenClient: Math.round(rahmen.clientHeight),
      vorfahreOverflow: `${stil.overflowX}/${stil.overflowY}`,
      rahmenRagtUnten: a.bottom > b.bottom + 1,
      rahmenRagtSeitlich: a.left < b.left - 1 || a.right > b.right + 1,
    }
  }, name)
  let innen: { karten: number; tiefste: number | null; widgetClient: number | null; widgetBreite: number | null; seitlichKarte: boolean } = {
    karten: 0,
    tiefste: null,
    widgetClient: null,
    widgetBreite: null,
    seitlichKarte: false,
  }
  const widgetRahmen = page.frames().filter((frame) => frame.url().includes('activities.frame'))
  const benannte = widgetRahmen.filter((frame) => passt(frame.url(), name))
  const gezaehlt = benannte.length > 0 ? benannte : widgetRahmen.length === 1 ? widgetRahmen : []
  for (const frame of gezaehlt) {
    const stand = await frame
      .evaluate(() => {
        const gesehen = new Set<string>()
        let tiefste = 0
        let seitlich = false
        const breite = document.documentElement.clientWidth
        for (const anker of document.querySelectorAll('a[href*="et="]')) {
          const box = (anker as HTMLElement).getBoundingClientRect()
          const href = (anker as HTMLAnchorElement).href
          let schluessel = href
          try {
            const url = new URL(href)
            schluessel = url.searchParams.get('et') || `${url.origin}${url.pathname}`
          } catch {
            schluessel = href
          }
          if (gesehen.has(schluessel)) continue
          gesehen.add(schluessel)
          tiefste = Math.max(tiefste, box.bottom)
          if (box.left < -2 || box.right > breite + 2) seitlich = true
        }
        return {
          karten: gesehen.size,
          tiefste: gesehen.size ? Math.round(tiefste) : null,
          widgetClient: document.documentElement.clientHeight,
          widgetBreite: breite,
          seitlichKarte: seitlich,
        }
      })
      .catch(() => null)
    if (!stand) continue
    if (stand.karten >= innen.karten) innen = stand
  }
  let embedClient: number | null = null
  let rohPx: number | null = null
  for (const frame of page.frames()) {
    if (!frame.url().includes('/embed/getyourguide') || !passt(frame.url(), name)) continue
    const stand = await frame
      .evaluate(() => {
        const widget = document.querySelector('iframe')
        const vater = widget?.parentElement as HTMLElement | null
        const treffer = /^([0-9]+(?:\.[0-9]+)?)px$/.exec(String(vater?.style.height || ''))
        return {
          embedClient: document.documentElement.clientHeight,
          rohPx: treffer ? Math.round(Number(treffer[1])) : null,
        }
      })
      .catch(() => null)
    if (!stand) continue
    embedClient = stand.embedClient
    rohPx = stand.rohPx
  }
  const rahmenClient = aussen.fehlt ? null : aussen.rahmenClient
  return {
    karten: innen.karten,
    tiefste: innen.tiefste,
    widgetClient: innen.widgetClient,
    widgetBreite: innen.widgetBreite,
    seitlichKarte: innen.seitlichKarte,
    embedClient,
    rahmenClient,
    rohPx,
    rahmenZahl: aussen.rahmenZahl,
    vorfahreOverflow: aussen.fehlt ? null : aussen.vorfahreOverflow,
    rahmenRagtUnten: aussen.fehlt ? false : aussen.rahmenRagtUnten,
    rahmenRagtSeitlich: aussen.fehlt ? false : aussen.rahmenRagtSeitlich,
    kartenUnterRahmen: innen.tiefste != null && rahmenClient != null && innen.tiefste > rahmenClient + 8,
    kartenUnterWidget: innen.tiefste != null && innen.widgetClient != null && innen.tiefste > innen.widgetClient + 8,
  }
}

type Klick = {
  anzahl: string | null
  et: string | null
  partnerImHref: boolean
  popup: boolean
  ziel: string | null
  status: number | null
  partnerImZiel: boolean
  h1: string
  titel: string
  textProbe: string
  art: 'ergebnisliste' | 'detail' | 'fehler' | 'blockiert' | 'kein-popup' | 'kein-anker' | 'unbekannt'
}

function klickArt(ziel: string, h1: string, text: string, status: number | null): Klick['art'] {
  if (status === 403 || /\b403\b|Access Denied|Attention Required/i.test(text)) return 'blockiert'
  if ((status != null && status >= 400) || /An error occurred/i.test(text)) return 'fehler'
  const liste = /\/s\/|search\?|[?&]q=/i.test(ziel) || /\d[\d.]*\s+(Aktivitäten|activities|results|Ergebnisse)/i.test(`${h1} ${text}`)
  const detail = /-t\d{3,}/.test(ziel)
  if (detail && !liste) return 'detail'
  if (liste) return 'ergebnisliste'
  return 'unbekannt'
}

async function angebotKlicken(page: Page, name: string, datei: string): Promise<Klick> {
  const widgetRahmen = page.frames().filter((frame) => frame.url().includes('activities.frame'))
  const benannte = widgetRahmen.filter((frame) => passt(frame.url(), name))
  const frame = (benannte.length > 0 ? benannte : widgetRahmen.length === 1 ? widgetRahmen : [])[0]
  const anzahl = await page.locator(`[data-szenario="${name}"] [data-gyg-anzahl]`).first().getAttribute('data-gyg-anzahl')
  const leer = (art: Klick['art']): Klick => ({
    anzahl,
    et: null,
    partnerImHref: false,
    popup: false,
    ziel: null,
    status: null,
    partnerImZiel: false,
    h1: '',
    titel: '',
    textProbe: '',
    art,
  })
  if (!frame) return leer('kein-anker')
  const link = frame.locator('a[href*="et="]').first()
  if ((await link.count()) === 0) return leer('kein-anker')
  const href = await link.evaluate((anker) => (anker as HTMLAnchorElement).href)
  let et: string | null = null
  let partnerImHref = false
  try {
    const url = new URL(href)
    et = url.searchParams.get('et')
    partnerImHref = url.searchParams.get('partner_id') === PARTNER || href.includes(`partner_id=${PARTNER}`)
  } catch {
    partnerImHref = href.includes(`partner_id=${PARTNER}`)
  }
  const dokumente: { url: string; status: number }[] = []
  const zuhoerer = (response: { url: () => string; status: () => number; request: () => { resourceType: () => string }; frame: () => { page: () => unknown } | null }) => {
    try {
      if (response.request().resourceType() !== 'document') return
      if (!response.url().includes('getyourguide.com')) return
      dokumente.push({ url: response.url().slice(0, 240), status: response.status() })
    } catch {
      dokumente.push({ url: 'unlesbar', status: 0 })
    }
  }
  page.context().on('response', zuhoerer)
  try {
    const popupErwartet = page.context().waitForEvent('page', { timeout: 20000 }).catch(() => null)
    await link.scrollIntoViewIfNeeded().catch(() => undefined)
    await link.click({ timeout: 8000 })
    const popup = await popupErwartet
    if (!popup) {
      return { ...leer('kein-popup'), et, partnerImHref }
    }
    await popup.waitForLoadState('domcontentloaded').catch(() => undefined)
    await popup.waitForTimeout(3000)
    const ziel = popup.url()
    const eigene = dokumente.filter((eintrag) => {
      try {
        const a = new URL(ziel)
        const b = new URL(eintrag.url)
        return a.origin === b.origin && a.pathname === b.pathname
      } catch {
        return false
      }
    })
    const status = (eigene.length ? eigene : dokumente).at(-1)?.status ?? null
    const h1 = (await popup.locator('h1').first().innerText().catch(() => '')).replace(/\s+/g, ' ').trim().slice(0, 180)
    const titel = (await popup.title().catch(() => '')).replace(/\s+/g, ' ').trim().slice(0, 180)
    const textProbe = (await popup.locator('body').innerText().catch(() => '')).replace(/\s+/g, ' ').trim().slice(0, 360)
    await popup.screenshot({ path: join(ARTIFACTS, datei) }).catch(() => undefined)
    const partnerImZiel = ziel.includes(`partner_id=${PARTNER}`)
    const art = klickArt(ziel, h1, textProbe, status)
    await popup.close().catch(() => undefined)
    return {
      anzahl,
      et,
      partnerImHref,
      popup: true,
      ziel: ziel.slice(0, 360),
      status,
      partnerImZiel,
      h1,
      titel,
      textProbe,
      art,
    }
  } catch (fehler: unknown) {
    return { ...leer(fehler instanceof Error && /403/.test(fehler.message) ? 'blockiert' : 'fehler'), et, partnerImHref, textProbe: String(fehler).slice(0, 240) }
  } finally {
    page.context().off('response', zuhoerer)
  }
}

async function bild(page: Page, name: string, datei: string) {
  const ziel = page.locator(`[data-szenario="${name}"] iframe[title="GetYourGuide"]`)
  if (await ziel.count()) {
    await ziel.screenshot({ path: join(ARTIFACTS, datei) }).catch(async () => {
      await page.locator(`[data-szenario="${name}"]`).screenshot({ path: join(ARTIFACTS, datei) })
    })
    return
  }
  await page.locator(`[data-szenario="${name}"]`).screenshot({ path: join(ARTIFACTS, datei) })
}

async function main() {
  mkdirSync(ARTIFACTS, { recursive: true })
  mkdirSync(OUT, { recursive: true })
  const css = cssBauen()
  await bundeln()
  writeFileSync(join(OUT, 'app.css'), css)
  const anfragen: { host: string; status: number | null; pfad: string }[] = []
  const kanarien: string[] = []
  const server = createServer(async (req, res) => {
    const url = new URL(req.url ?? '/', 'http://127.0.0.1')
    const adresse = `${url.pathname}${url.search}`
    if (adresse.includes(KANARIEN)) kanarien.push(adresse)
    if (url.pathname === '/embed/getyourguide') {
      const antwort = embedAntwort(zuRequest(req, 'http://127.0.0.1'))
      const body = Buffer.from(await antwort.arrayBuffer())
      if (body.includes(Buffer.from(KANARIEN))) kanarien.push('embed-dokument')
      res.writeHead(antwort.status, Object.fromEntries(antwort.headers.entries()))
      res.end(body)
      return
    }
    if (url.pathname === '/angebote.js') {
      res.writeHead(200, { 'content-type': 'text/javascript; charset=utf-8' })
      res.end(readFileSync(join(OUT, 'angebote.js')))
      return
    }
    if (url.pathname === '/app.css') {
      res.writeHead(200, { 'content-type': 'text/css; charset=utf-8' })
      res.end(readFileSync(join(OUT, 'app.css')))
      return
    }
    res.writeHead(200, { 'content-type': 'text/html; charset=utf-8' })
    res.end('<!doctype html><html lang="de"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width, initial-scale=1"><title>Angebote</title><link rel="stylesheet" href="/app.css"></head><body><div id="root"></div><script src="/angebote.js"></script></body></html>')
  })
  await new Promise<void>((resolve) => server.listen(0, '127.0.0.1', resolve))
  const gebunden = server.address()
  if (!gebunden || typeof gebunden === 'string') throw new Error('Port fehlt')
  const basis = `http://127.0.0.1:${gebunden.port}`
  const direkt = await fetch(`${basis}/embed/getyourguide?umfang=stadt&code=TH&name=Bangkok&anzahl=12`)
  const direktText = await direkt.text()

  const browser = await chromium.launch({ headless: true, args: ['--no-sandbox', '--disable-dev-shm-usage'] })
  const context = await browser.newContext()
  const page = await context.newPage({ viewport: { width: 390, height: 844 } })
  const seit = { vorher: true }
  context.on('request', (request) => {
    try {
      const ziel = new URL(request.url())
      if (ziel.hostname.startsWith('127.0.0.1')) return
      if (request.url().includes(KANARIEN)) kanarien.push(request.url().slice(0, 180))
      if (!seit.vorher) return
      anfragen.push({ host: ziel.hostname, status: null, pfad: ziel.pathname.slice(0, 80) })
    } catch {
      kanarien.push('unlesbar')
    }
  })
  context.on('response', (response) => {
    try {
      const ziel = new URL(response.url())
      if (ziel.hostname.startsWith('127.0.0.1')) return
      anfragen.push({ host: ziel.hostname, status: response.status(), pfad: ziel.pathname.slice(0, 80) })
    } catch {
      kanarien.push('antwort-unlesbar')
    }
  })
  page.on('pageerror', (fehler) => console.log('PAGE', fehler.message))
  await page.goto(`${basis}/`, { waitUntil: 'domcontentloaded' })
  const knopf = page.locator('[data-szenario="bangkok"]').getByRole('button', { name: 'Bei GetYourGuide anzeigen', exact: true })
  await knopf.waitFor({ timeout: 8000 })
  await page.waitForTimeout(400)
  const vorher = anfragen.length
  seit.vorher = false
  await knopf.focus()
  await page.keyboard.press('Enter')
  const bangkok12 = await warten(page, 'bangkok', 8)
  await page.setViewportSize({ width: 320, height: 700 })
  const bangkok12Bei320 = await warten(page, 'bangkok', 8, 4)
  await bild(page, 'bangkok', 'bangkok-12-320.png')
  await page.setViewportSize({ width: 390, height: 844 })
  const bangkok12Bei390 = await warten(page, 'bangkok', 8, 4)
  await bild(page, 'bangkok', 'bangkok-12-390.png')
  await page.setViewportSize({ width: 768, height: 900 })
  await warten(page, 'bangkok', 8, 4)
  await bild(page, 'bangkok', 'bangkok-12-768.png')
  await page.setViewportSize({ width: 1440, height: 900 })
  await warten(page, 'bangkok', 8, 4)
  await bild(page, 'bangkok', 'bangkok-12-1440.png')
  await page.setViewportSize({ width: 390, height: 844 })
  await page.evaluate(() => {
    document.documentElement.style.fontSize = '32px'
  })
  await warten(page, 'bangkok', 8, 4)
  await bild(page, 'bangkok', 'bangkok-12-390-200.png')
  await page.evaluate(() => {
    document.documentElement.style.fontSize = ''
  })
  await warten(page, 'bangkok', 8, 4)
  const klick12 = await angebotKlicken(page, 'bangkok', 'klick-12.png')
  const taste = await page.locator('[data-szenario="bangkok"]').getByRole('button', { name: 'Mehr Aktivitäten anzeigen', exact: true }).count()
  let bangkok24: Messung | null = null
  let schnitt320: Schnitt | null = null
  let schnitt390: Schnitt | null = null
  let schnitt200: Schnitt | null = null
  let klick24: Klick | null = null
  if (taste === 1) {
    await page.locator('[data-szenario="bangkok"]').getByRole('button', { name: 'Mehr Aktivitäten anzeigen', exact: true }).click()
    await page.setViewportSize({ width: 320, height: 700 })
    const bei320 = await warten(page, 'bangkok', 13, 4)
    schnitt320 = await schnitt(page, 'bangkok')
    await bild(page, 'bangkok', 'bangkok-24-320.png')
    await page.setViewportSize({ width: 390, height: 844 })
    const bei390 = await warten(page, 'bangkok', 13, 4)
    schnitt390 = await schnitt(page, 'bangkok')
    bangkok24 = bei390.karten > 0 ? bei390 : bei320
    await bild(page, 'bangkok', 'bangkok-24-390.png')
    await page.evaluate(() => {
      document.documentElement.style.fontSize = '32px'
    })
    await warten(page, 'bangkok', 13, 4)
    schnitt200 = await schnitt(page, 'bangkok')
    await bild(page, 'bangkok', 'bangkok-24-390-200.png')
    await page.evaluate(() => {
      document.documentElement.style.fontSize = ''
    })
    await warten(page, 'bangkok', 13, 4)
    klick24 = await angebotKlicken(page, 'bangkok', 'klick-24.png')
  }
  let bangkokZurueck: Messung | null = null
  let schnittZurueck: Schnitt | null = null
  const weniger = await page.locator('[data-szenario="bangkok"]').getByRole('button', { name: 'Weniger anzeigen', exact: true }).count()
  if (weniger === 1) {
    await page.setViewportSize({ width: 390, height: 844 })
    await page.locator('[data-szenario="bangkok"]').getByRole('button', { name: 'Weniger anzeigen', exact: true }).click()
    bangkokZurueck = await warten(page, 'bangkok', 8, 4)
    schnittZurueck = await schnitt(page, 'bangkok')
    await bild(page, 'bangkok', 'bangkok-weniger-390.png')
  }
  const entfernenSichtbar = await page.locator('[data-szenario="bangkok"]').getByRole('button', { name: 'Entfernen', exact: true }).count()
  if (entfernenSichtbar === 1) {
    await page.locator('[data-szenario="bangkok"]').getByRole('button', { name: 'Entfernen', exact: true }).click()
  }
  await page.locator('[data-szenario="bangkok"] [data-gyg-phase="ruhend"]').waitFor({ timeout: 8000 }).catch(() => undefined)
  const nachEntfernen = await schnitt(page, 'bangkok')

  await page.locator('[data-szenario="portugal"]').getByRole('button', { name: 'Bei GetYourGuide anzeigen', exact: true }).click()
  const portugal = await warten(page, 'portugal', 1)
  await bild(page, 'portugal', 'portugal-12-390.png')
  await page.locator('[data-szenario="kreta"]').getByRole('button', { name: 'Bei GetYourGuide anzeigen', exact: true }).click()
  const kreta = await warten(page, 'kreta', 1)
  await bild(page, 'kreta', 'kreta-12-390.png')

  const status = anfragen.filter((eintrag) => eintrag.status != null)
  const verweigert = status.filter((eintrag) => eintrag.status === 403)
  const bericht = {
    direkt: {
      status: direkt.status,
      skript: direktText.includes('widget.getyourguide.com'),
      partner: direktText.includes(PARTNER),
    },
    vorher,
    kanarien,
    bangkok12,
    bangkok12Bei320,
    bangkok12Bei390,
    klick12,
    bangkok24,
    schnitt320,
    schnitt390,
    schnitt200,
    klick24,
    weniger,
    bangkokZurueck,
    schnittZurueck,
    entfernenSichtbar,
    nachEntfernen,
    portugal,
    kreta,
    taste,
    verweigert: verweigert.slice(0, 8),
    hosts: [...new Set(status.map((eintrag) => eintrag.host))],
    rohUeber2400: [bangkok12, bangkok24, bangkokZurueck, portugal, kreta].some((eintrag) => (eintrag?.rohPx ?? 0) > 2400),
    geclippt: [bangkok12, bangkok24, bangkokZurueck, portugal, kreta].some(
      (eintrag) => eintrag?.rohPx != null && eintrag.rahmenClient != null && eintrag.rohPx > eintrag.rahmenClient + 8,
    ),
  }
  writeFileSync(join(ARTIFACTS, 'angebote.json'), JSON.stringify(bericht, null, 2))
  console.log(JSON.stringify(bericht, null, 2))
  await browser.close()
  server.close()
}

main()
  .catch((fehler) => {
    console.error(fehler)
    process.exitCode = 1
  })
  .finally(() => {
    setTimeout(() => process.exit(process.exitCode ?? 0), 50)
  })
