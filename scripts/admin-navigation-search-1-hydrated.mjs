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

async function speichern(page, name, { fullPage = true } = {}) {
  const ziel = join(EVIDENCE, `${name}.png`)
  const artifact = join(ARTIFACTS, `${name}.png`)
  await page.screenshot({ path: ziel, fullPage })
  await page.screenshot({ path: artifact, fullPage })
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
  await page.waitForFunction(() => document.activeElement?.id === 'admin-nav-search-input')
  const nachOpen = await active(page)
  assert.equal(nachOpen.id, 'admin-nav-search-input')
  assert.equal(await page.locator('#admin-nav-search-dialog').count(), 1)
  await page.getByRole('option', { name: 'Steuerzentrale' }).waitFor()
  await page.getByRole('option', { name: 'Nutzer' }).waitFor()
  await page.keyboard.press('Tab')
  const nachTab = await active(page)
  assert.notEqual(nachTab.id, 'admin-nav-search-input')
  assert.notEqual(nachTab.tag, 'BODY')
  await page.keyboard.press('Shift+Tab')
  await page.waitForFunction(() => document.activeElement?.id === 'admin-nav-search-input')
  await speichern(page, 'desktop_palette_open')
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
  ergebnisse.push({ name: 'desktop_shortcut_select_users', activeAfterClose: nachNav, nachTab, pushes })
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
  await page.keyboard.press('Control+K')
  await page.getByRole('dialog', { name: 'Admin Navigation' }).waitFor({ state: 'detached' })
  await page.locator('#admin-nav-search-dialog').waitFor()
  assert.equal(await page.locator('#admin-nav-search-dialog').count(), 1)
  await speichern(page, 'mobile_palette_open')
  await page.keyboard.press('Escape')
  const nachShortcut = await active(page)
  assert.notEqual(nachShortcut.tag, 'BODY')
  await mobile.click()
  await page.locator('#admin-nav-search-dialog').waitFor()
  await page.keyboard.press('Escape')
  const nach = await active(page)
  assert.equal(nach.trigger, 'mobile')
  await speichern(page, 'mobile_drawer_then_search')
  ergebnisse.push({
    name: 'mobile_drawer_then_search',
    activeAfterShortcutClose: nachShortcut,
    activeAfterTriggerClose: nach,
  })
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

async function optionGeometrie(page, name) {
  return page.evaluate((label) => {
    const liste = document.getElementById('admin-nav-search-list')
    const option = Array.from(document.querySelectorAll('#admin-nav-search-list [role="option"]')).find(
      (el) => el.textContent?.trim() === label,
    )
    const input = document.getElementById('admin-nav-search-input')
    const close = document.querySelector('[aria-label="Bereichssuche schliessen"]')
    const panel = document.querySelector('[data-admin-nav-search-panel]')
    if (
      !(liste instanceof HTMLElement) ||
      !(option instanceof HTMLElement) ||
      !(input instanceof HTMLElement) ||
      !(close instanceof HTMLElement) ||
      !(panel instanceof HTMLElement)
    ) {
      return null
    }
    const vv = window.visualViewport
    const viewTop = vv?.offsetTop ?? 0
    const viewLeft = vv?.offsetLeft ?? 0
    const viewWidth = vv?.width ?? window.innerWidth
    const viewHeight = vv?.height ?? window.innerHeight
    const viewBottom = viewTop + viewHeight
    const viewRight = viewLeft + viewWidth
    const listRect = liste.getBoundingClientRect()
    const optRect = option.getBoundingClientRect()
    const inputRect = input.getBoundingClientRect()
    const closeRect = close.getBoundingClientRect()
    const panelRect = panel.getBoundingClientRect()
    const imListenfenster = optRect.top >= listRect.top && optRect.bottom <= listRect.bottom
    const optionImViewport = optRect.top >= viewTop && optRect.bottom <= viewBottom
    const inputImViewport = inputRect.top >= viewTop && inputRect.bottom <= viewBottom
    const closeImViewport = closeRect.top >= viewTop && closeRect.bottom <= viewBottom
    return {
      innerWidth: window.innerWidth,
      innerHeight: window.innerHeight,
      visualViewport: {
        width: viewWidth,
        height: viewHeight,
        offsetTop: viewTop,
        offsetLeft: viewLeft,
        bottom: viewBottom,
        right: viewRight,
      },
      listTop: listRect.top,
      listBottom: listRect.bottom,
      optTop: optRect.top,
      optBottom: optRect.bottom,
      inputTop: inputRect.top,
      inputBottom: inputRect.bottom,
      closeTop: closeRect.top,
      closeBottom: closeRect.bottom,
      panelTop: panelRect.top,
      panelBottom: panelRect.bottom,
      scrollTop: liste.scrollTop,
      scrollHeight: liste.scrollHeight,
      clientHeight: liste.clientHeight,
      optionCount: document.querySelectorAll('#admin-nav-search-list [role="option"]').length,
      imListenfenster,
      optionImViewport,
      inputImViewport,
      closeImViewport,
      panelImViewport: panelRect.top >= viewTop && panelRect.bottom <= viewBottom,
      fullyVisible: imListenfenster && optionImViewport,
    }
  }, name)
}

function r1SichtbarkeitPruefen(geo) {
  assert.equal(geo !== null, true)
  assert.equal(geo.optionCount, 6)
  assert.equal(geo.imListenfenster, true)
  assert.equal(geo.optionImViewport, true)
  assert.equal(geo.inputImViewport, true)
  assert.equal(geo.closeImViewport, true)
  assert.equal(geo.panelImViewport, true)
  assert.equal(geo.fullyVisible, true)
  assert.ok(geo.optBottom <= geo.visualViewport.bottom)
  assert.ok(geo.optTop >= geo.visualViewport.offsetTop)
  if (geo.scrollHeight > geo.clientHeight + 1) {
    assert.equal(geo.scrollTop > 0, true)
  }
}

async function r1AktiveZeileSichtbar(page, origin) {
  await oeffnen(page, origin, 'role=operator&grant=role', { width: 390, height: 500 })
  await page.keyboard.press('Control+K')
  await page.locator('#admin-nav-search-dialog').waitFor()
  await page.waitForFunction(() => document.activeElement?.id === 'admin-nav-search-input')
  await page.locator('#admin-nav-search-list [role="option"][aria-selected="true"]').waitFor()
  for (let i = 0; i < 5; i += 1) await page.keyboard.press('ArrowDown')
  await page.waitForFunction(() => {
    const option = Array.from(document.querySelectorAll('#admin-nav-search-list [role="option"]')).find(
      (el) => el.textContent?.trim() === 'Provider & Kosten',
    )
    const liste = document.getElementById('admin-nav-search-list')
    const vv = window.visualViewport
    if (!(option instanceof HTMLElement) || !(liste instanceof HTMLElement)) return false
    const viewTop = vv?.offsetTop ?? 0
    const viewBottom = viewTop + (vv?.height ?? window.innerHeight)
    const listRect = liste.getBoundingClientRect()
    const optRect = option.getBoundingClientRect()
    return (
      optRect.top >= listRect.top &&
      optRect.bottom <= listRect.bottom &&
      optRect.top >= viewTop &&
      optRect.bottom <= viewBottom
    )
  })
  const geo = await optionGeometrie(page, 'Provider & Kosten')
  r1SichtbarkeitPruefen(geo)
  await speichern(page, 'r1_390x500_last_row_visible', { fullPage: false })

  await page.evaluate(() => {
    document.documentElement.style.fontSize = '200%'
  })
  await page.keyboard.press('ArrowUp')
  await page.keyboard.press('ArrowDown')
  await page.waitForFunction(() => {
    const option = Array.from(document.querySelectorAll('#admin-nav-search-list [role="option"]')).find(
      (el) => el.textContent?.trim() === 'Provider & Kosten',
    )
    const liste = document.getElementById('admin-nav-search-list')
    const input = document.getElementById('admin-nav-search-input')
    const close = document.querySelector('[aria-label="Bereichssuche schliessen"]')
    const panel = document.querySelector('[data-admin-nav-search-panel]')
    const vv = window.visualViewport
    if (
      !(option instanceof HTMLElement) ||
      !(liste instanceof HTMLElement) ||
      !(input instanceof HTMLElement) ||
      !(close instanceof HTMLElement) ||
      !(panel instanceof HTMLElement)
    ) {
      return false
    }
    const viewTop = vv?.offsetTop ?? 0
    const viewBottom = viewTop + (vv?.height ?? window.innerHeight)
    const listRect = liste.getBoundingClientRect()
    const optRect = option.getBoundingClientRect()
    const inputRect = input.getBoundingClientRect()
    const closeRect = close.getBoundingClientRect()
    const panelRect = panel.getBoundingClientRect()
    return (
      optRect.top >= listRect.top &&
      optRect.bottom <= listRect.bottom &&
      optRect.top >= viewTop &&
      optRect.bottom <= viewBottom &&
      inputRect.top >= viewTop &&
      inputRect.bottom <= viewBottom &&
      closeRect.top >= viewTop &&
      closeRect.bottom <= viewBottom &&
      panelRect.bottom <= viewBottom
    )
  })
  const geoZoom = await optionGeometrie(page, 'Provider & Kosten')
  r1SichtbarkeitPruefen(geoZoom)
  assert.equal(geoZoom.innerHeight, 500)
  assert.ok(geoZoom.visualViewport.height <= 500)
  assert.ok(geoZoom.optBottom <= 500)
  await speichern(page, 'r1_390x500_200pct_last_row_visible', { fullPage: false })
  ergebnisse.push({ name: 'r1_keyboard_row_visible', geo, geoZoom })
}

async function r2HoverStiehltNicht(page, origin) {
  await oeffnen(page, origin, 'role=operator&grant=role', { width: 1024, height: 768 })
  await page.keyboard.press('Control+K')
  await page.waitForFunction(() => document.activeElement?.id === 'admin-nav-search-input')
  await page.getByRole('button', { name: 'Bereichssuche schliessen' }).focus()
  const vor = await active(page)
  assert.equal(vor.tag, 'BUTTON')
  assert.match(vor.label ?? '', /Bereichssuche schliessen/)
  await page.getByRole('option', { name: 'Nutzer' }).hover()
  await page.waitForTimeout(80)
  const nach = await active(page)
  assert.equal(nach.tag, 'BUTTON')
  assert.equal(nach.id, vor.id)
  assert.equal(nach.label, vor.label)
  assert.notEqual(nach.id, 'admin-nav-search-input')
  await speichern(page, 'r2_hover_keeps_close_focus')
  ergebnisse.push({ name: 'r2_hover_does_not_steal_focus', vor, nach })
}

async function r3PrefetchGrenze(page, origin) {
  await oeffnen(page, origin, 'role=operator&grant=role', { width: 1024, height: 768 })
  await page.keyboard.press('Control+K')
  await page.getByRole('option', { name: 'Steuerzentrale' }).waitFor()
  const evidenz = await page.evaluate(() => {
    const eintraege = window.__linkPrefetch ?? []
    const optionen = Array.from(document.querySelectorAll('#admin-nav-search-list a'))
    const palette = eintraege.slice(-optionen.length)
    return {
      optionCount: optionen.length,
      palette,
      alleFalse: palette.length > 0 && palette.every((eintrag) => eintrag.prefetch === false),
      sidebarOhneProp: eintraege.some((eintrag) => eintrag.prefetch === undefined),
      domPrefetchAttr: optionen.some((el) => el.hasAttribute('prefetch')),
    }
  })
  assert.equal(evidenz.alleFalse, true)
  assert.equal(evidenz.domPrefetchAttr, false)
  await speichern(page, 'r3_prefetch_false_boundary')
  ergebnisse.push({
    name: 'r3_prefetch_false_boundary',
    ...evidenz,
    limit:
      'Harness Link stub records the Next prefetch prop and must not forward it to DOM. This does not execute production app-dir prefetch.',
  })
}

async function r4AussenklickSchliesst(page, origin) {
  await oeffnen(page, origin, 'role=operator&grant=role', { width: 1024, height: 768 })
  const desktop = page.locator('[data-admin-nav-search-trigger="desktop"]')
  await desktop.click()
  await page.locator('#admin-nav-search-dialog').waitFor()
  await page.waitForFunction(() => document.activeElement?.id === 'admin-nav-search-input')

  const aussen = await page.evaluate(() => {
    const el = document.elementFromPoint(10, 10)
    return {
      tag: el?.tagName ?? null,
      backdrop: el instanceof HTMLElement && el.hasAttribute('data-admin-nav-search-backdrop'),
      panel: Boolean(el?.closest('[data-admin-nav-search-panel]')),
      className: el instanceof HTMLElement ? el.className : null,
    }
  })
  assert.equal(aussen.backdrop, true)
  assert.equal(aussen.panel, false)
  assert.equal(/items-center justify-center/.test(aussen.className ?? ''), false)
  await page.mouse.click(10, 10)
  await page.locator('#admin-nav-search-dialog').waitFor({ state: 'detached' })
  const nachAussen = await active(page)
  assert.equal(nachAussen.trigger, 'desktop')
  await speichern(page, 'r4_outside_click_closes')

  await desktop.click()
  await page.locator('#admin-nav-search-dialog').waitFor()
  const innen = await page.evaluate(() => {
    const panel = document.querySelector('[data-admin-nav-search-panel]')
    if (!(panel instanceof HTMLElement)) return null
    const rect = panel.getBoundingClientRect()
    const x = rect.left + Math.min(24, rect.width / 2)
    const y = rect.top + Math.min(16, rect.height / 2)
    const el = document.elementFromPoint(x, y)
    return {
      x,
      y,
      panel: Boolean(el?.closest('[data-admin-nav-search-panel]')),
    }
  })
  assert.equal(innen !== null, true)
  assert.equal(innen.panel, true)
  await page.mouse.click(innen.x, innen.y)
  assert.equal(await page.locator('#admin-nav-search-dialog').count(), 1)
  await page.locator('#admin-nav-search-input').click()
  assert.equal(await page.locator('#admin-nav-search-dialog').count(), 1)
  await speichern(page, 'r4_inside_click_keeps_open')
  ergebnisse.push({
    name: 'r4_outside_dismiss_inside_keep',
    aussen,
    nachAussen,
    innen,
    dialogAfterInside: 1,
  })
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
  await r1AktiveZeileSichtbar(page, origin)
  await r2HoverStiehltNicht(page, origin)
  await r3PrefetchGrenze(page, origin)
  await r4AussenklickSchliesst(page, origin)
} catch (fehler) {
  const lastGeo = await optionGeometrie(page, 'Provider & Kosten').catch(() => null)
  await speichern(page, 'hydrated_failure', { fullPage: false }).catch(() => {})
  writeFileSync(
    join(EVIDENCE, 'hydrated-report.json'),
    JSON.stringify({ ergebnisse, lastGeo, fehler: String(fehler) }, null, 2),
  )
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
