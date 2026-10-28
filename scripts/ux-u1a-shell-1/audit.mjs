#!/usr/bin/env node
// scripts/ux-u1a-shell-1/audit.mjs
//
// Local browser evidence for UX V1 U1-A. Synthetic audit trip only.
// Does not call providers, Auth, or Production.
//
// JETNITY_UI_AUDIT=1 is set on the dev server this script starts.

import { execSync, spawn } from 'node:child_process'
import { mkdirSync, writeFileSync } from 'node:fs'
import { join } from 'node:path'
import { chromium } from 'playwright'

const PORT = process.env.AUDIT_PORT || '3462'
const BASIS = process.env.AUDIT_BASE || `http://127.0.0.1:${PORT}`
const EVIDENZ = process.env.AUDIT_EVIDENCE_DIR || join(process.cwd(), 'docs/evidence/ux-v1-u1a-shell-1')
const BILDER = process.env.AUDIT_SCREENSHOT_DIR || '/opt/cursor/artifacts/ux-u1a-r1'
const SHA = execSync('git rev-parse --short HEAD', { encoding: 'utf8' }).trim()
const NETZ_MUSTER = /\/api\/(flights|hotels|activities|mobility|rental-cars|reisebegleiter)\b/
const TITEL =
  'Thailand Rundreise mit einem bewusst sehr langen gespeicherten Titel der nicht aus den Etappen erfunden wird und auch bei schmaler Breite vollständig lesbar bleiben muss ohne abgeschnitten zu werden'

const VIEWPORTS = [
  { name: '280', width: 280, height: 640, lage: 'flow' },
  { name: '320', width: 320, height: 720, lage: 'flow' },
  { name: '360', width: 360, height: 800, lage: 'bottom' },
  { name: '390', width: 390, height: 844, lage: 'bottom' },
  { name: '430', width: 430, height: 932, lage: 'bottom' },
  { name: '768', width: 768, height: 1024, lage: 'sticky' },
  { name: '1440', width: 1440, height: 900, lage: 'sticky' },
]

function etappe(teil) {
  return {
    countryCode: 'TH',
    latitude: null,
    longitude: null,
    placeId: null,
    ...teil,
  }
}

function tag(teil) {
  return { title: null, items: [], ...teil }
}

function reise(quelle) {
  return {
    id: 'trip-ux-u1a-shell-1',
    clientRef: 'trip-ux-u1a-shell-1',
    title: TITEL,
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
    quelleMarker: quelle,
  }
}

function nutzlast(quelle) {
  const graph = reise(quelle)
  delete graph.quelleMarker
  return {
    reise: graph,
    quelle,
    mitAenderung: true,
    mitSuche: true,
    gastHinweis: quelle === 'guest',
  }
}

function messen() {
  const nav = document.querySelector('[data-workspace-mode-nav]')
  const kopf = document.querySelector('[data-workspace-identity]')
  const titel = kopf?.querySelector('h1')
  const knoepfe = [...document.querySelectorAll('[data-workspace-mode-nav] button')].map((el) => {
    const rand = el.getBoundingClientRect()
    const bereich = document.createRange()
    bereich.selectNodeContents(el)
    const text = bereich.getBoundingClientRect()
    const enthalten =
      text.width === 0 ||
      (text.left >= rand.left - 1 &&
        text.right <= rand.right + 1 &&
        text.top >= rand.top - 1 &&
        text.bottom <= rand.bottom + 1)
    return {
      text: (el.textContent || '').replace(/\s+/g, ' ').trim(),
      width: rand.width,
      height: rand.height,
      top: rand.top,
      left: rand.left,
      right: rand.right,
      bottom: rand.bottom,
      textLeft: text.left,
      textRight: text.right,
      textTop: text.top,
      textBottom: text.bottom,
      enthalten,
    }
  })
  const navStil = nav ? getComputedStyle(nav) : null
  const navRand = nav?.getBoundingClientRect()
  const titelRand = titel?.getBoundingClientRect()
  const ueberlauf = document.documentElement.scrollWidth - document.documentElement.clientWidth
  const facts = document.querySelector('[data-workspace-identity] details')
  const schneidet = (a, b) =>
    a && b && a.bottom > b.top + 1 && a.top < b.bottom - 1 && a.right > b.left + 1 && a.left < b.right - 1
  return {
    lage: nav?.getAttribute('data-shell-nav') || null,
    position: navStil?.position || null,
    save: kopf?.getAttribute('data-save-truth') || null,
    titel: (titel?.textContent || '').replace(/\s+/g, ' ').trim(),
    route: (kopf?.innerText || '').replace(/\s+/g, ' ').trim(),
    factsOffen: facts instanceof HTMLDetailsElement ? facts.open : null,
    knoepfe,
    navTop: navRand?.top ?? null,
    navBottom: navRand?.bottom ?? null,
    titelSchneidetNav: schneidet(titelRand, navRand),
    ueberlauf,
    innerWidth: window.innerWidth,
    innerHeight: window.innerHeight,
    rootPx: Number.parseFloat(getComputedStyle(document.documentElement).fontSize),
    scale: window.visualViewport?.scale ?? null,
    visualWidth: window.visualViewport?.width ?? null,
    visualHeight: window.visualViewport?.height ?? null,
    suchfelder: document.querySelectorAll('[name="flugsuche"], [name="hotelsuche"], [name="aktivitaeten"]').length,
    stufen: [...document.querySelectorAll('[data-destination-stage]')].map((el) => ({
      id: el.getAttribute('data-destination-stage'),
      land: el.getAttribute('data-destination-country'),
      einreise: el.getAttribute('data-destination-entry'),
      sicherheit: el.getAttribute('data-destination-safety'),
      saison: el.getAttribute('data-destination-seasonal'),
    })),
    leerstand: document.querySelector('[aria-label="Jetzt wichtig"]')?.getAttribute('data-attention-leerstand') || null,
    wichtigText: (document.querySelector('[aria-label="Jetzt wichtig"]')?.innerText || '').replace(/\s+/g, ' ').trim(),
    prozent: (document.querySelector('[aria-label="Reiseübersicht"]')?.innerText || '').includes('%'),
  }
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
  const kind = spawn('npx', ['next', 'start', '-p', PORT, '-H', '127.0.0.1'], {
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
  while (Date.now() - start < 120_000) {
    if (await auditRouteOffen()) return kind
    if (kind.exitCode != null) break
    await new Promise((resolve) => setTimeout(resolve, 400))
  }
  throw new Error(`Audit-Server wurde nicht erreichbar.\n${log.slice(-2000)}`)
}

async function oeffnen(page, quelle, extra = {}) {
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
    window.__u1aLade = false
    const sehen = () => {
      if (document.body?.innerText?.includes('Die Reiseansicht wird vorbereitet')) window.__u1aLade = true
    }
    new MutationObserver(sehen).observe(document.documentElement, { childList: true, subtree: true, characterData: true })
    document.addEventListener('DOMContentLoaded', sehen)
  }, nutzlast(quelle))
  await page.goto(`${BASIS}/ui-audit/trip-workspace`, { waitUntil: 'load', timeout: 60_000 })
  if (extra.rootPx) {
    await page.addStyleTag({ content: `html { font-size: ${extra.rootPx}px !important; }` })
    await page.evaluate(() => window.dispatchEvent(new Event('resize')))
  }
  await page.waitForFunction(
    () => {
      const heading = document.querySelector('[data-workspace-identity] h1')
      return heading instanceof HTMLElement && heading.getClientRects().length > 0 && !document.querySelector('[aria-busy="true"]')
    },
    { timeout: 30_000 },
  )
  await page.waitForTimeout(150)
  return netz
}

function pruefe(name, wert, erwartet) {
  if (wert !== erwartet) throw new Error(`${name}: ${JSON.stringify(wert)} !== ${JSON.stringify(erwartet)}`)
}

async function flussBleibtImDokument(page, name) {
  if (await page.locator('dialog[open]').count()) {
    await page.keyboard.press('Escape')
    await page.waitForTimeout(50)
  }
  const knopf = page.getByRole('button', { name: 'Reise ändern', exact: true })
  await knopf.focus()
  await page.evaluate(() => {
    const nav = document.querySelector('[data-workspace-mode-nav]')
    const probe = document.createElement('div')
    probe.setAttribute('data-u1a-scroll-probe', '')
    probe.style.height = '1600px'
    document.body.appendChild(probe)
    const ziel = Math.max(0, (nav?.getBoundingClientRect().bottom ?? 0) + window.scrollY + 2)
    window.scrollTo({ top: ziel, left: 0, behavior: 'instant' })
  })
  await page.mouse.move(40, 40)
  await page.mouse.wheel(0, 2200)
  await page.waitForTimeout(80)
  const stand = await page.evaluate(() => {
    const nav = document.querySelector('[data-workspace-mode-nav]')
    const ziel = document.activeElement
    if (!(nav instanceof HTMLElement) || !(ziel instanceof HTMLElement)) return { fehler: 'nav oder fokus fehlt' }
    const scroller = document.scrollingElement || document.documentElement
    const nr = nav.getBoundingClientRect()
    const fr = ziel.getBoundingClientRect()
    const position = getComputedStyle(nav).position
    const schnitt =
      nr.bottom > fr.top + 1 && nr.top < fr.bottom - 1 && nr.right > fr.left + 1 && nr.left < fr.right - 1
    document.querySelector('[data-u1a-scroll-probe]')?.remove()
    return {
      lage: nav.getAttribute('data-shell-nav'),
      position,
      navTop: nr.top,
      navBottom: nr.bottom,
      feldTop: fr.top,
      feldBottom: fr.bottom,
      scrollTop: scroller.scrollTop,
      scrollY: window.scrollY,
      scrollHeight: scroller.scrollHeight,
      clientHeight: scroller.clientHeight,
      htmlOverflow: getComputedStyle(document.documentElement).overflowY,
      bodyOverflow: getComputedStyle(document.body).overflowY,
      schnitt,
      weg: nr.bottom <= 1,
    }
  })
  if (stand.fehler) throw new Error(`${name} ${stand.fehler}`)
  if (stand.lage !== 'flow') throw new Error(`${name} nicht flow ${JSON.stringify(stand)}`)
  if (stand.position === 'sticky' || stand.position === 'fixed') {
    throw new Error(`${name} flow ist ${stand.position}`)
  }
  if (!stand.weg) throw new Error(`${name} Navigation blieb im Bild ${JSON.stringify(stand)}`)
  if (stand.schnitt) throw new Error(`${name} Navigation liegt auf dem Feld ${JSON.stringify(stand)}`)
  return stand
}

async function haupt() {
  mkdirSync(EVIDENZ, { recursive: true })
  mkdirSync(BILDER, { recursive: true })
  const server = await serverStarten()
  const browser = await chromium.launch({ headless: true })
  const ergebnis = {
    rejectedHead: '7e6838c01205ba6ab83ecbd9d0c9437e39eb01cb',
    gitHeadAtMeasurement: SHA,
    measurement: 'uncommitted R2 working tree on top of rejectedHead; gitHeadAtMeasurement is not the new head',
    screenshots: 'private artifacts only, not committed',
    screenshotDir: BILDER,
    basis: BASIS,
    laeufe: [],
    netz: [],
    fehler: [],
  }
  try {
    for (const viewport of VIEWPORTS) {
      const page = await browser.newPage({ viewport: { width: viewport.width, height: viewport.height } })
      const netz = await oeffnen(page, 'guest')
      const stand = await page.evaluate(messen)
      ergebnis.netz.push(...netz)
      const klein = stand.knoepfe.filter((knopf) => knopf.width < 44 || knopf.height < 44)
      const ausserhalb = stand.knoepfe.filter((knopf) => knopf.enthalten === false)
      const zeilen = new Set(stand.knoepfe.map((knopf) => Math.round(knopf.top)))
      const lauf = {
        name: viewport.name,
        erwartet: viewport.lage,
        stand: {
          lage: stand.lage,
          position: stand.position,
          save: stand.save,
          ueberlauf: stand.ueberlauf,
          titelGleich: stand.titel === TITEL,
          bangkok: (stand.route.match(/Bangkok/g) || []).length,
        knopfTexte: stand.knoepfe.map((knopf) => knopf.text),
        rechtecke: stand.knoepfe.map((knopf) => ({
          text: knopf.text,
          left: knopf.left,
          right: knopf.right,
          top: knopf.top,
          bottom: knopf.bottom,
          textLeft: knopf.textLeft,
          textRight: knopf.textRight,
          textTop: knopf.textTop,
          textBottom: knopf.textBottom,
          enthalten: knopf.enthalten,
          width: knopf.width,
          height: knopf.height,
        })),
        kleineZiele: klein,
          zeilen: zeilen.size,
          titelSchneidetNav: stand.titelSchneidetNav,
          suchfelder: stand.suchfelder,
          factsOffen: stand.factsOffen,
          prozent: stand.prozent,
          leerstand: stand.leerstand,
          stufen: stand.stufen.map((stufe) => stufe.id),
        },
      }
      ergebnis.laeufe.push(lauf)
      pruefe(`${viewport.name} lage`, stand.lage, viewport.lage)
      pruefe(`${viewport.name} save`, stand.save, 'device')
      pruefe(`${viewport.name} titel`, stand.titel, TITEL)
      if (stand.ueberlauf > 1) throw new Error(`${viewport.name} horizontaler Überlauf ${stand.ueberlauf}`)
      if (klein.length) throw new Error(`${viewport.name} Ziel unter 44px ${JSON.stringify(klein)}`)
      if (ausserhalb.length) throw new Error(`${viewport.name} Text ausserhalb ${JSON.stringify(ausserhalb)}`)
      if (stand.knoepfe.map((knopf) => knopf.text).join('|') !== 'Übersicht|Reiseplan|Organisieren|Vorbereitung') {
        throw new Error(`${viewport.name} Beschriftungen ${stand.knoepfe.map((knopf) => knopf.text).join('|')}`)
      }
      if ((stand.route.match(/Bangkok/g) || []).length < 2) throw new Error(`${viewport.name} Bangkok nicht doppelt`)
      if (stand.titelSchneidetNav) throw new Error(`${viewport.name} Titel schneidet die Navigation`)
      if (stand.suchfelder !== 0) throw new Error(`${viewport.name} Suche gemountet`)
      if (stand.prozent) throw new Error(`${viewport.name} Prozent in der Übersicht`)
      if (stand.factsOffen !== false) throw new Error(`${viewport.name} Angaben sind nicht zugeklappt`)
      if (viewport.lage === 'bottom' && stand.position !== 'fixed') throw new Error(`${viewport.name} nicht fixed`)
      if (stand.lage === 'flow' && (stand.position === 'sticky' || stand.position === 'fixed')) {
        throw new Error(`${viewport.name} flow ist ${stand.position}`)
      }
      if (viewport.lage === 'sticky' && stand.position === 'fixed') throw new Error(`${viewport.name} unerwartet fixed`)
      if (viewport.name === '320') {
        lauf.fluss = await flussBleibtImDokument(page, '320/root16')
      }
      await page.screenshot({ path: join(BILDER, `${viewport.name}.png`), fullPage: false })
      await page.locator('[data-workspace-mode-nav]').scrollIntoViewIfNeeded()
      await page.screenshot({ path: join(BILDER, `${viewport.name}-nav.png`), fullPage: false })
      await page.close()
    }

    const page = await browser.newPage({ viewport: { width: 390, height: 844 } })
    const netz = await oeffnen(page, 'account')
    const konto = await page.evaluate(messen)
    pruefe('konto save', konto.save, 'account')
    if (!konto.route.includes('Im Konto gespeichert')) throw new Error('Kontotext fehlt')
    await page.locator('summary', { hasText: 'Reisende und Budget' }).click()
    const offen = await page.evaluate(() => {
      const details = document.querySelector('[data-workspace-identity] details')
      const text = document.querySelector('[data-workspace-identity]')?.innerText || ''
      return { offen: details instanceof HTMLDetailsElement && details.open, text }
    })
    if (!offen.offen || !offen.text.includes('Noch offen') || !offen.text.includes('Reisende')) {
      throw new Error(`Disclosure unvollständig ${JSON.stringify(offen)}`)
    }
    await page.screenshot({ path: join(BILDER, '390-account-disclosure.png'), fullPage: false })

    const vorher = page.url()
    await page.getByRole('button', { name: 'Reiseplan', exact: true }).click()
    await page.waitForFunction(() => location.search.includes('ansicht=plan'))
    await page.getByRole('button', { name: 'Organisieren', exact: true }).click()
    await page.waitForFunction(() => location.search.includes('ansicht=organisieren'))
    await page.getByRole('button', { name: 'Vorbereitung', exact: true }).click()
    await page.waitForFunction(() => location.search.includes('ansicht=vorbereitung'))
    await page.goBack()
    await page.waitForFunction(() => location.search.includes('ansicht=organisieren'))
    await page.goBack()
    await page.waitForFunction(() => location.search.includes('ansicht=plan'))
    await page.goBack()
    await page.waitForFunction(() => !location.search.includes('ansicht='))
    if (page.url() === vorher && vorher.includes('ansicht=')) throw new Error('Zurück hat die Übersicht nicht erreicht')
    const nachModus = await page.evaluate(messen)
    if (nachModus.suchfelder !== 0) throw new Error('Moduswechsel hat eine Suche gemountet')
    if (netz.length) throw new Error(`Moduswechsel hat Provider-Netz ausgelöst: ${netz.join(', ')}`)
    ergebnis.netzNachModus = netz.length

    await page.getByRole('button', { name: 'Reise ändern', exact: true }).click()
    const feld = page.getByRole('textbox', { name: 'Dein Änderungswunsch' })
    await feld.focus()
    await page.evaluate(() => window.dispatchEvent(new Event('resize')))
    await page.waitForTimeout(100)
    const fokus = await page.evaluate(() => {
      const ziel = document.activeElement
      const nav = document.querySelector('[data-workspace-mode-nav]')
      if (!(ziel instanceof HTMLElement) || !(nav instanceof HTMLElement)) return { ok: false, grund: 'kein Ziel' }
      const a = ziel.getBoundingClientRect()
      const b = nav.getBoundingClientRect()
      const schnitt = a.bottom > b.top + 1 && a.top < b.bottom - 1 && a.right > b.left + 1 && a.left < b.right - 1
      const sichtbar = a.top >= -1 && a.bottom <= window.innerHeight + 1
      return {
        ok: !schnitt && sichtbar && a.height >= 44,
        schnitt,
        sichtbar,
        hoehe: a.height,
        lage: nav.getAttribute('data-shell-nav'),
        position: getComputedStyle(nav).position,
      }
    })
    if (!fokus.ok) throw new Error(`Fokus verdeckt ${JSON.stringify(fokus)}`)
    await page.screenshot({ path: join(BILDER, '390-focus.png'), fullPage: false })
    ergebnis.fokus = fokus
    if (netz.length) throw new Error(`Fokus hat Provider-Netz ausgelöst: ${netz.join(', ')}`)

    const tastatur = await page.evaluate(() => {
      const original = window.visualViewport
      const ersatz = {
        width: window.innerWidth,
        height: Math.max(120, window.innerHeight - 320),
        offsetTop: 0,
        offsetLeft: 0,
        scale: original?.scale ?? 1,
        pageLeft: 0,
        pageTop: 0,
        addEventListener() {},
        removeEventListener() {},
      }
      let ersetzt = false
      try {
        Object.defineProperty(window, 'visualViewport', { configurable: true, value: ersatz })
        ersetzt = true
      } catch {
        ersetzt = false
      }
      window.dispatchEvent(new Event('resize'))
      return { ersetzt, scale: window.visualViewport?.scale ?? null }
    })
    await page.waitForTimeout(50)
    const nachTastatur = await page.evaluate(messen)
    ergebnis.tastatur = { versuch: tastatur, lage: nachTastatur.lage, position: nachTastatur.position }
    if (tastatur.ersetzt && nachTastatur.lage !== 'flow') {
      throw new Error(`Tastatur-Stellvertreter blieb ${nachTastatur.lage}`)
    }
    if (tastatur.ersetzt && (nachTastatur.position === 'fixed' || nachTastatur.position === 'sticky')) {
      throw new Error(`Tastatur-Stellvertreter lässt die Leiste ${nachTastatur.position}`)
    }
    if (tastatur.ersetzt) ergebnis.tastatur.fluss = await flussBleibtImDokument(page, 'tastatur')
    await page.screenshot({ path: join(BILDER, '390-keyboard-standin.png'), fullPage: false })
    await page.close()

    for (const breite of [390, 768]) {
      const gross = await browser.newPage({ viewport: { width: breite, height: 900 } })
      await oeffnen(gross, 'guest', { rootPx: 32 })
      const stand = await gross.evaluate(messen)
      ergebnis.laeufe.push({
        name: `${breite}-root32`,
        erwartet: 'flow',
        stand: {
          lage: stand.lage,
          position: stand.position,
          rootPx: stand.rootPx,
          ueberlauf: stand.ueberlauf,
          zeilen: new Set(stand.knoepfe.map((knopf) => Math.round(knopf.top))).size,
          rechtecke: stand.knoepfe.map((knopf) => ({
            text: knopf.text,
            left: knopf.left,
            right: knopf.right,
            textLeft: knopf.textLeft,
            textRight: knopf.textRight,
            textTop: knopf.textTop,
            textBottom: knopf.textBottom,
            width: knopf.width,
            height: knopf.height,
            enthalten: knopf.enthalten,
          })),
        },
      })
      if (Math.round(stand.rootPx) < 32) throw new Error(`${breite} root blieb ${stand.rootPx}`)
      pruefe(`${breite} root lage`, stand.lage, 'flow')
      if (stand.position === 'sticky' || stand.position === 'fixed') {
        throw new Error(`${breite} root32 ist ${stand.position}`)
      }
      ergebnis.laeufe.at(-1).fluss = await flussBleibtImDokument(gross, `${breite}/root32`)
      if (stand.ueberlauf > 1) throw new Error(`${breite} root32 Überlauf ${stand.ueberlauf}`)
      const kleine = stand.knoepfe.filter((knopf) => knopf.height < 44 || knopf.width < 44)
      const ausserhalb = stand.knoepfe.filter((knopf) => knopf.enthalten === false)
      if (kleine.length) throw new Error(`${breite} root32 Ziel unter 44 ${JSON.stringify(kleine)}`)
      if (ausserhalb.length) throw new Error(`${breite} root32 Text ausserhalb ${JSON.stringify(ausserhalb)}`)
      await gross.screenshot({ path: join(BILDER, `${breite}-root32.png`), fullPage: false })
      await gross.close()
    }

    const zoomSeite = await browser.newPage({ viewport: { width: 780, height: 900 } })
    const zoomNetz = await oeffnen(zoomSeite, 'guest')
    ergebnis.netz.push(...zoomNetz)
    const client = await zoomSeite.context().newCDPSession(zoomSeite)
    await client.send('Emulation.setPageScaleFactor', { pageScaleFactor: 2 })
    await zoomSeite.waitForTimeout(200)
    const zoom = await zoomSeite.evaluate(messen)
    ergebnis.zoom = {
      lage: zoom.lage,
      position: zoom.position,
      scale: zoom.scale,
      innerWidth: zoom.innerWidth,
      visualWidth: zoom.visualWidth,
      ueberlauf: zoom.ueberlauf,
      rootPx: zoom.rootPx,
    }
    if (zoom.scale < 1.9) throw new Error(`Seitenmaßstab blieb ${zoom.scale}`)
    if (Math.round(zoom.rootPx) >= 32) throw new Error('Zoom wurde mit Wurzelschrift vermischt')
    pruefe('zoom lage', zoom.lage, 'flow')
    if (zoom.position === 'fixed' || zoom.position === 'sticky') {
      throw new Error(`Seitenmaßstab lässt die Leiste ${zoom.position}`)
    }
    const zoomAus = zoom.knoepfe.filter((knopf) => knopf.enthalten === false)
    if (zoomAus.length) throw new Error(`Zoom Text ausserhalb ${JSON.stringify(zoomAus)}`)
    const zoomTitel = await zoomSeite.evaluate(() => {
      const h1 = document.querySelector('[data-workspace-identity] h1')
      const rand = h1?.getBoundingClientRect()
      const shell = document.querySelector('[data-workspace-shell]')
      return {
        text: (h1?.textContent || '').replace(/\s+/g, ' ').trim(),
        breite: rand?.width ?? null,
        right: rand?.right ?? null,
        visualWidth: window.visualViewport?.width ?? null,
        shellMarker: shell instanceof HTMLElement,
        shellStyle: shell instanceof HTMLElement ? shell.getAttribute('style') : null,
      }
    })
    ergebnis.zoom.titel = zoomTitel
    ergebnis.zoom.disposition =
      'CDP Emulation.setPageScaleFactor(2) is pinch/visual scale, not a desktop browser zoom of 200%. Ctrl+Plus was not verified in this headless browser. Root 32px and CSS viewport width are the bounded product evidence. The long title can extend past the visual window. No shell max-width is applied. This is an incomplete zoom qualification, not an accessibility pass.'
    if (zoomTitel.text !== TITEL) throw new Error(`Zoom Titel ${zoomTitel.text}`)
    if (zoomTitel.shellMarker || zoomTitel.shellStyle) throw new Error(`Shell-Mutation ${JSON.stringify(zoomTitel)}`)
    await zoomSeite.screenshot({ path: join(BILDER, 'zoom-200.png'), fullPage: false })
    await zoomSeite.locator('[data-workspace-mode-nav]').scrollIntoViewIfNeeded()
    await zoomSeite.screenshot({ path: join(BILDER, 'zoom-200-nav.png'), fullPage: false })
    await zoomSeite.close()

    const leer = await browser.newPage({ viewport: { width: 390, height: 844 } })
    await oeffnen(leer, 'guest')
    const aufmerksamkeit = await leer.evaluate(messen)
    const ladeGesehen = await leer.evaluate(() => Boolean(window.__u1aLade))
    ergebnis.aufmerksamkeit = {
      leerstand: aufmerksamkeit.leerstand,
      text: aufmerksamkeit.wichtigText,
      stufen: aufmerksamkeit.stufen,
      ladeGesehen,
    }
    const verboten = ['Visum erteilt', 'Flug bestätigt', 'sicherheitsfreigabe', '100 %', '100%']
    for (const wort of verboten) {
      if (aufmerksamkeit.wichtigText.toLowerCase().includes(wort.toLowerCase())) {
        throw new Error(`Erfundener Status: ${wort}`)
      }
    }
    const ids = aufmerksamkeit.stufen.map((stufe) => stufe.id)
    for (const id of ['stage-bkk-1', 'stage-ko-chang', 'stage-hkt', 'stage-bkk-2']) {
      if (!ids.includes(id)) throw new Error(`Etappe fehlt ${id}`)
    }
    if (aufmerksamkeit.stufen.some((stufe) => stufe.land !== 'TH')) throw new Error('Länderkennung verändert')
    await leer.close()
  } finally {
    await browser.close()
    if (server?.pid) {
      try {
        process.kill(-server.pid, 'SIGTERM')
      } catch {
        server.kill('SIGTERM')
      }
      server.stdout?.destroy()
      server.stderr?.destroy()
      server.unref()
    }
  }
  if (ergebnis.netz.length) throw new Error(`Unerwartetes Netz ${ergebnis.netz.join(', ')}`)
  const bericht = JSON.stringify(ergebnis, null, 2)
  writeFileSync(join(EVIDENZ, 'report.json'), bericht)
  writeFileSync(join(BILDER, 'report.json'), bericht)
  console.log(JSON.stringify(ergebnis, null, 2))
  process.exit(0)
}

haupt().catch((fehler) => {
  console.error(fehler)
  process.exit(1)
})
