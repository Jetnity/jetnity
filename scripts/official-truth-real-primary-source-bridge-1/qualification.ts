import { createHash } from 'node:crypto'
import { verifyNationalListResearchText } from '../official-truth-integrated-pilot-1/official-source'
import { FIXTURE_TIME, nationalListFixture } from './fixtures'
import { checkNationalListWholeResponse } from './whole-response'

export const digest = (text: string) => createHash('sha256').update(text, 'utf8').digest('hex')
// No real whole-response privacy admission is established. In particular the
// public API's description of a Request ID does not prove it is non-personal.
// Do not pin/hash/strip opaque metadata to make live data fit a synthetic corpus.
export function qualifyNationalList(text: string, mode: 'live' | 'synthetic', retrievedAt?: string) {
  const identity = verifyNationalListResearchText(text)
  if (!identity.ok) return { ok: false as const, stage: 'identity' as const, reason: identity.reason }
  const structure = checkNationalListWholeResponse(text, retrievedAt ?? (mode === 'synthetic' ? FIXTURE_TIME : ''))
  if (!structure.ok) return { ok: false as const, stage: 'qualification' as const, reason: structure.reason }
  // Existing profile already scanned the complete JSON grammar and decoded keys.
  const row = JSON.parse(text) as ReturnType<typeof nationalListFixture>
  if (row.publishing_request_id !== null) return { ok: false as const, stage: 'qualification' as const, reason: 'opaque_publishing_metadata' as const }
  if (mode === 'live') return { ok: false as const, stage: 'qualification' as const, reason: 'whole_response_review_not_established' as const }
  // Exact complete synthetic object, including unused nested arrays/metadata.
  // Reordered/escaped JSON is allowed only after the shared duplicate-aware scan.
  const expected = nationalListFixture()
  const same = (a: unknown, b: unknown): boolean => {
    if (a === b) return true
    if (!a || !b || typeof a !== 'object' || typeof b !== 'object') return false
    if (Array.isArray(a) !== Array.isArray(b)) return false
    const x = a as Record<string, unknown>, y = b as Record<string, unknown>
    return Object.keys(x).length === Object.keys(y).length && Object.keys(x).every(k => Object.hasOwn(y, k) && same(x[k], y[k]))
  }
  if (!same(row, expected)) return { ok: false as const, stage: 'qualification' as const, reason: 'unreviewed_public_component' as const }
  return { ok: true as const, identity: identity.identity, row }
}

export { locateNationality } from './fragment'
