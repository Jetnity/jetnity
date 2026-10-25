import assert from 'node:assert/strict'
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

async function oeffnen(browser: Browser, bundle: string, reise: Trip): Promise<{ page: Page; schliessen: () => Promise<void> }> {
  const html = `<!doctype html><html lang="de"><head><meta charset="utf-8"></head><body><div id="root"></div><script>window.__START__ = ${JSON.stringify({ reise })}</script><script>${bundle}</script></body></html>`
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
  let browser: Browser

  before(async () => {
    bundle = await bundeln()
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
    const { page, schliessen } = await oeffnen(browser, bundle, reise)
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
})
