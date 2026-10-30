import assert from 'node:assert/strict'
import { createRequire } from 'node:module'
import { createServer, type Server } from 'node:http'
import { mkdtempSync, readFileSync } from 'node:fs'
import { tmpdir } from 'node:os'
import { join } from 'node:path'
import { after, before, describe, test } from 'node:test'
import type { AddressInfo } from 'node:net'

import * as esbuild from 'esbuild'
import { chromium, type Browser, type Page } from 'playwright'

import { referenzReise } from '@/lib/trips/ux-u1c-route-design-alignment-1/fixture'
import { mountU1cWorkspace } from '@/lib/trips/ux-u1c-route-design-alignment-1/workspace-harness'

test('the workspace harness stays on the test import path', () => {
  assert.equal(typeof mountU1cWorkspace, 'function')
})

const BROWSER_ARGS = ['--no-sandbox', '--disable-dev-shm-usage']

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
  const gebaut = await esbuild.build({
    absWorkingDir: process.cwd(),
    entryPoints: ['lib/trips/ux-u1c-route-design-alignment-1/workspace-harness.tsx'],
    bundle: true,
    write: false,
    format: 'iife',
    platform: 'browser',
    jsx: 'automatic',
    outfile: join(mkdtempSync(join(tmpdir(), 'u1c-workspace-')), 'harness.js'),
    define: { 'process.env.NODE_ENV': '"production"' },
    banner: { js: 'var __name=(target)=>target;globalThis.process=globalThis.process||{env:{NODE_ENV:"production"}};globalThis.global=globalThis;' },
    plugins: [{
      name: 'u1c-shims',
      setup(build) {
        build.onResolve({ filter: /\.css$/ }, () => ({ path: 'css', namespace: 'u1c-css' }))
        build.onResolve({ filter: /^server-only$/ }, () => ({ path: 'server-only', namespace: 'u1c-leer' }))
        build.onResolve({ filter: /^next\// }, (args) => ({ path: args.path, namespace: 'u1c-leer' }))
        build.onResolve({ filter: /^@\// }, (args) => build.resolve(join(process.cwd(), args.path.slice(2)), { resolveDir: process.cwd(), kind: args.kind }))
        build.onLoad({ filter: /.*/, namespace: 'u1c-css' }, () => ({ contents: '', loader: 'js' }))
        build.onLoad({ filter: /.*/, namespace: 'u1c-leer' }, () => ({
          contents: [
            'export default function(){return null}',
            'export function cookies(){return {get(){return undefined},set(){},delete(){}}}',
            'export function headers(){return {get(){return null}}}',
            'export function draftMode(){return {isEnabled:false}}',
            'export function revalidatePath(){}',
            'export function revalidateTag(){}',
            'export function unstable_cache(fn){return fn}',
            'export function redirect(){}',
            'export function permanentRedirect(){}',
            'export function notFound(){}',
            'export function useRouter(){return {push(){},replace(){},refresh(){},back(){},forward(){}}}',
            'export function usePathname(){return "/"}',
            'export function useSearchParams(){return new URLSearchParams()}',
            'export function useParams(){return {}}',
            'export function useSelectedLayoutSegments(){return []}',
            'export function useFormStatus(){return {pending:false}}',
          ].join(';'),
          loader: 'js',
        }))
      },
    }],
  })
  const js = gebaut.outputFiles[0]?.text
  if (!js) throw new Error('u1c workspace bundle was empty')
  return js
}

function html(css: string, js: string) {
  const stil = `${css}\n${shellCss()}`.replaceAll('</style', '<\\/style')
  return `<!doctype html><html><head><meta charset="utf-8" /><style>${stil}</style></head><body><div id="root"></div><script>${js}</script></body></html>`
}

async function browserStarten() {
  try {
    return await chromium.launch({ headless: true, args: BROWSER_ARGS })
  } catch (fehler) {
    const meldung = fehler instanceof Error ? fehler.message : String(fehler)
    if (!meldung.includes("Executable doesn't exist")) throw fehler
    return chromium.launch({ headless: true, channel: 'chrome', args: BROWSER_ARGS })
  }
}

async function plan(page: Page) {
  await page.waitForSelector('[data-workspace-theme]')
  await page.getByRole('button', { name: 'Reiseplan', exact: true }).click()
  const route = page.locator('[data-u1c-route]')
  if (!(await route.isVisible())) {
    const zurueck = page.locator('[data-u1b-zur-route]')
    if (await zurueck.isVisible()) await zurueck.click()
  }
  await route.waitFor({ state: 'visible' })
}

function shellCss(): string {
  return ['components/workspace/workspace.css', 'components/workspace/workspace-surfaces.css']
    .map((datei) => readFileSync(join(process.cwd(), datei), 'utf8'))
    .join('\n')
}

async function textKontrast(page: Page, selector: string) {
  return page.locator(selector).first().evaluate((el) => {
    const gelesen = (farbe: string) => {
      const modern = farbe.match(/color\(srgb\s+([\d.]+)\s+([\d.]+)\s+([\d.]+)/)
      if (modern) {
        return {
          r: Math.round(Number(modern[1]) * 255),
          g: Math.round(Number(modern[2]) * 255),
          b: Math.round(Number(modern[3]) * 255),
          a: 1,
        }
      }
      const werte = farbe.match(/rgba?\((\d+),\s*(\d+),\s*(\d+)(?:,\s*([\d.]+))?\)/)
      if (!werte) return null
      return { r: Number(werte[1]), g: Number(werte[2]), b: Number(werte[3]), a: werte[4] == null ? 1 : Number(werte[4]) }
    }
    const misch = (
      unten: { r: number, g: number, b: number, a: number },
      oben: { r: number, g: number, b: number, a: number },
    ) => {
      const a = oben.a + unten.a * (1 - oben.a)
      const kanal = (links: number, rechts: number) => Math.round((rechts * oben.a + links * unten.a * (1 - oben.a)) / (a || 1))
      return { r: kanal(unten.r, oben.r), g: kanal(unten.g, oben.g), b: kanal(unten.b, oben.b), a }
    }
    const grund = (start: Element) => {
      const schichten: { r: number, g: number, b: number, a: number }[] = []
      let knoten: Element | null = start
      while (knoten) {
        const farbe = gelesen(getComputedStyle(knoten).backgroundColor)
        if (farbe && farbe.a > 0) schichten.push(farbe)
        if (farbe && farbe.a >= 0.99) break
        knoten = knoten.parentElement
      }
      let bild = { r: 255, g: 255, b: 255, a: 1 }
      for (const schicht of schichten.reverse()) bild = misch(bild, schicht)
      return bild
    }
    const kanal = (wert: number) => {
      const v = wert / 255
      return v <= 0.03928 ? v / 12.92 : ((v + 0.055) / 1.055) ** 2.4
    }
    const helligkeit = (rgb: { r: number, g: number, b: number }) => 0.2126 * kanal(rgb.r) + 0.7152 * kanal(rgb.g) + 0.0722 * kanal(rgb.b)
    const text = gelesen(getComputedStyle(el).color)
    const hintergrund = grund(el)
    const wert = text ? (Math.max(helligkeit(text), helligkeit(hintergrund)) + 0.05) / (Math.min(helligkeit(text), helligkeit(hintergrund)) + 0.05) : 0
    return { wert, text: getComputedStyle(el).color, hintergrund: `rgb(${hintergrund.r}, ${hintergrund.g}, ${hintergrund.b})` }
  })
}

describe('mounted workspace route contract', { timeout: 240_000 }, () => {
  let browser: Browser
  let server: Server
  let origin: string

  before(async () => {
    const css = await projektCss()
    const js = await bundeln()
    const dokument = html(css, js)
    server = createServer((_req, res) => {
      res.writeHead(200, { 'content-type': 'text/html; charset=utf-8', 'cache-control': 'no-store' })
      res.end(dokument)
    })
    await new Promise<void>((resolve) => server.listen(0, '127.0.0.1', resolve))
    origin = `http://127.0.0.1:${(server.address() as AddressInfo).port}`
    browser = await browserStarten()
  })

  after(async () => {
    await browser?.close()
    if (server) await new Promise<void>((resolve, reject) => server.close((fehler) => (fehler ? reject(fehler) : resolve())))
  })

  test('connection selection, history, names, ambiguity, invalidation and keyboard focus', async () => {
    const page = await browser.newPage({ viewport: { width: 1440, height: 900 } })
    const netz: string[] = []
    page.on('request', (request) => {
      if (request.resourceType() === 'fetch' || request.resourceType() === 'xhr') netz.push(request.url())
    })
    await page.goto(origin, { waitUntil: 'networkidle' })
    await plan(page)

    await page.getByRole('button', { name: 'Punkt hinzufügen' }).click()
    await page.locator('form[aria-label="Punkt hinzufügen"] input[required]').fill('Lokaler Korrektur-Entwurf')
    await page.getByRole('button', { name: 'Übersicht', exact: true }).click()
    await page.getByRole('button', { name: 'Reiseplan', exact: true }).click()
    assert.equal(await page.locator('form[aria-label="Punkt hinzufügen"] input[required]').inputValue(), 'Lokaler Korrektur-Entwurf')

    const tag3 = page.locator('[data-timeline-tag="day-3"]')
    await page.locator('[data-u1c-lauf][data-u1c-tage~="day-3"]').click()
    await tag3.waitFor()
    const name = await tag3.getAttribute('aria-label')
    assert.match(name ?? '', /^Tag 3, /)
    assert.match(name ?? '', /Nov/)
    await page.getByRole('button', { name: /Tag 3,.*Nov/ }).click()
    assert.match(page.url(), /tag=day-3/)

    await page.locator('[data-u1c-kante-id="connection:stage-bkk:stage-kc"]').click()
    await page.waitForSelector('[data-u1c-kante-detail]')
    assert.match(page.url(), /kante=connection/)
    const detail = await page.locator('[data-u1c-kante-detail]').innerText()
    assert.match(detail, /Reisedatum nicht gespeichert/)
    assert.equal(detail.includes('Zieleappe'), false)
    assert.equal(detail.includes('Kante'), false)
    await page.getByRole('button', { name: 'Zur Route' }).click()
    await page.waitForFunction(() => document.activeElement?.getAttribute('data-u1c-kante-id') === 'connection:stage-bkk:stage-kc')

    await page.reload({ waitUntil: 'networkidle' })
    await page.waitForSelector('[data-u1c-kante-detail]')
    await page.goBack()
    await page.waitForFunction(() => !new URL(location.href).searchParams.has('kante'))
    await page.goForward()
    await page.waitForSelector('[data-u1c-kante-detail]')

    await page.locator('[data-u1c-szene="namen"]').click()
    await page.waitForSelector('[data-u1c-lauf][data-u1c-tage~="day-5"]')
    await page.locator('[data-u1c-lauf][data-u1c-tage~="day-1"]').click()
    await page.waitForFunction(() => location.search.includes('tag=day-1'))
    await page.locator('[data-u1c-lauf][data-u1c-tage~="day-5"]').click()
    await page.waitForFunction(() => location.search.includes('tag=day-5'))
    await page.goBack()
    await page.waitForFunction(() => location.search.includes('tag=day-1') && !location.search.includes('tag=day-5'))

    await page.locator('[data-u1c-szene="abab"]').click()
    await page.waitForSelector('[data-u1c-kante-gesperrt="mehrdeutig"]')
    assert.equal(await page.locator('[data-u1c-kante-gesperrt="mehrdeutig"]').count(), 2)
    assert.equal(await page.locator('[data-u1c-kante][aria-pressed]').count(), 0)
    const mehrdeutig = await page.locator('[data-u1c-kante-gesperrt="mehrdeutig"]').first().innerText()
    assert.match(mehrdeutig, /mehrfach/)
    assert.equal(mehrdeutig.includes('Kennung'), false)
    await page.evaluate(() => {
      window.history.pushState(window.history.state, '', '/?ansicht=plan&kante=connection%3Astage-a%3Astage-b&tag=day-1')
      window.dispatchEvent(new PopStateEvent('popstate'))
    })
    await page.waitForSelector('[data-u1c-kante-hinweis="mehrdeutig"]')
    assert.match(page.url(), /kante=/)

    await page.locator('[data-u1c-szene="unklar"]').click()
    await page.locator('[data-u1c-kante-id="connection:stage-bkk:stage-kc"]').click()
    const unklar = await page.locator('[data-u1c-kante-detail]').innerText()
    assert.match(unklar, /unklar/)
    assert.equal(unklar.includes('Noch keine gespeicherte Verbindung'), false)
    assert.equal(unklar.includes('Fähre'), false)

    await page.goto(`${origin}/?ansicht=plan&tag=day-2&kante=outbound%3Astage-bkk`)
    await page.waitForSelector('[data-u1c-kante-hinweis="nicht-verfuegbar"]')
    assert.match(page.url(), /tag=day-2/)
    await page.goto(`${origin}/?ansicht=plan&tag=day-16&kante=return%3Astage-hkt`)
    await page.waitForSelector('[data-u1c-kante-hinweis="nicht-verfuegbar"]')
    assert.match(page.url(), /tag=day-16/)

    await page.locator('[data-u1c-szene="referenz"]').click()
    await plan(page)
    await page.locator('[data-u1c-kante-id="connection:stage-bkk:stage-kc"]').click()
    await page.locator('[data-u1c-etappe-weg]').click()
    await page.waitForSelector('[data-u1c-kante-hinweis="nicht-verfuegbar"]')
    assert.equal(await page.locator('[data-u1c-kante-id="connection:stage-bkk:stage-kc"]').count(), 0)

    await page.locator('[data-u1c-szene="referenz"]').click()
    await plan(page)
    await page.locator('[data-u1c-lauf][data-u1c-tage~="day-3"]').click()
    await page.locator('[data-timeline-tag="day-3"]').click()
    await page.locator('[data-u1c-tag-weg]').click()
    await page.waitForSelector('[data-u1b-hinweis="tag-fehlt"]')
    assert.equal(await page.locator('[data-timeline-tag="day-3"]').count(), 0)

    await page.locator('[data-u1c-szene="referenz"]').click()
    await page.setViewportSize({ width: 390, height: 844 })
    await plan(page)
    await page.waitForSelector('[data-u1b-anordnung="schmal"]')
    const lauf = page.locator('[data-u1c-lauf]').first()
    await lauf.focus()
    await page.keyboard.press('Enter')
    await page.waitForFunction(() => {
      const el = document.activeElement
      if (!(el instanceof HTMLElement) || el === document.body) return false
      return el.hasAttribute('data-u1b-zur-route')
    }, undefined, { timeout: 5000 }).catch(async (fehler: unknown) => {
      const stand = await page.evaluate(() => {
        const aktiv = document.activeElement
        const zur = document.querySelector('[data-u1b-zur-route]')
        return {
          tag: aktiv?.tagName ?? '',
          name: aktiv instanceof HTMLElement ? (aktiv.getAttribute('aria-label') ?? aktiv.textContent?.slice(0, 120)) : '',
          zur: zur instanceof HTMLElement,
          zurHidden: Boolean(zur?.closest('[hidden], [inert]')),
          routeHidden: Boolean(document.querySelector('[data-u1c-route]')?.closest('[hidden]')),
        }
      })
      throw new Error(`${fehler instanceof Error ? fehler.message : String(fehler)} ${JSON.stringify(stand)}`)
    })
    const sichtbar = await page.locator(':focus').boundingBox()
    assert.ok(sichtbar && sichtbar.width >= 44 && sichtbar.height >= 44 && sichtbar.y >= 0 && sichtbar.y + sichtbar.height <= 844)
    assert.deepEqual(netz, [])
    await page.close()
  })

  test('the shell reaches every reference day in light and green without a second back-to-top offset', async () => {
    const page = await browser.newPage({ viewport: { width: 1440, height: 900 } })
    const netz: string[] = []
    page.on('request', (request) => {
      if (request.resourceType() === 'fetch' || request.resourceType() === 'xhr') netz.push(request.url())
    })
    await page.goto(origin, { waitUntil: 'networkidle' })
    await plan(page)
    const ids = new Set<string>()
    const laeufe = await page.locator('[data-u1c-lauf]').count()
    for (let index = 0; index < laeufe; index += 1) {
      await page.locator('[data-u1c-lauf]').nth(index).click()
      const tags = await page.locator('[data-timeline-tag]').evaluateAll((knoten) => knoten.map((knoten) => knoten.getAttribute('data-timeline-tag')))
      for (const id of tags) if (id) ids.add(id)
    }
    assert.equal(ids.size, 22)
    assert.equal(await page.locator('[data-u1c-lauf]').count(), 5)

    await page.locator('[data-u1c-szene="arten"]').click()
    await page.locator('[data-u1c-lauf]').click()
    for (const titel of ['Art Flug', 'Art Unterkunft', 'Art Aktivität', 'Art Transfer', 'Art Mietwagen', 'Art Notiz', 'Art ohne Tag']) {
      await page.getByText(titel, { exact: true }).first().waitFor()
    }

    for (const thema of ['light', 'green'] as const) {
      if (thema === 'green') await page.getByRole('button', { name: 'Grünes Design aktivieren' }).click()
      await page.waitForSelector(`[data-workspace-theme="${thema}"]`)
      for (const breite of [320, 390, 768, 1440]) {
        await page.setViewportSize({ width: breite, height: 900 })
        if (breite < 800) await page.waitForSelector('[data-u1b-anordnung="schmal"]')
        const messung = await page.evaluate(() => {
          const breite = document.documentElement.clientWidth
          const treffer = [...document.querySelectorAll('body *')].filter((el) => {
            if (!(el instanceof HTMLElement)) return false
            if (el.closest('[data-u1c-probe-bar]')) return false
            const rechteck = el.getBoundingClientRect()
            return rechteck.width > 0 && rechteck.right > breite + 1
          }).slice(0, 6).map((el) => `${el.tagName}.${String(el.className).slice(0, 70)}`)
          return { ok: treffer.length === 0, treffer }
        })
        assert.equal(messung.ok, true, `${thema} ${breite} ${messung.treffer.join(' | ')}`)
      }
    }
    await page.setViewportSize({ width: 390, height: 844 })
    await page.evaluate(() => { document.documentElement.style.fontSize = '32px' })
    await page.waitForSelector('[data-shell-nav="flow"]')
    const rootOverflow = await page.evaluate(() => document.documentElement.scrollWidth <= document.documentElement.clientWidth + 1)
    assert.equal(rootOverflow, true)
    await page.evaluate(() => { document.documentElement.style.fontSize = '16px' })
    await page.setViewportSize({ width: 390, height: 844 })
    await page.locator('[data-u1c-szene="referenz"]').click()
    await plan(page)
    await page.evaluate(() => {
      const inhalt = document.querySelector('.workspace-content')
      if (inhalt instanceof HTMLElement) inhalt.style.minHeight = '1800px'
    })
    await page.waitForFunction(() => {
      if (window.scrollY < 500) window.scrollTo(0, 800)
      const knopf = document.querySelector('[data-back-to-top]')
      return window.scrollY > 400 && knopf instanceof HTMLElement && !knopf.classList.contains('invisible')
    }, undefined, { timeout: 3000 }).catch(async (fehler: unknown) => {
      const stand = await page.evaluate(() => {
        const knopf = document.querySelector('[data-back-to-top]')
        const nav = document.querySelector('[data-shell-nav]')
        return {
          scroll: window.scrollY,
          hoehe: document.documentElement.scrollHeight,
          klasse: knopf?.className ?? '',
          offset: getComputedStyle(document.documentElement).getPropertyValue('--ux-u1a-nav-offset'),
          nav: nav?.getAttribute('data-shell-nav') ?? '',
          position: nav ? getComputedStyle(nav).position : '',
        }
      })
      throw new Error(`${fehler instanceof Error ? fehler.message : String(fehler)} ${JSON.stringify(stand)}`)
    })
    const treffer = await page.evaluate(() => {
      const knopf = document.querySelector('[data-back-to-top]')
      const nav = document.querySelector('[data-shell-nav="bottom"]')
      if (!(knopf instanceof HTMLElement) || !(nav instanceof HTMLElement)) return null
      const k = knopf.getBoundingClientRect()
      const n = nav.getBoundingClientRect()
      return {
        overlap: !(k.bottom <= n.top || k.top >= n.bottom || k.right <= n.left || k.left >= n.right),
        inline: knopf.style.bottom,
      }
    })
    assert.equal(treffer?.overlap, false, JSON.stringify(treffer))
    assert.equal(treffer?.inline, '')
    assert.deepEqual(netz, [])
    await page.close()
  })

  test('guest discard and account deletion stay reachable in both headers', async () => {
    const gast = await browser.newPage({ viewport: { width: 390, height: 844 }, hasTouch: true })
    await gast.addInitScript((reise) => {
      localStorage.setItem('jetnity:reise:v3', JSON.stringify(reise))
    }, referenzReise())
    const dialoge: string[] = []
    let antwort: 'dismiss' | 'accept' = 'dismiss'
    gast.on('dialog', async (dialog) => {
      dialoge.push(dialog.message())
      if (antwort === 'dismiss') await dialog.dismiss()
      else await dialog.accept()
    })
    await gast.goto(origin, { waitUntil: 'networkidle' })
    await gast.locator('[data-u1c-probe="gast"]').click()
    const summary = gast.locator('[data-reiseoptionen] summary')
    try {
      await summary.waitFor({ timeout: 15000 })
    } catch (fehler) {
      const text = await gast.locator('body').innerText()
      throw new Error(`${fehler instanceof Error ? fehler.message : String(fehler)}\n${text.slice(0, 1200)}`)
    }
    await summary.click()
    const verwerfen = gast.getByRole('button', { name: 'Entwurf verwerfen' })
    await verwerfen.waitFor()
    await verwerfen.focus()
    await gast.keyboard.press('Enter')
    assert.match(dialoge.at(-1) ?? '', /von diesem Gerät entfernt/)
    assert.equal(await gast.evaluate(() => localStorage.getItem('jetnity:reise:v3') != null), true)

    await gast.getByRole('button', { name: 'Grünes Design aktivieren' }).click()
    await gast.waitForSelector('[data-workspace-theme="green"]')
    const kontrast = await gast.locator('.workspace-reiseoptionen > summary').evaluate((el) => {
      const kanal = (wert: number) => {
        const v = wert / 255
        return v <= 0.03928 ? v / 12.92 : ((v + 0.055) / 1.055) ** 2.4
      }
      const zahlen = (farbe: string) => farbe.match(/\d+/g)?.slice(0, 3).map(Number) ?? [0, 0, 0]
      const text = zahlen(getComputedStyle(el).color)
      let hintergrund = [255, 255, 255]
      let hintergrundQuelle = 'fallback'
      let knoten: Element | null = el
      while (knoten) {
        const farbe = getComputedStyle(knoten).backgroundColor
        const werte = farbe.match(/rgba?\((\d+), (\d+), (\d+)(?:, ([\d.]+))?\)/)
        if (werte && werte[4] !== '0') {
          hintergrund = [Number(werte[1]), Number(werte[2]), Number(werte[3])]
          hintergrundQuelle = `${knoten.tagName}.${String((knoten as HTMLElement).className).slice(0, 40)} ${farbe}`
          break
        }
        knoten = knoten.parentElement
      }
      const helligkeit = (rgb: number[]) => 0.2126 * kanal(rgb[0] ?? 0) + 0.7152 * kanal(rgb[1] ?? 0) + 0.0722 * kanal(rgb[2] ?? 0)
      const hell = Math.max(helligkeit(text), helligkeit(hintergrund))
      const dunkel = Math.min(helligkeit(text), helligkeit(hintergrund))
      return {
        wert: (hell + 0.05) / (dunkel + 0.05),
        text: getComputedStyle(el).color,
        hintergrundQuelle,
      }
    })
    assert.ok(kontrast.wert >= 3, JSON.stringify(kontrast))
    await verwerfen.tap()
    assert.equal(dialoge.length, 2)

    await gast.locator('[data-u1c-shell]').click()
    await gast.waitForSelector('[data-u1c-shell="aus"]')
    await gast.locator('[data-reiseoptionen] summary').click()
    await verwerfen.focus()
    await gast.keyboard.press('Enter')
    assert.equal(dialoge.length, 3)
    await gast.evaluate(() => {
      const original = Storage.prototype.removeItem
      let anzahl = 0
      Storage.prototype.removeItem = function (schluessel: string) {
        if (schluessel === 'jetnity:reise:v3') anzahl += 1
        return original.call(this, schluessel)
      }
      ;(window as unknown as { __u1cEntfernt?: () => number }).__u1cEntfernt = () => anzahl
    })
    antwort = 'accept'
    await verwerfen.click()
    await gast.waitForFunction(() => localStorage.getItem('jetnity:reise:v3') == null)
    assert.equal(await gast.evaluate(() => (window as unknown as { __u1cEntfernt: () => number }).__u1cEntfernt()), 1)
    assert.equal(dialoge.length, 4)
    await gast.close()

    const konto = await browser.newPage({ viewport: { width: 768, height: 900 }, hasTouch: true })
    const kontoDialoge: string[] = []
    let kontoAntwort: 'dismiss' | 'accept' = 'dismiss'
    konto.on('dialog', async (dialog) => {
      kontoDialoge.push(dialog.message())
      if (kontoAntwort === 'dismiss') await dialog.dismiss()
      else await dialog.accept()
    })
    const kontoNetz: string[] = []
    konto.on('request', (request) => {
      if (request.resourceType() === 'fetch' || request.resourceType() === 'xhr') kontoNetz.push(request.url())
    })
    await konto.goto(origin, { waitUntil: 'networkidle' })
    await konto.locator('[data-u1c-probe="konto"]').click()
    const kontoSummary = konto.locator('[data-reiseoptionen] summary')
    try {
      await kontoSummary.waitFor({ timeout: 15000 })
    } catch (fehler) {
      const text = await konto.locator('body').innerText()
      throw new Error(`${fehler instanceof Error ? fehler.message : String(fehler)}\n${text.slice(0, 1200)}`)
    }
    await kontoSummary.focus()
    await konto.keyboard.press('Enter')
    const loeschen = konto.getByRole('button', { name: 'Reise löschen' })
    await loeschen.waitFor()
    await loeschen.focus()
    await konto.keyboard.press('Enter')
    assert.match(kontoDialoge.at(-1) ?? '', /nicht rückgängig/)
    assert.equal(await konto.locator('[role="alert"]').count(), 0)
    await konto.getByRole('button', { name: 'Grünes Design aktivieren' }).click()
    await loeschen.tap()
    assert.equal(kontoDialoge.length, 2)
    await konto.locator('[data-u1c-shell]').click()
    await konto.locator('[data-reiseoptionen] summary').click()
    kontoAntwort = 'accept'
    await loeschen.click()
    await konto.getByRole('alert').waitFor()
    const meldung = await konto.getByRole('alert').innerText()
    assert.match(meldung, /Diese Reise ist unbekannt/)
    assert.equal(kontoDialoge.length, 3)
    assert.deepEqual(kontoNetz, [])
    await konto.close()
  })

  test('green editor text and the selected day stay distinct', async () => {
    const page = await browser.newPage({ viewport: { width: 768, height: 900 } })
    const netz: string[] = []
    page.on('request', (request) => {
      if (request.resourceType() === 'fetch' || request.resourceType() === 'xhr') netz.push(request.url())
    })
    await page.addInitScript((reise) => {
      if (!localStorage.getItem('jetnity:reise:v3')) localStorage.setItem('jetnity:reise:v3', JSON.stringify(reise))
    }, referenzReise())
    await page.goto(origin, { waitUntil: 'networkidle' })
    await page.locator('[data-u1c-probe="gast"]').click()
    await plan(page)
    await page.locator('[data-u1c-lauf][data-u1c-tage~="day-11"]').click()
    await page.locator('[data-timeline-tag="day-11"]').click()
    await page.getByRole('button', { name: 'Punkt hinzufügen' }).click()
    const formular = page.locator('form[aria-label="Punkt hinzufügen"]')
    await formular.waitFor()
    await formular.getByLabel('Art').selectOption({ label: 'Notiz' })
    await formular.locator('input[required]').fill('QA-Test Tag 11')
    await formular.locator('textarea').fill('Dieser Testeintrag soll nach dem Neuladen erhalten bleiben')

    await page.getByRole('button', { name: 'Grünes Design aktivieren' }).click()
    await page.waitForSelector('[data-workspace-theme="green"]')
    assert.equal(await formular.locator('input[required]').inputValue(), 'QA-Test Tag 11')
    assert.equal(await formular.locator('textarea').inputValue(), 'Dieser Testeintrag soll nach dem Neuladen erhalten bleiben')

    await formular.evaluate((el) => el.removeAttribute('data-planpunkt-editor'))
    const alt = await textKontrast(page, 'form[aria-label="Punkt hinzufügen"] h4')
    assert.ok(alt.wert < 4.5, `alter grüner Editor ${JSON.stringify(alt)}`)
    await formular.evaluate((el) => el.setAttribute('data-planpunkt-editor', ''))

    const pruefen = async (hinweis: string) => {
      for (const ziel of ['h4', 'label', 'p', '[role="status"]']) {
        const knoten = formular.locator(ziel)
        if (await knoten.count() === 0) continue
        const paar = await textKontrast(page, `form[aria-label="Punkt hinzufügen"] ${ziel}, form[aria-label^="Punkt bearbeiten"] ${ziel}`)
        assert.ok(paar.wert >= 4.5, `${hinweis} ${ziel} ${JSON.stringify(paar)}`)
      }
      const eingabe = await textKontrast(page, 'form[aria-label="Punkt hinzufügen"] input[required], form[aria-label^="Punkt bearbeiten"] input[required]')
      assert.ok(eingabe.wert >= 4.5, `${hinweis} Eingabe ${JSON.stringify(eingabe)}`)
      const abbrechen = await textKontrast(page, 'form[aria-label="Punkt hinzufügen"] button[type="button"], form[aria-label^="Punkt bearbeiten"] button[type="button"]')
      const speichern = await textKontrast(page, 'form[aria-label="Punkt hinzufügen"] button[type="submit"], form[aria-label^="Punkt bearbeiten"] button[type="submit"]')
      assert.ok(abbrechen.wert >= 4.5, `${hinweis} Abbrechen ${JSON.stringify(abbrechen)}`)
      assert.ok(speichern.wert >= 4.5, `${hinweis} Speichern ${JSON.stringify(speichern)}`)
    }
    for (const breite of [320, 390, 768, 1440]) {
      await page.setViewportSize({ width: breite, height: 900 })
      await pruefen(`grün ${breite}`)
    }
    await page.evaluate(() => { document.documentElement.style.fontSize = '32px' })
    const gross = await textKontrast(page, '[data-planpunkt-editor] h4')
    assert.ok(gross.wert >= 4.5, `Root-Schrift 32px, keine Browservergrösserung ${JSON.stringify(gross)}`)
    const overflow = await page.evaluate(() => document.documentElement.scrollWidth <= document.documentElement.clientWidth + 1)
    assert.equal(overflow, true)
    await page.evaluate(() => { document.documentElement.style.fontSize = '' })
    await page.setViewportSize({ width: 768, height: 900 })

    await page.getByRole('button', { name: 'Helle Darstellung aktivieren' }).click()
    await page.waitForSelector('[data-workspace-theme="light"]')
    assert.equal(await formular.locator('textarea').inputValue(), 'Dieser Testeintrag soll nach dem Neuladen erhalten bleiben')
    for (const breite of [320, 768]) {
      await page.setViewportSize({ width: breite, height: 900 })
      const hell = await textKontrast(page, '[data-planpunkt-editor] h4')
      assert.ok(hell.wert >= 4.5, `hell ${breite} ${JSON.stringify(hell)}`)
    }

    await formular.locator('input[required]').fill(' ')
    await formular.locator('button[type="submit"]').click()
    const alarm = formular.locator('[role="alert"]')
    await alarm.waitFor()
    await page.getByRole('button', { name: 'Grünes Design aktivieren' }).click()
    const fehler = await textKontrast(page, '[data-planpunkt-editor] [role="alert"]')
    assert.ok(fehler.wert >= 4.5, JSON.stringify(fehler))
    await formular.locator('input[required]').fill('QA-Test Tag 11')
    await formular.locator('textarea').fill('Dieser Testeintrag soll nach dem Neuladen erhalten bleiben')
    await formular.locator('input[required]').focus()
    const fokus = await formular.locator('input[required]').evaluate((el) => {
      const stil = getComputedStyle(el)
      return stil.outlineStyle !== 'none' || stil.boxShadow !== 'none'
    })
    assert.equal(fokus, true)
    await formular.locator('button[type="submit"]').click()
    await page.getByText('QA-Test Tag 11', { exact: true }).first().waitFor()

    await page.reload({ waitUntil: 'networkidle' })
    await page.locator('[data-u1c-probe="gast"]').click()
    await plan(page)
    await page.locator('[data-u1c-lauf][data-u1c-tage~="day-11"]').click()
    await page.locator('[data-timeline-tag="day-11"]').click()
    assert.equal(await page.locator('[data-plan-punkt]').count(), 1)
    await page.getByRole('button', { name: 'QA-Test Tag 11 bearbeiten' }).click()
    const bearbeiten = page.locator('form[aria-label="Punkt bearbeiten: QA-Test Tag 11"]')
    await bearbeiten.locator('textarea').fill('Dieser Testeintrag soll nach dem Neuladen erhalten bleiben und wurde bearbeitet')
    const bearbeitet = await textKontrast(page, 'form[aria-label="Punkt bearbeiten: QA-Test Tag 11"] h4')
    assert.ok(bearbeitet.wert >= 4.5, JSON.stringify(bearbeitet))
    await bearbeiten.locator('button[type="submit"]').click()
    await page.getByText('wurde bearbeitet', { exact: false }).first().waitFor()
    await page.reload({ waitUntil: 'networkidle' })
    await page.locator('[data-u1c-probe="gast"]').click()
    await plan(page)
    await page.locator('[data-u1c-lauf][data-u1c-tage~="day-11"]').click()
    await page.locator('[data-timeline-tag="day-11"]').click()
    assert.equal(await page.locator('[data-plan-punkt]').count(), 1)
    await page.getByText('wurde bearbeitet').waitFor()
    await page.locator('[data-timeline-tag="day-12"]').click()
    await page.waitForFunction(() => location.search.includes('tag=day-12'))
    await page.goBack()
    await page.waitForFunction(() => location.search.includes('tag=day-11'))
    assert.equal(await page.locator('[data-plan-punkt]').count(), 1)

    const zuGruen = page.getByRole('button', { name: 'Grünes Design aktivieren' })
    if (await zuGruen.isVisible()) await zuGruen.click()
    await page.waitForSelector('[data-workspace-theme="green"]')
    const gewaehlt = await page.locator('[data-timeline-tag="day-11"]').evaluate((el) => {
      const bevor = getComputedStyle(el, '::before')
      const stil = getComputedStyle(el)
      return {
        current: el.getAttribute('aria-current'),
        breite: bevor.width,
        schatten: stil.boxShadow,
        flaeche: stil.backgroundColor,
      }
    })
    assert.equal(gewaehlt.current, 'date')
    assert.ok(gewaehlt.breite !== '0px' && gewaehlt.breite !== 'auto', JSON.stringify(gewaehlt))
    assert.notEqual(gewaehlt.schatten, 'none')
    const nachbar = await page.locator('[data-timeline-tag="day-12"]').evaluate((el) => getComputedStyle(el).backgroundColor)
    assert.notEqual(gewaehlt.flaeche, nachbar)
    const tagText = await textKontrast(page, '[data-timeline-tag="day-11"] strong')
    assert.ok(tagText.wert >= 4.5, JSON.stringify(tagText))
    const lauf = page.locator('[data-u1c-lauf][aria-pressed="true"]')
    if (await lauf.count() > 0 && await lauf.first().isVisible()) {
      const laufText = await textKontrast(page, '[data-u1c-lauf][aria-pressed="true"] strong')
      assert.ok(laufText.wert >= 4.5, JSON.stringify(laufText))
    }
    assert.deepEqual(netz, [])
    await page.close()
  })
})
