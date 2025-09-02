// app/api/uploads/signed-url/route.ts
import { NextResponse } from 'next/server'
import { createServerComponentClient } from '@/lib/supabase/server'
import { createSupabaseAdmin } from '@/lib/supabase/admin'

const BUCKET = 'creator-media'

export async function POST(req: Request) {
  try {
    const supabase = createServerComponentClient()
    const {
      data: { user },
      error: authErr,
    } = await supabase.auth.getUser()
    if (authErr || !user) {
      return NextResponse.json({ error: 'Not authenticated' }, { status: 401 })
    }

    const admin = createSupabaseAdmin()
    const { mime, ext }: { mime: string; ext?: string } = await req.json()

    const now = new Date()
    const yyyy = now.getFullYear()
    const mm = String(now.getMonth() + 1).padStart(2, '0')
    const uuid = crypto.randomUUID()
    const extension =
      ext?.replace(/^\./, '') ||
      (mime?.split('/')[1] || 'bin').toLowerCase()

    const path = `${user.id}/${yyyy}/${mm}/${uuid}.${extension}`

    const { data, error } = await admin.storage
      .from(BUCKET)
      .createSignedUploadUrl(path, { upsert: false })

    if (error || !data) {
      return NextResponse.json({ error: error?.message || 'Cannot create signed URL' }, { status: 500 })
    }

    const { data: pub } = admin.storage.from(BUCKET).getPublicUrl(path)

    return NextResponse.json({
      path,
      signedUrl: data.signedUrl,
      token: data.token,
      publicUrl: pub.publicUrl,
    })
  } catch (e: any) {
    return NextResponse.json({ error: e?.message || 'Unexpected error' }, { status: 500 })
  }
}
