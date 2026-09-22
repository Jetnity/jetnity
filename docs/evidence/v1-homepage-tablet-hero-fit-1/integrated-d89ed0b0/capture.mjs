#!/usr/bin/env node
// Representative 1024/1440 refresh after the authorized exact-main merge.
// Does not overwrite first-round or HT-E1/HT-E2 evidence.
// html { font-size: 32px } is text simulation, not OS zoom / hardware / WCAG.

import { execSync, spawn } from 'node:child_process'
import { mkdirSync, writeFileSync } from 'node:fs'
import { dirname, join } from 'node:path'
import { fileURLToPath } from 'node:url'
import { chromium } from 'playwright'

const HIER = dirname(fileURLToPath(import.meta.url))
const ROOT = '/workspace'
const PAGE = join(ROOT, 'app/(public)/page.tsx')
const PORT = process.env.AUDIT_PORT || '3000'
const BASIS = process.env.AUDIT_BASE || `http://localhost:${PORT}`
const SCHIRME = join(HIER, 'screens')
const AFTER_BLOB = 'bc272ae9f82f591ea4c4b7540796e7652f6c2e19'
const INTEGRATED_MAIN = 'd89ed0b01070e47f93918fa64126ff0aeb18a17b'

const SZENEN = [
  { name: '1024x768', width: 1024, height: 768, textScale: 1 },
  { name: '1024x768_text-200', width: 1024, height: 768, textScale: 2, textSimulation: true },
  { name: '1440x900', width: 1440, height: 900, textScale: 1 },
  { name: '1440x900_text-200', width: 1440, height: 900, textScale: 2, textSimulation: true },
]

function git(cmd) {
  return execSync(cmd, { cwd: ROOT, encoding: 'utf8' }).trim()
}

function productTree() {
  const dirty = git('git status --porcelain')
    .split('\n')
    .map((zeile) => zeile.trim())
    .filter(Boolean)
  return {
    head: git('git rev-parse HEAD'),
    pageBlob: git(`git hash-object "${PAGE}"`),
    mergeParents: git('git rev-parse HEAD^1 HEAD^2').split('\n'),
    integratedMain: INTEGRATED_MAIN,
    workingTree: dirty.length === 0 ? 'clean' : 'dirty',
    dirtyPaths: dirty,
    sourceNote: `integrated source after authorized merge of ${INTEGRATED_MAIN}; hero page blob must remain ${AFTER_BLOB}`,
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
    if (istSicheresNextIntern(req.url())) {
      protokoll.interneAbgeschlossen.push({ method: req.method(), url: req.url() })
    } else {
      protokoll.unerwartetAbgeschlossen.push({ method: req.method(), url: req.url() })
    }
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

async function seiteOffen(page, textScale) {
  const antwort = await page.goto(`${BASIS}/`, { waitUntil: 'load', timeout: 60_000 })
  if (textScale !== 1) {
    await page.addStyleTag({
      content: `html { font-size: ${16 * textScale}px !important; }`,
    })
  }
  await page.addStyleTag({
    content:
      'nextjs-portal, [data-next-badge-root], [data-nextjs-toast] { display: none !important; }',
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
    const tags = Array.from(hero?.querySelectorAll('span.truncate') ?? []).map((el) => ({
      text: (el.textContent || '').trim(),
      clientWidth: Math.round(el.clientWidth * 100) / 100,
      scrollWidth: Math.round(el.scrollWidth * 100) / 100,
      truncated: el.scrollWidth - el.clientWidth > 1,
    }))
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
    const painted = (el) => {
      let knoten = el
      while (knoten && knoten.nodeType === 1) {
        const stil = getComputedStyle(knoten)
        if (stil.display === 'none' || stil.visibility === 'hidden') return false
        knoten = knoten.parentElement
      }
      return true
    }
    const cssPath = (el) => {
      const teile = []
      let knoten = el
      while (knoten && knoten.nodeType === 1 && teile.length < 8) {
        let teil = knoten.tagName.toLowerCase()
        if (knoten.id) {
          teile.unshift(`#${knoten.id}`)
          break
        }
        teile.unshift(teil)
        knoten = knoten.parentElement
      }
      return teile.join(' > ')
    }
    const offenders = []
    for (const el of document.body.querySelectorAll('*')) {
      const r = el.getBoundingClientRect()
      if (r.width < 2 || r.height < 2) continue
      if (r.right <= html.clientWidth + 1) continue
      offenders.push({
        selector: cssPath(el),
        painted: painted(el),
        firstHeroDescendant: Boolean(hero && hero.contains(el)),
        computedDisplay: getComputedStyle(el).display,
        bounds: {
          x: Math.round(r.x),
          y: Math.round(r.y),
          width: Math.round(r.width),
          height: Math.round(r.height),
          right: Math.round(r.right),
          bottom: Math.round(r.bottom),
        },
      })
    }
    offenders.sort((a, b) => b.bounds.right - a.bounds.right)
    const columns = grid ? getComputedStyle(grid).gridTemplateColumns : null
    const columnCount = columns && columns !== 'none' ? columns.split(' ').length : 1
    const cardBox = box(card)
    const cardVisible = Boolean(cardBox && cardBox.display !== 'none' && cardBox.width > 0)
    const heroBox = box(hero)
    const formBox = box(form)
    const ctaBox = box(cta)
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
        overflowX: html.scrollWidth - html.clientWidth,
      },
      hero: heroBox,
      grid: { ...box(grid), gridTemplateColumns: columns, columnCount },
      headline: { text: (h1?.textContent || '').trim(), ...box(h1) },
      form: formBox,
      destination: { ...box(ziel), placeholder: ziel?.getAttribute('placeholder') || null },
      cta: { text: (cta?.textContent || '').replace(/\s+/g, ' ').trim(), ...ctaBox },
      card: {
        visible: cardVisible,
        emptySecondColumn: columnCount >= 2 && !cardVisible,
        title: cardTitle ? (cardTitle.textContent || '').trim() : null,
        tags,
        ...cardBox,
      },
      containment: {
        formInsideHero: contained(formBox, heroBox),
        ctaInsideHero: contained(ctaBox, heroBox),
        formBelowFirstViewport: formBox ? formBox.bottom > html.clientHeight + 1 : null,
      },
      overflowOffenders: offenders,
      overflowHonesty:
        'hero.right === viewport width does not prove every descendant fits. Navbar/later-page painted overflow is out of this slice ownership.',
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

async function main() {
  mkdirSync(SCHIRME, { recursive: true })
  const tree = productTree()
  if (tree.pageBlob !== AFTER_BLOB) {
    throw new Error(`Expected preserved hero page blob ${AFTER_BLOB}, got ${tree.pageBlob}`)
  }
  try {
    git(`git merge-base --is-ancestor ${INTEGRATED_MAIN} HEAD`)
  } catch {
    throw new Error(`HEAD does not contain authorized main ${INTEGRATED_MAIN}`)
  }

  const server = await serverStarten()
  const browser = await chromium.launch({ channel: 'chrome' }).catch(() => chromium.launch())
  const browserLabel = browserVersion(browser)
  const scenes = []
  let interaction = null

  try {
    for (const szene of SZENEN) {
      const kontext = await browser.newContext({
        viewport: { width: szene.width, height: szene.height },
        deviceScaleFactor: 1,
        locale: 'de-DE',
      })
      const page = await kontext.newPage()
      const protokoll = leeresProtokoll()
      await abfangen(page, protokoll)
      const loaded = await seiteOffen(page, szene.textScale)
      const geometry = await mass(page)
      const prefix = `integrated_${szene.name}`
      await page.screenshot({ path: join(SCHIRME, `${prefix}_viewport.png`), fullPage: false })
      await page.locator('main > section').first().screenshot({ path: join(SCHIRME, `${prefix}_hero-full.png`) })
      let formCta = null
      if (szene.textSimulation) {
        await page.locator('main > section form').first().scrollIntoViewIfNeeded()
        await page.waitForTimeout(200)
        formCta = `${prefix}_form-cta.png`
        await page.screenshot({ path: join(SCHIRME, formCta), fullPage: false })
      }
      if (szene.name === '1024x768') {
        interaction = await interaktion(page, protokoll)
      }
      scenes.push({
        scene: szene.name,
        textSimulation: Boolean(szene.textSimulation),
        textSimulationNote: szene.textSimulation
          ? 'html { font-size: 32px } CSS text simulation. Not OS zoom, hardware, Safari or WCAG certification.'
          : null,
        viewport: { width: szene.width, height: szene.height, dpr: 1 },
        route: '/',
        state: 'anonymous-guest-homepage-no-draft',
        loaded,
        images: {
          viewport: `screens/${prefix}_viewport.png`,
          heroFull: `screens/${prefix}_hero-full.png`,
          formCta: formCta ? `screens/${formCta}` : null,
        },
        geometry,
        mutations: mutationskonto(protokoll),
      })
      await kontext.close()
    }
  } finally {
    await browser.close()
    if (server.kind) server.kind.kill()
  }

  const bericht = {
    capturedAt: new Date().toISOString(),
    round: 'integrated-d89ed0b0',
    browser: browserLabel,
    server: { base: BASIS, reused: server.reused },
    productTree: tree,
    preservedHeroPageBlob: AFTER_BLOB,
    limitations: [
      'Local Chromium compiled-CSS evidence only.',
      'Not authenticated Preview, hardware, Safari or WCAG proof.',
      'html font-size 32px scenes are text simulation.',
      'Representative 1024/1440 refresh only. Not a repeated general homepage audit.',
      'Old first-round and HT-E1/HT-E2 evidence were not overwritten.',
    ],
    scenes,
    interaction,
  }
  writeFileSync(join(HIER, 'audit-integrated.json'), `${JSON.stringify(bericht, null, 2)}\n`)
  console.log(
    JSON.stringify(
      {
        report: join(HIER, 'audit-integrated.json'),
        head: tree.head,
        pageBlob: tree.pageBlob,
        scenes: scenes.map((s) => ({
          scene: s.scene,
          columns: s.geometry.grid.columnCount,
          card: s.geometry.card.visible,
          overflowX: s.geometry.document.overflowX,
          formBottom: s.geometry.form?.bottom,
        })),
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
