export const REFUND_JOURNAL_PAGE_SIZE = 25

export type RefundJournalRow = {
  id: string
  payment_id: string
  amount_chf: string
  reason: string | null
  created_at: string
}
export type RefundJournalCursor = { created_at: string; id: string }
export type RefundJournalQuery = { paymentId: string; cursor: RefundJournalCursor | null }
export type RefundJournalPage = {
  rows: RefundJournalRow[]
  payment_id: string
  next_cursor: string | null
  loaded_at: string
}

const UUID = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/
const INSTANT = /^(\d{4})-(\d{2})-(\d{2})T(\d{2}):(\d{2}):(\d{2})(?:\.(\d{1,6}))?(Z|[+-](?:0\d|1[0-4]):[0-5]\d)$/
function invalid(): never { throw new Error('Die Erstattungsnotizen konnten nicht eindeutig gelesen werden.') }
function object(value: unknown): value is Record<string, unknown> {
  return value !== null && typeof value === 'object' && !Array.isArray(value)
}

/** Preserve the source text; Date alone would discard PostgreSQL microseconds. */
function micros(value: unknown): bigint {
  if (typeof value !== 'string') return invalid()
  const match = INSTANT.exec(value)
  if (!match) return invalid()
  const [year, month, day, hour, minute, second] = match.slice(1, 7).map(Number)
  const calendar = new Date(0)
  calendar.setUTCFullYear(year, month - 1, day)
  calendar.setUTCHours(hour, minute, second, 0)
  if (year < 1 || calendar.getUTCFullYear() !== year || calendar.getUTCMonth() !== month - 1
      || calendar.getUTCDate() !== day || hour > 23 || minute > 59 || second > 59) return invalid()
  const milliseconds = Date.parse(value)
  if (!Number.isFinite(milliseconds)) return invalid()
  return BigInt(milliseconds) * BigInt(1000) + BigInt((match[7] ?? '').padEnd(6, '0').slice(3))
}

export function refundJournalFilter(value: string): string {
  const normalized = value.trim()
  if (normalized.length > 200 || /[\u0000-\u001f\u007f]/.test(normalized)) {
    throw new Error('Die Zahlungs-ID darf höchstens 200 Zeichen und keine Steuerzeichen enthalten.')
  }
  return normalized
}

export function refundJournalCursor(row: RefundJournalCursor, paymentId: string): string {
  micros(row.created_at)
  if (!UUID.test(row.id) || refundJournalFilter(paymentId) !== paymentId) return invalid()
  return JSON.stringify([1, paymentId, row.created_at, row.id])
}

function readCursor(value: string, paymentId: string): RefundJournalCursor {
  if (!value || value.length > 1800) return invalid()
  let parsed: unknown
  try { parsed = JSON.parse(value) } catch { return invalid() }
  if (!Array.isArray(parsed) || parsed.length !== 4 || parsed[0] !== 1 || parsed[1] !== paymentId
      || typeof parsed[2] !== 'string' || typeof parsed[3] !== 'string' || !UUID.test(parsed[3])) return invalid()
  micros(parsed[2])
  return { created_at: parsed[2], id: parsed[3] }
}

export function parseRefundJournalQuery(params: URLSearchParams): RefundJournalQuery {
  if (params.getAll('payment_id').length > 1 || params.getAll('cursor').length > 1) return invalid()
  const paymentId = refundJournalFilter(params.get('payment_id') ?? '')
  return { paymentId, cursor: params.has('cursor') ? readCursor(params.get('cursor')!, paymentId) : null }
}

/** Negative means a precedes b in the exact database descending order. */
function compare(a: RefundJournalCursor, b: RefundJournalCursor): number {
  const ta = micros(a.created_at), tb = micros(b.created_at)
  if (ta !== tb) return ta > tb ? -1 : 1
  return a.id === b.id ? 0 : a.id > b.id ? -1 : 1
}

export function parseRefundJournalRows(value: unknown, query: RefundJournalQuery, maximum = REFUND_JOURNAL_PAGE_SIZE + 1): RefundJournalRow[] {
  if (!Array.isArray(value) || value.length > maximum) return invalid()
  const rows: RefundJournalRow[] = []
  const ids = new Set<string>()
  for (const raw of value) {
    if (!object(raw) || typeof raw.id !== 'string' || !UUID.test(raw.id)
        || typeof raw.payment_id !== 'string' || !raw.payment_id
        || typeof raw.amount_chf !== 'string'
        || !(raw.reason === null || typeof raw.reason === 'string') || typeof raw.created_at !== 'string') return invalid()
    micros(raw.created_at)
    const row: RefundJournalRow = { id: raw.id, payment_id: raw.payment_id, amount_chf: raw.amount_chf, reason: raw.reason, created_at: raw.created_at }
    if (ids.has(row.id) || (query.paymentId && row.payment_id !== query.paymentId)
        || (query.cursor && compare(query.cursor, row) >= 0)
        || (rows.length && compare(rows[rows.length - 1], row) >= 0)) return invalid()
    ids.add(row.id)
    rows.push(row)
  }
  return rows
}

export function parseRefundJournalPage(value: unknown, query: RefundJournalQuery): RefundJournalPage {
  if (!object(value) || value.payment_id !== query.paymentId || typeof value.loaded_at !== 'string'
      || !(value.next_cursor === null || typeof value.next_cursor === 'string')) return invalid()
  micros(value.loaded_at)
  const rows = parseRefundJournalRows(value.rows, query, REFUND_JOURNAL_PAGE_SIZE)
  if (value.next_cursor !== null && (rows.length !== REFUND_JOURNAL_PAGE_SIZE
      || value.next_cursor !== refundJournalCursor(rows[rows.length - 1], query.paymentId))) return invalid()
  return { rows, payment_id: query.paymentId, next_cursor: value.next_cursor, loaded_at: value.loaded_at }
}

export function appendRefundJournalPage(previous: RefundJournalPage, page: RefundJournalPage): RefundJournalPage {
  if (previous.payment_id !== page.payment_id || !previous.next_cursor) return invalid()
  const cursor = readCursor(previous.next_cursor, previous.payment_id)
  parseRefundJournalRows(page.rows, { paymentId: previous.payment_id, cursor }, REFUND_JOURNAL_PAGE_SIZE)
  const ids = new Set(previous.rows.map(row => row.id))
  if (page.rows.some(row => ids.has(row.id))) return invalid()
  return { ...page, rows: [...previous.rows, ...page.rows] }
}

export function refundJournalUrl(paymentId: string, cursor: string | null = null): string {
  const params = new URLSearchParams()
  if (paymentId) params.set('payment_id', paymentId)
  if (cursor !== null) params.set('cursor', cursor)
  return `/api/admin/payments/refunds${params.size ? `?${params}` : ''}`
}

/** Display old values faithfully; never round an invalid ledger note into valid money. */
export function refundJournalAmount(raw: string): { text: string; valid: boolean } {
  const match = /^(\d+)(?:\.(\d+))?$/.exec(raw)
  const fraction = match?.[2]?.replace(/0+$/, '') ?? ''
  if (!match || raw.length > 160 || fraction.length > 2 || /^0+$/.test(match[1]) && !/[1-9]/.test(fraction)) {
    return { text: raw || 'Betrag fehlt', valid: false }
  }
  const whole = BigInt(match[1]).toLocaleString('de-CH')
  return { text: `${whole}.${fraction.padEnd(2, '0')} CHF`, valid: true }
}

export function refundJournalTime(value: string): string {
  return `${new Intl.DateTimeFormat('de-CH', { dateStyle: 'short', timeStyle: 'medium', timeZone: 'UTC' }).format(new Date(value))} UTC`
}
