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
import { quellenRegistryErstellen } from '@/lib/readiness/source-registry'
import { quellenKatalogSnapshotAntwort } from '@/lib/readiness/official-truth-source-catalog-server'
import { decideOfficialTruthServerOwnedRetrieval } from '@/lib/readiness/official-truth-server-owned-retrieval'
import { officialTruthTrustedFactExtrahierenMitDefinitionen, consumeOfficialTruthTrustedFactExecutionContext, type OfficialTruthExtractorDefinition } from '@/lib/readiness/official-truth-trusted-fact-extractor-registry'
import type { ApplicationContract } from '@/lib/readiness/official-truth-ch-de-application-pilot-1/contract-server'
import { pilotGraphFingerprint, type PilotDeclaration } from '@/lib/readiness/official-truth-ch-de-application-pilot-1/context'

export const fixtureTripId='11111111-1111-4111-8111-111111111111'
export const fixtureUserId='22222222-2222-4222-8222-222222222222'
export const fixtureUrl='https://application-pilot.example/synthetic-visa'
export const fixtureBody='SYNTHETIC LOCAL APPLICATION TEST ONLY\nCH ordinary passport; tourism; direct CH-DE.\nVISA: NOT_REQUIRED; MODE: VISA_EXEMPT\nEND OF COMPLETE SYNTHETIC REPRESENTATION'
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
const representation={sourceId,contentItemId:item.contentItemId,contentItemVersion:1,representationId:'synthetic-text',representationVersion:1,current:true,requestUrls:[fixtureUrl],expectedFinalUrl:fixtureUrl,expectedMediaType:'text/plain',identityProfileId:'synthetic-application',identityProfileVersion:1,expectedLocale:null,expectedSchema:null}
const profile:ContentIdentityProfileDefinition={identityProfileId:representation.identityProfileId,identityProfileVersion:1,current:true,verify:({responseText,representation:r})=>responseText.startsWith('SYNTHETIC LOCAL APPLICATION TEST ONLY\n') ? {ok:true,identity:contentIdentityBinding(r)} : {ok:false,reason:'identity_mismatch'}}
const graph=createContentIdentityGraph(authority.registry,[item],[representation],[profile]);assert(graph.ok)
export const fixtureRegistry={...graph.value.authorityRegistry,contentIdentity:graph.value}
export const fixtureContract:ApplicationContract={id:'synthetic-application-v1',digest:'a'.repeat(64),applicationScope:'ch-ordinary-tourism-direct-de-v1',travelDates:{from:'2026-11-01',through:'2026-11-08'},source:{sourceId,url:fixtureUrl,binding:contentIdentityBinding(representation),coverage:{destinationCountryCodes:['DE'],transitCountryCodes:[],requirementTypes:['visa'],citizenship:{mode:'exact',countryCodes:['CH']},residence:{mode:'not_applicable'},documents:{mode:'exact',options:[{documentType:'passport',issuingCountryCode:'CH'}]}}},extractorId:'otx_synthetic_application',extractorVersion:1,validity:text=>text===fixtureBody?{validFrom:null,validUntil:null}:null}
const definition:OfficialTruthExtractorDefinition={extractorId:fixtureContract.extractorId,extractorVersion:1,current:true,factKind:'requirement_effect',sourceFamilyId:'otf_synthetic_application',contentItemRefs:[{sourceId,contentItemId:item.contentItemId}],representations:[fixtureContract.source.binding],urlAllowlist:[{kind:'exact',canonicalUrl:fixtureUrl}],contentTypes:['text/plain'],schemaFamily:'ots_synthetic_application',policyId:null,policyVersion:null,requiredFieldPaths:[],match:c=>c.supports.length===1&&c.supports[0]!.sourceSnapshot===fixtureBody ? {ok:true}:{ok:false,reason:'structure_not_recognized'},extract:()=>({ok:true,fact:{kind:'requirement_effect',effect:'not_required',visaMode:'visa_exempt'}})}
export function fixtureExtract(input:unknown) { return officialTruthTrustedFactExtrahierenMitDefinitionen(input,[definition]) }
export {consumeOfficialTruthTrustedFactExecutionContext}
export async function fixtureRetrieve(fault='none') {
  const body=fault==='altered'?fixtureBody.replace('NOT_REQUIRED','REQUIRED'):fault==='partial'?fixtureBody.slice(0,-8):fault==='oversize'?'x'.repeat(65_537):fixtureBody
  return decideOfficialTruthServerOwnedRetrieval({sourceId,url:fixtureUrl},{now:()=>new Date(),resolve:async()=>[{address:'8.8.8.8',family:4}],timeoutMs:fault==='timeout'?5:1000,
    catalog:{identityProfiles:[profile],transport:{aufrufen:async()=>({ok:true,antwort:quellenKatalogSnapshotAntwort(fixtureRegistry)})}},
    http:async()=>({ok:true,status:200,headers:new Headers({'content-type':'text/plain; charset=utf-8','content-length':String(Buffer.byteLength(fault==='partial'?fixtureBody:body))}),body:(async function*(){if(fault==='timeout')await new Promise(r=>setTimeout(r,30));yield Buffer.from(body)})()})})
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
