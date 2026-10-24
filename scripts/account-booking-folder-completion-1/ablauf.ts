// Lokaler Ablauf über den echten Lader und die echte Oberfläche.
// Die Datenschicht ist ein synthetischer PostgREST-Zuschnitt der gesendeten
// Abfrage. Das ist kein PostgreSQL-~*, kein gehostetes RLS und kein Next-Router.

import { spawnSync } from 'node:child_process'
import { mkdirSync, writeFileSync } from 'node:fs'
import { createClient } from '@supabase/supabase-js'
import { chromium, type Page } from 'playwright'

import { buchungenSchnittVergleich } from '@/lib/account/buchungen'
import {
  buchungenAdresse,
  buchungenAnsichtAus,
  buchungenCursorSchreiben,
  type BuchungenRohQuery,
} from '@/lib/account/buchungen-abfrage'
import { buchungenFuerParameter, type BuchungenDatenClient } from '@/lib/account/buchungen-daten'

const EVIDENZ = 'docs/evidence/account-booking-folder-completion-1'
const BUNDLE = '/tmp/buchungen-flaeche.js'

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

  const kombiniert = await laden('/account/bookings?titel=Sonder%20Z%C3%BCrich&art=stay&archiv=archiviert')
  if (kombiniert.zustand !== 'liste' || kombiniert.buchungen.map((buchung) => buchung.id).join() !== uuid(1)) {
    throw new Error('Kombinierter Filter trifft nicht nur den hinteren Treffer')
  }
  const letzteAbfrage = welt.postgrest.at(-1) ?? ''
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
      text: document.body.innerText,
    }
  })
}

async function folgen(seite: Page, href: string, schieben: boolean) {
  await seite.evaluate(
    async ({ ziel, historyPush }) => {
      const ansicht = await window.buchungenLaden(ziel)
      if (historyPush) history.pushState({ href: ziel }, '')
      window.buchungenSetzen(ansicht)
      await new Promise((resolve) => requestAnimationFrame(() => requestAnimationFrame(() => resolve(undefined))))
    },
    { ziel: href, historyPush: schieben },
  )
}

async function oberflaeche(browserVersion: string) {
  welt.fehlerRest = 0
  welt.zeilen = Array.from({ length: 51 }, (_, index) => zeile(index + 1, { title: index === 0 ? 'Alpha Zürich' : `Flug ${index + 1}` }))
  const start = await laden('/account/bookings')
  const browser = await chromium.launch()
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
    await seite.addScriptTag({ path: BUNDLE })
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

    await seite.locator('input[name="titel"]').fill('Alpha')
    await seite.locator('button[type="submit"]').click()
    await seite.waitForFunction(
      () => document.body.innerText.includes('Alpha Zürich') && !document.body.innerText.includes('Flug 51'),
    )
    const suche = await felder(seite)
    if (suche.titel !== 'Alpha' || !suche.text.includes('Alpha Zürich') || suche.formular.includes('weiter')) {
      throw new Error(`Suchen: ${JSON.stringify(suche)}`)
    }
    const submit = await seite.evaluate(() => window.letzterSubmit)
    if (!submit || submit.includes('weiter')) throw new Error(`Submit behält den Cursor: ${submit}`)

    await folgen(seite, '/account/bookings?weiter=seite-2', true)
    await seite.locator('input[name="titel"]').fill('Bern')
    await seite.locator('input[name="titel"]').press('Enter')
    await seite.waitForFunction(() => window.letzterSubmit?.includes('titel=Bern'))
    const enter = await seite.evaluate(() => window.letzterSubmit ?? '')
    if (enter.includes('weiter')) throw new Error(`Enter behält den Cursor: ${enter}`)
    const ohneCursor = welt.postgrest.at(-1) ?? ''
    if (ohneCursor.includes('or=') || ohneCursor.includes('id=gt.')) throw new Error('Neue Suche sendet das alte Keyset')

    welt.zeilen = Array.from({ length: 51 }, (_, index) => zeile(index + 1))
    await folgen(seite, '/account/bookings?titel=Z%C3%BCrich&art=stay&archiv=archiviert', true)
    await seite.locator('input[name="titel"]').fill('Bern')
    await seite.locator('select[name="art"]').selectOption('flight')
    await seite.locator('select[name="archiv"]').selectOption('aktiv')
    await seite.getByRole('link', { name: 'Filter zurücksetzen' }).click()
    await seite.waitForFunction(() => (document.querySelector('input[name="titel"]') as HTMLInputElement).value === '')
    const reset = await felder(seite)
    if (reset.titel !== '' || reset.art !== '' || reset.archiv !== 'alle') throw new Error(`Reset: ${JSON.stringify(reset)}`)

    await folgen(seite, '/account/bookings', true)
    await seite.locator('input[name="titel"]').fill('Bern')
    await seite.getByRole('link', { name: 'Weitere Buchungen' }).click()
    await seite.waitForFunction(() => (document.querySelector('input[name="titel"]') as HTMLInputElement).value === '')
    const naechste = await felder(seite)
    if (naechste.titel !== '' || naechste.zustand !== 'liste' || !naechste.text.includes('Flug 1')) {
      throw new Error(`Nächste Seite: ${JSON.stringify(naechste)}`)
    }

    await seite.locator('input[name="titel"]').fill('Bern')
    await seite.goBack()
    await seite.waitForFunction(() => (document.querySelector('input[name="titel"]') as HTMLInputElement).value === '')
    const zurueck = await felder(seite)
    if (zurueck.titel === 'Bern') throw new Error('Zurück behält die ungesendete Bearbeitung')

    const weiterHref = await seite.evaluate(() => {
      const link = [...document.querySelectorAll('a')].find((eintrag) => eintrag.textContent?.includes('Weitere Buchungen'))
      return link?.getAttribute('href') ?? ''
    })
    welt.fehlerRest = 1
    await seite.getByRole('link', { name: 'Weitere Buchungen' }).click()
    await seite.waitForFunction(() => document.querySelector('[data-buchungen]')?.getAttribute('data-buchungen') === 'fehler')
    const fehlerHref = await seite.evaluate(() => {
      const link = [...document.querySelectorAll('a')].find((eintrag) => eintrag.textContent?.includes('Erneut versuchen'))
      return link?.getAttribute('href') ?? ''
    })
    if (fehlerHref !== weiterHref) throw new Error(`Retry weicht ab: ${fehlerHref} / ${weiterHref}`)
    await seite.getByRole('link', { name: 'Erneut versuchen' }).click()
    await seite.waitForFunction(() => document.querySelector('[data-buchungen]')?.getAttribute('data-buchungen') === 'liste')
    const erneut = await felder(seite)
    if (!erneut.text.includes('Flug 1')) throw new Error('Retry zeigt nicht dieselbe Folgeseite')

    welt.zeilen = []
    await folgen(seite, '/account/bookings', true)
    await seite.waitForFunction(() => document.body.innerText.includes('Noch keine bestätigten Buchungen'))
    const leerText = await seite.evaluate(() => document.body.innerText)
    if (leerText.includes('Keine Buchung passt') || leerText.includes('keine weitere Buchung')) {
      throw new Error('Leeres Konto vermischt die Zustände')
    }

    const filter = { titel: null, art: null, archiv: 'alle' as const }
    const token = buchungenCursorSchreiben(filter, zeit(1), uuid(1))
    welt.zeilen = Array.from({ length: 51 }, (_, index) => zeile(index + 1))
    await folgen(seite, buchungenAdresse(filter, token), true)
    await seite.waitForFunction(() => document.body.innerText.includes('keine weitere Buchung'))
    const endeText = await seite.evaluate(() => document.body.innerText)
    if (endeText.includes('Noch keine bestätigten Buchungen') || endeText.includes('Keine Buchung passt')) {
      throw new Error('Leere Fortsetzung vermischt die Zustände')
    }

    welt.zeilen = [zeile(7, { trips: { id: uuid(77), title: 'Porto', status: 'planned' } })]
    await folgen(seite, '/account/bookings', true)
    await seite.getByRole('link', { name: 'Planpunkt öffnen' }).click()
    const plan = await seite.evaluate(() => window.letzterPlan ?? '')
    if (plan !== `/reisen/${uuid(77)}?ansicht=plan&punkt=${uuid(7)}`) throw new Error(`Planpunkt: ${plan}`)
    if (fehler.length > 0) throw new Error(fehler.join('\n'))
    if (externe.length > 0) throw new Error(`Externe Requests: ${externe.join(', ')}`)
    return {
      browser: browserVersion,
      suche: submit,
      enter,
      reset: { titel: reset.titel, art: reset.art, archiv: reset.archiv, zustand: reset.zustand },
      naechste: naechste.zustand,
      retry: fehlerHref,
      plan,
    }
  } finally {
    await browser.close()
  }
}

async function ablauf() {
  mkdirSync(EVIDENZ, { recursive: true })
  const gebaut = spawnSync(
    'node_modules/esbuild/bin/esbuild',
    [
      'scripts/account-booking-folder-completion-1/flaeche.tsx',
      '--bundle',
      '--format=iife',
      `--outfile=${BUNDLE}`,
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
  const browser = await chromium.launch()
  const version = browser.version()
  await browser.close()
  const flaeche = await oberflaeche(version)
  const bericht = {
    grenze:
      'Echter Lader und echte Oberfläche, synthetischer Zuschnitt der gesendeten PostgREST-URL. Kein PostgreSQL-~*, kein gehostetes RLS, kein Next-App-Router. Zurück ist die Browser-History desselben Dokuments.',
    lader,
    flaeche,
  }
  writeFileSync(`${EVIDENZ}/ablauf.json`, JSON.stringify(bericht, null, 2))
  console.log(JSON.stringify(bericht))
}

ablauf().catch((fehler: unknown) => {
  console.error(fehler)
  process.exitCode = 1
})
