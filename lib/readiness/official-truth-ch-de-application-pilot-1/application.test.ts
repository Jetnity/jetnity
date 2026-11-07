import assert from 'node:assert/strict'
import { test } from 'node:test'
import { fixtureTrip, fixtureBody, fixtureRetrieve, fixtureContract, fixtureRegistry, fixtureExtract, consumeOfficialTruthTrustedFactExecutionContext, loadFixtureModule, protocol2Fixture } from '../../../scripts/official-truth-ch-de-application-pilot-1/fixtures'
import type * as Evaluation from './evaluate-server'
import { pilotScope } from './scope-server'
import { pilotContextCurrent, pilotGraphFingerprint } from './context'
import { requirementsLokalFuerReise } from '../engine'
import { chDeAaS1VisaRowResearchFromHtml } from '../official-truth-ch-de-aa-s1-visa-row-research-server'
import { AA_VISA_TABLE_IDENTITY_CANDIDATE } from '../official-truth-aa-visa-table-identity-candidate'
import { OFFICIAL_TRUTH_CONTENT_IDENTITY_PROFILE_REGISTRY } from '../official-truth-content-identity'
import { officialTruthChDeSourceBudget128k1, officialTruthChDeSourceFingerprintV2Allowed } from '../official-truth-ch-de-source-budget-128k-1'
import { officialTruthSourceFingerprintV2 } from '../official-truth-source-fingerprint-v2'
import { decideOfficialTruthServerOwnedRetrieval } from '../official-truth-server-owned-retrieval'
import { quellenKatalogSnapshotAntwort } from '../official-truth-source-catalog-server'
import type * as ReviewPacket from '../official-truth-rule-review-packet'

function runtime(fault='none') {
  const trip=fixtureTrip();let retrievals=0,rechecks=0
  const grant={id:'77777777-7777-4777-8777-777777777777',contractId:fixtureContract.id,contractDigest:fixtureContract.digest,expiresAt:new Date(Date.now()+120000).toISOString()}
  const evaluator=loadFixtureModule<typeof Evaluation>('lib/readiness/official-truth-ch-de-application-pilot-1/evaluate-server.ts',{
    './target-server': { applicationPilotTargetAllowed: () => true },
    './contract-server':{applicationPilotEnabled:()=>fault!=='disabled',applicationContract:()=>fault==='missing-contract'?null:fixtureContract},
    './database-server':{pilotGrant:async(_trip:unknown,_grant:unknown,signal:AbortSignal)=>{assert(signal instanceof AbortSignal);assert(!signal.aborted);rechecks++;return fault==='not-admitted'||fault==='withdrawn'&&rechecks>1?null:grant}},
    '@/lib/readiness/official-truth-fact-entry-authority-server':{loadOfficialTruthFactEntryAuthority:async()=>fault==='authority'?{status:'access_forbidden'}:{status:'authorized',grant:'role',capability:'official-truth-freigeben'}},
    '@/lib/readiness/official-truth-source-catalog-server':{quellenKatalogLesen:async()=>({ok:true,registry:fixtureRegistry})},
    '@/lib/readiness/official-truth-server-owned-retrieval':{loadOfficialTruthServerOwnedRetrieval:async()=>{
      retrievals++;const result=await fixtureRetrieve(fault)
      if(result.status==='server_owned_official_retrieval'&&fault==='v1-explicit-undefined')return {...result,sourceFingerprintProtocol:undefined}
      if(result.status==='server_owned_official_retrieval'&&fault==='v1-explicit-one')return {...result,sourceFingerprintProtocol:1}
      if(result.status==='server_owned_official_retrieval'&&fault==='v1-as-v2')return {...result,sourceFingerprintProtocol:2}
      return result
    }},
    '@/lib/readiness/official-truth-trusted-fact-extractor-registry':{officialTruthTrustedFactExtrahieren:fixtureExtract,consumeOfficialTruthTrustedFactExecutionContext},
    '@/lib/trips/daten':{reiseLaden:async()=>({problem:null,zeilen:fault==='wrong-account'?[]:[fault==='revision-changed'?{...trip,revision:2}:trip]})},
  })
  return {trip,evaluator,retrievals:()=>retrievals}
}
test('the already wired application fixture requires exact AA-like semantics, without real source authority',async()=>{
  const parsed=chDeAaS1VisaRowResearchFromHtml(fixtureBody)
  assert.equal(parsed.status,'research_visa_table_observation')
  if(parsed.status!=='research_visa_table_observation')return
  assert.equal(parsed.sourceCustody,'not_verified')
  assert.equal(parsed.legalApplicability,'not_verified')
  assert.equal(parsed.acceptedRules,0)
  assert.equal(parsed.databaseWrites,0)
  const retrieval=await fixtureRetrieve('footnoted')
  assert.equal(retrieval.status,'server_owned_official_retrieval')
  if(retrieval.status!=='server_owned_official_retrieval')return
  assert.deepEqual(chDeAaS1VisaRowResearchFromHtml(retrieval.sourceSnapshot),{
    status:'blocked',reason:'qualified_or_conflicting_swiss_row',
  })
  const run=runtime('footnoted')
  const result=await run.evaluator.evaluateApplicationPilot(run.trip,new AbortController().signal)
  assert.notEqual(result.status,'verified')
  assert.equal(result.evaluations.filter(e=>e.result!=='unknown').length,0)
  assert.equal(run.retrievals(),1)
})

test('current-only complete synthetic source -> canonical Evidence/review/Rule -> Requirements visa; other cells unknown',async()=>{
  const r=runtime();assert(pilotScope(r.trip).ok);const result=await r.evaluator.evaluateApplicationPilot(r.trip,new AbortController().signal)
  assert.equal(result.status,'verified');assert.equal(r.retrievals(),1)
  const visa=result.evaluations.find(e=>e.requirementType==='visa')!
  assert.equal(visa.result,'not_required');assert.match(visa.evidence.authority!,/SYNTHETISCHE/)
  assert(visa.evidence.checkedAt);assert.equal(visa.evidence.validUntil,null)
  assert(result.evaluations.filter(e=>e.requirementType!=='visa').every(e=>e.result==='unknown'))
  assert(!JSON.stringify(result).includes('Staaten und Gebietskörperschaften'));assert(result.expiresAt)
})
for(const fault of ['disabled','not-admitted','missing-contract','authority','altered','footnoted','duplicate-swiss','no-visa-table','hidden-swiss','ambiguous-header','partial','oversize','timeout','withdrawn','wrong-account','revision-changed','v1-explicit-undefined','v1-explicit-one','v1-as-v2'])test(`fail closed: ${fault}`,async()=>{
  const r=runtime(fault),result=await r.evaluator.evaluateApplicationPilot(r.trip,new AbortController().signal)
  assert.notEqual(result.status,'verified');assert(result.evaluations.every(e=>e.result==='unknown'))
  if(['disabled','not-admitted','missing-contract','authority'].includes(fault))assert.equal(r.retrievals(),0)
})
test('declared complete direct route and ordinary passport cannot be inferred; changes invalidate',async()=>{
  for(const mutate of [(t:ReturnType<typeof fixtureTrip>)=>{t.regulatoryContext!.declaration.route=null},(t:ReturnType<typeof fixtureTrip>)=>{t.regulatoryContext!.declaration.passportClass=null},(t:ReturnType<typeof fixtureTrip>)=>{t.party![0]!.documents[0]!.expiresOn='2029-01-01'},(t:ReturnType<typeof fixtureTrip>)=>{t.revision++}]){
    const r=runtime();mutate(r.trip);assert(!pilotScope(r.trip).ok)
    const result=await r.evaluator.evaluateApplicationPilot(r.trip,new AbortController().signal)
    assert.notEqual(result.status,'verified');assert.equal(r.retrievals(),0)
  }
})
test('canonical fingerprints include declarations and expire even when graph revision is unchanged',()=>{
  const trip=fixtureTrip();assert(pilotContextCurrent(trip))
  const before=requirementsLokalFuerReise(trip)
  trip.regulatoryContext!.declaration.purpose='other'
  assert.notEqual(before[0]!.evidence.contextFingerprint,requirementsLokalFuerReise(trip)[0]!.evidence.contextFingerprint)
  trip.party![0]!.documents=[]
  assert(!pilotContextCurrent(trip));assert.notEqual(pilotGraphFingerprint(trip),trip.regulatoryContext!.graphFingerprint)
})
test('only the explicitly selected option is projected; duplicated and missing references never invoke retrieval',async()=>{
 const r=runtime(),other=structuredClone(r.trip.party![0]!)
 other.id='aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaaa';other.clientRef='other-traveller';r.trip.party!.push(other);r.trip.travellers=2
 r.trip.regulatoryContext!.graphFingerprint=pilotGraphFingerprint(r.trip)
 const result=await r.evaluator.evaluateApplicationPilot(r.trip,new AbortController().signal)
 assert.equal(result.status,'verified');assert.equal(result.evaluations.filter(e=>e.result!=='unknown').length,1)
 assert(result.evaluations.filter(e=>e.travellerClientRef==='other-traveller').every(e=>e.result==='unknown'))
 for(const duplicate of [true,false]){
  const invalid=runtime()
  if(duplicate)invalid.trip.party![0]!.documents.push(structuredClone(invalid.trip.party![0]!.documents[0]!))
  else invalid.trip.regulatoryContext!.declaration.credentialOptionRef=null
  invalid.trip.regulatoryContext!.graphFingerprint=pilotGraphFingerprint(invalid.trip)
  const denied=await invalid.evaluator.evaluateApplicationPilot(invalid.trip,new AbortController().signal)
  assert.notEqual(denied.status,'verified');assert.equal(invalid.retrievals(),0)
 }
})

// Explicit isolated test admission, never a mutation of the dormant candidate
// or the compiled production registry. All body bytes below are synthetic.
const aaTestProfile=Object.freeze({...AA_VISA_TABLE_IDENTITY_CANDIDATE,current:true})

function protocol2Runtime(fault='none') {
  const fixture=protocol2Fixture(aaTestProfile,fault==='unadmitted'?[]
    :fault==='noncurrent'?[Object.freeze({...aaTestProfile,current:false})]:[aaTestProfile])
  const trip=fixtureTrip(),controller=new AbortController()
  let retrievals=0,rechecks=0,authorityChecks=0,catalogReads=0,packetCalls=0
  let evidenceProtocol:unknown,extractionProtocol:unknown,extractedStatus:unknown
  let packetHash:unknown,extractionHash:unknown
  const grant={id:'77777777-7777-4777-8777-777777777777',contractId:fixture.contract.id,
    contractDigest:fixture.contract.digest,expiresAt:new Date(Date.now()+120000).toISOString()}
  const packetModule=fixture.modules['@/lib/readiness/official-truth-rule-review-packet'] as typeof ReviewPacket
  const evaluator=loadFixtureModule<typeof Evaluation>('lib/readiness/official-truth-ch-de-application-pilot-1/evaluate-server.ts',{
    './target-server': { applicationPilotTargetAllowed: () => true },
    ...fixture.modules,
    './contract-server':{applicationPilotEnabled:()=>fault!=='disabled',applicationContract:()=>fault==='bern'
      ?{...fixture.contract,source:{...fixture.contract.source,url:'https://bern.diplo.de/ch-de/service/visumundeinreise/2611474-2611474'}}
      :fixture.contract},
    './database-server':{pilotGrant:async()=>{rechecks++;return fault==='withdrawn'&&rechecks>1?null:grant}},
    '@/lib/readiness/official-truth-fact-entry-authority-server':{loadOfficialTruthFactEntryAuthority:async()=>{
      authorityChecks++
      return fault==='authority'||fault==='authority-withdrawn'&&authorityChecks>1
        ?{status:'access_forbidden'}:{status:'authorized',grant:'role',capability:'official-truth-freigeben'}
    }},
    '@/lib/readiness/official-truth-source-catalog-server':{quellenKatalogLesen:async()=>{
      catalogReads++
      return {ok:true,registry:fault==='catalog-drift'&&catalogReads>1
        ?{...fixture.registry,sources:fixture.registry.sources.map(s=>({...s,authorityName:'CHANGED SYNTHETIC CATALOG'}))}:fixture.registry}
    }},
    '@/lib/readiness/official-truth-server-owned-retrieval':{loadOfficialTruthServerOwnedRetrieval:async()=>{
      retrievals++
      const body=fault==='footnoted'?fixture.body.replace('<td>Nein</td></tr><tr><td>Thailand','<td>Nein (1)</td></tr><tr><td>Thailand')
        :fault==='changed-table'?fixture.body.replace('<td>Schweiz</td><td>Nein</td>','<td>Schweiz</td><td>Ja</td>')
        :fault==='at-limit'?fixture.body.replace('</main>',`${'x'.repeat(131_072-Buffer.byteLength(fixture.body,'utf8'))}</main>`)
        :fixture.body
      const retrieval:Record<string,unknown>={...fixture.retrieval(body)}
      if(fault==='protocol-missing')delete retrieval.sourceFingerprintProtocol
      if(fault==='protocol-undefined')retrieval.sourceFingerprintProtocol=undefined
      if(fault==='protocol-downgrade')retrieval.sourceFingerprintProtocol=1
      if(fault==='protocol-unknown')retrieval.sourceFingerprintProtocol=3
      if(fault==='protocol-string')retrieval.sourceFingerprintProtocol='2'
      if(fault==='wrong-hash')retrieval.sourceContentHash='a'.repeat(64)
      if(fault==='wrong-binding-hash')retrieval.sourceContentHash=officialTruthSourceFingerprintV2(body,
        {...fixture.binding,contentItemVersion:2,canonicalUrl:fixture.url,contentType:'text/html'})
      if(fault==='wrong-identity')retrieval.contentItemVersion=2
      if(fault==='wrong-request-url')retrieval.requestUrl=fixture.url+'?other=1'
      if(fault==='wrong-final-url')retrieval.canonicalUrl=fixture.url+'/other'
      if(fault==='wrong-mime')retrieval.contentType='application/json'
      if(fault==='redirect')retrieval.redirectCount=1
      if(fault==='oversize')retrieval.sourceSnapshot=body+'x'.repeat(131_073-Buffer.byteLength(body,'utf8'))
      if(fault==='utf8-oversize'){
        const oversized=body.replace('x'.repeat(60_000),'ä'.repeat(60_000))
        assert(oversized.length<131_072&&Buffer.byteLength(oversized,'utf8')>131_072)
        retrieval.sourceSnapshot=oversized
      }
      if(fault==='cancelled')controller.abort()
      return retrieval
    }},
    '@/lib/readiness/official-truth-rule-review-packet':{...packetModule,
      officialTruthRegelReviewBelege:(input:Parameters<typeof packetModule.officialTruthRegelReviewBelege>[0])=>{
        packetCalls++
        const packet=packetModule.officialTruthRegelReviewBelege(input)
        if(packet.status==='rule_review_packet'){
          evidenceProtocol=packet.evidenceVersions[0]?.sourceFingerprintProtocol
          packetHash=packet.evidenceVersions[0]?.sourceContentHash
        }
        return packet
      }},
    '@/lib/readiness/official-truth-trusted-fact-extractor-registry':{
      officialTruthTrustedFactExtrahieren:(input:Parameters<typeof fixture.extract>[0])=>{
        const support=(input as {supports:{retrieval:{sourceFingerprintProtocol?:unknown;sourceContentHash:unknown}}[]}).supports[0]!.retrieval
        extractionProtocol=support.sourceFingerprintProtocol;extractionHash=support.sourceContentHash
        const result=fixture.extract(input);extractedStatus=result.status;return result
      },consumeOfficialTruthTrustedFactExecutionContext:fixture.consume},
    '@/lib/trips/daten':{reiseLaden:async()=>({problem:null,zeilen:[fault==='trip-changed'?{...trip,revision:2}:trip]})},
  })
  return {fixture,trip,controller,evaluator,trace:()=>({retrievals,rechecks,authorityChecks,catalogReads,
    packetCalls,evidenceProtocol,extractionProtocol,packetHash,extractionHash,extractedStatus})}
}

test('AA Protocol 2: complete 93,365-byte synthetic material reaches real Evidence, extraction, Rule and Requirements',async()=>{
  const run=protocol2Runtime()
  assert.equal(Buffer.byteLength(run.fixture.body,'utf8'),93_365)
  const result=await run.evaluator.evaluateApplicationPilot(run.trip,run.controller.signal)
  assert.equal(result.status,'verified')
  const trace=run.trace()
  assert.equal(trace.retrievals,1);assert.equal(trace.rechecks,2);assert.equal(trace.authorityChecks,2)
  assert.equal(trace.catalogReads,2);assert.equal(trace.packetCalls,1)
  assert.equal(trace.evidenceProtocol,2);assert.equal(trace.extractionProtocol,2)
  assert.equal(trace.extractedStatus,'trusted_fact_extracted')
  assert.equal(trace.packetHash,trace.extractionHash)
  assert.equal(trace.packetHash,officialTruthSourceFingerprintV2(run.fixture.body,
    {...run.fixture.binding,canonicalUrl:run.fixture.url,contentType:'text/html'}))
  assert.equal(result.evaluations.filter(e=>e.result!=='unknown').length,1)
  assert.equal(result.evaluations.find(e=>e.requirementType==='visa')!.result,'not_required')
  assert(result.evaluations.filter(e=>e.requirementType!=='visa').every(e=>e.result==='unknown'))
  assert.match(result.evaluations.find(e=>e.requirementType==='visa')!.evidence.authority!,/SYNTHETISCHE/)
  assert(!JSON.stringify(result).includes('SYNTHETIC PROTOCOL 2 TEST ONLY'))
})
test('AA Protocol 2: the exact 128-KiB UTF-8 boundary still uses the canonical acceptance path',async()=>{
  const run=protocol2Runtime('at-limit')
  assert.equal((await run.evaluator.evaluateApplicationPilot(run.trip,run.controller.signal)).status,'verified')
  assert.equal(run.trace().evidenceProtocol,2);assert.equal(run.trace().extractionProtocol,2)
})
for(const fault of ['disabled','authority','bern','unadmitted','noncurrent','protocol-missing','protocol-undefined',
  'protocol-downgrade','protocol-unknown','protocol-string','wrong-hash','wrong-binding-hash','wrong-identity',
  'wrong-request-url','wrong-final-url','wrong-mime','redirect','oversize','utf8-oversize','footnoted','changed-table',
  'withdrawn','authority-withdrawn','catalog-drift','trip-changed','cancelled'])test(`AA Protocol 2 rejects ${fault}`,async()=>{
  const run=protocol2Runtime(fault)
  const result=await run.evaluator.evaluateApplicationPilot(run.trip,run.controller.signal)
  assert.notEqual(result.status,'verified');assert(result.evaluations.every(e=>e.result==='unknown'))
  if(['disabled','authority','bern'].includes(fault))assert.equal(run.trace().retrievals,0)
  if(['withdrawn','authority-withdrawn','catalog-drift','trip-changed'].includes(fault)){
    assert.equal(run.trace().extractedStatus,'trusted_fact_extracted')
    assert.equal(run.trace().rechecks,2)
  }
})

test('AA exact budget needs every tuple, URL, media and compiled current-profile identity',()=>{
  const f=protocol2Fixture(aaTestProfile)
  const budget=(identity=f.binding,item=f.item,representation=f.representation,requestUrl=f.url,finalUrl=f.url,media='text/html',profile=aaTestProfile)=>
    f.budget.officialTruthChDeSourceBudget128k1(identity,item,representation,requestUrl,finalUrl,media,profile)
  assert.equal(budget(),131_072)
  assert.equal(f.budget.officialTruthChDeSourceFingerprintV2Allowed(f.registry,f.binding,f.url,'text/html'),true)
  assert.equal(budget(f.binding,f.item,f.representation,f.url,f.url,'text/html',{...aaTestProfile}),null)
  assert.equal(budget(f.binding,{...f.item,current:false}),null)
  assert.equal(budget(f.binding,f.item,{...f.representation,current:false}),null)
  for(const field of ['sourceId','contentItemId','representationId','identityProfileId'] as const){
    assert.equal(budget({...f.binding,[field]:'different'}),null,field)
  }
  for(const field of ['contentItemVersion','representationVersion','identityProfileVersion'] as const){
    assert.equal(budget({...f.binding,[field]:2}),null,field)
  }
  for(const url of [f.url+'?x=1',f.url+'/',f.url.replace('www.auswaertiges-amt.de','evil.auswaertiges-amt.de')]){
    assert.equal(budget(f.binding,f.item,f.representation,url),null)
    assert.equal(budget(f.binding,f.item,f.representation,f.url,url),null)
    assert.equal(f.budget.officialTruthChDeSourceFingerprintV2Allowed(f.registry,f.binding,url,'text/html'),false)
  }
  assert.equal(budget(f.binding,f.item,{...f.representation,requestUrls:[f.url,f.url+'/other']}),null)
  assert.equal(budget(f.binding,f.item,f.representation,f.url,f.url,'text/html; charset=utf-8'),null)
  assert.equal(f.budget.officialTruthChDeSourceFingerprintV2Allowed(f.registry,f.binding,f.url,'application/json'),false)
})

test('AA stays unadmitted in production; injected catalogs retain the real generic 64-KiB transport limit',async()=>{
  const f=protocol2Fixture(aaTestProfile)
  assert.equal(AA_VISA_TABLE_IDENTITY_CANDIDATE.current,false)
  assert(!OFFICIAL_TRUTH_CONTENT_IDENTITY_PROFILE_REGISTRY.some(p=>p.identityProfileId===aaTestProfile.identityProfileId))
  assert.equal(officialTruthChDeSourceBudget128k1(f.binding,f.item,f.representation,f.url,f.url,'text/html',aaTestProfile),null)
  assert.equal(officialTruthChDeSourceFingerprintV2Allowed(f.registry,f.binding,f.url,'text/html'),false)
  let calls=0
  const retrieval=await decideOfficialTruthServerOwnedRetrieval({sourceId:f.item.sourceId,url:f.url},{
    now:()=>new Date(),resolve:async()=>[{address:'8.8.8.8',family:4}],
    catalog:{identityProfiles:[aaTestProfile],transport:{aufrufen:async()=>({ok:true,antwort:quellenKatalogSnapshotAntwort(f.registry)})}},
    http:async()=>{calls++;return {ok:true,status:200,
      headers:new Headers({'content-type':'text/html','content-length':String(Buffer.byteLength(f.body,'utf8'))}),
      body:(async function*(){yield Buffer.from(f.body)})()}}
  })
  assert.equal(calls,1)
  assert.deepEqual(retrieval,{status:'blocked',reason:'response_too_large'})
})

