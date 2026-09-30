#!/usr/bin/env node
// scripts/trip-workspace-premium-experience-3-audit.mjs
//
// Production-like cross-device audit for Trip Workspace premium experience 3.
// Synthetic local trip only. Provider and assistant routes are intercepted.
// Does not activate search, providers, Auth or Production.
//
// AUDIT_BROWSER=1 AUDIT_BASE=http://127.0.0.1:3456 node scripts/trip-workspace-premium-experience-3-audit.mjs

import { execSync } from 'node:child_process'
import { mkdirSync, writeFileSync } from 'node:fs'
import { join } from 'node:path'

const BASIS = process.env.AUDIT_BASE || 'http://127.0.0.1:3456'
const EVIDENZ =
  process.env.AUDIT_EVIDENCE_DIR ||
  join(process.cwd(), 'docs/evidence/trip-workspace-premium-experience-3')
const SHA = execSync('git rev-parse HEAD', { encoding: 'utf8' }).trim()
const NETZ_MUSTER = /\/api\/(flights|hotels|activities|mobility|rental-cars|reisebegleiter)\b/

const VIEWPORTS = [
  { name: '360x800', width: 360, height: 800, hasTouch: true },
  { name: '390x844', width: 390, height: 844, hasTouch: true },
  { name: '768x1024', width: 768, height: 1024, hasTouch: true },
  { name: '1024x768', width: 1024, height: 768, hasTouch: false },
  { name: '1280x800', width: 1280, height: 800, hasTouch: false },
  { name: '1440x900', width: 1440, height: 900, hasTouch: false },
  { name: '1920x1080', width: 1920, height: 1080, hasTouch: false },
]

const JETZT = '2026-09-30T09:00:00.000Z'

function etappe(teil) {
  return { countryCode: 'ID', latitude: null, longitude: null, placeId: null, ...teil }
}

function tag(teil) {
  return { title: null, items: [], ...teil }
}

function reise() {
  return {
    id: 'trip-premium-experience-3',
    clientRef: 'trip-premium-experience-3',
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
      tag({ id: 'day-1', stageId: 'stage-1', dayIndex: 1, dayDate: '2026-10-12' }),
      tag({ id: 'day-2', stageId: 'stage-1', dayIndex: 2, dayDate: '2026-10-13' }),
      tag({ id: 'day-3', stageId: 'stage-2', dayIndex: 3, dayDate: '2026-10-19' }),
    ],
    ohneTag: [],
    createdAt: JETZT,
    updatedAt: JETZT,
  }
}

const REISE = reise()
const NUTZLAST = {
  reise: REISE,
  quelle: 'account',
  mitAenderung: true,
  mitBegleiter: true,
  mitSuche: true,
}

function messenQuelle() {
  return `() => {
    const sichtbar = (el) => el instanceof HTMLElement && !el.hidden && el.getClientRects().length > 0 && el.offsetParent !== null
    const text = (el) => (el?.innerText || el?.getAttribute?.('aria-label') || '').replace(/\\s+/g, ' ').trim()
    const box = (el) => {
      if (!(el instanceof HTMLElement) || !sichtbar(el)) return null
      const r = el.getBoundingClientRect()
      return { top: Math.round(r.top), left: Math.round(r.left), width: Math.round(r.width), height: Math.round(r.height), bottom: Math.round(r.bottom), right: Math.round(r.right) }
    }
    const scroller = document.querySelector('[data-workspace-mode-scroller]')
    const knoepfe = [...document.querySelectorAll('[data-workspace-mode-nav] button')].map((el) => {
      const r = el.getBoundingClientRect()
      const s = scroller?.getBoundingClientRect()
      const stil = getComputedStyle(el)
      return {
        text: text(el),
        current: el.getAttribute('aria-current'),
        height: Math.round(r.height),
        width: Math.round(r.width),
        nowrap: stil.whiteSpace === 'nowrap',
        inScroller: Boolean(s && r.left >= s.left - 1 && r.right <= s.right + 1),
      }
    })
    const teile = [...document.querySelectorAll('[data-workspace-trip-parts] button')].map((el) => {
      const r = el.getBoundingClientRect()
      return { label: el.getAttribute('aria-label'), height: Math.round(r.height), text: text(el).slice(0, 80) }
    })
    const header = document.querySelector('header')
    const modusNav = document.querySelector('[data-workspace-mode-nav]')
    const rueckkehr = document.querySelector('nav[aria-label="Reise"]')
    const band = (el) => {
      if (!(el instanceof HTMLElement)) return null
      const stil = getComputedStyle(el)
      if (stil.position !== 'sticky' && stil.position !== 'fixed') return null
      const r = el.getBoundingClientRect()
      if (r.height <= 0) return null
      return { top: r.top, bottom: r.bottom }
    }
    const baender = [band(header), band(modusNav), band(rueckkehr)].filter(Boolean).sort((a, b) => a.top - b.top)
    let kante = 0
    for (const eintrag of baender) {
      if (eintrag.top > kante + 1) break
      kante = Math.max(kante, eintrag.bottom)
    }
    const heading = document.querySelector('[data-workspace-modus-heading]')
    const headingBox = box(heading)
    const identitaet = document.querySelector('[data-workspace-identity]')
    const fakten = identitaet ? [...identitaet.querySelectorAll('dt')].map((el) => text(el)) : []
    const aktion = document.querySelector('[data-workspace-aktionen]')
    const aktionen = aktion ? [...aktion.querySelectorAll('button')].map((el) => ({ text: text(el), height: Math.round(el.getBoundingClientRect().height), expanded: el.getAttribute('aria-expanded') })) : []
    const flugSuche = document.querySelector('[data-arbeitsbereich="flugsuche"]')
    const aenderung = document.getElementById('reise-aenderung')
    const begleiter = document.getElementById('reisebegleiter')
    const aktiv = document.activeElement
    const motion = window.matchMedia('(prefers-reduced-motion: reduce)').matches
    const probe = document.querySelector('[data-workspace-mode-nav] button, [data-workspace-identity]')
    const probeStil = probe ? getComputedStyle(probe) : null
    return {
      href: location.pathname + location.search,
      ansicht: document.querySelector('[data-workspace-ansicht]')?.getAttribute('data-workspace-ansicht') ?? null,
      bereich: document.querySelector('[data-workspace-bereich]')?.getAttribute('data-workspace-bereich') ?? '',
      premium: document.querySelector('[data-workspace-premium]')?.getAttribute('data-workspace-premium') ?? null,
      htmlFont: getComputedStyle(document.documentElement).fontSize,
      horizontalOverflow: document.documentElement.scrollWidth > document.documentElement.clientWidth + 1,
      scrollWidth: document.documentElement.scrollWidth,
      clientWidth: document.documentElement.clientWidth,
      kante: Math.round(kante),
      heading: headingBox,
      headingFrei: Boolean(headingBox && headingBox.top >= kante - 1),
      identitaet: box(identitaet),
      fakten,
      titel: text(identitaet?.querySelector('h1')),
      knoepfe,
      teile,
      teileSpalten: (() => {
        const liste = document.querySelector('[data-workspace-trip-parts] ul')
        if (!liste) return null
        return getComputedStyle(liste).gridTemplateColumns
      })(),
      aktionen,
      caption: text(aktion?.querySelector('p')).slice(0, 220),
      jetzt: Boolean(document.querySelector('[aria-label="Jetzt wichtig"]')),
      ziele: Boolean(document.querySelector('[data-destination-essentials]')),
      zieleDichte: document.querySelector('[data-destination-essentials]')?.getAttribute('data-destination-essentials-dichte') ?? null,
      flugSucheMounted: Boolean(flugSuche),
      flugSucheSichtbar: sichtbar(flugSuche),
      aenderungMounted: Boolean(aenderung),
      aenderungHidden: Boolean(aenderung?.hidden),
      begleiterMounted: Boolean(begleiter),
      detail: document.querySelector('[data-workspace-detail]')?.getAttribute('data-workspace-detail') ?? null,
      detailSuche: document.querySelector('[data-workspace-detail]')?.getAttribute('data-detail-suche') ?? null,
      fokus: aktiv && aktiv !== document.body ? text(aktiv).slice(0, 80) : '',
      fokusRing: aktiv && aktiv !== document.body ? getComputedStyle(aktiv).boxShadow !== 'none' : false,
      motion,
      animationName: probeStil?.animationName ?? null,
      inputs: [...document.querySelectorAll('input, textarea, select')].filter(sichtbar).map((el) => ({
        tag: el.tagName,
        px: Number.parseFloat(getComputedStyle(el).fontSize),
      })),
    }
  }`
}

if (process.env.AUDIT_BROWSER !== '1') {
  console.log(JSON.stringify({ modus: 'static-only', hinweis: 'AUDIT_BROWSER=1 für den Produktionsnachweis', sha: SHA }))
  process.exit(0)
}

const { chromium } = await import('playwright')
mkdirSync(join(EVIDENZ, 'screens'), { recursive: true })

const browser = await chromium.launch({
  headless: true,
  executablePath: process.env.CHROME_PATH || '/opt/google/chrome/chrome',
  args: ['--no-sandbox', '--disable-dev-shm-usage'],
})

const fehler = []
const schritte = []

function merke(bedingung, text) {
  if (!bedingung) fehler.push(text)
}

async function abfangen(page, netz) {
  await page.route('**/*', async (route) => {
    const url = route.request().url()
    if (NETZ_MUSTER.test(url)) {
      await route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify({ status: 'unavailable', options: [] }),
      })
      return
    }
    const headers = { ...route.request().headers() }
    delete headers.origin
    await route.continue({ headers })
  })
  page.on('request', (request) => {
    if (!NETZ_MUSTER.test(request.url())) return
    if (netz.some((eintrag) => eintrag.url === request.url())) return
    netz.push({ url: request.url(), method: request.method(), phase: 'observed' })
  })
}

async function auditOeffnen(page, such = '') {
  await page.addInitScript((nutzlast) => {
    sessionStorage.setItem('jetnity:ui-audit:workspace', JSON.stringify(nutzlast))
  }, NUTZLAST)
  await page.goto(`${BASIS}/ui-audit/trip-workspace${such}`, { waitUntil: 'load', timeout: 60_000 })
  await page.waitForFunction(
    () => {
      const heading = document.querySelector('[data-workspace-identity] h1')
      return heading instanceof HTMLElement && heading.getClientRects().length > 0 && !document.querySelector('[aria-busy="true"]')
    },
    { timeout: 30_000 },
  )
}

async function gastOeffnen(page) {
  await page.addInitScript((wert) => {
    localStorage.setItem('jetnity:reise:v3', JSON.stringify(wert))
  }, REISE)
  await page.goto(`${BASIS}/reisen/${REISE.id}`, { waitUntil: 'load', timeout: 60_000 })
  await page.waitForFunction(
    () => document.querySelector('[data-workspace-identity] h1') instanceof HTMLElement,
    { timeout: 30_000 },
  )
}

async function stand(page) {
  return page.evaluate(`(${messenQuelle()})()`)
}

async function bild(page, name, fullPage = false) {
  const datei = join(EVIDENZ, 'screens', `${name}.png`)
  await page.screenshot({ path: datei, fullPage })
  return datei
}

async function laufViewport(viewport, extra = {}) {
  const netz = []
  const context = await browser.newContext({
    viewport: { width: viewport.width, height: viewport.height },
    hasTouch: viewport.hasTouch,
    deviceScaleFactor: 1,
    reducedMotion: extra.reducedMotion || 'no-preference',
  })
  const page = await context.newPage()
  await abfangen(page, netz)
  const name = viewport.name
  try {
    await auditOeffnen(page, extra.such || '')
    if (extra.text200) {
      await page.evaluate(() => {
        document.documentElement.style.fontSize = '200%'
      })
      await page.waitForTimeout(200)
    }
    const zuerst = await stand(page)
    const screenshot = await bild(page, `${extra.prefix || 'overview'}_${name}`, extra.fullPage || false)
    schritte.push({ name: `${extra.prefix || 'overview'}_${name}`, screenshot, netz: netz.length, ...zuerst })
    merke(zuerst.premium === '3', `${name}: premium marker fehlt`)
    merke(zuerst.horizontalOverflow === false, `${name}: horizontaler Überlauf ${zuerst.scrollWidth}/${zuerst.clientWidth}`)
    merke(zuerst.titel.includes('Zürich nach Bali'), `${name}: Titel fehlt`)
    merke(zuerst.fakten.includes('Zeitraum') && zuerst.fakten.includes('Reisende') && zuerst.fakten.includes('Budget'), `${name}: Fakten ${zuerst.fakten.join(',')}`)
    merke(zuerst.knoepfe.length === 4, `${name}: Modi ${zuerst.knoepfe.length}`)
    merke(zuerst.knoepfe.every((knopf) => knopf.height >= 44 && knopf.nowrap), `${name}: Modusziel oder Umbruch`)
    merke(zuerst.knoepfe.filter((knopf) => knopf.current === 'page').length === 1, `${name}: kein eindeutiger Modus`)
    merke(zuerst.knoepfe.find((knopf) => knopf.current === 'page')?.inScroller, `${name}: gewählter Modus ausserhalb der Leiste`)
    merke(zuerst.teile.length === 4 && zuerst.teile.every((teil) => teil.height >= 44), `${name}: Bereiche`)
    merke(zuerst.aktionen.some((aktion) => aktion.text.includes('Reise ändern') && aktion.height >= 44), `${name}: Reise ändern`)
    merke(zuerst.aktionen.some((aktion) => aktion.text.includes('Reisebegleiter fragen') && aktion.height >= 44), `${name}: Reisebegleiter`)
    merke(zuerst.jetzt && zuerst.ziele, `${name}: Aufmerksamkeit oder Ziele fehlen`)
    merke(zuerst.flugSucheMounted === false, `${name}: Suche beim ersten Bild montiert`)
    merke(zuerst.begleiterMounted === false, `${name}: Reisebegleiter beim ersten Bild montiert`)
    merke(netz.length === 0, `${name}: Netzwerk beim ersten Bild ${netz.length}`)
    if (viewport.width < 640) {
      merke(zuerst.teileSpalten?.startsWith('1') || !zuerst.teileSpalten?.includes(' '), `${name}: Telefon soll eine Spalte sein ${zuerst.teileSpalten}`)
      merke(zuerst.aenderungMounted === false, `${name}: Reise ändern ist auf dem Telefon nicht faul`)
    }
    if (viewport.width >= 640) {
      merke(Boolean(zuerst.teileSpalten && zuerst.teileSpalten.split(' ').length >= 2), `${name}: Bereiche nicht verbunden nebeneinander ${zuerst.teileSpalten}`)
    }
    if (extra.text200) {
      merke(zuerst.htmlFont === '32px', `${name}: 200% Schrift ist ${zuerst.htmlFont}`)
      merke(zuerst.inputs.every((feld) => feld.px >= 16), `${name}: Eingabe unter 16px`)
    }
    return { page, context, netz }
  } catch (error) {
    fehler.push(`${name}: ${error instanceof Error ? error.message : String(error)}`)
    try {
      await bild(page, `error_${name}`)
    } catch {
      // Der Fehler steht schon in der Liste.
    }
    await context.close()
    return null
  }
}

try {
  for (const viewport of VIEWPORTS) {
    const lauf = await laufViewport(viewport)
    if (lauf) await lauf.context.close()
  }

  const voll390 = await laufViewport(VIEWPORTS[1], { prefix: 'full', fullPage: true })
  if (voll390) await voll390.context.close()
  const voll1440 = await laufViewport(VIEWPORTS[5], { prefix: 'full', fullPage: true })
  if (voll1440) await voll1440.context.close()

  const text360 = await laufViewport(VIEWPORTS[0], { prefix: 'text200', text200: true })
  if (text360) await text360.context.close()

  const reduziert = await laufViewport(VIEWPORTS[1], { prefix: 'reduced-motion', reducedMotion: 'reduce' })
  if (reduziert) {
    const bewegung = schritte.at(-1)
    merke(bewegung?.motion === true, 'reduced motion nicht aktiv')
    merke(bewegung?.animationName === 'none', `Animation ${bewegung?.animationName}`)
    await reduziert.context.close()
  }

  async function vertiefen(viewport, prefix) {
    const netz = []
    const context = await browser.newContext({
      viewport: { width: viewport.width, height: viewport.height },
      hasTouch: viewport.hasTouch,
      deviceScaleFactor: 1,
    })
    const page = await context.newPage()
    await abfangen(page, netz)
    const kompakt = viewport.width < 1024
    try {
      await auditOeffnen(page, '?spur=bleibt')
      await page.getByRole('button', { name: 'Reiseplan', exact: true }).click()
      await page.waitForFunction(() => location.search.includes('ansicht=plan') && location.search.includes('spur=bleibt'))
      const plan = await stand(page)
      await bild(page, `${prefix}_plan`)
      merke(plan.ansicht === 'plan' && plan.headingFrei, `${prefix}: Reiseplan verdeckt oder falsch`)
      merke(plan.href.includes('spur=bleibt'), `${prefix}: fremder Parameter verloren`)

      await page.reload({ waitUntil: 'load' })
      await page.waitForFunction(() => document.querySelector('[data-workspace-ansicht="plan"]'))
      merke((await stand(page)).ansicht === 'plan', `${prefix}: Reload verliert Reiseplan`)

      await page.goBack({ waitUntil: 'load' })
      await page.waitForFunction(() => document.querySelector('[data-workspace-ansicht="uebersicht"]'))
      await page.goForward({ waitUntil: 'load' })
      await page.waitForFunction(() => document.querySelector('[data-workspace-ansicht="plan"]'))
      merke((await stand(page)).ansicht === 'plan', `${prefix}: Forward stellt Reiseplan nicht her`)

      await auditOeffnen(page, '?ansicht=unbekannt&bereich=fluege&spur=bleibt')
      await page.waitForFunction(() => document.querySelector('[data-workspace-ansicht="uebersicht"]'))
      const ungueltig = await stand(page)
      merke(ungueltig.ansicht === 'uebersicht' && ungueltig.href === '/ui-audit/trip-workspace?spur=bleibt', `${prefix}: Kanonisierung ${ungueltig.href}`)

      await auditOeffnen(page, '?ansicht=vorbereitung')
      await page.waitForFunction(() => document.querySelector('[data-workspace-ansicht="vorbereitung"]'))
      const vorbereitung = await stand(page)
      await bild(page, `${prefix}_vorbereitung`)
      merke(vorbereitung.ansicht === 'vorbereitung' && vorbereitung.headingFrei, `${prefix}: Vorbereitung`)
      merke(netz.length === 0, `${prefix}: Netzwerk vor der Suche`)

      await auditOeffnen(page, '?ansicht=organisieren&bereich=fluege')
      await page.waitForFunction(() => document.querySelector('[data-detail-domain="fluege"]'))
      const flug = await stand(page)
      await bild(page, `${prefix}_fluege`)
      merke(flug.flugSucheMounted === false && flug.detailSuche === 'aus', `${prefix}: Suche öffnet sich von selbst`)
      merke(flug.headingFrei || flug.kante >= 0, `${prefix}: Flugdetail`)
      const vorher = netz.length
      await page.getByRole('button', { name: 'Flug suchen', exact: true }).click()
      await page.waitForSelector('[data-arbeitsbereich="flugsuche"]')
      const suche = await stand(page)
      await bild(page, `${prefix}_flug-suchen`)
      merke(suche.flugSucheSichtbar && suche.detailSuche === 'ein', `${prefix}: ausdrückliche Suche nicht sichtbar`)
      merke(netz.length === vorher, `${prefix}: ausdrückliches Öffnen hat einen Anbieteraufruf ausgelöst`)

      if (kompakt) {
        const zurueck = page.locator('nav[aria-label="Reise"] button', { hasText: 'Zurück zur Reise' })
        await zurueck.focus()
        await page.keyboard.press('Enter')
        await page.waitForFunction(() => document.querySelector('[data-workspace-ansicht="organisieren"]')?.getAttribute('data-workspace-bereich') === '')
        const nachZurueck = await stand(page)
        merke(nachZurueck.fokus.includes('Flüge') || nachZurueck.fokus.includes('Flug'), `${prefix}: Fokus nach Zurück ${nachZurueck.fokus}`)
      } else {
        await page.keyboard.press('Escape')
        await page.waitForTimeout(150)
        const nachEscape = await stand(page)
        merke(nachEscape.bereich === '', `${prefix}: Escape schliesst den Bereich nicht`)
      }

      await auditOeffnen(page)
      const aendern = page.getByRole('button', { name: 'Reise ändern', exact: true })
      await aendern.focus()
      merke((await stand(page)).fokusRing, `${prefix}: Fokusring fehlt`)
      await page.keyboard.press('Enter')
      await page.locator('#reise-aenderung textarea').waitFor()
      merke(netz.length === vorher || netz.length === 0, `${prefix}: Reise ändern löst einen Aufruf aus`)
      await page.keyboard.press('Escape')
      await page.waitForTimeout(120)
      const nachAenderung = await stand(page)
      merke(nachAenderung.aenderungHidden || !nachAenderung.aenderungMounted, `${prefix}: Änderung bleibt offen`)

      const begleiter = page.getByRole('button', { name: 'Reisebegleiter fragen', exact: true })
      await begleiter.click()
      await page.locator('#reisebegleiter textarea').waitFor()
      const nachBegleiter = await stand(page)
      await bild(page, `${prefix}_begleiter`)
      merke(nachBegleiter.begleiterMounted, `${prefix}: Reisebegleiter nicht montiert`)
      merke(netz.length === 0, `${prefix}: Reisebegleiter hat beim Öffnen einen Aufruf ausgelöst ${netz.length}`)
      await page.keyboard.press('Escape')

      await page.getByRole('button', { name: 'Vorbereitung', exact: true }).focus()
      await page.keyboard.press('Enter')
      await page.waitForFunction(() => document.querySelector('[data-workspace-ansicht="vorbereitung"]'))
      const tastatur = await stand(page)
      merke(tastatur.headingFrei && tastatur.fokus.length > 0, `${prefix}: Tastaturfokus auf Vorbereitung`)
    } catch (error) {
      fehler.push(`${prefix}: ${error instanceof Error ? error.message : String(error)}`)
      try {
        await bild(page, `error_${prefix}`)
      } catch {
        // bereits erfasst
      }
    }
    await context.close()
  }

  await vertiefen(VIEWPORTS[0], 'compact')
  await vertiefen(VIEWPORTS[5], 'wide')

  const gastContext = await browser.newContext({ viewport: { width: 390, height: 844 }, hasTouch: true, deviceScaleFactor: 1 })
  const gast = await gastContext.newPage()
  const gastNetz = []
  await abfangen(gast, gastNetz)
  try {
    await gastOeffnen(gast)
    const gastStand = await stand(gast)
    await bild(gast, 'guest_390')
    schritte.push({ name: 'guest_390', ...gastStand, netz: gastNetz.length })
    merke(gastStand.titel.includes('Zürich nach Bali'), 'Gasttitel')
    merke(gastStand.aktionen.some((aktion) => aktion.text.includes('Reise ändern')), 'Gast ohne Reise ändern')
    merke(gastStand.aktionen.every((aktion) => !aktion.text.includes('Reisebegleiter')), 'Gast zeigt den Reisebegleiter')
    merke(gastNetz.length === 0, 'Gastnetzwerk')
    merke(await gast.getByRole('button', { name: 'Entwurf verwerfen' }).isVisible(), 'Verwerfen fehlt')
  } catch (error) {
    fehler.push(`guest: ${error instanceof Error ? error.message : String(error)}`)
  }
  await gastContext.close()

  const desktopGast = await browser.newContext({ viewport: { width: 1440, height: 900 }, deviceScaleFactor: 1 })
  const desktop = await desktopGast.newPage()
  await abfangen(desktop, [])
  try {
    await gastOeffnen(desktop)
    await bild(desktop, 'guest_1440', true)
  } catch (error) {
    fehler.push(`guest-1440: ${error instanceof Error ? error.message : String(error)}`)
  }
  await desktopGast.close()
} finally {
  await browser.close()
}

const bericht = {
  sha: SHA,
  basis: BASIS,
  stand: new Date().toISOString(),
  ergebnis: fehler.length === 0 ? 'PASS' : 'FAIL',
  fehler,
  schritte: schritte.map((eintrag) => ({
    name: eintrag.name,
    ansicht: eintrag.ansicht,
    horizontalOverflow: eintrag.horizontalOverflow,
    htmlFont: eintrag.htmlFont,
    fakten: eintrag.fakten,
    knoepfe: eintrag.knoepfe,
    teileSpalten: eintrag.teileSpalten,
    aktionen: eintrag.aktionen,
    netz: eintrag.netz,
    screenshot: eintrag.screenshot,
  })),
}

writeFileSync(join(EVIDENZ, 'audit.json'), JSON.stringify(bericht, null, 2))
console.log(JSON.stringify({ ergebnis: bericht.ergebnis, fehler: fehler.length, schritte: schritte.length, sha: SHA }, null, 2))
if (fehler.length) {
  console.error(fehler.join('\n'))
  process.exit(1)
}
