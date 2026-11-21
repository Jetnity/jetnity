// BG1 5-minute integrity-only Actions notification: UNARMED until Owner.
 // Fixed URL, existing public legacy anon key and ephemeral GitHub Actions token.
import {pathToFileURL} from 'node:url'
const REF='qscbgcdmivbbnzrcyegn'
const ARM='production:qscbgcdmivbbnzrcyegn:integrity-only-v2'
const RPC='https://'+REF+'.supabase.co/rest/v1/rpc/jetnity_bg1_alarm_kind_v2'
const COMMENT_URL='https://api.github.com/repos/Jetnity/jetnity/issues/1254/comments'
const MARK='jetnity_bg1_integrity_alarm_v2:generation:'
const out=(status,code,generation=null)=>Object.freeze({status,code,generation})
// A strictly bounded *public* legacy anon JWT. This is shape/identity checking;
// only Supabase can verify the HS256 signature at the fixed RPC endpoint.
const validLegacyAnon=(k,now=Date.now())=>{
 if(typeof k!=='string'||k.length<100||k.length>4096)return false
 try{
  const p=k.split('.');if(p.length!==3)return false
  const a=p.map((s,i)=>{
   if(!/^[A-Za-z0-9_-]+$/.test(s))throw Error('bad base64url')
   const b=Buffer.from(s,'base64url')
   if(b.length>[512,2048,32][i]||b.toString('base64url')!==s)throw Error('bad encoding')
   return b
  })
  if(a[2].length!==32)return false
  const [h,c]=a.slice(0,2).map(b=>{
   const s=new TextDecoder('utf-8',{fatal:true,ignoreBOM:true}).decode(b)
   const value=JSON.parse(s)
   return JSON.stringify(value)===s?value:null
  })
  const sec=Math.floor(now/1000)
  return exact(h,['alg','typ'])&&h.alg==='HS256'&&h.typ==='JWT'
   &&exact(c,['iss','ref','role','iat','exp'])
   &&c.iss==='supabase'&&c.ref===REF&&c.role==='anon'
   &&Number.isSafeInteger(c.iat)&&c.iat>0&&c.iat<=sec
   &&Number.isSafeInteger(c.exp)&&c.exp>sec&&c.exp>c.iat
 }catch{return false}
}
const validGh=k=>typeof k==='string'&&k.length>=20&&k.length<1000&&/^[A-Za-z0-9_-]+$/.test(k)
async function read(fetchImpl,url,options,max=1048576){
 const ctrl=new AbortController(),timer=setTimeout(()=>ctrl.abort(),10000)
 try{
  const res=await fetchImpl(url,{...options,signal:ctrl.signal,redirect:'error',cache:'no-store',credentials:'omit'})
  if(!res||res.redirected||res.status>=300&&res.status<400)throw Error('redirect')
  const n=res.headers?.get('content-length')
  if(n!==null&&n!==undefined&&(!/^[0-9]{1,10}$/.test(n)||Number(n)>max))throw Error('oversize')
  const reader=res.body?.getReader();if(!reader)throw Error('empty')
  const chunks=[];let bytes=0
  try{for(;;){const p=await reader.read();if(p.done)break
   if(!(p.value instanceof Uint8Array))throw Error('invalid bytes')
   bytes+=p.value.byteLength;if(bytes>max)throw Error('oversize')
   chunks.push(p.value)
  }}finally{try{reader.releaseLock()}catch{}}
  return {status:res.status,text:Buffer.concat(chunks,bytes).toString('utf8'),type:res.headers?.get('content-type')??''}
 }finally{clearTimeout(timer);ctrl.abort()}
}
const ghHeaders=token=>({Authorization:'Bearer '+token,Accept:'application/vnd.github+json','X-GitHub-Api-Version':'2022-11-28'})
function exact(v,keys){return v&&typeof v==='object'&&!Array.isArray(v)&&
 Object.keys(v).length===keys.length&&keys.every(k=>Object.hasOwn(v,k))}
async function seen(fetchImpl,token,generation){
 for(let page=1;page<=15;page++){
  const r=await read(fetchImpl,COMMENT_URL+'?per_page=100&page='+page,
   {method:'GET',headers:ghHeaders(token)})
  if(r.status!==200)throw Error('github read')
  const comments=JSON.parse(r.text)
  if(!Array.isArray(comments)||comments.length>100)throw Error('github shape')
  if(comments.some(v=>v?.user?.login==='github-actions[bot]'&&v?.user?.type==='Bot'
   &&typeof v.body==='string'&&v.body.startsWith(MARK+generation+'\n\n')))return true
  if(comments.length<100)return false
 }
 throw Error('github comments too numerous')
}
export async function observeBg1FiveMinuteIntegrity({env=process.env,fetchImpl=globalThis.fetch}={}){
 if(env.JETNITY_BG1_FIVE_MIN_ALARM!==ARM)return out('unarmed','not_activated')
 if(env.GITHUB_REPOSITORY!=='Jetnity/jetnity'||env.GITHUB_REF!=='refs/heads/main'
   ||env.SUPABASE_PROJECT_REF!==REF)return out('monitor_failed','target_refused')
 const key=env.JETNITY_BG1_PROD_ANON_KEY,token=env.GITHUB_TOKEN
 if(!validLegacyAnon(key)||!validGh(token)||typeof fetchImpl!=='function')
  return out('monitor_failed','credentials_invalid')
 try{
  const r=await read(fetchImpl,RPC,{method:'POST',body:'{}',
   headers:{apikey:key,'Content-Type':'application/json',Accept:'application/json'}},4096)
  if(r.status!==200||!/^application\/json\b/.test(r.type))throw Error('rpc response')
  const data=JSON.parse(r.text)
  if(!exact(data,['schema','status','incidentGeneration'])||data.schema!==1||
   !['current','temporarily_unavailable','integrity_locked'].includes(data.status)||
   !Number.isSafeInteger(data.incidentGeneration)||data.incidentGeneration<0||
   (data.status!=='integrity_locked'&&data.incidentGeneration!==0))throw Error('rpc shape')
  if(data.status==='current')return out('current','full_proof_current')
  if(data.status==='temporarily_unavailable')return out('transient','no_integrity_alarm')
  const generation=data.incidentGeneration
  if(await seen(fetchImpl,token,generation))return out('deduplicated','already_alerted',generation)
  const body=MARK+generation+'\n\n**BG1 Production Integritätssperre – Generation '+generation+'.**\n\n'+
   'Die geschützte Vollprüfung meldet einen ungelösten Sicherheits-/Integritätsvorfall. Kein automatisches Entsperren. '+
   'Kurzzeitige Cron-/Serveraussetzer lösen diese Nachricht nicht aus.\n\n'+
   'Owner-Review nach Sicherung und Belegprüfung: https://jetnity.com/einreise/betrieb\n'+
   'Diese Benachrichtigung ist KEINE Genehmigung zur Wiederaufnahme oder Migration.'
  const posted=await read(fetchImpl,COMMENT_URL,{method:'POST',
   headers:{...ghHeaders(token),'Content-Type':'application/json'},body:JSON.stringify({body})},16384)
  if(posted.status!==201)throw Error('not posted')
  return out('integrity_alert_posted','new_integrity_alarm',generation)
 }catch{return out('monitor_failed','read_or_delivery_unverified')}
}
if(process.argv[1]&&import.meta.url===pathToFileURL(process.argv[1]).href){
 const v=process.argv.length===2?await observeBg1FiveMinuteIntegrity():out('monitor_failed','arguments_refused')
 process.stdout.write(JSON.stringify(v)+'\n')
 process.exitCode=v.status==='monitor_failed'?1:v.status==='unarmed'?2:0
}
