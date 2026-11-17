import assert from 'node:assert/strict'
import { test } from 'node:test'
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
