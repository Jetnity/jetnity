import 'server-only'
import { z } from 'zod'
import { readinessBegrenztLesen,readinessContentLengthUeberschritten,readinessInhaltstypOk } from '../anfrage'
import { acceptedStoreAvailable } from './binding-server'
import { AcceptedStoreLifetime } from './lifetime-server'
import { readAcceptedStoreTrip } from './reader-server'

const requestSchema=z.object({tripId:z.string().uuid(),revision:z.number().int().positive().max(999_999_999)}).strict()
export async function acceptedStoreTripRequest(req:Request):Promise<{status:number;body:unknown}> {
  const unavailable={status:503,body:{message:'Die gespeicherte Einreiseprüfung ist derzeit nicht verfügbar.'}}
  // Absent deployment/key/witness binding precedes even body/Auth/client/DB work.
  if(!acceptedStoreAvailable())return unavailable
  if(req.method!=='POST')return {status:405,body:{message:'POST erwartet.'}}
  if(req.headers.get('origin')!==new URL(req.url).origin||req.headers.get('sec-fetch-site')&&req.headers.get('sec-fetch-site')!=='same-origin')
    return {status:403,body:{message:'Die Anfrage ist nicht verfügbar.'}}
  if(!readinessInhaltstypOk(req.headers.get('content-type')))return {status:415,body:{message:'JSON erwartet.'}}
  if(readinessContentLengthUeberschritten(req.headers.get('content-length'),8192))return {status:413,body:{message:'Anfrage zu gross.'}}
  const bodyLife=new AcceptedStoreLifetime(req.signal,2_000)
  let pipeline:Promise<boolean>|null=null
  try {
    const transfer=req.body?new TransformStream<Uint8Array,Uint8Array>():null
    if(req.body&&transfer)pipeline=bodyLife.run(()=>req.body!.pipeTo(transfer.writable,{signal:bodyLife.signal})).then(()=>true,()=>false)
    const text=await bodyLife.run(()=>readinessBegrenztLesen(transfer?.readable??null,8192))
    const pipelineOk=pipeline?await pipeline:true
    bodyLife.assertCurrent();if(!text.ok)return {status:text.status,body:{message:text.message}}
    if(!pipelineOk)throw Error('request_pipeline_failed')
    const parsed=requestSchema.safeParse(JSON.parse(text.text))
    if(!parsed.success)return {status:400,body:{message:'Ungültige Anfrage.'}}
    await bodyLife.settle()
    if(!acceptedStoreAvailable()||req.signal.aborted)return unavailable
    return await readAcceptedStoreTrip(parsed.data.tripId,parsed.data.revision,req.signal)
  } catch {return {status:400,body:{message:'Die Anfrage konnte nicht gelesen werden.'}}}
  finally {await bodyLife.settle();if(pipeline)await pipeline}
}
