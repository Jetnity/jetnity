import assert from 'node:assert/strict'
import { spawnSync } from 'node:child_process'
import { readFileSync } from 'node:fs'
import { describe, test } from 'node:test'

import {
  LOCAL_EFFECTIVE_TARGET,
  REMOTE_EFFECTIVE_TARGET,
  effectiveTargetPreload,
} from '@/lib/admin/account-counts-delivery/effective-target-harness'
import { transportState } from '@/lib/admin/account-counts-delivery/effective-target-recorder.mjs'

type HarnessTransport = {
  create: Array<{ url: string; keyPresent: boolean }>
  rpc: string[]
  guard: string[]
  cookies: number
}

type HarnessResult = {
  mode: string
  status?: string
  sharedUrl?: string
  processUrl?: string
  empty?: boolean
  html?: string
  measures?: { presentRegisteredAccounts: string; createdInPrior30Days: string } | null
  transport: HarnessTransport
}

function runHarness(mode: string): HarnessResult {
  const result = spawnSync(
    process.execPath,
    [
      '--import',
      './scripts/server-only-test-register.mjs',
      '--import',
      './lib/admin/account-counts-delivery/effective-target-preload.mjs',
      '--import',
      'tsx',
      './lib/admin/account-counts-delivery/effective-target-harness.ts',
    ],
    {
      cwd: process.cwd(),
      encoding: 'utf8',
      env: {
        ...process.env,
        ACCOUNT_COUNTS_HARNESS_MODE: mode,
      },
    },
  )
  assert.equal(result.status, 0, `${mode} stderr=${result.stderr}\nstdout=${result.stdout}`)
  return JSON.parse(result.stdout.trim()) as HarnessResult
}

function zeroTransport(transport: HarnessTransport) {
  assert.deepEqual(transport.create, [])
  assert.deepEqual(transport.rpc, [])
  assert.deepEqual(transport.guard, [])
  assert.equal(transport.cookies, 0)
}

describe('Admin account-counts effective shared-client target', () => {
  test('shared remote capture then loopback process stays disabled with zero calls', () => {
    const result = runHarness('split-remote-then-loopback')
    assert.equal(result.status, 'disabled')
    assert.equal(result.sharedUrl, REMOTE_EFFECTIVE_TARGET)
    assert.equal(result.processUrl, LOCAL_EFFECTIVE_TARGET)
    zeroTransport(result.transport)
  })

  test('genuine local shared target runs one authorized wrapper RPC', () => {
    const result = runHarness('local-positive')
    assert.equal(result.status, 'available', JSON.stringify(result))
    assert.equal(result.sharedUrl, LOCAL_EFFECTIVE_TARGET)
    assert.equal(result.measures?.presentRegisteredAccounts, '4')
    assert.equal(result.measures?.createdInPrior30Days, '1')
    assert.deepEqual(result.transport.guard, ['konten-verwalten'])
    assert.deepEqual(result.transport.rpc, ['admin_account_counts_v1'])
    assert.equal(result.transport.create.length, 1)
    assert.equal(result.transport.create[0]?.url, LOCAL_EFFECTIVE_TARGET)
    assert.equal(result.transport.cookies, 1)
  })

  test('hosted, default-off and missing shared targets stay disabled', () => {
    for (const mode of ['hosted-production', 'default-off', 'missing-target'] as const) {
      const result = runHarness(mode)
      assert.equal(result.status, 'disabled', mode)
      assert.equal(result.empty, true, mode)
      zeroTransport(result.transport)
    }
  })

  test('later process mutation cannot widen a local shared capture', () => {
    const result = runHarness('inverse-stale-process')
    assert.equal(result.status, 'disabled')
    assert.equal(result.sharedUrl, LOCAL_EFFECTIVE_TARGET)
    assert.equal(result.processUrl, REMOTE_EFFECTIVE_TARGET)
    zeroTransport(result.transport)
  })

  test('default component uses the actual loader for disabled and failed rendering', () => {
    const success = runHarness('component-success')
    assert.equal(success.empty, false)
    assert.match(success.html ?? '', /Registrierte Konten/)
    assert.match(success.html ?? '', />4</)
    assert.deepEqual(success.transport.rpc, ['admin_account_counts_v1'])

    const failed = runHarness('component-failed')
    assert.equal(failed.empty, false)
    assert.match(failed.html ?? '', /Die Kontenzahlen konnten nicht zuverlässig gelesen werden/)
    assert.deepEqual(failed.transport.rpc, [])
    assert.deepEqual(failed.transport.guard, ['konten-verwalten'])
  })

  test('shared getter returns the existing factory constant and recorder stays isolated', () => {
    const server = readFileSync('lib/supabase/server.ts', 'utf8')
    assert.match(server, /export function getServerSupabaseUrl\(\): string \| undefined \{\n  return SUPABASE_URL\n\}/)
    assert.match(server, /createServerClient<Db>\(SUPABASE_URL!, SUPABASE_ANON!,/)
    assert.equal((server.match(/createServerClient<Db>\(SUPABASE_URL!, SUPABASE_ANON!,/g) ?? []).length, 3)
    assert.equal(server.includes('process.env.NEXT_PUBLIC_SUPABASE_URL') && server.indexOf('const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL') >= 0, true)
    assert.equal(server.includes('export function setServerSupabaseUrl'), false)
    assert.equal(transportState().create.length, 0)
    assert.equal(typeof effectiveTargetPreload, 'function')
  })
})
