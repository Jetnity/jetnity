/** Explicit closed infrastructure. Seeds only the owned disposable cluster.
 * A local signed synthetic authority and a local witness are not target keys,
 * managed Auth, a production admission, or a legal/source-origin statement. */
import assert from 'node:assert/strict'
import { createHash,randomBytes } from 'node:crypto'
import { mkdtemp,open,readFile,rename,rm } from 'node:fs/promises'
import { tmpdir } from 'node:os'
import { join } from 'node:path'
import { quelleRegistrieren,contentItemRegistrieren,type OfficialTruthSourceCatalogTransport } from '@/lib/readiness/official-truth-source-catalog-server'
import { regelScopeAusEvidenceScope } from '@/lib/readiness/rule-claims'
import { ACCEPTED_STORE_TRIP_CLOSURE_PROFILE } from '@/lib/readiness/official-truth-integrated-pilot-bundle'
import type { AcceptedStoreBinding,StoreHead } from '@/lib/readiness/official-truth-accepted-store-trip-integration-1/binding-server'
import type { Trip } from '@/types/trips'
import type { PilotDeclaration } from '@/lib/readiness/official-truth-ch-de-application-pilot-1/context'
import { pgText } from '../official-truth-integrated-pilot-1/pg-wire'
import { nativeUser,nativeSession,nativeTrip,type startNativeHttp } from './native-http'
import { quote,type nativeSql } from './native-schema'
import { fixtureContract,fixtureCodeDigest,fixtureProfile,fixtureRegistry } from './fixtures'
import type { nativeProductRuntime } from './native-loader'
import type { NativeSuiteOwnership } from './native-suite'

type Protocol=Awaited<ReturnType<typeof startNativeHttp>>
type Runtime=ReturnType<typeof nativeProductRuntime>
export const nativeIds={stage:'44444444-4444-4444-8444-444444444444',day:'55555555-5555-4555-8555-555555555555',
  traveller:'66666666-6666-4666-8666-666666666666',citizen:'77777777-7777-4777-8777-777777777777',
  passport:'88888888-8888-4888-8888-888888888888',nationalId:'88888888-8888-4888-8888-888888888889',
  other:'66666666-6666-4666-8666-666666666667',otherCitizen:'77777777-7777-4777-8777-777777777778',
  otherPassport:'88888888-8888-4888-8888-88888888888a',item:'99999999-9999-4999-8999-999999999991',
  unassigned:'99999999-9999-4999-8999-999999999992',foreignUser:'11111111-1111-4111-8111-111111111112',
  foreignTrip:'33333333-3333-4333-8333-333333333334'} as const

export function seedNativeRows(sql:ReturnType<typeof nativeSql>) {
  // Owned local bootstrap only, before the tested product requests start. The
  // profile trigger sees no invented actor and is never disabled or replaced.
  sql(`insert into auth.users(id) values (${quote(nativeUser)}),(${quote(nativeIds.foreignUser)});
    insert into auth.sessions(id,user_id,not_after,aal) values(${quote(nativeSession)},${quote(nativeUser)},clock_timestamp()+interval '1 hour','aal2');
    insert into public.profiles(user_id,role,status) values(${quote(nativeUser)},'owner','active'),(${quote(nativeIds.foreignUser)},'user','active');
    insert into public.trips(id,user_id,title,origin,start_date,end_date,travellers,day_stage_assignment_mode)
      values(${quote(nativeTrip)},${quote(nativeUser)},'Synthetic local CH DE fixture','Zurich','2026-11-20','2026-11-25',2,'single_destination'),
      (${quote(nativeIds.foreignTrip)},${quote(nativeIds.foreignUser)},'Synthetic private foreign fixture',null,null,null,1,'legacy_fallback');
    insert into public.trip_stages(id,trip_id,user_id,name,country_code,arrival_date,departure_date)
      values(${quote(nativeIds.stage)},${quote(nativeTrip)},${quote(nativeUser)},'Synthetic Germany','DE','2026-11-20','2026-11-25');
    insert into public.trip_days(id,trip_id,user_id,day_index,day_date)
      values(${quote(nativeIds.day)},${quote(nativeTrip)},${quote(nativeUser)},1,'2026-11-20');
    insert into public.trip_items(id,trip_id,user_id,day_id,stage_id,kind,title,position,starts_at,price_amount,price_currency)
      values(${quote(nativeIds.item)},${quote(nativeTrip)},${quote(nativeUser)},${quote(nativeIds.day)},${quote(nativeIds.stage)},'note','Synthetic assigned note',1,'09:15:00',12.50,'CHF'),
      (${quote(nativeIds.unassigned)},${quote(nativeTrip)},${quote(nativeUser)},null,null,'note','Synthetic unassigned note',1,null,null,null);
    insert into public.trip_travellers(id,trip_id,user_id,client_ref,label,residence_country_code)
      values(${quote(nativeIds.traveller)},${quote(nativeTrip)},${quote(nativeUser)},'synthetic-traveller','Synthetic person A','CH'),
      (${quote(nativeIds.other)},${quote(nativeTrip)},${quote(nativeUser)},'synthetic-other','Synthetic person B','FR');
    insert into public.trip_traveller_citizenships(id,traveller_id,trip_id,user_id,client_ref,country_code)
      values(${quote(nativeIds.citizen)},${quote(nativeIds.traveller)},${quote(nativeTrip)},${quote(nativeUser)},'synthetic-citizenship','CH'),
      (${quote(nativeIds.otherCitizen)},${quote(nativeIds.other)},${quote(nativeTrip)},${quote(nativeUser)},'synthetic-other-citizenship','FR');
    insert into public.trip_traveller_documents(id,traveller_id,trip_id,user_id,client_ref,document_type,issuing_country_code,citizenship_id,expires_on)
      values(${quote(nativeIds.passport)},${quote(nativeIds.traveller)},${quote(nativeTrip)},${quote(nativeUser)},'synthetic-passport','passport','CH',${quote(nativeIds.citizen)},'2030-12-31'),
      (${quote(nativeIds.nationalId)},${quote(nativeIds.traveller)},${quote(nativeTrip)},${quote(nativeUser)},'synthetic-national-id','national_id','CH',${quote(nativeIds.citizen)},'2030-12-31'),
      (${quote(nativeIds.otherPassport)},${quote(nativeIds.other)},${quote(nativeTrip)},${quote(nativeUser)},'synthetic-other-passport','passport','FR',${quote(nativeIds.otherCitizen)},'2030-12-31');
    insert into public.trip_readiness_items(trip_id,user_id,client_ref,kind,context_fingerprint,traveller_id,country_code)
      values(${quote(nativeTrip)},${quote(nativeUser)},'synthetic-readiness','visa_check','synthetic-context',${quote(nativeIds.traveller)},'DE');
    insert into private.official_content_identity_profile_pins(identity_profile_id,identity_profile_version,current)
      values(${quote(fixtureProfile.identityProfileId)},${fixtureProfile.identityProfileVersion},true);`)
}

export async function seedNativeCatalog(protocol:Protocol,owner?:NativeSuiteOwnership) {
  owner?.check()
  const transport:OfficialTruthSourceCatalogTransport={aufrufen:async payload=>{
    owner?.check()
    const antwort=await protocol.transaction('service_role',{role:'service_role',exp:protocol.claims.exp},async c=>{
      const rows=await c.query('select public.official_truth_source_catalog_v2($1::jsonb) as result',[pgText(JSON.stringify(payload))])
      return JSON.parse(rows[0]!.result!)
    })
    return {ok:true,antwort}
  }}
  const source=fixtureRegistry.sources[0]!,item=fixtureRegistry.contentIdentity!.items[0]!,rep=fixtureRegistry.contentIdentity!.representations[0]!
  const sourceResult=await quelleRegistrieren({sourceId:source.sourceId,sourceClass:source.sourceClass,
    publisherName:source.publisherName,authorityName:source.authorityName,domains:[...source.domains]},{transport,identityProfiles:[fixtureProfile]})
  assert(sourceResult.ok,JSON.stringify(sourceResult));owner?.check()
  const {sourceId,contentItemId,contentItemVersion,...representation}=rep;void sourceId;void contentItemId;void contentItemVersion
  const result=await contentItemRegistrieren({...item,contentItemVersion:1,current:true,
    representations:[{...representation,representationVersion:1,current:true}]},{transport,identityProfiles:[fixtureProfile]})
  assert(result.ok,JSON.stringify(result));owner?.check()
}

export async function declareNativeTrip(protocol:Protocol,runtime:Runtime,declaration:Partial<PilotDeclaration>={},owner?:NativeSuiteOwnership):Promise<Trip> {
  owner?.check()
  // Only the newly owned setup/control path opts in. Existing callers and the
  // explicit legacy-factory proof keep their original no-argument behavior.
  const life=owner?new runtime.lifetime.AcceptedStoreLifetime(owner.signal,45_000):null
  const load=()=>life?life.run(()=>runtime.trips.reiseLaden(nativeTrip,life.signal)):runtime.trips.reiseLaden(nativeTrip)
  try {
    const loaded=await load();assert.equal(loaded.problem,null)
    const trip=loaded.zeilen[0];assert(trip)
    const context={version:1,evidenceClass:'user_attestation',tripId:trip.id,tripRevision:trip.revision+1,
      startDate:trip.startDate,endDate:trip.endDate,graphFingerprint:runtime.context.pilotGraphFingerprint(trip),
      declaration:{travellerClientRef:'synthetic-traveller',documentClientRef:'synthetic-passport',citizenshipClientRef:'synthetic-citizenship',
        credentialOptionRef:'synthetic-traveller:synthetic-passport',passportClass:'ordinary',purpose:'tourism',originCountryCode:'CH',route:'complete_direct_ch_de',...declaration}}
    owner?.check()
    const value=await protocol.transaction('authenticated',protocol.claims,async c=>{
      const rows=await c.query('select public.trip_regulatory_context_save_v1($1::jsonb) as result',[pgText(JSON.stringify({
        tripId:trip.id,revision:trip.revision,mutationId:`synthetic-context-${trip.revision}`,context}))])
      return JSON.parse(rows[0]!.result!) as {revision:number}
    }) as {revision:number}
    const confirmed=await load();assert.equal(confirmed.problem,null)
    assert(confirmed.zeilen[0]);assert.equal(confirmed.zeilen[0].revision,value.revision)
    assert(runtime.context.pilotContextCurrent(confirmed.zeilen[0]))
    return confirmed.zeilen[0]
  } catch(error){owner?.stop(error);throw error}
  finally {
    if(life){if(owner)await owner.cleanup(()=>life.settle());else await life.settle()}
  }
}

/** Durable filesystem fixture OUTSIDE the database cluster/restore root. Every
 * write fsyncs both file and containing directory before acknowledging CAS. */
export async function nativeBinding(targetUrl:string,sql:ReturnType<typeof nativeSql>,sourceMaxAgeSeconds:15|300=300,owner?:NativeSuiteOwnership) {
  owner?.check();assert(sourceMaxAgeSeconds===15||sourceMaxAgeSeconds===300)
  const contract=fixtureContract(),codeDigest=fixtureCodeDigest(contract),domain='synthetic-external-witness-v1',keyId='synthetic-ephemeral-key'
  owner?.check()
  const key=randomBytes(32),policyDigest=createHash('sha256').update('synthetic-process-owned-custody-v1').digest('hex')
  const seed=createHash('sha256').update(JSON.stringify({domain,profile:ACCEPTED_STORE_TRIP_CLOSURE_PROFILE,contract:contract.digest})).digest('hex')
  let directory:string|null=null,live=true,serial=Promise.resolve(),casCount=0,closing:Promise<void>|null=null
  const keyCopies:Uint8Array[]=[]
  try {
    owner?.check();directory=await mkdtemp(join(tmpdir(),'ot-accepted-trip-witness-'))
    owner?.check();const ownedDirectory=directory,path=join(ownedDirectory,'head.json')
    const scope=regelScopeAusEvidenceScope(contract.scope);assert(scope.ok)
    const write=async(value:unknown)=>{
      owner?.check();const temp=join(ownedDirectory,'head.next'),file=await open(temp,'w',0o600)
      try{owner?.check();await file.writeFile(JSON.stringify(value));owner?.check();await file.sync()}finally{await file.close()}
      owner?.check();await rename(temp,path);owner?.check()
      const dir=await open(ownedDirectory,'r');try{owner?.check();await dir.sync()}finally{await dir.close()}
    }
    const read=async(signal:AbortSignal)=>{
      owner?.check();signal.throwIfAborted();const body=await readFile(path,{encoding:'utf8',signal});signal.throwIfAborted();owner?.check()
      const value=JSON.parse(body) as {profile:string;domain:string;head:StoreHead;operationId:string|null}
      assert.equal(value.profile,ACCEPTED_STORE_TRIP_CLOSURE_PROFILE);assert.equal(value.domain,domain)
      return value.head
    }
    await write({profile:ACCEPTED_STORE_TRIP_CLOSURE_PROFILE,domain,head:{sequence:0,hash:seed},operationId:null})
    const binding:AcceptedStoreBinding={targetUrl,contract,codeDigest,sourceMaxAgeSeconds,retentionSeconds:3600,displaySeconds:15,current:()=>live,
      key:{id:keyId,policyDigest,resolve:async signal=>{owner?.check();signal.throwIfAborted();const value=Uint8Array.from(key);keyCopies.push(value);return value}},
      witness:{domain,read,compareAndSwap:(prior,successor,operationId,signal)=>{
        owner?.check()
        const operation=serial.then(async()=>{
          owner?.check();signal.throwIfAborted();const current=await read(signal)
          if(JSON.stringify(current)!==JSON.stringify(prior)||successor.sequence!==prior.sequence+1)return false
          owner?.check();signal.throwIfAborted();await write({profile:ACCEPTED_STORE_TRIP_CLOSURE_PROFILE,domain,head:successor,operationId});casCount++
          signal.throwIfAborted();owner?.check();return true
        })
        serial=operation.then(()=>undefined,()=>undefined);return owner?owner.track(operation):operation
      }}}
    owner?.check()
    sql(`insert into official_accepted_trip_private.admissions values(${quote(contract.id)},${quote(contract.digest)},${quote(codeDigest)},
      ${quote(ACCEPTED_STORE_TRIP_CLOSURE_PROFILE)},${quote(scope.key)},${quote(JSON.stringify(scope.scope))}::jsonb,
      ${quote(JSON.stringify(contract.source.binding))}::jsonb,${quote(keyId)},${quote(policyDigest)},${quote(domain)},${quote(seed)},${sourceMaxAgeSeconds},3600,15);
      insert into official_accepted_trip_private.heads values(${quote(contract.id)},0,${quote(seed)},0,${quote(seed)});`)
    return {binding,directory:ownedDirectory,path,keyCopies,casCount:()=>casCount,setLive:(value:boolean)=>{live=value},
      close(){
        if(closing)return closing
        live=false
        closing=(async()=>{await serial;key.fill(0);for(const copy of keyCopies)copy.fill(0);await rm(ownedDirectory,{recursive:true,force:true})})()
        return closing
      }}
  } catch(error) {
    // The caller has no returned witness yet. This constructor still owns its
    // acquired directory and key even when an after-await parent check fails.
    live=false;const errors:unknown[]=[error]
    try{await serial}catch(cleanup){errors.push(cleanup)}
    key.fill(0);for(const copy of keyCopies)copy.fill(0)
    if(directory){try{await rm(directory,{recursive:true,force:true})}catch(cleanup){errors.push(cleanup)}}
    if(errors.length>1)throw new AggregateError(errors,'native_witness_setup_failed')
    throw error
  }
}
