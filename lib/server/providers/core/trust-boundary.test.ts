import assert from 'node:assert/strict'
import { readdirSync, readFileSync, statSync } from 'node:fs'
import { join } from 'node:path'
import { describe, test } from 'node:test'

import {
  createProviderTransportExecutor,
  type ProviderHttpClient,
} from '@/lib/server/providers/core/exports'

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

function bodyFromText(text: string): ReadableStream<Uint8Array> {
  const encoded = new TextEncoder().encode(text)
  return new ReadableStream({
    start(controller) {
      if (encoded.byteLength > 0) controller.enqueue(encoded)
      controller.close()
    },
  })
}

function walkSourceFiles(dir: string, acc: string[] = []): string[] {
  for (const name of readdirSync(dir)) {
    if (name === 'node_modules' || name.startsWith('.')) continue
    const path = join(dir, name)
    if (statSync(path).isDirectory()) {
      walkSourceFiles(path, acc)
      continue
    }
    if (path.endsWith('.ts') || path.endsWith('.tsx') || path.endsWith('.js') || path.endsWith('.jsx')) {
      acc.push(path)
    }
  }
  return acc
}

describe('provider transport trust boundary', () => {
  test('core source does not mint Commercial Provenance or forgeable trust flags', () => {
    const files = [
      'lib/server/providers/core/domain.ts',
      'lib/server/providers/core/executor.ts',
      'lib/server/providers/core/exports.ts',
      'lib/server/providers/core/headers.ts',
      'lib/server/providers/core/http.ts',
      'lib/server/providers/core/index.ts',
      'lib/server/providers/core/parse.ts',
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

  test('production entry uses the existing Next server-only compile-time boundary', () => {
    const source = readFileSync('lib/server/providers/core/index.ts', 'utf8')
    assert.match(source, /^import 'server-only'$/m)
    assert.match(source, /export \* from '@\/lib\/server\/providers\/core\/exports'/)
  })

  test('no client or component module imports the provider transport core', () => {
    const forbidden = ['@/lib/server/providers', 'lib/server/providers']
    for (const root of ['app', 'components']) {
      for (const file of walkSourceFiles(root)) {
        const source = readFileSync(file, 'utf8')
        const isClient = source.includes("'use client'") || source.includes('"use client"')
        const isComponent = file.startsWith(`components/`) || file.startsWith('components\\')
        if (!isClient && !isComponent) continue
        for (const token of forbidden) {
          assert.equal(source.includes(token), false, `${file} imports ${token}`)
        }
      }
    }
  })

  test('successful transport result cannot be treated as a commercial quote by field passthrough', async () => {
    const http: ProviderHttpClient = async () => ({
      status: 200,
      headers: { get: () => null },
      body: bodyFromText('{"amount":1}'),
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
