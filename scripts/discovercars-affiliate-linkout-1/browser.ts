// scripts/discovercars-affiliate-linkout-1/browser.ts
//
// Lokaler Nachweis für den DiscoverCars-Link im echten Mietwagen-Bereich.
// Die Audit-Seite braucht JETNITY_UI_AUDIT=1 und ist in Production aus.
// Der Affiliate-Link wird nicht geöffnet. DiscoverCars wird nicht aufgerufen.
// 32px ist die im Repository erklärte Textvergrößerung (200% der 16px-Wurzel),
// nicht ein Desktop-Browserzoom.

import { mkdirSync, writeFileSync } from 'node:fs'
import { tmpdir } from 'node:os'
import { join } from 'node:path'
import { chromium, type Browser, type Page } from 'playwright'

import { beispielreise } from '@/lib/reiseaenderung/fixtures/reise'
import type { TripStage } from '@/types/trips'

const BASIS = process.env.DISCOVERCARS_AUDIT_BASIS ?? 'http://127.0.0.1:3000'
const SPEICHER = 'jetnity:ui-audit:workspace'

/** Explizit `DISCOVERCARS_LINKOUT_AUSGABE`, sonst ein beschreibbares Verzeichnis unter dem OS-Temp. */
function ausgabeVerzeichnis(): string {
  const gesetzt = process.env.DISCOVERCARS_LINKOUT_AUSGABE?.trim()
  if (gesetzt) return gesetzt
  return join(tmpdir(), 'discovercars-affiliate-linkout-1')
}

const AUSGABE = ausgabeVerzeichnis()
const GENERISCH = 'https://www.discovercars.com/?a_aid=jetnity'
const BKK =
  'https://www.discovercars.com/de/thailand/bangkok/suvarnabhumi-airport-bkk?a_aid=jetnity&currency=chf'

function etappe(teil: Partial<TripStage> & Pick<TripStage, 'id' | 'position' | 'name'>): TripStage {
  return {
    countryCode: null,
    arrivalDate: null,
    departureDate: null,
    latitude: null,
    longitude: null,
    placeId: null,
    ...teil,
  }
}

function reiseBangkok(id: string, title = 'Reise Bangkok Stadt') {
  return beispielreise({
    id,
    clientRef: `ref-${id}`,
    title,
    origin: 'Bangkok',
    currency: 'THB',
    travellers: 5,
    startDate: '1988-04-02',
    endDate: '1988-04-09',
    stages: [
      etappe({
        id: 'stage-bangkok-stadt',
        position: 1,
        name: 'Bangkok',
        countryCode: 'TH',
        placeId: 'place-bangkok-city',
        latitude: 13.7563,
        longitude: 100.5018,
        arrivalDate: '2026-11-01',
        departureDate: '2026-11-04',
      }),
      etappe({
        id: 'stage-phuket',
        position: 2,
        name: 'Phuket',
        countryCode: 'TH',
      }),
    ],
  })
}

type Befund = {
  name: string
  breite: number
  hoehe: number
  text: number
  textMethode: string
  href: string
  linkHoehe: number
  linkBreite: number
  sektionUeberlauf: number
  seiteUeberlauf: number
  discovercarsAufrufe: string[]
}

async function oeffnen(
  browser: Browser,
  nutzlast: unknown,
  viewport: { width: number; height: number },
  schriftPx: number,
) {
  const aufrufe: string[] = []
  const context = await browser.newContext({ viewport, deviceScaleFactor: 1 })
  await context.route(/discovercars\.com/i, (route) => {
    aufrufe.push(route.request().url())
    return route.abort()
  })
  await context.addInitScript(
    ({ key, wert }: { key: string; wert: string }) => {
      if (!sessionStorage.getItem(key)) sessionStorage.setItem(key, wert)
    },
    { key: SPEICHER, wert: JSON.stringify(nutzlast) },
  )
  const page = await context.newPage()
  page.on('request', (request) => {
    if (/discovercars\.com/i.test(request.url())) aufrufe.push(request.url())
  })
  await page.goto(`${BASIS}/ui-audit/trip-workspace`, { waitUntil: 'domcontentloaded' })
  await page.evaluate((px) => {
    document.documentElement.style.fontSize = `${px}px`
  }, schriftPx)
  await page.getByRole('tab', { name: 'Mietwagen' }).click()
  const link = page.getByRole('link', { name: /DiscoverCars/ })
  await link.waitFor()
  return { context, page, link, aufrufe }
}

async function tabBisRadio(page: Page, labelTeil: string): Promise<number> {
  for (let schritt = 0; schritt < 60; schritt += 1) {
    await page.keyboard.press('Tab')
    const label = await page.evaluate(() => {
      const el = document.activeElement
      if (!(el instanceof HTMLInputElement) || el.type !== 'radio') return ''
      if (el.name !== 'discovercars-abholstation') return ''
      return el.closest('label')?.textContent?.replace(/\s+/g, ' ').trim() ?? ''
    })
    if (label.includes(labelTeil)) return schritt + 1
  }
  return 0
}

async function masse(page: Page) {
  return page.locator('[data-discovercars-affiliate="1"]').evaluate((el) => {
    const sektion = el as HTMLElement
    const anker = sektion.querySelector('a')
    if (!anker) throw new Error('Affiliate-Link fehlt')
    const kasten = anker.getBoundingClientRect()
    return {
      href: anker.getAttribute('href'),
      rel: anker.getAttribute('rel'),
      target: anker.getAttribute('target'),
      linkHoehe: kasten.height,
      linkBreite: kasten.width,
      sektionUeberlauf: sektion.scrollWidth - sektion.clientWidth,
      seiteUeberlauf: document.documentElement.scrollWidth - document.documentElement.clientWidth,
      rahmen: getComputedStyle(anker).outlineStyle,
    }
  })
}

async function main() {
  mkdirSync(AUSGABE, { recursive: true })
  const browser = await chromium.launch({ headless: true })
  const befunde: Befund[] = []
  const fehler: string[] = []

  const faelle = [
    { name: '320', width: 320, height: 760, text: 16 },
    { name: '390', width: 390, height: 844, text: 16 },
    { name: '390-200', width: 390, height: 844, text: 32 },
    { name: '768', width: 768, height: 1024, text: 16 },
    { name: '1440', width: 1440, height: 900, text: 16 },
  ]

  try {
    for (const fall of faelle) {
      const { context, page, aufrufe } = await oeffnen(
        browser,
        { reise: reiseBangkok(`bangkok-${fall.name}`), quelle: 'guest', anfangsBereich: 'mobilitaet' },
        { width: fall.width, height: fall.height },
        fall.text,
      )
      const gemessen = await masse(page)
      if (gemessen.href !== GENERISCH) fehler.push(`${fall.name}: href ${gemessen.href}`)
      if (gemessen.rel !== 'noopener noreferrer sponsored') fehler.push(`${fall.name}: rel ${gemessen.rel}`)
      if (gemessen.target !== '_blank') fehler.push(`${fall.name}: target ${gemessen.target}`)
      if (gemessen.linkHoehe < 44) fehler.push(`${fall.name}: Linkhöhe ${gemessen.linkHoehe}`)
      if (gemessen.linkBreite < 44) fehler.push(`${fall.name}: Linkbreite ${gemessen.linkBreite}`)
      const radioHoehen = await page.getByRole('radio').evaluateAll((knoten) =>
        knoten.map((knoten) => {
          const ziel = knoten.closest('label') ?? knoten
          return ziel.getBoundingClientRect().height
        }),
      )
      if (radioHoehen.length !== 2 || radioHoehen.some((hoehe) => hoehe < 44)) {
        fehler.push(`${fall.name}: Radios ${radioHoehen.join(',')}`)
      }
      const referrer = await page.locator('[data-discovercars-affiliate="1"] a').getAttribute('referrerpolicy')
      if (referrer !== 'no-referrer') fehler.push(`${fall.name}: referrer ${referrer}`)
      if (gemessen.sektionUeberlauf > 1) fehler.push(`${fall.name}: Sektion überläuft um ${gemessen.sektionUeberlauf}`)
      if (aufrufe.length > 0) fehler.push(`${fall.name}: DiscoverCars vor dem Klick ${aufrufe.join(' ')}`)
      const manuell = page.locator('[aria-label="Manueller Mietwagen"]')
      if ((await manuell.count()) !== 1 || !(await manuell.isVisible())) {
        fehler.push(`${fall.name}: manuelle Erfassung nicht benutzbar`)
      }
      const vorbereitet = page.getByText('Mietwagenangebote werden vorbereitet')
      if (!(await vorbereitet.isVisible())) fehler.push(`${fall.name}: ehrliche Suche fehlt`)
      const fremd = await page.locator('iframe,script,img,link').evaluateAll((knoten) =>
        knoten
          .map((knoten) => `${knoten.tagName}:${knoten.getAttribute('src') ?? ''}${knoten.getAttribute('href') ?? ''}`)
          .filter((wert) => /discovercars\.com/i.test(wert)),
      )
      if (fremd.length > 0) fehler.push(`${fall.name}: Vorab-Ressource ${fremd.join(' ')}`)
      const radios = page.getByRole('radio')
      if ((await radios.count()) !== 2) fehler.push(`${fall.name}: Radios ${await radios.count()}`)
      await page.screenshot({
        path: `${AUSGABE}/${fall.name}.png`,
        fullPage: false,
      })
      const bereich = page.locator('[data-discovercars-affiliate="1"]')
      await bereich.screenshot({ path: `${AUSGABE}/${fall.name}-abschnitt.png` })
      befunde.push({
        name: fall.name,
        breite: fall.width,
        hoehe: fall.height,
        text: fall.text,
        textMethode: fall.text === 32 ? 'root-font-32px' : 'root-font-16px',
        href: gemessen.href ?? '',
        linkHoehe: gemessen.linkHoehe,
        linkBreite: gemessen.linkBreite,
        sektionUeberlauf: gemessen.sektionUeberlauf,
        seiteUeberlauf: gemessen.seiteUeberlauf,
        discovercarsAufrufe: [...aufrufe],
      })
      await context.close()
    }

    const konto = await oeffnen(
      browser,
      { reise: reiseBangkok('konto-bangkok', 'Reise Bangkok Stadt'), quelle: 'account', anfangsBereich: 'mobilitaet' },
      { width: 390, height: 844 },
      16,
    )
    const ersteUeberschrift = await konto.page.locator('h1').innerText()
    if (!ersteUeberschrift.includes('Reise Bangkok Stadt')) {
      fehler.push(`Erste Reise nicht sichtbar: ${ersteUeberschrift}`)
    }
    const kontoMasse = await masse(konto.page)
    if (kontoMasse.href !== GENERISCH) fehler.push(`Konto-href ${kontoMasse.href}`)
    if (konto.aufrufe.length > 0) fehler.push(`Konto-Netz ${konto.aufrufe.join(' ')}`)

    const tabSchritte = await tabBisRadio(konto.page, 'Abholort bei DiscoverCars wählen')
    if (tabSchritte === 0) fehler.push('Tab erreichte die allgemeine Abholwahl nicht')
    await konto.page.keyboard.press('ArrowDown')
    const nachWahl = await masse(konto.page)
    const bkkGewaehlt = await konto.page.getByRole('radio', { name: 'Flughafen Suvarnabhumi (BKK)' }).isChecked()
    if (!bkkGewaehlt || nachWahl.href !== BKK) fehler.push(`Pfeil nach unten wählte BKK nicht: ${nachWahl.href}`)
    if (konto.aufrufe.length > 0) fehler.push(`BKK-Wahl Netz ${konto.aufrufe.join(' ')}`)
    await konto.page.screenshot({ path: `${AUSGABE}/390-bkk-wahl.png`, fullPage: false })
    await konto.page.locator('[data-discovercars-affiliate="1"]').screenshot({
      path: `${AUSGABE}/390-bkk-wahl-abschnitt.png`,
    })
    await konto.page.keyboard.press('ArrowUp')
    const zurueck = await masse(konto.page)
    const allgemeinGewaehlt = await konto.page
      .getByRole('radio', { name: 'Abholort bei DiscoverCars wählen' })
      .isChecked()
    if (!allgemeinGewaehlt || zurueck.href !== GENERISCH) fehler.push(`Pfeil nach oben: ${zurueck.href}`)

    await konto.page.keyboard.press('ArrowDown')
    const wiederBkk = await masse(konto.page)
    if (wiederBkk.href !== BKK) fehler.push(`BKK vor dem Reisewechsel fehlt: ${wiederBkk.href}`)

    await konto.page.evaluate(
      ({ key, wert }) => sessionStorage.setItem(key, wert),
      {
        key: SPEICHER,
        wert: JSON.stringify({
          reise: reiseBangkok('andere-reise', 'Zweite Reise klar'),
          quelle: 'account',
          anfangsBereich: 'mobilitaet',
        }),
      },
    )
    await konto.page.reload({ waitUntil: 'domcontentloaded' })
    const zweiteUeberschrift = await konto.page.locator('h1').innerText()
    if (!zweiteUeberschrift.includes('Zweite Reise klar')) {
      fehler.push(`Zweite Reise nicht geladen: ${zweiteUeberschrift}`)
    }
    if (zweiteUeberschrift.includes('Reise Bangkok Stadt')) {
      fehler.push('Die erste Reise blieb nach dem Wechsel sichtbar')
    }
    await konto.page.getByRole('tab', { name: 'Mietwagen' }).click()
    const nachReload = await masse(konto.page)
    const bkkNachWechsel = await konto.page.getByRole('radio', { name: 'Flughafen Suvarnabhumi (BKK)' }).isChecked()
    if (bkkNachWechsel || nachReload.href !== GENERISCH) {
      fehler.push(`BKK blieb auf der zweiten Reise: ${nachReload.href}`)
    }
    if (konto.aufrufe.length > 0) fehler.push(`Reload Netz ${konto.aufrufe.join(' ')}`)
    await konto.context.close()

    const bericht = {
      basis: BASIS,
      ausgabe: AUSGABE,
      tastatur: { tabSchritteBisAllgemeineWahl: tabSchritte, pfeile: ['ArrowDown', 'ArrowUp', 'ArrowDown'] },
      befunde,
      fehler,
    }
    writeFileSync(`${AUSGABE}/bericht.json`, JSON.stringify(bericht, null, 2))
    if (fehler.length > 0) {
      console.error(bericht)
      process.exitCode = 1
      return
    }
    console.log(JSON.stringify(bericht, null, 2))
  } finally {
    await browser.close()
  }
}

main().catch((error: unknown) => {
  console.error(error)
  process.exitCode = 1
})
