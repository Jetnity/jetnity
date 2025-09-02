// app/api/media/sign-url/route.ts
export const dynamic = 'force-dynamic'

import { NextResponse } from 'next/server'
import { createServerComponentClient } from '@/lib/supabase/server'
import type { Database } from '@/types/supabase'

type Body = {
  bucket?: string
  path?: string
  expires?: number
}

/** POST -> { url }  | 400/401/500 */
export async function POST(req: Request) {
  const supabase = createServerComponentClient<Database>() // ✅ euer Helper, keine Args

  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: 'unauthorized' }, { status: 401 })

  const body = (await req.json().catch(() => ({}))) as Body
  const bucket = (body.bucket || '').trim()
  const path = (body.path || '').trim()
  if (!bucket || !path) {
    return NextResponse.json({ error: 'bucket & path required' }, { status: 400 })
  }

  const expires = Number.isFinite(body.expires)
    ? Math.max(60, Math.min(60 * 60 * 24, Number(body.expires))) // 1 Min – 24 h
    : 60 * 60 * 6 // default 6h

  const { data, error } = await supabase.storage.from(bucket).createSignedUrl(path, expires)
  if (!error && data?.signedUrl) return NextResponse.json({ url: data.signedUrl })

  // Fallback: public URL (falls Bucket öffentlich)
  const pub = supabase.storage.from(bucket).getPublicUrl(path)
  if (pub.data?.publicUrl) return NextResponse.json({ url: pub.data.publicUrl })

  return NextResponse.json({ error: 'signing failed' }, { status: 500 })
}
