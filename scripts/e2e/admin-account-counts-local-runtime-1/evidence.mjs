#!/usr/bin/env node
// Whitelisted evidence serialization. Secrets and historical receipts are
// refused. This lane never rewrites older receipts.
// Consumer artifact names are the TL-confirmed §4 contract from review
// 5294684706: ${runId}-counts-desktop.png, ${runId}-counts-mobile.png,
// ${runId}-browser-flows-gates.json. No broad any-aaclr1 exception.

import { copyFileSync, existsSync, lstatSync, mkdirSync, readdirSync, readFileSync, writeFileSync } from 'node:fs'
import { join, resolve } from 'node:path'
import { HISTORICAL_EVIDENCE_BASENAMES } from './constants.mjs'
import { assertOwnedPath } from './cleanup.mjs'

const SECRET_KEY = /^(password|secret|token|authorization|cookie|otpauth|jwt|serviceRole|service_role|serviceRoleKey|apikey|anonKey|anon_key)$/i
const SECRET_VALUE = /^(Bearer\s+\S+|eyJ[A-Za-z0-9_-]{20,}\.[A-Za-z0-9_-]+\.|sk-|sbp_)/

export function redactSecrets(value) {
  if (typeof value === 'string') {
    if (SECRET_VALUE.test(value)) return '[redacted]'
    return value
  }
  if (Array.isArray(value)) return value.map((item) => redactSecrets(item))
  if (value && typeof value === 'object') {
    const next = {}
    for (const [key, item] of Object.entries(value)) {
      next[key] = SECRET_KEY.test(key) ? '[redacted]' : redactSecrets(item)
    }
    return next
  }
  return value
}

export function assertSafeEvidence(value, path = 'root') {
  if (typeof value === 'string' && SECRET_VALUE.test(value) && value !== '[redacted]') {
    throw new Error(`Evidence field ${path} must not contain secrets`)
  }
  if (value && typeof value === 'object') {
    for (const [key, item] of Object.entries(value)) {
      if (SECRET_KEY.test(key) && item && item !== '[redacted]') {
        throw new Error(`Evidence field ${path}.${key} must not contain secrets`)
      }
      assertSafeEvidence(item, `${path}.${key}`)
    }
  }
  return true
}

export const CONSUMER_ARTIFACT_SPECS = Object.freeze([
  Object.freeze({ kind: 'counts-desktop', suffix: '-counts-desktop.png', type: 'png' }),
  Object.freeze({ kind: 'counts-mobile', suffix: '-counts-mobile.png', type: 'png' }),
  Object.freeze({ kind: 'browser-flows-gates', suffix: '-browser-flows-gates.json', type: 'json' }),
])

export const FORBIDDEN_EXPORT_BASENAME = /(?:^|[-_.])(?:profile|session|qr|har|trace|cookie|token|password|otpauth)(?:[-_.]|$)/i

export function createRunIdentity({ runId, projectId = null } = {}) {
  if (!runId) throw new Error('run identity requires runId')
  const aliases = [runId]
  if (projectId && projectId !== runId) aliases.push(projectId)
  return Object.freeze({
    runId,
    projectId: projectId || runId,
    aliases: Object.freeze(aliases),
  })
}

export function consumerArtifactNames(runId) {
  return CONSUMER_ARTIFACT_SPECS.map((spec) => `${runId}${spec.suffix}`)
}

export function expectedConsumerArtifacts({
  mode = 'preflight',
  consumerCompleted = false,
  consumerAttempted = false,
  runId,
} = {}) {
  if (!runId) return []
  if (mode === 'full' && (consumerCompleted === true || consumerAttempted === true)) {
    return consumerArtifactNames(runId)
  }
  return []
}

export function belongsToCurrentRun(name, identity) {
  const aliases = identity?.aliases || (identity?.runId ? [identity.runId] : [])
  return aliases.some((id) => typeof id === 'string' && id.length > 0 && name.startsWith(`${id}-`))
}

export function matchConsumerArtifact(name, identity) {
  const aliases = identity?.aliases || (identity?.runId ? [identity.runId] : [])
  for (const spec of CONSUMER_ARTIFACT_SPECS) {
    for (const id of aliases) {
      if (name === `${id}${spec.suffix}`) return spec
    }
  }
  return null
}

export function assertConsumerGatesJson(value, path = 'browser-flows-gates.json') {
  if (!value || typeof value !== 'object' || Array.isArray(value)) {
    throw new Error(`${path} must be a JSON object`)
  }
  assertSafeEvidence(value, path)
  return true
}

function classifyExportableName(name, identity) {
  if (FORBIDDEN_EXPORT_BASENAME.test(name) || HISTORICAL_EVIDENCE_BASENAMES.includes(name) || name === 'README.md') {
    return { ok: false, reason: 'forbidden-or-historical' }
  }
  if (identity?.runId && !belongsToCurrentRun(name, identity)) {
    return { ok: false, reason: 'wrong-run' }
  }
  if (!matchConsumerArtifact(name, identity)) {
    return { ok: false, reason: 'not-whitelisted' }
  }
  return { ok: true }
}

export function exportSanitizedRunArtifacts({
  sourceDir,
  destDir,
  runId,
  runIdentity,
  ownedRoots = [],
  expectedArtifacts,
  mode = 'preflight',
  consumerCompleted = false,
  consumerAttempted = false,
} = {}) {
  if (!destDir) throw new Error('Durable evidence directory is required for artifact export')
  const identity = runIdentity || (runId ? createRunIdentity({ runId }) : null)
  const expected = expectedArtifacts
    || expectedConsumerArtifacts({
      mode,
      consumerCompleted,
      consumerAttempted,
      runId: identity?.runId,
    })
  if (!sourceDir || !existsSync(sourceDir)) {
    if (expected.length) {
      return {
        ok: false,
        exported: [],
        skipped: [],
        missing: expected,
        error: 'required consumer artifacts are missing because the private evidence directory is absent',
      }
    }
    return { ok: true, exported: [], skipped: [], missing: [], note: 'no private evidence to export' }
  }
  if (lstatSync(sourceDir).isSymbolicLink()) {
    throw new Error('Private evidence directory must not be a symlink')
  }
  if (ownedRoots.length && assertOwnedPath(sourceDir, ownedRoots) !== true) {
    throw new Error('Private evidence directory is outside owned roots')
  }
  mkdirSync(destDir, { recursive: true, mode: 0o755 })
  const exported = []
  const skipped = []
  for (const name of readdirSync(sourceDir)) {
    const source = join(sourceDir, name)
    const stat = lstatSync(source)
    if (stat.isSymbolicLink()) {
      throw new Error(`Refusing to export symlink ${name}`)
    }
    if (stat.isDirectory()) {
      skipped.push({ name, reason: 'directory-not-exported' })
      continue
    }
    const classified = classifyExportableName(name, identity)
    if (!classified.ok) {
      skipped.push({ name, reason: classified.reason })
      continue
    }
    const dest = join(destDir, name)
    if (existsSync(dest)) {
      throw new Error(`Refusing to overwrite existing durable evidence ${name}`)
    }
    if (name.endsWith('.json')) {
      const parsed = JSON.parse(readFileSync(source, 'utf8'))
      if (name.endsWith('-browser-flows-gates.json')) {
        assertConsumerGatesJson(parsed, name)
      } else {
        assertSafeEvidence(parsed, name)
      }
    }
    copyFileSync(source, dest)
    if (lstatSync(dest).isSymbolicLink()) {
      throw new Error(`Export produced a symlink ${name}`)
    }
    exported.push({ name, bytes: stat.size, dest: resolve(dest) })
  }
  const exportedNames = new Set(exported.map((item) => item.name))
  const exportedKinds = new Set(
    exported
      .map((item) => matchConsumerArtifact(item.name, identity)?.kind)
      .filter(Boolean),
  )
  const missing = expected.filter((name) => {
    if (exportedNames.has(name)) return false
    const spec = CONSUMER_ARTIFACT_SPECS.find((item) => name.endsWith(item.suffix))
    return !spec || !exportedKinds.has(spec.kind)
  })
  const skippedRequired = skipped.filter((item) => expected.includes(item.name))
  if (missing.length || skippedRequired.length) {
    return {
      ok: false,
      exported,
      skipped,
      missing,
      error: `required consumer artifacts missing or skipped: ${(missing.length ? missing : skippedRequired.map((item) => item.name)).join(', ')}`,
    }
  }
  return { ok: true, exported, skipped, missing: [] }
}

export function writeEvidence(evidenceDir, name, value) {
  if (HISTORICAL_EVIDENCE_BASENAMES.includes(name) || name === 'README.md') {
    throw new Error(`Refusing to overwrite historical evidence basename ${name}`)
  }
  if (/preflight\.json$|source-manifest\.json$|run-receipt\.json$/.test(name) && !name.includes('aaclr1-')) {
    throw new Error(`Refusing to overwrite historical evidence basename ${name}`)
  }
  const safe = redactSecrets(value)
  assertSafeEvidence(safe)
  mkdirSync(evidenceDir, { recursive: true })
  writeFileSync(join(evidenceDir, name), `${JSON.stringify(safe, null, 2)}\n`, { mode: 0o644 })
  return join(evidenceDir, name)
}
