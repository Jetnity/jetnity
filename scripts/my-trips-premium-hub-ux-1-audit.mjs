#!/usr/bin/env node
/**
 * Cross-device audit for Meine Reisen premium hub UX 1.
 *
 * Fixtures live only on /ui-audit/meine-reisen. No product write, no provider.
 *
 *   JETNITY_UI_AUDIT=1 node scripts/my-trips-premium-hub-ux-1-audit.mjs
 *     [--marke vorher|nachher]
 *     [--port 3491]
 *     [--basis http://127.0.0.1:3491]
 *     [--nur po]
 */
import { spawn } from 'node:child_process'
import { execSync } from 'node:child_process'
import { mkdirSync, writeFileSync } from 'node:fs'
import { join } from 'node:path'

import { chromium } from 'playwright'

const argv = process.argv.slice(2)
const option = (name, standard) => {
  const index = argv.indexOf(`--${name}`)
  return index === -1 ? standard : argv[index + 1]
}

const PORT = option('port', '3491')
const MARKE = option('marke', 'nachher')
const NUR = option('nur', '')
const BASIS = option('basis', `http://127.0.0.1:${PORT}`)
const EIGENEN_SERVER = !argv.includes('--basis')
const VERZEICHNIS = option(
  'verzeichnis',
  join(process.cwd(), 'docs/evidence/my-trips-premium-hub-ux-1'),
)
const BILDER = option('bilder', '/opt/cursor/artifacts')
const SHA = execSync('git rev-parse HEAD', { encoding: 'utf8' }).trim()

const VIEWPORTS = [
  { name: '320x568', width: 320, height: 568, touch: true },
  { name: '360x800', width: 360, height: 800, touch: true },
  { name: '390x844', width: 390, height: 844, touch: true },
  { name: '412x915', width: 412, height: 915, touch: true },
  { name: '430x932', width: 430, height: 932, touch: true },
  { name: '768x1024', width: 768, height: 1024, touch: true },
  { name: '820x1180', width: 820, height: 1180, touch: true },
  { name: '1024x768', width: 1024, height: 768, touch: false },
  { name: '1280x800', width: 1280, height: 800, touch: false },
  { name: '1440x900', width: 1440, height: 900, touch: false },
  { name: '1728x1117', width: 1728, height: 1117, touch: false },
  { name: '1920x1080', width: 1920, height: 1080, touch: false },
  { name: '844x390', width: 844, height: 390, touch: true },
]

const ZUSTAENDE = ['po', 'gemischt', 'archiv', 'leer', 'fehler', 'grenze']
const VERBOTEN = [
  'Readiness',
  'Safety',
  'Einreise',
  'Visum',
  'Duffel',
  'Provider',
  'offiziell bestätigt',
  '0%',
  'Buchung offen',
]

mkdirSync(VERZEICHNIS, { recursive: true })
mkdirSync(BILDER, { recursive: true })

function serverStarten() {
  const kind = spawn('npx', ['next', 'dev', '-p', PORT, '-H', '127.0.0.1'], {
    env: {
      ...process.env,
      TZ: 'Europe/Zurich',
      JETNITY_UI_AUDIT: '1',
      NEXT_PUBLIC_SUPABASE_URL:
        process.env.NEXT_PUBLIC_SUPABASE_URL || 'https://placeholder.supabase.co',
      NEXT_PUBLIC_SUPABASE_ANON_KEY:
        process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY ||
        'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InBsYWNlaG9sZGVyIiwicm9sZSI6ImFub24iLCJpYXQiOjE2OTAwMDAwMDAsImV4cCI6MjAwMDAwMDAwMH0.audit',
      NEXT_PUBLIC_APP_URL: BASIS,
    },
    stdio: ['ignore', 'pipe', 'pipe'],
    detached: true,
  })
  const ausgabe = []
  kind.stdout.on('data', (stueck) => ausgabe.push(String(stueck)))
  kind.stderr.on('data', (stueck) => ausgabe.push(String(stueck)))
  kind.ausgabe = ausgabe
  return kind
}

function serverStoppen(kind) {
  if (!kind?.pid) return
  try {
    process.kill(-kind.pid, 'SIGTERM')
  } catch {
    kind.kill('SIGTERM')
  }
}

async function warten(basis) {
  const start = Date.now()
  let letzte = ''
  while (Date.now() - start < 180_000) {
    try {
      const antwort = await fetch(`${basis}/ui-audit/meine-reisen?zustand=po`)
      if (antwort.ok) {
        await antwort.arrayBuffer()
        return
      }
      letzte = `HTTP ${antwort.status}`
    } catch (fehler) {
      letzte = String(fehler)
    }
    await new Promise((r) => setTimeout(r, 500))
  }
  throw new Error(`Audit-Seite antwortete nicht: ${letzte}`)
}

async function messen(page) {
  return page.evaluate(() => {
    const fehler = []
    const breite = window.innerWidth
    const hoehe = document.documentElement.scrollHeight
    if (document.documentElement.scrollWidth > breite + 1) {
      fehler.push(`horizontaler Overflow ${document.documentElement.scrollWidth}>${breite}`)
    }
    const text = document.body.textContent || ''
    const kopf = document.querySelector('header')
    const kopfUnten = kopf ? kopf.getBoundingClientRect().bottom : 0
    const hub = document.querySelector('[data-reisen-audit]')
    const h1 = hub?.querySelector('h1')
    if (h1) {
      const box = h1.getBoundingClientRect()
      if (box.top < kopfUnten - 1) fehler.push(`Titel unter der Leiste (${Math.round(box.top)}<${Math.round(kopfUnten)})`)
    }
    const kompakt = breite < 768
    if (hub && kompakt) {
      for (const ziel of hub.querySelectorAll('a, button, input')) {
        const box = ziel.getBoundingClientRect()
        if (box.width === 0 || box.height === 0) continue
        if (box.top < kopfUnten - 1 && box.bottom > kopfUnten + 1) {
          fehler.push(
            `verdeckt: ${(ziel.textContent || ziel.getAttribute('placeholder') || ziel.tagName).trim().slice(0, 40)}`,
          )
        }
        if (box.height < 44 || (ziel instanceof HTMLInputElement && box.height < 44)) {
          fehler.push(
            `Trefferfläche ${Math.round(box.width)}x${Math.round(box.height)} ${(ziel.textContent || ziel.getAttribute('placeholder') || ziel.tagName).trim().slice(0, 32)}`,
          )
        }
      }
    }
    const suche = document.querySelector('input[type="search"]')
    let suchePx = null
    if (suche) {
      suchePx = Number.parseFloat(getComputedStyle(suche).fontSize)
      if (suchePx < 16) fehler.push(`Suche ${suchePx}px`)
      const box = suche.getBoundingClientRect()
      if (box.height < 44) fehler.push(`Suche Höhe ${Math.round(box.height)}`)
    }
    const aktionen = [...document.querySelectorAll('button')].filter((knopf) =>
      /Archivieren|Wiederherstellen/.test(knopf.textContent || ''),
    )
    for (const knopf of aktionen) {
      if (knopf.closest('a')) fehler.push('Aktion liegt im Reise-Link')
      const box = knopf.getBoundingClientRect()
      if (box.height < 44 || box.width < 44) fehler.push(`Aktion ${Math.round(box.width)}x${Math.round(box.height)}`)
    }
    const schalen = [...document.querySelectorAll('[data-reisen-karte]')]
    const karten =
      schalen.length > 0
        ? schalen
        : [...document.querySelectorAll('a[href^="/reisen/"]')].filter((link) => link.querySelector('h2, h3'))
    const kartenBox = karten.slice(0, 4).map((link) => {
      const box = link.getBoundingClientRect()
      return {
        titel: (link.querySelector('h2, h3')?.textContent || '').trim(),
        h: Math.round(box.height),
        w: Math.round(box.width),
      }
    })
    return {
      fehler,
      hoehe,
      suchePx,
      karten: kartenBox,
      aktionen: aktionen.map((knopf) => knopf.textContent.trim()),
      textProbe: text.slice(0, 500),
      hatKommend: text.includes('Kommend'),
      hatAktivLeer: text.includes('Keine aktive Reise.'),
      hatVergangenLeer: text.includes('Keine vergangene Reise.'),
      hatOhneDatumLeer: text.includes('Keine Reise ohne Datum.'),
      hatSucheLeer: text.includes('Keine Reise passt zur Suche.'),
      hatGrenze: text.includes('Höchstens die'),
      hatKontoLeer: text.includes('Noch keine Reise in deinem Konto.'),
      hatFehler: text.includes('Deine Reisen konnten nicht geladen werden.'),
      hatNeueReise: text.includes('Neue Reise'),
      leiste: [...document.querySelectorAll('[data-reisen-gruppe]')].map((eintrag) => ({
        key: eintrag.getAttribute('data-reisen-gruppe'),
        anzahl: eintrag.getAttribute('data-reisen-anzahl'),
      })),
      abschnitte: [...document.querySelectorAll('[data-reisen-abschnitt]')].map((eintrag) =>
        eintrag.getAttribute('data-reisen-abschnitt'),
      ),
    }
  })
}

async function oeffnen(page, zustand) {
  const konsole = []
  const netz = []
  page.removeAllListeners('console')
  page.removeAllListeners('request')
  page.on('console', (msg) => {
    if (msg.type() === 'error') konsole.push(msg.text())
  })
  page.on('pageerror', (fehler) => konsole.push(String(fehler)))
  page.on('request', (anfrage) => {
    const url = anfrage.url()
    if (url.startsWith(BASIS)) return
    netz.push(url)
  })
  await page.goto(`${BASIS}/ui-audit/meine-reisen?zustand=${zustand}`, {
    waitUntil: 'load',
    timeout: 60_000,
  })
  await page.waitForFunction(
    (erwartet) => {
      const text = document.body.textContent || ''
      if (erwartet === 'leer') return text.includes('Noch keine Reise in deinem Konto.')
      if (erwartet === 'fehler') return text.includes('Deine Reisen konnten nicht geladen werden.')
      return text.includes('Kommend')
    },
    zustand,
    { timeout: 20_000 },
  )
  return { konsole, netz }
}

const server = EIGENEN_SERVER ? serverStarten() : null
const befunde = []

try {
  if (EIGENEN_SERVER) await warten(BASIS)
  const browser = await chromium.launch()
  const context = await browser.newContext({
    timezoneId: 'Europe/Zurich',
    locale: 'de-CH',
  })
  const page = await context.newPage()
  const zustaende = NUR ? [NUR] : ZUSTAENDE

  for (const viewport of VIEWPORTS) {
    await page.setViewportSize({ width: viewport.width, height: viewport.height })
    for (const zustand of zustaende) {
      const { konsole, netz } = await oeffnen(page, zustand)
      const messung = await messen(page)
      const hubNetz = netz.filter((url) => /\/api\/(flights|hotels|activities|readiness|reise)/.test(url))
      if (hubNetz.length > 0) messung.fehler.push(`unerwartetes Netz ${hubNetz.join(',')}`)
      const hydration = konsole.filter((zeile) => /hydrat/i.test(zeile))
      if (hydration.length > 0) messung.fehler.push(`Hydration ${hydration[0]}`)
      befunde.push({
        viewport: viewport.name,
        zustand,
        hoehe: messung.hoehe,
        suchePx: messung.suchePx,
        fehler: messung.fehler,
        karten: messung.karten,
        aktionen: messung.aktionen,
        hatKommend: messung.hatKommend,
        hatAktivLeer: messung.hatAktivLeer,
        hatVergangenLeer: messung.hatVergangenLeer,
        hatOhneDatumLeer: messung.hatOhneDatumLeer,
        hatGrenze: messung.hatGrenze,
        hatKontoLeer: messung.hatKontoLeer,
        hatFehler: messung.hatFehler,
        hatNeueReise: messung.hatNeueReise,
        leiste: messung.leiste,
        abschnitte: messung.abschnitte,
        konsole: konsole.slice(0, 8),
      })
      const bild =
        (zustand === 'po' && ['390x844', '1440x900', '360x800', '768x1024'].includes(viewport.name)) ||
        (['gemischt', 'archiv', 'leer', 'fehler'].includes(zustand) && viewport.name === '390x844') ||
        (zustand === 'gemischt' && viewport.name === '1280x800')
      if (bild) {
        const puffer = await page.screenshot({ fullPage: true, type: 'png' })
        const webp = await page.evaluate(async (basis64) => {
          const bild = new Image()
          bild.src = `data:image/png;base64,${basis64}`
          await bild.decode()
          const flaeche = document.createElement('canvas')
          flaeche.width = bild.naturalWidth
          flaeche.height = bild.naturalHeight
          flaeche.getContext('2d').drawImage(bild, 0, 0)
          return flaeche.toDataURL('image/webp', 0.84).split(',')[1]
        }, puffer.toString('base64'))
        writeFileSync(join(BILDER, `my-trips-${MARKE}-${zustand}-${viewport.name}.webp`), Buffer.from(webp, 'base64'))
      }
    }
  }

  if (!NUR || NUR === 'po') {
    await page.setViewportSize({ width: 360, height: 800 })
    await oeffnen(page, 'po')
    await page.addStyleTag({ content: 'html { font-size: 200% !important; }' })
    await page.waitForTimeout(200)
    const text200 = await messen(page)
    befunde.push({ viewport: '360x800-text-200', zustand: 'po', ...text200, konsole: [] })
    if (MARKE === 'nachher') {
      const puffer = await page.screenshot({ fullPage: false, type: 'png' })
      writeFileSync(join(BILDER, `my-trips-${MARKE}-po-360-text-200.png`), puffer)
    }

    await page.setViewportSize({ width: 1440, height: 900 })
    for (const zoom of [1.25, 1.5]) {
      await oeffnen(page, 'po')
      await page.addStyleTag({ content: `html { zoom: ${zoom}; }` })
      await page.waitForTimeout(200)
      const zoomMessung = await messen(page)
      befunde.push({ viewport: `1440x900-zoom-${zoom}`, zustand: 'po', ...zoomMessung, konsole: [] })
    }

    await page.setViewportSize({ width: 390, height: 844 })
    await oeffnen(page, 'po')
    const suche = page.locator('input[type="search"]')
    await suche.fill('Lissabon')
    await page.waitForTimeout(150)
    const treffer = await messen(page)
    befunde.push({ viewport: '390x844', zustand: 'suche-treffer', ...treffer, konsole: [] })
    await suche.fill('zzzz-kein-treffer')
    await page.waitForTimeout(150)
    const leer = await messen(page)
    befunde.push({ viewport: '390x844', zustand: 'suche-leer', ...leer, konsole: [] })

    await suche.fill('')
    await page.waitForTimeout(100)
    await suche.focus()
    await page.keyboard.press('Tab')
    const fokus = await page.evaluate(() => {
      const aktiv = document.activeElement
      const name = aktiv?.textContent?.trim().slice(0, 60) || aktiv?.tagName
      const imLink = Boolean(aktiv?.closest?.('a'))
      const istLink = aktiv?.tagName === 'A'
      const ring = aktiv ? getComputedStyle(aktiv).outlineStyle || getComputedStyle(aktiv).boxShadow : ''
      return { name, imLink, istLink, hatSchatten: ring !== 'none' && ring !== '' }
    })
    befunde.push({ viewport: '390x844', zustand: 'fokus', fokus, fehler: [], hoehe: null })
  }

  for (const befund of befunde) {
    const text = befund.textProbe || ''
    for (const verboten of VERBOTEN) {
      if (text.includes(verboten)) befund.fehler.push(`verboten: ${verboten}`)
    }
  }

  const bericht = {
    marke: MARKE,
    sha: SHA,
    basis: BASIS,
    gemessenAm: new Date().toISOString(),
    befunde,
    poHoehe: Object.fromEntries(
      befunde
        .filter((eintrag) => eintrag.zustand === 'po' && eintrag.hoehe)
        .map((eintrag) => [eintrag.viewport, eintrag.hoehe]),
    ),
    fehlerZahl: befunde.reduce((summe, eintrag) => summe + (eintrag.fehler?.length || 0), 0),
  }
  writeFileSync(join(VERZEICHNIS, `${MARKE}-bericht.json`), JSON.stringify(bericht, null, 2))
  const probleme = befunde.filter((eintrag) => eintrag.fehler?.length)
  if (probleme.length > 0) {
    console.error(JSON.stringify(probleme, null, 2))
    process.exitCode = 1
  } else {
    console.log(JSON.stringify({ marke: MARKE, poHoehe: bericht.poHoehe, fehlerZahl: 0 }, null, 2))
  }
  await browser.close()
} finally {
  serverStoppen(server)
}
