#!/usr/bin/env node
// scripts/trip-workspace-ui-audit.mjs
//
// WebKit-/Chromium-Audit der mobilen Trip-Workspace-Informationsarchitektur.
// Fixtures nur hier und im sessionStorage des Harness, nie im Produktspeicher.

import { spawn } from 'node:child_process'
import { writeFileSync } from 'node:fs'
import { chromium, webkit } from 'playwright'

const PORT = process.env.AUDIT_PORT || '3460'
const BASIS = `http://127.0.0.1:${PORT}`
const PFAD = '/ui-audit/trip-workspace'
const BERICHT = process.env.AUDIT_REPORT || '/opt/cursor/artifacts/trip_workspace_ui_audit.json'
const SPEICHER = 'jetnity:ui-audit:workspace'

const BREITEN = [
  { name: '280', width: 280, height: 760 },
  { name: '320', width: 320, height: 760 },
  { name: '360', width: 360, height: 780 },
  { name: '390', width: 390, height: 844 },
  { name: '430', width: 430, height: 860 },
  { name: '768', width: 768, height: 1024 },
  { name: '844x390', width: 844, height: 390 },
  { name: '1280', width: 1280, height: 800 },
]

const JETZT = '2026-08-21T10:00:00.000Z'

function etappe(teil = {}) {
  return {
    id: 'stage-1',
    position: 1,
    name: 'Bali',
    countryCode: 'ID',
    arrivalDate: '2026-09-12',
    departureDate: '2026-09-16',
    latitude: -8.4095,
    longitude: 115.1889,
    placeId: 'geonames:1650535',
    ...teil,
  }
}

function punkt(teil) {
  return {
    dayId: 'day-1',
    stageId: 'stage-1',
    note: null,
    position: 1,
    startsOn: null,
    startsAt: null,
    endsOn: null,
    endsAt: null,
    priceAmount: null,
    priceCurrency: null,
    provider: null,
    externalRef: null,
    bookingUrl: null,
    ...teil,
  }
}

function tag(index, teil = {}) {
  return {
    id: `day-${index}`,
    stageId: 'stage-1',
    dayIndex: index,
    dayDate: `2026-09-${String(11 + index).padStart(2, '0')}`,
    title: null,
    items: [],
    ...teil,
  }
}

function reise(teil = {}) {
  return {
    id: 'trip-audit-workspace',
    clientRef: 'trip-audit-workspace',
    title: 'Bali',
    origin: 'Zürich',
    originPlaceId: 'geonames:2657896',
    startDate: '2026-09-12',
    endDate: '2026-09-16',
    travellers: 2,
    currency: 'CHF',
    budgetAmount: 3500,
    status: 'draft',
    pace: 'calm',
    interests: ['beach'],
    travelWish: null,
    revision: 1,
    lastMutationId: null,
    stages: [etappe()],
    days: [tag(1), tag(2), tag(3), tag(4), tag(5)],
    ohneTag: [],
    createdAt: JETZT,
    updatedAt: JETZT,
    ...teil,
  }
}

const HOTEL_UNAVAILABLE = {
  status: 'unavailable',
  message: 'Die Hotelsuche ist in dieser Umgebung nicht verfügbar.',
  coverageNote: 'Kein Hotelprovider.',
  quartier: null,
  evidenz: {
    hatOrt: true,
    hatKoordinaten: true,
    hatZeitraum: true,
    hatReiseanker: false,
    hatWegezeiten: false,
    hatTransferzeiten: false,
    hatPraeferenzprofil: false,
  },
  options: [],
}

const ACTIVITY_UNAVAILABLE = {
  status: 'unavailable',
  message: 'Passende Aktivitäten werden vorbereitet.',
  coverageNote: 'Kein Activity-Provider.',
  evidenz: {
    hatOrt: true,
    hatKoordinaten: true,
    hatTag: true,
    hatDatum: true,
    hatBestehendePunkte: false,
    hatBelastbareZeiten: false,
    hatInteressen: true,
    hatBudget: true,
  },
  options: [],
}

const ZUSTAENDE = {
  'uebersicht-leer': {
    kompakt: 'Noch kein Flug ausgewählt',
    desktop: 'Tagesplan',
    nutzlast: { reise: reise(), mitSuche: true, mitAenderung: true },
  },
  'uebersicht-gefuellt': {
    kompakt: '1 Flug ausgewählt',
    desktop: 'ZRH–DPS',
    nutzlast: {
      reise: reise({
        days: [
          tag(1, {
            items: [
              punkt({ id: 'flug-1', kind: 'flight', title: 'ZRH–DPS' }),
              punkt({ id: 'hotel-1', kind: 'stay', title: 'Ubud Inn' }),
              punkt({ id: 'act-1', kind: 'activity', title: 'Reisterrassen' }),
            ],
          }),
          tag(2),
        ],
      }),
      mitSuche: true,
    },
  },
  'plan-viele-tage': {
    kompakt: 'Tag 15',
    desktop: 'Tag 15',
    tab: 'Plan',
    nutzlast: {
      reise: reise({
        startDate: '2026-09-12',
        endDate: '2026-09-26',
        days: Array.from({ length: 15 }, (_, i) => tag(i + 1)),
      }),
    },
  },
  'lange-texte': {
    kompakt: 'Sehr langer Reisetitel ohne Abschneiden für die Mobile-Kopfzeile Bali Ubud Seminyak',
    desktop: 'Sehr langer Reisetitel ohne Abschneiden für die Mobile-Kopfzeile Bali Ubud Seminyak',
    nutzlast: {
      reise: reise({
        title: 'Sehr langer Reisetitel ohne Abschneiden für die Mobile-Kopfzeile Bali Ubud Seminyak',
        stages: [
          etappe({ name: 'Ubud' }),
          {
            id: 'stage-2',
            position: 2,
            name: 'Seminyak mit sehr langem Etappennamen ohne horizontales Abschneiden',
            countryCode: 'ID',
            arrivalDate: '2026-09-16',
            departureDate: '2026-09-20',
            latitude: -8.691,
            longitude: 115.168,
            placeId: null,
          },
        ],
      }),
    },
  },
  gast: {
    kompakt: 'Dieser Entwurf liegt nur in diesem Browser.',
    desktop: 'Dieser Entwurf liegt nur in diesem Browser.',
    nutzlast: { reise: reise(), gastHinweis: true, quelle: 'guest' },
  },
  konto: {
    kompakt: 'Im Konto gespeichert',
    desktop: 'Im Konto gespeichert',
    nutzlast: { reise: reise(), quelle: 'account' },
  },
  aenderung: {
    kompakt: 'Dein Änderungswunsch',
    desktop: 'Dein Änderungswunsch',
    oeffneAenderung: true,
    nutzlast: { reise: reise(), mitAenderung: true },
  },
  fluege: {
    kompakt: 'Verbindungen für diese Reise',
    desktop: 'Verbindungen für diese Reise',
    tab: 'Flüge',
    nutzlast: { reise: reise(), mitSuche: true },
  },
  unterkunft: {
    kompakt: 'Die Hotelsuche ist in dieser Umgebung nicht verfügbar.',
    desktop: 'Die Hotelsuche ist in dieser Umgebung nicht verfügbar.',
    tab: 'Unterkunft',
    nutzlast: { reise: reise(), mitSuche: true },
  },
  aktivitaeten: {
    kompakt: 'Passende Aktivitäten werden vorbereitet.',
    desktop: 'Passende Aktivitäten werden vorbereitet.',
    tab: 'Aktivitäten',
    nutzlast: { reise: reise(), mitSuche: true },
  },
  'ohne-tag': {
    kompakt: 'Noch nicht eingeplant',
    desktop: 'Noch nicht eingeplant',
    tab: 'Plan',
    nutzlast: {
      reise: reise({
        ohneTag: [punkt({ id: 'offen-1', kind: 'note', title: 'Offener Punkt', dayId: null })],
      }),
    },
  },
}

function layoutPruefen() {
  const fehler = []
  const seite = document.documentElement
  if (seite.scrollWidth > seite.clientWidth + 1) {
    fehler.push(`Seiten-Overflow ${seite.scrollWidth}>${seite.clientWidth}`)
  }

  const wurzel = document.querySelector('main')
  if (!wurzel) return { ok: false, fehler: ['Workspace-Hauptbereich fehlt'] }

  const knoepfe = [...wurzel.querySelectorAll('button, a')].filter((el) => {
    if (el.closest('[hidden]')) return false
    const box = el.getBoundingClientRect()
    return box.width > 0 && box.height > 0
  })

  for (const knopf of knoepfe) {
    const box = knopf.getBoundingClientRect()
    if (box.height + 0.5 < 44) {
      fehler.push(`Trefferfläche ${Math.round(box.height)}px < 44px (${(knopf.textContent || '').trim().slice(0, 40)})`)
    }
  }

  const nav = document.querySelector('[aria-label="Reisebereiche"]')
  if (nav && window.innerWidth < 1024) {
    const tabs = [...nav.querySelectorAll('button')]
    if (tabs.length < 5) fehler.push(`Bereichsnavigation hat ${tabs.length} Ziele`)
    const aktuell = tabs.filter((el) => el.getAttribute('aria-current') === 'page')
    if (aktuell.length !== 1) fehler.push(`aktiver Bereich nicht eindeutig: ${aktuell.length}`)
  }

  const versteckt = [...document.querySelectorAll('[hidden]')]
  for (const el of versteckt) {
    const fokus = el.querySelector('button, a, input, textarea, [tabindex]')
    if (fokus && !el.hasAttribute('inert') && getComputedStyle(el).display !== 'none') {
      fehler.push('versteckter Bereich bleibt bedienbar')
    }
  }

  const kopf = document.querySelector('header')
  const fokus = document.activeElement
  if (kopf && fokus && wurzel.contains(fokus)) {
    const k = kopf.getBoundingClientRect()
    const f = fokus.getBoundingClientRect()
    if (f.top < k.bottom - 1 && f.bottom > k.top + 1 && getComputedStyle(kopf).position === 'sticky') {
      fehler.push('Fokusziel unter klebender Kopfzeile')
    }
  }

  const planScroller = document.querySelector('[aria-label="Tagesplan"] .overflow-y-auto')
  if (planScroller && window.innerWidth < 1024) {
    fehler.push('vertikaler Tageslisten-Scroller auf Mobile')
  }

  return { ok: fehler.length === 0, fehler: [...new Set(fehler)].slice(0, 12) }
}

async function serverStarten() {
  const kind = spawn('npm', ['run', 'dev', '--', '-p', PORT, '-H', '127.0.0.1'], {
    env: {
      ...process.env,
      JETNITY_UI_AUDIT: '1',
      NEXT_PUBLIC_SUPABASE_URL: process.env.NEXT_PUBLIC_SUPABASE_URL || 'https://placeholder.supabase.co',
      NEXT_PUBLIC_SUPABASE_ANON_KEY:
        process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY ||
        'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InBsYWNlaG9sZGVyIiwicm9sZSI6ImFub24iLCJpYXQiOjE2OTAwMDAwMDAsImV4cCI6MjAwMDAwMDAwMH0.audit',
      NEXT_PUBLIC_APP_URL: BASIS,
    },
    stdio: ['ignore', 'pipe', 'pipe'],
  })
  let bereit = false
  const ausgabe = []
  kind.stdout.on('data', (chunk) => {
    const text = String(chunk)
    ausgabe.push(text)
    if (text.includes('Ready') || text.includes('started')) bereit = true
  })
  kind.stderr.on('data', (chunk) => ausgabe.push(String(chunk)))
  const start = Date.now()
  while (!bereit && Date.now() - start < 90_000) {
    await new Promise((r) => setTimeout(r, 250))
  }
  if (!bereit) {
    kind.kill()
    throw new Error(`Next.js startete nicht:\n${ausgabe.join('')}`)
  }
  return kind
}

async function seiteVorbereiten(page, zustand) {
  const defin = ZUSTAENDE[zustand]
  await page.addInitScript(
    ({ speicher, nutzlast }) => {
      sessionStorage.setItem(speicher, JSON.stringify(nutzlast))
    },
    { speicher: SPEICHER, nutzlast: defin.nutzlast },
  )

  await page.route('**/api/hotels/search', async (route) => {
    await route.fulfill({
      status: 200,
      contentType: 'application/json',
      body: JSON.stringify(HOTEL_UNAVAILABLE),
    })
  })
  await page.route('**/api/activities/search', async (route) => {
    await route.fulfill({
      status: 200,
      contentType: 'application/json',
      body: JSON.stringify(ACTIVITY_UNAVAILABLE),
    })
  })
  await page.route('**/api/flights/search', async (route) => {
    await route.fulfill({
      status: 200,
      contentType: 'application/json',
      body: JSON.stringify({
        status: 'unavailable',
        message: 'Die Flugsuche ist in dieser Umgebung nicht verfügbar.',
        coverageNote: 'Kein Flugprovider.',
        options: [],
      }),
    })
  })
}

async function zustandOeffnen(page, zustand, viewport) {
  const defin = ZUSTAENDE[zustand]
  if (defin.tab && viewport.width < 1024) {
    await page.getByRole('navigation', { name: 'Reisebereiche' }).getByRole('button', { name: defin.tab, exact: true }).click()
  }
  if (defin.oeffneAenderung && viewport.width < 1024) {
    await page.getByRole('button', { name: 'Reise ändern' }).click()
  }
}

async function zustandPruefen(browser, name, viewport, zustand) {
  const kontext = await browser.newContext({
    viewport: { width: viewport.width, height: viewport.height },
    hasTouch: viewport.width <= 430,
  })
  const page = await kontext.newPage()
  await seiteVorbereiten(page, zustand)
  await page.goto(`${BASIS}${PFAD}`, { waitUntil: 'domcontentloaded' })
  const defin = ZUSTAENDE[zustand]
  const nachweis = viewport.width >= 1024 ? defin.desktop : defin.kompakt
  try {
    await zustandOeffnen(page, zustand, viewport)
    await page.getByText(nachweis, { exact: false }).first().waitFor({ timeout: 15000 })
  } catch {
    await kontext.close()
    return {
      ok: false,
      engine: name,
      viewport: viewport.name,
      zustand,
      fehler: [`Inhaltsnachweis fehlt: «${nachweis}»`],
    }
  }
  const layout = await page.evaluate(layoutPruefen)
  await kontext.close()
  return {
    ok: layout.ok,
    engine: name,
    viewport: viewport.name,
    zustand,
    fehler: layout.fehler,
  }
}

async function interaktionPruefen(browser, name) {
  const kontext = await browser.newContext({ viewport: { width: 390, height: 844 }, hasTouch: true })
  const page = await kontext.newPage()
  let hotel = 0
  let activity = 0
  await page.addInitScript(
    ({ speicher, nutzlast }) => sessionStorage.setItem(speicher, JSON.stringify(nutzlast)),
    {
      speicher: SPEICHER,
      nutzlast: {
        reise: reise({
          days: Array.from({ length: 8 }, (_, i) => tag(i + 1)),
        }),
        mitSuche: true,
        mitAenderung: true,
      },
    },
  )
  await page.route('**/api/hotels/search', async (route) => {
    hotel += 1
    await route.fulfill({
      status: 200,
      contentType: 'application/json',
      body: JSON.stringify(HOTEL_UNAVAILABLE),
    })
  })
  await page.route('**/api/activities/search', async (route) => {
    activity += 1
    const roh = route.request().postData() || '{}'
    const tagId = JSON.parse(roh).day?.id || 'unbekannt'
    await new Promise((r) => setTimeout(r, 250))
    await route.fulfill({
      status: 200,
      contentType: 'application/json',
      body: JSON.stringify({ ...ACTIVITY_UNAVAILABLE, message: `Antwort für ${tagId}` }),
    })
  })
  await page.route('**/api/flights/search', async (route) => {
    await route.fulfill({
      status: 200,
      contentType: 'application/json',
      body: JSON.stringify({ status: 'unavailable', message: 'aus', options: [] }),
    })
  })

  await page.goto(`${BASIS}${PFAD}`, { waitUntil: 'domcontentloaded' })
  await page.getByText('Noch kein Flug ausgewählt').waitFor({ timeout: 15000 })
  const hotelNachUebersicht = hotel
  const activityNachUebersicht = activity

  await page.getByRole('navigation', { name: 'Reisebereiche' }).getByRole('button', { name: 'Plan', exact: true }).click()
  await page.getByRole('button', { name: /Tag 3/ }).click()
  await page.getByRole('navigation', { name: 'Reisebereiche' }).getByRole('button', { name: 'Aktivitäten', exact: true }).click()
  await page.getByText('Antwort für day-3', { exact: false }).waitFor({ timeout: 15000 })
  const dritter = page.getByRole('radio').nth(2)
  const checked = await dritter.getAttribute('aria-checked')

  await page.getByRole('navigation', { name: 'Reisebereiche' }).getByRole('button', { name: 'Unterkunft', exact: true }).click()
  await page.getByText('Die Hotelsuche ist in dieser Umgebung nicht verfügbar.').waitFor({ timeout: 15000 })
  const hotelNachErstbesuch = hotel
  await page.getByRole('navigation', { name: 'Reisebereiche' }).getByRole('button', { name: 'Übersicht', exact: true }).click()
  await page.getByRole('navigation', { name: 'Reisebereiche' }).getByRole('button', { name: 'Unterkunft', exact: true }).click()
  await page.waitForTimeout(400)
  const hotelNachZweitemBesuch = hotel

  await page.getByRole('navigation', { name: 'Reisebereiche' }).getByRole('button', { name: 'Übersicht', exact: true }).click()
  await page.getByRole('button', { name: 'Reise ändern' }).click()
  const fokus = await page.evaluate(() => document.activeElement?.tagName === 'TEXTAREA')
  await page.keyboard.press('Escape')
  const geschlossen = await page.getByRole('button', { name: 'Reise ändern' }).getAttribute('aria-expanded')

  const navFokus = await page.evaluate(() => {
    const knopf = document.querySelector('[aria-label="Reisebereiche"] button')
    knopf?.focus()
    return Boolean(document.activeElement && document.activeElement.matches(':focus-visible'))
  })

  await kontext.close()
  const fehler = []
  if (hotelNachUebersicht !== 0) fehler.push(`Hotelsuche startete in der Übersicht: ${hotelNachUebersicht}`)
  if (activityNachUebersicht !== 0) fehler.push(`Aktivitätensuche startete in der Übersicht: ${activityNachUebersicht}`)
  if (checked !== 'true') fehler.push('gewählter Tag blieb zwischen Plan und Aktivitäten nicht erhalten')
  if (hotelNachErstbesuch < 1) fehler.push('Unterkunft löste keine Hotelsuche aus')
  if (hotelNachZweitemBesuch !== hotelNachErstbesuch) {
    fehler.push(`Tabwechsel löste Hotelsuche erneut aus: ${hotelNachErstbesuch} → ${hotelNachZweitemBesuch}`)
  }
  if (!fokus) fehler.push('Fokus lag nach Reise ändern nicht im Feld')
  if (geschlossen !== 'false') fehler.push('Escape schloss Reise ändern nicht')
  if (!navFokus) fehler.push('Fokusring der Bereichsnavigation nicht sichtbar')
  if (activity > 6) fehler.push(`Activity-Request-Schleife verdächtig: ${activity}`)
  return {
    ok: fehler.length === 0,
    engine: name,
    viewport: '390-interaktion',
    zustand: 'navigation',
    fehler,
    hotel,
    activity,
  }
}

async function main() {
  const server = await serverStarten()
  const ergebnisse = []
  const engines = [
    ['webkit', webkit],
    ['chromium', chromium],
  ]
  try {
    for (const [name, typ] of engines) {
      const browser = await typ.launch({ headless: true })
      try {
        for (const viewport of BREITEN) {
          for (const zustand of Object.keys(ZUSTAENDE)) {
            ergebnisse.push(await zustandPruefen(browser, name, viewport, zustand))
          }
        }
        ergebnisse.push(await interaktionPruefen(browser, name))
      } finally {
        await browser.close()
      }
    }
  } finally {
    try {
      server.kill('SIGTERM')
    } catch {
      // Next kann sich vom Spawn lösen.
    }
  }

  const fehlgeschlagen = ergebnisse.filter((e) => !e.ok)
  const bericht = {
    kombinationen: ergebnisse.length,
    engines: ['webkit', 'chromium'],
    viewports: BREITEN.map((b) => b.name),
    zustaende: Object.keys(ZUSTAENDE),
    fehlerzahl: fehlgeschlagen.length,
    fehlgeschlagen,
  }
  try {
    writeFileSync(BERICHT, JSON.stringify(bericht, null, 2))
  } catch {
    writeFileSync('trip_workspace_ui_audit.json', JSON.stringify(bericht, null, 2))
  }
  console.log(JSON.stringify(bericht, null, 2))
  try {
    server.kill('SIGTERM')
  } catch {
    // Der Next-Prozess kann sich vom Spawn lösen; der Bericht ist trotzdem fertig.
  }
  process.exit(fehlgeschlagen.length ? 1 : 0)
}

await main()
