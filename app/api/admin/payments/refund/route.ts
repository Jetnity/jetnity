// app/api/admin/payments/refund/route.ts
import { NextResponse } from 'next/server'
import { createRouteHandlerClient } from '@/lib/supabase/server'
import { requireAdminApi } from '@/lib/auth/admin-guard'
import { adminWriteErlaubt, jsonAdminWriteVerweigert } from '@/lib/auth/admin-write-gate'
import type { Database } from '@/types/supabase'

export async function POST(req: Request) {
  // Ein Eingriff in Zahlungen verlangt mehr als reinen Bereichszugang.
  const gate = await requireAdminApi({
    surface: 'api/payments/refund',
    capability: 'betrieb-eingreifen',
  })
  if (!gate.ok) return gate.response
  if (!adminWriteErlaubt({ grant: gate.grant }).erlaubt) {
    return jsonAdminWriteVerweigert()
  }

  const body = await req.json().catch(() => null)
  const zahlung = typeof body?.payment_id === 'string' ? body.payment_id.trim() : ''
  const betrag = typeof body?.amount_chf === 'number' ? body.amount_chf : NaN
  const grund = typeof body?.reason === 'string' ? body.reason.trim() : ''

  if (!zahlung || !Number.isFinite(betrag) || betrag <= 0) {
    return NextResponse.json(
      { ok: false, message: 'payment_id und ein positiver amount_chf sind erforderlich' },
      { status: 400 },
    )
  }

  const supabase = createRouteHandlerClient<Database>()

  // supabase-js wirft nicht, es meldet im `error`-Feld. Das frühere `try/catch`
  // fing deshalb nie etwas ab: Eine von RLS abgelehnte Buchung lief in die
  // Antwort `{ ok: true }`. Bei einer Rückerstattung ist das die teuerste
  // Sorte falscher Erfolgsmeldung.
  const { error: buchungFehler } = await supabase
    .from('refunds')
    .insert({ payment_id: zahlung, amount_chf: betrag, reason: grund || null })

  if (buchungFehler) {
    return NextResponse.json({ ok: false, message: buchungFehler.message }, { status: 500 })
  }

  const { data: bezahlt, error: leseFehler } = await supabase
    .from('payments')
    .select('amount_chf')
    .eq('id', zahlung)
    .maybeSingle()

  if (leseFehler) {
    return NextResponse.json({ ok: false, message: leseFehler.message }, { status: 500 })
  }

  // Deckt die Erstattung den vollen Betrag, gilt die Zahlung als erstattet.
  const vollstaendig = bezahlt !== null && Number(bezahlt.amount_chf) <= betrag

  if (vollstaendig) {
    const { error: statusFehler } = await supabase
      .from('payments')
      .update({ status: 'refunded' })
      .eq('id', zahlung)

    if (statusFehler) {
      return NextResponse.json({ ok: false, message: statusFehler.message }, { status: 500 })
    }
  }

  return NextResponse.json({ ok: true, settled: vollstaendig })
}
