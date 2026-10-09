import { createHash } from 'node:crypto'
import { verifyNationalListResearchText } from '../official-truth-integrated-pilot-1/official-source'
import { nationalListFixture } from './fixtures'

export const digest = (text: string) => createHash('sha256').update(text, 'utf8').digest('hex')
// No real whole-response privacy admission is established. In particular the
// public API's description of a Request ID does not prove it is non-personal.
// Do not pin/hash/strip opaque metadata to make live data fit a synthetic corpus.
export function qualifyNationalList(text: string, mode: 'live' | 'synthetic') {
  const identity = verifyNationalListResearchText(text)
  if (!identity.ok) return { ok: false as const, stage: 'identity' as const, reason: identity.reason }
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

/** Complete finite fragment parser. No DOM, script execution, substring fact or
 * ignored tail. Accepted tags/nesting are a narrow observed manual-list shape.
 * A token carrying a country name is an observation, never a legal predicate. */
export function locateNationality(body: string) {
  if (typeof body !== 'string' || Buffer.byteLength(body) > 65_536) return null
  const stack: string[] = [], counts: number[] = []
  let cursor = 0, listCount = 0, itemIndex = 0
  const found: { pointer: '/details/body'; list: number; item: number; start: number; end: number;
    byteStart: number; byteEnd: number; quote: 'Switzerland' }[] = []
  const allowed: Record<string, string> = { '<p>': 'p', '<div class="legislative-list-wrapper">': 'div',
    '<ol class="legislative-list">': 'ol', '<li>': 'li' }
  while (cursor < body.length) {
    if (body[cursor] === '<') {
      const end = body.indexOf('>', cursor)
      if (end < 0) return null
      const tag = body.slice(cursor, end + 1), parent = stack.at(-1)
      if (tag === '<br>') { if (parent !== 'li') return null; counts[counts.length - 1]!++ }
      else if (tag.startsWith('</')) {
        if (tag !== `</${parent}>`) return null
        stack.pop(); counts.pop()
      } else {
        const kind = allowed[tag]
        if (!kind || stack.length >= 4 || !(
          (kind === 'p' && parent === undefined) || (kind === 'div' && parent === undefined)
          || (kind === 'ol' && parent === 'div') || (kind === 'li' && parent === 'ol'))) return null
        stack.push(kind); counts.push(0)
        if (kind === 'ol') { listCount++; itemIndex = 0 }
        if (kind === 'li') itemIndex++
      }
      cursor = end + 1
    } else {
      const end = body.indexOf('<', cursor), stop = end < 0 ? body.length : end
      const text = body.slice(cursor, stop), parent = stack.at(-1)
      if (!['p', 'li'].includes(parent ?? '') && text.trim()) return null
      if (text.includes('&') || /[\u0000-\u0008\u000b\u000c\u000e-\u001f]/.test(text)) return null
      if (parent === 'li' && text === 'Switzerland' && counts.at(-1) === 0 && body.slice(stop, stop + 5) === '</li>') {
        found.push({ pointer: '/details/body', list: listCount, item: itemIndex,
          start: cursor, end: stop, byteStart: Buffer.byteLength(body.slice(0, cursor)),
          byteEnd: Buffer.byteLength(body.slice(0, stop)), quote: 'Switzerland' })
      }
      if (counts.length) counts[counts.length - 1]! += text.length
      cursor = stop
    }
  }
  return !stack.length && found.length === 1 ? Object.freeze(found[0]!) : null
}
