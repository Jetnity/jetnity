// Lokaler Nachweis für Größe und Tastatur des undurchsichtigen Rahmens.
// Der Inhalt ist eine eigene Prüfseite, nicht das 12Go-Skript.
// Kein Ticketsuchen, kein Anbieteraufruf.

import { createHash } from 'node:crypto'
import { createServer } from 'node:http'
import { mkdirSync, readFileSync, writeFileSync } from 'node:fs'
import { join } from 'node:path'
import { createElement } from 'react'
import { renderToStaticMarkup } from 'react-dom/server'
import { chromium } from 'playwright'

import TwelveGoAffiliateLinks from '@/components/trips/TwelveGoAffiliateLinks'
import { TWELVE_GO_WIDGET_ALLGEMEIN_LAENGE, TWELVE_GO_WIDGET_ALLGEMEIN_SHA256 } from '@/lib/providers/twelve-go/widget/kennungen'
import { TWELVE_GO_WIDGET_RAHMEN_HOEHE_PX, TWELVE_GO_WIDGET_SANDBOX } from '@/lib/providers/twelve-go/widget/rahmen'
import type { Trip, TripStage } from '@/types/trips'

const ZIEL = '/opt/cursor/artifacts/twelve-go-widget-v2'
const JETZT = '2026-10-30T12:00:00.000Z'

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

function seite(): string {
  return `<!doctype html><html lang="de-CH"><head><meta charset="utf-8"><style>html,body{margin:0}</style></head><body>
<button type="button" id="start">Rahmen jetzt prüfen</button>
<iframe id="frame" sandbox="${TWELVE_GO_WIDGET_SANDBOX}" title="Lokale Prüfseite" style="width:100%;height:${TWELVE_GO_WIDGET_RAHMEN_HOEHE_PX}px;border:0"></iframe>
<script>
document.getElementById('start').addEventListener('click', () => {
  document.getElementById('frame').src = '/stub'
})
</script></body></html>`
}

function stub(): string {
  return `<!doctype html><html lang="de-CH"><head><meta charset="utf-8"></head><body>
<label>Start <input id="start" name="origin"></label>
<label>Ziel <input id="ziel" name="destination"></label>
<label>Datum <input id="datum" name="date"></label>
<p id="marke">Lokale Prüfmarke</p>
</body></html>`
}

const allgemein = readFileSync('lib/providers/twelve-go/widget/quelle/12go-widget-allgemein.html')
if (
  allgemein.length !== TWELVE_GO_WIDGET_ALLGEMEIN_LAENGE ||
  createHash('sha256').update(allgemein).digest('hex') !== TWELVE_GO_WIDGET_ALLGEMEIN_SHA256
) {
  throw new Error('Allgemeine Quelle verändert')
}

async function main() {
const server = createServer((anfrage, antwort) => {
  const url = new URL(anfrage.url ?? '/', 'http://127.0.0.1')
  antwort.setHeader('content-type', 'text/html; charset=utf-8')
  antwort.setHeader('cache-control', 'no-store')
  if (url.pathname === '/stub') {
    antwort.end(stub())
    return
  }
  antwort.end(seite())
})
await new Promise<void>((resolve) => server.listen(0, '127.0.0.1', () => resolve()))
const port = (server.address() as { port: number }).port

const browser = await chromium.launch({ headless: true, args: ['--no-sandbox', '--disable-dev-shm-usage'] })
const fehler: string[] = []
const ergebnisse = []
mkdirSync(ZIEL, { recursive: true })

try {
  const besucher = renderToStaticMarkup(createElement(TwelveGoAffiliateLinks, { reise }))
  if (besucher.includes('<iframe') || besucher.includes('trainbusferry') || besucher.includes('<script')) {
    fehler.push('Besucherfläche enthält einen Rahmen oder ein Skript')
  }

  for (const fall of [
    { name: '320', width: 320 },
    { name: '390', width: 390 },
  ]) {
    const context = await browser.newContext({ viewport: { width: fall.width, height: 1200 }, locale: 'de-CH' })
    const page = await context.newPage()
    const fremd: string[] = []
    page.on('request', (request) => {
      const adresse = request.url()
      if (/12go\.|trainbusferry|googleapis/i.test(adresse)) fremd.push(adresse)
    })
    await page.goto(`http://127.0.0.1:${port}/`, { waitUntil: 'networkidle' })
    await page.waitForTimeout(300)
    if (fremd.length > 0) fehler.push(`${fall.name}: Anbieter vor dem Klick`)
    await page.getByRole('button', { name: 'Rahmen jetzt prüfen' }).click()
    await page.waitForTimeout(400)
    const masse = await page.evaluate(() => {
      const frame = document.getElementById('frame') as HTMLIFrameElement
      const rect = frame.getBoundingClientRect()
      let inhalt = 'null'
      try {
        inhalt = frame.contentDocument ? 'readable' : 'null'
      } catch (problem) {
        inhalt = `thrown:${(problem as Error).name}`
      }
      return { width: rect.width, height: rect.height, sandbox: frame.getAttribute('sandbox'), inhalt }
    })
    const kind = page.frames().find((frame) => frame.url().includes('/stub'))
    if (!kind) fehler.push(`${fall.name}: Stub fehlt`)
    else {
      const felder = await kind.evaluate(() => {
        const sicht = document.documentElement.clientHeight
        const aus = []
        for (const el of document.querySelectorAll('input')) {
          const rect = el.getBoundingClientRect()
          aus.push({
            name: el.getAttribute('name'),
            top: Math.round(rect.top),
            imFenster: rect.top >= 0 && rect.bottom <= sicht && rect.height > 0,
          })
        }
        return { clientHeight: sicht, scrollHeight: document.documentElement.scrollHeight, felder: aus }
      })
      const start = kind.locator('#start')
      await start.click()
      await start.press('x')
      const laenge = await start.evaluate((el) => (el as HTMLInputElement).value.length)
      if (laenge !== 1) fehler.push(`${fall.name}: Tastatur ${laenge}`)
      if (felder.felder.length !== 3 || felder.felder.some((feld) => !feld.imFenster)) fehler.push(`${fall.name}: Feld ausserhalb`)
      ergebnisse.push({ fall: fall.name, masse, felder, laenge, fremd: fremd.length })
    }
    if (masse.width < fall.width - 2 || masse.height !== TWELVE_GO_WIDGET_RAHMEN_HOEHE_PX) {
      fehler.push(`${fall.name}: Rahmen ${masse.width}x${masse.height}`)
    }
    if (masse.sandbox !== TWELVE_GO_WIDGET_SANDBOX || masse.inhalt !== 'null') fehler.push(`${fall.name}: Sandbox ${masse.sandbox} ${masse.inhalt}`)
    if (fremd.length > 0) fehler.push(`${fall.name}: Anbieter nach dem Klick`)
    await page.screenshot({ path: join(ZIEL, `r3-rahmen-${fall.name}.png`), fullPage: true })
    await context.close()
  }
} finally {
  await browser.close()
  await new Promise<void>((resolve, reject) => server.close((problem) => (problem ? reject(problem) : resolve())))
}

const bericht = {
  klasse: 'synthetisch-lokaler-stub',
  anbieterAufgerufen: false,
  offizielleForm: 'nicht-erneut-geladen',
  r2Hinweis: 'Die sichtbare 12Go-Form bei 800px bleibt der frühere ephemere Nachweis.',
  ergebnisse,
  fehler,
}
writeFileSync(join(ZIEL, 'r3-rahmen.json'), JSON.stringify(bericht, null, 2))
if (fehler.length > 0) {
  console.error(fehler.join('\n'))
  process.exit(1)
}
console.log(JSON.stringify(ergebnisse, null, 2))
}

void main()
