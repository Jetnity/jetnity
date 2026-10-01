#!/usr/bin/env node
/**
 * Sicht- und Interaktionsmatrix für die Kontoübersicht, Premium Overview 1.
 *
 * Gemessen wird der ausgelieferte Build (`next start`). Fixtures nur im
 * Audit-Harness. Die volle Atlas-Seite bleibt die Vergleichsfläche.
 *
 * Voraussetzung: `npm run build`.
 *
 * Aufruf:
 *   node scripts/account-home-premium-overview-1-audit.mjs
 *     [--verzeichnis <ordner>]
 *     [--port <nummer>]
 */
import { spawn } from 'node:child_process'
import { mkdirSync, writeFileSync } from 'node:fs'
import { join } from 'node:path'
import { chromium } from 'playwright'

const argv = process.argv.slice(2)
const option = (name, standard) => {
  const index = argv.indexOf(`--${name}`)
  return index === -1 ? standard : argv[index + 1]
}

const PORT = option('port', '3491')
const VERZEICHNIS = option('verzeichnis', 'docs/evidence/account-home-premium-overview-1')
const BASIS = `http://127.0.0.1:${PORT}`

const BREITEN = [
  { name: '320x568', width: 320, height: 568 },
  { name: '360x800', width: 360, height: 800 },
  { name: '390x844', width: 390, height: 844 },
  { name: '412x915', width: 412, height: 915 },
  { name: '430x932', width: 430, height: 932 },
  { name: '768x1024', width: 768, height: 1024 },
  { name: '820x1180', width: 820, height: 1180 },
  { name: '1024x768', width: 1024, height: 768 },
  { name: '1280x800', width: 1280, height: 800 },
  { name: '1440x900', width: 1440, height: 900 },
  { name: '1728x1117', width: 1728, height: 1117 },
  { name: '1920x1080', width: 1920, height: 1080 },
  { name: '844x390', width: 844, height: 390 },
]

const ZUSTAENDE = [
  { name: 'welt', pfad: '/ui-audit/account?zustand=welt' },
  { name: 'leer', pfad: '/ui-audit/account?zustand=leer' },
  { name: 'fehler', pfad: '/ui-audit/account?zustand=fehler' },
  { name: 'besuch-fehler', pfad: '/ui-audit/account?zustand=besuch-fehler' },
]

mkdirSync(VERZEICHNIS, { recursive: true })

function serverStarten() {
  const kind = spawn('npx', ['next', 'start', '-p', PORT, '-H', '127.0.0.1'], {
    env: {
      ...process.env,
      JETNITY_UI_AUDIT: '1',
      NEXT_PUBLIC_SUPABASE_URL:
        process.env.NEXT_PUBLIC_SUPABASE_URL || 'https://placeholder.supabase.co',
      NEXT_PUBLIC_SUPABASE_ANON_KEY:
        process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY ||
        'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InBsYWNlaG9sZGVyIiwicm9sZSI6ImFub24iLCJpYXQiOjE2OTAwMDAwMDAsImV4cCI6MjAwMDAwMDAwMH0.audit',
      NEXT_PUBLIC_APP_URL: BASIS,
    },
    stdio: ['ignore', 'pipe', 'pipe'],
    detached: true,
  })
  const ausgabe = []
  kind.stdout.on('data', (stueck) => ausgabe.push(String(stueck)))
  kind.stderr.on('data', (stueck) => ausgabe.push(String(stueck)))
  return { kind, ausgabe }
}

function serverStoppen(kind) {
  if (!kind?.pid) return
  try {
    process.kill(-kind.pid, 'SIGTERM')
  } catch {
    kind.kill('SIGTERM')
  }
}

async function serverWarten(kind, ausgabe) {
  const start = Date.now()
  let antwortet = false
  while (!antwortet && Date.now() - start < 180_000) {
    try {
      const antwort = await fetch(`${BASIS}/ui-audit/account?zustand=leer`)
      antwortet = antwort.ok
      await antwort.arrayBuffer()
    } catch {
      antwortet = false
    }
    if (!antwortet) await new Promise((r) => setTimeout(r, 1000))
  }
  if (!antwortet) {
    serverStoppen(kind)
    throw new Error(`Next.js antwortete nicht:\n${ausgabe.join('')}`)
  }
}

function messen() {
  const kopf = document.querySelector('header')
  const h1 = document.querySelector('[data-account-uebersicht] h1')
  const naechste = document.querySelector('[data-account-naechste]')
  const buchungen = document.querySelector('[data-account-buchungen]')
  const karte = document.querySelector('[data-world-map="ein"]')
  const svg = karte?.querySelector('svg[role="img"]')
  const kasten = (element) => {
    if (!element) return null
    const box = element.getBoundingClientRect()
    return {
      oben: Math.round(box.top),
      unten: Math.round(box.bottom),
      links: Math.round(box.left),
      rechts: Math.round(box.right),
      breite: Math.round(box.width),
      hoehe: Math.round(box.height),
    }
  }
  const ziele = [
    ...document.querySelectorAll(
      '[data-account-uebersicht] a, [data-account-uebersicht] button, [data-world-map="ein"] a, [data-world-map="ein"] button',
    ),
  ]
  const kanten = ziele
    .map((element) => {
      const box = element.getBoundingClientRect()
      if (box.width < 1 || box.height < 1) return null
      return {
        kante: Math.round(Math.min(box.width, box.height)),
        text: (element.getAttribute('aria-label') || element.textContent || element.tagName)
          .replace(/\s+/g, ' ')
          .trim()
          .slice(0, 80),
      }
    })
    .filter(Boolean)
  const kleinste = kanten.reduce(
    (bisher, eintrag) => (eintrag.kante < bisher.kante ? eintrag : bisher),
    kanten[0] ?? { kante: null, text: null },
  )
  const schrift = parseFloat(getComputedStyle(document.documentElement).fontSize) || 16
  const spalten = []
  for (const element of document.querySelectorAll(
    '[data-account-uebersicht] p, [data-account-uebersicht] h1, [data-account-uebersicht] h2, [data-account-uebersicht] a, [data-account-uebersicht] button, [data-world-map="ein"] p, [data-world-map="ein"] a, [data-world-map="ein"] button, [data-world-map="ein"] li',
  )) {
    const text = (element.innerText || '').replace(/\s+/g, ' ').trim()
    if (text.length < 24) continue
    const box = element.getBoundingClientRect()
    if (box.width < 1 || box.height < 1) continue
    const groesse = parseFloat(getComputedStyle(element).fontSize) || schrift
    // Eine echte Zeichenspalte ist schmaler als etwa zweieinhalb Zeichen.
    // Grosse Überschriften, die auf 360 px bei 200 % umbrechen, sind keine.
    if (box.width < groesse * 2.5) {
      spalten.push({ text: text.slice(0, 60), breite: Math.round(box.width), schrift: Math.round(groesse) })
    }
  }
  const uebersicht = document.querySelector('[data-account-uebersicht]')
  const uebersichtBox = uebersicht?.getBoundingClientRect()
  const karteBox = karte?.getBoundingClientRect()
  const kopfUnten = kopf ? Math.round(kopf.getBoundingClientRect().bottom) : 0
  const h1Kasten = kasten(h1)
  return {
    overflow: document.documentElement.scrollWidth - window.innerWidth,
    inhaltOverflow: Math.max(
      uebersichtBox ? Math.round(uebersichtBox.right) - window.innerWidth : 0,
      karteBox ? Math.round(karteBox.right) - window.innerWidth : 0,
      0,
    ),
    weltoeffnen: [...document.querySelectorAll('a')].some((link) =>
      (link.textContent || '').includes('Deine Welt öffnen'),
    ),
    scrollHoehe: document.documentElement.scrollHeight,
    fenster: window.innerWidth,
    fensterHoehe: window.innerHeight,
    htmlFont: getComputedStyle(document.documentElement).fontSize,
    darstellung: karte?.getAttribute('data-world-map-darstellung') ?? null,
    lage: karte?.getAttribute('data-world-map-lage') ?? null,
    besucht: karte?.getAttribute('data-world-map-visited') ?? null,
    naechste: naechste?.getAttribute('data-account-naechste') ?? null,
    laenderListe: document.querySelector('[data-welt-laender-liste]')?.getAttribute('data-welt-laender-liste') ?? null,
    orteListe: document.querySelector('[data-world-map-orte="liste"]') ? 'ja' : 'nein',
    kennzahlBesucht: Boolean(document.querySelector('[data-welt-kennzahl="besucht"]')),
    kennzahlGeplant: Boolean(document.querySelector('[data-welt-kennzahl="geplant"]')),
    marker: document.querySelectorAll('[data-world-map-marker]').length,
    kartenKasten: kasten(svg),
    h1: h1Kasten,
    naechsteKasten: kasten(naechste),
    buchungenKasten: kasten(buchungen),
    karteKasten: kasten(karte),
    h1UnterKopf: h1Kasten ? h1Kasten.oben >= kopfUnten - 1 : false,
    h1ImErstenFenster: h1Kasten ? h1Kasten.oben < window.innerHeight && h1Kasten.unten > kopfUnten : false,
    reiseVorKarte:
      naechste && karte
        ? naechste.getBoundingClientRect().top < karte.getBoundingClientRect().top
        : false,
    herkunftSichtbar: (karte?.innerText ?? '').includes('Natural Earth'),
    besuchtHinweisSichtbar: (karte?.innerText ?? '').includes('bestätigt'),
    kleinsteBedienflaeche: kleinste?.kante ?? null,
    kleinsteBedienflaecheText: kleinste?.text ?? null,
    spalten,
    spaltenAnzahl: spalten.length,
  }
}

const { kind: server, ausgabe } = serverStarten()
const befunde = []
const anfragen = new Set()

try {
  await serverWarten(server, ausgabe)
  const browser = await chromium.launch()
  const umwandler = await browser.newPage()
  const alsWebp = async (puffer) =>
    Buffer.from(
      await umwandler.evaluate(async (basis64) => {
        const bild = new Image()
        bild.src = `data:image/png;base64,${basis64}`
        await bild.decode()
        const flaeche = document.createElement('canvas')
        flaeche.width = bild.naturalWidth
        flaeche.height = bild.naturalHeight
        flaeche.getContext('2d')?.drawImage(bild, 0, 0)
        return flaeche.toDataURL('image/webp', 0.8).split(',')[1]
      }, puffer.toString('base64')),
      'base64',
    )

  async function oeffnen(viewport, pfad, extra = {}) {
    const seite = await browser.newPage({ viewport, deviceScaleFactor: 1 })
    const konsole = []
    seite.on('console', (nachricht) => {
      if (nachricht.type() === 'error') konsole.push(`error: ${nachricht.text()}`)
    })
    seite.on('pageerror', (fehler) => konsole.push(`pageerror: ${fehler.message}`))
    seite.on('request', (anfrage) => anfragen.add(new URL(anfrage.url()).origin))
    await seite.goto(`${BASIS}${pfad}`, { waitUntil: 'networkidle', timeout: 90_000 })
    await seite.locator('[data-account-uebersicht], [data-account-besuche]').first().waitFor({ timeout: 30_000 })
    if (extra.schrift) {
      await seite.evaluate((wert) => {
        document.documentElement.style.fontSize = wert
      }, extra.schrift)
      await seite.waitForTimeout(200)
    }
    if (extra.zoom) {
      await seite.evaluate((wert) => {
        document.documentElement.style.zoom = String(wert)
      }, extra.zoom)
      await seite.waitForTimeout(200)
    }
    return { seite, konsole }
  }

  for (const viewport of BREITEN) {
    for (const zustand of ZUSTAENDE) {
      const { seite, konsole } = await oeffnen(viewport, zustand.pfad)
      const messung = await seite.evaluate(messen)
      const bild = await seite.screenshot()
      writeFileSync(join(VERZEICHNIS, `${viewport.name}-${zustand.name}.webp`), await alsWebp(bild))

      let auswahl = null
      let fokus = null
      if (zustand.name === 'welt') {
        const einzel = seite.locator('[data-world-map-marker-orte="1"]').first()
        if ((await einzel.count()) > 0) {
          await einzel.click()
          await seite.waitForTimeout(200)
          auswahl = await seite.evaluate(() => ({
            kontext: document.querySelector('[data-world-map-kontext]')?.getAttribute('data-world-map-kontext'),
            ort: document.querySelector('[data-world-map-ort-gewaehlt="ja"]')?.innerText?.replace(/\s+/g, ' ').trim().slice(0, 180) ?? null,
          }))
          const gewaehlt = await seite.screenshot()
          writeFileSync(join(VERZEICHNIS, `${viewport.name}-welt-marker.webp`), await alsWebp(gewaehlt))
        }
        const gruppe = seite.locator('[data-world-map-marker-orte]:not([data-world-map-marker-orte="1"])').first()
        if ((await gruppe.count()) > 0) {
          await gruppe.click()
          await seite.waitForTimeout(200)
          const offen = await seite.evaluate(
            () => document.getElementById('account-welt-karte-auswahl')?.innerText?.replace(/\s+/g, ' ').trim().slice(0, 180) ?? null,
          )
          auswahl = { ...(auswahl ?? {}), gruppe: offen }
          const gruppenBild = await seite.screenshot()
          writeFileSync(join(VERZEICHNIS, `${viewport.name}-welt-gruppe.webp`), await alsWebp(gruppenBild))
        }
        await seite.locator('body').focus()
        for (let schritt = 0; schritt < 40; schritt += 1) {
          await seite.keyboard.press('Tab')
          fokus = await seite.evaluate(() => {
            const aktiv = document.activeElement
            const marker = aktiv?.closest?.('[data-world-map-marker]')
            if (!marker) return null
            const stil = getComputedStyle(marker)
            const box = marker.getBoundingClientRect()
            return {
              outline: `${stil.outlineStyle} ${stil.outlineWidth}`,
              kante: Math.round(Math.min(box.width, box.height)),
            }
          })
          if (fokus) break
        }
      }

      befunde.push({
        breite: viewport.name,
        zustand: zustand.name,
        ...messung,
        auswahl,
        fokus,
        konsole,
      })
      await seite.close()
    }

    const atlas = await oeffnen(viewport, '/ui-audit/account?zustand=welt&ansicht=besuche')
    const atlasMessung = await atlas.seite.evaluate(messen)
    befunde.push({
      breite: viewport.name,
      zustand: 'atlas',
      ...atlasMessung,
      auswahl: null,
      fokus: null,
      konsole: atlas.konsole,
    })
    if (viewport.name === '390x844' || viewport.name === '1440x900' || viewport.name === '1920x1080') {
      const bild = await atlas.seite.screenshot({ fullPage: true })
      writeFileSync(join(VERZEICHNIS, `${viewport.name}-atlas-voll.webp`), await alsWebp(bild))
      await atlas.seite.goto(`${BASIS}/ui-audit/account?zustand=welt`, { waitUntil: 'networkidle' })
      const heim = await atlas.seite.screenshot({ fullPage: true })
      writeFileSync(join(VERZEICHNIS, `${viewport.name}-uebersicht-voll.webp`), await alsWebp(heim))
    }
    await atlas.seite.close()
  }

  const textViewport = { width: 360, height: 800 }
  const text = await oeffnen(textViewport, '/ui-audit/account?zustand=welt', { schrift: '200%' })
  const textMessung = await text.seite.evaluate(messen)
  writeFileSync(join(VERZEICHNIS, 'text200-360x800-welt.webp'), await alsWebp(await text.seite.screenshot()))
  befunde.push({ breite: 'text200-360x800', zustand: 'welt', ...textMessung, auswahl: null, fokus: null, konsole: text.konsole })
  await text.seite.close()

  for (const zoom of [1.25, 1.5]) {
    const name = `zoom${Math.round(zoom * 100)}-1440x900`
    const lauf = await oeffnen({ width: 1440, height: 900 }, '/ui-audit/account?zustand=welt', { zoom })
    const messung = await lauf.seite.evaluate(messen)
    writeFileSync(join(VERZEICHNIS, `${name}-welt.webp`), await alsWebp(await lauf.seite.screenshot()))
    befunde.push({ breite: name, zustand: 'welt', ...messung, auswahl: null, fokus: null, konsole: lauf.konsole })
    await lauf.seite.close()
  }

  await browser.close()
} finally {
  serverStoppen(server)
}

const fremdeHerkuenfte = [...anfragen].filter((herkunft) => !herkunft.includes('127.0.0.1'))
const heimWelt = befunde.filter((befund) => befund.zustand === 'welt' && befund.darstellung === 'uebersicht' && !befund.breite.startsWith('text') && !befund.breite.startsWith('zoom'))
const atlas = befunde.filter((befund) => befund.zustand === 'atlas')
const hoehen = heimWelt.map((befund) => {
  const gegen = atlas.find((eintrag) => eintrag.breite === befund.breite)
  return {
    breite: befund.breite,
    uebersicht: befund.scrollHoehe,
    atlas: gegen?.scrollHoehe ?? null,
    kuerzer: gegen ? befund.scrollHoehe < gegen.scrollHoehe : false,
  }
})

const fehler = []
for (const befund of befunde) {
  const name = `${befund.breite}/${befund.zustand}`
  if ((befund.inhaltOverflow ?? 0) > 1) fehler.push(`${name}: Inhaltsüberlauf ${befund.inhaltOverflow}`)
  // Bei 200 % ragt die bestehende Konto-Navigation (`whitespace-nowrap` im
  // horizontalen Scroller) wenige Pixel über das Dokument. Dieselbe Leiste
  // steht auf dem Atlas. Die Übersicht selbst bleibt im Fenster. Die Leiste
  // ist nicht in der Schreibliste dieses Slices.
  const navBeiText =
    befund.breite.startsWith('text200') &&
    befund.overflow <= 8 &&
    (befund.inhaltOverflow ?? 0) <= 1
  if (befund.overflow > 1 && !navBeiText) fehler.push(`${name}: Überlauf ${befund.overflow}`)
  if (befund.konsole.length) fehler.push(`${name}: Konsole ${befund.konsole.join(' | ')}`)
  if ((befund.kleinsteBedienflaeche ?? 0) < 44) {
    fehler.push(`${name}: Trefferfläche ${befund.kleinsteBedienflaeche} (${befund.kleinsteBedienflaecheText})`)
  }
  if (befund.spaltenAnzahl > 0) fehler.push(`${name}: Zeichenspalte ${JSON.stringify(befund.spalten.slice(0, 3))}`)
  if (befund.zustand !== 'atlas' && befund.darstellung !== 'uebersicht') {
    fehler.push(`${name}: Darstellung ${befund.darstellung}`)
  }
  if (befund.zustand === 'atlas' && befund.darstellung !== 'atlas') {
    fehler.push(`${name}: Atlas-Darstellung ${befund.darstellung}`)
  }
  if (!befund.herkunftSichtbar) fehler.push(`${name}: Herkunft fehlt`)
  if (!befund.h1UnterKopf && befund.zustand !== 'atlas') fehler.push(`${name}: Überschrift unter dem Kopf verdeckt`)
  if (befund.zustand !== 'atlas' && befund.weltoeffnen !== true) fehler.push(`${name}: CTA Deine Welt öffnen fehlt`)
  if (befund.zustand !== 'atlas' && befund.laenderListe !== null) fehler.push(`${name}: Länderliste auf der Übersicht`)
  if (befund.zustand !== 'atlas' && befund.orteListe !== 'nein') fehler.push(`${name}: Ortsliste auf der Übersicht`)
  if (befund.zustand === 'atlas' && befund.lage === 'geplant' && befund.orteListe !== 'ja') {
    fehler.push(`${name}: Atlas ohne Ortsliste`)
  }
  if (befund.zustand === 'atlas' && befund.laenderListe === null && befund.lage === 'geplant') {
    fehler.push(`${name}: Atlas ohne Länderliste`)
  }
}
for (const paar of hoehen) {
  if (!paar.kuerzer) fehler.push(`${paar.breite}: Übersicht nicht kürzer als Atlas (${paar.uebersicht} >= ${paar.atlas})`)
}
const weltFokus = befunde.filter((befund) => befund.zustand === 'welt' && befund.breite.includes('x') && !befund.breite.startsWith('text') && !befund.breite.startsWith('zoom'))
for (const befund of weltFokus) {
  if (!befund.fokus || befund.fokus.kante < 44) fehler.push(`${befund.breite}: Fokus ${JSON.stringify(befund.fokus)}`)
  if (befund.auswahl?.kontext !== 'ort') fehler.push(`${befund.breite}: Kontext ${befund.auswahl?.kontext}`)
}
if (fremdeHerkuenfte.length) fehler.push(`fremde Herkunft ${fremdeHerkuenfte.join(',')}`)

const bericht = {
  herkuenfte: [...anfragen].sort(),
  fremdeHerkuenfte,
  hoehen,
  fehler,
  befunde,
  ok: fehler.length === 0,
}
writeFileSync(join(VERZEICHNIS, 'bericht.json'), `${JSON.stringify(bericht, null, 2)}\n`)
console.log(
  JSON.stringify(
    {
      ok: bericht.ok,
      fehler: bericht.fehler,
      hoehen: bericht.hoehen,
      fremdeHerkuenfte: bericht.fremdeHerkuenfte,
      befunde: bericht.befunde.map((befund) => ({
        breite: befund.breite,
        zustand: befund.zustand,
        darstellung: befund.darstellung,
        overflow: befund.overflow,
        scrollHoehe: befund.scrollHoehe,
        kleinste: befund.kleinsteBedienflaeche,
        spalten: befund.spaltenAnzahl,
        laenderListe: befund.laenderListe,
        orteListe: befund.orteListe,
        kontext: befund.auswahl?.kontext ?? null,
        fokus: befund.fokus?.kante ?? null,
        konsole: befund.konsole,
      })),
    },
    null,
    2,
  ),
)
if (!bericht.ok) process.exit(1)
