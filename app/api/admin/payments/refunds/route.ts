import { NextResponse } from 'next/server'
import { requireAdminApi } from '@/lib/auth/admin-guard'
import { createRouteHandlerClient } from '@/lib/supabase/server'
import type { Database } from '@/types/supabase'
import {
  parseRefundJournalQuery, parseRefundJournalRows, refundJournalCursor, REFUND_JOURNAL_PAGE_SIZE,
  type RefundJournalQuery,
} from '@/lib/admin/payments/refund-journal'

const headers = { 'Cache-Control': 'private, no-store, max-age=0', Vary: 'Cookie' }
function problem(status: number, message: string) { return NextResponse.json({ message }, { status, headers }) }

export async function GET(req: Request) {
  const gate = await requireAdminApi({ surface: 'api/payments/refunds', capability: 'betrieb-lesen' })
  if (!gate.ok) {
    gate.response.headers.set('Cache-Control', headers['Cache-Control'])
    gate.response.headers.set('Vary', headers.Vary)
    return gate.response
  }
  let selection: RefundJournalQuery
  try { selection = parseRefundJournalQuery(new URL(req.url).searchParams) }
  catch { return problem(400, 'Zahlungsfilter oder Seitengrenze sind ungültig. Bitte die Liste neu laden.') }

  try {
    const supabase = await createRouteHandlerClient<Database>()
    let query = supabase.from('refunds')
      .select('id,payment_id,amount_chf::text,reason,created_at')
      .order('created_at', { ascending: false }).order('id', { ascending: false })
      .limit(REFUND_JOURNAL_PAGE_SIZE + 1)
    if (selection.paymentId) query = query.eq('payment_id', selection.paymentId)
    if (selection.cursor) {
      const { created_at, id } = selection.cursor
      // Both tokens have strict timestamp/UUID validation; the payment ID is never interpolated.
      query = query.or(`created_at.lt.${created_at},and(created_at.eq.${created_at},id.lt.${id})`)
    }
    const response = await query.abortSignal(req.signal)
    if (response.status === 401 || response.status === 403 || response.error?.code === '42501') {
      return problem(response.status === 401 ? 401 : 403, 'Der Zugriff auf Erstattungsnotizen ist nicht mehr bestätigt.')
    }
    if (response.error) {
      const transient = [0, 408, 429, 502, 503, 504].includes(response.status)
        || /^(08|53|57|58)/.test(response.error.code ?? '')
      return problem(transient ? 503 : 500, 'Die Erstattungsnotizen konnten nicht geladen werden.')
    }
    const fetched = parseRefundJournalRows(response.data, selection)
    const rows = fetched.slice(0, REFUND_JOURNAL_PAGE_SIZE)
    return NextResponse.json({
      rows, payment_id: selection.paymentId, loaded_at: new Date().toISOString(),
      next_cursor: fetched.length > REFUND_JOURNAL_PAGE_SIZE ? refundJournalCursor(rows[rows.length - 1], selection.paymentId) : null,
    }, { headers })
  } catch {
    return problem(500, 'Die Erstattungsnotizen konnten nicht eindeutig gelesen werden.')
  }
}
