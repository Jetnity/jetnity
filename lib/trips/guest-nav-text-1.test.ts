import assert from 'node:assert/strict'
import { createRequire } from 'node:module'
import { createServer, type Server } from 'node:http'
import { mkdtempSync, readFileSync } from 'node:fs'
import { tmpdir } from 'node:os'
import { join } from 'node:path'
import { after, before, describe, test } from 'node:test'
import type { AddressInfo } from 'node:net'

import * as esbuild from 'esbuild'
import { chromium, type Browser, type BrowserContext, type Page } from 'playwright'

import { GASTSPEICHER_AKTUALISIERT, SCHLUESSEL } from '@/lib/trips/gastspeicher'
import { mountGastNavTextHarness } from '@/lib/trips/guest-nav-text-1/harness'
import Link from '@/lib/trips/guest-nav-text-1/link'
import { createBrowserClient, installGastNavSitzungStub } from '@/lib/trips/guest-nav-text-1/supabase-stub'

test('the guest-nav harness stays on the test import path', () => {
  assert.equal(typeof mountGastNavTextHarness, 'function')
  assert.equal(typeof Link, 'function')
  assert.equal(typeof createBrowserClient, 'function')
  assert.equal(typeof installGastNavSitzungStub, 'function')
  assert.equal(GASTSPEICHER_AKTUALISIERT.includes('trip-'), false)
})

const BREITEN = [320, 390, 768, 1440] as const
const SCHRIFT = ['16px', '32px'] as const

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
  return ergebnis.css.replaceAll('</style', '<\\/style')
}

async function bundeln(): Promise<string> {
  const stub = join(process.cwd(), 'lib/trips/guest-nav-text-1/supabase-stub.ts')
  const link = join(process.cwd(), 'lib/trips/guest-nav-text-1/link.tsx')
  const gebaut = await esbuild.build({
    absWorkingDir: process.cwd(),
    entryPoints: ['lib/trips/guest-nav-text-1/harness.tsx'],
    bundle: true,
    write: false,
    format: 'iife',
    platform: 'browser',
    jsx: 'automatic',
    outfile: join(mkdtempSync(join(tmpdir(), 'guest-nav-text-1-')), 'harness.js'),
    define: { 'process.env.NODE_ENV': '"production"' },
    banner: { js: 'var __name=(target)=>target;globalThis.process=globalThis.process||{env:{NODE_ENV:"production"}};globalThis.global=globalThis;' },
    plugins: [
      {
        name: 'guest-nav-shims',
        setup(build) {
          build.onResolve({ filter: /^next\/link$/ }, () => ({ path: link }))
          build.onResolve({ filter: /^@\// }, (args) => {
            if (args.path === '@/lib/supabase/client') return { path: stub }
            return build.resolve(join(process.cwd(), args.path.slice(2)), { resolveDir: process.cwd(), kind: args.kind })
          })
        },
      },
    ],
  })
  const js = gebaut.outputFiles[0]?.text
  if (!js) throw new Error('harness bundle was empty')
  return js
}

function html(css: string, js: string) {
  return `<!doctype html><html><head><meta charset="utf-8" /><style>${css}</style></head><body><div id="root"></div><script>${js}</script></body></html>`
}

async function cta(page: Page) {
  return page.evaluate(() => {
    return [...document.querySelectorAll<HTMLAnchorElement>('[data-cta] a')].map((link) => ({
      ort: link.closest('[data-cta]')?.getAttribute('data-cta'),
      href: link.getAttribute('href'),
      text: link.textContent?.trim() ?? '',
    }))
  })
}

async function wartenAuf(page: Page, hrefTeil: string, text: string) {
  await page.waitForFunction(
    ({ hrefTeil, text }) => {
      const links = [...document.querySelectorAll<HTMLAnchorElement>('[data-cta] a')]
      return links.length === 2 && links.every((link) => (link.getAttribute('href') ?? '').includes(hrefTeil) && (link.textContent ?? '').includes(text))
    },
    { hrefTeil, text },
    { timeout: 5000 },
  )
}

const BROWSER_ARGS = ['--no-sandbox', '--disable-dev-shm-usage']

function playwrightChromiumFehlt(fehler: unknown) {
  const meldung = fehler instanceof Error ? fehler.message : String(fehler)
  return meldung.includes("Executable doesn't exist")
}

/**
 * GitHub-hosted `ubuntu-latest` does not download Playwright's
 * `chromium_headless_shell`. The 24.04 and 26.04 runner images both install
 * Google Chrome. Use that system browser only when the managed binary is
 * absent. A missing system browser still fails this hook.
 */
async function gastNavBrowser() {
  try {
    const gestartet = await chromium.launch({ headless: true, args: BROWSER_ARGS })
    return { browser: gestartet, kanal: 'playwright-chromium' as const }
  } catch (fehler) {
    if (!playwrightChromiumFehlt(fehler)) throw fehler
    const gestartet = await chromium.launch({ headless: true, channel: 'chrome', args: BROWSER_ARGS })
    return { browser: gestartet, kanal: 'chrome' as const }
  }
}

describe('mounted guest resume links and large-text tabs', () => {
  let browser: Browser
  let server: Server
  let origin: string
  let browserKanal = ''
  let browserVersion = ''
  const seite = html

  before(async () => {
    const css = await projektCss()
    const js = await bundeln()
    const dokument = seite(css, js)
    server = createServer((req, res) => {
      const url = new URL(req.url ?? '/', 'http://127.0.0.1')
      if (url.pathname !== '/') {
        res.writeHead(404)
        res.end()
        return
      }
      res.writeHead(200, { 'content-type': 'text/html; charset=utf-8', 'cache-control': 'no-store' })
      res.end(dokument)
    })
    await new Promise<void>((resolve) => server.listen(0, '127.0.0.1', resolve))
    const adresse = server.address() as AddressInfo
    origin = `http://127.0.0.1:${adresse.port}`
    const gestartet = await gastNavBrowser()
    browser = gestartet.browser
    browserKanal = gestartet.kanal
    browserVersion = gestartet.browser.version()
    if (!/^\d+\.\d+/.test(browserVersion)) {
      throw new Error(`guest-nav browser ${browserKanal} returned no version`)
    }
    console.log(`guest-nav-browser kanal=${browserKanal} version=${browserVersion}`)
  })

  after(async () => {
    await browser?.close()
    await new Promise<void>((resolve, reject) => server.close((fehler) => (fehler ? reject(fehler) : resolve())))
  })

  async function kontext(): Promise<BrowserContext> {
    const context = await browser.newContext()
    await context.addInitScript(`(() => {
      const ereignis = ${JSON.stringify(GASTSPEICHER_AKTUALISIERT)};
      const post = [];
      const original = window.postMessage.bind(window);
      window.postMessage = (message, targetOrigin, transfer) => {
        post.push(typeof message === 'string' ? message : JSON.stringify(message));
        return original(message, targetOrigin, transfer);
      };
      const meldungen = [];
      window.addEventListener(ereignis, (event) => {
        const detail = event instanceof CustomEvent ? (event.detail ?? null) : 'nicht-custom';
        meldungen.push({ type: event.type, detail });
      });
      let schreibzugriffe = 0;
      const setItem = Storage.prototype.setItem;
      const removeItem = Storage.prototype.removeItem;
      Storage.prototype.setItem = function (key, value) {
        schreibzugriffe += 1;
        return setItem.call(this, key, value);
      };
      Storage.prototype.removeItem = function (key) {
        schreibzugriffe += 1;
        return removeItem.call(this, key);
      };
      window.__post = post;
      window.__meldungen = meldungen;
      window.__schreibzugriffe = () => schreibzugriffe;
    })();`)
    return context
  }

  async function oeffnen(context: BrowserContext, sitzung: 'gast' | 'konto' | 'halten') {
    const page = await context.newPage()
    const fehler: string[] = []
    page.on('pageerror', (error) => fehler.push(error.message))
    await page.goto(`${origin}/?sitzung=${sitzung}`, { waitUntil: 'networkidle' })
    return { page, fehler }
  }

  test('guest A discard then B updates header and footer without reload or a leaked id', async () => {
    const context = await kontext()
    try {
      const erste = await oeffnen(context, 'gast')
      const zweite = await oeffnen(context, 'gast')
      await wartenAuf(erste.page, '/planen', 'Reise planen')
      await wartenAuf(zweite.page, '/planen', 'Reise planen')
      const navigationen = await erste.page.evaluate(() => performance.getEntriesByType('navigation').length)
      assert.match(browserVersion, /^\d+\.\d+/)
      assert.equal(browserKanal === 'playwright-chromium' || browserKanal === 'chrome', true)

      await erste.page.locator('[data-aktion="anlegen-a"]').click()
      await wartenAuf(erste.page, 'trip-a-synthetic', 'Reise fortsetzen')
      await wartenAuf(zweite.page, 'trip-a-synthetic', 'Reise fortsetzen')

      const injiziert = await erste.page.evaluate((key) => {
        const vorher = localStorage.getItem(key)
        const schreibzugriffe = (window as Window & { __schreibzugriffe?: () => number }).__schreibzugriffe?.() ?? 0
        window.dispatchEvent(new StorageEvent('storage', { key, storageArea: localStorage, newValue: '{"id":"trip-injected"}' }))
        return {
          vorher,
          nachher: localStorage.getItem(key),
          schreibzugriffeNachher: (window as Window & { __schreibzugriffe?: () => number }).__schreibzugriffe?.() ?? 0,
          schreibzugriffe,
        }
      }, SCHLUESSEL.aktiv)
      assert.equal(injiziert.vorher, injiziert.nachher)
      assert.equal(injiziert.schreibzugriffeNachher, injiziert.schreibzugriffe)
      await wartenAuf(erste.page, 'trip-a-synthetic', 'Reise fortsetzen')

      await erste.page.locator('[data-aktion="verwerfen"]').click()
      await wartenAuf(erste.page, '/planen', 'Reise planen')
      await wartenAuf(zweite.page, '/planen', 'Reise planen')
      const nachVerwerfen = await cta(erste.page)
      assert.equal(nachVerwerfen.every((link) => !link.href?.includes('trip-a-synthetic')), true)

      await erste.page.locator('[data-aktion="anlegen-b"]').click()
      await wartenAuf(erste.page, 'trip-b-synthetic', 'Reise fortsetzen')
      await wartenAuf(zweite.page, 'trip-b-synthetic', 'Reise fortsetzen')
      for (const seite of [erste, zweite]) {
        const links = await cta(seite.page)
        assert.deepEqual(links.map((link) => link.ort), ['kopf', 'fuss'])
        assert.equal(links.every((link) => link.href?.includes('trip-b-synthetic') && !link.href.includes('trip-a-synthetic')), true)
      }

      const beweise = await erste.page.evaluate(() => {
        const fenster = window as Window & {
          __post?: string[]
          __meldungen?: Array<{ type: string; detail: unknown }>
        }
        return {
          navigationen: performance.getEntriesByType('navigation').length,
          post: fenster.__post ?? [],
          meldungen: fenster.__meldungen ?? [],
        }
      })
      assert.equal(beweise.navigationen, navigationen)
      assert.deepEqual(beweise.post, [])
      assert.equal(beweise.meldungen.length > 0, true)
      assert.equal(beweise.meldungen.every((eintrag) => eintrag.detail == null && !JSON.stringify(eintrag).includes('trip-')), true)
      assert.deepEqual(erste.fehler, [])
      assert.deepEqual(zweite.fehler, [])
    } finally {
      await context.close()
    }
  })

  test('malformed guest bytes fail closed in the other tab and stay on disk', async () => {
    const context = await kontext()
    try {
      const beobachter = await oeffnen(context, 'gast')
      const schreiber = await oeffnen(context, 'gast')
      await schreiber.page.locator('[data-aktion="anlegen-a"]').click()
      await wartenAuf(beobachter.page, 'trip-a-synthetic', 'Reise fortsetzen')
      const schreibzugriffe = await beobachter.page.evaluate(
        () => (window as Window & { __schreibzugriffe?: () => number }).__schreibzugriffe?.() ?? 0,
      )
      await schreiber.page.evaluate((key) => localStorage.setItem(key, '{'), SCHLUESSEL.aktiv)
      await wartenAuf(beobachter.page, '/planen', 'Reise planen')
      const stand = await beobachter.page.evaluate((key) => localStorage.getItem(key), SCHLUESSEL.aktiv)
      const schreibzugriffeNachher = await beobachter.page.evaluate(
        () => (window as Window & { __schreibzugriffe?: () => number }).__schreibzugriffe?.() ?? 0,
      )
      assert.equal(stand, '{')
      assert.equal(schreibzugriffeNachher, schreibzugriffe)
      const links = await cta(beobachter.page)
      assert.equal(links.every((link) => link.href === '/planen' && link.text === 'Reise planen'), true)
      assert.deepEqual(beobachter.fehler, [])
    } finally {
      await context.close()
    }
  })

  test('an account session and an unresolved session ignore guest storage', async () => {
    const gastKontext = await kontext()
    try {
      const gast = await oeffnen(gastKontext, 'gast')
      await gast.page.locator('[data-aktion="anlegen-a"]').click()
      await wartenAuf(gast.page, 'trip-a-synthetic', 'Reise fortsetzen')
      const bytes = await gast.page.evaluate((key) => localStorage.getItem(key), SCHLUESSEL.aktiv)
      assert.equal(typeof bytes, 'string')
      if (typeof bytes !== 'string') throw new Error('synthetic guest bytes missing')

      const kontoKontext = await browser.newContext()
      await kontoKontext.addInitScript(
        ({ key, roh }) => localStorage.setItem(key, roh),
        { key: SCHLUESSEL.aktiv, roh: bytes },
      )
      const konto = await kontoKontext.newPage()
      await konto.goto(`${origin}/?sitzung=konto`, { waitUntil: 'networkidle' })
      await wartenAuf(konto, '/planen', 'Reise planen')
      await konto.evaluate((key) => {
        window.dispatchEvent(new StorageEvent('storage', { key, storageArea: localStorage, newValue: localStorage.getItem(key) }))
      }, SCHLUESSEL.aktiv)
      await wartenAuf(konto, '/planen', 'Reise planen')
      const kontoLinks = await cta(konto)
      assert.equal(kontoLinks.every((link) => link.text === 'Reise planen' && link.href === '/planen'), true)

      const offenKontext = await browser.newContext()
      await offenKontext.addInitScript(
        ({ key, roh }) => localStorage.setItem(key, roh),
        { key: SCHLUESSEL.aktiv, roh: bytes },
      )
      const offen = await offenKontext.newPage()
      await offen.goto(`${origin}/?sitzung=halten`, { waitUntil: 'domcontentloaded' })
      await offen.waitForSelector('[data-hinweis="bereit"]')
      await offen.evaluate(() => new Promise((resolve) => requestAnimationFrame(() => requestAnimationFrame(resolve))))
      await wartenAuf(offen, '/planen', 'Reise planen')
      await offen.evaluate(() => (window as Window & { __sitzung?: { gast: () => void } }).__sitzung?.gast())
      await wartenAuf(offen, 'trip-a-synthetic', 'Reise fortsetzen')
      await kontoKontext.close()
      await offenKontext.close()
    } finally {
      await gastKontext.close()
    }
  })

  test('tab labels stay apart, readable and keyboard-reachable at 320/390/768/1440', async () => {
    const context = await kontext()
    try {
      const { page, fehler } = await oeffnen(context, 'gast')
      await page.getByRole('button', { name: 'Organisieren', exact: true }).waitFor()
      for (const breite of BREITEN) {
        for (const schrift of SCHRIFT) {
          await page.setViewportSize({ width: breite, height: 900 })
          await page.evaluate((px) => {
            document.documentElement.style.fontSize = px
          }, schrift)
          await page.evaluate(() => new Promise((resolve) => requestAnimationFrame(() => requestAnimationFrame(resolve))))
          const messung = await page.evaluate(() => {
            const knoepfe = [...document.querySelectorAll<HTMLButtonElement>('nav[aria-label="Reiseansicht"] button')]
            const kaesten = knoepfe.map((knopf) => {
              const kasten = knopf.getBoundingClientRect()
              const bereich = document.createRange()
              bereich.selectNodeContents(knopf)
              const text = bereich.getBoundingClientRect()
              const stil = getComputedStyle(knopf)
              return {
                name: knopf.textContent?.trim() ?? '',
                left: kasten.left,
                right: kasten.right,
                top: kasten.top,
                bottom: kasten.bottom,
                textLeft: text.left,
                textRight: text.right,
                textTop: text.top,
                textBottom: text.bottom,
                fontSize: stil.fontSize,
                visibility: stil.visibility,
                display: stil.display,
              }
            })
            return {
              kaesten,
              overflow: document.documentElement.scrollWidth - document.documentElement.clientWidth,
            }
          })
          assert.deepEqual(
            messung.kaesten.map((kasten) => kasten.name),
            ['Übersicht', 'Reiseplan', 'Organisieren', 'Vorbereitung'],
            `${breite}/${schrift}`,
          )
          const erwartet = schrift === '32px' ? '28px' : '14px'
          for (const kasten of messung.kaesten) {
            assert.equal(kasten.fontSize, erwartet, `${kasten.name} ${breite}/${schrift}`)
            assert.equal(kasten.visibility, 'visible')
            assert.notEqual(kasten.display, 'none')
            assert.equal(kasten.textLeft >= kasten.left - 1, true, `${kasten.name} text left`)
            assert.equal(kasten.textRight <= kasten.right + 1, true, `${kasten.name} text right`)
            assert.equal(kasten.textTop >= kasten.top - 1, true, `${kasten.name} text top`)
            assert.equal(kasten.textBottom <= kasten.bottom + 1, true, `${kasten.name} text bottom`)
          }
          for (let i = 0; i < messung.kaesten.length; i += 1) {
            for (let j = i + 1; j < messung.kaesten.length; j += 1) {
              const a = messung.kaesten[i]!
              const b = messung.kaesten[j]!
              const getrennt = a.right <= b.left + 1 || b.right <= a.left + 1 || a.bottom <= b.top + 1 || b.bottom <= a.top + 1
              assert.equal(getrennt, true, `${a.name} overlaps ${b.name} at ${breite}/${schrift}`)
            }
          }
          assert.equal(messung.overflow <= 1, true, `document overflow ${breite}/${schrift} ${messung.overflow}`)
        }
      }

      await page.setViewportSize({ width: 390, height: 900 })
      await page.evaluate(() => {
        document.documentElement.style.fontSize = '32px'
        window.scrollTo(0, 400)
      })
      const hindernis = await page.evaluate(() => {
        const kopf = document.querySelector('[data-harness-header]')!.getBoundingClientRect()
        const knoepfe = [...document.querySelectorAll<HTMLButtonElement>('nav[aria-label="Reiseansicht"] button')]
        return knoepfe.map((knopf) => {
          const kasten = knopf.getBoundingClientRect()
          const verdeckt = kasten.top < kopf.bottom - 1 && kasten.bottom > kopf.top + 1
          return { name: knopf.textContent?.trim(), top: kasten.top, kopf: kopf.bottom, verdeckt }
        })
      })
      assert.equal(hindernis.every((eintrag) => eintrag.verdeckt === false && eintrag.top >= eintrag.kopf - 1), true)

      const organisieren = page.getByRole('button', { name: 'Organisieren', exact: true })
      await organisieren.focus()
      await page.keyboard.press('Enter')
      const tastatur = await page.evaluate(() => (window as Window & { __gastNavWechsel?: { ansicht: string; tastatur: boolean } }).__gastNavWechsel)
      assert.deepEqual(tastatur, { ansicht: 'organisieren', tastatur: true })
      const ring = await organisieren.evaluate((element) => getComputedStyle(element).boxShadow)
      assert.equal(ring === 'none', false)

      await page.getByRole('button', { name: 'Vorbereitung', exact: true }).click()
      const zeiger = await page.evaluate(() => (window as Window & { __gastNavWechsel?: { ansicht: string; tastatur: boolean } }).__gastNavWechsel)
      assert.deepEqual(zeiger, { ansicht: 'vorbereitung', tastatur: false })
      assert.deepEqual(fehler, [])
    } finally {
      await context.close()
    }
  })
})
