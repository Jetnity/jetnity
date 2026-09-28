#!/usr/bin/env node
// Actual PaymentsCenter / TransactionsCard harness for Admin Transaction Read Filter State 1.
// Fetch is a page-local stub. Payloads are synthetic. This is not a signed-in Admin session,
// not a physical device, and not Production acceptance. It does not call the refund route.

import assert from 'node:assert/strict'
import { createRequire } from 'node:module'
import { createServer } from 'node:http'
import { mkdirSync, readFileSync, writeFileSync } from 'node:fs'
import { dirname, join } from 'node:path'
import { fileURLToPath } from 'node:url'

import esbuild from 'esbuild'
import { chromium } from 'playwright'

const require = createRequire(import.meta.url)
const REPO = join(dirname(fileURLToPath(import.meta.url)), '..')
const EVIDENCE = join(REPO, 'docs/evidence/admin-transaction-read-filter-state-1')
const ARTIFACTS = '/opt/cursor/artifacts'
const OUT = join('/tmp', 'admin-transaction-read-filter-state-1-harness')
const BASELINE = process.argv.includes('--baseline')

mkdirSync(OUT, { recursive: true })
mkdirSync(EVIDENCE, { recursive: true })
mkdirSync(ARTIFACTS, { recursive: true })

const ergebnisse = []

function row(id, status, createdAt = '2026-09-01T10:00:00.000Z') {
  return {
    id,
    status,
    amount_chf: 18.5,
    created_at: createdAt,
    customer_email: 'ada@example.test',
  }
}

function pageBody(rows, cursor) {
  return { rows, next_cursor: cursor }
}

function parseCall(call) {
  const url = new URL(call, 'http://127.0.0.1')
  return {
    raw: `${url.pathname}${url.search}`,
    q: url.searchParams.get('q'),
    status: url.searchParams.get('status'),
    cursor: url.searchParams.get('cursor'),
  }
}

async function compileCss() {
  try {
    const postcss = (await import('postcss')).default
    const tailwindcss = (await import('tailwindcss')).default
    const nesting = (await import('tailwindcss/nesting/index.js')).default
    const autoprefixer = (await import('autoprefixer')).default
    const from = join(REPO, 'styles/globals.css')
    const input = readFileSync(from, 'utf8')
    const config = {
      ...require(join(REPO, 'tailwind.config.js')),
      content: [
        join(REPO, 'components/admin/payments/PaymentsCenter.tsx'),
        join(REPO, 'components/admin/Ladezustand.tsx'),
        join(REPO, 'components/ui/**/*.{js,ts,jsx,tsx}'),
        join(EVIDENCE, 'harness.tsx'),
      ],
    }
    const result = await postcss([nesting(), tailwindcss(config), autoprefixer()]).process(input, { from })
    return result.css
  } catch (error) {
    return `body{font-family:sans-serif;margin:16px}table{border-collapse:collapse}[hidden]{display:none}/* css fallback: ${String(error)} */`
  }
}

async function bundleHarness() {
  const outfile = join(OUT, 'harness.js')
  await esbuild.build({
    absWorkingDir: REPO,
    entryPoints: [join(EVIDENCE, 'harness.tsx')],
    outfile,
    bundle: true,
    format: 'iife',
    platform: 'browser',
    jsx: 'automatic',
    sourcemap: false,
    logLevel: 'silent',
    alias: { '@': REPO },
    define: { 'process.env.NODE_ENV': '"development"' },
  })
  return readFileSync(outfile, 'utf8')
}

function htmlSeite(css, script) {
  return `<!doctype html>
<html lang="de">
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1">
  <title>Admin transaction read filter harness</title>
  <style>${css}</style>
</head>
<body>
  <div id="root"></div>
  <script>${script}</script>
</body>
</html>`
}

function serve(css, script) {
  const server = createServer((_req, res) => {
    res.writeHead(200, { 'Content-Type': 'text/html; charset=utf-8' })
    res.end(htmlSeite(css, script))
  })
  return new Promise((resolve) => {
    server.listen(0, '127.0.0.1', () => {
      const address = server.address()
      const port = typeof address === 'object' && address ? address.port : 0
      resolve({ server, origin: `http://127.0.0.1:${port}` })
    })
  })
}

async function openTransactions(browser, viewport = { width: 1280, height: 900 }) {
  const page = await browser.newPage({ viewport })
  const consoleErrors = []
  const pageErrors = []
  page.on('console', (msg) => {
    if (msg.type() === 'error') consoleErrors.push(msg.text())
  })
  page.on('pageerror', (error) => pageErrors.push(String(error)))
  return { page, consoleErrors, pageErrors }
}

async function start(browser, origin, viewport) {
  const opened = await openTransactions(browser, viewport)
  await opened.page.goto(origin, { waitUntil: 'domcontentloaded' })
  await opened.page.waitForFunction(() => window.__txFilter?.ready === true)
  await opened.page.getByRole('button', { name: 'Transaktionen', exact: true }).click()
  await opened.page.waitForSelector('select')
  await opened.page.waitForFunction(() => window.__txFilter.pending().length === 1)
  return opened
}

async function calls(page) {
  const raw = await page.evaluate(() => window.__txFilter.listCalls())
  return raw.map(parseCall)
}

async function bodyText(page) {
  return page.locator('tbody').innerText()
}

async function selectValue(page) {
  return page.locator('select').inputValue()
}

async function resolveNext(page, status, body) {
  await page.evaluate(({ status, body }) => window.__txFilter.resolveNext(status, body), { status, body })
}

async function resolveMatching(page, part, status, body) {
  await page.evaluate(
    ({ part, status, body }) => window.__txFilter.resolveMatching(part, status, body),
    { part, status, body },
  )
}

async function settleInitial(page, payload = pageBody([row('synthetic-pay-all', 'pending')], '2026-09-01T10:00:00.000Z')) {
  await resolveNext(page, 200, payload)
  await page.waitForFunction(() => document.body.textContent.includes('synthetic-pay-all'))
}

async function shot(page, name) {
  await page.screenshot({ path: join(ARTIFACTS, `${name}.png`), fullPage: true })
}

function ignoredConsole(text) {
  return text.includes('Download the React DevTools') || text.includes('width(0) and height(0)') || text.includes('The width(0)')
}

async function fall(name, browser, origin, viewport, run) {
  const opened = await start(browser, origin, viewport)
  try {
    const detail = await run(opened.page)
    ergebnisse.push({
      name,
      ok: true,
      detail,
      consoleErrors: opened.consoleErrors.filter((text) => !ignoredConsole(text)),
      pageErrors: opened.pageErrors,
    })
  } catch (error) {
    ergebnisse.push({
      name,
      ok: false,
      error: String(error),
      consoleErrors: opened.consoleErrors.filter((text) => !ignoredConsole(text)),
      pageErrors: opened.pageErrors,
    })
    throw error
  } finally {
    await opened.page.close()
  }
}

async function baseline(browser, origin) {
  await fall('baseline-stale-status', browser, origin, { width: 1280, height: 900 }, async (page) => {
    await settleInitial(page)
    await page.locator('select').selectOption('paid')
    await page.waitForFunction(() => window.__txFilter.listCalls().length === 2)
    const afterPaid = await calls(page)
    const paidSelect = await selectValue(page)
    assert.equal(paidSelect, 'paid')
    assert.equal(afterPaid[1].status, null)
    await shot(page, 'before-stale-paid')

    await resolveNext(page, 200, pageBody([row('synthetic-pay-unfiltered', 'pending')], null))
    await page.waitForFunction(() => document.body.textContent.includes('synthetic-pay-unfiltered'))
    await page.locator('select').selectOption('failed')
    await page.waitForFunction(() => window.__txFilter.listCalls().length === 3)
    const afterFailed = await calls(page)
    const failedSelect = await selectValue(page)
    assert.equal(failedSelect, 'failed')
    assert.equal(afterFailed[2].status, 'paid')
    await shot(page, 'before-stale-failed')
    return { afterPaid, afterFailed, paidSelect, failedSelect }
  })

  await fall('baseline-inflight-dropped', browser, origin, { width: 1280, height: 900 }, async (page) => {
    await settleInitial(page)
    await page.locator('select').selectOption('paid')
    await page.waitForFunction(() => window.__txFilter.pending().length === 1)
    await page.locator('select').selectOption('failed')
    const pending = await page.evaluate(() => window.__txFilter.pending())
    const seen = await calls(page)
    assert.equal(await selectValue(page), 'failed')
    assert.equal(pending.length, 1)
    assert.equal(seen.filter((call) => call.status === 'failed').length, 0)
    await resolveNext(page, 200, pageBody([row('synthetic-pay-stale-a', 'pending')], null))
    await page.waitForFunction(() => document.body.textContent.includes('synthetic-pay-stale-a'))
    assert.equal(await selectValue(page), 'failed')
    return { pending, seen }
  })

  const bericht = {
    mode: 'baseline-unfixed-TransactionsCard',
    harness: 'scripts/admin-transaction-read-filter-state-1-verify.mjs',
    component: 'components/admin/payments/PaymentsCenter.tsx',
    limitation: 'Playwright renders the repository component with a stubbed fetch. Not signed-in Admin E2E and not Production.',
    synthetic: true,
    faelle: ergebnisse,
  }
  writeFileSync(join(EVIDENCE, 'before.json'), `${JSON.stringify(bericht, null, 2)}\n`)
  writeFileSync(join(ARTIFACTS, 'before.json'), `${JSON.stringify(bericht, null, 2)}\n`)
}

async function fixed(browser, origin) {
  await fall('initial-all-omits-status', browser, origin, undefined, async (page) => {
    const pendingText = await bodyText(page)
    assert.match(pendingText, /Wird geladen/)
    assert.doesNotMatch(pendingText, /Keine Transaktionen/)
    const initial = await calls(page)
    assert.equal(initial.length, 1)
    assert.equal(initial[0].status, null)
    assert.equal(initial[0].q, null)
    assert.equal(initial[0].cursor, null)
    await settleInitial(page)
    return { initial: initial[0] }
  })

  await fall('all-to-paid-then-failed', browser, origin, undefined, async (page) => {
    await settleInitial(page)
    await page.locator('select').selectOption('paid')
    await page.waitForFunction(() => window.__txFilter.listCalls().length === 2)
    const paid = (await calls(page))[1]
    assert.equal(await selectValue(page), 'paid')
    assert.equal(paid.status, 'paid')
    assert.equal(paid.cursor, null)
    await resolveNext(page, 200, pageBody([row('synthetic-pay-paid', 'paid')], null))
    await page.waitForFunction(() => document.body.textContent.includes('synthetic-pay-paid'))
    await page.locator('select').selectOption('failed')
    await page.waitForFunction(() => window.__txFilter.listCalls().length === 3)
    const failed = (await calls(page))[2]
    assert.equal(await selectValue(page), 'failed')
    assert.equal(failed.status, 'failed')
    assert.equal(failed.cursor, null)
    await page.waitForFunction(() => {
      const text = document.querySelector('tbody')?.textContent ?? ''
      return text.includes('Wird geladen') && !text.includes('synthetic-pay-paid')
    })
    await shot(page, 'after-status-failed-request')
    return { paid, failed }
  })

  await fall('filtern-and-enter-and-clear', browser, origin, undefined, async (page) => {
    await settleInitial(page)
    await page.locator('select').selectOption('paid')
    await page.waitForFunction(() => window.__txFilter.pending().length === 1)
    await resolveNext(page, 200, pageBody([row('synthetic-pay-paid', 'paid')], null))
    await page.getByPlaceholder('Suche: ID oder E-Mail…').fill('  ada@example.test  ')
    await page.getByRole('button', { name: 'Filtern', exact: true }).click()
    await page.waitForFunction(() => window.__txFilter.listCalls().length === 3)
    const filtered = (await calls(page))[2]
    assert.equal(filtered.q, 'ada@example.test')
    assert.equal(filtered.status, 'paid')
    await resolveNext(page, 200, pageBody([row('synthetic-pay-search', 'paid')], null))

    await page.getByPlaceholder('Suche: ID oder E-Mail…').fill('  bao@example.test ')
    await page.getByPlaceholder('Suche: ID oder E-Mail…').press('Enter')
    await page.waitForFunction(() => window.__txFilter.listCalls().length === 4)
    const entered = (await calls(page))[3]
    assert.equal(entered.q, 'bao@example.test')
    assert.equal(entered.status, 'paid')
    await resolveNext(page, 200, pageBody([row('synthetic-pay-enter', 'paid')], null))

    await page.getByPlaceholder('Suche: ID oder E-Mail…').fill('   ')
    await page.getByRole('button', { name: 'Filtern', exact: true }).click()
    await page.waitForFunction(() => window.__txFilter.listCalls().length === 5)
    const cleared = (await calls(page))[4]
    assert.equal(cleared.q, null)
    assert.equal(cleared.status, 'paid')
    return { filtered, entered, cleared }
  })

  await fall('inflight-older-cannot-overwrite', browser, origin, undefined, async (page) => {
    await settleInitial(page)
    await page.locator('select').selectOption('paid')
    await page.waitForFunction(() => window.__txFilter.pending().some((url) => url.includes('status=paid')))
    await page.locator('select').selectOption('failed')
    await page.waitForFunction(() => window.__txFilter.pending().some((url) => url.includes('status=failed')))
    const seen = await calls(page)
    assert.equal(seen.filter((call) => call.status === 'paid').length, 1)
    assert.equal(seen.filter((call) => call.status === 'failed').length, 1)
    await resolveMatching(page, 'status=paid', 200, pageBody([row('synthetic-pay-paid', 'paid')], '2026-09-01T09:00:00.000Z'))
    await page.waitForTimeout(50)
    assert.doesNotMatch(await bodyText(page), /synthetic-pay-paid/)
    assert.equal(await selectValue(page), 'failed')
    await resolveMatching(page, 'status=failed', 200, pageBody([row('synthetic-pay-failed', 'failed')], null))
    await page.waitForFunction(() => document.body.textContent.includes('synthetic-pay-failed'))
    assert.doesNotMatch(await bodyText(page), /synthetic-pay-paid/)
    assert.doesNotMatch(await bodyText(page), /synthetic-pay-all/)
    await shot(page, 'after-inflight-failed-wins')
    return { seen }
  })

  await fall('inflight-b-failure-hides-a', browser, origin, undefined, async (page) => {
    await settleInitial(page)
    await page.locator('select').selectOption('paid')
    await page.waitForFunction(() => window.__txFilter.pending().some((url) => url.includes('status=paid')))
    await page.locator('select').selectOption('failed')
    await page.waitForFunction(() => window.__txFilter.pending().some((url) => url.includes('status=failed')))
    await resolveMatching(page, 'status=failed', 500, { message: 'synthetic read failed', rows: [] })
    await page.waitForFunction(() => document.body.textContent.includes('synthetic read failed'))
    await resolveMatching(page, 'status=paid', 200, pageBody([row('synthetic-pay-paid', 'paid')], null))
    await page.waitForTimeout(50)
    const text = await bodyText(page)
    assert.match(text, /synthetic read failed/)
    assert.doesNotMatch(text, /Keine Transaktionen/)
    assert.doesNotMatch(text, /synthetic-pay-paid/)
    assert.doesNotMatch(text, /synthetic-pay-all/)
    return { text }
  })

  await fall('pagination-committed-and-stale-page', browser, origin, undefined, async (page) => {
    await settleInitial(page)
    await page.getByPlaceholder('Suche: ID oder E-Mail…').fill('draft-not-committed@example.test')
    await page.getByRole('button', { name: 'Mehr laden', exact: true }).click()
    await page.waitForFunction(() => window.__txFilter.pending().length === 1)
    const more = (await calls(page)).at(-1)
    assert.equal(more.cursor, '2026-09-01T10:00:00.000Z')
    assert.equal(more.status, null)
    assert.equal(more.q, null)
    await page.locator('select').selectOption('refunded')
    await page.waitForFunction(() => window.__txFilter.pending().some((url) => url.includes('status=refunded')))
    const replacement = (await calls(page)).at(-1)
    assert.equal(replacement.status, 'refunded')
    assert.equal(replacement.cursor, null)
    assert.equal(replacement.q, 'draft-not-committed@example.test')
    await resolveMatching(page, 'cursor=', 200, pageBody([row('synthetic-pay-page2', 'pending', '2026-09-01T09:00:00.000Z')], null))
    await page.waitForTimeout(50)
    assert.doesNotMatch(await bodyText(page), /synthetic-pay-page2/)
    await resolveMatching(page, 'status=refunded', 200, pageBody([row('synthetic-pay-refunded', 'refunded')], null))
    await page.waitForFunction(() => document.body.textContent.includes('synthetic-pay-refunded'))
    const text = await bodyText(page)
    assert.match(text, /CHF 18\.50/)
    assert.doesNotMatch(text, /synthetic-pay-page2/)
    assert.doesNotMatch(text, /synthetic-pay-all/)
    return { more, replacement }
  })

  await fall('empty-error-retry-stay-distinct', browser, origin, undefined, async (page) => {
    await resolveNext(page, 200, pageBody([], null))
    await page.waitForFunction(() => document.body.textContent.includes('Keine Transaktionen.'))
    assert.equal(await page.locator('[role="alert"]').count(), 0)
    await page.locator('select').selectOption('pending')
    await page.waitForFunction(() => window.__txFilter.pending().some((url) => url.includes('status=pending')))
    await resolveNext(page, 500, { message: 'synthetic read failed', rows: [] })
    await page.waitForFunction(() => document.body.textContent.includes('synthetic read failed'))
    const failedText = await bodyText(page)
    assert.doesNotMatch(failedText, /Keine Transaktionen/)
    await page.getByRole('button', { name: 'Erneut versuchen', exact: true }).click()
    await page.waitForFunction(() => window.__txFilter.listCalls().length === 3)
    const retry = (await calls(page))[2]
    assert.equal(retry.status, 'pending')
    assert.match(await bodyText(page), /Wird geladen/)
    await resolveNext(page, 200, pageBody([row('synthetic-pay-retry', 'pending')], null))
    await page.waitForFunction(() => document.body.textContent.includes('synthetic-pay-retry'))
    assert.equal(await page.locator('[role="alert"]').count(), 0)
    return { retry }
  })

  await fall('no-request-storm', browser, origin, undefined, async (page) => {
    await settleInitial(page)
    await page.locator('select').selectOption('paid')
    await page.locator('select').selectOption('failed')
    await page.locator('select').selectOption('refunded')
    await page.waitForTimeout(400)
    const seen = await calls(page)
    assert.equal(seen.length, 4)
    assert.deepEqual(seen.map((call) => call.status), [null, 'paid', 'failed', 'refunded'])
    return { count: seen.length }
  })

  await fall('refund-and-local-copy-unchanged', browser, origin, undefined, async (page) => {
    await settleInitial(page)
    const banner = await page.locator('body').innerText()
    assert.match(banner, /Lokale\/operative Übersicht/)
    assert.match(banner, /CHF 18\.50/)
    await page.getByRole('button', { name: 'Refunds', exact: true }).click()
    await page.waitForFunction(() => document.body.textContent.includes('Lokale Refund-Notiz'))
    const refund = await page.locator('body').innerText()
    assert.match(refund, /Keine echte Geldbewegung/)
    assert.match(refund, /Lokal vermerken/)
    const others = await page.evaluate(() => window.__txFilter.allCalls())
    assert.equal(others.some((call) => call.url.includes('/refund') || call.method === 'POST'), false)
    return { refundPosts: 0 }
  })

  await fall('mobile-status-change', browser, origin, { width: 390, height: 844 }, async (page) => {
    await settleInitial(page)
    await page.locator('select').selectOption('paid')
    await page.waitForFunction(() => window.__txFilter.listCalls().some((url) => url.includes('status=paid')))
    const box = await page.locator('select').boundingBox()
    assert.ok(box && box.width > 40 && box.y < 844)
    await shot(page, 'after-mobile-status')
    return { status: (await calls(page)).at(-1).status, box }
  })

  const bericht = {
    mode: 'fixed-actual-TransactionsCard',
    harness: 'scripts/admin-transaction-read-filter-state-1-verify.mjs',
    component: 'components/admin/payments/PaymentsCenter.tsx',
    limitation: 'Playwright renders the repository PaymentsCenter with a stubbed fetch. Not signed-in Admin E2E, not a physical device, and not Production.',
    synthetic: true,
    refundRouteInvoked: false,
    faelle: ergebnisse,
  }
  writeFileSync(join(EVIDENCE, 'after.json'), `${JSON.stringify(bericht, null, 2)}\n`)
  writeFileSync(join(ARTIFACTS, 'after.json'), `${JSON.stringify(bericht, null, 2)}\n`)
  const consoleTexte = ergebnisse.flatMap((eintrag) => eintrag.consoleErrors ?? [])
  const pageTexte = ergebnisse.flatMap((eintrag) => eintrag.pageErrors ?? [])
  if (consoleTexte.length > 0 || pageTexte.length > 0) {
    throw new Error(`browser errors:\n${[...pageTexte, ...consoleTexte].join('\n')}`)
  }
}

const css = await compileCss()
const script = await bundleHarness()
const { server, origin } = await serve(css, script)
const browser = await chromium.launch({ headless: true })
try {
  if (BASELINE) await baseline(browser, origin)
  else await fixed(browser, origin)
  console.log(JSON.stringify({ ok: true, mode: BASELINE ? 'baseline' : 'fixed', faelle: ergebnisse.map((eintrag) => eintrag.name) }, null, 2))
} finally {
  await browser.close()
  server.close()
}
