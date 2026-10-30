// Full application regressions from the independent review. Local guest data only.
import assert from 'node:assert/strict'
import { mkdir, writeFile } from 'node:fs/promises'
import { join } from 'node:path'
import { chromium } from 'playwright'
import { fixture } from './fixture.mjs'

const base = process.env.AUDIT_BASE || 'http://127.0.0.1:3472'
assert(['localhost', '127.0.0.1'].includes(new URL(base).hostname))
const output = process.env.AUDIT_OUTPUT || '/tmp/jetnity-workspace-review'
await mkdir(output, { recursive: true })
const browser = await chromium.launch({ headless: true, channel: process.env.AUDIT_CHANNEL || 'chrome' })
const results = []
const forbidden = []
const errors = []
async function check(name, run) {
  const context = await browser.newContext({ viewport: { width: 390, height: 844 }, locale: 'de-CH', reducedMotion: 'reduce' })
  await context.route('**/*', r => {
    const url = new URL(r.request().url())
    if (!['127.0.0.1', 'localhost'].includes(url.hostname) || /\/api\/(flights|hotels|activities|mobility|rental-cars|reisebegleiter|reiseidee)/.test(url.pathname)) {
      forbidden.push(url.origin + url.pathname)
      return r.abort()
    }
    return r.continue()
  })
  const page = await context.newPage()
  page.setDefaultTimeout(5000)
  page.on('pageerror', e => errors.push(e.message))
  let evidence
  try {
    await page.goto(base + '/planen')
    await page.evaluate(f => localStorage.setItem('jetnity:reise:v3', JSON.stringify(f)), fixture())
    await page.goto(base + '/reisen/' + fixture().id)
    await page.getByRole('heading', { name: 'Deine Reise auf einen Blick' }).waitFor()
    evidence = await run(page)
    results.push({ name, status: 'PASS', evidence })
    console.log('PASS', name)
  } catch (e) {
    results.push({ name, status: 'FAIL', message: e.message })
    console.log('FAIL', name, e.message.split('\n')[0])
  } finally {
    await page.screenshot({ path: join(output, `${results.length}.png`) })
    await context.close()
  }
}
try {
  await check('Drawer keyboard navigation focuses the new content; dismissal returns to menu', async page => {
    const menu = page.getByRole('button', { name: 'Navigation öffnen', exact: true })
    await menu.click()
    const destination = page.getByRole('dialog').getByRole('button', { name: 'Vorbereitung', exact: true })
    await destination.focus()
    await page.keyboard.press('Enter')
    await page.getByRole('dialog').waitFor({ state: 'hidden' })
    await page.waitForFunction(() => document.activeElement?.matches('[data-workspace-modus-heading]'))
    assert.equal(await page.locator('[data-workspace-modus-heading]').textContent(), 'Vorbereitung')
    await menu.click()
    await page.keyboard.press('Escape')
    assert(await menu.evaluate(el => document.activeElement === el))
    await page.goto(base + '/reisen')
    await page.getByRole('heading', { name: 'Meine Reisen', exact: true }).waitFor()
    await menu.click()
    await page.getByRole('dialog').getByRole('link', { name: 'Meine Reisen', exact: true }).focus()
    await page.keyboard.press('Enter')
    await page.getByRole('dialog').waitFor({ state: 'hidden' })
    assert(await menu.evaluate(el => document.activeElement === el))
  })
  await check('Open account menu wraps labels at 320px and 200% root text', async page => {
    await page.setViewportSize({ width: 320, height: 900 })
    await page.evaluate(() => { document.documentElement.style.fontSize = '32px' })
    await page.waitForFunction(() => document.querySelector('.workspace-header')?.dataset.flow === 'true')
    assert(await page.locator('.workspace-header .workspace-primary').evaluate(el => el.getBoundingClientRect().width >= 180), 'Enlarged create/resume label is squeezed into a narrow column')
    await page.getByLabel('Kontomenü', { exact: true }).click()
    const panel = page.locator('.workspace-account-panel')
    const dimensions = await panel.evaluate(el => ({ clientWidth: el.clientWidth, scrollWidth: el.scrollWidth, left: el.getBoundingClientRect().left, right: el.getBoundingClientRect().right }))
    assert(dimensions.scrollWidth <= dimensions.clientWidth + 1, JSON.stringify(dimensions))
    assert(dimensions.left >= 0 && dimensions.right <= 320, JSON.stringify(dimensions))
    await page.screenshot({ path: join(output, 'menu-text200.png') })
    await panel.getByRole('link', { name: 'Datenschutzerklärung', exact: true }).click()
    await page.waitForURL('**/privacy')
    return dimensions
  })
  await check('Account menu remains clickable over a sticky trip return bar', async page => {
    await page.locator('.workspace-bottom-nav').getByRole('button', { name: 'Organisieren', exact: true }).click()
    await page.getByRole('region', { name: 'Organisieren', exact: true }).getByRole('button', { name: 'Flüge', exact: true }).click()
    const back = page.getByRole('navigation', { name: 'Reise', exact: true })
    await back.waitFor()
    await page.evaluate(() => scrollTo(0, 600))
    await page.getByLabel('Kontomenü', { exact: true }).click()
    const hitTests = await page.locator('.workspace-account-panel a').evaluateAll(links => links.map(el => {
      const r = el.getBoundingClientRect()
      if (r.top < 0 || r.bottom > innerHeight) return null
      return { label: el.textContent, clickable: el.contains(document.elementFromPoint(r.x + r.width / 2, r.y + r.height / 2)) }
    }).filter(Boolean))
    assert(hitTests.every(x => x.clickable), JSON.stringify(hitTests))
    await page.screenshot({ path: join(output, 'menu-over-return-bar.png') })
    await page.locator('.workspace-account-panel').getByRole('link', { name: 'Meine Reisen', exact: true }).click()
    await page.waitForURL('**/reisen')
    return hitTests
  })
  await check('Back to top survives the shell and clears the mobile navigation', async page => {
    await page.evaluate(() => scrollTo(0, document.body.scrollHeight))
    const top = page.getByRole('button', { name: 'Nach oben', exact: true })
    await top.waitFor()
    const geometry = await top.evaluate(el => {
      const r = el.getBoundingClientRect()
      const nav = document.querySelector('.workspace-bottom-nav').getBoundingClientRect()
      return { bottom: r.bottom, navTop: nav.top, clickable: el.contains(document.elementFromPoint(r.x + r.width / 2, r.y + r.height / 2)) }
    })
    assert(geometry.bottom < geometry.navTop && geometry.clickable, JSON.stringify(geometry))
    await page.screenshot({ path: join(output, 'back-to-top-clearance.png') })
    await top.click()
    await page.waitForFunction(() => scrollY < 1)
    return geometry
  })
  await check('Phone menu has a visible text label and the trip title remains readable', async page => {
    await page.setViewportSize({ width: 320, height: 844 })
    const label = page.getByRole('button', { name: 'Navigation öffnen', exact: true }).locator('span')
    assert(await label.evaluate(el => el.getBoundingClientRect().width > 10 && getComputedStyle(el).clipPath === 'none'))
    assert(await page.locator('.workspace-context').evaluate(el => el.getBoundingClientRect().width >= 200), 'Trip title is squeezed between header buttons')
    assert(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth + 1))
  })
} finally {
  await writeFile(join(output, 'results.json'), JSON.stringify({ time: new Date().toISOString(), base, isolation: 'Fresh context per test, synthetic local guest data, no external requests', limits: ['200% root font is text resizing, not native browser zoom', 'No authenticated account or backend tests'], results, forbidden, errors }, null, 2))
  await browser.close()
}
if (results.some(x => x.status === 'FAIL') || forbidden.length || errors.length) process.exitCode = 1
