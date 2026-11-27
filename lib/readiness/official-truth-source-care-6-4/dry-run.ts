// Manuelle RESEARCH_ONLY-Dry-run-Warnung für die Quellenpflege 6+4.
// Kein Scheduler, kein Schreibweg, keine Erneuerungsautorisierung.
// Die geschützte V3/BG1-V8/MA1-Basis bleibt ausserhalb dieses Moduls.
// Eine positive Ausgabe gibt es nicht: fehlende Belege bleiben offen.
import 'server-only'
import { createHash } from 'node:crypto'

export const CORE_TOPICS = Object.freeze([
  'K1_visa',
  'K2_document',
  'K3_stay',
  'K4_health',
  'K5_forms',
  'K6_minors',
] as const)

export const ADDITIONAL_TOPICS = Object.freeze([
  'Z1_funds',
  'Z2_onward_ticket',
  'Z3_transit',
  'Z4_customs',
] as const)

export const TECHNICAL_ATTEMPT_BOUND = 3
export const STOCK_PROTECTION_MARKER = 'entry_before_effective_keeps_granted_duration'
export const BMEIA_OFFICIAL_URL = 'https://www.bmeia.gv.at/oeb-bern/reise-nach-oesterreich/einreise-und-aufenthalt/wie-stelle-ich-einen-antrag/'

// Dieselben POSIX-Muster wie official_v3_at_production_private.bmeia_theme_assets_v3.
// Die SQL-Funktion faltet den ganzen Theme-Pfad. Diese Dry-run-Prüfung tut das nicht:
// Pfad und Dateiname müssen identisch bleiben, nur der zehnstellige Query-Zeitstempel
// darf abweichen, und nur auf genau dieser BMEIA-URL.
export const BMEIA_CSS_ASSET_PATTERN = '(<link[[:space:]]+rel="stylesheet"[[:space:]]+href=")/typo3conf/ext/theme_bmeia/Resources/Public/CSS/[A-Za-z0-9._-]+[.]css([?][0-9]{10})?(")'
export const BMEIA_JS_ASSET_PATTERN = '(<script[[:space:]]+src=")/typo3conf/ext/theme_bmeia/Resources/Public/JS/[A-Za-z0-9._-]+[.]js([?][0-9]{10})?(")'

export type CoreTopic = (typeof CORE_TOPICS)[number]
export type AdditionalTopic = (typeof ADDITIONAL_TOPICS)[number]
export type CareTopic = CoreTopic | AdditionalTopic
export type SectionKind = 'text' | 'table' | 'link'
export type DocumentKind = 'ordinary_passport' | 'identity_card' | 'travel_document_other'
export type RouteKind = 'direct_entry' | 'transit' | 'airside'
export type EvidenceState = 'cited' | 'missing' | 'not_applicable'
export type StockProtection = 'entry_before_effective_keeps_granted_duration'
export type LegalBasis = Readonly<{
  citation: string
  instrument: string
  scopeKey: string
}>

export type CareScope = Readonly<{
  destinationCode: string
  credentialCode: string
  documentKind: DocumentKind
  routeKind: RouteKind
  ruleClass: string
}>

export type CareSection = Readonly<{
  scope: CareScope
  topic: CareTopic
  kind: SectionKind
  body: string
  stayDays: number | null
  effectiveFrom: string | null
  stockProtection: StockProtection | null
  evidence: EvidenceState
  validUntil: string | null
  legalBasis: LegalBasis | null
}>

export type CareSnapshot = Readonly<{
  sourceId: string
  officialUrl: string
  version: string
  retrievedAt: string
  assets: string
  sections: readonly CareSection[]
  originalBytes: Uint8Array | null
  declaredOriginalDigest: string | null
}>

export type CareAttempt = Readonly<{
  outcome: 'technical_disturbance' | 'retrieved' | 'unavailable'
  snapshot: CareSnapshot | null
}>

export type PriorLock = Readonly<{
  scopeKey: string
  topic: CareTopic
  historicalOriginalDigest: string
}>

export type CareDryRunInput = Readonly<{
  checkedAt: string
  baseline: CareSnapshot
  attempts: readonly CareAttempt[]
  concurrent: readonly CareSnapshot[]
  priorLocks: readonly PriorLock[]
}>

export type TopicDisposition =
  | 'unchanged_not_authorized'
  | 'locked'
  | 'hint_open'
  | 'not_applicable_unqualified'
  | 'not_reproven'
  | 'not_confirmed'

export type TopicFinding = Readonly<{
  scopeKey: string
  destinationCode: string
  credentialCode: string
  documentKind: DocumentKind
  routeKind: RouteKind
  ruleClass: string
  topic: CareTopic
  tier: 'core' | 'additional'
  disposition: TopicDisposition
  reasons: readonly string[]
  baselineDigest: string
  observedDigest: string | null
  historicalOriginalPreserved: true
  stockProtection: StockProtection | null
  validUntil: string | null
  renewedExpiresAt: null
  evidenceConfirmed: false
}>

export type SourceCareDryRun = Readonly<{
  mode: 'manual_dry_run_warning_only'
  authorization: 'none'
  legalQualification: 'not_claimed'
  activation: 'forbidden'
  scheduler: 'not_installed'
  persistence: 'not_persisted'
  durableOriginalStore: 'not_proven'
  writes: 'none'
  selectedSuccessor: null
  artificialExtension: false
  inputAccepted: boolean
  retry: 'not_needed' | 'pending' | 'exhausted'
  attemptsExamined: number
  attemptsIgnoredBeyondBound: number
  sourceDigestBaseline: string | null
  sourceDigestObserved: string | null
  warnings: readonly string[]
  findings: readonly TopicFinding[]
  everyExemptionClassLocked: boolean
  originalExamination: 'not_performed'
  originalBinding: 'absent' | 'mismatch' | 'supplied'
  canonicalDigestIsNotOriginalDigest: true
  confirmedEvidence: false
  kSlotsComplete: boolean
  decisionDigest: string
}>

const DOCUMENT_KINDS = new Set<DocumentKind>(['ordinary_passport', 'identity_card', 'travel_document_other'])
const ROUTE_KINDS = new Set<RouteKind>(['direct_entry', 'transit', 'airside'])
const KINDS = new Set<SectionKind>(['text', 'table', 'link'])
const EVIDENCE = new Set<EvidenceState>(['cited', 'missing', 'not_applicable'])
const TOPICS = new Set<CareTopic>([...CORE_TOPICS, ...ADDITIONAL_TOPICS])
const CORE = new Set<CareTopic>(CORE_TOPICS)

const sha256 = (bytes: Uint8Array): string => createHash('sha256').update(bytes).digest('hex')
const utf8 = (value: string): Uint8Array => new TextEncoder().encode(value)
const isoInstant = (value: string): number | null => {
  if (!/^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}(?:\.\d{3})?Z$/.test(value)) return null
  const parsed = Date.parse(value)
  return Number.isFinite(parsed) ? parsed : null
}
const day = (value: string): boolean => /^\d{4}-\d{2}-\d{2}$/.test(value) && Number.isFinite(Date.parse(`${value}T00:00:00.000Z`))
const destinationOk = (value: string): boolean => /^[A-Z]{2}$/.test(value) || value === 'CN-HK' || value === 'CN-MO'

export function scopeKey(scope: CareScope, topic: CareTopic): string {
  return [
    scope.destinationCode,
    scope.credentialCode,
    scope.documentKind,
    scope.routeKind,
    scope.ruleClass,
    topic,
  ].join('|')
}

export function canonicalSourceBytes(snapshot: CareSnapshot): Uint8Array {
  const sections = [...snapshot.sections].sort((left, right) =>
    scopeKey(left.scope, left.topic).localeCompare(scopeKey(right.scope, right.topic)))
  const lines = [
    'source-care-6-4/1',
    snapshot.sourceId,
    snapshot.officialUrl,
    snapshot.version,
    snapshot.retrievedAt,
    String(utf8(snapshot.assets).byteLength),
    snapshot.assets,
    String(sections.length),
  ]
  for (const section of sections) {
    lines.push(
      scopeKey(section.scope, section.topic),
      section.kind,
      section.stayDays === null ? '-' : String(section.stayDays),
      section.effectiveFrom ?? '-',
      section.stockProtection ?? '-',
      section.evidence,
      section.validUntil ?? '-',
      section.legalBasis ? `${section.legalBasis.instrument}\n${section.legalBasis.citation}\n${section.legalBasis.scopeKey}` : '-',
      String(utf8(section.body).byteLength),
      section.body,
    )
  }
  return utf8(`${lines.join('\n')}\n`)
}

export function originalByteDigest(bytes: Uint8Array): string {
  return sha256(bytes)
}

export function sourceDigest(snapshot: CareSnapshot): string {
  return sha256(canonicalSourceBytes(snapshot))
}

function sectionDigest(section: CareSection): string {
  const lines = [
    'source-care-section/1',
    scopeKey(section.scope, section.topic),
    section.kind,
    section.stayDays === null ? '-' : String(section.stayDays),
    section.effectiveFrom ?? '-',
    section.stockProtection ?? '-',
    section.evidence,
    section.validUntil ?? '-',
    section.legalBasis ? `${section.legalBasis.instrument}\n${section.legalBasis.citation}\n${section.legalBasis.scopeKey}` : '-',
    String(utf8(section.body).byteLength),
    section.body,
  ]
  return sha256(utf8(`${lines.join('\n')}\n`))
}

function pattern(posix: string): RegExp {
  return new RegExp(posix.replaceAll('[[:space:]]', '[ \\t\\n\\r\\f\\v]'), 'g')
}

const CSS_TIMESTAMP = '(<link[[:space:]]+rel="stylesheet"[[:space:]]+href=")(/typo3conf/ext/theme_bmeia/Resources/Public/CSS/[A-Za-z0-9._-]+[.]css)([?][0-9]{10})?(")'
const JS_TIMESTAMP = '(<script[[:space:]]+src=")(/typo3conf/ext/theme_bmeia/Resources/Public/JS/[A-Za-z0-9._-]+[.]js)([?][0-9]{10})?(")'

function assetRefs(value: string, posix: string): { path: string }[] {
  return [...value.matchAll(pattern(posix))].map((match) => ({ path: match[2] ?? '' }))
}

function stripAssetTimestamps(value: string): string {
  return value
    .replace(pattern(CSS_TIMESTAMP), '$1$2$4')
    .replace(pattern(JS_TIMESTAMP), '$1$2$4')
}

export function assetTimestampNeutral(before: string, after: string, officialUrl: string): boolean {
  if (officialUrl !== BMEIA_OFFICIAL_URL || before === after) return false
  const cssBefore = assetRefs(before, CSS_TIMESTAMP)
  const cssAfter = assetRefs(after, CSS_TIMESTAMP)
  const jsBefore = assetRefs(before, JS_TIMESTAMP)
  const jsAfter = assetRefs(after, JS_TIMESTAMP)
  if (cssBefore.length !== 4 || cssAfter.length !== 4 || jsBefore.length !== 15 || jsAfter.length !== 15) return false
  if (cssBefore.some((item, index) => item.path !== cssAfter[index]?.path)) return false
  if (jsBefore.some((item, index) => item.path !== jsAfter[index]?.path)) return false
  return stripAssetTimestamps(before) === stripAssetTimestamps(after)
}

function snapshotError(snapshot: CareSnapshot, seenAt: number | null): string | null {
  if (!/^[a-z0-9-]{1,80}$/.test(snapshot.sourceId)) return 'source_identity'
  if (!snapshot.officialUrl.startsWith('https://') || snapshot.officialUrl.length > 300) return 'source_identity'
  if (!/^[A-Za-z0-9._:-]{1,80}$/.test(snapshot.version)) return 'version_identity'
  const retrieved = isoInstant(snapshot.retrievedAt)
  if (retrieved === null || (seenAt !== null && retrieved > seenAt)) return 'retrieval_clock'
  if (typeof snapshot.assets !== 'string' || utf8(snapshot.assets).byteLength > 20_000) return 'assets'
  if (snapshot.assets.includes('\n>>\n')) return 'assets'
  if (!Array.isArray(snapshot.sections) || snapshot.sections.length < 1 || snapshot.sections.length > 80) return 'sections'
  const keys = new Set<string>()
  for (const section of snapshot.sections) {
    if (!section || typeof section !== 'object') return 'section'
    const scope = section.scope
    if (!scope || !destinationOk(scope.destinationCode) || !/^[A-Z]{2}$/.test(scope.credentialCode)) return 'scope'
    if (!DOCUMENT_KINDS.has(scope.documentKind) || !ROUTE_KINDS.has(scope.routeKind)) return 'scope'
    if (!/^[a-z0-9_]{1,64}$/.test(scope.ruleClass)) return 'scope'
    if (!TOPICS.has(section.topic) || !KINDS.has(section.kind) || !EVIDENCE.has(section.evidence)) return 'section'
    if (section.stayDays !== null && (!Number.isSafeInteger(section.stayDays) || section.stayDays < 0 || section.stayDays > 3650)) return 'stay'
    if (section.effectiveFrom !== null && !day(section.effectiveFrom)) return 'effective_from'
    if (section.stockProtection !== null && section.stockProtection !== STOCK_PROTECTION_MARKER) return 'stock_protection'
    if (section.validUntil !== null && isoInstant(section.validUntil) === null) return 'validity'
    if (typeof section.body !== 'string' || utf8(section.body).byteLength > 8000 || section.body.includes('\0')) return 'body'
    const basis = section.legalBasis
    if (basis !== null && (typeof basis !== 'object' || typeof basis.citation !== 'string' || typeof basis.instrument !== 'string' || typeof basis.scopeKey !== 'string'
      || utf8(basis.citation).byteLength > 500 || utf8(basis.instrument).byteLength > 200 || utf8(basis.scopeKey).byteLength > 300)) return 'legal_basis'
    const key = scopeKey(scope, section.topic)
    if (keys.has(key)) return 'duplicate_scope'
    keys.add(key)
  }
  if (snapshot.originalBytes !== null && (!(snapshot.originalBytes instanceof Uint8Array) || snapshot.originalBytes.byteLength > 1_048_576)) return 'original_bytes'
  if (snapshot.declaredOriginalDigest !== null && !/^[a-f0-9]{64}$/.test(snapshot.declaredOriginalDigest)) return 'original_digest'
  return null
}

function invalid(reason: string): SourceCareDryRun {
  const decision = {
    mode: 'manual_dry_run_warning_only' as const,
    authorization: 'none' as const,
    legalQualification: 'not_claimed' as const,
    activation: 'forbidden' as const,
    scheduler: 'not_installed' as const,
    persistence: 'not_persisted' as const,
    durableOriginalStore: 'not_proven' as const,
    writes: 'none' as const,
    selectedSuccessor: null,
    artificialExtension: false as const,
    inputAccepted: false,
    retry: 'exhausted' as const,
    attemptsExamined: 0,
    attemptsIgnoredBeyondBound: 0,
    sourceDigestBaseline: null,
    sourceDigestObserved: null,
    warnings: Object.freeze([reason]),
    findings: Object.freeze([]),
    everyExemptionClassLocked: false,
    originalExamination: 'not_performed' as const,
    originalBinding: 'absent' as const,
    canonicalDigestIsNotOriginalDigest: true as const,
    confirmedEvidence: false as const,
    kSlotsComplete: false,
    decisionDigest: '',
  }
  return Object.freeze({ ...decision, decisionDigest: digestOf(decision) })
}

function digestOf(decision: Omit<SourceCareDryRun, 'decisionDigest'> & { decisionDigest?: string }): string {
  const body = {
    authorization: decision.authorization,
    legalQualification: decision.legalQualification,
    inputAccepted: decision.inputAccepted,
    retry: decision.retry,
    attemptsExamined: decision.attemptsExamined,
    attemptsIgnoredBeyondBound: decision.attemptsIgnoredBeyondBound,
    sourceDigestBaseline: decision.sourceDigestBaseline,
    sourceDigestObserved: decision.sourceDigestObserved,
    warnings: decision.warnings,
    canonicalDigestIsNotOriginalDigest: decision.canonicalDigestIsNotOriginalDigest,
    confirmedEvidence: decision.confirmedEvidence,
    originalBinding: decision.originalBinding,
    originalExamination: decision.originalExamination,
    kSlotsComplete: decision.kSlotsComplete,
    everyExemptionClassLocked: decision.everyExemptionClassLocked,
    findings: decision.findings.map((finding) => ({
      scopeKey: finding.scopeKey,
      topic: finding.topic,
      disposition: finding.disposition,
      reasons: finding.reasons,
      baselineDigest: finding.baselineDigest,
      observedDigest: finding.observedDigest,
      stockProtection: finding.stockProtection,
      validUntil: finding.validUntil,
    renewedExpiresAt: finding.renewedExpiresAt,
    evidenceConfirmed: finding.evidenceConfirmed,
  })),
}
  return sha256(utf8(JSON.stringify(body)))
}

function exemptionClass(ruleClass: string): boolean {
  return ruleClass.startsWith('visa_exemption') || ruleClass.startsWith('visa_on_arrival')
}

function finish(
  partial: Omit<SourceCareDryRun, 'decisionDigest' | 'everyExemptionClassLocked' | 'mode' | 'authorization' | 'legalQualification' | 'activation' | 'scheduler' | 'persistence' | 'durableOriginalStore' | 'writes' | 'selectedSuccessor' | 'artificialExtension' | 'originalExamination' | 'canonicalDigestIsNotOriginalDigest' | 'confirmedEvidence'> & {
    findings: TopicFinding[]
    warnings: string[]
  },
): SourceCareDryRun {
  const findings = partial.findings
    .map((finding) => Object.freeze({ ...finding, reasons: Object.freeze([...finding.reasons].sort()) }))
    .sort((left, right) => left.scopeKey.localeCompare(right.scopeKey) || left.topic.localeCompare(right.topic))
  const classes = new Set(findings.filter((finding) => exemptionClass(finding.ruleClass)).map((finding) => finding.ruleClass))
  const everyExemptionClassLocked = classes.size > 0 && [...classes].every((ruleClass) =>
    findings.some((finding) => finding.ruleClass === ruleClass && finding.disposition === 'locked'))
  const decision = {
    mode: 'manual_dry_run_warning_only' as const,
    authorization: 'none' as const,
    legalQualification: 'not_claimed' as const,
    activation: 'forbidden' as const,
    scheduler: 'not_installed' as const,
    persistence: 'not_persisted' as const,
    durableOriginalStore: 'not_proven' as const,
    writes: 'none' as const,
    selectedSuccessor: null,
    artificialExtension: false as const,
    inputAccepted: partial.inputAccepted,
    retry: partial.retry,
    attemptsExamined: partial.attemptsExamined,
    attemptsIgnoredBeyondBound: partial.attemptsIgnoredBeyondBound,
    sourceDigestBaseline: partial.sourceDigestBaseline,
    sourceDigestObserved: partial.sourceDigestObserved,
    warnings: Object.freeze([...new Set(partial.warnings)].sort()),
    findings: Object.freeze(findings),
    everyExemptionClassLocked,
    originalExamination: 'not_performed' as const,
    originalBinding: partial.originalBinding,
    canonicalDigestIsNotOriginalDigest: true as const,
    confirmedEvidence: false as const,
    kSlotsComplete: partial.kSlotsComplete,
    decisionDigest: '',
  }
  return Object.freeze({ ...decision, decisionDigest: digestOf(decision) })
}

function baseFinding(section: CareSection, disposition: TopicDisposition, reasons: string[], observedDigest: string | null): TopicFinding {
  return {
    scopeKey: scopeKey(section.scope, section.topic),
    destinationCode: section.scope.destinationCode,
    credentialCode: section.scope.credentialCode,
    documentKind: section.scope.documentKind,
    routeKind: section.scope.routeKind,
    ruleClass: section.scope.ruleClass,
    topic: section.topic,
    tier: CORE.has(section.topic) ? 'core' : 'additional',
    disposition,
    reasons,
    baselineDigest: sectionDigest(section),
    observedDigest,
    historicalOriginalPreserved: true,
    stockProtection: section.stockProtection,
    validUntil: section.validUntil,
    renewedExpiresAt: null,
    evidenceConfirmed: false,
  }
}

function earlierValidity(baseline: string | null, observed: string | null): string | null {
  if (baseline === null) return null
  if (observed === null) return baseline
  const left = isoInstant(baseline)
  const right = isoInstant(observed)
  if (left === null || right === null) return baseline
  return right < left ? observed : baseline
}

function basisMatchesScope(section: CareSection): boolean {
  const basis = section.legalBasis
  if (!basis || basis.citation.trim() === '' || basis.instrument.trim() === '') return false
  return basis.scopeKey === scopeKey(section.scope, section.topic)
}

function bindOriginal(snapshot: CareSnapshot): 'absent' | 'mismatch' | 'supplied' {
  if (snapshot.originalBytes === null || snapshot.declaredOriginalDigest === null) return 'absent'
  return originalByteDigest(snapshot.originalBytes) === snapshot.declaredOriginalDigest ? 'supplied' : 'mismatch'
}

function combineBinding(snapshots: readonly CareSnapshot[]): 'absent' | 'mismatch' | 'supplied' {
  const states = snapshots.map(bindOriginal)
  if (states.includes('mismatch')) return 'mismatch'
  if (states.includes('absent')) return 'absent'
  return snapshots.length > 0 ? 'supplied' : 'absent'
}

export function scopeGroupKey(scope: CareScope): string {
  return [scope.destinationCode, scope.credentialCode, scope.documentKind, scope.routeKind, scope.ruleClass].join('|')
}

function missingSlot(sample: CareSection, topic: CoreTopic): TopicFinding {
  const key = scopeKey(sample.scope, topic)
  return {
    scopeKey: key,
    destinationCode: sample.scope.destinationCode,
    credentialCode: sample.scope.credentialCode,
    documentKind: sample.scope.documentKind,
    routeKind: sample.scope.routeKind,
    ruleClass: sample.scope.ruleClass,
    topic,
    tier: 'core',
    disposition: 'not_confirmed',
    reasons: ['missing_k_slot'],
    baselineDigest: sha256(utf8(`absent\n${key}\n`)),
    observedDigest: null,
    historicalOriginalPreserved: true,
    stockProtection: null,
    validUntil: null,
    renewedExpiresAt: null,
    evidenceConfirmed: false,
  }
}

function addMissingSlots(findings: readonly TopicFinding[], baseline: CareSnapshot): { findings: TopicFinding[]; complete: boolean } {
  const groups = new Map<string, CareSection>()
  const present = new Set<string>()
  for (const section of baseline.sections) {
    groups.set(scopeGroupKey(section.scope), section)
    present.add(scopeKey(section.scope, section.topic))
  }
  const extra: TopicFinding[] = []
  let complete = groups.size > 0
  for (const sample of groups.values()) {
    for (const topic of CORE_TOPICS) {
      const key = scopeKey(sample.scope, topic)
      if (present.has(key)) continue
      complete = false
      if (findings.some((finding) => finding.scopeKey === key && finding.topic === topic)) continue
      extra.push(missingSlot(sample, topic))
    }
  }
  return { findings: [...findings, ...extra], complete }
}

function comparePaired(baseline: CareSection, observed: CareSection, checkedAt: number): TopicFinding {
  const reasons: string[] = []
  const legalFieldsChanged = baseline.kind !== observed.kind
    || baseline.body !== observed.body
    || baseline.stayDays !== observed.stayDays
    || baseline.effectiveFrom !== observed.effectiveFrom
    || baseline.stockProtection !== observed.stockProtection
  if (baseline.kind !== observed.kind) reasons.push('legal_kind_change')
  if (legalFieldsChanged) reasons.push(`legal_${baseline.kind}_change`)
  if (baseline.evidence !== observed.evidence) reasons.push('contradiction')
  if (baseline.validUntil !== observed.validUntil) {
    reasons.push('legal_validity_change')
    const left = baseline.validUntil === null ? null : isoInstant(baseline.validUntil)
    const right = observed.validUntil === null ? null : isoInstant(observed.validUntil)
    if (left !== null && right !== null && right > left) reasons.push('artificial_extension_refused')
    if (baseline.validUntil === null && observed.validUntil !== null) reasons.push('artificial_extension_refused')
  }
  const retainedUntil = earlierValidity(baseline.validUntil, observed.validUntil)
  const retainedInstant = retainedUntil === null ? null : isoInstant(retainedUntil)
  if (retainedInstant !== null && retainedInstant <= checkedAt) reasons.push('expired')
  const durationDecreased = baseline.stayDays !== null && observed.stayDays !== null && observed.stayDays < baseline.stayDays
  if (durationDecreased && (observed.stockProtection !== STOCK_PROTECTION_MARKER || !observed.body.includes(STOCK_PROTECTION_MARKER))) {
    reasons.push('stock_protection_missing')
  }
  if (observed.evidence === 'missing') reasons.push('missing_evidence')
  if (observed.evidence === 'cited' && observed.body.trim().length === 0) reasons.push('missing_evidence')
  if (observed.evidence === 'not_applicable' && !basisMatchesScope(observed)) reasons.push('not_applicable_without_basis')
  let disposition: TopicDisposition = 'unchanged_not_authorized'
  const additionalGapOnly = !CORE.has(observed.topic)
    && reasons.every((reason) => reason === 'missing_evidence')
    && reasons.length > 0
  if (additionalGapOnly) disposition = 'hint_open'
  else if (reasons.length > 0) disposition = 'locked'
  else if (observed.evidence === 'not_applicable') {
    disposition = 'not_applicable_unqualified'
    reasons.push('not_qualified_by_dry_run')
  }
  return {
    ...baseFinding(baseline, disposition, reasons, sectionDigest(observed)),
    stockProtection: durationDecreased && observed.stockProtection === STOCK_PROTECTION_MARKER && observed.body.includes(STOCK_PROTECTION_MARKER)
      ? observed.stockProtection
      : baseline.stockProtection,
    validUntil: retainedUntil,
  }
}

function lockAll(sections: readonly CareSection[], reason: string, observed: ReadonlyMap<string, CareSection> | null): TopicFinding[] {
  return sections.map((section) => {
    const key = scopeKey(section.scope, section.topic)
    const pair = observed?.get(key) ?? null
    const reasons = [reason]
    if (section.evidence === 'missing') reasons.push('missing_evidence')
    return baseFinding(section, 'locked', reasons, pair ? sectionDigest(pair) : null)
  })
}

function revise(finding: TopicFinding, reasons: readonly string[], disposition: TopicDisposition, observedDigest: string | null = finding.observedDigest): TopicFinding {
  return {
    ...finding,
    disposition,
    observedDigest,
    reasons: [...new Set([...finding.reasons, ...reasons])],
    renewedExpiresAt: null,
    evidenceConfirmed: false,
  }
}

function isRetrieved(attempt: CareAttempt): attempt is CareAttempt & { readonly snapshot: CareSnapshot } {
  return attempt.outcome === 'retrieved' && attempt.snapshot !== null
}

function applyPriorLocks(findings: readonly TopicFinding[], priorLocks: readonly PriorLock[]): { findings: TopicFinding[]; warnings: string[] } | string {
  const warnings: string[] = []
  const next: TopicFinding[] = findings.map((finding) => ({ ...finding, reasons: [...finding.reasons] }))
  for (const prior of priorLocks) {
    if (!/^[a-f0-9]{64}$/.test(prior.historicalOriginalDigest) || !TOPICS.has(prior.topic) || !prior.scopeKey.endsWith(`|${prior.topic}`)) {
      return 'prior_lock'
    }
    const index = next.findIndex((item) => item.scopeKey === prior.scopeKey && item.topic === prior.topic)
    if (index < 0) {
      const parts = prior.scopeKey.split('|')
      const documentKind = DOCUMENT_KINDS.has(parts[2] as DocumentKind) ? parts[2] as DocumentKind : 'ordinary_passport'
      const routeKind = ROUTE_KINDS.has(parts[3] as RouteKind) ? parts[3] as RouteKind : 'direct_entry'
      next.push({
        scopeKey: prior.scopeKey,
        destinationCode: parts[0] ?? '',
        credentialCode: parts[1] ?? '',
        documentKind,
        routeKind,
        ruleClass: parts[4] ?? 'unknown_scope',
        topic: prior.topic,
        tier: CORE.has(prior.topic) ? 'core' : 'additional',
        disposition: 'locked',
        reasons: ['unknown_scope'],
        baselineDigest: prior.historicalOriginalDigest,
        observedDigest: null,
        historicalOriginalPreserved: true,
        stockProtection: null,
        validUntil: null,
        renewedExpiresAt: null,
        evidenceConfirmed: false,
      })
      continue
    }
    const current = next[index]!
    const reasons = ['return_does_not_clear']
    if (current.baselineDigest !== prior.historicalOriginalDigest) reasons.push('prior_lock_digest_mismatch')
    next[index] = revise(current, reasons, 'locked')
  }
  return { findings: next, warnings }
}

/** Vergleicht eine gespeicherte Quelle mit einer manuell vorgelegten Beobachtung.
 * Das Ergebnis sperrt nur betroffene Themen, verlängert keine Frist und
 * autorisiert keine Faktversion. Originale bleiben die übergebenen Bytes. */
export function evaluateSourceCareDryRun(input: CareDryRunInput): SourceCareDryRun {
  const checkedAt = isoInstant(input.checkedAt)
  if (checkedAt === null) return invalid('clock')
  const baselineError = snapshotError(input.baseline, checkedAt)
  if (baselineError) return invalid(baselineError)
  if (!Array.isArray(input.attempts) || input.attempts.length < 1 || input.attempts.length > 8) return invalid('attempts')
  if (!Array.isArray(input.concurrent) || input.concurrent.length > 4) return invalid('concurrent')
  if (!Array.isArray(input.priorLocks) || input.priorLocks.length > 80) return invalid('prior_locks')
  const baselineRetrieved = isoInstant(input.baseline.retrievedAt)
  if (baselineRetrieved === null || baselineRetrieved > checkedAt) return invalid('retrieval_clock')

  const examined = input.attempts.slice(0, TECHNICAL_ATTEMPT_BOUND)
  const ignored = input.attempts.length - examined.length
  const baselineDigest = sourceDigest(input.baseline)
  const warnings: string[] = []
  if (ignored > 0) warnings.push('attempts_beyond_bound_ignored')

  const sealed = (
    retry: SourceCareDryRun['retry'],
    sourceDigestObserved: string | null,
    extraWarnings: readonly string[],
    findings: readonly TopicFinding[],
    bindingSnapshots: readonly CareSnapshot[],
  ): SourceCareDryRun => {
    const slotted = addMissingSlots(findings, input.baseline)
    const originalBinding = combineBinding([input.baseline, ...bindingSnapshots])
    let nextFindings = slotted.findings
    const bindingWarnings = [...extraWarnings]
    if (originalBinding === 'mismatch') {
      bindingWarnings.push('original_digest_mismatch')
      nextFindings = [
        ...lockAll(input.baseline.sections, 'original_digest_mismatch', null),
        ...slotted.findings.filter((finding) => finding.reasons.includes('missing_k_slot')),
      ]
    } else if (originalBinding === 'absent') bindingWarnings.push('original_binding_absent')
    else bindingWarnings.push('original_bytes_supplied_not_an_official_examination')
    const prior = applyPriorLocks(nextFindings, input.priorLocks)
    if (typeof prior === 'string') return invalid(prior)
    return finish({
      inputAccepted: true,
      retry,
      attemptsExamined: examined.length,
      attemptsIgnoredBeyondBound: ignored,
      sourceDigestBaseline: baselineDigest,
      sourceDigestObserved,
      originalBinding,
      kSlotsComplete: slotted.complete,
      warnings: [...warnings, ...bindingWarnings, ...prior.warnings],
      findings: prior.findings,
    })
  }

  const unavailable = examined.some((attempt) => attempt.outcome === 'unavailable')
  const retrievedAll = examined.filter(isRetrieved)
  const disturbances = examined.filter((attempt) => attempt.outcome === 'technical_disturbance').length
  if (!unavailable && retrievedAll.length === 0 && disturbances === examined.length && input.attempts.length < TECHNICAL_ATTEMPT_BOUND) {
    return sealed('pending', null, ['technical_retry_pending'], input.baseline.sections.map((section) =>
      baseFinding(section, 'not_reproven', ['technical_retry_pending'], null)), [])
  }
  if (unavailable || retrievedAll.length === 0) {
    const reason = unavailable ? 'source_unavailable' : 'technical_retry_exhausted'
    return sealed(unavailable ? 'not_needed' : 'exhausted', null, [reason], lockAll(input.baseline.sections, reason, null), [])
  }

  const observations: CareSnapshot[] = []
  for (const attempt of retrievedAll) {
    const observed = attempt.snapshot
    const observedError = snapshotError(observed, checkedAt)
    if (observedError) return sealed('not_needed', null, [observedError], lockAll(input.baseline.sections, 'observation_rejected', null), [])
    if (observed.sourceId !== input.baseline.sourceId || observed.officialUrl !== input.baseline.officialUrl) {
      return sealed('not_needed', sourceDigest(observed), ['source_identity'], lockAll(input.baseline.sections, 'source_identity', null), [observed])
    }
    observations.push(observed)
  }
  const retrievedTimes = observations.map((observed) => isoInstant(observed.retrievedAt))
  const stale = retrievedTimes.some((time, index) => time === null || time <= baselineRetrieved || (index > 0 && time <= (retrievedTimes[index - 1] ?? time)))
  if (stale) {
    return sealed('not_needed', null, ['stale_or_replay'], lockAll(input.baseline.sections, 'stale_or_replay', null), observations)
  }
  if (observations.some((observed) => observed.version !== input.baseline.version)) warnings.push('version_label_differs')

  const findings: TopicFinding[] = []
  for (const section of input.baseline.sections) {
    const key = scopeKey(section.scope, section.topic)
    const pairs = observations.map((observed) => observed.sections.find((item) => scopeKey(item.scope, item.topic) === key) ?? null)
    if (pairs.some((pair) => pair === null)) {
      findings.push(baseFinding(section, 'locked', ['missing_evidence'], null))
      continue
    }
    const present = pairs.filter((pair): pair is CareSection => pair !== null)
    let merged = comparePaired(section, present[0]!, checkedAt)
    const digests = new Set(present.map((pair) => sectionDigest(pair)))
    for (const pair of present.slice(1)) {
      const next = comparePaired(section, pair, checkedAt)
      merged = revise(merged, [...next.reasons], merged.disposition === 'locked' || next.disposition === 'locked' ? 'locked' : next.disposition, merged.observedDigest)
    }
    if (digests.size > 1) {
      merged = revise(merged, ['conflict', 'earlier_contradiction_not_cleared', ...[...digests].sort().map((digest) => `conflict_digest_${digest}`)], 'locked', null)
    } else if (present.some((pair) => sectionDigest(pair) !== sectionDigest(section)) && present.some((pair) => sectionDigest(pair) === sectionDigest(section))) {
      merged = revise(merged, ['earlier_contradiction_not_cleared'], 'locked', null)
    }
    findings.push(merged)
  }
  for (const observed of observations) {
    for (const section of observed.sections) {
      const key = scopeKey(section.scope, section.topic)
      if (input.baseline.sections.some((baseline) => scopeKey(baseline.scope, baseline.topic) === key)) continue
      if (findings.some((finding) => finding.scopeKey === key)) continue
      const absent = sha256(utf8(`absent\n${key}\n`))
      findings.push({
        ...baseFinding(section, 'locked', ['unbound_scope'], sectionDigest(section)),
        baselineDigest: absent,
        validUntil: null,
        stockProtection: null,
      })
    }
  }

  let compared = findings
  const assetStates = observations.map((observed) => {
    if (observed.assets === input.baseline.assets) return 'unchanged' as const
    return assetTimestampNeutral(input.baseline.assets, observed.assets, input.baseline.officialUrl) ? 'timestamp' as const : 'changed' as const
  })
  if (assetStates.includes('timestamp') && !assetStates.includes('changed')) warnings.push('asset_timestamp_only')
  if (assetStates.includes('changed') || new Set(observations.map((observed) => stripAssetTimestamps(observed.assets))).size > 1) {
    warnings.push('unclassified_asset_change')
    compared = compared.map((finding) => revise(finding, ['unclassified_asset_change'], 'locked'))
  }

  for (const rival of input.concurrent) {
    const rivalError = snapshotError(rival, checkedAt)
    if (rivalError) {
      warnings.push('concurrent_rejected')
      compared = compared.map((finding) => revise(finding, ['observation_rejected'], 'locked', null))
      break
    }
    if (rival.sourceId !== input.baseline.sourceId || rival.officialUrl !== input.baseline.officialUrl) {
      warnings.push('source_identity')
      compared = compared.map((finding) => revise(finding, ['source_identity'], 'locked', null))
      break
    }
    const rivalByKey = new Map<string, CareSection>(rival.sections.map((section: CareSection) => [scopeKey(section.scope, section.topic), section]))
    compared = compared.map((finding) => {
      const rivalSection = rivalByKey.get(finding.scopeKey)
      const rivalDigest = rivalSection ? sectionDigest(rivalSection) : null
      const observedDigests = observations.map((observed) => {
        const match = observed.sections.find((section) => scopeKey(section.scope, section.topic) === finding.scopeKey)
        return match ? sectionDigest(match) : null
      })
      if (observedDigests.every((digest) => digest === rivalDigest)) return finding
      const digests = [...observedDigests, rivalDigest].filter((digest): digest is string => digest !== null).sort()
      return revise(finding, ['conflict', ...digests.map((digest) => `conflict_digest_${digest}`)], 'locked', null)
    })
  }

  return sealed('not_needed', sourceDigest(observations[observations.length - 1]!), [], compared, observations)
}
