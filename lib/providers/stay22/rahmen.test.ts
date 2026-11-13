import assert from 'node:assert/strict'
import { test } from 'node:test'
import { CMP_CATEGORIES } from '@/lib/privacy/privacybee-cmp/vertrag'
import { STAY22_SANDBOX } from './suche'
import { stay22Rahmen, type Stay22Phase } from './rahmen'

test('Stay22 behält Popup-Rechte und Suchadresse; Widerruf entfernt den Rahmen vollständig', t => {
  t.mock.timers.enable({ apis: ['setTimeout'] })
  class Frame extends EventTarget {
    attributes = new Map<string, string>()
    src = ''; title = ''; className = ''; allow = ''; referrerPolicy = ''
    setAttribute(name: string, value: string) { this.attributes.set(name, value) }
    remove() { current = null }
  }
  let current: Frame | null = null
  const frames: Frame[] = []
  const consents = Object.fromEntries(CMP_CATEGORIES.map(category => [category, true]))
  const storage = new Map<string, string>()
  const win = Object.assign(new EventTarget(), {
    PrivacyBee: { getAllConsents: () => consents, getConsent: (category: string) => consents[category], hasExplicitConsent: () => true },
    sessionStorage: { getItem: (key: string) => storage.get(key) ?? null, setItem: (key: string, value: string) => storage.set(key, value) },
  })
  const doc = Object.assign(new EventTarget(), { createElement: (tag: string) => {
    assert.equal(tag, 'iframe'); const frame = new Frame(); frames.push(frame); return frame
  } })
  const oldWindow = Object.getOwnPropertyDescriptor(globalThis, 'window')
  const oldDocument = Object.getOwnPropertyDescriptor(globalThis, 'document')
  Object.defineProperty(globalThis, 'window', { value: win, configurable: true })
  Object.defineProperty(globalThis, 'document', { value: doc, configurable: true })
  t.after(() => {
    if (oldWindow) Object.defineProperty(globalThis, 'window', oldWindow); else Reflect.deleteProperty(globalThis, 'window')
    if (oldDocument) Object.defineProperty(globalThis, 'document', oldDocument); else Reflect.deleteProperty(globalThis, 'document')
    t.mock.timers.reset()
  })
  const phases: Stay22Phase[] = []
  const host = { replaceChildren: (frame: Frame) => { current = frame } } as unknown as HTMLElement
  const url = 'https://www.stay22.com/embed/gm?aid=jetnity&campaign=jetnity-unterkunft&checkin=2027-03-01&checkout=2027-03-04&currency=CHF'
  const stop = stay22Rahmen(host, url, phase => phases.push(phase))
  const frame = frames[0]!
  assert.equal(current, frame)
  assert.equal(frame.attributes.has('credentialless'), false, 'asynchrone Popup-Weiterleitungen benötigen einen normalen Browserkontext')
  assert.equal(frame.attributes.get('sandbox'), STAY22_SANDBOX)
  assert.equal(frame.referrerPolicy, 'origin')
  assert.equal(frame.src, url, 'keine Such- oder Partnerdaten entfernen')
  assert.match(frame.allow, /payment 'none'/)
  frame.dispatchEvent(new Event('load'))
  assert.deepEqual(phases, ['laedt', 'rahmen'])
  consents.AD_STORAGE = false
  doc.dispatchEvent(new Event('privacybee:consent-changed'))
  assert.equal(current, null)
  assert.equal(phases.at(-1), 'datenschutz')
  stop(); stop()
  const count = phases.length
  frame.dispatchEvent(new Event('load')); frame.dispatchEvent(new Event('error'))
  t.mock.timers.tick(21000)
  assert.equal(phases.length, count)
  stay22Rahmen(host, url, phase => phases.push(phase))
  assert.equal(frames.length, 1, 'Widerruf verhindert erneutes Laden')
  stay22Rahmen(host, 'https://example.com/embed/gm?aid=jetnity', phase => phases.push(phase))
  assert.equal(phases.at(-1), 'fehler')
  assert.equal(frames.length, 1)
})
