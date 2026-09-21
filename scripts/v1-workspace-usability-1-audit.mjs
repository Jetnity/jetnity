#!/usr/bin/env node
// scripts/v1-workspace-usability-1-audit.mjs
//
// Disposable local Chromium evidence for V1 Workspace Usability 1.
// Reuses Playwright + guest-localStorage injection from existing audits.
// Synthetic guest only. Provider/model routes are intercepted.

import { execSync } from 'node:child_process'
import { spawn } from 'node:child_process'
import { mkdirSync, writeFileSync } from 'node:fs'
import { dirname, join } from 'node:path'
import { chromium } from 'playwright'

const PORT = process.env.AUDIT_PORT || '3000'
const BASIS = process.env.AUDIT_BASE || `http://localhost:${PORT}`
const PHASE = process.env.AUDIT_PHASE || 'after'
const EVIDENZ =
  process.env.AUDIT_EVIDENCE_DIR ||
  '/workspace/docs/evidence/v1-workspace-usability-1'
const BERICHT = join(EVIDENZ, `audit-${PHASE}.json`)
const SCHLUESSEL = 'jetnity:reise:v3'
const SHA = execSync('git rev-parse HEAD', { encoding: 'utf8' }).trim()
const DIRTY = execSync('git status --porcelain', { encoding: 'utf8' })
  .split('\n')
  .map((zeile) => zeile.trim())
  .filter(Boolean)
const PRODUCT_TREE = {
  head: SHA,
  workingTree: DIRTY.length === 0 ? 'clean' : 'dirty',
  dirtyPaths: DIRTY,
}
const JETZT = new Date().toISOString()

const VIEWPORTS = [
  { name: '360x800', width: 360, height: 800, hasTouch: true },
  { name: '390x844', width: 390, height: 844, hasTouch: true },
  { name: '768x1024', width: 768, height: 1024, hasTouch: true },
  { name: '1024x768', width: 1024, height: 768, hasTouch: false },
  { name: '1440x900', width: 1440, height: 900, hasTouch: false },
  { name: '1920x1080', width: 1920, height: 1080, hasTouch: false },
]

const JETZT_FIXTURE = '2026-09-21T12:00:00.000Z'

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

function reise(teil = {}) {
  return {
    id: 'trip-v1-usability-complex',
    clientRef: 'trip-v1-usability-complex',
    title: 'Zürich–Bali–Singapur mit sehr langem Reisetitel ohne Abschneiden',
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
        name: 'Ubud mit sehr langem Etappennamen ohne horizontales Abschneiden',
        arrivalDate: '2026-10-12',
        departureDate: '2026-10-16',
        placeId: 'geonames:1622786',
      }),
      etappe({
        id: 'stage-2',
        position: 2,
        name: 'Seminyak',
        arrivalDate: '2026-10-16',
        departureDate: '2026-10-19',
      }),
      etappe({
        id: 'stage-3',
        position: 3,
        name: 'Singapur',
        countryCode: 'SG',
        arrivalDate: '2026-10-19',
        departureDate: '2026-10-22',
      }),
    ],
    days: [
      tag({ id: 'day-1', stageId: 'stage-1', dayIndex: 1, dayDate: '2026-10-12' }),
      tag({ id: 'day-2', stageId: 'stage-1', dayIndex: 2, dayDate: '2026-10-13' }),
      tag({ id: 'day-3', stageId: 'stage-2', dayIndex: 3, dayDate: '2026-10-16' }),
      tag({ id: 'day-4', stageId: 'stage-3', dayIndex: 4, dayDate: '2026-10-19' }),
    ],
    ohneTag: [],
    createdAt: JETZT_FIXTURE,
    updatedAt: JETZT_FIXTURE,
    ...teil,
  }
}

const COMPLEX = reise()
const SHORT = reise({
  id: 'trip-v1-usability-short',
  clientRef: 'trip-v1-usability-short',
  title: 'Bali',
})

const UNAVAILABLE = {
  status: 'unavailable',
  message: 'Simulated unavailable. No live provider call.',
  coverageNote: 'Intercepted in v1-workspace-usability-1-audit.',
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
  const kind = spawn('npm', ['run', 'dev', '--', '-p', PORT, '-H', 'localhost'], {
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
    await new Promise((r) => setTimeout(r, 400))
  }
  kind.kill()
  throw new Error('Next.js startete nicht')
}

async function abfangen(page) {
  const muster = [
    '**/api/flights/search',
    '**/api/hotels/search',
    '**/api/activities/search',
    '**/api/mobility/search',
    '**/api/rental-cars/search',
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
      const knopf = document.querySelector('button[aria-controls="oeffentliche-mobile-navigation"], a[href="/reisen"]')
      if (!knopf) return false
      return Object.keys(knopf).some(
        (name) => name.startsWith('__reactFiber') || name.startsWith('__reactProps'),
      )
    },
    { timeout: 20_000 },
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
  const antwort = await page.goto(`${BASIS}/reisen/${fixture.id}`, {
    waitUntil: 'load',
    timeout: 60_000,
  })
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
  await page.getByRole('heading', { name: 'Deine Reise auf einen Blick' }).waitFor({ timeout: 15_000 })
  return antwort?.ok() ?? false
}

function imViewport(box, hoehe) {
  if (!box) return false
  return box.y >= 0 && box.y + box.height <= hoehe
}

async function sichtbarkeit(page, hoehe) {
  const uebersicht = page.getByRole('heading', { name: 'Deine Reise auf einen Blick' })
  const jetzt = page.getByRole('heading', { name: 'Was jetzt Aufmerksamkeit braucht' })
  const fluege = page.getByRole('button', { name: 'Flüge', exact: true })
  const titel = page.locator('h1').first()
  const gast = page.getByText('Dieser Entwurf liegt nur in diesem Browser')
  const verwerfen = page.getByRole('button', { name: 'Entwurf verwerfen' })
  const attention = page.locator('[aria-label="Jetzt wichtig"] button').first()
  const boxes = {
    titel: await titel.boundingBox(),
    gast: (await gast.count()) ? await gast.boundingBox() : null,
    verwerfen: (await verwerfen.count()) ? await verwerfen.boundingBox() : null,
    uebersicht: (await uebersicht.count()) ? await uebersicht.boundingBox() : null,
    jetzt: (await jetzt.count()) ? await jetzt.boundingBox() : null,
    attention: (await attention.count()) ? await attention.boundingBox() : null,
    fluege: (await fluege.count()) ? await fluege.boundingBox() : null,
  }
  return {
    boxes,
    titelSichtbar: imViewport(boxes.titel, hoehe),
    gastSichtbar: imViewport(boxes.gast, hoehe),
    verwerfenSichtbar: imViewport(boxes.verwerfen, hoehe),
    uebersichtSichtbar: imViewport(boxes.uebersicht, hoehe),
    jetztSichtbar: imViewport(boxes.jetzt, hoehe),
    attentionSichtbar: imViewport(boxes.attention, hoehe),
    fluegeSichtbar: imViewport(boxes.fluege, hoehe),
    overflow: await page.evaluate(() => ({
      html: document.documentElement.scrollWidth - document.documentElement.clientWidth,
      body: document.body.scrollWidth - document.body.clientWidth,
      scrollY: window.scrollY,
      scrollHeight: document.documentElement.scrollHeight,
    })),
  }
}

async function speichern(page, name, extra) {
  const pfad = join(EVIDENZ, 'screens', `${PHASE}_${name}.png`)
  mkdirSync(dirname(pfad), { recursive: true })
  await page.screenshot({ path: pfad, fullPage: false, animations: 'disabled' })
  const meta = {
    file: pfad,
    phase: PHASE,
    name,
    sha: SHA,
    productTree: PRODUCT_TREE,
    capturedAt: new Date().toISOString(),
    browser: 'chromium/playwright',
    route: page.url(),
    viewport: page.viewportSize(),
    simulationClass: 'synthetic-guest + intercepted-unavailable',
    ...extra,
  }
  writeFileSync(`${pfad}.meta.json`, JSON.stringify(meta, null, 2))
  return meta
}

async function navigationMessen(page) {
  return page.evaluate(() => {
    const zurueck = [...document.querySelectorAll('button')].find((el) =>
      (el.textContent || '').includes('Zurück zur Reise'),
    )
    const heading = document.querySelector('[data-workspace-detail] h2')
    const aktiv = document.activeElement
    const box = (el) => {
      if (!el) return null
      const r = el.getBoundingClientRect()
      return { x: r.x, y: r.y, w: r.width, h: r.height, top: r.top, bottom: r.bottom }
    }
    return {
      scrollY: window.scrollY,
      focus: aktiv
        ? {
            tag: aktiv.tagName,
            text: (aktiv.textContent || '').replace(/\s+/g, ' ').trim().slice(0, 80),
            aria: aktiv.getAttribute('aria-label'),
          }
        : null,
      zurueck: box(zurueck),
      heading: heading ? { text: (heading.textContent || '').trim(), ...box(heading) } : null,
    }
  })
}

async function kontext(browser, viewport) {
  return browser.newContext({
    viewport: { width: viewport.width, height: viewport.height },
    hasTouch: viewport.hasTouch,
    locale: 'de-CH',
  })
}

async function overviewSerie(browser, fixture, label) {
  const metas = []
  for (const viewport of VIEWPORTS) {
    const ctx = await kontext(browser, viewport)
    const page = await ctx.newPage()
    await workspaceOeffnen(page, fixture)
    await page.evaluate(() => window.scrollTo(0, 0))
    const sicht = await sichtbarkeit(page, viewport.height)
    const meta = await speichern(page, `${label}-overview_${viewport.name}`, { sicht, state: 'overview-top' })
    metas.push(meta)
    if (viewport.name === '390x844' || viewport.name === '1024x768') {
      const plan = page.locator('[data-tagesplan-modul="ein"]')
      if (await plan.count()) {
        await plan.scrollIntoViewIfNeeded()
        metas.push(
          await speichern(page, `${label}-day_${viewport.name}`, {
            state: 'tagesplan-scrolled',
            stageDates: await page.locator('[data-timeline-etappe]').allInnerTexts(),
          }),
        )
      }
    }
    await ctx.close()
  }
  return metas
}

async function vux4(browser) {
  const viewport = VIEWPORTS.find((v) => v.name === '390x844')
  const ctx = await kontext(browser, viewport)
  const page = await ctx.newPage()
  await workspaceOeffnen(page, COMPLEX)
  const oeffnen = async (name, wie) => {
    const knopf = page.getByRole('button', { name, exact: true })
    await knopf.scrollIntoViewIfNeeded()
    await page.waitForTimeout(50)
    await knopf.focus()
    if (wie === 'keyboard') {
      await page.keyboard.press('Enter')
    } else {
      await knopf.evaluate((el) => el.click())
    }
    await page.locator('[data-workspace-detail]').waitFor({ timeout: 10_000 })
    await page.waitForTimeout(80)
  }

  const schliessen = async (wie) => {
    if (wie === 'escape') {
      const detailZurueck = page.locator('[data-workspace-detail] button', { hasText: 'Zurück zur Reise' })
      if (await detailZurueck.count()) await detailZurueck.first().focus()
      await page.keyboard.press('Escape')
    } else {
      await page.getByRole('button', { name: 'Zurück zur Reise' }).first().click()
    }
    await page.getByRole('heading', { name: 'Deine Reise auf einen Blick' }).waitFor({
      state: 'visible',
      timeout: 10_000,
    })
  }

  await page.evaluate(() => window.scrollTo(0, 0))
  const topBefore = await navigationMessen(page)
  await oeffnen('Flüge', 'click')
  const topAfterFluege = await navigationMessen(page)
  await speichern(page, 'complex-flights-from-top_390x844', {
    state: 'gap-flights-from-top',
    before: topBefore,
    after: topAfterFluege,
  })
  await schliessen('click')
  const topReturn = await navigationMessen(page)
  await speichern(page, 'complex-return-from-top_390x844', {
    state: 'return-from-top',
    after: topReturn,
  })

  const fluege = page.getByRole('button', { name: 'Flüge', exact: true })
  await fluege.scrollIntoViewIfNeeded()
  const scrolledBefore = await navigationMessen(page)
  await oeffnen('Unterkunft', 'click')
  const scrolledAfter = await navigationMessen(page)
  await speichern(page, 'complex-hotel-from-scrolled_390x844', {
    state: 'gap-hotel-from-scrolled',
    before: scrolledBefore,
    after: scrolledAfter,
  })
  await schliessen('escape')
  const scrolledReturn = await navigationMessen(page)

  await page.evaluate(() => window.scrollTo(0, 0))
  await oeffnen('Flüge', 'keyboard')
  const keyboardAfter = await navigationMessen(page)
  await speichern(page, 'complex-flights-keyboard_390x844', {
    state: 'gap-flights-keyboard',
    after: keyboardAfter,
  })
  await schliessen('escape')
  await oeffnen('Flüge', 'click')
  await schliessen('click')
  await oeffnen('Unterkunft', 'click')
  const repeatAfter = await navigationMessen(page)
  await schliessen('click')

  await ctx.close()
  return {
    fromTop: { before: topBefore, after: topAfterFluege, returned: topReturn },
    fromScrolled: { before: scrolledBefore, after: scrolledAfter, returned: scrolledReturn },
    keyboard: keyboardAfter,
    repeat: repeatAfter,
  }
}

function sprung(vorher, nachher) {
  return Math.abs((nachher ?? 0) - (vorher ?? 0))
}

async function lage(page) {
  const nav = await navigationMessen(page)
  const overflow = await page.evaluate(() => ({
    scrollY: window.scrollY,
    scrollHeight: document.documentElement.scrollHeight,
    clientHeight: document.documentElement.clientHeight,
  }))
  return { ...nav, ...overflow }
}

async function vuxR2(browser) {
  const viewport = VIEWPORTS.find((v) => v.name === '390x844')
  const r2Reise = reise({
    days: COMPLEX.days.map((einTag, index) =>
      index === 0
        ? {
            ...einTag,
            items: [
              {
                id: 'item-r2-flight',
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
              },
            ],
          }
        : einTag,
    ),
  })
  const ctx = await kontext(browser, viewport)
  const page = await ctx.newPage()
  await workspaceOeffnen(page, r2Reise)

  const oeffnen = async () => {
    const knopf = page.getByRole('button', { name: 'Flüge', exact: true })
    await knopf.scrollIntoViewIfNeeded()
    await knopf.focus()
    await knopf.evaluate((el) => el.click())
    await page.locator('[data-workspace-detail]').waitFor({ timeout: 10_000 })
    await page.getByText('Bestand und Status').waitFor({ timeout: 10_000 })
    await page.waitForTimeout(200)
  }

  await page.evaluate(() => window.scrollTo(0, 0))
  await oeffnen()
  const nachOeffnen = await lage(page)
  const ziel = await page.evaluate((offen) => {
    const max = Math.max(0, document.documentElement.scrollHeight - window.innerHeight)
    const oben = Math.min(max, Math.max(offen + 380, Math.round(max * 0.55)))
    window.scrollTo({ top: oben, behavior: 'instant' })
    return { top: window.scrollY, max, scrollHeight: document.documentElement.scrollHeight }
  }, nachOeffnen.scrollY)
  await page.waitForTimeout(80)
  const nachHandscroll = await lage(page)

  const buchung = page.getByRole('button', { name: 'Als gebucht markieren' })
  let parentUpdate = 'none'
  if (await buchung.count()) {
    await buchung.first().evaluate((el) => el.click())
    parentUpdate = 'booking-toggle'
    await page.waitForTimeout(200)
  }
  const nachUpdate = await lage(page)

  const suche = page.getByRole('button', { name: 'Flug suchen' })
  await suche.evaluate((el) => el.click())
  await page.waitForTimeout(220)
  const nachSuche = await lage(page)
  const sucheGemountet = (await page.getByText('Verbindungen für diese Reise').count()) > 0
    || (await page.locator('[data-arbeitsbereich="flugsuche"]').count()) > 0
  await speichern(page, 'complex-r2-scrolled-search_390x844', {
    state: 'gap-flights-after-manual-scroll-parent-update-and-explicit-search',
    afterOpen: nachOeffnen,
    afterManualScroll: nachHandscroll,
    afterBenignUpdate: nachUpdate,
    afterSearch: nachSuche,
    scrollTarget: ziel,
    parentUpdate,
  })

  await ctx.close()

  const schnell = await kontext(browser, viewport)
  const schnellPage = await schnell.newPage()
  await workspaceOeffnen(schnellPage, COMPLEX)
  await schnellPage.evaluate(() => window.scrollTo(0, 0))
  const knopf = schnellPage.getByRole('button', { name: 'Flüge', exact: true })
  await knopf.scrollIntoViewIfNeeded()
  await knopf.focus()
  await knopf.evaluate((el) => el.click())
  await schnellPage.locator('[data-workspace-detail]').waitFor({ timeout: 10_000 })
  const detailZurueck = schnellPage.locator('[data-workspace-detail] button', {
    hasText: 'Zurück zur Reise',
  })
  if (await detailZurueck.count()) await detailZurueck.first().focus()
  await schnellPage.keyboard.press('Escape')
  await schnellPage.getByRole('heading', { name: 'Deine Reise auf einen Blick' }).waitFor({
    state: 'visible',
    timeout: 10_000,
  })
  await schnellPage.waitForTimeout(120)
  const nachSchnellClose = await lage(schnellPage)
  const uebersicht = await schnellPage.getByRole('heading', { name: 'Deine Reise auf einen Blick' }).boundingBox()
  await speichern(schnellPage, 'complex-r2-rapid-close_390x844', {
    state: 'rapid-close-return',
    note: 'Escape after detail mount and back-control focus. This does not measure whether rAF/timeout were still pending.',
    after: nachSchnellClose,
    uebersicht,
  })
  await schnell.close()

  const resetNachUpdate = sprung(nachUpdate.scrollY, nachOeffnen.scrollY) <= 40
    && sprung(nachHandscroll.scrollY, nachOeffnen.scrollY) > 80
  const resetNachSuche = sprung(nachSuche.scrollY, nachOeffnen.scrollY) <= 40
    && sprung(nachHandscroll.scrollY, nachOeffnen.scrollY) > 80

  return {
    afterOpenScrollY: nachOeffnen.scrollY,
    afterManualScrollY: nachHandscroll.scrollY,
    afterBenignUpdateScrollY: nachUpdate.scrollY,
    afterSearchScrollY: nachSuche.scrollY,
    scrollHeightAfterOpen: nachOeffnen.scrollHeight,
    scrollTarget: ziel,
    parentUpdate,
    jumpAfterUpdate: sprung(nachHandscroll.scrollY, nachUpdate.scrollY),
    jumpAfterSearch: sprung(nachHandscroll.scrollY, nachSuche.scrollY),
    resetToOpenAfterUpdate: resetNachUpdate,
    resetToOpenAfterSearch: resetNachSuche,
    explicitSearchMounted: sucheGemountet,
    headingStillFluege: nachSuche.heading?.text === 'Flüge',
    rapidClose: {
      kind: 'return-after-escape',
      overviewHeadingWaitVisible: Boolean(uebersicht),
      overviewHeadingTopPx: uebersicht?.y ?? null,
      scrollY: nachSchnellClose.scrollY,
      note: 'Waits for detail mount and focuses the in-detail back control before Escape. Not a measurement that deferred rAF/timeout were still queued.',
    },
  }
}

function inSicht(box, hoehe) {
  if (!box) return false
  return box.top < hoehe && box.bottom > 0
}

async function main() {
  mkdirSync(join(EVIDENZ, 'screens'), { recursive: true })
  const server = await serverStarten()
  const browser = await chromium.launch({ headless: true })
  const captures = []
  let navigation = null
  let r2 = null
  const fokus = process.env.AUDIT_FOCUS || 'all'
  try {
    if (fokus === 'all') {
      captures.push(...(await overviewSerie(browser, COMPLEX, 'complex')))
      captures.push(...(await overviewSerie(browser, SHORT, 'short')))
      try {
        navigation = await vux4(browser)
      } catch (fehler) {
        navigation = { error: String(fehler) }
      }
    }
    if (fokus === 'all' || fokus === 'r2') {
      try {
        r2 = await vuxR2(browser)
      } catch (fehler) {
        r2 = { error: String(fehler) }
      }
    }
  } finally {
    await browser.close()
    if (server.kind) {
      try {
        server.kind.kill('SIGTERM')
      } catch {
        // Next can detach from the spawn.
      }
    }
  }

  const first390 = captures.find((c) => c.name === 'complex-overview_390x844')
  const first1024 = captures.find((c) => c.name === 'complex-overview_1024x768')
  const bericht = {
    phase: PHASE,
    sha: SHA,
    productTree: PRODUCT_TREE,
    capturedAt: JETZT,
    browser: 'chromium/playwright',
    origin: BASIS,
    server: server.reused ? 'reused-existing-dev' : 'spawned-dev',
    simulationClass: 'synthetic-guest + intercepted-unavailable',
    realDevice: false,
    captures,
    firstViewport: {
      complex390: first390?.sicht ?? null,
      complex1024: first1024?.sicht ?? null,
    },
    vux4: navigation?.error
      ? { error: navigation.error }
      : navigation
        ? {
            fromTopBackInView: inSicht(navigation?.fromTop.after.zurueck, 844),
            fromTopHeadingInView: inSicht(navigation?.fromTop.after.heading, 844),
            fromScrolledBackInView: inSicht(navigation?.fromScrolled.after.zurueck, 844),
            fromScrolledHeadingInView: inSicht(navigation?.fromScrolled.after.heading, 844),
            detail: navigation,
          }
        : null,
    vuxR2: r2,
  }
  if (r2) {
    writeFileSync(join(EVIDENZ, 'vux-r2-interaction.json'), JSON.stringify({
      id: 'VUX-R2',
      sha: SHA,
      productTree: PRODUCT_TREE,
      capturedAt: JETZT,
      browser: 'chromium/playwright',
      viewport: { width: 390, height: 844 },
      simulationClass: 'synthetic-guest + intercepted-unavailable',
      ...r2,
    }, null, 2))
  }
  writeFileSync(BERICHT, JSON.stringify(bericht, null, 2))
  console.log(JSON.stringify({
    phase: PHASE,
    sha: SHA,
    datei: BERICHT,
    captures: captures.length,
    complex390: first390?.sicht,
    vux4: bericht.vux4,
    vuxR2: r2,
  }, null, 2))
}

await main()
