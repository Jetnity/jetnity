#!/usr/bin/env node
// Run with Node22 --import ./scripts/server-only-test-register.mjs --import tsx.
// Only loopback HTTP; no production route, external resource or provider call.
import assert from 'node:assert/strict'
import { createHash } from 'node:crypto'
import { mkdir, readFile } from 'node:fs/promises'
import { createServer } from 'node:http'
import { createRequire } from 'node:module'
import { dirname, join } from 'node:path'
import { fileURLToPath } from 'node:url'
import { chromium } from 'playwright'
import syntheticServerModule from './synthetic-server.ts'
import { selectU1SystemBrowser } from './browser.mjs'
import { U1_EVIDENCE_DIRECTORY, writeU1Evidence } from './evidence.mjs'

const require = createRequire(import.meta.url)
const { syntheticServer } = syntheticServerModule
const esbuild = createRequire(require.resolve('tsx'))('esbuild')
const REPO = join(dirname(fileURLToPath(import.meta.url)), '../..')
const OUT = U1_EVIDENCE_DIRECTORY
const WIDTHS = [280, 320, 360, 375, 390, 430, 768, 1280]
const serving = process.argv.includes('--serve')
const smoke = process.argv.includes('--smoke')
await mkdir(OUT, { recursive: true })
const bundle = await esbuild.build({ absWorkingDir: REPO, entryPoints: ['scripts/official-truth-product-v3-ui/mount.tsx'],
  bundle: true, write: false, metafile: true, format: 'iife', platform: 'browser', jsx: 'automatic', alias: { '@': REPO },
  define: { 'process.env.NODE_ENV': '"production"' }, logLevel: 'silent' })
const inputs = Object.keys(bundle.metafile.inputs)
assert.equal(inputs.some((input) => /visitor\/(?:query|test-fixtures)\.ts|product-v3\/contract\.ts|official-truth-content-identity/.test(input)), false,
  'client bundle must not include server ports, authority or synthetic proof fixtures')
const config = require(join(REPO, 'tailwind.config.js'))
const cssFile = join(REPO, 'styles/globals.css')
const css = await require('postcss')([require('tailwindcss/nesting')(), require('tailwindcss')({ ...config,
  content: [...config.content, './scripts/official-truth-product-v3-ui/mount.tsx'] }), require('autoprefixer')()])
  .process(await readFile(cssFile, 'utf8'), { from: cssFile })
const html = '<!doctype html><html lang="de"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"><title>Jetnity U1 – synthetischer lokaler Test</title><link rel="stylesheet" href="/style.css"></head><body><div id="root"></div><script src="/mount.js" defer></script></body></html>'
const query = syntheticServer()
let origin = ''
const server = createServer(async (request, response) => {
  response.setHeader('cache-control', 'no-store')
  response.setHeader('content-security-policy', "default-src 'none'; script-src 'self'; style-src 'self'; connect-src 'self'; img-src 'self' data:; base-uri 'none'; form-action 'self'; frame-ancestors 'none'")
  response.setHeader('x-content-type-options', 'nosniff')
  const send = (status, type, body) => { response.writeHead(status, { 'content-type': type }); response.end(body) }
  try {
    if (request.headers.host !== new URL(origin).host) return send(403, 'text/plain', 'Loopback host only')
    if (request.method === 'GET' && request.url === '/') return send(200, 'text/html; charset=utf-8', html)
    if (request.method === 'GET' && request.url === '/mount.js') return send(200, 'application/javascript', bundle.outputFiles[0].contents)
    if (request.method === 'GET' && request.url === '/style.css') return send(200, 'text/css', css.css)
    if (request.method !== 'POST' || request.url !== '/query') return send(404, 'text/plain', 'Synthetic route not found')
    if (request.headers.origin !== origin || request.headers['x-jetnity-synthetic-test'] !== 'U1'
      || request.headers['content-type'] !== 'application/json') return send(403, 'text/plain', 'Synthetic browser only')
    const chunks = []; let length = 0
    for await (const chunk of request) {
      length += chunk.length
      if (length > 4096) return send(413, 'text/plain', 'Test input too large')
      chunks.push(chunk)
    }
    const abort = new AbortController()
    response.on('close', () => { if (!response.writableEnded) abort.abort() })
    const value = await query(JSON.parse(Buffer.concat(chunks).toString('utf8')), abort.signal)
    if (!response.destroyed) send(200, 'application/json', JSON.stringify(value))
  } catch {
    if (!response.destroyed) send(400, 'text/plain', 'Synthetic request invalid')
  }
})
await new Promise((resolve, reject) => { server.once('error', reject); server.listen(0, '127.0.0.1', resolve) })
origin = `http://127.0.0.1:${server.address().port}`
writeU1Evidence('bundle-inputs.json', { inputs, bytes: bundle.outputFiles[0].contents.length })
if (serving) {
  process.stdout.write(`U1 synthetic local harness: ${origin}\nEvidence: ${OUT}\n`)
  process.on('SIGINT', () => server.close(() => process.exit(0)))
  process.on('SIGTERM', () => server.close(() => process.exit(0)))
} else if (smoke) {
  const report = { scope: 'Loopback HTTP smoke only; no browser, layout or device claim', cases: [] }
  try {
    const home = await fetch(origin)
    assert.equal(home.status, 200)
    assert.match(await home.text(), /synthetischer lokaler Test/)
    for (const [scenario, destinationCountryCode, expected] of [
      ['mixed', 'DE', ['accepted', 'pending']], ['mixed', 'FR', ['pending', 'pending']],
      ['read_error', 'DE', ['error', 'error']], ['unbound', 'DE', ['unavailable', 'unavailable']],
      ['complete', 'DE', ['accepted', 'pending']], ['complete', 'DE', ['accepted', 'accepted']],
    ]) {
      const response = await fetch(`${origin}/query`, { method: 'POST',
        headers: { origin, 'content-type': 'application/json', 'x-jetnity-synthetic-test': 'U1' },
        body: JSON.stringify({ scenario, input: { destinationCountryCode, citizenshipCountryCodes: ['CH', 'RS'] } }) })
      assert.equal(response.status, 200)
      const value = await response.json()
      assert.equal(value.fehler, null)
      assert.deepEqual(value.daten.cells.map((cell) => cell.results[0].status), expected)
      report.cases.push({ scenario, destinationCountryCode, statuses: expected })
    }
    const rejected = await fetch(`${origin}/query`, { method: 'POST', headers: { 'content-type': 'application/json' }, body: '{}' })
    assert.equal(rejected.status, 403)
    report.status = 'pass'
  } catch (error) { report.status = 'fail'; report.failure = String(error); process.exitCode = 1 }
  finally {
    await new Promise((resolve) => server.close(resolve))
    writeU1Evidence('http-smoke.json', report)
    process.stdout.write(`${JSON.stringify(report, null, 2)}\n`)
  }
} else {
  let browser, page
  const report = { scope: 'Synthetic loopback Chromium; real component and server orchestration, no live rule claim',
    node: process.version, bundleBytes: bundle.outputFiles[0].contents.length, layouts: [], interactions: [], externalRequests: [], errors: [], screenshots: [] }
  try {
    report.browserPath = selectU1SystemBrowser()
    browser = await chromium.launch({ headless: true, executablePath: report.browserPath, chromiumSandbox: true })
    report.browserVersion = browser.version()
    const context = await browser.newContext({ locale: 'de-DE', reducedMotion: 'reduce', viewport: { width: 390, height: 844 } })
    const testTime = new Date('2026-11-09T08:04:00.000Z')
    await context.clock.install({ time: testTime })
    await context.clock.pauseAt(testTime)
    report.clock = 'Playwright controlled browser time for deterministic polling; no timing/SLO claim'
    await context.route('**/*', async (route) => {
      if (new URL(route.request().url()).origin === origin) await route.continue()
      else { report.externalRequests.push(route.request().url()); await route.abort() }
    })
    page = await context.newPage()
    page.on('pageerror', (error) => report.errors.push(error.message))
    const posted = []
    page.on('request', (request) => { if (request.method() === 'POST') posted.push(JSON.parse(request.postData())) })
    async function selectPair(destination = 'DE', citizenship = 'CH') {
      await page.getByLabel('Zielland', { exact: true }).selectOption(destination)
      await page.getByLabel('Staatsangehörigkeit 1', { exact: true }).selectOption(citizenship)
    }
    async function submit() {
      await page.getByRole('button', { name: 'Einreisebestimmungen anzeigen', exact: true }).click()
      await page.getByRole('heading', { name: /^Einreise nach / }).waitFor()
    }
    async function scenario(value) { await page.getByLabel('Testfall', { exact: true }).selectOption(value) }
    async function layout(name) {
      const value = await page.evaluate(() => {
        const controls = [...document.querySelectorAll('button,select')].map((element) => {
          const rect = element.getBoundingClientRect(), style = getComputedStyle(element)
          return { text: element.tagName === 'SELECT' ? element.id : element.textContent.trim(),
            width: rect.width, height: rect.height, font: parseFloat(style.fontSize), overflow: element.scrollWidth > element.clientWidth + 1 }
        })
        const overflowing = [...document.querySelectorAll('h2,h3,h4,p,li,label,button,select,a')].filter((element) => {
          if (element.classList.contains('sr-only')) return false
          const rect = element.getBoundingClientRect()
          return rect.width > 0 && (rect.left < -1 || rect.right > innerWidth + 1)
        }).map((element) => element.textContent.trim().slice(0, 100))
        return { width: innerWidth, scrollWidth: document.documentElement.scrollWidth, font: getComputedStyle(document.documentElement).fontSize,
          controls, overflowing }
      })
      assert.ok(value.scrollWidth <= value.width + 1, `${name}: horizontal overflow ${JSON.stringify(value)}`)
      assert.equal(value.overflowing.length, 0, `${name}: content crosses viewport ${JSON.stringify(value.overflowing)}`)
      for (const control of value.controls) assert.ok(control.height >= 44 && !control.overflow, `${name}: unusable/clipped control ${JSON.stringify(control)}`)
      report.layouts.push({ name, ...value })
    }
    async function screenshot(name) {
      const path = join(OUT, `${name}.png`)
      await page.screenshot({ path, fullPage: true })
      report.screenshots.push({ name, path, sha256: createHash('sha256').update(await readFile(path)).digest('hex') })
    }
    await page.goto(origin)
    assert.equal(await page.getByRole('button', { name: 'Einreisebestimmungen anzeigen', exact: true }).isDisabled(), true)
    await page.keyboard.press('Tab')
    assert.equal(await page.getByLabel('Testfall', { exact: true }).evaluate((element) => element === document.activeElement), true)
    await page.keyboard.press('Tab')
    assert.equal(await page.getByLabel('Zielland', { exact: true }).evaluate((element) => element === document.activeElement), true)
    report.interactions.push('Empty form stays disabled; keyboard reaches test selector then destination')
    await selectPair()
    await page.getByRole('button', { name: 'Weitere Staatsangehörigkeit', exact: true }).click()
    await page.getByLabel('Staatsangehörigkeit 2', { exact: true }).selectOption('RS')
    await submit()
    assert.match(await page.getByRole('region', { name: /^Staatsangehörigkeit .*Schweiz$/ }).innerText(), /Mindestens 9 freie Passseiten/)
    assert.match(await page.getByRole('region', { name: /^Staatsangehörigkeit .*Serbien$/ }).innerText(), /Wird geprüft/)
    assert.match(await page.locator('body').innerText(), /Stand vom 09\.11\.2026, 08:00 UTC/)
    assert.match(await page.locator('body').innerText(), /Ein- und Ausreisetag zählen mit/)
    assert.equal(await page.getByRole('link', { name: 'Amtliche Quelle: Fiktive Testbehörde' }).getAttribute('href'), 'https://destination.example/synthetic-test-publication')
    assert.match(await page.evaluate(() => document.activeElement.textContent), /^Einreise nach .*Deutschland/)
    report.interactions.push('Separate accepted CH and pending RS; exact source/time and full conditions; focus reaches result heading')
    for (const width of WIDTHS) {
      await page.setViewportSize({ width, height: 844 })
      await layout(`mixed-${width}`)
      if ([280, 390, 1280].includes(width)) await screenshot(`mixed-${width}`)
    }
    await page.setViewportSize({ width: 844, height: 390 }); await layout('landscape-844x390')
    await page.setViewportSize({ width: 320, height: 844 })
    await page.evaluate(() => { document.documentElement.style.fontSize = '32px' })
    await layout('mixed-320-text200'); await screenshot('mixed-320-text200')
    await page.evaluate(() => { document.documentElement.style.fontSize = '' })
    await scenario('conflict'); await selectPair(); await submit()
    await page.getByRole('heading', { name: 'Amtliche Angaben werden geklärt', exact: true }).waitFor()
    assert.equal(await page.getByRole('link', { name: /^Amtliche Quelle/ }).count(), 0)
    report.interactions.push('Conflict suppresses positive rule and source link')
    await screenshot('conflict-320')
    await scenario('read_error'); await selectPair(); await submit()
    await page.getByRole('heading', { name: 'Abfrage fehlgeschlagen', exact: true }).waitFor()
    assert.equal(await page.getByRole('heading', { name: 'Wird geprüft', exact: true }).count(), 0)
    assert.equal((await page.locator('body').innerText()).includes('private'), false)
    report.interactions.push('Cache read failure remains error; no fake pending or raw failure')
    await scenario('unbound'); await selectPair(); await submit()
    await page.getByRole('heading', { name: 'Derzeit nicht verfügbar', exact: true }).waitFor()
    assert.equal(await page.getByRole('heading', { name: 'Wird geprüft', exact: true }).count(), 0)
    report.interactions.push('Unbound production seam is honest unavailable')
    await scenario('transport_error'); await selectPair()
    await page.getByRole('button', { name: 'Einreisebestimmungen anzeigen', exact: true }).click()
    await page.getByRole('heading', { name: 'Abfrage fehlgeschlagen', exact: true }).waitFor()
    assert.match(await page.evaluate(() => document.activeElement.textContent), /Abfrage fehlgeschlagen/)
    report.interactions.push('Transport failure has a focused, retryable error state')
    await scenario('slow'); await selectPair()
    await page.getByRole('button', { name: 'Einreisebestimmungen anzeigen', exact: true }).click()
    await page.getByText('Vorbereitete Angaben werden abgerufen …', { exact: true }).waitFor()
    await screenshot('loading-320')
    await page.getByLabel('Zielland', { exact: true }).selectOption('FR')
    assert.equal(await page.getByRole('heading', { name: /^Einreise nach / }).count(), 0)
    await submit()
    await page.getByRole('heading', { name: /^Einreise nach .*Frankreich$/ }).waitFor()
    await page.getByRole('heading', { name: 'Wird geprüft', exact: true }).waitFor()
    assert.equal(await page.getByRole('heading', { name: /^Einreise nach .*Deutschland$/ }).count(), 0)
    report.interactions.push('Edit during loading aborts stale answer; unknown FR/CH gets neutral Discovery ACK and pending')
    await scenario('conditions'); await selectPair(); await submit()
    assert.equal(await page.getByText('Diese Bedingungen gelten', { exact: true }).count(), 2)
    assert.match(await page.locator('body').innerText(), /Geschäftsreise/)
    report.interactions.push('Multiple context statements are displayed fully without choosing a best credential')
    await page.setViewportSize({ width: 390, height: 844 })
    await scenario('complete'); await selectPair('DE', 'RS'); await submit()
    await page.getByRole('heading', { name: 'Wird geprüft', exact: true }).waitFor()
    await page.getByLabel('Zielland', { exact: true }).focus()
    const countBeforePoll = posted.length
    await page.evaluate(() => {
      window.__u1PollLoadingScreen = false
      window.__u1PollObserver = new MutationObserver(() => {
        if ([...document.querySelectorAll('p')].some((item) => item.textContent === 'Vorbereitete Angaben werden abgerufen …')) window.__u1PollLoadingScreen = true
      })
      window.__u1PollObserver.observe(document.body, { childList: true, subtree: true })
    })
    await screenshot('poll-pending-390')
    await context.clock.runFor(2_000)
    await page.getByText('Mindestens 9 freie Passseiten', { exact: true }).waitFor()
    assert.equal(posted.length, countBeforePoll + 1)
    assert.equal(await page.getByLabel('Zielland', { exact: true }).evaluate((element) => element === document.activeElement), true)
    assert.equal(await page.evaluate(() => window.__u1PollLoadingScreen), false)
    await page.evaluate(() => window.__u1PollObserver.disconnect())
    assert.equal(await page.getByRole('heading', { name: 'Wird geprüft', exact: true }).count(), 0)
    await screenshot('poll-accepted-390')
    await context.clock.runFor(120_000)
    assert.equal(posted.length, countBeforePoll + 1)
    report.interactions.push('Confirmed pending becomes an authentic synthetic cache hit through one automatic query; focus remains on destination; no new loading screen or further polls')
    for (const post of posted) {
      assert.deepEqual(Object.keys(post).sort(), ['input', 'scenario'])
      assert.deepEqual(Object.keys(post.input).sort(), ['citizenshipCountryCodes', 'destinationCountryCode'])
    }
    assert.equal(report.externalRequests.length, 0)
    assert.equal(report.errors.length, 0)
    report.interactions.push('All browser requests stayed loopback; visitor payload contains only destination and citizenships')
    report.status = 'pass'
    await context.close()
  } catch (error) {
    report.status = 'fail'
    report.failure = String(error)
    process.exitCode = 1
    if (page && !page.isClosed()) {
      try {
        const path = join(OUT, 'failure.png')
        await page.screenshot({ path, fullPage: true })
        report.screenshots.push({ name: 'failure', path, sha256: createHash('sha256').update(await readFile(path)).digest('hex') })
      } catch (captureError) { report.captureFailure = String(captureError) }
    }
  } finally {
    try { await browser?.close() } catch (cleanupError) { report.cleanupFailure = String(cleanupError); report.status = 'fail'; process.exitCode = 1 }
    await new Promise((resolve) => server.close(resolve))
    writeU1Evidence('audit.json', report)
    process.stdout.write(`${JSON.stringify({ status: report.status, failure: report.failure, layouts: report.layouts.length,
      interactions: report.interactions.length, screenshots: report.screenshots.length, evidence: OUT }, null, 2)}\n`)
  }
}
