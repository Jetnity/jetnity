#!/usr/bin/env node
// Actual rendered SecurityWidget harness for Admin Security Blocklist Bound Honesty 1.
// Fetch is a synthetic fixture. This is not a signed-in Admin session, not a
// physical device, and not Production acceptance. The harness never POSTs.

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
const EVIDENCE = join(REPO, 'docs/evidence/admin-security-blocklist-bound-honesty-1')
const ARTIFACTS = '/opt/cursor/artifacts'
const OUT = join('/tmp', 'admin-security-blocklist-bound-honesty-1-harness')
const BASELINE = process.argv.includes('--baseline')

const BLOCK_BOUND =
  'Es werden höchstens 200 Blocklisteneinträge gezeigt. Die Liste und die Kachel Gesperrte IPs zählen nur diese gelesenen Zeilen und können unvollständig sein.'
const EVENT_BOUND =
  'Es werden höchstens 200 aufgezeichnete Zeilen gezeigt. Tabelle und 24h-Kennzahlen zählen nur diese Zeilen und können unvollständig sein.'
const PERIOD = 'Keine aufgezeichneten Events in diesem Zeitraum.'
const FILTER = 'Keine aufgezeichneten Events passen zu diesem Filter.'
const COVERAGE = 'Fehlende Ingestion heisst: die Abdeckung ist unvollständig.'
const IP_HINWEIS = 'Die IP-Blockliste wird derzeit nicht enforced.'
const TITLE = 'Blockliste (nicht enforced)'
const EMPTY = 'Keine Einträge.'
const FAILURE = 'Diese Ansicht konnte nicht geladen werden.'
const UNAVAILABLE = 'Nicht ermittelbar.'

mkdirSync(OUT, { recursive: true })
mkdirSync(EVIDENCE, { recursive: true })
try {
  mkdirSync(ARTIFACTS, { recursive: true })
} catch {
  // Artifact storage can be unavailable. The repository JSON remains the record.
}

function schreibeArtefakt(name, inhalt) {
  try {
    writeFileSync(join(ARTIFACTS, name), inhalt)
  } catch (error) {
    console.error(`artifact write skipped: ${name}: ${error}`)
  }
}

const ergebnisse = []

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
  <title>Admin security blocklist bound honesty harness</title>
  <style>${css}</style>
</head>
<body>
  <div id="root"></div>
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

async function oeffnen(browser, origin, scenario, viewport) {
  const page = await browser.newPage({ viewport })
  const consoleErrors = []
  const pageErrors = []
  page.on('console', (msg) => {
    if (msg.type() === 'error') consoleErrors.push(msg.text())
  })
  page.on('pageerror', (error) => pageErrors.push(String(error)))
  await page.goto(`${origin}/?scenario=${scenario}`, { waitUntil: 'domcontentloaded' })
  await page.waitForFunction(() => window.__securityBlocklist?.ready === true)
  return { page, consoleErrors, pageErrors }
}

async function lesen(page) {
  return page.evaluate(() => {
    function abschnitt(titel, genau) {
      const heading = [...document.querySelectorAll('h2')].find((node) => {
        const text = (node.textContent || '').trim()
        return genau ? text === titel : text.includes(titel)
      })
      const section = heading ? heading.closest('section') : null
      const header = section?.querySelector(':scope > div') ?? null
      const zaehler =
        [...(header?.querySelectorAll('span') ?? [])]
          .map((node) => node.textContent?.trim() ?? '')
          .find((text) => text === '—' || text.endsWith('Einträge')) ?? null
      const bound = section?.querySelector('[data-security-read-bound]')?.textContent?.trim() ?? null
      const boundArt = section?.querySelector('[data-security-read-bound]')?.getAttribute('data-security-read-bound') ?? null
      const zeilen = section
        ? [...section.querySelectorAll('tbody tr')].filter((row) => !row.querySelector('td[colspan]')).length
        : 0
      const leer = section?.querySelector('tbody td[colspan]')?.textContent?.trim() ?? null
      const entfernen = section
        ? [...section.querySelectorAll('button')].filter((button) => (button.textContent || '').includes('Entfernen')).length
        : 0
      return { zaehler, bound, boundArt, zeilen, leer, entfernen, text: section?.innerText ?? '' }
    }

    const gesperrt = [...document.querySelectorAll('span')].find(
      (node) => (node.textContent || '').trim() === 'Gesperrte IPs',
    )
    const gesperrtKarte = gesperrt?.closest('div')?.parentElement
    const schreiben = [...document.querySelectorAll('button')].some((button) =>
      (button.textContent || '').includes('In Blockliste schreiben'),
    )
    return {
      scenario: window.__securityBlocklist.scenario,
      blocklist: abschnitt('Blockliste (nicht enforced)', true),
      events: abschnitt('Aufgezeichnete Security-Events', false),
      gesperrteIps: gesperrtKarte?.querySelector('.text-2xl')?.textContent?.trim() ?? null,
      schreiben,
      seite: document.body.innerText,
      calls: window.__securityBlocklist.calls(),
    }
  })
}

async function shot(page, name, fullPage) {
  try {
    await page.screenshot({ path: join(ARTIFACTS, name), fullPage })
  } catch (error) {
    console.error(`artifact screenshot skipped: ${name}: ${error}`)
  }
}

async function shotAbschnitt(page, titel, name) {
  try {
    const heading = page.getByRole('heading', { name: titel, exact: true })
    const kopf = heading.locator('xpath=ancestor::div[contains(@class,"border-b")][1]')
    await heading.scrollIntoViewIfNeeded()
    await kopf.screenshot({ path: join(ARTIFACTS, name) })
  } catch (error) {
    console.error(`artifact section screenshot skipped: ${name}: ${error}`)
  }
}

function merke(name, wert) {
  ergebnisse.push({ name, ...wert })
}

function keineSchreibzugriffe(stand, name) {
  assert.ok(stand.calls.length >= 1, `${name} list read`)
  for (const call of stand.calls) {
    assert.equal(call.method, 'GET', `${name} method ${call.method}`)
    assert.equal(call.url.includes('/api/admin/security/list'), true, `${name} url ${call.url}`)
    assert.equal(call.url.includes('/block'), false, `${name} block url`)
    assert.equal(call.url.includes('/unblock'), false, `${name} unblock url`)
  }
}

function gemeinsameWahrheit(stand, name) {
  assert.equal(stand.seite.includes(COVERAGE), true, `${name} coverage`)
  assert.equal(stand.seite.includes(IP_HINWEIS), true, `${name} ip hint`)
  assert.equal(stand.seite.includes(TITLE), true, `${name} title`)
  assert.equal(stand.schreiben, true, `${name} block button`)
}

async function fall(browser, origin, name, scenario, viewport, fn) {
  const geoeffnet = await oeffnen(browser, origin, scenario, viewport)
  try {
    const wert = await fn(geoeffnet.page)
    assert.deepEqual(geoeffnet.pageErrors, [], `${name} pageerror`)
    const stand = await lesen(geoeffnet.page)
    keineSchreibzugriffe(stand, name)
    gemeinsameWahrheit(stand, name)
    merke(name, {
      ok: true,
      ...wert,
      consoleErrors: geoeffnet.consoleErrors,
      calls: stand.calls.length,
    })
  } finally {
    await geoeffnet.page.close()
  }
}

async function basis(browser, origin) {
  const { page, consoleErrors, pageErrors } = await oeffnen(browser, origin, 'baseline200', {
    width: 1280,
    height: 900,
  })
  await page.getByText('200 Einträge').waitFor()
  await page.getByText('203.0.113.200', { exact: true }).waitFor()
  const stand = await lesen(page)
  await shot(page, 'admin-security-blocklist-before-200.png', false)
  const report = {
    mode: 'baseline-actual-SecurityWidget',
    synthetic: true,
    postInHarness: false,
    blocklist: {
      zeilen: stand.blocklist.zeilen,
      zaehler: stand.blocklist.zaehler,
      bound: stand.blocklist.bound,
      leer: stand.blocklist.leer,
      entfernen: stand.blocklist.entfernen,
    },
    events: {
      zeilen: stand.events.zeilen,
      zaehler: stand.events.zaehler,
      bound: stand.events.bound,
    },
    gesperrteIps: stand.gesperrteIps,
    title: stand.seite.includes(TITLE),
    coverage: stand.seite.includes(COVERAGE),
    ipHinweis: stand.seite.includes(IP_HINWEIS),
    blockBoundText: stand.seite.includes(BLOCK_BOUND),
    eventBoundText: stand.seite.includes(EVENT_BOUND),
    calls: stand.calls,
    consoleErrors,
    pageErrors,
    defectReproduced:
      stand.blocklist.zeilen === 200 &&
      stand.blocklist.zaehler === '200 Einträge' &&
      stand.gesperrteIps === '200' &&
      stand.blocklist.bound === null &&
      stand.seite.includes(BLOCK_BOUND) === false &&
      stand.events.zeilen === 0 &&
      stand.events.bound === null &&
      stand.seite.includes(EVENT_BOUND) === false &&
      stand.seite.includes(TITLE) &&
      stand.calls.every((call) => call.method === 'GET' && call.url.includes('/api/admin/security/list')),
  }
  writeFileSync(join(EVIDENCE, 'before.json'), `${JSON.stringify(report, null, 2)}\n`)
  schreibeArtefakt('admin-security-blocklist-before.json', `${JSON.stringify(report, null, 2)}\n`)
  await page.close()
  if (!report.defectReproduced) {
    console.error(JSON.stringify(report, null, 2))
    throw new Error('STOP: 200-row blocklist without a bound notice was not reproduced on the actual SecurityWidget')
  }
  console.log(
    JSON.stringify(
      {
        defectReproduced: true,
        zaehler: report.blocklist.zaehler,
        blockBound: report.blocklist.bound,
      },
      null,
      2,
    ),
  )
}

async function gruen(browser, origin) {
  const desktop = { width: 1280, height: 900 }
  const mobile = { width: 390, height: 844 }

  await fall(browser, origin, 'empty', 'empty', desktop, async (page) => {
    await page.getByRole('heading', { name: TITLE }).waitFor()
    await page.getByText(PERIOD).waitFor()
    const stand = await lesen(page)
    assert.equal(stand.blocklist.zeilen, 0)
    assert.equal(stand.blocklist.zaehler, '0 Einträge')
    assert.equal(stand.blocklist.leer, EMPTY)
    assert.equal(stand.blocklist.bound, null)
    assert.equal(stand.events.bound, null)
    assert.equal(stand.seite.includes(BLOCK_BOUND), false)
    assert.equal(stand.seite.includes(EVENT_BOUND), false)
    assert.equal(stand.gesperrteIps, '0')
    await shot(page, 'admin-security-blocklist-after-empty.png', true)
    return { blocklist: stand.blocklist.zaehler, bound: false }
  })

  await fall(browser, origin, 'rows-199', 'rows199', desktop, async (page) => {
    await page.getByText('199 Einträge').waitFor()
    await page.getByText('203.0.113.199', { exact: true }).waitFor()
    const stand = await lesen(page)
    assert.equal(stand.blocklist.zeilen, 199)
    assert.equal(stand.blocklist.zaehler, '199 Einträge')
    assert.equal(stand.blocklist.leer, null)
    assert.equal(stand.blocklist.bound, null)
    assert.equal(stand.blocklist.entfernen, 199)
    assert.equal(stand.events.bound, null)
    assert.equal(stand.seite.includes(BLOCK_BOUND), false)
    assert.equal(stand.seite.includes(EVENT_BOUND), false)
    assert.equal(stand.gesperrteIps, '199')
    await shotAbschnitt(page, TITLE, 'admin-security-blocklist-after-199.png')
    return { blocklist: stand.blocklist.zaehler, bound: false }
  })

  await fall(browser, origin, 'rows-200', 'rows200', desktop, async (page) => {
    await page.getByText(BLOCK_BOUND).waitFor()
    const stand = await lesen(page)
    assert.equal(stand.blocklist.zeilen, 200)
    assert.equal(stand.blocklist.zaehler, '200 Einträge')
    assert.equal(stand.blocklist.bound, BLOCK_BOUND)
    assert.equal(stand.blocklist.boundArt, 'blocklist')
    assert.equal(stand.blocklist.leer, null)
    assert.equal(stand.blocklist.entfernen, 200)
    assert.equal(stand.events.zeilen, 0)
    assert.equal(stand.events.bound, null)
    assert.equal(stand.events.zaehler, '0 Einträge')
    assert.equal(stand.seite.includes(EVENT_BOUND), false)
    assert.equal(stand.gesperrteIps, '200')
    assert.equal(stand.seite.includes('abgeschnitten'), false)
    await shotAbschnitt(page, TITLE, 'admin-security-blocklist-after-200.png')
    return { blocklist: stand.blocklist.zaehler, bound: true, eventsBound: false }
  })

  await fall(browser, origin, 'events-200-blocklist-0', 'events200', desktop, async (page) => {
    await page.getByText(EVENT_BOUND).waitFor()
    const stand = await lesen(page)
    assert.equal(stand.events.zeilen, 200)
    assert.equal(stand.events.zaehler, '200 Einträge')
    assert.equal(stand.events.bound, EVENT_BOUND)
    assert.equal(stand.events.boundArt, 'events')
    assert.equal(stand.blocklist.zeilen, 0)
    assert.equal(stand.blocklist.zaehler, '0 Einträge')
    assert.equal(stand.blocklist.leer, EMPTY)
    assert.equal(stand.blocklist.bound, null)
    assert.equal(stand.seite.includes(BLOCK_BOUND), false)
    assert.equal(stand.gesperrteIps, '0')
    await shotAbschnitt(page, 'Aufgezeichnete Security-Events (7 Tage)', 'admin-security-blocklist-after-events-200.png')
    await shotAbschnitt(page, TITLE, 'admin-security-blocklist-after-events-200-blocklist.png')
    return { eventsBound: true, blocklistBound: false }
  })

  await fall(browser, origin, 'events-200-blocklist-199', 'events200blocks199', desktop, async (page) => {
    await page.getByText(EVENT_BOUND).waitFor()
    const stand = await lesen(page)
    assert.equal(stand.events.bound, EVENT_BOUND)
    assert.equal(stand.events.boundArt, 'events')
    assert.equal(stand.blocklist.zeilen, 199)
    assert.equal(stand.blocklist.zaehler, '199 Einträge')
    assert.equal(stand.blocklist.bound, null)
    assert.equal(stand.seite.includes(BLOCK_BOUND), false)
    return { eventsBound: true, blocklistBound: false }
  })

  await fall(browser, origin, 'both-200', 'both200', desktop, async (page) => {
    await page.getByText(BLOCK_BOUND).waitFor()
    await page.getByText(EVENT_BOUND).waitFor()
    const stand = await lesen(page)
    assert.equal(stand.blocklist.bound, BLOCK_BOUND)
    assert.equal(stand.blocklist.boundArt, 'blocklist')
    assert.equal(stand.blocklist.zaehler, '200 Einträge')
    assert.equal(stand.events.bound, EVENT_BOUND)
    assert.equal(stand.events.boundArt, 'events')
    assert.equal(stand.events.zaehler, '200 Einträge')
    await shotAbschnitt(page, TITLE, 'admin-security-blocklist-after-both-200-blocklist.png')
    await shotAbschnitt(page, 'Aufgezeichnete Security-Events (7 Tage)', 'admin-security-blocklist-after-both-200-events.png')
    return { blocklistBound: true, eventsBound: true }
  })

  await fall(browser, origin, 'filter-keeps-blocklist-bound', 'filterOnBound', desktop, async (page) => {
    await page.getByText(BLOCK_BOUND).waitFor()
    await page.getByText('203.0.113.1', { exact: true }).first().waitFor()
    const feld = page.getByPlaceholder('Suche in Events/IPs…')
    await feld.fill('zz-kein-treffer')
    await feld.dispatchEvent('input')
    await page.getByText(FILTER).waitFor()
    const stand = await lesen(page)
    assert.equal(stand.events.leer, FILTER)
    assert.equal(stand.seite.includes(PERIOD), false)
    assert.equal(stand.events.bound, null)
    assert.equal(stand.events.zeilen, 0)
    assert.equal(stand.blocklist.zeilen, 200)
    assert.equal(stand.blocklist.zaehler, '200 Einträge')
    assert.equal(stand.blocklist.bound, BLOCK_BOUND)
    assert.equal(stand.gesperrteIps, '200')
    return { filter: FILTER, blocklistBound: true }
  })

  await fall(browser, origin, 'failed-read', 'failed', desktop, async (page) => {
    await page.getByText(FAILURE).waitFor()
    await page.getByText(UNAVAILABLE).first().waitFor()
    const stand = await lesen(page)
    assert.equal(stand.blocklist.bound, null)
    assert.equal(stand.events.bound, null)
    assert.equal(stand.seite.includes(BLOCK_BOUND), false)
    assert.equal(stand.seite.includes(EVENT_BOUND), false)
    assert.equal(stand.seite.includes(EMPTY), false)
    assert.equal(stand.seite.includes(PERIOD), false)
    assert.equal(stand.blocklist.zaehler, '—')
    assert.equal(stand.gesperrteIps, '—')
    assert.equal(stand.blocklist.zeilen, 0)
    return { zaehler: stand.blocklist.zaehler }
  })

  await fall(browser, origin, 'rows-200-mobile', 'rows200', mobile, async (page) => {
    await page.getByText(BLOCK_BOUND).waitFor()
    const stand = await lesen(page)
    assert.equal(stand.blocklist.bound, BLOCK_BOUND)
    assert.equal(stand.blocklist.zaehler, '200 Einträge')
    assert.equal(stand.events.bound, null)
    assert.equal(stand.seite.includes(TITLE), true)
    await shotAbschnitt(page, TITLE, 'admin-security-blocklist-after-200-mobile.png')
    return { blocklistBound: true }
  })
}

const css = await compileCss()
const script = await bundleHarness()
const { server, origin } = await serve(css, script)
const browser = await chromium.launch({ args: ['--no-sandbox', '--disable-dev-shm-usage'] })
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
    postInHarness: false,
    faelle: ergebnisse,
  }
  writeFileSync(join(EVIDENCE, 'after.json'), `${JSON.stringify(report, null, 2)}\n`)
  schreibeArtefakt('admin-security-blocklist-after.json', `${JSON.stringify(report, null, 2)}\n`)
  console.log(JSON.stringify({ ok: true, faelle: ergebnisse.map((eintrag) => eintrag.name) }, null, 2))
}
