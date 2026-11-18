import assert from 'node:assert/strict'
import { test } from 'node:test'
import { readFileSync } from 'node:fs'
import { eligibleAustriaProductionVisitor } from './at-production-selection'
import { HUMAN_METHOD_PRODUCTION_URL, HUMAN_METHOD_DEV_URL } from '../official-truth-product-v3/method/human-contract'

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
 assert.match(source,/selectedAustriaProduction\(\)/) // independent visitor path remains
 assert.match(source,/eligibleAustriaProductionVisitor/)
 assert.doesNotMatch(source,/NEXT_PUBLIC_JETNITY_OFFICIAL_AT_PRODUCTION/)
 assert.match(release,/selectedAustriaDev\(\)/)
 assert.match(release,/selectedAustriaProductionMethod\(\)/)
 assert.match(release,/production \? productionId : fixedId/)
 assert.match(release,/production \? HUMAN_METHOD_PRODUCTION_URL : HUMAN_METHOD_DEV_URL/)
 assert.match(release,/predecessorRevision: null, expectedHead: null/)
 assert.match(admin,/requireAdminPage/)
 assert.match(admin,/gate\.role !== 'owner'/)
 assert.match(admin,/getAtHumanRelease/)
})
