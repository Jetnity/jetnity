import assert from 'node:assert/strict'
import { readFileSync } from 'node:fs'
import { join } from 'node:path'
import { describe, test } from 'node:test'
import { grokForschungsReviewQueueVorbereiten } from '@/lib/readiness/official-truth-grok-review-queue-v1-server'
import { requirementsProviderAus } from '@/lib/readiness/provider'

type CountryCode = 'IT' | 'FR' | 'ES' | 'JP' | 'US'

function pair(countryCode: CountryCode, blockedByBot = false) {
  const source = 'SRC-' + countryCode + '-OFFICIAL'
  const packageId = 'OT-CH-' + countryCode + '-CAND-20261105-001'
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
        document: 'ordinary Swiss passport (product scope)',
      },
      hard_limits_respected: true,
      sources: {
        [source]: {
          source_class: 'official_authority',
          canonical_url: 'https://authority.example/research',
          source_content_hash_sha256: 'a'.repeat(64),
        },
      },
      candidates: [{
        candidate_id: 'CAND-VISA-001',
        requirement_type: 'visa',
        fact_kind: 'requirement_effect',
        proposed_fact: { effect: 'not_required', visa_mode: 'visa_exempt' },
        schema_mapping: {},
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
        claims: [{ source_ref: source, statement: 'untrusted-grok-claim-NEVER-PUBLISH' }],
      }],
    },
    verification: {
      schema_version: 1,
      package_id: packageId,
      verification_id: 'OT-CH-' + countryCode + '-VERIFY-20261105-001',
      generated_at_utc: '2026-11-05T14:05:00Z',
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

const read = (input: unknown) => grokForschungsReviewQueueVorbereiten(input)

describe('Grok V1 server-only review plan: no trusted source or accepted rule', () => {
  test('verified research shape creates frozen minimal queue data, never Official Truth', () => {
    const result = read([pair('IT')])
    assert.equal(result.status, 'research_review_queue_prepared')
    if (result.status !== 'research_review_queue_prepared') return
    assert.match(result.queueKey, /^grok-review-queue:v1:[a-f0-9]{64}$/)
    assert.equal(result.researchStatus, 'RESEARCH_ONLY')
    assert.equal(result.databaseImportStatus, 'NOT_APPROVED_FOR_DATABASE_IMPORT')
    assert.equal(result.sourceCustody, 'not_verified')
    assert.equal(result.verifierIndependence, 'same_executor_not_independent')
    assert.equal(result.acceptedRules, 0)
    assert.equal(result.databaseWrites, 0)
    assert.deepEqual([result.totalCandidates, result.awaitingIndependentReview, result.blockedCandidates], [1, 1, 0])
    assert.deepEqual(result.countries[0]?.candidates.map((x) => [x.candidateId, x.state, x.findings]), [
      ['CAND-VISA-001', 'needs_independent_source_review', []],
    ])
    assert.match(result.countries[0]?.untrustedSubmissionKey ?? '', /^grok-submission:v1:[a-f0-9]{64}$/)
    assert.equal(Object.isFrozen(result), true)
    assert.equal(Object.isFrozen(result.countries), true)
    assert.equal(Object.isFrozen(result.countries[0]?.candidates), true)
    assert.equal(Object.isFrozen(result.countries[0]?.candidates[0]?.findings), true)
    assert.equal(JSON.stringify(result).includes('untrusted-grok-claim'), false)
    assert.equal(JSON.stringify(result).includes('authority.example'), false)
    assert.equal(requirementsProviderAus(), null)
  })

  test('country order does not change queue key, identical replay is idempotent', () => {
    const first = read([pair('US'), pair('IT')])
    const second = read([structuredClone(pair('IT')), structuredClone(pair('US'))])
    assert.deepEqual(second, first)
    assert.equal(first.status, 'research_review_queue_prepared')
    if (first.status !== 'research_review_queue_prepared') return
    assert.deepEqual(first.countries.map((c) => c.countryCode), ['IT', 'US'])
    const changed = pair('US')
    changed.candidatePackage.candidates[0]!.claims[0]!.statement = 'different-untrusted-research-claim'
    const changedBatch = read([pair('IT'), changed])
    assert.equal(changedBatch.status, 'research_review_queue_prepared')
    if (changedBatch.status === 'research_review_queue_prepared') {
      assert.notEqual(changedBatch.queueKey, first.queueKey)
    }
  })

  test('a blocked bot candidate remains blocked; model cannot claim independent verification', () => {
    const result = read([pair('JP', true)])
    assert.equal(result.status, 'research_review_queue_prepared')
    if (result.status !== 'research_review_queue_prepared') return
    assert.equal(result.blockedCandidates, 1)
    assert.equal(result.awaitingIndependentReview, 0)
    assert.deepEqual(result.countries[0]?.candidates[0]?.findings, ['bot_blocked'])
    assert.equal(result.countries[0]?.candidates[0]?.state, 'blocked')
    assert.equal(result.acceptedRules, 0)
    assert.equal(result.verifierIndependence, 'same_executor_not_independent')
  })

  test('unknown, duplicate, missing and additional authority fields fail the whole batch closed', () => {
    assert.deepEqual(read([]), { status: 'blocked', reason: 'invalid_batch' })
    assert.deepEqual(read(Array.from({ length: 6 }, () => pair('IT'))), { status: 'blocked', reason: 'invalid_batch' })
    assert.deepEqual(read([pair('US'), structuredClone(pair('US'))]), { status: 'blocked', reason: 'duplicate_country' })
    assert.deepEqual(read([{ ...pair('US'), countryCode: 'TH' }]), { status: 'blocked', reason: 'invalid_country' })
    const us = pair('US')
    assert.deepEqual(read([{ countryCode: 'US', candidatePackage: us.candidatePackage }]), {
      status: 'blocked', reason: 'invalid_pair',
    })
    assert.deepEqual(read([{ ...us, sourceCustody: 'verified' }]), { status: 'blocked', reason: 'invalid_pair' })
    assert.deepEqual(read([{ ...us, databaseApproved: true }]), { status: 'blocked', reason: 'invalid_pair' })
  })

  test('tampering, invalid country scope, and forbidden personally identifying fields fail closed', () => {
    const us = pair('US')
    assert.deepEqual(read([{ ...us, verification: { ...us.verification, package_id: 'OT-CH-IT-CAND-20261105-001' } }]), {
      status: 'blocked', reason: 'verification_identity_mismatch',
    })
    const it = pair('IT')
    it.candidatePackage.traveller_scope.citizenship = 'DE'
    assert.deepEqual(read([it]), { status: 'blocked', reason: 'invalid_scope' })
    assert.deepEqual(read([{ ...us, candidatePackage: { ...us.candidatePackage, passportNumber: 'NEVER-LOG' } }]), {
      status: 'blocked', reason: 'forbidden_personal_field',
    })
    const evil = { ...us, verification: { ...us.verification } }
    Object.defineProperty(evil.verification, 'dangerous', {
      get() { throw new Error('MUST-NOT-RUN-GETTER') }, enumerable: true,
    })
    assert.deepEqual(read([evil]), { status: 'blocked', reason: 'invalid_json_tree' })
  })

  test('unsupported US visa mode, ESTA typing and invalid stay mapping are never auto-corrected', () => {
    const us = pair('US')
    us.candidatePackage.candidates[0]!.proposed_fact.visa_mode = 'visa_required'
    const result = read([us])
    assert.equal(result.status, 'research_review_queue_prepared')
    if (result.status !== 'research_review_queue_prepared') return
    assert.deepEqual(result.countries[0]?.candidates[0]?.findings, ['visa_mode_unsupported'])
    assert.equal(result.countries[0]?.candidates[0]?.state, 'blocked')
    assert.equal(result.acceptedRules, 0)
  })

  test('server-only module contains no network, Supabase write or source admission call', () => {
    const source = readFileSync(join(process.cwd(), 'lib/readiness/official-truth-grok-review-queue-v1-server.ts'), 'utf8')
    assert.match(source, /import 'server-only'/)
    assert.doesNotMatch(source, /createClient|fetch\(|execute_sql|apply_migration|supabase\.|accepted_evidence|accepted_rule|trustedRuleFact|quellenKatalogLesen/)
    assert.equal(requirementsProviderAus(), null)
  })
})
