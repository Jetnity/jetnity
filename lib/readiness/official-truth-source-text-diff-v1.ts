// Offline-only deterministic HTML-text change triage for the already
// monitored government-source originals (research, NEVER Official Truth).
// No fetch, model call, database access, source registration or publication.
// The supplied snapshots must first come from Jetnity's trusted, private
// immutable source stores. An identical *visible text* result does not
// establish that a visa law/ETA/form rule is unchanged.

import { createHash } from 'node:crypto'
import { types } from 'node:util'
import { parse, type DefaultTreeAdapterMap } from 'parse5'

const BODY_LIMIT_BYTES = 262_144
const NODE_LIMIT = 30_000
const DEPTH_LIMIT = 96
const TEXT_LIMIT = 131_072
const FRAGMENT_LIMIT = 12_000
const LINKS_LIMIT = 2_048

const INERT = new Set([
  'head', 'script', 'style', 'template', 'noscript',
  'svg', 'math', 'iframe', 'object', 'embed', 'canvas',
])

type Node = DefaultTreeAdapterMap['node']
type Element = DefaultTreeAdapterMap['element']

export type OfficialSourceResearchSnapshot = Readonly<{
  sourceFamily: 'SIX' | 'FOUR'
  destinationCode: string
  sourceKey: string
  batchId: number
  rawSha: string
  bodyBytes: number
  html: string
}>

export type TextComparisonDisposition =
  | 'RAW_IDENTICAL_RESEARCH_ONLY'
  | 'VISIBLE_TEXT_CHANGED_REQUIRES_REVIEW'
  | 'FORM_OR_LINK_CHANGED_REQUIRES_REVIEW'
  | 'NONVISIBLE_MARKUP_CHANGED_REQUIRES_REVIEW'

export type SourceTextComparison =
  | Readonly<{
      status: 'blocked'
      reason:
        | 'invalid_snapshot'
        | 'unmatched_source_or_sequence'
        | 'snapshot_bytes_exceeded'
        | 'source_hash_or_length_mismatch'
        | 'html_unusable_or_too_complex'
    }>
  | Readonly<{
      status: 'research_comparison_only'
      disposition: TextComparisonDisposition
      sourceFamily: 'SIX' | 'FOUR'
      destinationCode: string
      sourceKey: string
      oldRawSha: string
      newRawSha: string
      oldVisibleTextSha: string
      newVisibleTextSha: string
      oldLinkAndFormSha: string
      newLinkAndFormSha: string
      oldTextFragments: number
      newTextFragments: number
      changedOrRemovedFragments: number
      changedOrAddedFragments: number
      reviewRequired: true
      legalRuleApproved: false
      publicationAllowed: false
      acceptedFacts: 0
      modelCalls: 0
      databaseWrites: 0
    }>

type TextView = Readonly<{
  textSha: string
  linksSha: string
  fragments: readonly string[]
}>

const DENIED = (reason: Extract<SourceTextComparison, { status: 'blocked' }>['reason']) =>
  Object.freeze({ status: 'blocked', reason } as const)

function hash(s: string): string {
  return createHash('sha256').update(s, 'utf8').digest('hex')
}

/** Strict plain own properties; never execute model/source-provided getters. */
function snapshot(raw: unknown): OfficialSourceResearchSnapshot | null {
  if (!raw || typeof raw !== 'object' || types.isProxy(raw) || Array.isArray(raw)) return null
  if (Object.getPrototypeOf(raw) !== Object.prototype) return null
  const fields = ['sourceFamily','destinationCode','sourceKey','batchId','rawSha','bodyBytes','html'] as const
  const descriptors = Object.getOwnPropertyDescriptors(raw)
  const keys = Reflect.ownKeys(descriptors)
  if (keys.length !== fields.length || keys.some(key => typeof key !== 'string' || !fields.includes(key as typeof fields[number]))) return null
  const data: Record<string, unknown> = {}
  for (const field of fields) {
    const d = descriptors[field]
    if (!d || !d.enumerable || !('value' in d)) return null
    data[field] = d.value
  }
  if (data.sourceFamily !== 'SIX' && data.sourceFamily !== 'FOUR') return null
  if (typeof data.destinationCode !== 'string' || !/^[A-Z]{2}$/.test(data.destinationCode)) return null
  if (typeof data.sourceKey !== 'string' || !/^[a-z][a-z0-9-]{1,63}$/.test(data.sourceKey)) return null
  if (data.sourceFamily === 'FOUR' && data.sourceKey !== 'primary') return null
  if (typeof data.batchId !== 'number' || !Number.isSafeInteger(data.batchId) || data.batchId < 1) return null
  if (typeof data.rawSha !== 'string' || !/^[a-f0-9]{64}$/.test(data.rawSha)) return null
  if (typeof data.bodyBytes !== 'number' || !Number.isSafeInteger(data.bodyBytes) || data.bodyBytes < 1) return null
  if (typeof data.html !== 'string') return null
  return data as OfficialSourceResearchSnapshot
}

function children(node: Node): Node[] {
  return 'childNodes' in node ? node.childNodes : []
}
function element(node: Node): node is Element {
  return 'tagName' in node
}
function textFragment(value: string): string {
  return value.normalize('NFC').replace(/\u00a0/g, ' ').replace(/\s+/g, ' ').trim()
}
function fragmentsDiff(left: readonly string[], right: readonly string[]): number {
  const counts = new Map<string, number>()
  for (const value of right) counts.set(value, (counts.get(value) ?? 0) + 1)
  let removed = 0
  for (const value of left) {
    const leftCount = counts.get(value) ?? 0
    if (leftCount === 0) removed++
    else counts.set(value, leftCount - 1)
  }
  return removed
}

/**
 * A *screen*, not an authoritative HTML/identity verifier. It excludes
 * executable/inert nodes from the text signature but NEVER ignores those
 * bytes as legal evidence: raw SHA differences always require review.
 * Link and form targets get an independent digest; raw URLs are never
 * surfaced in output, logged, followed or normalized into an authority.
 */
function readText(html: string): TextView | null {
  if (!/<!doctype\s+html\b|<html(?:\s|>)/i.test(html.slice(0,4096))) return null
  let root: Node
  try { root = parse(html) } catch { return null }
  let body: Node | null = null
  const toFind: Node[] = [root]
  let discovered = 0
  while (toFind.length) {
    const node = toFind.pop()!
    if (++discovered > NODE_LIMIT) return null
    if (element(node) && node.tagName === 'body') { body = node; break }
    toFind.push(...children(node).slice().reverse())
  }
  if (!body) return null

  const stack: { node: Node; depth: number }[] = [{ node: body, depth: 0 }]
  const parts: string[] = [], hrefs: string[] = []
  let nodes = discovered, textChars = 0
  while (stack.length) {
    const { node, depth } = stack.pop()!
    if (++nodes > NODE_LIMIT || depth > DEPTH_LIMIT) return null
    if (element(node)) {
      if (INERT.has(node.tagName)) continue
      if (node.tagName === 'a' || node.tagName === 'form') {
        const attrName = node.tagName === 'a' ? 'href' : 'action'
        const target = node.attrs.filter(a => a.name === attrName)
        if (target.length > 1) return null
        if (target.length === 1) {
          const raw = target[0]!.value
          if (raw.length > 2048 || ++nodes > NODE_LIMIT) return null
          hrefs.push(node.tagName + ':' + raw.trim())
          if (hrefs.length > LINKS_LIMIT) return null
        }
      }
    } else if (node.nodeName === '#text') {
      const part = textFragment((node as DefaultTreeAdapterMap['textNode']).value)
      if (part.length) {
        textChars += part.length
        if (textChars > TEXT_LIMIT || parts.length >= FRAGMENT_LIMIT) return null
        parts.push(part)
      }
    }
    const next = children(node)
    for (let i = next.length - 1; i >= 0; i--) stack.push({ node: next[i]!, depth: depth + 1 })
  }

  const joined = parts.join(' ')
  if (joined.length < 40 || joined.length > TEXT_LIMIT + FRAGMENT_LIMIT) return null
  return Object.freeze({
    textSha: hash(joined),
    linksSha: hash(JSON.stringify(hrefs)),
    fragments: Object.freeze(parts),
  })
}

/** Research classification only: no positive fact even on exact agreement. */
export function officialTruthQuellenTextVergleich(
  original: unknown,
  changed: unknown,
): SourceTextComparison {
  const first = snapshot(original), second = snapshot(changed)
  if (!first || !second) return DENIED('invalid_snapshot')
  if (
    first.sourceFamily !== second.sourceFamily ||
    first.destinationCode !== second.destinationCode ||
    first.sourceKey !== second.sourceKey ||
    first.batchId >= second.batchId
  ) return DENIED('unmatched_source_or_sequence')
  if (first.bodyBytes > BODY_LIMIT_BYTES || second.bodyBytes > BODY_LIMIT_BYTES)
    return DENIED('snapshot_bytes_exceeded')
  if (
    Buffer.byteLength(first.html,'utf8') !== first.bodyBytes ||
    Buffer.byteLength(second.html,'utf8') !== second.bodyBytes ||
    hash(first.html) !== first.rawSha ||
    hash(second.html) !== second.rawSha
  ) return DENIED('source_hash_or_length_mismatch')

  const before = readText(first.html), after = readText(second.html)
  if (!before || !after) return DENIED('html_unusable_or_too_complex')
  const disposition: TextComparisonDisposition =
    first.rawSha === second.rawSha ? 'RAW_IDENTICAL_RESEARCH_ONLY'
    : before.textSha !== after.textSha ? 'VISIBLE_TEXT_CHANGED_REQUIRES_REVIEW'
    : before.linksSha !== after.linksSha ? 'FORM_OR_LINK_CHANGED_REQUIRES_REVIEW'
    : 'NONVISIBLE_MARKUP_CHANGED_REQUIRES_REVIEW'
  return Object.freeze({
    status: 'research_comparison_only',
    disposition,
    sourceFamily: first.sourceFamily,
    destinationCode: first.destinationCode,
    sourceKey: first.sourceKey,
    oldRawSha: first.rawSha,
    newRawSha: second.rawSha,
    oldVisibleTextSha: before.textSha,
    newVisibleTextSha: after.textSha,
    oldLinkAndFormSha: before.linksSha,
    newLinkAndFormSha: after.linksSha,
    oldTextFragments: before.fragments.length,
    newTextFragments: after.fragments.length,
    changedOrRemovedFragments: fragmentsDiff(before.fragments, after.fragments),
    changedOrAddedFragments: fragmentsDiff(after.fragments, before.fragments),
    reviewRequired: true,
    legalRuleApproved: false,
    publicationAllowed: false,
    acceptedFacts: 0,
    modelCalls: 0,
    databaseWrites: 0,
  })
}
