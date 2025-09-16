// app/api/admin/payments/summary/route.ts
import { NextResponse } from 'next/server'
import { createServerComponentClient } from '@/lib/supabase/server'
import { requireAdmin } from '@/lib/auth/requireAdmin'

export async function GET() {
  await requireAdmin()
  const supabase = createServerComponentClient() as any
  const since = new Date(Date.now() - 30*24*60*60*1000).toISOString()

  let revenue = 0, orders = 0, refunds = 0
  let configured = false

  try {
    const { data: p } = await supabase
      .from('payments')
      .select('amount_chf, status, created_at')
      .gte('created_at', since)
    if (Array.isArray(p)) {
      configured = true
      const paid = p.filter((x: any) => x.status === 'paid')
      orders = paid.length
      revenue = paid.reduce((sum: number, r: any) => sum + (Number(r.amount_chf) || 0), 0)
    }
  } catch {}

  try {
    const { data: r } = await supabase
      .from('refunds')
      .select('id, created_at')
      .gte('created_at', since)
    if (Array.isArray(r)) {
      configured = true
      refunds = r.length
    }
  } catch {}

  return NextResponse.json({
    window_days: 30,
    revenue_chf: Math.round(revenue * 100) / 100,
    orders,
    refunds,
    configured,
  })
}
