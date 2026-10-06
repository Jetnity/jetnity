import assert from 'node:assert/strict'
import { test } from 'node:test'
import { createHash } from 'node:crypto'
import { readFileSync, readdirSync } from 'node:fs'
import { dirname, join, resolve } from 'node:path'
import { fileURLToPath } from 'node:url'
import { createRequire } from 'node:module'
import { runInNewContext } from 'node:vm'
import ts from 'typescript'
import {
  decodeProvenanceBytes, historicalPinFor, immutable, ownRecord, pinsEqual,
  positiveVersion, PROVENANCE_LIMITS, provenanceCanonical, provenanceHash, readPin, semanticId, type HistoricalResult,
} from './official-truth-autonomous-provenance-artifact'
import {
  artifactPinMatches, cellPinMatches, decodeHistoricalArtifact, historicalFactIdentity, historicalCandidateIdentity, historicalProofIdentity, readGlobalCellDefinition, readHistoricalArtifact,
  readHistoricalFactValue, readSafeReviewPreimage, readSupportReceipt,
} from './official-truth-autonomous-provenance-record'
import { validateGlobalCellAdmissionValue } from './official-truth-global-cell-admission-server'
import { validateAcceptedCustodyValue } from './official-truth-evidence-metadata-custody-server'
import { selectHistoricalSupports } from './official-truth-support-selection-server'
import { constructHistoricalAutonomousReview, validateHistoricalCustodyBinding } from './official-truth-autonomous-review-material-server'
import { qualifySyntheticGlobalRepresentation, SYNTHETIC_GLOBAL_REPRESENTATION_QUALIFICATION } from './official-truth-global-representation-qualification'
import { runOfficialTruthGlobalProduction } from './official-truth-autonomous-provenance-record-server'
import { contentEvidenceVersionV2 } from './official-truth-content-identity'
import { evidenceSuchschluessel, type EvidenceVersion } from './evidence'
import { regelScopeAusEvidenceScope } from './rule-claims'
import { quellenRegistryErstellen } from './source-registry'
import { r2Registry, r2Binding } from './official-truth-content-identity-r2.test'

const root = resolve(dirname(fileURLToPath(import.meta.url)), '../..')
const bytes = (s: string) => new TextEncoder().encode(s)
const hash = (s: string) => createHash('sha256').update(s).digest('hex')
function good<T>(result: HistoricalResult<T>): T { assert.equal(result.ok, true, JSON.stringify(result)); if (!result.ok) throw Error('blocked'); return result.value }
function bad(result: HistoricalResult<unknown>) { assert.equal(result.ok, false) }
const pin = (id: string) => historicalPinFor(id, 1, { synthetic: id })!
const artifact = <K extends string, T>(kind: K, value: T) => ({ kind, schemaVersion: 1 as const, value })
const artifactPin = (id: string, value: unknown) => historicalPinFor(id, 1, value)!

function fixture(composed = false) {
  const scope = goodScope({ destinationCountryCode: 'NZ', transitCountryCode: null,
    citizenship: { mode: 'required', countryCodes: ['CH'] }, credentialOption: { mode: 'option', documentType: 'passport', issuingCountryCode: 'CH', relatedCitizenshipCountryCode: 'CH' },
    residence: { mode: 'not_applicable' }, requirementType: 'passport_validity', validity: { mode: 'not_applicable' } })
  const definition = { id: 'synthetic-cell', version: 1, scope }, cell = artifactPin(definition.id, definition), scopeContract = pin('synthetic-scope')
  const admission = artifact('GlobalCellAdmissionV1', { cell, scopeContract, corpusAdmissionContract: pin('synthetic-corpus'),
    dimensionBasis: Object.fromEntries(Object.entries(scope).map(([key, category]) => [key, { category, basis: pin(`synthetic-category-${key.toLowerCase()}`) }])), evaluationDatePlan: null })
  const admissionPin = artifactPin('synthetic-admission', admission)
  const urls = composed ? ['https://authority.example/one', 'https://authority.example/two'] : ['https://authority.example/one']
  const sources = quellenRegistryErstellen([{ sourceId: 'example-authority', sourceClass: 'official_authority', publisherName: 'Synthetic Authority', authorityName: 'Synthetic Authority', domains: ['authority.example'] }])
  assert.ok(sources.ok)
  const registry = r2Registry(sources.registry, urls)
  const versions: EvidenceVersion[] = urls.map((url): EvidenceVersion => {
    const binding = r2Binding(registry, url), evidenceScope = { ...scope, sourceId: binding.sourceId }
    const lookup = evidenceSuchschluessel(evidenceScope, { sourceId: binding.sourceId, contentItemId: binding.contentItemId, representationId: binding.representationId }); assert.ok(lookup.ok)
    const version = contentEvidenceVersionV2({ ...binding, identitySchema: 2, lookupKey: lookup.key, canonicalUrl: url, contentType: 'text/plain',
      sourceContentHash: hash('synthetic global bytes'), retrievedAt: '2026-10-05T10:00:00.000Z', validFrom: null, validUntil: null }); assert.ok(version.ok)
    // Complete already-accepted SYNTHETIC values; no Evidence acceptance constructor is called.
    return { ...version.value.identity, versionId: version.value.versionId, previousVersionId: null, lifecycle: 'accepted', validationState: 'valid',
      sourceClass: 'official_authority', authorityName: 'Synthetic Authority', publisherName: 'Synthetic Authority', scope: evidenceScope, extractionNote: null }
  }).sort((a, b) => a.versionId < b.versionId ? -1 : 1)
  const identityContract = pin('synthetic-identity'), hashContract = pin('synthetic-hash')
  const entries = versions.map(version => {
    const { previousVersionId, lifecycle, validationState, sourceClass, authorityName, publisherName, scope: evidenceScope, extractionNote, ...identity } = version
    void previousVersionId; void lifecycle; void validationState; void sourceClass; void authorityName; void publisherName; void extractionNote
    const custody = artifact('AcceptedEvidenceCustodyV1', { cell, globalAdmission: admissionPin, scopeContract, evidenceScope, evidenceIdentity: identity,
      observation: pin(`synthetic-observation-${identity.contentItemId}`), validityOrigin: pin('synthetic-validity'), acceptedOrigin: pin(`synthetic-origin-${identity.contentItemId}`), identityContract, hashContract })
    return { custody, pin: artifactPin(`synthetic-custody-${identity.contentItemId}`, custody), eligible: true }
  })
  const selectionDefinition = artifact('SupportSelectionDefinitionV1', { cell, requirementType: scope.requirementType, factKind: 'passport_validity',
    evidenceQuality: composed ? 'composed_from_multiple_primary_sources' : 'explicit_primary_statement',
    requiredContentItemRefs: versions.map(({ sourceId, contentItemId }) => ({ sourceId, contentItemId })).sort((a, b) => a.contentItemId < b.contentItemId ? -1 : 1), selectionContract: pin('synthetic-selection') })
  return { definition, admission, admissionPin, scopeContract, entries, versions, registry, identityContract, hashContract, selectionDefinition,
    selectionPin: artifactPin('synthetic-selection-definition', selectionDefinition), eligibleVersionSnapshot: pin('synthetic-eligible-snapshot'), catalogSnapshot: pin('synthetic-catalog'),
    extractorRegistrySnapshot: pin('synthetic-extractors'), policyRegistrySnapshot: composed ? pin('synthetic-policies') : null }
}
function goodScope(value: unknown) { const read = regelScopeAusEvidenceScope(value); assert.ok(read.ok); return read.scope }
function selected(composed = false) { const f = fixture(composed), selection = good(selectHistoricalSupports(f)); return { f, ...selection } }
function reviewFixture(composed = false) {
  const s = selected(composed), manifestPin = artifactPin('synthetic-selected', s.manifest)
  const input = { definition: s.f.definition, manifest: s.manifest, manifestPin, constructionContract: pin('synthetic-review-contract'),
    custodies: s.custodies, acceptedVersions: s.f.versions, registry: s.f.registry, proposal: null }
  const review = good(constructHistoricalAutonomousReview(input))
  return { ...s, input, review, reviewPin: artifactPin('synthetic-review', review) }
}

test('C27 exact #855 C/H bytes, UTF-16/numeric key order and LF domain separation', () => {
  const value = { '2': 'two', '10': 'ten', z: null, a: ['é', '😀', '\n', 12] }
  const canonical = '{"10":"ten","2":"two","a":["é","😀","\\n",12],"z":null}'
  assert.equal(provenanceCanonical(value), canonical)
  assert.equal(provenanceHash('ot-fact-v1', value), 'ot-fact-v1:' + hash('ot-fact-v1\n' + canonical))
  assert.notEqual(provenanceHash('ot-proof-v1', value), provenanceHash('ot-fact-v1', value))
  assert.equal(provenanceHash('unknown-version' as 'ot-fact-v1', value), null)
  assert.deepEqual(good(decodeProvenanceBytes(bytes(canonical))), value)
})
for (const [name, raw] of Object.entries({ duplicate: '{"a":1,"a":2}', nestedDuplicate: '{"a":{"x":1,"x":1}}', escapedDuplicate: '{"a":1,"\\u0061":1}',
  whitespace: '{ "a":1}', exponent: '{"a":1e0}', negativeZero: '{"a":-0}', fraction: '{"a":1.5}', unsafeInteger: '{"a":9007199254740992}',
  bom: '\ufeff{}', trailingLF: '{}\n', ordering: '{"z":1,"a":2}', surrogate: '{"a":"\\ud800"}', slashEscape: '{"a":"\\/"}' })) {
  test(`C22 canonical decoder rejects ${name}`, () => bad(decodeProvenanceBytes(bytes(raw))))
}
test('C22 invalid UTF-8, prototypes/accessors/symbols/sparse arrays/cycles reject without getters', () => {
  bad(decodeProvenanceBytes(new Uint8Array([0xff])))
  let reads = 0
  const getter = Object.defineProperty({}, 'value', { enumerable: true, get() { reads++; throw Error('private') } })
  const array = [1]; Object.defineProperty(array, '0', { enumerable: true, get() { reads++; return 1 } })
  const cycle: Record<string, unknown> = {}; cycle.self = cycle
  for (const value of [getter, array, new Date(), { [Symbol('brand')]: true }, [,,], cycle, { a: undefined }, { a: NaN }, { a: Infinity }, { a: -0 }, { a: 1n }, Object.create({ brand: true })]) {
    assert.equal(provenanceCanonical(value), null)
    bad(readGlobalCellDefinition(value))
  }
  assert.equal(reads, 0)
  assert.equal(ownRecord(getter, ['value']), null)
})
test('C23 exact byte/depth bounds and deeper shared structural paths', () => {
  const exact = 'a'.repeat(PROVENANCE_LIMITS.artifactBytes - 2)
  assert.equal(provenanceCanonical(exact)?.length, PROVENANCE_LIMITS.artifactBytes)
  assert.equal(provenanceCanonical(exact + 'a'), null)
  bad(decodeProvenanceBytes(bytes('"' + exact + 'a"')))
  assert.equal(provenanceCanonical('é', 4), '"é"'); assert.equal(provenanceCanonical('é', 3), null)
  let nested: unknown = null
  for (let i = 0; i < 32; i++) nested = [nested]
  assert.notEqual(provenanceCanonical(nested), null); assert.equal(provenanceCanonical([nested]), null)
  assert.equal(provenanceCanonical({ shallow: nested, deeper: [nested] }), null)
  assert.equal(provenanceCanonical({}, Infinity), null)
})
test('C27 global definition exception and exact versioned custody artifact bytes', () => {
  const f = fixture(), bytesOfDefinition = provenanceCanonical(f.definition)!
  assert.equal(f.admission.value.cell.digest, hash(bytesOfDefinition))
  assert.notEqual(f.admission.value.cell.digest, hash(provenanceCanonical(artifact('GlobalCellDefinitionV1', f.definition))!))
  assert.equal(f.admissionPin.digest, hash(provenanceCanonical(f.admission)!))
  assert.ok(cellPinMatches(f.admission.value.cell, f.definition))
  assert.ok(artifactPinMatches('GlobalCellAdmissionV1', f.admissionPin, f.admission))
  const decoded = good(decodeHistoricalArtifact('GlobalCellAdmissionV1', bytes(provenanceCanonical(f.admission)!)))
  assert.deepEqual(decoded, f.admission)
  assert.ok(Object.isFrozen(decoded.value.dimensionBasis.citizenship))
  // Accepted #855 section 13 worked scope, not a claim about New Zealand law.
  assert.equal(provenanceCanonical(f.definition.scope), '{"citizenship":{"countryCodes":["CH"],"mode":"required"},"credentialOption":{"documentType":"passport","issuingCountryCode":"CH","mode":"option","relatedCitizenshipCountryCode":"CH"},"destinationCountryCode":"NZ","requirementType":"passport_validity","residence":{"mode":"not_applicable"},"transitCountryCode":null,"validity":{"mode":"not_applicable"}}')
})
test('C12 exact Pin type/version/digest, no ID/latest alias or unknown codec', () => {
  const p = pin('synthetic'), f = fixture()
  for (const invalid of [{ ...p, version: 0 }, { ...p, version: 1.1 }, { ...p, version: '1' }, { ...p, id: 'latest/current' }, { ...p, digest: p.digest.toUpperCase() }, { ...p, userId: hash('secret') }, { id: p.id }]) assert.equal(readPin(invalid), null)
  assert.ok(semanticId(p.id)); assert.ok(positiveVersion(1)); assert.ok(pinsEqual(p, { ...p })); assert.equal(pinsEqual(p, { ...p, version: 2 }), false)
  bad(readHistoricalArtifact('GlobalCellAdmissionV1', { ...f.admission, schemaVersion: 2 }))
  bad(readHistoricalArtifact('GlobalCellAdmissionV1', { ...f.admission, kind: 'GlobalCellAdmissionV2' }))
  bad(readHistoricalArtifact('unknown' as 'GlobalCellAdmissionV1', f.admission))
  assert.equal(artifactPinMatches('AcceptedEvidenceCustodyV1', f.admissionPin, f.admission), false)
  assert.equal(artifactPinMatches('GlobalCellAdmissionV1', { ...f.admissionPin, digest: '0'.repeat(64) }, f.admission), false)
})
for (const field of ['userId', 'tripId', 'requestId', 'sessionId', 'travellerId', 'passportNumber', 'prompt', 'model', 'personalHash', 'conversationHash']) {
  test(`C15/C20 forbidden ${field}, including hashes, rejected at exact domain schemas`, () => {
    const f = fixture()
    bad(readGlobalCellDefinition({ ...f.definition, [field]: hash('personal') }))
    bad(readHistoricalArtifact('GlobalCellAdmissionV1', { ...f.admission, value: { ...f.admission.value, [field]: hash('personal') } }))
    bad(readHistoricalArtifact('AcceptedEvidenceCustodyV1', { ...f.entries[0]!.custody, value: { ...f.entries[0]!.custody.value, evidenceIdentity: { ...f.entries[0]!.custody.value.evidenceIdentity, [field]: hash('personal') } } }))
  })
}
test('C16 exact admission categories and seven fields; no qualifier/citizenship substitution', () => {
  const f = fixture(); good(validateGlobalCellAdmissionValue(f.definition, f.admission, f.admissionPin, f.scopeContract))
  for (const change of [{ citizenship: { mode: 'required', countryCodes: ['CH', 'RS'] } }, { residence: { mode: 'country', countryCode: 'DE' } }, { destinationCountryCode: 'AU' },
    { credentialOption: { ...f.definition.scope.credentialOption, issuingCountryCode: 'DE' } }]) {
    bad(validateGlobalCellAdmissionValue({ ...f.definition, scope: { ...f.definition.scope, ...change } }, f.admission, f.admissionPin, f.scopeContract))
  }
  const changed = structuredClone(f.admission); changed.value.dimensionBasis.destinationCountryCode!.category = 'AU'
  bad(validateGlobalCellAdmissionValue(f.definition, changed, artifactPin('synthetic-admission', changed), f.scopeContract))
  bad(readHistoricalArtifact('GlobalCellAdmissionV1', { ...f.admission, value: { ...f.admission.value, evaluationDatePlan: pin('synthetic-date-plan') } }))
})
test('C04 full custody identity comparison rejects same hash under another context', () => {
  const f = fixture(), e = f.entries[0]!
  good(validateAcceptedCustodyValue({ ...f, custody: e.custody, custodyPin: e.pin, expectedIdentity: e.custody.value.evidenceIdentity }))
  for (const key of ['sourceId', 'contentItemId', 'representationId', 'identityProfileId', 'retrievedAt', 'canonicalUrl']) {
    bad(validateAcceptedCustodyValue({ ...f, custody: e.custody, custodyPin: e.pin, expectedIdentity: { ...e.custody.value.evidenceIdentity, [key]: 'different-context' } }))
  }
  const changed = structuredClone(e.custody); changed.value.evidenceIdentity.identityProfileVersion++
  bad(readHistoricalArtifact('AcceptedEvidenceCustodyV1', changed))
  const scopeChanged = structuredClone(e.custody); scopeChanged.value.evidenceScope.destinationCountryCode = 'AU'
  bad(readHistoricalArtifact('AcceptedEvidenceCustodyV1', scopeChanged))
})
test('C08 deterministic primary/composed exact selection retains complete snapshot', () => {
  for (const composed of [false, true]) {
    const f = fixture(composed), a = good(selectHistoricalSupports(f)), b = good(selectHistoricalSupports({ ...f, entries: [...f.entries].reverse() }))
    assert.deepEqual(a.manifest, b.manifest); assert.deepEqual(a.custodies, b.custodies)
    assert.deepEqual(a.snapshot, f.entries); assert.ok(Object.isFrozen(a.snapshot))
  }
})
for (const mutation of ['missing', 'duplicate', 'ambiguous', 'extra', 'ineligible', 'same-item-representation', 'policy-null', 'snapshot-missing', 'bound'] as const) {
  test(`C08 selection rejects ${mutation} with no subset/latest fallback`, () => {
    const f = fixture(true)
    const input: Parameters<typeof selectHistoricalSupports>[0] = { ...f, entries: [...f.entries] }
    if (mutation === 'missing') input.entries = f.entries.slice(1)
    if (mutation === 'duplicate') input.entries = [...f.entries, f.entries[0]]
    if (mutation === 'ineligible') input.entries = f.entries.map(e => ({ ...e, eligible: false }))
    if (mutation === 'policy-null') input.policyRegistrySnapshot = null
    if (mutation === 'snapshot-missing') input.eligibleVersionSnapshot = null as never
    if (mutation === 'bound') input.entries = Array(257).fill(f.entries[0])
    if (['ambiguous', 'extra', 'same-item-representation'].includes(mutation)) {
      const extra = structuredClone(f.entries[0]!)
      const { versionId, ...identity } = extra.custody.value.evidenceIdentity; void versionId
      if (mutation === 'ambiguous') identity.retrievedAt = '2026-10-05T10:00:01.000Z'
      else if (mutation === 'extra') identity.contentItemId = 'unrequested_item'
      else identity.representationId = 'second_representation'
      const lookup = evidenceSuchschluessel(extra.custody.value.evidenceScope, { sourceId: identity.sourceId, contentItemId: identity.contentItemId, representationId: identity.representationId }); assert.ok(lookup.ok); identity.lookupKey = lookup.key
      const v = contentEvidenceVersionV2(identity); assert.ok(v.ok)
      extra.custody.value.evidenceIdentity = { ...v.value.identity, versionId: v.value.versionId }
      extra.pin = artifactPin('synthetic-additional-custody', extra.custody)
      input.entries = [...f.entries, extra]
    }
    bad(selectHistoricalSupports(input))
  })
}
test('C07 proposal-null review construction and immutable input/output; no notes in identity', () => {
  for (const composed of [false, true]) {
    const f = reviewFixture(composed), before = provenanceCanonical(f.input)
    assert.equal(f.review.value.safePreimage.candidate.proposal, null)
    good(readSafeReviewPreimage(f.review.value.safePreimage))
    assert.ok(Object.isFrozen(f.review.value.safePreimage.candidate.scope.citizenship))
    const again = good(constructHistoricalAutonomousReview(f.input)); assert.deepEqual(f.review, again)
    assert.equal(provenanceCanonical(f.input), before)
    bad(constructHistoricalAutonomousReview({ ...f.input, proposal: { kind: 'passport_validity' } }))
    bad(readHistoricalArtifact('AutonomousReviewConstructionV1', { ...f.review, value: { ...f.review.value, reviewPacketKey: 'review-packet:v3:' + '0'.repeat(64) } }))
    bad(constructHistoricalAutonomousReview({ ...f.input, acceptedVersions: [] }))
    bad(constructHistoricalAutonomousReview({ ...f.input, custodies: [structuredClone(f.custodies[0]), structuredClone(f.custodies[0])] }))
  }
})
test('C21 separate custody binding matches exact admission/manifest/review and fingerprint', () => {
  const f = reviewFixture(), receiptFingerprint = 'ot-provenance-v1:' + 'a'.repeat(64)
  const binding = artifact('CustodyDependencyBindingV1', { receiptFingerprint, globalAdmission: f.f.admissionPin, selectedSupportManifest: f.input.manifestPin, autonomousReviewConstruction: f.reviewPin })
  const input = { binding, receiptFingerprint, admission: f.f.admission, admissionPin: f.f.admissionPin, manifest: f.manifest, manifestPin: f.input.manifestPin, review: f.review, reviewPin: f.reviewPin }
  good(validateHistoricalCustodyBinding(input))
  bad(validateHistoricalCustodyBinding({ ...input, receiptFingerprint: 'ot-provenance-v1:' + 'b'.repeat(64) }))
  for (const field of ['globalAdmission', 'selectedSupportManifest', 'autonomousReviewConstruction'] as const) {
    bad(validateHistoricalCustodyBinding({ ...input, binding: { ...binding, value: { ...binding.value, [field]: pin('different-binding') } } }))
  }
  bad(readHistoricalArtifact('CustodyDependencyBindingV1', { ...binding, value: { ...binding.value, payload: {} } }))
})
test('C05/C27 #855 support receipt retains original/fresh clocks, required nulls and exact bytes', () => {
  const f = fixture(), e = f.entries[0]!.custody.value.evidenceIdentity
  const binding = r2Binding(f.registry, e.canonicalUrl)
  const support = { versionId: e.versionId, identitySchema: 2, binding, canonicalFinalUrl: e.canonicalUrl, contentType: e.contentType,
    sourceContentHash: e.sourceContentHash, acceptedRetrievedAt: e.retrievedAt, validFrom: null, validUntil: null,
    freshRetrieval: { requestUrl: e.canonicalUrl, completedAt: '2026-10-05T10:01:00.100Z' } }
  assert.deepEqual(good(readSupportReceipt(support, e, '2026-10-05T10:01:00.000Z')), support)
  bad(readSupportReceipt({ ...support, validFrom: undefined }, e, '2026-10-05T10:01:00.000Z'))
  bad(readSupportReceipt({ ...support, binding: { ...binding, identityProfileVersion: 2 } }, e, '2026-10-05T10:01:00.000Z'))
  bad(readSupportReceipt(support, e, '2026-10-05T09:59:59.000Z'))
  bad(readSupportReceipt(support, e, '2026-10-05T10:01:01.000Z'))
  bad(readSupportReceipt({ ...support, freshRetrieval: { ...support.freshRetrieval, completedAt: '2027-01-01T00:00:00.000Z' } }, e, '2027-01-01T00:00:00.000Z'))
})
test('C12 legacy/v1 fact values never accept v2 carriers or mislabel applicability', () => {
  const registry = fixture().registry
  good(readHistoricalFactValue('passport_validity', 'passport_validity', { kind: 'passport_validity', semantics: 'valid_on_entry', duration: null }, null, registry))
  good(readHistoricalFactValue('requirement_effect', 'visa', { kind: 'requirement_effect', schema: 1, applicability: { schema: 1, kind: 'unconditional' }, effect: 'not_required', visaMode: 'visa_exempt' }, 1, registry))
  for (const schema of [2, 3, '1']) bad(readHistoricalFactValue('requirement_effect', 'visa', { kind: 'requirement_effect', schema, applicability: { schema, kind: 'unconditional' }, effect: 'not_required', visaMode: 'visa_exempt' }, 1, registry))
  bad(readHistoricalFactValue('passport_validity', 'passport_validity', { kind: 'passport_validity', semantics: 'valid_on_entry', duration: null }, 2 as 1, registry))
  bad(readHistoricalFactValue('passport_validity', 'passport_validity', { kind: 'passport_validity', semantics: 'valid_on_entry', duration: null }, 1, registry))
})
function observation() { return immutable({ binding: SYNTHETIC_GLOBAL_REPRESENTATION_QUALIFICATION.value.binding,
  requestUrl: 'https://authority.example/global/passport', finalUrl: 'https://authority.example/global/passport', contentType: 'application/json', method: 'GET', credentials: 'omit', headers: {}, redirects: [],
  bodyText: '{"publication":"passport-validity","rule":"valid_on_entry","schema":"synthetic-global-regulation-v1"}' }) }
test('C17 full finite synthetic qualification accepts only entire non-personal response/transport', () => {
  good(qualifySyntheticGlobalRepresentation(SYNTHETIC_GLOBAL_REPRESENTATION_QUALIFICATION, observation()))
  for (const change of [{ requestUrl: observation().requestUrl + '?token=secret' }, { finalUrl: 'https://authority.example/case/person' }, { headers: { Cookie: 'session' } },
    { credentials: 'include' }, { redirects: ['https://authority.example/private'] }, { method: 'POST' }, { bodyText: observation().bodyText.replace('}', ',"person":{"name":"private"}}') },
    { bodyText: hash(observation().bodyText) }, { bodyText: 'CAPTCHA' }, { sessionHash: hash('secret') }, { bodyText: observation().bodyText + '\n' }]) {
    bad(qualifySyntheticGlobalRepresentation(SYNTHETIC_GLOBAL_REPRESENTATION_QUALIFICATION, immutable({ ...observation(), ...change })))
  }
  bad(qualifySyntheticGlobalRepresentation({ ...SYNTHETIC_GLOBAL_REPRESENTATION_QUALIFICATION, value: { ...SYNTHETIC_GLOBAL_REPRESENTATION_QUALIFICATION.value, qualificationContract: pin('caller-asserted-global') } }, observation()))
})

// The production file exports ONLY the blocked root. This isolated compiled test copy
// exposes lexical functions to tests; no test factory/export is shipped or imported live.
function privateInvocationFactory() {
  const source = readFileSync(join(root, 'lib/readiness/official-truth-autonomous-provenance-record-server.ts'), 'utf8')
  const output = ts.transpileModule(source + '\nexport { createInvocation }', { compilerOptions: { module: ts.ModuleKind.CommonJS, target: ts.ScriptTarget.ES2022 } }).outputText
  const exports: Record<string, unknown> = {}
  runInNewContext(output, { exports, require: (name: string) => { assert.equal(name, 'server-only'); return {} } })
  type Handle = Readonly<object>
  type Invocation = { advance: (previous: Handle | null, stage: string) => { status: string; handle: Handle }; belongs: (handle: unknown, stage: string, previous: Handle | null) => boolean; consume: (handle: unknown, stage: string, previous: Handle | null) => { status: string }; close: () => void }
  return exports.createInvocation as () => Invocation
}
test('C01/C14 private issuance: forged DTO/brand/cast, clones, cross invocation, wrong stage/predecessor, post-close', () => {
  const factory = privateInvocationFactory()
  const a = factory(), b = factory(), first = a.advance(null, 'admission')
  assert.equal(first.status, 'stage'); assert.ok(a.belongs(first.handle, 'admission', null)); assert.ok(Object.isFrozen(first.handle))
  const fake = [{}, { stage: 'admission' }, { brand: true }, Object.assign({}, first.handle), structuredClone(first.handle), JSON.parse(JSON.stringify(first.handle))]
  for (const handle of fake) assert.equal(a.belongs(handle, 'admission', null), false)
  assert.equal(b.belongs(first.handle, 'admission', null), false)
  assert.equal(a.belongs(first.handle, 'custody', null), false)
  assert.equal(a.belongs(first.handle, 'admission', {}), false)
  const second = a.advance(first.handle, 'custody'); assert.equal(second.status, 'stage')
  assert.equal(a.belongs(first.handle, 'admission', null), false)
  assert.equal(a.belongs(second.handle, 'custody', first.handle), true)
  assert.equal(a.consume(second.handle, 'custody', first.handle).status, 'closed')
  assert.equal(a.belongs(second.handle, 'custody', first.handle), false)
  assert.equal(a.advance(second.handle, 'selection').status, 'blocked')
  const c = factory(); assert.equal(c.advance(first.handle, 'admission').status, 'blocked'); assert.equal(c.advance(null, 'admission').status, 'blocked')
  const d = factory(); d.close(); assert.equal(d.advance(null, 'admission').status, 'blocked')
})
test('C02/C13/C29 historical bytes, correct caller IDs and pins cannot mint live authority', () => {
  const f = reviewFixture()
  const call = runOfficialTruthGlobalProduction as (...args: unknown[]) => unknown
  for (const input of [undefined, f.f.definition, f.f.admissionPin, f.review, bytes(provenanceCanonical(f.review)!), { role: 'owner', aal: 'aal2', producer: true }, { handle: {}, brand: true }]) {
    assert.deepEqual(call(input), { status: 'blocked', reason: 'custody_missing' })
  }
})

const newModules = ['official-truth-autonomous-provenance-artifact', 'official-truth-autonomous-provenance-record', 'official-truth-global-cell-admission-server',
  'official-truth-evidence-metadata-custody-server', 'official-truth-support-selection-server', 'official-truth-global-representation-qualification',
  'official-truth-autonomous-review-material-server', 'official-truth-autonomous-provenance-record-server']
const forbiddenCalls = ['evidenceKandidatAkzeptieren', 'officialTruthAkzeptierteEvidenceAusAbruf', 'regelKandidatAkzeptieren', 'akzeptierteEvidenceSpeichern', 'akzeptierteRegelClaimSpeichern',
  'quellenKatalogLesen', 'quelleRegistrieren', 'contentItemRegistrieren', 'loadOfficialTruthServerOwnedRetrieval', 'decideOfficialTruthServerOwnedRetrieval',
  'officialTruthTrustedFactExtrahieren', 'officialTruthTrustedFactExtrahierenMitDefinitionen', 'officialTruthCompositionPhaseA', 'officialTruthCompositionPhaseB']
test('zero-I/O import/call fences; no production consumer or public issuer/test factory', () => {
  for (const name of newModules) {
    const source = readFileSync(join(root, 'lib/readiness', name + '.ts'), 'utf8')
    const parsed = ts.createSourceFile(name + '.ts', source, ts.ScriptTarget.Latest, true)
    function visit(node: ts.Node) {
      if (ts.isCallExpression(node) || ts.isNewExpression(node)) {
        const called = node.expression.getText(parsed)
        assert.ok(!forbiddenCalls.some(f => called.split('.').at(-1) === f), called)
        assert.ok(!/^(fetch|XMLHttpRequest|WebSocket|eval|Function)$/.test(called), called)
      }
      if (ts.isImportDeclaration(node)) {
        const path = (node.moduleSpecifier as ts.StringLiteral).text
        assert.ok(!/(supabase|store-server|source-catalog-server|server-owned-retrieval|extractor-registry|composition-policy|node:|\.test|provider|modell)/.test(path), path)
      }
      ts.forEachChild(node, visit)
    }
    visit(parsed)
  }
  const source = readFileSync(join(root, 'lib/readiness/official-truth-autonomous-provenance-record-server.ts'), 'utf8')
  assert.deepEqual([...source.matchAll(/^export function (\w+)/gm)].map(m => m[1]), ['runOfficialTruthGlobalProduction'])
  function scan(dir: string) {
    for (const entry of readdirSync(dir, { withFileTypes: true })) {
      if (entry.name.startsWith('.')) continue
      const path = join(dir, entry.name)
      if (entry.isDirectory()) scan(path)
      else if (/\.[tj]sx?$/.test(entry.name) && !entry.name.endsWith('.test.ts') && !newModules.some(m => entry.name === m + '.ts')) {
        const text = readFileSync(path, 'utf8')
        for (const m of newModules) assert.ok(!text.includes('/' + m + "'"), `unexpected production consumer ${path}`)
      }
    }
  }
  for (const dir of ['app', 'components', 'lib']) scan(join(root, dir))
})

test('explicit zero HTTP/DB/Evidence/Rule/store/provider/model/registration/activation calls across complete pure fixtures', () => {
  const counts: Record<string, number> = Object.fromEntries(['http', 'db', 'evidence', 'rule', 'store', 'provider', 'model', 'source', 'content', 'profile', 'extractor', 'policy'].map(k => [k, 0]))
  const trap = (category: string) => () => { counts[category]++; throw Error('forbidden effect') }
  const intercepted: Record<string, string> = { evidenceKandidatAkzeptieren: 'evidence', officialTruthAkzeptierteEvidenceAusAbruf: 'evidence', regelKandidatAkzeptieren: 'rule',
    akzeptierteEvidenceSpeichern: 'store', akzeptierteRegelClaimSpeichern: 'store', quellenKatalogLesen: 'db', quelleRegistrieren: 'source', contentItemRegistrieren: 'content',
    registerProfile: 'profile', officialTruthTrustedFactExtrahieren: 'extractor', officialTruthCompositionPhaseA: 'policy', officialTruthCompositionPhaseB: 'policy' }
  const require = createRequire(import.meta.url), cache = new Map<string, Record<string, unknown>>()
  function load(file: string): Record<string, unknown> {
    if (cache.has(file)) return cache.get(file)!
    const exports: Record<string, unknown> = {}; cache.set(file, exports)
    const compiled = ts.transpileModule(readFileSync(file, 'utf8'), { compilerOptions: { module: ts.ModuleKind.CommonJS, target: ts.ScriptTarget.ES2022, esModuleInterop: true } }).outputText
    const dependency = (name: string) => {
      if (name === 'server-only') return {}
      if (/(supabase)/.test(name)) return new Proxy({}, { get: () => trap('db') })
      if (/(provider|modell|openai)/.test(name)) return new Proxy({}, { get: () => trap(name.includes('provider') ? 'provider' : 'model') })
      if (/^node:(http|https|net|tls|dns|fs)/.test(name)) return new Proxy({}, { get: () => trap('http') })
      const target = name.startsWith('@/') ? join(root, name.slice(2) + '.ts') : name.startsWith('.') ? resolve(dirname(file), name + '.ts') : null
      const loaded = target ? load(target) : require(name) as Record<string, unknown>
      return new Proxy(loaded, { get(object, key) { return typeof key === 'string' && intercepted[key] ? trap(intercepted[key]!) : Reflect.get(object, key) } })
    }
    // Same JS realm for plain-object checks; compiled modules have independent export caches.
    const execute = new Function('exports', 'require', 'fetch', compiled)
    execute(exports, dependency, trap('http'))
    return exports
  }
  const f = fixture(true)
  const selectionModule = load(join(root, 'lib/readiness/official-truth-support-selection-server.ts')) as { selectHistoricalSupports: typeof selectHistoricalSupports }
  const result = good(selectionModule.selectHistoricalSupports(f))
  const reviewModule = load(join(root, 'lib/readiness/official-truth-autonomous-review-material-server.ts')) as { constructHistoricalAutonomousReview: typeof constructHistoricalAutonomousReview }
  good(reviewModule.constructHistoricalAutonomousReview({ definition: f.definition, manifest: result.manifest, manifestPin: artifactPin('synthetic-manifest', result.manifest), constructionContract: pin('synthetic-review'), custodies: result.custodies, acceptedVersions: f.versions, registry: f.registry, proposal: null }))
  const q = load(join(root, 'lib/readiness/official-truth-global-representation-qualification.ts')) as { qualifySyntheticGlobalRepresentation: typeof qualifySyntheticGlobalRepresentation }
  good(q.qualifySyntheticGlobalRepresentation(SYNTHETIC_GLOBAL_REPRESENTATION_QUALIFICATION, observation()))
  const live = load(join(root, 'lib/readiness/official-truth-autonomous-provenance-record-server.ts')) as { runOfficialTruthGlobalProduction: typeof runOfficialTruthGlobalProduction }
  assert.equal(live.runOfficialTruthGlobalProduction().status, 'blocked')
  bad(selectionModule.selectHistoricalSupports({ ...f, entries: [] }))
  bad(reviewModule.constructHistoricalAutonomousReview({ definition: f.definition, manifest: result.manifest, manifestPin: artifactPin('synthetic-manifest', result.manifest), constructionContract: pin('synthetic-review'), custodies: result.custodies, acceptedVersions: f.versions, registry: f.registry, proposal: { secret: true } }))
  assert.deepEqual(counts, { http: 0, db: 0, evidence: 0, rule: 0, store: 0, provider: 0, model: 0, source: 0, content: 0, profile: 0, extractor: 0, policy: 0 })
})

test('C16 global evaluation-date plan is required exactly for a dated category', () => {
  const f = fixture()
  const definition = { ...f.definition, scope: goodScope({ ...f.definition.scope, validity: { mode: 'travel_date', travelDate: '2026-10-05' } }) }
  const admission = structuredClone(f.admission)
  admission.value.cell = artifactPin(definition.id, definition)
  admission.value.dimensionBasis.validity!.category = definition.scope.validity
  bad(readHistoricalArtifact('GlobalCellAdmissionV1', admission))
  const dated = { ...admission, value: { ...admission.value, evaluationDatePlan: pin('synthetic-public-date-plan') } }
  good(validateGlobalCellAdmissionValue(definition, dated, artifactPin('synthetic-admission', dated), f.scopeContract))
  bad(validateGlobalCellAdmissionValue({ ...definition, scope: { ...definition.scope, validity: { mode: 'travel_date', travelDate: '2026-10-06' } } }, dated, artifactPin('synthetic-admission', dated), f.scopeContract))
})
test('C08/C21 conflicting bytes for one custody id/version cannot be deduplicated', () => {
  const f = fixture(true), entries = structuredClone(f.entries)
  entries[1]!.pin = { ...entries[1]!.pin, id: entries[0]!.pin.id }
  bad(selectHistoricalSupports({ ...f, entries }))
})
test('C14 successful complete private stage chain closes all handles against replay', () => {
  const invocation = privateInvocationFactory()()
  let previous: Readonly<object> | null = null, predecessor: Readonly<object> | null = null
  for (const stage of ['admission', 'custody', 'selection', 'review', 'capture', 'bundle']) {
    predecessor = previous
    const next = invocation.advance(previous, stage)
    assert.equal(next.status, 'stage'); assert.ok(invocation.belongs(next.handle, stage, previous)); previous = next.handle
  }
  assert.equal(invocation.consume(previous, 'bundle', predecessor).status, 'closed')
  assert.equal(invocation.consume(previous, 'bundle', predecessor).status, 'blocked')
  const invalid = privateInvocationFactory()()
  assert.equal(invalid.consume({}, 'admission', null).status, 'blocked')
  assert.equal(invalid.advance(null, 'admission').status, 'blocked')
})
test('C22 outer DTO accessors/cycles cannot run caller code before value validation', () => {
  let reads = 0
  const input = Object.defineProperty({}, 'proposal', { enumerable: true, get() { reads++; return null } })
  bad(constructHistoricalAutonomousReview(input as never))
  bad(selectHistoricalSupports(input as never))
  bad(validateAcceptedCustodyValue(input as never))
  bad(validateHistoricalCustodyBinding(input as never))
  assert.equal(reads, 0)
  for (const malformed of [null, undefined, 0, () => null]) {
    bad(constructHistoricalAutonomousReview(malformed as never))
    bad(selectHistoricalSupports(malformed as never))
  }
})
test('C07/C20 review refuses legacy note/model metadata and arbitrary hashed extensions', () => {
  const f = reviewFixture()
  for (const update of [{ extractionNote: 'model suggestion' }, { sessionHash: hash('private-session') }, { proposalHash: hash('model') }, { lifecycle: 'candidate' }, { validationState: 'pending' }]) {
    bad(constructHistoricalAutonomousReview({ ...f.input, acceptedVersions: f.f.versions.map(v => ({ ...v, ...update })) }))
  }
  const preimage = structuredClone(f.review.value.safePreimage)
  bad(readSafeReviewPreimage({ ...preimage, candidate: { ...preimage.candidate, proposal: { kind: 'passport_validity' } } }))
  bad(readSafeReviewPreimage({ ...preimage, supports: preimage.supports.map(s => ({ ...s, sourceContentHash: hash('other') })) }))
})
test('C03/C13 absent origin or required nulls are not repaired from matching current values', () => {
  const f = fixture(), entry = f.entries[0]!
  for (const key of ['observation', 'validityOrigin', 'acceptedOrigin', 'identityContract', 'hashContract'] as const) {
    const missing: Record<string, unknown> = { ...entry.custody.value }; delete missing[key]
    bad(readHistoricalArtifact('AcceptedEvidenceCustodyV1', artifact('AcceptedEvidenceCustodyV1', missing)))
    bad(readHistoricalArtifact('AcceptedEvidenceCustodyV1', artifact('AcceptedEvidenceCustodyV1', { ...entry.custody.value, [key]: null })))
  }
  for (const key of ['validFrom', 'validUntil'] as const) {
    const identity: Record<string, unknown> = { ...entry.custody.value.evidenceIdentity }; delete identity[key]
    bad(readHistoricalArtifact('AcceptedEvidenceCustodyV1', artifact('AcceptedEvidenceCustodyV1', { ...entry.custody.value, evidenceIdentity: identity })))
  }
})


test('C27 #855 fact/candidate/proof preimages use exact domains and cannot be widened with custody', () => {
  const f = reviewFixture(), c = f.review.value.safePreimage.candidate
  const values = { factSchema: pin('synthetic-fact-schema'), applicabilitySchema: null, factKind: 'passport_validity', requirementType: 'passport_validity',
    fact: { kind: 'passport_validity', semantics: 'valid_on_entry', duration: null } }
  const fact = good(historicalFactIdentity(values, null, f.f.registry))
  assert.equal(fact.factHash, 'ot-fact-v1:' + hash('ot-fact-v1\n' + provenanceCanonical(values)))
  const candidate = { scope: c.scope, ruleScopeKey: c.key, factKind: values.factKind, requirementType: values.requirementType, schemaFamily: 'ots_synthetic',
    factSchema: values.factSchema, applicabilitySchema: null, factHash: fact.factHash, evidenceQuality: c.evidenceQuality, supportVersionIds: c.supportVersionIds }
  const bound = good(historicalCandidateIdentity(candidate, values, null, f.f.registry))
  assert.equal(bound.candidateBinding, 'ot-candidate-v1:' + hash('ot-candidate-v1\n' + provenanceCanonical(candidate)))
  const proof = { contract: pin('synthetic-proof'), reviewPacketKey: f.review.value.reviewPacketKey, ruleScopeKey: c.key, factKind: c.factKind, supportVersionIds: c.supportVersionIds,
    serverReferenceTime: '2026-10-05T10:01:00.000Z', catalogSnapshot: f.f.catalogSnapshot, freshnessContract: pin('synthetic-freshness'), evidenceFreshnessAtReference: 'current' }
  const identity = good(historicalProofIdentity(proof, f.review))
  assert.equal(identity.proofIdentity, 'ot-proof-v1:' + hash('ot-proof-v1\n' + provenanceCanonical(proof)))
  bad(historicalFactIdentity({ ...values, schema: 2 }, null, f.f.registry))
  bad(historicalFactIdentity({ ...values, applicabilitySchema: pin('schema2') }, 2 as 1, f.f.registry))
  bad(historicalCandidateIdentity({ ...candidate, factHash: 'ot-fact-v1:' + '0'.repeat(64) }, values, null, f.f.registry))
  bad(historicalCandidateIdentity({ ...candidate, supportVersionIds: [...c.supportVersionIds, ...c.supportVersionIds] }, values, null, f.f.registry))
  bad(historicalCandidateIdentity({ ...candidate, scope: { ...c.scope, destinationCountryCode: 'AU' } }, values, null, f.f.registry))
  bad(historicalProofIdentity({ ...proof, serverReferenceTime: '2026-10-05T09:00:00.000Z' }, f.review))
  bad(historicalProofIdentity({ ...proof, reviewPacketKey: 'review-packet:v3:' + '0'.repeat(64) }, f.review))
  bad(historicalProofIdentity({ ...proof, globalAdmission: f.f.admissionPin }, f.review))
})
