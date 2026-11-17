import { z } from 'zod'
import { createRouteHandlerClient } from '@/lib/supabase/server'
import { landAnzeigeText } from '@/lib/country/darstellung'
import { readinessBegrenztLesen,readinessContentLengthUeberschritten,
 readinessHttpHeader,readinessInhaltstypOk,readinessKoerperLesen } from '@/lib/readiness/anfrage'
import { readinessAnfrageErlaubt,readinessRateKennungAus } from '@/lib/readiness/rate-limit'
import { selectedAustriaDev } from '@/lib/readiness/official-truth-at-method-v1/at-dev-selection'
import { readAtVisaInput,readAtVisaView } from '@/lib/readiness/official-truth-at-method-v1/at-visa-http'
import type { V3VisitorInput } from '@/lib/readiness/official-truth-product-v3/contract'
import type { V3VisitorView,V3VisitorViewResult } from '@/lib/readiness/official-truth-product-v3/visitor/presentation'
export const runtime='nodejs'
export const dynamic='force-dynamic'
export const maxDuration=10
const BERN='https://www.bmeia.gv.at/oeb-bern/reise-nach-oesterreich/einreise-und-aufenthalt/wie-stelle-ich-einen-antrag/' as const
const A=z.string().regex(/^\d{4}-\d\d-\d\dT\d\d:\d\d:\d\d\.\d{3}Z$/)
 .refine(x=>Number.isFinite(Date.parse(x))&&new Date(x).toISOString()===x)
const exact=z.object({status:z.literal('accepted'),citizenshipCountryCode:z.literal('CH'),
 destinationCountryCode:z.literal('AT'),documentType:z.literal('passport'),
 visaEffect:z.literal('not_required'),visaMode:z.literal('visa_exempt'),
 ruleVersion:z.number().int().min(1).max(2147483646),
 sourceCheckedAt:A,verifiedAt:A,expiresAt:A,
 sourceUrls:z.tuple([
 z.literal('https://www.bmi.gv.at/202/fremdenpolizei_und_grenzkontrolle/start.html'),
 z.literal('https://www.bmi.gv.at/202/fremdenpolizei_und_grenzkontrolle/visumpflichtige_laender/start.html'),
 z.literal(BERN)]),
}).strict()
const neutral:V3VisitorViewResult={status:'unavailable',title:'Derzeit nicht verfügbar',
 message:'Für diese Staatsangehörigkeit liegt derzeit keine bestätigte amtliche Auskunft vor.'}
const make=(input:V3VisitorInput):V3VisitorView=>({input,generatedAt:new Date().toISOString(),
 synthetic:false,cells:input.citizenshipCountryCodes.map(country=>({
 country,label:landAnzeigeText(country),results:[neutral]}))})
const reply=(status:number,data:unknown,headers:Record<string,string>={})=>
 Response.json(data,{status,headers:{...readinessHttpHeader(),...headers}})
/** Never accepts a supplied legal fact. Only a real Dev MA1/BG1/Source-checked
 * private SQL reply with unexpired absolute timestamps can show visa freedom. */
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
  const fallback=make(input)
  if(!selectedAustriaDev()||!input.citizenshipCountryCodes.includes('CH')||request.signal.aborted)
    return reply(200,fallback)
  const client=await createRouteHandlerClient()
  const db=await client.rpc('jetnity_at_visa_v3',{p_citizenship_country_code:'CH'})
    .abortSignal(request.signal)
  if(db.error||request.signal.aborted)return reply(200,fallback)
  const result=exact.safeParse(db.data)
  if(!result.success||Date.parse(result.data.expiresAt)<=Date.now()||
   Date.parse(result.data.verifiedAt)>Date.now()||Date.parse(result.data.sourceCheckedAt)>Date.now())
   return reply(200,fallback)
  const value=result.data
  const accepted:V3VisitorViewResult={status:'accepted',informationTopic:'visa',title:'Visum',
   conditions:['Schweizer Staatsangehörigkeit','Gültiger Schweizer Reisepass','Direkte Einreise nach Österreich'],
   statements:[{text:'Für Schweizer Staatsangehörige mit Schweizer Reisepass ist bei direkter Einreise nach Österreich kein Visum erforderlich.',
     when:null,href:BERN}],
   source:{label:'Österreichische Botschaft Bern',href:BERN},
   checkedAtText:'Amtliche Quelle geprüft: '+new Date(value.sourceCheckedAt).toLocaleDateString('de-CH',{timeZone:'UTC'}),
   validityText:'Quellengebundene Auskunft, keine allgemeine Einreisegarantie',
   ruleVersion:value.ruleVersion,expiresAt:value.expiresAt}
  const view:V3VisitorView={...fallback,cells:fallback.cells.map(cell=>cell.country==='CH'
    ?{...cell,results:[accepted]}:cell)}
  return readAtVisaView(view)?reply(200,view):reply(200,fallback)
 }catch{return reply(503,{message:'Visumauskunft vorübergehend nicht verfügbar'})}
}
