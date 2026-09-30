#!/usr/bin/env node
// scripts/trip-workspace-cross-device-interaction-1-audit.mjs
//
// Instrumented guest Trip Workspace interaction evidence.
// Synthetic local trip only. Provider routes are intercepted.
// Does not activate search, providers, Auth or Production.

import { execSync } from 'node:child_process'
import { spawn } from 'node:child_process'
import { mkdirSync, writeFileSync } from 'node:fs'
import { join } from 'node:path'
import { chromium } from 'playwright'

const PORT = process.env.AUDIT_PORT || '3017'
const BASIS = process.env.AUDIT_BASE || `http://127.0.0.1:${PORT}`
const PHASE = process.env.AUDIT_PHASE || 'baseline'
const EVIDENZ =
  process.env.AUDIT_EVIDENCE_DIR ||
  '/workspace/docs/evidence/trip-workspace-cross-device-interaction-1'
const SCHLUESSEL = 'jetnity:reise:v3'
const SHA = execSync('git rev-parse HEAD', { encoding: 'utf8' }).trim()
const DIRTY = execSync('git status --porcelain', { encoding: 'utf8' })
  .split('\n')
  .map((zeile) => zeile.trim())
  .filter(Boolean)

const VIEWPORTS = [
  { name: '360x800', width: 360, height: 800, hasTouch: true },
  { name: '390x844', width: 390, height: 844, hasTouch: true },
  { name: '768x1024', width: 768, height: 1024, hasTouch: true },
  { name: '1024x768', width: 1024, height: 768, hasTouch: false },
  { name: '1280x800', width: 1280, height: 800, hasTouch: false },
  { name: '1440x900', width: 1440, height: 900, hasTouch: false },
  { name: '1920x1080', width: 1920, height: 1080, hasTouch: false },
]

const JETZT_FIXTURE = '2026-09-30T09:00:00.000Z'

function etappe(teil) {
  return {
    countryCode: 'ID',
    latitude: null,
    longitude: null,
    placeId: null,
    ...teil,
  }
}

function tag(teil) {
  return { title: null, items: [], ...teil }
}

function flugPunkt() {
  return {
    id: 'item-flight-zrh',
    kind: 'flight',
    title: 'ZRH–DPS',
    dayId: 'day-1',
    stageId: 'stage-1',
    note: null,
    position: 1,
    startsOn: '2026-10-12',
    startsAt: null,
    endsOn: null,
    endsAt: null,
    priceAmount: null,
    priceCurrency: null,
    provider: null,
    externalRef: null,
    bookingUrl: null,
    bookingStatus: 'unconfirmed',
    bookingSource: null,
    bookingConfirmedAt: null,
    mobilityMode: null,
    originPlaceId: null,
    destinationPlaceId: null,
    originName: null,
    destinationName: null,
    connectionRef: null,
    mobilityChanges: null,
    mobilityEvidence: null,
    rentalSupplier: null,
    vehicleClass: null,
    transmission: null,
    rentalEvidence: null,
  }
}

function reise(mitFlug = false) {
  return {
    id: 'trip-cross-device-interaction-1',
    clientRef: 'trip-cross-device-interaction-1',
    title: 'Zürich nach Bali',
    origin: 'Zürich',
    originPlaceId: 'geonames:2657896',
    startDate: '2026-10-12',
    endDate: '2026-10-22',
    travellers: 2,
    currency: 'CHF',
    budgetAmount: 4200,
    status: 'draft',
    pace: 'balanced',
    interests: ['beach'],
    travelWish: null,
    revision: 1,
    lastMutationId: null,
    stages: [
      etappe({
        id: 'stage-1',
        position: 1,
        name: 'Ubud',
        arrivalDate: '2026-10-12',
        departureDate: '2026-10-16',
        placeId: 'geonames:1622786',
      }),
      etappe({
        id: 'stage-2',
        position: 2,
        name: 'Singapur',
        countryCode: 'SG',
        arrivalDate: '2026-10-19',
        departureDate: '2026-10-22',
      }),
    ],
    days: [
      tag({
        id: 'day-1',
        stageId: 'stage-1',
        dayIndex: 1,
        dayDate: '2026-10-12',
        items: mitFlug ? [flugPunkt()] : [],
      }),
      tag({ id: 'day-2', stageId: 'stage-1', dayIndex: 2, dayDate: '2026-10-13' }),
      tag({ id: 'day-3', stageId: 'stage-2', dayIndex: 3, dayDate: '2026-10-19' }),
    ],
    ohneTag: [],
    createdAt: JETZT_FIXTURE,
    updatedAt: JETZT_FIXTURE,
  }
}

const LUECKE = reise(false)
const MIT_PUNKT = reise(true)
MIT_PUNKT.id = 'trip-cross-device-interaction-1-item'
MIT_PUNKT.clientRef = MIT_PUNKT.id

const UNAVAILABLE = {
  status: 'unavailable',
  message: 'Simulated unavailable. No live provider call.',
  coverageNote: 'Intercepted in trip-workspace-cross-device-interaction-1-audit.',
  options: [],
}

async function serverErreichbar() {
  try {
    const antwort = await fetch(BASIS, { redirect: 'manual' })
    return antwort.status > 0
  } catch {
    return false
  }
}

async function serverStarten() {
  if (await serverErreichbar()) return { kind: null, reused: true }
  const kind = spawn('npm', ['run', 'dev', '--', '-p', PORT, '-H', '127.0.0.1'], {
    env: {
      ...process.env,
      NEXT_PUBLIC_SUPABASE_URL: process.env.NEXT_PUBLIC_SUPABASE_URL || 'https://placeholder.supabase.co',
      NEXT_PUBLIC_SUPABASE_ANON_KEY:
        process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY ||
        'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InBsYWNlaG9sZGVyIiwicm9sZSI6ImFub24iLCJpYXQiOjE2OTAwMDAwMDAsImV4cCI6MjAwMDAwMDAwMH0.audit',
      NEXT_PUBLIC_APP_URL: BASIS,
    },
    stdio: ['ignore', 'pipe', 'pipe'],
  })
  const start = Date.now()
  while (Date.now() - start < 90_000) {
    if (await serverErreichbar()) return { kind, reused: false }
    await new Promise((resolve) => setTimeout(resolve, 400))
  }
  throw new Error('Dev-Server wurde nicht erreichbar.')
}

async function abfangen(page) {
  const muster = [
    '**/api/flights/search',
    '**/api/hotels/search',
    '**/api/activities/search',
    '**/api/mobility/search',
    '**/api/rental-cars/search',
    '**/api/reisebegleiter/**',
  ]
  for (const url of muster) {
    await page.route(url, async (route) => {
      await route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify(UNAVAILABLE),
      })
    })
  }
}

async function hydrationWarten(page) {
  await page.waitForFunction(
    () => {
      const knopf = document.querySelector('a[href="/reisen"]')
      if (!knopf) return false
      const faser = Object.keys(knopf).some(
        (name) => name.startsWith('__reactFiber') || name.startsWith('__reactProps'),
      )
      if (faser) return true
      return knopf.getAttribute('data-cursor-ref') != null || document.querySelector('h1, main') != null
    },
    { timeout: 30_000 },
  )
}

async function workspaceOeffnen(page, fixture) {
  await page.addInitScript(
    ({ schluessel, reise }) => {
      window.localStorage.setItem(schluessel, JSON.stringify(reise))
    },
    { schluessel: SCHLUESSEL, reise: fixture },
  )
  await abfangen(page)
  await page.goto(`${BASIS}/reisen/${fixture.id}`, { waitUntil: 'load', timeout: 60_000 })
  await hydrationWarten(page)
  await page.evaluate(
    ({ schluessel, reise }) => {
      window.localStorage.setItem(schluessel, JSON.stringify(reise))
    },
    { schluessel: SCHLUESSEL, reise: fixture },
  )
  if (!page.url().includes(fixture.id)) {
    await page.goto(`${BASIS}/reisen/${fixture.id}`, { waitUntil: 'load', timeout: 60_000 })
    await hydrationWarten(page)
  }
  await page.getByRole('heading', { name: 'Deine Reise auf einen Blick' }).waitFor({ timeout: 20_000 })
}

async function messen(page, extra = {}) {
  return page.evaluate((zusatz) => {
    const rechteck = (el) => {
      if (!(el instanceof HTMLElement)) return null
      const r = el.getBoundingClientRect()
      const sichtbar = !el.hidden && el.getClientRects().length > 0
      return {
        tag: el.tagName,
        text: (el.innerText || el.getAttribute('aria-label') || '').replace(/\s+/g, ' ').trim().slice(0, 140),
        top: Math.round(r.top),
        left: Math.round(r.left),
        width: Math.round(r.width),
        height: Math.round(r.height),
        bottom: Math.round(r.bottom),
        right: Math.round(r.right),
        intersectsViewport: sichtbar && r.bottom > 0 && r.top < window.innerHeight && r.right > 0 && r.left < window.innerWidth,
        fullyInViewport: sichtbar && r.top >= 0 && r.left >= 0 && r.bottom <= window.innerHeight && r.right <= window.innerWidth,
      }
    }

    const bereich = (name) => {
      const el = document.querySelector(`[data-arbeitsbereich="${name}"]`)
      if (!(el instanceof HTMLElement)) return { name, mounted: false, visible: false, box: null }
      const box = rechteck(el)
      return { name, mounted: true, visible: !el.hidden && el.getClientRects().length > 0, box }
    }

    const detail = document.querySelector('[data-workspace-detail]')
    const detailHuelle = document.querySelector('[data-arbeitsbereich="detail"]')
    const uebersicht = document.querySelector('[data-arbeitsbereich="uebersicht"]')
    const detailHeading = detail?.querySelector('h2') ?? null
    const suchNamen = ['flugsuche', 'hotelsuche', 'aktivitaeten', 'mobilitaet']
    const sichtbareArbeit = suchNamen
      .map((name) => document.querySelector(`[data-arbeitsbereich="${name}"]`))
      .find((el) => el instanceof HTMLElement && !el.hidden && el.getClientRects().length > 0)
    const arbeitHeading = sichtbareArbeit?.querySelector('h2') ?? null
    const erstesFeld = sichtbareArbeit?.querySelector('input:not([type="hidden"]), select, textarea') ?? null
    const grid = document.querySelector('[data-workspace-split]')
    const gridStil = grid ? getComputedStyle(grid) : null
    const aktiv = document.activeElement
    const aktivIstSeite = aktiv === document.body || aktiv === document.documentElement
    const detailBox = rechteck(detail)
    const arbeitBox = rechteck(sichtbareArbeit)
    const arbeitImDetailKontext = Boolean(
      detailBox &&
        arbeitBox &&
        Math.abs(arbeitBox.left - detailBox.left) <= 48 &&
        arbeitBox.top >= detailBox.top - 8 &&
        arbeitBox.top < detailBox.bottom + window.innerHeight,
    )
    const arbeitUnterDemSplit = Boolean(
      grid &&
        arbeitBox &&
        detailHuelle &&
        grid.contains(detailHuelle) &&
        !grid.contains(sichtbareArbeit) &&
        arbeitBox.top >= grid.getBoundingClientRect().bottom - 8,
    )

    return {
      viewport: { width: window.innerWidth, height: window.innerHeight },
      scrollY: Math.round(window.scrollY),
      scrollHeight: document.documentElement.scrollHeight,
      clientWidth: document.documentElement.clientWidth,
      scrollWidth: document.documentElement.scrollWidth,
      horizontalOverflow: document.documentElement.scrollWidth > document.documentElement.clientWidth + 1,
      activeElement: aktiv
        ? {
            tag: aktiv.tagName,
            text: aktivIstSeite
              ? ''
              : (aktiv.innerText || aktiv.getAttribute('aria-label') || aktiv.getAttribute('placeholder') || '')
                  .replace(/\s+/g, ' ')
                  .trim()
                  .slice(0, 120),
            type: aktiv.getAttribute('type'),
          }
        : null,
      grid: gridStil
        ? {
            display: gridStil.display,
            template: gridStil.gridTemplateColumns,
          }
        : null,
      detail: detailBox,
      detailHeading: rechteck(detailHeading),
      uebersicht: rechteck(uebersicht),
      arbeit: arbeitBox,
      arbeitName: sichtbareArbeit?.getAttribute('data-arbeitsbereich') ?? null,
      arbeitHeading: rechteck(arbeitHeading),
      erstesFeld: rechteck(erstesFeld),
      bereiche: ['detail', 'fluege', 'unterkunft', 'flugsuche', 'hotelsuche', 'aktivitaeten', 'mobilitaet'].map(bereich),
      arbeitImDetailKontext,
      arbeitUnterDemSplit,
      anordnung: document.querySelector('[data-workspace-anordnung]')?.getAttribute('data-workspace-anordnung') ?? null,
      ...zusatz,
    }
  }, extra)
}

async function schliessen(page) {
  const zurueck = page.locator('[data-workspace-detail] button', { hasText: 'Zurück zur Reise' })
  if (await zurueck.count()) {
    await zurueck.first().click()
  } else {
    await page.keyboard.press('Escape')
  }
  await page.getByRole('heading', { name: 'Deine Reise auf einen Blick' }).waitFor({ state: 'visible', timeout: 10_000 })
  await page.waitForTimeout(80)
}

async function knopfKlick(page, locator, tastatur) {
  await locator.scrollIntoViewIfNeeded()
  const vorher = await messen(page)
  const invoker = await locator.boundingBox()
  if (tastatur) {
    await locator.focus()
    await page.keyboard.press('Enter')
  } else {
    await locator.focus()
    await locator.evaluate((el) => {
      el.dispatchEvent(new MouseEvent('click', { bubbles: true, cancelable: true, detail: 1 }))
    })
  }
  await page.waitForTimeout(180)
  return { vorher, invoker }
}

async function speichern(page, name) {
  const datei = join(EVIDENZ, 'screens', PHASE, `${name}.png`)
  mkdirSync(join(EVIDENZ, 'screens', PHASE), { recursive: true })
  await page.screenshot({ path: datei, fullPage: false })
  return datei
}

async function lauf(browser, viewport) {
  const ctx = await browser.newContext({
    viewport: { width: viewport.width, height: viewport.height },
    hasTouch: viewport.hasTouch,
    deviceScaleFactor: 1,
  })
  const page = await ctx.newPage()
  const schritte = []
  const fehler = []

  const notiere = async (name, tastatur = false, screen = false) => {
    const stand = await messen(page, { step: name, keyboard: tastatur })
    let screenshot = null
    if (screen) screenshot = await speichern(page, `${name}_${viewport.name}`)
    schritte.push({ name, screenshot, ...stand })
    return stand
  }

  try {
    await workspaceOeffnen(page, LUECKE)
    await page.evaluate(() => window.scrollTo(0, 0))
    await notiere('top-overview')

    const weitere = page.getByRole('button', { name: /weitere Hinweise/ })
    if (await weitere.count()) await weitere.click()
    const jetzt = page.getByRole('button', { name: /Flugstrecke noch offen|Flugstand noch unklar|Flüge nur teilweise geplant/ })
    await knopfKlick(page, jetzt, false)
    await page.locator('[data-workspace-detail]').waitFor({ timeout: 10_000 })
    await notiere('jetzt-flights-gap', false, true)
    const flugSuchen = page.getByRole('button', { name: 'Flug suchen', exact: true })
    await knopfKlick(page, flugSuchen, false)
    await page.locator('[data-arbeitsbereich="flugsuche"]').waitFor({ timeout: 10_000 })
    await page.waitForTimeout(120)
    await notiere('jetzt-flug-suchen', false, true)

    await page.keyboard.press('Escape')
    await page.waitForTimeout(150)
    const escapeGeschlossen = (await page.locator('[data-workspace-detail]').count()) === 0
    await notiere('escape-nach-suche', true)
    if (!escapeGeschlossen) await schliessen(page)

    await page.evaluate(() => window.scrollTo(0, 0))
    await page.waitForTimeout(40)
    const fluege = page.getByRole('button', { name: 'Flüge', exact: true })
    await knopfKlick(page, fluege, false)
    await page.locator('[data-workspace-detail]').waitFor({ timeout: 10_000 })
    await page.evaluate(() => {
      const max = Math.max(0, document.documentElement.scrollHeight - window.innerHeight)
      window.scrollTo(0, Math.min(max, 420))
    })
    await page.waitForTimeout(60)
    await notiere('overview-flights-scrolled')
    await knopfKlick(page, page.getByRole('button', { name: 'Flug suchen', exact: true }), false)
    await page.waitForTimeout(120)
    await notiere('overview-flug-suchen', false, true)

    await schliessen(page)
    await page.evaluate(() => window.scrollTo(0, 0))
    await knopfKlick(page, page.getByRole('button', { name: 'Unterkunft', exact: true }), false)
    await page.getByRole('button', { name: 'Unterkunft suchen', exact: true }).waitFor({ timeout: 10_000 })
    await knopfKlick(page, page.getByRole('button', { name: 'Unterkunft suchen', exact: true }), false)
    await page.locator('[data-arbeitsbereich="hotelsuche"]').waitFor({ timeout: 10_000 })
    await page.waitForTimeout(200)
    await notiere('unterkunft-suchen', false, true)

    await schliessen(page)
    await page.evaluate(() => window.scrollTo(0, 0))
    await knopfKlick(page, page.getByRole('button', { name: 'Aktivitäten', exact: true }), false)
    await page.getByRole('button', { name: 'Aktivitäten suchen', exact: true }).waitFor({ timeout: 10_000 })
    await knopfKlick(page, page.getByRole('button', { name: 'Aktivitäten suchen', exact: true }), false)
    await page.locator('[data-arbeitsbereich="aktivitaeten"]').waitFor({ timeout: 10_000 })
    await page.waitForTimeout(200)
    await notiere('aktivitaeten-suchen', false, true)

    await schliessen(page)
    await page.evaluate(() => window.scrollTo(0, 0))
    await knopfKlick(page, page.getByRole('button', { name: 'Mobilität', exact: true }), false)
    await page.locator('[data-arbeitsbereich="mobilitaet"]').waitFor({ timeout: 10_000 })
    await page.waitForTimeout(160)
    await notiere('mobilitaet', false, true)

    await page.goto('about:blank')
    await workspaceOeffnen(page, MIT_PUNKT)
    await page.evaluate(() => window.scrollTo(0, 0))
    const punkt = page.getByRole('button', { name: 'Flug ZRH–DPS', exact: true })
    await knopfKlick(page, punkt, false)
    await page.locator('[data-workspace-detail="item"]').waitFor({ timeout: 10_000 })
    await page.waitForTimeout(120)
    await notiere('item-detail', false, true)

    await schliessen(page)
    await page.evaluate(() => window.scrollTo(0, 0))
    await knopfKlick(page, page.getByRole('button', { name: 'Flüge', exact: true }), true)
    await page.locator('[data-workspace-detail]').waitFor({ timeout: 10_000 })
    await knopfKlick(page, page.getByRole('button', { name: 'Flug suchen', exact: true }), true)
    await page.locator('[data-arbeitsbereich="flugsuche"]').waitFor({ timeout: 10_000 })
    await page.waitForTimeout(120)
    await notiere('keyboard-flug-suchen', true, viewport.name === '1440x900' || viewport.name === '390x844')
    const fokusVorEscape = (await messen(page)).activeElement
    await page.keyboard.press('Escape')
    await page.waitForTimeout(160)
    const nachEscape = await notiere('keyboard-escape', true)
    schritte.push({
      name: 'keyboard-escape-focus',
      fokusVorEscape,
      fokusNachEscape: nachEscape.activeElement,
      scrollY: nachEscape.scrollY,
    })
  } catch (error) {
    fehler.push(String(error && error.stack ? error.stack : error))
    try {
      await speichern(page, `error_${viewport.name}`)
    } catch {
      // Screenshot is optional when the page is already gone.
    }
  }

  await ctx.close()
  return { viewport: viewport.name, schritte, fehler }
}

async function main() {
  mkdirSync(join(EVIDENZ, 'screens', PHASE), { recursive: true })
  const server = await serverStarten()
  const browser = await chromium.launch({ headless: true })
  const laeufe = []
  try {
    const nur = process.env.AUDIT_ONLY?.split(',').map((name) => name.trim()).filter(Boolean)
    const viewports = nur?.length ? VIEWPORTS.filter((viewport) => nur.includes(viewport.name)) : VIEWPORTS
    for (const viewport of viewports) {
      laeufe.push(await lauf(browser, viewport))
    }
  } finally {
    await browser.close()
    if (server.kind) {
      try {
        server.kind.kill('SIGTERM')
      } catch {
        // The dev server can already be gone.
      }
    }
  }

  const bericht = {
    phase: PHASE,
    sha: SHA,
    workingTree: DIRTY.length === 0 ? 'clean' : 'dirty',
    dirtyPaths: DIRTY,
    capturedAt: new Date().toISOString(),
    browser: 'chromium/playwright',
    origin: BASIS,
    server: server.reused ? 'reused-existing-dev' : 'spawned-dev',
    simulationClass: 'synthetic-guest-local + intercepted-unavailable',
    accountShell: 'same TripWorkspace via KontoArbeitsbereich; this harness is the guest route',
    route: `/reisen/${LUECKE.id}`,
    laeufe,
  }
  writeFileSync(join(EVIDENZ, `audit-${PHASE}.json`), JSON.stringify(bericht, null, 2))
  const problemen = laeufe.filter((eintrag) => eintrag.fehler.length > 0)
  console.log(
    JSON.stringify(
      {
        phase: PHASE,
        sha: SHA,
        viewports: laeufe.map((eintrag) => ({
          viewport: eintrag.viewport,
          steps: eintrag.schritte.length,
          errors: eintrag.fehler.length,
        })),
      },
      null,
      2,
    ),
  )
  if (problemen.length > 0) {
    console.error(problemen.map((eintrag) => `${eintrag.viewport}: ${eintrag.fehler[0]}`).join('\n'))
    process.exitCode = 1
  }
}

main().catch((error) => {
  console.error(error)
  process.exit(1)
})
