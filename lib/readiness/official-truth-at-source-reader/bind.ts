import { sha256Hex } from '@/lib/readiness/digest'
import { atOfficialPublicationById, type AtOfficialPublication } from './publications'

const ISO_UTC = /^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}\.\d{3}Z$/
const STAND = /\(\s*Stand\s*:\s*(\d{1,2})\.(\d{1,2})\.(\d{4})\s*\)/g

export type AtVersionObservation =
  | Readonly<{ status: 'absent'; token: null; approvedVersion: null }>
  | Readonly<{ status: 'single_observed_token'; token: string; approvedVersion: null }>
  | Readonly<{ status: 'ambiguous'; token: null; approvedVersion: null }>

export type AtBindRejection =
  | 'unknown_publication'
  | 'url_mismatch'
  | 'redirect_refused'
  | 'http_status'
  | 'content_type'
  | 'body_limit'
  | 'empty_body'
  | 'invalid_utf8'
  | 'clock'
  | 'title_unbound'
  | 'identity_mismatch'
  | 'url_not_pinned'
  | 'dns_failed'
  | 'address_refused'
  | 'http_failed'
  | 'encoding'
  | 'framing'
  | 'timeout'

export type AtBoundSource = Readonly<{
  status: 'bound'
  publicationId: AtOfficialPublication['id']
  requestUrl: string
  finalUrl: string
  httpStatus: 200
  contentType: 'text/html'
  byteLength: number
  sha256: string
  retrievedAt: string
  title: string
  versionObservation: AtVersionObservation
  legalClassification: 'not_performed'
  byteOrderMark: boolean
  lastModifiedHeader: string | null
  lastModifiedIsVersionPin: false
}>

export type AtBindResult =
  | AtBoundSource
  | Readonly<{ status: 'rejected'; publicationId: string; reason: AtBindRejection }>

export type AtRetrievalInput = Readonly<{
  publicationId: string
  requestUrl: string
  finalUrl: string
  redirectCount: number
  httpStatus: number
  contentType: string | null
  body: Uint8Array
  startedAt: string
  retrievedAt: string
  lastModifiedHeader: string | null
}>

export function atOfficialMediaType(value: string | null): 'text/html' | null {
  if (value == null) return null
  if (value.includes(',')) return null
  const parts = value.split(';')
  const media = parts.shift()?.trim().toLowerCase() ?? ''
  if (media !== 'text/html') return null
  let charset = false
  for (const parameter of parts) {
    const piece = parameter.trim()
    if (piece === '') return null
    if (/^charset\s*=/i.test(piece)) {
      if (charset || !/^charset\s*=\s*(?:utf-8|"utf-8")$/i.test(piece)) return null
      charset = true
    } else return null
  }
  return 'text/html'
}

function normalTitle(value: string): string {
  return value.replace(/\s+/g, ' ').trim()
}

function stripOneTrailingSlash(value: string): string {
  return value.endsWith('/') ? value.slice(0, -1) : value
}

function decodeUtf8(bytes: Uint8Array): { text: string; byteOrderMark: boolean } | null {
  if (bytes.byteLength === 0 || bytes.includes(0)) return null
  const byteOrderMark = bytes[0] === 0xef && bytes[1] === 0xbb && bytes[2] === 0xbf
  try {
    const decoded = new TextDecoder('utf-8', { fatal: true }).decode(bytes)
    // TextDecoder drops a leading BOM. Keep U+FEFF in the hashed text when the
    // wire bytes actually started with one, so the digest covers those bytes.
    const text = byteOrderMark ? `\uFEFF${decoded}` : decoded
    return text.includes('\u0000') ? null : { text, byteOrderMark }
  } catch {
    return null
  }
}

function singleTitle(html: string): string | null {
  const matches = [...html.matchAll(/<title\b[^>]*>([\s\S]*?)<\/title>/gi)]
  if (matches.length !== 1) return null
  const raw = matches[0]?.[1] ?? ''
  if (raw.includes('<') || raw.includes('>')) return null
  const title = normalTitle(raw)
  return title.length > 0 && title.length <= 300 ? title : null
}

function canonicalSet(html: string): ReadonlySet<string> | null {
  const hrefs = new Set<string>()
  for (const tag of html.matchAll(/<link\b[^>]*>/gi)) {
    const raw = tag[0] ?? ''
    if (!/\brel\s*=\s*["'][^"']*\bcanonical\b[^"']*["']/i.test(raw)) continue
    const href = raw.match(/\bhref\s*=\s*["']([^"']+)["']/i)?.[1]?.trim()
    if (!href || href.startsWith('//') || href.startsWith('/') || !/^https:\/\//i.test(href)) return null
    hrefs.add(stripOneTrailingSlash(href))
  }
  return hrefs
}

function versionObservation(html: string): AtVersionObservation {
  const tokens = new Set<string>()
  for (const match of html.matchAll(STAND)) {
    const day = Number(match[1])
    const month = Number(match[2])
    const year = Number(match[3])
    if (!Number.isInteger(day) || !Number.isInteger(month) || !Number.isInteger(year)
      || day < 1 || day > 31 || month < 1 || month > 12 || year < 1900 || year > 2100) {
      return Object.freeze({ status: 'ambiguous', token: null, approvedVersion: null })
    }
    tokens.add(`${day}.${month}.${year}`)
    if (tokens.size > 1) return Object.freeze({ status: 'ambiguous', token: null, approvedVersion: null })
  }
  if (tokens.size === 0) return Object.freeze({ status: 'absent', token: null, approvedVersion: null })
  return Object.freeze({ status: 'single_observed_token', token: [...tokens][0]!, approvedVersion: null })
}

function clockOk(startedAt: string, retrievedAt: string): boolean {
  return ISO_UTC.test(startedAt) && ISO_UTC.test(retrievedAt) && retrievedAt >= startedAt
}

/** Binds retrieval bytes to one pinned publication. A Stand token is an
 * observation for the Technical Lead. It is never an approved legal version. */
export function bindAtOfficialRetrieval(input: AtRetrievalInput): AtBindResult {
  const publication = atOfficialPublicationById(input.publicationId)
  if (!publication) return Object.freeze({ status: 'rejected', publicationId: input.publicationId, reason: 'unknown_publication' })
  const reject = (reason: AtBindRejection): AtBindResult =>
    Object.freeze({ status: 'rejected', publicationId: publication.id, reason })
  if (input.requestUrl !== publication.url || input.finalUrl !== publication.url) return reject('url_mismatch')
  if (input.redirectCount !== 0) return reject('redirect_refused')
  if (input.httpStatus !== 200) return reject('http_status')
  if (atOfficialMediaType(input.contentType) !== 'text/html') return reject('content_type')
  if (input.body.byteLength === 0) return reject('empty_body')
  if (input.body.byteLength > publication.maximumBytes) return reject('body_limit')
  if (!clockOk(input.startedAt, input.retrievedAt)) return reject('clock')
  const decoded = decodeUtf8(input.body)
  if (decoded == null) return input.body.byteLength === 0 ? reject('empty_body') : reject('invalid_utf8')
  const text = decoded.text
  const title = singleTitle(text)
  if (!title) return reject('title_unbound')
  if (title !== publication.expectedTitle) return reject('identity_mismatch')
  if (!text.includes(publication.hostname)) return reject('identity_mismatch')
  const canonicals = canonicalSet(text)
  if (canonicals === null) return reject('identity_mismatch')
  if (canonicals.size > 0) {
    const expected = stripOneTrailingSlash(publication.url)
    if (canonicals.size !== 1 || !canonicals.has(expected)) return reject('identity_mismatch')
  }
  return Object.freeze({
    status: 'bound',
    publicationId: publication.id,
    requestUrl: publication.url,
    finalUrl: publication.url,
    httpStatus: 200,
    contentType: 'text/html',
    byteLength: input.body.byteLength,
    sha256: sha256Hex(text),
    retrievedAt: input.retrievedAt,
    title,
    versionObservation: versionObservation(text),
    legalClassification: 'not_performed',
    byteOrderMark: decoded.byteOrderMark,
    lastModifiedHeader: input.lastModifiedHeader,
    lastModifiedIsVersionPin: false,
  })
}
