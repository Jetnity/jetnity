// Lokaler Nachweis für den gelieferten Rahmen.
// Die Seite rendert TwelveGoWidgetRahmen. Ein Prüfskript setzt danach
// nur die lokale Stub-Adresse. Kein Anbieter, keine Buchung.

import { createHash } from 'node:crypto'
import { createServer } from 'node:http'
import { mkdirSync, readFileSync, writeFileSync } from 'node:fs'
import { tmpdir } from 'node:os'
import { join } from 'node:path'
import { createElement } from 'react'
import { renderToStaticMarkup } from 'react-dom/server'
import { chromium } from 'playwright'

import TwelveGoAffiliateLinks from '@/components/trips/TwelveGoAffiliateLinks'
import TwelveGoWidgetRahmen from '@/components/trips/TwelveGoWidgetRahmen'
import { TWELVE_GO_WIDGET_ALLGEMEIN_LAENGE, TWELVE_GO_WIDGET_ALLGEMEIN_SHA256 } from '@/lib/providers/twelve-go/widget/kennungen'
import { TWELVE_GO_WIDGET_RAHMEN_HOEHE_PX, TWELVE_GO_WIDGET_SANDBOX } from '@/lib/providers/twelve-go/widget/rahmen'
import type { Trip, TripStage } from '@/types/trips'

const JETZT = '2026-10-30T12:00:00.000Z'
const MARKER = 'data-twelve-go-rahmen="leer"'

export type RahmenMasse = {
  vorhanden: boolean
  anzahl: number
  width: number
  height: number
  sandbox: string | null
  inhalt: string
  felderImFenster: boolean
  tastatur: boolean
}

export function nachweisOrdner(env?: { TWELVE_GO_WIDGET_NACHWEIS_DIR?: string }): string {
  const roh = env ? env.TWELVE_GO_WIDGET_NACHWEIS_DIR : process.env.TWELVE_GO_WIDGET_NACHWEIS_DIR
  const gesetzt = roh?.trim()
  if (gesetzt) return gesetzt
  return join(tmpdir(), 'twelve-go-widget-v2')
}

export function rahmenSeite(komponente: string): string {
  return `<!doctype html><html lang="de-CH"><head><meta charset="utf-8"><style>html,body{margin:0}</style></head><body>
<button type="button" id="start">Rahmen jetzt prüfen</button>
${komponente}
<script>
document.getElementById('start').addEventListener('click', () => {
  const frame = document.querySelector('[data-twelve-go-rahmen="leer"]')
  if (!frame) return
  frame.src = '/stub'
})
</script></body></html>`
}

export function rahmenBeweis(masse: RahmenMasse, erwarteteBreite: number): string | null {
  if (!masse.vorhanden || masse.anzahl !== 1) return 'Rahmen fehlt oder ist ersetzt'
  if (masse.sandbox !== TWELVE_GO_WIDGET_SANDBOX) return 'Sandbox'
  if (masse.inhalt !== 'null') return 'Ursprung lesbar'
  if (masse.height < TWELVE_GO_WIDGET_RAHMEN_HOEHE_PX) return 'Rahmen beschnitten'
  if (masse.width < erwarteteBreite - 2) return 'Breite'
  if (!masse.felderImFenster) return 'Felder ausserhalb'
  if (!masse.tastatur) return 'Tastatur'
  return null
}

function istLoopback(adresse: string): boolean {
  if (adresse.startsWith('about:') || adresse.startsWith('data:') || adresse.startsWith('blob:')) return true
  try {
    const host = new URL(adresse).hostname
    return host === '127.0.0.1' || host === 'localhost' || host === '[::1]'
  } catch {
    return false
  }
}

function etappe(id: string, name: string, position: number): TripStage {
  return {
    id,
    name,
    position,
    countryCode: 'TH',
    arrivalDate: null,
    departureDate: null,
    latitude: null,
    longitude: null,
    placeId: null,
  }
}

const reise: Trip = {
  id: 'synthetic-twelve-go-rahmen',
  clientRef: null,
  title: 'Synthetic',
  origin: 'Zürich',
  originPlaceId: null,
  startDate: null,
  endDate: null,
  travellers: 1,
  currency: 'CHF',
  budgetAmount: null,
  status: 'draft',
  pace: 'calm',
  interests: [],
  travelWish: null,
  revision: 1,
  lastMutationId: null,
  stages: [etappe('a', 'Chiang Mai', 1), etappe('b', 'Ayutthaya', 2)],
  days: [],
  ohneTag: [],
  createdAt: JETZT,
  updatedAt: JETZT,
}

function stub(): string {
  return `<!doctype html><html lang="de-CH"><head><meta charset="utf-8"></head><body>
<label>Start <input id="start" name="origin"></label>
<label>Ziel <input id="ziel" name="destination"></label>
<label>Datum <input id="datum" name="date"></label>
<p id="marke">Lokale Prüfmarke</p>
</body></html>`
}

async function main() {
  const ziel = nachweisOrdner()
  const komponente = renderToStaticMarkup(createElement(TwelveGoWidgetRahmen, { zweck: 'synthetische-pruefung' }))
  if (!komponente.includes(MARKER) || komponente.includes('src=')) {
    throw new Error('Gelieferter Rahmen fehlt oder hat eine Quelle')
  }
  const seite = rahmenSeite(komponente)
  if ((seite.match(/<iframe\b/g) ?? []).length !== 1) {
    throw new Error('Die Prüfseite darf nur den gelieferten Rahmen enthalten')
  }

  const allgemein = readFileSync('lib/providers/twelve-go/widget/quelle/12go-widget-allgemein.html')
  if (
    allgemein.length !== TWELVE_GO_WIDGET_ALLGEMEIN_LAENGE ||
    createHash('sha256').update(allgemein).digest('hex') !== TWELVE_GO_WIDGET_ALLGEMEIN_SHA256
  ) {
    throw new Error('Allgemeine Quelle verändert')
  }

  const server = createServer((anfrage, antwort) => {
    const url = new URL(anfrage.url ?? '/', 'http://127.0.0.1')
    antwort.setHeader('content-type', 'text/html; charset=utf-8')
    antwort.setHeader('cache-control', 'no-store')
    if (url.pathname === '/stub') {
      antwort.end(stub())
      return
    }
    antwort.end(seite)
  })
  await new Promise<void>((resolve) => server.listen(0, '127.0.0.1', () => resolve()))
  const port = (server.address() as { port: number }).port
  const browser = await chromium.launch({ headless: true, args: ['--no-sandbox', '--disable-dev-shm-usage'] })
  const fehler: string[] = []
  const ergebnisse = []
  const externe: { fall: string; origin: string; path: string }[] = []
  mkdirSync(ziel, { recursive: true })

  try {
    const besucher = renderToStaticMarkup(createElement(TwelveGoAffiliateLinks, { reise }))
    if (besucher.includes('<iframe') || besucher.includes(MARKER) || besucher.includes('<script')) {
      fehler.push('Besucherfläche enthält den Rahmen oder ein Skript')
    }

    for (const fall of [
      { name: '320', width: 320 },
      { name: '390', width: 390 },
    ]) {
      const context = await browser.newContext({ viewport: { width: fall.width, height: 1200 }, locale: 'de-CH' })
      const page = await context.newPage()
      await context.route('**/*', (route) => {
        const adresse = route.request().url()
        if (!istLoopback(adresse)) {
          try {
            const url = new URL(adresse)
            externe.push({ fall: fall.name, origin: url.origin, path: url.pathname })
          } catch {
            externe.push({ fall: fall.name, origin: 'unparseable', path: '' })
          }
          return route.abort()
        }
        return route.continue()
      })
      await page.goto(`http://127.0.0.1:${port}/`, { waitUntil: 'networkidle' })
      await page.waitForTimeout(300)
      if (externe.some((eintrag) => eintrag.fall === fall.name)) fehler.push(`${fall.name}: Netz vor dem Klick`)
      await page.getByRole('button', { name: 'Rahmen jetzt prüfen' }).click()
      await page.waitForTimeout(400)
      const masse = await page.evaluate(() => {
        const frames = [...document.querySelectorAll('iframe')]
        const frame = document.querySelector('[data-twelve-go-rahmen="leer"]')
        if (!(frame instanceof HTMLIFrameElement)) {
          return { vorhanden: false, anzahl: frames.length, width: 0, height: 0, sandbox: null, inhalt: 'fehlt' }
        }
        const rect = frame.getBoundingClientRect()
        let inhalt = 'null'
        try {
          inhalt = frame.contentDocument ? 'readable' : 'null'
        } catch (problem) {
          inhalt = `thrown:${(problem as Error).name}`
        }
        return {
          vorhanden: true,
          anzahl: frames.length,
          width: rect.width,
          height: rect.height,
          sandbox: frame.getAttribute('sandbox'),
          inhalt,
        }
      })
      const kind = page.frames().find((frame) => frame.url().includes('/stub'))
      let felderImFenster = false
      let tastatur = false
      if (!kind) fehler.push(`${fall.name}: Stub fehlt`)
      else {
        const felder = await kind.evaluate(() => {
          const sicht = document.documentElement.clientHeight
          const aus = []
          for (const el of document.querySelectorAll('input')) {
            const rect = el.getBoundingClientRect()
            aus.push(rect.top >= 0 && rect.bottom <= sicht && rect.height > 0)
          }
          return aus
        })
        felderImFenster = felder.length === 3 && felder.every(Boolean)
        const start = kind.locator('#start')
        await start.click()
        await start.press('x')
        tastatur = (await start.evaluate((el) => (el as HTMLInputElement).value.length)) === 1
      }
      const grund = rahmenBeweis({ ...masse, felderImFenster, tastatur }, fall.width)
      if (grund) fehler.push(`${fall.name}: ${grund}`)
      if (externe.some((eintrag) => eintrag.fall === fall.name)) fehler.push(`${fall.name}: externes Netz`)
      ergebnisse.push({ fall: fall.name, masse, felderImFenster, tastatur, grund })
      await page.screenshot({ path: join(ziel, `r4-rahmen-${fall.name}.png`), fullPage: true })
      await context.close()
    }
  } finally {
    await browser.close()
    await new Promise<void>((resolve, reject) => server.close((problem) => (problem ? reject(problem) : resolve())))
  }

  const bericht = {
    klasse: 'synthetisch-lokaler-stub-am-gelieferten-rahmen',
    offizielleForm: 'nicht-geladen',
    r2: 'datiert, kein frischer Anbieterbeweis',
    ausgabe: nachweisOrdner() === ziel ? 'konfiguriert-oder-temp' : 'konfiguriert-oder-temp',
    externe,
    ergebnisse,
    fehler,
  }
  writeFileSync(join(ziel, 'r4-rahmen.json'), JSON.stringify(bericht, null, 2))
  console.log(`nachweis: ${ziel}`)
  if (fehler.length > 0 || externe.length > 0) {
    console.error(fehler.concat(externe.map((eintrag) => `${eintrag.fall} ${eintrag.origin}${eintrag.path}`)).join('\n'))
    process.exit(1)
  }
  console.log(JSON.stringify(ergebnisse, null, 2))
}

const direkt = process.argv[1]?.endsWith('rahmen-nachweis.ts') === true
if (direkt) void main()
