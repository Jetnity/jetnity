// Read-only AT primary-source watch. Never refreshes an approved rule,
// grants permissions, changes Dev/Production, or writes SQL. Run on a reviewed
// hourly scheduler only after the separate release gate, not from this PR.
import { createHash } from 'node:crypto'
import { pathToFileURL } from 'node:url'

const MAX_MILLISECONDS=15_000
const PINNED_SOURCES=Object.freeze([
 Object.freeze({id:'bmi-visa-nationality-matrix',
   url:'https://www.bmi.gv.at/202/fremdenpolizei_und_grenzkontrolle/visumpflichtige_laender/start.html',
   bytes:498415,sha:'fcec70ebb5e7869591eaa8490025288534f5e44dddc0926102cd0bb27de8e778',
   edition:'(Stand: 6.11.2026)'}),
 Object.freeze({id:'bmi-general-entry',
   url:'https://www.bmi.gv.at/202/fremdenpolizei_und_grenzkontrolle/start.html',
   bytes:91655,sha:'ab2b735bf53e21a83c447fe9cfefabd7ffc54406f68793d01acac421fd6c301e',
   edition:null}),
 Object.freeze({id:'bmeia-bern-how-to-apply',
   url:'https://www.bmeia.gv.at/oeb-bern/reise-nach-oesterreich/einreise-und-aufenthalt/wie-stelle-ich-einen-antrag/',
   bytes:172460,sha:'7ca5618875cf1eccea033e1b851cdd8aea3d1aef80585048f62826c8c5266c18',
   edition:null}),
])

function fail(message){throw new Error(message)}
function originalClassification(body,pin){
 if(!(body instanceof Uint8Array)||body.byteLength===0||
    body.byteLength>1_048_576) return 'unavailable'
 const digest=createHash('sha256').update(body).digest('hex')
 const expected=pin.bytes===body.byteLength&&pin.sha===digest
 if(!expected)return 'changed'
 if(pin.edition && !(new TextDecoder('utf-8',{fatal:true}).decode(body).includes(pin.edition)))
    return 'unavailable'
 return 'unchanged'
}

/** Injectable fetch is for isolated native tests. No caller can choose the
 * URLs/pins in the executable CLI. A successful checksum is not an approval. */
export async function checkAtSourcePin(pin,request=fetch){
 let response,reader
 const controller=new AbortController()
 const deadline=setTimeout(()=>controller.abort(),MAX_MILLISECONDS)
 try{
  response=await request(pin.url,{method:'GET',redirect:'error',credentials:'omit',
    cache:'no-store',signal:controller.signal,headers:{accept:'text/html'}})
  if(controller.signal.aborted||response.status!==200||response.url!==pin.url||
      !/^(text\/html)(;|$)/i.test(response.headers.get('content-type')??''))
    return 'unavailable'
  const declared=response.headers.get('content-length')
  if(declared!==null&&(!/^(0|[1-9][0-9]*)$/.test(declared)||Number(declared)>1_048_576))
    return 'unavailable'
  if(!response.body)return 'unavailable'
  reader=response.body.getReader()
  let count=0
  const blocks=[]
  for(;;){
    if(controller.signal.aborted)return 'unavailable'
    const item=await reader.read()
    if(item.done)break
    count+=item.value.byteLength
    if(count>1_048_576)return 'unavailable'
    blocks.push(item.value)
  }
  if(declared!==null&&count!==Number(declared))return 'unavailable'
  const combined=new Uint8Array(count)
  let offset=0
  for(const chunk of blocks){combined.set(chunk,offset);offset+=chunk.byteLength}
  return originalClassification(combined,pin)
 }catch{return 'unavailable'}
 finally{
  clearTimeout(deadline)
  try{await reader?.cancel()}catch{}
  try{reader?.releaseLock()}catch{}
 }
}

/** Counters only. If any source differs, the importer must stop pending a
 * separately approved human/method/legal requalification. */
export async function checkAtOfficialSourceSet(fetcher=fetch){
 let unchanged=0,changed=0,unavailable=0
 for(const pin of PINNED_SOURCES){
  const status=await checkAtSourcePin(pin,fetcher)
  if(status==='unchanged')unchanged++
  else if(status==='changed')changed++
  else unavailable++
 }
 return Object.freeze({sources:PINNED_SOURCES.length,unchanged,changed,
  unavailable,accepted:0,published:0,status:
   changed>0?'CHANGED_REQUIRES_REVIEW':unavailable>0?'SOURCE_UNAVAILABLE':'PINNED_UNCHANGED_NOT_APPROVED'})
}

if(process.argv[1]&&import.meta.url===pathToFileURL(process.argv[1]).href){
 if(process.argv.length!==3||process.argv[2]!=='--once')fail('AT_OFFICIAL_WATCH_INVALID_ARGS')
 const result=await checkAtOfficialSourceSet()
 console.log(JSON.stringify(result))
 if(result.changed||result.unavailable)process.exitCode=1
}
