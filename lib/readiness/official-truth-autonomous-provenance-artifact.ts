// Pure historical byte primitives. Neither a digest nor a decoded value is authority.
import { sha256Hex } from '@/lib/readiness/digest'

export type HistoricalResult<T> = Readonly<{ ok: true; value: T }> | Readonly<{ ok: false; reason: FoundationFailure }>
export type FoundationFailure = 'schema_incompatible' | 'artifact_closure_invalid' | 'pin_inconsistent'
  | 'scope_mismatch' | 'support_selection_invalid' | 'evidence_identity_drift' | 'proposal_not_null'
  | 'representation_not_global' | 'custody_dependency_mismatch' | 'freshness_gap'
export type Pin = Readonly<{ id: string; version: number; digest: string }>
export const PROVENANCE_LIMITS = Object.freeze({ artifactBytes: 1_048_576, receiptBytes: 262_144, nesting: 32 })
export function refused(reason: FoundationFailure): HistoricalResult<never> { return Object.freeze({ ok: false, reason }) }
export function immutable<T>(value: T): T {
  if (value && typeof value === 'object') {
    for (const child of Object.values(value)) immutable(child)
    Object.freeze(value)
  }
  return value
}
export function historical<T>(value: T): HistoricalResult<T> { return Object.freeze({ ok: true, value: immutable(value) }) }

/** Exact descriptors are checked before reading a property; getters are never called. */
export function ownRecord(value: unknown, fields: readonly string[]): Record<string, unknown> | null {
  if (!value || typeof value !== 'object' || Array.isArray(value)) return null
  const proto = Object.getPrototypeOf(value)
  if (proto !== Object.prototype && proto !== null) return null
  const keys = Reflect.ownKeys(value)
  if (keys.length !== fields.length || keys.some(k => typeof k !== 'string' || !fields.includes(k))) return null
  for (const key of fields) {
    const descriptor = Object.getOwnPropertyDescriptor(value, key)
    if (!descriptor || !('value' in descriptor) || !descriptor.enumerable) return null
  }
  return value as Record<string, unknown>
}
export function semanticId(value: unknown): value is string { return typeof value === 'string' && /^[a-z][a-z0-9._-]{0,127}$/.test(value) }
export function positiveVersion(value: unknown): value is number { return typeof value === 'number' && Number.isSafeInteger(value) && value > 0 }
export function readPin(value: unknown): Pin | null {
  const row = ownRecord(value, ['id', 'version', 'digest'])
  return row && semanticId(row.id) && positiveVersion(row.version) && typeof row.digest === 'string' && /^[a-f0-9]{64}$/.test(row.digest)
    ? Object.freeze({ id: row.id, version: row.version, digest: row.digest }) : null
}
export function pinsEqual(left: unknown, right: unknown): boolean {
  const a = readPin(left), b = readPin(right)
  return !!a && !!b && a.id === b.id && a.version === b.version && a.digest === b.digest
}

/** C: structural byte codec only. Domain schemas MUST validate before retaining/hash admission. */
export function provenanceCanonical(value: unknown, maxBytes: number = PROVENANCE_LIMITS.artifactBytes): string | null {
  if (!Number.isSafeInteger(maxBytes) || maxBytes < 0 || maxBytes > PROVENANCE_LIMITS.artifactBytes) return null
  let bytes = 0
  const active = new Set<object>()
  function token(text: string): string {
    bytes += new TextEncoder().encode(text).length
    if (bytes > maxBytes) throw new Error('bound')
    return text
  }
  function visit(input: unknown, depth: number): string {
    if (depth > PROVENANCE_LIMITS.nesting) throw new Error('depth')
    if (input === null) return token('null')
    if (typeof input === 'boolean') return token(input ? 'true' : 'false')
    if (typeof input === 'number') {
      if (!Number.isSafeInteger(input) || Object.is(input, -0)) throw new Error('number')
      return token(String(input))
    }
    if (typeof input === 'string') {
      // Reject isolated surrogates without altering Unicode or escaping semantics.
      for (let i = 0; i < input.length; i++) {
        const c = input.charCodeAt(i)
        if (c >= 0xd800 && c <= 0xdbff) {
          const next = input.charCodeAt(++i)
          if (!(next >= 0xdc00 && next <= 0xdfff)) throw new Error('unicode')
        } else if (c >= 0xdc00 && c <= 0xdfff) throw new Error('unicode')
      }
      if (input.length > maxBytes) throw new Error('bound')
      return token(JSON.stringify(input))
    }
    if (!input || typeof input !== 'object' || active.has(input)) throw new Error('shape')
    active.add(input)
    let result: string
    if (Array.isArray(input)) {
      if (Object.getPrototypeOf(input) !== Array.prototype || input.length > maxBytes / 2 || Reflect.ownKeys(input).length !== input.length + 1) throw new Error('array')
      const parts: string[] = []
      for (let i = 0; i < input.length; i++) {
        const d = Object.getOwnPropertyDescriptor(input, String(i))
        if (!d || !('value' in d) || !d.enumerable) throw new Error('array')
        if (i) token(',')
        parts.push(visit(d.value, depth + 1))
      }
      result = token('[') + parts.join(',') + token(']')
    } else {
      const keys = Reflect.ownKeys(input)
      if (keys.length > maxBytes / 4 || keys.some(k => typeof k !== 'string')) throw new Error('keys')
      const names = (keys as string[]).sort()
      if (!ownRecord(input, names)) throw new Error('record')
      const parts: string[] = []
      for (const name of names) {
        if (parts.length) token(',')
        parts.push(visit(name, depth + 1) + token(':') + visit(Object.getOwnPropertyDescriptor(input, name)!.value, depth + 1))
      }
      result = token('{') + parts.join(',') + token('}')
    }
    active.delete(input)
    return result
  }
  try { return visit(value, 0) } catch { return null }
}

/** Canonical-only decoder: duplicate members are rejected before assigning a value. */
export function decodeProvenanceBytes(bytes: Uint8Array, maxBytes: number = PROVENANCE_LIMITS.artifactBytes): HistoricalResult<unknown> {
  if (!Number.isSafeInteger(maxBytes) || maxBytes < 0 || maxBytes > PROVENANCE_LIMITS.artifactBytes) return refused('artifact_closure_invalid')
  if (!(bytes instanceof Uint8Array) || bytes.length > maxBytes) return refused('artifact_closure_invalid')
  try {
    const text = new TextDecoder('utf-8', { fatal: true, ignoreBOM: true }).decode(bytes)
    let offset = 0
    function string(): string {
      const start = offset++
      while (offset < text.length) {
        const c = text[offset++]
        if (c === '\\') offset++
        else if (c === '"') return JSON.parse(text.slice(start, offset)) as string
      }
      throw new Error('string')
    }
    function value(depth: number): unknown {
      if (depth > PROVENANCE_LIMITS.nesting) throw new Error('depth')
      const c = text[offset]
      if (c === '"') return string()
      if (c === '{') {
        offset++
        const out = Object.create(null) as Record<string, unknown>
        if (text[offset] === '}') { offset++; return out }
        while (offset < text.length) {
          if (text[offset] !== '"') throw new Error('key')
          const key = string()
          if (Object.hasOwn(out, key) || text[offset++] !== ':') throw new Error('duplicate')
          out[key] = value(depth + 1)
          const next = text[offset++]
          if (next === '}') return out
          if (next !== ',') throw new Error('separator')
        }
      }
      if (c === '[') {
        offset++
        const out: unknown[] = []
        if (text[offset] === ']') { offset++; return out }
        while (offset < text.length) {
          out.push(value(depth + 1))
          const next = text[offset++]
          if (next === ']') return out
          if (next !== ',') throw new Error('separator')
        }
      }
      for (const [word, literal] of [['null', null], ['true', true], ['false', false]] as const) {
        if (text.startsWith(word, offset)) { offset += word.length; return literal }
      }
      const number = /^-?(?:0|[1-9][0-9]*)/.exec(text.slice(offset))?.[0]
      if (number) { offset += number.length; return Number(number) }
      throw new Error('token')
    }
    const decoded = value(0)
    if (offset !== text.length || provenanceCanonical(decoded, maxBytes) !== text) return refused('schema_incompatible')
    // Detach into ordinary records after the duplicate/prototype/byte checks.
    return historical(JSON.parse(text) as unknown)
  } catch { return refused('schema_incompatible') }
}

export function historicalValuesEqual(a: unknown, b: unknown): boolean {
  const left = provenanceCanonical(a), right = provenanceCanonical(b)
  return left !== null && right !== null && left === right
}
/** H is a checksum of already validated historical values, never privacy/origin admission. */
export function provenanceHash(domain: 'ot-fact-v1' | 'ot-candidate-v1' | 'ot-proof-v1' | 'ot-provenance-v1'
  | 'ot-extractor-selection-v1' | 'ot-composition-selection-v1' | 'ot-composition-result-v1', value: unknown): string | null {
  if (!['ot-fact-v1', 'ot-candidate-v1', 'ot-proof-v1', 'ot-provenance-v1', 'ot-extractor-selection-v1', 'ot-composition-selection-v1', 'ot-composition-result-v1'].includes(domain)) return null
  const bytes = provenanceCanonical(value)
  return bytes === null ? null : `${domain}:${sha256Hex(domain + '\n' + bytes)}`
}
export function historicalPinFor(id: string, version: number, value: unknown): Pin | null {
  const bytes = provenanceCanonical(value)
  return semanticId(id) && positiveVersion(version) && bytes !== null ? Object.freeze({ id, version, digest: sha256Hex(bytes) }) : null
}
