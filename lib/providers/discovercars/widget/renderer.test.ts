import assert from 'node:assert/strict'
import { test } from 'node:test'
import { CMP_CATEGORIES } from '@/lib/privacy/privacybee-cmp/vertrag'
import { discoverCarsWidgetFreigegeben, discoverCarsWidgetLaden, type DiscoverCarsWidgetPhase } from './renderer'

test('S4: kein DiscoverCars-Frame vor gesondertem Consent-, Vendor- und Policy-Gate', (t) => {
  const previousWindow = Object.getOwnPropertyDescriptor(globalThis, 'window')
  const previousDocument = Object.getOwnPropertyDescriptor(globalThis, 'document')
  const entries = Object.fromEntries(CMP_CATEGORIES.map(name => [name, true]))
  const api = {
    getAllConsents: () => entries,
    getConsent: (category: string) => entries[category],
    hasExplicitConsent: () => true,
  }
  let created = 0
  const win = { location: { origin: 'https://jetnity.com' }, PrivacyBee: undefined as unknown }
  const doc = { createElement: () => { created++; throw Error('Kein Vendor-iframe ohne reviewed Gate') } }
  Object.defineProperty(globalThis, 'window', { value: win, configurable: true })
  Object.defineProperty(globalThis, 'document', { value: doc, configurable: true })
  t.after(() => {
    if (previousWindow) Object.defineProperty(globalThis, 'window', previousWindow)
    else Reflect.deleteProperty(globalThis, 'window')
    if (previousDocument) Object.defineProperty(globalThis, 'document', previousDocument)
    else Reflect.deleteProperty(globalThis, 'document')
  })
  const status: DiscoverCarsWidgetPhase[] = []
  const host = { replaceChildren: () => { throw Error('Keine Anbieter-Einbettung') } } as unknown as HTMLElement
  assert.equal(discoverCarsWidgetFreigegeben(), false, 'Quelle hat nicht alle drei Freigaben')
  const stop = discoverCarsWidgetLaden(host, p => status.push(p))
  assert.deepEqual(status, ['datenschutz'])
  assert.equal(created, 0)
  stop()
  win.PrivacyBee = api
  discoverCarsWidgetLaden(host, p => status.push(p))
  assert.deepEqual(status, ['datenschutz', 'datenschutz'], 'Auch gefälschte/all-true CMP entsperrt fehlende Provider-Policy nicht')
  assert.equal(created, 0)
  entries.ANALYTICS_STORAGE = false
  discoverCarsWidgetLaden(host, p => status.push(p))
  assert.equal(status.at(-1), 'datenschutz')
  assert.equal(created, 0)
  win.PrivacyBee = undefined
  discoverCarsWidgetLaden(host, p => status.push(p))
  assert.equal(created, 0)
})
