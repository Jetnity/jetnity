#!/usr/bin/env node
// scripts/trip-workspace-information-architecture-2-audit.mjs
//
// Before/after evidence for Trip Workspace task modes.
// Synthetic local trip only. Provider and assistant routes are intercepted.
// Does not activate search, providers, Auth or Production.

import { execSync } from 'node:child_process'
import { spawn } from 'node:child_process'
import { mkdirSync, writeFileSync } from 'node:fs'
import http from 'node:http'
import net from 'node:net'
import { join } from 'node:path'
import { chromium } from 'playwright'

const UPSTREAM = process.env.AUDIT_UPSTREAM || 'http://127.0.0.1:3000'
const PORT = process.env.AUDIT_PORT || '3017'
const BASIS = process.env.AUDIT_BASE || `http://127.0.0.1:${PORT}`
const PHASE = process.env.AUDIT_PHASE || 'baseline'
const EVIDENZ =
  process.env.AUDIT_EVIDENCE_DIR ||
  '/workspace/docs/evidence/trip-workspace-information-architecture-2'
const SCHLUESSEL = 'jetnity:reise:v3'
const SHA = execSync('git rev-parse HEAD', { encoding: 'utf8' }).trim()
const DIRTY = execSync('git status --porcelain', { encoding: 'utf8' })
  .split('\n')
  .map((zeile) => zeile.trim())
  .filter(Boolean)

const VIEWPORTS = [
  { name: '360x800', width: 360, height: 800, hasTouch: true },
  { name: '390x844', width: 390, height: 844, hasTouch: true },
  { name: '768x1024', width: 768, height: 1024, hasTouch: true },
  { name: '1024x768', width: 1024, height: 768, hasTouch: false },
  { name: '1280x800', width: 1280, height: 800, hasTouch: false },
  { name: '1440x900', width: 1440, height: 900, hasTouch: false },
  { name: '1920x1080', width: 1920, height: 1080, hasTouch: false },
]

const JETZT_FIXTURE = '2026-09-30T09:00:00.000Z'
const NETZ_MUSTER = /\/api\/(flights|hotels|activities|mobility|rental-cars|reisebegleiter)\b/

function etappe(teil) {
  return {
    countryCode: 'ID',
    latitude: null,
    longitude: null,
    placeId: null,
    ...teil,
  }
}

function tag(teil) {
  return { title: null, items: [], ...teil }
}

function flugPunkt() {
  return {
    id: 'item-flight-zrh',
    kind: 'flight',
    title: 'ZRH–DPS',
    dayId: 'day-1',
    stageId: 'stage-1',
    note: null,
    position: 1,
    startsOn: '2026-10-12',
    startsAt: null,
    endsOn: null,
    endsAt: null,
    priceAmount: null,
    priceCurrency: null,
    provider: null,
    externalRef: null,
    bookingUrl: null,
    bookingStatus: 'unconfirmed',
    bookingSource: null,
    bookingConfirmedAt: null,
    mobilityMode: null,
    originPlaceId: null,
    destinationPlaceId: null,
    originName: null,
    destinationName: null,
    connectionRef: null,
    mobilityChanges: null,
    mobilityEvidence: null,
    rentalSupplier: null,
    vehicleClass: null,
    transmission: null,
    rentalEvidence: null,
  }
}

function reise(mitFlug = false) {
  return {
    id: 'trip-information-architecture-2',
    clientRef: 'trip-information-architecture-2',
    title: 'Zürich nach Bali',
    origin: 'Zürich',
    originPlaceId: 'geonames:2657896',
    startDate: '2026-10-12',
    endDate: '2026-10-22',
    travellers: 2,
    currency: 'CHF',
    budgetAmount: 4200,
    status: 'draft',
    pace: 'balanced',
    interests: ['beach'],
    travelWish: null,
    revision: 1,
    lastMutationId: null,
    stages: [
      etappe({
        id: 'stage-1',
        position: 1,
        name: 'Ubud',
        arrivalDate: '2026-10-12',
        departureDate: '2026-10-16',
        placeId: 'geonames:1622786',
      }),
      etappe({
        id: 'stage-2',
        position: 2,
        name: 'Singapur',
        countryCode: 'SG',
        arrivalDate: '2026-10-19',
        departureDate: '2026-10-22',
      }),
    ],
    days: [
      tag({
        id: 'day-1',
        stageId: 'stage-1',
        dayIndex: 1,
        dayDate: '2026-10-12',
        items: mitFlug ? [flugPunkt()] : [],
      }),
      tag({ id: 'day-2', stageId: 'stage-1', dayIndex: 2, dayDate: '2026-10-13' }),
      tag({ id: 'day-3', stageId: 'stage-2', dayIndex: 3, dayDate: '2026-10-19' }),
    ],
    ohneTag: [],
    createdAt: JETZT_FIXTURE,
    updatedAt: JETZT_FIXTURE,
  }
}

const LUECKE = reise(false)
const MIT_PUNKT = reise(true)
MIT_PUNKT.id = 'trip-information-architecture-2-item'
MIT_PUNKT.clientRef = MIT_PUNKT.id

const UNAVAILABLE = {
  status: 'unavailable',
  message: 'Simulated unavailable. No live provider call.',
  coverageNote: 'Intercepted in trip-workspace-information-architecture-2-audit.',
  options: [],
}

async function upstreamErreichbar() {
  try {
    const antwort = await fetch(UPSTREAM, { redirect: 'manual' })
    return antwort.status > 0
  } catch {
    return false
  }
}

function proxyStarten(port, upstreamUrl) {
  const upstream = new URL(upstreamUrl)
  const zielPort = Number(upstream.port || 80)
  const zielHost = upstream.hostname
  const server = http.createServer((req, res) => {
    const headers = { ...req.headers, host: upstream.host }
    delete headers.origin
    const preq = http.request(
      { hostname: zielHost, port: zielPort, path: req.url, method: req.method, headers },
      (pres) => {
        res.writeHead(pres.statusCode || 502, pres.headers)
        pres.pipe(res)
      },
    )
    preq.on('error', () => {
      if (!res.headersSent) res.writeHead(502)
      res.end()
    })
    req.pipe(preq)
  })
  server.on('upgrade', (req, socket, head) => {
    const headers = { ...req.headers, host: upstream.host }
    delete headers.origin
    const lines = [`${req.method} ${req.url} HTTP/1.1`]
    for (const [key, value] of Object.entries(headers)) {
      if (value == null) continue
      lines.push(`${key}: ${Array.isArray(value) ? value.join(', ') : value}`)
    }
    const verbindung = net.connect(zielPort, zielHost, () => {
      verbindung.write(`${lines.join('\r\n')}\r\n\r\n`)
      if (head?.length) verbindung.write(head)
      socket.pipe(verbindung)
      verbindung.pipe(socket)
    })
    verbindung.on('error', () => socket.destroy())
    socket.on('error', () => verbindung.destroy())
  })
  return new Promise((resolve) => {
    server.listen(Number(port), '127.0.0.1', () => resolve(server))
  })
}

async function serverStarten() {
  let kind = null
  if (!(await upstreamErreichbar())) {
    const upstreamPort = new URL(UPSTREAM).port || '3000'
    kind = spawn('npm', ['run', 'dev', '--', '-p', upstreamPort, '-H', '127.0.0.1'], {
      env: {
        ...process.env,
        JETNITY_UI_AUDIT: '1',
        NEXT_PUBLIC_SUPABASE_URL: process.env.NEXT_PUBLIC_SUPABASE_URL || 'https://placeholder.supabase.co',
        NEXT_PUBLIC_SUPABASE_ANON_KEY:
          process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY ||
          'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InBsYWNlaG9sZGVyIiwicm9sZSI6ImFub24iLCJpYXQiOjE2OTAwMDAwMDAsImV4cCI6MjAwMDAwMDAwMH0.audit',
        NEXT_PUBLIC_APP_URL: UPSTREAM,
      },
      stdio: ['ignore', 'pipe', 'pipe'],
    })
    const start = Date.now()
    while (Date.now() - start < 90_000) {
      if (await upstreamErreichbar()) break
      await new Promise((resolve) => setTimeout(resolve, 400))
    }
    if (!(await upstreamErreichbar())) throw new Error('Dev-Server wurde nicht erreichbar.')
  }
  const proxy = await proxyStarten(PORT, UPSTREAM)
  return { kind, proxy, reused: kind == null }
}

async function abfangen(page, netz) {
  // Next.js Dev blockt /_next-Chunks, sobald der Browser ein Origin mitschickt.
  // Der Audit bleibt auf 127.0.0.1. Das ist keine Produktroute.
  await page.route('**/*', async (route) => {
    const headers = { ...route.request().headers() }
    delete headers.origin
    await route.continue({ headers })
  })
  const muster = [
    '**/api/flights/search',
    '**/api/hotels/search',
    '**/api/activities/search',
    '**/api/mobility/search',
    '**/api/rental-cars/search',
    '**/api/reisebegleiter/**',
  ]
  for (const url of muster) {
    await page.route(url, async (route) => {
      netz.push({ url: route.request().url(), method: route.request().method(), phase: 'intercept' })
      await route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify(UNAVAILABLE),
      })
    })
  }
  page.on('request', (request) => {
    if (!NETZ_MUSTER.test(request.url())) return
    if (netz.some((eintrag) => eintrag.url === request.url() && eintrag.method === request.method())) return
    netz.push({ url: request.url(), method: request.method(), phase: 'observed' })
  })
}

async function hydrationWarten(page) {
  await page.waitForFunction(
    () => {
      if (document.querySelector('[aria-busy="true"]')) return false
      const heading = document.querySelector('h1')
      return heading instanceof HTMLElement && heading.getClientRects().length > 0
    },
    { timeout: 30_000 },
  )
}

async function workspaceOeffnen(page, fixture, such = '') {
  await page.addInitScript(
    ({ schluessel, reise }) => {
      window.localStorage.setItem(schluessel, JSON.stringify(reise))
    },
    { schluessel: SCHLUESSEL, reise: fixture },
  )
  await page.goto(`${BASIS}/reisen/${fixture.id}${such}`, { waitUntil: 'load', timeout: 60_000 })
  await page.evaluate(
    ({ schluessel, reise }) => {
      window.localStorage.setItem(schluessel, JSON.stringify(reise))
    },
    { schluessel: SCHLUESSEL, reise: fixture },
  )
  await page.reload({ waitUntil: 'load', timeout: 60_000 })
  await hydrationWarten(page)
  await page.waitForFunction(
    () => {
      const heading = document.querySelector('[data-workspace-modus-heading], [data-workspace-detail] h2')
      return heading instanceof HTMLElement && heading.getClientRects().length > 0
    },
    { timeout: 20_000 },
  )
}

async function messen(page, extra = {}) {
  return page.evaluate((zusatz) => {
    const rechteck = (el) => {
      if (!(el instanceof HTMLElement)) return null
      const r = el.getBoundingClientRect()
      const sichtbar = !el.hidden && el.getClientRects().length > 0 && r.width > 0 && r.height > 0
      return {
        tag: el.tagName,
        text: (el.innerText || el.getAttribute('aria-label') || '').replace(/\s+/g, ' ').trim().slice(0, 160),
        top: Math.round(r.top),
        left: Math.round(r.left),
        width: Math.round(r.width),
        height: Math.round(r.height),
        bottom: Math.round(r.bottom),
        right: Math.round(r.right),
        docTop: Math.round(r.top + window.scrollY),
        intersectsViewport: sichtbar && r.bottom > 0 && r.top < window.innerHeight && r.right > 0 && r.left < window.innerWidth,
        fullyInViewport: sichtbar && r.top >= 0 && r.left >= 0 && r.bottom <= window.innerHeight && r.right <= window.innerWidth,
      }
    }

    const bereich = (name) => {
      const el = document.querySelector(`[data-arbeitsbereich="${name}"]`)
      if (!(el instanceof HTMLElement)) return { name, mounted: false, visible: false, box: null }
      const box = rechteck(el)
      return { name, mounted: true, visible: !el.hidden && el.getClientRects().length > 0, box }
    }

    const sichtbar = (el) => el instanceof HTMLElement && !el.hidden && el.getClientRects().length > 0
    const detail = document.querySelector('[data-workspace-detail]')
    const detailHuelle = document.querySelector('[data-arbeitsbereich="detail"]')
    const uebersicht = document.querySelector('[data-arbeitsbereich="uebersicht"]')
    const plan = document.querySelector('[data-tagesplan-modul]')
    const vorbereitung = document.getElementById('reisevorbereitung-titel')
    const sicherheit = document.querySelector('[data-safety-foundation]')
    const saison = document.querySelector('[data-seasonal-foundation]')
    const modusHeading = document.querySelector('[data-workspace-modus-heading]')
    const modusNav = document.querySelector('[data-workspace-mode-nav]')
    const domainNav = document.querySelector('[data-workspace-domain-nav]')
    const detailHeading = detail?.querySelector('h2') ?? null
    const detailEyebrow =
      detailHeading?.previousElementSibling instanceof HTMLElement ? detailHeading.previousElementSibling : null
    const suchNamen = ['flugsuche', 'hotelsuche', 'aktivitaeten', 'mobilitaet']
    const sichtbareArbeit = suchNamen
      .map((name) => document.querySelector(`[data-arbeitsbereich="${name}"]`))
      .find((el) => sichtbar(el))
    const arbeitHeading = sichtbareArbeit?.querySelector('h2') ?? null
    const arbeitEyebrow =
      arbeitHeading?.previousElementSibling instanceof HTMLElement ? arbeitHeading.previousElementSibling : null
    const erstesFeld = sichtbareArbeit?.querySelector('input:not([type="hidden"]), select, textarea') ?? null
    const header = document.querySelector('header')
    const rueckkehr = document.querySelector('nav[aria-label="Reise"]')
    const abdeckungsBand = (el) => {
      if (!(el instanceof HTMLElement)) return null
      const stil = getComputedStyle(el)
      if (stil.position !== 'sticky' && stil.position !== 'fixed') return null
      const rand = el.getBoundingClientRect()
      if (rand.height <= 0 || rand.width <= 0) return null
      return { top: rand.top, bottom: rand.bottom, height: rand.height }
    }
    const baender = [abdeckungsBand(header), abdeckungsBand(modusNav), abdeckungsBand(rueckkehr)].filter(Boolean)
    baender.sort((a, b) => a.top - b.top)
    let abdeckungUnten = 0
    for (const band of baender) {
      if (band.top > abdeckungUnten + 1) break
      abdeckungUnten = Math.max(abdeckungUnten, band.bottom)
    }
    const headingBox = arbeitHeading instanceof HTMLElement ? arbeitHeading.getBoundingClientRect() : null
    const eyebrowBox = arbeitEyebrow instanceof HTMLElement ? arbeitEyebrow.getBoundingClientRect() : null
    const feldBox = erstesFeld instanceof HTMLElement ? erstesFeld.getBoundingClientRect() : null
    const identitaetOben = eyebrowBox && headingBox && eyebrowBox.bottom <= headingBox.top + 8 ? eyebrowBox.top : headingBox?.top
    const identitaetUnterAbdeckung = Boolean(
      headingBox &&
        identitaetOben != null &&
        identitaetOben >= abdeckungUnten - 1 &&
        headingBox.bottom > abdeckungUnten &&
        headingBox.top < window.innerHeight &&
        (!feldBox || feldBox.top >= headingBox.top - 1),
    )
    const detailHeadingBox = detailHeading instanceof HTMLElement ? detailHeading.getBoundingClientRect() : null
    const detailEyebrowBox = detailEyebrow instanceof HTMLElement ? detailEyebrow.getBoundingClientRect() : null
    const detailOben =
      detailEyebrowBox && detailHeadingBox && detailEyebrowBox.bottom <= detailHeadingBox.top + 8
        ? detailEyebrowBox.top
        : detailHeadingBox?.top
    const zurueckKnoepfe = [...document.querySelectorAll('button')].filter((el) => {
      if (!(el instanceof HTMLElement)) return false
      if (el.hidden || el.closest('[hidden]')) return false
      const rand = el.getBoundingClientRect()
      if (rand.width <= 0 || rand.height <= 0) return false
      return (el.innerText || '').includes('Zurück zur Reise')
    })
    const detailIdentitaetUnterAbdeckung = Boolean(
      detailHeadingBox &&
        detailOben != null &&
        detailOben >= abdeckungUnten - 1 &&
        detailHeadingBox.bottom > abdeckungUnten &&
        detailHeadingBox.top < window.innerHeight,
    )
    const grid = document.querySelector('[data-workspace-split]')
    const gridStil = grid ? getComputedStyle(grid) : null
    const gridBox = grid instanceof HTMLElement ? grid.getBoundingClientRect() : null
    const aktiv = document.activeElement
    const aktivIstSeite = aktiv === document.body || aktiv === document.documentElement
    const detailBox = rechteck(detail)
    const arbeitBox = rechteck(sichtbareArbeit)
    const uebersichtBox = rechteck(uebersicht)
    const planBox = rechteck(plan)
    const arbeitImDetailKontext = Boolean(
      detailBox &&
        arbeitBox &&
        Math.abs(arbeitBox.left - detailBox.left) <= 48 &&
        arbeitBox.top >= detailBox.top - 8 &&
        arbeitBox.top < detailBox.bottom + window.innerHeight,
    )
    const arbeitUnterDemSplit = Boolean(
      grid &&
        arbeitBox &&
        detailHuelle &&
        grid.contains(detailHuelle) &&
        !grid.contains(sichtbareArbeit) &&
        arbeitBox.top >= grid.getBoundingClientRect().bottom - 8,
    )
    const planInUebersicht = Boolean(plan && uebersicht && uebersicht.contains(plan) && sichtbar(plan))
    const vorbereitungInUebersicht = Boolean(
      vorbereitung && uebersicht && uebersicht.contains(vorbereitung) && sichtbar(vorbereitung),
    )
    const shellBreite = gridBox ? Math.round(gridBox.width) : Math.round(document.documentElement.clientWidth)
    const planVolleBreite = Boolean(planBox && shellBreite > 0 && planBox.width >= shellBreite - 32)
    const modusKnoepfe = [...document.querySelectorAll('[data-workspace-mode-nav] button')].map((el) => {
      const rand = el.getBoundingClientRect()
      return {
        text: (el.innerText || '').replace(/\s+/g, ' ').trim(),
        current: el.getAttribute('aria-current'),
        height: Math.round(rand.height),
        width: Math.round(rand.width),
      }
    })
    const domainKnoepfe = [...document.querySelectorAll('[data-workspace-domain-nav] button')].map((el) => {
      const rand = el.getBoundingClientRect()
      return {
        text: (el.innerText || '').replace(/\s+/g, ' ').trim().slice(0, 80),
        current: el.getAttribute('aria-current'),
        height: Math.round(rand.height),
        bereich: el.getAttribute('data-bereich'),
      }
    })
    const toteFlaeche = Boolean(
      uebersichtBox &&
        detailBox &&
        gridStil &&
        gridStil.display === 'grid' &&
        uebersichtBox.height > detailBox.height + 400 &&
        planInUebersicht,
    )

    return {
      href: window.location.pathname + window.location.search,
      viewport: { width: window.innerWidth, height: window.innerHeight },
      scrollY: Math.round(window.scrollY),
      scrollHeight: document.documentElement.scrollHeight,
      clientWidth: document.documentElement.clientWidth,
      scrollWidth: document.documentElement.scrollWidth,
      horizontalOverflow: document.documentElement.scrollWidth > document.documentElement.clientWidth + 1,
      activeElement: aktiv
        ? {
            tag: aktiv.tagName,
            text: aktivIstSeite
              ? ''
              : (aktiv.innerText || aktiv.getAttribute('aria-label') || aktiv.getAttribute('placeholder') || '')
                  .replace(/\s+/g, ' ')
                  .trim()
                  .slice(0, 120),
            type: aktiv.getAttribute('type'),
            current: aktiv.getAttribute('aria-current'),
          }
        : null,
      grid: gridStil
        ? {
            display: gridStil.display,
            template: gridStil.gridTemplateColumns,
          }
        : null,
      modusHeading: rechteck(modusHeading),
      modusNav: rechteck(modusNav),
      modusKnoepfe,
      domainNav: rechteck(domainNav),
      domainKnoepfe,
      ansicht: document.querySelector('[data-workspace-ansicht]')?.getAttribute('data-workspace-ansicht') ?? null,
      bereich: document.querySelector('[data-workspace-bereich]')?.getAttribute('data-workspace-bereich') ?? null,
      detail: detailBox,
      detailHeading: rechteck(detailHeading),
      detailEyebrow: rechteck(detailEyebrow),
      detailIdentitaetUnterAbdeckung,
      zurueckAnzahl: zurueckKnoepfe.length,
      zurueckInDetail: zurueckKnoepfe.filter((el) => el.closest('[data-workspace-detail]')).length,
      zurueckSticky: zurueckKnoepfe.filter((el) => el.closest('nav[aria-label="Reise"]')).length,
      uebersicht: uebersichtBox,
      plan: planBox,
      planInUebersicht,
      planVolleBreite,
      vorbereitung: rechteck(vorbereitung),
      vorbereitungInUebersicht,
      sicherheitSichtbar: sichtbar(sicherheit),
      saisonSichtbar: sichtbar(saison),
      aendernSichtbar: [...document.querySelectorAll('button')].some(
        (el) => sichtbar(el) && (el.innerText || '').includes('Reise ändern'),
      ),
      begleiterSichtbar: [...document.querySelectorAll('button')].some(
        (el) => sichtbar(el) && (el.innerText || '').includes('Reisebegleiter'),
      ),
      arbeit: arbeitBox,
      arbeitName: sichtbareArbeit?.getAttribute('data-arbeitsbereich') ?? null,
      arbeitHeading: rechteck(arbeitHeading),
      arbeitEyebrow: rechteck(arbeitEyebrow),
      erstesFeld: rechteck(erstesFeld),
      header: rechteck(header),
      rueckkehr: rechteck(rueckkehr),
      abdeckungUnten: Math.round(abdeckungUnten),
      identitaetUnterAbdeckung,
      bereiche: ['uebersicht', 'detail', 'fluege', 'unterkunft', 'flugsuche', 'hotelsuche', 'aktivitaeten', 'mobilitaet'].map(
        bereich,
      ),
      arbeitImDetailKontext,
      arbeitUnterDemSplit,
      toteFlaeche,
      anordnung: document.querySelector('[data-workspace-anordnung]')?.getAttribute('data-workspace-anordnung') ?? null,
      ...zusatz,
    }
  }, extra)
}

async function knopfKlick(page, locator, tastatur) {
  await locator.scrollIntoViewIfNeeded()
  if (tastatur) {
    await locator.focus()
    await page.keyboard.press('Enter')
  } else {
    await locator.click()
  }
  await page.waitForTimeout(180)
}

async function speichern(page, name) {
  const datei = join(EVIDENZ, 'screens', PHASE, `${name}.png`)
  mkdirSync(join(EVIDENZ, 'screens', PHASE), { recursive: true })
  await page.screenshot({ path: datei, fullPage: false })
  return datei
}

async function modusWarten(page, ansicht, bereich = null) {
  await page.waitForFunction(
    ({ ansicht: erwartet, bereich: erwartetBereich }) => {
      const wurzel = document.querySelector('[data-workspace-ansicht]')
      if (!wurzel) return false
      if (wurzel.getAttribute('data-workspace-ansicht') !== erwartet) return false
      const ist = wurzel.getAttribute('data-workspace-bereich') || ''
      return ist === (erwartetBereich || '')
    },
    { ansicht, bereich },
    { timeout: 10_000 },
  )
}

async function laufBaseline(page, viewport, notiere) {
  await workspaceOeffnen(page, LUECKE)
  await page.evaluate(() => window.scrollTo(0, 0))
  await notiere('baseline-overview', false, true)
  const fluege = page.getByRole('button', { name: 'Flüge', exact: true })
  await knopfKlick(page, fluege, false)
  await page.locator('[data-workspace-detail]').waitFor({ timeout: 10_000 })
  await page.waitForTimeout(120)
  await notiere('baseline-fluege', false, true)
}

async function laufNachher(page, viewport, notiere, netz) {
  const vorherNetz = () => netz.length
  await workspaceOeffnen(page, LUECKE)
  await modusWarten(page, 'uebersicht')
  await page.evaluate(() => window.scrollTo(0, 0))
  await notiere('overview', false, true)
  if (vorherNetz() !== 0) throw new Error(`Netzwerk beim Öffnen: ${netz.length}`)

  await knopfKlick(page, page.getByRole('button', { name: 'Reiseplan', exact: true }), false)
  await modusWarten(page, 'plan')
  await notiere('plan', false, true)

  await knopfKlick(page, page.getByRole('button', { name: 'Organisieren', exact: true }), false)
  await modusWarten(page, 'organisieren')
  await notiere('organisieren-leer', false, true)

  await knopfKlick(page, page.locator('[data-workspace-domain-nav] button[data-bereich="fluege"]'), false)
  await modusWarten(page, 'organisieren', 'fluege')
  await page.locator('[data-workspace-detail]').waitFor({ timeout: 10_000 })
  await notiere('fluege', false, true)
  const netzVorSuche = vorherNetz()
  await knopfKlick(page, page.getByRole('button', { name: 'Flug suchen', exact: true }), false)
  await page.locator('[data-arbeitsbereich="flugsuche"]').waitFor({ timeout: 10_000 })
  await page.waitForTimeout(150)
  await notiere('flug-suchen', false, true)
  if (vorherNetz() !== netzVorSuche) throw new Error('Flug suchen hat einen Provider-Aufruf ausgelöst')

  await page.keyboard.press('Escape')
  await page.waitForTimeout(150)
  await notiere('escape-nach-suche', true)

  for (const [name, bereich] of [
    ['unterkunft', 'unterkunft'],
    ['aktivitaeten', 'aktivitaeten'],
    ['mobilitaet', 'mobilitaet'],
  ]) {
    if ((await page.locator('[data-workspace-domain-nav]').count()) === 0) {
      const zurueck = page.locator('nav[aria-label="Reise"] button', { hasText: 'Zurück zur Reise' })
      if (await zurueck.count()) await knopfKlick(page, zurueck, false)
    }
    await knopfKlick(page, page.locator(`[data-workspace-domain-nav] button[data-bereich="${bereich}"]`), false)
    await modusWarten(page, 'organisieren', bereich)
    await page.waitForTimeout(120)
    await notiere(name, false, true)
  }

  await knopfKlick(page, page.getByRole('button', { name: 'Übersicht', exact: true }), false)
  await modusWarten(page, 'uebersicht')
  const netzVorAttention = vorherNetz()
  const flugHinweis = page.locator('[data-attention-punkt]').filter({ hasText: /Flug/ }).first()
  await knopfKlick(page, flugHinweis, false)
  await modusWarten(page, 'organisieren', 'fluege')
  await notiere('attention-flug', false, viewport.name === '1440x900')
  if (vorherNetz() !== netzVorAttention) throw new Error('Attention hat einen Provider-Aufruf ausgelöst')

  await knopfKlick(page, page.getByRole('button', { name: 'Übersicht', exact: true }), false)
  await modusWarten(page, 'uebersicht')
  const official = page.locator('[data-attention-punkt]').filter({ hasText: /Offizielle|Vorbereitung/ }).first()
  if (await official.count()) {
    await knopfKlick(page, official, false)
    await modusWarten(page, 'vorbereitung')
  } else {
    await knopfKlick(page, page.getByRole('button', { name: 'Vorbereitung', exact: true }), false)
    await modusWarten(page, 'vorbereitung')
  }
  await notiere('vorbereitung', false, true)

  await knopfKlick(page, page.getByRole('button', { name: 'Übersicht', exact: true }), true)
  await modusWarten(page, 'uebersicht')
  await knopfKlick(page, page.getByRole('button', { name: 'Reiseplan', exact: true }), true)
  await modusWarten(page, 'plan')
  await knopfKlick(page, page.locator('[data-workspace-mode-nav] button', { hasText: 'Organisieren' }), true)
  await modusWarten(page, 'organisieren')
  await knopfKlick(page, page.locator('[data-workspace-domain-nav] button[data-bereich="fluege"]'), true)
  await modusWarten(page, 'organisieren', 'fluege')
  await notiere('history-fluege', true, viewport.name === '1280x800')
  await page.goBack()
  await modusWarten(page, 'organisieren')
  await page.goBack()
  await modusWarten(page, 'plan')
  await page.goBack()
  await modusWarten(page, 'uebersicht')
  await notiere('history-back-overview', true)
  await page.goForward()
  await modusWarten(page, 'plan')
  await notiere('history-forward-plan', true, viewport.name === '390x844')

  await page.reload({ waitUntil: 'load' })
  await hydrationWarten(page)
  await modusWarten(page, 'plan')
  await notiere('reload-plan', false, viewport.name === '360x800')

  await page.goto(`${BASIS}/reisen/${LUECKE.id}?ansicht=organisieren&bereich=unterkunft`, {
    waitUntil: 'load',
  })
  await hydrationWarten(page)
  await modusWarten(page, 'organisieren', 'unterkunft')
  await notiere('deeplink-unterkunft', false, viewport.name === '1024x768')

  await page.goto(`${BASIS}/reisen/${LUECKE.id}?ansicht=unbekannt&bereich=fluege&spur=bleibt`, {
    waitUntil: 'load',
  })
  await hydrationWarten(page)
  await modusWarten(page, 'uebersicht')
  await page.waitForFunction(
    () => new URL(window.location.href).searchParams.get('ansicht') == null && new URL(window.location.href).searchParams.get('spur') === 'bleibt',
    { timeout: 10_000 },
  )
  await notiere('invalid-query', false, viewport.name === '768x1024')

  const aendern = page.getByRole('button', { name: /Reise ändern|Änderung schliessen/ })
  await knopfKlick(page, aendern, true)
  await page.locator('#reise-aenderung textarea').waitFor({ timeout: 10_000 })
  await notiere('aenderung-offen', true, viewport.name === '1440x900' || viewport.name === '360x800')
  await page.keyboard.press('Escape')
  await page.waitForTimeout(120)
  await notiere('aenderung-escape', true)

  await page.goto('about:blank')
  await workspaceOeffnen(page, MIT_PUNKT, '?ansicht=plan')
  await modusWarten(page, 'plan')
  const punkt = page.getByRole('button', { name: 'Flug ZRH–DPS', exact: true })
  await knopfKlick(page, punkt, false)
  await page.locator('[data-workspace-detail="item"]').waitFor({ timeout: 10_000 })
  await notiere('item-detail', false, viewport.name === '1440x900' || viewport.name === '390x844')

  await workspaceOeffnen(page, LUECKE, '?ansicht=organisieren&bereich=fluege')
  await modusWarten(page, 'organisieren', 'fluege')
  const kompakt = viewport.width < 1024
  if (kompakt) {
    const zurueck = page.locator('nav[aria-label="Reise"] button', { hasText: 'Zurück zur Reise' })
    await knopfKlick(page, zurueck, false)
    await modusWarten(page, 'organisieren')
    await notiere('compact-back', false, true)
  } else {
    await page.keyboard.press('Escape')
    await page.waitForTimeout(150)
    await modusWarten(page, 'organisieren')
    await notiere('desktop-escape', true, viewport.name === '1920x1080')
  }
}

async function laufAssistant(browser) {
  const viewport = VIEWPORTS.find((eintrag) => eintrag.name === '1440x900')
  const ctx = await browser.newContext({
    viewport: { width: viewport.width, height: viewport.height },
    hasTouch: false,
    deviceScaleFactor: 1,
  })
  const page = await ctx.newPage()
  const netz = []
  const schritte = []
  const fehler = []
  await abfangen(page, netz)
  const notiere = async (name) => {
    const stand = await messen(page, { step: name, netz: netz.length })
    const screenshot = await speichern(page, `${name}_1440x900`)
    schritte.push({ name, screenshot, ...stand })
    return stand
  }
  try {
    await page.addInitScript(
      ({ reise }) => {
        sessionStorage.setItem(
          'jetnity:ui-audit:workspace',
          JSON.stringify({ reise, quelle: 'account', mitAenderung: true, mitBegleiter: true, mitSuche: true }),
        )
      },
      { reise: LUECKE },
    )
    await page.goto(`${BASIS}/ui-audit/trip-workspace`, { waitUntil: 'load', timeout: 60_000 })
    await page.getByRole('button', { name: /Reisebegleiter/ }).waitFor({ timeout: 20_000 })
    const vorher = netz.length
    await knopfKlick(page, page.getByRole('button', { name: /Reisebegleiter fragen/ }), true)
    await page.locator('#reisebegleiter textarea').waitFor({ timeout: 10_000 })
    await notiere('assistant-offen')
    if (netz.length !== vorher) throw new Error('Reisebegleiter hat beim Öffnen einen Aufruf ausgelöst')
    await page.keyboard.press('Escape')
    await page.waitForTimeout(120)
    await notiere('assistant-escape')
  } catch (error) {
    fehler.push(String(error && error.stack ? error.stack : error))
    try {
      await speichern(page, 'error_assistant_1440x900')
    } catch {
      // optional
    }
  }
  await ctx.close()
  return { viewport: '1440x900-assistant', schritte, fehler, netz }
}

async function lauf(browser, viewport) {
  const ctx = await browser.newContext({
    viewport: { width: viewport.width, height: viewport.height },
    hasTouch: viewport.hasTouch,
    deviceScaleFactor: 1,
  })
  const page = await ctx.newPage()
  const netz = []
  const schritte = []
  const fehler = []
  await abfangen(page, netz)

  const notiere = async (name, tastatur = false, screen = false) => {
    const stand = await messen(page, { step: name, keyboard: tastatur, netz: netz.length })
    let screenshot = null
    if (screen) screenshot = await speichern(page, `${name}_${viewport.name}`)
    schritte.push({ name, screenshot, ...stand })
    return stand
  }

  try {
    if (PHASE === 'baseline') await laufBaseline(page, viewport, notiere)
    else await laufNachher(page, viewport, notiere, netz)
  } catch (error) {
    fehler.push(String(error && error.stack ? error.stack : error))
    try {
      await speichern(page, `error_${viewport.name}`)
    } catch {
      // optional
    }
  }

  await ctx.close()
  return { viewport: viewport.name, schritte, fehler, netz }
}

async function main() {
  mkdirSync(join(EVIDENZ, 'screens', PHASE), { recursive: true })
  const server = await serverStarten()
  const browser = await chromium.launch({
    headless: true,
    executablePath: process.env.AUDIT_CHROME || '/opt/google/chrome/chrome',
    args: ['--no-sandbox', '--disable-dev-shm-usage'],
  })
  const laeufe = []
  try {
    const nur = process.env.AUDIT_ONLY?.split(',').map((name) => name.trim()).filter(Boolean)
    const viewports = nur?.length ? VIEWPORTS.filter((viewport) => nur.includes(viewport.name)) : VIEWPORTS
    for (const viewport of viewports) {
      laeufe.push(await lauf(browser, viewport))
    }
    if (PHASE === 'after' && !nur?.length) laeufe.push(await laufAssistant(browser))
  } finally {
    await browser.close()
    try {
      server.proxy?.close()
    } catch {
      // already gone
    }
    if (server.kind) {
      try {
        server.kind.kill('SIGTERM')
      } catch {
        // already gone
      }
    }
  }

  const bericht = {
    phase: PHASE,
    sha: SHA,
    workingTree: DIRTY.length === 0 ? 'clean' : 'dirty',
    dirtyPaths: DIRTY,
    capturedAt: new Date().toISOString(),
    browser: 'google-chrome/playwright',
    origin: BASIS,
    server: server.reused ? 'reused-existing-dev' : 'spawned-dev',
    simulationClass: 'synthetic-guest-local + intercepted-unavailable',
    accountShell: 'same TripWorkspace via KontoArbeitsbereich; assistant pass uses the audit route with mitBegleiter',
    route: `/reisen/${LUECKE.id}`,
    laeufe,
  }
  writeFileSync(join(EVIDENZ, `audit-${PHASE}.json`), JSON.stringify(bericht, null, 2))
  const problemen = laeufe.filter((eintrag) => eintrag.fehler.length > 0)
  console.log(
    JSON.stringify(
      {
        phase: PHASE,
        sha: SHA,
        viewports: laeufe.map((eintrag) => ({
          viewport: eintrag.viewport,
          steps: eintrag.schritte.length,
          errors: eintrag.fehler.length,
          netz: eintrag.netz?.length ?? 0,
          scrollHeight: eintrag.schritte[0]?.scrollHeight ?? null,
        })),
      },
      null,
      2,
    ),
  )
  if (problemen.length > 0) {
    console.error(problemen.map((eintrag) => `${eintrag.viewport}: ${eintrag.fehler[0]}`).join('\n'))
    process.exitCode = 1
  }
}

main().catch((error) => {
  console.error(error)
  process.exit(1)
})
