#!/usr/bin/env node
// scripts/trip-plan-premium-experience-4-audit.mjs
//
// Production-like audit for the Reiseplan presentation.
// Synthetic local trip only. Provider and assistant routes are intercepted.
// Does not activate search, providers, Auth or Production.
//
// AUDIT_BROWSER=1 AUDIT_BASE=http://127.0.0.1:3456 node scripts/trip-plan-premium-experience-4-audit.mjs

import { execSync } from 'node:child_process'
import { mkdirSync, writeFileSync } from 'node:fs'
import { join } from 'node:path'

const BASIS = process.env.AUDIT_BASE || 'http://127.0.0.1:3456'
const EVIDENZ =
  process.env.AUDIT_EVIDENCE_DIR ||
  join(process.cwd(), 'docs/evidence/trip-plan-premium-experience-4')
const SHA = execSync('git rev-parse HEAD', { encoding: 'utf8' }).trim()
const NETZ_MUSTER = /\/api\/(flights|hotels|activities|mobility|rental-cars|reisebegleiter)\b/

const VIEWPORTS = [
  { name: '360x800', width: 360, height: 800, hasTouch: true },
  { name: '390x844', width: 390, height: 844, hasTouch: true },
  { name: '768x1024', width: 768, height: 1024, hasTouch: true },
  { name: '1024x768', width: 1024, height: 768, hasTouch: false },
  { name: '1440x900', width: 1440, height: 900, hasTouch: false },
  { name: '1920x1080', width: 1920, height: 1080, hasTouch: false },
]

const JETZT = '2026-09-30T09:00:00.000Z'
const START = '2026-10-01'

function isoPlus(offset) {
  return new Date(Date.parse(`${START}T00:00:00Z`) + offset * 86_400_000).toISOString().slice(0, 10)
}

function punkt(teil) {
  return {
    dayId: null,
    stageId: null,
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
    ...teil,
  }
}

function etappe(teil) {
  return { countryCode: 'JP', latitude: null, longitude: null, placeId: null, ...teil }
}

function tag(teil) {
  return { title: null, items: [], ...teil }
}

function reiseMitTagen(anzahl, id) {
  const ende = isoPlus(anzahl - 1)
  return {
    id,
    clientRef: id,
    title: 'Kyoto und Osaka',
    origin: 'Zürich',
    originPlaceId: 'geonames:2657896',
    startDate: START,
    endDate: ende,
    travellers: 2,
    currency: 'CHF',
    budgetAmount: 4200,
    status: 'draft',
    pace: 'balanced',
    interests: ['culture', 'food'],
    travelWish: null,
    revision: 1,
    lastMutationId: null,
    stages: [
      etappe({
        id: 'stage-1',
        position: 1,
        name: 'Kyoto',
        arrivalDate: START,
        departureDate: ende,
        placeId: 'geonames:1857910',
      }),
    ],
    days: Array.from({ length: anzahl }, (_, index) =>
      tag({
        id: `day-${index + 1}`,
        stageId: 'stage-1',
        dayIndex: index + 1,
        dayDate: isoPlus(index),
      }),
    ),
    ohneTag: [],
    createdAt: JETZT,
    updatedAt: JETZT,
  }
}

function langeReise() {
  const kyotoEnde = isoPlus(20)
  const osakaStart = isoPlus(21)
  const osakaEnde = isoPlus(31)
  const tage = Array.from({ length: 32 }, (_, index) => {
    const nummer = index + 1
    const basis = tag({
      id: `day-${nummer}`,
      stageId: nummer <= 21 ? 'stage-1' : 'stage-2',
      dayIndex: nummer,
      dayDate: isoPlus(index),
    })
    if (nummer !== 16) return basis
    return {
      ...basis,
      items: [
        punkt({
          id: 'item-morgen',
          dayId: 'day-16',
          stageId: 'stage-1',
          kind: 'activity',
          title: 'Tsukiji Outer Market',
          note: 'Aussenmarkt',
          position: 1,
          startsAt: '09:00',
        }),
        punkt({
          id: 'item-frei',
          dayId: 'day-16',
          stageId: 'stage-1',
          kind: 'note',
          title: 'Freier Nachmittag',
          position: 2,
        }),
        punkt({
          id: 'item-flug',
          dayId: 'day-16',
          stageId: 'stage-1',
          kind: 'flight',
          title: 'Flug nach Osaka',
          position: 3,
          startsAt: '18:40',
          priceAmount: 240,
          priceCurrency: 'CHF',
        }),
      ],
    }
  })
  return {
    ...reiseMitTagen(32, 'trip-plan-premium-4'),
    endDate: osakaEnde,
    stages: [
      etappe({
        id: 'stage-1',
        position: 1,
        name: 'Kyoto',
        arrivalDate: START,
        departureDate: kyotoEnde,
        placeId: 'geonames:1857910',
      }),
      etappe({
        id: 'stage-2',
        position: 2,
        name: 'Osaka',
        arrivalDate: osakaStart,
        departureDate: osakaEnde,
        placeId: 'geonames:1853909',
      }),
    ],
    days: tage,
    ohneTag: [
      punkt({
        id: 'item-offen',
        kind: 'note',
        title: 'Offener Punkt',
        position: 1,
      }),
    ],
  }
}

const LANGE_REISE = langeReise()

function nutzlast(reise) {
  return {
    reise,
    quelle: 'account',
    mitAenderung: false,
    mitBegleiter: false,
    mitSuche: false,
  }
}

function messenQuelle() {
  return `() => {
    const sichtbar = (el) => el instanceof HTMLElement && el.getClientRects().length > 0
    const text = (el) => (el?.innerText || '').replace(/\\s+/g, ' ').trim()
    const kanteVon = () => {
      const baender = ['header', '[data-workspace-mode-nav]', 'nav[aria-label="Reise"]'].flatMap((selektor) => {
        const el = document.querySelector(selektor)
        if (!(el instanceof HTMLElement) || !sichtbar(el)) return []
        const stil = getComputedStyle(el)
        if (stil.position !== 'sticky' && stil.position !== 'fixed') return []
        const rand = el.getBoundingClientRect()
        if (rand.height <= 0) return []
        return [{ top: rand.top, bottom: rand.bottom }]
      }).sort((a, b) => a.top - b.top)
      let kante = 0
      for (const band of baender) {
        if (band.top > kante + 1) break
        kante = Math.max(kante, band.bottom)
      }
      return kante
    }
    const verdeckt = (el, kante) => {
      if (!sichtbar(el)) return false
      const rand = el.getBoundingClientRect()
      return rand.top < kante - 1 && rand.bottom > kante + 1
    }
    const plan = document.querySelector('[data-plan-premium]')
    const navigator = document.querySelector('[data-plan-navigator]')
    const zaehler = document.querySelector('[data-plan-tag-zaehler]')
    const vorher = document.querySelector('[data-plan-tag-vorher]')
    const naechster = document.querySelector('[data-plan-tag-naechster]')
    const hoehe = (el) => sichtbar(el) ? Math.round(el.getBoundingClientRect().height) : 0
    const breite = (el) => sichtbar(el) ? Math.round(el.getBoundingClientRect().width) : 0
    const aktuelle = [...document.querySelectorAll('[data-timeline-tag][aria-current="date"]')].filter(sichtbar)
    const aktuell = aktuelle[0] || null
    const streifen = aktuell?.closest('[data-plan-tag-streifen]') || null
    const streifenRand = streifen?.getBoundingClientRect()
    const aktuellRand = aktuell?.getBoundingClientRect()
    const sichtbareStreifen = [...document.querySelectorAll('[data-plan-tag-streifen]')].filter(sichtbar)
    const streifenReihen = sichtbareStreifen.map((el) => {
      const knoepfe = [...el.querySelectorAll('[data-timeline-tag]')].filter(sichtbar)
      const tops = knoepfe.map((knopf) => Math.round(knopf.getBoundingClientRect().top))
      return { anzahl: knoepfe.length, spanne: tops.length ? Math.max(...tops) - Math.min(...tops) : 0 }
    })
    const raster = [...document.querySelectorAll('[data-plan-raster]')].filter(sichtbar).map((el) => {
      const spalten = getComputedStyle(el).gridTemplateColumns.split(' ').filter(Boolean).length
      return { spalten, tage: [...el.querySelectorAll('[data-timeline-tag]')].filter(sichtbar).length }
    })
    const kontext = document.querySelector('[data-plan-tag-kontext]')
    const leer = document.querySelector('[data-plan-leer]')
    const zeiten = [...document.querySelectorAll('#plan-tag-kontext [data-plan-zeit]')].filter(sichtbar).map((el) => text(el))
    const titel = [...document.querySelectorAll('#plan-tag-kontext [data-plan-timeline] strong')].filter(sichtbar).map((el) => text(el))
    const etappen = [...document.querySelectorAll('[data-timeline-etappe]')].map((el) => text(el.querySelector('strong')))
    const kante = Math.round(kanteVon())
    const eingaben = [...document.querySelectorAll('#plan-tag-kontext input, #plan-tag-kontext textarea')].filter(sichtbar).map((el) => ({
      tag: el.tagName,
      px: Number.parseFloat(getComputedStyle(el).fontSize),
    }))
    return {
      href: location.pathname + location.search,
      ansicht: document.querySelector('[data-workspace-ansicht]')?.getAttribute('data-workspace-ansicht') ?? null,
      premium: plan?.getAttribute('data-plan-premium') ?? null,
      htmlFont: getComputedStyle(document.documentElement).fontSize,
      horizontalOverflow: document.documentElement.scrollWidth > document.documentElement.clientWidth + 1,
      scrollWidth: document.documentElement.scrollWidth,
      clientWidth: document.documentElement.clientWidth,
      kante,
      navigatorSichtbar: sichtbar(navigator),
      zaehler: text(zaehler),
      navigatorText: text(navigator),
      vorherHoehe: hoehe(vorher),
      vorherBreite: breite(vorher),
      naechsterHoehe: hoehe(naechster),
      naechsterBreite: breite(naechster),
      vorherDisabled: Boolean(vorher?.disabled),
      naechsterDisabled: Boolean(naechster?.disabled),
      aktuelle: aktuelle.length,
      aktuellTag: aktuell?.getAttribute('data-timeline-tag') ?? null,
      aktuellImStreifen: Boolean(
        streifenRand && aktuellRand &&
        aktuellRand.left >= streifenRand.left - 1 &&
        aktuellRand.right <= streifenRand.right + 1,
      ),
      aktuellVerdeckt: verdeckt(aktuell, kante),
      kontextVerdeckt: verdeckt(kontext?.querySelector('h3'), kante),
      streifen: streifenReihen,
      raster,
      etappen,
      leerHoehe: hoehe(leer),
      leerText: text(leer),
      zeiten,
      titel,
      preis: text(kontext).includes('zum Auswahlzeitpunkt'),
      formular: Boolean(kontext?.querySelector('form')),
      detail: document.querySelector('[data-workspace-detail]')?.getAttribute('data-detail-item') ?? null,
      eingaben,
      fokus: document.activeElement && document.activeElement !== document.body
        ? (document.activeElement.getAttribute('aria-label') || text(document.activeElement)).slice(0, 80)
        : '',
      fokusRing: Boolean(
        document.activeElement &&
        document.activeElement !== document.body &&
        (document.activeElement.matches(':focus-visible') || getComputedStyle(document.activeElement).boxShadow !== 'none'),
      ),
      motion: window.matchMedia('(prefers-reduced-motion: reduce)').matches,
      scrollBehavior: sichtbareStreifen[0] ? getComputedStyle(sichtbareStreifen[0]).scrollBehavior : null,
      rohIso: Boolean(plan && /\\d{4}-\\d{2}-\\d{2}/.test(plan.innerText)),
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
const konsole = []

function merke(bedingung, text) {
  if (!bedingung) fehler.push(text)
}

function spaltenErwartet(breite) {
  if (breite < 768) return 'navigator'
  if (breite < 1024) return 4
  return 7
}

async function abfangen(page, netz) {
  await page.route('**/*', async (route) => {
    const url = route.request().url()
    if (NETZ_MUSTER.test(url)) {
      netz.push({ url, method: route.request().method(), phase: 'intercepted' })
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
  page.on('pageerror', (error) => {
    konsole.push(error.message)
  })
  page.on('console', (msg) => {
    if (msg.type() !== 'error') return
    const text = msg.text()
    if (/hydrat|did not match|Text content does not match/i.test(text)) konsole.push(text)
  })
}

async function auditOeffnen(page, reise, such = '?ansicht=plan', warten = '[data-plan-premium="4"]') {
  await page.addInitScript((wert) => {
    sessionStorage.setItem('jetnity:ui-audit:workspace', JSON.stringify(wert))
  }, nutzlast(reise))
  await page.goto(`${BASIS}/ui-audit/trip-workspace${such}`, { waitUntil: 'load', timeout: 60_000 })
  await page.waitForSelector(warten, { timeout: 30_000 })
}

async function stand(page) {
  return page.evaluate(`(${messenQuelle()})()`)
}

async function bild(page, name, fullPage = false) {
  const datei = join(EVIDENZ, 'screens', `${name}.png`)
  await page.screenshot({ path: datei, fullPage })
  return datei
}

function pruefeLage(name, messung, breite, optionen = {}) {
  const spalten = spaltenErwartet(breite)
  merke(messung.premium === '4', `${name}: Planmarker ${messung.premium}`)
  merke(messung.ansicht === 'plan', `${name}: Ansicht ${messung.ansicht}`)
  merke(messung.horizontalOverflow === false, `${name}: horizontaler Überlauf ${messung.scrollWidth}/${messung.clientWidth}`)
  merke(messung.navigatorSichtbar, `${name}: Navigator fehlt`)
  merke(messung.vorherHoehe >= 44 && messung.vorherBreite >= 44, `${name}: Zurück ${messung.vorherHoehe}x${messung.vorherBreite}`)
  merke(messung.naechsterHoehe >= 44 && messung.naechsterBreite >= 44, `${name}: Weiter ${messung.naechsterHoehe}x${messung.naechsterBreite}`)
  merke(messung.aktuelle === 1, `${name}: sichtbare aktive Tage ${messung.aktuelle}`)
  merke(messung.aktuellVerdeckt === false, `${name}: aktiver Tag unter der Leiste`)
  merke(messung.kontextVerdeckt === false, `${name}: Tageskontext unter der Leiste`)
  merke(messung.rohIso === false, `${name}: rohes ISO-Datum im Plan`)
  if (spalten === 'navigator') {
    merke(messung.raster.length === 0, `${name}: Telefon zeigt ein Raster ${JSON.stringify(messung.raster)}`)
    merke(messung.streifen.length > 0, `${name}: Telefonstreifen fehlt`)
    merke(messung.streifen.every((reihe) => reihe.spanne <= 12), `${name}: Streifen bricht um ${JSON.stringify(messung.streifen)}`)
    merke(messung.aktuellImStreifen, `${name}: aktiver Tag ausserhalb des Streifens`)
  } else {
    merke(messung.streifen.length === 0, `${name}: Rasterbreite zeigt den Telefonstreifen`)
    merke(messung.raster.length > 0 && messung.raster.every((feld) => feld.spalten === spalten), `${name}: Spalten ${JSON.stringify(messung.raster)} erwartet ${spalten}`)
    merke(messung.raster.every((feld) => feld.spalten <= 7), `${name}: mehr als 7 Spalten`)
  }
  if (optionen.zaehler) merke(messung.zaehler === optionen.zaehler, `${name}: Zähler ${messung.zaehler}`)
  if (!optionen.text200) merke(messung.leerHoehe === 0 || messung.leerHoehe <= 96, `${name}: leerer Tag zu hoch ${messung.leerHoehe}`)
  if (optionen.text200) {
    merke(messung.htmlFont === '32px', `${name}: 200% Schrift ist ${messung.htmlFont}`)
    merke(messung.eingaben.length > 0 && messung.eingaben.every((feld) => feld.px >= 16), `${name}: Eingabe unter 16px ${JSON.stringify(messung.eingaben)}`)
    merke(messung.leerHoehe === 0 || messung.leerHoehe <= 160, `${name}: leerer Tag bei 200% ${messung.leerHoehe}`)
  }
}

async function kontext(viewport, extra = {}) {
  const netz = []
  const context = await browser.newContext({
    viewport: { width: viewport.width, height: viewport.height },
    hasTouch: viewport.hasTouch,
    deviceScaleFactor: 1,
    reducedMotion: extra.reducedMotion || 'no-preference',
  })
  const page = await context.newPage()
  await abfangen(page, netz)
  return { page, context, netz }
}

try {
  for (const viewport of VIEWPORTS) {
    const lauf = await kontext(viewport)
    const name = viewport.name
    try {
      await auditOeffnen(lauf.page, LANGE_REISE, '?ansicht=plan&spur=bleibt')
      const messung = await stand(lauf.page)
      const screenshot = await bild(lauf.page, `plan_${name}`, viewport.width >= 768)
      schritte.push({ name, ...messung, netz: lauf.netz.length, screenshot })
      merke(lauf.netz.length === 0, `${name}: Netzwerk beim ersten Bild ${lauf.netz.length}`)
      merke(messung.href.includes('ansicht=plan') && messung.href.includes('spur=bleibt'), `${name}: Adresse ${messung.href}`)
      merke(messung.zaehler === 'Tag 1 von 32', `${name}: Startzähler ${messung.zaehler}`)
      merke(messung.vorherDisabled && !messung.naechsterDisabled, `${name}: Enden des Navigators`)
      merke(messung.leerText === 'Noch nichts an diesem Tag.', `${name}: Leertext ${messung.leerText}`)
      merke(messung.etappen.includes('Kyoto') && messung.etappen.includes('Osaka'), `${name}: Etappen ${messung.etappen.join(',')}`)
      pruefeLage(name, messung, viewport.width)
    } catch (error) {
      fehler.push(`${name}: ${error instanceof Error ? error.message : String(error)}`)
      try {
        await bild(lauf.page, `error_${name}`)
      } catch {
        // bereits erfasst
      }
    }
    await lauf.context.close()
  }

  const textViewport = VIEWPORTS[0]
  const textLauf = await kontext(textViewport)
  try {
    await auditOeffnen(textLauf.page, LANGE_REISE)
    await textLauf.page.evaluate(() => {
      document.documentElement.style.fontSize = '200%'
    })
    await textLauf.page.waitForTimeout(200)
    await textLauf.page.getByRole('button', { name: 'Punkt hinzufügen' }).click()
    await textLauf.page.locator('#plan-tag-kontext form').waitFor()
    const messung = await stand(textLauf.page)
    const screenshot = await bild(textLauf.page, 'text200_360x800', true)
    schritte.push({ name: 'text200_360x800', ...messung, netz: textLauf.netz.length, screenshot })
    pruefeLage('text200_360x800', messung, 360, { text200: true, zaehler: 'Tag 1 von 32' })
    merke(messung.formular, 'text200: Formular fehlt')
    merke(textLauf.netz.length === 0, 'text200: Netzwerk')
  } catch (error) {
    fehler.push(`text200: ${error instanceof Error ? error.message : String(error)}`)
    try {
      await bild(textLauf.page, 'error_text200')
    } catch {
      // bereits erfasst
    }
  }
  await textLauf.context.close()

  const bewegung = await kontext(VIEWPORTS[1], { reducedMotion: 'reduce' })
  try {
    await auditOeffnen(bewegung.page, LANGE_REISE)
    const messung = await stand(bewegung.page)
    await bild(bewegung.page, 'reduced_390x844')
    schritte.push({ name: 'reduced_390x844', ...messung, netz: bewegung.netz.length })
    merke(messung.motion === true, 'reduced motion nicht aktiv')
    merke(messung.scrollBehavior === 'auto', `scroll-behavior ${messung.scrollBehavior}`)
    pruefeLage('reduced_390x844', messung, 390, { zaehler: 'Tag 1 von 32' })
  } catch (error) {
    fehler.push(`reduced: ${error instanceof Error ? error.message : String(error)}`)
  }
  await bewegung.context.close()

  async function bedienen(viewport, prefix) {
    const lauf = await kontext(viewport)
    try {
      await auditOeffnen(lauf.page, LANGE_REISE, '?spur=bleibt', '[data-workspace-identity] h1')
      await lauf.page.getByRole('button', { name: 'Reiseplan', exact: true }).click()
      await lauf.page.waitForFunction(() => location.search.includes('ansicht=plan') && location.search.includes('spur=bleibt'))
      const plan = await stand(lauf.page)
      merke(plan.zaehler === 'Tag 1 von 32', `${prefix}: Einstieg ${plan.zaehler}`)
      merke(lauf.netz.length === 0, `${prefix}: Netzwerk vor der Bedienung ${lauf.netz.length}`)

      await lauf.page.locator('h2#workspace-plan-titel').focus()
      await lauf.page.keyboard.press('Tab')
      const fokus = await stand(lauf.page)
      merke(fokus.fokusRing, `${prefix}: Fokusring fehlt auf ${fokus.fokus}`)

      await lauf.page.getByRole('button', { name: 'Nächster Tag' }).click()
      await lauf.page.waitForFunction(() => document.querySelector('[data-plan-tag-zaehler]')?.textContent?.includes('Tag 2 von 32'))
      let messung = await stand(lauf.page)
      merke(messung.aktuellTag === 'day-2' && messung.aktuellVerdeckt === false, `${prefix}: Tag 2 ${messung.aktuellTag}`)
      await lauf.page.getByRole('button', { name: 'Vorheriger Tag' }).click()
      await lauf.page.waitForFunction(() => document.querySelector('[data-plan-tag-zaehler]')?.textContent?.includes('Tag 1 von 32'))

      await lauf.page.locator('[data-timeline-tag="day-16"]:visible').click()
      await lauf.page.waitForFunction(() => document.querySelector('[data-plan-tag-zaehler]')?.textContent?.includes('Tag 16 von 32'))
      messung = await stand(lauf.page)
      await bild(lauf.page, `${prefix}_tag16`, true)
      merke(messung.titel.join('|') === 'Tsukiji Outer Market|Freier Nachmittag|Flug nach Osaka', `${prefix}: Reihenfolge ${messung.titel.join('|')}`)
      merke(messung.zeiten.join('|') === '09:00|18:40', `${prefix}: Zeiten ${messung.zeiten.join('|')}`)
      merke(!messung.titel.includes('00:00'), `${prefix}: erfundene Zeit`)
      merke(messung.preis, `${prefix}: Preiswahrheit fehlt`)
      merke(messung.navigatorText.includes('Kyoto'), `${prefix}: Kyoto fehlt ${messung.navigatorText}`)
      merke(messung.aktuellVerdeckt === false && messung.kontextVerdeckt === false, `${prefix}: Tag 16 verdeckt`)
      pruefeLage(`${prefix}_tag16`, messung, viewport.width)

      await lauf.page.locator('[data-timeline-tag="day-22"]:visible').click()
      await lauf.page.waitForFunction(() => document.querySelector('[data-plan-tag-zaehler]')?.textContent?.includes('Tag 22 von 32'))
      messung = await stand(lauf.page)
      merke(messung.navigatorText.includes('Osaka'), `${prefix}: Osaka fehlt ${messung.navigatorText}`)
      merke(messung.leerText === 'Noch nichts an diesem Tag.', `${prefix}: Tag 22 nicht leer`)

      await lauf.page.locator('[data-timeline-tag="day-32"]:visible').click()
      await lauf.page.waitForFunction(() => document.querySelector('[data-plan-tag-zaehler]')?.textContent?.includes('Tag 32 von 32'))
      messung = await stand(lauf.page)
      await bild(lauf.page, `${prefix}_letzter`)
      merke(messung.naechsterDisabled && !messung.vorherDisabled, `${prefix}: letzter Tag`)
      merke(messung.aktuellImStreifen || viewport.width >= 768, `${prefix}: letzter Tag nicht im Streifen`)
      merke(messung.aktuellVerdeckt === false, `${prefix}: letzter Tag verdeckt`)

      await lauf.page.locator('[data-timeline-tag="day-16"]:visible').click()
      await lauf.page.getByRole('button', { name: 'Punkt hinzufügen' }).click()
      await lauf.page.locator('#plan-tag-kontext form').waitFor()
      await lauf.page.getByLabel('Ort oder Aktivität').fill('   ')
      await lauf.page.getByRole('button', { name: 'Speichern', exact: true }).click()
      const meldung = lauf.page.locator('#plan-tag-kontext [role="alert"]')
      await meldung.waitFor()
      merke((await meldung.innerText()).includes('Ein Titel ist nötig'), `${prefix}: Validierung`)
      await lauf.page.getByRole('button', { name: 'Abbrechen', exact: true }).click()
      await lauf.page.waitForFunction(() => !document.querySelector('#plan-tag-kontext form'))
      await bild(lauf.page, `${prefix}_formular_zu`)

      const loeschen = lauf.page.getByRole('button', { name: 'Tsukiji Outer Market entfernen' })
      merke((await loeschen.boundingBox())?.height >= 44, `${prefix}: Entfernen unter 44px`)
      await loeschen.click()
      merke(await lauf.page.getByText('Tsukiji Outer Market').isVisible(), `${prefix}: Löschvertrag hat den Punkt entfernt`)

      await lauf.page.locator('#plan-tag-kontext [data-plan-timeline] button').filter({ hasText: 'Tsukiji Outer Market' }).click()
      await lauf.page.waitForSelector('[data-detail-item="item-morgen"]')
      messung = await stand(lauf.page)
      await bild(lauf.page, `${prefix}_detail`)
      merke(messung.detail === 'item-morgen', `${prefix}: Detail ${messung.detail}`)
      merke(messung.href.includes('ansicht=plan'), `${prefix}: Detail verändert die Adresse ${messung.href}`)
      merke(lauf.netz.length === 0, `${prefix}: Netzwerk nach Detail ${lauf.netz.length}`)

      if (prefix === 'phone' || prefix === 'desktop') {
        await lauf.page.goto(`${BASIS}/ui-audit/trip-workspace?spur=bleibt`, { waitUntil: 'load' })
        await lauf.page.waitForSelector('[data-workspace-ansicht="uebersicht"]')
        await lauf.page.getByRole('button', { name: 'Reiseplan', exact: true }).click()
        await lauf.page.waitForFunction(() => location.search.includes('ansicht=plan'))
        await lauf.page.reload({ waitUntil: 'load' })
        await lauf.page.waitForSelector('[data-plan-premium="4"]')
        merke((await stand(lauf.page)).zaehler === 'Tag 1 von 32', `${prefix}: Reload verliert den Plan oder den ersten Tag`)
        await lauf.page.goBack({ waitUntil: 'load' })
        await lauf.page.waitForSelector('[data-workspace-ansicht="uebersicht"]')
        await lauf.page.goForward({ waitUntil: 'load' })
        await lauf.page.waitForSelector('[data-workspace-ansicht="plan"]')
        const vorwaerts = await stand(lauf.page)
        merke(vorwaerts.ansicht === 'plan' && vorwaerts.zaehler === 'Tag 1 von 32', `${prefix}: Forward ${vorwaerts.ansicht} ${vorwaerts.zaehler}`)
      }
    } catch (error) {
      fehler.push(`${prefix}: ${error instanceof Error ? error.message : String(error)}`)
      try {
        await bild(lauf.page, `error_${prefix}`)
      } catch {
        // bereits erfasst
      }
    }
    await lauf.context.close()
  }

  await bedienen(VIEWPORTS[0], 'phone360')
  await bedienen(VIEWPORTS[1], 'phone')
  await bedienen(VIEWPORTS[2], 'tablet')
  await bedienen(VIEWPORTS[4], 'desktop')

  for (const anzahl of [1, 7, 14, 21]) {
    for (const viewport of [VIEWPORTS[1], VIEWPORTS[4]]) {
      const name = `form_${anzahl}_${viewport.name}`
      const lauf = await kontext(viewport)
      try {
        await auditOeffnen(lauf.page, reiseMitTagen(anzahl, `trip-plan-${anzahl}`))
        const messung = await stand(lauf.page)
        const screenshot = await bild(lauf.page, name, anzahl >= 14)
        schritte.push({ name, ...messung, netz: lauf.netz.length, screenshot })
        merke(messung.zaehler === `Tag 1 von ${anzahl}`, `${name}: ${messung.zaehler}`)
        merke(anzahl === 1 ? messung.naechsterDisabled && messung.vorherDisabled : !messung.naechsterDisabled, `${name}: Enden`)
        merke(lauf.netz.length === 0, `${name}: Netzwerk`)
        pruefeLage(name, messung, viewport.width, { zaehler: `Tag 1 von ${anzahl}` })
      } catch (error) {
        fehler.push(`${name}: ${error instanceof Error ? error.message : String(error)}`)
      }
      await lauf.context.close()
    }
  }
} finally {
  await browser.close()
}

merke(konsole.length === 0, `Konsolenfehler: ${konsole.join(' | ')}`)

const bericht = {
  sha: SHA,
  basis: BASIS,
  stand: new Date().toISOString(),
  ergebnis: fehler.length === 0 ? 'PASS' : 'FAIL',
  fehler,
  konsole,
  schritte: schritte.map((eintrag) => ({
    name: eintrag.name,
    ansicht: eintrag.ansicht,
    zaehler: eintrag.zaehler,
    horizontalOverflow: eintrag.horizontalOverflow,
    htmlFont: eintrag.htmlFont,
    raster: eintrag.raster,
    streifen: eintrag.streifen,
    leerHoehe: eintrag.leerHoehe,
    aktuellTag: eintrag.aktuellTag,
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
