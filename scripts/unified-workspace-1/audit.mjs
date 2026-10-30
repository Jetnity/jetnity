// Run against a local server only; fresh contexts, synthetic guest storage.
// No real accounts, credentials, AI/provider calls or remote writes.
import assert from 'node:assert/strict'
import { mkdir, writeFile } from 'node:fs/promises'
import { join } from 'node:path'
import { chromium } from 'playwright'
import { fixture } from './fixture.mjs'

const base = process.env.AUDIT_BASE || 'http://127.0.0.1:3472'
assert(['localhost', '127.0.0.1'].includes(new URL(base).hostname), 'Local audit only')
const output = process.env.AUDIT_OUTPUT || '/tmp/jetnity-unified-workspace-audit'
await mkdir(output, { recursive: true })
const browser = await chromium.launch({ headless: true, ...(process.env.AUDIT_CHANNEL ? { channel: process.env.AUDIT_CHANNEL } : {}) })
const context = await browser.newContext({ viewport: { width: 1440, height: 1000 }, locale: 'de-CH' })
const page = await context.newPage()
page.setDefaultTimeout(7000)
page.setDefaultNavigationTimeout(15000)
const results = []
const errors = []
const forbidden = []
page.on('pageerror', (e) => errors.push(e.message))
page.on('request', (request) => {
  const url = new URL(request.url())
  if (/\/api\/(flights|hotels|activities|mobility|rental-cars|reisebegleiter|reiseidee)/.test(url.pathname)
    || !['127.0.0.1', 'localhost'].includes(url.hostname)) forbidden.push(url.origin + url.pathname)
})
await context.route('**/*', route => {
  const url = new URL(route.request().url())
  return ['127.0.0.1', 'localhost'].includes(url.hostname) ? route.continue() : route.abort()
})
const visibleButton = name => page.getByRole('button', { name, exact: true }).filter({ visible: true })
async function check(name, work) {
  try { await work(); results.push({ name, status: 'PASS' }); console.log('PASS', name) }
  catch (e) {
    results.push({ name, status: 'FAIL', message: e.message.split('\n').slice(0,8).join('\n') })
    console.error('FAIL', name, e.message)
    await page.screenshot({ path: join(output, `failure-${results.length}.png`) }).catch(() => {})
  }
}
async function shot(name) { await page.screenshot({ path: join(output, `${name}.png`) }) }
async function noOverflow() {
  assert(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth + 1), 'Horizontal page overflow')
  const clippedIcons = await page.locator('.workspace-header-actions button svg, .workspace-bottom-nav button svg').evaluateAll(icons => icons.filter(icon => {
    if (!icon.getClientRects().length) return false
    const outer = icon.closest('button').getBoundingClientRect()
    const inner = icon.getBoundingClientRect()
    return inner.left < outer.left - 1 || inner.right > outer.right + 1
  }).length)
  assert.equal(clippedIcons, 0, 'Action icons must stay within their buttons')
}

try {
  await check('Homepage retains public navigation and footer', async () => {
    await page.goto(base, { waitUntil: 'domcontentloaded' })
    await page.getByRole('navigation', { name: 'Hauptnavigation' }).waitFor()
    assert.equal(await page.locator('.workspace-shell').count(), 0)
    assert.equal(await page.locator('footer').count(), 1)
  })
  await check('Both complete planning modes remain reachable', async () => {
    await page.goto(base + '/planen', { waitUntil: 'domcontentloaded' })
    await page.getByRole('heading', { name: 'Beginnen wir mit deiner Reise.' }).waitFor()
    assert(await page.getByRole('heading', { name: 'Deine Reise Schritt für Schritt.' }).isVisible())
    assert(await page.getByRole('button', { name: 'Entwurf erstellen' }).isVisible())
    assert(await page.getByRole('button', { name: 'Reise erstellen', exact: true }).isVisible())
    await shot('desktop-planen')
  })
  await page.evaluate(f => localStorage.setItem('jetnity:reise:v3', JSON.stringify(f)), fixture())
  const tripUrl = base + '/reisen/' + fixture().id
  await page.goto(tripUrl, { waitUntil: 'domcontentloaded' })
  await page.getByRole('heading', { name: 'Deine Reise auf einen Blick' }).waitFor()
  await check('Attention, all groups, trip audit and three destinations retained', async () => {
    assert(await page.getByText('Jetzt wichtig', { exact: true }).isVisible())
    await visibleButton('2 weitere Hinweisgruppen anzeigen').click()
    await visibleButton('Reise prüfen').click()
    assert(await page.getByText('Bangkok · 🇹🇭 Thailand', { exact: true }).isVisible())
    assert(await page.getByText('Ko Chang · 🇹🇭 Thailand', { exact: true }).isVisible())
    assert(await page.getByText('Phuket · 🇹🇭 Thailand', { exact: true }).isVisible())
  })
  await check('All four views and browser history/deep links', async () => {
    for (const [name, value] of [['Reiseplan', 'plan'], ['Organisieren', 'organisieren'], ['Vorbereitung', 'vorbereitung'], ['Übersicht', 'uebersicht']]) {
      await visibleButton(name).click()
      await page.waitForFunction(v => (new URL(location.href).searchParams.get('ansicht') ?? 'uebersicht') === v, value)
      assert.equal(await visibleButton(name).getAttribute('aria-current'), 'page')
    }
    await page.goBack({ waitUntil: 'domcontentloaded' })
    assert.equal(await visibleButton('Vorbereitung').getAttribute('aria-current'), 'page')
    await page.reload({ waitUntil: 'domcontentloaded' })
    await visibleButton('Vorbereitung').waitFor()
    assert.equal(await visibleButton('Vorbereitung').getAttribute('aria-current'), 'page')
    await visibleButton('Übersicht').click()
    await page.evaluate(() => scrollTo(0, 0))
    await shot('desktop-uebersicht')
  })
  await check('Collapsed rail: mouse, keyboard labels, Escape and focus', async () => {
    await visibleButton('Seitenleiste einklappen').click()
    await visibleButton('Reiseplan').focus()
    await page.getByRole('tooltip', { name: 'Reiseplan', exact: true }).waitFor()
    await page.keyboard.press('Escape')
    assert.equal(await page.getByRole('tooltip').count(), 0)
    await page.keyboard.press('Enter')
    assert.equal(await visibleButton('Reiseplan').getAttribute('aria-current'), 'page')
    await visibleButton('Organisieren').hover()
    await page.getByRole('tooltip', { name: 'Organisieren' }).waitFor()
    await page.getByRole('tooltip', { name: 'Organisieren' }).hover()
    assert(await page.getByRole('tooltip', { name: 'Organisieren' }).isVisible())
    await shot('desktop-symbolleiste')
    await visibleButton('Seitenleiste ausklappen').click()
  })
  await check('Guest point save → reload → real persisted data', async () => {
    await visibleButton('Reiseplan').click()
    await visibleButton('Punkt hinzufügen').click()
    await page.locator('form select').first().selectOption('note')
    await page.getByLabel('Ort oder Aktivität', { exact: true }).fill('QA Anreise Zürich')
    await visibleButton('Speichern').click()
    await page.waitForFunction(() => JSON.parse(localStorage.getItem('jetnity:reise:v3')).days[0].items.some(i => i.title === 'QA Anreise Zürich'))
    await page.reload({ waitUntil: 'domcontentloaded' })
    await page.getByText('QA Anreise Zürich', { exact: true }).first().waitFor()
    const saved = await page.evaluate(() => JSON.parse(localStorage.getItem('jetnity:reise:v3')))
    assert.equal(saved.stages.length, 3)
    assert.equal(saved.days.length, 22)
  })
  await check('Trip edit: both modes, preview before saving, reload and focus return', async () => {
    await visibleButton('Reise ändern').click()
    const dialog = page.getByRole('dialog', { name: 'Reise ändern', exact: true })
    await dialog.waitFor()
    await dialog.getByRole('button', { name: 'In eigenen Worten', exact: true }).click()
    assert(await dialog.getByRole('button', { name: 'Änderung vorschlagen', exact: true }).isVisible())
    await dialog.getByRole('button', { name: 'Direkt bearbeiten', exact: true }).click()
    await dialog.getByLabel('Reisetitel', { exact: true }).fill('QA Thailand-Rundreise')
    await dialog.getByRole('button', { name: 'Auswirkungen ansehen', exact: true }).click()
    assert.equal(await page.evaluate(() => JSON.parse(localStorage.getItem('jetnity:reise:v3')).title), 'Thailand-Rundreise')
    await dialog.getByRole('button', { name: 'Änderung ausdrücklich übernehmen', exact: true }).click()
    await page.waitForFunction(() => JSON.parse(localStorage.getItem('jetnity:reise:v3')).title === 'QA Thailand-Rundreise')
    await dialog.getByRole('button', { name: 'Zurück zum Workspace', exact: true }).click()
    await dialog.waitFor({ state: 'hidden' })
    assert(await visibleButton('Reise ändern').evaluate(el => el === document.activeElement))
    await page.reload({ waitUntil: 'domcontentloaded' })
    await page.getByRole('heading', { name: 'QA Thailand-Rundreise', exact: true }).waitFor()
    const saved = await page.evaluate(() => JSON.parse(localStorage.getItem('jetnity:reise:v3')))
    assert.equal(saved.stages.length, 3)
    assert.equal(saved.days.length, 22)
    assert(saved.days[0].items.some(i => i.title === 'QA Anreise Zürich'))
  })
  await check('Existing guest trip: create CTA continues without overwriting data', async () => {
    const before = await page.evaluate(() => localStorage.getItem('jetnity:reise:v3'))
    await page.locator('.workspace-header').getByRole('link', { name: 'Reise fortsetzen', exact: true }).click()
    assert.equal(new URL(page.url()).pathname, '/reisen/' + fixture().id)
    await page.goto(base + '/planen', { waitUntil: 'domcontentloaded' })
    assert.equal(await page.evaluate(() => localStorage.getItem('jetnity:reise:v3')), before)
    await shot('desktop-planen-gastschutz')
    await page.goto(tripUrl, { waitUntil: 'domcontentloaded' })
    await visibleButton('Übersicht').waitFor()
  })
  for (const width of [320, 390, 768, 1440]) {
    await check(`${width}px views, controls and horizontal overflow`, async () => {
      await page.setViewportSize({ width, height: width === 1440 ? 1000 : 844 })
      for (const name of ['Übersicht', 'Reiseplan', 'Organisieren', 'Vorbereitung']) {
        await visibleButton(name).click()
        await noOverflow()
      }
      await visibleButton('Übersicht').click()
      await page.evaluate(() => scrollTo(0, 0))
      await shot(`${width}-uebersicht`)
    })
  }
  await check('Mobile drawer traps focus, closes on Escape and returns focus', async () => {
    await page.setViewportSize({ width: 390, height: 844 })
    await visibleButton('Navigation öffnen').click()
    await page.getByRole('dialog', { name: 'Workspace-Navigation' }).waitFor()
    for (let i = 0; i < 18; i++) {
      await page.keyboard.press('Tab')
      assert(await page.evaluate(() => document.querySelector('.workspace-sidebar').contains(document.activeElement)))
    }
    await shot('390-navigation')
    await page.keyboard.press('Escape')
    assert(await visibleButton('Navigation öffnen').evaluate(el => el === document.activeElement))
    await visibleButton('Navigation öffnen').click()
    await page.getByRole('dialog').getByRole('button', { name: 'Organisieren', exact: true }).click()
    assert.equal(await page.getByRole('dialog').count(), 0)
  })
  await check('Account menu and legal links remain available', async () => {
    await page.getByLabel('Kontomenü', { exact: true }).click()
    for (const name of ['Meine Reisen', 'Einstellungen', 'Bestätigte Buchungen', 'Datenschutzerklärung', 'Nutzungsbedingungen / AGB', 'Impressum', 'Anmelden']) {
      assert(await page.locator('.workspace-account-panel').getByRole('link', { name, exact: true }).isVisible(), name)
    }
    await shot('390-kontomenue')
    await page.keyboard.press('Escape')
  })
  for (const width of [320, 390, 1440]) {
    await check(`${width}px with 200% root text and usable navigation`, async () => {
      await page.setViewportSize({ width, height: 900 })
      await page.evaluate(() => { document.documentElement.style.fontSize = '32px' })
      for (const name of ['Übersicht', 'Reiseplan', 'Organisieren', 'Vorbereitung']) {
        await visibleButton(name).click()
        await noOverflow()
      }
      await page.evaluate(() => scrollTo(0, 0))
      await shot(`${width}-text200`)
      await page.evaluate(() => { document.documentElement.style.fontSize = '' })
    })
  }
  await check('No provider/AI calls and no runtime exceptions', async () => {
    assert.deepEqual(forbidden, [])
    assert.deepEqual(errors, [])
  })
  await check('Unauthenticated account route retains login boundary', async () => {
    await page.goto(base + '/account/settings', { waitUntil: 'domcontentloaded' })
    await page.waitForURL('**/login?**')
    assert.equal(await page.locator('.workspace-shell').count(), 0)
    assert(new URL(page.url()).searchParams.get('next')?.includes('/account'))
  })
} finally {
  await writeFile(join(output, 'results.json'), JSON.stringify({ date: new Date().toISOString(), base, isolation: 'new Chromium incognito context; no storageState/profile imported', limits: ['No real authenticated account', 'No AI/provider backend or booking calls', 'Root font 32px is text resizing, not native browser zoom'], results, errors, forbidden }, null, 2))
  await browser.close()
}
if (results.some(r => r.status === 'FAIL')) process.exitCode = 1
