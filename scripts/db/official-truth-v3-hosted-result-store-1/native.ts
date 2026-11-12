// HRS1 owned synthetic PG17 proof. Source delivery is NOT_RUN.
// Production source issuance remains closed; this file creates only new .example originals.
import assert from 'node:assert/strict'
import { createHash } from 'node:crypto'
import { existsSync, readFileSync } from 'node:fs'
import { performance } from 'node:perf_hooks'
import type { TestContext } from 'node:test'
import { startLocalProofCluster, assertOwnedLocalProofCluster, type LocalProofCluster } from '../official-truth-integrated-pilot-1/local-cluster'
import { LocalPgConnection, LocalPgError, pgText, type PgRows } from '../official-truth-integrated-pilot-1/pg-wire'
import { OwnedTestLifetime } from '../official-truth-atomic-version-refresh-1/test-lifetime'
import { createMa1NativeExecutor } from '../official-truth-v3-method-authority-1/native-adapter'
import { createM04NativeExecutors, M04_FIXED_SQL } from '../official-truth-v3-durable-jobs-1/native-adapter'
import { M04_TEST_LOGIN, m04Canonical } from '../official-truth-v3-durable-jobs-1/fixtures'
import { sha256Hex } from '../../../lib/readiness/digest'
import { evidenceQuellenFingerprint } from '../../../lib/readiness/evidence'
import { quellenRegistryErstellen } from '../../../lib/readiness/source-registry'
import { createContentIdentityGraph, contentEvidenceLookupV3 } from '../../../lib/readiness/official-truth-content-identity'
import { officialTruthTrustedFactExtrahierenMitDefinitionen, type OfficialTruthExtractorDefinition } from '../../../lib/readiness/official-truth-trusted-fact-extractor-registry'
import { createV3ContextIdentity, createV3WorkIdentity, createV3TransitionIdempotencyKey, readV3GlobalRuleContext,
  readV3SourceDecisionRecord, readV3PublicProjectionRecord, readV3ResearchJobRecord, type V3ReadResult, type V3GlobalRuleContext,
  type V3SourceObservationRecord, type V3SourceDecisionRecord, type V3MethodRef, type V3PublicProjectionRecord,
  type V3ResearchProposal } from '../../../lib/readiness/official-truth-product-v3/contract'
import { createV3PostgresMethodAuthority, createV3PostgresResultJobs } from '../../../lib/readiness/official-truth-product-v3/method/authority-postgres'
import { createV3ImportCoordinator, type V3ImportHistory, type V3ImportOutcome, type V3ImportAudit,
  type V3ImportQuarantinePort } from '../../../lib/readiness/official-truth-product-v3/import/service-server'
import { readV3RetainableProposal } from '../../../lib/readiness/official-truth-product-v3/storage/proposal-bytes'
import { createV3PostgresQuarantineBackend } from '../../../lib/readiness/official-truth-product-v3/storage/quarantine-postgres'
import type { V3IntakeBinding, V3IntakeReference } from '../../../lib/readiness/official-truth-product-v3/storage/intake-contract'
import type { M04DeliveryProducer } from '../../../lib/readiness/official-truth-product-v3/jobs/contract'
import type { V3VersionHead } from '../../../lib/readiness/official-truth-product-v3/monitor/recovery'
import type { V3MonitorTarget, V3ProjectionSuppression } from '../../../lib/readiness/official-truth-product-v3/monitor/monitor'
import { prepareV3VisitorProjection, type V3ProjectionBinding } from '../../../lib/readiness/official-truth-product-v3/visitor/query'
import { HRS1_LIMITS, HRS1_FIELDS, HRS1_SQL, hrs1Canonical, hrs1Hash, hrs1Ref, hrs1Same, hrs1Time,
  hrs1Clock, hrs1Data, hrs1Channel, hrs1OriginalEvidence, readHrs1Binding, readHrs1Reply,
  type Hrs1Binding, type Hrs1Original, type Hrs1Ambiguity, type Hrs1Verification, type Hrs1Operation,
  type Hrs1Command, type Hrs1FixedRequest, type Hrs1FixedOperation, type Hrs1Reply,
  type Hrs1TerminalExecutor } from '../../../lib/readiness/official-truth-product-v3/result/contract'
import { createHrs1SourceConsumer, type Hrs1SourceCustodyIssuer,
  type Hrs1ObservedSource } from '../../../lib/readiness/official-truth-product-v3/result/source-proof'
import { createHrs1ResultPorts } from '../../../lib/readiness/official-truth-product-v3/result/postgres'

const HRS_METHOD = Object.freeze({ methodId:'hrs1-synthetic-visa',revision:1,
  methodDigest:sha256Hex('hrs1 fictional visa method v1'),packageDigest:sha256Hex('hrs1 fictional visa package v1') })
const METHOD_REF = Object.freeze({ methodId:HRS_METHOD.methodId,revision:HRS_METHOD.revision })
const fixtureId = (kind:'op3'|'job3'|'lease3'|'ev2',seed:string) => kind+'_'+sha256Hex(seed).slice(0,32)
function mustRead<T>(result:V3ReadResult<T>):T { if(!result.ok)assert.fail(result.reason);return result.value }
function detached<T>(value:T):T { return JSON.parse(hrs1Canonical(value)) as T }
function freezeData<T>(value:T):T {
  if(value && typeof value==='object'){for(const child of Object.values(value))freezeData(child);Object.freeze(value)}
  return value
}
const SOURCE_ROLES=['primary','counter'] as const
type FixtureSourceRole=(typeof SOURCE_ROLES)[number]
function fixtureSource(role:FixtureSourceRole){return Object.freeze({
  sourceId:'hrs1-synthetic-'+role,contentItemId:'synthetic-visa-publication',representationId:'synthetic-visa-json',
  contentItemVersion:1,representationVersion:1,identityProfileId:'synthetic-hrs1-profile',identityProfileVersion:1,
})}
const fixtureUrl=(role:FixtureSourceRole)=>'https://hrs1-synthetic-'+role+'.example/fictional-visa-rules'
/** Private synthetic issuance belongs to this actual owned local PG17 fixture.
 * There is no production-importable issuer constructor or copied old pilot row. */
function makeVisaFixture(cluster:LocalProofCluster,lifetime:OwnedTestLifetime,seed:string){
  assertOwnedLocalProofCluster(cluster);lifetime.check()
  const created=quellenRegistryErstellen(SOURCE_ROLES.map(role=>({sourceId:fixtureSource(role).sourceId,
    sourceClass:'official_authority',publisherName:'Fiktiver HRS1 Testverlag',authorityName:'Fiktive HRS1 Testbehoerde',
    domains:['hrs1-synthetic-'+role+'.example']})))
  assert.ok(created.ok);if(!created.ok)assert.fail('synthetic registry refused')
  const graph=createContentIdentityGraph(created.registry,SOURCE_ROLES.map(role=>({
    sourceId:fixtureSource(role).sourceId,contentItemId:'synthetic-visa-publication',contentItemVersion:1,current:true,
    externalIdNamespace:'synthetic',externalContentId:'hrs1-visa',expectedPublisherIds:['synthetic'],expectedAuthorityIds:['synthetic']})),
    SOURCE_ROLES.map(role=>({...fixtureSource(role),current:true,requestUrls:[fixtureUrl(role)],
      expectedFinalUrl:fixtureUrl(role),expectedMediaType:'application/json',expectedLocale:null,expectedSchema:null})),
    [{identityProfileId:'synthetic-hrs1-profile',identityProfileVersion:1,current:true,
      verify:()=>({ok:false as const,reason:'identity_mismatch' as const})}])
  assert.ok(graph.ok);if(!graph.ok)assert.fail('synthetic graph refused')
  const registry={...created.registry,contentIdentity:graph.value}
  const context=mustRead(readV3GlobalRuleContext({
    scope:{destinationCountryCode:'DE',transitCountryCode:null,citizenship:{mode:'required',countryCodes:['CH']},
      credentialOption:{mode:'option',documentType:'passport',issuingCountryCode:'CH',relatedCitizenshipCountryCode:'CH'},
      residence:{mode:'not_applicable'},requirementType:'visa',validity:{mode:'not_applicable'}},
    route:'direct_entry',conditions:{status:'specified',expression:{op:'atomic',predicate:{kind:'travel_purpose',purpose:'visitor'}}},
  }))
  const identity=mustRead(createV3ContextIdentity(context))
  const bindingRead=readHrs1Binding({...HRS_METHOD,schema:1,qualificationScope:'global_context',context,contextKey:identity.contextKey,
    factKind:'requirement_effect',dataMode:'synthetic_test',legalTimeZone:'Europe/Berlin',
    activeFrom:'2000-01-01T00:00:00.000Z',activeUntilExclusive:'2099-12-31T00:00:00.000Z',
    sourceMaxAgeMilliseconds:300000,projectionMaxAgeMilliseconds:60000,monitorIntervalMilliseconds:100,
    monitorLeaseMilliseconds:5000,attemptLimit:3,sources:SOURCE_ROLES.map(role=>({source:fixtureSource(role),canonicalUrl:fixtureUrl(role),
      contentType:'application/json',executableDigest:sha256Hex('hrs1 fictional extractor '+role),
      qualificationDigest:sha256Hex('hrs1 fictional global qualification '+role),role}))},registry)
  assert.ok(bindingRead)
  const binding:Hrs1Binding=bindingRead
  const control={epoch:1,mode:'agrees' as 'agrees'|'conflicts'|'not_found'|'unreachable'|'unclear',unavailable:false,resolve:false,
    retrievedAt:new Date().toISOString(),expiresAt:null as string|null,inspections:0,finalizations:0,finalizationAttempts:0,reproofs:0,extracts:0,observations:0,reopens:0,producerCalls:0}
  const originals=new Map<string,Hrs1Original>()
  const held=new WeakMap<object,{verification:Hrs1Verification;generation:string}>()
  const known=new Map<string,{verification:Hrs1Verification;generation:string}>()
  const observationHeld=new WeakMap<object,{value:Hrs1ObservedSource;generation:string}>()
  const delivered:{binding:V3IntakeBinding;text:string}[]=[]
  let serial=0
  const generation=()=>hrs1Canonical([control.epoch,control.mode,control.retrievedAt,control.expiresAt,control.resolve])
  const clock=()=>{const at=hrs1Clock(new Date().toISOString(),binding.legalTimeZone);assert.ok(at);return at}
  function active(signal?:AbortSignal){assertOwnedLocalProofCluster(cluster);lifetime.check();return!control.unavailable&&!signal?.aborted}
  function material(role:FixtureSourceRole,checkedAt:string):Hrs1Original{
    const unclear=role==='primary'&&control.mode==='unclear'
    const effect=role==='counter'&&control.mode==='conflicts'?'required':'not_required'
    const cacheKey=hrs1Canonical([control.epoch,role,unclear,effect,control.retrievedAt])
    const existing=originals.get(cacheKey);if(existing)return existing
    const bodyText=JSON.stringify(unclear?{synthetic:true,epoch:control.epoch,statements:['visa required','visa not required']}
      :{synthetic:true,epoch:control.epoch,sourceRole:role,fact:{kind:'requirement_effect',effect}})
    const source=fixtureSource(role),fingerprint=evidenceQuellenFingerprint(bodyText);assert.ok(fingerprint)
    const work=mustRead(createV3WorkIdentity({context,method:METHOD_REF,factKind:'requirement_effect',researchReason:{status:'missing'}}))
    const versionId=fixtureId('ev2',seed+'|'+source.sourceId+'|'+bodyText+'|'+control.retrievedAt)
    const lookup=contentEvidenceLookupV3(context.scope,{sourceId:source.sourceId,contentItemId:source.contentItemId,representationId:source.representationId})
    assert.ok(lookup.ok);if(!lookup.ok)assert.fail('synthetic lookup refused')
    const definition:OfficialTruthExtractorDefinition={extractorId:'otx_hrs1_'+role,extractorVersion:1,current:true,
      factKind:'requirement_effect',sourceFamilyId:'otf_hrs1_synthetic',contentItemRefs:[{sourceId:source.sourceId,contentItemId:source.contentItemId}],
      representations:[source],urlAllowlist:[{kind:'exact',canonicalUrl:fixtureUrl(role)}],contentTypes:['application/json'],
      schemaFamily:'ots_hrs1_synthetic',policyId:null,policyVersion:null,requiredFieldPaths:[],match:()=>({ok:true}),
      extract:({supports})=>{control.extracts++;const row=JSON.parse(supports[0]!.sourceSnapshot) as {synthetic?:unknown;fact?:unknown;statements?:unknown}
        if(row.synthetic!==true)return{ok:false,reason:'structure_not_recognized'}
        if(row.statements!==undefined){assert.deepEqual(row.statements,['visa required','visa not required']);return{ok:false,reason:'ambiguous_structure'}}
        return{ok:true,fact:row.fact}},
    }
    const input={factKind:'requirement_effect',requirementType:'visa',scopeKey:work.ruleScopeKey,scope:context.scope,
      evidenceQuality:'explicit_primary_statement',policy:null,registry,supports:[{versionId,sourceId:source.sourceId,
        retrieval:{...source,identitySchema:2,status:'server_owned_official_retrieval',canonicalUrl:fixtureUrl(role),
          retrievedAt:control.retrievedAt,contentType:'application/json',sourceSnapshot:bodyText,sourceContentHash:fingerprint,redirectCount:0}}]}
    const execution=officialTruthTrustedFactExtrahierenMitDefinitionen(input,[definition])
    const evidence:V3SourceObservationRecord['evidence']={versionId,lookupKey:lookup.value.key,source,sourceFingerprintProtocol:1,
      sourceContentHash:fingerprint,retrievedAt:control.retrievedAt,legalValidity:{status:'specified',validFrom:'2000-01-01',validUntil:'2099-12-31'}}
    const selected=binding.sources.find(s=>s.role===role);assert.ok(selected)
    const common={bodyText,rawDigest:sha256Hex(bodyText),qualification:{qualificationDigest:selected.qualificationDigest,
      source,contextKey:binding.contextKey,method:METHOD_REF,checkedAt,role}}
    let result:Hrs1Original
    if(unclear){
      assert.equal(execution.status,'blocked');if(execution.status!=='blocked')assert.fail('unclear publication has no extracted fact')
      assert.equal(execution.reason,'ambiguous_structure')
      const ambiguity:Hrs1Ambiguity={context,contextKey:binding.contextKey,evidence,reason:'ambiguous_statement'}
      result={...common,observation:null,ambiguity,extraction:{executableDigest:selected.executableDigest,observation:null,ambiguity}}
    }else{
      if(execution.status!=='trusted_fact_extracted')assert.fail(execution.reason)
      const observation:V3SourceObservationRecord={context,contextKey:binding.contextKey,fact:{schema:1,fact:execution.fact},evidence}
      result={...common,observation,extraction:{executableDigest:selected.executableDigest,observation}}
    }
    const frozen=freezeData(result);originals.set(cacheKey,frozen);return frozen
  }
  function expiry(values:readonly Hrs1Original[]):string{return new Date(Math.min(Date.parse(binding.activeUntilExclusive),
    ...values.map(o=>Date.parse(hrs1OriginalEvidence(o).retrievedAt)+binding.sourceMaxAgeMilliseconds),
    control.expiresAt===null?Infinity:Date.parse(control.expiresAt))).toISOString()}
  function issue(verification:Hrs1Verification){
    const receipt=Object.freeze(Object.create(null) as object),entry={verification,generation:generation()}
    held.set(receipt,entry);assert.ok(known.size<256||known.has(verification.reference),'finite fixture custody')
    known.set(verification.reference,entry);return{receipt,verification}
  }
  const issuer:Hrs1SourceCustodyIssuer=Object.freeze<Hrs1SourceCustodyIssuer>({
    async inspect(challenge,signal){
      control.inspections++
      if(!active(signal)||!hrs1Same(challenge.binding,binding)||!hrs1Same(challenge.request.context,context))return null
      const request=challenge.request,primary=material('primary',request.clock.now),prior=challenge.history.decision
      const currentOriginals:Hrs1Original[]=[primary],conflicts=detached(prior?.knownConflicts??[])
      for(const old of challenge.stickyDecision?.knownConflicts??[])if(!conflicts.some(c=>c.reference===old.reference))conflicts.push(detached(old))
      const attempts:V3SourceDecisionRecord['counterCheck']['attempts']=[]
      if(control.mode==='agrees'||control.mode==='conflicts'||control.mode==='unclear'){
        const counter=material('counter',request.clock.now);assert.ok(counter.observation);currentOriginals.push(counter)
        if(control.mode==='conflicts'){
          assert.ok(primary.observation)
          const conflictRef=hrs1Ref('source-conflict',{primary:primary.observation.evidence.versionId,counter:counter.observation.evidence.versionId})
          if(!conflicts.some(c=>c.reference===conflictRef))conflicts.push({reference:conflictRef,detectedDecisionRef:request.decisionRef,
            detectedAt:request.clock.now,primary:primary.observation,counter:counter.observation,resolution:null})
          attempts.push({status:'conflicts',observation:counter.observation,attemptedAt:request.clock.now,conflictRef,
            comparisonRef:hrs1Ref('source-comparison',{conflictRef})})
        }else attempts.push({status:control.mode==='unclear'?'not_comparable':'agrees',observation:counter.observation,
          attemptedAt:request.clock.now,comparisonRef:hrs1Ref('source-comparison',{decision:request.decisionRef})})
        if(control.resolve)for(let i=0;i<conflicts.length;i++){
          const old=conflicts[i]!
          if(!old.resolution)conflicts[i]={...old,resolution:{reference:hrs1Ref('conflict-resolution',{conflict:old.reference,epoch:control.epoch}),
            predecessor:null,conflictRef:old.reference,method:METHOD_REF,resolvedAt:request.clock.now,legalAsOfDate:request.clock.legalDate,
            basis:'corrected_publication',observations:[counter.observation]}}
        }
      }else if(control.mode==='unreachable')attempts.push({status:'unreachable',attemptedAt:request.clock.now,
        source:{sourceId:fixtureSource('counter').sourceId,contentItemId:fixtureSource('counter').contentItemId,representationId:fixtureSource('counter').representationId}})
      else attempts.push({status:'not_found',source:null,attemptedAt:request.clock.now})
      const decision=mustRead(readV3SourceDecisionRecord({schema:3,kind:'source_decision_record',reference:request.decisionRef,
        predecessor:prior?.reference??null,method:METHOD_REF,context,contextKey:binding.contextKey,factKind:'requirement_effect',
        evaluatedAt:request.clock.now,legalAsOfDate:request.clock.legalDate,
        primary:primary.observation===null?{status:'unclear',reason:primary.ambiguity.reason,evidence:primary.ambiguity.evidence}
          :{status:'clear',observation:primary.observation,qualification:{reference:hrs1Ref('destination-qualification',{decision:request.decisionRef}),
            representedCountryCode:'DE',role:'destination_authority',method:METHOD_REF,evidenceVersionId:primary.observation.evidence.versionId,checkedAt:request.clock.now}},
        counterCheck:{attemptPlanRevision:1,attempts},knownConflicts:conflicts,historyArchive:prior?.historyArchive??null,
        conclusion:conflicts.some(c=>c.resolution===null)?'comparable_conflict':primary.observation===null?'primary_unclear':'clear_primary',
      },registry,prior,null))
      const body={request,decision,previousDecision:prior,archiveAppend:null,originals:currentOriginals,history:challenge.history,
        stickyDecision:challenge.stickyDecision,suppressionEpoch:challenge.suppressionEpoch,validUntilExclusive:expiry(currentOriginals)}
      const verification=freezeData<Hrs1Verification>({reference:hrs1Ref('hrs1-verification',body),...detached(body)})
      await lifetime.wait(1) // Real owned wait: I1 must finalize against its later actual clock, without refreshing this expiry.
      return active(signal)&&verification.validUntilExclusive>clock().now?issue(verification):null
    },
    async finalize(receipt,inspection,decision,archiveAppend,at,signal){
      control.finalizationAttempts++
      const actual=held.get(receipt)
      if(!active(signal)||!actual||actual.generation!==generation()||!hrs1Same(actual.verification,inspection)
        ||!hrs1Same(archiveAppend,inspection.archiveAppend)||!hrs1Same(at,hrs1Clock(at.now,binding.legalTimeZone))
        ||at.now<inspection.decision.evaluatedAt||at.now>=inspection.validUntilExclusive)return null
      const expected=readV3SourceDecisionRecord({...inspection.decision,evaluatedAt:at.now,legalAsOfDate:at.legalDate},
        registry,inspection.previousDecision,inspection.archiveAppend)
      if(!expected.ok||!hrs1Same(expected.value,decision))return null
      const{reference:oldReference,...body}=inspection;void oldReference
      const finalBody={...body,decision:expected.value}
      const verification=freezeData<Hrs1Verification>({reference:hrs1Ref('hrs1-verification',finalBody),...detached(finalBody)})
      control.finalizations++;return issue(verification)
    },
    async reprove(receipt,verification,at,signal){
      control.reproofs++;const actual=held.get(receipt)
      return active(signal)&&actual?.generation===generation()&&hrs1Same(actual.verification,verification)
        &&hrs1Same(at,hrs1Clock(at.now,binding.legalTimeZone))&&at.now<verification.validUntilExclusive?actual.verification:null
    },
    async reopen(verification,signal){
      control.reopens++
      const actual=known.get(verification.reference)
      return active(signal)&&actual?.generation===generation()&&hrs1Same(actual.verification,verification)
        &&clock().now<verification.validUntilExclusive?issue(actual.verification):null
    },
    async observe(target,configured,signal){
      control.observations++
      if(!active(signal)||!hrs1Same(configured,binding)||!hrs1Same(target.context,context))return{status:'unavailable'}
      const role=SOURCE_ROLES.find(r=>hrs1Same(fixtureSource(r),target.source));if(!role)return{status:'unavailable'}
      const at=clock(),original=material(role,at.now),evidence=hrs1OriginalEvidence(original)
      const body={target,method:METHOD_REF,observation:{source:evidence.source,fingerprint:{sourceContentHash:evidence.sourceContentHash,
        sourceFingerprintProtocol:evidence.sourceFingerprintProtocol},retrievedAt:evidence.retrievedAt},original,
        status:original.observation===null?'unclear' as const:'observed' as const,checkedAt:at.now}
      const value=freezeData<Hrs1ObservedSource>({reference:hrs1Ref('hrs1-source-observation',body),...detached(body)})
      const receipt=Object.freeze(Object.create(null) as object);observationHeld.set(receipt,{value,generation:generation()});return{receipt,value}
    },
    async reproveObservation(receipt,value,at,signal){
      control.reproofs++
      const actual=observationHeld.get(receipt)
      return active(signal)&&actual?.generation===generation()&&hrs1Same(actual.value,value)
        &&hrs1Same(at,hrs1Clock(at.now,binding.legalTimeZone))&&at.now<expiry([actual.value.original])?actual.value:null
    },
  })
  function ruleInput(tag:string,reason:unknown={status:'missing'}){return{context,method:METHOD_REF,factKind:'requirement_effect',
    researchReason:reason,operationId:fixtureId('op3',seed+'|enqueue|'+tag),jobId:fixtureId('job3',seed+'|job|'+tag),attemptLimit:3}}
  function delivery(job:{jobId:string;context:V3GlobalRuleContext;research:V3ResearchProposal['research']},tag:string){
    const work=mustRead(createV3WorkIdentity({context:job.context,method:METHOD_REF,factKind:'requirement_effect',researchReason:{status:'missing'}}))
    const proposal={schema:3,kind:'untrusted_research_proposal',jobId:job.jobId,operationId:fixtureId('op3',seed+'|proposal|'+tag),
      context:job.context,contextKey:work.contextKey,research:job.research,proposedFact:{schema:1,fact:{kind:'requirement_effect',effect:'required'}},
      references:[{source:{sourceId:fixtureSource('primary').sourceId,contentItemId:fixtureSource('primary').contentItemId,
        representationId:fixtureSource('primary').representationId},claimedRetrievedAt:'2000-01-01T00:00:00.000Z',
        claimedValidity:{status:'specified',validFrom:null,validUntil:null}}]}
    const text=JSON.stringify(proposal,null,2),parsed=readV3RetainableProposal(text,registry);assert.ok(parsed.ok)
    const intakeBinding:V3IntakeBinding={schema:3,kind:'proposal_intake_binding',operationId:proposal.operationId,jobId:job.jobId,
      contextKey:work.contextKey,method:METHOD_REF,runnerId:'runner3_'+sha256Hex(seed+'|runner').slice(0,32),
      deliveryId:'delivery3_'+sha256Hex(seed+'|delivery|'+tag).slice(0,32),inputRevision:'snapshot:'+sha256Hex(seed+'|synthetic-visa')}
    return{binding:intakeBinding,text}
  }
  const producer:M04DeliveryProducer=Object.freeze<M04DeliveryProducer>({async produce({job},signal){
    assert.equal(signal.aborted,false);assert.equal(job.kind,'research_job_record')
    if(job.kind!=='research_job_record')return{status:'failed',reason:'unreachable'}
    assert.ok(hrs1Same(job.context,context));control.producerCalls++
    const item=delivery(job,String(++serial));delivered.push(item);return{status:'delivered',deliveries:[item]}
  }})
  return{binding,registry,context,control,issuer,clock,producer,delivered,ruleInput,delivery,
    ids:()=>({jobId:fixtureId('job3',seed+'|auto|'+(++serial)),operationId:fixtureId('op3',seed+'|auto|'+serial)}),
    claim:(jobKey:string,tag:string)=>({operationId:fixtureId('op3',seed+'|claim|'+tag),jobKey,
      leaseId:fixtureId('lease3',seed+'|lease|'+tag),leaseMilliseconds:30000}),
    refresh(mode:typeof control.mode=control.mode){control.epoch++;control.mode=mode;control.retrievedAt=new Date().toISOString();control.expiresAt=null},
    verificationForDecision(decision:V3SourceDecisionRecord){return[...known.values()].reverse().find(v=>hrs1Same(v.verification.decision,decision))?.verification??null},
    verificationForReference(reference:string){return known.get(reference)?.verification??null},
  }
}
type VisaFixture=ReturnType<typeof makeVisaFixture>

const EFFECT_MS=180_000,DRAIN_MS=35_000,MAX_CONNECTIONS=2048,MAX_OPERATIONS=32768
const GROUPS=['N01','N02','N03','N04','N05','N06','N07','N08','N09','N10','N11','N12'] as const
const ROOT=new URL('../../../',import.meta.url)
const TARGET_ACK='dev:yfvbxvijcorffwxbxahl:postgres:E18B6824905662'
const RECOVERY_CONTEXT='root_independent_identity_no_consumers_controlled_quiescence_v1'
const BINDING=HRS_METHOD
const TECHNICAL=[
  {login:M04_TEST_LOGIN.jobs,role:'ot_v3_jobs_caller'},
  {login:M04_TEST_LOGIN.intake,role:'ot_v3_intake_caller'},
  {login:'ot_ma1_reader',role:'ot_v3_method_reader'},
] as const

// Complete immutable source closure; every pin is checked before allocation.
const PINS = [
  {
    "path": "lib/api/datenbank-lesen.ts",
    "bytes": 5068,
    "blob": "dc66e852527df8561f3ac4aa45744df9bd076c48",
    "sha256": "9d6ada9651d59dc808e58f9ac5bfbbce4e5417f5ffafc5e7fc06e07d2d4bb135"
  },
  {
    "path": "lib/country/katalog.ts",
    "bytes": 2499,
    "blob": "dfde5361642edbe30f1abc6f18df3200b046f448",
    "sha256": "ebaed24988b7c34ac352cdc10e7ed6031fbb25bf93f6efd280769878c7891f8c"
  },
  {
    "path": "lib/readiness/digest.ts",
    "bytes": 3013,
    "blob": "bbb6ee9d8e1e1433cbb5753b15b86b7b215d8c54",
    "sha256": "e63201d45a39f68624b1e1f9e7568b696f8a65d1ada07f16e64a2be69dcec190"
  },
  {
    "path": "lib/readiness/domain.ts",
    "bytes": 3637,
    "blob": "27ffd5d9f7b118a09741e92fee32d9cb08401927",
    "sha256": "e4b2e779f398b6a45916e7fc1a232194a0a374833cfb39884a5c312d69ded587"
  },
  {
    "path": "lib/readiness/evidence.ts",
    "bytes": 36628,
    "blob": "f1a28d5a8f7445219f8cec224a849852c012fc3a",
    "sha256": "e2db270b542443eb8b05808de7526de0d7578f42d89bdc60fd97548f327195cb"
  },
  {
    "path": "lib/readiness/official-truth-autonomous-provenance-artifact.ts",
    "bytes": 9517,
    "blob": "3c3aaeb3cc73e223b0a0cf2df1d9ceb27ff161cf",
    "sha256": "1bdf271bf078d1c46fbc0f510789129e361bfdabce7cdd6e03a27a21071f323b"
  },
  {
    "path": "lib/readiness/official-truth-ch-de-application-pilot-1/context.ts",
    "bytes": 4402,
    "blob": "25dafee0f06353785972efafe0fc2db90183372b",
    "sha256": "2e0fd2776172f5634c2f288f7f4e6b134f78b65ff214d296ca16a4f781788c7e"
  },
  {
    "path": "lib/readiness/official-truth-ch-de-source-budget-128k-1.ts",
    "bytes": 6390,
    "blob": "8212e90e15ec1c87df58525867d0d095ecabedf0",
    "sha256": "8ffe78364851f37eb25d70adbb86fba4b2831f2c49ce9848849c97ea050366f7"
  },
  {
    "path": "lib/readiness/official-truth-content-identity.ts",
    "bytes": 27496,
    "blob": "4a4c3eea77b6e634fd83525849a4aaa6e6e50c18",
    "sha256": "f48c5e31ab5e4ec0f8f3a5dae2bd769869b37396aae8e36ccb6964d2798d3df6"
  },
  {
    "path": "lib/readiness/official-truth-coverage.ts",
    "bytes": 15066,
    "blob": "42c36f522016e87cf51461f7bd3f1056d4355529",
    "sha256": "5220d545e459b9f6b372be86d6565ae59f13e1d445c2e54c4895f2f99c404039"
  },
  {
    "path": "lib/readiness/official-truth-govuk-content-api-identity-profile.ts",
    "bytes": 13601,
    "blob": "505ecc92bada48cf7ef81bd812210c1a5dac8d7b",
    "sha256": "9b756a4347248decf20eb11264e2577f1f2eb0cbcdad0018d6d86d3e37002828"
  },
  {
    "path": "lib/readiness/official-truth-product-v3/contract.ts",
    "bytes": 61555,
    "blob": "354c18e153f90a7febb7ea8f14558626202c187e",
    "sha256": "7a7abc307b3bd9cf5bf80a85da91c5ecdb7ef7146546fe0d15fc3f25f768859c"
  },
  {
    "path": "lib/readiness/official-truth-product-v3/import/interface.ts",
    "bytes": 2538,
    "blob": "c549d0dfe80e2283f8852022637c3d1c8e7a3d5d",
    "sha256": "d98772cb27275aa768541bb670f3ae0effaf866748aea6b3797c03ac49361bb6"
  },
  {
    "path": "lib/readiness/official-truth-product-v3/import/service-server.ts",
    "bytes": 23971,
    "blob": "43036718191c3a733aaeaca1fde9f499174cee53",
    "sha256": "2f88077023c0215ebfd246b0dd50b3216e45e7bc342e72eae2cac10c72758b09"
  },
  {
    "path": "lib/readiness/official-truth-product-v3/integration/coordinator.ts",
    "bytes": 22886,
    "blob": "bcdbfedc6e702185f270520a9685ab5700eaed92",
    "sha256": "98568e19e16206b3c97d7f13d442428a7c314f8b67de7633a2d3f38619184a11"
  },
  {
    "path": "lib/readiness/official-truth-product-v3/integration/ports.ts",
    "bytes": 5699,
    "blob": "3a66e8e44ea06061dbfdc1d9a341bd2c61c5866d",
    "sha256": "6000fda06783ef7e644d9ed65bfd7ca069e9de49af579fc17f4dff11585fe299"
  },
  {
    "path": "lib/readiness/official-truth-product-v3/integration/test-support/originals.ts",
    "bytes": 7930,
    "blob": "f7915790ce334b16e24bbea84848e318cd1d0f89",
    "sha256": "a1b360b31bcc4140ad5e8fc9d66017166c58b69f92456dd73feb4f11b34343b1"
  },
  {
    "path": "lib/readiness/official-truth-product-v3/integration/test-support/store.ts",
    "bytes": 35281,
    "blob": "addf597505eaedfdf3da0ba925f4b2e6ef96e7ba",
    "sha256": "534529284cdc76090cd648561f3b4f51f16d7e3590f13c39067ab092e55a7d90"
  },
  {
    "path": "lib/readiness/official-truth-product-v3/jobs/composition.ts",
    "blob": "4c84ecdec8cd82dedf21d3decb7cae6d791fedc5",
    "bytes": 25086,
    "sha256": "f9edce307a52cca4860c820adbc8c356fa3637e209dc6de4fe743070fbc69b34"
  },
  {
    "path": "lib/readiness/official-truth-product-v3/jobs/contract.ts",
    "blob": "e54779dfa4cd65372f0f375182beafd4a1d155c1",
    "bytes": 27465,
    "sha256": "95e8233bd0fdbaa41fbb5cea03ec8a5a415161116cbdb44871d25f6c12661f06"
  },
  {
    "path": "lib/readiness/official-truth-product-v3/jobs/owned-scope.ts",
    "bytes": 8816,
    "blob": "c80c48cca369cc8ea0c30bc5f620cada639a1e05",
    "sha256": "f1fe66e3311ddbc5c6209d046188f653e2895ad1857565ad52bc8d777046c94e"
  },
  {
    "path": "lib/readiness/official-truth-product-v3/jobs/postgres.ts",
    "bytes": 12578,
    "blob": "3c519e73fc440146bafe168983ae96d765b4a66f",
    "sha256": "e906165fcb33a9a4c84d6445d1f2d6ae61c829c8e8127afae307dfa94b0509a8"
  },
  {
    "path": "lib/readiness/official-truth-product-v3/method/authority-postgres.ts",
    "blob": "00d4edcb7daa090b61a28add33167ecd977e6324",
    "bytes": 33339,
    "sha256": "4402caba7216960cac671ec949893b51178b9532ae07db2c50e82902ec3549cb"
  },
  {
    "path": "lib/readiness/official-truth-product-v3/method/contract.ts",
    "bytes": 10485,
    "blob": "da6c4bd4ab930b9c2ff7c0e387fc310e9eec643b",
    "sha256": "77d88e2063bf12ee4c1ca385bb4d65b9b5fd14845da62a25556877a0329ed05e"
  },
  {
    "path": "lib/readiness/official-truth-product-v3/monitor/internal.ts",
    "bytes": 3443,
    "blob": "cd107022522a725cbbafe7589028aec5f341cefa",
    "sha256": "dc9f237166705be5346819bf4156b34846558ab8debec28d025a1352028a07ff"
  },
  {
    "path": "lib/readiness/official-truth-product-v3/monitor/monitor.ts",
    "blob": "446e727e3e3030ef4949829864abb5c531abc5a7",
    "bytes": 15888,
    "sha256": "d535f20a230d5d7d00bc29c1a9abb17cea360efe590789ec047be6ee29d0a10e"
  },
  {
    "path": "lib/readiness/official-truth-product-v3/monitor/queue.ts",
    "bytes": 19888,
    "blob": "a6b0215def84931cddd96248cf4dbf347ce5a621",
    "sha256": "7d3930b9f24975b6a2f42fe1a486914a201650f5b8f51dc3fd17813c74de3985"
  },
  {
    "path": "lib/readiness/official-truth-product-v3/monitor/recovery.ts",
    "bytes": 18379,
    "blob": "467904b945b53b84ab916b3f40cf67dfe47942c1",
    "sha256": "767aa7465281c7f38d8bf3b748f41d94f4204b26867b11719b77f833d259c899"
  },
  {
    "path": "lib/readiness/official-truth-product-v3/monitor/worker.ts",
    "bytes": 8739,
    "blob": "b411123af2baa3aee1fcd3bc4a836bd93897ccf6",
    "sha256": "72cc22348f3d740ad761d33f84c191de04e997a0bea368449d96ba256454b99e"
  },
  {
    "path": "lib/readiness/official-truth-product-v3/result/composition.ts",
    "blob": "ddb7b40fd32e9d3146cfde63c142dd2dbd96449e",
    "bytes": 11338,
    "sha256": "48722cf799ae8f08350f4c5ef227c85e37df8b860708ab2b210dbcdc7650a79e"
  },
  {
    "path": "lib/readiness/official-truth-product-v3/result/contract.ts",
    "blob": "ba1e67ec4a512cc85ade31c315bf69a05ddf6cc2",
    "bytes": 17006,
    "sha256": "5d4bb7bd380247f7b56a841c3e930ea84da59bcfc2cc5d71e6ee5969d63a78ea"
  },
  {
    "path": "lib/readiness/official-truth-product-v3/result/postgres.ts",
    "blob": "7a11fc86cf8553f6ec792065a8a19a201237377c",
    "bytes": 23896,
    "sha256": "80958da5e5cacfc74f88c176b9e99266354efd9f3d68464afed02edfa163da8c"
  },
  {
    "path": "lib/readiness/official-truth-product-v3/result/source-proof.ts",
    "blob": "3a333c5458986941e800425393a3d756a65281b7",
    "bytes": 23649,
    "sha256": "4fa7c6e399a46387f977d3f62a5811c1dc5f68fe9222ba97c996d5a7f495acb9"
  },
  {
    "path": "lib/readiness/official-truth-product-v3/storage/intake-contract.ts",
    "bytes": 3840,
    "blob": "0e2e4947b03f4f444691ed8177dcc3ca98a71b69",
    "sha256": "49c4c4f5c2fd0b163be4f387af47032ed8c030fd75e7bfecd875af775bf6f69b"
  },
  {
    "path": "lib/readiness/official-truth-product-v3/storage/intake-server.ts",
    "bytes": 2934,
    "blob": "0605decae43995be0fd0a5183a501067e8a03685",
    "sha256": "fe83419c0709fa753aea63d538f12720027a85a3a933c7390378883784260082"
  },
  {
    "path": "lib/readiness/official-truth-product-v3/storage/proposal-bytes.ts",
    "bytes": 3701,
    "blob": "c731f673fe35a896a40d33a9a8d78faca599942f",
    "sha256": "4208d024e54657919617ef5a392f3eae86ff0421c32e890874643748f51aae19"
  },
  {
    "path": "lib/readiness/official-truth-product-v3/storage/quarantine-codec.ts",
    "bytes": 10348,
    "blob": "f33353d1e4077effad9e7527c9a6c25a703261cf",
    "sha256": "adb16487346cea677b8c49683d0d75ef177359ac4cfaf0abb944ab1a8a76a989"
  },
  {
    "path": "lib/readiness/official-truth-product-v3/storage/quarantine-postgres.ts",
    "blob": "8082bada0dad76c657b3c7a0367e56b4d634e5ce",
    "bytes": 12562,
    "sha256": "a809ec68c0f6b125bfc9f66737c4895f16099a5162c44be220cfbf5f0234c7c6"
  },
  {
    "path": "lib/readiness/official-truth-product-v3/storage/retention-shape.ts",
    "bytes": 22054,
    "blob": "7b47357190f0d7dddc1dfca2f2c2330af6ccfb63",
    "sha256": "663867695a4a4412f8f65b384324df09b1f82aa5de2a3526dfcdb74aa99de596"
  },
  {
    "path": "lib/readiness/official-truth-product-v3/visitor/query.ts",
    "bytes": 20238,
    "blob": "9ba1fcb92775107e4c0ec99bac96312a0b9c120a",
    "sha256": "89fc7206e5bcfaf6b6aaf5152f17df0a2fbe0e79ee7045104048e4695c9d6ec6"
  },
  {
    "path": "lib/readiness/official-truth-research-request.ts",
    "bytes": 13791,
    "blob": "b91eedb8e929dcb16e8cc031609af000de447f86",
    "sha256": "988a958416d494dc8b29a098e390269650f8a78afcd222b8f288b81cc4b554ce"
  },
  {
    "path": "lib/readiness/official-truth-source-fingerprint-v2.ts",
    "bytes": 5156,
    "blob": "72d324d019625c5028be8f47763fdd0f6ffe38e5",
    "sha256": "d8c0ddd287b0cffc4e9f0a88528ecce5c02052afdc0ab59fbb67449276388eac"
  },
  {
    "path": "lib/readiness/official-truth-trusted-fact-extractor-registry.ts",
    "bytes": 51757,
    "blob": "9f407dca147f8ba41280133dd64c7198c82c10a7",
    "sha256": "a8ef77dc8f0fb25a7bcf437c586683783c6c19c0510b1f6c8d07009a470cbb62"
  },
  {
    "path": "lib/readiness/official-truth-v3-hosted-result-store-1.test.ts",
    "blob": "35539cd60085494546794297146ee4efe5c1d3e2",
    "bytes": 274,
    "sha256": "136782662ea5b601c79d6cc087560fa3c44d689b5713e8f07aa8cc64e77ebe8c"
  },
  {
    "path": "lib/readiness/official.ts",
    "bytes": 13839,
    "blob": "dbaf9738cee8583e1b29577896547d47d236a35c",
    "sha256": "0351c6d695dce1c4351ff283ce3a3ffec308a0f8947020420d30da5231298bd4"
  },
  {
    "path": "lib/readiness/regulierungs-anwendbarkeit.ts",
    "bytes": 108170,
    "blob": "cac99bc39eefa470f3269892808f76c6b76d8130",
    "sha256": "5e4d84e45f1a41223df722647ef545244ca5ed38b79e3622b4e259ed21b6994f"
  },
  {
    "path": "lib/readiness/rule-claims.ts",
    "bytes": 46056,
    "blob": "c61d06ca67d87e8c9b6435c23c8ac62965a251f6",
    "sha256": "52f9395ad21cd2331c986d4e767611a5f0454cd1bf1e08e73666525c0612ab3a"
  },
  {
    "path": "lib/readiness/source-registry.ts",
    "bytes": 9165,
    "blob": "672a316209cdeba279988e1691ce1e15e0dfb1b3",
    "sha256": "058c9a69f11c703594415f56ed77ed15bf9804de7ae53aae5fb46c05511e22bc"
  },
  {
    "path": "lib/readiness/temporal.ts",
    "bytes": 14833,
    "blob": "2b45246938196127124539302634e175a172b4b6",
    "sha256": "768d1dd731bb745b3ce3e8b40bb425a4a51b8ce7b757ae4eb5173e9c65dd38d8"
  },
  {
    "path": "lib/route/domain.ts",
    "bytes": 2711,
    "blob": "59de349e313f20a74a2fc0119f2244fd0b65a50b",
    "sha256": "6de9776bd37a3359e8aab549f80ba11c25b12fbf8722a510bfa8278fd5e07cb8"
  },
  {
    "path": "scripts/db/official-truth-atomic-version-refresh-1/test-lifetime.ts",
    "bytes": 9025,
    "blob": "b1a81a0f63fb0debaffa4db739adbb483ac1efc5",
    "sha256": "e7a6a5deb652019209fd9e4bd2f1ce71bef3c15a4988838ab5b35f147dbbee68"
  },
  {
    "path": "scripts/db/official-truth-integrated-pilot-1/local-cluster.ts",
    "bytes": 5280,
    "blob": "dc5a2583cd540b83062e8662cdb4b6af4befb376",
    "sha256": "f6d21b3fef8f0ad41a8ac3951972ea5cba0394cfe41037eba8d0258ed508aa10"
  },
  {
    "path": "scripts/db/official-truth-integrated-pilot-1/pg-wire.ts",
    "bytes": 30699,
    "blob": "78e92ebfb61ce6fd1aaa8c554d19ad157978d39c",
    "sha256": "9ad361433f7d0563ae892d4b24d0fee3acbcb8ea567d750f5f3cb4be6989da3b"
  },
  {
    "path": "scripts/db/official-truth-v3-composed-dev-1/observed-auth-profile-fixture.sql",
    "bytes": 10807,
    "blob": "4de6082b084cc24538733e7232a59778edb36a1f",
    "sha256": "e0cba309cff43eb44faf0ec88b61c3ab6bba38db7270f22004917bf248bb96a2"
  },
  {
    "path": "scripts/db/official-truth-v3-durable-jobs-1/fixtures.ts",
    "bytes": 6321,
    "blob": "5280246b707f506c5d9d83929562965faea9279c",
    "sha256": "68312bc9424dc71066b6717135f4d13bf350968618dadda143b9b7e16f0bd927"
  },
  {
    "path": "scripts/db/official-truth-v3-durable-jobs-1/native-adapter.ts",
    "bytes": 13389,
    "blob": "66e7dd443c51b7db8d90d99c8b6422d1226ff237",
    "sha256": "5c34ce52023d7840e09d004d9c577a2bd4dc78efb3171e7e7b8aff07b0cf7b57"
  },
  {
    "path": "scripts/db/official-truth-v3-hosted-durable-jobs-1/install-candidate.sql",
    "blob": "becfa6be1b8600cea2ef0cf6eb6f9481a427bbcd",
    "bytes": 442780,
    "sha256": "22b1ba34a765038eb713e395c127e8862f80738afbdd678cfe7319f9b11b9678"
  },
  {
    "path": "scripts/db/official-truth-v3-hosted-durable-jobs-1/recovery-candidate.sql",
    "blob": "bf2e49359556daf4593e338076c4a97f6465bfc5",
    "bytes": 163561,
    "sha256": "6d9aa065a77f5241049546501e63fa4a67b80c876c1b5aa1360e681aebcb7e00"
  },
  {
    "path": "scripts/db/official-truth-v3-hosted-intake-store-1/install-candidate.sql",
    "bytes": 124354,
    "blob": "faac74e6ab56072f01d941d24a8be28aa7895d94",
    "sha256": "f2a3f1b8a2845b2706d06dbef66c225c1836d9398e65682a01bf19d035018ac0"
  },
  {
    "path": "scripts/db/official-truth-v3-hosted-intake-store-1/recovery-candidate.sql",
    "bytes": 43309,
    "blob": "fc902540cea4c34783bdedbcde2be8a77a9fe672",
    "sha256": "ce7159cb345285b6f9877d36acc8d3f3b321f11852eb373163498524da3941db"
  },
  {
    "path": "scripts/db/official-truth-v3-hosted-method-authority-1/install-candidate.sql",
    "bytes": 69705,
    "blob": "9c17260c202e430e4c779e47fee0a62c047c4d87",
    "sha256": "edbaf9d56b3da115b12bf1c8cfd5c76d8bc9483f7fc1658ee648b380a16fe2c0"
  },
  {
    "path": "scripts/db/official-truth-v3-hosted-method-authority-1/recovery-candidate.sql",
    "bytes": 37227,
    "blob": "477c646b4c886f4532d1f938cdf9ce2ba95711a9",
    "sha256": "c8f6a40f72b5f36d0a0808e6fe0c7444bdb93fce3cbb6c5f580b14daeb19d13d"
  },
  {
    "path": "scripts/db/official-truth-v3-hosted-result-store-1/install-candidate.sql",
    "blob": "c412b61f5fd06f29345bdf0e6dbff0ef931d7e81",
    "bytes": 364941,
    "sha256": "87631ac49761d0e310fddb984b8bbd3d01508380d41f310f96f96ad6d3c60465"
  },
  {
    "path": "scripts/db/official-truth-v3-hosted-result-store-1/recovery-candidate.sql",
    "blob": "2ef041a1e683a1394facd0ae6514b8d91d1a3688",
    "bytes": 160989,
    "sha256": "9f577d897419f67add68b2c53fd0dcba865a0b846541cc2b1735decbfc7c0d6c"
  },
  {
    "path": "scripts/db/official-truth-v3-human-method-transport-1/install-candidate.sql",
    "bytes": 53457,
    "blob": "6c5c36009e70468e96c8ecfe188cc4109b434716",
    "sha256": "727e83dbed7f0a6b127c3003248d85acc6b920fddc44356cdfeb8f3f57a82d2c"
  },
  {
    "path": "scripts/db/official-truth-v3-human-method-transport-1/recovery-candidate.sql",
    "bytes": 82633,
    "blob": "e65d8438a798a33ff5ea193b168e5b1b4710618a",
    "sha256": "c81bc8f70b55353f6f5ed974cf387c07cf807a0ccbadbcb0fcaa8374606ea459"
  },
  {
    "path": "scripts/db/official-truth-v3-method-authority-1/auth-fixture.ts",
    "bytes": 6536,
    "blob": "eaa35fd57eee7b7c86de91dd77e96ef263f61d8b",
    "sha256": "cb54b668c206c5b7d26f423ca679701070bb39a7fbe43771a9c04ad232322a58"
  },
  {
    "path": "scripts/db/official-truth-v3-method-authority-1/native-adapter.ts",
    "bytes": 13880,
    "blob": "30a4731214a6bc7e4508ee0183027903d550d51d",
    "sha256": "9175bc8a52b79dc40783467949f6fb8f5f81d2eb90894af89ddf3bb77d321dcc"
  },
  {
    "path": "scripts/db/official-truth-v3-private-owner-guards-1/install-candidate.sql",
    "bytes": 10945,
    "blob": "9a8144e27405f93b9c0e5d003923efe8883bb4b4",
    "sha256": "3e21495ff40f66337b004fadc98599cd336c19c31bb4f6e4f9013c2c01f02bd2"
  },
  {
    "path": "scripts/db/profile-authority-integrity-1/install-candidate.sql",
    "bytes": 36608,
    "blob": "1b7e36b8100e5425a833d7c44189ab6632611308",
    "sha256": "2dda7f1bd523e5046bcc72f352a876133d1c7ed01994eb7687c6d1c9d3218774"
  },
  {
    "path": "scripts/db/profile-authority-integrity-1/observed-baseline.json",
    "bytes": 38527,
    "blob": "bd32f072ae7d8edaee67297a26adab9c3a886d73",
    "sha256": "0e586796b8cdd4c420992e7c6e6c0978fa266d49915d9dc47c2f44425a0d6fa8"
  },
  {
    "path": "types/trips.ts",
    "bytes": 17666,
    "blob": "15b8506a5c005bb7a5afcc466bc26881e3083d6d",
    "sha256": "cdf7a10fa6060cc732e923c7e7239dafe58f26e1e79cd057e62ea14ebefcf3d4"
  }
] as const

function pinnedFiles(): ReadonlyMap<string, string> {
  const files = new Map<string, string>()
  for (const pin of PINS) {
    assert.equal(files.has(pin.path), false, 'unique full-file prerequisite pin')
    const bytes = readFileSync(new URL(pin.path, ROOT))
    assert.equal(bytes.length, pin.bytes, pin.path + ' complete byte count')
    assert.equal(createHash('sha256').update(bytes).digest('hex'), pin.sha256, pin.path + ' complete SHA256')
    assert.equal(createHash('sha1').update(Buffer.from('blob ' + bytes.length + '\0')).update(bytes).digest('hex'), pin.blob,
      pin.path + ' immutable Git blob identity')
    const text = bytes.toString('utf8')
    assert.deepEqual(Buffer.from(text, 'utf8'), bytes, pin.path + ' exact UTF8')
    files.set(pin.path, text)
  }
  return files
}
function file(files: ReadonlyMap<string, string>, path: string): string {
  const value = files.get(path); assert.ok(typeof value === 'string', 'missing exact prerequisite ' + path); return value
}
const PAI_CATALOG_SQL = "SELECT pg_catalog.jsonb_build_object(\n  'relation',(SELECT pg_catalog.jsonb_build_object(\n    'owner',pg_catalog.pg_get_userbyid(c.relowner),'rls',c.relrowsecurity,'force_rls',c.relforcerowsecurity,'kind',c.relkind,\n    'acl',(SELECT pg_catalog.jsonb_agg(a::text ORDER BY a::text) FROM pg_catalog.unnest(COALESCE(c.relacl,pg_catalog.acldefault('r',c.relowner))) a))\n    FROM pg_catalog.pg_class c WHERE c.oid='public.profiles'::pg_catalog.regclass),\n  'columns',COALESCE((SELECT pg_catalog.jsonb_agg(pg_catalog.jsonb_build_object(\n    'name',a.attname,'type',pg_catalog.format_type(a.atttypid,a.atttypmod),'number',a.attnum,\n    'default',pg_catalog.pg_get_expr(d.adbin,d.adrelid),'raw_acl',a.attacl,\n    'identity',a.attidentity,'not_null',a.attnotnull,\n    'collation',CASE WHEN a.attcollation=0 THEN NULL ELSE a.attcollation::pg_catalog.regcollation::text END,\n    'generated',a.attgenerated) ORDER BY a.attnum)\n    FROM pg_catalog.pg_attribute a LEFT JOIN pg_catalog.pg_attrdef d ON d.adrelid=a.attrelid AND d.adnum=a.attnum\n    WHERE a.attrelid='public.profiles'::pg_catalog.regclass AND a.attnum>0 AND NOT a.attisdropped),'[]'::jsonb),\n  'constraints',COALESCE((SELECT pg_catalog.jsonb_agg(pg_catalog.jsonb_build_object(\n    'name',c.conname,'kind',c.contype,'validated',c.convalidated,'definition',pg_catalog.pg_get_constraintdef(c.oid,true)) ORDER BY c.conname)\n    FROM pg_catalog.pg_constraint c WHERE c.conrelid='public.profiles'::pg_catalog.regclass),'[]'::jsonb),\n  'policies',COALESCE((SELECT pg_catalog.jsonb_agg(pg_catalog.jsonb_build_object(\n    'name',p.polname,'roles',(SELECT pg_catalog.jsonb_agg(CASE WHEN r=0 THEN 'PUBLIC' ELSE pg_catalog.pg_get_userbyid(r) END ORDER BY r) FROM pg_catalog.unnest(p.polroles) r),\n    'using',pg_catalog.pg_get_expr(p.polqual,p.polrelid),'command',p.polcmd,'permissive',p.polpermissive,\n    'with_check',pg_catalog.pg_get_expr(p.polwithcheck,p.polrelid)) ORDER BY p.polname)\n    FROM pg_catalog.pg_policy p WHERE p.polrelid='public.profiles'::pg_catalog.regclass),'[]'::jsonb),\n  'functions',COALESCE((SELECT pg_catalog.jsonb_agg(pg_catalog.jsonb_build_object(\n    'set',p.proretset,'kind',p.prokind,'name',p.proname,'owner',pg_catalog.pg_get_userbyid(p.proowner),\n    'config',p.proconfig,'strict',p.proisstrict,\n    'raw_acl',(SELECT pg_catalog.jsonb_agg(a::text ORDER BY a::text) FROM pg_catalog.unnest(COALESCE(p.proacl,pg_catalog.acldefault('f',p.proowner))) a),\n    'returns',pg_catalog.pg_get_function_result(p.oid),'defaults',p.pronargdefaults,'language',l.lanname,'parallel',p.proparallel,\n    'arguments',pg_catalog.pg_get_function_identity_arguments(p.oid),'leakproof',p.proleakproof,'volatility',p.provolatile,\n    'body_sha256',pg_catalog.encode(pg_catalog.sha256(pg_catalog.convert_to(p.prosrc,'UTF8')),'hex'),\n    'security_definer',p.prosecdef,'definition',pg_catalog.pg_get_functiondef(p.oid)) ORDER BY p.proname,p.oid)\n    FROM pg_catalog.pg_proc p JOIN pg_catalog.pg_namespace n ON n.oid=p.pronamespace JOIN pg_catalog.pg_language l ON l.oid=p.prolang\n    WHERE n.nspname='public' AND p.proname IN ('aktuelle_rolle','aktuelles_admin_aal2','darf_konten_verwalten',\n      'hat_rolle_mindestens','profil_kerndaten_aus_auth','profil_rollenwechsel_pruefen','rollenrang')),'[]'::jsonb),\n  'triggers',COALESCE((SELECT pg_catalog.jsonb_agg(pg_catalog.jsonb_build_object(\n    'name',t.tgname,'type',t.tgtype,'enabled',t.tgenabled,'attributes',t.tgattr::text,\n    'definition',pg_catalog.pg_get_triggerdef(t.oid,true),'function_name',p.proname) ORDER BY t.tgname)\n    FROM pg_catalog.pg_trigger t JOIN pg_catalog.pg_proc p ON p.oid=t.tgfoid\n    WHERE t.tgrelid='public.profiles'::pg_catalog.regclass AND NOT t.tgisinternal\n      AND t.tgname<>'profiles_autoritaet_integritaet_v1'),'[]'::jsonb),\n  'incoming_profile_foreign_keys',COALESCE((SELECT pg_catalog.jsonb_agg(pg_catalog.jsonb_build_object(\n    'oid',c.oid,'name',c.conname,'relation_schema',n.nspname,'relation',r.relname,\n    'validated',c.convalidated,'deferrable',c.condeferrable,'deferred',c.condeferred,\n    'definition',pg_catalog.pg_get_constraintdef(c.oid,true)) ORDER BY n.nspname,r.relname,c.conname)\n    FROM pg_catalog.pg_constraint c JOIN pg_catalog.pg_class r ON r.oid=c.conrelid JOIN pg_catalog.pg_namespace n ON n.oid=r.relnamespace\n    WHERE c.contype='f' AND c.confrelid='public.profiles'::pg_catalog.regclass),'[]'::jsonb)\n) AS value"
const PAI_PRESERVED_SQL = "SELECT pg_catalog.jsonb_build_object(\n 'profile_relation',(SELECT pg_catalog.to_jsonb(c) FROM pg_catalog.pg_class c WHERE c.oid='public.profiles'::pg_catalog.regclass),\n 'profile_attributes',(SELECT pg_catalog.jsonb_agg(pg_catalog.to_jsonb(a) ORDER BY a.attnum) FROM pg_catalog.pg_attribute a WHERE a.attrelid='public.profiles'::pg_catalog.regclass AND a.attnum>0),\n 'profile_defaults',(SELECT pg_catalog.jsonb_agg(pg_catalog.to_jsonb(d) ORDER BY d.adnum) FROM pg_catalog.pg_attrdef d WHERE d.adrelid='public.profiles'::pg_catalog.regclass),\n 'profile_constraints',(SELECT pg_catalog.jsonb_agg(pg_catalog.to_jsonb(c) ORDER BY c.oid) FROM pg_catalog.pg_constraint c WHERE c.conrelid='public.profiles'::pg_catalog.regclass OR c.confrelid='public.profiles'::pg_catalog.regclass),\n 'profile_indexes',(SELECT pg_catalog.jsonb_agg(pg_catalog.jsonb_build_object('index',pg_catalog.to_jsonb(i),'relation',pg_catalog.to_jsonb(c),'definition',pg_catalog.pg_get_indexdef(i.indexrelid)) ORDER BY i.indexrelid)\n   FROM pg_catalog.pg_index i JOIN pg_catalog.pg_class c ON c.oid=i.indexrelid WHERE i.indrelid='public.profiles'::pg_catalog.regclass),\n 'profile_policies',(SELECT pg_catalog.jsonb_agg(pg_catalog.to_jsonb(p) ORDER BY p.oid) FROM pg_catalog.pg_policy p WHERE p.polrelid='public.profiles'::pg_catalog.regclass),\n 'old_triggers',(SELECT pg_catalog.jsonb_agg(pg_catalog.to_jsonb(t) ORDER BY t.oid) FROM pg_catalog.pg_trigger t\n   WHERE t.tgrelid='public.profiles'::pg_catalog.regclass AND t.tgname<>'profiles_autoritaet_integritaet_v1'),\n 'old_functions',(SELECT pg_catalog.jsonb_agg(pg_catalog.to_jsonb(p) ORDER BY p.oid) FROM pg_catalog.pg_proc p JOIN pg_catalog.pg_namespace n ON n.oid=p.pronamespace\n   WHERE n.nspname='public' AND p.proname IN ('aktuelle_rolle','aktuelles_admin_aal2','darf_konten_verwalten','hat_rolle_mindestens','profil_kerndaten_aus_auth','profil_rollenwechsel_pruefen','rollenrang')),\n 'public_namespace',(SELECT pg_catalog.to_jsonb(n) FROM pg_catalog.pg_namespace n WHERE n.nspname='public'),\n 'creator_defaults',(SELECT pg_catalog.jsonb_agg(pg_catalog.to_jsonb(d) ORDER BY d.oid) FROM pg_catalog.pg_default_acl d\n   WHERE d.defaclrole='postgres'::pg_catalog.regrole AND (d.defaclnamespace=0 OR d.defaclnamespace='public'::pg_catalog.regnamespace)),\n 'principals',(SELECT pg_catalog.jsonb_agg(pg_catalog.jsonb_build_object('oid',r.oid,'name',r.rolname,'super',r.rolsuper,\n   'inherit',r.rolinherit,'create_role',r.rolcreaterole,'create_db',r.rolcreatedb,'login',r.rolcanlogin,\n   'replication',r.rolreplication,'bypass',r.rolbypassrls,'connection_limit',r.rolconnlimit) ORDER BY r.oid)\n   FROM pg_catalog.pg_roles r WHERE r.rolname IN ('postgres','authenticated','anon','authenticator','service_role','pg_database_owner','supabase_auth_admin')),\n 'principal_memberships',(SELECT pg_catalog.jsonb_agg(pg_catalog.to_jsonb(m) ORDER BY m.oid) FROM pg_catalog.pg_auth_members m\n   WHERE m.roleid IN (SELECT oid FROM pg_catalog.pg_roles WHERE rolname IN ('postgres','authenticated','anon','authenticator','service_role','pg_database_owner','supabase_auth_admin'))\n      OR m.member IN (SELECT oid FROM pg_catalog.pg_roles WHERE rolname IN ('postgres','authenticated','anon','authenticator','service_role','pg_database_owner','supabase_auth_admin')))\n) AS value"
const PAI_NEW_OBJECT_SQL = "SELECT p.oid::text AS function_oid,p.proowner::regrole::text AS owner,p.prosecdef::text,p.proconfig::text,p.proacl::text,pg_catalog.encode(pg_catalog.sha256(pg_catalog.convert_to(p.prosrc,'UTF8')),'hex') AS body_sha256,t.oid::text AS trigger_oid,t.tgtype::text,t.tgenabled,t.tgargs::text,t.tgattr::text FROM pg_catalog.pg_proc p JOIN pg_catalog.pg_namespace n ON n.oid=p.pronamespace LEFT JOIN pg_catalog.pg_trigger t ON t.tgfoid=p.oid AND t.tgrelid='public.profiles'::regclass WHERE n.nspname='public' AND p.proname='profil_autoritaet_integritaet_pruefen_v1' ORDER BY p.oid,t.oid"
const HM04_IDENTITY_SQL = "WITH scope_schemas AS (\n  SELECT n.oid,n.nspname FROM pg_catalog.pg_namespace n WHERE n.nspname IN ('official_v3_jobs_private','official_v3_jobs_api')\n), scope_tables AS (\n  SELECT c.oid,c.reltoastrelid FROM pg_catalog.pg_class c JOIN scope_schemas n ON n.oid=c.relnamespace WHERE c.relkind='r'\n), scope_classes AS (\n  SELECT c.oid FROM pg_catalog.pg_class c JOIN scope_schemas n ON n.oid=c.relnamespace\n  UNION SELECT t.reltoastrelid FROM scope_tables t WHERE t.reltoastrelid<>0\n  UNION SELECT i.indexrelid FROM pg_catalog.pg_index i JOIN scope_tables t ON i.indrelid=t.reltoastrelid WHERE t.reltoastrelid<>0\n), scope_objects AS (\n  SELECT 'pg_catalog.pg_namespace'::pg_catalog.regclass::oid AS classid,n.oid AS objid FROM scope_schemas n\n  UNION SELECT 'pg_catalog.pg_class'::pg_catalog.regclass,c.oid FROM scope_classes c\n  UNION SELECT 'pg_catalog.pg_type'::pg_catalog.regclass,t.oid FROM pg_catalog.pg_type t JOIN scope_schemas n ON n.oid=t.typnamespace\n  UNION SELECT 'pg_catalog.pg_proc'::pg_catalog.regclass,p.oid FROM pg_catalog.pg_proc p JOIN scope_schemas n ON n.oid=p.pronamespace\n  UNION SELECT 'pg_catalog.pg_constraint'::pg_catalog.regclass,c.oid FROM pg_catalog.pg_constraint c JOIN scope_tables t ON t.oid=c.conrelid\n  UNION SELECT 'pg_catalog.pg_trigger'::pg_catalog.regclass,g.oid FROM pg_catalog.pg_trigger g JOIN scope_tables t ON t.oid=g.tgrelid\n  UNION SELECT 'pg_catalog.pg_policy'::pg_catalog.regclass,p.oid FROM pg_catalog.pg_policy p JOIN scope_tables t ON t.oid=p.polrelid\n  UNION SELECT 'pg_catalog.pg_attrdef'::pg_catalog.regclass,d.oid FROM pg_catalog.pg_attrdef d JOIN scope_tables t ON t.oid=d.adrelid\n)\nSELECT pg_catalog.jsonb_build_object(\n  'package','HM04-v1-A1',\n  'original_jobs_sha256','0d2210d84c02aacbeef1c8e14b38e7be6c2e3e8c387057fd97666fb00c71bba4',\n  'database',pg_catalog.jsonb_build_object('name',d.datname,'oid',d.oid),\n  'creator','postgres'::pg_catalog.regrole::oid,\n  'roles',(SELECT pg_catalog.jsonb_agg(pg_catalog.jsonb_build_object('name',r.rolname,'oid',r.oid) ORDER BY r.rolname)\n    FROM pg_catalog.pg_roles r WHERE r.rolname IN ('ot_v3_jobs_owner','ot_v3_jobs_caller','ot_v3_intake_owner')),\n  'objects',(SELECT pg_catalog.jsonb_agg(pg_catalog.jsonb_build_object('catalog',o.classid::pg_catalog.regclass::text,\n    'identity',pg_catalog.pg_describe_object(o.classid,o.objid,0),'oid',o.objid) ORDER BY o.classid,o.objid) FROM scope_objects o)\n) AS hm04_identity FROM pg_catalog.pg_database d WHERE d.datname=current_database()"
const HS1_IDENTITY_SQL = "WITH scope_schemas AS (\n  SELECT n.oid,n.nspname FROM pg_catalog.pg_namespace n\n  WHERE n.nspname IN ('official_v3_intake_private','official_v3_intake_api')\n), scope_tables AS (\n  SELECT c.oid,c.reltoastrelid FROM pg_catalog.pg_class c JOIN scope_schemas n ON n.oid=c.relnamespace WHERE c.relkind='r'\n), scope_classes AS (\n  SELECT c.oid FROM pg_catalog.pg_class c JOIN scope_schemas n ON n.oid=c.relnamespace\n  UNION SELECT t.reltoastrelid FROM scope_tables t WHERE t.reltoastrelid<>0\n  UNION SELECT i.indexrelid FROM pg_catalog.pg_index i JOIN scope_tables t ON i.indrelid=t.reltoastrelid WHERE t.reltoastrelid<>0\n), scope_objects AS (\n  SELECT 'pg_catalog.pg_namespace'::pg_catalog.regclass::oid AS classid,n.oid AS objid FROM scope_schemas n\n  UNION SELECT 'pg_catalog.pg_class'::pg_catalog.regclass,c.oid FROM scope_classes c\n  UNION SELECT 'pg_catalog.pg_type'::pg_catalog.regclass,t.oid FROM pg_catalog.pg_type t JOIN scope_schemas n ON n.oid=t.typnamespace\n  UNION SELECT 'pg_catalog.pg_proc'::pg_catalog.regclass,p.oid FROM pg_catalog.pg_proc p JOIN scope_schemas n ON n.oid=p.pronamespace\n  UNION SELECT 'pg_catalog.pg_constraint'::pg_catalog.regclass,c.oid FROM pg_catalog.pg_constraint c JOIN scope_tables t ON t.oid=c.conrelid\n  UNION SELECT 'pg_catalog.pg_trigger'::pg_catalog.regclass,g.oid FROM pg_catalog.pg_trigger g JOIN scope_tables t ON t.oid=g.tgrelid\n  UNION SELECT 'pg_catalog.pg_policy'::pg_catalog.regclass,p.oid FROM pg_catalog.pg_policy p JOIN scope_tables t ON t.oid=p.polrelid\n  UNION SELECT 'pg_catalog.pg_attrdef'::pg_catalog.regclass,d.oid FROM pg_catalog.pg_attrdef d JOIN scope_tables t ON t.oid=d.adrelid\n)\nSELECT pg_catalog.jsonb_build_object(\n  'package','HS1-v1',\n  'database',pg_catalog.jsonb_build_object('name',d.datname,'oid',d.oid),\n  'roles',(SELECT pg_catalog.jsonb_agg(pg_catalog.jsonb_build_object('name',r.rolname,'oid',r.oid) ORDER BY r.rolname)\n    FROM pg_catalog.pg_roles r WHERE r.rolname IN ('ot_v3_intake_owner','ot_v3_intake_caller')),\n  'objects',(SELECT pg_catalog.jsonb_agg(pg_catalog.jsonb_build_object('catalog',o.classid::pg_catalog.regclass::text,\n      'identity',pg_catalog.pg_describe_object(o.classid,o.objid,0),'oid',o.objid) ORDER BY o.classid,o.objid)\n    FROM scope_objects o)\n) AS hs1_identity\nFROM pg_catalog.pg_database d WHERE d.datname=current_database()"
const GUARD_SHA256 = 'b513eca8cc5d7b3981d9b9eb1473428e628410dcb0f4b718290d4cc314756a8d'
const IDENTITY_SQL = `SELECT pg_catalog.pg_backend_pid()::text AS pid,a.backend_start::text AS birth,
session_user::text AS login,current_user::text AS role,session_user::pg_catalog.regrole::oid::text AS login_oid
FROM pg_catalog.pg_stat_activity a WHERE a.pid=pg_catalog.pg_backend_pid()`
type Identity = Readonly<{ pid: string; birth: string; login: string; role: string; login_oid: string }>
type Connected = Readonly<{ connection: LocalPgConnection; identity: Identity }>
type Native = Awaited<ReturnType<typeof createM04NativeExecutors>>
type Method = Awaited<ReturnType<typeof createMa1NativeExecutor>>
type TechnicalIdentity = Readonly<{ login: string; role: string; loginOid: string; creatorOid: string; automaticOid: string; callerOid?: string; runtimeOid?: string }>
type Receipt = Readonly<{ status: string; operationId: string; action: string; command: unknown; actorId: string; recordedAt: string; before: unknown; after: unknown }>
const text = (values: readonly (string | number | null)[]) => values.map(v => pgText(v === null ? '' : String(v)))
const uid = (n: number) => n.toString(16).padStart(8, '0') + '-1111-4111-8111-' + n.toString(16).padStart(12, '0')
const operationId = (n: number) => 'maop1_' + n.toString(16).padStart(32, '0')
function value(rows: PgRows, column = 'value'): unknown {
  assert.equal(rows.length, 1); const v = rows[0]?.[column]; assert.equal(typeof v, 'string'); return JSON.parse(v!)
}
function scalar(rows: PgRows, column: string): string {
  assert.equal(rows.length, 1); const v = rows[0]?.[column]; assert.equal(typeof v, 'string'); return v!
}
const stateError = (code: string) => (error: unknown) => error instanceof LocalPgError && error.code === code
async function connect(lifetime: OwnedTestLifetime, cluster: LocalProofCluster, login = cluster.user,
  expectedLoginOid?: string, role?: string): Promise<Connected> {
  lifetime.check()
  const connection = await LocalPgConnection.connect(cluster, login)
  // Fresh actual identity is captured before any mutation, claims or SET ROLE.
  const rows = await connection.query(IDENTITY_SQL)
  assert.equal(rows.length, 1)
  const row = rows[0]!
  assert.deepEqual(Object.keys(row).sort(), ['birth', 'login', 'login_oid', 'pid', 'role'])
  for (const key of ['pid', 'login_oid'] as const) assert.match(row[key]!, /^[1-9][0-9]{0,9}$/)
  assert.ok(row.birth && row.birth.length >= 19 && row.birth.length <= 64)
  assert.equal(row.login, login); assert.equal(row.role, login)
  if (expectedLoginOid !== undefined) assert.equal(row.login_oid, expectedLoginOid, 'original Creator-issued LOGIN identity')
  const identity: Identity = Object.freeze({ pid: row.pid!, birth: row.birth!, login, role: login, login_oid: row.login_oid! })
  if (role !== undefined) {
    assert.ok(['authenticated', 'ot_v3_jobs_caller', 'ot_v3_intake_caller', 'ot_v3_method_reader'].includes(role))
    await connection.query('SET ROLE ' + role)
    assert.deepEqual(await connection.query('SELECT session_user::text AS login,current_user::text AS role'),
      [{ login, role }])
  }
  return { connection, identity }
}
async function setClaims(connection: LocalPgConnection, person: 1 | 2 | 3): Promise<void> {
  const claims = { sub: uid(person), session_id: uid(person + 200), role: 'authenticated',
    aal: person === 3 ? 'aal1' : 'aal2', exp: Math.floor(Date.now() / 1000) + 300 }
  // Clear the alternative uid/jwt channels too; unique result columns preserve
  // the unchanged original wire parser's closed column-name contract.
  await connection.query(`SELECT pg_catalog.set_config('request.jwt.claims',$1::text,false) AS claims,
    pg_catalog.set_config('request.jwt.claim','',false) AS legacy_claim,
    pg_catalog.set_config('request.jwt.claim.sub','',false) AS legacy_sub`, text([JSON.stringify(claims)]))
  assert.deepEqual(await connection.query('SELECT auth.uid()::text AS actor'), [{ actor: uid(person) }])
  const observed = value(await connection.query('SELECT auth.jwt() AS value'))
  assert.deepEqual(observed, claims)
}


// Logical object identity and authority metadata; volatile storage statistics
// (relpages/reltuples/freeze horizons) are not privilege or function identity.
// Every selected object OID, definition, owner, ACL, role/edge/default, dependency
// and description is retained. DML histories have a separate exact snapshot.
const CATALOG_SQL = `WITH ns AS (
 SELECT oid FROM pg_catalog.pg_namespace WHERE nspname='public' OR nspname='auth' OR nspname='jetnity_ot_auth'
   OR nspname IN ('official_v3_method_private','official_v3_method_api',
     'official_v3_intake_private','official_v3_intake_api','official_v3_jobs_private','official_v3_jobs_api',
     'official_v3_result_private','official_v3_result_api')
), rel AS (
 SELECT oid FROM pg_catalog.pg_class WHERE relnamespace IN (SELECT oid FROM ns)
 UNION SELECT reltoastrelid FROM pg_catalog.pg_class WHERE relnamespace IN (SELECT oid FROM ns) AND reltoastrelid<>0
 UNION SELECT i.indexrelid FROM pg_catalog.pg_index i WHERE i.indrelid IN (
   SELECT reltoastrelid FROM pg_catalog.pg_class WHERE relnamespace IN (SELECT oid FROM ns) AND reltoastrelid<>0)
), objects AS (
 SELECT 'pg_catalog.pg_namespace'::pg_catalog.regclass::oid AS classid,oid AS objid FROM ns
 UNION SELECT 'pg_catalog.pg_class'::pg_catalog.regclass,oid FROM rel
 UNION SELECT 'pg_catalog.pg_proc'::pg_catalog.regclass,oid FROM pg_catalog.pg_proc WHERE pronamespace IN (SELECT oid FROM ns)
 UNION SELECT 'pg_catalog.pg_type'::pg_catalog.regclass,oid FROM pg_catalog.pg_type WHERE typnamespace IN (SELECT oid FROM ns)
 UNION SELECT 'pg_catalog.pg_constraint'::pg_catalog.regclass,oid FROM pg_catalog.pg_constraint WHERE conrelid IN (SELECT oid FROM rel) OR connamespace IN (SELECT oid FROM ns)
 UNION SELECT 'pg_catalog.pg_trigger'::pg_catalog.regclass,oid FROM pg_catalog.pg_trigger WHERE tgrelid IN (SELECT oid FROM rel)
 UNION SELECT 'pg_catalog.pg_policy'::pg_catalog.regclass,oid FROM pg_catalog.pg_policy WHERE polrelid IN (SELECT oid FROM rel)
 UNION SELECT 'pg_catalog.pg_attrdef'::pg_catalog.regclass,oid FROM pg_catalog.pg_attrdef WHERE adrelid IN (SELECT oid FROM rel)
 UNION SELECT 'pg_catalog.pg_default_acl'::pg_catalog.regclass,oid FROM pg_catalog.pg_default_acl
), db AS (SELECT oid FROM pg_catalog.pg_database WHERE datname=current_database())
SELECT pg_catalog.jsonb_build_object(
 'namespaces',(SELECT COALESCE(jsonb_agg(to_jsonb(n) ORDER BY n.oid),'[]'::jsonb) FROM pg_catalog.pg_namespace n WHERE n.oid IN (SELECT oid FROM ns)),
 'classes',(SELECT COALESCE(jsonb_agg(jsonb_build_object('oid',c.oid,'name',c.relname,'namespace',c.relnamespace,'type',c.reltype,
   'owner',c.relowner,'am',c.relam,'tablespace',c.reltablespace,'toast',c.reltoastrelid,'hasindex',c.relhasindex,
   'shared',c.relisshared,'persistence',c.relpersistence,'kind',c.relkind,'natts',c.relnatts,'checks',c.relchecks,
   'rules',c.relhasrules,'triggers',c.relhastriggers,'subclass',c.relhassubclass,'rls',c.relrowsecurity,'force_rls',c.relforcerowsecurity,
   'populated',c.relispopulated,'replica_identity',c.relreplident,'partition',c.relispartition,
   'acl',c.relacl,'options',c.reloptions,'partbound',c.relpartbound) ORDER BY c.oid),'[]'::jsonb)
   FROM pg_catalog.pg_class c WHERE c.oid IN (SELECT oid FROM rel)),
 'attributes',(SELECT COALESCE(jsonb_agg(to_jsonb(a) ORDER BY a.attrelid,a.attnum),'[]'::jsonb) FROM pg_catalog.pg_attribute a WHERE a.attrelid IN (SELECT oid FROM rel)),
 'defaults',(SELECT COALESCE(jsonb_agg(to_jsonb(d) ORDER BY d.oid),'[]'::jsonb) FROM pg_catalog.pg_attrdef d WHERE d.adrelid IN (SELECT oid FROM rel)),
 'constraints',(SELECT COALESCE(jsonb_agg(to_jsonb(c) ORDER BY c.oid),'[]'::jsonb) FROM pg_catalog.pg_constraint c WHERE c.conrelid IN (SELECT oid FROM rel) OR c.connamespace IN (SELECT oid FROM ns)),
 'indexes',(SELECT COALESCE(jsonb_agg(to_jsonb(i) ORDER BY i.indexrelid),'[]'::jsonb) FROM pg_catalog.pg_index i WHERE i.indrelid IN (SELECT oid FROM rel)),
 'policies',(SELECT COALESCE(jsonb_agg(to_jsonb(p) ORDER BY p.oid),'[]'::jsonb) FROM pg_catalog.pg_policy p WHERE p.polrelid IN (SELECT oid FROM rel)),
 'triggers',(SELECT COALESCE(jsonb_agg(to_jsonb(g) ORDER BY g.oid),'[]'::jsonb) FROM pg_catalog.pg_trigger g WHERE g.tgrelid IN (SELECT oid FROM rel)),
 'functions',(SELECT COALESCE(jsonb_agg((to_jsonb(p)-'prosrc'-'prosqlbody')||jsonb_build_object(
   'body_sha256',encode(sha256(convert_to(p.prosrc,'UTF8')),'hex'),
   'parsed_body_sha256',CASE WHEN p.prosqlbody IS NULL THEN NULL ELSE encode(sha256(convert_to(p.prosqlbody::text,'UTF8')),'hex') END,
   'definition_sha256',encode(sha256(convert_to(pg_get_functiondef(p.oid),'UTF8')),'hex')) ORDER BY p.oid),'[]'::jsonb)
   FROM pg_catalog.pg_proc p WHERE p.pronamespace IN (SELECT oid FROM ns)),
 'types',(SELECT COALESCE(jsonb_agg(to_jsonb(t) ORDER BY t.oid),'[]'::jsonb) FROM pg_catalog.pg_type t WHERE t.typnamespace IN (SELECT oid FROM ns)),
 'enums',(SELECT COALESCE(jsonb_agg(to_jsonb(e) ORDER BY e.oid),'[]'::jsonb) FROM pg_catalog.pg_enum e WHERE e.enumtypid IN (SELECT oid FROM pg_catalog.pg_type WHERE typnamespace IN (SELECT oid FROM ns))),
 'roles',(SELECT jsonb_agg(to_jsonb(r) ORDER BY r.oid) FROM pg_catalog.pg_roles r),
 'memberships',(SELECT COALESCE(jsonb_agg(to_jsonb(m) ORDER BY m.oid),'[]'::jsonb) FROM pg_catalog.pg_auth_members m),
 'role_settings',(SELECT COALESCE(jsonb_agg(to_jsonb(s) ORDER BY s.setdatabase,s.setrole),'[]'::jsonb) FROM pg_catalog.pg_db_role_setting s),
 'default_acls',(SELECT COALESCE(jsonb_agg(to_jsonb(a) ORDER BY a.oid),'[]'::jsonb) FROM pg_catalog.pg_default_acl a),
 'database',(SELECT to_jsonb(d)-'datfrozenxid'-'datminmxid'
   FROM pg_catalog.pg_database d WHERE d.oid IN (SELECT oid FROM db)),
 'dependencies',(SELECT COALESCE(jsonb_agg(to_jsonb(d) ORDER BY d.classid,d.objid,d.objsubid,d.refclassid,d.refobjid,d.refobjsubid,d.deptype),'[]'::jsonb)
   FROM pg_catalog.pg_depend d WHERE EXISTS(SELECT 1 FROM objects o WHERE (d.classid=o.classid AND d.objid=o.objid) OR (d.refclassid=o.classid AND d.refobjid=o.objid))),
 'shared_dependencies',(SELECT COALESCE(jsonb_agg(to_jsonb(d) ORDER BY d.dbid,d.classid,d.objid,d.objsubid,d.refclassid,d.refobjid,d.deptype),'[]'::jsonb)
   FROM pg_catalog.pg_shdepend d WHERE d.dbid IN (SELECT oid FROM db)),
 'descriptions',(SELECT COALESCE(jsonb_agg(to_jsonb(d) ORDER BY d.classoid,d.objoid,d.objsubid),'[]'::jsonb)
   FROM pg_catalog.pg_description d WHERE EXISTS(SELECT 1 FROM objects o WHERE d.classoid=o.classid AND d.objoid=o.objid))
) AS value`
const PROFILE_ROWS_SQL = 'SELECT id::text,user_id::text,role,created_at::text,avatar_url,email,status,last_seen_at::text,display_name FROM public.profiles ORDER BY user_id'
const AUTH_ROWS_SQL = `SELECT jsonb_build_object(
 'users',(SELECT jsonb_agg(to_jsonb(u) ORDER BY u.id) FROM auth.users u),
 'sessions',(SELECT jsonb_agg(to_jsonb(s) ORDER BY s.id) FROM auth.sessions s)) AS value`
const METHOD_HISTORY_SQL = `SELECT jsonb_build_object(
 'revisions',(SELECT COALESCE(jsonb_agg(to_jsonb(t) ORDER BY t.method_id,t.revision),'[]'::jsonb) FROM official_v3_method_private.revisions_v1 t),
 'heads',(SELECT COALESCE(jsonb_agg(to_jsonb(t) ORDER BY t.method_id),'[]'::jsonb) FROM official_v3_method_private.heads_v1 t),
 'operations',(SELECT COALESCE(jsonb_agg(to_jsonb(t) ORDER BY t.operation_id),'[]'::jsonb) FROM official_v3_method_private.operations_v1 t)
) AS value`
const EFFECT_HISTORY_SQL = `SELECT jsonb_build_object(
 'intake_operations',(SELECT COALESCE(jsonb_agg(to_jsonb(t) ORDER BY t.operation_id),'[]'::jsonb) FROM official_v3_intake_private.operations_v1 t),
 'intake_reservations',(SELECT COALESCE(jsonb_agg(to_jsonb(t) ORDER BY to_jsonb(t)::text),'[]'::jsonb) FROM official_v3_intake_private.reservations_v1 t),
 'intake_completions',(SELECT COALESCE(jsonb_agg(to_jsonb(t) ORDER BY to_jsonb(t)::text),'[]'::jsonb) FROM official_v3_intake_private.completions_v1 t),
 'occupied_slots',(SELECT COALESCE(jsonb_agg(to_jsonb(t) ORDER BY t.slot_id),'[]'::jsonb) FROM official_v3_jobs_private.slots_v1 t WHERE t.job_key IS NOT NULL),
 'subjects',(SELECT COALESCE(jsonb_agg(to_jsonb(t) ORDER BY t.job_key),'[]'::jsonb) FROM official_v3_jobs_private.subjects_v1 t),
 'queue_operations',(SELECT COALESCE(jsonb_agg(to_jsonb(t) ORDER BY to_jsonb(t)::text),'[]'::jsonb) FROM official_v3_jobs_private.queue_operations_v1 t),
 'execution_starts',(SELECT COALESCE(jsonb_agg(to_jsonb(t) ORDER BY to_jsonb(t)::text),'[]'::jsonb) FROM official_v3_jobs_private.execution_starts_v1 t),
 'execution_results',(SELECT COALESCE(jsonb_agg(to_jsonb(t) ORDER BY to_jsonb(t)::text),'[]'::jsonb) FROM official_v3_jobs_private.execution_results_v1 t),
 'execution_dispositions',(SELECT COALESCE(jsonb_agg(to_jsonb(t) ORDER BY to_jsonb(t)::text),'[]'::jsonb) FROM official_v3_jobs_private.execution_dispositions_v1 t)
) AS value`
const FINGERPRINT_SQL = 'SELECT COALESCE(jsonb_agg(to_jsonb(b) ORDER BY b.object_identity),\'[]\'::jsonb) AS value FROM official_v3_jobs_private.catalog_binding_v1 b'
async function catalog(connection: LocalPgConnection): Promise<unknown> { return value(await connection.query(CATALOG_SQL)) }
async function methodHistory(connection: LocalPgConnection): Promise<unknown> { return value(await connection.query(METHOD_HISTORY_SQL)) }
async function effectHistory(connection: LocalPgConnection): Promise<unknown> { return value(await connection.query(EFFECT_HISTORY_SQL)) }
function assertEmptyHistory(snapshot: unknown): void {
  assert.ok(snapshot && typeof snapshot === 'object' && !Array.isArray(snapshot))
  for (const [table, rows] of Object.entries(snapshot)) assert.deepEqual(rows, [], 'no history in ' + table)
}
async function proveAbsent(lifetime: OwnedTestLifetime, observer: LocalPgConnection, ids: readonly Identity[]): Promise<void> {
  const target = JSON.stringify(ids.map(({ pid, birth }) => ({ pid, birth })))
  const deadline = performance.now() + 3000
  for (let attempt = 0; attempt < 20; attempt++) {
    lifetime.check()
    const n = scalar(await observer.query(`SELECT count(*)::text AS n FROM pg_catalog.pg_stat_activity a
      JOIN pg_catalog.jsonb_to_recordset($1::jsonb) AS t(pid integer,birth timestamptz)
        ON a.pid=t.pid AND a.backend_start=t.birth`, text([target])), 'n')
    if (n === '0') return
    if (performance.now() >= deadline) break
    await lifetime.wait(10)
  }
  assert.fail('owned exact PID/birth remained after bounded close')
}


async function creatorIdentity(connection: LocalPgConnection): Promise<void> {
  assert.deepEqual(await connection.query(`SELECT session_user::text AS login,current_user::text AS role,
    r.rolcanlogin::text AS can_login,r.rolsuper::text AS superuser,r.rolinherit::text AS inherit,
    r.rolcreaterole::text AS create_role,r.rolcreatedb::text AS create_db,r.rolreplication::text AS replication,
    r.rolbypassrls::text AS bypass,r.rolconnlimit::text AS connection_limit,r.rolvaliduntil::text AS valid_until,
    r.rolconfig::text AS config,current_setting('createrole_self_grant') AS self_grant,
    (SELECT count(*)::text FROM pg_catalog.pg_db_role_setting s WHERE s.setrole=r.oid) AS database_settings
    FROM pg_catalog.pg_roles r WHERE r.rolname=session_user`),
  [{ login: 'postgres', role: 'postgres', can_login: 'true', superuser: 'false', inherit: 'true',
    create_role: 'true', create_db: 'true', replication: 'true', bypass: 'true',
    connection_limit: '-1', valid_until: null, config: null, self_grant: '', database_settings: '0' }])
}
async function technicalIdentity(creator: LocalPgConnection, original: TechnicalIdentity, bound: boolean): Promise<void> {
  await creatorIdentity(creator)
  const x = original
  assert.deepEqual(await creator.query(`SELECT r.oid::text AS login_oid,r.rolcanlogin::text AS login,r.rolinherit::text AS inherit,
    r.rolsuper::text AS superuser,r.rolcreatedb::text AS create_db,r.rolcreaterole::text AS create_role,
    r.rolreplication::text AS replication,r.rolbypassrls::text AS bypass,r.rolconfig::text AS config,
    r.rolconnlimit::text AS connection_limit,r.rolvaliduntil::text AS valid_until,
    has_database_privilege(r.oid,current_database(),'CREATE')::text AS database_create,
    has_database_privilege(r.oid,current_database(),'CONNECT')::text AS database_connect,
    (SELECT count(*)::text FROM pg_catalog.pg_db_role_setting s WHERE s.setrole=r.oid) AS database_settings,
    pg_has_role($2::oid,r.oid,'USAGE')::text AS creator_usage,pg_has_role($2::oid,r.oid,'SET')::text AS creator_set
    FROM pg_catalog.pg_roles r WHERE r.rolname=$1::text`, text([x.login, x.creatorOid])),
  [{ login_oid: x.loginOid, login: 'true', inherit: 'false', superuser: 'false', create_db: 'false', create_role: 'false',
    replication: 'false', bypass: 'false', config: null, connection_limit: '-1', valid_until: null,
    database_create: 'false', database_connect: 'true', database_settings: '0', creator_usage: 'false', creator_set: 'false' }])
  const actual = await creator.query(`SELECT m.oid::text AS oid,m.roleid::text AS role_oid,m.member::text AS member_oid,
    m.grantor::text AS grantor_oid,m.admin_option::text AS admin,m.inherit_option::text AS inherit,m.set_option::text AS set_option
    FROM pg_catalog.pg_auth_members m WHERE m.roleid=$1::oid OR m.member=$1::oid OR m.grantor=$1::oid ORDER BY m.oid`, text([x.loginOid]))
  const expected = [{ oid: x.automaticOid, role_oid: x.loginOid, member_oid: x.creatorOid, grantor_oid: '10',
    admin: 'true', inherit: 'false', set_option: 'false' }]
  if (bound) {
    assert.ok(x.callerOid && x.runtimeOid)
    expected.push({ oid: x.runtimeOid, role_oid: x.callerOid, member_oid: x.loginOid, grantor_oid: x.creatorOid,
      admin: 'false', inherit: 'false', set_option: 'true' })
  }
  expected.sort((a, b) => Number(a.oid) - Number(b.oid))
  assert.deepEqual(actual, expected, 'exact automatic and optional runtime edges, including original membership OIDs')
}
const HMT_WRAPPERS = [
  { name: 'official_v3_method_approve_v1', types: 'text,text,integer,text,text,integer,text,text,integer,text,text,text', target: 'approve_v1' },
  { name: 'official_v3_method_confirm_operation_v1', types: 'text,text,text,integer,text,text,integer,integer,text,text,integer,text,text,text', target: 'confirm_operation_v1' },
  { name: 'official_v3_method_revoke_v1', types: 'text,text,integer,text,text,integer', target: 'revoke_v1' },
  { name: 'official_v3_method_stage_draft_v1', types: 'text,text,integer,text,text,integer', target: 'stage_draft_v1' },
] as const
async function wrapperIdentity(bootstrap: LocalPgConnection): Promise<PgRows> {
  const all = await bootstrap.query(`SELECT p.proname,p.oid::text AS oid,p.proowner::regrole::text AS owner,
    p.prosecdef::text AS definer,l.lanname AS language,p.proconfig::text AS config,
    (p.prosqlbody IS NOT NULL)::text AS parsed
    FROM pg_catalog.pg_proc p JOIN pg_catalog.pg_namespace n ON n.oid=p.pronamespace JOIN pg_catalog.pg_language l ON l.oid=p.prolang
    WHERE n.nspname='public' AND p.proname=ANY($1::text[]) ORDER BY p.proname`,
  text(['{' + HMT_WRAPPERS.map(x => x.name).join(',') + '}']))
  assert.equal(all.length, 4)
  for (let index = 0; index < HMT_WRAPPERS.length; index++) {
    const w = HMT_WRAPPERS[index]!, row = all[index]!
    assert.ok(row.oid)
    assert.deepEqual(row, { proname: w.name, oid: row.oid, owner: 'postgres', definer: 'false',
      language: 'sql', config: '{search_path=pg_catalog}', parsed: 'true' })
    const own = 'public.' + w.name + '(' + w.types + ')'
    const target = 'official_v3_method_api.' + w.target + '(' + w.types + ')'
    assert.deepEqual(await bootstrap.query(`SELECT d.refobjid::text AS target_oid,d.deptype::text AS dependency,
      d.objsubid::text AS subid,d.refobjsubid::text AS target_subid
      FROM pg_catalog.pg_depend d JOIN pg_catalog.pg_proc p ON p.oid=d.refobjid
      JOIN pg_catalog.pg_namespace n ON n.oid=p.pronamespace
      WHERE d.classid='pg_catalog.pg_proc'::pg_catalog.regclass AND d.objid=$1::pg_catalog.regprocedure
        AND d.refclassid='pg_catalog.pg_proc'::pg_catalog.regclass AND n.nspname='official_v3_method_api'`, text([own])),
    [{ target_oid: scalar(await bootstrap.query('SELECT $1::pg_catalog.regprocedure::oid::text AS oid', text([target])), 'oid'),
      dependency: 'n', subid: '0', target_subid: '0' }], 'parsed SQL RETURN preserves its exact HMA dependency')
  }
  return all
}
async function makeCommon(lifetime: OwnedTestLifetime, cluster: LocalProofCluster, files: ReadonlyMap<string, string>, fixture: VisaFixture) {
  const bootstrap = await connect(lifetime, cluster), observer = await connect(lifetime, cluster)
  const owner = bootstrap.connection
  const version = Number(scalar(await owner.query("SELECT current_setting('server_version_num') AS version"), 'version'))
  assert.ok(Number.isInteger(version) && version >= 170000 && version < 180000, 'actual PG17 required, no fallback')
  assert.equal(scalar(await owner.query("SELECT current_setting('server_encoding') AS encoding"), 'encoding'), 'UTF8')
  assert.equal(bootstrap.identity.login_oid, '10', 'actual original owned cluster bootstrap')
  await observer.connection.query("SET statement_timeout='1s'; SET lock_timeout='1s'")
  await owner.query(file(files, 'scripts/db/official-truth-v3-composed-dev-1/observed-auth-profile-fixture.sql'))
  const creator = await connect(lifetime, cluster, 'postgres')
  await creatorIdentity(creator.connection)
  await owner.query('SET search_path=pg_catalog,public,extensions')
  const publicBaseline = await owner.query(`SELECT n.oid::text AS oid,n.nspowner::text AS owner,n.nspacl::text AS acl,
    (SELECT jsonb_agg(to_jsonb(d) ORDER BY d.oid)::text FROM pg_catalog.pg_default_acl d WHERE d.defaclnamespace=2200) AS defaults
    FROM pg_catalog.pg_namespace n WHERE n.nspname='public'`)
  assert.equal(publicBaseline[0]?.oid, '2200')
  assert.ok(publicBaseline[0]?.owner && publicBaseline[0]?.acl && publicBaseline[0]?.defaults)
  // Finite synthetic users, real auth.sessions, and real profile rows. Seed once.
  // Owner 1 is AAL2; moderator 2 is AAL2; Owner 3 is AAL1; user 8 is only a
  // foreign-key-valid rebind target. No later reset/TRUNCATE/Auth fixture helper.
  for (const person of [1, 2, 3, 8]) {
    await owner.query("INSERT INTO auth.users(id,email) VALUES($1::uuid,$2::text)", text([uid(person), 'hrs1-' + person + '@example.invalid']))
    await owner.query("INSERT INTO auth.sessions(id,user_id,aal) VALUES($1::uuid,$2::uuid,$3::auth.aal_level)",
      text([uid(person + 200), uid(person), person === 3 ? 'aal1' : 'aal2']))
  }
  for (const [person, role] of [[1, 'owner'], [2, 'moderator'], [3, 'owner']] as const)
    await creator.connection.query("INSERT INTO public.profiles(id,user_id,role,status) VALUES($1::uuid,$2::uuid,$3::text,'active')",
      text([uid(person + 100), uid(person), role]))
  const expected = JSON.parse(file(files, 'scripts/db/profile-authority-integrity-1/observed-baseline.json')) as { portableExpectedShape: unknown }
  assert.ok(expected.portableExpectedShape)
  assert.deepEqual(value(await owner.query(PAI_CATALOG_SQL)), expected.portableExpectedShape)
  const originalProfiles = value(await owner.query(PAI_PRESERVED_SQL))
  await creator.connection.query(file(files, 'scripts/db/profile-authority-integrity-1/install-candidate.sql'))
  assert.deepEqual(value(await owner.query(PAI_CATALOG_SQL)), expected.portableExpectedShape)
  assert.deepEqual(value(await owner.query(PAI_PRESERVED_SQL)), originalProfiles, 'PAI leaves all old profile objects/OIDs exact')
  const guard = await owner.query(PAI_NEW_OBJECT_SQL)
  assert.equal(guard.length, 1); assert.ok(guard[0]?.function_oid && guard[0]?.trigger_oid)
  assert.equal(guard[0]?.owner, 'postgres'); assert.equal(guard[0]?.prosecdef, 'false')
  assert.equal(guard[0]?.body_sha256, GUARD_SHA256); assert.equal(guard[0]?.tgtype, '27'); assert.equal(guard[0]?.tgenabled, 'O')
  const profileRows = await owner.query(PROFILE_ROWS_SQL), authRows = value(await owner.query(AUTH_ROWS_SQL))
  const technical: TechnicalIdentity[] = []
  // All three actual restrictive LOGINs, their automatic grantor10 edges and
  // database rights exist BEFORE any protected namespace/fingerprint freeze.
  for (const entry of TECHNICAL) {
    assert.deepEqual(await creator.connection.query('SELECT oid::text AS oid FROM pg_catalog.pg_roles WHERE rolname=$1::text', text([entry.login])), [])
    await creator.connection.query('CREATE ROLE ' + entry.login + ' LOGIN NOINHERIT NOSUPERUSER NOBYPASSRLS NOCREATEROLE NOCREATEDB NOREPLICATION')
    await creator.connection.query('GRANT CONNECT ON DATABASE postgres TO ' + entry.login)
    const rows = await creator.connection.query(`SELECT r.oid::text AS login_oid,c.oid::text AS creator_oid,m.oid::text AS automatic_oid
      FROM pg_catalog.pg_roles r JOIN pg_catalog.pg_roles c ON c.rolname='postgres'
      JOIN pg_catalog.pg_auth_members m ON m.roleid=r.oid AND m.member=c.oid AND m.grantor=10
      WHERE r.rolname=$1::text AND m.admin_option AND NOT m.inherit_option AND NOT m.set_option`, text([entry.login]))
    assert.equal(rows.length, 1); const r = rows[0]!; assert.ok(r.login_oid && r.creator_oid && r.automatic_oid)
    const identity: TechnicalIdentity = Object.freeze({ ...entry, loginOid: r.login_oid!, creatorOid: r.creator_oid!, automaticOid: r.automatic_oid! })
    await technicalIdentity(creator.connection, identity, false)
    await assert.rejects(creator.connection.query('SET ROLE ' + entry.login), stateError('42501'))
    technical.push(identity)
  }
  await creator.connection.query(file(files, 'scripts/db/official-truth-v3-private-owner-guards-1/install-candidate.sql'))
  const beforeHma = await catalog(owner)
  await creator.connection.query(file(files, 'scripts/db/official-truth-v3-hosted-method-authority-1/install-candidate.sql'))
  const hmaIdentity = (await owner.query(`SELECT
    'official_v3_method_private'::pg_catalog.regnamespace::oid::text AS private_oid,
    'official_v3_method_api'::pg_catalog.regnamespace::oid::text AS api_oid,
    'ot_v3_method_reader'::pg_catalog.regrole::oid::text AS reader_oid`))[0]!
  assert.ok(hmaIdentity.private_oid && hmaIdentity.api_oid && hmaIdentity.reader_oid)
  await creator.connection.query(file(files, 'scripts/db/official-truth-v3-hosted-intake-store-1/install-candidate.sql'))
  const hsIdentity = scalar(await owner.query(HS1_IDENTITY_SQL), 'hs1_identity')
  await creator.connection.query("SELECT pg_catalog.set_config('jetnity.hmt1_target',$1::text,false) AS target_ack", text([TARGET_ACK]))
  await creator.connection.query(file(files, 'scripts/db/official-truth-v3-human-method-transport-1/install-candidate.sql'))
  const wrappers = await wrapperIdentity(owner)
  const hmtOriginalOids = scalar(await owner.query(`SELECT jsonb_agg(p.oid ORDER BY p.proname)::text AS oids
    FROM pg_catalog.pg_proc p JOIN pg_catalog.pg_namespace n ON n.oid=p.pronamespace
    WHERE n.nspname='public' AND p.proname=ANY($1::text[])`, text(['{' + HMT_WRAPPERS.map(x => x.name).join(',') + '}'])), 'oids')
  for(const name of ['ot_v3_result_owner',...Object.values(HRS_LOGINS)])
    assert.deepEqual(await owner.query('SELECT oid::text AS oid FROM pg_roles WHERE rolname=$1::text',text([name])),[])
  await creator.connection.query("SELECT set_config('jetnity.hrs1_install_context','root_selected_complete_binding_v1',false) AS context,set_config('jetnity.hrs1_binding',$1::text,false) AS binding",text([hrs1Canonical(fixture.binding)]))
  await creator.connection.query(file(files,'scripts/db/official-truth-v3-hosted-result-store-1/install-candidate.sql'))
  const resultIdentity=await hrsIdentity(owner,fixture.binding)
  const resultRights=await resultRoleIdentity(creator.connection,owner)
  const resultBridges=await resultBridgeIdentity(owner)
  await creator.connection.query(file(files, 'scripts/db/official-truth-v3-hosted-durable-jobs-1/install-candidate.sql'))

  const hmIdentity = scalar(await owner.query(HM04_IDENTITY_SQL), 'hm04_identity')
  const fingerprints = value(await owner.query(FINGERPRINT_SQL))
  assert.ok(Array.isArray(fingerprints) && fingerprints.length > 0)
  assert.deepEqual(await wrapperIdentity(owner), wrappers, 'HM04 retains original parsed public wrappers')
  const bound: TechnicalIdentity[] = []
  for (const identity of technical) {
    await technicalIdentity(creator.connection, identity, false)
    await creator.connection.query('GRANT ' + identity.role + ' TO ' + identity.login + ' WITH ADMIN FALSE, INHERIT FALSE, SET TRUE GRANTED BY postgres')
    const r = (await creator.connection.query(`SELECT m.roleid::text AS caller_oid,m.oid::text AS runtime_oid
      FROM pg_catalog.pg_auth_members m WHERE m.roleid=$1::pg_catalog.regrole AND m.member=$2::oid AND m.grantor=$3::oid`,
      text([identity.role, identity.loginOid, identity.creatorOid])))[0]
    assert.ok(r?.caller_oid && r?.runtime_oid)
    const exact: TechnicalIdentity = Object.freeze({ ...identity, callerOid: r!.caller_oid!, runtimeOid: r!.runtime_oid! })
    await technicalIdentity(creator.connection, exact, true)
    bound.push(exact)
  }
  const runtime: Connected[] = []
  for (const x of bound) runtime.push(await connect(lifetime, cluster, x.login, x.loginOid, x.role))
  const humanOid = scalar(await owner.query("SELECT 'pai1_human'::pg_catalog.regrole::oid::text AS oid"), 'oid')
  const human = await connect(lifetime, cluster, 'pai1_human', humanOid, 'authenticated')
  await setClaims(human.connection, 1)
  const probeKey=mustRead(createV3WorkIdentity({context:fixture.context,method:METHOD_REF,factKind:'requirement_effect',researchReason:{status:'missing'}})).jobKey
  assert.deepEqual(value(await runtime[0]!.connection.query(M04_FIXED_SQL, text([
    m04Canonical({ operation: 'queue_read', body: { jobKey: probeKey, continuation: null }, phase: 'probe' }),
    BINDING.methodId, BINDING.revision, BINDING.methodDigest, BINDING.packageDigest, null, 5000, new Date(Date.now() + 5000).toISOString(),
  ])), 'result'), { status: 'absent' }, 'actual HM04 guard accepts all common fingerprints and role identities')
  const readerRows = await runtime[2]!.connection.query(`SELECT status FROM official_v3_method_api.read_current_v1($1::text,$2::integer,$3::text,$4::text,$5::text)`,
    text([BINDING.methodId, BINDING.revision, BINDING.methodDigest, BINDING.packageDigest, new Date().toISOString()]))
  assert.deepEqual(readerRows, [{ status: 'absent' }])
  assertEmptyHistory(await methodHistory(owner)); assertEmptyHistory(await effectHistory(owner))
  assert.equal(scalar(await owner.query('SELECT count(*)::text AS n FROM official_v3_jobs_private.slots_v1'), 'n'), '1024')
  assert.deepEqual(value(await owner.query(FINGERPRINT_SQL)), fingerprints, 'runtime binding never relearns catalog fingerprints')
  assert.deepEqual(await owner.query(PROFILE_ROWS_SQL), profileRows)
  assert.deepEqual(value(await owner.query(AUTH_ROWS_SQL)), authRows)
  assert.deepEqual(await owner.query(PAI_NEW_OBJECT_SQL), guard)
  assert.deepEqual(await owner.query(`SELECT n.oid::text AS oid,n.nspowner::text AS owner,n.nspacl::text AS acl,
    (SELECT jsonb_agg(to_jsonb(d) ORDER BY d.oid)::text FROM pg_catalog.pg_default_acl d WHERE d.defaclnamespace=2200) AS defaults
    FROM pg_catalog.pg_namespace n WHERE n.nspname='public'`), publicBaseline)
  await resultRoleIdentity(creator.connection,owner,resultRights)
  assert.deepEqual(await resultBridgeIdentity(owner),resultBridges)
  const frozen = await catalog(owner)
  return { cluster, binding:fixture.binding, bootstrap, observer, creator, runtime, human, humanOid, bound, guard, profileRows, authRows,
    beforeHma, hmaIdentity, hsIdentity, hmtOriginalOids, hmIdentity, resultIdentity, resultRights, resultBridges, wrappers, fingerprints, frozen }
}
type Common = Awaited<ReturnType<typeof makeCommon>>
async function frozen(common: Common): Promise<void> {
  const owner = common.bootstrap.connection
  assert.deepEqual(await catalog(owner), common.frozen, 'common logical catalog/role graph cannot drift after freeze')
  assert.deepEqual(value(await owner.query(FINGERPRINT_SQL)), common.fingerprints, 'captured HM04 fingerprints never rewritten')
  assert.deepEqual(await owner.query(PAI_NEW_OBJECT_SQL), common.guard)
  for (const x of common.bound) await technicalIdentity(common.creator.connection, x, true)
  await resultRoleIdentity(common.creator.connection,owner,common.resultRights)
  assert.deepEqual(await resultBridgeIdentity(owner),common.resultBridges)
}


const HRS_CATALOG_SQL = "WITH ns AS (\n SELECT n.oid,n.nspname FROM pg_catalog.pg_namespace n WHERE n.nspname IN ('official_v3_result_private','official_v3_result_api')\n), tabs AS (\n SELECT c.oid,c.reltoastrelid FROM pg_catalog.pg_class c JOIN ns n ON n.oid=c.relnamespace WHERE c.relkind='r'\n), classes AS (\n SELECT c.oid FROM pg_catalog.pg_class c JOIN ns n ON n.oid=c.relnamespace\n UNION SELECT t.reltoastrelid FROM tabs t WHERE t.reltoastrelid<>0\n UNION SELECT i.indexrelid FROM pg_catalog.pg_index i JOIN tabs t ON i.indrelid=t.reltoastrelid WHERE t.reltoastrelid<>0\n), objects AS (\n SELECT 'pg_catalog.pg_namespace'::pg_catalog.regclass::oid AS classid,n.oid AS objid FROM ns n\n UNION SELECT 'pg_catalog.pg_class'::pg_catalog.regclass,c.oid FROM classes c\n UNION SELECT 'pg_catalog.pg_type'::pg_catalog.regclass,t.oid FROM pg_catalog.pg_type t JOIN ns n ON n.oid=t.typnamespace\n UNION SELECT 'pg_catalog.pg_proc'::pg_catalog.regclass,p.oid FROM pg_catalog.pg_proc p JOIN ns n ON n.oid=p.pronamespace\n UNION SELECT 'pg_catalog.pg_constraint'::pg_catalog.regclass,c.oid FROM pg_catalog.pg_constraint c JOIN tabs t ON t.oid=c.conrelid\n UNION SELECT 'pg_catalog.pg_trigger'::pg_catalog.regclass,g.oid FROM pg_catalog.pg_trigger g JOIN tabs t ON t.oid=g.tgrelid\n UNION SELECT 'pg_catalog.pg_policy'::pg_catalog.regclass,p.oid FROM pg_catalog.pg_policy p JOIN tabs t ON t.oid=p.polrelid\n UNION SELECT 'pg_catalog.pg_attrdef'::pg_catalog.regclass,d.oid FROM pg_catalog.pg_attrdef d JOIN tabs t ON t.oid=d.adrelid\n), role_ids AS (\n SELECT r.oid FROM pg_catalog.pg_roles r WHERE r.rolname IN ('ot_v3_result_owner','ot_v3_result_writer','ot_v3_result_reader','ot_v3_result_verifier')\n), prerequisite_ns AS (\n SELECT n.oid FROM pg_catalog.pg_namespace n WHERE n.nspname IN\n  ('jetnity_ot_auth','official_v3_method_private','official_v3_method_api','official_v3_intake_private','official_v3_intake_api')\n)\nSELECT jsonb_build_object(\n 'database',(SELECT to_jsonb(d)-ARRAY['datfrozenxid','datminmxid'] FROM pg_catalog.pg_database d WHERE d.datname=current_database()),\n 'creator',(SELECT to_jsonb(r) FROM pg_catalog.pg_roles r WHERE r.rolname='postgres'),\n 'namespaces',(SELECT jsonb_agg(to_jsonb(n) ORDER BY n.oid) FROM pg_catalog.pg_namespace n JOIN ns s ON s.oid=n.oid),\n 'roles',(SELECT jsonb_agg(to_jsonb(r) ORDER BY r.oid) FROM pg_catalog.pg_roles r JOIN role_ids i ON i.oid=r.oid),\n 'memberships',(SELECT jsonb_agg(to_jsonb(m) ORDER BY m.oid) FROM pg_catalog.pg_auth_members m\n   WHERE EXISTS(SELECT 1 FROM role_ids r WHERE r.oid IN (m.roleid,m.member,m.grantor))\n    AND NOT(m.roleid='ot_v3_result_owner'::regrole AND m.member='postgres'::regrole AND m.grantor='postgres'::regrole\n     AND NOT m.admin_option AND NOT m.inherit_option AND m.set_option)),\n 'settings',(SELECT jsonb_agg(to_jsonb(s) ORDER BY s.setdatabase,s.setrole) FROM pg_catalog.pg_db_role_setting s\n   WHERE s.setrole='postgres'::regrole OR s.setrole IN (SELECT oid FROM role_ids)),\n 'defaults',(SELECT jsonb_agg(to_jsonb(d) ORDER BY d.oid) FROM pg_catalog.pg_default_acl d\n   WHERE d.defaclrole IN (SELECT oid FROM role_ids) OR d.defaclnamespace IN (SELECT oid FROM ns)\n    OR (d.defaclrole='postgres'::regrole AND d.defaclnamespace=0)),\n 'functions',(SELECT jsonb_agg(jsonb_build_object('catalog',to_jsonb(p)-ARRAY['prosrc','prosqlbody','probin'],\n   'definition',encode(sha256(convert_to(pg_get_functiondef(p.oid),'UTF8')),'hex')) ORDER BY p.oid)\n   FROM pg_catalog.pg_proc p JOIN ns n ON n.oid=p.pronamespace),\n 'relations',(SELECT jsonb_agg(jsonb_build_object('catalog',to_jsonb(c)-ARRAY['relpages','reltuples','relallvisible','relfrozenxid','relminmxid'],\n   'attributes',(SELECT jsonb_agg(to_jsonb(a) ORDER BY a.attnum) FROM pg_catalog.pg_attribute a WHERE a.attrelid=c.oid),\n   'constraints',(SELECT jsonb_agg(to_jsonb(k) ORDER BY k.oid) FROM pg_catalog.pg_constraint k WHERE k.conrelid=c.oid),\n   'indexes',(SELECT jsonb_agg(to_jsonb(i) ORDER BY i.indexrelid) FROM pg_catalog.pg_index i WHERE i.indrelid=c.oid OR i.indexrelid=c.oid),\n   'policies',(SELECT jsonb_agg(to_jsonb(p) ORDER BY p.oid) FROM pg_catalog.pg_policy p WHERE p.polrelid=c.oid),\n   'triggers',(SELECT jsonb_agg(to_jsonb(g) ORDER BY g.oid) FROM pg_catalog.pg_trigger g WHERE g.tgrelid=c.oid),\n   'defaults',(SELECT jsonb_agg(to_jsonb(d) ORDER BY d.adnum) FROM pg_catalog.pg_attrdef d WHERE d.adrelid=c.oid),\n   'inheritance',(SELECT jsonb_agg(to_jsonb(i) ORDER BY i.inhrelid,i.inhparent) FROM pg_catalog.pg_inherits i WHERE i.inhrelid=c.oid OR i.inhparent=c.oid),\n   'rewrites',(SELECT jsonb_agg(to_jsonb(r) ORDER BY r.oid) FROM pg_catalog.pg_rewrite r WHERE r.ev_class=c.oid))\n   ORDER BY c.oid) FROM pg_catalog.pg_class c JOIN classes i ON i.oid=c.oid),\n 'types',(SELECT jsonb_agg(to_jsonb(t) ORDER BY t.oid) FROM pg_catalog.pg_type t JOIN ns n ON n.oid=t.typnamespace),\n 'objects',(SELECT jsonb_agg(to_jsonb(o) ORDER BY o.classid,o.objid) FROM objects o),\n 'dependencies',(SELECT jsonb_agg(to_jsonb(d) ORDER BY d.classid,d.objid,d.objsubid,d.refclassid,d.refobjid,d.refobjsubid,d.deptype)\n   FROM pg_catalog.pg_depend d WHERE EXISTS(SELECT 1 FROM objects o WHERE o.classid=d.classid AND o.objid=d.objid)\n     OR EXISTS(SELECT 1 FROM objects o WHERE o.classid=d.refclassid AND o.objid=d.refobjid)),\n 'shared',(SELECT jsonb_agg(to_jsonb(d) ORDER BY d.dbid,d.classid,d.objid,d.objsubid,d.refclassid,d.refobjid,d.deptype)\n   FROM pg_catalog.pg_shdepend d WHERE ((d.dbid=(SELECT b.oid FROM pg_catalog.pg_database b WHERE b.datname=current_database())\n    AND EXISTS(SELECT 1 FROM objects o WHERE o.classid=d.classid AND o.objid=d.objid))\n    OR (d.refclassid='pg_catalog.pg_authid'::regclass AND d.refobjid IN (SELECT oid FROM role_ids)))\n    AND NOT(d.dbid=0 AND d.classid='pg_catalog.pg_auth_members'::regclass AND EXISTS(\n     SELECT 1 FROM pg_catalog.pg_auth_members m WHERE m.oid=d.objid AND m.roleid='ot_v3_result_owner'::regrole\n      AND m.member='postgres'::regrole AND m.grantor='postgres'::regrole\n      AND NOT m.admin_option AND NOT m.inherit_option AND m.set_option))),\n 'descriptions',(SELECT jsonb_agg(to_jsonb(d) ORDER BY d.classoid,d.objoid,d.objsubid) FROM pg_catalog.pg_description d\n   JOIN objects o ON o.classid=d.classoid AND o.objid=d.objoid),\n 'labels',(SELECT jsonb_agg(to_jsonb(s) ORDER BY s.classoid,s.objoid,s.objsubid,s.provider) FROM pg_catalog.pg_seclabel s\n   JOIN objects o ON o.classid=s.classoid AND o.objid=s.objoid),\n 'prerequisiteFunctions',(SELECT jsonb_agg(jsonb_build_object('catalog',to_jsonb(p)-ARRAY['prosrc','prosqlbody','probin'],\n   'definition',encode(sha256(convert_to(pg_get_functiondef(p.oid),'UTF8')),'hex')) ORDER BY p.oid)\n   FROM pg_catalog.pg_proc p JOIN prerequisite_ns n ON n.oid=p.pronamespace),\n 'prerequisiteRelations',(SELECT jsonb_agg(jsonb_build_object('oid',c.oid,'namespace',c.relnamespace,'owner',c.relowner,'kind',c.relkind,\n   'acl',c.relacl,'rls',c.relrowsecurity,'force',c.relforcerowsecurity,'options',c.reloptions,\n   'attributes',(SELECT jsonb_agg(to_jsonb(a) ORDER BY a.attnum) FROM pg_catalog.pg_attribute a WHERE a.attrelid=c.oid),\n   'constraints',(SELECT jsonb_agg(to_jsonb(k) ORDER BY k.oid) FROM pg_catalog.pg_constraint k WHERE k.conrelid=c.oid),\n   'triggers',(SELECT jsonb_agg(to_jsonb(g) ORDER BY g.oid) FROM pg_catalog.pg_trigger g WHERE g.tgrelid=c.oid),\n   'policies',(SELECT jsonb_agg(to_jsonb(p) ORDER BY p.oid) FROM pg_catalog.pg_policy p WHERE p.polrelid=c.oid))\n   ORDER BY c.oid) FROM pg_catalog.pg_class c JOIN prerequisite_ns n ON n.oid=c.relnamespace)\n)"

async function hrsIdentity(owner:LocalPgConnection,binding:Hrs1Binding):Promise<string>{
  const actual=scalar(await owner.query("SELECT jsonb_build_object('package','HRS1-v1','bindingHash',b.binding_hash,'catalog',official_v3_result_private.catalog_v1())::text AS identity FROM official_v3_result_private.binding_v1 b WHERE b.singleton"),'identity')
  const identity=JSON.parse(actual) as {package:string;bindingHash:string;catalog:unknown}
  assert.equal(identity.package,'HRS1-v1');assert.equal(identity.bindingHash,hrs1Hash(binding))
  assert.deepEqual(identity.catalog,value(await owner.query('SELECT ('+HRS_CATALOG_SQL+') AS value')))
  return actual
}
async function resultRoleIdentity(creator:LocalPgConnection,owner:LocalPgConnection,original?:PgRows){
  await creatorIdentity(creator)
  const names=['ot_v3_result_owner',...Object.values(HRS_LOGINS)].sort()
  const rows=await creator.query(`SELECT r.rolname,r.oid::text AS oid,r.rolcanlogin::text AS login,r.rolinherit::text AS inherit,
    r.rolsuper::text AS superuser,r.rolcreatedb::text AS create_db,r.rolcreaterole::text AS create_role,
    r.rolreplication::text AS replication,r.rolbypassrls::text AS bypass,r.rolconfig::text AS config,
    r.rolconnlimit::text AS connection_limit,r.rolvaliduntil::text AS valid_until,
    has_database_privilege(r.oid,current_database(),'CREATE')::text AS database_create,
    has_database_privilege(r.oid,current_database(),'CONNECT')::text AS database_connect,
    EXISTS(SELECT 1 FROM pg_database d,LATERAL aclexplode(COALESCE(d.datacl,acldefault('d',d.datdba))) a
      WHERE d.datname=current_database() AND a.grantee=0 AND a.privilege_type='CONNECT')::text AS public_database_connect,
    EXISTS(SELECT 1 FROM pg_database d,LATERAL aclexplode(COALESCE(d.datacl,acldefault('d',d.datdba))) a
      WHERE d.datname=current_database() AND a.grantee=r.oid AND a.privilege_type='CONNECT')::text AS direct_database_connect,
    (SELECT count(*)::text FROM pg_db_role_setting s WHERE s.setrole=r.oid) AS database_settings,
    pg_has_role('postgres',r.oid,'USAGE')::text AS creator_usage,pg_has_role('postgres',r.oid,'SET')::text AS creator_set,
    (SELECT jsonb_agg(to_jsonb(m) ORDER BY m.oid)::text FROM pg_auth_members m
      WHERE m.roleid=r.oid OR m.member=r.oid OR m.grantor=r.oid) AS memberships
    FROM pg_roles r WHERE r.rolname=ANY($1::text[]) ORDER BY r.rolname`,text(['{'+names.join(',')+'}']))
  assert.equal(rows.length,4)
  const creatorOid=scalar(await creator.query("SELECT 'postgres'::regrole::oid::text AS oid"),'oid')
  for(const row of rows){
    const noLogin=row.rolname==='ot_v3_result_owner';assert.ok(row.oid);assert.ok(row.memberships)
    assert.ok(row.public_database_connect==='true'||row.public_database_connect==='false')
    assert.deepEqual({...row,oid:null,memberships:null},{rolname:row.rolname,oid:null,login:noLogin?'false':'true',inherit:'false',superuser:'false',
      create_db:'false',create_role:'false',replication:'false',bypass:'false',config:null,connection_limit:noLogin?'-1':'2',
      valid_until:null,database_create:'false',database_connect:noLogin?row.public_database_connect:'true',
      public_database_connect:row.public_database_connect,direct_database_connect:noLogin?'false':'true',
      database_settings:'0',creator_usage:'false',creator_set:'false',memberships:null})
    const members=JSON.parse(row.memberships!) as Record<string,unknown>[];assert.equal(members.length,1)
    assert.deepEqual(Object.keys(members[0]!).sort(),['admin_option','grantor','inherit_option','member','oid','roleid','set_option'])
    assert.deepEqual({...members[0],oid:null},{oid:null,roleid:Number(row.oid),member:Number(creatorOid),grantor:10,admin_option:true,inherit_option:false,set_option:false})
    assert.ok(Number.isSafeInteger(members[0]!.oid))
    await assert.rejects(creator.query('SET ROLE '+row.rolname),stateError('42501'))
  }
  if(original)assert.deepEqual(rows,original,'same four original role and automatic-edge identities')
  const tables=await owner.query(`SELECT c.relname,c.relowner::regrole::text AS owner,c.relrowsecurity::text AS rls,c.relforcerowsecurity::text AS force,
    c.relkind::text AS kind FROM pg_class c JOIN pg_namespace n ON n.oid=c.relnamespace
    WHERE n.nspname='official_v3_result_private' AND c.relkind='r' ORDER BY c.relname`)
  assert.deepEqual(tables,RESULT_TABLES.slice().sort().map(relname=>({relname,owner:'ot_v3_result_owner',rls:'true',force:'true',kind:'r'})))
  for(const [kind,login] of Object.entries(HRS_LOGINS)){
    assert.deepEqual(await owner.query(`SELECT has_schema_privilege($1::text,'official_v3_result_private','USAGE')::text AS private_usage,
      has_schema_privilege($1::text,'official_v3_result_private','CREATE')::text AS private_create,
      has_schema_privilege($1::text,'official_v3_result_api','USAGE')::text AS api_usage,
      has_schema_privilege($1::text,'official_v3_result_api','CREATE')::text AS api_create,
      pg_has_role($1::text,'ot_v3_result_owner','MEMBER')::text AS owner_member,
      pg_has_role($1::text,'ot_v3_intake_owner','MEMBER')::text AS intake_owner_member`,text([login])),
      [{private_usage:'false',private_create:'false',api_usage:'true',api_create:'false',owner_member:'false',intake_owner_member:'false'}])
    assert.deepEqual(await owner.query(`SELECT p.proname,has_function_privilege($1::text,p.oid,'EXECUTE')::text AS allowed
      FROM pg_proc p JOIN pg_namespace n ON n.oid=p.pronamespace WHERE n.nspname='official_v3_result_api' ORDER BY p.proname`,text([login])),
      [{proname:'attest_v1',allowed:kind==='verifier'?'true':'false'},{proname:'execute_v1',allowed:kind==='writer'?'true':'false'},
        {proname:'read_v1',allowed:kind==='verifier'?'false':'true'}])
    const rights=await owner.query(`SELECT c.relname,has_table_privilege($1::text,c.oid,'SELECT,INSERT,UPDATE,DELETE,TRUNCATE,REFERENCES,TRIGGER')::text AS any_right
      FROM pg_class c JOIN pg_namespace n ON n.oid=c.relnamespace WHERE n.nspname='official_v3_result_private' AND c.relkind='r' ORDER BY c.relname`,text([login]))
    assert.deepEqual(rights,RESULT_TABLES.slice().sort().map(relname=>({relname,any_right:'false'})))
  }
  return rows
}
async function resultBridgeIdentity(owner:LocalPgConnection){
  const selected=[
    {name:'ma1_require_current_locked_v1',types:'text,integer,text,text,integer',owner:'postgres',target:'official_v3_method_private.require_current_locked_v1(text,integer,text,text,integer)',returns:'void'},
    {name:'s1_read_locked_v1',types:'jsonb,text,integer',owner:'ot_v3_intake_owner',target:'official_v3_intake_api.read_v1(jsonb,text,integer)',returns:'jsonb'},
  ] as const
  const results:Record<string,unknown>[]=[]
  for(const bridge of selected){
    const signature='official_v3_result_private.'+bridge.name+'('+bridge.types+')'
    const rows=await owner.query(`SELECT p.oid::text AS oid,p.proowner::regrole::text AS owner,p.prosecdef::text AS definer,
      l.lanname AS language,p.proconfig::text AS config,(p.prosqlbody IS NOT NULL)::text AS parsed,
      p.provolatile::text AS volatility,p.proparallel::text AS parallel,p.prokind::text AS kind,p.proleakproof::text AS leakproof,
      p.proretset::text AS returns_set,p.proisstrict::text AS strict,p.pronargdefaults::text AS defaults,
      pg_get_function_result(p.oid) AS returns,pg_get_functiondef(p.oid) AS definition,
      (SELECT jsonb_agg(jsonb_build_object('grantee',a.grantee::regrole::text,'grantor',a.grantor::regrole::text,
        'privilege',a.privilege_type,'grantable',a.is_grantable) ORDER BY a.grantee,a.grantor,a.privilege_type)::text
        FROM aclexplode(COALESCE(p.proacl,acldefault('f',p.proowner))) a) AS acl
      FROM pg_proc p JOIN pg_language l ON l.oid=p.prolang WHERE p.oid=$1::regprocedure`,text([signature]))
    assert.equal(rows.length,1);const row=rows[0]!;assert.ok(row.oid&&row.definition&&row.acl)
    assert.deepEqual({...row,oid:null,definition:null,acl:null},{oid:null,owner:bridge.owner,definer:'true',language:'sql',config:'{search_path=pg_catalog}',
      parsed:'true',volatility:'v',parallel:'u',kind:'f',leakproof:'false',returns_set:'false',strict:'false',defaults:'0',returns:bridge.returns,definition:null,acl:null})
    const acl=(JSON.parse(row.acl!) as Record<string,unknown>[]).sort((a,b)=>String(a.grantee).localeCompare(String(b.grantee)))
    const expected=[bridge.owner,'ot_v3_result_owner'].sort().map(grantee=>({grantee,grantor:bridge.owner,privilege:'EXECUTE',grantable:false}))
    assert.deepEqual(acl,expected)
    const deps=await owner.query(`SELECT d.refobjid::text AS target_oid,d.deptype::text AS dependency,d.objsubid::text AS subid,d.refobjsubid::text AS target_subid
      FROM pg_depend d WHERE d.classid='pg_proc'::regclass AND d.objid=$1::regprocedure AND d.refclassid='pg_proc'::regclass ORDER BY d.refobjid`,text([signature]))
    const target=scalar(await owner.query('SELECT $1::regprocedure::oid::text AS oid',text([bridge.target])),'oid')
    assert.deepEqual(deps,[{target_oid:target,dependency:'n',subid:'0',target_subid:'0'}])
    results.push({signature,...row,deps})
  }
  return results
}

type Action='stage'|'approve'|'revoke'
type MethodHead=typeof HRS_METHOD & Readonly<{epoch:number;status:'approved'|'revoked';approvalMode:'until_revoked'|'until'|null;approvalUntil:string|null}>
function command(action:Action,n:number,before:MethodHead|null=null,until:string|null=null){
  const op=operationId(n),b=BINDING
  assert.ok(action==='stage'?before===null:action==='revoke'?before?.status==='approved':before===null||before.status==='revoked')
  const expected=action==='stage'?null:before?{revision:before.revision,methodDigest:before.methodDigest,
    packageDigest:before.packageDigest,epoch:before.epoch,status:before.status}
    :{revision:null,methodDigest:null,packageDigest:null,epoch:0,status:null}
  const approval=action==='approve'?{mode:until===null?'until_revoked':'until',until}:null
  const fullCommand={schema:1,operationId:op,action,...b,predecessorRevision:null,expected,approval}
  const after:MethodHead|null=action==='stage'?null:{...b,epoch:(before?.epoch??0)+1,
    status:action==='approve'?'approved':'revoked',approvalMode:action==='approve'?(until===null?'until_revoked':'until'):null,
    approvalUntil:action==='approve'?until:null}
  const tuple=[op,b.methodId,b.revision,b.methodDigest,b.packageDigest] as const
  const wrapper=HMT_WRAPPERS.find(x=>x.target===(action==='stage'?'stage_draft_v1':action+'_v1'))!
  const parameters=action==='stage'?[...tuple,null]:action==='approve'?[...tuple,expected?.revision??null,
    expected?.methodDigest??null,expected?.packageDigest??null,expected?.epoch??0,expected?.status??null,approval!.mode,until]
    :[...tuple,before!.epoch]
  const confirmation=[op,action,b.methodId,b.revision,b.methodDigest,b.packageDigest,null,
    expected?.revision??null,expected?.methodDigest??null,expected?.packageDigest??null,expected?.epoch??null,
    expected?.status??null,approval?.mode??null,approval?.until??null]
  return{op,action,fullCommand,before,after,wrapper,parameters,confirmation}
}

type Command = ReturnType<typeof command>
function callSql(wrapper: (typeof HMT_WRAPPERS)[number]): string {
  return 'SELECT public.' + wrapper.name + '(' + wrapper.types.split(',').map((type, i) =>
    "NULLIF($" + (i + 1) + "::text,'')::" + type).join(',') + ') AS result'
}
function assertReceipt(receipt: unknown, expected: Command): asserts receipt is Receipt {
  assert.ok(receipt && typeof receipt === 'object' && !Array.isArray(receipt))
  const r = receipt as Receipt
  assert.deepEqual(Object.keys(r).sort(), ['action', 'actorId', 'after', 'before', 'command', 'operationId', 'recordedAt', 'status'])
  assert.equal(r.status, 'recorded'); assert.equal(r.operationId, expected.op); assert.equal(r.action, expected.action)
  assert.equal(r.actorId, uid(1)); assert.match(r.recordedAt, /^\d{4}-\d\d-\d\dT\d\d:\d\d:\d\d\.\d{6}Z$/)
  assert.deepEqual(r.command, expected.fullCommand)
  assert.deepEqual(r.before, expected.before); assert.deepEqual(r.after, expected.after)
}
async function writeHuman(common: Common, expected: Command): Promise<Receipt> {
  const r = value(await common.human.connection.query(callSql(expected.wrapper), text(expected.parameters)), 'result')
  assertReceipt(r, expected)
  return r
}
async function confirmFresh(lifetime: OwnedTestLifetime, common: Common,
  written: readonly Readonly<{ command: Command; receipt: Receipt }>[]): Promise<Identity> {
  const fresh = await connect(lifetime, common.cluster, 'pai1_human', common.humanOid, 'authenticated')
  assert.notDeepEqual([fresh.identity.pid, fresh.identity.birth], [common.human.identity.pid, common.human.identity.birth],
    'confirmation must be a separate actual authenticated backend')
  let failed = false, failure: unknown
  try {
    await setClaims(fresh.connection, 1)
    for (const entry of written) {
      const receipt = value(await fresh.connection.query(callSql(HMT_WRAPPERS[1]), text(entry.command.confirmation)), 'result')
      assertReceipt(receipt, entry.command)
      assert.deepEqual(receipt, entry.receipt, 'full actor/action/operation/method/digests/state/epoch/timestamp persists across fresh human session')
    }
  } catch (error) { failed = true; failure = error }
  finally {
    fresh.connection.close()
    try { await proveAbsent(lifetime, common.observer.connection, [fresh.identity]) }
    catch (error) { failure = failed ? new AggregateError([failure, error], 'human confirmation and drain failed') : error; failed = true }
  }
  if (failed) throw failure
  return fresh.identity
}

type BackendIdentity = Readonly<{ pid: string; birth: string }>
type HrsLoginKind = 'writer' | 'reader' | 'verifier'
type HrsCall = { id: number; kind: HrsLoginKind; operation: Hrs1Operation; control?: LocalPgConnection;
  target?: LocalPgConnection; controlId?: BackendIdentity; targetId?: BackendIdentity; cancellation?: Promise<void>;
  dispatched: boolean; committed: boolean; drained: boolean }
type HrsBudget = { admitted: number; active: number; maximumActive: number; directAdmitted:number; directSettled:number }
const HRS_LOGINS = Object.freeze({ writer: 'ot_v3_result_writer', reader: 'ot_v3_result_reader', verifier: 'ot_v3_result_verifier' })
const BACKEND_IDENTITY_SQL = 'SELECT pg_backend_pid()::text AS pid,backend_start::text AS birth,session_user::text AS login,current_user::text AS role FROM pg_stat_activity WHERE pid=pg_backend_pid()'
function backendIdentity(rows: PgRows, login: string): BackendIdentity {
  assert.equal(rows.length, 1)
  const row = rows[0]!
  assert.deepEqual(Object.keys(row).sort(), ['birth','login','pid','role'])
  assert.equal(row.login, login); assert.equal(row.role, login)
  assert.match(row.pid!, /^[1-9][0-9]{0,9}$/); assert.ok(row.birth && row.birth.length >= 19 && row.birth.length < 65)
  return Object.freeze({ pid: row.pid!, birth: row.birth! })
}
const databaseMicroseconds = (s: string) => s.slice(0, -1) + '000Z'
/** Native owns fixed SQL and actual guarded COMMIT. No connection, open
 * transaction or arbitrary post-check callback escapes this executor. */
async function createHrsNativeExecutors(cluster: LocalProofCluster, lifetime: OwnedTestLifetime, budget: HrsBudget) {
  assertOwnedLocalProofCluster(cluster)
  const observer = await LocalPgConnection.connect(cluster)
  await observer.query("SELECT set_config('statement_timeout','1000',false) AS statement_timeout,set_config('lock_timeout','1000',false) AS lock_timeout")
  const contexts = new Set<HrsCall>(), stop = new AbortController(), loseResponseFor = new Set<Hrs1Operation>()
  let poisoned = false, stopped = false, cleanupTail = Promise.resolve()
  const evidence = { admitted: 0, dispatched: 0, acknowledged: 0, lost: 0, aborted: 0, drained: 0,
    sqlCodes: [] as string[], calls: [] as Readonly<{ id: number; kind: HrsLoginKind; operation: Hrs1Operation;
      target: BackendIdentity | null; control: BackendIdentity | null; dispatched: boolean; committed: boolean; drained: boolean }>[] }
  const removeStop = lifetime.onStop(() => { stop.abort(Error('hrs1_native_lifetime_stopped')) })
  function poison() {
    if (poisoned) return
    poisoned = true; stop.abort(Error('hrs1_native_drain_failed'))
    for (const call of contexts) { call.target?.close(); call.control?.close() }
    lifetime.stopCluster(cluster)
  }
  async function drain(call: HrsCall): Promise<void> {
    const previous = cleanupTail
    let release!: () => void
    cleanupTail = new Promise<void>(resolve => { release = resolve })
    try {
      await previous
      const until = performance.now() + 5000
      for (;;) {
        lifetime.check()
        assert.ok(call.targetId && call.controlId, 'both actual backend identities required')
        const rows = await observer.query(
          'SELECT (NOT EXISTS(SELECT 1 FROM pg_stat_activity WHERE pid=$1::integer AND backend_start=$2::timestamptz))::text AS target_absent,'
          + '(NOT EXISTS(SELECT 1 FROM pg_stat_activity WHERE pid=$3::integer AND backend_start=$4::timestamptz))::text AS control_absent',
          [pgText(call.targetId.pid,23),pgText(call.targetId.birth),pgText(call.controlId.pid,23),pgText(call.controlId.birth)])
        if (rows[0]?.target_absent === 'true' && rows[0]?.control_absent === 'true') {
          call.drained = true; evidence.drained++; return
        }
        if (performance.now() >= until) throw Error('hrs1_native_drain_expired')
        await lifetime.wait(5)
      }
    } catch (error) { poison(); throw error } finally { release() }
  }
  async function execute(kind: HrsLoginKind, request: Hrs1FixedRequest, signal: AbortSignal) {
    const deadline = Math.min(request.budget.deadline, performance.now() + HRS1_LIMITS.effectMilliseconds)
    assert.ok(Number.isFinite(deadline) && hrs1Time(request.notAfter))
    assert.ok(typeof request.operationText === 'string' && Buffer.byteLength(request.operationText,'utf8') <= HRS1_LIMITS.wireBytes)
    const raw: unknown = JSON.parse(request.operationText)
    assert.ok(hrs1Data(raw))
    const command = raw as Hrs1Command
    assert.ok(Object.hasOwn(HRS1_FIELDS, command.operation) && hrs1Channel(command.operation) === request.channel)
    assert.equal(command.bindingHash, request.bindingHash)
    assert.match(request.bindingHash, /^[a-f0-9]{64}$/)
    assert.ok(Number.isSafeInteger(request.epoch) && request.epoch > 0)
    assert.ok(/^\d{4}-\d\d-\d\d$/.test(request.legalDate))
    assert.ok(kind === 'writer' ? request.channel !== 'attest'
      : kind === 'verifier' ? request.channel === 'attest' : request.channel === 'read')
    if (poisoned || stopped || signal.aborted || stop.signal.aborted || performance.now() >= deadline
      || budget.active >= 2 || budget.admitted >= 256) return { status: 'unavailable' as const }
    const call: HrsCall = { id: ++budget.admitted, kind, operation: command.operation, dispatched: false, committed: false, drained: false }
    contexts.add(call); budget.active++; budget.maximumActive = Math.max(budget.maximumActive,budget.active); evidence.admitted++
    let began = false, timer: ReturnType<typeof setTimeout> | undefined
    const abort = () => {
      if (!call.control || !call.targetId || call.cancellation) return
      evidence.aborted++
      call.cancellation = lifetime.track(call.control.query(
        'SELECT pg_terminate_backend(pid,1000)::text AS terminated FROM pg_stat_get_activity($1::integer) WHERE backend_start=$2::timestamptz',
        [pgText(call.targetId.pid,23),pgText(call.targetId.birth)]).then(rows => { assert.ok(rows.every(row => row.terminated === 'true')) }))
      void call.cancellation.catch(() => {})
    }
    try {
      call.control = await LocalPgConnection.connect(cluster)
      call.controlId = backendIdentity(await call.control.query(BACKEND_IDENTITY_SQL),cluster.user)
      await call.control.query("SELECT set_config('statement_timeout','1000',false) AS statement_timeout,set_config('lock_timeout','1000',false) AS lock_timeout")
      call.target = await LocalPgConnection.connect(cluster,HRS_LOGINS[kind])
      call.targetId = backendIdentity(await call.target.query(BACKEND_IDENTITY_SQL),HRS_LOGINS[kind])
      signal.addEventListener('abort',abort,{once:true}); stop.signal.addEventListener('abort',abort,{once:true})
      timer = setTimeout(abort,Math.max(0,deadline-performance.now()))
      if (signal.aborted || stop.signal.aborted || performance.now() >= deadline) { abort(); return { status:'unavailable' as const } }
      await call.target.query('BEGIN ISOLATION LEVEL READ COMMITTED'); began = true
      await call.target.query("SELECT set_config('statement_timeout',$1::text,true) AS statement_timeout,set_config('lock_timeout',$1::text,true) AS lock_timeout",
        [pgText(String(Math.max(1,Math.floor(deadline-performance.now()))))])
      if (signal.aborted || stop.signal.aborted || performance.now() >= deadline) return { status:'unconfirmed' as const }
      const remaining = Math.min(HRS1_LIMITS.effectMilliseconds,Math.floor(deadline-performance.now()))
      assert.ok(remaining >= 1)
      call.dispatched = true; evidence.dispatched++
      const rows = await call.target.query(HRS1_SQL[request.channel],[
        pgText(request.operationText),pgText(request.bindingHash),pgText(request.methodId),pgText(String(request.revision),23),
        pgText(request.methodDigest),pgText(request.packageDigest),pgText(String(request.epoch),23),pgText(String(remaining),23),
        pgText(request.notAfter),pgText(request.legalDate),
      ])
      if (signal.aborted || stop.signal.aborted || performance.now() >= deadline) return { status:'unconfirmed' as const }
      const committed = await call.target.commitBefore(deadline,databaseMicroseconds(request.notAfter))
      call.committed = committed.acknowledged && !committed.protectionFailure
      if (!call.committed) return { status:'unconfirmed' as const }
      evidence.acknowledged++
      // Selected test-owned response completion loss after actual guarded COMMIT.
      if (signal.aborted || performance.now() >= deadline || loseResponseFor.delete(command.operation)) {
        evidence.lost++; return { status:'unconfirmed' as const }
      }
      return { status:'acknowledged' as const, rows }
    } catch (error) {
      if (error instanceof LocalPgError && /^[0-9A-Z]{5}$/.test(error.code) && evidence.sqlCodes.length < 256) evidence.sqlCodes.push(error.code)
      return { status:call.dispatched ? 'unconfirmed' as const : 'unavailable' as const }
    } finally {
      if (timer) clearTimeout(timer)
      signal.removeEventListener('abort',abort); stop.signal.removeEventListener('abort',abort)
      let cleanupFailed = false, cleanupFailure: unknown
      const retain = (error: unknown) => { if (!cleanupFailed) { cleanupFailed = true; cleanupFailure = error } }
      try {
        try { await call.cancellation } catch (error) { retain(error) }
        if (call.target && began && !call.committed && !call.cancellation) {
          try { await call.target.query('ROLLBACK') } catch (error) { retain(error) }
        }
        try { call.target?.close() } catch (error) { retain(error) }
        try { call.control?.close() } catch (error) { retain(error) }
        if (call.targetId && call.controlId) {
          try { await drain(call) } catch (error) { retain(error); poison() }
        } else { poison(); retain(Error('hrs1_acquisition_identity_unavailable_owned_cluster_stopped')) }
        assert.ok(call.drained || poisoned,'effect cannot retire until actual backend absence or owned cluster exit')
        if (cleanupFailed) throw cleanupFailure
      } finally {
        budget.active--; contexts.delete(call)
        evidence.calls.push(Object.freeze({ id:call.id,kind,operation:command.operation,target:call.targetId??null,control:call.controlId??null,
          dispatched:call.dispatched,committed:call.committed,drained:call.drained }))
      }
    }
  }
  const executor = (kind: HrsLoginKind): Hrs1TerminalExecutor => Object.freeze<Hrs1TerminalExecutor>({
    executeFixed(request,signal) { return lifetime.run(() => execute(kind,request,signal)) },
  })
  return {
    writer:executor('writer'),reader:executor('reader'),verifier:executor('verifier'),evidence,
    loseNextCommittedResponse(operation: Hrs1Operation) { assert.ok(!loseResponseFor.has(operation)); loseResponseFor.add(operation) },
    activeIdentities: () => [...contexts].filter(call => call.dispatched && call.targetId).map(call => Object.freeze({
      id:call.id,operation:call.operation,target:call.targetId!,control:call.controlId! })),
    snapshot: () => Object.freeze({ active:contexts.size,poisoned,stopped }),
    async dispose() { stopped = true; stop.abort(Error('hrs1_native_executor_disposed')); await cleanupTail;
      assert.equal(contexts.size,0); observer.close(); removeStop() },
  }
}

const RESULT_TABLES=['binding_v1','originals_v1','extractions_v1','qualifications_v1','decisions_v1','archive_pages_v1',
  'versions_v1','heads_v1','projections_v1','operations_v1','outbox_v1','monitor_schedule_v1'] as const
type ResultSnapshot=Readonly<Record<(typeof RESULT_TABLES)[number],readonly Record<string,unknown>[]>>
async function resultSnapshot(connection:LocalPgConnection):Promise<ResultSnapshot>{
  const fields=RESULT_TABLES.map(name=>"'"+name+"',(SELECT COALESCE(jsonb_agg(to_jsonb(t) ORDER BY to_jsonb(t)::text),'[]'::jsonb) FROM official_v3_result_private."+name+' t)')
  return value(await connection.query('SELECT jsonb_build_object('+fields.join(',')+') AS value')) as ResultSnapshot
}
function noResultEffects(snapshot:ResultSnapshot){
  for(const name of RESULT_TABLES)if(!['binding_v1','heads_v1','monitor_schedule_v1'].includes(name))assert.deepEqual(snapshot[name],[],name+' initially empty')
}
function gate(lifetime:OwnedTestLifetime){
  let release!:()=>void
  const pending=new Promise<void>(resolve=>{release=resolve})
  const remove=lifetime.onStop(release)
  return{pending,release(){release();remove()}}
}
async function until(lifetime:OwnedTestLifetime,predicate:()=>Promise<boolean>,milliseconds=2000){
  const end=performance.now()+milliseconds
  for(;;){lifetime.check();if(await predicate())return;assert.ok(performance.now()<end,'bounded actual observation');await lifetime.wait(5)}
}
type HrsNative=Awaited<ReturnType<typeof createHrsNativeExecutors>>
type NativeRequestOverride=Partial<Pick<Hrs1FixedRequest,'bindingHash'|'methodId'|'revision'|'methodDigest'|'packageDigest'|'epoch'|'legalDate'|'notAfter'>>
/** These direct SQL probes are confined to this owned synthetic harness. Their
 * epoch comes from the actual human transaction receipt. Product positives use
 * createV3PostgresResultJobs and its private original MA1 receipt custody. */
async function createHarness(lifetime:OwnedTestLifetime,common:Common,fixture:VisaFixture,budget:HrsBudget){
  const hrs=await createHrsNativeExecutors(common.cluster,lifetime,budget)
  const m04=await createM04NativeExecutors(common.cluster,lifetime)
  const method=await createMa1NativeExecutor(common.cluster,lifetime)
  const written:{command:Command;receipt:Receipt}[]=[]
  let methodHead:MethodHead|null=null,commandSerial=100,disposed=false
  const sourceController=new AbortController(),releaseStops=lifetime.onStop(()=>sourceController.abort())
  const preparations=new Set<Promise<unknown>>(),releaseGates=new Set<()=>void>()
  async function human(action:Action,untilValue:string|null=null){
    const c=command(action,++commandSerial,action==='stage'?null:methodHead,untilValue)
    const receipt=await writeHuman(common,c);written.push({command:c,receipt});methodHead=c.after
    return c
  }
  async function humanPending(action:'revoke'|'approve',untilValue:string|null=null){
    const c=command(action,++commandSerial,methodHead,untilValue),started=performance.now(),notAfter=new Date(Date.now()+5000).toISOString()
    await common.human.connection.query('BEGIN')
    let completed=false
    try{
      const receipt=await writeHuman(common,c)
      return{command:c,receipt,identity:common.human.identity,async commit(){
        assert.equal(completed,false);completed=true
        const committed=await common.human.connection.commitBefore(started+5000,databaseMicroseconds(notAfter))
        assert.equal(committed.acknowledged,true);assert.equal(committed.protectionFailure,undefined)
        written.push({command:c,receipt});methodHead=c.after
      },async rollback(){if(!completed){completed=true;await common.human.connection.query('ROLLBACK')}}}
    }catch(error){await common.human.connection.query('ROLLBACK');throw error}
  }
  async function raw(operation:Hrs1Operation,body:Readonly<Record<string,unknown>>,signal:AbortSignal=sourceController.signal,
    override:NativeRequestOverride={},login?:HrsLoginKind):Promise<Hrs1Reply>{
    assert.ok(methodHead&&methodHead.epoch>0,'direct synthetic probe requires actual human receipt')
    const publicRead=['coverage','projection','projection_current','projection_batch'].includes(operation)
    const milliseconds=publicRead?HRS1_LIMITS.publicMilliseconds:HRS1_LIMITS.effectMilliseconds
    const at=fixture.clock(),deadline=performance.now()+milliseconds
    const verification=typeof body.verificationRef==='string'?fixture.verificationForReference(body.verificationRef):null
    const projection=body.projection as {expiresAt?:unknown}|undefined
    const sourceCap=verification?.validUntilExclusive,projectionCap=typeof projection?.expiresAt==='string'?projection.expiresAt:null
    const notAfter=new Date(Math.min(Date.parse(at.now)+milliseconds,Date.parse(fixture.binding.activeUntilExclusive),
      methodHead.approvalUntil?Date.parse(methodHead.approvalUntil):Infinity,sourceCap?Date.parse(sourceCap):Infinity,
      projectionCap?Date.parse(projectionCap):Infinity,override.notAfter?Date.parse(override.notAfter):Infinity)).toISOString()
    const commandValue:Hrs1Command={schema:1,operation,bindingHash:override.bindingHash??hrs1Hash(fixture.binding),body}
    const request={...HRS_METHOD,epoch:methodHead.epoch,channel:hrs1Channel(operation),operationText:hrs1Canonical(commandValue),
      bindingHash:commandValue.bindingHash,budget:Object.freeze({deadline}),legalDate:at.legalDate,...override,notAfter} as Hrs1FixedRequest
    const kind=login??(request.channel==='attest'?'verifier':request.channel==='execute'?'writer'
      :['coverage','projection','projection_current','projection_batch'].includes(operation)?'reader':'writer')
    const result=await hrs[kind].executeFixed(request,signal)
    return result.status==='acknowledged'?readHrs1Reply(result.rows)??{status:'unconfirmed'}
      :{status:result.status==='blocked_remote_unknown'?'unconfirmed':result.status}
  }
  const fixed:Hrs1FixedOperation=(c,signal,_receipt,notAfter)=>raw(c.operation,c.body,signal,notAfter?{notAfter}:{})
  const source=createHrs1SourceConsumer({binding:fixture.binding,registry:fixture.registry,fixed,clock:fixture.clock,fixtureIssuer:fixture.issuer})
  const ports=createHrs1ResultPorts({binding:fixture.binding,registry:fixture.registry,fixed,clock:fixture.clock,source,ids:fixture.ids})
  const authority=createV3PostgresMethodAuthority(HRS_METHOD,method.executor)
  const intake=createV3PostgresQuarantineBackend(fixture.registry,m04.intake,30000)
  const jobs=createV3PostgresResultJobs({binding:HRS_METHOD,registry:fixture.registry,clock:fixture.clock,
    methodExecutor:method.executor,intakeExecutor:m04.intake,jobsExecutor:m04.jobs,producer:fixture.producer,
    result:{binding:fixture.binding,writerExecutor:hrs.writer,readerExecutor:hrs.reader,verifierExecutor:hrs.verifier,
      fixtureIssuer:fixture.issuer,ids:fixture.ids}})
  async function prepare(tag:string){
    const work=mustRead(createV3WorkIdentity({context:fixture.context,method:METHOD_REF,factKind:'requirement_effect',researchReason:{status:'missing'}}))
    const delivery=fixture.delivery({jobId:fixtureId('job3','hrs1-manual-'+tag),context:fixture.context,research:work.research},tag)
    const parsed=readV3RetainableProposal(delivery.text,fixture.registry);assert.ok(parsed.ok)
    const upload=parsed.value,reference:V3IntakeReference={binding:delivery.binding,proposalDigest:upload.digest,bytes:upload.bytes}
    assert.deepEqual(await intake.capture(delivery.text,reference,sourceController.signal),{status:'recorded',reference})
    const actual=intake.quarantine(delivery.binding),finishGate=gate(lifetime);releaseGates.add(finishGate.release)
    let emit!:(value:Readonly<{outcome:V3ImportOutcome;audit:V3ImportAudit}>)=>void,reject!:(error:unknown)=>void,arrived=false
    const ready=new Promise<Readonly<{outcome:V3ImportOutcome;audit:V3ImportAudit}>>((yes,no)=>{emit=yes;reject=no})
    const quarantine:V3ImportQuarantinePort<object>={reserve:(value,signal)=>actual.reserve(value,signal),async finish(ticket,outcome,audit,signal){
      assert.equal(arrived,false);arrived=true;emit({outcome:detached(outcome),audit:detached(audit)})
      await finishGate.pending
      return actual.finish(ticket,outcome,audit,signal)
    }}
    const coordinator=createV3ImportCoordinator({registry:fixture.registry,method:METHOD_REF,clock:fixture.clock,
      methodAuthority:authority,evidence:source.evidence,history:ports.history,quarantine},{budgetMilliseconds:30000})
    const pending=lifetime.track(coordinator.submit(delivery.text,sourceController.signal));preparations.add(pending)
    void pending.then(result=>{if(!arrived)reject(Error('actual I1 did not reach finish: '+result.status))},reject)
    let captured:Awaited<typeof ready>
    try{captured=await ready}catch(error){finishGate.release();releaseGates.delete(finishGate.release);await pending;preparations.delete(pending);throw error}
    let finished=false
    return{reference,upload,text:delivery.text,outcome:captured.outcome,audit:captured.audit,
      async finish(){
        assert.equal(finished,false);finished=true;finishGate.release();releaseGates.delete(finishGate.release)
        const result=await pending;preparations.delete(pending)
        assert.equal(result.status,'completed');assert.ok(result.status==='completed');assert.equal(result.replayed,false)
        assert.deepEqual(result.outcome,captured.outcome)
        const stored=await intake.read(reference,sourceController.signal)
        assert.equal(stored.status,'recorded');assert.ok(stored.status==='recorded');assert.ok(stored.record.completion)
        assert.deepEqual(stored.record.reference,reference);assert.equal(stored.record.text,delivery.text)
        assert.deepEqual(stored.record.upload,upload);assert.deepEqual(stored.record.completion,{outcome:captured.outcome,audit:captured.audit})
        ports.bindIntake([reference]);return result
      },
    }
  }
  function verification(outcome:V3ImportOutcome){
    assert.ok(outcome.status==='prepared'||outcome.status==='escalation')
    const decision=outcome.status==='prepared'?outcome.value.decision:outcome.decision
    const v=fixture.verificationForDecision(decision);assert.ok(v);assert.deepEqual(v.decision,decision)
    return v
  }
  function transition(item:Awaited<ReturnType<typeof prepare>>){
    assert.equal(item.outcome.status,'prepared');assert.ok(item.outcome.status==='prepared')
    const prepared=item.outcome.value,plan=mustRead(createV3TransitionIdempotencyKey(prepared.transition))
    return{operationKey:hrs1Ref('version-commit',{planKey:plan,prepared}),prepared,
      expectedHead:{pointer:prepared.transition.expected,sourceDecisionRef:prepared.previousDecision?.reference??null,
        historyArchive:prepared.previousDecision?.historyArchive??null},verificationRef:verification(item.outcome).reference,intake:item.reference}
  }
  function escalation(item:Awaited<ReturnType<typeof prepare>>){
    assert.equal(item.outcome.status,'escalation');assert.ok(item.outcome.status==='escalation')
    return{operationId:item.upload.proposal.operationId,operationKey:hrs1Ref('escalation-publish',{digest:item.upload.digest,outcome:item.outcome}),
      upload:item.upload,outcome:item.outcome,verificationRef:verification(item.outcome).reference,intake:item.reference}
  }
  async function worker(tag:string){
    const input=fixture.ruleInput(tag),work=mustRead(createV3WorkIdentity({context:input.context,method:input.method,
      factKind:input.factKind,researchReason:input.researchReason}))
    const enqueued=await lifetime.run(()=>jobs.enqueueRule(input,sourceController.signal))
    assert.equal(enqueued.status,'confirmed');assert.ok(enqueued.status==='confirmed')
    const claim=fixture.claim(work.jobKey,tag),result=await lifetime.run(()=>jobs.workOnce(claim,sourceController.signal))
    assert.equal(result.status,'processed');assert.ok(result.status==='processed')
    assert.equal(result.worker.status,'completed');assert.equal(result.worker.acceptedRule,false)
    assert.equal(result.worker.job.state,'succeeded');assert.equal(result.worker.job.jobId,enqueued.record.jobId)
    assert.ok(result.worker.job.kind==='research_job_record')
    assert.deepEqual(result.worker.job.method,METHOD_REF)
    const latest=fixture.delivered.at(-1);assert.ok(latest)
    const reference:V3IntakeReference={binding:latest.binding,proposalDigest:sha256Hex(latest.text),bytes:Buffer.byteLength(latest.text,'utf8')}
    const stored=await intake.read(reference,sourceController.signal);assert.equal(stored.status,'recorded');assert.ok(stored.status==='recorded'&&stored.record.completion)
    assert.equal(stored.record.text,latest.text);assert.deepEqual(stored.record.reference,reference)
    return{input,claim,result,reference,record:stored.record,enqueued:enqueued.record}
  }
  return{common,fixture,hrs,m04,method,ports,source,intake,jobs,authority,human,humanPending,raw,prepare,transition,escalation,verification,worker,written,
    signal:sourceController.signal,head:()=>methodHead,
    async dispose(){if(disposed)return;disposed=true;sourceController.abort();for(const release of releaseGates)release();releaseGates.clear()
      const settled=await lifetime.drain([...preparations]);preparations.clear();assert.ok(settled.every(x=>x.status==='fulfilled'))
      await hrs.dispose();await m04.dispose();method.closeObserver();releaseStops()
    },
  }
}
type Harness=Awaited<ReturnType<typeof createHarness>>
type PreparedItem=Awaited<ReturnType<Harness['prepare']>>
async function blocked(lifetime:OwnedTestLifetime,h:Harness,operation:Hrs1Operation,blocker:BackendIdentity):Promise<BackendIdentity>{
  let found:BackendIdentity|null=null
  await until(lifetime,async()=>{
    for(const call of h.hrs.activeIdentities().filter(x=>x.operation===operation)){
      const rows=await h.common.observer.connection.query(`SELECT a.pid::text AS pid,a.backend_start::text AS birth,
        ($3::integer=ANY(pg_blocking_pids(a.pid)))::text AS blocked,a.wait_event_type::text AS wait_type
        FROM pg_stat_activity a WHERE a.pid=$1::integer AND a.backend_start=$2::timestamptz`,text([call.target.pid,call.target.birth,blocker.pid]))
      if(rows[0]?.blocked==='true'&&rows[0]?.wait_type==='Lock'){found=call.target;return true}
    }return false
  });assert.ok(found);return found
}
async function resultLocker(lifetime:OwnedTestLifetime,h:Harness,table:'heads_v1'|'outbox_v1'){
  const own=await connect(lifetime,h.common.cluster)
  await own.connection.query('BEGIN');await own.connection.query('LOCK TABLE official_v3_result_private.'+table+' IN SHARE MODE')
  let released=false
  const stop=lifetime.onStop(()=>own.connection.close())
  return{...own,async release(){if(released)return;released=true;await own.connection.query('ROLLBACK');own.connection.close();stop()
    await proveAbsent(lifetime,h.common.observer.connection,[own.identity])}}
}
function projectionBinding(projection:V3PublicProjectionRecord):V3ProjectionBinding{return{projectionRef:projection.reference,
  projectionHash:hrs1Hash(projection),versionRef:projection.rule.reference,revision:projection.rule.revision,
  contextKey:projection.rule.subject.contextKey,factKind:projection.rule.subject.fact.fact.kind,method:projection.rule.method,
  sourceDecisionRef:projection.rule.sourceDecisionRef,evidenceVersionId:projection.rule.subject.evidence.versionId,sourceFreshUntil:projection.sourceFreshUntil}}
function publicKey(fixture:VisaFixture){return{destinationCountryCode:'DE',citizenshipCountryCode:'CH',contextKey:fixture.binding.contextKey,
  factKind:'requirement_effect' as const,method:METHOD_REF}}

async function n01(lifetime:OwnedTestLifetime,commons:readonly Common[],budget:HrsBudget){
  for(const common of commons){
    await creatorIdentity(common.creator.connection);await frozen(common)
    noResultEffects(await resultSnapshot(common.bootstrap.connection))
    const actual=JSON.parse(common.resultIdentity) as {catalog:unknown}
    assert.deepEqual(value(await common.creator.connection.query('SELECT ('+HRS_CATALOG_SQL+') AS value')),actual.catalog,
      'restricted Creator independently reads the complete original metadata without ResultOwner membership')
    for(const kind of ['writer','reader','verifier'] as const){
      const caller=await connect(lifetime,common.cluster,HRS_LOGINS[kind])
      async function forbiddenApi(channel:'attest'|'execute'|'read'){
        assert.ok(budget.admitted<256&&budget.active<2)
        budget.admitted++;budget.directAdmitted++;budget.active++;budget.maximumActive=Math.max(budget.maximumActive,budget.active)
        try{await assert.rejects(caller.connection.query(HRS1_SQL[channel],text(['{}','0'.repeat(64),HRS_METHOD.methodId,1,
          HRS_METHOD.methodDigest,HRS_METHOD.packageDigest,1,1000,new Date(Date.now()+1000).toISOString(),'2000-01-01'])),stateError('42501'))}
        finally{budget.directSettled++;budget.active--}
      }
      try{
        await assert.rejects(caller.connection.query('SET ROLE ot_v3_result_owner'),stateError('42501'))
        await assert.rejects(caller.connection.query('SELECT * FROM official_v3_result_private.originals_v1'),stateError('42501'))
        const forbidden=kind==='writer'?'attest':'execute'
        await forbiddenApi(forbidden)
        if(kind==='verifier')await forbiddenApi('read')
        await assert.rejects(caller.connection.query('SELECT official_v3_method_private.require_current_locked_v1($1::text,$2::integer,$3::text,$4::text,$5::integer)',
          text([HRS_METHOD.methodId,1,HRS_METHOD.methodDigest,HRS_METHOD.packageDigest,1])),stateError('42501'))
      }finally{caller.connection.close();await proveAbsent(lifetime,common.observer.connection,[caller.identity])}
    }
    await frozen(common)
  }
}
async function n02(h:Harness){
  const {fixture}=h,b=fixture.binding
  const refused=[null,{}, {...b,qualificationScope:'pilot_window'},{...b,context:{...b.context,route:'unresolved'}},
    {...b,context:{...b.context,conditions:{status:'unresolved'}}},{...b,context:{...b.context,scope:{...b.context.scope,
      credentialOption:{mode:'option',documentType:'unknown',issuingCountryCode:'CH',relatedCitizenshipCountryCode:'CH'}}}},
    {...b,context:{...b.context,scope:{...b.context.scope,citizenship:{mode:'required',countryCodes:['DE']}}}},
    {...b,contextKey:'official-truth-context:v3:'+'0'.repeat(64)},{...b,sources:[]},
    {...b,sources:b.sources.map(s=>({...s,canonicalUrl:'https://foreign.example/rules'}))},
    {...b,sources:b.sources.map(s=>({...s,source:{...s.source,contentItemVersion:2}}))},
    {...b,sources:b.sources.map(s=>({...s,executableDigest:'unqualified'}))},
    {...b,methodDigest:'invalid'},{...b,packageDigest:'invalid'},{...b,revision:0},
    {...b,activeUntilExclusive:b.activeFrom},{...b,legalTimeZone:'Unknown/Unqualified'},
  ]
  for(const candidate of refused)assert.equal(readHrs1Binding(candidate,fixture.registry),null)
  assert.deepEqual(readHrs1Binding(b,fixture.registry),b)
  const production=readHrs1Binding({...b,dataMode:'official_projection'},fixture.registry);assert.ok(production)
  const closed=createHrs1SourceConsumer({binding:production,registry:fixture.registry,clock:fixture.clock,
    fixtureIssuer:fixture.issuer,fixed:async()=>{assert.fail('closed production issuance cannot dispatch')}})
  assert.equal(closed.available,false,'synthetic issuer cannot activate production')
  const absent=createHrs1SourceConsumer({binding:b,registry:fixture.registry,clock:fixture.clock,
    fixed:async()=>{assert.fail('missing custody cannot dispatch')}})
  assert.equal(absent.available,false)
  await h.human('stage');await h.human('approve')
  const before=await resultSnapshot(h.common.bootstrap.connection)
  const body={contextKey:b.contextKey,factKind:b.factKind}
  for(const override of [{methodDigest:'0'.repeat(64)},{packageDigest:'0'.repeat(64)},{revision:2},
    {methodId:'hrs1-foreign-method'},{epoch:h.head()!.epoch+1},{bindingHash:'0'.repeat(64)}]){
    const reply=await h.raw('history',body,h.signal,override)
    assert.ok(['unavailable','unconfirmed','not_current'].includes(reply.status),'full actual tuple refuses mismatches')
    assert.deepEqual(await resultSnapshot(h.common.bootstrap.connection),before)
  }
  const foreign=await h.raw('history',{...body,contextKey:'official-truth-context:v3:'+'0'.repeat(64)})
  assert.ok(['unavailable','unconfirmed','not_current'].includes(foreign.status))
  assert.deepEqual(await resultSnapshot(h.common.bootstrap.connection),before)
  const readerPrivate=await h.raw('history',body,h.signal,{},'reader')
  assert.ok(['unavailable','unconfirmed'].includes(readerPrivate.status),'public Reader cannot enter a private read with a valid tuple')
  assert.deepEqual(await resultSnapshot(h.common.bootstrap.connection),before)
}
async function n03(h:Harness){
  const incomplete=await h.prepare('n03-incomplete'),body=h.transition(incomplete)
  const pending=await h.intake.read(incomplete.reference,h.signal)
  assert.equal(pending.status,'recorded');assert.ok(pending.status==='recorded');assert.equal(pending.record.completion,null)
  const before=await resultSnapshot(h.common.bootstrap.connection)
  const refusal=await h.raw('transition',body)
  assert.ok(['unavailable','unconfirmed','not_current'].includes(refusal.status),'actual existing S1 operation without finish cannot publish')
  assert.deepEqual(await resultSnapshot(h.common.bootstrap.connection),before)
  await incomplete.finish()
  const variants=[{...incomplete.reference,bytes:incomplete.reference.bytes+1},
    {...incomplete.reference,proposalDigest:'0'.repeat(64)},
    ...(['runnerId','deliveryId','inputRevision'] as const).map(field=>({...incomplete.reference,binding:{...incomplete.reference.binding,
      [field]:field==='inputRevision'?'snapshot:'+'0'.repeat(64):(field==='runnerId'?'runner3_':'delivery3_')+'0'.repeat(32)}}))]
  for(const intake of variants){
    const reply=await h.raw('transition',{...body,intake})
    assert.ok(['unavailable','unconfirmed','not_current'].includes(reply.status),'full S1 original binding refuses '+hrs1Hash(intake))
    assert.deepEqual(await resultSnapshot(h.common.bootstrap.connection),before)
  }
  const initialRead=await h.raw('projection',{key:publicKey(h.fixture)})
  assert.equal(initialRead.status,'missing','a real completed S1 prepared result alone is not a public answer')
  // Seed the selected initial-conflict proof before any version exists. N11
  // later checks its retained evidence alongside monitor/source-change effects.
  h.fixture.refresh('conflicts')
  const conflict=await h.prepare('n03-initial-conflict');await conflict.finish()
  assert.equal(conflict.outcome.status,'escalation');assert.ok(conflict.outcome.status==='escalation')
  assert.equal(conflict.outcome.reason,'comparable_conflict')
  const escalation=h.escalation(conflict)
  assert.equal((await h.raw('escalation',escalation)).status,'reported')
  assert.equal((await h.raw('escalation_confirm',escalation)).status,'confirmed')
  const first=await resultSnapshot(h.common.bootstrap.connection)
  assert.equal(first.versions_v1.length,0);assert.equal(first.projections_v1.length,0);assert.equal(first.outbox_v1.length,1)
  const history=await h.raw('history',{contextKey:h.fixture.binding.contextKey,factKind:'requirement_effect'})
  assert.equal(history.status,'snapshot')
  const state=history.value as {history:V3ImportHistory;stickyDecision:V3SourceDecisionRecord;suppressionEpoch:number}
  assert.deepEqual(state.history.pointer,{revision:0,state:'missing',versionRef:null});assert.equal(state.history.version,null);assert.equal(state.history.decision,null)
  assert.deepEqual(state.stickyDecision,conflict.outcome.decision);assert.ok(state.suppressionEpoch>0)
  h.fixture.refresh('not_found')
  const sticky=await h.prepare('n03-sticky-without-counter');await sticky.finish()
  assert.equal(sticky.outcome.status,'escalation');assert.ok(sticky.outcome.status==='escalation')
  assert.equal(sticky.outcome.reason,'comparable_conflict');assert.equal(sticky.outcome.key,conflict.outcome.key)
  assert.deepEqual(sticky.outcome.decision.knownConflicts,conflict.outcome.decision.knownConflicts)
  assert.equal((await h.raw('escalation',h.escalation(sticky))).status,'reported')
  const repeated=await resultSnapshot(h.common.bootstrap.connection)
  assert.equal(repeated.versions_v1.length,0);assert.equal(repeated.outbox_v1.length,1,'same initial escalation key is one outbox item')
  assert.deepEqual(repeated.outbox_v1,first.outbox_v1,'dedup preserves original outbox bytes and birth time')
  // With no accepted version there is no fabricated M1 target: the actual
  // bounded durable monitor claim schedules this same existing M04 rule queue.
  const retry=await h.jobs.monitorOnce(h.signal)
  assert.equal(retry.status,'complete')
  const initialWork=mustRead(createV3WorkIdentity({context:h.fixture.context,method:METHOD_REF,
    factKind:'requirement_effect',researchReason:{status:'missing'}}))
  assert.ok(retry.outcomes.some(outcome=>outcome.status==='research_queued'&&outcome.jobKey===initialWork.jobKey))
  assert.ok(retry.outcomes.every(outcome=>outcome.ruleChange==='not_asserted'))
  const retried=await resultSnapshot(h.common.bootstrap.connection)
  const initialClaims=retried.operations_v1.filter(row=>row.operation_kind==='monitor_claim')
  assert.equal(initialClaims.length,1)
  const claimValue=initialClaims[0]!.result as NativeMonitorClaim
  assert.equal(claimValue.initialResearch,true);assert.equal(claimValue.plan.targets.length,0)
  assert.equal(claimValue.planGeneration,Number(repeated.heads_v1[0]!.generation))
  assert.deepEqual(retried.heads_v1,repeated.heads_v1)
  assert.deepEqual(retried.versions_v1,[]);assert.deepEqual(retried.projections_v1,[])
  assert.deepEqual(retried.decisions_v1,repeated.decisions_v1)
  assert.deepEqual(retried.outbox_v1,first.outbox_v1,'initial retry preserves genuine sticky evidence and its sole outbox row')
  const scheduled=retried.monitor_schedule_v1[0]!
  assert.equal(scheduled.claimed_by,null);assert.equal(scheduled.lease_until,null)
  assert.ok(typeof scheduled.finish_operation==='string')
  const queueState=await effectHistory(h.common.bootstrap.connection) as {subjects:{job_key:string;current_job:unknown}[]}
  const queuedRows=queueState.subjects.filter(row=>row.job_key===initialWork.jobKey)
  assert.equal(queuedRows.length,1)
  const queued=mustRead(readV3ResearchJobRecord(queuedRows[0]!.current_job))
  assert.equal(queued.jobKey,initialWork.jobKey);assert.equal(queued.state,'queued')
  assert.equal(queued.attempt,0);assert.equal(queued.attemptLimit,h.fixture.binding.attemptLimit)
  assert.deepEqual(queued.method,METHOD_REF);assert.deepEqual(queued.context,h.fixture.context)
  return{incomplete,conflict,sticky,initialOutbox:first.outbox_v1,initialHistory:state}
}
async function n04(h:Harness){
  h.fixture.refresh('agrees');h.fixture.control.resolve=true
  const count=h.fixture.control.finalizations,worked=await h.worker('n04-real-published')
  assert.equal(worked.result.worker.job.jobId,worked.enqueued.jobId,'the actual canonical queue record is claimed, including a pending initial research cycle')
  assert.equal(worked.result.results.length,1);const published=worked.result.results[0]!
  assert.equal(published.status,'published');assert.ok(published.status==='published')
  assert.ok(h.fixture.control.finalizations>count,'actual I1 decision finalized after inspection through private custody')
  assert.equal(worked.record.completion!.outcome.status,'prepared')
  const outcome=worked.record.completion!.outcome;assert.ok(outcome.status==='prepared')
  assert.equal(outcome.value.proposalDisposition,'superseded_by_source')
  assert.equal(outcome.value.version.subject.fact.fact.kind,'requirement_effect')
  assert.deepEqual(outcome.value.version.subject.fact.fact,{kind:'requirement_effect',effect:'not_required'})
  assert.equal(published.versionRef,outcome.value.version.reference)
  const v=h.verification(outcome)
  assert.ok(v.decision.evaluatedAt>v.request.clock.now);assert.ok(h.fixture.clock().now>=v.decision.evaluatedAt)
  assert.ok(v.originals.every(o=>o.observation!==null&&o.rawDigest===sha256Hex(o.bodyText)))
  assert.ok(v.decision.knownConflicts.length>0&&v.decision.knownConflicts.every(c=>c.resolution!==null),'initial sticky conflict needs actual resolution')
  const stored=await h.raw('projection',{key:publicKey(h.fixture)})
  assert.equal(stored.status,'current');assert.ok(Array.isArray(stored.value)&&stored.value.length===1)
  const projection=mustRead(readV3PublicProjectionRecord(stored.value[0],h.fixture.registry,h.fixture.clock()))
  assert.equal(projection.reference,published.projectionRef);assert.deepEqual(projection.rule,outcome.value.version)
  assert.equal((await h.raw('projection_current',{binding:projectionBinding(projection)})).status,'current')
  assert.equal((await h.raw('projection_batch',{bindings:[projectionBinding(projection)]})).status,'confirmed')
  const issuerWork=()=>({inspect:h.fixture.control.inspections,finalize:h.fixture.control.finalizationAttempts,
    reprove:h.fixture.control.reproofs,observe:h.fixture.control.observations,extract:h.fixture.control.extracts,reopen:h.fixture.control.reopens})
  const beforeIssuerWork=issuerWork()
  const answer=await h.jobs.query({destinationCountryCode:'DE',citizenshipCountryCodes:['CH']},h.signal)
  assert.equal(answer.ok,true);assert.ok(answer.ok)
  assert.equal(answer.answer.response.dataMode,'synthetic_test');assert.equal(answer.answer.response.notice,'SYNTHETIC_TEST_DATA_NO_TRAVEL_ADVICE')
  const accepted=answer.answer.response.cells.flatMap(c=>c.results).filter(r=>r.status==='accepted')
  assert.equal(accepted.length,1);assert.equal(accepted[0]!.projection.reference,projection.reference)
  assert.equal(answer.answer.sources[projection.reference]?.href,fixtureUrl('primary'))
  assert.deepEqual(issuerWork(),beforeIssuerWork,'the actual accepted cache hit performs zero source-issuer work, including rejected calls and reopen')
  await frozen(h.common)
  return{worked,projection,verification:v}
}
async function n05(lifetime:OwnedTestLifetime,h:Harness){
  const left=await h.prepare('n05-left');await left.finish()
  const right=await h.prepare('n05-right');await right.finish()
  const bodies=[h.transition(left),h.transition(right)]
  assert.deepEqual(bodies[0]!.expectedHead,bodies[1]!.expectedHead)
  assert.notEqual(bodies[0]!.prepared.transition.operationId,bodies[1]!.prepared.transition.operationId)
  const before=await resultSnapshot(h.common.bootstrap.connection),lock=await resultLocker(lifetime,h,'heads_v1')
  const pending=bodies.map(body=>lifetime.run(()=>h.raw('transition',body)))
  let seen:readonly BackendIdentity[]=[],failure:unknown,failed=false,settled:PromiseSettledResult<Hrs1Reply>[]=[]
  try{
    await until(lifetime,async()=>{
      const calls=h.hrs.activeIdentities().filter(x=>x.operation==='transition');if(calls.length!==2)return false
      const rows=await h.common.observer.connection.query(`SELECT a.pid::text AS pid,a.backend_start::text AS birth,
        array_to_json(pg_blocking_pids(a.pid))::text AS blockers,a.wait_event_type::text AS wait_type
        FROM pg_stat_activity a WHERE a.pid=ANY($1::integer[]) ORDER BY a.pid`,text(['{'+calls.map(x=>x.target.pid).join(',')+'}']))
      if(rows.length!==2)return false
      assert.ok(rows.every(row=>calls.some(c=>c.target.pid===row.pid&&c.target.birth===row.birth)))
      if(rows.some(row=>row.wait_type!=='Lock'||!row.blockers))return false
      const direct=rows.filter(row=>(JSON.parse(row.blockers!) as number[]).includes(Number(lock.identity.pid)))
      if(direct.length!==1)return false
      const serialized=rows.find(row=>row.pid!==direct[0]!.pid)
      if(!serialized||(JSON.parse(serialized.blockers!) as number[]).includes(Number(direct[0]!.pid))===false)return false
      // The first writer waits on the actual head table; the second waits on
      // that writer's real exclusive HRS advisory lock before reading the head.
      seen=rows.map(r=>({pid:r.pid!,birth:r.birth!}));return true
    })
  }catch(error){failed=true;failure=error}
  finally{await lock.release();settled=await Promise.allSettled(pending)}
  if(failed)throw failure
  assert.equal(seen.length,2);assert.ok(settled.every(r=>r.status==='fulfilled'))
  const replies=settled.map(r=>{assert.ok(r.status==='fulfilled');return r.value})
  assert.deepEqual(replies.map(r=>r.status).sort(),['committed','stale_head'])
  const winner=replies.findIndex(r=>r.status==='committed'),loser=1-winner
  const after=await resultSnapshot(h.common.bootstrap.connection)
  assert.equal(after.versions_v1.length,before.versions_v1.length+1)
  for(const row of before.versions_v1)assert.ok(after.versions_v1.some(next=>hrs1Same(next,row)))
  const current=await h.raw('head',{contextKey:h.fixture.binding.contextKey,factKind:'requirement_effect'})
  assert.equal(current.status,'current')
  assert.deepEqual((current.value as V3VersionHead).pointer,bodies[winner]!.prepared.transition.next)
  assert.equal((await h.raw('transition',bodies[winner]!)).status,'committed')
  assert.deepEqual(await resultSnapshot(h.common.bootstrap.connection),after,'duplicate successful operation adds no version or audit')
  return{winner:winner===0?left:right,loser:loser===0?left:right,winnerBody:bodies[winner]!,loserBody:bodies[loser]!,waiters:seen}
}

async function n06(lifetime:OwnedTestLifetime,h:Harness,race:Awaited<ReturnType<typeof n05>>){
  assert.equal(race.waiters.length,2)
  const historicalLoser=await h.raw('transition_current',race.loserBody)
  assert.ok(['not_current','stale_head'].includes(historicalLoser.status),'the actual waited losing head remains refused')
  const item=await h.prepare('n06-method-waits');await item.finish();const body=h.transition(item)
  const before=await resultSnapshot(h.common.bootstrap.connection)
  const oldEpoch=h.head()!.epoch,revoke=await h.humanPending('revoke')
  const pending=lifetime.run(()=>h.raw('transition',body,h.signal,{epoch:oldEpoch}))
  let reply:Hrs1Reply|undefined
  try{
    await blocked(lifetime,h,'transition',revoke.identity)
    await revoke.commit();reply=await pending
  }finally{await revoke.rollback();await Promise.allSettled([pending])}
  assert.ok(reply&&['unavailable','unconfirmed','not_current'].includes(reply.status),'actual committed revoke after MA1 wait refuses transition')
  assert.deepEqual(await resultSnapshot(h.common.bootstrap.connection),before)
  const approve=await h.humanPending('approve')
  const oldAgain=lifetime.run(()=>h.raw('transition',body,h.signal,{epoch:oldEpoch}))
  try{
    await blocked(lifetime,h,'transition',approve.identity)
    await approve.commit();reply=await oldAgain
  }finally{await approve.rollback();await Promise.allSettled([oldAgain])}
  assert.ok(reply&&['unavailable','unconfirmed','not_current'].includes(reply.status),'reapproved same tuple with a different actual epoch refuses the old epoch')
  assert.ok(h.head()!.epoch>oldEpoch);assert.deepEqual(await resultSnapshot(h.common.bootstrap.connection),before)
}
async function actualTimePassed(lifetime:OwnedTestLifetime,owner:LocalPgConnection,instant:string,milliseconds=4500){
  await until(lifetime,async()=>scalar(await owner.query('SELECT (clock_timestamp()>$1::timestamptz)::text AS passed',text([instant])),'passed')==='true',milliseconds)
}
async function waitedRefusal(lifetime:OwnedTestLifetime,h:Harness,body:Readonly<Record<string,unknown>>,afterWait:()=>Promise<void>,override:NativeRequestOverride={}){
  const before=await resultSnapshot(h.common.bootstrap.connection),lock=await resultLocker(lifetime,h,'heads_v1')
  const pending=lifetime.run(()=>h.raw('transition',body,h.signal,override))
  let reply:Hrs1Reply|undefined
  try{await blocked(lifetime,h,'transition',lock.identity);await afterWait()}
  finally{await lock.release();const settled=await Promise.allSettled([pending]);assert.ok(settled[0]?.status==='fulfilled');reply=settled[0].value}
  assert.ok(reply&&['unavailable','unconfirmed','not_current'].includes(reply.status))
  assert.deepEqual(await resultSnapshot(h.common.bootstrap.connection),before,'late refusal leaves all twelve Result tables exact')
}
async function n07(lifetime:OwnedTestLifetime,h:Harness){
  h.fixture.refresh('agrees');h.fixture.control.expiresAt=new Date(Date.now()+3000).toISOString()
  const source=await h.prepare('n07-source-expiry');await source.finish()
  const expires=h.verification(source.outcome).validUntilExclusive
  assert.ok(expires>h.fixture.clock().now)
  await waitedRefusal(lifetime,h,h.transition(source),()=>actualTimePassed(lifetime,h.common.observer.connection,expires))
  h.fixture.refresh('agrees')
  const method=await h.prepare('n07-method-expiry');await method.finish()
  await h.human('revoke')
  const methodUntil=databaseMicroseconds(new Date(Date.now()+2000).toISOString())
  await h.human('approve',methodUntil)
  await waitedRefusal(lifetime,h,h.transition(method),()=>actualTimePassed(lifetime,h.common.observer.connection,methodUntil))
  const expiredRead=await h.raw('projection',{key:publicKey(h.fixture)})
  assert.ok(expiredRead.status!=='current','fresh transaction cannot serve expired method approval')
  await h.human('revoke');await h.human('approve')
  const calendar=await h.prepare('n07-calendar');await calendar.finish()
  const actual=h.fixture.clock().legalDate
  const previousDay=new Date(Date.parse(actual+'T00:00:00.000Z')-86400000).toISOString().slice(0,10)
  assert.notEqual(actual,previousDay)
  // A separately bound stale legal day reaches the real post-lock fence. This
  // does not simulate or claim that physical midnight occurred during the test.
  await waitedRefusal(lifetime,h,h.transition(calendar),async()=>{
    assert.equal(h.fixture.clock().legalDate,actual)
  },{legalDate:previousDay})
  const currentDay=await h.raw('history',{contextKey:h.fixture.binding.contextKey,factKind:'requirement_effect'})
  assert.equal(currentDay.status,'snapshot','fresh actual selected-calendar read remains available')
}
async function n08(lifetime:OwnedTestLifetime,h:Harness){
  h.fixture.refresh('unclear')
  const item=await h.prepare('n08-late-write-failure');await item.finish()
  assert.equal(item.outcome.status,'escalation');assert.ok(item.outcome.status==='escalation')
  assert.equal(item.outcome.reason,'primary_unclear')
  const original=h.verification(item.outcome).originals.find(o=>o.qualification.role==='primary');assert.ok(original)
  assert.equal(original.observation,null,'qualified genuine ambiguity has no manufactured fact')
  const before=await resultSnapshot(h.common.bootstrap.connection),lock=await resultLocker(lifetime,h,'outbox_v1')
  const abort=new AbortController(),aborted=h.hrs.evidence.aborted
  const pending=lifetime.run(()=>h.raw('escalation',h.escalation(item),abort.signal))
  let reply:Hrs1Reply|undefined,target:BackendIdentity|undefined
  try{
    target=await blocked(lifetime,h,'escalation',lock.identity)
    abort.abort(Error('selected actual late outbox write cancellation'))
    reply=await pending
  }finally{abort.abort();await Promise.allSettled([pending]);await lock.release()}
  assert.equal(reply?.status,'unconfirmed');assert.ok(h.hrs.evidence.aborted>aborted)
  assert.ok(target&&h.hrs.evidence.calls.some(c=>c.operation==='escalation'&&c.target?.pid===target.pid&&c.target.birth===target.birth&&c.drained&&!c.committed))
  assert.deepEqual(await resultSnapshot(h.common.bootstrap.connection),before,
    'late outbox cancellation rolls back decision/archive/head/audit/operation together')
  return item
}
function publication(h:Harness,item:PreparedItem){
  assert.ok(item.outcome.status==='prepared');const prepared=item.outcome.value,proof=h.verification(item.outcome)
  const builtAt=prepared.version.recordedAt,desired=new Date(Date.parse(builtAt)+h.fixture.binding.projectionMaxAgeMilliseconds).toISOString()
  const result=prepareV3VisitorProjection({rule:prepared.version,decision:prepared.decision,builtAt,
    expiresAt:desired<proof.validUntilExclusive?desired:proof.validUntilExclusive,sourceFreshUntil:proof.validUntilExclusive},h.fixture.registry,h.fixture.clock())
  assert.equal(result.status,'prepared');assert.ok(result.status==='prepared')
  const operationId=prepared.transition.operationId
  return{operationId,operationKey:hrs1Ref('projection-publish',{operationId,prepared,projection:result.projection}),prepared,
    projection:result.projection,verificationRef:proof.reference,intake:item.reference}
}
async function publishPrepared(h:Harness,item:PreparedItem){
  const body=publication(h,item)
  assert.equal((await h.raw('publication',body)).status,'reported')
  const confirmed=await h.raw('publication_confirm',body);assert.equal(confirmed.status,'confirmed')
  assert.deepEqual((confirmed.value as {projectionRef:string;versionRef:string}).projectionRef,body.projection.reference)
  assert.equal((confirmed.value as {projectionRef:string;versionRef:string}).versionRef,body.prepared.version.reference)
  return body
}
async function n09(h:Harness){
  h.fixture.refresh('agrees')
  const lost=await h.prepare('n09-lost-commit-ack');await lost.finish();const body=h.transition(lost)
  const before=await resultSnapshot(h.common.bootstrap.connection),start=h.hrs.evidence.lost
  h.hrs.loseNextCommittedResponse('transition')
  assert.equal((await h.raw('transition',body)).status,'unconfirmed')
  assert.equal(h.hrs.evidence.lost,start+1)
  const committed=await resultSnapshot(h.common.bootstrap.connection)
  assert.equal(committed.versions_v1.length,before.versions_v1.length+1)
  const actual=h.hrs.evidence.calls.at(-1);assert.ok(actual&&actual.operation==='transition'&&actual.committed&&actual.drained)
  const same={operationId:body.prepared.transition.operationId,operationKey:body.operationKey}
  const confirmation=await h.raw('version_confirm',same);assert.equal(confirmation.status,'committed')
  assert.equal((confirmation.value as {versionRef:string}).versionRef,body.prepared.version.reference)
  assert.deepEqual(await h.raw('version_confirm',same),confirmation,'same operation confirms original immutable commit')
  assert.deepEqual(await resultSnapshot(h.common.bootstrap.connection),committed,'confirmation does not retry writes')
  const changed={...body.prepared,proposalDisposition:'matched' as const}
  assert.notEqual(body.prepared.proposalDisposition,changed.proposalDisposition)
  const different={...body,prepared:changed,operationKey:hrs1Ref('version-commit',{
    planKey:mustRead(createV3TransitionIdempotencyKey(changed.transition)),prepared:changed})}
  assert.equal((await h.raw('transition',different)).status,'collision')
  assert.deepEqual(await resultSnapshot(h.common.bootstrap.connection),committed)
  const next=await h.prepare('n09-new-head');await next.finish();const nextBody=h.transition(next)
  assert.equal((await h.raw('transition',nextBody)).status,'committed')
  const projected=await publishPrepared(h,next)
  assert.deepEqual(await h.raw('version_confirm',same),confirmation,'historical acknowledgement remains historical')
  assert.ok(['not_current','stale_head'].includes((await h.raw('transition_current',body)).status))
  return{lost,body,confirmation,next,projected}
}

async function n10(lifetime:OwnedTestLifetime,h:Harness,previous:Awaited<ReturnType<typeof n04>>,current:Awaited<ReturnType<typeof n09>>){
  const binding=projectionBinding(current.projected.projection)
  assert.equal((await h.raw('projection_current',{binding})).status,'current')
  assert.equal((await h.raw('projection_batch',{bindings:[binding]})).status,'confirmed')
  assert.ok(['not_current','missing'].includes((await h.raw('projection_current',{binding:projectionBinding(previous.projection)})).status),
    'prior projection cannot survive an actual later head')
  const held=await h.ports.visitor.current.reprove(binding,h.signal);assert.equal(held.status,'current');assert.ok(held.status==='current')
  const calls=h.hrs.evidence.admitted
  assert.equal((await h.ports.visitor.current.confirmBatch([{binding,receipt:{...held.receipt}}],{},h.fixture.clock(),h.signal)).status,'unavailable')
  assert.equal(h.hrs.evidence.admitted,calls,'serialized projection receipt cannot cross the private WeakMap')
  h.fixture.refresh('unclear')
  const ambiguous=await h.prepare('n10-current-read-suppression');await ambiguous.finish()
  assert.ok(ambiguous.outcome.status==='escalation'&&ambiguous.outcome.reason==='primary_unclear')
  const lock=await resultLocker(lifetime,h,'outbox_v1'),writer=lifetime.run(()=>h.raw('escalation',h.escalation(ambiguous)))
  const abortSingle=new AbortController()
  let single:Promise<Hrs1Reply>|undefined,batch:Promise<Hrs1Reply>|undefined
  try{
    const writerIdentity=await blocked(lifetime,h,'escalation',lock.identity)
    single=lifetime.run(()=>h.raw('projection_current',{binding},abortSingle.signal))
    await blocked(lifetime,h,'projection_current',writerIdentity)
    abortSingle.abort(Error('join single read before admitting second reader'))
    assert.equal((await single).status,'unconfirmed')
    assert.equal(h.hrs.snapshot().active,1,'cancelled single reader releases its actual drained slot')
    batch=lifetime.run(()=>h.raw('projection_batch',{bindings:[binding]}))
    await blocked(lifetime,h,'projection_batch',writerIdentity)
    await lock.release()
    assert.equal((await writer).status,'reported')
    assert.ok(['not_current','missing'].includes((await batch).status),'batch confirms against the committed suppression, never the old optimistic projection')
  }finally{
    abortSingle.abort();await lock.release()
    await Promise.allSettled([writer,...(single?[single]:[]),...(batch?[batch]:[])])
  }
  const fresh=await h.raw('projection_current',{binding})
  assert.equal(fresh.status,'conflict');assert.deepEqual(fresh.value,{decisionRef:ambiguous.outcome.decision.reference,reason:'primary_unclear'})
  const view=await h.jobs.query({destinationCountryCode:'DE',citizenshipCountryCodes:['CH']},h.signal)
  assert.ok(view.ok);assert.equal(view.answer.response.cells.flatMap(c=>c.results).some(r=>r.status==='accepted'),false)
  assert.equal(h.hrs.snapshot().active,0)
  return{ambiguous,binding}
}

type NativeMonitorPlan=Readonly<{generation:number;plan:Readonly<{method:V3MethodRef;targets:readonly V3MonitorTarget[];attemptLimit:number}>}>
type NativeMonitorClaim=Readonly<{claimId:string;generation:number;leaseUntil:string;planGeneration:number;plan:NativeMonitorPlan['plan'];initialResearch:boolean}>
async function monitorPlan(h:Harness):Promise<NativeMonitorPlan>{
  const result=await h.raw('plan',{});assert.equal(result.status,'snapshot')
  const plan=result.value as NativeMonitorPlan
  assert.ok(Number.isSafeInteger(plan.generation)&&plan.generation>=0)
  assert.deepEqual(plan.plan.method,METHOD_REF);assert.equal(plan.plan.targets.length,2)
  assert.ok(plan.plan.targets.every(t=>hrs1Same(t.context,h.fixture.context)&&t.factKind==='requirement_effect'))
  return plan
}
function suppressionEffect(h:Harness,target:V3MonitorTarget,reason:V3ProjectionSuppression['reason']):V3ProjectionSuppression{
  const seed={contextKey:h.fixture.binding.contextKey,method:METHOD_REF,expectedVersionRef:target.expectedVersionRef,
    sourceDecisionRef:target.sourceDecisionRef,reason,conflict:target.knownUnresolvedConflictRef}
  const auditRef=hrs1Ref('projection-suppression',{...seed,projectionRefs:[...target.projectionRefs].sort()})
  return{operationId:'op3_'+auditRef.split(':').at(-1)!.slice(0,32),auditRef,contextKey:h.fixture.binding.contextKey,
    expectedVersionRef:target.expectedVersionRef,sourceDecisionRef:target.sourceDecisionRef,reason,
    projectionRefs:target.projectionRefs,escalationKey:reason==='expired'||reason==='source_changed'?null:hrs1Ref('source-escalation',seed),
    observedAt:h.fixture.clock().now}
}
async function n11(lifetime:OwnedTestLifetime,h:Harness,initial:Awaited<ReturnType<typeof n03>>){
  const owner=h.common.bootstrap.connection
  const prior=await resultSnapshot(owner)
  assert.ok(initial.initialHistory.stickyDecision.knownConflicts.some(c=>c.resolution===null))
  assert.equal(initial.initialHistory.history.version,null,'initial sticky conflict existed before any accepted version')
  for(const row of initial.initialOutbox)assert.equal(prior.outbox_v1.filter(current=>hrs1Same(current,row)).length,1,
    'the actual initial conflict still has exactly one byte-identical original outbox record')

  h.fixture.refresh('agrees');h.fixture.control.resolve=true
  const baseline=await h.prepare('n11-monitor-baseline');await baseline.finish()
  assert.equal((await h.raw('transition',h.transition(baseline))).status,'committed')
  const published=await publishPrepared(h,baseline),retained=await resultSnapshot(owner)
  const currentBinding=projectionBinding(published.projection),plan=await monitorPlan(h)
  const primary=plan.plan.targets.find(t=>t.role==='primary'),counter=plan.plan.targets.find(t=>t.role==='counter')
  assert.ok(primary&&counter)
  assert.equal(primary.expectedVersionRef,published.prepared.version.reference)
  assert.equal(primary.primaryFreshUntil,published.projection.sourceFreshUntil)
  await actualTimePassed(lifetime,h.common.observer.connection,primary.nextCheckAt,1500)

  const claimBody=(tag:string)=>({operationId:fixtureId('op3','hrs1-monitor-claim-'+tag),claimId:'hrsclaim1_'+sha256Hex('hrs1-monitor-claim-'+tag).slice(0,32)})
  const firstBody=claimBody('first'),claimed=await h.raw('monitor_claim',firstBody)
  assert.equal(claimed.status,'claimed');const first=claimed.value as NativeMonitorClaim
  assert.equal(first.initialResearch,false,'an actual accepted head uses the ordinary M1 source plan')
  assert.deepEqual(first.plan,plan.plan);assert.equal(first.planGeneration,plan.generation)
  assert.equal(first.claimId,firstBody.claimId);assert.ok(first.generation>0&&first.leaseUntil>h.fixture.clock().now)
  const leased=await resultSnapshot(owner)
  assert.deepEqual(await h.raw('monitor_claim',firstBody),claimed,'same claim returns its original actual lease, without renewal')
  assert.equal((await h.raw('monitor_claim',{...firstBody,claimId:claimBody('collision').claimId})).status,'collision')
  assert.equal((await h.raw('monitor_claim',claimBody('busy'))).status,'busy')
  assert.deepEqual(await resultSnapshot(owner),leased,'collision and competing live claim leave complete durable state exact')
  await actualTimePassed(lifetime,h.common.observer.connection,first.leaseUntil,6500)
  const oldFinish={operationId:fixtureId('op3','hrs1-monitor-old-finish'),claimId:first.claimId,generation:first.generation,outcomes:[]}
  assert.equal((await h.raw('monitor_finish',oldFinish)).status,'not_current')
  assert.deepEqual(await resultSnapshot(owner),leased,'expired lease cannot finish or mutate its original journal')
  const nextBody=claimBody('reclaimed'),reclaimed=await h.raw('monitor_claim',nextBody)
  assert.equal(reclaimed.status,'claimed');const next=reclaimed.value as NativeMonitorClaim
  assert.equal(next.initialResearch,false)
  assert.equal(next.generation,first.generation+1);assert.ok(next.leaseUntil>first.leaseUntil)
  assert.equal(next.planGeneration,plan.generation);assert.deepEqual(next.plan,plan.plan)

  const unchanged=await h.source.sources.observe(primary,METHOD_REF,h.signal)
  assert.equal(unchanged.status,'observed');assert.ok(unchanged.status==='observed')
  assert.equal(await h.source.sources.reprove({...unchanged.receipt},primary,METHOD_REF,h.fixture.clock().now,h.signal),false,
    'a copied observation receipt never gains private source custody')
  assert.equal(await h.source.sources.reprove(unchanged.receipt,primary,METHOD_REF,h.fixture.clock().now,h.signal),true)
  const observed=h.source.lastObservation(primary);assert.ok(observed&&observed.status==='observed'&&observed.original.observation)
  assert.deepEqual(observed.observation.fingerprint,primary.baseline)
  assert.equal(observed.observation.retrievedAt,published.prepared.version.subject.evidence.retrievedAt)
  const sameHashBody={effect:suppressionEffect(h,primary,'source_changed'),generation:plan.generation,observationRef:observed.reference}
  const observedState=await resultSnapshot(owner)
  assert.ok(['unavailable','unconfirmed'].includes((await h.raw('suppress',sameHashBody)).status),
    'genuine observed custody with unchanged bytes cannot claim a primary source change')
  assert.deepEqual(await resultSnapshot(owner),observedState)
  assert.deepEqual(observedState.versions_v1,retained.versions_v1)
  assert.deepEqual(observedState.projections_v1,retained.projections_v1,
    'unchanged monitoring cannot extend the original projection or source expiry')
  assert.deepEqual(observedState.originals_v1,retained.originals_v1,'observing the same original never updates its retrieval time')
  const finish={operationId:fixtureId('op3','hrs1-monitor-finish'),claimId:next.claimId,generation:next.generation,
    outcomes:[{contextKey:h.fixture.binding.contextKey,sourceId:primary.source.sourceId,status:'unchanged',ruleChange:'not_asserted'}]}
  assert.equal((await h.raw('monitor_finish',{...finish,generation:first.generation})).status,'not_current')
  const finished=await h.raw('monitor_finish',finish);assert.equal(finished.status,'finished')
  const finishedValue=finished.value as {generation:number;nextCheckAt:string}
  assert.equal(finishedValue.generation,next.generation);assert.ok(finishedValue.nextCheckAt>h.fixture.clock().now)
  const finishState=await resultSnapshot(owner)
  assert.deepEqual(await h.raw('monitor_finish',finish),finished)
  assert.deepEqual(await resultSnapshot(owner),finishState,'finish replay cannot renew the next check or duplicate the operation')

  // A changed clear original stays clear. Counter custody and absent custody
  // cannot authorize the distinct primary source_changed suppression.
  const livePlan=await monitorPlan(h),livePrimary=livePlan.plan.targets.find(t=>t.role==='primary'),liveCounter=livePlan.plan.targets.find(t=>t.role==='counter')
  assert.ok(livePrimary&&liveCounter)
  h.fixture.refresh('agrees')
  const foreign=await h.source.sources.observe(liveCounter,METHOD_REF,h.signal)
  assert.equal(foreign.status,'observed')
  const foreignOriginal=h.source.lastObservation(liveCounter);assert.ok(foreignOriginal&&foreignOriginal.original.observation)
  const pendingEffect=suppressionEffect(h,livePrimary,'source_changed'),beforeNegatives=await resultSnapshot(owner)
  assert.equal(pendingEffect.escalationKey,null)
  const missing=await h.raw('suppress',{effect:pendingEffect,generation:livePlan.generation,observationRef:null})
  assert.ok(['stale_head','unavailable','unconfirmed'].includes(missing.status))
  const foreignReply=await h.raw('suppress',{effect:pendingEffect,generation:livePlan.generation,observationRef:foreignOriginal.reference})
  assert.ok(['stale_head','unavailable','unconfirmed'].includes(foreignReply.status))
  assert.deepEqual(await resultSnapshot(owner),beforeNegatives)
  assert.equal((await h.raw('projection_current',{binding:currentBinding})).status,'current')
  await actualTimePassed(lifetime,h.common.observer.connection,finishedValue.nextCheckAt,1500)
  const changed=await lifetime.run(()=>h.jobs.monitorOnce(h.signal))
  assert.equal(changed.status,'complete')
  assert.ok(changed.outcomes.some(o=>o.sourceId===primary.source.sourceId&&o.status==='suppressed'))
  assert.ok(changed.outcomes.some(o=>o.status==='research_queued'))
  assert.ok(changed.outcomes.every(o=>o.ruleChange==='not_asserted'))
  const suppressed=await resultSnapshot(owner)
  const suppression=suppressed.operations_v1.filter(row=>row.operation_kind==='suppression')
    .map(row=>row.command as {effect:V3ProjectionSuppression;observationRef:string})
    .find(row=>row.effect.reason==='source_changed'&&row.effect.expectedVersionRef===published.prepared.version.reference)
  assert.ok(suppression);assert.equal(suppression.effect.escalationKey,null)
  const custody=suppressed.qualifications_v1.find(row=>row.kind==='observation'&&row.reference===suppression.observationRef)?.record as Hrs1ObservedSource|undefined
  assert.ok(custody&&custody.status==='observed'&&custody.original.observation)
  assert.deepEqual(custody.original.observation.fact.fact,{kind:'requirement_effect',effect:'not_required'})
  assert.equal(custody.target.role,'primary');assert.deepEqual(custody.target.source,primary.source)
  assert.notEqual(custody.observation.fingerprint.sourceContentHash,primary.baseline.sourceContentHash)
  assert.deepEqual(suppressed.versions_v1,retained.versions_v1,'source change alone never accepts or changes a legal rule')
  assert.deepEqual(suppressed.projections_v1,retained.projections_v1,'old projection bytes remain append-only evidence')
  assert.deepEqual(suppressed.outbox_v1,retained.outbox_v1,'clear changed source does not manufacture a conflict escalation')
  assert.equal((await h.raw('projection',{key:publicKey(h.fixture)})).status,'missing')
  const coverage=await h.raw('coverage',{destinationCountryCode:'DE',citizenshipCountryCode:'CH'})
  assert.equal(coverage.status,'current');assert.ok(Array.isArray(coverage.value)&&coverage.value.length===1)
  assert.deepEqual(coverage.value,[{context:h.fixture.context,factKind:'requirement_effect'}])
  const waiting=await h.jobs.query({destinationCountryCode:'DE',citizenshipCountryCodes:['CH']},h.signal)
  assert.ok(waiting.ok);assert.ok(waiting.answer.response.cells.flatMap(c=>c.results).every(r=>r.status!=='accepted'))
  const refreshed=await h.worker('n11-actual-source-reacceptance')
  assert.equal(refreshed.result.results.length,1);const republished=refreshed.result.results[0]!
  assert.equal(republished.status,'published');assert.ok(republished.status==='published')
  assert.notEqual(republished.versionRef,published.prepared.version.reference)
  assert.ok(refreshed.record.completion?.outcome.status==='prepared')
  const accepted=refreshed.record.completion.outcome.value
  assert.equal(accepted.version.subject.evidence.sourceContentHash,custody.observation.fingerprint.sourceContentHash)
  assert.deepEqual(accepted.version.subject.fact.fact,{kind:'requirement_effect',effect:'not_required'})
  assert.equal((await h.raw('projection',{key:publicKey(h.fixture)})).status,'current')

  h.fixture.refresh('agrees');h.fixture.control.expiresAt=new Date(Date.now()+3000).toISOString()
  const expiring=await h.prepare('n11-source-expiry');await expiring.finish()
  assert.equal((await h.raw('transition',h.transition(expiring))).status,'committed')
  const limited=await publishPrepared(h,expiring),expiryPlan=await monitorPlan(h)
  const expiryTarget=expiryPlan.plan.targets.find(t=>t.role==='primary');assert.ok(expiryTarget)
  assert.equal(expiryTarget.primaryFreshUntil,limited.projection.sourceFreshUntil)
  const expiryState=await resultSnapshot(owner)
  await actualTimePassed(lifetime,h.common.observer.connection,expiryTarget.primaryFreshUntil)
  assert.equal((await h.raw('projection',{key:publicKey(h.fixture)})).status,'missing',
    'fresh actual public read refuses a truly expired original without waiting for a monitor')
  const expiryEffect=suppressionEffect(h,expiryTarget,'expired')
  assert.equal(expiryEffect.escalationKey,null)
  assert.equal((await h.raw('suppress',{effect:expiryEffect,generation:expiryPlan.generation,observationRef:null})).status,'confirmed')
  const expired=await resultSnapshot(owner)
  assert.deepEqual(expired.versions_v1,expiryState.versions_v1);assert.deepEqual(expired.projections_v1,expiryState.projections_v1)
  assert.deepEqual(expired.outbox_v1,expiryState.outbox_v1)
  assert.ok(expired.operations_v1.some(row=>row.operation_kind==='suppression'&&row.operation_id===expiryEffect.operationId))
  for(const row of initial.initialOutbox)assert.equal(expired.outbox_v1.filter(current=>hrs1Same(current,row)).length,1)
  assert.equal(h.hrs.snapshot().active,0)
}

async function refuseHrsRecovery(common:Common,files:ReadonlyMap<string,string>,expected:'P7807'|'P7808'){
  const before=await resultSnapshot(common.bootstrap.connection),objects=await catalog(common.bootstrap.connection)
  await common.creator.connection.query("SELECT set_config('jetnity.hrs1_recovery_context',$1::text,false) AS context,set_config('jetnity.hrs1_recovery_identity',$2::text,false) AS identity",
    text([RECOVERY_CONTEXT,common.resultIdentity]))
  try{await assert.rejects(common.creator.connection.query(file(files,'scripts/db/official-truth-v3-hosted-result-store-1/recovery-candidate.sql')),stateError(expected))}
  finally{await common.creator.connection.query('ROLLBACK')}
  assert.deepEqual(await resultSnapshot(common.bootstrap.connection),before)
  assert.deepEqual(await catalog(common.bootstrap.connection),objects)
}
async function recoverUnused(lifetime:OwnedTestLifetime,common:Common,files:ReadonlyMap<string,string>){
  const owner=common.bootstrap.connection,creator=common.creator.connection
  await frozen(common);assertEmptyHistory(await methodHistory(owner));assertEmptyHistory(await effectHistory(owner))
  noResultEffects(await resultSnapshot(owner))
  const callers=[...common.runtime,common.human]
  for(const caller of callers)caller.connection.close()
  await proveAbsent(lifetime,common.observer.connection,callers.map(x=>x.identity))
  const remaining=[common.bootstrap,common.creator,common.observer].map(x=>({pid:x.identity.pid,birth:x.identity.birth})).sort((a,b)=>Number(a.pid)-Number(b.pid))
  assert.deepEqual(await common.observer.connection.query("SELECT pid::text AS pid,backend_start::text AS birth FROM pg_stat_activity WHERE datname=current_database() AND backend_type='client backend' ORDER BY pid"),remaining)
  for(const exact of common.bound){
    await technicalIdentity(creator,exact,true)
    await creator.query('REVOKE '+exact.role+' FROM '+exact.login+' GRANTED BY postgres RESTRICT')
    await technicalIdentity(creator,exact,false)
  }
  assert.deepEqual(value(await owner.query(FINGERPRINT_SQL)),common.fingerprints)
  await creator.query("SELECT set_config('jetnity.hm04_recovery_context',$1::text,false) AS context,set_config('jetnity.hm04_recovery_identity',$2::text,false) AS identity",
    text([RECOVERY_CONTEXT,common.hmIdentity]))
  await creator.query(file(files,'scripts/db/official-truth-v3-hosted-durable-jobs-1/recovery-candidate.sql'))
  assert.deepEqual(await owner.query("SELECT to_regnamespace('official_v3_jobs_private')::text AS private,to_regnamespace('official_v3_jobs_api')::text AS api,to_regrole('ot_v3_jobs_owner')::text AS owner,to_regrole('ot_v3_jobs_caller')::text AS caller"),
    [{private:null,api:null,owner:null,caller:null}])
  assert.deepEqual(JSON.parse(await hrsIdentity(owner,common.binding)),JSON.parse(common.resultIdentity))
  assert.deepEqual(value(await creator.query('SELECT ('+HRS_CATALOG_SQL+') AS value')),(JSON.parse(common.resultIdentity) as {catalog:unknown}).catalog,
    'HM04 removal restores original HRS metadata, without relearning a snapshot')
  await creator.query("SELECT set_config('jetnity.hrs1_recovery_context',$1::text,false) AS context,set_config('jetnity.hrs1_recovery_identity',$2::text,false) AS identity",
    text([RECOVERY_CONTEXT,common.resultIdentity]))
  await creator.query(file(files,'scripts/db/official-truth-v3-hosted-result-store-1/recovery-candidate.sql'))
  assert.deepEqual(await owner.query("SELECT to_regnamespace('official_v3_result_private')::text AS private,to_regnamespace('official_v3_result_api')::text AS api,to_regrole('ot_v3_result_owner')::text AS owner,to_regrole('ot_v3_result_writer')::text AS writer,to_regrole('ot_v3_result_reader')::text AS reader,to_regrole('ot_v3_result_verifier')::text AS verifier"),
    [{private:null,api:null,owner:null,writer:null,reader:null,verifier:null}])
  for(const exact of common.bound)await technicalIdentity(creator,exact,false)
  assert.equal(scalar(await owner.query(HS1_IDENTITY_SQL),'hs1_identity'),common.hsIdentity)
  assert.deepEqual(await wrapperIdentity(owner),common.wrappers)
  const limit=scalar(await owner.query("SELECT (clock_timestamp()+interval '4 minutes')::text AS until"),'until')
  await creator.query(`SELECT set_config('jetnity.hmt1_target',$1::text,false) AS target_ack,
    set_config('jetnity.hmt1_recovery_context','root-verified-unused-quiescent-v1',false) AS context,
    set_config('jetnity.hmt1_original_oids',$2::text,false) AS original_oids,
    set_config('jetnity.hmt1_quiescence_receipt','synthetic:hrs1:owned-unused-callers-ended',false) AS receipt,
    set_config('jetnity.hmt1_quiescence_until',$3::text,false) AS until`,text([TARGET_ACK,common.hmtOriginalOids,limit]))
  await creator.query(file(files,'scripts/db/official-truth-v3-human-method-transport-1/recovery-candidate.sql'))
  assert.equal(scalar(await owner.query('SELECT count(*)::text AS n FROM pg_proc WHERE pronamespace=2200 AND proname=ANY($1::text[])',
    text(['{'+HMT_WRAPPERS.map(x=>x.name).join(',')+'}'])),'n'),'0')
  assertEmptyHistory(await methodHistory(owner))
  await creator.query("SELECT set_config('jetnity.hs1_recovery_context',$1::text,false) AS context,set_config('jetnity.hs1_recovery_identity',$2::text,false) AS identity",
    text([RECOVERY_CONTEXT,common.hsIdentity]))
  await creator.query(file(files,'scripts/db/official-truth-v3-hosted-intake-store-1/recovery-candidate.sql'))
  assert.deepEqual(await owner.query("SELECT to_regnamespace('official_v3_intake_private')::text AS private,to_regnamespace('official_v3_intake_api')::text AS api,to_regrole('ot_v3_intake_owner')::text AS owner,to_regrole('ot_v3_intake_caller')::text AS caller"),
    [{private:null,api:null,owner:null,caller:null}])
  assertEmptyHistory(await methodHistory(owner))
  await creator.query(`SELECT set_config('jetnity.hma1_recovery_context','root-verified-unused-quiescent-v1',false) AS context,
    set_config('jetnity.hma1_recovery_private_oid',$1::text,false) AS private_oid,
    set_config('jetnity.hma1_recovery_api_oid',$2::text,false) AS api_oid,
    set_config('jetnity.hma1_recovery_reader_oid',$3::text,false) AS reader_oid`,
    text([common.hmaIdentity.private_oid!,common.hmaIdentity.api_oid!,common.hmaIdentity.reader_oid!]))
  await creator.query(file(files,'scripts/db/official-truth-v3-hosted-method-authority-1/recovery-candidate.sql'))
  assert.deepEqual(await owner.query("SELECT to_regnamespace('official_v3_method_private')::text AS private,to_regnamespace('official_v3_method_api')::text AS api,to_regrole('ot_v3_method_reader')::text AS reader"),
    [{private:null,api:null,reader:null}])
  assert.deepEqual(await catalog(owner),common.beforeHma)
  assert.deepEqual(await owner.query(PAI_NEW_OBJECT_SQL),common.guard)
  assert.deepEqual(await owner.query(PROFILE_ROWS_SQL),common.profileRows);assert.deepEqual(value(await owner.query(AUTH_ROWS_SQL)),common.authRows)
  for(const exact of common.bound)await technicalIdentity(creator,exact,false)
}
async function n12(lifetime:OwnedTestLifetime,h:Harness,empty:Common,files:ReadonlyMap<string,string>){
  const retained=await resultSnapshot(h.common.bootstrap.connection),intake=await effectHistory(h.common.bootstrap.connection)
  assert.ok(retained.versions_v1.length>0&&retained.operations_v1.length>0&&retained.outbox_v1.length>0)
  await refuseHrsRecovery(h.common,files,'P7807')
  await refuseHrsRecovery(empty,files,'P7808')
  await recoverUnused(lifetime,empty,files)
  assert.deepEqual(await resultSnapshot(h.common.bootstrap.connection),retained)
  assert.deepEqual(await effectHistory(h.common.bootstrap.connection),intake)
  await frozen(h.common)
  await confirmFresh(lifetime,h.common,h.written)
  assert.equal(h.hrs.snapshot().active,0);assert.equal(h.hrs.snapshot().poisoned,false)
  assert.equal(h.hrs.evidence.admitted,h.hrs.evidence.drained)
  assert.ok(h.hrs.evidence.calls.every(c=>c.drained&&c.target&&c.control))
  assert.ok(h.hrs.evidence.aborted>=2&&h.hrs.evidence.lost===1,'selected actual cancellation and COMMIT-loss groups occurred')
  assert.deepEqual(h.m04.snapshot(),{jobs:0,intake:0,contexts:0,poisoned:false})
  assert.equal(h.m04.evidence.admitted,h.m04.evidence.drained);assert.equal(h.m04.evidence.dispatched,h.m04.evidence.acknowledged)
  assert.ok(h.m04.evidence.calls.every(c=>c.drained&&c.committed&&c.target&&c.control))
  h.method.assertHealthy();assert.equal(h.method.evidence.admitted,h.method.evidence.drained)
  assert.ok(h.method.evidence.calls.every(c=>c.pending===0&&c.joined&&c.targetAbsent&&c.controlAbsent))
}

export async function runHostedResultStoreNative(t:TestContext):Promise<void>{
  const effectsStart=performance.now(),deadline=new AbortController()
  const lifetime=new OwnedTestLifetime(AbortSignal.any([t.signal,deadline.signal]))
  const originalConnect=LocalPgConnection.connect
  // The one selected global hook owns every real acquisition/query/COMMIT guard.
  lifetime.installConnectOwnership()
  const timer=setTimeout(()=>deadline.abort(Error('hrs1_effect_deadline')),EFFECT_MS)
  const clusters:LocalProofCluster[]=[],harnesses:Harness[]=[],completed:string[]=[]
  const budget:HrsBudget={admitted:0,active:0,maximumActive:0,directAdmitted:0,directSettled:0}
  let failed=false,failure:unknown
  const state:{used?:Common;unused?:Common;fixture?:VisaFixture}={}
  function allocate(){
    assert.ok(clusters.length<2,'exactly two owned PG17 clusters')
    const cluster=lifetime.startCluster(startLocalProofCluster);clusters.push(cluster);return cluster
  }
  async function proof<T>(id:(typeof GROUPS)[number],label:string,body:()=>Promise<T>):Promise<T>{
    assert.equal(id,GROUPS[completed.length]);lifetime.check()
    const before=budget.admitted,actor:{promise?:Promise<T>}={}
    let runnerFailed=false,runnerFailure:unknown
    try{await t.test(id+' '+label,async()=>{actor.promise=lifetime.run(body);await actor.promise})}
    catch(error){runnerFailed=true;runnerFailure=error}
    if(!actor.promise){if(runnerFailed)throw runnerFailure;assert.fail('selected proof body was not started')}
    const [joined]=await lifetime.drain([actor.promise]);assert.ok(joined)
    if(joined.status==='rejected')throw joined.reason
    if(runnerFailed)throw runnerFailure
    lifetime.check();assert.ok(performance.now()-effectsStart<EFFECT_MS,'one unchanged total effects deadline')
    assert.equal(budget.active,0);assert.ok(budget.admitted<=256);completed.push(id)
    t.diagnostic('HRS1 '+id+' complete '+JSON.stringify({fixedCalls:budget.admitted-before,totalFixedCalls:budget.admitted}))
    return joined.value
  }
  try{
    const files=pinnedFiles()
    assert.equal(Buffer.byteLength(file(files,'scripts/db/official-truth-v3-composed-dev-1/observed-auth-profile-fixture.sql'),'utf8'),10807)
    await proof('N01','actual restricted Creator, complete catalog, exact rights and separate Verifier',async()=>{
      const usedCluster=allocate(),fixture=makeVisaFixture(usedCluster,lifetime,'hrs1-used')
      state.fixture=fixture;state.used=await makeCommon(lifetime,usedCluster,files,fixture)
      const unusedCluster=allocate(),unusedFixture=makeVisaFixture(unusedCluster,lifetime,'hrs1-unused')
      state.unused=await makeCommon(lifetime,unusedCluster,files,unusedFixture)
      assert.equal(clusters.length,2);assert.notEqual(usedCluster.root,unusedCluster.root)
      await n01(lifetime,[state.used,state.unused],budget)
    })
    const used=state.used,unused=state.unused,fixture=state.fixture;assert.ok(used&&unused&&fixture)
    const h=await createHarness(lifetime,used,fixture,budget);harnesses.push(h)
    await proof('N02','exact context/source/method and closed production issuance',()=>n02(h))
    const initial=await proof('N03','actual full completed S1 custody and incomplete/mismatched originals refuse',()=>n03(h))
    const first=await proof('N04','actual I1 transition/publication/current public read with advancing source custody',()=>n04(h))
    const race=await proof('N05','two actual blocked writers retain exactly one CAS winner and immutable history',()=>n05(lifetime,h))
    await proof('N06','actual head/revoke/reapproved epoch waits refuse old authority at the end',()=>n06(lifetime,h,race))
    await proof('N07','source/method expiry and selected legal day rechecked after actual waits',()=>n07(lifetime,h))
    await proof('N08','actual late outbox cancellation rolls back all atomic components',()=>n08(lifetime,h))
    const current=await proof('N09','actual COMMIT acknowledgement loss, immutable confirmation, collision and stale history',()=>n09(h))
    await proof('N10','current single/batch reads cannot escape concurrent committed suppression',()=>n10(lifetime,h,first,current))
    await proof('N11','initial sticky conflict, outbox dedup, real leases, clear source change and expiry',()=>n11(lifetime,h,initial))
    await proof('N12','unused exact recovery, used-history refusal and complete caller drain',()=>n12(lifetime,h,unused,files))
    assert.deepEqual(completed,GROUPS);assert.equal(budget.active,0);assert.equal(budget.maximumActive,2)
    assert.equal(budget.directAdmitted,8);assert.equal(budget.directSettled,budget.directAdmitted)
    assert.equal(budget.admitted,h.hrs.evidence.admitted+budget.directAdmitted);assert.ok(budget.admitted<=256)
  }catch(error){
    failed=true;failure=error
    const guard=completed.length===0&&error instanceof LocalPgError&&error.code==='P7802'?error.guardDiagnostic:undefined
    if(guard)t.diagnostic('HRS1_ORIGINAL_GUARD_DIAG '+JSON.stringify({phase:'N01_original_failure',code:'P7802',...guard}))
  }
  finally{
    clearTimeout(timer)
    const cleanupStart=performance.now(),errors:unknown[]=[],disposals:Promise<unknown>[]=[]
    for(const h of harnesses){try{disposals.push(lifetime.track(h.dispose()))}catch(error){errors.push(error)}}
    // Unconditional owned-cluster shutdown starts before waiting for disposal.
    // All original MA1/M04 and native COMMIT-guard connections remain counted.
    const terminalPromise=lifetime.dispose()
    const results=await Promise.allSettled([...disposals,terminalPromise])
    for(const result of results)if(result.status==='rejected')errors.push(result.reason)
    try{
      assert.equal(LocalPgConnection.connect,originalConnect,'exact ownership-hook restoration')
      const terminal=await terminalPromise
      assert.equal(terminal.started,terminal.settled);assert.equal(terminal.pending,0)
      assert.equal(terminal.closed,terminal.connections);assert.equal(terminal.stoppedClusters,clusters.length)
      assert.ok(terminal.connections<=MAX_CONNECTIONS,'all actual connections including original adapters and COMMIT protection')
      assert.ok(terminal.started<=MAX_OPERATIONS,'all owned registered operations, with no omitted native subcalls')
      assert.equal(budget.active,0);assert.equal(budget.directAdmitted,budget.directSettled)
      assert.ok(budget.maximumActive<=2&&budget.admitted<=256)
      for(const cluster of clusters)assert.equal(existsSync(cluster.root),false,'actual process exit and owned directory removal')
      assert.ok(performance.now()-cleanupStart<=DRAIN_MS,'one total cleanup deadline')
      if(!failed)assert.equal(terminal.stoppedClusters,2)
      t.diagnostic('HRS1 synthetic terminal '+JSON.stringify({completed,...terminal,fixedCalls:budget.admitted,
        directRightsCalls:budget.directAdmitted,maximumActive:budget.maximumActive,effectsLimitMs:EFFECT_MS,cleanupLimitMs:DRAIN_MS,
        maxConnections:MAX_CONNECTIONS,maxOperations:MAX_OPERATIONS}))
    }catch(error){errors.push(error)}
    if(errors.length){failure=new AggregateError(failed?[failure,...errors]:errors,'hrs1_proof_or_cleanup_failed');failed=true}
  }
  if(failed)throw failure
}
