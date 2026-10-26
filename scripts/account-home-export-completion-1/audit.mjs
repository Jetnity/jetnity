#!/usr/bin/env node
// Montierte Kontoübersicht und Exportaktion. Synthetische Fixtures.
// Externes Netz wird abgebrochen. Keine echte Kontositzung.

import { existsSync, mkdirSync, readdirSync, readFileSync, writeFileSync } from 'node:fs'
import { join } from 'node:path'
import assert from 'node:assert/strict'
import { build } from 'esbuild'
import { chromium } from 'playwright'

const wurzel = process.cwd()
const ausgabe = join(wurzel, 'docs/evidence/account-home-export-completion-1')
mkdirSync(ausgabe, { recursive: true })

const gebaut = await build({
  entryPoints: ['scripts/account-home-export-completion-1/harness.tsx'],
  bundle: true,
  write: false,
  platform: 'browser',
  format: 'iife',
  jsx: 'automatic',
  define: { 'process.env.NODE_ENV': '"production"' },
  banner: { js: 'globalThis.process = globalThis.process || { env: { NODE_ENV: "production" } };' },
  plugins: [
    {
      name: 'alias',
      setup(buildHook) {
        buildHook.onResolve({ filter: /^@\// }, (args) => {
          const basis = join(wurzel, args.path.slice(2))
          const endungen = ['.tsx', '.ts', '.jsx', '.js']
          for (const endung of endungen) {
            if (existsSync(basis + endung)) return { path: basis + endung }
          }
          for (const endung of endungen) {
            const index = join(basis, `index${endung}`)
            if (existsSync(index)) return { path: index }
          }
          return { path: basis }
        })
        buildHook.onResolve({ filter: /^server-only$/ }, () => ({
          path: join(wurzel, 'scripts/account-home-export-completion-1/server-only-stub.js'),
        }))
      },
    },
  ],
})

const skript = gebaut.outputFiles[0]?.text
if (!skript) throw new Error('Harness wurde nicht gebündelt.')

function reise(teil) {
  return {
    origin: 'Zürich',
    startDate: '2026-08-23',
    endDate: '2026-08-23',
    travellers: 1,
    currency: 'CHF',
    budgetAmount: null,
    status: 'planned',
    updatedAt: '2026-08-01T10:00:00.000Z',
    stages: [{ name: 'Lissabon', position: 1, countryCode: 'PT', placeId: 'lis', latitude: 38.7, longitude: -9.1 }],
    stageCount: 1,
    dayCount: 1,
    itemCount: 0,
    ...teil,
  }
}

// 215 Zeichen liegen ausserhalb von GRENZEN.titel (120). Das bleibt Stress,
// nicht ein gültiger gespeicherter Titel.
const lang = 'Lissabon '.repeat(24).trim()
const titelGueltig = 'Lissabon '.repeat(13).trim()
assert.equal(lang.length, 215)
assert.equal(titelGueltig.length, 116)

function fensterReisen(anzahl, extra, titel = lang) {
  return Array.from({ length: anzahl }, (_, index) =>
    reise({
      id: `r${index}`,
      title: index === 0 ? titel : `Reise ${index}`,
      startDate: index === 0 ? '2026-11-02' : '2026-12-01',
      endDate: index === 0 ? '2026-11-06' : '2026-12-04',
      updatedAt: `2026-08-${String((index % 27) + 1).padStart(2, '0')}T10:00:00.000Z`,
      ...extra,
    }),
  )
}

const faelle = {
  aktiv: {
    modus: 'home',
    name: 'Sasa',
    problem: null,
    besuchProblem: null,
    reisen: [reise({ id: 'aktiv', title: 'Lissabon' })],
  },
  grenze: {
    modus: 'home',
    name: 'Sasa',
    problem: null,
    besuchProblem: null,
    reisen: fensterReisen(200),
  },
  ohneEtappen: {
    modus: 'home',
    name: 'Sasa',
    problem: null,
    besuchProblem: null,
    reisen: Array.from({ length: 200 }, (_, index) =>
      reise({
        id: `o${index}`,
        title: `Ohne Etappe ${index}`,
        stages: [],
        stageCount: 0,
        dayCount: 0,
        startDate: '2026-11-02',
        endDate: '2026-11-06',
      }),
    ),
  },
  knapp: {
    modus: 'home',
    name: 'Sasa',
    problem: null,
    besuchProblem: null,
    reisen: fensterReisen(199),
  },
  archiv: {
    modus: 'home',
    name: 'Sasa',
    problem: null,
    besuchProblem: null,
    reisen: fensterReisen(200, { status: 'archived', archivePreviousStatus: 'planned', startDate: '2026-09-01', endDate: '2026-09-04' }),
  },
  leer: {
    modus: 'home',
    name: null,
    problem: null,
    besuchProblem: null,
    reisen: [],
  },
  reiseFehler: {
    modus: 'home',
    name: 'Sasa',
    problem: { status: 503, message: 'unavailable' },
    besuchProblem: null,
    reisen: [],
  },
  besuchFehler: {
    modus: 'home',
    name: 'Sasa',
    problem: null,
    besuchProblem: { status: 500, message: 'visits' },
    reisen: [reise({ id: 'offen', title: 'Porto', startDate: '2026-09-02', endDate: '2026-09-06' })],
  },
  export: {
    modus: 'export',
    name: null,
    problem: null,
    besuchProblem: null,
    reisen: [],
  },
}

function uhrSkript() {
  return `(() => {
    const Real = Date
    let instant = Real.parse('2026-08-23T12:00:00.000Z')
    let offset = 0
    function Fake(...args) {
      const wert = args.length === 0 ? new Real(instant) : new Real(...args)
      wert.getTimezoneOffset = () => offset
      return wert
    }
    Fake.now = () => instant
    Fake.parse = Real.parse
    Fake.UTC = Real.UTC
    Fake.prototype = Real.prototype
    window.Date = Fake
    const originalTimeout = window.setTimeout.bind(window)
    window.setTimeout = (fn, ms, ...rest) => {
      const delay = Number(ms) || 0
      if (window.__uhr && window.__uhr.folge && delay >= 1000) {
        return originalTimeout(() => {
          window.__uhr.advance(delay)
          window.__uhr.folge = false
          fn()
        }, 300)
      }
      return originalTimeout(fn, ms, ...rest)
    }
    window.__uhr = {
      folge: false,
      set(iso, versatz) {
        instant = Real.parse(iso)
        offset = versatz
      },
      advance(ms) { instant += ms },
    }
  })()`
}

const browser = await chromium.launch({ headless: true })
const context = await browser.newContext({ acceptDownloads: true })
let exportHandler = null
let dokument = '<!doctype html><html><body><div id="root"></div></body></html>'
await context.route('**/*', async (route) => {
  const url = route.request().url()
  if (url.includes('/api/account/export')) {
    if (!exportHandler) return route.abort()
    return exportHandler(route)
  }
  if (url.startsWith('http://127.0.0.1:8765/konto')) {
    return route.fulfill({ status: 200, contentType: 'text/html; charset=utf-8', body: dokument })
  }
  if (url.startsWith('data:') || url === 'about:blank' || url.startsWith('blob:')) return route.continue()
  return route.abort()
})
const page = await context.newPage()
const seitenfehler = []
const netz = []
page.on('pageerror', (error) => seitenfehler.push(error.message))
page.on('request', (request) => netz.push(request.url()))
const protokoll = []

async function zeige(fixture, css) {
  dokument = `<!doctype html><html><head><meta charset="utf-8">${css}</head><body style="margin:0"><main style="max-width:72rem;margin:auto"><div id="root"></div></main></body></html>`
  await page.goto('http://127.0.0.1:8765/konto', { waitUntil: 'domcontentloaded' })
  await page.evaluate(uhrSkript())
  await page.evaluate((wert) => {
    window.__fixture = wert
  }, fixture)
  await page.addScriptTag({ content: skript })
  await page.waitForSelector('[data-account-uebersicht], [data-export-phase], [data-world-map]')
}

function sichtbar(text) {
  return text.toLocaleLowerCase('de-CH')
}

async function aktionenEnthalten(seite, hinweis) {
  const masse = await seite.evaluate(() => {
    const karte = document.querySelector('[data-account-naechste]')
    const links = [...karte.querySelectorAll('a')]
    const wurzel = parseFloat(getComputedStyle(document.documentElement).fontSize)
    function messen(el) {
      const bereich = document.createRange()
      const wanderer = document.createTreeWalker(el, NodeFilter.SHOW_TEXT)
      const liste = []
      let knoten = wanderer.nextNode()
      while (knoten) {
        if (knoten.textContent.trim()) {
          bereich.selectNodeContents(knoten)
          for (const rechteck of bereich.getClientRects()) {
            liste.push({
              left: rechteck.left,
              right: rechteck.right,
              top: rechteck.top,
              bottom: rechteck.bottom,
              width: rechteck.width,
              height: rechteck.height,
            })
          }
        }
        knoten = wanderer.nextNode()
      }
      const kasten = el.getBoundingClientRect()
      const spiel = 1
      const textDrin =
        liste.length > 0 &&
        liste.every(
          (rechteck) =>
            rechteck.width > 0 &&
            rechteck.height > 0 &&
            rechteck.left >= kasten.left - spiel &&
            rechteck.right <= kasten.right + spiel &&
            rechteck.top >= kasten.top - spiel &&
            rechteck.bottom <= kasten.bottom + spiel,
        )
      return {
        name: (el.textContent || '').replace(/\s+/g, ' ').trim(),
        href: el.getAttribute('href'),
        textDrin,
        breite: kasten.width,
        hoehe: kasten.height,
        scrollWidth: el.scrollWidth,
        clientWidth: el.clientWidth,
        kasten: { left: kasten.left, right: kasten.right, top: kasten.top, bottom: kasten.bottom },
      }
    }
    const kartenKasten = karte.getBoundingClientRect()
    const aktionen = links.map(messen)
    const ueberlappung = []
    for (let i = 0; i < aktionen.length; i += 1) {
      for (let j = i + 1; j < aktionen.length; j += 1) {
        const a = aktionen[i].kasten
        const b = aktionen[j].kasten
        const treffer = a.left < b.right - 1 && a.right > b.left + 1 && a.top < b.bottom - 1 && a.bottom > b.top + 1
        if (treffer) ueberlappung.push([aktionen[i].name, aktionen[j].name])
      }
    }
    const inKarte = aktionen.every(
      (aktion) =>
        aktion.kasten.left >= kartenKasten.left - 1 &&
        aktion.kasten.right <= kartenKasten.right + 1 &&
        aktion.kasten.top >= kartenKasten.top - 1 &&
        aktion.kasten.bottom <= kartenKasten.bottom + 1,
    )
    const titel = document.querySelector('[data-account-naechste] h2')
    return { wurzel, aktionen, ueberlappung, inKarte, titel: titel ? messen(titel) : null }
  })
  const mindest = masse.wurzel * 2.75 - 1
  assert.equal(masse.aktionen.length, 2, hinweis)
  for (const aktion of masse.aktionen) {
    assert.equal(aktion.textDrin, true, `${hinweis} ${aktion.name}`)
    assert.equal(aktion.scrollWidth <= aktion.clientWidth + 1, true, `${hinweis} ${aktion.name} scroll`)
    assert.ok(aktion.hoehe + 0.5 >= mindest, `${hinweis} ${aktion.name} hoehe ${aktion.hoehe}`)
    assert.ok(aktion.breite + 0.5 >= mindest, `${hinweis} ${aktion.name} breite ${aktion.breite}`)
  }
  assert.equal(masse.ueberlappung.length, 0, hinweis)
  assert.equal(masse.inKarte, true, hinweis)
  assert.equal(masse.titel === null || masse.titel.scrollWidth <= masse.titel.clientWidth + 1, true, `${hinweis} titel`)
  return masse
}

function cssAusBuild() {
  const ordner = [join(wurzel, '.next/static/css'), join(wurzel, '.next/static/chunks')]
  const dateien = ordner.flatMap((pfad) =>
    existsSync(pfad) ? readdirSync(pfad).filter((name) => name.endsWith('.css')).map((name) => join(pfad, name)) : [],
  )
  return dateien.map((pfad) => `<style>${readFileSync(pfad, 'utf8')}</style>`).join('')
}

try {
  const css = cssAusBuild()
  protokoll.push(
    css
      ? `Projekt-CSS aus dem Build ist eingebunden (${css.length} Zeichen).`
      : 'Kein Projekt-CSS im Build gefunden. Überlauf gilt dann nur für das Fixture-Dokument.',
  )
  await zeige(faelle.aktiv, css)
  await page.waitForFunction(() => document.querySelector('[data-account-heute]')?.getAttribute('data-account-heute') === '2026-08-23')
  await page.waitForFunction(() => document.querySelector('[data-account-naechste]')?.getAttribute('data-account-naechste') === 'aktiv')
  protokoll.push('Der Geräte-Tag nach dem Mount macht die Reise aktiv.')

  await page.evaluate(() => {
    window.__uhr.folge = true
    window.__uhr.set('2026-08-23T23:59:00.000Z', 0)
  })
  await page.evaluate(() => window.dispatchEvent(new Event('focus')))
  await page.waitForFunction(() => document.querySelector('[data-account-heute]')?.getAttribute('data-account-heute') === '2026-08-24')
  await page.waitForFunction(() => document.querySelector('[data-account-naechste]')?.getAttribute('data-account-naechste') === 'fortsetzen')
  protokoll.push('Lokale Mitternacht nach dem Geräte-Timeout beendet aktiv.')

  await page.evaluate(() => {
    window.__uhr.folge = false
  })
  await page.evaluate(() => window.__uhr.set('2026-08-24T00:30:00.000Z', 120))
  await page.evaluate(() => window.dispatchEvent(new Event('focus')))
  await page.waitForFunction(() => document.querySelector('[data-account-naechste]')?.getAttribute('data-account-naechste') === 'aktiv')
  protokoll.push('Positiver Offset bleibt am Vortag und damit aktiv.')

  await page.evaluate(() => window.__uhr.set('2026-08-23T22:30:00.000Z', -180))
  await page.evaluate(() => window.dispatchEvent(new Event('focus')))
  await page.waitForFunction(() => document.querySelector('[data-account-naechste]')?.getAttribute('data-account-naechste') === 'fortsetzen')
  protokoll.push('Negativer Offset ist schon am nächsten Kalendertag.')

  await page.evaluate(() => window.__uhr.set('2026-08-27T09:00:00.000Z', -60))
  await page.evaluate(() => window.dispatchEvent(new Event('focus')))
  await page.waitForFunction(() => document.querySelector('[data-account-naechste]')?.getAttribute('data-account-naechste') === 'fortsetzen')
  assert.equal(netz.some((url) => url.includes('/api/')), false)
  protokoll.push('Fokus nach mehrtägiger Pause und Offsetwechsel liest nur die lokale Uhr.')

  const vorher = seitenfehler.length
  await page.evaluate(() => window.__unmount())
  await page.waitForTimeout(50)
  assert.equal(seitenfehler.length, vorher)
  protokoll.push('Unmount räumt den Kalender-Timer ohne weiteren Seitenfehler ab.')

  await zeige(faelle.grenze, css)
  await page.waitForFunction(() => document.querySelector('[data-account-heute]')?.getAttribute('data-account-heute') === '2026-08-23')
  assert.equal(await page.locator('[data-account-fenster="grenze"]').count(), 1)
  const grenzeText = sichtbar(await page.locator('[data-account-uebersicht]').innerText())
  assert.match(grenzeText, /nicht geprüft/)
  assert.equal(grenzeText.includes('deine nächste reise.'), false)
  assert.match(grenzeText, /nächste reise in den geladenen reisen/)
  const sammlung = page.getByRole('link', { name: 'Zur vollständigen Reiseauswahl' })
  assert.equal(await sammlung.getAttribute('href'), '/reisen')
  protokoll.push('200 Zeilen behaupten weder Vollständigkeit noch bewiesenes Abschneiden und verlinken die Sammlung.')

  await zeige(faelle.knapp, css)
  await page.waitForFunction(() => document.querySelector('[data-account-heute]')?.getAttribute('data-account-heute') === '2026-08-23')
  assert.equal(await page.locator('[data-account-fenster="vollstaendig"]').count(), 1)
  const knappText = sichtbar(await page.locator('[data-account-uebersicht]').innerText())
  assert.match(knappText, /deine nächste reise\./)
  assert.equal(knappText.includes('nicht geprüft'), false)
  assert.match(await page.locator('[data-account-fenster="vollstaendig"]').innerText(), /die ganze Antwort dieser Abfrage/)
  protokoll.push('199 Zeilen sind die ganze Leserantwort und behalten den globalen Nächste-Reise-Satz.')

  await zeige(faelle.ohneEtappen, css)
  await page.waitForFunction(() => document.querySelector('[data-account-heute]')?.getAttribute('data-account-heute') === '2026-08-23')
  const kartenText = await page.locator('#account-welt-karte-desc').textContent()
  const kartenSichtbar = await page.locator('[data-world-map]').innerText()
  assert.equal(kartenText.includes('Noch keine geplanten Reiseziele in deinem Konto'), false)
  assert.equal(kartenSichtbar.includes('Noch keine geplanten Reiseziele in deinem Konto'), false)
  assert.match(kartenText, /Keine geplanten Orte in den geladenen Reisen/)
  assert.match(kartenSichtbar, /Keine geplanten Orte in den geladenen Reisen/)
  assert.match(kartenSichtbar, /Noch keine Besuche bestätigt/)
  protokoll.push('200 Reisen ohne Etappen behaupten zu Hause keine globale Ortsleere. Besuche bleiben leer.')

  await zeige({ ...faelle.ohneEtappen, modus: 'welt' }, css)
  const atlasLeer = await page.locator('[data-world-map]').innerText()
  assert.equal(atlasLeer.includes('Noch keine Länder oder Orte in deinem Konto gespeichert'), false)
  assert.equal(atlasLeer.includes('Noch keine geplanten Reiseziele in deinem Konto'), false)
  assert.match(atlasLeer, /In den geladenen Reisen sind keine Länder oder Orte/)
  assert.match(atlasLeer, /Keine geplanten Orte in den geladenen Reisen/)
  assert.match(atlasLeer, /Noch keine Besuche bestätigt/)
  protokoll.push('Der Welt-Atlas bindet die leere Ortsliste an die geladenen Reisen.')

  await zeige({ ...faelle.grenze, modus: 'welt' }, css)
  await page.waitForSelector('[data-world-map-darstellung="atlas"]')
  const weltText = await page.locator('[data-world-map]').innerText()
  assert.equal(sichtbar(weltText).includes('gesamt in deinem konto'), false)
  assert.match(weltText, /Geplante Orte nur aus den 200 zuletzt geänderten Reisen/)
  assert.match(weltText, /nicht geprüft/)
  assert.equal(await page.getByRole('link', { name: 'Zur vollständigen Reiseauswahl' }).getAttribute('href'), '/reisen')
  const weltSchmal = await page.evaluate(() => {
    document.documentElement.style.fontSize = '32px'
    return document.documentElement.scrollWidth <= document.documentElement.clientWidth + 1
  })
  await page.setViewportSize({ width: 320, height: 700 })
  const welt320 = await page.evaluate(() => document.documentElement.scrollWidth <= document.documentElement.clientWidth + 1)
  assert.equal(welt320, true)
  await page.screenshot({ path: join(ausgabe, 'welt-320.png'), fullPage: false })
  protokoll.push(`Welt-Atlas an 200 Zeilen nennt die geladene Reichweite. 320px enthalten: ${welt320}. 200%-Text vor dem Schmaltest enthalten: ${weltSchmal}.`)

  await zeige({ ...faelle.reiseFehler, modus: 'welt' }, css)
  await page.waitForSelector('[data-account-fenster="fehler"]')
  assert.match(await page.locator('[data-world-map]').innerText(), /konnten nicht geladen werden/)
  assert.equal(sichtbar(await page.locator('[data-world-map]').innerText()).includes('gesamt in deinem konto'), false)
  const weltNeu = page.locator('[data-account-neu-laden="/account/welt"] a')
  assert.equal(await weltNeu.count() >= 1, true)
  assert.match(await weltNeu.first().locator('xpath=..').innerText(), /bestätigt keine neuen Daten/)
  protokoll.push('Welt-Reisefehler bleibt Fehler und bietet das Neuladen von /account/welt an.')

  await zeige(faelle.archiv, css)
  const archivText = sichtbar(await page.locator('[data-account-naechste="leer"]').innerText())
  assert.match(archivText, /nicht geprüft/)
  assert.equal(archivText.includes('keine offene reise zum fortsetzen.'), false)
  protokoll.push('Nur Archiv an der Obergrenze ist keine globale leere offene Reise.')

  await zeige(faelle.leer, css)
  assert.match(sichtbar(await page.locator('[data-account-naechste="leer"]').innerText()), /noch keine reise in deinem konto/)
  assert.match(await page.locator('[data-account-fenster="vollstaendig"]').innerText(), /nicht abgeschnitten/)
  assert.match(await page.locator('#account-welt-karte-desc').textContent(), /Noch keine geplanten Reiseziele in deinem Konto/)
  protokoll.push('Null Reisen bleiben eine vollständige leere Antwort.')

  await zeige({ ...faelle.leer, modus: 'welt' }, css)
  const weltLeer = await page.locator('[data-world-map]').innerText()
  assert.match(weltLeer, /Noch keine Länder oder Orte in deinem Konto gespeichert/)
  assert.match(weltLeer, /Noch keine Besuche bestätigt/)
  protokoll.push('Eine vollständig leere Welt darf die Abwesenheit im Konto sagen.')

  await zeige(faelle.reiseFehler, css)
  assert.equal(await page.locator('[data-account-naechste="fehler"]').count(), 1)
  assert.equal(await page.locator('[data-account-naechste="leer"]').count(), 0)
  const neu = page.locator('[data-account-neu-laden="/account"] a')
  assert.equal(await neu.count(), 1)
  assert.match(await neu.locator('xpath=..').innerText(), /bestätigt keine neuen Daten/)
  assert.equal((await page.locator('#account-welt-karte-desc').textContent()).includes('Noch keine geplanten Reiseziele in deinem Konto'), false)
  assert.match(await page.locator('[data-world-map]').innerText(), /nicht geladen werden konnten/)
  protokoll.push('Reisefehler bleibt Fehler und lädt die Seite neu, ohne den Wechsel als Bestätigung zu verkaufen.')

  await zeige(faelle.besuchFehler, css)
  await page.waitForFunction(() => document.querySelector('[data-account-naechste]')?.getAttribute('data-account-naechste') === 'kommend')
  assert.equal(await page.locator('[data-account-naechste="kommend"]').count(), 1)
  assert.equal(await page.locator('[data-world-map-visited="fehler"]').count(), 1)
  assert.match(await page.locator('[data-world-map]').innerText(), /nicht, dass keiner besteht/)
  assert.equal((await page.locator('[data-world-map]').innerText()).includes('Noch keine Besuche bestätigt'), false)
  protokoll.push('Besuchsfehler lässt die geladene Reise stehen und erfindet keine leere Historie.')

  const breiten = [
    { name: '320', width: 320, height: 700 },
    { name: '390', width: 390, height: 800 },
    { name: '768', width: 768, height: 900 },
    { name: '1440', width: 1440, height: 900 },
  ]
  await zeige(faelle.grenze, css)
  assert.equal((await page.locator('[data-account-naechste] h2').innerText()).replace(/\s+/g, ' ').trim().length, 215)
  for (const breite of breiten) {
    await page.setViewportSize({ width: breite.width, height: breite.height })
    const ueber = await page.evaluate(() => document.documentElement.scrollWidth <= document.documentElement.clientWidth + 1)
    assert.equal(ueber, true, breite.name)
    await aktionenEnthalten(page, `Stress 215 ${breite.name}`)
    await page.screenshot({ path: join(ausgabe, `home-${breite.name}.png`), fullPage: true })
  }
  await page.evaluate(() => {
    document.documentElement.style.fontSize = '32px'
  })
  const gross = await page.evaluate(() => document.documentElement.scrollWidth <= document.documentElement.clientWidth + 1)
  assert.equal(gross, true)
  await aktionenEnthalten(page, 'Stress 215 1440 32px')
  await page.screenshot({ path: join(ausgabe, 'home-1440-200-prozent.png'), fullPage: true })
  protokoll.push('Stress-Titel mit 215 Zeichen, ausserhalb des 120-Zeichen-Vertrags: 320, 390, 768, 1440 und 32px-Wurzel bleiben ohne horizontales Überlaufen, und die Aktionsbeschriftungen bleiben in ihren Flächen.')

  await zeige({ ...faelle.grenze, reisen: fensterReisen(200, undefined, titelGueltig) }, css)
  await page.setViewportSize({ width: 1440, height: 900 })
  await page.evaluate(() => {
    document.documentElement.style.fontSize = ''
  })
  assert.equal((await page.locator('[data-account-naechste] h2').innerText()).replace(/\s+/g, ' ').trim(), titelGueltig)
  await aktionenEnthalten(page, 'Titel 116 1440 16px')
  await page.screenshot({ path: join(ausgabe, 'home-1440-titel-116.png'), fullPage: true })
  await page.evaluate(() => {
    document.documentElement.style.fontSize = '32px'
  })
  await aktionenEnthalten(page, 'Titel 116 1440 32px')
  await page.screenshot({ path: join(ausgabe, 'home-1440-titel-116-200-prozent.png'), fullPage: true })
  await page.evaluate(() => {
    document.documentElement.style.fontSize = ''
  })
  const fortsetzen = page.getByRole('link', { name: 'Reise fortsetzen' })
  assert.equal(await fortsetzen.getAttribute('href'), '/reisen/r0')
  await fortsetzen.focus()
  const netzVorEnter = netz.length
  await page.keyboard.press('Enter')
  await page.waitForTimeout(200)
  const ziele = netz.slice(netzVorEnter).filter((url) => url.includes('/reisen/r0'))
  assert.equal(ziele.length, 1)
  protokoll.push('Gültiger Titel mit 116 Zeichen bei 1440 und 16px sowie 32px: Beschriftungen liegen in den Aktionsflächen, die Flächen liegen in der Karte und überlappen sich nicht. Enter öffnet /reisen/r0 genau einmal.')

  await zeige(faelle.grenze, css)
  await page.evaluate(() => {
    document.documentElement.style.fontSize = ''
    if (document.activeElement instanceof HTMLElement) document.activeElement.blur()
  })
  await page.setViewportSize({ width: 1440, height: 900 })
  await page.setViewportSize({ width: 390, height: 800 })
  await page.keyboard.press('Tab')
  const taste = await page.evaluate(() => {
    const el = document.activeElement
    const kasten = el?.getBoundingClientRect()
    return {
      tag: el?.tagName ?? '',
      name: (el?.textContent ?? '').replace(/\s+/g, ' ').trim().slice(0, 80),
      sichtbar: Boolean(kasten && kasten.width > 0 && kasten.height > 0),
    }
  })
  assert.equal(taste.tag === 'A' || taste.tag === 'BUTTON', true)
  assert.equal(taste.sichtbar, true)
  protokoll.push(`Tab setzt den Fokus auf ${taste.tag}: ${taste.name}.`)

  await zeige(faelle.export, css)
  let anfragen = 0
  let downloads = 0
  let widerrufen = 0
  await page.exposeFunction('__exportZaehlen', (art) => {
    if (art === 'anfrage') anfragen += 1
    if (art === 'download') downloads += 1
    if (art === 'widerrufen') widerrufen += 1
  })
  await page.evaluate(() => {
    const original = URL.createObjectURL
    const revoke = URL.revokeObjectURL
    URL.createObjectURL = (blob) => {
      window.__exportZaehlen('download')
      return original.call(URL, blob)
    }
    URL.revokeObjectURL = (url) => {
      window.__exportZaehlen('widerrufen')
      return revoke.call(URL, url)
    }
  })

  async function exportAntwort(handler) {
    exportHandler = async (route) => {
      anfragen += 1
      await handler(route)
    }
  }

  const gueltig = {
    schemaVersion: 'jetnity.account-export.v1',
    generatedAt: '2026-10-26T10:00:00.000Z',
    scope: {
      owner: 'authenticated-session',
      completeness: 'jetnity-owned-account-travel-rows',
      tables: [
        'profiles',
        'account_travellers',
        'account_traveller_citizenships',
        'account_traveller_documents',
        'account_visits',
        'trips',
        'trip_stages',
        'trip_days',
        'trip_items',
        'trip_travellers',
        'trip_traveller_citizenships',
        'trip_traveller_documents',
        'trip_readiness_items',
      ],
    },
    data: {},
  }
  for (const tabelle of gueltig.scope.tables) gueltig.data[tabelle] = [{ id: `${tabelle}-1` }]
  let dateiEreignisse = 0
  page.on('download', () => {
    dateiEreignisse += 1
  })

  await exportAntwort((route) =>
    route.fulfill({
      status: 200,
      contentType: 'application/json',
      body: JSON.stringify(gueltig),
    }),
  )
  const knopf = page.getByRole('button', { name: 'Konto- und Reisedaten als JSON herunterladen' })
  await knopf.focus()
  assert.equal(await page.evaluate(() => document.activeElement?.getAttribute('aria-busy')), 'false')
  const dateiVersprechen = page.waitForEvent('download')
  await page.keyboard.press('Enter')
  const datei = await dateiVersprechen
  await page.waitForSelector('[data-export-phase="uebergeben"]')
  assert.equal(datei.suggestedFilename(), 'jetnity-account-export-2026-10-26.json')
  const inhalt = JSON.parse(readFileSync(await datei.path(), 'utf8'))
  assert.equal(inhalt.schemaVersion, 'jetnity.account-export.v1')
  assert.equal(inhalt.generatedAt, '2026-10-26T10:00:00.000Z')
  assert.deepEqual(Object.keys(inhalt.data), gueltig.scope.tables)
  for (const tabelle of gueltig.scope.tables) {
    assert.deepEqual(inhalt.data[tabelle], [{ id: `${tabelle}-1` }])
  }
  assert.match(await page.getByRole('status').innerText(), /Browser/)
  assert.match(await page.getByRole('status').innerText(), /Betriebssystem/)
  assert.equal(anfragen, 1)
  assert.equal(downloads, 1)
  assert.equal(dateiEreignisse, 1)
  await page.waitForTimeout(30)
  assert.equal(widerrufen, 1)
  protokoll.push('Enter übergibt genau eine gültige Datei, ein Downloadereignis und einen Widerruf.')

  await exportAntwort((route) => route.fulfill({ status: 401, contentType: 'application/json', body: '{"error":"unauthenticated"}' }))
  await knopf.click()
  await page.waitForSelector('[data-export-phase="fehler"]')
  assert.match(await page.getByRole('alert').innerText(), /Einstellungen/)
  assert.equal(downloads, 1)
  protokoll.push('401 bleibt in der Ansicht und lädt nichts.')

  await exportAntwort((route) => route.fulfill({ status: 503, contentType: 'application/json', body: '{"error":"export_failed"}' }))
  await knopf.click()
  await page.waitForSelector('[data-export-phase="fehler"]')
  assert.match(await page.getByRole('alert').innerText(), /nicht erreichbar/)
  protokoll.push('503 bleibt in der Ansicht.')

  await exportAntwort((route) => route.fulfill({ status: 500, contentType: 'application/json', body: '{"error":"export_failed"}' }))
  await knopf.click()
  await page.waitForSelector('[data-export-phase="fehler"]')
  assert.match(await page.getByRole('alert').innerText(), /konnte nicht gelesen werden/)
  assert.equal(downloads, 1)
  protokoll.push('500 bleibt in der Ansicht und lädt nichts.')

  await exportAntwort((route) => route.fulfill({ status: 200, contentType: 'text/plain', body: 'kein json' }))
  await knopf.click()
  await page.waitForSelector('[data-export-phase="fehler"]')
  assert.match(await page.getByRole('alert').innerText(), /keine gültige Exportdatei/)
  protokoll.push('Nicht-JSON wird nicht heruntergeladen.')

  await exportAntwort((route) => route.fulfill({ status: 200, contentType: 'application/json', body: '{"schemaVersion":"nope"}' }))
  await knopf.click()
  await page.waitForSelector('[data-export-phase="fehler"]')
  protokoll.push('Eine fehlerhafte JSON-Form wird nicht heruntergeladen.')

  async function ungueltig(name, koerper) {
    const vorherDateien = dateiEreignisse
    const vorherUrls = downloads
    await exportAntwort((route) =>
      route.fulfill({ status: 200, contentType: 'application/json', body: koerper }),
    )
    await knopf.click()
    await page.waitForSelector('[data-export-phase="fehler"]')
    assert.match(await page.getByRole('alert').innerText(), /keine gültige Exportdatei/)
    assert.equal(dateiEreignisse, vorherDateien)
    assert.equal(downloads, vorherUrls)
    protokoll.push(`${name} löst kein Downloadereignis aus.`)
  }
  const ohneZeit = structuredClone(gueltig)
  ohneZeit.generatedAt = 'not-a-date'
  await ungueltig('Ein unbrauchbarer Zeitstempel', JSON.stringify(ohneZeit))
  const nullZeile = structuredClone(gueltig)
  nullZeile.data.profiles = [null]
  await ungueltig('Eine Null-Zeile', JSON.stringify(nullZeile))
  const skalar = structuredClone(gueltig)
  skalar.data.profiles = ['skalar']
  await ungueltig('Eine Skalar-Zeile', JSON.stringify(skalar))
  const liste = structuredClone(gueltig)
  liste.data.profiles = [[]]
  await ungueltig('Eine Listen-Zeile', JSON.stringify(liste))
  const leereKennung = structuredClone(gueltig)
  leereKennung.data.profiles = [{ id: '  ' }]
  await ungueltig('Eine leere Kennung', JSON.stringify(leereKennung))
  const doppelt = structuredClone(gueltig)
  doppelt.data.trips = [{ id: 'gleiche' }, { id: 'gleiche' }]
  await ungueltig('Eine doppelte Kennung in einer Tabelle', JSON.stringify(doppelt))

  const arbeit = page.getByRole('textbox', { name: 'Andere Kontoarbeit' })
  let zeigerLos = () => {}
  await exportAntwort(async (route) => {
    await new Promise((resolve) => {
      zeigerLos = resolve
    })
    await route.fulfill({ status: 200, contentType: 'application/json', body: JSON.stringify(gueltig) })
  })
  const dateienVorZeiger = dateiEreignisse
  await knopf.click()
  await page.waitForSelector('[data-export-phase="laeuft"]')
  await arbeit.click()
  await arbeit.fill('Zeiger')
  const zeigerDatei = page.waitForEvent('download')
  zeigerLos()
  await zeigerDatei
  await page.waitForSelector('[data-export-phase="uebergeben"]')
  assert.equal(await page.evaluate(() => document.activeElement?.id), 'andere-kontoarbeit')
  assert.match(await page.getByRole('status').innerText(), /Browser/)
  assert.equal(dateiEreignisse, dateienVorZeiger + 1)
  await page.waitForTimeout(30)
  assert.equal(widerrufen, downloads)
  protokoll.push('Erfolg nach einem neueren Zeigerfokus lässt den Fokus dort und bleibt ansagbar.')

  let tastaturLos = () => {}
  await exportAntwort(async (route) => {
    await new Promise((resolve) => {
      tastaturLos = resolve
    })
    await route.fulfill({ status: 503, contentType: 'application/json', body: '{"error":"export_failed"}' })
  })
  const dateienVorTaste = dateiEreignisse
  await knopf.click()
  await page.waitForSelector('[data-export-phase="laeuft"]')
  await page.keyboard.press('Shift+Tab')
  await page.keyboard.type('Taste')
  tastaturLos()
  await page.waitForSelector('[data-export-phase="fehler"]')
  assert.equal(await page.evaluate(() => document.activeElement?.id), 'andere-kontoarbeit')
  assert.match(await page.getByRole('alert').innerText(), /nicht erreichbar/)
  assert.equal(dateiEreignisse, dateienVorTaste)
  protokoll.push('Fehler nach neuerem Tastaturfokus zieht den Fokus nicht weg.')

  await exportAntwort(() => new Promise(() => {}))
  await page.evaluate(() => {
    window.__uhr.folge = true
  })
  const dateienVorFrist = dateiEreignisse
  await knopf.click()
  await page.keyboard.press('Shift+Tab')
  await page.keyboard.type('Frist')
  await page.getByRole('alert').filter({ hasText: 'zu lange gedauert' }).waitFor()
  assert.equal(await page.evaluate(() => document.activeElement?.id), 'andere-kontoarbeit')
  assert.equal(dateiEreignisse, dateienVorFrist)
  protokoll.push('Eine Frist nach neuerem Tastaturfokus bleibt ansagbar, ohne den Fokus zu nehmen.')

  let freigeben = () => {}
  const wartend = new Promise((resolve) => {
    freigeben = resolve
  })
  await exportAntwort(async (route) => {
    await wartend
    await route.fulfill({ status: 200, contentType: 'application/json', body: JSON.stringify(gueltig) })
  })
  const vorDoppel = anfragen
  const urlsVorDoppel = downloads
  const dateienVorDoppel = dateiEreignisse
  await knopf.click()
  await knopf.click({ force: true })
  await page.waitForTimeout(30)
  assert.equal(anfragen, vorDoppel + 1)
  await page.keyboard.press('Tab')
  await page.keyboard.press('Enter')
  await page.waitForSelector('[data-export-phase="abgebrochen"]')
  assert.equal(await page.evaluate(() => document.activeElement?.getAttribute('role')), 'alert')
  freigeben()
  await page.waitForTimeout(50)
  assert.equal(downloads, urlsVorDoppel)
  assert.equal(dateiEreignisse, dateienVorDoppel)
  assert.match(await page.getByRole('alert').innerText(), /wurde abgebrochen/)
  protokoll.push('Doppelklick startet eine Anfrage. Tastatur-Abbruch fokussiert die Meldung und verwirft die spätere Datei.')

  let alteFreigabe = () => {}
  const alteWarte = new Promise((resolve) => {
    alteFreigabe = resolve
  })
  let neueFreigabe = () => {}
  const neueWarte = new Promise((resolve) => {
    neueFreigabe = resolve
  })
  let naechsteAntwort = 'alt'
  await exportAntwort(async (route) => {
    const diese = naechsteAntwort
    naechsteAntwort = 'neu'
    if (diese === 'alt') {
      await alteWarte
      await route.fulfill({ status: 200, contentType: 'application/json', body: JSON.stringify(gueltig) })
      return
    }
    await neueWarte
    await route.fulfill({ status: 503, contentType: 'application/json', body: '{"error":"export_failed"}' })
  })
  await knopf.click()
  await page.waitForSelector('[data-export-phase="laeuft"]')
  await page.getByRole('button', { name: 'Export abbrechen' }).click()
  await page.waitForSelector('[data-export-phase="abgebrochen"]')
  await knopf.click()
  await page.waitForSelector('[data-export-phase="laeuft"]')
  const anfragenNachNeu = anfragen
  const dateienVorAlt = dateiEreignisse
  alteFreigabe()
  await page.waitForTimeout(80)
  assert.equal(await page.locator('[data-export-phase="laeuft"]').count(), 1)
  assert.equal(anfragen, anfragenNachNeu)
  assert.equal(dateiEreignisse, dateienVorAlt)
  neueFreigabe()
  await page.waitForSelector('[data-export-phase="fehler"]')
  assert.match(await page.getByRole('alert').innerText(), /nicht erreichbar/)
  assert.equal(dateiEreignisse, dateienVorAlt)
  protokoll.push('Eine abgebrochene Alt-Antwort lädt nicht und setzt die neuere Anfrage nicht.')

  const anfragenVorRetry = anfragen
  const dateienVorRetry = dateiEreignisse
  const urlsVorRetry = downloads
  await exportAntwort((route) =>
    route.fulfill({
      status: 200,
      contentType: 'application/json',
      body: JSON.stringify(gueltig),
    }),
  )
  const retryDatei = page.waitForEvent('download')
  await knopf.click()
  await retryDatei
  await page.waitForSelector('[data-export-phase="uebergeben"]')
  assert.equal(anfragen, anfragenVorRetry + 1)
  assert.equal(downloads, urlsVorRetry + 1)
  assert.equal(dateiEreignisse, dateienVorRetry + 1)
  protokoll.push('Ein ausdrücklicher neuer Versuch nach dem Abbruch übergibt genau eine weitere Datei.')

  await exportAntwort(() => new Promise(() => {}))
  await page.evaluate(() => {
    window.__uhr.folge = true
  })
  const dateienVorZweiterFrist = dateiEreignisse
  const urlsVorZweiterFrist = downloads
  await knopf.click()
  await page.getByRole('alert').filter({ hasText: 'zu lange gedauert' }).waitFor()
  assert.equal(await page.locator('[data-export-phase="abgebrochen"]').count(), 1)
  assert.equal(dateiEreignisse, dateienVorZweiterFrist)
  assert.equal(downloads, urlsVorZweiterFrist)
  protokoll.push('Eine überschrittene Frist bricht ab, ohne automatisch neu zu starten.')

  let nachUnmount = () => {}
  await exportAntwort(async (route) => {
    await new Promise((resolve) => {
      nachUnmount = resolve
    })
    await route.fulfill({ status: 200, contentType: 'application/json', body: JSON.stringify(gueltig) })
  })
  const vorUnmount = dateiEreignisse
  await knopf.click()
  await page.waitForSelector('[data-export-phase="laeuft"]')
  await page.evaluate(() => window.__unmount())
  nachUnmount()
  await page.waitForTimeout(80)
  assert.equal(dateiEreignisse, vorUnmount)
  protokoll.push('Eine späte Antwort nach dem Unmount erzeugt keinen Download.')
  assert.equal(seitenfehler.length, 0)
  protokoll.push(`Seitenfehler: 0. Exportanfragen: ${anfragen}. Downloads: ${downloads}. Objekt-URL-Widerrufe: ${widerrufen}.`)
  const fremd = netz.filter(
    (url) => /^https?:/i.test(url) && !url.includes('/api/account/export') && !url.includes('127.0.0.1:8765/konto'),
  )
  assert.deepEqual(fremd, ['http://127.0.0.1:8765/reisen/r0'])
} finally {
  writeFileSync(join(ausgabe, 'mounted-proof.json'), JSON.stringify({ protokoll, seitenfehler, netz: netz.slice(0, 20) }, null, 2))
  console.log(protokoll.join('\n'))
  await browser.close()
}
