#!/usr/bin/env node
/**
 * Nimmt die Sichtbelege der bestätigten Besuchshistorie auf und misst dabei
 * mit, was ein Bild nicht zeigen kann.
 *
 * Aufgenommen wird je Breite:
 *   - die Karte ohne bestätigte Historie (ehrlicher Leerzustand),
 *   - die Karte mit besuchten, geplanten und überlagerten Ländern,
 *   - die Karte, wenn die Besuchshistorie nicht gelesen werden konnte,
 *   - die Historienliste mit wiederholten Ereignissen,
 *   - das Formular zum Bestätigen,
 *   - das geöffnete Bearbeiten-Formular,
 *   - die Rückfrage vor dem Widerruf.
 *
 * Gemessen wird dabei:
 *   - jede Netzwerkanfrage, damit belegt ist, dass zur Laufzeit kein
 *     Kartendienst, keine Kachel und keine Ortsauflösung abgerufen wird;
 *   - Konsolen- und Seitenfehler;
 *   - horizontaler Überlauf;
 *   - die kleinste Kantenlänge einer Bedienfläche;
 *   - ob die Landesgrenze unter einer Füllung noch als eigene Farbe im Bild
 *     liegt. Das ist die einzige dieser Zusagen, die ein Bild allein belegen
 *     kann, und deshalb wird sie hier am Bild gemessen statt am Markup.
 *
 * Der Lauf startet den Produktionsserver mit JETNITY_UI_AUDIT=1 selbst.
 * Voraussetzung: `npm run build` ist gelaufen.
 *
 * Aufruf:
 *   node scripts/kartografie/besuchshistorie-belege.mjs [--verzeichnis <ordner>]
 *     [--port <nummer>] [--skalierung 1|2]
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

const PORT = option('port', '3472')
const VERZEICHNIS = option('verzeichnis', 'docs/evidence/explicit-visit-history-1')
const SKALIERUNG = Number(option('skalierung', '1'))
const BASIS = `http://127.0.0.1:${PORT}`

const BREITEN = [
  { name: '390', width: 390, height: 900 },
  { name: '1280', width: 1280, height: 1000 },
]

/**
 * Punkt auf der portugiesisch-spanischen Landgrenze, in Anteilen des gezeigten
 * Kartenausschnitts. Projektion x = lon + 180, y = 90 - lat; der Ausschnitt
 * reicht von x 0..360 und y 6..148.
 */
const GRENZPROBE = { x: (180 - 7) / 360, y: (90 - 40 - 6) / 142 }

const SZENARIEN = [
  {
    name: 'uebersicht-leer',
    pfad: '/ui-audit/account?zustand=leer',
    ziel: '[data-world-map="ein"]',
    beschreibung: 'Karte ohne bestätigte Historie und ohne geplante Etappen',
  },
  {
    name: 'uebersicht-zustaende',
    pfad: '/ui-audit/account?zustand=welt',
    ziel: '[data-world-map="ein"]',
    grenzprobe: true,
    beschreibung: 'Karte mit besucht, geplant und überlagert',
  },
  {
    name: 'uebersicht-besuch-fehler',
    pfad: '/ui-audit/account?zustand=besuch-fehler',
    ziel: '[data-world-map="ein"]',
    beschreibung: 'Besuchshistorie nicht lesbar – Ausfall statt leerer Historie',
  },
  {
    name: 'historie-liste',
    pfad: '/ui-audit/account?zustand=welt&ansicht=besuche',
    ziel: '[data-account-besuche]',
    beschreibung: 'Historie mit wiederholten Ereignissen und Teilgenauigkeit',
  },
  {
    name: 'historie-leer',
    pfad: '/ui-audit/account?zustand=leer&ansicht=besuche',
    ziel: '[data-account-besuche]',
    beschreibung: 'Leere Historie und Formular zum Bestätigen',
  },
  {
    name: 'historie-bearbeiten',
    pfad: '/ui-audit/account?zustand=welt&ansicht=besuche',
    ziel: '[data-account-besuche]',
    klick: 'button:has-text("Bearbeiten")',
    beschreibung: 'Geöffnetes Bearbeiten-Formular eines Ereignisses',
  },
  {
    name: 'historie-widerrufen',
    pfad: '/ui-audit/account?zustand=welt&ansicht=besuche',
    ziel: '[data-account-besuche]',
    klick: 'button:has-text("Besuch widerrufen")',
    beschreibung: 'Rückfrage vor dem Widerruf einer Bestätigung',
  },
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
  const ausgabe = []
  kind.stdout.on('data', (stueck) => ausgabe.push(String(stueck)))
  kind.stderr.on('data', (stueck) => ausgabe.push(String(stueck)))

  const start = Date.now()
  let antwortet = false
  while (!antwortet && Date.now() - start < 240_000) {
    try {
      const antwort = await fetch(`${BASIS}${SZENARIEN[0].pfad}`)
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
        return flaeche.toDataURL('image/webp', 0.9).split(',')[1]
      }, puffer.toString('base64')),
      'base64',
    )

  /**
   * Zählt die unterschiedlichen Farben in einem kleinen Fenster über der
   * Landesgrenze. Eine sichtbare Grenze unter einer Füllung heisst: neben der
   * Füllung des einen und des anderen Landes liegt dort eine dritte Farbe.
   */
  const grenzeMessen = async (puffer, anteil) =>
    umwandler.evaluate(
      async ({ basis64, anteil }) => {
        const bild = new Image()
        bild.src = `data:image/png;base64,${basis64}`
        await bild.decode()
        const flaeche = document.createElement('canvas')
        flaeche.width = bild.naturalWidth
        flaeche.height = bild.naturalHeight
        const kontext = flaeche.getContext('2d')
        if (!kontext) return null
        kontext.drawImage(bild, 0, 0)
        const breite = Math.max(14, Math.round(bild.naturalWidth * 0.02))
        const x = Math.round(bild.naturalWidth * anteil.x - breite / 2)
        const y = Math.round(bild.naturalHeight * anteil.y - breite / 2)
        const daten = kontext.getImageData(x, y, breite, breite).data
        const farben = new Set()
        for (let i = 0; i < daten.length; i += 4) {
          farben.add(`${daten[i]},${daten[i + 1]},${daten[i + 2]}`)
        }
        return { fenster: breite, farben: farben.size }
      },
      { basis64: puffer.toString('base64'), anteil },
    )

  for (const viewport of BREITEN) {
    for (const szenario of SZENARIEN) {
      const seite = await browser.newPage({ viewport, deviceScaleFactor: SKALIERUNG })
      const konsole = []
      seite.on('console', (nachricht) => {
        if (nachricht.type() === 'error' || nachricht.type() === 'warning') {
          konsole.push(`${nachricht.type()}: ${nachricht.text()}`)
        }
      })
      seite.on('pageerror', (fehler) => konsole.push(`pageerror: ${fehler.message}`))
      seite.on('request', (anfrage) => anfragen.add(new URL(anfrage.url()).origin))

      await seite.goto(`${BASIS}${szenario.pfad}`, { waitUntil: 'networkidle', timeout: 90_000 })
      const ziel = seite.locator(szenario.ziel).first()
      await ziel.waitFor({ timeout: 30_000 })

      if (szenario.klick) {
        await seite.locator(szenario.klick).first().click()
        await seite.waitForTimeout(350)
      }

      const puffer = await ziel.screenshot()
      writeFileSync(
        join(VERZEICHNIS, `${szenario.name}-${viewport.name}.webp`),
        await alsWebp(puffer),
      )

      let grenze = null
      if (szenario.grenzprobe) {
        const kartePuffer = await seite.locator('[data-world-map="ein"] svg').first().screenshot()
        grenze = await grenzeMessen(kartePuffer, GRENZPROBE)
      }

      const messung = await seite.evaluate(() => {
        const wurzel = document.documentElement
        const bedienbar = [
          ...document.querySelectorAll(
            'main button, main a[href], main input, main select, main [role="combobox"]',
          ),
        ]
        const kanten = bedienbar
          .map((element) => element.getBoundingClientRect())
          .filter((kasten) => kasten.width > 0 && kasten.height > 0)
          .map((kasten) => Math.min(kasten.width, kasten.height))
        const flaechen = [...document.querySelectorAll('[data-welt-land]')]
        const zustaende = {}
        for (const element of flaechen) {
          const zustand = element.getAttribute('data-welt-land-zustand') ?? 'unbekannt'
          zustaende[zustand] = (zustaende[zustand] ?? 0) + 1
        }
        const svg = document.querySelector('[data-world-map="ein"] svg[role="img"]')
        return {
          overflow: wurzel.scrollWidth - window.innerWidth,
          kleinsteBedienflaeche: kanten.length ? Math.round(Math.min(...kanten)) : null,
          laenderZustaende: zustaende,
          besuchtLage:
            document.querySelector('[data-world-map]')?.getAttribute('data-world-map-visited') ??
            null,
          kennzahlen: [...document.querySelectorAll('[data-welt-kennzahl]')].map((element) =>
            (element.textContent ?? '').trim(),
          ),
          laenderListe: [...document.querySelectorAll('[data-welt-laender-liste] li')].map(
            (element) => (element.textContent ?? '').trim(),
          ),
          ereignisse: [...document.querySelectorAll('[data-besuch]')].length,
          beschreibung: svg?.querySelector('desc')?.textContent ?? null,
        }
      })

      befunde.push({
        szenario: szenario.name,
        beschreibung: szenario.beschreibung,
        breite: viewport.name,
        grenzeUnterFuellung: grenze,
        ...messung,
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
const bericht = {
  slice: 'Explicit Visit History 1',
  herkuenfte: [...anfragen].sort(),
  fremdeHerkuenfte,
  befunde,
  ok:
    fremdeHerkuenfte.length === 0 &&
    befunde.every(
      (befund) =>
        befund.overflow <= 0 &&
        befund.konsole.length === 0 &&
        (befund.kleinsteBedienflaeche ?? 44) >= 44 &&
        (befund.grenzeUnterFuellung === null || befund.grenzeUnterFuellung.farben >= 3),
    ),
}

writeFileSync(join(VERZEICHNIS, 'bericht.json'), `${JSON.stringify(bericht, null, 2)}\n`)
console.log(JSON.stringify(bericht, null, 2))
if (!bericht.ok) process.exit(1)
