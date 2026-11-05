import assert from 'node:assert/strict'
import { readFileSync } from 'node:fs'
import { join } from 'node:path'
import { describe, test } from 'node:test'
import { grokRecherchePaketQuarantaene } from '@/lib/readiness/official-truth-grok-research-intake-v1'
import { requirementsProviderAus } from '@/lib/readiness/provider'

const NOW = new Date('2026-11-05T16:00:00Z')
const SOURCE = 'SRC-US-EXAMPLE-GOV'

function packageFixture() {
  return {
    schema_version: 1,
    package_id: 'OT-CH-US-CAND-20261105-001',
    generated_at_utc: '2026-11-05T14:30:00Z',
    authority_boundary: {
      mode: 'RESEARCH_ONLY',
      not_accepted_official_truth: true,
      not_approved_for_database_import: true,
      no_supabase_writes: true,
      stage1_readback_917_untouched: true,
    },
    traveller_scope: {
      citizenship: 'CH',
      document: 'ordinary Swiss passport (product scope)',
      destination: 'US',
    },
    hard_limits_respected: true,
    sources: {
      [SOURCE]: {
        source_class: 'official_authority',
        canonical_url: 'https://government.example/visa-waiver',
        source_content_hash_sha256: 'f'.repeat(64),
      },
    },
    candidates: [
      {
        candidate_id: 'CAND-VISA-001',
        requirement_type: 'visa',
        fact_kind: 'requirement_effect',
        proposed_fact: { effect: 'not_required', visa_mode: 'visa_exempt' },
        scope: {
          destination_country_code: 'US',
          citizenship_mode: 'required',
          citizenship_country_codes: ['CH'],
          credential_option_mode: 'option',
          document_type: 'passport',
          issuing_country_code: 'CH',
          related_citizenship_country_code: 'CH',
          passport_class_product_scope: 'ordinary',
        },
        claims: [{ source_ref: SOURCE, statement: 'untrusted-model-text-not-truth' }],
        schema_mapping: {},
      },
    ],
  }
}

function verificationFixture() {
  return {
    schema_version: 1,
    package_id: 'OT-CH-US-CAND-20261105-001',
    verification_id: 'OT-CH-US-VERIFY-20261105-001',
    generated_at_utc: '2026-11-05T14:33:00Z',
    method: 'independent_second_pass_same_executor_re_fetch',
    authority_boundary_preserved: true,
    external_writes: [],
    per_candidate: {
      'CAND-VISA-001': {
        verdict: 'candidate_ready_for_TL_qualification',
        second_pass: { scope_ok: true, quote_supports_claim: true },
      },
    },
    counts: { candidate_ready_for_TL_qualification: 1, blocked_with_exact_reason: 0 },
  }
}

function read(pkg: unknown, verification: unknown, destination = 'US', clock = NOW) {
  return grokRecherchePaketQuarantaene(pkg, verification, destination, clock)
}

describe('Grok research handoff V1 quarantine: actual paired JSON structure, no accepted authority', () => {
  test('matching files are quarantined; bot-ready is not imported or accepted', () => {
    const result = read(packageFixture(), verificationFixture())
    assert.equal(result.status, 'quarantined_research_only')
    if (result.status !== 'quarantined_research_only') return
    assert.equal(result.packageId, 'OT-CH-US-CAND-20261105-001')
    assert.equal(result.countryCode, 'US')
    assert.equal(result.reportedReadyForTlQualification, 1)
    assert.equal(result.reportedBlocked, 0)
    assert.equal(result.databaseImportStatus, 'NOT_APPROVED_FOR_DATABASE_IMPORT')
    assert.equal(result.researchStatus, 'RESEARCH_ONLY')
    assert.equal(result.verificationClass, 'same_executor_not_independent')
    assert.equal(result.sourceCustody, 'not_verified')
    assert.equal(result.databaseWrites, 0)
    assert.equal(result.acceptedRules, 0)
    assert.deepEqual(result.candidates, [{
      candidateId: 'CAND-VISA-001',
      disposition: 'requires_independent_review',
      findings: [],
    }])
    assert.equal(requirementsProviderAus(), null)
    assert.equal(JSON.stringify(result).includes('untrusted-model-text'), false)
    assert.equal(JSON.stringify(result).includes('government.example'), false)
  })

  test('swapped verification, contradictory count and foreign country fail closed', () => {
    const pkg = packageFixture(), ver = verificationFixture()
    assert.deepEqual(read(pkg, { ...ver, package_id: 'OT-CH-IT-CAND-20261105-001' }), {
      status: 'blocked', reason: 'verification_identity_mismatch',
    })
    assert.deepEqual(read(pkg, { ...ver, counts: { ...ver.counts, candidate_ready_for_TL_qualification: 8 } }), {
      status: 'blocked', reason: 'count_mismatch',
    })
    assert.deepEqual(read(pkg, ver, 'IT'), { status: 'blocked', reason: 'invalid_scope' })
    assert.deepEqual(read(pkg, ver, 'US', new Date('invalid')), { status: 'blocked', reason: 'invalid_reference_time' })
    assert.deepEqual(read(pkg, ver, 'US', new Date('2026-11-05T14:32:00Z')), { status: 'blocked', reason: 'future_report' })
  })

  test('bot-blocked findings stay blocked, even with valid claim sources', () => {
    const ver = verificationFixture()
    ver.per_candidate['CAND-VISA-001'].verdict = 'blocked_with_exact_reason'
    ver.counts.candidate_ready_for_TL_qualification = 0
    ver.counts.blocked_with_exact_reason = 1
    const result = read(packageFixture(), ver)
    assert.equal(result.status, 'quarantined_research_only')
    if (result.status !== 'quarantined_research_only') return
    assert.deepEqual(result.candidates[0]?.findings, ['bot_blocked'])
    assert.equal(result.candidates[0]?.disposition, 'blocked')
  })

  test('US ESTA typing, unknown stay column and missing source references are not silently normalized', () => {
    const pkg = packageFixture()
    pkg.candidates[0]!.candidate_id = 'CAND-ESTA-001'
    pkg.candidates[0]!.requirement_type = 'other_entry_requirement'
    pkg.candidates[0]!.fact_kind = 'official_actions'
    pkg.candidates[0]!.schema_mapping = { 'private.official_rule_claim_stay_limit.max_days': 90 }
    pkg.candidates[0]!.claims[0]!.source_ref = 'SRC-US-MISSING'
    const ver = {
      ...verificationFixture(),
      per_candidate: {
        'CAND-ESTA-001': { verdict: 'candidate_ready_for_TL_qualification', second_pass: { scope_ok: true, quote_supports_claim: true } },
      },
    }
    const result = read(pkg, ver)
    assert.equal(result.status, 'quarantined_research_only')
    if (result.status !== 'quarantined_research_only') return
    assert.deepEqual(result.candidates[0]?.findings, [
      'eta_requirement_type_wrong',
      'source_reference_missing',
      'unsupported_stay_column',
      'visa_mode_on_nonvisa',
    ])
    assert.equal(result.candidates[0]?.disposition, 'blocked')
    assert.equal(result.acceptedRules, 0)
  })

  test('personal data key, claims of DB authorization, incorrect identity and future date fail closed', () => {
    const pkg = packageFixture(), ver = verificationFixture()
    assert.deepEqual(read({ ...pkg, passportNumber: 'PRIVATE-PASSPORT' }, ver), {
      status: 'blocked', reason: 'forbidden_personal_field',
    })
    assert.deepEqual(read({ ...pkg, authority_boundary: { ...pkg.authority_boundary, not_approved_for_database_import: false } }, ver), {
      status: 'blocked', reason: 'invalid_package',
    })
    assert.deepEqual(read({ ...pkg, traveller_scope: { ...pkg.traveller_scope, citizenship: 'DE' } }, ver), {
      status: 'blocked', reason: 'invalid_scope',
    })
    assert.deepEqual(read({ ...pkg, generated_at_utc: '2026-11-06T14:30:00Z' }, ver), {
      status: 'blocked', reason: 'future_report',
    })
  })

  test('duplicate candidate, extra report and invalid source URLs cannot create a phantom candidate', () => {
    const pkg = packageFixture(), ver = verificationFixture()
    // The incoming handoff is JSON: duplicate records have distinct objects.
    // A shallow JS copy would reuse nested objects and fail the cycle/alias
    // guard before the candidate-ID duplication check is reached.
    pkg.candidates.push(structuredClone(pkg.candidates[0]!))
    assert.deepEqual(read(pkg, ver), { status: 'blocked', reason: 'invalid_candidate_set' })
    pkg.candidates.pop()
    assert.deepEqual(read(pkg, { ...ver, per_candidate: { ...ver.per_candidate, 'CAND-OTHER-001': {} } }), {
      status: 'blocked', reason: 'invalid_candidate_set',
    })
    pkg.sources[SOURCE].canonical_url = 'http://government.example'
    assert.deepEqual(read(pkg, ver), { status: 'blocked', reason: 'invalid_source_set' })
  })

  test('no database, network, provider or accepted-store writer is introduced', () => {
    const source = readFileSync(join(process.cwd(), 'lib/readiness/official-truth-grok-research-intake-v1.ts'), 'utf8')
    assert.doesNotMatch(source, /createClient|fetch\(|execute_sql|apply_migration|official_truth_store_accepted_v1|regelKandidatAkzeptieren|evidenceKandidatAkzeptieren/)
    assert.equal(requirementsProviderAus(), null)
  })
})
