import assert from 'node:assert/strict'
import { readFileSync } from 'node:fs'
import { createRequire } from 'node:module'
import { dirname, resolve } from 'node:path'
import { describe, test } from 'node:test'
import { fileURLToPath } from 'node:url'
import * as React from 'react'
import { renderToStaticMarkup } from 'react-dom/server'
import ts from 'typescript'

import UnterkunftBestand from '@/components/trips/UnterkunftBestand'
import type { unterkunftZeitraumSetzen } from '@/lib/trips/aktionen'
import { meldungAus, NICHT_ANGEMELDET } from '@/lib/trips/anlegen'
import { beispielreise } from '@/lib/reiseaenderung/fixtures/reise'
import { unterkunftZeitraumSchema } from '@/lib/trips/schema'
import { istManuelleUnterkunft } from '@/lib/trips/unterkunft-manuell'
import type { TripItem } from '@/types/trips'

const root = resolve(dirname(fileURLToPath(import.meta.url)), '../..')
const require = createRequire(import.meta.url)
const TRIP = 'aaaaaaaa-0000-4000-8000-000000000001'
const ITEM = 'aaaaaaaa-0000-4000-8000-000000000002'
const zeitraum = { startsOn: '2026-09-12', endsOn: '2026-09-16' }
const eingabe = { tripId: TRIP, itemId: ITEM, ...zeitraum }
const ungueltig = [
  { startsOn: '2026-09-12', endsOn: '2026-09-12' },
  { startsOn: '2026-09-13', endsOn: '2026-09-12' },
  { startsOn: '2026-02-29', endsOn: '2026-03-02' },
  { startsOn: '2026-04-31', endsOn: '2026-05-02' },
  { startsOn: '2026-09-12', endsOn: '' },
  { startsOn: '', endsOn: '2026-09-16' },
  { startsOn: '12.09.2026', endsOn: '2026-09-16' },
  { startsOn: '2026-9-12', endsOn: '2026-09-16' },
  { startsOn: '2026-09-12T00:00:00Z', endsOn: '2026-09-16' },
  { startsOn: ' 2026-09-12', endsOn: '2026-09-16' },
]

function stay(teil: Partial<TripItem> = {}): TripItem {
  return { ...beispielreise().days[0]!.items[0]!, id: ITEM, kind: 'stay', title: 'Manuelle Unterkunft',
    startsOn: null, endsOn: null, provider: null, externalRef: null, bookingUrl: null, ...teil }
}

// Run the actual module; replace only framework/auth/transport seams.
function laden<T>(path: string, dependencies: Record<string, unknown>): T {
  const filename = resolve(root, path)
  const code = ts.transpileModule(readFileSync(filename, 'utf8'), {
    fileName: filename,
    compilerOptions: { module: ts.ModuleKind.CommonJS, target: ts.ScriptTarget.ES2022, jsx: ts.JsxEmit.ReactJSX },
  }).outputText
  const loaded = { exports: {} }
  new Function('require', 'module', 'exports', code)((name: string) =>
    Object.hasOwn(dependencies, name) ? dependencies[name] : require(name.startsWith('@/') ? resolve(root, name.slice(2)) : name),
  loaded, loaded.exports)
  return loaded.exports as T
}

describe('Manuelle Unterkunft: gemeinsame Grenze und Datumsvertrag', () => {
  test('nur fehlende Identität; Booking, Preis und Notiz schliessen manuelle Stays nicht aus', () => {
    assert.equal(istManuelleUnterkunft({ kind: 'stay' }), true)
    assert.equal(istManuelleUnterkunft(stay()), true)
    assert.equal(istManuelleUnterkunft(stay({ bookingStatus: 'booked', bookingSource: 'user', priceAmount: 100 })), true)
    for (const key of ['provider', 'externalRef', 'bookingUrl']) {
      for (const value of ['provider-test', '', ' ', false, 0]) {
        assert.equal(istManuelleUnterkunft({ ...stay(), [key]: value }), false, `${key}=${value}`)
      }
    }
    for (const kind of ['flight', 'activity', 'note', null, undefined]) {
      assert.equal(istManuelleUnterkunft({ kind }), false)
    }
  })
  test('exakte ISO-Kalendertage und streng positives Intervall', () => {
    assert.deepEqual(unterkunftZeitraumSchema.parse(zeitraum), zeitraum)
    assert.ok(unterkunftZeitraumSchema.safeParse({ startsOn: '2028-02-29', endsOn: '2028-03-01' }).success)
    for (const input of [...ungueltig, {}, { startsOn: zeitraum.startsOn }, { endsOn: zeitraum.endsOn }, null,
      { startsOn: 20260912, endsOn: zeitraum.endsOn }]) {
      assert.equal(unterkunftZeitraumSchema.safeParse(input).success, false, JSON.stringify(input))
    }
  })
})

type DbRow = { id: string; trip_id: string; kind: string; provider: string | null; external_ref: string | null; booking_url: string | null }
type DbError = { message: string; code: string }
function kontoTest(options: {
  row?: Partial<DbRow> | null; auth?: boolean; readError?: DbError; writeError?: DbError; concurrent?: Partial<DbRow> | 'deleted'
} = {}) {
  let row: DbRow | null = options.row === null ? null : { id: ITEM, trip_id: TRIP, kind: 'stay', provider: null, external_ref: null, booking_url: null, ...options.row }
  const operations: Array<{ art: 'read' | 'update'; filters: Array<[string, unknown]>; select?: string; payload?: Record<string, unknown> }> = []
  const revalidated: string[] = []
  let authCalls = 0
  const supabase = {
    from(table: string) {
      assert.equal(table, 'trip_items')
      const operation: (typeof operations)[number] = { art: 'read', filters: [] }
      operations.push(operation)
      const query = {
        select(columns: string) { operation.select = columns; return query },
        update(payload: Record<string, unknown>) { operation.art = 'update'; operation.payload = payload; return query },
        eq(key: string, value: unknown) { operation.filters.push([key, value]); return query },
        is(key: string, value: null) { operation.filters.push([key, value]); return query },
        async maybeSingle() {
          const error = operation.art === 'read' ? options.readError : options.writeError
          const matches = row && operation.filters.every(([key, value]) => row![key as keyof DbRow] === value)
          const data = matches ? { ...row } : null
          if (operation.art === 'read' && options.concurrent) {
            row = options.concurrent === 'deleted' ? null : { ...row!, ...options.concurrent }
          }
          return { data: error ? null : data, error: error ?? null, status: error ? 500 : 200 }
        },
      }
      return query
    },
  }
  const actions = laden<{ unterkunftZeitraumSetzen: typeof unterkunftZeitraumSetzen }>('lib/trips/aktionen.ts', {
    'next/cache': { revalidatePath: (path: string) => revalidated.push(path) },
    '@/lib/trips/anlegen': { meldungAus, NICHT_ANGEMELDET, konto: async () => {
      authCalls++; return { supabase, benutzerId: options.auth === false ? null : 'owner' }
    } },
  })
  return { operations, revalidated, authCalls: () => authCalls, setzen: actions.unterkunftZeitraumSetzen }
}

describe('Account: reale Server Action mit begrenztem Transport', () => {
  test('exakter Trip+Item-Read, genau ein guarded UPDATE mit nur zwei Datumsfeldern', async () => {
    const account = kontoTest()
    assert.deepEqual(await account.setzen({ ...eingabe, title: 'angriff', provider: 'forged', booking_status: 'booked', day_id: 'other' }), { ok: true, wert: null })
    assert.equal(account.authCalls(), 1)
    assert.equal(account.operations.length, 2)
    assert.deepEqual(account.operations[0], { art: 'read', select: 'id, kind, provider, external_ref, booking_url', filters: [['id', ITEM], ['trip_id', TRIP]] })
    assert.deepEqual(account.operations[1], { art: 'update', payload: { starts_on: zeitraum.startsOn, ends_on: zeitraum.endsOn },
      select: 'id', filters: [['id', ITEM], ['trip_id', TRIP], ['kind', 'stay'], ['provider', null], ['external_ref', null], ['booking_url', null]] })
    assert.deepEqual(account.revalidated, [`/reisen/${TRIP}`, '/reisen'])
  })
  for (const [name, options] of Object.entries({
    missing: { row: null }, foreign: { row: { trip_id: 'foreign' } }, wrongItem: { row: { id: 'other' } },
    nonStay: { row: { kind: 'note' } }, provider: { row: { provider: 'test' } },
    externalRef: { row: { external_ref: 'test' } }, bookingUrl: { row: { booking_url: 'https://example.test' } },
    emptyIdentity: { row: { provider: '' } }, unauthenticated: { auth: false },
  })) {
    test(`${name}: kein Update, keine Revalidierung`, async () => {
      const account = kontoTest(options)
      assert.equal((await account.setzen(eingabe)).ok, false)
      assert.equal(account.operations.filter(op => op.art === 'update').length, 0)
      assert.deepEqual(account.revalidated, [])
    })
  }
  test('untrusted invalid input scheitert vor Auth/DB', async () => {
    const account = kontoTest()
    for (const input of [null, {}, ...ungueltig.map(dates => ({ ...eingabe, ...dates })), { ...eingabe, tripId: 'wrong' }, { ...eingabe, itemId: 'wrong' }]) {
      assert.equal((await account.setzen(input)).ok, false)
    }
    assert.equal(account.authCalls(), 0)
    assert.deepEqual(account.operations, [])
    assert.deepEqual(account.revalidated, [])
  })
  test('DB-Fehler werden mit dem bestehenden Sanitizer übersetzt', async () => {
    const error = { message: 'sensitive database detail', code: 'XX000' }
    for (const options of [{ readError: error }, { writeError: error }]) {
      const account = kontoTest(options)
      assert.deepEqual(await account.setzen(eingabe), { ok: false, meldung: meldungAus(error, 500) })
      assert.doesNotMatch(JSON.stringify(await account.setzen(eingabe)), /sensitive/)
      assert.deepEqual(account.revalidated, [])
    }
  })
  for (const concurrent of ['deleted', { kind: 'flight' }, { provider: 'new' }, { external_ref: 'new' }, { booking_url: 'https://example.test' }] as const) {
    test(`konkurrierende Änderung ${JSON.stringify(concurrent)}: kein Erfolg ohne geschriebene Zeile`, async () => {
      const account = kontoTest({ concurrent })
      assert.equal((await account.setzen(eingabe)).ok, false)
      assert.deepEqual(account.revalidated, [])
    })
  }
})

type Props = {
  children?: React.ReactNode; type?: string; value?: string; id?: string; htmlFor?: string; role?: string
  onClick?: () => void; onChange?: (event: { target: { value: string } }) => void
  onSubmit?: (event: { preventDefault: () => void }) => Promise<void>
}
function elements(node: React.ReactNode, match: (el: React.ReactElement<Props>) => boolean): React.ReactElement<Props>[] {
  const found: React.ReactElement<Props>[] = []
  React.Children.forEach(node, child => {
    if (!React.isValidElement<Props>(child)) return
    if (match(child)) found.push(child)
    found.push(...elements(child.props.children, match))
  })
  return found
}

function editor(item = stay(), outcome: string | null | Error = null) {
  const states: unknown[] = []
  const refs: Array<{ current: unknown }> = []
  let index = 0
  let refIndex = 0
  const calls: unknown[][] = []
  const ui = laden<{ default: typeof UnterkunftBestand }>('components/trips/UnterkunftBestand.tsx', {
    react: { ...React, useId: () => 'date-editor',
      useRef: (initial: unknown) => refs[refIndex++] ?? (refs[refIndex - 1] = { current: initial }),
      useState: (initial: unknown) => {
        const slot = index++
        if (!(slot in states)) states[slot] = initial
        return [states[slot], (value: unknown) => { states[slot] = value }]
      },
    },
  })
  const outer = ui.default({ reise: beispielreise({ days: [], ohneTag: [item] }), onUnterkunftZeitraum: async (...args) => {
    calls.push(args)
    if (outcome instanceof Error) throw outcome
    return outcome
  } })
  const child = elements(outer, el => typeof el.type === 'function' && el.type.name === 'UnterkunftZeitraum')[0]!
  states.length = 0
  refs.length = 0
  const render = () => {
    index = 0; refIndex = 0
    return (child.type as (props: Props) => React.ReactNode)(child.props)
  }
  const buttons = () => elements(render(), el => el.type === 'button')
  const open = () => buttons()[0]!.props.onClick!()
  const inputs = () => elements(render(), el => el.type === 'input')
  const submit = () => elements(render(), el => el.type === 'form')[0]!.props.onSubmit!({ preventDefault() {} })
  const fill = (dates: typeof zeitraum) => {
    inputs()[0]!.props.onChange!({ target: { value: dates.startsOn } })
    inputs()[1]!.props.onChange!({ target: { value: dates.endsOn } })
  }
  return { render, open, inputs, submit, fill, calls, buttons }
}

describe('Unterkunft UI: echte Render- und Submit-Pfade', () => {
  function html(item: TripItem, callback = true) {
    return renderToStaticMarkup(React.createElement(UnterkunftBestand, {
      reise: beispielreise({ days: [], ohneTag: [item] }),
      onUnterkunftZeitraum: callback ? async () => null : undefined, onBuchungsstatus: async () => null,
    }))
  }
  test('fehlend/ungültig vs vollständig, Provider/Ref/URL und optionaler Callback', () => {
    for (const dates of [{ startsOn: null, endsOn: null }, ...ungueltig]) assert.match(html(stay(dates)), /Zeitraum ergänzen/)
    assert.match(html(stay(zeitraum)), /Zeitraum ändern/)
    assert.match(html(stay({ bookingStatus: 'booked', bookingSource: 'user' })), /Zeitraum ergänzen/)
    assert.match(html(stay()), /Als gebucht markieren/)
    for (const identity of [{ provider: 'test' }, { externalRef: 'test' }, { bookingUrl: 'https://example.test' }]) {
      assert.doesNotMatch(html(stay(identity)), /Zeitraum ergänzen|Zeitraum ändern/)
    }
    assert.doesNotMatch(html(stay(), false), /Zeitraum ergänzen|Zeitraum ändern/)
  })
  test('vorhandene Werte werden vorgefüllt, fehlende bleiben leer; native Inputs haben Labels', () => {
    for (const dates of [zeitraum, { startsOn: null, endsOn: null }, { startsOn: zeitraum.startsOn, endsOn: null }]) {
      const ui = editor(stay(dates)); ui.open()
      assert.deepEqual(ui.inputs().map(input => input.props.value), [dates.startsOn ?? '', dates.endsOn ?? ''])
      assert.deepEqual(ui.inputs().map(input => input.props.type), ['date', 'date'])
      assert.deepEqual(elements(ui.render(), el => el.type === 'label').map(label => label.props.htmlFor), ui.inputs().map(input => input.props.id))
      assert.deepEqual(ui.calls, [])
    }
  })
  test('ungültige Submits rufen nichts auf; Speichern sendet exakt ID/Check-in/Check-out und schliesst', async () => {
    const ui = editor(); ui.open()
    for (const dates of ungueltig) {
      ui.fill(dates); await ui.submit()
      assert.equal(elements(ui.render(), el => el.props.role === 'alert').length, 1)
      assert.deepEqual(ui.calls, [])
    }
    ui.fill(zeitraum)
    assert.deepEqual(ui.calls, [], 'kein Autosave')
    await ui.submit()
    assert.deepEqual(ui.calls, [[ITEM, zeitraum.startsOn, zeitraum.endsOn]])
    assert.equal(ui.inputs().length, 0)
    assert.equal(elements(ui.render(), el => el.props.role === 'status').length, 1)
  })
  test('Fehler behält Eingaben, thrown error bleibt begrenzt; Abbrechen schreibt nicht', async () => {
    for (const outcome of ['Speichern fehlgeschlagen.', new Error('internal detail')]) {
      const ui = editor(stay(), outcome); ui.open(); ui.fill(zeitraum); await ui.submit()
      assert.deepEqual(ui.inputs().map(input => input.props.value), Object.values(zeitraum))
      const alert = elements(ui.render(), el => el.props.role === 'alert')[0]!
      assert.doesNotMatch(String(alert.props.children), /internal detail/)
      ui.buttons().at(-1)!.props.onClick!()
      assert.equal(ui.inputs().length, 0)
      assert.equal(ui.calls.length, 1)
    }
  })
})

test('Arbeitsbereiche verdrahten den engen Callback mit Server-Refresh bzw. gespeichertem Gastgraph', async () => {
  type WorkspaceElement = React.ReactElement<{ onUnterkunftZeitraum: (id: string, start: string, end: string) => Promise<string | null> }>
  const reise = beispielreise({ id: TRIP })
  const args: unknown[] = []
  let refreshes = 0
  let accountError = false
  const account = laden<{ default: (props: { reise: typeof reise; ohneTag: TripItem[] }) => WorkspaceElement }>('components/trips/KontoArbeitsbereich.tsx', {
    react: { ...React, useState: (initial: unknown) => [initial, () => {}] },
    'next/navigation': { useRouter: () => ({ refresh: () => { refreshes++ } }) },
    '@/lib/trips/aktionen': { unterkunftZeitraumSetzen: async (input: unknown) => {
      args.push(input); return accountError ? { ok: false, meldung: 'Abgelehnt' } : { ok: true, wert: null }
    } },
  })
  const callback = account.default({ reise, ohneTag: [] }).props.onUnterkunftZeitraum
  assert.equal(await callback(ITEM, zeitraum.startsOn, zeitraum.endsOn), null)
  assert.deepEqual(args, [eingabe])
  assert.equal(refreshes, 1)
  accountError = true
  assert.equal(await callback(ITEM, zeitraum.startsOn, zeitraum.endsOn), 'Abgelehnt')
  assert.equal(refreshes, 1, 'kein Refresh bei Failure')

  const gespeichert = { ...reise, revision: reise.revision + 1 }
  const states = [reise, true, '']
  const stateWrites: unknown[] = []
  const guestArgs: unknown[] = []
  let guestError = false
  const guest = laden<{ default: (props: { tripId: string }) => WorkspaceElement }>('components/trips/GastArbeitsbereich.tsx', {
    react: { ...React, useEffect: () => {}, useState: () => [states.shift(), (value: unknown) => stateWrites.push(value)] },
    'next/navigation': { useRouter: () => ({}) },
    '@/lib/trips/gastspeicher': { gastUnterkunftZeitraumSetzen: (...input: unknown[]) => {
      guestArgs.push(input)
      if (guestError) throw new Error('Speicherfehler')
      return gespeichert
    } },
  })
  const gastCallback = guest.default({ tripId: TRIP }).props.onUnterkunftZeitraum
  assert.equal(await gastCallback(ITEM, zeitraum.startsOn, zeitraum.endsOn), null)
  assert.deepEqual(guestArgs, [[reise, ITEM, zeitraum.startsOn, zeitraum.endsOn]])
  assert.equal(stateWrites[0], gespeichert, 'genau der persistierte Graph geht in den Workspace')
  guestError = true
  assert.equal(await gastCallback(ITEM, zeitraum.startsOn, zeitraum.endsOn), 'Speicherfehler')
  assert.equal(stateWrites.length, 1)

  const source = readFileSync(resolve(root, 'components/trips/TripWorkspace.tsx'), 'utf8')
  assert.match(source, /<UnterkunftBestand[^>]*onUnterkunftZeitraum=\{onUnterkunftZeitraum\}/)
})
