#!/usr/bin/env node
// scripts/premium-redesign-a/bildlizenz.mjs
//
// Freigabe-Gate der Bilder (PR A, PO-Bildkorrektur 26.11.2026): Beweist an der laufenden Seite, dass
//   1. nur die vier einzeln belegten KI-Illustrationen gezeigt werden (Allowlist), jede mit sichtbarem Hinweis
//      «KI-Illustration», wahrem Alt-Text und Eintrag in den Bildnachweisen,
//   2. die zurückgehaltene Illustration (Zermatt) nirgends angefragt, gezeigt oder in Metadaten genannt wird,
//   3. Open Graph, Twitter und JSON-LD das Startseitenbild als KI-Illustration beschreiben (kein Foto, keine
//      echte Ortsaufnahme behauptet), mit den echten Abmessungen der ausgelieferten Datei,
//   4. die Datenquellen-Seite alle fünf Herkunftsnachweise führt.
//
// Allowlist (jede Datei einzeln belegt, PO-Erklärung 26.11.2026):
//   /images/hero-bali.png, /images/bali.jpg, /images/lisbon.jpg, /images/amsterdam.jpg
// Zurückgehalten: /images/zermatt.jpg (Ortskennung ungeklärt). Jede andere Datei unter /images/ ausserhalb von
// /images/organisieren/ und /images/brand/ gilt als nicht freigegeben und lässt die Prüfung scheitern.
//
// Geprüft wird an echten Browsern (Chromium, WebKit) auf Startseite, Entdecken und Datenquellen, bei 390 und
// 1440 px, hell und dunkel:
//   - Netzwerk: jede Bildanfrage (auch über /_next/image?url=…) nach vollständigem Durchscrollen,
//   - DOM: img (src, currentSrc, srcset), picture/source, CSS-Hintergründe samt ::before/::after, link rel=preload,
//   - Metadaten: og:image(+alt/width/height), twitter:image(+alt), Icons, JSON-LD (inkl. ImageObject-Felder),
//   - Auslieferung: Dateikopf des og:image (PNG-IHDR) gegen og:image:width/height,
//   - Roh-HTML des Servers: Fundstellen der fünf Dateinamen werden getrennt gemeldet. Die Dateien bleiben als
//     CMS-Identität im Seitenpayload möglich; entscheidend ist, was angefragt und gezeigt wird.
//
// Ein nicht erreichbarer oder nicht gerenderter Zustand ist FAIL (nicht gemessen), niemals PASS.
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

const KI_URHEBER = 'KI-generiert (ChatGPT/OpenAI), Eigentum Jetnity/Sasa Feirov (PO-Erklärung 26.11.2026)'
const TEILEN_ALT = 'Jetnity: Deine ganze Reise. KI-Illustration von Palmen und Reisterrassen im Sonnenuntergang, Motiv Bali'
const ILLUSTRATIONSHINWEIS = 'KI-Illustration'
const FREIGEGEBEN = {
  'hero-bali.png': 'KI-Illustration: Palmen und Reisterrassen im warmen Licht des Sonnenuntergangs, Motiv Bali',
  'bali.jpg': 'KI-Illustration: Reisterrassen und Palmen im Morgenlicht, Motiv Bali',
  'lisbon.jpg': 'KI-Illustration: gelbe Tram in einer Gasse bei Sonnenuntergang, Motiv Lissabon',
  'amsterdam.jpg': 'KI-Illustration: Grachtenhäuser und beleuchtete Brücken am Abend mit Tulpen, Motiv Amsterdam',
}
const ZURUECKGEHALTEN = ['zermatt.jpg']
const FUENF = [...Object.keys(FREIGEGEBEN), ...ZURUECKGEHALTEN]
const FUENF_MUSTER = new RegExp(`/images/(?:${FUENF.map((name) => name.replace('.', '\\.')).join('|')})(?![\\w.-])`, 'i')
const ZURUECK_MUSTER = new RegExp(`/images/(?:${ZURUECKGEHALTEN.map((name) => name.replace('.', '\\.')).join('|')})(?![\\w.-])`, 'i')
const NEUTRAL = '/images/organisieren/reiseatlas.webp'

const SEITEN = [
  { name: 'startseite', pfad: '/', erwartet: ['hero-bali.png', 'bali.jpg', 'lisbon.jpg', 'amsterdam.jpg'], nachweise: 4 },
  { name: 'entdecken', pfad: '/entdecken', erwartet: ['bali.jpg', 'lisbon.jpg', 'amsterdam.jpg'], nachweise: 3 },
  { name: 'datenquellen', pfad: '/datenquellen', erwartet: [], nachweise: 0 },
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

const dateiname = (adresse) => bilddatei(adresse).split('/').pop() ?? ''

function klartext(text) {
  let wert = String(text ?? '').replace(/&amp;/g, '&')
  try {
    wert = decodeURIComponent(wert.replace(/\+/g, ' '))
  } catch { /* unverändert prüfen */ }
  return wert
}

const zurueckgehalten = (text) => Boolean(text) && ZURUECK_MUSTER.test(klartext(text))
const aufFuenf = (text) => Boolean(text) && FUENF_MUSTER.test(klartext(text))

/** Unter /images/ ausserhalb von organisieren/ und brand/ muss jede Datei auf der Allowlist stehen. */
function nichtFreigegeben(adresse) {
  const datei = bilddatei(adresse)
  if (!datei.startsWith('/images/') || datei.startsWith('/images/organisieren/') || datei.startsWith('/images/brand')) return false
  return !Object.hasOwn(FREIGEGEBEN, datei.slice('/images/'.length))
}

/** Läuft im Browser: alle Bildverweise, gezeigte Illustrationen samt Hinweis und die Bildnachweise der Seite. */
function seiteSammeln() {
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
  const jsonLdRoh = []
  for (const skript of document.querySelectorAll('script[type="application/ld+json"]')) {
    try {
      const daten = JSON.parse(skript.textContent ?? '')
      jsonLdRoh.push(daten)
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

  const gezeigt = []
  for (const bild of document.querySelectorAll('img')) {
    const rechteck = bild.getBoundingClientRect()
    if (rechteck.width === 0 || rechteck.height === 0 || !bild.currentSrc) continue
    const behaelter = bild.closest('li, article, section')
    const hinweis = behaelter?.querySelector('[data-illustrationshinweis]') ?? null
    const hinweisRechteck = hinweis?.getBoundingClientRect() ?? null
    const stil = hinweis ? getComputedStyle(hinweis) : null
    gezeigt.push({
      adresse: bild.currentSrc,
      alt: bild.getAttribute('alt'),
      behaelterText: (behaelter?.textContent ?? '').replace(/\s+/g, ' ').trim().slice(0, 160),
      hinweis: hinweis
        ? {
            text: (hinweis.textContent ?? '').trim(),
            sichtbar: hinweisRechteck.width > 0 && hinweisRechteck.height > 0 && stil.visibility !== 'hidden' && stil.display !== 'none' && Number(stil.opacity) > 0,
            ausgeblendet: Boolean(hinweis.closest('[aria-hidden="true"], .sr-only')),
            abgeschnitten: hinweis.scrollWidth > hinweis.clientWidth + 1,
            imBild:
              hinweisRechteck.left >= rechteck.left - 1 &&
              hinweisRechteck.right <= rechteck.right + 1 &&
              hinweisRechteck.top >= rechteck.top - 1 &&
              hinweisRechteck.bottom <= rechteck.bottom + 1,
            breite: Math.round(hinweisRechteck.width),
            hoehe: Math.round(hinweisRechteck.height),
          }
        : null,
    })
  }

  const nachweis = document.querySelector('[data-bildnachweise]')
  const nachweisZeilen = nachweis
    ? [...nachweis.querySelectorAll('li')].map((zeile) => ({
        medium: zeile.getAttribute('data-medium'),
        text: (zeile.textContent ?? '').replace(/\s+/g, ' ').trim(),
        herkunftLink: Boolean(zeile.querySelector('a[href="/datenquellen#ki-illustrationen"]')),
        openaiLink: Boolean(zeile.querySelector('a[href="https://openai.com/policies/eu-terms-of-use/"]')),
      }))
    : []

  const kiAbschnitt = document.querySelector('#ki-illustrationen')
  const datenquellen = kiAbschnitt
    ? {
        eintraege: [...kiAbschnitt.querySelectorAll('[data-illustration]')].map((zeile) => ({
          datei: zeile.getAttribute('data-illustration'),
          text: (zeile.textContent ?? '').replace(/\s+/g, ' ').trim(),
        })),
        links: [...kiAbschnitt.querySelectorAll('a')].map((verweis) => verweis.getAttribute('href')),
        text: (kiAbschnitt.textContent ?? '').replace(/\s+/g, ' ').trim(),
      }
    : null

  return {
    dom,
    meta,
    jsonLd,
    jsonLdRoh,
    gezeigt,
    nachweisVorhanden: Boolean(nachweis),
    nachweisZeilen,
    datenquellen,
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

function pngAbmessungen(daten) {
  const kopf = Buffer.from([0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a])
  if (daten.length < 24 || !daten.subarray(0, 8).equals(kopf)) return null
  return { breite: daten.readUInt32BE(16), hoehe: daten.readUInt32BE(20) }
}

function metaWert(meta, name) {
  return meta.filter((eintrag) => eintrag.name === name).map((eintrag) => eintrag.inhalt)
}

/** Prüft Open Graph, Twitter und die ausgelieferte Datei. */
async function metadatenPruefen(context, basis, verweise, fehler, bildErforderlich) {
  const bericht = {}
  for (const art of ['og', 'twitter']) {
    const bilder = metaWert(verweise.meta, art === 'og' ? 'og:image' : 'twitter:image')
    const alts = metaWert(verweise.meta, art === 'og' ? 'og:image:alt' : 'twitter:image:alt')
    bericht[art] = { bilder, alts }
    if (bilder.length === 0) {
      // Seiten mit eigenen Seitenmetadaten ohne Bild (etwa Entdecken) behaupten keines; erforderlich ist es nur auf der Startseite.
      if (bildErforderlich) fehler.push(`${art}:image fehlt`)
      if (alts.length) fehler.push(`${art}:image:alt ohne ${art}:image`)
      continue
    }
    for (const adresse of bilder) {
      if (zurueckgehalten(adresse) || nichtFreigegeben(adresse)) fehler.push(`${art}:image nicht freigegeben: ${adresse}`)
      if (!aufFuenf(adresse)) fehler.push(`${art}:image ist keine freigegebene Illustration: ${adresse}`)
      else if (dateiname(adresse) in FREIGEGEBEN && alts.length === 0) fehler.push(`${art}:image:alt fehlt`)
    }
    for (const alt of alts) {
      if (alt !== TEILEN_ALT) fehler.push(`${art}:image:alt weicht ab: ${alt}`)
      if (!String(alt).includes(ILLUSTRATIONSHINWEIS)) fehler.push(`${art}:image:alt nennt keine KI-Illustration`)
      if (/\bFoto\b|Aufnahme/.test(String(alt))) fehler.push(`${art}:image:alt behauptet ein Foto`)
    }
  }
  const ogBild = metaWert(verweise.meta, 'og:image')[0]
  if (ogBild) {
    const pfad = new URL(ogBild, 'http://x').pathname
    const antwort = await context.request.get(`${basis}${pfad}`)
    const daten = await antwort.body()
    const echt = pngAbmessungen(daten)
    const angegeben = {
      breite: Number(metaWert(verweise.meta, 'og:image:width')[0]),
      hoehe: Number(metaWert(verweise.meta, 'og:image:height')[0]),
    }
    bericht.ogDatei = { pfad, status: antwort.status(), inhaltstyp: antwort.headers()['content-type'] ?? null, bytes: daten.length, echt, angegeben }
    if (antwort.status() !== 200) fehler.push(`og:image nicht auslieferbar (Status ${antwort.status()})`)
    if (!echt) fehler.push('og:image ist kein PNG (Dateikopf nicht lesbar)')
    else if (echt.breite !== angegeben.breite || echt.hoehe !== angegeben.hoehe) {
      fehler.push(`og:image-Abmessungen ${angegeben.breite}x${angegeben.hoehe} weichen von der Datei ${echt.breite}x${echt.hoehe} ab`)
    }
  }
  return bericht
}

function jsonLdPruefen(verweise, fehler) {
  const knoten = verweise.jsonLdRoh.flatMap((daten) => daten['@graph'] ?? [daten])
  const app = knoten.find((eintrag) => eintrag['@type'] === 'SoftwareApplication')
  if (!app) {
    fehler.push('JSON-LD: SoftwareApplication fehlt')
    return null
  }
  const bild = app.image
  if (!bild || typeof bild !== 'object') {
    fehler.push('JSON-LD: image ist kein ImageObject')
    return bild ?? null
  }
  if (bild['@type'] !== 'ImageObject') fehler.push('JSON-LD: image hat nicht den Typ ImageObject')
  if (!String(bild.url ?? '').endsWith('/images/hero-bali.png')) fehler.push(`JSON-LD: image.url weicht ab: ${bild.url}`)
  if (!String(bild.caption ?? '').startsWith(`${ILLUSTRATIONSHINWEIS}: `)) fehler.push('JSON-LD: caption nennt keine KI-Illustration')
  if (bild.creditText !== KI_URHEBER) fehler.push('JSON-LD: creditText ist nicht der Herkunftsvermerk')
  if (/\bFoto\b|Aufnahme|photo/i.test(JSON.stringify(bild))) fehler.push('JSON-LD: behauptet ein Foto')
  return bild
}

function gezeigtePruefen(seite, verweise, fehler) {
  const gezeigteDateien = [...new Set(verweise.gezeigt.map((eintrag) => dateiname(eintrag.adresse)))]
  const illustrationen = verweise.gezeigt.filter((eintrag) => dateiname(eintrag.adresse) in FREIGEGEBEN)
  for (const eintrag of verweise.gezeigt) {
    const datei = dateiname(eintrag.adresse)
    if (nichtFreigegeben(eintrag.adresse) || zurueckgehalten(eintrag.adresse)) fehler.push(`nicht freigegebenes Bild gezeigt: ${bilddatei(eintrag.adresse)}`)
    if (datei in FREIGEGEBEN) {
      if (eintrag.alt !== FREIGEGEBEN[datei]) fehler.push(`${datei}: Alt-Text weicht ab: «${eintrag.alt}»`)
      const hinweis = eintrag.hinweis
      if (!hinweis) fehler.push(`${datei}: kein Hinweis «${ILLUSTRATIONSHINWEIS}» am Bild`)
      else {
        if (hinweis.text !== ILLUSTRATIONSHINWEIS) fehler.push(`${datei}: Hinweistext «${hinweis.text}»`)
        if (!hinweis.sichtbar || hinweis.ausgeblendet) fehler.push(`${datei}: Hinweis nicht sichtbar`)
        if (hinweis.abgeschnitten) fehler.push(`${datei}: Hinweis abgeschnitten`)
        if (!hinweis.imBild) fehler.push(`${datei}: Hinweis liegt nicht im Bild`)
      }
    }
    if (bilddatei(eintrag.adresse) === NEUTRAL && /Zermatt/.test(eintrag.behaelterText)) {
      if (eintrag.alt !== '') fehler.push(`Zermatt: neutrales Motiv darf keinen Alt-Text mit Ortsbehauptung tragen («${eintrag.alt}»)`)
      if (eintrag.hinweis) fehler.push('Zermatt: neutrales Motiv trägt einen Illustrationshinweis')
    }
  }
  for (const datei of seite.erwartet) {
    if (!illustrationen.some((eintrag) => dateiname(eintrag.adresse) === datei)) fehler.push(`erwartete Illustration nicht gezeigt: ${datei}`)
  }
  const unerwartet = [...new Set(illustrationen.map((eintrag) => dateiname(eintrag.adresse)))].filter((datei) => !seite.erwartet.includes(datei))
  if (unerwartet.length) fehler.push(`Illustration auf dieser Seite nicht erwartet: ${unerwartet.join(', ')}`)
  if (seite.name !== 'datenquellen') {
    const zermatt = verweise.gezeigt.find((eintrag) => /Zermatt/.test(eintrag.behaelterText))
    if (!zermatt) fehler.push('Zermatt: Karte nicht gefunden (neutrales Motiv nicht belegt)')
    else if (bilddatei(zermatt.adresse) !== NEUTRAL) fehler.push(`Zermatt: zeigt ${bilddatei(zermatt.adresse)} statt des neutralen Motivs`)
  }
  return { gezeigteDateien, illustrationen: illustrationen.length }
}

function nachweisePruefen(seite, verweise, fehler) {
  const ki = verweise.nachweisZeilen.filter((zeile) => zeile.medium === 'ki-illustration')
  if (seite.nachweise > 0) {
    if (!verweise.nachweisVorhanden) fehler.push('Illustrationen gezeigt, aber keine sichtbare Bildnachweis-Liste')
    if (ki.length !== seite.nachweise) fehler.push(`Bildnachweise: ${ki.length} Illustrationszeilen statt ${seite.nachweise}`)
    for (const zeile of ki) {
      if (!zeile.text.includes(KI_URHEBER)) fehler.push(`Bildnachweis ohne Herkunftsvermerk: ${zeile.text.slice(0, 60)}`)
      if (!zeile.text.includes('kein Foto')) fehler.push(`Bildnachweis nennt «kein Foto» nicht: ${zeile.text.slice(0, 60)}`)
      if (!zeile.herkunftLink || !zeile.openaiLink) fehler.push(`Bildnachweis ohne Herkunfts-/Bedingungslink: ${zeile.text.slice(0, 60)}`)
      if (/Zermatt/.test(zeile.text) && /Matterhorn mit Berghütte/.test(zeile.text)) fehler.push('Zermatt-Illustration in den Bildnachweisen der Anzeige')
    }
  }
  return { kiZeilen: ki.length, zeilen: verweise.nachweisZeilen.length }
}

async function datenquellenPruefen(context, basis, verweise, fehler) {
  const bereich = verweise.datenquellen
  if (!bereich) {
    fehler.push('Datenquellen: Abschnitt «KI-Illustrationen» fehlt')
    return null
  }
  if (bereich.eintraege.length !== 5) fehler.push(`Datenquellen: ${bereich.eintraege.length} statt 5 Herkunftsnachweise`)
  for (const eintrag of bereich.eintraege) {
    const zurueck = eintrag.datei === '/images/zermatt.jpg'
    if (zurueck !== eintrag.text.includes('Derzeit nicht im Einsatz')) fehler.push(`Datenquellen: Einsatzstatus von ${eintrag.datei} falsch`)
    if (!/SHA-256: [0-9a-f]{64}/.test(eintrag.text)) fehler.push(`Datenquellen: Prüfsumme fehlt bei ${eintrag.datei}`)
    if (!/Ersteintrag im Repository \d{2}\.\d{2}\.\d{4}/.test(eintrag.text)) fehler.push(`Datenquellen: Ersteintrag fehlt bei ${eintrag.datei}`)
  }
  for (const adresse of ['https://openai.com/policies/dec-2024-eu-terms/', 'https://openai.com/policies/eu-terms-of-use/']) {
    if (!bereich.links.includes(adresse)) fehler.push(`Datenquellen: Link auf ${adresse} fehlt`)
  }
  for (const satz of [KI_URHEBER, 'kein verifiziertes Erstellungsdatum', 'keine Creative-Commons-Lizenz', 'Garantie']) {
    if (!bereich.text.includes(satz)) fehler.push(`Datenquellen: Aussage fehlt: «${satz}»`)
  }
  const txt = await context.request.get(`${basis}/images/organisieren/Bildnachweise.txt`)
  const text = txt.ok() ? await txt.text() : ''
  const fehlend = FUENF.filter((datei) => !text.split('\n').some((zeile) => zeile.startsWith(`${datei} –`) && zeile.endsWith(KI_URHEBER)))
  if (fehlend.length) fehler.push(`Bildnachweise.txt: Datensatz fehlt für ${fehlend.join(', ')}`)
  return { eintraege: bereich.eintraege.length, txtStatus: txt.status(), txtFehlend: fehlend }
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
  const verweise = await page.evaluate(seiteSammeln)
  const rohHtml = await (await context.request.get(`${basis}${seite.pfad}`)).text()
  const bildDatei = join(AUS, `${seite.name}__${browserName}-${breite.name}-${thema}.png`)
  await page.screenshot({ path: bildDatei, fullPage: false })

  const fehler = []
  if (!antwort || antwort.status() !== 200) fehler.push(`Seite nicht erreichbar (Status ${antwort?.status() ?? 'keiner'})`)
  if (!verweise.ueberschrift) fehler.push('keine Überschrift gerendert: Seite nicht gemessen')

  const netzwerkVerboten = anfragen.filter((eintrag) => zurueckgehalten(bilddatei(eintrag.adresse)) || zurueckgehalten(eintrag.adresse) || nichtFreigegeben(eintrag.adresse))
  const domVerboten = verweise.dom.filter((eintrag) => zurueckgehalten(eintrag.adresse) || nichtFreigegeben(eintrag.adresse))
  const metaVerboten = verweise.meta.filter((eintrag) => /image/.test(eintrag.name ?? '') && !/:alt$/.test(eintrag.name ?? '') && (zurueckgehalten(eintrag.inhalt) || nichtFreigegeben(eintrag.inhalt)))
  const jsonLdVerboten = verweise.jsonLd.filter((eintrag) => zurueckgehalten(eintrag.adresse) || nichtFreigegeben(eintrag.adresse))
  if (netzwerkVerboten.length) fehler.push(`nicht freigegebene Datei im Netzwerk: ${netzwerkVerboten.map((t) => t.adresse).join(', ')}`)
  if (domVerboten.length) fehler.push(`nicht freigegebene Datei im DOM: ${domVerboten.map((t) => `${t.art} ${t.adresse}`).join(', ')}`)
  if (metaVerboten.length) fehler.push(`nicht freigegebene Datei in Metadaten: ${metaVerboten.map((t) => `${t.name} ${t.inhalt}`).join(', ')}`)
  if (jsonLdVerboten.length) fehler.push(`nicht freigegebene Datei in JSON-LD: ${jsonLdVerboten.map((t) => `${t.pfad} ${t.adresse}`).join(', ')}`)

  const anzeige = gezeigtePruefen(seite, verweise, fehler)
  const nachweis = nachweisePruefen(seite, verweise, fehler)
  let metadaten = null
  let jsonLdBild = null
  let datenquellen = null
  if (seite.name === 'startseite' || seite.name === 'entdecken') metadaten = await metadatenPruefen(context, basis, verweise, fehler, seite.name === 'startseite')
  if (seite.name === 'startseite') jsonLdBild = jsonLdPruefen(verweise, fehler)
  if (seite.name === 'datenquellen') datenquellen = await datenquellenPruefen(context, basis, verweise, fehler)
  await context.close()

  const rohFundstellen = [...new Set((rohHtml.match(/\/images\/[\w./%-]+/gi) ?? []).filter((adresse) => aufFuenf(adresse)))]
  const gelieferteBilder = [...new Set(anfragen.map((eintrag) => bilddatei(eintrag.adresse)).filter((datei) => datei.startsWith('/images/')))].sort()
  return {
    browser: browserName,
    seite: seite.name,
    breite: breite.name,
    thema,
    status: antwort?.status() ?? null,
    ueberschrift: verweise.ueberschrift,
    anfragenBilder: anfragen.length,
    gelieferteBilder,
    anzeige,
    nachweis,
    metadaten,
    jsonLdBild,
    datenquellen,
    gezeigt: verweise.gezeigt.map((eintrag) => ({ datei: bilddatei(eintrag.adresse), alt: eintrag.alt, hinweis: eintrag.hinweis })),
    rohHtmlFundstellen: rohFundstellen,
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
            `${eintrag.bestanden ? 'PASS' : 'FAIL'} ${browserName.padEnd(8)} ${seite.name.padEnd(12)} ${breite.name.padEnd(5)} ${thema.padEnd(5)} ` +
              `Bildanfragen=${eintrag.anfragenBilder} Illustrationen=${eintrag.anzeige.illustrationen} Nachweiszeilen=${eintrag.nachweis.kiZeilen} Roh=${eintrag.rohHtmlFundstellen.length}` +
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
    freigegeben: Object.keys(FREIGEGEBEN),
    zurueckgehalten: ZURUECKGEHALTEN,
    gesamt: ergebnisse.length,
    bestanden: ergebnisse.filter((eintrag) => eintrag.bestanden).length,
    ergebnisse,
  }
  writeFileSync(join(AUS, 'bildlizenz.json'), JSON.stringify(bericht, null, 2))
  console.log(`Fertig: ${bericht.bestanden}/${bericht.gesamt} bestanden`)
  if (bericht.bestanden !== bericht.gesamt) process.exitCode = 1
}

void main()
