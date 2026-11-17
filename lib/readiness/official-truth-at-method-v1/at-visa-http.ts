import { z } from 'zod'
import { providerOpsBegrenztLesen,providerOpsContentLengthUeberschritten,
 providerOpsInhaltstypOk,providerOpsKoerperLesen } from '@/lib/provider-ops/anfrage'
import { readV3VisitorInput,type V3VisitorInput } from '../official-truth-product-v3/contract'
import type { V3VisitorView } from '../official-truth-product-v3/visitor/presentation'
import type { V3VisitorLoad } from '../official-truth-product-v3/visitor/controller'
export const AT_VISA_HTTP_PATH='/api/readiness/at-visa'
const S=z.string().min(1).max(2000)
const ISO=z.string().regex(/^\d{4}-\d\d-\d\dT\d\d:\d\d:\d\d\.\d{3}Z$/)
 .refine(x=>Number.isFinite(Date.parse(x))&&new Date(x).toISOString()===x)
const URLS=[
 'https://www.bmi.gv.at/202/fremdenpolizei_und_grenzkontrolle/start.html',
 'https://www.bmi.gv.at/202/fremdenpolizei_und_grenzkontrolle/visumpflichtige_laender/start.html',
 'https://www.bmeia.gv.at/oeb-bern/reise-nach-oesterreich/einreise-und-aufenthalt/wie-stelle-ich-einen-antrag/',
] as const
const H=z.enum(URLS)
const INPUT=z.object({destinationCountryCode:z.literal('AT'),
 citizenshipCountryCodes:z.array(z.string().regex(/^[A-Z]{2}$/)).min(1).max(5)
  .refine(v=>new Set(v).size===v.length)}).strict()
const accepted=z.object({status:z.literal('accepted'),informationTopic:z.literal('visa'),
 title:S,conditions:z.array(S).min(1).max(10),
 statements:z.array(z.object({text:S,when:S.nullable(),href:H.nullable()}).strict()).min(1).max(4),
 source:z.object({label:S,href:H}).strict(),checkedAtText:S,validityText:S,
 ruleVersion:z.number().int().min(1).max(2147483646),expiresAt:ISO}).strict()
const negative=z.object({status:z.literal('unavailable'),title:S,message:S}).strict()
const VIEW=z.object({input:INPUT,generatedAt:ISO,synthetic:z.literal(false),
 cells:z.array(z.object({country:z.string().regex(/^[A-Z]{2}$/),label:S,
 results:z.tuple([z.union([accepted,negative])])}).strict()).min(1).max(5)}).strict()
 .refine(v=>v.cells.length===v.input.citizenshipCountryCodes.length&&v.cells.every((cell,i)=>
 cell.country===v.input.citizenshipCountryCodes[i]&&cell.results.every(x=>
 x.status!=='accepted'||(cell.country==='CH'&&Date.parse(x.expiresAt)>Date.parse(v.generatedAt)))))
export function readAtVisaInput(raw:unknown):V3VisitorInput|null{
 const a=INPUT.safeParse(raw);return a.success&&readV3VisitorInput(a.data).ok?a.data:null
}
export function readAtVisaView(raw:unknown):V3VisitorView|null{
 const v=VIEW.safeParse(raw);return v.success&&readAtVisaInput(v.data.input)?v.data:null
}
export const loadAtVisa:V3VisitorLoad=async(input,signal)=>{
 const failed={daten:null,fehler:{meldung:'Die Visumauskunft ist vorübergehend nicht verfügbar.',wiederholbar:true}}
 if(signal.aborted||!readAtVisaInput(input))return failed
 try{
  const response=await fetch(AT_VISA_HTTP_PATH,{method:'POST',signal,credentials:'same-origin',
   cache:'no-store',redirect:'error',headers:{'content-type':'application/json',accept:'application/json'},
   body:JSON.stringify(input)})
  if(!response.ok||signal.aborted||!providerOpsInhaltstypOk(response.headers.get('content-type'))||
     providerOpsContentLengthUeberschritten(response.headers.get('content-length'),65536)){
     await response.body?.cancel();return failed
  }
  const data=await providerOpsBegrenztLesen(response.body,65536,'Antwort zu gross')
  if(!data.ok||signal.aborted)return failed
  const body=providerOpsKoerperLesen(data.text,'Antwort nicht lesbar')
  const view=body.ok?readAtVisaView(body.wert):null
  return view?{daten:view,fehler:null}:failed
 }catch{return failed}
}
