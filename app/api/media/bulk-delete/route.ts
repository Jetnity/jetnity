import { NextResponse } from 'next/server'
import { cookies } from 'next/headers'
import { createServerComponentClient } from '@/lib/supabase/server'
import type { Database } from '@/types/supabase'

export async function POST(req: Request) {
  const supabase = createServerComponentClient<Database>()
  const { data: auth } = await supabase.auth.getUser()
  const user = auth.user
  if (!user) return NextResponse.json({ error: 'unauthorized' }, { status: 401 })

  try {
    const body = await req.json().catch(() => ({}))
    const ids: string[] = Array.isArray(body?.ids) ? body.ids.filter(Boolean) : []
    if (!ids.length) return NextResponse.json({ error: 'missing ids' }, { status: 400 })

    // Relevante Einträge lesen (nur eigene)
    const { data: rows, error } = await supabase
      .from('session_media')
      .select('id,image_url')
      .in('id', ids)
      .eq('user_id', user.id)

    if (error) throw error

    // Storage löschen (best-effort)
    const byBucket = new Map<string, Set<string>>()
    for (const r of rows ?? []) {
      const parsed = parseStoragePath((r as any).image_url)
      if (parsed) {
        const set = byBucket.get(parsed.bucket) ?? new Set<string>()
        set.add(parsed.path)
        byBucket.set(parsed.bucket, set)
      }
    }
    for (const [bucket, set] of byBucket) {
      const paths = Array.from(set)
      if (paths.length) {
        await supabase.storage.from(bucket).remove(paths).catch(() => {})
      }
    }

    // DB löschen
    const { error: delErr, count } = await supabase
      .from('session_media')
      .delete({ count: 'exact' })
      .in('id', ids)
      .eq('user_id', user.id)

    if (delErr) throw delErr
    return NextResponse.json({ ok: true, deleted: count ?? 0 })
  } catch (e: any) {
    console.error('[bulk-delete] error:', e?.message || e)
    return NextResponse.json({ error: 'failed' }, { status: 500 })
  }
}

// Versucht, aus einer URL "bucket/path" zu gewinnen
function parseStoragePath(u: string | null | undefined): { bucket: string; path: string } | null {
  if (!u) return null
  // a) Direkte Form "bucket/path"
  if (/^[a-z0-9_\-]+\/.+/i.test(u)) {
    const [bucket, ...rest] = u.split('/')
    return { bucket, path: rest.join('/') }
  }
  try {
    const url = new URL(u)
    // b) Signierte URLs: .../object/sign/<bucket>/<path>?token=...
    const signIdx = url.pathname.indexOf('/object/sign/')
    if (signIdx >= 0) {
      const seg = url.pathname.slice(signIdx + '/object/sign/'.length)
      const [bucket, ...rest] = seg.split('/')
      return bucket && rest.length ? { bucket, path: rest.join('/') } : null
    }
    // c) Public URLs: .../object/public/<bucket>/<path>
    const pubIdx = url.pathname.indexOf('/object/public/')
    if (pubIdx >= 0) {
      const seg = url.pathname.slice(pubIdx + '/object/public/'.length)
      const [bucket, ...rest] = seg.split('/')
      return bucket && rest.length ? { bucket, path: rest.join('/') } : null
    }
  } catch {}
  return null
}
