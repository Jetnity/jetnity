import { NextResponse } from 'next/server'
import { createRouteHandlerClient } from '@/lib/supabase/server'
import type { Database } from '@/types/supabase'

export async function POST(req: Request){
  const supabase = createRouteHandlerClient<Database>()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error:'unauthorized' }, { status:401 })

  const form = await req.formData()
  const file = form.get('file') as File | null
  if (!file) return NextResponse.json({ error:'no file' }, { status:400 })
  const buf = Buffer.from(await file.arrayBuffer())
  const path = `masks/${user.id}/${Date.now()}-${file.name}`
  const { data, error } = await supabase.storage.from('masks').upload(path, buf as any, { upsert:true, contentType: 'image/png' } as any)
  if (error) return NextResponse.json({ error: error.message }, { status: 500 })
  const { data: signed } = await supabase.storage.from('masks').createSignedUrl(data.path, 60*60*24*7)
  return NextResponse.json({ ok:true, url: signed?.signedUrl })
}
