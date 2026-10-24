#!/usr/bin/env node
// Isolated synthetic interaction proof for ManuelleVerbindung.
// Mounts the real component. No account, hosted API, public route, or source-string stand-in.

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

const EVIDENCE = evidenceDirectory('docs/evidence/manual-mobility-pending-draft-guard-1')
const SCREENS = join(EVIDENCE, 'screens')
const OUT = join('/tmp', 'manual-mobility-pending-draft-guard-1')
const COMPONENT = join(REPO, 'components/trips/MobilitaetBereich.tsx')
const SUCCESS = 'Die Verbindung ist als Nutzerangabe gespeichert – nicht als Providerbestätigung.'
const THROWN = 'Ob die Verbindung gespeichert wurde, konnten wir nicht bestätigen. Deine Eingabe bleibt erhalten. Prüfe deinen Reiseplan vor einem erneuten Versuch. Ein erneuter Versuch kann eine zweite Verbindung anlegen.'
const RETURNED = 'Synthetischer Speicherfehler. Die Eingabe bleibt erhalten.'
const VIEWPORTS = [
  { name: 'narrow-320', width: 320, height: 720 },
  { name: 'narrow-390', width: 390, height: 844 },
  { name: 'wide-1280', width: 1280, height: 900 },
]

mkdirSync(OUT, { recursive: true })
mkdirSync(SCREENS, { recursive: true })

const source = readFileSync(COMPONENT)
const sourceSha256 = createHash('sha256').update(source).digest('hex')
const sourceBlob = execFileSync('git', ['hash-object', COMPONENT], { cwd: REPO, encoding: 'utf8' }).trim()

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
    entryPoints: [join(REPO, 'scripts/manual-mobility-pending-draft-guard-1/mount.tsx')],
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

function section(page) {
  return page.getByRole('region', { name: 'Manuelle Verbindung' })
}

async function fields(scope) {
  return scope.locator('input, select, textarea, button').evaluateAll((nodes) =>
    nodes.map((el) => ({
      tag: el.tagName,
      type: el.getAttribute('type'),
      label: (el.closest('label')?.innerText ?? el.textContent ?? '').split('\n')[0].trim(),
      value: 'value' in el ? el.value : '',
      disabled: el.matches(':disabled'),
    })),
  )
}

async function layout(page) {
  return page.evaluate(() => {
    const root = document.querySelector('[aria-label="Manuelle Verbindung"]')
    const controls = [...root.querySelectorAll('label, input, select, textarea, button, legend')].map((el) => {
      const rect = el.getBoundingClientRect()
      return {
        tag: el.tagName,
        label: (el.innerText || el.getAttribute('aria-label') || '').split('\n')[0].trim().slice(0, 80),
        width: rect.width,
        height: rect.height,
        left: rect.left,
        right: rect.right,
        top: rect.top,
      }
    })
    return {
      viewport: window.innerWidth,
      scrollWidth: document.documentElement.scrollWidth,
      overflow: document.documentElement.scrollWidth > window.innerWidth + 1,
      controls,
    }
  })
}

function assertUsable(name, snapshot) {
  assert.equal(snapshot.overflow, false, `${name}: horizontal overflow`)
  const interactive = snapshot.controls.filter((item) => ['INPUT', 'SELECT', 'TEXTAREA', 'BUTTON'].includes(item.tag))
  assert.ok(interactive.length >= 11, `${name}: expected every submitted control`)
  for (const item of interactive) {
    assert.ok(item.width > 0 && item.height >= 44, `${name}: ${item.label || item.tag} is not a usable target`)
    assert.ok(item.left >= -1 && item.right <= snapshot.viewport + 1, `${name}: ${item.label || item.tag} crosses the viewport`)
  }
  for (const text of ['Art', 'Tag', 'Von', 'Nach', 'Abfahrt', 'Ankunft', 'Verbindungsnummer, falls bekannt', 'Notiz']) {
    assert.ok(snapshot.controls.some((item) => item.label.startsWith(text) && item.width > 0 && item.height > 0), `${name}: missing label ${text}`)
  }
}

async function fillDraft(page, { destination = 'Bern' } = {}) {
  const form = section(page).locator('form')
  await form.getByLabel('Art').selectOption('bus')
  await form.getByLabel('Tag').selectOption('day-2')
  if (destination !== 'Bern') await form.getByLabel('Nach').fill(destination)
  await form.getByLabel('Abfahrt', { exact: true }).fill('2026-11-02')
  await form.getByLabel('Ankunft', { exact: true }).fill('2026-11-02')
  await form.getByLabel('Uhrzeit').nth(0).fill('09:15')
  await form.getByLabel('Uhrzeit').nth(1).fill('10:45')
  await form.getByLabel('Verbindungsnummer, falls bekannt').fill('IC 816')
  await form.getByLabel('Notiz').fill('Fensterplatz')
}

function expectedPayload(destination = 'Bern') {
  return {
    mode: 'bus',
    title: null,
    originName: 'Zürich HB',
    destinationName: destination,
    originPlaceId: 'station:8503000',
    destinationPlaceId: destination === 'Bern' ? 'station:8507000' : null,
    startsOn: '2026-11-02',
    startsAt: '09:15',
    endsOn: '2026-11-02',
    endsAt: '10:45',
    connectionRef: 'IC 816',
    mobilityChanges: null,
    priceAmount: null,
    priceCurrency: null,
    note: 'Fensterplatz',
    dayId: 'day-2',
    stageId: 'stage-2',
  }
}

async function resistEdits(page) {
  const form = section(page).locator('form')
  const before = await fields(form)
  const controls = form.locator('input, select, textarea')
  const count = await controls.count()
  const focused = []
  for (let index = 0; index < count; index += 1) {
    const control = controls.nth(index)
    const box = await control.boundingBox()
    if (box) await page.mouse.click(box.x + Math.min(12, box.width / 2), box.y + box.height / 2)
    focused.push(await control.evaluate((el) => {
      el.focus()
      return document.activeElement === el
    }))
    await page.keyboard.type('Z')
    await page.keyboard.press('ArrowDown')
  }
  await page.keyboard.press('Enter')
  const during = await fields(form)
  const valuesSame = before.every((field, index) => field.value === during[index].value)
  const controlsDisabled = before.filter((field) => field.tag !== 'BUTTON').every((field) => field.disabled)
  const buttonDisabled = before.some((field) => field.tag === 'BUTTON' && field.disabled)
  return { valuesSame, controlsDisabled, buttonDisabled, focusedAny: focused.some(Boolean), before, during }
}

async function submitOnce(page, outcome) {
  await page.evaluate((next) => window.fixture.arm(next), outcome)
  await section(page).getByRole('button', { name: 'Verbindung speichern' }).click()
  await page.waitForFunction(() => window.fixture.held === true)
}

async function duplicateWhilePending(page) {
  const before = await page.evaluate(() => window.fixture.calls.length)
  await page.evaluate(() => {
    const form = document.querySelector('[aria-label="Manuelle Verbindung"] form')
    form.requestSubmit()
    form.querySelector('button[type="submit"]').click()
  })
  await page.keyboard.press('Enter')
  const after = await page.evaluate(() => window.fixture.calls.length)
  return { before, after }
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
  await section(page).waitFor()
  return { context, page, blocked, errors }
}

const evidence = {
  author: 'Jetnity Manual Mobility Pending Draft Guard 1 — Cursor Generation 1',
  session: 'bc-529c718d-03e4-43f9-a8fa-7e555d3f4cbf',
  model: 'grok-4.7-high-fast',
  component: 'components/trips/MobilitaetBereich.tsx',
  exportedComponent: 'ManuelleVerbindung',
  sourceSha256,
  sourceBlob,
  baselineBlob: '8560a106e4eb61a852b2f4ce27868ab30cf18cf0',
  viewports: VIEWPORTS,
  scenarios: [],
  blockedRequests: [],
  pageErrors: [],
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
  const html = `<!doctype html><html lang="de"><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"><title>Manuelle Verbindung</title><link rel="stylesheet" href="/style.css"><body><div id="root"></div><script src="/harness.js"></script>`
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
    assertUsable(viewport.name, idle)
    await opened.page.keyboard.press('Tab')
    const focus = await opened.page.evaluate(() => {
      const el = document.activeElement
      const rect = el.getBoundingClientRect()
      return {
        tag: el.tagName,
        label: (el.closest('label')?.innerText ?? '').split('\n')[0].trim(),
        visible: rect.width > 0 && rect.top >= 0 && rect.bottom <= window.innerHeight + 1 && rect.right <= window.innerWidth + 1,
      }
    })
    assert.equal(focus.tag, 'SELECT', `${viewport.name}: first tab target`)
    assert.equal(focus.label, 'Art', `${viewport.name}: first label`)
    assert.equal(focus.visible, true, `${viewport.name}: focused control visible`)
    await fillDraft(opened.page)
    await submitOnce(opened.page, 'success')
    const pending = await resistEdits(opened.page)
    assert.equal(pending.valuesSame, true, `${viewport.name}: pending edits changed values ${JSON.stringify(pending.during)}`)
    assert.equal(pending.controlsDisabled, true, `${viewport.name}: a submitted control stayed editable`)
    assert.equal(pending.buttonDisabled, true, `${viewport.name}: submit stayed enabled`)
    assert.equal(pending.focusedAny, false, `${viewport.name}: keyboard entered a pending control`)
    const duplicates = await duplicateWhilePending(opened.page)
    assert.equal(duplicates.after, duplicates.before, `${viewport.name}: duplicate submit during pending`)
    const busy = await section(opened.page).locator('form').getAttribute('aria-busy')
    assert.equal(busy, 'true')
    const shot = join(SCREENS, `${viewport.name}-pending.png`)
    await section(opened.page).screenshot({ path: shot })
    const calls = await opened.page.evaluate(() => window.fixture.calls)
    assert.equal(calls.length, 1)
    assert.equal(calls[0].epoch, 1)
    assert.deepEqual(calls[0].eingabe, expectedPayload())
    await opened.page.evaluate(() => window.fixture.release())
    await section(opened.page).getByRole('status').waitFor()
    const form = section(opened.page).locator('form')
    const after = await fields(form)
    assert.equal(await form.getByLabel('Verbindungsnummer, falls bekannt').inputValue(), '')
    assert.equal(await form.getByLabel('Notiz').inputValue(), '')
    assert.equal(await form.getByLabel('Art').inputValue(), 'bus')
    assert.equal(await form.getByLabel('Tag').inputValue(), 'day-2')
    assert.equal(await form.getByLabel('Von').inputValue(), 'Zürich HB')
    assert.equal(await form.getByLabel('Nach').inputValue(), 'Bern')
    assert.equal(await form.getByLabel('Uhrzeit').nth(0).inputValue(), '09:15')
    assert.equal(await form.getByLabel('Uhrzeit').nth(1).inputValue(), '10:45')
    assert.equal(after.every((field) => field.disabled === false), true)
    assert.equal(await section(opened.page).getByRole('status').innerText(), SUCCESS)
    assert.equal(await section(opened.page).getByRole('alert').count(), 0)
    assert.equal(await section(opened.page).locator('form').getAttribute('aria-busy'), 'false')
    const settled = await layout(opened.page)
    assertUsable(`${viewport.name} settled`, settled)
    evidence.blockedRequests.push(...opened.blocked)
    evidence.pageErrors.push(...opened.errors)
    evidence.scenarios.push({
      viewport: viewport.name,
      width: viewport.width,
      height: viewport.height,
      kind: 'pending-success',
      status: 'PASS',
      calls: calls.length,
      pendingLocked: pending.valuesSame && pending.controlsDisabled && !pending.focusedAny,
      duplicateCalls: duplicates.after,
    })
    await opened.context.close()
  }

  const extra = await openContext(browser, VIEWPORTS[1], origin)
  await extra.page.evaluate(() => window.fixture.remount({
    mode: 'transfer',
    originName: 'ZRH',
    destinationName: 'BRN',
    originPlaceId: 'airport:ZRH',
    destinationPlaceId: 'airport:BRN',
    dayId: 'day-1',
    startsOn: null,
  }))
  const prefillForm = section(extra.page).locator('form')
  await prefillForm.getByLabel('Von').waitFor()
  assert.equal(await prefillForm.getByLabel('Art').inputValue(), 'transfer')
  assert.equal(await prefillForm.getByLabel('Von').inputValue(), 'ZRH')
  assert.equal(await prefillForm.getByLabel('Nach').inputValue(), 'BRN')
  assert.equal(await prefillForm.getByLabel('Tag').inputValue(), 'day-1')
  assert.equal(await prefillForm.getByLabel('Abfahrt', { exact: true }).inputValue(), '')
  await extra.page.evaluate(() => window.fixture.arm('success'))
  await section(extra.page).getByRole('button', { name: 'Verbindung speichern' }).click()
  await extra.page.waitForFunction(() => window.fixture.calls.length === 1)
  const prefillCall = await extra.page.evaluate(() => window.fixture.calls[0].eingabe)
  assert.equal(prefillCall.originPlaceId, 'airport:ZRH')
  assert.equal(prefillCall.destinationPlaceId, 'airport:BRN')
  assert.equal(prefillCall.startsOn, null)
  assert.equal(prefillCall.mode, 'transfer')
  await extra.page.evaluate(() => window.fixture.release())
  await section(extra.page).getByRole('status').waitFor()

  await extra.page.evaluate((vorgabe) => {
    window.fixture.reset()
    window.fixture.remount(vorgabe)
  }, await extra.page.evaluate(() => window.fixture.mainVorgabe))
  await section(extra.page).getByLabel('Von').waitFor()
  await fillDraft(extra.page, { destination: 'Thun' })
  await submitOnce(extra.page, 'error-string')
  const errorLock = await resistEdits(extra.page)
  assert.equal(errorLock.valuesSame, true)
  assert.equal(errorLock.controlsDisabled, true)
  await extra.page.evaluate(() => window.fixture.release())
  await section(extra.page).getByRole('alert').waitFor()
  assert.equal(await section(extra.page).getByRole('alert').innerText(), RETURNED)
  assert.equal(await section(extra.page).getByRole('status').count(), 0)
  const keptForm = section(extra.page).locator('form')
  const kept = await fields(keptForm)
  assert.equal(await keptForm.getByLabel('Notiz').inputValue(), 'Fensterplatz')
  assert.equal(await keptForm.getByLabel('Verbindungsnummer, falls bekannt').inputValue(), 'IC 816')
  assert.equal(await keptForm.getByLabel('Nach').inputValue(), 'Thun')
  assert.equal(kept.every((field) => field.disabled === false), true)
  await section(extra.page).getByLabel('Notiz').fill('Korrigiert')
  await extra.page.evaluate(() => window.fixture.arm('success'))
  await section(extra.page).getByRole('button', { name: 'Verbindung speichern' }).click()
  await extra.page.waitForFunction(() => window.fixture.calls.length === 2)
  const retry = await extra.page.evaluate(() => window.fixture.calls[1].eingabe)
  assert.equal(retry.note, 'Korrigiert')
  assert.equal(retry.destinationName, 'Thun')
  assert.equal(retry.destinationPlaceId, null)
  assert.equal(retry.originPlaceId, 'station:8503000')
  await extra.page.evaluate(() => window.fixture.release())
  await section(extra.page).getByRole('status').waitFor()
  assert.equal(await section(extra.page).getByLabel('Notiz').inputValue(), '')
  await section(extra.page).screenshot({ path: join(SCREENS, 'narrow-390-error-then-retry.png') })

  await extra.page.evaluate((vorgabe) => {
    window.fixture.reset()
    window.fixture.remount(vorgabe)
  }, await extra.page.evaluate(() => window.fixture.mainVorgabe))
  await section(extra.page).getByLabel('Von').waitFor()
  await fillDraft(extra.page)
  await submitOnce(extra.page, 'reject')
  await extra.page.evaluate(() => window.fixture.release())
  await section(extra.page).getByRole('alert').waitFor()
  assert.equal(await section(extra.page).getByRole('alert').innerText(), THROWN)
  assert.equal(await section(extra.page).getByRole('status').count(), 0)
  assert.equal(await section(extra.page).getByLabel('Notiz').inputValue(), 'Fensterplatz')
  assert.equal(await section(extra.page).getByLabel('Verbindungsnummer, falls bekannt').inputValue(), 'IC 816')
  assert.equal(await section(extra.page).locator('form').getAttribute('aria-busy'), 'false')

  await extra.page.evaluate((vorgabe) => {
    window.fixture.reset()
    window.fixture.remount(vorgabe)
  }, await extra.page.evaluate(() => window.fixture.mainVorgabe))
  await section(extra.page).getByLabel('Von').waitFor()
  await fillDraft(extra.page)
  await submitOnce(extra.page, 'success')
  const pendingEpoch = await extra.page.evaluate(() => window.fixture.calls[0].epoch)
  await extra.page.evaluate(() => window.fixture.unmount())
  assert.equal(await section(extra.page).count(), 0)
  await extra.page.evaluate((vorgabe) => window.fixture.remount(vorgabe), await extra.page.evaluate(() => window.fixture.mainVorgabe))
  await section(extra.page).getByLabel('Notiz').fill('Neu nach Remount')
  await extra.page.evaluate(() => window.fixture.release())
  await extra.page.waitForFunction(() => window.fixture.held === false)
  assert.equal(await section(extra.page).getByLabel('Notiz').inputValue(), 'Neu nach Remount')
  assert.equal(await section(extra.page).getByRole('status').count(), 0)
  assert.equal(await section(extra.page).getByRole('alert').count(), 0)
  const afterLate = await extra.page.evaluate(() => window.fixture.calls.map((call) => call.epoch))
  assert.deepEqual(afterLate, [pendingEpoch])

  await extra.page.evaluate((vorgabe) => {
    window.fixture.reset()
    window.fixture.remount(vorgabe)
  }, await extra.page.evaluate(() => window.fixture.mainVorgabe))
  await section(extra.page).getByLabel('Von').waitFor()
  await fillDraft(extra.page)
  await extra.page.evaluate(() => window.fixture.arm('success'))
  await extra.page.evaluate(() => {
    const form = document.querySelector('[aria-label="Manuelle Verbindung"] form')
    form.requestSubmit()
    form.requestSubmit()
  })
  await extra.page.waitForFunction(() => window.fixture.held === true)
  const duplicateBeforePaint = await extra.page.evaluate(() => window.fixture.calls.length)
  assert.equal(duplicateBeforePaint, 1)
  await extra.page.evaluate(() => window.fixture.release())
  await section(extra.page).getByRole('status').waitFor()

  evidence.blockedRequests.push(...extra.blocked)
  evidence.pageErrors.push(...extra.errors)
  assert.deepEqual(evidence.pageErrors, [])
  assert.deepEqual(evidence.blockedRequests, [])
  evidence.scenarios.push({
    viewport: 'narrow-390',
    width: 390,
    height: 844,
    kind: 'prefill-error-retry-reject-unmount-duplicate',
    status: 'PASS',
    duplicateBeforePaint,
  })
  evidence.status = 'PASS'
  await extra.context.close()
} catch (error) {
  if (evidence.status !== 'NOT RUN/BLOCKED') evidence.status = 'FAIL'
  evidence.failure = error && error.stack ? error.stack : String(error)
  console.error(evidence.failure)
} finally {
  writeFileSync(join(EVIDENCE, 'result.json'), `${JSON.stringify(evidence, null, 2)}\n`)
  if (browser) await browser.close()
  if (server) await new Promise((resolve) => server.close(resolve))
  if (evidence.status !== 'PASS') process.exitCode = 1
}
