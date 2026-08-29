import assert from 'node:assert/strict'
import { readFileSync } from 'node:fs'
import { describe, test } from 'node:test'

import {
  createProviderTransportExecutor,
  type ProviderHttpClient,
} from '@/lib/server/providers/core'

const FORBIDDEN_RUNTIME_FIELDS = [
  'trusted',
  'live',
  'sourceKind',
  'persistenz',
  'live_api',
  'persisted_snapshot',
  'freshUntil',
  'availability',
  'affiliate',
]

describe('provider transport trust boundary', () => {
  test('core source does not mint Commercial Provenance or forgeable trust flags', () => {
    const files = [
      'lib/server/providers/core/domain.ts',
      'lib/server/providers/core/executor.ts',
      'lib/server/providers/core/headers.ts',
      'lib/server/providers/core/index.ts',
    ]
    for (const file of files) {
      const source = readFileSync(file, 'utf8')
      assert.equal(source.includes('live_api'), false, file)
      assert.equal(source.includes('persisted_snapshot'), false, file)
      assert.equal(source.includes('sourceKind'), false, file)
      assert.equal(/trusted\s*:/.test(source), false, file)
      assert.equal(source.includes('process.env'), false, file)
    }
  })

  test('successful transport result cannot be treated as a commercial quote by field passthrough', async () => {
    const http: ProviderHttpClient = async () => ({
      status: 200,
      headers: { get: () => null },
      text: async () => '{"amount":1}',
    })
    const created = createProviderTransportExecutor({
      http,
      timeout: { timeoutMs: 20 },
      retry: { maxAttempts: 1, baseDelayMs: 1, maxDelayMs: 1, jitter: 'none' },
      scheduleTimeout: () => () => {},
      sleep: async () => undefined,
    })
    assert.equal(created.ok, true)
    if (!created.ok) return
    const result = await created.executor.execute({
      providerId: 'example',
      operationId: 'search',
      method: 'GET',
      url: 'https://provider.test/v1',
    })
    assert.equal(result.ok, true)
    const shape = result as unknown as Record<string, unknown>
    for (const field of FORBIDDEN_RUNTIME_FIELDS) {
      assert.equal(field in shape, false)
    }
    if (result.ok) {
      const metadata = result.metadata as unknown as Record<string, unknown>
      for (const field of FORBIDDEN_RUNTIME_FIELDS) {
        assert.equal(field in metadata, false)
      }
    }
  })
})
