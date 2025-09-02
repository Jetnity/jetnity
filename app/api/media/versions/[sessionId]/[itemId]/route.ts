import { NextResponse } from 'next/server'
import { createRouteHandlerClient } from '@/lib/supabase/server'
import type { Database } from '@/types/supabase'

export async function GET(_req:Request,{params}:{params:{sessionId:string;itemId:string}}){
  const s = createRouteHandlerClient<Database>()
  const { data } = await s.from('media_versions').select('id,label,created_at').eq('session_id',params.sessionId).eq('item_id',params.itemId).order('created_at',{ascending:true})
  return NextResponse.json({ versions: data ?? [] })
}
export async function POST(req:Request,{params}:{params:{sessionId:string;itemId:string}}){
  const body = await req.json().catch(()=>({}))
  const s = createRouteHandlerClient<Database>()
  const { data: { user } } = await s.auth.getUser()
  if(!user) return NextResponse.json({error:'unauthorized'},{status:401})
  // aktuelles edit_doc lesen
  const { data: doc } = await s.from('edit_docs').select('id,doc').eq('session_id',params.sessionId).eq('item_id',params.itemId).eq('user_id',user.id).maybeSingle()
  const { data, error } = await s.from('media_versions').insert({
    user_id: user.id, session_id: params.sessionId, item_id: params.itemId, label: body.label ?? 'Version', edit_doc_id: doc?.id ?? null, doc: doc?.doc ?? {}
  } as any).select('id,label,created_at').single()
  if(error) return NextResponse.json({error:error.message},{status:500})
  return NextResponse.json({ version: data })
}
