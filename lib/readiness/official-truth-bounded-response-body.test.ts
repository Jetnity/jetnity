import assert from 'node:assert/strict'
import { describe, test } from 'node:test'

import { officialTruthBoundedResponseBody } from './official-truth-bounded-response-body'

const TRANSPORT_MAX = 131_072

async function* fixture(bytes: number): AsyncGenerator<Uint8Array> {
  yield new TextEncoder().encode('SYNTHETIC NON-AUTHORITATIVE TRANSPORT FIXTURE ')
  let remaining = bytes - 46
  while (remaining > 0) {
    const length = Math.min(16_384, remaining)
    yield new Uint8Array(length).fill(0x78)
    remaining -= length
  }
}

describe('official truth bounded response body transport utility', () => {
  test('transports synthetic bytes through inclusive 128 KiB boundaries without creating a source result', async () => {
    for (const byteLength of [131_071, TRANSPORT_MAX]) {
      const result = await officialTruthBoundedResponseBody(fixture(byteLength), new AbortController().signal, TRANSPORT_MAX)
      assert.equal(result.ok, true)
      if (result.ok) assert.equal(result.bytes.byteLength, byteLength)
    }
  })

  test('refuses overflow and oversized chunks before retaining them', async () => {
    let cancelled = false
    const overBoundary = await officialTruthBoundedResponseBody(fixture(TRANSPORT_MAX + 1),
      new AbortController().signal, TRANSPORT_MAX, () => { cancelled = true })
    assert.deepEqual(overBoundary, { ok: false, reason: 'response_too_large' })
    assert.equal(cancelled, true)

    let firstChunkCancelled = false
    const oversizedChunk = (async function* () {
      yield new Uint8Array(TRANSPORT_MAX + 1)
    })()
    const first = await officialTruthBoundedResponseBody(oversizedChunk, new AbortController().signal,
      TRANSPORT_MAX, () => { firstChunkCancelled = true })
    assert.deepEqual(first, { ok: false, reason: 'response_too_large' })
    assert.equal(firstChunkCancelled, true)
  })

  test('refuses invalid limits and honours cancellation', async () => {
    for (const limit of [0, -1, TRANSPORT_MAX + 1, Number.MAX_SAFE_INTEGER + 1]) {
      assert.deepEqual(await officialTruthBoundedResponseBody(fixture(1), new AbortController().signal, limit),
        { ok: false, reason: 'http_failed' })
    }
    const controller = new AbortController()
    controller.abort()
    assert.deepEqual(await officialTruthBoundedResponseBody(fixture(1), controller.signal, TRANSPORT_MAX),
      { ok: false, reason: 'timeout' })
  })
})
