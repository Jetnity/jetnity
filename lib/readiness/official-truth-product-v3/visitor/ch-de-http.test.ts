import assert from 'node:assert/strict'
import { test } from 'node:test'
import { CH_DE_VISA_HTTP_PATH, CH_DE_VISA_INPUT, loadChDeVisa, readChDeVisaInput, readChDeVisaView } from './ch-de-http'

const generatedAt = '2026-11-12T21:00:00.000Z'
const official = 'https://www.auswaertiges-amt.de/de/service/visa-und-aufenthalt/staatenliste-zur-visumpflicht-207820'
const unavailableView = () => ({ input: CH_DE_VISA_INPUT, generatedAt, synthetic: false,
  cells: [{ country: 'CH', label: 'Schweiz', results: [{ status: 'unavailable', title: 'Derzeit nicht verfügbar', message: 'Keine aktuelle Auskunft.' }] }] })
// Display DTO shape only; no accepted record, approval, profile or source receipt.
const displayShape = () => ({ status: 'accepted', title: 'Testbeschriftung', conditions: ['Bedingung aus dem DTO'],
  statements: [{ text: 'Testtext des Decoders', when: null, href: null }], source: { label: 'Testbeschriftung', href: official },
  checkedAtText: 'Testzeit', validityText: 'Testanzeige', ruleVersion: 1, expiresAt: '2026-11-12T21:01:00.000Z' })
const withResult = (result: unknown) => ({ ...unavailableView(), cells: [{ country: 'CH', label: 'Schweiz', results: [result] }] })

test('public CH-to-DE input has exactly one country pair and no caller authority or document fields', () => {
  assert.deepEqual(readChDeVisaInput(CH_DE_VISA_INPUT), CH_DE_VISA_INPUT)
  for (const input of [null, {}, { ...CH_DE_VISA_INPUT, destinationCountryCode: 'GB' },
    { ...CH_DE_VISA_INPUT, citizenshipCountryCodes: ['US'] }, { ...CH_DE_VISA_INPUT, citizenshipCountryCodes: ['CH', 'US'] },
    { ...CH_DE_VISA_INPUT, citizenshipCountryCodes: ['CH', 'CH'] }, { ...CH_DE_VISA_INPUT, documentType: 'national_id' },
    { ...CH_DE_VISA_INPUT, route: 'transit' }, { ...CH_DE_VISA_INPUT, source: official },
    { ...CH_DE_VISA_INPUT, methodApproved: true }]) assert.equal(readChDeVisaInput(input), null)
})

test('public decoder retains the full display DTO and all existing negative states', () => {
  assert.deepEqual(readChDeVisaView(withResult(displayShape())), withResult(displayShape()))
  for (const status of ['pending', 'conflict', 'unavailable', 'error']) {
    const value = withResult({ status, title: 'Testzustand', message: 'Testmeldung' })
    assert.deepEqual(readChDeVisaView(value), value)
  }
})

test('public decoder rejects foreign cells, synthetic data, extra fields, missing conditions and unsafe links', () => {
  const good = displayShape()
  for (const value of [
    { ...unavailableView(), synthetic: true }, { ...unavailableView(), internal: { receipt: {} } },
    { ...unavailableView(), input: { ...CH_DE_VISA_INPUT, destinationCountryCode: 'GB' } },
    { ...unavailableView(), cells: [{ country: 'US', label: 'USA', results: [good] }] },
    { ...unavailableView(), cells: [{ country: 'CH', label: 'Schweiz', results: [good, good] }] },
    withResult({ ...good, conditions: [] }), withResult({ ...good, expiresAt: generatedAt }),
    withResult({ ...good, expiresAt: 'not-a-time' }), withResult({ ...good, methodApproved: true }),
    withResult({ ...good, source: { label: 'Fremd', href: 'https://unselected.example/' } }),
    withResult({ ...good, statements: [{ text: 'Test', when: null, href: 'javascript:alert(1)' }] }),
  ]) assert.equal(readChDeVisaView(value), null)
})

test('public loader sends the fixed request without credentials and validates the returned body', async t => {
  const signal = new AbortController().signal
  const fetch = t.mock.method(globalThis, 'fetch', async (url: string | URL | Request, init?: RequestInit) => {
    assert.equal(url, CH_DE_VISA_HTTP_PATH); assert.equal(init?.method, 'POST')
    assert.equal(init?.signal, signal); assert.equal(init?.credentials, 'omit')
    assert.equal(init?.cache, 'no-store'); assert.equal(init?.redirect, 'error')
    assert.equal(init?.body, JSON.stringify(CH_DE_VISA_INPUT))
    return Response.json(unavailableView())
  })
  const result = await loadChDeVisa(CH_DE_VISA_INPUT, signal)
  assert.deepEqual(result, { daten: unavailableView(), fehler: null })
  assert.equal(fetch.mock.callCount(), 1)
})

test('public loader refuses unsupported input and prior abort before fetching', async t => {
  const fetch = t.mock.method(globalThis, 'fetch', async () => { assert.fail('no request permitted') })
  const controller = new AbortController(); controller.abort()
  assert.equal((await loadChDeVisa(CH_DE_VISA_INPUT, controller.signal)).daten, null)
  assert.equal((await loadChDeVisa({ destinationCountryCode: 'GB', citizenshipCountryCodes: ['CH'] }, new AbortController().signal)).daten, null)
  assert.equal(fetch.mock.callCount(), 0)
})

test('public loader joins cancellation of an oversized response and never renders it', async t => {
  let cancelled = false
  const body = new ReadableStream<Uint8Array>({
    start(controller) { controller.enqueue(new Uint8Array(65_537)) },
    async cancel() { await Promise.resolve(); cancelled = true },
  })
  t.mock.method(globalThis, 'fetch', async () => new Response(body, { headers: { 'content-type': 'application/json' } }))
  assert.equal((await loadChDeVisa(CH_DE_VISA_INPUT, new AbortController().signal)).daten, null)
  assert.equal(cancelled, true)
})

test('public loader keeps HTTP errors and malformed or synthetic replies unavailable', async t => {
  let next = new Response('unavailable', { status: 503 })
  t.mock.method(globalThis, 'fetch', async () => next)
  for (const response of [next, new Response('{broken', { headers: { 'content-type': 'application/json' } }),
    Response.json({ ...unavailableView(), synthetic: true }), new Response('html', { headers: { 'content-type': 'text/html' } })]) {
    next = response
    const result = await loadChDeVisa(CH_DE_VISA_INPUT, new AbortController().signal)
    assert.equal(result.daten, null); assert.ok(result.fehler)
  }
})
