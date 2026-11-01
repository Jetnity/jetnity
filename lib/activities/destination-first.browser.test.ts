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

import { ruhigKlicken } from '@/scripts/activities-destination-first-1/browser-interaction'

import { mountActivitiesDestinationHarness } from '@/scripts/activities-destination-first-1/browser-harness'

test('the destination harness stays imported for reachability', () => {
  assert.equal(typeof mountActivitiesDestinationHarness, 'function')
})

const ARTIFACTS = process.env.ACTIVITIES_DESTINATION_ARTIFACT_DIR ?? join(tmpdir(), 'activities-destination-first-1')

function angebot(name: string) {
  return {
    status: 'ok',
    message: 'Synthetische Fixture, kein Anbieterbeleg.',
    coverageNote: 'Fixture.',
    evidenz: {
      hatOrt: true,
      hatKoordinaten: false,
      hatTag: false,
      hatDatum: false,
      hatBestehendePunkte: false,
      hatBelastbareZeiten: false,
      hatInteressen: false,
      hatBudget: false,
    },
    options: [
      {
        id: `fixture:${name}`,
        provider: 'viator',
        externalRef: `fixture-${name}`,
        title: `Synthetisch ${name}`,
        description: null,
        punkt: null,
        dauerMinuten: 60,
        timeslot: null,
        preis: 10,
        preisWaehrung: 'CHF',
        bewertung: null,
        bewertungenAnzahl: null,
        stornierbar: null,
        kategorien: [],
        tags: [],
        bildUrl: null,
        preisRolle: 'rrp_from',
        labels: [],
        reasons: [],
        konflikt: 'unbekannt',
        locationName: name,
      },
    ],
  }
}

async function css(): Promise<string> {
  const verlangen = createRequire(import.meta.url)
  const postcss = verlangen('postcss') as (plugins: unknown[]) => {
    process: (css: string, opts: { from: string }) => Promise<{ css: string }>
  }
  const nesting = verlangen('tailwindcss/nesting') as () => unknown
  const tailwindcss = verlangen('tailwindcss') as (config: unknown) => unknown
  const autoprefixer = verlangen('autoprefixer') as () => unknown
  const config = verlangen(join(process.cwd(), 'tailwind.config.js')) as unknown
  const dateien = [
    'styles/globals.css',
    'styles/white-mint.css',
    'components/workspace/workspace.css',
    'components/workspace/workspace-surfaces.css',
  ]
  const teile: string[] = []
  for (const datei of dateien) {
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
    entryPoints: ['scripts/activities-destination-first-1/browser-harness.tsx'],
    bundle: true,
    write: false,
    format: 'iife',
    platform: 'browser',
    jsx: 'automatic',
    define: { 'process.env.NODE_ENV': '"production"' },
    banner: { js: 'globalThis.process=globalThis.process||{env:{NODE_ENV:"production"}};' },
    plugins: [
      {
        name: 'activities-shims',
        setup(build) {
          build.onResolve({ filter: /^server-only$/ }, () => ({ path: 'server-only', namespace: 'leer' }))
          build.onResolve({ filter: /^next\// }, (args) => ({ path: args.path, namespace: 'leer' }))
          build.onResolve({ filter: /^@\/lib\/places\/aktionen$/ }, () => ({
            path: join(process.cwd(), 'scripts/activities-destination-first-1/aktionen-stub.ts'),
          }))
          build.onResolve({ filter: /^@\// }, (args) =>
            build.resolve(join(process.cwd(), args.path.slice(2)), { resolveDir: process.cwd(), kind: args.kind }),
          )
          build.onLoad({ filter: /.*/, namespace: 'leer' }, () => ({
            contents: [
              'export default function(){return null}',
              'export function cookies(){return { get(){return undefined}, getAll(){return []} }}',
              'export function headers(){return { get(){return null} }}',
              'export function useRouter(){return { push(){}, replace(){}, back(){} }}',
            ].join('\n'),
            loader: 'js',
          }))
        },
      },
    ],
  })
  const js = gebaut.outputFiles[0]?.text
  if (!js) throw new Error('Activities harness bundle was empty')
  return js
}

describe('Activities destination-first browser harness', { timeout: 120_000 }, () => {
  let browser: Browser
  let server: Server
  let origin: string
  const suchen: Array<{ stage?: { id?: string; name?: string }; day?: { id?: string; dayDate?: string } | null }> = []
  const rahmen: string[] = []
  const viator: string[] = []

  before(async () => {
    mkdirSync(ARTIFACTS, { recursive: true })
    const style = await css()
    const script = await bundle()
    const html = `<!doctype html><html><head><meta charset="utf-8" /><meta name="viewport" content="width=device-width, initial-scale=1" /><style>${style}</style></head><body><div id="root"></div><script>${script}</script></body></html>`
    server = createServer((req, res) => {
      const url = new URL(req.url ?? '/', 'http://127.0.0.1')
      if (url.pathname === '/api/activities/search') {
        const stuecke: Buffer[] = []
        req.on('data', (stueck) => stuecke.push(stueck))
        req.on('end', () => {
          const roh = JSON.parse(Buffer.concat(stuecke).toString('utf8')) as {
            stage?: { id?: string; name?: string }
            day?: { id?: string; dayDate?: string } | null
          }
          suchen.push(roh)
          const name =
            roh.stage?.id === 'stage-kc'
              ? 'Ko Chang'
              : roh.stage?.id === 'stage-phu'
                ? 'Phuket'
                : roh.stage?.id === 'stage-cm'
                  ? 'Chiang Mai'
                  : roh.stage?.id === 'stage-rueck'
                    ? 'Bangkok Rück'
                    : 'Bangkok'
          res.setHeader('content-type', 'application/json')
          res.end(JSON.stringify(angebot(name)))
        })
        return
      }
      if (url.pathname === '/embed/viator') {
        viator.push(url.search)
        res.setHeader('content-type', 'text/html; charset=utf-8')
        res.end('<!doctype html><title>viator-fixture</title><p>Synthetischer Viator-Rahmen</p>')
        return
      }
      if (url.pathname === '/embed/getyourguide') {
        rahmen.push(url.search)
        res.setHeader('content-type', 'text/html; charset=utf-8')
        res.end('<!doctype html><title>gyg-fixture</title><p>Synthetischer GetYourGuide-Rahmen</p>')
        return
      }
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

  async function seite(hash: string, breite: number, hoehe = 900): Promise<Page> {
    const page = await browser.newPage({ viewport: { width: breite, height: hoehe } })
    await page.route('**/*', (route) => new URL(route.request().url()).origin === origin ? route.continue() : route.abort())
    await page.addInitScript({ content: `(() => {
      if (location.hash.includes('cmp=absent')) return;
      if (location.hash.includes('cmp=malformed')) { window.PrivacyBee = {}; return; }
      const consents = {
        SECURITY_STORAGE: true, FUNCTIONALITY_STORAGE: true,
        ANALYTICS_STORAGE: !location.hash.includes('cmp=denied'), AD_STORAGE: true,
        AD_USER_DATA: true, AD_PERSONALIZATION: true, PERSONALIZATION_STORAGE: true,
      };
      window.PrivacyBee = {
        getConsent: (name) => consents[name], getAllConsents: () => ({ ...consents }), hasExplicitConsent: () => true,
      };
    })()` })
    await page.goto(`${origin}/${hash}`)
    return page
  }

  async function widgetLadevorgangAbwarten(page: Page, name: string) {
    // A destination label changes before the two async fixture frames finish.
    // Wait for that observable state before clicking below their changing layout.
    await page.waitForFunction((ziel) => {
      return [
        ['[data-viator-zustand="anzeige"]', 'Viator'],
        ['[data-gyg-phase="anzeige"]', 'GetYourGuide'],
      ].every(([selector, title]) => {
        const frame = document.querySelector(`${selector} iframe[title="${title}"]`)
        return frame instanceof HTMLIFrameElement && new URL(frame.src).searchParams.get('name') === ziel
      })
    }, name)
  }

  async function ohneUeberlauf(page: Page) {
    const mass = await page.evaluate(() => ({
      scroll: document.documentElement.scrollWidth,
      client: document.documentElement.clientWidth,
    }))
    assert.ok(mass.scroll <= mass.client + 1, JSON.stringify(mass))
  }

  test('known destinations open without a search click, including an unassigned first day', async () => {
    const vorher = suchen.length
    const page = await seite('#fall=thailand&thema=light', 1440)
    const bereich = page.getByRole('region', { name: 'Aktivitäten' })
    await bereich.locator('[data-viator-name="Bangkok"]').waitFor()
    assert.equal(await bereich.getAttribute('data-aktivitaet-ziel'), 'stage-bkk')
    assert.equal(await bereich.getAttribute('data-aktivitaet-tag'), '')
    assert.match(await bereich.innerText(), /Ideen für Bangkok · Datum später wählen/)
    assert.equal(await bereich.getByRole('button', { name: 'Aktivitäten suchen' }).count(), 0)
    assert.equal(suchen.length, vorher)
    await bereich.locator('[data-viator-zustand="anzeige"]').waitFor()
    await bereich.getByRole('region', { name: 'GetYourGuide' }).locator('iframe').waitFor()
    assert.equal(viator.at(-1), '?name=Bangkok')
    assert.equal((viator.at(-1) ?? '').includes('trip-synth'), false)
    assert.equal((viator.at(-1) ?? '').includes('day-ab'), false)
    assert.equal((rahmen.at(-1) ?? '').includes('trip-synth'), false)
    await page.locator('#activity-destination-select').selectOption('stage-kc')
    await bereich.locator('[data-viator-name="Ko Chang"]').waitFor()
    assert.equal(suchen.length, vorher)
    await page.locator('#activity-destination-select').selectOption('stage-phu')
    await bereich.locator('[data-viator-name="Phuket"]').waitFor()
    await widgetLadevorgangAbwarten(page, 'Phuket')
    await ruhigKlicken(bereich.getByRole('button', { name: 'Für dieses Ziel suchen' }))
    await bereich.getByText('Synthetisch Phuket', { exact: true }).waitFor()
    assert.equal(suchen.at(-1)?.day ?? null, null)
    assert.deepEqual((suchen.at(-1) as { items?: unknown[] } | undefined)?.items ?? null, [])
    await page.getByLabel('Reisetag').selectOption({ label: 'Bangkok-Tag' })
    await bereich.locator('[data-viator-name="Bangkok"]').waitFor()
    await widgetLadevorgangAbwarten(page, 'Bangkok')
    await ruhigKlicken(bereich.getByRole('button', { name: 'Für diesen Tag suchen' }))
    await bereich.getByText('Synthetisch Bangkok', { exact: true }).waitFor()
    assert.equal(suchen.at(-1)?.day?.id, 'day-bkk')
    assert.equal(suchen.at(-1)?.stage?.id, 'stage-bkk')
    assert.equal(suchen.at(-1)?.stage?.name, 'Bangkok')
    await bereich.getByRole('button', { name: 'In die Reise' }).click()
    const schriebe = await page.evaluate(() => window.__aktivitaetSchriebe ?? [])
    assert.deepEqual(schriebe, [{ etappeId: 'stage-bkk', tagId: 'day-bkk' }])
    await page.screenshot({ path: join(ARTIFACTS, 'thailand-1440-hell.png'), fullPage: true })
    await ohneUeberlauf(page)
    await page.close()
  })

  test('repeated visits stay distinct and a hidden surface does not search', async () => {
    const page = await seite('#fall=wiederholung', 1280)
    const bereich = page.getByRole('region', { name: 'Aktivitäten' })
    await bereich.locator('[data-viator-name="Bangkok"]').waitFor()
    assert.equal(await bereich.getAttribute('data-aktivitaet-ziel'), 'stage-hin')
    const optionen = await page.locator('#activity-destination-select option').allTextContents()
    assert.equal(optionen.filter((text) => text.startsWith('Bangkok')).length, 2)
    assert.notEqual(optionen[0], optionen[2])
    const suchenVorher = suchen.length
    await page.locator('#activity-destination-select').selectOption('stage-rueck')
    await page.waitForTimeout(50)
    assert.equal(await bereich.getAttribute('data-aktivitaet-ziel'), 'stage-rueck')
    assert.equal(suchen.length, suchenVorher)
    const vorAus = viator.length
    await page.getByRole('region', { name: 'Viator' }).getByRole('button', { name: 'Ausblenden' }).click()
    await page.locator('#activity-destination-select').selectOption('stage-cm')
    await page.waitForTimeout(80)
    assert.equal(viator.length, vorAus)
    await page.getByRole('region', { name: 'Viator' }).getByRole('button', { name: 'Erneut anzeigen' }).click()
    await bereich.locator('[data-viator-name="Chiang Mai"]').waitFor()
    await bereich.locator('[data-viator-zustand="anzeige"]').waitFor()
    assert.equal(viator.length, vorAus + 1)
    const stand = suchen.length
    await page.getByRole('button', { name: 'Fläche verdecken' }).click()
    await page.waitForTimeout(50)
    assert.equal(suchen.length, stand)
    await page.screenshot({ path: join(ARTIFACTS, 'wiederholung-1280-hell.png'), fullPage: true })
    await page.close()
  })

  test('country-only and conflicting places do not look like a city day list', async () => {
    const land = await seite('#fall=land', 390, 844)
    await land.getByText('Thailand ist ein Land').waitFor()
    assert.equal(await land.getByText('Synthetisch').count(), 0)
    assert.equal(suchen.some((eintrag) => eintrag.stage?.id === 'stage-th'), false)
    await land.screenshot({ path: join(ARTIFACTS, 'land-390-hell.png'), fullPage: true })
    await land.close()
    const konflikt = await seite('#fall=widerspruch', 768)
    const bereich = konflikt.getByRole('region', { name: 'Aktivitäten' })
    await bereich.locator('[data-viator-name="Phuket"]').waitFor()
    assert.equal(await bereich.getAttribute('data-aktivitaet-ziel'), 'stage-phu')
    await konflikt.getByLabel('Ziel').selectOption({ index: 0 })
    await bereich.getByText('passen nicht zusammen').first().waitFor()
    assert.equal(await bereich.getByText('Synthetisch').count(), 0)
    await konflikt.screenshot({ path: join(ARTIFACTS, 'widerspruch-768-hell.png'), fullPage: true })
    await konflikt.close()
  })

  test('malformed CMP, refusal and withdrawal never become a navigation grant', async () => {
    for (const hash of ['#fall=thailand&cmp=malformed', '#fall=thailand&cmp=denied']) {
      const start = [viator.length, rahmen.length]
      const page = await seite(hash, 390)
      await page.locator('[data-activity-widget-blocked="viator"]').waitFor()
      await page.getByLabel('Ziel').selectOption('stage-kc')
      await page.getByRole('button', { name: 'Für dieses Ziel suchen' }).click()
      await page.getByText('Synthetisch Ko Chang', { exact: true }).waitFor()
      assert.equal(await page.locator('iframe').count(), 0)
      assert.deepEqual([viator.length, rahmen.length], start)
      await page.close()
    }
    const page = await seite('#fall=thailand', 390)
    await page.locator('[data-viator-zustand="anzeige"]').waitFor()
    await page.getByRole('region', { name: 'GetYourGuide' }).locator('iframe').waitFor()
    const start = [viator.length, rahmen.length]
    await page.evaluate(`(() => {
      const consents = { ...window.PrivacyBee.getAllConsents(), ANALYTICS_STORAGE: false };
      window.PrivacyBee = { getAllConsents: () => consents, getConsent: (name) => consents[name], hasExplicitConsent: () => true };
      document.dispatchEvent(new CustomEvent('privacybee:consent-changed', { detail: { granted: true } }));
    })()`)
    await page.locator('[data-activity-widget-blocked="viator"]').waitFor()
    await page.getByLabel('Ziel').selectOption('stage-phu')
    assert.equal(await page.locator('iframe').count(), 0)
    assert.deepEqual([viator.length, rahmen.length], start)
    await page.evaluate(`(() => {
      delete window.PrivacyBee;
      document.dispatchEvent(new CustomEvent('privacybee:consent-changed'));
    })()`)
    await page.locator('[data-activity-widget-blocked="viator"]').waitFor()
    assert.equal(await page.locator('iframe').count(), 0)
    // A reload without the previously observed API cannot restore display.
    await page.goto(`${origin}/#fall=thailand&cmp=absent`)
    await page.reload()
    await page.locator('[data-activity-widget-blocked="viator"]').waitFor()
    assert.equal(await page.locator('iframe').count(), 0)
    assert.deepEqual([viator.length, rahmen.length], start)
    await page.close()
  })

  test('owner-authorized first rollout shows both widgets without an extra load button', async () => {
    const page = await seite('#fall=thailand&cmp=absent', 390)
    await widgetLadevorgangAbwarten(page, 'Bangkok')
    assert.equal(await page.getByRole('region', { name: 'Viator' }).locator('iframe').count(), 1)
    assert.equal(await page.getByRole('region', { name: 'GetYourGuide' }).locator('iframe').count(), 1)
    await page.close()
  })

  test('hide survives unmount and reload and never grants consent', async () => {
    const page = await seite('#fall=thailand', 390)
    await page.locator('[data-viator-zustand="anzeige"]').waitFor()
    const gyg = page.getByRole('region', { name: 'GetYourGuide' })
    await gyg.locator('iframe').waitFor()
    await page.getByRole('region', { name: 'Viator' }).getByRole('button', { name: 'Ausblenden', exact: true }).click()
    await gyg.getByRole('button', { name: 'Ausblenden', exact: true }).click()
    const start = [viator.length, rahmen.length]
    await page.reload()
    await page.getByRole('region', { name: 'Viator' }).getByRole('button', { name: 'Erneut anzeigen' }).waitFor()
    assert.equal(await page.locator('iframe').count(), 0)
    assert.deepEqual([viator.length, rahmen.length], start)
    await page.getByRole('region', { name: 'Viator' }).getByRole('button', { name: 'Erneut anzeigen' }).click()
    await page.locator('[data-viator-zustand="anzeige"]').waitFor()
    assert.equal(viator.length, start[0] + 1)
    assert.equal(rahmen.length, start[1])
    await page.close()
  })

  test('white, green, mobile and enlarged text stay inside the viewport', async () => {
    const ansichten: Array<[string, number, number, string]> = [
      ['#fall=thailand&thema=light', 320, 700, 'thailand-320-hell.png'],
      ['#fall=thailand&thema=light', 844, 390, 'thailand-844-landschaft.png'],
      ['#fall=thailand&thema=green', 1440, 900, 'thailand-1440-gruen.png'],
      ['#fall=thailand&thema=green', 390, 844, 'thailand-390-gruen.png'],
    ]
    for (const [hash, breite, hoehe, datei] of ansichten) {
      const page = await seite(hash, breite, hoehe)
      await page.locator('[data-viator-name="Bangkok"]').waitFor()
      await ohneUeberlauf(page)
      await page.screenshot({ path: join(ARTIFACTS, datei), fullPage: true })
      await page.close()
    }
    const gross = await seite('#fall=thailand&thema=light', 320, 700)
    await gross.locator('[data-viator-name="Bangkok"]').waitFor()
    await gross.evaluate(() => {
      document.documentElement.style.fontSize = '32px'
    })
    const ziel = gross.locator('#activity-destination-select')
    await ziel.focus()
    assert.equal(await gross.evaluate(() => document.activeElement?.id), 'activity-destination-select')
    await ohneUeberlauf(gross)
    await gross.screenshot({ path: join(ARTIFACTS, 'thailand-320-200.png'), fullPage: true })
    await gross.close()
  })
})
