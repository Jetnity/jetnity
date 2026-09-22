#!/usr/bin/env node
// Hydrated controller regressions for homepage confirmed route entry 1.
// Bundles actual StartzielForm + TripPlanner. Next router/link and server
// actions are stubbed. Place search is synthetic. Not Preview E2E and not
// physical-device acceptance.

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
const EVIDENCE = join(REPO, 'docs/evidence/homepage-confirmed-route-entry-1')
const ARTIFACTS = '/opt/cursor/artifacts'
const OUT = join('/tmp', 'homepage-route-entry-1-harness')

mkdirSync(OUT, { recursive: true })
mkdirSync(EVIDENCE, { recursive: true })
mkdirSync(ARTIFACTS, { recursive: true })

const PARIS = 'geonames:2988507'
const ROM = 'geonames:3169070'

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
        join(REPO, 'components/places/StartzielForm.tsx'),
        join(REPO, 'components/places/RouteZielListe.tsx'),
        join(REPO, 'components/places/OrtSuche.tsx'),
        join(REPO, 'components/trips/TripPlanner.tsx'),
        join(EVIDENCE, 'harness.tsx'),
      ],
    }
    const result = await postcss([nesting(), tailwindcss(config), autoprefixer()]).process(input, { from })
    return result.css
  } catch {
    return 'body{font-family:sans-serif;margin:0}'
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
      'next/navigation': join(EVIDENCE, 'stubs/next-navigation.ts'),
      'next/link': join(EVIDENCE, 'stubs/next-link.tsx'),
      '@/lib/places/aktionen': join(EVIDENCE, 'stubs/places-aktionen.ts'),
      '@/lib/trips/aktionen': join(EVIDENCE, 'stubs/trips-aktionen.ts'),
      'server-only': join(EVIDENCE, 'stubs/server-only.ts'),
    },
    define: {
      'process.env.NODE_ENV': '"development"',
    },
  })
  return outfile
}

function htmlSeite(css, script, suche) {
  return `<!doctype html>
<html lang="de">
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1">
  <title>Homepage route entry hydrated harness</title>
  <style>${css}</style>
</head>
<body>
  <div id="root"></div>
  <script>history.replaceState(null,'','/?${suche}')</script>
  <script>${script}</script>
</body>
</html>`
}

function serve(css, script) {
  const server = createServer((req, res) => {
    const url = new URL(req.url ?? '/', 'http://127.0.0.1')
    res.writeHead(200, { 'Content-Type': 'text/html; charset=utf-8' })
    res.end(htmlSeite(css, script, url.searchParams.toString()))
  })
  return new Promise((resolve) => {
    server.listen(0, '127.0.0.1', () => {
      const { port } = server.address()
      resolve({ server, origin: `http://127.0.0.1:${port}` })
    })
  })
}

async function oeffnen(page, origin, suche, viewport) {
  if (viewport) await page.setViewportSize(viewport)
  await page.goto(`${origin}/?${suche}`, { waitUntil: 'domcontentloaded' })
  await page.waitForFunction(() => window.__hydrateReady === true)
}

async function waehleOrt(page, eingabe, name) {
  await eingabe.click()
  await eingabe.fill('')
  await eingabe.pressSequentially(name, { delay: 15 })
  const option = page.getByRole('option', { name: `${name}, Stadt` })
  await option.waitFor({ timeout: 4000 })
  await option.click()
}

async function speichern(page, name) {
  const ziel = join(EVIDENCE, `${name}.png`)
  const artifact = join(ARTIFACTS, `${name}.png`)
  await page.screenshot({ path: ziel, fullPage: true })
  await page.screenshot({ path: artifact, fullPage: true })
  return ziel
}

async function r1PendingErhalt(page, origin) {
  await oeffnen(page, origin, 'surface=startziel', { width: 390, height: 844 })
  await waehleOrt(page, page.locator('#travel-idea'), 'Paris')
  await page.getByRole('button', { name: 'Weiteres Ziel' }).click()
  const suche = page.locator('#travel-idea')
  await suche.waitFor()
  await suche.fill('')
  await suche.pressSequentially('Cusco', { delay: 15 })
  await page.waitForTimeout(350)
  await page.getByRole('button', { name: 'Paris, Ziel 1, ersetzen' }).click()
  assert.equal(await suche.inputValue(), 'Cusco')
  assert.match(await page.getByRole('alert').innerText(), /Liste oder verwirf/)
  await speichern(page, 'r1_replace_keeps_pending_cusco')

  await page.getByRole('button', { name: 'Paris, Ziel 1, entfernen' }).click()
  assert.equal(await suche.inputValue(), 'Cusco')
  await speichern(page, 'r1_remove_last_chip_keeps_pending')
}

async function r1ErsetzenWechsel(page, origin) {
  await oeffnen(page, origin, 'surface=startziel', { width: 768, height: 1024 })
  await waehleOrt(page, page.locator('#travel-idea'), 'Paris')
  await page.getByRole('button', { name: 'Weiteres Ziel' }).click()
  await waehleOrt(page, page.locator('#travel-idea'), 'Rom')
  await page.getByRole('button', { name: 'Weiteres Ziel' }).click()
  const suche = page.locator('#travel-idea')
  await suche.pressSequentially('Cusco', { delay: 15 })
  await page.waitForTimeout(350)
  await page.getByRole('button', { name: 'Paris, Ziel 1, ersetzen' }).click()
  assert.equal(await suche.inputValue(), 'Cusco')
  await page.getByRole('button', { name: 'Rom, Ziel 2, ersetzen' }).click()
  assert.equal(await suche.inputValue(), 'Cusco')
  assert.equal(await page.getByRole('button', { name: 'Paris, Ziel 1, ersetzen' }).count(), 1)

  await page.getByRole('button', { name: 'Unbestätigten Text verwerfen' }).click()
  await page.getByRole('button', { name: 'Paris, Ziel 1, ersetzen' }).click()
  assert.equal(await suche.inputValue(), 'Paris')
  await suche.fill('')
  await suche.pressSequentially('Cusco', { delay: 15 })
  await page.getByRole('button', { name: 'Paris, Ziel 1, entfernen' }).click()
  assert.equal(await suche.inputValue(), 'Cusco')
  assert.equal(await page.getByRole('button', { name: 'Rom, Ziel 1, entfernen' }).count(), 1)
  await speichern(page, 'r1_replace_target_and_delete_keeps_draft')
}

async function r2SichtVsModell(page, origin) {
  await oeffnen(
    page,
    origin,
    `surface=planner&ziel=Paris&zielId=${encodeURIComponent(PARIS)}&weitere=${encodeURIComponent(`${ROM},Rom`)}`,
    { width: 1024, height: 900 },
  )
  const extra = page.locator('#feld-ziel-handoff-1')
  await extra.click()
  await extra.fill('')
  await extra.pressSequentially('Cusco', { delay: 15 })
  await page.waitForTimeout(120)
  await page.getByRole('button', { name: 'Cusco, Ziel 2, nach oben' }).click()
  await page.waitForTimeout(80)
  const primaer = page.locator('#feld-ziel')
  const verschoben = page.locator('#feld-ziel-primary')
  assert.equal(await primaer.inputValue(), 'Cusco')
  assert.equal(await verschoben.inputValue(), 'Paris')
  assert.equal(await page.getByRole('button', { name: 'Cusco, Ziel 1, nach unten' }).count(), 1)
  assert.equal(await page.getByRole('button', { name: 'Paris, Ziel 2, nach oben' }).count(), 1)
  await speichern(page, 'r2_swap_pending_cusco_becomes_primary')

  await page.getByRole('button', { name: 'Cusco, Ziel 1, nach unten' }).click()
  await page.waitForTimeout(80)
  assert.equal(await page.locator('#feld-ziel').inputValue(), 'Paris')
  assert.equal(await page.locator('#feld-ziel-handoff-1').inputValue(), 'Cusco')
}

async function r2LeerUndDuplikat(page, origin) {
  await oeffnen(
    page,
    origin,
    `surface=planner&ziel=Paris&zielId=${encodeURIComponent(PARIS)}`,
    { width: 1440, height: 900 },
  )
  await page.getByRole('button', { name: 'Weiteres Ziel hinzufügen' }).click()
  await page.getByRole('button', { name: 'Weiteres Ziel 1, Ziel 2, nach oben' }).click()
  await page.waitForTimeout(80)
  assert.equal(await page.locator('#feld-ziel').inputValue(), '')
  assert.equal(await page.locator('#feld-ziel-primary').inputValue(), 'Paris')

  await oeffnen(
    page,
    origin,
    `surface=planner&ziel=Paris&zielId=${encodeURIComponent(PARIS)}&weitere=${encodeURIComponent(`${PARIS},Paris`)}`,
    { width: 1440, height: 900 },
  )
  await page.getByRole('button', { name: 'Paris, Ziel 2, nach oben' }).click()
  await page.waitForTimeout(80)
  assert.equal(await page.locator('#feld-ziel').inputValue(), 'Paris')
  assert.equal(await page.locator('#feld-ziel-primary').inputValue(), 'Paris')
}

async function erfolgreicheRouteUndCreate(page, origin) {
  await oeffnen(page, origin, 'surface=startziel', { width: 390, height: 844 })
  await waehleOrt(page, page.locator('#travel-idea'), 'Paris')
  await page.getByRole('button', { name: 'Weiteres Ziel' }).click()
  await waehleOrt(page, page.locator('#travel-idea'), 'Rom')
  await page.getByRole('button', { name: 'Weiteres Ziel' }).click()
  await waehleOrt(page, page.locator('#travel-idea'), 'Paris')
  await speichern(page, 'successful_chips_paris_rom_paris')
  await page.getByRole('button', { name: 'Reise planen' }).click()
  const pushes = await page.evaluate(() => window.__routerPushes ?? [])
  assert.equal(
    pushes.at(-1),
    `/planen?zielIds=${encodeURIComponent(PARIS)}&zielIds=${encodeURIComponent(ROM)}&zielIds=${encodeURIComponent(PARIS)}`,
  )

  await oeffnen(
    page,
    origin,
    `surface=planner&konto=1&ziel=Paris&zielId=${encodeURIComponent(PARIS)}&weitere=${encodeURIComponent(
      `${ROM},Rom|${PARIS},Paris`,
    )}`,
    { width: 1024, height: 900 },
  )
  await waehleOrt(page, page.locator('#feld-abreiseort'), 'Zürich')
  await page.locator('#feld-start').fill('2026-10-01')
  await page.locator('#feld-ende').fill('2026-10-10')
  await page.getByRole('button', { name: 'Reise erstellen' }).click()
  await page.waitForFunction(() => (window.__reiseAnlegenCalls ?? []).length > 0)
  const stand = await page.evaluate(() => ({
    bestaetigen: window.__bestaetigenCalls ?? [],
    anlegen: window.__reiseAnlegenCalls ?? [],
    pushes: window.__routerPushes ?? [],
  }))
  assert.equal(stand.bestaetigen[0]?.zielId, PARIS)
  assert.deepEqual(stand.bestaetigen[0]?.weitereZielIds, [ROM, PARIS])
  assert.equal(stand.anlegen[0]?.destinationPlaceId, PARIS)
  assert.deepEqual(stand.anlegen[0]?.weitereDestinationPlaceIds, [ROM, PARIS])
  assert.equal(stand.pushes.at(-1), '/reisen/trip-hydrated-1')
  await speichern(page, 'successful_duplicate_ordered_create')
}

async function tastaturFokusReflow(page, origin) {
  await oeffnen(page, origin, 'surface=startziel', { width: 390, height: 844 })
  await waehleOrt(page, page.locator('#travel-idea'), 'Paris')
  await page.getByRole('button', { name: 'Weiteres Ziel' }).click()
  await waehleOrt(page, page.locator('#travel-idea'), 'Rom')
  await page.keyboard.press('Tab')
  const fokus1 = await page.evaluate(() => document.activeElement?.getAttribute('aria-label') ?? document.activeElement?.textContent)
  assert.ok(fokus1)
  await page.getByRole('button', { name: 'Rom, Ziel 2, nach oben' }).focus()
  await page.keyboard.press('Enter')
  await page.waitForTimeout(80)
  assert.equal(await page.getByRole('button', { name: 'Rom, Ziel 1, nach unten' }).count(), 1)
  await speichern(page, 'keyboard_reorder_390')

  await page.setViewportSize({ width: 768, height: 1024 })
  await speichern(page, 'layout_768_selected_chips')
  await page.setViewportSize({ width: 1024, height: 768 })
  await speichern(page, 'layout_1024_selected_chips')
  await page.setViewportSize({ width: 1440, height: 900 })
  await speichern(page, 'layout_1440_selected_chips')

  await page.setViewportSize({ width: 390, height: 844 })
  await page.evaluate(() => {
    document.documentElement.style.zoom = '2'
  })
  const overflow = await page.evaluate(() => ({
    scroll: document.documentElement.scrollWidth,
    client: document.documentElement.clientWidth,
  }))
  assert.ok(overflow.scroll <= overflow.client + 8)
  await speichern(page, 'reflow_390_200pct')
  await page.evaluate(() => {
    document.documentElement.style.zoom = '1'
  })
}

const css = await compileCss()
const bundle = await bundleHarness()
const script = readFileSync(bundle, 'utf8')
const { server, origin } = await serve(css, script)
const browser = await chromium.launch({ headless: true }).catch(() => chromium.launch({ channel: 'chrome' }))
const page = await browser.newPage()

const ergebnisse = []
try {
  for (const [name, lauf] of [
    ['R1 pending replace/remove', r1PendingErhalt],
    ['R1 replace-target switch', r1ErsetzenWechsel],
    ['R2 visible/model swap', r2SichtVsModell],
    ['R2 empty and duplicate', r2LeerUndDuplikat],
    ['successful chips + create', erfolgreicheRouteUndCreate],
    ['keyboard/focus/reflow', tastaturFokusReflow],
  ]) {
    await lauf(page, origin)
    ergebnisse.push({ name, ok: true })
  }
} catch (fehler) {
  ergebnisse.push({ name: 'failed', ok: false, meldung: String(fehler) })
  await speichern(page, 'hydrated_failure').catch(() => {})
  writeFileSync(join(EVIDENCE, 'hydrated-report.json'), JSON.stringify({ ergebnisse, fehler: String(fehler) }, null, 2))
  await browser.close()
  server.close()
  console.error(fehler)
  process.exit(1)
}

await browser.close()
server.close()
writeFileSync(
  join(EVIDENCE, 'hydrated-report.json'),
  JSON.stringify(
    {
      ok: true,
      ergebnisse,
      method:
        'Locally bundled actual StartzielForm + TripPlanner. next/router, next/link and server actions stubbed. Synthetic /api/search/places. Chromium only — not physical-device acceptance, not authenticated Preview E2E.',
    },
    null,
    2,
  ),
)
console.log(`hydrated: ${ergebnisse.length} PASS`)
