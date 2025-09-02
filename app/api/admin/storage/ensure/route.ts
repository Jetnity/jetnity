// app/api/admin/storage/ensure/route.ts
import { NextResponse } from 'next/server'
import { ensurePublicBucket } from '@/lib/supabase/admin/storage'
export async function GET() {
  await ensurePublicBucket(process.env.AI_IMAGE_BUCKET || 'public')
  return NextResponse.json({ ok: true })
}
