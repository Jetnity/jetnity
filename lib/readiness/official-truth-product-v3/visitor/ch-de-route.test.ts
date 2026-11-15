import assert from 'node:assert/strict'
import { test } from 'node:test'
import { readinessRateLeeren } from '@/lib/readiness/rate-limit'
import type { Hrs1Facade } from '../result/composition'
import { CH_DE_VISA_INPUT, readChDeVisaView } from './ch-de-http'
import { queryOfficialTruthVisitorV3 } from './query'

test('public fixed route rejects other inputs, needs no session and awaits owned settlement', { timeout: 5000 }, async t => {
  let factoryCalls = 0
  let facade: Pick<Hrs1Facade, 'query'> | null = null
  t.mock.module(new URL('../runtime/ch-de-server.ts', import.meta.url), { namedExports: {
    officialTruthV3ChDeRuntime() { factoryCalls++; return facade },
  } })
  const { POST } = await import('../../../../app/api/readiness/ch-de-visa/route')
  readinessRateLeeren()
  const request = (input: unknown = CH_DE_VISA_INPUT, options: RequestInit = {}) => new Request('https://jetnity.com/api/readiness/ch-de-visa', {
    method: 'POST', headers: { 'content-type': 'application/json', 'x-forwarded-for': '192.0.2.1' },
    body: JSON.stringify(input), ...options,
  })
  for (const input of [{ ...CH_DE_VISA_INPUT, destinationCountryCode: 'GB' },
    { ...CH_DE_VISA_INPUT, documentType: 'national_id' }, { ...CH_DE_VISA_INPUT, approved: true }]) {
    assert.equal((await POST(request(input))).status, 400)
  }
  assert.equal((await POST(request(CH_DE_VISA_INPUT, { headers: { 'content-type': 'text/plain' } }))).status, 415)
  assert.equal((await POST(request(CH_DE_VISA_INPUT, { body: 'x'.repeat(1025) }))).status, 413)
  assert.equal(factoryCalls, 0)

  const unbound = await POST(request())
  assert.equal(unbound.status, 200); assert.equal(unbound.headers.get('cache-control'), 'private, no-store')
  const view = readChDeVisaView(await unbound.json())
  assert.ok(view); assert.equal(view.synthetic, false)
  assert.equal(view.cells[0]?.results[0]?.status, 'unavailable')
  assert.equal(factoryCalls, 1)

  let release!: () => void, entered!: () => void
  const gate = new Promise<void>(resolve => { release = resolve })
  const running = new Promise<void>(resolve => { entered = resolve })
  const signals: AbortSignal[] = []
  facade = { async query(input, signal) {
    assert.deepEqual(input, CH_DE_VISA_INPUT); assert.ok(signal); signals.push(signal)
    entered(); await gate
    return queryOfficialTruthVisitorV3(input)
  } }
  const controller = new AbortController()
  let settled = false
  const pending = POST(request(CH_DE_VISA_INPUT, { signal: controller.signal })).then(response => { settled = true; return response })
  try {
    await running
    controller.abort()
    assert.equal(signals[0]?.aborted, true); assert.equal(settled, false)
  } finally { release() }
  assert.equal((await pending).status, 503)
  assert.equal(factoryCalls, 2)
})
