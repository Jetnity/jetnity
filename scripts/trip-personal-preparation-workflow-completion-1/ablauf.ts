// Lokale Montage der eigenen Vorbereitung.
// CSS kommt aus dem Production-Build. Das ist keine Geräte-, Zoom- oder Screenreader-Prüfung.

import { spawnSync } from 'node:child_process'
import { createHash } from 'node:crypto'
import { existsSync, mkdirSync, mkdtempSync, readdirSync, readFileSync, writeFileSync } from 'node:fs'
import { tmpdir } from 'node:os'
import { join } from 'node:path'
import { chromium, type Browser, type Page } from 'playwright'

import { beispielreise } from '@/lib/reiseaenderung/fixtures/reise'
import { preparationEpoch } from '@/lib/readiness/personal-preparation-workflow'
import type { Trip, TripReadinessItem } from '@/types/trips'

const QUELLEN = [
  'components/trips/EigeneReisevorbereitung.tsx',
  'components/trips/usePersonalPreparationLifecycle.ts',
  'components/trips/Reisevorbereitung.tsx',
  'components/trips/TripWorkspace.tsx',
  'components/trips/KontoArbeitsbereich.tsx',
  'components/trips/GastArbeitsbereich.tsx',
  'lib/readiness/personal-preparation-workflow.ts',
  'lib/trips/gastspeicher.ts',
  'scripts/trip-personal-preparation-workflow-completion-1/flaeche.tsx',
]

const BREITEN = [320, 360, 390, 768, 1280] as const

function git(args: string[]): string {
  const ergebnis = spawnSync('git', args, { encoding: 'utf8' })
  if (ergebnis.status !== 0) throw new Error(ergebnis.stderr || ergebnis.stdout)
  return ergebnis.stdout.trim()
}

function neueAusgabe(): string {
  const index = process.argv.indexOf('--ausgabe')
  const ziel = index >= 0 ? process.argv[index + 1] : ''
  if (!ziel) throw new Error('Aufruf braucht --ausgabe <neues Verzeichnis>')
  if (existsSync(ziel)) throw new Error(`Ausgabe existiert bereits und wird nicht überschrieben: ${ziel}`)
  mkdirSync(ziel, { recursive: true })
  return ziel
}

function cssDateien(ordner: string, treffer: string[] = []): string[] {
  for (const eintrag of readdirSync(ordner, { withFileTypes: true })) {
    const pfad = join(ordner, eintrag.name)
    if (eintrag.isDirectory()) cssDateien(pfad, treffer)
    else if (eintrag.name.endsWith('.css')) treffer.push(pfad)
  }
  return treffer
}

function sha256(inhalt: Buffer | string): string {
  return createHash('sha256').update(inhalt).digest('hex')
}

function cssLesen(): { text: string; sha256: string; dateien: { pfad: string; sha256: string; bytes: number }[] } {
  const basis = join('.next', 'static')
  if (!existsSync(basis)) throw new Error('Production-CSS fehlt. Zuerst den Build ausführen.')
  const dateien = cssDateien(basis).sort()
  if (dateien.length === 0) throw new Error('Production-CSS fehlt. Zuerst den Build ausführen.')
  const eintraege = dateien.map((pfad) => {
    const inhalt = readFileSync(pfad)
    return { pfad, sha256: sha256(inhalt), bytes: inhalt.length, text: inhalt.toString('utf8') }
  })
  const text = eintraege.map((eintrag) => eintrag.text).join('\n')
  return {
    text,
    sha256: sha256(text),
    dateien: eintraege.map(({ pfad, sha256: summe, bytes }) => ({ pfad, sha256: summe, bytes })),
  }
}

function punkt(reise: Trip, clientRef: string, title: string, fingerprint?: string): TripReadinessItem {
  const roh: TripReadinessItem = {
    id: clientRef,
    clientRef,
    kind: 'preparation',
    userStatus: 'open',
    evidence: 'user',
    countryCode: null,
    tripItemId: null,
    title,
    travellerClientRef: null,
    contextFingerprint: 'platzhalter',
    createdAt: '2026-10-04T20:00:00.000Z',
    updatedAt: '2026-10-04T20:00:00.000Z',
  }
  return { ...roh, contextFingerprint: fingerprint ?? preparationEpoch(reise, roh) }
}

function reisen(): Record<string, Trip> {
  const basis = beispielreise({ id: 'montage-reise', readinessItems: [] })
  const lang = 'Reiseadapter und lange ungebrocheneZeichenfolge'.padEnd(80, 'W').slice(0, 80)
  const aktuell = punkt(basis, 'preparation-lang', lang)
  const veraltet = punkt(basis, 'preparation-stale', 'Adapter erneut prüfen', 'v4|sha256:alt')
  return {
    leer: basis,
    lang: beispielreise({ id: basis.id, readinessItems: [aktuell, veraltet] }),
    suche: beispielreise({ id: basis.id, readinessItems: [punkt(basis, 'preparation-alpha', 'Alpha')] }),
  }
}

function dokument(bundle: string, start: unknown): string {
  return `<!doctype html><html lang="de"><head><meta charset="utf-8"></head><body style="margin:0"><div id="root"></div><script>window.__START__ = ${JSON.stringify(start)}</script><script>${readFileSync(bundle, 'utf8')}</script></body></html>`
}

async function messen(page: Page) {
  return page.evaluate(() => {
    const wurzel = document.querySelector<HTMLElement>('[data-personal-preparation-root]')
    const titel = document.querySelector<HTMLElement>('[data-personal-client-ref] p')
    const knopf = document.querySelector<HTMLElement>('[data-personal-preparation-create] button')
    const wurzelStil = wurzel ? getComputedStyle(wurzel) : null
    const titelStil = titel ? getComputedStyle(titel) : null
    const knopfStil = knopf ? getComputedStyle(knopf) : null
    const html = getComputedStyle(document.documentElement)
    const body = getComputedStyle(document.body)
    return {
      rootSchrift: html.fontSize,
      htmlOverflow: html.overflow,
      bodyOverflow: body.overflow,
      bewegung: window.matchMedia('(prefers-reduced-motion: reduce)').matches,
      wurzel: wurzel
        ? {
            overflow: wurzelStil?.overflow ?? '',
            clientWidth: wurzel.clientWidth,
            scrollWidth: wurzel.scrollWidth,
          }
        : null,
      titel: titel
        ? { overflowWrap: titelStil?.overflowWrap ?? '', text: titel.textContent ?? '' }
        : null,
      knopf: knopf
        ? {
            hoehe: knopf.getBoundingClientRect().height,
            hintergrund: knopfStil?.backgroundColor ?? '',
            minHoehe: knopfStil?.minHeight ?? '',
          }
        : null,
      dokument: {
        clientWidth: document.documentElement.clientWidth,
        scrollWidth: document.documentElement.scrollWidth,
      },
    }
  })
}

function pruefen(name: string, mass: Awaited<ReturnType<typeof messen>>, schrift: string) {
  if (!mass.wurzel || !mass.knopf) throw new Error(`${name}: Vorbereitung oder Knopf fehlt`)
  if (mass.rootSchrift !== schrift) throw new Error(`${name}: Root-Schrift ${mass.rootSchrift} statt ${schrift}`)
  if (mass.wurzel.overflow === 'hidden') throw new Error(`${name}: die eigene Liste verbirgt Überlauf`)
  if (mass.htmlOverflow === 'hidden' || mass.bodyOverflow === 'hidden') {
    throw new Error(`${name}: Seite verbirgt Überlauf (${mass.htmlOverflow}/${mass.bodyOverflow})`)
  }
  if (mass.wurzel.scrollWidth > mass.wurzel.clientWidth + 1) {
    throw new Error(`${name}: Liste ${mass.wurzel.scrollWidth}px bei ${mass.wurzel.clientWidth}px`)
  }
  if (mass.dokument.scrollWidth > mass.dokument.clientWidth + 1) {
    throw new Error(`${name}: Dokument ${mass.dokument.scrollWidth}px bei ${mass.dokument.clientWidth}px`)
  }
  if (mass.knopf.hoehe < 44) throw new Error(`${name}: Knopfhöhe ${mass.knopf.hoehe}px`)
  if (mass.knopf.hintergrund === 'rgba(0, 0, 0, 0)' || mass.knopf.hintergrund === 'transparent') {
    throw new Error(`${name}: Production-CSS färbt den Knopf nicht`)
  }
  if (mass.titel && mass.titel.overflowWrap !== 'break-word') {
    throw new Error(`${name}: Titel overflow-wrap ${mass.titel.overflowWrap}`)
  }
}

async function statusPerTastatur(page: Page, clientRef: string) {
  const zeile = page.locator(`[data-personal-client-ref="${clientRef}"]`)
  const vor = await page.evaluate(() => window.__PERSONAL__.setzen.length)
  await zeile.getByRole('button', { name: 'Status ändern' }).focus()
  await page.keyboard.press('Enter')
  await page.waitForFunction(
    (ref) => document.activeElement?.textContent === 'Offen'
      && document.querySelector(`[data-personal-client-ref="${ref}"]`)?.getAttribute('data-readiness-status') === 'open',
    clientRef,
  )
  await page.keyboard.press('Tab')
  await page.keyboard.press('Enter')
  await page.waitForFunction(
    (ref) => {
      const knoten = document.querySelector(`[data-personal-client-ref="${ref}"]`)
      return knoten?.querySelector('button[aria-pressed="true"]')?.textContent === 'Erledigt'
        && knoten.getAttribute('data-readiness-status') === 'open'
    },
    clientRef,
  )
  const nach = await page.evaluate(() => window.__PERSONAL__.setzen.length)
  if (nach !== vor) throw new Error(`Statuswahl hat geschrieben: ${vor} -> ${nach}`)
}

async function szene(page: Page, name: string, css: string, bundle: string, start: unknown, schrift: string | null) {
  await page.setContent(dokument(bundle, start), { waitUntil: 'domcontentloaded' })
  await page.addStyleTag({ content: css })
  if (schrift) await page.addStyleTag({ content: `html{font-size:${schrift} !important}` })
  await page.waitForFunction(() => window.__PERSONAL__)
  if (name === 'kein-treffer') {
    await page.getByLabel('Suche in eigenen Punkten').fill('nichts')
    await page.waitForFunction(() => document.body.innerText.includes('Keine eigenen Punkte passen'))
  }
  if (name === 'pending') {
    await page.getByLabel('Eigene Vorbereitung').fill('Unterwegs')
    await page.getByRole('button', { name: 'Punkt hinzufügen' }).click()
    await page.waitForFunction(() => window.__PERSONAL__.setzen.length === 1)
  }
  if (name === 'fehler') {
    await page.getByLabel('Eigene Vorbereitung').fill('Fehlerfall')
    await page.getByRole('button', { name: 'Punkt hinzufügen' }).click()
    await page.waitForFunction(() => window.__PERSONAL__.setzen.length === 1)
    await page.evaluate(() => window.__PERSONAL__.schreibenFreigeben('Der Titel konnte nicht gespeichert werden.'))
    await page.waitForFunction(() => document.body.innerText.includes('nicht gespeichert'))
  }
}

async function ablauf() {
  const ausgabe = neueAusgabe()
  const css = cssLesen()
  const bundle = join(mkdtempSync(join(tmpdir(), 'personal-prep-montage-')), 'flaeche.js')
  const gebaut = spawnSync('node_modules/esbuild/bin/esbuild', [
    'scripts/trip-personal-preparation-workflow-completion-1/flaeche.tsx',
    '--bundle',
    '--format=iife',
    `--outfile=${bundle}`,
    '--jsx=automatic',
    '--alias:@=.',
    '--define:process.env.NODE_ENV="production"',
    '--banner:js=globalThis.process=globalThis.process||{env:{NODE_ENV:"production"}};',
  ], { encoding: 'utf8' })
  if (gebaut.status !== 0) throw new Error(gebaut.stderr || gebaut.stdout)
  const faelle = reisen()
  const browser: Browser = await chromium.launch()
  const version = browser.version()
  const bilder: string[] = []
  const messungen: unknown[] = []
  try {
    for (const breite of BREITEN) {
      const page = await browser.newPage({ viewport: { width: breite, height: 900 } })
      await szene(page, 'lang', css.text, bundle, { seam: 'guest', reise: faelle.lang }, null)
      const mass = await messen(page)
      pruefen(`lang-${breite}`, mass, '16px')
      const datei = `lang-${breite}.png`
      await page.screenshot({ path: join(ausgabe, datei), fullPage: true })
      bilder.push(datei)
      messungen.push({ name: `lang-${breite}`, mass })
      if (breite === 390) {
        await statusPerTastatur(page, 'preparation-lang')
        const statusMass = await messen(page)
        pruefen('status-390', statusMass, '16px')
        await page.screenshot({ path: join(ausgabe, 'status-390.png'), fullPage: true })
        bilder.push('status-390.png')
        messungen.push({ name: 'status-390', mass: statusMass })
      }
      await page.close()
    }
    const zustaende = [
      ['leer', faelle.leer],
      ['kein-treffer', faelle.suche],
      ['pending', faelle.leer],
      ['fehler', faelle.leer],
    ] as const
    for (const [name, reise] of zustaende) {
      const page = await browser.newPage({ viewport: { width: 390, height: 844 } })
      await szene(page, name, css.text, bundle, { seam: 'guest', reise }, null)
      const mass = await messen(page)
      pruefen(`${name}-390`, mass, '16px')
      const datei = `${name}-390.png`
      await page.screenshot({ path: join(ausgabe, datei), fullPage: true })
      bilder.push(datei)
      messungen.push({ name: `${name}-390`, mass })
      await page.close()
    }
    const gross = await browser.newPage({ viewport: { width: 320, height: 900 } })
    await szene(gross, 'lang', css.text, bundle, { seam: 'guest', reise: faelle.lang }, '32px')
    const grossMass = await messen(gross)
    pruefen('lang-320-root32', grossMass, '32px')
    await gross.screenshot({ path: join(ausgabe, 'lang-320-root32.png'), fullPage: true })
    bilder.push('lang-320-root32.png')
    messungen.push({ name: 'lang-320-root32', mass: grossMass })
    await statusPerTastatur(gross, 'preparation-lang')
    const statusGross = await messen(gross)
    pruefen('status-320-root32', statusGross, '32px')
    await gross.screenshot({ path: join(ausgabe, 'status-320-root32.png'), fullPage: true })
    bilder.push('status-320-root32.png')
    messungen.push({ name: 'status-320-root32', mass: statusGross })
    await gross.close()

    const taste = await browser.newPage({ viewport: { width: 390, height: 844 } })
    await szene(taste, 'tastatur', css.text, bundle, { seam: 'guest', reise: faelle.leer }, null)
    await taste.getByLabel('Eigene Vorbereitung').focus()
    await taste.keyboard.type('Tastaturpunkt')
    await taste.keyboard.press('Enter')
    await taste.waitForFunction(() => window.__PERSONAL__.setzen.length === 1)
    const tastatur = await taste.evaluate(() => ({
      setzen: window.__PERSONAL__.setzen.length,
      phase: document.querySelector('[data-personal-phase]')?.getAttribute('data-personal-phase') ?? null,
    }))
    if (tastatur.setzen !== 1 || tastatur.phase !== 'pending') throw new Error(`Tastatur: ${JSON.stringify(tastatur)}`)
    await taste.screenshot({ path: join(ausgabe, 'tastatur-390.png'), fullPage: true })
    bilder.push('tastatur-390.png')
    await taste.close()

    const ruhe = await browser.newPage({ viewport: { width: 390, height: 844 }, reducedMotion: 'reduce' })
    await szene(ruhe, 'lang', css.text, bundle, { seam: 'guest', reise: faelle.lang }, null)
    const ruheMass = await messen(ruhe)
    if (!ruheMass.bewegung) throw new Error('prefers-reduced-motion wurde nicht gesetzt')
    pruefen('reduziert-390', ruheMass, '16px')
    await ruhe.screenshot({ path: join(ausgabe, 'reduziert-390.png'), fullPage: true })
    bilder.push('reduziert-390.png')
    messungen.push({ name: 'reduziert-390', mass: ruheMass })
    await ruhe.close()
  } finally {
    await browser.close()
  }

  const bericht = {
    herkunft: {
      autor: 'Jetnity Trip Personal Preparation Workflow Completion 1 — Cursor Generation 1',
      session: 'bc-6bbca11e-14c9-4f1a-ac07-e729d8a54ca3',
      modell: 'grok-4.7-high-fast',
      kopf: git(['rev-parse', 'HEAD']),
      baum: git(['rev-parse', 'HEAD^{tree}']),
      main: git(['rev-parse', 'origin/main']),
      quellen: Object.fromEntries(QUELLEN.map((pfad) => [pfad, git(['hash-object', pfad])])),
      node: process.version,
      browser: version,
    },
    grenze:
      'Echte Komponente EigeneReisevorbereitung und echter Hook, gebündelt mit esbuild, mit CSS aus .next/static des lokalen next build. Aufgeschobene Schreib- und Leseversprechen, synthetische beispielreise. Kein TripWorkspace-Router, kein Next-Router, kein gehostetes Konto, kein Supabase, kein RLS. Schriftgröße 32px ist eine lokale CSS-Simulation, kein nativer Zoom, kein Gerät und kein Screenreader. Überlauf von html, body und der Liste bleibt sichtbar.',
    css: { sha256: css.sha256, dateien: css.dateien },
    bilder,
    tastatur: { setzen: 1, phase: 'pending' },
    messungen,
  }
  writeFileSync(join(ausgabe, 'ablauf.json'), `${JSON.stringify(bericht, null, 2)}\n`)
  console.log(JSON.stringify({ ausgabe, browser: version, bilder: bilder.length, css: css.sha256 }))
}

ablauf().catch((fehler: unknown) => {
  console.error(fehler)
  process.exitCode = 1
})
