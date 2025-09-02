// app/api/video/webhook/route.ts
import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'
import crypto from 'crypto'

export const runtime = 'nodejs'

function admin() {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL!
  const key = process.env.SUPABASE_SERVICE_ROLE_KEY!
  return createClient(url, key, { auth: { persistSession: false } })
}

// Optional: einfache Signaturprüfung
function verify(req: NextRequest) {
  const secret = process.env.RENDER_WEBHOOK_SECRET || ''
  if (!secret) return true
  const sig = req.headers.get('x-provider-signature') || ''
  const raw = (req as any).__BODY__RAW__ || '' // nicht immer verfügbar; je nach Runtime
  const h = crypto.createHmac('sha256', secret).update(raw).digest('hex')
  return crypto.timingSafeEqual(Buffer.from(h), Buffer.from(sig))
}

export async function POST(req: NextRequest) {
  try {
    const payload = await req.json().catch(() => ({}))
    const { jobId, status, progress, videoUrl, error } = payload as {
      jobId: string; status: string; progress?: number; videoUrl?: string; error?: string
    }

    if (!jobId) return NextResponse.json({ error: 'jobId missing' }, { status: 400 })
    const sb = admin()

    const updates: any = {}
    if (status) updates.status = status
    if (typeof progress === 'number') updates.progress = progress
    if (videoUrl) updates.video_url = videoUrl
    if (error) updates.error = error

    updates.updated_at = new Date().toISOString()

    const { error: upErr } = await sb.from('render_jobs').update(updates).eq('id', jobId)
    if (upErr) return NextResponse.json({ error: 'Update failed' }, { status: 500 })

    return NextResponse.json({ ok: true })
  } catch (e: any) {
    return NextResponse.json({ error: e?.message || 'Internal error' }, { status: 500 })
  }
}
