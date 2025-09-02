// app/api/worker/render/route.ts
import { NextResponse } from 'next/server'
import { createRouteHandlerClient } from '@/lib/supabase/server'
import type { Database } from '@/types/supabase'
import ffmpeg from 'fluent-ffmpeg'
import ffmpegStatic from 'ffmpeg-static'
import { createClient, type SupabaseClient } from '@supabase/supabase-js'

export const runtime = 'nodejs'
export const dynamic = 'force-dynamic'

if (ffmpegStatic) {
  ffmpeg.setFfmpegPath(ffmpegStatic as string)
}

type JobType = 'export' | 'auto_color' | 'auto_cut' | 'subtitles' | 'object_remove'

export async function POST(req: Request) {
  const { limit = 1 } = await req.json().catch(() => ({}))
  const supaReq = createRouteHandlerClient<Database>()
  await supaReq.auth.getUser().catch(() => null)

  const svc = createClient<Database>(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!
  )

  const { data: job } = await svc
    .from('render_jobs')
    .select('*')
    .eq('status', 'queued')
    .order('created_at', { ascending: true })
    .limit(limit)
    .maybeSingle()

  if (!job) return NextResponse.json({ ok: true, message: 'no jobs' })

  await update(job.id, { status: 'running', progress: 5 })

  try {
    const result = await processJob(job as any, svc)
    await update(job.id, {
      status: 'completed',
      progress: 100,
      output_url: result?.output_url ?? null,
      logs: result?.logs ?? null,
    })
    return NextResponse.json({ ok: true, job: job.id, result })
  } catch (e: any) {
    const msg = String(e?.message ?? e)
    await update(job.id, { status: 'failed', progress: 100, logs: msg })
    return NextResponse.json({ ok: false, error: msg }, { status: 500 })
  }

  async function update(id: string, patch: Partial<any>) {
    await svc.from('render_jobs').update(patch as any).eq('id', id)
  }
}

async function processJob(job: any, svc: SupabaseClient<Database>) {
  const type: JobType = job.job_type
  const params = (job.params ?? {}) as Record<string, any>
  const logs: string[] = []

  if (type === 'export' || type === 'auto_color' || type === 'auto_cut') {
    const { data: media } = await svc
      .from('session_media')
      .select('*')
      .eq('id', params.itemId)
      .maybeSingle<any>()
    if (!media) throw new Error('media not found')

    const src = media.public_url ?? media.url ?? media.storage_url ?? media.path
    if (!src) throw new Error('media src missing')

    const inPath = await fetchToTmp(src, `input-${job.id}.mp4`)
    const outPath = `/tmp/out-${job.id}.mp4`

    const vf: string[] = []
    if (type === 'auto_color')
      vf.push('eq=contrast=1.05:brightness=0.03:saturation=1.12')
    const dur = type === 'auto_cut' ? Number(params.targetDurationSec ?? 30) : undefined

    await new Promise<void>((resolve, reject) => {
      let cmd = ffmpeg(inPath).outputOptions(['-movflags +faststart'])
      if (vf.length) cmd = cmd.videoFilters(vf.join(','))
      if (dur) cmd = cmd.setDuration(dur)

      cmd
        .on('start', (commandLine: string) => logs.push(commandLine))
        .on('progress', () => {})
        .on('end', () => resolve())
        .on('error', (err: Error) => reject(err))
        .save(outPath)
    })

    const buf = await readNode(outPath)
    const upload = await svc.storage
      .from('renders')
      .upload(`jobs/${job.id}/export.mp4`, buf as any, {
        upsert: true,
        contentType: 'video/mp4',
      } as any)
    if (upload.error) throw upload.error
    const signed = await svc.storage
      .from('renders')
      .createSignedUrl(upload.data.path, 60 * 60 * 24 * 7)
    return { output_url: signed.data?.signedUrl ?? null, logs: logs.join('\n') }
  }

  if (type === 'subtitles') {
    const { data: media } = await svc
      .from('session_media')
      .select('*')
      .eq('id', params.itemId)
      .maybeSingle<any>()
    if (!media) throw new Error('media not found')

    const src = media.public_url ?? media.url ?? media.storage_url ?? media.path
    const inPath = await fetchToTmp(src, `input-${job.id}.mp4`)
    const wavPath = `/tmp/aud-${job.id}.wav`

    await new Promise<void>((resolve, reject) =>
      ffmpeg(inPath)
        .noVideo()
        .audioCodec('pcm_s16le')
        .audioChannels(1)
        .audioFrequency(16000)
        .on('end', () => resolve())
        .on('error', (err: Error) => reject(err))
        .save(wavPath)
    )

    const srt = await whisperToSRT(wavPath)
    const file = new Blob([srt], { type: 'text/plain;charset=utf-8' })
    const upload = await svc.storage
      .from('subtitles')
      .upload(`jobs/${job.id}/subs.srt`, file as any, {
        upsert: true,
        contentType: 'text/plain',
      } as any)
    if (upload.error) throw upload.error
    const signed = await svc.storage
      .from('subtitles')
      .createSignedUrl(upload.data.path, 60 * 60 * 24 * 7)
    return { output_url: signed.data?.signedUrl ?? null, logs: `len=${srt.length}` }
  }

  if (type === 'object_remove') {
    const src = params.src_url as string
    const mask = params.mask_url as string
    if (!src || !mask) throw new Error('src_url/mask_url missing')

    const editedUrl = await imageInpaint(src, mask, svc)
    return { output_url: editedUrl, logs: 'inpainted' }
  }

  throw new Error(`unknown job_type ${type}`)
}

/* ── Helpers ────────────────────────────────────────────────────────── */

async function fetchToTmp(url: string, name: string) {
  const res = await fetch(url)
  if (!res.ok) throw new Error('download failed')
  const buf = Buffer.from(await res.arrayBuffer())
  const p = `/tmp/${name}`
  const fs = await import('node:fs/promises')
  await fs.writeFile(p, buf)
  return p
}

async function readNode(path: string) {
  const fs = await import('node:fs/promises')
  return await fs.readFile(path)
}

async function whisperToSRT(wavPath: string) {
  const fs = await import('node:fs/promises')
  const b = await fs.readFile(wavPath)
  const form = new FormData()
  form.append('file', new Blob([b], { type: 'audio/wav' }), 'audio.wav')
  form.append('model', 'whisper-1')
  form.append('response_format', 'srt')

  const r = await fetch('https://api.openai.com/v1/audio/transcriptions', {
    method: 'POST',
    headers: { Authorization: `Bearer ${process.env.OPENAI_API_KEY!}` },
    body: form,
  })
  if (!r.ok) throw new Error(await r.text())
  return await r.text()
}

async function imageInpaint(srcUrl: string, maskUrl: string, svc: SupabaseClient<Database>) {
  const imgBuf = Buffer.from(await (await fetch(srcUrl)).arrayBuffer())
  const maskBuf = Buffer.from(await (await fetch(maskUrl)).arrayBuffer())
  const form = new FormData()
  form.append('model', 'gpt-image-1')
  form.append('image[]', new Blob([imgBuf], { type: 'image/png' }), 'image.png')
  form.append('mask', new Blob([maskBuf], { type: 'image/png' }), 'mask.png')

  const r = await fetch('https://api.openai.com/v1/images/edits', {
    method: 'POST',
    headers: { Authorization: `Bearer ${process.env.OPENAI_API_KEY!}` },
    body: form,
  })
  if (!r.ok) throw new Error(await r.text())
  const j: any = await r.json()
  const b64 = j.data?.[0]?.b64_json
  if (!b64) throw new Error('edit failed')

  const png = Buffer.from(b64, 'base64')
  const path = `inpaint/${crypto.randomUUID()}.png`
  const up = await svc.storage.from('renders').upload(path, png as any, {
    contentType: 'image/png',
    upsert: true,
  } as any)
  if (up.error) throw up.error
  const signed = await svc.storage.from('renders').createSignedUrl(up.data.path, 60 * 60 * 24 * 30)
  return signed.data?.signedUrl ?? null
}
