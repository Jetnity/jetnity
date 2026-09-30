#!/usr/bin/env node
// scripts/organize-premium-experience-6-audit.mjs
//
// Production-like audit for Organisieren presentation.
// Synthetic local trip only. Provider routes are intercepted.
// AUDIT_BROWSER=1 AUDIT_BASE=http://127.0.0.1:3456 node scripts/organize-premium-experience-6-audit.mjs

import { execSync } from 'node:child_process'
import { mkdirSync, writeFileSync } from 'node:fs'
import { join } from 'node:path'

const BASIS = process.env.AUDIT_BASE || 'http://127.0.0.1:3456'
const EVIDENZ = process.env.AUDIT_EVIDENCE_DIR || join(process.cwd(), 'docs/evidence/organize-premium-experience-6')
const SHA = execSync('git rev-parse HEAD', { encoding: 'utf8' }).trim()
const NETZ_MUSTER = /\/api\/(flights|hotels|activities|mobility|rental-cars)\b/

const VIEWPORTS = [
  { name: '360x800', width: 360, height: 800, hasTouch: true },
  { name: '390x844', width: 390, height: 844, hasTouch: true },
  { name: '768x1024', width: 768, height: 1024, hasTouch: true },
  { name: '1024x768', width: 1024, height: 768, hasTouch: false },
  { name: '1440x900', width: 1440, height: 900, hasTouch: false },
  { name: '1920x1080', width: 1920, height: 1080, hasTouch: false },
]

const JETZT = '2026-10-01T09:00:00.000Z'

function etappe(teil) {
  return { countryCode: 'ID', latitude: null, longitude: null, placeId: null, ...teil }
}

function tag(teil) {
  return { title: null, items: [], ...teil }
}

function reise() {
  return {
    id: 'trip-organize-premium-6',
    clientRef: 'trip-organize-premium-6',
    title: 'Zürich nach Bali',
    origin: 'Zürich',
    originPlaceId: 'airport:ZRH',
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
        placeId: 'airport:DPS',
      }),
    ],
    days: [
      tag({ id: 'day-1', stageId: 'stage-1', dayIndex: 1, dayDate: '2026-10-12' }),
      tag({ id: 'day-2', stageId: 'stage-1', dayIndex: 2, dayDate: '2026-10-13' }),
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
  mitAenderung: false,
  mitBegleiter: false,
  mitSuche: true,
}

function messenQuelle() {
  return `() => {
    const sichtbar = (el) => el instanceof HTMLElement && !el.hidden && el.getClientRects().length > 0 && getComputedStyle(el).visibility !== 'hidden'
    const text = (el) => (el?.innerText || '').replace(/\\s+/g, ' ').trim()
    const doc = document.documentElement
    const detail = document.querySelector('[data-workspace-detail]')
    const flug = document.querySelector('[data-arbeitsbereich="flugsuche"]')
    const hotel = document.querySelector('[data-arbeitsbereich="hotelsuche"]')
    const aktivitaeten = document.querySelector('[data-arbeitsbereich="aktivitaeten"]')
    const arbeit = document.querySelector('[data-workspace-arbeit]')
    const aktiv = document.activeElement
    const zurueck = [...document.querySelectorAll('button')].filter((el) => sichtbar(el) && text(el).includes('Zurück zur Reise'))
    return {
      href: location.pathname + location.search,
      split: document.querySelector('[data-workspace-split]')?.getAttribute('data-workspace-split') ?? null,
      bereich: document.querySelector('[data-workspace-ansicht]')?.getAttribute('data-workspace-bereich') ?? null,
      ansicht: document.querySelector('[data-workspace-ansicht]')?.getAttribute('data-workspace-ansicht') ?? null,
      rail: Boolean(document.querySelector('[data-workspace-domain-nav]') && sichtbar(document.querySelector('[data-workspace-domain-nav]'))),
      detail: detail?.getAttribute('data-workspace-detail') ?? null,
      detailDomain: detail?.getAttribute('data-detail-domain') ?? null,
      detailSuche: detail?.getAttribute('data-detail-suche') ?? null,
      flaechen: [...document.querySelectorAll('[data-organisieren-flaeche]')].filter(sichtbar).map((el) => el.getAttribute('data-organisieren-flaeche')),
      flugMounted: Boolean(flug),
      flugSichtbar: Boolean(flug && sichtbar(flug)),
      hotelMounted: Boolean(hotel),
      hotelSichtbar: Boolean(hotel && sichtbar(hotel)),
      aktivitaetenMounted: Boolean(aktivitaeten),
      aktivitaetenSichtbar: Boolean(aktivitaeten && sichtbar(aktivitaeten)),
      arbeitSichtbar: Boolean(arbeit && sichtbar(arbeit)),
      zurueck: zurueck.map((el) => ({
        inDetail: Boolean(el.closest('[data-workspace-detail]')),
        inReise: Boolean(el.closest('nav[aria-label="Reise"]')),
        height: Math.round(el.getBoundingClientRect().height),
      })),
      horizontalOverflow: doc.scrollWidth > doc.clientWidth + 1,
      scrollWidth: doc.scrollWidth,
      clientWidth: doc.clientWidth,
      htmlFont: getComputedStyle(doc).fontSize,
      fokus: aktiv && aktiv !== document.body ? (aktiv.getAttribute('aria-label') || text(aktiv)).slice(0, 80) : '',
      inputs: [...document.querySelectorAll('input, textarea, select')].filter(sichtbar).map((el) => ({
        px: Number.parseFloat(getComputedStyle(el).fontSize),
      })),
      ziele: [...document.querySelectorAll('button, a, input, select, textarea')].filter(sichtbar).map((el) => Math.round(el.getBoundingClientRect().height)).filter((hoehe) => hoehe > 0 && hoehe < 44),
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

function netzArten(netz) {
  return netz.map((eintrag) => `${eintrag.method} ${eintrag.url}`)
}

async function abfangen(page, netz) {
  await page.route('**/*', async (route) => {
    const url = route.request().url()
    if (NETZ_MUSTER.test(url)) {
      netz.push({ url, method: route.request().method() })
      await route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify({
          status: 'unavailable',
          message: 'Im Audit nicht angebunden.',
          options: [],
          coverageNote: 'Audit',
        }),
      })
      return
    }
    const headers = { ...route.request().headers() }
    delete headers.origin
    await route.continue({ headers })
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

async function stand(page) {
  return page.evaluate(`(${messenQuelle()})()`)
}

async function bild(page, name) {
  const datei = join(EVIDENZ, 'screens', `${name}.png`)
  await page.screenshot({ path: datei, fullPage: false })
  return datei
}

async function organisieren(page) {
  await page.getByRole('button', { name: 'Organisieren', exact: true }).click()
  await page.waitForFunction(() => document.querySelector('[data-workspace-ansicht="organisieren"]'))
}

async function domaene(page, name) {
  const knopf = page.locator(`[data-workspace-domain-nav] button[aria-label="${name}"]`)
  await knopf.click()
  await page.locator(`[data-detail-domain]`).first().waitFor({ timeout: 10_000 })
}

try {
  for (const viewport of VIEWPORTS) {
    const netz = []
    const context = await browser.newContext({
      viewport: { width: viewport.width, height: viewport.height },
      hasTouch: viewport.hasTouch,
      deviceScaleFactor: 1,
    })
    const page = await context.newPage()
    await abfangen(page, netz)
    try {
      await auditOeffnen(page)
      await organisieren(page)
      const offen = await stand(page)
      await bild(page, `rail_${viewport.name}`)
      schritte.push({ name: `rail_${viewport.name}`, ...offen, netz: netzArten(netz) })
      merke(offen.horizontalOverflow === false, `${viewport.name}: Überlauf ${offen.scrollWidth}/${offen.clientWidth}`)
      merke(offen.ansicht === 'organisieren', `${viewport.name}: Organisieren fehlt`)
      merke(offen.rail, `${viewport.name}: Leiste fehlt`)
      merke(offen.flugMounted === false, `${viewport.name}: Flugsuche vor dem Bereich`)
      merke(netz.length === 0, `${viewport.name}: Netzwerk vor dem Bereich`)
      const kompakt = viewport.width < 1024
      await domaene(page, 'Flüge')
      const flug = await stand(page)
      await bild(page, `fluege_${viewport.name}`)
      schritte.push({ name: `fluege_${viewport.name}`, ...flug, netz: netzArten(netz) })
      merke(flug.detailDomain === 'fluege', `${viewport.name}: Flugdetail`)
      merke(flug.detailSuche === 'aus', `${viewport.name}: Suche öffnet sich von selbst`)
      merke(flug.flugSichtbar === false, `${viewport.name}: Flugsuche sichtbar ohne Aktion`)
      merke(netz.length === 0, `${viewport.name}: Anbieter beim Öffnen`)
      merke(flug.horizontalOverflow === false, `${viewport.name}: Überlauf im Flugdetail`)
      if (kompakt) {
        merke(flug.rail === false, `${viewport.name}: Telefon zeigt die Leiste neben dem Detail`)
        merke(flug.split === 'einspaltig', `${viewport.name}: Split ${flug.split}`)
        merke(flug.zurueck.some((eintrag) => eintrag.inReise && eintrag.height >= 44), `${viewport.name}: sticky Zurück`)
        merke(flug.zurueck.every((eintrag) => !eintrag.inDetail), `${viewport.name}: Zurück auch in der Karte`)
      } else {
        merke(flug.rail, `${viewport.name}: Leiste neben dem Detail fehlt`)
        merke(flug.split !== 'einspaltig', `${viewport.name}: Desktop bleibt einspaltig ${flug.split}`)
        merke(flug.zurueck.some((eintrag) => eintrag.inDetail && eintrag.height >= 44), `${viewport.name}: Karten-Zurück`)
        merke(flug.zurueck.every((eintrag) => !eintrag.inReise), `${viewport.name}: sticky Zurück auf der weiten Fläche`)
        merke(flug.flaechen.includes('status') && flug.flaechen.includes('bestand'), `${viewport.name}: Status und Bestand ${flug.flaechen.join(',')}`)
      }
    } catch (error) {
      fehler.push(`${viewport.name}: ${error instanceof Error ? error.message : String(error)}`)
      try {
        await bild(page, `error_${viewport.name}`)
      } catch {
        // bereits erfasst
      }
    }
    await context.close()
  }

  async function ablauf(viewport, prefix) {
    const netz = []
    const kompakt = viewport.width < 1024
    const context = await browser.newContext({
      viewport: { width: viewport.width, height: viewport.height },
      hasTouch: viewport.hasTouch,
      deviceScaleFactor: 1,
    })
    const page = await context.newPage()
    await abfangen(page, netz)
    try {
      await auditOeffnen(page, '?spur=bleibt')
      await organisieren(page)
      await domaene(page, 'Flüge')
      await page.waitForFunction(() => location.search.includes('bereich=fluege') && location.search.includes('spur=bleibt'))
      merke((await stand(page)).href.includes('spur=bleibt'), `${prefix}: fremder Parameter fehlt`)
      await page.reload({ waitUntil: 'load' })
      await page.waitForFunction(() => document.querySelector('[data-detail-domain="fluege"]'))
      const nachReload = await stand(page)
      merke(nachReload.detailDomain === 'fluege' && nachReload.detailSuche === 'aus', `${prefix}: Reload verliert den Flugbereich`)
      merke(netz.length === 0, `${prefix}: Reload sucht`)

      await page.goBack({ waitUntil: 'load' })
      await page.waitForFunction(() => {
        const ansicht = document.querySelector('[data-workspace-ansicht]')
        return ansicht?.getAttribute('data-workspace-ansicht') === 'organisieren' && ansicht.getAttribute('data-workspace-bereich') === ''
      })
      await page.goForward({ waitUntil: 'load' })
      await page.waitForFunction(() => document.querySelector('[data-detail-domain="fluege"]'))
      merke((await stand(page)).detailDomain === 'fluege', `${prefix}: Forward stellt Flüge nicht her`)

      const vorherSuche = netz.length
      await page.getByRole('button', { name: 'Flug suchen', exact: true }).click()
      await page.waitForSelector('[data-arbeitsbereich="flugsuche"]')
      const suche = await stand(page)
      await bild(page, `${prefix}_flug-suchen`)
      schritte.push({ name: `${prefix}_flug-suchen`, ...suche, netz: netzArten(netz) })
      merke(suche.flugSichtbar && suche.detailSuche === 'ein', `${prefix}: ausdrückliche Flugsuche`)
      merke(netz.length === vorherSuche, `${prefix}: Öffnen der Flugsuche ruft einen Anbieter`)
      merke(suche.flaechen.includes('suche'), `${prefix}: Suchfläche fehlt`)
      if (kompakt) merke(suche.inputs.every((feld) => feld.px >= 16), `${prefix}: Eingabe unter 16px`)
      merke(suche.horizontalOverflow === false, `${prefix}: Überlauf in der Flugsuche`)

      const vorherSubmit = netz.length
      await page.getByRole('button', { name: 'Flüge suchen', exact: true }).click()
      await page.waitForTimeout(400)
      const nachSubmit = netzArten(netz)
      schritte.push({ name: `${prefix}_flug-submit`, netz: nachSubmit })
      merke(nachSubmit.some((eintrag) => eintrag.includes('/api/flights/search')), `${prefix}: Submit ohne Flugsuche ${nachSubmit.join(',')}`)
      merke(netz.length > vorherSubmit, `${prefix}: Submit löst keinen Aufruf aus`)

      if (kompakt) {
        const zurueck = page.locator('nav[aria-label="Reise"] button', { hasText: 'Zurück zur Reise' })
        await zurueck.focus()
        await page.keyboard.press('Enter')
        await page.waitForFunction(() => document.querySelector('[data-workspace-domain-nav]'))
        const nachZurueck = await stand(page)
        merke(nachZurueck.fokus.includes('Flüge') || nachZurueck.fokus.includes('Flug'), `${prefix}: Fokus ${nachZurueck.fokus}`)
        merke(nachZurueck.detail == null, `${prefix}: Zurück schliesst nicht`)
      } else {
        await page.keyboard.press('Escape')
        await page.waitForTimeout(200)
        const nachEscape = await stand(page)
        merke(nachEscape.bereich === '', `${prefix}: Escape schliesst nicht ${nachEscape.bereich}`)
      }

      await auditOeffnen(page, '?ansicht=organisieren')
      await organisieren(page)
      const domaenen = [
        ['Unterkunft', 'unterkunft', 'Unterkunft suchen', 'hotelsuche', '/api/hotels/search'],
        ['Aktivitäten', 'aktivitaeten', 'Aktivitäten suchen', 'aktivitaeten', '/api/activities/search'],
      ]
      for (const [label, domain, aktion, flaeche, pfad] of domaenen) {
        if (kompakt && (await stand(page)).rail === false) {
          await page.locator('nav[aria-label="Reise"] button', { hasText: 'Zurück zur Reise' }).click()
          await page.waitForSelector('[data-workspace-domain-nav]')
        }
        const davor = netz.length
        await domaene(page, label)
        const geoeffnet = await stand(page)
        await bild(page, `${prefix}_${domain}`)
        merke(geoeffnet.detailDomain === domain, `${prefix}: ${label} nicht offen`)
        merke(geoeffnet.detailSuche === 'aus', `${prefix}: ${label} sucht von selbst`)
        merke(netz.length === davor, `${prefix}: ${label} öffnet einen Anbieter`)
        const vorAktion = netz.length
        await page.getByRole('button', { name: aktion, exact: true }).click()
        await page.waitForSelector(`[data-arbeitsbereich="${flaeche}"]`)
        await page.waitForTimeout(300)
        const nachAktion = await stand(page)
        await bild(page, `${prefix}_${domain}-suche`)
        schritte.push({ name: `${prefix}_${domain}-suche`, ...nachAktion, netz: netzArten(netz) })
        merke(nachAktion.detailSuche === 'ein', `${prefix}: ${aktion} öffnet die Suche nicht`)
        merke(
          netzArten(netz).slice(vorAktion).some((eintrag) => eintrag.includes(pfad)),
          `${prefix}: ${aktion} bleibt ohne den bestehenden Aufruf ${netzArten(netz).join(',')}`,
        )
      }

      if (kompakt) {
        await page.locator('nav[aria-label="Reise"] button', { hasText: 'Zurück zur Reise' }).click()
        await page.waitForSelector('[data-workspace-domain-nav]')
      }
      const vorMobil = netz.length
      await domaene(page, 'Mobilität')
      const mobil = await stand(page)
      await bild(page, `${prefix}_mobilitaet`)
      merke(mobil.detailDomain === 'mobilitaet', `${prefix}: Mobilität`)
      merke(netz.length === vorMobil, `${prefix}: Mobilität sucht beim Öffnen`)
      merke(mobil.flaechen.includes('bestand'), `${prefix}: Mobilitätsbestand fehlt`)
      const vorPruefen = netz.length
      await page.getByRole('button', { name: 'Verbindungen prüfen', exact: true }).click()
      await page.waitForTimeout(300)
      merke(
        netzArten(netz).slice(vorPruefen).some((eintrag) => eintrag.includes('/api/mobility/search')),
        `${prefix}: Verbindungen prüfen ohne Aufruf ${netzArten(netz).join(',')}`,
      )
      await page.getByRole('tab', { name: 'Mietwagen', exact: true }).click()
      await page.getByText('Bekannten Mietwagen eintragen').waitFor({ timeout: 10_000 })
      const mietwagen = await stand(page)
      await bild(page, `${prefix}_mietwagen`)
      merke(mietwagen.horizontalOverflow === false, `${prefix}: Mietwagen-Überlauf`)
      if (kompakt) merke(mietwagen.inputs.every((feld) => feld.px >= 16), `${prefix}: Mietwagen-Eingabe unter 16px`)
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

  await ablauf(VIEWPORTS[1], 'compact')
  await ablauf(VIEWPORTS[4], 'wide')

  const textContext = await browser.newContext({
    viewport: { width: 360, height: 800 },
    hasTouch: true,
    deviceScaleFactor: 1,
  })
  const textPage = await textContext.newPage()
  const textNetz = []
  await abfangen(textPage, textNetz)
  try {
    await auditOeffnen(textPage, '?ansicht=organisieren&bereich=fluege')
    await textPage.waitForFunction(() => document.querySelector('[data-detail-domain="fluege"]'))
    await textPage.evaluate(() => {
      document.documentElement.style.fontSize = '200%'
    })
    await textPage.getByRole('button', { name: 'Flug suchen', exact: true }).click()
    await textPage.waitForSelector('[data-arbeitsbereich="flugsuche"]')
    const textStand = await stand(textPage)
    await bild(textPage, 'text200_360_flug-suchen')
    schritte.push({ name: 'text200_360_flug-suchen', ...textStand, netz: netzArten(textNetz) })
    merke(textStand.htmlFont === '32px', `200%: Schrift ${textStand.htmlFont}`)
    merke(textStand.horizontalOverflow === false, `200%: Überlauf ${textStand.scrollWidth}/${textStand.clientWidth}`)
    merke(textStand.inputs.every((feld) => feld.px >= 16), '200%: Eingabe unter 16px')
    merke(textNetz.every((eintrag) => !eintrag.url.includes('/api/flights/search')), '200%: Flugsuche ohne Submit')
  } catch (error) {
    fehler.push(`text200: ${error instanceof Error ? error.message : String(error)}`)
    try {
      await bild(textPage, 'error_text200')
    } catch {
      // bereits erfasst
    }
  }
  await textContext.close()
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
    split: eintrag.split,
    detailDomain: eintrag.detailDomain,
    detailSuche: eintrag.detailSuche,
    flaechen: eintrag.flaechen,
    horizontalOverflow: eintrag.horizontalOverflow,
    htmlFont: eintrag.htmlFont,
    netz: eintrag.netz,
    screenshot: eintrag.screenshot,
  })),
}

writeFileSync(join(EVIDENZ, 'audit.json'), JSON.stringify(bericht, null, 2))
console.log(JSON.stringify({ ergebnis: bericht.ergebnis, fehler, schritte: schritte.length, sha: SHA }, null, 2))
if (fehler.length) process.exit(1)
