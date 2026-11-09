import { OFFICIAL_TRUTH_V3_LIMITS } from '../contract'
import { readV3ProposalUpload, type V3UploadResult } from '../import/interface'
import type { QuellenRegistry } from '@/lib/readiness/source-registry'
import { s1RetentionShapeAllows } from './retention-shape'

/**
 * Non-evaluating preflight before retaining ORIGINAL bytes. JSON.parse alone
 * discards duplicate members and can hide a private earlier value. Existing
 * canonical-only provenance readers cannot preserve this transport's whitespace.
 */
export function uniqueV3JsonMembers(text: string): boolean {
  if (text.length > OFFICIAL_TRUTH_V3_LIMITS.payloadBytes
    || new TextEncoder().encode(text).byteLength > OFFICIAL_TRUTH_V3_LIMITS.payloadBytes) return false
  let offset = 0, nodes = 0
  const space = () => { while (offset < text.length && /[\x20\t\r\n]/.test(text[offset]!)) offset++ }
  const string = (): string => {
    if (text[offset] !== '"') throw Error('json')
    const start = offset++
    while (offset < text.length) {
      const character = text[offset++]!
      if (character === '\\') offset++
      else if (character === '"') {
        const decoded: unknown = JSON.parse(text.slice(start, offset))
        if (typeof decoded !== 'string') throw Error('json')
        return decoded
      }
    }
    throw Error('json')
  }
  const value = (depth: number): void => {
    if (++nodes > OFFICIAL_TRUTH_V3_LIMITS.payloadNodes || depth > OFFICIAL_TRUTH_V3_LIMITS.payloadDepth) throw Error('bound')
    space()
    const token = text[offset]
    if (token === '"') { string(); return }
    if (token === '{') {
      offset++; space()
      const names = new Set<string>()
      if (text[offset] === '}') { offset++; return }
      while (offset < text.length) {
        space()
        if (++nodes > OFFICIAL_TRUTH_V3_LIMITS.payloadNodes) throw Error('bound')
        const key = string()
        if (names.has(key)) throw Error('duplicate')
        names.add(key); space()
        if (text[offset++] !== ':') throw Error('json')
        value(depth + 1); space()
        const next = text[offset++]
        if (next === '}') return
        if (next !== ',') throw Error('json')
      }
      throw Error('json')
    }
    if (token === '[') {
      offset++; space()
      if (text[offset] === ']') { offset++; return }
      while (offset < text.length) {
        value(depth + 1); space()
        const next = text[offset++]
        if (next === ']') return
        if (next !== ',') throw Error('json')
      }
      throw Error('json')
    }
    for (const word of ['true', 'false', 'null']) {
      if (text.startsWith(word, offset)) { offset += word.length; return }
    }
    const number = /^-?(?:0|[1-9][0-9]*)(?:\.[0-9]+)?(?:[eE][+-]?[0-9]+)?/.exec(text.slice(offset))?.[0]
    if (!number) throw Error('json')
    offset += number.length
  }
  try { value(0); space(); return offset === text.length } catch { return false }
}

/** Retains the exact original string; no removal, compacting or reserialization. */
export function readV3RetainableProposal(input: unknown, registry: QuellenRegistry): V3UploadResult {
  if (typeof input !== 'string') return { ok: false, reason: 'invalid_upload' }
  if (input.length > OFFICIAL_TRUTH_V3_LIMITS.payloadBytes
    || new TextEncoder().encode(input).byteLength > OFFICIAL_TRUTH_V3_LIMITS.payloadBytes) return { ok: false, reason: 'bound_exceeded' }
  if (!uniqueV3JsonMembers(input)) return { ok: false, reason: 'invalid_upload' }
  // Shape is checked on original parsed data, before any S0 normalization.
  if (!s1RetentionShapeAllows(JSON.parse(input))) return { ok: false, reason: 'invalid_proposal' }
  return readV3ProposalUpload(input, registry)
}
