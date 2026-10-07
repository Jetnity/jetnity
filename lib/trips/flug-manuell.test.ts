import assert from 'node:assert/strict'
import { readFileSync } from 'node:fs'
import { createRequire } from 'node:module'
import { dirname, resolve } from 'node:path'
import { describe, test } from 'node:test'
import { fileURLToPath } from 'node:url'
import * as React from 'react'
import { renderToStaticMarkup } from 'react-dom/server'
import ts from 'typescript'

import FlugBestand from '@/components/trips/FlugBestand'
import FlugRoute from '@/components/trips/FlugRoute'
import type { flugRouteManuellSetzen } from '@/lib/trips/aktionen'
import { meldungAus, NICHT_ANGEMELDET } from '@/lib/trips/anlegen'
import { beispielreise } from '@/lib/reiseaenderung/fixtures/reise'
import { flugRouteManuellSchema, reiseLesen, type FlugSegmentManuell } from '@/lib/trips/schema'
import { istManuellerFlug, manuelleFlugRouteBauen, manuelleFlugSummaryProjizieren } from '@/lib/trips/flug-manuell'
import { gastFlugRouteManuellSetzen, gastreiseSpeichern, SCHLUESSEL, SpeicherFehler } from '@/lib/trips/gastspeicher'
import { routeFactsFuerPunkt } from '@/lib/route/ableitung'
import { itineraryAusMetadata } from '@/lib/route/metadata'
import { TEST_FLUGHAFEN_REFS } from '@/lib/route/fixtures'
import type { Trip, TripItem } from '@/types/trips'

const root = resolve(dirname(fileURLToPath(import.meta.url)), '../..')
const require = createRequire(import.meta.url)
const TRIP = 'aaaaaaaa-0000-4000-8000-000000000001'
const ITEM = 'aaaaaaaa-0000-4000-8000-000000000002'
const direkt: FlugSegmentManuell = { origin: 'ZRH', destination: 'DOH', departureDate: '2026-11-01', departureTime: '09:15', arrivalDate: '2026-11-01', arrivalTime: '16:40' }
const anschluss: FlugSegmentManuell = { origin: 'DOH', destination: 'BKK', departureDate: '2026-11-01', departureTime: '18:55', arrivalDate: '2026-11-02', arrivalTime: '07:10' }
const segments = [direkt, anschluss]
const eingabe = { tripId: TRIP, itemId: ITEM, segments }
const extras = ['country', 'city', 'countryCode', 'surfaceFromAirportCode', 'surfaceFrom', 'provider', 'note', 'title']
const invalidSegments: unknown[] = [
  [], Array(5).fill(direkt), null, [null], [{}],
  ...['', 'AB', 'ABCD', 'Z1H', 'ÄBC', 'ＡＢＣ', 'A B', 'a'.repeat(100)].map(origin => [{ ...direkt, origin }]),
  [{ ...direkt, destination: 'zrh' }], [direkt, { ...anschluss, origin: 'DXB' }],
  ...['2026-02-29', '2026-04-31', '2026-13-01', '2026-00-01', '2026-11-00', '2026-1-01', '01.11.2026', ' 2026-11-01', '2026-11-01T00:00:00Z', ''].map(departureDate => [{ ...direkt, departureDate }]),
  ...['24:00', '12:60', '9:15', '09:15:00', ' 09:15', '09:15Z', 915].map(departureTime => [{ ...direkt, departureTime }]),
  [direkt, { ...anschluss, departureDate: '2026-10-31' }],
  [direkt, { ...anschluss, departureTime: '16:39' }],
  ...extras.map(key => [{ ...direkt, [key]: 'forged' }]),
  [{ ...direkt, origin: { airportCode: 'ZRH', countryCode: 'US' } }],
]
function flug(teil: Partial<TripItem> = {}): TripItem {
  return { ...beispielreise().days[0]!.items[0]!, id: ITEM, kind: 'flight', title: 'Freitext USA Paris', note: 'Keine Länderquelle',
    startsOn: null, startsAt: null, endsOn: null, endsAt: null, provider: null, externalRef: null, bookingUrl: null, routeItinerary: null, ...teil }
}
// Execute actual modules; replace only framework/auth/transport seams.
function laden<T>(path: string, dependencies: Record<string, unknown>): T {
  const filename = resolve(root, path)
  const code = ts.transpileModule(readFileSync(filename, 'utf8'), {
    fileName: filename, compilerOptions: { module: ts.ModuleKind.CommonJS, target: ts.ScriptTarget.ES2022, jsx: ts.JsxEmit.ReactJSX },
  }).outputText
  const loaded = { exports: {} }
  new Function('require', 'module', 'exports', code)((name: string) =>
    Object.hasOwn(dependencies, name) ? dependencies[name] : require(name.startsWith('@/') ? resolve(root, name.slice(2)) : name),
  loaded, loaded.exports)
  return loaded.exports as T
}

describe('Manual flight eligibility and strict input', () => {
  test('manual-only, including booked user flight; non-null identities fail closed', () => {
    assert.ok(istManuellerFlug({ kind: 'flight' }))
    assert.ok(istManuellerFlug(flug({ bookingStatus: 'booked', bookingSource: 'user' })))
    const nurBuchungsquelle = { ...flug(), bookingSource: 'provider' }
    assert.ok(istManuellerFlug(nurBuchungsquelle), 'source alone is not identity')
    for (const kind of ['stay', 'note', null, undefined]) assert.equal(istManuellerFlug({ kind }), false)
    for (const key of ['provider', 'externalRef', 'bookingUrl']) {
      for (const value of ['test', '', ' ', false, 0]) assert.equal(istManuellerFlug({ ...flug(), [key]: value }), false)
    }
  })
  test('direct, contiguous, four segments, trim/uppercase, optional times, leap day', () => {
    assert.deepEqual(flugRouteManuellSchema.parse({ segments: [direkt] }), { segments: [direkt] })
    assert.deepEqual(flugRouteManuellSchema.parse({ segments }), { segments })
    assert.equal(flugRouteManuellSchema.parse({ segments: [{ ...direkt, origin: ' zrh ', destination: 'doh', departureTime: '', arrivalTime: undefined }] }).segments[0]!.origin, 'ZRH')
    assert.equal(flugRouteManuellSchema.parse({ segments: [{ ...direkt, departureTime: '', arrivalTime: undefined }] }).segments[0]!.arrivalTime, null)
    assert.ok(flugRouteManuellSchema.safeParse({ segments: [{ ...direkt, departureDate: '2028-02-29', arrivalDate: '2028-03-01' }] }).success)
    assert.ok(flugRouteManuellSchema.safeParse({ segments: [direkt, anschluss,
      { ...direkt, origin: 'BKK', destination: 'SIN', departureDate: '2026-11-03', arrivalDate: '2026-11-03' },
      { ...direkt, origin: 'SIN', destination: 'NRT', departureDate: '2026-11-04', arrivalDate: '2026-11-04' }] }).success)
    assert.ok(flugRouteManuellSchema.safeParse({ segments: [{ ...direkt, departureTime: null, arrivalTime: null }] }).success)
    assert.ok(flugRouteManuellSchema.safeParse({ segments: [direkt, { ...anschluss, departureTime: '16:40' }] }).success)
  })
  test('malformed values, same-airport reversal, discontinuity, bounds and all extra keys rejected', () => {
    for (const input of invalidSegments) assert.equal(flugRouteManuellSchema.safeParse({ segments: input }).success, false, JSON.stringify(input))
    for (const key of extras) assert.equal(flugRouteManuellSchema.safeParse({ segments, [key]: 'forged' }).success, false)
  })
})

type DbRow = { id: string; trip_id: string; kind: string; provider: string | null; external_ref: string | null; booking_url: string | null; metadata: Record<string, unknown> }
type DbError = { message: string; code: string }
function kontoTest(options: {
  row?: Partial<DbRow> | null; auth?: boolean; readError?: DbError; writeError?: DbError; airportError?: boolean;
  omitAirport?: string; concurrent?: Partial<DbRow> | 'deleted'; thrown?: boolean
} = {}) {
  let row: DbRow | null = options.row === null ? null : { id: ITEM, trip_id: TRIP, kind: 'flight', provider: null, external_ref: null, booking_url: null,
    metadata: { unrelated: { nested: ['keep', 3] }, routeItinerary: { old: true } }, ...options.row }
  const operations: Array<{ table: string; art: 'read' | 'update'; filters: Array<[string, unknown]>; select?: string; payload?: Record<string, unknown> }> = []
  const revalidated: string[] = []
  let authCalls = 0
  const supabase = { from(table: string) {
    assert.ok(['trip_items', 'airports'].includes(table))
    const op: (typeof operations)[number] = { table, art: 'read', filters: [] }; operations.push(op)
    const query = {
      select(columns: string) { op.select = columns; return query },
      update(payload: Record<string, unknown>) { op.art = 'update'; op.payload = payload; return query },
      eq(key: string, value: unknown) { op.filters.push([key, value]); return query },
      is(key: string, value: null) { op.filters.push([key, value]); return query },
      async in(key: string, codes: string[]) {
        assert.equal(table, 'airports'); assert.equal(key, 'iata'); op.filters.push([key, codes])
        const data = codes.filter(code => code !== options.omitAirport).map(iata => ({ iata,
          country_code: TEST_FLUGHAFEN_REFS[iata]!.countryCode, city: TEST_FLUGHAFEN_REFS[iata]!.city,
          country: TEST_FLUGHAFEN_REFS[iata]!.country, name: TEST_FLUGHAFEN_REFS[iata]!.name }))
        return { data: options.airportError ? null : data, error: options.airportError ? { message: 'secret airport error' } : null }
      },
      async maybeSingle() {
        assert.equal(table, 'trip_items')
        if (options.thrown) throw new Error('secret transport error')
        const error = op.art === 'read' ? options.readError : options.writeError
        const matches = row && op.filters.every(([key, value]) => key === 'metadata'
          ? JSON.stringify(row!.metadata) === value : row![key as keyof DbRow] === value)
        const data = matches ? structuredClone(row) : null
        if (op.art === 'read' && options.concurrent) row = options.concurrent === 'deleted' ? null : { ...row!, ...options.concurrent }
        return { data: error ? null : data, error: error ?? null, status: error ? 500 : 200 }
      },
    }; return query
  } }
  const actions = laden<{ flugRouteManuellSetzen: typeof flugRouteManuellSetzen }>('lib/trips/aktionen.ts', {
    'next/cache': { revalidatePath: (path: string) => revalidated.push(path) },
    '@/lib/trips/anlegen': { meldungAus, NICHT_ANGEMELDET, konto: async () => {
      authCalls++; return { supabase, benutzerId: options.auth === false ? null : 'owner' }
    } },
  })
  return { operations, revalidated, authCalls: () => authCalls, setzen: actions.flugRouteManuellSetzen }
}

describe('Account: actual action and actual server airport resolver', () => {
  test('exact pre-read, unique IATAs, server facts, only five update fields, guards and retained metadata', async () => {
    const a = kontoTest()
    assert.deepEqual(await a.setzen(eingabe), { ok: true, wert: null })
    assert.equal(a.authCalls(), 1)
    assert.equal(a.operations.length, 3)
    assert.deepEqual(a.operations[0], { table: 'trip_items', art: 'read', select: 'id, kind, provider, external_ref, booking_url, metadata', filters: [['id', ITEM], ['trip_id', TRIP]] })
    assert.deepEqual(a.operations[1], { table: 'airports', art: 'read', select: 'iata, country_code, city, country, name', filters: [['iata', ['ZRH', 'DOH', 'BKK']]] })
    const update = a.operations[2]!
    assert.deepEqual(Object.keys(update.payload!).sort(), ['ends_at', 'ends_on', 'metadata', 'starts_at', 'starts_on'])
    assert.deepEqual(update.payload, { starts_on: '2026-11-01', starts_at: '09:15', ends_on: '2026-11-02', ends_at: '07:10',
      metadata: { unrelated: { nested: ['keep', 3] }, routeItinerary: manuelleFlugRouteBauen(segments, TEST_FLUGHAFEN_REFS)!.routeItinerary } })
    assert.deepEqual(update.filters.slice(0, 6), [['id', ITEM], ['trip_id', TRIP], ['kind', 'flight'], ['provider', null], ['external_ref', null], ['booking_url', null]])
    assert.equal(update.filters[6]![0], 'metadata')
    assert.equal(update.select, 'id')
    assert.doesNotMatch(JSON.stringify(update.payload), /surfaceFrom|Freitext|Keine Länderquelle/)
    const route = itineraryAusMetadata(update.payload!.metadata)!
    assert.equal(route.legs[0]!.segments[0]!.origin.countryCode, 'CH')
    assert.equal(route.legs[0]!.segments[0]!.destination.city, TEST_FLUGHAFEN_REFS.DOH!.city)
    assert.deepEqual(a.revalidated, [`/reisen/${TRIP}`, '/reisen'])
  })
  for (const [name, options] of Object.entries({
    missing: { row: null }, foreign: { row: { trip_id: 'foreign' } }, wrongItem: { row: { id: 'other' } },
    nonFlight: { row: { kind: 'note' } }, provider: { row: { provider: 'test' } }, externalRef: { row: { external_ref: 'test' } },
    bookingUrl: { row: { booking_url: 'https://example.test' } }, emptyIdentity: { row: { provider: '' } }, unauthenticated: { auth: false },
  })) test(`${name}: no airport query, no write, no revalidate`, async () => {
    const a = kontoTest(options); assert.equal((await a.setzen(eingabe)).ok, false)
    assert.ok(a.operations.every(op => op.art !== 'update' && op.table !== 'airports'))
    assert.deepEqual(a.revalidated, [])
  })
  test('unknown airport at any position and failed airport read: no write', async () => {
    for (const options of [{ omitAirport: 'ZRH' }, { omitAirport: 'DOH' }, { omitAirport: 'BKK' }, { airportError: true }]) {
      const a = kontoTest(options); assert.equal((await a.setzen(eingabe)).ok, false)
      assert.ok(a.operations.every(op => op.art !== 'update')); assert.deepEqual(a.revalidated, [])
    }
  })
  test('invalid payload and nested/top-level injection rejected before authentication', async () => {
    const a = kontoTest()
    for (const input of [null, {}, ...invalidSegments.map(segments => ({ ...eingabe, segments })),
      ...extras.map(key => ({ ...eingabe, [key]: 'forged' })), { ...eingabe, tripId: 'bad' }, { ...eingabe, itemId: 'bad' }]) {
      assert.equal((await a.setzen(input)).ok, false, JSON.stringify(input))
    }
    assert.equal(a.authCalls(), 0); assert.deepEqual(a.operations, []); assert.deepEqual(a.revalidated, [])
  })
  test('all DB codes, including stored-function errors, and transport exceptions sanitized', async () => {
    for (const code of ['XX000', 'P0001', '22023', '53400']) {
      const error = { code, message: 'sensitive database detail' }
      for (const options of [{ readError: error }, { writeError: error }, { thrown: true }]) {
        const a = kontoTest(options); const result = await a.setzen(eingabe)
        assert.equal(result.ok, false); assert.doesNotMatch(JSON.stringify(result), /sensitive|secret/)
        assert.deepEqual(a.revalidated, [])
      }
    }
  })
  for (const concurrent of ['deleted', { kind: 'stay' }, { provider: 'new' }, { external_ref: 'new' }, { booking_url: 'https://example.test' }, { metadata: { newKey: 'retain' } }] as const) {
    test(`race ${JSON.stringify(concurrent)}: no success without matching update row`, async () => {
      const a = kontoTest({ concurrent }); assert.equal((await a.setzen(eingabe)).ok, false); assert.deepEqual(a.revalidated, [])
    })
  }
  test('omitted times explicitly clear stale item times', async () => {
    const a = kontoTest(); assert.equal((await a.setzen({ ...eingabe, segments: [{ ...direkt, departureTime: '', arrivalTime: null }] })).ok, true)
    assert.equal(a.operations[2]!.payload!.starts_at, null); assert.equal(a.operations[2]!.payload!.ends_at, null)
  })
})

function speicher() {
  const ablage = new Map<string, string>(); let writes = 0; let locked = false
  Object.assign(globalThis, { window: { localStorage: {
    getItem: (key: string) => ablage.get(key) ?? null,
    setItem: (key: string, value: string) => { if (locked) throw new Error('quota'); writes++; ablage.set(key, value) },
    removeItem: (key: string) => ablage.delete(key),
  } } })
  return { roh: () => ablage.get(SCHLUESSEL.aktiv), writes: () => writes, lock: () => { locked = true } }
}
function gastReise(ohneTag: boolean) {
  const base = beispielreise()
  const item = flug({ dayId: ohneTag ? null : base.days[0]!.id, priceAmount: 321, priceCurrency: 'CHF',
    bookingStatus: 'booked', bookingSource: 'user', bookingConfirmedAt: '2026-09-01T10:00:00Z' })
  return gastreiseSpeichern({ ...base, days: base.days.map((day, i) => i === 0 && !ohneTag ? { ...day, items: [item, ...day.items] } : day), ohneTag: ohneTag ? [item] : [] })
}
describe('Guest: narrow persisted route update', () => {
  for (const ohneTag of [false, true]) test(`${ohneTag ? 'ohneTag' : 'day item'}: exact patch, no country truth, siblings unchanged`, () => {
    const storage = speicher(); const reise = gastReise(ohneTag); const vorher = structuredClone(reise)
    const saved = gastFlugRouteManuellSetzen(reise, ITEM, segments)
    const expected = structuredClone(reise); const target = ohneTag ? expected.ohneTag[0]! : expected.days[0]!.items[0]!
    Object.assign(target, manuelleFlugRouteBauen(segments)); expected.revision++; expected.updatedAt = saved.updatedAt
    assert.deepEqual(saved, expected); assert.deepEqual(reise, vorher)
    assert.deepEqual(reiseLesen(JSON.parse(storage.roh()!)), saved)
    for (const segment of target.routeItinerary!.legs[0]!.segments) {
      assert.deepEqual(Object.keys(segment).sort(), ['arrivalDate', 'arrivalTime', 'departureDate', 'departureTime', 'destination', 'origin'])
      for (const point of [segment.origin, segment.destination]) {
        assert.match(point.airportCode!, /^[A-Z]{3}$/); assert.equal(point.countryCode, null); assert.equal(point.city, null); assert.equal(point.country, null)
      }
    }
    const facts = routeFactsFuerPunkt(target)
    assert.equal(facts.origin.airportCode, 'ZRH'); assert.equal(facts.destination.airportCode, 'BKK')
    assert.deepEqual(facts.transitCountryCodes, []); assert.deepEqual(facts.destinationCountryCodes, [])
  })
  test('missing/duplicate targets, invalid segments and protected items never write', () => {
    const storage = speicher(); const reise = gastReise(true); const original = storage.roh(); const count = storage.writes()
    assert.throws(() => gastFlugRouteManuellSetzen(reise, 'missing', segments))
    for (const data of invalidSegments) assert.throws(() => gastFlugRouteManuellSetzen(reise, ITEM, data))
    const item = reise.ohneTag[0]!
    for (const variant of [
      { ...reise, ohneTag: [item, item] },
      { ...reise, days: reise.days.map((day, i) => i === 0 ? { ...day, items: [...day.items, item] } : day) },
      ...([{ kind: 'note' }, { provider: 'test' }, { externalRef: 'test' }, { bookingUrl: 'https://example.test' }] as Partial<TripItem>[])
        .map(extra => ({ ...reise, ohneTag: [{ ...item, ...extra }] })),
    ]) assert.throws(() => gastFlugRouteManuellSetzen(variant, ITEM, segments))
    assert.equal(storage.roh(), original); assert.equal(storage.writes(), count)
  })
  test('invalid graph and failed storage do not report success; unknown IATA stays IATA-only', () => {
    const storage = speicher(); const reise = gastReise(true)
    assert.throws(() => gastFlugRouteManuellSetzen({ ...reise, title: '' }, ITEM, segments), /gültige Reise/)
    const saved = gastFlugRouteManuellSetzen(reise, ITEM, [{ ...direkt, origin: 'ZZZ' }])
    assert.deepEqual(saved.ohneTag[0]!.routeItinerary!.legs[0]!.segments[0]!.origin, { airportCode: 'ZZZ', countryCode: null, city: null, country: null })
    storage.lock(); assert.throws(() => gastFlugRouteManuellSetzen(reise, ITEM, segments), SpeicherFehler)
  })
})

test('route facts after account save; unchanged ambiguity remains fail-closed', async () => {
  const item = flug(); assert.equal(routeFactsFuerPunkt(item).quelle, 'none')
  const a = kontoTest(); await a.setzen(eingabe)
  const routeItinerary = itineraryAusMetadata(a.operations[2]!.payload!.metadata)!
  const facts = routeFactsFuerPunkt({ ...item, routeItinerary })
  assert.equal(facts.quelle, 'flight_itinerary'); assert.equal(facts.chronologieBewiesen, true)
  assert.equal(facts.origin.countryCode, 'CH'); assert.deepEqual(facts.transitCountryCodes, ['QA']); assert.deepEqual(facts.destinationCountryCodes, ['TH'])
  const cycle = [direkt, { ...anschluss, destination: 'ZRH' }]
  assert.ok(flugRouteManuellSchema.safeParse({ segments: cycle }).success)
  const ambiguous = routeFactsFuerPunkt({ ...item, ...manuelleFlugRouteBauen(cycle, TEST_FLUGHAFEN_REFS) })
  assert.equal(ambiguous.chronologieBewiesen, false); assert.equal(ambiguous.origin.airportCode, null); assert.deepEqual(ambiguous.transitCountryCodes, [])
})

type FlugSummary = Pick<TripItem, 'startsOn' | 'startsAt' | 'endsOn' | 'endsAt'>
const datumslinie: FlugSegmentManuell = { ...direkt, departureDate: '2026-01-02', departureTime: '23:30', arrivalDate: '2026-01-01', arrivalTime: '12:00' }
const frueheOrtszeit: FlugSegmentManuell = { ...datumslinie, departureTime: '18:00', arrivalDate: '2026-01-02', arrivalTime: '09:00' }
const lokaleFaelle: Array<{ name: string; input: FlugSegmentManuell[]; summary: FlugSummary }> = [
  { name: 'Date Line: earlier local arrival date', input: [datumslinie],
    summary: { startsOn: '2026-01-02', startsAt: '23:30', endsOn: null, endsAt: null } },
  { name: 'same date: earlier arrival clock at different airport', input: [frueheOrtszeit],
    summary: { startsOn: '2026-01-02', startsAt: '18:00', endsOn: '2026-01-02', endsAt: null } },
  { name: 'same date: arrival clock without departure clock', input: [{ ...frueheOrtszeit, departureTime: null }],
    summary: { startsOn: '2026-01-02', startsAt: null, endsOn: '2026-01-02', endsAt: null } },
  { name: 'later date: arrival clock without departure clock', input: [{ ...frueheOrtszeit, departureTime: null, arrivalDate: '2026-01-03' }],
    summary: { startsOn: '2026-01-02', startsAt: null, endsOn: '2026-01-03', endsAt: null } },
  { name: 'later date: earlier clock is representable with departure clock', input: [{ ...frueheOrtszeit, arrivalDate: '2026-01-03' }],
    summary: { startsOn: '2026-01-02', startsAt: '18:00', endsOn: '2026-01-03', endsAt: '09:00' } },
  { name: 'same date: equal clocks are representable', input: [{ ...frueheOrtszeit, arrivalTime: '18:00' }],
    summary: { startsOn: '2026-01-02', startsAt: '18:00', endsOn: '2026-01-02', endsAt: '18:00' } },
  { name: 'missing arrival clock remains null', input: [{ ...frueheOrtszeit, arrivalTime: null }],
    summary: { startsOn: '2026-01-02', startsAt: '18:00', endsOn: '2026-01-02', endsAt: null } },
  { name: 'normal direct flight', input: [direkt],
    summary: { startsOn: '2026-11-01', startsAt: '09:15', endsOn: '2026-11-01', endsAt: '16:40' } },
  { name: 'normal connecting route', input: segments,
    summary: { startsOn: '2026-11-01', startsAt: '09:15', endsOn: '2026-11-02', endsAt: '07:10' } },
  { name: 'Date Line route envelope retains both segments', input: [datumslinie, { ...anschluss,
    departureDate: '2026-01-01', departureTime: '13:00', arrivalDate: '2026-01-01', arrivalTime: '14:00' }],
    summary: { startsOn: '2026-01-02', startsAt: '23:30', endsOn: null, endsAt: null } },
  { name: 'same-date route envelope with missing connection clocks', input: [
    { ...frueheOrtszeit, arrivalTime: null }, { ...anschluss, departureDate: '2026-01-02', departureTime: null,
      arrivalDate: '2026-01-02', arrivalTime: '08:00' }],
    summary: { startsOn: '2026-01-02', startsAt: '18:00', endsOn: '2026-01-02', endsAt: null } },
]

function summaryVon(punkt: FlugSummary): FlugSummary {
  return { startsOn: punkt.startsOn, startsAt: punkt.startsAt, endsOn: punkt.endsOn, endsAt: punkt.endsAt }
}
function lokaleAngaben(route: NonNullable<TripItem['routeItinerary']>): FlugSegmentManuell[] {
  return route.legs.flatMap(leg => leg.segments.map(segment => ({
    origin: segment.origin.airportCode!, destination: segment.destination.airportCode!,
    departureDate: segment.departureDate!, departureTime: segment.departureTime,
    arrivalDate: segment.arrivalDate!, arrivalTime: segment.arrivalTime,
  })))
}
/** CHECK predicates from 20260817120000_reiseschema.sql; no duration/UTC assertion. */
function legacyDbVertragPruefen({ startsOn, startsAt, endsOn, endsAt }: FlugSummary) {
  assert.ok(endsOn === null || startsOn !== null, 'trip_items_ende_braucht_anfang')
  assert.ok(endsAt === null || startsAt !== null, 'trip_items_endzeit_braucht_anfangszeit')
  assert.ok(endsOn === null || endsOn > startsOn! ||
    (endsOn === startsOn && (endsAt === null || startsAt === null || endsAt >= startsAt)), 'trip_items_reihenfolge')
}

describe('P2 correction: local airport times and legacy summary representability', () => {
  for (const { name, input, summary } of lokaleFaelle) test(`${name}: schema, pure projection, account and guest`, async () => {
    const original = structuredClone(input)
    const validated = flugRouteManuellSchema.parse({ segments: input }).segments
    assert.deepEqual(validated, original)
    const projection = manuelleFlugSummaryProjizieren(validated[0]!, validated.at(-1)!)
    assert.deepEqual(projection, summary); legacyDbVertragPruefen(projection)
    const built = manuelleFlugRouteBauen(validated)!
    assert.deepEqual(summaryVon(built), summary)
    assert.deepEqual(lokaleAngaben(built.routeItinerary), original)
    assert.deepEqual(input, original, 'projection must not rewrite route input')

    const account = kontoTest()
    assert.deepEqual(await account.setzen({ ...eingabe, segments: input }), { ok: true, wert: null })
    const update = account.operations.find(op => op.art === 'update')!
    assert.deepEqual(Object.keys(update.payload!).sort(), ['ends_at', 'ends_on', 'metadata', 'starts_at', 'starts_on'])
    const accountSummary = { startsOn: update.payload!.starts_on, startsAt: update.payload!.starts_at,
      endsOn: update.payload!.ends_on, endsAt: update.payload!.ends_at } as FlugSummary
    assert.deepEqual(accountSummary, summary); legacyDbVertragPruefen(accountSummary)
    const accountRoute = itineraryAusMetadata(update.payload!.metadata)!
    assert.deepEqual(lokaleAngaben(accountRoute), original)
    assert.equal(accountRoute.legs[0]!.segments[0]!.origin.countryCode, 'CH')
    assert.deepEqual((update.payload!.metadata as Record<string, unknown>).unrelated, { nested: ['keep', 3] })
    assert.deepEqual(account.revalidated, [`/reisen/${TRIP}`, '/reisen'])

    for (const ohneTag of [false, true]) {
      const storage = speicher(); const reise = gastReise(ohneTag); const untouched = structuredClone(reise)
      const saved = gastFlugRouteManuellSetzen(reise, ITEM, input)
      const target = ohneTag ? saved.ohneTag[0]! : saved.days[0]!.items[0]!
      assert.deepEqual(summaryVon(target), accountSummary); legacyDbVertragPruefen(target)
      assert.deepEqual(lokaleAngaben(target.routeItinerary!), original)
      for (const segment of target.routeItinerary!.legs[0]!.segments) {
        for (const point of [segment.origin, segment.destination]) assert.deepEqual(
          { countryCode: point.countryCode, city: point.city, country: point.country },
          { countryCode: null, city: null, country: null })
        assert.equal(Object.hasOwn(segment, 'surfaceFromAirportCode'), false)
      }
      const expected = structuredClone(reise)
      Object.assign(ohneTag ? expected.ohneTag[0]! : expected.days[0]!.items[0]!, summary, { routeItinerary: target.routeItinerary })
      expected.revision++; expected.updatedAt = saved.updatedAt
      assert.deepEqual(saved, expected, 'all sibling and non-route target fields retained')
      assert.deepEqual(reise, untouched); assert.deepEqual(reiseLesen(JSON.parse(storage.roh()!)), saved)
      const facts = routeFactsFuerPunkt(target)
      assert.deepEqual(facts.segments, target.routeItinerary!.legs[0]!.segments)
      assert.deepEqual(facts.destinationCountryCodes, []); assert.deepEqual(facts.transitCountryCodes, [])
    }
    const accountFacts = routeFactsFuerPunkt(flug({ ...accountSummary, routeItinerary: accountRoute }))
    assert.deepEqual(accountFacts.segments, accountRoute.legs[0]!.segments)
  })

  test('same-airport reversed connection clock/date fails before auth or guest persistence', async () => {
    const first = { ...frueheOrtszeit, arrivalTime: '18:00' }
    for (const input of [
      [first, { ...anschluss, departureDate: '2026-01-02', departureTime: '17:00' }],
      [{ ...first, arrivalDate: '2026-01-03', arrivalTime: null }, { ...anschluss, departureDate: '2026-01-02', departureTime: null }],
    ]) {
      assert.equal(flugRouteManuellSchema.safeParse({ segments: input }).success, false)
      const account = kontoTest(); assert.equal((await account.setzen({ ...eingabe, segments: input })).ok, false)
      assert.equal(account.authCalls(), 0); assert.deepEqual(account.operations, []); assert.deepEqual(account.revalidated, [])
      const storage = speicher(); const reise = gastReise(true); const before = storage.roh(); const writes = storage.writes()
      assert.throws(() => gastFlugRouteManuellSetzen(reise, ITEM, input), /Anschluss/)
      assert.equal(storage.roh(), before); assert.equal(storage.writes(), writes)
    }
  })

  test('same-airport missing optional clock remains unknown; equal clock and later date pass', () => {
    for (const [arrivalTime, departureTime] of [[null, '17:00'], ['18:00', null], [null, null], ['18:00', '18:00']] as const) {
      const input = [{ ...frueheOrtszeit, arrivalTime }, { ...anschluss, departureDate: '2026-01-02', departureTime }]
      assert.ok(flugRouteManuellSchema.safeParse({ segments: input }).success)
    }
    assert.ok(flugRouteManuellSchema.safeParse({ segments: [{ ...frueheOrtszeit, arrivalTime: '18:00' },
      { ...anschluss, departureDate: '2026-01-03', departureTime: '01:00' }] }).success)
    assert.equal(flugRouteManuellSchema.safeParse({ segments: [frueheOrtszeit, { ...anschluss, origin: 'DXB' }] }).success, false)
  })

  test('existing FlugRoute details show exact local Date-Line and earlier-clock values, never degraded summary', () => {
    for (const first of [datumslinie, frueheOrtszeit]) {
      const input = [first, { ...anschluss, departureDate: first.arrivalDate, departureTime: '13:00',
        arrivalDate: first.arrivalDate, arrivalTime: '14:00' }]
      const validated = flugRouteManuellSchema.parse({ segments: input }).segments
      const built = manuelleFlugRouteBauen(validated, TEST_FLUGHAFEN_REFS)!
      const facts = routeFactsFuerPunkt(flug(built))
      assert.equal(built.endsAt, null)
      assert.deepEqual(lokaleAngaben(built.routeItinerary), input)
      assert.deepEqual(facts.segments, built.routeItinerary.legs[0]!.segments)
      const html = renderToStaticMarkup(React.createElement(FlugRoute, { facts }))
      assert.ok(html.includes(`${first.departureDate} ${first.departureTime} → ${first.arrivalDate} ${first.arrivalTime}`))
      assert.ok(html.includes(`${first.arrivalDate} 13:00 → ${first.arrivalDate} 14:00`))
    }
  })

  test('editor accepts and prefills the exact local route rather than its degraded summary', async () => {
    for (const segment of [datumslinie, frueheOrtszeit]) {
      const ui = editor(); ui.open(); ui.fill([segment]); await ui.submit()
      assert.deepEqual(ui.calls, [[ITEM, [segment]]]); assert.equal(ui.inputs().length, 0)
      const reopened = editor(flug(manuelleFlugRouteBauen([segment])!)); reopened.open()
      assert.deepEqual(reopened.inputs().map(input => input.props.value), [segment.origin, segment.destination,
        segment.departureDate, segment.departureTime, segment.arrivalDate, segment.arrivalTime])
    }
  })
})

type Props = {
  onSpeichern?: (id: string, segments: FlugSegmentManuell[]) => Promise<string | null>
  children?: React.ReactNode; type?: string; value?: string; id?: string; htmlFor?: string; role?: string; disabled?: boolean; 'aria-label'?: string
  onClick?: () => void; onChange?: (event: { target: { value: string } }) => void
  onSubmit?: (event: { preventDefault: () => void }) => Promise<void>
}
function elements(node: React.ReactNode, match: (el: React.ReactElement<Props>) => boolean): React.ReactElement<Props>[] {
  const found: React.ReactElement<Props>[] = []
  React.Children.forEach(node, child => {
    if (!React.isValidElement<Props>(child)) return
    if (match(child)) found.push(child)
    found.push(...elements(child.props.children, match))
  }); return found
}
function editor(item = flug(), outcome: string | null | Error | (() => Promise<string | null>) = null) {
  const states: unknown[] = []; const refs: Array<{ current: unknown }> = []; let index = 0; let refIndex = 0
  const calls: unknown[][] = []
  const ui = laden<{ default: typeof FlugBestand }>('components/trips/FlugBestand.tsx', {
    react: { ...React, useId: () => 'flight-editor', useEffect: () => {}, useLayoutEffect: () => {},
      useRef: (initial: unknown) => refs[refIndex++] ?? (refs[refIndex - 1] = { current: initial }),
      useState: (initial: unknown) => {
        const slot = index++; if (!(slot in states)) states[slot] = initial
        return [states[slot], (value: unknown) => { states[slot] = typeof value === 'function' ? value(states[slot]) : value }]
      },
    },
  })
  const save = async (...args: unknown[]) => {
    calls.push(args); if (outcome instanceof Error) throw outcome
    return typeof outcome === 'function' ? outcome() : outcome
  }
  const outer = ui.default({ reise: beispielreise({ days: [], ohneTag: [item] }), onFlugRouteManuell: save })
  const child = elements(outer, el => typeof el.type === 'function' && el.type.name === 'ManuelleFlugRoute')[0]!
  states.length = 0; refs.length = 0
  const render = () => { index = 0; refIndex = 0; return (child.type as (props: Props) => React.ReactNode)({ ...child.props, onSpeichern: save }) }
  const buttons = () => elements(render(), el => el.type === 'button')
  const open = () => buttons()[0]!.props.onClick!()
  const inputs = () => elements(render(), el => el.type === 'input')
  const submit = () => elements(render(), el => el.type === 'form')[0]!.props.onSubmit!({ preventDefault() {} })
  const fill = (data: FlugSegmentManuell[], append = true) => {
    if (append) for (let i = inputs().length / 6; i < data.length; i++) buttons().find(b => b.props.children === 'Segment hinzufügen')!.props.onClick!()
    data.flatMap(segment => [segment.origin, segment.destination, segment.departureDate, segment.departureTime ?? '', segment.arrivalDate, segment.arrivalTime ?? ''])
      .forEach((value, i) => inputs()[i]!.props.onChange!({ target: { value } }))
  }
  return { render, open, inputs, submit, fill, calls, buttons }
}

describe('Flight editor: actual render and event paths', () => {
  function html(item: TripItem, callback = true) {
    return renderToStaticMarkup(React.createElement(FlugBestand, {
      reise: beispielreise({ days: [], ohneTag: [item] }), onFlugRouteManuell: callback ? async () => null : undefined, onBuchungsstatus: async () => null,
    }))
  }
  test('add/change affordance, manual booked allowed, provider/ref/url not editable, booking separate', () => {
    assert.match(html(flug()), /Flugroute ergänzen/)
    const leererPunkt = { airportCode: null, countryCode: null, city: null, country: null }
    assert.match(html(flug({ routeItinerary: { v: 1, type: 'flight_route_itinerary', legs: [{ segments: [{
      origin: leererPunkt, destination: leererPunkt, departureDate: null, departureTime: null, arrivalDate: null, arrivalTime: null,
    }] }] } })), /Flugroute ergänzen/)
    assert.match(html(flug(manuelleFlugRouteBauen(segments)!)), /Flugroute ändern/)
    assert.match(html(flug({ bookingStatus: 'booked', bookingSource: 'user' })), /Flugroute ergänzen/)
    assert.match(html(flug()), /Als gebucht markieren/)
    for (const identity of [{ provider: 'test' }, { externalRef: 'test' }, { bookingUrl: 'https://example.test' }]) assert.doesNotMatch(html(flug(identity)), /Flugroute ergänzen|Flugroute ändern/)
    assert.doesNotMatch(html(flug(), false), /Flugroute ergänzen|Flugroute ändern/)
    const ui = editor(); ui.open()
    assert.doesNotMatch(renderToStaticMarkup(React.createElement(React.Fragment, null, ui.render())), /Als gebucht markieren/)
  })
  test('empty fields are not inferred; saved route prefill, labelled date/time inputs', () => {
    const empty = editor(flug({ startsOn: '2026-11-01', startsAt: '09:00' })); empty.open()
    assert.deepEqual(empty.inputs().map(input => input.props.value), Array(6).fill(''))
    const ui = editor(flug(manuelleFlugRouteBauen(segments)!)); ui.open()
    assert.deepEqual(ui.inputs().map(input => input.props.value), segments.flatMap(s => [s.origin, s.destination, s.departureDate, s.departureTime, s.arrivalDate, s.arrivalTime]))
    assert.deepEqual(elements(ui.render(), el => el.type === 'label').map(l => l.props.htmlFor), ui.inputs().map(i => i.props.id))
    assert.deepEqual(ui.inputs().map(i => i.props.type), ['text', 'text', 'date', 'time', 'date', 'time', 'text', 'text', 'date', 'time', 'date', 'time'])
    assert.deepEqual(ui.calls, [])
  })
  test('explicit add/remove; 1–4 bound; removing middle does not silently repair continuity', async () => {
    const ui = editor(); ui.open(); ui.fill(segments)
    for (let i = 0; i < 5; i++) ui.buttons().find(b => b.props.children === 'Segment hinzufügen')!.props.onClick!()
    assert.equal(ui.inputs().length, 24); assert.equal(ui.buttons().find(b => b.props.children === 'Segment hinzufügen')!.props.disabled, true)
    ui.buttons().find(b => b.props['aria-label'] === 'Segment 2 entfernen')!.props.onClick!()
    assert.equal(ui.inputs().length, 18); await ui.submit(); assert.deepEqual(ui.calls, [])
  })
  test('invalid submit no callback; no autosave; exact normalized payload; success closes', async () => {
    const ui = editor(); ui.open(); await ui.submit(); assert.deepEqual(ui.calls, [])
    ui.fill([{ ...direkt, destination: 'ZRH' }]); await ui.submit(); assert.deepEqual(ui.calls, [])
    assert.equal(elements(ui.render(), el => el.props.role === 'alert').length, 1)
    ui.fill([{ ...direkt, origin: 'zrh', departureTime: null }]); assert.deepEqual(ui.calls, [])
    await ui.submit(); assert.deepEqual(ui.calls, [[ITEM, [{ ...direkt, departureTime: null }]]])
    assert.equal(ui.inputs().length, 0); assert.equal(elements(ui.render(), el => el.props.role === 'status').length, 1)
  })
  test('failure keeps input; thrown details sanitized; cancel writes nothing', async () => {
    for (const outcome of ['Airport unbekannt.', new Error('secret transport')]) {
      const ui = editor(flug(), outcome); ui.open(); ui.fill(segments); await ui.submit()
      assert.equal(ui.inputs().length, 12); assert.equal(ui.inputs()[0]!.props.value, 'ZRH')
      assert.doesNotMatch(String(elements(ui.render(), el => el.props.role === 'alert')[0]!.props.children), /secret/)
      ui.buttons().at(-1)!.props.onClick!(); assert.equal(ui.inputs().length, 0); assert.equal(ui.calls.length, 1)
    }
    const ui = editor(); ui.open(); ui.fill(segments); ui.buttons().at(-1)!.props.onClick!(); assert.deepEqual(ui.calls, [])
  })
  test('in-flight duplicate submit blocked', async () => {
    let finish!: (value: null) => void
    const ui = editor(flug(), () => new Promise(resolve => { finish = resolve })); ui.open(); ui.fill(segments)
    const first = ui.submit(); await ui.submit(); assert.equal(ui.calls.length, 1)
    finish(null); await first; assert.equal(ui.inputs().length, 0)
  })
  test('legacy multi-leg and >4 segment routes are never silently truncated or rewritten', async () => {
    const route = manuelleFlugRouteBauen(segments)!.routeItinerary
    for (const routeItinerary of [{ ...route, legs: [...route.legs, ...route.legs] }, { ...route, legs: [{ segments: Array(5).fill(route.legs[0]!.segments[0]!) }] }]) {
      const ui = editor(flug({ routeItinerary })); ui.open(); await ui.submit()
      assert.deepEqual(ui.calls, []); assert.equal(ui.inputs().length, 0)
      assert.equal(elements(ui.render(), el => el.props.role === 'alert').length, 1)
    }
  })
})

test('narrow Workspace wiring refreshes account on success and uses persisted guest graph', async () => {
  type WorkspaceElement = React.ReactElement<{ onFlugRouteManuell: (id: string, segments: FlugSegmentManuell[]) => Promise<string | null> }>
  const reise = beispielreise({ id: TRIP }); const args: unknown[] = []; let refreshes = 0; let fail = false
  const account = laden<{ default: (props: { reise: Trip; ohneTag: TripItem[] }) => WorkspaceElement }>('components/trips/KontoArbeitsbereich.tsx', {
    react: { ...React, useEffect: () => {}, useRef: (initial: unknown) => ({ current: initial }), useState: (initial: unknown) => [initial, () => {}] },
    'next/navigation': { useRouter: () => ({ refresh: () => { refreshes++ } }) },
    '@/lib/trips/aktionen': { flugRouteManuellSetzen: async (input: unknown) => { args.push(input); return fail ? { ok: false, meldung: 'Abgelehnt' } : { ok: true, wert: null } } },
  })
  const callback = account.default({ reise, ohneTag: [] }).props.onFlugRouteManuell
  assert.equal(await callback(ITEM, segments), null); assert.deepEqual(args, [eingabe]); assert.equal(refreshes, 1)
  fail = true; assert.equal(await callback(ITEM, segments), 'Abgelehnt'); assert.equal(refreshes, 1)
  const saved = { ...reise, revision: reise.revision + 1 }; const states = [reise, true, '']; const writes: unknown[] = []; const guestArgs: unknown[] = []
  let guestFail = false
  const guest = laden<{ default: (props: { tripId: string }) => WorkspaceElement }>('components/trips/GastArbeitsbereich.tsx', {
    react: { ...React, useEffect: () => {}, useState: () => [states.shift(), (value: unknown) => writes.push(value)] },
    'next/navigation': { useRouter: () => ({}) },
    '@/lib/trips/gastspeicher': { gastFlugRouteManuellSetzen: (...input: unknown[]) => { guestArgs.push(input); if (guestFail) throw new Error('Speicherfehler'); return saved } },
  })
  const guestCallback = guest.default({ tripId: TRIP }).props.onFlugRouteManuell
  assert.equal(await guestCallback(ITEM, segments), null); assert.deepEqual(guestArgs, [[reise, ITEM, segments]]); assert.equal(writes[0], saved)
  guestFail = true; assert.equal(await guestCallback(ITEM, segments), 'Speicherfehler'); assert.equal(writes.length, 1)
  assert.match(readFileSync(resolve(root, 'components/trips/TripWorkspace.tsx'), 'utf8'), /<FlugBestand[^>]*onFlugRouteManuell=\{onFlugRouteManuell\}/)
})
