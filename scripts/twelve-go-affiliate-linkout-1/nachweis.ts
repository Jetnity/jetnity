// Lokaler Geometrie-Nachweis für die 12Go-Fläche.
// Nicht Teil von npm test. Kein Klick auf 12go.asia.

import { mkdirSync, writeFileSync } from 'node:fs'
import { createElement } from 'react'
import { renderToStaticMarkup } from 'react-dom/server'
import { chromium } from 'playwright'

import TwelveGoAffiliateLinks from '@/components/trips/TwelveGoAffiliateLinks'
import type { Trip, TripStage } from '@/types/trips'

const JETZT = '2026-10-27T18:00:00.000Z'

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
    placeId: id === 'bkk' ? 'geonames:1609350' : null,
  }
}

const reise: Trip = {
  id: 'synthetic-twelve-go',
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
  stages: [etappe('bkk', 'Bangkok', 1), etappe('koh', 'Koh Chang', 2), etappe('hkt', 'Phuket', 3)],
  days: [],
  ohneTag: [],
  createdAt: JETZT,
  updatedAt: JETZT,
}

const STIL = `
  *, *::before, *::after { box-sizing: border-box; }
  html { font-size: 16px; }
  body { margin: 0; background: #f4f7f4; color: #14312c; }
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
  .px-3 { padding-left: 0.75rem; padding-right: 0.75rem; }
  .px-4 { padding-left: 1rem; padding-right: 1rem; }
  .py-2 { padding-top: 0.5rem; padding-bottom: 0.5rem; }
  .py-3 { padding-top: 0.75rem; padding-bottom: 0.75rem; }
  .p-4 { padding: 1rem; }
  .text-sm { font-size: 0.875rem; line-height: 1.5rem; }
  .text-xl { font-size: 1.25rem; line-height: 1.75rem; }
  .font-semibold { font-weight: 600; }
  .mt-1 { margin-top: 0.25rem; }
  .mt-3 { margin-top: 0.75rem; }
  .mt-5 { margin-top: 1.25rem; }
  .grid { display: grid; }
  .gap-3 { gap: 0.75rem; }
  a:focus-visible { outline: 4px solid rgba(15, 92, 74, 0.35); outline-offset: 2px; }
  @media (min-width: 640px) {
    .sm\\:w-auto { width: auto; }
    .sm\\:p-5 { padding: 1.25rem; }
    .sm\\:text-2xl { font-size: 1.5rem; line-height: 2rem; }
  }
`

const FAELLE = [
  { name: '320', width: 320, height: 900, root: '16px' },
  { name: '390', width: 390, height: 900, root: '16px' },
  { name: '768', width: 768, height: 1000, root: '16px' },
  { name: '1440', width: 1440, height: 1000, root: '16px' },
  { name: '320-root-32', width: 320, height: 1200, root: '32px' },
  { name: '390-root-32', width: 390, height: 1200, root: '32px' },
]

async function main() {
  const ziel = '/opt/cursor/artifacts/twelve-go-affiliate'
  mkdirSync(ziel, { recursive: true })

  const markup = renderToStaticMarkup(createElement(TwelveGoAffiliateLinks, { reise }))
  const html = `<!doctype html><html lang="de-CH"><head><meta charset="utf-8"><style>${STIL}</style></head><body>${markup}</body></html>`
  writeFileSync(`${ziel}/flaeche.html`, html)

  const browser = await chromium.launch({ headless: true, channel: 'chrome' })
  const ergebnisse = []
  const fremd: { fall: string; adresse: string }[] = []

  try {
    for (const fall of FAELLE) {
      const page = await browser.newPage({ viewport: { width: fall.width, height: fall.height } })
      page.on('request', (anfrage) => {
        const adresse = anfrage.url()
        if (adresse.includes('12go.asia')) fremd.push({ fall: fall.name, adresse })
      })
      await page.setContent(html, { waitUntil: 'networkidle' })
      await page.evaluate((root) => {
        document.documentElement.style.fontSize = root
      }, fall.root)
      const masse = await page.evaluate(() => {
        const links = [...document.querySelectorAll('a[data-twelve-go-art]')]
        const breit = document.documentElement.scrollWidth > document.documentElement.clientWidth + 1
        return {
          anzahl: links.length,
          ueberlauf: breit,
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
        }
      })
      await page.keyboard.press('Tab')
      const fokus = await page.evaluate(() => {
        const aktiv = document.activeElement
        return {
          art: aktiv?.getAttribute('data-twelve-go-art') ?? null,
          tag: aktiv?.tagName ?? null,
        }
      })
      await page.screenshot({ path: `${ziel}/${fall.name}.png`, fullPage: true })
      ergebnisse.push({ ...fall, ...masse, fokus })
      await page.close()
    }
  } finally {
    await browser.close()
  }

    const bericht = { ergebnisse, fremd, hinweis: 'Kein Klick auf 12Go. min-h-11 wird im Harness als 2.75rem nachgebildet.' }
    writeFileSync(`${ziel}/bericht.json`, JSON.stringify(bericht, null, 2))

    const fehler: string[] = []
    if (fremd.length > 0) fehler.push(`Anfragen an 12Go vor dem Klick: ${fremd.length}`)
    for (const fall of ergebnisse) {
      if (fall.anzahl !== 2) fehler.push(`${fall.name}: ${fall.anzahl} Links`)
      if (fall.ueberlauf) fehler.push(`${fall.name}: horizontaler Überlauf`)
      if (fall.iframes !== 0 || fall.scripts !== 0) fehler.push(`${fall.name}: Drittinhalt`)
      if (fall.fokus.tag !== 'A') fehler.push(`${fall.name}: Fokus ${fall.fokus.tag}`)
      for (const zielLink of fall.ziele) {
        if (zielLink.art !== 'generic') fehler.push(`${fall.name}: art ${zielLink.art}`)
        if (zielLink.rel !== 'noopener noreferrer sponsored') fehler.push(`${fall.name}: rel`)
        if (zielLink.target !== '_blank') fehler.push(`${fall.name}: target`)
        if (!zielLink.href?.startsWith('https://12go.asia/?z=17323861&sub_id=jetnity-mobility-route')) {
          fehler.push(`${fall.name}: href`)
        }
        if (zielLink.hoehe < 44) fehler.push(`${fall.name}: Höhe ${zielLink.hoehe}`)
        if (zielLink.breite < 44) fehler.push(`${fall.name}: Breite ${zielLink.breite}`)
      }
    }

    const mitDatum: Trip = {
      ...reise,
      stages: [
        { ...reise.stages[0]!, placeId: 'geonames:1609350', arrivalDate: '2026-11-01' },
        { ...reise.stages[1]!, placeId: 'geonames:9002', arrivalDate: '2026-11-16' },
      ],
      ohneTag: [
        {
          id: 'transfer-1',
          dayId: null,
          stageId: null,
          kind: 'transfer',
          title: 'Fähre',
          note: null,
          position: 1,
          startsOn: '2026-11-15',
          startsAt: null,
          endsOn: '2026-11-16',
          endsAt: null,
          priceAmount: null,
          priceCurrency: 'CHF',
          provider: null,
          externalRef: null,
          bookingUrl: null,
          bookingStatus: 'unconfirmed',
          bookingSource: null,
          bookingConfirmedAt: null,
          mobilityMode: 'ferry',
          originPlaceId: 'geonames:1609350',
          destinationPlaceId: 'geonames:9002',
          originName: 'Bangkok',
          destinationName: 'Koh Chang',
          connectionRef: null,
          mobilityChanges: null,
          mobilityEvidence: 'user',
          rentalSupplier: null,
          vehicleClass: null,
          transmission: null,
          rentalEvidence: null,
        },
      ],
    }
    const datumHtml = `<!doctype html><html lang="de-CH"><head><meta charset="utf-8"><style>${STIL}</style></head><body>${renderToStaticMarkup(createElement(TwelveGoAffiliateLinks, { reise: mitDatum }))}</body></html>`
    const datumSeite = await chromium.launch({ headless: true, channel: 'chrome' })
    try {
      const page = await datumSeite.newPage({ viewport: { width: 390, height: 900 } })
      const anfragen: string[] = []
      page.on('request', (anfrage) => {
        if (anfrage.url().includes('12go.asia')) anfragen.push(anfrage.url())
      })
      await page.setContent(datumHtml, { waitUntil: 'networkidle' })
      const datum = await page.evaluate(() => {
        const geplant = document.querySelector('[data-geplant]')?.getAttribute('data-geplant')
        const href = document.querySelector('a[data-twelve-go-art]')?.getAttribute('href') ?? ''
        return { geplant, href, text: document.body.innerText }
      })
      await page.screenshot({ path: `${ziel}/390-geplant.png`, fullPage: true })
      if (anfragen.length > 0) fehler.push('Datumseite ruft 12Go auf')
      if (datum.geplant !== '2026-11-15') fehler.push(`Datum ${datum.geplant}`)
      if (datum.href.includes('date=') || datum.href.includes('2026-11-15')) fehler.push('Datum in der URL')
      if (datum.text.includes('CHF')) fehler.push('CHF steht in der Fläche')
      if (!datum.text.includes('Geplant am')) fehler.push('Plan-Datum fehlt')
    } finally {
      await datumSeite.close()
    }

    if (fehler.length > 0) {
      console.error(fehler.join('\n'))
      process.exit(1)
    }

    console.log(JSON.stringify(ergebnisse.map((fall) => ({
      name: fall.name,
      hoehe: fall.ziele.map((zielLink) => Math.round(zielLink.hoehe)),
      fokus: fall.fokus.tag,
      ueberlauf: fall.ueberlauf,
    })), null, 2))
}

void main()
