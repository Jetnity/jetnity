import { spawnSync } from 'node:child_process'
import { globSync, lstatSync } from 'node:fs'
import { dirname, join, resolve } from 'node:path'
import { fileURLToPath } from 'node:url'

const repositoryRoot = resolve(dirname(fileURLToPath(import.meta.url)), '..')
export const ORIGINAL_TEST_FAMILIES = Object.freeze([
  'lib/**/*.test.ts',
  'scripts/operating-mode-guard.test.mjs',
  'scripts/dev-reference-local-pg-prep-1/*.test.ts',
])
export const HOSTED_PG17_FILES = Object.freeze([
  'lib/readiness/official-truth-v3-composed-dev-1.test.ts',
  'lib/readiness/official-truth-v3-hosted-durable-jobs-1.test.ts',
  'lib/readiness/official-truth-v3-hosted-intake-store-1.test.ts',
  'lib/readiness/official-truth-v3-hosted-method-authority-1.test.ts',
  'lib/readiness/official-truth-v3-human-method-transport-1.test.ts',
  'lib/readiness/profile-authority-integrity-1.test.ts',
])
export const SELECTOR_CONTRACT = 'scripts/official-truth-v3-test-selection.test.mjs'
const requiredScriptTests = Object.freeze([
  'scripts/operating-mode-guard.test.mjs',
  'scripts/dev-reference-local-pg-prep-1/ablauf.test.ts',
  'scripts/dev-reference-local-pg-prep-1/nativ.test.ts',
  'scripts/dev-reference-local-pg-prep-1/sql.test.ts',
  'scripts/dev-reference-local-pg-prep-1/ziel.test.ts',
])

function requireRelativePath(path) {
  if (typeof path !== 'string' || path.length === 0 || path.includes('\\')
    || [...path].some((character) => character.charCodeAt(0) < 32 || character.charCodeAt(0) === 127)
    || path.split('/').some((part) => part === '' || part === '.' || part === '..')) {
    throw new Error('Invalid required test path')
  }
}

function isOriginalTest(path) {
  return /^lib\/.+\.test\.ts$/.test(path)
    || path === 'scripts/operating-mode-guard.test.mjs'
    || /^scripts\/dev-reference-local-pg-prep-1\/[^/]+\.test\.ts$/.test(path)
}

function checkedPaths(paths, label) {
  if (!Array.isArray(paths) || paths.length === 0) throw new Error(label + ' must not be empty')
  const seen = new Set()
  for (const path of paths) {
    requireRelativePath(path)
    if (!isOriginalTest(path)) throw new Error('Path is outside the original test families: ' + path)
    if (seen.has(path)) throw new Error('Duplicate ' + label + ' path: ' + path)
    seen.add(path)
  }
  return [...paths].sort()
}

function requireRegularFile(root, path) {
  requireRelativePath(path)
  const parts = path.split('/')
  let current = root
  if (!lstatSync(root).isDirectory()) throw new Error('Test root is not a directory')
  for (const [index, part] of parts.entries()) {
    current = join(current, part)
    const stat = lstatSync(current)
    if (stat.isSymbolicLink() || (index === parts.length - 1 ? !stat.isFile() : !stat.isDirectory())) {
      throw new Error('Required test path must be a regular file without symlink components: ' + path)
    }
  }
}

export function discoverOriginalTestFiles(root = repositoryRoot) {
  const found = []
  for (const pattern of ORIGINAL_TEST_FAMILIES) {
    const family = globSync(pattern, { cwd: root })
    if (family.length === 0) throw new Error('Missing required test family: ' + pattern)
    found.push(...family)
  }
  const original = checkedPaths(found, 'original')
  for (const path of requiredScriptTests) {
    if (!original.includes(path)) throw new Error('Missing required Script test: ' + path)
  }
  for (const path of original) requireRegularFile(root, path)
  return original
}

export function partitionRequiredTests(originalFiles, hostedFiles = HOSTED_PG17_FILES) {
  const original = checkedPaths(originalFiles, 'original')
  const hostedPg17 = checkedPaths(hostedFiles, 'hosted')
  const universe = new Set(original)
  for (const path of hostedPg17) {
    if (!universe.has(path)) throw new Error('Missing hosted test in the original universe: ' + path)
  }
  if (hostedPg17.length !== HOSTED_PG17_FILES.length
    || hostedPg17.some((path, index) => path !== HOSTED_PG17_FILES[index])) {
    throw new Error('Hosted test membership requires an explicit reviewed amendment')
  }
  const hosted = new Set(hostedPg17)
  const originalCore = original.filter((path) => !hosted.has(path))
  const combined = [...originalCore, ...hostedPg17]
  if (new Set(combined).size !== original.length || combined.length !== original.length
    || original.some((path) => !combined.includes(path))
    || originalCore.some((path) => hosted.has(path)) || universe.has(SELECTOR_CONTRACT)) {
    throw new Error('Required test partition has omissions or overlaps')
  }
  const core = [...originalCore, SELECTOR_CONTRACT].sort()
  return { original, core, hostedPg17 }
}

export function selectedMode(args) {
  if (!Array.isArray(args) || args.length !== 1 || !['core', 'hosted-pg17'].includes(args[0])) {
    throw new Error('Expected exactly one mode: core or hosted-pg17')
  }
  return args[0]
}

export function nodeTestArguments(mode, partition) {
  selectedMode([mode])
  const prefix = ['--import', './scripts/server-only-test-register.mjs', '--import', 'tsx', '--test']
  return mode === 'core'
    ? [...prefix, ...partition.core]
    : [...prefix, '--test-concurrency=1', ...partition.hostedPg17]
}

export function childExitStatus(result) {
  if (result.error || result.signal || !Number.isInteger(result.status) || result.status < 0 || result.status > 255) return 1
  return result.status
}

// Importing this module from its mandatory contract never starts another runner.
// Both PostgreSQL-bound groups require separate environments; no selector override.
if (process.argv[1] && resolve(process.argv[1]) === fileURLToPath(import.meta.url)) {
  try {
    const mode = selectedMode(process.argv.slice(2))
    const partition = partitionRequiredTests(discoverOriginalTestFiles())
    requireRegularFile(repositoryRoot, SELECTOR_CONTRACT)
    const result = spawnSync(process.execPath, nodeTestArguments(mode, partition), {
      cwd: repositoryRoot,
      stdio: 'inherit',
      shell: false,
    })
    process.exitCode = childExitStatus(result)
    if (result.error || result.signal || result.status === null) {
      console.error('Required test runner failed to complete normally')
    }
  } catch (error) {
    console.error(error instanceof Error ? error.message : 'Required test selection failed')
    process.exitCode = 1
  }
}
