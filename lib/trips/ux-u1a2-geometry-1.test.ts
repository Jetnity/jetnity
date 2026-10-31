import assert from 'node:assert/strict'
import { createRequire } from 'node:module'
import { createServer, type Server } from 'node:http'
import { mkdirSync, mkdtempSync, readFileSync, writeFileSync } from 'node:fs'
import { tmpdir } from 'node:os'
import { dirname, join, resolve } from 'node:path'
import { after, before, describe, test } from 'node:test'
import type { AddressInfo } from 'node:net'

import * as esbuild from 'esbuild'
import { chromium, type Browser, type Page } from 'playwright'

import { mountUxU1a2Harness } from '@/lib/trips/ux-u1a2-geometry-1/harness'

const PROVIDER = /\/api\/(flights|hotels|activities|mobility|rental-cars|reisebegleiter)\b/
const BROWSER_ARGS = ['--no-sandbox', '--disable-dev-shm-usage']
const LABEL = ['Übersicht', 'Reiseplan', 'Organisieren', 'Vorbereitung']

type Knopf = {
  name: string
  left: number
  right: number
  top: number
  bottom: number
  width: number
  height: number
  textLeft: number
  textRight: number
  textTop: number
  textBottom: number
  fontSize: string
}

type Geometrie = {
  fehler?: string
  lage: string | null
  position: string
  navTop: number
  navBottom: number
  navHeight: number
  navCount: number
  headerBottom: number
  parentHeight: number | null
  parentContainsPlan: boolean
  navInsideAnsicht: boolean | null
  ansichtHeight: number | null
  planHeight: number | null
  scrollY: number
  scrollHeight: number
  clientHeight: number
  overflowX: number
  offset: string
  safeAreaClass: boolean
  knoepfe: Knopf[]
  ancestorOverflow: string[]
  ansicht: string | null
  suchfelder: number
  tage: number
}

const evidenz: Record<string, unknown> = {
  grenze: [
    'CDP pageScale und visualViewport.scale sind kein Desktop-Browserzoom 200%.',
    'Kein physisches Gerät, keine OS-Tastatur, kein VoiceOver.',
  ],
}

test('the geometry harness stays on the test import path', () => {
  assert.equal(typeof mountUxU1a2Harness, 'function')
})

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
  const leer = join(process.cwd(), 'scripts/trip-personal-preparation-workflow-completion-1/shims/empty.ts')
  const shims = join(process.cwd(), 'scripts/trip-personal-preparation-workflow-completion-1/shims')
  const gebaut = await esbuild.build({
    absWorkingDir: process.cwd(),
    entryPoints: ['lib/trips/ux-u1a2-geometry-1/harness.tsx'],
    bundle: true,
    write: false,
    format: 'iife',
    platform: 'browser',
    jsx: 'automatic',
    outfile: join(mkdtempSync(join(tmpdir(), 'ux-u1a2-')), 'harness.js'),
    define: { 'process.env.NODE_ENV': '"production"' },
    banner: { js: 'var __name=(target)=>target;globalThis.process=globalThis.process||{env:{NODE_ENV:"production"}};globalThis.global=globalThis;' },
    alias: { '@': process.cwd() },
    plugins: [
      {
        name: 'next-shims',
        setup(build) {
          const ziel: Record<string, string> = {
            'next/link': join(process.cwd(), 'lib/trips/guest-nav-text-1/link.tsx'),
            'next/navigation': join(shims, 'navigation.tsx'),
            'next/dynamic': join(shims, 'dynamic.tsx'),
            'next/image': join(shims, 'image.tsx'),
            'next/cache': leer,
            'next/headers': leer,
            'next/server': leer,
            'server-only': leer,
            '@opentelemetry/api': leer,
          }
          build.onResolve({ filter: /^(next\/|server-only$|@opentelemetry\/api$)/ }, (args) => ({
            path: resolve(ziel[args.path] ?? leer),
          }))
        },
      },
    ],
  })
  const js = gebaut.outputFiles[0]?.text
  if (!js) throw new Error('geometry harness bundle was empty')
  return js
}

function html(css: string, js: string) {
  return `<!doctype html><html><head><meta charset="utf-8" /><style>${css}</style><style>html{scroll-behavior:auto !important}</style></head><body><div id="root"></div><script>${js}</script></body></html>`
}

async function browserStarten(): Promise<Browser> {
  try {
    return await chromium.launch({ headless: true, args: BROWSER_ARGS })
  } catch (fehler) {
    const meldung = fehler instanceof Error ? fehler.message : String(fehler)
    if (!meldung.includes("Executable doesn't exist")) throw fehler
    return chromium.launch({ headless: true, channel: 'chrome', args: BROWSER_ARGS })
  }
}

async function geometrie(page: Page): Promise<Geometrie> {
  return page.evaluate(() => {
    const nav = document.querySelector('[data-workspace-mode-nav]')
    const header = document.querySelector('[data-site-header]')
    const ansicht = document.querySelector('[data-workspace-ansicht]')
    const plan = document.querySelector('[data-workspace-modus="plan"]')
    if (!(nav instanceof HTMLElement) || !(header instanceof HTMLElement)) {
      return { fehler: 'nav oder kopf fehlt' } as Geometrie
    }
    const nr = nav.getBoundingClientRect()
    const hr = header.getBoundingClientRect()
    const parent = nav.parentElement
    const knoepfe = [...nav.querySelectorAll('button')].map((el) => {
      const box = el.getBoundingClientRect()
      const range = document.createRange()
      range.selectNodeContents(el)
      const text = range.getBoundingClientRect()
      return {
        name: (el.textContent || '').replace(/\s+/g, ' ').trim(),
        left: box.left,
        right: box.right,
        top: box.top,
        bottom: box.bottom,
        width: box.width,
        height: box.height,
        textLeft: text.left,
        textRight: text.right,
        textTop: text.top,
        textBottom: text.bottom,
        fontSize: getComputedStyle(el).fontSize,
      }
    })
    const ancestorOverflow: string[] = []
    let knoten = nav.parentElement
    while (knoten) {
      const stil = getComputedStyle(knoten)
      if (/(auto|scroll|hidden|clip)/.test(`${stil.overflowX} ${stil.overflowY}`)) {
        ancestorOverflow.push(`${knoten.tagName}.${String(knoten.className).slice(0, 80)}`)
      }
      knoten = knoten.parentElement
    }
    return {
      lage: nav.getAttribute('data-shell-nav'),
      position: getComputedStyle(nav).position,
      navTop: nr.top,
      navBottom: nr.bottom,
      navHeight: nr.height,
      navCount: document.querySelectorAll('[data-workspace-mode-nav]').length,
      headerBottom: hr.bottom,
      parentHeight: parent?.getBoundingClientRect().height ?? null,
      parentContainsPlan: Boolean(parent && plan && parent.contains(plan)),
      navInsideAnsicht: ansicht ? ansicht.contains(nav) : null,
      ansichtHeight: ansicht?.getBoundingClientRect().height ?? null,
      planHeight: plan?.getBoundingClientRect().height ?? null,
      scrollY: window.scrollY,
      scrollHeight: document.documentElement.scrollHeight,
      clientHeight: document.documentElement.clientHeight,
      overflowX: document.documentElement.scrollWidth - document.documentElement.clientWidth,
      offset: getComputedStyle(document.documentElement).getPropertyValue('--ux-u1a-nav-offset').trim(),
      safeAreaClass: nav.className.includes('safe-area-inset-bottom'),
      knoepfe,
      ancestorOverflow,
      ansicht: ansicht?.getAttribute('data-workspace-ansicht') ?? null,
      suchfelder: document.querySelectorAll('[name="flugsuche"], [name="hotelsuche"], [name="aktivitaeten"]').length,
      tage: new Set([...document.querySelectorAll('[data-timeline-tag]')].map((el) => el.getAttribute('data-timeline-tag'))).size,
    }
  })
}

async function scrollZu(page: Page, top: number) {
  await page.evaluate((ziel) => window.scrollTo(0, ziel), top)
  await page.waitForFunction((ziel) => Math.abs(window.scrollY - ziel) <= 1, top)
}

function runde(wert: number | null) {
  return wert == null ? null : Math.round(wert * 10) / 10
}

function knapp(stand: Geometrie) {
  return {
    lage: stand.lage,
    position: stand.position,
    navTop: runde(stand.navTop),
    navBottom: runde(stand.navBottom),
    navHeight: runde(stand.navHeight),
    headerBottom: runde(stand.headerBottom),
    parentHeight: runde(stand.parentHeight),
    ansichtHeight: runde(stand.ansichtHeight),
    planHeight: runde(stand.planHeight),
    scrollY: runde(stand.scrollY),
    scrollHeight: runde(stand.scrollHeight),
    overflowX: runde(stand.overflowX),
    offset: stand.offset,
    knoepfe: stand.knoepfe.map((knopf) => ({
      name: knopf.name,
      width: runde(knopf.width),
      height: runde(knopf.height),
      top: runde(knopf.top),
      textLeft: runde(knopf.textLeft),
      textRight: runde(knopf.textRight),
      insetLeft: runde(knopf.textLeft - knopf.left),
      insetRight: runde(knopf.right - knopf.textRight),
      fontSize: knopf.fontSize,
    })),
  }
}

async function bild(page: Page, name: string) {
  const ordner = process.env.UX_U1A2_SCREENSHOTS
  if (!ordner) return
  mkdirSync(ordner, { recursive: true })
  await page.screenshot({ path: join(ordner, `${name}.png`), fullPage: false })
}

describe('UX U1-A2 navigation geometry', { timeout: 180_000 }, () => {
  let browser: Browser
  let server: Server
  let origin: string
  const anfragen: string[] = []

  before(async () => {
    const css = await projektCss()
    const js = await bundeln()
    const dokument = html(css, js)
    server = createServer((req, res) => {
      res.writeHead(200, { 'content-type': 'text/html; charset=utf-8', 'cache-control': 'no-store' })
      res.end(dokument)
    })
    await new Promise<void>((resolveListen) => server.listen(0, '127.0.0.1', resolveListen))
    const adresse = server.address() as AddressInfo
    origin = `http://127.0.0.1:${adresse.port}`
    browser = await browserStarten()
  })

  after(async () => {
    await browser?.close()
    await new Promise<void>((resolveClose, reject) => server.close((fehler) => (fehler ? reject(fehler) : resolveClose())))
    evidenz.providerAnfragen = anfragen.filter((url) => PROVIDER.test(url))
    const ziel = process.env.UX_U1A2_EVIDENCE
    if (ziel) {
      mkdirSync(dirname(ziel), { recursive: true })
      writeFileSync(ziel, `${JSON.stringify(evidenz, null, 2)}\n`)
    }
    const bilder = process.env.UX_U1A2_SCREENSHOTS
    if (bilder) {
      mkdirSync(bilder, { recursive: true })
      writeFileSync(join(bilder, 'messung.json'), `${JSON.stringify(evidenz, null, 2)}\n`)
    }
  })

  async function oeffnen(breite: number, hoehe: number, tastatur = false) {
    const page = await browser.newPage({ viewport: { width: breite, height: hoehe } })
    if (tastatur) {
      await page.addInitScript(`(() => {
        const fake = {
          get width() { return window.innerWidth },
          get height() { return Math.max(120, window.innerHeight - 320) },
          offsetTop: 0,
          offsetLeft: 0,
          scale: 1,
          addEventListener() {},
          removeEventListener() {},
        }
        Object.defineProperty(window, 'visualViewport', { configurable: true, get: () => fake })
      })()`)
    }
    const fehler: string[] = []
    page.on('pageerror', (error) => fehler.push(error.message))
    page.on('request', (request) => {
      const url = request.url()
      if (!url.startsWith(origin)) anfragen.push(url)
    })
    await page.goto(origin, { waitUntil: 'load' })
    await page.waitForSelector('[data-workspace-mode-nav]')
    await page.waitForFunction(() => !document.querySelector('[aria-busy="true"]'))
    return { page, fehler }
  }

  test('the shipped short parent loses the sticky nav at scroll 650', async () => {
    const page = await browser.newPage({ viewport: { width: 1440, height: 1000 } })
    await page.setContent(`<!doctype html><body style="margin:0">
      <header style="position:sticky;top:0;height:72px;background:white">Kopf</header>
      <div id="alt-ansicht" data-workspace-ansicht="plan">
        <nav id="alt-nav" data-workspace-mode-nav style="position:sticky;top:72px;height:54px;background:#ddd">Nav</nav>
        <div style="height:84px">Aktionen</div>
      </div>
      <div style="height:2400px">Plan</div>
    </body>`)
    await page.evaluate(() => window.scrollTo(0, 650))
    const alt = await page.evaluate(() => {
      const nav = document.getElementById('alt-nav')!.getBoundingClientRect()
      const ansicht = document.getElementById('alt-ansicht')!.getBoundingClientRect()
      return { top: nav.top, bottom: nav.bottom, ansicht: ansicht.height, scrollY: window.scrollY }
    })
    evidenz.negativ = {
      scrollY: alt.scrollY,
      navTop: runde(alt.top),
      navBottom: runde(alt.bottom),
      ansichtHeight: runde(alt.ansicht),
    }
    assert.equal(alt.scrollY, 650)
    assert.equal(alt.top < 0, true, JSON.stringify(alt))
    assert.equal(alt.ansicht < 180, true, JSON.stringify(alt))
    await page.close()
  })

  test('desktop and tablet keep one sticky nav under the header through a long plan', async () => {
    const laeufe: Record<string, unknown> = {}
    for (const viewport of [
      { name: '1440', width: 1440, height: 1000 },
      { name: '768', width: 768, height: 1000 },
    ]) {
      const { page, fehler } = await oeffnen(viewport.width, viewport.height)
      await page.getByRole('button', { name: 'Reiseplan', exact: true }).click()
      await page.waitForFunction(() => document.querySelector('[data-workspace-ansicht]')?.getAttribute('data-workspace-ansicht') === 'plan')
      await page.waitForFunction(() => (document.body.textContent || '').includes('Synthetische Planzeile 100'))
      const vorher = await geometrie(page)
      assert.equal(vorher.scrollHeight > viewport.height + 900, true, JSON.stringify(knapp(vorher)))
      const punkte: Record<string, unknown> = {}
      for (const y of [0, 450, 650, 900]) {
        await scrollZu(page, y)
        const stand = await geometrie(page)
        punkte[String(y)] = knapp(stand)
        assert.equal(stand.fehler, undefined)
        assert.equal(stand.navCount, 1)
        assert.equal(stand.lage, 'sticky', `${viewport.name} ${y}`)
        assert.equal(stand.position, 'sticky', `${viewport.name} ${y}`)
        assert.equal(stand.navInsideAnsicht, false)
        assert.equal(stand.parentContainsPlan, true)
        assert.equal((stand.parentHeight ?? 0) > 800, true, JSON.stringify(knapp(stand)))
        assert.equal((stand.ansichtHeight ?? 999) < 420, true, JSON.stringify(knapp(stand)))
        assert.equal(stand.ancestorOverflow.length, 0, stand.ancestorOverflow.join(','))
        assert.equal(stand.suchfelder, 0)
        // The long scroll fixture is the day-1 note, which is the default detail.
        // Compact route renders that run's day button, not all 22 at once.
        assert.equal(stand.tage, 1, `${viewport.name} sichtbarer Standardlauf`)
        assert.equal(await page.locator('[data-u1c-lauf]').count(), 5, `${viewport.name} Läufe`)
        if (y === 0) {
          assert.equal(stand.navTop > stand.headerBottom, true, JSON.stringify(knapp(stand)))
        } else {
          assert.equal(stand.navTop >= stand.headerBottom - 1, true, JSON.stringify(knapp(stand)))
          assert.equal(stand.navTop <= stand.headerBottom + 20, true, JSON.stringify(knapp(stand)))
          assert.equal(stand.navBottom > stand.headerBottom + 20, true, JSON.stringify(knapp(stand)))
        }
        if (y === 650) await bild(page, `sticky-${viewport.name}-scroll650`)
      }
      await scrollZu(page, 0)
      const erreicht = new Set<string>()
      const laufZahl = await page.locator('[data-u1c-lauf]').count()
      for (let index = 0; index < laufZahl; index += 1) {
        const lauf = page.locator('[data-u1c-lauf]').nth(index)
        if (!(await lauf.isVisible())) await page.locator('[data-u1b-zur-route]').click()
        await lauf.click()
        const ids = await page.locator('[data-timeline-tag]').evaluateAll((knoten) => knoten.map((el) => el.getAttribute('data-timeline-tag') ?? ''))
        for (const id of ids) if (id) erreicht.add(id)
      }
      assert.deepEqual(
        [...erreicht].sort((links, rechts) => Number(links.slice(4)) - Number(rechts.slice(4))),
        Array.from({ length: 22 }, (_, index) => `day-${index + 1}`),
        `${viewport.name} erreichbare Tage`,
      )
      assert.deepEqual(fehler, [])
      laeufe[viewport.name] = punkte
      await page.close()
    }
    evidenz.sticky = laeufe
  })

  test('mode switches keep history, focus and a single nav', async () => {
    const { page, fehler } = await oeffnen(1440, 1000)
    const plan = page.getByRole('button', { name: 'Reiseplan', exact: true })
    await plan.click()
    await page.waitForFunction(() => location.search.includes('ansicht=plan'))
    await page.getByRole('button', { name: 'Übersicht', exact: true }).click()
    await page.waitForFunction(() => document.querySelector('[data-workspace-ansicht]')?.getAttribute('data-workspace-ansicht') === 'uebersicht')
    await page.goBack()
    await page.waitForFunction(() => document.querySelector('[data-workspace-ansicht]')?.getAttribute('data-workspace-ansicht') === 'plan')
    assert.match(page.url(), /ansicht=plan/)
    const organisieren = page.getByRole('button', { name: 'Organisieren', exact: true })
    await organisieren.focus()
    await page.keyboard.press('Enter')
    await page.waitForFunction(() => document.activeElement?.id === 'workspace-organisieren-titel')
    const stand = await geometrie(page)
    assert.equal(stand.navCount, 1)
    assert.equal(stand.suchfelder, 0)
    assert.deepEqual(fehler, [])
    evidenz.history = { ansicht: stand.ansicht, navCount: stand.navCount }
    await page.close()
  })

  test('390 and 430 show four equal labels in one bottom row; 360 uses flow', async () => {
    const { page, fehler } = await oeffnen(390, 844)
    const laeufe: Record<string, unknown> = {}
    for (const breite of [390, 430]) {
      await page.setViewportSize({ width: breite, height: 844 })
      await page.waitForFunction(() => document.querySelector('[data-workspace-mode-nav]')?.getAttribute('data-shell-nav') === 'bottom')
      const stand = await geometrie(page)
      laeufe[String(breite)] = knapp(stand)
      assert.equal(stand.lage, 'bottom', String(breite))
      assert.equal(stand.position, 'fixed', String(breite))
      assert.equal(stand.safeAreaClass, true)
      assert.equal(stand.overflowX <= 1, true, `${breite} overflow ${stand.overflowX}`)
      assert.equal(stand.navHeight < 80, true, JSON.stringify(knapp(stand)))
      assert.deepEqual(stand.knoepfe.map((knopf) => knopf.name), LABEL)
      const tops = stand.knoepfe.map((knopf) => knopf.top)
      const widths = stand.knoepfe.map((knopf) => knopf.width)
      assert.equal(Math.max(...tops) - Math.min(...tops) <= 1, true, JSON.stringify(tops))
      assert.equal(Math.max(...widths) - Math.min(...widths) <= 1, true, JSON.stringify(widths))
      for (const knopf of stand.knoepfe) {
        assert.equal(knopf.height >= 44, true, knopf.name)
        assert.equal(knopf.width >= 44, true, knopf.name)
        assert.equal(knopf.fontSize, '14px', knopf.name)
        assert.equal(knopf.textLeft >= knopf.left - 0.5, true, JSON.stringify(knopf))
        assert.equal(knopf.textRight <= knopf.right + 0.5, true, `${knopf.name} ${knopf.textRight} > ${knopf.right}`)
        assert.equal(knopf.textTop >= knopf.top - 1, true, knopf.name)
        assert.equal(knopf.textBottom <= knopf.bottom + 1, true, knopf.name)
      }
      const laufweite = await page.evaluate(() => getComputedStyle(document.querySelector('[data-workspace-mode-nav] button')!).letterSpacing)
      assert.equal(laufweite.startsWith('-'), true, laufweite)
      assert.match(stand.offset, /px$/)
      const offsetPx = Number.parseFloat(stand.offset)
      assert.equal(Math.abs(offsetPx - stand.navHeight) <= 1, true, stand.offset)
      if (breite === 390) await bild(page, 'bottom-390')
    }
    await page.setViewportSize({ width: 360, height: 844 })
    await page.waitForFunction(() => document.querySelector('[data-workspace-mode-nav]')?.getAttribute('data-shell-nav') === 'flow')
    const schmal = await geometrie(page)
    laeufe['360'] = knapp(schmal)
    assert.equal(schmal.lage, 'flow')
    assert.equal(schmal.position, 'relative')
    assert.deepEqual(schmal.knoepfe.map((knopf) => knopf.name), LABEL)
    for (const knopf of schmal.knoepfe) {
      assert.equal(knopf.fontSize, '14px')
      assert.equal(knopf.textLeft >= knopf.left - 1, true, JSON.stringify(knopf))
      assert.equal(knopf.textRight <= knopf.right + 1, true, JSON.stringify(knopf))
    }
    assert.equal(schmal.overflowX <= 1, true)
    assert.deepEqual(fehler, [])
    evidenz.bottom = laeufe
    await page.close()
  })

  test('DejaVu labels stay inside the 390 row, and a safe-area inset leaves that row', async () => {
    const { page, fehler } = await oeffnen(390, 844)
    await page.addStyleTag({
      content: '[data-shell-nav="bottom"] button { font-family: "DejaVu Sans", sans-serif !important; }',
    })
    await page.setViewportSize({ width: 391, height: 844 })
    await page.setViewportSize({ width: 390, height: 844 })
    await page.waitForFunction(() => document.querySelector('[data-workspace-mode-nav]')?.getAttribute('data-shell-nav') === 'bottom')
    const weit = await geometrie(page)
    evidenz.dejavu390 = knapp(weit)
    assert.equal(weit.lage, 'bottom')
    assert.equal(weit.navHeight < 80, true, JSON.stringify(knapp(weit)))
    assert.deepEqual(weit.knoepfe.map((knopf) => knopf.name), LABEL)
    const tops = weit.knoepfe.map((knopf) => knopf.top)
    assert.equal(Math.max(...tops) - Math.min(...tops) <= 1, true, JSON.stringify(tops))
    for (const knopf of weit.knoepfe) {
      assert.equal(knopf.fontSize, '14px', knopf.name)
      assert.equal(knopf.height >= 44, true, knopf.name)
      assert.equal(knopf.textLeft >= knopf.left - 0.5, true, JSON.stringify(knopf))
      assert.equal(knopf.textRight <= knopf.right + 0.5, true, JSON.stringify(knopf))
    }
    await bild(page, 'bottom-390-dejavu')

    await page.addStyleTag({
      content: '[data-shell-nav="bottom"] { padding-left: 24px !important; padding-right: 24px !important; }',
    })
    await page.setViewportSize({ width: 391, height: 844 })
    await page.setViewportSize({ width: 390, height: 844 })
    await page.waitForFunction(() => document.querySelector('[data-workspace-mode-nav]')?.getAttribute('data-shell-nav') === 'flow')
    const safe = await geometrie(page)
    evidenz.safeArea = knapp(safe)
    assert.equal(safe.lage, 'flow')
    assert.equal(safe.position, 'relative')
    assert.deepEqual(safe.knoepfe.map((knopf) => knopf.name), LABEL)
    for (const knopf of safe.knoepfe) {
      assert.equal(knopf.textLeft >= knopf.left - 0.5, true, JSON.stringify(knopf))
      assert.equal(knopf.textRight <= knopf.right + 0.5, true, JSON.stringify(knopf))
    }
    assert.equal(safe.overflowX <= 1, true)
    assert.deepEqual(fehler, [])
    await page.close()
  })

  test('280, 320, root 32 and the keyboard stand-in stay in relative flow', async () => {
    const laeufe: Record<string, unknown> = {}
    for (const breite of [280, 320]) {
      const { page, fehler } = await oeffnen(breite, 844)
      await page.waitForFunction(() => document.querySelector('[data-workspace-mode-nav]')?.getAttribute('data-shell-nav') === 'flow')
      await page.evaluate(() => {
        const nav = document.querySelector('[data-workspace-mode-nav]')
        if (!(nav instanceof HTMLElement)) return
        window.scrollTo(0, window.scrollY + nav.getBoundingClientRect().bottom + 24)
      })
      const stand = await geometrie(page)
      laeufe[String(breite)] = knapp(stand)
      assert.equal(stand.lage, 'flow')
      assert.equal(stand.position, 'relative')
      assert.equal(stand.navBottom <= 1, true, JSON.stringify(knapp(stand)))
      assert.equal(stand.offset, '')
      assert.deepEqual(stand.knoepfe.map((knopf) => knopf.name), LABEL)
      for (const knopf of stand.knoepfe) {
        assert.equal(knopf.fontSize, '14px')
        assert.equal(knopf.textRight <= knopf.right + 1, true, knopf.name)
      }
      assert.equal(stand.overflowX <= 1, true)
      assert.deepEqual(fehler, [])
      if (breite === 320) await bild(page, 'flow-320')
      await page.close()
    }

    const gross = await oeffnen(390, 844)
    await gross.page.evaluate(() => {
      document.documentElement.style.fontSize = '32px'
    })
    await gross.page.evaluate(() => window.dispatchEvent(new Event('resize')))
    await gross.page.waitForFunction(() => document.querySelector('[data-workspace-mode-nav]')?.getAttribute('data-shell-nav') === 'flow')
    const grossStand = await geometrie(gross.page)
    laeufe.root32 = knapp(grossStand)
    assert.equal(grossStand.position, 'relative')
    assert.equal(grossStand.knoepfe.every((knopf) => knopf.fontSize === '28px'), true, JSON.stringify(knapp(grossStand)))
    for (const knopf of grossStand.knoepfe) {
      assert.equal(knopf.textRight <= knopf.right + 1, true, knopf.name)
    }
    assert.deepEqual(gross.fehler, [])
    await gross.page.close()

    const tastatur = await oeffnen(390, 844, true)
    await tastatur.page.waitForFunction(() => document.querySelector('[data-workspace-mode-nav]')?.getAttribute('data-shell-nav') === 'flow')
    await tastatur.page.evaluate(() => {
      const nav = document.querySelector('[data-workspace-mode-nav]')
      if (!(nav instanceof HTMLElement)) return
      window.scrollTo(0, window.scrollY + nav.getBoundingClientRect().bottom + 24)
    })
    const tastaturStand = await geometrie(tastatur.page)
    laeufe.tastatur = knapp(tastaturStand)
    assert.equal(tastaturStand.position, 'relative')
    assert.equal(tastaturStand.navBottom <= 1, true, JSON.stringify(knapp(tastaturStand)))
    assert.deepEqual(tastatur.fehler, [])
    evidenz.flow = laeufe
    await tastatur.page.close()
  })

  test('viewport changes do not call a provider', async () => {
    const { page, fehler } = await oeffnen(1440, 1000)
    await page.setViewportSize({ width: 390, height: 844 })
    await page.waitForFunction(() => document.querySelector('[data-workspace-mode-nav]')?.getAttribute('data-shell-nav') === 'bottom')
    await page.getByRole('button', { name: 'Reiseplan', exact: true }).click()
    await page.waitForFunction(() => document.querySelector('[data-workspace-ansicht]')?.getAttribute('data-workspace-ansicht') === 'plan')
    const stand = await geometrie(page)
    assert.equal(stand.suchfelder, 0)
    assert.equal(anfragen.filter((url) => PROVIDER.test(url)).length, 0, anfragen.join('\n'))
    assert.deepEqual(fehler, [])
    await page.close()
  })
})
