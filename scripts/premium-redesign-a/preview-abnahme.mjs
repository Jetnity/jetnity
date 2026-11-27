#!/usr/bin/env node
// scripts/premium-redesign-a/preview-abnahme.mjs
//
// Abnahme eines echten Preview- oder Production-Builds im Browser, ohne Fixture und ohne Mock (PR A,
// TL-Korrekturauftrag «Work-Gerätetest NO-GO», 27.11.2026). Prüft, was am Gerät zuerst kaputt war: die Planung
// (`/planen?zielId=geonames%3A2657928`), den Reisebereich (`/reisen`) und die geschützten Kontopfade, mit der
// Supabase-Verbindung, die der Build wirklich trägt. Es legt keine Reise an, bucht nichts, meldet nichts an und
// schreibt nirgends. Es ersetzt keinen Work-Test auf dem iPhone.
//
//   node scripts/premium-redesign-a/preview-abnahme.mjs --app https://<vorschau-adresse> \
//     --out /tmp/pra/shots/preview --commit <sha> [--browsers chromium,webkit] [--video /tmp/pra/video]
//
// Nur für einen lokalen Lauf über den TLS-Vorsatz (`tls-proxy.mjs`, selbst signiertes Zertifikat): `--lokal-tls`.
// Eine echte Vorschau braucht das nicht und wird immer mit gültigem Zertifikat geprüft.
//
// Geschützte Vorschauen: Der Schutzschlüssel kommt nur aus der Umgebung und wird nie ausgegeben, nie
// protokolliert und nur an die Herkunft der Vorschau gesendet.
//   PREVIEW_BYPASS_SECRET  Header `x-vercel-protection-bypass` (Automatisierung) für jede Anfrage derselben Herkunft
//   PREVIEW_SHARE_TOKEN    Wert des Parameters `_vercel_share` (setzt beim ersten Aufruf das Cookie)
//
// Jede Zeile des Protokolls nennt die Anfrage-Kennung (`x-vercel-id`), damit ein Fehler im Laufzeitprotokoll
// gelesen werden kann. HTTP 200 genügt nicht: eine Next-Fehlerseite kann 200 liefern, deshalb wird zusätzlich
// der sichtbare Text auf Fehlermarken geprüft (Digest, «Application error», fehlende Supabase-Variablen).

import { mkdirSync, writeFileSync } from 'node:fs'
import { join } from 'node:path'
import { chromium, webkit } from 'playwright'

function argument(name, standard) {
  const index = process.argv.indexOf(`--${name}`)
  return index >= 0 && process.argv[index + 1] ? process.argv[index + 1] : standard
}

const APP = new URL(argument('app', 'http://127.0.0.1:3491'))
const AUS = argument('out', '/tmp/pra/shots/preview')
const COMMIT = argument('commit', 'unbekannt')
const BROWSER_NAMEN = argument('browsers', 'chromium,webkit').split(',').filter(Boolean)
const VIDEO_VERZEICHNIS = argument('video', '')
const LOKAL_TLS = process.argv.includes('--lokal-tls')
const BYPASS = process.env.PREVIEW_BYPASS_SECRET ?? ''
const SHARE = process.env.PREVIEW_SHARE_TOKEN ?? ''
const THEMA_SCHLUESSEL = 'jetnity:workspace-theme:v1'
const ZEITZONE = 'Europe/Zurich'
const ZERMATT = 'geonames:2657928'
const ZOFINGEN = 'geonames:2657915'
const GESCHUETZT = ['/account', '/account/settings', '/account/bookings', '/account/merkliste']
const FEHLERMARKEN = [
  /Application error/i,
  /server-side exception/i,
  /\bDigest\b\s*:?\s*\d{6,}/i,
  /NEXT_PUBLIC_SUPABASE/,
  /\[supabase\]/i,
  /Internal Server Error/i,
  /This page couldn.t load/i,
]
const BREITEN = [
  { name: '390', width: 390, height: 844, telefon: true },
  { name: '1440', width: 1440, height: 900, telefon: false },
]
const THEMEN = ['light', 'dark']

mkdirSync(AUS, { recursive: true })

const protokoll = []
let fehlgeschlagen = 0
function pruefe(kombi, name, bestanden, tatsaechlich) {
  if (!bestanden) fehlgeschlagen += 1
  protokoll.push({ kombi, name, status: bestanden ? 'PASS' : 'FAIL', tatsaechlich })
  console.log(`${bestanden ? 'PASS' : 'FAIL'} [${kombi}] ${name}${bestanden ? '' : ` -> ${JSON.stringify(tatsaechlich)}`}`)
}

function ohneGeheimnis(adresse) {
  try {
    const url = new URL(adresse)
    url.searchParams.delete('_vercel_share')
    return `${url.pathname}${url.search}`
  } catch {
    return String(adresse).slice(0, 120)
  }
}

async function kontext(browserTyp, kombi, extra = {}) {
  const context = await browserTyp.newContext({
    viewport: { width: kombi.breite.width, height: kombi.breite.height },
    deviceScaleFactor: 1,
    isMobile: kombi.breite.telefon,
    hasTouch: kombi.breite.telefon,
    locale: 'de-CH',
    timezoneId: ZEITZONE,
    colorScheme: kombi.thema,
    ignoreHTTPSErrors: LOKAL_TLS,
    ...extra,
  })
  await context.addInitScript(
    ({ schluessel, thema }) => {
      try {
        if (thema === 'dark') localStorage.setItem(schluessel, 'dark')
      } catch {
        /* blockierter Speicher ist hier kein Prüfgegenstand */
      }
    },
    { schluessel: THEMA_SCHLUESSEL, thema: kombi.thema },
  )
  if (BYPASS) {
    await context.route(
      (url) => url.origin === APP.origin,
      (route) => route.continue({ headers: { ...route.request().headers(), 'x-vercel-protection-bypass': BYPASS, 'x-vercel-set-bypass-cookie': 'samesitenone' } }),
    )
  }
  return context
}

function beobachte(seite, sammlung) {
  seite.on('response', (antwort) => {
    const status = antwort.status()
    if (status >= 500) {
      sammlung.fuenf.push({ status, url: ohneGeheimnis(antwort.url()), anfrage: antwort.headers()['x-vercel-id'] ?? null })
    }
  })
  seite.on('pageerror', (fehler) => sammlung.seitenfehler.push(String(fehler.message).slice(0, 200)))
}

async function oeffnen(seite, pfad, sammlung) {
  const ziel = new URL(pfad, APP)
  if (SHARE && !sammlung.geteilt) {
    ziel.searchParams.set('_vercel_share', SHARE)
    sammlung.geteilt = true
  }
  const antwort = await seite.goto(ziel.href, { waitUntil: 'domcontentloaded', timeout: 60_000 })
  await seite.waitForLoadState('networkidle', { timeout: 30_000 }).catch(() => {})
  return {
    status: antwort?.status() ?? 0,
    anfrage: antwort?.headers()['x-vercel-id'] ?? null,
    endgueltig: ohneGeheimnis(seite.url()),
    pfad: new URL(seite.url()).pathname,
  }
}

async function sichtbarerText(seite) {
  return (await seite.locator('body').innerText().catch(() => '')) ?? ''
}

function fehlermarken(text) {
  return FEHLERMARKEN.filter((muster) => muster.test(text)).map((muster) => String(muster))
}

async function lauf(browserName, browserTyp, kombi) {
  const name = `${browserName}-${kombi.breite.name}-${kombi.thema}`
  const context = await kontext(browserTyp, kombi)
  const seite = await context.newPage()
  const sammlung = { fuenf: [], seitenfehler: [], geteilt: false }
  const anfragenOhneLesen = []
  seite.on('request', (anfrage) => {
    const pfad = new URL(anfrage.url()).pathname
    if (anfrage.method() !== 'GET' && anfrage.method() !== 'HEAD' && new URL(anfrage.url()).origin === APP.origin && /^\/(api\/trips|reisen)/.test(pfad)) {
      anfragenOhneLesen.push({ methode: anfrage.method(), pfad })
    }
  })
  beobachte(seite, sammlung)

  const seiteAnsehen = async (schritt, pfad, erwartung) => {
    const antwort = await oeffnen(seite, pfad, sammlung)
    const text = await sichtbarerText(seite)
    await seite.screenshot({ path: join(AUS, `${name}-${schritt}.png`) })
    return { antwort, text, marken: fehlermarken(text), ...erwartung }
  }

  const startseite = await seiteAnsehen('start', '/')
  pruefe(name, 'Startseite: kein 5xx, keine Fehlermarke im sichtbaren Text', startseite.antwort.status < 500 && startseite.marken.length === 0, { status: startseite.antwort.status, anfrage: startseite.antwort.anfrage, marken: startseite.marken })

  const karte = seite.locator('a[href*="2657928"]').first()
  const href = (await karte.count()) > 0 ? await karte.getAttribute('href') : null
  pruefe(name, 'Startseite führt einen Zermatt-Link mit zielId=geonames%3A2657928', Boolean(href) && new URL(href, APP).searchParams.get('zielId') === ZERMATT, href)

  if (href) {
    await karte.scrollIntoViewIfNeeded()
    await karte.click()
    await seite.waitForURL(/\/planen/, { timeout: 30_000 }).catch(() => {})
    await seite.waitForLoadState('networkidle', { timeout: 30_000 }).catch(() => {})
  }
  const nachKlick = new URL(seite.url())
  const klickText = await sichtbarerText(seite)
  const klickWerte = await seite.locator('main input').evaluateAll((elemente) => elemente.map((element) => element.value).filter(Boolean)).catch(() => [])
  await seite.screenshot({ path: join(AUS, `${name}-start-zu-planen.png`) })
  pruefe(name, 'Klick auf Zermatt: Planung mit zielId=geonames:2657928, keine Reise angelegt', nachKlick.pathname === '/planen' && nachKlick.searchParams.get('zielId') === ZERMATT, { pfad: nachKlick.pathname, zielId: nachKlick.searchParams.get('zielId') })
  pruefe(name, 'Klick auf Zermatt: Planung zeigt Zermatt im Zielfeld (nicht Zofingen), keine Fehlermarke', nachKlick.pathname === '/planen' && klickWerte.some((wert) => /Zermatt/.test(wert)) && !/Zofingen/.test(klickText + klickWerte.join(' ')) && fehlermarken(klickText).length === 0, { pfad: nachKlick.pathname, werte: klickWerte, marken: fehlermarken(klickText) })

  const direkt = await seiteAnsehen('planen-zermatt', `/planen?zielId=${encodeURIComponent(ZERMATT)}`)
  const direktWerte = await seite.locator('main input').evaluateAll((elemente) => elemente.map((element) => element.value).filter(Boolean)).catch(() => [])
  pruefe(name, '/planen?zielId=geonames%3A2657928: Status < 500, Zermatt im Zielfeld, keine Fehlermarke', direkt.antwort.status < 500 && direktWerte.some((wert) => /Zermatt/.test(wert)) && direkt.marken.length === 0, { status: direkt.antwort.status, anfrage: direkt.antwort.anfrage, werte: direktWerte, marken: direkt.marken })

  if (browserName === chromium.name() && kombi.breite.name === '1440' && kombi.thema === 'light') {
    const kontrolle = await seiteAnsehen('planen-zofingen-kontrolle', `/planen?zielId=${encodeURIComponent(ZOFINGEN)}`)
    const kontrollWerte = await seite.locator('main input').evaluateAll((elemente) => elemente.map((element) => element.value).filter(Boolean)).catch(() => [])
    pruefe(name, 'Kontrolle: geonames:2657915 ist Zofingen, nicht Zermatt (echte Ortsquelle antwortet)', kontrollWerte.some((wert) => /Zofingen/.test(wert)) && !kontrollWerte.some((wert) => /Zermatt/.test(wert)), { status: kontrolle.antwort.status, werte: kontrollWerte })
  }

  const reisen = await seiteAnsehen('reisen', '/reisen')
  pruefe(name, '/reisen (Gast): Status < 500, keine Fehlermarke, Inhalt sichtbar', reisen.antwort.status < 500 && reisen.marken.length === 0 && reisen.text.trim().length > 40, { status: reisen.antwort.status, anfrage: reisen.antwort.anfrage, endgueltig: reisen.antwort.endgueltig, marken: reisen.marken })

  for (const pfad of GESCHUETZT) {
    const konto = await seiteAnsehen(`konto-${pfad.replaceAll('/', '_')}`, pfad)
    pruefe(name, `${pfad}: bleibt geschützt (Weiterleitung zur Anmeldung), kein 5xx, keine Fehlermarke`, konto.antwort.pfad === '/login' && konto.antwort.status < 500 && konto.marken.length === 0, { status: konto.antwort.status, anfrage: konto.antwort.anfrage, endgueltig: konto.antwort.endgueltig, marken: konto.marken })
  }

  const speicher = await seite.evaluate(() => {
    try { return Object.keys(localStorage).filter((schluessel) => /trip|reise/i.test(schluessel) && (localStorage.getItem(schluessel) ?? '').length > 2) } catch { return [] }
  })
  pruefe(name, 'Kein Reiseentwurf angelegt (kein Schreibzugriff auf Reisen, kein lokaler Entwurf)', anfragenOhneLesen.length === 0 && speicher.length === 0, { anfragen: anfragenOhneLesen, speicher })
  pruefe(name, 'Kein HTTP-5xx und kein Seitenfehler in der ganzen Sitzung', sammlung.fuenf.length === 0 && sammlung.seitenfehler.length === 0, sammlung)
  await context.close()
}

async function videoLauf() {
  mkdirSync(VIDEO_VERZEICHNIS, { recursive: true })
  const groesse = { width: 1280, height: 800 }
  const browser = await chromium.launch({ headless: true, args: ['--no-sandbox', '--disable-dev-shm-usage'] })
  const kombi = { breite: { name: '1280', width: groesse.width, height: groesse.height, telefon: false }, thema: 'light' }
  const context = await kontext(browser, kombi, { recordVideo: { dir: VIDEO_VERZEICHNIS, size: groesse } })
  await context.addInitScript(() => {
    const zeiger = document.createElement('div')
    zeiger.style.cssText = 'position:fixed;z-index:2147483647;width:18px;height:18px;border-radius:50%;background:rgba(255,80,0,.75);border:2px solid #fff;box-shadow:0 0 0 1px #000;pointer-events:none;transform:translate(-50%,-50%);left:-50px;top:-50px'
    const anhaengen = () => { if (!zeiger.isConnected) document.documentElement.appendChild(zeiger) }
    window.addEventListener('DOMContentLoaded', anhaengen)
    window.addEventListener('mousemove', (e) => { anhaengen(); zeiger.style.left = `${e.clientX}px`; zeiger.style.top = `${e.clientY}px` }, true)
  })
  const seite = await context.newPage()
  const sammlung = { fuenf: [], seitenfehler: [], geteilt: false }
  const warte = (ms) => seite.waitForTimeout(ms)
  await oeffnen(seite, '/', sammlung)
  await warte(1500)
  const karte = seite.locator('a[href*="2657928"]').first()
  if ((await karte.count()) > 0) {
    await karte.scrollIntoViewIfNeeded()
    await warte(1000)
    const box = await karte.boundingBox()
    if (box) await seite.mouse.move(box.x + box.width / 2, box.y + box.height / 2, { steps: 25 })
    await warte(600)
    await karte.click()
    await seite.waitForURL(/\/planen/, { timeout: 30_000 }).catch(() => {})
    await seite.waitForLoadState('networkidle', { timeout: 30_000 }).catch(() => {})
  }
  await warte(2500)
  await oeffnen(seite, '/reisen', sammlung)
  await warte(2500)
  await oeffnen(seite, '/account', sammlung)
  await warte(2500)
  const video = seite.video()
  await context.close()
  await browser.close()
  return video ? await video.path() : null
}

const browserTypen = { chromium, webkit }
for (const browserName of BROWSER_NAMEN) {
  const browserTyp = browserTypen[browserName]
  if (!browserTyp) throw new Error(`Unbekannter Browser: ${browserName}`)
  const browser = await browserTyp.launch({ headless: true, args: browserName === 'chromium' ? ['--no-sandbox', '--disable-dev-shm-usage'] : [] })
  try {
    for (const breite of BREITEN) {
      for (const thema of THEMEN) {
        await lauf(browserName, browser, { breite, thema })
      }
    }
  } finally {
    await browser.close()
  }
}

const video = VIDEO_VERZEICHNIS ? await videoLauf() : null
const ergebnis = {
  commit: COMMIT,
  herkunft: APP.origin,
  erzeugt: new Date().toISOString(),
  schutzschluessel: BYPASS || SHARE ? 'aus der Umgebung, nicht protokolliert' : 'nicht verwendet',
  video,
  protokoll,
}
writeFileSync(join(AUS, 'preview-abnahme.json'), JSON.stringify(ergebnis, null, 2))
console.log(`Fertig: ${protokoll.length - fehlgeschlagen}/${protokoll.length} bestanden`)
process.exit(fehlgeschlagen === 0 ? 0 : 1)
