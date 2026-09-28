#!/usr/bin/env node
// Actual rendered SecurityWidget harness for Admin Security Filter Honesty 1.
// Fetch is a synthetic fixture. This is not a signed-in Admin session, not a
// physical device, and not Production acceptance.

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
const EVIDENCE = join(REPO, 'docs/evidence/admin-security-filter-honesty-1')
const ARTIFACTS = '/opt/cursor/artifacts'
const OUT = join('/tmp', 'admin-security-filter-honesty-1-harness')
const BASELINE = process.argv.includes('--baseline')

const PERIOD = 'Keine aufgezeichneten Events in diesem Zeitraum.'
const FILTER = 'Keine aufgezeichneten Events passen zu diesem Filter.'
const BOUND =
  'Es werden höchstens 200 aufgezeichnete Zeilen gezeigt. Tabelle und 24h-Kennzahlen zählen nur diese Zeilen und können unvollständig sein.'
const COVERAGE = 'Fehlende Ingestion heisst: die Abdeckung ist unvollständig.'
const IP_HINWEIS = 'Die IP-Blockliste wird derzeit nicht enforced.'
const FAILURE = 'Diese Ansicht konnte nicht geladen werden.'
const UNAVAILABLE = 'Nicht ermittelbar.'
const KPI = [
  'Aufgezeichnete Events (24h)',
  'Aufgezeichnete Login-Fehler (24h)',
  'Aufgezeichnete Auffälligkeiten (24h)',
]

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
  <title>Admin security filter honesty harness</title>
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
  await page.waitForFunction(() => window.__securityFilter?.ready === true)
  return { page, consoleErrors, pageErrors }
}

async function lesen(page) {
  return page.evaluate(() => {
    const heading = [...document.querySelectorAll('h2')].find((node) =>
      (node.textContent || '').includes('Aufgezeichnete Security-Events'),
    )
    const section = heading ? heading.closest('section') : null
    const leerZelle = section?.querySelector('tbody td[colspan="6"]')
    const karten = [...document.querySelectorAll('span')].filter((node) =>
      (node.textContent || '').startsWith('Aufgezeichnete'),
    )
    const kpi = {}
    for (const label of karten) {
      const karte = label.closest('div')?.parentElement
      const wert = karte?.querySelector('.text-2xl')?.textContent?.trim() ?? null
      kpi[label.textContent.trim()] = wert
    }
    const gesperrt = [...document.querySelectorAll('span')].find(
      (node) => (node.textContent || '').trim() === 'Gesperrte IPs',
    )
    const gesperrtKarte = gesperrt?.closest('div')?.parentElement
    kpi['Gesperrte IPs'] = gesperrtKarte?.querySelector('.text-2xl')?.textContent?.trim() ?? null
    const filterFeld = document.querySelector('input[placeholder="Suche in Events/IPs…"]')
    return {
      scenario: window.__securityFilter.scenario,
      filter: filterFeld instanceof HTMLInputElement ? filterFeld.value : null,
      leer: leerZelle?.textContent?.trim() ?? null,
      zeilen: section
        ? [...section.querySelectorAll('tbody tr')].filter((row) => !row.querySelector('td[colspan]')).length
        : 0,
      zaehler: section?.querySelector(':scope > div span')?.textContent?.trim() ?? null,
      abschnitt: section?.innerText ?? '',
      seite: document.body.innerText,
      kpi,
      writes: window.__securityFilter.writes(),
      listCalls: window.__securityFilter.listCalls(),
    }
  })
}

async function suche(page, text) {
  const feld = page.getByPlaceholder('Suche in Events/IPs…')
  await feld.fill(text)
  await feld.dispatchEvent('input')
}

async function shot(page, name, fullPage) {
  try {
    await page.screenshot({ path: join(ARTIFACTS, name), fullPage })
  } catch (error) {
    console.error(`artifact screenshot skipped: ${name}: ${error}`)
  }
}

function merke(name, wert) {
  ergebnisse.push({ name, ...wert })
}

async function basis(browser, origin) {
  const { page, consoleErrors, pageErrors } = await oeffnen(browser, origin, 'unmatched', {
    width: 1280,
    height: 900,
  })
  await page.getByText('203.0.113.1', { exact: true }).waitFor()
  const vorFilter = await lesen(page)
  await suche(page, 'zz-kein-treffer')
  await page.getByText(PERIOD).waitFor()
  const nachFilter = await lesen(page)
  await page.screenshot({ path: join(ARTIFACTS, 'admin-security-filter-before-desktop.png'), fullPage: true }).catch((error) => {
    console.error(`artifact screenshot skipped: before: ${error}`)
  })
  const report = {
    mode: 'baseline-actual-SecurityWidget',
    synthetic: true,
    interaction: 'filter zz-kein-treffer on one recorded event',
    vorFilter: {
      leer: vorFilter.leer,
      zeilen: vorFilter.zeilen,
      zaehler: vorFilter.zaehler,
      kpi: vorFilter.kpi,
    },
    nachFilter: {
      filter: nachFilter.filter,
      leer: nachFilter.leer,
      zeilen: nachFilter.zeilen,
      zaehler: nachFilter.zaehler,
      kpi: nachFilter.kpi,
    },
    consoleErrors,
    pageErrors,
    writes: nachFilter.writes,
    defectReproduced:
      nachFilter.filter === 'zz-kein-treffer' &&
      nachFilter.leer === PERIOD &&
      vorFilter.zeilen === 1 &&
      nachFilter.zeilen === 0,
  }
  writeFileSync(join(EVIDENCE, 'before.json'), `${JSON.stringify(report, null, 2)}\n`)
  schreibeArtefakt('admin-security-filter-before.json', `${JSON.stringify(report, null, 2)}\n`)
  await page.close()
  if (!report.defectReproduced) {
    console.error(JSON.stringify(report, null, 2))
    throw new Error('STOP: unmatched-filter period wording was not reproduced on the actual SecurityWidget')
  }
  console.log(JSON.stringify({ defectReproduced: true, leer: report.nachFilter.leer }, null, 2))
}

async function fall(browser, origin, name, scenario, viewport, fn) {
  const geoeffnet = await oeffnen(browser, origin, scenario, viewport)
  try {
    const wert = await fn(geoeffnet.page)
    assert.deepEqual(geoeffnet.pageErrors, [], `${name} pageerror`)
    const stand = await lesen(geoeffnet.page)
    assert.deepEqual(stand.writes, [], `${name} unexpected writes`)
    assert.ok(stand.listCalls >= 1, `${name} list read`)
    assert.equal(stand.seite.includes(COVERAGE), true, `${name} coverage`)
    assert.equal(stand.seite.includes(IP_HINWEIS), true, `${name} ip hint`)
    assert.equal(stand.seite.includes('Blockliste (nicht enforced)'), true, `${name} blocklist title`)
    for (const label of KPI) {
      assert.equal(stand.seite.includes(label), true, `${name} ${label}`)
    }
    merke(name, { ok: true, ...wert, consoleErrors: geoeffnet.consoleErrors, listCalls: stand.listCalls })
  } finally {
    await geoeffnet.page.close()
  }
}

async function gruen(browser, origin) {
  const desktop = { width: 1280, height: 900 }
  const mobile = { width: 390, height: 844 }

  await fall(browser, origin, 'empty-payload', 'empty', desktop, async (page) => {
    await page.getByText(PERIOD).waitFor()
    const stand = await lesen(page)
    assert.equal(stand.leer, PERIOD)
    assert.equal(stand.seite.includes(FILTER), false)
    assert.equal(stand.seite.includes(BOUND), false)
    assert.equal(stand.seite.includes(FAILURE), false)
    assert.equal(stand.kpi['Aufgezeichnete Events (24h)'], '0')
    await shot(page, 'admin-security-filter-after-empty.png', true)
    return { leer: stand.leer, kpi: stand.kpi }
  })

  await fall(browser, origin, 'unmatched-filter', 'unmatched', desktop, async (page) => {
    await page.getByText('203.0.113.1', { exact: true }).waitFor()
    const davor = await lesen(page)
    assert.equal(davor.zeilen, 1)
    assert.equal(davor.kpi['Aufgezeichnete Events (24h)'], '1')
    assert.equal(davor.kpi['Aufgezeichnete Login-Fehler (24h)'], '1')
    await suche(page, 'zz-kein-treffer')
    await page.getByText(FILTER).waitFor()
    const danach = await lesen(page)
    assert.equal(danach.leer, FILTER)
    assert.equal(danach.seite.includes(PERIOD), false)
    assert.equal(danach.zeilen, 0)
    assert.equal(danach.kpi['Aufgezeichnete Events (24h)'], '1')
    assert.equal(danach.seite.includes('203.0.113.50'), true)
    await suche(page, '')
    await page.getByText('203.0.113.1', { exact: true }).waitFor()
    const geleert = await lesen(page)
    assert.equal(geleert.leer, null)
    assert.equal(geleert.zeilen, 1)
    assert.equal(geleert.seite.includes(PERIOD), false)
    assert.equal(geleert.seite.includes(FILTER), false)
    await suche(page, 'zz-kein-treffer')
    await page.getByText(FILTER).waitFor()
    await shot(page, 'admin-security-filter-after-unmatched.png', true)
    return { leer: FILTER, kpiUnveraendert: danach.kpi['Aufgezeichnete Events (24h)'] }
  })

  await fall(browser, origin, 'matched-filter', 'matched', desktop, async (page) => {
    await page.getByText('203.0.113.1', { exact: true }).waitFor()
    await suche(page, '203.0.113.1')
    await page.getByText('login_failed').waitFor()
    const stand = await lesen(page)
    assert.equal(stand.leer, null)
    assert.equal(stand.zeilen, 1)
    assert.equal(stand.seite.includes(PERIOD), false)
    assert.equal(stand.seite.includes(FILTER), false)
    assert.equal(stand.seite.includes(BOUND), false)
    return { zeilen: stand.zeilen }
  })

  await fall(browser, origin, 'rows-199', 'rows199', desktop, async (page) => {
    await page.getByText('199 Einträge').waitFor()
    const stand = await lesen(page)
    assert.equal(stand.zeilen, 199)
    assert.equal(stand.seite.includes(BOUND), false)
    assert.equal(stand.leer, null)
    await shot(page, 'admin-security-filter-after-199.png', false)
    return { zeilen: stand.zeilen, bound: false }
  })

  await fall(browser, origin, 'rows-200', 'rows200', desktop, async (page) => {
    await page.getByText(BOUND).waitFor()
    await page.getByText('200 Einträge').waitFor()
    const stand = await lesen(page)
    assert.equal(stand.zeilen, 200)
    assert.equal(stand.abschnitt.includes(BOUND), true)
    assert.equal(stand.leer, null)
    await shot(page, 'admin-security-filter-after-200.png', false)
    await suche(page, 'zz-kein-treffer')
    await page.getByText(FILTER).waitFor()
    const gefiltert = await lesen(page)
    assert.equal(gefiltert.leer, FILTER)
    assert.equal(gefiltert.abschnitt.includes(BOUND), true)
    assert.equal(gefiltert.seite.includes(PERIOD), false)
    await shot(page, 'admin-security-filter-after-200-filtered.png', true)
    return { zeilen: stand.zeilen, bound: true, filterOnBound: gefiltert.leer }
  })

  await fall(browser, origin, 'failed-read', 'failed', desktop, async (page) => {
    await page.getByText(FAILURE).waitFor()
    await page.getByText(UNAVAILABLE).first().waitFor()
    const stand = await lesen(page)
    assert.equal(stand.seite.includes(FAILURE), true)
    assert.equal(stand.seite.includes(UNAVAILABLE), true)
    assert.equal(stand.seite.includes(PERIOD), false)
    assert.equal(stand.seite.includes(FILTER), false)
    assert.equal(stand.seite.includes(BOUND), false)
    assert.equal(stand.kpi['Aufgezeichnete Events (24h)'], '—')
    assert.equal(stand.zeilen, 0)
    await shot(page, 'admin-security-filter-after-failure.png', true)
    return { kpi: stand.kpi['Aufgezeichnete Events (24h)'] }
  })

  await fall(browser, origin, 'unmatched-mobile', 'unmatched', mobile, async (page) => {
    await page.getByText('203.0.113.1', { exact: true }).waitFor()
    await suche(page, 'zz-kein-treffer')
    await page.getByText(FILTER).waitFor()
    const stand = await lesen(page)
    assert.equal(stand.leer, FILTER)
    assert.equal(stand.seite.includes(PERIOD), false)
    assert.equal(stand.kpi['Aufgezeichnete Events (24h)'], '1')
    await shot(page, 'admin-security-filter-after-mobile.png', true)
    return { leer: stand.leer }
  })
}

const css = await compileCss()
const script = await bundleHarness()
const { server, origin } = await serve(css, script)
const browser = await chromium.launch()
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
    faelle: ergebnisse,
  }
  writeFileSync(join(EVIDENCE, 'after.json'), `${JSON.stringify(report, null, 2)}\n`)
  schreibeArtefakt('admin-security-filter-after.json', `${JSON.stringify(report, null, 2)}\n`)
  console.log(JSON.stringify({ ok: true, faelle: ergebnisse.map((eintrag) => eintrag.name) }, null, 2))
}
