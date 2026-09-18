/**
 * Mechanical Jetnity operating-mode guard.
 *
 * Enforcement metadata only. Canonical authority remains the Product Owner,
 * Technical-Lead operating standard, Multi-Agent OS and Guardian standard.
 *
 * No network, secrets, providers or paid services.
 *
 * On pull requests while the *base/main* policy is AI_OS_BUILD_HOLD:
 *   fail closed for a non-authorized branch class;
 *   fail closed if any changed, renamed, copied or deleted path exceeds the
 *   base governance/continuity/enforcement allowlist;
 *   do not let the untrusted PR-head policy broaden or disable that check.
 *
 * On main push:
 *   validate JSON/schema/required references and governance consistency;
 *   do not perform a PR-diff hold check.
 *
 * Full git history is required for PR diffs. CI therefore uses fetch-depth: 0.
 */
import { execFileSync } from 'node:child_process'
import { existsSync, readFileSync, readdirSync } from 'node:fs'
import { dirname, join, resolve } from 'node:path'
import { fileURLToPath } from 'node:url'

export const OPERATING_MODE_PATH = '.jetnity/operating-mode.json'
export const HOLD_MODE = 'AI_OS_BUILD_HOLD'
export const NORMAL_MODE = 'NORMAL'
export const KNOWN_MODES = Object.freeze([HOLD_MODE, NORMAL_MODE])

export const STALE_MERGE_AUTHORITY_PHRASES = Object.freeze([
  'Never merge without explicit current Product Owner approval',
  'The Product Owner decides major product direction and every merge',
])

const REQUIRED_CANONICAL_FILES = Object.freeze([
  'docs/JETNITY_TECHNICAL_LEAD_CURSOR_AGENT_OPERATING_STANDARD.md',
  'docs/JETNITY_MULTI_AGENT_OPERATING_SYSTEM.md',
  'docs/JETNITY_GROK_BOT_OPERATING_STANDARD.md',
  'docs/JETNITY_MULTI_AGENT_SLICE_PLANNING_STANDARD.md',
  '.cursor/rules/jetnity-merge-approval.mdc',
  '.cursor/rules/jetnity-operating-mode.mdc',
  '.cursor/rules/jetnity-progress-persistence.mdc',
  '.cursor/rules/jetnity-expert-proactivity.mdc',
  'scripts/operating-mode-guard.mjs',
])

export const BOOTSTRAP_HOLD_POLICY = Object.freeze({
  schemaVersion: 1,
  mode: HOLD_MODE,
  enforcementRole: 'metadata_not_competing_governance',
  normalProductSlices: 'blocked',
  authorizedBranchClasses: ['governance/full-potential-ai-operating-system-'],
  authorizedExactBranches: ['governance/full-potential-ai-operating-system-1'],
  allowedPathPatterns: [
    '.jetnity/**',
    '.cursor/rules/**',
    '.github/workflows/ci.yml',
    'package.json',
    'AGENTS.md',
    'JETNITY_START_HERE.md',
    'docs/ACTIVE_WORK_STATUS.md',
    'docs/CHATGPT_NEW_CHAT_CHECKPOINT_2026-09-18.md',
    'docs/JETNITY_TECHNICAL_LEAD_CURSOR_AGENT_OPERATING_STANDARD.md',
    'docs/JETNITY_MULTI_AGENT_OPERATING_SYSTEM.md',
    'docs/JETNITY_MULTI_AGENT_SLICE_PLANNING_STANDARD.md',
    'docs/JETNITY_GROK_BOT_OPERATING_STANDARD.md',
    'docs/JETNITY_FULL_POTENTIAL_AI_OPERATING_SYSTEM_*',
    'scripts/operating-mode-guard.mjs',
    'scripts/operating-mode-guard.test.mjs',
  ],
  forbiddenPathPrefixesDuringHold: [
    'app/',
    'components/',
    'lib/',
    'hooks/',
    'supabase/',
    'types/',
    'public/',
  ],
})

export function repoRootFrom(here = fileURLToPath(import.meta.url)) {
  return dirname(dirname(here))
}

export function loadOperatingModeFromText(text, source = OPERATING_MODE_PATH) {
  let parsed
  try {
    parsed = JSON.parse(text)
  } catch (error) {
    throw new Error(`${source}: invalid JSON (${error instanceof Error ? error.message : error})`)
  }
  if (parsed === null || typeof parsed !== 'object' || Array.isArray(parsed)) {
    throw new Error(`${source}: root must be a JSON object`)
  }
  return parsed
}

export function loadOperatingMode(root) {
  const path = join(root, OPERATING_MODE_PATH)
  if (!existsSync(path)) {
    throw new Error(`${OPERATING_MODE_PATH}: missing`)
  }
  return loadOperatingModeFromText(readFileSync(path, 'utf8'))
}

function isNonEmptyString(value) {
  return typeof value === 'string' && value.trim().length > 0
}

function isStringArray(value) {
  return Array.isArray(value) && value.every((item) => typeof item === 'string' && item.length > 0)
}

export function validateOperatingModeSchema(mode) {
  const errors = []
  if (mode.schemaVersion !== 1) {
    errors.push('schemaVersion must be 1')
  }
  if (!KNOWN_MODES.includes(mode.mode)) {
    errors.push(`mode must be one of ${KNOWN_MODES.join(', ')}`)
  }
  if (mode.enforcementRole !== 'metadata_not_competing_governance') {
    errors.push('enforcementRole must be metadata_not_competing_governance')
  }
  if (mode.mode === HOLD_MODE && mode.normalProductSlices !== 'blocked') {
    errors.push('AI_OS_BUILD_HOLD requires normalProductSlices=blocked')
  }
  if (mode.specialProductOwnerGatesRemainInForce !== true) {
    errors.push('specialProductOwnerGatesRemainInForce must remain true')
  }
  if (!Array.isArray(mode.allowedWorkClasses) || mode.allowedWorkClasses.length === 0) {
    errors.push('allowedWorkClasses must be a non-empty array')
  }
  if (!Array.isArray(mode.canonicalGovernance) || mode.canonicalGovernance.length === 0) {
    errors.push('canonicalGovernance must be a non-empty array')
  }
  const override = mode.productOwnerOverride
  if (!override || typeof override !== 'object') {
    errors.push('productOwnerOverride is required')
  } else {
    if (override.date !== '2026-09-18') {
      errors.push('productOwnerOverride.date must be 2026-09-18')
    }
    if (override.issue !== 440) {
      errors.push('productOwnerOverride.issue must be 440')
    }
    if (override.url !== 'https://github.com/Jetnity/jetnity/issues/440') {
      errors.push('productOwnerOverride.url must point to issue 440')
    }
  }
  const parked = mode.parkedProductSlice
  if (!parked || typeof parked !== 'object') {
    errors.push('parkedProductSlice is required')
  } else {
    if (parked.pr !== 487) errors.push('parkedProductSlice.pr must be 487')
    if (parked.issue !== 486) errors.push('parkedProductSlice.issue must be 486')
    if (parked.head !== '12d070a79c35fbb9f03d1302833eee8561ec17bd') {
      errors.push('parkedProductSlice.head must remain 12d070a79c35fbb9f03d1302833eee8561ec17bd')
    }
    if (parked.status !== 'parked_safe_draft_stop') {
      errors.push('parkedProductSlice.status must be parked_safe_draft_stop')
    }
  }
  const exit = mode.exitCondition
  if (!exit || typeof exit !== 'object') {
    errors.push('exitCondition is required')
  } else {
    if (exit.requiresIntegratedAndIndependentlyVerified !== true) {
      errors.push('exitCondition.requiresIntegratedAndIndependentlyVerified must be true')
    }
    if (exit.requiresTenRoleExternalSetupAndVerification !== true) {
      errors.push('exitCondition.requiresTenRoleExternalSetupAndVerification must be true')
    }
    if (exit.samePrCannotMixModeChangeAndProductRuntime !== true) {
      errors.push('exitCondition.samePrCannotMixModeChangeAndProductRuntime must be true')
    }
    if (exit.modeChangeAuthority !== 'technical_lead_dedicated_closure_after_evidence') {
      errors.push('exitCondition.modeChangeAuthority must be technical_lead_dedicated_closure_after_evidence')
    }
    if (exit.transitionContract !== 'dedicated_hold_closure_only') {
      errors.push('exitCondition.transitionContract must be dedicated_hold_closure_only')
    }
    if (!isNonEmptyString(exit.description)) {
      errors.push('exitCondition.description is required')
    }
  }
  if (!isStringArray(mode.authorizedBranchClasses)) {
    errors.push('authorizedBranchClasses must be a non-empty string array')
  }
  if (!isStringArray(mode.authorizedExactBranches)) {
    errors.push('authorizedExactBranches must be a non-empty string array')
  } else if (!mode.authorizedExactBranches.includes('governance/full-potential-ai-operating-system-1')) {
    errors.push('authorizedExactBranches must include governance/full-potential-ai-operating-system-1')
  }
  if (!isStringArray(mode.allowedPathPatterns)) {
    errors.push('allowedPathPatterns must be a non-empty string array')
  }
  if (!isStringArray(mode.forbiddenPathPrefixesDuringHold)) {
    errors.push('forbiddenPathPrefixesDuringHold must be a non-empty string array')
  }
  return errors
}

export function globToRegExp(pattern) {
  let i = 0
  let out = '^'
  while (i < pattern.length) {
    if (pattern.startsWith('**/', i)) {
      out += '(?:.*/)?'
      i += 3
      continue
    }
    if (pattern.startsWith('**', i)) {
      out += '.*'
      i += 2
      continue
    }
    const ch = pattern[i]
    if (ch === '*') {
      out += '[^/]*'
    } else if (ch === '?') {
      out += '[^/]'
    } else if ('+.^${}()|[]\\'.includes(ch)) {
      out += `\\${ch}`
    } else {
      out += ch
    }
    i += 1
  }
  return new RegExp(`${out}$`)
}

export function pathMatchesPattern(file, pattern) {
  const normalized = file.replaceAll('\\', '/')
  if (pattern.endsWith('/**')) {
    const prefix = pattern.slice(0, -3).replace(/\/$/, '')
    return normalized === prefix || normalized.startsWith(`${prefix}/`)
  }
  return globToRegExp(pattern).test(normalized)
}

export function isAuthorizedBranch(branch, mode) {
  if (!isNonEmptyString(branch)) return false
  const exact = mode.authorizedExactBranches ?? []
  if (exact.includes(branch)) return true
  const classes = mode.authorizedBranchClasses ?? []
  return classes.some((prefix) => branch.startsWith(prefix))
}

export function classifyChangedFiles(files, mode) {
  const allowed = []
  const rejected = []
  const patterns = mode.allowedPathPatterns ?? []
  const forbidden = mode.forbiddenPathPrefixesDuringHold ?? []
  for (const file of files) {
    const normalized = file.replaceAll('\\', '/')
    const allowlisted = patterns.some((pattern) => pathMatchesPattern(normalized, pattern))
    const forbiddenHit = forbidden.some((prefix) => normalized.startsWith(prefix))
    if (allowlisted && !forbiddenHit) {
      allowed.push(normalized)
      continue
    }
    rejected.push(normalized)
  }
  return { allowed, rejected }
}

export function parseNameStatus(output) {
  const entries = []
  const paths = []
  const seen = new Set()
  const addPath = (file) => {
    if (!file) return
    const normalized = file.replaceAll('\\', '/')
    if (seen.has(normalized)) return
    seen.add(normalized)
    paths.push(normalized)
  }
  for (const line of output.split('\n')) {
    if (!line) continue
    const parts = line.split('\t')
    const status = parts[0] ?? ''
    if (status.startsWith('R') || status.startsWith('C')) {
      const source = parts[1]
      const dest = parts[2]
      entries.push({
        status,
        kind: status.startsWith('R') ? 'rename' : 'copy',
        source,
        dest,
      })
      addPath(source)
      addPath(dest)
      continue
    }
    if (status.startsWith('D')) {
      entries.push({ status, kind: 'delete', source: parts[1], dest: null })
      addPath(parts[1])
      continue
    }
    entries.push({ status, kind: 'change', source: null, dest: parts[1] })
    addPath(parts[1])
  }
  return { entries, paths }
}

export function findStaleMergeAuthorityPhrases(fileContentsByPath) {
  const hits = []
  for (const [file, contents] of Object.entries(fileContentsByPath)) {
    for (const phrase of STALE_MERGE_AUTHORITY_PHRASES) {
      if (contents.includes(phrase)) {
        hits.push({ file, phrase })
      }
    }
  }
  return hits
}

export function listCursorRuleFiles(root) {
  const dir = join(root, '.cursor', 'rules')
  if (!existsSync(dir)) return []
  return readdirSync(dir)
    .filter((name) => name.endsWith('.mdc'))
    .map((name) => join('.cursor', 'rules', name))
}

export function readCursorRuleContents(root) {
  const files = listCursorRuleFiles(root)
  const contents = {}
  for (const file of files) {
    contents[file] = readFileSync(join(root, file), 'utf8')
  }
  return contents
}

export function validateCanonicalFilesExist(root, mode) {
  const errors = []
  const required = new Set([
    ...REQUIRED_CANONICAL_FILES,
    ...(mode.canonicalGovernance ?? []),
    OPERATING_MODE_PATH,
  ])
  for (const file of required) {
    if (!existsSync(join(root, file))) {
      errors.push(`missing required governance file: ${file}`)
    }
  }
  return errors
}

export function detectEvent(env = process.env, gitBranch = null) {
  const explicit = env.JETNITY_OPERATING_MODE_EVENT || env.GITHUB_EVENT_NAME
  if (explicit === 'pull_request' || explicit === 'push') return explicit
  if (gitBranch === 'main') return 'push'
  return 'pull_request'
}

export function detectBranch(env = process.env, gitBranch = null) {
  return (
    env.JETNITY_OPERATING_MODE_REF ||
    env.GITHUB_HEAD_REF ||
    (env.GITHUB_REF_NAME && env.GITHUB_REF_NAME !== 'main' ? env.GITHUB_REF_NAME : null) ||
    gitBranch ||
    ''
  )
}

export function isMainPush(event, branch, env = {}) {
  if (event !== 'push') return false
  if (branch === 'main') return true
  const refName = env.GITHUB_REF_NAME || env.JETNITY_OPERATING_MODE_REF
  return refName === 'main' || env.GITHUB_REF === 'refs/heads/main'
}

export function isDedicatedHoldClosure({ enforcementMode, headMode, branch, changedFiles }) {
  if (!enforcementMode || enforcementMode.mode !== HOLD_MODE) return false
  if (!headMode || headMode.mode !== NORMAL_MODE) return false
  if (!isAuthorizedBranch(branch, enforcementMode)) return false
  const { rejected } = classifyChangedFiles(changedFiles, enforcementMode)
  return rejected.length === 0
}

export function filesAuthorizedOnlyByHead(changedFiles, enforcementMode, headMode) {
  if (!headMode) return []
  return changedFiles.filter((file) => {
    const byBase = classifyChangedFiles([file], enforcementMode)
    const byHead = classifyChangedFiles([file], headMode)
    return byBase.rejected.length > 0 && byHead.allowed.length > 0
  })
}

export function runGuard({
  mode,
  enforcementMode,
  headMode,
  event,
  branch,
  changedFiles = [],
  changeEntries = [],
  staleHits = [],
  schemaErrors = [],
  missingFileErrors = [],
  env = {},
}) {
  const policy = enforcementMode || mode
  const head = headMode || mode
  const paths = changeEntries.length > 0 ? parseNameStatus(
    changeEntries
      .map((entry) => {
        if (entry.kind === 'rename' || entry.kind === 'copy') {
          return `${entry.status}\t${entry.source}\t${entry.dest}`
        }
        if (entry.kind === 'delete') return `${entry.status}\t${entry.source}`
        return `${entry.status}\t${entry.dest}`
      })
      .join('\n'),
  ).paths : changedFiles

  const errors = [...schemaErrors, ...missingFileErrors]
  const checks = {
    schema: schemaErrors.length === 0,
    stalePhrases: staleHits.length === 0,
    holdBranch: true,
    holdFiles: true,
    holdTransition: true,
    headCannotBroaden: true,
    mainPushSkipsDiff: false,
  }

  if (staleHits.length > 0) {
    for (const hit of staleHits) {
      errors.push(`stale merge-authority phrase in ${hit.file}: ${hit.phrase}`)
    }
  }

  if (isMainPush(event, branch, env)) {
    checks.mainPushSkipsDiff = true
    return { ok: errors.length === 0, errors, checks }
  }

  if (policy.mode === HOLD_MODE) {
    if (!isAuthorizedBranch(branch, policy)) {
      checks.holdBranch = false
      errors.push(
        `AI_OS_BUILD_HOLD rejects unauthorized branch "${branch || '(empty)'}"; allowed exact/class: ${[
          ...(policy.authorizedExactBranches ?? []),
          ...(policy.authorizedBranchClasses ?? []),
        ].join(', ')}`,
      )
    }
    const { rejected } = classifyChangedFiles(paths, policy)
    if (rejected.length > 0) {
      checks.holdFiles = false
      errors.push(
        `AI_OS_BUILD_HOLD rejects non-governance/runtime paths: ${rejected.join(', ')}`,
      )
    }
    const headOnly = filesAuthorizedOnlyByHead(paths, policy, head)
    if (headOnly.length > 0) {
      checks.headCannotBroaden = false
      errors.push(
        `PR-head policy cannot authorize files forbidden by base/main HOLD policy: ${headOnly.join(', ')}`,
      )
    }
    if (head && head.mode === NORMAL_MODE) {
      const closure = isDedicatedHoldClosure({
        enforcementMode: policy,
        headMode: head,
        branch,
        changedFiles: paths,
      })
      if (!closure) {
        checks.holdTransition = false
        errors.push(
          'HOLD→NORMAL is rejected unless this is a dedicated closure: authorized governance branch, base HOLD allowlist only, and no product/runtime paths in the same PR',
        )
      }
    }
  }

  return { ok: errors.length === 0, errors, checks }
}

function git(root, args) {
  return execFileSync('git', args, {
    cwd: root,
    encoding: 'utf8',
    stdio: ['ignore', 'pipe', 'pipe'],
  }).trim()
}

export function currentGitBranch(root) {
  try {
    return git(root, ['rev-parse', '--abbrev-ref', 'HEAD'])
  } catch {
    return null
  }
}

function diffRange(env = process.env) {
  const base = env.JETNITY_OPERATING_MODE_BASE_SHA
  const head = env.JETNITY_OPERATING_MODE_HEAD_SHA
  if (base && head) return `${base}...${head}`
  return null
}

export function tryLoadOperatingModeFromGit(root, ref) {
  try {
    const text = git(root, ['show', `${ref}:${OPERATING_MODE_PATH}`])
    if (!text) return null
    return loadOperatingModeFromText(text, `${ref}:${OPERATING_MODE_PATH}`)
  } catch {
    return null
  }
}

export function loadEnforcementPolicy(root, env = process.env, event, branch) {
  const head = loadOperatingMode(root)
  if (isMainPush(event, branch, env)) {
    return { head, enforcement: head, base: head, source: 'head-as-main' }
  }
  const baseSha = env.JETNITY_OPERATING_MODE_BASE_SHA
  const refs = [baseSha, 'origin/main', 'main'].filter(Boolean)
  for (const ref of refs) {
    const loaded = tryLoadOperatingModeFromGit(root, ref)
    if (loaded) {
      return { head, enforcement: loaded, base: loaded, source: ref }
    }
  }
  return {
    head,
    enforcement: BOOTSTRAP_HOLD_POLICY,
    base: BOOTSTRAP_HOLD_POLICY,
    source: 'bootstrap-hold',
  }
}

export function collectChangedFileEntries(root, env = process.env) {
  const range = diffRange(env)
  const args = range
    ? ['diff', '--name-status', '-M', '-C', range]
    : ['diff', '--name-status', '-M', '-C', 'origin/main...HEAD']
  try {
    return parseNameStatus(git(root, args))
  } catch {
    return parseNameStatus(git(root, ['diff', '--name-status', '-M', '-C', 'main...HEAD']))
  }
}

export function evaluateRepository(root = repoRootFrom(), env = process.env) {
  const gitBranch = currentGitBranch(root)
  const event = detectEvent(env, gitBranch)
  const branch = detectBranch(env, gitBranch)
  const { head, enforcement } = loadEnforcementPolicy(root, env, event, branch)
  const schemaErrors = validateOperatingModeSchema(head)
  const missingFileErrors = validateCanonicalFilesExist(root, head)
  const staleHits = findStaleMergeAuthorityPhrases(readCursorRuleContents(root))
  const collected = isMainPush(event, branch, env)
    ? { paths: [], entries: [] }
    : collectChangedFileEntries(root, env)
  return runGuard({
    mode: enforcement,
    enforcementMode: enforcement,
    headMode: head,
    event,
    branch,
    changedFiles: collected.paths,
    staleHits,
    schemaErrors,
    missingFileErrors,
    env,
  })
}

function isDirectCli() {
  const invoked = process.argv[1]
  if (!invoked) return false
  return resolve(fileURLToPath(import.meta.url)) === resolve(invoked)
}

if (isDirectCli()) {
  try {
    const result = evaluateRepository()
    if (result.ok) {
      console.log('operating-mode guard: PASS')
      process.exit(0)
    }
    console.error('operating-mode guard: FAIL')
    for (const error of result.errors) {
      console.error(`- ${error}`)
    }
    process.exit(1)
  } catch (error) {
    console.error(`operating-mode guard: FAIL (${error instanceof Error ? error.message : error})`)
    process.exit(1)
  }
}
