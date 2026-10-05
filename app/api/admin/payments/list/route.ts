// app/api/admin/payments/list/route.ts
//
// Der frühere `catch` machte aus einer abgelehnten Abfrage eine leere
// Transaktionsliste – also aus „darf ich nicht sehen“ ein „gab es nicht“.
import { NextResponse } from 'next/server'

import { problemAntwort } from '@/lib/api/antwort'
import { lese } from '@/lib/api/datenbank-lesen'
import { textSuchfilter } from '@/lib/api/suchfilter'
import { requireAdminApi } from '@/lib/auth/admin-guard'
import { createRouteHandlerClient } from '@/lib/supabase/server'
import type { Database } from '@/types/supabase'

const LIMIT = 25

export async function GET(req: Request) {
  const gate = await requireAdminApi({ surface: 'api/payments/list', capability: 'betrieb-lesen' })
  if (!gate.ok) return gate.response

  const supabase = await createRouteHandlerClient<Database>()
  const { searchParams } = new URL(req.url)
  const cursor = searchParams.get('cursor')
  const suche = (searchParams.get('q') || '').trim()
  const status = (searchParams.get('status') || '').trim()

  const ergebnis = await lese(() => {
    let abfrage = supabase
      .from('payments')
      .select('id, status, amount_chf, created_at, customer_email')
      .order('created_at', { ascending: false })
      .limit(LIMIT + 1)

    if (cursor) abfrage = abfrage.lt('created_at', cursor)
    if (status) abfrage = abfrage.eq('status', status)
    if (suche) abfrage = abfrage.or(textSuchfilter(['id', 'customer_email'], suche))

    return abfrage
  })

  if (ergebnis.problem) return problemAntwort(ergebnis.problem)

  const seite = ergebnis.zeilen.slice(0, LIMIT)
  const weitere = ergebnis.zeilen.length > LIMIT

  return NextResponse.json({
    rows: seite,
    next_cursor: weitere ? (seite[seite.length - 1]?.created_at ?? null) : null,
  })
}
