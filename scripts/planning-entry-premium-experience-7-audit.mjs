#!/usr/bin/env node
// Disposable Chromium evidence for Planning Entry premium experience 7.
// Compiled Next app, real product CSS, synthetic guest only.
// Place search is fulfilled locally. Model hosts and unexpected writes are recorded.
// JETNITY_MODELL_AKTIV is forced off for the dev server this script starts.

import { execSync, spawn } from 'node:child_process'
import { mkdirSync, writeFileSync } from 'node:fs'
import { join } from 'node:path'
import { chromium } from 'playwright'

const PORT = process.env.AUDIT_PORT || '3017'
const BASIS = process.env.AUDIT_BASE || `http://127.0.0.1:${PORT}`
const EVIDENZ = process.env.AUDIT_EVIDENCE_DIR || '/workspace/docs/evidence/planning-entry-premium-experience-7'
const SHA = execSync('git rev-parse HEAD', { encoding: 'utf8' }).trim()
const DIRTY = execSync('git status --porcelain', { encoding: 'utf8' })
  .split('\n')
  .map((zeile) => zeile.trim())
  .filter(Boolean)

const VIEWPORTS = [
  { name: '320x568', width: 320, height: 568, touch: true },
  { name: '360x800', width: 360, height: 800, touch: true },
  { name: '375x812', width: 375, height: 812, touch: true },
  { name: '390x844', width: 390, height: 844, touch: true },
  { name: '412x915', width: 412, height: 915, touch: true },
  { name: '430x932', width: 430, height: 932, touch: true },
  { name: '768x1024', width: 768, height: 1024, touch: true },
  { name: '820x1180', width: 820, height: 1180, touch: true },
  { name: '1024x768', width: 1024, height: 768, touch: false },
  { name: '1280x800', width: 1280, height: 800, touch: false },
  { name: '1440x900', width: 1440, height: 900, touch: false },
  { name: '1728x1117', width: 1728, height: 1117, touch: false },
  { name: '1920x1080', width: 1920, height: 1080, touch: false },
  { name: 'landscape-844x390', width: 844, height: 390, touch: true },
  { name: 'landscape-812x375', width: 812, height: 375, touch: true },
]

const SCHLUESSEL = 'jetnity:reise:v3'
const GAST_REISE = {
  id: 'trip-planning-entry-7',
  clientRef: 'trip-planning-entry-7',
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
  createdAt: '2026-10-01T10:00:00.000Z',
  updatedAt: '2026-10-01T10:00:00.000Z',
}

const ORTE = [
  { id: 'geonames:1861060', label: 'Japan', typ: 'country', ariaLabel: 'Land Japan' },
  { id: 'geonames:3169070', label: 'Rom', typ: 'city', ariaLabel: 'Stadt Rom' },
  { id: 'geonames:2657896', label: 'Zürich', typ: 'city', ariaLabel: 'Stadt Zürich' },
  { id: 'airport:ZRH', label: 'Zürich Flughafen', typ: 'airport', iata: 'ZRH', ariaLabel: 'Flughafen Zürich' },
]

function orteFuer(url) {
  const parsed = new URL(url)
  const q = (parsed.searchParams.get('q') || '').trim().toLowerCase()
  const rolle = parsed.searchParams.get('rolle')
  return ORTE.filter((ort) => {
    if (!ort.label.toLowerCase().includes(q) && !(ort.iata || '').toLowerCase().includes(q)) return false
    if (rolle === 'abreise') return ort.typ === 'city' || ort.typ === 'airport'
    return ort.typ !== 'airport'
  })
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
  const umgebung = { ...process.env }
  umgebung.JETNITY_MODELL_AKTIV = 'false'
  delete umgebung.OPENAI_API_KEY
  umgebung.NEXT_PUBLIC_SUPABASE_URL =
    umgebung.NEXT_PUBLIC_SUPABASE_URL || 'https://placeholder.supabase.co'
  umgebung.NEXT_PUBLIC_SUPABASE_ANON_KEY =
    umgebung.NEXT_PUBLIC_SUPABASE_ANON_KEY ||
    'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InBsYWNlaG9sZGVyIiwicm9sZSI6ImFub24iLCJpYXQiOjE2OTAwMDAwMDAsImV4cCI6MjAwMDAwMDAwMH0.audit'
  umgebung.NEXT_PUBLIC_APP_URL = BASIS
  const kind = spawn('npm', ['run', 'dev', '--', '-p', PORT, '-H', '127.0.0.1'], {
    env: umgebung,
    stdio: ['ignore', 'pipe', 'pipe'],
  })
  const start = Date.now()
  while (Date.now() - start < 120_000) {
    if (await serverErreichbar()) return { kind, reused: false }
    await new Promise((r) => setTimeout(r, 400))
  }
  kind.kill()
  throw new Error('Next.js startete nicht')
}

async function netz(page, protokoll) {
  await page.route('**/*', async (route) => {
    const url = route.request().url()
    const method = route.request().method()
    if (['POST', 'PUT', 'PATCH', 'DELETE'].includes(method)) {
      protokoll.schreiben.push({ method, url })
    }
    const host = (() => {
      try {
        return new URL(url).host
      } catch {
        return ''
      }
    })()
    const extern =
      host.includes('openai.com') ||
      host.includes('anthropic.com') ||
      host.includes('supabase.co') ||
      url.includes('/functions/v1/')
    if (extern) {
      protokoll.blockiert.push({ method, url })
      await route.fulfill({
        status: 503,
        contentType: 'application/json',
        body: JSON.stringify({ ok: false, simulation: true }),
      })
      return
    }
    await route.continue()
  })
  await page.route('**/api/search/places**', async (route) => {
    protokoll.ortssuche.push(route.request().url())
    await route.fulfill({
      status: 200,
      contentType: 'application/json',
      body: JSON.stringify(orteFuer(route.request().url())),
    })
  })
}

async function leerSpeicher(page) {
  await page.addInitScript(() => {
    window.localStorage.removeItem('jetnity:reise:v3')
    window.localStorage.removeItem('jetnity:reisen-warteschlange:v3')
    window.localStorage.removeItem('jetnity:guest-trips:v2')
  })
}

async function warten(page) {
  await page.getByRole('heading', { name: 'Beginnen wir mit deiner Reise.' }).waitFor({ timeout: 20_000 })
  await page.waitForFunction(
    () => {
      const knopf = document.querySelector('button, a[href="#manuell-planen"]')
      if (!knopf) return false
      return Object.keys(knopf).some((name) => name.startsWith('__react'))
    },
    { timeout: 20_000 },
  )
}

async function messen(page) {
  return page.evaluate(() => {
    const client = document.documentElement.clientWidth
    const overflow = Math.max(0, document.documentElement.scrollWidth - client)
    const klein = []
    const inputs = []
    const ueber = []
    for (const el of document.querySelectorAll('main button, main a, main input, main textarea, main select')) {
      const rect = el.getBoundingClientRect()
      if (rect.width < 1 || rect.height < 1) continue
      const stil = getComputedStyle(el)
      if (stil.visibility === 'hidden' || stil.display === 'none') continue
      const ziel = el.matches('button, a')
      if (ziel && (rect.height < 44 || (rect.width < 44 && rect.height < 44))) {
        klein.push({
          tag: el.tagName.toLowerCase(),
          text: (el.innerText || el.getAttribute('aria-label') || '').trim().slice(0, 80),
          h: Math.round(rect.height),
          w: Math.round(rect.width),
        })
      }
      if (el.matches('input, textarea, select')) {
        inputs.push({
          id: el.id || el.getAttribute('aria-label'),
          font: parseFloat(stil.fontSize),
        })
      }
    }
    for (const el of document.querySelectorAll('body *')) {
      const rect = el.getBoundingClientRect()
      if (rect.width < 1 || rect.height < 1) continue
      if (rect.right > client + 1 || rect.left < -1) {
        const stil = getComputedStyle(el)
        if (stil.position === 'fixed') continue
        ueber.push({
          tag: el.tagName.toLowerCase(),
          id: el.id || null,
          text: (el.textContent || '').trim().slice(0, 60),
          right: Math.round(rect.right),
          left: Math.round(rect.left),
        })
        if (ueber.length >= 8) break
      }
    }
    const gruppen = ['Route & Ziele', 'Zeitraum', 'Reisende & Budget', 'Wünsche'].map((name) => ({
      name,
      vorhanden: Boolean(document.getElementById(
        name === 'Route & Ziele'
          ? 'planen-gruppe-route'
          : name === 'Zeitraum'
            ? 'planen-gruppe-zeitraum'
            : name === 'Reisende & Budget'
              ? 'planen-gruppe-reisende'
              : 'planen-gruppe-wuensche',
      )),
    }))
    const aside = document.querySelector('aside')
    const asideStil = aside ? getComputedStyle(aside) : null
    return {
      overflow,
      scrollWidth: document.documentElement.scrollWidth,
      clientWidth: client,
      klein,
      inputs,
      ueber,
      gruppen,
      asideDisplay: asideStil?.display || null,
      asidePosition: asideStil?.position || null,
      h1: document.querySelector('h1')?.textContent?.trim() || null,
    }
  })
}

async function seite(browser, viewport, extra = {}) {
  const context = await browser.newContext({
    viewport: { width: viewport.width, height: viewport.height },
    hasTouch: viewport.touch,
    reducedMotion: extra.reducedMotion || 'no-preference',
  })
  const page = await context.newPage()
  const protokoll = { schreiben: [], blockiert: [], ortssuche: [] }
  await leerSpeicher(page)
  await netz(page, protokoll)
  await page.goto(`${BASIS}/planen`, { waitUntil: 'networkidle' })
  await warten(page)
  if (extra.fontPx) {
    await page.addStyleTag({ content: `html { font-size: ${extra.fontPx}px !important; }` })
    await page.waitForTimeout(100)
  }
  if (extra.zoom) {
    await page.evaluate((zoom) => {
      document.documentElement.style.zoom = String(zoom)
    }, extra.zoom)
    await page.waitForTimeout(100)
  }
  const masse = await messen(page)
  if (extra.shot) {
    await page.screenshot({ path: join(EVIDENZ, 'screens', `${viewport.name}${extra.suffix || ''}.png`), fullPage: false })
  }
  await context.close()
  return { name: `${viewport.name}${extra.suffix || ''}`, ...masse, schreiben: protokoll.schreiben.length }
}

async function interaktion(browser) {
  const context = await browser.newContext({ viewport: { width: 390, height: 844 }, hasTouch: true })
  const page = await context.newPage()
  const protokoll = { schreiben: [], blockiert: [], ortssuche: [] }
  await leerSpeicher(page)
  await netz(page, protokoll)
  await page.goto(`${BASIS}/planen`, { waitUntil: 'networkidle' })
  await warten(page)
  const vorher = protokoll.schreiben.length
  const historyVor = await page.evaluate(() => history.length)
  await page.getByRole('button', { name: 'Thailand' }).click()
  const nachBeispiel = await page.locator('textarea').first().inputValue()
  const schreibtNachBeispiel = protokoll.schreiben.length - vorher
  const vorschauVorSubmit = await page.getByRole('button', { name: 'Reise übernehmen' }).count()

  await page.getByRole('link', { name: 'Schritt für Schritt planen' }).click()
  await page.waitForTimeout(350)
  const nachManuell = await page.evaluate(() => ({
    hash: location.hash,
    aktiv: document.activeElement?.id || null,
    history: history.length,
  }))

  await page.getByRole('link', { name: 'In eigenen Worten beginnen' }).click()
  await page.waitForTimeout(350)
  const nachIdee = await page.evaluate(() => ({
    hash: location.hash,
    aktiv: document.activeElement?.id || null,
  }))
  const schreibtNachNavigation = protokoll.schreiben.length - vorher

  await page.getByRole('button', { name: 'Reise erstellen' }).click()
  await page.waitForTimeout(400)
  const validierung = await page.evaluate(() => ({
    aktiv: document.activeElement?.id || null,
    alert: document.querySelector('[role="alert"]')?.textContent?.trim().slice(0, 160) || null,
  }))
  const schreibtNachManuell = protokoll.schreiben.length - vorher

  const ziel = page.locator('#feld-ziel')
  await ziel.fill('Japan')
  await page.getByRole('option', { name: /Japan/ }).first().click()
  await page.getByRole('button', { name: 'Weiteres Ziel hinzufügen' }).click()
  const extra = page.locator('input[id^="feld-ziel-"]').first()
  await extra.fill('Rom')
  await page.getByRole('option', { name: /Rom/ }).first().click()
  const vorTausch = await ziel.inputValue()
  await page.getByRole('button', { name: /nach oben/ }).first().click()
  await page.waitForTimeout(100)
  const nachTausch = await page.locator('#feld-ziel').inputValue()
  const extraNachTausch = await page.locator('input[id^="feld-ziel-"]').first().inputValue()
  await page.getByRole('button', { name: /entfernen/i }).first().click()
  const extrasNachEntfernen = await page.locator('input[id^="feld-ziel-"]').count()
  const schreibtNachReorder = protokoll.schreiben.length - vorher

  await page.getByRole('button', { name: 'Entwurf erstellen' }).click()
  await page.waitForTimeout(1500)
  const nachEntwurf = {
    vorschau: await page.getByRole('button', { name: 'Reise übernehmen' }).count(),
    meldung: await page.locator('[role="alert"]').first().textContent().catch(() => null),
    schreiben: protokoll.schreiben.length,
  }

  await context.close()
  return {
    nachBeispiel,
    schreibtNachBeispiel,
    vorschauVorSubmit,
    historyVor,
    nachManuell,
    nachIdee,
    schreibtNachNavigation,
    validierung,
    schreibtNachManuell,
    vorTausch,
    nachTausch,
    extraNachTausch,
    extrasNachEntfernen,
    schreibtNachReorder,
    nachEntwurf,
    blockiert: protokoll.blockiert,
    ortssuche: protokoll.ortssuche.length,
  }
}

async function metadatenseite(browser, pfad) {
  const context = await browser.newContext()
  const page = await context.newPage()
  await leerSpeicher(page)
  const antwort = await page.goto(`${BASIS}${pfad}`, { waitUntil: 'domcontentloaded' })
  const canonical = await page.locator('link[rel="canonical"]').getAttribute('href').catch(() => null)
  const robots = await page.locator('meta[name="robots"]').getAttribute('content').catch(() => null)
  const titel = await page.title()
  const text = await page.locator('body').innerText()
  const idee = await page.locator('textarea').first().inputValue().catch(() => '')
  const ziel = await page.locator('#feld-ziel').inputValue().catch(() => '')
  await context.close()
  return { pfad, status: antwort?.status(), canonical, robots, titel, text: text.slice(0, 700), idee, ziel }
}

async function gastGate(browser) {
  const context = await browser.newContext({ viewport: { width: 390, height: 844 } })
  const page = await context.newPage()
  await page.addInitScript(
    ({ schluessel, reise }) => {
      window.localStorage.setItem(schluessel, JSON.stringify(reise))
    },
    { schluessel: SCHLUESSEL, reise: GAST_REISE },
  )
  await netz(page, { schreiben: [], blockiert: [], ortssuche: [] })
  await page.goto(`${BASIS}/planen`, { waitUntil: 'networkidle' })
  const text = await page.locator('body').innerText()
  const hatFormular = await page.getByRole('button', { name: 'Entwurf erstellen' }).count()
  await context.close()
  return {
    hatBestehendeReise: text.includes('Du hast bereits eine Reise.'),
    hatFortsetzen: text.includes('Reise fortsetzen'),
    hatFormular,
  }
}

function bewerten(szenen, fluss, meta, gate) {
  const fehler = []
  for (const szene of szenen) {
    if (szene.overflow > 0) fehler.push(`${szene.name}: page overflow ${szene.overflow}`)
    if (szene.ueber?.length) fehler.push(`${szene.name}: element overflow ${JSON.stringify(szene.ueber[0])}`)
    if (szene.klein?.length) fehler.push(`${szene.name}: target <44 ${JSON.stringify(szene.klein[0])}`)
    for (const feld of szene.inputs || []) {
      if (feld.font < 16) fehler.push(`${szene.name}: input ${feld.id} font ${feld.font}`)
    }
    if (szene.h1 !== 'Beginnen wir mit deiner Reise.') fehler.push(`${szene.name}: unexpected h1`)
    if ((szene.gruppen || []).some((gruppe) => !gruppe.vorhanden)) fehler.push(`${szene.name}: missing group`)
    const breite = Number((szene.name.match(/(\d+)x\d+/) || [])[1] || 0)
    if (breite >= 1280 && szene.asideDisplay === 'none') fehler.push(`${szene.name}: desktop guide hidden`)
    if (breite < 1280 && szene.asideDisplay !== 'none') fehler.push(`${szene.name}: guide visible below desktop`)
  }
  if (fluss.nachBeispiel.length < 10) fehler.push('example did not fill textarea')
  if (fluss.schreibtNachBeispiel !== 0) fehler.push('example caused a write')
  if (fluss.vorschauVorSubmit !== 0) fehler.push('preview before explicit submit')
  if (fluss.nachManuell.hash !== '#manuell-planen') fehler.push(`manual hash ${fluss.nachManuell.hash}`)
  if (fluss.nachManuell.aktiv !== 'manuell-planen') fehler.push(`manual focus ${fluss.nachManuell.aktiv}`)
  if (fluss.nachManuell.history !== fluss.historyVor) fehler.push('navigation changed history length')
  if (fluss.nachIdee.hash !== '#reise-beschreiben') fehler.push(`idea hash ${fluss.nachIdee.hash}`)
  if (fluss.schreibtNachNavigation !== 0) fehler.push('navigation caused a write')
  if (!fluss.validierung.aktiv) fehler.push('manual validation did not focus')
  if (fluss.schreibtNachManuell !== 0) fehler.push('invalid manual submit caused a write')
  if (fluss.vorTausch !== 'Japan') fehler.push(`primary before swap ${fluss.vorTausch}`)
  if (fluss.nachTausch !== 'Rom') fehler.push(`primary after swap ${fluss.nachTausch}`)
  if (fluss.extraNachTausch !== 'Japan') fehler.push(`extra after swap ${fluss.extraNachTausch}`)
  if (fluss.extrasNachEntfernen !== 0) fehler.push('extra destination remained')
  if (fluss.schreibtNachReorder !== 0) fehler.push('reorder caused a write')
  if (fluss.nachEntwurf.vorschau !== 0) fehler.push('blocked model produced a save preview')
  if (fluss.nachEntwurf.schreiben < 1) fehler.push('explicit Entwurf erstellen did not submit')
  if (fluss.ortssuche < 1) fehler.push('place search was not used for reorder proof')
  const basis = meta.find((eintrag) => eintrag.pfad === '/planen')
  const prefill = meta.find((eintrag) => eintrag.pfad.startsWith('/planen?idee='))
  const konflikt = meta.find((eintrag) => eintrag.pfad.includes('zielIds='))
  if (!basis?.canonical?.endsWith('/planen')) fehler.push(`canonical ${basis?.canonical}`)
  if (!prefill?.canonical?.endsWith('/planen')) fehler.push(`prefill canonical ${prefill?.canonical}`)
  if (!prefill?.robots?.includes('noindex')) fehler.push(`prefill robots ${prefill?.robots}`)
  if (prefill?.idee !== 'Sieben Tage Lissabon') fehler.push(`prefill idea ${prefill?.idee}`)
  if (prefill?.ziel !== 'Lissabon') fehler.push(`prefill destination ${prefill?.ziel}`)
  if (!konflikt?.text?.includes('vermischt') && !konflikt?.text?.includes('Route')) {
    fehler.push('handoff conflict not visible')
  }
  if (!gate.hatBestehendeReise || !gate.hatFortsetzen || gate.hatFormular !== 0) {
    fehler.push(`guest gate ${JSON.stringify(gate)}`)
  }
  return fehler
}

mkdirSync(join(EVIDENZ, 'screens'), { recursive: true })
const server = await serverStarten()
const browser = await chromium.launch({ headless: true })
const shots = new Set(['320x568', '390x844', '768x1024', '1024x768', '1280x800', '1920x1080', 'landscape-844x390'])
const szenen = []
for (const viewport of VIEWPORTS) {
  szenen.push(await seite(browser, viewport, { shot: shots.has(viewport.name) }))
}
const phone360 = VIEWPORTS.find((viewport) => viewport.name === '360x800')
szenen.push(await seite(browser, phone360, { fontPx: 32, suffix: '-text-200', shot: true }))
const desktop = VIEWPORTS.find((viewport) => viewport.name === '1440x900')
szenen.push(await seite(browser, desktop, { zoom: 1.25, suffix: '-zoom-125', shot: true }))
szenen.push(await seite(browser, desktop, { zoom: 1.5, suffix: '-zoom-150', shot: true }))
const fluss = await interaktion(browser)
const meta = [
  await metadatenseite(browser, '/planen'),
  await metadatenseite(
    browser,
    `/planen?idee=${encodeURIComponent('Sieben Tage Lissabon')}&ziel=${encodeURIComponent('Lissabon')}`,
  ),
  await metadatenseite(browser, '/planen?zielIds=geonames:2988507&zielId=geonames:3169070'),
]
const gate = await gastGate(browser)
await browser.close()
if (server.kind) server.kind.kill()

const fehler = bewerten(szenen, fluss, meta, gate)
const bericht = {
  head: SHA,
  dirty: DIRTY,
  modellAktivErzwungenAus: true,
  szenen: szenen.map(({ ueber, klein, inputs, ...rest }) => ({
    ...rest,
    klein: klein.slice(0, 3),
    ueber: ueber.slice(0, 3),
    inputMinFont: inputs.reduce((min, feld) => Math.min(min, feld.font), 99),
  })),
  fluss,
  meta,
  gate,
  fehler,
  bestanden: fehler.length === 0,
}
writeFileSync(join(EVIDENZ, 'audit.json'), JSON.stringify(bericht, null, 2))
console.log(JSON.stringify({ bestanden: bericht.bestanden, fehler, head: SHA }, null, 2))
if (!bericht.bestanden) process.exit(1)
