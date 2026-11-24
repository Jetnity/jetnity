import 'server-only'
import type { SupabaseClient } from '@supabase/supabase-js'
import { createServerComponentClient, getServerSupabaseUrl } from '@/lib/supabase/server'
import { HUMAN_METHOD_PRODUCTION_URL } from '@/lib/readiness/official-truth-product-v3/method/human-contract'
import { AT_SOURCE_V3_BMEIA_SHA, AT_SOURCE_V3_SELECTION, type AtSourceV3Command,
  type AtSourceV3Outcome } from './at-source-v3-owner-contract'

type SourceV3Db={public:{
  Tables:Record<string,never>;Views:Record<string,never>;
  Enums:Record<string,never>;CompositeTypes:Record<string,never>;
  Functions:{
   official_v3_at_ch_source_approve_v3:{Args:{p_operation_id:string;p_bmeia_sha:string};Returns:unknown};
   official_v3_at_ch_source_confirm_v3:{Args:{p_operation_id:string;p_bmeia_sha:string};Returns:unknown};
  }
}}
export function atSourceV3ProductionSelected():boolean{
 return process.env.JETNITY_OFFICIAL_AT_PRODUCTION_SOURCE_V3_OWNER_V1==='enabled'
  &&process.env.VERCEL_ENV==='production'
  &&process.env.VERCEL_PROJECT_ID==='prj_wTTVawPItEO7a4HihEmaU3PsuaXM'
  &&process.env.VERCEL_GIT_REPO_OWNER==='Jetnity'
  &&process.env.VERCEL_GIT_REPO_SLUG==='jetnity'
  &&process.env.VERCEL_GIT_COMMIT_REF==='main'
  &&getServerSupabaseUrl()===HUMAN_METHOD_PRODUCTION_URL
}
// The role and AAL2 checks in requireAdminApi are additional layers only.
// The SQL SECURITY DEFINER action ALSO requires the current persisted Owner session.
export async function executeAtSourceV3Owner(command:AtSourceV3Command):Promise<AtSourceV3Outcome>{
 const unresolved=(code:string):AtSourceV3Outcome=>({
  schema:3,intent:command.intent,status:'unresolved',operationId:command.operationId,recordedAt:null,code,
 })
 if(!atSourceV3ProductionSelected()
 ||command.selectionId!==AT_SOURCE_V3_SELECTION
 ||command.sourceSha!==AT_SOURCE_V3_BMEIA_SHA)return unresolved('target_refused')
 try{
  const client=await createServerComponentClient<SourceV3Db>()
  const params={p_operation_id:command.operationId,p_bmeia_sha:AT_SOURCE_V3_BMEIA_SHA}
  const {data,error}=command.intent==='approve'
    ?await client.rpc('official_v3_at_ch_source_approve_v3',params)
    :await client.rpc('official_v3_at_ch_source_confirm_v3',params)
  if(error||!data||typeof data!=='object'||Array.isArray(data))return unresolved('db_refused')
  const result=data as Record<string,unknown>
  const expected=command.intent==='approve'?'recorded':'confirmed'
  if(result.schema!==3||result.operationId!==command.operationId
    ||(result.status!==expected && !(command.intent==='confirm'&&result.status==='absent'))
    ||(result.status!=='absent'&&result.sourceSha!==AT_SOURCE_V3_BMEIA_SHA)
    ||(result.status!=='absent'&&(typeof result.recordedAt!=='string'
       ||!Number.isFinite(Date.parse(result.recordedAt)))))
   return unresolved('readback_invalid')
  return{schema:3,intent:command.intent,status:result.status as AtSourceV3Outcome['status'],
    operationId:command.operationId,recordedAt:result.status==='absent'?null:result.recordedAt as string,code:null}
 }catch{return unresolved('request_unresolved')}
}
