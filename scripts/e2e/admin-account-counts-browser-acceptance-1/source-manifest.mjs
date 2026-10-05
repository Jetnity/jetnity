#!/usr/bin/env node
// Pin accepted product sources on actual working-tree bytes.
// Refuse the reduced #550 auth.users bootstrap as a GoTrue overlay.
// Historical committed HEAD:path names are recorded separately and are not
// the execution identity. Migration replay stays NOT IMPLEMENTED.

import { createHash } from 'node:crypto'
import { execFileSync } from 'node:child_process'
import { existsSync, readdirSync, readFileSync } from 'node:fs'
import { join } from 'node:path'
import { BLOB_PINS, PINS, ROOT, SOURCE_PATHS } from './constants.mjs'
import { IMPLEMENTATION } from './implementation.mjs'

export function sha256Datei(relPath, root = ROOT) {
  return createHash('sha256').update(readFileSync(join(root, relPath))).digest('hex')
}

export function workingTreeBlob(relPath, root = ROOT) {
  return execFileSync('git', ['hash-object', join(root, relPath)], {
    cwd: root,
    encoding: 'utf8',
  }).trim()
}

export function committedBlob(relPath, rev = 'HEAD', root = ROOT) {
  return execFileSync('git', ['rev-parse', `${rev}:${relPath}`], {
    cwd: root,
    encoding: 'utf8',
  }).trim()
}

export function leseMigrationsInventar({ root = ROOT } = {}) {
  const dir = join(root, 'supabase/migrations')
  if (!existsSync(dir)) {
    return {
      replay: IMPLEMENTATION.migrationReplay,
      files: [],
      note: 'Migration directory absent. Replay remains NOT IMPLEMENTED.',
    }
  }
  const names = readdirSync(dir).filter((name) => name.endsWith('.sql')).sort()
  return {
    replay: IMPLEMENTATION.migrationReplay,
    files: names.map((name) => ({
      path: `supabase/migrations/${name}`,
      workingTreeBlob: workingTreeBlob(`supabase/migrations/${name}`, root),
    })),
    note: 'Inventory only. This command does not apply or replay migrations.',
  }
}

export function leseSourceManifest({ root = ROOT, rev = 'HEAD', compareCommitted = root === ROOT } = {}) {
  const files = {}
  for (const [key, relPath] of Object.entries(SOURCE_PATHS)) {
    const working = workingTreeBlob(relPath, root)
    let committed = null
    let dirtyWorktree = false
    if (compareCommitted) {
      try {
        committed = committedBlob(relPath, rev, root)
        dirtyWorktree = committed !== working
      } catch {
        committed = null
        dirtyWorktree = true
      }
    }
    files[key] = {
      path: relPath,
      workingTreeBlob: working,
      committedBlob: committed,
      dirtyWorktree,
      ...(key === 'producer' || key === 'wrapper' || key === 'bootstrap'
        ? { sha256: sha256Datei(relPath, root) }
        : {}),
      ...(key === 'bootstrap'
        ? { note: 'Identified only so this harness can refuse overlaying it on GoTrue.' }
        : {}),
    }
  }
  return {
    rev,
    identityKind: 'working-tree-git-hash-object',
    historicalCommittedRev: compareCommitted ? rev : null,
    files,
    migrations: leseMigrationsInventar({ root }),
  }
}

export function assertPinnedSources(manifest) {
  const { files } = manifest
  const fehlers = []
  if (!files) throw new Error('Source pin mismatch:\nmissing files object')

  for (const [key, expected] of Object.entries(BLOB_PINS)) {
    const actual = files[key]?.workingTreeBlob
    if (actual !== expected) {
      fehlers.push(`${key} working-tree blob ${actual || 'missing'} != ${expected}`)
    }
  }
  if (files.producer?.sha256 && files.producer.sha256 !== PINS.producerSha256) {
    fehlers.push(`producer sha256 ${files.producer.sha256} != ${PINS.producerSha256}`)
  }
  if (files.wrapper?.sha256 && files.wrapper.sha256 !== PINS.wrapperSha256) {
    fehlers.push(`wrapper sha256 ${files.wrapper.sha256} != ${PINS.wrapperSha256}`)
  }
  if (files.bootstrap?.sha256 && files.bootstrap.sha256 !== PINS.bootstrapSha256) {
    fehlers.push(`bootstrap identity drifted; refuse to treat an unknown file as the #550 fixture`)
  }
  for (const [key, file] of Object.entries(files)) {
    if (file.dirtyWorktree === true) {
      fehlers.push(`${key} working tree differs from committed ${file.committedBlob}; refuse to recapture identity from a dirty target`)
    }
  }
  if (manifest.migrations?.replay && manifest.migrations.replay !== 'NOT IMPLEMENTED') {
    fehlers.push(`migration replay must remain NOT IMPLEMENTED, got ${manifest.migrations.replay}`)
  }
  if (fehlers.length) {
    throw new Error(`Source pin mismatch:\n${fehlers.join('\n')}`)
  }
  return true
}

export function refuseBootstrapOverlay({ plannedSqlPaths = [], target = 'gotrue' } = {}) {
  const bootstrap = SOURCE_PATHS.bootstrap
  const hits = plannedSqlPaths.filter((path) => String(path).endsWith(bootstrap) || String(path).includes(bootstrap))
  if (hits.length && target === 'gotrue') {
    throw new Error(
      `Refusing to overlay ${bootstrap} onto a real GoTrue auth.users catalog. That file is a reduced synthetic SQL fixture from #550, not a full Supabase initialization script.`,
    )
  }
  return { ok: true, refused: hits, target }
}
