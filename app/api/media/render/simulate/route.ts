import { NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'
import type { Database } from '@/types/supabase'

const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL!
const SERVICE_ROLE = process.env.SUPABASE_SERVICE_ROLE_KEY! // nur Server

function sleep(ms: number) {
  return new Promise((r) => setTimeout(r, ms))
}

export async function POST(req: Request) {
  try {
    const allow = process.env.NODE_ENV !== 'production' || process.env.RENDER_SIMULATE === '1'
    if (!allow) return NextResponse.json({ error: 'forbidden' }, { status: 403 })
    if (!SUPABASE_URL || !SERVICE_ROLE) {
      return NextResponse.json({ error: 'missing supabase env' }, { status: 500 })
    }

    const supabase = createClient<Database>(SUPABASE_URL, SERVICE_ROLE, { auth: { persistSession: false } })

    const u = new globalThis.URL(req.url)
    const id = u.searchParams.get('id') || (await req.json().catch(() => ({} as any)))?.id
    if (!id) return NextResponse.json({ error: 'missing id' }, { status: 400 })

    const { data: job, error: jErr } = await supabase.from('render_jobs').select('*').eq('id', id).single()
    if (jErr || !job) return NextResponse.json({ error: 'job not found' }, { status: 404 })

    if (['succeeded', 'failed', 'canceled'].includes((job as any).status)) {
      return NextResponse.json({ ok: true, job })
    }

    await supabase.from('render_jobs').update({ status: 'processing', progress: 0 } as any).eq('id', (job as any).id)

    const steps = [8, 22, 37, 55, 72, 88, 100]
    for (const p of steps) {
      await sleep(250)
      await supabase.from('render_jobs').update({ progress: p } as any).eq('id', (job as any).id)
    }

    const bucket = 'media-renders'
    const path = `${(job as any).user_id}/${(job as any).id}.txt`
    const content = `Render abgeschlossen\njob: ${(job as any).id}\nwhen: ${new Date().toISOString()}`
    const bytes = new TextEncoder().encode(content)

    const up = await supabase.storage.from(bucket).upload(path, bytes, { upsert: true, contentType: 'text/plain' })
    if (up.error) {
      await supabase.from('render_jobs').update({ status: 'failed', error_message: up.error.message } as any).eq('id', (job as any).id)
      return NextResponse.json({ error: 'upload failed' }, { status: 500 })
    }

    // Owner setzen (Service Role darf das; Typen hier lax casten)
    await (supabase as any).from('storage.objects').update({ owner: (job as any).user_id }).eq('bucket_id', bucket).eq('name', path)

    const output_url = `${bucket}/${path}` // wir speichern "bucket/path"
    const { data: finalJob, error: finErr } = await supabase
      .from('render_jobs')
      .update({ status: 'succeeded', progress: 100, output_url } as any)
      .eq('id', (job as any).id)
      .select('*')
      .single()

    if (finErr) throw finErr
    return NextResponse.json({ ok: true, job: finalJob })
  } catch (e: any) {
    console.error('[render/simulate] error:', e?.message || e)
    return NextResponse.json({ error: 'failed' }, { status: 500 })
  }
}
