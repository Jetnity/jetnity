// app/api/admin/payments/refund/route.ts
import { NextResponse } from 'next/server'
import { createServerComponentClient } from '@/lib/supabase/server'
import { requireAdmin } from '@/lib/auth/requireAdmin'

export async function POST(req: Request) {
  await requireAdmin()
  const supabase = createServerComponentClient() as any
  const { payment_id, amount_chf, reason } = await req.json().catch(()=>({}))
  if (!payment_id || typeof amount_chf !== 'number' || isNaN(amount_chf)) {
    return NextResponse.json({ error: 'payment_id & amount_chf erforderlich' }, { status: 400 })
  }

  // Optional: in refunds loggen & Payment markieren (wenn Tabellen existieren)
  try {
    await supabase.from('refunds').insert({
      payment_id, amount_chf, reason: reason ?? null
    })
  } catch {}
  try {
    // Falls vollständiger Refund: Status auf refunded setzen
    const { data: p } = await supabase.from('payments').select('amount_chf').eq('id', payment_id).maybeSingle()
    if (p && Number(p.amount_chf) <= Number(amount_chf)) {
      await supabase.from('payments').update({ status: 'refunded' }).eq('id', payment_id)
    }
  } catch {}

  // Hier würdest du Stripe API callen; wir antworten optimistisch
  return NextResponse.json({ ok: true })
}
