// Vorher/Nachher der Konto-Seite «Meine Reisen»: der Einstieg «Dein nächster Schritt» mit der
// bestehenden Graz-Reise (27.–31. Dezember). Gemessen wird der echte Satz, dazu je Kombination
// ein Bild des Abschnitts. Beide Stände laufen im Konto-Prüfstand (echte Komponenten).
//
// Aufruf: node scripts/premium-redesign-a/datum-konto-bilder.mjs --vorher URL --nachher URL --out ORDNER
//   [--breiten 390,1440,320] [--browser chromium,webkit]

import { mkdirSync, writeFileSync } from 'node:fs'
import { join } from 'node:path'
import { chromium, webkit } from 'playwright'

function argument(name, standard) {
  const index = process.argv.indexOf(`--${name}`)
  return index >= 0 && process.argv[index + 1] ? process.argv[index + 1] : standard
}

const VORHER = argument('vorher', 'http://127.0.0.1:3601')
const NACHHER = argument('nachher', 'http://127.0.0.1:3602')
const AUSGABE = argument('out', '/tmp/pra/datum-konto-bilder')
const BREITEN = argument('breiten', '390,1440,320').split(',').map(Number)
const BROWSER = argument('browser', 'chromium,webkit').split(',')
const THEMA_SCHLUESSEL = 'jetnity:workspace-theme:v1'
const DOPPELPUNKT = /\b(?:Jan|Feb|Apr|Aug|Sept|Okt|Nov|Dez)\.\./

mkdirSync(AUSGABE, { recursive: true })

const ergebnisse = []
for (const browserName of BROWSER) {
  const browser = await (browserName === 'webkit' ? webkit : chromium).launch({ headless: true })
  for (const breite of BREITEN) {
    for (const thema of ['light', 'dark']) {
      for (const [stand, basis] of [['vorher', VORHER], ['nachher', NACHHER]]) {
        const telefon = breite <= 430
        const context = await browser.newContext({
          viewport: { width: breite, height: telefon ? 844 : 900 },
          deviceScaleFactor: 2,
          isMobile: telefon,
          hasTouch: telefon,
          locale: 'de-CH',
          timezoneId: 'Europe/Zurich',
        })
        await context.addInitScript(({ schluessel, dunkel }) => {
          try {
            if (dunkel) localStorage.setItem(schluessel, 'dark')
          } catch { /* ignorieren */ }
        }, { schluessel: THEMA_SCHLUESSEL, dunkel: thema === 'dark' })
        const seite = await context.newPage()
        await seite.goto(`${basis}/reisen`, { waitUntil: 'domcontentloaded' })
        const abschnitt = seite.locator('section[aria-label="Dein nächster Schritt"]').first()
        await abschnitt.waitFor({ timeout: 20_000 })
        await seite.waitForTimeout(600)
        const satz = (await abschnitt.locator('p').nth(1).innerText()).replace(/\s+/g, ' ').trim()
        const aktivesThema = await seite.locator('[data-workspace-theme]').first().getAttribute('data-workspace-theme')
        const datei = `${stand}__${browserName}-${breite}-${thema}.png`
        await abschnitt.screenshot({ path: join(AUSGABE, datei) })
        ergebnisse.push({ stand, browser: browserName, breite, thema, aktivesThema, satz, doppelpunkt: DOPPELPUNKT.test(satz), bild: datei })
        await context.close()
      }
    }
  }
  await browser.close()
}

writeFileSync(join(AUSGABE, 'ergebnis.json'), JSON.stringify(ergebnisse, null, 2))
for (const e of ergebnisse) console.log(`${e.stand.padEnd(7)} ${e.browser}-${e.breite}-${e.thema} (Thema ${e.aktivesThema}) ${e.doppelpunkt ? 'FAIL' : 'PASS'} «${e.satz}»`)
const nachherFehler = ergebnisse.filter((e) => e.stand === 'nachher' && (e.doppelpunkt || e.aktivesThema !== e.thema))
const vorherTreffer = ergebnisse.filter((e) => e.stand === 'vorher' && e.doppelpunkt)
console.log(`Vorher: ${vorherTreffer.length}/${ergebnisse.filter((e) => e.stand === 'vorher').length} mit «..» · Nachher: ${nachherFehler.length} Fehler von ${ergebnisse.filter((e) => e.stand === 'nachher').length}`)
process.exitCode = nachherFehler.length === 0 ? 0 : 1
