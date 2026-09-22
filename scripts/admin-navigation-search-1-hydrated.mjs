#!/usr/bin/env node
// Hydrated actual-component + Admin-shell interaction for navigation search 1.
// Bundles real AdminLayout / Topbar / AdminNavigationSearch. Next router/link
// and sign-out are boundary stubs. Not Preview E2E and not physical-device
// acceptance. Chromium emulation only.

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
const EVIDENCE = join(REPO, 'docs/evidence/admin-navigation-search-1')
const ARTIFACTS = '/opt/cursor/artifacts'
const OUT = join('/tmp', 'admin-navigation-search-1-harness')

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
        join(REPO, 'app/(admin)/admin/layout.tsx'),
        join(REPO, 'components/layout/AdminTopbar.tsx'),
        join(REPO, 'components/layout/AdminSidebar.tsx'),
        join(REPO, 'components/admin/AdminNavigationSearch.tsx'),
        join(EVIDENCE, 'harness.tsx'),
      ],
    }
    const result = await postcss([nesting(), tailwindcss(config), autoprefixer()]).process(input, { from })
    return result.css
  } catch {
    return 'body{font-family:sans-serif;margin:0}[hidden]{display:none}'
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
      '@/app/auth/sign-out': join(EVIDENCE, 'stubs/sign-out.ts'),
      'server-only': join(EVIDENCE, 'stubs/server-only.ts'),
    },
    define: {
      'process.env.NODE_ENV': '"development"',
    },
  })
  return outfile
}

function htmlSeite(css, script) {
  return `<!doctype html>
<html lang="de">
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1">
  <title>Admin navigation search hydrated harness</title>
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
      const { port } = server.address()
      resolve({ server, origin: `http://127.0.0.1:${port}` })
    })
  })
}

async function oeffnen(page, origin, suche, viewport) {
  if (viewport) await page.setViewportSize(viewport)
  const anfragen = []
  page.on('request', (req) => anfragen.push(req.url()))
  page.__anfragen = anfragen
  await page.goto(`${origin}/?${suche}`, { waitUntil: 'domcontentloaded' })
  await page.waitForFunction(() => window.__hydrateReady === true)
  return anfragen
}

async function speichern(page, name) {
  const ziel = join(EVIDENCE, `${name}.png`)
  const artifact = join(ARTIFACTS, `${name}.png`)
  await page.screenshot({ path: ziel, fullPage: true })
  await page.screenshot({ path: artifact, fullPage: true })
  return ziel
}

async function active(page) {
  return page.evaluate(() => {
    const el = document.activeElement
    return {
      tag: el?.tagName ?? null,
      id: el?.id ?? null,
      label: el?.getAttribute('aria-label') ?? null,
      trigger: el?.getAttribute('data-admin-nav-search-trigger') ?? null,
    }
  })
}

function sucheAnfragen(liste) {
  return liste.filter((url) => /search|query|palette/i.test(url) && !url.startsWith('data:') && !url.includes('127.0.0.1'))
}

async function desktopShortcutUndFokus(page, origin) {
  const anfragen = await oeffnen(page, origin, 'role=operator&grant=role', { width: 1024, height: 768 })
  const desktop = page.locator('[data-admin-nav-search-trigger="desktop"]')
  assert.equal(await desktop.isVisible(), true)
  await desktop.focus()
  await page.keyboard.press('Control+K')
  await page.locator('#admin-nav-search-dialog').waitFor()
  const nachOpen = await active(page)
  assert.equal(nachOpen.id, 'admin-nav-search-input')
  assert.equal(await page.locator('#admin-nav-search-dialog').count(), 1)
  await page.getByRole('option', { name: 'Steuerzentrale' }).waitFor()
  await page.getByRole('option', { name: 'Nutzer' }).waitFor()
  await page.keyboard.type('???')
  await page.getByText('Kein passender Bereich.').waitFor()
  await page.locator('#admin-nav-search-input').fill('')
  await page.keyboard.press('ArrowDown')
  await page.keyboard.press('Enter')
  const pushes = await page.evaluate(() => window.__routerPushes)
  assert.equal(pushes.at(-1), '/admin/users')
  await page.locator('#admin-nav-search-dialog').waitFor({ state: 'detached' })
  const nachNav = await active(page)
  assert.notEqual(nachNav.tag, 'BODY')
  assert.equal(sucheAnfragen(anfragen).length, 0)
  await speichern(page, 'desktop_shortcut_select_users')
  ergebnisse.push({ name: 'desktop_shortcut_select_users', activeAfterClose: nachNav, pushes })
}

async function desktopEscapeRestore(page, origin) {
  await oeffnen(page, origin, 'role=operator&grant=role', { width: 1440, height: 900 })
  const desktop = page.locator('[data-admin-nav-search-trigger="desktop"]')
  await desktop.click()
  await page.locator('#admin-nav-search-input').waitFor()
  await page.keyboard.press('Escape')
  await page.locator('#admin-nav-search-dialog').waitFor({ state: 'detached' })
  const nach = await active(page)
  assert.equal(nach.trigger, 'desktop')
  await speichern(page, 'desktop_escape_restores_trigger')
  ergebnisse.push({ name: 'desktop_escape_restores_trigger', activeAfterClose: nach })
}

async function mobileTriggerUndDrawer(page, origin) {
  await oeffnen(page, origin, 'role=operator&grant=role', { width: 390, height: 844 })
  const mobile = page.locator('[data-admin-nav-search-trigger="mobile"]')
  const desktop = page.locator('[data-admin-nav-search-trigger="desktop"]')
  assert.equal(await mobile.isVisible(), true)
  assert.equal(await desktop.isVisible(), false)
  await page.getByRole('button', { name: 'Navigationsmenü öffnen' }).click()
  await page.getByRole('dialog', { name: 'Admin Navigation' }).waitFor()
  await mobile.click()
  await page.getByRole('dialog', { name: 'Admin Navigation' }).waitFor({ state: 'detached' })
  await page.locator('#admin-nav-search-dialog').waitFor()
  assert.equal(await page.locator('#admin-nav-search-dialog').count(), 1)
  await page.keyboard.press('Escape')
  const nach = await active(page)
  assert.equal(nach.trigger, 'mobile')
  await speichern(page, 'mobile_drawer_then_search')
  ergebnisse.push({ name: 'mobile_drawer_then_search', activeAfterClose: nach })
}

async function rollenFilter(page, origin) {
  await oeffnen(page, origin, 'role=creator&grant=role', { width: 1024, height: 768 })
  await page.keyboard.press('Control+K')
  await page.locator('#admin-nav-search-dialog').waitFor()
  assert.equal(await page.getByRole('option', { name: 'Steuerzentrale' }).count(), 1)
  assert.equal(await page.getByRole('option', { name: 'Nutzer' }).count(), 0)
  assert.equal(await page.getByRole('option', { name: 'Provider & Kosten' }).count(), 0)
  await speichern(page, 'role_creator_no_users')
  ergebnisse.push({ name: 'role_creator_no_users' })

  await oeffnen(page, origin, 'role=none&grant=break-glass', { width: 1024, height: 768 })
  await page.keyboard.press('Control+K')
  await page.locator('#admin-nav-search-dialog').waitFor()
  assert.equal(await page.getByRole('option', { name: 'Zahlungen' }).count(), 1)
  assert.equal(await page.getByRole('option', { name: 'Nutzer' }).count(), 0)
  await speichern(page, 'role_break_glass_no_users')
  ergebnisse.push({ name: 'role_break_glass_no_users' })
}

async function fremdesModal(page, origin) {
  await oeffnen(page, origin, 'role=operator&grant=role&foreignModal=1', { width: 1024, height: 768 })
  await page.locator('#foreign-focus').focus()
  await page.keyboard.press('Control+K')
  await page.waitForTimeout(150)
  assert.equal(await page.locator('#admin-nav-search-dialog').count(), 0)
  const nach = await active(page)
  assert.equal(nach.id, 'foreign-focus')
  await speichern(page, 'foreign_modal_no_steal')
  ergebnisse.push({ name: 'foreign_modal_no_steal', activeAfterShortcut: nach })
}

async function zoomUndViewports(page, origin) {
  await oeffnen(page, origin, 'role=operator&grant=role', { width: 768, height: 1024 })
  await page.locator('[data-admin-nav-search-trigger="desktop"]').click()
  await page.locator('#admin-nav-search-dialog').waitFor()
  await speichern(page, 'viewport_768_desktop_trigger')
  await page.keyboard.press('Escape')

  await page.setViewportSize({ width: 390, height: 844 })
  await page.evaluate(() => {
    document.documentElement.style.fontSize = '200%'
  })
  await page.locator('[data-admin-nav-search-trigger="mobile"]').click()
  await page.locator('#admin-nav-search-dialog').waitFor()
  const scroll = await page.locator('#admin-nav-search-list').evaluate((el) => getComputedStyle(el).overflowY)
  assert.equal(scroll === 'auto' || scroll === 'scroll', true)
  await speichern(page, 'viewport_390_200pct_text')
  ergebnisse.push({ name: 'viewport_768_and_390_200pct', overflowY: scroll })
}

async function keineFetchSuche(page, origin) {
  const anfragen = await oeffnen(page, origin, 'role=operator&grant=role', { width: 1024, height: 768 })
  await page.keyboard.press('Control+K')
  await page.locator('#admin-nav-search-input').fill('kosten')
  await page.getByRole('option', { name: 'Provider & Kosten' }).waitFor()
  const fetches = await page.evaluate(() => window.__fetchCalls)
  assert.equal(fetches.length, 0)
  assert.equal(sucheAnfragen(anfragen).length, 0)
  await speichern(page, 'alias_kosten_no_network')
  ergebnisse.push({ name: 'alias_kosten_no_network', fetches, pageRequests: anfragen.length })
}

const css = await compileCss()
const bundled = await bundleHarness()
const script = readFileSync(bundled, 'utf8')
const { server, origin } = await serve(css, script)
const browser = await chromium.launch({ headless: true })
const page = await browser.newPage()

try {
  await desktopShortcutUndFokus(page, origin)
  await desktopEscapeRestore(page, origin)
  await mobileTriggerUndDrawer(page, origin)
  await rollenFilter(page, origin)
  await fremdesModal(page, origin)
  await zoomUndViewports(page, origin)
  await keineFetchSuche(page, origin)
} catch (fehler) {
  await speichern(page, 'hydrated_failure').catch(() => {})
  writeFileSync(join(EVIDENCE, 'hydrated-report.json'), JSON.stringify({ ergebnisse, fehler: String(fehler) }, null, 2))
  await browser.close()
  server.close()
  throw fehler
}

await browser.close()
server.close()
writeFileSync(
  join(EVIDENCE, 'hydrated-report.json'),
  JSON.stringify(
    {
      pass: ergebnisse.length,
      ergebnisse,
      browser: 'playwright-chromium',
      physicalDevice: false,
      note: 'Chromium emulation only. Not Preview E2E and not physical-device acceptance.',
    },
    null,
    2,
  ),
)
console.log(`hydrated: ${ergebnisse.length} PASS`)
