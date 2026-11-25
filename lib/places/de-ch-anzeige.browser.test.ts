import assert from 'node:assert/strict'
import { createServer } from 'node:http'
import { mkdirSync, writeFileSync } from 'node:fs'
import { join } from 'node:path'
import { after, before, describe, test } from 'node:test'
import type { AddressInfo } from 'node:net'
import { createElement } from 'react'
import { renderToStaticMarkup } from 'react-dom/server'
import { chromium, type Browser } from 'playwright'

import { flughafenAlsOption } from '@/lib/airports/suche'
import { reiseOrte } from '@/lib/trips/reise-orte'
import { gespeicherteEtappeAnzeigen } from '@/lib/places/titel-name'
import VorschlagVorschau from '@/components/trips/VorschlagVorschau'
import type { Reisevorschlag } from '@/lib/reisevorschlag/schema'

const BREITEN = [320, 390, 1280] as const
const BELEGE = join(process.cwd(), 'docs/evidence/de-ch-ortsnamen-2026-11-25')
const ARTIFAKTE = '/opt/cursor/artifacts'

const etappen = [
  { name: 'Lisbon', countryCode: 'PT' },
  { name: 'Rome', countryCode: 'IT' },
  { name: 'Munich', countryCode: 'DE' },
  { name: 'Milan', countryCode: 'IT' },
  { name: 'Geneva', countryCode: 'CH' },
  { name: 'Prague', countryCode: 'CZ' },
  { name: 'Canary Islands', countryCode: 'ES' },
  { name: 'Ho Chi Minh City', countryCode: 'VN' },
  { name: 'Saint Petersburg', countryCode: 'RU' },
  { name: 'Vienna', countryCode: 'US' },
]

const liste = reiseOrte({
  origin: 'Vienna',
  stages: etappen.map((etappe, index) => ({ ...etappe, position: index + 1 })),
})
const flughafen = flughafenAlsOption({
  iata: 'VIE', icao: 'LOWW', name: 'Vienna International Airport', city: 'Vienna',
  country: 'Austria', country_code: 'AT',
})
const vorschlag = {
  titel: 'Ein Wochenende in Prague',
  abreiseort: 'Vienna',
  reisende: 2,
  waehrung: 'CHF',
  budgetziel: null,
  tempo: 'balanced',
  interessen: [],
  startdatum: null,
  annahmen: [],
  etappen: [
    { name: 'Prague', laendercode: 'CZ', vonTag: 1, bisTag: 2 },
    { name: 'Vienna', laendercode: null, vonTag: 3, bisTag: 3 },
  ],
  tage: [{
    nummer: 1,
    titel: 'Ankommen in Prague',
    punkte: [{ art: 'note', titel: 'Spaziergang in Prague', notiz: null, beginn: null }],
  }],
} as unknown as Reisevorschlag

const vorschau = renderToStaticMarkup(createElement(VorschlagVorschau, {
  vorschlag,
  laeuft: false,
  angemeldet: false,
  onUebernehmen: () => {},
  onAendern: () => {},
  onVerwerfen: () => {},
}))

const html = `<!doctype html>
<html lang="de-CH">
<head>
<meta charset="utf-8" />
<meta name="viewport" content="width=device-width, initial-scale=1" />
<title>de-CH Ortsnamen</title>
<style>
  :root { color-scheme: light; --grund: #f2f7f4; --karte: #fdfffd; --text: #1b2a26; --ruhig: #4a5f57; --kante: #d3e0d8; --aktion: #153a33; }
  html[data-theme="dark"] { color-scheme: dark; --grund: #10211c; --karte: #173028; --text: #f4f7f5; --ruhig: #c5d5ce; --kante: #2c4a40; --aktion: #d7efe4; }
  * { box-sizing: border-box; }
  body { margin: 0; background: var(--grund); color: var(--text); font: 16px/1.4 system-ui, sans-serif; }
  main { width: min(100%, 720px); margin: 0 auto; padding: 12px; display: grid; gap: 12px; }
  section, article { background: var(--karte); border: 1px solid var(--kante); border-radius: 16px; padding: 12px; min-width: 0; }
  h1, h2, p, li, button, label { overflow-wrap: anywhere; min-width: 0; }
  h1 { font-size: 1.4rem; margin: 0; }
  main > section > h2 { font-size: 0.8rem; letter-spacing: 0.08em; text-transform: uppercase; color: var(--ruhig); margin: 0 0 8px; }
  .ort { font-weight: 650; font-size: 1.05rem; }
  ul { margin: 0; padding: 0; list-style: none; display: grid; gap: 6px; }
  input, select { width: 100%; min-height: 44px; font: inherit; color: inherit; background: transparent; border: 1px solid var(--kante); border-radius: 12px; padding: 8px 10px; }
  [role="option"] { min-height: 44px; }
</style>
</head>
<body>
<main>
  <h1>Ortsnamen de-CH</h1>
  <section aria-label="Ortssuche">
    <h2>Ortssuche</h2>
    <label for="ort">Ziel</label>
    <input id="ort" role="combobox" aria-label="Wien, Stadt · Österreich" value="Wien" readonly />
    <ul role="listbox">
      <li role="option" class="ort" aria-label="Wien, Stadt · Österreich">Wien</li>
      <li role="option" class="ort" aria-label="Vienna, Stadt · United States">Vienna</li>
    </ul>
  </section>
  <section aria-label="Meine Reisen">
    <h2>Meine Reisen</h2>
    <article>
      <p>Unsere Romreise</p>
      <p class="ort" data-flaeche="reisen">${liste}</p>
    </article>
  </section>
  <section aria-label="Reiseplan">
    <h2>Reiseplan</h2>
    <ul>${etappen.map((etappe) => `<li class="ort">${gespeicherteEtappeAnzeigen(etappe)}</li>`).join('')}</ul>
  </section>
  <section aria-label="Unterkunft">
    <h2>Unterkunft</h2>
    <p class="ort">Unterkünfte in ${gespeicherteEtappeAnzeigen(etappen[0]!)}</p>
  </section>
  <section aria-label="Verbindungen">
    <h2>Verbindungen</h2>
    <label for="von">Von</label>
    <select id="von"><option>${gespeicherteEtappeAnzeigen(etappen[1]!)}</option><option>Vienna</option></select>
  </section>
  <section aria-label="Flugauswahl">
    <h2>Flugauswahl</h2>
    <p>${flughafen?.label ?? ''}</p>
    <p class="ort">${flughafen?.description ?? ''}</p>
    <p data-iata="VIE">Abfrage VIE, nicht der Stadtname</p>
  </section>
  <section aria-label="KI-Reisevorschau">
    <h2>KI-Reisevorschau</h2>
    ${vorschau}
  </section>
</main>
</body>
</html>`

describe('de-CH-Ortsnamen im Browser', () => {
  let browser: Browser
  let url = ''
  const server = createServer((_, antwort) => {
    antwort.writeHead(200, { 'content-type': 'text/html; charset=utf-8' })
    antwort.end(html)
  })

  before(async () => {
    mkdirSync(BELEGE, { recursive: true })
    mkdirSync(ARTIFAKTE, { recursive: true })
    await new Promise<void>((resolve) => server.listen(0, '127.0.0.1', resolve))
    url = `http://127.0.0.1:${(server.address() as AddressInfo).port}/`
    try {
      browser = await chromium.launch()
    } catch {
      browser = await chromium.launch({
        executablePath: '/usr/bin/google-chrome',
        args: ['--no-sandbox', '--disable-dev-shm-usage'],
      })
    }
  })

  after(async () => {
    await browser?.close()
    await new Promise<void>((resolve, reject) => server.close((fehler) => fehler ? reject(fehler) : resolve()))
  })

  for (const theme of ['light', 'dark'] as const) {
    for (const breite of BREITEN) {
      test(`${theme} ${breite}px zeigt die Namen und schneidet sie nicht ab`, async () => {
        const page = await browser.newPage({ viewport: { width: breite, height: 900 }, colorScheme: theme })
        await page.goto(url)
        await page.evaluate((modus) => document.documentElement.setAttribute('data-theme', modus), theme)
        const text = await page.locator('body').innerText()
        assert.match(text, /Wien/)
        assert.match(text, /Lissabon/)
        assert.match(text, /Rom/)
        assert.match(text, /München/)
        assert.match(text, /Mailand/)
        assert.match(text, /Genf/)
        assert.match(text, /Prag/)
        assert.match(text, /Kanarische Inseln/)
        assert.match(text, /Ho-Chi-Minh-Stadt/)
        assert.match(text, /Sankt Petersburg/)
        assert.match(text, /Unsere Romreise/)
        assert.match(text, /Ein Wochenende in Prague/)
        assert.match(text, /Ankommen in Prague/)
        assert.match(text, /Spaziergang in Prague/)
        assert.match(text, /Vienna International Airport · VIE/)
        const masse = await page.evaluate(() => {
          const wurzel = document.documentElement
          const namen = [...document.querySelectorAll('.ort')].map((knoten) => {
            const feld = knoten as HTMLElement
            return { text: feld.textContent ?? '', ueber: feld.scrollWidth - feld.clientWidth }
          })
          return { ueberlauf: wurzel.scrollWidth - wurzel.clientWidth, namen }
        })
        assert.ok(masse.ueberlauf <= 1, `Dokument überläuft um ${masse.ueberlauf}px`)
        for (const name of masse.namen) assert.ok(name.ueber <= 1, `${name.text} wird abgeschnitten`)
        const datei = `de-ch-${theme}-${breite}.png`
        const puffer = await page.screenshot({ fullPage: true })
        writeFileSync(join(BELEGE, datei), puffer)
        if (theme === 'light' && breite === 390) writeFileSync(join(ARTIFAKTE, datei), puffer)
        if (theme === 'dark' && breite === 1280) writeFileSync(join(ARTIFAKTE, datei), puffer)
        await page.close()
      })
    }
  }
})
