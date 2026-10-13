import assert from 'node:assert/strict'
import { writeFileSync } from 'node:fs'
import { build } from 'esbuild'
import { chromium } from 'playwright'
const output = 'docs/evidence/account-world-explorer-1'
const result = await build({ entryPoints: ['scripts/account-world-explorer-1-props.tsx'], bundle: true, write: false, platform: 'browser', jsx: 'automatic', define: { 'process.env': '{"NODE_ENV":"production"}' } })
const browser = await chromium.launch({ channel: 'chrome' })
const page = await browser.newPage({ viewport: { width: 1440, height: 900 } })
const checks = []
const errors = []
page.on('pageerror', (error) => errors.push(error.message))
try {
  await page.goto('http://127.0.0.1:3497/ui-audit/account?zustand=welt&ansicht=besuche', { waitUntil: 'networkidle' })
  const styles = await page.locator('link[rel="stylesheet"]').evaluateAll((els) => els.map((el) => el.outerHTML).join(''))
  await page.setContent(`<html><head>${styles}</head><body><main style="max-width:1100px;margin:auto"><div id="explorer-props-root"></div></main></body></html>`)
  await page.addScriptTag({ content: result.outputFiles[0].text })
  await page.waitForTimeout(50)
  assert.deepEqual(errors, [])
  await page.locator('[data-explorer-result="besuch:synthetic-event"]').click()
  assert.match(await page.locator('[data-explorer-details]').innerText(), /2004/)
  const update = async (detail) => {
    await page.evaluate((detail) => window.dispatchEvent(new CustomEvent('explorer-synthetic-props', { detail })), detail)
    await page.waitForTimeout(50)
  }
  await update('revoked')
  assert.equal(await page.locator('[data-explorer-details]').count(), 0)
  assert.match(await page.locator('[data-world-map]').innerText(), /nicht mehr verfügbar/)
  await update('initial')
  assert.equal(await page.locator('[data-explorer-details]').count(), 0)
  checks.push('Selected revoked event closes on real React prop update even when its country remains; restoring props does not resurrect selection.')
  for (const state of ['plan-error', 'visit-error']) {
    await update(state)
    await page.locator('[data-explorer-result="land:PT"]').click()
    const text = await page.locator('[data-explorer-details]').innerText()
    assert.match(text, state === 'plan-error' ? /Planungsstand bleibt unbekannt/ : /Besuchsstand bleibt unbekannt/)
    assert.equal(text.includes('Besucht und geplant'), false)
    assert.match(text, state === 'plan-error' ? /2004/ : /Zeitraum offen/)
    checks.push(`${state}: available data persists; opposite history unknown, no false both-state.`)
  }
  await update('initial')
  await page.locator('[data-explorer-result="land:PT"]').click()
  assert.match(await page.locator('[data-explorer-details]').innerText(), /Keine Kartenposition verfügbar/)
  await page.addStyleTag({ content: 'html { zoom: 2; }' })
  await page.getByRole('button', { name: 'Karte vergrössern' }).click()
  assert.equal(await page.locator('[data-explorer-viewport]').getAttribute('data-scale'), '1.5')
  assert.ok(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth + 1))
  await page.screenshot({ path: `${output}/css-zoom-200.png`, fullPage: true })
  checks.push('200% CSS zoom: no horizontal overflow, controls and selected details work. This is not native browser zoom proof.')
  assert.deepEqual(errors, [])
} finally {
  writeFileSync(`${output}/props-and-zoom.json`, JSON.stringify({ environment: 'local synthetic React prop-update fixture, no deployed route', checks }, null, 2))
  console.log(JSON.stringify(checks))
  await browser.close()
}
