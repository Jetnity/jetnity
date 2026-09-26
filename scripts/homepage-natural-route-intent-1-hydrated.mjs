#!/usr/bin/env node
// Hydrated controller proof for homepage natural route intent 1.
// Bundles actual StartzielForm. Next router stubbed. Place search is
// synthetic. Chromium only — not physical-device acceptance, not
// authenticated Preview E2E.

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
const EVIDENCE = join(REPO, 'docs/evidence/homepage-natural-route-intent-1')
const STUBS = join(REPO, 'docs/evidence/homepage-confirmed-route-entry-1')
const ARTIFACTS = '/opt/cursor/artifacts'
const OUT = join('/tmp', 'homepage-natural-route-intent-1-harness')

mkdirSync(OUT, { recursive: true })
mkdirSync(EVIDENCE, { recursive: true })
mkdirSync(ARTIFACTS, { recursive: true })

const PARIS = 'geonames:2988507'
const ROM = 'geonames:3169070'
const LIMA = 'geonames:3936456'
const CUSCO = 'geonames:3941584'

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
      'next/navigation': join(STUBS, 'stubs/next-navigation.ts'),
      'next/link': join(STUBS, 'stubs/next-link.tsx'),
      '@/lib/places/aktionen': join(STUBS, 'stubs/places-aktionen.ts'),
      '@/lib/trips/aktionen': join(STUBS, 'stubs/trips-aktionen.ts'),
      'server-only': join(STUBS, 'stubs/server-only.ts'),
    },
    define: {
      'process.env.NODE_ENV': '"development"',
    },
  })
  return outfile
}

function htmlSeite(css, script) {
  return `<!doctype html>
<html lang="de">
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1">
  <title>Homepage natural route intent hydrated harness</title>
  <style>${css}</style>
</head>
<body>
  <div id="root"></div>
  <script>${script}</script>
</body>
</html>`
}

function serve(css, script) {
  const server = createServer((_req, res) => {
    res.writeHead(200, { 'Content-Type': 'text/html; charset=utf-8' })
    res.end(htmlSeite(css, script))
  })
  return new Promise((resolve) => {
    server.listen(0, '127.0.0.1', () => {
      const { port } = server.address()
      resolve({ server, origin: `http://127.0.0.1:${port}` })
    })
  })
}

async function oeffnen(page, origin, viewport) {
  if (viewport) await page.setViewportSize(viewport)
  await page.goto(origin, { waitUntil: 'domcontentloaded' })
  await page.waitForFunction(() => window.__hydrateReady === true)
}

async function speichern(page, name) {
  const ziel = join(EVIDENCE, `${name}.png`)
  const artifact = join(ARTIFACTS, `${name}.png`)
  await page.screenshot({ path: ziel, fullPage: true })
  await page.screenshot({ path: artifact, fullPage: true })
  return ziel
}

async function tippe(page, text) {
  const suche = page.locator('#travel-idea')
  await suche.click()
  await suche.fill('')
  await suche.pressSequentially(text, { delay: 12 })
}

async function waehleOption(page, name) {
  const option = page.getByRole('option', { name })
  await option.waitFor({ timeout: 4000 })
  await option.scrollIntoViewIfNeeded()
  await option.click({ timeout: 8000 })
}

async function absenden(page) {
  await page.getByRole('button', { name: 'Reise planen' }).click()
}

function queueStatus(page) {
  return page.getByRole('status').filter({ hasText: 'Ziele erkannt' })
}

async function resets(page, origin) {
  await oeffnen(page, origin, { width: 390, height: 844 })
  await page.evaluate(() => {
    window.__routerPushes = []
    window.__placesFailStatus = undefined
  })
}

async function peruBleibtEinZiel(page, origin) {
  await resets(page, origin)
  await tippe(page, 'Peru')
  await absenden(page)
  await page.getByRole('alert').waitFor({ timeout: 4000 })
  assert.equal(await page.getByText('Ziele erkannt').count(), 0)
  await waehleOption(page, 'Peru, Land')
  assert.equal(await page.getByRole('button', { name: 'Peru, Ziel 1, entfernen' }).count(), 1)
  const pushes = await page.evaluate(() => window.__routerPushes ?? [])
  assert.equal(pushes.length, 0)
  await speichern(page, 'peru_one_place_390')
}

async function ganzortKonjunktion(page, origin) {
  await resets(page, origin)
  await tippe(page, 'Bosnien und Herzegowina')
  await absenden(page)
  await page.getByRole('alert').waitFor({ timeout: 4000 })
  assert.equal(await page.getByText('Ziele erkannt').count(), 0)
  assert.equal(await page.locator('#travel-idea').inputValue(), 'Bosnien und Herzegowina')
  await waehleOption(page, 'Bosnien und Herzegowina, Land')
  assert.equal(await page.getByRole('button', { name: 'Bosnien und Herzegowina, Ziel 1, entfernen' }).count(), 1)

  await resets(page, origin)
  await tippe(page, 'Trinidad und Tobago')
  await absenden(page)
  await page.getByRole('alert').waitFor({ timeout: 4000 })
  assert.equal(await page.getByText('Ziele erkannt').count(), 0)
  await speichern(page, 'trinidad_whole_place_390')
}

async function limaPeruKontext(page, origin) {
  await resets(page, origin)
  await tippe(page, 'Lima, Peru')
  await absenden(page)
  await page.getByRole('alert').waitFor({ timeout: 4000 })
  assert.equal(await page.getByText('Ziele erkannt').count(), 0)
  assert.equal(await page.locator('#travel-idea').inputValue(), 'Lima, Peru')
  await waehleOption(page, 'Lima, Stadt')
  assert.equal(await page.getByRole('button', { name: 'Lima, Ziel 1, entfernen' }).count(), 1)
  await speichern(page, 'lima_peru_context_390')
}

async function limaUndCuscoSchlange(page, origin) {
  await resets(page, origin)
  await tippe(page, 'Lima und Cusco')
  await absenden(page)
  await queueStatus(page).waitFor({ timeout: 4000 })
  assert.match(await queueStatus(page).innerText(), /2 Ziele erkannt – bitte Ziel 1 von 2/)
  assert.equal(await page.locator('#travel-idea').inputValue(), 'Lima')
  await waehleOption(page, 'Lima, Stadt')
  assert.match(await queueStatus(page).innerText(), /Ziel 2 von 2/)
  assert.equal(await page.locator('#travel-idea').inputValue(), 'Cusco')
  await waehleOption(page, 'Cusco, Stadt')
  assert.equal(await page.getByText('Ziele erkannt').count(), 0)
  const pushes = await page.evaluate(() => window.__routerPushes ?? [])
  assert.equal(pushes.length, 0)
  await page.getByRole('button', { name: 'Reise planen' }).click()
  const nachher = await page.evaluate(() => window.__routerPushes ?? [])
  assert.equal(
    nachher.at(-1),
    `/planen?zielIds=${encodeURIComponent(LIMA)}&zielIds=${encodeURIComponent(CUSCO)}`,
  )
  await speichern(page, 'lima_cusco_confirmed_handoff_390')
}

async function dreiZieleUndDuplikat(page, origin) {
  await resets(page, origin)
  await tippe(page, 'Thailand, Kambodscha und Vietnam')
  await absenden(page)
  await queueStatus(page).waitFor({ timeout: 4000 })
  assert.match(await queueStatus(page).innerText(), /3 Ziele erkannt – bitte Ziel 1 von 3/)
  await waehleOption(page, 'Thailand, Land')
  await waehleOption(page, 'Kambodscha, Land')
  await waehleOption(page, 'Vietnam, Land')
  assert.equal(await page.getByRole('button', { name: 'Thailand, Ziel 1, entfernen' }).count(), 1)
  assert.equal(await page.getByRole('button', { name: 'Vietnam, Ziel 3, entfernen' }).count(), 1)

  await resets(page, origin)
  await tippe(page, 'Paris, Rom, Paris')
  await absenden(page)
  await queueStatus(page).waitFor({ timeout: 4000 })
  await waehleOption(page, 'Paris, Stadt')
  await waehleOption(page, 'Rom, Stadt')
  await waehleOption(page, 'Paris, Stadt')
  await page.getByRole('button', { name: 'Reise planen' }).click()
  const pushes = await page.evaluate(() => window.__routerPushes ?? [])
  assert.equal(
    pushes.at(-1),
    `/planen?zielIds=${encodeURIComponent(PARIS)}&zielIds=${encodeURIComponent(ROM)}&zielIds=${encodeURIComponent(PARIS)}`,
  )
  await speichern(page, 'paris_rom_paris_handoff_390')
}

async function ausfallKeinSplit(page, origin) {
  await resets(page, origin)
  await page.evaluate(() => {
    window.__placesFailStatus = 503
  })
  await tippe(page, 'Lima und Cusco')
  await absenden(page)
  await page.getByRole('alert').waitFor({ timeout: 4000 })
  assert.equal(await page.getByText('Ziele erkannt').count(), 0)
  assert.equal(await page.locator('#travel-idea').inputValue(), 'Lima und Cusco')
  await page.evaluate(() => {
    window.__placesFailStatus = undefined
  })
  await speichern(page, 'search_503_no_split_390')
}

async function mehrdeutigUndKeinTreffer(page, origin) {
  await resets(page, origin)
  await tippe(page, 'Springfield und Springfield')
  await absenden(page)
  await queueStatus(page).waitFor({ timeout: 4000 })
  const optionen = page.getByRole('option', { name: /Springfield/ })
  await optionen.first().waitFor({ timeout: 4000 })
  assert.ok((await optionen.count()) >= 2)
  assert.equal(await page.getByRole('button', { name: /Ziel 1, entfernen/ }).count(), 0)
  await page.getByRole('option', { name: 'Springfield, Stadt · Missouri' }).click()
  assert.match(await queueStatus(page).innerText(), /Ziel 2 von 2/)

  await page.locator('#travel-idea').fill('Xyzzyyx')
  await page.waitForTimeout(350)
  assert.equal(await page.getByRole('option').count(), 0)
  assert.match(await queueStatus(page).innerText(), /Ziel 2 von 2/)
  await speichern(page, 'ambiguous_and_no_result_kept_390')
}

async function queueAbbrechen(page, origin) {
  await resets(page, origin)
  await tippe(page, 'Lima und Cusco')
  await absenden(page)
  await queueStatus(page).waitFor({ timeout: 4000 })
  await waehleOption(page, 'Lima, Stadt')
  await page.getByRole('button', { name: 'Erkannte Route verwerfen' }).click()
  assert.equal(await page.getByText('Ziele erkannt').count(), 0)
  assert.equal(await page.getByRole('button', { name: 'Lima, Ziel 1, entfernen' }).count(), 1)
  assert.equal(await page.getByRole('button', { name: /Cusco/ }).count(), 0)
  await page.getByRole('button', { name: 'Reise planen' }).click()
  const pushes = await page.evaluate(() => window.__routerPushes ?? [])
  assert.equal(pushes.at(-1), `/planen?zielId=${encodeURIComponent(LIMA)}`)
  await speichern(page, 'cancel_queue_keeps_lima_390')
}

async function tastaturUndViewports(page, origin) {
  await resets(page, origin)
  await tippe(page, 'Lima und Cusco')
  await page.locator('#travel-idea').press('Enter')
  await queueStatus(page).waitFor({ timeout: 4000 })
  await page.locator('#travel-idea').focus()
  await page.waitForTimeout(350)
  await page.keyboard.press('ArrowDown')
  await page.keyboard.press('Enter')
  assert.match(await queueStatus(page).innerText(), /Ziel 2 von 2/)
  const fokus = await page.evaluate(() => ({
    tag: document.activeElement?.tagName ?? null,
    id: document.activeElement?.id ?? '',
  }))
  assert.notEqual(fokus.tag, 'BODY')
  assert.equal(fokus.id, 'travel-idea')
  await speichern(page, 'keyboard_queue_advance_390')

  await page.setViewportSize({ width: 768, height: 1024 })
  await speichern(page, 'layout_768_queue')
  await page.setViewportSize({ width: 1440, height: 900 })
  await speichern(page, 'layout_1440_queue')
  const errors = await page.evaluate(() => window.__pageErrors ?? [])
  assert.deepEqual(errors, [])
}

const css = await compileCss()
const bundle = await bundleHarness()
const script = readFileSync(bundle, 'utf8')
const { server, origin } = await serve(css, script)
const browser = await chromium.launch({ headless: true }).catch(() => chromium.launch({ channel: 'chrome' }))
const page = await browser.newPage()
await page.addInitScript(() => {
  window.__pageErrors = []
  window.addEventListener('error', (ereignis) => {
    window.__pageErrors.push(String(ereignis.message ?? ereignis.error))
  })
})

const ergebnisse = []
try {
  for (const [name, lauf] of [
    ['Peru remains one place', peruBleibtEinZiel],
    ['whole-place conjunctions', ganzortKonjunktion],
    ['Lima, Peru context', limaPeruKontext],
    ['Lima und Cusco queue + handoff', limaUndCuscoSchlange],
    ['three destinations and duplicate Paris', dreiZieleUndDuplikat],
    ['503 does not split', ausfallKeinSplit],
    ['ambiguous/no-result kept', mehrdeutigUndKeinTreffer],
    ['cancel remaining queue', queueAbbrechen],
    ['keyboard + 390/768/1440', tastaturUndViewports],
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
        'Locally bundled actual StartzielForm. next/navigation stubbed. Synthetic /api/search/places. Chromium only — not physical-device acceptance, not authenticated Preview E2E.',
    },
    null,
    2,
  ),
)
console.log(`hydrated: ${ergebnisse.length} PASS`)
