#!/usr/bin/env node
// scripts/premium-redesign-a/interaktion.mjs
//
// Bedienung und Zugänglichkeit der gemeinsamen Kopfzeile und des Reisekopfs (PR A):
// Menü öffnen/schliessen mit Fokusrückgabe, Darstellung wechseln und neu laden,
// «Reise ändern» und «Begleiter» öffnen/schliessen, Profilmenü, Konto-Navigation,
// Browser vor/zurück, Tastaturlauf, 320/430 px, vergrösserte Schrift, reduzierte
// Bewegung, Eingabefelder mit mindestens 16 px, keine Konsolen- oder Hydrationsfehler.
//
// Läuft gegen den lokalen Production-Build (Gastreise) und den Prüfstand mit einer
// Konto-Reise (`konto-harness.mjs`, dort gibt es den Reisebegleiter).
//
//   node scripts/premium-redesign-a/interaktion.mjs --base http://127.0.0.1:3462 \
//     --base-webkit https://127.0.0.1:3482 --konto http://127.0.0.1:3471 \
//     --fixtures /tmp/pra/fixtures --out /tmp/pra/shots/nachher --commit <sha>
//
// Jede Zeile des Protokolls hat Test, Erwartet, Tatsächlich, Status. Ein nicht
// ausführbarer Test steht als OFFEN, niemals als PASS.

import { mkdirSync, readFileSync, writeFileSync } from 'node:fs'
import { join } from 'node:path'
import { chromium, webkit } from 'playwright'

function argument(name, standard) {
  const index = process.argv.indexOf(`--${name}`)
  return index >= 0 && process.argv[index + 1] ? process.argv[index + 1] : standard
}

const BASIS = argument('base', 'http://127.0.0.1:3462')
const BASIS_WEBKIT = argument('base-webkit', BASIS)
const KONTO = argument('konto', 'http://127.0.0.1:3471')
const FIXTURES = argument('fixtures', '/tmp/pra/fixtures')
const AUS = argument('out', '/tmp/pra/shots/nachher')
const COMMIT = argument('commit', 'unbekannt')
const SCHLUESSEL = 'jetnity:workspace-theme:v1'
const REISE = JSON.parse(readFileSync(join(FIXTURES, 'thailand.json'), 'utf8'))
const JETZT = new Date('2026-12-03T10:00:00.000Z')

const protokoll = []
function zeile(browser, test, erwartet, tatsaechlich, status) {
  protokoll.push({ browser, test, erwartet, tatsaechlich, status })
  console.log(`${status.padEnd(5)} ${browser.padEnd(8)} ${test} | erwartet: ${erwartet} | tatsächlich: ${tatsaechlich}`)
}

async function pruefen(browser, test, erwartet, funktion) {
  try {
    const { ok, wert } = await funktion()
    zeile(browser, test, erwartet, wert, ok ? 'PASS' : 'FAIL')
  } catch (fehler) {
    zeile(browser, test, erwartet, `Ausnahme: ${String(fehler).slice(0, 200)}`, 'FAIL')
  }
}

async function kontext(browserTyp, optionen = {}) {
  const context = await browserTyp.newContext({
    viewport: { width: 390, height: 844 },
    isMobile: true,
    hasTouch: true,
    locale: 'de-CH',
    timezoneId: 'Europe/Zurich',
    ignoreHTTPSErrors: true,
    ...optionen.kontext,
  })
  if (optionen.mitReise !== false) {
    await context.addInitScript(({ schluessel, wert }) => {
      try {
        if (!sessionStorage.getItem('pra:init')) {
          localStorage.setItem(schluessel, wert)
          sessionStorage.setItem('pra:init', '1')
        }
      } catch { /* ignorieren */ }
    }, { schluessel: REISE.schluessel, wert: REISE.roh })
  }
  const meldungen = { fehler: [], hydration: [] }
  const seite = await context.newPage()
  seite.on('console', (nachricht) => {
    const text = nachricht.text()
    if (nachricht.type() === 'error') meldungen.fehler.push(text.slice(0, 200))
    if (/hydrat/i.test(text)) meldungen.hydration.push(text.slice(0, 200))
  })
  seite.on('pageerror', (fehler) => meldungen.fehler.push(String(fehler).slice(0, 200)))
  await seite.clock.setFixedTime(JETZT)
  return { context, seite, meldungen }
}

/** Umgebungsrauschen des lokalen http-Tests (CSP «upgrade-insecure-requests», abgebrochene Vorabrufe). */
const UMGEBUNG = /Failed to load resource: net::ERR_(SSL_PROTOCOL_ERROR|ABORTED|CONNECTION_REFUSED)/
const echt = (liste) => liste.filter((text) => !UMGEBUNG.test(text))
const fehlerText = (meldungen) => `${echt(meldungen.fehler).length} Fehler (${meldungen.fehler.length - echt(meldungen.fehler).length} Umgebungsrauschen ausgenommen), ${meldungen.hydration.length} Hydration ${echt(meldungen.fehler).slice(0, 1)}`

async function warten(seite, ms = 600) {
  await seite.waitForLoadState('networkidle', { timeout: 6_000 }).catch(() => undefined)
  await seite.waitForTimeout(ms)
}

async function ueberlauf(seite) {
  return seite.evaluate(() => document.documentElement.scrollWidth - document.documentElement.clientWidth)
}

async function ziele44(seite, selektor) {
  return seite.evaluate((auswahl) => {
    return [...document.querySelectorAll(auswahl)]
      .filter((element) => {
        const stil = getComputedStyle(element)
        const rahmen = element.getBoundingClientRect()
        return stil.visibility !== 'hidden' && stil.display !== 'none' && rahmen.width > 0 && rahmen.height > 0
      })
      .map((element) => {
        const rahmen = element.getBoundingClientRect()
        return { name: (element.getAttribute('aria-label') || element.textContent || '').trim().replace(/\s+/g, ' ').slice(0, 30), b: Math.round(rahmen.width), h: Math.round(rahmen.height) }
      })
      .filter((eintrag) => eintrag.b < 44 || eintrag.h < 44)
  }, selektor)
}

async function phone(browserName, browserTyp, basis) {
  const B = browserName
  const reiseUrl = `${basis}/reisen/${REISE.id}`

  /* ---- Menü: Reise (modale Schublade) ---- */
  {
    const name = 'Reise'
    const steuerung = 'button.kopf-menue'
    const schublade = '#workspace-navigation'
    const { context, seite, meldungen } = await kontext(browserTyp, { mitReise: true })
    await seite.goto(reiseUrl, { waitUntil: 'domcontentloaded' })
    await seite.waitForSelector(steuerung, { timeout: 20_000 })
    await warten(seite)
    await pruefen(B, `${name}: Menü-Knopf hat Namen «Menü», ≥ 44×44, keinen Rahmen und keinen sichtbaren Text`, '«Menü», 44×44, ohne Text, ohne Rahmen', async () => {
      const daten = await seite.locator(steuerung).first().evaluate((element) => {
        const rahmen = element.getBoundingClientRect()
        return { name: element.getAttribute('aria-label'), b: rahmen.width, h: rahmen.height, text: element.textContent.trim(), rand: getComputedStyle(element).borderTopWidth, expanded: element.getAttribute('aria-expanded'), controls: element.getAttribute('aria-controls') }
      })
      return { ok: daten.name === 'Menü' && daten.b >= 44 && daten.h >= 44 && daten.text === '' && daten.rand === '0px' && daten.expanded === 'false' && Boolean(daten.controls), wert: JSON.stringify(daten) }
    })
    await pruefen(B, `${name}: Menü öffnet, aria-expanded=true, Fokus im Menü`, 'offen, expanded=true, Fokus innerhalb', async () => {
      await seite.locator(steuerung).first().click()
      await seite.waitForTimeout(500)
      const daten = await seite.evaluate(({ auswahl, schubladeAuswahl }) => {
        const knopf = document.querySelector(auswahl)
        const box = document.querySelector(schubladeAuswahl)
        const sichtbar = box ? getComputedStyle(box).display !== 'none' && box.getBoundingClientRect().width > 0 : false
        return { expanded: knopf?.getAttribute('aria-expanded'), sichtbar, rolle: box?.getAttribute('role'), fokusInnen: Boolean(box && box.contains(document.activeElement)) }
      }, { auswahl: steuerung, schubladeAuswahl: schublade })
      return { ok: daten.expanded === 'true' && daten.sichtbar && daten.fokusInnen && daten.rolle === 'dialog', wert: JSON.stringify(daten) }
    })
    await pruefen(B, `${name}: Tabulator bleibt im offenen Menü`, 'Fokus verlässt das Menü nie', async () => {
      const aussen = []
      for (let i = 0; i < 24; i++) {
        await seite.keyboard.press('Tab')
        const innen = await seite.evaluate((auswahl) => document.querySelector(auswahl)?.contains(document.activeElement) ?? false, schublade)
        if (!innen) aussen.push(i)
      }
      return { ok: aussen.length === 0, wert: aussen.length ? `ausserhalb bei Schritt ${aussen.slice(0, 3)}` : '24 Schritte innerhalb' }
    })
    await pruefen(B, `${name}: Escape schliesst, Fokus kehrt zum Menü-Knopf zurück`, 'geschlossen, Fokus am Menü-Knopf', async () => {
      await seite.keyboard.press('Escape')
      await seite.waitForTimeout(500)
      const daten = await seite.evaluate((auswahl) => {
        const knopf = document.querySelector(auswahl)
        return { expanded: knopf?.getAttribute('aria-expanded'), fokusAmKnopf: document.activeElement === knopf }
      }, steuerung)
      return { ok: daten.expanded === 'false' && daten.fokusAmKnopf, wert: JSON.stringify(daten) }
    })
    await pruefen(B, `${name}: erneutes Öffnen und Schliessen mit dem Schliessen-Knopf`, 'schliesst, Fokus zurück', async () => {
      await seite.locator(steuerung).first().click()
      await seite.waitForTimeout(400)
      await seite.locator(`${schublade} button[aria-label*="schliessen"]`).first().click()
      await seite.waitForTimeout(400)
      const daten = await seite.evaluate((auswahl) => ({ expanded: document.querySelector(auswahl)?.getAttribute('aria-expanded'), fokusAmKnopf: document.activeElement === document.querySelector(auswahl) }), steuerung)
      return { ok: daten.expanded === 'false' && daten.fokusAmKnopf, wert: JSON.stringify(daten) }
    })
    await pruefen(B, `${name}: keine Konsolen- oder Hydrationsfehler`, '0 Fehler', async () => ({ ok: echt(meldungen.fehler).length === 0 && meldungen.hydration.length === 0, wert: fehlerText(meldungen) }))
    await context.close()
  }

  /* ---- Menü: Startseite (Aufklappbereich der öffentlichen Leiste) ---- */
  {
    const name = 'Startseite'
    const steuerung = 'button.kopf-menue'
    const { context, seite, meldungen } = await kontext(browserTyp, { mitReise: false })
    await seite.goto(`${basis}/`, { waitUntil: 'domcontentloaded' })
    await seite.waitForSelector(steuerung, { timeout: 20_000 })
    await warten(seite)
    await pruefen(B, `${name}: Menü-Knopf hat Namen «Menü», ≥ 44×44, keinen Rahmen und keinen sichtbaren Text`, '«Menü», 44×44, ohne Text, ohne Rahmen', async () => {
      const daten = await seite.locator(steuerung).first().evaluate((element) => {
        const rahmen = element.getBoundingClientRect()
        return { name: element.getAttribute('aria-label'), b: rahmen.width, h: rahmen.height, text: element.textContent.trim(), rand: getComputedStyle(element).borderTopWidth, expanded: element.getAttribute('aria-expanded'), controls: element.getAttribute('aria-controls') }
      })
      return { ok: daten.name === 'Menü' && daten.b >= 44 && daten.h >= 44 && daten.text === '' && daten.rand === '0px' && daten.expanded === 'false' && daten.controls === 'oeffentliche-mobile-navigation', wert: JSON.stringify(daten) }
    })
    await pruefen(B, `${name}: Menü öffnet (aria-expanded=true, Bereich sichtbar)`, 'offen', async () => {
      await seite.locator(steuerung).first().click()
      await seite.waitForTimeout(500)
      const daten = await seite.evaluate((auswahl) => {
        const knopf = document.querySelector(auswahl)
        const box = document.getElementById('oeffentliche-mobile-navigation')
        return { expanded: knopf?.getAttribute('aria-expanded'), sichtbar: Boolean(box && box.getBoundingClientRect().height > 0), eintraege: box ? box.querySelectorAll('a').length : 0 }
      }, steuerung)
      return { ok: daten.expanded === 'true' && daten.sichtbar && daten.eintraege > 0, wert: JSON.stringify(daten) }
    })
    await pruefen(B, `${name}: Escape schliesst, Fokus kehrt zum Menü-Knopf zurück`, 'geschlossen, Fokus am Menü-Knopf', async () => {
      await seite.keyboard.press('Escape')
      await seite.waitForTimeout(500)
      const daten = await seite.evaluate((auswahl) => ({ expanded: document.querySelector(auswahl)?.getAttribute('aria-expanded'), fokusAmKnopf: document.activeElement === document.querySelector(auswahl) }), steuerung)
      return { ok: daten.expanded === 'false' && daten.fokusAmKnopf, wert: JSON.stringify(daten) }
    })
    await pruefen(B, `${name}: Knopf schliesst den Bereich erneut`, 'geschlossen', async () => {
      await seite.locator(steuerung).first().click()
      await seite.waitForTimeout(400)
      await seite.locator(steuerung).first().click()
      await seite.waitForTimeout(400)
      const expanded = await seite.locator(steuerung).first().getAttribute('aria-expanded')
      return { ok: expanded === 'false', wert: `aria-expanded=${expanded}` }
    })
    await pruefen(B, `${name}: keine Konsolen- oder Hydrationsfehler`, '0 Fehler', async () => ({ ok: echt(meldungen.fehler).length === 0 && meldungen.hydration.length === 0, wert: fehlerText(meldungen) }))
    await context.close()
  }

  /* ---- Öffentliche Leiste ab md: Hauptnavigation statt Menü-Knopf ---- */
  for (const breite of [768, 1440]) {
    const { context, seite, meldungen } = await kontext(browserTyp, { mitReise: false, kontext: { viewport: { width: breite, height: 900 }, isMobile: false, hasTouch: false } })
    await seite.goto(`${basis}/`, { waitUntil: 'domcontentloaded' })
    await seite.waitForSelector('header', { timeout: 20_000 })
    await warten(seite)
    await pruefen(B, `Startseite ${breite} px: kein Menü-Knopf, Hauptnavigation sichtbar, keine doppelte Navigation`, 'Knopf unsichtbar, Hauptnavigation sichtbar', async () => {
      const daten = await seite.evaluate(() => {
        const knopf = document.querySelector('button.kopf-menue')
        const haupt = document.querySelector('nav[aria-label="Hauptnavigation"]')
        const mobil = document.getElementById('oeffentliche-mobile-navigation')
        const sichtbar = (element) => Boolean(element && getComputedStyle(element).display !== 'none' && element.getBoundingClientRect().width > 0)
        return { knopf: sichtbar(knopf), haupt: sichtbar(haupt), mobil: sichtbar(mobil) }
      })
      return { ok: !daten.knopf && daten.haupt && !daten.mobil, wert: JSON.stringify(daten) }
    })
    await pruefen(B, `Startseite ${breite} px: keine Konsolen- oder Hydrationsfehler`, '0 Fehler', async () => ({ ok: echt(meldungen.fehler).length === 0 && meldungen.hydration.length === 0, wert: fehlerText(meldungen) }))
    await context.close()
  }

  /* ---- Darstellung: wechseln, neu laden ---- */
  {
    const { context, seite, meldungen } = await kontext(browserTyp)
    await seite.goto(reiseUrl, { waitUntil: 'domcontentloaded' })
    await seite.waitForSelector('button.kopf-menue', { timeout: 20_000 })
    await warten(seite)
    const wahl = async (wert) => {
      await seite.locator('button.kopf-menue').first().click()
      await seite.waitForTimeout(450)
      await seite.locator('.workspace-darstellung-knopf', { hasText: wert }).first().click()
      await seite.waitForTimeout(450)
      if ((await seite.locator('button.kopf-menue').first().getAttribute('aria-expanded')) === 'true') {
        await seite.keyboard.press('Escape')
        await seite.waitForTimeout(400)
      }
    }
    await pruefen(B, 'Darstellung im Menü: genau «Hell» und «Dunkel», Auswahl über aria-pressed', 'zwei Knöpfe Hell/Dunkel', async () => {
      await seite.locator('button.kopf-menue').first().click()
      await seite.waitForTimeout(450)
      const namen = await seite.locator('.workspace-darstellung-knopf').allInnerTexts()
      const gedrueckt = await seite.locator('.workspace-darstellung-knopf').evaluateAll((knoepfe) => knoepfe.map((knopf) => knopf.getAttribute('aria-pressed')))
      await seite.keyboard.press('Escape')
      await seite.waitForTimeout(400)
      return { ok: namen.map((n) => n.trim()).join('|') === 'Hell|Dunkel' && gedrueckt.join('|') === 'true|false', wert: `${namen.map((n) => n.trim())} / ${gedrueckt}` }
    })
    await pruefen(B, 'Darstellung «Dunkel» setzt html-Attribut und Speicher', 'dark / dark', async () => {
      await wahl('Dunkel')
      const daten = await seite.evaluate((schluessel) => ({ html: document.documentElement.getAttribute('data-workspace-theme'), shell: document.querySelector('.workspace-shell')?.getAttribute('data-workspace-theme'), speicher: localStorage.getItem(schluessel) }), SCHLUESSEL)
      return { ok: daten.html === 'dark' && daten.shell === 'dark' && daten.speicher === 'dark', wert: JSON.stringify(daten) }
    })
    await pruefen(B, 'Dunkel bleibt nach Neuladen erhalten', 'dark nach Reload', async () => {
      await seite.reload({ waitUntil: 'domcontentloaded' })
      await seite.waitForSelector('button.kopf-menue', { timeout: 20_000 })
      await warten(seite)
      const daten = await seite.evaluate(() => ({ html: document.documentElement.getAttribute('data-workspace-theme'), shell: document.querySelector('.workspace-shell')?.getAttribute('data-workspace-theme') }))
      return { ok: daten.html === 'dark' && daten.shell === 'dark', wert: JSON.stringify(daten) }
    })
    await pruefen(B, 'Darstellung «Hell» entfernt das Attribut und bleibt nach Neuladen', 'hell nach Reload', async () => {
      await wahl('Hell')
      await seite.reload({ waitUntil: 'domcontentloaded' })
      await seite.waitForSelector('button.kopf-menue', { timeout: 20_000 })
      await warten(seite)
      const daten = await seite.evaluate((schluessel) => ({ html: document.documentElement.getAttribute('data-workspace-theme'), shell: document.querySelector('.workspace-shell')?.getAttribute('data-workspace-theme'), speicher: localStorage.getItem(schluessel) }), SCHLUESSEL)
      return { ok: daten.html === null && daten.shell === 'light' && daten.speicher === 'light', wert: JSON.stringify(daten) }
    })
    await pruefen(B, 'Darstellung: keine Konsolen- oder Hydrationsfehler', '0 Fehler', async () => ({ ok: echt(meldungen.fehler).length === 0 && meldungen.hydration.length === 0, wert: fehlerText(meldungen) }))
    await context.close()
  }

  /* ---- Reise ändern ---- */
  {
    const { context, seite, meldungen } = await kontext(browserTyp)
    await seite.goto(reiseUrl, { waitUntil: 'domcontentloaded' })
    await seite.waitForSelector('.reisekopf h1', { timeout: 20_000 })
    await warten(seite)
    const knopf = seite.locator('.reisekopf button', { hasText: 'Reise ändern' }).first()
    await pruefen(B, 'Reise ändern: beschriftete Aktion im Reisekopf, nicht in der Kopfzeile', 'im Kopf, nicht im Header', async () => {
      const imKopf = await knopf.count()
      const imHeader = await seite.locator('header button, header a', { hasText: 'Reise ändern' }).count()
      return { ok: imKopf === 1 && imHeader === 0, wert: `Kopf=${imKopf}, Header=${imHeader}` }
    })
    await pruefen(B, 'Reise ändern öffnet den Dialog (aria-expanded, Fokus drinnen)', 'Dialog offen', async () => {
      await knopf.click()
      await seite.waitForTimeout(600)
      const daten = await seite.evaluate(() => {
        const dialog = document.querySelector('[role="dialog"][aria-label="Reise ändern"], dialog[open]')
        return { dialog: Boolean(dialog), fokusInnen: Boolean(dialog && dialog.contains(document.activeElement)) }
      })
      return { ok: daten.dialog && daten.fokusInnen, wert: JSON.stringify(daten) }
    })
    await pruefen(B, 'Escape schliesst «Reise ändern», Fokus zurück auf die Aktion', 'zu, Fokus am Knopf', async () => {
      await seite.keyboard.press('Escape')
      await seite.waitForTimeout(600)
      const daten = await seite.evaluate(() => ({ dialog: Boolean(document.querySelector('[role="dialog"][aria-label="Reise ändern"], dialog[open]')), fokus: document.activeElement?.textContent?.trim().slice(0, 20) }))
      return { ok: !daten.dialog && /Reise ändern/.test(daten.fokus ?? ''), wert: JSON.stringify(daten) }
    })
    await pruefen(B, 'Reise ändern bricht bei 320 px nicht aus (Umbruch erlaubt)', 'kein Überlauf', async () => {
      await seite.setViewportSize({ width: 320, height: 640 })
      await seite.waitForTimeout(400)
      const wert = await ueberlauf(seite)
      return { ok: wert <= 0, wert: `Überlauf ${wert}px` }
    })
    await pruefen(B, 'Reise ändern: keine Konsolen- oder Hydrationsfehler', '0 Fehler', async () => ({ ok: echt(meldungen.fehler).length === 0 && meldungen.hydration.length === 0, wert: fehlerText(meldungen) }))
    await context.close()
  }

  /* ---- Begleiter (Konto-Reise im Prüfstand) ---- */
  {
    const { context, seite, meldungen } = await kontext(browserTyp, { mitReise: false })
    await seite.goto(`${KONTO}/reisen/konto`, { waitUntil: 'domcontentloaded' })
    await seite.waitForSelector('.kopf-begleiter', { timeout: 20_000 })
    await warten(seite)
    const knopf = seite.locator('button.kopf-begleiter').first()
    await pruefen(B, 'Begleiter: beschrifteter Knopf mit Compass-Symbol, ≥ 44 px, in der Kopfzeile', 'Text «Begleiter», Icon, 44 px', async () => {
      const daten = await knopf.evaluate((element) => ({ text: element.textContent.trim(), icon: Boolean(element.querySelector('svg')), h: element.getBoundingClientRect().height, imHeader: Boolean(element.closest('header')), controls: element.getAttribute('aria-controls') }))
      return { ok: daten.text === 'Begleiter' && daten.icon && daten.h >= 44 && daten.imHeader && daten.controls === 'reisebegleiter', wert: JSON.stringify(daten) }
    })
    await pruefen(B, 'Begleiter öffnet (aria-expanded=true, Fläche sichtbar)', 'offen', async () => {
      await knopf.click()
      await seite.waitForTimeout(700)
      const daten = await seite.evaluate(() => {
        const knopfElement = document.querySelector('button.kopf-begleiter')
        const flaeche = document.getElementById('reisebegleiter')
        return { expanded: knopfElement?.getAttribute('aria-expanded'), sichtbar: Boolean(flaeche && flaeche.getBoundingClientRect().height > 0), fokusInnen: Boolean(flaeche && flaeche.contains(document.activeElement)) }
      })
      return { ok: daten.expanded === 'true' && daten.sichtbar, wert: JSON.stringify(daten) }
    })
    await pruefen(B, 'Begleiter schliesst mit Escape, Fokus zurück am Knopf', 'zu, Fokus am Knopf', async () => {
      await seite.keyboard.press('Escape')
      await seite.waitForTimeout(700)
      const daten = await seite.evaluate(() => ({ expanded: document.querySelector('button.kopf-begleiter')?.getAttribute('aria-expanded'), fokusAmKnopf: document.activeElement === document.querySelector('button.kopf-begleiter') }))
      return { ok: daten.expanded === 'false' && daten.fokusAmKnopf, wert: JSON.stringify(daten) }
    })
    await pruefen(B, 'Speicherhinweis im Reisekopf der Konto-Reise: «Im Konto gespeichert»', 'sichtbarer Hinweis', async () => {
      const text = await seite.locator('.reisekopf-speicher').first().innerText()
      return { ok: /Im Konto gespeichert/.test(text), wert: text.trim() }
    })
    await pruefen(B, 'Begleiter: keine Konsolen- oder Hydrationsfehler', '0 Fehler', async () => ({ ok: echt(meldungen.fehler).length === 0 && meldungen.hydration.length === 0, wert: fehlerText(meldungen) }))
    await context.close()
  }

  /* ---- Profilmenü, Navigation, Vor/Zurück ---- */
  {
    const { context, seite, meldungen } = await kontext(browserTyp)
    await seite.goto(reiseUrl, { waitUntil: 'domcontentloaded' })
    await seite.waitForSelector('summary[aria-label="Kontomenü"]', { timeout: 20_000 })
    await warten(seite)
    await pruefen(B, 'Profil: ruhiges Symbol rechts, ≥ 44×44, ohne grossen Rahmen', '44×44, rechts, kein Rahmen', async () => {
      const daten = await seite.locator('summary[aria-label="Kontomenü"]').first().evaluate((element) => {
        const rahmen = element.getBoundingClientRect()
        return { b: rahmen.width, h: rahmen.height, rechts: rahmen.right > innerWidth - 24, rand: getComputedStyle(element).borderTopWidth }
      })
      return { ok: daten.b >= 44 && daten.h >= 44 && daten.rechts && daten.rand === '0px', wert: JSON.stringify(daten) }
    })
    await pruefen(B, 'Profilmenü öffnet und zeigt Wege (Konto/Anmelden)', 'Menü mit Wegen', async () => {
      await seite.locator('summary[aria-label="Kontomenü"]').first().click()
      await seite.waitForTimeout(400)
      const namen = await seite.locator('.workspace-account-panel a, .workspace-account-panel button').allInnerTexts()
      return { ok: namen.length > 0, wert: namen.map((n) => n.trim()).filter(Boolean).join(' | ') }
    })
    await pruefen(B, 'Escape schliesst das Profilmenü', 'geschlossen', async () => {
      await seite.keyboard.press('Escape')
      await seite.waitForTimeout(300)
      const offen = await seite.evaluate(() => document.querySelector('details.workspace-account')?.hasAttribute('open') ?? false)
      return { ok: !offen, wert: offen ? 'noch offen' : 'zu' }
    })
    await pruefen(B, 'Navigation: Meine Reisen → Zurück → Vor', 'URLs wechseln, Seite bleibt bedienbar', async () => {
      const menue = seite.locator('button.kopf-menue:visible').first()
      if ((await menue.count()) > 0) {
        await menue.click()
        await seite.waitForTimeout(500)
      }
      await seite.locator('#workspace-navigation a[href="/reisen"]:visible').first().click()
      await seite.waitForURL(/\/reisen$/, { timeout: 10_000 })
      await seite.waitForTimeout(500)
      const a = seite.url().replace(/^https?:\/\/[^/]+/, '')
      await seite.goBack({ waitUntil: 'domcontentloaded' })
      await seite.waitForSelector('.reisekopf h1', { timeout: 20_000 })
      const b = seite.url().replace(/^https?:\/\/[^/]+/, '')
      await seite.goForward({ waitUntil: 'domcontentloaded' })
      await seite.waitForTimeout(700)
      const c = seite.url().replace(/^https?:\/\/[^/]+/, '')
      const kopfDa = (await seite.locator('header').count()) > 0
      return { ok: a === '/reisen' && b === `/reisen/${REISE.id}` && c === '/reisen' && kopfDa, wert: `${a} → ${b} → ${c}` }
    })
    await pruefen(B, 'Navigation: Konsolen- oder Hydrationsfehler', '0 Fehler', async () => ({ ok: echt(meldungen.fehler).length === 0 && meldungen.hydration.length === 0, wert: fehlerText(meldungen) }))
    await context.close()
  }

  /* ---- Konto im Prüfstand ---- */
  {
    const { context, seite, meldungen } = await kontext(browserTyp, { mitReise: false })
    await seite.goto(`${KONTO}/account`, { waitUntil: 'domcontentloaded' })
    await seite.waitForSelector('header', { timeout: 20_000 })
    await warten(seite)
    await pruefen(B, 'Konto: gleiche Kopfzeile wie Reise (Menü, Marke, Profil)', 'kopf-menue, kopf-marke, kopf-profil', async () => {
      const daten = await seite.evaluate(() => ({ menue: Boolean(document.querySelector('header .kopf-menue')), marke: Boolean(document.querySelector('header .kopf-marke img')), profil: Boolean(document.querySelector('header .kopf-profil')), hoehe: Math.round(document.querySelector('header').getBoundingClientRect().height) }))
      return { ok: daten.menue && daten.marke && daten.profil && daten.hoehe <= 64, wert: JSON.stringify(daten) }
    })
    await pruefen(B, 'Konto: kein Überlauf bei 390 px', 'kein Überlauf', async () => {
      const wert = await ueberlauf(seite)
      return { ok: wert <= 0, wert: `${wert}px` }
    })
    await pruefen(B, 'Konto: keine Konsolen- oder Hydrationsfehler', '0 Fehler', async () => ({ ok: echt(meldungen.fehler).length === 0 && meldungen.hydration.length === 0, wert: fehlerText(meldungen) }))
    await context.close()
  }

  /* ---- Breiten 320 / 430, grosse Schrift, reduzierte Bewegung, Eingaben ---- */
  for (const [name, url, mitReise] of [
    ['Startseite', `${basis}/`, false],
    ['Reise', reiseUrl, true],
    ['Konto-Reise', `${KONTO}/reisen/konto`, false],
    ['Reiseplanung', `${basis}/planen`, false],
  ]) {
    for (const breite of [320, 430]) {
      const { context, seite } = await kontext(browserTyp, { mitReise, kontext: { viewport: { width: breite, height: breite === 320 ? 640 : 932 } } })
      await seite.goto(url, { waitUntil: 'domcontentloaded' })
      await seite.waitForSelector('header', { timeout: 20_000 })
      await warten(seite, 900)
      await pruefen(B, `${name} ${breite} px: kein horizontaler Überlauf, Kopfzeile ≤ 64 px, Ziele ≥ 44 px`, 'Überlauf 0, Kopf ≤ 64, keine kleinen Ziele', async () => {
        const [lauf, hoehe, klein] = [await ueberlauf(seite), await seite.evaluate(() => Math.round(document.querySelector('header').getBoundingClientRect().height)), await ziele44(seite, 'header .kopf-menue, header .kopf-profil, header .kopf-begleiter, header .kopf-marke')]
        return { ok: lauf <= 0 && hoehe <= 64 && klein.length === 0, wert: `Überlauf ${lauf}, Kopf ${hoehe}, klein ${JSON.stringify(klein)}` }
      })
      await context.close()
    }
    for (const prozent of [150, 200]) {
      const { context, seite } = await kontext(browserTyp, { mitReise, kontext: { viewport: { width: 320, height: 640 } } })
      await seite.goto(url, { waitUntil: 'domcontentloaded' })
      await seite.waitForSelector('header', { timeout: 20_000 })
      await warten(seite, 700)
      await seite.addStyleTag({ content: `html { font-size: ${prozent}% !important; }` })
      await seite.waitForTimeout(500)
      const befund = await seite.evaluate(() => {
        const breite = document.documentElement.clientWidth
        const ueber = [...document.querySelectorAll('body *')].filter((element) => {
          const rahmen = element.getBoundingClientRect()
          const zu = element.closest('details:not([open])')
          if (zu && !element.closest('summary')) return false
          if (rahmen.width <= 1 || element.closest('svg, .sr-only, [class*="overflow-x-auto"], [class*="overflow-hidden"]')) return false
          return rahmen.right > breite + 0.5 || rahmen.left < -0.5
        })
        return {
          seite: document.documentElement.scrollWidth - breite,
          eigene: ueber.filter((element) => element.closest('header, .reisekopf')).length,
          fremde: ueber.filter((element) => !element.closest('header, .reisekopf')).slice(0, 2).map((element) => `${element.tagName.toLowerCase()}.${String(element.className).trim().split(/\s+/).slice(0, 2).join('.')}`),
          ziele: ['header .kopf-menue', 'header .kopf-profil'].map((auswahl) => { const element = document.querySelector(auswahl); if (!element) return false; const rahmen = element.getBoundingClientRect(); return rahmen.right <= innerWidth + 1 && rahmen.left >= -1 }),
        }
      })
      await pruefen(B, `${name} 320 px, Schrift ${prozent} %: Kopfzeile und Reisekopf ohne Überlauf, Menü und Profil erreichbar`, 'keine eigenen Überläufe, Ziele sichtbar', async () => ({ ok: befund.eigene === 0 && befund.ziele.every(Boolean), wert: `eigene ${befund.eigene}, Ziele ${befund.ziele}` }))
      await pruefen(B, `${name} 320 px, Schrift ${prozent} %: ganze Seite ohne horizontalen Überlauf`, 'Überlauf 0', async () => ({ ok: befund.seite <= 0, wert: `Überlauf ${befund.seite}px${befund.fremde.length ? `, verursacht von ${befund.fremde.join(', ')}` : ''}` }))
      await context.close()
    }
  }

  {
    const { context, seite } = await kontext(browserTyp, { mitReise: true, kontext: { reducedMotion: 'reduce' } })
    await seite.goto(reiseUrl, { waitUntil: 'domcontentloaded' })
    await seite.waitForSelector('button.kopf-menue', { timeout: 20_000 })
    await warten(seite)
    await pruefen(B, 'Reduzierte Bewegung: Menü öffnet ohne laufende Animationen', '0 laufende Animationen', async () => {
      await seite.locator('button.kopf-menue').first().click()
      await seite.waitForTimeout(80)
      const anzahl = await seite.evaluate(() => document.getAnimations().filter((animation) => animation.playState === 'running' && (animation.effect?.getComputedTiming().duration ?? 0) > 20).length)
      return { ok: anzahl === 0, wert: `${anzahl} laufende Animationen` }
    })
    await context.close()
  }

  {
    const { context, seite } = await kontext(browserTyp, { mitReise: false })
    await seite.goto(`${basis}/planen`, { waitUntil: 'domcontentloaded' })
    await seite.waitForSelector('header', { timeout: 20_000 })
    await warten(seite, 900)
    await pruefen(B, 'Eingabefelder auf dem Telefon: Schrift ≥ 16 px (kein Safari-Zoom)', 'kleinste Schrift ≥ 16', async () => {
      const grössen = await seite.evaluate(() => [...document.querySelectorAll('input:not([type=hidden]):not([type=checkbox]):not([type=radio]), select, textarea')].filter((element) => { const rahmen = element.getBoundingClientRect(); return rahmen.width > 0 && rahmen.height > 0 && getComputedStyle(element).display !== 'none' }).map((element) => parseFloat(getComputedStyle(element).fontSize)))
      const kleinste = grössen.length ? Math.min(...grössen) : null
      return { ok: kleinste === null ? false : kleinste >= 16, wert: kleinste === null ? 'keine Felder gefunden' : `${grössen.length} Felder, kleinste ${kleinste}px` }
    })
    await context.close()
  }
}

async function tastatur(browserName, browserTyp, basis) {
  const { context, seite } = await kontext(browserTyp, { mitReise: true })
  await seite.goto(`${basis}/reisen/${REISE.id}`, { waitUntil: 'domcontentloaded' })
  await seite.waitForSelector('.reisekopf h1', { timeout: 20_000 })
  await warten(seite)
  await pruefen(browserName, 'Tastaturlauf: 14 Schritte, Fokus sichtbar und nicht verdeckt', 'jeder Fokus sichtbar, nichts verdeckt', async () => {
    const befunde = []
    await seite.evaluate(() => window.scrollTo(0, 0))
    for (let i = 0; i < 14; i++) {
      await seite.keyboard.press('Tab')
      await seite.waitForTimeout(80)
      const befund = await seite.evaluate(() => {
        const element = document.activeElement
        if (!element || element === document.body) return null
        const rahmen = element.getClientRects()[0] ?? element.getBoundingClientRect()
        const mitte = document.elementFromPoint(Math.min(Math.max(rahmen.x + rahmen.width / 2, 0), innerWidth - 1), Math.min(Math.max(rahmen.y + rahmen.height / 2, 0), innerHeight - 1))
        const stil = getComputedStyle(element)
        const ring = (stil.outlineStyle !== 'none' && parseFloat(stil.outlineWidth) > 0) || (stil.boxShadow && stil.boxShadow !== 'none')
        return { name: (element.getAttribute('aria-label') || element.textContent || element.tagName).trim().replace(/\s+/g, ' ').slice(0, 30), verdeckt: !(mitte && (element === mitte || element.contains(mitte) || mitte.contains(element))), ring: Boolean(ring) }
      })
      if (befund) befunde.push(befund)
    }
    const schlecht = befunde.filter((befund) => befund.verdeckt || !befund.ring)
    return { ok: befunde.length >= 8 && schlecht.length === 0, wert: `${befunde.length} Ziele, schlecht: ${JSON.stringify(schlecht)}` }
  })
  await context.close()
}

async function main() {
  mkdirSync(AUS, { recursive: true })
  const browserListe = { chromium, webkit }
  for (const [name, typ] of Object.entries(browserListe)) {
    const browser = await typ.launch()
    const basis = name === 'webkit' ? BASIS_WEBKIT : BASIS
    const huelle = { launch: async () => browser, newContext: (...argumente) => browser.newContext(...argumente) }
    await phone(name, huelle, basis)
    await tastatur(name, huelle, basis)
    await browser.close()
  }
  const bericht = {
    commit: COMMIT,
    basis: BASIS,
    basisWebkit: BASIS_WEBKIT,
    konto: KONTO,
    erzeugt: new Date().toISOString(),
    gesamt: protokoll.length,
    pass: protokoll.filter((eintrag) => eintrag.status === 'PASS').length,
    fail: protokoll.filter((eintrag) => eintrag.status === 'FAIL').length,
    protokoll,
  }
  writeFileSync(join(AUS, 'interaktion.json'), JSON.stringify(bericht, null, 2))
  console.log(`Fertig: ${bericht.pass} PASS, ${bericht.fail} FAIL von ${bericht.gesamt}`)
}

void main()
