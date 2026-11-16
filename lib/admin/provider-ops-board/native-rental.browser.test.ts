// Existing Operations harness, real components/CSS, synthetic reports only.
// Normal core CI runs this proof; no hosted Admin or provider is contacted.
import assert from 'node:assert/strict'
import { after, before, test } from 'node:test'
import { createServer, type Server } from 'node:http'
import type { AddressInfo } from 'node:net'
import { createRequire } from 'node:module'
import { readFileSync } from 'node:fs'
import { join } from 'node:path'
import * as esbuild from 'esbuild'
import { chromium, type Browser, type Page } from 'playwright'
import type {} from '@/scripts/admin-operations-evidence-lifecycle-completion-1/harness'
import { SYSTEM_HEALTH_AUDIT_BERICHT } from '@/lib/admin/system-health/fixtures'
import { PROVIDER_OPS_BOARD_AUDIT_BERICHT } from './fixtures'
import { bewerteProviderOps } from './bewertung'

declare global {
  interface Window {
    __rentalProof: {
      count: () => number
      respond: (id: number, status: number, body: unknown, stalled?: boolean) => void
      finishBody: (id: number, body: unknown) => void
      aborted: (id: number) => boolean
    }
  }
}

type Board = 'ops' | 'health'
let browser: Browser | undefined
let server: Server | undefined
let origin = ''

function report(board: Board) {
  const now = Date.now()
  const data = structuredClone(board === 'ops' ? PROVIDER_OPS_BOARD_AUDIT_BERICHT : SYSTEM_HEALTH_AUDIT_BERICHT)
  if (board === 'ops') (data as typeof PROVIDER_OPS_BOARD_AUDIT_BERICHT).items[0] = bewerteProviderOps([], now, { kind: 'configured' })
  data.checkedAt = new Date(now).toISOString()
  for (const item of data.items) {
    item.checkedAt = data.checkedAt
    item.freshness = { ...item.freshness, state: 'fresh', ageMs: 0 }
    for (const check of item.checks ?? []) check.freshness = { ...check.freshness, state: 'fresh', ageMs: 0 }
  }
  return data
}

before(async () => {
  const require = createRequire(import.meta.url)
  const from = join(process.cwd(), 'styles/globals.css')
  const [bundle, css] = await Promise.all([
    esbuild.build({
      absWorkingDir: process.cwd(), entryPoints: ['scripts/admin-operations-evidence-lifecycle-completion-1/harness.tsx'],
      bundle: true, write: false, format: 'iife', platform: 'browser', jsx: 'automatic',
      alias: { '@': process.cwd() }, define: { 'process.env.NODE_ENV': '"development"' },
      banner: { js: 'var __name=(target)=>target;' },
    }),
    require('postcss')([require('tailwindcss/nesting')(), require('tailwindcss')(require(join(process.cwd(), 'tailwind.config.js'))), require('autoprefixer')()])
      .process(readFileSync(from, 'utf8'), { from }),
  ])
  server = createServer((request, response) => {
    const board: Board = request.url?.includes('board=health') ? 'health' : 'ops'
    const initial = JSON.stringify({ board, anfang: report(board), endpunkt: '/synthetic-report', erlaubt: true, sichtbar: true }).replaceAll('<', '\\u003c')
    response.writeHead(200, { 'Content-Type': 'text/html; charset=utf-8' })
    response.end(`<!doctype html><html lang="de"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"><title>Operations proof</title><style>${css.css.replaceAll('</style', '<\\/style')}</style></head><body><div id="root"></div><script>window.__FALL__=${initial};${bundle.outputFiles[0].text.replaceAll('</script', '<\\/script')}</script></body></html>`)
  })
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
  if (server?.listening) await new Promise<void>((resolve, reject) => server!.close(error => error ? reject(error) : resolve()))
})

async function open(board: Board, width = 1280): Promise<Page> {
  const page = await browser!.newPage({ viewport: { width, height: 900 } })
  await page.goto(`${origin}/?board=${board}`)
  await page.evaluate(() => {
    const calls: Array<{ resolve: (response: Response) => void; body: (body: unknown) => void; aborted: boolean }> = []
    window.fetch = async (_input, init) => new Promise<Response>(resolve => {
      const call: (typeof calls)[number] = { resolve, body: () => {}, aborted: Boolean(init?.signal?.aborted) }
      init?.signal?.addEventListener('abort', () => { call.aborted = true })
      // Intentionally ignore abort: late-body safety must come from run identity.
      calls.push(call)
    })
    window.__rentalProof = {
      count: () => calls.length,
      respond: (id, status, body, stalled = false) => {
        const call = calls[id]
        const pending = new Promise<unknown>(resolve => { call.body = resolve })
        if (!stalled) call.body(body)
        call.resolve({ ok: status >= 200 && status < 300, status, json: () => pending } as Response)
      },
      finishBody: (id, body) => calls[id].body(body),
      aborted: id => calls[id].aborted,
    }
  })
  await page.locator('[data-operations-phase="aktuell"]').waitFor()
  return page
}

async function refresh(page: Page, count: number) {
  await page.getByRole('button', { name: 'Erneut prüfen', exact: true }).click()
  await page.waitForFunction(expected => window.__rentalProof.count() === expected, count)
}

for (const board of ['ops', 'health'] as const) for (const status of [401, 403]) {
  test(`${board} clears its report on ${status} headers while the body is stalled`, { timeout: 30_000 }, async () => {
    const page = await open(board)
    const cards = board === 'ops' ? '[data-ops-id]' : '[data-health-id]'
    try {
      assert.ok(await page.locator(cards).count() > 0)
      await refresh(page, 1)
      await page.evaluate(status => window.__rentalProof.respond(0, status, null, true), status)
      await page.locator('[data-operations-phase="verweigert"]').waitFor()
      assert.equal(await page.locator(cards).count(), 0)
      assert.equal(await page.getByRole('button', { name: 'Erneut prüfen', exact: true }).isDisabled(), false)
      await page.evaluate(() => window.__rentalProof.finishBody(0, { message: 'Synthetische aktuelle Zugriffsmeldung' }))
      await page.getByText('Synthetische aktuelle Zugriffsmeldung', { exact: true }).waitFor()
      const replay = report(board)
      replay.items[0].summary = 'FORBIDDEN_PROPS_REPLAY'
      await page.evaluate(data => window.__setze({ anfang: data }), replay)
      await page.evaluate(() => new Promise<void>(resolve => requestAnimationFrame(() => requestAnimationFrame(() => resolve()))))
      assert.equal(await page.locator(cards).count(), 0)
      assert.equal(await page.locator('[data-operations-phase="verweigert"]').count(), 1)
      assert.doesNotMatch(await page.locator('body').textContent() ?? '', /FORBIDDEN_PROPS_REPLAY/)
    } finally { await page.close() }
  })
}

for (const board of ['ops', 'health'] as const) {
  test(`${board} ignores a delayed denial body after a newer successful explicit read`, { timeout: 30_000 }, async () => {
    const page = await open(board)
    try {
      await refresh(page, 1)
      await page.evaluate(() => window.__rentalProof.respond(0, 403, null, true))
      await page.locator('[data-operations-phase="verweigert"]').waitFor()
      await refresh(page, 2)
      assert.equal(await page.evaluate(() => window.__rentalProof.aborted(0)), true)
      await page.evaluate(data => window.__rentalProof.respond(1, 200, data), report(board))
      await page.locator('[data-operations-phase="aktuell"]').waitFor()
      await page.evaluate(() => window.__rentalProof.finishBody(0, { message: 'STALE_DENIAL_MESSAGE' }))
      await page.evaluate(() => new Promise<void>(resolve => requestAnimationFrame(() => requestAnimationFrame(() => resolve()))))
      assert.equal(await page.locator('[data-operations-phase="aktuell"]').count(), 1)
      assert.doesNotMatch(await page.locator('body').innerText(), /STALE_DENIAL_MESSAGE/)
      assert.ok(await page.locator(board === 'ops' ? '[data-ops-id]' : '[data-health-id]').count() > 0)
    } finally { await page.close() }
  })
}

for (const width of [320, 390, 1280]) {
  test(`native rental reason stays visible and neutral at ${width}px and 200% text`, { timeout: 30_000 }, async () => {
    const page = await open('ops', width)
    try {
      const check = page.locator('[data-ops-check="native-rental-search"]')
      await check.getByText('Konfiguriert', { exact: true }).waitFor()
      assert.equal(await check.getAttribute('data-ops-green'), 'false')
      assert.match(await check.innerText(), /Schlüsselgültigkeit, Provider-Erreichbarkeit, Kontingent und Angebote wurden nicht geprüft/)
      for (const scale of [1, 2]) {
        await page.evaluate(async factor => {
          document.documentElement.style.fontSize = `${16 * factor}px`
          await new Promise<void>(resolve => requestAnimationFrame(() => requestAnimationFrame(() => resolve())))
        }, scale)
        const dimensions = await page.evaluate(() => ({ viewport: innerWidth, page: document.documentElement.scrollWidth }))
        assert.ok(dimensions.page <= dimensions.viewport + 1, JSON.stringify({ width, scale, ...dimensions }))
      }
      assert.equal(await page.evaluate(() => window.__rentalProof.count()), 0)
    } finally { await page.close() }
  })
}
