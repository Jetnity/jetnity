// Montierte native Suche. Kein Anbieter.
// Aufruf: node --import tsx scripts/activities-ux-gyg-expand-1/nativ.ts

import { spawnSync } from 'node:child_process'
import { createServer } from 'node:http'
import { createRequire } from 'node:module'
import { mkdirSync, readFileSync, writeFileSync } from 'node:fs'
import { dirname, join, resolve } from 'node:path'
import { fileURLToPath } from 'node:url'

import { chromium, type Locator, type Page } from 'playwright'

import { ACTIVITY_ABDECKUNGSHINWEIS } from '@/lib/activities/domain'
import { ACTIVITY_TAG_UNVERFUEGBAR } from '@/lib/activities/zustand'

const require = createRequire(import.meta.url)
const esbuild = require('esbuild') as { build: (options: Record<string, unknown>) => Promise<void> }
const ROOT = resolve(dirname(fileURLToPath(import.meta.url)), '../..')
const OUT = '/tmp/activities-ux-gyg-expand-1-nativ'
const ARTIFACTS = '/opt/cursor/artifacts/activities-ux-gyg-expand-1'

function pruefe(bedingung: boolean, meldung: string) {
  if (!bedingung) throw new Error(meldung)
}

function dateiAufloesen(basis: string): string | null {
  const { existsSync, statSync } = require('node:fs') as typeof import('node:fs')
  const kandidaten = ['.ts', '.tsx', '.js', '.mjs'].flatMap((endung) => [basis + endung, join(basis, `index${endung}`)])
  return kandidaten.find((kandidat) => existsSync(kandidat) && statSync(kandidat).isFile()) ?? null
}

const OPTION = {
  id: 'synthetic-local-boot',
  provider: 'synthetic',
  externalRef: 'synthetic-local-boot',
  title: 'Synthetische Bootsfahrt',
  description: 'Lokale Karte ohne Anbieter.',
  locationName: 'Lissabon',
  punkt: null,
  dauerMinuten: 90,
  timeslot: null,
  preis: 80,
  preisWaehrung: 'CHF',
  bewertung: null,
  bewertungenAnzahl: null,
  stornierbar: null,
  kategorien: [],
  tags: [],
  labels: [],
  reasons: ['Synthetische lokale Karte'],
  konflikt: 'frei',
}

const EVIDENZ = {
  hatOrt: true,
  hatKoordinaten: true,
  hatTag: true,
  hatDatum: true,
  hatBestehendePunkte: false,
  hatBelastbareZeiten: false,
  hatInteressen: false,
  hatBudget: false,
}

function antwortFuer(stageId: string) {
  const basis = { coverageNote: ACTIVITY_ABDECKUNGSHINWEIS, evidenz: EVIDENZ, options: [] as unknown[] }
  if (stageId === 'stage-unavailable') {
    return { ...basis, status: 'unavailable', message: ACTIVITY_TAG_UNVERFUEGBAR }
  }
  if (stageId === 'stage-empty') {
    return { ...basis, status: 'empty', message: 'Keine passenden Aktivitäten für diesen Reisetag gefunden.' }
  }
  if (stageId === 'stage-error') {
    return { ...basis, status: 'error', message: 'Die Aktivitätensuche ist fehlgeschlagen.' }
  }
  if (stageId === 'stage-partial') {
    return {
      ...basis,
      status: 'partial',
      message: 'Einige Angebote konnten nicht gelesen werden. Die übrigen Aktivitäten siehst du unten.',
      options: [OPTION],
    }
  }
  return { ...basis, status: 'ok', message: 'Aktivitäten gefunden.', options: [OPTION] }
}

function cssBauen() {
  const ziel = join(OUT, 'tailwind.css')
  mkdirSync(OUT, { recursive: true })
  const lauf = spawnSync(join(ROOT, 'node_modules/.bin/tailwindcss'), ['-i', 'styles/globals.css', '-o', ziel, '--minify'], {
    cwd: ROOT,
    encoding: 'utf8',
  })
  if (lauf.status !== 0) throw new Error(`Tailwind fehlgeschlagen\n${lauf.stdout}\n${lauf.stderr}`)
  return readFileSync(ziel, 'utf8')
}

async function bundeln() {
  mkdirSync(OUT, { recursive: true })
  await esbuild.build({
    absWorkingDir: ROOT,
    entryPoints: { nativ: 'scripts/activities-ux-gyg-expand-1/nativ-flaeche.tsx' },
    bundle: true,
    format: 'iife',
    platform: 'browser',
    target: 'es2022',
    jsx: 'automatic',
    outfile: join(OUT, 'nativ.js'),
    define: { 'process.env.NODE_ENV': '"production"' },
    plugins: [
      {
        name: 'jetnity-alias',
        setup(build: { onResolve: (args: { filter: RegExp }, fn: (args: { path: string }) => { path: string } | null) => void }) {
          build.onResolve({ filter: /^@\/lib\/places\/aktionen$/ }, () => ({
            path: join(ROOT, 'scripts/activities-ux-gyg-expand-1/orte-stub.ts'),
          }))
          build.onResolve({ filter: /^server-only$/ }, () => ({
            path: join(ROOT, 'scripts/server-only-empty.js'),
          }))
          build.onResolve({ filter: /^@\// }, (args) => {
            const ziel = dateiAufloesen(join(ROOT, args.path.slice(2)))
            if (!ziel) return null
            return { path: ziel }
          })
        },
      },
    ],
  })
}

function szenario(page: Page, name: string): Locator {
  return page.locator(`[data-szenario="${name}"]`)
}

async function suchen(page: Page, name: string, label: string, erwartet: string) {
  const region = szenario(page, name)
  const knopf = region.getByRole('button', { name: label, exact: true })
  await knopf.click()
  try {
    await region.getByText(erwartet, { exact: false }).waitFor({ timeout: 8000 })
  } catch (fehler) {
    console.log('sicht', name, JSON.stringify(await region.innerText()))
    throw fehler
  }
}

function html(): string {
  return '<!doctype html><html lang="de"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width, initial-scale=1"><title>Nativ</title><link rel="stylesheet" href="/app.css"></head><body><div id="root"></div><script src="/nativ.js"></script></body></html>'
}

async function main() {
  mkdirSync(ARTIFACTS, { recursive: true })
  const css = cssBauen()
  await bundeln()
  writeFileSync(join(OUT, 'app.css'), css)
  const suchtreffer: string[] = []
  const fremd: string[] = []
  const server = createServer(async (req, res) => {
    const url = new URL(req.url ?? '/', 'http://127.0.0.1')
    if (url.pathname === '/api/activities/search') {
      const roh = await new Promise<string>((resolve) => {
        const teile: Buffer[] = []
        req.on('data', (teil) => teile.push(teil))
        req.on('end', () => resolve(Buffer.concat(teile).toString('utf8')))
      })
      const koerper = JSON.parse(roh) as { stage?: { id?: string } }
      const stageId = koerper.stage?.id ?? ''
      suchtreffer.push(stageId)
      console.log('suche', stageId)
      pruefe(roh.includes('private-canary-ux-gyg-expand-1') === false, 'Der private Wunsch steht in der nativen Suche')
      res.writeHead(200, { 'content-type': 'application/json; charset=utf-8' })
      res.end(JSON.stringify(antwortFuer(stageId)))
      return
    }
    if (url.pathname === '/nativ.js') {
      res.writeHead(200, { 'content-type': 'text/javascript; charset=utf-8' })
      res.end(readFileSync(join(OUT, 'nativ.js')))
      return
    }
    if (url.pathname === '/app.css') {
      res.writeHead(200, { 'content-type': 'text/css; charset=utf-8' })
      res.end(readFileSync(join(OUT, 'app.css')))
      return
    }
    res.writeHead(200, { 'content-type': 'text/html; charset=utf-8' })
    res.end(html())
  })
  await new Promise<void>((resolve) => server.listen(0, '127.0.0.1', resolve))
  const adresse = server.address()
  if (!adresse || typeof adresse === 'string') throw new Error('Port fehlt')
  const browser = await chromium.launch({ headless: true })
  const page = await browser.newPage({ viewport: { width: 390, height: 844 } })
  page.on('request', (request) => {
    try {
      const ziel = new URL(request.url())
      if (!ziel.hostname.startsWith('127.0.0.1')) fremd.push(request.url())
      if (request.url().includes('private-canary-ux-gyg-expand-1')) fremd.push(`canary:${request.url()}`)
    } catch {
      fremd.push(request.url())
    }
  })
  await page.goto(`http://127.0.0.1:${adresse.port}/`, { waitUntil: 'domcontentloaded' })
  await page.waitForTimeout(400)
  pruefe((await page.locator('iframe').count()) === 0, 'Ein Rahmen existiert vor der Suche')
  pruefe(fremd.length === 0, `Fremdanfrage vor der Suche: ${fremd.join(' ')}`)

  await suchen(page, 'unavailable', 'Für diesen Tag suchen', ACTIVITY_TAG_UNVERFUEGBAR)
  const unavailable = szenario(page, 'unavailable')
  const text = await unavailable.innerText()
  pruefe(text.includes(ACTIVITY_TAG_UNVERFUEGBAR), 'Die unavailable-Meldung fehlt')
  pruefe(text.includes('Production') === false, 'Production bleibt sichtbar')
  pruefe(text.includes('noch nicht freigegeben') === false, 'Die alte Freigabeformel bleibt sichtbar')
  pruefe(text.includes('verfügbare Angebote') === false, 'Die Angebotszusage bleibt bei unavailable sichtbar')
  pruefe(text.includes(ACTIVITY_ABDECKUNGSHINWEIS) === false, 'Der Abdeckungshinweis bleibt bei unavailable sichtbar')
  pruefe((await unavailable.getByRole('button', { name: 'Suche erneut prüfen', exact: true }).count()) === 1, 'Prüfaktion fehlt')
  pruefe((await unavailable.getByRole('button', { name: 'Erneut suchen', exact: true }).count()) === 0, 'Erneut suchen bleibt bei unavailable')
  pruefe((await unavailable.locator('iframe').count()) === 0, 'Unavailable hat einen Rahmen geladen')
  await unavailable.screenshot({ path: join(ARTIFACTS, 'nativ-unavailable-390.png') })

  await suchen(page, 'unavailable', 'Suche erneut prüfen', ACTIVITY_TAG_UNVERFUEGBAR)
  pruefe(suchtreffer.filter((id) => id === 'stage-unavailable').length === 2, 'Die Prüfaktion hat nicht erneut gesucht')
  pruefe((await unavailable.locator('iframe').count()) === 0, 'Die Prüfaktion hat GetYourGuide geladen')

  await suchen(page, 'ok', 'Für diesen Tag suchen', 'Synthetische Bootsfahrt')
  const ok = szenario(page, 'ok')
  const okText = await ok.innerText()
  pruefe(okText.includes('Synthetische Bootsfahrt'), 'Die Erfolgskarte fehlt')
  pruefe(okText.includes('verfügbare Angebote'), 'Die Abdeckung fehlt beim Erfolg')
  pruefe((await ok.getByRole('button', { name: 'Erneut suchen', exact: true }).count()) === 1, 'Erneut suchen fehlt beim Erfolg')
  pruefe((await ok.getByText('Synthetische Bootsfahrt').count()) === 1, 'Die lokale Karte fehlt')

  await suchen(page, 'partial', 'Für diesen Tag suchen', 'Einige Angebote konnten nicht gelesen werden.')
  const partial = await szenario(page, 'partial').innerText()
  pruefe(partial.includes('Einige Angebote konnten nicht gelesen werden.'), 'Die Teilmeldung fehlt')
  pruefe(partial.includes('verfügbare Angebote'), 'Die Abdeckung fehlt bei partial')

  await suchen(page, 'empty', 'Für diesen Tag suchen', 'Keine passenden Aktivitäten')
  const empty = await szenario(page, 'empty').innerText()
  pruefe(empty.includes('Keine passenden Aktivitäten für diesen Reisetag gefunden.'), 'Die Leermeldung fehlt')
  pruefe(empty.includes('verfügbare Angebote'), 'Die Abdeckung fehlt bei empty')
  pruefe((await szenario(page, 'empty').getByRole('button', { name: 'Erneut suchen', exact: true }).count()) === 1, 'Erneut suchen fehlt bei empty')

  await suchen(page, 'error', 'Für diesen Tag suchen', 'Die Aktivitätensuche ist fehlgeschlagen.')
  const error = await szenario(page, 'error').innerText()
  pruefe(error.includes('Die Aktivitätensuche ist fehlgeschlagen.'), 'Die Fehlermeldung fehlt')
  pruefe(error.includes('verfügbare Angebote'), 'Die Abdeckung fehlt beim Fehler')
  pruefe((await szenario(page, 'error').getByRole('button', { name: 'Erneut suchen', exact: true }).count()) === 1, 'Erneut suchen fehlt beim Fehler')

  await page.evaluate(() => {
    document.documentElement.style.fontSize = '32px'
  })
  await unavailable.screenshot({ path: join(ARTIFACTS, 'nativ-unavailable-390-200.png') })
  const pruefaktion = unavailable.getByRole('button', { name: 'Suche erneut prüfen', exact: true })
  const kasten = await pruefaktion.boundingBox()
  const masse = await pruefaktion.evaluate((el) => {
    const stil = getComputedStyle(el)
    const box = el.getBoundingClientRect()
    return {
      font: stil.fontSize,
      minHeight: stil.minHeight,
      width: box.width,
      height: box.height,
      top: box.top,
    }
  })
  pruefe(Boolean(kasten && kasten.width >= 44 && kasten.height >= 44), `Die Prüfaktion ist bei 200% Text nicht bedienbar: ${JSON.stringify(masse)}`)
  pruefe(fremd.length === 0, `Fremdanfrage: ${fremd.join(' ')}`)
  pruefe(suchtreffer.every((id) => id.startsWith('stage-')), `Unerwartete Suche: ${suchtreffer.join(',')}`)

  const bericht = { suchtreffer, fremd, unavailable: ACTIVITY_TAG_UNVERFUEGBAR, pruefaktion200: masse }
  writeFileSync(join(ARTIFACTS, 'nativ.json'), JSON.stringify(bericht, null, 2))
  await browser.close()
  server.close()
  console.log(JSON.stringify(bericht))
}

main()
  .catch((fehler) => {
    console.error(fehler)
    process.exitCode = 1
  })
  .finally(() => {
    setTimeout(() => process.exit(process.exitCode ?? 0), 50)
  })
