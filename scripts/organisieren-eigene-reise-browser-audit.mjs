#!/usr/bin/env node
// Dev-only browser acceptance. No Production login, writes, provider or payment calls.
// Run with a local Next dev server: AUDIT_BASE=http://127.0.0.1:3456 node scripts/organisieren-eigene-reise-browser-audit.mjs
import { mkdirSync } from 'node:fs'
import { join } from 'node:path'
import { chromium } from 'playwright'

const BASE = process.env.AUDIT_BASE || 'http://127.0.0.1:3456'
if (!/^http:\/\/(127\.0\.0\.1|localhost):\d+$/.test(BASE)) throw new Error('Local Dev base URL required; Production is forbidden')
const OUT = process.env.AUDIT_EVIDENCE_DIR || join(process.cwd(), 'docs/evidence/organisieren-eigene-reise-local')
mkdirSync(OUT, { recursive: true })
const MATRIX = [[320, 760], [390, 844], [1280, 800]]
const KATEGORIEN = [
  ['fluege', 'Flüge', 'Flug Phuket 1', 'flug-1'],
  ['unterkunft', 'Unterkunft', 'Unterkunft Phuket', 'unterkunft-1'],
  ['aktivitaeten', 'Aktivitäten', 'Aktivität Phuket', 'aktivitaet-1'],
  ['mietwagen', 'Mietwagen', 'Mietwagen Phuket', 'mietwagen-1'],
  ['verbindungen', 'Verbindungen', 'Verbindung Phuket', 'verbindung-1'],
]
const JETZT = '2026-11-20T09:00:00.000Z'
const PUNKT_BASIS = {
  dayId: 'day-1', stageId: 'stage-1', position: 1, note: null,
  startsOn: '2026-12-01', startsAt: '10:00', endsOn: '2026-12-01', endsAt: '11:00',
  priceAmount: null, priceCurrency: null, provider: null, externalRef: null,
  bookingUrl: null, bookingStatus: 'unconfirmed', bookingSource: null,
  bookingConfirmedAt: null, mobilityMode: null, originPlaceId: null,
  destinationPlaceId: null, originName: null, destinationName: null,
  connectionRef: null, mobilityChanges: null, mobilityEvidence: null,
  rentalSupplier: null, vehicleClass: null, transmission: null, rentalEvidence: null,
}
const items = [
  ...[1, 2, 3].map(i => ({ ...PUNKT_BASIS, id: 'flug-' + i, kind: 'flight', title: 'Flug Phuket ' + i, position: i })),
  { ...PUNKT_BASIS, id: 'unterkunft-1', kind: 'stay', title: 'Unterkunft Phuket', position: 4,
    endsOn: '2026-12-02' },
  { ...PUNKT_BASIS, id: 'aktivitaet-1', kind: 'activity', title: 'Aktivität Phuket', position: 5 },
  { ...PUNKT_BASIS, id: 'mietwagen-1', kind: 'rental_car', title: 'Mietwagen Phuket', position: 6 },
  { ...PUNKT_BASIS, id: 'verbindung-1', kind: 'transfer', title: 'Verbindung Phuket', position: 7 },
]
const reise = {
  id: 'test-nur-lokal-phuket', clientRef: 'test-nur-lokal-phuket', title: 'Synthetische Phuket-Reise',
  origin: 'Zürich', originPlaceId: 'geonames:2657896',
  startDate: '2026-12-01', endDate: '2026-12-03', travellers: 2,
  currency: 'CHF', budgetAmount: null, status: 'draft', pace: 'balanced', interests: [],
  travelWish: null, revision: 1, lastMutationId: null,
  stages: [{ id: 'stage-1', position: 1, name: 'Phuket', countryCode: 'TH',
    arrivalDate: '2026-12-01', departureDate: '2026-12-03',
    latitude: null, longitude: null, placeId: null }],
  days: [
    { id: 'day-1', stageId: 'stage-1', dayIndex: 1, dayDate: '2026-12-01', title: null, items },
    { id: 'day-2', stageId: 'stage-1', dayIndex: 2, dayDate: '2026-12-02', title: null, items: [] },
  ],
  ohneTag: [], readinessItems: [], party: [], createdAt: JETZT, updatedAt: JETZT,
}

const browser = await chromium.launch({ headless: true, args: ['--no-sandbox', '--disable-dev-shm-usage'] })
const failures = [], evidence = []
const localHost = new URL(BASE).host
const forbidden = /\/api\/(flights|hotels|activities|rental-cars|mobility|kayak)\b/
try {
  for (const [width, height] of MATRIX) for (const theme of ['light', 'dark']) {
    const context = await browser.newContext({ viewport: { width, height }, hasTouch: width < 700 })
    const page = await context.newPage()
    const unexpected = []
    await page.route('**/*', async route => {
      const url = new URL(route.request().url())
      if (url.host !== localHost || forbidden.test(url.pathname)) {
        if (forbidden.test(url.pathname)) unexpected.push(url.pathname)
        await route.abort()
      } else await route.continue()
    })
    await page.addInitScript(({ trip, mode }) => {
      sessionStorage.setItem('jetnity:ui-audit:workspace', JSON.stringify({
        reise: trip, quelle: 'account', mitAenderung: false, mitBegleiter: false, mitSuche: true,
      }))
      localStorage.setItem('jetnity:workspace-theme:v1', mode)
    }, { trip: reise, mode: theme })
    try {
      await page.goto(BASE + '/ui-audit/trip-workspace?ansicht=organisieren&kategorie=fluege', { waitUntil: 'load' })
      await page.locator('[data-workspace-theme="' + theme + '"]').waitFor()
      for (const [k, label, title, itemId] of KATEGORIEN) {
        if (k !== 'fluege') await page.getByRole('tab', { name: label, exact: true }).click()
        const panel = page.locator('[data-suchbereich="' + k + '"]')
        await panel.waitFor({ state: 'visible' })
        const inventory = panel.locator('[data-organisieren-bestand="' + k + '"]')
        await inventory.waitFor({ state: 'visible' })
        const content = await inventory.innerText()
        if (!content.includes(title)) throw new Error(k + ': saved item missing')
        if (k === 'fluege' && !content.includes('3 Flüge')) throw new Error('three saved flights not visible')
        const disclosure = panel.locator('[data-organisieren-suche-toggle="' + k + '"]')
        if (await disclosure.getAttribute('aria-expanded') !== 'false') throw new Error(k + ': legacy search opened automatically')
        if (await panel.locator('[data-organisieren-suche="' + k + '"]').isVisible()) throw new Error(k + ': search visible without click')
        if (await page.getByText('Der passende Flug für deine Reise.', { exact: true }).count()) throw new Error('old KAYAK search mounted')
        const overflow = await page.evaluate(() => document.documentElement.scrollWidth > innerWidth + 1)
        if (overflow) throw new Error(k + ': horizontal overflow')
        const shot = join(OUT, 'inventory-' + k + '-' + width + '-' + theme + '.png')
        await inventory.screenshot({ path: shot })
        evidence.push(shot)
        const gespeicherte = k === 'fluege'
          ? [['Flug Phuket 1', 'flug-1'], ['Flug Phuket 2', 'flug-2'], ['Flug Phuket 3', 'flug-3']]
          : [[title, itemId]]
        for (const [erwarteterTitel, erwarteteId] of gespeicherte) {
          await inventory.locator('button.org-bestand-zeile').filter({ hasText: erwarteterTitel }).first().click()
          await page.locator('[data-workspace-detail="item"]').waitFor({ state: 'visible' })
          const url = new URL(page.url())
          if (url.pathname !== '/ui-audit/trip-workspace' || url.searchParams.get('ansicht') !== 'plan' ||
            url.searchParams.get('punkt') !== erwarteteId) throw new Error(k + ': selected item left this trip or opened generic search')
          if (!await page.locator('[data-workspace-detail="item"]').innerText().then(t => t.includes(erwarteterTitel))) throw new Error(k + ': wrong detail')
          await page.goBack({ waitUntil: 'load' })
          await panel.waitFor({ state: 'visible' })
        }
      }
      if (unexpected.length) throw new Error('Provider call without explicit action: ' + unexpected.join(', '))
    } catch (error) { failures.push(width + '/' + theme + ': ' + String(error)) }
    await context.close()
  }
} finally { await browser.close() }
console.log(JSON.stringify({ matrix: MATRIX, themes: ['light', 'dark'], categories: KATEGORIEN.length, screenshots: evidence.length, failures }, null, 2))
if (failures.length) process.exitCode = 1
