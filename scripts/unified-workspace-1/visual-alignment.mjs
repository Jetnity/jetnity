// Real guest UI plus explicitly marked CSS component fixtures. No account writes.
import assert from 'node:assert/strict'
import { mkdir, writeFile } from 'node:fs/promises'
import { join } from 'node:path'
import { chromium } from 'playwright'
import { fixture } from './fixture.mjs'

const base = process.env.AUDIT_BASE || 'http://127.0.0.1:3472'
assert(['localhost', '127.0.0.1'].includes(new URL(base).hostname))
const output = process.env.AUDIT_OUTPUT || '/tmp/jetnity-workspace-visual-alignment'
await mkdir(output, { recursive: true })
const browser = await chromium.launch({ headless: true, channel: 'chrome' })
const context = await browser.newContext({ viewport: { width: 1440, height: 1000 }, locale: 'de-CH', reducedMotion: 'reduce' })
const page = await context.newPage()
page.setDefaultTimeout(6000)
const results = [], forbidden = [], errors = []
await context.route('**/*', r => {
  const url = new URL(r.request().url())
  if (!['localhost', '127.0.0.1'].includes(url.hostname) || /\/api\/(flights|hotels|activities|mobility|rental-cars|reisebegleiter|reiseidee)/.test(url.pathname)) {
    forbidden.push(url.origin + url.pathname)
    return r.abort()
  }
  return r.continue()
})
page.on('pageerror', e => errors.push(e.message))
async function load(trip = fixture()) {
  await page.goto(base + '/planen')
  await page.evaluate(f => localStorage.setItem('jetnity:reise:v3', JSON.stringify(f)), trip)
  await page.goto(base + '/reisen/' + trip.id)
  await page.getByRole('heading', { name: trip.title, exact: true }).waitFor()
}
async function check(name, run) {
  try { results.push({ name, status: 'PASS', evidence: await run() }); console.log('PASS', name) }
  catch (e) { results.push({ name, status: 'FAIL', message: e.message }); console.error('FAIL', name, e.message) }
}
try {
  await load()
  await check('Compact identity, attention and audit form the intended hierarchy', async () => {
    const geometry = await page.evaluate(() => {
      const box = s => { const r = document.querySelector(s).getBoundingClientRect(); return { top: r.top, bottom: r.bottom, height: r.height } }
      return { identity: box('[data-workspace-identity]'), attention: box('[data-workspace-attention]'), route: box('.workspace-route-overview'), auditInsideAttention: !!document.querySelector('[data-workspace-attention] [data-workspace-audit]') }
    })
    assert(geometry.identity.height < 200 && geometry.auditInsideAttention)
    assert(geometry.route.top > geometry.attention.bottom)
    await page.screenshot({ path: join(output, 'desktop-overview.png') })
    return geometry
  })
  await check('Route opens the actual selected day; navigation does not change guest data', async () => {
    const before = await page.evaluate(() => localStorage.getItem('jetnity:reise:v3'))
    await page.getByRole('region', { name: 'Deine Route', exact: true }).getByRole('button', { name: /Ko Chang/ }).focus()
    await page.keyboard.press('Enter')
    await page.waitForFunction(() => new URL(location.href).searchParams.get('tag') === 'day-9')
    assert.equal(new URL(page.url()).searchParams.get('ansicht'), 'plan')
    assert.equal(await page.evaluate(() => localStorage.getItem('jetnity:reise:v3')), before)
    await page.goBack()
    await page.getByRole('region', { name: 'Deine Route', exact: true }).waitFor()
  })
  await check('Repeated destination is a second visit; unknown day keeps its open context', async () => {
    const trip = fixture()
    trip.days[15].stageId = 'stage-bkk'
    trip.days[16].stageId = null
    trip.days[16].title = null
    await load(trip)
    const route = page.getByRole('region', { name: 'Deine Route', exact: true })
    assert.equal(await route.getByRole('button', { name: /^Bangkok/ }).count(), 2)
    assert(await route.getByText('Tage ohne festgelegten Aufenthalt', { exact: true }).count() >= 3)
    await route.getByRole('button', { name: /^Bangkok/ }).nth(1).click()
    await page.waitForFunction(() => new URL(location.href).searchParams.get('tag') === 'day-16')
  })
  await load()
  await check('Desktop keyboard focus is visible inside clipped attention rows', async () => {
    const row = page.locator('[data-attention-punkt]').first()
    await row.focus()
    const style = await row.evaluate(el => { const s = getComputedStyle(el); return { offset: s.outlineOffset, width: s.outlineWidth, color: s.outlineColor } })
    assert(parseFloat(style.offset) < 0 && parseFloat(style.width) >= 2)
    await page.screenshot({ path: join(output, 'attention-keyboard.png') })
    return style
  })
  await check('320/390/768 layouts and 200% text retain content without horizontal overflow', async () => {
    const widths = []
    for (const width of [320, 390, 768]) {
      await page.setViewportSize({ width, height: 900 })
      await page.evaluate(() => { document.documentElement.style.fontSize = '16px'; scrollTo(0, 0) })
      assert(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth + 1))
      await page.screenshot({ path: join(output, `overview-${width}.png`) })
      widths.push(width)
    }
    await page.setViewportSize({ width: 320, height: 900 })
    await page.evaluate(() => { document.documentElement.style.fontSize = '32px' })
    assert(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth + 1))
    await page.screenshot({ path: join(output, 'overview-320-text200.png') })
    return { widths, enlargement: 'root font 16px to 32px; not native browser zoom' }
  })
  await check('CSS component fixtures: empty/security/error/status pairs have readable contrast', async () => {
    await page.evaluate(() => { document.documentElement.style.fontSize = '16px' })
    // These are presentation fixtures only; they do not claim authenticated account coverage.
    const pairs = await page.evaluate(() => {
      const cases = [
        ['empty', 'bg-white/65', 'text-brand-800'],
        ['security', 'bg-card', 'text-ink-700'],
        ['inline-error', 'bg-white', 'text-red-700'],
        ['error-card', 'bg-red-50', 'text-red-800'],
        ['error-tinted', 'bg-red-50/50', 'text-red-900'],
        ['warning', 'bg-amber-50', 'text-amber-950'],
        ['success', 'bg-green-50', 'text-green-800'],
        ['selected', 'bg-citrus-400', 'text-brand-900'],
      ]
      const probe = document.createElement('div')
      document.querySelector('.workspace-content').append(probe)
      const rgba = value => {
        const canvas = document.createElement('canvas'); canvas.width = canvas.height = 1
        const ctx = canvas.getContext('2d'); ctx.fillStyle = value; ctx.fillRect(0, 0, 1, 1)
        return [...ctx.getImageData(0, 0, 1, 1).data].slice(0, 3)
      }
      const luminance = rgb => rgb.map(v => v / 255).map(v => v <= .04045 ? v / 12.92 : ((v + .055) / 1.055) ** 2.4).reduce((s, v, i) => s + v * [.2126, .7152, .0722][i], 0)
      const result = cases.map(([name, bg, fg]) => {
        probe.className = bg; probe.innerHTML = ''
        const text = document.createElement('span'); text.className = fg; text.textContent = 'Prüftext'; probe.append(text)
        const background = getComputedStyle(probe).backgroundColor, color = getComputedStyle(text).color
        const a = luminance(rgba(background)), b = luminance(rgba(color))
        return { name, background, color, ratio: (Math.max(a, b) + .05) / (Math.min(a, b) + .05) }
      })
      probe.remove()
      return result
    })
    assert(pairs.every(p => p.ratio >= 4.5), JSON.stringify(pairs))
    return pairs
  })
} finally {
  await writeFile(join(output, 'results.json'), JSON.stringify({ time: new Date().toISOString(), base, results, forbidden, errors, limits: ['Synthetic guest UI only', 'CSS fixture checks do not test authenticated account flows', 'No real-device or screen-reader claim'] }, null, 2))
  await browser.close()
}
if (results.some(r => r.status === 'FAIL') || forbidden.length || errors.length) process.exitCode = 1
