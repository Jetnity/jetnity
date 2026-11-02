import assert from 'node:assert/strict'
import { createRequire } from 'node:module'
import { createServer, type Server } from 'node:http'
import { mkdirSync, mkdtempSync, readFileSync, writeFileSync } from 'node:fs'
import { tmpdir } from 'node:os'
import { join } from 'node:path'
import { after, before, describe, test } from 'node:test'
import type { AddressInfo } from 'node:net'

import * as esbuild from 'esbuild'
import { chromium, type Browser, type BrowserContext, type Page } from 'playwright'

import dynamicStub from '@/lib/ui/white-mint-home-workspace-1/dynamic-stub'
import { aenderungErzeugen, ortBestaetigen } from '@/lib/ui/white-mint-home-workspace-1/server-action-stub'
import { createBrowserClient } from '@/lib/ui/white-mint-home-workspace-1/supabase-stub'
import { signOutAction } from '@/lib/ui/white-mint-home-workspace-1/sign-out-stub'
import { usePathname } from '@/lib/ui/white-mint-home-workspace-1/navigation'
import Image from '@/lib/ui/white-mint-home-workspace-1/image'
import Link from '@/lib/ui/white-mint-home-workspace-1/link'
import { paarePruefen, type Paar } from '@/lib/ui/white-mint-home-workspace-1/kontrast-audit'

declare global {
  interface Window {
    __whiteMintPaareSammeln?: (selector: string) => Paar[]
  }
}
import { WHITE_MINT, aehnlich, type Rgb } from '@/lib/ui/white-mint-home-workspace-1/palette'

async function harnessModul() {
  return import('@/lib/ui/white-mint-home-workspace-1/harness')
}

test('local shims stay on the fixture import path', () => {
  assert.equal(typeof createBrowserClient, 'function')
  assert.equal(typeof signOutAction, 'function')
  assert.equal(typeof dynamicStub, 'function')
  assert.equal(typeof aenderungErzeugen, 'function')
  assert.equal(typeof ortBestaetigen, 'function')
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
const THEME_KEY = 'jetnity:workspace-theme:v1'
const START_H1 = 'Deine ganze Reise. Intelligent an einem Ort.'
const ANLEGEN = [
  'Neuer Punkt',
  'Ort oder Aktivität',
  'Notiz, optional',
  'Anfangsdatum, optional',
  'Anfangszeit, optional',
  'Enddatum, optional',
  'Endzeit, optional',
  'Speichern',
  'Abbrechen',
] as const
const BEARBEITEN = [
  'Punkt bearbeiten',
  'Notiz, optional',
  'Zuordnung im Tagesplan',
  'Anfangsdatum, optional',
  'Speichern',
] as const

function evidenceVerzeichnis() {
  const gesetzt = process.env.WHITE_MINT_EVIDENCE_DIR?.trim()
  const ziel = gesetzt || mkdtempSync(join(tmpdir(), 'white-mint-'))
  mkdirSync(ziel, { recursive: true })
  return ziel
}
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
          build.onResolve({ filter: /^@\/lib\/reiseaenderung\/aktionen$/ }, () => ({ path: datei('server-action-stub.ts') }))
          build.onResolve({ filter: /^@\/lib\/places\/aktionen$/ }, () => ({ path: datei('server-action-stub.ts') }))
          build.onResolve({ filter: /^next\/dynamic$/ }, () => ({ path: datei('dynamic-stub.tsx') }))
          build.onResolve({ filter: /\.css$/ }, (args) => ({ path: args.path, namespace: 'css-leer' }))
          build.onLoad({ filter: /.*/, namespace: 'css-leer' }, () => ({ contents: '', loader: 'js' }))
          build.onResolve({ filter: /^@\// }, (args) => {
            if (args.path === '@/app/auth/sign-out') return { path: datei('sign-out-stub.ts') }
            if (args.path === '@/lib/supabase/client') return { path: datei('supabase-stub.ts') }
            if (args.path === '@/lib/reiseaenderung/aktionen' || args.path === '@/lib/places/aktionen') {
              return { path: datei('server-action-stub.ts') }
            }
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
let ausgabe = ''
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
  touch?: boolean
}) {
  const context = await browser.newContext({
    viewport: { width: optionen.breite, height: optionen.hoehe ?? 900 },
    deviceScaleFactor: 1,
    hasTouch: optionen.touch,
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
    try { localStorage.setItem(${JSON.stringify(THEME_KEY)}, ${JSON.stringify(optionen.thema ?? 'light')}); } catch (e) {}
    ${optionen.schrift ? `(() => { const setzen = () => { if (document.documentElement) document.documentElement.style.fontSize = ${JSON.stringify(optionen.schrift)}; }; setzen(); document.addEventListener('DOMContentLoaded', setzen); })();` : ''}
  })();`)
  const page = await context.newPage()
  const fehler: string[] = []
  page.on('pageerror', (error) => fehler.push(error.message))
  const trenn = optionen.pfad.includes('?') ? '&' : '?'
  await page.goto(`${origin}${optionen.pfad}${trenn}schicht=${optionen.schicht}`, { waitUntil: 'networkidle' })
  return { context, page, fehler, fremd }
}

async function schliessen(context: BrowserContext) {
  await context.close()
}

async function bild(page: Page, name: string) {
  if (!process.env.WHITE_MINT_EVIDENCE_DIR?.trim()) return
  mkdirSync(ausgabe, { recursive: true })
  await page.screenshot({ path: join(ausgabe, `${name}.png`), fullPage: name.includes('full') })
}

async function audit(page: Page, selector: string, erforderlich: readonly string[]) {
  const paare = await page.evaluate((sel) => {
    const sammeln = window.__whiteMintPaareSammeln
    return sammeln ? sammeln(sel) : []
  }, selector)
  return { paare, urteil: paarePruefen(paare, erforderlich) }
}

async function ansicht(page: Page) {
  await page.waitForFunction(() => document.querySelector('[data-workspace-ansicht]'))
  return page.locator('[data-workspace-ansicht]').getAttribute('data-workspace-ansicht')
}

async function planOeffnen(page: Page) {
  if ((await ansicht(page)) === 'plan') return
  await page.getByRole('button', { name: 'Reiseplan', exact: true }).click()
  await page.waitForFunction(() => document.querySelector('[data-workspace-ansicht]')?.getAttribute('data-workspace-ansicht') === 'plan')
}

describe('rendered white/mint homepage and light workspace', () => {
  before(async () => {
    ausgabe = evidenceVerzeichnis()
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
        const relativ = decodeURIComponent(url.pathname).replace(/^\/+/, '')
        const oeffentlich = join(process.cwd(), 'public')
        const datei = join(oeffentlich, relativ)
        if (!datei.startsWith(`${oeffentlich}/`)) {
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
    if (!ausgabe) ausgabe = evidenceVerzeichnis()
    mkdirSync(ausgabe, { recursive: true })
    writeFileSync(join(ausgabe, 'computed-colors.json'), JSON.stringify(protokoll, null, 2))
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
      if (breite === 390 || breite === 1440) {
        const ergebnis = await audit(page, '[data-white-mint="home"]', [
          START_H1,
          'Reise planen',
          'info@jetnity.ch',
          'Alles für deine Reise. Ein gemeinsamer Plan.',
        ])
        assert.equal(ergebnis.urteil.ok, true, ergebnis.urteil.fehler.slice(0, 15).join('\n'))
        protokoll[`homepagePaare${breite}`] = {
          paare: ergebnis.urteil.paare,
          unsupported: ergebnis.urteil.unsupported,
        }
        await bild(page, `after-homepage-${breite}`)
      }
      if (breite === 1440) await bild(page, 'after-homepage-1440-full')
      messungen.push({ breite, werte })
      await schliessen(context)
    }
    protokoll.homepage = messungen
  })

  test('final homepage keeps its planning entry and FAQ usable across sizes', async () => {
    const laeufe = []
    for (const breite of [320, 360, 390, 768, 1024, 1440]) {
      const { context, page, fehler, fremd } = await oeffnen({ schicht: 'mint', pfad: '/', breite })
      await page.waitForSelector('#start-titel')
      const input = page.locator('#travel-idea')
      const cta = page.locator('main form button[type="submit"]').first()
      const bounds = await cta.boundingBox()
      assert.ok(bounds && bounds.height >= 44 && bounds.y + bounds.height < 900, `first-screen CTA at ${breite}`)
      assert.equal(await page.locator('main h1').count(), 1)
      assert.equal(await page.locator('main details').count(), 6)
      const overflow = await page.evaluate(() => document.documentElement.scrollWidth - document.documentElement.clientWidth)
      assert.ok(overflow <= 1, `${breite}: ${overflow}`)
      await input.focus()
      assert.equal(await input.evaluate((el) => document.activeElement === el), true)
      const fokus = await input.evaluate((el) => {
        const stil = getComputedStyle(el)
        return { breite: parseFloat(stil.outlineWidth), art: stil.outlineStyle, farbe: stil.outlineColor }
      })
      assert.ok(fokus.breite >= 2 && fokus.art === 'solid', `visible input focus at ${breite}: ${JSON.stringify(fokus)}`)
      await bild(page, `final-homepage-${breite}`)
      await bild(page, `final-homepage-${breite}-full`)
      const faq = page.locator('summary').filter({ hasText: 'Wie buche ich Flüge, Unterkünfte oder Aktivitäten?' })
      await faq.focus()
      await page.keyboard.press('Enter')
      assert.equal(await faq.evaluate((el) => el.closest('details')?.open), true)
      assert.equal(await page.getByText(/Ein Eintrag in deinem Reiseplan ist noch keine Buchung/).isVisible(), true)
      await page.keyboard.press('Enter')
      assert.equal(await faq.evaluate((el) => el.closest('details')?.open), false)
      if (breite === 320 || breite === 390) {
        await page.getByRole('button', { name: 'Menü öffnen', exact: true }).click()
        assert.equal(await page.locator('#oeffentliche-mobile-navigation').getByRole('link', { name: 'So funktioniert’s' }).isVisible(), true)
        await page.keyboard.press('Escape')
        assert.equal(await page.getByRole('button', { name: 'Menü öffnen', exact: true }).evaluate((el) => document.activeElement === el), true)
      }
      if (breite === 320 || breite === 1440) {
        await page.addStyleTag({ content: 'html { font-size: 32px !important }' })
        for (const [schrift, familie] of [['system', ''], ['sans', 'Arial, sans-serif'], ['wide', 'monospace']]) {
          await page.evaluate((font) => { document.body.style.fontFamily = font }, familie!)
          const gross = await page.evaluate(() => document.documentElement.scrollWidth - document.documentElement.clientWidth)
          await bild(page, `final-homepage-${breite}-200-${schrift}-full`)
          const ausreisser = await page.evaluate(() => [...document.querySelectorAll('body *')].filter((el) => el.getBoundingClientRect().right > innerWidth + 1).slice(0, 12).map((el) => ({ tag: el.tagName, klasse: el.getAttribute('class'), text: el.textContent?.slice(0, 80), elternText: el.parentElement?.textContent?.slice(0, 80), recht: el.getBoundingClientRect().right })))
          assert.ok(gross <= 1, `200% ${schrift} at ${breite}: ${gross}; ${JSON.stringify(ausreisser)}`)
          const abgeschnitten = await page.evaluate(() => [...document.querySelectorAll('main a, main button, main summary')].flatMap((el) => {
            const box = el.getBoundingClientRect()
            if (!box.width || !box.height) return []
            const inhalt = [...el.querySelectorAll('svg')].map((svg) => svg.getBoundingClientRect())
            const walker = document.createTreeWalker(el, NodeFilter.SHOW_TEXT)
            let text = walker.nextNode()
            while (text) {
              if (text.textContent?.trim()) {
                const range = document.createRange()
                range.selectNodeContents(text)
                inhalt.push(...range.getClientRects())
              }
              text = walker.nextNode()
            }
            return inhalt.some((rect) => rect.left < box.left - 1 || rect.right > box.right + 1)
              ? [el.textContent?.trim()] : []
          }))
          assert.deepEqual(abgeschnitten, [], `200% ${schrift} at ${breite}: link/FAQ contents must fit their control`)
          protokoll[`homepage200-${breite}-${schrift}`] = { overflow: gross, clippedControls: abgeschnitten }
        }
      }
      assert.deepEqual(fehler, [])
      assert.deepEqual(fremd, [])
      laeufe.push({ breite, overflow, cta: bounds, faqKeyboard: true })
      await schliessen(context)
    }
    protokoll.homepageFinal1 = laeufe
  })

  test('the active guest continuation CTA remains bounded at 200% with a wide fallback font', async () => {
    for (const breite of [320, 1440]) {
      const { context, page, fehler, fremd } = await oeffnen({ schicht: 'mint', pfad: '/reisen/trip-white-mint?fixture-session=guest', breite })
      await page.waitForSelector('[data-synthetic-guest]')
      await page.goto(`${origin}/?fixture-session=guest&schicht=mint`, { waitUntil: 'networkidle' })
      const cta = page.locator('section[aria-labelledby="abschluss-titel"]').getByRole('link', { name: 'Reise fortsetzen', exact: true })
      await cta.waitFor()
      assert.equal(await cta.getAttribute('href'), '/reisen/trip-white-mint')
      await page.addStyleTag({ content: 'html { font-size: 32px !important } body { font-family: monospace !important }' })
      const werte = await cta.evaluate((el) => {
        const box = el.getBoundingClientRect()
        const range = document.createRange()
        range.selectNodeContents(el)
        return {
          overflow: document.documentElement.scrollWidth - document.documentElement.clientWidth,
          textFits: [...range.getClientRects()].every((rect) => rect.left >= box.left - 1 && rect.right <= box.right + 1),
          height: box.height,
        }
      })
      assert.ok(werte.overflow <= 1, `returning guest overflow at ${breite}: ${werte.overflow}`)
      assert.equal(werte.textFits, true, `returning guest label fits at ${breite}`)
      assert.ok(werte.height >= 44)
      await cta.screenshot({ path: join(ausgabe, `homepage-guest-cta-${breite}-200-wide.png`) })
      assert.deepEqual(fehler, [])
      assert.deepEqual(fremd, [])
      protokoll[`homepageGuest200-${breite}`] = werte
      await schliessen(context)
    }
  })

  test('light workspace uses white chrome and mint surfaces while green content stays unchanged', async () => {
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
      assert.equal(aehnlich(rgbAus(werte.nav?.hintergrund), WHITE_MINT.card), true, JSON.stringify(werte.nav))
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
    const platzhalter = konto.page.locator('[data-white-mint-probe="account-placeholder"]')
    assert.equal(await platzhalter.innerText(), 'Kontoeintrag, keine Einstellungsseite')
    const kontoAudit = await audit(konto.page, '.workspace-shell', ['Einstellungen', 'Meine Reisen', 'Kontakt'])
    assert.equal(kontoAudit.urteil.ok, true, kontoAudit.urteil.fehler.slice(0, 15).join('\n'))
    protokoll.kontoPaare = { paare: kontoAudit.urteil.paare, unsupported: kontoAudit.urteil.unsupported }
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

    const basisGruen = await oeffnen({ schicht: 'basis', pfad: '/reisen/trip-white-mint', breite: 1440, thema: 'green' })
    await basisGruen.page.waitForFunction(() => document.querySelector('[data-workspace-theme="green"] [data-workspace-ansicht]'))
    const mintGruen = await oeffnen({ schicht: 'mint', pfad: '/reisen/trip-white-mint', breite: 1440, thema: 'green' })
    await mintGruen.page.waitForFunction(() => document.querySelector('[data-workspace-theme="green"] [data-workspace-ansicht]'))
    const signatur = async (page: Page) => page.evaluate(() => window.__whiteMintPaareSammeln?.('.workspace-content') ?? [])
    const vorherPaare = (await signatur(basisGruen.page)).filter((paar) => paar.background && !paar.unsupported)
    const nachherPaare = (await signatur(mintGruen.page)).filter((paar) => paar.background && !paar.unsupported)
    const vorherNachName = new Map(vorherPaare.map((paar) => [paar.name, paar.color]))
    const gemeinsam = nachherPaare.filter((paar) => vorherNachName.has(paar.name))
    assert.ok(gemeinsam.length >= 8, `green pair overlap ${gemeinsam.length}`)
    const verschoben = gemeinsam.filter((paar) => !aehnlich(paar.color, `#${vorherNachName.get(paar.name)!.map((kanal) => kanal.toString(16).padStart(2, '0')).join('')}`, 2))
    assert.deepEqual(verschoben.map((paar) => paar.name), [])
    protokoll.gruenUnveraendert = { gemeinsam: gemeinsam.length, basis: vorherPaare.length, mint: nachherPaare.length }
    await schliessen(basisGruen.context)
    await schliessen(mintGruen.context)
    protokoll.workspace = messungen
  })

  test('desktop navigation opens on hover without moving content, closes after mouse clicks and supports keyboard focus', async () => {
    for (const breite of [1024, 1440]) {
      const { context, page, fehler, fremd } = await oeffnen({ schicht: 'mint', pfad: '/reisen/trip-white-mint', breite })
      const sidebar = page.locator('.workspace-sidebar')
      const shell = page.locator('.workspace-shell')
      await page.waitForSelector('[data-workspace-mode-nav="sidebar"]')
      const geschlossen = await sidebar.boundingBox()
      const inhalt = await page.locator('.workspace-page').boundingBox()
      assert.equal(geschlossen?.width, 72)
      const header = await page.locator('.workspace-header').boundingBox()
      assert.equal(header?.x, 0)
      assert.equal(header?.width, breite)
      assert.equal(geschlossen?.y, header!.y + header!.height)
      await page.mouse.move(35, geschlossen!.y + 45)
      await page.waitForFunction(() => document.querySelector('.workspace-sidebar')?.getBoundingClientRect().width === 224)
      const offen = await sidebar.boundingBox()
      assert.equal(offen?.width, 224)
      assert.equal((await page.locator('.workspace-page').boundingBox())?.x, inhalt?.x)
      await page.mouse.move(210, offen!.y + 80)
      assert.equal(await shell.getAttribute('data-collapsed'), 'false')
      await sidebar.getByRole('button', { name: 'Reiseplan', exact: true }).click()
      await page.waitForFunction(() => document.querySelector('[data-workspace-ansicht]')?.getAttribute('data-workspace-ansicht') === 'plan')
      await page.mouse.move(350, 300)
      await page.waitForFunction(() => document.querySelector('.workspace-sidebar')?.getBoundingClientRect().width === 72)
      assert.equal(await page.locator('[role="tooltip"], .workspace-tooltip').count(), 0)
      await bild(page, `navigation-collapsed-${breite}`)

      // Reach the rail through the real tab order, after the header controls.
      await page.locator('summary[aria-label="Kontomenü"]').focus()
      await page.keyboard.press('Tab')
      await page.waitForFunction(() => document.querySelector('.workspace-sidebar')?.getBoundingClientRect().width === 224)
      assert.equal(await sidebar.evaluate((el) => el.contains(document.activeElement)), true)
      await page.keyboard.press('Escape')
      await page.waitForFunction(() => document.querySelector('.workspace-sidebar')?.getBoundingClientRect().width === 72)
      await page.keyboard.press('Tab')
      await page.waitForFunction(() => document.querySelector('.workspace-sidebar')?.getBoundingClientRect().width === 224)
      await bild(page, `navigation-keyboard-${breite}`)
      await page.locator('.workspace-theme-toggle').focus()
      await page.waitForFunction(() => document.querySelector('.workspace-sidebar')?.getBoundingClientRect().width === 72)
      assert.deepEqual(fehler, [])
      assert.deepEqual(fremd, [])
      await schliessen(context)
    }
  })

  test('white header and icon controls work in both themes and expose the complete attribution', async () => {
    const { context, page } = await oeffnen({ schicht: 'mint', pfad: '/reisen/trip-white-mint', breite: 1440 })
    for (const thema of ['light', 'green'] as const) {
      if (thema === 'green') await page.getByRole('button', { name: 'Grünes Design aktivieren' }).click()
      await page.waitForSelector(`[data-workspace-theme="${thema}"]`)
      for (const selector of ['.workspace-header', '.workspace-sidebar']) {
        assert.equal(await page.locator(selector).evaluate((el) => getComputedStyle(el).backgroundColor), 'rgb(255, 255, 255)')
      }
      for (const selector of ['.workspace-theme-toggle', 'summary[aria-label="Kontomenü"]']) {
        const control = page.locator(selector)
        assert.equal(await control.innerText(), '')
        assert.equal(await control.locator('svg').isVisible(), true)
        const rect = await control.boundingBox()
        assert.ok(rect && rect.width >= 44 && rect.height >= 44)
      }
      await page.locator('.workspace-sidebar').hover()
      await page.waitForFunction(() => document.querySelector('.workspace-sidebar')?.getBoundingClientRect().width === 224)
      const kontrast = await audit(page, '.workspace-sidebar', ['Übersicht', 'Reiseplan', 'Organisieren', 'Einstellungen'])
      assert.equal(kontrast.urteil.ok, true, kontrast.urteil.fehler.join('\n'))
      await bild(page, `navigation-hover-${thema}`)
    }
    assert.equal(await page.locator('.workspace-credit').getByText(/GeoNames/).count(), 0)
    await page.locator('summary[aria-label="Kontomenü"]').click()
    await page.getByRole('link', { name: 'Datenquellen & Lizenzen' }).click()
    await page.getByRole('heading', { name: 'Datenquellen & Lizenzen' }).waitFor()
    assert.equal(await page.locator('main a[href="https://www.geonames.org/"]').isVisible(), true)
    assert.equal(await page.locator('main a[href="https://creativecommons.org/licenses/by/4.0/"]').isVisible(), true)
    assert.equal(await page.getByText(/vereinheitlicht Bezeichnungen/).isVisible(), true)
    await schliessen(context)
  })

  test('touch desktop has an explicit control and mobile drawer preserves focus and scroll lock', async () => {
    const desktop = await oeffnen({ schicht: 'mint', pfad: '/reisen/trip-white-mint', breite: 1440, touch: true })
    await desktop.page.getByRole('button', { name: 'Seitenleiste öffnen' }).tap()
    await desktop.page.waitForFunction(() => document.querySelector('.workspace-sidebar')?.getBoundingClientRect().width === 224)
    await desktop.page.locator('.workspace-context').tap()
    await desktop.page.waitForFunction(() => document.querySelector('.workspace-sidebar')?.getBoundingClientRect().width === 72)
    await schliessen(desktop.context)
    for (const breite of [320, 390, 768]) {
      const { context, page, fehler } = await oeffnen({ schicht: 'mint', pfad: '/reisen/trip-white-mint', breite, touch: true })
      await page.getByRole('button', { name: 'Navigation öffnen' }).tap()
      const dialog = page.getByRole('dialog', { name: 'Workspace-Navigation' })
      await dialog.waitFor()
      assert.equal(await page.evaluate(() => document.body.style.overflow), 'hidden')
      assert.equal(await page.locator('.workspace-header').evaluate((el) => el instanceof HTMLElement && el.inert), true)
      assert.equal(await dialog.getByRole('button', { name: 'Navigation schliessen' }).evaluate((el) => el === document.activeElement), true)
      await page.keyboard.press('Shift+Tab')
      assert.equal(await dialog.getByRole('link', { name: 'Jetnity Startseite' }).evaluate((el) => el === document.activeElement), true)
      await page.keyboard.press('Shift+Tab')
      assert.equal(await dialog.getByRole('link', { name: 'Entdecken' }).evaluate((el) => el === document.activeElement), true)
      await page.keyboard.press('Escape')
      await dialog.waitFor({ state: 'hidden' })
      assert.equal(await page.evaluate(() => document.body.style.overflow), '')
      assert.equal(await page.getByRole('button', { name: 'Navigation öffnen' }).evaluate((el) => el === document.activeElement), true)
      assert.equal(await page.locator('summary[aria-label="Kontomenü"] svg').isVisible(), true)
      assert.ok(await page.evaluate(() => document.documentElement.scrollWidth - document.documentElement.clientWidth <= 1))
      await bild(page, `navigation-mobile-${breite}`)
      assert.deepEqual(fehler, [])
      await schliessen(context)
    }
  })

  test('enlarged workspace text keeps the full header clear and motion preferences shorten the rail animation', async () => {
    for (const breite of [320, 1440]) {
      const { context, page } = await oeffnen({ schicht: 'mint', pfad: '/reisen/trip-white-mint', breite, schrift: '32px' })
      await page.waitForSelector('.workspace-header[data-flow="true"]')
      const header = await page.locator('.workspace-header').boundingBox()
      const logo = await page.locator('.workspace-header-brand').boundingBox()
      assert.ok(logo && header && logo.x >= 0 && logo.x + logo.width <= breite)
      if (breite === 1440) {
        const sidebar = await page.locator('.workspace-sidebar').boundingBox()
        assert.ok(sidebar && header && sidebar.y >= header.y + header.height, JSON.stringify({ sidebar, header }))
        await bild(page, 'navigation-enlarged-desktop')
        await page.evaluate(() => window.scrollTo(0, 600))
        await page.locator('.workspace-sidebar').hover()
        await page.waitForFunction(() => document.querySelector('.workspace-sidebar')?.getBoundingClientRect().width === 448)
        assert.ok((await page.locator('.workspace-sidebar').boundingBox())!.y >= 0)
      } else {
        await page.getByRole('button', { name: 'Navigation öffnen' }).click()
        await page.getByRole('dialog').getByRole('link', { name: 'Entdecken' }).scrollIntoViewIfNeeded()
        assert.equal(await page.getByRole('dialog').getByRole('link', { name: 'Entdecken' }).isVisible(), true)
        await page.keyboard.press('Escape')
      }
      assert.ok(await page.evaluate(() => document.documentElement.scrollWidth - document.documentElement.clientWidth <= 1))
      await page.emulateMedia({ reducedMotion: 'reduce' })
      const duration = await page.locator('.workspace-sidebar').evaluate((el) => getComputedStyle(el).transitionDuration)
      assert.ok(duration.split(',').every((part) => parseFloat(part) <= .001), duration)
      await schliessen(context)
    }
  })

  test('a synthetic guest note saves, reloads and keeps a visible focus and alert', async () => {
    const { context, page, fehler, fremd } = await oeffnen({
      schicht: 'mint',
      pfad: '/reisen/trip-white-mint',
      breite: 1440,
      hoehe: 900,
    })
    await page.waitForSelector('[data-white-mint-guest="echt"]')
    await planOeffnen(page)
    assert.match(page.url(), /ansicht=plan/)
    await page.getByRole('button', { name: 'Punkt hinzufügen' }).first().click()
    const anlegen = await audit(page, 'form[aria-label="Punkt hinzufügen"]', ANLEGEN)
    assert.equal(anlegen.urteil.ok, true, anlegen.urteil.fehler.slice(0, 15).join('\n'))
    protokoll.anlegenPaare = { paare: anlegen.urteil.paare, unsupported: anlegen.urteil.unsupported }
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
    const bearbeiten = await audit(page, 'form[aria-label="Punkt bearbeiten: Mint Markt"]', BEARBEITEN)
    assert.equal(bearbeiten.urteil.ok, true, bearbeiten.urteil.fehler.slice(0, 15).join('\n'))
    protokoll.bearbeitenPaare = { paare: bearbeiten.urteil.paare, unsupported: bearbeiten.urteil.unsupported }
    await page.getByLabel('Notiz, optional').fill('Nach dem Neuladen')
    await page.getByRole('button', { name: 'Speichern' }).click()
    await page.getByText('Nach dem Neuladen').waitFor()
    await page.reload({ waitUntil: 'networkidle' })
    await planOeffnen(page)
    await page.getByText('Nach dem Neuladen').waitFor()
    const tagZwei = page.getByRole('button', { name: /Tag 2/ }).first()
    await tagZwei.click()
    await page.waitForFunction(() => new URL(location.href).searchParams.has('tag'))
    await page.getByRole('button', { name: 'Grünes Design aktivieren' }).click()
    await page.waitForSelector('[data-workspace-theme="green"]')
    await page.getByRole('button', { name: 'Helle Darstellung aktivieren' }).click()
    await page.waitForSelector('[data-workspace-theme="light"]')
    assert.ok(new URL(page.url()).searchParams.has('tag'))
    const tagZweiFarbe = rgbAus(await page.getByRole('button', { name: /Tag 2/ }).first().evaluate((el) => getComputedStyle(el).backgroundColor))
    assert.equal(aehnlich(tagZweiFarbe, '#153A33', 8), true, JSON.stringify(tagZweiFarbe))
    await page.goBack()
    await page.getByText('Nach dem Neuladen').waitFor()
    await page.goBack()
    await page.waitForFunction(() => document.querySelector('[data-workspace-ansicht]')?.getAttribute('data-workspace-ansicht') === 'uebersicht')
    await page.goForward()
    await page.waitForFunction(() => document.querySelector('[data-workspace-ansicht]')?.getAttribute('data-workspace-ansicht') === 'plan')
    await page.getByText('Nach dem Neuladen').waitFor()
    await page.getByRole('button', { name: 'Punkt hinzufügen' }).first().click()
    const formular = page.getByRole('form', { name: 'Punkt hinzufügen' })
    await formular.locator('input').first().evaluate((el) => el.removeAttribute('required'))
    await formular.getByRole('button', { name: 'Speichern' }).click()
    const alarm = formular.getByRole('alert')
    await alarm.waitFor()
    const alarmFarbe = rgbAus(await alarm.evaluate((el) => getComputedStyle(el).color))
    assert.equal(aehnlich(alarmFarbe, '#C12D32', 8), true, JSON.stringify(alarmFarbe))
    await page.evaluate(() => {
      const host = document.querySelector('[data-synthetic-guest]')
      const label = document.createElement('label')
      label.textContent = 'Zweite Markierung'
      label.style.color = 'rgb(255, 255, 255)'
      label.style.backgroundColor = 'rgb(255, 255, 255)'
      label.style.display = 'block'
      label.style.padding = '8px'
      host?.appendChild(label)
    })
    const gegensatz = await audit(page, '[data-synthetic-guest]', ['Nach dem Neuladen', 'Zweite Markierung'])
    assert.equal(gegensatz.urteil.ok, false)
    const zeile = gegensatz.urteil.fehler.find((eintrag) => eintrag.includes('Zweite Markierung'))
    assert.ok(zeile)
    assert.match(zeile, /pair [1-9]/)
    assert.equal(gegensatz.urteil.fehler.some((eintrag) => eintrag.includes('missing required label: Nach dem Neuladen')), false)
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
