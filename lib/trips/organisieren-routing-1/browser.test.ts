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
  { name: '390', width: 390, height: 844 },
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
        build.onResolve({ filter: /^@\// }, (args) => build.resolve(join(process.cwd(), args.path.slice(2)), { resolveDir: process.cwd(), kind: args.kind }))
        build.onLoad({ filter: /.*/, namespace: 'org-leer' }, (args) => {
          const module: Record<string, string> = {
            dynamic: 'export default function dynamic(){return function Dynamisch(){return null}}',
            link: 'export default function Link(props){return props.children??null}',
            crypto: 'const hash=()=>({update(){return this},digest(){return ""}});export const createHmac=()=>hash();export const createHash=()=>hash();export const timingSafeEqual=()=>false;export const randomUUID=()=>"00000000-0000-4000-8000-000000000000";export default {}',
            next: 'export const cookies=()=>({get(){return undefined}});export const revalidatePath=()=>{};export const useRouter=()=>({push(){},replace(){}});export const usePathname=()=>"/";export const useSearchParams=()=>new URLSearchParams();export default function NextLeer(){return null}',
            node: 'export default {}',
            empty: 'export default {}',
          }
          return { contents: module[args.path] ?? 'export default {}', loader: 'js' }
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
            await page.locator(`[data-theme="${thema}"]`).click()
            await page.locator(`[data-workspace-theme="${thema}"]`).waitFor()
            const nav = page.locator('[data-workspace-mode-nav]:visible').first()
            await nav.getByRole('button', { name: 'Organisieren', exact: true }).click()
            await page.getByRole('tab', { name: fall.tab, exact: true }).click()
            const bestand = page.locator(`[data-organisieren-bestand="${fall.kategorie}"]`)
            await bestand.waitFor()
            await pruefeFlaeche(page, name, 'kategorie')
            const zeile = bestand.getByRole('button', { name: new RegExp(fall.titel.replace('–', '.')) })
            await zeile.click()
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
              await page.locator('[data-workspace-detail] h2').scrollIntoViewIfNeeded()
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
            belege.push({ name, planUrl, zurueck: page.url(), kayak: false, ueberlauf: false })
          } finally {
            await page.close()
          }
        }
      }
    }
  })
})

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
