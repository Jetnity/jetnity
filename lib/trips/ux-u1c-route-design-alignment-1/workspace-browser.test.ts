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
import { reiseLesen } from '@/lib/trips/schema'
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

function weissMinzeCss(): { css: string, canvas: string, rgb: string } {
  const datei = join(process.cwd(), 'styles/white-mint.css')
  const css = readFileSync(datei, 'utf8')
  const token = css.match(/--white-mint-canvas:\s*(#[0-9a-fA-F]{6})/)
  const hex = token?.[1]
  if (!hex || !css.includes('.workspace-shell[data-workspace-theme="light"]')) {
    throw new Error('styles/white-mint.css is missing the light workspace canvas')
  }
  const kanal = (start: number) => Number.parseInt(hex.slice(start, start + 2), 16)
  return { css, canvas: hex.toLowerCase(), rgb: `rgb(${kanal(1)}, ${kanal(3)}, ${kanal(5)})` }
}

function html(css: string, js: string) {
  const mint = weissMinzeCss()
  const stil = `${css}\n${mint.css}\n${shellCss()}`.replaceAll('</style', '<\\/style')
  return `<!doctype html><html><head><meta charset="utf-8" /><style>${stil}</style></head><body><div id="root"></div><script>${js}</script></body></html>`
}

async function lichtePalette(page: Page) {
  const mint = weissMinzeCss()
  const gemessen = await page.evaluate(() => {
    const schale = document.querySelector('.workspace-shell')
    const eng = (farbe: string) => farbe.replace(/\s+/g, '')
    const blatt = [...document.querySelectorAll('style')].map((el) => el.textContent ?? '').join('\n')
    return {
      thema: schale?.getAttribute('data-workspace-theme') ?? '',
      variable: getComputedStyle(document.documentElement).getPropertyValue('--white-mint-canvas').trim().toLowerCase(),
      dokument: eng(getComputedStyle(document.documentElement).backgroundColor),
      schale: schale instanceof HTMLElement ? eng(getComputedStyle(schale).backgroundColor) : '',
      geladen: blatt.includes('--white-mint-canvas') && blatt.includes('.workspace-shell[data-workspace-theme="light"]'),
    }
  })
  assert.equal(gemessen.geladen, true, JSON.stringify(gemessen))
  assert.equal(gemessen.thema, 'light', JSON.stringify(gemessen))
  assert.equal(gemessen.variable, mint.canvas, JSON.stringify(gemessen))
  assert.equal(gemessen.dokument, mint.rgb.replace(/\s+/g, ''), JSON.stringify(gemessen))
  assert.equal(gemessen.schale, mint.rgb.replace(/\s+/g, ''), JSON.stringify(gemessen))
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
  return page.locator(selector).evaluate((el) => {
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

const EDITOR_PFLICHT = [
  'Ort oder Aktivität',
  'Notiz, optional',
  'Anfangsdatum, optional',
  'Anfangszeit, optional',
  'Enddatum, optional',
  'Endzeit, optional',
  'Ortszeiten laut deinem Plan',
  'Abbrechen',
  'Speichern',
] as const

function fehlendePflicht(sichtbar: readonly string[], pflicht: readonly string[]) {
  return pflicht.filter((name) => !sichtbar.some((text) => text.includes(name)))
}

type EditorMessung = {
  wert: number
  text: string
  hintergrund: string
  tag: string
  name: string
  disabled: boolean
  role: string | null
}

async function editorMessung(formular: ReturnType<Page['locator']>): Promise<EditorMessung[]> {
  return formular.evaluate((wurzel) => {
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
    return [...wurzel.querySelectorAll('h4, label, p, button, input, select, textarea')].flatMap((el) => {
      const stil = getComputedStyle(el)
      if (stil.display === 'none' || stil.visibility === 'hidden') return []
      const text = gelesen(stil.color)
      const hintergrund = grund(el)
      const wert = text ? (Math.max(helligkeit(text), helligkeit(hintergrund)) + 0.05) / (Math.min(helligkeit(text), helligkeit(hintergrund)) + 0.05) : 0
      const feld = el instanceof HTMLInputElement || el instanceof HTMLTextAreaElement || el instanceof HTMLSelectElement || el instanceof HTMLButtonElement
      return [{
        wert,
        text: stil.color,
        hintergrund: `rgb(${hintergrund.r}, ${hintergrund.g}, ${hintergrund.b})`,
        tag: el.tagName,
        name: (el.textContent ?? el.getAttribute('aria-label') ?? '').replace(/\s+/g, ' ').trim().slice(0, 80),
        disabled: feld ? el.disabled : false,
        role: el.getAttribute('role'),
      }]
    })
  })
}

async function editorPruefen(formular: ReturnType<Page['locator']>, hinweis: string, art: 'neu' | 'bestand') {
  const pflicht = art === 'neu'
    ? ['Neuer Punkt', 'Art', ...EDITOR_PFLICHT]
    : ['Punkt bearbeiten', 'Zuordnung im Tagesplan', ...EDITOR_PFLICHT]
  const messung = await editorMessung(formular)
  const fehlt = fehlendePflicht(messung.map((eintrag) => eintrag.name), pflicht)
  assert.deepEqual(fehlt, [], `${hinweis} fehlt ${fehlt.join(', ')}`)
  const daten = messung.filter((eintrag) => eintrag.tag === 'LABEL' && /Anfangs|End/.test(eintrag.name))
  assert.equal(daten.length, 4, `${hinweis} Datumsfelder ${daten.map((eintrag) => eintrag.name).join('|')}`)
  for (const eintrag of messung) {
    if (eintrag.role === 'alert' || eintrag.role === 'status') continue
    assert.ok(eintrag.wert >= 4.5, `${hinweis} ${eintrag.tag} ${eintrag.disabled ? 'deaktiviert' : 'aktiv'} ${eintrag.name} ${JSON.stringify(eintrag)}`)
  }
  return messung
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
      if (thema === 'light') await lichtePalette(page)
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
    const context = await browser.newContext({ viewport: { width: 768, height: 900 } })
    const page = await context.newPage()
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
    assert.deepEqual(
      fehlendePflicht(['Art', 'Ort oder Aktivität', 'Notiz, optional'], ['Enddatum, optional']),
      ['Enddatum, optional'],
    )

    const themaSetzen = async (name: 'light' | 'green') => {
      const aktuell = await page.locator('.workspace-shell').getAttribute('data-workspace-theme')
      if (aktuell === name) return
      await page.getByRole('button', { name: name === 'green' ? 'Grünes Design aktivieren' : 'Helle Darstellung aktivieren' }).click()
      await page.waitForSelector(`[data-workspace-theme="${name}"]`)
    }
    const breiten = [320, 390, 768, 1440]
    for (const name of ['green', 'light'] as const) {
      await themaSetzen(name)
      for (const breite of breiten) {
        await page.setViewportSize({ width: breite, height: 900 })
        await editorPruefen(formular, `${name} neu ${breite}`, 'neu')
      }
      await page.evaluate(() => { document.documentElement.style.fontSize = '32px' })
      await editorPruefen(formular, `${name} neu Root-Schrift 32px, keine Browservergrösserung`, 'neu')
      const overflow = await page.evaluate(() => document.documentElement.scrollWidth <= document.documentElement.clientWidth + 1)
      assert.equal(overflow, true, `${name} root text`)
      await page.evaluate(() => { document.documentElement.style.fontSize = '' })
    }
    await page.setViewportSize({ width: 768, height: 900 })
    assert.equal(await formular.locator('textarea').inputValue(), 'Dieser Testeintrag soll nach dem Neuladen erhalten bleiben')

    await themaSetzen('green')
    await formular.locator('input[required]').fill(' ')
    await formular.locator('button[type="submit"]').click()
    const alarm = formular.locator('[role="alert"]')
    await alarm.waitFor()
    const fehler = await editorMessung(formular)
    const alarmText = fehler.filter((eintrag) => eintrag.role === 'alert')
    assert.equal(alarmText.length, 1)
    assert.ok(alarmText[0]?.wert >= 4.5, JSON.stringify(alarmText[0]))
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
    await bearbeiten.waitFor()
    await bearbeiten.locator('textarea').fill('Dieser Testeintrag soll nach dem Neuladen erhalten bleiben und wurde bearbeitet')
    for (const name of ['green', 'light'] as const) {
      await themaSetzen(name)
      for (const breite of breiten) {
        await page.setViewportSize({ width: breite, height: 900 })
        await editorPruefen(bearbeiten, `${name} bestand ${breite}`, 'bestand')
      }
      await page.evaluate(() => { document.documentElement.style.fontSize = '32px' })
      await editorPruefen(bearbeiten, `${name} bestand Root-Schrift 32px, keine Browservergrösserung`, 'bestand')
      await page.evaluate(() => { document.documentElement.style.fontSize = '' })
    }
    await page.setViewportSize({ width: 768, height: 900 })
    await themaSetzen('green')
    await bearbeiten.locator('label').filter({ hasText: 'Enddatum, optional' }).evaluate((el) => {
      const flaeche = el.closest('form')
      el.style.color = flaeche ? getComputedStyle(flaeche).backgroundColor : 'rgb(15, 48, 42)'
    })
    const beschaedigt = (await editorMessung(bearbeiten)).filter((eintrag) => eintrag.tag === 'LABEL' && eintrag.name.includes('Enddatum'))
    assert.equal(beschaedigt.length, 1)
    assert.ok((beschaedigt[0]?.wert ?? 99) < 4.5, JSON.stringify(beschaedigt[0]))
    const erste = (await editorMessung(bearbeiten)).find((eintrag) => eintrag.tag === 'LABEL' && eintrag.name.includes('Ort oder Aktivität'))
    assert.ok((erste?.wert ?? 0) >= 4.5, JSON.stringify(erste))
    await bearbeiten.locator('label').filter({ hasText: 'Enddatum, optional' }).evaluate((el) => { el.style.color = '' })
    await editorPruefen(bearbeiten, 'grün bestand nach Gegenprobe', 'bestand')
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
    await context.close()
  })

  test('flow navigation hides the back-to-top control that intercepted the next day', async () => {
    const context = await browser.newContext({ viewport: { width: 768, height: 900 } })
    const page = await context.newPage()
    const fremd: string[] = []
    await page.route('**/*', (route) => {
      const url = route.request().url()
      if (url.startsWith(origin) || url.startsWith('data:') || url.startsWith('blob:')) return route.continue()
      fremd.push(url)
      return route.abort()
    })
    await page.addInitScript((reise) => {
      localStorage.setItem('jetnity:reise:v3', JSON.stringify(reise))
    }, referenzReise())
    await page.goto(origin, { waitUntil: 'networkidle' })
    await page.locator('[data-u1c-probe="gast"]').click()
    await plan(page)
    await page.locator('[data-u1c-lauf][data-u1c-tage~="day-11"]').click()
    await page.locator('[data-timeline-tag="day-11"]').click()
    await page.locator('[data-plan-tag-naechster]').waitFor()

    const themaSetzen = async (name: 'light' | 'green') => {
      await page.setViewportSize({ width: 768, height: 900 })
      const aktuell = await page.locator('.workspace-shell').getAttribute('data-workspace-theme')
      if (aktuell === name) return
      await page.getByRole('button', { name: name === 'green' ? 'Grünes Design aktivieren' : 'Helle Darstellung aktivieren' }).click()
      await page.waitForSelector(`[data-workspace-theme="${name}"]`)
    }
    const wartenAufScroll = async (top: number) => {
      await page.evaluate((y) => window.scrollTo(0, y), top)
      await page.waitForFunction((y) => {
        const knopf = document.querySelector('[data-back-to-top]')
        return knopf instanceof HTMLElement && Math.abs(window.scrollY - y) <= 1
          && knopf.classList.contains('invisible') === (y <= 400)
      }, top)
    }
    const lage = () => page.evaluate(() => {
      const kasten = (el: Element | null) => {
        if (!(el instanceof HTMLElement)) return null
        const r = el.getBoundingClientRect()
        return {
          x: Math.round(r.x), y: Math.round(r.y), w: Math.round(r.width), h: Math.round(r.height),
          right: Math.round(r.right), bottom: Math.round(r.bottom), rects: el.getClientRects().length,
        }
      }
      const treffen = (el: Element | null) => {
        if (!(el instanceof HTMLElement)) return null
        const r = el.getBoundingClientRect()
        const x = r.left + r.width / 2
        const y = r.top + r.height / 2
        const hit = document.elementFromPoint(x, y)
        const knopf = hit?.closest('button, a, [data-back-to-top], [data-shell-nav]')
        return {
          x: Math.round(x), y: Math.round(y),
          label: knopf instanceof HTMLElement ? (knopf.getAttribute('aria-label') ?? '') : '',
          back: Boolean(hit?.closest('[data-back-to-top]')),
          next: Boolean(hit?.closest('[data-plan-tag-naechster]')),
          prev: Boolean(hit?.closest('[data-plan-tag-vorher]')),
          nav: Boolean(hit?.closest('[data-shell-nav]')),
        }
      }
      const zurueck = document.querySelector('[data-back-to-top]')
      const nav = document.querySelector('[data-shell-nav]')
      return {
        scroll: Math.round(window.scrollY),
        tag: (document.querySelector('[data-plan-tag-zaehler]')?.textContent ?? '').replace(/\s+/g, ' ').trim(),
        flow: nav?.getAttribute('data-flow') ?? '',
        shell: nav?.getAttribute('data-shell-nav') ?? '',
        navDisplay: getComputedStyle(document.querySelector('.workspace-mobile-navigation') ?? document.documentElement).display,
        backDisplay: zurueck instanceof HTMLElement ? getComputedStyle(zurueck).display : '',
        next: kasten(document.querySelector('[data-plan-tag-naechster]')),
        prev: kasten(document.querySelector('[data-plan-tag-vorher]')),
        back: kasten(zurueck),
        nav: kasten(nav),
        hitNext: treffen(document.querySelector('[data-plan-tag-naechster]')),
        hitBack: treffen(zurueck),
      }
    })
    const fokusPruefen = () => page.evaluate(() => {
      const el = document.querySelector('[data-back-to-top]')
      if (!(el instanceof HTMLElement)) return { rects: 0, fokus: false, display: '' }
      const vorher = document.activeElement
      el.focus()
      const fokus = document.activeElement === el
      if (fokus && vorher instanceof HTMLElement && vorher !== el) vorher.focus()
      return { rects: el.getClientRects().length, fokus, display: getComputedStyle(el).display }
    })
    const aufKollision = async (breite: number, hoehe: number) => {
      await page.setViewportSize({ width: breite, height: hoehe })
      await page.waitForSelector('[data-shell-nav="flow"]')
      const top = await page.evaluate(() => {
        const next = document.querySelector('[data-plan-tag-naechster]')
        if (!(next instanceof HTMLElement)) return null
        const r = next.getBoundingClientRect()
        const docY = r.top + window.scrollY + r.height / 2
        const offset = parseFloat(getComputedStyle(document.documentElement).getPropertyValue('--ux-u1a-nav-offset')) || 0
        const rem = parseFloat(getComputedStyle(document.documentElement).fontSize) || 16
        return Math.round(docY - (window.innerHeight - (offset + 1.5 * rem) - 22))
      })
      assert.ok(top != null && top > 400, `${breite}x${hoehe} alignment ${top}`)
      await wartenAufScroll(top)
      const stil = await page.addStyleTag({ content: '.workspace-page [data-back-to-top] { display: flex !important; }' })
      await page.waitForFunction(() => {
        const el = document.querySelector('[data-back-to-top]')
        return el instanceof HTMLElement && getComputedStyle(el).display !== 'none' && el.getClientRects().length > 0
      })
      const delta = await page.evaluate(() => {
        const next = document.querySelector('[data-plan-tag-naechster]')
        const back = document.querySelector('[data-back-to-top]')
        if (!(next instanceof HTMLElement) || !(back instanceof HTMLElement)) return 0
        const n = next.getBoundingClientRect()
        const b = back.getBoundingClientRect()
        return (n.top + n.height / 2) - (b.top + b.height / 2)
      })
      if (Math.abs(delta) > 2) await wartenAufScroll(Math.round(top + delta))
      const alt = await lage()
      assert.equal(alt.flow, 'true', JSON.stringify(alt))
      assert.equal(alt.hitNext?.back, true, JSON.stringify(alt))
      assert.ok(alt.scroll > 400 && alt.back && alt.next && alt.hitNext, JSON.stringify(alt))
      assert.ok(
        alt.hitNext.x >= alt.back.x && alt.hitNext.x <= alt.back.x + alt.back.w
          && alt.hitNext.y >= alt.back.y && alt.hitNext.y <= alt.back.y + alt.back.h,
        JSON.stringify(alt),
      )
      await stil.evaluate((el) => { if (el instanceof Element) el.remove() })
      await page.waitForFunction(() => {
        const el = document.querySelector('[data-back-to-top]')
        return el instanceof HTMLElement && getComputedStyle(el).display === 'none' && el.getClientRects().length === 0
      })
      const neu = await lage()
      assert.ok(Math.abs(neu.scroll - alt.scroll) <= 1, JSON.stringify({ alt, neu }))
      assert.equal(neu.hitNext?.next, true, JSON.stringify(neu))
      assert.equal(neu.hitNext?.back, false, JSON.stringify(neu))
      assert.equal(neu.backDisplay, 'none')
      const tastatur = await fokusPruefen()
      assert.equal(tastatur.fokus, false, JSON.stringify(tastatur))
      assert.equal(tastatur.rects, 0)
      assert.ok(neu.hitNext)
      const vorherScroll = neu.scroll
      await page.mouse.click(neu.hitNext.x, neu.hitNext.y)
      await page.waitForFunction(() => (document.querySelector('[data-plan-tag-zaehler]')?.textContent ?? '').includes('Tag 12'))
      const nach = await lage()
      assert.match(nach.tag, /Tag 12/)
      assert.notEqual(nach.scroll, 0, JSON.stringify({ vorherScroll, nach }))
      const vorher = await page.evaluate(() => {
        const el = document.querySelector('[data-plan-tag-vorher]')
        if (!(el instanceof HTMLElement)) return null
        const r = el.getBoundingClientRect()
        if (r.top < 8 || r.bottom > window.innerHeight - 8) {
          window.scrollTo(0, Math.max(0, r.top + window.scrollY - window.innerHeight * 0.3))
        }
        const box = el.getBoundingClientRect()
        const x = box.left + box.width / 2
        const y = box.top + box.height / 2
        const hit = document.elementFromPoint(x, y)
        return {
          x, y, scroll: window.scrollY,
          prev: Boolean(hit?.closest('[data-plan-tag-vorher]')),
          back: Boolean(hit?.closest('[data-back-to-top]')),
        }
      })
      assert.ok(vorher?.prev && !vorher.back, JSON.stringify(vorher))
      await page.mouse.click(vorher.x, vorher.y)
      await page.waitForFunction(() => (document.querySelector('[data-plan-tag-zaehler]')?.textContent ?? '').includes('Tag 11'))
      return { alt, neu }
    }

    const protokoll: unknown[] = []
    for (const name of ['light', 'green'] as const) {
      await themaSetzen(name)
      for (const [breite, hoehe] of [[520, 290], [540, 300]] as const) {
        protokoll.push({ name, breite, hoehe, ...(await aufKollision(breite, hoehe)) })
      }
    }

    const kontrollen = async (breite: number, hoehe: number) => {
      await page.setViewportSize({ width: breite, height: hoehe })
      await page.waitForSelector('[data-shell-nav="bottom"]')
      await wartenAufScroll(640)
      const stand = await lage()
      assert.equal(stand.flow, 'false', JSON.stringify(stand))
      assert.equal(stand.backDisplay, 'flex', JSON.stringify(stand))
      assert.ok(stand.back && stand.back.rects > 0 && stand.hitNext?.next && !stand.hitNext.back && !stand.hitNext.nav, JSON.stringify(stand))
      assert.ok(stand.nav && stand.back.bottom <= stand.nav.y + 1, JSON.stringify(stand))
      await page.mouse.click(stand.hitNext.x, stand.hitNext.y)
      await page.waitForFunction(() => (document.querySelector('[data-plan-tag-zaehler]')?.textContent ?? '').includes('Tag 12'))
      const zurueck = await page.evaluate(() => {
        const el = document.querySelector('[data-plan-tag-vorher]')
        if (!(el instanceof HTMLElement)) return null
        const r = el.getBoundingClientRect()
        const x = r.left + r.width / 2
        const y = r.top + r.height / 2
        const hit = document.elementFromPoint(x, y)
        return { x, y, prev: Boolean(hit?.closest('[data-plan-tag-vorher]')), back: Boolean(hit?.closest('[data-back-to-top]')), nav: Boolean(hit?.closest('[data-shell-nav]')) }
      })
      assert.ok(zurueck?.prev && !zurueck.back && !zurueck.nav, JSON.stringify(zurueck))
      await page.mouse.click(zurueck.x, zurueck.y)
      await page.waitForFunction(() => (document.querySelector('[data-plan-tag-zaehler]')?.textContent ?? '').includes('Tag 11'))
      await wartenAufScroll(640)
      const knopf = await lage()
      assert.ok(knopf.hitBack?.back, JSON.stringify(knopf))
      await page.mouse.click(knopf.hitBack.x, knopf.hitBack.y)
      await page.waitForFunction(() => window.scrollY < 5)
      protokoll.push({ breite, hoehe, stand })
    }
    for (const name of ['light', 'green'] as const) {
      await themaSetzen(name)
      await kontrollen(540, 720)
      await kontrollen(390, 844)
    }

    await page.evaluate(() => { document.documentElement.style.fontSize = '' })
    await page.setViewportSize({ width: 520, height: 290 })
    await page.waitForSelector('[data-shell-nav="flow"]')
    await wartenAufScroll(640)
    const kurz = await lage()
    const kurzFokus = await fokusPruefen()
    assert.equal(kurz.backDisplay, 'none', JSON.stringify(kurz))
    assert.equal(kurzFokus.fokus, false)
    await page.setViewportSize({ width: 540, height: 720 })
    await page.waitForSelector('[data-shell-nav="bottom"]')
    await wartenAufScroll(640)
    const hoch = await lage()
    assert.equal(hoch.backDisplay, 'flex', JSON.stringify(hoch))
    assert.ok(hoch.hitBack?.back, JSON.stringify(hoch))
    await page.setViewportSize({ width: 520, height: 290 })
    await page.waitForSelector('[data-shell-nav="flow"]')
    const wiederKurz = await lage()
    const wiederFokus = await fokusPruefen()
    assert.equal(wiederKurz.backDisplay, 'none', JSON.stringify(wiederKurz))
    assert.equal(wiederFokus.rects, 0)
    assert.equal(wiederFokus.fokus, false)

    await page.setViewportSize({ width: 390, height: 844 })
    await page.evaluate(() => { document.documentElement.style.fontSize = '32px' })
    await page.waitForSelector('[data-shell-nav="flow"]')
    await wartenAufScroll(640)
    const gross = await lage()
    const grossFokus = await fokusPruefen()
    assert.equal(gross.flow, 'true')
    assert.equal(gross.backDisplay, 'none', `Root-Schrift 32px, keine Browservergrösserung ${JSON.stringify(gross)}`)
    assert.equal(grossFokus.fokus, false)
    assert.equal(grossFokus.rects, 0)
    await page.evaluate(() => { document.documentElement.style.fontSize = '' })

    await page.setViewportSize({ width: 1440, height: 290 })
    await page.waitForFunction(() => {
      const nav = document.querySelector('[data-shell-nav]')
      const mobile = document.querySelector('.workspace-mobile-navigation')
      return nav?.getAttribute('data-flow') === 'true' && mobile instanceof HTMLElement && getComputedStyle(mobile).display === 'none'
    })
    await wartenAufScroll(640)
    const desktopKurz = await lage()
    const desktopFokus = await fokusPruefen()
    assert.equal(desktopKurz.navDisplay, 'none', JSON.stringify(desktopKurz))
    assert.notEqual(desktopKurz.backDisplay, 'none', JSON.stringify(desktopKurz))
    assert.ok(desktopFokus.rects > 0 && desktopFokus.fokus, JSON.stringify(desktopFokus))
    await page.setViewportSize({ width: 1440, height: 900 })
    await page.waitForFunction(() => document.querySelector('[data-shell-nav]')?.getAttribute('data-shell-nav') === 'bottom')
    const desktopTop = await page.evaluate(() => {
      const el = document.querySelector('[data-plan-tag-naechster]')
      if (!(el instanceof HTMLElement)) return 640
      const r = el.getBoundingClientRect()
      return Math.round(Math.max(450, r.top + window.scrollY - window.innerHeight * 0.4))
    })
    await wartenAufScroll(desktopTop)
    const desktop = await lage()
    assert.equal(desktop.navDisplay, 'none')
    assert.equal(desktop.backDisplay, 'flex', JSON.stringify(desktop))
    assert.ok(desktop.hitNext?.next && !desktop.hitNext.back, JSON.stringify(desktop))

    assert.ok(protokoll.length >= 8)
    assert.deepEqual(fremd, [])
    await context.close()
  })

  test('keyboard return restores the originating visit and All Connections control', async () => {
    const leerzeichen = referenzReise()
    leerzeichen.days = leerzeichen.days.map((tag) => tag.id === 'day-11' ? { ...tag, id: 'day 11' } : tag)
    assert.equal(reiseLesen(leerzeichen)?.days.find((tag) => tag.dayIndex === 11)?.id, 'day 11')
    assert.equal(reiseLesen(referenzReise())?.days.find((tag) => tag.dayIndex === 11)?.id, 'day-11')

    const sperren = async (page: Page) => {
      const fremd: string[] = []
      await page.route('**/*', (route) => {
        const url = route.request().url()
        if (url.startsWith(origin) || url.startsWith('data:') || url.startsWith('blob:')) return route.continue()
        fremd.push(url)
        return route.abort()
      })
      return fremd
    }
    const besuchZurueck = async (page: Page, szene: string | null, tagId: string) => {
      await page.setViewportSize({ width: 390, height: 844 })
      await plan(page)
      if (szene) {
        await page.locator(`[data-u1c-szene="${szene}"]`).click()
        await page.waitForFunction((id) => (
          document.querySelector('[data-timeline-etappe="stage-kc"]')?.getAttribute('data-u1c-tage') ?? ''
        ).includes(id), tagId)
        if (!(await page.locator('[data-u1c-route]').isVisible())) await plan(page)
      }
      const lauf = page.locator('[data-u1c-lauf][data-timeline-etappe="stage-kc"]')
      await lauf.waitFor()
      const schluessel = await lauf.getAttribute('data-u1c-lauf')
      assert.ok(schluessel)
      assert.equal(schluessel.includes(tagId), false)
      await lauf.focus()
      await page.keyboard.press('Enter')
      await page.locator('[data-u1b-zur-route]').waitFor()
      const tagLesen = () => page.evaluate(() => new URL(location.href).searchParams.get('tag'))
      let aktuell = await tagLesen()
      for (let schritt = 0; schritt < 8 && aktuell !== tagId; schritt += 1) {
        await page.locator('[data-plan-tag-naechster]').focus()
        await page.keyboard.press('Enter')
        await page.waitForFunction((alt) => new URL(location.href).searchParams.get('tag') !== alt, aktuell)
        aktuell = await tagLesen()
      }
      assert.equal(aktuell, tagId)
      await page.locator('[data-u1b-zur-route]').focus()
      await page.keyboard.press('Enter')
      await page.waitForFunction((ziel) => document.activeElement?.getAttribute('data-u1c-lauf') === ziel, schluessel, { timeout: 1000 }).catch(() => undefined)
      const fokus = await page.evaluate((id) => {
        const el = document.activeElement
        const knopf = [...document.querySelectorAll('[data-u1c-lauf]')].find((knoten) => (knoten.getAttribute('data-u1c-tage') ?? '').split(' ').includes(id))
        const rect = knopf instanceof HTMLElement ? knopf.getBoundingClientRect() : null
        return {
          tag: el?.tagName ?? '',
          lauf: el instanceof HTMLElement ? el.getAttribute('data-u1c-lauf') : '',
          route: el instanceof HTMLElement && el.hasAttribute('data-u1b-route'),
          url: new URL(location.href).searchParams.get('tag'),
          liste: knopf?.getAttribute('data-u1c-tage') ?? '',
          rect: rect ? { w: rect.width, h: rect.height } : null,
          hidden: knopf?.closest('[hidden]') instanceof HTMLElement,
        }
      }, tagId)
      assert.equal(fokus.tag, 'BUTTON', JSON.stringify(fokus))
      assert.equal(fokus.route, false, JSON.stringify(fokus))
      assert.equal(fokus.lauf, schluessel, JSON.stringify(fokus))
    }

    const normal = await browser.newContext()
    const normalSeite = await normal.newPage()
    const normalNetz = await sperren(normalSeite)
    await normalSeite.goto(origin, { waitUntil: 'networkidle' })
    await besuchZurueck(normalSeite, null, 'day-11')
    assert.deepEqual(normalNetz, [])
    await normal.close()

    const space = await browser.newContext()
    const spaceSeite = await space.newPage()
    const spaceNetz = await sperren(spaceSeite)
    await spaceSeite.goto(origin, { waitUntil: 'networkidle' })
    await besuchZurueck(spaceSeite, 'leerzeichen', 'day 11')
    assert.deepEqual(spaceNetz, [])
    await space.close()

    const verbindung = async (seite: Page) => {
      await seite.setViewportSize({ width: 390, height: 844 })
      await plan(seite)
      const kante = seite.locator('[data-u1c-kante-id="connection:stage-bkk:stage-kc"]')
      await kante.press('Enter')
      const detail = seite.locator('[data-u1c-kante-detail]')
      await detail.waitFor()
      const occurrence = await detail.getAttribute('data-u1c-kante-detail')
      const tag = new URL(seite.url()).searchParams.get('tag')
      const kanteId = new URL(seite.url()).searchParams.get('kante')
      assert.ok(occurrence && tag && kanteId)
      const knopf = seite.locator('[data-u1c-alle-verbindungen]')
      const handle = await knopf.elementHandle()
      assert.ok(handle)
      await knopf.focus()
      assert.equal(await handle.evaluate((el) => el.isConnected && el.getClientRects().length > 0 && document.activeElement === el), true)
      await knopf.press('Enter')
      await seite.getByRole('button', { name: 'Zum Tagesplan' }).waitFor()
      assert.equal(await handle.evaluate((el) => el.isConnected), false)
      return { handle, occurrence, tag, kanteId }
    }
    const rueckkehr = async (seite: Page, erwartet: { tag: string, kanteId: string, occurrence: string }) => {
      await seite.getByRole('button', { name: 'Zum Tagesplan' }).press('Enter')
      await seite.waitForFunction((ziel) => {
        const url = new URL(location.href)
        return url.searchParams.get('tag') === ziel.tag && url.searchParams.get('kante') === ziel.kanteId
      }, { tag: erwartet.tag, kanteId: erwartet.kanteId })
    }

    const mobil = await browser.newContext()
    const mobilSeite = await mobil.newPage()
    const mobilNetz = await sperren(mobilSeite)
    await mobilSeite.goto(origin, { waitUntil: 'networkidle' })
    const ausloeser = await verbindung(mobilSeite)
    await rueckkehr(mobilSeite, ausloeser)
    assert.equal(await ausloeser.handle.evaluate((el) => el.isConnected), false)
    const wieder = await mobilSeite.evaluate((occurrence) => {
      const aktiv = document.activeElement
      const detail = [...document.querySelectorAll('[data-u1c-kante-detail]')].find((el) => el.getAttribute('data-u1c-kante-detail') === occurrence)
      const knopf = detail?.querySelector('[data-u1c-alle-verbindungen]')
      return {
        gleicherKnoten: aktiv === knopf,
        verbunden: knopf instanceof HTMLElement && knopf.isConnected,
        sichtbar: knopf instanceof HTMLElement && knopf.getClientRects().length > 0,
        name: aktiv instanceof HTMLElement ? (aktiv.textContent ?? '').replace(/\s+/g, ' ').trim() : '',
        ueberschrift: aktiv instanceof HTMLElement && aktiv.id === 'workspace-plan-titel',
      }
    }, ausloeser.occurrence)
    assert.equal(wieder.gleicherKnoten, true, JSON.stringify(wieder))
    assert.equal(wieder.verbunden, true)
    assert.equal(wieder.sichtbar, true)
    assert.equal(wieder.ueberschrift, false)
    assert.match(wieder.name, /Alle Verbindungen öffnen/)
    assert.deepEqual(mobilNetz, [])
    await mobil.close()

    const fallback = await browser.newContext()
    const fallbackSeite = await fallback.newPage()
    const fallbackNetz = await sperren(fallbackSeite)
    await fallbackSeite.goto(origin, { waitUntil: 'networkidle' })
    const alt = await verbindung(fallbackSeite)
    await fallbackSeite.locator('[data-u1c-etappe-weg]').click()
    await rueckkehr(fallbackSeite, alt)
    const ausweich = await fallbackSeite.evaluate(() => {
      const aktiv = document.activeElement
      return {
        id: aktiv instanceof HTMLElement ? aktiv.id : '',
        verbindung: aktiv instanceof HTMLElement && aktiv.hasAttribute('data-u1c-alle-verbindungen'),
      }
    })
    assert.equal(ausweich.verbindung, false, JSON.stringify(ausweich))
    assert.equal(ausweich.id, 'workspace-plan-titel', JSON.stringify(ausweich))
    assert.deepEqual(fallbackNetz, [])
    await fallback.close()

    const ohneTag = await browser.newContext({ viewport: { width: 390, height: 844 } })
    const ohneSeite = await ohneTag.newPage()
    const ohneNetz = await sperren(ohneSeite)
    const kanteId = 'connection:stage-bkk:stage-kc'
    await ohneSeite.goto(`${origin}/?ansicht=plan&kante=${encodeURIComponent(kanteId)}`, { waitUntil: 'networkidle' })
    const detail = ohneSeite.locator('[data-u1c-kante-detail]')
    await detail.waitFor()
    assert.equal(new URL(ohneSeite.url()).searchParams.has('tag'), false)
    assert.equal(new URL(ohneSeite.url()).searchParams.get('kante'), kanteId)
    const occurrence = await detail.getAttribute('data-u1c-kante-detail')
    assert.ok(occurrence)
    const knopf = ohneSeite.locator('[data-u1c-alle-verbindungen]')
    const handle = await knopf.elementHandle()
    assert.ok(handle)
    await knopf.focus()
    assert.equal(await handle.evaluate((el) => el.isConnected && document.activeElement === el), true)
    await knopf.press('Enter')
    await ohneSeite.getByRole('button', { name: 'Zum Tagesplan' }).waitFor()
    assert.equal(await handle.evaluate((el) => el.isConnected), false)
    await ohneSeite.getByRole('button', { name: 'Zum Tagesplan' }).press('Enter')
    await ohneSeite.waitForFunction((id) => {
      const url = new URL(location.href)
      return !url.searchParams.has('tag') && url.searchParams.get('kante') === id
    }, kanteId)
    await ohneSeite.waitForFunction((key) => {
      const aktiv = document.activeElement
      const ziel = [...document.querySelectorAll('[data-u1c-kante-detail]')]
        .find((el) => el.getAttribute('data-u1c-kante-detail') === key)
        ?.querySelector('[data-u1c-alle-verbindungen]')
      if (!(aktiv instanceof HTMLElement) || aktiv !== ziel) return false
      const rechteck = aktiv.getBoundingClientRect()
      return aktiv.getClientRects().length > 0 && rechteck.bottom > 0 && rechteck.top < window.innerHeight
    }, occurrence)
    const ohneFokus = await ohneSeite.evaluate((key) => {
      const aktiv = document.activeElement
      const ziel = [...document.querySelectorAll('[data-u1c-kante-detail]')]
        .find((el) => el.getAttribute('data-u1c-kante-detail') === key)
        ?.querySelector('[data-u1c-alle-verbindungen]')
      const url = new URL(location.href)
      return {
        gleicherKnoten: aktiv === ziel,
        tag: url.searchParams.has('tag'),
        kante: url.searchParams.get('kante'),
      }
    }, occurrence)
    assert.equal(await handle.evaluate((el) => el.isConnected), false)
    assert.equal(ohneFokus.gleicherKnoten, true, JSON.stringify(ohneFokus))
    assert.equal(ohneFokus.tag, false)
    assert.equal(ohneFokus.kante, kanteId)
    assert.deepEqual(ohneNetz, [])
    await ohneTag.close()
  })
})
