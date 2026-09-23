#!/usr/bin/env node
// Whitelisted evidence serialization. Secrets and historical receipts are
// refused. This lane never rewrites older receipts.
// Consumer artifact names are the TL-confirmed §4 contract:
// ${runId}-counts-desktop.png, ${runId}-counts-mobile.png,
// ${runId}-browser-flows-gates.json. Content, identity and exclusive
// creation are validated before durable publication.

import { existsSync, lstatSync, mkdirSync, readdirSync, readFileSync, unlinkSync, writeFileSync } from 'node:fs'
import { join, resolve } from 'node:path'
import { crc32, inflateSync } from 'node:zlib'
import {
  BROWSER_GATE_RESULTS,
  BROWSER_GATES,
  CONTRACT_VERSION,
  HISTORICAL_EVIDENCE_BASENAMES,
  PRODUCT_BASELINE,
} from './constants.mjs'
import { assertOwnedPath } from './cleanup.mjs'

const SECRET_KEY = /^(password|secret|token|access_token|refresh_token|accessToken|refreshToken|authorization|cookie|otpauth|jwt|serviceRole|service_role|serviceRoleKey|apikey|anonKey|anon_key)$/i
const SECRET_EMBEDDED = /Bearer\s+\S+|eyJ[A-Za-z0-9_-]{20,}\.[A-Za-z0-9_-]+\.[A-Za-z0-9_-]*|otpauth:\/\/|locator\.fill\s*\(|\bsk-[A-Za-z0-9]{8,}|\bsbp_[A-Za-z0-9]+/i
const PNG_SIGNATURE = Buffer.from([0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a])
export const PNG_MAX_BYTES = 2 * 1024 * 1024
export const PNG_MAX_DIMENSION = 4096
export const SCREENSHOT_COLOR_TYPES = Object.freeze({ rgb: 2, rgba: 6 })
export const SCREENSHOT_BIT_DEPTHS = Object.freeze([8, 16])
export const ALLOWED_PNG_CHUNKS = Object.freeze(['IHDR', 'IDAT', 'IEND'])
export const CONSUMER_AGENT = 'Jetnity admin account counts browser flows 1'
export const MINIMAL_PNG = Buffer.from(
  '89504e470d0a1a0a0000000d4948445200000002000000020802000000fdd49a730000001649444154789c63aca8a8606060606260606060600000110a016c6f1c016f0000000049454e44ae426082',
  'hex',
)

export function redactSecrets(value) {
  if (typeof value === 'string') {
    return SECRET_EMBEDDED.test(value) ? '[redacted]' : value
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
  if (typeof value === 'string' && value !== '[redacted]' && SECRET_EMBEDDED.test(value)) {
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

function readPngChunks(bytes, path) {
  const chunks = []
  let offset = 8
  while (offset + 12 <= bytes.length) {
    const length = bytes.readUInt32BE(offset)
    if (length > PNG_MAX_BYTES) throw new Error(`${path} has an oversized PNG chunk`)
    if (offset + 12 + length > bytes.length) throw new Error(`${path} has a truncated PNG chunk`)
    const type = bytes.toString('ascii', offset + 4, offset + 8)
    if (!/^[A-Za-z]{4}$/.test(type)) throw new Error(`${path} has an invalid PNG chunk type`)
    const data = bytes.subarray(offset + 8, offset + 8 + length)
    const storedCrc = bytes.readUInt32BE(offset + 8 + length)
    const actualCrc = crc32(bytes.subarray(offset + 4, offset + 8 + length)) >>> 0
    if (actualCrc !== storedCrc) throw new Error(`${path} has an invalid PNG CRC`)
    chunks.push({ type, data })
    offset += 12 + length
    if (type === 'IEND') break
  }
  if (offset !== bytes.length) throw new Error(`${path} has trailing bytes after the PNG chunks`)
  return chunks
}

export function assertValidPng(bytes, { maxBytes = PNG_MAX_BYTES, path = 'png' } = {}) {
  if (!Buffer.isBuffer(bytes)) bytes = Buffer.from(bytes || [])
  if (!bytes.length) throw new Error(`${path} is an empty image and is not a usable PNG`)
  if (bytes.length > maxBytes) throw new Error(`${path} exceeds PNG maxBytes ${maxBytes}`)
  if (bytes.length < 57) throw new Error(`${path} is too small to be a usable PNG`)
  if (!bytes.subarray(0, 8).equals(PNG_SIGNATURE)) {
    throw new Error(`${path} is not a structurally valid PNG`)
  }
  const chunks = readPngChunks(bytes, path)
  if (chunks[0]?.type !== 'IHDR' || chunks[0].data.length !== 13) {
    throw new Error(`${path} is missing a PNG IHDR chunk`)
  }
  if (chunks.at(-1)?.type !== 'IEND' || chunks.at(-1).data.length !== 0) {
    throw new Error(`${path} is missing a PNG IEND chunk`)
  }
  const ihdr = chunks[0].data
  const width = ihdr.readUInt32BE(0)
  const height = ihdr.readUInt32BE(4)
  const bitDepth = ihdr[8]
  const colorType = ihdr[9]
  const compression = ihdr[10]
  const filter = ihdr[11]
  const interlace = ihdr[12]
  if (!width || !height) throw new Error(`${path} has zero PNG dimensions`)
  if (width > PNG_MAX_DIMENSION || height > PNG_MAX_DIMENSION) {
    throw new Error(`${path} exceeds bounded PNG dimensions`)
  }
  if (compression !== 0 || filter !== 0 || interlace !== 0) {
    throw new Error(`${path} uses unsupported PNG options`)
  }
  if (!SCREENSHOT_BIT_DEPTHS.includes(bitDepth) || !Object.values(SCREENSHOT_COLOR_TYPES).includes(colorType)) {
    throw new Error(`${path} is outside the RGB/RGBA screenshot profile`)
  }
  for (const chunk of chunks) {
    if (!ALLOWED_PNG_CHUNKS.includes(chunk.type)) {
      throw new Error(`${path} has unreviewed PNG metadata chunk ${chunk.type}`)
    }
  }
  const idat = chunks.filter((chunk) => chunk.type === 'IDAT').map((chunk) => chunk.data)
  if (!idat.length) throw new Error(`${path} is missing PNG image data`)
  let inflated
  try {
    inflated = inflateSync(Buffer.concat(idat), { maxOutputLength: 8 * 1024 * 1024 })
  } catch {
    throw new Error(`${path} has an invalid PNG image payload`)
  }
  const samples = colorType === SCREENSHOT_COLOR_TYPES.rgba ? 4 : 3
  const bytesPerPixel = Math.ceil((bitDepth * samples) / 8)
  const rowBytes = 1 + width * bytesPerPixel
  if (inflated.length !== height * rowBytes) {
    throw new Error(`${path} image payload does not match IHDR dimensions`)
  }
  for (let row = 0; row < height; row += 1) {
    if (inflated[row * rowBytes] > 4) throw new Error(`${path} has an illegal PNG filter`)
  }
  return true
}

export const ALLOWED_CONSUMER_RECEIPT_KEYS = Object.freeze([
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

export const ALLOWED_IMPLEMENTATION_METADATA_KEYS = Object.freeze([
  'agent',
  'generation',
  'contractVersion',
  'scenarioCode',
  'defaultRealExecutionClaim',
  'runtimeIntegration',
])

export const ALLOWED_THIS_INVOCATION_KEYS = Object.freeze([
  'kind',
  'realBrowserOrMfaExecution',
  'observedResults',
])

export const ALLOWED_GATE_KEYS = Object.freeze(['id', 'result', 'evidence', 'notes'])

function assertOptionalString(value, path) {
  if (value != null && typeof value !== 'string') throw new Error(`${path} must be a string or null`)
}

function assertOptionalNumber(value, path) {
  if (value != null && (typeof value !== 'number' || !Number.isFinite(value))) {
    throw new Error(`${path} must be a finite number`)
  }
}

export function createProducerShapedConsumerReceipt({
  runId,
  productHead = PRODUCT_BASELINE,
  notes = 'synthetic/no browser execution',
  gateResults,
} = {}) {
  const agent = CONSUMER_AGENT
  const gates = BROWSER_GATES.map((id) => ({
    id,
    result: gateResults?.[id] || 'NOT RUN',
    notes,
  }))
  return {
    contractVersion: CONTRACT_VERSION,
    agent,
    generation: 1,
    runId,
    productHead,
    implementationMetadata: {
      agent,
      generation: 1,
      contractVersion: CONTRACT_VERSION,
      scenarioCode: 'delivered',
      defaultRealExecutionClaim: 'NOT RUN until reviewed runtime integration',
      runtimeIntegration: 'pending',
    },
    thisInvocation: {
      kind: 'consumer-gates',
      realBrowserOrMfaExecution: 'NOT RUN',
      observedResults: gates.map((gate) => gate.result),
    },
    implementation: 'delivered',
    realExecution: 'NOT RUN',
    runtimeIntegration: 'pending',
    gates,
    notes,
  }
}

export function createControlledConsumerReceipt(options = {}) {
  return createProducerShapedConsumerReceipt(options)
}

function assertAllowedKeys(value, allowed, path) {
  for (const key of Object.keys(value)) {
    if (!allowed.includes(key)) {
      throw new Error(`${path} has unsupported field ${key}`)
    }
  }
}

export function assertConsumerGatesJson(value, options = {}) {
  const path = options.path || 'browser-flows-gates.json'
  const identity = options.identity || (options.runId ? createRunIdentity({ runId: options.runId }) : null)
  const productHead = options.productHead || PRODUCT_BASELINE
  if (!value || typeof value !== 'object' || Array.isArray(value)) {
    throw new Error(`${path} must be a JSON object`)
  }
  assertSafeEvidence(value, path)
  assertAllowedKeys(value, ALLOWED_CONSUMER_RECEIPT_KEYS, path)
  if (value.contractVersion !== CONTRACT_VERSION) {
    throw new Error(`${path} contractVersion must be ${CONTRACT_VERSION}`)
  }
  const aliases = identity?.aliases || (identity?.runId ? [identity.runId] : [])
  if (!aliases.length || !aliases.includes(value.runId)) {
    throw new Error(`${path} runId does not match the current run identity`)
  }
  if (value.productHead !== productHead) {
    throw new Error(`${path} productHead does not match the expected product head`)
  }
  if (value.notes != null && typeof value.notes !== 'string') {
    throw new Error(`${path} notes must be a string or null`)
  }
  assertOptionalString(value.agent, `${path}.agent`)
  assertOptionalNumber(value.generation, `${path}.generation`)
  assertOptionalString(value.implementation, `${path}.implementation`)
  assertOptionalString(value.realExecution, `${path}.realExecution`)
  assertOptionalString(value.runtimeIntegration, `${path}.runtimeIntegration`)
  if (value.implementationMetadata != null) {
    if (typeof value.implementationMetadata !== 'object' || Array.isArray(value.implementationMetadata)) {
      throw new Error(`${path}.implementationMetadata must be an object`)
    }
    assertSafeEvidence(value.implementationMetadata, `${path}.implementationMetadata`)
    assertAllowedKeys(value.implementationMetadata, ALLOWED_IMPLEMENTATION_METADATA_KEYS, `${path}.implementationMetadata`)
    assertOptionalString(value.implementationMetadata.agent, `${path}.implementationMetadata.agent`)
    assertOptionalNumber(value.implementationMetadata.generation, `${path}.implementationMetadata.generation`)
    if (value.implementationMetadata.contractVersion != null && value.implementationMetadata.contractVersion !== CONTRACT_VERSION) {
      throw new Error(`${path}.implementationMetadata.contractVersion must be ${CONTRACT_VERSION}`)
    }
    assertOptionalString(value.implementationMetadata.scenarioCode, `${path}.implementationMetadata.scenarioCode`)
    assertOptionalString(value.implementationMetadata.defaultRealExecutionClaim, `${path}.implementationMetadata.defaultRealExecutionClaim`)
    assertOptionalString(value.implementationMetadata.runtimeIntegration, `${path}.implementationMetadata.runtimeIntegration`)
  }
  if (value.thisInvocation != null) {
    if (typeof value.thisInvocation !== 'object' || Array.isArray(value.thisInvocation)) {
      throw new Error(`${path}.thisInvocation must be an object`)
    }
    assertSafeEvidence(value.thisInvocation, `${path}.thisInvocation`)
    assertAllowedKeys(value.thisInvocation, ALLOWED_THIS_INVOCATION_KEYS, `${path}.thisInvocation`)
    assertOptionalString(value.thisInvocation.kind, `${path}.thisInvocation.kind`)
    assertOptionalString(value.thisInvocation.realBrowserOrMfaExecution, `${path}.thisInvocation.realBrowserOrMfaExecution`)
    if (value.thisInvocation.observedResults != null) {
      if (!Array.isArray(value.thisInvocation.observedResults)) {
        throw new Error(`${path}.thisInvocation.observedResults must be an array`)
      }
      if (value.thisInvocation.observedResults.length !== BROWSER_GATES.length) {
        throw new Error(`${path}.thisInvocation.observedResults must cover G6–G19`)
      }
      for (const result of value.thisInvocation.observedResults) {
        if (!BROWSER_GATE_RESULTS.includes(result)) {
          throw new Error(`${path}.thisInvocation.observedResults has illegal result ${result}`)
        }
      }
    }
  }
  let gates = value.gates
  if (Array.isArray(gates)) {
    const seen = new Set()
    for (const gate of gates) {
      if (!gate?.id) throw new Error(`${path} gate is missing an id`)
      if (seen.has(gate.id)) throw new Error(`${path} has duplicate gate ${gate.id}`)
      seen.add(gate.id)
    }
    gates = Object.fromEntries(gates.map((gate) => [gate.id, gate]))
  }
  if (!gates || typeof gates !== 'object' || Array.isArray(gates)) {
    throw new Error(`${path} must include the exact G6–G19 gate set`)
  }
  for (const id of BROWSER_GATES) {
    const gate = gates[id]
    if (!gate) throw new Error(`${path} is missing gate ${id}`)
    if (!gate || typeof gate !== 'object' || Array.isArray(gate)) {
      throw new Error(`${path} gate ${id} must be an object`)
    }
    assertSafeEvidence(gate, `${path}.${id}`)
    assertAllowedKeys(gate, ALLOWED_GATE_KEYS, `${path}.${id}`)
    if (gate.id != null && gate.id !== id) {
      throw new Error(`${path} gate ${id} id does not match the gate key`)
    }
    if (!BROWSER_GATE_RESULTS.includes(gate.result)) {
      throw new Error(`${path} gate ${id} has illegal result ${gate.result}`)
    }
    if (gate.evidence != null && typeof gate.evidence !== 'string') {
      throw new Error(`${path} gate ${id} evidence must be a string or null`)
    }
    if (gate.notes != null && typeof gate.notes !== 'string') {
      throw new Error(`${path} gate ${id} notes must be a string or null`)
    }
  }
  for (const id of Object.keys(gates)) {
    if (!BROWSER_GATES.includes(id)) throw new Error(`${path} has unknown gate ${id}`)
  }
  if (Array.isArray(value.gates)) {
    for (let index = 0; index < BROWSER_GATES.length; index += 1) {
      if (value.gates[index]?.id !== BROWSER_GATES[index]) {
        throw new Error(`${path} gate order does not match G6–G19`)
      }
    }
  }
  if (value.thisInvocation?.observedResults) {
    for (let index = 0; index < BROWSER_GATES.length; index += 1) {
      const id = BROWSER_GATES[index]
      if (value.thisInvocation.observedResults[index] !== gates[id].result) {
        throw new Error(`${path}.thisInvocation.observedResults does not match gate ${id}`)
      }
    }
  }
  return true
}

export function writeExclusiveFile(dest, bytes, name) {
  if (existsSync(dest)) {
    throw new Error(`Refusing to overwrite existing durable evidence ${name}`)
  }
  try {
    writeFileSync(dest, bytes, { mode: 0o644, flag: 'wx' })
  } catch (error) {
    if (error && error.code === 'EEXIST') {
      throw new Error(`Refusing to overwrite existing durable evidence ${name}`)
    }
    throw error
  }
  return dest
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
  productHead = PRODUCT_BASELINE,
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
  const skipped = []
  const pending = []
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
    const spec = matchConsumerArtifact(name, identity)
    const bytes = readFileSync(source)
    if (spec?.type === 'png') {
      assertValidPng(bytes, { path: name })
    } else if (name.endsWith('.json')) {
      const parsed = JSON.parse(bytes.toString('utf8'))
      if (name.endsWith('-browser-flows-gates.json')) {
        assertConsumerGatesJson(parsed, {
          path: name,
          identity,
          productHead,
        })
      } else {
        assertSafeEvidence(parsed, name)
      }
    }
    const dest = join(destDir, name)
    if (existsSync(dest)) {
      throw new Error(`Refusing to overwrite existing durable evidence ${name}`)
    }
    pending.push({ name, dest, bytes })
  }
  const pendingNames = new Set(pending.map((item) => item.name))
  const pendingKinds = new Set(
    pending
      .map((item) => matchConsumerArtifact(item.name, identity)?.kind)
      .filter(Boolean),
  )
  const missing = expected.filter((name) => {
    if (pendingNames.has(name)) return false
    const spec = CONSUMER_ARTIFACT_SPECS.find((item) => name.endsWith(item.suffix))
    return !spec || !pendingKinds.has(spec.kind)
  })
  const skippedRequired = skipped.filter((item) => expected.includes(item.name))
  if (missing.length || skippedRequired.length) {
    return {
      ok: false,
      exported: [],
      skipped,
      missing,
      error: `required consumer artifacts missing or skipped: ${(missing.length ? missing : skippedRequired.map((item) => item.name)).join(', ')}`,
    }
  }
  const exported = []
  const created = []
  try {
    for (const item of pending) {
      writeExclusiveFile(item.dest, item.bytes, item.name)
      if (lstatSync(item.dest).isSymbolicLink()) {
        throw new Error(`Export produced a symlink ${item.name}`)
      }
      created.push(item.dest)
      exported.push({ name: item.name, bytes: item.bytes.length, dest: resolve(item.dest) })
    }
  } catch (error) {
    for (const dest of created) {
      try { unlinkSync(dest) } catch { /* do not leave a claimed-complete set */ }
    }
    throw error
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
  return writeExclusiveFile(join(evidenceDir, name), `${JSON.stringify(safe, null, 2)}\n`, name)
}
