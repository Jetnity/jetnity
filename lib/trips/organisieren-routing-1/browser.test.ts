import assert from 'node:assert/strict'
import { createRequire } from 'node:module'
import { createServer, type Server } from 'node:http'
import { mkdirSync, mkdtempSync, readFileSync, writeFileSync } from 'node:fs'
import { tmpdir } from 'node:os'
import { join } from 'node:path'
import { after, before, describe, test } from 'node:test'
import type { AddressInfo } from 'node:net'

import * as esbuild from 'esbuild'
import { webkit, type Browser, type Page } from 'playwright'

const BROWSER_ARGS: string[] = []
const KAYAK = ['KAYAK · Testvorschau', 'Der passende Flug für deine Reise.', 'Hotels mit KAYAK entdecken']
const KOMBINATIONEN = [
  { kategorie: 'fluege', tab: 'Flüge', titel: 'ZRH–BKK', id: 'flug-zrh-bkk' },
  { kategorie: 'unterkunft', tab: 'Unterkunft', titel: 'Kata Beach', id: 'stay-kata' },
  { kategorie: 'aktivitaeten', tab: 'Aktivitäten', titel: 'Phukets Altstadt', id: 'act-altstadt' },
  { kategorie: 'mietwagen', tab: 'Mietwagen', titel: 'Mietwagen Phuket', id: 'mietwagen-hkt' },
  { kategorie: 'verbindungen', tab: 'Verbindungen', titel: 'Zum Pier', id: 'transfer-pier' },
] as const
const BREITEN = [
  { name: '320', width: 320, height: 700 },
  // 390×664 ist der iPhone-Viewport, in dem die fixierte Leiste die erste Zeile deckt.
  { name: '390', width: 390, height: 664 },
  { name: '1280', width: 1280, height: 800 },
] as const
const THEMEN = ['light', 'dark'] as const

async function projektCss(): Promise<string> {
  const verlangen = createRequire(import.meta.url)
  const postcss = verlangen('postcss') as (plugins: unknown[]) => {
    process: (css: string, opts: { from: string }) => Promise<{ css: string }>
  }
  const nesting = verlangen('tailwindcss/nesting') as () => unknown
  const tailwindcss = verlangen('tailwindcss') as (config: unknown) => unknown
  const autoprefixer = verlangen('autoprefixer') as () => unknown
  const from = join(process.cwd(), 'styles/globals.css')
  const config = verlangen(join(process.cwd(), 'tailwind.config.js')) as unknown
  const ergebnis = await postcss([nesting(), tailwindcss(config), autoprefixer()]).process(readFileSync(from, 'utf8'), { from })
  const extra = [
    'components/workspace/workspace.css',
    'components/workspace/workspace-surfaces.css',
    'components/trips/organisieren/organisieren.css',
    'components/trips/organisieren/hotelsuche.css',
    'components/trips/organisieren/fluege/flugsuche.css',
    'components/trips/reiseplan/etappen.css',
  ].map((pfad) => readFileSync(pfad, 'utf8')).join('\n')
  return `${ergebnis.css}\n${extra}`.replaceAll('</style', '<\\/style')
}

async function bundeln(): Promise<string> {
  const gebaut = await esbuild.build({
    absWorkingDir: process.cwd(),
    entryPoints: ['lib/trips/organisieren-routing-1/harness.tsx'],
    bundle: true,
    write: false,
    format: 'iife',
    platform: 'browser',
    jsx: 'automatic',
    outfile: join(mkdtempSync(join(tmpdir(), 'org-routing-')), 'harness.js'),
    define: { 'process.env.NODE_ENV': '"production"' },
    banner: { js: 'var __name=(target)=>target;globalThis.process=globalThis.process||{env:{NODE_ENV:"production"}};globalThis.global=globalThis;' },
    plugins: [{
      name: 'org-routing-shims',
      setup(build) {
        build.onResolve({ filter: /^server-only$/ }, () => ({ path: 'empty', namespace: 'org-leer' }))
        build.onResolve({ filter: /^node:crypto$/ }, () => ({ path: 'crypto', namespace: 'org-leer' }))
        build.onResolve({ filter: /^node:/ }, () => ({ path: 'node', namespace: 'org-leer' }))
        build.onResolve({ filter: /^next\/dynamic$/ }, () => ({ path: 'dynamic', namespace: 'org-leer' }))
        build.onResolve({ filter: /^next\/link$/ }, () => ({ path: 'link', namespace: 'org-leer' }))
        build.onResolve({ filter: /^next\// }, () => ({ path: 'next', namespace: 'org-leer' }))
        build.onResolve({ filter: /\.css$/ }, (args) => ({ path: args.path, namespace: 'org-css' }))
        build.onResolve({ filter: /^@\// }, (args) => build.resolve(join(process.cwd(), args.path.slice(2)), { resolveDir: process.cwd(), kind: args.kind }))
        build.onLoad({ filter: /.*/, namespace: 'org-css' }, () => ({ contents: 'export default {}', loader: 'js' }))
        build.onLoad({ filter: /.*/, namespace: 'org-leer' }, (args) => {
          const stubModules: Record<string, string> = {
            dynamic: 'export default function dynamic(){return function Dynamisch(){return null}}',
            link: 'import { createElement } from "react"; export default function Link(props){ return createElement("a", { href: props.href || "#", className: props.className, "aria-label": props["aria-label"], "aria-current": props["aria-current"], onClick: props.onClick }, props.children) }',
            crypto: 'const hash=()=>({update(){return this},digest(){return ""}});export const createHmac=()=>hash();export const createHash=()=>hash();export const timingSafeEqual=()=>false;export const randomUUID=()=>"00000000-0000-4000-8000-000000000000";export default {}',
            next: 'export const cookies=()=>({get(){return undefined}});export const revalidatePath=()=>{};export const redirect=()=>{};export const permanentRedirect=()=>{};export const notFound=()=>{};export const useRouter=()=>({push(){},replace(){},back(){},refresh(){},prefetch(){}});export const usePathname=()=>"/reisen/trip-phuket-routing";export const useParams=()=>({tripId:"trip-phuket-routing"});export const useSearchParams=()=>new URLSearchParams(typeof location==="undefined"?"":location.search);export default function NextLeer(){return null}',
            node: 'export default {}',
            empty: 'export default {}',
          }
          return { contents: stubModules[args.path] ?? 'export default {}', loader: 'js', resolveDir: process.cwd() }
        })
      },
    }],
  })
  const js = gebaut.outputFiles[0]?.text
  if (!js) throw new Error('Organisieren-Routing-Harness ist leer')
  return js
}

async function browserStarten(): Promise<Browser> {
  return webkit.launch({ headless: true, args: BROWSER_ARGS })
}

describe('Organisieren-Routing, gespeicherter Eintrag', { timeout: 300_000 }, () => {
  let browser: Browser
  let server: Server
  let origin: string
  const belege: unknown[] = []

  before(async () => {
    const css = await projektCss()
    const js = await bundeln()
    const dokument = `<!doctype html><html><head><meta charset="utf-8" /><meta name="viewport" content="width=device-width, initial-scale=1" /><style>${css}</style></head><body><div id="root"></div><script>${js}</script></body></html>`
    server = createServer((_req, res) => {
      res.writeHead(200, { 'content-type': 'text/html; charset=utf-8', 'cache-control': 'no-store' })
      res.end(dokument)
    })
    await new Promise<void>((resolve) => server.listen(0, '127.0.0.1', resolve))
    origin = `http://127.0.0.1:${(server.address() as AddressInfo).port}`
    browser = await browserStarten()
  })

  after(async () => {
    const ziel = process.env.ORGANISIEREN_ROUTING_OUT
    if (ziel) {
      mkdirSync(ziel, { recursive: true })
      writeFileSync(join(ziel, 'bericht.json'), JSON.stringify({ kombinationen: belege.length, belege }, null, 2))
    }
    await browser?.close()
    await new Promise<void>((resolve) => server?.close(() => resolve()))
  })

  test('fünf Kategorien, drei Breiten und Hell/Dunkel öffnen den Eintrag dieser Reise ohne KAYAK-Testvorschau', async () => {
    assert.equal(KOMBINATIONEN.length * BREITEN.length * THEMEN.length, 30)
    for (const breite of BREITEN) {
      for (const thema of THEMEN) {
        for (const fall of KOMBINATIONEN) {
          const name = `${fall.kategorie}-${breite.name}-${thema}`
          const page = await browser.newPage({
            viewport: { width: breite.width, height: breite.height },
            hasTouch: breite.width < 1024,
            colorScheme: thema,
          })
          if (thema === 'dark') {
            await page.addInitScript(() => localStorage.setItem('jetnity:workspace-theme:v1', 'dark'))
          }
          page.setDefaultTimeout(20_000)
          const seitenfehler: string[] = []
          page.on('pageerror', (error) => seitenfehler.push(error.message))
          page.on('console', (msg) => {
            if (msg.type() === 'error') seitenfehler.push(msg.text().slice(0, 400))
          })
          try {
            await page.goto(`${origin}/?ansicht=organisieren`, { waitUntil: 'domcontentloaded' })
            try {
              await page.locator('[data-organisieren-routing]').waitFor()
            } catch (error) {
              throw new Error(`${name} Harness fehlt\n${seitenfehler.slice(0, 6).join('\n')}\n${error instanceof Error ? error.message : error}`)
            }
            await page.locator(`.workspace-shell[data-workspace-theme="${thema}"]`).waitFor()
            const darstellung = await page.evaluate(() => {
              const shell = document.querySelector('.workspace-shell')
              if (!shell) return null
              const stil = getComputedStyle(shell)
              return { schema: stil.colorScheme, hintergrund: stil.getPropertyValue('--workspace-bg').trim() }
            })
            assert.equal(darstellung?.schema, thema === 'dark' ? 'dark' : 'light', `${name} Darstellung`)
            if (thema === 'dark') assert.equal(darstellung?.hintergrund, '#121921', `${name} dunkle Fläche`)
            const nav = page.locator('[data-workspace-mode-nav]:visible').first()
            await nav.getByRole('button', { name: 'Organisieren', exact: true }).click()
            await page.evaluate((label) => {
              const knopf = [...document.querySelectorAll<HTMLButtonElement>('[role="tab"]')].find((el) => (el.textContent ?? '').includes(label))
              knopf?.click()
            }, fall.tab)
            const bestand = page.locator(`[data-organisieren-bestand="${fall.kategorie}"]`)
            await bestand.waitFor()
            const sucheSchalter = page.locator(`[data-organisieren-suche-toggle="${fall.kategorie}"]`)
            assert.equal(await sucheSchalter.getAttribute('aria-expanded'), 'false', `${name} Suche von allein offen`)
            assert.equal(await page.locator(`[data-organisieren-suche="${fall.kategorie}"]`).isVisible(), false, `${name} Suchfläche sichtbar`)
            await page.evaluate(() => new Promise((resolve) => requestAnimationFrame(() => requestAnimationFrame(() => resolve(undefined)))))
            await pruefeFlaeche(page, name, 'kategorie')
            let lage = await zeileLage(page, fall.kategorie)
            if (lage.ueberdeckt) {
              assert.equal(lage.trifftZeile, true, `${name} erste Zeile liegt unter der Leiste ${JSON.stringify(lage)}`)
            } else if (!lage.imBild && lage.rect) {
              await page.evaluate((oben) => {
                window.scrollTo({ top: window.scrollY + oben - 80, behavior: 'instant' })
              }, lage.rect.top)
              lage = await zeileLage(page, fall.kategorie)
            }
            assert.equal(lage.trifftZeile, true, `${name} erste Zeile nicht antippbar ${JSON.stringify(lage)}`)
            if (lage.fest && lage.rect) {
              const hoehe = lage.rect.bottom - lage.rect.top
              if (hoehe <= lage.dock - 8) {
                assert.ok(lage.rect.bottom <= lage.dock - 7, `${name} Zeile ragt in die Leiste ${JSON.stringify(lage)}`)
              }
            }
            if (process.env.ORGANISIEREN_ROUTING_OUT && breite.name === '390') {
              mkdirSync(process.env.ORGANISIEREN_ROUTING_OUT, { recursive: true })
              await page.screenshot({ path: join(process.env.ORGANISIEREN_ROUTING_OUT, `${name}-zeile.png`) })
            }
            if (breite.width < 1024) await page.touchscreen.tap(lage.x, lage.y)
            else await page.mouse.click(lage.x, lage.y)
            await page.waitForFunction(
              (id) => new URL(location.href).searchParams.get('punkt') === id,
              fall.id,
            )
            const url = new URL(page.url())
            assert.equal(url.searchParams.get('ansicht'), 'plan', name)
            assert.equal(url.searchParams.get('punkt'), fall.id, name)
            assert.equal(await page.locator('[data-reise-id]').getAttribute('data-reise-id'), 'trip-phuket-routing', name)
            assert.equal(await page.locator('[data-reise-revision]').getAttribute('data-reise-revision'), '1', name)
            assert.equal(await page.locator('[data-workspace-detail]').getAttribute('data-detail-item'), fall.id, name)
            assert.equal(await page.locator('[data-workspace-detail]').getAttribute('data-detail-suche'), 'aus', name)
            await page.getByRole('heading', { name: fall.titel, exact: true }).waitFor()
            await pruefeFlaeche(page, name, 'eintrag')
            const planUrl = page.url()
            const ziel = process.env.ORGANISIEREN_ROUTING_OUT
            if (ziel) {
              mkdirSync(ziel, { recursive: true })
              await page.screenshot({ path: join(ziel, `${name}.png`) })
            }
            const fokusVerborgen = await page.evaluate(() => {
              const aktiv = document.activeElement
              return !aktiv || aktiv === document.body || !!aktiv.closest('[hidden], [inert]')
            })
            assert.equal(fokusVerborgen, false, `${name} Fokus`)
            await page.goBack()
            await page.waitForFunction(() => new URL(location.href).searchParams.get('ansicht') === 'organisieren')
            assert.equal(await page.locator('[data-reise-revision]').getAttribute('data-reise-revision'), '1', `${name} nach Zurück`)
            await bestand.waitFor()
            await pruefeFlaeche(page, name, 'zurueck')
            if (name === 'fluege-390-light') {
              await page.evaluate(() => {
                document.querySelector<HTMLButtonElement>('[data-organisieren-suche-toggle="fluege"]')?.click()
              })
              await page.locator('[data-organisieren-suche="fluege"]').waitFor({ state: 'visible' })
              await page.evaluate(() => {
                document.querySelector<HTMLButtonElement>('[data-organisieren-suche-toggle="fluege"]')?.click()
              })
              await page.locator('[data-organisieren-suche="fluege"]').waitFor({ state: 'hidden' })
            }
            belege.push({ name, planUrl, zurueck: page.url(), kayak: false, ueberlauf: false })
          } finally {
            await page.close()
          }
        }
      }
    }
    const einstieg = await browser.newPage({ viewport: { width: 390, height: 664 }, hasTouch: true, colorScheme: 'light' })
    einstieg.setDefaultTimeout(20_000)
    await einstieg.goto(`${origin}/?ansicht=organisieren&kategorie=unterkunft&etappe=stage-hkt`, { waitUntil: 'domcontentloaded' })
    await einstieg.locator('[data-organisieren-suche-toggle="unterkunft"]').waitFor()
    assert.equal(await einstieg.locator('[data-organisieren-suche-toggle="unterkunft"]').getAttribute('aria-expanded'), 'true')
    await einstieg.locator('[data-organisieren-suche="unterkunft"]').waitFor({ state: 'visible' })
    await einstieg.evaluate(() => {
      document.querySelector<HTMLButtonElement>('[data-organisieren-suche-toggle="unterkunft"]')?.click()
    })
    await einstieg.locator('[data-organisieren-suche="unterkunft"]').waitFor({ state: 'hidden' })
    await einstieg.close()
  })
})

async function zeileLage(page: Page, kategorie: string) {
  return page.evaluate((key) => {
    const zeile = document.querySelector(`[data-organisieren-bestand="${key}"] button.org-bestand-zeile`)
    if (!zeile) return { fehlt: true, trifftZeile: false, fest: false, x: 0, y: 0, scrollY: window.scrollY, rect: null, dock: window.innerHeight }
    const rect = zeile.getBoundingClientRect()
    const fest = [...document.querySelectorAll('.workspace-bottom-nav, .workspace-cost-bar')].filter((el) => {
      const kasten = el.getBoundingClientRect()
      return getComputedStyle(el).position === 'fixed' && kasten.height > 0 && kasten.width > 0
    })
    const dock = fest.reduce((kante, el) => Math.min(kante, el.getBoundingClientRect().top), window.innerHeight)
    const x = rect.left + rect.width / 2
    const y = Math.min(rect.top + 16, rect.bottom - 8)
    const imBild = y >= 0 && y < window.innerHeight && x >= 0 && x < window.innerWidth
    const ueberdeckt = fest.length > 0 && imBild && y >= dock
    const hit = imBild ? document.elementFromPoint(x, y) : null
    const kette: string[] = []
    let knoten = hit
    while (knoten && kette.length < 5) {
      kette.push(`${knoten.tagName}.${String(knoten.className || '').slice(0, 60)}`)
      knoten = knoten.parentElement
    }
    return {
      fehlt: false,
      rect: { top: rect.top, bottom: rect.bottom },
      dock,
      x,
      y,
      imBild,
      ueberdeckt,
      fest: fest.length > 0,
      trifftZeile: Boolean(hit && (hit === zeile || zeile.contains(hit))),
      kette,
      scrollY: window.scrollY,
    }
  }, kategorie)
}

async function pruefeFlaeche(page: Page, name: string, schritt: string) {
  for (const text of KAYAK) {
    const treffer = page.getByText(text, { exact: false })
    const anzahl = await treffer.count()
    for (let index = 0; index < anzahl; index += 1) {
      assert.equal(await treffer.nth(index).isVisible(), false, `${name} ${schritt} zeigt «${text}»`)
    }
  }
  const mass = await page.evaluate(() => {
    const wurzel = document.documentElement
    const titel = document.querySelector('[data-workspace-detail] h2, [data-organisieren-bestand] b')
    const rect = titel?.getBoundingClientRect()
    return {
      ueberlauf: wurzel.scrollWidth - wurzel.clientWidth,
      links: rect ? rect.left : 0,
      rechts: rect ? rect.right : 0,
      breite: window.innerWidth,
    }
  })
  assert.ok(mass.ueberlauf <= 1, `${name} ${schritt} scrollt horizontal um ${mass.ueberlauf}px`)
  if (mass.rechts > 0) {
    assert.ok(mass.links >= -1, `${name} ${schritt} Titel links abgeschnitten`)
    assert.ok(mass.rechts <= mass.breite + 1, `${name} ${schritt} Titel rechts abgeschnitten`)
  }
}
