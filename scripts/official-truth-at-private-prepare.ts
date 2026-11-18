// Offline AT research-only preparation. NEVER imports into DB / approves a rule.
// Original sources and the actual user passport-priority.csv must be supplied
// as regular local input files outside the repository. stdout: counts only.
import { readFileSync, lstatSync, realpathSync, writeFileSync } from 'node:fs'
import { resolve, dirname, relative, isAbsolute, sep } from 'node:path'
import { fileURLToPath } from 'node:url'
import { readAtPassportPriority } from '../lib/readiness/official-truth-at-source-reader/priority.ts'
import { readAtOfficialOriginals, atResearchOnlyPassportInventory } from '../lib/readiness/official-truth-at-source-reader/at-bmi-research.ts'

const currentFile=typeof __filename==='string'?resolve(__filename):fileURLToPath(import.meta.url)
const REPOSITORY=resolve(dirname(currentFile),'..')
const within=(root:string,target:string)=>{const r=relative(root,target);return r==='' || (r!=='..'&&!r.startsWith('..'+sep)&&!isAbsolute(r))}
function input(path:string,limit:number):Buffer{
 const file=resolve(path)
 const stat=lstatSync(file)
 if(!stat.isFile()||stat.isSymbolicLink()||stat.size<1||stat.size>limit)throw Error('untrusted_input')
 return readFileSync(file)
}
export function prepareAtResearch50(inputFiles:{priority:string,visa:string,entry:string,bern:string,output:string}){
 const order=readAtPassportPriority(new TextDecoder('utf-8',{fatal:true}).decode(input(inputFiles.priority,262144)))
 if(!order.ok)throw Error('invalid_priority')
 const source=readAtOfficialOriginals({
   visa:input(inputFiles.visa,600000),shortStay:input(inputFiles.entry,200000),
   bern:input(inputFiles.bern,250000)
 })
 const report=atResearchOnlyPassportInventory(source,order.codes)
 if(report.status!=='RESEARCH_ONLY')throw Error('source_binding_refused')
 const folder=realpathSync(dirname(resolve(inputFiles.output)))
 const out=resolve(folder,resolve(inputFiles.output).split(sep).at(-1)!)
 if(within(REPOSITORY,out))throw Error('output_inside_repo')
 const saved=JSON.stringify({
  kind:'at_official_source_review_50',schema:1,classification:'RESEARCH_ONLY',
  generatedAtUTC:new Date().toISOString(),
  sourcePageHashes:{visa:source.visa.ok?source.visa.sha256:null,
    entry:source.shortStay.ok?source.shortStay.sha256:null,
    bern:source.bern.ok?source.bern.sha256:null},
  canonicalSourceMethod:'NOT_APPROVED',publicationAuthority:'none',
  disposition:'do_not_import',acceptedFacts:0,customerFallback:'derzeit nicht verfügbar',
  destinationCountryCode:'AT',passportCount:50,rows:report.rows,
 })+'\n'
 // Exclusive creation; no object-store, DB connection or accidental update.
 writeFileSync(out,saved,{flag:'wx',mode:0o600})
 return {destinations:1,passports:50,candidateRows:50,accepted:0,imported:0}
}
if(process.argv[1]&&resolve(process.argv[1])===currentFile){
 try{
  const args=process.argv.slice(2),fields:{[key:string]:string}={}
  const allowed={'--priority':'priority','--visa':'visa','--entry':'entry','--bern':'bern','--output':'output'} as const
  while(args.length){const flag=args.shift()!,value=args.shift()
    if(!(flag in allowed)||!value||value.startsWith('--'))throw Error('arguments')
    const key=allowed[flag as keyof typeof allowed]
    if(fields[key])throw Error('duplicate');fields[key]=value
  }
  for(const key of Object.values(allowed))if(!fields[key])throw Error('missing')
  const count=prepareAtResearch50(fields as {priority:string,visa:string,entry:string,bern:string,output:string})
  process.stdout.write(JSON.stringify(count)+'\n')
 }catch{process.stderr.write('AT_RESEARCH_PREPARATION_REFUSED accepted=0 imported=0\n');process.exitCode=1}
}
