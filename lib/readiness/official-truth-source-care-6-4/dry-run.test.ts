import assert from 'node:assert/strict'
import { createHash } from 'node:crypto'
import { readdirSync, readFileSync } from 'node:fs'
import { join } from 'node:path'
import test from 'node:test'
import { fileURLToPath } from 'node:url'
import { checkSourceBoundRenewal, type ReviewedFact, type SourceRenewalCheck } from '../official-truth-product-v3/monitor/source-bound-renewal'
import {
  ADDITIONAL_TOPICS,
  BMEIA_CSS_ASSET_PATTERN,
  BMEIA_JS_ASSET_PATTERN,
  CORE_TOPICS,
  STOCK_PROTECTION_MARKER,
  TECHNICAL_ATTEMPT_BOUND,
  assetTimestampNeutral,
  canonicalSourceBytes,
  evaluateSourceCareDryRun,
  scopeKey,
  sourceDigest,
  type CareAttempt,
  type CareScope,
  type CareSection,
  type CareSnapshot,
  type CareTopic,
  type SourceCareDryRun,
} from './dry-run'

const root = fileURLToPath(new URL('../../../', import.meta.url))
const checkedAt = '2026-11-27T12:00:00.000Z'
const retrievedBaseline = '2026-09-01T00:00:00.000Z'
const retrievedNext = '2026-11-27T11:00:00.000Z'
const future = '2026-12-31T00:00:00.000Z'
const sha = (value: string) => createHash('sha256').update(value).digest('hex')

function scope(over: Partial<CareScope> = {}): CareScope {
  return {
    destinationCode: 'TH',
    credentialCode: 'CH',
    documentKind: 'ordinary_passport',
    routeKind: 'direct_entry',
    ruleClass: 'visa_exemption_60',
    ...over,
  }
}

function section(over: Partial<Omit<CareSection, 'scope'>> & { scope?: Partial<CareScope> } = {}): CareSection {
  const { scope: scopeOver, ...rest } = over
  return {
    scope: scope(scopeOver),
    topic: 'K3_stay',
    kind: 'text',
    body: 'synthetic cited rule',
    stayDays: 60,
    effectiveFrom: null,
    stockProtection: null,
    evidence: 'cited',
    validUntil: future,
    ...rest,
  }
}

function snapshot(over: Partial<CareSnapshot> = {}): CareSnapshot {
  return {
    sourceId: 'th-exemption-synthetic',
    officialUrl: 'https://example.invalid/synthetic-thailand-exemption',
    version: 'synthetic-60',
    retrievedAt: retrievedBaseline,
    assets: '',
    sections: [section()],
    ...over,
  }
}

function retrieved(value: CareSnapshot): CareAttempt {
  return { outcome: 'retrieved', snapshot: { ...value, retrievedAt: value.retrievedAt === retrievedBaseline ? retrievedNext : value.retrievedAt } }
}

function run(baseline: CareSnapshot, observed: CareSnapshot, extra: Partial<Parameters<typeof evaluateSourceCareDryRun>[0]> = {}): SourceCareDryRun {
  return evaluateSourceCareDryRun({
    checkedAt,
    baseline,
    attempts: [retrieved(observed)],
    concurrent: [],
    priorLocks: [],
    ...extra,
  })
}

function finding(decision: SourceCareDryRun, topic: CareTopic, ruleClass = 'visa_exemption_60', credential = 'CH') {
  return decision.findings.find((item) => item.topic === topic && item.ruleClass === ruleClass && item.credentialCode === credential)
}

function thailandBaseline(): CareSnapshot {
  return snapshot({
    sections: [
      section({ topic: 'K1_visa', body: 'synthetic exemption class 60', stayDays: 60 }),
      section({ topic: 'K2_document', body: 'synthetic ordinary passport six months', stayDays: null }),
      section({ topic: 'K3_stay', body: 'synthetic stay 60 days', stayDays: 60 }),
      section({ topic: 'K4_health', body: 'synthetic health requirement separate from advice', stayDays: null }),
      section({ topic: 'K5_forms', body: 'synthetic arrival card cited', stayDays: null }),
      section({ topic: 'K6_minors', body: 'synthetic minor accompaniment still open in this fixture', evidence: 'not_applicable' }),
      section({ topic: 'K3_stay', body: 'synthetic stay 60 days de', stayDays: 60, scope: { credentialCode: 'DE' } }),
      section({ topic: 'K3_stay', body: 'synthetic stay 15 days', stayDays: 15, scope: { ruleClass: 'visa_exemption_15' } }),
      section({ topic: 'K1_visa', body: 'synthetic visa on arrival 15 days', stayDays: 15, scope: { ruleClass: 'visa_on_arrival_15' } }),
      section({ topic: 'K1_visa', body: 'synthetic bilateral rule stays separate', stayDays: null, scope: { ruleClass: 'bilateral_separate' } }),
      section({ topic: 'K2_document', body: 'synthetic identity card is a different credential', scope: { documentKind: 'identity_card' }, stayDays: null }),
      section({ topic: 'Z3_transit', body: 'synthetic airside transit unchanged', scope: { routeKind: 'airside', ruleClass: 'transit_airside' }, stayDays: null }),
      section({ topic: 'Z1_funds', body: '', evidence: 'missing', stayDays: null, scope: { ruleClass: 'additional_funds' } }),
    ],
  })
}

function thailandChanged(): CareSnapshot {
  const marker = `synthetic stay 30 days from 2026-09-15 ${STOCK_PROTECTION_MARKER}`
  return snapshot({
    version: 'synthetic-30',
    sections: thailandBaseline().sections.map((item) => {
      const sixty = item.scope.ruleClass === 'visa_exemption_60'
      if (item.topic === 'K1_visa' && sixty) {
        return {
          ...item,
          body: `synthetic exemption class 30 from 2026-09-15 not every exemption ${STOCK_PROTECTION_MARKER}`,
          stayDays: 30,
          effectiveFrom: '2026-09-15',
          stockProtection: STOCK_PROTECTION_MARKER,
        }
      }
      if (item.topic === 'K3_stay' && sixty) {
        return { ...item, body: marker, stayDays: 30, effectiveFrom: '2026-09-15', stockProtection: STOCK_PROTECTION_MARKER }
      }
      return item
    }),
  })
}

test('6+4 topics stay separated and the dry-run never authorizes', () => {
  assert.deepEqual(CORE_TOPICS, ['K1_visa', 'K2_document', 'K3_stay', 'K4_health', 'K5_forms', 'K6_minors'])
  assert.deepEqual(ADDITIONAL_TOPICS, ['Z1_funds', 'Z2_onward_ticket', 'Z3_transit', 'Z4_customs'])
  assert.equal(TECHNICAL_ATTEMPT_BOUND, 3)
  const baseline = thailandBaseline()
  const before = canonicalSourceBytes(baseline)
  const decision = run(baseline, thailandChanged())
  assert.deepEqual(canonicalSourceBytes(baseline), before)
  assert.equal(decision.authorization, 'none')
  assert.equal(decision.legalQualification, 'not_claimed')
  assert.equal(decision.selectedSuccessor, null)
  assert.equal(decision.artificialExtension, false)
  assert.equal(decision.scheduler, 'not_installed')
  assert.equal(decision.persistence, 'not_persisted')
  assert.equal(decision.durableOriginalStore, 'not_proven')
  assert.equal(decision.writes, 'none')
  assert.equal(decision.activation, 'forbidden')
  assert.equal(decision.everyExemptionClassLocked, false)
  for (const topic of ['K1_visa', 'K3_stay'] as const) {
    for (const credential of ['CH', 'DE'] as const) {
      if (topic === 'K1_visa' && credential === 'DE') continue
      const item = finding(decision, topic, 'visa_exemption_60', credential)
      assert.equal(item?.disposition, 'locked')
      assert.equal(item?.renewedExpiresAt, null)
      assert.equal(item?.historicalOriginalPreserved, true)
      assert.notEqual(item?.baselineDigest, item?.observedDigest)
    }
  }
  assert.equal(finding(decision, 'K1_visa')?.stockProtection, STOCK_PROTECTION_MARKER)
  assert.equal(finding(decision, 'K3_stay', 'visa_exemption_60', 'CH')?.stockProtection, STOCK_PROTECTION_MARKER)
  assert.ok(finding(decision, 'K3_stay', 'visa_exemption_60', 'CH')?.reasons.includes('legal_text_change'))
  assert.equal(finding(decision, 'K3_stay', 'visa_exemption_15')?.disposition, 'unchanged_not_authorized')
  assert.equal(finding(decision, 'K1_visa', 'visa_on_arrival_15')?.disposition, 'unchanged_not_authorized')
  assert.equal(finding(decision, 'K1_visa', 'bilateral_separate')?.disposition, 'unchanged_not_authorized')
  for (const topic of ['K2_document', 'K4_health', 'K5_forms'] as const) {
    assert.equal(finding(decision, topic)?.disposition, 'unchanged_not_authorized')
  }
  assert.equal(finding(decision, 'K6_minors')?.disposition, 'not_applicable_recorded')
  assert.equal(decision.findings.find((item) => item.topic === 'K2_document' && item.documentKind === 'ordinary_passport')?.disposition, 'unchanged_not_authorized')
  assert.equal(decision.findings.find((item) => item.documentKind === 'identity_card')?.disposition, 'unchanged_not_authorized')
  assert.equal(finding(decision, 'Z3_transit', 'transit_airside')?.routeKind, 'airside')
  assert.equal(finding(decision, 'Z3_transit', 'transit_airside')?.disposition, 'unchanged_not_authorized')
  assert.equal(finding(decision, 'Z1_funds', 'additional_funds')?.disposition, 'hint_open')
  assert.equal(decision.findings.some((item) => item.disposition === 'locked' && item.ruleClass !== 'visa_exemption_60'), false)
})

test('a 60 to 30 change without stock protection locks only that scope', () => {
  const observed = thailandChanged()
  const stripped = snapshot({
    ...observed,
    sections: observed.sections.map((item) => item.topic === 'K3_stay' && item.scope.ruleClass === 'visa_exemption_60'
      ? { ...item, body: 'synthetic stay 30 days', stockProtection: null }
      : item),
  })
  const decision = run(thailandBaseline(), stripped)
  const stay = finding(decision, 'K3_stay')
  assert.equal(stay?.disposition, 'locked')
  assert.ok(stay?.reasons.includes('stock_protection_missing'))
  assert.equal(stay?.stockProtection, null)
  assert.equal(finding(decision, 'K3_stay', 'visa_exemption_15')?.disposition, 'unchanged_not_authorized')
  assert.equal(decision.everyExemptionClassLocked, false)
  assert.equal(decision.authorization, 'none')
})

test('changing every exemption class is reported and still not authorized', () => {
  const observed = snapshot({
    sections: thailandBaseline().sections.map((item) =>
      (item.topic === 'K1_visa' || item.topic === 'K3_stay') && item.scope.ruleClass.startsWith('visa_')
        ? { ...item, body: `${item.body} changed` }
        : item),
  })
  const decision = run(thailandBaseline(), observed)
  assert.equal(decision.everyExemptionClassLocked, true)
  assert.equal(decision.authorization, 'none')
  assert.equal(decision.legalQualification, 'not_claimed')
  assert.equal(finding(decision, 'K2_document')?.disposition, 'unchanged_not_authorized')
})

test('text, table and link changes lock only the named topic', () => {
  const baseline = snapshot({
    sections: [
      section({ topic: 'K1_visa', kind: 'text', body: 'synthetic visa text' }),
      section({ topic: 'K5_forms', kind: 'table', body: 'fee | 0 | currency cited' }),
      section({ topic: 'K5_forms', kind: 'link', body: 'https://example.invalid/form', scope: { credentialCode: 'DE' } }),
      section({ topic: 'K2_document', body: 'synthetic passport unchanged' }),
    ],
  })
  const text = run(baseline, snapshot({
    sections: baseline.sections.map((item) => item.topic === 'K1_visa' ? { ...item, body: 'synthetic visa text changed' } : item),
  }))
  assert.equal(finding(text, 'K1_visa')?.disposition, 'locked')
  assert.ok(finding(text, 'K1_visa')?.reasons.includes('legal_text_change'))
  assert.equal(finding(text, 'K2_document')?.disposition, 'unchanged_not_authorized')
  const table = run(baseline, snapshot({
    sections: baseline.sections.map((item) => item.kind === 'table' ? { ...item, body: 'fee | 30 | currency cited' } : item),
  }))
  assert.equal(finding(table, 'K5_forms')?.disposition, 'locked')
  assert.ok(finding(table, 'K5_forms')?.reasons.includes('legal_table_change'))
  assert.equal(finding(table, 'K1_visa')?.disposition, 'unchanged_not_authorized')
  const link = run(baseline, snapshot({
    sections: baseline.sections.map((item) => item.kind === 'link' ? { ...item, body: 'https://example.invalid/other-form' } : item),
  }))
  assert.equal(finding(link, 'K5_forms', 'visa_exemption_60', 'DE')?.disposition, 'locked')
  assert.ok(finding(link, 'K5_forms', 'visa_exemption_60', 'DE')?.reasons.includes('legal_link_change'))
  assert.equal(finding(link, 'K5_forms')?.disposition, 'unchanged_not_authorized')
})

test('BMEIA theme asset timestamps stay neutral and other links do not', () => {
  const sql = readFileSync(join(root, 'scripts/db/official-truth-at-source-v3/bmeia-theme-assets-v3.function.sql'), 'utf8')
  assert.ok(sql.includes(BMEIA_CSS_ASSET_PATTERN))
  assert.ok(sql.includes(BMEIA_JS_ASSET_PATTERN))
  assert.match(sql, /css_old<>4 OR css_new<>4 OR js_old<>15 OR js_new<>15/)
  const assets = (stamp: string, extra = '') => [
    ...[1, 2, 3, 4].map((index) => `<link rel="stylesheet" href="/typo3conf/ext/theme_bmeia/Resources/Public/CSS/theme${index}.css?${stamp}">`),
    ...Array.from({ length: 15 }, (_, index) => `<script src="/typo3conf/ext/theme_bmeia/Resources/Public/JS/app${index}.js?${stamp}">`),
    extra,
  ].join('\n')
  const before = assets('1111111111')
  const after = assets('2222222222')
  assert.equal(assetTimestampNeutral(before, after), true)
  assert.equal(assetTimestampNeutral(before, before), false)
  assert.equal(assetTimestampNeutral(assets('1111111111', '<a href="https://example.invalid/id">'), assets('2222222222', '<a href="https://example.invalid/id-next">')), false)
  const baseline = snapshot({ assets: before, sections: [section({ body: 'synthetic legal text' }), section({ topic: 'K2_document', body: 'synthetic document' })] })
  const neutral = run(baseline, snapshot({ ...baseline, assets: after, retrievedAt: retrievedNext }))
  assert.ok(neutral.warnings.includes('asset_timestamp_only'))
  assert.equal(neutral.findings.every((item) => item.disposition === 'unchanged_not_authorized'), true)
  assert.equal(neutral.authorization, 'none')
  const withLegal = run(baseline, snapshot({
    ...baseline,
    assets: after,
    retrievedAt: retrievedNext,
    sections: baseline.sections.map((item) => item.topic === 'K3_stay' ? { ...item, body: 'synthetic legal text changed' } : item),
  }))
  assert.equal(finding(withLegal, 'K3_stay')?.disposition, 'locked')
  assert.equal(finding(withLegal, 'K2_document')?.disposition, 'unchanged_not_authorized')
  const linked = run(baseline, snapshot({
    ...baseline,
    assets: assets('2222222222', '<a href="https://example.invalid/changed">'),
    retrievedAt: retrievedNext,
  }))
  assert.ok(linked.warnings.includes('unclassified_asset_change'))
  assert.equal(linked.findings.every((item) => item.disposition === 'locked'), true)
  const single = '<link rel="stylesheet" href="/typo3conf/ext/theme_bmeia/Resources/Public/CSS/theme.css?1111111111">'
  assert.equal(assetTimestampNeutral(single, single.replace('1111111111', '2222222222')), false)
})

test('repetition is idempotent and does not extend a validity', () => {
  const baseline = snapshot({ sections: [section(), section({ topic: 'K1_visa', body: 'synthetic visa' })] })
  const observed = snapshot({ ...baseline, retrievedAt: retrievedNext })
  const first = run(baseline, observed)
  const second = run(baseline, observed)
  assert.deepEqual(first, second)
  assert.equal(first.findings.every((item) => item.disposition === 'unchanged_not_authorized'), true)
  assert.equal(first.findings.every((item) => item.validUntil === future && item.renewedExpiresAt === null), true)
  const relabeled = run(baseline, snapshot({ ...observed, version: 'synthetic-60-label' }))
  assert.ok(relabeled.warnings.includes('version_label_differs'))
  assert.equal(relabeled.findings.every((item) => item.disposition === 'unchanged_not_authorized'), true)
  assert.notEqual(sourceDigest(baseline), sourceDigest(snapshot({ ...observed, version: 'synthetic-60-label' })))
  const extended = run(baseline, snapshot({
    ...observed,
    sections: observed.sections.map((item) => ({ ...item, validUntil: '2027-01-31T00:00:00.000Z' })),
  }))
  assert.equal(extended.findings.every((item) => item.disposition === 'locked'), true)
  assert.ok(extended.findings.every((item) => item.reasons.includes('artificial_extension_refused')))
  assert.equal(extended.findings.every((item) => item.validUntil === future && item.renewedExpiresAt === null), true)
})

test('a race keeps both digests and selects no successor', () => {
  const baseline = thailandBaseline()
  const thirty = thailandChanged()
  const fortyFive = snapshot({
    ...thirty,
    sections: thirty.sections.map((item) => item.topic === 'K3_stay' && item.scope.ruleClass === 'visa_exemption_60' && item.scope.credentialCode === 'CH'
      ? { ...item, body: `synthetic stay 45 ${STOCK_PROTECTION_MARKER}`, stayDays: 45 }
      : item),
  })
  const forward = run(baseline, thirty, { concurrent: [fortyFive, thirty] })
  const reverse = run(baseline, thirty, { concurrent: [thirty, fortyFive] })
  assert.equal(forward.decisionDigest, reverse.decisionDigest)
  assert.equal(forward.selectedSuccessor, null)
  const conflicted = finding(forward, 'K3_stay')
  assert.equal(conflicted?.disposition, 'locked')
  assert.equal(conflicted?.observedDigest, null)
  assert.ok(conflicted?.reasons.includes('conflict'))
  assert.equal(finding(forward, 'K3_stay', 'visa_exemption_15')?.disposition, 'unchanged_not_authorized')
  assert.equal(finding(forward, 'K3_stay', 'visa_exemption_60', 'DE')?.disposition, 'locked')
  assert.notEqual(finding(forward, 'K3_stay', 'visa_exemption_60', 'DE')?.observedDigest, null)
})

test('returning to the historical bytes does not clear a prior lock', () => {
  const baseline = thailandBaseline()
  const changed = run(baseline, thailandChanged())
  const stay = finding(changed, 'K3_stay')
  assert.ok(stay)
  const bytes = canonicalSourceBytes(baseline)
  const again = run(baseline, baseline, {
    priorLocks: [{ scopeKey: stay.scopeKey, topic: 'K3_stay', historicalOriginalDigest: stay.baselineDigest }],
  })
  assert.deepEqual(canonicalSourceBytes(baseline), bytes)
  assert.equal(sha(Buffer.from(bytes).toString('utf8')), sha(Buffer.from(canonicalSourceBytes(baseline)).toString('utf8')))
  const kept = finding(again, 'K3_stay')
  assert.equal(kept?.disposition, 'locked')
  assert.ok(kept?.reasons.includes('return_does_not_clear'))
  assert.equal(kept?.baselineDigest, stay.baselineDigest)
  assert.equal(kept?.renewedExpiresAt, null)
  assert.equal(finding(again, 'K3_stay', 'visa_exemption_15')?.disposition, 'unchanged_not_authorized')
  assert.equal(again.authorization, 'none')
})

test('expiry, missing core evidence and an unknown scope stay fail-closed', () => {
  const baseline = snapshot({
    sections: [
      section({ validUntil: '2026-11-01T00:00:00.000Z' }),
      section({ topic: 'K6_minors', body: 'synthetic minor rule', evidence: 'cited' }),
      section({ topic: 'K2_document', body: 'synthetic passport' }),
    ],
  })
  const expired = run(baseline, snapshot({ ...baseline, retrievedAt: retrievedNext }))
  assert.equal(finding(expired, 'K3_stay')?.disposition, 'locked')
  assert.ok(finding(expired, 'K3_stay')?.reasons.includes('expired'))
  assert.equal(finding(expired, 'K3_stay')?.validUntil, '2026-11-01T00:00:00.000Z')
  assert.equal(finding(expired, 'K2_document')?.disposition, 'unchanged_not_authorized')
  const missing = run(baseline, snapshot({
    ...baseline,
    retrievedAt: retrievedNext,
    sections: baseline.sections.map((item) => item.topic === 'K6_minors' ? { ...item, evidence: 'missing', body: '' } : item),
  }))
  assert.equal(finding(missing, 'K6_minors')?.disposition, 'locked')
  assert.ok(finding(missing, 'K6_minors')?.reasons.includes('missing_evidence'))
  assert.equal(finding(missing, 'K2_document')?.disposition, 'unchanged_not_authorized')
  const contradicted = run(baseline, snapshot({
    ...baseline,
    retrievedAt: retrievedNext,
    sections: baseline.sections.map((item) => item.topic === 'K2_document'
      ? { ...item, evidence: 'not_applicable', body: 'synthetic contradiction against the cited passport rule' }
      : item),
  }))
  assert.equal(finding(contradicted, 'K2_document')?.disposition, 'locked')
  assert.ok(finding(contradicted, 'K2_document')?.reasons.includes('contradiction'))
  assert.equal(finding(contradicted, 'K6_minors')?.disposition, 'unchanged_not_authorized')
  const bare = run(baseline, snapshot({
    ...baseline,
    retrievedAt: retrievedNext,
    sections: baseline.sections.map((item) => item.topic === 'K6_minors' ? { ...item, evidence: 'not_applicable', body: 'too short' } : item),
  }))
  assert.equal(finding(bare, 'K6_minors')?.disposition, 'locked')
  const territories = snapshot({
    sourceId: 'territory-synthetic',
    sections: [
      section({ body: 'synthetic hong kong', scope: { destinationCode: 'CN-HK', ruleClass: 'ordinary_entry' } }),
      section({ body: 'synthetic macao', scope: { destinationCode: 'CN-MO', ruleClass: 'ordinary_entry' } }),
    ],
  })
  const onlyMacao = run(territories, snapshot({
    ...territories,
    retrievedAt: retrievedNext,
    sections: [
      section({ body: 'synthetic macao changed', scope: { destinationCode: 'CN-MO', ruleClass: 'ordinary_entry' } }),
      section({ body: 'synthetic china is not hong kong', scope: { destinationCode: 'CN', ruleClass: 'ordinary_entry' } }),
    ],
  }))
  assert.equal(onlyMacao.findings.find((item) => item.destinationCode === 'CN-HK')?.disposition, 'locked')
  assert.ok(onlyMacao.findings.find((item) => item.destinationCode === 'CN-HK')?.reasons.includes('missing_evidence'))
  assert.equal(onlyMacao.findings.find((item) => item.destinationCode === 'CN-MO')?.disposition, 'locked')
  assert.equal(onlyMacao.findings.find((item) => item.destinationCode === 'CN')?.reasons.includes('unbound_scope'), true)
  assert.equal(onlyMacao.authorization, 'none')
})

test('technical retries stay bounded and source unavailability locks the source', () => {
  const baseline = snapshot({ sections: [section(), section({ topic: 'K4_health', body: 'synthetic health' })] })
  const observed = snapshot({ ...baseline, retrievedAt: retrievedNext, sections: baseline.sections.map((item) => item.topic === 'K3_stay' ? { ...item, body: 'changed' } : item) })
  const pending = evaluateSourceCareDryRun({
    checkedAt, baseline, concurrent: [], priorLocks: [],
    attempts: [{ outcome: 'technical_disturbance', snapshot: null }, { outcome: 'technical_disturbance', snapshot: null }],
  })
  assert.equal(pending.retry, 'pending')
  assert.equal(pending.findings.every((item) => item.disposition === 'not_reproven'), true)
  assert.equal(pending.authorization, 'none')
  const third = evaluateSourceCareDryRun({
    checkedAt, baseline, concurrent: [], priorLocks: [],
    attempts: [
      { outcome: 'technical_disturbance', snapshot: null },
      { outcome: 'technical_disturbance', snapshot: null },
      retrieved(observed),
    ],
  })
  assert.equal(finding(third, 'K3_stay')?.disposition, 'locked')
  assert.equal(finding(third, 'K4_health')?.disposition, 'unchanged_not_authorized')
  const ignored = evaluateSourceCareDryRun({
    checkedAt, baseline, concurrent: [], priorLocks: [],
    attempts: [
      { outcome: 'technical_disturbance', snapshot: null },
      { outcome: 'technical_disturbance', snapshot: null },
      { outcome: 'technical_disturbance', snapshot: null },
      retrieved(observed),
    ],
  })
  assert.equal(ignored.retry, 'exhausted')
  assert.equal(ignored.attemptsIgnoredBeyondBound, 1)
  assert.equal(ignored.findings.every((item) => item.reasons.includes('technical_retry_exhausted')), true)
  assert.equal(ignored.sourceDigestObserved, null)
  const unavailable = evaluateSourceCareDryRun({
    checkedAt, baseline, concurrent: [], priorLocks: [],
    attempts: [{ outcome: 'technical_disturbance', snapshot: null }, { outcome: 'unavailable', snapshot: null }, retrieved(observed)],
  })
  assert.equal(unavailable.findings.every((item) => item.reasons.includes('source_unavailable')), true)
  assert.equal(unavailable.sourceDigestObserved, null)
  assert.equal(unavailable.authorization, 'none')
  const duplicate = evaluateSourceCareDryRun({
    checkedAt, baseline: snapshot({ sections: [section(), section()] }), attempts: [retrieved(baseline)], concurrent: [], priorLocks: [],
  })
  assert.equal(duplicate.inputAccepted, false)
  assert.equal(duplicate.authorization, 'none')
  assert.equal(duplicate.legalQualification, 'not_claimed')
})

test('scope keys keep credentials, documents, routes and territories apart', () => {
  const direct = section()
  const other = section({ scope: { credentialCode: 'DE', documentKind: 'identity_card', routeKind: 'transit', destinationCode: 'CN-HK' } })
  assert.notEqual(scopeKey(direct.scope, direct.topic), scopeKey(other.scope, other.topic))
  assert.equal(scopeKey(other.scope, other.topic).startsWith('CN-HK|DE|identity_card|transit|'), true)
})

test('existing source-bound renewal and monitor wiring stay untouched', () => {
  const renewal = readFileSync(join(root, 'lib/readiness/official-truth-product-v3/monitor/source-bound-renewal.ts'), 'utf8')
  assert.match(renewal, /return fail\('source_changed_or_unavailable'\)/)
  assert.match(renewal, /return fail\('legal_expiry'\)/)
  assert.match(renewal, /A fresh source observation is not an extension/)
  assert.equal(renewal.includes('official-truth-source-care-6-4'), false)
  const blocked = checkSourceBoundRenewal({} as ReviewedFact, {} as SourceRenewalCheck)
  assert.equal(blocked.status, 'unavailable')
  assert.equal(blocked.expiresAt, null)
  const monitor = join(root, 'lib/readiness/official-truth-product-v3/monitor')
  for (const file of readdirSync(monitor)) {
    if (!file.endsWith('.ts')) continue
    assert.equal(readFileSync(join(monitor, file), 'utf8').includes('official-truth-source-care-6-4'), false)
  }
  const self = readFileSync(new URL('./dry-run.ts', import.meta.url), 'utf8')
  assert.equal(/cron\.schedule|CREATE TABLE|INSERT INTO|pg_net|child_process/.test(self), false)
  assert.equal(self.includes('official-truth-50-pass-import'), false)
})
