import assert from 'node:assert/strict'
import { readFileSync } from 'node:fs'
import { test } from 'node:test'
import {
  DEV_PROJECT_REF, PROD_PROJECT_REF, REQUIRED_PREVIEW_ENV_KEYS,
  ownerStatusSessionCandidate, previewIsolationGate,
  type OwnerWitnessCandidate, type PreviewEnvRow,
} from './quality-wave2'

const source = (path: string) => readFileSync(path, 'utf8')

test('#1139 candidate refuses owner grants without active account AND live session', () => {
  const good: OwnerWitnessCandidate = {
    role: 'owner', aal: 'aal2', accountStatus: 'active',
    currentSessionVerified: true, currentAuthUserVerified: true, profileMatchesAuthUser: true,
  }
  assert.equal(ownerStatusSessionCandidate(good), true)
  for (const change of [
    { role: 'admin' }, { role: 'creator' }, { role: 'owner', aal: 'aal1' },
    { accountStatus: 'pending' }, { accountStatus: 'disabled' },
    { accountStatus: 'banned' }, { accountStatus: null },
    { currentSessionVerified: false }, { currentSessionVerified: null },
    { currentAuthUserVerified: false }, { profileMatchesAuthUser: false },
  ]) {
    assert.equal(ownerStatusSessionCandidate({ ...good, ...change }), false, JSON.stringify(change))
  }
  // The proposal is not wired into the real DB capability. This is a
  // retained P1 blocker, not a synthetic production status-witness PASS.
  const db = source('supabase/migrations/20261002154952_official_truth_owner_reviewer_capability_1.sql')
  const role = source('supabase/migrations/20260817100000_rollenmodell.sql')
  assert.match(db, /public\.hat_rolle_mindestens\('owner'\)/)
  assert.match(db, /public\.aktuelles_admin_aal2\(\)/)
  assert.match(role, /'active', 'pending', 'disabled', 'banned'/)
  assert.doesNotMatch(db, /session.*(revok|current)|profile.*status|status\s*=\s*'active'/i)
})

test('#1087 widget script/iframe remains fail-closed without separated optional consent', async () => {
  const { CMP_RELEASE_AUTHORIZED } = await import('@/lib/privacy/privacybee-cmp/vertrag')
  const { VENDOR_SCRIPT_EXECUTION_AUTHORIZED } = await import('@/lib/privacy/widget-consent/vertrag')
  const { PRODUCTION_POLICY_TABLE } = await import('@/lib/privacy/privacybee-cmp/produktionspolitik')
  const { discoverCarsWidgetFreigegeben, discoverCarsWidgetLaden } = await import('@/lib/providers/discovercars/widget/renderer')
  assert.equal(CMP_RELEASE_AUTHORIZED, false)
  assert.equal(VENDOR_SCRIPT_EXECUTION_AUTHORIZED, false)
  assert.equal(PRODUCTION_POLICY_TABLE.discovercars, null)
  assert.deepEqual(PRODUCTION_POLICY_TABLE.twelvego.requiredOptional, ['ANALYTICS_STORAGE'])
  assert.equal(discoverCarsWidgetFreigegeben(), false)
  let phase = ''
  // Calling the renderer with no window/document must stop before every
  // DOM/network access. There is no browser, provider or paid request here.
  const dispose = discoverCarsWidgetLaden({} as HTMLElement, next => { phase = next })
  assert.equal(phase, 'datenschutz')
  dispose()
  const renderer = source('lib/providers/discovercars/widget/renderer.ts')
  const denied = renderer.indexOf('if (!discoverCarsWidgetFreigegeben())')
  const frame = renderer.indexOf("document.createElement('iframe')")
  assert.ok(denied >= 0 && frame > denied, 'denial precedes all vendor DOM/network work')
})

test('#968 effective preview isolation needs seven scoped metadata rows AND both runtime witnesses', () => {
  const branch = 'fix/quality-wave2-security-20261120'
  const entries: PreviewEnvRow[] = REQUIRED_PREVIEW_ENV_KEYS.map(key => ({
    key, target: ['preview'], gitBranch: branch,
  }))
  const runtime = {
    browserProjectRef: DEV_PROJECT_REF,
    serverProjectRef: DEV_PROJECT_REF,
    productionCredentialsAbsent: true,
  }
  const input = { branch, entries, completeInventory: true, runtime }
  assert.deepEqual(previewIsolationGate(input), { approved: true, reasons: [] })
  const rejects = [
    { ...input, completeInventory: false },
    { ...input, entries: entries.filter(row => row.key !== 'SUPABASE_SERVICE_ROLE_KEY') },
    { ...input, entries: [...entries, entries[0]] },
    { ...input, entries: [{ ...entries[0], gitBranch: 'main' }, ...entries.slice(1)] },
    { ...input, entries: [{ ...entries[0], target: ['preview', 'production'] }, ...entries.slice(1)] },
    { ...input, entries: [{ ...entries[0], value: 'must-never-pass' }, ...entries.slice(1)] },
    { ...input, runtime: { ...runtime, serverProjectRef: PROD_PROJECT_REF } },
    { ...input, runtime: { ...runtime, browserProjectRef: null } },
    { ...input, runtime: { ...runtime, productionCredentialsAbsent: false } },
    { ...input, runtime: null },
  ]
  rejects.forEach((changed, i) => assert.equal(previewIsolationGate(changed).approved, false, String(i)))
  assert.match(source('lib/supabase/client.ts'), /NEXT_PUBLIC_SUPABASE_URL/)
  assert.match(source('lib/supabase/server.ts'), /NEXT_PUBLIC_SUPABASE_ANON_KEY/)
})
