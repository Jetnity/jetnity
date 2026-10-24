#!/usr/bin/env node
// Isolated synthetic proof for Organisieren booking actions and manual rental.
// Mounts the real components. No account, hosted API, public route, or source-string stand-in.

import assert from 'node:assert/strict'
import { execFileSync } from 'node:child_process'
import { createHash } from 'node:crypto'
import { createRequire } from 'node:module'
import { createServer } from 'node:http'
import { mkdirSync, readFileSync, writeFileSync } from 'node:fs'
import { dirname, isAbsolute, join, relative } from 'node:path'
import { fileURLToPath } from 'node:url'

import esbuild from 'esbuild'
import { chromium } from 'playwright'

const require = createRequire(import.meta.url)
const REPO = join(dirname(fileURLToPath(import.meta.url)), '../..')

function evidenceDirectory(historical) {
  const override = process.env.JETNITY_R105_C_EVIDENCE_DIR
  if (!override) return join(REPO, historical)
  if (isAbsolute(override)) throw new Error('JETNITY_R105_C_EVIDENCE_DIR must be a repo-relative path')
  const resolved = join(REPO, override)
  const root = join(REPO, 'docs/evidence/manual-journey-editor-completion-1')
  const fromRoot = relative(root, resolved)
  if (fromRoot.startsWith('..') || isAbsolute(fromRoot)) {
    throw new Error('JETNITY_R105_C_EVIDENCE_DIR must stay inside docs/evidence/manual-journey-editor-completion-1')
  }
  return resolved
}

const EVIDENCE = evidenceDirectory('docs/evidence/organisieren-action-recovery-1')
const SCREENS = join(EVIDENCE, 'screens')
const OUT = join('/tmp', 'organisieren-action-recovery-1')
const MOBILITY = join(REPO, 'components/trips/MobilitaetBereich.tsx')
const VERBINDUNG_HASH = '22979037efebac48a119551fe9825cb3dbf90dd991c9294ac317ca499cb252f8'
const BUCHUNG_WIRD_GESPEICHERT = 'Buchungsstatus wird gespeichert.'
const BUCHUNG_ABGELEHNT = 'Der Buchungsstatus konnte nicht gespeichert werden. Du kannst es erneut versuchen.'
const MIETWAGEN_GESPEICHERT = 'Der Mietwagen ist als Nutzerangabe gespeichert – nicht als Providerbestätigung.'
const MIETWAGEN_ABGELEHNT = 'Der Mietwagen konnte nicht gespeichert werden. Deine Eingabe bleibt erhalten.'
const VERBINDUNG_GESPEICHERT = 'Die Verbindung ist als Nutzerangabe gespeichert – nicht als Providerbestätigung.'
const VERBINDUNG_ABGELEHNT = 'Ob die Verbindung gespeichert wurde, konnten wir nicht bestätigen. Deine Eingabe bleibt erhalten. Prüfe deinen Reiseplan vor einem erneuten Versuch. Ein erneuter Versuch kann eine zweite Verbindung anlegen.'
const OWNED_REGIONS = ['Deine Flüge', 'Deine Unterkunft', 'Deine Verbindungen', 'Dein Mietwagen', 'Manueller Mietwagen']
const VIEWPORTS = [
  { name: 'narrow-320', width: 320, height: 720 },
  { name: 'narrow-390', width: 390, height: 844 },
  { name: 'wide-1280', width: 1280, height: 900 },
]

mkdirSync(OUT, { recursive: true })
mkdirSync(SCREENS, { recursive: true })

const mobilitySource = readFileSync(MOBILITY, 'utf8')
const connectionStart = mobilitySource.indexOf('export function ManuelleVerbindung')
const connectionHash = createHash('sha256').update(mobilitySource.slice(connectionStart)).digest('hex')
if (connectionHash !== VERBINDUNG_HASH) {
  throw new Error(`ManuelleVerbindung hash drifted: ${connectionHash}`)
}

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
    entryPoints: [join(REPO, 'scripts/organisieren-action-recovery-1/mount.tsx')],
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

async function layout(page) {
  return page.evaluate((owned) => {
    const offenders = []
    for (const el of document.querySelectorAll('button, input, select, textarea, h2, p, label')) {
      const rect = el.getBoundingClientRect()
      if (rect.width < 1 || rect.height < 1) continue
      if (rect.right > window.innerWidth + 1 || rect.left < -1) {
        offenders.push({
          tag: el.tagName,
          text: (el.innerText || el.getAttribute('aria-label') || '').replace(/\s+/g, ' ').trim().slice(0, 90),
          left: Math.round(rect.left),
          right: Math.round(rect.right),
          region: el.closest('section')?.getAttribute('aria-label') ?? '',
        })
      }
    }
    return {
      viewport: window.innerWidth,
      scrollWidth: document.documentElement.scrollWidth,
      overflow: document.documentElement.scrollWidth > window.innerWidth + 1,
      ownedOverflow: offenders.filter((item) => owned.includes(item.region)),
      connectionOverflow: offenders.filter((item) => item.region === 'Manuelle Verbindung'),
      otherOverflow: offenders.filter((item) => !owned.includes(item.region) && item.region !== 'Manuelle Verbindung'),
    }
  }, OWNED_REGIONS)
}

function assertOwnedFits(name, snapshot) {
  assert.equal(snapshot.ownedOverflow.length, 0, `${name}: owned surface crosses the viewport ${JSON.stringify(snapshot.ownedOverflow)}`)
  assert.equal(snapshot.otherOverflow.length, 0, `${name}: unexpected overflow ${JSON.stringify(snapshot.otherOverflow)}`)
}

const BOOKING_LABEL = /^(Wird gespeichert …|Buchung korrigieren|Als gebucht markieren)$/

async function bookingTextBounds(page) {
  return page.evaluate((patternSource) => {
    const pattern = new RegExp(patternSource)
    const names = ['Deine Flüge', 'Deine Unterkunft', 'Deine Verbindungen', 'Dein Mietwagen']
    const controls = []
    for (const name of names) {
      const region = document.querySelector(`[aria-label="${name}"]`)
      if (!region) continue
      for (const button of region.querySelectorAll('button')) {
        const text = (button.textContent || '').replace(/\s+/g, ' ').trim()
        if (!pattern.test(text)) continue
        const box = button.getBoundingClientRect()
        const range = document.createRange()
        range.selectNodeContents(button)
        const rects = [...range.getClientRects()].filter((rect) => rect.width > 0 && rect.height > 0)
        const maxExcess = rects.reduce((max, rect) => Math.max(
          max,
          rect.right - box.right,
          box.left - rect.left,
          box.top - rect.top,
          rect.bottom - box.bottom,
        ), 0)
        const style = getComputedStyle(button)
        controls.push({
          region: name,
          text,
          disabled: button.disabled,
          ariaDisabled: button.getAttribute('aria-disabled'),
          width: Math.round(box.width * 100) / 100,
          height: Math.round(box.height * 100) / 100,
          lines: rects.length,
          maxExcess: Math.round(maxExcess * 100) / 100,
          scrollOverflow: button.scrollWidth - button.clientWidth,
          clips: style.overflowX === 'hidden' || style.overflowY === 'hidden' || style.textOverflow === 'ellipsis',
          focusRing: button.className.includes('focus-visible:ring-4'),
        })
      }
    }
    return {
      condition: 'DOM Range client rects against the booking button border box',
      fontSize: getComputedStyle(document.documentElement).fontSize,
      viewport: window.innerWidth,
      controls,
    }
  }, BOOKING_LABEL.source)
}

function assertTextContained(stage, report) {
  assert.equal(report.fontSize, '32px', `${stage}: root font`)
  assert.equal(report.viewport, 320, `${stage}: viewport`)
  assert.ok(report.controls.length >= 8, `${stage}: expected eight booking controls, got ${report.controls.length}`)
  const labels = new Set(report.controls.map((control) => control.text))
  for (const control of report.controls) {
    assert.ok(control.maxExcess <= 1, `${stage}: ${control.region} "${control.text}" exceeds its button by ${control.maxExcess}px`)
    assert.ok(control.scrollOverflow <= 1, `${stage}: ${control.region} "${control.text}" scrolls inside the button`)
    assert.equal(control.clips, false, `${stage}: ${control.region} clips its label`)
    assert.equal(control.focusRing, true, `${stage}: focus ring class missing`)
    assert.ok(control.width > 0 && control.height >= 44, `${stage}: ${control.text} is not a usable target`)
    assert.ok(control.lines >= 1, `${stage}: ${control.text} has no text line`)
  }
  return { stage, labels: [...labels], controls: report.controls.length, maxExcess: Math.max(...report.controls.map((control) => control.maxExcess)) }
}

async function arm(page, channel, outcome) {
  await page.evaluate(({ channel: nextChannel, outcome: next }) => window.fixture.arm(nextChannel, next), { channel, outcome })
}

async function painted(page) {
  await page.evaluate(() => new Promise((resolve) => {
    requestAnimationFrame(() => requestAnimationFrame(() => resolve(null)))
  }))
}

async function release(page, channel) {
  await page.evaluate((next) => window.fixture.release(next), channel)
  await page.waitForFunction((next) => window.fixture.held[next] === false, channel)
}

async function clickBooking(page, regionName, buttonName) {
  await region(page, regionName).getByRole('button', { name: buttonName, exact: true }).click()
}

async function rowText(page, regionName, title) {
  return region(page, regionName).locator('li', { hasText: title }).innerText()
}

async function fillRental(page) {
  const form = region(page, 'Manueller Mietwagen')
  await form.getByLabel('Abholung', { exact: true }).fill('Zürich Flughafen')
  await form.getByLabel('Rückgabe', { exact: true }).fill('Genf')
  await form.getByLabel('Abholdatum').fill('2026-11-02')
  await form.getByLabel('Uhrzeit').nth(0).fill('09:15')
  await form.getByLabel('Rückgabedatum').fill('2026-11-06')
  await form.getByLabel('Uhrzeit').nth(1).fill('18:40')
  await form.getByLabel('Fahrzeugklasse, falls bekannt').selectOption('compact')
  await form.getByLabel('Getriebe, falls bekannt').selectOption('manual')
  await form.getByLabel('Vermieter, falls bekannt').fill('Lokal')
  await form.getByLabel('Notiz').fill('Kinderstuhl')
}

async function rentalValues(page) {
  const form = region(page, 'Manueller Mietwagen')
  return {
    pickup: await form.getByLabel('Abholung', { exact: true }).inputValue(),
    dropoff: await form.getByLabel('Rückgabe', { exact: true }).inputValue(),
    pickupOn: await form.getByLabel('Abholdatum').inputValue(),
    pickupAt: await form.getByLabel('Uhrzeit').nth(0).inputValue(),
    dropoffOn: await form.getByLabel('Rückgabedatum').inputValue(),
    dropoffAt: await form.getByLabel('Uhrzeit').nth(1).inputValue(),
    vehicle: await form.getByLabel('Fahrzeugklasse, falls bekannt').inputValue(),
    transmission: await form.getByLabel('Getriebe, falls bekannt').inputValue(),
    supplier: await form.getByLabel('Vermieter, falls bekannt').inputValue(),
    note: await form.getByLabel('Notiz').inputValue(),
  }
}

async function fillConnection(page) {
  const form = region(page, 'Manuelle Verbindung')
  await form.getByLabel('Art').selectOption('bus')
  await form.getByLabel('Tag').selectOption('day-2')
  await form.getByLabel('Von').fill('Zürich HB')
  await form.getByLabel('Nach').fill('Bern')
  await form.getByLabel('Abfahrt', { exact: true }).fill('2026-11-02')
  await form.getByLabel('Ankunft', { exact: true }).fill('2026-11-02')
  await form.getByLabel('Uhrzeit').nth(0).fill('09:15')
  await form.getByLabel('Uhrzeit').nth(1).fill('10:45')
  await form.getByLabel('Verbindungsnummer, falls bekannt').fill('IC 816')
  await form.getByLabel('Notiz').fill('Fensterplatz')
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
  page.on('pageerror', (error) => errors.push(error.message))
  await page.goto(origin, { waitUntil: 'load' })
  await region(page, 'Deine Flüge').waitFor()
  await region(page, 'Manueller Mietwagen').waitFor()
  await region(page, 'Manuelle Verbindung').waitFor()
  return { context, page, blocked, errors }
}

async function pendingFlight(page) {
  await arm(page, 'booking', 'success')
  const flight = region(page, 'Deine Flüge')
  const button = flight.getByRole('button', { name: 'Als gebucht markieren', exact: true })
  await button.focus()
  await page.keyboard.press('Enter')
  await page.waitForFunction(() => window.fixture.held.booking === true)
  const pending = flight.getByRole('button', { name: 'Wird gespeichert …', exact: true })
  assert.equal(await pending.evaluate((el) => document.activeElement === el), true)
  assert.equal(await pending.evaluate((el) => el.disabled), false)
  assert.equal(await pending.getAttribute('aria-disabled'), 'true')
  assert.equal(await flight.getByRole('button', { name: 'Buchung korrigieren', exact: true }).isDisabled(), true)
  assert.equal(await flight.getAttribute('aria-busy'), 'true')
  assert.equal(await flight.getByText(BUCHUNG_WIRD_GESPEICHERT).count(), 1)
  const before = await page.evaluate(() => window.fixture.calls.booking.length)
  await page.keyboard.press('Enter')
  await flight.getByRole('button', { name: 'Buchung korrigieren', exact: true }).click({ force: true })
  const after = await page.evaluate(() => window.fixture.calls.booking.length)
  assert.equal(after, before)
  assert.deepEqual(await page.evaluate(() => window.fixture.calls.booking), [{ itemId: 'flight-open', gebucht: true }])
  const stayBefore = await page.evaluate(() => window.fixture.calls.booking.length)
  await clickBooking(page, 'Deine Unterkunft', 'Als gebucht markieren')
  await page.waitForFunction(() => window.fixture.calls.booking.length === 2)
  assert.equal(await page.evaluate(() => window.fixture.calls.booking.length), stayBefore + 1)
  return pending
}

const evidence = {
  author: 'Jetnity Organisieren Action Recovery 1 — Cursor Generation 1',
  session: 'bc-9156e555-e2b3-4e47-9b8a-1bfa65fc2bfa',
  sessionUrl: 'https://cursor.com/agents/bc-9156e555-e2b3-4e47-9b8a-1bfa65fc2bfa',
  model: 'grok-4.7-high-fast',
  connectionHash,
  stubBoundary: 'In-memory callbacks only. Not an account, guest-storage, hosted, provider, physical-device, or screen-reader proof.',
  viewports: VIEWPORTS,
  scenarios: [],
  layouts: [],
  blockedRequests: [],
  pageErrors: [],
  bookingText: [],
  bookingTextCondition: 'At 320 CSS px and root font-size 32px, every booking-label Range rect must sit inside its button border box. Also rejects button scroll, overflow hidden, and text-overflow ellipsis. States: idle, pending, recovered, domain error.',
  status: 'FAIL',
  failure: null,
  browser: null,
}

let server
let browser
try {
  const css = await compileCss()
  const script = await bundle()
  writeFileSync(join(OUT, 'style.css'), css)
  writeFileSync(join(OUT, 'harness.js'), script)
  const html = `<!doctype html><html lang="de"><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"><title>Organisieren Action Recovery</title><link rel="stylesheet" href="/style.css"><body><div id="root"></div><script src="/harness.js"></script>`
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
  const launched = await launchBrowser()
  evidence.browser = { channel: launched.channel, launchErrors: launched.errors }
  if (!launched.browser) {
    evidence.status = 'NOT RUN/BLOCKED'
    evidence.failure = launched.errors.join('\n')
    throw new Error('browser launch blocked')
  }
  browser = launched.browser
  evidence.browser.version = browser.version()

  for (const viewport of VIEWPORTS) {
    const opened = await openContext(browser, viewport, origin)
    const idle = await layout(opened.page)
    assertOwnedFits(`${viewport.name} idle`, idle)
    evidence.layouts.push({
      viewport: viewport.name,
      scale: 1,
      scrollWidth: idle.scrollWidth,
      overflow: idle.overflow,
      ownedOverflow: idle.ownedOverflow,
      otherOverflow: idle.otherOverflow,
      connectionOverflow: idle.connectionOverflow,
    })
    await opened.page.evaluate(() => window.fixture.reset())
    await pendingFlight(opened.page)
    const pendingShot = join(SCREENS, `${viewport.name}-flight-pending.png`)
    await region(opened.page, 'Deine Flüge').screenshot({ path: pendingShot })
    await release(opened.page, 'booking')
    const openRow = await rowText(opened.page, 'Deine Flüge', 'Flug offen')
    assert.match(openRow, /Ausgewählt/)
    assert.doesNotMatch(openRow, /Gebucht/)
    assert.equal(await region(opened.page, 'Deine Flüge').getByRole('alert').count(), 0)
    evidence.blockedRequests.push(...opened.blocked)
    evidence.pageErrors.push(...opened.errors)
    evidence.scenarios.push({ viewport: viewport.name, kind: 'flight-pending-keyboard-sibling-other-inventory', status: 'PASS' })
    await opened.context.close()
  }

  const deep = await openContext(browser, VIEWPORTS[2], origin)
  const page = deep.page
  await page.evaluate(() => window.fixture.reset())

  await arm(page, 'booking', 'error')
  await clickBooking(page, 'Dein Mietwagen', 'Buchung korrigieren')
  await page.waitForFunction(() => window.fixture.held.booking === true)
  await release(page, 'booking')
  await region(page, 'Dein Mietwagen').getByRole('alert').waitFor()
  assert.equal(await region(page, 'Dein Mietwagen').getByRole('alert').innerText(), 'Speichern abgelehnt.')
  assert.equal(await region(page, 'Dein Mietwagen').getByRole('button', { name: 'Buchung korrigieren', exact: true }).isDisabled(), false)
  await page.screenshot({ path: join(SCREENS, 'wide-1280-rental-domain-error.png'), fullPage: false })

  await arm(page, 'booking', 'reject')
  await clickBooking(page, 'Deine Verbindungen', 'Als gebucht markieren')
  await page.waitForFunction(() => window.fixture.held.booking === true)
  await release(page, 'booking')
  assert.equal(await region(page, 'Deine Verbindungen').getByRole('alert').innerText(), BUCHUNG_ABGELEHNT)
  assert.equal((await region(page, 'Deine Verbindungen').getByRole('alert').innerText()).includes('secret'), false)

  await arm(page, 'booking', 'throw')
  await clickBooking(page, 'Deine Unterkunft', 'Buchung korrigieren')
  await region(page, 'Deine Unterkunft').getByRole('alert').waitFor()
  assert.equal(await region(page, 'Deine Unterkunft').getByRole('alert').innerText(), BUCHUNG_ABGELEHNT)
  assert.equal((await region(page, 'Deine Unterkunft').getByRole('alert').innerText()).includes('secret'), false)
  const retryBefore = await page.evaluate(() => window.fixture.calls.booking.length)
  await arm(page, 'booking', 'success')
  await clickBooking(page, 'Deine Unterkunft', 'Buchung korrigieren')
  await page.waitForFunction((count) => window.fixture.calls.booking.length === count, retryBefore + 1)
  await release(page, 'booking')
  assert.equal(await region(page, 'Deine Unterkunft').getByRole('alert').count(), 0)

  await page.evaluate(() => window.fixture.commitBooking('flight-open', true))
  await region(page, 'Deine Flüge').locator('li', { hasText: 'Flug offen' }).getByText('Gebucht', { exact: true }).waitFor()
  const bookedRow = await rowText(page, 'Deine Flüge', 'Flug offen')
  assert.match(bookedRow, /Gebucht/)
  assert.equal(await region(page, 'Deine Flüge').locator('li', { hasText: 'Flug offen' }).getByRole('button', { name: 'Als gebucht markieren', exact: true }).count(), 0)

  await arm(page, 'booking', 'success')
  await region(page, 'Deine Flüge').locator('li', { hasText: 'Flug offen' }).getByRole('button', { name: 'Buchung korrigieren', exact: true }).click()
  await page.waitForFunction(() => window.fixture.calls.booking.at(-1)?.itemId === 'flight-open' && window.fixture.calls.booking.at(-1)?.gebucht === false)
  await page.evaluate(() => window.fixture.removeItem('flight-open'))
  await painted(page)
  assert.equal(await region(page, 'Deine Flüge').getByText('Flug offen').count(), 0)
  assert.equal(await region(page, 'Deine Flüge').getByRole('button', { name: 'Wird gespeichert …' }).count(), 0)
  assert.equal(await region(page, 'Deine Flüge').getByRole('button', { name: 'Buchung korrigieren', exact: true }).isDisabled(), false)
  const callsAtGone = await page.evaluate(() => window.fixture.calls.booking.length)
  await release(page, 'booking')
  assert.equal(await page.evaluate(() => window.fixture.calls.booking.length), callsAtGone)
  assert.equal(await region(page, 'Deine Flüge').getByRole('alert').count(), 0)

  await arm(page, 'booking', 'success')
  await clickBooking(page, 'Dein Mietwagen', 'Als gebucht markieren')
  await page.waitForFunction(() => window.fixture.held.booking === true)
  await page.evaluate(() => window.fixture.setTrip('trip-later'))
  await painted(page)
  assert.equal(await region(page, 'Dein Mietwagen').getAttribute('aria-busy'), 'false')
  const callsAtTrip = await page.evaluate(() => window.fixture.calls.booking.length)
  await release(page, 'booking')
  assert.equal(await page.evaluate(() => window.fixture.calls.booking.length), callsAtTrip)
  assert.equal(await region(page, 'Dein Mietwagen').getByRole('alert').count(), 0)
  await arm(page, 'booking', 'success')
  await clickBooking(page, 'Dein Mietwagen', 'Als gebucht markieren')
  await page.waitForFunction((count) => window.fixture.calls.booking.length === count, callsAtTrip + 1)
  await release(page, 'booking')

  await arm(page, 'booking', 'success')
  await clickBooking(page, 'Deine Verbindungen', 'Buchung korrigieren')
  await page.waitForFunction(() => window.fixture.held.booking === true)
  const epochBefore = await page.evaluate(() => window.fixture.epoch)
  await page.evaluate(() => window.fixture.unmount())
  assert.equal(await region(page, 'Deine Verbindungen').count(), 0)
  await page.evaluate(() => window.fixture.remount())
  await region(page, 'Deine Verbindungen').waitFor()
  assert.equal(await page.evaluate(() => window.fixture.epoch), epochBefore + 1)
  const callsAtUnmount = await page.evaluate(() => window.fixture.calls.booking.length)
  await release(page, 'booking')
  assert.equal(await page.evaluate(() => window.fixture.calls.booking.length), callsAtUnmount)
  assert.equal(await region(page, 'Deine Verbindungen').getByRole('alert').count(), 0)
  assert.equal(await region(page, 'Deine Verbindungen').getByRole('button', { name: 'Wird gespeichert …' }).count(), 0)

  const flight = region(page, 'Deine Flüge')
  await flight.getByRole('button', { name: 'Flugroute ergänzen' }).first().click()
  const abflug = flight.getByLabel('Abflugflughafen (IATA)').first()
  await abflug.fill('ZRH')
  await arm(page, 'booking', 'success')
  await flight.getByRole('button', { name: 'Buchung korrigieren', exact: true }).click()
  await page.waitForFunction(() => window.fixture.held.booking === true)
  await abflug.focus()
  await abflug.fill('ZAG')
  await release(page, 'booking')
  assert.equal(await abflug.inputValue(), 'ZAG')
  assert.equal(await abflug.evaluate((el) => document.activeElement === el), true)
  assert.equal(await page.evaluate(() => window.fixture.calls.route.length), 0)

  const stay = region(page, 'Deine Unterkunft')
  await stay.getByRole('button', { name: 'Zeitraum ergänzen' }).first().click()
  const checkIn = stay.getByLabel('Check-in').first()
  await checkIn.fill('2026-11-02')
  await arm(page, 'booking', 'success')
  await stay.getByRole('button', { name: 'Als gebucht markieren', exact: true }).click()
  await page.waitForFunction(() => window.fixture.held.booking === true)
  await checkIn.focus()
  await checkIn.fill('2026-11-03')
  await release(page, 'booking')
  assert.equal(await checkIn.inputValue(), '2026-11-03')
  assert.equal(await checkIn.evaluate((el) => document.activeElement === el), true)
  assert.equal(await page.evaluate(() => window.fixture.calls.stay.length), 0)

  await fillConnection(page)
  await arm(page, 'connection', 'success')
  await page.evaluate(() => {
    const form = document.querySelector('[aria-label="Manuelle Verbindung"] form')
    form.requestSubmit()
    form.requestSubmit()
  })
  await page.waitForFunction(() => window.fixture.held.connection === true)
  assert.equal(await page.evaluate(() => window.fixture.calls.connection.length), 1)
  const connectionPayload = await page.evaluate(() => window.fixture.calls.connection[0])
  assert.equal(connectionPayload.mode, 'bus')
  assert.equal(connectionPayload.originName, 'Zürich HB')
  assert.equal(connectionPayload.destinationName, 'Bern')
  assert.equal(connectionPayload.connectionRef, 'IC 816')
  assert.equal(connectionPayload.note, 'Fensterplatz')
  assert.equal(connectionPayload.priceAmount, null)
  assert.equal(connectionPayload.originPlaceId, null)
  const connectionForm = region(page, 'Manuelle Verbindung')
  assert.equal(await connectionForm.locator('form').getAttribute('aria-busy'), 'true')
  assert.equal(await connectionForm.getByLabel('Notiz').isDisabled(), true)
  await connectionForm.getByLabel('Notiz').focus({ force: true })
  await page.keyboard.type('Z')
  assert.equal(await connectionForm.getByLabel('Notiz').inputValue(), 'Fensterplatz')
  await release(page, 'connection')
  await connectionForm.getByText(VERBINDUNG_GESPEICHERT).waitFor()
  assert.equal(await connectionForm.getByLabel('Notiz').inputValue(), '')
  assert.equal(await connectionForm.getByLabel('Verbindungsnummer, falls bekannt').inputValue(), '')
  assert.equal(await connectionForm.getByLabel('Von').inputValue(), 'Zürich HB')
  assert.equal(await connectionForm.getByLabel('Art').inputValue(), 'bus')

  await connectionForm.getByLabel('Notiz').fill('Bleibt bei Fehler')
  await connectionForm.getByLabel('Verbindungsnummer, falls bekannt').fill('IC 1')
  await arm(page, 'connection', 'error')
  await connectionForm.getByRole('button', { name: 'Verbindung speichern' }).click()
  await page.waitForFunction(() => window.fixture.held.connection === true)
  await release(page, 'connection')
  assert.equal(await connectionForm.getByRole('alert').innerText(), 'Synthetischer Speicherfehler. Die Eingabe bleibt erhalten.')
  assert.equal(await connectionForm.getByLabel('Notiz').inputValue(), 'Bleibt bei Fehler')
  await arm(page, 'connection', 'reject')
  await connectionForm.getByRole('button', { name: 'Verbindung speichern' }).click()
  await page.waitForFunction(() => window.fixture.held.connection === true)
  await release(page, 'connection')
  assert.equal(await connectionForm.getByRole('alert').innerText(), VERBINDUNG_ABGELEHNT)
  assert.equal((await connectionForm.getByRole('alert').innerText()).includes('secret'), false)
  assert.equal(await connectionForm.getByLabel('Notiz').inputValue(), 'Bleibt bei Fehler')

  await fillRental(page)
  await arm(page, 'rental', 'success')
  await page.evaluate(() => {
    const form = document.querySelector('[aria-label="Manueller Mietwagen"] form')
    form.requestSubmit()
    form.requestSubmit()
  })
  await page.waitForFunction(() => window.fixture.held.rental === true)
  assert.equal(await page.evaluate(() => window.fixture.calls.rental.length), 1)
  const rentalPayload = await page.evaluate(() => window.fixture.calls.rental[0])
  assert.deepEqual(rentalPayload, {
    title: null,
    pickupName: 'Zürich Flughafen',
    dropoffName: 'Genf',
    pickupPlaceId: null,
    dropoffPlaceId: null,
    pickupOn: '2026-11-02',
    pickupAt: '09:15',
    dropoffOn: '2026-11-06',
    dropoffAt: '18:40',
    rentalSupplier: 'Lokal',
    vehicleClass: 'compact',
    transmission: 'manual',
    priceAmount: null,
    priceCurrency: null,
    note: 'Kinderstuhl',
    dayId: null,
    stageId: null,
  })
  const rentalForm = region(page, 'Manueller Mietwagen')
  assert.equal(await rentalForm.locator('form').getAttribute('aria-busy'), 'true')
  assert.equal(await rentalForm.getByText('Der Mietwagen wird gespeichert.').count(), 1)
  const during = await rentalValues(page)
  await rentalForm.getByLabel('Notiz').focus({ force: true })
  await page.keyboard.type('Z')
  assert.deepEqual(await rentalValues(page), during)
  await rentalForm.screenshot({ path: join(SCREENS, 'wide-1280-rental-pending.png') })
  await page.evaluate(() => window.fixture.setTrip('trip-rental-late'))
  await painted(page)
  const kept = await rentalValues(page)
  assert.equal(kept.note, 'Kinderstuhl')
  assert.equal(await rentalForm.getByLabel('Abholung', { exact: true }).isDisabled(), false)
  const rentalCalls = await page.evaluate(() => window.fixture.calls.rental.length)
  await release(page, 'rental')
  assert.equal(await page.evaluate(() => window.fixture.calls.rental.length), rentalCalls)
  assert.equal((await rentalValues(page)).note, 'Kinderstuhl')
  assert.equal(await rentalForm.getByText(MIETWAGEN_GESPEICHERT).count(), 0)

  await arm(page, 'rental', 'error')
  await rentalForm.getByRole('button', { name: 'Mietwagen speichern' }).click()
  await page.waitForFunction(() => window.fixture.held.rental === true)
  await release(page, 'rental')
  assert.equal(await rentalForm.getByRole('alert').innerText(), 'Mietwagen abgelehnt.')
  assert.equal((await rentalValues(page)).pickup, 'Zürich Flughafen')
  await arm(page, 'rental', 'reject')
  await rentalForm.getByRole('button', { name: 'Mietwagen speichern' }).click()
  await page.waitForFunction(() => window.fixture.held.rental === true)
  await release(page, 'rental')
  assert.equal(await rentalForm.getByRole('alert').innerText(), MIETWAGEN_ABGELEHNT)
  assert.equal((await rentalForm.getByRole('alert').innerText()).includes('secret'), false)
  await arm(page, 'rental', 'throw')
  await rentalForm.getByRole('button', { name: 'Mietwagen speichern' }).click()
  await rentalForm.getByRole('alert').waitFor()
  assert.equal(await rentalForm.getByRole('alert').innerText(), MIETWAGEN_ABGELEHNT)
  assert.equal((await rentalValues(page)).note, 'Kinderstuhl')
  await rentalForm.getByLabel('Notiz').fill('Korrigiert')
  await arm(page, 'rental', 'success')
  await rentalForm.getByRole('button', { name: 'Mietwagen speichern' }).click()
  await page.waitForFunction(() => window.fixture.calls.rental.at(-1)?.note === 'Korrigiert')
  await release(page, 'rental')
  await rentalForm.getByText(MIETWAGEN_GESPEICHERT).waitFor()
  const cleared = await rentalValues(page)
  assert.deepEqual(Object.values(cleared), ['', '', '', '', '', '', '', '', '', ''])
  await rentalForm.screenshot({ path: join(SCREENS, 'wide-1280-rental-saved.png') })

  await page.evaluate(() => { document.documentElement.style.fontSize = '32px' })
  const reflowWide = await layout(page)
  assertOwnedFits('wide-1280 200%', reflowWide)
  evidence.layouts.push({
    viewport: 'wide-1280',
    scale: 2,
    scrollWidth: reflowWide.scrollWidth,
    overflow: reflowWide.overflow,
    ownedOverflow: reflowWide.ownedOverflow,
    otherOverflow: reflowWide.otherOverflow,
    connectionOverflow: reflowWide.connectionOverflow,
  })
  await region(page, 'Deine Flüge').screenshot({ path: join(SCREENS, 'wide-1280-200.png') })
  await page.evaluate(() => { document.documentElement.style.fontSize = '' })

  evidence.blockedRequests.push(...deep.blocked)
  evidence.pageErrors.push(...deep.errors)
  evidence.scenarios.push({ viewport: 'wide-1280', kind: 'failure-retry-context-rental-connection-focus', status: 'PASS' })
  await deep.context.close()

  for (const viewport of [VIEWPORTS[0], VIEWPORTS[2]]) {
    const opened = await openContext(browser, viewport, origin)
    await opened.page.evaluate(() => { document.documentElement.style.fontSize = '32px' })
    const snapshot = await layout(opened.page)
    assertOwnedFits(`${viewport.name} 200%`, snapshot)
    evidence.layouts.push({
      viewport: viewport.name,
      scale: 2,
      fresh: true,
      scrollWidth: snapshot.scrollWidth,
      overflow: snapshot.overflow,
      ownedOverflow: snapshot.ownedOverflow,
      otherOverflow: snapshot.otherOverflow,
      connectionOverflow: snapshot.connectionOverflow,
    })
    await opened.page.screenshot({ path: join(SCREENS, `${viewport.name}-200.png`), fullPage: false })
    if (viewport.width === 320) {
      const idle = assertTextContained('idle', await bookingTextBounds(opened.page))
      evidence.bookingText.push(idle)
      const regions = ['Deine Flüge', 'Deine Unterkunft', 'Deine Verbindungen', 'Dein Mietwagen']
      for (const name of regions) {
        await arm(opened.page, 'booking', 'success')
        await clickBooking(opened.page, name, 'Als gebucht markieren')
        await opened.page.waitForFunction(() => window.fixture.held.booking === true)
        const pending = assertTextContained(`${name} pending`, await bookingTextBounds(opened.page))
        evidence.bookingText.push(pending)
        if (name === 'Deine Flüge') {
          await region(opened.page, name).screenshot({ path: join(SCREENS, 'narrow-320-200-flight-pending-text.png') })
        }
        await release(opened.page, 'booking')
        await opened.page.waitForFunction((regionName) => {
          const scope = document.querySelector(`[aria-label="${regionName}"]`)
          return scope && ![...scope.querySelectorAll('button')].some((button) => (button.textContent || '').includes('Wird gespeichert'))
        }, name)
        const recovered = assertTextContained(`${name} recovered`, await bookingTextBounds(opened.page))
        evidence.bookingText.push(recovered)
      }
      await arm(opened.page, 'booking', 'error')
      await clickBooking(opened.page, 'Deine Flüge', 'Buchung korrigieren')
      await opened.page.waitForFunction(() => window.fixture.held.booking === true)
      await release(opened.page, 'booking')
      await region(opened.page, 'Deine Flüge').getByRole('alert').waitFor()
      const errored = assertTextContained('domain-error', await bookingTextBounds(opened.page))
      evidence.bookingText.push(errored)
      await region(opened.page, 'Deine Flüge').screenshot({ path: join(SCREENS, 'narrow-320-200-flight-error-text.png') })
    }
    evidence.blockedRequests.push(...opened.blocked)
    evidence.pageErrors.push(...opened.errors)
    await opened.context.close()
  }

  assert.deepEqual(evidence.pageErrors, [])
  assert.deepEqual(evidence.blockedRequests, [])
  evidence.status = 'PASS'
} catch (error) {
  if (evidence.status !== 'NOT RUN/BLOCKED') evidence.status = 'FAIL'
  evidence.failure = error && error.stack ? error.stack : String(error)
  console.error(evidence.failure)
} finally {
  const blobs = ['FlugBestand.tsx', 'UnterkunftBestand.tsx', 'MobilitaetBereich.tsx', 'MietwagenBereich.tsx'].map((name) => {
    const file = join(REPO, 'components/trips', name)
    return { file: `components/trips/${name}`, blob: execFileSync('git', ['hash-object', file], { cwd: REPO, encoding: 'utf8' }).trim() }
  })
  evidence.blobs = blobs
  writeFileSync(join(EVIDENCE, 'result.json'), `${JSON.stringify(evidence, null, 2)}\n`)
  if (browser) await browser.close()
  if (server) await new Promise((resolve) => server.close(resolve))
  if (evidence.status !== 'PASS') process.exitCode = 1
}
