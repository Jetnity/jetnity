#!/usr/bin/env node
// Whitelisted evidence serialization. Secrets and historical receipts are
// refused. This lane never rewrites older receipts.

import { copyFileSync, existsSync, lstatSync, mkdirSync, readdirSync, readFileSync, writeFileSync } from 'node:fs'
import { basename, join, resolve } from 'node:path'
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

export const EXPORTABLE_BASENAME = /^(?:aaclr1-[A-Za-z0-9._-]+-(?:consumer-receipt|screenshot-[A-Za-z0-9._-]+|clip-[A-Za-z0-9._-]+)\.(?:json|png|webp))$/
export const FORBIDDEN_EXPORT_BASENAME = /(?:^|[-_.])(?:profile|session|qr|har|trace|cookie|token|password|otpauth)(?:[-_.]|$)/i

export function exportSanitizedRunArtifacts({
  sourceDir,
  destDir,
  runId,
  ownedRoots = [],
} = {}) {
  if (!destDir) throw new Error('Durable evidence directory is required for artifact export')
  if (!sourceDir || !existsSync(sourceDir)) {
    return { ok: true, exported: [], skipped: [], note: 'no private evidence to export' }
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
    if (FORBIDDEN_EXPORT_BASENAME.test(name) || HISTORICAL_EVIDENCE_BASENAMES.includes(name) || name === 'README.md') {
      skipped.push({ name, reason: 'forbidden-or-historical' })
      continue
    }
    if (!EXPORTABLE_BASENAME.test(name)) {
      skipped.push({ name, reason: 'not-whitelisted' })
      continue
    }
    if (runId && !name.startsWith(`${runId}-`) && !name.startsWith('aaclr1-')) {
      skipped.push({ name, reason: 'run-scoped-name-required' })
      continue
    }
    const dest = join(destDir, name)
    if (existsSync(dest)) {
      throw new Error(`Refusing to overwrite existing durable evidence ${name}`)
    }
    if (name.endsWith('.json')) {
      const parsed = JSON.parse(readFileSync(source, 'utf8'))
      assertSafeEvidence(parsed, name)
    }
    copyFileSync(source, dest)
    if (lstatSync(dest).isSymbolicLink()) {
      throw new Error(`Export produced a symlink ${name}`)
    }
    exported.push({ name, bytes: stat.size, dest: resolve(dest) })
  }
  return { ok: true, exported, skipped }
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
