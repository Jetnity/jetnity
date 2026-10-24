// Lokale Montage der gerenderten Buchungsseite.
// CSS kommt aus lokaler Projekt-PostCSS-Kompilierung, nicht aus einem Next-Build. Keine Geräte-, Zoom- oder Screenreader-Prüfung.

import { spawnSync } from 'node:child_process'
import { existsSync, mkdirSync, readdirSync, readFileSync, writeFileSync } from 'node:fs'
import { join } from 'node:path'
import { createElement } from 'react'
import { renderToStaticMarkup } from 'react-dom/server'
import { chromium } from 'playwright'

import AccountBuchungen from '@/components/account/AccountBuchungen'
import type { RoheBuchungszeile } from '@/lib/account/buchungen'
import { buchungenAnsichtAus, buchungenSeiteAusZeilen, type BuchungenFilter } from '@/lib/account/buchungen-abfrage'

const FILTER: BuchungenFilter = { titel: 'Zürich', art: 'flight', archiv: 'aktiv' }

function neueAusgabe(): string {
  const index = process.argv.indexOf('--ausgabe')
  const ziel = index >= 0 ? process.argv[index + 1] : ''
  if (!ziel) throw new Error('Aufruf braucht --ausgabe <neues Verzeichnis>')
  if (existsSync(ziel)) throw new Error(`Ausgabe existiert bereits und wird nicht überschrieben: ${ziel}`)
  mkdirSync(ziel, { recursive: true })
  return ziel
}

function git(args: string[]): string {
  const ergebnis = spawnSync('git', args, { encoding: 'utf8' })
  if (ergebnis.status !== 0) throw new Error(ergebnis.stderr || ergebnis.stdout)
  return ergebnis.stdout.trim()
}

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
  const pfad = process.env.JETNITY_REVIEW_CSS_PATH
  if (!pfad) throw new Error('Verifizierte lokale Projekt-PostCSS-Datei fehlt.')
  return readFileSync(pfad, 'utf8')
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
const ausgabe = neueAusgabe()
const bilder = join(ausgabe, 'screens')
// Root-only passive observer; no routing, interception, fixture or navigation changes.
const rootDiagnostik = {
  pageerror: [] as string[],
  consoleError: [] as string[],
  unexpectedRequests: [] as string[],
  requestFailed: [] as string[],
}
mkdirSync(bilder, { recursive: true })
const css = cssLesen()
const browser = await chromium.launch({ executablePath: process.env.JETNITY_REVIEW_CHROMIUM })
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
    'LOCAL_PROJECT_POSTCSS_COMPILATION: CSS aus der unveränderten Projekt-PostCSS-Pipeline in headless Chromium. Kein Next-Build-CSS-Nachweis, kein physisches Gerät, kein nativer Zoom, kein Screenreader, kein gehostetes Konto.',
}

try {
  for (const zustand of zustaende) {
    const markup = renderToStaticMarkup(createElement(AccountBuchungen, { ansicht: ansicht(zustand) }))
    const seite = await browser.newPage()
    seite.on('pageerror', (problem) => rootDiagnostik.pageerror.push(problem.message))
    seite.on('console', (meldung) => {
      if (meldung.type() === 'error') rootDiagnostik.consoleError.push(meldung.text())
    })
    seite.on('request', (anfrage) => {
      const url = anfrage.url()
      if (!url.startsWith('data:') && !url.startsWith('blob:') && url !== 'about:blank') {
        rootDiagnostik.unexpectedRequests.push(url)
      }
    })
    seite.on('requestfailed', (anfrage) => {
      rootDiagnostik.requestFailed.push(anfrage.url() + ' ' + (anfrage.failure()?.errorText ?? 'unknown'))
    })
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
      if (mass.ueberlauf > 1) {
        const detail = await seite.evaluate(() => {
          const root = document.documentElement
          const all = [...document.body.querySelectorAll('*')]
          const offenders = all.filter((el) => el.getBoundingClientRect().right > root.clientWidth + 1 || el.getBoundingClientRect().left < -1 || el.scrollWidth > el.clientWidth + 1)
          function describe(el: Element) {
            const r=el.getBoundingClientRect(),s=getComputedStyle(el),range=document.createRange();range.selectNodeContents(el);const tr=range.getBoundingClientRect()
            return {tag:el.tagName,classes:el.getAttribute('class'),name:el.getAttribute('name'),text:el.textContent?.slice(0,240),rect:{left:r.left,right:r.right,width:r.width,top:r.top,height:r.height},textRect:{left:tr.left,right:tr.right,width:tr.width,height:tr.height},scrollWidth:el.scrollWidth,clientWidth:el.clientWidth,style:{display:s.display,width:s.width,minWidth:s.minWidth,maxWidth:s.maxWidth,boxSizing:s.boxSizing,fontSize:s.fontSize,fontFamily:s.fontFamily,lineHeight:s.lineHeight,letterSpacing:s.letterSpacing,whiteSpace:s.whiteSpace,overflowWrap:s.overflowWrap,wordBreak:s.wordBreak,flexShrink:s.flexShrink,gap:s.gap,padding:s.padding,overflowX:s.overflowX}}
          }
          return {viewport:{width:innerWidth,height:innerHeight},root:{clientWidth:root.clientWidth,scrollWidth:root.scrollWidth,font:getComputedStyle(root).fontSize},offenders:offenders.map(el=>({element:describe(el),ancestors:[el.parentElement,el.parentElement?.parentElement].filter(Boolean).map(el=>describe(el as Element))}))}
        })
        writeFileSync(join(ausgabe, 'overflow-diagnostic.json'), JSON.stringify(detail,null,2)+'\n')
        await seite.screenshot({path:join(ausgabe,'overflow-320.png'),fullPage:false})
      }
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
    if (zustand === 'liste' || zustand === 'leer' || zustand === 'keine' || zustand === 'fehler' || zustand === 'fortsetzungLeer') {
      await seite.setViewportSize({ width: 390, height: 844 })
      await seite.screenshot({
        path: join(bilder, `bookings-${zustand}-390.png`),
        fullPage: true,
      })
    }
    if (zustand === 'liste') {
      await seite.setViewportSize({ width: 320, height: 700 })
      await seite.evaluate(() => {
        document.documentElement.style.fontSize = '32px'
      })
      await seite.screenshot({ path: join(bilder, 'bookings-liste-320-32px.png'), fullPage: true })
    }
    await seite.close()
    befund.zustaende[zustand] = messungen
  }
  const quellen = [
    'scripts/account-booking-folder-completion-1/montage.ts',
    'components/account/AccountBuchungen.tsx',
    'components/account/BuchungenFilter.tsx',
    'lib/account/buchungen-abfrage.ts',
    'docs/JETNITY_ACCOUNT_BOOKING_FOLDER_COMPLETION_1_TASK_V1_2026-10-24.md',
    'docs/JETNITY_ACCOUNT_BOOKING_FOLDER_COMPLETION_1_PLAN_2026-10-24.md',
  ]
  const hashes: Record<string, string> = {}
  for (const pfad of quellen) hashes[pfad] = git(['hash-object', pfad])
  const bericht = {
    herkunft: {
      autor: 'Jetnity Account Booking Folder Completion 1 — Cursor Generation 1',
      session: 'bc-a34030c7-4c19-4c9f-863f-193cfdfa34da',
      modell: 'grok-4.7-high-fast',
      kopf: git(['rev-parse', 'HEAD']),
      baum: git(['rev-parse', 'HEAD^{tree}']),
      main: git(['rev-parse', '9092b29c2e187bd73d644a3d85670f3ac6436be1']),
      quellen: hashes,
      befehl: process.argv.join(' '),
      node: process.version,
    },
    grenze:
      'Statisches Markup mit LOCAL_PROJECT_POSTCSS_COMPILATION aus der unveränderten Projekt-PostCSS-Pipeline. Kein Next-Build-CSS-Nachweis, keine Hydration, kein App-Router, kein nativer Zoom, kein Screenreader, kein gehostetes Konto. Root-Font 32px nur bei Breite 320, sonst 16px.',
    befund,
  }
  writeFileSync(join(ausgabe, 'montage.json'), `${JSON.stringify(bericht, null, 2)}\n`)
  console.log(JSON.stringify({ ausgabe, browser: befund.browser, tastatur: befund.tastatur, zustaende: Object.keys(befund.zustaende) }))
} finally {
  await browser.close()
  writeFileSync(join(ausgabe, 'montage-root-observer.json'), `${JSON.stringify({
    kind: 'ROOT_ADDED_PASSIVE_MONTAGE_OBSERVER',
    diagnostics: rootDiagnostik,
  }, null, 2)}\n`)
}
}

montage().catch((fehler: unknown) => {
  console.error(fehler)
  process.exitCode = 1
})
