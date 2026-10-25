// Disposable mounted proof for the two admin operations boards.
// Local component harness only. It does not sign in, call /api/admin, or prove RLS.
import { createHash } from 'node:crypto'
import { execFileSync } from 'node:child_process'
import { createServer } from 'node:http'
import { createRequire } from 'node:module'
import { tmpdir } from 'node:os'
import { existsSync, mkdirSync, readFileSync, writeFileSync } from 'node:fs'
import { join } from 'node:path'

import { build } from 'esbuild'
import { chromium } from 'playwright'

const require = createRequire(import.meta.url)
const wurzel = process.cwd()
const nachweis = join(wurzel, 'docs/evidence/admin-operations-evidence-lifecycle-completion-1')
const BASIS = Date.parse('2026-10-25T02:00:00.000Z')
const LANG = 'Nachweisgrenze'.repeat(280)
const browserPfad = process.env.OPERATIONS_EVIDENCE_CHROMIUM

const namen = {
  app: 'App / Deployment',
  vercel: 'Vercel',
  supabase: 'Supabase',
  github: 'GitHub / CI',
  infomaniak: 'Infomaniak',
  'provider-ops': 'Provider-Ops',
  'kill-switch': 'Kill-Switch-Vertrag',
  'cost-guard': 'Cost Guard',
  'model-usage': 'Modellnutzung',
}

function iso(ms) {
  return new Date(ms).toISOString()
}

function healthBericht(patch = {}) {
  const checkedAt = patch.checkedAt ?? iso(BASIS)
  const karte = (id, extra = {}) => ({
    id,
    name: namen[id],
    status: extra.status ?? (id === 'app' ? 'unknown' : 'not_configured'),
    source: 'mounted-fixture',
    checkedAt: extra.checkedAt ?? checkedAt,
    freshness: extra.freshness ?? { state: 'fresh', ageMs: 0, ttlMs: id === 'github' || id === 'infomaniak' ? 300_000 : id === 'vercel' ? 120_000 : 60_000 },
    summary: extra.summary ?? `${id} Kurzbefund`,
    proves: extra.proves ?? `${id} belegt nur diese Prüfung.`,
    doesNotProve: extra.doesNotProve ?? `${id} belegt nicht den übrigen Betrieb.`,
    ...(extra.detail ? { detail: extra.detail } : {}),
    ...(extra.metadata ? { metadata: extra.metadata } : {}),
    ...(extra.checks ? { checks: extra.checks } : {}),
  })
  const app = karte('app', {
    summary: patch.summary ?? 'App Kurzbefund',
    proves: patch.proves ?? 'App belegt nur den Prozess.',
    checks: patch.checks ?? [{
      id: 'app-prozess',
      name: 'App-Prozess',
      status: 'healthy',
      source: 'mounted-fixture',
      freshness: patch.checkFreshness ?? { state: 'fresh', ageMs: 0, ttlMs: 60_000 },
      summary: 'Prozess geprüft.',
      proves: 'Nur die Prozessantwort.',
      doesNotProve: 'Kein Deployment.',
    }],
    ...(patch.app ?? {}),
  })
  return {
    checkedAt,
    writeActions: [],
    items: [app, karte('vercel'), karte('supabase'), karte('github'), karte('infomaniak', patch.infomaniak ?? {})],
  }
}

function opsBericht(patch = {}) {
  const checkedAt = patch.checkedAt ?? iso(BASIS)
  const karte = (id, extra = {}) => ({
    id,
    name: namen[id],
    status: extra.status ?? (id === 'model-usage' ? 'empty' : 'foundation_only'),
    source: 'mounted-fixture',
    checkedAt: extra.checkedAt ?? checkedAt,
    freshness: extra.freshness ?? { state: 'fresh', ageMs: 0, ttlMs: id === 'model-usage' ? 120_000 : 60_000 },
    summary: extra.summary ?? `${id} Kurzbefund`,
    proves: extra.proves ?? `${id} belegt nur diese Grundlage.`,
    doesNotProve: extra.doesNotProve ?? `${id} belegt keinen Live-Betrieb.`,
    ...(extra.metadata ? { metadata: extra.metadata } : {}),
    ...(extra.checks ? { checks: extra.checks } : {}),
  })
  return {
    checkedAt,
    writeActions: [],
    items: [
      karte('provider-ops', {
        summary: patch.summary ?? 'Provider Kurzbefund',
        proves: patch.proves ?? 'Nur den S1-Vertrag.',
        checks: patch.checks ?? [{
          id: 'domain-flights',
          name: 'Flights',
          status: 'available',
          source: 'mounted-fixture',
          freshness: patch.checkFreshness ?? { state: 'fresh', ageMs: 0, ttlMs: 60_000 },
          summary: 'Test-Capability.',
          proves: 'Nur den Testzustand.',
          doesNotProve: 'Keine Production.',
        }],
        ...(patch.app ?? {}),
      }),
      karte('kill-switch'),
      karte('cost-guard'),
      karte('model-usage'),
    ],
  }
}

function bericht(board, patch) {
  return board === 'health' ? healthBericht(patch) : opsBericht(patch)
}

function markiert(board, name) {
  const wert = bericht(board, {})
  wert.items[0].checks[0].name = name
  return wert
}

function karteSel(board) {
  return board === 'health' ? '[data-health-id="app"]' : '[data-ops-id="provider-ops"]'
}

function kindSel(board) {
  return board === 'health' ? '[data-health-check="app-prozess"]' : '[data-ops-check="domain-flights"]'
}

function frischeAttr(board) {
  return board === 'health' ? 'data-health-freshness' : 'data-ops-freshness'
}

function alterAttr(board) {
  return board === 'health' ? 'data-health-age-ms' : 'data-ops-age-ms'
}

async function css() {
  const postcss = (await import('postcss')).default
  const tailwindcss = (await import('tailwindcss')).default
  const nesting = (await import('tailwindcss/nesting/index.js')).default
  const autoprefixer = (await import('autoprefixer')).default
  const from = join(wurzel, 'styles/globals.css')
  const ergebnis = await postcss([
    nesting(),
    tailwindcss(require(join(wurzel, 'tailwind.config.js'))),
    autoprefixer(),
  ]).process(readFileSync(from, 'utf8'), { from })
  return ergebnis.css
}

function zielVerzeichnis() {
  mkdirSync(nachweis, { recursive: true })
  const bisher = join(nachweis, 'result.json')
  if (!existsSync(bisher)) return nachweis
  try {
    const alt = JSON.parse(readFileSync(bisher, 'utf8'))
    if (alt.ok === false) {
      const neu = join(nachweis, `run-${Date.now()}`)
      mkdirSync(neu, { recursive: true })
      return neu
    }
  } catch {
    const neu = join(nachweis, `run-${Date.now()}`)
    mkdirSync(neu, { recursive: true })
    return neu
  }
  return nachweis
}

const faelle = []
const beweise = []

function fall(name, boards, fn) {
  for (const board of boards) faelle.push({ name: `${board}:${name}`, board, fn })
}

const beide = ['health', 'ops']

fall('anfang-gueltig-ohne-automatischen-abruf', beide, async ({ page, board }) => {
  await warte(page, (sel) => document.querySelector(sel), karteSel(board), 'Karte fehlt')
  await gleich(page, '[data-operations-phase]', 'data-operations-phase', 'aktuell')
  await gleich(page, '[data-operations-pending]', 'data-operations-pending', 'false')
  if (await abrufe(page) !== 0) throw new Error('Mount hat abgerufen')
})

fall('anfang-ungueltig', beide, async ({ page }) => {
  await warte(page, () => document.querySelector('[data-operations-phase]')?.getAttribute('data-operations-phase') === 'fehler', null, 'kein Fehler')
  if (await page.locator('[data-health-id],[data-ops-id]').count()) throw new Error('Karte trotz ungültiger Props')
  if ((await page.locator('[role="alert"]').innerText()).length === 0) throw new Error('keine Fehlermeldung')
  if (await abrufe(page) !== 0) throw new Error('ungültige Props haben abgerufen')
})

fall('prueft-und-explizites-get-schlaegt-verspaetete-props', beide, async ({ page, board }) => {
  await gleich(page, '[data-operations-phase]', 'data-operations-phase', 'prueft')
  await gleich(page, '[data-operations-pending]', 'data-operations-pending', 'false')
  if (await page.locator(karteSel(board)).count()) throw new Error('Karte während prüft')
  const knopf = page.getByRole('button', { name: 'Erneut prüfen' })
  if (await knopf.isDisabled()) throw new Error('Knopf während der Prop-Prüfung gesperrt')
  await knopf.click()
  await gleich(page, '[data-operations-pending]', 'data-operations-pending', 'true')
  if (await abrufe(page) !== 1) throw new Error('nicht genau ein GET')
  await propsFrei(page)
  if (await page.locator(karteSel(board)).count()) throw new Error('verspätete Props haben Karten gezeigt')
  await loese(page, { status: 200, koerper: markiert(board, 'GET-SIEGT') })
  await warte(page, () => document.body.innerText.includes('GET-SIEGT'), null, 'GET-Text fehlt')
  const propName = board === 'health' ? 'App-Prozess' : 'Flights'
  if ((await page.locator('body').innerText()).includes(propName)) throw new Error('Prop-Text hat das GET überlebt')
  await gleich(page, '[data-operations-phase]', 'data-operations-phase', 'aktuell')
  await gleich(page, '[data-operations-pending]', 'data-operations-pending', 'false')
})

fall('tastatur-startet-genau-ein-get', beide, async ({ page, board }) => {
  await warte(page, (sel) => document.querySelector(sel), karteSel(board), 'Karte fehlt')
  const knopf = page.getByRole('button', { name: 'Erneut prüfen' })
  await knopf.focus()
  await page.keyboard.press('Enter')
  if (await abrufe(page) !== 1) throw new Error('Tastatur hat nicht genau einmal abgerufen')
  await loese(page, { status: 200, koerper: markiert(board, 'TASTATUR') })
  await warte(page, () => document.body.innerText.includes('TASTATUR'), null, 'Tastatur-GET fehlt')
})

fall('doppelklick-ein-get', beide, async ({ page, board }) => {
  await warte(page, (sel) => document.querySelector(sel), karteSel(board), 'Karte fehlt')
  await page.evaluate(() => {
    const knopf = document.querySelector('button')
    knopf.click()
    knopf.click()
  })
  if (await abrufe(page) !== 1) throw new Error(`Doppelklick: ${await abrufe(page)}`)
  await loese(page, { status: 200, koerper: markiert(board, 'EINMAL') })
  await warte(page, () => document.body.innerText.includes('EINMAL'), null, 'ein GET fehlt')
})

fall('props-wiederholen-ersetzt-nicht', beide, async ({ page, board, anfang }) => {
  await warte(page, (sel) => document.querySelector(sel), karteSel(board), 'Karte fehlt')
  const alter = await page.locator(karteSel(board)).getAttribute(alterAttr(board))
  const geprueft = await page.locator(karteSel(board)).getAttribute(board === 'health' ? 'data-health-checked-at' : 'data-ops-checked-at')
  await page.evaluate((wert) => window.__setze({ anfang: wert }), JSON.parse(JSON.stringify(anfang)))
  await page.evaluate(() => window.__nochmal())
  const andere = JSON.parse(JSON.stringify(anfang))
  andere.items[0].checks[0].name = 'ANDERER PROPS'
  await page.evaluate((wert) => window.__setze({ anfang: wert }), andere)
  const replay = markiert(board, 'REPLAY ALT')
  await page.evaluate((wert) => window.__setze({ anfang: wert }), replay)
  await page.evaluate(() => window.__setze({ anfang: { checkedAt: 'nein', items: [], writeActions: [] } }))
  await warte(page, () => document.querySelector('[data-operations-phase]')?.getAttribute('data-operations-phase') === 'aktuell', null, 'Props haben die Phase geändert')
  if (await abrufe(page) !== 0) throw new Error('Props haben abgerufen')
  const text = await page.locator('body').innerText()
  if (text.includes('ANDERER PROPS') || text.includes('REPLAY ALT')) throw new Error('Props haben den Bericht ersetzt')
  if (await page.locator(karteSel(board)).getAttribute(alterAttr(board)) !== alter) throw new Error('Alter wurde zurückgesetzt')
  if (await page.locator(karteSel(board)).getAttribute(board === 'health' ? 'data-health-checked-at' : 'data-ops-checked-at') !== geprueft) {
    throw new Error('checkedAt wurde ersetzt')
  }
})

fall('endpunkt-historisch-und-alter-lauf-verworfen', beide, async ({ page, board }) => {
  await warte(page, (sel) => document.querySelector(sel), karteSel(board), 'Karte fehlt')
  await page.getByRole('button', { name: 'Erneut prüfen' }).click()
  await page.evaluate(() => window.__setze({ endpunkt: '/api/admin/anderer-endpunkt' }))
  await warte(page, () => document.querySelector('[data-operations-phase]')?.getAttribute('data-operations-phase') === 'historisch', null, 'nicht historisch')
  await loese(page, { status: 200, koerper: markiert(board, 'ALTER LAUF') })
  await warte(page, () => document.body.innerText.includes('Die angezeigte Prüfung ist historisch und unbestätigt.'), null, 'Historie-Satz fehlt')
  if ((await page.locator('body').innerText()).includes('ALTER LAUF')) throw new Error('alter Lauf hat geschrieben')
  if (await abrufe(page) !== 1) throw new Error('Endpunktwechsel hat abgerufen')
})

fall('berechtigung-stoppt-lauf-und-holt-nicht-neu', beide, async ({ page, board }) => {
  await warte(page, (sel) => document.querySelector(sel), karteSel(board), 'Karte fehlt')
  await page.getByRole('button', { name: 'Erneut prüfen' }).click()
  await page.evaluate(() => window.__setze({ erlaubt: false }))
  await warte(page, () => !document.querySelector('button'), null, 'Knopf bleibt')
  await loese(page, { status: 200, koerper: markiert(board, 'VERBOTEN') })
  await warte(page, (name) => !document.body.innerText.includes(name), 'VERBOTEN', 'gesperrter Lauf hat geschrieben')
  await page.evaluate(() => window.__setze({ erlaubt: true }))
  await warte(page, () => Boolean(document.querySelector('button')), null, 'Knopf kommt nicht zurück')
  if (await abrufe(page) !== 1) throw new Error('Reaktivieren hat abgerufen')
})

fall('unmount-verwirft-spaete-antwort', beide, async ({ page, board }) => {
  await warte(page, (sel) => document.querySelector(sel), karteSel(board), 'Karte fehlt')
  await page.getByRole('button', { name: 'Erneut prüfen' }).click()
  await page.evaluate(() => window.__setze({ sichtbar: false }))
  await warte(page, () => document.querySelector('[data-demontiert="true"]'), null, 'nicht demontiert')
  await loese(page, { status: 200, koerper: markiert(board, 'NACH UNMOUNT') })
})

fall('neuere-verweigerung-schlaegt-aelteren-erfolg', beide, async ({ page, board }) => {
  await warte(page, (sel) => document.querySelector(sel), karteSel(board), 'Karte fehlt')
  await page.getByRole('button', { name: 'Erneut prüfen' }).click()
  await page.evaluate(() => window.__setze({ endpunkt: '/api/admin/zweiter' }))
  await page.getByRole('button', { name: 'Erneut prüfen' }).click()
  await loese(page, { status: 403, kaputt: true })
  await loeseErsten(page, { status: 200, koerper: markiert(board, 'AELTERER ERFOLG') })
  await warte(page, () => document.querySelector('[data-operations-phase]')?.getAttribute('data-operations-phase') === 'verweigert', null, 'nicht verweigert')
  if (await page.locator(karteSel(board)).count()) throw new Error('älterer Erfolg hat Karten zurückgebracht')
})

fall('neuerer-erfolg-schlaegt-aeltere-verweigerung', beide, async ({ page, board }) => {
  await warte(page, (sel) => document.querySelector(sel), karteSel(board), 'Karte fehlt')
  await page.getByRole('button', { name: 'Erneut prüfen' }).click()
  await page.evaluate(() => window.__setze({ endpunkt: '/api/admin/zweiter' }))
  await page.getByRole('button', { name: 'Erneut prüfen' }).click()
  await loese(page, { status: 200, koerper: markiert(board, 'NEUER ERFOLG') })
  await loeseErsten(page, { status: 401, kaputt: true })
  await warte(page, () => document.body.innerText.includes('NEUER ERFOLG'), null, 'neuer Erfolg fehlt')
  await gleich(page, '[data-operations-phase]', 'data-operations-phase', 'aktuell')
})

fall('verweigerung-bleibt-durch-503-netz-und-kaputtes-200', beide, async ({ page, board }) => {
  await warte(page, (sel) => document.querySelector(sel), karteSel(board), 'Karte fehlt')
  await page.getByRole('button', { name: 'Erneut prüfen' }).click()
  await loese(page, { status: 403, koerper: { message: 'Für diese Ansicht fehlt die Berechtigung.' } })
  await warte(page, () => document.querySelector('[data-operations-phase]')?.getAttribute('data-operations-phase') === 'verweigert', null, '403 fehlt')
  for (const spec of [
    { status: 503, koerper: { message: 'Wartung' } },
    { netz: true },
    { status: 200, koerper: { checkedAt: 'nein' } },
  ]) {
    await page.getByRole('button', { name: 'Erneut prüfen' }).click()
    await loese(page, spec)
    await warte(page, () => document.querySelector('[data-operations-phase]')?.getAttribute('data-operations-phase') === 'verweigert', null, 'Verriegelung verloren')
    if (await page.locator(karteSel(board)).count()) throw new Error('Karten nach Folgefehler')
  }
  await page.getByRole('button', { name: 'Erneut prüfen' }).click()
  await loese(page, { status: 200, koerper: markiert(board, 'WIEDER DA') })
  await warte(page, () => document.body.innerText.includes('WIEDER DA'), null, 'Recovery fehlt')
  await page.evaluate(() => window.__setze({ erlaubt: false }))
  if (await page.locator('button').count()) throw new Error('Knopf trotz fehlender Berechtigung')
})

fall('ttl-kind-und-ruecklauf', beide, async ({ page, board }) => {
  await warte(page, (sel) => document.querySelector(sel)?.getAttribute(sel.startsWith('[data-health') ? 'data-health-freshness' : 'data-ops-freshness') === 'fresh', karteSel(board), 'nicht fresh')
  await page.clock.runFor(59_999)
  await page.evaluate(() => document.dispatchEvent(new Event('visibilitychange')))
  await warte(page, (wert) => document.querySelector(wert.sel)?.getAttribute(wert.attr) === 'fresh', { sel: karteSel(board), attr: frischeAttr(board) }, 'vor TTL nicht fresh')
  await page.clock.runFor(1)
  await page.evaluate(() => document.dispatchEvent(new Event('visibilitychange')))
  await warte(page, (wert) => {
    const knoten = document.querySelector(wert.sel)
    return knoten?.getAttribute(wert.attr) === 'fresh' && knoten?.getAttribute(wert.alter) === '60000'
  }, { sel: karteSel(board), attr: frischeAttr(board), alter: alterAttr(board) }, 'TTL-Grenze nicht fresh')
  await page.clock.runFor(1)
  await page.evaluate(() => document.dispatchEvent(new Event('visibilitychange')))
  await warte(page, (wert) => document.querySelector(wert.sel)?.getAttribute(wert.attr) === 'stale', { sel: karteSel(board), attr: frischeAttr(board) }, 'nach TTL nicht stale')
  if (await page.locator(kindSel(board)).getAttribute(frischeAttr(board)) === 'fresh') throw new Error('älteres Kind wurde fresh')
  if (await abrufe(page) !== 0) throw new Error('Uhr hat abgerufen')
})

fall('ruecklauf-behaelt-stale', beide, async ({ page, board }) => {
  await warte(page, (wert) => document.querySelector(wert.sel)?.getAttribute(wert.attr) === 'stale', { sel: karteSel(board), attr: frischeAttr(board) }, 'Hinweis nicht stale')
  const vorher = Number(await page.locator(karteSel(board)).getAttribute(alterAttr(board)))
  await page.clock.setSystemTime(BASIS - 110_000)
  await page.evaluate(() => document.dispatchEvent(new Event('visibilitychange')))
  await page.clock.runFor(20)
  const nachher = Number(await page.locator(karteSel(board)).getAttribute(alterAttr(board)))
  if (await page.locator(karteSel(board)).getAttribute(frischeAttr(board)) !== 'stale') throw new Error('Rücklauf wurde fresh')
  if (!(nachher >= vorher && nachher >= 120_000)) throw new Error(`Boden fiel: ${vorher} -> ${nachher}`)
  if (await abrufe(page) !== 0) throw new Error('Rücklauf hat abgerufen')
})

fall('uhr-nach-gutem-tick-und-zukunft', beide, async ({ page, board }) => {
  await warte(page, (wert) => document.querySelector(wert.sel)?.getAttribute(wert.attr) === 'fresh', { sel: karteSel(board), attr: frischeAttr(board) }, 'Start nicht fresh')
  await page.clock.runFor(1000)
  await page.clock.setSystemTime(BASIS - 5_000)
  await page.evaluate(() => {
    performance.now = () => 0
    document.dispatchEvent(new Event('visibilitychange'))
  })
  await warte(page, (wert) => document.querySelector(wert.sel)?.getAttribute(wert.attr) !== 'fresh', { sel: karteSel(board), attr: frischeAttr(board) }, 'Uhr-Rückfall blieb fresh')
  await warte(page, (wert) => document.querySelector(wert.sel)?.getAttribute(wert.attr) !== 'fresh', { sel: kindSel(board), attr: frischeAttr(board) }, 'Kind blieb fresh')
  await page.clock.setSystemTime(BASIS + 20_000)
  await page.evaluate(() => {
    performance.now = () => 80_000
    document.dispatchEvent(new Event('visibilitychange'))
  })
  if (await page.locator(karteSel(board)).getAttribute(frischeAttr(board)) === 'fresh') throw new Error('Uhr-Rückkehr wurde fresh')
  if (await abrufe(page) !== 0) throw new Error('Uhrfall hat abgerufen')
})

fall('zukunft-bleibt-nicht-gruen', beide, async ({ page, board }) => {
  await warte(page, (wert) => document.querySelector(wert.sel)?.getAttribute(wert.attr) === 'unknown', { sel: karteSel(board), attr: frischeAttr(board) }, 'Zukunft nicht unknown')
  const gruen = board === 'health' ? 'data-health-green' : 'data-ops-green'
  if (await page.locator(kindSel(board)).getAttribute(frischeAttr(board)) === 'fresh') throw new Error('Zukunfts-Check ist fresh')
  if (await page.locator(kindSel(board)).getAttribute(gruen) !== 'false') throw new Error('Zukunfts-Check ist grün')
  await page.clock.setSystemTime(BASIS + 180_000)
  await page.evaluate(() => document.dispatchEvent(new Event('visibilitychange')))
  await page.clock.runFor(1000)
  if (await page.locator(karteSel(board)).getAttribute(frischeAttr(board)) === 'fresh') throw new Error('Zukunft wurde später fresh')
  if (await abrufe(page) !== 0) throw new Error('Zukunft hat abgerufen')
})

fall('tab-zurueck-altert-ohne-abruf', beide, async ({ page, board }) => {
  await warte(page, (sel) => document.querySelector(sel), karteSel(board), 'Karte fehlt')
  const vorher = Number(await page.locator(karteSel(board)).getAttribute(alterAttr(board)))
  await page.clock.runFor(5_000)
  await page.evaluate(() => {
    document.dispatchEvent(new Event('visibilitychange'))
    window.dispatchEvent(new Event('pageshow'))
  })
  const nachher = Number(await page.locator(karteSel(board)).getAttribute(alterAttr(board)))
  if (!(nachher >= vorher + 5_000)) throw new Error(`Tab hat nicht gealtert: ${vorher} -> ${nachher}`)
  if (await abrufe(page) !== 0) throw new Error('Tab hat abgerufen')
})

async function gleich(page, sel, attr, erwartet) {
  await warte(page, (wert) => document.querySelector(wert.sel)?.getAttribute(wert.attr) === wert.wert, { sel, attr, wert: erwartet }, `${sel} ${attr} != ${erwartet}`)
}

async function warte(page, fn, arg, label) {
  try {
    await page.waitForFunction(fn, arg, { timeout: 8_000 })
  } catch (error) {
    const stand = await page.evaluate(() => ({
      phase: document.querySelector('[data-operations-phase]')?.getAttribute('data-operations-phase'),
      pending: document.querySelector('[data-operations-pending]')?.getAttribute('data-operations-pending'),
      text: document.body?.innerText?.slice(0, 400) ?? '',
      abrufe: window.__abrufe?.length ?? null,
    })).catch(() => ({ text: 'seite weg' }))
    throw new Error(`${label} | ${JSON.stringify(stand)} | ${error instanceof Error ? error.message : error}`)
  }
}

async function abrufe(page) {
  return page.evaluate(() => window.__abrufe.length)
}

async function loese(page, spec) {
  const ok = await page.evaluate((wert) => {
    const eintrag = window.__wartend.pop()
    if (!eintrag) return false
    if (wert.netz) {
      eintrag.reject(new TypeError('network'))
      return true
    }
    eintrag.resolve({
      ok: wert.status >= 200 && wert.status < 300,
      status: wert.status,
      json: async () => {
        if (wert.kaputt) throw new SyntaxError('kaputt')
        return wert.koerper
      },
    })
    return true
  }, spec)
  if (!ok) throw new Error('kein wartender Abruf')
}

async function loeseErsten(page, spec) {
  const ok = await page.evaluate((wert) => {
    const eintrag = window.__wartend.shift()
    if (!eintrag) return false
    eintrag.resolve({
      ok: wert.status >= 200 && wert.status < 300,
      status: wert.status,
      json: async () => {
        if (wert.kaputt) throw new SyntaxError('kaputt')
        return wert.koerper
      },
    })
    return true
  }, spec)
  if (!ok) throw new Error('kein erster Abruf')
}

async function propsFrei(page) {
  await page.evaluate(() => {
    const frei = window.__propsWarten.shift()
    if (frei) frei()
  })
}

function anfangFuer(name, board) {
  if (name.endsWith('anfang-ungueltig')) return { checkedAt: 'nein', items: [], writeActions: [] }
  if (name.endsWith('ttl-kind-und-ruecklauf')) {
    return bericht(board, {
      checkFreshness: { state: 'stale', ageMs: 90_000, ttlMs: 60_000 },
    })
  }
  if (name.endsWith('ruecklauf-behaelt-stale')) {
    return bericht(board, { checkedAt: iso(BASIS - 120_000) })
  }
  if (name.endsWith('uhr-nach-gutem-tick-und-zukunft')) {
    return bericht(board, { checkedAt: iso(BASIS - 30_000) })
  }
  if (name.endsWith('zukunft-bleibt-nicht-gruen')) {
    return bericht(board, { checkedAt: iso(BASIS + 120_000) })
  }
  if (name.includes('ueberlauf') || name.includes('beleg')) {
    return bericht(board, { proves: LANG, summary: LANG, app: { metadata: { beleg: LANG } } })
  }
  return bericht(board, {})
}

function sperreFuer(name) {
  return name.includes('prueft-und-explizites-get')
}

async function main() {
  const verzeichnis = zielVerzeichnis()
  const kopf = execFileSync('git', ['rev-parse', 'HEAD'], { cwd: wurzel, encoding: 'utf8' }).trim()
  const ergebnis = {
    ok: false,
    head: kopf,
    befehl: 'node scripts/admin-operations-evidence-lifecycle-completion-1/run.mjs',
    browserPfad: browserPfad ?? null,
    hinweis: 'Lokaler Komponentenbeweis. Kein gehostetes Konto, kein Next-Router, kein Supabase, kein RLS, keine Production, kein Launch.',
    fixtureGrenze: 'fetch ist ein lokales aufgeschobenes Fenster-Stub. Die synthetische Prop-Prüfung wartet nur, wenn das Harness window.__JETNITY_OPS_PROPS_SPERRE__ setzt. Produktion setzt das nicht und ruft beim Mount nicht ab.',
    faelle: [],
  }
  if (!browserPfad || !existsSync(browserPfad)) {
    ergebnis.fehler = 'OPERATIONS_EVIDENCE_CHROMIUM fehlt oder ist keine Datei. Der Beweis wird nicht übersprungen.'
    writeFileSync(join(verzeichnis, 'result.json'), JSON.stringify(ergebnis, null, 2))
    process.exitCode = 1
    console.error(ergebnis.fehler)
    return
  }

  const temp = join(tmpdir(), `jetnity-ops-evidence-${process.pid}`)
  mkdirSync(temp, { recursive: true })
  await build({
    entryPoints: [join(wurzel, 'scripts/admin-operations-evidence-lifecycle-completion-1/harness.tsx')],
    outfile: join(temp, 'harness.js'),
    bundle: true,
    format: 'iife',
    platform: 'browser',
    jsx: 'automatic',
    define: { 'process.env.NODE_ENV': '"production"' },
    plugins: [{
      name: 'grenzen',
      setup(api) {
        api.onResolve({ filter: /.*/ }, (args) => {
          if (args.path === 'server-only') {
            return { path: join(wurzel, 'scripts/admin-operations-evidence-lifecycle-completion-1/leer.ts') }
          }
          if (args.path.startsWith('@/')) {
            const basis = join(wurzel, args.path.slice(2))
            for (const endung of ['.tsx', '.ts', '.js', '.mjs']) {
              if (existsSync(basis + endung)) return { path: basis + endung }
              if (existsSync(join(basis, `index${endung}`))) return { path: join(basis, `index${endung}`) }
            }
          }
          return null
        })
      },
    }],
    logLevel: 'silent',
  })
  const harnessJs = readFileSync(join(temp, 'harness.js'))
  const stil = await css()
  const html = '<!doctype html><html lang="de"><meta charset="utf-8"><meta name="viewport" content="width=device-width, initial-scale=1"><title>Operations Evidence</title><link rel="stylesheet" href="/styles.css"><body style="margin:0"><div id="root"></div><script src="/harness.js"></script>'
  const server = createServer((req, res) => {
    const pfad = new URL(req.url || '/', 'http://127.0.0.1').pathname
    if (pfad === '/harness.js') {
      res.writeHead(200, { 'content-type': 'text/javascript; charset=utf-8', 'cache-control': 'no-store' })
      res.end(harnessJs)
      return
    }
    if (pfad === '/styles.css') {
      res.writeHead(200, { 'content-type': 'text/css; charset=utf-8', 'cache-control': 'no-store' })
      res.end(stil)
      return
    }
    if (pfad === '/') {
      res.writeHead(200, { 'content-type': 'text/html; charset=utf-8', 'cache-control': 'no-store' })
      res.end(html)
      return
    }
    res.writeHead(404)
    res.end('not found')
  })
  await new Promise((resolve) => server.listen(0, '127.0.0.1', resolve))
  const adresse = server.address()
  const basis = `http://127.0.0.1:${adresse.port}/`
  const browser = await chromium.launch({
    executablePath: browserPfad,
    headless: true,
    args: ['--no-sandbox', '--disable-dev-shm-usage'],
  })
  try {
    for (const eintrag of faelle) {
      const anfang = anfangFuer(eintrag.name, eintrag.board)
      const context = await browser.newContext({
        viewport: { width: 390, height: 844 },
        reducedMotion: 'reduce',
      })
      await context.clock.install({ time: BASIS })
      if (eintrag.name.endsWith('ttl-kind-und-ruecklauf')) await context.clock.pauseAt(BASIS)
      await context.addInitScript((wert) => {
        window.__FALL__ = wert.fall
        window.__abrufe = []
        window.__wartend = []
        window.fetch = (url, init) => {
          window.__abrufe.push({ url: String(url), cache: init && init.cache })
          return new Promise((resolve, reject) => {
            window.__wartend.push({ resolve, reject, url: String(url) })
          })
        }
        if (wert.sperre) {
          window.__propsWarten = []
          window.__JETNITY_OPS_PROPS_SPERRE__ = () => new Promise((resolve) => {
            window.__propsWarten.push(resolve)
          })
        }
      }, {
        fall: {
          board: eintrag.board,
          anfang,
          endpunkt: eintrag.board === 'health' ? '/api/admin/system-health' : '/api/admin/provider-ops',
          erlaubt: true,
          sichtbar: true,
        },
        sperre: sperreFuer(eintrag.name),
      })
      const page = await context.newPage()
      const fehler = []
      page.on('pageerror', (error) => fehler.push(String(error)))
      try {
        await page.goto(basis, { waitUntil: 'load' })
        await eintrag.fn({ page, board: eintrag.board, anfang })
        if (fehler.length) throw new Error(fehler.join('\n'))
        ergebnis.faelle.push({ name: eintrag.name, ok: true })
        console.log(`ok ${eintrag.name}`)
      } catch (error) {
        const meldung = error instanceof Error ? error.message : String(error)
        ergebnis.faelle.push({ name: eintrag.name, ok: false, fehler: meldung, seitenfehler: fehler })
        console.error(`fail ${eintrag.name}: ${meldung}`)
      } finally {
        await context.close()
      }
    }

    const breiten = [320, 360, 390, 768, 1280]
    for (const board of beide) {
      for (const breite of breiten) {
        for (const schrift of breite === 320 ? [16, 32] : [16]) {
          const context = await browser.newContext({
            viewport: { width: breite, height: 900 },
            reducedMotion: 'reduce',
          })
          await context.addInitScript((wert) => {
            window.__FALL__ = wert
            window.__abrufe = []
            window.__wartend = []
            window.fetch = () => new Promise(() => {})
          }, {
            board,
            anfang: bericht(board, { proves: LANG, summary: LANG, app: { metadata: { beleg: LANG } } }),
            endpunkt: '/api/admin/system-health',
            erlaubt: true,
            sichtbar: true,
          })
          const page = await context.newPage()
          const name = `${board}:beleg-${breite}${schrift === 32 ? '-200' : ''}`
          try {
            await page.goto(basis, { waitUntil: 'load' })
            if (schrift === 32) await page.evaluate(() => { document.documentElement.style.fontSize = '32px' })
            await warte(page, (sel) => document.querySelector(sel), karteSel(board), 'Belegkarte fehlt')
            await page.locator('summary').first().click()
            await page.waitForFunction(() => document.querySelector('details')?.open === true)
            const mass = await page.evaluate(() => ({
              scroll: document.documentElement.scrollWidth,
              client: document.documentElement.clientWidth,
            }))
            if (mass.scroll > mass.client + 1) throw new Error(`Overflow ${mass.scroll}>${mass.client}`)
            if (await abrufe(page) !== 0) throw new Error('Beleg hat abgerufen')
            const datei = `${board}-${breite}${schrift === 32 ? '-root-32' : ''}.png`
            await page.screenshot({ path: join(verzeichnis, datei), fullPage: true })
            beweise.push(datei)
            ergebnis.faelle.push({ name, ok: true, ...mass, schrift, breite })
            console.log(`ok ${name}`)
          } catch (error) {
            const meldung = error instanceof Error ? error.message : String(error)
            ergebnis.faelle.push({ name, ok: false, fehler: meldung })
            console.error(`fail ${name}: ${meldung}`)
          } finally {
            await context.close()
          }
        }
      }
    }
  } finally {
    await browser.close()
    server.close()
  }

  const dateien = [
    'components/admin/system-health/SystemHealthBoard.tsx',
    'components/admin/provider-ops/ProviderOpsBoard.tsx',
    'components/admin/operations/useOperationsReport.ts',
    'lib/admin/operations-read-lifecycle.ts',
    'lib/admin/operations-report-validation.ts',
  ]
  ergebnis.digests = Object.fromEntries(dateien.map((datei) => [
    datei,
    createHash('sha256').update(readFileSync(join(wurzel, datei))).digest('hex'),
  ]))
  ergebnis.browser = browser.version?.() 
  ergebnis.exit = ergebnis.faelle.every((fallEintrag) => fallEintrag.ok) ? 0 : 1
  ergebnis.ok = ergebnis.exit === 0
  ergebnis.anzahl = ergebnis.faelle.length
  ergebnis.bestanden = ergebnis.faelle.filter((fallEintrag) => fallEintrag.ok).length
  ergebnis.viewports = [320, 360, 390, 768, 1280]
  ergebnis.rootSchrift = [16, 32]
  ergebnis.reducedMotion = 'reduce'
  ergebnis.screenshots = beweise
  ergebnis.uhr = iso(BASIS)
  writeFileSync(join(verzeichnis, 'result.json'), JSON.stringify(ergebnis, null, 2))
  console.log(`result ${ergebnis.bestanden}/${ergebnis.anzahl} -> ${verzeichnis}`)
  process.exitCode = ergebnis.exit
}

const versionHalter = { version: null }
const originalLaunch = chromium.launch.bind(chromium)
chromium.launch = async (...args) => {
  const browser = await originalLaunch(...args)
  versionHalter.version = browser.version()
  return browser
}

await main().catch((error) => {
  console.error(error)
  process.exitCode = 1
})
