#!/usr/bin/env node
// Actual SecurityWidget harness for Admin Security Refresh Ordering 1.
// Fetch timing is synthetic. This is not a signed-in Admin session, not a
// physical device, and not Production acceptance.
//
// --baseline reproduces the stale overwrite on the unguarded widget:
// start A, start B from the real 15s poll, resolve B, then resolve A.

import assert from 'node:assert/strict'
import { createRequire } from 'node:module'
import { createServer } from 'node:http'
import { mkdirSync, readFileSync, writeFileSync } from 'node:fs'
import { dirname, join } from 'node:path'
import { fileURLToPath } from 'node:url'

import esbuild from 'esbuild'
import { chromium } from 'playwright'

const require = createRequire(import.meta.url)
const REPO = join(dirname(fileURLToPath(import.meta.url)), '..')
const EVIDENCE = join(REPO, 'docs/evidence/admin-security-refresh-ordering-1')
const ARTIFACTS = '/opt/cursor/artifacts'
const OUT = join('/tmp', 'admin-security-refresh-ordering-1-harness')
const WIDGET = join(REPO, 'components/admin/security/SecurityWidget.tsx')
const BASELINE = process.argv.includes('--baseline')
const FROZEN = new Date('2026-09-28T12:00:00.000Z')
const NOW = FROZEN.toISOString()

const PERIOD = 'Keine aufgezeichneten Events in diesem Zeitraum.'
const FILTER = 'Keine aufgezeichneten Events passen zu diesem Filter.'
const EVENT_BOUND =
  'Es werden höchstens 200 aufgezeichnete Zeilen gezeigt. Tabelle und 24h-Kennzahlen zählen nur diese Zeilen und können unvollständig sein.'
const BLOCK_BOUND =
  'Es werden höchstens 200 Blocklisteneinträge gezeigt. Die Liste und die Kachel Gesperrte IPs zählen nur diese gelesenen Zeilen und können unvollständig sein.'
const LOAD_FAILED = 'Diese Ansicht konnte nicht geladen werden.'
const UPDATE_FAILED = 'Die Aktualisierung ist fehlgeschlagen.'
const STALE_DATA = 'Die angezeigten Daten sind älter.'
const UNAVAILABLE = 'Nicht ermittelbar.'

mkdirSync(OUT, { recursive: true })
mkdirSync(EVIDENCE, { recursive: true })
try {
  mkdirSync(ARTIFACTS, { recursive: true })
} catch {
  // Artifact storage can be unavailable. The repository JSON remains the record.
}

const ergebnisse = []

function pause(ms) {
  return new Promise((resolve) => setTimeout(resolve, ms))
}

function quelleHatGuard() {
  return readFileSync(WIDGET, 'utf8').includes('refreshIstAutoritaer')
}

function eventRow(id, ip, detail, type = 'note') {
  return {
    id,
    created_at: NOW,
    ip,
    type,
    user_id: null,
    detail,
  }
}

function blockRow(ip) {
  return { ip, reason: `synthetic-block-${ip}`, created_at: NOW }
}

function events(count) {
  return Array.from({ length: count }, (_, index) => {
    const n = index + 1
    return eventRow(`synthetic-event-${n}`, `203.0.113.${n}`, `synthetic-bound-event-${n}`)
  })
}

function blocks(count) {
  return Array.from({ length: count }, (_, index) => blockRow(`203.0.113.${index + 1}`))
}

async function compileCss() {
  try {
    const postcss = (await import('postcss')).default
    const tailwindcss = (await import('tailwindcss')).default
    const nesting = (await import('tailwindcss/nesting/index.js')).default
    const autoprefixer = (await import('autoprefixer')).default
    const from = join(REPO, 'styles/globals.css')
    const input = readFileSync(from, 'utf8')
    const config = {
      ...require(join(REPO, 'tailwind.config.js')),
      content: [
        join(REPO, 'components/admin/security/SecurityWidget.tsx'),
        join(REPO, 'components/admin/Ladezustand.tsx'),
        join(REPO, 'components/ui/**/*.{js,ts,jsx,tsx}'),
        join(EVIDENCE, 'harness.tsx'),
      ],
    }
    const result = await postcss([nesting(), tailwindcss(config), autoprefixer()]).process(input, { from })
    return result.css
  } catch (error) {
    return `body{font-family:sans-serif;margin:0}[hidden]{display:none}/* css fallback: ${String(error)} */`
  }
}

async function bundleHarness() {
  const outfile = join(OUT, 'harness.js')
  await esbuild.build({
    absWorkingDir: REPO,
    entryPoints: [join(EVIDENCE, 'harness.tsx')],
    outfile,
    bundle: true,
    format: 'iife',
    platform: 'browser',
    jsx: 'automatic',
    sourcemap: false,
    logLevel: 'silent',
    alias: {
      '@': REPO,
      'server-only': join(EVIDENCE, 'server-only-stub.ts'),
    },
    define: {
      'process.env.NODE_ENV': '"development"',
    },
  })
  return readFileSync(outfile, 'utf8')
}

function htmlSeite(css, script) {
  return `<!doctype html>
<html lang="de">
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1">
  <title>Admin security refresh ordering harness</title>
  <style>${css}</style>
</head>
<body>
  <div id="root"></div>
  <script>
    window.__intervalMarks = []
    const nativeSetInterval = window.setInterval.bind(window)
    window.setInterval = (fn, ms, ...args) => {
      window.__intervalMarks.push({ ms })
      return nativeSetInterval(fn, ms, ...args)
    }
  </script>
  <script>${script}</script>
</body>
</html>`
}

function serve(css, script) {
  const server = createServer((req, res) => {
    res.writeHead(200, { 'Content-Type': 'text/html; charset=utf-8' })
    res.end(htmlSeite(css, script))
  })
  return new Promise((resolve) => {
    server.listen(0, '127.0.0.1', () => {
      const address = server.address()
      const port = typeof address === 'object' && address ? address.port : 0
      resolve({ server, origin: `http://127.0.0.1:${port}` })
    })
  })
}

function listCalls(calls) {
  return calls.filter((call) => call.method === 'GET' && call.url.includes('/api/admin/security/list'))
}

function postCalls(calls) {
  return calls.filter((call) => call.method === 'POST')
}

async function oeffnen(browser, viewport = { width: 1280, height: 900 }) {
  const page = await browser.newPage({ viewport })
  const consoleErrors = []
  const pageErrors = []
  page.on('console', (msg) => {
    if (msg.type() === 'error') consoleErrors.push(msg.text())
  })
  page.on('pageerror', (error) => pageErrors.push(String(error)))
  await page.clock.install({ time: FROZEN })
  return { page, consoleErrors, pageErrors }
}

async function starten(browser, origin, viewport) {
  const geoeffnet = await oeffnen(browser, viewport)
  await geoeffnet.page.goto(origin, { waitUntil: 'domcontentloaded' })
  await geoeffnet.page.waitForFunction(() => window.__securityRefresh?.ready === true)
  await geoeffnet.page.waitForFunction(
    () => window.__securityRefresh.pending().some((call) => call.method === 'GET'),
  )
  return geoeffnet
}

async function stand(page) {
  return page.evaluate(() => {
    const button = [...document.querySelectorAll('button')].find((node) =>
      (node.textContent || '').includes('Aktualisieren'),
    )
    const alert = document.querySelector('[role="alert"]')
    return {
      loading: Boolean(button?.disabled),
      spin: Boolean(button?.querySelector('svg.animate-spin')),
      alert: alert?.innerText?.replace(/\s+/g, ' ').trim() ?? null,
      eventsBound: document.querySelector('[data-security-read-bound="events"]')?.textContent?.trim() ?? null,
      blockBound: document.querySelector('[data-security-read-bound="blocklist"]')?.textContent?.trim() ?? null,
      eventLeer: document.querySelector('[data-security-events-leer]')?.textContent?.trim() ?? null,
      eventLeerArt: document.querySelector('[data-security-events-leer]')?.getAttribute('data-security-events-leer') ?? null,
      text: document.body.innerText,
      calls: window.__securityRefresh.calls(),
      pending: window.__securityRefresh.pending(),
      intervals: window.__securityRefresh.intervals(),
    }
  })
}

async function release(page, id, status, body) {
  await page.evaluate(
    ({ id, status, body }) => {
      window.__securityRefresh.release(id, status, body)
    },
    { id, status, body },
  )
}

async function warteText(page, text) {
  await page.getByText(text, { exact: false }).first().waitFor()
}

async function warteWeg(page, text) {
  await page.waitForFunction((value) => !document.body.innerText.includes(value), text)
}

async function zweiteLesung(page) {
  const vorher = listCalls((await stand(page)).calls).length
  await page.clock.fastForward(15000)
  await page.waitForFunction(
    (expected) =>
      window.__securityRefresh
        .pending()
        .filter((call) => call.method === 'GET' && call.url.includes('/api/admin/security/list')).length >= 1 &&
      window.__securityRefresh.calls().filter((call) => call.method === 'GET').length >= expected,
    vorher + 1,
  )
}

function keineSchreibzugriffe(calls, name) {
  assert.equal(postCalls(calls).length, 0, `${name} post`)
  for (const call of calls) {
    assert.equal(call.method, 'GET', `${name} method`)
    assert.equal(call.url.includes('/api/admin/security/list'), true, `${name} url`)
  }
}

function einIntervall(intervals, name) {
  assert.deepEqual(intervals, [15000], `${name} interval`)
}

async function shot(page, name) {
  const targets = [join(ARTIFACTS, name), join(EVIDENCE, name)]
  for (const target of targets) {
    try {
      await page.screenshot({ path: target, fullPage: false })
    } catch (error) {
      console.error(`screenshot skipped: ${target}: ${error}`)
    }
  }
}

function merke(name, wert) {
  ergebnisse.push({ name, ...wert })
}

async function fall(browser, origin, name, fn) {
  const geoeffnet = await starten(browser, origin)
  try {
    const wert = await fn(geoeffnet.page)
    assert.deepEqual(geoeffnet.pageErrors, [], `${name} pageerror`)
    merke(name, { ok: true, ...wert, consoleErrors: geoeffnet.consoleErrors })
  } finally {
    await geoeffnet.page.close()
  }
}

async function basis(browser, origin) {
  if (quelleHatGuard()) {
    throw new Error('STOP: --baseline must run before the ordering guard exists')
  }
  const { page, consoleErrors, pageErrors } = await starten(browser, origin)
  const anfang = await stand(page)
  assert.equal(listCalls(anfang.calls).length, 1)
  assert.equal(anfang.pending.length, 1)
  einIntervall(anfang.intervals, 'baseline start')
  const a = anfang.pending[0]
  await zweiteLesung(page)
  const ueberlappend = await stand(page)
  assert.equal(listCalls(ueberlappend.calls).length, 2)
  assert.equal(ueberlappend.pending.length, 2)
  assert.equal(ueberlappend.loading, true)
  const b = ueberlappend.pending.find((call) => call.id !== a.id)
  assert.ok(b)

  await release(page, b.id, 200, {
    events: [eventRow('synthetic-event-newer', '203.0.113.22', 'synthetic-newer-read', 'login_failed')],
    blocklist: [],
  })
  await warteText(page, 'synthetic-newer-read')
  const nachB = await stand(page)
  assert.equal(nachB.loading, false)
  assert.equal(nachB.text.includes('synthetic-older-read'), false)
  await shot(page, 'admin-security-refresh-before-newer.png')

  await release(page, a.id, 200, {
    events: [eventRow('synthetic-event-older', '203.0.113.11', 'synthetic-older-read')],
    blocklist: [],
  })
  await warteText(page, 'synthetic-older-read')
  await pause(300)
  const nachA = await stand(page)
  await shot(page, 'admin-security-refresh-before-overwritten.png')
  const report = {
    mode: 'baseline-actual-SecurityWidget',
    synthetic: true,
    signedInAdmin: false,
    physicalDevice: false,
    productionMutation: false,
    sourceHasGuard: false,
    sequence: 'start A, start B from the 15s poll, resolve B, resolve A',
    afterNewerResolved: {
      loading: nachB.loading,
      newerVisible: nachB.text.includes('synthetic-newer-read'),
      olderVisible: nachB.text.includes('synthetic-older-read'),
      alert: nachB.alert,
    },
    afterOlderResolved: {
      loading: nachA.loading,
      newerVisible: nachA.text.includes('synthetic-newer-read'),
      olderVisible: nachA.text.includes('synthetic-older-read'),
      alert: nachA.alert,
    },
    calls: nachA.calls.map(({ id, method, url }) => ({ id, method, url })),
    intervals: nachA.intervals,
    consoleErrors,
    pageErrors,
    defectReproduced:
      nachB.text.includes('synthetic-newer-read') &&
      nachA.text.includes('synthetic-older-read') &&
      nachA.text.includes('synthetic-newer-read') === false &&
      listCalls(nachA.calls).length === 2 &&
      postCalls(nachA.calls).length === 0 &&
      nachA.intervals.length === 1 &&
      nachA.intervals[0] === 15000,
  }
  writeFileSync(join(EVIDENCE, 'before.json'), `${JSON.stringify(report, null, 2)}\n`)
  try {
    writeFileSync(join(ARTIFACTS, 'admin-security-refresh-before.json'), `${JSON.stringify(report, null, 2)}\n`)
  } catch {
    // Artifact JSON is optional.
  }
  await page.close()
  if (!report.defectReproduced) {
    console.error(JSON.stringify(report, null, 2))
    throw new Error('STOP: stale response did not overwrite the newer SecurityWidget read')
  }
  console.log(
    JSON.stringify(
      {
        defectReproduced: true,
        afterOlder: report.afterOlderResolved,
        gets: listCalls(nachA.calls).length,
      },
      null,
      2,
    ),
  )
}

async function gruen(browser, origin) {
  assert.equal(quelleHatGuard(), true)

  await fall(browser, origin, 'success-success-inversion', async (page) => {
    const anfang = await stand(page)
    assert.equal(listCalls(anfang.calls).length, 1)
    assert.equal(anfang.loading, true)
    einIntervall(anfang.intervals, 'inversion')
    const a = anfang.pending[0]
    await zweiteLesung(page)
    const ueberlappend = await stand(page)
    assert.equal(listCalls(ueberlappend.calls).length, 2)
    assert.equal(ueberlappend.pending.length, 2)
    const b = ueberlappend.pending.find((call) => call.id !== a.id)
    await release(page, b.id, 200, {
      events: [eventRow('synthetic-event-newer', '203.0.113.22', 'synthetic-newer-read', 'login_failed')],
      blocklist: [],
    })
    await warteText(page, 'synthetic-newer-read')
    await release(page, a.id, 200, {
      events: [eventRow('synthetic-event-older', '203.0.113.11', 'synthetic-older-read')],
      blocklist: [],
    })
    await pause(300)
    const nachher = await stand(page)
    assert.equal(nachher.text.includes('synthetic-newer-read'), true)
    assert.equal(nachher.text.includes('synthetic-older-read'), false)
    assert.equal(nachher.alert, null)
    assert.equal(nachher.loading, false)
    keineSchreibzugriffe(nachher.calls, 'inversion')
    einIntervall(nachher.intervals, 'inversion after')
    assert.equal(listCalls(nachher.calls).length, 2)
    await shot(page, 'admin-security-refresh-after-newer-stays.png')
    await page.clock.fastForward(15000)
    await page.waitForFunction(
      () => window.__securityRefresh.pending().filter((call) => call.method === 'GET').length === 1,
    )
    await pause(300)
    const nachTakt = await stand(page)
    assert.equal(listCalls(nachTakt.calls).length, 3)
    assert.equal(nachTakt.pending.length, 1)
    assert.equal(nachTakt.text.includes('synthetic-newer-read'), true)
    assert.equal(nachTakt.text.includes('synthetic-older-read'), false)
    einIntervall(nachTakt.intervals, 'inversion poll')
    return { newerStays: true, getsBeforeExtraPoll: 2, getsAfterOneMorePoll: 3 }
  })

  await fall(browser, origin, 'newer-failure-keeps-older-success-out', async (page) => {
    const anfang = await stand(page)
    const a = anfang.pending[0]
    await zweiteLesung(page)
    const b = (await stand(page)).pending.find((call) => call.id !== a.id)
    await release(page, b.id, 500, { error: 'synthetic-newer-failure' })
    await warteText(page, 'synthetic-newer-failure')
    await warteText(page, LOAD_FAILED)
    const nachB = await stand(page)
    assert.equal(nachB.text.includes(UNAVAILABLE), true)
    assert.equal(nachB.text.includes('synthetic-older-read'), false)
    await release(page, a.id, 200, {
      events: [eventRow('synthetic-event-older', '203.0.113.11', 'synthetic-older-read', 'login_failed')],
      blocklist: [],
    })
    await pause(300)
    const nachA = await stand(page)
    assert.equal(nachA.text.includes('synthetic-newer-failure'), true)
    assert.equal(nachA.text.includes(LOAD_FAILED), true)
    assert.equal(nachA.text.includes('synthetic-older-read'), false)
    assert.equal(nachA.text.includes(UNAVAILABLE), true)
    assert.equal(nachA.loading, false)
    keineSchreibzugriffe(nachA.calls, 'newer failure')
    assert.equal(listCalls(nachA.calls).length, 2)
    await shot(page, 'admin-security-refresh-after-failure-stays.png')
    return { newerFailureStays: true }
  })

  await fall(browser, origin, 'newer-success-keeps-older-failure-out', async (page) => {
    const anfang = await stand(page)
    const a = anfang.pending[0]
    await zweiteLesung(page)
    const b = (await stand(page)).pending.find((call) => call.id !== a.id)
    await release(page, b.id, 200, {
      events: [eventRow('synthetic-event-newer', '203.0.113.22', 'synthetic-newer-read', 'login_failed')],
      blocklist: [],
    })
    await warteText(page, 'synthetic-newer-read')
    await release(page, a.id, 500, { error: 'synthetic-older-failure' })
    await pause(300)
    const nachA = await stand(page)
    assert.equal(nachA.text.includes('synthetic-newer-read'), true)
    assert.equal(nachA.text.includes('synthetic-older-failure'), false)
    assert.equal(nachA.alert, null)
    assert.equal(nachA.text.includes(UPDATE_FAILED), false)
    assert.equal(nachA.loading, false)
    keineSchreibzugriffe(nachA.calls, 'newer success')
    assert.equal(listCalls(nachA.calls).length, 2)
    await shot(page, 'admin-security-refresh-after-success-stays.png')
    return { newerSuccessStays: true }
  })

  await fall(browser, origin, 'stale-completion-does-not-clear-loading', async (page) => {
    const anfang = await stand(page)
    assert.equal(anfang.loading, true)
    assert.equal(anfang.spin, true)
    const a = anfang.pending[0]
    await zweiteLesung(page)
    const b = (await stand(page)).pending.find((call) => call.id !== a.id)
    await release(page, a.id, 200, {
      events: [eventRow('synthetic-event-older', '203.0.113.11', 'synthetic-older-read')],
      blocklist: [],
    })
    await pause(300)
    const waehrendB = await stand(page)
    assert.equal(waehrendB.loading, true)
    assert.equal(waehrendB.spin, true)
    assert.equal(waehrendB.text.includes('synthetic-older-read'), false)
    assert.equal(waehrendB.text.includes('Wird geladen'), true)
    await shot(page, 'admin-security-refresh-after-loading.png')
    await release(page, b.id, 200, {
      events: [eventRow('synthetic-event-newer', '203.0.113.22', 'synthetic-newer-read', 'login_failed')],
      blocklist: [],
    })
    await warteText(page, 'synthetic-newer-read')
    const nachB = await stand(page)
    assert.equal(nachB.loading, false)
    assert.equal(nachB.spin, false)
    assert.equal(nachB.text.includes('synthetic-older-read'), false)
    assert.equal(nachB.alert, null)
    keineSchreibzugriffe(nachB.calls, 'loading')
    assert.equal(listCalls(nachB.calls).length, 2)
    return { loadingFollowsNewest: true }
  })

  await fall(browser, origin, 'manual-refresh', async (page) => {
    const a = (await stand(page)).pending[0]
    await release(page, a.id, 200, {
      events: [eventRow('synthetic-event-first', '203.0.113.11', 'synthetic-first-read')],
      blocklist: [],
    })
    await warteText(page, 'synthetic-first-read')
    const bereit = await stand(page)
    assert.equal(bereit.loading, false)
    await page.getByRole('button', { name: 'Aktualisieren' }).click()
    await page.waitForFunction(() => window.__securityRefresh.pending().length === 1)
    const laufend = await stand(page)
    assert.equal(laufend.loading, true)
    assert.equal(listCalls(laufend.calls).length, 2)
    const b = laufend.pending[0]
    await release(page, b.id, 200, {
      events: [eventRow('synthetic-event-manual', '203.0.113.33', 'synthetic-manual-read', 'login_failed')],
      blocklist: [],
    })
    await warteText(page, 'synthetic-manual-read')
    await warteWeg(page, 'synthetic-first-read')
    await pause(300)
    const nachher = await stand(page)
    assert.equal(nachher.loading, false)
    assert.equal(listCalls(nachher.calls).length, 2)
    assert.equal(nachher.pending.length, 0)
    keineSchreibzugriffe(nachher.calls, 'manual')
    einIntervall(nachher.intervals, 'manual')
    return { manualUpdates: true, gets: 2 }
  })

  await fall(browser, origin, 'current-failure-keeps-prior-data', async (page) => {
    const a = (await stand(page)).pending[0]
    await release(page, a.id, 200, {
      events: [eventRow('synthetic-event-kept', '203.0.113.11', 'synthetic-kept-read', 'login_failed')],
      blocklist: [blockRow('203.0.113.11')],
    })
    await warteText(page, 'synthetic-kept-read')
    await page.getByRole('button', { name: 'Aktualisieren' }).click()
    await page.waitForFunction(() => window.__securityRefresh.pending().length === 1)
    const b = (await stand(page)).pending[0]
    await release(page, b.id, 500, { error: 'synthetic-current-failure' })
    await warteText(page, 'synthetic-current-failure')
    const nachher = await stand(page)
    assert.equal(nachher.text.includes('synthetic-kept-read'), true)
    assert.equal(nachher.text.includes('203.0.113.11'), true)
    assert.equal(nachher.text.includes(UPDATE_FAILED), true)
    assert.equal(nachher.text.includes(STALE_DATA), true)
    assert.equal(nachher.text.includes(LOAD_FAILED), false)
    assert.equal(nachher.text.includes('Keine Einträge.'), false)
    assert.equal(nachher.loading, false)
    keineSchreibzugriffe(nachher.calls, 'current failure')
    assert.equal(listCalls(nachher.calls).length, 2)
    return { priorDataKept: true }
  })

  await fall(browser, origin, 'filter-miss-stays-a-filter', async (page) => {
    const a = (await stand(page)).pending[0]
    await release(page, a.id, 200, {
      events: [eventRow('synthetic-event-filter', '203.0.113.7', 'synthetic-filter-row', 'login_failed')],
      blocklist: [],
    })
    await warteText(page, 'synthetic-filter-row')
    const feld = page.getByPlaceholder('Suche in Events/IPs…')
    await feld.fill('zz-kein-treffer')
    await warteText(page, FILTER)
    const nachher = await stand(page)
    assert.equal(nachher.eventLeer, FILTER)
    assert.equal(nachher.eventLeerArt, 'filter')
    assert.equal(nachher.text.includes(PERIOD), false)
    assert.equal(nachher.text.includes('1'), true)
    assert.equal(nachher.eventsBound, null)
    keineSchreibzugriffe(nachher.calls, 'filter')
    assert.equal(listCalls(nachher.calls).length, 1)
    return { filter: FILTER }
  })

  await fall(browser, origin, 'event-bound-200', async (page) => {
    const a = (await stand(page)).pending[0]
    await release(page, a.id, 200, { events: events(200), blocklist: [] })
    await warteText(page, EVENT_BOUND)
    const nachher = await stand(page)
    assert.equal(nachher.eventsBound, EVENT_BOUND)
    assert.equal(nachher.blockBound, null)
    assert.equal(nachher.text.includes(BLOCK_BOUND), false)
    assert.equal(nachher.text.includes('200 Einträge'), true)
    keineSchreibzugriffe(nachher.calls, 'event bound')
    return { eventsBound: true, blockBound: false }
  })

  await fall(browser, origin, 'blocklist-bound-200', async (page) => {
    const a = (await stand(page)).pending[0]
    await release(page, a.id, 200, { events: [], blocklist: blocks(200) })
    await warteText(page, BLOCK_BOUND)
    await warteText(page, PERIOD)
    const nachher = await stand(page)
    assert.equal(nachher.blockBound, BLOCK_BOUND)
    assert.equal(nachher.eventsBound, null)
    assert.equal(nachher.eventLeer, PERIOD)
    assert.equal(nachher.eventLeerArt, 'zeitraum')
    assert.equal(nachher.text.includes(EVENT_BOUND), false)
    assert.equal(nachher.text.includes('200 Einträge'), true)
    keineSchreibzugriffe(nachher.calls, 'blocklist bound')
    return { blockBound: true, eventsBound: false }
  })

  await fall(browser, origin, 'block-triggers-one-refresh', async (page) => {
    const a = (await stand(page)).pending[0]
    await release(page, a.id, 200, { events: [], blocklist: [] })
    await warteText(page, 'Keine Einträge.')
    await page.getByPlaceholder('z. B. 203.0.113.42').fill('203.0.113.42')
    await page.getByPlaceholder('Grund...').fill('synthetic-reason')
    await page.getByRole('button', { name: 'In Blockliste schreiben' }).click()
    await page.waitForFunction(() => window.__securityRefresh.pending().some((call) => call.method === 'POST'))
    const post = (await stand(page)).pending.find((call) => call.method === 'POST')
    assert.equal(post.url.includes('/api/admin/security/block'), true)
    assert.equal(post.body, JSON.stringify({ ip: '203.0.113.42', reason: 'synthetic-reason' }))
    await release(page, post.id, 200, { ok: true })
    await page.waitForFunction(
      () => window.__securityRefresh.pending().some((call) => call.method === 'GET'),
    )
    await pause(300)
    const laufend = await stand(page)
    assert.equal(listCalls(laufend.calls).length, 2)
    assert.equal(postCalls(laufend.calls).length, 1)
    assert.equal(laufend.pending.length, 1)
    const refreshCall = laufend.pending[0]
    await release(page, refreshCall.id, 200, {
      events: [],
      blocklist: [{ ip: '203.0.113.42', reason: 'synthetic-reason', created_at: NOW }],
    })
    await warteText(page, '203.0.113.42')
    await pause(300)
    const nachher = await stand(page)
    assert.equal(listCalls(nachher.calls).length, 2)
    assert.equal(postCalls(nachher.calls).length, 1)
    assert.equal(nachher.pending.length, 0)
    einIntervall(nachher.intervals, 'block')
    return { blockRefresh: true, body: post.body }
  })

  await fall(browser, origin, 'unblock-triggers-one-refresh', async (page) => {
    const a = (await stand(page)).pending[0]
    await release(page, a.id, 200, {
      events: [],
      blocklist: [blockRow('203.0.113.42')],
    })
    await warteText(page, '203.0.113.42')
    await page.getByRole('button', { name: 'Entfernen' }).click()
    await page.waitForFunction(() => window.__securityRefresh.pending().some((call) => call.method === 'POST'))
    const post = (await stand(page)).pending.find((call) => call.method === 'POST')
    assert.equal(post.url.includes('/api/admin/security/unblock'), true)
    assert.equal(post.body, JSON.stringify({ ip: '203.0.113.42' }))
    await release(page, post.id, 200, { ok: true })
    await page.waitForFunction(
      () => window.__securityRefresh.pending().some((call) => call.method === 'GET'),
    )
    await pause(300)
    const laufend = await stand(page)
    assert.equal(listCalls(laufend.calls).length, 2)
    assert.equal(postCalls(laufend.calls).length, 1)
    const refreshCall = laufend.pending.find((call) => call.method === 'GET')
    await release(page, refreshCall.id, 200, { events: [], blocklist: [] })
    await warteText(page, 'Keine Einträge.')
    await pause(300)
    const nachher = await stand(page)
    assert.equal(listCalls(nachher.calls).length, 2)
    assert.equal(postCalls(nachher.calls).length, 1)
    assert.equal(nachher.pending.length, 0)
    return { unblockRefresh: true, body: post.body }
  })
}

const css = await compileCss()
const script = await bundleHarness()
const { server, origin } = await serve(css, script)
const launchOptions = { headless: true, args: ['--no-sandbox', '--disable-dev-shm-usage'] }
const browser = await chromium
  .launch({
    ...launchOptions,
    executablePath: process.env.CHROME_PATH || '/usr/bin/google-chrome',
  })
  .catch(() => chromium.launch(launchOptions))

try {
  if (BASELINE) await basis(browser, origin)
  else await gruen(browser, origin)
} finally {
  await browser.close()
  await new Promise((resolve) => server.close(resolve))
}

if (!BASELINE) {
  const report = {
    mode: 'fixed-actual-SecurityWidget',
    synthetic: true,
    signedInAdmin: false,
    physicalDevice: false,
    productionMutation: false,
    sourceHasGuard: true,
    faelle: ergebnisse,
  }
  writeFileSync(join(EVIDENCE, 'after.json'), `${JSON.stringify(report, null, 2)}\n`)
  try {
    writeFileSync(join(ARTIFACTS, 'admin-security-refresh-after.json'), `${JSON.stringify(report, null, 2)}\n`)
  } catch {
    // Artifact JSON is optional.
  }
  console.log(JSON.stringify({ ok: true, faelle: ergebnisse.map((eintrag) => eintrag.name) }, null, 2))
}
