import assert from 'node:assert/strict'
import { createRequire } from 'node:module'
import { createServer, type Server } from 'node:http'
import { mkdtempSync, readFileSync } from 'node:fs'
import { tmpdir } from 'node:os'
import { join, resolve } from 'node:path'
import { after, before, describe, test } from 'node:test'

import * as esbuild from 'esbuild'
import { chromium, type Browser, type Page } from 'playwright'

import { beispielreise } from '@/lib/reiseaenderung/fixtures/reise'
import type { Trip, TripTraveller } from '@/types/trips'

const STAATSBUERGERSCHAFT = 'a1111111-1111-4111-8111-111111111111'

function reisender(): TripTraveller {
  return {
    id: 'traveller-row-1',
    clientRef: 'traveller:1',
    label: 'Reisende 1',
    residenceCountryCode: null,
    citizenships: [
      {
        id: 'citizenship-row-1',
        clientRef: STAATSBUERGERSCHAFT,
        countryCode: 'CH',
        createdAt: '2026-10-04T20:00:00.000Z',
        updatedAt: '2026-10-04T20:00:00.000Z',
      },
    ],
    documents: [
      {
        id: 'document-row-1',
        clientRef: 'document:pass-1',
        documentType: 'passport',
        issuingCountryCode: 'CH',
        citizenshipClientRef: STAATSBUERGERSCHAFT,
        expiresOn: '2030-01-01',
        createdAt: '2026-10-04T20:00:00.000Z',
        updatedAt: '2026-10-04T20:00:00.000Z',
      },
    ],
    createdAt: '2026-10-04T20:00:00.000Z',
    updatedAt: '2026-10-04T20:00:00.000Z',
  }
}

async function bundeln(): Promise<string> {
  const datei = join(mkdtempSync(join(tmpdir(), 'traveller-snapshot-')), 'flaeche.js')
  const leer = join('scripts/trip-personal-preparation-workflow-completion-1/shims/empty.ts')
  const shims = join('scripts/trip-personal-preparation-workflow-completion-1/shims')
  const gebaut = await esbuild.build({
    absWorkingDir: process.cwd(),
    entryPoints: ['scripts/trip-traveller-snapshot-workflow-completion-1/flaeche.tsx'],
    bundle: true,
    format: 'iife',
    platform: 'browser',
    jsx: 'automatic',
    outfile: datei,
    alias: { '@': process.cwd() },
    define: { 'process.env.NODE_ENV': '"production"' },
    banner: { js: 'globalThis.process=globalThis.process||{env:{NODE_ENV:"production"}};globalThis.global=globalThis;' },
    plugins: [
      {
        name: 'next-shims',
        setup(build) {
          const ziel: Record<string, string> = {
            'next/link': join(shims, 'link.tsx'),
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
  assert.equal(gebaut.errors.length, 0)
  return readFileSync(datei, 'utf8')
}

async function dienst(html: string): Promise<{ url: string; close: () => Promise<void> }> {
  const server: Server = createServer((_req, res) => {
    res.writeHead(200, { 'content-type': 'text/html; charset=utf-8' })
    res.end(html)
  })
  await new Promise<void>((aufloesen) => server.listen(0, '127.0.0.1', aufloesen))
  const adresse = server.address()
  if (!adresse || typeof adresse === 'string') throw new Error('Kein lokaler Port')
  return {
    url: `http://127.0.0.1:${adresse.port}/`,
    close: () => new Promise((aufloesen, abweisen) => server.close((fehler) => (fehler ? abweisen(fehler) : aufloesen()))),
  }
}

async function projektCss(): Promise<string> {
  const verlangen = createRequire(import.meta.url)
  const postcss = verlangen('postcss') as typeof import('postcss')
  const nesting = verlangen('tailwindcss/nesting') as typeof import('postcss')
  const tailwindcss = verlangen('tailwindcss') as (config: unknown) => ReturnType<typeof postcss>
  const autoprefixer = verlangen('autoprefixer') as () => ReturnType<typeof postcss>
  const from = join(process.cwd(), 'styles/globals.css')
  const config = verlangen(join(process.cwd(), 'tailwind.config.js')) as unknown
  const ergebnis = await postcss([nesting(), tailwindcss(config), autoprefixer()]).process(readFileSync(from, 'utf8'), { from })
  return ergebnis.css.replaceAll('</style', '<\\/style')
}

async function oeffnen(browser: Browser, bundle: string, reise: Trip, css: string): Promise<{ page: Page; schliessen: () => Promise<void> }> {
  const html = `<!doctype html><html lang="de"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width, initial-scale=1"><style>${css}</style></head><body style="margin:0"><div id="root"></div><script>window.__START__ = ${JSON.stringify({ reise })}</script><script>${bundle}</script></body></html>`
  const server = await dienst(html)
  const page = await browser.newPage({ viewport: { width: 390, height: 900 } })
  const fehler: string[] = []
  page.on('pageerror', (error) => fehler.push(String(error)))
  await page.goto(server.url, { waitUntil: 'domcontentloaded' })
  await page.waitForFunction(() => window.__SNAPSHOT__)
  return {
    page,
    schliessen: async () => {
      const gemeldet = fehler.slice()
      await page.close().catch(() => undefined)
      await server.close()
      assert.deepEqual(gemeldet, [], gemeldet.join('\n'))
    },
  }
}

describe('mounted TripWorkspace traveller residence-only identity', () => {
  let bundle = ''
  let css = ''
  let browser: Browser

  before(async () => {
    ;[bundle, css] = await Promise.all([bundeln(), projektCss()])
    browser = await chromium.launch({ args: ['--no-sandbox', '--disable-dev-shm-usage'] })
  })

  after(async () => {
    await browser?.close()
  })

  test('a residence-only save keeps the loaded citizenship UUID and its passport relation', { timeout: 120_000 }, async () => {
    const reise = beispielreise({
      id: 'trip-residence-uuid',
      travellers: 1,
      party: [reisender()],
    })
    const { page, schliessen } = await oeffnen(browser, bundle, reise, css)
    try {
      await page.getByRole('navigation', { name: 'Reiseansicht' }).getByRole('button', { name: 'Vorbereitung' }).click()
      await page.waitForSelector('[data-workspace-modus="vorbereitung"]')
      const karte = page.locator('[data-preparation-traveller="traveller:1"]')
      await karte.getByText('Angaben bearbeiten', { exact: true }).click()
      await karte.getByRole('combobox', { name: 'Wohnsitzland, falls relevant', exact: true }).selectOption('IT')
      const speichern = karte.getByRole('button', { name: 'Angaben speichern', exact: true })
      await speichern.focus()
      await speichern.press('Enter')
      await page.waitForFunction(() => window.__SNAPSHOT__.payloads.length === 1)
      const payload = await page.evaluate(() => window.__SNAPSHOT__.payloads[0])
      const sichtbar = JSON.stringify(payload)
      assert.equal(payload?.citizenships[0]?.clientRef, STAATSBUERGERSCHAFT, sichtbar)
      assert.equal(payload?.documents[0]?.citizenshipClientRef, STAATSBUERGERSCHAFT, sichtbar)
      assert.equal(payload?.residenceCountryCode, 'IT', sichtbar)
    } finally {
      await schliessen()
    }
  })

  test('a pointer click on Angaben speichern keeps the same UUID relation', { timeout: 120_000 }, async () => {
    const reise = beispielreise({
      id: 'trip-residence-click',
      travellers: 1,
      party: [reisender()],
    })
    const { page, schliessen } = await oeffnen(browser, bundle, reise, css)
    try {
      await page.getByRole('navigation', { name: 'Reiseansicht' }).getByRole('button', { name: 'Vorbereitung' }).click()
      await page.waitForSelector('[data-workspace-modus="vorbereitung"]')
      const karte = page.locator('[data-preparation-traveller="traveller:1"]')
      await karte.getByText('Angaben bearbeiten', { exact: true }).click()
      await karte.getByRole('combobox', { name: 'Wohnsitzland, falls relevant', exact: true }).selectOption('IT')
      await karte.getByRole('button', { name: 'Angaben speichern', exact: true }).click()
      await page.waitForFunction(() => window.__SNAPSHOT__.payloads.length === 1)
      const payload = await page.evaluate(() => window.__SNAPSHOT__.payloads[0])
      const sichtbar = JSON.stringify(payload)
      assert.equal(payload?.citizenships[0]?.clientRef, STAATSBUERGERSCHAFT, sichtbar)
      assert.equal(payload?.documents[0]?.citizenshipClientRef, STAATSBUERGERSCHAFT, sichtbar)
    } finally {
      await schliessen()
    }
  })

  test('the open traveller card does not widen the page', { timeout: 120_000 }, async () => {
    const reise = beispielreise({
      id: 'trip-residence-css',
      travellers: 1,
      party: [reisender()],
    })
    const { page, schliessen } = await oeffnen(browser, bundle, reise, css)
    try {
      await page.emulateMedia({ reducedMotion: 'reduce' })
      await page.getByRole('navigation', { name: 'Reiseansicht' }).getByRole('button', { name: 'Vorbereitung' }).click()
      const karte = page.locator('[data-preparation-traveller="traveller:1"]')
      await karte.getByText('Angaben bearbeiten', { exact: true }).click()
      for (const width of [320, 360, 390, 768, 1280]) {
        await page.setViewportSize({ width, height: 900 })
        if (width === 320) await page.evaluate(() => { document.documentElement.style.fontSize = '32px' })
        const masse = await page.evaluate(() => ({
          scroll: document.documentElement.scrollWidth,
          breite: document.documentElement.clientWidth,
          overflow: getComputedStyle(document.documentElement).overflow,
        }))
        const ursache = await page.evaluate(() =>
          [...document.querySelectorAll('body *')]
            .filter((el) => el.scrollWidth > el.clientWidth + 1 && ![...el.children].some((kind) => kind.scrollWidth > kind.clientWidth + 1))
            .map((el) => ({
              tag: el.tagName,
              id: el.id,
              klasse: String(el.className).slice(0, 100),
              scroll: el.scrollWidth,
              client: el.clientWidth,
              text: (el.textContent ?? '').trim().slice(0, 60),
            }))
            .sort((a, b) => b.scroll - a.scroll)
            .slice(0, 8),
        )
        assert.equal(masse.overflow === 'hidden', false)
        assert.ok(masse.scroll <= masse.breite + 1, JSON.stringify({ width, ...masse, ursache }))
        await page.screenshot({
          path: `docs/evidence/trip-traveller-snapshot-workflow-completion-1/card-${width}.png`,
          fullPage: true,
        })
      }
    } finally {
      await schliessen()
    }
  })
})
