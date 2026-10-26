#!/usr/bin/env node
// Mounted proof for Admin User Mutation Safety 1.
// Synthetic rows, stubbed server actions, external network aborted.
// A fulfilled callback or refresh count is not treated as persistence.

import assert from 'node:assert/strict'
import { createRequire } from 'node:module'
import { createServer } from 'node:http'
import { mkdirSync, readFileSync, writeFileSync } from 'node:fs'
import { dirname, join } from 'node:path'
import { fileURLToPath } from 'node:url'

import esbuild from 'esbuild'
import { chromium } from 'playwright'

const require = createRequire(import.meta.url)
const REPO = join(dirname(fileURLToPath(import.meta.url)), '..', '..')
const EVIDENCE = join(REPO, 'docs/evidence/admin-user-mutation-safety-1')
const ARTIFACTS = '/opt/cursor/artifacts'
const OUT = join('/tmp', 'admin-user-mutation-safety-1-harness')

mkdirSync(OUT, { recursive: true })
mkdirSync(EVIDENCE, { recursive: true })
mkdirSync(ARTIFACTS, { recursive: true })

const results = []

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
      join(REPO, 'components/admin/users/**/*.{ts,tsx}'),
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
    define: { 'process.env.NODE_ENV': '"development"' },
  })
  return readFileSync(outfile, 'utf8')
}

function htmlPage(css, script) {
  return `<!doctype html><html lang="de"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width, initial-scale=1"><title>Mutation safety harness</title><style>${css}</style></head><body><div id="root"></div><script>${script}</script></body></html>`
}

function serve(css, script) {
  const server = createServer((req, res) => {
    res.writeHead(200, { 'Content-Type': 'text/html; charset=utf-8', 'Cache-Control': 'no-store' })
    res.end(htmlPage(css, script))
  })
  return new Promise((resolve) => {
    server.listen(0, '127.0.0.1', () => {
      const address = server.address()
      const port = typeof address === 'object' && address ? address.port : 0
      resolve({ server, origin: `http://127.0.0.1:${port}` })
    })
  })
}

async function openPage(browser, origin, search, viewport, options = {}) {
  const page = await browser.newPage({ viewport })
  const blocked = []
  await page.route('**/*', (route) => {
    const url = new URL(route.request().url())
    if (url.hostname === '127.0.0.1' || url.hostname === 'localhost') return route.continue()
    blocked.push(url.origin)
    return route.abort()
  })
  if (options.clock) await page.clock.install({ time: new Date('2026-10-26T12:00:00Z') })
  const pageErrors = []
  page.on('pageerror', (error) => pageErrors.push(String(error)))
  await page.goto(`${origin}/?${search}`, { waitUntil: 'domcontentloaded' })
  await page.waitForFunction(() => window.__mutation?.ready === true)
  return { page, pageErrors, blocked }
}

function remember(name, value) {
  results.push({ name, ...value })
  console.log(JSON.stringify({ name, ok: value.ok !== false }))
}

async function phases(page) {
  return page.evaluate(() => window.__mutation.phases())
}

async function calls(page) {
  return page.evaluate(() => window.__mutation.calls())
}

async function openMenu(page, name) {
  await page.getByRole('button', { name: `Aktionen für ${name}` }).click()
}

async function chooseRole(page, name, label) {
  await openMenu(page, name)
  await page.getByRole('menuitem', { name: label }).click()
  await page.getByRole('dialog').waitFor()
}

async function confirm(page) {
  await page.getByRole('button', { name: 'Änderung bestätigen' }).click()
}

const ada = {
  user_id: 'synthetic-ada',
  email: 'ada.example@example.test',
  display_name: 'Ada Example',
  role: 'user',
  status: 'active',
  created_at: '2024-06-15T14:30:00.000Z',
  last_seen_at: '2026-03-01T12:00:00.000Z',
}

const bao = {
  user_id: 'synthetic-bao',
  email: 'bao.example@example.test',
  display_name: 'Bao Example',
  role: 'operator',
  status: 'pending',
  created_at: '2024-06-15T14:30:00.000Z',
  last_seen_at: null,
}

function withRole(user, role) {
  return { ...user, role }
}

const css = await compileCss()
const script = await bundleHarness()
const { server, origin } = await serve(css, script)
const browser = await chromium.launch({ headless: true })
let failed = 0

async function fall(name, search, viewport, fn, options = {}) {
  const opened = await openPage(browser, origin, search, viewport, options)
  try {
    const value = await fn(opened.page, opened.blocked)
    assert.deepEqual(opened.pageErrors, [], `${name} pageerror`)
    remember(name, { ok: true, ...value })
  } catch (error) {
    failed += 1
    remember(name, { ok: false, error: String(error) })
  } finally {
    await opened.page.close()
  }
}

try {
  await fall('external-network-blocked', 'page=1', { width: 1280, height: 800 }, async (page, blocked) => {
    const outcome = await page.evaluate(async () => {
      try {
        await fetch('https://example.com/mutation-safety')
        return 'allowed'
      } catch {
        return 'blocked'
      }
    })
    assert.equal(outcome, 'blocked')
    assert.ok(blocked.some((originName) => originName === 'https://example.com'))
    return { outcome }
  })

  await fall('unknown-role-status-and-malformed-identity', 'page=1', { width: 390, height: 844 }, async (page) => {
    await openMenu(page, 'Unbekannte Rolle')
    await page.getByText('Die gespeicherte Rolle ist unbekannt').waitFor()
    assert.equal(await page.getByRole('menuitem').count(), 0)
    await page.keyboard.press('Escape')
    await openMenu(page, 'Unbekannter Status')
    await page.getByText('Der gespeicherte Status ist unbekannt').waitFor()
    await page.keyboard.press('Escape')
    await openMenu(page, 'Unbrauchbare Kennung')
    await page.getByText('Die Kontokennung ist unbrauchbar').waitFor()
    await page.keyboard.press('Escape')
    const truth = await page.evaluate(() => ({
      role: document.querySelector('[data-user-row="synthetic-unknown-role"] [data-role-truth]')?.textContent,
      status: document.querySelector('[data-user-row="synthetic-unknown-status"] [data-status-truth]')?.textContent,
    }))
    assert.equal(truth.role, 'Unbekannte Rolle')
    assert.equal(truth.status, 'Unbekannter Status')
    assert.deepEqual(await calls(page), [])
    return { truth }
  })

  await fall('self-and-peer-stay-blocked', 'page=1', { width: 1280, height: 800 }, async (page) => {
    await openMenu(page, 'Akteur Selbst')
    await page.getByText('Das eigene Konto lässt sich hier nicht ändern.').waitFor()
    await page.keyboard.press('Escape')
    await openMenu(page, 'Cio Example')
    await page.getByText('Für dieses Konto fehlt die Berechtigung.').waitFor()
    assert.deepEqual(await calls(page), [])
    return { calls: [] }
  })

  await fall('same-turn-double-activation', 'page=1', { width: 1280, height: 800 }, async (page) => {
    await page.evaluate(() => window.__mutation.hang())
    await chooseRole(page, 'Ada Example', 'Rolle: Creator')
    const dispatched = await page.evaluate(() => {
      const button = document.querySelector('[data-mutation-confirm]')
      button?.dispatchEvent(new MouseEvent('click', { bubbles: true }))
      button?.dispatchEvent(new MouseEvent('click', { bubbles: true }))
      return window.__mutation.calls()
    })
    assert.equal(dispatched.length, 1)
    assert.equal(dispatched[0].name, 'setUserRole')
    assert.equal(dispatched[0].userId, 'synthetic-ada')
    assert.equal(dispatched[0].value, 'creator')
    const seen = await phases(page)
    assert.equal(seen.filter((item) => item.subject === 'synthetic-ada' && item.phase === 'pending').length, 1)
    return { calls: dispatched.length }
  })

  await fall('role-then-status-for-one-pending-target', 'page=1', { width: 1280, height: 800 }, async (page) => {
    await page.evaluate(() => window.__mutation.hang())
    await chooseRole(page, 'Ada Example', 'Rolle: Creator')
    await confirm(page)
    await page.waitForFunction(() => window.__mutation.phases().some((item) => item.phase === 'pending'))
    await openMenu(page, 'Ada Example')
    const status = page.getByRole('menuitem', { name: 'Sperren' })
    assert.equal(await status.isDisabled(), true)
    await status.click({ force: true })
    assert.equal((await calls(page)).length, 1)
    assert.equal((await calls(page))[0].name, 'setUserRole')
    return { calls: 1 }
  })

  await fall('a-and-b-pending-a-settles-first', 'page=1', { width: 1280, height: 800 }, async (page) => {
    await page.evaluate(() => window.__mutation.hang())
    await chooseRole(page, 'Ada Example', 'Rolle: Creator')
    await confirm(page)
    await openMenu(page, 'Bao Example')
    await page.getByRole('menuitem', { name: 'Sperren' }).click()
    await page.getByRole('dialog').waitFor()
    await confirm(page)
    await page.waitForFunction(() => window.__mutation.calls().length === 2)
    await page.evaluate(() => window.__mutation.releaseHang())
    await page.waitForFunction(() => window.__mutation.phases().some((item) => item.subject === 'synthetic-ada' && item.phase === 'fulfilled'))
    const mid = await phases(page)
    assert.equal(mid.find((item) => item.subject === 'synthetic-bao')?.phase, 'pending')
    assert.ok((await page.evaluate(() => window.__mutation.refreshes())) >= 1)
    await page.evaluate(({ ada, bao }) => {
      window.__mutation.setRows([{ ...ada, role: 'creator' }, bao])
      window.__mutation.bump()
    }, { ada, bao })
    await page.waitForFunction(() => window.__mutation.phases().some((item) => item.subject === 'synthetic-ada' && item.phase === 'confirmed'))
    const after = await phases(page)
    assert.equal(after.find((item) => item.subject === 'synthetic-bao')?.phase, 'pending')
    assert.match(after.find((item) => item.subject === 'synthetic-ada')?.text ?? '', /Die neue Abfrage zeigt/)
    return { bao: 'pending', ada: 'confirmed' }
  })

  await fall('captured-row-changed-before-confirm', 'page=1', { width: 1280, height: 800 }, async (page) => {
    await chooseRole(page, 'Ada Example', 'Rolle: Creator')
    await page.evaluate((next) => window.__mutation.setRows([next]), withRole(ada, 'moderator'))
    await page.getByText('Das Konto hat sich seit der Auswahl geändert').waitFor()
    assert.equal(await page.getByRole('button', { name: 'Änderung bestätigen' }).isDisabled(), true)
    await page.evaluate(() => document.querySelector('[data-mutation-confirm]')?.dispatchEvent(new MouseEvent('click', { bubbles: true })))
    assert.deepEqual(await calls(page), [])
    return { calls: 0 }
  })

  await fall('fulfilled-without-new-read-is-not-confirmed', 'page=1', { width: 1280, height: 800 }, async (page) => {
    await chooseRole(page, 'Ada Example', 'Rolle: Creator')
    await confirm(page)
    await page.waitForFunction(() => window.__mutation.phases().some((item) => item.phase === 'fulfilled'))
    const seen = (await phases(page))[0]
    assert.ok((await page.evaluate(() => window.__mutation.refreshes())) >= 1)
    assert.match(seen?.text ?? '', /noch nicht bestätigt/)
    assert.equal(seen?.phase, 'fulfilled')
    return { phase: seen?.phase }
  })

  await fall('fulfilled-row-absent-does-not-reopen', 'page=1', { width: 1280, height: 800 }, async (page) => {
    await chooseRole(page, 'Ada Example', 'Rolle: Creator')
    await confirm(page)
    await page.waitForFunction(() => window.__mutation.phases().some((item) => item.phase === 'fulfilled'))
    await page.evaluate(() => {
      window.__mutation.setRows([])
      window.__mutation.bump()
    })
    await page.waitForFunction(() => window.__mutation.phases().some((item) => item.reason === 'absent'))
    await page.evaluate((next) => {
      window.__mutation.setRows([next])
      window.__mutation.bump()
    }, withRole(ada, 'creator'))
    await page.waitForTimeout(80)
    const seen = await phases(page)
    assert.equal(seen[0]?.phase, 'ambiguous')
    assert.equal(seen[0]?.reason, 'absent')
    assert.equal((await calls(page)).length, 1)
    return { reason: 'absent' }
  })

  await fall('fulfilled-row-unchanged', 'page=1', { width: 1280, height: 800 }, async (page) => {
    await chooseRole(page, 'Ada Example', 'Rolle: Creator')
    await confirm(page)
    await page.waitForFunction(() => window.__mutation.phases().some((item) => item.phase === 'fulfilled'))
    await page.evaluate((next) => {
      window.__mutation.setRows([next])
      window.__mutation.bump()
    }, ada)
    await page.waitForFunction(() => window.__mutation.phases().some((item) => item.reason === 'unchanged'))
    assert.match((await phases(page))[0]?.text ?? '', /keine bestätigte Speicherung/)
    return { reason: 'unchanged' }
  })

  await fall('fulfilled-row-contradictory', 'page=1', { width: 1280, height: 800 }, async (page) => {
    await chooseRole(page, 'Ada Example', 'Rolle: Creator')
    await confirm(page)
    await page.waitForFunction(() => window.__mutation.phases().some((item) => item.phase === 'fulfilled'))
    await page.evaluate((next) => {
      window.__mutation.setRows([next])
      window.__mutation.bump()
    }, withRole(ada, 'moderator'))
    await page.waitForFunction(() => window.__mutation.phases().some((item) => item.reason === 'contradictory'))
    assert.match((await phases(page))[0]?.text ?? '', /keine bestätigte Speicherung/)
    return { reason: 'contradictory' }
  })

  await fall('old-error-after-newer-query', 'page=1', { width: 1280, height: 800 }, async (page) => {
    await page.evaluate(() => window.__mutation.rejectNext('Für dieses Konto fehlt die Berechtigung.'))
    await chooseRole(page, 'Ada Example', 'Rolle: Creator')
    await confirm(page)
    await page.waitForFunction(() => window.__mutation.phases().some((item) => item.phase === 'rejected'))
    await page.evaluate((next) => window.__mutation.setRows([next]), bao)
    await page.locator('input[aria-label="Nutzer nach Name oder E-Mail suchen"]').fill('bao')
    await page.waitForFunction(() => window.__mutation.search().includes('bao'))
    const seen = await phases(page)
    assert.equal(seen[0]?.detached, true)
    assert.match(seen[0]?.text ?? '', /Ada Example/)
    const visible = await page.evaluate(() => window.__mutation.rowText('synthetic-bao'))
    assert.equal(visible.includes('abgelehnt'), false)
    assert.equal((await calls(page)).length, 1)
    return { detached: true }
  })

  await fall('transport-timeout-and-no-resend-recovery', 'page=1', { width: 1280, height: 800 }, async (page) => {
    await page.evaluate(() => window.__mutation.hang())
    await chooseRole(page, 'Ada Example', 'Rolle: Creator')
    await confirm(page)
    await page.waitForFunction(() => window.__mutation.phases().some((item) => item.phase === 'pending'))
    await page.clock.fastForward(8000)
    await page.waitForFunction(() => window.__mutation.phases().some((item) => item.reason === 'transport'))
    await page.evaluate(() => window.__mutation.releaseHang())
    await page.waitForTimeout(50)
    assert.equal((await phases(page))[0]?.reason, 'transport')
    const before = (await calls(page)).length
    await page.getByRole('button', { name: 'Hinweis schließen, ohne erneut zu senden' }).click()
    await page.waitForFunction(() => window.__mutation.phases().length === 0)
    assert.equal((await calls(page)).length, before)
    assert.equal(await page.evaluate(() => window.__mutation.storageWrites()), 0)
    return { calls: before }
  }, { clock: true })

  await fall('explicit-recovery-does-not-write', 'page=1', { width: 1280, height: 800 }, async (page) => {
    await page.evaluate(() => window.__mutation.transportNext())
    await chooseRole(page, 'Ada Example', 'Rolle: Creator')
    await confirm(page)
    await page.waitForFunction(() => window.__mutation.phases().some((item) => item.reason === 'transport'))
    await page.getByRole('button', { name: 'Hinweis schließen, ohne erneut zu senden' }).click()
    await page.waitForFunction(() => window.__mutation.phases().length === 0)
    assert.equal((await calls(page)).length, 1)
    return { calls: 1 }
  })

  await fall('failed-read-does-not-claim-absence', 'page=1', { width: 1280, height: 800 }, async (page) => {
    await chooseRole(page, 'Ada Example', 'Rolle: Creator')
    await confirm(page)
    await page.waitForFunction(() => window.__mutation.phases().some((item) => item.phase === 'fulfilled'))
    const before = (await calls(page)).length
    await page.evaluate(() => window.__mutation.deliver({ rows: [], mode: 'error' }))
    await page.getByText('Datenbank abgelehnt').waitFor()
    await page.waitForFunction(() => {
      const item = window.__mutation.phases()[0]
      return Boolean(item && item.phase === 'fulfilled' && item.text.includes('fehlgeschlagen'))
    })
    const seen = (await phases(page))[0]
    assert.equal(seen?.phase, 'fulfilled')
    assert.equal(seen?.reason, 'none')
    assert.match(seen?.text ?? '', /nicht, dass das Konto fehlt/)
    assert.doesNotMatch(seen?.text ?? '', /fehlt in der neuen Abfrage/)
    assert.doesNotMatch(seen?.text ?? '', /Die neue Abfrage zeigt/)
    assert.equal((await calls(page)).length, before)
    return { phase: seen?.phase }
  })

  await fall('invalid-read-does-not-claim-absence', 'page=1', { width: 1280, height: 800 }, async (page) => {
    await chooseRole(page, 'Ada Example', 'Rolle: Creator')
    await confirm(page)
    await page.waitForFunction(() => window.__mutation.phases().some((item) => item.phase === 'fulfilled'))
    await page.evaluate(() => window.__mutation.deliver({ rows: [], mode: 'invalid' }))
    await page.waitForFunction(() => {
      const item = window.__mutation.phases()[0]
      return Boolean(item && item.text.includes('ungültig'))
    })
    const seen = (await phases(page))[0]
    assert.equal(seen?.phase, 'fulfilled')
    assert.doesNotMatch(seen?.text ?? '', /fehlt in der neuen Abfrage/)
    assert.equal((await calls(page)).length, 1)
    return { phase: seen?.phase }
  })

  await fall('confirmed-then-contradictory-is-historical', 'page=1', { width: 1280, height: 800 }, async (page) => {
    await chooseRole(page, 'Ada Example', 'Rolle: Creator')
    await confirm(page)
    await page.waitForFunction(() => window.__mutation.phases().some((item) => item.phase === 'fulfilled'))
    await page.evaluate((next) => window.__mutation.deliver({ rows: [next], mode: 'ready' }), withRole(ada, 'creator'))
    await page.waitForFunction(() => window.__mutation.phases().some((item) => item.phase === 'confirmed'))
    assert.match((await phases(page))[0]?.text ?? '', /Die neue Abfrage zeigt/)
    await page.evaluate((next) => window.__mutation.deliver({ rows: [next], mode: 'ready' }), ada)
    await page.waitForFunction(() => window.__mutation.phases().some((item) => item.reason === 'contradictory'))
    const seen = (await phases(page))[0]
    const row = await page.evaluate(() => window.__mutation.rowText('synthetic-ada'))
    assert.match(row, /Nutzer/)
    assert.match(seen?.text ?? '', /Eine frühere Abfrage zeigte/)
    assert.match(seen?.text ?? '', /Nutzer/)
    assert.match(seen?.text ?? '', /nicht mehr der aktuelle Stand/)
    assert.doesNotMatch(seen?.text ?? '', /Die neue Abfrage zeigt/)
    assert.equal((await calls(page)).length, 1)
    return { reason: seen?.reason }
  })

  await fall('confirmed-then-absent-is-historical', 'page=1', { width: 1280, height: 800 }, async (page) => {
    await chooseRole(page, 'Ada Example', 'Rolle: Creator')
    await confirm(page)
    await page.waitForFunction(() => window.__mutation.phases().some((item) => item.phase === 'fulfilled'))
    await page.evaluate((next) => window.__mutation.deliver({ rows: [next], mode: 'ready' }), withRole(ada, 'creator'))
    await page.waitForFunction(() => window.__mutation.phases().some((item) => item.phase === 'confirmed'))
    await page.evaluate(() => window.__mutation.deliver({ rows: [], mode: 'ready' }))
    await page.waitForFunction(() => window.__mutation.phases().some((item) => item.reason === 'absent'))
    const seen = (await phases(page))[0]
    assert.match(seen?.text ?? '', /Eine frühere Abfrage zeigte/)
    assert.match(seen?.text ?? '', /enthält das Konto nicht/)
    assert.doesNotMatch(seen?.text ?? '', /Die neue Abfrage zeigt/)
    assert.equal((await calls(page)).length, 1)
    return { reason: 'absent' }
  })

  await fall('confirmed-then-failed-read-sets-no-new-truth', 'page=1', { width: 1280, height: 800 }, async (page) => {
    await chooseRole(page, 'Ada Example', 'Rolle: Creator')
    await confirm(page)
    await page.waitForFunction(() => window.__mutation.phases().some((item) => item.phase === 'fulfilled'))
    await page.evaluate((next) => window.__mutation.deliver({ rows: [next], mode: 'ready' }), withRole(ada, 'creator'))
    await page.waitForFunction(() => window.__mutation.phases().some((item) => item.phase === 'confirmed'))
    await page.evaluate(() => window.__mutation.deliver({ rows: [], mode: 'error' }))
    await page.getByText('Datenbank abgelehnt').waitFor()
    await page.waitForFunction(() => {
      const item = window.__mutation.phases()[0]
      return Boolean(item && item.phase === 'confirmed' && item.text.includes('setzt keinen neuen Stand'))
    })
    const seen = (await phases(page))[0]
    assert.equal(seen?.phase, 'confirmed')
    assert.equal(seen?.reason, 'none')
    assert.match(seen?.text ?? '', /Eine frühere Abfrage zeigte/)
    assert.doesNotMatch(seen?.text ?? '', /Die neue Abfrage zeigt/)
    assert.doesNotMatch(seen?.text ?? '', /fehlt in der neuen Abfrage/)
    assert.equal((await calls(page)).length, 1)
    return { phase: 'confirmed' }
  })

  await fall('automatic-removal-preserves-search-focus', 'page=1', { width: 1280, height: 800 }, async (page) => {
    await page.getByRole('button', { name: 'Aktionen für Ada Example' }).click()
    await page.getByRole('menuitem', { name: 'Rolle: Creator' }).click()
    await page.evaluate(() => {
      const input = document.querySelector('input[aria-label="Nutzer nach Name oder E-Mail suchen"]')
      if (input instanceof HTMLElement) input.focus()
    })
    await page.evaluate(() => new Promise((resolve) => requestAnimationFrame(() => requestAnimationFrame(resolve))))
    assert.equal(
      await page.evaluate(() => document.activeElement?.getAttribute('aria-label')),
      'Nutzer nach Name oder E-Mail suchen',
    )
    const search = page.locator('input[aria-label="Nutzer nach Name oder E-Mail suchen"]')
    await search.press('a')
    await search.press('d')
    await search.press('a')
    await page.evaluate((next) => window.__mutation.deliver({ rows: [next], mode: 'ready' }), bao)
    await page.waitForFunction(() => document.querySelector('[role="dialog"]') === null)
    assert.equal(await page.evaluate(() => document.activeElement?.getAttribute('aria-label')), 'Nutzer nach Name oder E-Mail suchen')
    assert.equal(await search.inputValue(), 'ada')
    assert.deepEqual(await calls(page), [])
    return { calls: 0 }
  })

  await fall('keyboard-focus-cancel-restores-trigger', 'page=1', { width: 1280, height: 800 }, async (page) => {
    const trigger = page.getByRole('button', { name: 'Aktionen für Ada Example' })
    await trigger.focus()
    await page.keyboard.press('Enter')
    await page.getByRole('menuitem', { name: 'Rolle: Creator' }).waitFor()
    await page.keyboard.press('Enter')
    await page.getByRole('dialog').waitFor()
    await page.waitForFunction(() => document.activeElement?.getAttribute('data-mutation-cancel') === 'true')
    await page.keyboard.press('Escape')
    await page.waitForFunction(() => document.querySelector('[role="dialog"]') === null)
    await page.waitForFunction(() => document.activeElement?.getAttribute('aria-label') === 'Aktionen für Ada Example')
    assert.deepEqual(await calls(page), [])
    return { calls: 0 }
  })

  await fall('full-unmount-drops-feedback-without-storage', 'page=1', { width: 1280, height: 800 }, async (page) => {
    await page.evaluate(() => window.__mutation.rejectNext('Abgelehnt.'))
    await chooseRole(page, 'Ada Example', 'Rolle: Creator')
    await confirm(page)
    await page.waitForFunction(() => window.__mutation.phases().some((item) => item.phase === 'rejected'))
    await page.evaluate(() => window.__mutationMount.unmount())
    await page.waitForSelector('[data-mutation-unmounted="true"]', { state: 'attached' })
    await page.evaluate(() => window.__mutationMount.remount())
    await page.waitForSelector('[data-mutation-generation="2"]')
    assert.equal((await phases(page)).length, 0)
    assert.equal(await page.evaluate(() => window.__mutation.storageWrites()), 0)
    return { stored: 0 }
  })

  await fall('search-debounce-still-resets-page', 'q=anna&page=3', { width: 1280, height: 800 }, async (page) => {
    await page.locator('input[aria-label="Nutzer nach Name oder E-Mail suchen"]').fill('berta')
    await page.waitForTimeout(200)
    assert.equal((await page.evaluate(() => window.__mutation.replaces())).length, 0)
    await page.waitForFunction(() => window.__mutation.search().includes('berta'))
    const search = await page.evaluate(() => window.__mutation.search())
    assert.equal(new URLSearchParams(search).get('page'), '1')
    assert.equal((await calls(page)).length, 0)
    return { search }
  })

  const layouts = [
    { name: 'layout-320-enlarged', width: 320, height: 720, enlarge: true },
    { name: 'layout-390', width: 390, height: 844, enlarge: false },
    { name: 'layout-768', width: 768, height: 1024, enlarge: false },
    { name: 'layout-1280', width: 1280, height: 800, enlarge: false },
  ]
  for (const layout of layouts) {
    await fall(layout.name, 'page=1', { width: layout.width, height: layout.height }, async (page) => {
      if (layout.enlarge) await page.evaluate(() => { document.documentElement.style.fontSize = '32px' })
      const longName = 'Langer Anzeigename mit vielen Wörtern ohne feste Breite und ohne Umbruchschutz im Klartext'
      const longEmail = 'very-long-mailbox-name.with.dots.and.more.words@example.test'
      await page.evaluate(({ ada, longName, longEmail }) => {
        window.__mutation.setRows([{ ...ada, display_name: longName, email: longEmail }])
      }, { ada, longName, longEmail })
      await chooseRole(page, longName, 'Rolle: Creator')
      const box = await page.evaluate(() => {
        const root = document.querySelector('[data-users-directory-root]')
        const dialog = document.querySelector('[role="dialog"]')
        return {
          root: root ? root.scrollWidth <= root.clientWidth + 1 : false,
          dialog: dialog ? dialog.scrollWidth <= (root?.clientWidth ?? 0) + 1 : false,
          text: dialog?.textContent ?? '',
        }
      })
      assert.equal(box.root, true)
      assert.equal(box.dialog, true)
      assert.match(box.text, new RegExp(longEmail.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')))
      if (layout.name === 'layout-390' || layout.name === 'layout-1280' || layout.enlarge) {
        const file = `${layout.name}.png`
        await page.screenshot({ path: join(EVIDENCE, file), fullPage: true })
        await page.screenshot({ path: join(ARTIFACTS, file), fullPage: true })
      }
      return { overflow: false }
    })
  }
} finally {
  await browser.close()
  server.close()
  writeFileSync(join(EVIDENCE, 'mounted.json'), JSON.stringify({
    generatedAt: '2026-10-26',
    network: 'external requests aborted',
    synthetic: true,
    results,
  }, null, 2))
}

if (failed > 0) {
  console.error(`${failed} mounted cases failed`)
  process.exit(1)
}
