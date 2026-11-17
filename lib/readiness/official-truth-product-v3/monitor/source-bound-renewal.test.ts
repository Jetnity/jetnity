import assert from 'node:assert/strict'
import { test } from 'node:test'
import { checkSourceBoundRenewal, type ReviewedFact, type SourceRenewalCheck } from './source-bound-renewal'

// Synthetic fixed records: a passing PURE precheck is never an accepted rule,
// a SourceIssuer receipt, a BG1 seal, an AAL2 approval or a database write.
const priority = 'IN TR CN DE PL IT US UA RO FR NL GB AT ES HU SY CZ AF CH RU HR BE IQ PT BG BR GR IR SK PK ER TH SO VN SE NG EG XK KR LK DK PH JP LB RS LT CA CM MA IL'.split(' ')
const one='a'.repeat(64), two='b'.repeat(64), three='c'.repeat(64), method='d'.repeat(64), pkg='e'.repeat(64), conditions='f'.repeat(64)
const now='2026-11-17T13:10:00.000Z'
const sent='2026-11-17T13:05:00.000Z'
const seen='2026-11-17T13:05:05.000Z'
const previous:ReviewedFact={
 subject:{destinationCountryCode:'AT',citizenshipCountryCode:'CH',requirementType:'visa',
  documentType:'national_passport',routeType:'direct_entry',conditionsDigest:conditions},
 methodId:'destination-primary-at-visa',methodRevision:1,methodDigest:method,
 packageDigest:pkg,methodEpoch:8,ownerApproval:'approved',
 legalValidUntil:'2026-11-30T00:00:00.000Z',lastVerifiedAt:'2026-11-17T12:00:00.000Z',
 release:'accepted',unresolvedConflict:false,
 sourceBindings:[
  {id:'bmi-matrix',role:'destination_primary',authorityCountryCode:'AT',officialUrl:'https://www.bmi.gv.at/example',rawDigest:one,canonicalDigest:null,normalizationContract:'none'},
  {id:'bmeia-bern',role:'independent_official',authorityCountryCode:'AT',officialUrl:'https://www.bmeia.gv.at/oeb-bern/reise-nach-oesterreich/einreise-und-aufenthalt/wie-stelle-ich-einen-antrag/',rawDigest:two,canonicalDigest:three,normalizationContract:'bmeia-theme-assets-v1'},
 ],
}
const input:SourceRenewalCheck={
 subject:previous.subject,approvedMethodId:previous.methodId,approvedMethodRevision:1,
 approvedMethodDigest:method,approvedPackageDigest:pkg,approvedMethodEpoch:8,
 methodStatus:'current',bg1Status:'current',checkedAt:now,passportPriority:priority,
 observations:[
  {id:'bmi-matrix',officialUrl:'https://www.bmi.gv.at/example',state:'unchanged_exact',
    rawDigest:one,canonicalDigest:null,normalizationContract:'none',batchId:'123',requestedAt:sent,observedAt:seen},
  {id:'bmeia-bern',officialUrl:'https://www.bmeia.gv.at/oeb-bern/reise-nach-oesterreich/einreise-und-aufenthalt/wie-stelle-ich-einen-antrag/',state:'unchanged_asset_version_only',
    rawDigest:'0'.repeat(64),canonicalDigest:three,normalizationContract:'bmeia-theme-assets-v1',
    batchId:'123',requestedAt:sent,observedAt:seen},
 ],
}
const run=(p:ReviewedFact=previous,r:SourceRenewalCheck=input)=>checkSourceBoundRenewal(p,r)
const unavailable=(p:ReviewedFact,r:SourceRenewalCheck)=>assert.equal(run(p,r).status,'unavailable')
test('Source-bound renewal: fresh real-time receipt after old 1h window is only eligible for protected issuer',()=>{
 const result=run()
 assert.equal(result.status,'eligible_for_protected_issuer_only')
 assert.equal(result.expiresAt,'2026-11-17T14:10:00.000Z')
 assert.ok(result.reason.includes('protected')===false)
})
test('any destination and passport in the exact 50-priority list may be checked, none is a default',()=>{
 const oldScope:ReviewedFact={...previous,subject:{...previous.subject,destinationCountryCode:'IT',citizenshipCountryCode:'IN'}}
 const oldCheck:SourceRenewalCheck={...input,subject:oldScope.subject}
 unavailable(oldScope,oldCheck) // Austrian primary is not Italy's authority!
 const dest:ReviewedFact={...oldScope,sourceBindings:previous.sourceBindings.map(pin =>
  pin.role === 'destination_primary' ? {...pin,authorityCountryCode:'IT',
   officialUrl:'https://italy.example/government-source'} : pin)}
 const check:SourceRenewalCheck={...input,subject:dest.subject,observations:input.observations.map(receipt =>
  receipt.id === 'bmi-matrix' ? {...receipt,officialUrl:'https://italy.example/government-source'} : receipt)}
 assert.equal(run(dest,check).status,'eligible_for_protected_issuer_only')
 unavailable(dest,{...check,subject:{...dest.subject,citizenshipCountryCode:'CH'}})
 unavailable(dest,{...check,passportPriority:priority.slice(1)})
 unavailable(dest,{...check,passportPriority:[priority[1]!,priority[0]!,...priority.slice(2)]})
 unavailable(dest,{...check,passportPriority:[...priority.slice(0,49),'IN']})
 unavailable(dest,{...check,subject:{...dest.subject,citizenshipCountryCode:'ZZ'}})
})
test('research-only, owner revocation, withdrawn method or BG1 block cannot be renewed',()=>{
 unavailable({...previous,release:'RESEARCH_ONLY'},input)
 unavailable({...previous,ownerApproval:'revoked'},input)
 unavailable({...previous,unresolvedConflict:true},input)
 unavailable(previous,{...input,methodStatus:'revoked'})
 unavailable(previous,{...input,bg1Status:'unavailable'})
 unavailable(previous,{...input,approvedMethodEpoch:9})
 unavailable(previous,{...input,approvedMethodDigest:'0'.repeat(64)})
 unavailable(previous,{...input,approvedPackageDigest:'0'.repeat(64)})
 unavailable(previous,{...input,approvedMethodRevision:2})
})
test('one new independent source batch must be exact, fresh, ordered after previously verified fact',()=>{
 unavailable(previous,{...input,observations:input.observations.slice(0,1)})
 unavailable(previous,{...input,observations:[input.observations[0]!,input.observations[0]!]})
 unavailable(previous,{...input,observations:[input.observations[0]!,{...input.observations[1]!,batchId:'124'}]})
 unavailable(previous,{...input,observations:[input.observations[0]!,{...input.observations[1]!,id:'unknown'}]})
 unavailable(previous,{...input,observations:input.observations.map(o=>({...o,observedAt:'2026-11-17T11:59:59.000Z'}))})
 unavailable(previous,{...input,observations:input.observations.map(o=>({...o,observedAt:'2026-11-17T11:30:00.000Z'}))})
 unavailable(previous,{...input,observations:input.observations.map(o=>({...o,observedAt:'2026-11-17T13:20:00.000Z'}))})
 unavailable(previous,{...input,observations:input.observations.map(o=>({...o,requestedAt:'2026-11-17T12:00:00.000Z'}))})
})
test('changed, missing, pending or wrongly normalized originals fail closed',()=>{
 for (const state of ['changed','pending','unavailable'] as const){
  unavailable(previous,{...input,observations:[{...input.observations[0]!,state},input.observations[1]!]})
 }
 unavailable(previous,{...input,observations:[{...input.observations[0]!,rawDigest:'0'.repeat(64)},input.observations[1]!]})
 unavailable(previous,{...input,observations:[input.observations[0]!,{...input.observations[1]!,canonicalDigest:'0'.repeat(64)}]})
 unavailable(previous,{...input,observations:[input.observations[0]!,{...input.observations[1]!,normalizationContract:'none'}]})
 unavailable({...previous,sourceBindings:previous.sourceBindings.map(p=>p.id==='bmeia-bern'?
  {...p,officialUrl:'https://www.bmeia.gv.at/other-page'}:p)},input)
 unavailable({...previous,sourceBindings:previous.sourceBindings.map(p=>({...p,role:'independent_official'}))},input)
})
test('one hour never silently becomes a legal-validity extension or an unbounded cache',()=>{
 unavailable({...previous,legalValidUntil:'2026-11-17T13:00:00.000Z'},input)
 unavailable({...previous,legalValidUntil:'not-a-date'},input)
 unavailable(previous,{...input,checkedAt:'2026-11-17T00:00:00.000Z'})
 const limited=run({...previous,legalValidUntil:'2026-11-17T13:20:00.000Z'})
 assert.equal(limited.status,'eligible_for_protected_issuer_only')
 assert.equal(limited.expiresAt,'2026-11-17T13:20:00.000Z')
})
