#!/usr/bin/env node
// scripts/v1-workspace-status-language-1-audit.mjs
//
// Disposable local Chromium evidence for V1 Workspace Status Language 1.
// Synthetic guest only. Provider/model routes are intercepted. No account.

import { execSync } from 'node:child_process'
import { spawn } from 'node:child_process'
import { mkdirSync, writeFileSync } from 'node:fs'
import { dirname, join } from 'node:path'
import { chromium } from 'playwright'

const PORT = process.env.AUDIT_PORT || '3017'
const BASIS = process.env.AUDIT_BASE || `http://localhost:${PORT}`
const PHASE = process.env.AUDIT_PHASE || 'after'
const SCOPE = process.env.AUDIT_SCOPE || 'all'
const EVIDENZ =
  process.env.AUDIT_EVIDENCE_DIR ||
  '/workspace/docs/evidence/v1-workspace-status-language-1'
const BERICHT = join(
  EVIDENZ,
  SCOPE === 'all' ? `audit-${PHASE}.json` : `audit-${PHASE}-${SCOPE}.json`,
)
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
const BROWSER_LABEL = 'chromium/playwright'

const VIEWPORTS = [
  { name: '390x844', width: 390, height: 844, hasTouch: true },
  { name: '1440x900', width: 1440, height: 900, hasTouch: false },
]

const JETZT_FIXTURE = '2026-09-21T12:00:00.000Z'

const VERBOTEN_AFTER = [
  'Anbieter folgt',
  'Pflichtlücke',
  'vollständig bestimmbar',
  'noch nicht bestimmbar',
  'Flugabdeckung',
  'Unterkunftsabdeckung',
  'Zeitliche Lage noch nicht bestimmbar',
]

function leerPunkt(teil) {
  return {
    note: null,
    position: 1,
    startsOn: null,
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
    ...teil,
  }
}

function etappe(teil) {
  return {
    countryCode: 'ID',
    latitude: null,
    longitude: null,
    placeId: null,
    ...teil,
  }
}

function reise(teil = {}) {
  return {
    id: 'trip-v1-status-language',
    clientRef: 'trip-v1-status-language',
    title: 'Zürich–Bali Statussprache',
    origin: 'Zürich',
    originPlaceId: 'geonames:2657896',
    startDate: '2026-10-12',
    endDate: '2026-10-16',
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
    ],
    days: [
      { id: 'day-1', stageId: 'stage-1', dayIndex: 1, dayDate: '2026-10-12', title: null, items: [] },
    ],
    ohneTag: [],
    createdAt: JETZT_FIXTURE,
    updatedAt: JETZT_FIXTURE,
    ...teil,
  }
}

const OPEN = reise({ id: 'trip-v1-status-open', clientRef: 'trip-v1-status-open', title: 'Bekannt offen' })
const UNKNOWN = reise({
  id: 'trip-v1-status-unknown',
  clientRef: 'trip-v1-status-unknown',
  title: 'Stand noch unklar',
  origin: null,
  originPlaceId: null,
  startDate: null,
  endDate: null,
  stages: [
    etappe({
      id: 'stage-1',
      position: 1,
      name: 'Ubud',
      arrivalDate: null,
      departureDate: null,
      placeId: 'geonames:1622786',
    }),
  ],
})
const SAME_PLACE = reise({
  id: 'trip-v1-status-same-place',
  clientRef: 'trip-v1-status-same-place',
  title: 'Gleiche Stadt Zürich',
  origin: 'Zürich',
  originPlaceId: 'geonames:2657896',
  stages: [
    etappe({
      id: 'stage-1',
      position: 1,
      name: 'Zürich',
      countryCode: 'CH',
      arrivalDate: '2026-10-12',
      departureDate: '2026-10-16',
      placeId: 'geonames:2657896',
    }),
  ],
})

const MIXED = reise({
  id: 'trip-v1-status-mixed',
  clientRef: 'trip-v1-status-mixed',
  title: 'Teilweise geplant',
  ohneTag: [
    leerPunkt({
      id: 'flug-hin',
      kind: 'flight',
      title: 'ZRH → DPS',
      dayId: null,
      startsOn: '2026-10-12',
      bookingStatus: 'booked',
      bookingSource: 'user',
      bookingConfirmedAt: JETZT_FIXTURE,
    }),
  ],
  days: [
    {
      id: 'day-1',
      stageId: 'stage-1',
      dayIndex: 1,
      dayDate: '2026-10-12',
      title: null,
      items: [
        leerPunkt({
          id: 'stay-1',
          kind: 'stay',
          title: 'Ubud Inn',
          startsOn: '2026-10-12',
          endsOn: '2026-10-14',
        }),
      ],
    },
  ],
})

const UNAVAILABLE = {
  status: 'unavailable',
  message: 'Simulated unavailable. No live provider call.',
  coverageNote: 'Intercepted in v1-workspace-status-language-1-audit.',
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
    '**/api/ai/**',
    '**/api/models/**',
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

function sichtbareTexte(html) {
  return html.replace(/\s+/g, ' ')
}

async function seitenworte(page) {
  return page.evaluate(() => {
    const body = document.body?.innerText || ''
    const fortschritt = [...document.querySelectorAll('[data-workspace-detail] p, [aria-label="Reiseübersicht"] p, [aria-labelledby] p')]
      .map((el) => (el.textContent || '').replace(/\s+/g, ' ').trim())
      .filter(Boolean)
    const attention = [...document.querySelectorAll('[aria-label="Jetzt wichtig"] button, [aria-label="Jetzt wichtig"] li')].map(
      (el) => (el.textContent || '').replace(/\s+/g, ' ').trim(),
    )
    const detail = document.querySelector('[data-workspace-detail]')
    const eyebrow = detail?.querySelector('p')?.textContent?.trim() || null
    return {
      body,
      fortschritt,
      attention,
      eyebrow,
      gapLage: detail?.getAttribute('data-gap-lage') || null,
      gapPflicht: detail?.getAttribute('data-gap-pflicht') || null,
      suche: detail?.getAttribute('data-detail-suche') || null,
      heading: detail?.querySelector('h2')?.textContent?.trim() || null,
      zurueck: [...document.querySelectorAll('button')].some((el) => (el.textContent || '').includes('Zurück zur Reise')),
    }
  })
}

async function speichern(page, name, extra) {
  const pfad = join(EVIDENZ, 'screens', `${PHASE}_${name}.png`)
  mkdirSync(dirname(pfad), { recursive: true })
  await page.screenshot({ path: pfad, fullPage: false, animations: 'disabled' })
  const wort = await seitenworte(page)
  const meta = {
    file: pfad,
    phase: PHASE,
    name,
    sha: SHA,
    productTree: PRODUCT_TREE,
    capturedAt: new Date().toISOString(),
    browser: BROWSER_LABEL,
    browserVersion: await page.context().browser()?.version(),
    route: page.url(),
    viewport: page.viewportSize(),
    simulationClass: 'synthetic-guest + intercepted-unavailable',
    actionSequence: extra.actionSequence || [],
    state: extra.state,
    wording: {
      eyebrow: wort.eyebrow,
      heading: wort.heading,
      gapLage: wort.gapLage,
      gapPflicht: wort.gapPflicht,
      attention: wort.attention.slice(0, 6),
      fortschritt: wort.fortschritt.filter((zeile) =>
        /unklar|offen|vorhanden|geplant|ausgewählt|Nächte|Verbindung|Flug|Unterkunft|Punkt/.test(zeile),
      ).slice(0, 8),
    },
    ...extra,
  }
  writeFileSync(`${pfad}.meta.json`, JSON.stringify(meta, null, 2))
  return { meta, wort }
}

async function kontext(browser, viewport, extra = {}) {
  return browser.newContext({
    viewport: { width: viewport.width, height: viewport.height },
    hasTouch: viewport.hasTouch,
    locale: 'de-CH',
    ...extra,
  })
}

async function gapOeffnen(page, name, wie = 'click') {
  const knopf = page.getByRole('button', { name, exact: true })
  await knopf.scrollIntoViewIfNeeded()
  await knopf.focus()
  if (wie === 'keyboard') await page.keyboard.press('Enter')
  else await knopf.evaluate((el) => el.click())
  await page.locator('[data-workspace-detail]').waitFor({ timeout: 10_000 })
}

async function gapSchliessen(page) {
  const zurueck = page.locator('[data-workspace-detail] button', { hasText: 'Zurück zur Reise' })
  await zurueck.first().focus()
  await page.keyboard.press('Escape')
  await page.getByRole('heading', { name: 'Deine Reise auf einen Blick' }).waitFor({
    state: 'visible',
    timeout: 10_000,
  })
}

function verboteneTreffer(text) {
  if (PHASE !== 'after') return []
  return VERBOTEN_AFTER.filter((wort) => text.includes(wort))
}

function eigeneFlaeche(wort) {
  const detail = [wort.eyebrow, wort.heading, wort.gapLage, ...(wort.attention || [])]
  const uebersicht = (wort.fortschritt || []).filter((zeile) =>
    /unklar|bestimmbar|Pflichtlücke|Abdeckung|Anbieter folgt|Lücke/.test(zeile) &&
    !/benötigten Flugabschnitte|Nächte-Abdeckung|benötigten Verbindungen/.test(zeile),
  )
  return [...detail, ...uebersicht].filter(Boolean).join('\n')
}

async function serie(browser, fixture, label) {
  const ergebnis = []
  for (const viewport of VIEWPORTS) {
    const ctx = await kontext(browser, viewport)
    const page = await ctx.newPage()
    await workspaceOeffnen(page, fixture)
    await page.evaluate(() => window.scrollTo(0, 0))
    const overview = await speichern(page, `${label}-overview_${viewport.name}`, {
      state: `${label}-overview`,
      actionSequence: ['inject-guest', 'open-workspace', 'scroll-top'],
    })
    ergebnis.push(overview)

    if (viewport.name === '390x844') {
      await gapOeffnen(page, 'Flüge')
      ergebnis.push(
        await speichern(page, `${label}-flights-gap_${viewport.name}`, {
          state: `${label}-flights-gap`,
          actionSequence: ['open-workspace', 'click-Flüge'],
        }),
      )
      await gapSchliessen(page)
      if (label !== 'same-place') {
        await gapOeffnen(page, 'Unterkunft')
        ergebnis.push(
          await speichern(page, `${label}-stay-gap_${viewport.name}`, {
            state: `${label}-stay-gap`,
            actionSequence: ['return-overview', 'click-Unterkunft'],
          }),
        )
        await gapSchliessen(page)
      }
      if (label === 'open' || label === 'same-place') {
        if (label === 'open') {
          await gapOeffnen(page, 'Aktivitäten')
          ergebnis.push(
            await speichern(page, `${label}-activities-gap_${viewport.name}`, {
              state: `${label}-activities-optional`,
              actionSequence: ['return-overview', 'click-Aktivitäten'],
            }),
          )
          await gapSchliessen(page)
        }
        await gapOeffnen(page, 'Mobilität')
        ergebnis.push(
          await speichern(page, `${label}-mobility-gap_${viewport.name}`, {
            state: label === 'same-place' ? `${label}-mobility-no-needed` : `${label}-mobility-known-open`,
            actionSequence: ['return-overview', 'click-Mobilität'],
          }),
        )
        await gapSchliessen(page)
      }
    }

    if (viewport.name === '1440x900' && (label === 'unknown' || label === 'mixed')) {
      await gapOeffnen(page, 'Flüge')
      ergebnis.push(
        await speichern(page, `${label}-flights-gap_${viewport.name}`, {
          state: `${label}-flights-gap-desktop`,
          actionSequence: ['open-workspace', 'click-Flüge'],
        }),
      )
    }
    await ctx.close()
  }
  return ergebnis
}

async function text200(browser) {
  const viewport = VIEWPORTS[0]
  const ctx = await kontext(browser, viewport)
  const page = await ctx.newPage()
  await page.addInitScript(() => {
    document.documentElement.style.fontSize = '200%'
  })
  await workspaceOeffnen(page, MIXED)
  await page.evaluate(() => {
    document.documentElement.style.fontSize = '200%'
  })
  await page.waitForTimeout(80)
  const uebersicht = page.getByRole('heading', { name: 'Deine Reise auf einen Blick' })
  if (await uebersicht.count()) await uebersicht.scrollIntoViewIfNeeded()
  await page.waitForTimeout(80)
  const capture = await speichern(page, 'mixed-overview-200pct_390x844', {
    state: 'mixed-overview-200pct',
    actionSequence: ['open-mixed-workspace', 'set-html-font-size-200pct'],
    textZoom: '200%',
  })
  const overflow = await page.evaluate(() => ({
    html: document.documentElement.scrollWidth - document.documentElement.clientWidth,
    body: document.body.scrollWidth - document.body.clientWidth,
  }))
  await ctx.close()
  return { capture, overflow }
}

async function tastatur(browser) {
  const viewport = VIEWPORTS[0]
  const ctx = await kontext(browser, viewport)
  const page = await ctx.newPage()
  await workspaceOeffnen(page, OPEN)
  await page.evaluate(() => window.scrollTo(0, 0))
  await gapOeffnen(page, 'Flüge', 'keyboard')
  const offen = await speichern(page, 'open-flights-keyboard_390x844', {
    state: 'open-flights-keyboard',
    actionSequence: ['open-workspace', 'focus-Flüge', 'Enter'],
  })
  await gapSchliessen(page)
  const zurueck = await speichern(page, 'open-flights-keyboard-back_390x844', {
    state: 'open-flights-keyboard-back',
    actionSequence: ['detail-focus-Zurück', 'Escape'],
  })
  const uebersichtSichtbar = await page.getByRole('heading', { name: 'Deine Reise auf einen Blick' }).isVisible()
  await ctx.close()
  return { offen, zurueck, uebersichtSichtbar }
}

async function main() {
  mkdirSync(join(EVIDENZ, 'screens'), { recursive: true })
  const server = await serverStarten()
  const browser = await chromium.launch({ headless: true })
  const captures = []
  const scope = SCOPE
  if (scope === 'all' || scope === 'same-place') {
    captures.push(...(await serie(browser, SAME_PLACE, 'same-place')))
  }
  if (scope === 'all') {
    captures.push(...(await serie(browser, UNKNOWN, 'unknown')))
    captures.push(...(await serie(browser, MIXED, 'mixed')))
    captures.push(...(await serie(browser, OPEN, 'open')))
  }
  const zoom = scope === 'all' ? await text200(browser) : null
  const keys = scope === 'all' ? await tastatur(browser) : null
  await browser.close()
  if (server.kind) server.kind.kill()

  const texte = captures.map((eintrag) => eigeneFlaeche(eintrag.wort))
  const verboten = texte.flatMap(verboteneTreffer)
  const leereBilder = captures.filter((eintrag) => !eintrag.meta.file)
  const bericht = {
    phase: PHASE,
    capturedAt: JETZT,
    productTree: PRODUCT_TREE,
    browser: BROWSER_LABEL,
    simulationClass: 'synthetic-guest + intercepted-unavailable',
    scope,
    captures: captures.map((eintrag) => eintrag.meta),
    zoom: zoom ? { overflow: zoom.overflow, file: zoom.capture.meta.file } : { skipped: true, reason: 'scope-same-place' },
    keyboard: keys
      ? {
          overviewReturned: keys.uebersichtSichtbar,
          openFile: keys.offen.meta.file,
          backFile: keys.zurueck.meta.file,
        }
      : { skipped: true, reason: 'scope-same-place' },
    forbiddenAfterHits: verboten,
    emptyImages: leereBilder.length,
    limits: [
      'synthetic guest localStorage only',
      'provider/model routes intercepted',
      'not live authenticated',
      'not Safari / real device / whole-site E2E',
    ],
  }
  writeFileSync(BERICHT, JSON.stringify(bericht, null, 2))
  if (PHASE === 'after' && verboten.length > 0) {
    throw new Error(`After-copy still contains forbidden vocabulary: ${verboten.join(', ')}`)
  }
  console.log(JSON.stringify({ ok: true, phase: PHASE, sha: SHA, captures: captures.length, verboten }, null, 2))
}

main().catch((fehler) => {
  console.error(fehler)
  process.exit(1)
})
