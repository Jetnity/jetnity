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
import { refundJournalCursor } from './refund-journal'

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

async function textScale(page: Page, factor: number) {
  await page.evaluate(async (scale) => {
    document.documentElement.style.fontSize = `${16 * scale}px`
    // Wait for font reflow and finite CSS transitions without disabling them.
    // A stuck transition fails explicitly; infinite loading spinners are excluded.
    let timeout: number | undefined
    try {
      await Promise.race([
        (async () => {
          await new Promise<void>((resolve) => requestAnimationFrame(() => requestAnimationFrame(() => resolve())))
          await Promise.allSettled(document.getAnimations().filter((animation) => {
            const end = animation.effect?.getComputedTiming().endTime
            return animation.playState === 'running' && typeof end === 'number' && Number.isFinite(end)
          }).map((animation) => animation.finished))
        })(),
        new Promise<never>((_resolve, reject) => {
          timeout = window.setTimeout(() => reject(new Error(`Text scale ${scale}: layout transitions did not settle within 3000ms`)), 3000)
        }),
      ])
    } finally {
      if (timeout !== undefined) window.clearTimeout(timeout)
    }
  }, factor)
}

const note = (n: number, payment = 'payment-A') => ({
  id: `10000000-0000-4000-8000-${String(n).padStart(12, '0')}`, payment_id: payment,
  amount_chf: '10.2300', reason: `Synthetischer Grund ${n}`, created_at: '2026-11-15T10:00:00.123456+00:00',
})
const data = (rows: ReturnType<typeof note>[], paymentId = '', more = false) => ({
  rows, payment_id: paymentId, loaded_at: '2026-11-15T12:00:00Z',
  next_cursor: more ? refundJournalCursor(rows.at(-1)!, paymentId) : null,
})
async function journal(width = 1280) {
  const page = await open('/admin/payments', width)
  await page.getByRole('button', { name: 'Erstattungsnotizen', exact: true }).click()
  await page.getByRole('heading', { name: 'Gespeicherte Erstattungsnotizen', exact: true }).waitFor()
  return page
}
async function turn(page: Page) {
  await page.evaluate(() => new Promise<void>(resolve => requestAnimationFrame(() => requestAnimationFrame(() => resolve()))))
}
async function onlyReads(page: Page) {
  const calls = await page.evaluate(() => window.__adminCompletion.calls())
  assert.ok(calls.every(call => call.method === 'GET'))
}

for (const width of [320, 390, 1280]) {
  test(`Refund journal keeps exact values and controls usable at ${width}px and 200% text`, { timeout: 30_000 }, async () => {
    const page = await journal(width)
    try {
      const rows = Array.from({ length: 25 }, (_, i) => note(50 - i, `payment-${'x'.repeat(170)}`))
      rows[0].amount_chf = '9007199254740993.01'
      rows[0].reason = '<script>synthetic unsafe markup</script>\n' + 'Ein langer gespeicherter Grund '.repeat(25)
      rows[1].amount_chf = '10.2301'
      await respond(page, await pending(page, '/refunds'), 200, data(rows, '', true))
      const list = page.getByRole('list', { name: 'Gespeicherte Notizen' })
      await list.getByRole('listitem').last().waitFor()
      assert.equal(await list.getByRole('listitem').count(), 25)
      assert.match(await list.innerText(), /9[’']007[’']199[’']254[’']740[’']993\.01 CHF/)
      assert.match(await list.innerText(), /10\.2301/)
      assert.match(await list.innerText(), /Gespeicherten Betrag prüfen/)
      assert.equal(await list.locator('script').count(), 0)
      for (const factor of [1, 2]) {
        await textScale(page, factor)
        const bounds = await page.evaluate(() => ({ viewport: innerWidth, page: document.documentElement.scrollWidth }))
        assert.ok(bounds.page <= bounds.viewport + 1, JSON.stringify({ width, factor, ...bounds }))
        for (const name of ['Filtern', 'Zurücksetzen', 'Journal aktualisieren', 'Weitere Notizen laden']) {
          const control = page.getByRole('button', { name, exact: true })
          const box = await control.boundingBox()
          assert.ok(box && box.x >= 0 && box.x + box.width <= width + 1 && box.height >= 44, `${name}/${width}/${factor}`)
          const overflow = await control.evaluate(button => {
            const frame = button.getBoundingClientRect(), label = button.querySelector(':scope > span:last-child')?.getBoundingClientRect()
            return Boolean(label && (label.left < frame.left || label.right > frame.right + 1 || label.top < frame.top || label.bottom > frame.bottom + 1))
          })
          assert.equal(overflow, false, `${name} label must remain inside button`)
        }
      }
      await onlyReads(page)
    } finally { await page.close() }
  })
}

test('journal distinguishes initial failure, real empty and filtered empty; Enter and reset work', { timeout: 30_000 }, async () => {
  const page = await journal(320)
  try {
    await respond(page, await pending(page, '/refunds'), 503, { message: 'Synthetischer Ausfall' })
    await page.getByText('Synthetischer Ausfall', { exact: true }).waitFor()
    await textScale(page, 2)
    assert.equal(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth + 1), true)
    const retryBox = await page.getByRole('button', { name: 'Erneut versuchen', exact: true }).boundingBox()
    assert.ok(retryBox && retryBox.height >= 44 && retryBox.x >= 0 && retryBox.x + retryBox.width <= 321)
    assert.doesNotMatch(await page.locator('main').innerText(), /Keine Erstattungsnotizen/)
    await page.getByRole('button', { name: 'Erneut versuchen', exact: true }).click()
    await respond(page, await pending(page, '/refunds'), 200, data([]))
    await page.getByText('Keine Erstattungsnotizen vorhanden.', { exact: true }).waitFor()
    assert.equal(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth + 1), true)
    await page.getByLabel('Exakte Zahlungs-ID', { exact: true }).fill('payment-B')
    await page.getByLabel('Exakte Zahlungs-ID', { exact: true }).press('Enter')
    const filtered = await pending(page, '/refunds')
    assert.equal(new URL((await page.evaluate(i => window.__adminCompletion.calls()[i], filtered)).url, origin).searchParams.get('payment_id'), 'payment-B')
    await respond(page, filtered, 200, data([], 'payment-B'))
    await page.getByText('Keine Erstattungsnotizen für diese Zahlungs-ID gefunden.', { exact: true }).waitFor()
    await page.getByRole('button', { name: 'Zurücksetzen', exact: true }).click()
    const reset = await pending(page, '/refunds')
    assert.equal(await page.getByLabel('Exakte Zahlungs-ID', { exact: true }).inputValue(), '')
    assert.equal(new URL((await page.evaluate(i => window.__adminCompletion.calls()[i], reset)).url, origin).search, '')
    await respond(page, reset, 200, data([note(1)]))
    await page.getByText(note(1).id, { exact: true }).waitFor()
    await onlyReads(page)
  } finally { await page.close() }
})

test('next-page retry preserves rows and cursor while unsaved filter text never leaks into the request', { timeout: 30_000 }, async () => {
  const page = await journal()
  try {
    await respond(page, await pending(page, '/refunds'), 200, data(Array.from({ length: 25 }, (_, i) => note(50 - i)), '', true))
    await page.getByRole('button', { name: 'Weitere Notizen laden' }).waitFor()
    await page.getByLabel('Exakte Zahlungs-ID', { exact: true }).fill('payment-B')
    const beforeDoubleClick = await page.evaluate(() => window.__adminCompletion.calls().length)
    await page.getByRole('button', { name: 'Weitere Notizen laden' }).evaluate(button => {
      if (!(button instanceof HTMLButtonElement)) throw new Error('Expected a button')
      button.click(); button.click()
    })
    const first = await pending(page, '/refunds')
    assert.equal(await page.evaluate(() => window.__adminCompletion.calls().length), beforeDoubleClick + 1)
    const firstUrl = (await page.evaluate(i => window.__adminCompletion.calls()[i], first)).url
    assert.equal(new URL(firstUrl, origin).searchParams.has('payment_id'), false)
    await respond(page, first, 503, { message: 'Folgeseite vorübergehend nicht erreichbar' })
    await page.getByText('Folgeseite vorübergehend nicht erreichbar', { exact: true }).waitFor()
    assert.equal(await page.getByRole('list', { name: 'Gespeicherte Notizen' }).getByRole('listitem').count(), 25)
    await page.getByRole('button', { name: 'Erneut versuchen', exact: true }).click()
    const retry = await pending(page, '/refunds')
    assert.equal((await page.evaluate(i => window.__adminCompletion.calls()[i], retry)).url, firstUrl)
    await respond(page, retry, 200, data([note(25)]))
    await page.getByText(note(25).id, { exact: true }).waitFor()
    assert.equal(await page.getByRole('list', { name: 'Gespeicherte Notizen' }).getByRole('listitem').count(), 26)
    assert.equal(await page.getByRole('button', { name: 'Weitere Notizen laden' }).count(), 0)
    assert.equal(await page.getByLabel('Exakte Zahlungs-ID', { exact: true }).inputValue(), 'payment-B')
    await onlyReads(page)
  } finally { await page.close() }
})

test('an overlong pasted payment ID is rejected visibly without truncation or a new GET', { timeout: 30_000 }, async () => {
  const page = await journal(390)
  try {
    await respond(page, await pending(page, '/refunds'), 200, data([note(1)]))
    await page.getByText(note(1).id, { exact: true }).waitFor()
    const before = await page.evaluate(() => window.__adminCompletion.calls().length)
    const input = page.getByLabel('Exakte Zahlungs-ID', { exact: true })
    await input.fill('x'.repeat(201))
    await input.press('Enter')
    await page.getByText('Die Zahlungs-ID darf höchstens 200 Zeichen und keine Steuerzeichen enthalten.', { exact: true }).waitFor()
    assert.equal(await input.inputValue(), 'x'.repeat(201))
    assert.equal(await input.getAttribute('aria-invalid'), 'true')
    assert.equal(await page.evaluate(() => window.__adminCompletion.calls().length), before)
    assert.equal(await page.getByText(note(1).id, { exact: true }).count(), 1)
    assert.doesNotMatch(await page.locator('main').innerText(), /Die Aktualisierung ist fehlgeschlagen|Die angezeigten Daten sind älter/)
    await onlyReads(page)
  } finally { await page.close() }
})

test('filter changes hide old context immediately and ignore old append responses', { timeout: 30_000 }, async () => {
  const page = await journal()
  try {
    await respond(page, await pending(page, '/refunds'), 200, data(Array.from({ length: 25 }, (_, i) => note(50 - i)), '', true))
    await page.getByRole('button', { name: 'Weitere Notizen laden' }).click()
    const old = await pending(page, '/refunds')
    await page.getByLabel('Exakte Zahlungs-ID', { exact: true }).fill('payment-B')
    await page.getByRole('button', { name: 'Filtern', exact: true }).click()
    const fresh = await pending(page, '/refunds')
    assert.equal(await page.getByRole('list', { name: 'Gespeicherte Notizen' }).count(), 0)
    await respond(page, fresh, 200, data([note(10, 'payment-B')], 'payment-B'))
    await page.getByText(note(10).id, { exact: true }).waitFor()
    await respond(page, old, 200, data([note(25)]))
    await turn(page)
    assert.equal(await page.getByText(note(25).id, { exact: true }).count(), 0)
    assert.equal(await page.getByText('payment-A', { exact: true }).count(), 0)
    await onlyReads(page)
  } finally { await page.close() }
})

for (const status of [401, 403]) {
  test(`journal ${status} headers clear all payment data despite a stalled body and late success`, { timeout: 30_000 }, async () => {
    const page = await journal(390)
    try {
      await respond(page, await pending(page, '/refunds'), 200, data([note(50)]))
      await page.getByText(note(50).id, { exact: true }).waitFor()
      await page.getByRole('button', { name: 'Journal aktualisieren' }).click()
      const old = await pending(page, '/refunds')
      await page.getByRole('button', { name: 'Journal aktualisieren' }).click()
      await respond(page, await pending(page, '/refunds'), status, null, true)
      await page.getByRole('heading', { name: 'Zugriff auf Zahlungsdaten nicht mehr bestätigt' }).waitFor()
      await respond(page, old, 200, data([note(99)]))
      await turn(page)
      assert.equal(await page.getByText(note(50).id, { exact: true }).count(), 0)
      assert.equal(await page.getByText(note(99).id, { exact: true }).count(), 0)
      assert.equal(await page.getByRole('button', { name: 'Lokal vermerken' }).count(), 0)
      await page.getByRole('button', { name: 'Sitzung erneut prüfen' }).click()
      await page.getByRole('button', { name: 'Erstattungsnotizen', exact: true }).click()
      await respond(page, await pending(page, '/refunds'), 200, data([note(1)]))
      await page.getByText(note(1).id, { exact: true }).waitFor()
      await onlyReads(page)
    } finally { await page.close() }
  })

  test(`older or unmounted journal ${status} cannot deny a newer valid view`, { timeout: 30_000 }, async () => {
    const page = await journal()
    try {
      const old = await pending(page, '/refunds')
      await page.getByRole('button', { name: 'Journal aktualisieren' }).click()
      await respond(page, await pending(page, '/refunds'), 200, data([note(20)]))
      await page.getByText(note(20).id, { exact: true }).waitFor()
      await respond(page, old, status, null, true)
      await turn(page)
      assert.equal(await page.getByRole('heading', { name: 'Zugriff auf Zahlungsdaten nicht mehr bestätigt' }).count(), 0)
      await page.getByRole('button', { name: 'Journal aktualisieren' }).click()
      const unmounted = await pending(page, '/refunds')
      await page.getByRole('button', { name: 'Transaktionen', exact: true }).click()
      await respond(page, await pending(page, '/list'), 200, { rows: [], next_cursor: null })
      await respond(page, unmounted, status, null, true)
      await turn(page)
      assert.equal(await page.getByRole('heading', { name: 'Zugriff auf Zahlungsdaten nicht mehr bestätigt' }).count(), 0)
      assert.equal(await page.getByRole('heading', { name: 'Gespeicherte Erstattungsnotizen' }).count(), 0)
      await onlyReads(page)
    } finally { await page.close() }
  })
}

test('malformed responses and duplicate appends preserve the prior journal without a false success', { timeout: 30_000 }, async () => {
  const page = await journal()
  try {
    await respond(page, await pending(page, '/refunds'), 200, data(Array.from({ length: 25 }, (_, i) => note(50 - i)), '', true))
    await page.getByRole('button', { name: 'Weitere Notizen laden' }).click()
    await respond(page, await pending(page, '/refunds'), 200, data([note(26)]))
    await page.getByRole('alert').waitFor()
    assert.equal(await page.getByRole('list', { name: 'Gespeicherte Notizen' }).getByRole('listitem').count(), 25)
    await page.getByRole('button', { name: 'Journal aktualisieren' }).click()
    await respond(page, await pending(page, '/refunds'), 200, { unexpected: 'not a journal' })
    await page.getByRole('alert').waitFor()
    assert.equal(await page.getByRole('list', { name: 'Gespeicherte Notizen' }).getByRole('listitem').count(), 25)
    assert.doesNotMatch(await page.locator('main').innerText(), /Keine Erstattungsnotizen vorhanden/)
    await onlyReads(page)
  } finally { await page.close() }
})

