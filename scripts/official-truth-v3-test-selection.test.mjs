import assert from 'node:assert/strict'
import { mkdirSync, mkdtempSync, readFileSync, rmSync, writeFileSync } from 'node:fs'
import { tmpdir } from 'node:os'
import { dirname, join } from 'node:path'
import { test } from 'node:test'
import {
  childExitStatus,
  discoverOriginalTestFiles,
  HOSTED_PG17_FILES,
  nodeTestArguments,
  ORIGINAL_TEST_FAMILIES,
  partitionRequiredTests,
  selectedMode,
  SELECTOR_CONTRACT,
} from './official-truth-v3-test-selection.mjs'

const hosted = 'lib/readiness/official-truth-v3-hosted-method-authority-1.test.ts'
const contract = 'scripts/official-truth-v3-test-selection.test.mjs'
const scriptTests = [
  'scripts/dev-reference-local-pg-prep-1/ablauf.test.ts',
  'scripts/dev-reference-local-pg-prep-1/nativ.test.ts',
  'scripts/dev-reference-local-pg-prep-1/sql.test.ts',
  'scripts/dev-reference-local-pg-prep-1/ziel.test.ts',
  'scripts/operating-mode-guard.test.mjs',
]
const oldPg16AndPg1Tests = [
  'lib/readiness/official-truth-ch-de-first-visa-vertical-1/workspace-refusal.test.ts',
  'lib/readiness/official-truth-current-version-lookup-1.test.ts',
  'lib/readiness/official-truth-original-custody.test.ts',
  'lib/readiness/official-truth-v3-private-owner-guards-1.test.ts',
]

test('the actual original universe is partitioned once and its selector contract is mandatory', () => {
  assert.deepEqual(ORIGINAL_TEST_FAMILIES, [
    'lib/**/*.test.ts',
    'scripts/operating-mode-guard.test.mjs',
    'scripts/dev-reference-local-pg-prep-1/*.test.ts',
  ])
  assert.deepEqual(HOSTED_PG17_FILES, [hosted])
  assert.equal(SELECTOR_CONTRACT, contract)
  const original = discoverOriginalTestFiles()
  const partition = partitionRequiredTests(original)
  assert.deepEqual(partition.original, [...original].sort())
  assert.deepEqual(partition.hostedPg17, [hosted])
  assert.equal(partition.core.filter((path) => path === contract).length, 1)
  assert.equal(partition.hostedPg17.includes(contract), false)
  const combined = [...partition.core.filter((path) => path !== contract), ...partition.hostedPg17]
  assert.deepEqual([...combined].sort(), [...original].sort())
  assert.equal(new Set(combined).size, original.length)
  assert.equal(partition.core.some((path) => partition.hostedPg17.includes(path)), false)
  for (const path of [...scriptTests, ...oldPg16AndPg1Tests]) {
    assert.equal(partition.core.filter((candidate) => candidate === path).length, 1, path)
    assert.equal(partition.hostedPg17.includes(path), false, path)
  }
  assert.equal(partition.core.includes(hosted), false)
})

test('discovery includes every family and new nested tests without a frozen original-file count', () => {
  const root = mkdtempSync(join(tmpdir(), 'jetnity-v3-test-selection-'))
  const create = (path) => {
    const file = join(root, path)
    mkdirSync(dirname(file), { recursive: true })
    writeFileSync(file, '// inert discovery fixture; never imported\n')
  }
  try {
    const expected = [...scriptTests, hosted, 'lib/top.test.ts', 'lib/new/nested.test.ts'].sort()
    for (const path of expected) create(path)
    create('lib/new/not-a-test.ts')
    create('scripts/outside-the-three-families.test.ts')
    assert.deepEqual(discoverOriginalTestFiles(root), expected)
    const added = 'lib/future/unrelated.test.ts'
    create(added)
    assert.deepEqual(discoverOriginalTestFiles(root), [...expected, added].sort())
    const split = partitionRequiredTests(discoverOriginalTestFiles(root))
    assert.ok(split.core.includes(added))
    assert.deepEqual(split.hostedPg17, [hosted])
    rmSync(join(root, scriptTests[0]))
    assert.throws(() => discoverOriginalTestFiles(root), /Missing required Script test/)
  } finally {
    rmSync(root, { recursive: true, force: true })
  }
})

test('missing, duplicate, invalid and unauthorized hosted membership cannot remove a required proof', () => {
  const original = [hosted, 'lib/ordinary.test.ts']
  assert.throws(() => partitionRequiredTests(['lib/ordinary.test.ts']), /Missing hosted test/)
  assert.throws(() => partitionRequiredTests([...original, hosted]), /Duplicate original/)
  assert.throws(() => partitionRequiredTests(original, [hosted, hosted]), /Duplicate hosted/)
  assert.throws(() => partitionRequiredTests(original, []), /hosted must not be empty/)
  assert.throws(() => partitionRequiredTests(original, ['lib/missing.test.ts']), /Missing hosted test/)
  assert.throws(() => partitionRequiredTests(original, [hosted, 'lib/ordinary.test.ts']), /explicit reviewed amendment/)
  assert.throws(() => partitionRequiredTests([]), /original must not be empty/)
  for (const invalid of ['', '../lib/out.test.ts', '/lib/out.test.ts', 'lib//out.test.ts',
    'lib/./out.test.ts', 'lib/../out.test.ts', 'lib\\out.test.ts', 'lib/\u0000out.test.ts',
    'scripts/outside.test.ts', null]) {
    assert.throws(() => partitionRequiredTests([...original, invalid]), /Invalid required test path|outside the original test families/)
  }
})

test('only the two explicit modes are accepted and extra arguments are refused', () => {
  assert.equal(selectedMode(['core']), 'core')
  assert.equal(selectedMode(['hosted-pg17']), 'hosted-pg17')
  for (const args of [[], ['unknown'], ['core', 'extra'], ['hosted-pg17', '--skip'], [''], null]) {
    assert.throws(() => selectedMode(args), /Expected exactly one mode/)
  }
})

test('Node arguments retain imports and Core concurrency while the hosted family is explicit', () => {
  const split = partitionRequiredTests([hosted, 'lib/ordinary.test.ts'])
  const prefix = ['--import', './scripts/server-only-test-register.mjs', '--import', 'tsx', '--test']
  assert.deepEqual(nodeTestArguments('core', split), [...prefix, ...split.core])
  assert.deepEqual(nodeTestArguments('hosted-pg17', split), [...prefix, '--test-concurrency=1', hosted])
  assert.throws(() => nodeTestArguments('unknown', split), /Expected exactly one mode/)
})

test('signals, spawn errors and missing exit status cannot become a successful required gate', () => {
  assert.equal(childExitStatus({ status: 0, signal: null }), 0)
  assert.equal(childExitStatus({ status: 7, signal: null }), 7)
  for (const result of [
    { status: 0, signal: 'SIGTERM' },
    { status: 0, signal: null, error: new Error('synthetic spawn failure') },
    { status: null, signal: null },
    { status: undefined, signal: null },
    { status: -1, signal: null },
    { status: 256, signal: null },
  ]) assert.notEqual(childExitStatus(result), 0)
})

test('package commands reach both mandatory families and retain every prior aggregate command', () => {
  const pkg = JSON.parse(readFileSync(new URL('../package.json', import.meta.url), 'utf8'))
  assert.equal(pkg.scripts['test:core'], 'node scripts/official-truth-v3-test-selection.mjs core')
  assert.equal(pkg.scripts['test:hosted-v3-native'], 'node scripts/official-truth-v3-test-selection.mjs hosted-pg17')
  assert.deepEqual(pkg.scripts.test.split(' && '), [
    'npm run test:core',
    'npm run test:accepted-store-native',
    'npm run test:persisted-native',
    'npm run test:refresh-native',
    'npm run test:hosted-v3-native',
  ])
  const split = partitionRequiredTests(discoverOriginalTestFiles())
  assert.equal(nodeTestArguments('core', split).filter((path) => path === contract).length, 1)
  assert.equal(nodeTestArguments('hosted-pg17', split).filter((path) => path === hosted).length, 1)
})
