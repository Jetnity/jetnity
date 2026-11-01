import assert from 'node:assert/strict'
import { test } from 'node:test'
import { CMP_CATEGORIES } from '@/lib/privacy/privacybee-cmp/vertrag'
import { discoverCarsWidgetLaden, type DiscoverCarsWidgetPhase } from './renderer'

test('Widget-Lebenszyklus: ein Rahmen, echte Bereitschaft, Timeout, Widerruf und vollständiges Entfernen', (t) => {
  t.mock.timers.enable({ apis: ['setTimeout'] })
  class Events {
    handlers = new Map<string, Set<(event: unknown) => void>>()
    addEventListener(name: string, fn: (event: unknown) => void) { if (!this.handlers.has(name)) this.handlers.set(name, new Set()); this.handlers.get(name)!.add(fn) }
    removeEventListener(name: string, fn: (event: unknown) => void) { this.handlers.get(name)?.delete(fn) }
    emit(name: string, event: unknown) { for (const fn of this.handlers.get(name) ?? []) fn(event) }
    count() { return [...this.handlers.values()].reduce((total, list) => total + list.size, 0) }
  }
  class Frame extends Events {
    attributes: Record<string, string> = {}
    contentWindow = {}
    style = { cssText: '', height: '' }
    src = ''
    title = ''
    allow = ''
    referrerPolicy = ''
    setAttribute(name: string, value: string) { this.attributes[name] = value }
    remove() { if (current === this) current = null }
  }
  let current: Frame | null = null
  const frames: Frame[] = []
  const events = new Events()
  const docEvents = new Events()
  const storage = new Map<string, string>()
  const win = Object.assign(events, { location: { origin: 'https://jetnity.com' }, PrivacyBee: undefined as unknown, sessionStorage: { getItem: (key: string) => storage.get(key) ?? null, setItem: (key: string, value: string) => { storage.set(key, value) } } })
  const doc = Object.assign(docEvents, { createElement: (tag: string) => { assert.equal(tag, 'iframe'); const frame = new Frame(); frames.push(frame); return frame } })
  const oldWindow = Object.getOwnPropertyDescriptor(globalThis, 'window')
  const oldDocument = Object.getOwnPropertyDescriptor(globalThis, 'document')
  Object.defineProperty(globalThis, 'window', { value: win, configurable: true })
  Object.defineProperty(globalThis, 'document', { value: doc, configurable: true })
  t.after(() => {
    if (oldWindow) Object.defineProperty(globalThis, 'window', oldWindow); else Reflect.deleteProperty(globalThis, 'window')
    if (oldDocument) Object.defineProperty(globalThis, 'document', oldDocument); else Reflect.deleteProperty(globalThis, 'document')
    t.mock.timers.reset()
  })
  const host = { replaceChildren: (frame: Frame) => { current = frame } } as unknown as HTMLElement
  const phases: DiscoverCarsWidgetPhase[] = []
  const stop = discoverCarsWidgetLaden(host, phase => phases.push(phase))
  const first = frames[0]!
  assert.equal(current, first)
  assert.equal(first.attributes.credentialless, '')
  assert.equal(first.referrerPolicy, 'origin')
  assert.match(first.src, /^https:\/\/widget\.discovercars\.com\/de\/locations\//)
  assert.deepEqual(phases, ['laedt'])
  const data = JSON.stringify({ discovercars: true, action: 'heightChange', height: 478 })
  events.emit('message', { source: {}, origin: 'https://widget.discovercars.com', data })
  assert.deepEqual(phases, ['laedt'])
  events.emit('message', { source: first.contentWindow, origin: 'https://widget.discovercars.com', data })
  assert.equal(first.style.height, '478px')
  assert.deepEqual(phases, ['laedt', 'sichtbar'])
  t.mock.timers.tick(21000)
  assert.equal(current, first)
  stop(); stop()
  assert.equal(current, null)
  assert.equal(events.count() + docEvents.count() + first.count(), 0)
  events.emit('message', { source: first.contentWindow, origin: 'https://widget.discovercars.com', data })
  assert.deepEqual(phases, ['laedt', 'sichtbar'])

  discoverCarsWidgetLaden(host, phase => phases.push(phase))
  t.mock.timers.tick(20000)
  assert.equal(current, null)
  assert.equal(phases.at(-1), 'fehler')
  assert.equal(events.count() + docEvents.count(), 0)

  discoverCarsWidgetLaden(host, phase => phases.push(phase))
  assert.ok(current)
  const consents = Object.fromEntries(CMP_CATEGORIES.map(category => [category, category !== 'ANALYTICS_STORAGE']))
  win.PrivacyBee = { getAllConsents: () => consents, getConsent: (category: string) => consents[category], hasExplicitConsent: () => true }
  docEvents.emit('privacybee:consent-changed', {})
  assert.equal(current, null)
  assert.equal(phases.at(-1), 'datenschutz')
  assert.equal(events.count() + docEvents.count(), 0)
  win.PrivacyBee = undefined
  const count = frames.length
  discoverCarsWidgetLaden(host, phase => phases.push(phase))
  assert.equal(frames.length, count, 'Verlorene CMP darf keinen neuen Anbieteraufruf starten')
  assert.equal(phases.at(-1), 'datenschutz')
})
