import { createRouteHandlerClient } from '@/lib/supabase/server'
import type { Json } from '@/types/supabase'
/** Only this exact new source-bound public RPC is callable from the AT visitor.
 * The global generated Production database types are not widened. */
type AtVisitorDatabase={public:{
 Tables:{[_ in never]:never};Views:{[_ in never]:never};
 Functions:{jetnity_source_bound_at_visa_v1:{Args:{p_citizenship_country_code:string};Returns:Json}};
 Enums:{[_ in never]:never};CompositeTypes:{[_ in never]:never}
}}
import { presentAtVisaReadbacks } from '@/lib/readiness/official-truth-at-method-v1/at-visitor-display'
import { readinessBegrenztLesen,readinessContentLengthUeberschritten,
 readinessHttpHeader,readinessInhaltstypOk,readinessKoerperLesen } from '@/lib/readiness/anfrage'
import { readinessAnfrageErlaubt,readinessRateKennungAus } from '@/lib/readiness/rate-limit'
import { selectedAustriaDev } from '@/lib/readiness/official-truth-at-method-v1/at-dev-selection'
import { selectedAustriaProduction } from '@/lib/readiness/official-truth-at-method-v1/at-production-selection'
import { selectedAtVisitorProductionPresentation } from '@/lib/readiness/official-truth-at-method-v1/at-visitor-release-server'
import { capAtProductionDisplayLease } from '@/lib/readiness/official-truth-at-method-v1/at-visitor-release'
import { readAtVisaInput,readAtVisaView } from '@/lib/readiness/official-truth-at-method-v1/at-visa-http'
export const runtime='nodejs'
export const dynamic='force-dynamic'
export const maxDuration=10
const reply=(status:number,data:unknown,headers:Record<string,string>={})=>
 Response.json(data,{status,headers:{...readinessHttpHeader(),...headers}})
/** Never accepts a supplied legal fact. Even when the independent Owner-held
 * Production visitor flag is enabled, only a current protected PG17
 * MA1/BG1/official-source read can produce an accepted visa result. */
export async function POST(request:Request):Promise<Response>{
 try{
  if(request.signal.aborted)return reply(503,{message:'Abgebrochen'})
  const rate=await readinessAnfrageErlaubt(readinessRateKennungAus(request.headers))
  if(!rate.ok)return reply(429,{message:'Zu viele Abfragen'},{'retry-after':String(rate.retryAfterSec)})
  if(!readinessInhaltstypOk(request.headers.get('content-type')))return reply(415,{message:'JSON erforderlich'})
  if(readinessContentLengthUeberschritten(request.headers.get('content-length'),1024))
    return reply(413,{message:'Anfrage zu gross'})
  const bounded=await readinessBegrenztLesen(request.body,1024)
  if(!bounded.ok)return reply(bounded.status,{message:bounded.message})
  const parsed=readinessKoerperLesen(bounded.text)
  const input=parsed.ok?readAtVisaInput(parsed.wert):null
  if(!input)return reply(400,{message:'Ungültige Passauswahl'})
  // Query only the selected exact passport codes. The guarded SQL must
  // independently reprove MA1/BG1/source and passport-specific authorization.
  const empty=presentAtVisaReadbacks(input,[],new Date())
  if(!(selectedAustriaDev()||selectedAustriaProduction())||request.signal.aborted)return reply(200,empty)
  const dev=selectedAustriaDev()
  // A transport flag is never a legal-copy or V3 fact-publication decision.
  if(!dev&&!selectedAtVisitorProductionPresentation())return reply(200,empty)
  const client=await createRouteHandlerClient<AtVisitorDatabase>()
  const attempts=await Promise.allSettled(input.citizenshipCountryCodes.map(async country=>{
    const response=await client.rpc('jetnity_source_bound_at_visa_v1',{p_citizenship_country_code:country})
      .abortSignal(request.signal)
    return {country,data:response.error?null:response.data}
  }))
  if(request.signal.aborted)return reply(200,empty)
  const readbacks=attempts.map((attempt,index)=>attempt.status==='fulfilled'?
    attempt.value:{country:input.citizenshipCountryCodes[index]!,data:null})
  const view=presentAtVisaReadbacks(input,readbacks,new Date(),!dev)
  const projected=dev?view:capAtProductionDisplayLease(view)
  return readAtVisaView(projected)?reply(200,projected):reply(200,empty)
 }catch{return reply(503,{message:'Visumauskunft vorübergehend nicht verfügbar'})}
}
