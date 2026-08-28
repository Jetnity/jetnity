import { describe, test } from 'node:test'
import assert from 'node:assert/strict'

import { leseOptionalRequestParam, leseRequestParam } from '@/lib/next/request-api'

describe('leseRequestParam', () => {
  test('gibt ein synchrones Objekt unverändert zurück', async () => {
    const wert = { next: '/reisen' }
    assert.equal(await leseRequestParam(wert), wert)
    assert.equal((await leseRequestParam(wert)).next, '/reisen')
  })

  test('löst ein Promise auf, ohne den Inhalt umzudeuten', async () => {
    const wert = await leseRequestParam(Promise.resolve({ next: '/account', q: '' }))
    assert.deepEqual(wert, { next: '/account', q: '' })
  })
})

describe('leseOptionalRequestParam', () => {
  test('lässt undefined undefiniert – kein leeres Objekt als Ersatz', async () => {
    assert.equal(await leseOptionalRequestParam(undefined), undefined)
  })

  test('löst vorhandene Sync- und Promise-Werte auf', async () => {
    assert.deepEqual(await leseOptionalRequestParam({ idee: '' }), { idee: '' })
    assert.deepEqual(await leseOptionalRequestParam(Promise.resolve({ zielId: '' })), {
      zielId: '',
    })
  })
})
