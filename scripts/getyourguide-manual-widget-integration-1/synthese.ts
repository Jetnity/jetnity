// Synthetischer Lebenszyklus. Kein Anbieter, kein Preview.
// Aufruf: node --import tsx scripts/getyourguide-manual-widget-integration-1/synthese.ts
//
// R2-F1: abgebrochene Orts- und Renderer-Promises bleiben zustellbar.
// R2-F2: die verschachtelte Fläche im echten AktivitaetenBereich, ohne Geschwister-Widget.

import { createServer } from 'node:http'
import { createRequire } from 'node:module'
import { mkdirSync, writeFileSync } from 'node:fs'
import { dirname, join, resolve } from 'node:path'
import { fileURLToPath } from 'node:url'

import { chromium, type Locator, type Page } from 'playwright'

import type { OrtQuelle, OrtZeile, RendererZeile, SyntheseStand } from './synthese-bruecke'

const require = createRequire(import.meta.url)
const esbuild = require('esbuild') as {
  build: (options: Record<string, unknown>) => Promise<void>
}

const ROOT = resolve(dirname(fileURLToPath(import.meta.url)), '../..')
const OUT = '/tmp/gyg-manual-widget-synthese'
const ARTIFACTS = '/opt/cursor/artifacts/gyg-manual-widget'
const LISBON = 'geonames:2267057'
const KRETA = 'geonames:2593313'

function dateiAufloesen(basis: string): string | null {
  const kandidaten = [basis, `${basis}.ts`, `${basis}.tsx`, `${basis}.js`, `${basis}.mjs`]
  const { existsSync } = require('node:fs') as typeof import('node:fs')
  return kandidaten.find((kandidat) => existsSync(kandidat)) ?? null
}

function pruefe(bedingung: boolean, meldung: string) {
  if (!bedingung) throw new Error(meldung)
}

function bereich(page: Page, name: string): Locator {
  return page.locator(`[data-szenario="${name}"]`)
}

function gyg(page: Page, name: string): Locator {
  return bereich(page, name).locator('[aria-label="GetYourGuide"]')
}

async function bundeln() {
  mkdirSync(OUT, { recursive: true })
  await esbuild.build({
    absWorkingDir: ROOT,
    entryPoints: { synthese: 'scripts/getyourguide-manual-widget-integration-1/synthese-flaeche.tsx' },
    bundle: true,
    format: 'iife',
    platform: 'browser',
    target: 'es2022',
    jsx: 'automatic',
    outfile: join(OUT, 'synthese.js'),
    define: { 'process.env.NODE_ENV': '"production"' },
    plugins: [
      {
        name: 'jetnity-alias',
        setup(build: {
          onResolve: (
            args: { filter: RegExp },
            fn: (args: { path: string }) => { path: string } | null,
          ) => void
        }) {
          build.onResolve({ filter: /^@\/lib\/places\/aktionen$/ }, () => ({
            path: join(ROOT, 'scripts/getyourguide-manual-widget-integration-1/synthese-orte.ts'),
          }))
          build.onResolve({ filter: /^@\/lib\/activities\/getyourguide\/renderer$/ }, () => ({
            path: join(ROOT, 'scripts/getyourguide-manual-widget-integration-1/synthese-renderer.ts'),
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

function html(): string {
  return `<!doctype html>
<html lang="de">
<head><meta charset="utf-8" /><title>Synthese</title></head>
<body><div id="root"></div><script src="/synthese.js"></script></body>
</html>`
}

async function stand(page: Page): Promise<SyntheseStand> {
  return page.evaluate(() => {
    const fenster = window as unknown as { __gygSynthese?: { stand: () => SyntheseStand } }
    return fenster.__gygSynthese?.stand() ?? { orte: [], renderer: [], entsorgen: [], uebernahmen: 0, warten: false, sofortFehler: false }
  })
}

async function warteOrt(page: Page, quelle: OrtQuelle, id: string, nach: number): Promise<number> {
  const handle = await page.waitForFunction(
    (erwartet) => {
      const fenster = window as unknown as { __gygSynthese?: { stand: () => { orte: OrtZeile[] } } }
      const liste = fenster.__gygSynthese?.stand().orte ?? []
      const treffer = liste.filter(
        (eintrag) =>
          eintrag.quelle === erwartet.quelle &&
          eintrag.id === erwartet.id &&
          eintrag.operation > erwartet.nach &&
          !eintrag.settled,
      )
      return treffer.at(-1)?.operation ?? false
    },
    { quelle, id, nach },
    { timeout: 8000 },
  )
  return handle.jsonValue()
}

async function warteAbbruch(page: Page, art: 'orte' | 'renderer', operation: number) {
  await page.waitForFunction(
    (erwartet) => {
      const fenster = window as unknown as {
        __gygSynthese?: { stand: () => { orte: OrtZeile[]; renderer: RendererZeile[] } }
      }
      const liste = fenster.__gygSynthese?.stand()[erwartet.art] ?? []
      return liste.some((eintrag) => eintrag.operation === erwartet.operation && eintrag.aborted)
    },
    { art, operation },
    { timeout: 8000 },
  )
}

async function ortAufloesen(page: Page, operation: number, art: 'katalog' | 'fremd' | 'leer'): Promise<boolean> {
  return page.evaluate(
    ({ operation, art }) => {
      const fenster = window as unknown as {
        __gygSynthese: { ortAufloesen: (operation: number, art: 'katalog' | 'fremd' | 'leer') => boolean }
      }
      return fenster.__gygSynthese.ortAufloesen(operation, art)
    },
    { operation, art },
  )
}

async function ortAblehnen(page: Page, operation: number): Promise<boolean> {
  return page.evaluate((operation) => {
    const fenster = window as unknown as { __gygSynthese: { ortAblehnen: (operation: number) => boolean } }
    return fenster.__gygSynthese.ortAblehnen(operation)
  }, operation)
}

async function rendererFrei(page: Page, operation: number, ok: boolean): Promise<boolean> {
  return page.evaluate(
    ({ operation, ok }) => {
      const fenster = window as unknown as {
        __gygSynthese: { rendererFreigeben: (operation: number, ok: boolean) => boolean }
      }
      return fenster.__gygSynthese.rendererFreigeben(operation, ok)
    },
    { operation, ok },
  )
}

async function rendererAblehnen(page: Page, operation: number): Promise<boolean> {
  return page.evaluate((operation) => {
    const fenster = window as unknown as { __gygSynthese: { rendererAblehnen: (operation: number) => boolean } }
    return fenster.__gygSynthese.rendererAblehnen(operation)
  }, operation)
}

async function imDokument(page: Page, operation: number): Promise<boolean> {
  return page.evaluate((operation) => {
    const fenster = window as unknown as { __gygSynthese: { imDokument: (operation: number) => boolean } }
    return fenster.__gygSynthese.imDokument(operation)
  }, operation)
}

async function schalter(page: Page, warten: boolean, fehler: boolean) {
  await page.evaluate(
    ({ warten, fehler }) => {
      const fenster = window as unknown as {
        __gygSynthese: { wartenSetzen: (wert: boolean) => void; fehlerSetzen: (wert: boolean) => void }
      }
      fenster.__gygSynthese.wartenSetzen(warten)
      fenster.__gygSynthese.fehlerSetzen(fehler)
    },
    { warten, fehler },
  )
}

async function zeile(page: Page, art: 'orte' | 'renderer', operation: number): Promise<OrtZeile | RendererZeile | null> {
  const aktuell = await stand(page)
  const liste = aktuell[art]
  return liste.find((eintrag) => eintrag.operation === operation) ?? null
}

async function flaeche(page: Page, name: string) {
  return gyg(page, name).evaluate((el) => ({
    zustand: el.getAttribute('data-gyg-zustand'),
    phase: el.getAttribute('data-gyg-phase'),
    text: el.textContent ?? '',
  }))
}

async function main() {
  mkdirSync(ARTIFACTS, { recursive: true })
  await bundeln()
  const server = createServer((req, res) => {
    const url = new URL(req.url ?? '/', 'http://127.0.0.1')
    if (url.pathname === '/api/activities/search') {
      res.writeHead(200, { 'content-type': 'application/json; charset=utf-8' })
      res.end(
        JSON.stringify({
          status: 'ok',
          message: 'Aktivitäten gefunden.',
          coverageNote: 'Synthetische lokale Abdeckung, kein Anbieter.',
          evidenz: {
            hatOrt: true,
            hatKoordinaten: false,
            hatTag: true,
            hatDatum: false,
            hatBestehendePunkte: false,
            hatBelastbareZeiten: false,
            hatInteressen: false,
            hatBudget: false,
          },
          options: [
            {
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
            },
          ],
        }),
      )
      return
    }
    if (url.pathname === '/synthese.js') {
      res.writeHead(200, { 'content-type': 'text/javascript; charset=utf-8' })
      res.end(require('node:fs').readFileSync(join(OUT, 'synthese.js')))
      return
    }
    res.writeHead(200, { 'content-type': 'text/html; charset=utf-8' })
    res.end(html())
  })
  await new Promise<void>((resolve) => server.listen(0, '127.0.0.1', resolve))
  const adresse = server.address()
  if (!adresse || typeof adresse === 'string') throw new Error('Port fehlt')
  const basis = `http://127.0.0.1:${adresse.port}`
  const browser = await chromium.launch({ headless: true })
  const page = await browser.newPage({ viewport: { width: 1280, height: 900 } })
  const fremd: string[] = []
  page.on('request', (request) => {
    try {
      const host = new URL(request.url()).host
      if (!host.startsWith('127.0.0.1')) fremd.push(request.url())
    } catch {
      fremd.push(request.url())
    }
  })
  const seitenfehler: string[] = []
  page.on('pageerror', (error) => seitenfehler.push(String(error).slice(0, 300)))
  try {
    await page.goto(basis, { waitUntil: 'domcontentloaded' })
    await signalLebenszyklus(page)
    await verschraenkt(page)
    await nativ(page)
    pruefe(fremd.length === 0, `Fremde Anfrage: ${fremd.slice(0, 3).join(' | ')}`)
    pruefe(seitenfehler.length === 0, `Seitenfehler: ${seitenfehler.join(' | ')}`)
    const bericht = { synthetisch: true, liveAnbieter: false, stand: await stand(page), seitenfehler, fremd }
    writeFileSync(join(ARTIFACTS, 'synthese.json'), JSON.stringify(bericht, null, 2))
    console.log('Synthese in Ordnung.')
  } catch (error) {
    const bericht = { fehler: String(error), stand: await stand(page).catch(() => null), seitenfehler, fremd }
    writeFileSync(join(ARTIFACTS, 'synthese.json'), JSON.stringify(bericht, null, 2))
    await page.screenshot({ path: join(ARTIFACTS, 'synthese-fehler.png'), fullPage: true }).catch(() => undefined)
    throw error
  } finally {
    await browser.close()
    await new Promise<void>((resolve, reject) => server.close((error) => (error ? reject(error) : resolve())))
  }
}

async function signalLebenszyklus(page: Page) {
  const wurzel = bereich(page, 'lebenszyklus')
  console.log('signal A1')
  const a1 = await warteOrt(page, 'signal', LISBON, 0)
  await wurzel.getByRole('button', { name: 'Lebenszyklus Kreta' }).click()
  await warteAbbruch(page, 'orte', a1)
  const b = await warteOrt(page, 'signal', KRETA, a1)
  await wurzel.getByRole('button', { name: 'Lebenszyklus Lissabon' }).click()
  await warteAbbruch(page, 'orte', b)
  const a2 = await warteOrt(page, 'signal', LISBON, b)
  pruefe(a2 !== a1, 'A2 hat dieselbe Operation wie A1')
  pruefe((await zeile(page, 'orte', a1))?.id === (await zeile(page, 'orte', a2))?.id, 'A1 und A2 betreffen nicht denselben Ort')
  pruefe(await ortAufloesen(page, a2, 'fremd'), 'Die falsche ID der aktuellen A2 wurde nicht zugestellt')
  await wurzel.getByText('Das Ziel ist nicht bestätigt.').waitFor({ timeout: 8000 })
  await wurzel.getByRole('button', { name: 'Lebenszyklus Kreta' }).click()
  const b2 = await warteOrt(page, 'signal', KRETA, a2)
  pruefe(await ortAufloesen(page, b2, 'katalog'), 'Die aktuelle Kreta-Bestätigung wurde nicht zugestellt')
  await wurzel.getByText('Für die Insel Kreta').waitFor({ timeout: 8000 })
  await wurzel.getByRole('button', { name: 'Lebenszyklus Lissabon' }).click()
  const a3 = await warteOrt(page, 'signal', LISBON, b2)
  pruefe(await ortAufloesen(page, a3, 'katalog'), 'Die aktuelle Lissabon-Bestätigung wurde nicht zugestellt')
  await wurzel.getByText('Für die Stadt Lissabon').waitFor({ timeout: 8000 })
  await schalter(page, false, false)
  await wurzel.getByRole('button', { name: 'Bei GetYourGuide anzeigen' }).click()
  await wurzel.locator('[data-gyg-synthese="stadt"]').waitFor({ timeout: 8000 })
  const vorSpaet = (await stand(page)).entsorgen.length
  const vorText = (await flaeche(page, 'lebenszyklus')).text
  pruefe(await ortAufloesen(page, a1, 'katalog'), 'Die abgebrochene A1 wurde vor der Zustellung verworfen')
  pruefe(await ortAblehnen(page, b), 'Die abgebrochene Kreta-Operation wurde vor der Ablehnung verworfen')
  await page.waitForTimeout(150)
  const nachOrt = await flaeche(page, 'lebenszyklus')
  pruefe(nachOrt.phase === 'anzeige', `Verspäteter Ort hat die Phase auf ${nachOrt.phase} gesetzt`)
  pruefe(nachOrt.text.includes('stadt:Lissabon:PT'), 'Verspäteter Ort hat die aktuelle Darstellung ersetzt')
  pruefe((await stand(page)).entsorgen.length === vorSpaet, 'Verspäteter Ort hat die aktuelle Darstellung entsorgt')
  pruefe((await zeile(page, 'orte', a1))?.zugestellt === true, 'A1 ist nicht als zugestellt vermerkt')
  pruefe((await zeile(page, 'orte', a1))?.aborted === true, 'A1 hat den Abbruch nicht vermerkt')
  pruefe((await zeile(page, 'orte', b))?.zugestellt === true, 'Die alte Kreta-Ablehnung ist nicht zugestellt')
  pruefe(vorText.includes('stadt:Lissabon:PT'), 'Die aktuelle Darstellung fehlte vor der verspäteten Zustellung')

  console.log('signal renderer')
  await schalter(page, true, false)
  await wurzel.getByRole('button', { name: 'Erneut laden' }).click()
  const r1 = (await stand(page)).renderer.filter((eintrag) => !eintrag.settled).at(-1)?.operation
  pruefe(typeof r1 === 'number', 'Die wartende Lissabon-Ladung fehlt')
  await wurzel.getByRole('button', { name: 'Lebenszyklus Kreta' }).click()
  await warteAbbruch(page, 'renderer', r1)
  const kretaOrt = await warteOrt(page, 'signal', KRETA, a3)
  pruefe(await ortAufloesen(page, kretaOrt, 'katalog'), 'Kreta nach dem Renderer-Abbruch fehlt')
  await wurzel.getByText('Für die Insel Kreta').waitFor({ timeout: 8000 })
  await wurzel.getByRole('button', { name: 'Bei GetYourGuide anzeigen' }).click()
  const r2 = (await stand(page)).renderer.filter((eintrag) => !eintrag.settled).at(-1)?.operation
  pruefe(typeof r2 === 'number' && r2 !== r1, 'Die aktuelle Kreta-Ladung fehlt')
  pruefe(await rendererFrei(page, r2, true), 'Die aktuelle Kreta-Ladung wurde nicht zugestellt')
  await wurzel.getByText('insel:Kreta:GR').waitFor({ timeout: 8000 })
  pruefe(await rendererFrei(page, r1, true), 'Die abgebrochene Lissabon-Ladung wurde nicht zugestellt')
  await page.waitForTimeout(150)
  const nachR1 = await flaeche(page, 'lebenszyklus')
  pruefe(nachR1.phase === 'anzeige', `Verspätete Ladung hat die Phase auf ${nachR1.phase} gesetzt`)
  pruefe(nachR1.text.includes('insel:Kreta:GR'), 'Verspätete Ladung hat Kreta ersetzt')
  pruefe(!nachR1.text.includes(`spaet-ok-${r1}`), 'Die verspätete Lissabon-Ladung steht in der aktuellen Fläche')
  pruefe((await imDokument(page, r1)) === false, 'Die verspätete Lissabon-Ladung hängt wieder im Dokument')

  await wurzel.getByRole('button', { name: 'Erneut laden' }).click()
  const r3 = (await stand(page)).renderer.filter((eintrag) => !eintrag.settled).at(-1)?.operation
  pruefe(typeof r3 === 'number', 'Die zweite wartende Ladung fehlt')
  await wurzel.getByRole('button', { name: 'Lebenszyklus Lissabon' }).click()
  await warteAbbruch(page, 'renderer', r3)
  const lisbonNeu = await warteOrt(page, 'signal', LISBON, kretaOrt)
  pruefe(await ortAufloesen(page, lisbonNeu, 'katalog'), 'Lissabon nach der zweiten Ladung fehlt')
  await wurzel.getByRole('button', { name: 'Bei GetYourGuide anzeigen' }).click()
  const r4 = (await stand(page)).renderer.filter((eintrag) => !eintrag.settled).at(-1)?.operation
  pruefe(typeof r4 === 'number', 'Die neue Lissabon-Ladung fehlt')
  pruefe(await rendererFrei(page, r4, true), 'Die neue Lissabon-Ladung wurde nicht zugestellt')
  await wurzel.getByText('stadt:Lissabon:PT').waitFor({ timeout: 8000 })
  pruefe(await rendererAblehnen(page, r3), 'Die abgebrochene Ladung wurde vor der Ablehnung verworfen')
  await page.waitForTimeout(150)
  const nachR3 = await flaeche(page, 'lebenszyklus')
  pruefe(nachR3.phase === 'anzeige', `Verspätete Ablehnung hat die Phase auf ${nachR3.phase} gesetzt`)
  pruefe(nachR3.text.includes('stadt:Lissabon:PT'), 'Verspätete Ablehnung hat Lissabon ersetzt')
  pruefe(!nachR3.text.includes('konnte gerade nicht geladen werden'), 'Verspätete Ablehnung zeigt einen Fehler')

  console.log('unmount')
  await schalter(page, true, false)
  await wurzel.getByRole('button', { name: 'Erneut laden' }).click()
  const r5 = (await stand(page)).renderer.filter((eintrag) => !eintrag.settled).at(-1)?.operation
  pruefe(typeof r5 === 'number', 'Die Ladung vor dem Aushängen fehlt')
  const entsorgenVorher = (await stand(page)).entsorgen.length
  await wurzel.getByRole('button', { name: 'Lebenszyklus ausblenden' }).click()
  await warteAbbruch(page, 'renderer', r5)
  pruefe((await imDokument(page, r5)) === false, 'Der ausgehängte Knoten blieb verbunden')
  pruefe((await stand(page)).entsorgen.length > entsorgenVorher, 'Aushängen hat nicht entsorgt')
  pruefe((await wurzel.getByText('stale-dispose').count()) === 0, 'Die feindliche Entsorgung hängt den Knoten wieder ein')
  pruefe(await rendererFrei(page, r5, true), 'Die Ladung nach dem Aushängen wurde nicht zugestellt')
  await page.waitForTimeout(150)
  pruefe((await imDokument(page, r5)) === false, 'Die verspätete Ladung hängt den ausgehängten Knoten wieder ein')
  pruefe((await wurzel.getByText(`spaet-ok-${r5}`).count()) === 0, 'Die verspätete Ladung erscheint nach dem Aushängen')
  await wurzel.getByRole('button', { name: 'Lebenszyklus ausblenden' }).click()
  const neu = await warteOrt(page, 'signal', LISBON, lisbonNeu)
  const wieder = await flaeche(page, 'lebenszyklus')
  pruefe(wieder.zustand === 'ort_ausstehend', `Wiederaufnahme startet in ${wieder.zustand}`)
  pruefe(!wieder.text.includes(`spaet-ok-${r5}`), 'Die alte Ladung gehört zur neuen Fläche')
  pruefe(await ortAufloesen(page, neu, 'katalog'), 'Die neue Lissabon-Bestätigung fehlt')
  await schalter(page, false, false)
  await wurzel.getByRole('button', { name: 'Bei GetYourGuide anzeigen' }).click()
  await wurzel.locator('[data-gyg-synthese="stadt"]').waitFor({ timeout: 8000 })

  console.log('gleichzeitig')
  await bereich(page, 'gleichzeitig').getByRole('button', { name: 'Gleichzeitig zeigen' }).click()
  const zweite = await warteOrt(page, 'signal', KRETA, neu)
  pruefe(await ortAufloesen(page, zweite, 'katalog'), 'Die zweite Instanz wurde nicht bestätigt')
  const kretaFlaeche = bereich(page, 'gleichzeitig')
  await kretaFlaeche.getByRole('button', { name: 'Bei GetYourGuide anzeigen' }).click()
  await kretaFlaeche.locator('[data-gyg-synthese="insel"]').waitFor({ timeout: 8000 })
  await wurzel.getByRole('button', { name: 'Entfernen' }).click()
  pruefe((await wurzel.locator('[data-gyg-synthese]').count()) === 0, 'Entfernen lässt die erste Instanz stehen')
  pruefe((await kretaFlaeche.locator('[data-gyg-synthese="insel"]').count()) === 1, 'Entfernen der ersten Instanz löscht die zweite')
  await kretaFlaeche.getByRole('button', { name: 'Entfernen' }).click()
}

async function verschraenkt(page: Page) {
  console.log('verschraenkt')
  const wurzel = bereich(page, 'verschraenkt')
  const a1 = await warteOrt(page, 'aktion', LISBON, 0)
  await wurzel.getByRole('radio', { name: 'Tag Kreta' }).click()
  const b = await warteOrt(page, 'aktion', KRETA, a1)
  await wurzel.getByRole('radio', { name: 'Tag Lissabon' }).click()
  const a2 = await warteOrt(page, 'aktion', LISBON, b)
  pruefe(a2 !== a1, 'Die verschachtelte A2 hat dieselbe Operation wie A1')
  pruefe((await zeile(page, 'orte', a2))?.id === LISBON && (await zeile(page, 'orte', a1))?.id === LISBON, 'A1/A2 sind nicht derselbe Ort')
  pruefe(await ortAufloesen(page, a2, 'katalog'), 'Die verschachtelte A2 wurde nicht zugestellt')
  await gyg(page, 'verschraenkt').getByText('Für die Stadt Lissabon').waitFor({ timeout: 8000 })
  await schalter(page, false, false)
  await gyg(page, 'verschraenkt').getByRole('button', { name: 'Bei GetYourGuide anzeigen' }).click()
  await wurzel.locator('[data-gyg-synthese="stadt"]').waitFor({ timeout: 8000 })
  const entsorgen = (await stand(page)).entsorgen.length
  pruefe(await ortAufloesen(page, a1, 'katalog'), 'Die verschachtelte A1 wurde vor der Zustellung verworfen')
  pruefe(await ortAblehnen(page, b), 'Die verschachtelte Kreta-Operation wurde vor der Ablehnung verworfen')
  await page.waitForTimeout(150)
  const nachher = await flaeche(page, 'verschraenkt')
  pruefe(nachher.phase === 'anzeige', `Verschachtelte Verspätung setzt Phase ${nachher.phase}`)
  pruefe(nachher.text.includes('stadt:Lissabon:PT'), 'Verschachtelte Verspätung ersetzt Lissabon')
  pruefe((await stand(page)).entsorgen.length === entsorgen, 'Verschachtelte Verspätung entsorgt die aktuelle Darstellung')
  const grenze = await page.evaluate(() => {
    const szenario = document.querySelector('[data-szenario="verschraenkt"]')
    const section = szenario?.querySelector('section[aria-label="Aktivitäten"]')
    const imSzenario = [...document.querySelectorAll('[aria-label="GetYourGuide"]')].filter((el) => szenario?.contains(el))
    const inSection = imSzenario.filter((el) => section?.contains(el))
    return { section: Boolean(section), imSzenario: imSzenario.length, inSection: inSection.length }
  })
  pruefe(grenze.section && grenze.imSzenario === 1 && grenze.inSection === 1, `Verschachtelte Grenze ${JSON.stringify(grenze)}`)
  await wurzel.getByRole('button', { name: 'Verschränkt ausblenden' }).click()
}

async function nativ(page: Page) {
  console.log('nativ')
  const wurzel = bereich(page, 'nativ')
  const vorher = (await stand(page)).orte.reduce((max, eintrag) => Math.max(max, eintrag.operation), 0)
  await wurzel.getByRole('button', { name: 'Native Fläche zeigen' }).click()
  const grenze = await page.evaluate(() => {
    const szenario = document.querySelector('[data-szenario="nativ"]')
    const section = szenario?.querySelector('section[aria-label="Aktivitäten"]')
    const imSzenario = [...document.querySelectorAll('[aria-label="GetYourGuide"]')].filter((el) => szenario?.contains(el))
    const inSection = imSzenario.filter((el) => section?.contains(el))
    return { section: Boolean(section), imSzenario: imSzenario.length, inSection: inSection.length }
  })
  pruefe(
    grenze.section && grenze.imSzenario === 1 && grenze.inSection === 1,
    `Native Grenze ${JSON.stringify(grenze)}`,
  )
  await wurzel.getByRole('button', { name: 'Für diesen Tag suchen' }).click()
  await wurzel.getByText('Synthetische Bootsfahrt').waitFor({ timeout: 8000 })
  const uebernehmen = wurzel.getByRole('button', { name: 'In die Reise' })
  await uebernehmen.click()
  await page.waitForTimeout(100)
  pruefe((await stand(page)).uebernahmen === 1, 'Die Übernahme hat nicht genau einmal gemeldet')
  pruefe(await uebernehmen.isDisabled(), 'Die Übernahme zeigt den laufenden Zustand nicht')
  pruefe((await wurzel.getByText('Die Übernahme wurde gemeldet.').count()) === 0, 'Die Übernahme ist schon vor dem Abschluss gemeldet')
  const ort = await warteOrt(page, 'aktion', LISBON, vorher)
  pruefe(await ortAufloesen(page, ort, 'katalog'), 'Die native Ortsbestätigung wurde nicht zugestellt')
  await wurzel.getByRole('button', { name: 'Bei GetYourGuide anzeigen' }).waitFor({ timeout: 8000 })
  const knopfInnen = await page.evaluate(() => {
    const section = document.querySelector('[data-szenario="nativ"] section[aria-label="Aktivitäten"]')
    const knopf = [...(section?.querySelectorAll('button') ?? [])].find((el) =>
      (el.textContent ?? '').includes('Bei GetYourGuide anzeigen'),
    )
    return Boolean(section && knopf && section.contains(knopf))
  })
  pruefe(knopfInnen, 'Die GetYourGuide-Aktion liegt ausserhalb der Aktivitätsfläche')
  await schalter(page, false, true)
  await wurzel.getByRole('button', { name: 'Bei GetYourGuide anzeigen' }).click()
  await wurzel.getByText('GetYourGuide konnte gerade nicht geladen werden.').waitFor({ timeout: 8000 })
  pruefe((await stand(page)).uebernahmen === 1, 'Der Ladefehler hat die Übernahme erneut gemeldet')
  await schalter(page, true, false)
  await wurzel.getByRole('button', { name: 'Erneut versuchen' }).click()
  const laufend = (await stand(page)).renderer.filter((eintrag) => !eintrag.settled).at(-1)?.operation
  pruefe(typeof laufend === 'number', 'Die wiederholte Ladung fehlt')
  await wurzel.getByRole('button', { name: 'Ideen für ein bestätigtes Land' }).click()
  await warteAbbruch(page, 'renderer', laufend)
  const land = await warteOrt(page, 'aktion', LISBON, ort)
  pruefe(land !== ort, 'Der Länderwechsel hat keine neue Ortsoperation geöffnet')
  pruefe(await ortAufloesen(page, land, 'katalog'), 'Die Länderbestätigung wurde nicht zugestellt')
  await wurzel.getByText('Wähle ein bestätigtes Land').waitFor({ timeout: 8000 })
  await wurzel.getByRole('radio', { name: 'Portugal' }).click()
  await wurzel.getByText('Ideen für Portugal').waitFor({ timeout: 8000 })
  await wurzel.getByRole('button', { name: 'Bei GetYourGuide anzeigen' }).click()
  const landLauf = (await stand(page)).renderer.filter((eintrag) => !eintrag.settled).at(-1)?.operation
  pruefe(typeof landLauf === 'number', 'Die Länderladung fehlt')
  pruefe(await rendererFrei(page, landLauf, true), 'Die Länderladung wurde nicht zugestellt')
  await wurzel.getByText('land:Portugal:PT').waitFor({ timeout: 8000 })
  pruefe(await rendererFrei(page, laufend, true), 'Die abgebrochene Stadtladung wurde nicht zugestellt')
  await page.waitForTimeout(150)
  const nachLand = await flaeche(page, 'nativ')
  pruefe(nachLand.phase === 'anzeige', `Verspätete Stadtladung setzt Phase ${nachLand.phase}`)
  pruefe(nachLand.text.includes('land:Portugal:PT'), 'Verspätete Stadtladung ersetzt das Land')
  pruefe(!nachLand.text.includes(`spaet-ok-${laufend}`), 'Die verspätete Stadtladung steht in der Länderfläche')
  pruefe((await imDokument(page, laufend)) === false, 'Die verspätete Stadtladung hängt wieder im Dokument')
  await schalter(page, true, false)
  await wurzel.getByRole('button', { name: 'Erneut laden' }).click()
  const alt = (await stand(page)).renderer.filter((eintrag) => !eintrag.settled).at(-1)?.operation
  pruefe(typeof alt === 'number', 'Die Ladung vor der Rückkehr fehlt')
  await wurzel.getByRole('button', { name: 'Zurück zum Reisetag' }).click()
  await warteAbbruch(page, 'renderer', alt)
  const tag = await warteOrt(page, 'aktion', LISBON, land)
  pruefe(await rendererAblehnen(page, alt), 'Die abgebrochene Länderladung wurde vor der Ablehnung verworfen')
  await page.waitForTimeout(150)
  pruefe(await ortAufloesen(page, tag, 'katalog'), 'Die Rückkehr zum Reisetag wurde nicht bestätigt')
  await wurzel.getByText('Für die Stadt Lissabon').waitFor({ timeout: 8000 })
  const zurueck = await flaeche(page, 'nativ')
  pruefe(zurueck.phase !== 'fehler', 'Die verspätete Länderablehnung markiert den Reisetag als Fehler')
  pruefe((await stand(page)).uebernahmen === 1, 'Der Kontextwechsel hat die Übernahme erneut gemeldet')
  pruefe(await uebernehmen.isDisabled(), 'Die Übernahme wurde vor dem Abschluss freigegeben')
  pruefe((await wurzel.getByText('Synthetische Bootsfahrt').count()) === 1, 'Die native Karte fehlt während GetYourGuide läuft')
  pruefe((await wurzel.getByText('Die Übernahme wurde gemeldet.').count()) === 0, 'Die Übernahme wurde vorzeitig gemeldet')
  await wurzel.getByRole('button', { name: 'Übernahme abschliessen' }).click()
  await wurzel.getByText('Die Übernahme wurde gemeldet.').waitFor({ timeout: 8000 })
  pruefe((await stand(page)).uebernahmen === 1, 'Der Abschluss hat eine zweite Übernahme gezählt')
  await schalter(page, false, false)
  await wurzel.getByRole('button', { name: 'Bei GetYourGuide anzeigen' }).click()
  await wurzel.locator('[data-gyg-synthese="stadt"]').waitFor({ timeout: 8000 })
  await wurzel.getByRole('button', { name: 'Entfernen' }).click()
  pruefe((await wurzel.locator('[data-gyg-synthese]').count()) === 0, 'Entfernen lässt den Rahmen in der Aktivitätsfläche stehen')
  pruefe((await wurzel.getByText('Synthetische Bootsfahrt').count()) === 1, 'Die angenommene Karte fehlt nach dem Entfernen')
  pruefe((await wurzel.getByText('Die Übernahme wurde gemeldet.').count()) === 1, 'Die Übernahmemeldung fehlt nach dem Entfernen')
  await page.screenshot({ path: join(ARTIFACTS, 'synthese-nativ.png'), fullPage: true })
}

main().catch((error) => {
  console.error(error)
  process.exitCode = 1
})
