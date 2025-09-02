// app/api/cron/publish-scheduled-posts/route.ts
import { NextResponse } from 'next/server'
import { createAdminClient } from '@/lib/supabase/admin'
import type { Database } from '@/types/supabase'

export const dynamic = 'force-dynamic'

function isAuthorized(req: Request, url: URL) {
  // 1) Vercel Cron setzt x-vercel-cron Header
  const isVercelCron = req.headers.get('x-vercel-cron') === '1'

  // 2) Optional: lokaler/alternativer Schutz via Bearer oder ?secret=
  const authHeader = req.headers.get('authorization') || ''
  const bearer = authHeader.startsWith('Bearer ')
    ? authHeader.slice('Bearer '.length)
    : null
  const secretParam = url.searchParams.get('secret')
  const secretEnv = process.env.CRON_SECRET

  const hasSecret =
    !!secretEnv && (bearer === secretEnv || secretParam === secretEnv)

  return isVercelCron || hasSecret
}

export async function GET(req: Request) {
  const url = new URL(req.url)

  if (!isAuthorized(req, url)) {
    return NextResponse.json({ ok: false, error: 'Unauthorized' }, { status: 401 })
  }

  const dry =
    url.searchParams.get('dry') === '1' ||
    url.searchParams.get('dryRun') === '1'

  const supabase = createAdminClient<Database>()

  if (dry) {
    const { data, error } = await supabase
      .from('blog_posts')
      .select('id', { count: 'exact', head: true })
      .eq('status', 'scheduled')
      .lte('scheduled_at', new Date().toISOString())

    if (error) {
      return NextResponse.json({ ok: false, error: error.message }, { status: 500 })
    }
    return NextResponse.json({ ok: true, mode: 'dry', due: data?.length ?? 0 })
  }

  // Transaktionale, konkurrenz-sichere Veröffentlichung via RPC (SECURITY DEFINER)
  const { data, error } = await supabase.rpc('publish_due_blog_posts', {
    batch_size: 200,
  })

  if (error) {
    return NextResponse.json({ ok: false, error: error.message }, { status: 500 })
  }

  // Optional: hier könnten Mails/Events getriggert werden (RESEND, Webhooks usw.)
  return NextResponse.json({
    ok: true,
    published_count: data?.length ?? 0,
    published: data ?? [],
  })
}
