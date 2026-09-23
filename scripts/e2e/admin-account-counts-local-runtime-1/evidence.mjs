#!/usr/bin/env node
// Whitelisted evidence serialization. Secrets and historical receipts are
// refused. This lane never rewrites older receipts.

import { mkdirSync, writeFileSync } from 'node:fs'
import { join } from 'node:path'
import { HISTORICAL_EVIDENCE_BASENAMES } from './constants.mjs'

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
