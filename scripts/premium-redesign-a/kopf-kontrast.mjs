#!/usr/bin/env node
// scripts/premium-redesign-a/kopf-kontrast.mjs
//
// Misst den Kontrast aller Texte im Reisekopf auf den tatsächlich verwendeten Bildern.
//
// Verfahren: Für jedes freigegebene Reisebild wird das Bild in den echten Reisekopf
// eingesetzt. Dann werden alle Texte unsichtbar gemacht, der Kopf wird fotografiert, und
// für jede Textzeile wird der Kontrast der echten Textfarbe gegen jedes Pixel dahinter
// berechnet. Der Bericht nennt den schlechtesten Wert je Zeile (nicht den Durchschnitt).
//
// Grenze: 4,5 : 1 für ALLE Zeilen, auch grosse Schrift, ungerundet verglichen. Eine Zeile, für die kein
// Pixel gemessen werden konnte, oder ein Kopf ohne messbaren Text ist kein PASS.
//
//   node scripts/premium-redesign-a/kopf-kontrast.mjs --base http://127.0.0.1:3462 \
//     --fixtures /tmp/pra/fixtures --out /tmp/pra/shots/nachher --commit <sha>
//
// Kein Produktionszugriff, synthetische Reise, keine Anmeldung.

import { mkdirSync, readFileSync, readdirSync, writeFileSync } from 'node:fs'
import { join } from 'node:path'
import { chromium } from 'playwright'

function argument(name, standard) {
  const index = process.argv.indexOf(`--${name}`)
  return index >= 0 && process.argv[index + 1] ? process.argv[index + 1] : standard
}

const BASIS = argument('base', 'http://127.0.0.1:3462')
const FIXTURES = argument('fixtures', '/tmp/pra/fixtures')
const AUS = argument('out', '/tmp/pra/shots/nachher')
const COMMIT = argument('commit', 'unbekannt')
const KONTO = argument('konto', '')
const BILDORDNER = argument('bilder', 'public/images/organisieren')
const THEMA_SCHLUESSEL = 'jetnity:workspace-theme:v1'
const REISE = JSON.parse(readFileSync(join(FIXTURES, 'thailand.json'), 'utf8'))
const GRENZE = 4.5

const BILDER = readdirSync(BILDORDNER)
  .filter((datei) => /\.(webp|jpg|jpeg|png)$/i.test(datei))
  .sort()

const BREITEN = [
  { name: '320', width: 320, height: 640, telefon: true },
  { name: '390', width: 390, height: 844, telefon: true },
  { name: '1440', width: 1440, height: 900, telefon: false },
]

/** Läuft im Browser: schlechtester Kontrast je Textzeile des Reisekopfs für das aktuelle Bild. */
async function messenImBrowser() {
  const kopf = document.querySelector('.reisekopf')
  if (!kopf) return { fehler: 'kein Reisekopf' }
  kopf.scrollIntoView({ block: 'center', behavior: 'instant' })
  await new Promise((fertig) => requestAnimationFrame(() => requestAnimationFrame(fertig)))
  const kopfRahmen = kopf.getBoundingClientRect()
  const kanaele = (farbe) => {
    const treffer = farbe.match(/rgba?\(([^)]+)\)/)
    if (!treffer) return null
    const teile = treffer[1].split(/[ ,/]+/).filter(Boolean).map(Number)
    return { r: teile[0], g: teile[1], b: teile[2], a: teile[3] ?? 1 }
  }
  const elemente = []
  const walker = document.createTreeWalker(kopf, NodeFilter.SHOW_TEXT)
  while (walker.nextNode()) {
    const knoten = walker.currentNode
    if (!knoten.textContent || !knoten.textContent.trim()) continue
    const element = knoten.parentElement
    if (!element || element.closest('svg, [aria-hidden="true"]')) continue
    const elementRahmen = element.getBoundingClientRect()
    if (elementRahmen.width <= 2 && elementRahmen.height <= 2) continue
    const geschlossen = element.closest('details:not([open])')
    if (geschlossen && !element.closest('summary')) continue
    const stil = getComputedStyle(element)
    if (stil.visibility === 'hidden' || stil.display === 'none') continue
    const bereich = document.createRange()
    bereich.selectNodeContents(knoten)
    const zeilen = [...bereich.getClientRects()].filter((r) => r.width > 1 && r.height > 1)
    if (!zeilen.length) continue
    const farbe = kanaele(stil.color)
    if (!farbe) continue
    const groesse = parseFloat(stil.fontSize)
    elemente.push({
      text: knoten.textContent.trim().slice(0, 40),
      groesse,
      gross: groesse >= 24 || (groesse >= 18.66 && Number(stil.fontWeight) >= 700),
      farbe,
      zeilen: zeilen.map((r) => ({ x: r.x - kopfRahmen.x, y: r.y - kopfRahmen.y, w: r.width, h: r.height })),
    })
  }
  const ersatz = document.createElement('style')
  ersatz.id = 'kopf-kontrast-text-aus'
  ersatz.textContent = '.reisekopf *, .reisekopf { transition: none !important; animation: none !important; color: transparent !important; text-shadow: none !important; -webkit-text-fill-color: transparent !important; text-decoration-color: transparent !important; }'
  document.head.append(ersatz)
  await new Promise((fertig) => requestAnimationFrame(() => requestAnimationFrame(fertig)))
  return { elemente, ersatzEntfernen: true }
}

async function auswerten(seite, elemente, png) {
  return seite.evaluate(
    async ({ elemente: liste, base64 }) => {
      const bild = new Image()
      bild.src = `data:image/png;base64,${base64}`
      await bild.decode()
      const leinwand = document.createElement('canvas')
      leinwand.width = bild.width
      leinwand.height = bild.height
      const kontext = leinwand.getContext('2d', { willReadFrequently: true })
      kontext.drawImage(bild, 0, 0)
      const leuchtdichte = (r, g, b) => {
        const l = [r, g, b].map((k) => {
          const v = k / 255
          return v <= 0.03928 ? v / 12.92 : ((v + 0.055) / 1.055) ** 2.4
        })
        return 0.2126 * l[0] + 0.7152 * l[1] + 0.0722 * l[2]
      }
      return liste.map((eintrag) => {
        let schlechtester = Infinity
        let ort = null
        for (const zeile of eintrag.zeilen) {
          const x = Math.max(0, Math.floor(zeile.x))
          const y = Math.max(0, Math.floor(zeile.y))
          const w = Math.min(leinwand.width - x, Math.ceil(zeile.w))
          const h = Math.min(leinwand.height - y, Math.ceil(zeile.h))
          if (w <= 0 || h <= 0) continue
          const daten = kontext.getImageData(x, y, w, h).data
          for (let i = 0; i < daten.length; i += 4) {
            const a = eintrag.farbe.a
            const r = eintrag.farbe.r * a + daten[i] * (1 - a)
            const g = eintrag.farbe.g * a + daten[i + 1] * (1 - a)
            const b = eintrag.farbe.b * a + daten[i + 2] * (1 - a)
            const lv = leuchtdichte(r, g, b)
            const lh = leuchtdichte(daten[i], daten[i + 1], daten[i + 2])
            const verhaeltnis = (Math.max(lv, lh) + 0.05) / (Math.min(lv, lh) + 0.05)
            if (verhaeltnis < schlechtester) {
              schlechtester = verhaeltnis
              ort = { x: x + ((i / 4) % w), y: y + Math.floor(i / 4 / w), rgb: [daten[i], daten[i + 1], daten[i + 2]] }
            }
          }
        }
        return { text: eintrag.text, farbe: eintrag.farbe, gross: eintrag.gross, groesse: eintrag.groesse, schlechtesterRoh: Number.isFinite(schlechtester) ? schlechtester : null, schlechtester: Number.isFinite(schlechtester) ? Math.round(schlechtester * 100) / 100 : null, ort, zeilen: eintrag.zeilen.map((z) => [Math.round(z.x), Math.round(z.y), Math.round(z.w), Math.round(z.h)]) }
      })
    },
    { elemente, base64: png.toString('base64') },
  )
}

async function main() {
  mkdirSync(AUS, { recursive: true })
  const browser = await chromium.launch()
  const ergebnisse = []
  const ziele = [{ name: 'gast', adresse: `${BASIS}/reisen/${REISE.id}`, mitSpeicher: true }]
  if (KONTO) ziele.push({ name: 'konto', adresse: `${KONTO}/reisen/konto`, mitSpeicher: false })
  for (const ziel of ziele) {
   for (const breite of BREITEN) {
    for (const thema of ['light', 'dark']) {
      const context = await browser.newContext({
        viewport: { width: breite.width, height: breite.height },
        isMobile: breite.telefon,
        hasTouch: breite.telefon,
        locale: 'de-CH',
        timezoneId: 'Europe/Zurich',
        deviceScaleFactor: 1,
      })
      await context.addInitScript(
        ({ schluessel, wert, themaSchluessel, wunsch }) => {
          try {
            if (wert) localStorage.setItem(schluessel, wert)
            if (wunsch === 'dark') localStorage.setItem(themaSchluessel, 'dark')
          } catch { /* ignorieren */ }
        },
        { schluessel: REISE.schluessel, wert: ziel.mitSpeicher ? REISE.roh : '', themaSchluessel: THEMA_SCHLUESSEL, wunsch: thema },
      )
      const seite = await context.newPage()
      await seite.clock.setFixedTime(new Date('2026-12-03T10:00:00.000Z'))
      await seite.goto(ziel.adresse, { waitUntil: 'domcontentloaded' })
      await seite.waitForSelector('.reisekopf h1', { timeout: 20_000 })
      await seite.waitForTimeout(1200)
      for (const datei of BILDER) {
        const gesetzt = await seite.evaluate(async (pfad) => {
          const bild = document.querySelector('.reisekopf-grund img')
          if (!bild) return false
          bild.removeAttribute('srcset')
          bild.src = pfad
          await bild.decode().catch(() => undefined)
          return true
        }, `/images/organisieren/${datei}`)
        if (!gesetzt) {
          ergebnisse.push({ ziel: ziel.name, breite: breite.name, thema, bild: datei, fehler: 'Reisekopf ohne Bildebene' })
          continue
        }
        const vorbereitung = await seite.evaluate(messenImBrowser)
        const kopf = seite.locator('.reisekopf')
        const rahmen = await kopf.boundingBox()
        const png = await kopf.screenshot()
        if (process.env.KONTRAST_DEBUG === `${breite.name}-${thema}-${datei}`) writeFileSync('/tmp/pra/kontrast-debug.png', png)
        await seite.evaluate(() => {
          document.getElementById('kopf-kontrast-text-aus')?.remove()
        })
        await seite.waitForTimeout(450)
        const werte = await auswerten(seite, vorbereitung.elemente, png)
        const texte = werte.map((w) => w.text)
        const gemessen = werte.filter((w) => w.schlechtesterRoh != null)
        const nichtGemessen = werte.filter((w) => w.schlechtesterRoh == null)
        const verfehlt = gemessen.filter((w) => w.schlechtesterRoh < GRENZE)
        const schlechtesterRoh = gemessen.length ? Math.min(...gemessen.map((w) => w.schlechtesterRoh)) : null
        ergebnisse.push({
          ziel: ziel.name,
          breite: breite.name,
          thema,
          bild: datei,
          kopfBreite: rahmen ? Math.round(rahmen.width) : null,
          schlechtester: schlechtesterRoh == null ? null : Math.round(schlechtesterRoh * 100) / 100,
          schlechtesterRoh,
          verfehlt,
          nichtGemessen: nichtGemessen.map((w) => w.text),
          fehler: werte.length === 0 ? 'kein messbarer Text im Reisekopf' : nichtGemessen.length ? 'Zeilen ohne Messwert' : undefined,
          zeilen: werte.length,
          texte,
        })
      }
      await context.close()
    }
   }
  }
  await browser.close()
  const gemessene = ergebnisse.filter((e) => e.schlechtesterRoh != null)
  const mindest = gemessene.length ? Math.min(...gemessene.map((e) => e.schlechtesterRoh)) : null
  const bericht = {
    commit: COMMIT,
    basis: BASIS,
    grenze: GRENZE,
    bilder: BILDER.length,
    messungen: ergebnisse.length,
    schlechtesterWertGesamt: mindest == null ? null : Math.round(mindest * 100) / 100,
    nichtBestanden: ergebnisse.filter((e) => e.fehler || (e.verfehlt && e.verfehlt.length)),
    ergebnisse,
  }
  writeFileSync(join(AUS, 'kopf-kontrast.json'), JSON.stringify(bericht, null, 2))
  console.log(`Bilder: ${BILDER.length}, Messungen: ${ergebnisse.length}, schlechtester Kontrast: ${bericht.schlechtesterWertGesamt ?? 'nicht gemessen'} (Grenze ${GRENZE})`)
  console.log(`Nicht bestanden: ${bericht.nichtBestanden.length}`)
  if (!ergebnisse.length || mindest == null) {
    console.log('FAIL: nichts gemessen')
    process.exitCode = 1
  } else if (bericht.nichtBestanden.length) process.exitCode = 1
  for (const eintrag of bericht.nichtBestanden.slice(0, 20)) {
    console.log(`${eintrag.ziel} ${eintrag.breite} ${eintrag.thema} ${eintrag.bild}`, JSON.stringify(eintrag.verfehlt ?? eintrag.fehler))
  }
}

void main()
