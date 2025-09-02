// app/api/video/render/route.ts
import { NextRequest, NextResponse } from 'next/server'
import { z } from 'zod'
import { createClient } from '@supabase/supabase-js'
import { startRenderJob } from '@/lib/video/providers' // Adapter (unten)

export const runtime = 'nodejs'

const Shot = z.object({
  prompt: z.string(),
  vo: z.string().optional().nullable(),
  durationSec: z.number().int().min(1).max(30).optional().nullable(),
  camera: z.string().optional().nullable(),
  motion: z.string().optional().nullable(),
  location: z.string().optional().nullable(),
  notes: z.string().optional().nullable(),
  image_url: z.string().url().optional().nullable(),
})
const Scene = z.object({
  id: z.string(),
  title: z.string(),
  summary: z.string(),
  durationSec: z.number().int().min(1).max(120).optional().nullable(),
  shots: z.array(Shot).min(1),
  musicHint: z.string().optional().nullable(),
  transition: z.string().optional().nullable(),
})
const StoryboardSchema = z.object({
  title: z.string(),
  aspect: z.enum(['16:9', '9:16', '1:1']),
  fps: z.union([z.literal(24), z.literal(25), z.literal(30)]),
  style: z.enum(['cinematic', 'travel_magazine', 'vlog', 'documentary']),
  scenes: z.array(Scene).min(1),
})

const InputSchema = z.object({
  sessionId: z.string().min(1),
  storyboard: StoryboardSchema,
})

function admin() {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL!
  const key = process.env.SUPABASE_SERVICE_ROLE_KEY!
  return createClient(url, key, { auth: { persistSession: false } })
}

export async function POST(req: NextRequest) {
  try {
    const body = await req.json().catch(() => ({}))
    const { sessionId, storyboard } = InputSchema.parse(body)

    const sb = admin()

    // 1) Job anlegen
    const { data: job, error } = await sb
      .from('render_jobs')
      .insert({
        session_id: sessionId,
        provider: process.env.RENDER_PROVIDER || 'mock',
        storyboard,
        status: 'queued',
        progress: 0,
      })
      .select()
      .maybeSingle()

    if (error || !job) {
      return NextResponse.json({ error: 'Job konnte nicht angelegt werden.' }, { status: 500 })
    }

    // 2) Provider starten (asynchron, aber wir updaten sofort)
    const res = await startRenderJob({
      jobId: job.id,
      storyboard,
      webhookUrl: `${process.env.NEXT_PUBLIC_SITE_URL || process.env.SITE_URL || ''}/api/video/webhook`,
      metadata: { sessionId },
    })

    await sb
      .from('render_jobs')
      .update({ provider_job_id: res.providerJobId, status: 'processing' })
      .eq('id', job.id)

    return NextResponse.json({ jobId: job.id }, { status: 200 })
  } catch (e: any) {
    return NextResponse.json({ error: e?.message || 'Internal error' }, { status: 500 })
  }
}
