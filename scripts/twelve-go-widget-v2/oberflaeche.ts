// Geometrie der geschlossenen 12Go-Fläche in einem frischen Browser.
// Synthetisches Markup, kein App-Login, kein Klick zu einer Buchung.
// 200%-Text ist die Wurzel-Schrift 32px. Chrome-Zoom und echte Geräte laufen hier nicht.

import { mkdirSync, writeFileSync } from 'node:fs'
import { createElement } from 'react'
import { renderToStaticMarkup } from 'react-dom/server'
import { chromium, devices, type Browser } from 'playwright'

import TwelveGoAffiliateLinks from '@/components/trips/TwelveGoAffiliateLinks'
import { unbestaetigteBuchung } from '@/lib/trips/buchung'
import { leereMobilitaet } from '@/lib/trips/mobilitaet-felder'
import type { Trip, TripItem, TripStage } from '@/types/trips'

const ZIEL = '/opt/cursor/artifacts/twelve-go-widget-v2'
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

const STIL = `
  *, *::before, *::after { box-sizing: border-box; }
  html { font-size: 16px; }
  body { margin: 0; background: #f4f7f4; color: #14312c; font-family: sans-serif; }
  .min-h-11 { min-height: 2.75rem; }
  .inline-flex { display: inline-flex; }
  .w-full { width: 100%; }
  .max-w-full { max-width: 100%; }
  .min-w-0 { min-width: 0; }
  .items-center { align-items: center; }
  .break-words { overflow-wrap: anywhere; }
  .whitespace-normal { white-space: normal; }
  .rounded-full { border-radius: 9999px; }
  .rounded-2xl { border-radius: 1rem; }
  .rounded-\\[24px\\] { border-radius: 24px; }
  .border { border-width: 1px; border-style: solid; }
  .border-line-200, .border-line-300 { border-color: #d5e0da; }
  .bg-white { background: #fff; }
  .bg-surface-25 { background: #f7faf8; }
  .px-3 { padding-left: 0.75rem; padding-right: 0.75rem; }
  .px-4 { padding-left: 1rem; padding-right: 1rem; }
  .py-2 { padding-top: 0.5rem; padding-bottom: 0.5rem; }
  .py-3 { padding-top: 0.75rem; padding-bottom: 0.75rem; }
  .p-4 { padding: 1rem; }
  .text-xs { font-size: 0.75rem; }
  .text-sm { font-size: 0.875rem; line-height: 1.25rem; }
  .leading-6 { line-height: 1.5rem; }
  .text-xl { font-size: 1.25rem; line-height: 1.75rem; }
  .font-semibold { font-weight: 600; }
  .uppercase { text-transform: uppercase; }
  .tracking-\\[0\\.16em\\] { letter-spacing: 0.16em; }
  .text-brand-600 { color: #1f6a45; }
  .text-brand-800, .text-ink-800 { color: #14312c; }
  .mt-1 { margin-top: 0.25rem; }
  .mt-3 { margin-top: 0.75rem; }
  .mt-5 { margin-top: 1.25rem; }
  .grid { display: grid; }
  .gap-3 { gap: 0.75rem; }
  a:focus-visible, button:focus-visible { outline: 4px solid rgba(15, 92, 74, 0.35); outline-offset: 2px; }
  @media (min-width: 640px) {
    .sm\\:w-auto { width: auto; }
    .sm\\:p-5 { padding: 1.25rem; }
    .sm\\:text-2xl { font-size: 1.5rem; line-height: 2rem; }
  }
`

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

function dokument(markup: string): string {
  return `<!doctype html><html lang="de-CH"><head><meta charset="utf-8"><style>${STIL}</style></head><body>${markup}</body></html>`
}

async function main() {
  mkdirSync(ZIEL, { recursive: true })
  const markup = renderToStaticMarkup(createElement(TwelveGoAffiliateLinks, { reise }))
  const html = dokument(markup)
  writeFileSync(`${ZIEL}/flaeche.html`, html)

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
      page.on('request', (anfrage) => {
        const adresse = anfrage.url()
        if (/12go\.|trainbusferry/i.test(adresse)) fremd.push({ fall: fall.name, adresse })
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
        await context.route('**/*', (route) => {
          const adresse = route.request().url()
          if (/12go\.|trainbusferry/i.test(adresse)) enterZiele.push(adresse)
          return route.abort()
        })
        const popup = page.waitForEvent('popup', { timeout: 2000 }).catch(() => null)
        await page.keyboard.press('Enter')
        await popup
        await page.waitForTimeout(300)
        if (enterZiele.length === 0) fehler.push('Enter öffnet den V1-Link nicht')
        if (enterZiele.some((adresse) => /trainbusferry/i.test(adresse))) fehler.push('Enter lädt den Widget-Loader')
        if (enterZiele.some((adresse) => !adresse.startsWith('https://12go.asia/?z=17323861&sub_id=jetnity-mobility-route'))) {
          fehler.push(`Enter-Ziel unerwartet: ${enterZiele.length}`)
        }
      }
      await page.screenshot({ path: `${ZIEL}/${fall.name}.png`, fullPage: true })
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
    const page = await datumBrowser.newPage({ viewport: { width: 390, height: 1100 } })
    const anfragen: string[] = []
    page.on('request', (anfrage) => {
      if (/12go\.|trainbusferry/i.test(anfrage.url())) anfragen.push(anfrage.url())
    })
    await page.setContent(dokument(renderToStaticMarkup(createElement(TwelveGoAffiliateLinks, { reise: mitDatum }))), { waitUntil: 'networkidle' })
    const datum = await page.evaluate(() => ({
      geplant: document.querySelector('[data-geplant]')?.getAttribute('data-geplant'),
      href: document.querySelector('a[data-twelve-go-art]')?.getAttribute('href') ?? '',
      text: document.body.innerText,
      marker: document.querySelector('[data-twelve-go-widget]')?.getAttribute('data-twelve-go-widget'),
    }))
    await page.screenshot({ path: `${ZIEL}/390-geplant.png`, fullPage: true })
    if (anfragen.length > 0) fehler.push('Datumseite ruft 12Go auf')
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
      if (!zielLink.href?.startsWith('https://12go.asia/?z=17323861&sub_id=jetnity-mobility-route')) fehler.push(`${fall.name}: href`)
      if (zielLink.hoehe < 44 || zielLink.breite < 44) fehler.push(`${fall.name}: Ziel ${zielLink.hoehe}x${zielLink.breite}`)
    }
  }

  const bericht = {
    klasse: 'synthetisch-ssr-markup',
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
  writeFileSync(`${ZIEL}/oberflaeche.json`, JSON.stringify(bericht, null, 2))
  if (fehler.length > 0) {
    console.error(fehler.join('\n'))
    process.exit(1)
  }
  console.log(JSON.stringify(bericht.ergebnisse, null, 2))
}

void main().catch((fehler: unknown) => {
  console.error(fehler instanceof Error ? fehler.message : fehler)
  process.exit(1)
})
