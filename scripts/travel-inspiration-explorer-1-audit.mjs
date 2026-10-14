#!/usr/bin/env node
// Actual Next routes and unchanged planning confirmation, with existing local
// GeoNames fixtures only. No hosted session, database or provider connection.
import assert from 'node:assert/strict'
import { createServer } from 'node:http'
import { createRequire } from 'node:module'
import { spawn, execFileSync } from 'node:child_process'
import { mkdirSync, mkdtempSync, readFileSync, writeFileSync, createWriteStream } from 'node:fs'
import { join, resolve } from 'node:path'
import { tmpdir } from 'node:os'
import { chromium } from 'playwright'

const require = createRequire(import.meta.url)
require('tsx/cjs')
const { geoNamesTsvZeile, laenderAusCountryInfo, orteAusGeoNames } = require('../lib/places/importieren.ts')
const { ENTDECKEN_ZIELE } = require('../lib/inspiration/explorer-1/katalog.ts')
const repo = process.cwd()
const output = resolve(process.env.AUDIT_EVIDENCE_DIR || 'docs/evidence/travel-inspiration-explorer-1/browser')
mkdirSync(output, { recursive: true })
const port = Number(process.env.AUDIT_PORT || 3541)
const fixturePort = port + 1
const base = `http://127.0.0.1:${port}`
const evidence = {
  head: execFileSync('git', ['rev-parse', 'HEAD'], { encoding: 'utf8' }).trim(),
  dirty: execFileSync('git', ['status', '--porcelain'], { encoding: 'utf8' }).trim(),
  environment: 'Actual local Next routes; existing GeoNames fixture HTTP responses; guest; Chrome headless viewport emulation, not physical devices or native zoom',
  checks: [], measurements: [], fixtureReads: [], unexpected: [], browserErrors: [],
}
const check = (name) => { evidence.checks.push(name); console.log(`PASS ${name}`) }
const { orte } = orteAusGeoNames({
  zeilen: readFileSync('lib/places/fixtures/geonames.tsv', 'utf8').split(/\r?\n/).map(geoNamesTsvZeile).filter(Boolean),
  laender: laenderAusCountryInfo(readFileSync('lib/places/fixtures/countries.txt', 'utf8')),
})
let fixtureFailure = false
const fixture = createServer((req, res) => {
  const url = new URL(req.url, `http://127.0.0.1:${fixturePort}`)
  if (req.method !== 'GET' || url.pathname !== '/rest/v1/places') {
    evidence.unexpected.push({ layer: 'fixture', method: req.method, path: url.pathname })
    res.writeHead(503).end('{}'); return
  }
  const id = url.searchParams.get('id')?.replace(/^eq\./, '')
  evidence.fixtureReads.push({ id, failure: fixtureFailure })
  if (fixtureFailure) { res.writeHead(503, { 'Content-Type': 'application/json' }).end('{"message":"synthetic unavailable"}'); return }
  const ort = orte.find((item) => item.id === id)
  const row = ort ? { ...ort, source_id: ort.sourceId, country_code: ort.countryCode } : null
  res.writeHead(200, { 'Content-Type': 'application/json' }).end(JSON.stringify(row ? [row] : []))
})

const scratch = mkdtempSync(join(tmpdir(), 'jetnity-explorer-1-'))
const guard = join(scratch, 'local-fetch.cjs')
writeFileSync(guard, `const original = globalThis.fetch; globalThis.fetch = (input, init) => {
  const url = new URL(typeof input === 'string' || input instanceof URL ? input : input.url);
  if (!['127.0.0.1', 'localhost'].includes(url.hostname)) throw new Error('Audit blocked nonlocal fetch: ' + url.origin);
  return original(input, init);
};`)
let server, browser
const serverLog = createWriteStream(join(output, 'next.log'))
try {
  // Fail if a foreign process owns the app port; never reuse or kill it.
  const probe = createServer()
  await new Promise((ok, fail) => { probe.once('error', fail); probe.listen(port, '127.0.0.1', ok) })
  await new Promise((ok) => probe.close(ok))
  await new Promise((ok, fail) => { fixture.once('error', fail); fixture.listen(fixturePort, '127.0.0.1', ok) })
  server = spawn(process.execPath, ['node_modules/next/dist/bin/next', process.env.AUDIT_PRODUCTION === '1' ? 'start' : 'dev', '-p', String(port), '-H', '127.0.0.1'], {
    cwd: repo, detached: true, stdio: ['ignore', 'pipe', 'pipe'],
    env: {
      PATH: process.env.PATH, TMPDIR: process.env.TMPDIR,
      NEXT_TELEMETRY_DISABLED: '1', NODE_OPTIONS: `--require=${guard}`,
      NEXT_PUBLIC_SUPABASE_URL: `http://127.0.0.1:${fixturePort}`,
      NEXT_PUBLIC_SUPABASE_ANON_KEY: 'local-synthetic-not-a-credential',
      NEXT_PUBLIC_APP_URL: base, JETNITY_MODELL_AKTIV: 'false',
    },
  })
  server.stdout.pipe(serverLog); server.stderr.pipe(serverLog)
  let ready = false
  for (let i = 0; i < 120; i++) {
    try { if ((await fetch(`${base}/entdecken`)).ok) { ready = true; break } } catch {}
    await new Promise((ok) => setTimeout(ok, 500))
  }
  assert.ok(ready, 'own Next server ready')
  browser = await chromium.launch({ channel: process.env.AUDIT_BROWSER_CHANNEL || 'chrome', headless: true })
  async function context(options = {}) {
    const ctx = await browser.newContext({ viewport: { width: 390, height: 844 }, reducedMotion: 'reduce', ...options })
    await ctx.route('**/*', async (route) => {
      const request = route.request()
      const url = new URL(request.url())
      if (url.origin !== base || !['GET', 'HEAD'].includes(request.method())) {
        evidence.unexpected.push({ layer: 'browser', origin: url.origin, path: url.pathname, method: request.method() })
        await route.abort(); return
      }
      await route.continue()
    })
    ctx.on('page', (page) => page.on('pageerror', (error) => evidence.browserErrors.push(error.message)))
    return ctx
  }
  async function count(page, n) {
    await page.getByRole('heading', { name: `${n} von 4 Zielen`, exact: true }).waitFor()
    assert.equal(await page.locator('main article').count(), n)
  }
  async function keyboardTo(page, selector) {
    for (let i = 0; i < 60; i++) {
      if (await page.evaluate((s) => document.activeElement?.matches(s), selector)) return
      await page.keyboard.press('Tab')
    }
    throw new Error(`keyboard could not reach ${selector}`)
  }

  const ctx = await context()
  const page = await ctx.newPage()
  await page.goto(base)
  assert.equal(await page.locator('#entdecken a[href^="/planen?"]').count(), 4)
  const originalLinks = await page.locator('#entdecken a[href^="/planen?"]').evaluateAll((links) => links.map((link) => link.getAttribute('href')))
  assert.deepEqual(originalLinks, ENTDECKEN_ZIELE.map((ziel) => ziel.href))
  await page.screenshot({ path: join(output, 'homepage-390.png') })
  await keyboardTo(page, 'a[href="/entdecken"]')
  await page.keyboard.press('Enter')
  await page.waitForURL(`${base}/entdecken`)
  await count(page, 4)
  check('homepage: keyboard discovery edge and four unchanged direct planning links')

  await keyboardTo(page, '#entdecken-suche')
  await page.keyboard.type('Bali')
  await count(page, 1)
  assert.equal(await page.locator('#entdecken-suche').evaluate((el) => el === document.activeElement), true)
  await page.keyboard.press('Tab') // submit
  await page.keyboard.press('Tab') // radio All
  await page.keyboard.press('ArrowRight') // city => no results
  await count(page, 0)
  await page.keyboard.press('ArrowRight') // nature => Bali
  await count(page, 1)
  assert.ok(page.url().includes('thema=natur'))
  await keyboardTo(page, 'main summary')
  await page.keyboard.press('Enter')
  assert.equal(await page.locator('main details').evaluate((el) => el.open), true)
  const focusStyle = await page.locator('main summary').evaluate((el) => ({ style: getComputedStyle(el).outlineStyle, width: getComputedStyle(el).outlineWidth }))
  assert.notEqual(focusStyle.style, 'none')
  await page.screenshot({ path: join(output, 'details-390.png') })
  const href = ENTDECKEN_ZIELE[0].href
  await keyboardTo(page, 'main article a[href^="/planen?"]')
  await page.keyboard.press('Enter')
  await page.waitForURL(`${base}${href}`)
  await page.locator('#feld-ziel').waitFor()
  assert.equal(await page.locator('#feld-ziel').inputValue(), 'Bali')
  const wish = page.getByRole('textbox', { name: 'Was ist dir bei dieser Reise besonders wichtig?' })
  assert.equal(await wish.inputValue(), ENTDECKEN_ZIELE[0].idea)
  await wish.fill('Meine eigene Bali-Idee')
  assert.equal(await wish.inputValue(), 'Meine eigene Bali-Idee')
  assert.equal(await page.locator('#feld-start').inputValue(), '')
  assert.equal(await page.locator('#feld-abreiseort').inputValue(), '')
  await page.screenshot({ path: join(output, 'planning-390.png'), fullPage: true })
  assert.ok(evidence.fixtureReads.some((read) => read.id === 'geonames:1650535'))
  check('keyboard search/theme/details → unchanged server confirmation → populated editable planning form; dates/origin empty')
  await page.goBack()
  await count(page, 1)
  assert.equal(await page.locator('#entdecken-suche').inputValue(), 'Bali')
  assert.equal(await page.getByRole('radio', { name: 'Natur', exact: true }).isChecked(), true)
  await page.reload(); await count(page, 1)
  check('back from plan and reload restore URL search/theme without hydration errors')
  await page.goBack(); await count(page, 0)
  await page.goForward(); await count(page, 1)
  check('browser back/forward reproduces theme history')

  await page.getByRole('link', { name: 'Suche & Themen zurücksetzen' }).click()
  await count(page, 4)
  assert.equal(page.url(), `${base}/entdecken`)
  await page.waitForLoadState('networkidle') // settle images from the preceding reset
  const requests = []
  const onRequest = (request) => requests.push(request.url())
  page.on('request', onRequest)
  await page.locator('#entdecken-suche').fill('Antarktis')
  await count(page, 0)
  await page.screenshot({ path: join(output, 'empty-390.png') })
  page.off('request', onRequest)
  evidence.typingRequests = requests
  // Chrome can re-request the existing favicon after a History API URL change.
  // Retain that observation; no search/API/document/image request is allowed.
  assert.deepEqual(requests.filter((url) => new URL(url).pathname !== '/icon.png'), [], 'typing causes no application request')
  await page.getByRole('link', { name: 'Alle Ziele anzeigen' }).click(); await count(page, 4)
  assert.equal(await page.locator('#entdecken-suche').evaluate((el) => el === document.activeElement), true)
  check('zero-result/reset restores catalogue and focus; no application requests while typing (browser favicon recorded separately)')

  for (const [width, height] of [[360, 800], [390, 844], [768, 1024], [1440, 900]]) {
    await page.setViewportSize({ width, height })
    await page.goto(`${base}/entdecken`); await count(page, 4)
    await page.locator('main article img').first().waitFor()
    for (const img of await page.locator('main article img').all()) {
      await img.scrollIntoViewIfNeeded()
      await img.evaluate((el) => el.decode())
    }
    await page.evaluate(() => window.scrollTo({ top: 0, behavior: 'instant' }))
    const measurement = await page.evaluate(() => {
      const controls = [...document.querySelectorAll('main a, main button, main summary, main input:not([type=radio]), main label > span')]
        .filter((el) => el.getBoundingClientRect().height > 0)
      return {
        overflow: document.documentElement.scrollWidth - document.documentElement.clientWidth,
        small: controls.filter((el) => { const box = el.getBoundingClientRect(); return box.height < 44 || box.width < 44 }).map((el) => el.textContent),
        inputFont: getComputedStyle(document.querySelector('#entdecken-suche')).fontSize,
        imageCount: [...document.querySelectorAll('main article img')].filter((el) => el.complete && el.naturalWidth > 0).length,
      }
    })
    evidence.measurements.push({ width, height, ...measurement })
    assert.ok(measurement.overflow <= 1); assert.deepEqual(measurement.small, [])
    assert.ok(parseFloat(measurement.inputFont) >= 16); assert.equal(measurement.imageCount, 4)
    await page.screenshot({ path: join(output, `explorer-${width}.png`), fullPage: true })
  }
  check('360x800, 390x844, 768x1024, 1440x900: no overflow, 44px targets, 16px inputs, four local images')

  await page.goto(`${base}/entdecken?q=%20B%C3%81LI%20&q=Amsterdam&thema=natur&thema=strand&target=https://example.test`)
  await count(page, 1)
  assert.equal(await page.locator('#entdecken-suche').inputValue(), 'BÁLI')
  await page.waitForURL(`${base}/entdecken?q=B%C3%81LI&thema=natur`)
  assert.equal(await page.locator('link[rel=canonical]').getAttribute('href'), 'https://jetnity.com/entdecken')
  assert.match(await page.locator('meta[name=robots]').getAttribute('content'), /noindex/)
  await page.goto(`${base}/entdecken?q=${'x'.repeat(200)}&thema=invalid`)
  await count(page, 0)
  assert.equal((await page.locator('#entdecken-suche').inputValue()).length, 120)
  await page.goto(`${base}/entdecken?q=%E0%A4%A`); await count(page, 0)
  check('duplicate/unknown/overlong/malformed URL values deterministic; canonical and noindex preserved')

  const nojs = await context({ javaScriptEnabled: false })
  const plain = await nojs.newPage()
  await plain.goto(`${base}/entdecken`); await count(plain, 4)
  await plain.locator('#entdecken-suche').fill('Museen')
  await plain.getByText('Stadt & Kultur', { exact: true }).first().click()
  await plain.getByRole('button', { name: 'Suchen', exact: true }).click()
  await count(plain, 1)
  await plain.locator('summary').click()
  assert.ok(await plain.locator('details').evaluate((el) => el.open))
  assert.equal(await plain.locator('main article a').getAttribute('href'), ENTDECKEN_ZIELE[3].href)
  await plain.getByRole('link', { name: 'Suche & Themen zurücksetzen' }).click(); await count(plain, 4)
  check('no JavaScript: SSR catalogue, native GET search/theme, details, planning links and reset usable')
  await nojs.close()

  await page.route('**/_next/image*', (route) => route.fulfill({ status: 404, body: '' }))
  await page.goto(`${base}/entdecken?q=Bali`); await count(page, 1)
  await page.getByRole('img', { name: 'Bild von Bali nicht verfügbar' }).waitFor()
  assert.equal(await page.locator('main article a').getAttribute('href'), href)
  await page.screenshot({ path: join(output, 'image-failure.png') })
  check('image failure has stable accessible fallback, text and planning action')
  fixtureFailure = true
  await page.goto(`${base}${href}`)
  assert.equal(await page.locator('#feld-ziel').inputValue(), '')
  assert.ok(evidence.fixtureReads.some((read) => read.failure))
  check('synthetic place read failure is not a confirmed planning destination')
  assert.deepEqual(evidence.unexpected, [])
  assert.deepEqual(evidence.browserErrors, [])
  check('no unexpected browser writes/external origins, no browser exceptions; local fixtures only')
  evidence.result = 'PASS'
} catch (error) {
  evidence.result = 'FAIL'; evidence.error = error.stack
  process.exitCode = 1; console.error(error)
} finally {
  await browser?.close()
  if (server) { try { process.kill(-server.pid, 'SIGTERM') } catch {} }
  await new Promise((ok) => fixture.close(ok))
  serverLog.end()
  writeFileSync(join(output, 'results.json'), JSON.stringify(evidence, null, 2))
}
