// Lokaler Ablauf über den echten Lader und die echte Oberfläche.
// Die Datenschicht ist ein synthetischer PostgREST-Zuschnitt der gesendeten
// Abfrage. Das ist kein PostgreSQL-~*, kein gehostetes RLS und kein Next-Router.

import { spawnSync } from 'node:child_process'
import { existsSync, mkdirSync, mkdtempSync, writeFileSync } from 'node:fs'
import { tmpdir } from 'node:os'
import { join } from 'node:path'
import { createClient } from '@supabase/supabase-js'
import { chromium, type Page } from 'playwright'

import { buchungenSchnittVergleich } from '@/lib/account/buchungen'
import {
  aktiveBuchungsStati,
  buchbareBuchungsarten,
  buchungenAdresse,
  buchungenAnsichtAus,
  buchungenCursorSchreiben,
  type BuchungenRohQuery,
} from '@/lib/account/buchungen-abfrage'
import { buchungenFuerParameter, type BuchungenDatenClient } from '@/lib/account/buchungen-daten'

const QUELLEN = [
  'scripts/account-booking-folder-completion-1/ablauf.ts',
  'scripts/account-booking-folder-completion-1/flaeche.tsx',
  'scripts/account-booking-folder-completion-1/crypto-browser-stub.ts',
  'components/account/AccountBuchungen.tsx',
  'components/account/BuchungenFilter.tsx',
  'lib/account/buchungen-abfrage.ts',
  'lib/account/buchungen-daten.ts',
  'docs/JETNITY_ACCOUNT_BOOKING_FOLDER_COMPLETION_1_TASK_V1_2026-10-24.md',
  'docs/JETNITY_ACCOUNT_BOOKING_FOLDER_COMPLETION_1_PLAN_2026-10-24.md',
]

type Karte = { punkt: string; titel: string }
type ArchivSicht = 'alle' | 'aktiv' | 'archiviert'
type AnfrageErwartung = {
  titel: string | null
  art: string | null
  archiv: ArchivSicht
  keyset: 'keine' | 'zeile50' | 'vorhanden'
}

declare global {
  interface Window {
    __BUCHUNGEN_ZEUGE__: {
      folge: number
      wiederholenHref: string
      zustand: string
      ids: string[]
    }
    buchungenLaden: (href: string) => Promise<{ wiederholenHref: string; zustand: string; buchungen: { id: string }[] }>
    buchungenSetzen: (ansicht: unknown) => void
    folgen: (href: string, historyPush: boolean) => Promise<void>
    letzterSubmit?: string
    letzterPlan?: string
  }
}

type Zeile = {
  id: string
  kind: string
  title: string
  starts_on: string | null
  starts_at: string | null
  ends_on: string | null
  ends_at: string | null
  booking_status: string
  booking_confirmed_at: string | null
  trips: { id: string; title: string; status: string }
}

const welt: {
  zeilen: Zeile[]
  fehlerRest: number
  postgrest: string[]
} = { zeilen: [], fehlerRest: 0, postgrest: [] }

function uuid(n: number): string {
  return `00000000-0000-4000-8000-${n.toString(16).padStart(12, '0')}`
}

function zeit(n: number): string {
  const sekunde = n % 60
  const minute = Math.floor(n / 60) % 60
  const stunde = Math.floor(n / 3600)
  return `2026-01-01T${String(stunde).padStart(2, '0')}:${String(minute).padStart(2, '0')}:${String(sekunde).padStart(2, '0')}.123456Z`
}

function zeile(n: number, teil: Partial<Zeile> = {}): Zeile {
  return {
    id: uuid(n),
    kind: 'flight',
    title: `Flug ${n}`,
    starts_on: '2026-09-12',
    starts_at: null,
    ends_on: null,
    ends_at: null,
    booking_status: 'booked',
    booking_confirmed_at: zeit(n),
    trips: { id: uuid(9000), title: 'Lissabon', status: 'planned' },
    ...teil,
  }
}

function rohAus(href: string): BuchungenRohQuery {
  const params = new URL(href, 'http://127.0.0.1').searchParams
  const roh: BuchungenRohQuery = {}
  for (const key of new Set(params.keys())) {
    const alle = params.getAll(key)
    roh[key] = alle.length > 1 ? alle : alle[0]
  }
  return roh
}

function werte(ausdruck: string): string[] {
  return ausdruck.slice(4, -1).split(',')
}

function nachCursor(zeile: Zeile, ausdruck: string): boolean {
  const zeitText = /booking_confirmed_at\.lt\."([^"]*)"/.exec(ausdruck)?.[1]
  const id = /id\.gt\.([0-9a-f-]+)/.exec(ausdruck)?.[1]
  if (!zeitText || !id) throw new Error(`Unbekanntes Keyset: ${ausdruck}`)
  return (
    buchungenSchnittVergleich(
      { id: zeile.id, bookingConfirmedAt: zeile.booking_confirmed_at },
      { id, bookingConfirmedAt: zeitText },
    ) > 0
  )
}

function zuschnitt(params: URLSearchParams): Zeile[] {
  if (params.get('order') !== 'booking_confirmed_at.desc.nullslast,id.asc') {
    throw new Error(`Unerwartete Ordnung: ${params.get('order')}`)
  }
  if (params.get('limit') !== '51') throw new Error(`Unerwartetes Limit: ${params.get('limit')}`)
  if (params.get('booking_status') !== 'eq.booked') throw new Error('booked-Filter fehlt')
  const text = params.toString()
  if (text.includes('like.') || text.includes('ilike.') || text.includes('count=exact')) {
    throw new Error('Titel oder Zählung weicht ab')
  }
  let rows = welt.zeilen.filter((zeile) => zeile.booking_status === 'booked')
  const kind = params.get('kind')
  if (kind?.startsWith('eq.')) rows = rows.filter((zeile) => zeile.kind === kind.slice(3))
  else if (kind?.startsWith('in.(')) {
    const erlaubt = werte(kind)
    rows = rows.filter((zeile) => erlaubt.includes(zeile.kind))
  } else throw new Error(`Unerwartete Art: ${kind}`)
  const status = params.get('trips.status')
  if (status === 'eq.planned') {
    throw new Error('Archiv aktiv ist trips.status=in.(draft,planned,booked), nicht eq.planned')
  }
  if (status?.startsWith('eq.')) rows = rows.filter((zeile) => zeile.trips.status === status.slice(3))
  else if (status?.startsWith('in.(')) {
    const erlaubt = werte(status)
    rows = rows.filter((zeile) => erlaubt.includes(zeile.trips.status))
  }
  const titel = params.get('title')
  if (titel !== null) {
    if (!titel.startsWith('imatch.***=')) throw new Error(`Unerwarteter Titel: ${titel}`)
    const nadel = titel.slice('imatch.***='.length)
    rows = rows.filter((zeile) => zeile.title.includes(nadel))
  }
  const or = params.get('or')
  if (or) rows = rows.filter((zeile) => nachCursor(zeile, or))
  if (params.get('booking_confirmed_at') === 'is.null') {
    rows = rows.filter((zeile) => zeile.booking_confirmed_at === null)
  }
  const id = params.get('id')
  if (id?.startsWith('gt.')) rows = rows.filter((zeile) => zeile.id > id.slice(3))
  rows.sort((a, b) =>
    buchungenSchnittVergleich(
      { id: a.id, bookingConfirmedAt: a.booking_confirmed_at },
      { id: b.id, bookingConfirmedAt: b.booking_confirmed_at },
    ),
  )
  return rows.slice(0, 51)
}

function clientBauen(): BuchungenDatenClient {
  return createClient('http://127.0.0.1:9', 'sb_publishable_test', {
    auth: { persistSession: false, autoRefreshToken: false, detectSessionInUrl: false },
    global: {
      fetch: async (input) => {
        const url = input instanceof Request ? input.url : String(input)
        welt.postgrest.push(url)
        const fortsetzung = url.includes('or=') || url.includes('id=gt.')
        if (welt.fehlerRest > 0 && fortsetzung) {
          welt.fehlerRest -= 1
          return new Response(JSON.stringify({ message: 'synthetischer Lesefehler', code: '57014' }), {
            status: 500,
            headers: { 'content-type': 'application/json' },
          })
        }
        const rows = zuschnitt(new URL(url).searchParams)
        return new Response(JSON.stringify(rows), {
          status: 200,
          headers: { 'content-type': 'application/json' },
        })
      },
    },
  }) as unknown as BuchungenDatenClient
}

const client = clientBauen()

async function laden(href: string) {
  const ergebnis = await buchungenFuerParameter(rohAus(href), client)
  return buchungenAnsichtAus(ergebnis)
}

function sichtbar(zeilen: Zeile[]): string[] {
  return zeilen
    .filter((zeile) => zeile.booking_status === 'booked' && ['flight', 'stay', 'transfer', 'rental_car'].includes(zeile.kind))
    .sort((a, b) =>
      buchungenSchnittVergleich(
        { id: a.id, bookingConfirmedAt: a.booking_confirmed_at },
        { id: b.id, bookingConfirmedAt: b.booking_confirmed_at },
      ),
    )
    .map((zeile) => zeile.id)
}

async function blaettern(href = '/account/bookings'): Promise<string[]> {
  const ids: string[] = []
  const gesehen = new Set<string>()
  for (let schritt = 0; schritt < 20; schritt += 1) {
    const ansicht = await laden(href)
    if (ansicht.zustand === 'fehler' || ansicht.zustand === 'ungueltig') {
      throw new Error(`${ansicht.zustand} bei ${href}`)
    }
    for (const buchung of ansicht.buchungen) {
      if (gesehen.has(buchung.id)) throw new Error(`Doppelt: ${buchung.id}`)
      gesehen.add(buchung.id)
      ids.push(buchung.id)
    }
    if (!ansicht.weiterHref) return ids
    if (ansicht.buchungen.length !== 50) throw new Error(`Volle Seite hat ${ansicht.buchungen.length}`)
    href = ansicht.weiterHref
  }
  throw new Error('Zu viele Seiten')
}

function bestand(): Zeile[] {
  const fluege = Array.from({ length: 210 }, (_, index) => zeile(index + 2))
  const sonder = zeile(1, {
    id: uuid(1),
    kind: 'stay',
    title: 'Sonder Zürich',
    booking_confirmed_at: zeit(1),
    trips: { id: uuid(9000), title: 'Archiv', status: 'archived' },
  })
  return [
    ...fluege,
    sonder,
    zeile(800, { booking_status: 'planned', title: 'Nicht gebucht' }),
    zeile(801, { kind: 'activity', title: 'Aktivität' }),
  ]
}

async function laderBeweis() {
  welt.fehlerRest = 0
  welt.zeilen = []
  const leer = await laden('/account/bookings')
  if (leer.zustand !== 'leer') throw new Error(`Leer war ${leer.zustand}`)

  welt.zeilen = [zeile(1)]
  const eine = await blaettern()
  if (eine.join() !== uuid(1)) throw new Error('Eine Zeile fehlt')

  welt.zeilen = Array.from({ length: 51 }, (_, index) => zeile(index + 1))
  const fünfzig = await blaettern()
  if (fünfzig.length !== 51 || fünfzig[0] !== uuid(51) || fünfzig[49] !== uuid(2) || fünfzig[50] !== uuid(1)) {
    throw new Error(`Seite 50/51 stimmt nicht: ${fünfzig[0]} ${fünfzig[49]} ${fünfzig[50]}`)
  }
  const erste = await laden('/account/bookings')
  const token = new URL(erste.weiterHref ?? '', 'http://127.0.0.1').searchParams.get('weiter') ?? ''
  if (token.split('|').at(-1) !== uuid(2)) {
    throw new Error(`Cursor ist nicht die 50. sichtbare Zeile: ${erste.weiterHref}`)
  }

  welt.zeilen = bestand()
  const alle = await blaettern()
  const erwartet = sichtbar(welt.zeilen)
  if (alle.join() !== erwartet.join()) throw new Error('Fortsetzung hat Lücken oder eine andere Ordnung')
  if (erwartet.length !== 211 || !alle.includes(uuid(1)) || alle.includes(uuid(800)) || alle.includes(uuid(801))) {
    throw new Error('Der Bestand über 200 ist unvollständig')
  }
  if (erwartet.indexOf(uuid(1)) < 200) throw new Error('Sonderfall liegt nicht hinter der alten Grenze')

  const vorKombiniert = welt.postgrest.length
  const kombiniert = await laden('/account/bookings?titel=Sonder%20Z%C3%BCrich&art=stay&archiv=archiviert')
  if (kombiniert.zustand !== 'liste' || kombiniert.buchungen.map((buchung) => buchung.id).join() !== uuid(1)) {
    throw new Error('Kombinierter Filter trifft nicht nur den hinteren Treffer')
  }
  if (welt.postgrest.length !== vorKombiniert + 1) throw new Error('Kombinierter Filter hat nicht genau eine neue Anfrage ausgelöst')
  const letzteAbfrage = welt.postgrest[vorKombiniert] ?? ''
  const parameter = new URL(letzteAbfrage).searchParams
  if (parameter.get('title') !== 'imatch.***=Sonder Zürich') throw new Error(parameter.get('title') ?? 'Titel fehlt')
  if (parameter.get('kind') !== 'eq.stay') throw new Error(parameter.get('kind') ?? 'Art fehlt')
  if (parameter.get('trips.status') !== 'eq.archived') throw new Error('Archiv fehlt')

  welt.zeilen = Array.from({ length: 60 }, (_, index) =>
    zeile(index + 1, { booking_confirmed_at: '2026-08-30T12:00:00.123456Z' }),
  )
  const gleich = await blaettern()
  if (gleich[49] !== uuid(50) || gleich[50] !== uuid(51) || gleich.length !== 60) throw new Error('Gleicher Zeitstempel')

  welt.zeilen = [
    ...Array.from({ length: 40 }, (_, index) => zeile(index + 1)),
    ...Array.from({ length: 20 }, (_, index) => zeile(100 + index, { booking_confirmed_at: null })),
  ]
  const gemischt = await blaettern()
  if (gemischt.length !== 60 || gemischt.at(-1) !== uuid(119)) throw new Error('Null-Übergang')

  welt.zeilen = Array.from({ length: 51 }, (_, index) => zeile(index + 1, { booking_confirmed_at: null }))
  const nurNull = await blaettern()
  if (nurNull.length !== 51 || nurNull[49] !== uuid(50)) throw new Error('Nur null')

  const filter = { titel: null, art: null, archiv: 'alle' as const }
  const fortsetzung = buchungenCursorSchreiben(filter, '2026-08-30T12:00:00.123456Z', uuid(1))
  welt.zeilen = [zeile(1, { booking_confirmed_at: '2026-08-30T12:00:00.123456Z' })]
  const ende = await laden(buchungenAdresse(filter, fortsetzung))
  if (ende.zustand !== 'fortsetzungLeer') throw new Error(`Fortsetzung leer war ${ende.zustand}`)
  return { leer: leer.zustand, kombiniert: kombiniert.buchungen.length, fortsetzungLeer: ende.zustand, gesehen: alle.length }
}

function seiteEins(): Karte[] {
  const karten: Karte[] = []
  for (let n = 51; n >= 2; n -= 1) karten.push({ punkt: uuid(n), titel: `Flug ${n}` })
  return karten
}

function parameterVon(href: string): URLSearchParams {
  return new URL(href, 'http://127.0.0.1').searchParams
}

function parameterGleich(links: string, rechts: string): boolean {
  const a = parameterVon(links)
  const b = parameterVon(rechts)
  const schluessel = [...new Set([...a.keys(), ...b.keys()])].sort()
  return schluessel.every((key) => a.getAll(key).join('\n') === b.getAll(key).join('\n'))
}

function cursorAus(href: string): { zeit: string; id: string; token: string } {
  const token = parameterVon(href).get('weiter') ?? ''
  const teile = token.split('|')
  if (teile.length !== 4) throw new Error(`Weiter ist kein Cursor: ${href}`)
  return { zeit: teile[2] ?? '', id: teile[3] ?? '', token }
}

function zeile50(href: string): void {
  const cursor = cursorAus(href)
  if (cursor.zeit !== zeit(2) || cursor.id !== uuid(2)) {
    throw new Error(`Cursor ist nicht die 50. sichtbare Zeile: ${cursor.zeit} ${cursor.id}`)
  }
}

function gleich(ist: Karte[], soll: Karte[]): void {
  if (ist.length !== soll.length || ist.some((karte, index) => karte.punkt !== soll[index]?.punkt || karte.titel !== soll[index]?.titel)) {
    throw new Error(`Karten weichen ab: ${JSON.stringify(ist)} != ${JSON.stringify(soll)}`)
  }
}

function pruefeAnfrage(vorher: number, erwartet: AnfrageErwartung): void {
  const neu = welt.postgrest.slice(vorher)
  if (neu.length !== 1) throw new Error(`Neue Anfragen: ${neu.length}, erwartet 1`)
  const params = new URL(neu[0] ?? '').searchParams
  if (erwartet.titel === null) {
    if (params.has('title')) throw new Error(`Titel unerwartet: ${params.get('title')}`)
  } else if (params.get('title') !== `imatch.***=${erwartet.titel}`) {
    throw new Error(`Titel: ${params.get('title')}`)
  }
  const arten = `in.(${buchbareBuchungsarten().join(',')})`
  const kind = params.getAll('kind')
  if (erwartet.art === null) {
    if (kind.join('|') !== arten) throw new Error(`Art: ${kind.join('|')}`)
  } else if (kind.join('|') !== `eq.${erwartet.art}`) {
    throw new Error(`Art: ${kind.join('|')}`)
  }
  const status = params.get('trips.status')
  if (erwartet.archiv === 'alle') {
    if (status !== null) throw new Error(`Archiv unerwartet: ${status}`)
  } else if (erwartet.archiv === 'aktiv') {
    const soll = `in.(${aktiveBuchungsStati().join(',')})`
    if (status !== soll) throw new Error(`Archiv aktiv war ${status ?? 'leer'}, erwartet ${soll}`)
  } else if (status !== 'eq.archived') {
    throw new Error(`Archiv: ${status}`)
  }
  const keyset = params.has('or') || (params.get('id') ?? '').startsWith('gt.') || params.get('booking_confirmed_at') === 'is.null'
  if (erwartet.keyset === 'keine' && keyset) throw new Error(`Altes Keyset blieb: ${params.get('or') ?? params.get('id') ?? ''}`)
  if (erwartet.keyset === 'vorhanden' && !keyset) throw new Error('Keyset fehlt')
  if (erwartet.keyset === 'zeile50') {
    const or = params.get('or') ?? ''
    if (!or.includes(zeit(2)) || !or.includes(uuid(2)) || or.includes(uuid(1))) {
      throw new Error(`Keyset ist nicht Zeile 50: ${or}`)
    }
  }
}

async function felder(seite: Page) {
  return seite.evaluate(() => {
    const formular = document.querySelector('form')
    if (!(formular instanceof HTMLFormElement)) throw new Error('Formular fehlt')
    const daten = new FormData(formular)
    return {
      titel: (formular.querySelector('input[name="titel"]') as HTMLInputElement).value,
      art: (formular.querySelector('select[name="art"]') as HTMLSelectElement).value,
      archiv: (formular.querySelector('select[name="archiv"]') as HTMLSelectElement).value,
      formular: [...daten.keys()].sort(),
      zustand: document.querySelector('[data-buchungen]')?.getAttribute('data-buchungen'),
    }
  })
}

async function karten(seite: Page): Promise<Karte[]> {
  return seite.evaluate(() =>
    [...document.querySelectorAll('article')].map((artikel) => {
      const link = [...artikel.querySelectorAll('a')].find((eintrag) => eintrag.textContent?.includes('Planpunkt öffnen'))
      const href = link?.getAttribute('href') ?? ''
      const punkt = new URL(href, 'http://127.0.0.1').searchParams.get('punkt') ?? ''
      return { punkt, titel: artikel.querySelector('h2')?.textContent ?? '' }
    }),
  )
}

async function hinweisTitel(seite: Page): Promise<string> {
  return seite.evaluate(() => document.querySelector('section h2')?.textContent ?? '')
}

async function aktion(seite: Page, tun: () => Promise<void>, erwartet: AnfrageErwartung) {
  const folge = await seite.evaluate(() => window.__BUCHUNGEN_ZEUGE__.folge)
  const anfragen = welt.postgrest.length
  await tun()
  try {
    await seite.waitForFunction((alt) => window.__BUCHUNGEN_ZEUGE__.folge > alt, folge)
  } catch (problem) {
    throw new Error(`Kein Commit nach Folge ${folge}: ${problem instanceof Error ? problem.message : ''}`)
  }
  pruefeAnfrage(anfragen, erwartet)
  const zeuge = await seite.evaluate(() => window.__BUCHUNGEN_ZEUGE__)
  const dom = await karten(seite)
  const sichtbar = await felder(seite)
  const historie = await seite.evaluate(() => (history.state as { href?: string } | null)?.href ?? '')
  const ort = await seite.evaluate(() => location.href)
  if (zeuge.zustand !== sichtbar.zustand) throw new Error(`Zustand ${zeuge.zustand} != ${sichtbar.zustand ?? ''}`)
  if (zeuge.ids.join('|') !== dom.map((karte) => karte.punkt).join('|')) {
    throw new Error(`Zeuge und Planpunkt-Links weichen ab: ${zeuge.ids.join('|')} / ${dom.map((karte) => karte.punkt).join('|')}`)
  }
  return { zeuge, dom, felder: sichtbar, historie, ort }
}

async function navigieren(seite: Page, href: string, schieben: boolean, erwartet: AnfrageErwartung) {
  return aktion(
    seite,
    () =>
      seite.evaluate(
        async ({ ziel, historyPush }) => {
          const ansicht = await window.buchungenLaden(ziel)
          if (historyPush) history.pushState({ href: ziel }, '')
          window.buchungenSetzen(ansicht)
        },
        { ziel: href, historyPush: schieben },
      ),
    erwartet,
  )
}

async function linkHref(seite: Page, name: string): Promise<string> {
  return seite.evaluate((gesucht) => {
    const link = [...document.querySelectorAll('a')].find((eintrag) => eintrag.textContent?.includes(gesucht))
    return link?.getAttribute('href') ?? ''
  }, name)
}

const UNGEFILTERT: AnfrageErwartung = { titel: null, art: null, archiv: 'alle', keyset: 'keine' }
const ALPHA_SEITE: Karte = { punkt: uuid(1), titel: 'Alpha Zürich' }
const FLUG_EINS: Karte = { punkt: uuid(1), titel: 'Flug 1' }

async function oberflaeche(browserVersion: string, bundle: string) {
  welt.fehlerRest = 0
  welt.zeilen = Array.from({ length: 51 }, (_, index) => zeile(index + 1, { title: index === 0 ? 'Alpha Zürich' : `Flug ${index + 1}` }))
  const start = await laden('/account/bookings')
  const browser = await chromium.launch({ executablePath: process.env.JETNITY_REVIEW_CHROMIUM })
  const seite = await browser.newPage()
  const externe: string[] = []
  seite.on('request', (anfrage) => {
    const url = anfrage.url()
    if (url.startsWith('data:') || url.startsWith('blob:') || url === 'about:blank') return
    externe.push(url)
  })
  const fehler: string[] = []
  seite.on('pageerror', (problem) => fehler.push(problem.message))
  seite.on('console', (meldung) => {
    if (meldung.type() === 'error') fehler.push(meldung.text())
  })
  try {
    await seite.exposeFunction('buchungenLaden', (href: string) => laden(href))
    await seite.setContent('<!doctype html><html><body><div id="root"></div></body></html>')
    await seite.addScriptTag({
      content: `window.__BUCHUNGEN_START__ = ${JSON.stringify(start)}; history.replaceState({ href: '/account/bookings' }, '')`,
    })
    await seite.addScriptTag({ path: bundle })
    try {
      await seite.waitForSelector('form', { timeout: 5000 })
      await seite.waitForFunction(() => typeof window.buchungenSetzen === 'function', undefined, { timeout: 5000 })
    } catch (problem) {
      throw new Error(`${fehler.join('\n') || 'kein Browserfehler'}\n${problem instanceof Error ? problem.message : ''}`)
    }
    await seite.evaluate(() => {
      window.folgen = async (href: string, historyPush: boolean) => {
        const ansicht = await window.buchungenLaden(href)
        if (historyPush) history.pushState({ href }, '')
        window.buchungenSetzen(ansicht)
      }
      document.addEventListener('submit', (event) => {
        event.preventDefault()
        const formular = event.target
        if (!(formular instanceof HTMLFormElement)) return
        const params = new URLSearchParams()
        for (const [key, value] of new FormData(formular)) params.append(key, String(value))
        const href = params.size > 0 ? `/account/bookings?${params}` : '/account/bookings'
        window.letzterSubmit = href
        void window.folgen(href, true)
      })
      document.addEventListener(
        'click',
        (event) => {
          const ziel = event.target
          if (!(ziel instanceof Element)) return
          const link = ziel.closest('a')
          if (!link) return
          const href = link.getAttribute('href')
          if (!href) return
          event.preventDefault()
          if (href.startsWith('/reisen/')) {
            window.letzterPlan = href
            return
          }
          void window.folgen(href, true)
        },
        true,
      )
      window.addEventListener('popstate', (event) => {
        const href = (event.state as { href?: string } | null)?.href
        if (!href) return
        void window.folgen(href, false)
      })
    })

    await seite.setViewportSize({ width: 390, height: 844 })
    const anfang = await felder(seite)
    gleich(await karten(seite), seiteEins())
    const ersterWeiter = await linkHref(seite, 'Weitere Buchungen')
    zeile50(ersterWeiter)
    if (anfang.titel !== '' || anfang.art !== '' || anfang.archiv !== 'alle' || anfang.formular.includes('weiter')) {
      throw new Error(`Startformular: ${JSON.stringify(anfang)}`)
    }

    const alphaSeite = await aktion(seite, () => seite.getByRole('link', { name: 'Weitere Buchungen' }).click(), {
      ...UNGEFILTERT,
      keyset: 'zeile50',
    })
    gleich(alphaSeite.dom, [ALPHA_SEITE])
    if (alphaSeite.felder.titel !== '' || alphaSeite.felder.art !== '' || alphaSeite.felder.archiv !== 'alle') {
      throw new Error('Die Alpha-Fortsetzung übernimmt die Bearbeitung nicht als Filter')
    }

    await seite.locator('input[name="titel"]').fill('Alpha')
    const suche = await aktion(seite, () => seite.locator('button[type="submit"]').click(), {
      titel: 'Alpha',
      art: null,
      archiv: 'alle',
      keyset: 'keine',
    })
    gleich(suche.dom, [ALPHA_SEITE])
    const submit = await seite.evaluate(() => window.letzterSubmit ?? '')
    if (!submit || submit.includes('weiter') || suche.felder.formular.includes('weiter')) {
      throw new Error(`Submit behält den Cursor: ${submit}`)
    }
    if (suche.felder.titel !== 'Alpha' || suche.felder.art !== '' || suche.felder.archiv !== 'alle') {
      throw new Error(`Suchen: ${JSON.stringify(suche.felder)}`)
    }
    if (!parameterGleich(suche.historie, submit) || !parameterGleich(suche.zeuge.wiederholenHref, submit)) {
      throw new Error(`Suchen-Adresse: ${suche.historie} / ${suche.zeuge.wiederholenHref} / ${submit}`)
    }

    const ersteFuerEnter = await navigieren(seite, '/account/bookings', true, UNGEFILTERT)
    gleich(ersteFuerEnter.dom, seiteEins())
    zeile50(await linkHref(seite, 'Weitere Buchungen'))
    const enterSeite = await aktion(seite, () => seite.getByRole('link', { name: 'Weitere Buchungen' }).click(), {
      ...UNGEFILTERT,
      keyset: 'zeile50',
    })
    gleich(enterSeite.dom, [ALPHA_SEITE])
    await seite.locator('input[name="titel"]').fill('Bern')
    const enter = await aktion(seite, () => seite.locator('input[name="titel"]').press('Enter'), {
      titel: 'Bern',
      art: null,
      archiv: 'alle',
      keyset: 'keine',
    })
    const enterSubmit = await seite.evaluate(() => window.letzterSubmit ?? '')
    if (enterSubmit.includes('weiter') || enter.dom.length !== 0 || enter.zeuge.zustand !== 'keine') {
      throw new Error(`Enter: ${enterSubmit} ${enter.zeuge.zustand}`)
    }
    if ((await hinweisTitel(seite)) !== 'Keine Buchung passt zu dieser Suche.') {
      throw new Error('Enter ist nicht der Kein-Treffer-Zustand')
    }

    welt.zeilen = Array.from({ length: 51 }, (_, index) => zeile(index + 1))
    const gefiltert = await navigieren(seite, '/account/bookings?titel=Z%C3%BCrich&art=stay&archiv=archiviert', true, {
      titel: 'Zürich',
      art: 'stay',
      archiv: 'archiviert',
      keyset: 'keine',
    })
    if (gefiltert.zeuge.zustand !== 'keine' || gefiltert.felder.titel !== 'Zürich' || gefiltert.felder.art !== 'stay' || gefiltert.felder.archiv !== 'archiviert') {
      throw new Error(`Filterstand: ${JSON.stringify(gefiltert.felder)} ${gefiltert.zeuge.zustand}`)
    }
    await seite.locator('input[name="titel"]').fill('Bern')
    await seite.locator('select[name="art"]').selectOption('flight')
    await seite.locator('select[name="archiv"]').selectOption('aktiv')
    const reset = await aktion(seite, () => seite.getByRole('link', { name: 'Filter zurücksetzen' }).click(), UNGEFILTERT)
    gleich(reset.dom, seiteEins())
    if (reset.felder.titel !== '' || reset.felder.art !== '' || reset.felder.archiv !== 'alle') {
      throw new Error(`Reset: ${JSON.stringify(reset.felder)}`)
    }
    const unfilteredWeiter = await linkHref(seite, 'Weitere Buchungen')
    zeile50(unfilteredWeiter)

    await seite.locator('input[name="titel"]').fill('Bern')
    await seite.locator('select[name="art"]').selectOption('stay')
    await seite.locator('select[name="archiv"]').selectOption('archiviert')
    const naechste = await aktion(seite, () => seite.getByRole('link', { name: 'Weitere Buchungen' }).click(), {
      ...UNGEFILTERT,
      keyset: 'zeile50',
    })
    gleich(naechste.dom, [FLUG_EINS])
    if (naechste.felder.titel !== '' || naechste.felder.art !== '' || naechste.felder.archiv !== 'alle') {
      throw new Error(`Nächste Seite behält die ungesendete Bearbeitung: ${JSON.stringify(naechste.felder)}`)
    }

    await seite.locator('input[name="titel"]').fill('Bern')
    await seite.locator('select[name="art"]').selectOption('stay')
    await seite.locator('select[name="archiv"]').selectOption('archiviert')
    const zurueck = await aktion(seite, () => seite.goBack(), UNGEFILTERT)
    gleich(zurueck.dom, seiteEins())
    if (zurueck.felder.titel !== '' || zurueck.felder.art !== '' || zurueck.felder.archiv !== 'alle') {
      throw new Error(`Zurück behält die ungesendete Bearbeitung: ${JSON.stringify(zurueck.felder)}`)
    }
    if (zurueck.historie !== '/account/bookings' || !parameterGleich(zurueck.zeuge.wiederholenHref, '/account/bookings')) {
      throw new Error(`Zurück-Adresse: ${zurueck.historie} / ${zurueck.zeuge.wiederholenHref}`)
    }
    if (!zurueck.ort.startsWith('about:blank')) throw new Error(`Browser-URL wurde verändert: ${zurueck.ort}`)

    await seite.locator('input[name="titel"]').fill('Flug')
    await seite.locator('select[name="art"]').selectOption('flight')
    await seite.locator('select[name="archiv"]').selectOption('aktiv')
    const flugSuche = await aktion(seite, () => seite.locator('button[type="submit"]').click(), {
      titel: 'Flug',
      art: 'flight',
      archiv: 'aktiv',
      keyset: 'keine',
    })
    gleich(flugSuche.dom, seiteEins())
    if (flugSuche.felder.titel !== 'Flug' || flugSuche.felder.art !== 'flight' || flugSuche.felder.archiv !== 'aktiv') {
      throw new Error(`Gefilterte Suche: ${JSON.stringify(flugSuche.felder)}`)
    }
    const gefiltertWeiter = await linkHref(seite, 'Weitere Buchungen')
    zeile50(gefiltertWeiter)
    if (parameterGleich(gefiltertWeiter, unfilteredWeiter)) throw new Error('Der gefilterte Cursor ist der ungefilterte Cursor')
    welt.fehlerRest = 1
    const fehlerSeite = await aktion(seite, () => seite.getByRole('link', { name: 'Weitere Buchungen' }).click(), {
      titel: 'Flug',
      art: 'flight',
      archiv: 'aktiv',
      keyset: 'zeile50',
    })
    if (fehlerSeite.zeuge.zustand !== 'fehler' || fehlerSeite.dom.length !== 0) throw new Error('Folgeseite ist kein Lesefehler')
    const retryHref = await linkHref(seite, 'Erneut versuchen')
    if (!parameterGleich(retryHref, gefiltertWeiter) || !parameterGleich(fehlerSeite.zeuge.wiederholenHref, gefiltertWeiter)) {
      throw new Error(`Retry weicht ab: ${retryHref} / ${fehlerSeite.zeuge.wiederholenHref} / ${gefiltertWeiter}`)
    }
    const erneut = await aktion(seite, () => seite.getByRole('link', { name: 'Erneut versuchen' }).click(), {
      titel: 'Flug',
      art: 'flight',
      archiv: 'aktiv',
      keyset: 'zeile50',
    })
    gleich(erneut.dom, [FLUG_EINS])
    if (erneut.felder.titel !== 'Flug' || erneut.felder.art !== 'flight' || erneut.felder.archiv !== 'aktiv') {
      throw new Error(`Retry-Filter: ${JSON.stringify(erneut.felder)}`)
    }

    welt.zeilen = []
    const leer = await navigieren(seite, '/account/bookings', true, UNGEFILTERT)
    if (leer.zeuge.zustand !== 'leer' || leer.dom.length !== 0 || (await hinweisTitel(seite)) !== 'Noch keine bestätigten Buchungen.') {
      throw new Error(`Leer: ${leer.zeuge.zustand} ${await hinweisTitel(seite)}`)
    }

    const filter = { titel: null, art: null, archiv: 'alle' as const }
    const token = buchungenCursorSchreiben(filter, zeit(1), uuid(1))
    welt.zeilen = Array.from({ length: 51 }, (_, index) => zeile(index + 1))
    const ende = await navigieren(seite, buchungenAdresse(filter, token), true, { ...UNGEFILTERT, keyset: 'vorhanden' })
    if (ende.zeuge.zustand !== 'fortsetzungLeer' || ende.dom.length !== 0) throw new Error(`Fortsetzung leer: ${ende.zeuge.zustand}`)
    if ((await hinweisTitel(seite)) !== 'In diesem Stand gibt es hier keine weitere Buchung.') {
      throw new Error('Leere Fortsetzung vermischt die Zustände')
    }

    welt.zeilen = [zeile(7, { trips: { id: uuid(77), title: 'Porto', status: 'planned' } })]
    const planSeite = await navigieren(seite, '/account/bookings', true, UNGEFILTERT)
    gleich(planSeite.dom, [{ punkt: uuid(7), titel: 'Flug 7' }])
    await seite.getByRole('link', { name: 'Planpunkt öffnen' }).click()
    const plan = await seite.evaluate(() => window.letzterPlan ?? '')
    if (plan !== `/reisen/${uuid(77)}?ansicht=plan&punkt=${uuid(7)}`) throw new Error(`Planpunkt: ${plan}`)
    if (fehler.length > 0) throw new Error(fehler.join('\n'))
    if (externe.length > 0) throw new Error(`Externe Requests: ${externe.join(', ')}`)
    const schrift = await seite.evaluate(() => getComputedStyle(document.documentElement).fontSize)
    return {
      browser: browserVersion,
      viewport: { width: 390, height: 844 },
      schrift,
      ort: zurueck.ort,
      suche: { titel: suche.felder.titel, karten: suche.dom },
      enter: { zustand: enter.zeuge.zustand, submitEnthaeltWeiter: enterSubmit.includes('weiter') },
      reset: { titel: reset.felder.titel, art: reset.felder.art, archiv: reset.felder.archiv, karten: reset.dom.length },
      zurueck: { historie: zurueck.historie, wiederholenHref: zurueck.zeuge.wiederholenHref, karten: zurueck.dom.length },
      retry: { gleich: parameterGleich(retryHref, gefiltertWeiter), titel: erneut.dom[0]?.titel ?? '', id: erneut.dom[0]?.punkt ?? '' },
      leer: leer.zeuge.zustand,
      ende: ende.zeuge.zustand,
      plan,
    }
  } finally {
    await browser.close()
  }
}

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

function herkunft() {
  const quellen: Record<string, string> = {}
  for (const pfad of QUELLEN) quellen[pfad] = git(['hash-object', pfad])
  return {
    autor: 'Jetnity Account Booking Folder Completion 1 — Cursor Generation 1',
    session: 'bc-a34030c7-4c19-4c9f-863f-193cfdfa34da',
    modell: 'grok-4.7-high-fast',
    kopf: git(['rev-parse', 'HEAD']),
    baum: git(['rev-parse', 'HEAD^{tree}']),
    main: git(['rev-parse', '9092b29c2e187bd73d644a3d85670f3ac6436be1']),
    quellen,
    befehl: process.argv.join(' '),
    node: process.version,
  }
}

async function ablauf() {
  const ausgabe = neueAusgabe()
  const bundle = join(mkdtempSync(join(tmpdir(), 'buchungen-flaeche-')), 'flaeche.js')
  const gebaut = spawnSync(
    'node_modules/esbuild/bin/esbuild',
    [
      'scripts/account-booking-folder-completion-1/flaeche.tsx',
      '--bundle',
      '--format=iife',
      `--outfile=${bundle}`,
      '--jsx=automatic',
      '--alias:@=.',
      '--alias:node:crypto=scripts/account-booking-folder-completion-1/crypto-browser-stub.ts',
      '--define:process.env.NODE_ENV="production"',
      '--banner:js=globalThis.process=globalThis.process||{env:{NODE_ENV:"production"}};',
    ],
    { encoding: 'utf8' },
  )
  if (gebaut.status !== 0) throw new Error(gebaut.stderr || gebaut.stdout)
  const lader = await laderBeweis()
  const browser = await chromium.launch({ executablePath: process.env.JETNITY_REVIEW_CHROMIUM })
  const version = browser.version()
  await browser.close()
  const flaeche = await oberflaeche(version, bundle)
  const bericht = {
    herkunft: herkunft(),
    bundle,
    grenze:
      'Echter Lader und echte Oberfläche. Der Zuschnitt liest die gesendete PostgREST-URL. Titelvergleich ist String.includes, nicht PostgreSQL-~*. Archiv aktiv muss trips.status=in.(draft,planned,booked) sein. History speichert href im State desselben about:blank-Dokuments und stellt keine Browser-Route und keinen Next-Router wieder her. Kein gehostetes RLS.',
    lader,
    flaeche,
  }
  writeFileSync(join(ausgabe, 'ablauf.json'), `${JSON.stringify(bericht, null, 2)}\n`)
  console.log(JSON.stringify({ ausgabe, kopf: bericht.herkunft.kopf, lader: bericht.lader, flaeche: bericht.flaeche }))
}

ablauf().catch((fehler: unknown) => {
  console.error(fehler)
  process.exitCode = 1
})
