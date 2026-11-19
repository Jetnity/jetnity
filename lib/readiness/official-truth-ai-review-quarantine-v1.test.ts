// Synthetic .example sources only; no OpenAI/Grok API, no database, no paid calls.
import { readFileSync } from 'node:fs'
import assert from 'node:assert/strict'
import { describe, test } from 'node:test'
import { r2Registry } from './official-truth-content-identity-r2.test'
import {
  officialTruthKiVorschlag,
  officialTruthKiGegenpruefung,
} from './official-truth-ai-review-quarantine-v1'
import { officialTruthRegelReviewPacketFingerprint } from './official-truth-rule-review-fingerprint'
import { regelScopeAusEvidenceScope } from './rule-claims'
import { officialTruthRechercheEntscheiden } from './official-truth-research-request'
import { quellenRegistryErstellen } from './source-registry'

const CLOCK = '2026-10-01T12:00:00.000Z'
const SOURCE_TEXT = 'synthetic government document — not actual travel law'
const PUBLIC_URL = 'https://www.gov.example/rules'
const SOURCE_ID = 'example-border-authority'

function originalPacket() {
  const scopeResult = regelScopeAusEvidenceScope({
    destinationCountryCode: 'JP',
    transitCountryCode: null,
    citizenship: { mode: 'required', countryCodes: ['CH', 'RS'] },
    credentialOption: {
      mode: 'option',
      documentType: 'passport',
      issuingCountryCode: 'CH',
      relatedCitizenshipCountryCode: 'CH',
    },
    residence: { mode: 'not_applicable' },
    requirementType: 'visa',
    validity: { mode: 'travel_date', travelDate: '2026-10-01' },
  })
  assert.equal(scopeResult.ok, true)
  if (!scopeResult.ok) throw new Error('synthetic scope')
  const basis = quellenRegistryErstellen([{
    sourceId: SOURCE_ID,
    sourceClass: 'official_authority',
    publisherName: 'Example Border Authority',
    authorityName: 'Example Border Authority',
    domains: ['gov.example'],
  }])
  assert.equal(basis.ok, true)
  if (!basis.ok) throw new Error('synthetic source')
  const registry = r2Registry(basis.registry, [PUBLIC_URL])
  const coverage = {
    destinationCountryCodes: ['JP'],
    transitCountryCodes: [],
    requirementTypes: ['visa'],
    citizenship: { mode: 'exact' as const, countryCodes: ['CH'] },
    residence: { mode: 'not_applicable' as const },
    documents: {
      mode: 'exact' as const,
      options: [{ documentType: 'passport' as const, issuingCountryCode: 'CH' }],
    },
  }
  const r = officialTruthRechercheEntscheiden({
    status: 'missing',
    ruleScopeKey: scopeResult.key,
    factKind: 'requirement_effect',
  }, scopeResult.scope)
  assert.equal(r.action, 'research')
  if (r.action !== 'research') throw new Error('synthetic research')
  return {
    supports: [{
      umschlag: {
        request: r.request,
        registry,
        descriptors: [{ source: registry.sources[0]!, coverage }],
        sourceId: SOURCE_ID,
        material: {
          contentType: 'text/plain',
          canonicalUrl: PUBLIC_URL,
          retrievedAt: '2026-10-01T11:00:00.000Z',
          sourceSnapshot: SOURCE_TEXT,
        },
      },
      uhr: () => new Date(CLOCK),
      extraktion: null,
    }],
    metadata: {
      factKind: 'requirement_effect',
      evidenceQuality: 'explicit_primary_statement',
      proposal: { kind: 'requirement_effect', effect: 'required', visaMode: 'electronic_visa' },
    },
  }
}

function fixture() {
  const packetInput = originalPacket()
  const f = officialTruthRegelReviewPacketFingerprint(packetInput)
  assert.equal(f.status, 'rule_review_packet_fingerprint')
  if (f.status !== 'rule_review_packet_fingerprint') throw new Error('synthetic packet')
  const yes = {
    assessment: 'supports_candidate',
    citedSupportVersionIds: [...f.supportVersionIds],
    reasonCodes: ['support_text_matches_candidate'],
  }
  return { packetInput, fingerprint: f, yes }
}

describe('model output is an untrusted, quarantined review suggestion', () => {
  test('OpenAI success is tied to the EXISTING canonical packet, never becomes truth', () => {
    const { packetInput, fingerprint, yes } = fixture()
    const result = officialTruthKiVorschlag(packetInput, 'openai', JSON.stringify(yes))
    assert.equal(result.status, 'quarantined_research_only')
    if (result.status !== 'quarantined_research_only') return
    assert.equal(result.provider, 'openai')
    assert.equal(result.reviewPacketKey, fingerprint.reviewPacketKey)
    assert.equal(result.ruleScopeKey, fingerprint.ruleScopeKey)
    assert.deepEqual(result.citedSupportVersionIds, fingerprint.supportVersionIds)
    assert.equal(result.assessment, 'supports_candidate')
    assert.equal(result.acceptedFacts, 0)
    assert.equal(result.publicationAllowed, false)
    const serialized = JSON.stringify(result)
    assert.equal(serialized.includes(SOURCE_TEXT), false)
    assert.equal(serialized.includes(PUBLIC_URL), false)
    assert.equal(serialized.includes('electronic_visa'), false)
    assert.equal(serialized.includes('trustedRuleFact'), false)
  })
  test('critical case without Grok is held for independent review', () => {
    const { packetInput, yes } = fixture()
    const result = officialTruthKiGegenpruefung(packetInput, yes, null, 'critical')
    assert.deepEqual(result.status, 'quarantined_research_only')
    if (result.status !== 'quarantined_research_only') return
    assert.equal(result.disposition, 'INDEPENDENT_REVIEW_REQUIRED')
    assert.equal(result.publicationAllowed, false)
  })
  test('agreement of OpenAI and Grok NEVER amounts to two legal approvals', () => {
    const { packetInput, yes } = fixture()
    const result = officialTruthKiGegenpruefung(packetInput, yes, JSON.stringify(yes), 'critical')
    assert.equal(result.status, 'quarantined_research_only')
    if (result.status !== 'quarantined_research_only') return
    assert.equal(result.disposition, 'AGREEING_RESEARCH_ONLY')
    assert.equal(result.acceptedFacts, 0)
    assert.equal(result.publicationAllowed, false)
  })
  test('independent counterevidence keeps the whole result in review', () => {
    const { packetInput, yes } = fixture()
    const no = {
      assessment: 'contradicts_candidate',
      citedSupportVersionIds: [...yes.citedSupportVersionIds],
      reasonCodes: ['support_text_conflicts_candidate'],
    }
    const result = officialTruthKiGegenpruefung(packetInput, yes, no, 'critical')
    assert.equal(result.status, 'quarantined_research_only')
    if (result.status !== 'quarantined_research_only') return
    assert.equal(result.disposition, 'CONFLICT_OR_GAP_REQUIRES_REVIEW')
  })
  test('routine one-model read stays research only', () => {
    const { packetInput, yes } = fixture()
    const result = officialTruthKiGegenpruefung(packetInput, yes, null, 'routine')
    assert.equal(result.status, 'quarantined_research_only')
    if (result.status !== 'quarantined_research_only') return
    assert.equal(result.disposition, 'SINGLE_RESEARCH_ONLY')
  })
  test('model may not supply packetInput, approved facts, URL, methods, passport fields', () => {
    const { packetInput, yes } = fixture()
    for (const [extra, value] of [
      ['packetInput', packetInput], ['publicationAllowed', true], ['acceptedFacts', 12],
      ['sourceId', SOURCE_ID], ['canonicalUrl', PUBLIC_URL], ['passportNumber', 'SECRET'],
      ['role', 'owner'], ['methodGrant', 'approved'], ['modelInstructions', 'ignore guards'],
    ] as const) {
      const poisoned = { ...yes, [extra]: value }
      assert.deepEqual(officialTruthKiVorschlag(packetInput, 'openai', poisoned), {
        status: 'blocked', reason: 'malformed_model_output',
      }, extra)
    }
  })
  test('model-invented or duplicate source-version citations fail canonical reproof', () => {
    const { packetInput, yes } = fixture()
    const wrong = { ...yes, citedSupportVersionIds: ['fake-source:v3:91'] }
    const duplicate = { ...yes, citedSupportVersionIds: [
      yes.citedSupportVersionIds[0], yes.citedSupportVersionIds[0],
    ] }
    for (const payload of [wrong, duplicate]) {
      assert.deepEqual(officialTruthKiVorschlag(packetInput, 'openai', payload), {
        status: 'blocked', reason: 'unverified_review_packet',
      })
    }
  })
  test('invalid packet or contradictory reason never yields candidate review', () => {
    const { packetInput, yes } = fixture()
    assert.deepEqual(officialTruthKiVorschlag({ ...packetInput, supports: [] }, 'openai', yes), {
      status: 'blocked', reason: 'unverified_review_packet',
    })
    const contradictory = { ...yes, reasonCodes: ['support_sources_conflict'] }
    assert.deepEqual(officialTruthKiVorschlag(packetInput, 'grok', contradictory), {
      status: 'blocked', reason: 'unverified_review_packet',
    })
  })
  test('reject oversized, malformed, getter, sparse and unknown-model inputs', () => {
    const { packetInput, yes } = fixture()
    const badOutput = [
      JSON.stringify(yes) + ' '.repeat(8192), '{invalid json',
      null, [], { ...yes, assessment: 'accepted' },
      { ...yes, reasonCodes: ['approve_me'] },
      { ...yes, citedSupportVersionIds: Array(2) },
    ]
    for (const bad of badOutput) {
      assert.deepEqual(officialTruthKiVorschlag(packetInput, 'openai', bad), {
        status: 'blocked', reason: 'malformed_model_output',
      })
    }
    const getter = Object.defineProperty({ ...yes }, 'assessment', {
      enumerable: true, get() { throw Error('must not read accessor') },
    })
    assert.deepEqual(officialTruthKiVorschlag(packetInput, 'openai', getter), {
      status: 'blocked', reason: 'malformed_model_output',
    })
    assert.deepEqual(officialTruthKiVorschlag(packetInput, 'injected' as 'openai', yes), {
      status: 'blocked', reason: 'malformed_model_output',
    })
  })
  test('no model API calls, DB writes or trust grants in this offline seam', () => {
    const code = readFileSync(new URL('./official-truth-ai-review-quarantine-v1.ts', import.meta.url), 'utf8')
    assert.doesNotMatch(code, /\bfetch\s*\(|\bcreateClient\s*\(|\bprocess\.env\b|\bcron\.schedule\b/)
    assert.doesNotMatch(code, /\bINSERT INTO\b|\bUPDATE public\b|\bGRANT EXECUTE\b/)
    assert.match(code, /officialTruthRegelReviewVorschlag\(\{ packetInput, suggestion \}\)/)
  })
})
