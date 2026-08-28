// app/api/admin/payments/breakdown/route.ts
//
// Der frühere `catch` liess die dreissig vorbereiteten Tages-Eimer auf null
// stehen und gab sie aus. Das Diagramm zeigte dann eine flache Linie – nicht
// zu unterscheiden von dreissig Tagen ohne Umsatz.
import { NextResponse } from 'next/server'

import { problemAntwort } from '@/lib/api/antwort'
import { lese } from '@/lib/api/datenbank-lesen'
import { verteileAufTage } from '@/lib/admin/kennzahlen'
import { requireAdminApi } from '@/lib/auth/admin-guard'
import { createRouteHandlerClient } from '@/lib/supabase/server'
import type { Database } from '@/types/supabase'

const TAGE = 30

export async function GET() {
  const gate = await requireAdminApi({ surface: 'api/payments/breakdown', capability: 'betrieb-lesen' })
  if (!gate.ok) return gate.response

  const supabase = await createRouteHandlerClient<Database>()
  const beginn = new Date(Date.now() - TAGE * 24 * 3600 * 1000)

  const zahlungen = await lese(() =>
    supabase
      .from('payments')
      .select('amount_chf, status, created_at')
      .gte('created_at', beginn.toISOString()),
  )

  if (zahlungen.problem) return problemAntwort(zahlungen.problem)

  return NextResponse.json({ days: verteileAufTage(zahlungen.zeilen, beginn, TAGE) })
}
