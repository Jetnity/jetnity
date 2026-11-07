import assert from 'node:assert/strict'
import { readFileSync } from 'node:fs'
import { join } from 'node:path'
import { describe, test } from 'node:test'
import {
  grokForschungsReviewQueueVorbereiten,
  grokForschungsReviewQueueVorbereitenV2,
} from './official-truth-grok-review-queue-v1-server'
import { requirementsProviderAus } from './provider'

type CountryCode = 'DE' | 'TH' | 'IT' | 'FR' | 'ES' | 'JP' | 'US'
const ALL: readonly CountryCode[] = ['DE', 'TH', 'IT', 'FR', 'ES', 'JP', 'US']
const raw = (input: unknown) => grokForschungsReviewQueueVorbereitenV2(input)

function pair(countryCode: CountryCode, blockedByBot = false) {
  const packageId = 'OT-CH-' + countryCode + '-CAND-20261105-001'
  const source = 'SRC-' + countryCode + '-OFFICIAL'
  const original = countryCode === 'DE' || countryCode === 'TH'
  return {
    countryCode,
    candidatePackage: {
      schema_version: 1,
      package_id: packageId,
      generated_at_utc: '2026-11-05T14:00:00Z',
      authority_boundary: {
        mode: 'RESEARCH_ONLY',
        not_accepted_official_truth: true,
        not_approved_for_database_import: true,
        no_supabase_writes: true,
        stage1_readback_917_untouched: true,
      },
      traveller_scope: {
        citizenship: 'CH',
        destination: countryCode,
        document: countryCode === 'TH' ? 'ordinary Swiss passport' : 'ordinary Swiss passport (product scope)',
      },
      ...(original ? {} : { hard_limits_respected: true }),
      sources: {
        [source]: { source_class: 'official_authority', canonical_url: 'https://research.example/ch-' + countryCode.toLowerCase() },
      },
      candidates: [{
        candidate_id: 'CAND-VISA-001',
        requirement_type: 'visa',
        fact_kind: 'requirement_effect',
        proposed_fact: { effect: 'not_required', visa_mode: 'visa_exempt' },
        scope: {
          destination_country_code: countryCode,
          citizenship_mode: 'required',
          citizenship_country_codes: ['CH'],
          credential_option_mode: 'option',
          document_type: 'passport',
          issuing_country_code: 'CH',
          related_citizenship_country_code: 'CH',
          passport_class_product_scope: 'ordinary',
        },
        schema_mapping: {},
        claims: [{ source_ref: source, statement: 'UNTRUSTED_RESEARCH_NEVER_PUBLISH' }],
      }],
    },
    verification: {
      schema_version: 1,
      verification_id: 'OT-CH-' + countryCode + '-VERIFY-20261105-001',
      package_id: packageId,
      generated_at_utc: '2026-11-05T14:02:00Z',
      method: 'independent_second_pass_same_executor_re_fetch',
      authority_boundary_preserved: true,
      external_writes: [],
      per_candidate: {
        'CAND-VISA-001': {
          verdict: blockedByBot ? 'blocked_with_exact_reason' : 'candidate_ready_for_TL_qualification',
        },
      },
      counts: {
        candidate_ready_for_TL_qualification: blockedByBot ? 0 : 1,
        blocked_with_exact_reason: blockedByBot ? 1 : 0,
      },
    },
  }
}

describe('Grok Bridge V2: seven-country, raw-research-only review queue', () => {
  test('original DE and TH shapes are quarantined with an explicit missing-limits attestation', () => {
    const result = raw([pair('TH'), pair('DE')])
    assert.equal(result.status, 'research_review_queue_prepared')
    if (result.status !== 'research_review_queue_prepared') return
    assert.match(result.queueKey, /^grok-review-queue:v2:[a-f0-9]{64}$/)
    assert.deepEqual(result.countries.map(c => c.countryCode), ['DE', 'TH'])
    assert.deepEqual(result.countries.map(c => c.researchLimitsAttestation),
      ['missing_in_original', 'missing_in_original'])
    assert.equal(result.totalCandidates, 2)
    assert.equal(result.awaitingIndependentReview, 2)
    assert.equal(result.blockedCandidates, 0)
    assert.equal(result.researchStatus, 'RESEARCH_ONLY')
    assert.equal(result.databaseImportStatus, 'NOT_APPROVED_FOR_DATABASE_IMPORT')
    assert.equal(result.sourceCustody, 'not_verified')
    assert.equal(result.verifierIndependence, 'same_executor_not_independent')
    assert.equal(result.acceptedRules, 0)
    assert.equal(result.databaseWrites, 0)
    assert.deepEqual(result.countries[0]?.candidates[0]?.state, 'needs_independent_source_review')
    assert.match(result.countries[0]?.untrustedSubmissionKey ?? '', /^grok-submission:v2:[a-f0-9]{64}$/)
    assert.match(result.countries[0]?.candidates[0]?.reviewKey ?? '', /^grok-review-item:v2:[a-f0-9]{64}$/)
    const redacted = JSON.stringify(result)
    assert(!redacted.includes('research.example'))
    assert(!redacted.includes('UNTRUSTED_RESEARCH_NEVER_PUBLISH'))
    assert.equal(Object.isFrozen(result), true)
    assert.equal(Object.isFrozen(result.countries), true)
    assert.equal(Object.isFrozen(result.countries[0]?.candidates), true)
    assert.equal(requirementsProviderAus(), null)
  })

  test('legacy V1 stays five-country only and retains its own deterministic keys', () => {
    assert.deepEqual(grokForschungsReviewQueueVorbereiten([pair('DE')]),
      { status: 'blocked', reason: 'invalid_country' })
    assert.deepEqual(grokForschungsReviewQueueVorbereiten([pair('TH')]),
      { status: 'blocked', reason: 'invalid_country' })
    const itV1 = grokForschungsReviewQueueVorbereiten([pair('IT')])
    const itV2 = raw([pair('IT')])
    assert.equal(itV1.status, 'research_review_queue_prepared')
    assert.equal(itV2.status, 'research_review_queue_prepared')
    if (itV1.status !== 'research_review_queue_prepared' ||
      itV2.status !== 'research_review_queue_prepared') return
    assert.match(itV1.queueKey, /^grok-review-queue:v1:[a-f0-9]{64}$/)
    assert.match(itV2.queueKey, /^grok-review-queue:v2:[a-f0-9]{64}$/)
    assert.equal(itV1.countries[0]?.researchLimitsAttestation, undefined)
    assert.equal(itV2.countries[0]?.researchLimitsAttestation, 'bot_reported_only')
    assert.notEqual(itV1.queueKey, itV2.queueKey)
  })

  test('all seven countries, reorder-invariant v2 queue, no accepted truth', () => {
    const first = raw(ALL.map(country => pair(country)))
    const second = raw([...ALL].reverse().map(country => pair(country)))
    assert.deepEqual(first, second)
    assert.equal(first.status, 'research_review_queue_prepared')
    if (first.status !== 'research_review_queue_prepared') return
    assert.deepEqual(first.countries.map(c => c.countryCode), [...ALL].sort())
    assert.equal(first.totalCandidates, 7)
    assert.equal(first.awaitingIndependentReview, 7)
    assert.equal(first.acceptedRules, 0)
    assert.equal(first.databaseWrites, 0)
    const edited = pair('TH')
    edited.candidatePackage.candidates[0]!.claims[0]!.statement = 'DIFFERENT_UNTRUSTED_RESEARCH'
    const changed = raw([pair('DE'), edited])
    const baseline = raw([pair('DE'), pair('TH')])
    assert.equal(changed.status, 'research_review_queue_prepared')
    assert.equal(baseline.status, 'research_review_queue_prepared')
    if (changed.status === 'research_review_queue_prepared' && baseline.status === 'research_review_queue_prepared') {
      assert.notEqual(changed.queueKey, baseline.queueKey)
      assert(!JSON.stringify(changed).includes('DIFFERENT_UNTRUSTED_RESEARCH'))
    }
  })

  test('limits declaration is NEVER fabricated for DE/TH; false or missing legacy limits fail', () => {
    const deFalse = pair('DE')
    assert.deepEqual(raw([{ ...deFalse,
      candidatePackage: { ...deFalse.candidatePackage, hard_limits_respected: false },
    }]), { status: 'blocked', reason: 'invalid_package' })
    const thFalse = pair('TH')
    assert.deepEqual(raw([{ ...thFalse,
      candidatePackage: { ...thFalse.candidatePackage, hard_limits_respected: false },
    }]), { status: 'blocked', reason: 'invalid_package' })
    const it = pair('IT')
    const { hard_limits_respected: _ignored, ...missingLimits } = it.candidatePackage
    assert.deepEqual(raw([{ ...it, candidatePackage: missingLimits }]),
      { status: 'blocked', reason: 'invalid_package' })
    void _ignored
    const itAccepted = raw([it])
    assert.equal(itAccepted.status, 'research_review_queue_prepared')
    if (itAccepted.status === 'research_review_queue_prepared') {
      assert.equal(itAccepted.countries[0]?.researchLimitsAttestation, 'bot_reported_only')
    }
  })

  test('no cross-country scope or passport alias can sneak through', () => {
    const de = pair('DE')
    const th = pair('TH')
    assert.deepEqual(raw([{ ...de, candidatePackage: {
      ...de.candidatePackage,
      traveller_scope: { ...de.candidatePackage.traveller_scope, document: 'ordinary Swiss passport' },
    } }]), { status: 'blocked', reason: 'invalid_scope' })
    assert.deepEqual(raw([{ ...th, candidatePackage: {
      ...th.candidatePackage,
      traveller_scope: { ...th.candidatePackage.traveller_scope, document: 'temporary Swiss passport' },
    } }]), { status: 'blocked', reason: 'invalid_scope' })
    assert.deepEqual(raw([{ ...th, candidatePackage: {
      ...th.candidatePackage,
      traveller_scope: { ...th.candidatePackage.traveller_scope, document: 'ordinary Swiss passport (product scope)' },
    } }]), { status: 'blocked', reason: 'invalid_scope' })
    assert.deepEqual(raw([{ ...de, countryCode: 'TH' }]), { status: 'blocked', reason: 'invalid_scope' })
    assert.deepEqual(raw([{ ...th, verification: { ...th.verification, package_id: de.verification.package_id } }]), {
      status: 'blocked', reason: 'verification_identity_mismatch',
    })
  })

  test('duplicates, unknown countries, overlong batch, malformed pairs or V2 annotated packages block', () => {
    assert.deepEqual(raw([]), { status: 'blocked', reason: 'invalid_batch' })
    assert.deepEqual(raw([...ALL.map(c => pair(c)), pair('DE')]), {
      status: 'blocked', reason: 'invalid_batch',
    })
    assert.deepEqual(raw([pair('DE'), pair('DE')]), { status: 'blocked', reason: 'duplicate_country' })
    assert.deepEqual(raw([{ ...pair('DE'), countryCode: 'CA' }]), {
      status: 'blocked', reason: 'invalid_country',
    })
    const de = pair('DE')
    assert.deepEqual(raw([{ countryCode: 'DE', candidatePackage: de.candidatePackage }]), {
      status: 'blocked', reason: 'invalid_pair',
    })
    assert.deepEqual(raw([{ ...de, databaseApproved: true }]), {
      status: 'blocked', reason: 'invalid_pair',
    })
    assert.deepEqual(raw([{ ...de,
      candidatePackage: { ...de.candidatePackage, schema_version: 'bridge-v2/1' },
    }]), { status: 'blocked', reason: 'invalid_package' })
  })

  test('bot-blocked candidate and invalid or unsupported fact remain blocked', () => {
    const th = raw([pair('TH', true)])
    assert.equal(th.status, 'research_review_queue_prepared')
    if (th.status === 'research_review_queue_prepared') {
      assert.equal(th.blockedCandidates, 1)
      assert.deepEqual(th.countries[0]?.candidates[0]?.findings, ['bot_blocked'])
    }
    const de = pair('DE')
    const deCorrupt = { ...de,
      candidatePackage: { ...de.candidatePackage,
        candidates: de.candidatePackage.candidates.map(c => ({
          ...c, proposed_fact: { effect: 'required', visa_mode: 'visa_required' },
        })),
      },
    }
    const result = raw([deCorrupt])
    assert.equal(result.status, 'research_review_queue_prepared')
    if (result.status === 'research_review_queue_prepared') {
      assert.deepEqual(result.countries[0]?.candidates[0]?.findings, ['visa_mode_unsupported'])
      assert.equal(result.countries[0]?.candidates[0]?.state, 'blocked')
      assert.equal(result.acceptedRules, 0)
    }
  })

  test('personal data, hostile accessors, incomplete sources and forged approvals never pass', () => {
    const th = pair('TH')
    assert.deepEqual(raw([{ ...th, candidatePackage: { ...th.candidatePackage, passportNumber: 'PRIVATE' } }]), {
      status: 'blocked', reason: 'forbidden_personal_field',
    })
    assert.deepEqual(raw([{ ...th, candidatePackage: { ...th.candidatePackage,
      authority_boundary: { ...th.candidatePackage.authority_boundary, not_approved_for_database_import: false },
    } }]), { status: 'blocked', reason: 'invalid_package' })
    const badSource = pair('DE')
    const source = 'SRC-DE-OFFICIAL'
    const changed = raw([{ ...badSource, candidatePackage: { ...badSource.candidatePackage, sources: {
      [source]: { source_class: 'official_authority', canonical_url: 'http://unsafe.local/visa' },
    } } }])
    assert.deepEqual(changed, { status: 'blocked', reason: 'invalid_source_set' })
    const getter = { ...pair('DE') }
    Object.defineProperty(getter.candidatePackage, 'approvedEvidence', {
      enumerable: true,
      get() { throw new Error('not allowed to run') },
    })
    assert.deepEqual(raw([getter]), { status: 'blocked', reason: 'invalid_json_tree' })
    const proxy = new Proxy(pair('DE'), {
      ownKeys() { throw new Error('malicious proxy') },
    })
    assert.deepEqual(raw([proxy]), { status: 'blocked', reason: 'invalid_json_tree' })
  })

  test('pure offline read: no network, Supabase, provider or government source activation', () => {
    const queue = readFileSync(join(process.cwd(), 'lib/readiness/official-truth-grok-review-queue-v1-server.ts'), 'utf8')
    const intake = readFileSync(join(process.cwd(), 'lib/readiness/official-truth-grok-research-intake-v1.ts'), 'utf8')
    assert.match(queue, /import 'server-only'/)
    for (const code of [queue, intake]) {
      assert.doesNotMatch(code, /\bfetch\s*\(|https\.request|createClient|apply_migration|execute_sql/)
      assert.doesNotMatch(code, /official_truth_store_accepted_v1\s*\(|\bregelKandidatAkzeptieren\s*\(/)
    }
    assert.equal(requirementsProviderAus(), null)
  })
})
