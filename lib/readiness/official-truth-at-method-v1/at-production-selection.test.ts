import assert from 'node:assert/strict'
import { test } from 'node:test'
import { readFileSync } from 'node:fs'
import { eligibleAustriaProductionVisitor } from './at-production-selection'
import { HUMAN_METHOD_PRODUCTION_URL, HUMAN_METHOD_DEV_URL, readHumanRelease } from '../official-truth-product-v3/method/human-contract'

const production = {
  deploymentEnv: 'production',
  projectId: 'prj_wTTVawPItEO7a4HihEmaU3PsuaXM',
  repoOwner: 'Jetnity',
  repoSlug: 'jetnity',
  branch: 'main',
  supabaseUrl: HUMAN_METHOD_PRODUCTION_URL,
  ownerRelease: 'enabled',
} as const

test('AT Production selector is false unless every independent target and Owner flag match', () => {
  // This is only transport eligibility, never proof of an accepted legal fact.
  assert.equal(eligibleAustriaProductionVisitor(production), true)
  for (const altered of [
    { ownerRelease: undefined },
    { ownerRelease: 'true' },
    { deploymentEnv: 'preview' },
    { deploymentEnv: 'development' },
    { projectId: 'prj_other' },
    { repoOwner: 'Other' },
    { repoSlug: 'another-repo' },
    { branch: 'feat/official-truth-at-owned-20261116' },
    { supabaseUrl: HUMAN_METHOD_DEV_URL },
    { supabaseUrl: 'https://example.invalid' },
  ]) {
    assert.equal(eligibleAustriaProductionVisitor({ ...production, ...altered }), false,
      'refuse altered production binding')
  }
})

test('AT Owner Production method is a separate optional server-only flag, never visitor activation',()=>{
 const source=readFileSync(new URL('./at-production-selection.ts',import.meta.url),'utf8')
 const release=readFileSync(new URL('./at-human-release.ts',import.meta.url),'utf8')
 const admin=readFileSync(new URL('../../../app/(admin)/admin/official-truth/at-method/page.tsx',import.meta.url),'utf8')
 assert.match(source,/selectedAustriaProductionMethod/)
 assert.match(source,/JETNITY_OFFICIAL_AT_PRODUCTION_METHOD_OWNER_V1/)
 assert.match(source,/JETNITY_OFFICIAL_AT_PRODUCTION_METHOD_OWNER_V2/)
 assert.match(source,/selectedAustriaProductionMethodV2\(\)/)
 assert.match(source,/selectedAustriaProduction\(\)/) // independent visitor path remains
 assert.match(source,/eligibleAustriaProductionVisitor/)
 assert.doesNotMatch(source,/NEXT_PUBLIC_JETNITY_OFFICIAL_AT_PRODUCTION/)
 assert.match(release,/selectedAustriaDev\(\)/)
 assert.match(release,/selectedAustriaProductionMethodV2\(\)/)
 assert.doesNotMatch(release,/selectedAustriaProductionMethod\(\)/)
 assert.match(release,/selectionId: productionV2Id/)
 assert.match(release,/selectionId: fixedId/)
 assert.match(release,/targetUrl: HUMAN_METHOD_PRODUCTION_URL/)
 assert.match(release,/targetUrl: HUMAN_METHOD_DEV_URL/)
 assert.match(release,/predecessorRevision: 1/)
 assert.match(release,/epoch: 1, status: 'approved'/)
 assert.match(release,/fe161a865c50d26be4a41c1b122fcd14efb3b39bc9100fd66b13304dfca07a4e/)
 assert.match(release,/6584d20adcc08e94edc4a74cad6c780b6db9c7ce89fff8e89afb0d23380e27a0/)
 assert.match(release,/predecessorRevision: null, expectedHead: null/)
 assert.match(admin,/requireAdminPage/)
 assert.match(admin,/gate\.role !== 'owner'/)
 assert.match(admin,/getAtHumanRelease/)
})


test('Production Rev2 only: Owner access cannot select 50-passport Rev1 or visitor publication',()=>{
 const release=readFileSync(new URL('./at-human-release.ts',import.meta.url),'utf8')
 const selection=readFileSync(new URL('./at-production-selection.ts',import.meta.url),'utf8')
 const page=readFileSync(new URL('../../../app/(admin)/admin/official-truth/at-method/page.tsx',import.meta.url),'utf8')
 const panel=readFileSync(new URL('../../../app/(admin)/admin/official-truth/method/MethodAuthorityPanel.tsx',import.meta.url),'utf8')
 assert.match(release,/if \(selectedAustriaProductionMethodV2\(\)\)/)
 assert.doesNotMatch(release,/if \(selectedAustriaProductionMethod\(\)\)/)
 assert.match(selection,/const flag = process\.env\.JETNITY_OFFICIAL_AT_PRODUCTION_METHOD_OWNER_V2/)
 assert.match(selection,/flag !== 'enabled' \|\| process\.env\.VERCEL_ENV !== 'production'/)
 assert.match(selection,/branch: process\.env\.VERCEL_GIT_COMMIT_REF/)
 assert.match(selection,/supabaseUrl: getServerSupabaseUrl\(\)/)
 assert.match(page,/requireAdminPage\(\{ surface: 'official-truth-method', capability: 'official-truth-freigeben' \}\)/)
 assert.match(page,/gate\.role !== 'owner' \|\| gate\.grant !== 'role'/)
 assert.match(page,/release\?\.scope\.citizenship === 'CH'/)
 assert.match(panel,/selected\.scope\.citizenship === 'CH'/)
 assert.doesNotMatch(selection,/NEXT_PUBLIC_JETNITY_OFFICIAL_AT_PRODUCTION_METHOD_OWNER_V2/)
})


test('strict release decoder admits only a CH-to-AT visa Rev2 successor',()=>{
 const valid={
  schema:1,selectionId:'hmr1_feb439d56d8a60334d0151683f46114b',
  targetUrl:HUMAN_METHOD_PRODUCTION_URL,
  methodId:'jetnity-destination-primary-at-visa',revision:2,
  methodDigest:'fe161a865c50d26be4a41c1b122fcd14efb3b39bc9100fd66b13304dfca07a4e',
  packageDigest:'6584d20adcc08e94edc4a74cad6c780b6db9c7ce89fff8e89afb0d23380e27a0',
  predecessorRevision:1,expectedHead:{
   methodId:'jetnity-destination-primary-at-visa',revision:1,
   methodDigest:'cd9b8584d08cc3bfb83f0f1a7095c1c6e011c8d25336f8767ec6678ec8bbc9e9',
   packageDigest:'55e574d7c70c20513a4ac05273c43cdd87dd854e0b403ce0c9a5ab168220ebfe',
   epoch:1,status:'approved',approvalMode:'until_revoked',approvalUntil:null,
  },
  approval:{mode:'until_revoked',until:null},
  packageVersion:'CH→AT Rev2 (Test)',
  packageHref:'https://github.com/Jetnity/jetnity/blob/a7d7b0ba833c4421c7f7b353566762e0472f3638/lib/readiness/official-truth-at-method-v1/at-ch-v2-method-candidate.ts',
  scope:{citizenship:'CH',destination:'AT',requirement:'visa',document:'swiss_passport',route:'direct_entry',
   conditions:'verified_context_only',activeFrom:'2026-11-22T00:00:00.000Z',activeUntilExclusive:'2027-11-22T00:00:00.000Z',
   reviewedScope:'Only ordinary valid CH passport direct entry visa-free. No 50-passport release.'},
 }
 assert.equal(readHumanRelease(valid)?.revision,2)
 for(const altered of [
  {revision:1},{methodId:'another_method'},{predecessorRevision:null},{expectedHead:null},
  {scope:{...valid.scope,citizenship:'DE'}},{scope:{...valid.scope,destination:'DE'}},
  {scope:{...valid.scope,document:'national_passport'}},{scope:{...valid.scope,route:'transit'}},
  {scope:{...valid.scope,requirement:'vaccination'}},{scope:{...valid.scope,conditions:'unconditional'}},
 ]) assert.equal(readHumanRelease({...valid,...altered}),null)
})
