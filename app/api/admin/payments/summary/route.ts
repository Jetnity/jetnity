// app/api/admin/payments/summary/route.ts
//
// Vorher lieferte diese Route bei jedem Fehler „CHF 0, 0 Bestellungen“ und
// dazu `configured: false`. Eine Null ist eine Aussage über das Geschäft; ein
// Ausfall ist keine.
import { NextResponse } from 'next/server'

import { problemAntwort } from '@/lib/api/antwort'
import { lese } from '@/lib/api/datenbank-lesen'
import { fasseZahlungenZusammen } from '@/lib/admin/kennzahlen'
import { requireAdminApi } from '@/lib/auth/admin-guard'
import { createRouteHandlerClient } from '@/lib/supabase/server'
import type { Database } from '@/types/supabase'

const TAGE = 30

export async function GET() {
  const gate = await requireAdminApi({ surface: 'api/payments/summary', capability: 'betrieb-lesen' })
  if (!gate.ok) return gate.response

  const supabase = await createRouteHandlerClient<Database>()
  const seit = new Date(Date.now() - TAGE * 24 * 3600 * 1000).toISOString()

  const [zahlungen, rueckerstattungen] = await Promise.all([
    lese(() =>
      supabase.from('payments').select('amount_chf, status, created_at').gte('created_at', seit),
    ),
    lese(() => supabase.from('refunds').select('id').gte('created_at', seit)),
  ])

  if (zahlungen.problem) return problemAntwort(zahlungen.problem)
  if (rueckerstattungen.problem) return problemAntwort(rueckerstattungen.problem)

  return NextResponse.json({
    window_days: TAGE,
    ...fasseZahlungenZusammen(zahlungen.zeilen, rueckerstattungen.zeilen),
  })
}
