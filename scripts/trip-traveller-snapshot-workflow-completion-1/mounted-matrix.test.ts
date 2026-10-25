import assert from 'node:assert/strict'
import { createRequire } from 'node:module'
import { createServer, type Server } from 'node:http'
import { mkdirSync, mkdtempSync, readFileSync } from 'node:fs'
import { tmpdir } from 'node:os'
import { join, resolve } from 'node:path'
import { after, before, describe, test } from 'node:test'

import * as esbuild from 'esbuild'
import { chromium, type Browser, type Page } from 'playwright'

import { beispielreise } from '@/lib/reiseaenderung/fixtures/reise'
import type { Trip, TripTraveller } from '@/types/trips'

const STAATSBUERGERSCHAFT = 'a1111111-1111-4111-8111-111111111111'
const SPEICHER = 'jetnity:reise:v3'
const BREITEN = [320, 360, 390, 768, 1280] as const

function person(teil: Partial<TripTraveller> & Pick<TripTraveller, 'clientRef'>): TripTraveller {
  return {
    id: `row-${teil.clientRef}`,
    label: teil.label ?? 'Reisende',
    residenceCountryCode: teil.residenceCountryCode ?? null,
    citizenships: teil.citizenships ?? [
      {
        id: `citizenship-${teil.clientRef}`,
        clientRef: STAATSBUERGERSCHAFT,
        countryCode: 'CH',
        createdAt: '2026-10-04T20:00:00.000Z',
        updatedAt: '2026-10-04T20:00:00.000Z',
      },
    ],
    documents: teil.documents ?? [
      {
        id: `document-${teil.clientRef}`,
        clientRef: 'document:pass-1',
        documentType: 'passport',
        issuingCountryCode: 'CH',
        citizenshipClientRef: STAATSBUERGERSCHAFT,
        expiresOn: '2030-01-01',
        createdAt: '2026-10-04T20:00:00.000Z',
        updatedAt: '2026-10-04T20:00:00.000Z',
      },
    ],
    createdAt: '2026-10-04T20:00:00.000Z',
    updatedAt: '2026-10-04T20:00:00.000Z',
    ...teil,
  }
}

async function projektCss(): Promise<string> {
  const verlangen = createRequire(import.meta.url)
  const postcss = verlangen('postcss') as typeof import('postcss')
  const nesting = verlangen('tailwindcss/nesting') as typeof import('postcss')
  const tailwindcss = verlangen('tailwindcss') as (config: unknown) => ReturnType<typeof postcss>
  const autoprefixer = verlangen('autoprefixer') as () => ReturnType<typeof postcss>
  const from = join(process.cwd(), 'styles/globals.css')
  const config = verlangen(join(process.cwd(), 'tailwind.config.js')) as unknown
  const ergebnis = await postcss([nesting(), tailwindcss(config), autoprefixer()]).process(readFileSync(from, 'utf8'), { from })
  return ergebnis.css.replaceAll('</style', '<\\/style')
}

async function bundeln(): Promise<string> {
  const datei = join(mkdtempSync(join(tmpdir(), 'traveller-matrix-')), 'flaeche.js')
  const leer = join('scripts/trip-personal-preparation-workflow-completion-1/shims/empty.ts')
  const shims = join('scripts/trip-personal-preparation-workflow-completion-1/shims')
  const eigene = join('scripts/trip-traveller-snapshot-workflow-completion-1/shims')
  const stub = resolve('scripts/trip-traveller-snapshot-workflow-completion-1/aktions-stub.ts')
  const aliasModul: Record<string, string> = {
    '@/lib/readiness/reisende-aktionen': stub,
    '@/lib/readiness/aktionen': stub,
    '@/lib/trips/aktionen': stub,
    '@/lib/activities/aktionen': stub,
    '@/lib/flights/aktionen': stub,
    '@/lib/hotels/aktionen': stub,
    '@/lib/mobility/aktionen': stub,
    '@/lib/rental-cars/aktionen': stub,
  }
  const gebaut = await esbuild.build({
    absWorkingDir: process.cwd(),
    entryPoints: ['scripts/trip-traveller-snapshot-workflow-completion-1/matrix.tsx'],
    bundle: true,
    format: 'iife',
    platform: 'browser',
    jsx: 'automatic',
    outfile: datei,
    alias: { '@': process.cwd(), ...aliasModul },
    define: { 'process.env.NODE_ENV': '"production"' },
    banner: { js: 'globalThis.process=globalThis.process||{env:{NODE_ENV:"production"}};globalThis.global=globalThis;' },
    plugins: [
      {
        name: 'next-shims',
        setup(build) {
          const ziel: Record<string, string> = {
            'next/link': join(shims, 'link.tsx'),
            'next/navigation': join(shims, 'navigation.tsx'),
            'next/dynamic': join(shims, 'dynamic.tsx'),
            'next/image': join(shims, 'image.tsx'),
            'next/cache': join(eigene, 'cache.ts'),
            'next/headers': join(eigene, 'headers.ts'),
            'next/server': leer,
            'server-only': leer,
            '@opentelemetry/api': leer,
          }
          build.onResolve({ filter: /^(next\/|server-only$|@opentelemetry\/api$)/ }, (args) => ({
            path: resolve(ziel[args.path] ?? leer),
          }))
          build.onLoad({ filter: /TripWorkspaceAuditClient\.tsx$/ }, () => {
            const text = readFileSync('components/trips/TripWorkspaceAuditClient.tsx', 'utf8').replace(
              'onUebernehmen={async () => null}',
              'onUebernehmen={async () => { globalThis.__AUDIT_STUB__ = (globalThis.__AUDIT_STUB__ ?? 0) + 1; return null }}',
            )
            return { contents: text, loader: 'tsx' }
          })
        },
      },
    ],
  })
  assert.equal(gebaut.errors.length, 0)
  return readFileSync(datei, 'utf8')
}

function dokument(bundle: string, css: string, start: unknown): string {
  return `<!doctype html><html lang="de"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width, initial-scale=1"><style>${css}</style></head><body style="margin:0"><div id="root"></div><script>
window.__READBACK_LEFT__=0;window.__GET_THROW_LEFT__=0;window.__AUDIT_STUB__=0;
const schluessel=${JSON.stringify(SPEICHER)};
const setzen=Storage.prototype.setItem;const lesen=Storage.prototype.getItem;
Storage.prototype.getItem=function(name){
  if(name===schluessel&&window.__GET_THROW_LEFT__>0){window.__GET_THROW_LEFT__-=1;throw new Error('unreadable')}
  if(name===schluessel&&window.__READBACK_LEFT__>0){window.__READBACK_LEFT__-=1;return '{"nicht":"rueckgelesen"}'}
  return lesen.call(this,name)
};
Storage.prototype.setItem=function(name,wert){return setzen.call(this,name,wert)};
window.__START__=${JSON.stringify(start)};
</script><script>${bundle}</script></body></html>`
}

async function dienst(html: string): Promise<{ url: string; close: () => Promise<void> }> {
  const server: Server = createServer((_req, res) => {
    res.writeHead(200, { 'content-type': 'text/html; charset=utf-8' })
    res.end(html)
  })
  await new Promise<void>((aufloesen) => server.listen(0, '127.0.0.1', aufloesen))
  const adresse = server.address()
  if (!adresse || typeof adresse === 'string') throw new Error('Kein lokaler Port')
  return {
    url: `http://127.0.0.1:${adresse.port}/`,
    close: () => new Promise((aufloesen, abweisen) => server.close((fehler) => (fehler ? abweisen(fehler) : aufloesen()))),
  }
}

async function oeffnen(browser: Browser, bundle: string, css: string, start: unknown): Promise<{ page: Page; schliessen: () => Promise<void> }> {
  const server = await dienst(dokument(bundle, css, start))
  const page = await browser.newPage({ viewport: { width: 390, height: 900 } })
  const fehler: string[] = []
  page.on('pageerror', (error) => fehler.push(String(error)))
  await page.goto(server.url, { waitUntil: 'domcontentloaded' })
  return {
    page,
    schliessen: async () => {
      const gemeldet = fehler.slice()
      await page.close().catch(() => undefined)
      await server.close()
      assert.deepEqual(gemeldet, [], gemeldet.join('\n'))
    },
  }
}

async function vorbereitung(page: Page) {
  if ((await page.locator('[data-workspace-modus="vorbereitung"]').count()) === 0) {
    await page.getByRole('navigation', { name: 'Reiseansicht' }).getByRole('button', { name: 'Vorbereitung' }).click()
    await page.waitForSelector('[data-workspace-modus="vorbereitung"]')
  }
}

async function karte(page: Page, ref: string) {
  await vorbereitung(page)
  const ziel = page.locator(`[data-preparation-traveller="${ref}"]`)
  if ((await ziel.getByRole('button', { name: 'Angaben speichern', exact: true }).count()) === 0) {
    await ziel.getByText('Angaben bearbeiten', { exact: true }).click()
  }
  return ziel
}

async function wohnsitz(page: Page, ref: string, code: string) {
  const ziel = await karte(page, ref)
  await ziel.getByRole('combobox', { name: 'Wohnsitzland, falls relevant', exact: true }).selectOption(code)
  return ziel
}

async function graphLesen(page: Page): Promise<Trip> {
  const roh = await page.evaluate((schluessel) => localStorage.getItem(schluessel), SPEICHER)
  assert.equal(typeof roh, 'string')
  return JSON.parse(roh as string) as Trip
}

async function ueberlauf(page: Page, width: number) {
  await page.setViewportSize({ width, height: 900 })
  await page.evaluate((eng) => {
    document.documentElement.style.fontSize = eng ? '32px' : ''
  }, width === 320)
  const masse = await page.evaluate(() => ({
    scroll: document.documentElement.scrollWidth,
    breite: document.documentElement.clientWidth,
    overflow: getComputedStyle(document.documentElement).overflow,
    body: getComputedStyle(document.body).overflow,
  }))
  assert.equal(masse.overflow === 'hidden', false)
  assert.equal(masse.body === 'hidden', false)
  assert.ok(masse.scroll <= masse.breite + 1, JSON.stringify({ width, ...masse }))
}

describe('mounted traveller snapshot matrix', () => {
  let bundle = ''
  let css = ''
  let browser: Browser

  before(async () => {
    mkdirSync('docs/evidence/trip-traveller-snapshot-workflow-completion-1', { recursive: true })
    ;[bundle, css] = await Promise.all([bundeln(), projektCss()])
    browser = await chromium.launch({ args: ['--no-sandbox', '--disable-dev-shm-usage'] })
  })

  after(async () => {
    await browser?.close()
  })

  test('legacy refs, removal, relation, blank link and duplicate stay on the card', { timeout: 120_000 }, async () => {
    const reise = beispielreise({
      id: 'trip-matrix-refs',
      travellers: 1,
      party: [
        person({
          clientRef: 'traveller:1',
          label: 'Reisende 1',
          citizenships: [
            {
              id: 'citizenship-1',
              clientRef: STAATSBUERGERSCHAFT,
              countryCode: 'CH',
              createdAt: '2026-10-04T20:00:00.000Z',
              updatedAt: '2026-10-04T20:00:00.000Z',
            },
            {
              id: 'citizenship-2',
              clientRef: 'citizenship:RS',
              countryCode: 'RS',
              createdAt: '2026-10-04T20:00:00.000Z',
              updatedAt: '2026-10-04T20:00:00.000Z',
            },
          ],
          documents: [
            {
              id: 'document-1',
              clientRef: 'document:pass-1',
              documentType: 'passport',
              issuingCountryCode: 'CH',
              citizenshipClientRef: STAATSBUERGERSCHAFT,
              expiresOn: '2030-01-01',
              createdAt: '2026-10-04T20:00:00.000Z',
              updatedAt: '2026-10-04T20:00:00.000Z',
            },
            {
              id: 'document-2',
              clientRef: 'document:id-2',
              documentType: 'national_id',
              issuingCountryCode: 'RS',
              citizenshipClientRef: 'citizenship:RS',
              expiresOn: '2031-02-02',
              createdAt: '2026-10-04T20:00:00.000Z',
              updatedAt: '2026-10-04T20:00:00.000Z',
            },
          ],
        }),
      ],
    })
    const { page, schliessen } = await oeffnen(browser, bundle, css, { art: 'account', reise })
    try {
      await page.waitForFunction(() => window.__MATRIX__)
      const ziel = await karte(page, 'traveller:1')
      await ziel.getByRole('button', { name: 'Weitere Staatsbürgerschaft', exact: true }).click()
      await ziel.getByRole('combobox', { name: 'Zugeordnete Staatsbürgerschaft', exact: true }).first().selectOption({ label: 'Ohne Länderangabe 3' })
      await ziel.getByRole('button', { name: 'Angaben speichern', exact: true }).click()
      await page.getByText('Das Dokument muss zu einer Staatsbürgerschaft derselben Person gehören.').waitFor()
      assert.equal(await page.evaluate(() => window.__MATRIX__.payloads.length), 0)
      const beziehung = await ziel.getByRole('combobox', { name: 'Zugeordnete Staatsbürgerschaft', exact: true }).first().inputValue()
      assert.match(beziehung, /^citizenship:/)
      assert.notEqual(beziehung, STAATSBUERGERSCHAFT)
      assert.notEqual(beziehung, 'citizenship:RS')
      await ziel.getByRole('button', { name: 'Entfernen', exact: true }).nth(2).click()
      await ziel.getByRole('combobox', { name: 'Zugeordnete Staatsbürgerschaft', exact: true }).first().selectOption('citizenship:RS')
      await ziel.getByRole('button', { name: 'Angaben speichern', exact: true }).click()
      await page.waitForFunction(() => window.__MATRIX__.payloads.length === 1)
      const bezogen = await page.evaluate(() => window.__MATRIX__.payloads[0])
      assert.equal(bezogen.citizenships[0].clientRef, STAATSBUERGERSCHAFT)
      assert.equal(bezogen.citizenships[1].clientRef, 'citizenship:RS')
      assert.equal(bezogen.documents[0].clientRef, 'document:pass-1')
      assert.equal(bezogen.documents[0].citizenshipClientRef, 'citizenship:RS')
      assert.equal(bezogen.documents[1].citizenshipClientRef, 'citizenship:RS')

      await ziel.getByRole('button', { name: 'Entfernen', exact: true }).nth(1).click()
      await ziel.getByRole('button', { name: 'Angaben speichern', exact: true }).click()
      await page.waitForFunction(() => window.__MATRIX__.payloads.length === 2)
      const ohne = await page.evaluate(() => window.__MATRIX__.payloads[1])
      assert.equal(ohne.citizenships.length, 1)
      assert.equal(ohne.citizenships[0].clientRef, STAATSBUERGERSCHAFT)

      await ziel.getByRole('combobox', { name: 'Staatsbürgerschaft 1', exact: true }).selectOption('FR')
      await ziel.getByRole('button', { name: 'Weitere Staatsbürgerschaft', exact: true }).click()
      await ziel.getByRole('combobox', { name: 'Staatsbürgerschaft 2', exact: true }).selectOption('FR')
      await ziel.getByRole('button', { name: 'Angaben speichern', exact: true }).click()
      await page.getByText('Dieselbe Staatsbürgerschaft kann nur einmal erfasst werden.').waitFor()
      assert.equal(await page.evaluate(() => window.__MATRIX__.payloads.length), 2)
    } finally {
      await schliessen()
    }
  })

  test('double Enter, outcomes, stale completion and focus stay on one writer', { timeout: 120_000 }, async () => {
    const reise = beispielreise({
      id: 'trip-matrix-outcome',
      travellers: 2,
      party: [person({ clientRef: 'traveller:1', label: 'Reisende 1' }), person({ clientRef: 'traveller:2', label: 'Reisende 2' })],
    })
    const { page, schliessen } = await oeffnen(browser, bundle, css, { art: 'account', reise })
    try {
      await page.waitForFunction(() => window.__MATRIX__)
      await page.evaluate(() => window.__MATRIX__.verhalten('hold'))
      const erste = await wohnsitz(page, 'traveller:1', 'IT')
      await page.evaluate(() => {
        const formular = document.querySelector('[data-preparation-traveller="traveller:1"] form')
        if (!(formular instanceof HTMLFormElement)) throw new Error('Formular fehlt')
        formular.requestSubmit()
        formular.requestSubmit()
      })
      await page.waitForFunction(() => window.__MATRIX__.payloads.length === 1)
      await page.getByText('Diese Angaben können so nicht gespeichert werden.').waitFor()
      const feld = erste.getByRole('combobox', { name: 'Wohnsitzland, falls relevant', exact: true })
      await feld.selectOption('DE')
      await page.evaluate(() => window.__MATRIX__.freigeben('null'))
      await page.waitForTimeout(50)
      assert.equal(await feld.inputValue(), 'DE')
      assert.equal(await page.evaluate(() => document.activeElement === document.querySelector('[data-preparation-traveller="traveller:1"] select')), false)
      assert.equal(await page.evaluate(() => window.__MATRIX__.payloads.length), 1)

      await page.evaluate(() => window.__MATRIX__.verhalten('string'))
      await (await wohnsitz(page, 'traveller:2', 'AT')).getByRole('button', { name: 'Angaben speichern', exact: true }).click()
      await page.getByText('Das Ergebnis ist nicht bekannt. Die Angaben bleiben auf dieser Karte und werden nicht von selbst wiederholt.').first().waitFor()
      assert.equal(await page.evaluate(() => window.__MATRIX__.payloads.length), 2)

      await page.evaluate(() => window.__MATRIX__.verhalten('throw'))
      await (await karte(page, 'traveller:2')).getByRole('button', { name: 'Angaben speichern', exact: true }).click()
      await page.waitForFunction(() => window.__MATRIX__.payloads.length === 3)

      await page.evaluate(() => window.__MATRIX__.verhalten('reject'))
      await (await karte(page, 'traveller:2')).getByRole('button', { name: 'Angaben speichern', exact: true }).click()
      await page.waitForFunction(() => window.__MATRIX__.payloads.length === 4)

      await page.evaluate(() => window.__MATRIX__.verhalten('object'))
      await (await karte(page, 'traveller:2')).getByRole('button', { name: 'Angaben speichern', exact: true }).click()
      await page.waitForFunction(() => window.__MATRIX__.payloads.length === 5)
      assert.equal(await page.locator('[data-preparation-traveller="traveller:2"]').getAttribute('data-traveller-phase'), 'unproven')

      await page.evaluate(() => window.__MATRIX__.verhalten('null'))
      await page.evaluate(() => window.__MATRIX__.refreshWirft(true))
      await (await karte(page, 'traveller:1')).getByRole('button', { name: 'Angaben speichern', exact: true }).click()
      await page.getByText('Ob die Reise neu geladen wurde, ist nicht bekannt.').waitFor()
      assert.equal(await page.locator('[data-preparation-traveller="traveller:1"]').getAttribute('data-traveller-phase'), 'accepted')
    } finally {
      await schliessen()
    }
  })

  test('pre-settlement delivery is not consistent and a later match may be', { timeout: 120_000 }, async () => {
    const reise = beispielreise({
      id: 'trip-matrix-readback',
      travellers: 1,
      party: [person({ clientRef: 'traveller:1', label: 'Reisende 1' })],
    })
    const { page, schliessen } = await oeffnen(browser, bundle, css, { art: 'account', reise })
    try {
      await page.waitForFunction(() => window.__MATRIX__)
      await page.evaluate(() => window.__MATRIX__.verhalten('hold'))
      await (await karte(page, 'traveller:1')).getByRole('button', { name: 'Angaben speichern', exact: true }).click()
      await page.getByText('Die Angaben werden gespeichert …').waitFor()
      await page.evaluate((wert) => window.__MATRIX__.kanonischSetzen(wert), reise)
      await page.evaluate(() => window.__MATRIX__.freigeben('null'))
      await page.getByText('Die Angaben wurden zum Speichern angenommen.').waitFor()
      assert.equal(await page.getByText('Die geladenen Angaben stimmen mit der letzten Speicherung überein.').count(), 0)
      await page.evaluate((wert) => window.__MATRIX__.kanonischSetzen(structuredClone(wert)), reise)
      await page.getByText('Die geladenen Angaben stimmen mit der letzten Speicherung überein.').waitFor()
    } finally {
      await schliessen()
    }
  })

  test('a removed profile needs an explicit re-entry before another save', { timeout: 120_000 }, async () => {
    const reise = beispielreise({
      id: 'trip-matrix-absent',
      travellers: 1,
      party: [person({ clientRef: 'traveller:1', label: 'Reisende 1', residenceCountryCode: null, citizenships: [], documents: [] })],
    })
    const { page, schliessen } = await oeffnen(browser, bundle, css, { art: 'account', reise })
    try {
      await page.waitForFunction(() => window.__MATRIX__)
      const ziel = await wohnsitz(page, 'traveller:1', 'IT')
      const leer = beispielreise({ ...reise, party: [] })
      const anders = beispielreise({
        ...reise,
        party: [person({ clientRef: 'traveller:1', label: 'Reisende 1', residenceCountryCode: 'FR', citizenships: [], documents: [] })],
      })
      await page.evaluate((wert) => window.__MATRIX__.kanonischSetzen(wert), anders)
      await page.getByText('Die geladenen Angaben haben sich geändert.').waitFor()
      await page.evaluate((wert) => window.__MATRIX__.beideSetzen(wert), leer)
      await page.getByText('Die gespeicherten Angaben für diesen Reiseplatz sind nicht mehr vorhanden.').waitFor()
      assert.equal(await ziel.getByRole('button', { name: 'Angaben speichern', exact: true }).isDisabled(), true)
      const vorher = await page.evaluate(() => window.__MATRIX__.payloads.length)
      await ziel.getByRole('button', { name: 'Meine Eingaben behalten', exact: true }).click()
      assert.equal(await page.evaluate(() => window.__MATRIX__.payloads.length), vorher)
      assert.equal(await ziel.getByRole('button', { name: 'Angaben speichern', exact: true }).isDisabled(), true)
      await ziel.getByRole('button', { name: 'Angaben für diesen Platz neu erfassen', exact: true }).click()
      await ziel.getByRole('combobox', { name: 'Staatsbürgerschaft 1', exact: true }).selectOption('CH')
      await page.evaluate(() => window.__MATRIX__.verhalten('null'))
      await ziel.getByRole('button', { name: 'Angaben speichern', exact: true }).click()
      await page.waitForFunction(() => window.__MATRIX__.payloads.length === 1)
      const payload = await page.evaluate(() => window.__MATRIX__.payloads[0])
      assert.equal(payload.citizenships[0].countryCode, 'CH')
    } finally {
      await schliessen()
    }
  })

  test('removal confirmation cancels with Escape and a late response does not steal a newer field', { timeout: 120_000 }, async () => {
    const reise = beispielreise({
      id: 'trip-matrix-focus',
      travellers: 1,
      party: [person({ clientRef: 'traveller:1', label: 'Reisende 1' })],
    })
    const { page, schliessen } = await oeffnen(browser, bundle, css, { art: 'account', reise })
    try {
      await page.waitForFunction(() => window.__MATRIX__)
      const ziel = await karte(page, 'traveller:1')
      await ziel.getByRole('button', { name: 'Angaben entfernen', exact: true }).click()
      await page.getByRole('button', { name: 'Entfernen bestätigen', exact: true }).focus()
      await page.keyboard.press('Escape')
      await page.waitForFunction(() => document.activeElement?.textContent?.includes('Angaben entfernen'))
      assert.equal(await page.getByRole('button', { name: 'Entfernen bestätigen', exact: true }).count(), 0)

      await page.evaluate(() => window.__MATRIX__.verhalten('hold'))
      await ziel.getByRole('button', { name: 'Angaben speichern', exact: true }).click()
      await page.getByText('Die Angaben werden gespeichert …').waitFor()
      const feld = ziel.getByRole('combobox', { name: 'Wohnsitzland, falls relevant', exact: true })
      await feld.focus()
      await feld.selectOption('IT')
      await page.evaluate(() => window.__MATRIX__.freigeben('null'))
      await page.waitForTimeout(50)
      const wohnsitzFokus = await page.evaluate(() => {
        const aktiv = document.activeElement
        if (!(aktiv instanceof HTMLSelectElement)) return false
        const id = aktiv.getAttribute('aria-labelledby')
        return id ? document.getElementById(id)?.textContent?.includes('Wohnsitzland') === true : false
      })
      assert.equal(wohnsitzFokus, true)
    } finally {
      await schliessen()
    }
  })

  test('registry intake keeps one writer through navigation and unmount', { timeout: 120_000 }, async () => {
    const ada = {
      id: 'registry-ada',
      label: 'Ada',
      residenceCountryCode: 'CH',
      citizenshipCountryCodes: ['CH'],
      documents: [{ documentType: 'passport' as const, issuingCountryCode: 'CH' }],
    }
    const bea = { ...ada, id: 'registry-bea' }
    const reise = beispielreise({ id: 'trip-matrix-registry', travellers: 1, party: [] })
    const { page, schliessen } = await oeffnen(browser, bundle, css, {
      art: 'account',
      reise,
      registry: { problem: null, travellers: [ada, bea], voll: false },
    })
    try {
      await page.waitForFunction(() => window.__MATRIX__)
      await vorbereitung(page)
      await page.getByRole('button', { name: 'In diese Reise übernehmen', exact: true }).nth(1).click()
      await page.getByRole('navigation', { name: 'Reiseansicht' }).getByRole('button', { name: 'Reiseplan' }).click()
      await page.getByRole('navigation', { name: 'Reiseansicht' }).getByRole('button', { name: 'Vorbereitung' }).click()
      await page.evaluate(() => window.__MATRIX__.verhalten('hold'))
      await page.getByRole('button', { name: 'Kopie für diese Reise erzeugen', exact: true }).click()
      await page.evaluate((liste) => window.__MATRIX__.registrySetzen({ problem: null, travellers: liste, voll: true }), [ada, bea])
      await page.evaluate(() => window.__MATRIX__.freigeben('null'))
      await page.getByText('Die Person wurde als eigenständiger Snapshot in diese Reise übernommen.').waitFor()
      const intake = await page.evaluate(() => window.__MATRIX__.intake)
      assert.equal(intake.length, 1)
      assert.equal(intake[0].registryTravellerId, 'registry-bea')

      await page.evaluate((liste) => window.__MATRIX__.registrySetzen({ problem: null, travellers: liste, voll: false }), [ada, bea])
      await page.evaluate(() => window.__MATRIX__.verhalten('string'))
      await page.getByRole('button', { name: 'In diese Reise übernehmen', exact: true }).first().click()
      await page.getByRole('button', { name: 'Kopie für diese Reise erzeugen', exact: true }).click()
      await page.getByText('Das Ergebnis dieser Übernahme ist nicht bekannt. Sie wird nicht von selbst wiederholt.').waitFor()
      assert.equal(await page.evaluate(() => window.__MATRIX__.intake.length), 2)
      await page.waitForTimeout(100)
      assert.equal(await page.evaluate(() => window.__MATRIX__.intake.length), 2)

      await page.evaluate(() => window.__MATRIX__.ausblenden())
      await page.waitForSelector('[data-matrix="weg"]')
      await page.evaluate(() => window.__MATRIX__.einblenden())
      await page.waitForSelector('[data-workspace-premium="3"]')
      assert.equal(await page.getByText('Das Ergebnis dieser Übernahme ist nicht bekannt.').count(), 0)
    } finally {
      await schliessen()
    }
  })

  test('registry problem, empty and null stay distinct from a successful copy', { timeout: 120_000 }, async () => {
    const reise = beispielreise({ id: 'trip-matrix-registry-leer', travellers: 1, party: [] })
    const { page, schliessen } = await oeffnen(browser, bundle, css, {
      art: 'account',
      reise,
      registry: { problem: { status: 503, message: 'x' }, travellers: null },
    })
    try {
      await page.waitForFunction(() => window.__MATRIX__)
      await vorbereitung(page)
      await page.getByText('Wir konnten deinen aktuellen Speicherstand gerade nicht prüfen; bitte lade später neu.').waitFor()
      await page.evaluate(() => window.__MATRIX__.registrySetzen({ problem: null, travellers: null }))
      await page.getByText('Das ist ein Fehler auf unserer Seite, nicht in deinen Daten. Bitte lade die Seite neu.').waitFor()
      await page.evaluate(() => window.__MATRIX__.registrySetzen({ problem: null, travellers: [] }))
      await page.getByText('Noch keine gespeicherten Reisenden.').waitFor()
      assert.equal(await page.getByRole('button', { name: 'In diese Reise übernehmen', exact: true }).count(), 0)
    } finally {
      await schliessen()
    }
  })

  test('the Konto render prop and the legacy audit stub each run once', { timeout: 180_000 }, async () => {
    const personAnzeige = {
      id: 'registry-ada',
      label: 'Ada',
      residenceCountryCode: null,
      citizenshipCountryCodes: [] as string[],
      documents: [] as Array<{ documentType: 'passport'; issuingCountryCode: 'CH' }>,
    }
    const reise = beispielreise({ id: 'trip-matrix-konto', travellers: 1, party: [] })
    const konto = await oeffnen(browser, bundle, css, {
      art: 'konto',
      reise,
      registry: { problem: null, travellers: [personAnzeige] },
    })
    try {
      await konto.page.getByRole('navigation', { name: 'Reiseansicht' }).getByRole('button', { name: 'Vorbereitung' }).click()
      await konto.page.getByRole('button', { name: 'In diese Reise übernehmen', exact: true }).click()
      await konto.page.getByRole('button', { name: 'Kopie für diese Reise erzeugen', exact: true }).click()
      await konto.page.getByText('Die Person wurde als eigenständiger Snapshot in diese Reise übernommen.').waitFor()
      const aufrufe = await konto.page.evaluate(() => window.__KONTO_AUFRUFE__)
      assert.equal(aufrufe.filter((eintrag) => eintrag.name === 'registryTravellerInReiseUebernehmen').length, 1)
    } finally {
      await konto.schliessen()
    }

    const audit = await oeffnen(browser, bundle, css, {
      art: 'audit',
      nutzlast: {
        reise,
        quelle: 'account',
        mitReadiness: true,
        registry: { problem: null, travellers: [personAnzeige], voll: false },
      },
    })
    try {
      await audit.page.getByRole('navigation', { name: 'Reiseansicht' }).getByRole('button', { name: 'Vorbereitung' }).click()
      await audit.page.getByRole('button', { name: 'In diese Reise übernehmen', exact: true }).click()
      await audit.page.getByRole('button', { name: 'Kopie für diese Reise erzeugen', exact: true }).click()
      await audit.page.getByText('Die Person wurde als eigenständiger Snapshot in diese Reise übernommen.').waitFor()
      await audit.page.waitForTimeout(100)
      assert.equal(await audit.page.evaluate(() => window.__AUDIT_STUB__), 1)
    } finally {
      await audit.schliessen()
    }
  })

  test('a usable guest plan point survives the later traveller save', { timeout: 120_000 }, async () => {
    const reise = beispielreise({
      id: 'trip-guest-usable',
      travellers: 1,
      party: [person({ clientRef: 'traveller:1', label: 'Reisende 1' })],
    })
    const { page, schliessen } = await oeffnen(browser, bundle, css, { art: 'guest', reise })
    try {
      await page.getByRole('navigation', { name: 'Reiseansicht' }).getByRole('button', { name: 'Reiseplan' }).click()
      await page.locator('[data-plan-hinzufuegen]').first().click()
      const formular = page.getByRole('form', { name: 'Punkt hinzufügen' })
      await formular.getByLabel('Ort oder Aktivität').fill('Marktplatz')
      await formular.getByRole('button', { name: 'Speichern', exact: true }).click()
      await page.getByRole('button', { name: 'Flexibel Aktivität Marktplatz' }).waitFor()
      await wohnsitz(page, 'traveller:1', 'IT')
      await page.getByRole('button', { name: 'Angaben speichern', exact: true }).click()
      await page.getByText('Die Angaben wurden zum Speichern angenommen.').waitFor()
      const gespeichert = await graphLesen(page)
      assert.equal(gespeichert.party?.find((eintrag) => eintrag.clientRef === 'traveller:1')?.residenceCountryCode, 'IT')
      assert.equal(JSON.stringify(gespeichert).includes('Marktplatz'), true)
    } finally {
      await schliessen()
    }
  })

  test('an unproven guest write stays blocked until an explicit same-trip read', { timeout: 180_000 }, async () => {
    const reise = beispielreise({
      id: 'trip-guest-unresolved',
      travellers: 2,
      party: [
        person({ clientRef: 'traveller:1', label: 'Reisende 1' }),
        person({ clientRef: 'traveller:2', label: 'Reisende 2' }),
      ],
    })
    const { page, schliessen } = await oeffnen(browser, bundle, css, { art: 'guest', reise })
    try {
      await page.evaluate(() => {
        window.__READBACK_LEFT__ = 1
      })
      await (await wohnsitz(page, 'traveller:1', 'IT')).getByRole('button', { name: 'Angaben speichern', exact: true }).click()
      await page.getByText('Das Ergebnis ist nicht bekannt.').first().waitFor()
      const nachErstem = await page.evaluate((schluessel) => localStorage.getItem(schluessel), SPEICHER)
      await (await wohnsitz(page, 'traveller:2', 'FR')).getByRole('button', { name: 'Angaben speichern', exact: true }).click()
      await (await karte(page, 'traveller:2')).getByRole('button', { name: 'Angaben entfernen', exact: true }).click()
      await page.getByRole('button', { name: 'Entfernen bestätigen', exact: true }).click()
      assert.equal(await page.evaluate((schluessel) => localStorage.getItem(schluessel), SPEICHER), nachErstem)

      await page.getByRole('navigation', { name: 'Reiseansicht' }).getByRole('button', { name: 'Reiseplan' }).click()
      await page.locator('[data-plan-hinzufuegen]').first().click()
      const formular = page.getByRole('form', { name: 'Punkt hinzufügen' })
      await formular.getByLabel('Ort oder Aktivität').fill('Sofortpunkt')
      await formular.getByRole('button', { name: 'Speichern', exact: true }).click()
      await page.getByText('Der Planpunkt hat sich inzwischen geändert. Bitte lade die Reise neu; deine Eingabe bleibt erhalten.').waitFor()
      const nachAblehnung = await graphLesen(page)
      assert.equal(nachAblehnung.days.some((tag) => tag.items.some((punkt) => punkt.title === 'Sofortpunkt')), false)
      assert.equal(await page.evaluate((schluessel) => localStorage.getItem(schluessel), SPEICHER), nachErstem)

      await page.getByRole('navigation', { name: 'Reiseansicht' }).getByRole('button', { name: 'Vorbereitung' }).click()
      await page.getByRole('navigation', { name: 'Reiseansicht' }).getByRole('button', { name: 'Reiseplan' }).click()
      await page.getByRole('navigation', { name: 'Reiseansicht' }).getByRole('button', { name: 'Vorbereitung' }).click()
      assert.equal(await page.evaluate((schluessel) => localStorage.getItem(schluessel), SPEICHER), nachErstem)
      await page.getByRole('button', { name: 'Stand neu lesen', exact: true }).first().click()
      const geladen = await karte(page, 'traveller:1')
      await geladen.getByRole('button', { name: 'Gespeicherte Reise laden', exact: true }).waitFor()

      await page.getByRole('navigation', { name: 'Reiseansicht' }).getByRole('button', { name: 'Reiseplan' }).click()
      await page.locator('[data-plan-hinzufuegen]').first().click()
      const zweites = page.getByRole('form', { name: 'Punkt hinzufügen' })
      await zweites.getByLabel('Ort oder Aktivität').fill('Nachlesen')
      await zweites.getByRole('button', { name: 'Speichern', exact: true }).click()
      await page.getByRole('button', { name: 'Flexibel Aktivität Nachlesen' }).waitFor()
      const nochGesperrt = await karte(page, 'traveller:1')
      await nochGesperrt.getByRole('button', { name: 'Gespeicherte Reise laden', exact: true }).waitFor()

      const behalten = await page.evaluate((schluessel) => localStorage.getItem(schluessel), SPEICHER)
      await page.evaluate(() => {
        window.__GET_THROW_LEFT__ = 1
      })
      await page.getByRole('button', { name: 'Gespeicherte Reise laden', exact: true }).click()
      await page.waitForTimeout(50)
      await page.evaluate((roh) => localStorage.setItem('jetnity:reise:v3', roh), '{')
      await page.getByRole('button', { name: 'Gespeicherte Reise laden', exact: true }).click()
      await page.waitForTimeout(50)
      await page.evaluate((schluessel) => localStorage.removeItem(schluessel), SPEICHER)
      await page.getByRole('button', { name: 'Gespeicherte Reise laden', exact: true }).click()
      await page.waitForTimeout(50)
      const falsch = JSON.parse(behalten as string) as Trip
      falsch.id = 'andere-reise'
      await page.evaluate((wert) => localStorage.setItem('jetnity:reise:v3', JSON.stringify(wert)), falsch)
      await page.getByRole('button', { name: 'Gespeicherte Reise laden', exact: true }).click()
      await page.waitForTimeout(50)
      await page.evaluate((roh) => localStorage.setItem('jetnity:reise:v3', roh), behalten)
      assert.equal(await page.getByRole('button', { name: 'Gespeicherte Reise laden', exact: true }).count(), 1)

      await page.getByRole('button', { name: 'Gespeicherte Reise laden', exact: true }).click()
      await page.getByRole('button', { name: 'Gespeicherte Reise laden', exact: true }).waitFor({ state: 'hidden' })
      const vorZweitem = await page.evaluate((schluessel) => localStorage.getItem(schluessel), SPEICHER)
      await (await wohnsitz(page, 'traveller:2', 'DE')).getByRole('button', { name: 'Angaben speichern', exact: true }).click()
      await page.getByText('Die Angaben wurden zum Speichern angenommen.').waitFor()
      const danach = await graphLesen(page)
      assert.equal(danach.party?.find((eintrag) => eintrag.clientRef === 'traveller:1')?.residenceCountryCode, 'IT')
      assert.equal(JSON.stringify(danach).includes('Nachlesen'), true)
      assert.equal(danach.party?.find((eintrag) => eintrag.clientRef === 'traveller:2')?.residenceCountryCode, 'DE')
      assert.notEqual(vorZweitem, await page.evaluate((schluessel) => localStorage.getItem(schluessel), SPEICHER))
    } finally {
      await schliessen()
    }
  })

  test('a guest prop change does not clear an unresolved traveller latch', { timeout: 120_000 }, async () => {
    const reise = beispielreise({
      id: 'trip-guest-prop',
      travellers: 2,
      party: [person({ clientRef: 'traveller:1', label: 'Reisende 1' }), person({ clientRef: 'traveller:2', label: 'Reisende 2' })],
    })
    const { page, schliessen } = await oeffnen(browser, bundle, css, { art: 'account', seam: 'guest', reise })
    try {
      await page.waitForFunction(() => window.__MATRIX__)
      await page.evaluate(() => window.__MATRIX__.verhalten('hold'))
      await (await wohnsitz(page, 'traveller:1', 'IT')).getByRole('button', { name: 'Angaben speichern', exact: true }).click()
      await page.waitForFunction(() => window.__MATRIX__.payloads.length === 1)
      await (await wohnsitz(page, 'traveller:2', 'FR')).getByRole('button', { name: 'Angaben speichern', exact: true }).click()
      await page.getByText('Für diese Reise ist bereits eine Speicherung oder Entfernung offen. Dieser Versuch wird nicht nachgereicht.').waitFor()
      assert.equal(await page.evaluate(() => window.__MATRIX__.payloads.length), 1)
      await page.evaluate(() => window.__MATRIX__.freigeben('null'))
      await page.getByText('Die Angaben wurden zum Speichern angenommen.').waitFor()
      await page.evaluate(() => window.__MATRIX__.verhalten('string'))
      await (await wohnsitz(page, 'traveller:1', 'IT')).getByRole('button', { name: 'Angaben speichern', exact: true }).click()
      await page.getByRole('button', { name: 'Gespeicherte Reise laden', exact: true }).waitFor()
      const naechste = beispielreise({ ...reise, title: 'Andere Überschrift' })
      await page.evaluate((wert) => window.__MATRIX__.reiseSetzen(wert), naechste)
      await page.getByRole('button', { name: 'Gespeicherte Reise laden', exact: true }).waitFor()
      const vorher = await page.evaluate(() => window.__MATRIX__.payloads.length)
      await (await karte(page, 'traveller:1')).getByRole('button', { name: 'Angaben speichern', exact: true }).click()
      assert.equal(await page.evaluate(() => window.__MATRIX__.payloads.length), vorher)
    } finally {
      await schliessen()
    }
  })

  test('a newer draft survives completion of the older save', { timeout: 120_000 }, async () => {
    const reise = beispielreise({
      id: 'trip-newer-draft',
      travellers: 1,
      party: [person({ clientRef: 'traveller:1', label: 'Reisende 1', residenceCountryCode: 'CH' })],
    })
    const satz =
      'Die vorherige Speicherung wurde angenommen. Die späteren Änderungen auf dieser Karte sind davon nicht erfasst und werden nicht von selbst wiederholt.'
    for (const freigabe of ['null', 'string', 'throw'] as const) {
      const { page, schliessen } = await oeffnen(browser, bundle, css, { art: 'account', reise })
      try {
        await page.waitForFunction(() => window.__MATRIX__)
        await page.evaluate(() => window.__MATRIX__.verhalten('hold'))
        const ziel = await wohnsitz(page, 'traveller:1', 'FR')
        await ziel.getByRole('button', { name: 'Angaben speichern', exact: true }).click()
        await page.getByText('Die Angaben werden gespeichert …').waitFor()
        await ziel.getByRole('combobox', { name: 'Wohnsitzland, falls relevant', exact: true }).selectOption('IT')
        await page.evaluate((wert) => window.__MATRIX__.freigeben(wert), freigabe)
        if (freigabe === 'null') await page.getByText(satz).waitFor()
        else await page.getByText('Das Ergebnis ist nicht bekannt. Die Angaben bleiben auf dieser Karte und werden nicht von selbst wiederholt.').waitFor()
        const phase = await ziel.getAttribute('data-traveller-phase')
        assert.equal(phase, freigabe === 'null' ? 'idle' : 'unproven')
        assert.notEqual(phase, 'pending')
        assert.equal(await ziel.getByRole('combobox', { name: 'Wohnsitzland, falls relevant', exact: true }).inputValue(), 'IT')
        assert.equal(await ziel.getByRole('button', { name: 'Angaben speichern', exact: true }).isDisabled(), false)
        assert.equal(await page.getByText('Die geladenen Angaben haben sich geändert.').count(), 0)
        assert.equal(await page.evaluate(() => window.__MATRIX__.payloads.length), 1)
        const payload = await page.evaluate(() => window.__MATRIX__.payloads[0])
        assert.equal(payload.residenceCountryCode, 'FR')
        assert.equal(payload.citizenships[0].clientRef, STAATSBUERGERSCHAFT)
        assert.equal(payload.documents[0].clientRef, 'document:pass-1')
        assert.equal(payload.documents[0].citizenshipClientRef, STAATSBUERGERSCHAFT)
        assert.equal(await page.evaluate(() => window.__MATRIX__.refresh()), 0)
      } finally {
        await schliessen()
      }
    }
  })

  test('a removal confirmation opened during a save survives the older result', { timeout: 120_000 }, async () => {
    const reise = beispielreise({
      id: 'trip-newer-confirm',
      travellers: 1,
      party: [person({ clientRef: 'traveller:1', label: 'Reisende 1', residenceCountryCode: 'CH' })],
    })
    const { page, schliessen } = await oeffnen(browser, bundle, css, { art: 'account', reise })
    try {
      await page.waitForFunction(() => window.__MATRIX__)
      await page.evaluate(() => window.__MATRIX__.verhalten('hold'))
      const ziel = await karte(page, 'traveller:1')
      await ziel.getByRole('button', { name: 'Angaben speichern', exact: true }).click()
      await page.getByText('Die Angaben werden gespeichert …').waitFor()
      await ziel.getByRole('button', { name: 'Angaben entfernen', exact: true }).click()
      await page.getByRole('button', { name: 'Entfernen bestätigen', exact: true }).waitFor()
      await page.evaluate(() => window.__MATRIX__.freigeben('null'))
      await page.waitForTimeout(50)
      assert.equal(await page.getByRole('button', { name: 'Entfernen bestätigen', exact: true }).count(), 1)
      assert.equal(await ziel.getAttribute('data-traveller-phase'), 'confirm_remove')
      assert.equal(await page.getByText('Die Angaben wurden zum Speichern angenommen.').count(), 0)
      assert.equal(await page.evaluate(() => window.__MATRIX__.payloads.length), 1)
      assert.equal(await page.evaluate(() => window.__MATRIX__.entfernen.length), 0)
      assert.equal(await page.evaluate(() => window.__MATRIX__.refresh()), 0)
    } finally {
      await schliessen()
    }
  })

  test('a matching readback of an edited save is consistent and a later edit stays distinct', { timeout: 120_000 }, async () => {
    const reise = beispielreise({
      id: 'trip-matching-readback',
      travellers: 1,
      party: [person({ clientRef: 'traveller:1', label: 'Reisende 1', residenceCountryCode: 'CH' })],
    })
    const { page, schliessen } = await oeffnen(browser, bundle, css, { art: 'account', reise })
    try {
      await page.waitForFunction(() => window.__MATRIX__)
      await page.evaluate(() => window.__MATRIX__.verhalten('null'))
      const ziel = await wohnsitz(page, 'traveller:1', 'FR')
      await ziel.getByRole('button', { name: 'Angaben speichern', exact: true }).click()
      await page.getByText('Die Angaben wurden zum Speichern angenommen.').waitFor()
      assert.equal(await page.getByText('Die geladenen Angaben haben sich geändert.').count(), 0)
      const frankreich = beispielreise({
        ...reise,
        party: [person({ clientRef: 'traveller:1', label: 'Reisende 1', residenceCountryCode: 'FR' })],
      })
      await page.evaluate((wert) => window.__MATRIX__.kanonischSetzen(wert), frankreich)
      await page.getByText('Die geladenen Angaben stimmen mit der letzten Speicherung überein.').waitFor()
      assert.equal(await ziel.getAttribute('data-traveller-phase'), 'consistent')
      assert.equal(await page.getByText('Die geladenen Angaben haben sich geändert.').count(), 0)
      assert.equal(await ziel.getByRole('button', { name: 'Angaben speichern', exact: true }).isDisabled(), false)
      assert.equal(await ziel.getByRole('combobox', { name: 'Wohnsitzland, falls relevant', exact: true }).inputValue(), 'FR')
      assert.equal(await page.evaluate(() => window.__MATRIX__.payloads.length), 1)
      const payload = await page.evaluate(() => window.__MATRIX__.payloads[0])
      assert.equal(payload.residenceCountryCode, 'FR')
      assert.equal(payload.citizenships[0].clientRef, STAATSBUERGERSCHAFT)
      assert.equal(payload.citizenships[0].countryCode, 'CH')
      assert.equal(payload.documents[0].clientRef, 'document:pass-1')
      assert.equal(payload.documents[0].citizenshipClientRef, STAATSBUERGERSCHAFT)
      await ziel.getByRole('combobox', { name: 'Wohnsitzland, falls relevant', exact: true }).selectOption('IT')
      assert.equal(await page.getByText('Die geladenen Angaben stimmen mit der letzten Speicherung überein.').count(), 0)
      const deutschland = beispielreise({
        ...reise,
        party: [person({ clientRef: 'traveller:1', label: 'Reisende 1', residenceCountryCode: 'DE' })],
      })
      await page.evaluate((wert) => window.__MATRIX__.kanonischSetzen(wert), deutschland)
      await page.getByText('Die geladenen Angaben haben sich geändert.').waitFor()
      assert.equal(await ziel.getByRole('combobox', { name: 'Wohnsitzland, falls relevant', exact: true }).inputValue(), 'IT')
      assert.equal(await ziel.getByRole('button', { name: 'Angaben speichern', exact: true }).isDisabled(), true)
      assert.equal(await page.evaluate(() => window.__MATRIX__.payloads.length), 1)
    } finally {
      await schliessen()
    }
  })

  test('project css keeps the open traveller states inside the viewport', { timeout: 180_000 }, async () => {
    const lang = 'Reisende mit einem sehr langen Anzeigenamen der in der schmalen Karte umbrechen muss'
    const reise = beispielreise({
      id: 'trip-matrix-css',
      travellers: 1,
      party: [person({ clientRef: 'traveller:1', label: lang })],
    })
    const { page, schliessen } = await oeffnen(browser, bundle, css, { art: 'account', reise })
    try {
      await page.waitForFunction(() => window.__MATRIX__)
      await page.emulateMedia({ reducedMotion: 'reduce' })
      const ziel = await karte(page, 'traveller:1')
      await ziel.getByRole('button', { name: 'Weitere Staatsbürgerschaft', exact: true }).click()
      await ziel.getByRole('button', { name: 'Weiteres Dokument', exact: true }).click()
      for (const width of BREITEN) {
        await ueberlauf(page, width)
        if (width === 320 || width === 1280) {
          await page.screenshot({
            path: `docs/evidence/trip-traveller-snapshot-workflow-completion-1/state-rows-${width}.png`,
            fullPage: true,
          })
        }
      }
      await ziel.getByRole('button', { name: 'Angaben entfernen', exact: true }).click()
      await ueberlauf(page, 320)
      await page.screenshot({ path: 'docs/evidence/trip-traveller-snapshot-workflow-completion-1/state-confirm-320.png', fullPage: true })
      await page.keyboard.press('Escape')

      await page.evaluate(() => window.__MATRIX__.verhalten('hold'))
      await ziel.getByRole('button', { name: 'Angaben speichern', exact: true }).click()
      await page.getByText('Die Angaben werden gespeichert …').waitFor()
      await ueberlauf(page, 320)
      await page.screenshot({ path: 'docs/evidence/trip-traveller-snapshot-workflow-completion-1/state-pending-320.png', fullPage: true })
      await page.evaluate(() => window.__MATRIX__.freigeben('string'))
      await page.getByText('Das Ergebnis ist nicht bekannt.').first().waitFor()
      await ueberlauf(page, 320)
      await page.screenshot({ path: 'docs/evidence/trip-traveller-snapshot-workflow-completion-1/state-unknown-320.png', fullPage: true })

      const anders = beispielreise({
        ...reise,
        party: [person({ clientRef: 'traveller:1', label: lang, residenceCountryCode: 'FR' })],
      })
      await ziel.getByRole('combobox', { name: 'Wohnsitzland, falls relevant', exact: true }).selectOption('IT')
      await page.evaluate((wert) => window.__MATRIX__.kanonischSetzen(wert), anders)
      await page.getByText('Die geladenen Angaben haben sich geändert.').waitFor()
      await ueberlauf(page, 320)
      await page.screenshot({ path: 'docs/evidence/trip-traveller-snapshot-workflow-completion-1/state-conflict-320.png', fullPage: true })
      await page.evaluate((wert) => window.__MATRIX__.beideSetzen(wert), beispielreise({ ...reise, party: [] }))
      await page.getByText('nicht mehr vorhanden').waitFor()
      await ueberlauf(page, 320)
      await page.screenshot({ path: 'docs/evidence/trip-traveller-snapshot-workflow-completion-1/state-absent-320.png', fullPage: true })
    } finally {
      await schliessen()
    }
  })
})
