#!/usr/bin/env node
// scripts/preparation-premium-experience-5-audit.mjs
//
// Production-like audit for Preparation premium experience 5.
// Synthetic local trip only. Provider and assistant routes are intercepted.
//
// AUDIT_BROWSER=1 AUDIT_BASE=http://127.0.0.1:3456 node scripts/preparation-premium-experience-5-audit.mjs

import { execSync } from 'node:child_process'
import { mkdirSync, writeFileSync } from 'node:fs'
import { join } from 'node:path'

const BASIS = process.env.AUDIT_BASE || 'http://127.0.0.1:3456'
const EVIDENZ =
  process.env.AUDIT_EVIDENCE_DIR ||
  join(process.cwd(), 'docs/evidence/preparation-premium-experience-5')
const SHA = execSync('git rev-parse HEAD', { encoding: 'utf8' }).trim()
const NETZ_MUSTER = /\/api\/(flights|hotels|activities|mobility|rental-cars|reisebegleiter|readiness)\b/
const SPEICHER = 'jetnity:ui-audit:workspace'
const JETZT = '2026-10-01T09:00:00.000Z'

const VIEWPORTS = [
  { name: '320x568', width: 320, height: 568, hasTouch: true, vollbild: true },
  { name: '360x800', width: 360, height: 800, hasTouch: true, vollbild: true },
  { name: '375x812', width: 375, height: 812, hasTouch: true },
  { name: '390x844', width: 390, height: 844, hasTouch: true, vollbild: true },
  { name: '412x915', width: 412, height: 915, hasTouch: true },
  { name: '430x932', width: 430, height: 932, hasTouch: true },
  { name: 'landscape_844x390', width: 844, height: 390, hasTouch: true, vollbild: true },
  { name: '768x1024', width: 768, height: 1024, hasTouch: true, vollbild: true },
  { name: '820x1180', width: 820, height: 1180, hasTouch: true },
  { name: '1024x768', width: 1024, height: 768, hasTouch: false },
  { name: '1280x800', width: 1280, height: 800, hasTouch: false },
  { name: '1440x900', width: 1440, height: 900, hasTouch: false, vollbild: true },
  { name: '1728x1117', width: 1728, height: 1117, hasTouch: false },
  { name: '1920x1080', width: 1920, height: 1080, hasTouch: false, vollbild: true },
]

function etappe(teil) {
  return {
    id: 'stage-1',
    position: 1,
    name: 'Bali',
    countryCode: 'ID',
    arrivalDate: '2026-10-12',
    departureDate: '2026-10-22',
    latitude: -8.4095,
    longitude: 115.1889,
    placeId: 'geonames:1650535',
    ...teil,
  }
}

function dokument(clientRef, land, citizenshipRef) {
  return {
    id: clientRef,
    clientRef,
    documentType: 'passport',
    issuingCountryCode: land,
    citizenshipClientRef: citizenshipRef,
    expiresOn: '2030-01-01',
    createdAt: JETZT,
    updatedAt: JETZT,
  }
}

function buerger(clientRef, land) {
  return {
    id: clientRef,
    clientRef,
    countryCode: land,
    createdAt: JETZT,
    updatedAt: JETZT,
  }
}

function person(teil) {
  return {
    residenceCountryCode: null,
    citizenships: [],
    documents: [],
    createdAt: JETZT,
    updatedAt: JETZT,
    ...teil,
  }
}

function flug() {
  return {
    id: 'flight-1',
    dayId: null,
    stageId: 'stage-1',
    kind: 'flight',
    title: 'ZRH → DPS',
    note: null,
    position: 1,
    startsOn: '2026-10-12',
    startsAt: '10:00',
    endsOn: '2026-10-12',
    endsAt: '18:00',
    priceAmount: 400,
    priceCurrency: 'CHF',
    provider: null,
    externalRef: null,
    bookingUrl: null,
    bookingStatus: 'booked',
    bookingSource: 'user',
    bookingConfirmedAt: JETZT,
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

function evidenceLeer() {
  return {
    provider: null,
    authority: null,
    sourceUrl: null,
    checkedAt: null,
    validFrom: null,
    validUntil: null,
    ruleReference: null,
    contextFingerprint: 'off',
  }
}

function placeholder(travellerClientRef, credentialOptionRef, requirementType) {
  return {
    travellerClientRef,
    credentialOptionRef,
    destinationCountryCode: 'ID',
    transitCountryCode: null,
    requirementType,
    result: 'unknown',
    status: 'unavailable',
    freshness: 'provider_unavailable',
    officialClass: 'unknown',
    visaMode: null,
    missingFacts: [],
    evidence: evidenceLeer(),
    action: null,
    temporalRule: null,
  }
}

const REISE = {
  id: 'trip-preparation-premium-5',
  clientRef: 'trip-preparation-premium-5',
  title: 'Zürich nach Bali',
  origin: 'Zürich',
  originPlaceId: 'geonames:2657896',
  startDate: '2026-10-12',
  endDate: '2026-10-22',
  travellers: 2,
  currency: 'CHF',
  budgetAmount: null,
  status: 'draft',
  pace: 'balanced',
  interests: [],
  travelWish: null,
  revision: 1,
  lastMutationId: null,
  stages: [etappe()],
  days: [
    {
      id: 'day-1',
      stageId: 'stage-1',
      dayIndex: 1,
      dayDate: '2026-10-12',
      title: null,
      items: [],
    },
  ],
  ohneTag: [flug()],
  party: [
    person({
      id: 'party-1',
      clientRef: 'traveller:1',
      label: 'Reisende 1',
      residenceCountryCode: 'CH',
      citizenships: [buerger('citizenship:CH', 'CH'), buerger('citizenship:RS', 'RS')],
      documents: [
        dokument('document:passport:CH', 'CH', 'citizenship:CH'),
        dokument('document:passport:RS', 'RS', 'citizenship:RS'),
      ],
    }),
    person({
      id: 'party-2',
      clientRef: 'traveller:2',
      label: 'Reisende 2',
      residenceCountryCode: 'DE',
      citizenships: [buerger('citizenship:DE', 'DE')],
      documents: [dokument('document:passport:DE', 'DE', 'citizenship:DE')],
    }),
  ],
  readinessItems: [
    {
      id: 'rdy-prep',
      clientRef: 'preparation:adapter',
      kind: 'preparation',
      userStatus: 'open',
      evidence: 'user',
      countryCode: null,
      tripItemId: null,
      title: 'Reiseadapter einpacken',
      travellerClientRef: null,
      contextFingerprint: 'alt',
      createdAt: JETZT,
      updatedAt: JETZT,
    },
  ],
  createdAt: JETZT,
  updatedAt: JETZT,
}

const OFFICIAL = [
  {
    travellerClientRef: 'traveller:1',
    credentialOptionRef: 'traveller:1:document:passport:CH',
    destinationCountryCode: 'ID',
    transitCountryCode: null,
    requirementType: 'visa',
    result: 'not_required',
    status: 'current',
    freshness: 'current',
    officialClass: 'requirement',
    visaMode: 'visa_exempt',
    missingFacts: [],
    evidence: {
      provider: 'audit',
      authority: 'Auditbehörde',
      sourceUrl: 'https://example.test/official-source',
      checkedAt: JETZT,
      validFrom: null,
      validUntil: null,
      ruleReference: 'VISA-ID',
      contextFingerprint: 'off',
    },
    action: {
      kind: 'open_official_action',
      purpose: 'information',
      href: 'https://example.test/official-info',
    },
    temporalRule: null,
  },
  placeholder('traveller:1', 'traveller:1:document:passport:CH', 'passport'),
  placeholder('traveller:1', 'traveller:1:document:passport:CH', 'insurance'),
  placeholder('traveller:2', 'traveller:2:document:passport:DE', 'passport'),
  placeholder('traveller:2', 'traveller:2:document:passport:DE', 'insurance'),
]

const NUTZLAST = {
  reise: REISE,
  quelle: 'account',
  mitReadiness: true,
  officialEvaluations: OFFICIAL,
  registry: {
    problem: null,
    voll: false,
    travellers: [
      {
        id: '11111111-1111-4111-8111-111111111111',
        label: 'Alex Beispiel',
        residenceCountryCode: 'CH',
        citizenshipCountryCodes: ['CH', 'RS'],
        documents: [
          { documentType: 'passport', issuingCountryCode: 'CH' },
          { documentType: 'passport', issuingCountryCode: 'RS' },
        ],
      },
    ],
  },
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
}

async function oeffnen(page, extra = {}) {
  await page.addInitScript(
    ({ speicher, nutzlast }) => sessionStorage.setItem(speicher, JSON.stringify(nutzlast)),
    { speicher: SPEICHER, nutzlast: NUTZLAST },
  )
  await page.goto(`${BASIS}/ui-audit/trip-workspace`, { waitUntil: 'load', timeout: 60_000 })
  await page.waitForFunction(
    () => {
      const heading = document.querySelector('[data-workspace-identity] h1')
      return heading instanceof HTMLElement && heading.getClientRects().length > 0 && !document.querySelector('[aria-busy="true"]')
    },
    { timeout: 30_000 },
  )
  if (extra.text200) {
    await page.evaluate(() => {
      document.documentElement.style.fontSize = '200%'
    })
  }
}

async function vorbereitung(page) {
  await page.getByRole('button', { name: 'Vorbereitung', exact: true }).click()
  await page.waitForFunction(() => document.querySelector('[data-workspace-ansicht="vorbereitung"]'))
  await page.locator('[data-preparation-premium="5"]').waitFor()
}

async function messen(page) {
  return page.evaluate(() => {
    const sichtbar = (el) =>
      el instanceof HTMLElement && !el.hidden && el.getClientRects().length > 0 && el.offsetParent !== null
    const text = (el) => (el?.innerText || '').replace(/\s+/g, ' ').trim()
    const wurzel = document.querySelector('[data-preparation-premium="5"]')
    const detail = document.getElementById('reisevorbereitung-detail')
    const bereiche = [...document.querySelectorAll('[data-preparation-section]')].map((el) => ({
      id: el.getAttribute('data-preparation-section'),
      open: el instanceof HTMLDetailsElement ? el.open : null,
      height: Math.round(el.getBoundingClientRect().height),
    }))
    const controls = wurzel
      ? [...wurzel.querySelectorAll('button, a, summary, input, select')].filter(sichtbar).map((el) => {
          const stil = getComputedStyle(el)
          const box = el.getBoundingClientRect()
          return {
            tag: el.tagName,
            text: text(el).slice(0, 80),
            height: Math.round(box.height),
            font: Number.parseFloat(stil.fontSize),
          }
        })
      : []
    const zeilen = [...document.querySelectorAll('[data-official-result]')].map((el) => ({
      result: el.getAttribute('data-official-result'),
      freshness: el.getAttribute('data-official-freshness'),
      status: el.getAttribute('data-official-status'),
      type: el.getAttribute('data-official-requirement-type'),
      kompakt: el.getAttribute('data-official-placeholder-block'),
      text: text(el).slice(0, 180),
    }))
    const zusammen = text(document.querySelector('[data-traveller-summary="traveller:1"]'))
    return {
      href: location.pathname + location.search,
      ansicht: document.querySelector('[data-workspace-ansicht]')?.getAttribute('data-workspace-ansicht') ?? null,
      htmlFont: getComputedStyle(document.documentElement).fontSize,
      horizontalOverflow: document.documentElement.scrollWidth > document.documentElement.clientWidth + 1,
      scrollWidth: document.documentElement.scrollWidth,
      clientWidth: document.documentElement.clientWidth,
      sektionsBreite: Math.round(wurzel?.getBoundingClientRect().width ?? 0),
      elternBreite: Math.round(wurzel?.parentElement?.getBoundingClientRect().width ?? 0),
      schmaleSpalten: wurzel
        ? [...wurzel.querySelectorAll('p, a, button, legend, summary, h3, h4, h5, label, li')]
            .filter((el) => el instanceof HTMLElement && el.getClientRects().length > 0 && !el.closest('.sr-only') && (el.innerText || '').trim().length > 24)
            .filter((el) => {
              const box = el.getBoundingClientRect()
              const schrift = Number.parseFloat(getComputedStyle(el).fontSize) || 16
              const grenze = (wurzel.getBoundingClientRect().width || 0) * 0.55
              return box.width > 0 && box.width < grenze && box.height > schrift * 3
            })
            .slice(0, 4)
            .map((el) => ({
              tag: el.tagName,
              text: (el.innerText || '').replace(/\s+/g, ' ').trim().slice(0, 48),
              width: Math.round(el.getBoundingClientRect().width),
            }))
        : [],
      premium: wurzel?.getAttribute('data-preparation-premium') ?? null,
      detailHidden: detail ? detail.hidden || detail.classList.contains('hidden') : null,
      disclaimer: Boolean(wurzel && text(wurzel).includes('Ein Häkchen ist keine offizielle Visa- oder Einreisebestätigung')),
      mehrere: Boolean(wurzel && text(wurzel).includes('Diese Reise hat mehrere Reisende')),
      bereiche,
      controls,
      zeilen,
      zusammen,
      registry: text(document.getElementById('registry-reise-uebernahme-titel')?.closest('section')),
      motion: window.matchMedia('(prefers-reduced-motion: reduce)').matches,
    }
  })
}

async function bild(page, name, vollbild = true) {
  const datei = join(EVIDENZ, 'screens', `${name}.png`)
  await page.screenshot({ path: datei, fullPage: vollbild })
  return datei
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
    const name = viewport.name
    try {
      await oeffnen(page)
      merke(netz.length === 0, `${name}: Netzwerk vor dem ersten Moduswechsel ${netz.length}`)
      await vorbereitung(page)
      const geschlossen = await messen(page)
      merke(geschlossen.detailHidden === true, `${name}: Vorbereitung ist schon aufgeklappt`)
      merke(geschlossen.disclaimer, `${name}: Disclaimer fehlt im geschlossenen Zustand`)
      merke(geschlossen.mehrere, `${name}: Hinweis auf mehrere Reisende fehlt`)
      merke(netz.length === 0, `${name}: Netzwerk beim Mount der Vorbereitung ${netz.length}`)
      await page.getByRole('button', { name: 'Vorbereitung öffnen', exact: true }).click()
      await page.locator('#preparation-tickets-buchungen').waitFor()
      const offen = await messen(page)
      await bild(page, `open_${name}`, viewport.vollbild === true)
      schritte.push({ name: `open_${name}`, netz: netz.length, ...offen })
      merke(offen.premium === '5', `${name}: Marker fehlt`)
      merke(offen.horizontalOverflow === false, `${name}: horizontaler Überlauf ${offen.scrollWidth}/${offen.clientWidth}`)
      merke(
        offen.sektionsBreite >= offen.elternBreite - 4,
        `${name}: Sektion nutzt die Breite nicht ${offen.sektionsBreite}/${offen.elternBreite}`,
      )
      merke(offen.schmaleSpalten.length === 0, `${name}: schmale Textspalte ${JSON.stringify(offen.schmaleSpalten)}`)
      merke(offen.detailHidden === false, `${name}: Detail bleibt zu`)
      merke(offen.bereiche.filter((bereich) => bereich.open).length >= 4, `${name}: Bereiche nicht offen ${JSON.stringify(offen.bereiche)}`)
      merke(offen.zusammen.includes('Schweiz') && offen.zusammen.includes('Serbien'), `${name}: Staatsbürgerschaften ${offen.zusammen}`)
      merke(offen.zusammen.includes('Staatsbürgerschaft'), `${name}: Dokumentbindung fehlt`)
      merke(offen.zeilen.some((zeile) => zeile.freshness === 'current' && zeile.kompakt !== 'true'), `${name}: aktuelle Zeile fehlt`)
      merke(offen.zeilen.filter((zeile) => zeile.kompakt === 'true').length === 2, `${name}: Placeholder ${offen.zeilen.length}`)
      merke(
        offen.zeilen.filter((zeile) => zeile.freshness === 'current').every((zeile) => zeile.text.includes('Nicht erforderlich')),
        `${name}: aktuelle Zeile verliert das Ergebnis`,
      )
      merke(offen.registry.includes('Alex Beispiel') && offen.registry.includes('Schweiz') && offen.registry.includes('Serbien'), `${name}: Registry-Karte`)
      merke(offen.registry.includes('In diese Reise übernehmen'), `${name}: Übernahme-Aktion fehlt`)
      const klein = offen.controls.filter((control) => ['BUTTON', 'A', 'SUMMARY'].includes(control.tag) && control.height > 0 && control.height < 44)
      merke(klein.length === 0, `${name}: Kontrollen unter 44px ${JSON.stringify(klein.slice(0, 6))}`)
      merke(netz.length === 0, `${name}: Netzwerk nach dem Öffnen ${netz.length}`)
    } catch (error) {
      fehler.push(`${name}: ${error instanceof Error ? error.message : String(error)}`)
      try {
        await bild(page, `error_${name}`)
      } catch {
        // bereits erfasst
      }
    }
    await context.close()
  }

  const netz = []
  const context = await browser.newContext({
    viewport: { width: 390, height: 844 },
    hasTouch: true,
    deviceScaleFactor: 1,
    reducedMotion: 'reduce',
  })
  const page = await context.newPage()
  await abfangen(page, netz)
  try {
    await oeffnen(page)
    await vorbereitung(page)
    await page.getByRole('button', { name: 'Vorbereitung öffnen', exact: true }).click()
    const reisende = page.locator('[data-traveller-summary="traveller:1"]').locator('xpath=..')
    await reisende.getByText('Angaben bearbeiten', { exact: true }).click()
    await page.getByRole('button', { name: 'Weitere Staatsbürgerschaft', exact: true }).waitFor()
    await page.getByRole('button', { name: 'Weiteres Dokument', exact: true }).first().waitFor()
    await page.getByRole('button', { name: 'Angaben speichern', exact: true }).first().waitFor()
    await page.getByRole('button', { name: 'Angaben entfernen', exact: true }).first().waitFor()
    const binding = page.getByLabel('Zugeordnete Staatsbürgerschaft').first()
    merke(await binding.isVisible(), 'Bindung nicht sichtbar')
    const optionen = await binding.locator('option').allTextContents()
    merke(optionen.some((text) => text.includes('Schweiz')) && optionen.some((text) => text.includes('Serbien')), `Bindungsoptionen ${optionen.join('|')}`)
    const schrift = await page
      .locator('#reisevorbereitung-detail select')
      .filter({ has: page.locator('option[value="passport"]') })
      .first()
      .evaluate((el) => Number.parseFloat(getComputedStyle(el).fontSize))
    merke(schrift >= 16, `Formularschrift ${schrift}`)
    await page.getByRole('button', { name: 'Erledigt', exact: true }).first().click()
    await page.getByLabel('Eigene Vorbereitung').fill('Reiseadapter einpacken')
    await page.getByRole('button', { name: 'Punkt hinzufügen', exact: true }).click()
    merke((await page.getByLabel('Eigene Vorbereitung').inputValue()) === '', 'Eigenes Feld bleibt gefüllt')
    await page.getByRole('button', { name: 'In diese Reise übernehmen: Alex Beispiel', exact: true }).click()
    await page.getByRole('button', { name: 'Kopie für diese Reise erzeugen: Alex Beispiel', exact: true }).waitFor()
    await page.getByRole('button', { name: 'Abbrechen', exact: true }).click()
    await page.getByRole('button', { name: 'Vorbereitung schliessen', exact: true }).click()
    const zu = await messen(page)
    merke(zu.detailHidden === true, 'Schliessen lässt das Detail offen')
    const fokus = page.getByRole('button', { name: 'Vorbereitung öffnen', exact: true })
    await fokus.evaluate((el) => {
      if (el instanceof HTMLElement) el.focus({ focusVisible: true })
    })
    const ring = await fokus.evaluate((el) => {
      const stil = getComputedStyle(el)
      return { boxShadow: stil.boxShadow, outline: stil.outline, outlineOffset: stil.outlineOffset }
    })
    merke(ring.boxShadow !== 'none' || (ring.outline && ring.outline !== 'none' && !ring.outline.startsWith('0px')), `Fokusring fehlt ${JSON.stringify(ring)}`)
    const motion = await page.evaluate(() => window.matchMedia('(prefers-reduced-motion: reduce)').matches)
    merke(motion, 'Reduced Motion nicht aktiv')
    merke(netz.length === 0, `Interaktion hat einen Aufruf ausgelöst ${netz.length}`)
    await bild(page, 'interaction_390_closed')

    merke(page.url().includes('ansicht=vorbereitung'), `Adresse verliert Vorbereitung ${page.url()}`)
    await page.reload({ waitUntil: 'load' })
    await page.waitForFunction(() => document.querySelector('[data-workspace-ansicht="vorbereitung"]'))
    merke(page.url().includes('ansicht=vorbereitung'), `Reload verliert Vorbereitung ${page.url()}`)
    await page.goBack()
    await page.waitForFunction(() => document.querySelector('[data-workspace-ansicht="uebersicht"]'))
    await page.goForward()
    await page.waitForFunction(() => document.querySelector('[data-workspace-ansicht="vorbereitung"]'))
    schritte.push({ name: 'interaction_390', netz: netz.length, history: page.url() })
  } catch (error) {
    fehler.push(`interaction: ${error instanceof Error ? error.message : String(error)}`)
    try {
      await bild(page, 'error_interaction')
    } catch {
      // bereits erfasst
    }
  }
  await context.close()

  const textContext = await browser.newContext({
    viewport: { width: 360, height: 800 },
    hasTouch: true,
    deviceScaleFactor: 1,
  })
  const textPage = await textContext.newPage()
  const textNetz = []
  await abfangen(textPage, textNetz)
  try {
    await oeffnen(textPage, { text200: true })
    await vorbereitung(textPage)
    await textPage.getByRole('button', { name: 'Vorbereitung öffnen', exact: true }).click()
    await textPage.locator('[data-traveller-summary="traveller:1"]').locator('xpath=..').getByText('Angaben bearbeiten', { exact: true }).click()
    const stand = await messen(textPage)
    const formular = await textPage.evaluate(() => {
      const eigene = document.querySelector('input[placeholder="z. B. Reiseadapter einpacken"]')
      const datum = [...document.querySelectorAll('#reisevorbereitung-detail input[type="date"]')]
      const dokument = [...document.querySelectorAll('#reisevorbereitung-detail select')].filter((el) =>
        [...el.options].some((option) => option.value === 'passport'),
      )
      return [eigene, ...datum, ...dokument]
        .filter((el) => el instanceof HTMLElement && el.getClientRects().length > 0)
        .map((el) => ({
          tag: el.tagName,
          type: el.getAttribute('type'),
          font: Number.parseFloat(getComputedStyle(el).fontSize),
        }))
    })
    await bild(textPage, 'text200_360x800')
    schritte.push({ name: 'text200_360x800', netz: textNetz.length, formular, ...stand })
    merke(stand.htmlFont === '32px', `200% Schrift ist ${stand.htmlFont}`)
    merke(
      stand.sektionsBreite >= stand.elternBreite - 4,
      `200% Sektion nutzt die Breite nicht ${stand.sektionsBreite}/${stand.elternBreite}`,
    )
    merke(stand.schmaleSpalten.length === 0, `200% schmale Textspalte ${JSON.stringify(stand.schmaleSpalten)}`)
    if (stand.horizontalOverflow) {
      const ursache = await textPage.evaluate(() => {
        const breite = document.documentElement.clientWidth
        const sichtbar = [...document.querySelectorAll('body *')]
          .filter((el) => el instanceof HTMLElement && !el.closest('.sr-only') && el.scrollWidth > el.clientWidth + 8)
          .map((el) => ({
            tag: el.tagName,
            className: String(el.className).replace(/\s+/g, ' ').slice(0, 90),
            text: (el.innerText || '').replace(/\s+/g, ' ').trim().slice(0, 40),
            delta: el.scrollWidth - el.clientWidth,
            right: Math.round(el.getBoundingClientRect().right),
          }))
          .sort((a, b) => b.delta - a.delta)
          .slice(0, 8)
        const ausserhalb = [...document.querySelectorAll('body *')]
          .filter((el) => el instanceof HTMLElement && el.getBoundingClientRect().right > breite + 1)
          .slice(0, 6)
          .map((el) => ({
            tag: el.tagName,
            className: String(el.className).slice(0, 80),
            right: Math.round(el.getBoundingClientRect().right),
          }))
        return { sichtbar, ausserhalb }
      })
      fehler.push(`200% Ursache ${JSON.stringify(ursache)}`)
    }
    merke(stand.horizontalOverflow === false, `200% Überlauf ${stand.scrollWidth}/${stand.clientWidth}`)
    const klein = stand.controls.filter((control) => ['BUTTON', 'A', 'SUMMARY'].includes(control.tag) && control.height > 0 && control.height < 44)
    merke(klein.length === 0, `200% Kontrollen unter 44px ${JSON.stringify(klein.slice(0, 6))}`)
    merke(formular.length > 0 && formular.every((control) => control.font >= 32), `200% Formularschrift ${JSON.stringify(formular.slice(0, 6))}`)
  } catch (error) {
    fehler.push(`text200: ${error instanceof Error ? error.message : String(error)}`)
    try {
      await bild(textPage, 'error_text200')
    } catch {
      // bereits erfasst
    }
  }
  await textContext.close()

  for (const zoom of [
    { name: 'zoom125_1440x900', schrift: '125%' },
    { name: 'zoom150_1440x900', schrift: '150%' },
  ]) {
    const zoomContext = await browser.newContext({ viewport: { width: 1440, height: 900 }, hasTouch: false, deviceScaleFactor: 1 })
    const zoomPage = await zoomContext.newPage()
    const zoomNetz = []
    await abfangen(zoomPage, zoomNetz)
    try {
      await oeffnen(zoomPage)
      await zoomPage.evaluate((schrift) => {
        document.documentElement.style.fontSize = schrift
      }, zoom.schrift)
      await vorbereitung(zoomPage)
      await zoomPage.getByRole('button', { name: 'Vorbereitung öffnen', exact: true }).click()
      const stand = await messen(zoomPage)
      await bild(zoomPage, zoom.name, true)
      schritte.push({ name: zoom.name, netz: zoomNetz.length, ...stand })
      merke(stand.horizontalOverflow === false, `${zoom.name}: Überlauf ${stand.scrollWidth}/${stand.clientWidth}`)
      merke(stand.sektionsBreite >= stand.elternBreite - 4, `${zoom.name}: Sektion ${stand.sektionsBreite}/${stand.elternBreite}`)
      merke(stand.schmaleSpalten.length === 0, `${zoom.name}: schmale Textspalte ${JSON.stringify(stand.schmaleSpalten)}`)
      merke(zoomNetz.length === 0, `${zoom.name}: Netzwerk ${zoomNetz.length}`)
    } catch (error) {
      fehler.push(`${zoom.name}: ${error instanceof Error ? error.message : String(error)}`)
    }
    await zoomContext.close()
  }
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
    href: eintrag.href ?? null,
    htmlFont: eintrag.htmlFont ?? null,
    horizontalOverflow: eintrag.horizontalOverflow ?? null,
    premium: eintrag.premium ?? null,
    bereiche: eintrag.bereiche ?? null,
    zeilen: eintrag.zeilen ?? null,
    netz: eintrag.netz,
    history: eintrag.history ?? null,
  })),
}

writeFileSync(join(EVIDENZ, 'audit.json'), JSON.stringify(bericht, null, 2))
console.log(JSON.stringify({ ergebnis: bericht.ergebnis, fehler: bericht.fehler, schritte: schritte.length, sha: SHA }, null, 2))
if (fehler.length) process.exit(1)
