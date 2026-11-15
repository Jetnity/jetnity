// Mounted production components with synthetic data only. This test is picked
// up by the existing core CI glob; no hosted auth or provider call is involved.
import assert from 'node:assert/strict'
import { createServer, type Server } from 'node:http'
import { createRequire } from 'node:module'
import { readFileSync } from 'node:fs'
import { join } from 'node:path'
import { before, after, test } from 'node:test'
import type { AddressInfo } from 'node:net'
import * as esbuild from 'esbuild'
import { chromium, type Browser, type Page } from 'playwright'
// Include fixture control types without executing the browser-only entry.
import type {} from '@/scripts/admin-operations-completion/harness'

let server: Server | undefined
let browser: Browser | undefined
let origin = ''

before(async () => {
  const require = createRequire(import.meta.url)
  const postcss = require('postcss')
  const nesting = require('tailwindcss/nesting')
  const tailwind = require('tailwindcss')
  const autoprefixer = require('autoprefixer')
  const from = join(process.cwd(), 'styles/globals.css')
  const [bundle, css] = await Promise.all([
    esbuild.build({
      absWorkingDir: process.cwd(), entryPoints: ['scripts/admin-operations-completion/harness.tsx'],
      bundle: true, write: false, format: 'iife', platform: 'browser', jsx: 'automatic',
      alias: { '@': process.cwd() }, define: { 'process.env.NODE_ENV': '"development"' },
      banner: { js: 'var __name=(target)=>target;' },
    }),
    postcss([nesting(), tailwind(require(join(process.cwd(), 'tailwind.config.js'))), autoprefixer()]).process(readFileSync(from, 'utf8'), { from }),
  ])
  const html = `<!doctype html><html lang="de"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"><title>Admin component proof</title><style>${css.css.replaceAll('</style', '<\\/style')}</style></head><body><div id="root"></div><script>${bundle.outputFiles[0].text.replaceAll('</script', '<\\/script')}</script></body></html>`
  server = createServer((_request, response) => { response.writeHead(200, { 'Content-Type': 'text/html; charset=utf-8' }); response.end(html) })
  await new Promise<void>((resolve, reject) => { server!.once('error', reject); server!.listen(0, '127.0.0.1', resolve) })
  origin = `http://127.0.0.1:${(server.address() as AddressInfo).port}`
  try {
    browser = await chromium.launch({ headless: true, args: ['--no-sandbox', '--disable-dev-shm-usage'] })
  } catch (error) {
    if (!(error instanceof Error) || !/Executable doesn't exist/.test(error.message)) throw error
    browser = await chromium.launch({ channel: 'chrome', headless: true, args: ['--no-sandbox', '--disable-dev-shm-usage'] })
  }
}, { timeout: 90_000 })

after(async () => {
  await browser?.close()
  if (server?.listening) await new Promise<void>((resolve, reject) => server!.close((error) => error ? reject(error) : resolve()))
})

async function open(path: string, width = 1280) {
  const page = await browser!.newPage({ viewport: { width, height: 900 } })
  await page.goto(`${origin}${path}`)
  await page.waitForFunction(() => Boolean(window.__adminCompletion))
  return page
}

async function pending(page: Page, path: string): Promise<number> {
  await page.waitForFunction((needle) => window.__adminCompletion.calls().some((call) => call.url.includes(needle) && !call.aborted && !call.settled), path)
  return page.evaluate((needle) => window.__adminCompletion.calls().findIndex((call) => call.url.includes(needle) && !call.aborted && !call.settled), path)
}

async function respond(page: Page, id: number, status: number, body: unknown, stalledBody = false) {
  await page.evaluate(({ id, status, body, stalledBody }) => window.__adminCompletion.respond(id, status, body, stalledBody), { id, status, body, stalledBody })
}

const payment = (id: string) => ({ id, status: 'paid', amount_chf: 123.5, created_at: '2026-11-15T10:00:00Z', customer_email: 'synthetic@example.test' })
const webhook = (id: string) => ({ id, type: 'synthetic.event', created_at: '2026-11-15T10:00:00Z' })
const breakdown = { days: [{ date: '2026-11-15', revenue_chf: 123.5, orders: 1 }] }

for (const width of [320, 390, 1280]) {
  test(`Analytics is usable at ${width}px, including large text and exact daily values`, { timeout: 30_000 }, async () => {
    const page = await open('/admin/analytics?tage=90&state=large', width)
    try {
      await page.getByRole('heading', { name: 'Reiseaktivität', exact: true }).waitFor()
      await page.getByText('Tageswerte anzeigen', { exact: true }).click()
      assert.equal(await page.locator('tbody tr').count(), 90)
      for (const scale of [1, 2]) {
        await page.evaluate((factor) => { document.documentElement.style.fontSize = `${16 * factor}px` }, scale)
        const dimensions = await page.evaluate(() => ({ viewport: window.innerWidth, page: document.documentElement.scrollWidth }))
        assert.ok(dimensions.page <= dimensions.viewport + 1, `page overflow: ${JSON.stringify(dimensions)}`)
        for (const name of ['7 Tage', '30 Tage', '90 Tage']) {
          const link = page.getByRole('link', { name, exact: true })
          const box = await link.boundingBox()
          assert.ok(box && box.width >= 44 && box.height >= 44 && box.x >= 0 && box.x + box.width <= width + 1)
        }
        const refresh = page.getByRole('button', { name: 'Ansicht aktualisieren' })
        const bounds = await refresh.boundingBox()
        assert.ok(bounds && bounds.x >= 0 && bounds.x + bounds.width <= width + 1 && bounds.height >= 44)
      }
      await page.getByRole('link', { name: '7 Tage', exact: true }).focus()
      await page.keyboard.press('Enter')
      await page.waitForURL('**/admin/analytics?tage=7')
      await page.locator('tbody tr').last().waitFor({ state: 'attached' })
      assert.equal(await page.locator('tbody tr').count(), 7)
      const documentBeforeRefresh = await page.evaluate(() => window.__adminCompletion.documentId)
      await Promise.all([
        page.waitForFunction((previous) => Boolean(window.__adminCompletion?.documentId && window.__adminCompletion.documentId !== previous), documentBeforeRefresh),
        page.getByRole('button', { name: 'Ansicht aktualisieren' }).click(),
      ])
      await page.getByRole('heading', { name: 'Reiseaktivität', exact: true }).waitFor()
      assert.ok(page.url().endsWith('?tage=7'))
    } finally { await page.close() }
  })
}

test('Analytics keeps unavailable and partial failure distinct from no trips', { timeout: 30_000 }, async () => {
  const page = await open('/admin/analytics?state=unavailable')
  try {
    await page.getByRole('heading', { name: 'Reiseaktivität', exact: true }).waitFor()
    assert.equal(await page.locator('dd').count(), 0)
    assert.doesNotMatch(await page.locator('main').innerText(), /keine neuen Reisen erfasst/)
    await page.goto(`${origin}/admin/analytics?tage=7&state=partial`)
    await page.getByText('Synthetischer Quellausfall', { exact: true }).waitFor()
    assert.equal(await page.locator('tbody tr').count(), 7)
  } finally { await page.close() }
})

for (const status of [401, 403]) for (const card of ['overview', 'transactions', 'webhooks'] as const) {
  test(`Payments ${card} clears visible records immediately on ${status}, even with stalled body`, { timeout: 30_000 }, async () => {
    const page = await open('/admin/payments', 390)
    try {
      await respond(page, await pending(page, '/breakdown'), 200, breakdown)
      await page.getByText('CHF 123.5', { exact: true }).waitFor()
      if (card !== 'overview') {
        await page.getByRole('button', { name: card === 'transactions' ? 'Transaktionen' : 'Webhooks', exact: true }).click()
        const endpoint = card === 'transactions' ? '/list' : '/webhooks'
        await respond(page, await pending(page, endpoint), 200, { rows: [card === 'transactions' ? payment('proof-private-row') : webhook('proof-private-row')], next_cursor: 'cursor-1' })
        await page.getByRole('cell', { name: 'proof-private-row', exact: true }).waitFor()
      }
      await page.getByRole('button', { name: card === 'transactions' ? 'Filtern' : 'Aktualisieren', exact: true }).click()
      await respond(page, await pending(page, card === 'overview' ? '/breakdown' : card === 'transactions' ? '/list' : '/webhooks'), status, null, true)
      await page.getByRole('heading', { name: 'Zugriff auf Zahlungsdaten nicht mehr bestätigt' }).waitFor()
      const text = await page.locator('main').innerText()
      assert.doesNotMatch(text, /proof-private-row|CHF 123|synthetic@example.test/)
      assert.equal(await page.getByRole('button', { name: 'Transaktionen', exact: true }).count(), 0)
      await page.getByRole('button', { name: 'Sitzung erneut prüfen' }).click()
      await pending(page, '/breakdown')
      assert.equal(await page.getByRole('heading', { name: 'Zugriff auf Zahlungsdaten nicht mehr bestätigt' }).count(), 0)
    } finally { await page.close() }
  })
}

test('late read cannot restore data after a newer denial', { timeout: 30_000 }, async () => {
  const page = await open('/admin/payments')
  try {
    await page.getByRole('button', { name: 'Transaktionen', exact: true }).click()
    const old = await pending(page, '/list')
    await page.getByRole('button', { name: 'Filtern', exact: true }).click()
    await respond(page, await pending(page, '/list'), 403, { error: 'Denied' })
    await page.getByRole('heading', { name: 'Zugriff auf Zahlungsdaten nicht mehr bestätigt' }).waitFor()
    await respond(page, old, 200, { rows: [payment('late-private-row')], next_cursor: null })
    await page.evaluate(() => new Promise<void>((resolve) => requestAnimationFrame(() => requestAnimationFrame(() => resolve()))))
    assert.doesNotMatch(await page.locator('main').innerText(), /late-private-row/)
  } finally { await page.close() }
})

test('unmounted card denial cannot replace the current card; transient failure marks retained values', { timeout: 30_000 }, async () => {
  const page = await open('/admin/payments')
  try {
    const old = await pending(page, '/breakdown')
    await page.getByRole('button', { name: 'Webhooks', exact: true }).click()
    await respond(page, await pending(page, '/webhooks'), 200, { rows: [webhook('current-webhook')], next_cursor: null })
    await page.getByRole('cell', { name: 'current-webhook', exact: true }).waitFor()
    await respond(page, old, 403, { error: 'Old denial' })
    await page.getByRole('button', { name: 'Aktualisieren', exact: true }).click()
    await respond(page, await pending(page, '/webhooks'), 503, { message: 'Synthetischer Ausfall' })
    await page.getByText('Die angezeigten Daten sind älter.', { exact: true }).waitFor()
    assert.equal(await page.getByRole('cell', { name: 'current-webhook', exact: true }).count(), 1)
  } finally { await page.close() }
})

test('webhook refresh replaces pages and pagination uses the new cursor', { timeout: 30_000 }, async () => {
  const page = await open('/admin/payments')
  try {
    await page.getByRole('button', { name: 'Webhooks', exact: true }).click()
    await respond(page, await pending(page, '/webhooks'), 200, { rows: [webhook('page-one')], next_cursor: 'old-cursor' })
    await page.getByRole('button', { name: 'Mehr laden', exact: true }).click()
    const second = await pending(page, '/webhooks')
    assert.match(await page.evaluate((id) => window.__adminCompletion.calls()[id].url, second), /cursor=old-cursor/)
    await respond(page, second, 200, { rows: [webhook('page-two')], next_cursor: null })
    await page.getByRole('cell', { name: 'page-two', exact: true }).waitFor()
    await page.getByRole('button', { name: 'Aktualisieren', exact: true }).click()
    const refresh = await pending(page, '/webhooks')
    assert.doesNotMatch(await page.evaluate((id) => window.__adminCompletion.calls()[id].url, refresh), /cursor=/)
    await respond(page, refresh, 200, { rows: [webhook('replacement-page')], next_cursor: 'new-cursor' })
    await page.getByRole('cell', { name: 'replacement-page', exact: true }).waitFor()
    assert.equal(await page.getByRole('cell', { name: 'page-two', exact: true }).count(), 0)
    await page.getByRole('button', { name: 'Mehr laden', exact: true }).click()
    assert.match(await page.evaluate((id) => window.__adminCompletion.calls()[id].url, await pending(page, '/webhooks')), /cursor=new-cursor/)
  } finally { await page.close() }
})

test('transaction pagination keeps the committed filter while the search field is edited', { timeout: 30_000 }, async () => {
  const page = await open('/admin/payments')
  try {
    await page.getByRole('button', { name: 'Transaktionen', exact: true }).click()
    await respond(page, await pending(page, '/list'), 200, { rows: [payment('initial-row')], next_cursor: 'confirmed-cursor' })
    await page.getByRole('textbox', { name: 'Transaktionen nach ID oder E-Mail suchen' }).fill('uncommitted')
    await page.getByRole('button', { name: 'Mehr laden', exact: true }).click()
    const append = await pending(page, '/list')
    const url = await page.evaluate((id) => window.__adminCompletion.calls()[id].url, append)
    assert.match(url, /cursor=confirmed-cursor/)
    assert.doesNotMatch(url, /q=/)
    await respond(page, append, 200, { rows: [payment('next-row')], next_cursor: null })
    await page.getByRole('button', { name: 'Filtern', exact: true }).click()
    const filtered = await pending(page, '/list')
    const filterUrl = await page.evaluate((id) => window.__adminCompletion.calls()[id].url, filtered)
    assert.match(filterUrl, /q=uncommitted/)
    assert.doesNotMatch(filterUrl, /cursor=/)
    await respond(page, filtered, 200, { rows: [payment('matching-row')], next_cursor: null })
    await page.getByRole('cell', { name: 'matching-row', exact: true }).waitFor()
    assert.equal(await page.getByRole('cell', { name: 'initial-row', exact: true }).count(), 0)
  } finally { await page.close() }
})
