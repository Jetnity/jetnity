// Actual existing MA1 decoder + fake fixed executor only; no database connection.
import assert from 'node:assert/strict'
import { test } from 'node:test'
import { AA_BERN_CH_DE_REVIEWED_PROGRAM } from '../source/aa-ch-de-reviewed-program'
import type { Ma1MethodSqlExecutor } from '../method/authority-postgres'

test('manual preflight reuses the existing method authority and never exports its receipt', async t => {
  Object.assign(process.env, {
    VERCEL_ENV: 'preview', VERCEL_PROJECT_ID: 'prj_wTTVawPItEO7a4HihEmaU3PsuaXM',
    VERCEL_GIT_REPO_OWNER: 'Jetnity', VERCEL_GIT_REPO_SLUG: 'jetnity',
    VERCEL_GIT_COMMIT_REF: 'feat/official-truth-human-method-ui-1-20261112',
  })
  const binding = AA_BERN_CH_DE_REVIEWED_PROGRAM.binding
  let calls = 0, patch: Record<string, string | null> = {}, unavailable = false
  let held: Promise<void> | null = null
  const executor: Ma1MethodSqlExecutor = { async readCurrent(request, _signal, budget) {
    calls++; assert.ok(budget); assert.equal(request.methodId, binding.methodId); assert.equal(request.revision, binding.revision)
    assert.equal(request.methodDigest, binding.methodDigest); assert.equal(request.packageDigest, binding.packageDigest)
    if (held) await held
    if (unavailable) return { status: 'unavailable' }
    return { status: 'rows', rows: [{ status: 'approved', method_id: binding.methodId, revision: String(binding.revision),
      method_digest: binding.methodDigest, package_digest: binding.packageDigest, epoch: '1',
      approval_mode: 'until_revoked', approval_until: null, observed_at: request.checkedAt, remaining_ms: '5000', ...patch }] }
  } }
  t.mock.module(new URL('../transport/node-postgres-executors.ts', import.meta.url), { namedExports: {
    V3_NODE_POSTGRES_EXECUTORS: { method: executor },
  } })
  const { checkOfficialTruthV3ChDeMethod: check } = await import('./ch-de-server')
  const signal = () => new AbortController().signal
  assert.equal(await check(signal()), 'approved'); assert.equal(calls, 1)
  const negativeRows: Record<string, string | null>[] = [
    { status: 'absent', revision: null, method_digest: null, package_digest: null, epoch: '0',
      approval_mode: null, approval_until: null, remaining_ms: '0' },
    { status: 'draft', epoch: '0', approval_mode: null, remaining_ms: '0' },
    { status: 'revoked', approval_mode: null, remaining_ms: '0' },
    { status: 'expired', approval_mode: 'until', approval_until: '2000-01-01T00:00:00.000Z', remaining_ms: '0' },
    { status: 'different_revision', revision: '2', remaining_ms: '0' },
    { status: 'binding_mismatch', method_digest: 'a'.repeat(64), remaining_ms: '0' },
  ]
  for (const row of negativeRows) {
    patch = row
    assert.equal(await check(signal()), row.status === 'binding_mismatch' ? 'unavailable' : 'not_approved', row.status ?? '')
  }
  const malformedRows: Record<string, string | null>[] = [
    { method_id: 'other-method' }, { revision: '2' }, { method_digest: 'a'.repeat(64) },
    { package_digest: 'b'.repeat(64) }, { remaining_ms: '0' },
    { approval_mode: 'until', approval_until: '2000-01-01T00:00:00.000Z' },
  ]
  for (const changed of malformedRows) {
    patch = changed; assert.equal(await check(signal()), 'unavailable')
  }
  patch = {}; unavailable = true; assert.equal(await check(signal()), 'unavailable')
  unavailable = false
  const before = calls
  process.env.VERCEL_ENV = 'production'
  assert.equal(await check(signal()), 'unavailable'); assert.equal(calls, before)
  process.env.VERCEL_ENV = 'preview'
  const preAborted = new AbortController(); preAborted.abort()
  assert.equal(await check(preAborted.signal), 'unavailable'); assert.equal(calls, before)
  let release!: () => void
  held = new Promise<void>(resolve => { release = resolve })
  const controller = new AbortController()
  let answered = false
  const pending = check(controller.signal).then(value => { answered = true; return value })
  controller.abort(); await Promise.resolve()
  assert.equal(answered, false); assert.equal(calls, before + 1)
  release(); assert.equal(await pending, 'unavailable')
})
