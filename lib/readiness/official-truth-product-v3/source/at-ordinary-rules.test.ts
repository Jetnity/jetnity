import assert from 'node:assert/strict'
import { readFileSync } from 'node:fs'
import { dirname, join } from 'node:path'
import { test } from 'node:test'
import { fileURLToPath } from 'node:url'
import { createV3SourceOnboardingTemplate, prepareV3SourceOnboardingPlan } from '../customer-information/source-onboarding'
import { V3_CUSTOMER_INFORMATION_TOPICS } from '../customer-information/topics'
import { HRS1_LIMITS } from '../result/contract'
import { AT_FETCHED_AT_UTC, AT_PRIORITY_KNOWN_CODES, AT_PRIORITY_PREFIX, AT_SHORT_STAY_SHA256, AT_BERN_SHA256,
  AT_VISA_MATRIX_EDITION, AT_VISA_MATRIX_EDITION_TEXT, atPrioritySlotReport, inspectAtVisaMatrixIdentity,
  readAtOfficialOriginals, type AtPassportRule } from './at-bmi-ordinary-rules'
import { AT_BMI_REVIEWED_REGISTRY, AT_METHOD_BINDING, AT_METHOD_DRAFT, atHrsAdmissionRefusal } from './at-reviewed-program'

const fixture = join(dirname(fileURLToPath(import.meta.url)), '../../../../docs/evidence/official-truth-at-v3/2026-11-16')
const bytes = (name: string) => readFileSync(join(fixture, name))
const originals = () => ({ visa: bytes('bmi-visa-matrix.html'), shortStay: bytes('bmi-short-stay.html'), bern: bytes('bmeia-bern-application.html') })
const rule = (rules: readonly AtPassportRule[], code: string) => rules.find(item => item.citizenshipCountryCode === code)

test('current BMI original is edition 6.11.2026 and rejects the older 15.7.2026 label', () => {
  const body = new TextDecoder('utf-8', { fatal: true }).decode(originals().visa)
  const identity = inspectAtVisaMatrixIdentity(originals().visa)
  assert.equal(identity.ok, true)
  if (identity.ok) {
    assert.equal(identity.edition, AT_VISA_MATRIX_EDITION)
    assert.equal(identity.sha256.length, 64)
  }
  assert.equal(body.includes('15.7.2026') || body.includes('15.07.2026'), false)
  assert.equal(body.split(AT_VISA_MATRIX_EDITION_TEXT).length, 2)
  const relabelled = new TextEncoder().encode(body.replace(AT_VISA_MATRIX_EDITION_TEXT, '(Stand: 15.7.2026)'))
  assert.deepEqual(inspectAtVisaMatrixIdentity(relabelled), { ok: false, reason: 'stale_edition_rejected' })
  const edited = originals().visa.subarray(0)
  const marker = Buffer.from('>Schweiz</summary>')
  const index = Buffer.from(edited).indexOf(marker)
  assert.ok(index > 0)
  edited[index + 1] = 'X'.charCodeAt(0)
  assert.equal(inspectAtVisaMatrixIdentity(edited).ok, false)
  assert.equal(readAtOfficialOriginals({ ...originals(), visa: edited }).rules.length, 0)
})

test('ordinary AT rules stay inside visa and identity-card cells', () => {
  const read = readAtOfficialOriginals(originals())
  assert.equal(read.visa.ok, true)
  assert.equal(read.shortStay.ok && read.shortStay.sha256, AT_SHORT_STAY_SHA256)
  assert.equal(read.bern.ok && read.bern.sha256, AT_BERN_SHA256)
  assert.equal(read.publicationAuthority, 'none')
  assert.equal(read.priorityFile, 'absent')
  const ch = rule(read.rules, 'CH'), de = rule(read.rules, 'DE'), india = rule(read.rules, 'IN')
  const ukraine = rule(read.rules, 'UA'), turkey = rule(read.rules, 'TR'), france = rule(read.rules, 'FR')
  assert.equal(ch?.visa, 'free_movement')
  assert.equal(ch?.identityCard, 'accepted')
  assert.equal(ch?.stayFrame, 'free_movement_up_to_three_months')
  assert.equal(de?.visa, 'free_movement')
  assert.equal(france?.visa, 'free_movement')
  assert.equal(france?.identityCard, 'unavailable')
  assert.equal(india?.visa, 'required')
  assert.equal(india?.identityCard, 'not_accepted')
  assert.equal(ukraine?.visa, 'biometric_ordinary')
  assert.equal(turkey?.visa, 'unavailable')
  assert.equal(read.rules.some(item => item.visa === 'free_movement' && item.stayFrame !== 'free_movement_up_to_three_months'), false)
  assert.equal(read.rules.some(item => item.countryName.includes('Aufenthalt') && item.visa !== 'unavailable'), false)
  const slots = atPrioritySlotReport(read)
  assert.deepEqual(slots.map(slot => slot.citizenshipCountryCode), [...AT_PRIORITY_KNOWN_CODES])
  assert.deepEqual(AT_PRIORITY_PREFIX, ['IN', 'TR', 'CN', 'DE', 'PL', 'IT', 'US', 'UA', 'RO', 'FR'])
  for (const slot of slots) {
    assert.equal(slot.topics.length, V3_CUSTOMER_INFORMATION_TOPICS.length)
    assert.equal(slot.topics.length, 26)
    for (const topic of slot.topics) {
      if (topic.topic !== 'visa' && topic.topic !== 'identity_document') assert.equal(topic.status, 'unavailable')
    }
  }
  assert.equal(slots.filter(slot => slot.visa !== 'unavailable').length > 0, true)
})

test('the regular HRS and BG1 gates still refuse Austria', () => {
  const admission = atHrsAdmissionRefusal()
  assert.equal(admission.admitted, false)
  assert.equal(admission.reason, 'hrs_binding_locked_to_de_ch')
  assert.equal(admission.originalByteLimit, 131072)
  assert.equal(HRS1_LIMITS.originalBytes, 131072)
  assert.ok(Buffer.byteLength(originals().visa) > HRS1_LIMITS.originalBytes)
  assert.equal(AT_METHOD_DRAFT.status, 'NOT_APPROVED')
  assert.equal(AT_METHOD_BINDING.methodId, 'jetnity-destination-primary-at-visa')
  const sql = readFileSync(join(dirname(fileURLToPath(import.meta.url)), '../../../../scripts/db/official-truth-v3-background-guard-1/provider-migration-body.sql'), 'utf8')
  assert.match(sql, /destinationCountryCode'='DE' AND q->>'citizenshipCountryCode'='CH'/)
  const plan = createV3SourceOnboardingTemplate({ destinationCountryCode: 'AT', citizenshipCountryCodes: ['CH', 'DE', 'IN', 'US', 'UA'] })
  assert.ok(plan)
  const checked = prepareV3SourceOnboardingPlan(plan, AT_BMI_REVIEWED_REGISTRY)
  assert.equal(checked.ok, true)
  if (checked.ok) {
    assert.equal(checked.publicationAuthority, 'none')
    assert.equal(checked.intake, 'existing_v3_only')
    assert.equal(checked.proposals.length, 0)
  }
  assert.equal(AT_FETCHED_AT_UTC, '2026-11-16T19:45:39Z')
})
