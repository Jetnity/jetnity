#!/usr/bin/env node
/**
 * Nimmt die Sichtbelege der Account-Weltkarte auf und misst dabei mit, was ein
 * Bild nicht zeigen kann.
 *
 * Aufgenommen wird je Breite:
 *   - die ruhende Karte,
 *   - ein ausgewaehlter Marker,
 *   - eine geteilte Trefferflaeche mit offener Ortsauswahl.
 *
 * Gemessen wird dabei:
 *   - jede Netzwerkanfrage der Seite, damit belegt ist, dass zur Laufzeit kein
 *     Kartendienst, keine Kachel und keine Ortsaufloesung abgerufen wird;
 *   - Konsolen- und Seitenfehler;
 *   - horizontaler Ueberlauf;
 *   - die kleinste Kantenlaenge einer Marker-Trefferflaeche.
 *
 * Der Lauf startet den Produktionsserver mit JETNITY_UI_AUDIT=1 selbst. Gemessen
 * wird damit der ausgelieferte Build, nicht der Entwicklungsmodus. Die Fixtures
 * liegen nur im Harness, nicht im Produktspeicher.
 *
 * Voraussetzung: `npm run build` ist gelaufen.
 *
 * Aufruf:
 *   node scripts/kartografie/weltkarte-belege.mjs [--marke vorher|nachher]
 *     [--verzeichnis <ordner>] [--port <nummer>] [--skalierung 1|2]
 */
import { spawn } from 'node:child_process'
import { mkdirSync, writeFileSync } from 'node:fs'
import { join } from 'node:path'
import { chromium } from 'playwright'

const argv = process.argv.slice(2)
const option = (name, standard) => {
  const index = argv.indexOf(`--${name}`)
  return index === -1 ? standard : argv[index + 1]
}

const PORT = option('port', '3471')
const MARKE = option('marke', 'nachher')
const VERZEICHNIS = option('verzeichnis', 'docs/evidence/realistic-world-cartography-1')
/** 1 fuer Bilder im Repository, 2 fuer Bildschirmbelege ausserhalb. */
const SKALIERUNG = Number(option('skalierung', '1'))
const BASIS = `http://127.0.0.1:${PORT}`
const PFAD = '/ui-audit/account?zustand=welt'

const BREITEN = [
  { name: '390', width: 390, height: 844 },
  { name: '1280', width: 1280, height: 900 },
  { name: '1440', width: 1440, height: 960 },
]

mkdirSync(VERZEICHNIS, { recursive: true })

async function serverStarten() {
  const kind = spawn('npx', ['next', 'start', '-p', PORT, '-H', '127.0.0.1'], {
    env: {
      ...process.env,
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
  let bereit = false
  const ausgabe = []
  kind.stdout.on('data', (stueck) => {
    const text = String(stueck)
    ausgabe.push(text)
    if (text.includes('Ready') || text.includes('started')) bereit = true
  })
  kind.stderr.on('data', (stueck) => ausgabe.push(String(stueck)))
  const start = Date.now()
  while (!bereit && Date.now() - start < 120_000) await new Promise((r) => setTimeout(r, 250))
  // „Ready“ im Protokoll heisst, dass der Prozess lauscht – nicht, dass die
  // Route schon kompiliert ist. Erst eine echte Antwort ist Bereitschaft.
  let antwortet = false
  while (!antwortet && Date.now() - start < 240_000) {
    try {
      const antwort = await fetch(`${BASIS}${PFAD}`)
      antwortet = antwort.ok
      await antwort.arrayBuffer()
    } catch {
      antwortet = false
    }
    if (!antwortet) await new Promise((r) => setTimeout(r, 1000))
  }
  if (!antwortet) {
    serverStoppen(kind)
    throw new Error(`Next.js antwortete nicht:\n${ausgabe.join('')}`)
  }
  return kind
}

function serverStoppen(kind) {
  if (!kind.pid) return
  try {
    process.kill(-kind.pid, 'SIGTERM')
  } catch {
    kind.kill('SIGTERM')
  }
}

const server = await serverStarten()
const befunde = []
const anfragen = new Set()

try {
  const browser = await chromium.launch()

  /**
   * Bilder werden als WebP abgelegt. Eine detaillierte Weltkarte kostet als
   * PNG ein Vielfaches, und Belege sollen das Repository nicht beschweren.
   * Die Umwandlung laeuft im selben Browser, damit kein Bildpaket dazukommt.
   */
  const umwandler = await browser.newPage()
  const alsWebp = async (puffer) =>
    Buffer.from(
      await umwandler.evaluate(async (basis64) => {
        const bild = new Image()
        bild.src = `data:image/png;base64,${basis64}`
        await bild.decode()
        const flaeche = document.createElement('canvas')
        flaeche.width = bild.naturalWidth
        flaeche.height = bild.naturalHeight
        flaeche.getContext('2d')?.drawImage(bild, 0, 0)
        return flaeche.toDataURL('image/webp', 0.9).split(',')[1]
      }, puffer.toString('base64')),
      'base64',
    )

  for (const viewport of BREITEN) {
    const seite = await browser.newPage({ viewport, deviceScaleFactor: SKALIERUNG })
    const konsole = []
    seite.on('console', (nachricht) => {
      if (nachricht.type() === 'error' || nachricht.type() === 'warning') {
        konsole.push(`${nachricht.type()}: ${nachricht.text()}`)
      }
    })
    seite.on('pageerror', (fehler) => konsole.push(`pageerror: ${fehler.message}`))
    seite.on('request', (anfrage) => anfragen.add(new URL(anfrage.url()).origin))

    await seite.goto(`${BASIS}${PFAD}`, { waitUntil: 'networkidle', timeout: 90_000 })
    const karte = seite.locator('[data-world-map="ein"]')
    await karte.waitFor({ timeout: 30_000 })

    const aufnehmen = async (art) => {
      const puffer = await karte.screenshot()
      writeFileSync(join(VERZEICHNIS, `${MARKE}-${viewport.name}-${art}.webp`), await alsWebp(puffer))
    }
    await aufnehmen('karte')

    const einzel = seite.locator('[data-world-map-marker-orte="1"]').first()
    if ((await einzel.count()) > 0) {
      await einzel.click()
      await seite.waitForTimeout(400)
      await aufnehmen('marker-gewaehlt')
    }

    const gruppe = seite.locator('[data-world-map-marker]:not([data-world-map-marker-orte="1"])').first()
    if ((await gruppe.count()) > 0) {
      await gruppe.click()
      await seite.waitForTimeout(400)
      await aufnehmen('gruppe-offen')
    }

    const messung = await seite.evaluate(() => {
      const wurzel = document.documentElement
      const marker = [...document.querySelectorAll('[data-world-map-marker]')]
      const kanten = marker.map((element) => {
        const kasten = element.getBoundingClientRect()
        return Math.min(kasten.width, kasten.height)
      })
      const svg = document.querySelector('[data-world-map="ein"] svg')
      return {
        overflow: wurzel.scrollWidth - window.innerWidth,
        marker: marker.length,
        kleinsteTrefferflaeche: kanten.length ? Math.round(Math.min(...kanten)) : null,
        pfadElemente: svg ? svg.querySelectorAll('path').length : null,
        svgKnoten: svg ? svg.querySelectorAll('*').length : null,
        titel: svg?.querySelector('title')?.textContent ?? null,
        beschreibung: svg?.querySelector('desc')?.textContent ?? null,
      }
    })

    befunde.push({ breite: viewport.name, ...messung, konsole })
    await seite.close()
  }
  await browser.close()
} finally {
  serverStoppen(server)
}

const fremdeHerkuenfte = [...anfragen].filter((herkunft) => !herkunft.includes('127.0.0.1'))
const bericht = {
  marke: MARKE,
  pfad: PFAD,
  herkuenfte: [...anfragen].sort(),
  fremdeHerkuenfte,
  befunde,
  ok:
    fremdeHerkuenfte.length === 0 &&
    befunde.every(
      (befund) =>
        befund.overflow <= 0 &&
        befund.konsole.length === 0 &&
        (befund.kleinsteTrefferflaeche ?? 0) >= 44,
    ),
}
writeFileSync(join(VERZEICHNIS, `${MARKE}-bericht.json`), `${JSON.stringify(bericht, null, 2)}\n`)
console.log(JSON.stringify(bericht, null, 2))
if (!bericht.ok) process.exit(1)
