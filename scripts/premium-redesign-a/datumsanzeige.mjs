#!/usr/bin/env node
// scripts/premium-redesign-a/datumsanzeige.mjs
//
// Datumsanzeige im echten Browser (Work-Endtest 27.11.2026: «19. Dez..», doppelter Punkt).
//
// Läuft gegen einen lokalen Next-Production-Build mit den synthetischen Gastreisen `zermatt`
// (Zürich → Zermatt, Ankunft 2026-12-19, ohne Bahnfahrt: die Reiseprüfung nennt die offenen
// Abschnitte samt Datum) und `zermatt-bahn` (mit Bahnfahrt und Mietwagen) aus `fixtures.ts`.
// Keine Anmeldung, kein Produktionszugriff, keine Kundendaten. Für Vorher und Nachher ist der
// Treiber derselbe; nur der ausgelieferte Code unterscheidet sich.
//
//   node scripts/premium-redesign-a/datumsanzeige.mjs \
//     --base http://127.0.0.1:3495 --base-webkit https://127.0.0.1:3496 --label vorher \
//     --commit <sha> --out /tmp/pra/datum --fixtures /tmp/pra/fixtures-datum \
//     [--combos chromium-390-light,webkit-1440-dark] [--schrift 100,200]
//
// Je Kombination (Browser x Breite x Thema x Schrift) und Reise werden alle Ansichten besucht
// (Übersicht, «Reise prüfen», «Reise ändern», Reiseplan, Verbindungsdetail, jeder Unterbereich von
// «Organisieren», Vorbereitung, Einreise, «Meine Reisen») und je Ansicht gemessen. Geprüft wird:
//   zeilen     «Zermatt»: die Befundzeilen der Reiseprüfung lauten genau «Zürich → Zermatt · 19. Dez.»
//              und «Zermatt → Zürich · 26. Dez.» (je in Flug- und Verbindungsplanung)
//   text       kein doppelter Punkt («..», nicht «...») im sichtbaren Text irgendeiner Ansicht
//   name       kein doppelter Punkt in Attributen (aria-label, title, alt, placeholder) und im
//              Zugänglichkeitsbaum (ariaSnapshot; in Chromium zusätzlich das CDP-Accessibility-Protokoll);
//              die Befundzeile steht im Zugänglichkeitsbaum mit genau einem Punkt
//   ueberlauf  kein waagerechter Überlauf der Seite und der Befundzeilen
// Jede Messung steht als PASS oder FAIL im Protokoll; eine nicht ausgeführte Messung ist kein PASS.
// Ausgang 1, sobald eine Messung FAIL ist.
//
// `--monate 1` ersetzt die Matrix durch den Monatsdurchlauf: dieselbe Reise «Zermatt» mit dem
// Ankunftstag 19. und dem Rückreisetag 26. in jedem der zwölf Monate, Chromium und WebKit, 390 px,
// hell. Erwartet wird die Zeile, die der Browser selbst für diesen Tag schreibt (eigene ICU-Daten,
// nicht aus dem Produktcode), mit genau einem Punkt am Ende: «19. Dez.» bleibt «19. Dez.»,
// «19. März» wird «19. März.», nirgends «..».

import { mkdirSync, readFileSync, writeFileSync } from 'node:fs'
import { join } from 'node:path'
import { chromium, webkit } from 'playwright'

function argument(name, standard) {
  const index = process.argv.indexOf(`--${name}`)
  return index >= 0 && process.argv[index + 1] ? process.argv[index + 1] : standard
}

const BASIS = argument('base', 'http://127.0.0.1:3495')
const BASIS_WEBKIT = argument('base-webkit', BASIS)
const ETIKETT = argument('label', 'vorher')
const COMMIT = argument('commit', 'unbekannt')
const AUS = argument('out', '/tmp/pra/datum')
const FIXTURES = argument('fixtures', '/tmp/pra/fixtures-datum')
const NUR_KOMBIS = argument('combos', '')
const MONATSDURCHLAUF = argument('monate', '') === '1'
const SCHRIFTEN = argument('schrift', '100,200').split(',').map(Number)
const THEMA_SCHLUESSEL = 'jetnity:workspace-theme:v1'
const ZEITZONE = 'Europe/Zurich'
const DOPPELPUNKT = /(?<!\.)\.\.(?!\.)/
const ERWARTETE_ZEILEN = {
  'Flugplanung': ['Zürich → Zermatt · 19. Dez.', 'Zermatt → Zürich · 26. Dez.'],
  'Verbindungsplanung': ['Zürich → Zermatt · 19. Dez.', 'Zermatt → Zürich · 26. Dez.'],
}

const REISEN = {
  zermatt: JSON.parse(readFileSync(join(FIXTURES, 'zermatt.json'), 'utf8')),
  'zermatt-bahn': JSON.parse(readFileSync(join(FIXTURES, 'zermatt-bahn.json'), 'utf8')),
}
const BROWSER = { chromium, webkit }
const BREITEN = [
  { name: '390', width: 390, height: 844, telefon: true },
  { name: '1440', width: 1440, height: 900, telefon: false },
  { name: '320', width: 320, height: 640, telefon: true },
]

const KOMBINATIONEN = []
for (const browser of ['chromium', 'webkit']) {
  for (const breite of BREITEN) {
    for (const thema of ['light', 'dark']) {
      for (const schrift of SCHRIFTEN) {
        if (schrift !== 100 && breite.name !== '320') continue
        KOMBINATIONEN.push({ browser, breite, thema, schrift })
      }
    }
  }
}

const kombiName = ({ browser, breite, thema, schrift }) => `${browser}-${breite.name}-${thema}${schrift === 100 ? '' : `-s${schrift}`}`

async function tabOeffnen(seite, name) {
  const muster = new RegExp(`^\\s*${name}`)
  const knoepfe = seite.locator('.workspace-bottom-nav button, [data-workspace-mode-nav="sidebar"] button, .workspace-sidebar button').filter({ hasText: muster })
  for (const knopf of await knoepfe.all()) {
    if (await knopf.isVisible()) {
      await knopf.click()
      await seite.waitForTimeout(800)
      await seite.evaluate(() => window.scrollTo({ top: 0, behavior: 'instant' }))
      return true
    }
  }
  return false
}

function seitenmessung() {
  const pfad = (element) => {
    const teile = []
    for (let knoten = element; knoten && knoten.nodeType === 1 && teile.length < 4; knoten = knoten.parentElement) {
      const bezeichnung = knoten.getAttribute('aria-label')
      teile.unshift(`${knoten.tagName.toLowerCase()}${bezeichnung ? `[aria-label="${bezeichnung}"]` : ''}`)
    }
    return teile.join(' > ')
  }
  const text = document.body.innerText
  const attribute = []
  for (const element of document.querySelectorAll('[aria-label],[title],[alt],[placeholder],[aria-description],[aria-roledescription]')) {
    for (const name of ['aria-label', 'title', 'alt', 'placeholder', 'aria-description', 'aria-roledescription']) {
      const wert = element.getAttribute(name)
      if (wert) attribute.push({ name, wert, pfad: pfad(element) })
    }
  }
  const bereiche = {}
  for (const bereich of document.querySelectorAll('section[aria-label="Flugplanung"], section[aria-label="Verbindungsplanung"]')) {
    const name = bereich.getAttribute('aria-label')
    const zeilen = [...bereich.querySelectorAll('li p:nth-of-type(2)')]
      .map((p) => p.innerText.replace(/\s+/g, ' ').trim())
      .filter((zeile) => /→/.test(zeile))
    const ueberlaeufe = [...bereich.querySelectorAll('li p')].map((p) => p.scrollWidth - p.clientWidth)
    bereiche[name] = {
      zeilen,
      ueberlaufMax: ueberlaeufe.length ? Math.max(...ueberlaeufe) : 0,
      rechtsMax: Math.max(0, ...[...bereich.querySelectorAll('li')].map((li) => Math.round(li.getBoundingClientRect().right))),
    }
  }
  const treffer = []
  for (const fund of text.matchAll(/(?<!\.)\.\.(?!\.)/g)) {
    treffer.push(text.slice(Math.max(0, fund.index - 40), fund.index + 20).replace(/\s+/g, ' '))
  }
  return {
    breite: window.innerWidth,
    ueberlaufSeite: document.documentElement.scrollWidth - document.documentElement.clientWidth,
    doppelpunktImText: treffer,
    attribute,
    bereiche,
    zeichen: text.length,
  }
}

async function zugaenglichkeit(seite, browserName) {
  const ergebnis = { ariaSnapshot: null, cdp: [] }
  try {
    const bereich = seite.locator('section[aria-label="Verbindungsplanung"]').first()
    if ((await bereich.count()) > 0) ergebnis.ariaSnapshot = await bereich.ariaSnapshot()
  } catch (fehler) {
    ergebnis.ariaSnapshot = `OFFEN: ${String(fehler).slice(0, 160)}`
  }
  if (browserName === 'chromium') {
    try {
      const sitzung = await seite.context().newCDPSession(seite)
      await sitzung.send('Accessibility.enable')
      const { nodes } = await sitzung.send('Accessibility.getFullAXTree')
      for (const knoten of nodes) {
        const name = String(knoten.name?.value ?? '')
        if (/Dez\./.test(name) || DOPPELPUNKT.test(name)) ergebnis.cdp.push({ rolle: knoten.role?.value, name })
      }
      await sitzung.detach()
    } catch (fehler) {
      ergebnis.cdp = [`OFFEN: ${String(fehler).slice(0, 160)}`]
    }
  }
  return ergebnis
}

async function reiseBesuchen(browserInstanz, kombi, reiseName, ordner) {
  const { browser, breite, thema, schrift } = kombi
  const reise = REISEN[reiseName]
  const basis = browser === 'webkit' ? BASIS_WEBKIT : BASIS
  const context = await browserInstanz.newContext({
    viewport: { width: breite.width, height: breite.height },
    deviceScaleFactor: 1,
    isMobile: breite.telefon,
    hasTouch: breite.telefon,
    locale: 'de-CH',
    timezoneId: ZEITZONE,
    ignoreHTTPSErrors: true,
  })
  await context.addInitScript(({ schluessel, wert, themaSchluessel, thema: wunsch }) => {
    try {
      localStorage.setItem(schluessel, wert)
      if (wunsch === 'dark') localStorage.setItem(themaSchluessel, 'dark')
    } catch {
      /* blockierter Speicher wird hier nicht geprüft */
    }
  }, { schluessel: reise.schluessel, wert: reise.roh, themaSchluessel: THEMA_SCHLUESSEL, thema })
  if (schrift !== 100) {
    await context.addInitScript((prozent) => {
      const setzen = () => {
        const stil = document.createElement('style')
        stil.textContent = `html { font-size: ${prozent}% !important; }`
        document.head.append(stil)
      }
      if (document.head) setzen()
      else document.addEventListener('DOMContentLoaded', setzen, { once: true })
    }, schrift)
  }
  const seite = await context.newPage()
  const seitenfehler = []
  seite.on('pageerror', (fehler) => seitenfehler.push(String(fehler).slice(0, 200)))
  const ergebnis = { kombination: kombiName(kombi), reise: reiseName, browser, breite: breite.name, thema, schrift, ansichten: {}, hinweise: [], seitenfehler }
  const messen = async (name) => {
    await seite.waitForTimeout(500)
    ergebnis.ansichten[name] = await seite.evaluate(seitenmessung)
  }
  const versuchen = async (name, aktion) => {
    try {
      await aktion()
    } catch (fehler) {
      ergebnis.ansichten[name] = { offen: `OFFEN: ${String(fehler).slice(0, 160)}` }
    }
  }
  try {
    await seite.goto(`${basis}/reisen/${reise.id}`, { waitUntil: 'domcontentloaded' })
    await seite.waitForSelector('h1', { timeout: 30_000 })
    await seite.waitForTimeout(1200)

    await versuchen('uebersicht', async () => {
      await tabOeffnen(seite, 'Übersicht')
      await messen('uebersicht')
    })
    await versuchen('reise-aendern', async () => {
      await seite.getByRole('button', { name: /^Reise ändern/ }).first().click()
      await seite.waitForTimeout(600)
      await messen('reise-aendern')
      await seite.keyboard.press('Escape')
    })
    await versuchen('reise-pruefen', async () => {
      await seite.goto(`${basis}/reisen/${reise.id}`, { waitUntil: 'domcontentloaded' })
      await seite.waitForSelector('h1', { timeout: 30_000 })
      await seite.waitForTimeout(800)
      await seite.locator('[aria-label="Reise prüfen"] button').first().click()
      await seite.waitForSelector('section[aria-label="Verbindungsplanung"]', { timeout: 10_000 })
      await messen('reise-pruefen')
      const bereich = seite.locator('section[aria-label="Verbindungsplanung"]').first()
      await bereich.scrollIntoViewIfNeeded()
      await seite.waitForTimeout(300)
      ergebnis.zugaenglichkeit = await zugaenglichkeit(seite, browser)
      if (reiseName === 'zermatt') {
        const datei = `befund__${kombiName(kombi)}.png`
        await bereich.screenshot({ path: join(ordner, datei) })
        ergebnis.bild = datei
      }
    })
    await versuchen('reiseplan', async () => {
      await seite.goto(`${basis}/reisen/${reise.id}`, { waitUntil: 'domcontentloaded' })
      await seite.waitForSelector('h1', { timeout: 30_000 })
      await tabOeffnen(seite, 'Reiseplan')
      await messen('reiseplan')
      const verbindung = seite.getByRole('button', { name: /^Verbindung ·/ }).first()
      if (await verbindung.count()) {
        await verbindung.click()
        await seite.waitForTimeout(900)
        await messen('reiseplan-verbindung')
      }
    })
    await versuchen('organisieren', async () => {
      await seite.goto(`${basis}/reisen/${reise.id}`, { waitUntil: 'domcontentloaded' })
      await seite.waitForSelector('h1', { timeout: 30_000 })
      await tabOeffnen(seite, 'Organisieren')
      for (const unterbereich of ['Flüge', 'Unterkunft', 'Aktivitäten', 'Mietwagen', 'Verbindungen']) {
        const reiter = seite.getByRole('tab', { name: new RegExp(`^${unterbereich}`) }).first()
        if (await reiter.count()) {
          await reiter.click().catch(() => undefined)
          await seite.waitForTimeout(500)
          await messen(`organisieren-${unterbereich.toLowerCase().replace('ü', 'ue').replace('ä', 'ae')}`)
        }
      }
    })
    for (const tab of ['Vorbereitung', 'Einreise']) {
      await versuchen(tab.toLowerCase(), async () => {
        await tabOeffnen(seite, tab)
        await messen(tab.toLowerCase())
      })
    }
    await versuchen('meine-reisen', async () => {
      await seite.goto(`${basis}/reisen`, { waitUntil: 'domcontentloaded' })
      await seite.waitForTimeout(2200)
      await messen('meine-reisen')
    })
  } catch (fehler) {
    ergebnis.hinweise.push(`Fehler: ${String(fehler).slice(0, 240)}`)
  }
  await context.close()
  return urteilen(ergebnis)
}

const ERWARTETE_ANSICHTEN = ['uebersicht', 'reise-aendern', 'reise-pruefen', 'reiseplan', 'organisieren-fluege', 'organisieren-unterkunft', 'organisieren-aktivitaeten', 'organisieren-mietwagen', 'organisieren-verbindungen', 'vorbereitung', 'einreise', 'meine-reisen']

function urteilen(ergebnis) {
  const ansichten = Object.entries(ergebnis.ansichten)
  const urteil = {}
  const gemessen = ansichten.filter(([, m]) => typeof m.zeichen === 'number')
  const fehlend = ERWARTETE_ANSICHTEN.filter((name) => typeof ergebnis.ansichten[name]?.zeichen !== 'number')

  if (ergebnis.reise === 'zermatt') {
    const pruefung = ergebnis.ansichten['reise-pruefen']
    const abweichungen = []
    for (const [bereich, erwartet] of Object.entries(ERWARTETE_ZEILEN)) {
      const gefunden = pruefung?.bereiche?.[bereich]?.zeilen ?? []
      if (JSON.stringify(gefunden) !== JSON.stringify(erwartet)) abweichungen.push({ bereich, erwartet, gefunden })
    }
    urteil.zeilen = pruefung && typeof pruefung.zeichen === 'number' && abweichungen.length === 0
      ? { ergebnis: 'PASS', zeilen: pruefung.bereiche }
      : { ergebnis: 'FAIL', abweichungen, grund: pruefung?.offen ?? null }
  }

  const textTreffer = gemessen.flatMap(([name, m]) => m.doppelpunktImText.map((ausschnitt) => ({ ansicht: name, ausschnitt })))
  urteil.text = fehlend.length > 0
    ? { ergebnis: 'FAIL', grund: `Nicht gemessen (kein PASS): ${fehlend.join(', ')}`, treffer: textTreffer }
    : textTreffer.length === 0 ? { ergebnis: 'PASS', ansichten: gemessen.length } : { ergebnis: 'FAIL', treffer: textTreffer }

  const attributTreffer = gemessen.flatMap(([name, m]) => m.attribute.filter((a) => DOPPELPUNKT.test(a.wert)).map((a) => ({ ansicht: name, ...a })))
  const baum = ergebnis.zugaenglichkeit
  const baumGelesen = Boolean(baum?.ariaSnapshot && !String(baum.ariaSnapshot).startsWith('OFFEN'))
  const baumTreffer = []
  if (baumGelesen && DOPPELPUNKT.test(baum.ariaSnapshot)) baumTreffer.push({ quelle: 'ariaSnapshot', text: baum.ariaSnapshot.split('\n').find((z) => DOPPELPUNKT.test(z)) })
  for (const knoten of baum?.cdp ?? []) {
    if (typeof knoten === 'object' && DOPPELPUNKT.test(knoten.name)) baumTreffer.push({ quelle: 'cdp', ...knoten })
  }
  const zeilenImBaum = baumGelesen ? baum.ariaSnapshot.split('\n').filter((z) => /· (19|26)\. Dez\.?/.test(z)) : []
  const baumOk = baumGelesen && attributTreffer.length === 0 && baumTreffer.length === 0
    && (ergebnis.reise !== 'zermatt' || (zeilenImBaum.length === 2 && zeilenImBaum.every((z) => /Dez\.\s*$/.test(z) && !DOPPELPUNKT.test(z))))
  urteil.name = !baumGelesen
    ? { ergebnis: 'FAIL', grund: 'Zugänglichkeitsbaum nicht gelesen (kein PASS).' }
    : baumOk
      ? { ergebnis: 'PASS', zeilenImBaum, cdp: baum.cdp }
      : { ergebnis: 'FAIL', attribute: attributTreffer, baum: baumTreffer, zeilenImBaum }

  const breiteFehler = gemessen.filter(([, m]) => m.ueberlaufSeite > 1).map(([name, m]) => ({ ansicht: name, ueberlauf: m.ueberlaufSeite }))
  const zeilenFehler = []
  for (const [name, m] of gemessen) {
    for (const [bereich, werte] of Object.entries(m.bereiche ?? {})) {
      if (werte.ueberlaufMax > 1 || werte.rechtsMax > m.breite) zeilenFehler.push({ ansicht: name, bereich, ueberlauf: werte.ueberlaufMax, rechts: werte.rechtsMax })
    }
  }
  urteil.ueberlauf = fehlend.length > 0
    ? { ergebnis: 'FAIL', grund: `Nicht gemessen (kein PASS): ${fehlend.join(', ')}` }
    : breiteFehler.length === 0 && zeilenFehler.length === 0 ? { ergebnis: 'PASS' } : { ergebnis: 'FAIL', seite: breiteFehler, zeilen: zeilenFehler }

  ergebnis.urteil = urteil
  ergebnis.gesamt = Object.values(urteil).every((u) => u.ergebnis === 'PASS') && ergebnis.hinweise.length === 0 && ergebnis.seitenfehler.length === 0 ? 'PASS' : 'FAIL'
  return ergebnis
}

async function monatsdurchlauf() {
  const ordner = join(AUS, ETIKETT)
  mkdirSync(ordner, { recursive: true })
  const reise = REISEN.zermatt
  const ergebnisse = []
  for (const browserName of ['chromium', 'webkit']) {
    const instanz = await BROWSER[browserName].launch()
    const basis = browserName === 'webkit' ? BASIS_WEBKIT : BASIS
    for (let monat = 1; monat <= 12; monat += 1) {
      const nn = String(monat).padStart(2, '0')
      const roh = reise.roh.replaceAll('2026-12-', `2026-${nn}-`)
      const context = await instanz.newContext({ viewport: { width: 390, height: 844 }, isMobile: true, hasTouch: true, locale: 'de-CH', timezoneId: ZEITZONE, ignoreHTTPSErrors: true })
      await context.addInitScript(({ schluessel, wert }) => {
        try { localStorage.setItem(schluessel, wert) } catch { /* nicht geprüft */ }
      }, { schluessel: reise.schluessel, wert: roh })
      const seite = await context.newPage()
      const eintrag = { browser: browserName, monat }
      try {
        await seite.goto(`${basis}/reisen/${reise.id}`, { waitUntil: 'domcontentloaded' })
        await seite.waitForSelector('h1', { timeout: 30_000 })
        await seite.waitForTimeout(900)
        await seite.locator('[aria-label="Reise prüfen"] button').first().click()
        await seite.waitForSelector('section[aria-label="Verbindungsplanung"]', { timeout: 10_000 })
        await seite.waitForTimeout(400)
        const messung = await seite.evaluate(({ monat: m }) => {
          const etikett = (tag) => new Intl.DateTimeFormat('de-CH', { day: 'numeric', month: 'short', timeZone: 'UTC' }).format(new Date(Date.UTC(2026, m - 1, tag)))
          const mitPunkt = (text) => (/[.!?…]$/.test(text) ? text : `${text}.`)
          const zeilen = {}
          for (const bereich of document.querySelectorAll('section[aria-label="Flugplanung"], section[aria-label="Verbindungsplanung"]')) {
            zeilen[bereich.getAttribute('aria-label')] = [...bereich.querySelectorAll('li p:nth-of-type(2)')].map((p) => p.innerText.replace(/\s+/g, ' ').trim()).filter((z) => /→/.test(z))
          }
          const text = document.body.innerText
          return {
            erwartet: [`Zürich → Zermatt · ${mitPunkt(etikett(19))}`, `Zermatt → Zürich · ${mitPunkt(etikett(26))}`],
            etikett19: etikett(19),
            zeilen,
            doppelpunkt: [...text.matchAll(/(?<!\.)\.\.(?!\.)/g)].map((f) => text.slice(Math.max(0, f.index - 30), f.index + 10).replace(/\s+/g, ' ')),
          }
        }, { monat })
        const baum = await seite.locator('section[aria-label="Verbindungsplanung"]').first().ariaSnapshot()
        eintrag.messung = messung
        eintrag.baumZeilen = baum.split('\n').filter((z) => /→/.test(z)).map((z) => z.replace(/^\s*- paragraph: /, ''))
        const gleich = (a, b) => JSON.stringify(a) === JSON.stringify(b)
        eintrag.ergebnis = ['Flugplanung', 'Verbindungsplanung'].every((b) => gleich(messung.zeilen[b], messung.erwartet))
          && gleich(eintrag.baumZeilen, messung.erwartet) && messung.doppelpunkt.length === 0 ? 'PASS' : 'FAIL'
      } catch (fehler) {
        eintrag.ergebnis = 'FAIL'
        eintrag.fehler = String(fehler).slice(0, 200)
      }
      await context.close()
      ergebnisse.push(eintrag)
      console.log(`${eintrag.ergebnis} ${browserName} Monat ${nn} | Etikett «${eintrag.messung?.etikett19 ?? '?'}» | ${eintrag.messung?.zeilen?.Verbindungsplanung?.join(' / ') ?? eintrag.fehler}`)
    }
    await instanz.close()
  }
  const pass = ergebnisse.filter((e) => e.ergebnis === 'PASS').length
  writeFileSync(join(ordner, 'monatsdurchlauf.json'), JSON.stringify({ etikett: ETIKETT, commit: COMMIT, erzeugt: new Date().toISOString(), pass, fail: ergebnisse.length - pass, ergebnisse }, null, 2))
  console.log(`${ETIKETT} (${COMMIT}) Monatsdurchlauf: ${pass} PASS, ${ergebnisse.length - pass} FAIL von ${ergebnisse.length} -> ${join(ordner, 'monatsdurchlauf.json')}`)
  process.exit(pass === ergebnisse.length ? 0 : 1)
}

async function main() {
  if (MONATSDURCHLAUF) return monatsdurchlauf()
  const ordner = join(AUS, ETIKETT)
  mkdirSync(ordner, { recursive: true })
  const auswahl = NUR_KOMBIS ? KOMBINATIONEN.filter((k) => NUR_KOMBIS.split(',').includes(kombiName(k))) : KOMBINATIONEN
  const alle = []
  const browserInstanzen = {}
  try {
    for (const kombi of auswahl) {
      browserInstanzen[kombi.browser] ??= await BROWSER[kombi.browser].launch()
      for (const reiseName of Object.keys(REISEN)) {
        const ergebnis = await reiseBesuchen(browserInstanzen[kombi.browser], kombi, reiseName, ordner)
        alle.push(ergebnis)
        const u = ergebnis.urteil
        const zeile = u.zeilen ? `zeilen ${u.zeilen.ergebnis} | ` : ''
        const beispiel = ergebnis.ansichten['reise-pruefen']?.bereiche?.Verbindungsplanung?.zeilen?.[0] ?? ''
        console.log(`${ergebnis.gesamt} ${ergebnis.kombination} ${ergebnis.reise} | ${zeile}text ${u.text.ergebnis} | name ${u.name.ergebnis} | ueberlauf ${u.ueberlauf.ergebnis}${beispiel ? ` | «${beispiel}»` : ''}`)
      }
    }
  } finally {
    for (const instanz of Object.values(browserInstanzen)) await instanz.close()
  }
  const bericht = {
    etikett: ETIKETT,
    commit: COMMIT,
    basis: BASIS,
    erwarteteZeilen: ERWARTETE_ZEILEN,
    erzeugt: new Date().toISOString(),
    messungen: alle.length,
    pass: alle.filter((e) => e.gesamt === 'PASS').length,
    fail: alle.filter((e) => e.gesamt === 'FAIL').length,
    ergebnisse: alle,
  }
  writeFileSync(join(ordner, 'datumsanzeige.json'), JSON.stringify(bericht, null, 2))
  console.log(`${ETIKETT} (${COMMIT}): ${bericht.pass} PASS, ${bericht.fail} FAIL von ${bericht.messungen} Messungen -> ${join(ordner, 'datumsanzeige.json')}`)
  process.exit(bericht.fail === 0 ? 0 : 1)
}

main().catch((fehler) => {
  console.error(fehler)
  process.exit(2)
})
