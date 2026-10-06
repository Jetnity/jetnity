// Isolated fixed-corpus conformance runner. No shipped route imports this module.
import { readFileSync, existsSync, readdirSync } from 'node:fs'
import { resolve, relative, dirname } from 'node:path'
import { fileURLToPath } from 'node:url'
import { createRequire } from 'node:module'
import { immutable, historicalPinFor, provenanceCanonical, provenanceHash, historicalValuesEqual, type Pin } from '@/lib/readiness/official-truth-autonomous-provenance-artifact'
import { createIntegratedPilotArtifact, verifyIntegratedPilotBundle,
  type IntegratedPilotArtifactInput, type IntegratedPilotManifestType, type IntegratedPilotManifestContent,
  type IntegratedPilotPayload } from '@/lib/readiness/official-truth-integrated-pilot-bundle'
import { readHistoricalArtifact, type HistoricalArtifactKind } from '@/lib/readiness/official-truth-autonomous-provenance-record'
import { validateGlobalCellAdmissionValue } from '@/lib/readiness/official-truth-global-cell-admission-server'
import { selectHistoricalSupports } from '@/lib/readiness/official-truth-support-selection-server'
import { constructHistoricalAutonomousReview } from '@/lib/readiness/official-truth-autonomous-review-material-server'
import { evidenceKandidatAusModell, evidenceKandidatAkzeptieren, type EvidenceVersion } from '@/lib/readiness/evidence'
import { contentIdentityBinding } from '@/lib/readiness/official-truth-content-identity'
import { quellenKatalogSnapshotAntwort, type OfficialTruthSourceCatalogTransport } from '@/lib/readiness/official-truth-source-catalog-server'
import { decideOfficialTruthServerOwnedRetrieval } from '@/lib/readiness/official-truth-server-owned-retrieval'
import { proveOfficialTruthCustodiedMaterial } from '@/lib/readiness/official-truth-same-request-proof-server'
import { decideOfficialTruthSameRequestTrustedFactExtraction, consumeOfficialTruthSameRequestPrimaryContext,
  consumeOfficialTruthSameRequestCompositionExecutionContext } from '@/lib/readiness/official-truth-same-request-extraction-server'
import { officialTruthTrustedFactExtrahierenMitDefinitionen } from '@/lib/readiness/official-truth-trusted-fact-extractor-registry'
import { officialTruthFactCitationTargets, officialTruthCompositionSealView } from '@/lib/readiness/official-truth-composition-policy-registry'
import { PILOT_CORPUS, PILOT_SOURCE, PILOT_ORIGIN_TIME, PILOT_REFERENCE_TIME, PILOT_COMPLETION_TIME,
  pilotBody, pilotUrl, pilotStartUrl, type PilotMode, type PilotItem } from './corpus'

const root = resolve(dirname(fileURLToPath(import.meta.url)), '../..')
const bytes = (value: unknown) => { const c = provenanceCanonical(value); if (c === null) throw Error('schema_incompatible'); return new TextEncoder().encode(c) }
function value<T>(result: { ok: true; value: T } | { ok: false; reason: string }): T {
  if (!result.ok) throw Error(result.reason)
  return result.value
}
const order = (a: string, b: string) => a < b ? -1 : a > b ? 1 : 0
export const PILOT_FAULTS = ['none', 'unknown_body_field', 'changed_fresh_body', 'changed_final_url', 'reversed_clock',
  'future_original', 'duplicate_support', 'missing_support', 'non_null_proposal', 'missing_origin', 'scope_substitution'] as const
export type PilotFault = typeof PILOT_FAULTS[number]

/** Invocation-only membership. There is no exported token factory or DTO entrance. */
function invocation() {
  const members = new WeakMap<object, { previous: object | null; stage: number }>()
  let active = true, current: object | null = null, stage = 0
  return {
    advance(previous: object | null) {
      if (!active || previous !== current || (current && members.get(current)?.stage !== stage)) { active = false; throw Error('authority_required') }
      const token = Object.freeze(Object.create(null) as object)
      members.set(token, { previous, stage: ++stage }); current = token; return token
    },
    owns(token: object) { return active && token === current && members.has(token) },
    close() { active = false; current = null },
  }
}

// The exact source dependency closure is a historical artifact, never executed on readback.
// Package imports are followed from these actual files; Node built-ins are the host runtime.
function implementationFiles() {
  const found = new Map<string, string>(), todo = [fileURLToPath(import.meta.url)]
  const require = createRequire(import.meta.url)
  while (todo.length) {
    const path = todo.pop()!
    if (found.has(path)) continue
    const source = readFileSync(path, 'utf8'); found.set(path, source)
    if (found.size > 200) throw Error('implementation_closure_bound')
    for (const m of source.matchAll(/(?:from\s+|import\s+|require\()['"]([^'"]+)['"]/g)) {
      const spec = m[1]!
      if (spec.startsWith('node:') || spec === 'server-only') continue
      let target: string | null = null
      if (spec.startsWith('@/')) target = resolve(root, spec.slice(2))
      else if (spec.startsWith('.')) target = resolve(dirname(path), spec)
      else if (spec === 'zod') target = require.resolve('zod')
      // Network/auth package code is outside this synthetic external boundary.
      // This disk archive is developer evidence, not loaded-code attestation.
      else if (spec.startsWith('@supabase/')) continue
      else continue
      if (target) {
        const candidates = [target, `${target}.ts`, `${target}.js`, resolve(target, 'index.ts'), resolve(target, 'index.js')]
        const file = candidates.find(p => existsSync(p) && !p.endsWith('.test.ts'))
        if (file) todo.push(file)
      }
    }
  }
  // Zod CommonJS modules use .cjs imports; include its bounded v3 implementation.
  for (const file of readdirSync(resolve(root, 'node_modules/zod/v3'))) {
    if (!file.endsWith('.cjs')) continue
    const p = resolve(root, 'node_modules/zod/v3', file); found.set(p, readFileSync(p, 'utf8'))
  }
  return [...found].map(([p, utf8]) => ({ path: relative(root, p), utf8 })).sort((a, b) => order(a.path, b.path))
}

export async function runSyntheticIntegratedPilot(mode: PilotMode, fault: PilotFault = 'none') {
  const safeMode = typeof mode === 'string' && ['primary', 'composed'].includes(mode) ? mode : null
  const safeFault = typeof fault === 'string' && PILOT_FAULTS.includes(fault) ? fault : null
  const trace = { catalogReads: 0, originalHttp: 0, freshHttp: 0, evidenceAcceptances: 0, proof: false,
    extracted: false, actualFactIdentity: false, receiptProjected: false, publicationCount: 0, storageCalls: 0 }
  const done: string[] = [], ledger = invocation()
  let closureBound: { limit: 'depth'; observed: number; maximum: 8 } | null = null
  let token: object | null = null
  const originMembership = new WeakSet<object>()
  const artifacts: IntegratedPilotArtifactInput[] = []
  const put = (a: IntegratedPilotArtifactInput) => { artifacts.push(a); return a.pin }
  function manifest<K extends IntegratedPilotManifestType>(type: K, id: string, content: IntegratedPilotManifestContent<K>) {
    const parsed = createIntegratedPilotArtifact(type, id, 1, content)
    return put(value(parsed))
  }
  function custody(kind: HistoricalArtifactKind, id: string, content: unknown) {
    const parsed = value(readHistoricalArtifact(kind, { kind, schemaVersion: 1, value: content }))
    const pin = historicalPinFor(id, 1, parsed)!
    if (kind === 'CustodyDependencyBindingV1') throw Error('separate_binding_required')
    put({ pin, artifactType: kind, artifactContractVersion: 1, canonicalBytes: bytes(parsed) })
    return { pin, value: parsed }
  }
  try {
    if (!['primary', 'composed'].includes(mode) || !PILOT_FAULTS.includes(fault)) throw Error('authority_required')
    const corpus = PILOT_CORPUS
    const requested: PilotItem[] = mode === 'primary' ? ['primary_rule'] : ['composed_effect', 'composed_mode']
    // External bootstrap boundary is synthetic and counted; it grants no hosted principal.
    const authority = immutable({ status: 'authorized', grant: 'role', capability: 'official-truth-freigeben' } as const)
    token = ledger.advance(token)
    const files = implementationFiles(), capsules: Pin[] = []
    let group: typeof files = [], size = 0
    const flush = () => {
      if (!group.length) return
      capsules.push(manifest('implementation_bundle', `pilot-code-${capsules.length}`, { encoding: 'base64',
        mediaType: 'application/vnd.jetnity.implementation-source-bundle+json',
        bundleBase64: Buffer.from(bytes({ schema: 'implementation-source-bundle-v1', files: group })).toString('base64') }))
      group = []; size = 0
    }
    for (const file of files) { if (size + Buffer.byteLength(file.utf8) > 150_000) flush(); group.push(file); size += Buffer.byteLength(file.utf8) }
    flush()
    const implementation = capsules[0]!, implementationDependencies = capsules.slice(1).sort((a, b) => order(`${a.id}\0${a.version}\0${a.digest}`, `${b.id}\0${b.version}\0${b.digest}`))
    const code = { implementation, implementationDependencies }
    const contract = (name: IntegratedPilotManifestContent<'semantic_contract'>['contract']) => manifest('semantic_contract', `pilot-${name.replaceAll('_', '-')}`, { contract: name, ...code })
    const scopeContract = contract('scope'), admissionContract = contract('corpus_admission'), basisContract = contract('category_basis')
    const identityContract = contract('content_identity'), hashContract = contract('source_hash'), transportContract = contract('transport')
    const qualificationContract = contract('representation_qualification'), derivationContract = contract('validity_derivation'), acceptanceContract = contract('evidence_acceptance')
    const selectionContract = contract('support_selection'), constructionContract = contract('review_construction')
    const factSchema = manifest('fact_schema', 'pilot-fact-schema', { contract: 'fact_schema', ...code })
    const outputContract = manifest('output_contract', 'pilot-output-contract', { contract: 'output_contract', ...code })
    const proofContract = manifest('proof_contract', 'pilot-proof-contract', { contract: 'proof_contract', ...code })
    const freshnessContract = manifest('freshness_contract', 'pilot-freshness-contract', { contract: 'freshness_contract', ...code })
    const profile = manifest('identity_profile', corpus.profiles[0]!.identityProfileId, {
      identityProfileId: corpus.profiles[0]!.identityProfileId, identityProfileVersion: 1, ...code })
    const catalogSnapshot = manifest('catalog_snapshot', 'pilot-catalog', { registry: corpus.registry,
      profiles: [{ identityProfileId: corpus.profiles[0]!.identityProfileId, identityProfileVersion: 1, definition: profile }] })
    const definitions = corpus.extractors.map(extractor => {
      const { current, match, extract, ...descriptor } = extractor; void match; void extract
      return { id: extractor.extractorId, version: 1, current,
        definition: manifest('extractor_definition', extractor.extractorId, { descriptor, ...code, outputContract, factSchema, applicabilitySchema: null }) }
    })
    const extractorRegistrySnapshot = manifest('extractor_registry', 'pilot-extractor-registry', { definitions })
    const { current: policyCurrent, ...policyDescriptor } = corpus.policy
    const policyDefinition = mode === 'composed' ? manifest('policy_definition', corpus.policy.policyId, { descriptor: policyDescriptor, ...code }) : null
    const policyRegistrySnapshot = policyDefinition ? manifest('policy_registry', 'pilot-policy-registry', {
      definitions: [{ id: corpus.policy.policyId, version: 1, current: policyCurrent, definition: policyDefinition }] }) : null
    const definition = immutable({ id: `pilot-${mode}-global-cell`, version: 1, scope: corpus.scope })
    const cell = put({ pin: historicalPinFor(definition.id, 1, definition)!, artifactType: 'global_cell', artifactContractVersion: 1, canonicalBytes: bytes(definition) })
    const admission = custody('GlobalCellAdmissionV1', `pilot-${mode}-admission`, { cell, scopeContract,
      corpusAdmissionContract: admissionContract, dimensionBasis: Object.fromEntries(Object.entries(corpus.scope).map(([k, category]) => [k, { category, basis: basisContract }])), evaluationDatePlan: null })
    value(validateGlobalCellAdmissionValue(definition, admission.value, admission.pin, scopeContract))
    done.push('independent_fixed_cell_admission'); token = ledger.advance(token)
    const catalogAnswer = quellenKatalogSnapshotAntwort(corpus.registry)!
    const transport: OfficialTruthSourceCatalogTransport = { async aufrufen(payload) {
      if (!historicalValuesEqual(payload, { operation: 'read_registry' })) return { ok: false }
      return { ok: true, antwort: catalogAnswer }
    } }
    trace.catalogReads++ // one external snapshot; all later catalog reads replay these exact bytes
    let fresh = false
    async function retrieve(input: unknown, replay: OfficialTruthSourceCatalogTransport = transport) {
      return decideOfficialTruthServerOwnedRetrieval(input, { catalog: { transport: replay, identityProfiles: corpus.profiles },
        now: () => new Date(fresh ? fault === 'reversed_clock' ? PILOT_ORIGIN_TIME : PILOT_COMPLETION_TIME
          : fault === 'future_original' ? PILOT_COMPLETION_TIME : PILOT_ORIGIN_TIME),
        resolve: async () => [{ address: '93.184.216.34', family: 4 }],
        http: async request => {
          if (fresh) trace.freshHttp++; else trace.originalHttp++
          // Prove actual DNS validation/lookup path, credentials absent and exact code-owned request.
          await new Promise<void>((ok, no) => request.lookup(new URL(request.url).hostname, { all: true }, error => error ? no(error) : ok()))
          if (Object.keys(request.headers).some(k => /cookie|authorization/i.test(k))) return { ok: false, reason: 'http_failed' }
          const item = requested.find(i => request.url === pilotStartUrl(i) || request.url === pilotUrl(i))
          if (!item) return { ok: false, reason: 'http_failed' }
          if (request.url === pilotStartUrl(item)) return { ok: true, status: 302,
            headers: { get: n => n.toLowerCase() === 'location' ? fresh && fault === 'changed_final_url' ? 'https://regulations.example/unknown' : pilotUrl(item) : null }, body: null }
          let body = pilotBody(item)
          if (fault === 'unknown_body_field' || fresh && fault === 'changed_fresh_body') body = body.slice(0, -1) + ',"unused":"unqualified"}'
          return { ok: true, status: 200, headers: { get: n => n.toLowerCase() === 'content-type' ? 'application/json' : null },
            body: (async function* () { yield new TextEncoder().encode(body) })() }
        } })
    }
    const entries: { custody: unknown; pin: Pin; eligible: boolean }[] = [], accepted: EvidenceVersion[] = []
    for (const item of requested) {
      const rep = corpus.registry.contentIdentity!.representations.find(r => r.contentItemId === item)!
      const itemValue = corpus.registry.contentIdentity!.items.find(r => r.contentItemId === item)!
      const itemDefinition = manifest('content_item_definition', `pilot-item-${item}`, { descriptor: itemValue })
      const representationDefinition = manifest('representation_definition', `pilot-representation-${item}`, { descriptor: rep })
      const qualification = custody('GlobalRepresentationQualificationV1', `pilot-qualification-${item}`, {
        binding: contentIdentityBinding(rep), itemDefinition, representationDefinition,
        identityProfileDefinition: profile, qualificationContract })
      const startedAt = fault === 'future_original' ? PILOT_COMPLETION_TIME : PILOT_ORIGIN_TIME
      const retrieval = await retrieve({ sourceId: PILOT_SOURCE, url: pilotStartUrl(item) })
      if (retrieval.status !== 'server_owned_official_retrieval') throw Error('representation_not_global')
      if (!ledger.owns(token)) throw Error('authority_required')
      // Issuer owns this exact controlled response; canonical acceptance happens only here.
      const observation = manifest('original_observation', `pilot-observation-${item}`, {
        binding: contentIdentityBinding(retrieval), requestUrl: retrieval.requestUrl, canonicalFinalUrl: retrieval.canonicalUrl,
        contentType: retrieval.contentType, sourceContentHash: retrieval.sourceContentHash,
        startedAt, completedAt: retrieval.retrievedAt, qualification: qualification.pin,
        transportContract, identityProfile: profile, catalogSnapshot, hashContract })
      const evidenceScope = { ...corpus.scope, sourceId: PILOT_SOURCE }
      const validityOrigin = manifest('validity_origin', `pilot-validity-${item}`, { observation, evidenceScope,
        validFrom: null, validUntil: null, validFromBasis: { kind: 'no_bound_asserted' }, validUntilBasis: { kind: 'no_bound_asserted' }, derivationContract })
      const candidate = evidenceKandidatAusModell({ scope: evidenceScope, validFrom: null, validUntil: null }, retrieval, corpus.registry)
      if (!candidate.ok) throw Error(candidate.reason)
      const result = evidenceKandidatAkzeptieren(candidate.evidence, corpus.registry)
      if (!result.ok) throw Error(result.reason)
      trace.evidenceAcceptances++
      const { previousVersionId, lifecycle, validationState, sourceClass, authorityName, publisherName, scope, extractionNote, ...evidenceIdentity } = result.evidence
      void previousVersionId; void lifecycle; void validationState; void sourceClass; void authorityName; void publisherName; void extractionNote
      const acceptedOrigin = manifest('accepted_origin', `pilot-accepted-${item}`, { observation, validityOrigin, cell,
        globalAdmission: admission.pin, evidenceIdentity, evidenceScope: scope, acceptanceContract })
      const issued = custody('AcceptedEvidenceCustodyV1', `pilot-custody-${item}`, { cell, globalAdmission: admission.pin,
        scopeContract, evidenceScope: scope, evidenceIdentity, observation, validityOrigin, acceptedOrigin, identityContract, hashContract })
      originMembership.add(issued.value)
      entries.push({ custody: issued.value, pin: issued.pin, eligible: true }); accepted.push(immutable(result.evidence))
    }
    if (fault === 'missing_origin') entries[0]!.custody = structuredClone(entries[0]!.custody)
    if (entries.some(e => !originMembership.has(e.custody as object))) throw Error('custody_missing')
    done.push('controlled_original_observation', 'canonical_evidence_acceptance', 'original_custody_membership'); token = ledger.advance(token)
    const requiredContentItemRefs = requested.map(contentItemId => ({ sourceId: PILOT_SOURCE, contentItemId }))
    const quality = mode === 'primary' ? 'explicit_primary_statement' : 'composed_from_multiple_primary_sources'
    const selection = custody('SupportSelectionDefinitionV1', `pilot-${mode}-selection`, { cell, requirementType: 'visa',
      factKind: 'requirement_effect', evidenceQuality: quality, requiredContentItemRefs, selectionContract })
    const eligibleVersionSnapshot = manifest('eligible_version_snapshot', `pilot-${mode}-eligibility`, { entries: entries.map((e, i) => ({ versionId: accepted[i]!.versionId, custody: e.pin, eligible: true })).sort((a, b) => order(a.versionId, b.versionId)) })
    if (fault === 'duplicate_support') entries.push(entries[0]!)
    if (fault === 'missing_support') entries.pop()
    const selected = value(selectHistoricalSupports({ definition, admission: admission.value, admissionPin: admission.pin,
      scopeContract, identityContract, hashContract, selectionDefinition: selection.value, selectionPin: selection.pin,
      eligibleVersionSnapshot, catalogSnapshot, extractorRegistrySnapshot, policyRegistrySnapshot, entries }))
    const selectedManifest = custody('SelectedSupportManifestV1', `pilot-${mode}-manifest`, selected.manifest.value)
    const versions = selected.manifest.value.supports.map(s => accepted.find(v => v.versionId === s.versionId)!)
    done.push('unique_support_selection'); token = ledger.advance(token)
    const review = value(constructHistoricalAutonomousReview({ definition, manifest: selected.manifest, manifestPin: selectedManifest.pin,
      constructionContract, custodies: selected.custodies, acceptedVersions: versions, registry: corpus.registry,
      proposal: fault === 'non_null_proposal' ? { effect: 'required' } : null }))
    const reviewed = custody('AutonomousReviewConstructionV1', `pilot-${mode}-review`, review.value)
    const proof = proveOfficialTruthCustodiedMaterial({ authority, registry: corpus.registry, evidenceVersions: versions,
      review, scope: fault === 'scope_substitution' ? { ...corpus.scope, destinationCountryCode: 'JP' } : corpus.scope,
      serverReferenceTime: PILOT_REFERENCE_TIME })
    if (proof.status !== 'same_request_proof') throw Error(proof.reason)
    trace.proof = true; done.push('safe_review_v3', 'scope_identity_freshness_proof'); token = ledger.advance(token)
    fresh = true
    const extracted = await decideOfficialTruthSameRequestTrustedFactExtraction(null, {
      loadProof: async () => proof, retrieve,
      extract: input => officialTruthTrustedFactExtrahierenMitDefinitionen(input, corpus.extractors),
      compositionExtractors: corpus.extractors, compositionPolicies: [corpus.policy] })
    if (extracted.status === 'blocked') throw Error(extracted.reason)
    const primary = consumeOfficialTruthSameRequestPrimaryContext(extracted)
    const composed = consumeOfficialTruthSameRequestCompositionExecutionContext(extracted)
    if (!primary && !composed) throw Error('execution_context_unavailable')
    const fact = primary ? primary.execution.fact : composed!.context.phaseB.fact
    const selectedExtractor = primary ? primary.execution.selected : composed!.execution.selected.extractor
    if (selectedExtractor.extract !== corpus.extractors.find(e => e.extractorId === selectedExtractor.extractorId)!.extract) throw Error('execution_context_unavailable')
    if (composed && officialTruthCompositionSealView(composed.context.phaseB.seal)?.fact !== fact) throw Error('composition_context_incomplete')
    const retrievals = primary ? primary.retrievals : composed!.context.retrievals
    if (retrievals.some(r => Date.parse(r.retrievedAt) < Date.parse(PILOT_REFERENCE_TIME))) throw Error('freshness_gap')
    trace.extracted = true; trace.actualFactIdentity = true; done.push('fresh_retrieval', `${mode}_actual_execution_context`); token = ledger.advance(token)
    const supports = versions.map(v => ({ versionId: v.versionId, identitySchema: 2 as const, binding: contentIdentityBinding(v),
      canonicalFinalUrl: v.canonicalUrl, contentType: v.contentType, sourceContentHash: v.sourceContentHash,
      acceptedRetrievedAt: v.retrievedAt, validFrom: v.validFrom, validUntil: v.validUntil,
      freshRetrieval: { requestUrl: retrievals.find(r => r.versionId === v.versionId)!.requestUrl,
        completedAt: retrievals.find(r => r.versionId === v.versionId)!.retrievedAt } }))
    const ids = supports.map(s => s.versionId)
    const targets = officialTruthFactCitationTargets(fact)
    if (!targets) throw Error('receipt_projection_mismatch')
    const citations = targets.map(target => ({ target, supportVersionIds: primary ? ids : [...new Set(composed!.context.phaseB.provenance
      .filter(row => historicalValuesEqual(row.target, target)).map(row => row.versionId))].sort() })).sort((a, b) => order(provenanceCanonical(a.target)!, provenanceCanonical(b.target)!))
    const selectedDefinition = definitions.find(d => d.id === selectedExtractor.extractorId)!.definition
    const factHash = provenanceHash('ot-fact-v1', { factSchema, applicabilitySchema: null, factKind: 'requirement_effect', requirementType: 'visa', fact })!
    const candidateBinding = provenanceHash('ot-candidate-v1', { scope: corpus.scope, ruleScopeKey: corpus.ruleScopeKey,
      factKind: 'requirement_effect', requirementType: 'visa', schemaFamily: selectedExtractor.schemaFamily, factSchema,
      applicabilitySchema: null, factHash, evidenceQuality: quality, supportVersionIds: ids })!
    const commonSelection = { factKind: 'requirement_effect', requirementType: 'visa', contentItemRefs: requiredContentItemRefs,
      representations: supports.map(s => s.binding).sort((a, b) => order(provenanceCanonical(a)!, provenanceCanonical(b)!)), canonicalFinalUrls: supports.map(s => s.canonicalFinalUrl) }
    const selectionKey = mode === 'primary' ? provenanceHash('ot-extractor-selection-v1', { path: 'explicit_post_retrieval',
      selectorContract: proofContract, registrySnapshot: extractorRegistrySnapshot, ...commonSelection, evidenceQuality: quality,
      observedContentTypes: ['application/json'], policy: null })! : provenanceHash('ot-composition-selection-v1', {
      path: 'composed_pre_http', selectorContract: proofContract, extractorRegistrySnapshot, policyRegistrySnapshot,
      ...commonSelection, sourceFamilyId: selectedExtractor.sourceFamilyId, schemaFamily: selectedExtractor.schemaFamily })!
    const assignments = [...corpus.policy.assignments].sort((a, b) => order(provenanceCanonical(a.target)!, provenanceCanonical(b.target)!))
    const policyReceipt = mode === 'composed' ? { policyId: corpus.policy.policyId, policyVersion: 1, definition: policyDefinition!,
      registrySnapshot: policyRegistrySnapshot!, preHttpSelectionKey: selectionKey, assignments,
      resultIdentity: provenanceHash('ot-composition-result-v1', { candidateBinding, factHash, extractorDefinition: selectedDefinition,
        extractorRegistrySnapshot, outputContract, policyDefinition, policyRegistrySnapshot, preHttpSelectionKey: selectionKey,
        assignments, supportVersionIds: ids, citations })! } : null
    const proofFields = { contract: proofContract, reviewPacketKey: proof.reviewPacketKey, catalogSnapshot,
      serverReferenceTime: PILOT_REFERENCE_TIME, freshnessContract, evidenceFreshnessAtReference: 'current' as const }
    const proofIdentity = provenanceHash('ot-proof-v1', { ...proofFields, ruleScopeKey: corpus.ruleScopeKey,
      factKind: 'requirement_effect', supportVersionIds: ids })!
    const payload: IntegratedPilotPayload = { schema: 'official-truth-autonomous-provenance', schemaVersion: 1,
      canonicalization: 'ot-provenance-json-v1', outcome: 'trusted_fact_produced',
      globalCell: { definition: cell, scope: corpus.scope, ruleScopeKey: corpus.ruleScopeKey },
      candidate: { factKind: 'requirement_effect', requirementType: 'visa', factSchema, applicabilitySchema: null,
        fact: structuredClone(fact), factHash, candidateBinding }, evidenceQuality: quality,
      extractor: { extractorId: selectedExtractor.extractorId, extractorVersion: selectedExtractor.extractorVersion,
        sourceFamilyId: selectedExtractor.sourceFamilyId, schemaFamily: selectedExtractor.schemaFamily, definition: selectedDefinition,
        registrySnapshot: extractorRegistrySnapshot, outputContract, selectionKey }, policy: policyReceipt, supports, citations,
      proof: { ...proofFields, proofIdentity } }
    const recordFingerprint = provenanceHash('ot-provenance-v1', payload)!
    const binding = value(readHistoricalArtifact('CustodyDependencyBindingV1', { kind: 'CustodyDependencyBindingV1', schemaVersion: 1,
      value: { receiptFingerprint: recordFingerprint, globalAdmission: admission.pin, selectedSupportManifest: selectedManifest.pin, autonomousReviewConstruction: reviewed.pin } }))
    trace.receiptProjected = true; done.push('private_receipt_and_separate_binding_projection')
    // No intermediate artifact escapes. Typed graph verification must finish before publication.
    const checked = verifyIntegratedPilotBundle({ recordFingerprint, receiptBytes: bytes(payload), custodyBindingBytes: bytes(binding), artifacts })
    if (!checked.ok) { closureBound = checked.bound ?? null; throw Error(checked.reason) }
    if (!ledger.owns(token)) throw Error('authority_required')
    trace.publicationCount++; ledger.close()
    return immutable({ status: 'synthetic_bundle_verified' as const, mode, fault, stages: done, trace })
  } catch (error) {
    ledger.close()
    // Fixed diagnostics only; never expose a partial receipt, fact, source body, origin or token.
    const reason = error instanceof Error && /^[a-z][a-z0-9_]{1,80}$/.test(error.message) ? error.message : 'execution_context_unavailable'
    return immutable({ status: 'blocked' as const, mode: safeMode, fault: safeFault, reason, closureBound, stages: done, trace })
  }
}
