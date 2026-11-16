// Real SecurityWidget and CSS; the existing harness intercepts every security
// request. These are synthetic operations, never hosted blocklist writes.
import assert from 'node:assert/strict'
import { after, before, test } from 'node:test'
import { createServer, type Server } from 'node:http'
import type { AddressInfo } from 'node:net'
import { createRequire } from 'node:module'
import { readFileSync } from 'node:fs'
import { join } from 'node:path'
import * as esbuild from 'esbuild'
import { chromium, type Browser, type Page } from 'playwright'
import type {} from '@/scripts/admin-security-console-completion-1/harness'

let server: Server | undefined
let browser: Browser | undefined
let origin = ''
const pageErrors = new Map<Page, string[]>()
const IP = '203.0.113.10'
const BLOCKED_IP = '203.0.113.11'

function payload(marker: string) {
  const created_at = new Date().toISOString()
  return {
    events: [{ id: marker, type: 'note', ip: IP, user_id: null, detail: marker, created_at }],
    blocklist: [{ ip: BLOCKED_IP, reason: marker, created_at }],
  }
}

before(async () => {
  const require = createRequire(import.meta.url)
  const from = join(process.cwd(), 'styles/globals.css')
  const [bundle, css] = await Promise.all([
    esbuild.build({
      absWorkingDir: process.cwd(), entryPoints: ['scripts/admin-security-console-completion-1/harness.tsx'],
      bundle: true, write: false, format: 'iife', platform: 'browser', jsx: 'automatic',
      alias: { '@': process.cwd(), 'server-only': join(process.cwd(), 'scripts/admin-security-console-completion-1/server-only-stub.ts') },
      define: { 'process.env.NODE_ENV': '"development"' }, banner: { js: 'var __name=(target)=>target;' },
      plugins: [{
        name: 'security-css-module',
        setup(build) {
          build.onLoad({ filter: /\.module\.css$/ }, args => {
            const source = readFileSync(args.path, 'utf8')
            const names = [...new Set([...source.matchAll(/\.([A-Za-z_][\w-]*)/g)].map(match => match[1]))]
            return {
              contents: `const style=document.createElement('style');style.textContent=${JSON.stringify(source)};document.head.appendChild(style);export default ${JSON.stringify(Object.fromEntries(names.map(name => [name, name])))};`,
              loader: 'js',
            }
          })
        },
      }],
    }),
    require('postcss')([require('tailwindcss/nesting')(), require('tailwindcss')(require(join(process.cwd(), 'tailwind.config.js'))), require('autoprefixer')()])
      .process(readFileSync(from, 'utf8'), { from }),
  ])
  const html = `<!doctype html><html lang="de"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"><title>Security denial proof</title><style>${css.css.replaceAll('</style', '<\\/style')}</style></head><body><div id="root"></div><script>${bundle.outputFiles[0].text.replaceAll('</script', '<\\/script')}</script></body></html>`
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
  if (server?.listening) await new Promise<void>((resolve, reject) => server!.close(error => error ? reject(error) : resolve()))
})

async function pending(page: Page, method = 'GET', suffix = '/list', after = 0) {
  await page.waitForFunction(({ method, suffix, after }) => window.__securityAudit?.pending().some(call => call.id > after && call.method === method && call.url.endsWith(suffix)), { method, suffix, after })
  return page.evaluate(({ method, suffix, after }) => window.__securityAudit!.pending().find(call => call.id > after && call.method === method && call.url.endsWith(suffix))!.id, { method, suffix, after })
}

async function startRead(page: Page, button = 'Aktualisieren') {
  const previous = await page.evaluate(() => Math.max(0, ...window.__securityAudit!.calls().map(call => call.id)))
  await page.getByRole('button', { name: button, exact: true }).click()
  return pending(page, 'GET', '/list', previous)
}

async function release(page: Page, id: number, status: number, body: unknown) {
  await page.evaluate(input => window.__securityAudit!.release(input.id, input.status, input.body), { id, status, body })
}

async function headers(page: Page, id: number, status: number, cancelMode: 'resolve' | 'reject' | 'stall' = 'resolve') {
  await page.evaluate(input => window.__securityAudit!.releaseHeaders(input.id, input.status, input.cancelMode), { id, status, cancelMode })
}

async function settle(page: Page) {
  await page.evaluate(() => new Promise<void>(resolve => requestAnimationFrame(() => requestAnimationFrame(() => resolve()))))
}

async function open() {
  const page = await browser!.newPage({ viewport: { width: 390, height: 900 } })
  const errors: string[] = []
  pageErrors.set(page, errors)
  page.on('pageerror', error => errors.push(String(error)))
  await page.addInitScript(() => { window.__securityAuditControlledPolls = true })
  await page.route('**/*', route => route.request().url().startsWith(origin) ? route.continue() : route.abort())
  await page.goto(origin)
  await release(page, await pending(page), 200, payload('INITIAL_PRIVATE_MARKER'))
  await page.locator('[data-security-read-state="angenommen"]').waitFor()
  return page
}

async function close(page: Page) {
  await page.close()
  assert.deepEqual(pageErrors.get(page), [])
  pageErrors.delete(page)
}

async function denied(page: Page, id: number) {
  await page.locator('[data-security-read-state="verweigert"]').waitFor()
  assert.equal(await page.locator('[data-security-writes="disabled"]').count(), 1)
  assert.equal(await page.locator('[data-security-ip]').count(), 0)
  assert.equal(await page.locator('[data-security-operation-ip]').count(), 0)
  assert.equal(await page.locator('[data-security-kpi-value]:not([data-security-kpi-value=""])').count(), 0)
  assert.doesNotMatch(await page.locator('body').textContent() ?? '', /INITIAL_PRIVATE_MARKER/)
  const receipt = await page.evaluate(id => window.__securityAudit!.bodyReads().find(call => call.id === id), id)
  assert.deepEqual(receipt, { id, jsonReads: 0, cancelled: true })
}

async function startBlock(page: Page, ip = IP) {
  await page.getByLabel('IP-Adresse', { exact: true }).fill(ip)
  await page.getByLabel('Grund', { exact: true }).fill('SYNTHETIC_OPERATION_REASON')
  await page.getByRole('button', { name: 'Eintrag hinzufügen', exact: true }).click()
  return pending(page, 'POST', '/block')
}

async function recover(page: Page) {
  await release(page, await startRead(page, 'Erneut lesen'), 200, payload('RECOVERED_PRIVATE_MARKER'))
  await page.locator('[data-security-read-state="angenommen"]').waitFor()
}

for (const status of [401, 403]) {
  test(`Security GET ${status} hides data before its body and tolerates stalled or rejected cancellation`, { timeout: 30_000 }, async () => {
    const page = await open()
    try {
      const id = await startRead(page)
      await headers(page, id, status, status === 401 ? 'stall' : 'reject')
      await denied(page, id)
      await recover(page)
      // Exercise the actual polling callback explicitly without wall-clock races.
      await page.evaluate(() => window.__securityAudit!.poll())
      await release(page, await pending(page), 200, payload('POLLED_CURRENT_MARKER'))
      await page.getByText('POLLED_CURRENT_MARKER', { exact: true }).first().waitFor()
      assert.equal(await page.evaluate(() => window.__securityAudit!.calls().filter(call => call.method === 'POST').length), 0)
    } finally { await close(page) }
  })
  for (const action of ['block', 'unblock'] as const) {
    test(`Security ${action} ${status} clears records and operation details before body completion`, { timeout: 30_000 }, async () => {
      const page = await open()
      try {
        let id: number
        if (action === 'block') id = await startBlock(page)
        else {
          await page.locator(`[data-security-unblock="${BLOCKED_IP}"]`).click()
          id = await pending(page, 'POST', '/unblock')
        }
        await page.locator('[data-security-operation-state="ausstehend"]').waitFor()
        await headers(page, id, status)
        await denied(page, id)
        await recover(page)
        assert.equal(await page.evaluate(() => window.__securityAudit!.calls().filter(call => call.method === 'POST').length), 1)
      } finally { await close(page) }
    })
  }
}

test('two denied reads with unresolved bodies do not consume the two read slots', { timeout: 30_000 }, async () => {
  const page = await open()
  try {
    for (const status of [401, 403]) {
      const id = await startRead(page)
      await headers(page, id, status, 'stall')
      await denied(page, id)
    }
    await recover(page)
  } finally { await close(page) }
})

test('an older accepted read body cannot restore records after a write denial', { timeout: 30_000 }, async () => {
  const page = await open()
  try {
    const old = await startRead(page)
    await headers(page, old, 200)
    await page.waitForFunction(id => window.__securityAudit!.bodyReads().find(call => call.id === id)?.jsonReads === 1, old)
    const write = await startBlock(page)
    await headers(page, write, 403)
    await denied(page, write)
    await page.evaluate(({ id, body }) => window.__securityAudit!.finishBody(id, body), { id: old, body: payload('FORBIDDEN_OLD_READ') })
    await settle(page)
    assert.equal(await page.locator('[data-security-read-state="verweigert"]').count(), 1)
    assert.doesNotMatch(await page.locator('body').textContent() ?? '', /FORBIDDEN_OLD_READ/)
    await recover(page)
  } finally { await close(page) }
})

test('a stale denied read cannot hide a newer accepted read', { timeout: 30_000 }, async () => {
  const page = await open()
  try {
    const old = await startRead(page)
    const current = await startRead(page)
    await release(page, current, 200, payload('NEWER_ACCEPTED_READ'))
    await page.getByText('NEWER_ACCEPTED_READ', { exact: true }).first().waitFor()
    await headers(page, old, 401)
    await settle(page)
    assert.equal(await page.locator('[data-security-read-state="angenommen"]').count(), 1)
    assert.match(await page.locator('body').textContent() ?? '', /NEWER_ACCEPTED_READ/)
  } finally { await close(page) }
})

test('late write body cannot settle a new operation of the same IP or trigger another read', { timeout: 30_000 }, async () => {
  const page = await open()
  try {
    const old = await startBlock(page)
    await headers(page, old, 200)
    await page.waitForFunction(id => window.__securityAudit!.bodyReads().find(call => call.id === id)?.jsonReads === 1, old)
    const deniedRead = await startRead(page)
    await headers(page, deniedRead, 403)
    await denied(page, deniedRead)
    await recover(page)
    const current = await startBlock(page)
    assert.notEqual(current, old)
    const gets = await page.evaluate(() => window.__securityAudit!.calls().filter(call => call.method === 'GET').length)
    await page.evaluate(id => window.__securityAudit!.finishBody(id, { ok: true }), old)
    await settle(page)
    assert.equal(await page.locator(`[data-security-operation-ip="${IP}"][data-security-operation-state="ausstehend"]`).count(), 1)
    assert.equal(await page.evaluate(() => window.__securityAudit!.calls().filter(call => call.method === 'GET').length), gets)
    assert.equal(await page.evaluate(() => window.__securityAudit!.calls().filter(call => call.method === 'POST').length), 2)
  } finally { await close(page) }
})

test('a delayed accepted write body after unmount cannot trigger a follow-up read', { timeout: 30_000 }, async () => {
  const page = await open()
  try {
    const id = await startBlock(page)
    await headers(page, id, 200)
    await page.waitForFunction(id => window.__securityAudit!.bodyReads().find(call => call.id === id)?.jsonReads === 1, id)
    await page.evaluate(() => window.__securityAudit!.unmount())
    const calls = await page.evaluate(() => window.__securityAudit!.calls().length)
    await page.evaluate(id => window.__securityAudit!.finishBody(id, { ok: true }), id)
    await page.evaluate(() => window.__securityAudit!.poll())
    await settle(page)
    assert.equal(await page.locator('[data-security-read-state]').count(), 0)
    assert.equal(await page.evaluate(() => window.__securityAudit!.calls().length), calls)
  } finally { await close(page) }
})
