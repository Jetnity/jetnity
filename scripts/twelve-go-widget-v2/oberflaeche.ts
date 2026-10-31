// Geometrie der geschlossenen 12Go-Fläche in einem frischen Browser.
// Synthetisches Markup, kein App-Login, kein Klick zu einer Buchung.
// 200%-Text ist die Wurzel-Schrift 32px. Chrome-Zoom und echte Geräte laufen hier nicht.

import { createRequire } from 'node:module'
import { mkdirSync, readFileSync, writeFileSync } from 'node:fs'
import { join } from 'node:path'
import { createElement } from 'react'
import { renderToStaticMarkup } from 'react-dom/server'
import { chromium, devices, type Browser } from 'playwright'

import TwelveGoAffiliateLinks from '@/components/trips/TwelveGoAffiliateLinks'
import { unbestaetigteBuchung } from '@/lib/trips/buchung'
import { leereMobilitaet } from '@/lib/trips/mobilitaet-felder'
import { nachweisOrdner } from '@/scripts/twelve-go-widget-v2/rahmen-nachweis'
import type { Trip, TripItem, TripStage } from '@/types/trips'

/**
 * Dieselbe Reihenfolge wie die App: `app/layout.tsx` lädt globals, dann
 * white-mint. `WorkspaceShell` lädt danach die beiden Workspace-Dateien.
 * globals wird mit der bestehenden Tailwind-Konfiguration übersetzt.
 */
export const ANWENDUNGS_STIL_REIHENFOLGE = [
  'styles/globals.css',
  'styles/white-mint.css',
  'components/workspace/workspace.css',
  'components/workspace/workspace-surfaces.css',
] as const

const V1_HREF = 'https://12go.asia/?z=17323861&sub_id=jetnity-mobility-route'
const JETZT = '2026-10-29T18:00:00.000Z'

function etappe(id: string, name: string, position: number, placeId: string | null = null): TripStage {
  return {
    id,
    name,
    position,
    countryCode: 'TH',
    arrivalDate: null,
    departureDate: null,
    latitude: null,
    longitude: null,
    placeId,
  }
}

const reise: Trip = {
  id: 'synthetic-twelve-go-widget',
  clientRef: null,
  title: 'Synthetic',
  origin: 'Zürich',
  originPlaceId: 'geonames:2657896',
  startDate: '2026-11-01',
  endDate: '2026-11-20',
  travellers: 2,
  currency: 'CHF',
  budgetAmount: null,
  status: 'draft',
  pace: 'calm',
  interests: [],
  travelWish: null,
  revision: 1,
  lastMutationId: null,
  stages: [etappe('a', 'Chiang Mai', 1, 'geonames:1153671'), etappe('b', 'Ayutthaya', 2), etappe('c', 'Hua Hin', 3)],
  days: [],
  ohneTag: [],
  createdAt: JETZT,
  updatedAt: JETZT,
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

async function anwendungsStil(): Promise<string> {
  const verlangen = createRequire(import.meta.url)
  const postcss = verlangen('postcss') as (plugins: unknown[]) => {
    process: (css: string, opts: { from: string }) => Promise<{ css: string }>
  }
  const nesting = verlangen('tailwindcss/nesting') as () => unknown
  const tailwindcss = verlangen('tailwindcss') as (config: unknown) => unknown
  const autoprefixer = verlangen('autoprefixer') as () => unknown
  const wurzel = process.cwd()
  const from = join(wurzel, ANWENDUNGS_STIL_REIHENFOLGE[0])
  const config = verlangen(join(wurzel, 'tailwind.config.js')) as unknown
  const uebersetzt = await postcss([nesting(), tailwindcss(config), autoprefixer()]).process(readFileSync(from, 'utf8'), { from })
  const rest = ANWENDUNGS_STIL_REIHENFOLGE.slice(1)
    .map((datei) => readFileSync(join(wurzel, datei), 'utf8'))
    .join('\n')
  return `${uebersetzt.css}\n${rest}`.replaceAll('</style', '<\\/style')
}

const FAELLE = [
  { name: '320', width: 320, height: 1100, root: '16px', emulation: null },
  { name: '390', width: 390, height: 1100, root: '16px', emulation: null },
  { name: '768', width: 768, height: 1100, root: '16px', emulation: null },
  { name: '1440', width: 1440, height: 1100, root: '16px', emulation: null },
  { name: '320-root-32', width: 320, height: 1400, root: '32px', emulation: null },
  { name: '390-root-32', width: 390, height: 1400, root: '32px', emulation: null },
  { name: 'iphone-13-emulation', width: devices['iPhone 13'].viewport.width, height: devices['iPhone 13'].viewport.height, root: '16px', emulation: 'iPhone 13' },
  { name: 'pixel-5-emulation', width: devices['Pixel 5'].viewport.width, height: devices['Pixel 5'].viewport.height, root: '16px', emulation: 'Pixel 5' },
]

function dokument(markup: string, stil: string): string {
  return `<!doctype html><html lang="de-CH"><head><meta charset="utf-8"><style>${stil}</style></head><body>${markup}</body></html>`
}

async function main() {
  const ziel = nachweisOrdner()
  mkdirSync(ziel, { recursive: true })
  const stil = await anwendungsStil()
  const markup = renderToStaticMarkup(createElement(TwelveGoAffiliateLinks, { reise }))
  const html = dokument(markup, stil)
  writeFileSync(join(ziel, 'flaeche.html'), html)

  const browser = await chromium.launch({ headless: true, args: ['--no-sandbox', '--disable-dev-shm-usage'] })
  const fehler: string[] = []
  const ergebnisse = []
  const fremd: { fall: string; adresse: string }[] = []

  try {
    for (const fall of FAELLE) {
      const geraet = fall.emulation ? devices[fall.emulation] : null
      const context = await browser.newContext({
        ...(geraet ?? {}),
        viewport: { width: fall.width, height: fall.height },
        locale: 'de-CH',
      })
      const page = await context.newPage()
      await context.route('**/*', (route) => {
        const adresse = route.request().url()
        if (!istLoopback(adresse)) {
          fremd.push({ fall: fall.name, adresse: new URL(adresse).origin })
          return route.abort()
        }
        return route.continue()
      })
      await page.setContent(html, { waitUntil: 'networkidle' })
      await page.evaluate((root) => {
        document.documentElement.style.fontSize = root
      }, fall.root)
      const masse = await page.evaluate(() => {
        const flaeche = document.querySelector('[data-twelve-go-affiliate]')
        const links = [...document.querySelectorAll('a[data-twelve-go-art]')]
        const widget = document.querySelector('[data-twelve-go-widget]')
        return {
          anzahl: links.length,
          ueberlauf: document.documentElement.scrollWidth > document.documentElement.clientWidth + 1,
          knoepfe: flaeche?.querySelectorAll('button').length ?? -1,
          marker: widget?.getAttribute('data-twelve-go-widget'),
          ausfuehrbar: widget?.getAttribute('data-twelve-go-widget-ausfuehrbar'),
          widgetHoehe: widget?.getBoundingClientRect().height ?? 0,
          ziele: links.map((link) => ({
            art: link.getAttribute('data-twelve-go-art'),
            rel: link.getAttribute('rel'),
            target: link.getAttribute('target'),
            href: link.getAttribute('href'),
            hoehe: link.getBoundingClientRect().height,
            breite: link.getBoundingClientRect().width,
          })),
          iframes: document.querySelectorAll('iframe').length,
          scripts: document.querySelectorAll('script').length,
          text: document.body.innerText,
        }
      })
      await page.keyboard.press('Tab')
      const fokus = await page.evaluate(() => ({
        art: document.activeElement?.getAttribute('data-twelve-go-art') ?? null,
        tag: document.activeElement?.tagName ?? null,
      }))
      if (fall.name === '390') {
        await page.keyboard.press('Escape')
        await page.keyboard.press('Space')
        const nachSpace = await page.evaluate(() => document.querySelector('[data-twelve-go-widget]')?.getAttribute('data-twelve-go-widget'))
        if (nachSpace !== 'consent-blocked') fehler.push('Escape/Space entfernt den Hinweis')
        const enterZiele: string[] = []
        await context.unroute('**/*')
        await context.route('**/*', (route) => {
          const adresse = route.request().url()
          if (istLoopback(adresse)) return route.continue()
          enterZiele.push(adresse)
          return route.abort()
        })
        const popup = page.waitForEvent('popup', { timeout: 2000 }).catch(() => null)
        await page.keyboard.press('Enter')
        await popup
        await page.waitForTimeout(300)
        if (enterZiele.length === 0) fehler.push('Enter öffnet den V1-Link nicht')
        if (enterZiele.some((adresse) => /trainbusferry/i.test(adresse))) fehler.push('Enter lädt den Widget-Loader')
        if (enterZiele.some((adresse) => !adresse.startsWith(V1_HREF))) {
          fehler.push(`Enter-Ziel unerwartet: ${enterZiele.length}`)
        }
      }
      await page.screenshot({ path: join(ziel, `r5-${fall.name}.png`), fullPage: true })
      ergebnisse.push({ ...fall, ...masse, fokus })
      await context.close()
    }
  } finally {
    await browser.close()
  }

  const transfer: TripItem = {
    id: 'transfer-1',
    dayId: null,
    stageId: null,
    kind: 'transfer',
    title: 'Fähre',
    note: null,
    position: 1,
    startsOn: '2026-11-15',
    startsAt: null,
    endsOn: null,
    endsAt: null,
    priceAmount: null,
    priceCurrency: 'CHF',
    provider: null,
    externalRef: null,
    bookingUrl: null,
    ...unbestaetigteBuchung(),
    ...leereMobilitaet(),
    originPlaceId: 'geonames:1153671',
    destinationPlaceId: 'geonames:1621034',
    originName: 'Chiang Mai',
    destinationName: 'Ayutthaya',
  }
  const mitDatum: Trip = {
    ...reise,
    stages: [etappe('a', 'Chiang Mai', 1, 'geonames:1153671'), etappe('b', 'Ayutthaya', 2, 'geonames:1621034')],
    ohneTag: [transfer],
  }
  let datumBrowser: Browser | null = null
  try {
    datumBrowser = await chromium.launch({ headless: true, args: ['--no-sandbox', '--disable-dev-shm-usage'] })
    const context = await datumBrowser.newContext()
    const page = await context.newPage()
    await page.setViewportSize({ width: 390, height: 1100 })
    const anfragen: string[] = []
    await context.route('**/*', (route) => {
      const adresse = route.request().url()
      if (!istLoopback(adresse)) {
        anfragen.push(new URL(adresse).origin)
        return route.abort()
      }
      return route.continue()
    })
    await page.setContent(dokument(renderToStaticMarkup(createElement(TwelveGoAffiliateLinks, { reise: mitDatum })), stil), { waitUntil: 'networkidle' })
    const datum = await page.evaluate(() => ({
      geplant: document.querySelector('[data-geplant]')?.getAttribute('data-geplant'),
      href: document.querySelector('a[data-twelve-go-art]')?.getAttribute('href') ?? '',
      text: document.body.innerText,
      marker: document.querySelector('[data-twelve-go-widget]')?.getAttribute('data-twelve-go-widget'),
    }))
    await page.screenshot({ path: join(ziel, 'r5-390-geplant.png'), fullPage: true })
    if (anfragen.length > 0) fehler.push('Datumseite ruft ein fremdes Netz auf')
    if (datum.geplant !== '2026-11-15') fehler.push(`Datum ${datum.geplant}`)
    if (datum.href.includes('date=') || datum.href.includes('2026-11-15')) fehler.push('Datum in der URL')
    if (datum.text.includes('CHF')) fehler.push('CHF steht in der Fläche')
    if (!datum.text.includes('Geplant am')) fehler.push('Plan-Datum fehlt')
    if (datum.marker !== 'consent-blocked') fehler.push('Datumsseite ohne geschlossenes Formular')
  } finally {
    await datumBrowser?.close()
  }

  if (fremd.length > 0) fehler.push(`Anbieteranfrage vor einer Entscheidung: ${fremd.length}`)
  for (const fall of ergebnisse) {
    if (fall.anzahl !== 2) fehler.push(`${fall.name}: ${fall.anzahl} Links`)
    if (fall.ueberlauf) fehler.push(`${fall.name}: horizontaler Überlauf`)
    if (fall.iframes !== 0 || fall.scripts !== 0) fehler.push(`${fall.name}: Drittinhalt`)
    if (fall.knoepfe !== 0) fehler.push(`${fall.name}: ${fall.knoepfe} Knöpfe`)
    if (fall.marker !== 'consent-blocked' || fall.ausfuehrbar !== 'false') fehler.push(`${fall.name}: Formular nicht geschlossen`)
    if (fall.widgetHoehe < 20) fehler.push(`${fall.name}: Hinweis unsichtbar`)
    if (!fall.text.includes('Eine Beispielstrecke wird nicht vorausgefüllt')) fehler.push(`${fall.name}: Hinweistext fehlt`)
    if (fall.text.includes('CHF')) fehler.push(`${fall.name}: CHF sichtbar`)
    if (fall.fokus.tag !== 'A') fehler.push(`${fall.name}: Fokus ${fall.fokus.tag}`)
    for (const zielLink of fall.ziele) {
      if (zielLink.art !== 'generic') fehler.push(`${fall.name}: art ${zielLink.art}`)
      if (zielLink.rel !== 'noopener noreferrer sponsored') fehler.push(`${fall.name}: rel`)
      if (zielLink.target !== '_blank') fehler.push(`${fall.name}: target`)
        if (!zielLink.href?.startsWith(V1_HREF)) fehler.push(`${fall.name}: href`)
      if (zielLink.hoehe < 44 || zielLink.breite < 44) fehler.push(`${fall.name}: Ziel ${zielLink.hoehe}x${zielLink.breite}`)
    }
  }

  const bericht = {
    klasse: 'synthetisch-ssr-mit-anwendungs-css',
    stil: ANWENDUNGS_STIL_REIHENFOLGE,
    ausgabe: 'TWELVE_GO_WIDGET_NACHWEIS_DIR oder OS-Temp',
    echtesGeraet: false,
    chromeZoom: 'nicht-ausgefuehrt',
    text200: 'root-font-32px',
    emulation: ['iPhone 13', 'Pixel 5'],
    ergebnisse: ergebnisse.map((fall) => ({
      name: fall.name,
      emulation: fall.emulation,
      hoehe: fall.ziele.map((zielLink) => Math.round(zielLink.hoehe)),
      fokus: fall.fokus.tag,
      ueberlauf: fall.ueberlauf,
      marker: fall.marker,
      knoepfe: fall.knoepfe,
    })),
    fremd,
    fehler,
  }
  writeFileSync(join(ziel, 'r5-oberflaeche.json'), JSON.stringify(bericht, null, 2))
  console.log(`nachweis: ${ziel}`)
  if (fehler.length > 0) {
    console.error(fehler.join('\n'))
    process.exit(1)
  }
  console.log(JSON.stringify(bericht.ergebnisse, null, 2))
}

if (process.argv[1]?.endsWith('oberflaeche.ts') === true) {
  void main().catch((fehler: unknown) => {
    console.error(fehler instanceof Error ? fehler.message : fehler)
    process.exit(1)
  })
}
