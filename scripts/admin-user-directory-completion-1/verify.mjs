#!/usr/bin/env node
// Mounted proof for Admin User Directory Completion 1.
// The router, the server read and the role actions are boundary stubs.
// Rows are synthetic. This is not signed-in Next, not hosted Supabase,
// not RLS, and not Production acceptance. router.refresh() is recorded
// and is not treated as a received response.

import assert from 'node:assert/strict'
import { createRequire } from 'node:module'
import { createServer } from 'node:http'
import { execSync } from 'node:child_process'
import { mkdirSync, readFileSync, writeFileSync } from 'node:fs'
import { dirname, join } from 'node:path'
import { fileURLToPath } from 'node:url'

import esbuild from 'esbuild'
import { chromium } from 'playwright'

const require = createRequire(import.meta.url)
const REPO = join(dirname(fileURLToPath(import.meta.url)), '..', '..')
const EVIDENCE = join(REPO, 'docs/evidence/admin-user-directory-completion-1')
const ARTIFACTS = '/opt/cursor/artifacts'
const OUT = join('/tmp', 'admin-user-directory-completion-1-harness')

mkdirSync(OUT, { recursive: true })
mkdirSync(EVIDENCE, { recursive: true })
mkdirSync(ARTIFACTS, { recursive: true })

const ergebnisse = []
const SEARCH = 'input[aria-label="Nutzer nach Name oder E-Mail suchen"]'

async function compileCss() {
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
      join(REPO, 'components/admin/Ladezustand.tsx'),
      join(REPO, 'components/ui/**/*.{js,ts,jsx,tsx}'),
      join(EVIDENCE, 'harness.tsx'),
    ],
  }
  const result = await postcss([nesting(), tailwindcss(config), autoprefixer()]).process(input, { from })
  return result.css
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
  <title>Admin user directory harness</title>
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

async function oeffnen(browser, origin, search, viewport, options = {}) {
  const page = await browser.newPage({ viewport })
  if (options.clock) await page.clock.install({ time: new Date('2026-10-25T12:00:00Z') })
  if (options.reducedMotion) await page.emulateMedia({ reducedMotion: 'reduce' })
  const consoleErrors = []
  const pageErrors = []
  page.on('console', (msg) => {
    if (msg.type() === 'error') consoleErrors.push(msg.text())
  })
  page.on('pageerror', (error) => pageErrors.push(String(error)))
  await page.goto(`${origin}/?${search}`, { waitUntil: 'domcontentloaded' })
  await page.waitForFunction(() => window.__usersDirectory?.ready === true)
  await page.waitForSelector(SEARCH)
  return { page, consoleErrors, pageErrors }
}

function paramsOf(search) {
  return new URLSearchParams(search)
}

async function snapshot(page) {
  return page.evaluate(() => {
    const api = window.__usersDirectory
    return {
      replaces: api.replaces(),
      search: api.search(),
      input: api.input(),
      pageText: api.pageText(),
      status: api.status(),
      countText: api.countText(),
      refreshCalls: api.refreshCalls(),
      actionCalls: api.actionCalls(),
      html: api.html(),
      pending: api.pendingCommits(),
    }
  })
}

function merke(name, wert) {
  ergebnisse.push({ name, ...wert })
  console.log(JSON.stringify({ name, ok: wert.ok !== false }))
}

async function fall(browser, origin, name, search, viewport, fn, options = {}) {
  if (process.env.FROM && !globalThis.__fromSeen) {
    if (name !== process.env.FROM) return
    globalThis.__fromSeen = true
  }
  const geoeffnet = await oeffnen(browser, origin, search, viewport, options)
  try {
    const wert = await fn(geoeffnet.page)
    assert.deepEqual(geoeffnet.pageErrors, [], `${name} pageerror`)
    if (!options.allowActions) {
      const actions = await geoeffnet.page.evaluate(() => window.__usersDirectory.actionCalls())
      assert.deepEqual(actions, [], `${name} action calls`)
    }
    merke(name, { ok: true, ...wert, consoleErrors: geoeffnet.consoleErrors })
  } catch (error) {
    merke(name, { ok: false, error: String(error) })
    throw error
  } finally {
    await geoeffnet.page.close()
  }
}

const css = await compileCss()
const script = await bundleHarness()
const { server, origin } = await serve(css, script)
const browser = await chromium.launch({ headless: true })

try {
  await fall(browser, origin, 'deep-link-page-3-idle', 'q=anna&page=3&source=support', { width: 1280, height: 800 }, async (page) => {
    await page.waitForTimeout(700)
    const seen = await snapshot(page)
    assert.deepEqual(seen.replaces, [])
    assert.equal(seen.input, 'anna')
    assert.equal(seen.search, 'q=anna&page=3&source=support')
    assert.equal(seen.pageText, 'Seite 3 / 3')
    assert.match(seen.status, /Aktuelle Ergebnisse/)
    await page.screenshot({ path: join(EVIDENCE, 'desktop-page-3.png'), fullPage: true })
    await page.screenshot({ path: join(ARTIFACTS, 'admin-users-desktop-page-3.png'), fullPage: true })
    return { pageText: seen.pageText }
  })

  await fall(browser, origin, 'reload-remount', 'q=anna&page=3&source=support', { width: 1280, height: 800 }, async (page) => {
    await page.waitForTimeout(500)
    await page.evaluate(() => window.__usersDirectory.remount())
    await page.waitForSelector('[data-users-directory-generation="2"] input')
    await page.waitForTimeout(700)
    const seen = await snapshot(page)
    assert.deepEqual(seen.replaces, [])
    assert.equal(seen.input, 'anna')
    assert.equal(seen.pageText, 'Seite 3 / 3')
    return { pageText: seen.pageText }
  })

  await fall(browser, origin, 'whitespace-noop', 'q=anna&page=3&source=support', { width: 1280, height: 800 }, async (page) => {
    await page.locator(SEARCH).fill('  anna  ')
    await page.waitForTimeout(700)
    const seen = await snapshot(page)
    assert.deepEqual(seen.replaces, [])
    assert.equal(seen.search, 'q=anna&page=3&source=support')
    assert.equal(seen.input, '  anna  ')
    assert.equal(seen.pageText, 'Seite 3 / 3')
    return { input: seen.input }
  })

  await fall(browser, origin, 'genuine-edit-resets-page', 'q=anna&page=3&source=support', { width: 1280, height: 800 }, async (page) => {
    await page.locator(SEARCH).fill('berta')
    await page.waitForTimeout(200)
    const early = await snapshot(page)
    assert.deepEqual(early.replaces, [])
    await page.waitForTimeout(500)
    const seen = await snapshot(page)
    assert.equal(seen.replaces.length, 1)
    assert.equal(paramsOf(seen.search).get('q'), 'berta')
    assert.equal(paramsOf(seen.search).get('page'), '1')
    assert.equal(paramsOf(seen.search).get('source'), 'support')
    assert.equal(seen.input, 'berta')
    assert.equal(seen.pageText, 'Seite 1 / 3')
    return { search: seen.search }
  })

  await fall(browser, origin, 'clear-removes-q', 'q=anna&page=3&source=support', { width: 1280, height: 800 }, async (page) => {
    await page.locator(SEARCH).fill('')
    await page.waitForTimeout(600)
    const seen = await snapshot(page)
    assert.equal(seen.replaces.length, 1)
    assert.equal(paramsOf(seen.search).get('q'), null)
    assert.equal(paramsOf(seen.search).get('page'), '1')
    assert.equal(paramsOf(seen.search).get('source'), 'support')
    assert.equal(seen.input, '')
    return { search: seen.search }
  })

  await fall(browser, origin, 'punctuation-unicode', 'page=2&source=support', { width: 1280, height: 800 }, async (page) => {
    const text = 'müller & co/ñ?'
    await page.locator(SEARCH).fill(text)
    await page.waitForTimeout(600)
    const seen = await snapshot(page)
    assert.equal(seen.replaces.length, 1)
    assert.equal(paramsOf(seen.search).get('q'), text)
    assert.equal(paramsOf(seen.search).get('page'), '1')
    assert.equal(paramsOf(seen.search).get('source'), 'support')
    assert.equal(seen.replaces[0].href.includes(' '), false)
    return { href: seen.replaces[0].href }
  })

  await fall(browser, origin, 'previous-keeps-q-and-foreign-keys', 'q=anna&page=3&source=support&ref=case-7', { width: 1280, height: 800 }, async (page) => {
    await page.getByRole('button', { name: 'Vorherige Seite' }).click()
    await page.waitForTimeout(300)
    const seen = await snapshot(page)
    assert.equal(paramsOf(seen.search).get('q'), 'anna')
    assert.equal(paramsOf(seen.search).get('page'), '2')
    assert.equal(paramsOf(seen.search).get('source'), 'support')
    assert.equal(paramsOf(seen.search).get('ref'), 'case-7')
    assert.equal(seen.input, 'anna')
    assert.equal(seen.pageText, 'Seite 2 / 3')
    return { search: seen.search }
  })

  await fall(browser, origin, 'external-back-forward', 'q=anna&page=3&source=support', { width: 1280, height: 800 }, async (page) => {
    await page.evaluate(() => window.__usersDirectory.external('q=carla&page=2&source=support'))
    await page.waitForFunction(() => window.__usersDirectory.input() === 'carla')
    await page.waitForTimeout(400)
    await page.evaluate(() => window.__usersDirectory.back())
    await page.waitForFunction(() => window.__usersDirectory.input() === 'anna')
    await page.waitForTimeout(400)
    const restored = await snapshot(page)
    assert.deepEqual(restored.replaces, [])
    assert.equal(restored.pageText, 'Seite 3 / 3')
    await page.evaluate(() => window.__usersDirectory.forward())
    await page.waitForFunction(() => window.__usersDirectory.input() === 'carla')
    const forward = await snapshot(page)
    assert.equal(forward.pageText, 'Seite 2 / 3')
    return { restored: restored.search, forward: forward.search }
  })

  await fall(browser, origin, 'edit-then-external-before-timeout', 'q=anna&page=3&source=support', { width: 1280, height: 800 }, async (page) => {
    await page.locator(SEARCH).fill('bob')
    await page.waitForTimeout(100)
    await page.evaluate(() => window.__usersDirectory.external('q=elsa&page=2&source=support'))
    await page.waitForFunction(() => window.__usersDirectory.input() === 'elsa')
    await page.waitForTimeout(700)
    const seen = await snapshot(page)
    assert.deepEqual(seen.replaces, [])
    assert.equal(paramsOf(seen.search).get('q'), 'elsa')
    assert.equal(seen.pageText, 'Seite 2 / 3')
    return { search: seen.search }
  })

  await fall(browser, origin, 'page-click-discards-draft', 'q=anna&page=3&source=support', { width: 1280, height: 800 }, async (page) => {
    await page.locator(SEARCH).fill('bob')
    await page.waitForTimeout(100)
    await page.getByRole('button', { name: 'Vorherige Seite' }).click()
    await page.waitForTimeout(500)
    const seen = await snapshot(page)
    assert.equal(seen.replaces.length, 1)
    assert.equal(paramsOf(seen.search).get('q'), 'anna')
    assert.equal(paramsOf(seen.search).get('page'), '2')
    assert.equal(seen.input, 'anna')
    return { search: seen.search }
  })

  await fall(browser, origin, 'rapid-edits-commit-last', 'q=anna&page=3&source=support', { width: 1280, height: 800 }, async (page) => {
    const input = page.locator(SEARCH)
    await input.fill('b')
    await page.waitForTimeout(80)
    await input.fill('be')
    await page.waitForTimeout(80)
    await input.fill('ber')
    await page.waitForTimeout(80)
    const mid = await snapshot(page)
    assert.deepEqual(mid.replaces, [])
    await page.waitForTimeout(600)
    const seen = await snapshot(page)
    assert.equal(seen.replaces.length, 1)
    assert.equal(paramsOf(seen.search).get('q'), 'ber')
    assert.equal(paramsOf(seen.search).get('page'), '1')
    return { search: seen.search }
  })

  await fall(browser, origin, 'unmount-cancels-timer', 'q=anna&page=3&source=support', { width: 1280, height: 800 }, async (page) => {
    await page.locator(SEARCH).fill('bob')
    await page.waitForTimeout(80)
    await page.evaluate(() => window.__usersDirectory.unmount())
    await page.waitForSelector('[data-users-directory-unmounted="true"]', { state: 'attached' })
    await page.waitForTimeout(700)
    const seen = await snapshot(page)
    assert.deepEqual(seen.replaces, [])
    assert.deepEqual(seen.refreshCalls, [])
    return { search: seen.search }
  })

  await fall(browser, origin, 'late-own-ack-keeps-newer-draft', 'q=anna&page=3&source=support', { width: 1280, height: 800 }, async (page) => {
    await page.evaluate(() => window.__usersDirectory.delayCommits(true))
    const input = page.locator(SEARCH)
    await input.fill('bob')
    await page.waitForFunction(() => window.__usersDirectory.replaces().length === 1 && window.__usersDirectory.pendingCommits().length === 1)
    await input.fill('bobby')
    const acked = await page.evaluate(() => window.__usersDirectory.commitNext())
    assert.equal(paramsOf(String(acked).split('?')[1]).get('q'), 'bob')
    await page.waitForFunction(() => window.__usersDirectory.input() === 'bobby' && window.__usersDirectory.search().includes('q=bob'))
    await page.waitForFunction(() => window.__usersDirectory.replaces().length === 2)
    await page.evaluate(() => window.__usersDirectory.commitNext())
    await page.waitForTimeout(500)
    const done = await snapshot(page)
    assert.equal(done.input, 'bobby')
    assert.equal(paramsOf(done.search).get('q'), 'bobby')
    assert.equal(paramsOf(done.search).get('page'), '1')
    assert.equal(paramsOf(done.search).get('source'), 'support')
    return { search: done.search }
  })

  await fall(browser, origin, 'external-wins-over-held-search', 'q=anna&page=3&source=support', { width: 1280, height: 800 }, async (page) => {
    await page.evaluate(() => window.__usersDirectory.delayCommits(true))
    const input = page.locator(SEARCH)
    await input.fill('bob')
    await page.waitForFunction(() => window.__usersDirectory.pendingCommits().length === 1)
    await input.fill('bobby')
    await page.evaluate(() => window.__usersDirectory.external('q=elsa&page=2&source=support'))
    await page.waitForFunction(() => window.__usersDirectory.input() === 'elsa')
    await page.waitForTimeout(700)
    const done = await snapshot(page)
    assert.equal(done.replaces.length, 1)
    assert.equal(done.input, 'elsa')
    assert.equal(paramsOf(done.search).get('q'), 'elsa')
    assert.deepEqual(done.pending, [])
    return { search: done.search }
  })

  await fall(browser, origin, 'native-back-keeps-pending-and-field', 'q=bob&page=1&source=support&reviewHold=1', { width: 1280, height: 800 }, async (page) => {
    await page.evaluate(() => window.__usersDirectory.delayCommits(true))
    await page.evaluate(() => window.__usersDirectory.pushHistory('q=anna&page=3&source=support&reviewHold=1'))
    await page.waitForFunction(() => window.__usersDirectory.input() === 'anna')
    const input = page.locator(SEARCH)
    await input.fill('bob')
    await page.waitForFunction(() => window.__usersDirectory.pendingCommits().length === 1)
    await input.fill('bobby')
    await page.evaluate(() => new Promise((resolve) => {
      window.addEventListener('popstate', () => resolve(true), { once: true })
      history.back()
    }))
    await page.waitForFunction(() => window.__usersDirectory.input() === 'bob')
    await page.waitForTimeout(500)
    const afterBack = await snapshot(page)
    assert.equal(afterBack.input, 'bob')
    assert.equal(paramsOf(afterBack.search).get('q'), 'bob')
    assert.equal(paramsOf(afterBack.search).get('reviewHold'), '1')
    assert.equal(afterBack.pending.length, 1)
    await page.evaluate(() => new Promise((resolve) => {
      window.addEventListener('popstate', () => resolve(true), { once: true })
      history.forward()
    }))
    await page.waitForFunction(() => window.__usersDirectory.input() === 'anna')
    const afterForward = await snapshot(page)
    assert.equal(afterForward.input, 'anna')
    assert.equal(paramsOf(afterForward.search).get('page'), '3')
    return { afterBack: afterBack.search, afterForward: afterForward.search }
  })

  await fall(browser, origin, 'role-status-and-page-keep-filters', 'q=anna&page=3&source=support', { width: 1280, height: 800 }, async (page) => {
    await page.getByRole('combobox', { name: 'Rolle' }).selectOption('operator')
    await page.waitForFunction(() => new URLSearchParams(window.__usersDirectory.search()).get('role') === 'operator')
    const afterRole = await snapshot(page)
    assert.equal(paramsOf(afterRole.search).get('page'), '1')
    assert.equal(paramsOf(afterRole.search).get('q'), 'anna')
    assert.equal(paramsOf(afterRole.search).get('source'), 'support')
    const before = afterRole.replaces.length
    await page.getByRole('combobox', { name: 'Rolle' }).selectOption('operator')
    await page.waitForTimeout(200)
    const same = await snapshot(page)
    assert.equal(same.replaces.length, before)
    await page.getByRole('combobox', { name: 'Status' }).selectOption('pending')
    await page.waitForFunction(() => new URLSearchParams(window.__usersDirectory.search()).get('status') === 'pending')
    await page.getByRole('button', { name: 'Nächste Seite' }).click()
    await page.waitForTimeout(200)
    const paged = await snapshot(page)
    assert.equal(paramsOf(paged.search).get('role'), 'operator')
    assert.equal(paramsOf(paged.search).get('status'), 'pending')
    assert.equal(paramsOf(paged.search).get('q'), 'anna')
    assert.equal(paramsOf(paged.search).get('source'), 'support')
    await page.getByRole('button', { name: 'Filter löschen' }).click()
    await page.waitForFunction(() => !new URLSearchParams(window.__usersDirectory.search()).get('role'))
    const cleared = await snapshot(page)
    assert.equal(paramsOf(cleared.search).get('q'), null)
    assert.equal(paramsOf(cleared.search).get('role'), null)
    assert.equal(paramsOf(cleared.search).get('status'), null)
    assert.equal(paramsOf(cleared.search).get('page'), '1')
    assert.equal(paramsOf(cleared.search).get('source'), 'support')
    return { cleared: cleared.search }
  })

  await fall(browser, origin, 'ceiling-unknown-count', 'page=5000', { width: 1280, height: 800 }, async (page) => {
    await page.evaluate(() => {
      const users = Array.from({ length: 20 }, (_, index) => ({
        user_id: `synthetic-row-${index}`,
        email: `person${index}@example.test`,
        display_name: `Person ${index}`,
        role: 'user',
        status: 'active',
        created_at: '2024-06-15T14:30:00.000Z',
        last_seen_at: null,
      }))
      window.__usersDirectory.setFixture({ count: null, users, mode: 'ready' })
    })
    await page.waitForFunction(() => window.__usersDirectory.countText() === 'Anzahl nicht verfügbar')
    const seen = await snapshot(page)
    assert.equal(seen.pageText, 'Seite 5000')
    assert.equal(await page.getByRole('button', { name: 'Nächste Seite' }).isDisabled(), true)
    assert.equal(seen.html.includes('page=5001'), false)
    assert.equal(seen.html.includes('Letzte erreichbare Seite'), false)
    await page.getByRole('button', { name: 'Vorherige Seite' }).click()
    await page.waitForFunction(() => new URLSearchParams(window.__usersDirectory.search()).get('page') === '4999')
    return { pageText: seen.pageText }
  })

  await fall(browser, origin, 'ceiling-count-100001', 'page=1', { width: 1280, height: 800 }, async (page) => {
    await page.evaluate(() => {
      const users = Array.from({ length: 20 }, (_, index) => ({
        user_id: `synthetic-row-${index}`,
        email: `person${index}@example.test`,
        display_name: `Person ${index}`,
        role: 'user',
        status: 'active',
        created_at: '2024-06-15T14:30:00.000Z',
        last_seen_at: null,
      }))
      window.__usersDirectory.setFixture({ count: 100001, users, mode: 'ready' })
    })
    await page.waitForFunction(() => window.__usersDirectory.countText() === '100001 Nutzer')
    const first = await snapshot(page)
    assert.match(first.status, /5001 Seiten/)
    assert.match(first.status, /1 bis 5000/)
    await page.getByRole('button', { name: 'Letzte erreichbare Seite' }).click()
    await page.waitForFunction(() => new URLSearchParams(window.__usersDirectory.search()).get('page') === '5000')
    const last = await snapshot(page)
    assert.equal(last.countText, '100001 Nutzer')
    assert.match(last.status, /5001 Seiten/)
    assert.equal(await page.getByRole('button', { name: 'Nächste Seite' }).isDisabled(), true)
    assert.equal(last.html.includes('page=5001'), false)
    await page.evaluate(() => window.__usersDirectory.external('page=4999'))
    await page.waitForFunction(() => window.__usersDirectory.pageText()?.includes('4999'))
    await page.getByRole('button', { name: 'Nächste Seite' }).click()
    await page.waitForFunction(() => new URLSearchParams(window.__usersDirectory.search()).get('page') === '5000')
    return { count: last.countText }
  })

  await fall(browser, origin, 'invalid-page-5001-recovery', 'page=5001&role=admin&source=support', { width: 1280, height: 800 }, async (page) => {
    await page.waitForFunction(() => (window.__usersDirectory.status() || '').includes('nicht gelesen'))
    const seen = await snapshot(page)
    assert.match(seen.status, /Diese Adresse kann nicht gelesen werden/)
    assert.equal(seen.countText, null)
    assert.equal(seen.html.includes('Keine Nutzer gefunden'), false)
    const href = await page.getByRole('link', { name: 'Gültige Adresse öffnen' }).getAttribute('href')
    assert.equal(new URLSearchParams(String(href).split('?')[1]).get('page'), '1')
    assert.equal(String(href).includes('5001'), false)
    assert.equal(new URLSearchParams(String(href).split('?')[1]).get('role'), 'admin')
    assert.equal(new URLSearchParams(String(href).split('?')[1]).get('source'), 'support')
    return { href }
  })

  await fall(browser, origin, 'states-empty-nomatch-range-error', 'page=1', { width: 1280, height: 800 }, async (page) => {
    await page.evaluate(() => window.__usersDirectory.setFixture({ count: 0, users: [], mode: 'ready' }))
    await page.waitForFunction(() => document.body.textContent?.includes('Keine Konten vorhanden.'))
    await page.evaluate(() => window.__usersDirectory.external('q=niemand&page=1'))
    await page.waitForFunction(() => document.body.textContent?.includes('Keine Treffer für diese Suche oder Filter.'))
    await page.evaluate(() => window.__usersDirectory.setFixture({ count: 20, users: [], mode: 'ready' }))
    await page.evaluate(() => window.__usersDirectory.external('page=99'))
    await page.waitForFunction(() => (window.__usersDirectory.pageText() || '').includes('Seite 99 ist in dieser Abfrage nicht vorhanden.'))
    const range = await snapshot(page)
    assert.equal(range.html.includes('Keine Nutzer gefunden'), false)
    assert.equal(range.countText, '20 Nutzer')
    await page.evaluate(() => window.__usersDirectory.setFixture({
      mode: 'error',
      fehler: { meldung: 'Datenbank abgelehnt', wiederholbar: false },
    }))
    await page.evaluate(() => window.__usersDirectory.external('page=1'))
    await page.waitForFunction(() => document.body.textContent?.includes('Datenbank abgelehnt'))
    const error = await snapshot(page)
    assert.equal(error.html.includes('Ein zweiter Versuch kann helfen'), false)
    assert.equal(await page.getByRole('button', { name: 'Erneut versuchen' }).count(), 1)
    return { range: range.pageText }
  })

  await fall(browser, origin, 'deferred-replace-before-url-ack', 'q=anna&page=3&source=support', { width: 1280, height: 800 }, async (page) => {
    await page.evaluate(() => {
      window.__usersDirectory.follow(false)
      window.__usersDirectory.delayCommits(true)
    })
    await page.getByRole('button', { name: 'Vorherige Seite' }).click()
    await page.waitForFunction(() => window.__usersDirectory.pendingCommits().length === 1)
    const held = await snapshot(page)
    assert.equal(paramsOf(held.search).get('q'), 'anna')
    assert.equal(paramsOf(held.search).get('page'), '3')
    assert.equal(held.input, 'anna')
    assert.match(held.status, /vorherigen Abfrage/)
    assert.equal(held.pageText, 'Seite 3 / 3')
    await page.evaluate(() => window.__usersDirectory.commitNext())
    await page.waitForFunction(() => new URLSearchParams(window.__usersDirectory.search()).get('page') === '2')
    const acked = await snapshot(page)
    assert.match(acked.status, /vorherigen Abfrage/)
    assert.doesNotMatch(acked.status, /Aktuelle Ergebnisse/)
    assert.equal(acked.pageText, 'Seite 3 / 3')
    await page.evaluate(() => window.__usersDirectory.applyServer())
    await page.waitForFunction(() => (window.__usersDirectory.status() || '').includes('Aktuelle Ergebnisse'))
    const settled = await snapshot(page)
    assert.equal(settled.pageText, 'Seite 2 / 3')
    assert.doesNotMatch(settled.status, /vorherigen Abfrage/)
    return { settled: settled.pageText }
  })

  await fall(browser, origin, 'draft-cancels-refresh-before-debounce', 'q=anna&page=1', { width: 1280, height: 800 }, async (page) => {
    await page.evaluate(() => {
      window.__usersDirectory.follow(false)
      window.__usersDirectory.setFixture({ mode: 'error', fehler: { meldung: 'Datenbank abgelehnt', wiederholbar: true } })
      window.__usersDirectory.applyServer()
    })
    await page.getByRole('button', { name: 'Erneut versuchen' }).click()
    await page.waitForFunction(() => window.__usersDirectory.refreshCalls().length === 1)
    assert.equal(await page.getByRole('button', { name: 'Erneut versuchen' }).isDisabled(), true)
    await page.locator(SEARCH).fill('berta')
    await page.waitForTimeout(50)
    const during = await snapshot(page)
    assert.equal(during.refreshCalls.length, 1)
    assert.doesNotMatch(during.status, /erneut gelesen/)
    await page.evaluate(() => {
      const button = [...document.querySelectorAll('button')].find((item) => item.textContent?.includes('Erneut versuchen'))
      button?.click()
    })
    const blocked = await snapshot(page)
    assert.equal(blocked.refreshCalls.length, 1)
    await page.waitForTimeout(600)
    const committed = await snapshot(page)
    assert.equal(paramsOf(committed.search).get('q'), 'berta')
    await page.evaluate(() => {
      window.__usersDirectory.setFixture({ mode: 'ready', count: 60 })
      window.__usersDirectory.applyServer()
    })
    await page.waitForFunction(() => (window.__usersDirectory.status() || '').includes('Aktuelle Ergebnisse'))
    return { refreshCalls: 1 }
  })

  await fall(browser, origin, 'filter-page-back-unmount-cancel-lease', 'q=anna&page=2&source=support', { width: 1280, height: 800 }, async (page) => {
    async function arm() {
      const before = await page.locator('[data-users-directory-status]').getAttribute('data-read-attempt')
      await page.evaluate(() => {
        window.__usersDirectory.follow(false)
        window.__usersDirectory.setFixture({ mode: 'error', fehler: { meldung: 'Datenbank abgelehnt', wiederholbar: false } })
        window.__usersDirectory.applyServer()
      })
      await page.waitForFunction((prev) => {
        const next = document.querySelector('[data-users-directory-status]')?.getAttribute('data-read-attempt')
        return Boolean(next && next !== prev)
      }, before)
      await page.getByRole('button', { name: 'Erneut versuchen' }).click()
      const detail = await page.evaluate(() => ({
        status: window.__usersDirectory.status(),
        search: window.__usersDirectory.search(),
        phase: document.querySelector('[data-users-directory-root]')?.getAttribute('data-operation-phase'),
        lease: document.querySelector('[data-users-directory-root]')?.getAttribute('data-lease-phase'),
        disabled: [...document.querySelectorAll('button')].find((item) => item.textContent?.includes('Erneut versuchen'))?.disabled ?? null,
      }))
      if (!detail.status.includes('erneut gelesen')) throw new Error(JSON.stringify(detail))
    }
    await arm()
    await page.getByRole('combobox', { name: 'Rolle' }).selectOption('operator')
    await page.waitForFunction(() => !(window.__usersDirectory.status() || '').includes('erneut gelesen'))
    const afterFilter = await snapshot(page)
    assert.equal(afterFilter.refreshCalls.length, 1)
    await page.evaluate(() => window.__usersDirectory.external('q=anna&page=2&source=support'))
    await arm()
    await page.getByRole('button', { name: 'Vorherige Seite' }).click()
    await page.waitForFunction(() => !(window.__usersDirectory.status() || '').includes('erneut gelesen'))
    const afterPage = await snapshot(page)
    assert.equal(afterPage.refreshCalls.length, 2)
    assert.doesNotMatch(afterPage.status, /erneut gelesen/)
    await page.evaluate(() => window.__usersDirectory.external('q=anna&page=2&source=support'))
    await arm()
    await page.evaluate(() => window.__usersDirectory.back())
    await page.waitForFunction(() => !(window.__usersDirectory.status() || '').includes('erneut gelesen'))
    const afterBack = await snapshot(page)
    assert.doesNotMatch(afterBack.status, /Aktuelle Ergebnisse/)
    assert.doesNotMatch(afterBack.status, /erneut gelesen/)
    await page.evaluate(() => {
      window.__usersDirectory.external('q=anna&page=2&source=support')
    })
    await arm()
    const beforeUnmount = (await snapshot(page)).refreshCalls.length
    await page.evaluate(() => window.__usersDirectory.unmount())
    await page.waitForSelector('[data-users-directory-unmounted="true"]', { state: 'attached' })
    await page.waitForTimeout(200)
    const afterUnmount = await snapshot(page)
    assert.equal(afterUnmount.refreshCalls.length, beforeUnmount)
    assert.equal(afterUnmount.replaces.length, afterPage.replaces.length)
    return { refreshCalls: afterUnmount.refreshCalls.length }
  })

  await fall(browser, origin, 'same-query-refresh-and-same-error', 'q=anna&page=1', { width: 1280, height: 800 }, async (page) => {
    await page.evaluate(() => {
      window.__usersDirectory.follow(false)
      window.__usersDirectory.setFixture({ mode: 'error', fehler: { meldung: 'Datenbank abgelehnt', wiederholbar: false } })
      window.__usersDirectory.applyServer()
    })
    await page.getByRole('button', { name: 'Erneut versuchen' }).click()
    await page.waitForFunction(() => window.__usersDirectory.refreshCalls().length === 1)
    assert.equal(await page.getByRole('button', { name: 'Erneut versuchen' }).isDisabled(), true)
    await page.evaluate(() => {
      const button = [...document.querySelectorAll('button')].find((item) => item.textContent?.includes('Erneut versuchen'))
      button?.click()
    })
    assert.equal((await snapshot(page)).refreshCalls.length, 1)
    await page.evaluate(() => window.__usersDirectory.applyServer())
    await page.waitForFunction(() => {
      const button = [...document.querySelectorAll('button')].find((item) => item.textContent?.includes('Erneut versuchen'))
      return Boolean(button && !button.disabled)
    })
    const same = await snapshot(page)
    assert.match(same.html, /Datenbank abgelehnt/)
    assert.doesNotMatch(same.status, /Aktuelle Ergebnisse/)
    assert.doesNotMatch(same.status, /nicht bestätigt/)
    await page.getByRole('button', { name: 'Erneut versuchen' }).click()
    await page.waitForFunction(() => window.__usersDirectory.refreshCalls().length === 2)
    return { refreshCalls: 2 }
  })

  await fall(
    browser,
    origin,
    'lease-expires-without-new-render',
    'q=anna&page=1',
    { width: 1280, height: 800 },
    async (page) => {
      await page.evaluate(() => {
        window.__usersDirectory.follow(false)
        window.__usersDirectory.setFixture({ mode: 'error', fehler: { meldung: 'Datenbank abgelehnt', wiederholbar: false } })
        window.__usersDirectory.applyServer()
      })
      await page.getByRole('button', { name: 'Erneut versuchen' }).click()
      await page.waitForFunction(() => window.__usersDirectory.refreshCalls().length === 1)
      await page.clock.fastForward(8000)
      await page.waitForFunction(() => (window.__usersDirectory.status() || '').includes('nicht bestätigt'))
      const seen = await snapshot(page)
      assert.match(seen.status, /Die erneute Abfrage wurde nicht bestätigt/)
      assert.doesNotMatch(seen.status, /Aktuelle Ergebnisse/)
      assert.equal(seen.refreshCalls.length, 1)
      assert.equal(await page.getByRole('button', { name: 'Erneut versuchen' }).isDisabled(), false)
      return { status: seen.status }
    },
    { clock: true },
  )

  await fall(browser, origin, 'read-controls-do-not-mutate', 'q=anna&page=2&role=operator&status=pending', { width: 1280, height: 800 }, async (page) => {
    await page.locator(SEARCH).fill('  anna  ')
    await page.getByRole('button', { name: 'Vorherige Seite' }).click()
    await page.getByRole('combobox', { name: 'Status' }).selectOption('active')
    await page.waitForTimeout(200)
    const seen = await snapshot(page)
    assert.deepEqual(seen.actionCalls, [])
    return { calls: seen.actionCalls }
  })

  await fall(
    browser,
    origin,
    'editable-lower-rank-records-one-call',
    'page=1',
    { width: 1280, height: 800 },
    async (page) => {
      await page.getByRole('button', { name: 'Aktionen für Ada Example' }).click()
      await page.getByRole('menuitem', { name: 'Rolle: Creator' }).click()
      await page.getByRole('region', { name: /Änderung für Ada Example bestätigen/ }).waitFor()
      assert.deepEqual(await page.evaluate(() => window.__usersDirectory.actionCalls()), [])
      await page.getByRole('button', { name: 'Änderung bestätigen' }).click()
      await page.waitForFunction(() => window.__usersDirectory.actionCalls().length === 1)
      const calls = await page.evaluate(() => window.__usersDirectory.actionCalls())
      assert.deepEqual(calls, ['setUserRole'])
      return { calls }
    },
    { allowActions: true },
  )

  await fall(browser, origin, 'own-row-does-not-mutate', 'page=1', { width: 1280, height: 800 }, async (page) => {
    await page.getByRole('button', { name: 'Aktionen für Akteur Selbst' }).click()
    await page.waitForFunction(() => document.body.textContent?.includes('Das eigene Konto lässt sich hier nicht ändern.'))
    const calls = await page.evaluate(() => window.__usersDirectory.actionCalls())
    assert.deepEqual(calls, [])
    return { calls }
  })

  const widths = [320, 360, 390, 768, 1280]
  for (const width of widths) {
    await fall(browser, origin, `css-${width}`, 'q=anna&role=operator&status=pending&page=1', { width, height: 900 }, async (page) => {
      if (width === 320) await page.evaluate(() => { document.documentElement.style.fontSize = '32px' })
      await page.evaluate(() => {
        const users = [{
          user_id: 'synthetic-long',
          email: 'very-long-mailbox-name.with.dots.and.more.words@example.test',
          display_name: 'Langer Anzeigename mit vielen Wörtern ohne feste Breite',
          role: 'user',
          status: 'pending',
          created_at: '2024-06-15T14:30:00.000Z',
          last_seen_at: null,
        }]
        window.__usersDirectory.setFixture({ count: 1, users, mode: 'ready' })
      })
      await page.waitForTimeout(100)
      const box = await page.evaluate(() => {
        const root = document.querySelector('[data-users-directory-root]')
        if (!root) return null
        return { scrollWidth: root.scrollWidth, clientWidth: root.clientWidth }
      })
      const wide = await page.evaluate(() => {
        const root = document.querySelector('[data-users-directory-root]')
        if (!root) return []
        const row = root.querySelector('tbody tr')
        const action = row?.querySelector('td:last-child')
        const rowRect = row?.getBoundingClientRect()
        const actionRect = action?.getBoundingClientRect()
        const actionStyle = action ? getComputedStyle(action) : null
        return {
          row: rowRect ? { w: Math.round(rowRect.width), r: Math.round(rowRect.right) } : null,
          action: actionRect ? { w: Math.round(actionRect.width), r: Math.round(actionRect.right), position: actionStyle.position, right: actionStyle.right } : null,
          rootRight: Math.round(root.getBoundingClientRect().right),
        }
      })
      assert.ok(box)
      assert.equal(box.scrollWidth <= box.clientWidth + 1, true, JSON.stringify({ box, wide }))
      if (width === 390 || width === 1280) {
        const name = width === 390 ? 'mobile-directory.png' : 'desktop-directory.png'
        await page.screenshot({ path: join(EVIDENCE, name), fullPage: true })
        await page.screenshot({ path: join(ARTIFACTS, `admin-users-${name}`), fullPage: true })
      }
      return { box }
    })
  }

  await fall(browser, origin, 'css-error-layout', 'page=1', { width: 390, height: 844 }, async (page) => {
    await page.evaluate(() => {
      window.__usersDirectory.setFixture({ mode: 'error', fehler: { meldung: 'Datenbank abgelehnt', wiederholbar: true } })
    })
    await page.waitForSelector('text=Erneut versuchen')
    const overflow = await page.evaluate(() => {
      const root = document.querySelector('[data-users-directory-root]')
      return root ? root.scrollWidth <= root.clientWidth + 1 : false
    })
    assert.equal(overflow, true)
    await page.screenshot({ path: join(EVIDENCE, 'error-mobile.png'), fullPage: true })
    await page.screenshot({ path: join(ARTIFACTS, 'admin-users-error-mobile.png'), fullPage: true })
    return {
      overflow: true,
      retiredCheck: 'querySelector-focus-enumeration',
      keyboardProof: 'see keyboard-tab-and-activation',
    }
  })

  async function armError(page) {
    await page.evaluate(() => {
      window.__usersDirectory.follow(false)
      window.__usersDirectory.setFixture({ mode: 'error', fehler: { meldung: 'Datenbank abgelehnt', wiederholbar: true } })
      window.__usersDirectory.applyServer()
    })
    await page.waitForSelector('text=Erneut versuchen')
  }

  for (const adresse of [
    { name: 'retry-omitted-page', search: '' },
    { name: 'retry-q-without-page', search: 'q=anna' },
    { name: 'retry-padded-page', search: 'page=%201%20' },
    { name: 'retry-explicit-page', search: 'page=1' },
  ]) {
    await fall(browser, origin, adresse.name, adresse.search, { width: 1280, height: 800 }, async (page) => {
      await armError(page)
      const before = await page.evaluate(() => window.__usersDirectory.refreshCalls().length)
      assert.equal(before, 0)
      await page.getByRole('button', { name: 'Erneut versuchen' }).click()
      await page.waitForFunction(() => window.__usersDirectory.refreshCalls().length === 1)
      assert.equal(await page.getByRole('button', { name: 'Erneut versuchen' }).isDisabled(), true)
      return { refreshCalls: 1, search: await page.evaluate(() => window.__usersDirectory.search()) }
    })
  }

  await fall(browser, origin, 'retry-repeated-page-rejected', 'page=1&page=2', { width: 1280, height: 800 }, async (page) => {
    const seen = await snapshot(page)
    assert.match(seen.status, /nicht gelesen/)
    assert.equal(await page.getByRole('button', { name: 'Erneut versuchen' }).count(), 0)
    assert.deepEqual(seen.refreshCalls, [])
    return { status: seen.status }
  })

  await fall(browser, origin, 'clear-supersedes-delayed-search', 'page=1', { width: 1280, height: 800 }, async (page) => {
    await page.evaluate(() => window.__usersDirectory.delayCommits(true))
    await page.locator(SEARCH).fill('anna')
    await page.waitForFunction(() => window.__usersDirectory.pendingCommits().length === 1)
    await page.getByRole('button', { name: 'Filter löschen' }).click()
    await page.waitForFunction(() => window.__usersDirectory.input() === '' && window.__usersDirectory.pendingCommits().length === 2)
    const held = await snapshot(page)
    assert.equal(new URLSearchParams(held.pending[0].split('?')[1] ?? '').get('q'), 'anna')
    assert.equal(new URLSearchParams(held.pending[1].split('?')[1] ?? '').get('q'), null)
    const landed = await page.evaluate(() => window.__usersDirectory.commitNext())
    assert.equal(new URLSearchParams(String(landed).split('?')[1] ?? '').get('q'), 'anna')
    await page.waitForFunction(() => {
      const input = window.__usersDirectory.input()
      const status = window.__usersDirectory.status() || ''
      return input === 'anna' || (input === '' && status.includes('vorherigen Abfrage'))
    })
    const afterStale = await snapshot(page)
    assert.equal(afterStale.input, '')
    assert.match(afterStale.status, /vorherigen Abfrage/)
    assert.doesNotMatch(afterStale.status, /Aktuelle Ergebnisse/)
    assert.equal(paramsOf(afterStale.search).get('q'), 'anna')
    assert.equal(afterStale.pending.length, 1)
    assert.notEqual(
      await page.evaluate(() => document.querySelector('[data-users-directory-root]')?.getAttribute('data-operation-phase')),
      'settled',
    )
    const corrected = await page.evaluate(() => window.__usersDirectory.commitNext())
    assert.equal(new URLSearchParams(String(corrected).split('?')[1] ?? '').get('q'), null)
    await page.waitForFunction(() => {
      const params = new URLSearchParams(window.__usersDirectory.search())
      const status = window.__usersDirectory.status() || ''
      return params.get('q') === null && params.get('page') === '1' && window.__usersDirectory.input() === '' && status.includes('Aktuelle Ergebnisse')
    })
    const done = await snapshot(page)
    assert.doesNotMatch(done.status, /vorherigen Abfrage/)
    return { search: done.search, input: done.input }
  })

  for (const filter of [
    { name: 'role-keeps-delayed-search-ownership', control: 'Rolle', value: 'operator', key: 'role' },
    { name: 'status-keeps-delayed-search-ownership', control: 'Status', value: 'pending', key: 'status' },
  ]) {
    await fall(browser, origin, filter.name, 'page=1', { width: 1280, height: 800 }, async (page) => {
      await page.evaluate(() => window.__usersDirectory.delayCommits(true))
      await page.locator(SEARCH).fill('anna')
      await page.waitForFunction(() => window.__usersDirectory.pendingCommits().length === 1)
      await page.getByRole('combobox', { name: filter.control }).selectOption(filter.value)
      await page.waitForFunction(() => window.__usersDirectory.input() === '' && window.__usersDirectory.pendingCommits().length === 2)
      const held = await snapshot(page)
      assert.equal(new URLSearchParams(held.pending[0].split('?')[1] ?? '').get('q'), 'anna')
      assert.equal(new URLSearchParams(held.pending[1].split('?')[1] ?? '').get('q'), null)
      assert.equal(new URLSearchParams(held.pending[1].split('?')[1] ?? '').get(filter.key), filter.value)
      const landed = await page.evaluate(() => window.__usersDirectory.commitNext())
      assert.equal(new URLSearchParams(String(landed).split('?')[1] ?? '').get('q'), 'anna')
      await page.waitForFunction(() => {
        const input = window.__usersDirectory.input()
        const status = window.__usersDirectory.status() || ''
        return input === 'anna' || (input === '' && status.includes('vorherigen Abfrage'))
      })
      const afterStale = await snapshot(page)
      assert.equal(afterStale.input, '')
      assert.match(afterStale.status, /vorherigen Abfrage/)
      assert.doesNotMatch(afterStale.status, /Aktuelle Ergebnisse/)
      assert.equal(paramsOf(afterStale.search).get('q'), 'anna')
      assert.equal(afterStale.pending.length, 1)
      assert.notEqual(
        await page.evaluate(() => document.querySelector('[data-users-directory-root]')?.getAttribute('data-operation-phase')),
        'settled',
      )
      const corrected = await page.evaluate(() => window.__usersDirectory.commitNext())
      const correctedParams = new URLSearchParams(String(corrected).split('?')[1] ?? '')
      assert.equal(correctedParams.get('q'), null)
      assert.equal(correctedParams.get(filter.key), filter.value)
      await page.waitForFunction(({ key, value }) => {
        const params = new URLSearchParams(window.__usersDirectory.search())
        const status = window.__usersDirectory.status() || ''
        return params.get('q') === null && params.get(key) === value && window.__usersDirectory.input() === '' && status.includes('Aktuelle Ergebnisse')
      }, filter)
      const done = await snapshot(page)
      assert.equal(done.actionCalls.length, 0)
      assert.doesNotMatch(done.status, /vorherigen Abfrage/)
      return { search: done.search, input: done.input, filter: filter.key }
    })
  }

  await fall(browser, origin, 'keyboard-tab-and-activation', 'page=1', { width: 1280, height: 800 }, async (page) => {
    async function focusStart() {
      await page.evaluate(() => {
        const start = document.querySelector('h1')
        if (!(start instanceof HTMLElement)) throw new Error('missing h1')
        start.tabIndex = -1
        start.focus()
      })
    }
    async function tabInside(limit, stop) {
      const sequence = []
      for (let index = 0; index < limit; index += 1) {
        await page.keyboard.press('Tab')
        const info = await page.evaluate(() => {
          const el = document.activeElement
          const root = document.querySelector('[data-users-directory-root]')
          const inside = Boolean(el && root && root.contains(el))
          const disabled = el instanceof HTMLButtonElement || el instanceof HTMLInputElement || el instanceof HTMLSelectElement
            ? el.disabled
            : false
          const label = el instanceof Element
            ? (el.getAttribute('aria-label') || el.textContent || '').replace(/\s+/g, ' ').trim()
            : ''
          return { inside, disabled, label, tag: el?.tagName ?? '' }
        })
        if (!info.inside) break
        sequence.push(info)
        if (stop(info.label)) break
      }
      return sequence
    }
    await focusStart()
    const sequence = await tabInside(12, (label) => label === 'Nächste Seite')
    assert.deepEqual(sequence.filter((item) => item.disabled), [])
    assert.equal(sequence.some((item) => item.label.includes('Nutzer nach Name')), true)
    assert.equal(sequence.some((item) => item.label === 'Rolle'), true)
    assert.equal(sequence.some((item) => item.label === 'Status'), true)
    assert.equal(sequence.some((item) => item.label.includes('Filter löschen')), true)
    assert.equal(sequence.some((item) => item.label === 'Vorherige Seite'), false)
    assert.equal(sequence.some((item) => item.label === 'Erste Seite'), false)
    assert.equal(await page.getByRole('button', { name: 'Vorherige Seite' }).isDisabled(), true)
    assert.equal(await page.getByRole('button', { name: 'Erste Seite' }).isDisabled(), true)
    assert.equal(sequence.at(-1)?.label, 'Nächste Seite')
    assert.equal(await page.evaluate(() => document.activeElement?.getAttribute('aria-label')), 'Nächste Seite')
    await page.keyboard.press('Enter')
    await page.waitForFunction(() => new URLSearchParams(window.__usersDirectory.search()).get('page') === '2')
    await page.evaluate(() => {
      window.__usersDirectory.setFixture({ mode: 'error', fehler: { meldung: 'Datenbank abgelehnt', wiederholbar: true } })
    })
    await page.waitForSelector('text=Erneut versuchen')
    await focusStart()
    const errorSequence = await tabInside(12, (label) => label.includes('Erneut versuchen'))
    assert.deepEqual(errorSequence.filter((item) => item.disabled), [])
    assert.equal(errorSequence.some((item) => item.label === 'Nächste Seite'), false)
    assert.equal(await page.getByRole('button', { name: 'Nächste Seite' }).isDisabled(), true)
    assert.equal(errorSequence.at(-1)?.label.includes('Erneut versuchen'), true)
    assert.equal(
      await page.evaluate(() => (document.activeElement?.textContent || '').includes('Erneut versuchen')),
      true,
    )
    await page.keyboard.press('Enter')
    await page.waitForFunction(() => window.__usersDirectory.refreshCalls().length === 1)
    assert.equal(await page.getByRole('button', { name: 'Erneut versuchen' }).isDisabled(), true)
    return {
      method: 'Tab and Enter',
      skippedDisabled: ['Erste Seite', 'Vorherige Seite', 'Nächste Seite on error'],
      sequence: sequence.map((item) => item.label),
      errorSequence: errorSequence.map((item) => item.label),
      activated: ['Nächste Seite', 'Erneut versuchen'],
      refreshCalls: 1,
    }
  })

  await fall(
    browser,
    origin,
    'reduced-motion-no-new-infinite-animation',
    'page=1',
    { width: 1280, height: 800 },
    async (page) => {
      await page.evaluate(() => {
        window.__usersDirectory.setFixture({ mode: 'error', fehler: { meldung: 'Datenbank abgelehnt', wiederholbar: false } })
      })
      await page.waitForSelector('text=Erneut versuchen')
      const infinite = await page.evaluate(() => {
        const root = document.querySelector('[data-users-directory-root]')
        if (!root) return ['missing-root']
        return [...root.querySelectorAll('*')].flatMap((element) => {
          const style = getComputedStyle(element)
          if (style.animationIterationCount === 'infinite' && style.animationName !== 'none') {
            return [element.className || element.tagName]
          }
          return []
        })
      })
      assert.deepEqual(infinite, [])
      return { infinite }
    },
    { reducedMotion: true },
  )
} finally {
  const head = execSync('git rev-parse HEAD', { cwd: REPO }).toString().trim()
  const dirty = execSync('git status --short', { cwd: REPO }).toString()
  const bericht = {
    mode: 'mounted-UsersTable-synthetic-router',
    notSignedInNext: true,
    notHostedSupabase: true,
    notRls: true,
    notProduction: true,
    refreshIsNotAReceipt: true,
    readAttemptIsNotCausal: true,
    head,
    dirty,
    node: process.version,
    playwright: require(join(REPO, 'node_modules/playwright/package.json')).version,
    faelle: ergebnisse,
  }
  writeFileSync(join(EVIDENCE, 'mounted.json'), `${JSON.stringify(bericht, null, 2)}\n`)
  writeFileSync(join(ARTIFACTS, 'admin-users-directory-mounted.json'), `${JSON.stringify(bericht, null, 2)}\n`)
  await browser.close()
  server.close()
}

const fehler = ergebnisse.filter((eintrag) => eintrag.ok === false)
if (fehler.length > 0) {
  console.error(JSON.stringify(fehler, null, 2))
  process.exit(1)
}
console.log(JSON.stringify({ ok: true, faelle: ergebnisse.length }))
