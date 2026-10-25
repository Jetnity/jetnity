import assert from 'node:assert/strict'
import { createServer, type Server } from 'node:http'
import { mkdtempSync, readFileSync } from 'node:fs'
import { tmpdir } from 'node:os'
import { join, resolve } from 'node:path'
import { after, afterEach, before, describe, test } from 'node:test'

import * as esbuild from 'esbuild'
import { chromium, type Browser, type Locator, type Page } from 'playwright'

import { beispielreise } from '@/lib/reiseaenderung/fixtures/reise'
import { preparationEpoch } from '@/lib/readiness/personal-preparation-workflow'
import type { ReadinessUserStatus, Trip, TripReadinessItem } from '@/types/trips'

declare global {
  interface Window {
    __ARBEIT__: {
      writes: number
      entries: number
      reads: number
      queued: number
      letzte: { clientRef?: string; title?: string | null; userStatus?: string } | null
      bytes: () => string | null
      verzoegern: (wert: boolean) => void
      freigeben: () => void
      scheitern: () => void
      reiseSetzen: (reise: Trip) => void
      kanonischSetzen: (reise: Trip | undefined) => void
      speicherSetzen: (roh: string | null) => void
      lesenAls: (art: 'normal' | 'unreadable' | 'wrong_trip') => void
      fremdSchreiben: () => string | null
    }
  }
}

function punkt(reise: Trip, clientRef: string, title: string, userStatus: ReadinessUserStatus = 'open'): TripReadinessItem {
  const roh: TripReadinessItem = {
    id: clientRef,
    clientRef,
    kind: 'preparation',
    userStatus,
    evidence: 'user',
    countryCode: null,
    tripItemId: null,
    title,
    travellerClientRef: null,
    contextFingerprint: 'platzhalter',
    createdAt: '2026-10-04T20:00:00.000Z',
    updatedAt: '2026-10-04T20:00:00.000Z',
  }
  return { ...roh, contextFingerprint: preparationEpoch(reise, roh) }
}

async function bundeln(): Promise<string> {
  const datei = join(mkdtempSync(join(tmpdir(), 'personal-workspace-')), 'arbeitsbereich.js')
  const leer = join('scripts/trip-personal-preparation-workflow-completion-1/shims/empty.ts')
  const shims = join('scripts/trip-personal-preparation-workflow-completion-1/shims')
  const gebaut = await esbuild.build({
    absWorkingDir: process.cwd(),
    entryPoints: ['scripts/trip-personal-preparation-workflow-completion-1/arbeitsbereich.tsx'],
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
  await new Promise<void>((resolve) => server.listen(0, '127.0.0.1', resolve))
  const adresse = server.address()
  if (!adresse || typeof adresse === 'string') throw new Error('Kein lokaler Port')
  return {
    url: `http://127.0.0.1:${adresse.port}/`,
    close: () => new Promise((resolve, reject) => server.close((fehler) => (fehler ? reject(fehler) : resolve()))),
  }
}

async function oeffnen(browser: Browser, bundle: string, start: { seam: 'guest' | 'account'; reise: Trip; kanonisch?: Trip; geschwister?: boolean }): Promise<{ page: Page; schliessen: () => Promise<void> }> {
  const html = `<!doctype html><html lang="de"><head><meta charset="utf-8"></head><body><div id="root"></div><script>window.__START__ = ${JSON.stringify(start)}</script><script>${bundle}</script></body></html>`
  const server = await dienst(html)
  const page = await browser.newPage({ viewport: { width: 390, height: 900 } })
  const fehler: string[] = []
  page.on('pageerror', (error) => fehler.push(String(error)))
  await page.goto(server.url, { waitUntil: 'domcontentloaded' })
  await page.waitForFunction(() => window.__ARBEIT__)
  return {
    page,
    schliessen: async () => {
      const gemeldet = fehler.slice()
      offenLassen = null
      await page.close().catch(() => undefined)
      await server.close()
      assert.deepEqual(gemeldet, [], gemeldet.join('\n'))
    },
  }
}

function gemerkt<T extends { schliessen: () => Promise<void> }>(eintrag: T): T {
  offenLassen = eintrag
  return eintrag
}

async function stand(page: Page) {
  return page.evaluate(() => ({
    writes: window.__ARBEIT__.writes,
    entries: window.__ARBEIT__.entries,
    reads: window.__ARBEIT__.reads,
    queued: window.__ARBEIT__.queued,
    bytes: window.__ARBEIT__.bytes(),
  }))
}

async function klickTrotzSperre(ziel: Locator) {
  const getroffen = await ziel.evaluate((el) => {
    const schluessel = Object.keys(el).find((name) => name.startsWith('__reactProps'))
    const props = schluessel ? (el as unknown as Record<string, { onClick?: () => void }>)[schluessel] : null
    if (!props?.onClick) return false
    props.onClick()
    return true
  })
  assert.equal(getroffen, true)
}

async function vorbereitung(page: Page) {
  await page.getByRole('navigation', { name: 'Reiseansicht' }).getByRole('button', { name: 'Vorbereitung' }).click()
  await page.waitForSelector('[data-workspace-modus="vorbereitung"]')
  await page.locator('#preparation-eigene-vorbereitung').getByLabel('Eigene Vorbereitung').waitFor()
}

let offenLassen: { schliessen: () => Promise<void> } | null = null

describe('mounted TripWorkspace personal preparation', () => {
  let bundle = ''
  let browser: Browser

  before(async () => {
    bundle = await bundeln()
    browser = await chromium.launch()
  })

  after(async () => {
    await browser?.close()
  })

  afterEach(async () => {
    const aktuell = offenLassen
    offenLassen = null
    if (aktuell) await aktuell.schliessen()
  })

  test('guest create, edit, status and delete keep the sibling and use the real reader', async () => {
    const reise = beispielreise({ id: 'gast-arbeitsbereich', readinessItems: [] })
    const { page, schliessen } = gemerkt(await oeffnen(browser, bundle, { seam: 'guest', reise, geschwister: true }))
    await vorbereitung(page)
    assert.equal(await page.locator('[data-workspace-harness="trip"]').count(), 1)
    assert.match(await page.evaluate(() => window.__ARBEIT__.bytes() ?? ''), /entry-geschwister/)
    const feld = page.locator('#preparation-eigene-vorbereitung').getByLabel('Eigene Vorbereitung')
    await feld.fill('Adapter')
    await feld.press('Enter')
    await page.waitForFunction(() => window.__ARBEIT__.writes === 1 && window.__ARBEIT__.reads === 1)
    await page.waitForSelector('[data-personal-phase="confirmed"]')
    const ref = await page.evaluate(() => window.__ARBEIT__.letzte?.clientRef ?? '')
    assert.match(ref, /^preparation-/)
    assert.match(await page.evaluate(() => window.__ARBEIT__.bytes() ?? ''), new RegExp(ref))
    assert.match(await page.evaluate(() => window.__ARBEIT__.bytes() ?? ''), /entry-geschwister/)

    const zeile = page.locator(`[data-personal-client-ref="${ref}"]`)
    await zeile.getByRole('button', { name: 'Titel bearbeiten' }).click()
    await zeile.getByLabel('Titel bearbeiten').fill('Adapter neu')
    await zeile.getByRole('button', { name: 'Speichern' }).click()
    await page.waitForFunction(() => window.__ARBEIT__.writes === 2)
    await page.waitForFunction(() => (window.__ARBEIT__.bytes() ?? '').includes('Adapter neu'))

    await zeile.getByRole('button', { name: 'Erledigt', exact: true }).click()
    await zeile.getByRole('button', { name: 'Speichern' }).click()
    await page.waitForFunction(() => window.__ARBEIT__.writes === 3)
    assert.match(await page.evaluate(() => window.__ARBEIT__.bytes() ?? ''), /"userStatus":"done"/)

    await zeile.getByRole('button', { name: 'Entfernen' }).click()
    await zeile.getByRole('button', { name: 'Endgültig entfernen' }).click()
    await page.waitForFunction((id) => {
      const bytes = window.__ARBEIT__.bytes() ?? ''
      const zeile = document.querySelector(`[data-readiness-status][data-personal-client-ref="${id}"]`)
      return !bytes.includes(id) && bytes.includes('entry-geschwister') && zeile == null
    }, ref)
    assert.equal(await page.evaluate(() => {
      const graph = JSON.parse(window.__ARBEIT__.bytes() || '{}') as { readinessItems?: Array<{ clientRef?: string; kind?: string }> }
      return graph.readinessItems?.some((item) => item.clientRef === 'entry-geschwister' && item.kind === 'entry_check') ?? false
    }), true)
    await schliessen()
  })

  test('real mode navigation keeps a pending intent, and a rejected response does not write again', async () => {
    const reise = beispielreise({ id: 'gast-modus', readinessItems: [] })
    const { page, schliessen } = gemerkt(await oeffnen(browser, bundle, { seam: 'guest', reise, geschwister: true }))
    await vorbereitung(page)
    const vorher = await page.evaluate(() => window.__ARBEIT__.bytes())
    await page.evaluate(() => window.__ARBEIT__.verzoegern(true))
    const feld = page.locator('#preparation-eigene-vorbereitung').getByLabel('Eigene Vorbereitung')
    await feld.fill('Wartet')
    await feld.press('Enter')
    await page.waitForFunction(() => window.__ARBEIT__.entries === 1 && window.__ARBEIT__.writes === 1 && window.__ARBEIT__.queued === 1)
    assert.match(await page.evaluate(() => window.__ARBEIT__.bytes() ?? ''), /Wartet/)
    assert.equal(await page.locator('[data-personal-phase="pending"]').count(), 1)
    await page.getByRole('navigation', { name: 'Reiseansicht' }).getByRole('button', { name: 'Reiseplan' }).click()
    await page.waitForSelector('[data-workspace-modus="plan"]')
    assert.equal(await page.locator('[data-personal-preparation-root]').count(), 0)
    await vorbereitung(page)
    assert.equal(await page.locator('[data-personal-phase="pending"]').count(), 1)
    assert.equal(await page.evaluate(() => window.__ARBEIT__.writes), 1)
    assert.equal(await page.evaluate(() => window.__ARBEIT__.entries), 1)
    assert.equal(await page.evaluate(() => window.__ARBEIT__.queued), 1)
    await page.evaluate(() => window.__ARBEIT__.scheitern())
    await page.waitForFunction(() => document.body.innerText.includes('Lies zuerst'))
    await page.getByRole('navigation', { name: 'Reiseansicht' }).getByRole('button', { name: 'Reiseplan' }).click()
    await vorbereitung(page)
    await page.getByRole('button', { name: 'Erneut versuchen' }).click()
    await page.waitForTimeout(40)
    assert.equal(await page.evaluate(() => window.__ARBEIT__.writes), 1)
    assert.equal(await page.evaluate(() => window.__ARBEIT__.entries), 1)
    assert.equal(await page.evaluate(() => window.__ARBEIT__.queued), 0)
    assert.match(await page.evaluate(() => window.__ARBEIT__.bytes() ?? ''), /Wartet/)
    assert.match(await page.evaluate(() => window.__ARBEIT__.bytes() ?? ''), /entry-geschwister/)
    assert.notEqual(await page.evaluate(() => window.__ARBEIT__.bytes()), vorher)
    await schliessen()
  })

  test('a failed read of the expected trip blocks a new generation after discard and mode changes', async () => {
    const basis = beispielreise({ id: 'gast-barriere' })
    const bestehend = punkt(basis, 'preparation-bestehend', 'Bestehend')
    const reise = beispielreise({ id: basis.id, readinessItems: [bestehend] })
    const { page, schliessen } = gemerkt(await oeffnen(browser, bundle, { seam: 'guest', reise, geschwister: true }))
    await vorbereitung(page)
    const zeile = page.locator('[data-personal-client-ref="preparation-bestehend"]')
    await zeile.waitFor()
    await page.evaluate(() => {
      window.__ARBEIT__.verzoegern(true)
      window.__ARBEIT__.lesenAls('wrong_trip')
    })
    await zeile.getByRole('button', { name: 'Titel bearbeiten' }).click()
    await zeile.getByLabel('Titel bearbeiten').fill('Bestehend neu')
    await zeile.getByRole('button', { name: 'Speichern' }).click()
    await page.waitForFunction(() => window.__ARBEIT__.entries === 1 && window.__ARBEIT__.writes === 1 && window.__ARBEIT__.queued === 1)
    const feld = page.locator('#preparation-eigene-vorbereitung').getByLabel('Eigene Vorbereitung')
    await feld.fill('Neu')
    await feld.press('Enter')
    await page.waitForFunction(() => window.__ARBEIT__.entries === 2 && window.__ARBEIT__.writes === 2 && window.__ARBEIT__.queued === 2)
    const neuRef = await page.evaluate(() => window.__ARBEIT__.letzte?.clientRef ?? '')
    assert.match(neuRef, /^preparation-/)
    assert.notEqual(neuRef, 'preparation-bestehend')
    await page.evaluate(() => window.__ARBEIT__.freigeben())
    await page.waitForFunction(() => window.__ARBEIT__.queued === 1 && document.querySelector('[data-personal-client-ref="preparation-bestehend"]')?.getAttribute('data-personal-phase') === 'blocked')
    await page.evaluate(() => window.__ARBEIT__.freigeben())
    await page.waitForFunction(() => window.__ARBEIT__.queued === 0 && document.querySelector('[data-personal-barrier]')?.getAttribute('data-personal-barrier') === 'true')
    const neuZeile = page.locator(`[data-personal-client-ref="${neuRef}"]`)
    assert.equal(await neuZeile.getAttribute('data-personal-phase'), 'blocked')
    assert.match(await page.evaluate(() => window.__ARBEIT__.bytes() ?? ''), /Bestehend neu/)
    assert.match(await page.evaluate(() => window.__ARBEIT__.bytes() ?? ''), /entry-geschwister/)
    await feld.fill('Anders', { force: true })
    assert.equal(await feld.inputValue(), 'Anders')
    await neuZeile.getByRole('button', { name: 'Versuch lokal verwerfen' }).click()
    await page.waitForFunction((ref) => {
      const knoten = document.querySelector(`[data-personal-client-ref="${ref}"]`)
      return knoten != null && !knoten.textContent?.includes('Versuch lokal verwerfen') && document.querySelector('[data-personal-barrier]')?.getAttribute('data-personal-barrier') === 'true'
    }, neuRef)
    await page.getByRole('navigation', { name: 'Reiseansicht' }).getByRole('button', { name: 'Reiseplan' }).click()
    await page.waitForSelector('[data-workspace-modus="plan"]')
    assert.equal(await page.locator('[data-personal-preparation-root]').count(), 0)
    await vorbereitung(page)
    assert.equal(await feld.inputValue(), 'Anders')
    assert.equal(await page.locator('[data-personal-barrier]').getAttribute('data-personal-barrier'), 'true')
    assert.equal(await zeile.getAttribute('data-personal-phase'), 'blocked')
    const gehalten = await stand(page)
    assert.equal(gehalten.entries, 2)
    assert.equal(gehalten.writes, 2)
    assert.equal(gehalten.queued, 0)
    assert.match(gehalten.bytes ?? '', /Bestehend neu/)

    const unveraendert = async (bytes: string | null) => {
      const jetzt = await stand(page)
      assert.equal(jetzt.entries, gehalten.entries)
      assert.equal(jetzt.writes, gehalten.writes)
      assert.equal(jetzt.queued, 0)
      assert.equal(jetzt.bytes, bytes)
    }
    await page.locator('#preparation-eigene-vorbereitung form').evaluate((form) => {
      form.dispatchEvent(new Event('submit', { bubbles: true, cancelable: true }))
    })
    await page.waitForTimeout(40)
    await unveraendert(gehalten.bytes)
    await feld.press('Enter', { force: true })
    await page.waitForTimeout(40)
    await unveraendert(gehalten.bytes)
    assert.equal(await feld.inputValue(), 'Anders')

    await zeile.getByRole('button', { name: 'Titel bearbeiten' }).click()
    const erledigt = zeile.getByRole('button', { name: 'Erledigt', exact: true })
    await klickTrotzSperre(erledigt)
    await page.waitForFunction(() => document.querySelector('[data-personal-client-ref="preparation-bestehend"] button[aria-pressed="true"]')?.textContent === 'Erledigt')
    await klickTrotzSperre(zeile.getByRole('button', { name: 'Speichern' }))
    await page.waitForTimeout(40)
    await unveraendert(gehalten.bytes)
    await zeile.getByRole('button', { name: 'Entfernen' }).click()
    await klickTrotzSperre(zeile.getByRole('button', { name: 'Endgültig entfernen' }))
    await page.waitForTimeout(40)
    await unveraendert(gehalten.bytes)
    await klickTrotzSperre(zeile.getByRole('button', { name: 'Erneut versuchen' }))
    await page.waitForTimeout(40)
    await unveraendert(gehalten.bytes)
    assert.equal(await zeile.getAttribute('data-personal-phase'), 'blocked')
    assert.match(await page.locator('#preparation-eigene-vorbereitung').innerText(), /Bestehend neu/)

    await page.evaluate(() => window.__ARBEIT__.lesenAls('normal'))
    const fremd = await page.evaluate(() => window.__ARBEIT__.fremdSchreiben())
    assert.notEqual(fremd, gehalten.bytes)
    const lesenKnopf = page.locator('#preparation-eigene-vorbereitung').getByRole('button', { name: 'Stand neu lesen' }).last()
    const lesenVorher = await page.evaluate(() => window.__ARBEIT__.reads)
    await lesenKnopf.click()
    await page.waitForFunction((alt) => window.__ARBEIT__.reads > alt, lesenVorher)
    await unveraendert(fremd)
    assert.match(await page.locator('#preparation-eigene-vorbereitung').innerText(), /Bestehend neu/)
    assert.equal(await page.locator('[data-personal-barrier]').getAttribute('data-personal-barrier'), 'true')

    await page.evaluate(() => window.__ARBEIT__.speicherSetzen('{'))
    const nachFremd = await page.evaluate(() => window.__ARBEIT__.reads)
    await lesenKnopf.click()
    await page.waitForFunction((alt) => window.__ARBEIT__.reads > alt, nachFremd)
    await unveraendert('{')

    await page.evaluate((roh) => window.__ARBEIT__.speicherSetzen(roh), gehalten.bytes)
    await page.evaluate(() => window.__ARBEIT__.lesenAls('unreadable'))
    const nachUngueltig = await page.evaluate(() => window.__ARBEIT__.reads)
    await lesenKnopf.click()
    await page.waitForFunction((alt) => window.__ARBEIT__.reads > alt, nachUngueltig)
    await unveraendert(gehalten.bytes)

    await page.evaluate(() => window.__ARBEIT__.lesenAls('normal'))
    const vorErfolg = await page.evaluate(() => window.__ARBEIT__.reads)
    await lesenKnopf.click()
    await page.waitForFunction((alt) => window.__ARBEIT__.reads > alt && document.querySelector('[data-personal-barrier]')?.getAttribute('data-personal-barrier') === 'false', vorErfolg)
    assert.equal(await feld.inputValue(), 'Anders')
    assert.equal(await page.evaluate(() => window.__ARBEIT__.bytes()), gehalten.bytes)
    await zeile.getByLabel('Titel bearbeiten').fill('Bestehend danach')
    await zeile.getByRole('button', { name: 'Speichern' }).click()
    await page.waitForFunction(() => window.__ARBEIT__.entries === 3 && window.__ARBEIT__.writes === 3)
    assert.match(await page.evaluate(() => window.__ARBEIT__.bytes() ?? ''), /Bestehend danach/)
    assert.match(await page.evaluate(() => window.__ARBEIT__.bytes() ?? ''), /entry-geschwister/)
    await schliessen()
  })

  test('a trip switch keeps the write that already ran and ignores its late result', async () => {
    const reise = beispielreise({ id: 'gast-a', readinessItems: [] })
    const { page, schliessen } = gemerkt(await oeffnen(browser, bundle, { seam: 'guest', reise }))
    await vorbereitung(page)
    const vorher = await page.evaluate(() => window.__ARBEIT__.bytes())
    await page.evaluate(() => window.__ARBEIT__.verzoegern(true))
    const feld = page.locator('#preparation-eigene-vorbereitung').getByLabel('Eigene Vorbereitung')
    await feld.fill('Alt')
    await feld.press('Enter')
    await page.waitForFunction(() => window.__ARBEIT__.entries === 1 && window.__ARBEIT__.writes === 1 && window.__ARBEIT__.queued === 1 && window.__ARBEIT__.reads === 0)
    const geschrieben = await page.evaluate(() => window.__ARBEIT__.bytes())
    assert.match(geschrieben ?? '', /Alt/)
    assert.notEqual(geschrieben, vorher)
    await page.evaluate((wert) => window.__ARBEIT__.reiseSetzen(wert), beispielreise({ id: 'gast-b', readinessItems: [] }))
    await page.waitForFunction(() => document.body.innerText.includes('Noch keine eigene Vorbereitung'))
    assert.equal(await page.locator('[data-personal-phase="pending"]').count(), 0)
    await page.evaluate(() => window.__ARBEIT__.freigeben())
    await page.waitForTimeout(40)
    const nachher = await stand(page)
    assert.equal(nachher.entries, 1)
    assert.equal(nachher.writes, 1)
    assert.equal(nachher.reads, 0)
    assert.equal(nachher.queued, 0)
    assert.equal(nachher.bytes, geschrieben)
    assert.equal(await page.locator('[data-personal-phase="confirmed"]').count(), 0)
    assert.equal(await page.locator('[data-personal-phase="pending"]').count(), 0)
    assert.equal(await feld.inputValue(), '')
    assert.equal(await page.locator('[data-personal-focus]').count(), 0)
    await schliessen()
  })

  test('account confirmation waits for a later raw canonical trip', async () => {
    const reise = beispielreise({ id: 'konto-arbeitsbereich', readinessItems: [] })
    const { page, schliessen } = gemerkt(await oeffnen(browser, bundle, { seam: 'account', reise, kanonisch: reise }))
    await vorbereitung(page)
    await page.evaluate(() => window.__ARBEIT__.verzoegern(true))
    const feld = page.locator('#preparation-eigene-vorbereitung').getByLabel('Eigene Vorbereitung')
    await feld.fill('Konto')
    await feld.press('Enter')
    await page.waitForFunction(() => window.__ARBEIT__.entries === 1 && window.__ARBEIT__.writes === 0 && window.__ARBEIT__.queued === 1)
    assert.equal(await page.locator('[data-personal-phase="pending"]').count(), 1)
    const lieferung = await page.locator('[data-personal-lieferung]').getAttribute('data-personal-lieferung')
    await page.evaluate(() => window.__ARBEIT__.kanonischSetzen(window.__START__.reise))
    await page.waitForFunction((alt) => document.querySelector('[data-personal-lieferung]')?.getAttribute('data-personal-lieferung') !== alt, lieferung)
    assert.equal(await page.locator('[data-personal-phase="pending"]').count(), 1)
    const frei = await page.evaluate(() => {
      const vor = window.__ARBEIT__.queued
      let fehler: string | null = null
      try {
        window.__ARBEIT__.freigeben()
      } catch (error) {
        fehler = String(error)
      }
      return { vor, queued: window.__ARBEIT__.queued, writes: window.__ARBEIT__.writes, entries: window.__ARBEIT__.entries, reads: window.__ARBEIT__.reads, fehler }
    })
    assert.equal(frei.vor, 1, JSON.stringify(frei))
    try {
      await page.waitForFunction(
        () => window.__ARBEIT__.reads === 1 && document.querySelector('[data-personal-phase="awaiting"]') != null,
        undefined,
        { timeout: 4000 },
      )
    } catch (error) {
      const stand = await page.evaluate(() => ({
        reads: window.__ARBEIT__.reads,
        writes: window.__ARBEIT__.writes,
        queued: window.__ARBEIT__.queued,
        phasen: [...document.querySelectorAll('[data-personal-phase]')].map((el) => el.getAttribute('data-personal-phase')),
        text: document.body.innerText.slice(0, 700),
      }))
      throw new Error(`${String(error)}\n${JSON.stringify(stand)}`)
    }
    const ref = await page.evaluate(() => window.__ARBEIT__.letzte?.clientRef ?? '')
    const ohne = beispielreise({ id: reise.id, readinessItems: [] })
    await page.evaluate((wert) => window.__ARBEIT__.kanonischSetzen(wert), ohne)
    await page.waitForSelector('[data-personal-phase="absent_uncertain"]')
    const mit = beispielreise({ id: reise.id, readinessItems: [punkt(reise, ref, 'Konto')] })
    await page.evaluate((wert) => window.__ARBEIT__.kanonischSetzen(wert), mit)
    await page.waitForSelector('[data-personal-phase="confirmed"]')
    assert.equal(await page.evaluate(() => window.__ARBEIT__.reads), 1)
    assert.equal(await page.evaluate(() => window.__ARBEIT__.writes), 1)
    assert.equal(await page.evaluate(() => window.__ARBEIT__.entries), 1)
    await schliessen()
  })

  test('collapsing the personal section stays collapsed when a late result arrives', async () => {
    const reise = beispielreise({ id: 'gast-zu', readinessItems: [] })
    const { page, schliessen } = gemerkt(await oeffnen(browser, bundle, { seam: 'guest', reise }))
    await vorbereitung(page)
    await page.evaluate(() => window.__ARBEIT__.verzoegern(true))
    const feld = page.locator('#preparation-eigene-vorbereitung').getByLabel('Eigene Vorbereitung')
    await feld.fill('Zu')
    await feld.press('Enter')
    await page.waitForFunction(() => window.__ARBEIT__.entries === 1 && window.__ARBEIT__.writes === 1 && window.__ARBEIT__.queued === 1 && window.__ARBEIT__.reads === 0)
    await page.locator('#preparation-eigene-vorbereitung > summary').click()
    assert.equal(await page.locator('#preparation-eigene-vorbereitung').evaluate((el) => (el as HTMLDetailsElement).open), false)
    await page.evaluate(() => window.__ARBEIT__.freigeben())
    await page.waitForFunction(() => window.__ARBEIT__.writes === 1 && window.__ARBEIT__.reads === 1 && window.__ARBEIT__.entries === 1)
    await page.waitForTimeout(40)
    assert.equal(await page.locator('#preparation-eigene-vorbereitung').evaluate((el) => (el as HTMLDetailsElement).open), false)
    assert.equal(await page.evaluate(() => document.activeElement?.closest('#preparation-eigene-vorbereitung input') == null), true)
    await schliessen()
  })
})
