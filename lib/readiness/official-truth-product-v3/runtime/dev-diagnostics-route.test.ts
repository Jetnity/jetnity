// Real target selection + manual route, with an isolated Auth decision double.
// Existing ch-de-owner-import.test exercises actual current Owner/AAL2 Auth.
import assert from 'node:assert/strict'
import { test } from 'node:test'
import { NextResponse } from 'next/server'
import type { ChDeTickReport } from './ch-de-tick'
import { CH_DE_OWNER_IMPORT_BODY, CH_DE_OWNER_IMPORT_PATH } from './ch-de-owner-import-contract'

const DEV = 'https://yfvbxvijcorffwxbxahl.supabase.co'
const ORIGIN = 'https://fixture-preview.vercel.app'
const GUARDS = {
  VERCEL_ENV: 'preview', VERCEL_PROJECT_ID: 'prj_wTTVawPItEO7a4HihEmaU3PsuaXM',
  VERCEL_GIT_REPO_OWNER: 'Jetnity', VERCEL_GIT_REPO_SLUG: 'jetnity',
  VERCEL_GIT_COMMIT_REF: 'feat/official-truth-human-method-ui-1-20261112',
}
function request() {
  return new Request(ORIGIN + CH_DE_OWNER_IMPORT_PATH, { method: 'POST',
    headers: { origin: ORIGIN, 'content-type': 'application/json' }, body: CH_DE_OWNER_IMPORT_BODY })
}

test('manual diagnostics open only after all five Dev guards, exact URL and the current Owner/AAL2 gate', async t => {
  const before = new Map([...Object.keys(GUARDS), 'VERCEL_REGION'].map(key => [key, process.env[key]]))
  Object.assign(process.env, GUARDS); process.env.VERCEL_REGION = 'fra1'
  t.after(() => { for (const [key, value] of before) {
    if (value === undefined) delete process.env[key]; else process.env[key] = value
  } })
  const lines: string[] = []
  let target = DEV, gateAllowed = true, role = 'owner', grant = 'role'
  let gates = 0, approvals = 0, ticks = 0, throws = false
  t.mock.method(console, 'info', (line: string) => { lines.push(line) })
  t.mock.module(new URL('../../../auth/admin-guard.ts', import.meta.url), { namedExports: {
    async requireAdminApi(options: unknown) {
      gates++
      assert.deepEqual(options, { surface: 'official-truth-import', capability: 'official-truth-freigeben' })
      return gateAllowed ? { ok: true, role, grant } : { ok: false, response: NextResponse.json({ error: 'access_required' }, { status: 403 }) }
    },
  } })
  t.mock.module(new URL('../../../supabase/server.ts', import.meta.url), { namedExports: {
    getServerSupabaseUrl() { return target },
  } })
  t.mock.module(new URL('./ch-de-server.ts', import.meta.url), { namedExports: {
    async checkOfficialTruthV3ChDeMethod() { approvals++; return 'approved' },
  } })
  t.mock.module(new URL('./ch-de-tick.ts', import.meta.url), { namedExports: {
    async runOfficialTruthV3ChDeTick(signal: AbortSignal): Promise<ChDeTickReport> {
      ticks++; assert.equal(signal.aborted, false)
      if (throws) throw Error('private-runtime-error')
      return { schema: 1, status: 'complete', calls: { started: 3, settled: 3 },
        stages: { discovery: 'not_due', monitor: 'complete', research: 'not_due' },
        counts: { published: 0, escalated: 0, researchQueued: 0, suppressed: 0, deferred: 0,
          sourceUnavailable: 0, unconfirmed: 0, unavailable: 0, invalid: 0 }, elapsedMilliseconds: 20, budgetMilliseconds: 30000 }
    },
  } })
  const { POST } = await import('../../../../app/api/internal/readiness/ch-de-owner-import/route')
  for (const [key, value] of Object.entries(GUARDS)) {
    delete process.env[key]; assert.equal((await POST(request())).status, 503)
    process.env[key] = 'wrong'; assert.equal((await POST(request())).status, 503)
    process.env[key] = value
  }
  process.env.VERCEL_ENV = 'production'; assert.equal((await POST(request())).status, 503)
  process.env.VERCEL_ENV = 'preview'
  target = DEV + '/'; assert.equal((await POST(request())).status, 503); target = DEV
  assert.equal(gates, 0); assert.deepEqual(lines, [])
  gateAllowed = false; assert.equal((await POST(request())).status, 403); gateAllowed = true
  role = 'admin'; assert.equal((await POST(request())).status, 403); role = 'owner'
  grant = 'break_glass'; assert.equal((await POST(request())).status, 403); grant = 'role'
  assert.equal(approvals, 0); assert.equal(ticks, 0); assert.deepEqual(lines, [])
  const accepted = await POST(request())
  assert.equal(accepted.status, 200)
  assert.deepEqual(await accepted.json(), { schema: 1, status: 'complete', published: 0 })
  assert.equal(approvals, 1); assert.equal(ticks, 1)
  assert.deepEqual(lines.map(line => (JSON.parse(line) as { stage: string }).stage), ['method_precheck', 'method_precheck', 'tick', 'tick'])
  assert.ok(lines.every(line => (JSON.parse(line) as { region: string }).region === 'fra1'))
  throws = true
  const failed = await POST(request())
  assert.equal(failed.status, 503)
  assert.deepEqual(await failed.json(), { schema: 1, status: 'unresolved', published: 0 })
  assert.equal((JSON.parse(lines.at(-1)!) as { outcome: string }).outcome, 'threw')
  assert.doesNotMatch(lines.join('\n'), /private-runtime-error|https?:|access_required/)
})
