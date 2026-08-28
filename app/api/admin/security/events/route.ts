// app/api/admin/security/events/route.ts
//
// Der frühere `catch` lieferte `{ rows: [] }` – dieselbe Antwort, die auch
// eine Datenbank ohne Vorfälle gibt. Wer die Liste ansah, konnte beides nicht
// auseinanderhalten.
import { NextResponse } from 'next/server'

import { problemAntwort } from '@/lib/api/antwort'
import { lese } from '@/lib/api/datenbank-lesen'
import { ereignisSuchfilter } from '@/lib/api/suchfilter'
import { requireAdminApi } from '@/lib/auth/admin-guard'
import { createRouteHandlerClient } from '@/lib/supabase/server'
import type { Database } from '@/types/supabase'

const LIMIT = 25

export async function GET(req: Request) {
  const gate = await requireAdminApi({ surface: 'api/security/events', capability: 'betrieb-lesen' })
  if (!gate.ok) return gate.response

  const supabase = await createRouteHandlerClient<Database>()
  const { searchParams } = new URL(req.url)
  const cursor = searchParams.get('cursor')
  const suche = (searchParams.get('q') || '').trim()

  const ergebnis = await lese(() => {
    let abfrage = supabase
      .from('security_events')
      .select('id, type, ip, user_id, created_at, extra')
      .order('created_at', { ascending: false })
      .limit(LIMIT + 1)

    if (cursor) abfrage = abfrage.lt('created_at', cursor)
    if (suche) abfrage = abfrage.or(ereignisSuchfilter(suche))

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
