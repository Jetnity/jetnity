import assert from 'node:assert/strict'
import { readFileSync } from 'node:fs'
import { runInNewContext } from 'node:vm'
import test from 'node:test'

const source = readFileSync(new URL('../../public/maps/trip-map.js', import.meta.url), 'utf8')
const origin = 'https://maps-pilot.example.vercel.app'
type Listener = (event?: unknown) => void
class Element {
  textContent = ''; hidden = false; className = ''; type = ''; src = ''; async = false
  dataset: Record<string, string> = {}; children: Element[] = []; listeners: Record<string, Listener> = {}
  addEventListener(name: string, callback: Listener) { this.listeners[name] = callback }
  replaceChildren() { this.children = [] }
  append(child: Element) { this.children.push(child) }
  querySelector() { return this.children[0] }
  focus() {}
}
function runtime(configured = true) {
  const nodes = new Map<string, Element>()
  for (const id of ['map-config', 'status', 'map', 'cluster', 'cluster-stops', 'cluster-close']) nodes.set(id, new Element())
  nodes.get('map-config')!.textContent = JSON.stringify(configured ? {
    origin, key: 'test-key-never-sent-to-google', mapId: '12345678abcdef00', expiresAt: Date.now() + 1800000,
  } : null)
  const messages: Record<string, unknown>[] = []
  const parent = { postMessage: (message: Record<string, unknown>) => messages.push(message) }
  const listeners: Record<string, (event: unknown) => void> = {}
  const timers: { callback: () => void; delay: number }[] = []
  const maps: FakeMap[] = []
  const markers: FakeMarker[] = []
  let tiles: (() => void) | undefined
  class FakeMap {
    zoom = 10; listeners: Record<string, () => void> = {}
    constructor(_node: unknown, readonly options: Record<string, unknown>) { maps.push(this) }
    getZoom() { return this.zoom }
    setZoom(zoom: number) { this.zoom = zoom; this.listeners.zoom_changed?.() }
    setCenter() {}; panTo() {}; fitBounds() {}
    addListener(name: string, callback: () => void) { this.listeners[name] = callback }
  }
  class FakeMarker {
    map: FakeMap | null; content: Element; title: string; listeners: Record<string, () => void> = {}
    focused = false
    constructor(options: { map: FakeMap; content: Element; title: string }) {
      this.map = options.map; this.content = options.content; this.title = options.title; markers.push(this)
    }
    addListener(name: string, callback: () => void) { this.listeners[name] = callback }
    focus() { this.focused = true }
  }
  const head = new Element()
  const window: Record<string, unknown> = {
    addEventListener: (name: string, callback: (event: unknown) => void) => { listeners[name] = callback },
    google: { maps: { Map: FakeMap, LatLngBounds: class { extend() {} }, marker: { AdvancedMarkerElement: FakeMarker },
      event: { clearInstanceListeners() {}, addListenerOnce: (_map: unknown, _type: string, callback: () => void) => { tiles = callback } } } },
  }
  runInNewContext(source, { window, parent, location: { origin }, URLSearchParams, console,
    document: { head, getElementById: (id: string) => nodes.get(id), createElement: () => new Element() },
    setTimeout: (callback: () => void, delay: number) => { timers.push({ callback, delay }); return timers.length }, clearTimeout() {},
  })
  const send = (data: object, sender: unknown = parent, from = origin) => listeners.message?.({ source: sender, origin: from, data: { source: 'jetnity-trip-map-parent', ...data } })
  const ready = () => { (window.__jetnityTripMapsReady as () => void)(); tiles?.() }
  return { nodes, messages, head, send, ready, maps, markers, timers, window }
}
const stops = [
  { index: 0, label: 'Bangkok', lat: 13.75, lng: 100.5 },
  { index: 1, label: 'Bangkok, zweiter Aufenthalt', lat: 13.75, lng: 100.5 },
  { index: 2, label: 'Phuket', lat: 7.88, lng: 98.39 },
]

test('no SDK before a valid parent message; one load despite duplicate init and selection changes', () => {
  const r = runtime()
  assert.equal(r.head.children.length, 0)
  r.send({ type: 'init', stops }, {}, origin)
  r.send({ type: 'init', stops }, undefined, 'https://evil.test')
  r.send({ type: 'init', stops: [{ ...stops[0], lat: NaN }] })
  assert.equal(r.head.children.length, 0)
  r.send({ type: 'init', stops }); r.send({ type: 'init', stops }); r.ready()
  for (let i = 0; i < 20; i++) r.send({ type: 'select', index: i % 3 })
  assert.equal(r.head.children.length, 1)
  assert.equal(r.maps.length, 1)
  assert.equal(r.maps[0].options.streetViewControl, false)
  assert.equal(new URL(r.head.children[0].src).searchParams.get('libraries'), 'marker')
  assert.equal(r.messages.filter((m) => m.type === 'ready').length, 1)
})

test('coincident stops remain individually selectable; labels are text, never executable markup', () => {
  const r = runtime()
  r.send({ type: 'init', stops: [{ ...stops[0], label: '<img onerror=alert(1)>' }, ...stops.slice(1)] }); r.ready()
  const clustered = r.markers.find((m) => m.map && m.title === '2 Reiseorte anzeigen')!
  assert.ok(clustered)
  clustered.listeners.click()
  const buttons = r.nodes.get('cluster-stops')!.children
  assert.equal(buttons.length, 2)
  assert.equal(buttons[0].textContent, '1. <img onerror=alert(1)>')
  buttons[1].listeners.click()
  assert.equal(r.messages.at(-1)?.index, 1)
  assert.equal(r.maps.length, 1)
  assert.equal(clustered.map, null)
  assert.ok(r.markers.some((m) => m.map && m.focused))
})

test('disabled configuration, authentication failure and expiry fail closed without a retry', () => {
  const blocked = runtime(false)
  assert.deepEqual(blocked.messages.map((m) => m.type), ['blocked'])
  assert.equal(blocked.head.children.length, 0)
  const failed = runtime()
  failed.send({ type: 'init', stops })
  ;(failed.window.gm_authFailure as () => void)()
  failed.ready()
  assert.equal(failed.maps.length, 0)
  assert.equal(failed.messages.at(-1)?.type, 'error')
  const expired = runtime()
  expired.timers.find((t) => t.delay > 25000)!.callback()
  expired.send({ type: 'init', stops })
  assert.equal(expired.head.children.length, 0)
  assert.equal(expired.messages.at(-1)?.type, 'expired')
})
