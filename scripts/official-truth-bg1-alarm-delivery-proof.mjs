// Explicitly synthetic end-to-end GitHub Actions PR-comment delivery proof.
// No Supabase/Vercel/DNS/Production credentials, calls or changes.
const API='https://api.github.com/repos/Jetnity/jetnity/issues/1254/comments'
const MARK='jetnity_bg1_alarm_transport_synthetic_pr1254_v1'
const BODY=MARK+'\n\n**BG1 ALARM-TRANSPORTTEST (synthetisch, kein Production-Vorfall).**\n'+
  'GitHub-Actions-Bot hat einen harmlosen Testkommentar erstellt und rückgelesen. '+ 
  'Keine Datenbankabfrage, keine Entsperrung, keine Owner-Aktion.\n'+
  'Dieser Nachweis beweist nicht automatisch eine Push- oder E-Mail-Zustellung.';
const HEAD='feat/official-truth-universal-source-registry-dev-20261119'
export async function deliverProof({env=process.env,fetchImpl=globalThis.fetch}={}){
  if(env.GITHUB_REPOSITORY!=='Jetnity/jetnity'||env.GITHUB_EVENT_NAME!=='pull_request'||
  env.GITHUB_HEAD_REF!==HEAD||env.GITHUB_EVENT_PULL_REQUEST_NUMBER!=='1254')
    return {status:'refused',reason:'not_exact_pr'}
  const token=env.GITHUB_TOKEN
  if(typeof token!=='string'||!token.match(/^[A-Za-z0-9_-]{20,1000}$/)||typeof fetchImpl!=='function')
    return {status:'refused',reason:'token_or_transport'}
  const headers={Authorization:'Bearer '+token,Accept:'application/vnd.github+json',
    'X-GitHub-Api-Version':'2022-11-28'}
  try{
    let found=null
    for(let page=1;page<=15;page++){
      const r=await fetchImpl(API+'?per_page=100&page='+page,{method:'GET',headers,redirect:'error'})
      if(!r||r.status!==200||r.redirected)throw Error('github_read')
      const a=await r.json()
      if(!Array.isArray(a)||a.length>100)throw Error('github_shape')
      found=a.find(v=>v?.user?.login==='github-actions[bot]'&&v?.user?.type==='Bot'&&v?.body===BODY)
      if(found||a.length<100)break
    }
    if(!found){
      const p=await fetchImpl(API,{method:'POST',
        headers:{...headers,'Content-Type':'application/json'},body:JSON.stringify({body:BODY}),redirect:'error'})
      if(!p||p.status!==201||p.redirected)throw Error('github_post')
      found=await p.json()
      if(!Number.isSafeInteger(found?.id)||found.id<=0)throw Error('invalid_post_id')
    }
    const v=await fetchImpl('https://api.github.com/repos/Jetnity/jetnity/issues/comments/'+found.id,
      {method:'GET',headers,redirect:'error'})
    if(!v||v.status!==200||v.redirected)throw Error('readback_error')
    const confirmed=await v.json()
    if(confirmed.id!==found.id||confirmed.body!==BODY||
       confirmed.user?.login!=='github-actions[bot]'||confirmed.user?.type!=='Bot')
      throw Error('readback_unverified')
    return {status:'verified',commentId:found.id}
  }catch{return {status:'unverified'}}
}
if(process.argv[1]&&import.meta.url===new URL('file://'+process.argv[1]).href){
 const r=await deliverProof()
 process.stdout.write(r.status+'\n')
 process.exitCode=r.status==='verified'?0:1
}
