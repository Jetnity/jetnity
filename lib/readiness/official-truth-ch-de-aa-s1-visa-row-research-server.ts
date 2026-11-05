// CH→DE AA/S1: a strictly offline STRUCTURAL research-proposition decoder.
// An HTML table cell is not server-owned source custody, legal qualification,
// a code-approved extractor registry, Accepted Evidence/Rule or a visitor result.
// This module has NO connection to production extraction or RequirementsProvider.
import 'server-only'

import { parse, type DefaultTreeAdapterMap } from 'parse5'

const CANONICAL_URL = 'https://www.auswaertiges-amt.de/de/service/visa-und-aufenthalt/staatenliste-zur-visumpflicht-207820'
const PAGE_TITLE = 'Übersicht zur Visumpflicht bzw. -freiheit bei Einreise in die Bundesrepublik Deutschland'
const COUNTRY_HEADER = 'Staaten und Gebietskörperschaften'
const VISA_HEADER = 'Visumpflicht für Deutschland: Ja/Nein'
const MAX_RESEARCH_HTML_UTF8 = 131_072
const MAX_NODES = 30_000

type Node = DefaultTreeAdapterMap['node']
type Element = DefaultTreeAdapterMap['element']

export type ChDeAaVisaTableResearchResult =
  | { readonly status: 'blocked'; readonly reason:
      | 'invalid_html'
      | 'snapshot_over_limit'
      | 'invalid_document_structure'
      | 'missing_exact_visa_table'
      | 'ambiguous_visa_table'
      | 'swiss_row_missing'
      | 'ambiguous_swiss_row'
      | 'qualified_or_conflicting_swiss_row'
    }
  | {
      readonly status: 'research_visa_table_observation'
      readonly researchStatus: 'RESEARCH_ONLY'
      readonly databaseImportStatus: 'NOT_APPROVED_FOR_DATABASE_IMPORT'
      readonly country: 'CH'
      readonly destination: 'DE'
      readonly requirementType: 'visa'
      readonly sourceCandidateUrl: typeof CANONICAL_URL
      readonly swissVisaDutyCell: 'Nein'
      readonly sourceCustody: 'not_verified'
      readonly legalApplicability: 'not_verified'
      readonly checkedAt: null
      readonly validFrom: null
      readonly validUntil: null
      readonly acceptedEvidence: 0
      readonly acceptedRules: 0
      readonly databaseWrites: 0
    }

function deny(reason: Extract<ChDeAaVisaTableResearchResult, { status: 'blocked' }>['reason']):
  ChDeAaVisaTableResearchResult {
  return Object.freeze({ status: 'blocked', reason })
}

function children(node: Node): Node[] {
  return 'childNodes' in node ? node.childNodes : []
}
function element(node: Node): node is Element {
  return 'tagName' in node
}
function descendants(root: Node): Node[] {
  const result: Node[] = []
  const todo = [root]
  while (todo.length) {
    const node = todo.pop()!
    if (result.length >= MAX_NODES) throw new Error('node_limit')
    result.push(node)
    todo.push(...children(node).slice().reverse())
  }
  return result
}
function tag(node: Node, name: string): boolean {
  return element(node) && node.tagName === name
}
function directCells(row: Node): Node[] {
  return children(row).filter((node) => tag(node, 'td') || tag(node, 'th'))
}
function normal(text: string): string {
  return text.replace(/\u00a0/g, ' ').replace(/\s+/g, ' ').trim()
}
function textContent(root: Node): string {
  const out: string[] = []
  for (const node of descendants(root)) {
    if (node.nodeName === '#text' && 'value' in node) out.push(node.value)
  }
  return normal(out.join(''))
}
function hasHiddenOrActive(root: Node): boolean {
  for (const node of descendants(root)) {
    if (!element(node)) continue
    if (['script', 'style', 'template', 'noscript', 'iframe', 'svg'].includes(node.tagName)) return true
    if (node.attrs.some((attr) =>
      attr.name === 'hidden' || attr.name === 'aria-hidden' ||
      (attr.name === 'style' && /display\s*:\s*none|visibility\s*:\s*hidden/i.test(attr.value))
    )) return true
  }
  return false
}

/** Research only. It does not fetch the URL or prove that input came from AA.
 * The complete supplied DOM must contain one recognisable visa table and one
 * unequivocal Swiss row, with no attached qualifier or footnote. This is not
 * proof for a particular passport class, purpose, stay length or legal date.
 */
export function chDeAaS1VisaRowResearchFromHtml(html: unknown): ChDeAaVisaTableResearchResult {
  if (typeof html !== 'string' || !html.trim()) return deny('invalid_html')
  if (Buffer.byteLength(html, 'utf8') > MAX_RESEARCH_HTML_UTF8) return deny('snapshot_over_limit')
  let document: Node
  let nodes: Node[]
  try {
    document = parse(html)
    nodes = descendants(document)
  } catch {
    return deny('invalid_document_structure')
  }
  const titles = nodes.filter((node) => tag(node, 'h1') && textContent(node) === PAGE_TITLE)
  if (titles.length !== 1 || hasHiddenOrActive(titles[0]!)) return deny('invalid_document_structure')

  type TableMatch = { table: Node; headerRows: Node[]; rows: Node[] }
  const tables: TableMatch[] = []
  try {
    for (const table of nodes.filter((node) => tag(node, 'table'))) {
      const rows = descendants(table).filter((node) => tag(node, 'tr'))
      const headers = rows.filter((row) => {
        const cells = directCells(row)
        return cells.length === 2 &&
          textContent(cells[0]!) === COUNTRY_HEADER && textContent(cells[1]!) === VISA_HEADER
      })
      if (headers.length) tables.push({ table, headerRows: headers, rows })
    }
  } catch {
    return deny('invalid_document_structure')
  }
  if (tables.length === 0) return deny('missing_exact_visa_table')
  if (tables.length !== 1 || tables[0]!.headerRows.length !== 1) return deny('ambiguous_visa_table')

  const chosen = tables[0]!
  // No nested tables: another table inside a table could replace a row's
  // meaning even if the rendered text happens to be "Schweiz Nein".
  if (descendants(chosen.table).filter((n) => tag(n, 'table')).length !== 1) return deny('ambiguous_visa_table')
  const matches = chosen.rows.filter((row) =>
    directCells(row).some((cell) => /^Schweiz(?:\b|\s|$)/.test(textContent(cell)))
  )
  if (matches.length === 0) return deny('swiss_row_missing')
  if (matches.length !== 1) return deny('ambiguous_swiss_row')
  const row = matches[0]!
  const cells = directCells(row)
  if (cells.length !== 2 || hasHiddenOrActive(row) ||
    textContent(cells[0]!) !== 'Schweiz' || textContent(cells[1]!) !== 'Nein') {
    return deny('qualified_or_conflicting_swiss_row')
  }
  return Object.freeze({
    status: 'research_visa_table_observation',
    researchStatus: 'RESEARCH_ONLY',
    databaseImportStatus: 'NOT_APPROVED_FOR_DATABASE_IMPORT',
    country: 'CH',
    destination: 'DE',
    requirementType: 'visa',
    sourceCandidateUrl: CANONICAL_URL,
    swissVisaDutyCell: 'Nein',
    sourceCustody: 'not_verified',
    legalApplicability: 'not_verified',
    checkedAt: null,
    validFrom: null,
    validUntil: null,
    acceptedEvidence: 0,
    acceptedRules: 0,
    databaseWrites: 0,
  })
}
