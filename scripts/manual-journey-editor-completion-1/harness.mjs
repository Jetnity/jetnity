#!/usr/bin/env node
// Mounted proof for the three existing manual journey editors.
// In-memory callbacks only. No account, hosted write, provider, or personal browser.

import assert from 'node:assert/strict'
import { execFileSync } from 'node:child_process'
import { createHash } from 'node:crypto'
import { createRequire } from 'node:module'
import { createServer } from 'node:http'
import { mkdirSync, readFileSync, writeFileSync } from 'node:fs'
import { dirname, join } from 'node:path'
import { fileURLToPath } from 'node:url'

import esbuild from 'esbuild'
import { chromium } from 'playwright'

const require = createRequire(import.meta.url)
const REPO = join(dirname(fileURLToPath(import.meta.url)), '../..')
const EVIDENCE = join(REPO, 'docs/evidence/manual-journey-editor-completion-1')
const SCREENS = join(EVIDENCE, 'screens')
const OUT = join('/tmp', 'manual-journey-editor-completion-1')
const FLIGHT_THROW = 'Die Flugroute konnte nicht gespeichert werden. Bitte versuche es erneut.'
const STAY_THROW = 'Der Zeitraum konnte nicht gespeichert werden. Bitte versuche es erneut.'
const CONNECTION_UNKNOWN = 'Ob die Verbindung gespeichert wurde, konnten wir nicht bestätigen. Deine Eingabe bleibt erhalten. Prüfe deinen Reiseplan vor einem erneuten Versuch. Ein erneuter Versuch kann eine zweite Verbindung anlegen.'
const CONNECTION_SAVED = 'Die Verbindung ist als Nutzerangabe gespeichert – nicht als Providerbestätigung.'
const VIEWPORTS = [
  { name: '280', width: 280, height: 720 },
  { name: '320', width: 320, height: 720 },
  { name: '360', width: 360, height: 740 },
  { name: '390', width: 390, height: 844 },
  { name: '430', width: 430, height: 900 },
  { name: '768', width: 768, height: 1024 },
  { name: '1280', width: 1280, height: 800 },
  { name: 'landscape', width: 844, height: 320 },
]

mkdirSync(OUT, { recursive: true })
mkdirSync(SCREENS, { recursive: true })

const head = execFileSync('git', ['rev-parse', 'HEAD'], { cwd: REPO, encoding: 'utf8' }).trim()
const sourceFiles = [
  'components/trips/FlugBestand.tsx',
  'components/trips/UnterkunftBestand.tsx',
  'components/trips/MobilitaetBereich.tsx',
  'lib/trips/manual-journey-editor-completion-1.ts',
]
const sourceSha256 = Object.fromEntries(sourceFiles.map((file) => [
  file,
  createHash('sha256').update(readFileSync(join(REPO, file))).digest('hex'),
]))

function compileCss() {
  const postcss = require('postcss')
  const nesting = require('tailwindcss/nesting')
  const tailwindcss = require('tailwindcss')
  const autoprefixer = require('autoprefixer')
  const from = join(REPO, 'styles/globals.css')
  const config = require(join(REPO, 'tailwind.config.js'))
  return postcss([nesting(), tailwindcss(config), autoprefixer()])
    .process(readFileSync(from, 'utf8'), { from })
    .then((result) => result.css)
}

async function bundle() {
  const outfile = join(OUT, 'harness.js')
  await esbuild.build({
    absWorkingDir: REPO,
    entryPoints: [join(REPO, 'scripts/manual-journey-editor-completion-1/mount.tsx')],
    outfile,
    bundle: true,
    format: 'iife',
    platform: 'browser',
    jsx: 'automatic',
    alias: { '@': REPO },
    define: { 'process.env.NODE_ENV': '"production"' },
    logLevel: 'silent',
  })
  return readFileSync(outfile)
}

function listen(server) {
  return new Promise((resolve, reject) => {
    server.once('error', reject)
    server.listen(0, '127.0.0.1', () => resolve(server.address()))
  })
}

async function launchBrowser() {
  const errors = []
  try {
    return { browser: await chromium.launch({ headless: true }), channel: 'playwright-chromium', errors }
  } catch (error) {
    errors.push(String(error))
  }
  try {
    return { browser: await chromium.launch({ headless: true, channel: 'chrome' }), channel: 'chrome', errors }
  } catch (error) {
    errors.push(String(error))
  }
  return { browser: null, channel: null, errors }
}

function region(page, name) {
  return page.getByRole('region', { name })
}

async function painted(page) {
  await page.evaluate(() => new Promise((resolve) => {
    requestAnimationFrame(() => requestAnimationFrame(() => resolve(null)))
  }))
}

async function awaitSuspend(page) {
  const before = await page.evaluate(() => window.fixture.suspendRenders())
  await page.waitForFunction((count) => window.fixture.suspendRenders() > count, before)
  return page.evaluate(() => window.fixture.committed())
}

async function arm(page, channel, outcome) {
  await page.evaluate(({ channel: nextChannel, outcome: next }) => window.fixture.arm(nextChannel, next), { channel, outcome })
}

async function release(page, channel) {
  const before = await page.evaluate((next) => window.fixture.pending(next).length, channel)
  await page.evaluate((next) => window.fixture.release(next), channel)
  await page.waitForFunction(
    ({ next, count }) => window.fixture.pending(next).length === count,
    { next: channel, count: Math.max(0, before - 1) },
  )
  await painted(page)
}

async function calls(page, channel) {
  return page.evaluate((next) => window.fixture.calls[next], channel)
}

async function openContext(browser, viewport, origin) {
  const context = await browser.newContext({ viewport, reducedMotion: 'reduce' })
  const blocked = []
  await context.route('**/*', (route) => {
    const url = new URL(route.request().url())
    const allowed = url.origin === origin && route.request().method() === 'GET' && ['/', '/harness.js', '/style.css'].includes(url.pathname)
    if (!allowed) {
      blocked.push(`${route.request().method()} ${url.origin}${url.pathname}`)
      return route.abort()
    }
    return route.continue()
  })
  const page = await context.newPage()
  const errors = []
  page.on('pageerror', (error) => errors.push(String(error.message)))
  await page.goto(origin, { waitUntil: 'load' })
  await region(page, 'Manuelle Verbindung').waitFor()
  await region(page, 'Deine Flüge').waitFor()
  await region(page, 'Deine Unterkunft').waitFor()
  return { context, page, blocked, errors }
}

async function active(page) {
  return page.evaluate(() => {
    const el = document.activeElement
    return {
      tag: el?.tagName ?? '',
      id: el?.id ?? '',
      role: el?.getAttribute('role') ?? '',
      label: (el?.labels?.[0]?.innerText || el?.closest('label')?.innerText || el?.getAttribute('aria-label') || '').split('\n')[0].trim(),
      text: (el?.textContent ?? '').replace(/\s+/g, ' ').trim().slice(0, 180),
    }
  })
}

async function markOwned(page) {
  return page.evaluate(() => {
    const el = document.activeElement
    const mark = `owned-${Math.random().toString(16).slice(2)}`
    el?.setAttribute('data-owned-focus', mark)
    const facts = {
      tag: el?.tagName ?? '',
      row: el?.closest('[data-flug-punkt]')?.getAttribute('data-flug-punkt') ?? '',
      text: (el?.textContent ?? '').replace(/\s+/g, ' ').trim(),
      expanded: el?.getAttribute('aria-expanded'),
      label: (el?.labels?.[0]?.innerText || '').split('\n')[0].trim(),
      mark,
    }
    return facts
  })
}

async function ownedNow(page, mark) {
  const facts = await page.evaluate((expected) => {
    const el = document.activeElement
    return {
      tag: el?.tagName ?? '',
      row: el?.closest('[data-flug-punkt]')?.getAttribute('data-flug-punkt') ?? '',
      text: (el?.textContent ?? '').replace(/\s+/g, ' ').trim(),
      expanded: el?.getAttribute('aria-expanded'),
      label: (el?.labels?.[0]?.innerText || '').split('\n')[0].trim(),
      mark: el?.getAttribute('data-owned-focus') ?? '',
      same: el?.getAttribute('data-owned-focus') === expected,
    }
  }, mark)
  assert.equal(facts.same, true, `focus left the marked control ${mark}`)
  return facts
}

async function boxes(page) {
  return page.evaluate(() => {
    const motion = window.matchMedia('(prefers-reduced-motion: reduce)').matches
    const regions = ['Deine Flüge', 'Deine Unterkunft', 'Manuelle Verbindung']
    const controls = []
    for (const name of regions) {
      const root = document.querySelector(`[aria-label="${name}"]`)
      if (!root) continue
      for (const el of root.querySelectorAll('input, select, textarea, button')) {
        const rect = el.getBoundingClientRect()
        if (rect.width < 1 || rect.height < 1) continue
        controls.push({
          region: name,
          tag: el.tagName,
          type: el.getAttribute('type'),
          label: (el.closest('label')?.innerText || el.textContent || el.getAttribute('aria-label') || '').split('\n')[0].trim().slice(0, 80),
          left: Math.round(rect.left * 100) / 100,
          right: Math.round(rect.right * 100) / 100,
          width: Math.round(rect.width * 100) / 100,
          height: Math.round(rect.height * 100) / 100,
        })
      }
    }
    const overflowNodes = []
    for (const el of document.querySelectorAll('input, select, textarea, button, label')) {
      const rect = el.getBoundingClientRect()
      const excess = el.scrollWidth - el.clientWidth
      if (rect.right > window.innerWidth + 1 || rect.left < -1 || excess > 1) {
        const label = (el.closest('label')?.innerText || el.labels?.[0]?.innerText || el.textContent || '').split('\n')[0].trim().slice(0, 40)
        overflowNodes.push({
          tag: el.tagName,
          type: el.getAttribute('type'),
          label,
          right: Math.round(rect.right),
          excess,
          scrollWidth: el.scrollWidth,
          clientWidth: el.clientWidth,
        })
      }
    }
    overflowNodes.sort((a, b) => b.excess - a.excess)
    return {
      viewport: window.innerWidth,
      height: window.innerHeight,
      fontSize: getComputedStyle(document.documentElement).fontSize,
      scrollWidth: document.documentElement.scrollWidth,
      overflow: document.documentElement.scrollWidth > window.innerWidth + 1,
      reducedMotion: motion,
      controls,
      overflowNodes: overflowNodes.slice(0, 12),
    }
  })
}

function assertFits(name, snapshot) {
  assert.equal(snapshot.overflow, false, `${name}: page scrollWidth ${snapshot.scrollWidth} at ${snapshot.viewport} ${JSON.stringify(snapshot.overflowNodes)}`)
  const offenders = snapshot.controls.filter((item) => item.left < -1 || item.right > snapshot.viewport + 1 || item.height < 44)
  assert.deepEqual(offenders, [], `${name}: control outside the CSS viewport or below 44px`)
}

async function openFlight(page) {
  const scope = region(page, 'Deine Flüge')
  const button = scope.getByRole('button', { name: /Flugroute/ })
  if ((await button.getAttribute('aria-expanded')) !== 'true') await button.click()
  return scope
}

async function fillFlight(page, segments = 1) {
  const scope = region(page, 'Deine Flüge')
  for (let index = 1; index < segments; index += 1) {
    await scope.getByRole('button', { name: 'Segment hinzufügen' }).click()
  }
  const chain = [
    ['ZRH', 'FRA', '2026-08-30', '10:00', '2026-08-30', '12:00'],
    ['FRA', 'DOH', '2026-08-30', '13:00', '2026-08-30', '18:00'],
    ['DOH', 'BKK', '2026-08-31', '02:00', '2026-08-31', '12:00'],
    ['BKK', 'SIN', '2026-09-01', '09:00', '2026-09-01', '12:00'],
  ]
  for (let index = 0; index < segments; index += 1) {
    const values = chain[index]
    const fieldset = scope.getByRole('group', { name: `Segment ${index + 1}` })
    await fieldset.getByLabel('Abflugflughafen (IATA)').fill(values[0])
    await fieldset.getByLabel('Ankunftsflughafen (IATA)').fill(values[1])
    await fieldset.getByLabel('Abflugdatum').fill(values[2])
    await fieldset.getByLabel('Abflugzeit (optional)').fill(values[3])
    await fieldset.getByLabel('Ankunftsdatum').fill(values[4])
    await fieldset.getByLabel('Ankunftszeit (optional)').fill(values[5])
  }
}

async function openStay(page) {
  const scope = region(page, 'Deine Unterkunft')
  const button = scope.getByRole('button', { name: /Zeitraum ändern|Zeitraum ergänzen/ })
  if ((await button.getAttribute('aria-expanded')) !== 'true') await button.click()
  return scope
}

const evidence = {
  author: 'Jetnity Manual Journey Editor Completion 1 — Cursor Generation 1',
  session: 'bc-02fbe98d-97ba-4c0b-a3b0-10857d784379',
  model: 'grok-4.7-high-fast',
  headAtRun: head,
  command: 'node scripts/manual-journey-editor-completion-1/harness.mjs',
  sourceSha256,
  viewports: VIEWPORTS,
  geometryKind: 'CSS viewport and root font-size, not native zoom and not a physical device',
  stubs: 'in-memory onSpeichern/onUnterkunftZeitraum/onAnlegen; each request keeps its own payload and outcome. No guest storage, account, provider, or database.',
  scenarios: [],
  layouts: [],
  behaviorBlockedRequests: [],
  behaviorPageErrors: [],
  layoutBlockedRequests: [],
  layoutPageErrors: [],
  blockedRequests: [],
  pageErrors: [],
  diagnosticNote: 'behaviorBlockedRequests and behaviorPageErrors come only from the behavior context. layoutBlockedRequests and layoutPageErrors come only from the viewport contexts. blockedRequests and pageErrors are the concatenation after both were asserted. An empty concatenation is not a behavior-only claim.',
  status: 'FAIL',
  failure: null,
  browser: null,
  behaviorCount: 0,
  layoutCount: 0,
}

let server
let browser
try {
  const css = await compileCss()
  const script = await bundle()
  writeFileSync(join(OUT, 'style.css'), css)
  writeFileSync(join(OUT, 'harness.js'), script)
  const html = '<!doctype html><html lang="de"><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"><title>Manuelle Reiseeditoren</title><link rel="stylesheet" href="/style.css"><body class="m-0 bg-white"><div id="root"></div><script src="/harness.js"></script>'
  server = createServer((request, response) => {
    const path = new URL(request.url ?? '/', 'http://127.0.0.1').pathname
    if (path === '/harness.js') {
      response.setHeader('Content-Type', 'text/javascript')
      response.end(script)
      return
    }
    if (path === '/style.css') {
      response.setHeader('Content-Type', 'text/css')
      response.end(css)
      return
    }
    response.setHeader('Content-Type', 'text/html; charset=utf-8')
    response.end(html)
  })
  const address = await listen(server)
  const origin = `http://127.0.0.1:${address.port}`
  evidence.port = address.port
  const launched = await launchBrowser()
  evidence.browser = { channel: launched.channel, launchErrors: launched.errors }
  if (!launched.browser) throw new Error(`browser launch blocked: ${launched.errors.join('\n')}`)
  browser = launched.browser
  evidence.browser.version = browser.version()

  const behavior = await openContext(browser, VIEWPORTS[3], origin)
  const page = behavior.page
  assert.equal(await page.getByText('Noch keinem Reiseabschnitt sicher zuordenbar').count(), 0)
  const flights = region(page, 'Deine Flüge')
  await openFlight(page)
  const openedFocus = await active(page)
  assert.equal(openedFocus.label, 'Abflugflughafen (IATA)')
  await flights.getByLabel('Abflugflughafen (IATA)').fill('')
  await flights.getByLabel('Ankunftsflughafen (IATA)').fill('')
  await flights.getByLabel('Abflugdatum').fill('')
  await flights.getByLabel('Ankunftsdatum').fill('')
  await flights.getByRole('button', { name: 'Speichern' }).click()
  await painted(page)
  assert.equal((await calls(page, 'flight')).length, 0)
  assert.ok(await flights.getByRole('alert').count() >= 4)
  for (const label of ['Abflugflughafen (IATA)', 'Ankunftsflughafen (IATA)', 'Abflugdatum', 'Ankunftsdatum']) {
    assert.equal(await flights.getByLabel(label).getAttribute('aria-invalid'), 'true', label)
  }
  const invalidFlight = await active(page)
  assert.equal(invalidFlight.tag, 'INPUT')
  await fillFlight(page, 1)
  await flights.getByLabel('Abflugflughafen (IATA)').fill('ZR')
  await flights.getByRole('button', { name: 'Speichern' }).click()
  await painted(page)
  assert.equal(await flights.getByLabel('Abflugflughafen (IATA)').getAttribute('aria-invalid'), 'true')
  await flights.getByLabel('Abflugflughafen (IATA)').fill('ZRH')
  await painted(page)
  assert.equal(await flights.getByLabel('Abflugflughafen (IATA)').getAttribute('aria-invalid'), null)
  await arm(page, 'flight', 'domain')
  await flights.getByRole('button', { name: 'Speichern' }).click()
  await page.waitForFunction(() => window.fixture.held.flight === true)
  assert.equal(await flights.locator('fieldset').first().getAttribute('disabled'), '')
  await page.evaluate(() => document.querySelector('[aria-label^="Flugroute für"]')?.requestSubmit())
  assert.equal((await calls(page, 'flight')).length, 1)
  await release(page, 'flight')
  await flights.getByRole('alert').waitFor()
  assert.equal(await flights.getByRole('alert').innerText(), 'Route abgelehnt.')
  assert.equal((await active(page)).role, 'alert')
  assert.equal(await flights.getByLabel('Ankunftsflughafen (IATA)').inputValue(), 'FRA')
  await arm(page, 'flight', 'reject')
  await flights.getByRole('button', { name: 'Speichern' }).click()
  await page.waitForFunction(() => window.fixture.held.flight === true)
  await release(page, 'flight')
  assert.equal(await flights.getByRole('alert').innerText(), FLIGHT_THROW)
  assert.equal((await flights.getByRole('alert').innerText()).includes('secret'), false)
  assert.equal(await flights.getByLabel('Abflugflughafen (IATA)').inputValue(), 'ZRH')
  await arm(page, 'flight', 'success')
  await flights.getByRole('button', { name: 'Speichern' }).click()
  await page.waitForFunction(() => window.fixture.held.flight === true)
  const flightPayload = (await calls(page, 'flight')).at(-1)
  assert.equal(flightPayload.itemId, 'flight-a')
  assert.equal(flightPayload.segments.length, 1)
  await release(page, 'flight')
  await flights.getByText('Flugroute gespeichert.').waitFor()
  assert.equal(await flights.getByLabel('Abflugflughafen (IATA)').count(), 0)
  evidence.scenarios.push('flight-valid-schema-domain-reject-retry')

  await page.evaluate(() => window.fixture.setFlight('a'))
  await openFlight(page)
  await fillFlight(page, 1)
  for (let count = 2; count <= 4; count += 1) {
    await flights.getByRole('button', { name: 'Segment hinzufügen' }).click()
    assert.equal(await flights.getByRole('group').count(), count)
  }
  assert.equal(await flights.getByRole('button', { name: 'Segment hinzufügen' }).isDisabled(), true)
  const chain = [
    ['FRA', 'DOH', '2026-08-30', '13:00', '2026-08-30', '18:00'],
    ['DOH', 'BKK', '2026-08-31', '02:00', '2026-08-31', '12:00'],
    ['BKK', 'SIN', '2026-09-01', '09:00', '2026-09-01', '12:00'],
  ]
  for (let index = 0; index < chain.length; index += 1) {
    const values = chain[index]
    const fieldset = flights.getByRole('group', { name: `Segment ${index + 2}` })
    await fieldset.getByLabel('Abflugflughafen (IATA)').fill(values[0])
    await fieldset.getByLabel('Ankunftsflughafen (IATA)').fill(values[1])
    await fieldset.getByLabel('Abflugdatum').fill(values[2])
    await fieldset.getByLabel('Abflugzeit (optional)').fill(values[3])
    await fieldset.getByLabel('Ankunftsdatum').fill(values[4])
    await fieldset.getByLabel('Ankunftszeit (optional)').fill(values[5])
  }
  await flights.getByRole('button', { name: 'Segment 4 entfernen' }).click()
  assert.equal(await flights.getByRole('group').count(), 3)
  await arm(page, 'flight', 'success')
  await flights.getByRole('button', { name: 'Speichern' }).click()
  await page.waitForFunction(() => window.fixture.calls.flight.at(-1).segments.length === 3)
  await release(page, 'flight')
  evidence.scenarios.push('flight-add-remove-1-to-4')

  await page.evaluate(() => window.fixture.setFlight('multi'))
  await openFlight(page)
  assert.match(await flights.getByRole('alert').innerText(), /mehr als eine Flugstrecke oder vier Segmente/)
  assert.equal(await flights.getByRole('button', { name: 'Speichern' }).isDisabled(), true)
  await page.evaluate(() => window.fixture.setFlight('over'))
  await openFlight(page)
  assert.match(await flights.getByRole('alert').innerText(), /vier Segmente/)
  assert.equal((await calls(page, 'flight')).filter((call) => call.itemId === 'flight-multi' || call.itemId === 'flight-over').length, 0)
  evidence.scenarios.push('flight-multileg-and-over-four-refusal')

  await page.evaluate(() => window.fixture.setFlight('a'))
  await openFlight(page)
  await flights.getByLabel('Abflugflughafen (IATA)').fill('FRA')
  await page.evaluate(() => window.fixture.setFlight('b'))
  await painted(page)
  assert.equal(await page.getByText('Noch keinem Reiseabschnitt sicher zuordenbar').count(), 0)
  assert.equal(await flights.getByLabel('Abflugflughafen (IATA)').count(), 0)
  await openFlight(page)
  assert.equal(await flights.getByLabel('Abflugflughafen (IATA)').inputValue(), 'ZRH')
  await arm(page, 'flight', 'success')
  await flights.getByRole('button', { name: 'Speichern' }).click()
  await page.waitForFunction(() => window.fixture.held.flight === true)
  assert.equal((await calls(page, 'flight')).at(-1).itemId, 'flight-b')
  await page.evaluate(() => window.fixture.setFlight('a'))
  await painted(page)
  assert.equal(await flights.locator('form').count(), 0)
  assert.equal(await flights.getByText('Wird gespeichert …').count(), 0)
  await release(page, 'flight')
  await painted(page)
  assert.equal(await flights.getByText('Flugroute gespeichert.').count(), 0)
  assert.equal(await flights.getByText('Der gespeicherte Flug ist ausgewählt.').count(), 0)
  await page.evaluate(() => window.fixture.setFlightTrip('trip-flight-late'))
  await painted(page)
  assert.equal(await flights.getByText('Der gespeicherte Flug ist ausgewählt.').count(), 0)
  evidence.scenarios.push('flight-section-replacement-and-late-readback')

  const stays = region(page, 'Deine Unterkunft')
  await openStay(page)
  const stayFocus = await active(page)
  assert.equal(stayFocus.label, 'Check-in')
  await stays.getByLabel('Check-in').fill('')
  await stays.getByLabel('Check-out').fill('')
  await stays.getByRole('button', { name: 'Zeitraum speichern' }).click()
  await painted(page)
  assert.equal((await calls(page, 'stay')).length, 0)
  assert.equal(await stays.getByRole('alert').count(), 1)
  assert.equal(await stays.getByLabel('Check-in').getAttribute('aria-invalid'), 'true')
  assert.equal(await stays.getByLabel('Check-out').getAttribute('aria-invalid'), 'true')
  await stays.getByLabel('Check-in').fill('2026-11-02')
  await painted(page)
  assert.equal(await stays.getByLabel('Check-in').getAttribute('aria-invalid'), null)
  assert.equal(await stays.getByLabel('Check-out').getAttribute('aria-invalid'), 'true')
  await stays.getByLabel('Check-out').fill('2026-11-01')
  await stays.getByRole('button', { name: 'Zeitraum speichern' }).click()
  await painted(page)
  assert.equal(await stays.getByLabel('Check-in').getAttribute('aria-invalid'), null)
  assert.equal(await stays.getByLabel('Check-out').getAttribute('aria-invalid'), 'true')
  assert.match(await stays.getByRole('alert').innerText(), /Check-out muss nach Check-in/)
  await stays.getByLabel('Check-out').fill('2026-11-06')
  await painted(page)
  assert.equal(await stays.getByRole('alert').count(), 0)
  await arm(page, 'stay', 'domain')
  await stays.getByRole('button', { name: 'Zeitraum speichern' }).click()
  await page.waitForFunction(() => window.fixture.held.stay === true)
  await stays.getByLabel('Check-in').focus({ force: true })
  await page.keyboard.type('1')
  assert.equal(await stays.getByLabel('Check-in').inputValue(), '2026-11-02')
  await release(page, 'stay')
  assert.equal(await stays.getByRole('alert').innerText(), 'Zeitraum abgelehnt.')
  assert.equal((await active(page)).role, 'alert')
  await arm(page, 'stay', 'reject')
  await stays.getByRole('button', { name: 'Zeitraum speichern' }).click()
  await page.waitForFunction(() => window.fixture.held.stay === true)
  await page.keyboard.press('Escape')
  assert.equal(await stays.locator('form').count(), 1)
  await release(page, 'stay')
  assert.equal(await stays.getByRole('alert').innerText(), STAY_THROW)
  assert.equal((await stays.getByRole('alert').innerText()).includes('secret'), false)
  assert.equal(await stays.getByLabel('Check-out').inputValue(), '2026-11-06')
  await page.keyboard.press('Escape')
  await painted(page)
  assert.equal(await stays.locator('form').count(), 0)
  assert.match((await active(page)).text, /Zeitraum/)
  await openStay(page)
  await stays.getByRole('button', { name: 'Abbrechen' }).click()
  assert.equal((await calls(page, 'stay')).length, 2)
  await openStay(page)
  await stays.getByLabel('Check-in').fill('2026-11-03')
  await stays.getByLabel('Check-out').fill('2026-11-08')
  await arm(page, 'stay', 'success')
  await stays.getByRole('button', { name: 'Zeitraum speichern' }).click()
  await page.waitForFunction(() => window.fixture.held.stay === true)
  const stayPayload = (await calls(page, 'stay')).at(-1)
  assert.deepEqual(stayPayload, { itemId: 'stay-a', startsOn: '2026-11-03', endsOn: '2026-11-08' })
  await page.evaluate(() => window.fixture.setStay('stay-b'))
  await painted(page)
  assert.equal(await stays.locator('form').count(), 0)
  assert.equal(await stays.getByText('Wird gespeichert …').count(), 0)
  await release(page, 'stay')
  await painted(page)
  assert.equal(await stays.getByText('Zeitraum gespeichert.').count(), 0)
  await openStay(page)
  await stays.getByLabel('Check-in').fill('2026-12-01')
  await stays.getByLabel('Check-out').fill('2026-12-04')
  await arm(page, 'stay', 'success')
  await stays.getByRole('button', { name: 'Zeitraum speichern' }).click()
  await page.waitForFunction(() => window.fixture.held.stay === true)
  await page.evaluate(() => window.fixture.showStay(false))
  await page.waitForFunction(() => document.querySelector('[aria-label="Deine Unterkunft"]') === null)
  await page.evaluate(() => window.fixture.showStay(true))
  await region(page, 'Deine Unterkunft').waitFor()
  await openStay(page)
  await stays.getByLabel('Check-in').fill('2026-12-02')
  await stays.getByLabel('Check-out').fill('2026-12-05')
  await release(page, 'stay')
  assert.equal(await stays.getByLabel('Check-in').inputValue(), '2026-12-02')
  assert.equal(await stays.getByLabel('Check-out').inputValue(), '2026-12-05')
  assert.equal(await stays.getByText('Zeitraum gespeichert.').count(), 0)
  evidence.scenarios.push('stay-focus-validation-escape-replacement-unmount')

  const links = region(page, 'Manuelle Verbindung')
  const linkControls = links.locator('form').locator('input, select, textarea')
  assert.equal(await linkControls.count(), 10)
  await page.evaluate(() => window.fixture.setConnection({
    vorgabe: {
      mode: 'rail',
      originName: 'Zürich HB',
      originPlaceId: 'station:zurich',
      destinationName: 'Bern',
      destinationPlaceId: 'station:bern',
      startsOn: '2026-11-02',
      dayId: 'day-1',
    },
  }))
  await links.getByLabel('Von').waitFor()
  assert.equal(await links.getByLabel('Von').inputValue(), 'Zürich HB')
  await links.getByLabel('Nach').fill('Bern')
  await links.getByLabel('Abfahrt', { exact: true }).fill('2026-11-02')
  await links.getByLabel('Uhrzeit').nth(0).fill('09:15')
  await links.getByLabel('Ankunft', { exact: true }).fill('2026-11-02')
  await links.getByLabel('Uhrzeit').nth(1).fill('10:45')
  await links.getByLabel('Verbindungsnummer, falls bekannt').fill('IC 816')
  await links.getByLabel('Notiz').fill('Fensterplatz')
  await arm(page, 'connection', 'success')
  await page.evaluate(() => {
    const form = document.querySelector('[aria-label="Manuelle Verbindung"] form')
    form.requestSubmit()
    form.requestSubmit()
  })
  await page.waitForFunction(() => window.fixture.held.connection === true)
  assert.equal((await calls(page, 'connection')).length, 1)
  assert.equal(await links.locator('form').getAttribute('aria-busy'), 'true')
  for (let index = 0; index < 10; index += 1) assert.equal(await linkControls.nth(index).isDisabled(), true)
  await links.getByLabel('Notiz').focus({ force: true })
  await page.keyboard.type('Z')
  assert.equal(await links.getByLabel('Notiz').inputValue(), 'Fensterplatz')
  await release(page, 'connection')
  await links.getByText(CONNECTION_SAVED).waitFor()
  assert.equal(await links.getByLabel('Notiz').inputValue(), '')
  assert.equal(await links.getByLabel('Verbindungsnummer, falls bekannt').inputValue(), '')
  assert.equal(await links.getByLabel('Von').inputValue(), 'Zürich HB')
  assert.equal(await links.getByLabel('Uhrzeit').nth(0).inputValue(), '09:15')
  await links.getByLabel('Notiz').fill('Bleibt')
  await links.getByLabel('Verbindungsnummer, falls bekannt').fill('IC 1')
  await arm(page, 'connection', 'domain')
  await links.getByRole('button', { name: 'Verbindung speichern' }).click()
  await page.waitForFunction(() => window.fixture.held.connection === true)
  await release(page, 'connection')
  assert.equal(await links.getByRole('alert').innerText(), 'Synthetischer Speicherfehler. Die Eingabe bleibt erhalten.')
  assert.equal((await active(page)).role, 'alert')
  assert.equal(await links.getByLabel('Notiz').inputValue(), 'Bleibt')
  await arm(page, 'connection', 'reject')
  await links.getByRole('button', { name: 'Verbindung speichern' }).click()
  await page.waitForFunction(() => window.fixture.held.connection === true)
  await release(page, 'connection')
  assert.equal(await links.getByRole('alert').innerText(), CONNECTION_UNKNOWN)
  assert.equal((await links.getByRole('alert').innerText()).includes('secret'), false)
  assert.equal(await links.getByRole('status').count(), 0)
  assert.equal(await links.getByLabel('Notiz').inputValue(), 'Bleibt')
  evidence.scenarios.push('connection-pending-domain-unconfirmed')

  await links.getByLabel('Nach').fill('Thun')
  await links.getByLabel('Uhrzeit').nth(0).fill('08:05')
  await links.getByLabel('Notiz').fill('Selbst')
  const preset = {
    mode: 'bus',
    originName: 'Basel',
    originPlaceId: 'station:basel',
    destinationName: 'Bern',
    destinationPlaceId: 'station:bern',
    startsOn: '2026-11-03',
    dayId: 'day-2',
  }
  await page.evaluate((next) => window.fixture.setConnection({ vorgabe: next }), preset)
  await painted(page)
  assert.equal(await links.getByLabel('Art').inputValue(), 'bus')
  assert.equal(await links.getByLabel('Von').inputValue(), 'Basel')
  assert.equal(await links.getByLabel('Nach').inputValue(), 'Thun')
  assert.equal(await links.getByLabel('Tag').inputValue(), 'day-2')
  assert.equal(await links.getByLabel('Abfahrt', { exact: true }).inputValue(), '2026-11-03')
  assert.equal(await links.getByLabel('Uhrzeit').nth(0).inputValue(), '08:05')
  assert.equal(await links.getByLabel('Notiz').inputValue(), 'Selbst')
  assert.equal(await links.getByRole('alert').count(), 0)
  await arm(page, 'connection', 'success')
  await links.getByRole('button', { name: 'Verbindung speichern' }).click()
  await page.waitForFunction(() => window.fixture.held.connection === true)
  const presetPayload = (await calls(page, 'connection')).at(-1)
  assert.equal(presetPayload.originName, 'Basel')
  assert.equal(presetPayload.originPlaceId, 'station:basel')
  assert.equal(presetPayload.destinationName, 'Thun')
  assert.equal(presetPayload.destinationPlaceId, null)
  assert.equal(presetPayload.note, 'Selbst')
  assert.equal(presetPayload.priceAmount, null)
  assert.equal(presetPayload.title, null)
  await page.evaluate(() => window.fixture.setConnection({ tripId: 'trip-link-next', origin: 'Genf', vorgabe: null }))
  await painted(page)
  assert.equal(await links.getByLabel('Von').inputValue(), 'Genf')
  assert.equal(await links.getByLabel('Notiz').inputValue(), '')
  assert.equal(await links.locator('form').getAttribute('aria-busy'), 'false')
  await links.getByLabel('Notiz').fill('Nach dem Wechsel')
  await release(page, 'connection')
  await painted(page)
  assert.equal(await links.getByLabel('Notiz').inputValue(), 'Nach dem Wechsel')
  assert.equal(await links.getByRole('status').count(), 0)
  assert.equal(await links.getByRole('alert').count(), 0)
  evidence.scenarios.push('connection-preset-trip-late-result')

  const presetA = {
    mode: 'rail',
    originName: 'Zürich HB',
    originPlaceId: 'station:zurich',
    destinationName: 'Bern',
    destinationPlaceId: 'station:bern',
    startsOn: '2026-11-02',
    dayId: 'day-1',
  }
  const presetB = {
    ...presetA,
    originName: 'Basel',
    originPlaceId: 'station:basel',
    startsOn: '2026-11-03',
    dayId: 'day-2',
  }
  for (const r1 of ['success', 'domain', 'reject']) {
    await page.evaluate((next) => window.fixture.setConnection({ tripId: 'trip-link', origin: 'Zürich', vorgabe: next }), presetA)
    await links.getByLabel('Von').waitFor()
    assert.equal(await links.getByLabel('Von').inputValue(), 'Zürich HB')
    await links.getByLabel('Notiz').fill(`R1 ${r1}`)
    await arm(page, 'connection', r1)
    await links.getByRole('button', { name: 'Verbindung speichern' }).click()
    await page.waitForFunction(() => window.fixture.pending('connection').length === 1)
    const held = await page.evaluate(() => window.fixture.pending('connection'))
    assert.equal(held[0].outcome, r1)
    await page.evaluate((next) => window.fixture.setConnection({ vorgabe: next }), presetB)
    await painted(page)
    assert.equal(await links.getByLabel('Von').inputValue(), 'Basel')
    assert.equal(await links.locator('form').getAttribute('aria-busy'), 'false')
    await links.getByLabel('Notiz').fill('R2 bleibt')
    await links.getByLabel('Verbindungsnummer, falls bekannt').fill('IC 2')
    await arm(page, 'connection', 'success')
    await links.getByRole('button', { name: 'Verbindung speichern' }).click()
    await page.waitForFunction(() => window.fixture.pending('connection').length === 2)
    const pending = await page.evaluate(() => window.fixture.pending('connection'))
    assert.deepEqual(pending.map((entry) => entry.outcome), [r1, 'success'])
    const duringConnection = await active(page)
    await release(page, 'connection')
    const afterConnection = await active(page)
    assert.equal(await links.locator('form').getAttribute('aria-busy'), 'true')
    assert.equal(await links.getByLabel('Notiz').inputValue(), 'R2 bleibt')
    assert.equal(await links.getByLabel('Verbindungsnummer, falls bekannt').inputValue(), 'IC 2')
    assert.equal(await links.getByLabel('Von').inputValue(), 'Basel')
    assert.equal(await links.getByRole('status').count(), 0)
    assert.equal(await links.getByRole('alert').count(), 0)
    assert.equal(afterConnection.tag, duringConnection.tag)
    assert.equal(afterConnection.text, duringConnection.text)
    assert.notEqual(afterConnection.role, 'alert')
    assert.notEqual(duringConnection.text, '')
    await release(page, 'connection')
    await links.getByText(CONNECTION_SAVED).waitFor()
    assert.equal(await links.getByLabel('Notiz').inputValue(), '')
    assert.equal(await links.getByLabel('Verbindungsnummer, falls bekannt').inputValue(), '')
    assert.equal(await links.locator('form').getAttribute('aria-busy'), 'false')
    assert.equal(await links.getByLabel('Von').inputValue(), 'Basel')
  }
  evidence.scenarios.push('connection-late-r1-success-domain-reject-r2-pending')

  await page.evaluate((next) => window.fixture.setConnection({ vorgabe: next }), presetA)
  await links.getByLabel('Von').waitFor()
  assert.equal(await links.getByLabel('Von').inputValue(), 'Zürich HB')
  await links.getByLabel('Notiz').fill('Offen A')
  await arm(page, 'connection', 'success')
  await links.getByRole('button', { name: 'Verbindung speichern' }).click()
  await page.waitForFunction(() => window.fixture.pending('connection').length === 1)
  await page.evaluate((next) => window.fixture.suspendConnection(next), {
    ...presetA,
    originName: 'Luzern',
    originPlaceId: 'station:luzern',
  })
  const suspendedConnection = await awaitSuspend(page)
  assert.equal(suspendedConnection.suspend, false)
  assert.equal(suspendedConnection.vorgabeOrigin, 'Zürich HB')
  assert.equal(await page.locator('[data-transition-fallback]').count(), 0)
  assert.equal(await links.getByLabel('Von').inputValue(), 'Zürich HB')
  assert.equal(await links.getByLabel('Notiz').inputValue(), 'Offen A')
  assert.equal(await links.locator('form').getAttribute('aria-busy'), 'true')
  await page.evaluate(() => window.fixture.abandonTransition())
  await painted(page)
  assert.equal(await page.locator('[data-transition-fallback]').count(), 0)
  assert.equal(await links.getByLabel('Von').inputValue(), 'Zürich HB')
  assert.equal(await links.getByLabel('Notiz').inputValue(), 'Offen A')
  assert.equal(await links.locator('form').getAttribute('aria-busy'), 'true')
  await release(page, 'connection')
  await links.getByText(CONNECTION_SAVED).waitFor()
  assert.equal(await links.locator('form').getAttribute('aria-busy'), 'false')
  assert.equal(await links.getByLabel('Von').inputValue(), 'Zürich HB')
  assert.equal(await links.getByLabel('Notiz').inputValue(), '')
  assert.equal(await links.getByRole('button', { name: 'Verbindung speichern' }).isDisabled(), false)
  evidence.scenarios.push('connection-aborted-transition-releases-lock')

  await page.evaluate(() => window.fixture.setFlight('a'))
  await page.evaluate(() => window.fixture.setFlightTrip('trip-flight'))
  await openFlight(page)
  await flights.getByLabel('Abflugzeit (optional)').fill('11:30')
  await arm(page, 'flight', 'success')
  await flights.getByRole('button', { name: 'Speichern' }).click()
  await page.waitForFunction(() => window.fixture.pending('flight').length === 1)
  const savedFlight = await page.evaluate(() => window.fixture.latest('flight'))
  await release(page, 'flight')
  await flights.getByText('Flugroute gespeichert.').waitFor()
  assert.equal(await flights.getByText('Der gespeicherte Flug ist ausgewählt.').count(), 0)
  await page.evaluate((id) => window.fixture.deliver('flight', id), savedFlight)
  await painted(page)
  await flights.getByText('Der gespeicherte Flug ist ausgewählt.').waitFor()
  assert.match((await active(page)).text, /Flugroute/)
  assert.equal(await flights.locator('form').count(), 0)
  evidence.scenarios.push('flight-saved-graph-readback')

  await openFlight(page)
  await flights.getByLabel('Abflugzeit (optional)').fill('11:45')
  await arm(page, 'flight', 'success')
  await flights.getByRole('button', { name: 'Speichern' }).click()
  await page.waitForFunction(() => window.fixture.pending('flight').length === 1)
  const otherTripFlight = await page.evaluate(() => window.fixture.latest('flight'))
  await release(page, 'flight')
  await page.evaluate(() => window.fixture.setFlightTrip('trip-flight-other'))
  await page.evaluate((id) => window.fixture.deliver('flight', id), otherTripFlight)
  await painted(page)
  assert.equal(await flights.getByText('Der gespeicherte Flug ist ausgewählt.').count(), 0)
  await openFlight(page)
  assert.equal(await flights.getByLabel('Abflugzeit (optional)').inputValue(), '10:00')
  evidence.scenarios.push('flight-saved-graph-changed-trip')

  await page.evaluate(() => window.fixture.setFlight('a'))
  await page.evaluate(() => window.fixture.setFlightTrip('trip-flight'))
  await openFlight(page)
  await flights.getByLabel('Abflugzeit (optional)').fill('11:30')
  await arm(page, 'flight', 'success')
  await flights.getByRole('button', { name: 'Speichern' }).click()
  await page.waitForFunction(() => window.fixture.pending('flight').length === 1)
  const draftFlight = await page.evaluate(() => window.fixture.latest('flight'))
  await release(page, 'flight')
  await openFlight(page)
  const departure = flights.getByLabel('Abflugzeit (optional)')
  await departure.fill('12:00')
  await departure.focus()
  await page.evaluate((id) => window.fixture.deliver('flight', id), draftFlight)
  await painted(page)
  assert.equal(await departure.inputValue(), '12:00')
  assert.equal(await flights.locator('form').count(), 1)
  assert.equal(await flights.getByText('Der gespeicherte Flug ist ausgewählt.').count(), 0)
  assert.equal((await active(page)).label, 'Abflugzeit (optional)')
  evidence.scenarios.push('flight-saved-graph-new-draft')

  await page.evaluate(() => window.fixture.setFlight('a'))
  await openFlight(page)
  await flights.getByLabel('Abflugzeit (optional)').fill('11:30')
  await arm(page, 'flight', 'success')
  await flights.getByRole('button', { name: 'Speichern' }).click()
  await page.waitForFunction(() => window.fixture.pending('flight').length === 1)
  const mirrorFlight = await page.evaluate(() => window.fixture.latest('flight'))
  await page.evaluate(() => window.fixture.suspendFlightTrip('trip-speculative'))
  const suspendedFlight = await awaitSuspend(page)
  assert.equal(suspendedFlight.suspend, false)
  assert.equal(suspendedFlight.flightTripId, 'trip-flight')
  assert.equal(await page.locator('[data-transition-fallback]').count(), 0)
  assert.equal(await flights.locator('form').getAttribute('aria-busy'), 'true')
  await release(page, 'flight')
  await page.evaluate(() => window.fixture.abandonTransition())
  await painted(page)
  await page.evaluate((id) => window.fixture.deliver('flight', id), mirrorFlight)
  await painted(page)
  await flights.getByText('Der gespeicherte Flug ist ausgewählt.').waitFor()
  evidence.scenarios.push('flight-speculative-trip-keeps-readback')

  for (const r1 of ['success', 'domain', 'reject']) {
    await page.evaluate(() => window.fixture.setFlight('a'))
    await openFlight(page)
    await flights.getByLabel('Abflugflughafen (IATA)').fill('FRA')
    await arm(page, 'flight', r1)
    await flights.getByRole('button', { name: 'Speichern' }).click()
    await page.waitForFunction(() => window.fixture.pending('flight').length === 1)
    assert.equal((await page.evaluate(() => window.fixture.pending('flight')))[0].outcome, r1)
    await page.evaluate(() => window.fixture.setFlight('b'))
    await painted(page)
    assert.equal(await flights.locator('form').count(), 0)
    await openFlight(page)
    await flights.getByLabel('Abflugzeit (optional)').fill('12:15')
    await arm(page, 'flight', 'success')
    await flights.getByRole('button', { name: 'Speichern' }).click()
    await page.waitForFunction(() => window.fixture.pending('flight').length === 2)
    assert.deepEqual((await page.evaluate(() => window.fixture.pending('flight'))).map((entry) => entry.outcome), [r1, 'success'])
    const duringFlight = await active(page)
    await release(page, 'flight')
    const afterFlight = await active(page)
    assert.equal(await flights.locator('form').getAttribute('aria-busy'), 'true')
    assert.equal(await flights.getByLabel('Abflugzeit (optional)').inputValue(), '12:15')
    assert.equal(await flights.getByText('Flugroute gespeichert.', { exact: true }).count(), 0)
    assert.equal(await flights.getByText('Route abgelehnt.').count(), 0)
    assert.equal(await flights.getByText('Die Flugroute konnte nicht gespeichert werden. Bitte versuche es erneut.').count(), 0)
    assert.equal(afterFlight.tag, duringFlight.tag)
    assert.equal(afterFlight.text, duringFlight.text)
    assert.notEqual(afterFlight.role, 'alert')
    assert.notEqual(duringFlight.text, '')
    await release(page, 'flight')
    await flights.getByText('Flugroute gespeichert.', { exact: true }).waitFor()
    assert.equal(await flights.locator('form').count(), 0)
  }
  evidence.scenarios.push('flight-late-r1-success-domain-reject-r2-pending')

  await page.evaluate(() => window.fixture.setStay('stay-a'))
  await page.evaluate(() => window.fixture.setStayTrip('trip-stay'))
  await openStay(page)
  await stays.getByLabel('Check-in').fill('2026-11-03')
  await stays.getByLabel('Check-out').fill('2026-11-09')
  await arm(page, 'stay', 'success')
  await stays.getByRole('button', { name: 'Zeitraum speichern' }).click()
  await page.waitForFunction(() => window.fixture.pending('stay').length === 1)
  const staySaved = await page.evaluate(() => window.fixture.latest('stay'))
  await release(page, 'stay')
  await stays.getByText('Zeitraum gespeichert.').waitFor()
  assert.equal(await stays.getByText('Check-in: 2026-11-03 · Check-out: 2026-11-09').count(), 0)
  await page.evaluate((id) => window.fixture.deliver('stay', id), staySaved)
  await painted(page)
  await stays.getByText('Check-in: 2026-11-03 · Check-out: 2026-11-09').waitFor()
  assert.equal(await stays.locator('form').count(), 0)
  assert.match((await active(page)).text, /Zeitraum/)
  await openStay(page)
  assert.equal(await stays.getByLabel('Check-in').inputValue(), '2026-11-03')
  assert.equal(await stays.getByLabel('Check-out').inputValue(), '2026-11-09')
  await stays.getByRole('button', { name: 'Abbrechen' }).click()
  evidence.scenarios.push('stay-saved-graph-readback')

  await openStay(page)
  await stays.getByLabel('Check-in').fill('2026-11-04')
  await stays.getByLabel('Check-out').fill('2026-11-08')
  await arm(page, 'stay', 'success')
  await stays.getByRole('button', { name: 'Zeitraum speichern' }).click()
  await page.waitForFunction(() => window.fixture.pending('stay').length === 1)
  const otherStay = await page.evaluate(() => window.fixture.latest('stay'))
  await release(page, 'stay')
  await page.evaluate(() => window.fixture.setStay('stay-b'))
  await page.evaluate((id) => window.fixture.deliver('stay', id), otherStay)
  await painted(page)
  await stays.getByText('Check-in: 2026-11-02 · Check-out: 2026-11-06').waitFor()
  assert.equal(await stays.getByText('Check-in: 2026-11-04 · Check-out: 2026-11-08').count(), 0)
  evidence.scenarios.push('stay-saved-graph-changed-stay')

  await page.evaluate(() => window.fixture.setStay('stay-a'))
  await page.evaluate(() => window.fixture.setStayTrip('trip-stay'))
  await openStay(page)
  await stays.getByLabel('Check-in').fill('2026-11-03')
  await stays.getByLabel('Check-out').fill('2026-11-09')
  await arm(page, 'stay', 'success')
  await stays.getByRole('button', { name: 'Zeitraum speichern' }).click()
  await page.waitForFunction(() => window.fixture.pending('stay').length === 1)
  const stayGraph = await page.evaluate(() => window.fixture.latest('stay'))
  await release(page, 'stay')
  await openStay(page)
  await stays.getByLabel('Check-in').fill('2026-12-01')
  await stays.getByLabel('Check-out').fill('2026-12-04')
  await stays.getByLabel('Check-in').focus()
  await page.evaluate((id) => window.fixture.deliver('stay', id), stayGraph)
  await painted(page)
  assert.equal(await stays.getByLabel('Check-in').inputValue(), '2026-12-01')
  assert.equal(await stays.getByLabel('Check-out').inputValue(), '2026-12-04')
  assert.equal((await active(page)).label, 'Check-in')
  evidence.scenarios.push('stay-saved-graph-new-draft')

  for (const r1 of ['success', 'domain', 'reject']) {
    await page.evaluate(() => window.fixture.setStay('stay-a'))
    await openStay(page)
    await stays.getByLabel('Check-in').fill('2026-12-02')
    await stays.getByLabel('Check-out').fill('2026-12-06')
    await arm(page, 'stay', r1)
    await stays.getByRole('button', { name: 'Zeitraum speichern' }).click()
    await page.waitForFunction(() => window.fixture.pending('stay').length === 1)
    assert.equal((await page.evaluate(() => window.fixture.pending('stay')))[0].outcome, r1)
    await page.evaluate(() => window.fixture.setStay('stay-b'))
    await painted(page)
    assert.equal(await stays.locator('form').count(), 0)
    await openStay(page)
    await stays.getByLabel('Check-in').fill('2027-01-02')
    await stays.getByLabel('Check-out').fill('2027-01-05')
    await arm(page, 'stay', 'success')
    await stays.getByRole('button', { name: 'Zeitraum speichern' }).click()
    await page.waitForFunction(() => window.fixture.pending('stay').length === 2)
    assert.deepEqual((await page.evaluate(() => window.fixture.pending('stay'))).map((entry) => entry.outcome), [r1, 'success'])
    const duringStay = await active(page)
    await release(page, 'stay')
    const afterStay = await active(page)
    assert.equal(await stays.getByLabel('Check-in').inputValue(), '2027-01-02')
    assert.equal(await stays.getByLabel('Check-out').inputValue(), '2027-01-05')
    assert.equal(await stays.locator('form').getAttribute('aria-busy'), 'true')
    assert.equal(await stays.getByText('Zeitraum gespeichert.', { exact: true }).count(), 0)
    assert.equal(await stays.getByText('Zeitraum abgelehnt.').count(), 0)
    assert.equal(await stays.getByText('Der Zeitraum konnte nicht gespeichert werden. Bitte versuche es erneut.').count(), 0)
    assert.equal(afterStay.tag, duringStay.tag)
    assert.equal(afterStay.text, duringStay.text)
    assert.notEqual(afterStay.role, 'alert')
    assert.notEqual(duringStay.text, '')
    await release(page, 'stay')
    await stays.getByText('Zeitraum gespeichert.', { exact: true }).waitFor()
  }
  evidence.scenarios.push('stay-late-r1-success-domain-reject-r2-pending')

  await page.evaluate(() => window.fixture.setFlight('pair'))
  await page.evaluate(() => window.fixture.setFlightTrip('trip-flight'))
  const rowA = page.locator('[data-flug-punkt="flight-a"]')
  const rowB = page.locator('[data-flug-punkt="flight-b"]')
  await rowA.getByRole('button', { name: /Flugroute/ }).click()
  await rowA.getByLabel('Abflugzeit (optional)').fill('11:30')
  await arm(page, 'flight', 'success')
  await rowA.getByRole('button', { name: 'Speichern' }).click()
  await page.waitForFunction(() => window.fixture.pending('flight').length === 1)
  const otherRowFlight = await page.evaluate(() => window.fixture.latest('flight'))
  await release(page, 'flight')
  await rowA.getByText('Flugroute gespeichert.', { exact: true }).waitFor()
  assert.equal(await flights.getByText('Der gespeicherte Flug ist ausgewählt.').count(), 0)
  await rowB.getByRole('button', { name: /Flugroute/ }).click()
  const otherDeparture = rowB.getByLabel('Abflugzeit (optional)')
  await otherDeparture.fill('12:00')
  await otherDeparture.focus()
  await page.evaluate((id) => window.fixture.deliver('flight', id), otherRowFlight)
  await painted(page)
  assert.equal(await otherDeparture.inputValue(), '12:00')
  assert.equal(await rowB.locator('form').count(), 1)
  assert.equal(await flights.getByText('Der gespeicherte Flug ist ausgewählt.').count(), 0)
  assert.equal((await active(page)).label, 'Abflugzeit (optional)')
  evidence.scenarios.push('flight-other-row-readback-keeps-focus')

  // One named group. Six executions: success/domain/reject × B open/closed.
  // Not six scenario groups and not an assertion count.
  await page.evaluate(() => window.fixture.setFlight('pair'))
  for (const outcome of ['success', 'domain', 'reject']) {
    for (const bState of ['closed', 'open']) {
      await page.evaluate((id) => window.fixture.setFlightTrip(id), `trip-own-${outcome}-${bState}`)
      const rowA = page.locator('[data-flug-punkt="flight-a"]')
      const rowB = page.locator('[data-flug-punkt="flight-b"]')
      await rowA.getByRole('button', { name: /Flugroute/ }).click()
      await rowA.getByLabel('Abflugzeit (optional)').fill('11:30')
      await arm(page, 'flight', outcome)
      await rowA.getByRole('button', { name: 'Speichern' }).click()
      await page.waitForFunction(() => window.fixture.pending('flight').length === 1)
      const held = await page.evaluate(() => window.fixture.latest('flight'))
      await rowB.getByRole('button', { name: /Flugroute/ }).click()
      const departureB = rowB.getByLabel('Abflugzeit (optional)')
      await departureB.fill('12:00')
      let owned
      if (bState === 'closed') {
        await rowB.getByRole('button', { name: 'Abbrechen' }).click()
        await painted(page)
        assert.equal(await rowB.locator('form').count(), 0)
        owned = await markOwned(page)
        assert.equal(owned.tag, 'BUTTON')
        assert.equal(owned.row, 'flight-b')
        assert.equal(owned.text, 'Flugroute ändern')
        assert.equal(owned.expanded, 'false')
      } else {
        await departureB.focus()
        owned = await markOwned(page)
        assert.equal(owned.tag, 'INPUT')
        assert.equal(owned.row, 'flight-b')
        assert.equal(owned.label, 'Abflugzeit (optional)')
        assert.equal(await rowB.locator('form').count(), 1)
        assert.equal(await departureB.inputValue(), '12:00')
      }
      await release(page, 'flight')
      const afterCallback = await ownedNow(page, owned.mark)
      assert.equal(afterCallback.tag, owned.tag)
      assert.equal(afterCallback.row, 'flight-b')
      assert.equal(afterCallback.text, owned.text)
      assert.equal(await flights.getByText('Der gespeicherte Flug ist ausgewählt.').count(), 0)
      if (outcome === 'success') {
        assert.equal(await rowA.locator('form').count(), 0)
        await page.evaluate((id) => window.fixture.deliver('flight', id), held)
        await painted(page)
        const afterGraph = await ownedNow(page, owned.mark)
        assert.equal(afterGraph.tag, owned.tag)
        assert.equal(afterGraph.row, 'flight-b')
        assert.equal(afterGraph.text, owned.text)
        assert.equal(await flights.getByText('Der gespeicherte Flug ist ausgewählt.').count(), 0)
        await rowA.getByText('11:30').first().waitFor()
        if (bState === 'open') {
          assert.equal(await departureB.inputValue(), '12:00')
          assert.equal(await rowB.locator('form').count(), 1)
        } else {
          assert.equal(await rowB.locator('form').count(), 0)
          assert.equal(afterGraph.expanded, 'false')
        }
      } else {
        const message = outcome === 'domain' ? 'Route abgelehnt.' : FLIGHT_THROW
        await rowA.getByText(message).waitFor()
        assert.equal(await rowA.getByLabel('Abflugzeit (optional)').inputValue(), '11:30')
        assert.equal(await rowA.locator('form').count(), 1)
        if (bState === 'open') {
          assert.equal(await departureB.inputValue(), '12:00')
          assert.equal(await rowB.locator('form').count(), 1)
        } else {
          assert.equal(await rowB.locator('form').count(), 0)
        }
      }
    }
  }
  evidence.scenarios.push('flight-pending-a-newer-b-keeps-focus')

  evidence.behaviorBlockedRequests = [...behavior.blocked]
  evidence.behaviorPageErrors = [...behavior.errors]
  assert.deepEqual(evidence.behaviorBlockedRequests, [], 'behavior blocked requests')
  assert.deepEqual(evidence.behaviorPageErrors, [], 'behavior page errors')
  await page.close()
  await behavior.context.close()

  for (const viewport of VIEWPORTS) {
    const opened = await openContext(browser, viewport, origin)
    await openFlight(opened.page)
    await openStay(opened.page)
    const snapshot = await boxes(opened.page)
    assert.equal(snapshot.reducedMotion, true, viewport.name)
    assertFits(viewport.name, snapshot)
    evidence.layouts.push({
      viewport: viewport.name,
      width: viewport.width,
      height: viewport.height,
      scale: 1,
      fontSize: snapshot.fontSize,
      scrollWidth: snapshot.scrollWidth,
      overflow: snapshot.overflow,
      reducedMotion: snapshot.reducedMotion,
      controlCount: snapshot.controls.length,
      maxRight: Math.max(...snapshot.controls.map((item) => item.right)),
    })
    if (viewport.name === '320' || viewport.name === '390' || viewport.name === '1280' || viewport.name === 'landscape') {
      await opened.page.screenshot({ path: join(SCREENS, `${viewport.name}.png`), fullPage: false })
    }
    assert.deepEqual(opened.blocked, [], `${viewport.name} blocked requests`)
    assert.deepEqual(opened.errors, [], `${viewport.name} page errors`)
    evidence.layoutBlockedRequests.push(...opened.blocked)
    evidence.layoutPageErrors.push(...opened.errors)
    await opened.context.close()
  }

  const scaled = await openContext(browser, VIEWPORTS[1], origin)
  await scaled.page.evaluate(() => { document.documentElement.style.fontSize = '32px' })
  await openFlight(scaled.page)
  await openStay(scaled.page)
  const scaledBoxes = await boxes(scaled.page)
  assert.equal(scaledBoxes.fontSize, '32px')
  assert.equal(scaledBoxes.viewport, 320)
  assertFits('320 root 32px', scaledBoxes)
  const connectionBoxes = scaledBoxes.controls.filter((item) => item.region === 'Manuelle Verbindung' && ['INPUT', 'SELECT', 'TEXTAREA'].includes(item.tag))
  assert.equal(connectionBoxes.length, 10)
  evidence.layouts.push({
    viewport: '320',
    width: 320,
    height: 720,
    scale: 2,
    fontSize: '32px',
    scrollWidth: scaledBoxes.scrollWidth,
    overflow: scaledBoxes.overflow,
    reducedMotion: scaledBoxes.reducedMotion,
    connectionControls: connectionBoxes,
    maxRight: Math.max(...scaledBoxes.controls.map((item) => item.right)),
  })
  await scaled.page.screenshot({ path: join(SCREENS, '320-root-32.png'), fullPage: false })
  assert.deepEqual(scaled.blocked, [], '320 root 32px blocked requests')
  assert.deepEqual(scaled.errors, [], '320 root 32px page errors')
  evidence.layoutBlockedRequests.push(...scaled.blocked)
  evidence.layoutPageErrors.push(...scaled.errors)
  evidence.blockedRequests = [...evidence.behaviorBlockedRequests, ...evidence.layoutBlockedRequests]
  evidence.pageErrors = [...evidence.behaviorPageErrors, ...evidence.layoutPageErrors]
  await scaled.context.close()

  evidence.behaviorCount = evidence.scenarios.length
  evidence.layoutCount = evidence.layouts.length
  evidence.status = 'PASS'
  evidence.notVerified = [
    'CI',
    'Preview',
    'hosted account',
    'screen reader',
    'native browser zoom',
    'physical device',
  ]
} catch (error) {
  evidence.status = 'FAIL'
  evidence.failure = String(error?.stack || error)
  throw error
} finally {
  if (browser) await browser.close()
  if (server) await new Promise((resolve) => server.close(resolve))
  writeFileSync(join(EVIDENCE, 'result.json'), `${JSON.stringify(evidence, null, 2)}\n`)
}
