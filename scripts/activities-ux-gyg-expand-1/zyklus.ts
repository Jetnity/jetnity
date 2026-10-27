// Montierter Widget-Lebenszyklus ohne Anbieter.
// Aufruf: node --import tsx scripts/activities-ux-gyg-expand-1/zyklus.ts

import { createServer } from 'node:http'
import { createRequire } from 'node:module'
import { mkdirSync, readFileSync, writeFileSync } from 'node:fs'
import { dirname, join, resolve } from 'node:path'
import { fileURLToPath } from 'node:url'

import { chromium, type Page } from 'playwright'

const require = createRequire(import.meta.url)
const esbuild = require('esbuild') as { build: (options: Record<string, unknown>) => Promise<void> }
const ROOT = resolve(dirname(fileURLToPath(import.meta.url)), '../..')
const OUT = '/tmp/activities-ux-gyg-expand-1-zyklus'
const ARTIFACTS = '/opt/cursor/artifacts/activities-ux-gyg-expand-1'

function pruefe(bedingung: boolean, meldung: string) {
  if (!bedingung) throw new Error(meldung)
}

function dateiAufloesen(basis: string): string | null {
  const { existsSync, statSync } = require('node:fs') as typeof import('node:fs')
  const kandidaten = ['.ts', '.tsx', '.js', '.mjs'].flatMap((endung) => [basis + endung, join(basis, `index${endung}`)])
  return kandidaten.find((kandidat) => existsSync(kandidat) && statSync(kandidat).isFile()) ?? null
}

type Zeile = { id: number; anzahl: number | null; pfad: string; aborted: boolean; settled: boolean }

async function stand(page: Page): Promise<Zeile[]> {
  return page.evaluate(() => {
    const fenster = window as unknown as { __ux?: { zeilen: () => Zeile[] } }
    return fenster.__ux?.zeilen() ?? []
  })
}

async function warten(page: Page, id: number) {
  await page.waitForFunction(
    (erwartet) => {
      const fenster = window as unknown as { __ux?: { zeilen: () => { id: number }[] } }
      return (fenster.__ux?.zeilen() ?? []).some((zeile) => zeile.id === erwartet)
    },
    id,
    { timeout: 8000 },
  )
}

async function frei(page: Page, id: number, ok = true) {
  await page.evaluate(
    ({ id, ok }) => {
      const fenster = window as unknown as { __ux: { freigeben: (id: number, ok: boolean) => void } }
      fenster.__ux.freigeben(id, ok)
    },
    { id, ok },
  )
}

async function imDokument(page: Page, id: number): Promise<boolean> {
  return page.evaluate((id) => {
    const fenster = window as unknown as { __ux: { imDokument: (id: number) => boolean } }
    return fenster.__ux.imDokument(id)
  }, id)
}

async function bundeln() {
  mkdirSync(OUT, { recursive: true })
  await esbuild.build({
    absWorkingDir: ROOT,
    entryPoints: { zyklus: 'scripts/activities-ux-gyg-expand-1/zyklus-flaeche.tsx' },
    bundle: true,
    format: 'iife',
    platform: 'browser',
    target: 'es2022',
    jsx: 'automatic',
    outfile: join(OUT, 'zyklus.js'),
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

async function main() {
  mkdirSync(ARTIFACTS, { recursive: true })
  await bundeln()
  const fremd: string[] = []
  const server = createServer((req, res) => {
    const url = new URL(req.url ?? '/', 'http://127.0.0.1')
    if (url.pathname === '/zyklus.js') {
      res.writeHead(200, { 'content-type': 'text/javascript; charset=utf-8' })
      res.end(readFileSync(join(OUT, 'zyklus.js')))
      return
    }
    if (url.pathname.startsWith('/embed/')) {
      fremd.push(url.pathname + url.search)
    }
    res.writeHead(200, { 'content-type': 'text/html; charset=utf-8' })
    res.end('<!doctype html><html lang="de"><head><meta charset="utf-8"><title>Zyklus</title></head><body><div id="root"></div><script src="/zyklus.js"></script></body></html>')
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
  page.on('pageerror', (fehler) => console.log('PAGE', fehler.message))
  page.on('console', (meldung) => {
    if (meldung.type() === 'error') console.log('CON', meldung.text())
  })
  await page.goto(`http://127.0.0.1:${adresse.port}/`, { waitUntil: 'domcontentloaded' })
  const bangkok = page.locator('[data-szenario="bangkok"]')
  await bangkok.getByRole('button', { name: 'Bei GetYourGuide anzeigen', exact: true }).waitFor({ timeout: 8000 })
  await page.waitForTimeout(300)
  pruefe((await stand(page)).length === 0, 'Vor dem Anzeigen wurde geladen')
  pruefe(fremd.length === 0, `Fremdanfrage vor dem Anzeigen: ${fremd.join(' ')}`)

  await bangkok.getByRole('button', { name: 'Bei GetYourGuide anzeigen', exact: true }).click()
  const vorher = await bangkok.locator('[aria-label="GetYourGuide"]').evaluate((el) => ({
    phase: el.getAttribute('data-gyg-phase'),
    zustand: el.getAttribute('data-gyg-zustand'),
    text: (el.textContent ?? '').slice(0, 240),
  }))
  console.log('nach-klick', JSON.stringify(vorher), JSON.stringify(await stand(page)))
  await warten(page, 1)
  const erste = (await stand(page))[0]
  pruefe(erste?.anzahl === 12, `Erste Anzahl ist ${erste?.anzahl}`)
  pruefe(erste?.pfad.includes('anzahl=12') === true, `Erster Pfad: ${erste?.pfad}`)
  pruefe(erste?.pfad.includes('name=Bangkok') === true, `Ziel fehlt: ${erste?.pfad}`)
  pruefe(erste?.pfad.includes('2MQHT6Z') === false, 'Der Partner steht im Elternpfad')
  pruefe(erste?.pfad.includes('private-canary') === false, 'Der Kanarienvogel steht im Pfad')
  await frei(page, 1, true)
  await bangkok.getByRole('button', { name: 'Mehr Aktivitäten anzeigen', exact: true }).waitFor({ timeout: 8000 })
  pruefe(await bangkok.locator('[data-gyg-phase="anzeige"]').count() === 1, 'Phase anzeige fehlt')
  pruefe((await bangkok.getByRole('button', { name: 'Weniger anzeigen', exact: true }).count()) === 0, 'Weniger erscheint schon bei 12')

  await bangkok.getByRole('button', { name: 'Mehr Aktivitäten anzeigen', exact: true }).click()
  await warten(page, 2)
  const zweite = (await stand(page))[1]
  pruefe(zweite?.anzahl === 24, `Zweite Anzahl ist ${zweite?.anzahl}`)
  pruefe(zweite?.pfad.includes('anzahl=24') === true, `Zweiter Pfad: ${zweite?.pfad}`)
  pruefe(zweite?.pfad.includes('name=Bangkok') === true, 'Das Ziel hat sich beim Mehr geändert')
  pruefe((await stand(page))[0]?.aborted === true, 'Der erste Rahmen wurde nicht abgebrochen')
  pruefe((await imDokument(page, 1)) === false, 'Der erste Rahmen bleibt sichtbar')
  await frei(page, 1, true)
  pruefe((await imDokument(page, 1)) === false, 'Die verspätete erste Antwort hängt sich wieder ein')
  await frei(page, 2, true)
  await bangkok.getByRole('button', { name: 'Weniger anzeigen', exact: true }).waitFor({ timeout: 8000 })
  pruefe((await bangkok.getByRole('button', { name: 'Mehr Aktivitäten anzeigen', exact: true }).count()) === 0, 'Mehr bleibt bei 24 sichtbar')
  const hinweis = await bangkok.innerText()
  pruefe(hinweis.includes('12 weitere') === false, 'Die Fläche behauptet eine ungesehene Anzahl')
  pruefe(hinweis.includes('Jetnity zählt sie nicht'), 'Der ehrliche Zählsatz fehlt')

  await bangkok.getByRole('button', { name: 'Weniger anzeigen', exact: true }).click()
  await warten(page, 3)
  pruefe((await stand(page))[2]?.anzahl === 12, 'Weniger stellt nicht 12 her')
  pruefe((await stand(page))[1]?.aborted === true, 'Der erweiterte Rahmen bleibt aktiv')
  await frei(page, 3, true)
  await bangkok.getByRole('button', { name: 'Entfernen', exact: true }).click()
  await bangkok.locator('[data-gyg-phase="ruhend"]').waitFor({ timeout: 8000 })
  pruefe((await imDokument(page, 3)) === false, 'Entfernen lässt den Rahmen stehen')
  pruefe((await bangkok.locator('[data-gyg-anzahl="12"]').count()) === 1, 'Entfernen behält die erweiterte Anzahl')

  await page.getByRole('button', { name: 'Zweite Instanz zeigen', exact: true }).click()
  const kreta = page.locator('[data-szenario="kreta"]')
  await kreta.getByRole('button', { name: 'Bei GetYourGuide anzeigen', exact: true }).click()
  await warten(page, 4)
  await bangkok.getByRole('button', { name: 'Bei GetYourGuide anzeigen', exact: true }).click()
  await warten(page, 5)
  await frei(page, 5, true)
  await kreta.getByRole('button', { name: 'Entfernen', exact: true }).click()
  pruefe((await stand(page))[3]?.aborted === true, 'Entfernen der zweiten Instanz bricht sie nicht ab')
  pruefe(await imDokument(page, 5), 'Entfernen der zweiten Instanz löscht die erste')
  pruefe((await stand(page))[4]?.pfad.includes('name=Bangkok') === true, 'Die erste Instanz hat das zweite Ziel übernommen')
  pruefe((await stand(page))[3]?.pfad.includes('name=Kreta') === true, 'Die Insel fehlt')
  pruefe(fremd.length === 0, `Fremdanfrage: ${fremd.join(' ')}`)

  const bericht = { zeilen: await stand(page), fremd }
  writeFileSync(join(ARTIFACTS, 'zyklus.json'), JSON.stringify(bericht, null, 2))
  await page.screenshot({ path: join(ARTIFACTS, 'zyklus-390.png'), fullPage: true })
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
