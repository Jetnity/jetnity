import assert from 'node:assert/strict'
import { createRequire } from 'node:module'
import { createServer, type Server } from 'node:http'
import { mkdirSync, readFileSync } from 'node:fs'
import { tmpdir } from 'node:os'
import { join } from 'node:path'
import { after, before, describe, test } from 'node:test'
import type { AddressInfo } from 'node:net'

import * as esbuild from 'esbuild'
import { chromium, type Browser, type Page } from 'playwright'

const BREITEN = [320, 390, 768, 1440]
const ARTIFACTS = process.env.VIATOR_S2_ARTIFACT_DIR ?? join(tmpdir(), 'viator-s2')

async function css(): Promise<string> {
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

async function bundle(): Promise<string> {
  const gebaut = await esbuild.build({
    absWorkingDir: process.cwd(),
    entryPoints: ['lib/providers/viator/activities/browser-harness.tsx'],
    bundle: true,
    write: false,
    format: 'iife',
    platform: 'browser',
    jsx: 'automatic',
    define: { 'process.env.NODE_ENV': '"production"' },
    banner: { js: 'globalThis.process=globalThis.process||{env:{NODE_ENV:"production"}};' },
    plugins: [{
      name: 'viator-shims',
      setup(build) {
        build.onResolve({ filter: /^server-only$/ }, () => ({ path: 'server-only', namespace: 'leer' }))
        build.onResolve({ filter: /^next\// }, (args) => ({ path: args.path, namespace: 'leer' }))
        build.onResolve({ filter: /^@\// }, (args) => build.resolve(join(process.cwd(), args.path.slice(2)), { resolveDir: process.cwd(), kind: args.kind }))
        build.onLoad({ filter: /.*/, namespace: 'leer' }, () => ({ contents: 'export default function(){return null}', loader: 'js' }))
      },
    }],
  })
  const js = gebaut.outputFiles[0]?.text
  if (!js) throw new Error('Viator harness bundle was empty')
  return js
}

describe('Viator activities browser harness', { timeout: 180_000 }, () => {
  let browser: Browser
  let server: Server
  let origin: string

  before(async () => {
    mkdirSync(ARTIFACTS, { recursive: true })
    const style = await css()
    const script = await bundle()
    const html = `<!doctype html><html><head><meta charset="utf-8" /><meta name="viewport" content="width=device-width, initial-scale=1" /><style>${style}</style></head><body><div id="root"></div><script>${script}</script></body></html>`
    server = createServer((_req, res) => {
      res.setHeader('content-type', 'text/html; charset=utf-8')
      res.end(html)
    })
    await new Promise<void>((resolve) => server.listen(0, '127.0.0.1', resolve))
    origin = `http://127.0.0.1:${(server.address() as AddressInfo).port}`
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
    await new Promise<void>((resolve, reject) => server.close((error) => (error ? reject(error) : resolve())))
  })

  async function seite(breite: number): Promise<Page> {
    const page = await browser.newPage({ viewport: { width: breite, height: 800 } })
    await page.route('**/*', (route) => {
      const url = route.request().url()
      if (url.startsWith(origin)) return route.continue()
      return route.abort()
    })
    await page.goto(origin)
    await page.getByRole('link', { name: 'Bei Viator ansehen' }).waitFor()
    return page
  }

  test('layout stays inside the viewport and text enlargement uses the root font', async () => {
    for (const breite of BREITEN) {
      const page = await seite(breite)
      const mass = await page.evaluate(() => ({
        scroll: document.documentElement.scrollWidth,
        client: document.documentElement.clientWidth,
      }))
      assert.ok(mass.scroll <= mass.client + 1, `${breite} overflow ${mass.scroll}>${mass.client}`)
      await page.screenshot({ path: join(ARTIFACTS, `viator-${breite}.png`), fullPage: true })
      await page.close()
    }
    const page = await seite(390)
    const vorher = await page.locator('h3').first().evaluate((el) => Number.parseFloat(getComputedStyle(el).fontSize))
    await page.evaluate(() => {
      document.documentElement.style.fontSize = '32px'
    })
    const nachher = await page.locator('h3').first().evaluate((el) => Number.parseFloat(getComputedStyle(el).fontSize))
    assert.ok(nachher > vorher, `root font did not enlarge text (${vorher} -> ${nachher})`)
    await page.keyboard.press('Tab')
    const fokus = await page.evaluate(() => document.activeElement?.textContent ?? '')
    assert.equal(fokus.includes('Angebot prüfen') || fokus.includes('Verfügbarkeit prüfen') || fokus.includes('Bei Viator'), true)
    await page.close()
  })
})
