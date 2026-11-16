import assert from 'node:assert/strict'
import { spawnSync } from 'node:child_process'
import test from 'node:test'
import { adminAccountCountsActivationEnvFromProcess } from '../account-counts-delivery/activation'
import type { CountsRuntimeProofMode, CountsRuntimeProofResult } from './counts-harness'

test('Counts captures the common branch-specific flag without changing its existing flags', () => {
  const env = adminAccountCountsActivationEnvFromProcess({ NODE_ENV: 'production', JETNITY_ADMIN_DEV_RUNTIME_ENABLED: 'true',
    JETNITY_ADMIN_ACCOUNT_COUNTS_DEV_ENABLED: 'false', JETNITY_ADMIN_ACCOUNT_COUNTS_LOCAL_ENABLED: 'false' })
  assert.equal(env.JETNITY_ADMIN_DEV_RUNTIME_ENABLED, 'true')
  assert.equal(env.JETNITY_ADMIN_ACCOUNT_COUNTS_DEV_ENABLED, 'false')
  assert.equal(env.JETNITY_ADMIN_ACCOUNT_COUNTS_LOCAL_ENABLED, 'false')
})

for (const mode of ['enabled', 'disabled', 'wrong-branch', 'ci'] satisfies readonly CountsRuntimeProofMode[]) {
  test(`actual Counts loader uses the common Dev gate: ${mode}`, () => {
    const result = spawnSync(process.execPath, ['--import', './scripts/server-only-test-register.mjs',
      '--import', './lib/admin/account-counts-delivery/effective-target-preload.mjs', '--import', 'tsx',
      './lib/admin/runtime-installation/counts-harness.ts'], {
      cwd: process.cwd(), encoding: 'utf8', env: { ...process.env, ADMIN_RUNTIME_COUNTS_PROOF: mode },
    })
    assert.equal(result.status, 0, result.stderr)
    const actual = JSON.parse(result.stdout.trim()) as CountsRuntimeProofResult
    assert.equal(actual.mode, mode)
    assert.equal(actual.status, mode === 'enabled' ? 'available' : 'disabled')
    if (mode === 'enabled') {
      assert.deepEqual(actual.transport.guard, ['konten-verwalten'])
      assert.equal(actual.transport.rpc.length, 1)
    } else assert.deepEqual(actual.transport, { create: [], rpc: [], guard: [], cookies: 0 })
  })
}
