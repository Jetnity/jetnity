#!/usr/bin/env node
/**
 * Sicht- und Interaktionsbelege für Meine Welt, Premium-Karten-UX 1.
 *
 * Gemessen wird der ausgelieferte Build (`next start`), nicht der
 * Entwicklungsmodus. Fixtures liegen nur im Audit-Harness.
 *
 * Voraussetzung: `npm run build`.
 *
 * Aufruf:
 *   node scripts/account-world-premium-map-ux-1-audit.mjs
 *     [--marke vorher|nachher]
 *     [--verzeichnis <ordner>]
 *     [--port <nummer>]
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

const PORT = option('port', '3481')
const MARKE = option('marke', 'nachher')
const VERZEICHNIS = option('verzeichnis', 'docs/evidence/account-world-premium-map-ux-1')
const BASIS = `http://127.0.0.1:${PORT}`

/** Gleichwinkliger Ausschnitt der bestehenden Karte. Projektion wird hier nicht verändert. */
const VIEWBOX = { x: 0, y: 6, width: 360, height: 142 }

const BREITEN = [
  { name: '360x800', width: 360, height: 800 },
  { name: '390x844', width: 390, height: 844 },
  { name: '768x1024', width: 768, height: 1024 },
  { name: '1024x768', width: 1024, height: 768 },
  { name: '1280x800', width: 1280, height: 800 },
  { name: '1440x900', width: 1440, height: 900 },
  { name: '1920x1080', width: 1920, height: 1080 },
]

/**
 * Isolierte Zustände, die der bestehende Harness schon kann.
 * „Nur besucht“ ist kein eigener Fixture-Zustand. Im Zustand `welt` sind
 * Italien (Fläche) und Singapur (Punkt) ausschliesslich besucht.
 */
const ZUSTAENDE = [
  { name: 'leer', pfad: '/ui-audit/account?zustand=leer&ansicht=besuche' },
  { name: 'geplant', pfad: '/ui-audit/account?zustand=reise&ansicht=besuche' },
  { name: 'welt', pfad: '/ui-audit/account?zustand=welt&ansicht=besuche' },
  { name: 'besuch-fehler', pfad: '/ui-audit/account?zustand=besuch-fehler&ansicht=besuche' },
  { name: 'fehler', pfad: '/ui-audit/account?zustand=fehler&ansicht=besuche' },
]

mkdirSync(VERZEICHNIS, { recursive: true })

function bruch(lon, lat) {
  const x = lon + 180
  const y = 90 - lat
  return {
    fx: (x - VIEWBOX.x) / VIEWBOX.width,
    fy: (y - VIEWBOX.y) / VIEWBOX.height,
  }
}

const PROBEN = {
  ozean: bruch(-40, 30),
  land: bruch(8, 23),
  portugal: bruch(-8, 39.6),
  japan: bruch(138, 36),
  brasilien: bruch(-55, -10),
}

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
  let antwortet = false
  while (!antwortet && Date.now() - start < 240_000) {
    try {
      const antwort = await fetch(`${BASIS}${ZUSTAENDE[0].pfad}`)
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
        return flaeche.toDataURL('image/webp', 0.86).split(',')[1]
      }, puffer.toString('base64')),
      'base64',
    )

  const farbproben = async (png) =>
    umwandler.evaluate(async ({ basis64, proben }) => {
      const bild = new Image()
      bild.src = `data:image/png;base64,${basis64}`
      await bild.decode()
      const flaeche = document.createElement('canvas')
      flaeche.width = bild.naturalWidth
      flaeche.height = bild.naturalHeight
      const kontext = flaeche.getContext('2d', { willReadFrequently: true })
      kontext?.drawImage(bild, 0, 0)
      const pixel = (fx, fy) => {
        const x = Math.min(flaeche.width - 1, Math.max(0, Math.round(fx * (flaeche.width - 1))))
        const y = Math.min(flaeche.height - 1, Math.max(0, Math.round(fy * (flaeche.height - 1))))
        const daten = kontext?.getImageData(x, y, 1, 1).data ?? [0, 0, 0, 0]
        return { r: daten[0], g: daten[1], b: daten[2] }
      }
      const fenster = (fx, fy) => {
        const werte = []
        for (let dy = -6; dy <= 6; dy += 3) {
          for (let dx = -6; dx <= 6; dx += 3) {
            const x = Math.min(
              flaeche.width - 1,
              Math.max(0, Math.round(fx * (flaeche.width - 1)) + dx),
            )
            const y = Math.min(
              flaeche.height - 1,
              Math.max(0, Math.round(fy * (flaeche.height - 1)) + dy),
            )
            const daten = kontext?.getImageData(x, y, 1, 1).data ?? [0, 0, 0, 0]
            werte.push(0.2126 * daten[0] + 0.7152 * daten[1] + 0.0722 * daten[2])
          }
        }
        const mittel = werte.reduce((summe, wert) => summe + wert, 0) / werte.length
        const varianz =
          werte.reduce((summe, wert) => summe + (wert - mittel) ** 2, 0) / werte.length
        return Math.round(varianz)
      }
      const abstand = (a, b) =>
        Math.round(Math.hypot(a.r - b.r, a.g - b.g, a.b - b.b))
      const farben = Object.fromEntries(
        Object.entries(proben).map(([name, punkt]) => [name, pixel(punkt.fx, punkt.fy)]),
      )
      return {
        farben,
        varianz: {
          land: fenster(proben.land.fx, proben.land.fy),
          japan: fenster(proben.japan.fx, proben.japan.fy),
          brasilien: fenster(proben.brasilien.fx, proben.brasilien.fy),
          portugal: fenster(proben.portugal.fx, proben.portugal.fy),
        },
        abstand: {
          ozeanLand: abstand(farben.ozean, farben.land),
          landPortugal: abstand(farben.land, farben.portugal),
          portugalBrasilien: abstand(farben.portugal, farben.brasilien),
          landJapan: abstand(farben.land, farben.japan),
        },
      }
    }, { basis64: png.toString('base64'), proben: PROBEN })

  for (const viewport of BREITEN) {
    for (const zustand of ZUSTAENDE) {
      const seite = await browser.newPage({ viewport, deviceScaleFactor: 1 })
      const konsole = []
      seite.on('console', (nachricht) => {
        if (nachricht.type() === 'error' || nachricht.type() === 'warning') {
          konsole.push(`${nachricht.type()}: ${nachricht.text()}`)
        }
      })
      seite.on('pageerror', (fehler) => konsole.push(`pageerror: ${fehler.message}`))
      seite.on('request', (anfrage) => anfragen.add(new URL(anfrage.url()).origin))

      await seite.goto(`${BASIS}${zustand.pfad}`, { waitUntil: 'networkidle', timeout: 90_000 })
      const wurzel = seite.locator('[data-account-besuche]')
      const karte = seite.locator('[data-world-map="ein"]')
      await karte.waitFor({ timeout: 30_000 })
      await karte.scrollIntoViewIfNeeded()

      const seitenBild = await wurzel.screenshot()
      writeFileSync(
        join(VERZEICHNIS, `${MARKE}-${viewport.name}-${zustand.name}-seite.webp`),
        await alsWebp(seitenBild),
      )
      const svg = karte.locator('svg[role="img"]')
      const kartenBild = await svg.screenshot()
      writeFileSync(
        join(VERZEICHNIS, `${MARKE}-${viewport.name}-${zustand.name}-karte.webp`),
        await alsWebp(kartenBild),
      )
      const proben = await farbproben(kartenBild)

      let fokus = null
      let auswahl = null
      if (zustand.name === 'welt') {
        const einzel = seite.locator('[data-world-map-marker-orte="1"]').first()
        if ((await einzel.count()) > 0) {
          await einzel.click()
          await seite.waitForTimeout(250)
          const gewaehlt = await karte.screenshot()
          writeFileSync(
            join(VERZEICHNIS, `${MARKE}-${viewport.name}-welt-marker.webp`),
            await alsWebp(gewaehlt),
          )
          auswahl = await seite.evaluate(() => ({
            marker: document.querySelector('[data-world-map-marker-gewaehlt="ja"]')?.getAttribute(
              'data-world-map-marker',
            ),
            ort: document.querySelector('[data-world-map-ort-gewaehlt="ja"]')?.innerText?.slice(0, 180) ?? null,
            kontext: document.querySelector('[data-world-map-kontext]')?.getAttribute(
              'data-world-map-kontext',
            ),
          }))
        }

        const gruppe = seite.locator('[data-world-map-marker-orte]:not([data-world-map-marker-orte="1"])').first()
        if ((await gruppe.count()) > 0) {
          await gruppe.click()
          await seite.waitForTimeout(250)
          const offen = await karte.screenshot()
          writeFileSync(
            join(VERZEICHNIS, `${MARKE}-${viewport.name}-welt-gruppe.webp`),
            await alsWebp(offen),
          )
        }

        await seite.locator('body').focus()
        let ring = null
        for (let schritt = 0; schritt < 50; schritt += 1) {
          await seite.keyboard.press('Tab')
          ring = await seite.evaluate(() => {
            const aktiv = document.activeElement
            const marker = aktiv?.closest?.('[data-world-map-marker]')
            if (!marker) return null
            const stil = getComputedStyle(marker)
            const kasten = marker.getBoundingClientRect()
            return {
              boxShadow: stil.boxShadow,
              outline: `${stil.outlineStyle} ${stil.outlineWidth}`,
              kante: Math.round(Math.min(kasten.width, kasten.height)),
            }
          })
          if (ring) break
        }
        if (ring) {
          const fokusBild = await karte.screenshot()
          writeFileSync(
            join(VERZEICHNIS, `${MARKE}-${viewport.name}-welt-fokus.webp`),
            await alsWebp(fokusBild),
          )
        }
        fokus = ring

        if (viewport.name === '390x844' || viewport.name === '1440x900') {
          const marken = seite.locator('[data-welt-land-marke]')
          const anzahl = await marken.count()
          for (let index = 0; index < anzahl; index += 1) {
            const marke = marken.nth(index)
            const code = await marke.getAttribute('data-welt-land')
            const form = await marke.getAttribute('data-welt-land-marke')
            const bild = await marke.screenshot()
            writeFileSync(
              join(VERZEICHNIS, `${MARKE}-${viewport.name}-marke-${code}-${form}.webp`),
              await alsWebp(bild),
            )
          }
        }
      }

      const messung = await seite.evaluate(() => {
        const wurzel = document.documentElement
        const seite = document.querySelector('[data-account-besuche]')
        const karte = document.querySelector('[data-world-map="ein"]')
        const svg = karte?.querySelector('svg[role="img"]')
        const kartenKasten = svg?.getBoundingClientRect()
        const seitenKasten = seite?.getBoundingClientRect()
        const ziele = [
          ...document.querySelectorAll(
            '[data-account-besuche] button, [data-account-besuche] a, [data-account-besuche] input, [data-account-besuche] select, [data-world-map-marker]',
          ),
        ]
        const kanten = ziele.map((element) => {
          const kasten = element.getBoundingClientRect()
          return {
            kante: Math.round(Math.min(kasten.width, kasten.height)),
            text: (element.getAttribute('aria-label') || element.textContent || element.tagName)
              .trim()
              .slice(0, 80),
          }
        })
        const kleinste = kanten.reduce(
          (bisher, eintrag) => (eintrag.kante < bisher.kante ? eintrag : bisher),
          kanten[0] ?? { kante: null, text: null },
        )
        const flaechen = [...document.querySelectorAll('[data-welt-land-zustand]')].map(
          (element) =>
            `${element.getAttribute('data-welt-land')}:${element.getAttribute('data-welt-land-zustand')}:${element.getAttribute('data-welt-land-marke') ?? 'flaeche'}`,
        )
        return {
          overflow: wurzel.scrollWidth - window.innerWidth,
          seitenBreite: Math.round(wurzel.scrollWidth),
          fenster: window.innerWidth,
          kartenBreite: kartenKasten ? Math.round(kartenKasten.width) : null,
          kartenHoehe: kartenKasten ? Math.round(kartenKasten.height) : null,
          seitenInhaltBreite: seitenKasten ? Math.round(seitenKasten.width) : null,
          verhaeltnis:
            kartenKasten && window.innerWidth
              ? Math.round((kartenKasten.width / window.innerWidth) * 1000) / 1000
              : null,
          marker: document.querySelectorAll('[data-world-map-marker]').length,
          kleinsteBedienflaeche: kleinste?.kante ?? null,
          kleinsteBedienflaecheText: kleinste?.text ?? null,
          flaechen,
          herkunftSichtbar: (karte?.innerText ?? '').includes('Natural Earth'),
          besuchtHinweisSichtbar: (karte?.innerText ?? '').includes('bestätigt'),
          titel: svg?.querySelector('title')?.textContent ?? null,
        }
      })

      if (viewport.width >= 1024 && zustand.name === 'welt') {
        await karte.evaluate((element) => element.scrollIntoView({ block: 'start' }))
        const fenster = await seite.screenshot()
        writeFileSync(
          join(VERZEICHNIS, `${MARKE}-${viewport.name}-welt-fenster.webp`),
          await alsWebp(fenster),
        )
      }

      befunde.push({
        breite: viewport.name,
        zustand: zustand.name,
        ...messung,
        proben,
        auswahl,
        fokus,
        konsole,
      })
      await seite.close()
    }
  }
  await browser.close()
} finally {
  serverStoppen(server)
}

const fremdeHerkuenfte = [...anfragen].filter((herkunft) => !herkunft.includes('127.0.0.1'))
const welt = befunde.filter((befund) => befund.zustand === 'welt')
const formen = new Set(
  welt.flatMap((befund) =>
    befund.flaechen
      .map((eintrag) => eintrag.split(':')[2])
      .filter((form) => form && form !== 'flaeche'),
  ),
)
const bericht = {
  marke: MARKE,
  herkuenfte: [...anfragen].sort(),
  fremdeHerkuenfte,
  formen: [...formen].sort(),
  befunde,
  ok:
    fremdeHerkuenfte.length === 0 &&
    befunde.every(
      (befund) =>
        befund.overflow <= 1 &&
        befund.konsole.length === 0 &&
        (befund.kleinsteBedienflaeche ?? 0) >= 44 &&
        befund.herkunftSichtbar &&
        befund.besuchtHinweisSichtbar,
    ) &&
    welt.every((befund) => befund.fokus && befund.fokus.kante >= 44) &&
    formen.has('ring') &&
    formen.has('ring-gestrichelt') &&
    formen.has('doppelring'),
}
writeFileSync(join(VERZEICHNIS, `${MARKE}-bericht.json`), `${JSON.stringify(bericht, null, 2)}\n`)
console.log(
  JSON.stringify(
    {
      ok: bericht.ok,
      marke: bericht.marke,
      fremdeHerkuenfte: bericht.fremdeHerkuenfte,
      formen: bericht.formen,
      befunde: bericht.befunde.map((befund) => ({
        breite: befund.breite,
        zustand: befund.zustand,
        overflow: befund.overflow,
        verhaeltnis: befund.verhaeltnis,
        kartenBreite: befund.kartenBreite,
        kleinsteBedienflaeche: befund.kleinsteBedienflaeche,
        kleinsteBedienflaecheText: befund.kleinsteBedienflaecheText,
        abstand: befund.proben.abstand,
        varianz: befund.proben.varianz,
        fokus: befund.fokus,
        konsole: befund.konsole,
      })),
    },
    null,
    2,
  ),
)
if (!bericht.ok) process.exit(1)
