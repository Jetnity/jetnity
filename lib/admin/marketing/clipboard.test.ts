import assert from 'node:assert/strict'
import { test } from 'node:test'
import { marketingKopiertransportFuer } from './clipboard'

function deferred() {
  let resolve!: () => void
  let reject!: (reason: Error) => void
  const promise = new Promise<void>((yes, no) => { resolve = yes; reject = no })
  return { promise, resolve, reject }
}

test('copy starts synchronously in the gesture and blocks duplicates until actual fulfillment', async () => {
  const transport = marketingKopiertransportFuer({})
  const pending = deferred()
  let calls = 0
  const start = transport.starten(() => { calls++; return pending.promise })
  assert.equal(calls, 1)
  assert.equal(transport.istBeschaeftigt(), true)
  assert.equal(start.status, 'gestartet')
  assert.deepEqual(transport.starten(() => { calls++; return Promise.resolve() }), { status: 'beschaeftigt' })
  assert.equal(calls, 1)
  pending.resolve()
  assert.equal(start.status === 'gestartet' && await start.ergebnis, 'kopiert')
  assert.equal(transport.istBeschaeftigt(), false)
  assert.equal(calls, 1, 'settlement never retries automatically')
})

for (const outcome of ['resolve', 'reject'] as const) test(`unsubscribing/remounting keeps the same document locked until ${outcome}`, async () => {
  const document = {}
  const first = marketingKopiertransportFuer(document)
  const pending = deferred()
  let calls = 0
  const notifications: boolean[] = []
  const unsubscribe = first.beobachten(() => notifications.push(first.istBeschaeftigt()))
  const start = first.starten(() => { calls++; return pending.promise })
  unsubscribe()
  const remounted = marketingKopiertransportFuer(document)
  assert.equal(remounted, first)
  assert.equal(remounted.istBeschaeftigt(), true)
  assert.deepEqual(remounted.starten(() => { calls++; return Promise.resolve() }), { status: 'beschaeftigt' })
  if (outcome === 'resolve') pending.resolve()
  else pending.reject(new Error('denied'))
  assert.equal(start.status === 'gestartet' && await start.ergebnis, outcome === 'resolve' ? 'kopiert' : 'fehlgeschlagen')
  assert.equal(remounted.istBeschaeftigt(), false)
  assert.deepEqual(notifications, [true], 'disposed listener is not called after settlement')
  assert.equal(calls, 1)
  const next = remounted.starten(() => { calls++; return Promise.resolve() })
  assert.equal(next.status === 'gestartet' && await next.ergebnis, 'kopiert')
  assert.equal(calls, 2)
})

test('different documents have independent transports without a URL or campaign registry', async () => {
  const a = marketingKopiertransportFuer({})
  const b = marketingKopiertransportFuer({})
  const pending = deferred()
  const first = a.starten(() => pending.promise)
  const second = b.starten(() => Promise.resolve())
  assert.notEqual(a, b)
  assert.equal(second.status === 'gestartet' && await second.ergebnis, 'kopiert')
  assert.equal(a.istBeschaeftigt(), true)
  pending.resolve()
  assert.equal(first.status === 'gestartet' && await first.ergebnis, 'kopiert')
})

test('synchronous throw and invalid transport response fail honestly and release their settled operation', async () => {
  const transport = marketingKopiertransportFuer({})
  for (const write of [() => { throw new Error('denied') }, (() => undefined) as unknown as () => Promise<void>]) {
    const result = transport.starten(write)
    assert.equal(result.status === 'gestartet' && await result.ergebnis, 'fehlgeschlagen')
    assert.equal(transport.istBeschaeftigt(), false)
  }
})

test('faulty observers cannot release a pending operation or strand a settled lock', async () => {
  const transport = marketingKopiertransportFuer({})
  const pending = deferred()
  const values: boolean[] = []
  transport.beobachten(() => { throw new Error('disposed observer') })
  transport.beobachten(() => values.push(transport.istBeschaeftigt()))
  const result = transport.starten(() => pending.promise)
  assert.equal(transport.istBeschaeftigt(), true)
  pending.reject(new Error('denied'))
  assert.equal(result.status === 'gestartet' && await result.ergebnis, 'fehlgeschlagen')
  assert.deepEqual(values, [true, false])
})
