import assert from 'node:assert/strict'
import { createRequire } from 'node:module'
import { createServer, type Server } from 'node:http'
import { mkdirSync, readFileSync, writeFileSync } from 'node:fs'
import { join } from 'node:path'
import { after, before, describe, test } from 'node:test'
import type { AddressInfo } from 'node:net'

import * as esbuild from 'esbuild'
import { chromium, type Browser, type BrowserContext, type Page } from 'playwright'

import { createBrowserClient } from '@/lib/ui/white-mint-home-workspace-1/supabase-stub'
import { signOutAction } from '@/lib/ui/white-mint-home-workspace-1/sign-out-stub'
import { usePathname } from '@/lib/ui/white-mint-home-workspace-1/navigation'
import Image from '@/lib/ui/white-mint-home-workspace-1/image'
import Link from '@/lib/ui/white-mint-home-workspace-1/link'
import { WHITE_MINT, aehnlich, type Rgb } from '@/lib/ui/white-mint-home-workspace-1/palette'

async function harnessModul() {
  return import('@/lib/ui/white-mint-home-workspace-1/harness')
}

test('local shims stay on the fixture import path', () => {
  assert.equal(typeof createBrowserClient, 'function')
  assert.equal(typeof signOutAction, 'function')
  assert.equal(typeof usePathname, 'function')
  assert.equal(typeof Image, 'function')
  assert.equal(typeof Link, 'function')
  assert.equal(typeof harnessModul, 'function')
  const harness = readFileSync(join(process.cwd(), 'lib/ui/white-mint-home-workspace-1/harness.tsx'), 'utf8')
  assert.match(harness, /function WhiteMintHarness/)
  assert.match(harness, /whiteMintHarnessMounted/)
  const thema = readFileSync(join(process.cwd(), 'components/workspace/useWorkspaceTheme.ts'), 'utf8')
  assert.match(thema, /jetnity:workspace-theme:v1/)
})

const BREITEN = [320, 390, 768, 1440] as const
const EVIDENCE = join(process.cwd(), 'docs/evidence/white-mint-home-workspace-1')
const ARTIFACTS = '/opt/cursor/artifacts/white-mint'
const THEME_KEY = 'jetnity:workspace-theme:v1'
const BROWSER_ARGS = ['--no-sandbox', '--disable-dev-shm-usage']

type Schicht = 'basis' | 'mint'

function playwrightChromiumFehlt(fehler: unknown) {
  const meldung = fehler instanceof Error ? fehler.message : String(fehler)
  return meldung.includes("Executable doesn't exist")
}

async function browserStarten() {
  try {
    const gestartet = await chromium.launch({ headless: true, args: BROWSER_ARGS })
    return { browser: gestartet, kanal: 'playwright-chromium' as const }
  } catch (fehler) {
    if (!playwrightChromiumFehlt(fehler)) throw fehler
    const gestartet = await chromium.launch({ headless: true, channel: 'chrome', args: BROWSER_ARGS })
    return { browser: gestartet, kanal: 'chrome' as const }
  }
}

async function projektCss(mint: boolean) {
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
  const workspace = readFileSync(join(process.cwd(), 'components/workspace/workspace.css'), 'utf8')
  const surfaces = readFileSync(join(process.cwd(), 'components/workspace/workspace-surfaces.css'), 'utf8')
  const weiss = mint ? readFileSync(join(process.cwd(), 'styles/white-mint.css'), 'utf8') : ''
  return `${ergebnis.css}\n${workspace}\n${surfaces}\n${weiss}`.replaceAll('</style', '<\\/style')
}

async function bundeln() {
  const wurzel = process.cwd()
  const gebaut = await esbuild.build({
    absWorkingDir: wurzel,
    entryPoints: ['lib/ui/white-mint-home-workspace-1/harness.tsx'],
    bundle: true,
    write: false,
    format: 'iife',
    platform: 'browser',
    jsx: 'automatic',
    define: { 'process.env.NODE_ENV': '"production"' },
    banner: { js: 'var __name=(target)=>target;globalThis.process=globalThis.process||{env:{NODE_ENV:"production"}};globalThis.global=globalThis;' },
    plugins: [
      {
        name: 'white-mint-shims',
        setup(build) {
          const datei = (name: string) => join(wurzel, 'lib/ui/white-mint-home-workspace-1', name)
          build.onResolve({ filter: /^next\/link$/ }, () => ({ path: datei('link.tsx') }))
          build.onResolve({ filter: /^next\/image$/ }, () => ({ path: datei('image.tsx') }))
          build.onResolve({ filter: /^next\/navigation$/ }, () => ({ path: datei('navigation.tsx') }))
          build.onResolve({ filter: /^@\/app\/auth\/sign-out$/ }, () => ({ path: datei('sign-out-stub.ts') }))
          build.onResolve({ filter: /^@\/lib\/supabase\/client$/ }, () => ({ path: datei('supabase-stub.ts') }))
          build.onResolve({ filter: /\.css$/ }, (args) => ({ path: args.path, namespace: 'css-leer' }))
          build.onLoad({ filter: /.*/, namespace: 'css-leer' }, () => ({ contents: '', loader: 'js' }))
          build.onResolve({ filter: /^@\// }, (args) => {
            if (args.path === '@/app/auth/sign-out') return { path: datei('sign-out-stub.ts') }
            if (args.path === '@/lib/supabase/client') return { path: datei('supabase-stub.ts') }
            return build.resolve(join(wurzel, args.path.slice(2)), { resolveDir: wurzel, kind: args.kind })
          })
        },
      },
    ],
  })
  const js = gebaut.outputFiles[0]?.text
  if (!js) throw new Error('white-mint harness bundle was empty')
  return js
}

function html(css: string, js: string) {
  return `<!doctype html><html lang="de"><head><meta charset="utf-8" /><meta name="viewport" content="width=device-width, initial-scale=1" /><style>${css}</style></head><body><div id="root"></div><script>${js}</script></body></html>`
}

let browser: Browser
let server: Server
let origin = ''
let dokumente: Record<Schicht, string> = { basis: '', mint: '' }
const protokoll: Record<string, unknown> = {}

function rgbAus(text: string | null | undefined): Rgb | null {
  if (!text) return null
  const treffer = text.match(/rgba?\((\d+),\s*(\d+),\s*(\d+)/)
  if (!treffer) return null
  return [Number(treffer[1]), Number(treffer[2]), Number(treffer[3])]
}

async function oeffnen(optionen: {
  schicht: Schicht
  pfad: string
  breite: number
  hoehe?: number
  schrift?: string
  thema?: 'light' | 'green'
}) {
  const context = await browser.newContext({
    viewport: { width: optionen.breite, height: optionen.hoehe ?? 900 },
    deviceScaleFactor: 1,
  })
  const fremd: string[] = []
  await context.route('**/*', (route) => {
    let host = ''
    try {
      host = new URL(route.request().url()).hostname
    } catch {
      host = ''
    }
    if (host !== '127.0.0.1' && host !== 'localhost') {
      fremd.push(route.request().url())
      return route.abort()
    }
    return route.continue()
  })
  await context.addInitScript(`(() => {
    window.__jetnityWhiteMintPath = ${JSON.stringify(optionen.pfad)};
    try { localStorage.setItem(${JSON.stringify(THEME_KEY)}, ${JSON.stringify(optionen.thema ?? 'light')}); } catch (e) {}
    ${optionen.schrift ? `(() => { const setzen = () => { if (document.documentElement) document.documentElement.style.fontSize = ${JSON.stringify(optionen.schrift)}; }; setzen(); document.addEventListener('DOMContentLoaded', setzen); })();` : ''}
  })();`)
  const page = await context.newPage()
  const fehler: string[] = []
  page.on('pageerror', (error) => fehler.push(error.message))
  await page.goto(`${origin}/?schicht=${optionen.schicht}`, { waitUntil: 'networkidle' })
  return { context, page, fehler, fremd }
}

async function schliessen(context: BrowserContext) {
  await context.close()
}

async function bild(page: Page, name: string) {
  mkdirSync(EVIDENCE, { recursive: true })
  mkdirSync(ARTIFACTS, { recursive: true })
  const datei = `${name}.png`
  await page.screenshot({ path: join(EVIDENCE, datei), fullPage: name.includes('full') })
  await page.screenshot({ path: join(ARTIFACTS, datei), fullPage: name.includes('full') })
}

describe('rendered white/mint homepage and light workspace', () => {
  before(async () => {
    const [basis, mint, js] = await Promise.all([projektCss(false), projektCss(true), bundeln()])
    dokumente = { basis: html(basis, js), mint: html(mint, js) }
    server = createServer((req, res) => {
      const url = new URL(req.url ?? '/', 'http://127.0.0.1')
      if (url.pathname === '/white-mint-provider-frame.html') {
        res.writeHead(200, { 'content-type': 'text/html; charset=utf-8' })
        res.end('<!doctype html><html><body style="margin:0;background:#123456;color:#ffffff">Anbieterrahmen</body></html>')
        return
      }
      if (url.pathname.startsWith('/images/') || url.pathname.startsWith('/brand/')) {
        const datei = join(process.cwd(), 'public', decodeURIComponent(url.pathname))
        const oeffentlich = join(process.cwd(), 'public')
        if (!datei.startsWith(oeffentlich)) {
          res.writeHead(404)
          res.end()
          return
        }
        try {
          res.writeHead(200)
          res.end(readFileSync(datei))
        } catch {
          res.writeHead(404)
          res.end()
        }
        return
      }
      if (url.pathname !== '/') {
        res.writeHead(404)
        res.end()
        return
      }
      const schicht: Schicht = url.searchParams.get('schicht') === 'basis' ? 'basis' : 'mint'
      res.writeHead(200, { 'content-type': 'text/html; charset=utf-8', 'cache-control': 'no-store' })
      res.end(dokumente[schicht])
    })
    await new Promise<void>((resolve) => server.listen(0, '127.0.0.1', resolve))
    origin = `http://127.0.0.1:${(server.address() as AddressInfo).port}`
    const gestartet = await browserStarten()
    browser = gestartet.browser
    protokoll.browser = { kanal: gestartet.kanal, version: gestartet.browser.version() }
  })

  after(async () => {
    mkdirSync(EVIDENCE, { recursive: true })
    writeFileSync(join(EVIDENCE, 'computed-colors.json'), JSON.stringify(protokoll, null, 2))
    writeFileSync(join(ARTIFACTS, 'computed-colors.json'), JSON.stringify(protokoll, null, 2))
    await browser?.close()
    if (server) await new Promise<void>((resolve, reject) => server.close((fehler) => (fehler ? reject(fehler) : resolve())))
  })

  test('the unscoped homepage still exposes the old beige canvas', async () => {
    const { context, page, fehler, fremd } = await oeffnen({ schicht: 'basis', pfad: '/', breite: 1440 })
    await page.waitForSelector('#start-titel')
    const hintergrund = rgbAus(await page.locator('main').evaluate((el) => getComputedStyle(el).backgroundColor))
    assert.equal(fehler.length, 0, fehler.join('\n'))
    assert.deepEqual(fremd, [])
    assert.equal(aehnlich(hintergrund, WHITE_MINT.beige, 2), true)
    await bild(page, 'before-homepage-1440')
    await schliessen(context)
  })

  test('homepage mint canvas, navigation, cards and footer stay legible', async () => {
    const messungen = []
    for (const breite of BREITEN) {
      const { context, page, fehler, fremd } = await oeffnen({ schicht: 'mint', pfad: '/', breite })
      await page.waitForSelector('#start-titel')
      const werte = await page.evaluate(() => {
        const lesen = (selektor: string) => {
          const el = document.querySelector(selektor)
          if (!(el instanceof HTMLElement)) return null
          const stil = getComputedStyle(el)
          return { hintergrund: stil.backgroundColor, farbe: stil.color }
        }
        const ueberlauf = document.documentElement.scrollWidth - document.documentElement.clientWidth
        const korn = getComputedStyle(document.body, '::before').opacity
        return {
          html: getComputedStyle(document.documentElement).backgroundColor,
          main: lesen('main[data-white-mint="home"]'),
          header: lesen('[data-white-mint="home"] > header'),
          karte: lesen('[data-white-mint="home"] .bg-white'),
          fuss: lesen('[data-white-mint="home"] footer'),
          ueberschrift: lesen('#start-titel'),
          korn,
          ueberlauf,
        }
      })
      assert.equal(fehler.length, 0, fehler.join('\n'))
      assert.deepEqual(fremd, [])
      assert.equal(aehnlich(rgbAus(werte.main?.hintergrund), WHITE_MINT.canvas), true, JSON.stringify(werte.main))
      assert.equal(aehnlich(rgbAus(werte.header?.hintergrund), WHITE_MINT.navigation), true, JSON.stringify(werte.header))
      assert.equal(aehnlich(rgbAus(werte.karte?.hintergrund), WHITE_MINT.card), true, JSON.stringify(werte.karte))
      assert.equal(aehnlich(rgbAus(werte.ueberschrift?.farbe), '#FFFFFF'), true)
      assert.ok((werte.ueberlauf ?? 99) <= 1, `overflow ${werte.ueberlauf} at ${breite}`)
      assert.equal(werte.korn, '0')
      if (breite === 390 || breite === 1440) await bild(page, `after-homepage-${breite}`)
      if (breite === 1440) await bild(page, 'after-homepage-1440-full')
      messungen.push({ breite, werte })
      await schliessen(context)
    }
    protokoll.homepage = messungen
  })

  test('light workspace uses the mint surfaces and keeps green untouched', async () => {
    const messungen = []
    for (const breite of BREITEN) {
      const { context, page, fehler, fremd } = await oeffnen({
        schicht: 'mint',
        pfad: '/reisen/trip-white-mint',
        breite,
        hoehe: breite < 800 ? 800 : 900,
      })
      await page.waitForSelector('.workspace-shell[data-workspace-theme="light"]')
      await page.waitForSelector('[data-synthetic-guest]')
      const werte = await page.evaluate(() => {
        const lesen = (selektor: string) => {
          const el = document.querySelector(selektor)
          if (!(el instanceof HTMLElement)) return null
          const stil = getComputedStyle(el)
          return { hintergrund: stil.backgroundColor, farbe: stil.color, schatten: stil.boxShadow }
        }
        return {
          shell: lesen('.workspace-shell'),
          nav: lesen('.workspace-sidebar'),
          gewaehlt: lesen('.workspace-nav-link[aria-current="page"]'),
          unten: lesen('.workspace-bottom-nav'),
          ueberlauf: document.documentElement.scrollWidth - document.documentElement.clientWidth,
        }
      })
      assert.equal(fehler.length, 0, fehler.join('\n'))
      assert.deepEqual(fremd, [])
      assert.equal(aehnlich(rgbAus(werte.shell?.hintergrund), WHITE_MINT.canvas), true, JSON.stringify(werte.shell))
      assert.equal(aehnlich(rgbAus(werte.shell?.farbe), WHITE_MINT.ink), true)
      assert.equal(aehnlich(rgbAus(werte.nav?.hintergrund), WHITE_MINT.navigation), true, JSON.stringify(werte.nav))
      if (werte.gewaehlt) {
        assert.equal(aehnlich(rgbAus(werte.gewaehlt.hintergrund), WHITE_MINT.selected), true, JSON.stringify(werte.gewaehlt))
        assert.match(werte.gewaehlt.schatten, /rgb\(20,\s*62,\s*51\)/)
      }
      if (breite < 1024) assert.ok(werte.unten, 'bottom navigation missing')
      assert.ok((werte.ueberlauf ?? 99) <= 1, `overflow ${werte.ueberlauf} at ${breite}`)
      if (breite === 390 || breite === 1440) await bild(page, `after-workspace-${breite}`)
      messungen.push({ breite, werte })
      await schliessen(context)
    }
    const basis = await oeffnen({ schicht: 'basis', pfad: '/reisen/trip-white-mint', breite: 1440 })
    await basis.page.waitForSelector('.workspace-shell')
    const vorher = rgbAus(await basis.page.locator('.workspace-shell').evaluate((el) => getComputedStyle(el).backgroundColor))
    assert.equal(aehnlich(vorher, WHITE_MINT.beige), true)
    await bild(basis.page, 'before-workspace-1440')
    await schliessen(basis.context)

    const konto = await oeffnen({ schicht: 'mint', pfad: '/account/settings', breite: 1440 })
    await konto.page.waitForSelector('.workspace-shell[data-workspace-theme="light"]')
    const gewaehlt = konto.page.locator('.workspace-nav-link[aria-current="page"]')
    assert.equal(await gewaehlt.innerText(), 'Einstellungen')
    const kontoFarbe = rgbAus(await gewaehlt.evaluate((el) => getComputedStyle(el).backgroundColor))
    assert.equal(aehnlich(kontoFarbe, WHITE_MINT.selected), true)
    await konto.page.locator('summary[aria-label="Kontomenü"]').click()
    const panel = rgbAus(await konto.page.locator('.workspace-account-panel').evaluate((el) => getComputedStyle(el).backgroundColor))
    assert.equal(aehnlich(panel, WHITE_MINT.card), true)
    await schliessen(konto.context)

    const gruen = await oeffnen({ schicht: 'mint', pfad: '/reisen/trip-white-mint', breite: 1440, thema: 'green' })
    await gruen.page.waitForSelector('.workspace-shell[data-workspace-theme="green"]')
    const gruenShell = await gruen.page.locator('.workspace-shell').evaluate((el) => ({
      hintergrund: getComputedStyle(el).backgroundColor,
      farbe: getComputedStyle(el).color,
    }))
    assert.equal(aehnlich(rgbAus(gruenShell.hintergrund), '#101F1B', 2), true, JSON.stringify(gruenShell))
    assert.equal(aehnlich(rgbAus(gruenShell.farbe), WHITE_MINT.ink), false)
    await gruen.page.getByRole('button', { name: 'Helle Darstellung aktivieren' }).click()
    await gruen.page.waitForSelector('.workspace-shell[data-workspace-theme="light"]')
    assert.equal(await gruen.page.evaluate((key) => localStorage.getItem(key), THEME_KEY), 'light')
    await gruen.page.getByRole('button', { name: 'Grünes Design aktivieren' }).click()
    await gruen.page.waitForSelector('.workspace-shell[data-workspace-theme="green"]')
    assert.equal(await gruen.page.evaluate((key) => localStorage.getItem(key), THEME_KEY), 'green')
    await gruen.page.getByRole('button', { name: 'Helle Darstellung aktivieren' }).click()
    await gruen.page.waitForSelector('.workspace-shell[data-workspace-theme="light"]')
    const wieder = rgbAus(await gruen.page.locator('.workspace-shell').evaluate((el) => getComputedStyle(el).backgroundColor))
    assert.equal(aehnlich(wieder, WHITE_MINT.canvas), true)
    await schliessen(gruen.context)
    protokoll.workspace = messungen
  })

  test('a synthetic guest note saves, reloads and keeps a visible focus and alert', async () => {
    const { context, page, fehler, fremd } = await oeffnen({
      schicht: 'mint',
      pfad: '/reisen/trip-white-mint',
      breite: 390,
      hoehe: 900,
    })
    await page.waitForSelector('text=Punkt hinzufügen')
    await page.getByRole('button', { name: 'Punkt hinzufügen' }).first().click()
    await page.getByLabel('Ort oder Aktivität').fill('Mint Markt')
    await page.getByLabel('Notiz, optional').fill('Weisse Karte')
    const fokus = await page.getByLabel('Notiz, optional').evaluate((el) => {
      el.focus()
      const stil = getComputedStyle(el)
      return { outline: stil.outlineColor, border: stil.borderColor, background: stil.backgroundColor, color: stil.color }
    })
    assert.equal(aehnlich(rgbAus(fokus.outline), WHITE_MINT.ink), true, JSON.stringify(fokus))
    assert.equal(aehnlich(rgbAus(fokus.border), WHITE_MINT.control), true, JSON.stringify(fokus))
    assert.equal(aehnlich(rgbAus(fokus.background), WHITE_MINT.card), true)
    assert.equal(aehnlich(rgbAus(fokus.color), WHITE_MINT.ink), true)
    await page.getByRole('button', { name: 'Speichern' }).click()
    await page.getByText('Weisse Karte').waitFor()
    await page.reload({ waitUntil: 'networkidle' })
    await page.getByText('Weisse Karte').waitFor()
    await page.getByRole('button', { name: 'Mint Markt bearbeiten' }).click()
    await page.getByLabel('Notiz, optional').fill('Nach dem Neuladen')
    await page.getByRole('button', { name: 'Speichern' }).click()
    await page.getByText('Nach dem Neuladen').waitFor()
    await page.reload({ waitUntil: 'networkidle' })
    await page.getByText('Nach dem Neuladen').waitFor()
    await page.getByRole('button', { name: 'Punkt hinzufügen' }).first().click()
    const formular = page.getByRole('form', { name: 'Punkt hinzufügen' })
    await formular.locator('input').first().evaluate((el) => el.removeAttribute('required'))
    await formular.getByRole('button', { name: 'Speichern' }).click()
    const alarm = formular.getByRole('alert')
    await alarm.waitFor()
    const alarmFarbe = rgbAus(await alarm.evaluate((el) => getComputedStyle(el).color))
    assert.equal(aehnlich(alarmFarbe, '#C12D32', 8), true, JSON.stringify(alarmFarbe))
    assert.equal(fehler.length, 0, fehler.join('\n'))
    assert.deepEqual(fremd, [])
    await bild(page, 'after-workspace-note-390')
    await schliessen(context)
  })

  test('enlarged root text does not add horizontal overflow beyond the unscoped page', async () => {
    for (const breite of [320, 1440] as const) {
      const basis = await oeffnen({ schicht: 'basis', pfad: '/', breite, schrift: '32px' })
      await basis.page.waitForSelector('#start-titel')
      const mint = await oeffnen({ schicht: 'mint', pfad: '/', breite, schrift: '32px' })
      await mint.page.waitForSelector('#start-titel')
      const messen = (page: Page) => page.evaluate(() => ({
        schrift: getComputedStyle(document.documentElement).fontSize,
        ueberlauf: document.documentElement.scrollWidth - document.documentElement.clientWidth,
      }))
      const vorher = await messen(basis.page)
      const nachher = await messen(mint.page)
      assert.equal(basis.fehler.length, 0, basis.fehler.join('\n'))
      assert.equal(mint.fehler.length, 0, mint.fehler.join('\n'))
      assert.equal(nachher.schrift, '32px')
      assert.ok(nachher.ueberlauf <= vorher.ueberlauf + 1, JSON.stringify({ breite, vorher, nachher }))
      await schliessen(basis.context)
      await schliessen(mint.context)
    }
    protokoll.vergroesserteSchrift = '32px root font, compared with the unscoped homepage'
  })

  test('admin dark mode and a provider frame are not recolored', async () => {
    const { context, page, fehler, fremd } = await oeffnen({ schicht: 'mint', pfad: '/', breite: 1440 })
    await page.waitForSelector('[data-negative="admin"]')
    const admin = rgbAus(await page.locator('[data-negative="admin"] .bg-background').evaluate((el) => getComputedStyle(el).backgroundColor))
    const rahmen = rgbAus(await page.frameLocator('[data-negative="provider"]').locator('body').evaluate((el) => getComputedStyle(el).backgroundColor))
    assert.equal(aehnlich(admin, '#0A1412', 2), true, JSON.stringify(admin))
    assert.equal(aehnlich(rahmen, '#123456', 2), true, JSON.stringify(rahmen))
    assert.equal(fehler.length, 0, fehler.join('\n'))
    assert.deepEqual(fremd, [])
    await schliessen(context)
    protokoll.negative = { admin, rahmen }
  })
})
