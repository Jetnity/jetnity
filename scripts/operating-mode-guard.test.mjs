import assert from 'node:assert/strict'
import { describe, test } from 'node:test'
import {
  HOLD_MODE,
  STALE_MERGE_AUTHORITY_PHRASES,
  classifyChangedFiles,
  findStaleMergeAuthorityPhrases,
  isAuthorizedBranch,
  loadOperatingModeFromText,
  pathMatchesPattern,
  runGuard,
  validateOperatingModeSchema,
} from './operating-mode-guard.mjs'

const validMode = {
  schemaVersion: 1,
  mode: HOLD_MODE,
  updatedAt: '2026-09-18',
  enforcementRole: 'metadata_not_competing_governance',
  canonicalGovernance: [
    'docs/JETNITY_TECHNICAL_LEAD_CURSOR_AGENT_OPERATING_STANDARD.md',
  ],
  normalProductSlices: 'blocked',
  allowedWorkClasses: ['governance', 'continuity', 'evidence', 'enforcement'],
  productOwnerOverride: {
    date: '2026-09-18',
    issue: 440,
    title: 'TEMPORARY PRODUCT-OWNER PRIORITY OVERRIDE — 18 September 2026',
    url: 'https://github.com/Jetnity/jetnity/issues/440',
  },
  parkedProductSlice: {
    pr: 487,
    issue: 486,
    branch: 'docs/v1-security-event-ingestion-architecture-1',
    head: '12d070a79c35fbb9f03d1302833eee8561ec17bd',
    status: 'parked_safe_draft_stop',
    resumeAfterHold: 'independent_tl_review_of_exact_current_head_then_decide_integration',
  },
  exitCondition: {
    requiresIntegratedAndIndependentlyVerified: true,
    description: 'OS integrated + independently verified',
    modeChangeAuthority: 'technical_lead_dedicated_closure_after_evidence',
  },
  specialProductOwnerGatesRemainInForce: true,
  authorizedBranchClasses: ['governance/full-potential-ai-operating-system-'],
  authorizedExactBranches: ['governance/full-potential-ai-operating-system-1'],
  allowedPathPatterns: [
    '.jetnity/**',
    '.cursor/rules/**',
    'docs/JETNITY_FULL_POTENTIAL_AI_OPERATING_SYSTEM_*',
    'scripts/operating-mode-guard.mjs',
  ],
  forbiddenPathPrefixesDuringHold: ['app/', 'lib/', 'supabase/'],
}

describe('operating-mode guard fixtures', () => {
  test('valid HOLD schema passes', () => {
    assert.deepEqual(validateOperatingModeSchema(validMode), [])
    const parsed = loadOperatingModeFromText(JSON.stringify(validMode))
    assert.equal(parsed.mode, HOLD_MODE)
  })

  test('governance branch + allowed files => pass', () => {
    const result = runGuard({
      mode: validMode,
      event: 'pull_request',
      branch: 'governance/full-potential-ai-operating-system-1',
      changedFiles: [
        '.jetnity/operating-mode.json',
        '.cursor/rules/jetnity-operating-mode.mdc',
        'docs/JETNITY_FULL_POTENTIAL_AI_OPERATING_SYSTEM_1_TASK_2026-09-18.md',
        'scripts/operating-mode-guard.mjs',
      ],
    })
    assert.equal(result.ok, true)
    assert.equal(result.checks.holdBranch, true)
    assert.equal(result.checks.holdFiles, true)
    assert.equal(result.checks.mainPushSkipsDiff, false)
  })

  test('product/runtime file during HOLD => fail', () => {
    const result = runGuard({
      mode: validMode,
      event: 'pull_request',
      branch: 'governance/full-potential-ai-operating-system-1',
      changedFiles: ['app/page.tsx', 'lib/flights/suche.ts'],
    })
    assert.equal(result.ok, false)
    assert.equal(result.checks.holdFiles, false)
    assert.match(result.errors.join('\n'), /app\/page\.tsx/)
    assert.match(result.errors.join('\n'), /lib\/flights\/suche\.ts/)
  })

  test('unauthorized branch during HOLD => fail', () => {
    const result = runGuard({
      mode: validMode,
      event: 'pull_request',
      branch: 'feat/trip-builder-polish',
      changedFiles: ['.jetnity/operating-mode.json'],
    })
    assert.equal(result.ok, false)
    assert.equal(result.checks.holdBranch, false)
    assert.match(result.errors.join('\n'), /feat\/trip-builder-polish/)
  })

  test('stale merge-authority phrase => fail', () => {
    const hits = findStaleMergeAuthorityPhrases({
      '.cursor/rules/jetnity-progress-persistence.mdc':
        'Never merge without explicit current Product Owner approval.',
      '.cursor/rules/jetnity-expert-proactivity.mdc':
        'The Product Owner decides major product direction and every merge.',
    })
    assert.equal(hits.length, 2)
    assert.deepEqual(
      hits.map((hit) => hit.phrase).sort(),
      [...STALE_MERGE_AUTHORITY_PHRASES].sort(),
    )
    const result = runGuard({
      mode: validMode,
      event: 'push',
      branch: 'main',
      staleHits: hits,
    })
    assert.equal(result.ok, false)
    assert.equal(result.checks.stalePhrases, false)
  })

  test('normal main push validation => pass', () => {
    const result = runGuard({
      mode: validMode,
      event: 'push',
      branch: 'main',
      changedFiles: ['app/page.tsx'],
      env: {
        GITHUB_REF_NAME: 'governance/full-potential-ai-operating-system-1',
        GITHUB_HEAD_REF: 'governance/full-potential-ai-operating-system-1',
      },
    })
    assert.equal(result.ok, true)
    assert.equal(result.checks.mainPushSkipsDiff, true)
    assert.equal(result.checks.schema, true)
    assert.equal(result.checks.stalePhrases, true)
  })

  test('path allowlist and branch class helpers', () => {
    assert.equal(pathMatchesPattern('.cursor/rules/jetnity-operating-mode.mdc', '.cursor/rules/**'), true)
    assert.equal(
      pathMatchesPattern(
        'docs/JETNITY_FULL_POTENTIAL_AI_OPERATING_SYSTEM_1_STATUS_2026-09-18.md',
        'docs/JETNITY_FULL_POTENTIAL_AI_OPERATING_SYSTEM_*',
      ),
      true,
    )
    assert.equal(isAuthorizedBranch('governance/full-potential-ai-operating-system-2', validMode), true)
    assert.equal(isAuthorizedBranch('fix/v1-security-event-coverage-truth-1', validMode), false)
    const classified = classifyChangedFiles(
      ['scripts/operating-mode-guard.mjs', 'supabase/config.toml'],
      validMode,
    )
    assert.deepEqual(classified.allowed, ['scripts/operating-mode-guard.mjs'])
    assert.deepEqual(classified.rejected, ['supabase/config.toml'])
  })
})
