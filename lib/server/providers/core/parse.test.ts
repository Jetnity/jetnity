import assert from 'node:assert/strict'
import { describe, test } from 'node:test'

import {
  cancelProviderResponseBody,
  parseProviderResponseBody,
  readProviderResponseBodyBounded,
} from '@/lib/server/providers/core'

function headerBag(headers: Record<string, string> = {}) {
  return {
    get(name: string) {
      const found = Object.keys(headers).find((key) => key.toLowerCase() === name.toLowerCase())
      return found ? headers[found]! : null
    },
  }
}

function streamFromChunks(chunks: Uint8Array[], onCancel?: () => void): ReadableStream<Uint8Array> {
  let index = 0
  return new ReadableStream({
    pull(controller) {
      if (index >= chunks.length) {
        controller.close()
        return
      }
      controller.enqueue(chunks[index]!)
      index += 1
    },
    cancel() {
      onCancel?.()
    },
  })
}

function encode(text: string): Uint8Array {
  return new TextEncoder().encode(text)
}

describe('bounded provider response body reads', () => {
  test('missing Content-Length still aborts while reading past the max', async () => {
    let cancelled = false
    const body = streamFromChunks(
      [encode('{"ok":'), encode('"xxxxxxxxxxxxxxxx"}')],
      () => {
        cancelled = true
      },
    )
    const parsed = await parseProviderResponseBody(
      { status: 200, headers: headerBag(), body },
      'json',
      10,
    )
    assert.equal(parsed.ok, false)
    if (!parsed.ok) assert.equal(parsed.kind, 'malformed_response')
    assert.equal(cancelled, true)
  })

  test('a lying small Content-Length is not trusted as the read limit', async () => {
    let cancelled = false
    const actual = `{"pad":"${'x'.repeat(40)}"}`
    const parsed = await parseProviderResponseBody(
      {
        status: 200,
        headers: headerBag({ 'content-length': '5' }),
        body: streamFromChunks([encode(actual)], () => {
          cancelled = true
        }),
      },
      'json',
      16,
    )
    assert.equal(parsed.ok, false)
    if (!parsed.ok) assert.equal(parsed.kind, 'malformed_response')
    assert.equal(cancelled, true)
  })

  test('a single oversized chunk cancels the reader before the body is kept', async () => {
    let cancelled = false
    const read = await readProviderResponseBodyBounded(
      streamFromChunks([encode('x'.repeat(32))], () => {
        cancelled = true
      }),
      8,
    )
    assert.equal(read.ok, false)
    if (!read.ok) {
      assert.equal(read.kind, 'malformed_response')
      assert.equal(read.cancelled, true)
    }
    assert.equal(cancelled, true)
  })

  test('announced Content-Length above the max cancels without materializing', async () => {
    let cancelled = false
    let pulled = 0
    const body = new ReadableStream<Uint8Array>({
      pull(controller) {
        pulled += 1
        controller.enqueue(encode('{"ok":true}'))
        controller.close()
      },
      cancel() {
        cancelled = true
      },
    })
    const parsed = await parseProviderResponseBody(
      {
        status: 200,
        headers: headerBag({ 'content-length': '999999' }),
        body,
      },
      'json',
      16,
    )
    assert.equal(parsed.ok, false)
    assert.equal(pulled, 0)
    assert.equal(cancelled, true)
  })

  test('cancelProviderResponseBody aborts an unread stream', async () => {
    let cancelled = false
    const body = streamFromChunks([encode('{"ok":true}')], () => {
      cancelled = true
    })
    await cancelProviderResponseBody(body)
    assert.equal(cancelled, true)
  })

  test('missing Content-Length still accepts a body under the max', async () => {
    const parsed = await parseProviderResponseBody(
      {
        status: 200,
        headers: headerBag(),
        body: streamFromChunks([encode('{"ok":true}')]),
      },
      'json',
      64,
    )
    assert.equal(parsed.ok, true)
    if (parsed.ok) assert.deepEqual(parsed.value, { ok: true })
  })

  test('non-JSON bodies stay malformed after a bounded read', async () => {
    const parsed = await parseProviderResponseBody(
      {
        status: 200,
        headers: headerBag({ 'content-type': 'text/html' }),
        body: streamFromChunks([encode('<html></html>')]),
      },
      'json',
      1_000,
    )
    assert.equal(parsed.ok, false)
  })
})
