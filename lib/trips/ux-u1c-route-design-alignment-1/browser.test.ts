import assert from 'node:assert/strict'
import { createRequire } from 'node:module'
import { createServer, type Server } from 'node:http'
import { mkdirSync, mkdtempSync, readFileSync } from 'node:fs'
import { tmpdir } from 'node:os'
import { join } from 'node:path'
import { after, before, describe, test } from 'node:test'
import type { AddressInfo } from 'node:net'

import * as esbuild from 'esbuild'
import { chromium, type Browser, type Page } from 'playwright'

import { mountU1cEvidence } from '@/lib/trips/ux-u1c-route-design-alignment-1/evidence-harness'

test('the evidence harness stays on the test import path', () => {
  assert.equal(typeof mountU1cEvidence, 'function')
})

const BILDER = process.env.U1C_EVIDENCE_DIR || join(tmpdir(), 'u1c-route-evidence')

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
    entryPoints: ['lib/trips/ux-u1c-route-design-alignment-1/evidence-harness.tsx'],
    bundle: true,
    write: false,
    format: 'iife',
    platform: 'browser',
    jsx: 'automatic',
    outfile: join(mkdtempSync(join(tmpdir(), 'u1c-evidence-')), 'harness.js'),
    define: { 'process.env.NODE_ENV': '"production"' },
    banner: { js: 'var __name=(target)=>target;globalThis.process=globalThis.process||{env:{NODE_ENV:"production"}};globalThis.global=globalThis;' },
    plugins: [
      {
        name: 'u1c-shims',
        setup(build) {
          build.onResolve({ filter: /^server-only$/ }, () => ({ path: 'server-only', namespace: 'u1c-leer' }))
          build.onResolve({ filter: /^next\// }, (args) => ({ path: args.path, namespace: 'u1c-leer' }))
          build.onResolve({ filter: /^@\// }, (args) => build.resolve(join(process.cwd(), args.path.slice(2)), {
            resolveDir: process.cwd(),
            kind: args.kind,
          }))
          build.onLoad({ filter: /.*/, namespace: 'u1c-leer' }, () => ({
            contents: 'export default function(){return null};export const useRouter=()=>({push(){},replace(){}});export const usePathname=()=>"/";export const useSearchParams=()=>new URLSearchParams();',
            loader: 'js',
          }))
        },
      },
    ],
  })
  const js = gebaut.outputFiles[0]?.text
  if (!js) throw new Error('u1c evidence bundle was empty')
  return js
}

function html(css: string, js: string) {
  return `<!doctype html><html><head><meta charset="utf-8" /><style>${css}</style></head><body><div id="root"></div><script>${js}</script></body></html>`
}

async function schuss(page: Page, name: string) {
  mkdirSync(BILDER, { recursive: true })
  await page.screenshot({ path: join(BILDER, name), fullPage: false })
}

describe('compact route evidence', { timeout: 180_000 }, () => {
  let browser: Browser
  let server: Server
  let origin: string

  before(async () => {
    const css = await projektCss()
    const js = await bundeln()
    const dokument = html(css, js)
    server = createServer((req, res) => {
      res.writeHead(200, { 'content-type': 'text/html; charset=utf-8', 'cache-control': 'no-store' })
      res.end(dokument)
    })
    await new Promise<void>((resolve) => server.listen(0, '127.0.0.1', resolve))
    const adresse = server.address() as AddressInfo
    origin = `http://127.0.0.1:${adresse.port}`
    try {
      browser = await chromium.launch({ headless: true, args: ['--no-sandbox', '--disable-dev-shm-usage'] })
    } catch (fehler) {
      const meldung = fehler instanceof Error ? fehler.message : String(fehler)
      if (!meldung.includes("Executable doesn't exist")) throw fehler
      browser = await chromium.launch({ headless: true, channel: 'chrome', args: ['--no-sandbox', '--disable-dev-shm-usage'] })
    }
  })

  after(async () => {
    await browser?.close()
    if (server) await new Promise<void>((resolve, reject) => server.close((fehler) => (fehler ? reject(fehler) : resolve())))
  })

  test('desktop and mobile route stay compact and the back control clears the fixed nav', async () => {
    const desktop = await browser.newPage({ viewport: { width: 1440, height: 900 } })
    const netz: string[] = []
    desktop.on('request', (request) => {
      if (request.resourceType() === 'fetch' || request.resourceType() === 'xhr') netz.push(request.url())
    })
    await desktop.goto(origin, { waitUntil: 'networkidle' })
    await desktop.waitForSelector('[data-u1c-route]')
    const namen = await desktop.locator('[data-plan-lauf-name]').allInnerTexts()
    assert.deepEqual(namen, [
      'Noch keinem Ziel zugeordnet',
      'Bangkok',
      'Ko Chang',
      'Phuket',
      'Noch keinem Ziel zugeordnet',
    ])
    const titel = await desktop.locator('[data-u1c-kante]').allInnerTexts()
    assert.equal(titel.some((text) => text.includes('Bangkok → Ko Chang')), true)
    assert.equal(titel.some((text) => text.includes('Ko Chang → Phuket')), true)
    assert.equal(titel.some((text) => text.includes('Hinreise') || text.includes('Rückreise')), false)
    assert.equal(await desktop.locator('[data-timeline-tag]').count(), 1)
    await schuss(desktop, 'u1c-after-desktop-1440.png')
    await desktop.locator('[data-u1c-lauf][data-u1c-tage~="day-3"]').click()
    await desktop.waitForSelector('[data-timeline-tag="day-3"]')
    const tage = await desktop.locator('[data-u1c-tage] [data-timeline-tag]').count()
    assert.equal(tage, 7)
    const overflow = await desktop.evaluate(() => document.documentElement.scrollWidth <= document.documentElement.clientWidth + 1)
    assert.equal(overflow, true)
    assert.deepEqual(netz, [])
    await desktop.close()

    const phone = await browser.newPage({ viewport: { width: 390, height: 844 } })
    await phone.goto(origin, { waitUntil: 'networkidle' })
    await phone.waitForSelector('[data-shell-nav="bottom"]')
    await schuss(phone, 'u1c-after-mobile-390.png')
    await phone.evaluate(() => window.scrollTo(0, 700))
    await phone.waitForFunction(() => {
      const knopf = document.querySelector('button[aria-label="Nach oben"]')
      return knopf instanceof HTMLElement && !knopf.classList.contains('invisible')
    })
    const treffer = await phone.evaluate(() => {
      const knopf = document.querySelector('button[aria-label="Nach oben"]')
      const nav = document.querySelector('[data-shell-nav="bottom"]')
      if (!(knopf instanceof HTMLElement) || !(nav instanceof HTMLElement)) return null
      const k = knopf.getBoundingClientRect()
      const n = nav.getBoundingClientRect()
      const overlap = !(k.bottom <= n.top || k.top >= n.bottom || k.right <= n.left || k.left >= n.right)
      const mitte = document.elementFromPoint(k.left + k.width / 2, k.top + k.height / 2)
      const navMitte = document.elementFromPoint(n.left + 24, Math.min(n.bottom - 4, n.top + n.height / 2))
      return {
        overlap,
        knopf: mitte === knopf || (mitte instanceof Node && knopf.contains(mitte)),
        nav: navMitte === nav || (navMitte instanceof Node && nav.contains(navMitte)),
        k: { x: k.x, y: k.y, w: k.width, h: k.height },
        n: { x: n.x, y: n.y, w: n.width, h: n.height },
      }
    })
    assert.equal(treffer?.overlap, false, JSON.stringify(treffer))
    assert.equal(treffer?.knopf, true, JSON.stringify(treffer))
    assert.equal(treffer?.nav, true, JSON.stringify(treffer))
    await schuss(phone, 'u1c-after-mobile-390-scrolled.png')
    await phone.locator('[data-u1c-root32]').click()
    await phone.waitForSelector('[data-u1c-schrift="32"]')
    await phone.waitForSelector('[data-shell-nav="flow"]')
    const methode = await phone.locator('[data-u1c-methode]').innerText()
    assert.match(methode, /Root-Schrift 32px/)
    assert.match(methode, /keine Browservergrösserung/)
    await schuss(phone, 'u1c-after-mobile-390-root32.png')
    await phone.close()
  })
})
