// app/api/creator/alerts/evaluate/route.ts
import { NextRequest } from 'next/server'
import { cookies, headers } from 'next/headers'
import { createServerComponentClient } from '@/lib/supabase/server'
import { createClient } from '@supabase/supabase-js'
import type { Database } from '@/types/supabase'

export async function GET(req: NextRequest) {
  const h = headers()
  const authHeader = h.get('authorization') || h.get('Authorization') || ''
  const bearer = authHeader.startsWith('Bearer ') ? authHeader.slice(7) : ''

  // Admin/Cron: evaluate all (requires CRON_SECRET and service role)
  if (bearer && process.env.CRON_SECRET && bearer === process.env.CRON_SECRET) {
    const admin = createClient<Database>(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.SUPABASE_SERVICE_ROLE_KEY!, // service role
      { auth: { persistSession: false } }
    )
    const { data, error } = await admin.rpc('creator_alerts_eval_all' as any)
    if (error) return new Response(`RPC error: ${error.message}`, { status: 500 })
    return new Response(JSON.stringify({ inserted: data ?? 0 }), {
      status: 200,
      headers: { 'content-type': 'application/json' },
    })
  }

  // User-context: evaluate only current user
  const supabase = createServerComponentClient()
  const { data: ures } = await supabase.auth.getUser()
  if (!ures?.user) return new Response('Unauthorized', { status: 401 })
  const { data, error } = await supabase.rpc('creator_alerts_eval_current_user' as any)
  if (error) return new Response(`RPC error: ${error.message}`, { status: 500 })
  return new Response(JSON.stringify({ inserted: data ?? 0 }), {
    status: 200,
    headers: { 'content-type': 'application/json' },
  })
}
