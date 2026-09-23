#!/usr/bin/env node
// Sanitized receipts only. Runtime remains the final sanitizer.
// Artifact names and receipt keys follow the now-main #558 producer
// contract: ${runId}-counts-desktop.png, ${runId}-counts-mobile.png,
// ${runId}-browser-flows-gates.json. Extra keys fail closed.

import { closeSync, mkdirSync, openSync, readFileSync, writeFileSync, writeSync } from 'node:fs'
import { isAbsolute, relative, resolve } from 'node:path'
import { crc32 } from 'node:zlib'

import { AGENT, CONTRACT_VERSION, FLOW_GATE_IDS, GENERATION, GATE_RESULTS } from './constants.mjs'
import {
  assertSanitized,
  relativeEvidencePath,
  safeFailureMessage,
  sanitizeReturnedGates,
} from './privacy.mjs'

// Exact now-main producer allowlist. Do not add sourcePins or other extras.
export const RECEIPT_WHITELIST = Object.freeze([
  'contractVersion',
  'runId',
  'productHead',
  'gates',
  'notes',
  'agent',
  'generation',
  'implementationMetadata',
  'thisInvocation',
  'implementation',
  'realExecution',
  'runtimeIntegration',
])

export const IMPLEMENTATION_METADATA_KEYS = Object.freeze([
  'agent',
  'generation',
  'contractVersion',
  'scenarioCode',
  'defaultRealExecutionClaim',
  'runtimeIntegration',
])

export const THIS_INVOCATION_KEYS = Object.freeze([
  'kind',
  'realBrowserOrMfaExecution',
  'observedResults',
])

export const TIMELESS_IMPLEMENTATION_METADATA_KEYS = Object.freeze([
  'agent',
  'generation',
  'contractVersion',
  'scenarioCode',
])

export const TIMELESS_THIS_INVOCATION_KEYS = Object.freeze([
  'kind',
  'observedResults',
])

export const EXECUTION_PROVENANCE_RECEIPT_KEYS = Object.freeze([
  'realExecution',
  'runtimeIntegration',
])

export const EXECUTION_PROVENANCE_METADATA_KEYS = Object.freeze([
  'defaultRealExecutionClaim',
  'runtimeIntegration',
])

export const GATE_KEYS = Object.freeze(['id', 'result', 'evidence', 'notes'])

export const CONSUMER_ARTIFACT_SPECS = Object.freeze([
  Object.freeze({ kind: 'counts-desktop', suffix: '-counts-desktop.png', type: 'png' }),
  Object.freeze({ kind: 'counts-mobile', suffix: '-counts-mobile.png', type: 'png' }),
  Object.freeze({ kind: 'browser-flows-gates', suffix: '-browser-flows-gates.json', type: 'json' }),
])

const PNG_SIGNATURE = Buffer.from([0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a])
export const ALLOWED_PNG_CHUNKS = Object.freeze(['IHDR', 'IDAT', 'IEND'])

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
  const normalized = String(suffix).replace(/^-+/, '')
  return `${safe}-${normalized}`
}

export function consumerArtifactNames(runId) {
  return CONSUMER_ARTIFACT_SPECS.map((spec) => runScopedName(runId, spec.suffix.replace(/^-/, '')))
}

function assertAllowedKeys(value, allowed, path) {
  if (!value || typeof value !== 'object' || Array.isArray(value)) {
    throw new Error(`${path} must be an object`)
  }
  for (const key of Object.keys(value)) {
    if (!allowed.includes(key)) {
      throw new Error(`${path} has unsupported field ${key}`)
    }
  }
}

export function assertNoExecutionProvenanceClaim(value, path = 'receipt') {
  if (!value || typeof value !== 'object' || Array.isArray(value)) {
    throw new Error(`${path} must be a JSON object`)
  }
  for (const key of EXECUTION_PROVENANCE_RECEIPT_KEYS) {
    if (Object.hasOwn(value, key)) {
      throw new Error(`${path} must omit execution provenance field ${key}`)
    }
  }
  if (value.thisInvocation && Object.hasOwn(value.thisInvocation, 'realBrowserOrMfaExecution')) {
    throw new Error(`${path}.thisInvocation must omit realBrowserOrMfaExecution`)
  }
  if (value.implementationMetadata) {
    for (const key of EXECUTION_PROVENANCE_METADATA_KEYS) {
      if (Object.hasOwn(value.implementationMetadata, key)) {
        throw new Error(`${path}.implementationMetadata must omit mutable execution claim ${key}`)
      }
    }
  }
  const notes = typeof value.notes === 'string' ? value.notes : ''
  if (/\brealExecution\b|\bruntimeIntegration\b|\brealBrowserOrMfaExecution\b/.test(notes)) {
    throw new Error(`${path}.notes must not name omitted execution-provenance fields`)
  }
  if (/\bNOT RUN\b/i.test(notes) || /\bpending\b/i.test(notes)) {
    throw new Error(`${path}.notes must not self-attest current execution state`)
  }
  return true
}

export function assertProducerCompatibleReceipt(value, { runId, productHead, omitExecutionProvenance = true } = {}) {
  if (!value || typeof value !== 'object' || Array.isArray(value)) {
    throw new Error('receipt must be a JSON object')
  }
  assertAllowedKeys(value, RECEIPT_WHITELIST, 'receipt')
  if (value.contractVersion !== CONTRACT_VERSION) {
    throw new Error(`receipt contractVersion must be ${CONTRACT_VERSION}`)
  }
  if (runId && value.runId !== runId) {
    throw new Error('receipt runId does not match the current run identity')
  }
  if (productHead && value.productHead !== productHead) {
    throw new Error('receipt productHead does not match the expected product head')
  }
  if (value.implementationMetadata != null) {
    assertAllowedKeys(value.implementationMetadata, IMPLEMENTATION_METADATA_KEYS, 'implementationMetadata')
    if (
      value.implementationMetadata.contractVersion != null
      && value.implementationMetadata.contractVersion !== CONTRACT_VERSION
    ) {
      throw new Error('implementationMetadata.contractVersion must match the frozen contract')
    }
  }
  if (value.thisInvocation != null) {
    assertAllowedKeys(value.thisInvocation, THIS_INVOCATION_KEYS, 'thisInvocation')
  }
  if (omitExecutionProvenance) {
    assertNoExecutionProvenanceClaim(value)
  }
  if (!Array.isArray(value.gates) || value.gates.length !== FLOW_GATE_IDS.length) {
    throw new Error('receipt must include the exact G6–G19 gate set')
  }
  for (let index = 0; index < FLOW_GATE_IDS.length; index += 1) {
    const expected = FLOW_GATE_IDS[index]
    const gate = value.gates[index]
    if (!gate || gate.id !== expected) {
      throw new Error(`receipt gate order does not match G6–G19 at ${expected}`)
    }
    assertAllowedKeys(gate, GATE_KEYS, `gates.${expected}`)
    if (!GATE_RESULTS.includes(gate.result)) {
      throw new Error(`receipt gate ${expected} has illegal result ${gate.result}`)
    }
  }
  const observed = value.thisInvocation?.observedResults
  if (observed != null) {
    if (!Array.isArray(observed) || observed.length !== FLOW_GATE_IDS.length) {
      throw new Error('thisInvocation.observedResults must cover G6–G19')
    }
    for (let index = 0; index < FLOW_GATE_IDS.length; index += 1) {
      if (observed[index] !== value.gates[index].result) {
        throw new Error(`thisInvocation.observedResults does not match gate ${FLOW_GATE_IDS[index]}`)
      }
    }
  }
  return true
}

export function buildProducerShapedReceipt({
  runId,
  productHead,
  gates,
  notes,
  implementation,
}) {
  const receipt = {
    contractVersion: CONTRACT_VERSION,
    agent: AGENT,
    generation: GENERATION,
    runId,
    productHead,
    implementationMetadata: staticImplementationMetadata(),
    thisInvocation: {
      kind: 'consumer-gates',
      observedResults: gates.map((gate) => gate.result),
    },
    implementation,
    gates: gates.map(({ id, result, notes: gateNotes, evidence }) => ({
      id,
      result,
      evidence: evidence ?? null,
      notes: gateNotes ?? null,
    })),
    notes,
  }
  assertProducerCompatibleReceipt(receipt, { runId, productHead })
  return receipt
}

function pngChunk(type, data) {
  const header = Buffer.alloc(4)
  header.writeUInt32BE(data.length)
  const body = Buffer.concat([Buffer.from(type, 'ascii'), data])
  const crc = Buffer.alloc(4)
  crc.writeUInt32BE(crc32(body) >>> 0)
  return Buffer.concat([header, body, crc])
}

export function stripPngToScreenshotProfile(bytes) {
  if (!Buffer.isBuffer(bytes)) bytes = Buffer.from(bytes || [])
  if (bytes.length < 8 || !bytes.subarray(0, 8).equals(PNG_SIGNATURE)) {
    throw new Error('screenshot is not a structurally valid PNG')
  }
  const kept = []
  let offset = 8
  while (offset + 12 <= bytes.length) {
    const length = bytes.readUInt32BE(offset)
    if (offset + 12 + length > bytes.length) {
      throw new Error('screenshot PNG is truncated')
    }
    const type = bytes.toString('ascii', offset + 4, offset + 8)
    const storedCrc = bytes.readUInt32BE(offset + 8 + length)
    const actualCrc = crc32(bytes.subarray(offset + 4, offset + 8 + length)) >>> 0
    if (actualCrc !== storedCrc) {
      throw new Error('screenshot PNG has an invalid CRC')
    }
    if (ALLOWED_PNG_CHUNKS.includes(type)) {
      kept.push(bytes.subarray(offset, offset + 12 + length))
    }
    offset += 12 + length
    if (type === 'IEND') break
  }
  if (!kept.length) throw new Error('screenshot PNG is missing required chunks')
  return Buffer.concat([PNG_SIGNATURE, ...kept])
}

export function rewriteScreenshotPng(filePath) {
  const sanitized = stripPngToScreenshotProfile(readFileSync(filePath))
  writeFileSync(filePath, sanitized)
  return sanitized
}

export function pngChunkForTests(type, data) {
  return pngChunk(type, data)
}

export function reserveExclusiveArtifact(evidenceDir, name) {
  const filePath = containedEvidencePath(evidenceDir, name)
  mkdirSync(resolve(evidenceDir), { recursive: true })
  const fd = openSync(filePath, 'wx')
  closeSync(fd)
  return filePath
}

export function whitelistReceipt(raw, secrets = []) {
  if (!raw || typeof raw !== 'object' || Array.isArray(raw)) {
    throw new Error('receipt must be an object')
  }
  for (const key of Object.keys(raw)) {
    if (!RECEIPT_WHITELIST.includes(key)) {
      throw new Error(`receipt has unsupported field ${key}`)
    }
  }
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
  if (name.endsWith('-browser-flows-gates.json')) {
    assertProducerCompatibleReceipt(payload, {
      runId: payload.runId,
      productHead: payload.productHead,
    })
  }
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
  }
}
