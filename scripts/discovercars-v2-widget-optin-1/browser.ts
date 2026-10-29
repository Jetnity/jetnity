// scripts/discovercars-v2-widget-optin-1/browser.ts
//
// Lokale synthetische Oberfläche. DiscoverCars wird nicht aufgerufen.
// Die Prüfnaht ist kein Anbieterwidget. 32px ist die Wurzel-200%-Schrift,
// nicht der Browserzoom. CSS-Zoom wird nur als Chromium-Eigenschaft benannt,
// wenn er in diesem Lauf wirklich gesetzt wurde.

import { spawnSync } from 'node:child_process'
import { mkdirSync, writeFileSync } from 'node:fs'
import { tmpdir } from 'node:os'
import { join } from 'node:path'

import { chromium, type Browser, type Page } from 'playwright'

const BREITEN = [320, 390, 768, 1440] as const

function ausgabeVerzeichnis(): string {
  const gesetzt = process.env.DISCOVERCARS_WIDGET_AUSGABE?.trim()
  if (gesetzt) return gesetzt
  return join(tmpdir(), 'discovercars-v2-widget-optin-1')
}

const AUSGABE = ausgabeVerzeichnis()

function bauen(ziel: string): void {
  const css = spawnSync(
    'node_modules/.bin/tailwindcss',
    ['-i', 'styles/globals.css', '-o', join(ziel, 'flaeche.css'), '--minify'],
    { encoding: 'utf8' },
  )
  if (css.status !== 0) throw new Error(css.stderr || css.stdout || 'tailwind')
  const js = spawnSync(
    'node_modules/esbuild/bin/esbuild',
    [
      'scripts/discovercars-v2-widget-optin-1/harness.tsx',
      '--bundle',
      '--format=iife',
      `--outfile=${join(ziel, 'flaeche.js')}`,
      '--jsx=automatic',
      '--alias:@=.',
      '--define:process.env.NODE_ENV="production"',
      '--banner:js=globalThis.process=globalThis.process||{env:{NODE_ENV:"production"}};',
    ],
    { encoding: 'utf8' },
  )
  if (js.status !== 0) throw new Error(js.stderr || js.stdout || 'esbuild')
}

async function seite(browser: Browser, modus: 'inert' | 'naht' | 'mietwagen', reise: string) {
  const aufrufe: string[] = []
  const context = await browser.newContext({ viewport: { width: 390, height: 900 }, deviceScaleFactor: 1 })
  await context.route('**/*', (route) => {
    const url = route.request().url()
    if (url.startsWith('data:') || url.startsWith('blob:') || url === 'about:blank') return route.continue()
    aufrufe.push(url)
    return route.abort()
  })
  const page = await context.newPage()
  page.on('request', (request) => {
    const url = request.url()
    if (!url.startsWith('data:') && url !== 'about:blank') aufrufe.push(url)
  })
  await page.setContent(
    '<!doctype html><html><head><meta charset="utf-8"></head><body><div id="root"></div></body></html>',
    { waitUntil: 'domcontentloaded' },
  )
  await page.addStyleTag({ path: join(AUSGABE, 'flaeche.css') })
  await page.evaluate(
    ({ modus: start, reise: id }) => {
      const fenster = window as unknown as { __modus: string; __reise: string }
      fenster.__modus = start
      fenster.__reise = id
    },
    { modus, reise },
  )
  await page.addScriptTag({ path: join(AUSGABE, 'flaeche.js') })
  await page.locator('[data-discovercars-widget], [data-discovercars-affiliate]').first().waitFor()
  return { context, page, aufrufe }
}

async function schrift(page: Page, px: number) {
  await page.evaluate((wert) => {
    document.documentElement.style.fontSize = `${wert}px`
  }, px)
}

async function ueberlauf(page: Page): Promise<number> {
  return page.evaluate(() => document.documentElement.scrollWidth - document.documentElement.clientWidth)
}

async function entdecker(page: Page): Promise<string[]> {
  return page.evaluate(() =>
    performance.getEntriesByType('resource').map((eintrag) => eintrag.name),
  )
}

async function main() {
  mkdirSync(AUSGABE, { recursive: true })
  bauen(AUSGABE)
  const browser = await chromium.launch()
  const bilder: string[] = []
  const befunde: unknown[] = []
  try {
    const normal = await seite(browser, 'mietwagen', 'trip-uuid-geheim')
    for (const breite of BREITEN) {
      await normal.page.setViewportSize({ width: breite, height: 900 })
      await schrift(normal.page, 16)
      const datei = join(AUSGABE, `mietwagen-${breite}.png`)
      await normal.page.screenshot({ path: datei, fullPage: true })
      bilder.push(datei)
      const widget = normal.page.locator('[data-discovercars-widget="inert"]')
      const widgetUeberlauf = await widget.evaluate((el) => (el as HTMLElement).scrollWidth - (el as HTMLElement).clientWidth)
      befunde.push({
        name: `mietwagen-${breite}`,
        breite,
        schrift: 16,
        ueberlauf: await ueberlauf(normal.page),
        widgetUeberlauf,
        quelle: await widget.getAttribute('data-discovercars-quelle'),
        ladeknopf: await normal.page.getByRole('button', { name: 'Mietwagensuche bei DiscoverCars laden' }).count(),
        affiliate: await normal.page.locator('[data-discovercars-affiliate="1"]').count(),
        formular: await normal.page.getByRole('button', { name: 'Mietwagen speichern' }).count(),
      })
    }
    await normal.page.setViewportSize({ width: 320, height: 900 })
    await schrift(normal.page, 32)
    const wurzelUeberlauf = await ueberlauf(normal.page)
    const widgetUeberlauf = await normal.page.locator('[data-discovercars-widget="inert"]').evaluate((el) => {
      const knoten = el as HTMLElement
      return knoten.scrollWidth - knoten.clientWidth
    })
    const v1Label = await normal.page.evaluate(() => {
      const view = document.documentElement.clientWidth
      return [...document.querySelectorAll('body *')]
        .filter((el) => el.getBoundingClientRect().right > view + 1)
        .map((el) => (el.textContent ?? '').trim().slice(0, 80))
    })
    const gross = join(AUSGABE, 'mietwagen-320-wurzel-200.png')
    await normal.page.screenshot({ path: gross, fullPage: true })
    bilder.push(gross)
    befunde.push({
      name: 'mietwagen-320-wurzel-200',
      breite: 320,
      schrift: 32,
      ueberlauf: wurzelUeberlauf,
      widgetUeberlauf,
      v1Label,
    })
    const zoomGesetzt = await normal.page.evaluate(() => {
      document.documentElement.style.zoom = '2'
      return getComputedStyle(document.documentElement).zoom
    })
    const zoomDatei = join(AUSGABE, 'mietwagen-320-css-zoom.png')
    await normal.page.screenshot({ path: zoomDatei, fullPage: true })
    bilder.push(zoomDatei)
    befunde.push({
      name: 'mietwagen-320-css-zoom',
      breite: 320,
      schrift: 32,
      cssZoom: zoomGesetzt,
      ueberlauf: await ueberlauf(normal.page),
      hinweis: 'Chromium CSS-zoom auf dem Dokument, nicht die Browser-Chrome-Zoomstufe und kein Gerät. Überlauf hier fällt den Lauf nicht, weil die Zoomstufe das Layout vergrößert.',
    })
    const netzVorKlick = [...normal.aufrufe]
    await normal.page.keyboard.press('Escape')
    const erster = await normal.page.evaluate(() => {
      const ziel = document.querySelector<HTMLElement>('[data-discovercars-widget="inert"]')
      ziel?.focus()
      return document.activeElement?.getAttribute('data-discovercars-widget') ?? null
    })
    await normal.page.keyboard.press('Enter')
    befunde.push({
      name: 'inert-tastatur',
      fokus: erster,
      fixture: await normal.page.locator('[data-discovercars-widget-fixture]').count(),
      netz: netzVorKlick.filter((url) => /discovercars|privacybee/i.test(url)),
      ressourcen: (await entdecker(normal.page)).filter((url) => /discovercars|privacybee/i.test(url)),
    })
    await normal.context.close()

    const naht = await seite(browser, 'naht', 'trip-uuid-geheim')
    await naht.page.setViewportSize({ width: 390, height: 900 })
    await naht.page.getByRole('textbox', { name: 'Davor' }).focus()
    await naht.page.keyboard.press('Tab')
    const tabName = await naht.page.evaluate(() => document.activeElement?.textContent?.trim() ?? '')
    await naht.page.keyboard.press('Enter')
    await naht.page.getByText('Synthetische Jetnity-Prüfseite').waitFor()
    const nachEnter = await naht.page.evaluate(() => document.activeElement?.textContent?.trim() ?? '')
    await naht.page.keyboard.press('Escape')
    await naht.page.waitForFunction(() =>
      (document.activeElement?.textContent ?? '').includes('Mietwagensuche bei DiscoverCars laden'),
    )
    const nachEscape = await naht.page.evaluate(() => document.activeElement?.textContent?.trim() ?? '')
    const leer = await naht.page.locator('[data-discovercars-widget-fixture]').count()
    await naht.page.keyboard.press('Space')
    await naht.page.getByText('Synthetische Jetnity-Prüfseite').waitFor()
    const spaceBild = join(AUSGABE, 'pruefnaht-fixture-390.png')
    await naht.page.screenshot({ path: spaceBild, fullPage: true })
    bilder.push(spaceBild)
    befunde.push({
      name: 'pruefnaht-tastatur',
      tabName,
      nachEnter,
      nachEscape,
      fixtureNachEscape: leer,
      netz: naht.aufrufe.filter((url) => /discovercars|privacybee/i.test(url)),
      ressourcen: (await entdecker(naht.page)).filter((url) => /discovercars|privacybee/i.test(url)),
    })

    await naht.page.evaluate(() => {
      const fenster = window as unknown as {
        __laden: () => Promise<'fixture'>
        __loesen?: (wert: 'fixture') => void
      }
      fenster.__laden = () => new Promise((resolve) => {
        fenster.__loesen = resolve
      })
    })
    await naht.page.getByRole('button', { name: 'Prüfseite schließen' }).click()
    await naht.page.getByRole('button', { name: 'Mietwagensuche bei DiscoverCars laden' }).click()
    await naht.page.getByText('Die lokale Prüfseite wird vorbereitet').waitFor()
    await naht.page.evaluate(() => {
      const fenster = window as unknown as { __setzen: (modus: string, reise: string) => void }
      fenster.__setzen('naht', 'reise-zwei')
    })
    await naht.page.getByRole('button', { name: 'Mietwagensuche bei DiscoverCars laden' }).waitFor()
    await naht.page.evaluate(() => {
      const fenster = window as unknown as { __loesen?: (wert: 'fixture') => void }
      fenster.__loesen?.('fixture')
    })
    await naht.page.waitForTimeout(50)
    const nachWechsel = await naht.page.locator('[data-discovercars-widget-fixture]').count()
    const text = await naht.page.locator('body').innerText()
    befunde.push({
      name: 'reisewechsel',
      fixture: nachWechsel,
      geheimeReiseSichtbar: text.includes('trip-uuid-geheim') || text.includes('reise-zwei'),
    })

    await naht.page.evaluate(() => {
      const fenster = window as unknown as { __laden: () => Promise<'fehler'> }
      fenster.__laden = () => Promise.resolve('fehler')
    })
    await naht.page.getByRole('button', { name: 'Mietwagensuche bei DiscoverCars laden' }).click()
    await naht.page.getByRole('alert').waitFor()
    await naht.page.getByRole('button', { name: 'Erneut versuchen' }).focus()
    await naht.page.keyboard.press('Enter')
    await naht.page.getByRole('alert').waitFor()
    const fehlerBild = join(AUSGABE, 'pruefnaht-fehler-390.png')
    await naht.page.screenshot({ path: fehlerBild, fullPage: true })
    bilder.push(fehlerBild)
    befunde.push({
      name: 'fehler',
      meldung: await naht.page.getByRole('alert').innerText(),
      fixture: await naht.page.locator('[data-discovercars-widget-fixture]').count(),
    })
    await naht.context.close()
  } finally {
    await browser.close()
  }

  const bericht = { ausgabe: AUSGABE, bilder, befunde }
  writeFileSync(join(AUSGABE, 'browser.json'), `${JSON.stringify(bericht, null, 2)}\n`)
  const fehler = befunde.flatMap((eintrag) => {
    const satz = eintrag as {
      name: string
      ueberlauf?: number
      widgetUeberlauf?: number
      ladeknopf?: number
      fixture?: number
      fixtureNachEscape?: number
      geheimeReiseSichtbar?: boolean
      netz?: string[]
      ressourcen?: string[]
      tabName?: string
      nachEscape?: string
    }
    const probleme: string[] = []
    if ((satz.widgetUeberlauf ?? 0) > 1) probleme.push(`${satz.name} Widget überläuft`)
    if (!satz.name.endsWith('css-zoom') && satz.name !== 'mietwagen-320-wurzel-200' && (satz.ueberlauf ?? 0) > 1) {
      probleme.push(`${satz.name} überläuft`)
    }
    if (satz.name === 'mietwagen-320-wurzel-200' && (satz.widgetUeberlauf ?? 0) > 1) {
      probleme.push('Widget überläuft bei Wurzel 200%')
    }
    if (satz.ladeknopf) probleme.push(`${satz.name} zeigt den Ladeknopf`)
    if (satz.fixture) probleme.push(`${satz.name} zeigt die Fixture`)
    if (satz.fixtureNachEscape) probleme.push('Escape lässt die Fixture stehen')
    if (satz.geheimeReiseSichtbar) probleme.push('Reisekennung sichtbar')
    if (satz.netz?.length) probleme.push(`${satz.name} Netz ${satz.netz.join(',')}`)
    if (satz.ressourcen?.length) probleme.push(`${satz.name} Ressourcen`)
    if (satz.tabName !== undefined && !satz.tabName.includes('Mietwagensuche bei DiscoverCars laden')) {
      probleme.push(`Tab landete auf ${satz.tabName}`)
    }
    if (satz.nachEscape !== undefined && !satz.nachEscape.includes('Mietwagensuche bei DiscoverCars laden')) {
      probleme.push(`Fokus nach Escape: ${satz.nachEscape}`)
    }
    return probleme
  })
  if (fehler.length > 0) {
    console.error(fehler.join('\n'))
    process.exitCode = 1
  }
  console.log(JSON.stringify({ ausgabe: AUSGABE, befunde, fehler }, null, 2))
}

main().catch((fehler: unknown) => {
  console.error(fehler)
  process.exitCode = 1
})
