#!/usr/bin/env node
// Disposable local Chromium evidence for V1 Guest Active Draft Preservation 1.
// Compiled Next app + product CSS. Synthetic guest only.
// Unexpected mutations including same-route POST /planen are aborted
// before they complete. Provider/API routes are fulfilled 503.

import { execSync, spawn } from 'node:child_process'
import { mkdirSync, readFileSync, writeFileSync } from 'node:fs'
import { dirname, join } from 'node:path'
import { fileURLToPath } from 'node:url'
import { chromium } from 'playwright'

const ROOT = dirname(fileURLToPath(import.meta.url))
const PORT = process.env.AUDIT_PORT || '3010'
const BASIS = process.env.AUDIT_BASE || `http://localhost:${PORT}`
const ARTIFACTS = '/opt/cursor/artifacts/v1-guest-active-draft-preservation-1'
const SCHLUESSEL_AKTIV = 'jetnity:reise:v3'
const SCHLUESSEL_LEGACY = 'jetnity:guest-trips:v2'
const SCHLUESSEL_WARTESCHLANGE = 'jetnity:reisen-warteschlange:v3'
const SHA = execSync('git rev-parse HEAD', { encoding: 'utf8' }).trim()
const DIRTY = execSync('git status --porcelain', { encoding: 'utf8' })
  .split('\n')
  .map((zeile) => zeile.trim())
  .filter(Boolean)
const JETZT = new Date().toISOString()
const INVALID_BYTES = '{bad-json'
const LEGACY_BYTES = JSON.stringify([
  {
    id: 'trip-alt',
    title: 'Barcelona',
    destination: 'Barcelona',
    origin: 'Zürich',
    startDate: '2026-09-12',
    endDate: '2026-09-12',
    travelers: 1,
    pace: 'ausgewogen',
    interests: [],
    days: [{ id: 'day-1', date: '2026-09-12', items: [] }],
    createdAt: '2026-08-01T10:00:00.000Z',
    updatedAt: '2026-08-01T10:00:00.000Z',
  },
])
const LEGACY_OHNE_ID_BYTES = JSON.stringify([
  {
    title: 'Ohne Kennung',
    destination: 'Lissabon',
    origin: 'Zürich',
    startDate: '2026-09-12',
    endDate: '2026-09-12',
    travelers: 1,
    pace: 'ausgewogen',
    interests: [],
    days: [{ id: 'day-1', date: '2026-09-12', items: [] }],
    createdAt: '2026-08-01T10:00:00.000Z',
    updatedAt: '2026-08-01T10:00:00.000Z',
  },
])

const GAST_REISE = {
  id: 'trip-preservation-1',
  clientRef: 'trip-preservation-1',
  title: 'Disposable gate draft',
  origin: 'Zürich',
  originPlaceId: 'geonames:2657896',
  startDate: '2026-10-12',
  endDate: '2026-10-16',
  travellers: 2,
  currency: 'CHF',
  budgetAmount: 2400,
  status: 'draft',
  pace: 'balanced',
  interests: ['culture'],
  travelWish: null,
  revision: 1,
  lastMutationId: null,
  stages: [
    {
      id: 'stage-1',
      position: 1,
      name: 'Lissabon',
      countryCode: 'PT',
      arrivalDate: '2026-10-12',
      departureDate: '2026-10-16',
      latitude: null,
      longitude: null,
      placeId: 'geonames:2267057',
    },
  ],
  days: [{ id: 'day-1', stageId: 'stage-1', dayIndex: 1, dayDate: '2026-10-12', title: null, items: [] }],
  ohneTag: [],
  createdAt: '2026-09-21T10:00:00.000Z',
  updatedAt: '2026-09-21T10:00:00.000Z',
}

mkdirSync(join(ROOT, 'screens'), { recursive: true })
mkdirSync(ARTIFACTS, { recursive: true })

function istProviderOderApi(url) {
  return (
    url.includes('/api/') ||
    url.includes('openai.com') ||
    url.includes('anthropic.com') ||
    url.includes('supabase.co') ||
    url.includes('/functions/v1/')
  )
}

function istSicheresNextIntern(url) {
  return url.includes('/_next/') || url.includes('__nextjs') || url.includes('/__turbopack')
}

function istMutation(method) {
  return ['POST', 'PUT', 'PATCH', 'DELETE'].includes(method)
}

async function serverErreichbar() {
  try {
    const antwort = await fetch(`${BASIS}/planen`, { redirect: 'manual' })
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
      NEXT_PUBLIC_SUPABASE_URL:
        process.env.NEXT_PUBLIC_SUPABASE_URL || 'https://placeholder.supabase.co',
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

function leeresProtokoll() {
  return {
    anfragen: [],
    versuche: [],
    abgebrochen: [],
    interneSchreiben: [],
    unerwartetAbgeschlossen: [],
    fehlgeschlagen: [],
    abgefangen: [],
  }
}

async function abfangen(page, protokoll) {
  await page.route('**/*', async (route) => {
    const req = route.request()
    const method = req.method()
    const url = req.url()
    if (istProviderOderApi(url)) {
      protokoll.abgefangen.push({ method, url, kind: 'provider-or-api' })
      await route.fulfill({
        status: 503,
        contentType: 'application/json',
        body: JSON.stringify({ ok: false, reason: 'audit-blocked', simulation: true }),
      })
      return
    }
    if (istMutation(method)) {
      if (istSicheresNextIntern(url)) {
        protokoll.interneSchreiben.push({ method, url })
        await route.continue()
        return
      }
      protokoll.versuche.push({ method, url, kind: 'unexpected-mutation' })
      protokoll.abgebrochen.push({ method, url, reason: 'audit-abort-mutation' })
      await route.abort('blockedbyclient')
      return
    }
    await route.continue()
  })
  page.on('requestfinished', (req) => {
    if (!istMutation(req.method()) || istSicheresNextIntern(req.url())) return
    protokoll.unerwartetAbgeschlossen.push({ method: req.method(), url: req.url() })
  })
  page.on('requestfailed', (req) => {
    if (!istMutation(req.method())) return
    protokoll.fehlgeschlagen.push({
      method: req.method(),
      url: req.url(),
      failure: req.failure()?.errorText || null,
    })
  })
}

async function nextDevChromeVerbergen(page) {
  await page.addStyleTag({
    content:
      'nextjs-portal, [data-next-badge-root], [data-nextjs-toast] { display: none !important; }',
  })
}

function konto(protokoll) {
  return {
    attempts: protokoll.versuche.length,
    aborted: protokoll.abgebrochen.length,
    completedUnexpected: protokoll.unerwartetAbgeschlossen.length,
    providerOrApiBlocked: protokoll.abgefangen.length,
    failedMutations: protokoll.fehlgeschlagen.length,
    attemptsDetail: protokoll.versuche,
    abortedDetail: protokoll.abgebrochen,
    completedUnexpectedDetail: protokoll.unerwartetAbgeschlossen,
  }
}

async function rohLesen(page) {
  return page.evaluate(
    ({ aktiv, legacy, warteschlange }) => ({
      aktiv: window.localStorage.getItem(aktiv),
      legacy: window.localStorage.getItem(legacy),
      warteschlange: window.localStorage.getItem(warteschlange),
    }),
    {
      aktiv: SCHLUESSEL_AKTIV,
      legacy: SCHLUESSEL_LEGACY,
      warteschlange: SCHLUESSEL_WARTESCHLANGE,
    },
  )
}

async function sichtLesen(page) {
  return page.evaluate(() => {
    const h1 = document.querySelector('h1')
    const alert = document.querySelector('[role="alert"], [role="status"]')
    const section = document.querySelector('main section')
    const text = (section?.innerText || document.body.innerText || '').replace(/\s+/g, ' ').trim()
    return {
      title: h1?.textContent?.trim() ?? null,
      role: alert?.getAttribute('role') ?? null,
      hasContinue: Boolean(
        [...document.querySelectorAll('a')].find((el) => el.textContent?.includes('Reise fortsetzen')),
      ),
      hasRecheck: Boolean(
        [...document.querySelectorAll('button')].find((el) => el.textContent?.includes('Erneut prüfen')),
      ),
      hasIdeaForm: Boolean(document.querySelector('textarea')),
      text: text.slice(0, 500),
    }
  })
}

async function geometrieLesen(page, viewport) {
  return page.evaluate((sicht) => {
    const doc = document.documentElement
    const body = document.body
    const section = document.querySelector('main section')
    const h1 = document.querySelector('h1')
    const sectionBox = section?.getBoundingClientRect()
    const headingBox = h1?.getBoundingClientRect()
    const overflowX = doc.scrollWidth > sicht.width + 1 || body.scrollWidth > sicht.width + 1
    const sectionOverflow = sectionBox ? sectionBox.width > sicht.width + 1 : false
    const headingOverflow = headingBox ? headingBox.width > sicht.width + 1 : false
    const headingClipped = h1 ? h1.scrollWidth > h1.clientWidth + 1 : false
    return {
      viewport: sicht,
      document: {
        clientWidth: doc.clientWidth,
        scrollWidth: doc.scrollWidth,
        clientHeight: doc.clientHeight,
        scrollHeight: doc.scrollHeight,
      },
      body: { clientWidth: body.clientWidth, scrollWidth: body.scrollWidth },
      section: sectionBox
        ? { width: sectionBox.width, height: sectionBox.height, x: sectionBox.x, y: sectionBox.y }
        : null,
      heading: headingBox
        ? {
            width: headingBox.width,
            height: headingBox.height,
            x: headingBox.x,
            y: headingBox.y,
            text: h1?.textContent?.trim() ?? null,
          }
        : null,
      overflowX,
      sectionOverflow,
      headingOverflow,
      headingClipped,
    }
  }, viewport)
}

function pngGroesse(pfad) {
  const bytes = readFileSync(pfad)
  if (bytes.length < 24 || bytes.toString('ascii', 1, 4) !== 'PNG') {
    throw new Error(`keine PNG-Signatur: ${pfad}`)
  }
  return { width: bytes.readUInt32BE(16), height: bytes.readUInt32BE(20) }
}

async function szene(browser, fall, initArgs) {
  const context = await browser.newContext({
    viewport: { width: fall.width, height: fall.height },
    hasTouch: true,
    locale: 'de-CH',
    deviceScaleFactor: 1,
  })
  const page = await context.newPage()
  const protokoll = leeresProtokoll()
  await page.addInitScript(fall.init, initArgs)
  await abfangen(page, protokoll)
  const antwort = await page.goto(`${BASIS}/planen`, { waitUntil: 'load', timeout: 60_000 })
  await page.waitForTimeout(400)
  await nextDevChromeVerbergen(page)
  if (fall.schrift) {
    await page.addStyleTag({ content: `html { font-size: ${fall.schrift}px !important; }` })
    await page.waitForTimeout(200)
  }
  if (fall.action) await fall.action(page)
  await page.waitForTimeout(200)

  const sicht = await sichtLesen(page)
  const geometrie = await geometrieLesen(page, { width: fall.width, height: fall.height })
  let roh = null
  if (!fall.skipRaw) {
    try {
      roh = await rohLesen(page)
    } catch (fehler) {
      roh = { error: String(fehler?.message || fehler) }
    }
  }

  const dateiname = `${fall.name}.png`
  const voll = `${fall.name}-full.png`
  const viewportPfad = join(ROOT, 'screens', dateiname)
  const fullPfad = join(ROOT, 'screens', voll)
  await page.screenshot({ path: viewportPfad, fullPage: false })
  await page.screenshot({ path: fullPfad, fullPage: true })
  await page.screenshot({ path: join(ARTIFACTS, dateiname), fullPage: false })
  await page.screenshot({ path: join(ARTIFACTS, voll), fullPage: true })
  const viewportPng = await pngGroesse(viewportPfad)
  const fullPng = await pngGroesse(fullPfad)
  const version = `${browser.browserType().name()}/${browser.version()}`
  let reisenHrefs = []
  if (fall.assertNoUnpersistedContinue) {
    reisenHrefs = await page.evaluate(() =>
      [...document.querySelectorAll('a')]
        .map((el) => el.getAttribute('href') || '')
        .filter((href) => href.startsWith('/reisen/')),
    )
  }
  await context.close()

  const overflowFail =
    Boolean(fall.assertNoOverflow) &&
    (geometrie.overflowX ||
      geometrie.sectionOverflow ||
      geometrie.headingOverflow ||
      geometrie.headingClipped ||
      viewportPng.width > fall.width + 1)

  if (overflowFail) {
    throw new Error(
      `${fall.name}: horizontal overflow/clip. viewportPng=${viewportPng.width}x${viewportPng.height} ` +
        `doc=${geometrie.document.scrollWidth} heading=${JSON.stringify(geometrie.heading)}`,
    )
  }

  if (fall.assertNoUnpersistedContinue) {
    if (sicht.hasIdeaForm) throw new Error(`${fall.name}: Create-Formular trotz Belegung`)
    if (!sicht.title.includes('bereits eine Reise')) {
      throw new Error(`${fall.name}: Gate nicht belegt: ${sicht.title}`)
    }
    const persistierteId = (() => {
      if (!roh?.aktiv) return null
      try {
        const gelesen = JSON.parse(roh.aktiv)
        return typeof gelesen?.id === 'string' && gelesen.id ? gelesen.id : null
      } catch {
        return null
      }
    })()
    if (!persistierteId) {
      if (sicht.hasContinue || reisenHrefs.length) {
        throw new Error(`${fall.name}: Fortsetzen-URL ohne persistierte Kennung: ${reisenHrefs.join(',')}`)
      }
      if (!sicht.hasRecheck) throw new Error(`${fall.name}: ehrliche Prüfung fehlt`)
    } else if (reisenHrefs.some((href) => href !== `/reisen/${persistierteId}`)) {
      throw new Error(`${fall.name}: Fortsetzen-URL passt nicht zur persistierten Kennung`)
    }
  }

  return {
    name: fall.name,
    route: '/planen',
    viewport: { width: fall.width, height: fall.height },
    fontSize: fall.schrift ?? 16,
    httpOk: antwort?.ok() ?? false,
    browser: version,
    timestamp: new Date().toISOString(),
    actionSequence: fall.sequence,
    simulationClass: fall.simulationClass,
    visible: sicht,
    geometry: geometrie,
    screenshotSizes: { viewport: viewportPng, full: fullPng },
    evidenceKind: 'viewport-and-full-page',
    rawBytes: roh,
    expectedRaw: fall.expectedRaw ?? null,
    rawEqual: fall.expectedRaw
      ? roh?.aktiv === fall.expectedRaw.aktiv && roh?.legacy === fall.expectedRaw.legacy
      : null,
    mutations: konto(protokoll),
    screenshot: `screens/${dateiname}`,
    fullPageScreenshot: `screens/${voll}`,
    artifact: join(ARTIFACTS, dateiname),
  }
}

async function main() {
  const server = await serverStarten()
  const browser = await chromium.launch({ channel: 'chrome' })
  const faelle = [
    {
      name: 'invalid_390x844',
      width: 390,
      height: 844,
      simulationClass: 'synthetic_invalid_active_plus_valid_legacy',
      sequence: ['init invalid active + valid legacy', 'goto /planen', 'no mutation'],
      expectedRaw: { aktiv: INVALID_BYTES, legacy: LEGACY_BYTES },
      init: ({ aktiv, legacy, warteschlange, invalid, legacyBytes }) => {
        window.localStorage.setItem(aktiv, invalid)
        window.localStorage.setItem(legacy, legacyBytes)
        window.localStorage.removeItem(warteschlange)
      },
    },
    {
      name: 'unavailable_390x844',
      width: 390,
      height: 844,
      simulationClass: 'synthetic_getitem_throws',
      sequence: ['init getItem throw for active key', 'goto /planen', 'no mutation'],
      skipRaw: true,
      init: ({ aktiv }) => {
        const original = Storage.prototype.getItem
        Storage.prototype.getItem = function getItem(schluessel) {
          if (schluessel === aktiv) throw new Error('SecurityError')
          return original.call(this, schluessel)
        }
      },
    },
    {
      name: 'retry_390x844',
      width: 390,
      height: 844,
      simulationClass: 'synthetic_invalid_then_recheck',
      sequence: ['init invalid active', 'goto /planen', 'click Erneut prüfen', 'bytes unchanged'],
      expectedRaw: { aktiv: INVALID_BYTES, legacy: LEGACY_BYTES },
      init: ({ aktiv, legacy, warteschlange, invalid, legacyBytes }) => {
        window.localStorage.setItem(aktiv, invalid)
        window.localStorage.setItem(legacy, legacyBytes)
        window.localStorage.removeItem(warteschlange)
      },
      action: async (page) => {
        const knopf = page.getByRole('button', { name: 'Erneut prüfen' })
        await knopf.click()
        await page.waitForTimeout(200)
      },
    },
    {
      name: 'valid_gate_390x844',
      width: 390,
      height: 844,
      simulationClass: 'synthetic_valid_active_one_trip_gate',
      sequence: ['init valid disposable guest trip', 'goto /planen', 'no mutation'],
      expectedRaw: { aktiv: JSON.stringify(GAST_REISE), legacy: null },
      init: ({ aktiv, legacy, warteschlange, valid }) => {
        window.localStorage.setItem(aktiv, JSON.stringify(valid))
        window.localStorage.removeItem(legacy)
        window.localStorage.removeItem(warteschlange)
      },
    },
    {
      name: 'invalid_360x800_text-200',
      width: 360,
      height: 800,
      schrift: 32,
      assertNoOverflow: true,
      simulationClass: 'synthetic_invalid_active_enlarged_text',
      sequence: ['init invalid active', 'goto /planen', 'html font-size 32px', 'measure overflow'],
      expectedRaw: { aktiv: INVALID_BYTES, legacy: LEGACY_BYTES },
      init: ({ aktiv, legacy, warteschlange, invalid, legacyBytes }) => {
        window.localStorage.setItem(aktiv, invalid)
        window.localStorage.setItem(legacy, legacyBytes)
        window.localStorage.removeItem(warteschlange)
      },
    },
    {
      name: 'unavailable_360x800_text-200',
      width: 360,
      height: 800,
      schrift: 32,
      assertNoOverflow: true,
      simulationClass: 'synthetic_getitem_throws_enlarged_text',
      sequence: ['init getItem throw', 'goto /planen', 'html font-size 32px', 'measure overflow'],
      skipRaw: true,
      init: ({ aktiv }) => {
        const original = Storage.prototype.getItem
        Storage.prototype.getItem = function getItem(schluessel) {
          if (schluessel === aktiv) throw new Error('SecurityError')
          return original.call(this, schluessel)
        }
      },
    },
    {
      name: 'legacy_throw_390x844',
      width: 390,
      height: 844,
      simulationClass: 'synthetic_active_absent_legacy_getitem_throws',
      sequence: ['init active absent', 'legacy getItem throws', 'gate unlesbar', 'no mutation'],
      skipRaw: true,
      init: ({ legacy }) => {
        const original = Storage.prototype.getItem
        Storage.prototype.getItem = function getItem(schluessel) {
          if (schluessel === legacy) throw new Error('SecurityError')
          return original.call(this, schluessel)
        }
      },
    },
    {
      name: 'legacy_only_390x844',
      width: 390,
      height: 844,
      simulationClass: 'synthetic_missing_v3_valid_legacy',
      sequence: [
        'init valid legacy only',
        'goto /planen',
        'gate besteht without create form',
        'no model/place/create',
        'nav loader may migrate under existing valid-legacy contract',
      ],
      init: ({ aktiv, legacy, warteschlange, legacyBytes }) => {
        window.localStorage.removeItem(aktiv)
        window.localStorage.setItem(legacy, legacyBytes)
        window.localStorage.removeItem(warteschlange)
      },
    },
    {
      name: 'legacy_ohne_kennung_390x844',
      width: 390,
      height: 844,
      assertNoUnpersistedContinue: true,
      simulationClass: 'synthetic_missing_v3_legacy_without_persisted_id',
      sequence: [
        'init valid-enough legacy without id',
        'goto /planen',
        'occupied gate; no Continue unless loader persisted an id',
        'unowned GastCreateLink may migrate under existing loader policy',
      ],
      init: ({ aktiv, legacy, warteschlange, legacyOhneIdBytes }) => {
        window.localStorage.removeItem(aktiv)
        window.localStorage.setItem(legacy, legacyOhneIdBytes)
        window.localStorage.removeItem(warteschlange)
      },
    },
  ]

  const initArgs = {
    aktiv: SCHLUESSEL_AKTIV,
    legacy: SCHLUESSEL_LEGACY,
    warteschlange: SCHLUESSEL_WARTESCHLANGE,
    invalid: INVALID_BYTES,
    legacyBytes: LEGACY_BYTES,
    legacyOhneIdBytes: LEGACY_OHNE_ID_BYTES,
    valid: GAST_REISE,
  }

  const results = []
  for (const fall of faelle) {
    results.push(await szene(browser, fall, initArgs))
  }

  await browser.close()
  if (server.kind) server.kind.kill()

  const bericht = {
    kind: 'synthetic-compiled-css-browser',
    authenticatedPreview: 'NOT_CLAIMED',
    route: '/planen',
    product: { head: SHA, workingTree: DIRTY.length === 0 ? 'clean' : 'dirty', dirtyPaths: DIRTY },
    capturedAt: JETZT,
    note: 'Synthetic guest /planen with compiled Next CSS. Not authenticated Preview, hardware, Safari or WCAG proof.',
    omitted: [
      'live provider/model/paid call',
      'authenticated Preview/Production',
      'real account write',
      'real-device lab',
    ],
    cases: results,
  }
  writeFileSync(join(ROOT, 'audit.json'), JSON.stringify(bericht, null, 2))
  writeFileSync(join(ARTIFACTS, 'audit.json'), JSON.stringify(bericht, null, 2))
  console.log(
    JSON.stringify(
      {
        ok: true,
        cases: results.map((fall) => ({
          name: fall.name,
          title: fall.visible.title,
          rawEqual: fall.rawEqual,
          mutations: fall.mutations,
          screenshotSizes: fall.screenshotSizes,
          overflowX: fall.geometry?.overflowX ?? null,
        })),
      },
      null,
      2,
    ),
  )
}

main().catch((fehler) => {
  console.error(fehler)
  process.exit(1)
})
