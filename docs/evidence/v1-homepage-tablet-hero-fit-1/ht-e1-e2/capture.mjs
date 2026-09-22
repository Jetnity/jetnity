#!/usr/bin/env node
// docs/evidence/v1-homepage-tablet-hero-fit-1/ht-e1-e2/capture.mjs
//
// HT-E1/HT-E2 correction capture. Does not overwrite first-round screens.
// html { font-size: 32px } is text simulation, not OS zoom / hardware / WCAG.
// Baseline homepage is git blob 1bd46c82 (seed 195f6bc5). After homepage is
// blob bc272ae9 (xl coordinated display). page.tsx is restored in finally.

import { execSync, spawn } from 'node:child_process'
import { mkdirSync, readFileSync, writeFileSync } from 'node:fs'
import { dirname, join } from 'node:path'
import { fileURLToPath } from 'node:url'
import { chromium } from 'playwright'

const HIER = dirname(fileURLToPath(import.meta.url))
const ROOT = '/workspace'
const PAGE = join(ROOT, 'app/(public)/page.tsx')
const PORT = process.env.AUDIT_PORT || '3000'
const BASIS = process.env.AUDIT_BASE || `http://localhost:${PORT}`
const SCHIRME = join(HIER, 'screens')
const BASELINE_REF = process.env.AUDIT_BASELINE_REF || '195f6bc566854f07044064a3690f7d1df68602da'
const BASELINE_BLOB = '1bd46c82674e727b122d1798f842a8d57a99d62f'
const AFTER_BLOB = 'bc272ae9f82f591ea4c4b7540796e7652f6c2e19'

function git(cmd) {
  return execSync(cmd, { cwd: ROOT, encoding: 'utf8' }).trim()
}

function productTree(note) {
  const dirty = git('git status --porcelain')
    .split('\n')
    .map((zeile) => zeile.trim())
    .filter(Boolean)
  return {
    head: git('git rev-parse HEAD'),
    pageBlob: git(`git hash-object "${PAGE}"`),
    workingTree: dirty.length === 0 ? 'clean' : 'dirty',
    dirtyPaths: dirty,
    sourceNote: note,
  }
}

function browserVersion(browser) {
  return `${browser.browserType().name()}/${browser.version()}`
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
    cwd: ROOT,
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
    versuche: [],
    abgebrochen: [],
    unerwartetAbgeschlossen: [],
    interneAbgeschlossen: [],
    abgefangen: [],
  }
}

async function abfangen(page, protokoll) {
  await page.route('**/*', async (route) => {
    const req = route.request()
    const method = req.method()
    const url = req.url()
    if (istProviderOderApi(url)) {
      protokoll.abgefangen.push({ method, url, kind: 'provider-or-api' })
      await route.fulfill({
        status: 503,
        contentType: 'application/json',
        body: JSON.stringify({ ok: false, reason: 'audit-blocked', simulation: true }),
      })
      return
    }
    if (istMutation(method)) {
      if (istSicheresNextIntern(url)) {
        await route.continue()
        return
      }
      protokoll.versuche.push({ method, url, kind: 'unexpected-mutation' })
      protokoll.abgebrochen.push({ method, url, reason: 'audit-abort-mutation' })
      await route.abort('blockedbyclient')
      return
    }
    await route.continue()
  })
  page.on('requestfinished', (req) => {
    if (!istMutation(req.method())) return
    if (istSicheresNextIntern(req.url())) protokoll.interneAbgeschlossen.push({ method: req.method(), url: req.url() })
    else protokoll.unerwartetAbgeschlossen.push({ method: req.method(), url: req.url() })
  })
}

function mutationskonto(protokoll) {
  return {
    attemptedUnexpectedMutations: protokoll.versuche.length,
    abortedUnexpectedMutations: protokoll.abgebrochen.length,
    completedUnexpectedMutations: protokoll.unerwartetAbgeschlossen.length,
    note:
      'Zero unexpected mutation attempts is evidence that no mutating request was observed. It is not proof that a live POST was intercepted.',
    versuche: protokoll.versuche,
    abgebrochen: protokoll.abgebrochen,
    unerwartetAbgeschlossen: protokoll.unerwartetAbgeschlossen,
  }
}

async function seiteOffen(page) {
  const antwort = await page.goto(`${BASIS}/`, { waitUntil: 'load', timeout: 60_000 })
  await page.addStyleTag({
    content:
      'html { font-size: 32px !important; } nextjs-portal, [data-next-badge-root], [data-nextjs-toast] { display: none !important; }',
  })
  try {
    await page.waitForFunction(() => {
      const knopf = document.querySelector(
        'button[aria-controls="oeffentliche-mobile-navigation"], a[href="/reisen"]',
      )
      if (!knopf) return false
      return Object.keys(knopf).some(
        (name) => name.startsWith('__reactFiber') || name.startsWith('__reactProps'),
      )
    }, { timeout: 20_000 })
  } catch {
    // Geometry still usable if hydration is slow.
  }
  await page.waitForTimeout(500)
  return antwort?.ok() ?? false
}

async function warteAufHomepage(page, erwartetXl) {
  await page.reload({ waitUntil: 'load' })
  await seiteOffen(page)
  await page.waitForFunction(
    (xl) => {
      const html = document.documentElement.innerHTML
      return xl
        ? html.includes('xl:grid-cols-[minmax(0,650px)_minmax(0,1fr)]')
        : html.includes('lg:grid-cols-[minmax(0,650px)_minmax(0,1fr)]')
    },
    erwartetXl,
    { timeout: 20_000 },
  )
}

async function mass(page) {
  return page.evaluate(() => {
    const html = document.documentElement
    const hero = document.querySelector('main > section')
    const h1 = hero?.querySelector('h1')
    const form = hero?.querySelector('form')
    const cta = form?.querySelector('button[type="submit"]')
    const ziel = form?.querySelector('#travel-idea')
    const grid = hero?.querySelector(':scope > div > .relative.z-10')
    const cardTitle = Array.from(hero?.querySelectorAll('h2') ?? []).find((el) =>
      (el.textContent || '').includes('Bali'),
    )
    const card =
      cardTitle?.closest('[class*="max-w-[390px]"]') ||
      cardTitle?.closest('[class*="rotate-"]')
    const box = (el) => {
      if (!el) return null
      const r = el.getBoundingClientRect()
      return {
        x: Math.round(r.x * 100) / 100,
        y: Math.round(r.y * 100) / 100,
        width: Math.round(r.width * 100) / 100,
        height: Math.round(r.height * 100) / 100,
        right: Math.round(r.right * 100) / 100,
        bottom: Math.round(r.bottom * 100) / 100,
        display: getComputedStyle(el).display,
        visibility: getComputedStyle(el).visibility,
      }
    }
    const cssPath = (el) => {
      const teile = []
      let knoten = el
      while (knoten && knoten.nodeType === 1 && teile.length < 10) {
        let teil = knoten.tagName.toLowerCase()
        if (knoten.id) {
          teile.unshift(`#${knoten.id}`)
          break
        }
        const parent = knoten.parentElement
        if (parent) {
          const gleich = [...parent.children].filter((kind) => kind.tagName === knoten.tagName)
          if (gleich.length > 1) teil += `:nth-of-type(${gleich.indexOf(knoten) + 1})`
        }
        if (knoten.getAttribute('aria-hidden') === 'true') teil += '[aria-hidden="true"]'
        const cls = typeof knoten.className === 'string' ? knoten.className.trim().split(/\s+/)[0] : ''
        if (cls) teil += `.${cls.replace(/[^\w-]/g, '')}`
        teile.unshift(teil)
        knoten = parent
      }
      return teile.join(' > ')
    }
    const painted = (el) => {
      let knoten = el
      while (knoten && knoten.nodeType === 1) {
        const stil = getComputedStyle(knoten)
        if (stil.display === 'none' || stil.visibility === 'hidden') return false
        knoten = knoten.parentElement
      }
      return true
    }
    const offenders = []
    for (const el of document.body.querySelectorAll('*')) {
      const r = el.getBoundingClientRect()
      if (r.width < 2 || r.height < 2) continue
      if (r.right <= html.clientWidth + 1) continue
      const inHero = Boolean(hero && hero.contains(el))
      offenders.push({
        selector: cssPath(el),
        tag: el.tagName.toLowerCase(),
        id: el.id || null,
        className: typeof el.className === 'string' ? el.className.slice(0, 180) : '',
        ariaHidden: el.getAttribute('aria-hidden'),
        computedDisplay: getComputedStyle(el).display,
        painted: painted(el),
        text: (el.textContent || '').replace(/\s+/g, ' ').trim().slice(0, 80),
        bounds: {
          x: Math.round(r.x),
          y: Math.round(r.y),
          width: Math.round(r.width),
          height: Math.round(r.height),
          right: Math.round(r.right),
          bottom: Math.round(r.bottom),
        },
        firstHeroDescendant: inHero,
      })
    }
    offenders.sort((a, b) => b.bounds.right - a.bounds.right)
    const heroDescendants = []
    if (hero) {
      for (const el of [h1, form, ziel, cta, cardTitle, card].filter(Boolean)) {
        heroDescendants.push({
          role: el === h1 ? 'headline' : el === form ? 'form' : el === ziel ? 'destination' : el === cta ? 'cta' : 'card',
          selector: cssPath(el),
          ...box(el),
        })
      }
    }
    const columns = grid ? getComputedStyle(grid).gridTemplateColumns : null
    const columnCount = columns && columns !== 'none' ? columns.split(' ').length : 1
    const cardBox = box(card)
    const cardVisible = Boolean(cardBox && cardBox.display !== 'none' && cardBox.width > 0)
    const heroBox = box(hero)
    const formBox = box(form)
    const ctaBox = box(cta)
    const zielBox = box(ziel)
    const contained = (inner, outer) =>
      Boolean(
        inner &&
          outer &&
          inner.x >= outer.x - 1 &&
          inner.right <= outer.right + 1 &&
          inner.y >= outer.y - 1 &&
          inner.bottom <= outer.bottom + 1,
      )
    return {
      document: {
        clientWidth: html.clientWidth,
        scrollWidth: html.scrollWidth,
        clientHeight: html.clientHeight,
        scrollHeight: html.scrollHeight,
        overflowX: html.scrollWidth - html.clientWidth,
        bodyOverflowX: document.body.scrollWidth - document.body.clientWidth,
      },
      hero: { ...heroBox, exceedsViewportHeight: heroBox ? heroBox.height > html.clientHeight + 1 : null },
      grid: { ...box(grid), gridTemplateColumns: columns, columnCount },
      headline: { text: (h1?.textContent || '').trim(), ...box(h1) },
      form: formBox,
      destination: { ...zielBox, placeholder: ziel?.getAttribute('placeholder') || null },
      cta: { text: (cta?.textContent || '').replace(/\s+/g, ' ').trim(), ...ctaBox },
      card: {
        visible: cardVisible,
        emptySecondColumn: columnCount >= 2 && !cardVisible,
        title: cardTitle ? (cardTitle.textContent || '').trim() : null,
        ...cardBox,
      },
      containment: {
        formInsideHero: contained(formBox, heroBox),
        ctaInsideHero: contained(ctaBox, heroBox),
        destinationInsideHero: contained(zielBox, heroBox),
        formBelowFirstViewport: formBox ? formBox.bottom > html.clientHeight + 1 : null,
        note: 'Contained means inside the first-hero rectangle. It does not mean visible without vertical scroll.',
      },
      firstHeroDescendants: heroDescendants,
      overflowOffenders: offenders,
      overflowHonesty:
        'hero.right === viewport width does not prove every descendant fits. Offenders are listed separately. firstHeroDescendant=false items are navbar or later sections and are out of this slice ownership.',
    }
  })
}

async function interaktion(page, protokoll) {
  const ziel = page.locator('#travel-idea')
  const cta = page.getByRole('button', { name: 'Reise planen' }).first()
  await ziel.scrollIntoViewIfNeeded()
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

async function szeneAufnehmen(browser, { label, width, height, erwartetXl }) {
  const kontext = await browser.newContext({
    viewport: { width, height },
    deviceScaleFactor: 1,
    locale: 'de-DE',
  })
  const page = await kontext.newPage()
  const protokoll = leeresProtokoll()
  await abfangen(page, protokoll)
  await warteAufHomepage(page, erwartetXl)
  const loaded = true
  const geometry = await mass(page)
  const viewportPath = join(SCHIRME, `${label}_viewport.png`)
  const heroFullPath = join(SCHIRME, `${label}_hero-full.png`)
  const formCtaPath = join(SCHIRME, `${label}_form-cta.png`)
  await page.screenshot({ path: viewportPath, fullPage: false })
  const hero = page.locator('main > section').first()
  await hero.screenshot({ path: heroFullPath })
  const form = page.locator('main > section form').first()
  await form.scrollIntoViewIfNeeded()
  await page.waitForTimeout(200)
  await page.screenshot({ path: formCtaPath, fullPage: false })
  const afterScroll = await mass(page)
  let interaction = null
  if (label.startsWith('after_1024')) {
    interaction = await interaktion(page, protokoll)
  }
  await kontext.close()
  return {
    scene: label,
    textSimulation: true,
    textSimulationNote:
      'html { font-size: 32px } CSS text simulation. Not OS zoom, hardware, Safari or WCAG certification.',
    viewport: { width, height, dpr: 1 },
    route: '/',
    state: 'anonymous-guest-homepage-no-draft',
    loaded,
    images: {
      viewport: `screens/${label}_viewport.png`,
      heroFull: `screens/${label}_hero-full.png`,
      formCta: `screens/${label}_form-cta.png`,
      note:
        'viewport = first paint at the named height. hero-full = first-hero element screenshot (viewport width × full hero height, may exceed 768/900). form-cta = same named viewport after scrolling the destination/CTA into view. Vertical scroll is allowed.',
    },
    geometry,
    geometryAfterFormScroll: {
      form: afterScroll.form,
      destination: afterScroll.destination,
      cta: afterScroll.cta,
      containment: afterScroll.containment,
    },
    mutations: mutationskonto(protokoll),
    interaction,
  }
}

function setzeHomepage(ref) {
  const inhalt = execSync(`git show ${ref}:"app/(public)/page.tsx"`, { cwd: ROOT })
  writeFileSync(PAGE, inhalt)
}

async function main() {
  mkdirSync(SCHIRME, { recursive: true })
  const server = await serverStarten()
  const browser = await chromium.launch({ channel: 'chrome' }).catch(() => chromium.launch())
  const browserLabel = browserVersion(browser)
  const original = readFileSync(PAGE)
  const originalHash = git(`git hash-object "${PAGE}"`)
  if (originalHash !== AFTER_BLOB) {
    throw new Error(`Expected after page blob ${AFTER_BLOB}, got ${originalHash}`)
  }
  let baseline = null
  let after1024 = null
  let after1440 = null
  try {
    setzeHomepage(BASELINE_REF)
    const baselineBlob = git(`git hash-object "${PAGE}"`)
    if (baselineBlob !== BASELINE_BLOB) {
      throw new Error(`Expected baseline page blob ${BASELINE_BLOB}, got ${baselineBlob}`)
    }
    baseline = await szeneAufnehmen(browser, {
      label: 'baseline_1024x768_text-200',
      width: 1024,
      height: 768,
      erwartetXl: false,
    })
    baseline.productTree = productTree(
      `matched baseline homepage blob ${BASELINE_BLOB} from ${BASELINE_REF}; temporary page.tsx swap for 1024/200% only`,
    )
    writeFileSync(PAGE, original)
    const restored = git(`git hash-object "${PAGE}"`)
    if (restored !== AFTER_BLOB) {
      throw new Error(`Failed to restore after page blob, got ${restored}`)
    }
    after1024 = await szeneAufnehmen(browser, {
      label: 'after_1024x768_text-200',
      width: 1024,
      height: 768,
      erwartetXl: true,
    })
    after1024.productTree = productTree(`after homepage blob ${AFTER_BLOB}; compiled Next CSS`)
    after1440 = await szeneAufnehmen(browser, {
      label: 'after_1440x900_text-200',
      width: 1440,
      height: 900,
      erwartetXl: true,
    })
    after1440.productTree = productTree(`after homepage blob ${AFTER_BLOB}; compiled Next CSS`)
  } finally {
    writeFileSync(PAGE, original)
    await browser.close()
    if (server.kind) server.kind.kill()
  }

  const bericht = {
    capturedAt: new Date().toISOString(),
    correction: 'HT-E1/HT-E2',
    browser: browserLabel,
    server: { base: BASIS, reused: server.reused },
    blobs: { baselineHomepage: BASELINE_BLOB, afterHomepage: AFTER_BLOB, baselineRef: BASELINE_REF },
    limitations: [
      'Local Chromium compiled-CSS evidence only.',
      'Not authenticated Preview, hardware, Safari or WCAG proof.',
      'html font-size 32px scenes are text simulation.',
      'Old first-round screens/audit JSON were not overwritten.',
    ],
    baseline1024Text200: baseline,
    after1024Text200: after1024,
    after1440Text200: after1440,
  }

  writeFileSync(join(HIER, 'audit-correction.json'), `${JSON.stringify(bericht, null, 2)}\n`)
  writeFileSync(
    join(HIER, 'overflow-attribution.json'),
    `${JSON.stringify(
      {
        capturedAt: bericht.capturedAt,
        scene: '1024x768 html font-size 32px',
        baseline: {
          productTree: baseline.productTree,
          pageBlob: BASELINE_BLOB,
          document: baseline.geometry.document,
          hero: baseline.geometry.hero,
          firstHeroDescendants: baseline.geometry.firstHeroDescendants,
          overflowX: baseline.geometry.document.overflowX,
          overflowOffenders: baseline.geometry.overflowOffenders,
          overflowHonesty: baseline.geometry.overflowHonesty,
        },
        after: {
          productTree: after1024.productTree,
          pageBlob: AFTER_BLOB,
          document: after1024.geometry.document,
          hero: after1024.geometry.hero,
          firstHeroDescendants: after1024.geometry.firstHeroDescendants,
          overflowX: after1024.geometry.document.overflowX,
          overflowOffenders: after1024.geometry.overflowOffenders,
          overflowHonesty: after1024.geometry.overflowHonesty,
        },
        comparison: {
          overflowXDelta: after1024.geometry.document.overflowX - baseline.geometry.document.overflowX,
          newlyIntroducedDocumentOverflow: after1024.geometry.document.overflowX > baseline.geometry.document.overflowX,
          firstHeroDescendantOffendersAfter: after1024.geometry.overflowOffenders.filter((o) => o.firstHeroDescendant),
          firstHeroDescendantOffendersBaseline: baseline.geometry.overflowOffenders.filter((o) => o.firstHeroDescendant),
          firstHeroPaintedOffendersAfter: after1024.geometry.overflowOffenders.filter(
            (o) => o.firstHeroDescendant && o.painted,
          ),
          firstHeroPaintedOffendersBaseline: baseline.geometry.overflowOffenders.filter(
            (o) => o.firstHeroDescendant && o.painted,
          ),
          note:
            'Raw descendant boxes may exist under display:none (hidden decorative card). painted=false means an ancestor is display:none or visibility:hidden. Those are not visible overflow. firstHeroPaintedOffenders* are the honest visible-hero set.',
        },
      },
      null,
      2,
    )}\n`,
  )
  console.log(
    JSON.stringify(
      {
        report: join(HIER, 'audit-correction.json'),
        baselineOverflowX: baseline.geometry.document.overflowX,
        afterOverflowX: after1024.geometry.document.overflowX,
        form1024: after1024.geometry.form,
        form1440: after1440.geometry.form,
      },
      null,
      2,
    ),
  )
}

main().catch((fehler) => {
  console.error(fehler)
  process.exit(1)
})
