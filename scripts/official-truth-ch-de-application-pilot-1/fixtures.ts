// LOCAL TEST ONLY. No application root imports this file. All bytes/identities
// are synthetic; no government request, accepted-store write or real authority.
import assert from 'node:assert/strict'
import { readFileSync } from 'node:fs'
import { createRequire } from 'node:module'
import { resolve } from 'node:path'
import ts from 'typescript'
import { beispielreise } from '@/lib/reiseaenderung/fixtures/reise'
import type { Trip, TripTraveller } from '@/types/trips'
import { createContentIdentityGraph, contentIdentityBinding, type ContentIdentityProfileDefinition } from '@/lib/readiness/official-truth-content-identity'
import * as contentIdentityModule from '@/lib/readiness/official-truth-content-identity'
import { quellenRegistryErstellen } from '@/lib/readiness/source-registry'
import { quellenKatalogSnapshotAntwort } from '@/lib/readiness/official-truth-source-catalog-server'
import { decideOfficialTruthServerOwnedRetrieval } from '@/lib/readiness/official-truth-server-owned-retrieval'
import { officialTruthTrustedFactExtrahierenMitDefinitionen, consumeOfficialTruthTrustedFactExecutionContext, type OfficialTruthExtractorDefinition } from '@/lib/readiness/official-truth-trusted-fact-extractor-registry'
import type { ApplicationContract } from '@/lib/readiness/official-truth-ch-de-application-pilot-1/contract-server'
import { pilotGraphFingerprint, type PilotDeclaration } from '@/lib/readiness/official-truth-ch-de-application-pilot-1/context'
import { chDeAaS1VisaRowResearchFromHtml } from '@/lib/readiness/official-truth-ch-de-aa-s1-visa-row-research-server'
import { officialTruthSourceFingerprintV2 } from '@/lib/readiness/official-truth-source-fingerprint-v2'
import type * as SourceBudget from '@/lib/readiness/official-truth-ch-de-source-budget-128k-1'
import type * as Extractors from '@/lib/readiness/official-truth-trusted-fact-extractor-registry'

export const fixtureTripId='11111111-1111-4111-8111-111111111111'
export const fixtureUserId='22222222-2222-4222-8222-222222222222'
export const fixtureUrl='https://application-pilot.example/synthetic-visa'
export const fixtureBody=[
  '<!doctype html><html lang="de"><head><title>SYNTHETIC LOCAL APPLICATION TEST ONLY</title></head><body>',
  '<main><h1>Übersicht zur Visumpflicht bzw. -freiheit bei Einreise in die Bundesrepublik Deutschland</h1>',
  '<table><thead><tr><th>Staaten und Gebietskörperschaften</th>',
  '<th>Visumpflicht für Deutschland: Ja/Nein</th></tr></thead><tbody>',
  '<tr><td>Österreich</td><td>Nein</td></tr><tr><td>Schweiz</td><td>Nein</td></tr>',
  '<tr><td>Thailand</td><td>Ja</td></tr></tbody></table></main></body></html>',
].join('')
export const fixtureDeclaration: PilotDeclaration={travellerClientRef:'synthetic-traveller',documentClientRef:'synthetic-passport',citizenshipClientRef:'synthetic-citizenship',credentialOptionRef:'synthetic-traveller:synthetic-passport',passportClass:'ordinary',purpose:'tourism',originCountryCode:'CH',route:'complete_direct_ch_de'}
export function fixtureTrip(saved=true): Trip {
  const stamp='2026-10-13T00:00:00.000Z'
  const person:TripTraveller={id:'33333333-3333-4333-8333-333333333333',clientRef:'synthetic-traveller',label:'Synthetische Person',residenceCountryCode:null,createdAt:stamp,updatedAt:stamp,
    citizenships:[{id:'44444444-4444-4444-8444-444444444444',clientRef:'synthetic-citizenship',countryCode:'CH',createdAt:stamp,updatedAt:stamp}],
    documents:[{id:'55555555-5555-4555-8555-555555555555',clientRef:'synthetic-passport',documentType:'passport',issuingCountryCode:'CH',citizenshipClientRef:'synthetic-citizenship',expiresOn:'2030-01-01',createdAt:stamp,updatedAt:stamp}]}
  const trip=beispielreise({id:fixtureTripId,title:'SYNTHETISCHER LOKALTEST · Deutschland',revision:1,startDate:'2026-11-01',endDate:'2026-11-08',travellers:1,party:[person],days:[],ohneTag:[],stages:[{id:'66666666-6666-4666-8666-666666666666',name:'Berlin',countryCode:'DE',position:1,arrivalDate:null,departureDate:null,latitude:null,longitude:null,placeId:null}]})
  if(saved) trip.regulatoryContext={version:1,evidenceClass:'user_attestation',tripId:trip.id,tripRevision:1,startDate:trip.startDate,endDate:trip.endDate,declaration:{...fixtureDeclaration},graphFingerprint:pilotGraphFingerprint(trip)}
  return trip
}
const sourceId='synthetic-application-authority'
const authority=quellenRegistryErstellen([{sourceId,sourceClass:'official_authority',publisherName:'SYNTHETISCHER LOKALTEST',authorityName:'SYNTHETISCHE TESTQUELLE – KEINE BEHÖRDE',domains:['application-pilot.example']}]);assert(authority.ok)
const item={sourceId,contentItemId:'synthetic-visa',contentItemVersion:1,current:true,externalIdNamespace:'synthetic',externalContentId:'synthetic-visa',expectedPublisherIds:['synthetic'],expectedAuthorityIds:['synthetic']}
const representation={sourceId,contentItemId:item.contentItemId,contentItemVersion:1,representationId:'synthetic-aa-html',representationVersion:1,current:true,requestUrls:[fixtureUrl],expectedFinalUrl:fixtureUrl,expectedMediaType:'text/html',identityProfileId:'synthetic-application',identityProfileVersion:1,expectedLocale:null,expectedSchema:null}
const profile:ContentIdentityProfileDefinition={identityProfileId:representation.identityProfileId,identityProfileVersion:1,current:true,verify:({responseText,representation:r})=>responseText.startsWith('<!doctype html>') && responseText.includes('<title>SYNTHETIC LOCAL APPLICATION TEST ONLY</title>') ? {ok:true,identity:contentIdentityBinding(r)} : {ok:false,reason:'identity_mismatch'}}
const graph=createContentIdentityGraph(authority.registry,[item],[representation],[profile]);assert(graph.ok)
export const fixtureRegistry={...graph.value.authorityRegistry,contentIdentity:graph.value}
export const fixtureContract:ApplicationContract={id:'synthetic-application-v1',digest:'a'.repeat(64),applicationScope:'ch-ordinary-tourism-direct-de-v1',travelDates:{from:'2026-11-01',through:'2026-11-08'},source:{sourceId,url:fixtureUrl,binding:contentIdentityBinding(representation),coverage:{destinationCountryCodes:['DE'],transitCountryCodes:[],requirementTypes:['visa'],citizenship:{mode:'exact',countryCodes:['CH']},residence:{mode:'not_applicable'},documents:{mode:'exact',options:[{documentType:'passport',issuingCountryCode:'CH'}]}}},extractorId:'otx_synthetic_application',extractorVersion:1,validity:text=>text.includes('<title>SYNTHETIC LOCAL APPLICATION TEST ONLY</title>')?{validFrom:null,validUntil:null}:null}
const definition:OfficialTruthExtractorDefinition={extractorId:fixtureContract.extractorId,extractorVersion:1,current:true,factKind:'requirement_effect',sourceFamilyId:'otf_synthetic_application',contentItemRefs:[{sourceId,contentItemId:item.contentItemId}],representations:[fixtureContract.source.binding],urlAllowlist:[{kind:'exact',canonicalUrl:fixtureUrl}],contentTypes:['text/html'],schemaFamily:'ots_synthetic_application',policyId:null,policyVersion:null,requiredFieldPaths:[],match:c=>c.supports.length===1&&chDeAaS1VisaRowResearchFromHtml(c.supports[0]!.sourceSnapshot).status==='research_visa_table_observation' ? {ok:true}:{ok:false,reason:'structure_not_recognized'},extract:c=>chDeAaS1VisaRowResearchFromHtml(c.supports[0]!.sourceSnapshot).status==='research_visa_table_observation'?{ok:true,fact:{kind:'requirement_effect',effect:'not_required',visaMode:'visa_exempt'}}:{ok:false,reason:'structure_not_recognized'}}
export function fixtureExtract(input:unknown) { return officialTruthTrustedFactExtrahierenMitDefinitionen(input,[definition]) }
export {consumeOfficialTruthTrustedFactExecutionContext}
export async function fixtureRetrieve(fault='none') {
  const swissRow='<tr><td>Schweiz</td><td>Nein</td></tr>'
  const body=fault==='altered'?fixtureBody.replace(swissRow,'<tr><td>Schweiz</td><td>Ja</td></tr>')
    :fault==='footnoted'?fixtureBody.replace(swissRow,'<tr><td>Schweiz</td><td>Nein (1)</td></tr>')
    :fault==='duplicate-swiss'?fixtureBody.replace('</tbody>','<tr><td>Schweiz</td><td>Ja</td></tr></tbody>')
    :fault==='no-visa-table'?fixtureBody.replace('Visumpflicht für Deutschland: Ja/Nein','Visum?')
    :fault==='hidden-swiss'?fixtureBody.replace(swissRow,'<tr><td>Schweiz</td><td><span hidden>Nein</span></td></tr>')
    :fault==='ambiguous-header'?fixtureBody.replace('</thead>','<tr><th>Staaten und Gebietskörperschaften</th><th>Visumpflicht für Deutschland: Ja/Nein</th></tr></thead>')
    :fault==='partial'?fixtureBody.slice(0,fixtureBody.indexOf(swissRow))
    :fault==='oversize'?'x'.repeat(65_537):fixtureBody
  return decideOfficialTruthServerOwnedRetrieval({sourceId,url:fixtureUrl},{now:()=>new Date(),resolve:async()=>[{address:'8.8.8.8',family:4}],timeoutMs:fault==='timeout'?5:1000,
    catalog:{identityProfiles:[profile],transport:{aufrufen:async()=>({ok:true,antwort:quellenKatalogSnapshotAntwort(fixtureRegistry)})}},
    http:async()=>({ok:true,status:200,headers:new Headers({'content-type':'text/html; charset=utf-8','content-length':String(Buffer.byteLength(fault==='partial'?fixtureBody:body))}),body:(async function*(){if(fault==='timeout')await new Promise(r=>setTimeout(r,30));yield Buffer.from(body)})()})})
}
const require=createRequire(import.meta.url)
/** Transpile the actual production module; only external ports are substituted. */
export function loadFixtureModule<T>(path:string,dependencies:Record<string,unknown>):T {
  const source=readFileSync(path,'utf8')
  const compiled=ts.transpileModule(source,{fileName:path,compilerOptions:{module:ts.ModuleKind.CommonJS,target:ts.ScriptTarget.ES2022,jsx:ts.JsxEmit.ReactJSX}}).outputText
  const loaded={exports:{}}
  new Function('require','module','exports',compiled)((id:string)=>dependencies[id]??require(id.startsWith('@/')?resolve(id.slice(2)):id.startsWith('.')?resolve(path,'..',id):id),loaded,loaded.exports)
  return loaded.exports as T
}

/** LOCAL TEST ONLY: compile the existing canonical chain with one isolated
 * profile registry. No exported production admission seam is introduced.
 * The caller supplies test code; the dormant candidate is never imported here.
 * Native transport/completeness and real source admission are NOT proved. */
export function protocol2Fixture(
  profile: ContentIdentityProfileDefinition,
  compiledProfiles: readonly ContentIdentityProfileDefinition[] = [profile],
) {
  const url='https://www.auswaertiges-amt.de/de/service/visa-und-aufenthalt/staatenliste-zur-visumpflicht-207820'
  const sourceId='de-aa-staatenliste-visumpflicht'
  const item={sourceId,contentItemId:'aa-staatenliste-visumpflicht-207820',contentItemVersion:1,current:true,
    externalIdNamespace:'aa-content-id',externalContentId:'207820',expectedPublisherIds:['auswaertiges-amt'],expectedAuthorityIds:['auswaertiges-amt']}
  const representation={sourceId,contentItemId:item.contentItemId,contentItemVersion:1,
    representationId:'aa-staatenliste-visumpflicht-html-de',representationVersion:1,current:true,
    requestUrls:[url],expectedFinalUrl:url,expectedMediaType:'text/html',expectedLocale:'de',expectedSchema:'article',
    identityProfileId:'de-aa-visa-table-html-de-candidate',identityProfileVersion:1}
  const binding=contentIdentityBinding(representation)
  const source=quellenRegistryErstellen([{sourceId,sourceClass:'official_authority',
    publisherName:'SYNTHETISCHER LOKALTEST',authorityName:'SYNTHETISCHE TESTQUELLE – KEINE BEHÖRDE',domains:['www.auswaertiges-amt.de']}])
  assert(source.ok)
  const graph=createContentIdentityGraph(source.registry,[item],[representation],[profile]);assert(graph.ok)
  const registry={...graph.value.authorityRegistry,contentIdentity:graph.value}
  const title='Übersicht zur Visumpflicht bzw. -freiheit bei Einreise in die Bundesrepublik Deutschland'
  const document=fixtureBody.replace('<title>SYNTHETIC LOCAL APPLICATION TEST ONLY</title>',
    `<title>${title} - Auswärtiges Amt</title><link rel="canonical" href="${url}">`
    + `<meta name="author" content="Auswärtiges Amt"><meta property="og:url" content="${url}">`
    + '<meta property="og:site_name" content="Auswärtiges Amt"><meta property="og:type" content="article">'
    + `<meta property="og:locale" content="de"><meta property="og:title" content="${title}">`)
    .replace('<main><h1>','<main id="main"><h1 class="heading__title">')
    .replace('</main>','<p>SYNTHETIC PROTOCOL 2 TEST ONLY</p><p>ä</p></main>')
    .replace('</body>','<!-- ID : 207820 / Version : 44 --></body>')
  const body=document.replace('<p>ä</p>',`<p>ä${'x'.repeat(93_365-Buffer.byteLength(document,'utf8'))}</p>`)
  assert.equal(Buffer.byteLength(body,'utf8'),93_365)
  assert(profile.verify({item,representation,responseText:body,finalUrl:url,mediaType:'text/html'}).ok)
  const contract:ApplicationContract={...fixtureContract,id:'synthetic-aa-protocol2',
    source:{...fixtureContract.source,sourceId,url,binding},extractorId:'otx_synthetic_aa_protocol2',
    validity:text=>text.includes('<p>SYNTHETIC PROTOCOL 2 TEST ONLY</p>')?{validFrom:null,validUntil:null}:null}

  // Shared instances are essential: the Evidence/Rule chain must use the same
  // exact permission, and the extractor's execution witness is a private WeakMap.
  const modules:Record<string,unknown>={
    '@/lib/readiness/official-truth-content-identity':{...contentIdentityModule,
      OFFICIAL_TRUTH_CONTENT_IDENTITY_PROFILE_REGISTRY:Object.freeze([...compiledProfiles])},
  }
  for(const name of [
    'official-truth-ch-de-source-budget-128k-1','evidence','rule-claims','official-truth-research-request',
    'source-router','official-truth-research-source-routing','official-truth-retrieved-material',
    'official-truth-retrieved-candidate-evidence','official-truth-accepted-evidence','official-truth-rule-candidate',
    'official-truth-rule-review-packet','official-truth-rule-review-fingerprint',
    'official-truth-rule-review-decision-intent','official-truth-trusted-fact-extractor-registry',
  ]) modules[`@/lib/readiness/${name}`]=loadFixtureModule(`lib/readiness/${name}.ts`,modules)
  const budget=modules['@/lib/readiness/official-truth-ch-de-source-budget-128k-1'] as typeof SourceBudget
  const extractors=modules['@/lib/readiness/official-truth-trusted-fact-extractor-registry'] as typeof Extractors
  const definition:OfficialTruthExtractorDefinition={extractorId:contract.extractorId,extractorVersion:1,current:true,
    factKind:'requirement_effect',sourceFamilyId:'otf_synthetic_aa_protocol2',contentItemRefs:[{sourceId,contentItemId:item.contentItemId}],
    representations:[binding],urlAllowlist:[{kind:'exact',canonicalUrl:url}],contentTypes:['text/html'],
    schemaFamily:'ots_synthetic_aa_protocol2',policyId:null,policyVersion:null,requiredFieldPaths:[],
    match:c=>c.supports.length===1&&chDeAaS1VisaRowResearchFromHtml(c.supports[0]!.sourceSnapshot).status==='research_visa_table_observation'
      ?{ok:true}:{ok:false,reason:'structure_not_recognized'},
    extract:c=>chDeAaS1VisaRowResearchFromHtml(c.supports[0]!.sourceSnapshot).status==='research_visa_table_observation'
      ?{ok:true,fact:{kind:'requirement_effect',effect:'not_required',visaMode:'visa_exempt'}}:{ok:false,reason:'structure_not_recognized'},
  }
  const extract=(input:unknown)=>extractors.officialTruthTrustedFactExtrahierenMitDefinitionen(input,[definition])
  function retrieval(snapshot=body) {
    const sourceContentHash=officialTruthSourceFingerprintV2(snapshot,{...binding,canonicalUrl:url,contentType:'text/html'})
    assert(sourceContentHash)
    return {...binding,identitySchema:2 as const,status:'server_owned_official_retrieval' as const,
      sourceId,requestUrl:url,canonicalUrl:url,retrievedAt:new Date().toISOString(),contentType:'text/html',
      sourceSnapshot:snapshot,sourceContentHash,sourceFingerprintProtocol:2 as const,redirectCount:0}
  }
  return {url,body,item,representation,binding,registry,contract,modules,budget,extract,
    consume:extractors.consumeOfficialTruthTrustedFactExecutionContext,retrieval}
}

