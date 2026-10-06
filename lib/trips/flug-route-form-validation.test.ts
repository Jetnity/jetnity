import assert from 'node:assert/strict'
import { readFileSync } from 'node:fs'
import { createRequire } from 'node:module'
import { dirname, resolve } from 'node:path'
import { describe, test } from 'node:test'
import { fileURLToPath } from 'node:url'
import * as React from 'react'
import ts from 'typescript'

import type FlugBestand from '@/components/trips/FlugBestand'
import { beispielreise } from '@/lib/reiseaenderung/fixtures/reise'
import * as schema from '@/lib/trips/schema'
import type { FlugSegmentManuell } from '@/lib/trips/schema'
import type { TripItem } from '@/types/trips'

const root = resolve(dirname(fileURLToPath(import.meta.url)), '../..')
const require = createRequire(import.meta.url)
const ITEM = 'aaaaaaaa-0000-4000-8000-000000000002'
const direkt: FlugSegmentManuell = {
  origin: 'ZRH', destination: 'DOH', departureDate: '2026-11-01', departureTime: '09:15', arrivalDate: '2026-11-01', arrivalTime: '16:40',
}
const vier: FlugSegmentManuell[] = [direkt,
  { ...direkt, origin: 'DOH', destination: 'BKK', departureDate: '2026-11-02', arrivalDate: '2026-11-02' },
  { ...direkt, origin: 'BKK', destination: 'SIN', departureDate: '2026-11-03', arrivalDate: '2026-11-03' },
  { ...direkt, origin: 'SIN', destination: 'NRT', departureDate: '2026-11-04', arrivalDate: '2026-11-04' },
]
const felder = ['origin', 'destination', 'departureDate', 'departureTime', 'arrivalDate', 'arrivalTime'] as const

type Props = {
  children?: React.ReactNode; id?: string; type?: string; value?: string; disabled?: boolean; role?: string; tabIndex?: number
  ref?: { current: unknown }; htmlFor?: string; 'aria-label'?: string; 'aria-invalid'?: boolean; 'aria-describedby'?: string
  onClick?: () => void; onChange?: (event: { target: { value: string } }) => void
  onSubmit?: (event: { preventDefault: () => void }) => Promise<void>
  onKeyDown?: (event: { key: string; preventDefault: () => void; stopPropagation: () => void }) => void
}
type Element = React.ReactElement<Props>
function elements(node: React.ReactNode, match: (el: Element) => boolean): Element[] {
  const found: Element[] = []
  React.Children.forEach(node, child => {
    if (!React.isValidElement<Props>(child)) return
    if (match(child)) found.push(child)
    found.push(...elements(child.props.children, match))
  })
  return found
}

// Same source/event harness pattern as flug-manuell.test.ts. Commit attaches refs before
// running dependency-aware effects; focus is observed through those attached host nodes.
// Real component + real Zod schema; no persistence, browser or screen-reader claim.
function editor(options: {
  outcome?: () => Promise<string | null>
  parse?: typeof schema.flugRouteManuellSchema.safeParse
} = {}) {
  const states: unknown[] = []
  const refs: Array<{ current: unknown }> = []
  const deps: Array<readonly unknown[]> = []
  let stateIndex = 0; let refIndex = 0; let effectIndex = 0
  let pendingEffects: Array<() => void> = []
  let tree: React.ReactNode
  let active: string | undefined
  const focusHistory: string[] = []
  const calls: Array<[string, FlugSegmentManuell[]]> = []
  const react = {
    ...React, useId: () => 'flight-validation',
    useRef: (initial: unknown) => refs[refIndex++] ?? (refs[refIndex - 1] = { current: initial }),
    useState: (initial: unknown) => {
      const slot = stateIndex++
      if (!(slot in states)) states[slot] = initial
      return [states[slot], (value: unknown) => { states[slot] = typeof value === 'function' ? value(states[slot]) : value }]
    },
    useEffect: (effect: () => void, next: readonly unknown[]) => {
      const slot = effectIndex++
      if (!deps[slot] || next.some((value, i) => !Object.is(value, deps[slot]![i]))) pendingEffects.push(effect)
      deps[slot] = next
    },
  }
  const filename = resolve(root, 'components/trips/FlugBestand.tsx')
  const code = ts.transpileModule(readFileSync(filename, 'utf8'), {
    fileName: filename, compilerOptions: { module: ts.ModuleKind.CommonJS, target: ts.ScriptTarget.ES2022, jsx: ts.JsxEmit.ReactJSX },
  }).outputText
  const loaded = { exports: {} }
  new Function('require', 'module', 'exports', code)((name: string) => {
    if (name === 'react') return react
    // Only fallback tests inject an actual form/array-level Zod error that the bounded UI cannot enter.
    if (name === '@/lib/trips/schema' && options.parse) return { ...schema, flugRouteManuellSchema: { safeParse: options.parse } }
    return require(name.startsWith('@/') ? resolve(root, name.slice(2)) : name)
  }, loaded, loaded.exports)
  const component = (loaded.exports as { default: typeof FlugBestand }).default
  const item: TripItem = { ...beispielreise().days[0]!.items[0]!, id: ITEM, kind: 'flight', title: 'Manueller Flug',
    provider: null, externalRef: null, bookingUrl: null, routeItinerary: null }
  const outer = component({ reise: beispielreise({ days: [], ohneTag: [item] }), onFlugRouteManuell: async (...args) => {
    calls.push(args)
    return options.outcome ? options.outcome() : null
  } })
  const child = elements(outer, el => typeof el.type === 'function' && el.type.name === 'ManuelleFlugRoute')[0]!
  states.length = 0; refs.length = 0; deps.length = 0; pendingEffects = []
  const all = () => elements(tree, () => true)
  const inputs = () => all().filter(el => el.type === 'input')
  const key = (el: Element) => el.props.id ?? el.props['aria-label'] ?? String(el.props.children)
  const focus = (el: Element) => { active = key(el); focusHistory.push(active) }
  const host = (el: Element) => ({
    focus: () => focus(el),
    querySelector: (selector: string) => {
      assert.ok(selector === 'input' || selector === 'input[aria-invalid="true"]', selector)
      const found = elements(el.props.children, candidate => candidate.type === 'input'
        && (selector === 'input' || candidate.props['aria-invalid'] === true))[0]
      return found ? { focus: () => focus(found) } : null
    },
  })
  const render = () => {
    stateIndex = 0; refIndex = 0; effectIndex = 0
    tree = (child.type as (props: Props) => React.ReactNode)(child.props)
    for (const ref of refs) if (ref.current && typeof ref.current === 'object') ref.current = null
    for (const el of all()) if (el.props.ref) el.props.ref.current = host(el)
    const effects = pendingEffects; pendingEffects = []
    for (const effect of effects) effect()
  }
  const button = (name: string) => {
    const found = all().find(el => el.type === 'button' && (el.props.children === name || el.props['aria-label'] === name))
    assert.ok(found, name)
    return found
  }
  const click = (name: string) => { const el = button(name); assert.ok(!el.props.disabled); focus(el); el.props.onClick!(); render() }
  const input = (index: number, field: typeof felder[number]) => {
    const found = inputs().find(el => el.props.id === `flight-validation-${index}-${field}`)
    assert.ok(found); return found
  }
  const change = (index: number, field: typeof felder[number], value: string) => {
    const el = input(index, field); focus(el); el.props.onChange!({ target: { value } }); render()
  }
  const fill = (segments: FlugSegmentManuell[]) => {
    while (inputs().length < segments.length * 6) click('Segment hinzufügen')
    segments.forEach((segment, i) => felder.forEach(field => change(i, field, segment[field] ?? '')))
  }
  const submit = async () => {
    const form = all().find(el => el.type === 'form')!
    const save = all().find(el => el.props.type === 'submit')!
    focus(save)
    const result = form.props.onSubmit!({ preventDefault() {} }); render()
    await result; render()
  }
  const escape = () => {
    all().find(el => el.props.onKeyDown)!.props.onKeyDown!({ key: 'Escape', preventDefault() {}, stopPropagation() {} }); render()
  }
  render()
  return { all, inputs, input, button, click, change, fill, submit, escape, calls, focusHistory,
    open: () => click('Flugroute ergänzen'), active: () => active,
    invalid: () => inputs().filter(el => el.props['aria-invalid'] === true).map(el => el.props.id),
    summary: () => all().find(el => el.props.id === 'flight-validation-fehler'),
  }
}

describe('Manual flight validation recovery — actual issue paths, events and committed focus', () => {
  test('one missing IATA among four segments marks/focuses only that input; no write or repair', async () => {
    const ui = editor(); ui.open(); ui.fill([{ ...direkt, origin: '' }, ...vier.slice(1)])
    assert.deepEqual(ui.invalid(), [], 'no premature invalid state')
    const before = ui.inputs().map(el => el.props.value)
    await ui.submit()
    assert.deepEqual(ui.invalid(), ['flight-validation-0-origin'])
    assert.equal(ui.active(), 'flight-validation-0-origin')
    assert.equal(ui.inputs().length, 24)
    assert.deepEqual(ui.inputs().map(el => el.props.value), before)
    assert.deepEqual(ui.calls, [])
    const result = schema.flugRouteManuellSchema.safeParse({ segments: [{ ...direkt, origin: '' }, ...vier.slice(1)] })
    assert.ok(!result.success)
    assert.equal(ui.summary()!.props.children, schema.ersteMeldung(result.error))
  })

  test('correction clears error immediately without focus theft, normalization or autosave', async () => {
    const ui = editor(); ui.open(); ui.fill([{ ...direkt, origin: '' }]); await ui.submit()
    const count = ui.focusHistory.length
    ui.change(0, 'origin', 'zrh')
    assert.deepEqual(ui.invalid(), []); assert.equal(ui.summary(), undefined)
    assert.equal(ui.input(0, 'origin').props['aria-describedby'], undefined)
    assert.equal(ui.input(0, 'origin').props.value, 'zrh')
    assert.equal(ui.active(), 'flight-validation-0-origin'); assert.equal(ui.focusHistory.length, count + 1)
    assert.deepEqual(ui.calls, [])
    await ui.submit()
    assert.deepEqual(ui.calls, [[ITEM, [direkt]]])
    assert.equal(ui.inputs().length, 0)
    assert.ok(ui.all().some(el => el.props.role === 'status'))
  })

  test('first error follows DOM order even when Zod emits an earlier field issue last', async () => {
    const ui = editor(); ui.open(); ui.fill([{ ...direkt, destination: 'ZRH', arrivalDate: '' }])
    const result = schema.flugRouteManuellSchema.safeParse({ segments: [{ ...direkt, destination: 'ZRH', arrivalDate: '' }] })
    assert.ok(!result.success); assert.equal(result.error.issues[0]!.path[2], 'arrivalDate')
    await ui.submit()
    assert.deepEqual(ui.invalid(), ['flight-validation-0-destination', 'flight-validation-0-arrivalDate'])
    assert.equal(ui.active(), 'flight-validation-0-destination')
    ui.change(0, 'destination', 'DOH')
    assert.deepEqual(ui.invalid(), ['flight-validation-0-arrivalDate'])
    assert.equal(ui.active(), 'flight-validation-0-destination', 'typing does not move focus')
    await ui.submit(); assert.equal(ui.active(), 'flight-validation-0-arrivalDate')
    await ui.submit(); assert.equal(ui.active(), 'flight-validation-0-arrivalDate', 'same error focuses again')
    assert.deepEqual(ui.calls, [])
  })

  for (const field of felder) test(`actual ${field} issue has its own accessible message and label`, async () => {
    const ui = editor(); ui.open(); ui.fill([{ ...direkt, [field]: field.endsWith('Time') ? '24:00' : '' }]); await ui.submit()
    const target = ui.input(0, field)
    assert.deepEqual(ui.invalid(), [target.props.id])
    assert.equal(ui.active(), target.props.id)
    const message = ui.all().find(el => el.props.id === target.props['aria-describedby'])
    assert.ok(message); assert.equal(message.props.role, 'alert')
    assert.ok(ui.all().some(el => el.type === 'label' && el.props.htmlFor === target.props.id))
    for (const valid of ui.inputs().filter(el => !el.props['aria-invalid'])) assert.equal(valid.props['aria-describedby'], undefined)
    assert.deepEqual(ui.calls, [])
  })

  test('continuity points only to the schema-addressed origin; upstream correction recomputes it', async () => {
    const ui = editor(); ui.open(); ui.fill([direkt, { ...vier[1]!, origin: 'DXB' }]); await ui.submit()
    assert.deepEqual(ui.invalid(), ['flight-validation-1-origin']); assert.equal(ui.active(), 'flight-validation-1-origin')
    assert.match(String(ui.summary()!.props.children), /vorherigen Segments/)
    assert.equal(ui.input(1, 'origin').props.value, 'DXB'); assert.deepEqual(ui.calls, [])
    ui.change(0, 'destination', 'DXB')
    assert.deepEqual(ui.invalid(), []); assert.equal(ui.input(1, 'origin').props.value, 'DXB')
    assert.equal(ui.active(), 'flight-validation-0-destination'); assert.deepEqual(ui.calls, [])
  })

  test('connection chronology uses only its actual departureDate path', async () => {
    const ui = editor(); ui.open(); ui.fill([direkt, { ...vier[1]!, departureDate: '2026-11-01', departureTime: '16:39' }]); await ui.submit()
    assert.deepEqual(ui.invalid(), ['flight-validation-1-departureDate']); assert.equal(ui.active(), 'flight-validation-1-departureDate')
    ui.change(1, 'departureTime', '16:40')
    assert.deepEqual(ui.invalid(), []); assert.equal(ui.summary(), undefined); assert.deepEqual(ui.calls, [])
  })

  for (const formLevel of ['root', 'array'] as const) test(`${formLevel}-level Zod error focuses/announces summary, never innocent fields`, async () => {
    const result = schema.flugRouteManuellSchema.safeParse(formLevel === 'root' ? { segments: [direkt], extra: true } : { segments: [] })
    assert.ok(!result.success)
    assert.deepEqual(result.error.issues[0]!.path, formLevel === 'root' ? [] : ['segments'])
    const ui = editor({ parse: () => result }); ui.open(); ui.fill([direkt]); await ui.submit()
    assert.deepEqual(ui.invalid(), []); assert.equal(ui.active(), 'flight-validation-fehler')
    assert.equal(ui.summary()!.props.role, 'alert'); assert.equal(ui.summary()!.props.tabIndex, -1)
    assert.equal(ui.summary()!.props.children, schema.ersteMeldung(result.error))
    assert.equal(ui.all().find(el => el.type === 'form')!.props['aria-describedby'], ui.summary()!.props.id)
    await ui.submit(); assert.equal(ui.active(), 'flight-validation-fehler'); assert.deepEqual(ui.calls, [])
  })

  test('add/remove maintains 1–4 bounds, updates shifted errors and never repairs continuity', async () => {
    const ui = editor(); ui.open(); assert.equal(ui.button('Segment 1 entfernen').props.disabled, true)
    ui.fill(vier); assert.equal(ui.button('Segment hinzufügen').props.disabled, true)
    ui.change(3, 'arrivalDate', ''); await ui.submit()
    ui.click('Segment 2 entfernen'); await Promise.resolve()
    assert.equal(ui.inputs().length, 18); assert.equal(ui.active(), 'Segment hinzufügen')
    assert.deepEqual(ui.invalid(), ['flight-validation-1-origin', 'flight-validation-2-arrivalDate'])
    assert.equal(ui.input(1, 'origin').props.value, 'BKK')
    ui.click('Segment hinzufügen'); assert.equal(ui.inputs().length, 24)
    assert.ok(ui.invalid().includes('flight-validation-3-origin'))
    assert.equal(ui.button('Segment hinzufügen').props.disabled, true)
    await ui.submit(); assert.equal(ui.active(), 'flight-validation-1-origin'); assert.deepEqual(ui.calls, [])
  })

  test('valid four-segment submit once; duplicate/escape guard holds during write', async () => {
    let finish!: (value: null) => void
    const ui = editor({ outcome: () => new Promise(resolve => { finish = resolve }) })
    ui.open(); ui.fill(vier)
    const first = ui.submit(); await ui.submit(); ui.escape()
    assert.deepEqual(ui.calls, [[ITEM, vier]]); assert.equal(ui.inputs().length, 24)
    assert.equal(ui.button('Segment hinzufügen').props.disabled, true)
    finish(null); await first
    assert.equal(ui.inputs().length, 0); assert.equal(ui.active(), 'Flugroute ergänzen')
  })

  test('Escape and reopen reset validation, preserve trigger/initial focus and write nothing', async () => {
    const ui = editor(); ui.open(); await ui.submit(); ui.escape()
    assert.equal(ui.inputs().length, 0); assert.equal(ui.active(), 'Flugroute ergänzen')
    ui.open(); assert.equal(ui.active(), 'flight-validation-0-origin')
    assert.deepEqual(ui.invalid(), []); assert.equal(ui.summary(), undefined); assert.deepEqual(ui.calls, [])
  })
})
