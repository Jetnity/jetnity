#!/usr/bin/env node
// Actual rendered UsersTable harness for Admin Users Search Navigation 1.
// Next router/search params, next/link and user role/status actions are boundary
// stubs. Rows are synthetic. This is not signed-in Next E2E, not a physical
// device, and not Production acceptance.

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
const EVIDENCE = join(REPO, 'docs/evidence/admin-users-search-navigation-1')
const ARTIFACTS = '/opt/cursor/artifacts'
const OUT = join('/tmp', 'admin-users-search-navigation-1-harness')
const BASELINE = process.argv.includes('--baseline')

mkdirSync(OUT, { recursive: true })
mkdirSync(EVIDENCE, { recursive: true })
mkdirSync(ARTIFACTS, { recursive: true })

const ergebnisse = []

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
        join(REPO, 'components/admin/UsersTable.tsx'),
        join(REPO, 'components/ui/**/*.{js,ts,jsx,tsx}'),
        join(EVIDENCE, 'harness.tsx'),
      ],
    }
    const result = await postcss([nesting(), tailwindcss(config), autoprefixer()]).process(input, { from })
    return result.css
  } catch (error) {
    return `body{font-family:sans-serif;margin:0}[hidden]{display:none}/* css fallback: ${String(error)} */`
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
    alias: {
      '@': REPO,
      'next/navigation': join(EVIDENCE, 'stubs/next-navigation.ts'),
      'next/link': join(EVIDENCE, 'stubs/next-link.tsx'),
      '@/app/(admin)/admin/users/actions': join(EVIDENCE, 'stubs/actions.ts'),
      'server-only': join(EVIDENCE, 'stubs/server-only.ts'),
    },
    define: {
      'process.env.NODE_ENV': '"development"',
    },
  })
  return readFileSync(outfile, 'utf8')
}

function htmlSeite(css, script) {
  return `<!doctype html>
<html lang="de">
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1">
  <title>Admin users search navigation harness</title>
  <style>${css}</style>
</head>
<body>
  <div id="root"></div>
  <script>${script}</script>
</body>
</html>`
}

function serve(css, script) {
  const server = createServer((req, res) => {
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

async function snapshot(page) {
  return page.evaluate(() => {
    const api = window.__usersNav
    return {
      replaces: api.replaces(),
      search: api.search(),
      input: api.input(),
      pageText: api.pageText(),
      actionCalls: api.actionCalls(),
    }
  })
}

async function oeffnen(browser, origin, search, viewport) {
  const page = await browser.newPage({ viewport })
  const consoleErrors = []
  const pageErrors = []
  page.on('console', (msg) => {
    if (msg.type() === 'error') consoleErrors.push(msg.text())
  })
  page.on('pageerror', (error) => pageErrors.push(String(error)))
  await page.goto(`${origin}/?${search}`, { waitUntil: 'domcontentloaded' })
  await page.waitForFunction(() => window.__usersNav?.ready === true)
  await page.waitForSelector('input[placeholder="Suche nach Name oder E-Mail…"]')
  return { page, consoleErrors, pageErrors }
}

function paramsOf(search) {
  return new URLSearchParams(search)
}

async function warteStill(page, ms) {
  await page.waitForTimeout(ms)
}

async function baseline(browser, origin) {
  const { page, consoleErrors, pageErrors } = await oeffnen(
    browser,
    origin,
    'q=anna&page=3&source=support',
    { width: 1280, height: 800 },
  )
  const beforeTimer = await snapshot(page)
  await warteStill(page, 700)
  const afterTimer = await snapshot(page)
  await page.screenshot({ path: join(EVIDENCE, 'before-desktop.png'), fullPage: true })
  await page.screenshot({ path: join(ARTIFACTS, 'before-desktop.png'), fullPage: true })
  const report = {
    mode: 'baseline-actual-UsersTable',
    interaction: 'none',
    initial: 'q=anna&page=3&source=support',
    waitMs: 700,
    beforeTimer,
    afterTimer,
    consoleErrors,
    pageErrors,
    defectReproduced:
      afterTimer.replaces.some((entry) => entry.href.includes('page=1')) &&
      beforeTimer.replaces.length === 0,
  }
  writeFileSync(join(EVIDENCE, 'before.json'), `${JSON.stringify(report, null, 2)}\n`)
  writeFileSync(join(ARTIFACTS, 'before.json'), `${JSON.stringify(report, null, 2)}\n`)
  await page.close()
  if (!report.defectReproduced) {
    console.error(JSON.stringify(report, null, 2))
    throw new Error('STOP: page-3-to-page-1 reset was not reproduced on the actual UsersTable')
  }
  console.log(JSON.stringify({ defectReproduced: true, after: report.afterTimer }, null, 2))
}

function merke(name, wert) {
  ergebnisse.push({ name, ...wert })
}

async function fall(browser, origin, name, search, viewport, fn) {
  const geoeffnet = await oeffnen(browser, origin, search, viewport)
  try {
    const wert = await fn(geoeffnet.page)
    assert.deepEqual(geoeffnet.pageErrors, [], `${name} pageerror`)
    const actions = await geoeffnet.page.evaluate(() => window.__usersNav.actionCalls())
    assert.deepEqual(actions, [], `${name} action calls`)
    merke(name, { ok: true, ...wert, consoleErrors: geoeffnet.consoleErrors })
  } finally {
    await geoeffnet.page.close()
  }
}

async function gruen(browser, origin) {
  await fall(
    browser,
    origin,
    'deep-link-page-3-idle',
    'q=anna&page=3&source=support',
    { width: 1280, height: 800 },
    async (page) => {
      await warteStill(page, 700)
      const seen = await snapshot(page)
      assert.deepEqual(seen.replaces, [])
      assert.equal(seen.input, 'anna')
      assert.equal(seen.search, 'q=anna&page=3&source=support')
      assert.equal(seen.pageText, '3 / 3')
      await page.screenshot({ path: join(EVIDENCE, 'after-desktop.png'), fullPage: true })
      await page.screenshot({ path: join(ARTIFACTS, 'after-desktop.png'), fullPage: true })
      return { seen }
    },
  )

  await fall(
    browser,
    origin,
    'reload-remount',
    'q=anna&page=3&source=support',
    { width: 1280, height: 800 },
    async (page) => {
      await warteStill(page, 500)
      await page.evaluate(() => window.__usersNav.remount())
      await page.waitForSelector('[data-users-nav-generation="2"] input')
      await warteStill(page, 700)
      const seen = await snapshot(page)
      assert.deepEqual(seen.replaces, [])
      assert.equal(seen.input, 'anna')
      assert.equal(seen.pageText, '3 / 3')
      return { seen }
    },
  )

  await fall(
    browser,
    origin,
    'genuine-edit-resets-page',
    'q=anna&page=3&source=support',
    { width: 1280, height: 800 },
    async (page) => {
      const input = page.locator('input[placeholder="Suche nach Name oder E-Mail…"]')
      await input.fill('berta')
      await warteStill(page, 200)
      const early = await snapshot(page)
      assert.deepEqual(early.replaces, [])
      await warteStill(page, 500)
      const seen = await snapshot(page)
      assert.equal(seen.replaces.length, 1)
      assert.equal(paramsOf(seen.search).get('q'), 'berta')
      assert.equal(paramsOf(seen.search).get('page'), '1')
      assert.equal(paramsOf(seen.search).get('source'), 'support')
      assert.equal(seen.input, 'berta')
      assert.equal(seen.pageText, '1 / 3')
      return { seen }
    },
  )

  await fall(
    browser,
    origin,
    'clear-removes-q',
    'q=anna&page=3&source=support',
    { width: 1280, height: 800 },
    async (page) => {
      const input = page.locator('input[placeholder="Suche nach Name oder E-Mail…"]')
      await input.fill('')
      await warteStill(page, 600)
      const seen = await snapshot(page)
      assert.equal(seen.replaces.length, 1)
      assert.equal(paramsOf(seen.search).get('q'), null)
      assert.equal(paramsOf(seen.search).get('page'), '1')
      assert.equal(paramsOf(seen.search).get('source'), 'support')
      assert.equal(seen.input, '')
      return { seen }
    },
  )

  await fall(
    browser,
    origin,
    'whitespace-equivalent-is-noop',
    'q=anna&page=3&source=support',
    { width: 1280, height: 800 },
    async (page) => {
      const input = page.locator('input[placeholder="Suche nach Name oder E-Mail…"]')
      await input.fill('  anna  ')
      await warteStill(page, 700)
      const seen = await snapshot(page)
      assert.deepEqual(seen.replaces, [])
      assert.equal(seen.search, 'q=anna&page=3&source=support')
      assert.equal(seen.input, '  anna  ')
      assert.equal(seen.pageText, '3 / 3')
      return { seen }
    },
  )

  await fall(
    browser,
    origin,
    'punctuation-unicode-encoding',
    'page=2&source=support',
    { width: 1280, height: 800 },
    async (page) => {
      const input = page.locator('input[placeholder="Suche nach Name oder E-Mail…"]')
      const text = 'müller & co/ñ?'
      await input.fill(text)
      await warteStill(page, 600)
      const seen = await snapshot(page)
      assert.equal(seen.replaces.length, 1)
      const params = paramsOf(seen.search)
      assert.equal(params.get('q'), text)
      assert.equal(params.get('page'), '1')
      assert.equal(params.get('source'), 'support')
      assert.equal(seen.input, text)
      assert.equal(seen.replaces[0].href.startsWith('/admin/users?'), true)
      assert.equal(seen.replaces[0].href.includes(' '), false)
      return { href: seen.replaces[0].href }
    },
  )

  await fall(
    browser,
    origin,
    'pagination-keeps-filter',
    'q=anna&page=3&source=support',
    { width: 1280, height: 800 },
    async (page) => {
      await page.getByRole('button', { name: 'Vorherige Seite' }).click()
      await warteStill(page, 700)
      const seen = await snapshot(page)
      assert.equal(seen.replaces.length, 1)
      assert.equal(paramsOf(seen.search).get('q'), 'anna')
      assert.equal(paramsOf(seen.search).get('page'), '2')
      assert.equal(paramsOf(seen.search).get('source'), 'support')
      assert.equal(seen.input, 'anna')
      assert.equal(seen.pageText, '2 / 3')
      return { seen }
    },
  )

  await fall(
    browser,
    origin,
    'back-forward-syncs-input',
    'q=anna&page=3&source=support',
    { width: 1280, height: 800 },
    async (page) => {
      await warteStill(page, 200)
      await page.evaluate(() => window.__usersNav.external('q=carla&page=2&source=support'))
      await page.waitForFunction(() => window.__usersNav.input() === 'carla')
      await warteStill(page, 700)
      const afterBack = await snapshot(page)
      assert.deepEqual(afterBack.replaces, [])
      assert.equal(afterBack.pageText, '2 / 3')
      assert.equal(afterBack.search, 'q=carla&page=2&source=support')
      await page.evaluate(() => window.__usersNav.back())
      await page.waitForFunction(() => window.__usersNav.input() === 'anna')
      await warteStill(page, 700)
      const restored = await snapshot(page)
      assert.deepEqual(restored.replaces, [])
      assert.equal(restored.pageText, '3 / 3')
      assert.equal(restored.search, 'q=anna&page=3&source=support')
      await page.evaluate(() => window.__usersNav.forward())
      await page.waitForFunction(() => window.__usersNav.input() === 'carla')
      await warteStill(page, 500)
      const forward = await snapshot(page)
      assert.deepEqual(forward.replaces, [])
      assert.equal(forward.pageText, '2 / 3')
      return { afterBack, restored, forward }
    },
  )

  await fall(
    browser,
    origin,
    'url-query-and-page-change',
    'q=anna&page=3&source=support',
    { width: 1280, height: 800 },
    async (page) => {
      await page.evaluate(() => window.__usersNav.external('q=dalia&page=1&source=inbox&ref=case-7'))
      await page.waitForFunction(() => window.__usersNav.input() === 'dalia')
      await warteStill(page, 700)
      const seen = await snapshot(page)
      assert.deepEqual(seen.replaces, [])
      assert.equal(seen.pageText, '1 / 3')
      assert.equal(paramsOf(seen.search).get('source'), 'inbox')
      assert.equal(paramsOf(seen.search).get('ref'), 'case-7')
      return { seen }
    },
  )

  await fall(
    browser,
    origin,
    'edit-then-external-before-timeout',
    'q=anna&page=3&source=support',
    { width: 1280, height: 800 },
    async (page) => {
      const input = page.locator('input[placeholder="Suche nach Name oder E-Mail…"]')
      await input.fill('bob')
      await warteStill(page, 100)
      await page.evaluate(() => window.__usersNav.external('q=elsa&page=2&source=support'))
      await page.waitForFunction(() => window.__usersNav.input() === 'elsa')
      await warteStill(page, 700)
      const seen = await snapshot(page)
      assert.deepEqual(seen.replaces, [])
      assert.equal(seen.search, 'q=elsa&page=2&source=support')
      assert.equal(seen.pageText, '2 / 3')
      return { seen }
    },
  )

  await fall(
    browser,
    origin,
    'edit-then-page-click-discards-draft',
    'q=anna&page=3&source=support',
    { width: 1280, height: 800 },
    async (page) => {
      const input = page.locator('input[placeholder="Suche nach Name oder E-Mail…"]')
      await input.fill('bob')
      await warteStill(page, 100)
      await page.getByRole('button', { name: 'Vorherige Seite' }).click()
      await warteStill(page, 700)
      const seen = await snapshot(page)
      assert.equal(seen.replaces.length, 1)
      assert.equal(paramsOf(seen.search).get('q'), 'anna')
      assert.equal(paramsOf(seen.search).get('page'), '2')
      assert.equal(paramsOf(seen.search).get('source'), 'support')
      assert.equal(seen.input, 'anna')
      assert.equal(seen.pageText, '2 / 3')
      return { seen }
    },
  )

  await fall(
    browser,
    origin,
    'rapid-edits-commit-last-value',
    'q=anna&page=3&source=support',
    { width: 1280, height: 800 },
    async (page) => {
      const input = page.locator('input[placeholder="Suche nach Name oder E-Mail…"]')
      await input.fill('b')
      await warteStill(page, 80)
      await input.fill('be')
      await warteStill(page, 80)
      await input.fill('ber')
      await warteStill(page, 80)
      const mid = await snapshot(page)
      assert.deepEqual(mid.replaces, [])
      await warteStill(page, 600)
      const seen = await snapshot(page)
      assert.equal(seen.replaces.length, 1)
      assert.equal(paramsOf(seen.search).get('q'), 'ber')
      assert.equal(paramsOf(seen.search).get('page'), '1')
      assert.equal(paramsOf(seen.search).get('source'), 'support')
      return { seen }
    },
  )

  await fall(
    browser,
    origin,
    'unmount-cancels-timer',
    'q=anna&page=3&source=support',
    { width: 1280, height: 800 },
    async (page) => {
      const input = page.locator('input[placeholder="Suche nach Name oder E-Mail…"]')
      await input.fill('bob')
      await warteStill(page, 80)
      await page.evaluate(() => window.__usersNav.unmount())
      await page.waitForSelector('[data-users-nav-unmounted="true"]', { state: 'attached' })
      await warteStill(page, 700)
      const seen = await snapshot(page)
      assert.deepEqual(seen.replaces, [])
      assert.equal(seen.search, 'q=anna&page=3&source=support')
      return { seen }
    },
  )

  await fall(
    browser,
    origin,
    'delayed-own-ack-keeps-newer-draft',
    'q=anna&page=3&source=support',
    { width: 1280, height: 800 },
    async (page) => {
      await page.evaluate(() => window.__usersNav.delayCommits(true))
      const input = page.locator('input[placeholder="Suche nach Name oder E-Mail…"]')
      await input.fill('bob')
      await page.waitForFunction(() => window.__usersNav.replaces().length === 1 && window.__usersNav.pendingCommits().length === 1)
      const held = await snapshot(page)
      assert.equal(paramsOf(held.search).get('q'), 'anna')
      assert.equal(paramsOf(held.search).get('page'), '3')
      await input.fill('bobby')
      const acked = await page.evaluate(() => window.__usersNav.commitNext())
      assert.equal(paramsOf(acked.split('?')[1]).get('q'), 'bob')
      await page.waitForFunction(() => window.__usersNav.input() === 'bobby' && window.__usersNav.search().includes('q=bob'))
      const during = await snapshot(page)
      assert.equal(during.replaces.length, 1)
      assert.equal(during.input, 'bobby')
      await page.waitForFunction(() => window.__usersNav.replaces().length === 2)
      const queued = await snapshot(page)
      assert.equal(paramsOf(queued.replaces[1].href.split('?')[1]).get('q'), 'bobby')
      assert.equal(queued.input, 'bobby')
      await page.evaluate(() => window.__usersNav.commitNext())
      await warteStill(page, 700)
      const done = await snapshot(page)
      assert.equal(done.replaces.length, 2)
      assert.equal(done.input, 'bobby')
      assert.equal(paramsOf(done.search).get('q'), 'bobby')
      assert.equal(paramsOf(done.search).get('page'), '1')
      assert.equal(paramsOf(done.search).get('source'), 'support')
      return { done }
    },
  )

  await fall(
    browser,
    origin,
    'delayed-own-ack-keeps-edit-back-to-previous',
    'q=anna&page=3&source=support',
    { width: 1280, height: 800 },
    async (page) => {
      await page.evaluate(() => window.__usersNav.delayCommits(true))
      const input = page.locator('input[placeholder="Suche nach Name oder E-Mail…"]')
      await input.fill('bob')
      await page.waitForFunction(() => window.__usersNav.pendingCommits().length === 1)
      await input.fill('anna')
      await page.evaluate(() => window.__usersNav.commitNext())
      await page.waitForFunction(() => window.__usersNav.input() === 'anna' && window.__usersNav.search().includes('q=bob'))
      await page.waitForFunction(() => window.__usersNav.replaces().length === 2)
      const queued = await snapshot(page)
      assert.equal(paramsOf(queued.replaces[1].href.split('?')[1]).get('q'), 'anna')
      assert.equal(queued.input, 'anna')
      await page.evaluate(() => window.__usersNav.commitNext())
      await warteStill(page, 700)
      const done = await snapshot(page)
      assert.equal(done.replaces.length, 2)
      assert.equal(done.input, 'anna')
      assert.equal(paramsOf(done.search).get('q'), 'anna')
      assert.equal(paramsOf(done.search).get('page'), '1')
      assert.equal(paramsOf(done.search).get('source'), 'support')
      return { done }
    },
  )

  await fall(
    browser,
    origin,
    'delayed-external-wins-over-held-search',
    'q=anna&page=3&source=support',
    { width: 1280, height: 800 },
    async (page) => {
      await page.evaluate(() => window.__usersNav.delayCommits(true))
      const input = page.locator('input[placeholder="Suche nach Name oder E-Mail…"]')
      await input.fill('bob')
      await page.waitForFunction(() => window.__usersNav.pendingCommits().length === 1)
      await input.fill('bobby')
      await page.evaluate(() => window.__usersNav.external('q=elsa&page=2&source=support'))
      await page.waitForFunction(() => window.__usersNav.input() === 'elsa')
      await warteStill(page, 700)
      const done = await snapshot(page)
      assert.equal(done.replaces.length, 1)
      assert.equal(paramsOf(done.replaces[0].href.split('?')[1]).get('q'), 'bob')
      assert.equal(done.input, 'elsa')
      assert.equal(paramsOf(done.search).get('q'), 'elsa')
      assert.equal(paramsOf(done.search).get('page'), '2')
      assert.equal(paramsOf(done.search).get('source'), 'support')
      const pending = await page.evaluate(() => window.__usersNav.pendingCommits())
      assert.deepEqual(pending, [])
      return { done }
    },
  )

  await fall(
    browser,
    origin,
    'delayed-older-ack-after-newer-replace-once',
    'q=anna&page=3&source=support',
    { width: 1280, height: 800 },
    async (page) => {
      await page.evaluate(() => window.__usersNav.delayCommits(true))
      const input = page.locator('input[placeholder="Suche nach Name oder E-Mail…"]')
      await input.fill('bob')
      await page.waitForFunction(() => window.__usersNav.replaces().length === 1)
      await input.fill('bobby')
      await page.waitForFunction(() => window.__usersNav.replaces().length === 2)
      const beforeAck = await snapshot(page)
      assert.equal(paramsOf(beforeAck.search).get('q'), 'anna')
      assert.equal(beforeAck.input, 'bobby')
      await page.evaluate(() => window.__usersNav.commitNext())
      const afterOld = await snapshot(page)
      assert.equal(afterOld.input, 'bobby')
      assert.equal(paramsOf(afterOld.search).get('q'), 'bob')
      assert.equal(afterOld.replaces.length, 2)
      await page.evaluate(() => window.__usersNav.commitNext())
      await warteStill(page, 700)
      const done = await snapshot(page)
      assert.equal(done.replaces.length, 2)
      assert.equal(done.input, 'bobby')
      assert.equal(paramsOf(done.search).get('q'), 'bobby')
      assert.equal(paramsOf(done.search).get('page'), '1')
      return { done }
    },
  )

  await fall(
    browser,
    origin,
    'native-back-equals-pending-own-search',
    'q=bob&page=1&source=support&reviewHold=1',
    { width: 1280, height: 800 },
    async (page) => {
      await page.evaluate(() => window.__usersNav.delayCommits(true))
      await page.evaluate(() =>
        window.__usersNav.pushHistory('q=anna&page=3&source=support&reviewHold=1'),
      )
      await page.waitForFunction(() => window.__usersNav.input() === 'anna')
      const pushed = await snapshot(page)
      assert.equal(paramsOf(pushed.search).get('q'), 'anna')
      assert.equal(paramsOf(pushed.search).get('page'), '3')
      assert.equal(paramsOf(pushed.search).get('source'), 'support')
      assert.equal(paramsOf(pushed.search).get('reviewHold'), '1')
      assert.deepEqual(pushed.replaces, [])
      const input = page.locator('input[placeholder="Suche nach Name oder E-Mail…"]')
      await input.fill('bob')
      await page.waitForFunction(
        () => window.__usersNav.replaces().length === 1 && window.__usersNav.pendingCommits().length === 1,
      )
      const held = await snapshot(page)
      const heldParams = paramsOf(held.replaces[0].href.split('?')[1])
      assert.equal(heldParams.get('q'), 'bob')
      assert.equal(heldParams.get('page'), '1')
      assert.equal(heldParams.get('source'), 'support')
      assert.equal(heldParams.get('reviewHold'), '1')
      assert.equal(paramsOf(held.search).get('q'), 'anna')
      await input.fill('bobby')
      const beforeBack = await snapshot(page)
      assert.equal(beforeBack.input, 'bobby')
      assert.equal(beforeBack.replaces.length, 1)
      await page.evaluate(
        () =>
          new Promise((resolve) => {
            window.addEventListener('popstate', () => resolve(true), { once: true })
            history.back()
          }),
      )
      await page.waitForFunction(() => window.__usersNav.input() === 'bob')
      await warteStill(page, 700)
      const afterBack = await snapshot(page)
      assert.equal(afterBack.replaces.length, 1)
      assert.equal(afterBack.input, 'bob')
      assert.equal(paramsOf(afterBack.search).get('q'), 'bob')
      assert.equal(paramsOf(afterBack.search).get('page'), '1')
      assert.equal(paramsOf(afterBack.search).get('source'), 'support')
      assert.equal(paramsOf(afterBack.search).get('reviewHold'), '1')
      assert.equal(afterBack.pageText, '1 / 3')
      const pending = await page.evaluate(() => window.__usersNav.pendingCommits())
      assert.equal(pending.length, 1)
      await page.evaluate(
        () =>
          new Promise((resolve) => {
            window.addEventListener('popstate', () => resolve(true), { once: true })
            history.forward()
          }),
      )
      await page.waitForFunction(() => window.__usersNav.input() === 'anna')
      await warteStill(page, 700)
      const afterForward = await snapshot(page)
      assert.equal(afterForward.replaces.length, 1)
      assert.equal(afterForward.input, 'anna')
      assert.equal(paramsOf(afterForward.search).get('q'), 'anna')
      assert.equal(paramsOf(afterForward.search).get('page'), '3')
      assert.equal(paramsOf(afterForward.search).get('source'), 'support')
      assert.equal(paramsOf(afterForward.search).get('reviewHold'), '1')
      assert.equal(afterForward.pageText, '3 / 3')
      const pendingAfter = await page.evaluate(() => window.__usersNav.pendingCommits())
      assert.equal(pendingAfter.length, 1)
      return { afterBack, afterForward }
    },
  )

  await fall(
    browser,
    origin,
    'mobile-visual',
    'q=anna&page=3&source=support',
    { width: 390, height: 844 },
    async (page) => {
      await warteStill(page, 700)
      const seen = await snapshot(page)
      assert.deepEqual(seen.replaces, [])
      assert.equal(seen.input, 'anna')
      assert.equal(seen.pageText, '3 / 3')
      const box = await page.locator('input[placeholder="Suche nach Name oder E-Mail…"]').boundingBox()
      assert.ok(box && box.width > 40 && box.y < 844)
      await page.screenshot({ path: join(EVIDENCE, 'after-mobile.png'), fullPage: true })
      await page.screenshot({ path: join(ARTIFACTS, 'after-mobile.png'), fullPage: true })
      return { seen, inputBox: box }
    },
  )

  const bericht = {
    mode: 'fixed-actual-UsersTable',
    harness: 'scripts/admin-users-search-navigation-1-verify.mjs',
    component: 'components/admin/UsersTable.tsx',
    notSignedInE2E: true,
    faelle: ergebnisse,
  }
  writeFileSync(join(EVIDENCE, 'after.json'), `${JSON.stringify(bericht, null, 2)}\n`)
  writeFileSync(join(ARTIFACTS, 'after.json'), `${JSON.stringify(bericht, null, 2)}\n`)
  const fehler = ergebnisse.filter((eintrag) =>
    (eintrag.consoleErrors ?? []).some((text) => !text.includes('Download the React DevTools')),
  )
  const consoleTexte = fehler.flatMap((eintrag) => eintrag.consoleErrors ?? [])
  if (consoleTexte.length > 0) {
    throw new Error(`console errors:\n${consoleTexte.join('\n')}`)
  }
  console.log(JSON.stringify({ ok: true, faelle: ergebnisse.map((eintrag) => eintrag.name) }, null, 2))
}

const css = await compileCss()
const script = await bundleHarness()
const { server, origin } = await serve(css, script)
const browser = await chromium.launch({ headless: true })
try {
  if (BASELINE) await baseline(browser, origin)
  else await gruen(browser, origin)
} finally {
  await browser.close()
  server.close()
}
