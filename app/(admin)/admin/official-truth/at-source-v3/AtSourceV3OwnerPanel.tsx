'use client'
import { useEffect,useRef,useState } from 'react'
import {
 AT_SOURCE_V3_BMEIA_SHA,AT_SOURCE_V3_BMEIA_BYTES,AT_SOURCE_V3_SELECTION,
 AT_SOURCE_V3_SOURCES,AT_SOURCE_V3_OLD_LINK,AT_SOURCE_V3_NEW_LINK,
 readAtSourceV3Command,type AtSourceV3Intent
} from '@/lib/readiness/official-truth-at-method-v1/at-source-v3-owner-contract'

const STORAGE='jetnity-official-truth-at-ch-source-v3-owner-pending'
const BUTTON='min-h-11 rounded-md border px-4 py-3 font-medium disabled:opacity-50 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2'
const SOURCE_URLS=AT_SOURCE_V3_SOURCES

export default function AtSourceV3OwnerPanel({enabled}:{enabled:boolean}){
 const [pending,setPending]=useState<string|null>(null)
 const [blocked,setBlocked]=useState(false)
 const [checked,setChecked]=useState(false)
 const [busy,setBusy]=useState(false)
 const [status,setStatus]=useState('Kein Quellenentscheid wurde ausgelöst.')
 const lock=useRef(false)
 useEffect(()=>{
  try{
   const id=sessionStorage.getItem(STORAGE)
   if(id){
    if(!/^atsrc3_[a-f0-9]{32}$/.test(id)){setBlocked(true);setStatus('Gespeicherte Vorgangskennung unlesbar. Keine neue Aktion möglich.');return}
    setPending(id);setStatus('Gespeicherter Vorgang vorhanden. Prüfe zuerst denselben Vorgang.')
   }
  }catch{setBlocked(true);setStatus('Sicherer Sitzungsspeicher nicht verfügbar: keine Freigabe möglich.')}
 },[])

 async function submit(intent:AtSourceV3Intent){
  if(lock.current||busy||blocked||!enabled)return
  if(intent==='approve'&&(!checked||pending!==null))return
  lock.current=true;setBusy(true);setChecked(false)
  let id=pending
  try{
   if(intent==='approve'){
    id='atsrc3_'+crypto.randomUUID().replaceAll('-','')
    if(!id||!/^atsrc3_[a-f0-9]{32}$/.test(id))throw Error('operation_id_unavailable')
    sessionStorage.setItem(STORAGE,id)
    if(sessionStorage.getItem(STORAGE)!==id)throw Error('storage_not_confirmed')
    setPending(id)
   }else if(!id)return
   const request={schema:3,intent,selectionId:AT_SOURCE_V3_SELECTION,
    sourceSha:AT_SOURCE_V3_BMEIA_SHA,operationId:id}
   if(!readAtSourceV3Command(request))throw Error('request_invalid')
   const response=await fetch('/api/admin/official-truth/at-source-v3',{
    method:'POST',credentials:'same-origin',cache:'no-store',redirect:'error',
    headers:{'Content-Type':'application/json'},body:JSON.stringify(request)})
   if(response.status===401||response.status===403){
    setStatus('Owner-Zugang oder Zwei-Faktor (AAL2) fehlt. Nach Anmeldung denselben Vorgang prüfen – nicht neu freigeben.')
    return
   }
   if(!/^application\/json(?:;|$)/.test(response.headers.get('content-type')??''))throw Error('invalid_response_type')
   const data:unknown=await response.json()
   if(!data||typeof data!=='object'||Array.isArray(data))throw Error('invalid_response')
   const val=data as Record<string,unknown>
   if(val.schema!==3||val.operationId!==id)throw Error('mismatched_receipt')
   if(response.ok && val.status==='recorded' && intent==='approve'){
    setStatus('Quellenentscheid protokolliert. Bitte jetzt «Gespeicherten Entscheid bestätigen» klicken; keine Besucherfreigabe.')
   }else if(response.ok&&val.status==='confirmed'&&intent==='confirm'){
    setStatus('Quellenentscheid durch frischen Owner-AAL2-Leseweg bestätigt: '+String(val.recordedAt)+'. Keine Kundenfreischaltung erfolgt.')
   }else if(response.ok&&val.status==='absent'&&intent==='confirm'){
    setStatus('Für diesen Vorgang ist aktuell keine Entscheidung gespeichert. Keine neue Freigabe ohne Prüfung auslösen.')
   }else{
    setStatus('Ausgang nicht bestätigt. Vorgang bleibt gespeichert. Nur denselben Vorgang prüfen, nicht erneut starten.')
   }
  }catch{
   setStatus('Ausgang offen oder Netzwerkfehler: kein Erfolg behauptet. Gespeicherten Vorgang prüfen; kein neuer Versuch.')
  }finally{lock.current=false;setBusy(false)}
 }
 if(!enabled)return <p role="status" className="rounded-md border p-4">
  Die geschützte Quellenfreigabe ist für diese Production-Bereitstellung nicht aktiviert.
  Kein Knopf führt eine Schreiboperation aus. Stufe-1-Installation und separate PO-Freigabe abwarten.
 </p>
 return <div className="space-y-5">
  <section className="space-y-3 rounded-md border p-4">
   <h2 className="text-lg font-semibold">CH→AT Visum · genau eine geprüfte Quellenversion</h2>
   <p>Nur gewöhnlicher gültiger Schweizer Reisepass, direkte Einreise, Visumfreiheit. Keine andere Staatsangehörigkeit, Route oder andere Einreisebestimmung.</p>
   <p className="break-all text-sm">BMEIA SHA-256: {AT_SOURCE_V3_BMEIA_SHA} · {AT_SOURCE_V3_BMEIA_BYTES.toLocaleString('de-CH')} Bytes</p>
   <ul className="list-disc space-y-2 pl-6">
    {SOURCE_URLS.map(source=><li key={source.id}>
     <a href={source.url} rel="noopener noreferrer" target="_blank" className="underline">{source.name}</a>
     <p className="break-all text-xs">SHA-256 {source.sha} · {source.bytes.toLocaleString('de-CH')} Bytes</p>
    </li>)}
   </ul>
   <p>Historische ID-Austria-Navigation: <a href={AT_SOURCE_V3_OLD_LINK} className="underline" target="_blank" rel="noopener noreferrer">alte amtliche Seite</a> → <a href={AT_SOURCE_V3_NEW_LINK} className="underline" target="_blank" rel="noopener noreferrer">neue amtliche Seite</a>.</p>
   <p>Zur Production-V2-Vorgängerversion unterscheiden sich lediglich 19 kontrollierte CSS-/JS-Zeitstempel. Die frühere ID-Austria-URL-Änderung war dort bereits vorhanden; neue Link-/Text-/Datenänderungen bleiben gesperrt.</p>
   <p className="font-medium">Die Zustimmung qualifiziert nur diese Originale für die geschützte Quellenprüfung. Sie aktiviert weder neue Visumfakten noch die öffentliche Besucheranzeige.</p>
  </section>
  <div className="rounded-md border p-4" role="status" aria-live="polite" tabIndex={-1}>
   <p>{status}</p>{pending?<p className="break-all text-xs">Unveränderlicher Vorgang: {pending}</p>:null}
  </div>
  {pending?<button className={BUTTON} type="button" disabled={busy||blocked} onClick={()=>void submit('confirm')}>
   Gespeicherten Entscheid bestätigen
  </button>:<div className="space-y-3">
   <label className="flex items-start gap-3 rounded-md border p-3">
    <input type="checkbox" checked={checked} disabled={busy||blocked} onChange={e=>setChecked(e.target.checked)} className="mt-1 h-5 w-5"/>
    <span>Ich habe alle drei amtlichen Originale, den alten/neuen ID-Austria-Link und den engen CH→AT-Visumbereich geprüft und bestätige die Regelneutralität nur für diese Quelle.</span>
   </label>
   <button className={BUTTON} type="button" disabled={busy||blocked||!checked} onClick={()=>void submit('approve')}>
    Diese eine Quellenversion mit Owner-AAL2 freigeben
   </button>
  </div>}
  <p className="text-sm">Die Entscheidung erfolgt ausschliesslich durch dich nach persönlicher Anmeldung und 2FA. Bei unbekanntem Ausgang wird nie automatisch neu geschrieben. Stufe 2 (BG1-Vollbeleg, neue Faktversion, Besucherfreigabe) ist getrennt.</p>
 </div>
}
