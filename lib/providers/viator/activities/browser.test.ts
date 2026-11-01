import assert from 'node:assert/strict'
import { createRequire } from 'node:module'
import { createServer, type Server } from 'node:http'
import { mkdirSync, readFileSync } from 'node:fs'
import { tmpdir } from 'node:os'
import { join } from 'node:path'
import { after, before, describe, test } from 'node:test'
import type { AddressInfo } from 'node:net'

import * as esbuild from 'esbuild'
import { chromium, type Browser, type Page } from 'playwright'

import { mountViatorHarness } from '@/scripts/viator-s2-native-integration/browser-harness'

test('the browser harness stays imported for reachability', () => {
  assert.equal(typeof mountViatorHarness, 'function')
})

const ARTIFACTS = process.env.VIATOR_S2_ARTIFACT_DIR ?? join(tmpdir(), 'viator-s2')

type Messwert = {
  angeboteVorSuche?: boolean
  ok: boolean
  reason?: string
  rechts?: number[]
  sectionRechts?: number
  dlScroll?: number
  dlClient?: number
  mainPad?: number
  text?: { left: number; right: number }
  knopf?: { left: number; right: number }
  gruppeHoehe?: number
  auswahlHoehe?: number
  sucheY?: number
  label?: string
  optionen?: number
}

function alsMesswert(wert: unknown): Messwert {
  if (!wert || typeof wert !== 'object' || typeof (wert as { ok?: unknown }).ok !== 'boolean') {
    return { ok: false, reason: 'missing' }
  }
  return wert as Messwert
}

const BEDIENUNG = `(() => {
  const section = document.querySelector('section[aria-label="Aktivitäten"]')
  const panel = document.querySelector('section[aria-label="Viator-Prüfung"]')
  if (!section || !panel) return { ok: false, reason: 'missing' }
  const sectionBox = section.getBoundingClientRect()
  const textRects = (el) => {
    const range = document.createRange()
    range.selectNodeContents(el)
    return [...range.getClientRects()].filter((rect) => rect.width > 0 && rect.height > 0)
  }
  const inside = (rects, box) => rects.length > 0 && rects.every((rect) => (
    rect.left >= box.left - 1 && rect.right <= box.right + 1 && rect.top >= box.top - 1 && rect.bottom <= box.bottom + 1
  ))
  const button = (root, name) => [...root.querySelectorAll('button')].find((el) => (el.textContent || '').includes(name))
  const angebot = button(section, 'Angebot prüfen')
  const verfuegbar = button(panel, 'Verfügbarkeit prüfen')
  const auswahl = section.querySelector('#activity-day-select')
  const main = document.querySelector('main')
  const mainPad = main ? Number.parseFloat(getComputedStyle(main).paddingLeft) : 0
  const angebotOk = Boolean(angebot) && inside(textRects(angebot), angebot.getBoundingClientRect()) && inside(textRects(angebot), sectionBox)
  const verfuegbarBox = verfuegbar ? verfuegbar.getBoundingClientRect() : null
  const verfuegbarText = verfuegbar ? textRects(verfuegbar) : []
  const verfuegbarOk = Boolean(verfuegbarBox) && inside(verfuegbarText, verfuegbarBox) && inside(verfuegbarText, sectionBox)
  const auswahlBox = auswahl ? auswahl.getBoundingClientRect() : null
  const auswahlOk = Boolean(auswahlBox) && auswahlBox.height < 200 && auswahlBox.height > 20 && inside([auswahlBox], sectionBox)
  const vereinigt = verfuegbarText.reduce((stand, rect) => ({
    left: Math.min(stand.left, rect.left),
    right: Math.max(stand.right, rect.right),
  }), { left: Infinity, right: -Infinity })
  return {
    ok: angebotOk && verfuegbarOk && auswahlOk && mainPad >= 16,
    mainPad: Math.round(mainPad),
    text: Number.isFinite(vereinigt.left) ? { left: Math.round(vereinigt.left * 100) / 100, right: Math.round(vereinigt.right * 100) / 100 } : null,
    knopf: verfuegbarBox ? { left: Math.round(verfuegbarBox.left * 100) / 100, right: Math.round(verfuegbarBox.right * 100) / 100 } : null,
    auswahlHoehe: auswahlBox ? Math.round(auswahlBox.height) : 0,
    sectionRechts: Math.round(sectionBox.right),
  }
})()`

const TEXT_GRENZEN = `(() => {
  const wert = document.querySelector('[data-aktivitaet-ziel-name]')
  const auswahl = document.querySelector('#activity-day-select')
  const section = document.querySelector('section[aria-label="Aktivitäten"]')
  if (!wert || !auswahl || !section) return { ok: false, reason: 'missing' }
  const box = section.getBoundingClientRect()
  const messen = (el) => {
    const range = document.createRange()
    range.selectNodeContents(el)
    return [...range.getClientRects()].filter((rect) => rect.width > 0 && rect.height > 0)
  }
  const auswahlBox = auswahl.getBoundingClientRect()
  const rects = [...messen(wert), auswahlBox]
  const ausserhalb = rects.some((rect) => rect.right > box.right + 1 || rect.left < box.left - 1)
  return {
    ok: rects.length > 0 && !ausserhalb && section.scrollWidth <= section.clientWidth + 1,
    rechts: rects.map((rect) => Math.round(rect.right)),
    sectionRechts: Math.round(box.right),
    dlScroll: section.scrollWidth,
    dlClient: section.clientWidth,
  }
})()`

const STIL = `(() => {
  const shell = document.querySelector('.workspace-shell')
  const html = getComputedStyle(document.documentElement)
  const schale = shell ? getComputedStyle(shell) : null
  return {
    ok: Boolean(shell)
      && shell.getAttribute('data-workspace-theme') === 'light'
      && html.backgroundColor === 'rgb(247, 252, 249)'
      && schale.colorScheme === 'light',
    hintergrund: html.backgroundColor,
    schema: schale ? schale.colorScheme : '',
  }
})()`

async function css(): Promise<string> {
  const verlangen = createRequire(import.meta.url)
  const postcss = verlangen('postcss') as (plugins: unknown[]) => {
    process: (css: string, opts: { from: string }) => Promise<{ css: string }>
  }
  const nesting = verlangen('tailwindcss/nesting') as () => unknown
  const tailwindcss = verlangen('tailwindcss') as (config: unknown) => unknown
  const autoprefixer = verlangen('autoprefixer') as () => unknown
  const config = verlangen(join(process.cwd(), 'tailwind.config.js')) as unknown
  const reihenfolge = [
    'styles/globals.css',
    'styles/white-mint.css',
    'components/workspace/workspace.css',
    'components/workspace/workspace-surfaces.css',
  ]
  const teile: string[] = []
  for (const datei of reihenfolge) {
    const from = join(process.cwd(), datei)
    const quelle = readFileSync(from, 'utf8')
    const verarbeitet = datei.endsWith('globals.css')
      ? (await postcss([nesting(), tailwindcss(config), autoprefixer()]).process(quelle, { from })).css
      : quelle
    teile.push(verarbeitet)
  }
  return teile.join('\n').replaceAll('</style', '<\\/style')
}

async function bundle(): Promise<string> {
  const gebaut = await esbuild.build({
    absWorkingDir: process.cwd(),
    entryPoints: ['scripts/viator-s2-native-integration/browser-harness.tsx'],
    bundle: true,
    write: false,
    format: 'iife',
    platform: 'browser',
    jsx: 'automatic',
    define: { 'process.env.NODE_ENV': '"production"' },
    banner: { js: 'globalThis.process=globalThis.process||{env:{NODE_ENV:"production"}};' },
    plugins: [{
      name: 'viator-shims',
      setup(build) {
        build.onResolve({ filter: /^server-only$/ }, () => ({ path: 'server-only', namespace: 'leer' }))
        build.onResolve({ filter: /^next\// }, (args) => ({ path: args.path, namespace: 'leer' }))
        build.onResolve({ filter: /^@\// }, (args) => build.resolve(join(process.cwd(), args.path.slice(2)), { resolveDir: process.cwd(), kind: args.kind }))
        build.onLoad({ filter: /.*/, namespace: 'leer' }, () => ({
          contents: [
            'export default function(){return null}',
            'export function cookies(){return { get(){return undefined}, getAll(){return []} }}',
            'export function headers(){return { get(){return null} }}',
            'export function redirect(){return null}',
            'export function useRouter(){return { push(){}, replace(){}, back(){} }}',
            'export function usePathname(){return "/"}',
            'export function useSearchParams(){return new URLSearchParams()}',
          ].join('\n'),
          loader: 'js',
        }))
      },
    }],
  })
  const js = gebaut.outputFiles[0]?.text
  if (!js) throw new Error('Viator harness bundle was empty')
  return js
}

describe('Viator activities browser harness', { timeout: 180_000 }, () => {
  let browser: Browser
  let server: Server
  let origin: string

  before(async () => {
    mkdirSync(ARTIFACTS, { recursive: true })
    const style = await css()
    const script = await bundle()
    const html = `<!doctype html><html><head><meta charset="utf-8" /><meta name="viewport" content="width=device-width, initial-scale=1" /><style>${style}</style></head><body><div id="root"></div><script>${script}</script></body></html>`
    server = createServer((_req, res) => {
      res.setHeader('content-type', 'text/html; charset=utf-8')
      res.end(html)
    })
    await new Promise<void>((resolve) => server.listen(0, '127.0.0.1', resolve))
    origin = `http://127.0.0.1:${(server.address() as AddressInfo).port}`
    try {
      browser = await chromium.launch({ headless: true, args: ['--no-sandbox', '--disable-dev-shm-usage'] })
    } catch (fehler) {
      const meldung = fehler instanceof Error ? fehler.message : String(fehler)
      if (!meldung.includes("Executable doesn't exist")) throw fehler
      browser = await chromium.launch({ headless: true, channel: 'chrome', args: ['--no-sandbox', '--disable-dev-shm-usage'] })
    }
  })

  after(async () => {
    await browser?.close()
    await new Promise<void>((resolve, reject) => server.close((error) => (error ? reject(error) : resolve())))
  })

  const evidenz = {
    hatOrt: true,
    hatKoordinaten: true,
    hatTag: true,
    hatDatum: true,
    hatBestehendePunkte: false,
    hatBelastbareZeiten: false,
    hatInteressen: false,
    hatBudget: false,
  }
  const sucheAntwort = {
    status: 'ok',
    message: 'Aktivitäten gefunden.',
    coverageNote: 'Die Abdeckung bleibt ein Hinweis.',
    evidenz,
    options: [{
      id: 'viator:10001P1',
      provider: 'viator',
      externalRef: '10001P1',
      title: 'Spaziergang durch die Altstadt',
      description: null,
      punkt: null,
      dauerMinuten: 90,
      timeslot: null,
      preis: 42,
      preisWaehrung: 'EUR',
      bewertung: null,
      bewertungenAnzahl: null,
      stornierbar: null,
      kategorien: [],
      tags: [],
      bildUrl: '/viator-local.png',
      preisRolle: 'rrp_from',
      labels: [],
      reasons: [],
      konflikt: 'unbekannt',
      locationName: 'Bangkok',
    }],
    viatorVerweise: [{
      externalRef: '10001P1',
      productUrl: 'https://www.viator.com/tours/Example/Fixture/d1-10001P1?pid=P00000000&medium=api',
    }],
  }
  const detailAntwort = {
    status: 'ok',
    message: 'Details geladen.',
    value: {
      productCode: '10001P1',
      title: 'Spaziergang',
      description: 'Kurzbeschreibung.',
      imageUrl: '/viator-local.png',
      price: null,
      productOptionCodes: ['TG1', 'TG2'],
      productOptions: [{ code: 'TG1', title: 'Morgentour' }, { code: 'TG2', title: 'Abendtour' }],
      ageBands: [{ ageBand: 'ADULT', startAge: 18, endAge: 99, minTravelersPerBooking: 1, maxTravelersPerBooking: 9 }],
      productUrl: 'https://www.viator.com/tours/Example/Fixture/d1-10001P1?pid=P00000000&medium=api',
    },
  }
  const kalenderAntwort = {
    status: 'ok',
    message: 'Kalenderhinweis.',
    value: {
      productCode: '10001P1',
      supplierCurrency: 'EUR',
      options: [{
        productOptionCode: 'TG1',
        seasons: [{
          startDate: '2026-11-01',
          endDate: '2026-11-30',
          startTimes: ['10:00'],
          unavailableDates: [],
          timedEntries: [{ startTime: '10:00', unavailableDates: [], daysOfWeek: ['MONDAY', 'TUESDAY'] }],
        }],
      }, {
        productOptionCode: 'TG2',
        seasons: [{
          startDate: '2026-11-01',
          endDate: '2026-11-30',
          startTimes: ['18:00'],
          unavailableDates: [],
          timedEntries: [{ startTime: '18:00', unavailableDates: [], daysOfWeek: ['MONDAY', 'TUESDAY'] }],
        }],
      }],
    },
  }

  async function seite(breite: number, variante: { unbenannt?: boolean } = {}): Promise<Page> {
    const page = await browser.newPage({ viewport: { width: breite, height: 900 } })
    let checks = 0
    let details = 0
    let schedules = 0
    let releaseFirst: (() => void) | null = null
    let detailFreigegeben = false
    let detailLoesen: (() => void) | null = null
    const gesendet: Array<{ currency?: string | null; productOptionCode?: string; startTime?: string }> = []
    const suchen: unknown[] = []
    let suchLaeufe = 0
    await page.route('**/*', async (route) => {
      const url = new URL(route.request().url())
      if (url.origin !== origin) return route.abort()
      if (url.pathname === '/viator-local.png') {
        return route.fulfill({
          status: 200,
          contentType: 'image/png',
          body: Buffer.from('iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mP8z8BQDwAEhQGAhKmMIQAAAABJRU5ErkJggg==', 'base64'),
        })
      }
      if (url.pathname === '/embed/viator' || url.pathname === '/embed/getyourguide') {
        return route.fulfill({ status: 200, contentType: 'text/html; charset=utf-8', body: '<!doctype html><title>widget-fixture</title>' })
      }
      if (url.pathname === '/api/activities/search') {
        const roh = route.request().postData()
        if (roh) suchen.push(JSON.parse(roh) as unknown)
        suchLaeufe += 1
        const antwort = suchLaeufe === 1
          ? sucheAntwort
          : { status: 'empty', message: 'Keine Testangebote.', options: [] }
        return route.fulfill({ status: 200, contentType: 'application/json', body: JSON.stringify(antwort) })
      }
      if (url.pathname === '/api/activities/viator/detail') {
        details += 1
        if (details === 2 && !detailFreigegeben) await new Promise<void>((resolve) => { detailLoesen = resolve })
        try {
          const detail = variante.unbenannt
          ? {
              ...detailAntwort,
              value: {
                ...detailAntwort.value,
                productOptionCodes: [],
                productOptions: [],
                optionenUnaufgeloest: true,
                productUrl: 'https://www.viator.com/tours/Example/Fixture/d1-10001P1?pid=P00000000&medium=api',
              },
            }
          : detailAntwort
        return await route.fulfill({ status: 200, contentType: 'application/json', body: JSON.stringify(detail) })
        } catch {
          return
        }
      }
      if (url.pathname === '/api/activities/viator/schedule') {
        schedules += 1
        if (schedules === 1) {
          return route.fulfill({
            status: 200,
            contentType: 'application/json',
            body: JSON.stringify({ status: 'error', message: 'Der Kalenderhinweis konnte nicht geladen werden.', value: null }),
          })
        }
        return route.fulfill({ status: 200, contentType: 'application/json', body: JSON.stringify(kalenderAntwort) })
      }
      if (url.pathname === '/api/activities/viator/check') {
        checks += 1
        const aktuell = checks
        const roh = route.request().postData()
        if (roh) gesendet.push(JSON.parse(roh) as { currency?: string | null; productOptionCode?: string; startTime?: string })
        if (aktuell === 1) await new Promise<void>((resolve) => { releaseFirst = resolve })
        try {
          await route.fulfill({
            status: 200,
            contentType: 'application/json',
            body: JSON.stringify({
              status: 'ok',
              message: aktuell === 1 ? 'alte Prüfung' : 'neue Prüfung',
              value: { available: true, price: { amount: aktuell === 1 ? 111 : 80, currency: 'EUR', checkoutCurrencyConfirmed: false } },
            }),
          })
        } catch {
          return
        }
        return
      }
      return route.continue()
    })
    await page.goto(origin)
    const stil = alsMesswert(await page.evaluate(STIL))
    assert.equal(stil.ok, true, JSON.stringify(stil))
    page.once('close', () => {
      releaseFirst?.()
      detailFreigegeben = true
      detailLoesen?.()
    })
    Object.assign(page, {
      releaseFirst: () => releaseFirst?.(),
      releaseDetail: () => {
        detailFreigegeben = true
        detailLoesen?.()
      },
      gesendet,
      suchen,
      detailAnzahl: () => details,
    })
    return page
  }

  test('the real activity search keeps currency, drops stale quotes, and clears a new search', async () => {
    const page = await seite(390)
    const träger = page as Page & {
      gesendet: Array<{ currency?: string | null; productOptionCode?: string; startTime?: string }>
      suchen: Array<{ stage?: { name?: string; countryCode?: string }; trip?: { currency?: string }; day?: { dayDate?: string } }>
      releaseFirst: () => void
      releaseDetail: () => void
      detailAnzahl: () => number
    }
    const bereich = page.getByRole('region', { name: 'Aktivitäten' })
    await bereich.getByRole('button', { name: 'Für diesen Tag suchen' }).click()
    await bereich.getByRole('button', { name: 'Angebot prüfen' }).click()
    assert.equal(träger.suchen[0]?.stage?.name, 'Bangkok')
    assert.equal(träger.suchen[0]?.stage?.countryCode, 'TH')
    assert.equal(träger.suchen[0]?.trip?.currency, 'CHF')
    assert.equal(träger.suchen[0]?.day?.dayDate, '2026-11-02')
    await page.getByRole('region', { name: 'Viator-Prüfung' }).getByRole('button', { name: 'Erneut laden' }).click()
    await page.getByText('Details werden geladen.').waitFor()
    await page.getByRole('region', { name: 'Viator-Prüfung' }).getByLabel('Datum').fill('2026-11-03')
    träger.releaseDetail()
    await page.getByLabel('Erwachsene Anzahl').waitFor()
    assert.equal(await page.getByText('Details werden geladen.').count(), 0)
    assert.equal(await page.getByRole('region', { name: 'Viator-Prüfung' }).getByLabel('Datum').inputValue(), '2026-11-03')
    await page.getByLabel('Option').waitFor()
    assert.equal(await page.getByLabel('Option').inputValue(), '')
    await page.getByLabel('Option').selectOption({ label: 'Morgentour' })
    await page.getByText('Angefragte Anzeigewährung: CHF').waitFor()
    await page.getByLabel('Erwachsene Anzahl').fill('2')
    await page.getByRole('button', { name: 'Verfügbarkeit prüfen' }).click()
    for (let i = 0; i < 50 && träger.gesendet.length < 1; i += 1) await page.waitForTimeout(20)
    assert.equal(träger.gesendet[0]?.currency, 'CHF')
    assert.equal(träger.gesendet[0]?.productOptionCode, 'TG1')
    assert.equal(träger.gesendet[0]?.startTime, '10:00')
    assert.equal(JSON.stringify(träger.gesendet[0]).includes('DEFAULT'), false)
    await page.getByRole('region', { name: 'Viator-Prüfung' }).getByLabel('Datum').fill('2026-11-02')
    träger.releaseFirst()
    await page.waitForTimeout(50)
    assert.equal(await page.getByText('111').count(), 0)
    assert.equal(await page.getByText('alte Prüfung').count(), 0)
    await page.getByRole('button', { name: 'Verfügbarkeit prüfen' }).click()
    await page.getByText('neue Prüfung').waitFor()
    await page.getByText('80').waitFor()
    assert.equal(await page.getByText('111').count(), 0)
    await page.evaluate(() => { document.documentElement.style.fontSize = '32px' })
    const bedienung = alsMesswert(await page.evaluate(BEDIENUNG))
    assert.equal(bedienung.ok, true, JSON.stringify(bedienung))
    const detailsVorSuche = träger.detailAnzahl()
    await bereich.getByRole('button', { name: 'Erneut suchen' }).click()
    await page.getByText('Keine Testangebote.').waitFor()
    assert.equal(await page.getByRole('heading', { name: 'Ausgewähltes Angebot' }).count(), 0)
    assert.equal(träger.detailAnzahl(), detailsVorSuche)
    const schrift = await page.locator('h2').first().evaluate((el) => Number.parseFloat(getComputedStyle(el).fontSize))
    assert.ok(schrift >= 32)
    const textGrenzen = alsMesswert(await page.evaluate(TEXT_GRENZEN))
    assert.equal(textGrenzen.ok, true, JSON.stringify(textGrenzen))
    assert.equal(await bereich.locator('dt', { hasText: 'Reisende' }).count(), 0)
    assert.equal(await bereich.locator('dt', { hasText: 'Währung' }).count(), 0)
    await page.screenshot({ path: join(ARTIFACTS, 'viator-390.png'), fullPage: true })
    const tagWahl = bereich.getByRole('combobox', { name: 'Reisetag' })
    await tagWahl.focus()
    assert.equal(await page.evaluate('document.activeElement && document.activeElement.id'), 'activity-day-select')
    // macOS headless Chrome does not open the native select popup; native type-ahead still exercises keyboard change.
    if (process.platform === 'darwin') await page.keyboard.type('Phuket')
    else await page.keyboard.press('ArrowDown')
    await page.keyboard.press('Enter')
    await page.waitForFunction(() => (document.querySelector('#activity-day-select') as HTMLSelectElement)?.value === 'day-phu', null, { timeout: 2_000 })
    assert.equal(await tagWahl.inputValue(), 'day-phu')
    assert.match(await bereich.innerText(), /Phuket/)
    assert.equal(await page.getByRole('heading', { name: 'Ausgewähltes Angebot' }).count(), 0)
    await page.keyboard.press('Tab')
    const mass = await page.evaluate(() => ({ scroll: document.documentElement.scrollWidth, client: document.documentElement.clientWidth }))
    assert.ok(mass.scroll <= mass.client + 1)
    await page.close()
    for (const breite of [320, 768, 1440]) {
      const weitere = await seite(breite)
      const flaeche = weitere.getByRole('region', { name: 'Aktivitäten' })
      await flaeche.getByRole('button', { name: 'Für diesen Tag suchen' }).click()
      await flaeche.getByRole('button', { name: 'Angebot prüfen' }).click()
      await weitere.getByRole('region', { name: 'Viator-Prüfung' }).getByRole('button', { name: 'Erneut laden' }).click()
      ;(weitere as Page & { releaseDetail: () => void }).releaseDetail()
      await weitere.getByText('Kalenderhinweis, keine aktuelle Verfügbarkeit.').waitFor()
      if (breite === 320) {
        await weitere.evaluate(() => { document.documentElement.style.fontSize = '32px' })
        const grenzen = alsMesswert(await weitere.evaluate(TEXT_GRENZEN))
        const bedienungSchmal = alsMesswert(await weitere.evaluate(BEDIENUNG))
        assert.equal(grenzen.ok, true, `${breite} ${JSON.stringify(grenzen)}`)
        assert.equal(bedienungSchmal.ok, true, `${breite} ${JSON.stringify(bedienungSchmal)}`)
      }
      const kante = await weitere.evaluate(() => ({ scroll: document.documentElement.scrollWidth, client: document.documentElement.clientWidth }))
      assert.ok(kante.scroll <= kante.client + 1, `${breite}`)
      await weitere.screenshot({ path: join(ARTIFACTS, `viator-${breite}.png`), fullPage: true })
      await weitere.close()
    }
  })

  test('a multi-week trip keeps one compact day choice', async () => {
    const TAGE = `(() => {
      const auswahl = document.querySelector('#activity-day-select')
      const gruppe = auswahl ? auswahl.closest('div') : null
      const suche = [...document.querySelectorAll('button')].find((el) => (el.textContent || '').includes('suchen'))
      const radios = document.querySelectorAll('[role="radio"]').length
      if (!auswahl || !gruppe || !suche) return { ok: false, reason: 'missing', optionen: auswahl ? auswahl.options.length : 0 }
      const gewaehlt = auswahl.options[auswahl.selectedIndex]
      return {
        ok: radios === 0 && auswahl.options.length === 23 && Boolean(gewaehlt && gewaehlt.textContent),
        gruppeHoehe: Math.round(gruppe.getBoundingClientRect().height),
        auswahlHoehe: Math.round(auswahl.getBoundingClientRect().height),
        angeboteVorSuche: [...document.querySelectorAll('[aria-label="Viator"], [aria-label="GetYourGuide"]')].length === 2 && [...document.querySelectorAll('[aria-label="Viator"], [aria-label="GetYourGuide"]')].every((el) => Boolean(el.compareDocumentPosition(suche) & Node.DOCUMENT_POSITION_FOLLOWING)),
        label: gewaehlt ? gewaehlt.textContent : '',
        optionen: auswahl.options.length,
      }
    })()`
    for (const breite of [390, 1440]) {
      const page = await browser.newPage({ viewport: { width: breite, height: 900 } })
      await page.goto(`${origin}#tage=22`)
      const mass = alsMesswert(await page.evaluate(TAGE))
      assert.equal(mass.ok, true, `${breite} ${JSON.stringify(mass)}`)
      assert.ok((mass.gruppeHoehe ?? 9999) < 280, `${breite} gruppe ${mass.gruppeHoehe}`)
      assert.ok((mass.auswahlHoehe ?? 9999) < 80, `${breite} auswahl ${mass.auswahlHoehe}`)
      assert.equal(mass.angeboteVorSuche, true, `${breite}: official offers before secondary native search`)
      assert.equal(mass.label, 'Tag 1')
      const tagWahl = page.getByRole('combobox', { name: 'Reisetag' })
      await tagWahl.focus()
      if (process.platform === 'darwin') await page.keyboard.type('Tag 2')
      else await page.keyboard.press('ArrowDown')
      await page.keyboard.press('Enter')
      await page.waitForFunction(() => (document.querySelector('#activity-day-select') as HTMLSelectElement)?.value === 'day-2', null, { timeout: 2_000 })
      assert.equal(await tagWahl.inputValue(), 'day-2')
      assert.match(await page.getByRole('region', { name: 'Aktivitäten' }).innerText(), /Bangkok/)
      await tagWahl.selectOption({ label: 'Tag 22' })
      assert.equal(await tagWahl.inputValue(), 'day-22')
      assert.match(await page.getByRole('region', { name: 'Aktivitäten' }).innerText(), /Phuket/)
      assert.equal(await page.locator('[data-aktivitaet-ziel]').getAttribute('data-aktivitaet-ziel'), 'stage-phu')
      await page.close()
    }
    const schmal = await browser.newPage({ viewport: { width: 320, height: 900 } })
    await schmal.goto(`${origin}#tage=22`)
    await schmal.evaluate(() => { document.documentElement.style.fontSize = '32px' })
    const gross = alsMesswert(await schmal.evaluate(TAGE))
    assert.equal(gross.ok, true, JSON.stringify(gross))
    assert.ok((gross.gruppeHoehe ?? 9999) < 500, `32px gruppe ${gross.gruppeHoehe}`)
    assert.ok((gross.auswahlHoehe ?? 9999) < 160, `32px auswahl ${gross.auswahlHoehe}`)
    assert.equal(gross.angeboteVorSuche, true, 'enlarged text: official offers before secondary native search')
    assert.equal(gross.label, 'Tag 1')
    const wahl = schmal.getByRole('combobox', { name: 'Reisetag' })
    await wahl.focus()
    if (process.platform === 'darwin') await schmal.keyboard.type('Tag 2')
    else await schmal.keyboard.press('ArrowDown')
    await schmal.keyboard.press('Enter')
    await schmal.waitForFunction(() => (document.querySelector('#activity-day-select') as HTMLSelectElement)?.value === 'day-2', null, { timeout: 2_000 })
    assert.equal(await wahl.inputValue(), 'day-2')
    await wahl.selectOption({ label: 'Tag 22' })
    assert.equal(await wahl.inputValue(), 'day-22')
    assert.match(await schmal.getByRole('region', { name: 'Aktivitäten' }).innerText(), /Phuket/)
    assert.equal(await schmal.locator('[data-aktivitaet-ziel]').getAttribute('data-aktivitaet-ziel'), 'stage-phu')
    await schmal.screenshot({ path: join(ARTIFACTS, 'viator-22-tage-320.png'), fullPage: true })
    await schmal.close()
  })

  test('the search card shows the provider referral without loading detail', async () => {
    const href = 'https://www.viator.com/tours/Example/Fixture/d1-10001P1?pid=P00000000&medium=api'
    for (const breite of [320, 390, 768, 1440]) {
      const page = await seite(breite)
      const träger = page as Page & { detailAnzahl: () => number }
      const bereich = page.getByRole('region', { name: 'Aktivitäten' })
      await bereich.getByRole('button', { name: 'Für diesen Tag suchen' }).click()
      const link = bereich.getByRole('link', { name: 'Beim Anbieter ansehen' })
      await link.waitFor()
      assert.equal(await link.getAttribute('href'), href)
      assert.match(await link.getAttribute('rel') ?? '', /sponsored/)
      assert.match(await bereich.innerText(), /Angebotsziel: Bangkok/)
      assert.match(await bereich.innerText(), /Treffpunkt ist nicht angegeben/)
      assert.match(await bereich.innerText(), /Keine bestätigte Provision/)
      assert.equal(träger.detailAnzahl(), 0)
      const kartenBox = await link.evaluate((el) => {
        const karte = el.closest('article')?.getBoundingClientRect()
        const box = el.getBoundingClientRect()
        return {
          drin: Boolean(karte) && box.left >= (karte?.left ?? 0) - 1 && box.right <= (karte?.right ?? 0) + 1,
        }
      })
      assert.equal(kartenBox.drin, true, `breite ${breite}`)
      await link.focus()
      assert.equal(await page.evaluate(() => document.activeElement?.textContent), 'Beim Anbieter ansehen')
      await bereich.getByRole('combobox', { name: 'Reisetag' }).selectOption({ label: 'Phuket-Tag' })
      assert.equal(await link.count(), 0)
      await page.close()
    }
  })

  test('untitled options are not presented as a product without options', async () => {
    const page = await seite(390, { unbenannt: true })
    const stil = alsMesswert(await page.evaluate(STIL))
    assert.equal(stil.ok, true, JSON.stringify(stil))
    const träger = page as Page & { gesendet: unknown[] }
    await page.getByRole('button', { name: 'Für diesen Tag suchen' }).click()
    await page.getByRole('button', { name: 'Angebot prüfen' }).click()
    await page.getByText('Die Optionen sind nicht eindeutig benannt. Eine Prüfung wird nicht als erfolgreich angezeigt.').waitFor()
    assert.equal(await page.getByText('Dieses Angebot hat keine Zusatzoption.').count(), 0)
    assert.equal(await page.getByRole('button', { name: 'Verfügbarkeit prüfen' }).count(), 0)
    assert.equal(träger.gesendet.length, 0)
    const link = page.getByRole('link', { name: 'Bei Viator ansehen' })
    await link.waitFor()
    assert.equal(await link.getAttribute('href'), 'https://www.viator.com/tours/Example/Fixture/d1-10001P1?pid=P00000000&medium=api')
    await page.close()
  })
})
