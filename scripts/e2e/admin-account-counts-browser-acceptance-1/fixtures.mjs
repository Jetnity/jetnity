#!/usr/bin/env node
// Deterministic synthetic fixture plan. Users are created through local GoTrue
// Admin API when a stack exists. Expected counts come from the live inventory,
// never the old HTTP proof's 10/0 assumption.

import { notImplementedError } from './implementation.mjs'

export const FIXTURE_PLAN = Object.freeze({
  domain: 'aacba1.invalid',
  accounts: [
    {
      id: 'privileged-moderator',
      role: 'moderator',
      status: 'active',
      enrollTotpViaUi: true,
      purpose: 'AAL2 happy path and existing-factor fresh session',
    },
    {
      id: 'ordinary-user',
      role: 'user',
      status: 'active',
      enrollTotpViaUi: false,
      purpose: 'ordinary account must not disclose counts',
    },
    {
      id: 'ordinary-creator',
      role: 'creator',
      status: 'active',
      enrollTotpViaUi: false,
      purpose: 'creator must not disclose counts',
    },
    {
      id: 'role-downgrade',
      role: 'moderator',
      laterRole: 'user',
      status: 'active',
      enrollTotpViaUi: true,
      purpose: 'same Auth session / later reload after profile role downgrade',
    },
    {
      id: 'restricted-banned-privileged',
      role: 'moderator',
      status: 'banned',
      enrollTotpViaUi: true,
      purpose: 'profile.status banned while role remains moderator — record actual enforcement; missing denial is a rollout blocker, not a harness failure to hide',
    },
    {
      id: 'restricted-disabled-privileged',
      role: 'moderator',
      status: 'disabled',
      enrollTotpViaUi: false,
      purpose: 'profile.status disabled vs Auth-level ban vs role downgrade',
    },
  ],
  windowCases: {
    recentDelta: 'create one additional confirmed Auth user after first ON measurement',
    genuineZeroWindow: 'only possible if owned Auth has no users created inside the 720-hour half-open window; if GoTrue/migrations already created recent users, report the actual window and do not force a fake zero',
  },
  notAssumed: {
    presentRegisteredAccounts: null,
    createdInPrior30Days: null,
    note: 'Do not reuse the isolated HTTP proof 10/0 fixture totals.',
  },
  deletedAnonymousNoSubject: {
    planned: false,
    reason:
      'Anonymous sign-in stays disabled in accepted config. Deleted/no-subject identities are NOT RUN unless the owned GoTrue catalog already exposes them source-faithfully. This harness will not enable anonymous sign-in or forge those rows.',
  },
})

export function emailFor(accountId, runId) {
  return `${accountId}.${runId}@${FIXTURE_PLAN.domain}`
}

export function sanitizeFixtureManifest(plan, { runId, inventory = null } = {}) {
  return {
    runId,
    domain: plan.domain,
    accounts: plan.accounts.map((account) => ({
      id: account.id,
      role: account.role,
      laterRole: account.laterRole || null,
      status: account.status,
      enrollTotpViaUi: account.enrollTotpViaUi,
      purpose: account.purpose,
      emailPattern: `${account.id}.<runId>@${plan.domain}`,
    })),
    expectedCounts: inventory
      ? {
          presentRegisteredAccounts: inventory.presentRegisteredAccounts,
          createdInPrior30Days: inventory.createdInPrior30Days,
          source: 'owned-auth-inventory-after-fixture',
        }
      : {
          presentRegisteredAccounts: null,
          createdInPrior30Days: null,
          source: 'pending-owned-stack',
        },
    deletedAnonymousNoSubject: plan.deletedAnonymousNoSubject,
    notAssumed: plan.notAssumed,
  }
}

export async function provisioniereUeberGoTrue() {
  throw notImplementedError('GoTrue fixture provisioning')
}
