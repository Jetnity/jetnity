// app/api/admin/payments/breakdown/route.ts
import { NextResponse } from 'next/server'
import { createServerComponentClient } from '@/lib/supabase/server'
import { requireAdmin } from '@/lib/auth/requireAdmin'

export async function GET(req: Request) {
  await requireAdmin()
  const supabase = createServerComponentClient() as any
  const since = new Date(Date.now() - 30*24*60*60*1000)
  const sinceIso = since.toISOString()

  // Vorinitialisieren: 30 Tages-Buckets
  const days: string[] = []
  const d = new Date(since)
  for (let i=0;i<30;i++){ days.push(d.toISOString().slice(0,10)); d.setDate(d.getDate()+1) }
  const map: Record<string,{ revenue_chf:number; orders:number }> = {}
  days.forEach(k => map[k] = { revenue_chf: 0, orders: 0 })

  try {
    const { data } = await supabase
      .from('payments')
      .select('amount_chf, status, created_at')
      .gte('created_at', sinceIso)
    if (Array.isArray(data)) {
      for (const r of data) {
        const k = String(r.created_at).slice(0,10)
        if (!map[k]) continue
        if (r.status === 'paid') {
          map[k].orders += 1
          map[k].revenue_chf += Number(r.amount_chf || 0)
        }
      }
    }
  } catch {/* Tabelle fehlt → bleibt leer */}

  const out = days.map(k => ({ date: k, revenue_chf: +map[k].revenue_chf.toFixed(2), orders: map[k].orders }))
  return NextResponse.json({ days: out })
}
