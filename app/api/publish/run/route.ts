// app/api/publish/run/route.ts
export const runtime = 'nodejs'           // Service-Role braucht Node
export const dynamic = 'force-dynamic'
export const maxDuration = 60

import { NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'
import type { Database } from '@/types/supabase'
import { generateStoryInsightsServer } from '@/lib/openai/generateStoryInsightsServer'

const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL!
const SERVICE_ROLE = process.env.SUPABASE_SERVICE_ROLE_KEY!
const CRON_SECRET = process.env.CRON_SECRET! // setze in .env

const PAGE_LIMIT = 50
const CONCURRENCY = 3

export async function POST(req: Request) {
  // 1) Auth via Secret-Header
  const secret = req.headers.get('x-cron-secret') ?? req.headers.get('authorization')?.replace(/^Bearer\s+/i,'')
  if (!CRON_SECRET || secret !== CRON_SECRET) {
    return NextResponse.json({ error: 'forbidden' }, { status: 403 })
  }

  const supabase = createClient<Database>(SUPABASE_URL, SERVICE_ROLE, {
    auth: { persistSession: false },
  })

  // 2) Finde fällige Jobs
  const { data: due, error: dueErr } = await supabase
    .from('creator_publish_schedule')
    .select('*')
    .eq('status', 'scheduled')
    .lte('run_at', new Date().toISOString())
    .order('run_at', { ascending: true })
    .limit(PAGE_LIMIT)

  if (dueErr) return NextResponse.json({ error: dueErr.message }, { status: 500 })
  if (!due?.length) return NextResponse.json({ ok: true, processed: 0 })

  // 3) Markiere als running (advisory lock light)
  const ids = due.map(d => d.id)
  const { error: lockErr } = await supabase
    .from('creator_publish_schedule')
    .update({ status: 'running', attempts: (null as any) }) // attempts wird im einzelnen Job erhöht
    .in('id', ids)
  if (lockErr) {
    // Wir versuchen trotzdem pro Item zu verarbeiten (robuster gegen Race)
  }

  let processed = 0
  let failed = 0

  // 4) In Batches verarbeiten
  const queue = [...due]
  async function worker() {
    while (queue.length) {
      const job = queue.shift()
      if (!job) break
      const ok = await processOne(supabase, job).catch(() => false)
      if (ok) processed++; else failed++
    }
  }
  await Promise.all(Array.from({ length: Math.min(CONCURRENCY, due.length) }, () => worker()))

  return NextResponse.json({ ok: true, processed, failed })
}

async function processOne(supabase: ReturnType<typeof createClient<Database>>, job: any) {
  try {
    // Lese Session + Snippets
    const { data: session, error: sErr } = await supabase
      .from('creator_sessions')
      .select('id, status, visibility')
      .eq('id', job.session_id)
      .single()
    if (sErr || !session) throw new Error('session not found')

    const { data: snippets, error: nErr } = await supabase
      .from('session_snippets')
      .select('content')
      .eq('session_id', job.session_id)
      .order('order_index', { ascending: true })
      .order('created_at', { ascending: true })
    if (nErr || !snippets?.length) throw new Error('no snippets')

    const storyText = snippets.map(s => s.content ?? '').join('\n')

    // Analyse (best-effort)
    let rating: number | null = null
    let insights: string | undefined
    try {
      const ai = await generateStoryInsightsServer(storyText)
      rating = ai?.rating ?? null
      insights = ai?.insights ?? ''
    } catch (e: any) {
      insights = '(Analyse nicht verfügbar via Cron.)'
    }

    // Publish
    const patch: Record<string, any> = {
      status: 'approved',
      visibility: job.visibility,
      published_at: new Date().toISOString(),
      rating,
      insights,
      analysis_hash: await sha256(storyText),
      analysis_updated_at: new Date().toISOString(),
    }

    // Feldweise updaten (schema-sicher)
    for (const [k, v] of Object.entries(patch)) {
      try {
        const { error } = await (supabase.from as any)('creator_sessions').update({ [k]: v }).eq('id', job.session_id)
        if (error && !/column .* does not exist/i.test(error.message)) throw error
      } catch {}
    }

    // Events/Metrics best-effort
    try {
      await (supabase.from as any)('creator_publish_events').insert({
        session_id: job.session_id,
        type: 'publish',
        visibility: job.visibility,
        scheduled_for: job.run_at,
        rating,
        note: job.note || null,
      })
    } catch {}
    try {
      await (supabase.from as any)('creator_session_metrics')
        .upsert({ session_id: job.session_id, impressions: 0, views: 0 }, { onConflict: 'session_id' })
    } catch {}

    // Job done
    await supabase
      .from('creator_publish_schedule')
      .update({ status: 'done', attempts: job.attempts + 1, last_error: null })
      .eq('id', job.id)

    return true
  } catch (e: any) {
    await supabase
      .from('creator_publish_schedule')
      .update({ status: 'failed', attempts: job.attempts + 1, last_error: e?.message ?? String(e) })
      .eq('id', job.id)
    try {
      await (supabase.from as any)('creator_publish_events').insert({
        session_id: job.session_id,
        type: 'schedule',
        visibility: job.visibility,
        scheduled_for: job.run_at,
        note: `FAILED: ${e?.message ?? e}`,
      })
    } catch {}
    return false
  }
}

async function sha256(text: string) {
  const enc = new TextEncoder().encode(text)
  const buf = await crypto.subtle.digest('SHA-256', enc)
  return Array.from(new Uint8Array(buf)).map(b => b.toString(16).padStart(2, '0')).join('')
}
