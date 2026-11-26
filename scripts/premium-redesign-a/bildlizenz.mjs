#!/usr/bin/env node
// scripts/premium-redesign-a/bildlizenz.mjs
//
// Lizenz-Gate der Bilder (PR A, K3): Beweist an der laufenden Seite, dass keine Bilddatei ohne belegten
// Lizenznachweis mehr angezeigt oder in Metadaten genannt wird.
//
// Gesperrte Dateien (kein belegter Lizenznachweis im Repository):
//   /images/hero-bali.png, /images/bali.jpg, /images/lisbon.jpg, /images/zermatt.jpg, /images/amsterdam.jpg
//
// Geprüft wird an echten Browsern (Chromium, WebKit) auf Startseite und Entdecken, bei 390 und 1440 px, hell und dunkel:
//   1. Netzwerk: jede Anfrage nach einem Bild (auch über /_next/image?url=…), nach vollständigem Durchscrollen,
//   2. DOM: img (src, currentSrc, srcset), picture/source, CSS-Hintergrundbilder aller Elemente samt ::before/::after,
//      link rel=preload as=image,
//   3. Metadaten: og:image, twitter:image, link rel=icon/apple-touch-icon, JSON-LD (image, logo, primaryImageOfPage),
//   4. Roh-HTML des Servers (kein JavaScript): Fundstellen werden getrennt gemeldet. Die Datei `bali.jpg` & Co. bleiben
//      als CMS-Identität der Reiseideen im Seitenpayload möglich; sie werden dann nicht angefragt und nicht gezeigt.
//   5. Jedes gezeigte Foto (ausser dem neutralen Kartenmotiv und Marken-Dateien) braucht auf der Startseite den
//      sichtbaren Bildnachweis.
//
// Ein nicht erreichbarer Zustand (z. B. fehlende Seite) ist OFFEN, niemals PASS.
//
//   node scripts/premium-redesign-a/bildlizenz.mjs --base http://127.0.0.1:3462 \
//     --base-webkit https://127.0.0.1:3482 --out /tmp/pra/shots/bildlizenz
//
// Kein Produktionszugriff, keine Anmeldung, keine externen Bildquellen.

import { mkdirSync, writeFileSync } from 'node:fs'
import { join } from 'node:path'
import { chromium, webkit } from 'playwright'

function argument(name, standard) {
  const index = process.argv.indexOf(`--${name}`)
  return index >= 0 && process.argv[index + 1] ? process.argv[index + 1] : standard
}

const BASIS = argument('base', 'http://127.0.0.1:3462')
const BASIS_WEBKIT = argument('base-webkit', BASIS)
const AUS = argument('out', '/tmp/pra/shots/bildlizenz')
const COMMIT = argument('commit', 'unbekannt')
const SCHLUESSEL = 'jetnity:workspace-theme:v1'

const GESPERRT = ['hero-bali.png', 'bali.jpg', 'lisbon.jpg', 'zermatt.jpg', 'amsterdam.jpg']
const GESPERRT_MUSTER = new RegExp(`/images/(?:${GESPERRT.map((name) => name.replace('.', '\\.')).join('|')})(?![\\w.-])`, 'i')
const NEUTRAL = '/images/organisieren/neutral'
const SEITEN = [
  { name: 'startseite', pfad: '/' },
  { name: 'entdecken', pfad: '/entdecken' },
]
const BREITEN = [
  { name: '390', width: 390, height: 844, telefon: true },
  { name: '1440', width: 1440, height: 900, telefon: false },
]

/** Entschlüsselt /_next/image?url=%2Fimages%2F… zur eigentlichen Bilddatei. */
function bilddatei(adresse) {
  try {
    const url = new URL(adresse, 'http://x')
    if (url.pathname === '/_next/image') return decodeURIComponent(url.searchParams.get('url') ?? '')
    return url.pathname
  } catch {
    return adresse
  }
}

function gesperrt(text) {
  if (!text) return false
  let klartext = String(text).replace(/&amp;/g, '&')
  try {
    klartext = decodeURIComponent(klartext.replace(/\+/g, ' '))
  } catch { /* unverändert prüfen */ }
  return GESPERRT_MUSTER.test(klartext)
}

/** Läuft im Browser: alle Bildverweise der Seite, nach Art getrennt. */
function bildverweiseSammeln() {
  const urlsAusCss = (wert) => [...String(wert ?? '').matchAll(/url\((['"]?)(.*?)\1\)/g)].map((treffer) => treffer[2])
  const dom = []
  const merken = (art, element, adresse, extra = {}) => {
    if (!adresse) return
    const r = element?.getBoundingClientRect?.()
    dom.push({ art, adresse, sichtbar: r ? r.width > 0 && r.height > 0 : null, breite: r ? Math.round(r.width) : null, ...extra })
  }
  for (const bild of document.querySelectorAll('img')) {
    merken('img.src', bild, bild.getAttribute('src'), { alt: bild.getAttribute('alt') })
    merken('img.currentSrc', bild, bild.currentSrc)
    for (const teil of (bild.getAttribute('srcset') ?? '').split(',')) merken('img.srcset', bild, teil.trim().split(/\s+/)[0])
  }
  for (const quelle of document.querySelectorAll('picture source')) {
    for (const teil of (quelle.getAttribute('srcset') ?? '').split(',')) merken('source.srcset', quelle, teil.trim().split(/\s+/)[0])
  }
  for (const element of document.querySelectorAll('*')) {
    for (const pseudo of [null, '::before', '::after']) {
      const stil = getComputedStyle(element, pseudo)
      for (const adresse of urlsAusCss(stil.backgroundImage)) merken(`css.background${pseudo ?? ''}`, element, adresse)
      for (const adresse of urlsAusCss(stil.content)) merken(`css.content${pseudo ?? ''}`, element, adresse)
    }
    for (const adresse of urlsAusCss(element.getAttribute('style'))) merken('style.attribut', element, adresse)
  }
  for (const verweis of document.querySelectorAll('link[rel~="preload"][as="image"], link[rel~="icon"], link[rel="apple-touch-icon"], link[rel="image_src"]')) {
    merken(`link.${verweis.getAttribute('rel')}`, null, verweis.getAttribute('href'))
    merken(`link.${verweis.getAttribute('rel')}.imagesrcset`, null, (verweis.getAttribute('imagesrcset') ?? '').split(',')[0]?.trim().split(/\s+/)[0])
  }
  const meta = []
  for (const element of document.querySelectorAll('meta[property^="og:image"], meta[name^="twitter:image"], meta[property^="twitter:image"], meta[itemprop="image"]')) {
    meta.push({ name: element.getAttribute('property') ?? element.getAttribute('name') ?? element.getAttribute('itemprop'), inhalt: element.getAttribute('content') })
  }
  const jsonLd = []
  for (const skript of document.querySelectorAll('script[type="application/ld+json"]')) {
    try {
      const daten = JSON.parse(skript.textContent ?? '')
      const sammeln = (knoten, pfad) => {
        if (Array.isArray(knoten)) {
          knoten.forEach((eintrag, index) => sammeln(eintrag, `${pfad}[${index}]`))
          return
        }
        if (!knoten || typeof knoten !== 'object') return
        for (const [schluessel, wert] of Object.entries(knoten)) {
          const bildSchluessel = /image|logo|thumbnail|photo/i.test(schluessel)
          if (bildSchluessel && typeof wert === 'string') jsonLd.push({ pfad: `${pfad}.${schluessel}`, adresse: wert })
          else if (bildSchluessel && wert && typeof wert === 'object' && !Array.isArray(wert)) {
            const adresse = wert.url ?? wert.contentUrl ?? wert['@id']
            if (adresse) jsonLd.push({ pfad: `${pfad}.${schluessel}`, adresse })
          } else if (bildSchluessel && Array.isArray(wert)) {
            wert.forEach((eintrag, index) => {
              const adresse = typeof eintrag === 'string' ? eintrag : eintrag?.url
              if (adresse) jsonLd.push({ pfad: `${pfad}.${schluessel}[${index}]`, adresse })
            })
          }
          sammeln(wert, `${pfad}.${schluessel}`)
        }
      }
      sammeln(daten, '$')
    } catch {
      jsonLd.push({ pfad: 'JSON-LD nicht lesbar', adresse: '' })
    }
  }
  const nachweis = document.querySelector('[data-bildnachweise]')
  return {
    dom,
    meta,
    jsonLd,
    nachweisEintraege: nachweis ? nachweis.querySelectorAll('li').length : 0,
    nachweisVorhanden: Boolean(nachweis),
    ueberschrift: document.querySelector('h1')?.textContent?.trim() ?? null,
  }
}

async function durchscrollen(seite) {
  const hoehe = await seite.evaluate(() => document.documentElement.scrollHeight)
  const schritt = await seite.evaluate(() => Math.floor(innerHeight * 0.8))
  for (let y = 0; y < hoehe; y += schritt) {
    await seite.evaluate((oben) => window.scrollTo({ top: oben, behavior: 'instant' }), y)
    await seite.waitForTimeout(160)
  }
  await seite.evaluate(() => window.scrollTo({ top: 0, behavior: 'instant' }))
  await seite.waitForLoadState('networkidle', { timeout: 6000 }).catch(() => undefined)
  await seite.waitForTimeout(500)
}

async function messen(browserTyp, browserName, seite, breite, thema) {
  const basis = browserName === 'webkit' ? BASIS_WEBKIT : BASIS
  const context = await browserTyp.newContext({
    viewport: { width: breite.width, height: breite.height },
    isMobile: breite.telefon,
    hasTouch: breite.telefon,
    locale: 'de-CH',
    timezoneId: 'Europe/Zurich',
    ignoreHTTPSErrors: true,
  })
  await context.addInitScript(
    ({ schluessel, wunsch }) => {
      try {
        if (wunsch === 'dark') localStorage.setItem(schluessel, 'dark')
        else localStorage.removeItem(schluessel)
      } catch { /* ignorieren */ }
    },
    { schluessel: SCHLUESSEL, wunsch: thema },
  )
  const page = await context.newPage()
  const anfragen = []
  page.on('request', (anfrage) => {
    const adresse = anfrage.url()
    if (/\/images\/|\/_next\/image|\.(png|jpe?g|webp|avif|gif|svg)(\?|$)/i.test(adresse)) anfragen.push({ adresse: adresse.replace(/^https?:\/\/[^/]+/, ''), art: anfrage.resourceType() })
  })
  const antwort = await page.goto(`${basis}${seite.pfad}`, { waitUntil: 'domcontentloaded' })
  await page.waitForSelector('h1', { timeout: 20_000 }).catch(() => undefined)
  await page.waitForLoadState('networkidle', { timeout: 6000 }).catch(() => undefined)
  await durchscrollen(page)
  const verweise = await page.evaluate(bildverweiseSammeln)
  const rohHtml = await (await context.request.get(`${basis}${seite.pfad}`)).text()
  const bildDatei = join(AUS, `${seite.name}__${browserName}-${breite.name}-${thema}.png`)
  await page.screenshot({ path: bildDatei, fullPage: false })
  await context.close()

  const netzwerkTreffer = anfragen.filter((eintrag) => gesperrt(bilddatei(eintrag.adresse)) || gesperrt(eintrag.adresse))
  const domTreffer = verweise.dom.filter((eintrag) => gesperrt(eintrag.adresse))
  const metaTreffer = verweise.meta.filter((eintrag) => gesperrt(eintrag.inhalt))
  const jsonLdTreffer = verweise.jsonLd.filter((eintrag) => gesperrt(eintrag.adresse))
  const rohTreffer = [...new Set((rohHtml.match(/\/images\/[\w./%-]+/gi) ?? []).filter((adresse) => gesperrt(adresse)))]
  const gezeigteFotos = [
    ...new Set(
      verweise.dom
        .filter((eintrag) => eintrag.art === 'img.currentSrc' && eintrag.sichtbar !== false)
        .map((eintrag) => bilddatei(eintrag.adresse))
        .filter((datei) => datei.startsWith('/images/') && !datei.startsWith('/images/brand') && !datei.includes(NEUTRAL)),
    ),
  ]
  const gelieferteBilder = [...new Set(anfragen.map((eintrag) => bilddatei(eintrag.adresse)).filter((datei) => datei.startsWith('/images/')))].sort()
  const fehler = []
  if (!antwort || antwort.status() !== 200) fehler.push(`Seite nicht erreichbar (Status ${antwort?.status() ?? 'keiner'})`)
  if (!verweise.ueberschrift) fehler.push('keine Überschrift gerendert: Seite nicht gemessen')
  if (netzwerkTreffer.length) fehler.push(`gesperrte Datei im Netzwerk: ${netzwerkTreffer.map((t) => t.adresse).join(', ')}`)
  if (domTreffer.length) fehler.push(`gesperrte Datei im DOM: ${domTreffer.map((t) => `${t.art} ${t.adresse}`).join(', ')}`)
  if (metaTreffer.length) fehler.push(`gesperrte Datei in Metadaten: ${metaTreffer.map((t) => `${t.name} ${t.inhalt}`).join(', ')}`)
  if (jsonLdTreffer.length) fehler.push(`gesperrte Datei in JSON-LD: ${jsonLdTreffer.map((t) => `${t.pfad} ${t.adresse}`).join(', ')}`)
  if (seite.name === 'startseite' && gezeigteFotos.length > 0 && !verweise.nachweisVorhanden) fehler.push('Fotos gezeigt, aber kein sichtbarer Bildnachweis')
  return {
    browser: browserName,
    seite: seite.name,
    breite: breite.name,
    thema,
    status: antwort?.status() ?? null,
    ueberschrift: verweise.ueberschrift,
    anfragenBilder: anfragen.length,
    gelieferteBilder,
    gezeigteFotos,
    nachweis: { vorhanden: verweise.nachweisVorhanden, eintraege: verweise.nachweisEintraege },
    meta: verweise.meta,
    jsonLdBilder: verweise.jsonLd,
    treffer: { netzwerk: netzwerkTreffer, dom: domTreffer, meta: metaTreffer, jsonLd: jsonLdTreffer },
    rohHtmlFundstellen: rohTreffer,
    screenshot: bildDatei.split('/').pop(),
    fehler,
    bestanden: fehler.length === 0,
  }
}

async function main() {
  mkdirSync(AUS, { recursive: true })
  const browserListe = { chromium: await chromium.launch(), webkit: await webkit.launch() }
  const ergebnisse = []
  for (const [browserName, browserTyp] of Object.entries(browserListe)) {
    for (const seite of SEITEN) {
      for (const breite of BREITEN) {
        for (const thema of ['light', 'dark']) {
          const eintrag = await messen(browserTyp, browserName, seite, breite, thema)
          ergebnisse.push(eintrag)
          console.log(
            `${eintrag.bestanden ? 'PASS' : 'FAIL'} ${browserName.padEnd(8)} ${seite.name.padEnd(10)} ${breite.name.padEnd(5)} ${thema.padEnd(5)} ` +
              `Bildanfragen=${eintrag.anfragenBilder} Fotos=${eintrag.gezeigteFotos.length} Nachweis=${eintrag.nachweis.eintraege} gesperrt: Netz=${eintrag.treffer.netzwerk.length} DOM=${eintrag.treffer.dom.length} Meta=${eintrag.treffer.meta.length} LD=${eintrag.treffer.jsonLd.length} Roh=${eintrag.rohHtmlFundstellen.length}` +
              (eintrag.fehler.length ? ` -> ${eintrag.fehler.join(' | ')}` : ''),
          )
        }
      }
    }
  }
  for (const typ of Object.values(browserListe)) await typ.close()
  const bericht = {
    commit: COMMIT,
    basis: BASIS,
    basisWebkit: BASIS_WEBKIT,
    erzeugt: new Date().toISOString(),
    gesperrteDateien: GESPERRT,
    gesamt: ergebnisse.length,
    bestanden: ergebnisse.filter((eintrag) => eintrag.bestanden).length,
    ergebnisse,
  }
  writeFileSync(join(AUS, 'bildlizenz.json'), JSON.stringify(bericht, null, 2))
  console.log(`Fertig: ${bericht.bestanden}/${bericht.gesamt} bestanden`)
  if (bericht.bestanden !== bericht.gesamt) process.exitCode = 1
}

void main()
