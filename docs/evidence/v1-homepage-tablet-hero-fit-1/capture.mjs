#!/usr/bin/env node
// docs/evidence/v1-homepage-tablet-hero-fit-1/capture.mjs
//
// Disposable local Chromium evidence for V1 Homepage Tablet Hero Fit 1.
// Uses the compiled Next homepage and real product CSS. Synthetic guest
// only. Provider/model/search routes are fulfilled unavailable.
// Unexpected mutation requests, including same-route server actions,
// are aborted before they complete. Safe local Next internals may continue.
//
// PHASE=before reproduces the 1024px decorative-card squeeze.
// PHASE=after records the coordinated xl grid/card display and neighbors.
// html { font-size: 32px } scenes are text simulation, not OS zoom,
// hardware, Safari or WCAG certification.

import { execSync, spawn } from 'node:child_process'
import { mkdirSync, writeFileSync } from 'node:fs'
import { dirname, join } from 'node:path'
import { fileURLToPath } from 'node:url'
import { chromium } from 'playwright'

const HIER = dirname(fileURLToPath(import.meta.url))
const PORT = process.env.AUDIT_PORT || '3000'
const BASIS = process.env.AUDIT_BASE || `http://localhost:${PORT}`
const PHASE = process.env.AUDIT_PHASE || 'after'
const EVIDENZ = process.env.AUDIT_EVIDENCE_DIR || HIER
const SCHIRME = join(EVIDENZ, 'screens')
const BERICHT = join(EVIDENZ, `audit-${PHASE}.json`)
const SHA = (process.env.AUDIT_PRODUCT_SHA || execSync('git rev-parse HEAD', { encoding: 'utf8' })).trim()
const DIRTY = process.env.AUDIT_WORKING_TREE === 'clean'
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

const SZENEN = [
  { name: '360x800', width: 360, height: 800, hasTouch: true, textScale: 1 },
  { name: '390x844', width: 390, height: 844, hasTouch: true, textScale: 1 },
  { name: '768x1024', width: 768, height: 1024, hasTouch: true, textScale: 1 },
  { name: '1023x768', width: 1023, height: 768, hasTouch: false, textScale: 1 },
  { name: '1024x768', width: 1024, height: 768, hasTouch: false, textScale: 1 },
  { name: '1279x800', width: 1279, height: 800, hasTouch: false, textScale: 1 },
  { name: '1280x800', width: 1280, height: 800, hasTouch: false, textScale: 1 },
  { name: '1440x900', width: 1440, height: 900, hasTouch: false, textScale: 1 },
  { name: '1920x1080', width: 1920, height: 1080, hasTouch: false, textScale: 1 },
  {
    name: '1024x768_text-200',
    width: 1024,
    height: 768,
    hasTouch: false,
    textScale: 2,
    textSimulation: true,
  },
  {
    name: '1440x900_text-200',
    width: 1440,
    height: 900,
    hasTouch: false,
    textScale: 2,
    textSimulation: true,
  },
]

function browserVersion(browser) {
  const name = browser.browserType().name()
  return `${name}/${browser.version()}`
}

async function serverErreichbar() {
  try {
    const antwort = await fetch(BASIS, { redirect: 'manual' })
    return antwort.status > 0
  } catch {
    return false
  }
}

async function serverStarten() {
  if (await serverErreichbar()) return { kind: null, reused: true }
  const kind = spawn('npm', ['run', 'dev', '--', '-p', PORT, '-H', 'localhost'], {
    cwd: '/workspace',
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
  const ausgabe = []
  kind.stdout.on('data', (chunk) => ausgabe.push(String(chunk)))
  kind.stderr.on('data', (chunk) => ausgabe.push(String(chunk)))
  const start = Date.now()
  while (Date.now() - start < 90_000) {
    if (await serverErreichbar()) return { kind, reused: false }
    await new Promise((r) => setTimeout(r, 400))
  }
  kind.kill()
  throw new Error(`Next.js startete nicht:\n${ausgabe.join('')}`)
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
    const eintrag = { method: req.method(), url: req.url(), resourceType: req.resourceType() }
    protokoll.anfragen.push(eintrag)
    if (istMutation(req.method())) protokoll.schreiben.push(eintrag)
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
    attemptedUnexpectedMutations: protokoll.versuche.length,
    abortedUnexpectedMutations: protokoll.abgebrochen.length,
    completedUnexpectedMutations: protokoll.unerwartetAbgeschlossen.length,
    safeNextInternalMutations: protokoll.interneAbgeschlossen.length,
    providerOrApiBlocked: protokoll.abgefangen.length,
    note:
      'Zero unexpected mutation attempts is evidence that no mutating request was observed. It is not proof that a live POST was intercepted.',
    versuche: protokoll.versuche,
    abgebrochen: protokoll.abgebrochen,
    unerwartetAbgeschlossen: protokoll.unerwartetAbgeschlossen,
    abgefangen: protokoll.abgefangen.slice(0, 20),
  }
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

async function seiteOffen(page, textScale) {
  const antwort = await page.goto(`${BASIS}/`, { waitUntil: 'load', timeout: 60_000 })
  if (textScale !== 1) {
    await page.addStyleTag({
      content: `html { font-size: ${16 * textScale}px !important; }`,
    })
  }
  await nextDevChromeVerbergen(page)
  try {
    await hydrationWarten(page)
  } catch {
    // Geometry proof does not require a failed hydration to abort the capture.
  }
  await page.waitForTimeout(400)
  return antwort?.ok() ?? false
}

async function geometrie(page) {
  return page.evaluate(() => {
    const html = document.documentElement
    const body = document.body
    const heroSection = document.querySelector('main > section')
    const heroGrid = heroSection?.querySelector(':scope > div > .relative.z-10')
    const h1 = heroSection?.querySelector('h1')
    const form = heroSection?.querySelector('form')
    const cta = form?.querySelector('button[type="submit"]')
    const ziel = form?.querySelector('#travel-idea')
    const cardTitle = Array.from(heroSection?.querySelectorAll('h2') ?? []).find((el) =>
      (el.textContent || '').includes('Bali'),
    )
    const card =
      cardTitle?.closest('[class*="max-w-[390px]"]') ||
      cardTitle?.closest('[class*="rotate-"]') ||
      cardTitle?.closest('div.w-full')
    const tags = Array.from(heroSection?.querySelectorAll('span.truncate') ?? []).map((el) => ({
      text: (el.textContent || '').trim(),
      clientWidth: Math.round(el.clientWidth * 100) / 100,
      scrollWidth: Math.round(el.scrollWidth * 100) / 100,
      truncated: el.scrollWidth - el.clientWidth > 1,
      overflow: getComputedStyle(el).overflow,
      textOverflow: getComputedStyle(el).textOverflow,
    }))

    const box = (el) => {
      if (!el) return null
      const r = el.getBoundingClientRect()
      const style = getComputedStyle(el)
      return {
        x: Math.round(r.x * 100) / 100,
        y: Math.round(r.y * 100) / 100,
        width: Math.round(r.width * 100) / 100,
        height: Math.round(r.height * 100) / 100,
        right: Math.round(r.right * 100) / 100,
        bottom: Math.round(r.bottom * 100) / 100,
        display: style.display,
        visibility: style.visibility,
        overflow: style.overflow,
      }
    }

    const titleRects = cardTitle ? Array.from(cardTitle.getClientRects()).length : 0
    const gridStyle = heroGrid ? getComputedStyle(heroGrid) : null
    const columns = gridStyle?.gridTemplateColumns || null
    const columnCount = columns && columns !== 'none' ? columns.split(' ').length : 1
    const cardVisible = Boolean(
      card &&
        getComputedStyle(card).display !== 'none' &&
        getComputedStyle(card).visibility !== 'hidden' &&
        card.getBoundingClientRect().width > 0,
    )
    const viewport = { width: window.innerWidth, height: window.innerHeight }
    const cardOffscreen = cardVisible
      ? card.getBoundingClientRect().right > viewport.width + 1 ||
        card.getBoundingClientRect().left < -1
      : false

    return {
      document: {
        clientWidth: html.clientWidth,
        scrollWidth: html.scrollWidth,
        clientHeight: html.clientHeight,
        scrollHeight: html.scrollHeight,
        overflowX: html.scrollWidth - html.clientWidth,
        bodyOverflowX: body.scrollWidth - body.clientWidth,
      },
      hero: {
        ...box(heroSection),
        exceedsViewportHeight: heroSection
          ? heroSection.getBoundingClientRect().height > viewport.height + 1
          : null,
      },
      grid: {
        ...box(heroGrid),
        gridTemplateColumns: columns,
        columnCount,
        gap: gridStyle?.gap || null,
      },
      headline: {
        text: (h1?.textContent || '').trim(),
        fontSize: h1 ? getComputedStyle(h1).fontSize : null,
        ...box(h1),
      },
      form: box(form),
      destination: {
        ...box(ziel),
        placeholder: ziel?.getAttribute('placeholder') || null,
      },
      cta: {
        text: (cta?.textContent || '').replace(/\s+/g, ' ').trim(),
        ...box(cta),
      },
      card: {
        visible: cardVisible,
        emptySecondColumn: columnCount >= 2 && !cardVisible,
        offscreen: cardOffscreen,
        title: cardTitle ? (cardTitle.textContent || '').trim() : null,
        titleLineCount: titleRects,
        titleWraps: titleRects > 1,
        ...box(card),
        tags,
      },
    }
  })
}

async function interaktion(page, protokoll) {
  const ziel = page.locator('#travel-idea')
  const cta = page.getByRole('button', { name: 'Reise planen' }).first()
  await ziel.focus()
  const focused = await page.evaluate(() => document.activeElement?.id || null)
  await page.keyboard.press('Tab')
  const afterTab = await page.evaluate(() => {
    const el = document.activeElement
    return {
      tag: el?.tagName || null,
      type: el?.getAttribute('type') || null,
      text: (el?.textContent || '').replace(/\s+/g, ' ').trim().slice(0, 80),
    }
  })
  await cta.click()
  const validation = await page.locator('[role="alert"]').first().textContent().catch(() => null)
  return {
    focusedDestinationId: focused,
    afterTab,
    validation: validation ? validation.trim() : null,
    destinationPlaceholder: await ziel.getAttribute('placeholder'),
    ctaName: 'Reise planen',
    mutations: mutationskonto(protokoll),
  }
}

function clip(box, viewport) {
  if (!box) return null
  const x = Math.max(0, Math.floor(box.x))
  const y = Math.max(0, Math.floor(box.y))
  const width = Math.max(1, Math.min(Math.ceil(box.width), viewport.width - x))
  const height = Math.max(1, Math.min(Math.ceil(box.height), viewport.height - y))
  return { x, y, width, height }
}

async function main() {
  mkdirSync(SCHIRME, { recursive: true })
  const server = await serverStarten()
  const browser = await chromium.launch({ channel: 'chrome' }).catch(() => chromium.launch())
  const browserLabel = browserVersion(browser)
  const szenen = []
  let interaktionBeweis = null

  try {
    for (const szene of SZENEN) {
      if (PHASE === 'before' && !['1024x768', '1279x800', '1280x800', '1440x900'].includes(szene.name)) {
        continue
      }

      const kontext = await browser.newContext({
        viewport: { width: szene.width, height: szene.height },
        deviceScaleFactor: 1,
        hasTouch: szene.hasTouch,
        locale: 'de-DE',
      })
      const page = await kontext.newPage()
      const protokoll = leeresProtokoll()
      await abfangen(page, protokoll)
      const ok = await seiteOffen(page, szene.textScale)
      const mass = await geometrie(page)
      const viewportName = `${PHASE}_${szene.name}_viewport.png`
      const heroName = `${PHASE}_${szene.name}_hero.png`
      await page.screenshot({
        path: join(SCHIRME, viewportName),
        fullPage: false,
      })
      const heroClip = clip(mass.hero, { width: szene.width, height: szene.height })
      if (heroClip) {
        await page.screenshot({
          path: join(SCHIRME, heroName),
          clip: heroClip,
        })
      }

      const eintrag = {
        scene: szene.name,
        textSimulation: Boolean(szene.textSimulation),
        textSimulationNote: szene.textSimulation
          ? 'html { font-size: 32px } CSS text simulation. Not OS zoom, hardware, Safari or WCAG certification.'
          : null,
        viewport: { width: szene.width, height: szene.height, dpr: 1 },
        route: '/',
        state: 'anonymous-guest-homepage-no-draft',
        loaded: ok,
        images: {
          viewport: `screens/${viewportName}`,
          hero: heroClip ? `screens/${heroName}` : null,
          note: 'Viewport-sized capture plus hero clip bounded to the visible viewport. Not a card-only crop.',
        },
        geometry: mass,
        mutations: mutationskonto(protokoll),
      }
      szenen.push(eintrag)

      if (PHASE === 'after' && szene.name === '1024x768' && !interaktionBeweis) {
        interaktionBeweis = await interaktion(page, protokoll)
      }

      await kontext.close()
    }
  } finally {
    await browser.close()
    if (server.kind) server.kind.kill()
  }

  const bericht = {
    phase: PHASE,
    capturedAt: JETZT,
    productTree: PRODUCT_TREE,
    browser: browserLabel,
    server: { base: BASIS, reused: server.reused },
    limitations: [
      'Local Chromium compiled-CSS evidence only.',
      'Not authenticated Preview, hardware, Safari or WCAG proof.',
      'html font-size 32px scenes are text simulation.',
      'Synthetic disposable guest homepage. No account or provider write.',
    ],
    scenes: szenen,
    interaction: interaktionBeweis,
  }

  writeFileSync(BERICHT, `${JSON.stringify(bericht, null, 2)}\n`)
  console.log(JSON.stringify({ phase: PHASE, report: BERICHT, scenes: szenen.length, head: SHA }, null, 2))
}

main().catch((fehler) => {
  console.error(fehler)
  process.exit(1)
})
