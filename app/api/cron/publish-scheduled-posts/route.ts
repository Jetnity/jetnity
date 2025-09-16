// app/api/cron/publish-scheduled-posts/route.ts
export const runtime = 'nodejs'
export const dynamic = 'force-dynamic'
export const revalidate = 0

import { NextResponse } from 'next/server'
import { getAdminClient } from '@/lib/supabase/admin'

function isAuthorized(req: Request, url: URL) {
  const isVercelCron = !!req.headers.get('x-vercel-cron')
  const authHeader = req.headers.get('authorization') || ''
  const bearer = authHeader.startsWith('Bearer ') ? authHeader.slice(7) : null
  const headerSecret = req.headers.get('x-cron-secret') || req.headers.get('x-cron-key')
  const querySecret = url.searchParams.get('secret')
  const envSecret = process.env.CRON_SECRET || ''
  const hasSecret = !!envSecret && (bearer === envSecret || headerSecret === envSecret || querySecret === envSecret)
  return isVercelCron || hasSecret
}

export async function GET(req: Request) {
  const url = new URL(req.url)
  if (!isAuthorized(req, url)) {
    return NextResponse.json({ ok: false, error: 'Unauthorized' }, { status: 401 })
  }

  const dry =
    url.searchParams.get('dry') === '1' ||
    url.searchParams.get('dryRun') === '1' ||
    url.searchParams.get('mode') === 'dry'

  const supa = getAdminClient()
  const nowIso = new Date().toISOString()

  if (dry) {
    const { count, error } = await supa
      .from('blog_posts') // ⚠️ keine Generics!
      .select('id', { head: true, count: 'exact' })
      .eq('status', 'scheduled')
      .lte('publish_at', nowIso)  // falls deine Spalte "scheduled_at" heißt, HIER anpassen
    if (error) return NextResponse.json({ ok: false, error: error.message }, { status: 500 })
    return NextResponse.json({ ok: true, mode: 'dry', due: count ?? 0 })
  }

  const { data: updated, error: updErr } = await supa
    .from('blog_posts')
    .update({ status: 'published', published_at: nowIso })
    .eq('status', 'scheduled')
    .lte('publish_at', nowIso)    // falls deine Spalte "scheduled_at" heißt, HIER anpassen
    .select('id')

  if (updErr) return NextResponse.json({ ok: false, error: updErr.message }, { status: 500 })

  return NextResponse.json({
    ok: true,
    published_count: updated?.length ?? 0,
    published: updated?.map(p => p.id) ?? [],
  })
}
