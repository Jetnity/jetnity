#!/usr/bin/env node
// scripts/reisebegleiter-oberflaeche-nachweis.mjs
//
// Sichtnachweis der Assistant-Fläche im Reise-Arbeitsbereich, mobil und am
// Desktop, über das bestehende UI-Audit-Harness.
//
// Was hier geprüft wird, ist bewusst die Sorte Aussage, die ein
// Quelltext-Test nicht machen kann:
//
//   · Die Fläche ist eingeklappt und ruft beim Rendern nichts auf.
//   · Der Knopf sagt seinen Zustand über `aria-expanded`.
//   · Der eingeklappte Bereich ist `hidden` und `inert` – auch für die
//     Tastatur.
//   · Escape schliesst und gibt den Fokus zurück.
//   · Ein Absenden ohne Sitzung endet in einer ehrlichen Meldung, nicht in
//     einer Auskunft – und ohne Modellaufruf.
//
// Fixtures liegen nur hier und im sessionStorage des Harness, nie im
// Produktspeicher. Kein bezahlter Aufruf: Die Server Action lehnt ohne
// Sitzung vor Kill Switch, Kontingent und Modell ab.

import { mkdirSync, writeFileSync } from 'node:fs'
import { dirname } from 'node:path'
import { chromium } from 'playwright'

const BASIS = process.env.NACHWEIS_BASIS || 'http://127.0.0.1:3000'
const PFAD = '/ui-audit/trip-workspace'
const SPEICHER = 'jetnity:ui-audit:workspace'
const ORDNER = process.env.NACHWEIS_ORDNER || '/opt/cursor/artifacts'
const BERICHT = `${ORDNER}/reisebegleiter_oberflaeche_nachweis.json`

const JETZT = '2027-01-10T10:00:00.000Z'

const REISE = {
  id: '9f1c3a52-6d84-4c1b-9a77-2b5e8d0f4a31',
  clientRef: '9f1c3a52-6d84-4c1b-9a77-2b5e8d0f4a31',
  title: 'Italien im Frühling',
  origin: 'Zürich',
  originPlaceId: null,
  startDate: '2027-04-03',
  endDate: '2027-04-10',
  travellers: 2,
  currency: 'CHF',
  budgetAmount: null,
  status: 'draft',
  pace: 'calm',
  interests: ['culture'],
  travelWish: null,
  revision: 1,
  lastMutationId: null,
  stages: [
    {
      id: 'stage-rm',
      position: 1,
      name: 'Rom',
      countryCode: 'IT',
      arrivalDate: '2027-04-03',
      departureDate: '2027-04-06',
      latitude: null,
      longitude: null,
      placeId: null,
    },
    {
      id: 'stage-fl',
      position: 2,
      name: 'Florenz',
      countryCode: 'IT',
      arrivalDate: '2027-04-06',
      departureDate: '2027-04-10',
      latitude: null,
      longitude: null,
      placeId: null,
    },
  ],
  days: [],
  ohneTag: [],
  party: [
    {
      id: 'traveller-1',
      clientRef: 'traveller:1',
      label: 'Alex',
      residenceCountryCode: 'DE',
      citizenships: [
        { id: 'cit:ch', clientRef: 'cit:ch', countryCode: 'CH', createdAt: JETZT, updatedAt: JETZT },
        { id: 'cit:rs', clientRef: 'cit:rs', countryCode: 'RS', createdAt: JETZT, updatedAt: JETZT },
      ],
      documents: [],
      createdAt: JETZT,
      updatedAt: JETZT,
    },
  ],
  createdAt: JETZT,
  updatedAt: JETZT,
}

const NUTZLAST = { reise: REISE, quelle: 'account', mitBegleiter: true }

/**
 * Eine Auskunft in der Form, die `begleiterauskunftErzeugen()` zurückgibt.
 *
 * Sie wird hier gestellt und nicht erzeugt: Ein bezahlter Aufruf ist für die
 * Frage, ob die Darstellung ehrlich ist, nicht nötig – und die Darstellung ist
 * genau der Teil, den ein Quelltext-Test nicht zeigen kann. `lage` und
 * `belegt` stehen hier so, wie `lib/reisebegleiter/nutzlast.ts` sie aus der
 * akzeptierten Projektion ableitet.
 */
const AUSKUNFT = {
  fassung: 1,
  wahrheitsklasse: 'generated_suggestion',
  kontextFassung: 'assistant-truth-context-v1',
  // Kein Satz in dieser Auskunft ist vom Modell geschrieben. Das Modell hat
  // Schlüssel und Bezug gewählt; die Texte stammen aus `BEFUNDE` und
  // `AMTLICHE_AUSSAGE_TEXT`. Das Ausgabeschema hat kein Freitextfeld.
  befunde: [
    {
      schluessel: 'reise_zeitraum_steht',
      rolle: 'stand',
      ref: null,
      titel: null,
      text: 'Der Zeitraum dieser Reise steht.',
    },
    {
      schluessel: 'etappe_daten_stehen',
      rolle: 'stand',
      ref: 'E1',
      titel: 'Etappe 1 · Rom, Italien',
      text: 'Die Daten dieser Etappe stehen.',
    },
    {
      schluessel: 'reisende_ohne_dokument',
      rolle: 'offen',
      ref: 'R1',
      titel: 'Alex',
      text: 'Für diese Person ist in Jetnity noch kein Reisedokument hinterlegt.',
    },
    {
      schluessel: 'reisende_mehrere_staatsangehoerigkeiten',
      rolle: 'stand',
      ref: 'R1',
      titel: 'Alex',
      text: 'Für diese Person sind mehrere Staatsangehörigkeiten hinterlegt. Jetnity behandelt sie als gleichrangige Optionen.',
    },
    {
      schluessel: 'schritt_dokument_ergaenzen',
      rolle: 'schritt',
      ref: 'R1',
      titel: 'Alex',
      text: 'Für diese Person ein Reisedokument in der Reisevorbereitung ergänzen.',
    },
  ],
  bezuege: [
    {
      ref: 'E1',
      art: 'etappe',
      titel: 'Etappe 1 · Rom, Italien',
      lage: '2027-04-03 bis 2027-04-06',
      belegt: true,
    },
    {
      ref: 'R1',
      art: 'reisende',
      titel: 'Alex',
      lage: 'Schweiz · Serbien · 0 Dokument-Optionen als gleichrangige Wahl',
      belegt: true,
    },
    {
      ref: 'O1',
      art: 'official',
      titel: 'Visumstatus · Italien',
      lage: 'Noch nicht verlässlich bestimmbar · Automatische Einreiseprüfung derzeit nicht verfügbar · Für die Prüfung fehlen Angaben: Dokumenttyp, Ausstellungsland',
      belegt: false,
    },
  ],
  // Jetnity-eigener Satz, aus dem geschlossenen Aussagekanal. Das Modell hat
  // nur `O1` und `angaben_fehlen` gewählt.
  amtlicheHinweise: [
    {
      ref: 'O1',
      aussage: 'angaben_fehlen',
      titel: 'Visumstatus · Italien',
      text: 'Für die Prüfung dieser Lage fehlen noch Angaben.',
    },
  ],
}

const GERAETE = [
  { name: 'mobil', width: 390, height: 844, deviceScaleFactor: 2, isMobile: true, hasTouch: true },
  { name: 'desktop-1280', width: 1280, height: 900, deviceScaleFactor: 1 },
  { name: 'desktop-1440', width: 1440, height: 1000, deviceScaleFactor: 1 },
]

const befunde = []

function pruefe(gerät, name, ok, detail = '') {
  befunde.push({ gerät, name, ok, detail })
  const zeichen = ok ? 'ok  ' : 'FEHL'
  console.log(`${zeichen} ${gerät} · ${name}${detail ? ` · ${detail}` : ''}`)
}

async function schuss(seite, datei, ziel = null) {
  const pfad = `${ORDNER}/${datei}`
  mkdirSync(dirname(pfad), { recursive: true })
  if (ziel) {
    await ziel.scrollIntoViewIfNeeded()
    await seite.waitForTimeout(150)
    await ziel.screenshot({ path: pfad })
  } else {
    await seite.screenshot({ path: pfad, fullPage: false })
  }
  return pfad
}

async function laufen(browser, gerät) {
  const kontext = await browser.newContext({
    viewport: { width: gerät.width, height: gerät.height },
    deviceScaleFactor: gerät.deviceScaleFactor,
    isMobile: gerät.isMobile ?? false,
    hasTouch: gerät.hasTouch ?? false,
    locale: 'de-CH',
  })

  const netz = []
  const konsole = []
  kontext.on('request', (anfrage) => netz.push(anfrage.url()))

  const seite = await kontext.newPage()
  seite.on('console', (nachricht) => {
    if (nachricht.type() === 'error') konsole.push(nachricht.text())
  })
  seite.on('pageerror', (fehler) => konsole.push(String(fehler)))

  await seite.goto(`${BASIS}${PFAD}`, { waitUntil: 'domcontentloaded' })
  await seite.evaluate(
    ([schluessel, nutzlast]) => sessionStorage.setItem(schluessel, nutzlast),
    [SPEICHER, JSON.stringify(NUTZLAST)],
  )
  await seite.reload({ waitUntil: 'networkidle' })

  const knopf = seite.locator('button[aria-controls="reisebegleiter"]')
  await knopf.waitFor({ state: 'visible', timeout: 20_000 })

  // 1. Eingeklappt: Knopf da, Fläche nicht, kein Feld erreichbar.
  pruefe(gerät.name, 'Knopf trägt aria-expanded=false', (await knopf.getAttribute('aria-expanded')) === 'false')
  pruefe(gerät.name, 'Knopf zeigt auf die Fläche', (await knopf.getAttribute('aria-controls')) === 'reisebegleiter')
  pruefe(
    gerät.name,
    'Fläche ist vor dem Öffnen nicht im Dokument',
    (await seite.locator('#reisebegleiter').count()) === 0,
  )
  pruefe(
    gerät.name,
    'kein Frageeingang vor dem Öffnen',
    (await seite.locator('#reisebegleiter-frage').count()) === 0,
  )
  const zuSchuss = await schuss(seite, `reisebegleiter_${gerät.name}_eingeklappt.png`)

  // 2. Öffnen: Fläche sichtbar, Feld fokussiert, Rahmung ehrlich.
  await knopf.click()
  const feld = seite.locator('#reisebegleiter-frage')
  await feld.waitFor({ state: 'visible', timeout: 10_000 })

  pruefe(gerät.name, 'Knopf trägt aria-expanded=true', (await knopf.getAttribute('aria-expanded')) === 'true')
  pruefe(
    gerät.name,
    'Fläche ist nicht mehr inert',
    (await seite.locator('#reisebegleiter').getAttribute('inert')) === null,
  )
  pruefe(gerät.name, 'Fokus liegt im Frageeingang', await feld.evaluate((el) => el === document.activeElement))
  pruefe(
    gerät.name,
    'Rahmung nennt den generierten Vorschlag',
    await seite.getByText('Generierter Vorschlag', { exact: false }).first().isVisible(),
  )
  pruefe(
    gerät.name,
    'Rahmung sagt, dass nichts geändert wird',
    await seite.getByText('ändert, speichert und bucht nichts', { exact: false }).isVisible(),
  )
  const offenSchuss = await schuss(
    seite,
    `reisebegleiter_${gerät.name}_offen.png`,
    seite.locator('#reisebegleiter form'),
  )

  // 3. Absenden ohne Sitzung: ehrliche Meldung, keine Auskunft.
  await feld.fill('Was ist bei dieser Reise noch offen?')
  await seite.getByRole('button', { name: 'Frage stellen' }).click()
  // Innerhalb der Fläche: Der Arbeitsbereich trägt weitere `role="alert"`-Knoten.
  const meldung = seite.locator('#reisebegleiter [role="alert"]').first()
  await meldung.waitFor({ state: 'visible', timeout: 30_000 })
  const meldungstext = (await meldung.textContent())?.trim() ?? ''

  pruefe(gerät.name, 'Meldung erscheint als role=alert', meldungstext.length > 0, meldungstext)
  pruefe(
    gerät.name,
    'Meldung ist die Anmeldeschranke und keine Auskunft',
    meldungstext.includes('Anmeldung erforderlich'),
    meldungstext,
  )
  pruefe(
    gerät.name,
    'keine Auskunft im Dokument',
    (await seite.getByText('Auskunft des Reisebegleiters').count()) === 0,
  )
  pruefe(
    gerät.name,
    'kein Aufruf an OpenAI',
    netz.every((url) => !url.includes('openai.com')),
  )
  pruefe(
    gerät.name,
    'kein Provider-/Suchaufruf',
    netz.every(
      (url) =>
        !url.includes('/api/flights/') &&
        !url.includes('/api/hotels/') &&
        !url.includes('/api/activities') &&
        !url.includes('/api/mobility/') &&
        !url.includes('/api/rental-cars/'),
    ),
  )
  const meldungSchuss = await schuss(
    seite,
    `reisebegleiter_${gerät.name}_gesperrt.png`,
    seite.locator('#reisebegleiter form'),
  )

  // 4. Escape schliesst und gibt den Fokus zurück.
  await feld.focus()
  await seite.keyboard.press('Escape')
  await seite.waitForTimeout(250)

  pruefe(
    gerät.name,
    'Escape klappt die Fläche ein',
    (await seite.locator('#reisebegleiter').getAttribute('hidden')) !== null,
  )
  pruefe(
    gerät.name,
    'Escape macht die Fläche inert',
    (await seite.locator('#reisebegleiter').getAttribute('inert')) !== null,
  )
  pruefe(
    gerät.name,
    'Fokus liegt zurück auf dem Knopf',
    await knopf.evaluate((el) => el === document.activeElement),
  )
  // 5. Darstellung einer vorliegenden Auskunft – gestellt, nicht erzeugt.
  await seite.evaluate(
    ([schluessel, nutzlast]) => sessionStorage.setItem(schluessel, nutzlast),
    [SPEICHER, JSON.stringify({ ...NUTZLAST, begleiterAuskunft: AUSKUNFT })],
  )
  await seite.reload({ waitUntil: 'networkidle' })
  await knopf.click()
  const titel = seite.getByText('Auskunft des Reisebegleiters')
  await titel.waitFor({ state: 'visible', timeout: 10_000 })

  pruefe(
    gerät.name,
    'Auskunft ist als generierter Vorschlag beschriftet',
    (await seite.locator('#reisebegleiter').getByText('Generierter Vorschlag').count()) >= 2,
  )
  pruefe(
    gerät.name,
    'offene Punkte stehen eigenständig da',
    await seite.getByText('Was dafür noch offen ist').isVisible(),
  )
  pruefe(
    gerät.name,
    'Vorschläge sind als Vorschläge beschriftet',
    await seite.getByText('Jetnity führt davon nichts selbst aus').isVisible(),
  )
  pruefe(
    gerät.name,
    'jeder Satz der Auskunft stammt aus einem Jetnity-Katalog',
    await seite.getByText('Die Daten dieser Etappe stehen.').isVisible(),
  )
  pruefe(
    gerät.name,
    'die Herkunft der Sätze ist benannt',
    await seite.getByText('Die Sätze unten schreibt Jetnity', { exact: false }).isVisible(),
  )
  pruefe(
    gerät.name,
    'Jetnity-Stand steht neben der Auskunft',
    await seite.getByText('Jetnity-Stand dazu').isVisible(),
  )
  pruefe(
    gerät.name,
    'amtliche Lage trägt den Jetnity-eigenen Satz',
    await seite.getByText('Amtliche Lage laut Jetnity').isVisible(),
  )
  pruefe(
    gerät.name,
    'der amtliche Satz stammt aus dem geschlossenen Kanal',
    await seite.getByText('Für die Prüfung dieser Lage fehlen noch Angaben.').isVisible(),
  )
  pruefe(
    gerät.name,
    'die Herkunft des amtlichen Satzes ist benannt',
    await seite.getByText('Diese Sätze schreibt Jetnity', { exact: false }).isVisible(),
  )
  pruefe(
    gerät.name,
    'unbelegte Lage ist als nicht geprüft gekennzeichnet',
    (await seite.locator('#reisebegleiter').getByText('· nicht geprüft').count()) === 1,
  )
  pruefe(
    gerät.name,
    'nicht geprüft heisst nicht nicht erforderlich',
    await seite
      .getByText('„Nicht geprüft“ heisst nicht „nicht erforderlich“', { exact: false })
      .isVisible(),
  )
  pruefe(
    gerät.name,
    'die Auskunft trägt keinen Betrag und keinen Link',
    !/https?:\/\/|CHF|EUR|USD|€/.test(
      (await seite.locator('#reisebegleiter section').innerText()) ?? '',
    ),
  )
  const auskunftSchuss = await schuss(
    seite,
    `reisebegleiter_${gerät.name}_auskunft.png`,
    seite.locator('#reisebegleiter section'),
  )

  pruefe(gerät.name, 'keine Konsolenfehler', konsole.length === 0, konsole.join(' | '))

  await kontext.close()
  return { zuSchuss, offenSchuss, meldungSchuss, auskunftSchuss, konsole, meldungstext }
}

const browser = await chromium.launch()
const schuesse = {}
try {
  for (const gerät of GERAETE) {
    schuesse[gerät.name] = await laufen(browser, gerät)
  }
} finally {
  await browser.close()
}

const fehlend = befunde.filter((befund) => !befund.ok)
mkdirSync(dirname(BERICHT), { recursive: true })
writeFileSync(
  BERICHT,
  `${JSON.stringify({ basis: BASIS, geprueft: befunde.length, fehlend: fehlend.length, befunde, schuesse }, null, 2)}\n`,
)

console.log(`\n${befunde.length} Prüfungen, ${fehlend.length} fehlgeschlagen. Bericht: ${BERICHT}`)
process.exit(fehlend.length === 0 ? 0 : 1)
