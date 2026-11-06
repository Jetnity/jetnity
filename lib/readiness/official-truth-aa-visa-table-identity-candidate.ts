// Dormant AA document-identity candidate. Not registered and not source custody,
// response-completeness proof, legal extraction or authority to widen a budget.
import { types } from 'node:util'
import { Parser, type DefaultTreeAdapterMap, type ParserError } from 'parse5'
import type { ContentIdentityProfileDefinition } from './official-truth-content-identity'

const URL = 'https://www.auswaertiges-amt.de/de/service/visa-und-aufenthalt/staatenliste-zur-visumpflicht-207820'
const TITLE = 'Übersicht zur Visumpflicht bzw. -freiheit bei Einreise in die Bundesrepublik Deutschland'
const AUTHORITY = 'Auswärtiges Amt'
const PROFILE_ID = 'de-aa-visa-table-html-de-candidate'
// These labels are Jetnity conventions, not externally issued authority IDs.
const NAMESPACE = 'aa-content-id'
const AUTHORITY_LABEL = 'auswaertiges-amt'
const HTML_NAMESPACE = 'http://www.w3.org/1999/xhtml'
const MAX_BYTES = 131_072, MAX_NODES = 10_000, MAX_DEPTH = 64, MAX_PARSE_ERRORS = 64
const DOCUMENT_TAGS = ['html', 'head', 'body', 'main', 'title']
const IDENTITY_TAGS = [...DOCUMENT_TAGS, 'h1', 'link', 'meta']
const INVALID = Object.freeze({ ok: false as const, reason: 'invalid_response' as const })
const MISMATCH = Object.freeze({ ok: false as const, reason: 'identity_mismatch' as const })
const INPUT_FIELDS = ['item', 'representation', 'responseText', 'finalUrl', 'mediaType']
const ITEM_FIELDS = ['sourceId', 'contentItemId', 'contentItemVersion', 'current',
  'externalIdNamespace', 'externalContentId', 'expectedPublisherIds', 'expectedAuthorityIds']
const REPRESENTATION_FIELDS = ['sourceId', 'contentItemId', 'contentItemVersion',
  'representationId', 'representationVersion', 'current', 'requestUrls', 'expectedFinalUrl',
  'expectedMediaType', 'identityProfileId', 'identityProfileVersion', 'expectedLocale', 'expectedSchema']

type Node = DefaultTreeAdapterMap['node']
type Element = DefaultTreeAdapterMap['element']
type TagToken = Parameters<Parser<DefaultTreeAdapterMap>['onStartTag']>[0]

/** parse5 8.0.0 can silently discard a second html/body token. Observe its
 * instance-local callbacks before tree repair; every token is forwarded intact.
 * This relies on the pinned Parser API and does not replace HTML tokenization. */
class IdentityDocumentParser extends Parser<DefaultTreeAdapterMap> {
  readonly starts = new Map<string, number>()
  readonly ends = new Map<string, number>()
  readonly identityStarts: { startOffset: number; endOffset: number }[] = []
  foreignMarkup = false
  private readonly observed = new WeakSet<TagToken>()
  private count(token: TagToken, counts: Map<string, number>): void {
    if (this.observed.has(token)) return
    this.observed.add(token)
    if (DOCUMENT_TAGS.includes(token.tagName)) {
      counts.set(token.tagName, (counts.get(token.tagName) ?? 0) + 1)
    }
  }
  override onStartTag(token: TagToken): void {
    // The observed document is HTML-only. A nonidentity token can break out of
    // SVG/MathML before H1 arrives, so reject the entire foreign-markup class.
    // Native callbacks exclude literal markup inside scripts and comments.
    if (this.currentNotInHTML || token.tagName === 'svg' || token.tagName === 'math') {
      this.foreignMarkup = true
    }
    // Classify by tag before retained attributes or DOM repair can conceal a
    // duplicate canonical/author attribute behind an unrelated first value.
    if (!this.observed.has(token) && IDENTITY_TAGS.includes(token.tagName)) {
      if (!token.location || this.identityStarts.length >= MAX_NODES) throw INVALID
      this.identityStarts.push({ startOffset: token.location.startOffset, endOffset: token.location.endOffset })
    }
    this.count(token, this.starts)
    super.onStartTag(token)
  }
  override onEndTag(token: TagToken): void {
    this.count(token, this.ends)
    super.onEndTag(token)
  }
}

/** Read a stable data-property copy; malformed caller objects never run getters. */
function record(value: unknown, fields: readonly string[]): Record<string, unknown> | null {
  if (!value || typeof value !== 'object' || types.isProxy(value)
    || Object.getPrototypeOf(value) !== Object.prototype) return null
  const descriptors = Object.getOwnPropertyDescriptors(value)
  const keys = Reflect.ownKeys(descriptors)
  if (keys.length !== fields.length || keys.some(key => typeof key !== 'string' || !fields.includes(key))) return null
  const result: Record<string, unknown> = {}
  for (const key of fields) {
    const descriptor = descriptors[key]
    if (!descriptor || !descriptor.enumerable || !('value' in descriptor)) return null
    result[key] = descriptor.value
  }
  return result
}
function singleton(value: unknown, expected: string): boolean {
  if (!Array.isArray(value) || types.isProxy(value) || Object.getPrototypeOf(value) !== Array.prototype) return false
  const keys = Reflect.ownKeys(value)
  const first = Object.getOwnPropertyDescriptor(value, '0')
  const size = Object.getOwnPropertyDescriptor(value, 'length')
  return keys.length === 2 && keys.includes('0') && keys.includes('length')
    && !!first && 'value' in first && first.enumerable === true
    && first.value === expected && size?.value === 1
}
function identifier(value: unknown): value is string {
  return typeof value === 'string' && /^[a-z][a-z0-9_-]{1,63}$/.test(value)
}
function version(value: unknown): value is number {
  return typeof value === 'number' && Number.isInteger(value) && value >= 1 && value <= 2_147_483_647
}
function element(node: Node): node is Element { return 'tagName' in node }
function attribute(node: Element, name: string): string | undefined {
  return node.attrs.find(attr => attr.name === name && !attr.namespace)?.value
}
function classes(node: Element): string[] { return (attribute(node, 'class') ?? '').split(/\s+/).filter(Boolean) }
function normal(text: string): string { return text.replace(/\s+/g, ' ').trim() }

/** Includes template contents for duplicate detection, never for accepting an anchor. */
function nodesWithin(root: Node): Node[] {
  const nodes: Node[] = [], pending: { node: Node; depth: number }[] = [{ node: root, depth: 0 }]
  while (pending.length) {
    const { node, depth } = pending.pop()!
    if (nodes.length >= MAX_NODES || depth > MAX_DEPTH) throw INVALID
    nodes.push(node)
    if ('childNodes' in node) for (const child of node.childNodes.slice().reverse()) pending.push({ node: child, depth: depth + 1 })
    if (element(node) && node.tagName === 'template' && 'content' in node) {
      pending.push({ node: node.content as DefaultTreeAdapterMap['documentFragment'], depth: depth + 1 })
    }
  }
  return nodes
}
function explicitPair(node: Element): boolean {
  return node.namespaceURI === HTML_NAMESPACE && !!node.sourceCodeLocation?.startTag && !!node.sourceCodeLocation.endTag
}
function sourceContains(parent: Element, child: Node): boolean {
  const outer = parent.sourceCodeLocation, inner = child.sourceCodeLocation
  return !!outer?.startTag && !!outer.endTag && !!inner
    && outer.startTag.endOffset <= inner.startOffset && inner.endOffset <= outer.endTag.startOffset
}
function text(root: Element): string | null {
  const nodes = nodesWithin(root), parts: string[] = []
  for (const node of nodes) {
    if (node.nodeName === '#text' && 'value' in node) parts.push(node.value)
    else if (node !== root && (!element(node) || node.tagName !== 'span' || node.namespaceURI !== HTML_NAMESPACE)) return null
  }
  return normal(parts.join(''))
}
function hiddenOrActive(node: Element): boolean {
  if (node.namespaceURI !== HTML_NAMESPACE
    || ['template', 'script', 'style', 'noscript', 'iframe', 'svg', 'math', 'details', 'dialog'].includes(node.tagName)) return true
  // External CSS and script behaviour are not evaluated. Reject explicit hiding
  // and all inline styling on the heading chain instead of interpreting CSS.
  if (attribute(node, 'hidden') !== undefined || attribute(node, 'inert') !== undefined
    || (attribute(node, 'aria-hidden') !== undefined && attribute(node, 'aria-hidden') !== 'false')
    || normal(attribute(node, 'style') ?? '') !== '') return true
  return classes(node).some(value => ['hidden', 'is-hidden', 'is-aural', 'sr-only', 'visually-hidden', 'd-none'].includes(value))
}

function documentMatches(responseText: string): boolean {
  const errors: ParserError[] = []
  const parser = new IdentityDocumentParser({ sourceCodeLocationInfo: true, onParseError(error) {
    if (errors.length >= MAX_PARSE_ERRORS) throw INVALID
    errors.push(error)
  } })
  parser.tokenizer.write(responseText, true)
  if (parser.foreignMarkup) return false
  if (DOCUMENT_TAGS.some(name => parser.starts.get(name) !== 1 || parser.ends.get(name) !== 1)) return false
  const document = parser.document
  const nodes = nodesWithin(document), elements = nodes.filter(element)
  const critical = new Set<Element>()
  const unique = (name: string): Element | null => {
    const matches = elements.filter(node => node.tagName === name)
    return matches.length === 1 ? matches[0]! : null
  }
  const html = unique('html'), head = unique('head'), body = unique('body'), main = unique('main'), title = unique('title')
  if (document.mode !== 'no-quirks' || !html || !head || !body || !main || !title
    || ![html, head, body, main, title].every(explicitPair)
    || html.parentNode !== document || head.parentNode !== html || body.parentNode !== html
    || !sourceContains(html, head) || !sourceContains(html, body)
    || title.parentNode !== head || attribute(html, 'lang') !== 'de'
    || (attribute(html, 'xml:lang') !== undefined && attribute(html, 'xml:lang') !== 'de')
    || attribute(main, 'id') !== 'main' || !sourceContains(head, title)
    || text(title) !== `${TITLE} - ${AUTHORITY}`) return false
  for (const node of [html, head, body, main, title]) critical.add(node)

  const canonicals = elements.filter(node => node.tagName === 'link'
    && (attribute(node, 'rel') ?? '').toLowerCase().split(/\s+/).includes('canonical'))
  if (canonicals.length !== 1) return false
  const canonical = canonicals[0]!
  if (canonical.parentNode !== head || canonical.namespaceURI !== HTML_NAMESPACE || !sourceContains(head, canonical)
    || attribute(canonical, 'rel') !== 'canonical' || attribute(canonical, 'href') !== URL
    || canonical.attrs.some(attr => !['rel', 'href'].includes(attr.name) || !!attr.namespace)) return false
  critical.add(canonical)

  const metadata = [['name', 'author', AUTHORITY], ['property', 'og:url', URL],
    ['property', 'og:site_name', AUTHORITY], ['property', 'og:type', 'article'],
    ['property', 'og:locale', 'de'], ['property', 'og:title', TITLE]] as const
  for (const [kind, key, expected] of metadata) {
    const matches = elements.filter(node => node.tagName === 'meta' && attribute(node, kind)?.toLowerCase() === key)
    if (matches.length !== 1) return false
    const meta = matches[0]!
    const content = attribute(meta, 'content')
    const actual = ['author', 'og:site_name', 'og:title'].includes(key) ? normal(content ?? '') : content
    if (meta.parentNode !== head || meta.namespaceURI !== HTML_NAMESPACE || !sourceContains(head, meta) || attribute(meta, kind) !== key
      || actual !== expected
      || meta.attrs.some(attr => ![kind, 'content'].includes(attr.name) || !!attr.namespace)) return false
    critical.add(meta)
  }

  const headings = elements.filter(node => node.tagName === 'h1'
    && (classes(node).includes('heading__title') || text(node) === TITLE))
  if (headings.length !== 1) return false
  const heading = headings[0]!
  if (!explicitPair(heading) || !classes(heading).includes('heading__title') || text(heading) !== TITLE) return false
  for (const descendant of nodesWithin(heading)) {
    if (element(descendant)) {
      if (hiddenOrActive(descendant) || !explicitPair(descendant)) return false
      critical.add(descendant)
    }
  }
  const headingAncestors = new Set<Element>()
  let parent: Node | null = heading, child: Node | null = null, foundMain = false, foundBody = false
  while (parent && parent !== document) {
    if (!element(parent) || hiddenOrActive(parent) || (child && !sourceContains(parent, child))) return false
    critical.add(parent)
    headingAncestors.add(parent)
    foundMain ||= parent === main
    foundBody ||= parent === body
    child = parent
    parent = parent.parentNode
  }
  if (parent !== document || !foundMain || !foundBody) return false
  // A foster-parented heading must not escape its original table/other wrapper.
  if (elements.some(node => node !== heading && sourceContains(node, heading) && !headingAncestors.has(node))) return false

  const ids = nodes.filter(node => node.nodeName === '#comment' && 'data' in node && /^\s*ID\s*:/i.test(node.data))
  if (ids.length !== 1 || !('data' in ids[0]!) || !/^\s*ID\s*:\s*207820\s*\/\s*Version\s*:\s*\d{1,10}\s*$/.test(ids[0]!.data)) return false
  let idParent: Node | null = 'parentNode' in ids[0]! ? ids[0]!.parentNode : null
  let idChild: Node = ids[0]!
  while (idParent && idParent !== body) {
    if (!element(idParent) || hiddenOrActive(idParent) || !sourceContains(idParent, idChild)) return false
    critical.add(idParent)
    idChild = idParent
    idParent = idParent.parentNode
  }
  if (idParent !== body || !sourceContains(body, idChild)) return false

  // The observed page has one duplicate H2 attribute in unrelated navigation.
  // Any identity-capable token is excluded, even if its first attribute or DOM
  // repair hides its identity role. H1/native-ID ancestry is protected too.
  for (const error of errors) {
    if (error.code !== 'duplicate-attribute' || !Number.isInteger(error.startOffset) || error.startOffset < 0) throw INVALID
    if (parser.identityStarts.some(location => error.startOffset >= location.startOffset && error.startOffset <= location.endOffset)) throw INVALID
    for (const node of critical) {
      const location = node.sourceCodeLocation?.startTag ?? node.sourceCodeLocation
      if (!location || (error.startOffset >= location.startOffset && error.startOffset <= location.endOffset)) throw INVALID
    }
  }
  return true
}

/** Conditional document consistency only: the caller must separately establish
 * trusted origin, a complete response, admission, extraction and legal scope.
 * current=false and no registry import deliberately keep this candidate inert. */
export const AA_VISA_TABLE_IDENTITY_CANDIDATE: ContentIdentityProfileDefinition = Object.freeze({
  identityProfileId: PROFILE_ID, identityProfileVersion: 1, current: false,
  verify(input) {
    try {
      const row = record(input, INPUT_FIELDS)
      const item = row && record(row.item, ITEM_FIELDS)
      const rep = row && record(row.representation, REPRESENTATION_FIELDS)
      if (!row || !item || !rep) return INVALID
      if (!identifier(item.sourceId) || !identifier(item.contentItemId) || !version(item.contentItemVersion)
        || !identifier(rep.representationId) || !version(rep.representationVersion)
        || item.current !== true || item.externalIdNamespace !== NAMESPACE || item.externalContentId !== '207820'
        || !singleton(item.expectedPublisherIds, AUTHORITY_LABEL) || !singleton(item.expectedAuthorityIds, AUTHORITY_LABEL)
        || rep.sourceId !== item.sourceId || rep.contentItemId !== item.contentItemId || rep.contentItemVersion !== item.contentItemVersion
        || rep.current !== true || rep.identityProfileId !== PROFILE_ID || rep.identityProfileVersion !== 1
        || !singleton(rep.requestUrls, URL) || rep.expectedFinalUrl !== URL || rep.expectedMediaType !== 'text/html'
        || rep.expectedLocale !== 'de' || rep.expectedSchema !== 'article'
        || row.finalUrl !== URL || row.mediaType !== 'text/html') return MISMATCH
      const html = row.responseText
      if (typeof html !== 'string' || html.length === 0 || html.length > MAX_BYTES || !html.isWellFormed()
        || html.startsWith('\uFEFF') || html.includes('\0') || new TextEncoder().encode(html).length > MAX_BYTES) return INVALID
      if (!documentMatches(html)) return MISMATCH
      return Object.freeze({ ok: true as const, identity: Object.freeze({
        sourceId: item.sourceId, contentItemId: item.contentItemId, contentItemVersion: item.contentItemVersion,
        representationId: rep.representationId, representationVersion: rep.representationVersion,
        identityProfileId: PROFILE_ID, identityProfileVersion: 1,
      }) })
    } catch { return INVALID }
  },
})
