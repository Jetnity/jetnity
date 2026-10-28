#!/usr/bin/env node
// scripts/ux-u1a3-header-density-1/audit.mjs
//
// Mounted browser evidence for UX V1 U1-A3.
// Real PublicNavbar via /ui-audit/trip-workspace, real Kopf and Übersicht.
// The audit hint is rewritten to the GastArbeitsbereich notice. The audit
// client does not pass kopfzeile, so the production discard/delete row is
// inserted as the next sibling of the identity card. Same trip before/after.
// No provider, Auth, or Production calls. Not zoom200, OS keyboard, VoiceOver,
// or Work A01–A16.

import { execSync, spawn } from 'node:child_process'
import { mkdirSync, writeFileSync } from 'node:fs'
import { join } from 'node:path'
import { chromium } from 'playwright'

const PORT = process.env.AUDIT_PORT || '3473'
const BASIS = process.env.AUDIT_BASE || `http://127.0.0.1:${PORT}`
const PHASE = process.env.AUDIT_PHASE || 'before'
const EVIDENZ = process.env.AUDIT_EVIDENCE_DIR || join(process.cwd(), 'docs/evidence/ux-v1-u1a3-header-density-1')
const BILDER = process.env.AUDIT_SCREENSHOT_DIR || '/opt/cursor/artifacts/ux-u1a3'
const SHA = execSync('git rev-parse HEAD', { encoding: 'utf8' }).trim()
const NETZ_MUSTER = /\/api\/(flights|hotels|activities|mobility|rental-cars|reisebegleiter)\b/

const TITEL_KURZ = 'Thailand Rundreise'
const TITEL_LANG =
  'Thailand Rundreise mit einem bewusst sehr langen gespeicherten Titel der nicht aus den Etappen erfunden wird und auch bei schmaler Breite vollständig lesbar bleiben muss ohne abgeschnitten zu werden'

const GAST_HINWEIS =
  'Dieser Entwurf liegt nur in diesem Browser. Mit einem Konto wird er dauerhaft gespeichert und auf allen Geräten sichtbar – Konto erstellen oder anmelden. Deine Reise wird dabei übernommen.'

const VIEWPORTS = [
  { name: '280', width: 280, height: 640 },
  { name: '320', width: 320, height: 720 },
  { name: '360', width: 360, height: 800 },
  { name: '390', width: 390, height: 844 },
  { name: '430', width: 430, height: 932 },
  { name: '768', width: 768, height: 1024 },
  { name: '1440', width: 1440, height: 1000 },
]

function etappe(teil) {
  return { countryCode: 'TH', latitude: null, longitude: null, placeId: null, ...teil }
}

function tag(teil) {
  return { title: null, items: [], ...teil }
}

function reise(titel) {
  return {
    id: 'trip-ux-u1a3-header-density-1',
    clientRef: 'trip-ux-u1a3-header-density-1',
    title: titel,
    origin: 'Zürich',
    originPlaceId: 'geonames:2657896',
    startDate: '2026-11-02',
    endDate: '2026-11-23',
    travellers: 2,
    currency: 'CHF',
    budgetAmount: null,
    status: 'draft',
    pace: 'balanced',
    interests: [],
    travelWish: null,
    revision: 1,
    lastMutationId: null,
    stages: [
      etappe({ id: 'stage-bkk-1', position: 1, name: 'Bangkok', arrivalDate: '2026-11-02', departureDate: '2026-11-06', placeId: 'geonames:1609350' }),
      etappe({ id: 'stage-ko-chang', position: 2, name: 'Ko Chang', arrivalDate: '2026-11-06', departureDate: '2026-11-11' }),
      etappe({ id: 'stage-hkt', position: 3, name: 'Phuket', arrivalDate: '2026-11-11', departureDate: '2026-11-18' }),
      etappe({ id: 'stage-bkk-2', position: 4, name: 'Bangkok', arrivalDate: '2026-11-18', departureDate: '2026-11-23', placeId: 'geonames:1609350' }),
    ],
    days: [
      tag({ id: 'day-1', stageId: 'stage-bkk-1', dayIndex: 1, dayDate: '2026-11-02' }),
      tag({ id: 'day-2', stageId: 'stage-ko-chang', dayIndex: 2, dayDate: '2026-11-06' }),
      tag({ id: 'day-3', stageId: 'stage-hkt', dayIndex: 3, dayDate: '2026-11-11' }),
      tag({ id: 'day-4', stageId: 'stage-bkk-2', dayIndex: 4, dayDate: '2026-11-18' }),
    ],
    ohneTag: [],
    createdAt: '2026-10-28T00:00:00.000Z',
    updatedAt: '2026-10-28T00:00:00.000Z',
  }
}

function nutzlast(quelle, titel) {
  return {
    reise: reise(titel),
    quelle,
    mitAenderung: true,
    mitSuche: false,
    gastHinweis: quelle === 'guest',
  }
}

function faelleFuer(viewport) {
  const faelle = [{ name: 'gast', quelle: 'guest', lang: false, rootPx: null }]
  if (['280', '390', '768', '1440'].includes(viewport.name)) {
    faelle.push({ name: 'gast-lang', quelle: 'guest', lang: true, rootPx: null })
  }
  if (['390', '1440'].includes(viewport.name)) {
    faelle.push({ name: 'konto', quelle: 'account', lang: false, rootPx: null })
  }
  if (['320', '390', '1440'].includes(viewport.name)) {
    faelle.push({ name: 'gast-root32', quelle: 'guest', lang: true, rootPx: 32 })
  }
  return faelle
}

async function auditRouteOffen() {
  try {
    const antwort = await fetch(`${BASIS}/ui-audit/trip-workspace`, { signal: AbortSignal.timeout(2000) })
    return antwort.status !== 404 && antwort.status < 500
  } catch {
    return false
  }
}

async function serverStarten() {
  if (await auditRouteOffen()) return null
  const kind = spawn('npx', ['next', 'dev', '-p', PORT, '-H', '127.0.0.1'], {
    env: {
      ...process.env,
      JETNITY_UI_AUDIT: '1',
      NEXT_PUBLIC_SUPABASE_URL: process.env.NEXT_PUBLIC_SUPABASE_URL || 'https://placeholder.supabase.co',
      NEXT_PUBLIC_SUPABASE_ANON_KEY:
        process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY ||
        'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InBsYWNlaG9sZGVyIiwicm9sZSI6ImFub24iLCJpYXQiOjE2OTAwMDAwMDAsImV4cCI6MjAwMDAwMDAwMH0.audit',
      NEXT_PUBLIC_APP_URL: BASIS,
      NEXT_TELEMETRY_DISABLED: '1',
    },
    stdio: ['ignore', 'pipe', 'pipe'],
    detached: true,
  })
  let log = ''
  kind.stdout.on('data', (chunk) => {
    log += chunk.toString()
  })
  kind.stderr.on('data', (chunk) => {
    log += chunk.toString()
  })
  const start = Date.now()
  while (Date.now() - start < 180_000) {
    if (await auditRouteOffen()) return kind
    if (kind.exitCode != null) break
    await new Promise((resolve) => setTimeout(resolve, 400))
  }
  throw new Error(`Audit-Server wurde nicht erreichbar.\n${log.slice(-2000)}`)
}

async function oeffnen(page, quelle, titel, rootPx) {
  const netz = []
  await page.route('**/*', async (route) => {
    const url = route.request().url()
    if (NETZ_MUSTER.test(url)) {
      netz.push(url)
      await route.abort()
      return
    }
    const headers = { ...route.request().headers() }
    delete headers.origin
    await route.continue({ headers })
  })
  await page.addInitScript((wert) => {
    sessionStorage.setItem('jetnity:ui-audit:workspace', JSON.stringify(wert))
  }, nutzlast(quelle, titel))
  await page.goto(`${BASIS}/ui-audit/trip-workspace`, { waitUntil: 'load', timeout: 180_000 })
  if (rootPx) {
    await page.addStyleTag({ content: `html { font-size: ${rootPx}px !important; }` })
    await page.evaluate(() => window.dispatchEvent(new Event('resize')))
  }
  await page.waitForFunction(
    () => {
      const kopf = document.querySelector('[data-workspace-identity]')
      const aktionen = document.querySelector('[data-workspace-aktionen]')
      const heading = document.querySelector('#workspace-uebersicht-titel')
      if (!(heading instanceof HTMLElement) || heading.getClientRects().length === 0) return false
      if (document.querySelector('[aria-busy="true"]')) return false
      const kopfBereit = kopf?.getAttribute('data-u1a3-bereit')
      const aktionenBereit = aktionen?.getAttribute('data-u1a3-bereit')
      if (kopfBereit == null && aktionenBereit == null) return true
      return kopfBereit === '1' && aktionenBereit === '1'
    },
    { timeout: 60_000 },
  )
  await page.evaluate((gast) => {
    window.scrollTo(0, 0)
    const hinweis = [...document.querySelectorAll('p')].find((el) =>
      (el.textContent || '').includes('Dieser Entwurf liegt nur in diesem Browser'),
    )
    if (gast && hinweis) {
      hinweis.className =
        'mt-3 flex items-start gap-2 rounded-xl border border-line-200 bg-white px-3 py-2 text-xs leading-5 text-ink-800'
      hinweis.textContent =
        'Dieser Entwurf liegt nur in diesem Browser. Mit einem Konto wird er dauerhaft gespeichert und auf allen Geräten sichtbar – Konto erstellen oder anmelden. Deine Reise wird dabei übernommen.'
    }
    document.querySelector('[data-u1a3-slot-synthetic]')?.remove()
    const kopf = document.querySelector('[data-workspace-identity]')
    if (!kopf) return
    const zeile = document.createElement('div')
    zeile.setAttribute('data-u1a3-slot-synthetic', gast ? 'verwerfen' : 'loeschen')
    zeile.className = 'mt-0'
    const knopf = document.createElement('button')
    knopf.type = 'button'
    knopf.className =
      'inline-flex min-h-11 shrink-0 items-center gap-2 rounded-full px-2 text-sm font-medium text-ink-800'
    knopf.textContent = gast ? 'Entwurf verwerfen' : 'Reise löschen'
    zeile.appendChild(knopf)
    kopf.insertAdjacentElement('afterend', zeile)
  }, quelle === 'guest')
  return netz
}

async function messen(page) {
  return page.evaluate(() => {
    const kasten = (el) => (el instanceof Element ? el.getBoundingClientRect() : null)
    const kopf = document.querySelector('[data-workspace-identity]')
    const titel = kopf?.querySelector('h1')
    const heading = document.querySelector('#workspace-uebersicht-titel')
    const wichtig = document.querySelector('[aria-label="Jetzt wichtig"]')
    const punkt = document.querySelector('[data-attention-punkt]')
    const aendern = [...document.querySelectorAll('button')].find((el) =>
      (el.textContent || '').includes('Reise ändern'),
    )
    const nav = document.querySelector('header')
    const ueberlauf = document.documentElement.scrollWidth - document.documentElement.clientWidth
    const titelKasten = kasten(titel)
    const seiteRechts = document.documentElement.clientWidth
    return {
      save: kopf?.getAttribute('data-save-truth') || null,
      dichte: kopf?.getAttribute('data-u1a3-dichte') || null,
      titel: (titel?.textContent || '').replace(/\s+/g, ' ').trim(),
      heading: (heading?.textContent || '').replace(/\s+/g, ' ').trim(),
      navbarY: nav ? Math.round(nav.getBoundingClientRect().top) : null,
      navbarHoehe: nav ? Math.round(nav.getBoundingClientRect().height) : null,
      headingY: heading ? Math.round(heading.getBoundingClientRect().top) : null,
      attentionY: wichtig ? Math.round(wichtig.getBoundingClientRect().top) : null,
      attentionPunktY: punkt ? Math.round(punkt.getBoundingClientRect().top) : null,
      aendernY: aendern ? Math.round(aendern.getBoundingClientRect().top) : null,
      aendernHoehe: aendern ? Math.round(aendern.getBoundingClientRect().height) : null,
      aendernExpanded: aendern?.getAttribute('aria-expanded') || null,
      aendernControls: aendern?.getAttribute('aria-controls') || null,
      titelRechts: titelKasten ? Math.round(titelKasten.right) : null,
      seiteRechts,
      ueberlauf,
      hinweis: (document.body.innerText || '').includes('auf allen Geräten sichtbar'),
      verwerfen: (document.body.innerText || '').includes('Entwurf verwerfen'),
      loeschen: (document.body.innerText || '').includes('Reise löschen'),
      geraet: (document.body.innerText || '').includes('Nur auf diesem Gerät'),
      konto: (document.body.innerText || '').includes('Im Konto gespeichert'),
      prozent: (document.querySelector('[aria-label="Reiseübersicht"]')?.innerText || '').includes('%'),
      innerWidth: window.innerWidth,
      innerHeight: window.innerHeight,
      rootPx: Number.parseFloat(getComputedStyle(document.documentElement).fontSize),
    }
  })
}

function imFeld(y, hoehe) {
  return y != null && y >= 0 && y < hoehe
}

function pruefen(name, stand, fall) {
  const fehler = []
  if (stand.ueberlauf > 1) fehler.push(`${name}: horizontaler Überlauf ${stand.ueberlauf}px`)
  if (stand.titelRechts != null && stand.titelRechts > stand.seiteRechts + 1) {
    fehler.push(`${name}: Titel ragt über den rechten Rand`)
  }
  if (stand.heading !== 'Deine Reise auf einen Blick') fehler.push(`${name}: Übersichtstitel fehlt`)
  if (stand.aendernHoehe == null || stand.aendernHoehe < 44) fehler.push(`${name}: Reise ändern unter 44px`)
  if (stand.aendernExpanded !== 'false') fehler.push(`${name}: aria-expanded ist nicht false`)
  if (stand.aendernControls !== 'reise-aenderung') fehler.push(`${name}: aria-controls fehlt`)
  if (stand.attentionY == null) fehler.push(`${name}: Jetzt wichtig fehlt`)
  if (stand.prozent) fehler.push(`${name}: Prozent im Überblick`)
  if (fall.quelle === 'guest') {
    if (stand.save !== 'device') fehler.push(`${name}: Speicherwahrheit ist nicht device`)
    if (!stand.geraet) fehler.push(`${name}: Gerätetext fehlt`)
    if (!stand.hinweis) fehler.push(`${name}: Gasthinnweis fehlt`)
    if (!stand.verwerfen) fehler.push(`${name}: Entwurf verwerfen fehlt`)
  } else {
    if (stand.save !== 'account') fehler.push(`${name}: Speicherwahrheit ist nicht account`)
    if (!stand.konto) fehler.push(`${name}: Kontotext fehlt`)
    if (!stand.loeschen) fehler.push(`${name}: Reise löschen fehlt`)
  }
  const erwartet = fall.lang ? TITEL_LANG : TITEL_KURZ
  if (stand.titel !== erwartet) fehler.push(`${name}: Titel wurde verändert`)
  return fehler
}

async function tastatur(page, name) {
  const knopf = page.getByRole('button', { name: 'Reise ändern', exact: true })
  await knopf.focus()
  const fokussiert = await knopf.evaluate((el) => document.activeElement === el)
  if (!fokussiert) throw new Error(`${name}: Fokus liegt nicht auf Reise ändern`)
  await knopf.press('Enter')
  await page.waitForFunction(
    () => {
      const el = [...document.querySelectorAll('button')].find((ziel) =>
        (ziel.textContent || '').includes('Änderung schliessen'),
      )
      const titel = document.querySelector('[data-edit-surface-title]')
      return (
        el?.getAttribute('aria-expanded') === 'true' &&
        el.getAttribute('aria-controls') === 'reise-aenderung' &&
        titel instanceof HTMLElement &&
        document.activeElement === titel
      )
    },
    null,
    { timeout: 10_000 },
  )
  await page.keyboard.press('Escape')
  await page.waitForFunction(
    () => {
      const el = [...document.querySelectorAll('button')].find(
        (ziel) => (ziel.textContent || '').replace(/\s+/g, ' ').trim() === 'Reise ändern',
      )
      return el?.getAttribute('aria-expanded') === 'false' && document.activeElement === el
    },
    null,
    { timeout: 10_000 },
  )
}

async function main() {
  mkdirSync(EVIDENZ, { recursive: true })
  mkdirSync(BILDER, { recursive: true })
  const server = await serverStarten()
  if (server) server.unref()
  const browser = await chromium.launch({ channel: 'chrome', headless: true })
  const fehler = []
  const laeufe = []
  try {
    for (const viewport of VIEWPORTS) {
      for (const fall of faelleFuer(viewport)) {
        const name = `${viewport.name}-${fall.name}`
        const context = await browser.newContext({ viewport: { width: viewport.width, height: viewport.height } })
        const page = await context.newPage()
        const titel = fall.lang ? TITEL_LANG : TITEL_KURZ
        const netz = await oeffnen(page, fall.quelle, titel, fall.rootPx)
        if (netz.length) fehler.push(`${name}: passive Anbieteraufrufe ${netz.join(', ')}`)
        const stand = await messen(page)
        stand.name = name
        stand.viewport = viewport
        stand.fall = fall.name
        stand.headingImFeld = imFeld(stand.headingY, viewport.height)
        stand.attentionImFeld = imFeld(stand.attentionY, viewport.height)
        stand.punktImFeld = imFeld(stand.attentionPunktY, viewport.height)
        stand.aendernImFeld = imFeld(stand.aendernY, viewport.height)
        fehler.push(...pruefen(name, stand, fall))
        if (fall.name === 'gast' && (viewport.name === '390' || viewport.name === '1440')) {
          await page.screenshot({ path: join(BILDER, `${PHASE}-${viewport.name}-gast.png`), fullPage: false })
          try {
            await tastatur(page, name)
            stand.tastatur = 'enter-toggle'
          } catch (problem) {
            stand.tastatur = 'fehler'
            fehler.push(String(problem))
          }
        }
        laeufe.push(stand)
        console.log(
          `${PHASE} ${name} heading=${stand.headingY} attention=${stand.attentionY} punkt=${stand.attentionPunktY} aendern=${stand.aendernY} h=${stand.aendernHoehe} overflow=${stand.ueberlauf} root=${stand.rootPx}`,
        )
        await context.close()
      }
    }
  } finally {
    await browser.close()
  }
  const bericht = {
    phase: PHASE,
    browser: 'google-chrome-headless',
    sha: SHA,
    basis: BASIS,
    hinweis: GAST_HINWEIS,
    harness:
      'PublicNavbar über das öffentliche Layout. Gasttext entspricht GastArbeitsbereich, als Ersatz des kürzeren Audit-Hinweises. Entwurf verwerfen / Reise löschen steht als Geschwister unter der Identitätskarte, weil der Audit-Client kopfzeile nicht übergibt. Slot-Padding der Komponente ist darin nicht enthalten.',
    nichtBehauptet: [
      'nativer Desktop-Zoom 200%',
      'physische OS-Tastatur',
      'Safe-Area-Hardware',
      'VoiceOver',
      'Work A01–A16',
    ],
    laeufe,
    fehler,
  }
  writeFileSync(join(EVIDENZ, `${PHASE}.json`), `${JSON.stringify(bericht, null, 2)}\n`)
  if (fehler.length) {
    console.error(fehler.join('\n'))
    process.exit(1)
  }
  console.log(`geschrieben ${join(EVIDENZ, `${PHASE}.json`)}`)
}

main().catch((fehler) => {
  console.error(fehler)
  process.exit(1)
})
