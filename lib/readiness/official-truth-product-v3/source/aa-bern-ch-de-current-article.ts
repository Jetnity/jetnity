// Fixed current AA/Bern document programs. Identity and semantics are data
// checks only; original HTTP custody and current Owner method approval are separate.
import 'server-only'
import { types } from 'node:util'
import { Parser, type DefaultTreeAdapterMap, type ParserError } from 'parse5'
import { sha256Hex } from '@/lib/readiness/digest'
import type { ContentIdentityProfileDefinition } from '@/lib/readiness/official-truth-content-identity'
import type { AaChDeSemanticResult, AaChDeSourceRole } from './aa-ch-de-definition'

type DocumentSpec = Readonly<{
  url: string; title: string; site: string; nativeId: string;
  profileId: string; publisherId: string; authorityId: string; reviewedMainSha256: string;
}>
export const AA_BERN_REVIEWED_DOCUMENTS = Object.freeze({
  primary: Object.freeze({
    url: 'https://www.auswaertiges-amt.de/de/service/visa-und-aufenthalt/staatenliste-zur-visumpflicht-207820',
    title: 'Übersicht zur Visumpflicht bzw. -freiheit bei Einreise in die Bundesrepublik Deutschland',
    site: 'Auswärtiges Amt', nativeId: '207820',
    profileId: 'de-aa-visa-table-html-de-reviewed', publisherId: 'auswaertiges-amt', authorityId: 'auswaertiges-amt',
    reviewedMainSha256: '8f2eb46fa8e0d0a1b8eeac2cfa98f7d43691f48b41a3eae2d10b29edb6f1f3df',
  }),
  counter: Object.freeze({
    url: 'https://bern.diplo.de/ch-de/service/visumundeinreise/2611474-2611474',
    title: 'Einreise und Aufenthalt in Deutschland', site: '', nativeId: '2611474',
    profileId: 'de-bern-entry-html-de-reviewed', publisherId: 'deutsche-botschaft-bern', authorityId: 'auswaertiges-amt',
    reviewedMainSha256: '0e06d5fbd0a09b5c5fa61c4ee26f8432dcb7d1310a8b7383b174b5cae03c3956',
  }),
})
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

function documentMain(responseText: string, spec: DocumentSpec): Element | null {
  const URL = spec.url, TITLE = spec.title, AUTHORITY = 'Auswärtiges Amt'
  const errors: ParserError[] = []
  const parser = new IdentityDocumentParser({ sourceCodeLocationInfo: true, onParseError(error) {
    if (errors.length >= MAX_PARSE_ERRORS) throw INVALID
    errors.push(error)
  } })
  parser.tokenizer.write(responseText, true)
  if (parser.foreignMarkup) return null
  if (DOCUMENT_TAGS.some(name => parser.starts.get(name) !== 1 || parser.ends.get(name) !== 1)) return null
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
    || text(title) !== `${TITLE} - ${AUTHORITY}`) return null
  for (const node of [html, head, body, main, title]) critical.add(node)

  const canonicals = elements.filter(node => node.tagName === 'link'
    && (attribute(node, 'rel') ?? '').toLowerCase().split(/\s+/).includes('canonical'))
  if (canonicals.length !== 1) return null
  const canonical = canonicals[0]!
  if (canonical.parentNode !== head || canonical.namespaceURI !== HTML_NAMESPACE || !sourceContains(head, canonical)
    || attribute(canonical, 'rel') !== 'canonical' || attribute(canonical, 'href') !== URL
    || canonical.attrs.some(attr => !['rel', 'href'].includes(attr.name) || !!attr.namespace)) return null
  critical.add(canonical)

  const metadata = [['name', 'author', AUTHORITY], ['property', 'og:url', URL],
    ['property', 'og:site_name', spec.site], ['property', 'og:type', 'article'],
    ['property', 'og:locale', 'de'], ['property', 'og:title', TITLE]] as const
  for (const [kind, key, expected] of metadata) {
    const matches = elements.filter(node => node.tagName === 'meta' && attribute(node, kind)?.toLowerCase() === key)
    if (matches.length !== 1) return null
    const meta = matches[0]!
    const content = attribute(meta, 'content')
    const actual = ['author', 'og:site_name', 'og:title'].includes(key) ? normal(content ?? '') : content
    if (content === undefined || meta.parentNode !== head || meta.namespaceURI !== HTML_NAMESPACE || !sourceContains(head, meta) || attribute(meta, kind) !== key
      || actual !== expected
      || meta.attrs.some(attr => ![kind, 'content'].includes(attr.name) || !!attr.namespace)) return null
    critical.add(meta)
  }

  const headings = elements.filter(node => node.tagName === 'h1'
    && (classes(node).includes('heading__title') || text(node) === TITLE))
  if (headings.length !== 1) return null
  const heading = headings[0]!
  if (!explicitPair(heading) || !classes(heading).includes('heading__title') || text(heading) !== TITLE) return null
  for (const descendant of nodesWithin(heading)) {
    if (element(descendant)) {
      if (hiddenOrActive(descendant) || !explicitPair(descendant)) return null
      critical.add(descendant)
    }
  }
  const headingAncestors = new Set<Element>()
  let parent: Node | null = heading, child: Node | null = null, foundMain = false, foundBody = false
  while (parent && parent !== document) {
    if (!element(parent) || hiddenOrActive(parent) || (child && !sourceContains(parent, child))) return null
    critical.add(parent)
    headingAncestors.add(parent)
    foundMain ||= parent === main
    foundBody ||= parent === body
    child = parent
    parent = parent.parentNode
  }
  if (parent !== document || !foundMain || !foundBody) return null
  // A foster-parented heading must not escape its original table/other wrapper.
  if (elements.some(node => node !== heading && sourceContains(node, heading) && !headingAncestors.has(node))) return null

  const ids = nodes.filter(node => node.nodeName === '#comment' && 'data' in node && /^\s*ID\s*:/i.test(node.data))
  if (ids.length !== 1 || !('data' in ids[0]!) || !new RegExp('^\\s*ID\\s*:\\s*' + spec.nativeId + '\\s*\\/\\s*Version\\s*:\\s*\\d{1,10}\\s*$').test(ids[0]!.data)) return null
  let idParent: Node | null = 'parentNode' in ids[0]! ? ids[0]!.parentNode : null
  let idChild: Node = ids[0]!
  while (idParent && idParent !== body) {
    if (!element(idParent) || hiddenOrActive(idParent) || !sourceContains(idParent, idChild)) return null
    critical.add(idParent)
    idChild = idParent
    idParent = idParent.parentNode
  }
  if (idParent !== body || !sourceContains(body, idChild)) return null

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
  return main
}

function boundedBody(value: unknown): value is string {
  return typeof value === 'string' && value.length > 0 && value.length <= MAX_BYTES && value.isWellFormed()
    && !value.startsWith('\uFEFF') && !value.includes('\0') && new TextEncoder().encode(value).length <= MAX_BYTES
}
function profile(spec: DocumentSpec): ContentIdentityProfileDefinition {
  return Object.freeze({
    identityProfileId: spec.profileId, identityProfileVersion: 1, current: true,
    verify(input) {
      try {
        const row=record(input,INPUT_FIELDS), item=row&&record(row.item,ITEM_FIELDS),
          rep=row&&record(row.representation,REPRESENTATION_FIELDS)
        if(!row||!item||!rep) return INVALID
        if(!identifier(item.sourceId)||!identifier(item.contentItemId)||!version(item.contentItemVersion)
          ||!identifier(rep.representationId)||!version(rep.representationVersion)||item.current!==true
          ||item.externalIdNamespace!=='aa-content-id'||item.externalContentId!==spec.nativeId
          ||!singleton(item.expectedPublisherIds,spec.publisherId)||!singleton(item.expectedAuthorityIds,spec.authorityId)
          ||rep.sourceId!==item.sourceId||rep.contentItemId!==item.contentItemId||rep.contentItemVersion!==item.contentItemVersion
          ||rep.current!==true||rep.identityProfileId!==spec.profileId||rep.identityProfileVersion!==1
          ||!singleton(rep.requestUrls,spec.url)||rep.expectedFinalUrl!==spec.url||rep.expectedMediaType!=='text/html'
          ||rep.expectedLocale!=='de'||rep.expectedSchema!=='article'||row.finalUrl!==spec.url||row.mediaType!=='text/html') return MISMATCH
        if(!boundedBody(row.responseText)) return INVALID
        if(!documentMain(row.responseText,spec)) return MISMATCH
        return Object.freeze({ok:true as const,identity:Object.freeze({
          sourceId:item.sourceId,contentItemId:item.contentItemId,contentItemVersion:item.contentItemVersion,
          representationId:rep.representationId,representationVersion:rep.representationVersion,
          identityProfileId:spec.profileId,identityProfileVersion:1,
        })})
      } catch {return INVALID}
    },
  })
}
export const AA_CH_DE_REVIEWED_IDENTITY_PROFILE = profile(AA_BERN_REVIEWED_DOCUMENTS.primary)
export const BERN_CH_DE_REVIEWED_IDENTITY_PROFILE = profile(AA_BERN_REVIEWED_DOCUMENTS.counter)

export function aaBernReviewedDocumentIdentity(role: AaChDeSourceRole, bodyText: string): boolean {
  try { return boundedBody(bodyText) && documentMain(bodyText,AA_BERN_REVIEWED_DOCUMENTS[role])!==null }
  catch { return false }
}

/** The Root-reviewed complete main includes the current article, every table
 * row, all nine AA footnotes, and Bern's Swiss and third-country sections.
 * A changed article is unresolved, never automatically treated as equivalent.
 * New owned reads with unchanged legal material can refresh source evidence.
 * The publication date is not asserted to be the beginning of legal validity. */
export function interpretAaBernReviewedArticle(role: AaChDeSourceRole, bodyText: string): AaChDeSemanticResult {
  try {
    if(!boundedBody(bodyText)) return {status:'unclear',reason:'unqualified_destination_authority'}
    const spec=AA_BERN_REVIEWED_DOCUMENTS[role], main=documentMain(bodyText,spec)
    if(!main) return {status:'unclear',reason:'unqualified_destination_authority'}
    const location=main.sourceCodeLocation
    if(!location||sha256Hex(bodyText.slice(location.startOffset,location.endOffset))!==spec.reviewedMainSha256)
      return {status:'unclear',reason:'ambiguous_statement'}
    // Swiss national passports, direct entry, visa requirement alone. No
    // promise about admission, document validity, residence, employment or90/180.
    return {status:'clear',fact:{schema:1,fact:{kind:'requirement_effect',effect:'not_required',visaMode:'visa_exempt'}},
      legalValidity:{status:'specified',validFrom:null,validUntil:null}}
  } catch {return {status:'unclear',reason:'ambiguous_statement'}}
}
