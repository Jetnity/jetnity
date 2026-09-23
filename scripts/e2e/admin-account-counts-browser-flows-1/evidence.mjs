#!/usr/bin/env node
// Sanitized receipts only. Runtime remains the final sanitizer.

import { closeSync, mkdirSync, openSync, writeSync } from 'node:fs'
import { isAbsolute, relative, resolve } from 'node:path'

import { AGENT, CONTRACT_VERSION, GENERATION } from './constants.mjs'
import {
  assertSanitized,
  relativeEvidencePath,
  safeFailureMessage,
  sanitizeReturnedGates,
} from './privacy.mjs'

export const RECEIPT_WHITELIST = Object.freeze([
  'contractVersion',
  'agent',
  'generation',
  'runId',
  'productHead',
  'implementationMetadata',
  'thisInvocation',
  'implementation',
  'realExecution',
  'runtimeIntegration',
  'gates',
  'notes',
  'sourcePins',
])

export function containedEvidencePath(evidenceDir, name) {
  if (typeof evidenceDir !== 'string' || evidenceDir.trim() === '') {
    throw new Error('evidenceDir is required; runtime must supply a contained private directory')
  }
  if (typeof name !== 'string' || name.trim() === '') {
    throw new Error('evidence name is required')
  }
  if (name.includes('..') || name.includes('/') || name.includes('\\') || name.startsWith('.')) {
    throw new Error('evidence name must be a basename inside evidenceDir')
  }
  if (/\.(har|zip)$/i.test(name) || /storageState|trace/i.test(name)) {
    throw new Error(`refusing secret-bearing artifact name ${name}`)
  }
  const dir = resolve(evidenceDir)
  const filePath = resolve(dir, name)
  const rel = relative(dir, filePath)
  if (rel.startsWith('..') || isAbsolute(rel)) {
    throw new Error('evidence path escaped the private directory')
  }
  return filePath
}

export function runScopedName(runId, suffix) {
  const safe = String(runId).replace(/[^A-Za-z0-9._-]/g, '_')
  if (!safe || safe === '_' || /^\.+$/.test(safe)) {
    throw new Error('runId cannot form an exclusive evidence name')
  }
  return `${safe}-${suffix}`
}

export function reserveExclusiveArtifact(evidenceDir, name) {
  const filePath = containedEvidencePath(evidenceDir, name)
  mkdirSync(resolve(evidenceDir), { recursive: true })
  const fd = openSync(filePath, 'wx')
  closeSync(fd)
  return filePath
}

export function whitelistReceipt(raw, secrets = []) {
  const out = {}
  for (const key of RECEIPT_WHITELIST) {
    if (raw[key] !== undefined) out[key] = raw[key]
  }
  if (Array.isArray(out.gates)) {
    out.gates = sanitizeReturnedGates(out.gates, secrets)
  }
  if (typeof out.notes === 'string') {
    out.notes = safeFailureMessage({ message: out.notes }, secrets)
  }
  return assertSanitized(out, 'receipt', secrets)
}

export function writeSanitizedReceipt(evidenceDir, name, raw, { secrets = [] } = {}) {
  const filePath = containedEvidencePath(evidenceDir, name)
  mkdirSync(resolve(evidenceDir), { recursive: true })
  const payload = whitelistReceipt(raw, secrets)
  const serialized = `${JSON.stringify(payload, null, 2)}\n`
  const fd = openSync(filePath, 'wx')
  try {
    writeSync(fd, Buffer.from(serialized))
  } finally {
    closeSync(fd)
  }
  return relativeEvidencePath(filePath, evidenceDir)
}

export function staticImplementationMetadata() {
  return {
    agent: AGENT,
    generation: GENERATION,
    contractVersion: CONTRACT_VERSION,
    scenarioCode: 'delivered',
    defaultRealExecutionClaim: 'NOT RUN until reviewed runtime integration',
    runtimeIntegration: 'pending',
  }
}
