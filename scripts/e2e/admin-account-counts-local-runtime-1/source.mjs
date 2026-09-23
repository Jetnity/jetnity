#!/usr/bin/env node
// Verified tracked execution inputs from the accepted product baseline.
// Working-tree walks, symlink follows and inherited dotenv files are refused.
// Migration inventory is pinned to immutable baseline identities and copied bytes.

import { createHash } from 'node:crypto'
import { execFileSync } from 'node:child_process'
import {
  existsSync,
  lstatSync,
  mkdirSync,
  readdirSync,
  rmSync,
  writeFileSync,
} from 'node:fs'
import { dirname, join, relative, resolve, sep } from 'node:path'
import {
  assertPinnedSources,
  leseSourceManifest,
  refuseBootstrapOverlay,
  sha256Datei,
  workingTreeBlob,
  committedBlob,
} from '../admin-account-counts-browser-acceptance-1/source-manifest.mjs'
import { SOURCE_PATHS } from '../admin-account-counts-browser-acceptance-1/constants.mjs'
import {
  EXTRA_BLOB_PINS,
  EXTRA_SOURCE_PATHS,
  HISTORICAL_REFUSED_PRODUCER_SHA256,
  PINS,
  PRODUCT_BASELINE,
  ROOT,
} from './constants.mjs'
import { isDotenvName } from './env.mjs'

export function leseMigrationsFuerReplay({
  root = ROOT,
  rev = PRODUCT_BASELINE,
  execFile = execFileSync,
} = {}) {
  const dir = join(root, 'supabase/migrations')
  if (!existsSync(dir)) {
    throw new Error('Migration directory absent. Replay cannot start.')
  }
  const names = readdirSync(dir).filter((name) => name.endsWith('.sql')).sort()
  if (!names.length) throw new Error('Migration inventory is empty.')
  return {
    replay: 'IMPLEMENTED',
    baselineRev: rev,
    files: names.map((name) => {
      const path = `supabase/migrations/${name}`
      const working = workingTreeBlob(path, root)
      let baseline = null
      try {
        baseline = committedBlob(path, rev, root)
      } catch (error) {
        throw new Error(`Migration ${path} is not present on immutable baseline ${rev}: ${error instanceof Error ? error.message : String(error)}`)
      }
      if (working !== baseline) {
        throw new Error(`Migration ${path} working-tree ${working} != baseline ${rev} ${baseline}`)
      }
      return {
        path,
        workingTreeBlob: working,
        baselineBlob: baseline,
        bytesSha256: sha256Datei(path, root),
      }
    }),
    note: 'Committed migration history is replayed into the run-owned local catalog only.',
    execFileUsed: Boolean(execFile),
  }
}

export function classifyMigrationApplicability({ file, appliedVersions = [], baselineBlob, copiedBlob }) {
  const version = file.path.split('/').pop().replace(/\.sql$/, '').split('_')[0]
  if (baselineBlob && copiedBlob && baselineBlob !== copiedBlob) {
    throw new Error(`Copied migration bytes != baseline for ${file.path}`)
  }
  const exact = appliedVersions.includes(version)
  const prefixOnly = !exact && appliedVersions.some((row) => row.startsWith(version) || version.startsWith(row))
  if (prefixOnly) {
    throw new Error(`Refuse prefix-only migration skip for ${file.path}; exact version ${version} not in applied inventory`)
  }
  return {
    version,
    apply: !exact,
    reason: exact ? 'exact-version-already-applied' : 'not-applied',
  }
}

export function leseExtraSources({ root = ROOT, rev = 'HEAD' } = {}) {
  const files = {}
  for (const [key, relPath] of Object.entries(EXTRA_SOURCE_PATHS)) {
    const working = workingTreeBlob(relPath, root)
    let committed = null
    let dirtyWorktree = false
    try {
      committed = committedBlob(relPath, rev, root)
      dirtyWorktree = committed !== working
    } catch {
      committed = null
      dirtyWorktree = true
    }
    files[key] = { path: relPath, workingTreeBlob: working, committedBlob: committed, dirtyWorktree }
  }
  return files
}

export function assertExtraSources(files) {
  const errors = []
  for (const [key, expected] of Object.entries(EXTRA_BLOB_PINS)) {
    const actual = files[key]?.workingTreeBlob
    if (actual !== expected) errors.push(`${key} working-tree blob ${actual || 'missing'} != ${expected}`)
    if (files[key]?.dirtyWorktree === true) {
      errors.push(`${key} working tree differs from committed ${files[key].committedBlob}`)
    }
  }
  if (errors.length) throw new Error(`Extra source pin mismatch:\n${errors.join('\n')}`)
  return true
}

export function leseRuntimeSourceManifest({ root = ROOT, rev = 'HEAD' } = {}) {
  const accepted = leseSourceManifest({ root, rev, compareCommitted: root === ROOT })
  const extra = leseExtraSources({ root, rev })
  const migrations = leseMigrationsFuerReplay({ root, rev: PRODUCT_BASELINE })
  return {
    ...accepted,
    extra,
    migrations,
    productBaseline: PRODUCT_BASELINE,
  }
}

export function assertRuntimeSources(manifest) {
  const forAccepted = {
    ...manifest,
    migrations: { ...manifest.migrations, replay: 'NOT IMPLEMENTED' },
  }
  assertPinnedSources(forAccepted)
  assertExtraSources(manifest.extra)
  if (manifest.files.producer?.sha256 === HISTORICAL_REFUSED_PRODUCER_SHA256) {
    throw new Error('Refusing the historical permissive producer.')
  }
  if (manifest.files.producer?.sha256 !== PINS.producerSha256) {
    throw new Error(`producer sha256 ${manifest.files.producer?.sha256} != ${PINS.producerSha256}`)
  }
  if (manifest.files.wrapper?.sha256 !== PINS.wrapperSha256) {
    throw new Error(`wrapper sha256 ${manifest.files.wrapper?.sha256} != ${PINS.wrapperSha256}`)
  }
  if (!manifest.migrations?.files?.length) {
    throw new Error('Migration inventory missing; refuse to calculate pins from an incomplete target.')
  }
  for (const file of manifest.migrations.files) {
    if (!file.baselineBlob || file.workingTreeBlob !== file.baselineBlob) {
      throw new Error(`Migration ${file.path} is not pinned to immutable baseline identity.`)
    }
  }
  return true
}

export function assertCleanProductHead({ root = ROOT, expectedHead = PRODUCT_BASELINE } = {}) {
  const head = execFileSync('git', ['rev-parse', 'HEAD'], { cwd: root, encoding: 'utf8' }).trim()
  const mergeBase = execFileSync('git', ['merge-base', 'HEAD', expectedHead], {
    cwd: root,
    encoding: 'utf8',
  }).trim()
  if (mergeBase !== expectedHead) {
    throw new Error(`Product baseline ${expectedHead} is not an ancestor of HEAD ${head}.`)
  }
  const dirty = execFileSync('git', ['status', '--porcelain', '--',
    ...Object.values(SOURCE_PATHS),
    ...Object.values(EXTRA_SOURCE_PATHS),
    'supabase/migrations',
  ], { cwd: root, encoding: 'utf8' }).trim()
  if (dirty) {
    throw new Error(`Refuse to recapture identity from a dirty product target:\n${dirty}`)
  }
  return { head, mergeBase, expectedHead }
}

function containedIn(candidate, root) {
  const rel = relative(root, candidate)
  return rel === '' || (!rel.startsWith(`..${sep}`) && rel !== '..' && !rel.startsWith('..') && !rel.startsWith(sep))
}

export function refuseSymlinksAndDotenv(destDir) {
  const stack = [destDir]
  const dotenv = []
  const symlinks = []
  while (stack.length) {
    const dir = stack.pop()
    for (const name of readdirSync(dir)) {
      const full = join(dir, name)
      if (isDotenvName(name)) dotenv.push(full)
      const stat = lstatSync(full)
      if (stat.isSymbolicLink()) symlinks.push(full)
      else if (stat.isDirectory() && name !== '.git') stack.push(full)
    }
  }
  if (dotenv.length) {
    throw new Error(`Inherited .env file is forbidden in the dedicated checkout: ${dotenv.join(', ')}`)
  }
  if (symlinks.length) {
    throw new Error(`Symlink escape refused in dedicated checkout: ${symlinks.join(', ')}`)
  }
  return true
}

export function pinCopiedMigrationBytes({ destDir, files, execFile = execFileSync }) {
  const pinned = []
  for (const file of files || []) {
    const dest = join(destDir, file.path)
    if (!existsSync(dest)) {
      throw new Error(`Copied migration missing: ${file.path}`)
    }
    const copiedBlob = execFile('git', ['hash-object', dest], { encoding: 'utf8' }).trim()
    if (file.baselineBlob && copiedBlob !== file.baselineBlob) {
      throw new Error(`Copied migration ${file.path} blob ${copiedBlob} != baseline ${file.baselineBlob}`)
    }
    pinned.push({ path: file.path, copiedBlob, baselineBlob: file.baselineBlob })
  }
  return pinned
}

export function materialisiereAppCheckout({
  sourceRoot = ROOT,
  destDir,
  rev = PRODUCT_BASELINE,
  extraSkip = [],
  execFile = execFileSync,
  migrations,
} = {}) {
  if (!destDir) throw new Error('Dedicated checkout requires a destination.')
  mkdirSync(destDir, { recursive: true, mode: 0o700 })
  const archive = execFile('git', ['archive', '--format=tar', rev], {
    cwd: sourceRoot,
    encoding: 'buffer',
    maxBuffer: 80 * 1024 * 1024,
  })
  execFile('tar', ['-x', '--no-same-owner', '--no-overwrite-dir', '-C', destDir], {
    input: archive,
    encoding: 'buffer',
    maxBuffer: 80 * 1024 * 1024,
  })
  void extraSkip
  if (existsSync(join(destDir, '.next'))) {
    rmSync(join(destDir, '.next'), { recursive: true, force: true })
  }
  if (existsSync(join(destDir, 'node_modules'))) {
    rmSync(join(destDir, 'node_modules'), { recursive: true, force: true })
  }
  refuseSymlinksAndDotenv(destDir)
  const inventory = migrations || leseMigrationsFuerReplay({ root: sourceRoot, rev, execFile })
  const copiedMigrations = pinCopiedMigrationBytes({ destDir, files: inventory.files, execFile })
  return {
    destDir,
    inheritedEnv: false,
    reusedNextOutput: false,
    nodeModulesLinked: false,
    baselineRev: rev,
    copiedMigrations,
  }
}

export function writeTrackedFile({ destDir, relPath, bytes }) {
  const dest = resolve(destDir, relPath)
  if (!containedIn(dest, resolve(destDir))) {
    throw new Error(`Refusing path traversal while materializing ${relPath}`)
  }
  mkdirSync(dirname(dest), { recursive: true, mode: 0o700 })
  writeFileSync(dest, bytes, { mode: 0o600 })
  return dest
}

export function sha256Bytes(bytes) {
  return createHash('sha256').update(bytes).digest('hex')
}

export { refuseBootstrapOverlay, sha256Datei, SOURCE_PATHS }
