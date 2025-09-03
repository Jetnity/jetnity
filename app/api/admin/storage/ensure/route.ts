// app/api/admin/storage/ensure/route.ts
export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';
export const revalidate = 0;

import { NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'

// Optionaler Schutz (empfohlen): Secret-Header prüfen
function assertAuthorized(req: Request) {
  const need = process.env.CRON_SECRET
  if (!need) return true // wenn kein Secret gesetzt, nicht blocken (Dev/Preview)
  const got = req.headers.get('authorization')
  return got === `Bearer ${need}`
}

export async function GET(req: Request) {
  try {
    if (!assertAuthorized(req)) {
      return new NextResponse('Unauthorized', { status: 401 })
    }

    const url = process.env.NEXT_PUBLIC_SUPABASE_URL
    const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY
    if (!url || !serviceKey) {
      return new NextResponse('Supabase env missing', { status: 500 })
    }

    const admin = createClient(url, serviceKey, {
      auth: { persistSession: false },
    })

    const BUCKET = 'jetnity-media'
    const { data: buckets, error: listErr } = await admin.storage.listBuckets()
    if (listErr) {
      return new NextResponse(`List buckets failed: ${listErr.message}`, { status: 500 })
    }

    const exists = buckets?.some(b => b.name === BUCKET)
    if (!exists) {
      const { error: createErr } = await admin.storage.createBucket(BUCKET, {
        public: true,
        fileSizeLimit: 50 * 1024 * 1024, // 50MB
      })
      if (createErr) {
        return new NextResponse(`Create bucket failed: ${createErr.message}`, { status: 500 })
      }
    }

    return NextResponse.json({ ok: true, bucket: BUCKET })
  } catch (e: any) {
    return new NextResponse(e?.message || 'Internal error', { status: 500 })
  }
}
