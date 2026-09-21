#!/usr/bin/env node
// scripts/v1-manual-planning-entry-1-audit.mjs
//
// Disposable local Chromium evidence for V1 Manual Planning Entry 1.
// Uses the compiled Next app and real product CSS. Synthetic guest only.
// Provider/model/search routes and unexpected write POSTs are intercepted.
//
// PHASE=before captures the current first-screen without requiring the pointer.
// PHASE=after proves discoverability, destination/focus, guest gate, prefill,
// no submit/draft mutation, reduced-motion and 200% text reflow.

import { execSync, spawn } from 'node:child_process'
import { mkdirSync, writeFileSync } from 'node:fs'
import { dirname, join } from 'node:path'
import { chromium } from 'playwright'

const PORT = process.env.AUDIT_PORT || '3000'
const BASIS = process.env.AUDIT_BASE || `http://localhost:${PORT}`
const PHASE = process.env.AUDIT_PHASE || 'after'
const EVIDENZ =
  process.env.AUDIT_EVIDENCE_DIR ||
  '/workspace/docs/evidence/v1-manual-planning-entry-1'
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
const ZIEL_ID = 'manuell-planen'
const ZEIGER_NAME = 'Schritt für Schritt planen'
const IDEE_TITEL = 'Beginnen wir mit deiner Reise.'
const MANUELL_TITEL = 'Deine Reise Schritt für Schritt.'
const PREFILL_IDEE = 'Sieben Tage Lissabon'
const PREFILL_ZIEL = 'Lissabon'
const PREFILL_PFAD = `/planen?idee=${encodeURIComponent(PREFILL_IDEE)}&ziel=${encodeURIComponent(PREFILL_ZIEL)}`

const VIEWPORTS = [
  { name: '360x800', width: 360, height: 800, hasTouch: true },
  { name: '390x844', width: 390, height: 844, hasTouch: true },
  { name: '1024x768', width: 1024, height: 768, hasTouch: false },
]

const GAST_REISE = {
  id: 'trip-manual-entry-1',
  clientRef: 'trip-manual-entry-1',
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
    { id: 'day-2', stageId: 'stage-1', dayIndex: 2, dayDate: '2026-10-13', title: null, items: [] },
    { id: 'day-3', stageId: 'stage-1', dayIndex: 3, dayDate: '2026-10-14', title: null, items: [] },
    { id: 'day-4', stageId: 'stage-1', dayIndex: 4, dayDate: '2026-10-15', title: null, items: [] },
    { id: 'day-5', stageId: 'stage-1', dayIndex: 5, dayDate: '2026-10-16', title: null, items: [] },
  ],
  ohneTag: [],
  createdAt: '2026-09-21T10:00:00.000Z',
  updatedAt: '2026-09-21T10:00:00.000Z',
}

function imViewport(box, hoehe, breite = Infinity) {
  if (!box) return false
  return box.y >= 0 && box.y + Math.min(box.height, 8) <= hoehe && box.x + 1 < breite
}

function sichtTeil(box, hoehe) {
  if (!box) return false
  return box.y < hoehe && box.y + box.height > 0
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

async function overflowLesen(page) {
  return page.evaluate(() => ({
    html: document.documentElement.scrollWidth - document.documentElement.clientWidth,
    body: document.body.scrollWidth - document.body.clientWidth,
    scrollY: window.scrollY,
    scrollHeight: document.documentElement.scrollHeight,
  }))
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

async function sichtbarkeit(page, viewport) {
  const zeiger = page.getByRole('link', { name: ZEIGER_NAME })
  const idee = page.getByRole('heading', { name: IDEE_TITEL })
  const manuell = page.getByRole('heading', { name: MANUELL_TITEL })
  const ziel = page.locator(`#${ZIEL_ID}`)
  const gate = page.getByRole('heading', { name: 'Du hast bereits eine Reise.' })
  const boxes = {
    zeiger: (await zeiger.count()) ? await zeiger.boundingBox() : null,
    idee: (await idee.count()) ? await idee.boundingBox() : null,
    manuell: (await manuell.count()) ? await manuell.boundingBox() : null,
    ziel: (await ziel.count()) ? await ziel.boundingBox() : null,
    gate: (await gate.count()) ? await gate.boundingBox() : null,
  }
  return {
    boxes,
    zeigerVorhanden: (await zeiger.count()) > 0,
    zielVorhanden: (await ziel.count()) > 0,
    ideeVorhanden: (await idee.count()) > 0,
    manuellVorhanden: (await manuell.count()) > 0,
    gateVorhanden: (await gate.count()) > 0,
    zeigerSichtbar: imViewport(boxes.zeiger, viewport.height, viewport.width),
    ideeSichtbar: sichtTeil(boxes.idee, viewport.height),
    manuellSichtbar: imViewport(boxes.manuell, viewport.height, viewport.width),
    overflow: await overflowLesen(page),
    activeElement: await aktivLesen(page),
  }
}

async function nextDevChromeVerbergen(page) {
  await page.addStyleTag({
    content:
      'nextjs-portal, [data-next-badge-root], [data-nextjs-toast] { display: none !important; }',
  })
}

async function speichern(page, name, extra) {
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
    browser: 'chromium/playwright',
    route: page.url(),
    viewport: page.viewportSize(),
    simulationClass: 'synthetic-guest + intercepted-unavailable',
    ...extra,
  }
  writeFileSync(`${pfad}.meta.json`, JSON.stringify(meta, null, 2))
  return meta
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
    // First-screen visibility does not require hydrated client JS.
  }
  await page.waitForTimeout(250)
  return antwort?.ok() ?? false
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

async function firstScreen(browser, viewport) {
  const ctx = await kontext(browser, viewport)
  const page = await ctx.newPage()
  const protokoll = leeresProtokoll()
  const ok = await seiteOeffnen(page, '/planen', protokoll)
  const sicht = await sichtbarkeit(page, viewport)
  const meta = await speichern(page, `initial_${viewport.name}`, {
    state: 'scrollY0-no-active-trip',
    sicht,
    ok,
  })
  await ctx.close()
  return { viewport: viewport.name, ok, sicht, meta }
}

async function klickZiel(browser, viewport) {
  const ctx = await kontext(browser, viewport)
  const page = await ctx.newPage()
  const protokoll = leeresProtokoll()
  await seiteOeffnen(page, '/planen', protokoll)
  const speicherVorher = await page.evaluate(() => ({ ...window.localStorage }))
  const zeiger = page.getByRole('link', { name: ZEIGER_NAME })
  await zeiger.click()
  await page.waitForTimeout(500)
  const sicht = await sichtbarkeit(page, viewport)
  const speicherNachher = await page.evaluate(() => ({ ...window.localStorage }))
  const meta = await speichern(page, `click_${viewport.name}`, {
    state: 'after-pointer-click',
    sicht,
    speicherUnveraendert: JSON.stringify(speicherVorher) === JSON.stringify(speicherNachher),
    schreiben: schreibendAusserhalbNext(protokoll),
  })
  await ctx.close()
  return { viewport: viewport.name, sicht, meta }
}

async function tastaturZiel(browser) {
  const viewport = { name: '390x844', width: 390, height: 844, hasTouch: true }
  const ctx = await kontext(browser, viewport)
  const page = await ctx.newPage()
  const protokoll = leeresProtokoll()
  await seiteOeffnen(page, '/planen', protokoll)
  const zeiger = page.getByRole('link', { name: ZEIGER_NAME })
  await zeiger.focus()
  const fokusVorher = await aktivLesen(page)
  await page.keyboard.press('Enter')
  await page.waitForTimeout(500)
  const fokusZiel = await aktivLesen(page)
  await page.keyboard.press('Tab')
  await page.waitForTimeout(150)
  const fokusDanach = await aktivLesen(page)
  const sicht = await sichtbarkeit(page, viewport)
  const meta = await speichern(page, 'keyboard_390x844', {
    state: 'after-pointer-enter-then-tab',
    fokusVorher,
    fokusZiel,
    fokusDanach,
    sicht,
  })
  await ctx.close()
  return { fokusVorher, fokusZiel, fokusDanach, sicht, meta }
}

async function gateZustand(browser) {
  const viewport = { name: '390x844', width: 390, height: 844, hasTouch: true }
  const ctx = await kontext(browser, viewport)
  const page = await ctx.newPage()
  const protokoll = leeresProtokoll()
  await seiteOeffnen(page, '/planen', protokoll, GAST_REISE)
  const sicht = await sichtbarkeit(page, viewport)
  const links = {
    fortsetzen: (await page.getByRole('link', { name: 'Reise fortsetzen' }).count()) > 0,
    konto: (await page.getByRole('link', { name: 'Konto erstellen' }).count()) > 0,
    anmelden: (await page.getByRole('link', { name: 'Anmelden' }).count()) > 0,
  }
  const meta = await speichern(page, 'blocked-guest_390x844', {
    state: 'synthetic-active-guest-gate',
    sicht,
    links,
  })
  await ctx.close()
  return { sicht, links, meta }
}

async function prefillZustand(browser) {
  const viewport = { name: '390x844', width: 390, height: 844, hasTouch: true }
  const ctx = await kontext(browser, viewport)
  const page = await ctx.newPage()
  const protokoll = leeresProtokoll()
  await seiteOeffnen(page, PREFILL_PFAD, protokoll)
  const werte = await page.evaluate(() => {
    const idee = document.querySelector('textarea')
    const ziel = document.getElementById('feld-ziel')
    return {
      idee: idee instanceof HTMLTextAreaElement ? idee.value : null,
      ziel: ziel instanceof HTMLInputElement ? ziel.value : null,
    }
  })
  const sicht = await sichtbarkeit(page, viewport)
  const meta = await speichern(page, 'prefill_390x844', {
    state: 'query-prefill-no-submit',
    werte,
    sicht,
    schreiben: schreibendAusserhalbNext(protokoll),
  })
  await ctx.close()
  return { werte, sicht, meta }
}

async function reducedMotion(browser) {
  const viewport = { name: '390x844', width: 390, height: 844, hasTouch: true }
  const ctx = await kontext(browser, viewport, { reducedMotion: 'reduce' })
  const page = await ctx.newPage()
  const protokoll = leeresProtokoll()
  await seiteOeffnen(page, '/planen', protokoll)
  await page.emulateMedia({ reducedMotion: 'reduce' })
  const vor = await overflowLesen(page)
  await page.getByRole('link', { name: ZEIGER_NAME }).click()
  await page.waitForTimeout(80)
  const nach = await overflowLesen(page)
  const sicht = await sichtbarkeit(page, viewport)
  const meta = await speichern(page, 'reduced-motion_390x844', {
    state: 'pointer-click-reduced-motion',
    vor,
    nach,
    sicht,
  })
  await ctx.close()
  return { vor, nach, sicht, meta }
}

async function textReflow(browser) {
  const viewport = { name: '390x844', width: 390, height: 844, hasTouch: true }
  const ctx = await kontext(browser, viewport)
  const page = await ctx.newPage()
  const protokoll = leeresProtokoll()
  await seiteOeffnen(page, '/planen', protokoll)
  await page.addStyleTag({ content: 'html { font-size: 32px !important; }' })
  await page.waitForTimeout(200)
  const sicht = await sichtbarkeit(page, viewport)
  const overflowQuellen = await page.evaluate(() => {
    const limit = document.documentElement.clientWidth
    return [...document.querySelectorAll('*')]
      .map((el) => {
        const r = el.getBoundingClientRect()
        return {
          id: el.id || null,
          text: (el instanceof HTMLElement ? el.innerText : '').trim().slice(0, 80),
          overflow: Math.max(r.right - limit, -r.left),
        }
      })
      .filter((eintrag) => eintrag.overflow > 1)
      .sort((a, b) => b.overflow - a.overflow)
      .slice(0, 8)
  })
  const zeigerBox = sicht.boxes.zeiger
  const zeigerOverflow = zeigerBox ? zeigerBox.x + zeigerBox.width - viewport.width : 0
  const meta = await speichern(page, 'text-200_390x844', {
    state: '200-percent-text-reflow',
    sicht,
    overflowQuellen,
    zeigerOverflow,
  })
  await ctx.close()
  return { sicht, overflowQuellen, zeigerOverflow, meta }
}

async function desktop(browser) {
  const viewport = VIEWPORTS.find((v) => v.name === '1024x768')
  const ctx = await kontext(browser, viewport)
  const page = await ctx.newPage()
  const protokoll = leeresProtokoll()
  await seiteOeffnen(page, '/planen', protokoll)
  const sicht = await sichtbarkeit(page, viewport)
  const meta = await speichern(page, 'initial_1024x768', {
    state: 'scrollY0-desktop',
    sicht,
  })
  await ctx.close()
  return { sicht, meta }
}

function bewerten(ergebnis) {
  const fehler = []
  if (PHASE === 'before') {
    for (const shot of ergebnis.firstScreens) {
      if (!shot.sicht.ideeSichtbar) {
        fehler.push(`${shot.viewport}: idea heading not visible at scrollY0`)
      }
      if (shot.sicht.zeigerVorhanden) {
        fehler.push(`${shot.viewport}: pointer unexpectedly present in before phase`)
      }
    }
    return fehler
  }

  for (const shot of ergebnis.firstScreens) {
    if (!shot.sicht.zeigerSichtbar) {
      fehler.push(`${shot.viewport}: pointer not visible at scrollY0`)
    }
    if (!shot.sicht.ideeSichtbar) {
      fehler.push(`${shot.viewport}: idea-first heading displaced off first screen`)
    }
    if (shot.sicht.overflow.html > 1 || shot.sicht.overflow.body > 1) {
      fehler.push(`${shot.viewport}: horizontal overflow ${JSON.stringify(shot.sicht.overflow)}`)
    }
    if (shot.sicht.overflow.scrollY !== 0) {
      fehler.push(`${shot.viewport}: initial scrollY was ${shot.sicht.overflow.scrollY}`)
    }
  }

  if (!ergebnis.klick.sicht.zielVorhanden) fehler.push('click: target missing')
  if (ergebnis.klick.sicht.overflow.scrollY < 40) {
    fehler.push(`click: did not leave first screen (scrollY=${ergebnis.klick.sicht.overflow.scrollY})`)
  }
  if (ergebnis.klick.sicht.activeElement.id !== ZIEL_ID && ergebnis.klick.sicht.activeElement.tag === 'body') {
    fehler.push(`click: focus lost to body (${JSON.stringify(ergebnis.klick.sicht.activeElement)})`)
  }
  if (!ergebnis.klick.meta.speicherUnveraendert) fehler.push('click: localStorage mutated')
  if (ergebnis.klick.meta.schreiben.length) {
    fehler.push(`click: unexpected write requests ${JSON.stringify(ergebnis.klick.meta.schreiben)}`)
  }

  if (ergebnis.tastatur.fokusZiel.id !== ZIEL_ID) {
    fehler.push(`keyboard: target was not focused (${JSON.stringify(ergebnis.tastatur.fokusZiel)})`)
  }
  if (!ergebnis.tastatur.fokusDanach.id && !ergebnis.tastatur.fokusDanach.name) {
    fehler.push(`keyboard: Tab after target lost focus (${JSON.stringify(ergebnis.tastatur.fokusDanach)})`)
  }
  if (ergebnis.tastatur.fokusDanach.id === ZIEL_ID || ergebnis.tastatur.fokusDanach.tag === 'body') {
    fehler.push(`keyboard: Tab did not enter manual controls (${JSON.stringify(ergebnis.tastatur.fokusDanach)})`)
  }
  if (ergebnis.tastatur.fokusDanach.tag === 'footer' || /footer/i.test(ergebnis.tastatur.fokusDanach.text || '')) {
    fehler.push('keyboard: Tab jumped to footer')
  }

  if (ergebnis.gate.sicht.zeigerVorhanden) fehler.push('gate: pointer still present')
  if (ergebnis.gate.sicht.zielVorhanden) fehler.push('gate: dangling target present')
  if (ergebnis.gate.sicht.ideeVorhanden || ergebnis.gate.sicht.manuellVorhanden) {
    fehler.push('gate: planner forms still present')
  }
  if (!ergebnis.gate.sicht.gateVorhanden) fehler.push('gate: existing-trip heading missing')
  if (!ergebnis.gate.links.fortsetzen || !ergebnis.gate.links.konto || !ergebnis.gate.links.anmelden) {
    fehler.push(`gate: continue/account links missing ${JSON.stringify(ergebnis.gate.links)}`)
  }

  if (ergebnis.prefill.werte.idee !== PREFILL_IDEE) {
    fehler.push(`prefill: idea ${JSON.stringify(ergebnis.prefill.werte.idee)}`)
  }
  if (ergebnis.prefill.werte.ziel !== PREFILL_ZIEL) {
    fehler.push(`prefill: destination ${JSON.stringify(ergebnis.prefill.werte.ziel)}`)
  }

  if (ergebnis.motion.nach.scrollY < 40) {
    fehler.push(`reduced-motion: no useful scroll (${ergebnis.motion.nach.scrollY})`)
  }
  if (ergebnis.reflow.zeigerOverflow > 1) {
    fehler.push(`200% text: pointer overflows by ${ergebnis.reflow.zeigerOverflow}px`)
  }
  const eigeneOverflows = (ergebnis.reflow.overflowQuellen || []).filter((quelle) => {
    const text = quelle.text || ''
    return (
      text.includes('Schritt für Schritt planen') ||
      text.includes('Lieber selbst ausfüllen') ||
      quelle.id === ZIEL_ID
    )
  })
  if (eigeneOverflows.length) {
    fehler.push(`200% text: pointer/target overflow ${JSON.stringify(eigeneOverflows)}`)
  }

  return fehler
}

async function overflowMessen(page) {
  return page.evaluate(() => {
    const html = document.documentElement
    const body = document.body
    const limit = html.clientWidth
    const offenders = [...document.querySelectorAll('*')]
      .map((el) => {
        const r = el.getBoundingClientRect()
        return {
          id: el.id || null,
          tag: el.tagName.toLowerCase(),
          className: String(el.className).slice(0, 160),
          text: (el instanceof HTMLElement ? el.innerText : '').trim().slice(0, 80),
          left: r.left,
          right: r.right,
          width: r.width,
          overflow: Math.max(r.right - limit, -r.left),
        }
      })
      .filter((eintrag) => eintrag.overflow > 1)
      .sort((a, b) => b.overflow - a.overflow)
      .slice(0, 8)

    const budget = document.getElementById('feld-budget')
    const budgetLabel = document.querySelector('label[for="feld-budget"], label:has(#feld-budget)')
    const planner = document.querySelector('#manuell-planen, form')
    const box = (el) => {
      if (!el) return null
      const r = el.getBoundingClientRect()
      return { left: r.left, right: r.right, width: r.width, top: r.top }
    }

    return {
      clientWidth: limit,
      scrollWidth: html.scrollWidth,
      pageOverflow: html.scrollWidth - html.clientWidth,
      htmlOverflow: html.scrollWidth - html.clientWidth,
      bodyOverflow: body.scrollWidth - body.clientWidth,
      offenders,
      budget: box(budget),
      budgetLabel: box(budgetLabel),
      planner: box(planner),
    }
  })
}

async function vergleich200(browser, basis, name, sha) {
  const viewport = { name: '390x844', width: 390, height: 844, hasTouch: true }
  const ctx = await kontext(browser, viewport)
  const page = await ctx.newPage()
  const protokoll = leeresProtokoll()
  const vorher = BASIS
  process.env.AUDIT_BASE = basis
  await page.addInitScript(() => {
    window.localStorage.removeItem('jetnity:reise:v3')
    window.localStorage.removeItem('jetnity:reisen-warteschlange:v3')
    window.localStorage.removeItem('jetnity:guest-trips:v2')
  })
  await abfangen(page, protokoll)
  const antwort = await page.goto(`${basis}/planen`, { waitUntil: 'load', timeout: 60_000 })
  try {
    await hydrationWarten(page)
  } catch {
    // overflow measurement does not require hydrated client JS
  }
  await page.addStyleTag({ content: 'html { font-size: 32px !important; }' })
  await page.waitForTimeout(250)
  const budget = page.locator('#feld-budget')
  if ((await budget.count()) > 0) {
    await budget.scrollIntoViewIfNeeded()
    await page.waitForTimeout(150)
  }
  const messung = await overflowMessen(page)
  const pfad = join(EVIDENZ, 'screens', `compare200_${name}_390x844.png`)
  mkdirSync(dirname(pfad), { recursive: true })
  await nextDevChromeVerbergen(page)
  await page.screenshot({ path: pfad, fullPage: false, animations: 'disabled' })
  const meta = {
    file: pfad,
    phase: 'compare-200',
    name,
    sha,
    capturedAt: new Date().toISOString(),
    browser: 'chromium/playwright',
    route: `${basis}/planen`,
    viewport: { width: 390, height: 844 },
    simulationClass: 'synthetic-guest + intercepted-unavailable + html-font-size-32px',
    actionSequence: ['goto /planen', 'set html font-size 32px', 'scroll #feld-budget into view'],
    messung,
  }
  writeFileSync(`${pfad}.meta.json`, JSON.stringify(meta, null, 2))
  process.env.AUDIT_BASE = vorher
  await ctx.close()
  return { ok: antwort?.ok() ?? false, messung, meta }
}

async function main() {
  mkdirSync(join(EVIDENZ, 'screens'), { recursive: true })
  if (PHASE === 'compare-200') {
    const baseline = process.env.AUDIT_BASELINE || 'http://localhost:3001'
    const current = BASIS
    const baselineSha = process.env.AUDIT_BASELINE_SHA || '1103407ba2a9e5fa76f4a8e588ab210934b955e3'
    const currentSha = process.env.AUDIT_CURRENT_SHA || SHA
    const browser = await chromium.launch({ headless: true })
    const vorher = await vergleich200(browser, baseline, 'baseline', baselineSha)
    const nachher = await vergleich200(browser, current, 'current', currentSha)
    await browser.close()
    const delta = {
      pageOverflow: nachher.messung.pageOverflow - vorher.messung.pageOverflow,
      budgetRight: (nachher.messung.budget?.right ?? 0) - (vorher.messung.budget?.right ?? 0),
      budgetWidth: (nachher.messung.budget?.width ?? 0) - (vorher.messung.budget?.width ?? 0),
      budgetLabelRight:
        (nachher.messung.budgetLabel?.right ?? 0) - (vorher.messung.budgetLabel?.right ?? 0),
    }
    const worsened = delta.pageOverflow > 0.5 || delta.budgetRight > 0.5
    const bericht = {
      phase: 'compare-200',
      capturedAt: JETZT,
      productTree: PRODUCT_TREE,
      baseline: { sha: baselineSha, basis: baseline, ...vorher },
      current: { sha: currentSha, basis: current, ...nachher },
      delta,
      worsened,
      sameResidual:
        vorher.messung.offenders[0]?.id === nachher.messung.offenders[0]?.id ||
        (vorher.messung.offenders[0]?.text || '').includes('Gesamtbudget'),
      limits: [
        'local Chromium/Playwright, not hardware/Safari',
        '200% text uses html font-size 32px, not OS text-only zoom',
        'baseline served from worktree 1103407b; current from this checkout',
        'no general recapture; this is the matched 200% overflow comparison only',
      ],
    }
    writeFileSync(join(EVIDENZ, 'audit-compare-200.json'), JSON.stringify(bericht, null, 2))
    if (!vorher.ok || !nachher.ok) {
      console.error(JSON.stringify({ ok: false, reason: 'route-failed', bericht }, null, 2))
      process.exit(1)
    }
    console.log(
      JSON.stringify(
        {
          ok: true,
          phase: 'compare-200',
          worsened,
          delta,
          baselineOverflow: vorher.messung.pageOverflow,
          currentOverflow: nachher.messung.pageOverflow,
          baselineTop: vorher.messung.offenders[0],
          currentTop: nachher.messung.offenders[0],
        },
        null,
        2,
      ),
    )
    return
  }

  const server = await serverStarten()
  const browser = await chromium.launch({ headless: true })
  const firstScreens = []
  for (const viewport of VIEWPORTS.filter((v) => v.name !== '1024x768' || PHASE === 'before')) {
    firstScreens.push(await firstScreen(browser, viewport))
  }

  const ergebnis = {
    phase: PHASE,
    capturedAt: JETZT,
    productTree: PRODUCT_TREE,
    basis: BASIS,
    simulationClass: 'synthetic-guest + intercepted-unavailable',
    limits: [
      'local Chromium/Playwright, not hardware/Safari',
      'no live authenticated account',
      'provider/model/search routes intercepted as unavailable',
      'guest gate uses disposable synthetic localStorage only',
      '200% text uses html font-size 32px, not hardware browser text-only zoom',
      'Next.js dev portal is hidden at screenshot time; it is not product UI',
      'existing TripPlanner 200% budget-label overflow is recorded residual; planner internals are read-only here',
    ],
    firstScreens,
  }

  if (PHASE === 'after') {
    ergebnis.klick = await klickZiel(browser, VIEWPORTS[1])
    ergebnis.tastatur = await tastaturZiel(browser)
    ergebnis.gate = await gateZustand(browser)
    ergebnis.prefill = await prefillZustand(browser)
    ergebnis.motion = await reducedMotion(browser)
    ergebnis.reflow = await textReflow(browser)
    ergebnis.desktop = await desktop(browser)
  } else {
    ergebnis.desktop = firstScreens.find((s) => s.viewport === '1024x768')
  }

  const fehler = bewerten(ergebnis)
  ergebnis.ok = fehler.length === 0
  ergebnis.fehler = fehler
  writeFileSync(BERICHT, JSON.stringify(ergebnis, null, 2))
  await browser.close()
  if (server.kind) server.kind.kill()
  if (!ergebnis.ok) {
    console.error(JSON.stringify({ ok: false, fehler, bericht: BERICHT }, null, 2))
    process.exit(1)
  }
  console.log(JSON.stringify({ ok: true, phase: PHASE, bericht: BERICHT, productTree: PRODUCT_TREE }, null, 2))
}

main().catch((fehler) => {
  console.error(fehler)
  process.exit(1)
})
