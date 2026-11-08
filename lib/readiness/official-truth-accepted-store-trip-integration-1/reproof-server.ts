import 'server-only'
import { z } from 'zod'
import { evidenceKandidatAusModell, evidenceKandidatAkzeptieren } from '../evidence'
import { officialTruthRegelKandidatAusEvidence } from '../official-truth-rule-candidate'
import { officialTruthReviewIdentityV3 } from '../official-truth-rule-review-fingerprint'
import { regelKandidatAkzeptieren } from '../rule-claims'
import { contentIdentityBinding, contentIdentityMatches, contentRepresentationFromRegistry } from '../official-truth-content-identity'
import { OFFICIAL_TRUTH_TRUSTED_FACT_EXTRACTOR_REGISTRY, officialTruthExtractorDefinitionenPruefen,
  officialTruthExtractorUrlErlaubt, type OfficialTruthExtractorKontext } from '../official-truth-trusted-fact-extractor-registry'
import { historicalValuesEqual, immutable } from '../official-truth-autonomous-provenance-artifact'
import { custodyMetadataSchema, ciphertextSchema, decryptOriginal } from './custody-server'
import { verifyPersistedArchive, verifyCurrentImplementation } from './archive-server'
import { readStoreCatalog } from './catalog-server'
import { headSchema, receiptSchema } from './wire'
import type { AcceptedStoreBinding } from './binding-server'
import { bindingCurrent } from './binding-server'
import type { AcceptedStoreLifetime } from './lifetime-server'

const digest=z.string().regex(/^[a-f0-9]{64}$/)
const manifestSchema=z.object({profile:z.literal('ot-accepted-store-trip-closure-v1'),contractDigest:digest,codeDigest:digest,
  scopeKey:z.string(),catalogDigest:digest,evidence:z.unknown(),claim:z.unknown(),reviewPacketKey:z.string(),originalStartedAt:z.string(),
  metadata:custodyMetadataSchema}).strict()
const snapshotSchema=z.object({profile:z.literal('ot-accepted-store-trip-closure-v1'),contractDigest:digest,codeDigest:digest,
  receipt:receiptSchema,acceptedAt:z.string(),manifest:manifestSchema,archive:z.unknown(),metadata:custodyMetadataSchema,
  ciphertext:ciphertextSchema,catalog:z.unknown(),projection:z.unknown(),head:headSchema}).strict()

/** Historical reproof over actual retained bytes. This function never constructs
 * a server_owned retrieval, same-request execution context or new acceptance.
 * Current accepted authority is separately provided by the protected SQL ledger
 * and the caller's final authenticated validation/commit/witness checks. */
export async function reproveRetainedSnapshot(input: unknown,binding:AcceptedStoreBinding,life:AcceptedStoreLifetime) {
  life.assertCurrent();const s=snapshotSchema.parse(input),contract=binding.contract
  if(!bindingCurrent(binding)||s.contractDigest!==contract.digest||s.codeDigest!==binding.codeDigest
    ||s.manifest.contractDigest!==s.contractDigest||s.manifest.codeDigest!==s.codeDigest
    ||s.metadata.receiptFingerprint!==s.receipt||!historicalValuesEqual(s.metadata,s.manifest.metadata)
    ||s.metadata.keyId!==binding.key.id||s.metadata.keyPolicyDigest!==binding.key.policyDigest
    ||!contentIdentityMatches(s.metadata.identity,contract.source.binding))throw Error('retained_binding_invalid')
  const bundle=verifyPersistedArchive(s.archive)
  if(bundle.receipt.recordFingerprint!==s.receipt)throw Error('retained_receipt_invalid')
  verifyCurrentImplementation(bundle,contract)
  const registry=await readStoreCatalog(s.catalog,binding,life)
  life.assertCurrent()
  const source=registry.sources.find(row=>row.sourceId===contract.source.sourceId)
  const rep=contentRepresentationFromRegistry(registry,contract.source.url)
  if(!source||source.sourceClass!=='official_authority'||!rep.ok||!contentIdentityMatches(rep.value,contract.source.binding)
    ||rep.value.expectedFinalUrl!==s.metadata.canonicalUrl||rep.value.expectedMediaType!==s.metadata.contentType)throw Error('retained_source_invalid')
  const key=await life.run(()=>binding.key.resolve(life.signal))
  let body:string
  try{life.assertCurrent();if(!bindingCurrent(binding)||!key)throw Error('retained_key_unavailable');body=decryptOriginal(s.ciphertext,s.metadata,key)}finally{key?.fill(0)}
  const validity=contract.validity(body),origin=contract.validityOrigin(body)
  if(!validity||!origin||validity.validFrom!==origin.validFrom||validity.validUntil!==origin.validUntil)throw Error('retained_validity_invalid')
  const candidate=evidenceKandidatAusModell({scope:{...contract.scope,sourceId:source.sourceId},...validity,extractionNote:null},
    {canonicalUrl:s.metadata.canonicalUrl,contentType:s.metadata.contentType,sourceSnapshot:body,retrievedAt:s.metadata.originalRetrievedAt},registry)
  if(!candidate.ok)throw Error('retained_evidence_invalid')
  const accepted=evidenceKandidatAkzeptieren(candidate.evidence,registry)
  if(!accepted.ok||!historicalValuesEqual(accepted.evidence,s.manifest.evidence)||accepted.evidence.versionId!==s.metadata.evidenceVersionId)throw Error('retained_evidence_invalid')
  const e=accepted.evidence
  const rule=officialTruthRegelKandidatAusEvidence([e],registry,{factKind:'requirement_effect',evidenceQuality:'explicit_primary_statement',proposal:null})
  if(!rule.ok)throw Error('retained_candidate_invalid')
  const {previousVersionId,lifecycle,validationState,sourceClass,authorityName,publisherName,scope,extractionNote,lookupKey,...compact}=e
  void previousVersionId;void lifecycle;void validationState;void sourceClass;void authorityName;void publisherName;void scope;void extractionNote;void lookupKey
  const review=officialTruthReviewIdentityV3(rule.kandidat,[compact])
  if(!review.ok||`review-packet:v3:${review.digest}`!==s.manifest.reviewPacketKey)throw Error('retained_review_invalid')
  const checked=officialTruthExtractorDefinitionenPruefen(OFFICIAL_TRUTH_TRUSTED_FACT_EXTRACTOR_REGISTRY)
  if(!checked.ok)throw Error('current_extractor_invalid')
  const descriptor=(d:typeof checked.registry[number])=>{const{match,extract,...rest}=d;void match;void extract;return rest}
  const historicalDefinitions=bundle.artifacts.filter(a=>a.artifactType==='extractor_registry').flatMap(a=>{
    const entries=(a.value as {content:{definitions:{id:string;version:number;current:boolean;definition:{id:string;version:number;digest:string}}[]}}).content.definitions
    return entries.map(entry=>{
      const artifact=bundle.artifacts.find(node=>historicalValuesEqual(node.pin,entry.definition))
      if(!artifact||artifact.artifactType!=='extractor_definition')throw Error('current_extractor_invalid')
      return {...(artifact.value as {content:{descriptor:Record<string,unknown>}}).content.descriptor,current:entry.current}
    })
  })
  const sorted=(rows:readonly Record<string,unknown>[])=>[...rows].sort((a,b)=>String(a.extractorId).localeCompare(String(b.extractorId))||Number(a.extractorVersion)-Number(b.extractorVersion))
  if(!historicalValuesEqual(sorted(checked.registry.map(descriptor)),sorted(historicalDefinitions)))throw Error('current_extractor_changed')
  const definitions=checked.registry.filter(d=>d.current&&d.factKind==='requirement_effect'&&d.policyId===null&&d.policyVersion===null
    &&d.contentItemRefs.length===1&&d.contentItemRefs[0]!.sourceId===e.sourceId&&d.contentItemRefs[0]!.contentItemId===e.contentItemId
    &&d.representations.length===1&&contentIdentityMatches(d.representations[0]!,e)&&d.contentTypes.includes(e.contentType)
    &&officialTruthExtractorUrlErlaubt(e.canonicalUrl,d.urlAllowlist))
  if(definitions.length!==1)throw Error('current_extractor_ambiguous')
  const definition=definitions[0]!
  if(definition.extractorId!==contract.extractorId||definition.extractorVersion!==contract.extractorVersion)throw Error('current_extractor_changed')
  const context:OfficialTruthExtractorKontext=immutable({factKind:'requirement_effect',requirementType:'visa',scopeKey:rule.kandidat.key,
    scope:contract.scope,evidenceQuality:'explicit_primary_statement',schemaFamily:definition.schemaFamily,policy:null,registry,
    supports:[{...contentIdentityBinding(e),versionId:e.versionId,sourceId:e.sourceId,canonicalUrl:e.canonicalUrl,retrievedAt:e.retrievedAt,
      contentType:e.contentType,sourceSnapshot:body,sourceContentHash:e.sourceContentHash}]})
  z.object({ok:z.literal(true)}).strict().parse(definition.match(context))
  const extracted=z.object({ok:z.literal(true),fact:z.unknown()}).strict().parse(definition.extract(context))
  const claim=regelKandidatAkzeptieren({kandidat:rule.kandidat,trustedRuleFact:extracted.fact,evidenceVersions:[e],registry})
  if(!claim.ok||!historicalValuesEqual(claim.claim,s.manifest.claim)||!historicalValuesEqual(claim.claim.fact,bundle.receipt.payload.candidate.fact)
    ||claim.claim.fact.kind!=='requirement_effect'||!('effect'in claim.claim.fact)||!['required','not_required'].includes(claim.claim.fact.effect)
    ||'schema'in claim.claim.fact||'applicability'in claim.claim.fact)throw Error('retained_fact_invalid')
  const custody=bundle.artifacts.find(a=>historicalValuesEqual(a.pin,s.metadata.originalPin))
  const validityNode=bundle.artifacts.find(a=>a.artifactType==='validity_origin')
  const v=validityNode?(validityNode.value as {content:Record<string,unknown>}).content:null
  if(!custody||custody.artifactType!=='AcceptedEvidenceCustodyV1'||!v
    ||!historicalValuesEqual({validFrom:v.validFrom,validUntil:v.validUntil,validFromBasis:v.validFromBasis,validUntilBasis:v.validUntilBasis},origin)
    ||bundle.receipt.payload.proof.reviewPacketKey!==s.manifest.reviewPacketKey
    ||!historicalValuesEqual(bundle.receipt.payload.globalCell.scope,contract.scope))throw Error('retained_custody_invalid')
  const initialDefinitions=checked.registry.map(d=>({descriptor:descriptor(d),match:d.match,extract:d.extract}))
  const contractValue=structuredClone({id:contract.id,digest:contract.digest,cellId:contract.cellId,cellVersion:contract.cellVersion,
    scope:contract.scope,source:contract.source,travelDates:contract.travelDates,extractorId:contract.extractorId,extractorVersion:contract.extractorVersion})
  const validityFunction=contract.validity,originFunction=contract.validityOrigin
  const assertCurrent=()=>{
    life.assertCurrent();if(!bindingCurrent(binding))throw Error('store_binding_closed')
    verifyCurrentImplementation(bundle,contract)
    if(validityFunction!==contract.validity||originFunction!==contract.validityOrigin||!historicalValuesEqual(contractValue,
      {id:contract.id,digest:contract.digest,cellId:contract.cellId,cellVersion:contract.cellVersion,scope:contract.scope,source:contract.source,
        travelDates:contract.travelDates,extractorId:contract.extractorId,extractorVersion:contract.extractorVersion}))throw Error('compiled_contract_changed')
    const current=officialTruthExtractorDefinitionenPruefen(OFFICIAL_TRUTH_TRUSTED_FACT_EXTRACTOR_REGISTRY)
    if(!current.ok||current.registry.length!==initialDefinitions.length||current.registry.some((d,i)=>{
      const old=initialDefinitions[i]!;return d.match!==old.match||d.extract!==old.extract||!historicalValuesEqual(descriptor(d),old.descriptor)
    }))throw Error('compiled_definition_changed')
  }
  assertCurrent()
  return {snapshot:s,evidence:e,claim:claim.claim,source,validity,receipt:s.receipt,reviewPacketKey:s.manifest.reviewPacketKey,assertCurrent}
}
