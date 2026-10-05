// app/api/admin/payments/webhooks/route.ts
//
// Diese Route hat den Fall vorgeführt: `stripe_webhooks` hatte bis
// `20260817100800` weder Recht noch Policy, die Abfrage lief ins Leere, und
// der `catch` machte daraus eine ruhige leere Liste. Sichtbar wurde der Fehler
// erst, als jemand die Tabelle direkt abfragte.
import { NextResponse } from 'next/server'

import { problemAntwort } from '@/lib/api/antwort'
import { lese } from '@/lib/api/datenbank-lesen'
import { requireAdminApi } from '@/lib/auth/admin-guard'
import { createRouteHandlerClient } from '@/lib/supabase/server'
import type { Database } from '@/types/supabase'

const LIMIT = 25

export async function GET(req: Request) {
  const gate = await requireAdminApi({ surface: 'api/payments/webhooks', capability: 'betrieb-lesen' })
  if (!gate.ok) return gate.response

  const supabase = await createRouteHandlerClient<Database>()
  const { searchParams } = new URL(req.url)
  const cursor = searchParams.get('cursor')

  const ergebnis = await lese(() => {
    let abfrage = supabase
      .from('stripe_webhooks')
      .select('id, type, created_at')
      .order('created_at', { ascending: false })
      .limit(LIMIT + 1)

    if (cursor) abfrage = abfrage.lt('created_at', cursor)

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
