#!/usr/bin/env node
// scripts/activities-ui-audit.mjs
//
// Gezielter WebKit-/Chromium-Audit der Activities-Oberfläche.
// Dieselbe Messqualität wie PR #7: Inhaltsnachweis, Overflow, Clipping,
// Trefferflächen, Fokus, Tastatur. Fixtures nur hier, nie im Produktspeicher.

import { spawn } from 'node:child_process'
import { writeFileSync } from 'node:fs'
import { chromium, webkit } from 'playwright'

const PORT = process.env.AUDIT_PORT || '3456'
const BASIS = `http://127.0.0.1:${PORT}`
const PFAD = '/ui-audit/activities'
const BERICHT = process.env.AUDIT_REPORT || '/opt/cursor/artifacts/activities_ui_audit.json'

const BREITEN = [
  { name: '280', width: 280, height: 760 },
  { name: '320', width: 320, height: 760 },
  { name: '360', width: 360, height: 780 },
  { name: '390', width: 390, height: 844 },
  { name: '430', width: 430, height: 860 },
  { name: '667x375', width: 667, height: 375 },
  { name: '844x390', width: 844, height: 390 },
]

const JETZT = '2026-08-20T10:00:00.000Z'

const LEERE_EVIDENZ = {
  hatOrt: false,
  hatKoordinaten: false,
  hatTag: false,
  hatDatum: false,
  hatBestehendePunkte: false,
  hatBelastbareZeiten: false,
  hatInteressen: false,
  hatBudget: false,
}

function antwort(status, message, options = []) {
  return {
    status,
    message,
    coverageNote:
      'Die Aktivitätensuche zeigt verfügbare Angebote unseres jeweils angebundenen Datenpartners. Jetnitys Empfehlung bewertet die Passung zu Reise und Reisetag und ist keine provisionsgetriebene Rangliste.',
    evidenz: { ...LEERE_EVIDENZ, hatOrt: true, hatTag: true, hatDatum: true },
    options,
  }
}

function etappe(teil = {}) {
  return {
    id: 'stage-1',
    position: 1,
    name: 'Florenz',
    countryCode: 'IT',
    arrivalDate: '2026-09-12',
    departureDate: '2026-09-16',
    latitude: 43.7696,
    longitude: 11.2558,
    placeId: 'geonames:3176959',
    ...teil,
  }
}

function tag(index, teil = {}) {
  const datum = `2026-09-${String(11 + index).padStart(2, '0')}`
  return {
    id: `day-${index}`,
    stageId: 'stage-1',
    dayIndex: index,
    dayDate: datum,
    title: null,
    items: [],
    ...teil,
  }
}

function reise(teil = {}) {
  return {
    id: 'trip-audit-1',
    clientRef: 'trip-audit-1',
    title: 'Toskana',
    origin: 'Zürich',
    originPlaceId: 'geonames:2657896',
    startDate: '2026-09-12',
    endDate: '2026-09-16',
    travellers: 2,
    currency: 'CHF',
    budgetAmount: 4200,
    status: 'draft',
    pace: 'calm',
    interests: ['culture'],
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

const KARTEN = [
  {
    id: 'opt-lang',
    provider: 'test-activity',
    externalRef: 'ref-lang',
    title:
      'Sehr lange Führung durch die Uffizien mit zusätzlichem Rundgang über den Ponte Vecchio und einer Weinverkostung am Abend',
    description: null,
    locationName:
      'Galleria degli Uffizi, Piazzale degli Uffizi 6, sehr lange Adresszeile ohne erfundene Wegezeit',
    punkt: { lat: 43.7678, lon: 11.2553 },
    dauerMinuten: 210,
    timeslot: {
      startsOn: '2026-09-12',
      startsAt: '09:15',
      endsOn: '2026-09-12',
      endsAt: '12:45',
    },
    preis: 128.5,
    preisWaehrung: 'CHF',
    bewertung: 9.4,
    bewertungenAnzahl: 1840,
    stornierbar: true,
    kategorien: ['culture'],
    tags: ['museum'],
    labels: ['jetnity', 'best_rating'],
    reasons: [
      'Passt zu den Interessen dieser Reise.',
      'Liegt zeitlich neben den bereits geplanten Punkten dieses Tages.',
    ],
    konflikt: 'frei',
  },
  {
    id: 'opt-kompakt',
    provider: 'test-activity',
    externalRef: 'ref-kurz',
    title: 'Kurzer Marktspaziergang',
    description: null,
    locationName: 'Mercato Centrale',
    punkt: { lat: 43.776, lon: 11.254 },
    dauerMinuten: 75,
    timeslot: {
      startsOn: '2026-09-12',
      startsAt: '16:00',
      endsOn: '2026-09-12',
      endsAt: '17:15',
    },
    preis: 32,
    preisWaehrung: 'CHF',
    bewertung: 8.2,
    bewertungenAnzahl: 220,
    stornierbar: true,
    kategorien: ['food'],
    tags: ['markt'],
    labels: ['compact', 'flexible'],
    reasons: [],
    konflikt: 'unbekannt',
  },
]

const ZUSTAENDE = {
  'keine-tage': {
    nachweis: 'Diese Reise hat noch keine Tage',
    reise: reise({ days: [], stages: [], startDate: null, endDate: null }),
    api: null,
  },
  'tag-ohne-etappe': {
    nachweis: 'Dieser Tag hängt an keiner Etappe',
    reise: reise({
      stages: [],
      days: [tag(1, { stageId: null, title: 'Offener Tag' })],
    }),
    api: null,
  },
  'tag-leer': {
    nachweis: 'An diesem Tag ist noch nichts eingeplant',
    reise: reise(),
    api: 'real-unavailable',
  },
  'tag-mit-punkten': {
    nachweis: 'Punkte sind bereits geplant',
    reise: reise({
      days: [
        tag(1, {
          items: [
            {
              id: 'item-1',
              dayId: 'day-1',
              stageId: 'stage-1',
              kind: 'note',
              title: 'Dom',
              note: null,
              position: 1,
              startsOn: '2026-09-12',
              startsAt: '09:00',
              endsOn: '2026-09-12',
              endsAt: '11:00',
              priceAmount: null,
              priceCurrency: null,
              provider: null,
              externalRef: null,
              bookingUrl: null,
              bookingStatus: 'unconfirmed',
              bookingSource: null,
              bookingConfirmedAt: null,
            },
            {
              id: 'item-2',
              dayId: 'day-1',
              stageId: 'stage-1',
              kind: 'note',
              title: 'Mittagessen',
              note: null,
              position: 2,
              startsOn: '2026-09-12',
              startsAt: '13:00',
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
            },
          ],
        }),
        tag(2),
      ],
    }),
    api: 'real-unavailable',
  },
  'viele-tage': {
    nachweis: 'Reisetag',
    reise: reise({
      startDate: '2026-09-12',
      endDate: '2026-09-23',
      days: Array.from({ length: 12 }, (_, i) => tag(i + 1)),
    }),
    api: 'real-unavailable',
  },
  'lange-texte': {
    nachweis: 'Piazzale Michelangelo mit sehr langem Etappennamen ohne Abschneiden',
    reise: reise({
      stages: [
        etappe({
          name: 'Piazzale Michelangelo mit sehr langem Etappennamen ohne Abschneiden',
        }),
      ],
      days: [
        tag(1, {
          title: 'Erster sehr langer Reisetagestitel für die Chip-Zeile',
        }),
        tag(2, { title: 'Zweiter langer Titel ebenfalls ohne Ellipse als einzige Lösung' }),
      ],
    }),
    api: 'real-unavailable',
  },
  loading: {
    nachweis: 'Jetnity prüft, welche Aktivitäten zu diesem Tag passen',
    reise: reise(),
    api: 'loading',
  },
  unavailable: {
    nachweis: 'Passende Aktivitäten werden vorbereitet',
    reise: reise(),
    api: 'real-unavailable',
  },
  empty: {
    nachweis: 'Für diesen Tag gibt es gerade keine passenden Angebote',
    reise: reise(),
    api: antwort('empty', 'Für diesen Tag gibt es gerade keine passenden Angebote.'),
  },
  error: {
    nachweis: 'Die Aktivitätsanfrage ist fehlgeschlagen',
    reise: reise(),
    api: antwort('error', 'Die Aktivitätsanfrage ist fehlgeschlagen.'),
  },
  timeout: {
    nachweis: 'Die Suche hat zu lange gedauert',
    reise: reise(),
    api: antwort('timeout', 'Die Suche hat zu lange gedauert.'),
  },
  rate_limited: {
    nachweis: 'Bitte warte einen Moment',
    reise: reise(),
    api: antwort('rate_limited', 'Bitte warte einen Moment, dann kannst du erneut suchen.'),
  },
  karten: {
    nachweis: 'Sehr lange Führung durch die Uffizien',
    reise: reise(),
    api: antwort('ok', 'Passende Aktivitäten für diesen Tag.', KARTEN),
  },
}

function layoutPruefen() {
  const wurzel = document.querySelector('[aria-label="Aktivitäten"]')
  if (!wurzel) return { ok: false, fehler: ['Activities-Bereich nicht gerendert'] }

  const fehler = []
  const seite = document.documentElement
  if (seite.scrollWidth > seite.clientWidth + 1) {
    fehler.push(`Seiten-Overflow ${seite.scrollWidth}>${seite.clientWidth}`)
  }

  const sicht = { left: 0, top: 0, right: window.innerWidth, bottom: window.innerHeight }
  const knoepfe = [...wurzel.querySelectorAll('button, a, [role="radio"]')]

  for (const el of wurzel.querySelectorAll('*')) {
    const stil = getComputedStyle(el)
    const box = el.getBoundingClientRect()
    if (box.width < 1 || box.height < 1) continue

    let vorfahr = el.parentElement
    while (vorfahr && vorfahr !== document.body) {
      const overflow = getComputedStyle(vorfahr).overflow + getComputedStyle(vorfahr).overflowX
      if (/(hidden|clip)/.test(overflow) && vorfahr.getAttribute('aria-hidden') !== 'true') {
        const aussen = vorfahr.getBoundingClientRect()
        if (box.right > aussen.right + 2 || box.left < aussen.left - 2) {
          // Die Chip-Zeile darf intern waagrecht scrollen. Ein Vorfahr mit
          // overflow-hidden ausserhalb der Zeile ist dieselbe Ausnahme.
          // Seiten-Overflow bleibt oben über scrollWidth ein echter Fehler.
          if (el.closest('[aria-label="Reisetage"]') || vorfahr.closest('[aria-label="Reisetage"]')) break
          fehler.push(`abgeschnitten: ${el.tagName}.${el.className}`.slice(0, 160))
          break
        }
      }
      vorfahr = vorfahr.parentElement
    }

    const eltern = el.parentElement
    if (eltern) {
      const p = eltern.getBoundingClientRect()
      const flex = getComputedStyle(eltern)
      if ((flex.display.includes('flex') || flex.display.includes('grid')) && box.right > p.right + 8) {
        if (flex.overflowX === 'visible' && !eltern.closest('[aria-label="Reisetage"]')) {
          fehler.push(`ragt aus Eltern: ${el.tagName}`.slice(0, 120))
        }
      }
    }
  }

  for (const knopf of knoepfe) {
    const box = knopf.getBoundingClientRect()
    if (box.height + 0.5 < 44) {
      fehler.push(`Trefferfläche ${Math.round(box.height)}px < 44px (${knopf.textContent.trim().slice(0, 40)})`)
    }
  }

  for (let i = 0; i < knoepfe.length; i++) {
    const a = knoepfe[i].getBoundingClientRect()
    for (let j = i + 1; j < knoepfe.length; j++) {
      const b = knoepfe[j].getBoundingClientRect()
      const quer = Math.min(a.right, b.right) - Math.max(a.left, b.left)
      const hoch = Math.min(a.bottom, b.bottom) - Math.max(a.top, b.top)
      if (quer > 4 && hoch > 4) {
        fehler.push(`überlappende Bedienelemente: ${knoepfe[i].textContent.trim().slice(0, 24)}`)
      }
    }
  }

  for (const feld of wurzel.querySelectorAll('input, textarea, select')) {
    const groesse = Number.parseFloat(getComputedStyle(feld).fontSize)
    if (groesse < 16) fehler.push(`Eingabe ${groesse}px < 16px`)
  }

  const scores = wurzel.textContent.includes('score') || wurzel.innerHTML.includes('"score"')
  if (scores) fehler.push('interner Score im Activities-Bereich sichtbar')
  if (wurzel.textContent.includes('Preis zum Auswahlzeitpunkt')) {
    fehler.push('Preis bezieht sich auf einen Auswahlzeitpunkt')
  }
  if (wurzel.textContent.includes('In die Reise') && !wurzel.textContent.includes('Preisangabe')) {
    fehler.push('Preisangabe fehlt auf der Karte')
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

  void sicht
  return { ok: fehler.length === 0, fehler: [...new Set(fehler)].slice(0, 12) }
}

async function serverStarten() {
  const kind = spawn('npm', ['run', 'dev', '--', '-p', PORT, '-H', '127.0.0.1'], {
    env: {
      ...process.env,
      JETNITY_UI_AUDIT: '1',
      JETNITY_ACTIVITY_AKTIV: 'true',
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

const BRAUCHT_SUCHE = new Set(['loading', 'unavailable', 'empty', 'error', 'timeout', 'rate_limited', 'karten'])

async function flaecheOeffnen(page) {
  const region = page.getByRole('region', { name: 'Aktivitäten', exact: true })
  if (await region.count()) return region
  const detail = page.getByRole('region', { name: 'Reisedetail' })
  const oeffnen = detail.getByRole('button', { name: 'Aktivitäten suchen', exact: true })
  if (!(await oeffnen.count())) {
    const nav = page.getByRole('navigation', { name: 'Reisebereiche' }).getByRole('button', {
      name: 'Aktivitäten',
      exact: true,
    })
    if (await nav.count()) await nav.click()
  }
  try {
    await oeffnen.waitFor({ timeout: 15000 })
  } catch (error) {
    const seite = await page.locator('body').innerText().catch(() => '')
    const meldung = error instanceof Error ? error.message : String(error)
    throw new Error(`${meldung}\nSeite: ${seite.replace(/\s+/g, ' ').slice(0, 400)}`)
  }
  await oeffnen.click()
  await region.waitFor({ timeout: 15000 })
  return region
}

async function seiteVorbereiten(page, zustand, { delayMs = 0, onRequest } = {}) {
  const defin = ZUSTAENDE[zustand]
  await page.addInitScript(
    ({ speicher, reise }) => {
      sessionStorage.setItem(speicher, JSON.stringify(reise))
    },
    { speicher: 'jetnity:ui-audit:reise', reise: defin.reise },
  )

  await page.route('**/api/activities/search', async (route) => {
    onRequest?.()
    if (defin.api === null) {
      await route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify(antwort('unavailable', 'Kein Tagesziel für die Suche.')),
      })
      return
    }
    if (defin.api === 'loading') {
      await new Promise((r) => setTimeout(r, 30_000))
      await route.abort()
      return
    }
    if (defin.api === 'real-unavailable') {
      await route.continue()
      return
    }
    if (delayMs) await new Promise((r) => setTimeout(r, delayMs))
    await route.fulfill({
      status: defin.api.status === 'rate_limited' ? 429 : defin.api.status === 'error' ? 500 : 200,
      contentType: 'application/json',
      headers: { 'cache-control': 'no-store' },
      body: JSON.stringify(defin.api),
    })
  })
}

async function zustandPruefen(browser, name, viewport, zustand) {
  const kontext = await browser.newContext({
    viewport: { width: viewport.width, height: viewport.height },
    hasTouch: viewport.width <= 430,
  })
  const page = await kontext.newPage()
  let anfragen = 0
  await seiteVorbereiten(page, zustand, { onRequest: () => { anfragen += 1 } })
  await page.goto(`${BASIS}${PFAD}`, { waitUntil: 'domcontentloaded' })
  const region = await flaecheOeffnen(page)
  if (BRAUCHT_SUCHE.has(zustand)) {
    await region.getByRole('button', { name: 'Für diesen Tag suchen', exact: true }).click()
  }
  const nachweis = ZUSTAENDE[zustand].nachweis
  try {
    // Nur der Aktivitätsbereich zählt. Der eingebettete Tagesplan in der
    // Übersicht kann dieselben Wörter tragen und ist auf Mobile versteckt.
    await page
      .getByLabel('Aktivitäten', { exact: true })
      .getByText(nachweis, { exact: false })
      .first()
      .waitFor({ timeout: zustand === 'loading' ? 4000 : 15000 })
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
  const erwartet = BRAUCHT_SUCHE.has(zustand) ? 1 : 0
  if (anfragen !== erwartet) layout.fehler.push(`Suchaufrufe ${anfragen}, erwartet ${erwartet}`)
  await kontext.close()
  return {
    ok: layout.ok && anfragen === erwartet,
    engine: name,
    viewport: viewport.name,
    zustand,
    fehler: layout.fehler,
    anfragen,
  }
}

async function interaktionPruefen(browser, name) {
  const kontext = await browser.newContext({ viewport: { width: 390, height: 844 }, hasTouch: true })
  const page = await kontext.newPage()
  let anfragen = 0
  await page.addInitScript(
    ({ speicher, reise }) => sessionStorage.setItem(speicher, JSON.stringify(reise)),
    { speicher: 'jetnity:ui-audit:reise', reise: ZUSTAENDE['viele-tage'].reise },
  )
  await page.route('**/api/activities/search', async (route) => {
    anfragen += 1
    const roh = route.request().postData() || '{}'
    await new Promise((r) => setTimeout(r, 250))
    const tag = JSON.parse(roh).day?.id || 'unbekannt'
    await route.fulfill({
      status: 200,
      contentType: 'application/json',
      body: JSON.stringify(antwort('empty', `Antwort für ${tag}`)),
    })
  })
  await page.goto(`${BASIS}${PFAD}`, { waitUntil: 'domcontentloaded' })
  const region = await flaecheOeffnen(page)
  const nachOeffnen = anfragen
  const chips = region.getByRole('radio')
  await chips.first().waitFor({ timeout: 15000 })
  await chips.nth(1).click()
  await chips.nth(2).click()
  await page.waitForTimeout(400)
  const nachWechsel = anfragen
  const checked = await chips.nth(2).getAttribute('aria-checked')
  await region.getByRole('button', { name: 'Für diesen Tag suchen', exact: true }).click()
  await region.getByText('Antwort für day-3').waitFor({ timeout: 15000 })
  const text = await region.innerText()
  await page.locator('[aria-label="Reisetage"]').focus()
  await page.keyboard.press('Tab')
  const fokusSichtbar = await page.evaluate(() => {
    const el = document.activeElement
    return Boolean(el && el.matches(':focus-visible'))
  })
  await page.keyboard.press('Tab')
  const nachTab = await page.evaluate(() => document.activeElement?.getAttribute('role') === 'radio')

  await kontext.close()
  const fehler = []
  if (nachOeffnen !== 0) fehler.push(`Öffnen der Fläche hat ${nachOeffnen} Suchen ausgelöst`)
  if (nachWechsel !== 0) fehler.push(`Tagwechsel hat ${nachWechsel} Suchen ausgelöst`)
  if (anfragen !== 1) fehler.push(`explizite Suche: ${anfragen} Aufrufe, erwartet 1`)
  if (!text.includes('Antwort für day-3')) fehler.push(`Antwort gehört nicht zum gewählten Tag: ${text.slice(0, 180)}`)
  if (checked !== 'true') fehler.push('aria-checked des dritten Chips ist nicht true')
  if (!fokusSichtbar) fehler.push('Fokusring nach Chip-Fokus nicht sichtbar')
  if (!nachTab) fehler.push('Tab verlässt die Tag-Gruppe nicht nachvollziehbar oder bleibt hängen')
  return { ok: fehler.length === 0, engine: name, viewport: '390-interaktion', zustand: 'tagwechsel', fehler, anfragen }
}

function karte(titel) {
  return {
    ...KARTEN[1],
    id: 'opt-1',
    title: titel,
  }
}

async function lebenszyklusPruefen(browser, name, viewport) {
  const kontext = await browser.newContext({
    viewport: { width: viewport.width, height: viewport.height },
    hasTouch: viewport.touch,
  })
  const page = await kontext.newPage()
  const fehler = []
  let anfragen = 0
  let verzoegerung = 0
  let naechste = null
  const basisReise = reise()
  await page.addInitScript(
    ({ speicher, reise }) => {
      const schrift = () => {
        const wurzel = document.documentElement
        if (wurzel) wurzel.style.fontSize = '20px'
      }
      schrift()
      document.addEventListener('DOMContentLoaded', schrift)
      sessionStorage.setItem(speicher, JSON.stringify(reise))
    },
    { speicher: 'jetnity:ui-audit:reise', reise: basisReise },
  )
  await page.route('**/api/activities/search', async (route) => {
    anfragen += 1
    const roh = route.request().postData() || '{}'
    const tag = JSON.parse(roh).day?.id || 'unbekannt'
    if (verzoegerung) await new Promise((r) => setTimeout(r, verzoegerung))
    const koerper = naechste?.koerper || antwort('empty', `Antwort für ${tag}`)
    const httpStatus = naechste?.httpStatus || (koerper.status === 'rate_limited' ? 429 : koerper.status === 'error' ? 500 : 200)
    naechste = null
    try {
      await route.fulfill({
        status: httpStatus,
        contentType: 'application/json',
        body: JSON.stringify(koerper),
      })
    } catch {
      // Ein Kontextwechsel darf den Browser-Read abbrechen. Die Oberfläche
      // darf die Antwort trotzdem nicht übernehmen, falls sie noch ankommt.
    }
  })

  const merken = (bedingung, text) => {
    if (!bedingung) fehler.push(text)
  }

  try {
    await page.goto(`${BASIS}${PFAD}`, { waitUntil: 'domcontentloaded' })
    const region = await flaecheOeffnen(page)
    merken(anfragen === 0, `Mount/Öffnen: ${anfragen} Suchen`)
    const anfang = await region.innerText()
    merken(anfang.includes('Für diese Angaben liegt noch keine Suche vor.'), 'Idle-Zustand fehlt')
    merken(anfang.includes('Florenz'), 'Ziel fehlt')
    const quelle = await region.evaluate((el) => el.textContent || '')
    merken(quelle.includes('Reisende'), 'Reisende fehlen')
    merken(/\b2\b/.test(anfang), 'Teilnehmerzahl fehlt')
    merken(anfang.includes('CHF'), 'Währung fehlt')
    merken(anfang.includes('Datum') || anfang.includes('Sep'), 'Datum fehlt')

    const chips = region.getByRole('radio')
    await chips.nth(1).click()
    await chips.first().click()
    merken(anfragen === 0, `Kontextwechsel: ${anfragen} Suchen`)
    merken((await chips.first().getAttribute('aria-checked')) === 'true', 'gemeinsame Tageswahl verliert aria-checked')

    const vorher = anfragen
    await page.evaluate(() => {
      const knopf = [...document.querySelectorAll('button')].find((el) => el.textContent?.trim() === 'Für diesen Tag suchen')
      knopf?.click()
      knopf?.click()
    })
    await region.getByText('Antwort für day-1').waitFor({ timeout: 15000 })
    merken(anfragen === vorher + 1, `Doppelsuche: ${anfragen - vorher} statt 1`)

    verzoegerung = 700
    const vorSpaet = anfragen
    await region.getByRole('button', { name: 'Erneut suchen', exact: true }).click()
    await chips.nth(1).click()
    await chips.first().click()
    await page.waitForTimeout(900)
    const nachSpaet = await region.innerText()
    merken(!nachSpaet.includes('Antwort für day-1'), 'A→B→A hat die alte Antwort wiederbelebt')
    merken(anfragen === vorSpaet + 1, `verspätete Suche: ${anfragen - vorSpaet} Aufrufe`)
    verzoegerung = 0
    await region.getByRole('button', { name: 'Für diesen Tag suchen', exact: true }).click()
    await region.getByText('Antwort für day-1').waitFor({ timeout: 15000 })

    const vorReise = anfragen
    const andereReise = reise({ id: 'trip-audit-2', clientRef: 'trip-audit-2', title: 'Gleiche Angaben' })
    await page.evaluate((wert) => window.__jetnityActivitiesAudit.reiseSetzen(wert), andereReise)
    await page.waitForTimeout(200)
    merken(!(await region.innerText()).includes('Antwort für day-1'), 'gleiche Anfrage einer anderen Reise zeigt die alte Antwort')
    merken(anfragen === vorReise, 'Reisewechsel hat eine Suche ausgelöst')

    naechste = { koerper: antwort('ok', 'Passende Aktivitäten für diesen Tag.', [karte('Alt')]) }
    await region.getByRole('button', { name: 'Für diesen Tag suchen', exact: true }).click()
    await region.getByRole('button', { name: 'In die Reise', exact: true }).waitFor({ timeout: 15000 })
    merken((await region.innerText()).includes('Preisangabe'), 'Preisangabe fehlt')
    merken(!(await region.innerText()).includes('Preis zum Auswahlzeitpunkt'), 'alter Preiszeitpunkt sichtbar')

    await page.evaluate(() => window.__jetnityActivitiesAudit.uebernahme('null'))
    const vorNull = await page.evaluate(() => window.__jetnityActivitiesAudit.stand().aufrufe)
    await region.getByRole('button', { name: 'In die Reise', exact: true }).click()
    await region.getByText('Das bestätigt nicht, dass der Punkt in der Reise gespeichert ist.').waitFor({ timeout: 15000 })
    await page.evaluate(() => {
      document.querySelector('button')
      const knopf = [...document.querySelectorAll('button')].find((el) => el.textContent?.includes('In die Reise'))
      knopf?.click()
    })
    const nachNull = await page.evaluate(() => window.__jetnityActivitiesAudit.stand())
    merken(nachNull.aufrufe === vorNull + 1, `null-Übernahme ${nachNull.aufrufe - vorNull} statt 1`)
    merken(nachNull.letzte?.title === 'Alt', `null-Übernahme sendete ${nachNull.letzte?.title}`)

    naechste = { koerper: antwort('ok', 'Passende Aktivitäten für diesen Tag.', [karte('Neu')]) }
    await region.getByRole('button', { name: 'Erneut suchen', exact: true }).click()
    await region.getByRole('heading', { name: 'Neu', exact: true }).waitFor({ timeout: 15000 })
    await page.evaluate(() => window.__jetnityActivitiesAudit.uebernahme('string'))
    await region.getByRole('button', { name: 'In die Reise', exact: true }).click()
    await region.getByText('nicht bestätigt').waitFor({ timeout: 15000 })
    const nachText = await page.evaluate(() => window.__jetnityActivitiesAudit.stand())
    merken(nachText.letzte?.title === 'Neu', 'wiederverwendete ID sendete den alten Inhalt')
    merken((await region.innerText()).includes('Der Punkt konnte nicht zugeordnet werden.'), 'Rückmeldetest fehlt')

    for (const art of ['throw', 'reject', 'malformed']) {
      naechste = { koerper: antwort('ok', 'Passende Aktivitäten für diesen Tag.', [karte(`Karte ${art}`)]) }
      await region.getByRole('button', { name: 'Erneut suchen', exact: true }).click()
      await region.getByText(`Karte ${art}`).waitFor({ timeout: 15000 })
      const vor = await page.evaluate(() => window.__jetnityActivitiesAudit.stand().aufrufe)
      await page.evaluate((wert) => window.__jetnityActivitiesAudit.uebernahme(wert), art)
      await region.getByRole('button', { name: 'In die Reise', exact: true }).click()
      await region.getByText('Die Übernahme ist nicht bestätigt.').waitFor({ timeout: 15000 })
      const stand = await page.evaluate(() => window.__jetnityActivitiesAudit.stand())
      merken(stand.aufrufe === vor + 1, `${art}: ${stand.aufrufe - vor} Aufrufe`)
      merken(!(await region.innerText()).includes('audit-wurf'), `${art} zeigt einen Rohfehler`)
      merken(!(await region.innerText()).includes('gespeichert: false'), `${art} zeigt die Rohform`)
    }

    naechste = { koerper: antwort('ok', 'Passende Aktivitäten für diesen Tag.', [karte('Hängt')]) }
    await region.getByRole('button', { name: 'Erneut suchen', exact: true }).click()
    await region.getByText('Hängt').waitFor({ timeout: 15000 })
    await page.evaluate(() => window.__jetnityActivitiesAudit.uebernahme('haengen'))
    const vorHang = await page.evaluate(() => window.__jetnityActivitiesAudit.stand().aufrufe)
    await region.getByRole('button', { name: 'In die Reise', exact: true }).click()
    await page.waitForTimeout(150)
    await chips.nth(1).click()
    await page.evaluate(() => window.__jetnityActivitiesAudit.freigeben())
    await page.waitForTimeout(200)
    merken(!(await region.innerText()).includes('Die Übernahme wurde gemeldet.'), 'alte Übernahme schreibt in den neuen Tag')
    await chips.first().click()
    await region.getByText('Das bestätigt nicht, dass der Punkt in der Reise gespeichert ist.').waitFor({ timeout: 15000 })
    const nachHang = await page.evaluate(() => window.__jetnityActivitiesAudit.stand().aufrufe)
    merken(nachHang === vorHang + 1, 'hängende Übernahme wurde wiederholt')

    const vorFehler = anfragen
    naechste = {
      httpStatus: 500,
      koerper: antwort('ok', 'ROH-ERFOLG', [karte('Geheimkarte')]),
    }
    await region.getByRole('button', { name: 'Für diesen Tag suchen', exact: true }).click()
    await region.getByText('Die Aktivitätsanfrage ist fehlgeschlagen.').waitFor({ timeout: 15000 })
    const nachFehler = await region.innerText()
    merken(!nachFehler.includes('ROH-ERFOLG'), 'Fehlerform zeigt die Rohmeldung')
    merken(!nachFehler.includes('Geheimkarte'), 'Fehlerform zeigt eine Karte')
    merken(anfragen === vorFehler + 1, 'Fehlerform hat nicht genau eine Suche ausgelöst')

    const vorBereich = anfragen
    if (viewport.width >= 1024) {
      await page.getByRole('navigation', { name: 'Reisebereiche' }).getByRole('button', { name: 'Flüge', exact: true }).click()
      await page.getByRole('navigation', { name: 'Reisebereiche' }).getByRole('button', { name: 'Aktivitäten', exact: true }).click()
    } else {
      await page.getByRole('button', { name: 'Zur Organisation', exact: true }).click()
      await page.getByRole('navigation', { name: 'Reisebereiche' }).getByRole('button', { name: 'Aktivitäten', exact: true }).click()
    }
    await flaecheOeffnen(page)
    merken(anfragen === vorBereich, 'Bereichswechsel hat eine Suche ausgelöst')

    const vorDemontage = anfragen
    const aufrufeVorDemontage = await page.evaluate(() => window.__jetnityActivitiesAudit.stand().aufrufe)
    await page.evaluate(() => window.__jetnityActivitiesAudit.flaeche(false))
    await page.evaluate(() => window.__jetnityActivitiesAudit.flaeche(true))
    await flaecheOeffnen(page)
    await page.waitForTimeout(200)
    merken(anfragen === vorDemontage, 'Remount hat eine Suche ausgelöst')
    merken(
      (await page.evaluate(() => window.__jetnityActivitiesAudit.stand().aufrufe)) === aufrufeVorDemontage,
      'Remount hat eine Übernahme wiederholt',
    )
    merken((await region.innerText()).includes('Für diese Angaben liegt noch keine Suche vor.'), 'Remount zeigt kein Idle')

    const enthalten = await page.evaluate(() => {
      const seite = document.documentElement
      const wurzel = document.querySelector('[aria-label="Aktivitäten"]')
      const knoepfe = [...(wurzel?.querySelectorAll('button, [role="radio"]') ?? [])]
      const klein = knoepfe
        .filter((el) => el.getBoundingClientRect().height + 0.5 < 44)
        .map((el) => (el.textContent || '').trim().slice(0, 40))
      return { overflow: seite.scrollWidth > seite.clientWidth + 1, klein }
    })
    merken(!enthalten.overflow, 'vergrößerte Schrift erzeugt Seiten-Overflow')
    merken(enthalten.klein.length === 0, `Trefferfläche unter 44px: ${enthalten.klein.join(', ')}`)
    await page.locator('[aria-label="Reisetage"]').focus()
    await page.keyboard.press('Tab')
    const fokus = await page.evaluate(() => document.activeElement?.matches(':focus-visible') === true)
    merken(fokus, 'vergrößerte Schrift ohne sichtbaren Fokus')
  } catch (error) {
    fehler.push(error instanceof Error ? error.message : String(error))
  } finally {
    await kontext.close()
  }

  return {
    ok: fehler.length === 0,
    engine: name,
    viewport: `${viewport.name}-lebenszyklus`,
    zustand: 'lebenszyklus',
    fehler: fehler.slice(0, 12),
    anfragen,
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
        for (const viewport of [
          { name: '390', width: 390, height: 844, touch: true },
          { name: '1280', width: 1280, height: 800, touch: false },
        ]) {
          ergebnisse.push(await lebenszyklusPruefen(browser, name, viewport))
        }
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
    anfragenInteraktion: ergebnisse.filter((e) => e.anfragen).map((e) => ({ engine: e.engine, anfragen: e.anfragen })),
  }
  try {
    writeFileSync(BERICHT, JSON.stringify(bericht, null, 2))
  } catch {
    writeFileSync('activities_ui_audit.json', JSON.stringify(bericht, null, 2))
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
