#!/usr/bin/env node
// scripts/premium-redesign-a/zermatt-uebergabe.mjs
//
// Dev-Nachweis der Zermatt-Übergabe in die Planung (PR A, PO-Korrektur 27.11.2026): Die Reiseidee Zermatt
// übergibt die GeoNames-Kennung 2657928 (Zermatt), nicht 2657915 (Zofingen). Läuft gegen einen echten lokalen
// Production-Build, dessen Supabase-Adresse auf den Loopback-Fixture zeigt (NEXT_PUBLIC_SUPABASE_URL wird beim
// Build eingebettet). Der Fixture beantwortet die unveränderte serverseitige Ortsbestätigung der Planung aus
// `lib/places/fixtures/geonames.tsv` über den kanonischen Importer. Keine Datenbank, keine Anmeldung, kein
// Produktionszugriff, keine Schreibzugriffe.
//
//   NEXT_PUBLIC_SUPABASE_URL=http://127.0.0.1:3464 NEXT_PUBLIC_SUPABASE_ANON_KEY=lokal-synthetisch \
//     NEXT_PUBLIC_APP_URL=http://127.0.0.1:3463 npx next build
//   npx next start -p 3463 -H 127.0.0.1 &
//   node --import tsx scripts/premium-redesign-a/zermatt-uebergabe.mjs --app http://127.0.0.1:3463 \
//     --fixture-port 3464 --out /tmp/pra/shots/zermatt --commit <sha>
//
// Geprüft wird nur, was ein lokaler Lauf belegen kann: der statische Katalog (Gate des CMS aus). Veröffentlichte,
// fehlende, leere und nicht erreichbare CMS-Stände, Deduplizierung und die alte CMS-Nutzlast prüfen die
// Unit-Tests (`lib/inspiration/cms-public.test.ts`). Ob die Production-Tabelle `places` die Kennung 2657928 führt,
// ist von hier nicht prüfbar (OFFEN, siehe ADR-0250).

import { createServer } from 'node:http'
import { createRequire } from 'node:module'
import { mkdirSync, readFileSync, writeFileSync } from 'node:fs'
import { join } from 'node:path'
import { chromium } from 'playwright'

const require = createRequire(import.meta.url)
require('tsx/cjs')
const { geoNamesTsvZeile, laenderAusCountryInfo, orteAusGeoNames } = require('../../lib/places/importieren.ts')

function argument(name, standard) {
  const index = process.argv.indexOf(`--${name}`)
  return index >= 0 && process.argv[index + 1] ? process.argv[index + 1] : standard
}

const APP = argument('app', 'http://127.0.0.1:3463')
const FIXTURE_PORT = Number(argument('fixture-port', '3464'))
const AUS = argument('out', '/tmp/pra/shots/zermatt')
const COMMIT = argument('commit', 'unbekannt')
mkdirSync(AUS, { recursive: true })

const { orte } = orteAusGeoNames({
  zeilen: readFileSync('lib/places/fixtures/geonames.tsv', 'utf8').split(/\r?\n/).map(geoNamesTsvZeile).filter(Boolean),
  laender: laenderAusCountryInfo(readFileSync('lib/places/fixtures/countries.txt', 'utf8')),
})

const lesungen = []
const unerwartet = []
let ausfall = false
const fixture = createServer((anfrage, antwort) => {
  const url = new URL(anfrage.url, `http://127.0.0.1:${FIXTURE_PORT}`)
  if (anfrage.method !== 'GET' || url.pathname !== '/rest/v1/places') {
    unerwartet.push({ methode: anfrage.method, pfad: url.pathname })
    antwort.writeHead(503).end('{}')
    return
  }
  const filter = url.searchParams.get('id') ?? ''
  const ids = filter.startsWith('in.(')
    ? filter.slice(4, -1).split(',').map((id) => id.replace(/^"|"$/g, ''))
    : [filter.replace(/^eq\./, '')]
  lesungen.push({ ids, ausfall })
  if (ausfall) {
    antwort.writeHead(503, { 'Content-Type': 'application/json' }).end('{"message":"synthetisch nicht erreichbar"}')
    return
  }
  const zeilen = orte.filter((ort) => ids.includes(ort.id)).map((ort) => ({
    ...ort, source_id: ort.sourceId, country_code: ort.countryCode, feature_code: ort.featureCode,
  }))
  antwort.writeHead(200, { 'Content-Type': 'application/json' }).end(JSON.stringify(zeilen))
})

const protokoll = []
let fehlgeschlagen = 0
function pruefe(name, bestanden, tatsaechlich) {
  if (!bestanden) fehlgeschlagen += 1
  protokoll.push({ name, status: bestanden ? 'PASS' : 'FAIL', tatsaechlich })
  console.log(`${bestanden ? 'PASS' : 'FAIL'} ${name}${bestanden ? '' : ` -> ${JSON.stringify(tatsaechlich)}`}`)
}

async function planenSeite(browser, href) {
  const context = await browser.newContext({ viewport: { width: 390, height: 844 } })
  const seite = await context.newPage()
  const antwort = await seite.goto(new URL(href, APP).href)
  const html = await seite.content()
  const sichtbar = await seite.locator('main').innerText()
  await context.close()
  return { status: antwort?.status() ?? 0, html, sichtbar }
}

await new Promise((ok, fehler) => { fixture.once('error', fehler); fixture.listen(FIXTURE_PORT, '127.0.0.1', ok) })
const browser = await chromium.launch({ headless: true, args: ['--no-sandbox', '--disable-dev-shm-usage'] })
try {
  const fixtureOrte = Object.fromEntries(['geonames:2657915', 'geonames:2657928'].map((id) => [id, orte.find((ort) => ort.id === id)?.name ?? null]))
  pruefe('Fixture führt beide Orte getrennt: 2657915 Zofingen, 2657928 Zermatt', fixtureOrte['geonames:2657915'] === 'Zofingen' && fixtureOrte['geonames:2657928'] === 'Zermatt', fixtureOrte)

  for (const pfad of ['/', '/entdecken']) {
    const context = await browser.newContext({ viewport: { width: 390, height: 844 } })
    const seite = await context.newPage()
    await seite.goto(new URL(pfad, APP).href)
    const links = await seite.locator('a[href^="/planen?"]').evaluateAll((elemente) => elemente.map((element) => element.getAttribute('href')))
    const zermatt = links.filter((href) => /Zermatt|2657928|2657915/.test(decodeURIComponent(href ?? '')))
    pruefe(`${pfad}: Zermatt-Übergabe nutzt zielId=geonames%3A2657928`, zermatt.length > 0 && zermatt.every((href) => new URL(href, APP).searchParams.get('zielId') === 'geonames:2657928'), zermatt)
    pruefe(`${pfad}: kein Planungs-Link nennt die Kennung 2657915`, !links.some((href) => /2657915/.test(href ?? '')), links.filter((href) => /2657915/.test(href ?? '')))
    await context.close()
  }

  const startseite = await (async () => {
    const context = await browser.newContext({ viewport: { width: 390, height: 844 } })
    const seite = await context.newPage()
    await seite.goto(new URL('/', APP).href)
    const href = await seite.locator('a[href*="2657928"]').first().getAttribute('href')
    await context.close()
    return href
  })()
  pruefe('Startseite führt einen Zermatt-Link mit der korrigierten Kennung', Boolean(startseite), startseite)

  const gelesenVorher = lesungen.length
  const zermattSeite = await planenSeite(browser, startseite ?? '/planen?zielId=geonames%3A2657928')
  const gelesen = lesungen.slice(gelesenVorher)
  pruefe('Planung: Zermatt-Übergabe bestätigt 2657928 am Fixture', gelesen.some((eintrag) => eintrag.ids.includes('geonames:2657928') && !eintrag.ausfall), gelesen)
  pruefe('Planung: Seite zeigt Zermatt, nicht Zofingen', zermattSeite.status === 200 && /Zermatt/.test(zermattSeite.html) && !/Zofingen/.test(zermattSeite.html), { status: zermattSeite.status })
  pruefe('Planung: der Zielwert der Seite trägt geonames:2657928', zermattSeite.html.includes('geonames:2657928') && !zermattSeite.html.includes('geonames:2657915'), null)
  writeFileSync(join(AUS, 'planen-zermatt.txt'), zermattSeite.sichtbar)

  const manuell = await (async () => {
    const context = await browser.newContext({ viewport: { width: 390, height: 844 } })
    const seite = await context.newPage()
    await seite.goto(new URL('/planen?zielId=geonames%3A2657928', APP).href)
    await seite.waitForLoadState('networkidle')
    const werte = await seite.locator('main input').evaluateAll((elemente) => elemente.map((element) => element.value).filter(Boolean))
    await seite.screenshot({ path: join(AUS, 'planen-zermatt-zielfeld-390.png') })
    await context.close()
    return werte
  })()
  pruefe('Planung ohne Idee: das Zielfeld ist mit Zermatt vorbelegt, nicht mit Zofingen', manuell.some((wert) => /Zermatt/.test(wert)) && !manuell.some((wert) => /Zofingen/.test(wert)), manuell)

  const kontrolle = await planenSeite(browser, '/planen?zielId=geonames%3A2657915')
  pruefe('Kontrolle: die alte Kennung 2657915 ist Zofingen (so fiel der Fehler auf)', /Zofingen/.test(kontrolle.html) && !/Zermatt/.test(kontrolle.html), { status: kontrolle.status })

  ausfall = true
  const gestoert = await planenSeite(browser, '/planen?zielId=geonames%3A2657928')
  ausfall = false
  pruefe('Ausfall der Ortsquelle: kein geratener Ort, die Seite nennt weder Zermatt noch Zofingen als bestätigtes Ziel', !gestoert.html.includes('geonames:2657928') && !gestoert.html.includes('geonames:2657915'), { status: gestoert.status })

  pruefe('Fixture sah nur erwartete Anfragen', unerwartet.length === 0, unerwartet)
} finally {
  await browser.close()
  await new Promise((ok) => fixture.close(ok))
}

writeFileSync(join(AUS, 'zermatt-uebergabe.json'), JSON.stringify({ commit: COMMIT, app: APP, erzeugt: new Date().toISOString(), lesungen, protokoll }, null, 2))
console.log(`Fertig: ${protokoll.length - fehlgeschlagen}/${protokoll.length} bestanden`)
process.exit(fehlgeschlagen === 0 ? 0 : 1)
