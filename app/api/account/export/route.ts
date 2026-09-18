// app/api/account/export/route.ts
//
// Authenticated JSON-Download der eigenen Konto- und Reisezeilen.
// Identität nur aus auth.getUser(). Bestehendes RLS. Kein Service-Role.

import { NextResponse } from 'next/server'

import {
  kontoDatenexportDateiname,
  kontoDatenexportErzeugen,
} from '@/lib/account/datenexport'
import { createRouteHandlerClient } from '@/lib/supabase/server'
import type { Database } from '@/types/supabase'

export const dynamic = 'force-dynamic'
export const maxDuration = 10

const NO_STORE = { 'Cache-Control': 'no-store' } as const

function jsonFehler(status: 401 | 500 | 503, error: string, message: string) {
  return NextResponse.json({ error, message }, { status, headers: NO_STORE })
}

export async function GET() {
  const supabase = await createRouteHandlerClient<Database>()
  const { data, error } = await supabase.auth.getUser()
  if (error || !data.user) {
    return jsonFehler(401, 'unauthenticated', 'Nicht angemeldet.')
  }

  const ergebnis = await kontoDatenexportErzeugen(supabase, data.user.id)
  if (!ergebnis.ok) {
    return jsonFehler(
      ergebnis.problem.status,
      'export_failed',
      'Der Export konnte nicht vollständig gelesen werden.',
    )
  }

  const dateiname = kontoDatenexportDateiname(ergebnis.dokument.generatedAt)
  return new NextResponse(JSON.stringify(ergebnis.dokument), {
    status: 200,
    headers: {
      'Content-Type': 'application/json; charset=utf-8',
      'Content-Disposition': `attachment; filename="${dateiname}"`,
      'Cache-Control': 'no-store',
    },
  })
}
