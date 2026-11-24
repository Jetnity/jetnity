import { NextResponse } from 'next/server'
import { requireAdminApi } from '@/lib/auth/admin-guard'
import { adminWriteErlaubt } from '@/lib/auth/admin-write-gate'
import { readAtSourceV3Command } from '@/lib/readiness/official-truth-at-method-v1/at-source-v3-owner-contract'
import { executeAtSourceV3Owner } from '@/lib/readiness/official-truth-at-method-v1/at-source-v3-owner-server'

export const runtime='nodejs'
export const dynamic='force-dynamic'
const HEADERS={'Cache-Control':'private, no-store','X-Content-Type-Options':'nosniff'} as const
const MAX_BYTES=512
const refused=(status:number,error:string)=>NextResponse.json({error},{status,headers:HEADERS})

async function readBoundedJson(request:Request):Promise<unknown|null>{
 const len=request.headers.get('content-length')
 if(len!==null&&(!/^(0|[1-9][0-9]{0,3})$/.test(len)||Number(len)>MAX_BYTES))return null
 if(!request.body||request.signal.aborted)return null
 const reader=request.body.getReader();const parts:Uint8Array[]=[]
 let sum=0,done=false
 try{
  while(!done){
   if(request.signal.aborted)return null
   const chunk=await reader.read()
   if(chunk.done){done=true;break}
   sum+=chunk.value.byteLength
   if(sum>MAX_BYTES)return null
   parts.push(chunk.value)
  }
  if(len!==null&&sum!==Number(len))return null
  const bytes=new Uint8Array(sum);let offset=0
  for(const part of parts){bytes.set(part,offset);offset+=part.length}
  return JSON.parse(new TextDecoder('utf-8',{fatal:true,ignoreBOM:true}).decode(bytes))
 }catch{return null}
 finally{if(!done)await reader.cancel().catch(()=>undefined);reader.releaseLock()}
}

export async function POST(request:Request){
 try{
  const gate=await requireAdminApi({surface:'official-truth-source-v3',capability:'official-truth-freigeben'})
  if(!gate.ok){gate.response.headers.set('Cache-Control','private, no-store');return gate.response}
  if(gate.role!=='owner'||gate.grant!=='role'||!adminWriteErlaubt({grant:gate.grant}).erlaubt)
   return refused(403,'owner_required')
  const url=new URL(request.url)
  if(!url.pathname.endsWith('/api/admin/official-truth/at-source-v3')
    ||request.headers.get('origin')!==url.origin
    ||!/^application\/json(?:;|$)/i.test(request.headers.get('content-type')??''))
   return refused(400,'request_refused')
  const payload=readAtSourceV3Command(await readBoundedJson(request))
  if(!payload)return refused(400,'request_refused')
  const answer=await executeAtSourceV3Owner(payload)
  return NextResponse.json(answer,{status:answer.status==='unresolved'?409:200,headers:HEADERS})
 }catch{return refused(503,'request_unresolved')}
}
