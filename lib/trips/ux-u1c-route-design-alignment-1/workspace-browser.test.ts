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
        build.onResolve({ filter: /^server-only$/ }, () => ({ path: 'server-only', namespace: 'u1c-leer' }))
        build.onResolve({ filter: /^next\// }, (args) => ({ path: args.path, namespace: 'u1c-leer' }))
        build.onResolve({ filter: /^@\// }, (args) => build.resolve(join(process.cwd(), args.path.slice(2)), { resolveDir: process.cwd(), kind: args.kind }))
        build.onLoad({ filter: /.*/, namespace: 'u1c-leer' }, () => ({
          contents: 'export default function(){return null};export const useRouter=()=>({push(){},replace(){}});export const usePathname=()=>"/";export const useSearchParams=()=>new URLSearchParams();',
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
  return `<!doctype html><html><head><meta charset="utf-8" /><style>${css}</style></head><body><div id="root"></div><script>${js}</script></body></html>`
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
  await page.getByRole('button', { name: 'Reiseplan', exact: true }).click()
  const route = page.locator('[data-u1c-route]')
  if (!(await route.isVisible())) {
    const zurueck = page.locator('[data-u1b-zur-route]')
    if (await zurueck.isVisible()) await zurueck.click()
  }
  await route.waitFor({ state: 'visible' })
}

describe('mounted workspace route contract', { timeout: 180_000 }, () => {
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
    })
    const sichtbar = await page.locator(':focus').boundingBox()
    assert.ok(sichtbar && sichtbar.width >= 44 && sichtbar.height >= 44 && sichtbar.y >= 0 && sichtbar.y + sichtbar.height <= 844)
    assert.deepEqual(netz, [])
    await page.close()
  })
})
