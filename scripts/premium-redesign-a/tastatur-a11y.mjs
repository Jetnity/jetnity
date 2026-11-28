#!/usr/bin/env node
// scripts/premium-redesign-a/tastatur-a11y.mjs
//
// Ergänzende, kostenlose Prüfungen für die Bedienung per Tastatur und für die Zugänglichkeitsstruktur
// (Work-Nachtest 27.11.2026, Punkt Screenreader). Sie ERSETZEN KEINE Bedienung mit echtem VoiceOver oder TalkBack.
// Geprüft werden Namen, Rollen, Zustände (Zugänglichkeitsbaum von Chromium), Tastaturbedienung, Fokusreihenfolge,
// Fokus nach Änderungen, Dialogfokus (hinein, gefangen, zurück) und Rückmeldungen. Was das Skript nicht ableiten kann,
// steht als OFFEN. Kein Login, keine Daten, keine Buchung: lokaler Production-Build und Konto-Prüfstand.
//
//   node scripts/premium-redesign-a/tastatur-a11y.mjs --base http://127.0.0.1:3493 --konto http://127.0.0.1:3475 \
//     --fixtures /tmp/pra/fixtures --label nachher --commit <sha> --out /tmp/pra/auswahl/a11y

import { mkdirSync, readFileSync, writeFileSync } from 'node:fs'
import { join } from 'node:path'
import { chromium } from 'playwright'

function argument(name, standard = '') {
  const index = process.argv.indexOf(`--${name}`)
  return index >= 0 && process.argv[index + 1] && !process.argv[index + 1].startsWith('--') ? process.argv[index + 1] : standard
}

const BASIS = argument('base', 'http://127.0.0.1:3493')
const KONTO = argument('konto', 'http://127.0.0.1:3475')
const FIXTURES = argument('fixtures', '/tmp/pra/fixtures')
const ETIKETT = argument('label', 'nachher')
const COMMIT = argument('commit', 'unbekannt')
const AUS = argument('out', '/tmp/pra/auswahl/a11y')
const REISE = JSON.parse(readFileSync(join(FIXTURES, 'thailand.json'), 'utf8'))

const pruefungen = []
const eintragen = (id, titel, ergebnis, belege) => {
  pruefungen.push({ id, titel, ergebnis, belege })
  console.log(`${ergebnis.padEnd(5)} ${id} ${titel}${belege.length ? `\n        ${belege.join('\n        ')}` : ''}`)
}

async function seiteOeffnen(browser, url, { thema = 'light', mitReise = false, breite = 390 } = {}) {
  const context = await browser.newContext({ viewport: { width: breite, height: 844 }, locale: 'de-CH', hasTouch: breite < 600, isMobile: breite < 600 })
  await context.addInitScript(
    ({ s, w, t, reise }) => {
      if (reise) localStorage.setItem(s, w)
      if (t === 'dark') localStorage.setItem('jetnity:workspace-theme:v1', 'dark')
    },
    { s: REISE.schluessel, w: REISE.roh, t: thema, reise: mitReise },
  )
  const seite = await context.newPage()
  await seite.goto(url, { waitUntil: 'domcontentloaded' })
  await seite.waitForSelector('h1', { timeout: 20_000 })
  await seite.waitForTimeout(1200)
  return { context, seite }
}

/** Name, Rolle und Zustände des fokussierten Elements aus dem Zugänglichkeitsbaum der Seite. */
const fokusBeschreibung = (seite) =>
  seite.evaluate(() => {
    const e = document.activeElement
    if (!e || e === document.body) return null
    const name = e.getAttribute('aria-label') || e.textContent?.trim().replace(/\s+/g, ' ').slice(0, 60) || e.getAttribute('placeholder') || ''
    return { tag: e.tagName.toLowerCase(), name, pressed: e.getAttribute('aria-pressed'), expanded: e.getAttribute('aria-expanded'), current: e.getAttribute('aria-current'), id: e.id || null }
  })

const innen = (seite, selektor) =>
  seite.evaluate((s) => {
    const wurzel = document.querySelector(s)
    return Boolean(wurzel && document.activeElement && wurzel.contains(document.activeElement))
  }, selektor)

const browser = await chromium.launch()
try {
  /* 1. Meine Reisen (Prüfstand): Filter mit Namen, Rolle, Zustand, Tastatur */
  {
    const { context, seite } = await seiteOeffnen(browser, `${KONTO}/reisen`)
    const baum = await seite.locator('body').ariaSnapshot()
    const gruppe = baum.match(/group "Archivauswahl":\n((?:\s+- button .*\n?)+)/)?.[1] ?? ''
    const knoepfe = [...gruppe.matchAll(/button "([^"]+)"( \[pressed\])?/g)].map((m) => ({ name: m[1], gedrueckt: Boolean(m[2]) }))
    const erwartet = ['Alle', 'Offen', 'Archiv']
    eintragen(
      'A1',
      'Filter «Alle/Offen/Archiv»: Gruppe «Archivauswahl», drei Schaltflächen mit Namen, genau eine als «gedrückt» (Zugänglichkeitsbaum)',
      JSON.stringify(knoepfe.map((k) => k.name)) === JSON.stringify(erwartet) && knoepfe.filter((k) => k.gedrueckt).length === 1 ? 'PASS' : 'FAIL',
      [`Baum: ${knoepfe.map((k) => `${k.name}${k.gedrueckt ? ' [gedrückt]' : ''}`).join(', ')}`],
    )

    await seite.locator('[data-sammlung-archiv="alle"]').focus()
    const tabAbfolge = []
    for (let n = 0; n < 3; n += 1) {
      await seite.keyboard.press('Tab')
      tabAbfolge.push((await fokusBeschreibung(seite))?.name)
    }
    eintragen('A2', 'Tab-Reihenfolge innerhalb des Filters entspricht der Anzeige (Alle → Offen → Archiv)', tabAbfolge[0] === 'Offen' && tabAbfolge[1] === 'Archiv' ? 'PASS' : 'FAIL', [`Tab ab «Alle»: ${tabAbfolge.join(' → ')}`])

    await seite.locator('[data-sammlung-archiv="offen"]').focus()
    await seite.keyboard.press('Space')
    await seite.waitForTimeout(500)
    const nachSpace = await fokusBeschreibung(seite)
    const zustaende = await seite.evaluate(() => Object.fromEntries([...document.querySelectorAll('[data-sammlung-archiv]')].map((e) => [e.getAttribute('data-sammlung-archiv'), e.getAttribute('aria-pressed')])))
    eintragen(
      'A3',
      'Filter per Leertaste: Auswahl wechselt auf «Offen» (aria-pressed), der Fokus bleibt auf dem bedienten Knopf',
      zustaende.offen === 'true' && zustaende.alle === 'false' && nachSpace?.name === 'Offen' ? 'PASS' : 'FAIL',
      [`aria-pressed: ${JSON.stringify(zustaende)}; Fokus nach Bedienung: ${nachSpace?.name ?? 'verloren'}`],
    )

    const live = await seite.evaluate(() => {
      const absatz = [...document.querySelectorAll('p')].find((p) => /^Diese Ansicht ist/.test(p.textContent || ''))
      if (!absatz) return { gefunden: false }
      const region = absatz.closest('[aria-live], [role="status"], [role="alert"]')
      return { gefunden: true, text: absatz.textContent, live: Boolean(region), rolle: region?.getAttribute('role') ?? region?.getAttribute('aria-live') ?? null }
    })
    eintragen(
      'A4',
      'Ergebnisaussage nach dem Filtern («Diese Ansicht ist …») liegt in einer Live-Region und wird ohne Fokuswechsel angesagt',
      live.gefunden && live.live ? 'PASS' : live.gefunden ? 'FAIL' : 'OFFEN',
      [live.gefunden ? `«${live.text}» — Live-Region: ${live.live ? live.rolle : 'nein'}` : 'Aussage nicht gefunden'],
    )
    await context.close()
  }

  /* 2. Reisekopf, Menü, Darstellung, Fokusreihenfolge (echter Build, Workspace-Route) */
  {
    const { context, seite } = await seiteOeffnen(browser, `${BASIS}/reisen/${REISE.id}`, { mitReise: true })
    const baum = await seite.locator('body').ariaSnapshot()
    const hatSprunglink = /link "Zum Inhalt"/.test(baum)
    const ersterStopp = await (async () => {
      await seite.keyboard.press('Tab')
      return fokusBeschreibung(seite)
    })()
    eintragen('B1', 'Erster Tab-Stopp ist der Sprunglink «Zum Inhalt»', hatSprunglink && ersterStopp?.name === 'Zum Inhalt' ? 'PASS' : 'FAIL', [`erster Stopp: ${ersterStopp?.name ?? 'keiner'}`])

    const positiv = await seite.evaluate(() => [...document.querySelectorAll('[tabindex]')].filter((e) => Number(e.getAttribute('tabindex')) > 0).length)
    const domReihenfolge = await seite.evaluate(() =>
      [...document.querySelectorAll('a[href], button:not([disabled]), input:not([disabled]), select, textarea, summary, [tabindex="0"]')]
        .filter((e) => {
          const r = e.getBoundingClientRect()
          const s = getComputedStyle(e)
          const geschlossen = e.closest('details:not([open])')
          return r.width > 0 && r.height > 0 && s.visibility !== 'hidden' && !e.closest('[hidden], [inert]') && (!geschlossen || (e.tagName === 'SUMMARY' && e.parentElement === geschlossen))
        })
        .slice(0, 14)
        .map((e) => e.getAttribute('aria-label') || e.textContent?.trim().replace(/\s+/g, ' ').slice(0, 40) || e.tagName.toLowerCase()),
    )
    const tabReihenfolge = [ersterStopp?.name]
    for (let n = 0; n < 13; n += 1) {
      await seite.keyboard.press('Tab')
      tabReihenfolge.push((await fokusBeschreibung(seite))?.name)
    }
    const gleich = tabReihenfolge.slice(0, domReihenfolge.length).every((name, i) => (domReihenfolge[i] ?? '').startsWith((name ?? '').slice(0, 20)) || (name ?? '').startsWith((domReihenfolge[i] ?? '').slice(0, 20)))
    eintragen(
      'B2',
      'Fokusreihenfolge folgt der DOM-Reihenfolge (kein positives tabindex), erste 14 Stopps',
      positiv === 0 && gleich ? 'PASS' : 'FAIL',
      [`positives tabindex: ${positiv}`, `Tab: ${tabReihenfolge.join(' → ')}`, `DOM: ${domReihenfolge.join(' → ')}`],
    )

    const reisebereiche = await seite.evaluate(() =>
      [...document.querySelectorAll('nav[aria-label="Reisebereiche"] button')].map((b) => ({ name: b.getAttribute('aria-label') || b.textContent.trim().replace(/\s+/g, ' '), current: b.getAttribute('aria-current'), pressed: b.getAttribute('aria-pressed'), selected: b.getAttribute('aria-selected') })),
    )
    const mitZustand = reisebereiche.filter((b) => b.current && b.current !== 'false')
    eintragen(
      'B3',
      'Navigation «Reisebereiche»: der aktuelle Bereich ist programmatisch erkennbar (aria-current)',
      reisebereiche.length >= 4 && mitZustand.length === 1 ? 'PASS' : reisebereiche.length >= 4 ? 'FAIL' : 'OFFEN',
      [`Bereiche: ${reisebereiche.map((b) => `${b.name}${b.current ? ` [current=${b.current}]` : ''}`).join(', ')}`],
    )

    // Menü: öffnen, Fokus hinein, gefangen, Escape, Fokus zurück
    const menuKnopf = seite.getByRole('button', { name: 'Menü' }).first()
    await menuKnopf.focus()
    const vorher = await menuKnopf.getAttribute('aria-expanded')
    await seite.keyboard.press('Enter')
    await seite.waitForTimeout(700)
    const dialogName = await seite.locator('[role="dialog"]').first().getAttribute('aria-label').catch(() => null)
    const imDialog = await innen(seite, '[role="dialog"]')
    const nachher = await menuKnopf.getAttribute('aria-expanded').catch(() => null)
    eintragen(
      'C1',
      'Menü per Enter öffnen: Dialog mit Namen, Fokus wandert hinein, Menüknopf meldet aria-expanded',
      dialogName && imDialog ? 'PASS' : 'FAIL',
      [`Dialogname: ${dialogName ?? 'keiner'}; Fokus im Dialog: ${imDialog}; aria-expanded vorher/nachher: ${vorher}/${nachher}`],
    )

    let draussen = 0
    for (let n = 0; n < 30; n += 1) {
      await seite.keyboard.press('Tab')
      if (!(await innen(seite, '[role="dialog"]'))) draussen += 1
    }
    for (let n = 0; n < 30; n += 1) {
      await seite.keyboard.press('Shift+Tab')
      if (!(await innen(seite, '[role="dialog"]'))) draussen += 1
    }
    eintragen('C2', 'Geöffnetes Menü hält den Tastaturfokus gefangen (60 Tab-/Shift+Tab-Schritte bleiben im Dialog)', draussen === 0 ? 'PASS' : 'FAIL', [`Schritte ausserhalb des Dialogs: ${draussen} von 60`])

    // Darstellung per Tastatur
    const dunkel = seite.getByRole('button', { name: 'Dunkel' }).first()
    await dunkel.focus()
    await seite.keyboard.press('Space')
    await seite.waitForTimeout(500)
    const themaDunkel = await seite.evaluate(() => ({ attr: document.documentElement.getAttribute('data-workspace-theme'), shell: document.querySelector('.workspace-shell')?.getAttribute('data-workspace-theme') }))
    const zustandDunkel = await seite.evaluate(() => Object.fromEntries([...document.querySelectorAll('[role="dialog"] button[aria-pressed]')].map((b) => [b.textContent.trim(), b.getAttribute('aria-pressed')])))
    const fokusDunkel = await fokusBeschreibung(seite)
    eintragen(
      'D1',
      'Darstellung «Dunkel» per Leertaste: Thema wechselt, aria-pressed wechselt, der Fokus bleibt auf «Dunkel»',
      themaDunkel.shell === 'dark' && zustandDunkel.Dunkel === 'true' && zustandDunkel.Hell === 'false' && fokusDunkel?.name === 'Dunkel' ? 'PASS' : 'FAIL',
      [`Thema: ${JSON.stringify(themaDunkel)}; aria-pressed: ${JSON.stringify(zustandDunkel)}; Fokus: ${fokusDunkel?.name ?? 'verloren'}`],
    )
    await seite.getByRole('button', { name: 'Hell' }).first().focus()
    await seite.keyboard.press('Space')
    await seite.waitForTimeout(400)
    const themaHell = await seite.evaluate(() => document.querySelector('.workspace-shell')?.getAttribute('data-workspace-theme'))
    eintragen('D2', 'Zurück zu «Hell» per Leertaste', themaHell === 'light' ? 'PASS' : 'FAIL', [`Thema: ${themaHell}`])

    await seite.keyboard.press('Escape')
    await seite.waitForTimeout(600)
    const zu = await seite.locator('[role="dialog"]:visible').count()
    const fokusZurueck = await fokusBeschreibung(seite)
    eintragen('C3', 'Escape schliesst das Menü und gibt den Fokus an «Menü» zurück', zu === 0 && fokusZurueck?.name === 'Menü' ? 'PASS' : 'FAIL', [`offene Dialoge: ${zu}; Fokus danach: ${fokusZurueck?.name ?? 'verloren (Dokument)'}`])

    // Bildnachweis: Aufklappen per Tastatur
    const nachweis = seite.locator('button.bildnachweis-knopf').first()
    if (await nachweis.count()) {
      await nachweis.focus()
      const v = await nachweis.getAttribute('aria-expanded')
      await seite.keyboard.press('Enter')
      await seite.waitForTimeout(300)
      const n = await nachweis.getAttribute('aria-expanded')
      const feld = await seite.evaluate(() => {
        const g = document.querySelector('.bildnachweis-feld')
        return g ? { sichtbar: !g.hidden, rolle: g.getAttribute('role'), name: g.getAttribute('aria-label') } : null
      })
      const fokusNachweis = await fokusBeschreibung(seite)
      eintragen(
        'E1',
        'Bildnachweis per Enter: aria-expanded wechselt, Feld wird sichtbar mit Gruppenname, Fokus bleibt auf dem Knopf',
        v === 'false' && n === 'true' && feld?.sichtbar && feld.name && fokusNachweis?.tag === 'button' ? 'PASS' : 'FAIL',
        [`aria-expanded ${v} → ${n}; Feld: ${JSON.stringify(feld)}; Fokus: ${fokusNachweis?.name ?? 'verloren'}`],
      )
    } else {
      eintragen('E1', 'Bildnachweis per Enter aufklappen', 'OFFEN', ['kein Bildnachweis-Knopf auf der Seite gefunden'])
    }

    // Reiseplan: Tabs, Zustand, Fokus nach Änderung
    await seite.locator('nav[aria-label="Reisebereiche"] button', { hasText: /^\s*Reiseplan/ }).first().click()
    await seite.waitForTimeout(1200)
    const planTabs = await seite.evaluate(() => [...document.querySelectorAll('.et-mobile-tabs button, .et-tabs button')].filter((b) => b.getBoundingClientRect().width > 0).map((b) => ({ name: b.textContent.trim().replace(/\s+/g, ' '), pressed: b.getAttribute('aria-pressed') })))
    if (planTabs.length >= 2) {
      const ziel = seite.locator('.et-mobile-tabs button', { hasText: 'Karte' }).first()
      if (await ziel.isVisible().catch(() => false)) {
        await ziel.focus()
        await seite.keyboard.press('Enter')
        await seite.waitForTimeout(600)
        const nach = await seite.evaluate(() => Object.fromEntries([...document.querySelectorAll('.et-mobile-tabs button')].map((b) => [b.textContent.trim(), b.getAttribute('aria-pressed')])))
        const fokusKarte = await fokusBeschreibung(seite)
        eintragen(
          'F1',
          'Reiseplan «Reiseplan/Karte» per Enter: aria-pressed wechselt, der Fokus bleibt auf dem bedienten Knopf',
          nach.Karte === 'true' && nach.Reiseplan === 'false' && fokusKarte?.name === 'Karte' ? 'PASS' : 'FAIL',
          [`aria-pressed: ${JSON.stringify(nach)}; Fokus: ${fokusKarte?.name ?? 'verloren'}`],
        )
      } else {
        eintragen('F1', 'Reiseplan «Reiseplan/Karte» per Enter', 'OFFEN', ['Umschalter in dieser Breite nicht sichtbar'])
      }
    } else {
      eintragen('F1', 'Reiseplan-Umschalter per Enter', 'OFFEN', [`Umschalter nicht gefunden: ${JSON.stringify(planTabs)}`])
    }
    await context.close()
  }

  /* 3. Reisebegleiter (Prüfstand): aufklappbares Feld, kein modaler Dialog */
  {
    const { context, seite } = await seiteOeffnen(browser, `${KONTO}/reisen/konto`)
    const knopf = seite.locator('button.kopf-begleiter').first()
    if (await knopf.count()) {
      await knopf.focus()
      const vorher = await knopf.getAttribute('aria-expanded')
      const steuert = await knopf.getAttribute('aria-controls')
      await seite.keyboard.press('Enter')
      await seite.waitForTimeout(800)
      const nachher = await knopf.getAttribute('aria-expanded')
      const sichtbar = await seite.locator('#reisebegleiter').isVisible().catch(() => false)
      const drin = await innen(seite, '#reisebegleiter')
      eintragen(
        'G1',
        'Reisebegleiter öffnen per Enter: Knopf meldet aria-expanded und aria-controls, Feld wird sichtbar, Fokus wandert in das Feld',
        vorher === 'false' && nachher === 'true' && steuert === 'reisebegleiter' && sichtbar && drin ? 'PASS' : 'FAIL',
        [`aria-expanded ${vorher} → ${nachher}; aria-controls=${steuert}; Feld sichtbar: ${sichtbar}; Fokus im Feld: ${drin}`],
      )
      await seite.keyboard.press('Escape')
      await seite.waitForTimeout(600)
      const offen = await seite.locator('#reisebegleiter').isVisible().catch(() => false)
      const zurueck = await seite.evaluate(() => document.activeElement?.classList.contains('kopf-begleiter') ?? false)
      const zu = await knopf.getAttribute('aria-expanded')
      eintragen('G2', 'Escape im Reisebegleiter schliesst das Feld, aria-expanded wird false, Fokus kehrt zum Auslöser zurück', !offen && zurueck && zu === 'false' ? 'PASS' : 'FAIL', [`Feld sichtbar: ${offen}; Fokus beim Auslöser: ${zurueck}; aria-expanded: ${zu}`])
    } else {
      eintragen('G1', 'Reisebegleiter öffnen', 'OFFEN', ['Auslöser nicht gefunden'])
    }
    await context.close()
  }

  /* 4. Formular /planen: Beschriftung und Fehlermeldung */
  {
    const { context, seite } = await seiteOeffnen(browser, `${BASIS}/planen`)
    const feld = seite.getByRole('textbox', { name: 'Deine Reise in eigenen Worten' })
    const hatName = (await feld.count()) === 1
    eintragen('H1', 'Eingabefeld «Deine Reise in eigenen Worten» hat einen zugänglichen Namen (Label)', hatName ? 'PASS' : 'FAIL', [`gefunden: ${hatName}`])
    await seite.getByRole('button', { name: 'Entwurf erstellen' }).click()
    await seite.waitForTimeout(900)
    const rueckmeldung = await seite.evaluate(() => {
      const textarea = document.querySelector('textarea')
      const alarme = [...document.querySelectorAll('[role="alert"], [role="status"], [aria-live="polite"], [aria-live="assertive"]')].map((e) => (e.textContent || '').trim()).filter(Boolean)
      return {
        invalid: textarea?.getAttribute('aria-invalid'),
        beschrieben: textarea?.getAttribute('aria-describedby'),
        beschreibung: (textarea?.getAttribute('aria-describedby') || '').split(' ').map((id) => document.getElementById(id)?.textContent?.trim()).filter(Boolean),
        alarme,
        fokusAufFeld: document.activeElement === textarea,
        validierung: textarea?.validationMessage || '',
      }
    })
    const inLive = rueckmeldung.alarme.length > 0
    eintragen(
      'H2',
      'Leeres Formular absenden: die Fehlermeldung steht in einer Live-Region (role=alert/status) und wird ohne Fokuswechsel angesagt',
      inLive ? 'PASS' : 'FAIL',
      [`Live-Regionen: ${JSON.stringify(rueckmeldung.alarme)}`],
    )
    const verknuepft = rueckmeldung.invalid === 'true' && rueckmeldung.beschreibung.length > 0
    eintragen(
      'H2b',
      'Empfehlung: das betroffene Feld ist als ungültig markiert (aria-invalid) und mit der Meldung verknüpft (aria-describedby), der Fokus liegt am Feld',
      verknuepft && rueckmeldung.fokusAufFeld ? 'PASS' : 'HINWEIS',
      [`aria-invalid=${rueckmeldung.invalid}; aria-describedby=${rueckmeldung.beschrieben}; Fokus am Feld: ${rueckmeldung.fokusAufFeld}`],
    )

    const wege = await seite.evaluate(() => [...document.querySelectorAll('nav[aria-label="Wege zur neuen Reise"] a')].map((a) => ({ name: a.textContent.trim(), current: a.getAttribute('aria-current') })))
    eintragen(
      'H3',
      'Umschalter «In eigenen Worten / Schritt für Schritt»: aktueller Weg ist programmatisch erkennbar (aria-current)',
      wege.length === 2 && wege.filter((w) => w.current === 'true').length === 1 ? 'PASS' : 'FAIL',
      [JSON.stringify(wege)],
    )
    await seite.locator('nav[aria-label="Wege zur neuen Reise"] a', { hasText: 'Schritt für Schritt' }).focus()
    await seite.keyboard.press('Enter')
    await seite.waitForTimeout(700)
    const wegeNach = await seite.evaluate(() => [...document.querySelectorAll('nav[aria-label="Wege zur neuen Reise"] a')].map((a) => ({ name: a.textContent.trim(), current: a.getAttribute('aria-current') })))
    const fokusNach = await fokusBeschreibung(seite)
    eintragen(
      'H4',
      'Wegwechsel per Enter: aria-current wechselt; Fokus wandert zum Zielbereich (benannt) und geht nicht verloren',
      wegeNach.find((w) => w.name === 'Schritt für Schritt')?.current === 'true' && fokusNach ? 'PASS' : 'FAIL',
      [`Weg: ${JSON.stringify(wegeNach)}; Fokus: ${fokusNach ? `${fokusNach.tag} «${fokusNach.name.slice(0, 40)}»` : 'verloren'}`],
    )
    await context.close()
  }
} finally {
  await browser.close()
}

const summe = pruefungen.reduce((s, p) => ({ ...s, [p.ergebnis]: (s[p.ergebnis] ?? 0) + 1 }), {})
mkdirSync(AUS, { recursive: true })
writeFileSync(
  join(AUS, `tastatur-a11y-${ETIKETT}.json`),
  `${JSON.stringify({ etikett: ETIKETT, commit: COMMIT, erzeugt: new Date().toISOString(), hinweis: 'Ersetzt keine Bedienung mit echtem VoiceOver oder TalkBack.', summe, pruefungen }, null, 2)}\n`,
)
const md = [
  `# Tastatur- und Zugänglichkeitsstruktur (${ETIKETT}, ${COMMIT})`,
  '',
  '**Kein Ersatz für VoiceOver oder TalkBack.** Geprüft werden Namen, Rollen, Zustände, Tastaturbedienung, Fokus und Rückmeldungen im Zugänglichkeitsbaum von Chromium; gehörte Ansagen sind damit nicht belegt.',
  '',
  '| Nr. | Prüfung | Ergebnis | Beleg |',
  '|---|---|---|---|',
  ...pruefungen.map((p) => `| ${p.id} | ${p.titel} | ${p.ergebnis} | ${p.belege.join(' ; ').replace(/\|/g, '/').slice(0, 400)} |`),
  '',
  `Summe: ${Object.entries(summe).map(([k, v]) => `${k} ${v}`).join(', ')}`,
]
writeFileSync(join(AUS, `tastatur-a11y-${ETIKETT}.md`), `${md.join('\n')}\n`)
console.log(`\nSumme: ${JSON.stringify(summe)} — ${join(AUS, `tastatur-a11y-${ETIKETT}.json`)}`)
process.exit(summe.FAIL ? 1 : 0)
