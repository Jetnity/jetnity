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

async function arm(page, channel, outcome) {
  await page.evaluate(({ channel: nextChannel, outcome: next }) => window.fixture.arm(nextChannel, next), { channel, outcome })
}

async function release(page, channel) {
  await page.evaluate((next) => window.fixture.release(next), channel)
  await page.waitForFunction((next) => window.fixture.held[next] === false, channel)
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
  await scope.getByRole('button', { name: /Flugroute/ }).click()
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
  await scope.getByRole('button', { name: /Zeitraum/ }).click()
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
  stubs: 'in-memory onSpeichern/onUnterkunftZeitraum/onAnlegen; no guest storage, account, provider, or database',
  scenarios: [],
  layouts: [],
  blockedRequests: [],
  pageErrors: [],
  status: 'FAIL',
  failure: null,
  browser: null,
  caseCount: 0,
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

  const page = (await openContext(browser, VIEWPORTS[3], origin)).page
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

  await page.close()

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
    evidence.blockedRequests.push(...opened.blocked)
    evidence.pageErrors.push(...opened.errors)
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
  evidence.blockedRequests.push(...scaled.blocked)
  evidence.pageErrors.push(...scaled.errors)
  await scaled.context.close()

  evidence.caseCount = evidence.scenarios.length + evidence.layouts.length
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
