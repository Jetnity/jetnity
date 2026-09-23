#!/usr/bin/env node
// Working-tree product identity plus a dedicated checkout for execution.
// Reuses #556 pin assertion for the accepted Auth/shared/client/UI/SQL set.
// This lane additionally pins package/lock/proxy/next config and inventories
// migrations for actual replay. Dirty worktrees are refused.

import { execFileSync } from 'node:child_process'
import { existsSync, mkdirSync, readdirSync, rmSync, statSync } from 'node:fs'
import { join } from 'node:path'
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

export function leseMigrationsFuerReplay({ root = ROOT } = {}) {
  const dir = join(root, 'supabase/migrations')
  if (!existsSync(dir)) {
    throw new Error('Migration directory absent. Replay cannot start.')
  }
  const names = readdirSync(dir).filter((name) => name.endsWith('.sql')).sort()
  if (!names.length) throw new Error('Migration inventory is empty.')
  return {
    replay: 'IMPLEMENTED',
    files: names.map((name) => ({
      path: `supabase/migrations/${name}`,
      workingTreeBlob: workingTreeBlob(`supabase/migrations/${name}`, root),
    })),
    note: 'Committed migration history is replayed into the run-owned local catalog only.',
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
  const migrations = leseMigrationsFuerReplay({ root })
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

const SKIP_COPY = new Set(['.git', 'node_modules', '.next', '.env', '.env.local', '.env.development', '.env.production'])

export function materialisiereAppCheckout({ sourceRoot = ROOT, destDir, extraSkip = [] } = {}) {
  if (!destDir) throw new Error('Dedicated checkout requires a destination.')
  mkdirSync(destDir, { recursive: true, mode: 0o700 })
  const skip = new Set([...SKIP_COPY, ...extraSkip])
  copyTree(sourceRoot, destDir, skip)
  const forbiddenEnv = ['.env', '.env.local', '.env.development', '.env.production'].map((name) => join(destDir, name))
  for (const path of forbiddenEnv) {
    if (existsSync(path)) {
      rmSync(path, { force: true })
    }
  }
  if (existsSync(join(destDir, '.next'))) {
    rmSync(join(destDir, '.next'), { recursive: true, force: true })
  }
  return {
    destDir,
    inheritedEnv: false,
    reusedNextOutput: false,
    nodeModulesLinked: existsSync(join(destDir, 'node_modules')),
  }
}

function copyTree(from, to, skip) {
  mkdirSync(to, { recursive: true, mode: 0o700 })
  for (const name of readdirSync(from)) {
    if (skip.has(name)) continue
    const src = join(from, name)
    const dest = join(to, name)
    const stat = statSync(src)
    if (stat.isDirectory()) copyTree(src, dest, skip)
    else {
      execFileSync('cp', ['-p', src, dest])
    }
  }
}

export { refuseBootstrapOverlay, sha256Datei, SOURCE_PATHS }
