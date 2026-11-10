import { atlasServerActions } from '@/scripts/trip-plan-browser/server-actions'
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
    plugins: [atlasServerActions, {
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

async function tagWaehlen(page: Page, id: string) {
  const tage = page.locator('.et-days')
  if (!await tage.isVisible()) {
    await page.locator('[data-u1c-lauf][data-u1c-tage~="'+id+'"]').first().click()
    await page.locator('.et-tabs').getByRole('button', { name: 'Tagesplan' }).click()
  }
  await tage.locator('[data-timeline-tag="'+id+'"]').click()
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
    const dokument = html(css + '\n' + readFileSync('components/trips/reiseplan/etappen.css', 'utf8'), js)
    server = createServer((req, res) => {
      const file = ['/images/reiseatlas/laender.json','/images/reiseatlas/world.webp','/images/reiseatlas/asia.webp'].find(path => req.url === path)
      if (file) {
        res.setHeader('Content-Type', file.endsWith('.json') ? 'application/json' : 'image/webp')
        res.end(readFileSync('public'+file))
        return
      }
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
      if ((request.resourceType() === 'fetch' || request.resourceType() === 'xhr') && !request.url().startsWith(origin + '/images/reiseatlas/')) netz.push(request.url())
    })
    await page.goto(`${origin}/${search}`, { waitUntil: 'networkidle' })
    await page.waitForSelector('[data-tagesplan-modul="ein"]')
    return { page, netz }
  }

  test('Reiseatlas: echter Tageslink, Tastatur-Rückkehr, Verlauf, mobiler Kartenwechsel und gebundener Editor', async () => {
    const { page, netz } = await offen(390, 844, '?ansicht=plan&tag=day-11&foreign=1#marke')
    try {
      const atlas = page.locator('[data-trip-atlas]')
      await atlas.getByRole('button', {name: 'Punkt hinzufügen',exact:true}).waitFor()
      const selected = atlas.locator('.et-days [aria-pressed="true"]')
      assert.equal(await selected.getAttribute('data-timeline-tag'), 'day-11')
      await atlas.getByRole('button',{name:'Alle Etappen',exact:true}).focus()
      await page.keyboard.press('Enter')
      await page.waitForFunction(() => !new URL(location.href).searchParams.has('tag') && document.activeElement?.matches('[data-u1c-lauf]'))
      assert.equal(new URL(page.url()).hash,'#marke')
      assert.equal(new URL(page.url()).searchParams.get('foreign'),'1')
      await atlas.locator('.et-mobile-tabs').getByRole('button',{name:'Karte'}).click()
      assert(await atlas.locator('.et-map').isVisible())
      await atlas.locator('.et-mobile-tabs').getByRole('button',{name:'Reiseplan'}).click()
      await page.goBack()
      await page.waitForFunction(() => new URL(location.href).searchParams.get('tag') === 'day-11')
      await atlas.locator('.et-tabs').getByRole('button',{name:'Tagesplan'}).click()
      await atlas.getByRole('button',{name:'Punkt hinzufügen',exact:true}).click()
      const input = page.getByLabel('Ort oder Aktivität')
      await input.fill('Mein Entwurf für Tag elf')
      await page.locator('[data-u1b-anlegen-halten]').click()
      await atlas.getByRole('button',{name:'Speichern',exact:true}).click()
      await page.waitForFunction(() => document.querySelector('form[aria-label="Punkt hinzufügen"]')?.getAttribute('aria-busy')==='true')
      await modus(page,'Übersicht')
      await page.setViewportSize({width:1280,height:800})
      assert.equal(await input.inputValue(),'Mein Entwurf für Tag elf')
      await modus(page,'Reiseplan')
      assert.equal(await input.inputValue(),'Mein Entwurf für Tag elf')
      assert.deepEqual(await page.evaluate(()=> (window as unknown as {__u1b:{writes:string[]}}).__u1b.writes),['day-11:Mein Entwurf für Tag elf'])
      assert.deepEqual(netz,[])
    } finally {await page.close()}
  })

  test('Etappenliste, Tageswechsel und Punktdetails führen zur richtigen Tages- und Etappenkennung', async () => {
    const { page } = await offen(390, 844)
    try {
      assert.equal(await page.locator('.et-days').count(), 0)
      await tagWaehlen(page, 'day-11')
      assert.equal(new URL(page.url()).searchParams.get('tag'), 'day-11')
      await page.locator('[data-plan-punkt="stay-11"] button').first().click()
      await page.locator('[data-detail-item="stay-11"]').waitFor()
      assert.equal(new URL(page.url()).searchParams.get('punkt'), 'stay-11')
      await page.goBack()
      await page.waitForFunction(() => !new URL(location.href).searchParams.has('punkt'))
      await page.goForward()
      await page.locator('[data-detail-item="stay-11"]').waitFor()
    } finally { await page.close() }
  })

  test('Der Etappenatlas zeigt Tagesplan und Karte am Desktop neben- und auf dem Handy nacheinander', async () => {
    const { page, netz } = await offen(1440, 900)
    try {
      const trip = page.locator('[data-trip-atlas]')
      await trip.locator('.et-map').waitFor()
      const [left,right] = await Promise.all([trip.locator('.et-panel').boundingBox(),trip.locator('.et-map').boundingBox()])
      assert.ok(left && right && left.x + left.width <= right.x)
      const sizes = [[280,16],[320,16],[390,32],[768,16],[1440,32]]
      for (const [width,root] of sizes) {
        await page.setViewportSize({width,height:850})
        await page.evaluate(size => document.documentElement.style.fontSize=size+'px',root)
        const tooWide = await trip.evaluate(el => el.scrollWidth > el.clientWidth + 1)
        assert.equal(tooWide,false,'Atlas overflow at '+width+'/'+root)
        if (width<=768) {
          await trip.locator('.et-mobile-tabs').getByRole('button',{name:'Karte'}).click()
          assert.equal(await trip.locator('.et-panel').isVisible(),false)
          await trip.locator('.et-mobile-tabs').getByRole('button',{name:'Reiseplan'}).click()
          assert.equal(await trip.locator('.et-map').isVisible(),false)
        }
      }
      assert.deepEqual(netz,[])
    } finally {await page.close()}
  })

  test('Entwurf auf explizitem Tag bleibt bei Zurück zur Etappenliste, Bereichswechsel und Fehler gebunden', async () => {
    const { page } = await offen(390, 844,'?ansicht=plan&tag=day-11')
    try {
      const add = page.getByRole('button',{name:'Punkt hinzufügen',exact:true})
      await add.click()
      const form=page.locator('form[aria-label="Punkt hinzufügen"]')
      await form.getByLabel('Ort oder Aktivität').fill('Lokaler Tagesentwurf')
      await page.locator('[data-u1b-anlegen-halten]').click()
      await form.getByRole('button',{name:'Speichern',exact:true}).click()
      await page.waitForFunction(()=>document.querySelector('form[aria-busy="true"]'))
      await page.getByRole('button',{name:'Alle Etappen',exact:true}).click()
      assert.equal(await form.isVisible(),false)
      assert.equal(await form.getByLabel('Ort oder Aktivität').inputValue(),'Lokaler Tagesentwurf')
      await page.setViewportSize({width:1440,height:900})
      await modus(page,'Übersicht')
      await page.locator('[data-u1b-anlegen-fehler]').click()
      await modus(page,'Reiseplan')
      await tagWaehlen(page,'day-11')
      assert.equal(await form.getByLabel('Ort oder Aktivität').inputValue(),'Lokaler Tagesentwurf')
      assert.deepEqual(await page.evaluate(()=>window.__u1b?.writes),['day-11:Lokaler Tagesentwurf'])
      await form.getByRole('alert').waitFor()
    } finally {await page.close()}
  })

  test('Tagfreie Adresse öffnet die Etappenliste; erster Tag wird erst durch Auswahl bearbeitet', async () => {
    const {page}=await offen(1440,900)
    try {
      assert.equal(await page.getByRole('button',{name:'Punkt hinzufügen',exact:true}).count(),0)
      await tagWaehlen(page,'day-1')
      await page.getByRole('button',{name:'Punkt hinzufügen',exact:true}).click()
      const form=page.locator('form[aria-label="Punkt hinzufügen"]')
      await form.getByLabel('Ort oder Aktivität').fill('Erster Reisetag')
      await form.getByRole('button',{name:'Speichern',exact:true}).click()
      await page.waitForFunction(()=>window.__u1b?.writes[0] === 'day-1:Erster Reisetag')
      await page.getByRole('button',{name:'Alle Etappen',exact:true}).click()
      await page.reload()
      await page.locator('[data-u1c-route]').waitFor()
      assert.equal(await page.locator('[aria-current="date"]').count(),0)
      assert.equal(new URL(page.url()).searchParams.has('tag'),false)
    } finally {await page.close()}
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

})
