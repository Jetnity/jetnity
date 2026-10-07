import assert from 'node:assert/strict'
import { execFileSync } from 'node:child_process'
import { writeFileSync, unlinkSync, mkdirSync } from 'node:fs'
import { pathToFileURL } from 'node:url'
import { resolve } from 'node:path'
import { createRequire } from 'node:module'
const require=createRequire(import.meta.url),{fixture}=require('./fixture.ts'),{manuellerEntwurf,vorschauKennungen}=require('../../lib/reiseaenderung/direct/entwurf.ts'),fixed=require('../../lib/trips/gastspeicher.ts')
const baseline='9ea0e068e1d28b18ed15059fa5bf9b63c0689cfe',scratch=['scripts/direct-trip-editing-1/.baseline-apply.ts','scripts/direct-trip-editing-1/.baseline-guest.ts'],results=[]
try{
 for(const [i,file] of ['lib/reiseaenderung/anwenden.ts','lib/trips/gastspeicher.ts'].entries())writeFileSync(scratch[i],execFileSync('git',['show',`${baseline}:${file}`]))
 const old=await import(pathToFileURL(resolve(scratch[0])).href),guest=await import(pathToFileURL(resolve(scratch[1])).href)
 const before=fixture(),proposal=manuellerEntwurf(before,{title:'Metadata only'},vorschauKennungen('817a7ff5-1359-48d8-952c-893932c2b741'));assert(proposal.ok)
 const prior=old.operationenAnwenden(before,proposal.operationen,()=>crypto.randomUUID());assert(prior.ok);assert.notEqual(prior.reise.days[0].items[0].startsOn,before.days[0].items[0].startsOn);assert.deepEqual(proposal.nachher.days,before.days)
 results.push({case:'Metadata-only explicit point date',baseline:{date:prior.reise.days[0].items[0].startsOn,end:prior.reise.days[0].items[0].endsOn},fixed:{date:proposal.nachher.days[0].items[0].startsOn,end:proposal.nachher.days[0].items[0].endsOn},status:'BASELINE_DEFECT_FIXED'})
 const storage=new Map();globalThis.window={localStorage:{getItem:k=>storage.get(k)??null,setItem:(k,v)=>storage.set(k,v),removeItem:k=>storage.delete(k)}}
 const other={...before,id:'different-trip'};fixed.gastreiseSpeichern(other)
 const args={tripId:before.id,basisRevision:before.revision,mutationId:'old-proposal',operationen:proposal.operationen}
 const overwritten=guest.gastreiseAendern(args);assert.equal(overwritten.id,other.id);assert.equal(overwritten.title,'Metadata only')
 fixed.gastreiseSpeichern(other);assert.throws(()=>fixed.gastreiseAendern(args));assert.equal(fixed.gastspeicherLaden().aktiv.title,before.title)
 results.push({case:'Guest same-revision other active trip',baseline:'Wrong trip overwritten',fixed:'Rejected; active trip preserved',status:'BASELINE_DEFECT_FIXED'})
 mkdirSync('docs/evidence/direct-trip-editing-1',{recursive:true});writeFileSync('docs/evidence/direct-trip-editing-1/baseline.json',JSON.stringify({baseline,results,boundary:'Actual baseline modules replayed against synthetic graph and explicit in-memory Storage test double. No browser/native claim.'},null,2)+'\n')
 console.log(`PASS: ${results.length} baseline/fixed counterexamples`)
}finally{for(const file of scratch)try{unlinkSync(file)}catch{}}
