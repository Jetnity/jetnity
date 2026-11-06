// Synthetic bytes only. No government request, hosted authority or admission.
import assert from 'node:assert/strict'
import { createHash } from 'node:crypto'
import { readdirSync, readFileSync } from 'node:fs'
import { join, relative } from 'node:path'
import { test } from 'node:test'
import ts from 'typescript'
import { fixtureTrip, loadFixtureModule, protocol2Fixture } from '../../../scripts/official-truth-ch-de-application-pilot-1/fixtures'
import { AA_VISA_TABLE_IDENTITY_CANDIDATE } from '../official-truth-aa-visa-table-identity-candidate'
import { OFFICIAL_TRUTH_CONTENT_IDENTITY_PROFILE_REGISTRY } from '../official-truth-content-identity'
import { applicationContract, applicationPilotEnabled } from '../official-truth-ch-de-application-pilot-1/contract-server'
import { pilotGraphFingerprint } from '../official-truth-ch-de-application-pilot-1/context'
import type * as Evaluation from '../official-truth-ch-de-application-pilot-1/evaluate-server'
import type * as Extractors from '../official-truth-trusted-fact-extractor-registry'
import type * as Review from '../official-truth-rule-review-packet'
import type * as Rules from '../rule-claims'
import { OFFICIAL_TRUTH_TRUSTED_FACT_EXTRACTOR_REGISTRY, type OfficialTruthExtractorKontext } from '../official-truth-trusted-fact-extractor-registry'
import { regelScopeAusEvidenceScope } from '../rule-claims'
import { officialTruthSourceFingerprintProtocol, officialTruthSourceFingerprintV2 } from '../official-truth-source-fingerprint-v2'
import { chDeAaS1VisaRowResearchFromHtml } from '../official-truth-ch-de-aa-s1-visa-row-research-server'
import type { Trip } from '../../../types/trips'
import * as realMapping from './mapping'
import { AA_CH_DE_VISA_REVIEWED_SOURCE_CANDIDATE as reviewed } from './reviewed-source'

const directory = 'lib/readiness/official-truth-ch-de-aa-visa-mapping-candidate-1'
const fixture = protocol2Fixture(Object.freeze({ ...AA_VISA_TABLE_IDENTITY_CANDIDATE, current: true }))
const footnote = '<p id="synthetic-footnote">1) Unrelated national-pass note.</p>'
const body = fixture.body.replace('</table>', `</table>${footnote}`).replace('x'.repeat(Buffer.byteLength(footnote)), '')
const swissRow = '<tr><td>Schweiz</td><td>Nein</td></tr>'
type Mapping = typeof realMapping
type Context = OfficialTruthExtractorKontext
type Manifest = typeof reviewed
const fingerprintBinding = { ...reviewed.binding, canonicalUrl: reviewed.canonicalUrl, contentType: reviewed.contentType }
function hash(text: string): string {
  const value = officialTruthSourceFingerprintV2(text, fingerprintBinding)
  assert(value)
  return value
}
function loadCandidate(manifest: Manifest): Mapping {
  return loadFixtureModule<Mapping>(`${directory}/mapping.ts`, {
    './reviewed-source': { AA_CH_DE_VISA_REVIEWED_SOURCE_CANDIDATE: manifest },
  })
}
function withPin(text: string): Mapping {
  return loadCandidate(Object.freeze({ ...reviewed, sourceContentHash: hash(text) }) as Manifest)
}
const synthetic = withPin(body)
function context(text = body, scopeDelta: Partial<Context['scope']> = {}): Context {
  const scope: Context['scope'] = {
    destinationCountryCode: 'DE', transitCountryCode: null, requirementType: 'visa',
    citizenship: { mode: 'required', countryCodes: ['CH'] },
    credentialOption: { mode: 'option', documentType: 'passport', issuingCountryCode: 'CH', relatedCitizenshipCountryCode: 'CH' },
    residence: { mode: 'not_applicable' }, validity: { mode: 'travel_date', travelDate: '2026-11-07' }, ...scopeDelta,
  }
  const parsed = regelScopeAusEvidenceScope(scope)
  return {
    factKind: 'requirement_effect', requirementType: 'visa', scope, scopeKey: parsed.ok ? parsed.key : 'invalid',
    evidenceQuality: 'explicit_primary_statement', schemaFamily: reviewed.schemaFamily, policy: null, registry: fixture.registry,
    supports: [{ ...reviewed.binding, versionId: `ev2_${'a'.repeat(32)}`, canonicalUrl: reviewed.canonicalUrl,
      retrievedAt: new Date().toISOString(), contentType: reviewed.contentType, sourceFingerprintProtocol: 2,
      sourceSnapshot: text, sourceContentHash: officialTruthSourceFingerprintV2(text, fingerprintBinding) ?? '0'.repeat(64) }],
  }
}
function refused(candidate: Mapping, input: Context): void {
  // Direct extract is deliberately called before match: no prior-match trust.
  const extracted = candidate.AA_CH_DE_VISA_EXTRACTOR_CANDIDATE.extract(input)
  const matched = candidate.AA_CH_DE_VISA_EXTRACTOR_CANDIDATE.match(input)
  assert.deepEqual(extracted, matched)
  assert.equal((extracted as { ok: boolean }).ok, false)
  assert(!Object.hasOwn(extracted as object, 'fact'))
}

test('candidate has the exact immutable manifest, coverage and closed production selectors', () => {
  assert.equal(reviewed.sourceContentHash, 'fc34bb51f8493a8776b6a300c8aed493a4a4fe08fba269148292ed7d9a334979')
  assert.deepEqual(reviewed.travelDates, { from: '2026-11-07', through: '2026-11-13' })
  const contract = realMapping.AA_CH_DE_VISA_APPLICATION_CONTRACT_CANDIDATE
  const extractor = realMapping.AA_CH_DE_VISA_EXTRACTOR_CANDIDATE
  assert.deepEqual(contract.source.coverage, { destinationCountryCodes: ['DE'], transitCountryCodes: [], requirementTypes: ['visa'],
    citizenship: { mode: 'exact', countryCodes: ['CH'] }, residence: { mode: 'not_applicable' },
    documents: { mode: 'exact', options: [{ documentType: 'passport', issuingCountryCode: 'CH' }] } })
  function frozen(value: unknown): void {
    if (!value || typeof value !== 'object') return
    assert(Object.isFrozen(value))
    Object.values(value).forEach(frozen)
  }
  frozen(reviewed); frozen(contract); frozen(extractor)
  assert.equal(extractor.current, false)
  assert.throws(() => Object.assign(extractor, { current: true }), TypeError)
  assert.equal(applicationContract(contract.id, contract.digest), null)
  assert.equal(applicationPilotEnabled(), false)
  assert(!OFFICIAL_TRUTH_TRUSTED_FACT_EXTRACTOR_REGISTRY.some(d => d.extractorId === extractor.extractorId))
  assert(!OFFICIAL_TRUTH_CONTENT_IDENTITY_PROFILE_REGISTRY.some(p => p.identityProfileId === reviewed.binding.identityProfileId))
  assert.equal(AA_VISA_TABLE_IDENTITY_CANDIDATE.current, false)
  refused(realMapping, context())
  assert.equal(contract.validity(body), null)
})

for (const travelDate of ['2026-11-07', '2026-11-13']) test(`synthetic exact context recognizes inclusive window boundary ${travelDate}`, () => {
  assert.equal(Buffer.byteLength(body, 'utf8'), 93_365)
  assert.equal(officialTruthSourceFingerprintProtocol(body), 2)
  const input = context(body, { validity: { mode: 'travel_date', travelDate } })
  assert.deepEqual(synthetic.AA_CH_DE_VISA_EXTRACTOR_CANDIDATE.extract(input), { ok: true, fact: reviewed.fact })
  assert.deepEqual(synthetic.AA_CH_DE_VISA_EXTRACTOR_CANDIDATE.match(input), { ok: true })
  assert.deepEqual(synthetic.AA_CH_DE_VISA_APPLICATION_CONTRACT_CANDIDATE.validity(body), { validFrom: null, validUntil: null })
})

const contextChanges: [string, Partial<Context>][] = [
  ['wrong fact', { factKind: 'stay_limit' }], ['wrong requirement', { requirementType: 'passport_validity' }],
  ['wrong schema', { schemaFamily: 'ots_other' }], ['wrong key', { scopeKey: 'rule-scope:v1:' + '0'.repeat(64) }],
  ['composed quality', { evidenceQuality: 'composed_from_multiple_primary_sources' }],
  ['policy', { policy: { policyId: 'other', policyVersion: 1, assignments: [] } }],
  ['missing support', { supports: [] }], ['multiple supports', { supports: [context().supports[0]!, context().supports[0]!] }],
]
for (const [name, delta] of contextChanges) test(`direct callbacks refuse ${name}`, () => refused(synthetic, { ...context(), ...delta }))

const scopeChanges: [string, Partial<Context['scope']>][] = [
  ['destination', { destinationCountryCode: 'AT' }], ['transit', { transitCountryCode: 'FR' }],
  ['scope requirement', { requirementType: 'passport_validity' }],
  ['other citizenship', { citizenship: { mode: 'required', countryCodes: ['FR'] } }],
  ['multiple citizenships', { citizenship: { mode: 'required', countryCodes: ['CH', 'FR'] } }],
  ['unneeded citizenship', { citizenship: { mode: 'not_applicable' } }],
  ['empty citizenship', { citizenship: { mode: 'required', countryCodes: [] } }],
  ['residence', { residence: { mode: 'required', countryCode: 'CH' } }],
  ['missing document', { credentialOption: { mode: 'not_applicable' } }],
  ['other document', { credentialOption: { mode: 'option', documentType: 'national_id', issuingCountryCode: 'CH', relatedCitizenshipCountryCode: 'CH' } }],
  ['other issuer', { credentialOption: { mode: 'option', documentType: 'passport', issuingCountryCode: 'FR', relatedCitizenshipCountryCode: 'CH' } }],
  ['unlinked document', { credentialOption: { mode: 'option', documentType: 'passport', issuingCountryCode: 'CH', relatedCitizenshipCountryCode: null } }],
  ['other linked citizenship', { credentialOption: { mode: 'option', documentType: 'passport', issuingCountryCode: 'CH', relatedCitizenshipCountryCode: 'FR' } }],
  ...['2026-11-06', '2026-11-14', '2026-02-30', '2026-11-07T00:00:00Z', ''].map(travelDate =>
    [`travel date ${travelDate}`, { validity: { mode: 'travel_date', travelDate } }] as [string, Partial<Context['scope']>]),
  ['no travel date', { validity: { mode: 'not_applicable' } }],
]
for (const [name, delta] of scopeChanges) test(`direct callbacks refuse ${name}`, () => refused(synthetic, context(body, delta)))
test('direct callbacks refuse structurally missing date and scope', () => {
  refused(synthetic, context(body, { validity: { mode: 'travel_date' } as Context['scope']['validity'] }))
  refused(synthetic, { ...context(), scope: null } as unknown as Context)
})

const supportChanges: [string, Record<string, unknown>][] = [
  ...['sourceId', 'contentItemId', 'representationId', 'identityProfileId'].map(field => [field, { [field]: 'other' }] as [string, Record<string, unknown>]),
  ...['contentItemVersion', 'representationVersion', 'identityProfileVersion'].map(field => [field, { [field]: 2 }] as [string, Record<string, unknown>]),
  ['URL alias', { canonicalUrl: reviewed.canonicalUrl + '/' }], ['URL query', { canonicalUrl: reviewed.canonicalUrl + '?other=1' }],
  ['MIME', { contentType: 'text/html; charset=utf-8' }], ['other MIME', { contentType: 'application/json' }],
  ...[undefined, 1, '2', 3].map(protocol => [`protocol ${String(protocol)}`, { sourceFingerprintProtocol: protocol }] as [string, Record<string, unknown>]),
  ['wrong hash', { sourceContentHash: '0'.repeat(64) }],
]
for (const [name, delta] of supportChanges) test(`direct callbacks refuse changed support ${name}`, () => {
  const input = context()
  refused(synthetic, { ...input, supports: [{ ...input.supports[0]!, ...delta }] } as Context)
})

const bodyChanges: [string, string][] = [
  ['global restriction outside Swiss row', body.replace('</main>', '<p>All visa exemptions require additional authorization.</p></main>')],
  ['new hidden table ancestor', body.replace('<table>', '<div hidden><table>').replace('</table>', '</table></div>')],
  ['changed unrelated footnote', body.replace('Unrelated national-pass note.', 'A new qualification for national passes.')],
  ['truncation after intact Swiss row', body.slice(0, body.indexOf('</tbody>') + 8)],
  ['truncation still above protocol-2 threshold', body.slice(0, -30)],
  ['over limit', body + 'x'.repeat(131_073 - Buffer.byteLength(body))],
  ['invalid high surrogate', body + '\ud800'], ['invalid low surrogate', body + '\udc00'], ['BOM', '\ufeff' + body],
]
for (const [name, text] of bodyChanges) test(`complete pin refuses ${name}`, () => {
  const input = context(text)
  // Recomputed support hash cannot rewrite the original immutable expected pin.
  refused(synthetic, input)
  // A stale hash is also insufficient when the underlying full body changed.
  refused(synthetic, { ...input, supports: [{ ...input.supports[0]!, sourceContentHash: hash(body) }] })
  assert.equal(synthetic.AA_CH_DE_VISA_APPLICATION_CONTRACT_CANDIDATE.validity(text), null)
})
test('global context protections are from the full pin, not a claim that S1 interprets them', () => {
  for (const [, text] of bodyChanges.slice(0, 3)) {
    assert.equal(chDeAaS1VisaRowResearchFromHtml(text).status, 'research_visa_table_observation')
    assert.notEqual(hash(text), hash(body))
  }
})

const semanticChanges: [string, string][] = [
  ['Swiss Ja', body.replace(swissRow, '<tr><td>Schweiz</td><td>Ja</td></tr>')],
  ['Swiss attached qualifier', body.replace(swissRow, '<tr><td>Schweiz</td><td>Nein, nur mit Genehmigung</td></tr>')],
  ['Swiss footnote marker', body.replace(swissRow, '<tr><td>Schweiz</td><td>Nein<sup>1</sup></td></tr>')],
  ['duplicate Swiss', body.replace(swissRow, swissRow + swissRow)],
  ['conflicting Swiss', body.replace(swissRow, swissRow + '<tr><td>Schweiz</td><td>Ja</td></tr>')],
  ['hidden Swiss', body.replace(swissRow, '<tr hidden><td>Schweiz</td><td>Nein</td></tr>')],
  ['missing table', body.replace('Visumpflicht für Deutschland: Ja/Nein', 'Unrecognized header')],
  ['ambiguous table', body.replace('</thead>', '<tr><th>Staaten und Gebietskörperschaften</th><th>Visumpflicht für Deutschland: Ja/Nein</th></tr></thead>')],
]
for (const [name, text] of semanticChanges) test(`S1 independently refuses matching synthetic pin with ${name}`, () => {
  assert.equal(chDeAaS1VisaRowResearchFromHtml(text).status, 'blocked')
  const candidate = withPin(text)
  refused(candidate, context(text))
  assert.equal(candidate.AA_CH_DE_VISA_APPLICATION_CONTRACT_CANDIDATE.validity(text), null)
  refused(synthetic, context(text))
})
test('small hashable HTML is protocol 1 and cannot masquerade as protocol 2 even with matching pin', () => {
  const small = body.replace(/x{1000,}/, '')
  assert.equal(officialTruthSourceFingerprintProtocol(small), 1)
  const candidate = withPin(small)
  refused(candidate, context(small))
  assert.equal(candidate.AA_CH_DE_VISA_APPLICATION_CONTRACT_CANDIDATE.validity(small), null)
})
test('existing V2 normalization permits exactly LF/CRLF/CR equivalence, not whitespace or DOM equivalence', () => {
  const lf = body.replace('<table>', '<table>\n'), candidate = withPin(lf)
  for (const text of [lf, lf.replace('\n', '\r\n'), lf.replace('\n', '\r')]) {
    assert.equal(hash(text), hash(lf))
    assert.deepEqual(candidate.AA_CH_DE_VISA_EXTRACTOR_CANDIDATE.extract(context(text)), { ok: true, fact: reviewed.fact })
    assert.deepEqual(candidate.AA_CH_DE_VISA_APPLICATION_CONTRACT_CANDIDATE.validity(text), { validFrom: null, validUntil: null })
  }
  assert.notDeepEqual(Buffer.from(lf), Buffer.from(lf.replace('\n', '\r\n')))
  for (const text of [lf.replace('\n', ' '), lf.replace('<td>Schweiz', '<td class="same">Schweiz')]) {
    refused(candidate, context(text)); assert.equal(candidate.AA_CH_DE_VISA_APPLICATION_CONTRACT_CANDIDATE.validity(text), null)
  }
})

// Independent Node SHA-256 over the documented ordered projection, with no
// call to the production digest helper or mapping's private digest expression.
function independentDigest(manifest: Manifest): string {
  const b = manifest.binding, c = manifest.coverage
  const projection = [manifest.mappingVersion, manifest.contractId, manifest.applicationScope,
    [manifest.travelDates.from, manifest.travelDates.through],
    [b.sourceId, b.contentItemId, b.contentItemVersion, b.representationId, b.representationVersion, b.identityProfileId, b.identityProfileVersion],
    [manifest.requestUrl, manifest.canonicalUrl, manifest.finalUrl, manifest.contentType, manifest.locale, manifest.schema,
      manifest.sourceFingerprintProtocol, manifest.sourceContentHash],
    [c.destinationCountryCodes, c.transitCountryCodes, c.requirementTypes, [c.citizenship.mode, c.citizenship.countryCodes],
      [c.residence.mode], [c.documents.mode, c.documents.options.map(option => [option.documentType, option.issuingCountryCode])]],
    [manifest.extractorId, manifest.extractorVersion, manifest.sourceFamilyId, manifest.schemaFamily,
      manifest.policyId, manifest.policyVersion, manifest.requiredFieldPaths],
    [manifest.fact.kind, manifest.fact.effect, manifest.fact.visaMode], manifest.recognition, manifest.validitySemantics]
  return createHash('sha256').update('jetnity:official-truth:aa-ch-de-visa-mapping-candidate:v1\0').update(JSON.stringify(projection)).digest('hex')
}
test('independent frozen-manifest digest reproduction and changed pin/window/meaning cannot select the old grant', () => {
  const original = realMapping.AA_CH_DE_VISA_APPLICATION_CONTRACT_CANDIDATE
  assert.equal(original.digest, independentDigest(reviewed))
  for (const delta of [
    { sourceContentHash: '0'.repeat(64) }, { travelDates: { from: '2026-11-08', through: '2026-11-14' } },
    { recognition: 'changed-semantics-v2' }, { validitySemantics: 'changed-validity-v2' },
    { fact: { kind: 'requirement_effect', effect: 'required', visaMode: 'visa_before_travel' } },
  ]) {
    const manifest = Object.freeze({ ...reviewed, ...delta }) as Manifest
    const changed = loadCandidate(manifest).AA_CH_DE_VISA_APPLICATION_CONTRACT_CANDIDATE
    assert.equal(changed.digest, independentDigest(manifest)); assert.notEqual(changed.digest, original.digest)
  }
})

function applicationRun(options: { candidate?: Mapping; snapshot?: string; current?: boolean; retrievalDelta?: Record<string, unknown>;
  changeTrip?: (trip: Trip) => void; grantDigest?: string } = {}) {
  const candidate = options.candidate ?? synthetic, snapshot = options.snapshot ?? body
  const contract = candidate.AA_CH_DE_VISA_APPLICATION_CONTRACT_CANDIDATE
  const definition = Object.freeze({ ...candidate.AA_CH_DE_VISA_EXTRACTOR_CANDIDATE, current: options.current ?? true })
  const extractors = fixture.modules['@/lib/readiness/official-truth-trusted-fact-extractor-registry'] as typeof Extractors
  const reviews = fixture.modules['@/lib/readiness/official-truth-rule-review-packet'] as typeof Review
  const rules = fixture.modules['@/lib/readiness/rule-claims'] as typeof Rules
  const trip = fixtureTrip()
  trip.startDate = '2026-11-07'; trip.endDate = '2026-11-13'
  options.changeTrip?.(trip)
  Object.assign(trip.regulatoryContext!, { startDate: trip.startDate, endDate: trip.endDate, graphFingerprint: pilotGraphFingerprint(trip) })
  const trace = { retrievals: 0, packets: 0, extracted: 0, witnesses: 0, acceptedRules: 0, evidenceProtocol: 0 }
  const grant = { id: '77777777-7777-4777-8777-777777777777', contractId: contract.id,
    contractDigest: options.grantDigest ?? contract.digest, expiresAt: new Date(Date.now() + 120_000).toISOString() }
  const evaluator = loadFixtureModule<typeof Evaluation>('lib/readiness/official-truth-ch-de-application-pilot-1/evaluate-server.ts', {
    ...fixture.modules,
    './contract-server': { applicationPilotEnabled: () => true,
      applicationContract: (id: string, digest: string) => id === contract.id && digest === contract.digest ? contract : null },
    './database-server': { pilotGrant: async () => grant },
    '@/lib/readiness/official-truth-fact-entry-authority-server': { loadOfficialTruthFactEntryAuthority: async () =>
      ({ status: 'authorized', grant: 'role', capability: 'official-truth-freigeben' }) },
    '@/lib/readiness/official-truth-source-catalog-server': { quellenKatalogLesen: async () => ({ ok: true, registry: fixture.registry }) },
    '@/lib/readiness/official-truth-server-owned-retrieval': { loadOfficialTruthServerOwnedRetrieval: async () => {
      trace.retrievals++; return { ...fixture.retrieval(snapshot), ...options.retrievalDelta }
    } },
    '@/lib/readiness/official-truth-rule-review-packet': { ...reviews,
      officialTruthRegelReviewBelege: (input: Parameters<typeof reviews.officialTruthRegelReviewBelege>[0]) => {
        const result = reviews.officialTruthRegelReviewBelege(input)
        if (result.status === 'rule_review_packet') {
          trace.packets++; trace.evidenceProtocol = result.evidenceVersions[0]!.sourceFingerprintProtocol ?? 1
        }
        return result
      } },
    '@/lib/readiness/official-truth-trusted-fact-extractor-registry': {
      officialTruthTrustedFactExtrahieren: (input: unknown) => {
        const result = extractors.officialTruthTrustedFactExtrahierenMitDefinitionen(input, [definition])
        if (result.status === 'trusted_fact_extracted') trace.extracted++
        return result
      },
      consumeOfficialTruthTrustedFactExecutionContext: (...args: Parameters<typeof extractors.consumeOfficialTruthTrustedFactExecutionContext>) => {
        const result = extractors.consumeOfficialTruthTrustedFactExecutionContext(...args)
        if (result) trace.witnesses++
        return result
      },
    },
    '@/lib/readiness/rule-claims': { ...rules, regelKandidatAkzeptieren: (input: Parameters<typeof rules.regelKandidatAkzeptieren>[0]) => {
      const result = rules.regelKandidatAkzeptieren(input); if (result.ok) trace.acceptedRules++; return result
    } },
    '@/lib/trips/daten': { reiseLaden: async () => ({ problem: null, zeilen: [trip] }) },
  })
  return { trip, trace, evaluate: () => evaluator.evaluateApplicationPilot(trip, new AbortController().signal) }
}
test('93,365 synthetic bytes execute actual candidate → Evidence → Review → extractor/witness → Rule → Requirements', async () => {
  const run = applicationRun(), result = await run.evaluate()
  assert.equal(Buffer.byteLength(body), 93_365)
  assert.equal(result.status, 'verified')
  assert.deepEqual(run.trace, { retrievals: 1, packets: 1, extracted: 1, witnesses: 1, acceptedRules: 1, evidenceProtocol: 2 })
  assert.equal(result.evaluations.filter(e => e.result !== 'unknown').length, 1)
  const visa = result.evaluations.find(e => e.requirementType === 'visa')!
  assert.equal(visa.result, 'not_required'); assert.equal(visa.visaMode, 'visa_exempt')
  assert(result.evaluations.filter(e => e.requirementType !== 'visa').every(e => e.result === 'unknown'))
  assert.match(visa.evidence.authority!, /SYNTHETISCHE/)
  assert(!JSON.stringify(result).includes('SYNTHETIC PROTOCOL 2 TEST ONLY'))
})
for (const [name, options] of [
  ['real immutable pin', { candidate: realMapping }], ['noncurrent candidate', { current: false }],
  ['old grant digest', { grantDigest: realMapping.AA_CH_DE_VISA_APPLICATION_CONTRACT_CANDIDATE.digest }],
  ['changed global qualification', { snapshot: bodyChanges[0]![1] }],
  ['matching-pin Swiss qualifier', { snapshot: semanticChanges[1]![1], candidate: withPin(semanticChanges[1]![1]) }],
  ['request URL drift', { retrievalDelta: { requestUrl: reviewed.requestUrl + '?other=1' } }],
  ['final URL drift', { retrievalDelta: { canonicalUrl: reviewed.finalUrl + '/' } }],
  ['redirect', { retrievalDelta: { redirectCount: 1 } }],
  ['nonordinary passport', { changeTrip: (trip: Trip) => { trip.regulatoryContext!.declaration.passportClass = 'other' } }],
  ['other purpose', { changeTrip: (trip: Trip) => { trip.regulatoryContext!.declaration.purpose = 'other' } }],
  ['window starts too early', { changeTrip: (trip: Trip) => { trip.startDate = '2026-11-06' } }],
  ['window ends too late', { changeTrip: (trip: Trip) => { trip.endDate = '2026-11-14' } }],
  ['missing trip date', { changeTrip: (trip: Trip) => { trip.startDate = null } }],
  ['invalid trip date', { changeTrip: (trip: Trip) => { trip.startDate = '2026-02-30' } }],
  ['unrelated selected document', { changeTrip: (trip: Trip) => { trip.party![0]!.documents[0]!.issuingCountryCode = 'FR' } }],
  ['multiple citizenships', { changeTrip: (trip: Trip) => {
    trip.party![0]!.citizenships.push({ ...trip.party![0]!.citizenships[0]!, id: '88888888-8888-4888-8888-888888888888', clientRef: 'other-citizenship', countryCode: 'FR' })
  } }],
] as [string, Parameters<typeof applicationRun>[0]][]) test(`canonical application has no positive fallback for ${name}`, async () => {
  const run = applicationRun(options), result = await run.evaluate()
  assert.notEqual(result.status, 'verified')
  assert(result.evaluations.every(e => e.result === 'unknown'))
  assert.equal(run.trace.acceptedRules, 0)
})

test('full repository candidate import isolation (requires complete checkout)', () => {
  const root = process.cwd(), stem = 'official-truth-ch-de-aa-visa-mapping-candidate-1'
  const directories = new Set(readdirSync(root, { withFileTypes: true }).filter(e => e.isDirectory()).map(e => e.name))
  for (const required of ['app', 'apps', 'components', 'lib', 'scripts', 'tests', 'types']) {
    assert(directories.has(required), `full repository source required: ${required}`)
  }
  const own = new Set([`${directory}/mapping.ts`, `${directory}/reviewed-source.ts`])
  function visit(path: string): void {
    for (const entry of readdirSync(path, { withFileTypes: true })) {
      if (entry.isDirectory() && ['node_modules', '.git', '.next', '.vercel', 'dist', 'out'].includes(entry.name)) continue
      const file = join(path, entry.name), name = relative(root, file)
      if (entry.isDirectory()) { visit(file); continue }
      if (!/\.[cm]?[jt]sx?$/.test(entry.name) || /\.(?:test|spec)\.[cm]?[jt]sx?$/.test(entry.name)) continue
      const source = readFileSync(file, 'utf8'), parsed = ts.createSourceFile(name, source, ts.ScriptTarget.Latest, true)
      if (own.has(name)) {
        assert(source.startsWith("import 'server-only'"))
        assert.doesNotMatch(source, /official-truth-content-identity|official-truth-aa-visa-table-identity-candidate|\bfetch\s*\(|execute_sql|createClient/)
      } else {
        function check(node: ts.Node): void {
          if (ts.isStringLiteralLike(node) && node.text.includes(stem)) assert.fail(`candidate referenced by production source: ${name}`)
          ts.forEachChild(node, check)
        }
        check(parsed)
      }
    }
  }
  visit(root)
})
