// Real inventory components and real coverage helpers.
// The React substitution drives hooks the same way the flight and stay editor
// tests do. It is not a browser, focus, or stylesheet proof. The mounted
// harness is scripts/organisieren-action-recovery-1/harness.mjs.

import assert from 'node:assert/strict'
import { createHash } from 'node:crypto'
import { readFileSync } from 'node:fs'
import { createRequire } from 'node:module'
import { dirname, resolve } from 'node:path'
import { describe, test } from 'node:test'
import { fileURLToPath } from 'node:url'
import * as React from 'react'
import { renderToStaticMarkup } from 'react-dom/server'
import ts from 'typescript'

import { unbestaetigteBuchung, gebuchteBuchung } from '@/lib/trips/buchung'
import { rentalCarManuellSchema } from '@/lib/rental-cars/schema'
import {
  BUCHUNG_ABGELEHNT,
  BUCHUNG_WIRD_GESPEICHERT,
  createBookingMemory,
  dropBookingOwnership,
  finishBooking,
} from '@/components/trips/useBookingActionLifecycle'
import type { Trip, TripItem } from '@/types/trips'

const root = resolve(dirname(fileURLToPath(import.meta.url)), '../..')
const require = createRequire(import.meta.url)
const JETZT = '2026-10-24T00:00:00.000Z'
const VERBINDUNG_HASH = '10fe6c8f0ec2bb976a53678ac3df9b100bcafe55baa97a72f4081a22bb368360'
const MIETWAGEN_GESPEICHERT = 'Der Mietwagen ist als Nutzerangabe gespeichert – nicht als Providerbestätigung.'
const MIETWAGEN_ABGELEHNT = 'Der Mietwagen konnte nicht gespeichert werden. Deine Eingabe bleibt erhalten.'

function punkt(teil: Partial<TripItem> & Pick<TripItem, 'id' | 'kind' | 'title'>): TripItem {
  return {
    dayId: null,
    stageId: null,
    note: null,
    position: 1,
    startsOn: null,
    startsAt: null,
    endsOn: null,
    endsAt: null,
    priceAmount: null,
    priceCurrency: null,
    provider: null,
    externalRef: null,
    bookingUrl: null,
    ...unbestaetigteBuchung(),
    mobilityMode: null,
    originPlaceId: null,
    destinationPlaceId: null,
    originName: null,
    destinationName: null,
    connectionRef: null,
    mobilityChanges: null,
    mobilityEvidence: null,
    rentalSupplier: null,
    vehicleClass: null,
    transmission: null,
    rentalEvidence: null,
    routeItinerary: null,
    ...teil,
  }
}

function reise(teil: Partial<Trip> = {}): Trip {
  return {
    id: 'trip-recovery',
    clientRef: 'trip-recovery',
    title: 'Synthetische Reise',
    origin: '',
    originPlaceId: null,
    startDate: '2026-11-02',
    endDate: '2026-11-06',
    travellers: 1,
    currency: 'CHF',
    budgetAmount: null,
    status: 'draft',
    pace: 'balanced',
    interests: [],
    travelWish: null,
    revision: 1,
    lastMutationId: null,
    stages: [],
    days: [],
    ohneTag: [],
    createdAt: JETZT,
    updatedAt: JETZT,
    ...teil,
  }
}

type Props = {
  children?: React.ReactNode
  type?: string
  value?: string
  disabled?: boolean
  role?: string
    'aria-disabled'?: boolean
    onClick?: (event?: { currentTarget?: HTMLButtonElement | null }) => void
  onChange?: (event: { target: { value: string } }) => void
  onSubmit?: (event: { preventDefault: () => void }) => Promise<void> | void
}

function elements(node: React.ReactNode, match: (el: React.ReactElement<Props>) => boolean): React.ReactElement<Props>[] {
  const found: React.ReactElement<Props>[] = []
  React.Children.forEach(node, (child) => {
    if (!React.isValidElement<Props>(child)) return
    if (match(child)) found.push(child)
    found.push(...elements(child.props.children, match))
  })
  return found
}

function textOf(node: React.ReactNode): string {
  if (node == null || typeof node === 'boolean') return ''
  if (typeof node === 'string' || typeof node === 'number') return String(node)
  if (Array.isArray(node)) return node.map(textOf).join('')
  if (React.isValidElement<{ children?: React.ReactNode }>(node)) return textOf(node.props.children)
  return ''
}

function laden<T>(path: string, react: object): T {
  const filename = resolve(root, path)
  const code = ts.transpileModule(readFileSync(filename, 'utf8'), {
    fileName: filename,
    compilerOptions: { module: ts.ModuleKind.CommonJS, target: ts.ScriptTarget.ES2022, jsx: ts.JsxEmit.ReactJSX },
  }).outputText
  const loaded = { exports: {} as T }
  new Function('require', 'module', 'exports', code)((name: string) => {
    if (name === 'react') return react
    return require(name.startsWith('@/') ? resolve(root, name.slice(2)) : name)
  }, loaded, loaded.exports)
  return loaded.exports
}

function scheduler() {
  const states: unknown[] = []
  const refs: Array<{ current: unknown }> = []
  let stateIndex = 0
  let refIndex = 0
  const react = {
    ...React,
    useId: () => 'recovery',
    useEffect() {},
    useLayoutEffect() {},
    useRef(initial: unknown) {
      const slot = refIndex++
      if (!refs[slot]) refs[slot] = { current: initial }
      return refs[slot]
    },
    useState(initial: unknown) {
      const slot = stateIndex++
      if (!(slot in states)) states[slot] = typeof initial === 'function' ? (initial as () => unknown)() : initial
      return [states[slot], (value: unknown) => {
        states[slot] = typeof value === 'function' ? (value as (current: unknown) => unknown)(states[slot]) : value
      }]
    },
  }
  const renderWith = (draw: () => React.ReactNode) => {
    stateIndex = 0
    refIndex = 0
    return draw()
  }
  return { react, renderWith }
}

type Outcome = 'hold' | 'ok' | 'error' | 'reject' | 'throw'

function callbackProbe() {
  const calls: Array<[string, boolean]> = []
  let outcome: Outcome = 'hold'
  let release: (value: string | null) => void = () => {}
  let reject: (error: Error) => void = () => {}
  const onBuchungsstatus = (itemId: string, gebucht: boolean) => {
    calls.push([itemId, gebucht])
    if (outcome === 'throw') throw new Error('secret boom')
    return new Promise<string | null>((resolve, rejectPromise) => {
      release = resolve
      reject = rejectPromise
      if (outcome === 'ok') resolve(null)
      if (outcome === 'error') resolve('Speichern abgelehnt.')
      if (outcome === 'reject') rejectPromise(new Error('secret boom'))
    })
  }
  return {
    calls,
    onBuchungsstatus,
    arm(next: Outcome) { outcome = next },
    settle() { release(outcome === 'error' ? 'Speichern abgelehnt.' : null) },
    fail() { reject(new Error('secret boom')) },
  }
}

async function tick() {
  await new Promise((resolve) => setTimeout(resolve, 0))
}

function bookingButtons(tree: React.ReactNode) {
  return elements(tree, (el) => el.type === 'button' && (
    el.props.children === 'Als gebucht markieren'
    || el.props.children === 'Buchung korrigieren'
    || el.props.children === 'Wird gespeichert …'
  ))
}

function buttonFor(tree: React.ReactNode, title: string) {
  const row = elements(tree, (el) => el.type === 'li').find((li) => textOf(li).includes(title))
  assert.ok(row, title)
  const button = bookingButtons(row)[0]
  assert.ok(button, title)
  return button
}

function statusText(tree: React.ReactNode) {
  return elements(tree, (el) => el.props.role === 'status').map((el) => textOf(el))
}

function alertText(tree: React.ReactNode) {
  return elements(tree, (el) => el.props.role === 'alert').map((el) => textOf(el))
}

describe('booking action ownership', () => {
  test('a late completion does not publish after ownership is dropped', () => {
    const memory = createBookingMemory()
    memory.pendingId = 'item-a'
    memory.generation = 4
    dropBookingOwnership(memory)
    assert.equal(finishBooking(memory, 4, 'item-a'), false)
    assert.equal(memory.pendingId, null)
    assert.equal(BUCHUNG_ABGELEHNT.includes('secret'), false)
    assert.equal(BUCHUNG_WIRD_GESPEICHERT, 'Buchungsstatus wird gespeichert.')
  })
})

describe('mounted inventory booking actions through the real components', () => {
  const flug = scheduler()
  const Flug = laden<{ default: (props: { reise: Trip; onBuchungsstatus: typeof probe.onBuchungsstatus }) => React.ReactNode }>(
    'components/trips/FlugBestand.tsx', flug.react,
  ).default
  const stay = scheduler()
  const Stay = laden<{ default: (props: { reise: Trip; onBuchungsstatus: typeof probe.onBuchungsstatus }) => React.ReactNode }>(
    'components/trips/UnterkunftBestand.tsx', stay.react,
  ).default
  const link = scheduler()
  const Link = laden<{ default: (props: { reise: Trip; onBuchungsstatus: typeof probe.onBuchungsstatus }) => React.ReactNode }>(
    'components/trips/MobilitaetBereich.tsx', link.react,
  ).default
  const car = scheduler()
  const Car = laden<{ default: (props: { reise: Trip; onBuchungsstatus: typeof probe.onBuchungsstatus }) => React.ReactNode }>(
    'components/trips/MietwagenBereich.tsx', car.react,
  ).default
  const probe = callbackProbe()

  function inventory(kind: 'flight' | 'stay' | 'transfer' | 'rental_car') {
    const open = punkt({ id: `${kind}-open`, kind, title: `${kind} offen`, ...(kind === 'transfer' ? { mobilityMode: 'rail' as const } : {}) })
    const booked = punkt({
      id: `${kind}-booked`, kind, title: `${kind} gebucht`, ...gebuchteBuchung(JETZT),
      ...(kind === 'transfer' ? { mobilityMode: 'bus' as const } : {}),
    })
    const trip = reise({ id: `trip-${kind}`, ohneTag: [open, booked] })
    const view = kind === 'flight' ? flug : kind === 'stay' ? stay : kind === 'transfer' ? link : car
    const Component = kind === 'flight' ? Flug : kind === 'stay' ? Stay : kind === 'transfer' ? Link : Car
    const draw = (next: Trip = trip) => view.renderWith(() => Component({ reise: next, onBuchungsstatus: probe.onBuchungsstatus }))
    return { open, booked, trip, draw }
  }

  for (const kind of ['flight', 'stay', 'transfer', 'rental_car'] as const) {
    test(`${kind}: both directions, sibling lock, domain error, reject, throw, retry, late context`, async () => {
      probe.calls.length = 0
      probe.arm('hold')
      const ui = inventory(kind)
      const first = ui.draw()
      assert.equal(buttonFor(first, `${kind} offen`).props.children, 'Als gebucht markieren')
      assert.equal(buttonFor(first, `${kind} gebucht`).props.children, 'Buchung korrigieren')
      assert.equal(buttonFor(first, `${kind} offen`).props.disabled, false)
      buttonFor(first, `${kind} offen`).props.onClick?.()
      buttonFor(first, `${kind} gebucht`).props.onClick?.()
      assert.deepEqual(probe.calls, [[`${kind}-open`, true]])
      const pending = ui.draw()
      assert.equal(buttonFor(pending, `${kind} offen`).props.children, 'Wird gespeichert …')
      assert.equal(buttonFor(pending, `${kind} offen`).props.disabled, false)
      assert.equal(buttonFor(pending, `${kind} offen`).props['aria-disabled'], true)
      assert.equal(buttonFor(pending, `${kind} gebucht`).props.disabled, true)
      assert.equal(buttonFor(pending, `${kind} gebucht`).props['aria-disabled'], true)
      assert.equal(buttonFor(pending, `${kind} gebucht`).props.children, 'Buchung korrigieren')
      assert.ok(statusText(pending).includes(BUCHUNG_WIRD_GESPEICHERT))
      probe.settle()
      await tick()
      const success = ui.draw()
      assert.equal(buttonFor(success, `${kind} offen`).props.children, 'Als gebucht markieren')
      assert.equal(buttonFor(success, `${kind} offen`).props.disabled, false)
      assert.deepEqual(alertText(success), [])

      probe.arm('error')
      buttonFor(success, `${kind} gebucht`).props.onClick?.()
      await tick()
      const domain = ui.draw()
      assert.deepEqual(probe.calls.at(-1), [`${kind}-booked`, false])
      assert.deepEqual(alertText(domain), ['Speichern abgelehnt.'])
      assert.equal(buttonFor(domain, `${kind} gebucht`).props.disabled, false)

      probe.arm('reject')
      buttonFor(domain, `${kind} offen`).props.onClick?.()
      await tick()
      const rejected = ui.draw()
      assert.deepEqual(alertText(rejected), [BUCHUNG_ABGELEHNT])
      assert.equal(alertText(rejected).join('').includes('secret'), false)

      probe.arm('throw')
      buttonFor(rejected, `${kind} offen`).props.onClick?.()
      await tick()
      const thrown = ui.draw()
      assert.deepEqual(alertText(thrown), [BUCHUNG_ABGELEHNT])
      const beforeRetry = probe.calls.length
      probe.arm('ok')
      buttonFor(thrown, `${kind} offen`).props.onClick?.()
      await tick()
      assert.equal(probe.calls.length, beforeRetry + 1)
      assert.equal(buttonFor(ui.draw(), `${kind} offen`).props.disabled, false)

      probe.arm('hold')
      buttonFor(ui.draw(), `${kind} offen`).props.onClick?.()
      const callsAtHold = probe.calls.length
      const gone = ui.draw(reise({ id: `trip-${kind}`, ohneTag: [ui.booked] }))
      const cleared = ui.draw(reise({ id: `trip-${kind}`, ohneTag: [ui.booked] }))
      assert.equal(bookingButtons(cleared).every((button) => button.props.disabled === false), true, textOf(gone))
      probe.settle()
      await tick()
      assert.equal(probe.calls.length, callsAtHold)
      assert.deepEqual(alertText(ui.draw(reise({ id: `trip-${kind}`, ohneTag: [ui.booked] }))), [])
      probe.arm('ok')
      buttonFor(ui.draw(reise({ id: `trip-${kind}`, ohneTag: [ui.booked] })), `${kind} gebucht`).props.onClick?.()
      await tick()
      assert.deepEqual(probe.calls.at(-1), [`${kind}-booked`, false])

      probe.arm('hold')
      const fresh = ui.draw(reise({ id: `trip-${kind}-next`, ohneTag: [ui.open, ui.booked] }))
      buttonFor(fresh, `${kind} offen`).props.onClick?.()
      ui.draw(reise({ id: `trip-${kind}-later`, ohneTag: [ui.open, ui.booked] }))
      ui.draw(reise({ id: `trip-${kind}-later`, ohneTag: [ui.open, ui.booked] }))
      const held = probe.calls.length
      probe.settle()
      await tick()
      const later = ui.draw(reise({ id: `trip-${kind}-later`, ohneTag: [ui.open, ui.booked] }))
      assert.equal(probe.calls.length, held)
      assert.deepEqual(alertText(later), [])
      assert.equal(buttonFor(later, `${kind} offen`).props.disabled, false)
    })
  }

  test('static markup keeps stored booking truth and does not invent a provider confirmation', () => {
    const trip = reise({ ohneTag: [
      punkt({ id: 'stay-open', kind: 'stay', title: 'Offenes Hotel', startsOn: '2026-11-02', endsOn: '2026-11-04' }),
      punkt({ id: 'stay-booked', kind: 'stay', title: 'Gebuchtes Hotel', ...gebuchteBuchung(JETZT) }),
    ] })
    const html = renderToStaticMarkup(React.createElement(Stay, { reise: trip, onBuchungsstatus: async () => null }))
    assert.match(html, /Als gebucht markieren/)
    assert.match(html, /Buchung korrigieren/)
    assert.match(html, /Ausgewählt/)
    assert.match(html, /Gebucht/)
    assert.doesNotMatch(html, /Providerbestätigung|Anbieter bestätigt/)
    assert.match(html, /aria-busy="false"/)
  })
})

describe('manual rental entry keeps the submitted draft', () => {
  const view = scheduler()
  const loaded = laden<{ default: (props: {
    reise: Trip
    onManuellAnlegen: (eingabe: unknown) => Promise<string | null>
  }) => React.ReactNode }>('components/trips/MietwagenBereich.tsx', view.react)
  const calls: unknown[] = []
  let outcome: Outcome = 'hold'
  let release: (value: string | null) => void = () => {}
  const onManuellAnlegen = (eingabe: unknown) => {
    calls.push(eingabe)
    if (outcome === 'throw') throw new Error('secret boom')
    return new Promise<string | null>((resolve, reject) => {
      release = resolve
      if (outcome === 'ok') resolve(null)
      if (outcome === 'error') resolve('Mietwagen abgelehnt.')
      if (outcome === 'reject') reject(new Error('secret boom'))
    })
  }
  const draw = (trip = reise()) => view.renderWith(() => {
    const outer = loaded.default({ reise: trip, onManuellAnlegen })
    const child = elements(outer, (el) => typeof el.type === 'function' && (el.type as { name?: string }).name === 'ManuellerMietwagen')[0]
    assert.ok(child)
    return (child.type as (props: Props) => React.ReactNode)(child.props as Props)
  })
  const controls = (tree: React.ReactNode) => elements(tree, (el) => el.type === 'input' || el.type === 'select' || el.type === 'textarea')
  const setControl = (tree: React.ReactNode, index: number, value: string) => {
    controls(tree)[index]!.props.onChange?.({ target: { value } })
  }

  test('ten fields stay stable, errors keep values, success resets only the owned form', async () => {
    outcome = 'hold'
    const values = ['Zürich Flughafen', 'Genf', '2026-11-02', '09:15', '2026-11-06', '18:40', 'compact', 'manual', 'Lokal', 'Kinderstuhl']
    let tree = draw()
    assert.equal(controls(tree).length, 10)
    values.forEach((value, index) => setControl(tree, index, value))
    tree = draw()
    const form = elements(tree, (el) => el.type === 'form')[0]!
    const first = form.props.onSubmit?.({ preventDefault() {} })
    form.props.onSubmit?.({ preventDefault() {} })
    assert.equal(calls.length, 1)
    const payload = {
      title: null,
      pickupName: 'Zürich Flughafen',
      dropoffName: 'Genf',
      pickupPlaceId: null,
      dropoffPlaceId: null,
      pickupOn: '2026-11-02',
      pickupAt: '09:15',
      dropoffOn: '2026-11-06',
      dropoffAt: '18:40',
      rentalSupplier: 'Lokal',
      vehicleClass: 'compact',
      transmission: 'manual',
      priceAmount: null,
      priceCurrency: null,
      note: 'Kinderstuhl',
      dayId: null,
      stageId: null,
    }
    assert.deepEqual(calls[0], payload)
    assert.equal(rentalCarManuellSchema.safeParse(payload).success, true)
    tree = draw()
    assert.equal(controls(tree).every((control) => control.props.disabled === true), true)
    assert.deepEqual(controls(tree).map((control) => control.props.value), values)
    outcome = 'error'
    release('Mietwagen abgelehnt.')
    await first
    await tick()
    tree = draw()
    assert.deepEqual(alertText(tree), ['Mietwagen abgelehnt.'])
    assert.deepEqual(controls(tree).map((control) => control.props.value), values)
    assert.equal(controls(tree).every((control) => control.props.disabled === false), true)

    outcome = 'reject'
    const rejected = elements(draw(), (el) => el.type === 'form')[0]!.props.onSubmit?.({ preventDefault() {} })
    await rejected
    await tick()
    tree = draw()
    assert.deepEqual(alertText(tree), [MIETWAGEN_ABGELEHNT])
    assert.equal(alertText(tree).join('').includes('secret'), false)
    assert.deepEqual(controls(tree).map((control) => control.props.value), values)

    outcome = 'throw'
    const thrown = elements(draw(), (el) => el.type === 'form')[0]!.props.onSubmit?.({ preventDefault() {} })
    await thrown
    await tick()
    assert.deepEqual(controls(draw()).map((control) => control.props.value), values)

    outcome = 'ok'
    const before = calls.length
    const saved = elements(draw(), (el) => el.type === 'form')[0]!.props.onSubmit?.({ preventDefault() {} })
    await saved
    await tick()
    assert.equal(calls.length, before + 1)
    tree = draw()
    assert.deepEqual(controls(tree).map((control) => control.props.value), ['', '', '', '', '', '', '', '', '', ''])
    assert.ok(statusText(tree).includes(MIETWAGEN_GESPEICHERT))

    outcome = 'hold'
    values.forEach((value, index) => setControl(draw(), index, value))
    const stale = elements(draw(), (el) => el.type === 'form')[0]!.props.onSubmit?.({ preventDefault() {} })
    draw(reise({ id: 'trip-other' }))
    draw(reise({ id: 'trip-other' }))
    const kept = calls.length
    release(null)
    await stale
    await tick()
    tree = draw(reise({ id: 'trip-other' }))
    assert.equal(calls.length, kept)
    assert.deepEqual(controls(tree).map((control) => control.props.value), values)
    assert.equal(controls(tree).every((control) => control.props.disabled === false), true)
  })

  test('empty optional fields and an impossible date stay explicit nulls or the typed value', async () => {
    calls.length = 0
    outcome = 'ok'
    const trip = reise({ id: 'trip-empty', origin: 'Zürich', stages: [{ id: 'stage-1', position: 1, name: 'Bern', countryCode: 'CH', arrivalDate: '2026-11-02', departureDate: '2026-11-06', latitude: null, longitude: null, placeId: 'place-bern' }] })
    const tree = draw(trip)
    setControl(tree, 0, 'Nur Abholung')
    setControl(tree, 1, 'Nur Rückgabe')
    setControl(tree, 2, '2026-02-31')
    for (const index of [3, 4, 5, 6, 7, 8, 9]) setControl(draw(trip), index, '')
    const submitted = elements(draw(reise({ id: 'trip-empty', origin: 'Zürich', stages: [{ id: 'stage-1', position: 1, name: 'Bern', countryCode: 'CH', arrivalDate: '2026-11-02', departureDate: '2026-11-06', latitude: null, longitude: null, placeId: 'place-bern' }] })), (el) => el.type === 'form')[0]!.props.onSubmit?.({ preventDefault() {} })
    await submitted
    const payload = calls.at(-1) as Record<string, unknown>
    assert.equal(payload.pickupName, 'Nur Abholung')
    assert.equal(payload.dropoffName, 'Nur Rückgabe')
    assert.equal(payload.pickupOn, '2026-02-31')
    assert.equal(payload.pickupPlaceId, null)
    assert.equal(payload.dropoffPlaceId, null)
    assert.equal(payload.priceAmount, null)
    assert.equal(payload.priceCurrency, null)
    assert.equal(payload.vehicleClass, null)
    assert.equal(payload.note, null)
    assert.equal(rentalCarManuellSchema.safeParse(payload).success, false)
  })
})

test('accepted manual connection function stays byte-identical', () => {
  const source = readFileSync(resolve(root, 'components/trips/MobilitaetBereich.tsx'), 'utf8')
  const start = source.indexOf('export function ManuelleVerbindung')
  assert.ok(start > 0)
  assert.equal(createHash('sha256').update(source.slice(start)).digest('hex'), VERBINDUNG_HASH)
})
