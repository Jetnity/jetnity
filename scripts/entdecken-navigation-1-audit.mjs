#!/usr/bin/env node
// Bounded navigation checks against the actual local production build.
// Fresh browser contexts, no credentials, screenshots or provider fixtures.
import assert from 'node:assert/strict'
import { spawn, execFileSync } from 'node:child_process'
import { createServer } from 'node:http'
import { createHash } from 'node:crypto'
import { createWriteStream, mkdirSync, mkdtempSync, readFileSync, writeFileSync } from 'node:fs'
import { tmpdir } from 'node:os'
import { join } from 'node:path'
import { chromium } from 'playwright'

const port = Number(process.env.AUDIT_PORT || 3543)
const base = `http://127.0.0.1:${port}`
const output = 'docs/evidence/entdecken-navigation-1/browser.json'
const scratch = mkdtempSync(join(tmpdir(), 'jetnity-nav-1-'))
const guard = join(scratch, 'local-fetch.cjs')
const blocked = join(scratch, 'blocked.txt')
writeFileSync(guard, `const fs = require('node:fs'); const original = globalThis.fetch;
globalThis.fetch = (input, init) => {
  const url = new URL(typeof input === 'string' || input instanceof URL ? input : input.url);
  if (!['localhost', '127.0.0.1'].includes(url.hostname)) {
    fs.appendFileSync(${JSON.stringify(blocked)}, 'blocked\\n');
    throw new Error('NAV-1 blocked nonlocal fetch');
  }
  return original(input, init);
};`)
writeFileSync(blocked, '')
const runtimePaths = ['lib/auth/oeffentliche-navigation.ts', 'components/layout/PublicNavbar.tsx', 'components/layout/Footer.tsx']
const receipt = {
  generatedAt: new Date().toISOString(),
  checkoutHead: execFileSync('git', ['rev-parse', 'HEAD'], { encoding: 'utf8' }).trim(),
  runtimeSha256: Object.fromEntries(runtimePaths.map((path) => [path, createHash('sha256').update(readFileSync(path)).digest('hex')])),
  environment: 'Actual local Next production routes; fresh credential-free Chrome; desktop 1440x1000 and mobile viewport 390x844, not physical hardware; no screenshots or image re-audit',
  checks: [], blockedBrowserRequests: 0, blockedServerFetches: 0, browserErrors: 0,
}
const pass = (name) => { receipt.checks.push(name); console.log(`PASS ${name}`) }
let server, browser
const serverLog = createWriteStream(join(scratch, 'server.log'))
try {
  const probe = createServer()
  await new Promise((ok, fail) => { probe.once('error', fail); probe.listen(port, '127.0.0.1', ok) })
  await new Promise((ok) => probe.close(ok))
  server = spawn(process.execPath, ['node_modules/next/dist/bin/next', 'start', '-p', String(port), '-H', '127.0.0.1'], {
    detached: true, stdio: ['ignore', 'pipe', 'pipe'],
    env: { PATH: process.env.PATH, TMPDIR: process.env.TMPDIR, NODE_OPTIONS: `--require=${guard}`, NEXT_TELEMETRY_DISABLED: '1' },
  })
  server.stdout.pipe(serverLog); server.stderr.pipe(serverLog)
  let ready = false
  for (let i = 0; i < 60; i++) {
    try { if ((await fetch(base)).ok) { ready = true; break } } catch {}
    await new Promise((ok) => setTimeout(ok, 500))
  }
  assert.ok(ready, 'own production server ready')
  browser = await chromium.launch({ channel: 'chrome', headless: true })
  receipt.browserVersion = browser.version()
  async function keyboardTo(page, selector) {
    for (let i = 0; i < 80; i++) {
      if (await page.evaluate((s) => document.activeElement?.matches(s), selector)) return
      await page.keyboard.press('Tab')
    }
    assert.fail('keyboard target was not reachable')
  }
  async function current(page, expected) {
    for (const label of ['Hauptnavigation', 'Mobile Navigation']) {
      const link = page.locator(`nav[aria-label="${label}"] a`).filter({ hasText: /^Entdecken$/ })
      assert.equal(await link.getAttribute('href'), '/entdecken')
      assert.equal(await link.getAttribute('aria-current'), expected ? 'page' : null)
      assert.equal(await link.evaluate((el) => el.classList.contains('bg-surface-100') && el.classList.contains('text-brand-800')), expected)
    }
    assert.equal(await page.locator('footer a').filter({ hasText: /^Entdecken$/ }).getAttribute('href'), '/entdecken')
  }
  async function closed(page) {
    await page.waitForFunction(() => document.querySelector('#oeffentliche-mobile-navigation')?.hidden === true)
    assert.equal(await page.locator('#oeffentliche-mobile-navigation').evaluate((el) => el.inert), true)
    assert.equal(await page.locator('button[aria-controls="oeffentliche-mobile-navigation"]').getAttribute('aria-expanded'), 'false')
  }
  for (const mobile of [false, true]) {
    const context = await browser.newContext({ viewport: mobile ? { width: 390, height: 844 } : { width: 1440, height: 1000 }, reducedMotion: 'reduce' })
    await context.route('**/*', async (route) => {
      if (new URL(route.request().url()).origin !== base || !['GET', 'HEAD'].includes(route.request().method())) {
        receipt.blockedBrowserRequests++; await route.abort(); return
      }
      await route.continue()
    })
    const page = await context.newPage()
    page.on('pageerror', () => { receipt.browserErrors++ })
    await page.goto(base)
    await current(page, false)
    assert.equal(await page.locator('#entdecken a[href^="/planen?"]').count(), 4)
    await closed(page)
    const nav = mobile ? 'Mobile Navigation' : 'Hauptnavigation'
    const toggle = 'button[aria-controls="oeffentliche-mobile-navigation"]'
    if (mobile) {
      await keyboardTo(page, toggle)
      await page.keyboard.press('Enter')
      await page.locator('#oeffentliche-mobile-navigation').waitFor({ state: 'visible' })
      assert.equal(await page.locator('#oeffentliche-mobile-navigation').evaluate((el) => el.inert), false)
    }
    await keyboardTo(page, `nav[aria-label="${nav}"] a[href="/entdecken"]`)
    await page.keyboard.press('Enter')
    await page.waitForURL(`${base}/entdecken`)
    await page.getByRole('heading', { name: 'Wohin geht deine Neugier?', exact: true }).waitFor()
    await current(page, true)
    await closed(page)
    pass(`${nav}: keyboard home → existing Entdecken link → actual Explorer heading and /entdecken; active colors and aria-current; menu closed/inert`)
    if (mobile) {
      await keyboardTo(page, toggle); await page.keyboard.press('Enter')
      await page.locator('#oeffentliche-mobile-navigation').waitFor({ state: 'visible' })
      await keyboardTo(page, '#oeffentliche-mobile-navigation a[href="/entdecken"]')
      await page.keyboard.press('Enter'); await closed(page)
      await keyboardTo(page, toggle); await page.keyboard.press('Enter')
      await page.locator('#oeffentliche-mobile-navigation').waitFor({ state: 'visible' })
      await page.keyboard.press('Tab'); await page.keyboard.press('Escape'); await closed(page)
      assert.equal(await page.locator(toggle).evaluate((el) => el === document.activeElement), true)
      await page.keyboard.press('Tab')
      assert.equal(await page.evaluate(() => !!document.activeElement?.closest('#oeffentliche-mobile-navigation')), false)
      pass('Mobile: same-path Enter closes; Escape closes and restores toggle focus; hidden menu excluded from Tab order')
    }
    assert.equal(await page.getByRole('link', { name: 'Zur Startseite', exact: true }).getAttribute('href'), '/#entdecken')
    await keyboardTo(page, 'main a[href="/#entdecken"]'); await page.keyboard.press('Enter')
    await page.waitForURL(`${base}/#entdecken`)
    await page.locator('#entdecken').waitFor()
    await current(page, false)
    await keyboardTo(page, 'footer a[href="/entdecken"]'); await page.keyboard.press('Enter')
    await page.waitForURL(`${base}/entdecken`)
    await page.getByRole('heading', { name: 'Wohin geht deine Neugier?', exact: true }).waitFor()
    pass(`${nav}: genuine /#entdecken return and footer keyboard navigation preserved`)
    await page.goto(`${base}/entdecken?q=Bali&thema=natur`)
    await current(page, true)
    await page.goto(`${base}/privacy`)
    await current(page, false)
    pass(`${nav}: query variant current; home and unrelated /privacy not current`)
    await context.close()
  }
  receipt.blockedServerFetches = readFileSync(blocked, 'utf8').split('\n').filter(Boolean).length
  assert.equal(receipt.blockedServerFetches, 0)
  assert.equal(receipt.blockedBrowserRequests, 0)
  assert.equal(receipt.browserErrors, 0)
  pass('No external browser requests, server fetches or browser page errors; no session/provider/database access')
  receipt.status = 'PASS'
  mkdirSync('docs/evidence/entdecken-navigation-1', { recursive: true })
  writeFileSync(output, JSON.stringify(receipt, null, 2) + '\n')
} finally {
  if (browser) await browser.close()
  if (server?.pid) {
    try { process.kill(-server.pid, 'SIGTERM') } catch {}
  }
  serverLog.end()
}
