// One-shot official HTTPS originals -> fifty private RESEARCH_ONLY slots.
// This script cannot import, qualify, approve, publish or write to Supabase.
import { readFileSync, lstatSync, realpathSync, writeFileSync } from 'node:fs'
import { resolve, dirname, relative, isAbsolute, sep } from 'node:path'
import { fileURLToPath } from 'node:url'
import { AT_OFFICIAL_PUBLICATIONS } from '../lib/readiness/official-truth-at-source-reader/publications'
import { readAtOfficialPublicationHttps, type AtOfficialTransport } from '../lib/readiness/official-truth-at-source-reader/transport'
import { bindAtOfficialRetrieval, type AtBoundSource } from '../lib/readiness/official-truth-at-source-reader/bind'
import { readAtPassportPriority } from '../lib/readiness/official-truth-at-source-reader/priority'
import { readAtOfficialOriginals, atResearchOnlyPassportInventory } from '../lib/readiness/official-truth-at-source-reader/at-bmi-research'

function refused():never{throw Error('AT_RESEARCH_ONLY_REFUSED')}
export async function prepareAtOnlineResearch50(csvText:string,transport:AtOfficialTransport,signal:AbortSignal) {
 const priority=readAtPassportPriority(csvText)
 if(!priority.ok)refused()
 const contents=new Map<string,Uint8Array>(),bound:AtBoundSource[]=[]
 for(const publication of AT_OFFICIAL_PUBLICATIONS){
  if(signal.aborted)refused()
  const response=await transport(publication,signal)
  if(!response.ok || response.retrieval.publicationId!==publication.id)refused()
  const vetted=bindAtOfficialRetrieval(response.retrieval)
  if(vetted.status!=='bound' || vetted.versionObservation.status==='ambiguous' ||
    vetted.versionObservation.approvedVersion!==null || vetted.legalClassification!=='not_performed')refused()
  contents.set(publication.id,response.retrieval.body)
  bound.push(vetted)
 }
 const original=readAtOfficialOriginals({
  visa:contents.get('bmi-visa-nationality-matrix'),
  shortStay:contents.get('bmi-general-entry'),
  bern:contents.get('bmeia-bern-how-to-apply'),
 })
 const inventory=atResearchOnlyPassportInventory(original,priority.codes)
 if(inventory.status!=='RESEARCH_ONLY' || inventory.importable!==false ||
  inventory.rows.length!==50 || inventory.rows.some(r=>r.status!=='derzeit nicht verfügbar'))refused()
 return Object.freeze({
  schema:1,kind:'at_50_official_originals_review_only',classification:'RESEARCH_ONLY',
  sourceReadingAtUtc:new Date().toISOString(),sourceAuthority:'unqualified',method:'NOT_APPROVED',
  acceptedFactCount:0,importedFactCount:0,productionAuthority:'none',
  customerStatement:'derzeit nicht verfügbar',
  sources:Object.freeze(bound.map(x=>Object.freeze({id:x.publicationId,url:x.finalUrl,
    sha256:x.sha256,bytes:x.byteLength,observedVersion:x.versionObservation}))),
  citizenships:50,rows:inventory.rows
 })
}
const currentFile=typeof __filename==='string'?resolve(__filename):fileURLToPath(import.meta.url)
const root=resolve(dirname(currentFile),'..')
function within(rootPath:string,p:string){const r=relative(rootPath,p);return r==='' || (r!=='..'&&!r.startsWith('..'+sep)&&!isAbsolute(r))}
async function runCli(): Promise<void> {
 try{
  const args=process.argv.slice(2)
  if(args.length!==4||args[0]!=='--priority'||args[2]!=='--output')refused()
  const priorityFile=resolve(args[1]!),output=resolve(args[3]!)
  const stat=lstatSync(priorityFile)
  if(!stat.isFile()||stat.isSymbolicLink()||stat.size>262144||stat.size<1)refused()
  if(within(root,output)||!lstatSync(root).isDirectory())refused()
  const controller=new AbortController()
  const result=await prepareAtOnlineResearch50(new TextDecoder('utf-8',{fatal:true})
    .decode(readFileSync(priorityFile)),readAtOfficialPublicationHttps,controller.signal)
  const realFolder=realpathSync(dirname(output))
  const target=resolve(realFolder,output.split(sep).at(-1)!)
  if(within(root,target))refused()
  writeFileSync(target,JSON.stringify(result)+'\n',{flag:'wx',mode:0o600})
  process.stdout.write('AT_50_RESEARCH_ONLY sources=3 passports=50 accepted=0 imported=0\n')
 }catch{
  process.stderr.write('AT_50_RESEARCH_ONLY_REFUSED accepted=0 imported=0\n')
  process.exitCode=1
 }
}

if(process.argv[1] && resolve(process.argv[1])===currentFile){
 void runCli()
}
