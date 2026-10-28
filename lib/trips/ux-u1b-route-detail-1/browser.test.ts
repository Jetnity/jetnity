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

import { mountUxU1bHarness } from '@/lib/trips/ux-u1b-route-detail-1/harness'

test('the route harness stays on the test import path', () => {
  assert.equal(typeof mountUxU1bHarness, 'function')
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
    entryPoints: ['lib/trips/ux-u1b-route-detail-1/harness.tsx'],
    bundle: true,
    write: false,
    format: 'iife',
    platform: 'browser',
    jsx: 'automatic',
    outfile: join(mkdtempSync(join(tmpdir(), 'ux-u1b-')), 'harness.js'),
    define: { 'process.env.NODE_ENV': '"production"' },
    banner: { js: 'var __name=(target)=>target;globalThis.process=globalThis.process||{env:{NODE_ENV:"production"}};globalThis.global=globalThis;' },
    plugins: [{
      name: 'u1b-shims',
      setup(build) {
        build.onResolve({ filter: /^server-only$/ }, () => ({ path: 'server-only', namespace: 'u1b-leer' }))
        build.onResolve({ filter: /^next\// }, (args) => ({ path: args.path, namespace: 'u1b-leer' }))
        build.onResolve({ filter: /^@\// }, (args) => build.resolve(join(process.cwd(), args.path.slice(2)), { resolveDir: process.cwd(), kind: args.kind }))
        build.onLoad({ filter: /.*/, namespace: 'u1b-leer' }, () => ({
          contents: 'export default function(){return null};export const useRouter=()=>({push(){},replace(){}});export const usePathname=()=>"/";export const useSearchParams=()=>new URLSearchParams();',
          loader: 'js',
        }))
      },
    }],
  })
  const js = gebaut.outputFiles[0]?.text
  if (!js) throw new Error('u1b harness bundle was empty')
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

async function sichtbar(page: Page, selektor: string) {
  return page.evaluate((wert) => {
    const el = document.querySelector(wert)
    return el instanceof HTMLElement && el.getClientRects().length > 0 && !el.closest('[hidden], [inert]')
  }, selektor)
}

async function modus(page: Page, name: string) {
  const knopf = page.getByRole('button', { name, exact: true }).filter({ visible: true }).first()
  await knopf.click()
}

describe('mounted route and detail', { timeout: 300_000 }, () => {
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
    await new Promise<void>((resolve) => server?.close(() => resolve()))
  })

  async function offen(width: number, height: number, search = '?ansicht=plan&foreign=1#marke') {
    const page = await browser.newPage({ viewport: { width, height } })
    const netz: string[] = []
    page.on('request', (request) => {
      if (request.resourceType() === 'fetch' || request.resourceType() === 'xhr') netz.push(request.url())
    })
    await page.goto(`${origin}/${search}`, { waitUntil: 'networkidle' })
    await page.waitForSelector('[data-tagesplan-modul="ein"]')
    return { page, netz }
  }

  test('390 zeigt zuerst die Route, Zur Route gilt für Tag und Punkt, derselbe Tag öffnet wieder', async () => {
    const { page, netz } = await offen(390, 844, '?ansicht=plan&foreign=1#marke')
    try {
      assert.equal(await sichtbar(page, '[data-u1b-route]'), true)
      assert.equal(await sichtbar(page, '[data-plan-tag-zaehler]'), false)
      assert.equal(page.url().includes('foreign=1'), true)
      assert.equal(page.url().includes('#marke'), true)
      await page.locator('[data-timeline-tag="day-11"]').filter({ visible: true }).click()
      await page.waitForSelector('[data-plan-tag-zaehler]')
      assert.equal(await sichtbar(page, '[data-u1b-route]'), false)
      assert.match(page.url(), /tag=day-11/)
      await page.getByRole('button', { name: 'Zur Route' }).click()
      assert.equal(await sichtbar(page, '[data-u1b-route]'), true)
      assert.match(page.url(), /tag=day-11/)
      assert.equal(await page.locator('[data-timeline-tag="day-11"][aria-current="date"]').filter({ visible: true }).count(), 1)
      await page.locator('[data-timeline-tag="day-11"]').filter({ visible: true }).click()
      assert.equal(await sichtbar(page, '[data-plan-tag-zaehler]'), true)
      assert.equal(await sichtbar(page, '[data-u1b-route]'), false)
      await page.locator('[data-plan-punkt="stay-11"] button').filter({ visible: true }).first().click()
      await page.waitForSelector('[data-workspace-detail]')
      assert.equal(await page.locator('[data-u1b-zur-route]').filter({ visible: true }).count(), 0)
      await page.getByRole('button', { name: 'Zur Route' }).click()
      assert.equal(await sichtbar(page, '[data-u1b-route]'), true)
      assert.match(page.url(), /punkt=stay-11/)
      await page.locator('[data-plan-punkt="note-ohne"] button[aria-expanded]').click()
      const elternNachher = await page.evaluate(() => {
        const stand = window.history.state?.jetnityWorkspace
        return stand && typeof stand === 'object' && 'elternUrl' in stand ? String(stand.elternUrl) : ''
      })
      assert.match(elternNachher, /tag=day-11/)
      assert.match(elternNachher, /punkt=stay-11/)
      assert.deepEqual(netz, [])
    } finally {
      await page.close()
    }
  })

  test('fehlender Punkt, Zurück, Vorwärts, Graph, direkte Adresse und neue Reise', async () => {
    const { page } = await offen(390, 844, '?ansicht=plan&tag=day-1&foreign=1#marke')
    try {
      await page.goto(`${origin}/?ansicht=plan&tag=day-11&punkt=stay-11&foreign=1#marke`)
      await page.waitForSelector('[data-workspace-detail]')
      await page.locator('[data-u1b-punkt-weg]').click()
      await page.waitForSelector('[data-u1b-hinweis="punkt-fehlt"]')
      assert.equal(page.url().includes('punkt=stay-11'), false)
      assert.match(page.url(), /tag=day-11/)
      assert.equal(await page.locator('[data-timeline-tag="day-11"][aria-current="date"]').first().getAttribute('data-timeline-tag'), 'day-11')
      assert.equal(await page.locator('[data-timeline-tag="day-1"][aria-current="date"]').count(), 0)
      await page.reload({ waitUntil: 'networkidle' })
      await page.waitForSelector('[data-u1b-hinweis="punkt-fehlt"]')
      await page.goBack()
      await page.waitForFunction(() => location.search.includes('tag=day-1') && !document.querySelector('[data-u1b-hinweis]'))
      await page.goForward()
      await page.waitForSelector('[data-u1b-hinweis="punkt-fehlt"]')
      await page.locator('[data-u1b-bump]').click()
      assert.equal(await page.locator('[data-u1b-hinweis="punkt-fehlt"]').count(), 1)
      await page.locator('[data-u1b-neue]').click()
      await page.waitForFunction(() => !document.querySelector('[data-u1b-hinweis]'))
    } finally {
      await page.close()
    }
  })

  test('ein entfernter Tag wird nicht zu Tag 1, ein verschobener Punkt bleibt derselbe Punkt', async () => {
    const { page } = await offen(390, 844, '?ansicht=plan&tag=day-2&foreign=1#marke')
    try {
      await page.locator('[data-u1b-tag-weg]').click()
      await page.waitForSelector('[data-u1b-hinweis="tag-fehlt"]')
      assert.equal(await page.locator('[aria-current="date"]').count(), 0)
      const writes = await page.evaluate(() => window.__u1b?.writes ?? [])
      assert.deepEqual(writes, [])
      await page.goto(`${origin}/?ansicht=plan&tag=day-11&punkt=stay-11&foreign=1#marke`)
      await page.waitForSelector('[data-workspace-detail]')
      await page.locator('[data-u1b-verschieben]').click()
      await page.waitForFunction(() => location.search.includes('tag=day-5') && location.search.includes('punkt=stay-11'))
      assert.equal(await page.locator('[data-u1b-hinweis]').count(), 0)
      assert.equal(await page.locator('[data-detail-item="stay-11"]').count(), 1)
    } finally {
      await page.close()
    }
  })

  test('1440 zeigt Route und ein Detail, 768 und Root 32 bleiben schmal, Spalten halten die Minima', async () => {
    const { page } = await offen(1440, 900)
    try {
      await page.locator('[data-timeline-tag="day-3"]').filter({ visible: true }).click()
      await page.waitForSelector('[data-u1b-anordnung="neben"]')
      const masse = await page.evaluate(() => {
        const route = document.querySelector('[data-u1b-route]')?.getBoundingClientRect()
        const tag = document.querySelector('[data-u1b-day]')?.getBoundingClientRect()
        const root = Number.parseFloat(getComputedStyle(document.documentElement).fontSize)
        return { route: route?.width ?? 0, tag: tag?.width ?? 0, luecke: route && tag ? tag.left - route.right : 0, root }
      })
      assert.ok(masse.route >= 20 * masse.root - 1)
      assert.ok(masse.tag >= 28 * masse.root - 1)
      assert.ok(masse.luecke >= 1.5 * masse.root - 1)
      assert.equal(await sichtbar(page, '[data-u1b-route]'), true)
      assert.equal(await sichtbar(page, '[data-u1b-day]'), true)
      await page.getByRole('button', { name: 'Zur Route' }).click()
      assert.equal(await sichtbar(page, '[data-u1b-day]'), true)
      const fokus = page.locator('[data-timeline-tag="day-3"]').filter({ visible: true })
      await fokus.focus()
      await page.setViewportSize({ width: 768, height: 1024 })
      await page.waitForSelector('[data-u1b-anordnung="schmal"]')
      const versteckt = await page.evaluate(() => {
        const aktiv = document.activeElement
        return !(aktiv instanceof HTMLElement) || !aktiv.closest('[hidden], [inert]')
      })
      assert.equal(versteckt, true)
      await page.evaluate(() => { document.documentElement.style.fontSize = '32px' })
      await page.setViewportSize({ width: 1440, height: 900 })
      await page.evaluate(() => new Promise((resolve) => requestAnimationFrame(() => requestAnimationFrame(() => resolve(undefined)))))
      assert.equal(await page.locator('[data-u1b-anordnung]').getAttribute('data-u1b-anordnung'), 'schmal')
    } finally {
      await page.close()
    }
  })

  test('die Suche bleibt ein Mount über Tabs, Resize und Zur Route', async () => {
    const { page, netz } = await offen(1440, 900, '?ansicht=plan&tag=day-3&foreign=1#marke')
    try {
      for (const [id, kind] of [['kind-flight', 'flight'], ['kind-stay', 'stay'], ['kind-activity', 'activity'], ['kind-transfer', 'transfer'], ['kind-rental', 'rental_car'], ['kind-note', 'note']] as const) {
        await page.locator(`[data-plan-punkt="${id}"] button`).first().click()
        await page.waitForSelector(`[data-item-kind="${kind}"]`)
        await page.keyboard.press('Escape')
        await page.waitForSelector('[data-plan-tag-kontext]')
      }
      await page.locator('[data-plan-punkt="kind-flight"] button').first().click()
      await page.getByRole('button', { name: 'Flug suchen' }).click()
      await page.waitForSelector('[data-u1b-suchprobe]')
      await page.locator('[data-u1b-suchprobe-holen]').click()
      for (const name of ['Übersicht', 'Reiseplan', 'Organisieren', 'Vorbereitung', 'Reiseplan']) await modus(page, name)
      await page.setViewportSize({ width: 390, height: 844 })
      await page.waitForSelector('[data-u1b-anordnung="schmal"]')
      await page.getByRole('button', { name: 'Zur Route' }).click()
      await page.setViewportSize({ width: 1440, height: 900 })
      const stand = await page.evaluate(() => window.__u1b)
      assert.equal(stand?.mounts, 1)
      assert.equal(stand?.unmounts, 0)
      assert.equal(stand?.requests, 1)
      assert.deepEqual(netz, [])
      const nav = await page.locator('[data-workspace-mode-nav]').first().evaluate((el) => getComputedStyle(el).position)
      assert.equal(nav === 'sticky' || nav === 'fixed', true)
    } finally {
      await page.close()
    }
  })

  test('ein offener Editor hält den Tab nicht auf und eine gleiche Breite oszilliert nicht', async () => {
    const { page } = await offen(1440, 900, '?ansicht=plan&tag=day-4&foreign=1#marke')
    try {
      await page.getByRole('button', { name: 'Punkt hinzufügen' }).click()
      await modus(page, 'Übersicht')
      assert.equal(page.url().includes('ansicht=plan'), false)
      assert.equal(page.url().includes('foreign=1'), true)
      assert.equal(await sichtbar(page, '[data-arbeitsbereich="uebersicht"]'), true)
      assert.equal(await sichtbar(page, '[data-plan-tag-kontext]'), false)
      const split = page.locator('[data-workspace-split]')
      await split.evaluate((el) => { (el as HTMLElement).style.width = `${49.5 * 16 - 2}px` })
      await page.waitForSelector('[data-u1b-anordnung="schmal"]')
      await split.evaluate((el) => { (el as HTMLElement).style.width = `${49.5 * 16}px` })
      await page.waitForTimeout(50)
      assert.equal(await split.getAttribute('data-u1b-anordnung'), 'schmal')
      await split.evaluate((el) => { (el as HTMLElement).style.width = `${50.5 * 16}px` })
      await page.waitForSelector('[data-u1b-anordnung="neben"]')
      await split.evaluate((el) => { (el as HTMLElement).style.width = `${49.5 * 16}px` })
      await page.waitForTimeout(50)
      assert.equal(await split.getAttribute('data-u1b-anordnung'), 'neben')
      await split.evaluate((el) => { (el as HTMLElement).style.width = `${49.5 * 16 - 2}px` })
      await page.waitForSelector('[data-u1b-anordnung="schmal"]')
    } finally {
      await page.close()
    }
  })

  test('Zurück auf die tag-freie Adresse zeigt nur die Punkte des angezeigten Tages', async () => {
    const { page } = await offen(1440, 900, '?ansicht=plan&foreign=1#marke')
    try {
      await page.locator('[data-timeline-tag="day-11"]').filter({ visible: true }).first().click()
      await page.waitForFunction(() => location.search.includes('tag=day-11'))
      await page.goBack()
      await page.waitForFunction(() => !new URL(location.href).searchParams.has('tag'))
      assert.match(await page.locator('[data-plan-tag-zaehler]').innerText(), /Tag 1 von/)
      const ids = await page.locator('[data-u1b-day] [data-plan-punkt]').evaluateAll((knoten) => knoten.map((el) => el.getAttribute('data-plan-punkt')))
      assert.deepEqual(ids.filter((id) => id === 'flight-out' || id === 'transfer-11' || id === 'stay-11'), ['flight-out'])
      const paar = await page.locator('[data-u1b-day] [data-plan-entfernen]').evaluateAll((knoten) => knoten.map((el) => el.getAttribute('data-plan-entfernen')))
      assert.deepEqual(paar.filter((wert) => wert?.endsWith('flight-out') || wert?.endsWith('transfer-11') || wert?.endsWith('stay-11')), ['day-1:flight-out'])
      await page.locator('[data-u1b-day] [data-plan-entfernen="day-1:flight-out"]').click()
      assert.deepEqual(await page.evaluate(() => window.__u1b?.writes ?? []), ['day-1:flight-out'])
      await page.goForward()
      await page.waitForFunction(() => location.search.includes('tag=day-11'))
      const nachVor = await page.locator('[data-u1b-day] [data-plan-punkt]').evaluateAll((knoten) => knoten.map((el) => el.getAttribute('data-plan-punkt')))
      assert.equal(nachVor.includes('transfer-11'), true)
      assert.equal(nachVor.includes('stay-11'), true)
      assert.equal(nachVor.includes('flight-out'), false)
    } finally {
      await page.close()
    }
  })

  test('Zur Route stellt die vorher sichtbare Routenposition wieder her', async () => {
    const { page } = await offen(390, 900, '?ansicht=plan&foreign=1#marke')
    try {
      await page.setViewportSize({ width: 390, height: 640 })
      const vorher = await page.evaluate(() => {
        document.documentElement.style.minHeight = '2400px'
        document.body.style.minHeight = '2400px'
        document.documentElement.style.scrollBehavior = 'auto'
        document.body.style.scrollBehavior = 'auto'
        const scroller = document.scrollingElement
        if (scroller) scroller.scrollTop = 480
        return {
          y: window.scrollY,
          top: scroller?.scrollTop ?? -1,
          hoehe: document.documentElement.scrollHeight,
          fenster: window.innerHeight,
          overflow: getComputedStyle(document.documentElement).overflowY,
        }
      })
      const startY = Math.max(vorher.y, vorher.top)
      assert.ok(startY > 200, `keine Routenposition ${JSON.stringify(vorher)}`)
      const tag20 = page.locator('[data-timeline-tag="day-20"]').filter({ visible: true }).first()
      await tag20.click()
      await page.evaluate(() => window.scrollTo(0, 0))
      await page.getByRole('button', { name: 'Zur Route' }).click()
      await page.waitForTimeout(100)
      const nachRoute = await page.evaluate(() => window.scrollY)
      assert.ok(Math.abs(nachRoute - startY) < 24, `day ${nachRoute} vs ${startY}`)
      await tag20.click()
      assert.equal(await sichtbar(page, '[data-u1b-route]'), false)
      await page.getByRole('button', { name: 'Zur Route' }).click()
      const tag11 = page.locator('[data-timeline-tag="day-11"]').filter({ visible: true }).first()
      await tag11.evaluate((el) => el.scrollIntoView({ block: 'center' }))
      const beiTag = await page.evaluate(() => window.scrollY)
      await tag11.click()
      await page.locator('[data-plan-punkt="stay-11"] button[aria-expanded]').click()
      await page.evaluate(() => window.scrollTo(0, 0))
      await page.getByRole('button', { name: 'Zur Route' }).click()
      const zurueck = await page.evaluate(() => window.scrollY)
      assert.ok(Math.abs(zurueck - beiTag) < 24, `item ${zurueck} vs ${beiTag}`)
      await page.locator('[data-timeline-tag="day-2"]').filter({ visible: true }).first().click()
      await page.locator('[data-u1b-tag-weg]').click()
      await page.getByRole('button', { name: 'Zur Route' }).click()
      const fokusRoute = await page.evaluate(() => document.activeElement?.closest('[data-u1b-route]') != null)
      assert.equal(fokusRoute, true)
      assert.equal(await page.locator('[aria-current="date"]').count(), 0)
      await page.setViewportSize({ width: 1440, height: 900 })
      await page.setViewportSize({ width: 390, height: 900 })
      await page.waitForFunction(() => document.querySelector('[data-u1b-anordnung]')?.getAttribute('data-u1b-anordnung') === 'schmal')
    } finally {
      await page.close()
    }
  })

  test('Route, Tag und Punkt bleiben in der Breite bei 280 bis 1440 und Root 32', async () => {
    const { page } = await offen(280, 900, '?ansicht=plan&foreign=1#marke')
    try {
      const breiten = [280, 320, 360, 390, 430, 768, 1440]
      for (const breite of breiten) {
        for (const schrift of [16, 32]) {
          await page.setViewportSize({ width: breite, height: 900 })
          await page.evaluate((px) => { document.documentElement.style.fontSize = `${px}px` }, schrift)
          await page.waitForTimeout(30)
          const zurRoute = page.getByRole('button', { name: 'Zur Route' }).filter({ visible: true })
          if (await zurRoute.count()) await zurRoute.first().click()
          const routeMessung = await page.evaluate(() => {
            const delta = document.documentElement.scrollWidth - document.documentElement.clientWidth
            let schuld = ''
            if (delta > 1) {
              for (const el of document.querySelectorAll('body *')) {
                if (!(el instanceof HTMLElement) || el.closest('[hidden]')) continue
                const rect = el.getBoundingClientRect()
                if (rect.width > 0 && rect.right > document.documentElement.clientWidth + 1) {
                  schuld = `${el.tagName} ${el.getAttribute('data-workspace-mode-nav') ?? ''} ${el.getAttribute('data-plan-etappe-sprung') ?? ''} ${el.className.toString().slice(0, 100)}`
                  break
                }
              }
            }
            return { delta, schuld }
          })
          assert.ok(routeMessung.delta <= 1, `route ${breite}/${schrift} +${routeMessung.delta} ${routeMessung.schuld}`)
          await page.locator('[data-timeline-tag="day-11"]').filter({ visible: true }).first().click()
          await page.waitForSelector('[data-plan-tag-zaehler]')
          const tagMessung = await page.evaluate(() => {
            const delta = document.documentElement.scrollWidth - document.documentElement.clientWidth
            let schuld = ''
            if (delta > 1) {
              for (const el of document.querySelectorAll('body *')) {
                if (!(el instanceof HTMLElement) || el.closest('[hidden]')) continue
                const rect = el.getBoundingClientRect()
                if (rect.width > 0 && rect.right > document.documentElement.clientWidth + 1) {
                  schuld = `${el.tagName} ${el.className.toString().slice(0, 140)}`
                  break
                }
              }
            }
            let weit = ''
            let weitDelta = 0
            for (const el of document.querySelectorAll('body *')) {
              if (!(el instanceof HTMLElement) || el.closest('[hidden]')) continue
              const ueber = el.scrollWidth - document.documentElement.clientWidth
              if (ueber <= 1) continue
              const kindUeber = [...el.children].some((kind) => kind instanceof HTMLElement && kind.scrollWidth - document.documentElement.clientWidth > 1)
              if (kindUeber) continue
              if (ueber > weitDelta) {
                weitDelta = ueber
                weit = `${el.tagName} ${el.getAttribute('aria-label') ?? ''} ${el.className.toString().slice(0, 140)}`
              }
            }
            return { delta, schuld, weit, weitDelta }
          })
          assert.ok(tagMessung.delta <= 1, `tag ${breite}/${schrift} +${tagMessung.delta} ${tagMessung.schuld} | ${tagMessung.weit} +${tagMessung.weitDelta}`)
          await page.locator('[data-plan-punkt="stay-11"] button[aria-expanded]').click()
          const punktMessung = await page.evaluate(() => {
            const client = document.documentElement.clientWidth
            const delta = document.documentElement.scrollWidth - client
            let weit = ''
            let weitDelta = 0
            for (const el of document.querySelectorAll('body *')) {
              if (!(el instanceof HTMLElement) || el.closest('[hidden]')) continue
              const rect = el.getBoundingClientRect()
              const ueber = Math.max(rect.right, rect.left + el.scrollWidth) - client
              if (ueber <= 1) continue
              const kindUeber = [...el.children].some((kind) => {
                if (!(kind instanceof HTMLElement) || kind.closest('[hidden]')) return false
                const kindRect = kind.getBoundingClientRect()
                return Math.max(kindRect.right, kindRect.left + kind.scrollWidth) - client > 1
              })
              if (kindUeber) continue
              if (ueber > weitDelta) {
                weitDelta = ueber
                weit = `${el.tagName} ${(el.textContent ?? '').trim().slice(0, 80)} ${el.className.toString().slice(0, 100)}`
              }
            }
            return { delta, weit, weitDelta }
          })
          assert.ok(punktMessung.delta <= 1, `punkt ${breite}/${schrift} +${punktMessung.delta} ${punktMessung.weit} +${punktMessung.weitDelta}`)
        }
      }
    } finally {
      await page.close()
    }
  })
})
