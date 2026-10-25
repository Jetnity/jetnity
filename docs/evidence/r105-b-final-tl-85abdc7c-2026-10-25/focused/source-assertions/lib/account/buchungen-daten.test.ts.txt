import { describe, test } from 'node:test'
import assert from 'node:assert/strict'
import { createClient } from '@supabase/supabase-js'

import {
  buchungenAbfrageBauen,
  buchungenAnfrageAus,
  buchungenCursorSchreiben,
  type BuchungenFilter,
} from '@/lib/account/buchungen-abfrage'
import {
  buchungenAbfrageSenden,
  buchungenFuerParameter,
  type BuchungenDatenClient,
} from '@/lib/account/buchungen-daten'
import type { Leseantwort } from '@/lib/api/datenbank-lesen'

const FILTER: BuchungenFilter = { titel: null, art: null, archiv: 'alle' }

function uuid(n: number): string {
  return `00000000-0000-4000-8000-${n.toString(16).padStart(12, '0')}`
}

function zeile(n: number) {
  return {
    id: uuid(n),
    kind: 'stay',
    title: `Haus ${n}`,
    starts_on: '2026-09-12',
    starts_at: null,
    ends_on: null,
    ends_at: null,
    booking_status: 'booked',
    booking_confirmed_at: '2026-08-30T12:00:00.123456Z',
    trips: { id: uuid(90), title: 'Reise', status: 'planned' },
  }
}

function clientMit(antwort: Leseantwort<unknown> | Error, aufrufe: { n: number }): BuchungenDatenClient {
  const kette = {
    eq: () => kette,
    in: () => kette,
    filter: () => kette,
    or: () => kette,
    is: () => kette,
    gt: () => kette,
    order: () => kette,
    limit: () => kette,
    then(resolve: (wert: unknown) => unknown, reject: (fehler: unknown) => unknown) {
      aufrufe.n += 1
      if (antwort instanceof Error) return Promise.reject(antwort).then(resolve, reject)
      return Promise.resolve(antwort).then(resolve, reject)
    },
  }
  return { from: () => ({ select: () => kette }) } as unknown as BuchungenDatenClient
}

describe('Buchungen laden', () => {
  test('ein ungültiger Cursor ruft den Client nicht auf', async () => {
    const aufrufe = { n: 0 }
    const client = clientMit({ data: [], error: null, status: 200 }, aufrufe)
    const ergebnis = await buchungenFuerParameter({ art: 'activity', weiter: 'kaputt' }, client)
    assert.equal(ergebnis.ok, false)
    if (ergebnis.ok) return
    assert.equal(ergebnis.grund, 'parameter')
    assert.equal(aufrufe.n, 0)
  })

  test('data null, Wurf, Abfragefehler und kaputte Zeile bleiben Fehler', async () => {
    const faelle: Array<[Leseantwort<unknown> | Error, number]> = [
      [{ data: null, error: null, status: 200 }, 500],
      [new Error('netz'), 500],
      [{ data: null, error: { message: 'db', code: '08006' }, status: 0 }, 503],
      [{ data: [zeile(1), { ...zeile(2), trips: null }], error: null, status: 200 }, 500],
    ]
    for (const [antwort, status] of faelle) {
      const aufrufe = { n: 0 }
      const ergebnis = await buchungenFuerParameter({}, clientMit(antwort, aufrufe))
      assert.equal(ergebnis.ok, false)
      if (ergebnis.ok) return
      assert.equal(ergebnis.grund, 'lesen')
      assert.equal(ergebnis.status, status)
      assert.equal(aufrufe.n, 1)
    }
  })

  test('eine spätere leere Antwort ist das Ende dieses Stands', async () => {
    const anfrage = buchungenAnfrageAus({
      weiter: buchungenCursorSchreiben(FILTER, '2026-08-30T12:00:00.123456Z', uuid(4)) ?? '',
    })
    assert.equal(anfrage.ok, true)
    const aufrufe = { n: 0 }
    const ergebnis = await buchungenFuerParameter(
      { weiter: anfrage.ok ? (buchungenCursorSchreiben(FILTER, '2026-08-30T12:00:00.123456Z', uuid(4)) ?? '') : '' },
      clientMit({ data: [], error: null, status: 200 }, aufrufe),
    )
    assert.equal(ergebnis.ok, true)
    if (!ergebnis.ok) return
    assert.equal(ergebnis.fortsetzung, true)
    assert.deepEqual(ergebnis.buchungen, [])
    assert.equal(aufrufe.n, 1)
  })

  test('die nächste Adresse trägt den Cursor der 50. Zeile', async () => {
    const daten = Array.from({ length: 51 }, (_, index) => zeile(index + 1))
    const ergebnis = await buchungenFuerParameter({}, clientMit({ data: daten, error: null, status: 200 }, { n: 0 }))
    assert.equal(ergebnis.ok, true)
    if (!ergebnis.ok) return
    assert.equal(ergebnis.buchungen.length, 50)
    assert.match(ergebnis.weiter ?? '', /^\/account\/bookings\?weiter=/)
    const weiter = new URL(ergebnis.weiter ?? '', 'http://127.0.0.1')
    assert.equal(weiter.searchParams.get('weiter')?.endsWith(`|${uuid(50)}`), true)
    assert.equal(weiter.searchParams.get('weiter')?.includes(uuid(51)), false)
  })

  test('der installierte Client sendet imatch, eine Art und kein count', async () => {
    const aufrufe: { url: string; prefer: string }[] = []
    const supabase = createClient('http://127.0.0.1:9', 'sb_publishable_test', {
      auth: { persistSession: false, autoRefreshToken: false, detectSessionInUrl: false },
      global: {
        fetch: async (input, init) => {
          const request = input instanceof Request ? input : null
          const url = request?.url ?? String(input)
          const headers = new Headers(init?.headers ?? request?.headers)
          aufrufe.push({ url, prefer: headers.get('prefer') ?? '' })
          return new Response(JSON.stringify([]), {
            status: 200,
            headers: { 'content-type': 'application/json' },
          })
        },
      },
    })
    const titel = ['*', '%', '_', '\\', '"', "'", 'a,b(c)', '.*', '(a|b)', 'Zürich']
    for (const suchtext of titel) {
      aufrufe.length = 0
      const abfrage = buchungenAbfrageBauen({ titel: suchtext, art: null, archiv: 'aktiv' }, {
        zeit: '2026-08-30T12:00:00.123456Z',
        id: uuid(8),
      })
      await buchungenAbfrageSenden(supabase as unknown as BuchungenDatenClient, abfrage)
      const trip = aufrufe.find((aufruf) => aufruf.url.includes('/trip_items'))
      assert.ok(trip, suchtext)
      const params = new URL(trip.url).searchParams
      assert.equal(trip.prefer.includes('count=exact'), false)
      assert.deepEqual(params.getAll('kind'), ['in.(flight,stay,transfer,rental_car)'])
      assert.equal(params.get('title'), `imatch.***=${suchtext}`)
      assert.equal(params.get('title')?.includes(`"***=`), false)
      assert.equal(params.get('booking_status'), 'eq.booked')
      assert.equal(params.get('trips.status'), 'in.(draft,planned,booked)')
      assert.equal(params.get('order'), 'booking_confirmed_at.desc.nullslast,id.asc')
      assert.equal(params.get('limit'), '51')
      assert.equal(params.get('or')?.includes(`***=${suchtext}`), false)
      assert.equal(params.get('or')?.includes('imatch'), false)
      assert.match(params.get('or') ?? '', /booking_confirmed_at\.lt\."2026-08-30T12:00:00\.123456Z"/)
      assert.equal(params.toString().includes('like.'), false)
      assert.equal(params.toString().includes('ilike.'), false)
    }

    aufrufe.length = 0
    await buchungenAbfrageSenden(
      supabase as unknown as BuchungenDatenClient,
      buchungenAbfrageBauen({ titel: 'Haus', art: 'stay', archiv: 'alle' }, null),
    )
    const stay = aufrufe.find((aufruf) => aufruf.url.includes('/trip_items'))
    assert.ok(stay)
    const stayParams = new URL(stay.url).searchParams
    assert.deepEqual(stayParams.getAll('kind'), ['eq.stay'])
    assert.equal(stayParams.get('kind')?.includes('in.('), false)
    assert.equal(stayParams.get('or'), null)
  })
})
