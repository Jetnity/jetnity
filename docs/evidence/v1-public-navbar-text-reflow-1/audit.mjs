#!/usr/bin/env node
// docs/evidence/v1-public-navbar-text-reflow-1/audit.mjs
//
// Disposable local Chromium evidence for V1 Public Navbar Text Reflow 1.
// Uses the compiled/dev Next app and real product CSS. No real credentials.
// Unexpected mutations, including sign-out server actions, are aborted before
// they complete. Provider/API URLs are fulfilled 503. Safe Next internals may
// continue. This is simulated oversized text, not OS zoom / hardware / WCAG.

import { execSync, spawn } from 'node:child_process'
import { mkdirSync, writeFileSync } from 'node:fs'
import { dirname, join } from 'node:path'
import { fileURLToPath } from 'node:url'
import { chromium } from 'playwright'

const hier = dirname(fileURLToPath(import.meta.url))
const PORT = process.env.AUDIT_PORT || '3000'
const BASIS = process.env.AUDIT_BASE || `http://localhost:${PORT}`
const PHASE = process.env.AUDIT_PHASE || 'after'
const EVIDENZ = process.env.AUDIT_EVIDENCE_DIR || hier
const SHA = (process.env.AUDIT_PRODUCT_SHA || execSync('git rev-parse HEAD', { encoding: 'utf8' })).trim()
const DIRTY =
  process.env.AUDIT_WORKING_TREE === 'clean'
    ? []
    : execSync('git status --porcelain', { encoding: 'utf8' })
        .split('\n')
        .map((zeile) => zeile.trim())
        .filter(Boolean)

const PRODUCT_TREE = {
  head: SHA,
  workingTree: DIRTY.length === 0 ? 'clean' : 'dirty',
  dirtyPaths: DIRTY,
  sourceNote: process.env.AUDIT_SOURCE_NOTE || null,
}

const JETZT = new Date().toISOString()
const SCHIRME = join(EVIDENZ, 'screens')

function browserVersion(browser) {
  return `${browser.browserType().name()}/${browser.version()}`
}

async function serverErreichbar() {
  try {
    const antwort = await fetch(`${BASIS}/`, { redirect: 'manual' })
    return antwort.status > 0
  } catch {
    return false
  }
}

async function serverStarten() {
  if (await serverErreichbar()) return { kind: null, reused: true }
  const kind = spawn('npm', ['run', 'dev', '--', '-p', PORT, '-H', 'localhost'], {
    env: {
      ...process.env,
      NEXT_PUBLIC_SUPABASE_URL:
        process.env.NEXT_PUBLIC_SUPABASE_URL || 'https://placeholder.supabase.co',
      NEXT_PUBLIC_SUPABASE_ANON_KEY:
        process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY ||
        'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InBsYWNlaG9sZGVyIiwicm9sZSI6ImFub24iLCJpYXQiOjE2OTAwMDAwMDAsImV4cCI6MjAwMDAwMDAwMH0.audit',
      NEXT_PUBLIC_APP_URL: BASIS,
    },
    stdio: ['ignore', 'pipe', 'pipe'],
  })
  const start = Date.now()
  while (Date.now() - start < 90_000) {
    if (await serverErreichbar()) return { kind, reused: false }
    await new Promise((r) => setTimeout(r, 400))
  }
  kind.kill()
  throw new Error('Next.js startete nicht')
}

function istProviderOderApi(url) {
  return (
    url.includes('/api/') ||
    url.includes('openai.com') ||
    url.includes('anthropic.com') ||
    url.includes('supabase.co') ||
    url.includes('/functions/v1/')
  )
}

function istSicheresNextIntern(url) {
  return url.includes('/_next/') || url.includes('__nextjs') || url.includes('/__turbopack')
}

function istMutation(method) {
  return ['POST', 'PUT', 'PATCH', 'DELETE'].includes(method)
}

function leeresProtokoll() {
  return {
    anfragen: [],
    schreiben: [],
    abgefangen: [],
    versuche: [],
    abgebrochen: [],
    interneSchreiben: [],
    interneAbgeschlossen: [],
    unerwartetAbgeschlossen: [],
    fehlgeschlagen: [],
  }
}

function mutationskonto(protokoll) {
  return {
    versuche: protokoll.versuche.length,
    abgebrochen: protokoll.abgebrochen.length,
    interneSchreiben: protokoll.interneSchreiben.length,
    interneAbgeschlossen: protokoll.interneAbgeschlossen.length,
    completedUnexpected: protokoll.unerwartetAbgeschlossen.length,
    blockedUnexpected: protokoll.abgebrochen.length,
    unerwartetAbgeschlossen: protokoll.unerwartetAbgeschlossen,
    abgebrochenUrls: protokoll.abgebrochen.map((eintrag) => `${eintrag.method} ${eintrag.url}`),
  }
}

async function abfangen(page, protokoll) {
  await page.route('**/*', async (route) => {
    const req = route.request()
    const method = req.method()
    const url = req.url()
    const resourceType = req.resourceType()

    if (istProviderOderApi(url)) {
      protokoll.abgefangen.push({ method, url, resourceType, kind: 'provider-or-api' })
      await route.fulfill({
        status: 503,
        contentType: 'application/json',
        body: JSON.stringify({ ok: false, reason: 'audit-blocked', simulation: true }),
      })
      return
    }

    if (istMutation(method)) {
      if (istSicheresNextIntern(url)) {
        protokoll.interneSchreiben.push({ method, url, resourceType, kind: 'safe-next-internal' })
        await route.continue()
        return
      }
      protokoll.versuche.push({ method, url, resourceType, kind: 'unexpected-mutation' })
      protokoll.abgebrochen.push({ method, url, resourceType, reason: 'audit-abort-mutation' })
      await route.abort('blockedbyclient')
      return
    }

    await route.continue()
  })

  page.on('request', (req) => {
    if (istMutation(req.method())) {
      protokoll.schreiben.push({
        method: req.method(),
        url: req.url(),
        resourceType: req.resourceType(),
      })
    }
  })
  page.on('requestfinished', (req) => {
    if (!istMutation(req.method())) return
    const eintrag = { method: req.method(), url: req.url(), resourceType: req.resourceType() }
    if (istSicheresNextIntern(req.url())) protokoll.interneAbgeschlossen.push(eintrag)
    else protokoll.unerwartetAbgeschlossen.push(eintrag)
  })
  page.on('requestfailed', (req) => {
    if (!istMutation(req.method())) return
    protokoll.fehlgeschlagen.push({
      method: req.method(),
      url: req.url(),
      resourceType: req.resourceType(),
      failure: req.failure()?.errorText || null,
    })
  })
}

async function hydrationWarten(page) {
  await page.waitForFunction(
    () => {
      const knopf = document.querySelector(
        'button[aria-controls="oeffentliche-mobile-navigation"], a[href="/reisen"]',
      )
      if (!knopf) return false
      return Object.keys(knopf).some(
        (name) => name.startsWith('__reactFiber') || name.startsWith('__reactProps'),
      )
    },
    { timeout: 20_000 },
  )
}

async function nextDevChromeVerbergen(page) {
  await page.addStyleTag({
    content:
      'nextjs-portal, [data-next-badge-root], [data-nextjs-toast] { display: none !important; }',
  })
}

async function text200(page, aktiv) {
  await page.addStyleTag({
    content: aktiv
      ? 'html { font-size: 32px !important; }'
      : 'html { font-size: 16px !important; }',
  })
}

function geometrieSkript() {
  return () => {
    const header = document.querySelector('header')
    const viewport = { width: window.innerWidth, height: window.innerHeight }
    const html = document.documentElement
    const body = document.body
    if (!header) {
      return { ok: false, viewport, reason: 'no-header' }
    }
    const headerBox = header.getBoundingClientRect()
    const row = header.firstElementChild
    const rowBox = row ? row.getBoundingClientRect() : null
    const menu = document.getElementById('oeffentliche-mobile-navigation')
    const menuBox = menu ? menu.getBoundingClientRect() : null
    const menuStyle = menu ? getComputedStyle(menu) : null
    const controls = [...header.querySelectorAll('a, button')].map((el) => {
      const r = el.getBoundingClientRect()
      const style = getComputedStyle(el)
      const painted =
        r.width > 0 &&
        r.height > 0 &&
        style.display !== 'none' &&
        style.visibility !== 'hidden' &&
        style.opacity !== '0'
      return {
        text: (el.getAttribute('aria-label') || el.textContent || '').replace(/\s+/g, ' ').trim().slice(0, 80),
        tag: el.tagName,
        href: el.getAttribute('href'),
        type: el.getAttribute('type'),
        ariaExpanded: el.getAttribute('aria-expanded'),
        hiddenAttr: el.hasAttribute('hidden'),
        painted,
        x: Number(r.x.toFixed(2)),
        y: Number(r.y.toFixed(2)),
        right: Number(r.right.toFixed(2)),
        bottom: Number(r.bottom.toFixed(2)),
        width: Number(r.width.toFixed(2)),
        height: Number(r.height.toFixed(2)),
        overflowX: Number(Math.max(0, r.right - viewport.width).toFixed(2)),
        overflowBelowHeader: Number(Math.max(0, r.bottom - headerBox.bottom).toFixed(2)),
        overflowAboveHeader: Number(Math.max(0, headerBox.top - r.top).toFixed(2)),
      }
    })
    const painted = controls.filter((item) => item.painted)
    return {
      ok: true,
      viewport,
      htmlFontSize: getComputedStyle(html).fontSize,
      document: {
        clientWidth: html.clientWidth,
        scrollWidth: html.scrollWidth,
        overflowX: html.scrollWidth - html.clientWidth,
        clientHeight: html.clientHeight,
        scrollHeight: html.scrollHeight,
        scrollX: window.scrollX,
        scrollY: window.scrollY,
      },
      bodyOverflowX: body.scrollWidth - body.clientWidth,
      header: {
        x: Number(headerBox.x.toFixed(2)),
        y: Number(headerBox.y.toFixed(2)),
        right: Number(headerBox.right.toFixed(2)),
        bottom: Number(headerBox.bottom.toFixed(2)),
        width: Number(headerBox.width.toFixed(2)),
        height: Number(headerBox.height.toFixed(2)),
        overflowX: Number(Math.max(0, headerBox.right - viewport.width).toFixed(2)),
      },
      row: rowBox
        ? {
            width: Number(rowBox.width.toFixed(2)),
            height: Number(rowBox.height.toFixed(2)),
            right: Number(rowBox.right.toFixed(2)),
            bottom: Number(rowBox.bottom.toFixed(2)),
          }
        : null,
      menu: menu
        ? {
            hidden: menu.hidden,
            inert: menu.inert,
            display: menuStyle.display,
            overflowY: menuStyle.overflowY,
            maxHeight: menuStyle.maxHeight,
            height: Number(menuBox.height.toFixed(2)),
            scrollHeight: menu.scrollHeight,
            clientHeight: menu.clientHeight,
            canScroll: menu.scrollHeight > menu.clientHeight + 1,
          }
        : null,
      controls: painted,
      navbarHorizontalOffenders: painted.filter((item) => item.overflowX > 0.5),
      navbarVerticalOffenders: painted.filter(
        (item) => item.overflowBelowHeader > 0.5 || item.overflowAboveHeader > 0.5,
      ),
    }
  }
}

async function headerTexte(page) {
  return page.evaluate(() => {
    const header = document.querySelector('header')
    if (!header) return []
    return [...header.querySelectorAll('a, button')].map((el) =>
      (el.getAttribute('aria-label') || el.textContent || '').replace(/\s+/g, ' ').trim(),
    )
  })
}

async function warteAufGast(page) {
  await page.waitForFunction(() => {
    const header = document.querySelector('header')
    if (!header) return false
    return [...header.querySelectorAll('a, button')].some((el) =>
      /Anmelden|Konto|Abmelden/.test(el.textContent || ''),
    )
  }, { timeout: 8_000 }).catch(() => null)
}

async function dispatchSitzung(page, stand) {
  return page.evaluate((ziel) => {
    const header = document.querySelector('header')
    if (!header) return { ok: false, reason: 'no-header' }
    const fiberKey = Object.keys(header).find((name) => name.startsWith('__reactFiber'))
    if (!fiberKey) return { ok: false, reason: 'no-fiber' }
    let fiber = header[fiberKey]
    while (fiber) {
      let hook = fiber.memoizedState
      const states = []
      while (hook) {
        if (hook.queue && typeof hook.queue.dispatch === 'function') {
          states.push(hook)
        }
        hook = hook.next
      }
      const sitzung = states.find(
        (item) =>
          item.memoizedState === 'unbekannt' ||
          item.memoizedState === 'gast' ||
          item.memoizedState === 'konto',
      )
      if (sitzung) {
        const previous = sitzung.memoizedState
        sitzung.queue.dispatch(ziel)
        return {
          ok: true,
          kind: 'controlled-local-react-session-state-mock',
          previous,
          next: ziel,
          note: 'Held after real getSession. Re-dispatched if INITIAL_SESSION overwrote. No credentials or account writes.',
        }
      }
      fiber = fiber.return
    }
    return { ok: false, reason: 'sitzung-hook-not-found' }
  }, stand)
}

function sitzungPasst(labels, stand) {
  const hatKonto = labels.some((label) => label.includes('Konto'))
  const hatAbmelden = labels.some((label) => label.includes('Abmelden'))
  const hatAnmelden = labels.some((label) => label.includes('Anmelden'))
  if (stand === 'konto') return hatKonto && hatAbmelden
  if (stand === 'unbekannt') return !hatKonto && !hatAbmelden && !hatAnmelden
  if (stand === 'gast') return hatAnmelden
  return false
}

async function setzeSitzung(page, stand) {
  await warteAufGast(page)
  if (stand === 'gast') {
    return { ok: true, kind: 'real-empty-cookie-getSession', next: 'gast', labelsAfter: await headerTexte(page) }
  }

  let mock = { ok: false }
  const deadline = Date.now() + 4_000
  while (Date.now() < deadline) {
    mock = await dispatchSitzung(page, stand)
    await page.waitForTimeout(80)
    const labels = await headerTexte(page)
    if (sitzungPasst(labels, stand)) {
      return { ...mock, labelsAfter: labels }
    }
  }
  throw new Error(`session mock did not hold for ${stand}: ${(await sichtbareLabels(page)).join('|')}`)
}

async function sichtbareLabels(page) {
  return page.evaluate(() => {
    const header = document.querySelector('header')
    if (!header) return []
    return [...header.querySelectorAll('a, button')]
      .filter((el) => {
        const r = el.getBoundingClientRect()
        const style = getComputedStyle(el)
        return r.width > 0 && r.height > 0 && style.display !== 'none' && style.visibility !== 'hidden'
      })
      .map((el) => (el.getAttribute('aria-label') || el.textContent || '').replace(/\s+/g, ' ').trim())
  })
}

async function speichern(page, name, meta, clipHeader = false) {
  const pfad = join(SCHIRME, `${name}.png`)
  const header = page.locator('header')
  if (clipHeader) {
    await header.screenshot({ path: pfad })
  } else {
    await page.screenshot({ path: pfad, fullPage: false })
  }
  writeFileSync(
    `${pfad}.meta.json`,
    JSON.stringify(
      {
        file: `${name}.png`,
        capturedAt: new Date().toISOString(),
        productTree: PRODUCT_TREE,
        browser: meta.browser,
        viewport: meta.viewport,
        route: meta.route,
        state: meta.state,
        simulationClass: meta.simulationClass,
        actions: meta.actions,
        clip: clipHeader ? 'header-only' : 'viewport',
      },
      null,
      2,
    ),
  )
  return pfad
}

async function seiteVorbereiten(page, { textSize, sitzung }) {
  await nextDevChromeVerbergen(page)
  await text200(page, textSize === 200)
  await hydrationWarten(page)
  await page.evaluate(() => window.scrollTo(0, 0))
  const mock = await setzeSitzung(page, sitzung)
  await page.waitForTimeout(200)
  return mock
}

async function szene(browser, { name, width, height, hasTouch, textSize, sitzung, route = '/', actions = [] }) {
  const context = await browser.newContext({
    viewport: { width, height },
    hasTouch,
    locale: 'de-CH',
    isMobile: hasTouch && width < 768,
  })
  const page = await context.newPage()
  const protokoll = leeresProtokoll()
  await abfangen(page, protokoll)
  await page.goto(`${BASIS}${route}`, { waitUntil: 'domcontentloaded', timeout: 30_000 })
  const mock = await seiteVorbereiten(page, { textSize, sitzung })
  const labels = await sichtbareLabels(page)
  const geometry = await page.evaluate(geometrieSkript())
  const hero = await page.evaluate(() => {
    const header = document.querySelector('header')
    const h1 = document.querySelector('h1')
    if (!header || !h1) return { ok: false }
    const headerBox = header.getBoundingClientRect()
    const heroBox = h1.getBoundingClientRect()
    const style = getComputedStyle(h1)
    const painted =
      heroBox.width > 0 &&
      heroBox.height > 0 &&
      style.display !== 'none' &&
      style.visibility !== 'hidden'
    return {
      ok: true,
      text: (h1.textContent || '').replace(/\s+/g, ' ').trim().slice(0, 80),
      painted,
      top: Number(heroBox.top.toFixed(2)),
      headerBottom: Number(headerBox.bottom.toFixed(2)),
      belowHeader: heroBox.top + 0.5 >= headerBox.bottom,
    }
  })
  const browserLabel = browserVersion(browser)
  const meta = {
    browser: browserLabel,
    viewport: { width, height, hasTouch },
    route,
    state: { sitzung, mock },
    simulationClass:
      textSize === 200
        ? `html-font-size-32px + ${sitzung}`
        : `html-font-size-16px + ${sitzung}`,
    actions: ['goto', 'compiled-css', ...actions],
  }
  const viewportShot = await speichern(page, name, meta, false)
  const headerShot = await speichern(page, `${name}_header`, meta, true)
  await context.close()
  return {
    name,
    meta,
    labels,
    geometry,
    hero,
    shots: { viewport: viewportShot, header: headerShot },
    schreiben: mutationskonto(protokoll),
  }
}

async function interaktion(browser, { name, width, height, hasTouch, textSize, sitzung }) {
  const context = await browser.newContext({
    viewport: { width, height },
    hasTouch,
    locale: 'de-CH',
    isMobile: hasTouch,
  })
  const page = await context.newPage()
  const protokoll = leeresProtokoll()
  await abfangen(page, protokoll)
  await page.goto(`${BASIS}/`, { waitUntil: 'domcontentloaded', timeout: 30_000 })
  const mock = await seiteVorbereiten(page, { textSize, sitzung })
  const menu = page.locator('#oeffentliche-mobile-navigation')
  const knopf = page.locator('button[aria-controls="oeffentliche-mobile-navigation"]')
  const beforeOpen = {
    expanded: await knopf.getAttribute('aria-expanded'),
    hidden: await menu.getAttribute('hidden'),
    inert: await menu.evaluate((el) => el.inert),
  }
  await knopf.click()
  await page.waitForTimeout(150)
  const open = {
    expanded: await knopf.getAttribute('aria-expanded'),
    hidden: await menu.evaluate((el) => el.hidden),
    inert: await menu.evaluate((el) => el.inert),
    labels: await sichtbareLabels(page),
    geometry: await page.evaluate(geometrieSkript()),
  }
  const browserLabel = browserVersion(browser)
  const meta = {
    browser: browserLabel,
    viewport: { width, height, hasTouch },
    route: '/',
    state: { sitzung, mock, menu: 'open' },
    simulationClass:
      textSize === 200
        ? `html-font-size-32px + ${sitzung} + menu-open`
        : `html-font-size-16px + ${sitzung} + menu-open`,
    actions: ['goto', 'open-menu'],
  }
  await speichern(page, `${name}_menu-open`, meta, false)
  await speichern(page, `${name}_menu-open_header`, meta, true)

  await page.keyboard.press('Tab')
  const focusVisible = await page.evaluate(() => {
    const el = document.activeElement
    if (!el) return null
    const style = getComputedStyle(el)
    const r = el.getBoundingClientRect()
    return {
      text: (el.getAttribute('aria-label') || el.textContent || '').replace(/\s+/g, ' ').trim().slice(0, 80),
      outline: style.outline,
      boxShadow: style.boxShadow,
      width: Number(r.width.toFixed(2)),
      height: Number(r.height.toFixed(2)),
    }
  })
  await speichern(
    page,
    `${name}_menu-focus`,
    { ...meta, state: { ...meta.state, menu: 'open-focus' }, actions: ['goto', 'open-menu', 'tab'] },
    false,
  )

  await page.keyboard.press('Escape')
  await page.waitForTimeout(150)
  const afterEscape = {
    expanded: await knopf.getAttribute('aria-expanded'),
    hidden: await menu.evaluate((el) => el.hidden),
    inert: await menu.evaluate((el) => el.inert),
    active: await page.evaluate(() => {
      const el = document.activeElement
      return el ? el.getAttribute('aria-label') || el.tagName : null
    }),
  }

  await knopf.click()
  await page.waitForTimeout(100)
  const entdecken = page.locator('#oeffentliche-mobile-navigation a[href="/#entdecken"]')
  if ((await entdecken.count()) > 0) {
    await entdecken.click()
    await page.waitForTimeout(200)
  }
  const afterHash = {
    expanded: await knopf.getAttribute('aria-expanded'),
    hidden: await menu.evaluate((el) => el.hidden),
    hash: await page.evaluate(() => location.hash),
  }

  const abortProbe = await page.evaluate(async () => {
    try {
      const antwort = await fetch('/', { method: 'POST', body: 'audit-abort-probe=1' })
      return { completed: true, status: antwort.status }
    } catch (fehler) {
      return { completed: false, name: fehler.name, message: String(fehler.message || fehler) }
    }
  })

  await context.close()
  return {
    name,
    mock,
    beforeOpen,
    open,
    focusVisible,
    afterEscape,
    afterHash,
    abortProbe,
    schreiben: mutationskonto(protokoll),
  }
}

async function main() {
  mkdirSync(SCHIRME, { recursive: true })
  const server = await serverStarten()
  const browser = await chromium.launch({ headless: true })
  const bericht = {
    phase: PHASE,
    capturedAt: JETZT,
    productTree: PRODUCT_TREE,
    browser: browserVersion(browser),
    base: BASIS,
    server: server.reused ? 'reused' : 'started',
    note: 'Navbar-only painted overflow is scored separately from later homepage overflow.',
    scenes: [],
    interactions: [],
  }

  try {
    const beforeScenes = [
      { name: `${PHASE}_1024x768_text-200_gast`, width: 1024, height: 768, hasTouch: false, textSize: 200, sitzung: 'gast' },
      { name: `${PHASE}_1440x900_text-200_gast`, width: 1440, height: 900, hasTouch: false, textSize: 200, sitzung: 'gast' },
      { name: `${PHASE}_1024x768_text-200_konto`, width: 1024, height: 768, hasTouch: false, textSize: 200, sitzung: 'konto' },
      { name: `${PHASE}_1440x900_text-200_konto`, width: 1440, height: 900, hasTouch: false, textSize: 200, sitzung: 'konto' },
    ]

    const afterScenes = [
      ...beforeScenes,
      { name: `${PHASE}_1024x768_text-200_unbekannt`, width: 1024, height: 768, hasTouch: false, textSize: 200, sitzung: 'unbekannt' },
      { name: `${PHASE}_360x800_text-100_gast`, width: 360, height: 800, hasTouch: true, textSize: 100, sitzung: 'gast' },
      { name: `${PHASE}_390x844_text-100_gast`, width: 390, height: 844, hasTouch: true, textSize: 100, sitzung: 'gast' },
      { name: `${PHASE}_360x800_text-200_gast`, width: 360, height: 800, hasTouch: true, textSize: 200, sitzung: 'gast' },
      { name: `${PHASE}_390x844_text-200_gast`, width: 390, height: 844, hasTouch: true, textSize: 200, sitzung: 'gast' },
      { name: `${PHASE}_767x800_text-100_gast`, width: 767, height: 800, hasTouch: true, textSize: 100, sitzung: 'gast' },
      { name: `${PHASE}_768x800_text-100_gast`, width: 768, height: 800, hasTouch: false, textSize: 100, sitzung: 'gast' },
      { name: `${PHASE}_769x800_text-100_gast`, width: 769, height: 800, hasTouch: false, textSize: 100, sitzung: 'gast' },
      { name: `${PHASE}_1024x768_text-100_gast`, width: 1024, height: 768, hasTouch: false, textSize: 100, sitzung: 'gast' },
      { name: `${PHASE}_1440x900_text-100_gast`, width: 1440, height: 900, hasTouch: false, textSize: 100, sitzung: 'gast' },
      { name: `${PHASE}_1920x1080_text-100_gast`, width: 1920, height: 1080, hasTouch: false, textSize: 100, sitzung: 'gast' },
    ]

    const integratedScenes = [
      { name: `${PHASE}_360x800_text-100_gast`, width: 360, height: 800, hasTouch: true, textSize: 100, sitzung: 'gast' },
      { name: `${PHASE}_360x800_text-200_gast`, width: 360, height: 800, hasTouch: true, textSize: 200, sitzung: 'gast' },
      { name: `${PHASE}_390x844_text-100_gast`, width: 390, height: 844, hasTouch: true, textSize: 100, sitzung: 'gast' },
      { name: `${PHASE}_390x844_text-200_gast`, width: 390, height: 844, hasTouch: true, textSize: 200, sitzung: 'gast' },
      { name: `${PHASE}_1024x768_text-100_gast`, width: 1024, height: 768, hasTouch: false, textSize: 100, sitzung: 'gast' },
      { name: `${PHASE}_1024x768_text-200_gast`, width: 1024, height: 768, hasTouch: false, textSize: 200, sitzung: 'gast' },
      { name: `${PHASE}_1024x768_text-200_konto`, width: 1024, height: 768, hasTouch: false, textSize: 200, sitzung: 'konto' },
      { name: `${PHASE}_1024x768_text-200_unbekannt`, width: 1024, height: 768, hasTouch: false, textSize: 200, sitzung: 'unbekannt' },
      { name: `${PHASE}_1440x900_text-100_gast`, width: 1440, height: 900, hasTouch: false, textSize: 100, sitzung: 'gast' },
      { name: `${PHASE}_1440x900_text-200_gast`, width: 1440, height: 900, hasTouch: false, textSize: 200, sitzung: 'gast' },
      { name: `${PHASE}_1440x900_text-200_konto`, width: 1440, height: 900, hasTouch: false, textSize: 200, sitzung: 'konto' },
      { name: `${PHASE}_1440x900_text-200_unbekannt`, width: 1440, height: 900, hasTouch: false, textSize: 200, sitzung: 'unbekannt' },
    ]

    const scenes =
      PHASE === 'before' ? beforeScenes : PHASE === 'integrated' ? integratedScenes : afterScenes
    for (const spec of scenes) {
      bericht.scenes.push(await szene(browser, spec))
    }

    if (PHASE === 'before') {
      bericht.interactions.push(
        await interaktion(browser, {
          name: `${PHASE}_390x600_text-100_gast`,
          width: 390,
          height: 600,
          hasTouch: true,
          textSize: 100,
          sitzung: 'gast',
        }),
      )
    } else if (PHASE === 'integrated') {
      bericht.interactions.push(
        await interaktion(browser, {
          name: `${PHASE}_360x800_text-100_gast`,
          width: 360,
          height: 800,
          hasTouch: true,
          textSize: 100,
          sitzung: 'gast',
        }),
      )
      bericht.interactions.push(
        await interaktion(browser, {
          name: `${PHASE}_360x800_text-200_gast`,
          width: 360,
          height: 800,
          hasTouch: true,
          textSize: 200,
          sitzung: 'gast',
        }),
      )
      bericht.interactions.push(
        await interaktion(browser, {
          name: `${PHASE}_390x600_text-100_gast`,
          width: 390,
          height: 600,
          hasTouch: true,
          textSize: 100,
          sitzung: 'gast',
        }),
      )
      bericht.interactions.push(
        await interaktion(browser, {
          name: `${PHASE}_390x600_text-200_gast`,
          width: 390,
          height: 600,
          hasTouch: true,
          textSize: 200,
          sitzung: 'gast',
        }),
      )
    } else {
      bericht.interactions.push(
        await interaktion(browser, {
          name: `${PHASE}_390x600_text-100_gast`,
          width: 390,
          height: 600,
          hasTouch: true,
          textSize: 100,
          sitzung: 'gast',
        }),
      )
      bericht.interactions.push(
        await interaktion(browser, {
          name: `${PHASE}_390x600_text-200_gast`,
          width: 390,
          height: 600,
          hasTouch: true,
          textSize: 200,
          sitzung: 'gast',
        }),
      )
      bericht.interactions.push(
        await interaktion(browser, {
          name: `${PHASE}_390x844_text-200_konto`,
          width: 390,
          height: 844,
          hasTouch: true,
          textSize: 200,
          sitzung: 'konto',
        }),
      )
    }
  } finally {
    await browser.close()
    if (server.kind) server.kind.kill()
  }

  const ziel = join(EVIDENZ, `audit-${PHASE}.json`)
  writeFileSync(ziel, JSON.stringify(bericht, null, 2))
  console.log(ziel)
  for (const scene of bericht.scenes) {
    const horiz = scene.geometry.navbarHorizontalOffenders || []
    const vert = scene.geometry.navbarVerticalOffenders || []
    console.log(
      `${scene.name} headerH=${scene.geometry.header?.height} overflowX=${scene.geometry.document.overflowX} navbarH=${horiz.length} navbarV=${vert.length} labels=${scene.labels.join('|')}`,
    )
  }
}

main().catch((fehler) => {
  console.error(fehler)
  process.exit(1)
})
