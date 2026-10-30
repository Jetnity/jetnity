// Real Chrome page zoom selected in the settings UI of a new disposable profile.
import assert from 'node:assert/strict'
import { mkdtemp, mkdir, rm, writeFile } from 'node:fs/promises'
import { join } from 'node:path'
import { tmpdir } from 'node:os'
import { chromium } from 'playwright'
import { fixture } from './fixture.mjs'

const base = process.env.AUDIT_BASE || 'http://127.0.0.1:3472'
assert(['localhost', '127.0.0.1'].includes(new URL(base).hostname))
const output = process.env.AUDIT_OUTPUT || '/tmp/jetnity-workspace-native-zoom'
await mkdir(output, { recursive: true })
const results = []
const forbidden = []
const errors = []
for (const windowWidth of [1440, 780, 640]) {
  const profile = await mkdtemp(join(tmpdir(), 'jetnity-native-zoom-'))
  let context
  try {
    context = await chromium.launchPersistentContext(profile, {
      channel: process.env.AUDIT_CHANNEL || 'chrome', headless: true, viewport: null,
      args: [`--window-size=${windowWidth},1000`], reducedMotion: 'reduce',
    })
    await context.route('**/*', r => {
      const url = new URL(r.request().url())
      if (url.protocol === 'chrome:') return r.continue()
      if (!['localhost', '127.0.0.1'].includes(url.hostname) || /\/api\/(flights|hotels|activities|mobility|rental-cars|reisebegleiter|reiseidee)/.test(url.pathname)) {
        forbidden.push(url.origin + url.pathname)
        return r.abort()
      }
      return r.continue()
    })
    const page = context.pages()[0]
    page.setDefaultTimeout(8000)
    const metrics = () => page.evaluate(() => ({
      width: innerWidth, height: innerHeight, dpr: devicePixelRatio,
      rootFont: getComputedStyle(document.documentElement).fontSize,
    }))
    await page.goto(base + '/planen')
    const before = await metrics()
    await page.goto('chrome://settings/appearance')
    const zoom = page.locator('select#zoomLevel')
    await zoom.waitFor()
    const choices = await zoom.locator('option').evaluateAll(xs => xs.map(x => ({ label: x.textContent, value: x.value })))
    const twice = choices.find(x => /200\s*%/.test(x.label))
    assert(twice, 'Chrome settings did not offer 200%')
    await zoom.selectOption(twice.value)
    await page.goto(base + '/planen')
    const after = await metrics()
    assert(Math.abs(before.width / after.width - 2) < .01)
    assert.equal(after.dpr / before.dpr, 2)
    assert.equal(after.rootFont, before.rootFont)
    page.on('pageerror', e => errors.push(e.message))
    await page.evaluate(f => localStorage.setItem('jetnity:reise:v3', JSON.stringify(f)), fixture())
    await page.goto(base + '/reisen/' + fixture().id)
    await page.getByRole('heading', { name: 'Deine Reise auf einen Blick' }).waitFor()
    for (const name of ['Reiseplan', 'Organisieren', 'Vorbereitung', 'Übersicht']) {
      await page.locator('.workspace-bottom-nav').getByRole('button', { name, exact: true }).click()
      assert(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth + 1), name)
    }
    await page.getByRole('button', { name: 'Navigation öffnen', exact: true }).click()
    await page.getByRole('dialog').getByRole('button', { name: 'Vorbereitung', exact: true }).focus()
    await page.keyboard.press('Enter')
    await page.getByRole('dialog').waitFor({ state: 'hidden' })
    await page.waitForFunction(() => document.activeElement?.matches('[data-workspace-modus-heading]'))
    await page.getByLabel('Kontomenü', { exact: true }).click()
    const panel = await page.locator('.workspace-account-panel').evaluate(el => ({
      width: el.clientWidth, scroll: el.scrollWidth,
      left: el.getBoundingClientRect().left, right: el.getBoundingClientRect().right,
    }))
    assert(panel.scroll <= panel.width + 1 && panel.left >= 0 && panel.right <= after.width, JSON.stringify(panel))
    await page.screenshot({ path: join(output, `${after.width}-native200.png`) })
    await page.locator('.workspace-account-panel').getByRole('link', { name: 'Datenschutzerklärung', exact: true }).click()
    await page.waitForURL('**/privacy')
    results.push({ status: 'PASS', windowWidth, before, after, panel })
    console.log(`PASS Chrome settings 200%: ${windowWidth}px window → ${after.width}px CSS, root font unchanged`)
  } catch (e) {
    results.push({ status: 'FAIL', windowWidth, message: e.message })
    console.log(`FAIL ${windowWidth}px`, e.message.split('\n')[0])
  } finally {
    await context?.close()
    await rm(profile, { recursive: true, force: true })
  }
}
await writeFile(join(output, 'results.json'), JSON.stringify({
  time: new Date().toISOString(), base,
  method: 'Chrome settings UI → Page zoom 200%; fresh disposable profile per width; no CSS/font/CDP zoom emulation',
  limits: ['Headless Chrome desktop engine, not a physical smartphone or VoiceOver test', 'No authenticated account or backend tests'],
  results, forbidden, errors,
}, null, 2))
if (results.some(x => x.status === 'FAIL') || forbidden.length || errors.length) process.exitCode = 1
