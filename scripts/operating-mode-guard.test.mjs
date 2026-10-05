import assert from 'node:assert/strict'
import { describe, test } from 'node:test'
import {
  HOLD_MODE,
  NORMAL_MODE,
  STALE_MERGE_AUTHORITY_PHRASES,
  classifyChangedFiles,
  filesAuthorizedOnlyByHead,
  findStaleMergeAuthorityPhrases,
  isAuthorizedBranch,
  isDedicatedHoldClosure,
  loadOperatingModeFromText,
  parseNameStatus,
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
    requiresTenRoleExternalSetupAndVerification: true,
    requiresGithubHardEnforcementBaseline: true,
    requiresDedicatedHoldExitEvidenceChecklist: true,
    ciCannotProveExternalPrerequisites: true,
    dedicatedHoldExitChecklist:
      'docs/JETNITY_FULL_POTENTIAL_AI_OPERATING_SYSTEM_1_HOLD_EXIT_CHECKLIST_2026-09-18.md',
    samePrCannotMixModeChangeAndProductRuntime: true,
    description: 'OS integrated + independently verified + ten-role external setup + GitHub baseline',
    modeChangeAuthority: 'technical_lead_dedicated_closure_after_evidence',
    transitionContract: 'dedicated_hold_closure_only',
  },
  specialProductOwnerGatesRemainInForce: true,
  authorizedBranchClasses: ['governance/full-potential-ai-operating-system-'],
  authorizedExactBranches: ['governance/full-potential-ai-operating-system-1'],
  authorizedBranchClassRationale:
    'Planned later OS meta-slices; no merge or bypass authority.',
  allowedPathPatterns: [
    '.jetnity/**',
    '.cursor/rules/**',
    'docs/JETNITY_FULL_POTENTIAL_AI_OPERATING_SYSTEM_*',
    'scripts/operating-mode-guard.mjs',
  ],
  forbiddenPathPrefixesDuringHold: ['app/', 'lib/', 'supabase/'],
}

const authorizedBranch = 'governance/full-potential-ai-operating-system-1'
const allowedFiles = [
  '.jetnity/operating-mode.json',
  '.cursor/rules/jetnity-operating-mode.mdc',
  'docs/JETNITY_FULL_POTENTIAL_AI_OPERATING_SYSTEM_1_TASK_2026-09-18.md',
  'scripts/operating-mode-guard.mjs',
]

describe('operating-mode guard fixtures', () => {
  test('valid HOLD schema passes', () => {
    assert.deepEqual(validateOperatingModeSchema(validMode), [])
    const parsed = loadOperatingModeFromText(JSON.stringify(validMode))
    assert.equal(parsed.mode, HOLD_MODE)
  })

  test('schema without dedicated HOLD-exit contract fields fails', () => {
    const incomplete = structuredClone(validMode)
    delete incomplete.exitCondition.requiresTenRoleExternalSetupAndVerification
    delete incomplete.exitCondition.requiresGithubHardEnforcementBaseline
    delete incomplete.exitCondition.requiresDedicatedHoldExitEvidenceChecklist
    delete incomplete.exitCondition.ciCannotProveExternalPrerequisites
    delete incomplete.exitCondition.samePrCannotMixModeChangeAndProductRuntime
    delete incomplete.exitCondition.transitionContract
    const errors = validateOperatingModeSchema(incomplete)
    assert.ok(errors.some((error) => error.includes('requiresTenRoleExternalSetupAndVerification')))
    assert.ok(errors.some((error) => error.includes('requiresGithubHardEnforcementBaseline')))
    assert.ok(errors.some((error) => error.includes('requiresDedicatedHoldExitEvidenceChecklist')))
    assert.ok(errors.some((error) => error.includes('ciCannotProveExternalPrerequisites')))
    assert.ok(errors.some((error) => error.includes('samePrCannotMixModeChangeAndProductRuntime')))
    assert.ok(errors.some((error) => error.includes('transitionContract')))
  })

  test('governance branch + allowed files => pass', () => {
    const result = runGuard({
      mode: validMode,
      enforcementMode: validMode,
      headMode: validMode,
      event: 'pull_request',
      branch: authorizedBranch,
      changedFiles: allowedFiles,
    })
    assert.equal(result.ok, true)
    assert.equal(result.checks.holdBranch, true)
    assert.equal(result.checks.holdFiles, true)
    assert.equal(result.checks.holdTransition, true)
    assert.equal(result.checks.headCannotBroaden, true)
    assert.equal(result.checks.mainPushSkipsDiff, false)
  })

  test('product/runtime file during HOLD => fail', () => {
    const result = runGuard({
      mode: validMode,
      enforcementMode: validMode,
      headMode: validMode,
      event: 'pull_request',
      branch: authorizedBranch,
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
      enforcementMode: validMode,
      headMode: validMode,
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

  test('head NORMAL while base HOLD without dedicated closure shape => fail', () => {
    const headMode = { ...validMode, mode: NORMAL_MODE, normalProductSlices: 'allowed' }
    const result = runGuard({
      mode: validMode,
      enforcementMode: validMode,
      headMode,
      event: 'pull_request',
      branch: authorizedBranch,
      changedFiles: [...allowedFiles, 'app/page.tsx'],
    })
    assert.equal(result.ok, false)
    assert.equal(result.checks.holdFiles, false)
    assert.equal(result.checks.holdTransition, false)
    assert.equal(
      isDedicatedHoldClosure({
        enforcementMode: validMode,
        headMode,
        branch: authorizedBranch,
        changedFiles: [...allowedFiles, 'app/page.tsx'],
      }),
      false,
    )
    assert.match(result.errors.join('\n'), /HOLD→NORMAL/)
    assert.match(result.errors.join('\n'), /app\/page\.tsx/)
  })

  test('head NORMAL while base HOLD with dedicated closure shape => pass', () => {
    const headMode = { ...validMode, mode: NORMAL_MODE, normalProductSlices: 'allowed' }
    const result = runGuard({
      mode: validMode,
      enforcementMode: validMode,
      headMode,
      event: 'pull_request',
      branch: authorizedBranch,
      changedFiles: allowedFiles,
    })
    assert.equal(result.ok, true)
    assert.equal(result.checks.holdTransition, true)
    assert.equal(result.checks.holdFiles, true)
    assert.equal(
      isDedicatedHoldClosure({
        enforcementMode: validMode,
        headMode,
        branch: authorizedBranch,
        changedFiles: allowedFiles,
      }),
      true,
    )
  })

  test('head-broadened allowlist cannot authorize otherwise forbidden files', () => {
    const headMode = {
      ...validMode,
      allowedPathPatterns: [...validMode.allowedPathPatterns, 'app/**', '**'],
      forbiddenPathPrefixesDuringHold: [],
    }
    const result = runGuard({
      mode: validMode,
      enforcementMode: validMode,
      headMode,
      event: 'pull_request',
      branch: authorizedBranch,
      changedFiles: [...allowedFiles, 'app/page.tsx'],
    })
    assert.equal(result.ok, false)
    assert.equal(result.checks.holdFiles, false)
    assert.equal(result.checks.headCannotBroaden, false)
    assert.deepEqual(
      filesAuthorizedOnlyByHead(['app/page.tsx'], validMode, headMode),
      ['app/page.tsx'],
    )
    assert.match(result.errors.join('\n'), /cannot authorize files forbidden by base\/main/)
  })

  test('head-broadened authorized branches cannot authorize an otherwise forbidden branch', () => {
    const headMode = {
      ...validMode,
      authorizedExactBranches: [...validMode.authorizedExactBranches, 'feat/trip-builder-polish'],
      authorizedBranchClasses: [...validMode.authorizedBranchClasses, 'feat/'],
    }
    const result = runGuard({
      mode: validMode,
      enforcementMode: validMode,
      headMode,
      event: 'pull_request',
      branch: 'feat/trip-builder-polish',
      changedFiles: allowedFiles,
    })
    assert.equal(result.ok, false)
    assert.equal(result.checks.holdBranch, false)
    assert.equal(isAuthorizedBranch('feat/trip-builder-polish', validMode), false)
    assert.equal(isAuthorizedBranch('feat/trip-builder-polish', headMode), true)
  })

  test('parseNameStatus evaluates rename and copy source plus destination', () => {
    const parsed = parseNameStatus(
      [
        'R100\tapp/page.tsx\tdocs/JETNITY_FULL_POTENTIAL_AI_OPERATING_SYSTEM_1_MOVED.md',
        'C080\tlib/flights/suche.ts\tdocs/JETNITY_FULL_POTENTIAL_AI_OPERATING_SYSTEM_1_COPIED.md',
        'D\tsupabase/config.toml',
        'M\t.jetnity/operating-mode.json',
      ].join('\n'),
    )
    assert.deepEqual(parsed.paths, [
      'app/page.tsx',
      'docs/JETNITY_FULL_POTENTIAL_AI_OPERATING_SYSTEM_1_MOVED.md',
      'lib/flights/suche.ts',
      'docs/JETNITY_FULL_POTENTIAL_AI_OPERATING_SYSTEM_1_COPIED.md',
      'supabase/config.toml',
      '.jetnity/operating-mode.json',
    ])
    assert.equal(parsed.entries[0].kind, 'rename')
    assert.equal(parsed.entries[1].kind, 'copy')
    assert.equal(parsed.entries[2].kind, 'delete')
  })

  test('forbidden→allowed rename during HOLD => fail', () => {
    const result = runGuard({
      mode: validMode,
      enforcementMode: validMode,
      headMode: validMode,
      event: 'pull_request',
      branch: authorizedBranch,
      changeEntries: [
        {
          status: 'R100',
          kind: 'rename',
          source: 'app/page.tsx',
          dest: 'docs/JETNITY_FULL_POTENTIAL_AI_OPERATING_SYSTEM_1_MOVED.md',
        },
      ],
    })
    assert.equal(result.ok, false)
    assert.equal(result.checks.holdFiles, false)
    assert.match(result.errors.join('\n'), /app\/page\.tsx/)
  })

  test('allowed→forbidden rename during HOLD => fail', () => {
    const result = runGuard({
      mode: validMode,
      enforcementMode: validMode,
      headMode: validMode,
      event: 'pull_request',
      branch: authorizedBranch,
      changeEntries: [
        {
          status: 'R100',
          kind: 'rename',
          source: 'docs/JETNITY_FULL_POTENTIAL_AI_OPERATING_SYSTEM_1_TASK_2026-09-18.md',
          dest: 'app/page.tsx',
        },
      ],
    })
    assert.equal(result.ok, false)
    assert.equal(result.checks.holdFiles, false)
    assert.match(result.errors.join('\n'), /app\/page\.tsx/)
  })

  test('forbidden deletion during HOLD => fail', () => {
    const result = runGuard({
      mode: validMode,
      enforcementMode: validMode,
      headMode: validMode,
      event: 'pull_request',
      branch: authorizedBranch,
      changeEntries: [
        {
          status: 'D',
          kind: 'delete',
          source: 'lib/flights/suche.ts',
          dest: null,
        },
      ],
    })
    assert.equal(result.ok, false)
    assert.equal(result.checks.holdFiles, false)
    assert.match(result.errors.join('\n'), /lib\/flights\/suche\.ts/)
  })
})
