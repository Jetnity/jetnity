// Lokale Montage der gerenderten Buchungsseite.
// CSS kommt aus dem Production-Build. Das ist keine Geräte-, Zoom- oder Screenreader-Prüfung.

import { existsSync, mkdirSync, readdirSync, readFileSync, writeFileSync } from 'node:fs'
import { join } from 'node:path'
import { createElement } from 'react'
import { renderToStaticMarkup } from 'react-dom/server'
import { chromium } from 'playwright'

import AccountBuchungen from '@/components/account/AccountBuchungen'
import type { RoheBuchungszeile } from '@/lib/account/buchungen'
import { buchungenAnsichtAus, buchungenSeiteAusZeilen, type BuchungenFilter } from '@/lib/account/buchungen-abfrage'

const EVIDENZ = 'docs/evidence/account-booking-folder-completion-1'
const FILTER: BuchungenFilter = { titel: 'Zürich', art: 'flight', archiv: 'aktiv' }

function uuid(n: number): string {
  return `00000000-0000-4000-8000-${n.toString(16).padStart(12, '0')}`
}

function zeile(n: number): RoheBuchungszeile & { booking_confirmed_at: string } {
  return {
    id: uuid(n),
    kind: 'flight',
    title: n === 1 ? `${'Langtitel'.repeat(12)} Zürich` : `Flug ${n}`,
    starts_on: '2026-09-12',
    starts_at: '08:40:00',
    ends_on: '2026-09-12',
    ends_at: null,
    booking_status: 'booked',
    booking_confirmed_at: '2026-08-30T12:00:00.123456Z',
    trips: { id: uuid(90), title: 'Lissabon', status: n % 2 === 0 ? 'archived' : 'planned' },
  }
}

function ansicht(zustand: 'liste' | 'fortsetzung' | 'leer' | 'keine' | 'fehler' | 'ungueltig' | 'fortsetzungLeer') {
  if (zustand === 'liste') {
    const seite = buchungenSeiteAusZeilen(
      Array.from({ length: 51 }, (_, index) => zeile(index + 1)),
      FILTER,
    )
    if (!seite.ok) throw new Error('Liste konnte nicht abgebildet werden')
    return buchungenAnsichtAus({
      ok: true,
      filter: FILTER,
      fortsetzung: false,
      buchungen: seite.buchungen,
      weiter: `/account/bookings?titel=Z%C3%BCrich&art=flight&archiv=aktiv&weiter=${seite.weiter}`,
      ersteSeite: '/account/bookings?titel=Z%C3%BCrich&art=flight&archiv=aktiv',
      wiederholen: '/account/bookings?titel=Z%C3%BCrich&art=flight&archiv=aktiv',
    })
  }
  if (zustand === 'fortsetzung') {
    const seite = buchungenSeiteAusZeilen([zeile(1), zeile(2)], FILTER)
    if (!seite.ok) throw new Error('Fortsetzung konnte nicht abgebildet werden')
    return buchungenAnsichtAus({
      ok: true,
      filter: FILTER,
      fortsetzung: true,
      buchungen: seite.buchungen,
      weiter: null,
      ersteSeite: '/account/bookings?titel=Z%C3%BCrich&art=flight&archiv=aktiv',
      wiederholen: '/account/bookings?titel=Z%C3%BCrich&art=flight&archiv=aktiv&weiter=cursor',
    })
  }
  if (zustand === 'leer') {
    return buchungenAnsichtAus({
      ok: true,
      filter: { titel: null, art: null, archiv: 'alle' },
      fortsetzung: false,
      buchungen: [],
      weiter: null,
      ersteSeite: '/account/bookings',
      wiederholen: '/account/bookings',
    })
  }
  if (zustand === 'keine') {
    return buchungenAnsichtAus({
      ok: true,
      filter: FILTER,
      fortsetzung: false,
      buchungen: [],
      weiter: null,
      ersteSeite: '/account/bookings?titel=Z%C3%BCrich&art=flight&archiv=aktiv',
      wiederholen: '/account/bookings?titel=Z%C3%BCrich&art=flight&archiv=aktiv',
    })
  }
  if (zustand === 'fehler') {
    return buchungenAnsichtAus({
      ok: false,
      grund: 'lesen',
      status: 500,
      filter: FILTER,
      ersteSeite: '/account/bookings?titel=Z%C3%BCrich&art=flight&archiv=aktiv',
      wiederholen: '/account/bookings?titel=Z%C3%BCrich&art=flight&archiv=aktiv',
    })
  }
  if (zustand === 'fortsetzungLeer') {
    return buchungenAnsichtAus({
      ok: true,
      filter: FILTER,
      fortsetzung: true,
      buchungen: [],
      weiter: null,
      ersteSeite: '/account/bookings?titel=Z%C3%BCrich&art=flight&archiv=aktiv',
      wiederholen: '/account/bookings?titel=Z%C3%BCrich&art=flight&archiv=aktiv&weiter=cursor',
    })
  }
  return buchungenAnsichtAus({
    ok: false,
    grund: 'cursor',
    filter: FILTER,
    ersteSeite: '/account/bookings?titel=Z%C3%BCrich&art=flight&archiv=aktiv',
    wiederholen: '/account/bookings?titel=Z%C3%BCrich&art=flight&archiv=aktiv&weiter=kaputt',
  })
}

function cssDateien(ordner: string, treffer: string[] = []): string[] {
  for (const eintrag of readdirSync(ordner, { withFileTypes: true })) {
    const pfad = join(ordner, eintrag.name)
    if (eintrag.isDirectory()) cssDateien(pfad, treffer)
    else if (eintrag.name.endsWith('.css')) treffer.push(pfad)
  }
  return treffer
}

function cssLesen(): string {
  const dateien = cssDateien(join('.next', 'static'))
  if (dateien.length === 0) throw new Error('Production-CSS fehlt. Zuerst den Build ausführen.')
  return dateien.map((pfad) => readFileSync(pfad, 'utf8')).join('\n')
}

function dokument(markup: string, css: string): string {
  return `<!doctype html><html lang="de"><head><meta charset="utf-8"><style>${css}</style></head><body>${markup}</body></html>`
}

const breiten = [
  { name: '280', width: 280, height: 700 },
  { name: '320', width: 320, height: 700 },
  { name: '360', width: 360, height: 800 },
  { name: '390', width: 390, height: 844 },
  { name: '430', width: 430, height: 900 },
  { name: '768', width: 768, height: 1024 },
  { name: '1280', width: 1280, height: 800 },
  { name: '844x390', width: 844, height: 390 },
]

const zustaende = ['liste', 'fortsetzung', 'leer', 'keine', 'fehler', 'ungueltig', 'fortsetzungLeer'] as const

const tastaturZiele: Record<(typeof zustaende)[number], { ziele: string[]; grenze: number }> = {
  liste: {
    ziele: [
      'INPUT:titel',
      'SELECT:art',
      'SELECT:archiv',
      'BUTTON:Suchen',
      'Filter zurücksetzen',
      'Planpunkt öffnen',
      'Weitere Buchungen',
    ],
    grenze: 70,
  },
  fortsetzung: {
    ziele: ['Filter zurücksetzen', 'Planpunkt öffnen', 'Erste Seite dieser Filter'],
    grenze: 12,
  },
  leer: { ziele: ['INPUT:titel', 'SELECT:art', 'SELECT:archiv', 'BUTTON:Suchen'], grenze: 8 },
  keine: { ziele: ['BUTTON:Suchen', 'Filter zurücksetzen'], grenze: 8 },
  fehler: { ziele: ['BUTTON:Suchen', 'Filter zurücksetzen', 'Erneut versuchen'], grenze: 12 },
  ungueltig: { ziele: ['Erste Seite dieser Filter', 'Erneut versuchen'], grenze: 12 },
  fortsetzungLeer: { ziele: ['Erste Seite dieser Filter'], grenze: 12 },
}

async function tabWeg(
  seite: import('playwright').Page,
  ziele: string[],
  grenze: number,
): Promise<string[]> {
  await seite.emulateMedia({ reducedMotion: 'reduce' })
  await seite.locator('input[name="titel"]').focus()
  const gesehen: string[] = []
  const offen = new Set(ziele)
  for (let schritt = 0; schritt < grenze && offen.size > 0; schritt += 1) {
    const name = await seite.evaluate(() => {
      const el = document.activeElement
      if (!el || el === document.body) return 'BODY'
      const text = (el.textContent ?? '').replace(/\s+/g, ' ').trim()
      return `${el.tagName}:${el.getAttribute('name') ?? text.slice(0, 80)}`
    })
    gesehen.push(name)
    for (const ziel of offen) {
      if (name === ziel || name.startsWith(`${ziel}`) || name.includes(ziel)) offen.delete(ziel)
    }
    await seite.keyboard.press('Tab')
  }
  if (offen.size > 0) {
    throw new Error(`Tastatur fehlt ${[...offen].join(', ')}: ${gesehen.filter((name, index, alle) => alle.indexOf(name) === index).join(' | ')}`)
  }
  return gesehen
}

async function montage(): Promise<void> {
mkdirSync(EVIDENZ, { recursive: true })
const css = cssLesen()
const browser = await chromium.launch()
const befund: {
  browser: string
  zustaende: Record<string, unknown>
  tastatur: Record<string, string[]>
  bewegung: string
  hinweis: string
} = {
  browser: browser.version(),
  zustaende: {},
  tastatur: {},
  bewegung: 'reduce',
  hinweis:
    'CSS und Root-Font aus dem lokalen Production-Build in headless Chromium. Kein physisches Gerät, kein nativer Zoom, kein Screenreader, kein gehostetes Konto.',
}

try {
  for (const zustand of zustaende) {
    const markup = renderToStaticMarkup(createElement(AccountBuchungen, { ansicht: ansicht(zustand) }))
    const seite = await browser.newPage()
    const messungen = []
    for (const breite of breiten) {
      await seite.setViewportSize({ width: breite.width, height: breite.height })
      await seite.setContent(dokument(markup, css), { waitUntil: 'domcontentloaded' })
      const schrift = breite.name === '320' ? '32px' : '16px'
      await seite.evaluate((groesse) => {
        document.documentElement.style.fontSize = groesse
      }, schrift)
      const mass = await seite.evaluate(() => ({
        zustand: document.querySelector('[data-buchungen]')?.getAttribute('data-buchungen'),
        ueberlauf: document.documentElement.scrollWidth - document.documentElement.clientWidth,
        schrift: getComputedStyle(document.documentElement).fontSize,
      }))
      if (mass.ueberlauf > 1) throw new Error(`${zustand} ${breite.name} Überlauf ${mass.ueberlauf}`)
      messungen.push({ ...breite, schrift, ueberlauf: mass.ueberlauf, zustand: mass.zustand })
    }
    await seite.setViewportSize({ width: 390, height: 844 })
    await seite.setContent(dokument(markup, css), { waitUntil: 'domcontentloaded' })
    const weg = tastaturZiele[zustand]
    const gesehen = await tabWeg(seite, weg.ziele, weg.grenze)
    befund.tastatur[zustand] = gesehen.filter((name, index, alle) => alle.indexOf(name) === index)
    if (zustand === 'leer') {
      const reset = await seite.getByRole('link', { name: 'Filter zurücksetzen' }).count()
      if (reset !== 0) throw new Error('Die leere erste Seite ohne Filter bietet Zurücksetzen an.')
    }
    if (existsSync('/opt/cursor/artifacts')) {
      if (zustand === 'liste' || zustand === 'leer' || zustand === 'keine' || zustand === 'fehler' || zustand === 'fortsetzungLeer') {
        await seite.setViewportSize({ width: 390, height: 844 })
        await seite.screenshot({
          path: `/opt/cursor/artifacts/bookings-${zustand}-390.png`,
          fullPage: true,
        })
      }
      if (zustand === 'liste') {
        await seite.setViewportSize({ width: 320, height: 700 })
        await seite.evaluate(() => {
          document.documentElement.style.fontSize = '32px'
        })
        await seite.screenshot({ path: '/opt/cursor/artifacts/bookings-liste-320-32px.png', fullPage: true })
      }
    }
    await seite.close()
    befund.zustaende[zustand] = messungen
  }
  writeFileSync(join(EVIDENZ, 'montage.json'), JSON.stringify(befund, null, 2))
  console.log(JSON.stringify({ browser: befund.browser, tastatur: befund.tastatur, zustaende: Object.keys(befund.zustaende) }))
} finally {
  await browser.close()
}
}

montage().catch((fehler: unknown) => {
  console.error(fehler)
  process.exitCode = 1
})
