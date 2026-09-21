#!/usr/bin/env node
// scripts/v1-manual-planner-text-reflow-1-audit.mjs
//
// Disposable local Chromium evidence for V1 Manual Planner Text Reflow 1.
// Uses the compiled Next app and real product CSS. Synthetic guest only.
// Provider/model/search routes and unexpected write POSTs are intercepted.
//
// PHASE=before reproduces the 390x844 / html-font-size-32px residual with
// scrollX reset and computed-style instrumentation.
// PHASE=after proves the local layout repair, 360/390 normal+200%, desktop,
// keyboard/validation usability and no call/write/gate regression.

import { execSync, spawn } from 'node:child_process'
import { mkdirSync, writeFileSync } from 'node:fs'
import { dirname, join } from 'node:path'
import { chromium } from 'playwright'

const PORT = process.env.AUDIT_PORT || '3000'
const BASIS = process.env.AUDIT_BASE || `http://localhost:${PORT}`
const PHASE = process.env.AUDIT_PHASE || 'after'
const EVIDENZ =
  process.env.AUDIT_EVIDENCE_DIR ||
  '/workspace/docs/evidence/v1-manual-planner-text-reflow-1'
const BERICHT = join(EVIDENZ, `audit-${PHASE}.json`)
const SCHLUESSEL = 'jetnity:reise:v3'
const SHA = execSync('git rev-parse HEAD', { encoding: 'utf8' }).trim()
const DIRTY = execSync('git status --porcelain', { encoding: 'utf8' })
  .split('\n')
  .map((zeile) => zeile.trim())
  .filter(Boolean)
const PRODUCT_TREE = {
  head: SHA,
  workingTree: DIRTY.length === 0 ? 'clean' : 'dirty',
  dirtyPaths: DIRTY,
}
const JETZT = new Date().toISOString()
const ZEIGER_NAME = 'Schritt für Schritt planen'
const IDEE_TITEL = 'Beginnen wir mit deiner Reise.'
const MANUELL_TITEL = 'Deine Reise Schritt für Schritt.'
const PREFILL_IDEE = 'Sieben Tage Lissabon'
const PREFILL_ZIEL = 'Lissabon'
const PREFILL_PFAD = `/planen?idee=${encodeURIComponent(PREFILL_IDEE)}&ziel=${encodeURIComponent(PREFILL_ZIEL)}`
const LANGER_WUNSCH =
  'Lokale Märkte, zwei ruhige Tage am Meer, keine Hotelwechsel und genug Zeit für lange Spaziergänge durch enge Gassen ohne Hetze.'

const VIEWPORTS = [
  { name: '360x800', width: 360, height: 800, hasTouch: true },
  { name: '390x844', width: 390, height: 844, hasTouch: true },
  { name: '1024x768', width: 1024, height: 768, hasTouch: false },
  { name: '1440x900', width: 1440, height: 900, hasTouch: false },
]

const GAST_REISE = {
  id: 'trip-manual-reflow-1',
  clientRef: 'trip-manual-reflow-1',
  title: 'Disposable gate draft',
  origin: 'Zürich',
  originPlaceId: 'geonames:2657896',
  startDate: '2026-10-12',
  endDate: '2026-10-16',
  travellers: 2,
  currency: 'CHF',
  budgetAmount: 2400,
  status: 'draft',
  pace: 'balanced',
  interests: ['culture'],
  travelWish: null,
  revision: 1,
  lastMutationId: null,
  stages: [
    {
      id: 'stage-1',
      position: 1,
      name: 'Lissabon',
      countryCode: 'PT',
      arrivalDate: '2026-10-12',
      departureDate: '2026-10-16',
      latitude: null,
      longitude: null,
      placeId: 'geonames:2267057',
    },
  ],
  days: [
    { id: 'day-1', stageId: 'stage-1', dayIndex: 1, dayDate: '2026-10-12', title: null, items: [] },
  ],
  ohneTag: [],
  createdAt: '2026-09-21T10:00:00.000Z',
  updatedAt: '2026-09-21T10:00:00.000Z',
}

function browserVersion(browser) {
  const name = browser.browserType().name()
  return `${name}/${browser.version()}`
}

async function serverErreichbar() {
  try {
    const antwort = await fetch(`${BASIS}/planen`, { redirect: 'manual' })
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

async function abfangen(page, protokoll) {
  const muster = [
    '**/api/**',
    '**/*.openai.com/**',
    '**/*.anthropic.com/**',
    '**/*.supabase.co/**',
    '**/functions/v1/**',
  ]
  for (const url of muster) {
    await page.route(url, async (route) => {
      protokoll.abgefangen.push({ method: route.request().method(), url: route.request().url() })
      await route.fulfill({
        status: 503,
        contentType: 'application/json',
        body: JSON.stringify({ ok: false, reason: 'audit-blocked', simulation: true }),
      })
    })
  }
  page.on('request', (req) => {
    const eintrag = { method: req.method(), url: req.url(), resourceType: req.resourceType() }
    protokoll.anfragen.push(eintrag)
    if (['POST', 'PUT', 'PATCH', 'DELETE'].includes(req.method())) {
      protokoll.schreiben.push(eintrag)
    }
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

function leeresProtokoll() {
  return { anfragen: [], schreiben: [], abgefangen: [] }
}

function schreibendAusserhalbNext(protokoll) {
  return protokoll.schreiben.filter((eintrag) => {
    const url = eintrag.url
    return !(
      url.includes('/_next/') ||
      url.includes('__nextjs') ||
      url.includes('/__turbopack')
    )
  })
}

async function kontext(browser, viewport, extras = {}) {
  return browser.newContext({
    viewport: { width: viewport.width, height: viewport.height },
    hasTouch: viewport.hasTouch,
    locale: 'de-CH',
    reducedMotion: extras.reducedMotion || null,
  })
}

async function seiteOeffnen(page, pfad, protokoll, gastReise = null) {
  if (gastReise) {
    await page.addInitScript(
      ({ schluessel, reise }) => {
        window.localStorage.setItem(schluessel, JSON.stringify(reise))
      },
      { schluessel: SCHLUESSEL, reise: gastReise },
    )
  } else {
    await page.addInitScript(() => {
      window.localStorage.removeItem('jetnity:reise:v3')
      window.localStorage.removeItem('jetnity:reisen-warteschlange:v3')
      window.localStorage.removeItem('jetnity:guest-trips:v2')
    })
  }
  await abfangen(page, protokoll)
  const antwort = await page.goto(`${BASIS}${pfad}`, { waitUntil: 'load', timeout: 60_000 })
  try {
    await hydrationWarten(page)
  } catch {
    // First paint is enough for overflow geometry.
  }
  await page.waitForTimeout(250)
  return antwort?.ok() ?? false
}

async function htmlSchrift(page, px) {
  if (!px) return
  await page.addStyleTag({ content: `html { font-size: ${px}px !important; }` })
  await page.waitForTimeout(200)
}

async function layoutLesen(page) {
  return page.evaluate(() => {
    const html = document.documentElement
    const body = document.body
    const stil = (el) => {
      if (!el) return null
      const r = el.getBoundingClientRect()
      const s = getComputedStyle(el)
      return {
        id: el.id || null,
        tag: el.tagName.toLowerCase(),
        className: String(el.className).slice(0, 220),
        text: (el instanceof HTMLElement ? el.innerText : '').trim().slice(0, 90),
        left: r.left,
        right: r.right,
        top: r.top,
        width: r.width,
        height: r.height,
        clientWidth: el.clientWidth,
        scrollWidth: el.scrollWidth,
        minWidth: s.minWidth,
        maxWidth: s.maxWidth,
        widthStyle: s.width,
        overflowX: s.overflowX,
        overflowWrap: s.overflowWrap,
        wordBreak: s.wordBreak,
        whiteSpace: s.whiteSpace,
        display: s.display,
        gridTemplateColumns: s.gridTemplateColumns,
        flexWrap: s.flexWrap,
        boxSizing: s.boxSizing,
        paddingLeft: s.paddingLeft,
        paddingRight: s.paddingRight,
        fontSize: s.fontSize,
      }
    }

    const scrollXBefore = window.scrollX
    const pageBefore = {
      clientWidth: html.clientWidth,
      scrollWidth: html.scrollWidth,
      overflow: html.scrollWidth - html.clientWidth,
      bodyOverflow: body.scrollWidth - body.clientWidth,
      scrollX: scrollXBefore,
      scrollY: window.scrollY,
    }

    window.scrollTo(0, window.scrollY)
    const scrollXAfterReset = window.scrollX

    const budget = document.getElementById('feld-budget')
    const start = document.getElementById('feld-start')
    const reisende = document.getElementById('feld-reisende')
    const ziel = document.getElementById('manuell-planen')
    const form = document.querySelector('#manuell-planen form')
    const plannerRoot = document.querySelector('#manuell-planen > div')
    const fieldGrid = form?.querySelector(':scope > div.grid')
    const budgetWrap = budget?.closest('div.grid')
    const budgetLabel = document.querySelector('label[for="feld-budget"]')
    const startLabel = document.querySelector('label[for="feld-start"]')
    const skip = document.querySelector('a[href="#public-content"]')
    const pointer = document.querySelector('a[href="#manuell-planen"]')
    const divider = [...document.querySelectorAll('span')].find((el) =>
      (el.textContent || '').includes('Oder Schritt'),
    )
    const submit = [...document.querySelectorAll('button')].find((el) =>
      (el.textContent || '').includes('Reise erstellen'),
    )
    const active = document.activeElement instanceof HTMLElement ? document.activeElement : null

    const offenders = [...document.querySelectorAll('*')]
      .map((el) => {
        const r = el.getBoundingClientRect()
        const overflowRight = r.right - html.clientWidth
        const overflowLeft = -r.left
        return {
          id: el.id || null,
          tag: el.tagName.toLowerCase(),
          className: String(el.className).slice(0, 160),
          text: (el instanceof HTMLElement ? el.innerText : '').trim().slice(0, 80),
          left: r.left,
          right: r.right,
          width: r.width,
          overflowRight,
          overflowLeft,
          overflow: Math.max(overflowRight, overflowLeft),
        }
      })
      .filter((eintrag) => eintrag.overflow > 0.5)
      .sort((a, b) => b.overflow - a.overflow)

    const skipLike = (eintrag) =>
      (eintrag.className || '').includes('sr-only') ||
      (eintrag.width <= 2 && eintrag.left < 0) ||
      eintrag.text === 'Zum Inhalt'

    return {
      scrollXBefore,
      scrollXAfterReset,
      pageBefore,
      pageAfterReset: {
        clientWidth: html.clientWidth,
        scrollWidth: html.scrollWidth,
        overflow: html.scrollWidth - html.clientWidth,
        bodyOverflow: body.scrollWidth - body.clientWidth,
        scrollX: scrollXAfterReset,
        scrollY: window.scrollY,
      },
      htmlFontSize: getComputedStyle(html).fontSize,
      boxes: {
        html: stil(html),
        body: stil(body),
        main: stil(document.querySelector('main')),
        header: stil(document.querySelector('header')),
        skip: stil(skip),
        pointer: stil(pointer),
        divider: stil(divider),
        ziel: stil(ziel),
        plannerRoot: stil(plannerRoot),
        form: stil(form),
        fieldGrid: stil(fieldGrid),
        budgetWrap: stil(budgetWrap),
        budgetLabel: stil(budgetLabel),
        budget: stil(budget),
        budgetParent: stil(budget?.parentElement || null),
        startLabel: stil(startLabel),
        start: stil(start),
        reisende: stil(reisende),
        submit: stil(submit),
        active: stil(active),
      },
      offenders: offenders.slice(0, 16),
      causalCandidates: offenders.filter((eintrag) => !skipLike(eintrag)).slice(0, 16),
      skipOffenders: offenders.filter(skipLike).slice(0, 4),
    }
  })
}

async function aktivLesen(page) {
  return page.evaluate(() => {
    const el = document.activeElement
    if (!(el instanceof HTMLElement)) return { tag: null, id: null, name: null, text: null }
    return {
      tag: el.tagName.toLowerCase(),
      id: el.id || null,
      name: el.getAttribute('name') || el.getAttribute('aria-label') || null,
      text: (el.innerText || el.textContent || '').trim().slice(0, 80),
    }
  })
}

async function speichern(page, name, extra, browser) {
  const pfad = join(EVIDENZ, 'screens', `${PHASE}_${name}.png`)
  mkdirSync(dirname(pfad), { recursive: true })
  await nextDevChromeVerbergen(page)
  await page.screenshot({ path: pfad, fullPage: false, animations: 'disabled' })
  const meta = {
    file: pfad,
    phase: PHASE,
    name,
    sha: SHA,
    productTree: PRODUCT_TREE,
    capturedAt: new Date().toISOString(),
    browser: browserVersion(browser),
    route: page.url(),
    viewport: page.viewportSize(),
    simulationClass: extra.simulationClass || 'synthetic-guest + intercepted-unavailable',
    actionSequence: extra.actionSequence || [],
    ...extra,
  }
  writeFileSync(`${pfad}.meta.json`, JSON.stringify(meta, null, 2))
  return meta
}

async function zustand(page, viewport, extras = {}) {
  const sicht = {
    zeiger: await page.getByRole('link', { name: ZEIGER_NAME }).count(),
    idee: await page.getByRole('heading', { name: IDEE_TITEL }).count(),
    manuell: await page.getByRole('heading', { name: MANUELL_TITEL }).count(),
    gate: await page.getByRole('heading', { name: 'Du hast bereits eine Reise.' }).count(),
    budget: await page.locator('#feld-budget').count(),
    active: await aktivLesen(page),
  }
  const layout = await layoutLesen(page)
  return { viewport: viewport.name, sicht, layout, ...extras }
}

async function szene(browser, viewport, { name, pfad = '/planen', schrift = null, gast = null, action, simulationClass, actionSequence }) {
  const ctx = await kontext(browser, viewport)
  const page = await ctx.newPage()
  const protokoll = leeresProtokoll()
  const ok = await seiteOeffnen(page, pfad, protokoll, gast)
  await htmlSchrift(page, schrift)
  const speicherVorher = await page.evaluate(() => ({ ...window.localStorage }))
  let extra = {}
  if (action) extra = (await action(page)) || {}
  const daten = await zustand(page, viewport, extra)
  const meta = await speichern(page, name, {
    state: name,
    ok,
    sicht: daten.sicht,
    layout: daten.layout,
    simulationClass,
    actionSequence,
    speicherNachherGleich:
      JSON.stringify(speicherVorher) === JSON.stringify(await page.evaluate(() => ({ ...window.localStorage }))),
    schreiben: schreibendAusserhalbNext(protokoll),
    abgefangen: protokoll.abgefangen,
    extra,
  }, browser)
  await ctx.close()
  return { name, viewport: viewport.name, ok, ...daten, meta, schreiben: schreibendAusserhalbNext(protokoll) }
}

async function pointerKlick(page) {
  await page.getByRole('link', { name: ZEIGER_NAME }).click()
  await page.waitForTimeout(400)
  return { active: await aktivLesen(page) }
}

async function budgetInSicht(page) {
  const budget = page.locator('#feld-budget')
  await budget.scrollIntoViewIfNeeded()
  await page.evaluate(() => window.scrollTo(0, window.scrollY))
  await page.waitForTimeout(120)
}

async function budgetFokus(page) {
  await page.getByRole('link', { name: ZEIGER_NAME }).click()
  await page.waitForTimeout(300)
  const budget = page.locator('#feld-budget')
  await budget.focus()
  await budgetInSicht(page)
  return { active: await aktivLesen(page) }
}

async function nachTab(page) {
  await page.getByRole('link', { name: ZEIGER_NAME }).click()
  await page.waitForTimeout(300)
  await page.locator('#feld-budget').focus()
  await page.keyboard.press('Tab')
  await budgetInSicht(page)
  return { active: await aktivLesen(page) }
}

async function tastaturZeiger(page) {
  const zeiger = page.getByRole('link', { name: ZEIGER_NAME })
  await zeiger.focus()
  const fokusVorher = await aktivLesen(page)
  await page.keyboard.press('Enter')
  await page.waitForTimeout(400)
  const fokusZiel = await aktivLesen(page)
  await page.keyboard.press('Tab')
  await page.waitForTimeout(150)
  const fokusDanach = await aktivLesen(page)
  return { fokusVorher, fokusZiel, fokusDanach }
}

async function validierung(page) {
  await page.getByRole('link', { name: ZEIGER_NAME }).click()
  await page.waitForTimeout(300)
  await page.locator('#feld-budget').fill('12.5')
  await page.locator('textarea').fill(LANGER_WUNSCH)
  await page.getByRole('button', { name: 'Reise erstellen' }).click()
  await page.waitForTimeout(250)
  const fehler = await page.evaluate(() =>
    [...document.querySelectorAll('[role="alert"], [role="status"]')].map((el) =>
      (el.textContent || '').trim().slice(0, 160),
    ),
  )
  const aria = await page.evaluate(() => {
    const ids = ['feld-ziel', 'feld-abreiseort', 'feld-start', 'feld-ende', 'feld-reisende', 'feld-budget']
    return ids.map((id) => {
      const el = document.getElementById(id)
      const label = document.querySelector(`label[for="${id}"]`)
      return {
        id,
        ariaInvalid: el?.getAttribute('aria-invalid') || null,
        describedBy: el?.getAttribute('aria-describedby') || null,
        label: (label?.textContent || '').trim(),
      }
    })
  })
  return { fehler, aria, active: await aktivLesen(page) }
}

function bewerten(ergebnis) {
  const fehler = []
  const phone200 = (ergebnis.szenen || []).filter((s) => s.name.includes('text-200'))
  if (PHASE === 'after') {
    for (const sz of phone200) {
      const overflow = sz.layout?.pageAfterReset?.overflow ?? 99
      if (overflow > 1) {
        fehler.push(`${sz.name}: page overflow after scrollX reset is ${overflow}`)
      }
    }
    const normalPhones = (ergebnis.szenen || []).filter((s) =>
      /normal-(360|390)/.test(s.name),
    )
    for (const sz of normalPhones) {
      const overflow = sz.layout?.pageAfterReset?.overflow ?? 99
      if (overflow > 1) fehler.push(`${sz.name}: unexpected overflow ${overflow}`)
    }
    if (ergebnis.tastatur) {
      if (ergebnis.tastatur.extra?.fokusZiel?.id !== 'manuell-planen') {
        fehler.push(`keyboard: target was not focused (${JSON.stringify(ergebnis.tastatur.extra?.fokusZiel)})`)
      }
    }
    if (ergebnis.validierung) {
      if (!(ergebnis.validierung.extra?.fehler || []).length) {
        fehler.push('validation: no client errors after invalid submit')
      }
      if ((ergebnis.validierung.schreiben || []).length) {
        fehler.push(`validation: unexpected writes ${JSON.stringify(ergebnis.validierung.schreiben)}`)
      }
    }
    if (ergebnis.gate) {
      if (!ergebnis.gate.sicht?.gate) fehler.push('gate: existing-trip heading missing')
      if (ergebnis.gate.sicht?.budget) fehler.push('gate: planner still present')
    }
    if (ergebnis.prefill) {
      const werte = ergebnis.prefill.extra?.werte
      if (werte?.idee !== PREFILL_IDEE) fehler.push(`prefill idea ${JSON.stringify(werte?.idee)}`)
      if (werte?.ziel !== PREFILL_ZIEL) fehler.push(`prefill ziel ${JSON.stringify(werte?.ziel)}`)
    }
  } else {
    const residual = (ergebnis.szenen || []).find((s) => s.name === 'text-200_390x844_budget')
    if (!residual) fehler.push('before: missing 390 200% budget residual scene')
    else if ((residual.layout?.pageAfterReset?.overflow ?? 0) < 1) {
      fehler.push('before: expected residual overflow was not reproduced after scrollX reset')
    }
  }
  return fehler
}

async function main() {
  mkdirSync(join(EVIDENZ, 'screens'), { recursive: true })
  const server = await serverStarten()
  const browser = await chromium.launch({ headless: true })
  const phone390 = VIEWPORTS[1]
  const phone360 = VIEWPORTS[0]
  const desk1024 = VIEWPORTS[2]
  const desk1440 = VIEWPORTS[3]
  const szenen = []

  if (PHASE === 'before') {
    szenen.push(
      await szene(browser, phone390, {
        name: 'text-200_390x844_initial',
        schrift: 32,
        simulationClass: 'synthetic-guest + intercepted-unavailable + html-font-size-32px',
        actionSequence: ['goto /planen', 'set html font-size 32px', 'measure at scrollY0', 'reset scrollX'],
      }),
    )
    szenen.push(
      await szene(browser, phone390, {
        name: 'text-200_390x844_pointer',
        schrift: 32,
        action: pointerKlick,
        simulationClass: 'synthetic-guest + intercepted-unavailable + html-font-size-32px',
        actionSequence: [
          'goto /planen',
          'set html font-size 32px',
          'click Schritt für Schritt planen',
          'reset scrollX',
        ],
      }),
    )
    szenen.push(
      await szene(browser, phone390, {
        name: 'text-200_390x844_budget',
        schrift: 32,
        action: budgetFokus,
        simulationClass: 'synthetic-guest + intercepted-unavailable + html-font-size-32px',
        actionSequence: [
          'goto /planen',
          'set html font-size 32px',
          'click pointer',
          'focus #feld-budget',
          'scrollIntoView',
          'reset scrollX',
        ],
      }),
    )
    szenen.push(
      await szene(browser, phone390, {
        name: 'text-200_390x844_tab',
        schrift: 32,
        action: nachTab,
        simulationClass: 'synthetic-guest + intercepted-unavailable + html-font-size-32px',
        actionSequence: [
          'goto /planen',
          'set html font-size 32px',
          'click pointer',
          'focus #feld-budget',
          'Tab',
          'scrollIntoView',
          'reset scrollX',
        ],
      }),
    )
  } else {
    for (const [viewport, schrift, label] of [
      [phone360, null, 'normal-360x800'],
      [phone390, null, 'normal-390x844'],
      [phone360, 32, 'text-200-360x800'],
      [phone390, 32, 'text-200-390x844'],
      [desk1024, null, 'normal-1024x768'],
      [desk1440, null, 'normal-1440x900'],
    ]) {
      szenen.push(
        await szene(browser, viewport, {
          name: `${label}_initial`,
          schrift,
          simulationClass: schrift
            ? 'synthetic-guest + intercepted-unavailable + html-font-size-32px'
            : 'synthetic-guest + intercepted-unavailable',
          actionSequence: ['goto /planen', schrift ? 'set html font-size 32px' : 'default root font', 'reset scrollX'],
        }),
      )
    }
    szenen.push(
      await szene(browser, phone360, {
        name: 'text-200_360x800_budget',
        schrift: 32,
        action: budgetFokus,
        simulationClass: 'synthetic-guest + intercepted-unavailable + html-font-size-32px',
        actionSequence: [
          'goto /planen',
          'set html font-size 32px',
          'click pointer',
          'focus #feld-budget',
          'scrollIntoView',
          'reset scrollX',
        ],
      }),
    )
    szenen.push(
      await szene(browser, phone390, {
        name: 'text-200_390x844_pointer',
        schrift: 32,
        action: pointerKlick,
        simulationClass: 'synthetic-guest + intercepted-unavailable + html-font-size-32px',
        actionSequence: ['goto /planen', 'set html font-size 32px', 'click pointer', 'reset scrollX'],
      }),
    )
    szenen.push(
      await szene(browser, phone390, {
        name: 'text-200_390x844_budget',
        schrift: 32,
        action: budgetFokus,
        simulationClass: 'synthetic-guest + intercepted-unavailable + html-font-size-32px',
        actionSequence: [
          'goto /planen',
          'set html font-size 32px',
          'click pointer',
          'focus #feld-budget',
          'scrollIntoView',
          'reset scrollX',
        ],
      }),
    )
    szenen.push(
      await szene(browser, phone390, {
        name: 'text-200_390x844_tab',
        schrift: 32,
        action: nachTab,
        simulationClass: 'synthetic-guest + intercepted-unavailable + html-font-size-32px',
        actionSequence: [
          'goto /planen',
          'set html font-size 32px',
          'click pointer',
          'focus budget',
          'Tab',
          'scrollIntoView',
          'reset scrollX',
        ],
      }),
    )
  }

  const tastatur =
    PHASE === 'after'
      ? await szene(browser, phone390, {
          name: 'keyboard_390x844',
          action: tastaturZeiger,
          simulationClass: 'synthetic-guest + intercepted-unavailable',
          actionSequence: ['goto /planen', 'focus pointer', 'Enter', 'Tab'],
        })
      : null
  const validierungSzene =
    PHASE === 'after'
      ? await szene(browser, phone390, {
          name: 'validation_390x844',
          action: validierung,
          simulationClass: 'synthetic-guest + intercepted-unavailable + invalid-local-submit',
          actionSequence: [
            'goto /planen',
            'click pointer',
            'fill budget 12.5',
            'fill long wish',
            'click Reise erstellen',
            'no network submit',
          ],
        })
      : null
  const gate =
    PHASE === 'after'
      ? await szene(browser, phone390, {
          name: 'blocked-guest_390x844',
          gast: GAST_REISE,
          simulationClass: 'synthetic-guest-active-trip + intercepted-unavailable',
          actionSequence: ['seed disposable guest trip', 'goto /planen'],
        })
      : null
  const prefill =
    PHASE === 'after'
      ? await szene(browser, phone390, {
          name: 'prefill_390x844',
          pfad: PREFILL_PFAD,
          action: async (page) => ({
            werte: await page.evaluate(() => {
              const idee = document.querySelector('textarea')
              const ziel = document.getElementById('feld-ziel')
              return {
                idee: idee instanceof HTMLTextAreaElement ? idee.value : null,
                ziel: ziel instanceof HTMLInputElement ? ziel.value : null,
              }
            }),
          }),
          simulationClass: 'synthetic-guest + intercepted-unavailable + query-prefill',
          actionSequence: ['goto /planen?idee&ziel', 'read prefill', 'no submit'],
        })
      : null

  if (tastatur) szenen.push(tastatur)
  if (validierungSzene) szenen.push(validierungSzene)
  if (gate) szenen.push(gate)
  if (prefill) szenen.push(prefill)

  const ergebnis = {
    phase: PHASE,
    capturedAt: JETZT,
    productTree: PRODUCT_TREE,
    basis: BASIS,
    browser: browserVersion(browser),
    simulationClass: 'synthetic-guest + intercepted-unavailable',
    limits: [
      'local Chromium/Playwright, not hardware/Safari/OS text-only zoom',
      '200% text uses html { font-size: 32px }, not a claim of WCAG or device zoom',
      'provider/model/search routes intercepted as unavailable',
      'disposable synthetic browser data only; no real account/trip mutation',
      'Next.js dev portal is hidden at screenshot time; it is not product UI',
      'negative sr-only skip-link bounds are recorded but not treated as a skip-link defect',
    ],
    szenen: szenen.map((sz) => ({
      name: sz.name,
      viewport: sz.viewport,
      ok: sz.ok,
      sicht: sz.sicht,
      layout: sz.layout,
      extra: sz.extra,
      schreiben: sz.schreiben,
      meta: sz.meta,
    })),
    tastatur,
    validierung: validierungSzene,
    gate,
    prefill,
  }

  const fehler = bewerten(ergebnis)
  ergebnis.ok = fehler.length === 0
  ergebnis.fehler = fehler
  writeFileSync(BERICHT, JSON.stringify(ergebnis, null, 2))
  await browser.close()
  if (server.kind) server.kind.kill()
  const residual = szenen.find((s) => s.name.includes('text-200_390x844_budget') || s.name.includes('text-200-390x844'))
  console.log(
    JSON.stringify(
      {
        ok: ergebnis.ok,
        phase: PHASE,
        bericht: BERICHT,
        productTree: PRODUCT_TREE,
        fehler,
        residual: residual
          ? {
              name: residual.name,
              pageBefore: residual.layout?.pageBefore,
              pageAfterReset: residual.layout?.pageAfterReset,
              budget: residual.layout?.boxes?.budget,
              budgetLabel: residual.layout?.boxes?.budgetLabel,
              form: residual.layout?.boxes?.form,
              fieldGrid: residual.layout?.boxes?.fieldGrid,
              causal: residual.layout?.causalCandidates?.slice(0, 6),
            }
          : null,
      },
      null,
      2,
    ),
  )
  if (!ergebnis.ok) process.exit(1)
}

main().catch((fehler) => {
  console.error(fehler)
  process.exit(1)
})
